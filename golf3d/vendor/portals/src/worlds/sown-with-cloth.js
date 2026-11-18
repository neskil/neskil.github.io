// SOWN WITH CLOTH: a windy dry valley drawn in pencil, charcoal and chalk on grey card as the presentation sheet for
// three temporary works of cloth of OUR OWN: a field sown with turquoise cloth blades, a cone of violet ribbons strung
// from a leaning rock tower (the hero, src/parts/sown-with-cloth.js), and an emerald banner 900 m long flown from a
// steel frame on a snow horn. Nothing is wrapped or covered; no lettering; no people. post.flat = 1: colours are
// written as they are shown (no inverse tone map anywhere).
//
// +Z is the course up the valley, the valley floor is y 0, port is +X on the way up. THE WIND (the lead's S1) comes
// from up the valley and to STARBOARD, 32 degrees off the valley's axis, and blows down it toward port: the summit's
// cloth, the squall, the rift, the cloth's shade and the field's gust fronts answer it (the cone's ribbons keep their
// own belly, see the departures). The arrangement (the crew lead's rulings L to R and, over them, S1 to S10 of
// lead-note-6): the tower and its cone at (110, 0, 610), left of the first sight line; the horn, a snow peak of four
// aretes 400 m high with a lopsided outline, its point at (-260, 400, 1060), right of it and near. THE RING (22 m in
// radius, its portal 19.8) stands on the horn's crest at (-287, 454, 1072) on two raking legs, facing down the wind,
// held by five stays; there is no boom. THE BANNER'S HEAD IS GATHERED UP INTO THE RING (S5): lashed in six roped
// swags round the lower rim, so the emerald pours out from under the opening. It pours for its first 403 m, then
// flies all but level some 241 m up (U1), OVER THE CONE'S STARBOARD HALF (its line passes 104 m to starboard of the
// tower's axis, 71 m above the tower's top) and on 150 m past the cone's stakes toward the field, swinging to
// starboard in its far part; 900 m in all.
// THE SKY IS THE BARE CARD (S3). ONE SQUALL stands behind the summit, 1,200 m up the wind: one upright sheet with a
// place, a compact charcoal mass LAID IN STROKES at the hand's one slant (sw_laid: the weight is read once for each
// stroke, so the mass ends in stroke tips; nothing is drawn where no stroke falls), a hard torn top with chalk on
// its heads, its rain hatched under its base only. In it, beside the wind's line through the ring, ONE RIFT of bare
// card and chalk, and from the two sides of the rift's upper half eight ruled chalk rays, 260 to 560 m long, rising
// outward above the ring and its stays. No other squall stands anywhere (T3).
// THE LAND IN THREE STEPS BY NEARNESS (sw_px of a thing's own view depth): far, the outline alone; middle, a firm
// line and light hatching on the lee sides; near, crisp line, charcoal lees laid in strokes, chalk on lit snow.
// THE ROUTE (T1) is 1,191 m in 46 s and ENDS AT THE SUMMIT RING; it never turns away from the horn. 166 m straight
// and low over the field (24 m/s); over the headland a bend to port onto a line into the near bay (the gaze on the
// headland, then up on the fan and, inside the cone, on the collar where the ribbons gather: the fan from its point,
// the tower under it, the emerald above through it), round the rock 96 m from its axis (T2) and out by the far bay
// onto the wind's own line BENEATH THE BANNER. Then, each a stretch of places: UNDER, climbing at about 38 degrees
// beneath the cloth's line and closing on it, the gaze tipped up the cloth's UNDER FACE (U1): the cloth comes down
// the upper frame from overhead and narrows along its own line to the ring, the horn and the ring in the lower half,
// the near cranes in the gap between; BESIDE THE POUR, out past the port hem and up beside it, the
// hem 21 m off on the starboard hand, the valley and its plots falling away below; OVER the hem and 170 m up the
// cloth, 26 m over its own line, to THE RING at the road's end, against the rift, the last 45 m level.
// Every beat sits at a PLACE (world coordinates below); its u is derived from the path, never listed.
//
// LAWFUL READINGS OF THE VIEW (owner's term D), all in shaders and all named here: the pixel's footprint (fwidth /
// dFdx of world position, stroke and cloth coordinates) to filter tooth, hatching, row lines, drill lanes and crayon
// grain, to choose the hatching's spacing and the pitch of the laid charcoal strokes (three to six pixels at any
// distance), to keep a torn edge one pixel wide, and for THE FIELD'S FOOTPRINT FILTER (S6: where a pixel can no
// longer hold a blade, each drilled row's strip comes in under its own blades until the rows have given way to the
// even drawn tone of the cloth with pencil row lines over it); a slope taken across neighbouring pixels (fwidth of a
// fold coordinate, of a cloth's across coordinate, of the metres in from a hem and along a cloth, of a rope turn's
// coordinate, of a stroke coordinate and of a tone along it) for the pencil fold line, the cloth's width in pixels,
// the banner's hem band and its lines, the EYELETS (S7: at their true size, drawn only while over two pixels across,
// no floor), the counted rope turns of a neck, the width of a charcoal stroke in pixels and the tone at a stroke's
// own centre line; the direction from a thing to the eye (cameraPosition - P) for the rim line of ruled tubes and to
// turn a ruled cable's or a chalk ray's ribbon to the eye; the projection matrix with a thing's own view depth
// (sw_px: a thousandth of the frame's height there) so thin marks never thin under about 1.5 pixels, so a far blade
// is stilled, for THE LAND'S THREE STEPS BY NEARNESS (S3) and so a CRANE whose whole span would stand under about a
// fortieth of the frame's height is not drawn (R8: a bird or nothing, never a white sliver). RULED CABLES are cut
// to the greater of their own width and 1.6 pixels by fwidth of the distance across the ribbon (cableMat). Nothing
// reads the camera object, a seed's value, a still's position or the wall clock. Whatever follows the traveller (the
// window of near blades, the cranes' stations, the dust devil, the gaze up the cloth) takes the ROUTE'S OWN POINT at
// u, computed from the path. THE CRANES' CLEAR AIR (owner's term E, R8, S9) is kept by place: every bird's place is
// last of all held 14.5 m from every point of the flown line near it (keepOff: the route is a fixed line of places
// in the world); a bird within the cloth's width keeps 30 m and more under its line until the run up the cloth
// begins, and 16 m and more over it on the run.
//
// VARIATIONS (seeded once at build; the three cloth colours never change). SHEET: grey card #DED6C4, buff #E2D6BC with
// more chalk, slate #CDCFCA charcoal-led: by ctx.vary.hour when the visitor has set one (day; dawn or golden; night),
// otherwise dealt from a stream of its own (about a half, a quarter, a quarter). WIND by seed: steady, gusty, gale (gap,
// width and lay of the gust fronts; the strain on ribbons and banner). CLOUD by seed: the nine held clouds alone, or
// a tenth held up the valley to port, or a tenth low and flat-based over the port ridge; with it the height and
// weight of the squall; the squall's heads from a stream of its own. RARE (ctx.vary.rare): the dust devil, a pencil
// scribble 40 m high walking the field 45 m to starboard, laying a spiral of pale blades behind it.
// COST at detail 1: 420k to 431k triangles (438k at the top density), 54 draw calls, no lights, no textures made.
// update() allocates nothing: it sets uniforms, 12 cup matrices, 9 or 10 cloud matrices and the 40 cranes' places and
// banks (each a pure function of the route's u; by the world's clock the banks rock a little and the near birds rise
// and fall 2.4 m on the climb).
// DEPARTURES from the brief, stated. By the lead's rulings L to R, S1 to S10 and T1 to T8, which overrule the brief's
// space and journey: the wind's quarter, the places of tower and peak, the horn's height (400 m) and its snow, the
// squall, its rift and rays, the route (1,191 m in 46 s ending at the summit ring; the brief: 1,490 m ending down
// the valley), the banner 900 m long and 80 m at the hoist, gathered into the ring and flown over the cone, as one
// cloth with pipe folds and swags at the hoist, three long folds with four middle folds to each, waves and (beyond
// 420 m) a slow roll, the ring 22 m in radius and its portal 19.8 (the brief: 7) with the chalk laid in tapering
// strokes between them and a drawn lens of ruled circles and radial strokes over the veil's outer two thirds (T6:
// held until 48 m of route are left, gone by 36; the next world shows from 34 m; the engine's halo is off: the lens
// and the laid chalk stand for it), the guys' anchors drawn large, a far valley and uplands behind the horn, nine
// sown plots, the sheet's lighter card (T6b), nine large drawn clouds held in their places (T4; the brief: drifting
// at 6 m/s). AGAINST THE LEAD'S NOTE 7, stated plainly: the ring stands 441 m above the near bay and 697 m from it
// in plan, so no route from the cone to the ring without a turn can keep to 28 degrees: the climb holds about 38
// (40.4 at the steepest) and the whole route is 1,191 m, not 1,250 to 1,400; beneath the cloth, for the first 180 m
// out of the cone, the bare card is 57 to 65 percent of the frame (T4: 55 at most) and the cloth itself a twentieth
// (the horn, the ring, the squall and its rays are in the frame all the way); the run over the cloth is 170 m; the
// dry river lies between the field and the cone and the stakes come down to its bank on the port hand, so the plot
// beyond the river is sown on the starboard hand only (T5) and the lorries and reels keep the headland; the ribbons
// of the cone keep the belly they had (toward astern and starboard) while everything of the summit turned with the
// wind. Our own, stated: the banner pours and then flies level instead of sinking on one even line; the free cloth
// opens out from 80 m at the hoist to 110 m and 116 m and narrows to 84 m at the fork (the brief: narrowing from the
// hoist); the field's far end, behind the entry, is still being sown and ends drill pass by drill pass, and its
// sides and the cone's end fray the same way; the window of real blades holds 14,400 + 4,000 blades on a 1.1 by
// 1.25 m lattice over 220 by 90 m (the brief: about 45,000 over 220 by 190 m; beyond 90 m a blade is under a
// hundredth of the frame and the drilled strips stand for it); the two bays are cut where the route pierces the
// cone, 35 and 112 m wide at the stakes (30 m and more between the ribbons at the eye, T2); half the cranes leave
// the wheel about the tower and climb with the route, beside it under the cloth and beside the pour (the starboard
// ones between the traveller and the hem), then over the hem and the cloth, 16 m and more over its line, opening out
// before the summit; the banner's shade is charcoal RUBBED into the card under the cloth's own line, as wide as the
// cloth, lighter past the cone, with a band beside the port hem where the cloth passes close over the horn; the
// banner's under face is laid in its shade tone with charcoal in the folds' beds; the forked tail's notch is 110 m
// deep; two far ranges are drawn, each an outline alone; the horn carries no bed lines (the tower keeps its own, one
// firm line at each bed plane) but pencil contours down its aretes, rib crests and rock steps; the dry river has a
// starboard channel and an old channel through the cone; the near cranes are drawn twice life size and the two
// roped feet of each bay 1.8 times; a cloud's marks are laid on one upright sheet that faces the route's own point;
// the stroke-by-stroke laying of the finest hatching is left out (owner's term C allows it): all hatching is
// complete from the first frame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as core from '../kit/core.js';
import { buildHero, makeStyle, PALETTE, STYLE_GLSL, STYLE_VERT_GLSL, CLOTH_GLSL, LIGHT_DIR, ruledBox, ruledTube, ruledRing } from '../parts/sown-with-cloth.js';

const { clamp, lerp, smoothstep } = core;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---- the places of the world (metres) -------------------------------------------------------------------------
const FIELD = { x0: -210, x1: 210, z0: -40, z1: 380, rowDX: 1.1, siteDZ: 1.25, stalk: 1.2, bladeL: 0.9, bladeW: 0.18 };
const TOWER = [110, 0, 610];
// THE SUMMIT FRAME'S PLACE (R3, S5) is the foot of the ring's own axis on the crest: the ring stands over it and the
// cloth's head is lashed round its lower rim; the horn's own point stands 30 m from it along the summit crest.
const SUMMIT = [-287.4, 400, 1072.4];
const RING = { c: [-287.4, 454, 1072.4], r: 22 };
// THE WIND (S1) comes from up the valley and to starboard and blows down it toward port, 32 degrees off the valley's
// axis. The summit has a frame of its own, the wind's: +Z' is straight up the wind, +X' is to port of that. The
// ring, its legs, the stays and the banner's line are laid out in that frame and turned into the world.
const WIND_OFF = -32 * Math.PI / 180;
const UPWIND = [Math.sin(WIND_OFF), Math.cos(WIND_OFF)];                 // straight up the wind, in plan (x, z)
const toLocal = (x, z, out) => { const dx = x - SUMMIT[0], dz = z - SUMMIT[2]; out[0] = dx * UPWIND[1] - dz * UPWIND[0]; out[1] = dx * UPWIND[0] + dz * UPWIND[1]; return out; };
const toWorldX = (lx, lz) => SUMMIT[0] + lx * UPWIND[1] + lz * UPWIND[0];
const toWorldZ = (lx, lz) => SUMMIT[2] - lx * UPWIND[0] + lz * UPWIND[1];
// THE JOURNEY ENDS AT THE RING (R1): the route comes up the cloth, onto the wind's own line, and leaves through the ring
// heading straight up the wind, so the ring stands square across the wind.
const HEAD = UPWIND;                                                     // the route's last heading, in plan (x, z)
const RING_YAW = WIND_OFF;
// the opening itself (the portal) is 2.2 m inside the steel's inner face: between them the chalk is laid in strokes
const PORTAL_R = RING.r - 2.2, REVEAL = 34;
// THE HORN (the crew lead's M1, Q1): a sharp peak of four aretes, 400 m, its point 30 m to starboard of the ring. Two
// aretes (343 and 163 degrees of azimuth about the point, measured from +X toward +Z) leave the point across the wind
// as the summit crest the frame stands on, gently for 37 m and then steeply; one (273 degrees) comes down toward the
// entry and under the last 40 m of the route, dividing the snow face seen from the field (lit, to port) from the lee
// face under the banner; the fourth (93 degrees) falls away behind. Between the aretes the faces are hollow, 50 to 58 degrees in
// the upper half. DROP and CREST: metres below the point at r metres from it along an arete.
const PEAK = { x: -260.2, z: 1059.7, y: SUMMIT[1] };
// the valley's own up and port (the horn's back is told by it, whatever the wind does)
const NORTH = [Math.sin(25 * Math.PI / 180), Math.cos(25 * Math.PI / 180)];
const ARETE_DEG = [273, 343, 453, 523];
const ARETES = ARETE_DEG.map((d) => d * Math.PI / 180);
// THE HORN'S SIZE (Q1): the tables below are written for a peak 512 m high; the horn stands 400 m high on a foot some
// 380 m in radius, so every radius about the point is divided by HORN_R and every height under it multiplied by HORN_H
const HORN_R = 0.74, HORN_H = 400 / 512;
const DROP = [[0, 0], [60, 77], [140, 177], [220, 272], [300, 360], [360, 418], [410, 460], [450, 490], [480, 507], [505, 512]];
const CREST = [[0, 0], [25, 14], [50, 34], [90, 78], [150, 152], [220, 242], [300, 330], [360, 390], [410, 438], [455, 480], [490, 504], [515, 512]];
// THE OUTLINE IS NOT SYMMETRICAL (P5). The port crest (arete 1, the left skyline from the field) leaves the point gently
// and runs down long and even; the starboard crest (arete 3, the right skyline) is the short
// steep one: it drops away from the very point (twice as steeply as the port crest: the summit is a LEANING POINT),
// carries a SHOULDER 92 to 152 m out, 145 to 156 m under the point, falls steeply again below it and is down on the
// valley floor 430 m out, where the port crest is still a third of the way up; the entry arete (0) is the long one.
// (The shoulder stands on the starboard side.)
const CREST_S = [[0, 0], [25, 27], [50, 68], [78, 122], [92, 145], [152, 156], [174, 190], [215, 286], [270, 380], [320, 446], [360, 484], [396, 504], [430, 512]];
const ARETE_TABLE = [DROP, CREST, DROP, CREST_S];
function tableAt(T, r) {
  if (r >= T[T.length - 1][0]) return T[T.length - 1][1];
  for (let i = 1; i < T.length; i++) if (r <= T[i][0]) { const a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1]) * (r - a[0]) / (b[0] - a[0]); }
  return 0;
}
// the horn's smooth form at a place: [height, how far across its face 0..1 (0 and 1 on the aretes), which face 0..3]
function hornAt(x, z, out) {
  const dx = (x - PEAK.x) / HORN_R, dz = (z - PEAK.z) / HORN_R, r = Math.hypot(dx, dz);
  let th = Math.atan2(dz, dx); while (th < ARETES[0]) th += Math.PI * 2; while (th >= ARETES[0] + Math.PI * 2) th -= Math.PI * 2;
  let i = 0; while (i < 3 && th >= ARETES[i + 1]) i++;
  const a0 = ARETES[i], a1 = i === 3 ? ARETES[0] + Math.PI * 2 : ARETES[i + 1], t = (th - a0) / (a1 - a0);
  const d0 = tableAt(ARETE_TABLE[i], r), d1 = tableAt(ARETE_TABLE[(i + 1) & 3], r);
  const hollow = 115 * (1 - Math.exp(-r / 230)) * Math.pow(Math.max(Math.sin(Math.PI * t), 0), 0.85);
  out[0] = PEAK.y - HORN_H * (d0 + (d1 - d0) * t * t * (3 - 2 * t) + hollow); out[1] = t; out[2] = i;
  return out;
}
// the route (the crew lead's R1 and R2 and the ninth review; laid out by lines and arcs in plan, shots/sown-with-cloth/
// tmp/r10/route.mjs): entry level at 9 m over the field, down to 6.5 m; over the far headland a bend to port of 16
// degrees onto a line aimed at the tower, through the near bay and STRAIGHT AT THE TOWER under the ribbons; a swerve to
// starboard of 85 m radius round the rock (64 m from its axis at 32 m) and out by the starboard bay at (-68, 91, 666);
// then OPEN AIR: (a) 184 m straight, climbing to 200 m; (b) a turn to port of 100 m radius, beside the pour and under
// its level for its first half, rising to 305 m in its second; (c) 11 m straight and a turn to port of 120 m radius
// that pass over the port hem at 355 m, onto a line 14 degrees off the wind's from (-378, 355, 733): 222 m up the
// cloth's port half, closing on its middle, to 449 m; a wide arc of 250 m radius onto the wind's own line; (d) the
// ring, the last 70 m straight and level at 454 m
// (setroute.py ry=454 yEdge=94 yT0=200 yTm=253 yT1=305 yC0=355 yA=386 yB=432 yC=449 del=14 cLen=222 endLen=70 R2=100 R3=120 psi=45 writes it here).
const ROUTE = [
  [0, 9, 140], [0, 9, 170], [0, 9, 200], [0, 7.2, 253], [0, 6.5, 306], [2, 6.6, 337.4],
  [7.8, 6.7, 368.3], [14.9, 7.9, 398.9], [21.9, 12.4, 429.5], [29, 17, 460.2], [34.2, 22, 483.2], [36.7, 32.6, 506.7],
  [35.1, 43.7, 530.3], [29.6, 53.4, 553.3], [20.4, 65.6, 575], [10.8, 82.2, 596.5], [3.8, 101.5, 619.1], [-2.1, 121.4, 642],
  [-7.3, 140.1, 665], [-12, 158.4, 688.2], [-16.6, 176.8, 711.4], [-21.3, 195.1, 734.6], [-26.5, 213.5, 757.7], [-32.3, 231.8, 780.6],
  [-39.3, 250.2, 803.1], [-47.7, 268.5, 825.3], [-57.9, 286.9, 846.6], [-69.9, 305.2, 866.9], [-82.4, 323.6, 887], [-94.8, 342, 907.1],
  [-109.1, 361.3, 925.9], [-126.5, 380.9, 941.8], [-145.8, 398.9, 955.5], [-166, 413.4, 967.9], [-186.5, 424.5, 979.6], [-207, 434.6, 991.4],
  [-227, 443.5, 1004.1], [-245.9, 450.3, 1018.2], [-262.7, 454, 1034.9], [-271.5, 454, 1047], [-279.5, 454, 1059.7], [-287.4, 454, 1072.4],
];

// the banner's centre line by place, in the summit's frame (M2, S1, S5): 900 m of cloth gathered into the ring's lower
// rim, streaming down the wind over the cone's starboard half. It leaves the ring all but level for some 80 m (so
// the last 60 m of the route, level through the ring, have the cloth 26 to 33 m under them), pours down the lee air
// at some 29 degrees from 80 to 403 m out (the route flies up it over the cloth's port half, 26 m over its line) and
// flies on all but level, 244 m up at 500 m out and 237 m at the forked tail: 190 m down in all; past 640 m it
// swings to starboard (bannerLX). s = metres from the hoist.
// (The same line is written out in sw_bannerContact in the part, for the contact shade.)
const BANNER = { L: 900, wHoist: 80, wMid: 110, wFar: 116, wTail: 84, fork: 110 };
// S5: THE CLOTH IS GATHERED UP INTO THE RING. Its head is lashed in six roped swags round the lower half of the ring's
// rim (HOIST: the radius of the lashed edge about the ring's middle, the half angle it takes up to either hand of the
// rim's foot, the metres over which the gathered trough opens out into the flying sheet); its own line leaves the
// rim's foot.
const HOIST = { r: RING.r + 4.4, half: 1.25, open: 46 };
const HOIST_Y = RING.c[1] - HOIST.r;
const softp = (x) => 22 * Math.log(1 + Math.exp(x / 22));
// U1: THE POUR CARRIES ON DOWN TO ITS KNEE AT 403 m (it was 330), so the level run flies 40 m lower: 244 m up where the
// route comes out from the cone beneath it (71 m above the tower's top; it was 111), the under face that much nearer the eye.
const KNEE = 403;
const bannerY = (s) => { const q = Math.max(s, 0); return HOIST_Y - 0.55 * ((softp(q - 80) - softp(-80)) - (softp(q - KNEE) - softp(-KNEE))) - 2.2 * (1 - Math.exp(-q / 4)) - 0.012 * q; };
// in plan the cloth leaves the ring straight down the summit's wind and, past the cone, swings a little to starboard
// into the valley's own wind: its tail flies some 66 m to starboard of its first line.
const bannerLX = (s) => -24.3 * (Math.log(1 + Math.exp((s - 640) / 90)) - Math.log(1 + Math.exp(-640 / 90)));
function bannerLine(s, out) { const lx = bannerLX(s); return out.set(toWorldX(lx, -s), bannerY(s), toWorldZ(lx, -s)); }

export default {
  id: 'sown-with-cloth',
  name: 'Sown with Cloth',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Christo and Jeanne-Claude, 1935 to 2020 and 1935 to 2009',
  weirdness: 0.35,
  media: ['air', 'open'],
  async build(ctx) {
    const vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1;
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const stream = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    // ---- variations: the SHEET by hour, WIND and CLOUD by seed ---------------------------------------------
    // the SHEET: when the visitor has set an hour the brief's mapping holds; when the hour is any, the sheet is dealt from a
    // stream of its own (the grey card about half the time, the buff and the slate about a quarter each)
    const dealt = stream('sheet')();
    const sheetName = (vary.hour === 'dawn' || vary.hour === 'golden') ? 'buff' : vary.hour === 'night' ? 'slate' : vary.hour === 'day' ? 'grey' : dealt < 0.5 ? 'grey' : dealt < 0.75 ? 'buff' : 'slate';
    const SHEET = { grey: { card: '#DED6C4', pencil: 1.0, lee: 1.0, snow: 228, chalk: 1.0 }, buff: { card: '#E2D6BC', pencil: 0.92, lee: 0.9, snow: 182, chalk: 1.5 }, slate: { card: '#CDCFCA', pencil: 0.8, lee: 1.3, snow: 236, chalk: 0.85 } }[sheetName];
    const vr = stream('variation');
    const windName = vr.pick(['gusty', 'gusty', 'steady', 'gale']);
    const cloudName = vr.pick(['clear', 'bank', 'ridges']);
    const rare = !!vary.rare;
    const WIND = { steady: { k: 0.6, gap: 68, lay: 0.45, width: 9 }, gusty: { k: 1.0, gap: 76, lay: 1.0, width: 13 }, gale: { k: 1.45, gap: 150, lay: 1.0, width: 46 } }[windName];
    const palette = PALETTE.slice(); palette[0] = SHEET.card;
    const style = makeStyle({ palette });
    const U = style.uniforms;
    U.uPencil.value = SHEET.pencil;

    const scene = new THREE.Scene();
    const ringOpen = { value: 1 };            // 1 while the exit's opening is sure to hold its chalk veil
    scene.background = new THREE.Color(SHEET.card);

    // ---- the route ---------------------------------------------------------------------------------------
    const path = core.makePath(ROUTE);
    const mU = 1 / path.length;                             // one metre of route, in u
    const NS = 900, rs = new Float32Array((NS + 1) * 3);
    { const p = V3(0, 0, 0); for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, p); rs[i * 3] = p.x; rs[i * 3 + 1] = p.y; rs[i * 3 + 2] = p.z; } }
    // the route's own point at u (no allocation): what every follower of the traveller is given
    const routeAt = (u, out) => {
      const f = clamp(u, 0, 1) * NS, i = Math.min(Math.floor(f), NS - 1), t = f - i, o = i * 3;
      return out.set(rs[o] + (rs[o + 3] - rs[o]) * t, rs[o + 1] + (rs[o + 4] - rs[o + 1]) * t, rs[o + 2] + (rs[o + 5] - rs[o + 2]) * t);
    };
    // the u at which the route is nearest a place (a beat is a place; its u comes from the path)
    const uNear = (x, y, z) => { let b = 1e18, bi = 0; for (let i = 0; i <= NS; i++) { const dx = rs[i * 3] - x, dy = rs[i * 3 + 1] - y, dz = rs[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; bi = i; } } return bi / NS; };
    const uAtZ = (z) => { for (let i = 0; i <= NS; i++) if (rs[i * 3 + 2] >= z) return i / NS; return 1; };
    // nearest route sample in plan: [distance, route height there]
    const nearXZ = (x, z, res) => { let b = 1e18, bi = 0; for (let i = 0; i <= NS; i += 2) { const dx = rs[i * 3] - x, dz = rs[i * 3 + 2] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } res[0] = Math.sqrt(b); res[1] = rs[bi * 3 + 1]; return res; };
    await ctx.yield();

    // ---- the hero: the ribbon cone, translated only ----------------------------------------------------------
    const heroRoute = [];
    for (let i = 0; i <= NS; i += 3) if (Math.hypot(rs[i * 3] - TOWER[0], rs[i * 3 + 2] - TOWER[2]) < 300) heroRoute.push(V3(rs[i * 3] - TOWER[0], rs[i * 3 + 1], rs[i * 3 + 2] - TOWER[2]));
    const hero = await buildHero(ctx, { palette, detail, wind: windName, style, route: heroRoute, ground: false, sheet: false, bayNearWidth: 35, bayFarWidth: 112 });
    hero.object.position.set(TOWER[0], TOWER[1], TOWER[2]);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    U.uConePos.value.set(TOWER[0], TOWER[1], TOWER[2]);
    const collarW = hero.anchors.collar.clone().add(hero.object.position);
    const gazeW = hero.anchors.gaze.clone().add(hero.object.position);
    const uBay = uNear(hero.anchors.bayNearCrossing.x + TOWER[0], hero.anchors.bayNearCrossing.y, hero.anchors.bayNearCrossing.z + TOWER[2]);
    // where the tower is abeam: the route's nearest place to its axis in plan (96 m off)
    let uAbeam = 0; { let bd = 1e18; for (let i = 0; i <= NS; i++) { const d = Math.hypot(rs[i * 3] - TOWER[0], rs[i * 3 + 2] - TOWER[2]); if (d < bd) { bd = d; uAbeam = i / NS; } } }
    const uFarBay = uNear(hero.anchors.bayFarCrossing.x + TOWER[0], hero.anchors.bayFarCrossing.y, hero.anchors.bayFarCrossing.z + TOWER[2]);
    // the places of the climb (T1), each a place in the world and its u from the path. From the cone the route climbs
    // beneath the cloth's own line toward the horn: uBeside, where it comes out past the port hem in plan; uOver, where
    // it passes back over the port hem, above the cloth.
    // routeS: the route's own place along the cloth (metres down the wind from the hoist) at each sample.
    const halfAt = (sb) => lerp(lerp(BANNER.wHoist / 2, BANNER.wMid / 2, smoothstep(40, 260, sb)) + (BANNER.wFar - BANNER.wMid) / 2 * smoothstep(380, 620, sb), BANNER.wTail / 2, smoothstep(680, BANNER.L - BANNER.fork, sb));
    let uBeside = 1, uOver = 1;
    const routeS = new Float32Array(NS + 1);
    { const l = [0, 0];
      for (let i = 0; i <= NS; i++) {
        toLocal(rs[i * 3], rs[i * 3 + 2], l); routeS[i] = -l[1];
        if (i < Math.round(uFarBay * NS)) continue;
        const lat = l[0] - bannerLX(-l[1]), h = halfAt(-l[1]);
        if (uBeside === 1) { if (lat > h) uBeside = i / NS; }
        else if (uOver === 1) { if (lat < h) uOver = i / NS; }
      } }
    await ctx.yield();
    // ---- THE LAND: one height function, two meshes of card material, their pencil contours ------------------------
    const noise = ctx.noise, loc2 = [0, 0], hq = [0, 0, 0];
    // THE HORN'S ROCK (M1, and the fourth review): twenty-six ribs run down the fall lines, each a sharp crest between
    // round-bedded couloirs, some strong and some slight, dying out on the aretes and toward the point; and bands of rock
    // step the whole peak, a flatter shoulder and then a riser of some ten metres, strongest on the aretes, so the skyline
    // is notched and no outline of it is a smooth curve. hornRib: -0.6 in a couloir's bed to 1 on a rib's crest.
    const NRIB = 26, TAU = Math.PI * 2;
    const ribQ = (th, r) => (th / TAU) * NRIB + 0.55 * noise.n2(Math.cos(th) * 2.1 + 9, Math.sin(th) * 2.1 + r * 0.0045);
    const ribStrong = (k) => { const v = Math.sin((((k % NRIB) + NRIB) % NRIB) * 12.9898 + 1.7) * 43758.5453; return 0.3 + 0.7 * (v - Math.floor(v)); };
    const ribEnv = (r, t) => smoothstep(22, 160, r) * Math.sqrt(Math.max(Math.sin(Math.PI * t), 0));
    const hornRib = (x, z, t) => {
      const dx = (x - PEAK.x) / HORN_R, dz = (z - PEAK.z) / HORN_R, r = Math.hypot(dx, dz), q = ribQ(Math.atan2(dz, dx), r), k = Math.floor(q), f = 1 - Math.abs(2 * (q - k) - 1);
      return Math.min(2 * ribStrong(k) * f * f - 0.6, 1) * ribEnv(r, t);
    };
    const stepQ = (th, r) => r / 54 + 0.9 * noise.n2(Math.cos(th) * 1.7 + 3, Math.sin(th) * 1.7 + 5);
    const hornStep = (x, z, t) => {
      const dx = (x - PEAK.x) / HORN_R, dz = (z - PEAK.z) / HORN_R, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx), q = stepQ(th, r), s = q - Math.floor(q);
      const saw = s < 0.78 ? s / 0.78 : (1 - s) / 0.22;
      // THE SUMMIT CREST IS BROKEN (the fifth review): from 10 m to 130 m under the point smaller steps of rock, 18 m from
      // lip to lip with a riser of 3 to 6 m, notch the crest the frame stands on and the faces under the ring
      const q2 = r / 18 + 1.3 * noise.n2(Math.cos(th) * 2.6 + 11, Math.sin(th) * 2.6 + 2), s2 = q2 - Math.floor(q2);
      const saw2 = s2 < 0.7 ? s2 / 0.7 : (1 - s2) / 0.3;
      const small = (saw2 - 0.5) * (2.6 + 5 * (1 - Math.sqrt(Math.max(Math.sin(Math.PI * t), 0)))) * smoothstep(9, 30, r) * smoothstep(135, 85, r);
      return (saw - 0.5) * (6 + 14 * (1 - Math.sqrt(Math.max(Math.sin(Math.PI * t), 0)))) * smoothstep(28, 80, r) * smoothstep(520, 420, r) + small;
    };
    function landH(x, z) {
      // THE FAR VALLEY (P1): behind the horn the valley runs on for a mile, bending to port, its ridges closing in and
      // rising to a head wall of snow peaks 650 to 880 m high; and behind each ridge the land does not fall back to the floor but runs out as an upland of lower rolling
      // ridges toward the far ranges, so from the air no part of the sheet under the skyline is bare
      const far = smoothstep(1900, 3300, z), xv = x - 300 * far * far;
      const side = xv < 0 ? -1 : 1;
      const hw = (450 + 38 * noise.n2(z * 0.0016, side * 3.1)) * (1 - 0.96 * far * far);
      const a = Math.abs(xv) - hw;
      let h = 0;
      if (a > -90) {                                                    // the hatched ridges, 120 to 260 m, and their scree fans
        const Hc = (190 + 70 * noise.n2(z * 0.0011 + 5, side * 7.7)) * (1 + 2.4 * far);
        const t = a / 330, up = smoothstep(0, 1, t), down = smoothstep(1.0, 1.95, t);
        const back = clamp(0.3 + 0.34 * noise.fbm2(x * 0.0013 + 9, z * 0.0013, 3) + 0.2 * smoothstep(1.9, 4.5, t), 0.1, 0.95);
        h = Hc * up * (1 - down * (1 - back)) * (1 + 0.24 * noise.fbm2(x * 0.006, z * 0.006, 3)) * (1 + 0.17 * noise.n2(z * 0.0085 + side * 11, x * 0.0016 + 4)) + 13 * smoothstep(-90, 40, a) * (1 - up) * (0.6 + 0.4 * noise.n2(z * 0.02, side));
      }
      h *= smoothstep(2400, 2150, Math.abs(x)) * smoothstep(-1500, -1300, z) * smoothstep(3600, 3350, z);
      toLocal(x, z, loc2);
      const bs = -loc2[1];
      if (h > 60 && bs > 60 && bs < BANNER.L + 60) {                    // clear air under the cloth, by place (M2): 60 m and more under its lowest reach
        const lat = Math.abs(loc2[0] - bannerLX(bs));
        if (lat < 260) h = Math.min(h, bannerY(bs) - 40 - 80 * smoothstep(60, 260, bs) + lat * 0.25);
      }
      if (Math.hypot(x - PEAK.x, z - PEAK.z) < 640 * HORN_R) {                   // the horn stands on the valley's head
        hornAt(x, z, hq);
        h = Math.max(h, hq[0] + HORN_H * (12 * hornRib(x, z, hq[1]) + hornStep(x, z, hq[1])) + 2.5 * noise.n2(x * 0.021, z * 0.021) * smoothstep(60, 200, PEAK.y - hq[0]));
      }
      return Math.max(h, 0);
    }
    const margin = (x, z) => smoothstep(2380, 2100, Math.abs(x)) * smoothstep(-1500, -1280, z) * smoothstep(3590, 3300, z);
    function landTone(x, y, z, nl, steep, out) {
      const m = margin(x, z), rise = smoothstep(4, 90, y);
      const patch = smoothstep(-0.25, 0.55, noise.fbm2(x * 0.0042 + 3, z * 0.0042, 3));
      const inField = smoothstep(-225, -205, x) * smoothstep(225, 205, x) * smoothstep(-55, -35, z) * smoothstep(395, 375, z);
      const t0 = m * (0.42 + 0.3 * patch * (1 - 0.7 * inField) + 0.2 * rise);
      const t1 = m * 0.42 * smoothstep(0.3, 0.75, noise.fbm2(x * 0.0021 + 40, z * 0.0021, 2)) * (0.25 + 0.75 * rise);
      const leeK = smoothstep(0.62, 0.02, nl) * smoothstep(0.02, 0.2, steep) * m;                 // the drawn lee: starboard and under sides
      // a hollow is drawn whichever way it faces: where the land lies below the mean of its neighbours 45 m off (the
      // gullies between the spurs of the ridges) the pencil is kept and one charcoal mass is laid
      let hollow = 0;
      if (y > 12 && steep > 0.02) hollow = smoothstep(1.5, 9, (landH(x - 45, z) + landH(x + 45, z) + landH(x, z - 45) + landH(x, z + 45)) / 4 - landH(x, z)) * m;
      // the valley's shaded side and every broad flank that rises toward the light (so faces away from it), by the
      // land's own fall over 300 m: a charcoal mass on it, laid in patches, and pencil under it (Q2)
      const bigLee = y > 6 ? smoothstep(0.06, 0.3, (landH(x + 150, z) - landH(x - 150, z)) / 300) * m * (0.45 + 0.55 * patch) : 0;
      out[0] = clamp(t0 + 0.2 * steep + 0.3 * leeK - 0.2 * smoothstep(0.5, 0.95, nl) * (1 - bigLee) + 0.3 * hollow + 0.25 * bigLee, 0, 0.85);
      out[1] = clamp(t1 * (0.4 + 0.6 * smoothstep(0.6, -0.2, nl)) + 0.95 * leeK * leeK + 1.0 * hollow + 0.8 * bigLee * smoothstep(0.75, 0.3, nl), 0, 1);
      const sn = y + 34 * noise.fbm2(x * 0.013, z * 0.013, 2);
      out[2] = smoothstep(SHEET.snow, SHEET.snow + 70, sn) * 0.9 * Math.min(SHEET.chalk, 1.15) * smoothstep(-0.15, 0.55, nl) * smoothstep(0.75, 0.3, steep);
      return out;
    }
    // the horn's own tones (M1, P5): a SNOW peak. On the faces the light finds, the upper two fifths and the beds of the
    // couloirs a hundred metres further down are snow: white chalk laid solid, with hardly a pencil stroke in it; only
    // the sharp crests of the strong ribs and the risers of the rock steps come through it as rock. The lee faces and
    // the ribs are charcoal rock to the top, hatched, with two or three charcoal masses, laid here vertex by vertex so
    // they have no edge, in the lee gullies.
    function hornTone(x, y, z, nl, steep, out) {
      hornAt(x, z, hq);
      const rib = hornRib(x, z, hq[1]), foot = smoothstep(0, 70, y);
      let snow = smoothstep(SHEET.snow - 10, SHEET.snow + 40, y - 45 * Math.max(rib, 0) - 170 * Math.min(rib, 0) + 22 * noise.n2(x * 0.011, z * 0.011));
      snow *= 1 - 0.92 * smoothstep(0.34, 0.66, rib) * smoothstep(6, 30, PEAK.y - y);            // the crests of the strong ribs come through the snow
      // and so do the risers of the rock steps, by the steps' own rule (the same phase that cuts them in hornStep): bands
      // of bare rock a few metres high ring the peak, wandering and breaking, closest together under the point
      const dxp = (x - PEAK.x) / HORN_R, dzp = (z - PEAK.z) / HORN_R, rp = Math.hypot(dxp, dzp), thp = Math.atan2(dzp, dxp);
      const qa = stepQ(thp, rp), sa = qa - Math.floor(qa), qb = rp / 18 + 1.3 * noise.n2(Math.cos(thp) * 2.6 + 11, Math.sin(thp) * 2.6 + 2), sb = qb - Math.floor(qb);
      const riser = Math.max(smoothstep(0.74, 0.84, sa) * smoothstep(28, 80, rp), smoothstep(0.66, 0.78, sb) * smoothstep(9, 30, rp) * smoothstep(135, 85, rp)) * smoothstep(0.25, 0.6, noise.n2(x * 0.045 + 7, z * 0.045));
      snow *= 1 - 0.9 * riser * smoothstep(6, 24, PEAK.y - y);
      snow *= 0.8 + 0.2 * smoothstep(-0.06, 0.2, nl);                                          // snow lies on the lee faces too, thinner: there it is left as card with a little chalk
      const rock = 1 - snow, leeK = smoothstep(0.34, -0.12, nl);
      const massN = smoothstep(0.44, 0.64, 0.5 + 0.5 * noise.fbm2(x * 0.0045 + 11, z * 0.0045 + y * 0.002, 2));
      // behind the point (north of it) the snow that the light only grazes keeps a light
      // hatching and less chalk, so the back of the peak is modelled in two tones and is not one white shape
      const half = smoothstep(0.78, 0.4, nl) * smoothstep(0.2, 0.7, ((x - PEAK.x) * NORTH[0] + (z - PEAK.z) * NORTH[1]) / Math.max(Math.hypot(x - PEAK.x, z - PEAK.z), 1));
      out[0] = clamp(foot * (rock * (0.5 + 0.26 * leeK - 0.3 * smoothstep(0.5, 0.9, nl)) + snow * (0.02 + 0.2 * leeK + 0.3 * half)) + (1 - foot) * 0.45, 0, 0.8);
      out[1] = clamp(foot * SHEET.lee * (rock * (0.12 + 0.3 * leeK + 0.75 * massN * (0.35 + 0.65 * leeK) + 0.3 * leeK * smoothstep(0.05, -0.3, rib))), 0, 0.95);
      out[2] = snow * (0.78 + 0.22 * smoothstep(-0.04, 0.3, nl)) * (0.95 - 0.35 * half) * Math.min(SHEET.chalk, 1.15);
      // the snow is modelled: the flank of every rib that falls away from the light carries pencil and a soft charcoal lee
      const ribLee = snow * foot * smoothstep(0.3, -0.25, nl);
      out[0] = clamp(out[0] + 0.3 * ribLee, 0, 0.8); out[1] = clamp(out[1] + 0.6 * SHEET.lee * ribLee * (0.4 + 0.6 * massN), 0, 0.95); out[2] *= 1 - 0.7 * ribLee;
      // BEHIND THE POINT (the faces the turn looks down on; the eighth review) every rib is drawn, whichever way its face
      // looks: the flank of the rib that turns from the light (by the rib's own fall round the peak) takes pencil and a
      // charcoal lee and loses its chalk, the flank that meets the light keeps the chalk, the snow between is thinner
      const back = smoothstep(0.0, 0.5, ((x - PEAK.x) * NORTH[0] + (z - PEAK.z) * NORTH[1]) / Math.max(Math.hypot(x - PEAK.x, z - PEAK.z), 1));
      if (back > 0 && rp > 20) {
        const e = 0.03, c1 = Math.cos(thp + e), s1 = Math.sin(thp + e), c0 = Math.cos(thp - e), s0 = Math.sin(thp - e), rw = rp * HORN_R;
        const xa = PEAK.x + c1 * rw, za = PEAK.z + s1 * rw, xb = PEAK.x + c0 * rw, zb = PEAK.z + s0 * rw;
        hornAt(xa, za, hq); const ra = hornRib(xa, za, hq[1]); hornAt(xb, zb, hq); const rb = hornRib(xb, zb, hq[1]);
        const hl2 = Math.hypot(LIGHT_DIR.x, LIGHT_DIR.z), fl = -(ra - rb) * 2 * clamp(4 * (-Math.sin(thp) * LIGHT_DIR.x + Math.cos(thp) * LIGHT_DIR.z) / hl2, -1, 1);      // over 0: this flank meets the light
        const leeF = smoothstep(0.03, 0.32, -fl) * back * foot * smoothstep(30, 100, rp);
        out[0] = clamp(out[0] + 0.5 * leeF, 0, 0.85); out[1] = clamp(out[1] + 0.85 * SHEET.lee * leeF * (0.55 + 0.45 * massN), 0, 0.95);
        out[2] *= (1 - 0.95 * leeF) * (1 - back * 0.72 * (1 - smoothstep(0.03, 0.3, fl)));
      }
      return out;
    }
    const landMat = style.cardMaterial({ contact: 1, lee: SHEET.lee, bedTone: 0, smudge: 0.34, mass: 1 });
    const hornMat = style.cardMaterial({ contact: 1, lee: SHEET.lee, bedTone: 0, mass: 2 });
    U.uField.value.set((FIELD.x1 - FIELD.x0) / 2, FIELD.z0, FIELD.z1, 1);
    U.uBannerC.value.set(56, BANNER.L, HOIST_Y, 1);
    U.uBannerO.value.set(SUMMIT[0], SUMMIT[2], -UPWIND[0], -UPWIND[1]);
    const tn = [0, 0, 0];
    // bedOf: on the horn's mesh, how far the hatching's planes lean over here (0 on the valley floor, 1 on the peak)
    async function finishLand(pos, idx, toneOf, mat, lineW, bedOf) {
      const nv = pos.length / 3, tone = new Float32Array(nv * 3), bed = new Float32Array(nv);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex(idx);
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      const nrm = g.attributes.normal.array;
      for (let k = 0; k < nv; k++) {
        const nl = nrm[k * 3] * LIGHT_DIR.x + nrm[k * 3 + 1] * LIGHT_DIR.y + nrm[k * 3 + 2] * LIGHT_DIR.z;
        toneOf(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2], nl, 1 - nrm[k * 3 + 1], tn);
        tone[k * 3] = tn[0]; tone[k * 3 + 1] = tn[1]; tone[k * 3 + 2] = tn[2];
        if (bedOf) bed[k] = bedOf(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
        if ((k & 1023) === 1023) await ctx.yield();
      }
      g.setAttribute('aTone', new THREE.BufferAttribute(tone, 3));
      g.setAttribute('aBed', new THREE.BufferAttribute(bed, 1));
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      scene.add(mesh, style.outlineOf(mesh, lineW));
      return mesh;
    }
    // the land's own facets: the height of the valley's drawn mesh (not of the rule behind it) at a place, for things laid ON it
    let landXs = null, landZs = null;
    const landSurf = (x, z) => {
      let i = 0, j = 0; while (i < landXs.length - 2 && landXs[i + 1] < x) i++; while (j < landZs.length - 2 && landZs[j + 1] < z) j++;
      const x0 = landXs[i], x1 = landXs[i + 1], z0 = landZs[j], z1 = landZs[j + 1], fx = clamp((x - x0) / (x1 - x0), 0, 1), fz = clamp((z - z0) / (z1 - z0), 0, 1);
      const ha = landH(x0, z0), hb = landH(x1, z0), hc = landH(x0, z1), hd = landH(x1, z1);
      return fx + fz <= 1 ? ha + fx * (hb - ha) + fz * (hc - ha) : hd + (1 - fx) * (hc - hd) + (1 - fz) * (hb - hd);
    };
    {   // the valley, its ridges, the far valley and the uplands: a plain grid, sunk out of the way under the horn's own mesh
      // columns 41 m apart across the valley and both ridges (x -1100 to 1100); rows 31 m apart from z 500 to 1750 (the
      // climb and the turn) and 32 to 43 m to either end of the valley; beyond, out to the uplands and up the far valley,
      // columns and rows 80 to 250 m apart
      const xs = [-2400, -2180, -1980, -1790, -1610, -1450, -1310, -1200], zs = [-1500, -1320, -1150, -990, -840];
      for (let i = 0; i <= 54; i++) xs.push(-1100 + (2200 * i) / 54);
      xs.push(1200, 1310, 1450, 1610, 1790, 1980, 2180, 2400);
      for (let j = 0; j <= 79; j++) zs.push(j <= 28 ? -700 + (1200 * j) / 28 : j <= 68 ? 500 + (1250 * (j - 28)) / 40 : 1750 + (350 * (j - 68)) / 11);
      zs.push(2160, 2230, 2310, 2400, 2500, 2620, 2760, 2920, 3100, 3300, 3600);
      landXs = xs; landZs = zs;
      const NX = xs.length - 1, NZ = zs.length - 1, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
      for (let j = 0; j <= NZ; j++) {
        for (let i = 0; i <= NX; i++) {
          const x = xs[i], z = zs[j], o = (j * (NX + 1) + i) * 3;
          const r = Math.hypot(x - PEAK.x, z - PEAK.z);
          pos[o] = x; pos[o + 1] = landH(x, z) - 46 * smoothstep(590 * HORN_R, 545 * HORN_R, r); pos[o + 2] = z;
        }
        if ((j & 7) === 7) await ctx.yield();
      }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      await finishLand(pos, idx, landTone, landMat, 2.4);
    }
    await ctx.yield();
    {   // the horn: a polar mesh about its point with a spoke along each arete, so the aretes are its own sharp edges and
        // every ring is cut the same way (no stagger: the hatching's strokes run on across it without a kink)
      const NA = 180, NR = 64, R = 600 * HORN_R, pos = new Float32Array((NA * (NR + 1) + 1) * 3), idx = [];
      pos[0] = PEAK.x; pos[1] = landH(PEAK.x, PEAK.z); pos[2] = PEAK.z;
      for (let j = 1; j <= NR + 1; j++) {
        const rr = j > NR ? R : R * Math.pow(j / NR, 1.5);      // rings 3 to 6 m apart on the top 100 m, where the eye comes near
        for (let i = 0; i < NA; i++) {
          const th = (i / NA) * Math.PI * 2, x = PEAK.x + Math.cos(th) * rr, z = PEAK.z + Math.sin(th) * rr, o = (1 + (j - 1) * NA + i) * 3;
          pos[o] = x; pos[o + 1] = landH(x, z) - (j > NR ? 44 : 0); pos[o + 2] = z;
        }
        if ((j & 3) === 3) await ctx.yield();
      }
      for (let i = 0; i < NA; i++) idx.push(0, 1 + ((i + 1) % NA), 1 + i);
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = 1 + j * NA + i, b = 1 + j * NA + ((i + 1) % NA), c = a + NA, d = b + NA; idx.push(a, b, c, b, d, c); }
      await finishLand(pos, idx, (x, y, z, nl, steep, out) => { const k = smoothstep(560 * HORN_R, 470 * HORN_R, Math.hypot(x - PEAK.x, z - PEAK.z)); hornTone(x, y, z, nl, steep, out); if (k < 1) { const a = out[0], b = out[1], c = out[2]; landTone(x, y, z, nl, steep, out); out[0] += (a - out[0]) * k; out[1] += (b - out[1]) * k; out[2] += (c - out[2]) * k; } return out; }, hornMat, 3.0,
        (x, y, z) => smoothstep(16, 90, y) * smoothstep(575 * HORN_R, 500 * HORN_R, Math.hypot(x - PEAK.x, z - PEAK.z)));
    }
    await ctx.yield();
    // ---- THE SOWN FIELD (turquoise): gust fronts, blades on stalks near the route, one strip per drilled row beyond --
    const FIELD_GLSL = /* glsl */`
uniform vec4 uGust;      // gap between fronts (m), width of a front (m), how far it lays the blades 0..1, speed (m/s)
uniform vec4 uDevil;     // the dust devil: x, z, radius, strength (0 = none)
uniform vec2 uDevilDir;  // its heading in plan
const vec2 SW_WD = vec2(${(-UPWIND[0]).toFixed(4)}, ${(-UPWIND[1]).toFixed(4)});   // the wind in plan: toward astern and starboard
float fl_h(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float fl_n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(fl_h(i), fl_h(i + vec2(1., 0.)), f.x), mix(fl_h(i + vec2(0., 1.)), fl_h(i + vec2(1., 1.)), f.x), f.y); }
// how far the cloth at this place is laid over, 0..1: fronts crossing the rows on the slant, down the wind; a restless
// ground swell; the devil's spiral
float sw_gustLay(vec2 xz, float t){
  float up = -dot(xz, SW_WD), across = dot(xz, vec2(SW_WD.y, -SW_WD.x));
  float ph = (up + uGust.w * t + 34. * (fl_n(xz * .012 + vec2(3.1, t * .02)) - .5)) / max(uGust.x, 1.);
  float id = floor(ph), d = (fract(ph) - .5) * uGust.x;
  float g = (1. - smoothstep(uGust.y * .25, uGust.y, abs(d))) * (.65 + .35 * fl_h(vec2(id, 7.)));
  g *= .5 + .5 * smoothstep(.15, .55, fl_n(vec2(across * .013 + id * 5., id)));
  float base = .07 + .16 * fl_n(xz * .045 + vec2(0., t * .7));
  vec2 q = xz - uDevil.xy;
  float r = length(q);
  float ang = (r > 1e-3) ? atan(q.y, q.x) : 0.;
  float sp = (1. - smoothstep(uDevil.z * .25, uDevil.z, r)) * (.5 + .5 * sin(ang * 2. + r * .5 - t * 2.6));
  float along = dot(q, -uDevilDir), lat = dot(q, vec2(-uDevilDir.y, uDevilDir.x));
  float tr = step(0., along) * (1. - smoothstep(20., 120., along)) * (1. - smoothstep(3., 9., abs(lat - 11. * sin(along * .16))));
  return clamp(max(g * uGust.z + base, uDevil.w * max(sp, tr)), 0., 1.);
}
// R6: WHAT IS SOWN, by place (1 where cloth stands). The field is not one grid with a ruled edge: its sides fray out
// drill pass by drill pass (the outer passes are sown shorter at both ends, each by its own measure), the end toward
// the cone ends pass by pass, one drill in twenty-seven is left bare as a lane, two tracks cross the drills on the
// slant and a headland strip crosses them near the cone's end. soft = the half width over which an edge is softened:
// 0 for a blade's own site, the pixel's footprint on the ground for the far strips (so a lane a pixel cannot hold
// leaves its share of tone and does not crawl)
uniform vec4 uFieldR;    // the sown plot: half its width, z0, z1, the x of its middle
uniform float uFan;      // 1: a plot sown as a wedge, each pass shorter than the last
float fl_sown(vec2 xz, float soft){
  float row = floor(xz.x / ${FIELD.rowDX.toFixed(3)} + .5), pass = floor(row / 9.);
  float px0 = (pass * 9. + 4.) * ${FIELD.rowDX.toFixed(3)} - uFieldR.w;
  float side = uFieldR.x - abs(px0);
  float outK = 1. - smoothstep(0., .285 * uFieldR.x, side), fl = uFieldR.z - uFieldR.y;        // (the field: its outer 60 m; by the plot's own size)
  float zA = uFieldR.y + outK * fl * (.07 + .5 * fl_h(vec2(pass, 21.)));
  float zB = uFieldR.z - 3. - .095 * fl * fl_n(vec2(pass * .31, 8.3)) - outK * fl * (.07 + .45 * fl_h(vec2(pass, 37.)));
  zB -= uFan * .78 * (uFieldR.z - uFieldR.y) * clamp(.5 + .5 * px0 / max(uFieldR.x, 1.), 0., 1.);
  float k = smoothstep(zA - soft, zA + soft + .02, xz.y) * (1. - smoothstep(zB - soft, zB + soft + .02, xz.y)) * step(abs(px0), uFieldR.x);
  float lane = step(abs(mod(row, 27.) - 13.), .5) * (1. - smoothstep(1.2, 3.6, soft));
  float t1 = abs(dot(xz - vec2(-60., 120.), vec2(-.330, .944))), t2 = abs(dot(xz - vec2(40., 250.), vec2(.447, .894)));
  float trk = 1. - smoothstep(1.5 - soft, 1.5 + soft + .02, min(t1, t2));
  float hd = 1. - smoothstep(1.7 - soft, 1.7 + soft + .02, abs(xz.y - (uFieldR.z - 62.)));
  return k * (1. - lane) * (1. - .94 * max(trk, hd));
}
// the window of real blades about the route's own point: 1 inside, 0 outside, a hand-over band between
uniform vec3 uRouteF;
uniform vec4 uWinF;      // half width, metres behind, metres ahead, hand-over band
float sw_window(vec2 xz){
  float ex = uWinF.x - abs(xz.x - uRouteF.x), eb = xz.y - (uRouteF.z - uWinF.y), ef = (uRouteF.z + uWinF.z) - xz.y;
  return smoothstep(0., uWinF.w, ex) * smoothstep(0., uWinF.w, ef) * smoothstep(0., min(uWinF.w, 8.), eb);
}`;
    const fieldU = {
      uGust: { value: new THREE.Vector4(WIND.gap, WIND.width, WIND.lay, 14) }, uDevil: { value: new THREE.Vector4(0, -900, 30, 0) }, uDevilDir: { value: new THREE.Vector2(0, 1) },
      uRouteF: U.uRoute, uWinF: { value: new THREE.Vector4(110, 10, 180, 20) },
      uFieldR: { value: new THREE.Vector4((FIELD.x1 - FIELD.x0) / 2, FIELD.z0, FIELD.z1, 0) }, uFan: { value: 0 },
    };
    const BLADE_VERT = /* glsl */`
${STYLE_VERT_GLSL}
${FIELD_GLSL}
uniform float uTime, uWind;
uniform vec4 uLat;       // sites across, sites along, metres ahead of the route point of the lattice's centre, hand-over band
uniform vec4 uNearWin;   // the near set's place: half width, metres behind, metres ahead; w = 1 when this mesh IS the near set
attribute vec2 iSite;
varying vec3 vP;
varying vec4 vCl;        // across (m), along (m), tone, part (0 blade, 1 stalk, 2 clip)
varying vec2 vMisc;      // seed, s
void main(){
  const float DX = ${FIELD.rowDX.toFixed(3)}, DZ = ${FIELD.siteDZ.toFixed(3)};
  float part = position.z, s = position.y;
  float ix = iSite.x + uLat.x * floor((uRouteF.x / DX - iSite.x) / uLat.x + .5);
  float iz = iSite.y + uLat.y * floor(((uRouteF.z + uLat.z) / DZ - iSite.y) / uLat.y + .5);
  float h1 = fl_h(vec2(ix, iz)), h2 = fl_h(vec2(iz + 17., ix + 5.));
  vec2 nom = vec2(ix * DX, iz * DZ);
  vec2 site = nom + vec2(0., (h1 - .5) * .5);
  float inF = step(abs(nom.x), uFieldR.x - .4) * step(uFieldR.y + .4, nom.y) * step(nom.y, uFieldR.z - .4) * step(.5, fl_sown(nom, 0.));
  float ex = uLat.x * DX * .5 - abs(nom.x - uRouteF.x);
  float zc = uRouteF.z + uLat.z, hl = uLat.y * DZ * .5;
  float wf = smoothstep(0., uLat.w, ex) * smoothstep(0., uLat.w, zc + hl - nom.y) * smoothstep(0., min(uLat.w, 8.), nom.y - (zc - hl));
  float zr = nom.y - uRouteF.z;
  float inN = step(abs(nom.x - uRouteF.x), uNearWin.x) * step(uNearWin.y, zr) * step(zr, uNearWin.z);
  float sc = inF * wf * mix(1. - inN, inN, uNearWin.w);
  float lay = sw_gustLay(site, uTime);
  vec3 hoist = vec3(site.x, ${FIELD.stalk.toFixed(2)}, site.y);
  vec4 mvS = viewMatrix * vec4(hoist, 1.);
  float px = sw_px(-mvS.z);
  float droop = mix(mix(1.02, .5, clamp(uWind - .4, 0., 1.)), .05, lay) + .16 * (h2 - .5);
  vec3 dir = vec3(SW_WD.x * cos(droop), -sin(droop), SW_WD.y * cos(droop)), nrm = vec3(SW_WD.x * sin(droop), cos(droop), SW_WD.y * sin(droop));
  vec3 wide = vec3(-SW_WD.y, 0., SW_WD.x);
  float ph = h1 * 40.;
  float fa = (.05 + .06 * uWind) * (1. - .45 * lay) * (1. - .8 * smoothstep(.035, .085, px));
  float wob = sin(s * 5.5 - uTime * (13. + 6. * h2) + ph);
  vec3 p; float tone = 0.;
  if (part < .5) {
    float w = max(${FIELD.bladeW.toFixed(2)}, 2.3 * px);
    p = hoist + dir * (s * ${FIELD.bladeL.toFixed(2)} * sc) + nrm * (fa * s * wob * sc) + wide * ((position.x * w + sin(uTime * 2.3 + ph) * .14 * s) * sc);
    p.y = max(p.y, .06);
    tone = .36 + .5 * lay + .1 * wob * s * (1. - lay) + (h2 - .5) * .1;
  } else if (part < 1.5) {
    float nearK = 1. - smoothstep(55., 95., length(site - uRouteF.xz));
    p = vec3(site.x + position.x * max(.034, 1.5 * px) * sc * nearK, s * ${FIELD.stalk.toFixed(2)} * sc * nearK, site.y);
  } else {
    p = hoist + vec3(position.x * .075 * sc, (s - .5) * .13 * sc, -.012);
  }
  vP = p;
  vCl = vec4(position.x * ${FIELD.bladeW.toFixed(2)} + h1 * 3., s * ${FIELD.bladeL.toFixed(2)} + h2 * 5., tone, part);
  vMisc = vec2(h1, position.x);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
    const BLADE_FRAG = /* glsl */`
${STYLE_GLSL}
${CLOTH_GLSL}
uniform vec4 uNearWin;
varying vec3 vP;
varying vec4 vCl;
varying vec2 vMisc;
void main(){
  float fw = sw_foot(vP);
  vec3 col;
  if (vCl.w < .5) {
    float hem = (.5 - abs(vMisc.y)) * ${FIELD.bladeW.toFixed(2)};
    col = sw_crayon(vCl.xy, clamp(vCl.z, 0., 1.), 99., vP, fw, vMisc.x, 0., 0.);
    // the near blades carry a pencil hem line
    float hl = (1. - smoothstep(max(.006, .7 * fw), max(.014, 1.6 * fw), abs(hem - .016))) * smoothstep(.02, .008, fw) * uNearWin.w;
    col = mix(col, mix(uGraphite, uCharcoal, .5), hl * .7);
  } else if (vCl.w < 1.5) {
    col = mix(uCard, mix(uGraphite, uCharcoal, .35), .92);
  } else {
    col = mix(uGraphite, uCharcoal, .8);
  }
  gl_FragColor = vec4(col, 1.);
}`;
    const bladeMat = (lat, near) => new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms('turquoise'), ...fieldU, uLat: { value: new THREE.Vector4(lat[0], lat[1], lat[2], lat[3]) }, uNearWin: { value: new THREE.Vector4(26.5, -8, 88, near) } },
      vertexShader: BLADE_VERT, fragmentShader: BLADE_FRAG, side: THREE.DoubleSide, fog: false });
    function bladeGeometry(nx, nz, segs, clip) {
      const pos = [], idx = [];
      const quad = (rows, part) => { const b = pos.length / 3; for (let j = 0; j <= rows; j++) pos.push(-0.5, j / rows, part, 0.5, j / rows, part); for (let j = 0; j < rows; j++) { const k = b + j * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } };
      quad(1, 1); quad(segs, 0); if (clip) quad(1, 2);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      const site = new Float32Array(nx * nz * 2);
      for (let k = 0, j = 0; j < nz; j++) for (let i = 0; i < nx; i++, k++) { site[k * 2] = i; site[k * 2 + 1] = j; }
      g.setAttribute('iSite', new THREE.InstancedBufferAttribute(site, 2));
      g.instanceCount = nx * nz;
      return g;
    }
    const farNZ = Math.round(72 * clamp(detail, 0.6, 1));
    const farLen = farNZ * FIELD.siteDZ;                       // 90 m at full detail (R6: beyond it a blade is a speck under a hundredth of the frame and the drilled strips stand for it; the blades saved pay for the out-plots)
    fieldU.uWinF.value.set(110, 10, farLen - 10, 20);
    const bladesFar = new THREE.Mesh(bladeGeometry(200, farNZ, 1, false), bladeMat([200, farNZ, farLen / 2 - 10, 20], 0));
    await ctx.yield();
    const bladesNear = new THREE.Mesh(bladeGeometry(50, 80, 3, true), bladeMat([50, 80, 40, 0.001], 1));
    bladesFar.frustumCulled = false; bladesNear.frustumCulled = false;
    scene.add(bladesFar, bladesNear);
    await ctx.yield();
    // the drilled strips' drawing (the field beyond its real blades, and the out-plots: plot = true has no window of blades)
    const rowsFrag = (plot) => /* glsl */`
${STYLE_GLSL}
${CLOTH_GLSL}
${FIELD_GLSL}
varying vec3 vP;
void main(){
  float fw = sw_foot(vP);
  float fx = max(fwidth(vP.x), 1e-5), fz = max(fwidth(vP.z), 1e-5);
  // THE FOOTPRINT FILTER (S6): where the real blades stand the strip is not drawn while a pixel can hold a blade (its
  // footprint across the rows under 6 cm: a blade is 18 cm wide). Past that each row's strip comes in under its own
  // blades, a line at first, widening as the footprint grows, until at 13 cm (a blade a pixel and a half wide) the
  // rows have given way to the even drawn tone of the cloth with the pencil row lines over it; the blades then stand
  // in their own colour and no longer sparkle against the ground
  float rowIn = smoothstep(.06, .13, fx);
  ${plot ? '' : `if (sw_window(vP.xz) > .985 && abs(vP.x / ${FIELD.rowDX.toFixed(3)} - floor(vP.x / ${FIELD.rowDX.toFixed(3)} + .5)) > .5 * rowIn) discard;`}
  float lay = sw_gustLay(vP.xz, uTime);
  float row = floor(vP.x / ${FIELD.rowDX.toFixed(3)} + .5);
  float dist = length(vP.xz - uRouteF.xz);
  // THE DRILL TO THE VANISHING POINT (M4): the bare strip between rows is drawn while a pixel can hold it; where it cannot,
  // every fourth strip is drawn instead, then every sixteenth, then every sixty-fourth, each never under a pixel wide, so
  // the far field is rows running to their vanishing point and never one flat band (chosen by the pixel's footprint)
  // (ON AN OUT-PLOT, the eleventh review: a bare strip is drawn only while the cloth between two of them is some five
  // pixels and more, so from the air a plot is saturated crayon in the exact tones, ruled by a few strips of card, and
  // never a lattice of cloth and card mixed in every pixel)
  float lv = clamp(log2(max(fx, 1e-5) * ${plot ? '10.' : '3.4'} / ${FIELD.rowDX.toFixed(3)}) * .5, 0., 2.999);
  float l0 = floor(lv), lf = lv - l0, n0 = exp2(2. * l0), n1 = n0 * 4.;
  float q = vP.x / ${FIELD.rowDX.toFixed(3)} - .5;
  float d0 = abs(q - floor(q / n0 + .5) * n0) * ${FIELD.rowDX.toFixed(3)}, d1 = abs(q - floor(q / n1 + .5) * n1) * ${FIELD.rowDX.toFixed(3)};
  float hg = max(mix(.33, .2, smoothstep(50., 200., dist)), ${plot ? '.8' : '.62'} * fx);
  float g0 = 1. - smoothstep(hg - .5 * fx, hg + .5 * fx, d0), g1 = 1. - smoothstep(hg - .5 * fx, hg + .5 * fx, d1);
  float cover = 1. - max(g0 * (1. - smoothstep(${plot ? '.1, .55' : '.5, 1.'}, lf)), g1 * smoothstep(0., .5, lf)) * (1. - .45 * smoothstep(1.5, 3., lv));
  // THE FAR END IS STILL BEING SOWN (Q6): behind the entry the cloth ends drill pass by drill pass (nine rows a pass), each
  // at its own place, so from the summit the field's far end is a comb of strips running out into the drawn floor
  float pass = floor(row / 9.);
  float farE = smoothstep(1.5, 6., fx);                         // a pixel wider than a pass: the comb is its even tone
  float endL = min(1., (uFieldR.z - uFieldR.y) / 420.);
  float endZ = uFieldR.y + 6. + endL * (150. * fl_n(vec2(pass * .23, 4.7)) * fl_n(vec2(pass * .23, 4.7)) + 34. * mix(fl_h(vec2(pass, 5.)), .5, farE));
  float sownK = smoothstep(endZ - 17. * farE, endZ + max(2. * fz, 1.5) + 17. * farE, vP.z) * fl_sown(vP.xz, .7 * max(fx, fz));
  ${plot ? '' : 'if (sownK < (sw_window(vP.xz) > .985 ? .5 : .05)) discard;      // nothing is drawn where nothing is sown: the land itself shows (no flat grey floor at the unsown ends)'}
  cover *= sownK;
  float bz = fract(vP.z / ${FIELD.siteDZ.toFixed(3)} + fl_h(vec2(row, 3.)));
  float rip = (bz - .5) * .34 * smoothstep(2.5, 5., ${FIELD.siteDZ.toFixed(3)} / fz);
  float v = clamp(.4 + .46 * lay + rip + (fl_h(vec2(row, 9.)) - .5) * .06, 0., 1.);
  // far off, and from above, the field keeps its mid tone and the gust fronts cross it as pale bands at any wind's strength
  v = mix(v, ${plot ? '.31' : '.36'} + .6 * clamp(lay / (.3 + .7 * uGust.z), 0., 1.), smoothstep(1.5, 5., fz));
  ${plot ? `// seen from the air every row of an out-plot still flutters: a ripple runs down each row by the world's clock, row out
  // of step with row, turning stretches of it from the mid tone to the shade tone and back (left out where a pixel
  // could not hold it)
  v += .085 * sin(vP.z * .35 - uTime * 3.2 + fl_h(vec2(row, 13.)) * 6.2832) * (1. - smoothstep(1.4, 3., fz));` : ''}
  // UNDER THE BANNER (the eleventh review: the cloth overhead has weight) the sown cloth lies in the banner's contact
  // shade: its tones go down to the shade tone and the land's own charcoal strokes run on across it (the same strokes,
  // by the same rule and place as in the card material of the part)
  float shB = uBannerC.w * sw_bannerContact(vP);
  float tB = shB * (mix(.4, .72, 1. - smoothstep(60., 200., sw_bannerGap)) + .28 * sw_vn2(vP.xz * .013 + 4.));
  v -= .3 * smoothstep(.15, .5, tB);
  vec3 cloth = sw_crayon(vP.xz, clamp(v, 0., 1.), 99., vP, fw, fl_h(vec2(row, 1.)), 0., 0.);
  {
    float cB = dot(vP, vec3(.5, 0., -.866)) + 2.2 * (sw_vn2(vP.xz * .021) - .5) + 1.7, aB = dot(vP, vec3(.866, 0., .5)) + .35 * vP.y + 9.;
    float cT = tB + .14 * (sw_vn2(vP.xz * .028 + vP.y * .02) - .5) + .09 * (sw_vn2(vP.xz * .11 + vP.y * .07 + 5.) - .5);
    float fcB = max(fwidth(cB), 1e-5), lB = log2(fcB * 9.), iB = floor(lB);
    vec2 laid = mix(sw_laidMass(cB, aB, fcB, exp2(iB), cT, 0.), sw_laidMass(cB, aB, fcB, exp2(iB + 1.), cT, 0.), smoothstep(.25, .75, lB - iB));
    cloth = mix(cloth, uCharcoal, .66 * max(laid.x * .9, laid.y) * step(.02, shB));
  }
  ${plot ? `// an out-plot is cloth on the land: where nothing is sown the land itself shows; its drill lanes (every twenty-seventh
  // row, inside the sowing) are pressed in charcoal
  float laneP = step(abs(mod(row, 27.) - 13.), .5) * step(.5, fl_sown(vP.xz + vec2(2.2, 0.), 0.) * fl_sown(vP.xz - vec2(2.2, 0.), 0.)) * (1. - smoothstep(1.2, 2.4, fx));
  if (cover < .05 && laneP < .5) discard;
  vec3 ground = mix(sw_draw(vP, fw, .1, 0., 0.), sw_draw(vP, fw, .25, .7, 0.), laneP);` : 'vec3 ground = sw_draw(vP, fw, .25, .6, 0.);'}
  gl_FragColor = vec4(mix(ground, cloth, cover), 1.);
}`;
    {   // one long low strip per drilled row, tiling into the far floor of cloth; the same gust function as the blades
      const k0 = Math.ceil((FIELD.x0 + 0.4) / FIELD.rowDX), k1 = Math.floor((FIELD.x1 - 0.4) / FIELD.rowDX), nRows = k1 - k0 + 1, NZs = 8;
      const pos = new Float32Array((nRows + 1) * (NZs + 1) * 3), idx = [];
      for (let i = 0; i <= nRows; i++) for (let j = 0; j <= NZs; j++) {
        const o = (i * (NZs + 1) + j) * 3;
        pos[o] = (k0 + i - 0.5) * FIELD.rowDX; pos[o + 1] = 0.92; pos[o + 2] = FIELD.z0 + 0.4 + ((FIELD.z1 - FIELD.z0 - 0.8) * j) / NZs;
      }
      for (let i = 0; i < nRows; i++) for (let j = 0; j < NZs; j++) { const a = i * (NZs + 1) + j, b = a + 1, c = a + NZs + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      const rows = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...style.clothUniforms('turquoise'), ...fieldU },
        vertexShader: /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: rowsFrag(false), side: THREE.DoubleSide, fog: false }));
      rows.frustumCulled = false;
      scene.add(rows);
      // THE SOWN PLOTS (R6, S8): the same sowing goes on up the valley in broad plots, each 130 to 220 m across: on
      // the valley floor to starboard of the cone, beside the banner's shade (220 by 220 m);
      // two on the floor to port of the horn, beside and beneath the cloth's upper half as the run sees it; one on the
      // floor to port of the field; two on the starboard valley side (a broad one and one sown as a wedge); the plot
      // beyond the dry river, from the river's bank to the cone's stakes on the starboard hand of the line and up to the
      // line itself (T5); and one on the upland behind the horn. Each is
      // draped on the land's own facets a blade's height over them, drilled, laid by the same gusts and frayed by the
      // same rule as the field (its own shader; from the air a blade there is under a pixel, so the strips stand for
      // the blades). All lie clear of the horn's own mesh, the cone's stakes and the river's beds.
      for (const [x0, x1, z0, z1, fan] of [[-330, -110, 430, 650, 0], [190, 330, 840, 1010, 0], [215, 345, 1050, 1250, 1], [250, 390, 130, 360, 0], [-800, -650, 690, 840, 0], [-760, -630, 530, 680, 1], [-200, -20, 419, 458, 0], [-20, 9, 419, 446, 0], [-120, 120, 1420, 1680, 0]]) {
        const nx = Math.round((x1 - x0) / 5.5), nz = Math.round((z1 - z0) / 5.5), pp = new Float32Array((nx + 1) * (nz + 1) * 3), pi = [];
        for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const o = (i * (nz + 1) + j) * 3, x = x0 + ((x1 - x0) * i) / nx, z = z0 + ((z1 - z0) * j) / nz; pp[o] = x; pp[o + 1] = landSurf(x, z) + 0.92; pp[o + 2] = z; }
        for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const a = i * (nz + 1) + j, b = a + 1, c = a + nz + 1, d = c + 1; pi.push(a, b, c, b, d, c); }
        const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setIndex(pi);
        const plot = new THREE.Mesh(pg, new THREE.ShaderMaterial({
          uniforms: { ...style.clothUniforms('turquoise'), ...fieldU, uFieldR: { value: new THREE.Vector4((x1 - x0) / 2, z0, z1, (x0 + x1) / 2) }, uFan: { value: fan } },
          vertexShader: /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
          fragmentShader: rowsFrag(true), side: THREE.DoubleSide, fog: false }));
        plot.frustumCulled = false; scene.add(plot);
      }
    }
    await ctx.yield();
    // ---- ruled hardware of the field and the headland ------------------------------------------------------------
    const TR = (x, y, z, ry = 0) => new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    const steel = style.ruledMaterial({ chalk: 0.3, side: THREE.DoubleSide });
    const hw = [];
    {
      const fw2 = FIELD.x1 - FIELD.x0, fl2 = FIELD.z1 - FIELD.z0, zc = (FIELD.z0 + FIELD.z1) / 2;
      for (const off of [0, 5.2, 7.3]) {                                  // the ruled edge, then the two ruts of the headland track
        const w = off ? 0.16 : 0.24, a = fw2 / 2 + off, b = fl2 / 2 + off, over = off ? 0 : 3.5;   // the edge lines overshoot their corners
        hw.push(ruledBox(2 * a + 2 * over, 0.05, w, TR(0, 0.03, zc - b)), ruledBox(2 * a + 2 * over, 0.05, w, TR(0, 0.03, zc + b)));
        hw.push(ruledBox(w, 0.05, 2 * b + 2 * over, TR(-a, 0.03, zc)), ruledBox(w, 0.05, 2 * b + 2 * over, TR(a, 0.03, zc)));
      }
      for (const sx of [-1, 1]) for (const z of [FIELD.z0, FIELD.z1]) {  // corner posts
        hw.push(ruledBox(0.32, 2.7, 0.32, TR(sx * (fw2 / 2 + 0.9), 1.35, z + (z > zc ? 0.9 : -0.9))), ruledBox(0.5, 0.1, 0.5, TR(sx * (fw2 / 2 + 0.9), 2.75, z + (z > zc ? 0.9 : -0.9))));
      }
    }
    // wind masts 7 m tall, 8 m either side of the course every 60 m; their cups turn in update()
    const mastTops = [];
    for (let z = 30; z < FIELD.z1; z += 60) for (const sx of [-1, 1]) {
      const x = sx * 8;
      hw.push(ruledTube(V3(x, 0, z), V3(x, 7, z), 0.09, 7, 0.06), ruledBox(0.9, 0.08, 0.9, TR(x, 0.05, z)), ruledBox(1.5, 0.07, 0.07, TR(x, 5.6, z)));
      hw.push(ruledTube(V3(x - 0.75, 5.6, z), V3(x - 0.75, 6.05, z), 0.035, 5), ruledBox(0.5, 0.2, 0.03, TR(x - 0.75, 6.1, z - 0.25, Math.PI / 2)));   // a vane
      for (const g2 of [[0.9, 0.7], [-0.9, -0.7]]) hw.push(ruledTube(V3(x, 3.4, z), V3(x + g2[0] * 2.2, 0, z + g2[1] * 2.2), 0.02, 4));              // two stays
      mastTops.push(x, 7.0, z);
    }
    const cupGeo = (() => { const parts = []; for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); parts.push(ruledTube(V3(0, 0, 0), V3(c * 0.55, 0, s * 0.55), 0.022, 4), ruledBox(0.2, 0.2, 0.2, TR(c * 0.62, 0, s * 0.62, -a))); } parts.push(ruledTube(V3(0, -0.12, 0), V3(0, 0.1, 0), 0.05, 5)); return mergeGeometries(parts, false); })();
    const cups = new THREE.InstancedMesh(cupGeo, steel, mastTops.length / 3);
    cups.frustumCulled = false;
    const cupM = new THREE.Matrix4();
    for (let k = 0; k < mastTops.length / 3; k++) cups.setMatrixAt(k, cupM.makeRotationY(k).setPosition(mastTops[k * 3], mastTops[k * 3 + 1] + 0.12, mastTops[k * 3 + 2]));
    scene.add(cups);
    // a shade lies under each machine on the headland: [x, z, yaw, length, width], laid with the trees' card mesh below
    const machineShades = [];
    {   // two flatbed lorries and six cable reels on the far headland, uncovered and small, RULED WITH CARE (the ninth review)
      // a flat ring facing +Z, ruled along its outer and its inner edge (a tyre's wall, a hub, a reel's flange)
      const ruledAnnulus = (r0, r1, seg, matrix) => {
        const pos = [], nor = [], uv = [], sz = [], idx = [];
        for (let i = 0; i <= seg; i++) {
          const a = (i / seg) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
          pos.push(c * r1, sn * r1, 0, c * r0, sn * r0, 0); nor.push(0, 0, 1, 0, 0, 1); uv.push(0.5, 0, 0.5, 1); sz.push(1e3, r1 - r0, 0, 1e3, r1 - r0, 0);
          if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 3)); g.setIndex(idx);
        return g.applyMatrix4(matrix);
      };
      const faceZ = (x, y, z, flip) => new THREE.Matrix4().makeRotationY(flip ? Math.PI : 0).setPosition(x, y, z);
      const lorry = (x, z, ry) => {
        const m = TR(x, 0, z, ry), parts = [], add = (g) => { g.applyMatrix4(m); parts.push(g); };
        add(ruledBox(8.6, 0.28, 0.9, TR(0, 1.05, 0)));                                    // chassis
        add(ruledBox(6.4, 0.16, 2.5, TR(-1.0, 1.36, 0)));                                 // the flat bed, bare
        add(ruledBox(0.12, 1.2, 2.5, TR(2.2, 1.95, 0)));                                  // headboard
        add(ruledBox(1.9, 1.9, 2.4, TR(3.35, 2.0, 0)));                                   // cab
        add(ruledBox(0.06, 0.8, 2.0, TR(4.32, 2.35, 0)));                                 // windscreen frame
        add(ruledBox(0.05, 0.5, 1.5, TR(4.32, 1.55, 0)));                                 // grille
        add(ruledBox(0.2, 0.24, 2.5, TR(4.4, 1.08, 0)));                                  // bumper
        add(ruledBox(1.3, 0.3, 0.7, TR(0.9, 0.78, 0)));                                   // tank under the chassis
        for (const sz of [-1, 1]) {
          add(ruledBox(0.95, 0.72, 0.05, TR(3.6, 2.42, sz * 1.21)));                      // side window
          add(ruledBox(0.035, 1.55, 0.04, TR(2.95, 1.9, sz * 1.21)));                     // the door's line
          add(ruledBox(0.03, 0.035, 1.12, TR(3.5, 1.2, sz * 1.21, Math.PI / 2)));         // its sill
          add(ruledBox(0.22, 0.05, 0.05, TR(3.15, 1.95, sz * 1.24)));                     // handle
          add(ruledBox(0.12, 0.2, 0.06, TR(4.33, 1.3, sz * 0.85, Math.PI / 2)));          // lamp
          for (let k = 0; k < 6; k++) add(ruledBox(0.08, 0.6, 0.08, TR(-3.95 + k * 1.16, 1.74, sz * 1.21)));   // side stakes
          add(ruledBox(6.0, 0.06, 0.05, TR(-1.05, 2.02, sz * 1.21)));                     // the rail along their heads
        }
        // each wheel: the tyre, and on its outer face the tyre's wall and the hub as two ruled circles, an axle through each pair
        for (const wx of [3.3, -1.7, -3.0]) {
          add(ruledTube(V3(wx, 0.52, -1.0), V3(wx, 0.52, 1.0), 0.07, 5));
          for (const wz of [-1.05, 1.05]) {
            add(ruledTube(V3(wx, 0.52, wz - 0.17), V3(wx, 0.52, wz + 0.17), 0.52, 14));
            add(ruledAnnulus(0.26, 0.52, 14, faceZ(wx, 0.52, wz + Math.sign(wz) * 0.185, wz < 0))); add(ruledAnnulus(0, 0.26, 10, faceZ(wx, 0.52, wz + Math.sign(wz) * 0.19, wz < 0)));
          }
        }
        machineShades.push([x - 0.5, z, ry, 9.6, 3.6]);
        return parts;
      };
      hw.push(...lorry(17, 388.5, 0.12), ...lorry(33, 390.5, -0.2));
      // a cable reel lying on its rim: two flanges, each a rim and a hub ruled as circles with six spokes between them,
      // and between the flanges the wound cable as parallel ruled turns
      const reel = (x, z, ry) => {
        const m = TR(x, 1.15, z, ry), parts = [], add = (g) => { g.applyMatrix4(m); parts.push(g); };
        for (const sz of [-1, 1]) {
          add(ruledRing(1.12, 0, 0.06, 0.09, 18).applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, 0, sz * 0.59)));   // the flange's rim
          add(ruledAnnulus(0.82, 1.15, 18, faceZ(0, 0, sz * 0.635, sz < 0))); add(ruledAnnulus(0, 0.3, 10, faceZ(0, 0, sz * 0.64, sz < 0)));
          for (let k = 0; k < 6; k++) add(ruledBox(0.07, 0.56, 0.03, new THREE.Matrix4().makeRotationZ(k * Math.PI / 3).multiply(new THREE.Matrix4().makeTranslation(0, 0.56, sz * 0.63))));
        }
        add(ruledTube(V3(0, 0, -0.55), V3(0, 0, 0.55), 0.72, 14));                                                             // the wound cable
        for (let k = -3; k <= 3; k++) add(ruledRing(0.73, 0, 0.03, 0.05, 14).applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, 0, k * 0.15)));
        add(ruledTube(V3(0, 0, -0.7), V3(0, 0, 0.7), 0.12, 6));                                                                // arbor
        machineShades.push([x - 0.4, z, ry, 3.2, 2.3]);
        return parts;
      };
      const rr = stream('reels');
      for (const [x, z] of [[9, 391], [46, 387], [58, 392], [-22, 389], [-41, 392.5], [-66, 388]]) hw.push(...reel(x, z, rr.range(-0.6, 0.6)));
    }
    await ctx.yield();
    // ---- THE BANNER (emerald): one flying cloth 900 m long, gathered into the ring's lower rim, forked at the tail ------
    // It streams down the wind away from the ring, over the route's passage under it (a ceiling for 185 m) and under
    // the last 350 m of the route (which flies 36 m over its line). It is MODELLED (Q3): at the hoist the cloth hangs from six rope-bound
    // necks in pipe folds with swags between the lashings; further out three long folds run its length; large waves
    // travel from hoist to tail with ripples on them, a slow roll turns stretches of it toward the light, the tail
    // cracks every four seconds. The three crayon tones meet through strokes, the deepest troughs and the faces folded
    // under take a soft charcoal shade over the wax.
    const BANNER_GLSL = /* glsl */`
uniform float uBnWind;
float bn_h(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float bn_n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(bn_h(i), bn_h(i + vec2(1., 0.)), f.x), mix(bn_h(i + vec2(0., 1.)), bn_h(i + vec2(1., 1.)), f.x), f.y); }
// THE LONG FOLDS of the free cloth (P3): three troughs and four crests of unequal width run the cloth's whole length side
// by side; they wander a little together and breathe in width on the way down it and never merge, split or close into
// islands. bn_g: the fold coordinate, a whole number in the bed of each trough (-1, 0, 1), a half on each crest; the
// hems ride on crests. bn_fold: the height of the fold, 0 in a trough's bed to 1 on a crest.
float bn_g(float a, float s){
  float wa = a + .15 * sin(a * 3.3 + 1.2) + .05 * sin(a * 8.1 + .4);
  return wa * (1.44 + .12 * (bn_n(vec2(s * .0043, 9.)) - .5)) + .3 * (bn_n(vec2(s * .0031, 3.)) - .5);
}
float bn_fold(float a, float s){ return .5 - .5 * cos(6.2832 * bn_g(a, s)); }
// x: displacement along the cloth's normal (m), y: the slope of its two long waves along the cloth as the tone takes it
// (the ripples move the cloth but are left out of the tone, which they would only break into spots), z: the slow roll (radians, port hem up, so
// the cloth shows its under face to the valley and to the route beside it and stands clear above the summit ridge)
// at s metres from the hoist, a = -1..1 across
vec3 bn_wave(float s, float a, float t){
  float e = smoothstep(8., 200., s) * uBnWind;
  // ON THE POUR (the cloth's first 360 to 560 m, where its line comes down at 29 degrees and levels out, and where the route passes over the hem) the waves are long swells: a
  // wave as steep as the free cloth's would stand its front upright there and cut the pour into treads and risers. The
  // two long waves and the ripples come in as the line levels out; one swell 330 m long carries the pour.
  float lev = smoothstep(360., 560., s);
  float k0 = 6.2832 / 330., k1 = 6.2832 / 172., k2 = 6.2832 / 71., k3 = 6.2832 / 27., k4 = 6.2832 / 11.5;
  float p0 = k0 * (s - 17. * t) + a * .35, A0 = 6. * smoothstep(20., 160., s) * (1. - lev) * uBnWind;
  float p1 = k1 * (s - 17. * t) + a * .5, p2 = k2 * (s - 20. * t) - a * .9 + 1.7, p3 = k3 * (s - 23. * t) + a * 1.6 + .4, p4 = k4 * (s - 26. * t) + a * 3.;
  float fine = 1. - smoothstep(260., 480., s);      // the ripples are left out where no eye comes near enough to see them
  float A1 = 11.5 * e, A2 = 4. * e, A3 = (.25 * uBnWind + 1.1 * e) * (.5 + .5 * fine) * mix(.22, 1., lev), A4 = (.1 * uBnWind + .35 * e) * fine * mix(.25, 1., lev);
  float d = A0 * sin(p0) + A1 * mix(.14, 1., lev) * sin(p1) + A2 * mix(.12, 1., lev) * sin(p2) + A3 * sin(p3) + A4 * sin(p4);
  // the tone keeps the waves' passing at their full measure on the pour too, from 60 m under the ring: light and shade
  // travel down the cloth
  float sl = (11.5 * k1 * cos(p1) + 4. * k2 * cos(p2)) * smoothstep(8., 60., s) * uBnWind;
  // the forked tail cracks every four seconds: a whip runs down the last 150 m and the points flick
  float tp = fract(t / 4.);
  float sc = ${(BANNER.L - 150).toFixed(1)} + 165. * smoothstep(0., .5, tp);
  float q = (s - sc) / 15.;
  float whip = exp(-q * q) * 6.5 * smoothstep(${(BANNER.L - 190).toFixed(1)}, ${(BANNER.L - 90).toFixed(1)}, s) * (1. - smoothstep(.5, .62, tp));
  float flick = smoothstep(${(BANNER.L - 44).toFixed(1)}, ${BANNER.L.toFixed(1)}, s) * 8. * smoothstep(.4, .5, tp) * (1. - smoothstep(.52, .8, tp)) * (a > 0. ? 1. : -.7);
  float roll = (.3 + .22 * sin(s / 170. - t * .13 + 1.)) * smoothstep(420., 620., s) * (1. - .75 * smoothstep(${(BANNER.L - 230).toFixed(1)}, ${(BANNER.L - 90).toFixed(1)}, s));   // the forked tail flies nearly flat, so its two points stand apart from below     // none over the pour and where the route crosses the hem; the greatest roll, .52, is what the clear-air check takes
  return vec3(d + whip + flick, sl - whip * q * .13, roll);
}`;
    const portB = V3(UPWIND[1], 0, -UPWIND[0]);
    const bannerMat = new THREE.ShaderMaterial({
      uniforms: { ...style.clothUniforms('emerald'), uBnWind: { value: 0.75 + 0.3 * WIND.k }, uRingC: { value: V3(RING.c[0], RING.c[1], RING.c[2]) }, uPortB: { value: portB } },
      vertexShader: /* glsl */`
${BANNER_GLSL}
uniform float uTime;
attribute vec3 aAc;      // level, across the cloth's own line here, to port
attribute vec4 aCl;      // across -1..1, metres from the hoist, half width here, 0
attribute vec3 aT;       // the line's own direction here, toward the tail
uniform vec3 uRingC, uPortB;   // the ring's middle; level, across the wind, to port
varying vec3 vP, vN, vT;
varying vec4 vCl;
void main(){
  float a = aCl.x, s = aCl.y;
  vec3 w = bn_wave(s, a, uTime);
  float cr = cos(w.z), sr = sin(w.z);
  vec3 across = aAc * cr + normal * sr, nrm = normal * cr - aAc * sr;
  float free = smoothstep(4., 130., s);
  // six lashings on the ring's rim (a = -1, -.6, -.2, .2, .6, 1): at each the cloth is gathered into a neck a third of its
  // width there, between them the hoist swags back and down, and the cloth bulges once between each pair for its first 26 m
  float ua = fract(a * 2.5) - .5, ua2 = 2. * abs(ua);
  float ag = (floor(a * 2.5) + .5 + ua * mix(mix(.3, 1., ua2 * ua2 * ua2), 1., smoothstep(.5, 10., s))) / 2.5;
  float lash = ua2;
  float swag = sin(lash * 1.5708);
  float relief = (bn_fold(a, s) - .5) * 5.5 * free + swag * 1.5 * smoothstep(0., 5., s) * (1. - smoothstep(8., 26., s));
  float billow = (1. - a * a) * (1.2 + 3.6 * free) * (1. + .25 * sin(uTime * .31 + s * .01));
  float sway = sin(uTime * .43 + s * .008) * 9. * smoothstep(520., 900., s);
  // the hems flutter: a short quick wave runs down each edge of the free cloth (its outermost metre and a half), port and starboard out of step
  float flut = smoothstep(.9, 1., abs(a)) * free * (1.3 * sin(s * .42 - uTime * 4.6 + sign(a) * 1.9) + .7 * sin(s * .19 - uTime * 2.3 + a * 4.));
  // the waves heave the cloth mostly up and down, so they show in its outline from the valley and from beside it
  vec3 p = position + across * (ag * aCl.z) + nrm * (.45 * w.x + relief + billow + flut) + normal * (.85 * w.x) + aAc * sway
         + aT * (4.2 * swag * (1. - smoothstep(0., 10., s))) - normal * (1.7 * swag * (1. - smoothstep(0., 14., s)));
  // S5: GATHERED UP INTO THE RING. The head of the cloth lies on an arc under the lower half of the ring's rim (hung
  // from six lashings, swagging out and back between them) and opens out from that trough into the flying sheet
  float hk = 1. - smoothstep(0., ${HOIST.open.toFixed(1)}, s), al = ag * ${HOIST.half.toFixed(2)};
  vec3 er = uPortB * sin(al) - vec3(0., cos(al), 0.);
  vec3 pr = uRingC + er * (${HOIST.r.toFixed(2)} + 2.2 * swag * (1. - smoothstep(0., 12., s))) + vec3(aT.x, 0., aT.z) * (s + 3.4 * swag * (1. - smoothstep(0., 10., s)));
  p = mix(p, pr, hk * hk * (3. - 2. * hk));
  nrm = normalize(mix(nrm, -er, hk));
  vP = p; vN = nrm; vT = aT; vCl = aCl;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
${CLOTH_GLSL}
${BANNER_GLSL}
varying vec3 vP, vN, vT;
varying vec4 vCl;
void main(){
  float a = vCl.x, s = vCl.y, hwid = vCl.z;
  // the forked tail: a notch cut from the end
  if ((s - ${(BANNER.L - BANNER.fork).toFixed(1)}) / ${BANNER.fork.toFixed(1)} > abs(a) + .02) discard;
  float fw = sw_foot(vP);
  float wpx = 2. / max(fwidth(a), 1e-5);                              // the cloth's width in pixels (a slope across pixels)
  vec3 w = bn_wave(s, a, uTime);
  vec3 N = normalize(vN - vT * w.y + vec3(0., 1e-5, 0.));
  float side = gl_FrontFacing ? 1. : -1.;
  // GATHERED WHERE IT IS LASHED (Q3, and the seventh review). Three families of folds, each a coordinate of its own whose
  // whole numbers are the beds of its troughs; their tones are cross-faded by place, never cut:
  //   the LONG FOLDS of the free cloth (bn_g), from 30 m out to the tail;
  //   PIPE FOLDS, six and a half to each lashing's span, parallel in the cloth's own metres, so that in space they run
  //   out of each roped neck (where the mesh gathers the cloth) and open with it; they die away between 30 and 170 m
  //   from the ring, riding on the long folds, and are left out where they would crowd under the pixel;
  //   SWAGS, U-shaped folds hanging between two necks over the cloth's first 20 m (lower in the middle of the span).
  float ua = fract(a * 2.5) - .5;                                     // across one lashing's span: 0 at its neck, +-.5 half way to the next
  float al = ua / 2.5 * hwid;                                         // metres of cloth across from the nearest lashing
  float GL = bn_g(a, s);
  float GP = a * 16.25 + .3 * sin(a * 37. + 1.3) + .05 * sin(a * 71. + s * .03) + .16 * sin(s * .045 + a * 7.);   // pipe folds of unequal width
  float sag = sin(3.14159 * ua); sag *= sag;
  float GS = (s - 7.5 * sag) / 3.4;
  float wP = (1. - smoothstep(30., 170., s)) * (1. - smoothstep(.1, .26, fwidth(GP)));
  float wS = smoothstep(.15, .34, abs(ua)) * (1. - smoothstep(9., 21., s - 7.5 * sag)) * (1. - smoothstep(.2, .5, fwidth(GS)));
  // and, wherever the cloth is wide enough in the frame to carry them (each ten pixels and more: a slope across
  // neighbouring pixels), the MIDDLE FOLDS, four to each long fold and bedded in it, so the pipe folds of the necks run
  // on down the pour as folds and the cloth beside the eye is folds from hem to hem
  float GM = 4. * GL + .2 * sin(s * .021 + a * 9.) + .12 * sin(s * .0083 - a * 5. + 2.);
  float wM = 1. - smoothstep(.09, .2, fwidth(GM));
  float cL = cos(6.2832 * GL), cP = cos(6.2832 * GP), cS = cos(6.2832 * GS), cM = cos(6.2832 * GM);
  float cLM = mix(cL, .5 * cL + .66 * cM, wM), sLM = mix(sin(6.2832 * GL), sin(6.2832 * GM), wM);
  float cg = mix(mix(cLM, .55 * cLM + .7 * cP, wP), cS, wS);
  // the mid tone holds most of the cloth, the shade tone lies in the bed of each fold, the light tone breaks on each
  // crest; the long waves and the slow roll only nudge it, so no tone lies across the cloth and none closes into a blot
  float v = .543 - .2 * cg - .1 * smoothstep(.6, 1., cg)
          - .11 * w.y + .05 * dot(N, uLightDir) * side - .045 * sin(s / 170. - uTime * .13 + 1.);
  // where the long folds crowd under the pixel (the cloth seen nearly edge on across its width) they cannot be drawn:
  // there the cloth is laid in its mid tone alone (a slope taken across neighbouring pixels: lawful)
  float crowd = smoothstep(.16, .45, fwidth(GL));
  v = mix(v, .53, crowd * (1. - wS));
  // THE UNDER FACE IS THE SHADE FACE (the eleventh review: the cloth has weight). Seen from below the cloth is laid in
  // its shade tone, the mid tone left only on the bellies between the folds' beds, where the light comes through, and
  // the light tone only in a band along the port hem, the hem toward the light
  float under = side > 0. ? 1. : 0.;      // (the mesh is wound so that its front is the face turned to the ground)
  v += under * (-.2 + .48 * smoothstep(.9, .975, a));
  // one pencil line in each fold's bed, of uneven weight, broken where the hand lifted
  float lw = .55 + .45 * bn_n(vec2(s * .09, floor(GP + .5) * 3.7));
  float lwM = .5 + .5 * bn_n(vec2(s * .05, floor(GM + .5) * 2.3));
  float fold = max(max(max(sw_foldLine(GL, wpx) * (1. - .6 * wP), sw_foldLine(GM, wpx) * wM * lwM * (1. - .5 * wP)), sw_foldLine(GP, wpx) * wP * lw) * (1. - wS), sw_foldLine(GS, wpx) * wS * lw)
             * mix(.45, 1.15, smoothstep(40., 170., wpx)) * smoothstep(1.5, 4., s);
  // the crayon is worked four and a half times larger on a cloth this size: strokes a hand's width at the drawing's scale.
  // THE TONES MEET IN STROKES (P3): the strokes are 3 to 6 pixels wide at any distance and each carries its tone a little
  // past its neighbours (sw_comb), so every edge between two tones is strokes of both lying side by side; they run the
  // cloth's own length, along the pipe folds and the long folds alike. Where the cloth is some hundreds of pixels wide
  // (beside the eye) a stroke carries its tone less far, so no tone ends on a row of level cuts.
  sw_streak = .3;
  // Seen large (some hundreds of pixels wide) it is plainly wax on card: narrower strokes whose ends taper (sw_tip), a
  // hair of bare card along half their joins and flecks of card where the wax skipped.
  float big = smoothstep(110., 380., wpx);
  sw_comb = mix(mix(.1, .62, smoothstep(50., 190., s)), .1, crowd) * (1. - .25 * big);
  sw_strokeW = mix(1.6, 1.2, big);
  sw_wax = vec2(mix(.14, .6, big), mix(.3, .8, big));
  sw_tip = big;
  float sx = (a + (1. - smoothstep(30., 170., s)) * (GP - a * 16.25) / 16.25) * hwid;      // near the ring a stroke keeps to its pipe fold
  vec3 col = sw_crayon(vec2(sx, s) * .22, clamp(v, 0., 1.), 99., vP, fw, .37, fold, smoothstep(14., 50., wpx));   // the hem is drawn below, at this cloth's own scale
  // SHADE AND WEIGHT (Q3): stumped charcoal over the wax, soft, with the tooth in it: a touch in the bed of the deepest
  // folds, a veil on the flank of each long wave that falls away from the light, and a little more on the cloth's under face
  float deep = smoothstep(.3, .95, cg) * (.5 + .5 * smoothstep(-.4, .5, mix(sLM, sin(6.2832 * GP), wP))) * (.34 + .12 * wP) * (.55 + .45 * smoothstep(60., 200., wpx));
  float flank = smoothstep(.02, .22, -w.y * side) * .26;
  // (under the cloth the charcoal is rubbed into every fold's bed, and a veil of it lies over the whole face)
  float shadeK = (deep * (1. + .9 * under) + flank + under * (.1 + .3 * smoothstep(.1, .8, cg))) * (1. - .6 * crowd) * (.75 + .5 * sw_tooth(vec3(a * hwid * .22, s * .09, 3.), fw * .2));
  col = mix(col, uCharcoal, clamp(shadeK, 0., .58 + .16 * under));
  // and in the bed of each long fold the charcoal is pressed to its full weight: the darkest dark of the frame lies in the cloth
  col = mix(col, uCharcoal, sw_foldLine(GL, wpx) * (1. - .6 * wP) * (1. - wS) * smoothstep(40., 120., wpx) * smoothstep(1.5, 4., s));
  // THE HEM (the ninth review): on a cloth 110 m wide the hem is a turned band 1.2 m wide, ruled along both its edges (a
  // doubled pencil line), with an eyelet every 3 m along its whole length; in places the wax misses it and leaves card.
  // Every measure is floored by the pixel's footprint ACROSS the hem (fh) and ALONG the cloth (fs), each a slope taken
  // across neighbouring pixels: a line never thins under 1.6 pixels, the band never under 7.
  float hd = (1. - abs(a)) * hwid;
  // (the notch of the forked tail is hemmed like the sides: each point carries its ruled band on both its edges)
  float nk = (s - ${(BANNER.L - BANNER.fork).toFixed(1)}) / ${BANNER.fork.toFixed(1)};
  hd = min(hd, nk > 0. ? (abs(a) + .02 - nk) * hwid * .8 : 1e4);
  float fh = max(fwidth(hd), 1e-4), fs = max(fwidth(s), 1e-4);
  float hb = max(1.2, 7. * fh), hlw = max(.07, .8 * fh), hOn = smoothstep(1.5, 4., s);
  float hemIn = 1. - smoothstep(hb, hb + fh, hd);
  float miss = smoothstep(.5, .6, bn_n(vec2(s * .06, a > 0. ? 3.3 : 8.1))) * hemIn * hOn;
  col = mix(col, uCard, .85 * miss * (.55 + .45 * sw_tooth(vec3(a * hwid * .22, s * .09, 5.), fw * .2)));
  float hl2 = max(1. - smoothstep(hlw, hlw + fh, abs(hd - hb)), 1. - smoothstep(hlw * 1.3, hlw * 1.3 + fh, hd));
  col = mix(col, mix(uGraphite, uCharcoal, .6), .9 * hl2 * (.72 + .28 * bn_n(vec2(s * .11, 5.))) * hOn);
  // AN EYELET AT ITS TRUE SIZE (S7): 0.6 m across, every 3 m; drawn only while it is over two pixels across (fe: a
  // pixel in eyelet radii, by the footprint across the hem and along the cloth), whole from three pixels up; no floor
  float fe = max(fh, fs) / .3, l3 = length(vec2(hd - .5 * hb, (fract(s / 3.) - .5) * 3.)) / .3;
  float w3 = (1. - smoothstep(.62, 1., fe)) * hOn;
  col = mix(col, uCard, .9 * (1. - smoothstep(.68 - .5 * fe, .68 + .5 * fe, l3)) * w3);
  col = mix(col, uCharcoal, .88 * (1. - smoothstep(max(.3 - .5 * fe, 0.), .5 + .5 * fe, abs(l3 - 1.))) * w3);
  // each lashing: the gathered neck bound for its first 6 m with crossing turns of heavy rope, five each way (rope is
  // bare card between two ruled pencil edges, never under two pixels). THE CLOTH STAYS IN THE NECK (the ninth review):
  // where the crossing turns would crowd under ten pixels one family alone is ruled, five counted turns with the
  // gathered cloth between them, and the neck's pleats are pencilled three or four to a neck; where those would crowd
  // under three pixels every other turn is ruled, and further off none: the neck is then pleated cloth alone, never a
  // blank band of card.
  float neck = (1. - smoothstep(5.9, 6.3, s)) * (1. - smoothstep(4.6, 5.6, abs(al)));
  float pleat = sw_foldLine(GP * .5 + .25, wpx) * (1. - smoothstep(5., 9., s)) * (1. - smoothstep(4.6, 5.6, abs(al)));
  col = mix(col, mix(uGraphite, uCharcoal, .7), .8 * pleat);
  float alg = al * .3;
  float q1 = alg * .5 + s * .8, q2 = -alg * .5 + s * .8 + .5;
  float fr = max(max(fwidth(q1), fwidth(q2)), 1e-4);
  float one = smoothstep(.1, .2, fr), wide = smoothstep(.3, .42, fr), gone = smoothstep(.56, .76, fr);
  float d1 = abs(fract(q1) - .5), d2 = abs(fract(q2) - .5);
  float dr = mix(mix(min(d1, d2), d1, one), abs(fract(q1 * .5) - .5) * 2., wide);
  float rw = max(.16, mix(1.5, 1., one) * fr);
  float rope = (1. - smoothstep(rw, rw + fr, dr)) * (1. - gone);
  float edge = rope * mix(smoothstep(rw - 1.6 * fr, rw - .6 * fr, dr), .6, one);
  col = mix(col, mix(uCard, mix(uGraphite, uCharcoal, .3), max(edge, .12)), rope * neck);
  gl_FragColor = vec4(col, 1.);
}`, side: THREE.DoubleSide, fog: false });
    {
      const NA = 55, NL = 280, nv = (NA + 1) * (NL + 1), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), acr = new Float32Array(nv * 3), cl = new Float32Array(nv * 4), idx = [];
      const c = V3(0, 0, 0), c2 = V3(0, 0, 0), n0 = V3(0, 0, 0), ac = V3(0, 0, 0);
      for (let j = 0; j <= NL; j++) {
        // rows crowd toward the hoist, where the cloth is gathered and where the route comes nearest it: 1.1 m
        // apart at the ring, under 3 m over the first 180 m, 7.5 m at the tail (which no eye comes within 250 m of, and
        // where the ripples are left out), so the short waves bend the cloth and never crease it; 55 columns, eleven
        // between each pair of lashings, so the gathered necks are round
        const tj = j / NL, s = BANNER.L * (0.72 * tj * tj + 0.28 * tj);
        bannerLine(s, c); bannerLine(s + 0.5, c2);
        c2.sub(c).normalize();
        ac.set(-c2.z, 0, c2.x).normalize(); if (ac.dot(portB) < 0) ac.negate();
        n0.crossVectors(ac, c2).normalize(); if (n0.y < 0) n0.negate();
        // 80 m where it is lashed; the gathers open out to 110 m by 260 m from the hoist; further out it opens to 116 m
        // (620 m out), then narrows to 84 m at the fork
        const half = lerp(lerp(BANNER.wHoist / 2, BANNER.wMid / 2, smoothstep(40, 260, s)) + (BANNER.wFar - BANNER.wMid) / 2 * smoothstep(380, 620, s), BANNER.wTail / 2, smoothstep(680, BANNER.L - BANNER.fork, s));
        if ((j & 31) === 31) await ctx.yield();
        for (let i = 0; i <= NA; i++) {
          const o = j * (NA + 1) + i;
          pos[o * 3] = c.x; pos[o * 3 + 1] = c.y; pos[o * 3 + 2] = c.z;
          nor[o * 3] = n0.x; nor[o * 3 + 1] = n0.y; nor[o * 3 + 2] = n0.z;
          tan[o * 3] = c2.x; tan[o * 3 + 1] = c2.y; tan[o * 3 + 2] = c2.z;
          acr[o * 3] = ac.x; acr[o * 3 + 1] = ac.y; acr[o * 3 + 2] = ac.z;
          cl[o * 4] = -1 + (2 * i) / NA; cl[o * 4 + 1] = s; cl[o * 4 + 2] = half; cl[o * 4 + 3] = 0;
        }
      }
      for (let j = 0; j < NL; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c3 = a + NA + 1, d = c3 + 1; idx.push(a, c3, b, b, c3, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aT', new THREE.BufferAttribute(tan, 3)); g.setAttribute('aAc', new THREE.BufferAttribute(acr, 3)); g.setAttribute('aCl', new THREE.BufferAttribute(cl, 4));
      g.setIndex(idx);
      const banner = new THREE.Mesh(g, bannerMat);
      banner.frustumCulled = false;
      scene.add(banner);
    }
    await ctx.yield();
    // ---- the summit frame (R3, S5): the ring on two legs, six lashings on its lower rim and five stays, all ruled steel,
    // bare. Laid out in the summit's own frame (+X' port, +Z' up the wind) and turned into the world.
    const cable = { pos: [], tan: [], k: [], idx: [] };
    function cableLine(a, b, r, sag = 0.012, glance = true, ray = false) {     // a ruled cable (or a chalk ray): a ribbon turned to the eye in its shader
      const n = 10, base = cable.pos.length / 3, len = a.distanceTo(b), t = b.clone().sub(a).normalize();
      for (let i = 0; i <= n; i++) {
        const u = i / n, y = a.y + (b.y - a.y) * u - sag * len * 4 * u * (1 - u);
        for (const sg of [-1, 1]) { cable.pos.push(a.x + (b.x - a.x) * u, y, a.z + (b.z - a.z) * u); cable.tan.push(t.x, t.y, t.z); cable.k.push(sg, r, ray ? 2 + u : glance ? u : -1); }
        if (i < n) { const k = base + i * 2; cable.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
    }
    // the sown field's far edge and its two sides are ruled lines that hold at any distance (M4), with the far corner posts
    for (const sx of [-1, 1]) {
      cableLine(V3(sx * 210.4, 1.0, FIELD.z0), V3(sx * 210.4, 1.0, FIELD.z1 + 0.4), 0.07, 0, false);
      cableLine(V3(sx * 211.3, 0, FIELD.z1 + 0.9), V3(sx * 211.3, 3.4, FIELD.z1 + 0.9), 0.17, 0, false);
    }
    cableLine(V3(-214, 1.0, FIELD.z1 + 0.4), V3(214, 1.0, FIELD.z1 + 0.4), 0.09, 0, false);
    {
      const hwS = [];
      const gy = (lx, lz) => landH(toWorldX(lx, lz), toWorldZ(lx, lz)) - 0.25;
      const Lp = (lx, y, lz) => V3(toWorldX(lx, lz), y, toWorldZ(lx, lz));
      const LB = (w, h, d, lx, y, lz, ry = 0) => ruledBox(w, h, d, TR(toWorldX(lx, lz), y, toWorldZ(lx, lz), ry + WIND_OFF));
      const ry = RING.c[1], RR = RING.r + 1.7;
      // a place on the ring's rim: a radians round from its foot (to port for a over 0), r metres from its middle
      const rim = (a, r, lz = 0) => Lp(Math.sin(a) * r, ry - Math.cos(a) * r, lz);
      // TWO LEGS CARRY THE RING (S5: no boom, no mast): heavy tubes from bedded plates on the summit's faces, 40 m to
      // either hand and 12 m up the wind, to the ring's two shoulders just above the cloth's uppermost lashings; a
      // bolted flange joint on each, and at each foot a plate with four bolt heads, a gusset and two raked stakes
      for (const sg of [-1, 1]) {
        const fx = sg * 40, fz = 12, fy = gy(fx, fz), foot = Lp(fx, fy, fz), head = rim(sg * 1.75, RR + 0.6, 0.4), mid = foot.clone().lerp(head, 0.45), dir = head.clone().sub(foot).normalize();
        hwS.push(ruledTube(foot, head, 1.0, 10));
        for (const o of [-0.35, 0.35]) hwS.push(ruledTube(mid.clone().addScaledVector(dir, o - 0.12), mid.clone().addScaledVector(dir, o + 0.12), 1.7, 12));   // the flange pair
        hwS.push(ruledTube(foot.clone().addScaledVector(dir, 0.2), foot.clone().addScaledVector(dir, 1.5), 1.5, 10));                                     // the shoe
        hwS.push(ruledTube(head.clone().addScaledVector(dir, -1.6), head.clone().addScaledVector(dir, 0.2), 1.5, 10));                                    // the head fitting on the ring
        hwS.push(LB(8.6, 0.6, 8.6, fx, fy + 0.3, fz));                                                                                                   // the bedded plate
        for (const bx of [-3.4, 3.4]) for (const bz of [-3.4, 3.4]) hwS.push(LB(0.8, 0.6, 0.8, fx + bx, fy + 0.9, fz + bz));                             // bolt heads
        hwS.push(LB(3.2, 2.8, 0.4, fx + sg * 2.3, fy + 1.8, fz));                                                                                        // gusset
        for (const bz of [-2.8, 2.8]) hwS.push(ruledTube(Lp(fx + sg * 3.2, fy - 0.4, fz + bz), Lp(fx + sg * 6.6, fy + 4.6, fz + bz), 0.3, 6));            // raked stakes
      }
      // THE RING (P7, S5): heavy steel, 42 m across over all, a box section 3 m deep, so its face is a double line with
      // the tube's thickness between; twelve bolted flange joints round it; bare all the way round. It stands across the
      // wind on its two legs, and the cloth hangs from the lower half of its rim: the road of cloth runs up into it.
      const ringM = new THREE.Matrix4().makeRotationX(Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationY(RING_YAW)).setPosition(RING.c[0], ry, RING.c[2]);
      hwS.push(ruledRing(RR, 0, 3.0, 2.6, 144).applyMatrix4(ringM));
      for (let k = 0; k < 12; k++) {
        const a = ((k + 0.5) / 12) * Math.PI * 2;
        for (const o of [-0.3, 0.3]) hwS.push(ruledBox(3.9, 0.22, 3.5, new THREE.Matrix4().makeRotationZ(a + o / RR).setPosition(Math.cos(a + o / RR) * RR, Math.sin(a + o / RR) * RR, 0).premultiply(new THREE.Matrix4().makeRotationY(RING_YAW).setPosition(RING.c[0], ry, RING.c[2]))));
      }
      // THE OPENING IS A DRAWN LENS (S5). Between the steel and the opening (the portal, 2.2 m inside the steel's inner
      // face), and in over the veil's outer two thirds while the opening still holds its chalk veil (until the route
      // comes within the portal's own revealDistance, by the metres of route left), the chalk is laid in RADIAL strokes
      // with card between them, thin and broken toward the steel and closing up into chalk toward the middle; over them
      // lie five ruled pencil circles of uneven weight, lighter inward, and short radial pencil ticks across each. The
      // innermost third is the veil's own clear chalk. Each stroke's edge is filtered by the pixel's short side on the
      // ring's plane; where that cannot hold the strokes they are their even tone.
      {
        const laid = new THREE.Mesh(new THREE.RingGeometry(PORTAL_R - 0.1, RR - 1.45, 96, 1), new THREE.ShaderMaterial({ uniforms: { ...U, uOpen: ringOpen },
          vertexShader: /* glsl */`
uniform float uOpen;
varying vec2 vL; varying vec3 vP;
void main(){
  // the inner edge reaches in over the veil's outer two thirds while the veil is certain to be there (uOpen 1)
  float r = length(position.xy), inner = step(r, ${PORTAL_R.toFixed(2)});
  vec3 p = position * mix(1., mix(1., .34, uOpen), inner);
  vL = p.xy; vec4 wp = modelMatrix * vec4(p, 1.); vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
          fragmentShader: /* glsl */`
${STYLE_GLSL}
varying vec2 vL; varying vec3 vP;
void main(){
  float r = max(length(vL), .5), rn = r / ${PORTAL_R.toFixed(2)};
  float ang = atan(vL.y, vL.x) / 6.2832;                                   // r is never 0 here: the lens has no middle
  float fs = max(sw_short(vP), 1e-4), th = sw_tooth(vP, sw_foot(vP));
  // radial chalk strokes: 170 round the opening, each with an inner and an outer end of its own
  float c = ang * 170., id = floor(c), f = abs(fract(c) - .5), fn = fs / r * 27.;
  float h1 = sw_h11(id * 1.9 + 4.), h2 = sw_h11(id * 3.1 + 9.);
  float rIn = .3 + .42 * h1 * h1, rOut = 1.02 + .14 * h2;
  float k = smoothstep(.36, 1.08, rn);                                      // 0: closed up into chalk, 1: thin, at the steel
  float taper = clamp((rn - rIn) / .12, 0., 1.) * clamp((rOut - rn) / .1, 0., 1.);
  float w = mix(.56, .15, k) * (.7 + .3 * sw_vn2(vec2(rn * 9. + h1 * 31., id * .7))) * sqrt(taper);
  float cov = (1. - smoothstep(w - .6 * fn, w + .6 * fn, f)) * step(.001, taper);
  cov = mix(cov, 2. * w, smoothstep(.22, .42, fn));
  cov = max(cov, 1. - smoothstep(.34, .46, rn));                            // the veil's own chalk, inside
  vec3 col = mix(uCard, uChalk, clamp(cov, 0., 1.) * (.86 + .14 * th));
  // five ruled pencil circles, lighter inward, each broken where the hand lifted; never under 1.5 pixels
  float lw = max(.09, .75 * fs), pen = 0.;
  for (int i = 0; i < 5; i++) {
    float fi = float(i), rk = ${PORTAL_R.toFixed(2)} * (.46 + .125 * fi) + .12 * sin(ang * 6.2832 * 3. + fi * 2.1);
    float on = smoothstep(.2, .3, sw_vn2(vec2(ang * 23. + fi * 7.3, fi)));
    pen = max(pen, (1. - smoothstep(lw, lw + fs, abs(r - rk))) * on * (.42 + .13 * fi));
  }
  // short radial pencil ticks across the circles: 64 round, each 1.5 to 3.5 m long about a circle of its own
  float c2 = ang * 64., id2 = floor(c2), g1 = sw_h11(id2 * 2.7 + 1.), g2 = sw_h11(id2 * 5.3 + 2.);
  float rt = ${PORTAL_R.toFixed(2)} * (.46 + .125 * floor(g1 * 5.)), len = .75 + g2;
  float tick = (1. - smoothstep(lw, lw + fs, abs(fract(c2) - .5) * r * .0982)) * (1. - smoothstep(len, len + fs, abs(r - rt))) * step(.3, g2);
  pen = max(pen, tick * (.5 + .3 * g1));
  col = mix(col, mix(uGraphite, uCharcoal, .3), pen * (.8 + .2 * th));
  gl_FragColor = vec4(col, 1.);
}`, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }));
        // (a hand's breadth on the traveller's side of the veil: close to, the depth offset alone no longer keeps the
        // drawn lens in front of the engine's veil)
        laid.position.set(RING.c[0] - HEAD[0] * 0.35, ry, RING.c[2] - HEAD[1] * 0.35); laid.rotation.y = RING_YAW; laid.frustumCulled = false;
        scene.add(laid);
      }
      // SIX LASHINGS round the lower half of the rim (S5): at each, six turns of heavy rope go round the ring's tube side
      // by side (rope only at a fixing) and two tails run down through the eyelets to the cloth's gathered neck
      for (let k = 0; k < 6; k++) {
        const a = (-1 + 0.4 * k) * HOIST.half;
        for (let q = 0; q < 6; q++) { const a2 = a + ((q - 2.5) * 0.62) / RR, t = 0.2 / RR; hwS.push(ruledTube(rim(a2 - t, RR), rim(a2 + t, RR), 2.35, 10)); }
        for (const sg of [-1, 1]) hwS.push(ruledTube(rim(a + sg * 0.05, RR + 1.4, -0.4), rim(a + sg * 0.02, HOIST.r - 0.2, -1.6), 0.3, 6));
      }
      // FIVE STAYS, each one firm ruled line (no lattice, no loose ends): the ring's crown to three anchors up the wind
      // (one on the wind's own line, one to either hand of it), each shoulder to an anchor abeam on its own hand. All lie
      // up the wind of the ring's plane or abeam of it: none comes near the cloth or the flown line. Each anchor is
      // drawn with an engineer's care: a bedded plate, two raked stakes, an eye post, a turnbuckle on the cable.
      // [the stay's upper end, the anchor's place in the summit's frame: metres to port, metres up the wind]
      const crown = rim(Math.PI, RR + 1.3);
      const guys = [[crown, 0, 150], [crown, 62, 96], [crown, -62, 96], [rim(2.3, RR + 1.2), 104, 14], [rim(-2.3, RR + 1.2), -100, 14]];
      for (const [B, glx, glz] of guys) {
        const ax = toWorldX(glx, glz), az = toWorldZ(glx, glz);
        const ay = landH(ax, az) + 0.25, big = 3.6, A = V3(ax, ay + 1.6 * big, az);
        const d = B.clone().sub(A).normalize(), yaw = Math.atan2(d.x, d.z);
        cableLine(A, B, 0.2);
        const M = new THREE.Matrix4().makeRotationY(yaw).setPosition(A.x, ay, A.z), kit = [];
        kit.push(ruledBox(4.2 * big, 0.5, 4.2 * big, TR(0, -0.1, 0)));                                               // the bedded plate
        kit.push(ruledBox(0.5 * big, 0.5 * big, 2.4 * big, new THREE.Matrix4().makeRotationX(-Math.asin(clamp(d.y, -0.9, 0.9))).setPosition(0, 1.6 * big + d.y * 3.4 * big, Math.hypot(d.x, d.z) * 3.4 * big)));   // turnbuckle on the cable
        kit.push(ruledTube(V3(0, 0, 0), V3(0, 1.75 * big, 0), 0.2 * big, 6), ruledBox(0.9 * big, 0.6 * big, 0.25 * big, TR(0, 1.6 * big, 0)));   // the eye post and its shackle
        for (const sx of [-1, 1]) kit.push(ruledTube(V3(sx * 1.5 * big, -0.4, -1.3 * big), V3(sx * 1.5 * big, 2.3 * big, -2.9 * big), 0.13 * big, 6), ruledBox(0.7 * big, 0.2, 0.7 * big, TR(sx * 1.5 * big, 0.14, -1.42 * big)));   // raked stakes through the plate
        for (const g2 of kit) hwS.push(g2.applyMatrix4(M));
      }
      // the summit's steel is one mesh of its own, in HEAVY pencil (the ninth review): outlines two to three pixels wide,
      // charcoal down the lee side of every member, pencil hatching across its shaded faces
      const summitSteel = new THREE.Mesh(mergeGeometries(hwS, false), style.ruledMaterial({ chalk: 0.3, heavy: 1, side: THREE.DoubleSide }));
      summitSteel.frustumCulled = false; scene.add(summitSteel);
    }
    // ---- THE SQUALL AND ITS RIFT (S3): the light of the whole sheet. Behind the summit, 1,200 m up the wind from the
    // ring and square across the wind, stands ONE SQUALL: one upright sheet with a place in the world (so it slides
    // behind the horn and the ring as the traveller moves), DRAWN, not smudged: a compact mass, heaviest in its
    // middle and thinning to nothing toward both hands and toward its base, a torn hard upper edge of heaped heads
    // with chalk on them, every dark a charcoal stroke (strokes with card between them; cores of strokes closed up
    // solid), slanting pencil falls of rain under its base only with the land seen between the strokes; opaque, cut
    // out along its edges (no blending), and where no stroke falls nothing is drawn: the sky is the card. In it,
    // beside the wind's own line through the ring, ONE RIFT: a tall torn opening of bare card worked with chalk, the
    // mass round it the darkest dark of the sheet. From the run up the cloth the ring stands against the squall the
    // whole way. Through the rift the light falls in A FAN OF RULED CHALK RAYS (below). The deal (CLOUD) sets the
    // squall's height and weight; its heads by a stream of its own.
    {
      const sq = stream('squall'), SQ_D = 1200, SQ = { xc: 150, w: 700 }, RIFT = { x: 24, y: 750, h: 320, w: 92, lean: 0.12 };
      const lift = cloudName === 'bank' ? 90 : cloudName === 'ridges' ? 20 : -40, weight = cloudName === 'clear' ? 0.9 : 1;
      const X0 = SQ.xc - SQ.w - 130, X1 = SQ.xc + SQ.w + 130, Y0 = 20, Y1 = 1700;
      const g = new THREE.BufferGeometry(), pos = [], q2 = [];
      for (const [lx, y] of [[X0, Y0], [X1, Y0], [X0, Y1], [X1, Y1]]) { pos.push(toWorldX(lx, SQ_D), y, toWorldZ(lx, SQ_D)); q2.push(lx, y); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q2, 2)); g.setIndex([0, 1, 2, 1, 3, 2]);
      const sqMaterial = (uSq) => new THREE.ShaderMaterial({
        uniforms: { ...U, uSq: { value: uSq } },
        vertexShader: /* glsl */`
attribute vec2 aQ;
varying vec2 vQ; varying vec3 vP;
void main(){ vQ = aQ; vP = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
${STYLE_GLSL}
uniform vec4 uSq;        // two offsets of the heads' rule, the weight of the charcoal, a lift of the upper edge (m)
#define RIFT_X ${RIFT.x.toFixed(1)}
#define RIFT_Y ${RIFT.y.toFixed(1)}
#define RIFT_H ${RIFT.h.toFixed(1)}
#define RIFT_W ${RIFT.w.toFixed(1)}
#define RIFT_LEAN ${RIFT.lean.toFixed(2)}
#define SQ_XC ${SQ.xc.toFixed(1)}
#define SQ_W ${SQ.w.toFixed(1)}
varying vec2 vQ; varying vec3 vP;
// the torn upper edge: heaped heads, highest over the squall's middle, falling away to both hands
float sq_heads(float x){
  float a = sw_vn2(vec2(x * .0031 + uSq.x, 1.5)), b = sw_vn2(vec2(x * .0098 + uSq.y, 7.5)), c = abs(sw_vn2(vec2(x * .027 + 3., 3.1)) - .5);
  float u = (x - SQ_XC) / SQ_W;
  return 1180. + 170. * a + 90. * b - 80. * c + uSq.w + 230. * (1. - u * u);
}
// the squall's rule at a place on its sheet: x the height of its torn upper edge there, y the distance to the rift's lip
// (under 0: inside the rift), z the weight of the weather (heavy under the heads and round the rift, thinning to nothing
// toward both hands and toward its base, so the mass ends where its strokes end)
vec3 sq_field(vec2 q){
  float x = q.x, y = q.y;
  float tear = sw_vn2(q * .011) - .5, tear2 = sw_vn2(q * .043 + 7.) - .5;
  vec2 wq = q + 110. * vec2(sw_vn2(q * .0037 + 2.) - .5, sw_vn2(q * .0037 + 11.) - .5);        // torn, not rounded: the tones' rule is warped
  float top = sq_heads(x) + 40. * tear + 12. * tear2;
  float c = dot(q, vec2(.866, .5));
  // THE RIFT: a tall torn opening on the wind's line through the ring, leaning a little
  float ry = (y - RIFT_Y) / RIFT_H;
  float rx = x - (RIFT_X + RIFT_LEAN * (y - RIFT_Y) + 26. * (sw_vn2(vec2(y * .009, 5.)) - .5));
  float rw = RIFT_W * sqrt(max(1. - ry * ry, 0.)) * (.6 + .8 * sw_vn2(vec2(y * .011, 8.)));
  float dr = abs(rx) - rw + 10. * tear2 + 30. * tear + 20. * (sw_vn2(vec2(c / 9., 3.)) - .5) + (abs(ry) > 1. ? (abs(ry) - 1.) * RIFT_H : 0.);
  // the weather moves along the sheet by the world's clock (9 m a second), so the charcoal's strokes lengthen and shorten: the drawing is still being worked
  float n = sw_vn2(vec2((wq.x - uTime * 9.) * .0026 + uSq.x, wq.y * .0075)) * .6 + sw_vn2(vec2((wq.x - uTime * 9.) * .0071, wq.y * .017 + uSq.y)) * .4;
  float u = abs(x - SQ_XC) / SQ_W + .16 * tear;
  float edge = smoothstep(.5, 1.02, u), low = 1. - smoothstep(170., 420., y - 60. * tear);
  n = .5 + .46 * (n - .45) + .42 * (1. - smoothstep(10., 260., dr)) + .12 * (1. - smoothstep(0., 240., top - y)) - .85 * edge - .6 * low;
  return vec3(top, dr, n);
}
void main(){
  float x = vQ.x, y = vQ.y;
  float fw = sw_foot(vP), th = sw_tooth(vP, fw);
  float tear = sw_vn2(vQ * .011) - .5;
  vec3 F = sq_field(vQ);
  float top = F.x, dr = F.y;
  if (y > top) discard;
  // the hand's one slant: c across the strokes, a along them (metres on the sheet)
  float c = dot(vQ, vec2(.866, .5)), a = dot(vQ, vec2(-.5, .866)), fc = max(fwidth(c), 1e-5);
  float base = 250. + 90. * sw_vn2(vec2(x * .0029 + 4., 2.2)) + 30. * tear;
  float inx = 1. - smoothstep(.55, .9, abs(x - SQ_XC) / SQ_W);
  vec3 col;
  if (y < base) {
    // THE FALL OF RAIN, under the squall's base only: slanting pencil strokes in two or three falls; the land shows between the strokes
    float cr = x + .34 * (base - y), fr = max(fwidth(cr), 1e-5);
    float fall = smoothstep(.42, .6, sw_vn2(vec2(cr * .0052 + uSq.y, 3.3))) * (1. - smoothstep(.6, 1., (base - y) / max(base - 30., 1.))) * inx;
    // the rain FALLS: its strokes slide down their own slant, 10 m a second by the world's clock
    float h = sw_hatchSet(cr, (base - y) * 1.06 - uTime * 10., fr, .2 + .6 * fall) * step(.05, fall);
    if (h < .5) discard;
    col = mix(uCard, mix(uGraphite, uCharcoal, .35), .78 + .2 * th);
  } else if (dr < 0.) {
    // inside the rift: bare card, with chalk laid in long strokes at the hand's slant (a third of it) and pressed
    // along its torn lip
    float k = sw_vn2(vec2(c / (5. + 3. * fw), a / (70. + 40. * fw) + 3.));
    float lipIn = smoothstep(-16. - 4. * fw, -3., dr);
    col = mix(uCard, uChalk, max(step(.5, k), lipIn * step(.3, k)) * (.86 + .14 * th));
  } else {
    // ONE COMPACT CHARCOAL MASS, EVERY DARK LAID IN STROKES (S3; no flat shape with a smooth outline, no hatch over
    // the sky). The charcoal is laid stroke by stroke at the hand's one slant, each stroke 14 m wide on the sheet: the
    // weight of the weather is read once for each stroke, on its own centre line, so the mass ends where its strokes
    // end, each at a place of its own and tapering to a point, with bare card between and beyond them. In the cores
    // the strokes close up into pressed charcoal (the brief's charcoal itself) with hairs of card left where two
    // strokes did not meet and the card's tooth through it. Where there is no stroke there is nothing: the sky's card.
    float cs = c + 3.4 * sin(a * .008 + c * .0019) + 1.8 * sin(a * .021 + 2.);        // the strokes are a hand's: not quite parallel, not quite evenly pitched
    float SP = 14.;
    float ci = floor(cs / SP), hs = fract(sin(ci * 12.9898 + 4.1) * 43758.5453);
    vec3 Fs = sq_field(vQ + ((ci + .5) * SP - cs) * vec2(.866, .5));
    float n = Fs.z + .1 * (hs - .5) + .06 * (sw_vn2(vec2(ci * 3.7, a * .009)) - .5);
    float kM = sw_laid(cs / SP, fc / SP, (n - .3) / .12, .7 + .3 * hs);
    float kC = sw_laid(cs / SP, fc / SP, (n - .52) / .08, .92 + .6 * sw_vn2(vec2(ci * 5.3, a * .006)));
    // chalk on the lit heads: broken strokes just under the upper edge where it falls away to port, and along the rift's lip
    float lit = smoothstep(-.5, .2, (sq_heads(x) - sq_heads(x + 30.)) / 30.);
    float band = smoothstep(5., 16., top - y) * (1. - smoothstep(70., 170., top - y + 60. * tear)) * inx;
    float stroke = step(.48, sw_vn2(vec2(c / (4. + 2.6 * fw), a / (50. + 30. * fw))));
    float ck = clamp(band * lit * stroke, 0., 1.);
    if (max(max(kM, kC), ck) < .04) discard;
    vec3 mid = mix(uCard, uCharcoal, (.74 + .22 * th) * uSq.z);
    vec3 core = mix(uCharcoal, uCard, .5 * smoothstep(.74, .86, th));
    col = mix(mix(uCard, mid, kM), core, kC);
    col = mix(col, uChalk, ck * (.86 + .14 * th));
  }
  gl_FragColor = vec4(col, 1.);
}`, side: THREE.DoubleSide, fog: false });
      const squall = new THREE.Mesh(g, sqMaterial(new THREE.Vector4(sq.range(0, 40), sq.range(0, 40), weight, lift)));
      squall.frustumCulled = false; squall.renderOrder = -4; scene.add(squall);
      // THE RAYS (S3: six to eight, long, clear of the steel): a fan of ruled chalk strokes leaving the torn lip of the
      // rift's upper half on its two SIDES and rising outward over the dark of the squall, four to each hand, 260 to
      // 560 m long, laid 40 m in front of the sheet, each with a place of its own. From the run up the cloth the ring
      // and its legs and stays stand below and inside them: none crosses the steel.
      const NRAY = 8, o = V3(0, 0, 0), e = V3(0, 0, 0);
      for (let k = 0; k < NRAY; k++) {
        const hand = k < NRAY / 2 ? -1 : 1, kk = k % (NRAY / 2), t = (kk + sq.range(0.2, 0.8)) / (NRAY / 2);
        const y0 = RIFT.y + RIFT.h * (0.12 + 0.72 * t), x0 = RIFT.x + RIFT.lean * (y0 - RIFT.y) + hand * RIFT.w * 1.05 * Math.sqrt(Math.max(1 - ((y0 - RIFT.y) / RIFT.h) ** 2, 0.05));
        const el = (14 + 52 * t) * Math.PI / 180, dx = hand * Math.cos(el), dy = Math.sin(el);
        let len = sq.range(260, 560); len = Math.min(len, (1330 + lift - y0) / Math.max(dy, 0.05), (SQ.w * 0.86 - hand * (x0 - SQ.xc)) / Math.max(Math.abs(dx), 0.05));
        if (len < 120) continue;
        const dz = SQ_D - 40 - 3 * k;
        o.set(toWorldX(x0, dz), y0, toWorldZ(x0, dz)); e.set(toWorldX(x0 + dx * len, dz), y0 + dy * len, toWorldZ(x0 + dx * len, dz));
        cableLine(o, e, sq.range(3.2, 6.4), 0, false, true);
      }
    }
    await ctx.yield();
    // RULED CABLES: a ribbon turned to the eye (the direction from the thing to the eye: lawful), at least 2.6 thousandths of
    // the frame wide in the vertex shader and then cut in the fragment shader, by the pixel's footprint (fwidth of the
    // distance across the ribbon), to the cable's own width or 1.6 pixels, whichever is the greater, at any frame size
    const cableMat = new THREE.ShaderMaterial({
      uniforms: { ...U },
      vertexShader: /* glsl */`
${STYLE_VERT_GLSL}
attribute vec3 aTan, aK;   // aK: side -1 or 1, radius (m), place along the cable 0..1
varying float vC, vR, vU;
varying vec3 vP;
void main(){
  vec4 mv = viewMatrix * vec4(position, 1.);
  vec3 toEye = cameraPosition - position;
  vec3 side = cross(aTan, toEye);
  side = side / max(length(side), 1e-4);
  float hw = max(aK.y, 2.6 * sw_px(-mv.z));
  vec3 p = position + side * (aK.x * hw);
  vC = aK.x * hw; vR = aK.y; vU = aK.z; vP = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
varying float vC, vR, vU;
varying vec3 vP;
void main(){
  float fc = max(fwidth(vC), 1e-5);
  if (abs(vC) > max(vR, .8 * fc)) discard;
  float fw = sw_foot(vP), th = sw_tooth(vP, fw);
  // one chalk glance on each cable; the rest an even pencil line
  float glance = smoothstep(.41, .42, vU) * (1. - smoothstep(.47, .48, vU));
  vec3 col = mix(mix(uGraphite, uCharcoal, .45), uChalk, glance * (.8 + .2 * th));
  if (vU > 1.5) {
    // a chalk ray (R3): a ruled stroke of chalk that tapers and breaks on the card's tooth toward its far end
    float t = clamp(vU - 2., 0., 1.);
    if (abs(vC) > max(vR * (1. - .7 * t), .8 * fc) || sw_vn2(vec2(vU * 37., vR * 9.)) < .62 * smoothstep(.35, 1., t)) discard;
    col = mix(uCard, uChalk, .84 + .16 * th);
  }
  gl_FragColor = vec4(col, 1.);
}`, side: THREE.DoubleSide, fog: false });
    const hardware = new THREE.Mesh(mergeGeometries(hw, false), steel);
    hardware.frustumCulled = false;
    const cables = new THREE.Mesh(new THREE.BufferGeometry(), cableMat);
    cables.geometry.setAttribute('position', new THREE.Float32BufferAttribute(cable.pos, 3)); cables.geometry.setAttribute('aTan', new THREE.Float32BufferAttribute(cable.tan, 3)); cables.geometry.setAttribute('aK', new THREE.Float32BufferAttribute(cable.k, 3));
    cables.geometry.setIndex(cable.idx);
    cables.frustumCulled = false;
    scene.add(hardware, cables);
    await ctx.yield();
    // ---- THE HORN'S INNER DRAWING (the fourth review): pencil contours of uneven weight laid on the rock itself: one down
    // each of the four aretes from the point to the foot, one down the crest of each strong rib (broken, of unequal
    // lengths), and short ones along the lips of the rock steps where they cross the aretes, overshooting. Each is a
    // ribbon turned to the eye (the direction from the thing to the eye: lawful) and drawn by the pixel's footprint alone:
    // two to three pixels wide from near the eye out to 150 m, widening to about four at 700 m and beyond (the far peak
    // keeps a firm contour; under the ring the crest's line is a pencil line, not a bar), lighter with distance.
    {
      const dr = { pos: [], tan: [], k: [], idx: [] }, hl = stream('horn-lines');
      const drawn = (pts, halfW, tone) => {                // pts: flat [x, y, z, ...]; tone < 0: a line that fades with distance
        const n = pts.length / 3, base = dr.pos.length / 3; let along = hl.range(0, 900);
        for (let i = 0; i < n; i++) {
          const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, n - 1);
          const tx = pts[i1 * 3] - pts[i0 * 3], ty = pts[i1 * 3 + 1] - pts[i0 * 3 + 1], tz = pts[i1 * 3 + 2] - pts[i0 * 3 + 2], l = Math.hypot(tx, ty, tz) || 1;
          if (i > 0) along += Math.hypot(pts[i * 3] - pts[i * 3 - 3], pts[i * 3 + 1] - pts[i * 3 - 2], pts[i * 3 + 2] - pts[i * 3 - 1]);
          const lift = (i === 0 || i === n - 1) ? 0.25 : (i === 1 || i === n - 2) ? 0.7 : 1;      // the hand lifts at both ends
          for (const sg of [-1, 1]) { dr.pos.push(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]); dr.tan.push(tx / l, ty / l, tz / l); dr.k.push(sg, halfW, along, tone * lift); }
          if (i < n - 1) { const k = base + i * 2; dr.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        }
      };
      const onHorn = (th, r, pts) => { const x = PEAK.x + Math.cos(th) * r * HORN_R, z = PEAK.z + Math.sin(th) * r * HORN_R; pts.push(x + Math.cos(th) * 0.7, landH(x, z) + 0.7, z + Math.sin(th) * 0.7); };
      for (let a = 0; a < 4; a++) { const pts = []; for (let r = 3; r <= 548; r += 5) onHorn(ARETES[a], r, pts); drawn(pts, 0.6, 1.0); }
      await ctx.yield();
      for (let k = 0; k < NRIB; k++) {                    // the crest of rib k: where ribQ = k + 1/2, found by a few steps of its own rule
        const strong = ribStrong(k);
        if (strong < 0.52) continue;
        let r = hl.range(55, 120), th = ((k + 0.5) / NRIB) * TAU;
        // behind the point a rib's crest is a full pencil contour (the turn looks down on it); in front, a lighter line
        const ribLine = Math.cos(th) * UPWIND[0] + Math.sin(th) * UPWIND[1] > 0.25 ? 0.85 : -(0.55 + 0.45 * strong);
        const rEnd = hl.range(300, 470);
        while (r < rEnd) {
          const len = hl.range(55, 170), pts = [];
          for (let q = r - 8; q <= Math.min(r + len, rEnd) + 8; q += 6) {
            for (let it = 0; it < 3; it++) th = ((k + 0.5 - 0.55 * noise.n2(Math.cos(th) * 2.1 + 9, Math.sin(th) * 2.1 + q * 0.0045)) / NRIB) * TAU;
            hornAt(PEAK.x + Math.cos(th) * q * HORN_R, PEAK.z + Math.sin(th) * q * HORN_R, hq);
            if (ribEnv(q, hq[1]) > 0.42) onHorn(th, q, pts); else if (pts.length >= 9) { drawn(pts.slice(), 0.4, ribLine); pts.length = 0; } else pts.length = 0;
          }
          if (pts.length >= 9) drawn(pts, 0.4, ribLine);
          r += len + hl.range(14, 40);
        }
      }
      await ctx.yield();
      for (let n = 2; n <= 8; n++) for (let a = 0; a < 4; a++) {      // the lip of rock step n where it crosses arete a (the riser's top: stepQ = n + 0.78)
        if (hl() < 0.2) continue;
        const a0 = ARETES[a] - hl.range(0.12, 0.42), a1 = ARETES[a] + hl.range(0.12, 0.42), pts = [];
        for (let th = a0; th <= a1; th += 0.03) onHorn(th, clamp((n + 0.78 - 0.9 * noise.n2(Math.cos(th) * 1.7 + 3, Math.sin(th) * 1.7 + 5)) * 54, 50, 540), pts);
        if (pts.length >= 9) drawn(pts, 0.35, -hl.range(0.6, 0.9));
      }
      const drawnMat = new THREE.ShaderMaterial({
        uniforms: { ...U },
        vertexShader: /* glsl */`
${STYLE_VERT_GLSL}
attribute vec3 aTan; attribute vec4 aK;   // aK: side -1 or 1, half width (m), metres along the line, tone (negative: a lighter line that fades more with distance)
varying float vC, vH, vU, vTone;
varying vec3 vP;
void main(){
  vec4 mv = viewMatrix * vec4(position, 1.);
  vec3 toEye = cameraPosition - position;
  vec3 side = cross(aTan, toEye);
  side = side / max(length(side), 1e-4);
  float hw = (aK.w < 0. ? 2.6 : 3.3) * mix(1., 1.4, smoothstep(150., 700., -mv.z)) * sw_px(-mv.z);
  vec3 p = position + side * (aK.x * hw);
  vC = aK.x * hw; vH = hw; vU = aK.z; vP = p;
  vTone = abs(aK.w) * (1. - (aK.w < 0. ? .62 : .42) * smoothstep(450., 1500., -mv.z));
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
        fragmentShader: /* glsl */`
${STYLE_GLSL}
varying float vC, vH, vU, vTone;
varying vec3 vP;
void main(){
  float fc = max(fwidth(vC), 1e-5);
  float wgt = .4 + .6 * sw_vn2(vec2(vU * .055, 3.7));          // the hand's pressure along the line
  if (abs(vC) > max(vH * wgt, .75 * fc)) discard;
  float th = sw_tooth(vP, sw_foot(vP));
  gl_FragColor = vec4(mix(uCard, mix(uGraphite, uCharcoal, .6), clamp(vTone * (.62 + .5 * wgt) * (.85 + .3 * th), 0., 1.)), 1.);
}`, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -6 });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(dr.pos, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(dr.tan, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(dr.k, 4));
      g.setIndex(dr.idx);
      const lines = new THREE.Mesh(g, drawnMat);
      lines.frustumCulled = false; scene.add(lines);
    }
    await ctx.yield();
    const life = [];
    // ---- pencil ribbons (river braids, the far ranges): lines of slightly uneven weight, never under 1.5 pixels ------
    const pencilMat = new THREE.ShaderMaterial({
      uniforms: { ...U },
      vertexShader: /* glsl */`
${STYLE_VERT_GLSL}
attribute vec3 aSide;
attribute vec2 aW;
varying vec3 vP; varying float vTone;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.);
  vec4 mv = viewMatrix * wp;
  vec3 p = wp.xyz + normalize(mat3(modelMatrix) * aSide + vec3(0., 1e-6, 0.)) * max(aW.x, 1.15 * sw_px(-mv.z));
  vP = p; vTone = aW.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
      fragmentShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vP; varying float vTone;
void main(){
  float fw = sw_foot(vP);
  float th = sw_tooth(vP, fw);
  float wgt = .62 + .38 * sw_vn3(vP * .17);
  gl_FragColor = vec4(mix(uCard, mix(uGraphite, uCharcoal, .22), clamp(vTone * wgt * (.8 + .4 * th), 0., 1.)), 1.);
}`, side: THREE.DoubleSide, fog: false });
    const pen = { pos: [], side: [], w: [], idx: [] };
    function penLine(pts, halfW, tone, up) {            // pts: flat [x, y, z, ...]
      const n = pts.length / 3, b = pen.pos.length / 3;
      for (let i = 0; i < n; i++) {
        const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, n - 1);
        let tx = pts[i1 * 3] - pts[i0 * 3], ty = pts[i1 * 3 + 1] - pts[i0 * 3 + 1], tz = pts[i1 * 3 + 2] - pts[i0 * 3 + 2];
        let sx = 0, sy = 1, sz = 0;                       // up = null: a ribbon standing on edge (a far skyline)
        if (up) { sx = ty * up[2] - tz * up[1]; sy = tz * up[0] - tx * up[2]; sz = tx * up[1] - ty * up[0]; }
        const l = Math.hypot(sx, sy, sz) || 1; sx /= l; sy /= l; sz /= l;
        for (const sg of [-1, 1]) { pen.pos.push(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]); pen.side.push(sx * sg, sy * sg, sz * sg); pen.w.push(halfW, tone); }
        if (i < n - 1) { const k = b + i * 2; pen.idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
    }
    // the braided dry river: down the port side of the valley head, across between the field and the cone, away to starboard
    const riverCurve = new THREE.CatmullRomCurve3([[420, 0, 1060], [352, 0, 800], [336, 0, 600], [300, 0, 452], [196, 0, 404], [60, 0, 401], [-122, 0, 404], [-252, 0, 372], [-304, 0, 250], [-322, 0, 0], [-300, 0, -300], [-330, 0, -640]].map((p) => V3(p[0], p[1], p[2])));
    const NRV = 220, riv = new Float32Array((NRV + 1) * 4);
    {
      const p = V3(0, 0, 0), t = V3(0, 0, 0), rr = stream('river');
      for (let i = 0; i <= NRV; i++) { riverCurve.getPointAt(i / NRV, p); riverCurve.getTangentAt(i / NRV, t); riv[i * 4] = p.x; riv[i * 4 + 1] = p.z; riv[i * 4 + 2] = t.z; riv[i * 4 + 3] = -t.x; }
      const braids = [];
      for (let k = 0; k < 7; k++) braids.push({ a: k < 2 ? 2.2 : rr.range(4, 8.5), f: rr.range(0.05, 0.11), ph: rr.range(0, 6.28), b: k === 0 ? -11.5 : k === 1 ? 11.5 : rr.range(-5, 5), f2: rr.range(0.017, 0.03), tone: k < 2 ? 0.85 : rr.range(0.5, 0.8) });
      for (const br of braids) {
        const pts = [];
        for (let i = 0; i <= NRV; i++) {
          const d = (i / NRV) * 2300, off = br.b + br.a * Math.sin(d * br.f + br.ph) * (0.6 + 0.4 * Math.sin(d * br.f2 + br.ph * 2));
          const x = riv[i * 4] + riv[i * 4 + 2] * off, z = riv[i * 4 + 1] + riv[i * 4 + 3] * off;
          pts.push(x, landH(x, z) + 0.07, z);
        }
        penLine(pts, 0.11, br.tone, [0, 1, 0]);
      }
      await ctx.yield();
      // the river's starboard channel (M3): four braids down the trough between
      // the horn's foot and the starboard ridge, along the lowest ground, to the main bed below the field
      {
        const cx = [], cz = [];
        for (let z = 1560; z >= 430; z -= 45) { let bx = -400, bh = 1e9; for (let x = -620; x <= -250; x += 12) { const h = landH(x, z) + 0.02 * Math.abs(x + 400); if (h < bh) { bh = h; bx = x; } } cx.push(bx); cz.push(z); }
        for (let it = 0; it < 3; it++) for (let i = 1; i < cx.length - 1; i++) cx[i] = (cx[i - 1] + 2 * cx[i] + cx[i + 1]) / 4;
        cx.push(-262); cz.push(376);
        const chan = new THREE.CatmullRomCurve3(cx.map((x, i) => V3(x, 0, cz[i]))), p = V3(0, 0, 0), t = V3(0, 0, 0), rc = stream('river-starboard');
        for (let k = 0; k < 4; k++) {
          const pts = [], a = k < 2 ? 1.6 : rc.range(3, 6), b = k === 0 ? -8 : k === 1 ? 8 : rc.range(-4, 4), f = rc.range(0.05, 0.1), ph = rc.range(0, 6.28);
          for (let i = 0; i <= 150; i++) {
            chan.getPointAt(i / 150, p); chan.getTangentAt(i / 150, t);
            const d = (i / 150) * 1300, off = b + a * Math.sin(d * f + ph), x = p.x + t.z * off, z = p.z - t.x * off;
            pts.push(x, landH(x, z) + 0.09, z);
          }
          penLine(pts, 0.13, k < 2 ? 0.85 : rc.range(0.55, 0.8), [0, 1, 0]);
        }
      }
      await ctx.yield();
      // the far ranges (P4, S3): two layers, each a pale pencil outline and no more, no fill and no hatch, the further
      // the lighter (depth is pressure)
      const pts = [], fr = stream('ranges'), o1 = fr.range(0, 9), o2 = fr.range(0, 9);
      for (let i = 0; i <= 260; i++) {
        const th = (i / 260) * Math.PI * 2, n = noise.fbm2(Math.cos(th) * 2.3 + o1, Math.sin(th) * 2.3 + o2, 4);
        const west = smoothstep(2.1, 2.55, th) * (1 - smoothstep(3.55, 3.95, th));
        pts.push(Math.cos(th) * 2900, 150 + 150 * n + 330 * Math.pow(Math.abs(noise.n2(Math.cos(th) * 1.1 + o2, Math.sin(th) * 1.1 + o1)), 1.6) + west * (300 + 160 * n), 700 + Math.sin(th) * 2900);
      }
      penLine(pts, 2.2, 0.5, null);
      // beyond them a second, higher range 5 km off: from the summit ridge it stands in the card sky at about the ring's
      // height, a contour and no more (depth is pressure: the lightest line of the sheet)
      const pts2 = [], o3 = fr.range(0, 9);
      for (let i = 0; i <= 200; i++) {
        const th = (i / 200) * Math.PI * 2, n = noise.fbm2(Math.cos(th) * 3.1 + o3, Math.sin(th) * 3.1 + o1, 4), y = 560 + 250 * n + 360 * Math.pow(Math.abs(noise.n2(Math.cos(th) * 1.7 + o1, Math.sin(th) * 1.7 + o3)), 1.5);
        // the north-west and west stand higher (P1); from the field that
        // sector lies off the frame to starboard, so the horn's outline keeps its bare sky
        const west = smoothstep(2.1, 2.55, th) * (1 - smoothstep(3.55, 3.95, th));
        pts2.push(Math.cos(th) * 5000, y + west * (430 + 260 * n), 700 + Math.sin(th) * 5000);
      }
      penLine(pts2, 3.4, 0.46, null);
      // the dry bed carries pebble dashes, short pencil marks lying along the flow
      const pb = stream('pebbles');
      for (let k = 0; k < Math.round(520 * dens); k++) {
        const i = pb.int(0, NRV), off = pb.range(-10.5, 10.5), x = riv[i * 4] + riv[i * 4 + 2] * off, z = riv[i * 4 + 1] + riv[i * 4 + 3] * off, l = pb.range(0.25, 0.9), a = pb.range(-0.5, 0.5);
        const cx = riv[i * 4 + 3] * -1, cz = riv[i * 4 + 2];
        const dx = cx * Math.cos(a) - cz * Math.sin(a), dz = cx * Math.sin(a) + cz * Math.cos(a), y = landH(x, z) + 0.06;
        penLine([x - dx * l, y, z - dz * l, x + dx * l, y, z + dz * l], pb.range(0.04, 0.09), pb.range(0.45, 0.9), [0, 1, 0]);
      }
    }
    {   // scree: short pencil ticks strewn on the level ground the route passes over, thickest by the river and the rock's foot
      const sc = stream('scree'), want = Math.round(1300 * detail * dens);
      let made = 0, tries = 0;
      while (made < want && tries++ < 30000) {
        const i = sc.int(Math.round(NS * uAtZ(FIELD.z1 - 15)), Math.round(NS * (uFarBay + 0.012))), ang = sc.range(0, 6.283), rad = Math.pow(sc(), 0.7) * 95;
        const x = rs[i * 3] + Math.cos(ang) * rad, z = rs[i * 3 + 2] + Math.sin(ang) * rad;
        if (x > FIELD.x0 - 1 && x < FIELD.x1 + 1 && z > FIELD.z0 - 1 && z < FIELD.z1 + 1) continue;
        if (Math.hypot(x - TOWER[0], z - TOWER[2]) < 46) continue;
        const y = landH(x, z) + 0.05, l = sc.range(0.12, 0.5), a = sc.chance(0.6) ? 0.52 + sc.range(-0.3, 0.3) : sc.range(0, 3.14), dx = Math.cos(a) * l, dz = Math.sin(a) * l;
        penLine([x - dx, y, z - dz, x + dx, y, z + dz], sc.range(0.035, 0.08), sc.range(0.4, 0.95), [0, 1, 0]);
        made++;
        if ((made & 255) === 0) await ctx.yield();
      }
    }
    const bayW = hero.anchors.bayNearStake.clone().add(hero.object.position);     // the empty stake place of the near bay
    {   // more scree where the route comes in between the two feet of the near bay: the ground there is seen from 14 m
      const sc = stream('bay-scree'), want = Math.round(1100 * detail * dens);
      for (let made = 0; made < want; made++) {
        const ang = sc.range(0, 6.283), rad = Math.pow(sc(), 0.6) * 52, x = bayW.x + Math.cos(ang) * rad, z = bayW.z + Math.sin(ang) * rad;
        const y = landH(x, z) + 0.05, l = sc.range(0.14, 0.6), a = sc.chance(0.6) ? 0.52 + sc.range(-0.3, 0.3) : sc.range(0, 3.14), dx = Math.cos(a) * l, dz = Math.sin(a) * l;
        penLine([x - dx, y, z - dz, x + dx, y, z + dz], sc.range(0.04, 0.09), sc.range(0.45, 0.95), [0, 1, 0]);
        if ((made & 255) === 255) await ctx.yield();
      }
    }
    {   // THE GROUND INSIDE THE CONE IS A DRAWING (P2). SCREE AT THE ROCK'S FOOT: stones fallen from the tower lie in a ring
      // about it, thick against the rock and thinning out to 95 m from its axis; each is drawn large enough to read from
      // the route (half a metre to three metres): its top edge as an open angle of three strokes, and one short heavier
      // stroke along its lee side
      const st = stream('foot-scree'), want = Math.round(300 * detail);
      for (let made = 0; made < want; made++) {
        const ang = st.range(0, 6.283), rad = 49 + Math.pow(st(), 1.8) * 46, x = TOWER[0] + Math.cos(ang) * rad, z = TOWER[2] + Math.sin(ang) * rad, y = landH(x, z) + 0.06;
        const size = st.range(0.3, 0.9) * (1 + 2.2 * Math.pow(st(), 5)) * (1.25 - 0.5 * (rad - 49) / 46), a = st.range(0, 6.283), b = a + st.range(0.9, 1.5);
        const ax = Math.cos(a) * size, az = Math.sin(a) * size, bx = Math.cos(b) * size * st.range(0.4, 0.7), bz = Math.sin(b) * size * st.range(0.4, 0.7);
        penLine([x - ax, y, z - az, x - ax * 0.3 + bx, y, z - az * 0.3 + bz, x + ax * 0.5 + bx * 0.8, y, z + az * 0.5 + bz * 0.8, x + ax, y, z + az], st.range(0.035, 0.06) * (1 + size * 0.4), st.range(0.55, 0.9), [0, 1, 0]);
        penLine([x - ax * 0.8 - UPWIND[0] * 0.12 * size, y, z - az * 0.8 - UPWIND[1] * 0.12 * size, x + ax * 0.9 - UPWIND[0] * 0.2 * size, y, z + az * 0.9 - UPWIND[1] * 0.2 * size], st.range(0.07, 0.11) * (1 + size * 0.5), st.range(0.75, 1), [0, 1, 0]);
        if ((made & 127) === 127) await ctx.yield();
      }
      // AN OLD CHANNEL OF THE DRY RIVER runs through the cone: it leaves the main bed at the headland, passes in between
      // the stakes beside the near bay, under the line the route flies at the tower, round the scree at the rock's
      // foot on its starboard side and out between the stakes toward the starboard channel: two bank lines and a braid
      const chan = new THREE.CatmullRomCurve3([[156, 401], [130, 444], [98, 496], [72, 548], [52, 604], [38, 664], [16, 726], [-24, 786], [-84, 828], [-160, 850], [-250, 846], [-330, 800], [-388, 738]].map((q) => V3(q[0], 0, q[1])));
      const p = V3(0, 0, 0), t = V3(0, 0, 0), oc = stream('old-channel');
      for (let k = 0; k < 3; k++) {
        const pts = [], amp = k < 2 ? 1.2 : oc.range(2, 3.4), b0 = k === 0 ? -5.5 : k === 1 ? 5.5 : oc.range(-2, 2), fq = oc.range(0.05, 0.1), ph = oc.range(0, 6.28);
        for (let i = 0; i <= 110; i++) {
          chan.getPointAt(i / 110, p); chan.getTangentAt(i / 110, t);
          const d = (i / 110) * 1000, off = (b0 + amp * Math.sin(d * fq + ph)) * (0.55 + 0.45 * smoothstep(0, 120, d)), x = p.x + t.z * off, z = p.z - t.x * off;
          pts.push(x, landH(x, z) + 0.08, z);
        }
        penLine(pts, 0.12, k < 2 ? 0.8 : oc.range(0.5, 0.7), [0, 1, 0]);
      }
    }
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pen.pos, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(pen.side, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(pen.w, 2));
      g.setIndex(pen.idx);
      const m = new THREE.Mesh(g, pencilMat); m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // nearest point of the river in plan: distance to its centre line
    const res2 = [0, 0];
    const riverDist = (x, z) => { let b = 1e18; for (let i = 0; i <= NRV; i += 2) { const dx = riv[i * 4] - x, dz = riv[i * 4 + 1] - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const inField = (x, z, m) => x > FIELD.x0 - m && x < FIELD.x1 + m && z > FIELD.z0 - m && z < FIELD.z1 + m;
    const inCone = (x, z, m) => Math.hypot(x - TOWER[0], z - TOWER[2]) < 190 + m;
    {   // about sixty thorn trees: a pencil trunk and a dark scribbled crown leaning down the wind
      const tr = stream('trees'), parts = [], want = Math.round(60 * dens);
      let tries = 0;
      while (parts.length < want * 2 && tries++ < 4000) {
        let x, z;
        if (tr.chance(0.6)) { const i = tr.int(4, NRV - 4), off = tr.range(15, 34) * (tr.chance(0.5) ? 1 : -1); x = riv[i * 4] + riv[i * 4 + 2] * off; z = riv[i * 4 + 1] + riv[i * 4 + 3] * off; }
        else { z = tr.range(-350, 1150); x = (tr.chance(0.5) ? 1 : -1) * tr.range(372, 452); }
        nearXZ(x, z, res2);
        if (inField(x, z, 12) || inCone(x, z, 8) || res2[0] < 24 || riverDist(x, z) < 13) continue;
        const h = tr.range(3, 6), w = h * tr.range(0.5, 0.75), y0 = landH(x, z), lean = tr.range(0.35, 0.7);
        const crown = new THREE.IcosahedronGeometry(1, 1), cp = crown.attributes.position, cn = crown.attributes.normal, sd = tr.range(0, 50);
        for (let k = 0; k < cp.count; k++) {
          const px = cp.getX(k), py = cp.getY(k), pz = cp.getZ(k), d = 1 + 0.38 * noise.n3(px * 1.9 + sd, py * 1.9, pz * 1.9);
          cn.setXYZ(k, px, py, pz);
          const yy = h * 0.78 + py * d * w * 0.42;
          cp.setXYZ(k, x + px * d * w - UPWIND[0] * lean * yy * 0.5, y0 + yy, z + pz * d * w * 1.15 - UPWIND[1] * lean * yy * 0.5);
        }
        const trunk = new THREE.CylinderGeometry(0.045, 0.12, h * 0.8, 5, 3, true), tp = trunk.attributes.position;
        for (let k = 0; k < tp.count; k++) { const yy = tp.getY(k) + h * 0.4, off = lean * yy * yy / (h * 0.8) * 0.5; tp.setXYZ(k, x + tp.getX(k) - UPWIND[0] * off, y0 + yy, z + tp.getZ(k) - UPWIND[1] * off); }
        const tone = (g, a, b) => { const n = g.attributes.position.count, t = new Float32Array(n * 3), bd = new Float32Array(n).fill(0.25); for (let k = 0; k < n; k++) { t[k * 3] = a; t[k * 3 + 1] = b; } g.setAttribute('aTone', new THREE.BufferAttribute(t, 3)); g.setAttribute('aBed', new THREE.BufferAttribute(bd, 1)); g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
        parts.push(tone(crown, 1.0, 0.5), tone(trunk, 0.95, 0.45));
        if ((parts.length & 31) === 0) await ctx.yield();
      }
      // the charcoal shade under each lorry and reel (the ninth review): a soft patch lying on the headland, heaviest
      // under the machine's middle and gone at the patch's edge
      for (const [x, z, ry, len, wid] of machineShades) {
        const g = new THREE.PlaneGeometry(len, wid, 4, 2).rotateX(-Math.PI / 2).applyMatrix4(TR(x, landH(x, z) + 0.05, z, ry));
        const n = g.attributes.position.count, t = new Float32Array(n * 3), bd = new Float32Array(n).fill(0.25);
        for (let k = 0; k < n; k++) { const inner = k % 5 > 0 && k % 5 < 4 && k >= 5 && k < 10; t[k * 3] = inner ? 0.7 : 0; t[k * 3 + 1] = inner ? 1 : 0; }
        g.setAttribute('aTone', new THREE.BufferAttribute(t, 3)); g.setAttribute('aBed', new THREE.BufferAttribute(bd, 1)); g.deleteAttribute('uv');
        parts.push(g.toNonIndexed());
      }
      const trees = new THREE.Mesh(mergeGeometries(parts, false), style.cardMaterial({ lee: 1, side: THREE.DoubleSide }));
      trees.frustumCulled = false; scene.add(trees);
    }
    await ctx.yield();
    {   // tussocks: short pencil flicks on the headland and between the river braids, bending in the gusts
      const tu = stream('tussocks'), tb = stream('bay-tussocks'), nBay = Math.round(150 * detail * dens), nTuft = Math.round(430 * detail * dens) + nBay, per = 5, n = nTuft * per;
      const nCone = Math.round(90 * detail * dens);
      const iP = new Float32Array((n + nCone * per) * 4), iR = new Float32Array((n + nCone * per) * 4);
      let k = 0, tries = 0;
      while (k < n && tries++ < 20000) {
        let x, z; const pick = k < nBay * per ? -1 : tu();
        if (pick < 0) { const ang = tb.range(0, 6.283), rad = 4 + Math.pow(tb(), 0.7) * 44; x = bayW.x + Math.cos(ang) * rad; z = bayW.z + Math.sin(ang) * rad; }   // about the near bay
        else if (pick < 0.3) { x = tu.range(-200, 200); z = tu.range(381.5, 396); }
        else if (pick < 0.7) { const i = tu.int(60, 150), off = tu.range(-17, 17); x = riv[i * 4] + riv[i * 4 + 2] * off; z = riv[i * 4 + 1] + riv[i * 4 + 3] * off; }
        else { const sgn = tu.chance(0.5) ? 1 : -1, o = tu.chance(0.4) ? tu.range(1.2, 4.4) : tu.range(8.2, 17); if (tu.chance(0.75)) { x = sgn * (210 + o); z = tu.range(-45, 385); } else { x = tu.range(-215, 215); z = -40 - o; } }
        if (inField(x, z, 0.8) || (pick >= 0 && inCone(x, z, -3))) continue;
        const y = landH(x, z);
        for (let q = 0; q < per && k < n; q++, k++) { iP[k * 4] = x + tu.range(-0.35, 0.35); iP[k * 4 + 1] = y; iP[k * 4 + 2] = z + tu.range(-0.35, 0.35); iP[k * 4 + 3] = tu.range(0.3, 0.75); iR[k * 4] = tu.range(-0.7, 0.7); iR[k * 4 + 1] = tu.range(0.15, 0.6); iR[k * 4 + 2] = tu.range(0, 6.28); iR[k * 4 + 3] = tu.range(0.5, 1); }
      }
      {   // and inside the cone (P2): taller tussocks, half a metre to a metre, between the scree ring and the stakes
        const tc = stream('cone-tussocks');
        for (let made = 0; made < nCone; made++) {
          const ang = tc.range(0, 6.283), rad = 58 + Math.pow(tc(), 0.8) * 124, x = TOWER[0] + Math.cos(ang) * rad, z = TOWER[2] + Math.sin(ang) * rad, y = landH(x, z);
          for (let q = 0; q < per; q++, k++) { iP[k * 4] = x + tc.range(-0.5, 0.5); iP[k * 4 + 1] = y; iP[k * 4 + 2] = z + tc.range(-0.5, 0.5); iP[k * 4 + 3] = tc.range(0.45, 1.0); iR[k * 4] = tc.range(-0.7, 0.7); iR[k * 4 + 1] = tc.range(0.15, 0.6); iR[k * 4 + 2] = tc.range(0, 6.28); iR[k * 4 + 3] = tc.range(0.55, 1); }
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 1, 0, 0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 4)); g.instanceCount = k;
      const tuss = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U, ...fieldU }, vertexShader: /* glsl */`
${STYLE_VERT_GLSL}
${FIELD_GLSL}
uniform float uTime;
attribute vec4 iP, iR;
varying float vS;
void main(){
  float s = position.y;
  float lay = sw_gustLay(iP.xz, uTime) + .08 * sin(uTime * 5. + iR.z);
  float lean = iR.y + 1.5 * lay, bend = .35 * (.3 + lay) * s * s * iP.w;
  vec3 dir = normalize(vec3(SW_WD.x * lean - SW_WD.y * iR.x, 1., SW_WD.y * lean + SW_WD.x * iR.x));
  vec3 base = iP.xyz + dir * (iP.w * s) + vec3(SW_WD.x * bend, -.3 * lay * s * s * iP.w, SW_WD.y * bend);
  vec4 mv = viewMatrix * vec4(base, 1.);
  vec3 p = base + vec3(position.x * max(.03 * (1. - .7 * s), 1.25 * sw_px(-mv.z)) * 2., 0., 0.);
  vS = iR.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`, fragmentShader: /* glsl */`
uniform vec3 uCard, uGraphite, uCharcoal;
varying float vS;
void main(){ gl_FragColor = vec4(mix(uCard, mix(uGraphite, uCharcoal, .3), vS), 1.); }`, side: THREE.DoubleSide, fog: false }));
      tuss.frustumCulled = false; scene.add(tuss);
    }
    await ctx.yield();
    // ---- clouds DRAWN on the card (T4): each is a few marks of a working drawing on one upright sheet standing in the
    // sky: a firm pencil outline of loose arcs over its heads (they overshoot and do not close along the base), a shaded
    // base HATCHED in charcoal strokes at the hand's one slant, and chalk laid in a few strokes on the lit head. Only the
    // marks are laid (the sheet itself is clear: blended, no depth written; clouds are not cloth), so no cloud has a
    // fill or a straight cut. The sheet has a place and faces the route's own point at u (never the camera object).
    // SEVEN LARGE CLOUDS STAND ROUND THE SKY BY PLACE (460 to 650 m long, 1.3 to 2 km from the climb), so that every view
    // after the cone holds one or two; the bank and the low cumulus of the CLOUD variation come on top of them.
    const cloudCount = cloudName === 'clear' ? 9 : 10;
    const cloudSpec = [];
    {
      const cr = stream('clouds');
      const cg = new THREE.InstancedBufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute([-2.7, -0.3, 0, 2.7, -0.3, 0, -2.7, 1.5, 0, 2.7, 1.5, 0], 3)); cg.setIndex([0, 1, 2, 1, 3, 2]);
      const seeds = new Float32Array(cloudCount); for (let k = 0; k < cloudCount; k++) seeds[k] = cr.int(1, 90);
      cg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
      const cloudMat = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: /* glsl */`
attribute float aSeed;
attribute mat4 aM;        // the sheet's place, facing and size
varying vec3 vP;
varying vec3 vQ;        // the sheet's own coordinates (x along it, y up), and which end faces the light
varying float vSeed;
void main(){
  vec4 wp = aM * vec4(position, 1.);
  vP = wp.xyz; vSeed = aSeed;
  vQ = vec3(position.xy, 1.5);       // the light is always drawn on the same hand of the sheet
  gl_Position = projectionMatrix * viewMatrix * wp;
}`, fragmentShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vP, vQ;
varying float vSeed;
void main(){
  float sd = floor(vSeed + .5);                          // a whole number: the same at every pixel of the sheet
  vec2 p = vec2(vQ.x * (vQ.z > 0. ? 1. : -1.), vQ.y);    // x toward the light
  float fp = max(max(fwidth(p.x), fwidth(p.y)), 1e-5);   // one pixel, in the sheet's own units (taken before the loops)
  float wn = sw_vn2(p * 3.1 + sd), wn2 = sw_vn2(p * 1.3 + sd * 5.);
  // eleven rounds (seven along the body, four heaped on it) give the cumulus its form: d = distance to the edge of them
  // all (inside < 0). Only FOUR OR FIVE of them are drawn, each as one loose pencil arc over its own top: an arc lifts
  // off at both ends, so the outline never closes, and runs on a little way inside its neighbour (the hand's overshoot)
  float d = 1e3, line = 0.;
  for (int i = 0; i < 11; i++) {
    float fi = float(i), h1, h2, r; vec2 c;
    if (i < 7) { h1 = sw_h11(sd + fi * 3.1); h2 = sw_h11(sd * 1.7 + fi * 5.3);
      c = vec2(-1.75 + 3.5 * (fi + .2 + .6 * h1) / 7., .12 + .2 * h2 - .1 * abs(fi - 3.) * .3); r = .4 + .26 * h2 + .1 * (1. - abs(fi - 3.) / 3.); }
    else { float fj = fi - 7.; h1 = sw_h11(sd * 2.3 + fj * 7.7); h2 = sw_h11(sd + 40. + fj * 2.9);
      c = vec2(-.95 + .68 * fj + .3 * (h1 - .5), .58 + .3 * h2 - .12 * abs(fj - 1.5)); r = .36 + .2 * h1; }
    vec2 q = p - c; float lq = length(q), di = lq - r;
    d = min(d, di);
    float drawn = step(i < 7 ? .3 : .12, sw_h11(sd * 3.7 + fi * 1.9));
    float ang = atan(q.x, q.y + 1e-5);                                   // 0 over the round's top, positive toward the light
    float mid = (h1 - .5) * .7, half0 = .9 + .7 * h2;                  // where the arc lies and how far it runs (radians)
    float along = 1. - smoothstep(half0 * .55, half0, abs(ang - mid));   // the pressure lifts toward both ends
    float w = (.8 + .7 * wn) * fp;                                       // half the line's width: 2 to 3 pixels in all
    line = max(line, drawn * along * (1. - smoothstep(w, w + fp, abs(di))));
  }
  // an arc is kept only on the outline of the whole (with its overshoot of a tenth of a round into its neighbour)
  line *= 1. - smoothstep(.07, .16, -d);
  float fw = sw_foot(vP), th = sw_tooth(vP, fw);
  // THE SHADED BASE: charcoal strokes at the hand's one slant, three to six pixels wide (the two pitches the pixel can
  // hold, cross-faded by its footprint), the tone read once for each stroke so the shade ends in stroke tips; heaviest
  // low in the body and on the side away from the light, none on the heads
  vec2 rq = vec2(p.x * .866 + p.y * .5, p.y * .866 - p.x * .5);          // along and across the strokes
  float body = (1. - smoothstep(-.22, .02, d)) * smoothstep(-.3, -.1, p.y) * (1. - smoothstep(.2, .78, p.y + .3 * (wn2 - .5)));
  float blot = smoothstep(.2, .7, sw_vn2(p * vec2(1.9, 2.7) + sd * 2.1));
  float tone = body * (.45 + .55 * blot) * (1. - .45 * smoothstep(-1., 1.6, p.x));
  float lvh = log2(fp * 5.), lh0 = floor(lvh), ph0 = exp2(lh0), ph1 = ph0 * 2.;
  float frq = max(fwidth(rq.y), 1e-5);
  vec2 gq = vec2(dFdx(rq.y), dFdy(rq.y)), gt = vec2(dFdx(tone), dFdy(tone));
  float tsl = dot(gt, gq) / max(dot(gq, gq), 1e-8);
  float c0 = rq.y / ph0, c1 = rq.y / ph1;
  float t0 = tone + clamp(tsl * (floor(c0) + .5 - c0) * ph0, -.3, .3) + .16 * (sw_h11(floor(c0) * 1.7 + sd) - .5);
  float t1 = tone + clamp(tsl * (floor(c1) + .5 - c1) * ph1, -.3, .3) + .16 * (sw_h11(floor(c1) * 1.7 + sd + 3.) - .5);
  float under = mix(sw_laidE(c0, frq / ph0, (t0 - .3) / .25, .46, 1.3), sw_laidE(c1, frq / ph1, (t1 - .3) / .25, .46, 1.3), smoothstep(.25, .75, lvh - lh0)) * (.7 + .5 * th);
  // one touch of chalk on the lit head: a few short strokes three to six pixels wide, laid along the rubbing just inside
  // the arcs (the two stroke widths the pixel can hold, cross-faded by its footprint)
  float lv = log2(fp * 4.5), l0 = floor(lv), pw0 = exp2(l0), pw1 = pw0 * 2.;
  float ck = mix(sw_vn2(vec2(rq.y / pw0 + sd, rq.x / (pw0 * 7.))), sw_vn2(vec2(rq.y / pw1 + sd + 5., rq.x / (pw1 * 7.))), smoothstep(.15, .85, lv - l0));
  float head = smoothstep(.3, .75, p.y) * smoothstep(-.6, .5, p.x) * smoothstep(.03, .09, -d) * (1. - smoothstep(.22, .5, -d)) * smoothstep(.36, .5, ck) * smoothstep(.2, .5, wn2);
  // the marks alone are laid on the sheet (the sky and the ranges behind show between them)
  float rubU = tone * (.5 + .6 * th) * (.6 + .4 * sw_vn2(vec2(rq.x * 1.6 + sd, rq.y * 9.)));      // the base is rubbed first (the card's tooth through it), then hatched
  float aL = line * (.72 + .28 * wn) * (.75 + .5 * th), aU = clamp(max(under * .5, rubU * .42), 0., .55), aH = head * .9 * (.6 + .6 * th);
  vec3 col = mix(uGraphite, uCharcoal, .3);
  col = mix(col, uChalk, step(max(aU, aL), aH));
  gl_FragColor = vec4(col, clamp(max(max(aU, aL), aH), 0., 1.));
}`, side: THREE.DoubleSide, fog: false, transparent: true, depthWrite: false });
      const clouds = new THREE.Mesh(cg, cloudMat);
      clouds.frustumCulled = false;
      const iM = new THREE.InstancedBufferAttribute(new Float32Array(cloudCount * 16), 16); iM.setUsage(THREE.DynamicDrawUsage);
      cg.setAttribute('aM', iM); cg.instanceCount = cloudCount;
      // THE SEVEN LARGE CLOUDS, each held at a place of its own (it mills 60 m either way by the world's clock): two on
      // either hand of the horn and the squall as the climb sees them, one far out on each hand beyond those, and
      // one over the port ranges down the valley for the field. None stands over the route or behind the ring from the run.
      const HELD = [[-1400, 600, 1265, 200], [-140, 640, 1985, 185], [940, 520, 2215, 190], [-1510, 560, 560, 180], [1820, 540, 1180, 190], [1500, 470, 330, 190], [-700, 700, 2700, 170], [-250, 1150, 2160, 250], [-1280, 1120, 1530, 240]];
      for (let k = 0; k < cloudCount; k++) {
        let s;
        if (k < 9) { const h = HELD[k]; s = { x: h[0] + cr.range(-60, 60), y: h[1] + cr.range(-25, 25), z0: h[2] + cr.range(-60, 60), sx: h[3] * cr.range(0.9, 1.08), sy: 0.9 }; }
        // the CLOUD variation: a bank of three held up the valley to port, or three low flat-based cumulus over the port ridge
        else if (cloudName === 'bank') s = { x: cr.range(1000, 1700), y: cr.range(430, 540), z0: PEAK.z + cr.range(100, 900), sx: cr.range(110, 160), sy: 0.8 };
        else s = { x: cr.range(560, 740), y: cr.range(290, 350), z0: -700 + (k - 7) * 900 + cr.range(-80, 80), sx: cr.range(72, 104), sy: 0.62 };
        s.sy *= s.sx * cr.range(0.85, 1.1);
        cloudSpec.push(s);
      }
      scene.add(clouds);
      const q = new THREE.Quaternion(), eul = new THREE.Euler(0, 0, 0, 'YXZ'), pp = V3(0, 0, 0), sc = V3(1, 1, 1), m4 = new THREE.Matrix4();
      const ro = V3(0, 0, 0);
      const placeClouds = (time, u) => {
        path.pointAt(clamp(u, 0, 1), ro);
        for (let k = 0; k < cloudCount; k++) {
          const s = cloudSpec[k];
          // every cloud is held: it mills about its own place by the world's clock. Each sheet faces the route's own point
          // at u (never the camera object): a drawn cloud is a flat mark and is never seen edge on or from under itself
          const z = s.z0 - 60 * Math.sin(time * 0.05 + k);
          pp.set(s.x, s.y, z); sc.set(s.sx, s.sy, 1);
          eul.set(Math.atan2(s.y - ro.y, Math.hypot(ro.x - s.x, ro.z - z)), Math.atan2(ro.x - s.x, ro.z - z), 0); q.setFromEuler(eul);
          m4.compose(pp, q, sc); m4.toArray(iM.array, k * 16);
        }
        iM.needsUpdate = true;
      };
      placeClouds(0, 0);
      life.push((dt, time, u) => placeClouds(time, u));
    }
    await ctx.yield();
    {   // charcoal dashes of dust blown off the dry river, down the wind
      const du = stream('dust'), n = Math.round(280 * detail * dens), iP = new Float32Array(n * 4), iR = new Float32Array(n * 4);
      for (let k = 0; k < n; k++) {
        const i = du.int(84, 156), off = du.range(-12, 12);
        iP[k * 4] = riv[i * 4] + riv[i * 4 + 2] * off; iP[k * 4 + 1] = du.range(0.2, 1.2); iP[k * 4 + 2] = riv[i * 4 + 1] + riv[i * 4 + 3] * off; iP[k * 4 + 3] = du.range(0.8, 3.2);
        iR[k * 4] = du.range(0, 1); iR[k * 4 + 1] = du.range(0.1, 0.22); iR[k * 4 + 2] = du.range(60, 150); iR[k * 4 + 3] = du.range(0.8, 3.2);   // never higher than 4.4 m: 2 m and more under the flown line
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 1, 3, 2]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(iR, 4)); g.instanceCount = n;
      const dust = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: /* glsl */`
${STYLE_VERT_GLSL}
uniform float uTime, uWind;
attribute vec4 iP, iR;
varying float vK;
void main(){
  float ph = fract(uTime * iR.y * (.7 + .5 * uWind) + iR.x);
  float env = sin(3.14159 * ph);
  vec3 c = iP.xyz + vec3(sin(ph * 7. + iR.x * 40.) * 2.5 + ${(-UPWIND[0]).toFixed(4)} * ph * iR.z, iR.w * ph * ph, ${(-UPWIND[1]).toFixed(4)} * ph * iR.z);
  vec4 mv = viewMatrix * vec4(c, 1.);
  float yaw = iR.x * 40.;
  vec3 dir = vec3(cos(yaw) * .9 + .1, .12 * sin(yaw * 3.), sin(yaw) * .35);
  vec3 p = c + dir * (position.x * iP.w * env) + vec3(0., position.y * max(.09, 2.6 * sw_px(-mv.z)) * step(.02, env), 0.);
  vK = .55 + .45 * fract(iR.x * 7.);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`, fragmentShader: /* glsl */`
uniform vec3 uCard, uCharcoal;
varying float vK;
void main(){ gl_FragColor = vec4(mix(uCard, uCharcoal, vK * .8), 1.); }`, side: THREE.DoubleSide, fog: false }));
      dust.frustumCulled = false; scene.add(dust);
    }
    // ---- the rare event: a dust devil, a loose pencil scribble 40 m high, walking the field 45 m to starboard ----------
    const devil = (() => {
      const dr = stream('devil'), save = { pos: pen.pos, side: pen.side, w: pen.w, idx: pen.idx };
      pen.pos = []; pen.side = []; pen.w = []; pen.idx = [];
      // (the eighth review: it could not be made out) four light turns of the hand to its full height and three heavy
      // ones up its lower 22 m, where it is narrow, so its foot stands as a dark funnel on the field
      for (let h = 0; h < 7; h++) {
        const pts = [], ph = dr.range(0, 6.28), turns = dr.range(7, 11), wob = dr.range(0.5, 1.4), top = h < 4 ? 150 : 93;
        for (let i = 0; i <= top; i++) {
          const t = i / 150, y = 40 * Math.pow(t, 1.25), r = (1.2 + 8.5 * Math.pow(t, 1.6)) * (1 + 0.28 * Math.sin(t * 31 * wob + ph * 3)) + 1.2 * Math.sin(t * 57 + ph), a = ph + t * turns * 6.283;
          pts.push(Math.cos(a) * r + 2.4 * Math.sin(t * 5 + ph), y + 0.8 * Math.sin(a * 0.5), Math.sin(a) * r);
        }
        penLine(pts, h < 4 ? 0.13 : 0.32, dr.range(0.8, 1.0), [0, 1, 0]);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pen.pos, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(pen.side, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(pen.w, 2)); g.setIndex(pen.idx);
      Object.assign(pen, save);
      const m = new THREE.Mesh(g, pencilMat); m.frustumCulled = false; scene.add(m);
      return m;
    })();
    {
      // its walk is tied to the route's own point: from (-52, 195) it is overtaken near (-38, 372)
      const A = [-52, 195], B = [-38, 372], dl = Math.hypot(B[0] - A[0], B[1] - A[1]);
      fieldU.uDevilDir.value.set((B[0] - A[0]) / dl, (B[1] - A[1]) / dl);
      life.push((dt, time) => {
        const k = clamp((U.uRoute.value.z - 100) / 250, 0, 1);
        const x = A[0] + (B[0] - A[0]) * k, z = A[1] + (B[1] - A[1]) * k;
        devil.position.set(x + 2.5 * Math.sin(time * 0.6), rare ? 0 : -900, z);
        devil.rotation.y = time * 2.3;
        fieldU.uDevil.value.set(x, z, 30, rare ? 1 : 0);
      });
    }
    await ctx.yield();
    // ---- forty pale cranes: chalk bodies, pencil outline, charcoal wing tips; wings bent in the shader ------------------
    {
      const NC = 40, cr = stream('cranes');
      const pos = [], k4 = [], idx = [];
      const vtx = (x, y, z, w, part, e) => { pos.push(x, y, z); k4.push(w, part, e, 0); return pos.length / 3 - 1; };
      const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
      {   // a crane: a full body, a long neck stretched forward, long legs trailing, broad wings with fingered tips
        // body (part 0): an eight-sided spindle; four of its meridians carry the pencil line
        const ringOf = (z, r, yo) => { const o = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; o.push(vtx(Math.cos(a) * r, yo + Math.sin(a) * r * 0.85, z, 0, 0, (i & 1) ? 0.5 : 0)); } return o; };
        const rings = [ringOf(0.52, 0.05, 0.05), ringOf(0.3, 0.15, 0.02), ringOf(0, 0.2, 0), ringOf(-0.32, 0.15, 0.01), ringOf(-0.58, 0.035, 0.04)];
        for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < 8; i++) quad(rings[j][i], rings[j][(i + 1) % 8], rings[j + 1][(i + 1) % 8], rings[j + 1][i]);
        // neck and head (part 3): two crossed blades in three lengths, rising a little; then the head and the bill (part 4)
        const nk = [[0.48, 0.05, 0.075], [0.78, 0.085, 0.055], [1.08, 0.115, 0.045], [1.3, 0.13, 0.04]];
        for (const [ux, uy] of [[1, 0], [0, 1]]) for (let j = 0; j < nk.length - 1; j++) {
          const a = nk[j], b = nk[j + 1];
          quad(vtx(-a[2] * ux, a[1] - a[2] * uy, a[0], 0, 3, 0), vtx(a[2] * ux, a[1] + a[2] * uy, a[0], 0, 3, 1), vtx(b[2] * ux, b[1] + b[2] * uy, b[0], 0, 3, 1), vtx(-b[2] * ux, b[1] - b[2] * uy, b[0], 0, 3, 0));
        }
        for (const [ux, uy] of [[1, 0], [0, 1]]) {
          quad(vtx(-0.04 * ux, 0.13 - 0.04 * uy, 1.28, 0, 3, 0), vtx(0.04 * ux, 0.13 + 0.04 * uy, 1.28, 0, 3, 1), vtx(0.075 * ux, 0.14 + 0.075 * uy, 1.38, 0, 3, 1), vtx(-0.075 * ux, 0.14 - 0.075 * uy, 1.38, 0, 3, 0));
          idx.push(vtx(-0.07 * ux, 0.14 - 0.07 * uy, 1.38, 0, 3, 0.5), vtx(0.07 * ux, 0.14 + 0.07 * uy, 1.38, 0, 3, 0.5), vtx(0, 0.125, 1.7, 0, 4, 0.5));
        }
        // legs (part 2): two thin blades trailing far behind the tail, a foot at the end of each
        for (const lx of [-0.05, 0.05]) for (const [ux, uy] of [[1, 0], [0, 1]]) {
          quad(vtx(lx - 0.022 * ux, -0.07 - 0.022 * uy, -0.42, 0, 2, 0), vtx(lx + 0.022 * ux, -0.07 + 0.022 * uy, -0.42, 0, 2, 1), vtx(lx + 0.018 * ux, -0.1 + 0.018 * uy, -1.52, 0, 2, 1), vtx(lx - 0.018 * ux, -0.1 - 0.018 * uy, -1.52, 0, 2, 0));
          idx.push(vtx(lx - 0.02 * ux, -0.1 - 0.02 * uy, -1.5, 0, 2, 0.5), vtx(lx + 0.02 * ux, -0.1 + 0.02 * uy, -1.5, 0, 2, 0.5), vtx(lx + 0.07 * ux, -0.13, -1.7, 0, 2, 0.5));
        }
        // wings (part 1): broad, four spans out to the wrist (w = 0 at the shoulder), then five primaries spread like fingers
        for (const sg of [-1, 1]) {
          const zf = (w) => 0.3 - 0.22 * w * w, zb = (w) => -0.36 + 0.26 * w * w * w;
          let pa = null, pb = null;
          for (let j = 0; j <= 4; j++) {
            const w = (j / 4) * 0.78, x = sg * (0.14 + 1.1 * w);
            const a = vtx(x, 0.03, zf(w), w, 1, 0), b = vtx(x, 0.03, zb(w), w, 1, 1);
            if (pa !== null) { if (sg > 0) quad(pa, pb, b, a); else quad(pa, a, b, pb); }
            pa = a; pb = b;
          }
          const x0 = sg * (0.14 + 1.1 * 0.78), f0 = zf(0.78), b0 = zb(0.78), ch = (f0 - b0) / 5;
          for (let k = 0; k < 5; k++) {
            const za = f0 - ch * k, zb2 = za - ch * 0.92, zt = 0.36 - 0.2 * k, len = 0.42 - 0.03 * Math.abs(k - 1.5);
            const a = vtx(x0, 0.03, za, 0.78, 1, 0), b = vtx(x0, 0.03, zb2, 0.78, 1, 1), c = vtx(x0 + sg * len, 0.03, zt - 0.05, 1, 1, 1), d = vtx(x0 + sg * len, 0.03, zt + 0.02, 1, 1, 0);
            if (sg > 0) quad(a, b, c, d); else quad(a, d, c, b);
          }
        }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k4, 4)); g.setIndex(idx);
      const iPos = new Float32Array(NC * 4), iDir = new Float32Array(NC * 4);
      const aPos = new THREE.InstancedBufferAttribute(iPos, 4), aDir = new THREE.InstancedBufferAttribute(iDir, 4), iBank = new Float32Array(NC), aBank = new THREE.InstancedBufferAttribute(iBank, 1);
      aPos.setUsage(THREE.DynamicDrawUsage); aDir.setUsage(THREE.DynamicDrawUsage); aBank.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iPos', aPos); g.setAttribute('iDir', aDir); g.setAttribute('iBank', aBank); g.instanceCount = NC;
      const cranes = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: /* glsl */`
uniform float uTime;
attribute vec4 aK, iPos, iDir;   // iPos: place, flying 0..1; iDir: yaw, pitch, phase, size
attribute float iBank;           // bank into the turn (radians, port wing down)
varying vec3 vP; varying vec4 vK;
void main(){
  float fly = iPos.w, T = uTime * 6.4 + iDir.z;
  vec3 p = position;
  if (aK.y > .5 && aK.y < 1.5) {          // wing: a crane's shallow beat in two straight lengths, the arm from the shoulder
    // and the hand from the wrist, the hand a little behind the arm; the tip never stands more than about 29 degrees above
    // or 18 below the shoulders, so the wings are a shallow M or a nearly flat line, never an arc. Folded on the ground.
    float w = aK.x, sx = p.x < 0. ? -1. : 1.;
    float a1 = fly * (.3 * sin(T) + .09), a2 = a1 + fly * .27 * sin(T - 1.05);
    float span = abs(p.x) - .14, s1 = min(span, .58), s2 = max(span - .58, 0.);
    p.x = sx * (.14 + (s1 * cos(a1) + s2 * cos(a2)) * mix(.1, 1., fly));
    p.y += s1 * sin(a1) + s2 * sin(a2) + (1. - fly) * .06;
    p.z -= (1. - fly) * w * .55;
  } else if (aK.y > 2.5) {                // neck and head: down to the ground to feed, stretched out in flight
    float nd = (1. - fly) * (1.2 + .3 * sin(uTime * 1.6 + iDir.z * 3.));
    vec2 q = vec2(p.z - .48, p.y - .04);
    p.z = .48 + q.x * cos(nd) + q.y * sin(nd); p.y = .04 - q.x * sin(nd) + q.y * cos(nd);
  } else if (aK.y > 1.5) {                // legs: trailing in flight, under the bird on the ground
    float ld = (1. - fly) * 1.45;
    vec2 q = vec2(p.z + .4, p.y + .06);
    p.z = -.4 + q.x * cos(ld) + q.y * sin(ld); p.y = -.06 - q.x * sin(ld) + q.y * cos(ld);
  }
  p.y -= fly * .1 * sin(T);
  // R8: a bird reads as a bird or is not drawn: where its whole span would stand under about a fortieth of the frame's
  // height (a white sliver) it is drawn down to nothing (the pixel's footprint at the bird's own depth: lawful)
  float thou = max(-(viewMatrix * vec4(iPos.xyz, 1.)).z, .05) * 2. / max(projectionMatrix[1][1] * 1000., 1e-3);
  p *= iDir.w * smoothstep(20., 30., 2.2 * iDir.w / thou);
  float cb = cos(iBank), sb = sin(iBank);
  p = vec3(p.x * cb + p.y * sb, p.y * cb - p.x * sb, p.z);
  float cp = cos(iDir.y), sp = sin(iDir.y), cy = cos(iDir.x), sy = sin(iDir.x);
  p = vec3(p.x, p.y * cp + p.z * sp, p.z * cp - p.y * sp);
  p = vec3(p.x * cy + p.z * sy, p.y, p.z * cy - p.x * sy) + iPos.xyz;
  vP = p; vK = aK;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`, fragmentShader: /* glsl */`
${STYLE_GLSL}
varying vec3 vP; varying vec4 vK;
void main(){
  float fw = sw_foot(vP), th = sw_tooth(vP, fw);
  vec3 chalk = mix(uCard, uChalk, .86 + .14 * th);
  vec3 col = chalk;
  float fe = max(fwidth(vK.z), 1e-4), e = min(vK.z, 1. - vK.z) / fe;
  float line = 1. - smoothstep(1., 2.2, e);
  if (vK.y < .5) col = mix(chalk, uGraphite, line * .75);
  else if (vK.y < 1.5) {                  // wing: charcoal tip, pencil edge
    float tip = smoothstep(.56, .66, vK.x + .05 * (th - .5));
    col = mix(chalk, mix(uCharcoal, uGraphite, .25), tip * (.85 + .15 * th));
    // the flight feathers: short pencil lines in from the trailing edge, and the wing's own outline
    float fq = vK.x * 13., ff = max(fwidth(fq), 1e-4);
    float feather = (1. - smoothstep(.6, 1.4, abs(fract(fq) - .5) / ff)) * smoothstep(.45, .6, vK.z) * smoothstep(.5, .25, ff);
    col = mix(col, uGraphite, max(line * .85, feather * .6) * (1. - tip));
  }
  else if (vK.y < 2.5) col = mix(uGraphite, uCharcoal, .35);
  else if (vK.y < 3.5) col = mix(chalk, uGraphite, .25 + .55 * line);
  else col = mix(uGraphite, uCharcoal, .5);
  gl_FragColor = vec4(col, 1.);
}`, side: THREE.DoubleSide, fog: false }));
      cranes.frustumCulled = false; scene.add(cranes);
      // each bird: a feeding place on the far headland, then a lane beside and ahead of the route, then the air about the tower.
      // THE LAW OF CLEAR AIR (owner's term E, the lead's R8): by place every bird keeps 13 m and more from the flown line at
      // every moment (so none is ever nearer the traveller than 12 m): its feeding place lies 20 m and more to one side of
      // the line, its lane lies on the SAME side (no bird crosses the line as it gets up) 14 m and more off, and whatever
      // its course works out to, its place is last of all held 13 m from every point of the route (keepOff, below: the
      // route is a fixed line of places in the world; the camera is never read).
      const B = [];
      for (let i = 0; i < NC; i++) {
        let gx = cr.range(-150, 150); if (gx > 4 && gx < 64) gx += 62;                    // not among the lorries
        if (Math.abs(gx) < 20) gx = gx < 0 ? gx - 20 : gx + 20;
        if (i === 0) gx = -24;
        const side = gx < 0 ? -1 : 1;
        const ox = side * (14 + Math.abs(cr.range(-70, 46)) * 0.8);                      // its lane: on its own side of the flown line
        B.push({ gx, gz: cr.range(383, 395.5), gyaw: cr.range(-3.1, 3.1), delay: i === 0 ? 0 : cr.range(0, 0.05), lead: i === 0 ? 17 / path.length : cr.range(30, 120) / path.length,
          ox: i === 0 ? -12.5 : ox, oy: i === 0 ? 5 : cr.range(3, 22), orbR: cr.range(34, 60), orbH: cr.range(84, 128), orbA: cr.range(0, 6.28), size: i === 0 ? 2.3 : cr.range(1.5, 1.9), ph: cr.range(0, 6.28), side });
      }
      // eight of them keep NEAR lanes over the field (the review's goal 3): 24 to 50 m ahead of the route's own point, 15 to
      // 28 m to their own side of the line and 2 to 12 m above it, so that on the rise from the field they are birds a
      // fifteenth to a seventh of the frame across, about the near one
      const cn = stream('crane-near');
      for (let i = 1; i <= Math.min(8, NC - 1); i++) { B[i].lead = cn.range(24, 50) / path.length; B[i].ox = B[i].side * cn.range(15, 28); B[i].oy = cn.range(2, 12); B[i].delay = cn.range(0, 0.02); B[i].size = cn.range(1.7, 2.0); }
      // every other bird leaves the wheel about the rock when the route leaves the cone and flies WITH the traveller (M7,
      // Q7, S9), on the port hand, the hand away from the cloth, until the route is over the cloth (the cloth lies overhead on the climb
      // beneath it and to starboard beside the pour): ten of them near, each at a
      // station of its own 14 to 31 m off the flown line by place and 14 to 37 m ahead, at about the traveller's own
      // height (under the cloth with the traveller, outside the port hem beside it, over the hem and the cloth's port
      // half on the run, 28 m and more over the cloth's line); the other ten wider and further ahead. Every bird
      // banks into its own turn and rocks a little on the wind. Before the summit they open out: by the summit every
      // bird is 62 m and more to port of the flown line and above the ring's crown, and flies on past it.
      const cc = stream('crane-climb');
      for (let i = 1, n = 0; i < NC; i += 2, n++) {
        const near = n < 10;
        B[i].lead2 = near ? ([20, 26, 22, 30, 34, 24, 28, 18, 25, 36][n] + cc.range(-1.5, 1.5)) / path.length : cc.range(35, 100) / path.length;
        B[i].lat = near ? [-18, 16, -20, -26, 20, -23, -17.5, 24, -30, -19][n] - cc.range(0, 1.5) * (n === 1 || n === 4 || n === 7 ? -1 : 1) : cc.range(24, 50);
        B[i].up2 = near ? [-2, 4, -6, 2, 0, 5, -4, 3, -8, 1][n] + cc.range(-1, 1) : cc.range(-6, 12);
        // its lane past the summit: metres to port and above the traveller
        const close = near && n < 4;
        B[i].latTop = close ? cc.range(62, 76) : cc.range(86, 150); B[i].upTop = cc.range(42, 64);
        B[i].size = near ? cc.range(2.0, 2.4) : cc.range(1.7, 2.0);
        // THE CLIMB AND THE RUN UP THE CLOTH (S9, T1): the ten near birds keep lanes of their own, 18 to 36 m ahead of the
        // route's own point in plan, from 8 m under to 5 m over its height: seven to STARBOARD of the line (17 to 31 m off: between
        // the traveller and the horn while the route climbs beneath and beside the cloth, where the look goes) and three
        // to port. Each keeps its own side all the way (none crosses the flown line). On the run the starboard birds fly
        // over the hem and the cloth, 30 to 62 m ahead, 3 to 15 m above the route's own height at their place (so as
        // far over the cloth as the route itself); all open out before the summit.
        B[i].leadRun = near ? [34, 30, 58, 44, 34, 52, 30, 27, 62, 40][n] / path.length : B[i].lead2;
        B[i].latRun = near ? [-18, 26, -30, -24, 22, -38, -20, 38, -44, -27][n] : B[i].latTop; B[i].upRun = near ? [3, -8, 12, 7, 6, 15, 5, -7, 10, 8][n] : B[i].upTop;
        // BENEATH THE CLOTH (U1) the gaze is tipped up the cloth's under face, so the ten near birds fly up where it
        // looks, in the gap between cloth and horn: 17 to 30 m ahead of the route's own point, each on its own hand of
        // the line (12 to 22 m off in plan), at the route's own height at its place ahead and from 3 m under to 14 m
        // over that (36 m and more under the cloth's line; keepOff holds each 13 m and more from the line); the
        // others keep their lanes
        if (near) { B[i].leadU = [18, 22, 26, 19, 24, 30, 20, 17, 28, 23][n] / path.length; B[i].latU = [-14, 15, -12, -17, 13, -19, -15, 17, -22, -16][n]; B[i].upU = [6, 0, 11, -3, 9, 14, 9, -3, 2, 3][n]; }
      }
      const rt2 = V3(0, 0, 0), rt3 = V3(0, 0, 0), cl2 = [0, 0];
      // the route's point at u, carried straight on beyond the ring along the route's last heading (straight and level)
      const routeExt = (u, out) => { routeAt(u, out); if (u > 1) { const e = (u - 1) * path.length; out.x += HEAD[0] * e; out.z += HEAD[1] * e; } return out; };
      // keepOff: hold a place 14.5 m (KEEP) and more from THE FLOWN LINE ITSELF: the route's samples joined by straight
      // pieces, from a little behind the route's own point at u to well ahead of the bird's furthest lead. The nearest
      // sample is found first (every second one, as before), then the true nearest point q on the pieces next to it,
      // two either way. A place under 14.5 m from q is moved straight out from q, across the line's own direction, to
      // 14.5 m; a place at 14.5 m is not moved, and nothing steps when the nearest sample changes. Close to the line
      // the way out is leant UP: to (place - q) is added the line's upward normal there (straight up less its part
      // along the line, made unit) times LEAN times (1 - d / 14.5) squared, and the place goes out 14.5 m along the
      // sum: a place on the line goes straight over it. (The line's direction at q is taken between the directions at
      // the two samples of its piece, so it turns evenly along the line.) No allocation.
      const OFF = 13, KEEP = OFF + 1.5, LEAN = 4, kStep = 2, kBack = Math.round(0.06 * NS), kFwd = Math.round(0.2 * NS);
      const kMore = 20, kNear = KEEP + 3 + kMore * path.length / NS;
      const keepOff = (u, out) => {
        const c = Math.round(clamp(u, 0, 1) * NS), i0 = Math.max(0, c - kBack), i1 = Math.min(NS, c + kFwd);
        const px = out.x, py = out.y, pz = out.z;
        let b = 1e18, bi = i0;
        for (let i = i0; i <= i1; i += kStep) { const dx = px - rs[i * 3], dy = py - rs[i * 3 + 1], dz = pz - rs[i * 3 + 2], d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; bi = i; } }
        // the line goes on beyond the stretch searched: where the nearest sample found is the stretch's last or first
        // and lies within kMore samples' length of the keep-off's reach, the search goes on along the line, sample by
        // sample, while it nears (kMore samples at most), so that the keep-off holds from the line itself and not from
        // where the stretch happens to end (a bird still at its feeding place by the line is held off from the start)
        if (b < kNear * kNear) {
          if (bi + kStep > i1) { for (let n = 0; n < kMore && bi < NS; n++) { const o = bi * 3 + 3, dx = px - rs[o], dy = py - rs[o + 1], dz = pz - rs[o + 2], d = dx * dx + dy * dy + dz * dz; if (d >= b) break; b = d; bi++; } }
          else if (bi === i0) { for (let n = 0; n < kMore && bi > 0; n++) { const o = bi * 3 - 3, dx = px - rs[o], dy = py - rs[o + 1], dz = pz - rs[o + 2], d = dx * dx + dy * dy + dz * dz; if (d >= b) break; b = d; bi--; } }
        }
        if (b < (KEEP + 3) * (KEEP + 3)) {                    // a sample within 17.5 m: the line may be within 14.5 m
          let bd = 1e18, bj = bi, bs = 0;
          for (let j = Math.max(bi - 2, 0), j1 = Math.min(bi + 2, NS); j < j1; j++) {
            const o = j * 3, ex = rs[o + 3] - rs[o], ey = rs[o + 4] - rs[o + 1], ez = rs[o + 5] - rs[o + 2];
            let s = ((px - rs[o]) * ex + (py - rs[o + 1]) * ey + (pz - rs[o + 2]) * ez) / (ex * ex + ey * ey + ez * ez); s = s < 0 ? 0 : s > 1 ? 1 : s;
            const dx = px - rs[o] - ex * s, dy = py - rs[o + 1] - ey * s, dz = pz - rs[o + 2] - ez * s, d = dx * dx + dy * dy + dz * dz;
            if (d < bd) { bd = d; bj = j; bs = s; }
          }
          if (bd < KEEP * KEEP) {
            const o = bj * 3, qx = rs[o] + (rs[o + 3] - rs[o]) * bs, qy = rs[o + 1] + (rs[o + 4] - rs[o + 1]) * bs, qz = rs[o + 2] + (rs[o + 5] - rs[o + 2]) * bs;
            // the line's direction at q: the chord across each sample's neighbours, made unit, mixed along the piece
            const a0 = Math.max(bj - 1, 0) * 3, a1 = Math.min(bj + 2, NS) * 3;
            let ax = rs[o + 3] - rs[a0], ay = rs[o + 4] - rs[a0 + 1], az = rs[o + 5] - rs[a0 + 2], al = Math.sqrt(ax * ax + ay * ay + az * az);
            let cx = rs[a1] - rs[o], cy = rs[a1 + 1] - rs[o + 1], cz = rs[a1 + 2] - rs[o + 2], cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
            ax = ax / al * (1 - bs) + cx / cl * bs; ay = ay / al * (1 - bs) + cy / cl * bs; az = az / al * (1 - bs) + cz / cl * bs;
            al = Math.sqrt(ax * ax + ay * ay + az * az); ax /= al; ay /= al; az /= al;
            // its upward normal: straight up less its part along the line, made unit
            let nx = -ax * ay, ny = 1 - ay * ay, nz = -az * ay; const nl = Math.max(Math.sqrt(nx * nx + ny * ny + nz * nz), 1e-4); nx /= nl; ny /= nl; nz /= nl;
            const g = 1 - Math.sqrt(bd) / KEEP, k = LEAN * g * g;
            const wx = px - qx + nx * k, wy = py - qy + ny * k, wz = pz - qz + nz * k, wl = Math.sqrt(wx * wx + wy * wy + wz * wz);
            // (where the sum lies ALONG the line, its part along the line's direction a tenth of its length or more:
            // about the one place under the line where the way out and the lean undo each other, and beyond the
            // line's two ends: straight up the normal, as when the sum is nothing; never along the line)
            if (wl > 1e-4 && Math.abs(wx * ax + wy * ay + wz * az) < 0.1 * wl) { out.x = qx + wx / wl * KEEP; out.y = qy + wy / wl * KEEP; out.z = qz + wz / wl * KEEP; }
            else { out.x = qx + nx * KEEP; out.y = qy + ny * KEEP; out.z = qz + nz * KEEP; }
          }
        }
        return out;
      };
      // overLine: A BIRD WHOSE COURSE CROSSES THE FLOWN LINE CROSSES OVER IT (note 9, V2). For a place (x, y, z) of a
      // bird that must cross, the height it is to have: the line's nearest point IN PLAN is found (the nearest sample
      // of keepOff's own stretch of the route, then the true nearest point of the pieces next to it); within r metres
      // of the line in plan the place is lifted by what it lacks of 14.5 m (KEEP) over the line's height there, in
      // full on the line and easing to nothing at r metres, so the course goes over the line at the keep-off's own
      // measure and nothing steps. No allocation.
      // CROSS (leaving the wheel) is 12 m: no station of a bird that crosses lies nearer the line in plan, so a bird
      // come to its station is not lifted. CROSS_IN (going in to the wheel) is 30 m, for those birds come across
      // fast and from low and a narrow lift would whip them over; the lanes and the wheel lie nearer than that, so
      // the going-in's lift is eased in and out over the first and last twentieth of the going (CROSS_EASE).
      const CROSS = 12, CROSS_IN = 30, CROSS_EASE = 0.05;
      const overLine = (u, x, y, z, r) => {
        const c = Math.round(clamp(u, 0, 1) * NS), i0 = Math.max(0, c - kBack), i1 = Math.min(NS, c + kFwd);
        let b = 1e18, bi = i0;
        for (let i = i0; i <= i1; i += kStep) { const dx = x - rs[i * 3], dz = z - rs[i * 3 + 2], d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } }
        if (b >= (r + 3) * (r + 3)) return y;
        let bd = 1e18, yl = 0;
        for (let j = Math.max(bi - 2, 0), j1 = Math.min(bi + 2, NS); j < j1; j++) {
          const o = j * 3, ex = rs[o + 3] - rs[o], ez = rs[o + 5] - rs[o + 2];
          let s = ((x - rs[o]) * ex + (z - rs[o + 2]) * ez) / (ex * ex + ez * ez); s = s < 0 ? 0 : s > 1 ? 1 : s;
          const dx = x - rs[o] - ex * s, dz = z - rs[o + 2] - ez * s, d = dx * dx + dz * dz;
          if (d < bd) { bd = d; yl = rs[o + 1] + (rs[o + 4] - rs[o + 1]) * s; }
        }
        const lack = yl + KEEP - y;
        return bd < r * r && lack > 0 ? y + lack * (1 - smoothstep(0, r, Math.sqrt(bd))) : y;
      };
      const uUp = uAtZ(FIELD.z1 + 8 - 270);                 // they get up when the route comes within 270 m of the far headland
      const uHead = uAtZ(FIELD.z1 + 12);                    // the near bird holds station until the route is over the headland
      const towerTop = V3(collarW.x, 0, collarW.z), pa = V3(0, 0, 0), pb = V3(0, 0, 0), pc = V3(0, 0, 0), pd = V3(0, 0, 0), rt = V3(0, 0, 0);
      const craneRaw = (b, i, u, out) => {
        const rise = smoothstep(uUp + b.delay, uUp + b.delay + 40 * mU, u);
        routeAt(u + b.lead, rt);
        // the lane: beside and ahead of the route's own point; the near bird 12.5 m to starboard and 5 m up, the rest spread wide and higher
        const peel = i === 0 ? smoothstep(uHead, uHead + 70 * mU, u) : 0;
        let fx = rt.x + b.ox - peel * 46, fy = rt.y + b.oy + peel * 38, fz = rt.z + peel * 30;
        // toward the tower: past the stake ring they climb into the air about the rock, wheeling by the route's u
        const wTow = smoothstep(uBay - 20 * mU + (i === 0 ? 45 * mU : 0), uBay + 90 * mU, u), a = b.orbA + u * 16;
        fx += (towerTop.x + Math.cos(a) * b.orbR - fx) * wTow; fy += (b.orbH + 6 * Math.sin(a * 0.7) - fy) * wTow; fz += (towerTop.z + Math.sin(a) * b.orbR - fz) * wTow;
        // going in to the wheel a bird whose lane over the field lies to STARBOARD (ox under 0) must cross the flown line,
        // for the rock stands to port of it: it crosses OVER the line (overLine, above), all the way of its going in
        if (b.ox < 0 && wTow > 0 && wTow < 1) fy += (overLine(u, fx, fy, fz, CROSS_IN) - fy) * smoothstep(0, CROSS_EASE, wTow * (1 - wTow));
        if (b.lead2) {                                      // up the climb with us
          const wC = smoothstep(uFarBay - 70 * mU, uFarBay + 40 * mU, u);
          // und: beneath the cloth, from the cone until the route comes out past the port hem (a stretch of the route by place)
          const und = b.leadU ? 1 - smoothstep(uBeside - 60 * mU, uBeside + 60 * mU, u) : 0;
          // top: onto its lane for the run up the cloth, over the last 75 m before the route passes over the hem; top2:
          // opening out to its lane past the summit, from 125 m to 62 m short of the ring
          // (topH: first up to the run's height, the route's own at their place ahead, which is 20 m and more over the
          // cloth's line there; only then in over the hem)
          const top = smoothstep(uOver - 50 * mU, uOver + 10 * mU, u), topH = smoothstep(uOver - 120 * mU, uOver - 62 * mU, u), top2 = smoothstep(1 - 125 * mU, 1 - 62 * mU, u);
          const cross = b.latRun < 0;
          const ld = b.lead2 + (b.leadRun - b.lead2) * top + (und > 0 ? (b.leadU - b.lead2) * und : 0);
          routeExt(u + ld, rt2); routeExt(u + ld - 6 * mU, rt3);
          const hx = rt2.x - rt3.x, hz = rt2.z - rt3.z, hl = Math.hypot(hx, hz) || 1;
          routeAt(u, rt);                                   // they keep about the traveller's own height (on the run up the cloth, the route's height at their own place ahead)
          const latR = b.latRun + (b.latTop - b.latRun) * top2, upR = b.upRun + (b.upTop - b.upRun) * top2;
          // WHILE THE ROUTE IS BESIDE THE POUR (out past the port hem, the cloth on the starboard hand) a starboard bird
          // draws in to 8 to 14 m from the line in plan, between the traveller and the hem, at the traveller's own
          // height (20 m and more under the line at its own place ahead): it never flies in under the hem or through the
          // cloth; it goes out to its lane over the cloth as the route itself comes up over the hem
          const bes = cross ? smoothstep(uBeside - 10 * mU, uBeside + 55 * mU, u) * (1 - top) : 0;
          let lat = (b.lat + (latR - b.lat) * top) * (1 - 0.55 * bes), up = b.up2 + (upR - b.up2) * topH;
          if (und > 0) { lat += (b.latU - lat) * und; up += (b.upU - up) * und; }
          let ty = rt.y + (rt2.y - rt.y) * Math.max(topH, und) + up;
          // a starboard bird CROSSES OVER the flown line when the birds open out to port before the summit: in an arc 17 m
          // and more above the line at its own place ahead
          // (not beneath the cloth, where a near bird holds a station of its own beside the line and does not cross)
          if (cross && bes <= 0 && und <= 0 && Math.abs(lat) < 17) ty = Math.max(ty, rt2.y + Math.sqrt(289 - lat * lat));
          const lx = rt2.x + (hz / hl) * lat, lz = rt2.z - (hx / hl) * lat;
          // THE BIRDS AND THE CLOTH, by place (cs: the bird's own place along the cloth; dl: how far it is from the
          // cloth's middle; ch: the half width there). Until the run up the cloth begins (run 0) a bird within the
          // cloth's width keeps 30 m and more under its line, easing off over the 8 m outside the hem: it flies
          // beneath the cloth or beside it and never comes up through it. On the run (run 1) a bird over the cloth
          // keeps 16 m and more over its line (the waves on the pour reach 12 m), and is lifted there evenly as it rises
          // through the 12 m below that, so no bird jumps.
          toLocal(lx, lz, cl2); const cs = -cl2[1], cby = bannerY(cs), ch = halfAt(Math.max(cs, 0));
          if (cs > 0 && ty > cby - 32) {
            const run = smoothstep(0, 0.35, topH), inW = smoothstep(ch + 12, ch + 4, Math.abs(cl2[0] - bannerLX(cs)));
            if (run < 1 && ty > cby - 30) ty -= (ty - cby + 30) * inW * (1 - run);
            if (run > 0) { const over = cby + 16 * inW; if (over > ty) ty += (over - ty) * smoothstep(cby - 32, cby - 20, ty) * run; }
          }
          fx += (lx - fx) * wC; fy += (ty - fy) * wC; fz += (lz - fz) * wC;
          // leaving the wheel for its station a near bird swings wide of the flown line. The rock stands to PORT of the
          // line: a bird whose station is to STARBOARD (lat under 0) must cross the line and is lifted 20 m at the
          // middle of its going, so that its course passes OVER the line (keepOff then carries it over the top at
          // 14.5 m); a bird that stays to port (the rock's own hand) swings 12 m further out to port
          if (b.leadU) { const sw2 = Math.sin(Math.PI * wC); if (lat < 0) fy += 20 * sw2; else { fx += (hz / hl) * 12 * sw2; fz -= (hx / hl) * 12 * sw2; } }
          // and where that lift is not enough the crossing bird is carried over the line by place (overLine, above)
          if (b.leadU && lat < 0 && wC > 0 && wC < 1) fy = overLine(u, fx, fy, fz, CROSS);
          b.bob = wC;
        }
        // getting up: off the ground in a wide swing away from the flown line that falls in with the lane
        const swing = Math.sin(Math.PI * rise) * (1 - rise);
        out.set(b.gx + (fx - b.gx) * rise + b.side * swing * 30, 1.1 * b.size + (fy - 1.1 * b.size) * rise * rise * (3 - 2 * rise), b.gz + (fz - b.gz) * rise);
        return rise;
      };
      const craneAt = (b, i, u, out) => { const rise = craneRaw(b, i, u, out); keepOff(u, out); return rise; };
      life.push((dt, time, u) => {
        for (let i = 0; i < NC; i++) {
          const b = B[i], rise = craneAt(b, i, u, pa), wB = b.bob || 0;
          craneAt(b, i, u + 0.0017, pb);
          const vx = pb.x - pa.x, vy = pb.y - pa.y, vz = pb.z - pa.z, hv = Math.hypot(vx, vz);
          let yaw = hv > 1e-4 ? Math.atan2(vx, vz) : b.gyaw;
          // the bank: by how fast its own course turns (the heading a little further on against the heading here), with a
          // slow rocking on the wind by the world's clock; the near bird on station shows the traveller its wings' under side
          craneAt(b, i, u + 0.0074, pc); craneAt(b, i, u + 0.0091, pd);
          let turn = (Math.hypot(pd.x - pc.x, pd.z - pc.z) > 1e-4 && hv > 1e-4) ? Math.atan2(pd.x - pc.x, pd.z - pc.z) - yaw : 0;
          turn -= Math.PI * 2 * Math.round(turn / (Math.PI * 2));
          iBank[i] = (clamp(turn * 6.5, -0.4, 0.4) + 0.12 * Math.sin(time * 0.7 + b.ph * 3) - (i === 0 ? 0.42 : 0)) * rise;
          let dy = yaw - b.gyaw; dy -= Math.PI * 2 * Math.round(dy / (Math.PI * 2));
          const k = smoothstep(0.0, 0.5, rise);
          // from the far bay on a near bird rises and falls 2.4 m on the wind by the world's clock; this comes AFTER the
          // keep-off (14.5 m from the line), so by place a bird is 12 m and more from the flown line (14.5 less 2.4)
          iPos[i * 4] = pa.x; iPos[i * 4 + 1] = pa.y + wB * 2.4 * Math.sin(time * 1.7 + b.ph * 5); iPos[i * 4 + 2] = pa.z; iPos[i * 4 + 3] = smoothstep(0.0, 0.25, rise);
          iDir[i * 4] = b.gyaw + dy * k; iDir[i * 4 + 1] = hv > 1e-4 ? clamp(Math.atan2(vy, hv), -0.5, 0.5) * k : 0; iDir[i * 4 + 2] = b.ph; iDir[i * 4 + 3] = b.size;
        }
        aPos.needsUpdate = true; aDir.needsUpdate = true; aBank.needsUpdate = true;
      });
    }
    await ctx.yield();
    // ---- the gaze, the exit, the clockwork ------------------------------------------------------------------------
    // the swifts leave the collar where the route first comes within 150 m of it (a place, not a moment)
    let uBurst = uBay;
    { const p = V3(0, 0, 0); for (let i = 0; i <= NS; i++) { routeAt(i / NS, p); if (p.distanceTo(collarW) < 150) { uBurst = i / NS; break; } } }
    // THE SWIFTS KEEP OFF THE FLOWN LINE (note 9, V3): the part is handed the flown line where it passes through the
    // swifts' air, once, here at build, as a short row of points in the part's own frame. The stretch: from the first
    // route sample to the last that lies within 20 m of the swifts' greatest reach (the part's own swiftAir: their
    // widest wheel about the collar's axis in plan, between their lowest and highest places), and one sample more
    // either way. The row: even steps by metres along the route, as few points as keep every route sample of the
    // stretch within 0.3 m of the row's own straight piece, and the part's most (24) at most.
    { const A = hero.swiftAir, P = hero.object.position; let i0 = -1, i1 = -1;
      for (let i = 0; i <= NS; i++) {
        const y = rs[i * 3 + 1] - P.y;
        if (Math.hypot(rs[i * 3] - P.x - A.x, rs[i * 3 + 2] - P.z - A.z) < A.r + 20 && y > A.y0 - 20 && y < A.y1 + 20) { if (i0 < 0) i0 = i; i1 = i; }
      }
      i0 = Math.max(i0 - 1, 0); i1 = Math.min(i1 + 1, NS);
      if (i1 > i0) {
        const row = [];
        for (let n = 2; n <= A.line; n++) {
          row.length = 0;
          for (let k = 0; k < n; k++) row.push(routeAt((i0 + (i1 - i0) * k / (n - 1)) / NS, V3(0, 0, 0)).sub(P));
          let worst = 0;
          for (let i = i0; i <= i1; i++) {
            const k = Math.min(Math.floor((i - i0) / (i1 - i0) * (n - 1)), n - 2), a = row[k], e = row[k + 1];
            const ex = e.x - a.x, ey = e.y - a.y, ez = e.z - a.z, px = rs[i * 3] - P.x - a.x, py = rs[i * 3 + 1] - P.y - a.y, pz = rs[i * 3 + 2] - P.z - a.z;
            const t = clamp((px * ex + py * ey + pz * ez) / (ex * ex + ey * ey + ez * ez), 0, 1);
            worst = Math.max(worst, Math.hypot(px - ex * t, py - ey * t, pz - ez * t));
          }
          if (worst <= 0.3) break;
        }
        hero.setFlownLine(row);
      }
    }
    // THE GAZE GOES WITH THE ROUTE (P6, R2, U1, U2): three looks, one after another (never two at once), each at a
    // place of its own; everywhere else the traveller looks where the route goes. (1) Coming up to the near bay: first
    // the ground between the two feet of the bay, 30 m inside the stake ring and 9 m up (the headland, its lorries and
    // reels); from 80 m to 42 m short of the stakes the place slides up onto the FAN, to 105 m up the rock under its
    // collar, and is held there until the feet are abeam: the fan and the collar fill the frame, the ground is its lower
    // quarter, and the stakes and roped feet pass out by the lower corners. (2) Inside the cone, while the route flies
    // straight at the tower: up the rock to its collar, where the ribbons meet; it lets go before the rock is abeam.
    // (3) follows the route after the cone and is described below.
    const bayStake = hero.anchors.bayNearStake.clone().add(hero.object.position);
    const bayFloor = bayStake.clone().addScaledVector(V3(TOWER[0] - bayStake.x, 0, TOWER[2] - bayStake.z).normalize(), 30); bayFloor.y = 9;
    const uStake = uNear(bayStake.x, 13, bayStake.z);
    const bayFan = V3(gazeW.x, 105, gazeW.z), bayV = V3(0, 0, 0);
    const bayLook = (time, u) => bayV.copy(bayFloor).lerp(bayFan, smoothstep(uStake - 80 * mU, uStake - 42 * mU, u));
    const lookV = V3(0, 0, 0), ringC = V3(RING.c[0], RING.c[1], RING.c[2]);
    const routeSAt = (u) => { const f = clamp(u, 0, 1) * NS, i = Math.min(Math.floor(f), NS - 1); return routeS[i] + (routeS[i + 1] - routeS[i]) * (f - i); };
    // (3) FROM THE CONE TO THE RING (T1, U1), one look whose place slides with the route (by its u) along the cloth's
    // own line. BENEATH THE CLOTH (from the cone's exit until the route is out past the port hem) it rests on the
    // cloth's UNDER FACE, up the cloth's line from the route's own place by 120 m at the far bay (the cloth far
    // overhead: the gaze tips up some 48 degrees and the under face comes down the upper frame to the ring) sliding out
    // to 190 m as the route closes on the cloth (the ring and the horn rise to the frame's middle, the hem comes down the
    // starboard side). From 10 m before the hem to 110 m past it the place slides on to the look for the pour: a place
    // on the line nearer the hoist than the route's own place by 330 m, drawing in to 80 m on the run up the cloth (never
    // nearer the hoist than 60 m), held 62 m over the route's own height while the route is low beside the pour; over
    // the last 190 m it rises to the ring's own middle.
    const routeYAt = (u) => { const f = clamp(u, 0, 1) * NS, i = Math.min(Math.floor(f), NS - 1); return rs[i * 3 + 1] + (rs[i * 3 + 4] - rs[i * 3 + 1]) * (f - i); };
    const lookU = V3(0, 0, 0);
    const underAt = (u) => 1 - smoothstep(uBeside - 10 * mU, uBeside + 110 * mU, u);
    const runLook = (time, u) => {
      const k = smoothstep(uBeside - 60 * mU, uOver + 40 * mU, u), s = routeSAt(u), j = underAt(u);
      bannerLine(Math.max(s - 330 + 250 * k, 60), lookV); lookV.y += (routeYAt(u) + 62 - lookV.y) * (1 - k) - 44 * k * (1 - k);
      if (j > 0) lookV.lerp(bannerLine(Math.max(s - lerp(120, 190, smoothstep(uFarBay, uBeside, u)), 60), lookU), j);
      return lookV.lerp(ringC, smoothstep(1 - 190 * mU, 1 - 60 * mU, u));
    };
    const pois = [{ at: bayLook, from: uStake - 118 * mU, to: uStake + 7 * mU, weight: 0.75, fade: 0.13 },
      { at: gazeW, from: uStake + 11 * mU, to: uAbeam + 24 * mU, weight: 0.85, fade: 0.25, arc: true },      // (2) ends where (3) begins: never two looks at once
      { at: runLook, from: uAbeam + 24 * mU, to: 1 - 40 * mU, weight: 0.9, fade: 0.07, arc: true, steady: true }];
    // the speeds of the journey over the world's average, by place: slower over the field and inside the cone (the two
    // places to linger), quicker on the climb beneath the cloth, eased beside the pour (the third place to linger) and
    // for the run up the cloth to the ring
    const pace = (u) => 0.86 + (1.14 - 0.86) * smoothstep(uAbeam + 20 * mU, uAbeam + 150 * mU, u) + (0.92 - 1.14) * smoothstep(uBeside - 60 * mU, uBeside + 60 * mU, u)
      + (1.0 - 0.92) * smoothstep(uOver - 20 * mU, uOver + 80 * mU, u);
    const cupQ = new THREE.Quaternion(), cupS = V3(1, 1, 1), cupP = V3(0, 0, 0), cupAxis = V3(0, 1, 0);
    return {
      scene, path, duration: 46, pace,
      camera: { fov: 62, near: 0.3, far: 7000, lookAhead: 110, bank: 0.4 },     // the eye rests 110 m down the route, so it leads into every bend
      pois,
      portal: { shape: 'circle', radius: PORTAL_R, style: 'ring', glow: 0, halo: false, veil: '#F3EFE4', color: '#77746E', revealDistance: REVEAL },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        routeAt(u, U.uRoute.value);                 // the route's own point: the only thing that follows the traveller
        ringOpen.value = smoothstep(REVEAL + 2, REVEAL + 14, (1 - u) * path.length);   // T6: the drawn lens is held until 48 m of route are left and has drawn back by 36 m, before the opening can show the next world
        hero.update(dt, time, null);                // the world's clock drives every cloth
        hero.setProgress(0.355 + (u - uBurst));     // the part bursts its swifts at its own 0.355: handed our place's u
        for (let k = 0; k < mastTops.length / 3; k++) {
          cupQ.setFromAxisAngle(cupAxis, time * (5.2 + (k % 5) * 0.7) * (0.6 + 0.5 * WIND.k) + k);
          cupP.set(mastTops[k * 3], mastTops[k * 3 + 1] + 0.12, mastTops[k * 3 + 2]);
          cups.setMatrixAt(k, cupM.compose(cupP, cupQ, cupS));
        }
        cups.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < life.length; i++) life[i](dt, time, u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
