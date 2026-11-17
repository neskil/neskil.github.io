// THE LIGHTHOUSE OF ALEXANDRIA, about 260 BC: the hero set piece and the laws of the place.
// World axes: +x east, +z south, y up; the tower's centre is the origin, the mean sea is y 0.
// This file holds (1) the brief's measures as named constants, (2) the laws of the place that both the world and the
// counts under scratchpad/pharos-of-alexandria read (the route, the deal of a visit, every lane and box of a clock-moved
// body), and (3) buildHero: rock, sea wall, tongue, landing, stair, ramp on arches, the three stages, door, hearth,
// fire, pier, figure and smoke.
// NOTHING HERE HAPPENS BECAUSE WE COME: every mover is a function of the world clock alone.
// DECLARED PACING: none (no craft, companion or team goes with the visitor; the flight's own pace is the world's pace(u)).
// (p1, THE FIRST POLISH ROUND) WHAT THIS ROUND HOLDS, each said again where it stands:
//   THE LINE IS LB (the route, below): the level straight 45 m, the bearing away 20 degrees (BEAR_AWAY, a figure of its own: the ships' way's own
//     bearing, WAY_BEAR, is 30), a turn of 32 m. WHY: the tower stands a little nearer the gaze's middle on the straight (its lean in the picture, which
//     is perspective under a lifted gaze and no roll there but the sway's, is less by the line alone and less again with the gaze's low lift on the way: THE LEAN, below,
//     and the world's look law), and THE PASS, A BEAT OF THE FLIGHT (the design's journey names it): the line passes the merchant ship of the
//     roadstead's second berth close, the tower standing behind her mast as we come by. BY RULE: the berth grid's place is 26.39 m from the line at
//     the nearest (metre 174); her home, dealt within BERTH_DRAW of it on each axis, lies 25.11 to 27.67 m from the line, and with her swing her
//     middle may stand 23.18 m from it (the owner's caution: her men were made to be seen far). THE CLEAR AIR FOR THIS PASS IS 14.91 m BY RULE: the
//     least over her berth's whole draw box, less her reach (9.5 m x her scale .85) and her swing's corner (1.5 m on each axis). The other clear-air
//     marks are r6's, unchanged. No ship is moved and no figure is made for the pass.
//   THE WALL READS BY FORM. Nothing new is set on the tower: the belts, the plinth's cap, the cornices, the windows' frames and reveals stood here
//     already; their measures change, and the law of their shade. INVENTED BY NEED (no source gives these measures):
//       the first stage's belts: string courses 0.55 m high standing 0.32 m proud, a weathering of 0.14 m, a flat soffit (BELT_H, BELT_OUT, BELT_WEATHER);
//       the plinth's cap standing 0.62 m (0.3 + BELT_OUT) with its soffit, its weathering 0.45 m high (r6: 0.35);
//       the eight-sided stage's two belts 0.45 m high, 0.24 m proud, weathering 0.12 m (BELT2); the round stage's belt 0.4, 0.2, 0.1 m (BELT3);
//       the shade under a ledge: its reach three times the ledge's stand, its depth close under the ledge .55 of the wall's fill and of the bright
//       quarter's light (LEDGE_REACH, LEDGE_SHADE: the reckoning stands with the figure, below);
//       a window's reveal 0.85 m deep (WINDOW_DEEP); its frame: jambs 0.28 m wide standing 0.16 m, a head 0.34 m standing 0.24 m and reaching 0.4 m past
//       the opening, a sill 0.28 m standing 0.34 m and reaching 0.46 m (WINDOW_FRAME); the share of the wall's tone a far window takes, .3 (WINDOW_FAR);
//       the reveal's shade coming on from 2 to 12 cm behind the wall's face; its darkening inward by r6's own two tones over r6's own depth;
//       the courses' strengths: the joint .5 of the tone, a course's tone .15, a block's .13, the four-course banding .1 (r6: .42, .1, .11, .075).
//       THIS LAW IS SHARED: it is the law of every coursed plaster wall of the place (kinds 1 and 7), so the round stage and the island town's
//       house walls take the same strengths; and what the far windows gain (WINDOW_FAR) is given up by every upright wall of kind 1 under the
//       first cornice's height, the town's among them (WINDOW_WALL_SHARE x WINDOW_FAR: about one part in a hundred of the tone; r6: nearly three);
//       the fire by the hour (below): HEARTH_GAIN, HEARTH_GLOW and the two sun rows of SMOKE_BY_HOUR, every figure;
//       THE FLIGHT'S OWN FIGURES, each owned as a figure of the flight and derived from no measure of the place: LEVEL_RUN 45 m (the level straight:
//       0.1203 of the flight by metres; the gaze's rise to the tower ends at its end and the bearing away begins there), BEAR_AWAY 20 degrees (the
//       heading held on the straight; the ships' way's own bearing is 30), TURN_R 32 m (the turn's radius, 2.29 lengths of our vessel: it sets how
//       near the pass goes), and in the world PACE_TURN 0.58 (the pace round the turn), the flight's 29.4 s and LIFT_WAY .28 (the gaze's lift on
//       the way, as a share of the head's elevation).
//   THE SHADE UNDER A LEDGE, ONE LAW (phLedge) for the first stage's belts, the plinth's cap and the three cornices, each by its own stand: the wall
//     under a ledge loses the sky the ledge shuts out, most just under it, nothing at the reach's end; what is drawn is that loss's MEAN OVER THE
//     PIXEL, in closed form. (The upper stages' belts, BELT2 and BELT3, have their soffit's tone only: the law is not drawn under them.)
//   A REVEAL LIES IN ITS WALL'S SHADE: inside an opening of the first stage a face takes the bright quarter and the sky's fill by no more than the
//     wall's own facing gives (r6 lit a jamb by its own facing alone: in a wall turned from the quarter one jamb of every window stood bright).
//     AND IT DARKENS INWARD AT r6'S OWN RATE: to .4 of its tone 0.42 m in (r6's whole reveal), and on at that rate to the room, 0.85 m in (.16):
//     a deep opening is dark inside, and seen askew from near it is a dark slot (with the reveal's two tones merely drawn out over twice the depth
//     the jamb stood pale and the window read as a blind niche).
//   THE FIRE BY THE HOUR: the hearth's gain, its glow's gain and its smoke are rows of three (low sun, sunset, early dusk): HEARTH_GAIN 2.0, 2.0, 1.9;
//     HEARTH_GLOW 2.6, 2.4, 1.9 (by gain x the hour's exposure the flame is 2.00, 2.12 and 2.28, the glow 2.60, 2.54 and 2.28: the glow is
//     brighter at the two sun hours than at dusk, and its gain is 2.26 times r6's at the low sun and 1.85 times at sunset: 2.6 and 2.4 where r6
//     had 1.15 and 1.3. THE BRONZE FIGURE STANDS IN IT, with the pier and the hearth's ring: the glow is light added over what stands in it
//     and covers nothing); SMOKE_BY_HOUR: at the two sun hours a soft grey haze over the fire, as wide as it is long (some
//     20 m up and 20 m down the wind; a puff's strength at its fullest .2 and .18, drawn .2 and .144 with the hour's SMOKE_OPACITY: no column, no
//     line, no streak), at early dusk r6's own smoke. Early dusk's three are r6's own, unchanged.
//     WHAT MAY STAND OVER THE FIRE, BY THE OWNER'S LEAVE (in words). The term "the fire is the brightest thing of the place" is not asked against:
//       the sun's own disc and its path on the sea;
//       the sunlit sails of the nearest merchantmen on the ships' way, in the flight's first metres at the low sun's entry;
//       the light of the door's opening, the way out, at every hour;
//       single pixels of sunlit cloth and a glint, at the sun hours' entry.
//       THE OWNER'S REASONS: each is lit by the place's one law of light and none for the entry; the cause at the entry is the engine's own
//       vignette on a small flame in a corner; the leave covers these and nothing lit, sized or placed for a still.
//       WHAT THE BYTES GIVE OF THESE. A sail is plain linen: the place's one law of light on the side seen PLUS the cloth's own light through
//       it (what falls on its far side shows on ours, up to six tenths of it, with a .35 share of the sky's at every hour: r6's own term,
//       unchanged; it reads the eye only to tell which side is seen, no metre and no entry). A sail on the ships' way heads 150 and the low
//       sun bears 298, 32 degrees off square to the after face, which is the face we see. The engine's picture has a vignette (the world sets
//       it 0.3); at the entry the flame is about a degree and a half wide and stands 25 of the picture's 27 degrees over its middle and well to
//       the right: in its upper corner. THE DOOR'S OPENING: the picture in it is the next place's and the engine's (shown from the entry on:
//       the world's revealDistance is twice the line's length); the light inside its rim and its halo are drawn by the engine in this world's
//       own colour and a glow of 0.4 (DOOR_LIGHT and the portal's glow: r6's own figures, neither raised in this round). No row of the hour
//       and no cloth is changed for any of these.
//   THE WAY OUT AND ITS LIGHT (the owner's rule on a light or a double of the ring; the law lives in this file: the door's term of the one
//     law of light, phLight, with uDoorPos and uDoorCol). The world sets neither portal.drawWithin nor portal.drawIn. A LIGHT OF THE RING
//     STANDS, at every metre by place: the door's light (the world's DOOR_LIGHT x 0.4, from a point before the opening's middle, by a face's
//     turn to that point and its distance from it) falls on every body near the door that takes the one law, the stone before it and whoever
//     stands or walks there; it reads no eye, no metre and no clock. No image of the ring itself is drawn; the tower's image on the water is
//     the tower's wall under the same law, so about the door's place the mirrored wall carries the door's light too, its colour and no more
//     (r6's own law and figures, unchanged).
//   THE LEAN, FOR BOTH CAMERAS. EVERY COUNT OF THE FLIGHT AND ITS CAMERAS IN THIS FILE IS AT THE VIEWER'S PACE 1 IN THIS WORLD (the engine's
//     settings.speed, which the page's Pace slider runs from 0.4 to 2.5; no flight at another Pace, or hurried to the portal, is counted) AND,
//     WHERE THE SWAY IS NOT NAMED, OF A FLIGHT WITH NO SWAY. ON A FLIGHT WITH NO SWAY the lean is 3.96 degrees at the most with the eased
//     camera (about metre 182) and 4.11 with the viewer's steady camera (about metre 187; over 4 for 1.18 s); by the line alone, with r6's
//     lift, 7.0 and 7.3; on r6's line 8.6 and 8.9. WITH THE ENGINE'S SWAY (this world's 0.7; the eased camera's alone: the steady camera has
//     none, so its 4.11 stands) the eased camera's greatest lean on a given flight runs from 3.35 to 4.56 degrees (about metres 180 to 188),
//     by the reading of the engine's clock at the entry: over 4 on about 45 flights in a hundred, for up to 2.4 s; r6 by the same count: 7.97
//     to 9.28. The aim was about 4: no bound is claimed; the round about halves the lean. THE SUN'S OWN SHADE under a belt is drawn (the
//     belt's nose cuts the sun off the wall below it) but is under a pixel far off at the suns the seeds deal: 6 degrees (3 to 7 cm of shade) and 1
//     degree (about 1 cm); the shade that reads at every hour is the sky's.
//   THE FIGURE'S TOP AT THE PICTURE'S TOP EDGE IN THE FIRST 20 m, BY THE OWNER'S LEAVE (in words), as it is. Where the gaze still rises from
//     the way we go, the bronze figure's head, and its staff's tip with it, stands over the picture's top edge. EACH COUNT HERE IS OF ONE
//     NAMED FLIGHT WITH THE SWAY LEFT OUT, and none is a bound.
//     AFTER A CROSSING, which is how a visitor comes (to the first world of a visit too, out of the antechamber): the engine's turn eases in
//     over its first second (ARRIVE_EASE), and the camera keeps the direction and the speed it came in with. In on this world's first gaze
//     at this world's own pace: with the eased camera 0.34 degrees over the edge (the figure's upper 1.6 m of its 7; metres 5 to 13, 0.57 s),
//     with the viewer's steady camera 0.99 (4.5 m; from the entry to metre 19, 1.28 s); r6: 0.39 and 0.60. In on the door's own axis (due
//     south, level) the steady camera's is 0.62 (2.9 m; metres 5 to 18, 0.93 s), the eased camera's the same 0.34. By the speed it comes in
//     with: at 8 m/s, the antechamber's pace, 0.24 and 0.90; at 3 m/s 0.19 and 0.87; at 25 m/s 0.51 and 1.18, and over the edge as far as
//     metre 16 and metre 22.
//     A FLIGHT BEGUN IN THIS WORLD (no crossing: a page that opens on this one world with no antechamber): no ease, the speed from the
//     line's length over its seconds: 0.21 (1.0 m; metres 5 to 12, 0.52 s) and 0.91 (4.2 m; from the entry to metre 19, 1.33 s); r6: 0.28
//     and 0.52. (With the world's own pace from the first step: 0.23 and 0.93; r6: 0.29 and 0.52.)
//     THE SWAY: the eased camera's gaze sways by the engine's figures and this world's sway 0.7, up to 0.68 of a degree of pitch either
//     way, 1.08 of yaw and 0.32 of roll, slowly, by the engine's own clock. So on a given flight AFTER A CROSSING AT THIS WORLD'S OWN PACE
//     (in at 15.07 m/s) the eased camera's top may stay inside the picture (half a degree under the edge at its nearest) or stand up to
//     1.2 degrees over it (1.16); 0.6 under to 1.0 over on a flight begun here. BY THE SPEED IT COMES IN WITH, the sway at its worst: in
//     at 3 m/s up to 1.01 over, at 8 m/s 1.06, AT 25 m/s 1.34 (0.3 under at the best; r6: 1.39), and faster in further still (at 40 m/s
//     1.62; r6: 1.69). The steady camera has no sway.
//     THE FLAME'S TIPS stay inside the picture on every flight counted with no sway that comes in at 25 m/s or slower, and with the sway at
//     this world's own pace or slower: after a crossing 0.97 (eased) and 0.34 (steady) of a degree under the edge at the nearest (r6: 0.92
//     and 0.72), on a flight begun here 1.10 and 0.41 (r6: 1.03 and 0.80); 0.15 at the least, with the sway after a crossing at own pace
//     and with the steady camera in at 25 m/s. NOT ON EVERY FLIGHT: a faster crossing carries them over the edge (THE FLAME'S TIPS ON A
//     FAST CROSSING, below).
//     THE OWNER'S REASON FOR THE FIGURE'S TOP: its term was the tower inside the frame on every frame, and the count holds it (no frame without the tower with
//     either camera on any of these flights); the figure's top touching and for a moment passing the top edge while the gaze still rises is
//     r6's own state; this round is a hair better with the eased camera and four tenths of a degree worse for a moment with the steady one
//     (chiefly by the line: the bearing away begins 15 m sooner and the steady camera looks further along the line; by the line alone 0.84
//     on a flight begun here).
//     THE FLAME'S TIPS ON A FAST CROSSING: WITH THE STEADY CAMERA THIS ROUND IS WORSE THAN LIVE BY THE FIRST-GAZE START (live is the
//     released round, r6c: what this head calls r6); BY THE SAME DIRECTION IN the two rounds are alike within a tenth of a degree in at 8
//     to 65 m/s, and on a fast crossing (25 m/s and faster) this round is a little the better. THE START OF EACH COUNT: after a crossing
//     the camera keeps the direction it came in with, and two directions are counted. ON THIS WORLD'S OWN FIRST GAZE: the steady camera's
//     first gaze looks 61 m down the line, in this round past the 45 m level run into the bearing away, and so stands 1.9 degrees (1.91)
//     off the door's axis on the side away from the tower; live's level run is 60 m and its steady first gaze stands on the axis. The first
//     gaze is the engine's start only of a flight begun in this world, which is no fast crossing. ON THE DOOR'S OWN AXIS (the line's own
//     direction at the entry, level): so the steady camera comes in out of the antechamber, a straight level way; what direction another
//     world gives is that world's own and is not counted. THE STEADY CAMERA (it has no sway), IN ON THE FIRST GAZE: the flame's tips first
//     reach the picture's top edge on a crossing in at 32.1 m/s, against live's 46.4; in at 40 m/s they stand 0.20 of a degree over it for
//     0.32 s (metres 13 to 21) where live keeps 0.17 under; in at 65 m/s 0.89 over for 0.53 s (live: 0.51 for 0.40 s). THE STEADY CAMERA,
//     IN ON THE DOOR'S OWN AXIS: in at 25 m/s the tips keep 0.56 under the edge (live: 0.53); in at 40 m/s 0.24 under (live: 0.17); they
//     first reach the edge in at 49.5 m/s (live: 46.4); in at 65 m/s 0.42 over for 0.37 s (live: 0.51 for 0.40 s). Slower in, live is the
//     better there: at this world's own pace 0.70 under against live's 0.72, in at 8 m/s 0.73 against 0.82, in at 3 m/s 0.70 against 0.84.
//     THE DIRECTION IN WEIGHS MORE THAN THE SPEED, in both rounds alike: each degree of yaw away from the tower lifts the tips about 0.2 of
//     a degree (0.22) at the top edge and brings the speed at which they first reach it 8 to 9 m/s down (five degrees away and they stand
//     over the edge at this world's own pace: 0.34, live 0.28); neither 32.1 nor 49.5 is a bound. THE EASED CAMERA (its first gaze is the
//     door's axis in both rounds, but for the sway): with no sway the tips stay under the edge up to 65 m/s (0.03 under there; they first
//     reach it in at 66.7 m/s, live's at 62.7): there the round is a hair better than live; with the sway at its worst, in at 25 m/s 0.02
//     over on 18 of 6,000 readings of the engine's clock (live: 0.07 on 62), in at 40 m/s 0.29 on 653 (live: 0.35 on 894). (So fast comes a
//     visitor who hurried to the portal before this one: the engine then aims at five times that world's pace, twice on a calm journey.)
//     BY THE OWNER'S LEAVE, BY NAME (13 Oct, 12:20), beside the leave for the figure's top, on its reasons: the tower is in every frame on
//     every flight counted; the loss is the flame's tips two tenths of a degree past the top edge for a third of a second, for a visitor
//     who hurries in with the steady camera (the count in at 40 m/s on the first gaze; faster in it is more, as said); the gain is the lean
//     halved for every visitor on every flight (THE LEAN, above: 46 hundredths of live's with no sway; 41 to 51 with the sway, by the same
//     reading of the engine's clock, over a half on 98 of 6,000 readings). THE LEAVE WAS GIVEN ON THE FIRST-GAZE FIGURES, THE WORSE OF THE
//     TWO STARTS. The leave eases nothing of the deciding sheets' measure.
//     NO CURE IN THIS ROUND, FOR THE FIGURE'S TOP OR FOR THE FLAME'S TIPS: THE LOOK LAW'S FIRST METRES STAND FIRST ON THIS WORLD'S NEXT
//     LIST (so that with both cameras the figure's top keeps the edge), WITH ONE MEASURE: both cameras hold the flame's tips inside the
//     picture at least as far as live does, IN ON THIS WORLD'S OWN FIRST GAZE AND IN ON THE DOOR'S OWN AXIS ALIKE, with no sway. On the
//     axis it is met already (the steady camera to 49.5 m/s in against live's 46.4; the eased camera to 66.7 against 62.7); on the first
//     gaze it is not (the steady camera to 32.1 against live's 46.4; the eased camera's first gaze is the axis).
//     (Counted by the engine's pose and its turn law at sixty steps a second; the picture 54 degrees high.)
// WHAT READS THE EYE IN THIS FILE (each is said where it stands; none moves, times or lights a thing for where the
// visitor is; no body is placed, sized or shown by any of them):
//   the mirror's law: the tower's image and the fire's glints on the water (phTowerHit, phGlints), the sheen on the
//     granite and the glint on the bronze;
//   soft things that face the eye: the smoke's puffs, the fire's halo (two discs turned about the fire's own place);
//   the pixel's size alone, each a FILTER OF A PATTERN ON A FACE about that pattern's own mean, so that a face's
//     mean tone is one far and near: the courses' joints and tones, the courses' banding at middle distance, the
//     paving's joints, the windows' dark softened far off, the glints' cells; and THE WALL'S NEAR
//     DETAIL (the smaller facing stones, hairline joints, cracks and pits of the plaster), which is drawn where a
//     pixel holds less than about 4 cm of wall and whole under about 2 cm, each part about its own counted mean:
//     a filter by the pixel's size alone, on the wall's own face; it is no body and nothing stands or moves by it;
//     (p1) and THE SHADE UNDER A LEDGE, which is its own mean over the pixel's height on the wall (phLedge, in closed form; the mean is taken under
//     the ledge alone, so a pixel that holds more than the reach takes a little less than the band's whole mean), and THE SUN'S CUT under a belt's
//     nose, whose edge is a step softened over one pixel: far off a ledge's shade is a calm tone and never a line finer than a pixel: the same kind
//     of filter, about the shade's own mean.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';

// ---------------------------------------------------------------- the brief's measures
export const M = {
  PLATFORM_Y: 4,
  S1_FOOT: 30, S1_TOP: 26, S1_H: 60,
  S2_FLATS: 16.4, S2_H: 30,
  S3_DIA: 8.7, S3_H: 8,
  PIER_H: 5, PIER_W: 2.2, FIGURE_H: 7,
  COURSE_H: 0.5, BLOCK_L: 1.0,
  DOOR_H: 12.76, DOOR_W: 6, DOOR_SILL: 9, DOOR_JAMB: 1.6, DOOR_LINTEL: 1.2,
  RAMP_L: 68, RAMP_W: 9, RAMP_ARCHES: 16, RAMP_PARAPET: 0.9,
  CORNER_FIG_H: 5, PARAPET_H: 1.2,
  WIN_W: 0.8, WIN_H: 1.7,
  BAND_SHAPE_H: 0.5, BAND_L: 24, BAND_UP: 48,
  MERCHANT_L: 14, MERCHANT_W: 4.4,
  WARSHIP_L: 40, WARSHIP_W: 5, WARSHIP_DECK: 3,
  HOUSE_H: 9, TOWN_TOWER_LO: 14, TOWN_TOWER_HI: 18,
  SUN_AZ: 298,
  TONGUE_X0: 30, TONGUE_X1: 98, TONGUE_HALF: 13,
  SHELF_X0: 76, SHELF_X1: 98, SHELF_Z0: 5, SHELF_Z1: 13, SHELF_Y: 1.5,
  STAIR_W: 5, RAMP_FOOT_X: 88, RAMP_HEAD_X: 20, DOOR_X: 15,
};
// derived heights
export const Y1 = M.PLATFORM_Y + M.S1_H, Y2 = Y1 + M.S2_H, Y3 = Y2 + M.S3_H, Y_PIER = Y3 + M.PIER_H, Y_HEAD = Y_PIER + M.FIGURE_H;
// The granite doorway AS BUILT HERE: two posts, each a single stone 11.56 m clear, under a lintel of one stone 1.2 m
// deep: 12.76 m in all, the brief's height for the whole door; the posts after the one measured stone of this
// doorway, a post of over 11.50 m. The clear opening under the lintel is 6 m wide and 12.76 - 1.2 = 11.56 m high,
// and the portal is that opening.
export const DOOR_OPEN_H = M.DOOR_H - M.DOOR_LINTEL;
export const DOOR_Y0 = M.PLATFORM_Y + M.DOOR_SILL, DOOR_YC = DOOR_Y0 + DOOR_OPEN_H / 2;

// The two named constants of the sea count: the eye's height over the mean sea on the water, and the largest swell
// the deal may give (the kit's `height`; the eight geometry waves' amplitudes sum to 1.35 times it).
export const ROUTE_DECK_Y = 4.2;
export const SWELL_HEIGHT_MAX = 0.7;
export const HOURS = ['low sun', 'sunset', 'early dusk'];
export const SUN_ELEVATION = [6, 1, -2.5];
export const SWELLS = ['calm', 'light', 'moderate'];
const SWELL_HEIGHT = [0.32, 0.48, 0.64];

// the ramp's paving: a plane from the foot (x 88, y 4) to the door platform (x 20, y 13); level beyond both ends
export function rampY(x) { return M.PLATFORM_Y + M.DOOR_SILL * clamp((M.RAMP_FOOT_X - x) / M.RAMP_L, 0, 1); }
// the landing stair: its foot on the shelf at x 90, its head at x 78.5 on the ramp's level there, STAIR_STEPS treads
// between; west of its head a level landing at that same height runs to GAP_X0, beside the gap in the ramp's parapet
export const STAIR_X_FOOT = 90, STAIR_X_HEAD = 78.5, STAIR_Z0 = 5, STAIR_Z1 = 10, GAP_X0 = 72, GAP_X1 = 78.5, STAIR_STEPS = 22;
// THE BODIES THAT WALK AND STAND, by their own measures as the world file builds them (a walker at his largest, 1.75 m
// to the crown, with the sack on his shoulder; a pack donkey at its size with its two bundles and their ropes; a
// stander at his largest, 1.75 m, his hands at his sides; the gaps' count measures the drawn shapes through every
// phase of the step and holds these to them, each rounded up to the centimetre):
//   half: from the middle to the widest point; fore and aft: the reach ahead and astern (a donkey's muzzle and tail; a
//   walker's foot at the end of his stride); high: the highest point (the ears' tips; the sack with the step's lift).
export const BODY = { donkey: { half: 0.6, fore: 1.23, aft: 0.77, high: 1.46 }, walker: { half: 0.36, fore: 0.52, aft: 0.53, high: 1.79 }, stander: { half: 0.32, high: 1.75 } };
// HAND: the clear hand's breadth and more that a body keeps from stone, wood and iron (a load does not scrape a
// parapet). BODY_GAP: the room two bodies leave between them where they pass or stand.
export const HAND = 0.25, BODY_GAP = 0.2;
// THE RAMP'S TWO SIDE WALKS, BY THE RAMP'S OWN MEASURES (r6b). The ramp is RAMP_W wide between its parapets' inner
// faces. THE UP LANE's middle lies inside that face by half the widest body that walks it (the donkey with its load)
// and a clear hand. THE DOWN LANE's middle lies a passing width further in: the widest two bodies that can meet are
// two loaded donkeys of one string, the one that has turned and the one behind it at either end of the walk, and
// they pass with BODY_GAP between their loads. Each end of a walk is a half round of half that passing width, whose
// middle stands a donkey's reach ahead, the turn's own radius and a clear hand inside the walk's end: above the
// ramp's foot below, and off the face of the door's posts on the platform above.
export const RAMP_IN = M.RAMP_W / 2, DOOR_FACE_X = 15.75;
export const UP_LANE = RAMP_IN - (BODY.donkey.half + HAND), LANE_PASS = 2 * BODY.donkey.half + BODY_GAP, DOWN_LANE = UP_LANE - LANE_PASS;
export const WALK_TURN = BODY.donkey.fore + LANE_PASS / 2 + HAND, WALK_FOOT_X = M.RAMP_FOOT_X - WALK_TURN, WALK_HEAD_X = DOOR_FACE_X + WALK_TURN;
// the door platform's own measures (its half width, its low parapet's thickness) and the pack slope's (where its top
// edge lies along the tongue and how far it reaches south of the ramp's wall), written once and built from here
export const PLATFORM_HALF = 8, PLATFORM_PARAPET = 0.45, PACK_SLOPE = [91, 97.5, 7.6], BOLLARD_R = 0.27;
// the shelf walk's two lanes, on the stair and on the shelf: [inner, outer] z; two walkers pass with BODY_GAP between
export const WALKER_PASS = 2 * BODY.walker.half + BODY_GAP;
export const STAIR_LANES = [STAIR_Z0 + BODY.walker.half + HAND, STAIR_Z0 + BODY.walker.half + HAND + WALKER_PASS], SHELF_LANES = [PACK_SLOPE[2] + BODY.walker.half + HAND, PACK_SLOPE[2] + BODY.walker.half + HAND + WALKER_PASS];
// the firewood stacks: [x of its west end, z of its north side, rows, logs to a row]; a log is 1.5 m long, 0.26 m thick
export const STACKS = [[63, -12.6, 4, 5], [64.7, -12.6, 3, 5], [49, -12.6, 4, 4], [79.5, -12.5, 3, 5]];
export const stackBox = ([x0, z0, , wide]) => [x0, x0 + 1.5, z0, z0 + 0.27 * wide];
// the stair's surface under a point (r6b: the tread under it, as built; east of the foot the shelf, west of the head
// the level landing)
export function stairY(x) {
  const t = (STAIR_X_FOOT - x) / (STAIR_X_FOOT - STAIR_X_HEAD);
  return t <= 0 ? M.SHELF_Y : lerp(M.SHELF_Y, rampY(STAIR_X_HEAD), Math.min(STAIR_STEPS, Math.floor(t * STAIR_STEPS) + 1) / STAIR_STEPS);
}
// THE LIGHTS OF EARLY DUSK: each kind has a size and a gain OF ITS OWN, all plainly under the hearth's. The hearth is
// a great fire several metres across (a ring of flame 5 to 7 m wide and 4.4 m high; its gain by the hour is
// HEARTH_GAIN, and its brightest value is 1.95 times that gain). A harbour light is a small bowl of burning pitch; a
// window shows an oil lamp behind a reveal; a stern lantern is one small flame behind horn.
//   HEARTH_GAIN        the hearth's flame, by hour (low sun, sunset, early dusk); HEARTH_GLOW: its glow, by hour
//   SMALL_FLAME_GAIN   a harbour light's flame: its brightest value is 1.1 times this (a sixth of the hearth's at dusk)
//   SMALL_FIRE_LIGHT   the pool of light a harbour light throws on the stone round it
//   WINDOW_LAMP        the colour of a lit window's room where the lamp's light is strongest: a dim amber (r6a: a
//                      third as bright as it was, and redder), seen at the back of the reveal; the room's upper part
//                      has WINDOW_ROOM_TOP of it (the lamp stands low in the room), so the opening shows a soft glow
//                      inside its own depth and frame and no flat bright face
//   WINDOW_LIT_SHARE   about one window in eight shows a lamp at early dusk
// (p1) THE FIRE AT THE HOURS WITH THE SUN UP. r6's flame at the low sun and at sunset had six and seven tenths of its gain at dusk (1.15 and 1.3 of
// 1.9) under a lower exposure: by gain x the hour's exposure 1.15 and 1.38 against the dusk's 2.28. The hearth is the same great fire at every hour;
// what the hour changes is the light round it. So each hour has the gain that shows the flame ABOUT AS BRIGHT IN THE PICTURE as at early dusk (gain x
// the hour's exposure: 2.0 x 1.0 = 2.00, 2.0 x 1.06 = 2.12, 1.9 x 1.2 = 2.28), its glow a gain of its own (HEARTH_GLOW: a glow is light added to the
// air, and against the day's bright sky it takes more to show at all: by the same measure 2.60 and 2.54 at the two sun hours, OVER the dusk's 2.28),
// and its smoke the hour's own (SMOKE_BY_HOUR, below). Early dusk: r6's figures, unchanged.
export const HEARTH_GLOW = [2.6, 2.4, 1.9];
export const HEARTH_GAIN = [2.0, 2.0, 1.9], SMALL_FLAME_GAIN = 0.6, SMALL_FIRE_LIGHT = 0.6, WINDOW_LIT_SHARE = 1 / 8;
export const WINDOW_LAMP = new THREE.Color(0.19, 0.08, 0.02), WINDOW_ROOM_TOP = 0.4;
// THE HARBOUR'S LIGHTS (INVENTED by the builder: no source tells how the landing and the quay were lit; by the owner's
// word a working harbour's lights, few and dim, stand on the landing and the quay only: NONE on the monument's ramp,
// its parapets, its door platform or the tower). Four low fire bowls (BOWL_W across) on stone bollards, BY PLACE:
// two at the head of the landing's water steps (8 m from the shelf's west end and 1 m from its east end, 0.6 m in
// from the steps), two on the quay tongue's own north walk near the tip (3 m and 12 m from the tip, 0.6 m in from
// the quay's edge). Each entry: [x, y of its foot, z, the height of the fire's seat over its foot].
// They stand at every hour and burn at the afterglow only.
export const BOWL_W = 0.5, SMALL_FLAME_H = 0.55, BOLLARD_H = 0.92, BOLLARD_IN = 0.6;
export const CRESSETS = [
  [M.SHELF_X0 + 8, M.SHELF_Y, M.TONGUE_HALF - BOLLARD_IN, BOLLARD_H], [M.SHELF_X1 - 1, M.SHELF_Y, M.TONGUE_HALF - BOLLARD_IN, BOLLARD_H],
  [M.TONGUE_X1 - 3, M.PLATFORM_Y, -(M.TONGUE_HALF - BOLLARD_IN), BOLLARD_H], [M.TONGUE_X1 - 12, M.PLATFORM_Y, -(M.TONGUE_HALF - BOLLARD_IN), BOLLARD_H],
];
export const CRESSET_FLAME_UP = SMALL_FLAME_H * 0.4;   // the middle of a cresset's flame over its seat
// the walked surface under a point of the tongue (for the eye's height over its footing and for the walkers)
export function footingY(x, z) {
  if (x < M.DOOR_X || x > M.TONGUE_X1 || Math.abs(z) > (x < M.TONGUE_X0 ? 35 : M.TONGUE_HALF)) return 0;
  if (x < M.TONGUE_X0) return Math.abs(z) <= 8 && x <= M.RAMP_HEAD_X ? rampY(x) : Math.abs(z) <= M.RAMP_W / 2 + 0.5 ? rampY(x) : M.PLATFORM_Y;
  if (Math.abs(z) <= M.RAMP_W / 2 + 0.5 && x <= M.RAMP_FOOT_X) return rampY(x);
  if (z >= STAIR_Z0 && z <= STAIR_Z1 && x <= STAIR_X_FOOT && x >= GAP_X0) return stairY(x);
  if (x >= M.SHELF_X0 && z >= M.SHELF_Z0) return M.SHELF_Y;
  return M.PLATFORM_Y;
}

// ---------------------------------------------------------------- the route (the same on every seed)
// (r6) THE ROUTE IS DRAWN FROM THE TOWER, THE TONGUE, THE RAMP AND THE HARBOUR'S MOUTH ALONE; every other place of the
// sea is laid by a rule of its own further down, and the clear water between it and this line is COUNTED
// (scratchpad/pharos-of-alexandria: count-movers.mjs, layout.mjs), never built in as an offset from the line.
// OWNED HERE: two lengths the place reads are named after our own vessel and line: OUR_LENGTH (a merchantman's length;
// it measures the ships' way's meridian and the harbour fishing ground) and RUN_CLEAR (the 2 m of air our line keeps
// over a head; it is the margin added to the guard's south leg). They are lengths, not places on the line. And the
// roadstead's second berth, laid by the berth grid alone, lies 12.0 m from the centre of our turn: the turn goes round
// the ship that lies there ((p1) THE PASS, a beat of the flight: the grid's place is 26.39 m from the line at the nearest, at
// metre 174; her home, dealt within BERTH_DRAW of it, 25.11 to 27.67 m; the clear air from her box and swing 14.91 m by rule.
// With her at the grid's place, bows north, her mast (0.77 m forward of her middle) crosses the tower's foot between metres 171 and 178,
// about two thirds of a second, and some part of her hull stands before the tower's foot from metre 165 to metre 186, about two seconds;
// her deal, her swing and her heading move the crossing up to four metres along the line. She lies bows north and we pass her east
// side, so that at the nearest her lowered yard lies end-on to us. She is not moved and nothing of her is made for it).
// We come down from the north, bear away to the LEFT as the ships do for the harbour's mouth ((p1) by 20 degrees, where
// the ships' way itself bears 30: BEARING AWAY, below), and then make ONE
// steady turn to the RIGHT, toward the tower, onto the ramp's own axis (z 0): the run-in is that one straight line due
// west, over the water to the tongue's tip, over the tip's apron and the ramp's foot and up the ramp's middle to the
// door. The tower stands on our right hand or ahead for the whole flight.
// the furthest a hull's skin, oars, yard or mast top can be from its place: [any way round (a swinging hull), height
// over the sea, to either side of its course (yard or oars), along its course]. A ship of the roadstead may be a
// quarter larger than the merchantman of the brief (ROADSTEAD_SCALE): her reach is the anchored merchantman's by that.
export const ROADSTEAD_SCALE = [1.25, 0.85, 1.1, 0.95];
export const REACH = { merchant: [8.6, 13, 4.9, 8.6], anchored: [9.5, 13, 9.5, 9.5], roadstead: [9.5 * 1.25, 13 * 1.25, 9.5 * 1.25, 9.5 * 1.25], warship: [24, 9, 11.6, 24], fisher: [4.2, 3.2, 4.2, 4.2], moored: [3.2, 2.2, 3.2, 3.2] };
// a hull at anchor swings this far on each axis about her home (shipAt); a berth of the roadstead is dealt within
// BERTH_DRAW of its place on each axis (layPlace). OUR_LENGTH: we come in on the ships' way at a merchantman's deck
// height, a vessel of her size.
export const ANCHOR_SWING = 1.5, BERTH_DRAW = 1, OUR_LENGTH = M.MERCHANT_L;
// THE ENTRY AND THE LEVEL STRAIGHT. The entry is the owner's order (its count of 18:06 UTC: the tower no smaller
// than at round five's entry): (128.5, 4.2, -220), heading due south; from it we fly 45 m level and exactly straight.
// (LEVEL_RUN is no place: it is a figure of the flight, owned as one; 60 m in the flight the owner accepted, (p1) 45 m in
// line LB: 0.1203 of the flight by metres. What it does: the gaze's rise to the tower ends at its end, and the bearing away
// begins there, 15 m sooner than r6's: an arc of 56.56 m by 20 degrees where r6's was 55.05 m by 30, ending at
// (131.91, -154.65), 23.5 m from where r6's ended.)
export const ENTRY_X = 128.5, ENTRY_Z = -220, LEVEL_RUN = 45;
// BEARING AWAY: from the level straight's end we bear away to the left, as the ships do for the harbour's mouth, by
// one easy arc, and hold that heading on a straight. (p1) THE BEARING IS A FIGURE OF THE FLIGHT, OWNED AS ONE (no measure
// of the place gives it), BEAR_AWAY, 20 degrees east
// of south (heading 160): ten degrees less than the ships' way's own bearing (WAY_BEAR, 30: the bearing of the mouth's
// middle from the ships' way; THE SHIPS' WAY, below), so that on the straight the tower bears less far off the bow and
// stands nearer the gaze's middle (r6 held WAY_BEAR itself and ran beside the ships' way's leg). It is held so far as
// the visitor keeps the whole tower in sight (the owner's count); then we turn in.
export const WAY_BEAR = 30;
export const BEAR_AWAY = 20;
// THE RUN-IN'S WATER: the owner accepted "the straight run-in of 128 m over the tip and up the ramp to the door"
// (17:54 and 18:06 UTC). The run-in is that accepted line: RUN_WATER, 44.5 m, of water east of the tongue's tip on
// the ramp's axis, and the rest on stone (over the tip's apron and up the ramp).
export const RUN_WATER = 44.5, RUN_X0 = M.TONGUE_X1 + RUN_WATER;
// THE TURN: one steady turn to the right of radius TURN_R about (RUN_X0, -TURN_R), from heading 160 round to due west
// at (RUN_X0, 0). TURN_R, (p1) 32 m, IS A FIGURE OF OURS (it is derived from no measure of the place: it is a little
// over two lengths of our own vessel, 2.29; r6 had 40 m): the turn a vessel of our length makes from the ships' way
// in for the quay, tighter than r6's so that it goes round the ship of the roadstead's second berth, the berth grid's
// place 26.39 m from the line (THE PASS, above, with her dealt distances and the clear air by rule); at the pace flown
// there (the world's PACE_TURN, 0.58) the
// heading turns 17 degrees a second on the arc (and for a moment up to 26 where the curve through the knots gathers
// the turn at its end, 22 at its beginning), which leaves the gaze its own swing inside the camera's rule: the eased
// camera, which looks at the tower, turns 16.66 degrees a second at the most (about metre 197), the viewer's steady camera
// 13.38 (about metre 33); r6: 17.04 and 14.77. The second berth lies 12.0 m from the turn's centre by the berth grid's own rule.
export const TURN_R = 32;
const RAD = Math.PI / 180;
// a point of an arc of radius r about (cx, cz) where the heading is h degrees (180 south, 270 west); right: a turn to the right
const arcAt = (cx, cz, r, h, right) => [cx + (right ? -r : r) * Math.cos(h * RAD), cz + (right ? -r : r) * Math.sin(h * RAD)];
// THE APPROACH SOLVED FROM THE PLACES: the left arc begins EASE beyond the level straight's end, heading due south
// (the line is a curve through knots, and a curve through knots is a straight line exactly only where four knots
// running lie on it: so one knot more lies on the level straight's line, EASE beyond its end, and the arc begins
// there), and ends heading 180 - BEAR_AWAY; the straight that follows must end where the turn begins (the turn's
// point of that same heading). Two unknowns (the arc's radius and the straight's length) from the two coordinates
// of that point: 56.56 m and 118.88 m. Nothing here is typed.
const EASE = 1;
export const ROUTE = (() => {
  const hB = 180 - BEAR_AWAY, s = Math.sin(BEAR_AWAY * RAD), c = Math.cos(BEAR_AWAY * RAD), z1 = ENTRY_Z + LEVEL_RUN + EASE;
  const turn0 = arcAt(RUN_X0, -TURN_R, TURN_R, hB, true), dx = turn0[0] - ENTRY_X, dz = turn0[1] - z1;
  const arcR = (dz * s - dx * c) / (1 - c), straight = (dx - arcR * (1 - c)) / s, bear = arcAt(ENTRY_X + arcR, z1, arcR, hB, false);
  return {
    hB, arcR, straight,
    levelEnd: [ENTRY_X, ENTRY_Z + LEVEL_RUN],                 // the level straight's end
    bear0: [ENTRY_X, z1],                                     // the bearing away begins
    bear,                                                     // the bearing away's end: heading 160 from here
    turn0,                                                    // the turn's beginning
    turnEast: [RUN_X0 + TURN_R, -TURN_R],                     // the turn's easternmost point (heading due south)
    turnEnd: [RUN_X0, 0],                                     // the turn's end: the run-in begins, heading due west
    leftAt: (h) => arcAt(ENTRY_X + arcR, z1, arcR, h, false), // the bearing away's point of heading h (180 down to hB)
    turnAt: (h) => arcAt(RUN_X0, -TURN_R, TURN_R, h, true),   // the turn's point of heading h (hB up to 270)
  };
})();
// THE RUN-IN'S HEIGHTS. Over the tip's apron and the ramp's foot the eye keeps RUN_CLEAR of clear air over the head of
// anyone who could walk there (PERSON_H is taller than any person laid); over the ramp's foot it stands RAMP_EYE over
// the paving, and from there one straight line carries it to the door's middle (4 m over the paving at the foot,
// 5.8 m at the sill, because the door's middle is that high over its sill).
export const PERSON_H = 1.8, RUN_CLEAR = 2.0, RAMP_EYE = 4, APRON_EYE = M.PLATFORM_Y + PERSON_H + RUN_CLEAR;
// the joins are eased: the line is one smooth curve through knots laid ON these places (the level straight's knots
// and the bearing away's closer together toward their join, the turn in seven equal steps of 15.7 degrees, the straight in thirds)
export function routePoints() {
  const Y = ROUTE_DECK_Y, pts = [], XT = M.TONGUE_X1, XF = M.RAMP_FOOT_X, YF = M.PLATFORM_Y + RAMP_EYE, XD = M.DOOR_X + 0.5;
  // the level straight: seven knots on it and an eighth on the same line EASE beyond its end, where the arc begins,
  // so that all of the level straight (LEVEL_RUN) is a straight line exactly
  for (const d of [0, 20, 40, 50, 55, 58, 60]) pts.push([ENTRY_X, Y, ENTRY_Z + LEVEL_RUN * d / 60]);
  pts.push([ENTRY_X, Y, ENTRY_Z + LEVEL_RUN + EASE]);
  // the bearing away to the left (knots at these twentieths of its turn), the straight on heading 160, the turn to the right
  // (its knots at equal steps of heading from the straight's to due west)
  for (const t of [1, 7 / 3, 13 / 3, 20 / 3, 10, 15, 20]) { const q = ROUTE.leftAt(180 - BEAR_AWAY * t / 20); pts.push([q[0], Y, q[1]]); }
  for (let i = 1; i <= 2; i++) pts.push([lerp(ROUTE.bear[0], ROUTE.turn0[0], i / 3), Y, lerp(ROUTE.bear[1], ROUTE.turn0[1], i / 3)]);
  { const nT = Math.round((270 - ROUTE.hB) / 15); for (let i = 0; i <= nT; i++) { const q = ROUTE.turnAt(ROUTE.hB + (270 - ROUTE.hB) * i / nT); pts.push([q[0], Y, q[1]]); } }
  // the run-in, due west along z 0: the eye rises from the deck's height at the turn's end to APRON_EYE at the
  // tongue's tip, crosses the apron, and from over the ramp's foot goes straight to the door's middle
  for (let i = 1; i <= 4; i++) { const x = lerp(RUN_X0, XT, i / 5); pts.push([x, lerp(Y, APRON_EYE, i / 5), 0]); }
  pts.push([XT, APRON_EYE, 0], [(XT + XF) / 2, (APRON_EYE + YF) / 2, 0]);
  for (let i = 0; i <= 6; i++) pts.push([lerp(XF, XD, i / 6), lerp(YF, DOOR_YC, i / 6), 0]);
  return pts;
}
export function makeRoute() { return makePath(routePoints()); }
// THE PLACES ON THE ROUTE, in metres flown, each found to the centimetre from its own constant (the first place where
// the line has passed it; our z grows all the way to the turn's end, our x falls all the way from the turn's east point):
//   level: the level straight's end      bear: the bearing away's end (heading 160)   turn0: the turn's beginning
//   east: the turn's easternmost point   turnEnd: the turn's end (the run-in begins)  tip: over the tongue's tip
//   foot: over the ramp's foot           rampMid: over the ramp's middle              last40: 40 m before the door
export function routeMarks(path) {
  const L = path.length, v = new THREE.Vector3();
  const find = (test, from = 0) => {
    let lo = from, hi = L;
    for (let d = from; d <= L; d += 0.25) { if (test(path.posAtDist(d, v))) { hi = d; break; } lo = d; }
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (test(path.posAtDist(m, v))) hi = m; else lo = m; }
    return hi;
  };
  const level = find((p) => p.z > ROUTE.levelEnd[1]), bear = find((p) => p.z > ROUTE.bear[1], level), turn0 = find((p) => p.z > ROUTE.turn0[1], bear);
  const east = find((p) => p.z > ROUTE.turnEast[1], turn0), turnEnd = find((p) => p.x < ROUTE.turnEnd[0], east);
  const tip = find((p) => p.x < M.TONGUE_X1, turnEnd), foot = find((p) => p.x < M.RAMP_FOOT_X, tip), rampMid = find((p) => p.x < (M.RAMP_FOOT_X + M.RAMP_HEAD_X) / 2, foot);
  return { level, bear, turn0, east, turnEnd, tip, foot, rampMid, last40: L - 40, length: L };
}

// ---------------------------------------------------------------- the deal of one visit (seed and vary only)
export function dealVisit(seed, vary = {}) {
  const r = makeRng(hashSeed('pharos-visit:' + seed));
  let hour = r.int(0, 2);
  // vary.hour: golden or day gives low sun, night gives early dusk; dawn is not offered (the seed's own draw stands)
  if (vary.hour === 'golden' || vary.hour === 'day') hour = 0; else if (vary.hour === 'night') hour = 2;
  const swell = r.int(0, 2);
  return {
    hour, swell, hourName: HOURS[hour], swellName: SWELLS[swell], sunElevation: SUN_ELEVATION[hour],
    swellHeight: Math.min(SWELL_HEIGHT_MAX, SWELL_HEIGHT[swell] + r.range(-0.03, 0.03)), swellLength: r.range(84, 112),
    haze: r.range(0, 1), warshipOutbound: r.chance(0.5), laneOff: r.range(0, 2.5),
    rare: !!vary.rare, density: clamp(vary.density ?? 1, 0.7, 1.3),
  };
}

// ---------------------------------------------------------------- lanes and boxes: everything the clock moves, by place
// A closed walk on the tongue: [x, z] corners; walkers go round it at one speed, so none overtakes another. A body's
// heading is the line between the walk's points TURN_LEAD behind it and ahead of it, so that it turns through a
// corner as a body does and never swings round on the spot.
const TURN_LEAD = 0.3;
function closedWalk(pts) {
  const seg = []; let L = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push({ a, b, l, s: L }); L += l; }
  const point = (s, o) => {
    s = ((s % L) + L) % L;
    let k = 0; while (k < seg.length - 1 && s > seg[k].s + seg[k].l) k++;
    const g = seg[k], t = g.l > 0 ? (s - g.s) / g.l : 0;
    o[0] = lerp(g.a[0], g.b[0], t); o[1] = lerp(g.a[1], g.b[1], t); return o;
  };
  const pa = [0, 0], pb = [0, 0];
  const at = (s, out = [0, 0, 0, 0]) => {
    point(s - TURN_LEAD, pa); point(s + TURN_LEAD, pb); point(s, out);
    const dx = pb[0] - pa[0], dz = pb[1] - pa[1], l = Math.hypot(dx, dz) || 1; out[2] = dx / l; out[3] = dz / l;
    return out;
  };
  return { pts, length: L, at };
}
// a half round of n steps from angle a0 to a1 about (cx, cz), radius r: its points [x, z] (both ends with them)
const halfRound = (cx, cz, r, a0, a1, n = 16) => { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]); } return o; };
// a closed course on the sea (a patrol): a smooth ring through [x, z] points; distance wraps on its length
function closedCourse(pts) {
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], 0, q[1])), true, 'centripetal');
  curve.arcLengthDivisions = pts.length * 60;
  const length = curve.getLength(), u = (d) => (((d % length) + length) % length) / length;
  return { length, closed: true, posAtDist: (d, out = new THREE.Vector3()) => curve.getPointAt(u(d), out), tangentAtDist: (d, out = new THREE.Vector3()) => curve.getTangentAt(u(d), out) };
}

// THE NAMED PLACES OF THE SEA (world coordinates). Every road, ground, band and round is laid by a rule of the
// harbour's own geography, written beside it, from the part's own measures (the tongue, its tip, the rock's ring of
// reefs, the ships' sea rooms and reaches, the mouth). The route above is not among those measures (but for the two
// lengths named after our own vessel and line, OUR_LENGTH and RUN_CLEAR, read here as a merchantman's length and a
// margin of 2 m): the clear water between each place and our line is counted afterwards (count-movers.mjs,
// layout.mjs). Owned: the roadstead's second berth lies 12.0 m from the centre of our turn, by the berth grid alone.
// Of the places below, the offing's and the harbour's roads, the lee and the harbour fishing grounds and the outer
// reefs are the places of round five's plan, kept, and written here in sea rooms and lengths from the place's own
// constants.
// The mouth of the Great Harbour lies between the tongue's tip and the tip of Lochias; its middle is the fairway.
// (The research's mouth is about 600 m wide, a modern reconstruction from the sea bed; as built here it is 515 m
// from the tongue's tip to the middle of Lochias' tip. INVENTED: where exactly that tip lies, south of east of us.)
export const TONGUE_TIP = [M.TONGUE_X1, 0], LOCHIAS_TIP = [566, 214];
export const MOUTH_MID = [(TONGUE_TIP[0] + LOCHIAS_TIP[0]) / 2, (TONGUE_TIP[1] + LOCHIAS_TIP[1]) / 2];
// SEA ROOMS. The water a merchantman at anchor sweeps about her berth (her reach and her swing on two axes): 11.6 m;
// the same for the largest ship of the roadstead, whose berth is dealt within BERTH_DRAW besides: 15.4 m.
const MERCHANT_ROOM = REACH.anchored[0] + Math.SQRT2 * ANCHOR_SWING;
export const ROAD_ROOM = REACH.roadstead[0] + Math.SQRT2 * (ANCHOR_SWING + BERTH_DRAW);
// the rock's ring of reefs lies 44 to 62 m from the rock's middle round its north and east (layPlace); its outer
// edge, with the largest reef's radius: 72 m north of the tower's axis
const RING = [44, 62], REEF_R = [2.5, 4.8], RING_OUT = RING[1] + 4 + 6;
// REEF BANDS awash, each a box [x0, x1, z0, z1, groups] (a group's reefs are dealt within GROUP_SPREAD of its middle
// along the band):
//   shoal: THE BIGHT'S SHOAL, a spit of rocks awash that runs north off the tongue's outer third: 20 to 33 m inside
//          the tip's meridian, from 32 m to 76 m north of the tongue's north wall. It parts the bight (the fishing
//          ground west of it) from the roadstead east of it.
//   east:  THE EAST REEFS, on the left hand of a ship coming down the ships' way: 32 to 48 m east of the way's
//          meridian, from 38 m north of the latitude where the way bears away for the mouth to 90 m further north
//          (the way holds its meridian until they are passed).
//   outer: THE OUTER REEFS, a cable and more east of the ships' way: 92 to 132 m east of its meridian, from 57 m
//          south of the latitude where the way bears away to 260 m north of that.
// INVENTED: all three (the sources have reefs at the mouth and off the island and say no more of their places).
const GROUP_SPREAD = 12;
// THE GULLS' OWN MEASURES (INVENTED), HANDED TO THE KIT AND COUNTED FROM (the owner's rule: a flock is counted by
// what the world hands the kit, never by a reach written down beside it). Every flock call hands its own spread,
// its own wander, its own count and FLOCK_SIGMA (maxSigma: the bound on the kit's bell-curve draw of a bird's place
// in its flock, whose sigma is 0.45 of the spread). (r6c) THE GULL'S SIZE, BY THE BIRD: the kit's gull as it is
// measured spans 1.525 m at size 1 (KIT_GULL_HALF: 0.762 m from its middle to a wing tip) and the kit deals each
// bird 0.88 to 1.12 of the size handed (KIT_GULL_LARGEST; that spread is the kit's and has no handle), so that at
// size 1 the largest spanned 1.71 m: more than a gull of this coast (the yellow-legged gull and the herring gull
// span 1.2 to 1.55 m). GULL_SIZE is the size that puts THE LARGEST DEALT BIRD AT GULL_SPAN_MOST, 1.5 m: 0.878, so
// that the birds span 1.18 to 1.50 m and 1.34 m in the middle. GULL_REACH: the largest dealt bird's wing tip from
// its middle (half of GULL_SPAN_MOST).
// flockReach: how far a bird's furthest point can stand from its flock's loop [to a side, up and down]:
// FLOCK_SIGMA sigmas of the spread, one and a half times the wander (the kit swings a bird across by up to one and
// a half times the wander's first; the reach takes that on every axis) and the bird's own size.
export const KIT_GULL_HALF = 0.762, KIT_GULL_LARGEST = 1.12, GULL_SPAN_MOST = 1.5;
export const FLOCK_SIGMA = 2.5, GULL_SIZE = GULL_SPAN_MOST / (2 * KIT_GULL_HALF * KIT_GULL_LARGEST), GULL_REACH = KIT_GULL_HALF * KIT_GULL_LARGEST * GULL_SIZE;
export const flockReach = (spread, wander) => [FLOCK_SIGMA * 0.45 * spread[0] + 1.5 * Math.max(wander[0], wander[2]) + GULL_REACH, FLOCK_SIGMA * 0.45 * spread[1] + 1.5 * wander[1] + GULL_REACH];
// THE TWO WHEELS ROUND THE TOWER: how far a bird stands off its place [across, up and down], how far it wanders
// [across, up and down, along; the rate], the clear air kept between the furthest bird and the stone's corners, the
// clear air kept over the middle of the door's opening (the lower wheel) and over the first terrace's floor (the upper), how much
// a loop rises and falls, and how much longer than wide a loop may be dealt.
export const WHEEL = { spread: [3.5, 3], wander: [2, 2, 2, 0.35], clear: 1.5, over: 7, head: 3, rise: 4, long: [1.2, 1.55] };
// THE LOW FLOCK OVER THE MOORED BOATS (its water and its loop are laid in layPlace): spread, wander, the radius of
// the loop's two bends, its height over the sea and how much it rises and falls round the loop.
export const LOW_FLOCK = { spread: [2.5, 2], wander: [2.5, 2, 2.5, 0.35], bend: 7, y: 11, rise: 2 };
// THE TWO FLOCKS OVER THE SHOAL AND THE NET fly with the kit's gull's own wander, written out here and handed.
export const GULL_WANDER = [5, 2.5, 4, 0.35];
// THE SHIPS' WAY (the merchantmen's lane): down from the north on the meridian five lengths of ours east of the tip's
// (the berth a vessel under sail gives the tip, its shoal and the ships at anchor off it; the deal lays it up to
// 2.5 m further east); where the mouth's middle bears WAY_BEAR degrees east of south she bears away for it, runs
// through the mouth's middle and on up the harbour to the city's quays east of the palace's mole (WAY_END: 1.27 km
// south of the tower, under Lochias' root: INVENTED, the quay's place).
export const WAY_X = TONGUE_TIP[0] + 5 * OUR_LENGTH, WAY_END = [560, 1262];   // (WAY_BEAR stands with the route, above)
export const wayBearZ = (x) => MOUTH_MID[1] - (MOUTH_MID[0] - x) / Math.tan(WAY_BEAR * RAD);
export const REEF_BANDS = {
  shoal: [TONGUE_TIP[0] - 33, TONGUE_TIP[0] - 20, -(M.TONGUE_HALF + 76), -(M.TONGUE_HALF + 32), 3],
  east: [WAY_X + 32, WAY_X + 48, wayBearZ(WAY_X) - 128, wayBearZ(WAY_X) - 38, 3],
  outer: [WAY_X + 92, WAY_X + 132, wayBearZ(WAY_X) - 203, wayBearZ(WAY_X) + 57, 2],
};
// the shoal's east side, with the largest reef's radius
const SHOAL_EAST = REEF_BANDS.shoal[1] + REEF_R[1];
// the mouth's rocks (INVENTED): a line of rocks on the tongue's side of the fairway, 56 to 70 m west of the mouth's
// middle, from 7 m north of it to 93 m south of it
const MOUTH_ROCKS = [MOUTH_MID[0] - 70, MOUTH_MID[0] - 56, MOUTH_MID[1] - 7, MOUTH_MID[1] + 93];
// THE ROADSTEAD OFF THE TIP (INVENTED: the sources name no anchorage here; these are ships of no named kind, ours):
// merchantmen waiting for a berth at the quay lie to their anchors east of the tongue's tip and north of its line,
// bows to the north wind. THE BERTH GRID, by its own constants: a FILE up the meridian a sea room and a half east of
// the bight's shoal (her own room and half as much again of clear water from the rocks), the first berth two sea
// rooms north of the tongue's north wall (room to swing clear of the wall and of boats working along it), the next
// two each two sea rooms further north (astern of one another they swing clear); and the first berth of a second
// file two and a half sea rooms east of the first (the next ship for the quay). Each entry: [x, z, her size as a
// share of the brief's merchantman]. The largest lies nearest the quay and a lighter lies alongside her.
// (r6c) OWNED: the grid stands by the roadstead's own reason alone (where a ship finds room to swing off the tip,
// clear of the shoal and of the wall, the next for the quay nearest it); where its ships fall against the tower as
// seen from the ships' way is no part of that reason, and no berth is moved for it.
export const ROADSTEAD = [[0, 0], [2.5, 0], [0, 1], [0, 2]].map(([i, k], n) => [SHOAL_EAST + (1.5 + i) * ROAD_ROOM, -(M.TONGUE_HALF + (2 + 2 * k) * ROAD_ROOM), ROADSTEAD_SCALE[n]]);
// MERCHANTMEN AT ANCHOR ELSEWHERE, each road a box [x0, x1, z0, z1] a berth is dealt in:
//   north, northWest: the offing north of the rock, where ships wait for a wind into the western harbour: holding
//     ground two sea rooms north of the guard's round (its north leg and the oars' reach) and three sea rooms deep;
//     the one from half a sea room to three and a half east of the tower's axis, the other from three to six sea
//     rooms west of it, toward the island
//   leeA, leeB: THE LEE ROAD under the tongue's south wall: two sea rooms inside the tip, so that the tongue covers a
//     hull from the north wind; the first berth three sea rooms and a little south of the wall (clear of the boats
//     moored along it), the second four sea rooms further out; each dealt within 6 m along the tongue and 8 m across
//   harbourA, B, C: the inner harbour south of the lee road, on the way to the city's quays: A from 3.7 sea rooms
//     south of the lee road's outer box and four deep, inside the tip's meridian by up to three sea rooms; C from
//     seven to twelve sea rooms south of A's north edge, astride the tip's meridian; B from thirteen to twenty-three
//     sea rooms south of it, two to nine sea rooms east of the tip's meridian
//   mouthA, mouthB: the mouth's roads on Lochias' side of the ships' way: four to seven and six to ten sea rooms east
//     of the mouth's middle, the one about its latitude (20 m north to 40 m south of it), the other 70 to 150 m
//     south of it
const leeRoad = (k) => [TONGUE_TIP[0] - 2 * MERCHANT_ROOM - 6, TONGUE_TIP[0] - 2 * MERCHANT_ROOM + 6, M.TONGUE_HALF + (3.4 + 4 * k) * MERCHANT_ROOM - 8, M.TONGUE_HALF + (3.4 + 4 * k) * MERCHANT_ROOM + 8];
// THE GUARD'S ROUND (INVENTED): the warships under oars row a closed round in the bight's northern water, north of
// the rock's reefs and of the fishing ground and north-west of the roadstead (south of it the bight is the fishing
// ground's, the shoal's and the roadstead's: their rooms leave no water for a round). It lies east and west: a guard
// rows across the approach to the harbour, where it can hail what comes down from the open sea. Its south leg runs
// one oar's reach and RUN_CLEAR north of the fishing boats' furthest water (the ground's north edge, a boat's rowing
// ring and her reach); its bends are GUARD_R in radius, the bend a galley of her length makes under oars (four
// fifths of her length: INVENTED); its east bend turns a hull's whole reach inside the tip's meridian (her length
// swung in the bend: the water east of that meridian is the roadstead's and the ships' way in, and no part of her
// comes over it); its legs are two and a half lengths of hers. The deal lays the whole round up to GUARD_DRAW
// further west.
// (BIGHT_NORTH: how far north of the tongue's north wall the bight's fishing ground reaches, see GROUNDS)
export const FISHER_RING = 9, BIGHT_NORTH = 91;
export const GUARD_R = 0.8 * M.WARSHIP_L, GUARD_LEG = 2.5 * M.WARSHIP_L, GUARD_EAST = TONGUE_TIP[0] - REACH.warship[0] - GUARD_R, GUARD_DRAW = 8;
export const GUARD_SOUTH = -(M.TONGUE_HALF + BIGHT_NORTH + FISHER_RING + REACH.fisher[0] + REACH.warship[2] + RUN_CLEAR);
const NORTH_Z1 = GUARD_SOUTH - 2 * GUARD_R - REACH.warship[2] - 2 * MERCHANT_ROOM, HARBOUR_Z0 = leeRoad(1)[3] + 3.7 * MERCHANT_ROOM;
const ROADS = {
  north: [0.5 * MERCHANT_ROOM, 3.5 * MERCHANT_ROOM, NORTH_Z1 - 3 * MERCHANT_ROOM, NORTH_Z1],
  northWest: [-6 * MERCHANT_ROOM, -3 * MERCHANT_ROOM, NORTH_Z1 - 3 * MERCHANT_ROOM, NORTH_Z1],
  leeA: leeRoad(0), leeB: leeRoad(1),
  harbourA: [TONGUE_TIP[0] - 3 * MERCHANT_ROOM, TONGUE_TIP[0], HARBOUR_Z0, HARBOUR_Z0 + 4 * MERCHANT_ROOM],
  harbourC: [TONGUE_TIP[0] - 2.4 * MERCHANT_ROOM, TONGUE_TIP[0] + 1.2 * MERCHANT_ROOM, HARBOUR_Z0 + 7 * MERCHANT_ROOM, HARBOUR_Z0 + 12 * MERCHANT_ROOM],
  harbourB: [TONGUE_TIP[0] + 2 * MERCHANT_ROOM, TONGUE_TIP[0] + 9 * MERCHANT_ROOM, HARBOUR_Z0 + 13 * MERCHANT_ROOM, HARBOUR_Z0 + 23 * MERCHANT_ROOM],
  mouthA: [MOUTH_MID[0] + 4 * MERCHANT_ROOM, MOUTH_MID[0] + 7 * MERCHANT_ROOM, MOUTH_MID[1] - 20, MOUTH_MID[1] + 40],
  mouthB: [MOUTH_MID[0] + 6 * MERCHANT_ROOM, MOUTH_MID[0] + 10 * MERCHANT_ROOM, MOUTH_MID[1] + 70, MOUTH_MID[1] + 150],
};
// THE NET GROUND (INVENTED): two fishing boats lie to one net in the lee east of the tip's meridian, where the tongue
// has broken the swell: four to six sea rooms east of the tip, eight and a half sea rooms south of the tongue's
// south wall and up to 20 m further.
export const NET_GROUND = [TONGUE_TIP[0] + 4 * MERCHANT_ROOM, TONGUE_TIP[0] + 6 * MERCHANT_ROOM, M.TONGUE_HALF + 8.5 * MERCHANT_ROOM, M.TONGUE_HALF + 8.5 * MERCHANT_ROOM + 20];
// FISHING GROUNDS (INVENTED), each a box a boat's home is dealt in:
//   bight:   the bight north of the tongue, between the rock's ring of reefs and the shoal: from 2 m inside the
//            tongue's root to 28 m along it, 35 to 91 m north of its north wall (a boat that rows keeps a ring of
//            up to FISHER_RING about her home)
//   lee:     the calm water under the rock's south side, west of the lee road: from 1 m east of the tower's east face
//            to 10 m along the tongue, 47 to 97 m south of the tongue's south wall
//   harbour: the inner harbour south of the net ground: three to seven lengths of ours east of the tip's meridian,
//            13 to 16.5 lengths south of the tongue's south wall
//   mouth:   inside the mouth on the tongue's side of the mouth's rocks: 18 to 62 m west of the rocks' line, from
//            9 m north of the mouth's middle to 32 m south of it
const GROUNDS = {
  bight: [M.TONGUE_X0 - 2, M.TONGUE_X0 + 28, -(M.TONGUE_HALF + BIGHT_NORTH), -(M.TONGUE_HALF + 35)],
  lee: [M.DOOR_X + 1, M.TONGUE_X0 + 10, M.TONGUE_HALF + 47, M.TONGUE_HALF + 97],
  harbour: [TONGUE_TIP[0] + 3 * OUR_LENGTH, TONGUE_TIP[0] + 7 * OUR_LENGTH, M.TONGUE_HALF + 13 * OUR_LENGTH, M.TONGUE_HALF + 16.5 * OUR_LENGTH],
  mouth: [MOUTH_ROCKS[0] - 62, MOUTH_ROCKS[0] - 18, MOUTH_MID[1] - 9, MOUTH_MID[1] + 32],
};
const FISHING = ['bight', 'lee', 'harbour', 'mouth', 'bight', 'lee', 'harbour', 'mouth'].map((n) => GROUNDS[n]);

// layPlace is written as a list of steps (a generator: every `yield` is a place where the build may hand the page
// back). layPlace runs them all at once (the counts in node use it); layPlaceInSteps asks for a hand-back between
// them (the world's build uses it: the first call of the day into cold code is the longest step on a busy machine).
// The steps, their order and every draw are the same either way.
export function layPlace(seed, vary = {}) { const g = layPlaceSteps(seed, vary); for (;;) { const r = g.next(); if (r.done) return r.value; } }
export async function layPlaceInSteps(seed, vary, yieldNow) { const g = layPlaceSteps(seed, vary || {}); for (;;) { const r = g.next(); if (r.done) return r.value; await yieldNow(); } }
function* layPlaceSteps(seed, vary = {}) {
  const deal = dealVisit(seed, vary), P = { deal };
  // one stream per kind, each from the seed and a name of its own; none is drawn from in the middle of another's work
  const S = (name) => makeRng(hashSeed('pharos-' + name + ':' + seed));
  // ---- merchantmen under sail: THE SHIPS' WAY (see WAY_X): the lane down the meridian five ship's lengths east of
  // the tongue's tip, east of the roadstead and of the rock, and on to the harbour's mouth south-east. An ENDLESS
  // procession: the lane begins 3.6 km and more off to the north and ends at the city's quays; a ship that reaches
  // its end is the next to enter at its start. Its knots: down the meridian (closer together toward the bearing
  // away), the corner where the mouth's middle bears WAY_BEAR (the curve rounds it on the mouth's side), the leg to
  // the mouth's middle in quarters, and on to the quays in quarters.
  const wayX = WAY_X + deal.laneOff, zB = wayBearZ(wayX), lanePts = [];
  for (const n of [1720, 1320, 920, 620, 420, 290, 200, 120, 60]) lanePts.push([wayX, 0, zB - n]);
  for (const t of [0, 0.12, 0.3, 0.5, 0.75, 1]) lanePts.push([lerp(wayX, MOUTH_MID[0], t), 0, lerp(zB, MOUTH_MID[1], t)]);
  for (const t of [0.1, 0.25, 0.5, 0.75, 1]) lanePts.push([lerp(MOUTH_MID[0], WAY_END[0], t), 0, lerp(MOUTH_MID[1], WAY_END[1], t)]);
  yield;
  const core = makePath(lanePts, { samples: 900 }), mr = S('merchants');
  yield;
  // headway and phase from the lane's own stream; no number from the entry or from clock 0
  const nM = Math.round(core.length / mr.range(135, 165)), hwM = core.length / nM, phM = mr.range(0, hwM), vM = mr.range(2.0, 2.5);
  // THE RUN-IN OF THE LANE: north of its first laid point (1.9 km north of the tongue's line, where a hull coming
  // into being could be seen) the lane runs straight on up the meridian for a whole number of headways, 1.6 km and
  // more, so that it begins 3.5 km and more off, in the haze. The procession stays even all along.
  const nIn = Math.ceil(1600 / hwM), runIn = nIn * hwM, p0 = core.posAtDist(0), x0 = p0.x, z0 = p0.z;
  const lane = {
    length: runIn + core.length, runIn,
    posAtDist: (d) => (d >= runIn ? core.posAtDist(d - runIn) : { x: x0, y: 0, z: z0 - (runIn - d) }),
    tangentAtDist: (d) => (d >= runIn ? core.tangentAtDist(d - runIn) : { x: 0, y: 0, z: 1 }),
  };
  P.merchantLane = lane;
  // (the hulls of the laid stretch first; then those of the run-in, northward; each hull's roll begins where the
  // lane's own stream deals it)
  P.merchants = Array.from({ length: nM + nIn }, (_, i) => ({ kind: 'merchant', lane, s0: runIn + phM + (i < nM ? i : nM - 1 - i) * hwM, v: vM, phase: mr.range(0, 6.2832) }));
  // ---- the warships under oars: THE GUARD'S ROUND (see GUARD_R), a closed course north of the bight. Pairs in line
  // astern (three single ships on a rare visit), west on the south leg or east on it by the deal; where each pair is
  // on the round at clock 0 comes from the round's own stream, over the whole round.
  const wr = S('warships'), xE = GUARD_EAST - wr.range(0, GUARD_DRAW), xW = xE - GUARD_LEG, zM = GUARD_SOUTH - GUARD_R, cPts = [], legT = [0, 0.25, 0.5, 0.75, 1];
  for (const t of legT) cPts.push([lerp(xE, xW, t), GUARD_SOUTH]);                                                           // the south leg, westward
  for (const a of [30, 60, 90, 120, 150]) cPts.push([xW - GUARD_R * Math.sin(a * RAD), zM + GUARD_R * Math.cos(a * RAD)]);   // the west bend
  for (const t of legT) cPts.push([lerp(xW, xE, t), GUARD_SOUTH - 2 * GUARD_R]);                                             // the north leg, eastward
  for (const a of [30, 60, 90, 120, 150]) cPts.push([xE + GUARD_R * Math.sin(a * RAD), zM - GUARD_R * Math.cos(a * RAD)]);   // the east bend
  if (deal.warshipOutbound) cPts.reverse();
  const course = closedCourse(cPts), nPair = deal.rare ? 3 : 2, hwW = course.length / nPair, phW = wr.range(0, hwW), gapW = wr.range(110, 140), vW = wr.range(3.0, 3.6);
  yield;
  P.warshipCourse = course; P.warships = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const phase = wr.range(0, 6.2832); if (i < nPair && j < (deal.rare ? 1 : 2)) P.warships.push({ kind: 'warship', lane: course, s0: phW + i * hwW - j * gapW, v: vW, phase }); }
  // ---- NO WARSHIP LIES AT ANCHOR (the owner's word). At anchor: merchantmen and harbour craft only.
  // THE ROADSTEAD OFF THE TIP (see ROADSTEAD): each berth dealt within BERTH_DRAW of its place, bows to the north
  // wind, each on her own swing; the fourth berth is taken when the visit is not a thin one; a LIGHTER (a harbour
  // boat) lies alongside the first, the largest, on the side the roadstead's own stream deals.
  { const rs = S('roadstead'); P.roadstead = [];
    for (let i = 0; i < ROADSTEAD.length; i++) { const [x, z, scale] = ROADSTEAD[i], q = { kind: 'roadstead', scale, x: x + rs.range(-BERTH_DRAW, BERTH_DRAW), z: z + rs.range(-BERTH_DRAW, BERTH_DRAW), yaw: Math.PI + rs.range(-0.1, 0.1), phase: rs.range(0, 6.28) }; if (i < 3 || deal.density > 0.85) P.roadstead.push(q); }
    const side = rs.sign(), h = P.roadstead[0];
    const off = side * (M.MERCHANT_W / 2 * h.scale + 1.3), fore = rs.range(-2, 3);
    P.lighter = { kind: 'moored', alongside: h, off, fore, x: h.x - off, z: h.z - fore, yaw: Math.PI, phase: rs.range(0, 6.28) }; }
  // ---- merchantmen at anchor elsewhere, sails furled, bows to the north wind: each in its own named road, each from its own stream
  const anchorIn = (name, b, yawRange) => { const ar = S('anchored-' + name); return { kind: 'anchored', x: ar.range(b[0], b[1]), z: ar.range(b[2], b[3]), yaw: Math.PI + ar.range(-yawRange, yawRange), phase: ar.range(0, 6.28) }; };
  P.anchored = [anchorIn('north', ROADS.north, 0.3)];
  if (deal.density > 0.95) P.anchored.push(anchorIn('northwest', ROADS.northWest, 0.3));
  // INVENTED by the builder: two in the lee road under the tongue's south wall, three in the harbour to the south,
  // two in the mouth's roads
  P.anchored.push(anchorIn('lee-road', ROADS.leeA, 0.4), anchorIn('lee', ROADS.leeB, 0.4));
  P.anchored.push(anchorIn('harbour-a', ROADS.harbourA, 0.6), anchorIn('harbour-b', ROADS.harbourB, 0.6), anchorIn('harbour-c', ROADS.harbourC, 0.6), anchorIn('mouth-a', ROADS.mouthA, 0.5), anchorIn('mouth-b', ROADS.mouthB, 0.5));
  // ---- reefs awash (standing rocks; their white water and spray are a medium). Every band is a named place of the
  // sea and has its own stream.
  yield;
  P.reefs = []; P.reefGroups = {};
  const keep = (name, q) => { P.reefs.push(q); (P.reefGroups[name] = P.reefGroups[name] || []).push(q); };
  { // THE ROCK'S RING: round the north and east of the rock, RING from its middle
    const rr = S('reefs-ring');
    for (let i = 0; i < 13; i++) { const t = (i + rr.range(0.1, 0.9)) / 13, a = lerp(-2.75, -0.45, t), d = rr.range(RING[0], RING[1]), r = rr.range(2.5, 6); keep('ring', { x: -4 + Math.cos(a) * d * 1.05, z: Math.sin(a) * d - 4, r, h: rr.range(0.5, 1.5) * Math.min(1, r / 4), seedK: rr() }); }
  }
  for (const [name, b] of Object.entries(REEF_BANDS)) {
    // groups stratified along the band's stretch; three or four reefs to a group, four reefs' draws made for each
    const rr = S('reefs-' + name);
    for (let c = 0; c < b[4]; c++) {
      const zc = lerp(b[2], b[3], (c + rr.range(0.2, 0.8)) / b[4]), n = rr.int(3, 4);
      for (let i = 0; i < 4; i++) {
        const z = zc + rr.range(-GROUP_SPREAD, GROUP_SPREAD), x = rr.range(b[0], b[1]), r = rr.range(REEF_R[0], REEF_R[1]), h = rr.range(0.5, 1.4), seedK = rr();
        if (i < n) keep(name + c, { x, z, r, h, seedK });
      }
    }
  }
  { // the mouth's rocks (INVENTED: see MOUTH_ROCKS)
    const rr = S('reefs-mouth'), n = rr.int(5, 7), b = MOUTH_ROCKS;
    for (let i = 0; i < 7; i++) { const t = (i + rr.range(0.15, 0.85)) / 7, q = { x: lerp(b[0], b[1], rr()), z: lerp(b[2], b[3], t), r: rr.range(2.5, 4.6), h: rr.range(0.6, 1.5), seedK: rr() }; if (i < n) keep('mouth', q); }
  }
  // spray: standing places where white water goes up as each crest of the drawn swell comes down on them: two draws'
  // worth to a reef (the second sheet only on a reef over 4 m), then rows along the windward walls from a stream of their own
  P.spray = [];
  { const sp = S('spray-reefs');
    for (const q of P.reefs) {
      const e1 = { x: q.x + sp.range(-0.3, 0.3) * q.r, z: q.z - q.r * 0.75, w: q.r * sp.range(0.9, 1.3), h: 1.8 + q.r * sp.range(0.45, 0.8), ph: sp.range(0, 0.12), k: sp.range(0, 40), second: 0 };
      const e2 = { x: q.x + sp.range(-0.7, 0.7) * q.r, z: q.z - q.r * 0.35, w: q.r * 0.7, h: 1.5 + q.r * 0.4, ph: sp.range(0, 0.12), k: sp.range(0, 40), second: 1 };
      P.spray.push(e1); if (q.r > 4) P.spray.push(e2);
    }
    const sw = S('spray-walls'), wall = (x, z, w, h, second = 0) => P.spray.push({ x, z, w, h, ph: sw.range(0, 0.12), k: sw.range(0, 40), second });
    for (let i = 0; i < 9; i++) wall(lerp(-34, 26, (i + sw.range(0.2, 0.8)) / 9), -37.5 - sw.range(0, 2.5), sw.range(3, 5), sw.range(3.5, 6), i % 2);
    for (let i = 0; i < 5; i++) wall(lerp(36, 94, (i + sw.range(0.2, 0.8)) / 5), -14.6 - sw.range(0, 1.2), sw.range(2.2, 3.6), sw.range(2, 3.4));
    for (let i = 0; i < 3; i++) wall(31.5 + sw.range(0, 1.5), lerp(-33, -16, (i + sw.range(0.2, 0.8)) / 3), sw.range(2.5, 4), sw.range(3, 4.5));
  }
  // ---- people who stand: by the door, on the tongue, at the steps (as many of eighteen dealt as the density asks);
  // six keepers on the terraces from a stream of their own
  yield;
  P.standers = [];
  { const sr = S('standers'), nSt = Math.round(14 * deal.density);
    // WHERE PEOPLE STAND, each a box [x0, x1, z0, z1]. These are the places of round five's plan, kept (the landing's
    // box alone moved), and written here from the part's own measures:
    // (r6b) EACH BOX IS A STANDER'S OWN ROOM: its sides lie a stander's half and a clear hand inside the stone that
    // bounds it, and his half and BODY_GAP outside the widest body on the lane beside it:
    //   the door's two sides: on the door platform's two wings, between the face of the door's posts and the
    //     platform's low parapet at the ramp's head, and between the ramp's up lane and the platform's side parapet
    //   the tongue's two walks: between the ramp's wall and the quay's edge (2.7 m and more off the ramp's width,
    //     1.5 m in from the edge); the north one from 10 m east of the tongue's root to 4 m short of the ramp's foot,
    //     the south one from 6 m east of the root to 2 m short of the stair's gap
    //   the landing: on the shelf's outer end, from 15 m along it to 1 m short of its end, between the shelf walk's
    //     outer lane and the bollards at the water steps
    // (r6c) THE WALKS' AND THE LANDING'S ENDS ARE OWNED, NOT DERIVED: 10 m and 4 m, 6 m and 2 m along the tongue,
    // 1.5 m in from the quay's edge, 2.7 and 2.9 m off the ramp's width, 15 m and 1 m along the shelf are round
    // five's plan's figures, the builder's, kept to the centimetre so that nobody who stands is moved.
    // WHO GETS HOW MANY OF THE EIGHTEEN TURNS, AND WHY: the seven boxes are dealt in turn (the door's south wing,
    // its north wing, the north walk, the south walk, the landing, the south wing again, the landing again). The
    // south is the working side of this place: the landing shelf, the water steps and the stair all lie south of
    // the ramp, what comes ashore is set down on the landing and is carried up on that side; so people wait on
    // the landing and on the door's south wing, where the stair's traffic arrives, twice as often as elsewhere.
    // AND NOBODY STANDS IN A THING OR IN ANOTHER: a stander whose dealt place lies nearer than a clear hand to a wood
    // stack, an awning's pole or a bollard, or nearer than BODY_GAP to one already standing, is not stood (all his
    // draws are made all the same).
    const hw = M.RAMP_W / 2, sh = BODY.stander.half, room = sh + HAND;
    const doorSide = (sg) => { const z0 = UP_LANE + BODY.donkey.half + BODY_GAP + sh, z1 = PLATFORM_HALF - PLATFORM_PARAPET - room; return [DOOR_FACE_X + room, M.RAMP_HEAD_X - PLATFORM_PARAPET - room, sg > 0 ? z0 : -z1, sg > 0 ? z1 : -z0]; };
    const landing = [M.SHELF_X0 + 15, M.SHELF_X1 - 1, SHELF_LANES[1] + BODY.walker.half + BODY_GAP + sh, M.SHELF_Z1 - BOLLARD_IN - BOLLARD_R - room];
    const boxes = [doorSide(1), doorSide(-1), [M.TONGUE_X0 + 10, M.RAMP_FOOT_X - 4, -(M.TONGUE_HALF - 1.5), -(hw + 2.7)], [M.TONGUE_X0 + 6, GAP_X0 - 2, hw + 2.9, M.TONGUE_HALF - 1.5], landing, doorSide(1), landing];
    const things = [...STACKS.map(stackBox), ...AWNINGS.flatMap(([x, z, l, d]) => [-1, 1].flatMap((sx) => [-1, 1].map((sz) => [x + sx * l / 2 - 0.05, x + sx * l / 2 + 0.05, z + sz * d / 2 - 0.05, z + sz * d / 2 + 0.05]))), ...CRESSETS.map(([x, , z]) => [x - BOLLARD_R, x + BOLLARD_R, z - BOLLARD_R, z + BOLLARD_R])];
    const clear = (q) => things.every((b) => Math.hypot(Math.max(b[0] - q.x, 0, q.x - b[1]), Math.max(b[2] - q.z, 0, q.z - b[3])) >= room) && P.standers.every((o) => Math.hypot(o.x - q.x, o.z - q.z) >= 2 * sh + BODY_GAP);
    for (let i = 0; i < 18; i++) { const b = boxes[i % boxes.length], x = sr.range(b[0], b[1]), z = sr.range(b[2], b[3]), q = { x, z, y: footingY(x, z), yaw: sr.range(0, 6.28), tint: sr() }; if (i < nSt && clear(q)) P.standers.push(q); }
    // the keepers (r6b): one to each side of the first terrace (east, south, west, north) and one to each half of
    // the second (east, west), each dealt within the middle four fifths of his own side's share of the round, so
    // that no two can stand in one another; each on his terrace's walk, KEEPER_WALK from the tower's axis: half
    // way between the wall of the stage that rises from the terrace and the parapet's inner face
    const kr = S('keepers');
    for (let i = 0; i < 6; i++) { const top = i >= 4, n = top ? 2 : 4, a = ((top ? i - 4 : i) - 0.4 + 0.8 * kr.range(0, 6.28) / 6.28) * 2 * Math.PI / n, rad = KEEPER_WALK[top ? 1 : 0]; P.standers.push({ x: Math.cos(a) * rad, z: Math.sin(a) * rad, y: top ? Y2 : Y1, yaw: a, tint: kr() }); }
  }
  // ---- fishing boats (INVENTED): each from a stream of its own; a home is tried up to forty times inside its ground
  // and a boat whose last try still lies on a reef or on another boat is left out
  // (two boats keep FISHER_APART between their homes: each one's rowing ring, her hull, and 2 m of water)
  const nF = clamp(Math.round(6.5 * deal.density), 5, 8), FISHER_APART = 2 * (FISHER_RING + REACH.fisher[0]) + 2; P.fishers = [];
  for (let i = 0; i < nF; i++) {
    const fr = S('fisher' + i), zn = FISHING[i]; let x = 0, z = 0, ok = false;
    for (let k = 0; k < 40 && !ok; k++) { x = fr.range(zn[0], zn[1]); z = fr.range(zn[2], zn[3]); ok = P.fishers.every((f) => Math.hypot(f.x - x, f.z - z) > FISHER_APART) && P.reefs.every((q) => Math.hypot(q.x - x, q.z - z) > q.r + 15); }
    const fb = S('fisher-habit' + i), rowing = fb.chance(0.5), r = fb.range(5, FISHER_RING), w = fb.range(0.06, 0.1) * fb.sign(), yaw = fb.range(0, 6.28), phase = fb.range(0, 6.28);
    if (ok) P.fishers.push({ kind: 'fisher', x, z, r: rowing ? r : 0, w: rowing ? w : 0, yaw, phase });
  }
  // ---- THE NET (INVENTED): two boats lying to one net in the net ground in the lee (NET_GROUND), 22 to
  // 26 m apart, the net's floats in a bight between them that the north wind sets to the south; from a stream of its own
  { const nr = S('net'), g = NET_GROUND, cx = nr.range(g[0], g[1]), cz = nr.range(g[2], g[3]), half = nr.range(11, 13), ang = nr.range(-0.35, 0.35), ux = Math.cos(ang), uz = Math.sin(ang);
    const a = { kind: 'fisher', x: cx - ux * half, z: cz - uz * half, r: 0, w: 0, yaw: Math.PI + nr.range(-0.5, 0.5), phase: nr.range(0, 6.28) }, b = { kind: 'fisher', x: cx + ux * half, z: cz + uz * half, r: 0, w: 0, yaw: Math.PI + nr.range(-0.5, 0.5), phase: nr.range(0, 6.28) };
    P.fishers.push(a, b); P.net = { a: [a.x, a.z], b: [b.x, b.z], boats: [a, b], sag: nr.range(5, 8), mid: [cx, cz] }; }
  // small boats moored along the tongue's south wall, from 16 m east of the tongue's root (clear of the rock's skirt)
  // to the stair's gap: they lie stern to the quay, side by side, 2.6 m and more from middle to middle (a boat is
  // 1.8 m in the beam); and the roadstead's lighter
  { const br = S('moored'), nB = clamp(Math.round(6 * deal.density), 5, 7); P.moored = [];
    for (let i = 0; i < 7; i++) { const t = br.range(0.35, 0.65), yaw = br.range(-0.06, 0.06), phase = br.range(0, 6.28); if (i < nB) P.moored.push({ kind: 'moored', x: lerp(M.TONGUE_X0 + 16, GAP_X0, (i + t) / nB), z: M.TONGUE_HALF + 3.1, yaw, phase }); }
    P.moored.push(P.lighter); }
  // ---- walkers: SIDE LANES ONLY. Each side of the ramp is a closed walk of its own (up along the parapet, a clear
  // hand inside it; round on the door platform before the door's post; down a passing width further in; round again
  // above the ramp's foot: UP_LANE, DOWN_LANE, WALK_HEAD_X, WALK_FOOT_X), so nobody crosses the ramp's middle or the
  // door's opening at any clock. The shelf and the stair have their own walk (SHELF_LANES and STAIR_LANES: two lanes
  // a walkers' passing width apart, the inner one a walker's half and a hand off the ramp's wall on the stair and
  // off the pack slope's side on the shelf; round on the middle of the stair's head and a stride and a hand inside
  // the shelf's end; the walk leaves the stair's line for the shelf's by a slant that ends a walker's half and a
  // hand short of the slope's top edge).
  // AT THE DAY'S END THE RAMP IS BUSY (INVENTED: how many): the night's wood goes up by two strings of donkeys, one on
  // each side walk; the day's porters come down and the keepers go up. Twenty-four walkers are
  // dealt, twelve to a walk, as many used as the density asks; on each walk they keep clear of its string's 20 m.
  yield;
  const sideWalk = (sg) => { const mid = sg * (UP_LANE + DOWN_LANE) / 2, r = LANE_PASS / 2, q = sg * Math.PI / 2;
    return closedWalk([...halfRound(WALK_HEAD_X, mid, r, q, 3 * q), ...halfRound(WALK_FOOT_X, mid, r, -q, q)]); };
  const northWalk = sideWalk(-1), southWalk = sideWalk(1);
  const shelfWalk = (() => { const [zi, zo] = SHELF_LANES, [si, so] = STAIR_LANES, r = WALKER_PASS / 2, m = r * Math.tan(Math.PI / 8), xe = PACK_SLOPE[0] - (BODY.walker.half + HAND), xs = xe - (zi - si);
    const xh = (GAP_X0 + STAIR_X_HEAD) / 2, xt = M.SHELF_X1 - (HAND + BODY.walker.fore + r), h = Math.PI / 2;
    return closedWalk([[xt, zi], [xe + m, zi], [xs + m, si], ...halfRound(xh, (si + so) / 2, r, -h, -3 * h), [xs - m, so], [xe - m, zo], ...halfRound(xt, (zi + zo) / 2, r, h, -h).slice(0, -1)]); })();
  P.northWalk = northWalk; P.southWalk = southWalk; P.shelfWalk = shelfWalk; P.walkSpeed = 1.15;
  { const dr = S('donkeys'), nD = dr.int(5, 6), d0 = dr.range(0, northWalk.length); P.donkeys = []; for (let i = 0; i < nD; i++) P.donkeys.push({ s0: d0 - i * 2.7, walk: northWalk });
    // (the second string: its draws follow the stream's earlier ones)
    const nD1 = dr.int(5, 6), d1 = dr.range(0, southWalk.length); for (let i = 0; i < nD1; i++) P.donkeys.push({ s0: d1 - i * 2.7, walk: southWalk });
    const pr = S('ramp-walkers'), nW = Math.round(18 * deal.density); P.rampWalkers = [];
    for (let i = 0; i < 24; i++) { const t = pr.range(0.15, 0.85), tint = pr(), south = i % 2 === 0, walk = south ? southWalk : northWalk, k = Math.floor(i / 2);
      const s0 = (south ? d1 : d0) + 8 + (walk.length - 30) * (k + t) / 12;
      if (i < nW) P.rampWalkers.push({ s0, side: 0, tint, walk }); }
    const hr = S('shelf-walkers'), nS = Math.round(5 * deal.density); P.shelfWalkers = [];
    for (let i = 0; i < 7; i++) { const t = hr.range(0.2, 0.8), tint = hr(); if (i < nS) P.shelfWalkers.push({ s0: shelfWalk.length * (i + t) / nS, side: 0, tint, walk: shelfWalk }); } }
  // ---- gull flocks (INVENTED). EACH IS LAID BY ITS PLACE AND COUNTED FROM WHAT IS HANDED TO THE KIT: its loop (laid
  // here and handed, or the kit's orbit of a handed centre and radius), its spread [across, up and down, how far the
  // last bird lags behind the first along the loop], its wander and its count; the bound on the dealt places
  // (FLOCK_SIGMA) rides in every call. AT THE DAY'S END THE GULLS COME HOME TO THE ROCK and wheel round the tower
  // before they settle, strung all round it (the lag is one whole turn of the loop). EACH WHEEL'S LOOP IS LAID BY
  // THE STONE IT TURNS ABOUT: an oval about the tower's axis whose least radius is the stage's corner, the wheel's
  // clear air (WHEEL.clear) and the birds' whole reach on both level axes at once (flockReach's first, times the
  // root of two), dealt up to WHEEL.long times as long as wide
  // and turned to a dealt bearing, flown either way round, rising and falling WHEEL.rise twice a turn. THE UPPER
  // WHEEL turns about the eight-sided stage, its lowest bird WHEEL.head over the first terrace's floor; THE LOWER
  // about the first stage (its corner at the foot, the widest), a little over half way up it, its lowest bird
  // WHEEL.over above the middle of the door's opening (DOOR_YC plus 7 m). One low flock hangs over a dealt
  // reef group (its mean place: the southmost group of the bight's shoal), one works over the net, one over the
  // moored boats (below).
  // EACH FLOCK HAS A STREAM OF ITS OWN, NAMED HERE (stream; the world opens it and hands it to the kit, which deals
  // from it, in this order: a phase of the loop; for the two flocks on the kit's own orbit, that orbit's own
  // shape; where the flock is on its loop at clock 0; one sign; then for each bird its place in its flock (three
  // draws), its lag along the loop, a phase, its size (0.88 to 1.12), a second phase and its wing's reach
  // (0.85 to 1.1). Nothing is skipped and no draw is made that is not used.) The three flocks
  // that fly a loop laid here (the two wheels, the low flock over the moored boats) have streams named for them;
  // the two on the kit's orbit keep the streams they have had since they were first laid (gulls1, gulls2).
  // overRamp: THE LOWER WHEEL FLIES OVER THE RAMP: its loop goes round the first stage and so crosses the ramp
  // east of the door, its lowest bird WHEEL.over above the middle of the door's opening; for it the world hands
  // the kit keepClear (the visitor's way up the ramp to the door and 2 m: the kit bends the flock's own way clear
  // of that way by that and the flock's reach).
  const mean = (g) => g && g.length ? [g.reduce((a, q) => a + q.x, 0) / g.length, g.reduce((a, q) => a + q.z, 0) / g.length] : null;
  const gl = S('gull-loops');
  const wheel = (corner, lowest, count) => {
    const W = WHEEL, [side, up] = flockReach(W.spread, W.wander), wide = corner + W.clear + Math.SQRT2 * side, long = wide * gl.range(W.long[0], W.long[1]);
    const turn = gl.range(0, 2 * Math.PI), dir = gl() < 0.5 ? -1 : 1, ph = gl.range(0, 2 * Math.PI), yc = lowest + up + W.rise, route = [], n = 16; let len = 0;
    for (let i = 0; i < n; i++) { const t = dir * i / n * 2 * Math.PI, x = long * Math.cos(t), z = wide * Math.sin(t); route.push([x * Math.cos(turn) - z * Math.sin(turn), yc + W.rise * Math.sin(2 * t + ph), x * Math.sin(turn) + z * Math.cos(turn)]); }
    for (let i = 0; i < n; i++) { const p = route[i], q = route[(i + 1) % n]; len += Math.hypot(q[0] - p[0], q[2] - p[2]); }
    return { route, wheel: true, corner, lowest, center: [0, yc, 0], radius: long, height: W.rise, spread: [W.spread[0], W.spread[1], len], wander: W.wander, count };
  };
  P.gulls = [{ ...wheel((M.S2_FLATS / 2) / Math.cos(Math.PI / 8), Y1 + WHEEL.head, Math.round(36 * deal.density)), stream: 'gull-wheel-upper' }];
  const gw = mean(P.reefGroups.shoal2), gm = P.net.mid;
  if (gw) P.gulls.push({ stream: 'gulls1', center: [gw[0], 11, gw[1]], radius: 9, height: 3, spread: [4, 2.5, 4], wander: GULL_WANDER, count: Math.round(9 * deal.density) });
  P.gulls.push({ stream: 'gulls2', center: [gm[0], 11, gm[1] + 4], radius: 12, height: 3, spread: [6, 3, 6], wander: GULL_WANDER, count: Math.round(8 * deal.density) });
  P.gulls.push({ ...wheel(Math.SQRT2 * M.S1_FOOT / 2, DOOR_YC + WHEEL.over, Math.round(80 * deal.density)), stream: 'gull-wheel-lower', overRamp: true });
  // THE LOW FLOCK OVER THE MOORED BOATS, LAID BY ITS PLACE ALONE (LOW_FLOCK): the gulls work the water along the
  // tongue's south side, where the day's catch is landed and the fish offal goes over the side: over the boats
  // moored along the south wall and the water beside the landing shelf. ITS WATER is a box by the moorings' and the
  // shelf's own measures: from the moorings' west end to the shelf's east end, and from the quay's south edge (the
  // wall the boats lie against, which is the shelf's own south side) southward: no gull of this flock flies over
  // the paving. ITS LOOP is one long round inside that box, the birds' whole reach (flockReach) inside its north,
  // west and east bounds: out along the moored boats' bows, round in a bend of LOW_FLOCK.bend and back over the
  // water further out. The flock is strung round the whole loop.
  { const F = LOW_FLOCK, reach = flockReach(F.spread, F.wander)[0], b = F.bend, zn = M.TONGUE_HALF + reach, zc = zn + b;
    const xa = M.TONGUE_X0 + 16 + reach + b, xb = M.SHELF_X1 - reach - b, pts = [], legT = [0, 0.25, 0.5, 0.75, 1];
    for (const t of legT) pts.push([lerp(xa, xb, t), zn]);
    for (const a of [30, 60, 90, 120, 150]) pts.push([xb + b * Math.sin(a * RAD), zc - b * Math.cos(a * RAD)]);
    for (const t of legT) pts.push([lerp(xb, xa, t), zn + 2 * b]);
    for (const a of [30, 60, 90, 120, 150]) pts.push([xa - b * Math.sin(a * RAD), zc + b * Math.cos(a * RAD)]);
    const route = pts.map(([x, z], i) => [x, F.y + F.rise * Math.sin(i / pts.length * 4 * Math.PI), z]), len = 2 * (xb - xa) + 2 * Math.PI * b;
    P.gulls.push({ stream: 'gull-low-moored', route, reach, center: [(xa + xb) / 2, F.y, zc], radius: (xb - xa) / 2 + b, height: F.rise, spread: [F.spread[0], F.spread[1], len], wander: F.wander, count: Math.round(12 * deal.density) }); }
  return P;
}

// where a clock-moved hull is at world clock t: out = [x, z, headingX, headingZ]
export function shipAt(m, t, out = [0, 0, 0, 1]) {
  if (m.alongside) {
    // a lighter made fast alongside a ship at anchor: she swings with her (off to the side, fore along her)
    shipAt(m.alongside, t, out); const hx = out[2], hz = out[3];
    out[0] += hz * m.off + hx * m.fore; out[1] += -hx * m.off + hz * m.fore;
  } else if (m.lane) {
    // a ship on a lane or a patrol: distance wraps on the lane's length (an endless procession; no start, no end)
    const Ln = m.lane.length, s = (((m.s0 + m.v * t) % Ln) + Ln) % Ln, p = m.lane.posAtDist(s), d = m.lane.tangentAtDist(s);
    out[0] = p.x; out[1] = p.z; const l = Math.hypot(d.x, d.z) || 1; out[2] = d.x / l; out[3] = d.z / l;
  } else if (m.kind === 'fisher' && m.r > 0) {
    const a = m.phase + m.w * t; out[0] = m.x + Math.cos(a) * m.r; out[1] = m.z + Math.sin(a) * m.r;
    const sg = Math.sign(m.w); out[2] = -Math.sin(a) * sg; out[3] = Math.cos(a) * sg;
  } else {
    // at anchor, moored or drifting: a slow swing of a metre and a half about the home
    const dx = m.kind === 'moored' ? 0.25 : ANCHOR_SWING;
    out[0] = m.x + Math.sin(t * 0.05 + m.phase) * dx; out[1] = m.z + Math.cos(t * 0.043 + m.phase * 1.7) * dx * (m.kind === 'moored' ? 0.4 : 1);
    const y = m.yaw + Math.sin(t * 0.037 + m.phase) * (m.kind === 'moored' ? 0.03 : 0.12); out[2] = Math.sin(y); out[3] = Math.cos(y);
  }
  return out;
}
// (REACH, the hulls' reach, stands above with the route)

// the sea of one visit: the kit ocean's options that decide its height law (the world adds colours)
export function seaOptions(seed, deal) {
  const sr = makeRng(hashSeed('pharos-sea:' + seed));
  // the swell runs south on the north wind
  return { rng: sr, preset: 'swell', height: deal.swellHeight, wavelength: deal.swellLength, steepness: 0.5, spread: 0.4, speed: 1, windAngle: Math.PI / 2 + sr.range(-0.14, 0.14) };
}

// ---------------------------------------------------------------- one lit shader family for everything built here
// Light by facing and by place (phLight below): the sun (with the tower's own shadow cast by a law that reads the
// three stages' measures), the bright quarter of the sky on what is turned to it, the cool sky on everything, the
// fire on what stands near it (by distance from the hearth), the light of the door on what stands before it, and the
// small fires of the landing and the quay on the stone round them. No light object: every lamp is a term of this law. Linear HDR
// out, scene fog.
export const N_CRESSETS = CRESSETS.length;
export const LIT_PARS = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uGlowDir, uGlowCol, uFillTurn, uFirePos, uFireCol, uDoorPos, uDoorCol;
uniform vec3 uCresset[${N_CRESSETS}]; uniform float uCressetGain;
void phPl(vec3 n, float d, vec3 L, inout float tin, inout float tout, inout float miss){
  float v = dot(n, L);
  if (v > 1e-5) tout = min(tout, -d / v); else if (v < -1e-5) tin = max(tin, -d / v); else if (d > 0.) miss = 1.;
}
float phCyl(vec3 p, vec3 L, float r, float y0, float y1){
  float a = max(dot(L.xz, L.xz), 1e-5), b = dot(p.xz, L.xz), c = dot(p.xz, p.xz) - r * r, disc = b * b - a * c;
  if (disc <= 0.) return 0.;
  float sq = sqrt(max(disc, 0.)), ly = max(L.y, 1e-3);
  float lo = max(max((-b - sq) / a, (y0 - p.y) / ly), .05), hi = min((-b + sq) / a, (y1 - p.y) / ly);
  return hi > lo ? 1. : 0.;
}
// 1 where the sun reaches p, 0 in the tower's shadow: the square stage as its own leaning planes, the others as cylinders
float phSun(vec3 p){
  vec3 L = uSunDir; vec3 q = p - vec3(0., 4., 0.);
  float tin = .05, tout = 1e5, miss = 0.;
  phPl(vec3(.99944, .03331, 0.), dot(vec3(.99944, .03331, 0.), q) - 14.9917, L, tin, tout, miss);
  phPl(vec3(-.99944, .03331, 0.), dot(vec3(-.99944, .03331, 0.), q) - 14.9917, L, tin, tout, miss);
  phPl(vec3(0., .03331, .99944), dot(vec3(0., .03331, .99944), q) - 14.9917, L, tin, tout, miss);
  phPl(vec3(0., .03331, -.99944), dot(vec3(0., .03331, -.99944), q) - 14.9917, L, tin, tout, miss);
  phPl(vec3(0., 1., 0.), p.y - 65.2, L, tin, tout, miss);
  float s = (miss < .5 && tout > tin) ? 1. : 0.;
  s = max(s, phCyl(p, L, 8.1, 64., 94.));
  s = max(s, phCyl(p, L, 4.3, 94., 102.));
  return 1. - s;
}
// the harbour lights of the landing and the quay (lit at the afterglow only: uCressetGain is 0 by day): each throws
// a warm pool some 6 m across on the stone round it. Only the tongue's outer half asks.
vec3 phSmallFires(vec3 n, vec3 p){
  if (uCressetGain <= 0. || p.x < 60. || p.x > 104. || abs(p.z) > 22. || p.y > 12.) return vec3(0.);
  float s = 0.;
  for (int i = 0; i < ${N_CRESSETS}; i++) { vec3 v = uCresset[i] - p; float d2 = dot(v, v); s += (.35 + .65 * max(dot(n, v) / sqrt(d2 + 1e-3), 0.)) / (1. + d2 / 7.); }
  return vec3(1., .5, .18) * (s * uCressetGain);
}
// THE HOUR'S LIGHT, ONE TWO-SIDED LAW FOR EVERY MATERIAL OF THE PLACE (round 6). Each standing hour has a bright
// quarter (the sun, or after sunset the glow where it went down, 28 degrees north of west) and a cool sky opposite.
// A face takes, BY ITS OWN FACING and the hour's row of colours, nothing else:
//   the bright quarter's colour (uGlowCol: white gold at the low sun, orange gold at sunset, rose at early dusk) by
//   the share of that quarter it is turned to (phTurn: all of it full on, nine tenths on the tower's north face,
//   a seventh on a face turned an eighth of a turn past side-on, none on a face turned away; a top takes six tenths
//   of its share, for the quarter lies low and a top looks at the zenith);
//   the sun itself while it is up (uSunCol), cut off by the tower's own shadow;
//   the cool sky: the zenith's on a top (uSkyCol), the sea's dim return on what looks down (uGndCol), half of each
//   on a wall: the upper sky's blue-violet, which is all a face turned away has, A CLEAR STEP DARKER than the lit
//   side (on the tower's white about six tenths of it as shown) and never black;
//   (r6c) THE SKY'S FILL ON A WALL TAKES ITS HUE BY THE WALL'S FACING, FROM THE HOUR'S OWN SKY (phFill): a wall
//   turned from the bright quarter keeps the blue-violet above; turned toward it the fill goes over to the tone of
//   the sky that stands before such a wall (uFillTurn: the kit's sky of the hour, gathered in the world's build over
//   the half of the dome before a wall turned to the bright quarter, divided by the same for a wall turned from it:
//   more red, less green and blue), by half of one plus the cosine of the angle between the wall's facing and the
//   quarter's bearing; a top keeps the zenith's tone whole. No new light: the same fill, told by quarter.
// and BY ITS PLACE the hearth's light, the door's and the small fires', as before. ao: the share of the sky and the
// bright quarter that reaches it (contact shade under a cornice, a sill, a belt).
float phTurn(vec3 n){ return smoothstep(-.6, .7, dot(n, uGlowDir)) * (1. - .4 * max(n.y, 0.)); }
vec3 phFill(vec3 n){
  float toward = .5 + .5 * dot(n.xz / max(length(n.xz), 1e-3), uGlowDir.xz / max(length(uGlowDir.xz), 1e-3));
  return mix(uGndCol, uSkyCol, clamp(n.y * .5 + .5, 0., 1.)) * mix(vec3(1.), uFillTurn, clamp(1. - n.y * n.y, 0., 1.) * toward);
}
vec3 phLight(vec3 alb, vec3 n, vec3 p, float ao){
  float ndl = max(dot(n, uSunDir), 0.);
  vec3 sky = phFill(n);
  // the fire: by distance from the hearth (a wide bed of fire, so the light falls off gently)
  vec3 fv = uFirePos - p; float fd = max(length(fv), .5);
  vec3 fire = uFireCol * (.45 + .55 * max(dot(n, fv / fd), 0.)) / (1. + fd * fd / 140.);
  // the door's own light, from a point 2 m before the middle of the opening
  vec3 dv = uDoorPos - p; float dd = max(length(dv), .3);
  vec3 door = uDoorCol * max(dot(n, dv / dd), 0.) / (1. + dd * dd / 30.);
  return alb * (uSunCol * ndl * phSun(p) + (sky + uGlowCol * phTurn(n)) * ao + fire + door + phSmallFires(n, p));
}
float phHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float phNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(phHash(i), phHash(i + vec2(1., 0.)), f.x), mix(phHash(i + vec2(0., 1.)), phHash(i + vec2(1., 1.)), f.x), f.y); }
float phFbm(vec2 p){ return .5 * phNoise(p) + .25 * phNoise(p * 2.03 + 17.1) + .125 * phNoise(p * 4.1 + 31.7) + .0625 * phNoise(p * 8.3 + 5.3); }
// THE TOWER AS A MIRROR SEES IT: where a ray from o along d first meets the tower's three stages (the square stage
// as its own leaning planes, the others as cylinders: the measures the shadow law above reads). Returns the distance
// along the ray, or -1. where it passes the tower; n: the wall's facing there.
float phTowerHit(vec3 o, vec3 d, out vec3 n){
  float best = -1.; n = vec3(0., 1., 0.);
  vec3 q = o - vec3(0., 4., 0.); float tin = .05, tout = 1e5, miss = 0.; vec3 nin = vec3(0.);
  for (int i = 0; i < 4; i++) {
    vec3 pn = i == 0 ? vec3(.99944, .03331, 0.) : i == 1 ? vec3(-.99944, .03331, 0.) : i == 2 ? vec3(0., .03331, .99944) : vec3(0., .03331, -.99944);
    float v = dot(pn, d), dist = dot(pn, q) - 14.9917;
    if (v < -1e-5) { float t = -dist / v; if (t > tin) { tin = t; nin = pn; } } else if (v > 1e-5) tout = min(tout, -dist / v); else if (dist > 0.) miss = 1.;
  }
  if (d.y > 1e-5) tout = min(tout, (65.2 - o.y) / d.y);
  if (miss < .5 && tout > tin && dot(nin, nin) > .5) { best = tin; n = vec3(nin.x, 0., nin.z); }
  for (int i = 0; i < 2; i++) {
    float r = i == 0 ? 8.1 : 4.3, y0 = i == 0 ? 64. : 94., y1 = i == 0 ? 94. : 102.;
    float a = max(dot(d.xz, d.xz), 1e-6), b = dot(o.xz, d.xz), c = dot(o.xz, o.xz) - r * r, disc = b * b - a * c;
    if (disc > 0.) { float t = (-b - sqrt(disc)) / a, y = o.y + t * d.y;
      if (t > .05 && y > y0 && y < y1 && (best < 0. || t < best)) { best = t; vec3 h = o + d * t; n = normalize(vec3(h.x, 0., h.z)); } }
  }
  return best;
}
// GLINTS: the facets of the water that are too small to draw, each a mirror that shines for a moment when it stands
// as the mirror's law asks. p: the place on the water (m); share: the share of the facets there that stand right
// (0 to 1); px: the pixel's size on the water (m: the mean of its size across the view and along it, which at a low
// slant is far the longer); t: the world clock. A glint is a small round dot in a cell of the water, lit for about
// three quarters of a second and then dark (each cell by its own clock), in a new place within its cell each time.
// A cell is 0.15 m across near the eye and never less than five such pixels (it doubles
// as often as THE PIXEL'S SIZE asks, the two sizes blended: this reads the pixel's size alone), and a glint's light
// is such that THE MEAN OVER THE WATER IS share AT EVERY SIZE (a dot covers 0.1056 of its cell, is lit 0.6366 of
// its life at the mean, and six times share of the cells are lit: 1 / (6 x 0.1056 x 0.6366) = 2.48 at its peak).
float phGlintCells(vec2 p, float cell, float share, float t){
  vec2 g = p / cell, id = floor(g);
  float life = t * 1.3 + phHash(id + 11.7) * 9., k = floor(life);
  vec2 c = vec2(phHash(id + k * 7.13), phHash(id + k * 3.71 + 5.5)) * .5 + .25;
  float on = step(phHash(id * 1.37 + k * 13.9 + 2.2), min(share * 6., 1.));
  return on * (1. - smoothstep(.12, .24, length(fract(g) - c))) * sin(3.14159 * fract(life)) * 2.48;
}
float phGlints(vec2 p, float share, float px, float t){
  float l = log2(max(px * 5. / .15, 1.)), l0 = floor(l), c0 = .15 * exp2(l0);
  return mix(phGlintCells(p, c0, share, t), phGlintCells(p + 37.7, c0 * 2., share, t), l - l0);
}
`;
export function makeLightUniforms(light) {
  return {
    uSunDir: { value: light.sunDir.clone() }, uSunCol: { value: light.sunCol.clone() }, uSkyCol: { value: light.skyCol.clone() },
    uGndCol: { value: light.gndCol.clone() }, uGlowDir: { value: light.glowDir.clone() }, uGlowCol: { value: light.glowCol.clone() },
    uFillTurn: { value: (light.fillTurn || new THREE.Color(1, 1, 1)).clone() },
    uFirePos: { value: new THREE.Vector3(0, Y3 + 2, 0) }, uFireCol: { value: light.fireCol.clone() },
    uDoorPos: { value: new THREE.Vector3(M.DOOR_X + 2.5, DOOR_YC, 0) }, uDoorCol: { value: (light.doorCol || new THREE.Color(0, 0, 0)).clone() },
    uCresset: { value: Array.from({ length: N_CRESSETS }, () => new THREE.Vector3(0, -99, 0)) }, uCressetGain: { value: 0 },
  };
}
// Surface kinds (the attribute aK): 0 plain colour, 1 coursed plaster on a flat face, 2 large quay blocks, 3 reef rock,
// 4 pink granite, 5 dark bronze, 6 paving, 7 coursed plaster on the round stage, 8 a lamp (its own light), 9 white
// dressed stone without courses (belts, sills, frames), 10 the plinth's large stones, 11 the dark of a room seen
// through a window, 12 a window's reveal with a lamp's light on it. Every kind but the lamp takes the one law of
// light (phLight); a kind is only what the stone or metal itself looks like.
const LIT_VERT = /* glsl */`
attribute vec3 aC; attribute float aK; varying vec3 vW, vN, vC; varying float vK;
#include <fog_pars_vertex>
void main(){
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
  mm = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = mm * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(mm) * normal); vC = aC; vK = aK;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// the belt courses of the first stage: one at every floor, 1 m under each row of windows (the first at BELT_Y0)
// (p1) INVENTED BY NEED: a belt is a string course 0.55 m high (r6: 0.3) standing BELT_OUT, 0.32 m, proud of the plaster (r6: 0.1), with a weathering
// (a slope back to the wall, 0.14 m) and a flat soffit. The stand is what the shade under it is read from (LEDGE_REACH times the stand: the wall under
// a ledge loses the sky the ledge shuts out; a stand of 0.1 m would shade 0.3 m of wall).
export const WINDOW_ROWS = 9, WINDOW_ROW_Y0 = 10.6, WINDOW_ROW_STEP = 5.6, BELT_UNDER = 1, BELT_H = 0.55, BELT_OUT = 0.32, BELT_WEATHER = 0.14;
// the upper stages' belts: the eight-sided stage's two (0.45 m high, 0.24 m proud; r6: 0.3 and 0.1), the round stage's one (0.4 m high, 0.2 m proud; r6: 0.28 and 0.09)
export const BELT2 = [0.45, 0.24, 0.12], BELT3 = [0.4, 0.2, 0.1];
// THE SHADE UNDER A LEDGE, one law for the first stage's belts, the plinth's cap and the three cornices (the upper stages' belts have their soffit's
// tone only): the wall under a ledge that stands s proud is shaded over LEDGE_REACH x s below it, most just under it (there it loses LEDGE_SHADE of
// its fill and of the bright quarter's light), nothing at the reach's end.
// LEDGE_SHADE, THE RECKONING BY THE PLACE: a point of the wall d below a long ledge of stand s sees the upper sky only under the ledge's nose and
// loses 1 - d / sqrt(d d + s s) of an even upper sky's light: all of it close under the ledge, .55 half a stand down, .29 one stand down, .05 at the
// reach's end; in the mean over the reach of three stands 1 - (sqrt(10) - 1) / 3 = .28. The law's shade in the mean over its reach is half of
// LEDGE_SHADE: .55 gives .275, the same loss (.558 would be exact; by each ledge's own outline, its corners and its round, .51 to .56).
// OWNED: the law takes that share from the wall's whole fill and from the bright quarter's light, though a ledge shuts out neither the sea's return
// (about four tenths of a wall's fill by the hours' rows) nor more than a little of the low quarter: by so much the drawn shade is deeper than the
// upper sky's alone would make it (which by the same reckoning would ask about .35 on a wall turned from the quarter). INVENTED BY NEED.
export const LEDGE_REACH = 3, LEDGE_SHADE = 0.55;
// the cornices of the three stages (buildTower): [the cornice's whole height, the bed's height, the bed's stand, the
// overhang, the cap's height]
export const CORNICE = { s1: [1.9, 0.55, 0.3, 1.6, 0.22], s2: [1.4, 0.4, 0.22, 1.1, 0.18], s3: [1.0, 0.3, 0.15, 0.7, 0.14] };
// how far in from its cornice's edge a terrace's parapet has its inner face (the first terrace, the second)
export const PARAPET_IN = [0.6, 0.5];
// the keepers' walks, from the tower's axis: on each terrace half way between the wall of the stage that rises from
// it (the eight-sided stage's flat; the round stage) and the parapet's inner face: 11.1 m and 6.58 m
export const KEEPER_WALK = [(M.S2_FLATS / 2 + M.S1_TOP / 2 + CORNICE.s1[3] - PARAPET_IN[0]) / 2, (M.S3_DIA / 2 + M.S2_FLATS / 2 + CORNICE.s2[3] - PARAPET_IN[1]) / 2];
// a window's reveal is WINDOW_DEEP into the wall; WINDOW_WALL_SHARE: the share of the first stage's wall that is
// opening (five openings of 0.8 by 1.7 m to a floor 5.6 m high on a face 28 m wide at the mean), which the wall's
// shader reads to hold the wall's mean tone
// (p1) INVENTED BY NEED: the reveal is 0.85 m deep (r6: 0.42; a wall of this height is metres thick at these floors), so that it holds a shade from every side;
// the frame: jambs 0.28 m wide standing 0.16 m (r6: 0.24 and 0.1), a head 0.34 m high standing 0.24 m (r6: 0.28 and 0.15), a sill 0.28 m high standing 0.34 m (r6: 0.24 and 0.24)
export const WINDOW_FRAME = { jamb: [0.28, 0.16], head: [0.34, 0.24, 0.4], sill: [0.28, 0.34, 0.46] };
// WINDOW_FAR: how much of the wall's lit tone a window's dark takes where a pixel is wider than 30 cm of wall (r6: 0.62). INVENTED BY NEED: a figure
// of the wall's reading that no measure of the place gives (by the place a pixel 30 cm wide whose middle lies on an opening 0.8 by 1.7 m holds .13
// of wall, and .3 where it is 0.7 m wide). The wall gives up what the openings gain, so a face's mean tone holds.
export const WINDOW_FAR = 0.3;
export const WINDOW_DEEP = 0.85, WINDOW_WALL_SHARE = 5 * M.WIN_W * M.WIN_H / (WINDOW_ROW_STEP * (M.S1_FOOT + M.S1_TOP) / 2);
const LIT_FRAG = /* glsl */`
varying vec3 vW, vN, vC; varying float vK;
#define FLOOR_STEP ${WINDOW_ROW_STEP.toFixed(2)}
#define U1 ${(Y1 - CORNICE.s1[0]).toFixed(2)}
#define U2 ${(Y2 - CORNICE.s2[0]).toFixed(2)}
#define U3 ${(Y3 - CORNICE.s3[0]).toFixed(2)}
#define WIN_SHARE ${WINDOW_WALL_SHARE.toFixed(4)}
#define BELT_Y0 ${(WINDOW_ROW_Y0 - BELT_UNDER).toFixed(2)}
#define PLINTH_COURSE ${((WINDOW_ROW_Y0 - BELT_UNDER - M.PLATFORM_Y) / 5).toFixed(3)}
#define BELT_OUT ${BELT_OUT.toFixed(3)}
#define LEDGE_REACH ${LEDGE_REACH.toFixed(2)}
#define LEDGE_SHADE ${LEDGE_SHADE.toFixed(3)}
#define WINDOW_FAR ${WINDOW_FAR.toFixed(3)}
#define O1 ${CORNICE.s1[3].toFixed(2)}
#define O2 ${CORNICE.s2[3].toFixed(2)}
#define O3 ${CORNICE.s3[3].toFixed(2)}
${LIT_PARS}
#include <fog_pars_fragment>
// A joint line of half width w (in cells) seen through a pixel a cells wide: the share of the pixel it covers. Under
// two pixels to a cell it goes over to the plain mean, so far masonry is one even tone and never a moire.
float phLine(float f, float w, float a){
  a = max(a, 1e-4);
  float c = min(clamp((w + .5 * a - min(f, 1. - f)) / a, 0., 1.), 2. * w / a);
  return mix(c, 2. * w, smoothstep(.3, .65, a));
}
// (p1) THE SHADE UNDER A LEDGE: below metres under a ledge that stands s proud, seen through a pixel a metres of wall high. The shade is
// 1 - smoothstep(0, LEDGE_REACH s, below), and what is returned is ITS MEAN OVER THE PIXEL (the integral in closed form), so that far off it goes over
// toward the band's plain mean (the mean is taken under the ledge alone: the part of a pixel that lies over the ledge takes none) and never steps
// from one pixel row to the next as the eye moves (no crawl; nothing finer than a pixel is drawn).
float phLedgeG(float t){ t = clamp(t, 0., 1.); return t - t * t * t + .5 * t * t * t * t; }
float phLedge(float below, float s, float a){
  float r = LEDGE_REACH * s; a = max(a, 1e-3);
  return r * (phLedgeG((below + .5 * a) / r) - phLedgeG((below - .5 * a) / r)) / a;
}
// coursed masonry: uv in metres, course height ch, block length bl, joint half width jw in metres.
// returns (joint share, the course's tone, the block's tone), tones about 0 with their own fade by distance
vec3 phCourses(vec2 uv, float ch, float bl, float jw){
  float v = uv.y / ch, row = floor(v);
  float u = uv.x / bl + mod(row, 2.) * .5 + phHash(vec2(row, 3.7)) * .3;
  float ay = fwidth(v), au = fwidth(u);
  float j = max(phLine(fract(v), jw / ch, ay), phLine(fract(u), jw / bl, au) * .8);
  float tc = (phHash(vec2(row, 1.3)) - .5) * (1. - smoothstep(.3, .9, ay));
  float tb = (phHash(vec2(floor(u), row)) - .5) * (1. - smoothstep(.3, .9, max(au, ay)));
  return vec3(j, tc, tb);
}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-6, 0.)), alb = vC; float k = floor(vK + .5), ao = 1., sunCut = 0.;
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), spec = vec3(0.);
  vec2 tg = normalize(vec2(-n.z, n.x) + vec2(1e-4, 0.));
  vec2 uv = vec2(dot(vW.xz, tg), vW.y - 4.);
  if (k == 7.) uv.x = atan(vW.z, vW.x) * 4.35;
  if (k == 1. || k == 7.) {
    // limestone in courses half a metre high under a thin wash of white plaster: joints, a tone to each course and block
    vec3 c = phCourses(uv, ${M.COURSE_H.toFixed(2)}, ${M.BLOCK_L.toFixed(2)}, .024);
    float blot = phFbm(uv * vec2(.22, .3) + 3.), fine = phNoise(uv * vec2(1., 2.) * 2.);
    alb *= (.9 + .16 * blot) * (1. + .15 * c.y + .13 * c.z) * (.97 + .06 * fine) * (1. - .5 * c.x);
    // near scale, BY THE PIXEL'S SIZE ON THE WALL (fwNear: metres of wall to a pixel, as phCourses reads it): where
    // a pixel is smaller than about 4 cm, and fully under about 2 cm, each course shows as two bands of smaller
    // facing stones with hairline joints, and the plaster is crazed with fine cracks and pitted (INVENTED). Each
    // comes in ABOUT ITS OWN MEAN (joints 0.0813, cracks 0.0100, pits 0.2045 of the wall: counted, scratchpad
    // plaster-means.mjs), so the wall's tone is the same far and near.
    float fwNear = max(fwidth(uv.x), fwidth(uv.y)), near = 1. - smoothstep(.022, .044, fwNear);
    if (near > 0.) {
      vec3 c2 = phCourses(uv + vec2(.37, 0.), ${(M.COURSE_H / 2).toFixed(3)}, ${(M.BLOCK_L * 0.42).toFixed(3)}, .007);
      float crack = smoothstep(.016, 0., abs(phNoise(uv * 1.7 + 11.) - .5)) * smoothstep(.45, .65, phNoise(uv * .35 + 4.));
      alb *= 1. - near * (.24 * (c2.x - .0813) + .2 * (crack - .01) + .1 * (smoothstep(.6, .8, phNoise(uv * 13.)) - .2045)) + near * .07 * c2.z;
    }
    // the first stage's four faces: the shade under each belt course (the belts stand at every floor, FLOOR_STEP
    // apart). (r6c: the corner is the plain meeting of two plastered faces, the courses' own faint lines running to
    // it; the dressed corner stones that stood here are gone: nothing invented is set on the Wonder as a thing of
    // it. The corner has its edge by the two faces' light.)
    float fh = ${(M.S1_FOOT / 2).toFixed(2)} - ${((M.S1_FOOT - M.S1_TOP) / 2).toFixed(3)} * clamp((vW.y - 4.) / ${(M.S1_H - 0.9).toFixed(2)}, 0., 1.);
    float onFace = step(abs(n.y), .3) * step(vW.y, U1 - .2) * step(BELT_Y0, vW.y) * step(abs(dot(vW.xz, normalize(n.xz + vec2(1e-5, 0.))) - fh), .2) * step(k, 1.5);
    if (onFace > 0.) {
      float below = FLOOR_STEP - mod(vW.y - BELT_Y0, FLOOR_STEP), onBelts = step(BELT_Y0 - FLOOR_STEP, vW.y) * step(vW.y, BELT_Y0 + 8.2 * FLOOR_STEP);
      // (p1) the shade under each belt by the belt's own stand (phLedge), and THE SUN'S OWN SHADE under it at the hours with the sun up: the belt's nose
      // cuts the sun off the wall for stand x (the sun's height / its bearing onto the face) below it (a hand's breadth at the low sun, less at sunset)
      ao *= 1. - LEDGE_SHADE * phLedge(below, BELT_OUT, fwidth(vW.y)) * onBelts;
      float toSun = dot(n, uSunDir);
      if (toSun > 0.) sunCut = onBelts * (1. - smoothstep(-.5, .5, (below - BELT_OUT * uSunDir.y / max(length(uSunDir.xz) * toSun, 1e-3)) / max(fwidth(vW.y), 1e-3)));
    }
    // weather: a grey-brown wash under each cornice and terrace, long dark streaks down the face from them
    float under = smoothstep(9., 0., U1 - vW.y) * step(vW.y, U1) + smoothstep(5., 0., U2 - vW.y) * step(64.5, vW.y) * step(vW.y, U2) + smoothstep(2.4, 0., U3 - vW.y) * step(95.2, vW.y) * step(vW.y, U3);
    float streak = phNoise(vec2(uv.x * .9, 1.)) * phNoise(vec2(uv.x * .23, 7.));
    alb *= mix(vec3(1.), vec3(.66, .62, .58), under * (.3 + .7 * streak) * .85);
    alb *= 1. - .12 * smoothstep(.55, .8, phNoise(vec2(uv.x * 1.7, uv.y * .05 + 9.)));
    // STONE, NOT PAINT: at middle distance the courses show as a faint banding, four courses to a band (each band
    // its own tone; it goes over to the mean where a pixel holds a band: by the pixel's size alone); low on the
    // tower, where the spray reaches, the plaster is a little warmer and darker (to about 12 m over the sea)
    float bandRow = floor(uv.y / ${(M.COURSE_H * 4).toFixed(2)});
    alb *= 1. + .1 * (phHash(vec2(bandRow, 9.1)) - .5) * (1. - smoothstep(.5, 1.6, fwidth(uv.y)));
    alb *= mix(vec3(.93, .88, .8), vec3(1.), smoothstep(5., 16., vW.y + 2. * phNoise(vec2(uv.x * .12, 2.))));
    // the shade under the cornices, where the sky is shut out: a firm line of it close under each, thinning below
    float c1 = U1 - vW.y, c2 = U2 - vW.y, c3 = U3 - vW.y;
    // (p1) each cornice's shade by its own overhang, the one law of the ledges (phLedge), and the firm line close under it: .22, .2 and .18 (r6: .26,
    // .24 and .22), so that close under the first cornice the fill is 1 - .55 - .22 = .23 of the wall's (r6 left .44)
    float aw = fwidth(vW.y);
    ao *= 1. - (LEDGE_SHADE * phLedge(c1, O1, aw) + .22 * smoothstep(.9, .1, c1)) * step(vW.y, U1) - (LEDGE_SHADE * phLedge(c2, O2, aw) + .2 * smoothstep(.7, .1, c2)) * step(65.3, vW.y) * step(vW.y, U2)
      - (LEDGE_SHADE * phLedge(c3, O3, aw) + .18 * smoothstep(.5, .1, c3)) * step(95.2, vW.y) * step(vW.y, U3);
    // (the windows' dark is softened far off, below: the wall gives up the same light, so that the face's mean tone
    // is one far and near)
    alb *= 1. - WIN_SHARE * WINDOW_FAR * smoothstep(.06, .3, max(fwidth(uv.x), fwidth(uv.y))) * step(abs(n.y), .3) * step(vW.y, U1) * step(k, 1.5);
  } else if (k == 9.) {
    alb *= .96 + .08 * phNoise(vW.xz * 1.3 + vW.y * 2.);
  } else if (k == 10.) {
    // the plinth: five courses of large stones, each face of a stone a little bossed (paler toward its top edge),
    // darker with damp at the foot and crusted pale with salt above the damp
    vec3 c = phCourses(uv, PLINTH_COURSE, 2.7, .05);
    float inb = fract(uv.y / PLINTH_COURSE);
    alb *= (.86 + .2 * phFbm(uv * .5 + 7.)) * (1. + .16 * c.z + .08 * c.y) * (.9 + .16 * inb) * (1. - .5 * c.x);
    float wet = phNoise(vec2(uv.x * .35, 3.)) * 1.2 + phNoise(vec2(uv.x * 1.9, 5.)) * .4;
    alb *= mix(vec3(.5, .5, .47), vec3(1.), smoothstep(4.3, 5.4, vW.y - wet * .6));
    alb = mix(alb, vec3(.9, .9, .86), .5 * smoothstep(5.0, 5.7, vW.y - wet * .6) * smoothstep(7.4, 6.2, vW.y - wet * .8) * (.4 + .6 * phNoise(uv * vec2(.8, 2.5))));
    ao *= 1. - LEDGE_SHADE * phLedge(BELT_Y0 - vW.y, BELT_OUT, fwidth(vW.y));
  } else if (k == 2.) {
    vec3 c = phCourses(uv, .75, 1.7, .04);
    alb *= (.8 + .3 * phFbm(uv * .6)) * (1. + .2 * c.z + .08 * c.y) * (1. - .45 * c.x);
    alb *= mix(vec3(.42, .46, .44), vec3(1.), smoothstep(.2, 2.2, vW.y + .8 * phNoise(vW.xz * .3)));
  } else if (k == 3.) {
    float r = phFbm(vW.xz * .45 + vW.y * .3);
    alb *= (.6 + .8 * r) * mix(.5, 1., smoothstep(-.1, .7, vW.y));
  } else if (k == 4.) {
    // red granite, polished: dark and pale grains, a sheen of the sky and the bright quarter on it. No joint is drawn:
    // as built: each post is a single stone 11.56 m high and the lintel over them a single stone 1.2 m high (after the
    // one measured stone of this doorway, a post of over 11.50 m)
    float sp = phNoise(vW.yz * 9. + vW.x * 5.), sp2 = phNoise(vW.zy * 23. + 5.);
    alb *= (.8 + .34 * sp) * (.88 + .24 * sp2);
    float fr = pow(max(1. - max(dot(n, V), 0.), 0.), 3.);
    spec = uSkyCol * (.1 + .5 * fr) + (uGlowCol + uSunCol * .6) * pow(max(dot(n, normalize(V + uGlowDir + vec3(0., 1e-4, 0.))), 0.), 40.) * 1.5;
  } else if (k == 6.) {
    vec2 g = vW.xz / vec2(1.2, .8); g.x += mod(floor(g.y), 2.) * .5; vec2 f = fract(g); vec2 ag = fwidth(g);
    float j = max(phLine(f.x, .03, ag.x), phLine(f.y, .04, ag.y));
    alb *= (.82 + .3 * phFbm(vW.xz * .5)) * (.92 + .16 * phHash(floor(g)) * (1. - smoothstep(.3, .9, max(ag.x, ag.y)))) * (1. - .34 * j);
  } else if (k == 5.) {
    // dark bronze: a glint on the side toward the bright quarter of the sky, the sun and the fire
    alb *= .75 + .5 * phNoise(vW.xy * 1.7 + vW.z);
    vec3 fl = normalize(uFirePos - vW + vec3(0., 1e-3, 0.));
    spec = (uGlowCol * 1.6 + uSunCol * phSun(vW)) * pow(max(dot(n, normalize(V + uGlowDir + vec3(0., 1e-4, 0.))), 0.), 18.) * vec3(1., .82, .6)
      + uFireCol * pow(max(dot(n, normalize(V + fl + vec3(0., 1e-4, 0.))), 0.), 14.) * 6. / (1. + dot(uFirePos - vW, uFirePos - vW) / 60.);
  }
  vec3 col = phLight(alb, n, vW, ao) + spec;
  if (sunCut > 0.) col -= alb * uSunCol * max(dot(n, uSunDir), 0.) * phSun(vW) * sunCut;   // (p1) the sun cut off by a belt's nose
  // (p1) A REVEAL LIES IN ITS WALL'S SHADE. Inside an opening of the first stage (behind the wall's own face) a face looks out through the opening's mouth
  // at the sky THE WALL looks at: the bright quarter and the sky's fill reach it by no more than the wall's own facing gives (none of the quarter in a wall
  // turned away; the sun is cut there already, by the tower's own shadow: phSun). r6 lit a jamb by its own facing alone, so that in a wall turned from
  // the quarter one jamb of every window stood bright: the deeper reveal would have shown it twice as wide. From 2 to 12 cm behind the face the shade comes
  // on (no hard edge at the mouth). The hearth's light, the door's and the small fires' reach it as before, by its place.
  if ((k == 1. || k == 12.) && vW.y > BELT_Y0 && vW.y < U1 - .2) {
    vec3 wn = abs(vW.x) > abs(vW.z) ? vec3(sign(vW.x), 0., 0.) : vec3(0., 0., sign(vW.z));
    float fhw = ${(M.S1_FOOT / 2).toFixed(2)} - ${((M.S1_FOOT - M.S1_TOP) / 2).toFixed(3)} * clamp((vW.y - 4.) / ${(M.S1_H - 0.9).toFixed(2)}, 0., 1.);
    float inRev = smoothstep(.02, .12, fhw - max(abs(vW.x), abs(vW.z))) * step(dot(n, wn), .5);
    if (inRev > 0.) {
      col -= alb * max(phFill(n) + uGlowCol * phTurn(n) - phFill(wn) - uGlowCol * phTurn(wn), 0.) * ao * inRev;
      // (p1) THE REVEAL DARKENS INWARD AT r6'S OWN RATE: r6's reveal fell from its tone at the wall's face to .4 of it at the room, 0.42 m in; the
      // reveal's own colours still run evenly between those two tones over the whole depth (WINDOW_DEEP, 0.85 m), which alone would leave the reveal
      // paler inside than r6's at the same depth; so the tone is brought to .4 to the power (depth / 0.42 m): r6's own at 0.42 m, and on at that rate
      // (.16 at the room). A deep opening is dark inside: seen askew it is a dark slot, not a pale niche. (The lamp's light on a lit reveal, below, is
      // added after it, as before.)
      float dIn = clamp((fhw - max(abs(vW.x), abs(vW.z))) / ${WINDOW_DEEP.toFixed(2)}, 0., 1.);
      col *= mix(1., pow(.4, dIn * ${(WINDOW_DEEP / 0.42).toFixed(3)}) / mix(1., .4, dIn), inRev);
    }
  }
  // kind 8: a lamp, its own light
  if (k == 8.) col = vC;
  // kind 12: a lit window's reveal: the lamp's light lies on it, more the deeper in (the reveal's own colour tells
  // how deep: pale at the wall's face, dark at the room)
  if (k == 12.) col += vec3(${WINDOW_LAMP.r.toFixed(3)}, ${WINDOW_LAMP.g.toFixed(3)}, ${WINDOW_LAMP.b.toFixed(3)}) * (.75 * clamp((.86 - vC.r) / .5, 0., 1.));
  // kind 11: the dark of a room through a window. FAR OFF THE DARK IS SOFTENED, BY THE PIXEL'S SIZE ON THE WALL ALONE:
  // where a pixel is wider than 6 cm of wall the opening begins to take the wall's own lit tone, and where it is
  // wider than 30 cm it has taken WINDOW_FAR of it (.3; r6: .62): far off the wall is stone with a rhythm of openings, near
  // to it has real ones. The wall gives up what the openings gain (above), so the face's mean tone holds.
  if (k == 11.) col = mix(col, phLight(vec3(.74, .67, .56), n, vW, 1.), WINDOW_FAR * smoothstep(.06, .3, max(fwidth(uv.x), fwidth(uv.y))));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
export function makeLitMaterial(U, extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: LIT_VERT, fragmentShader: LIT_FRAG, fog: true, side: THREE.DoubleSide, ...extra });
}

// ---------------------------------------------------------------- a small geometry accumulator (flat facets, colour, kind)
export function makeBuilder() {
  const pos = [], nor = [], col = [], knd = [];
  const push = (p, n, c, k) => { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); col.push(c.r, c.g, c.b); knd.push(k); };
  const B = {};
  // ref: a point inside the solid; the facet's normal is turned away from it
  B.tri = (a, b, c, color, k, ref) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (ref && nx * (a[0] - ref[0]) + ny * (a[1] - ref[1]) + nz * (a[2] - ref[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const n = [nx, ny, nz]; push(a, n, color, k); push(b, n, color, k); push(c, n, color, k);
  };
  B.quad = (a, b, c, d, color, k, ref) => { B.tri(a, b, c, color, k, ref); B.tri(a, c, d, color, k, ref); };
  // a quad with a colour of its own at each corner (a reveal that darkens inward)
  B.quadC = (a, b, c, d, ca, cb, cc, cd, k, ref) => {
    const at = pos.length / 3; B.quad(a, b, c, d, ca, k, ref);
    [ca, cb, cc, ca, cc, cd].forEach((q, i) => { col[(at + i) * 3] = q.r; col[(at + i) * 3 + 1] = q.g; col[(at + i) * 3 + 2] = q.b; });
  };
  B.box = (x0, y0, z0, x1, y1, z1, color, k, kTop) => {
    const r = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], kt = kTop ?? k;
    B.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], color, k, r); B.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], color, k, r);
    B.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], color, k, r); B.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], color, k, r);
    B.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], color, kt, r); B.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], color, k, r);
  };
  // walls between two rings of [x, z] corners at y0 and y1 (a prism, a frustum, a batter)
  B.walls = (r0, y0, r1, y1, color, k, ref) => { const n = r0.length; for (let i = 0; i < n; i++) { const j = (i + 1) % n; B.quad([r0[i][0], y0, r0[i][1]], [r0[j][0], y0, r0[j][1]], [r1[j][0], y1, r1[j][1]], [r1[i][0], y1, r1[i][1]], color, k, ref); } };
  B.cap = (ring, y, color, k, up = 1) => {
    let cx = 0, cz = 0; for (const q of ring) { cx += q[0] / ring.length; cz += q[1] / ring.length; }
    const n = [0, up, 0];
    for (let i = 0; i < ring.length; i++) { const j = (i + 1) % ring.length; push([cx, y, cz], n, color, k); push([ring[i][0], y, ring[i][1]], n, color, k); push([ring[j][0], y, ring[j][1]], n, color, k); }
  };
  // a round wall with radial normals
  B.round = (cx, cz, r0, y0, r1, y1, seg, color, k) => {
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * 6.2831853, b = ((i + 1) / seg) * 6.2831853, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      const p = [[cx + ca * r0, y0, cz + sa * r0], [cx + cb * r0, y0, cz + sb * r0], [cx + cb * r1, y1, cz + sb * r1], [cx + ca * r1, y1, cz + sa * r1]], na = [ca, 0, sa], nb = [cb, 0, sb];
      push(p[0], na, color, k); push(p[1], nb, color, k); push(p[2], nb, color, k); push(p[0], na, color, k); push(p[2], nb, color, k); push(p[3], na, color, k);
    }
  };
  B.count = () => pos.length / 9;
  B.geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(knd, 1));
    g.computeBoundingSphere(); return g;
  };
  // the same geometry laid in steps (one attribute to a step), for the large meshes: each copy of a long list is its own step
  B.geometryInSteps = async (yieldNow) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await yieldNow(); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); await yieldNow();
    g.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3)); await yieldNow(); g.setAttribute('aK', new THREE.Float32BufferAttribute(knd, 1)); await yieldNow();
    g.computeBoundingSphere(); return g;
  };
  return B;
}
const ngon = (n, r, rot = 0, cx = 0, cz = 0) => { const o = []; for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return o; };
const sq = (h) => [[-h, -h], [h, -h], [h, h], [-h, h]];
export const COL = {
  plaster: new THREE.Color('#e6dccb'), block: new THREE.Color('#cbbd9e'), rock: new THREE.Color('#7d766a'), granite: new THREE.Color('#b25a4c'),
  bronze: new THREE.Color('#3a2f28'), paving: new THREE.Color('#bdb096'), wood: new THREE.Color('#6b5138'), dark: new THREE.Color('#0c0b0a'), soot: new THREE.Color('#3b352f'),
};

// the rock, its sea wall, the tongue, the landing, the stair and the ramp (the ground of the place)
function buildGround(B, noise) {
  const K = M.PLATFORM_Y, C = COL;
  // the main rock's built platform: a sea wall of large pale blocks, x -40 to 30, z -35 to 35, corners cut
  const out = [[-40, -27], [-32, -35], [22, -35], [30, -27], [30, 27], [22, 35], [-32, 35], [-40, 27]], foot = out.map((q) => [q[0] * 1.03 - 0.15, q[1] * 1.035]);
  B.walls(foot, -2.5, out, K, C.block, 2, [-5, 0, 0]); B.cap(out, K, C.paving, 6);
  // the skirt of dark reef rock round it
  const N = 56, rings = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, dx = Math.cos(a), dz = Math.sin(a);
    // where the ray from (-5, 0) leaves the platform's box; the tongue's root (east) carries no skirt
    const t = Math.min(dx > 0 ? 35 / Math.max(dx, 1e-6) : 35 / Math.max(-dx, 1e-6), 35 / Math.max(Math.abs(dz), 1e-6)) * 1.02;
    const w = 0.55 + 0.9 * (0.5 + 0.5 * noise.n2(dx * 2.3 + 7, dz * 2.3)), east = smoothstep(0.86, 0.97, dx);
    const row = [];
    for (const [d, h] of [[0, 2.3], [3, 1.1], [7.5, 0.35], [13, -2.2]]) {
      const rr = t + d * w * (1 - 0.85 * east), bump = d > 0 && d < 13 ? 0.9 * noise.n2(dx * 9 + d, dz * 9) + 0.5 * noise.n2(dx * 23, dz * 23 + d) : 0;
      row.push([-5 + dx * rr, h + bump * (1 - east), dz * rr]);
    }
    rings.push(row);
  }
  for (let i = 0; i < N; i++) { const A = rings[i], Bn = rings[(i + 1) % N]; for (let j = 0; j < 3; j++) B.quad(A[j], Bn[j], Bn[j + 1], A[j + 1], C.rock, 3, [-5, -30, 0]); }
  // the tongue: a built arm, x 30 to 98, z -13 to 13, top at y 4; its south-east corner cut down to the landing shelf
  const X0 = M.TONGUE_X0 - 0.5, X1 = M.TONGUE_X1, H = M.TONGUE_HALF, SX = M.SHELF_X0, SZ = M.SHELF_Z0, SY = M.SHELF_Y;
  B.box(X0, -2.5, -H, X1, K, SZ, C.block, 2, 6); B.box(X0, -2.5, SZ, SX, K, H, C.block, 2, 6); B.box(SX, -2.5, SZ, X1, SY, H, C.block, 2, 6);
  // steps down into the water along the shelf's south edge
  for (let i = 0; i < 6; i++) B.box(SX, -2.5, H + i * 0.36, X1, SY - (i + 1) * 0.3, H + (i + 1) * 0.36, C.block, 2, 6);
  // the landing stair, 5 m wide, climbing west along the ramp's south wall, and its head level with the ramp at the gap
  const nSt = STAIR_STEPS, sx0 = STAIR_X_FOOT, sx1 = STAIR_X_HEAD, tread = (sx0 - sx1) / nSt;
  for (let i = 0; i < nSt; i++) B.box(sx0 - (i + 1) * tread, SY, STAIR_Z0, sx0 - i * tread, lerp(SY, rampY(sx1), (i + 1) / nSt), STAIR_Z1, C.block, 2, 6);
  B.box(GAP_X0, SY, STAIR_Z0, sx1, rampY(sx1), STAIR_Z1, C.block, 2, 6);
  // a short slope at the tip for pack animals, from the shelf up to the tongue's top beside the ramp's foot
  { const [xa, xb, zs] = PACK_SLOPE; B.quad([xb, SY, 5], [xb, SY, zs], [xa, K, zs], [xa, K, 5], C.paving, 6); B.tri([xb, SY, zs], [xa, K, zs], [xa, SY, zs], C.block, 2); }
  return { out };
}

// the ramp on its sixteen arches, the door platform
async function buildRamp(B, yieldNow) {
  const C = COL, K = M.PLATFORM_Y, XF = M.RAMP_FOOT_X, XH = M.RAMP_HEAD_X, pitch = M.RAMP_L / M.RAMP_ARCHES, R = 1.6, HW = M.RAMP_W / 2 + 0.5;
  // the side profile (x, y) with the arch openings as holes, extruded across the ramp's width
  const shape = new THREE.Shape(); shape.moveTo(XF, K); shape.lineTo(XH, K); shape.lineTo(XH, K + M.DOOR_SILL); shape.closePath();
  let open = 0;
  for (let i = 0; i < M.RAMP_ARCHES; i++) {
    const xc = XF - (i + 0.5) * pitch, clear = rampY(xc + R) - K - 0.6, h = new THREE.Path();
    // toward the foot the arches shorten: a full round arch on piers, then a low segment, then (two bays) a blind wall
    if (clear < 0.5) continue;
    if (clear >= R + 0.2) { const hs = clear - R; h.moveTo(xc - R, K + 0.05); h.lineTo(xc - R, K + hs); h.absarc(xc, K + hs, R, Math.PI, 0, true); h.lineTo(xc + R, K + 0.05); }
    else { const yc = K + clear - R, a0 = Math.asin((K + 0.05 - yc) / R); h.moveTo(xc + R * Math.cos(a0), K + 0.05); h.absarc(xc, yc, R, a0, Math.PI - a0, false); }
    h.closePath(); shape.holes.push(h); open++;
  }
  await yieldNow();
  const eg = new THREE.ExtrudeGeometry(shape, { depth: HW * 2, bevelEnabled: false, curveSegments: 10 }).toNonIndexed();
  await yieldNow();
  const P = eg.attributes.position, N = eg.attributes.normal, v = (i) => [P.getX(i), P.getY(i), P.getZ(i) - HW];
  for (let i = 0; i < P.count; i += 3) {
    const top = N.getY(i) > 0.5 && N.getX(i) > 0.05, inside = Math.abs(N.getZ(i)) < 0.5 && !top;
    B.tri(v(i), v(i + 1), v(i + 2), inside ? C.block.clone().multiplyScalar(0.55) : top ? C.paving : C.block, top ? 6 : 2);
    if (i % 900 === 897) await yieldNow();
  }
  eg.dispose();
  // parapets 0.9 m high either side, the south one open at the gap where the stair's head joins
  const par = (xa, xb, z0, z1) => {
    const ya = rampY(xa), yb = rampY(xb), h = M.RAMP_PARAPET, r = [(xa + xb) / 2, (ya + yb) / 2 + 0.4, (z0 + z1) / 2];
    B.quad([xa, ya, z0], [xb, yb, z0], [xb, yb + h, z0], [xa, ya + h, z0], C.block, 2, r); B.quad([xa, ya, z1], [xb, yb, z1], [xb, yb + h, z1], [xa, ya + h, z1], C.block, 2, r);
    B.quad([xa, ya + h, z0], [xb, yb + h, z0], [xb, yb + h, z1], [xa, ya + h, z1], C.block, 2, r);
    B.quad([xa, ya, z0], [xa, ya + h, z0], [xa, ya + h, z1], [xa, ya, z1], C.block, 2, r); B.quad([xb, yb, z0], [xb, yb + h, z0], [xb, yb + h, z1], [xb, yb, z1], C.block, 2, r);
  };
  par(XF, XH, -HW, -HW + 0.5); par(XF, GAP_X1, HW - 0.5, HW); par(GAP_X0, XH, HW - 0.5, HW);
  // the door platform before the east face, sill 9 m above the rock platform, with its own low parapet
  const py = K + M.DOOR_SILL;
  const PH = PLATFORM_HALF, PP = PLATFORM_PARAPET;
  B.box(14.4, K, -PH, XH, py, PH, C.block, 2, 6);
  for (const s of [-1, 1]) { B.box(14.6, py, s * PH - (s > 0 ? PP : 0), XH, py + 0.9, s * PH + (s > 0 ? 0 : PP), C.block, 2); B.box(XH - PP, py, s * HW, XH, py + 0.9, s * PH, C.block, 2); }
  return { arches: M.RAMP_ARCHES, open };
}

// THE STAGES' HEADS (round 6; INVENTED mouldings, all plain building forms and none an ornament): each stage ENDS in a
// deep cornice of white dressed stone with a plain parapet over it and the terrace behind:
//   a BED COURSE (a plain band standing a little proud of the wall), a SOFFIT (the flat underside of the overhang,
//   which looks down at the sea and so lies in shade: the line of shadow under the cornice), a CORONA (the plain
//   upright face of the overhanging slab) and a CAP COURSE a little proud of it; the parapet: a plain wall with a
//   COPING (a flat cap stone a little wider than the wall).
// (their measures: CORNICE, beside the shader that reads them)
// a cornice round a ring: ring(d) gives the ring's corners d metres out from the wall's face at the cornice
function buildCornice(B, ring, yTop, [h, bed, stand, out, cap], white) {
  const y0 = yTop - h, y1 = y0 + bed, ref = [0, y0 - 40, 0], up = [0, yTop + 40, 0], mid = [0, y0, 0];
  B.walls(ring(0), y0 - 0.06, ring(stand), y0, white, 9, up); B.walls(ring(stand), y0, ring(stand), y1, white, 9, mid);
  B.walls(ring(stand), y1, ring(out - 0.1), y1 + 0.001, white.clone().multiplyScalar(0.8), 9, up);      // the soffit
  B.walls(ring(out - 0.1), y1, ring(out - 0.1), yTop - cap, white, 9, mid);                              // the corona
  B.walls(ring(out - 0.1), yTop - cap, ring(out), yTop - cap + 0.001, white, 9, up); B.walls(ring(out), yTop - cap, ring(out), yTop, white, 9, mid);
}
// a plain parapet with its coping, on a ring: its outer face d0 out, its inner face d1 out, h high
function buildParapet(B, ring, y, d0, d1, h, color, k) {
  B.walls(ring(d0), y, ring(d0), y + h - 0.16, color, k, [0, y, 0]); B.walls(ring(d1), y, ring(d1), y + h - 0.16, color, k, [0, y, 600]);
  B.walls(ring(d0 + 0.07), y + h - 0.16, ring(d0 + 0.07), y + h, color, 9, [0, y, 0]); B.walls(ring(d1 - 0.07), y + h - 0.16, ring(d1 - 0.07), y + h, color, 9, [0, y, 600]);
  B.walls(ring(d1 - 0.07), y + h, ring(d0 + 0.07), y + h + 0.001, color, 9, [0, y - 40, 0]); B.walls(ring(d1 - 0.07), y + h - 0.16, ring(d0 + 0.07), y + h - 0.159, color, 9, [0, y + 40, 0]);
}
// the three stages, cornices, parapets, pier (plain plaster over limestone; the shader lays the courses). The first
// stage's four walls are laid by buildWindows, which cuts them for the openings.
function buildTower(B) {
  const C = COL, K = M.PLATFORM_Y, h1 = M.S1_TOP / 2, ref = [0, 40, 0], white = C.plaster.clone().multiplyScalar(1.06);
  // the first stage's head: its cornice, the terrace and its parapet 1.2 m high
  const O1 = CORNICE.s1[3];
  buildCornice(B, (d) => sq(h1 + d), Y1, CORNICE.s1, white);
  B.cap(sq(h1 + O1), Y1, C.paving, 6);
  buildParapet(B, (d) => sq(h1 + d), Y1, O1 - 0.15, O1 - PARAPET_IN[0], M.PARAPET_H, C.plaster, 1);
  // the eight-sided stage: 16.4 m across the flats, a flat toward each wind
  const r2 = (M.S2_FLATS / 2) / Math.cos(Math.PI / 8), o2 = (r) => ngon(8, r, Math.PI / 8), O2 = CORNICE.s2[3], c8 = 1 / Math.cos(Math.PI / 8);
  B.walls(o2(r2), Y1, o2(r2), Y2 - 0.3, C.plaster, 1, ref);
  buildCornice(B, (d) => o2(r2 + d * c8), Y2, CORNICE.s2, white);
  B.cap(o2(r2 + O2 * c8), Y2, C.paving, 6);
  buildParapet(B, (d) => o2(r2 + d * c8), Y2, O2 - 0.12, O2 - PARAPET_IN[1], 1, C.plaster, 1);
  // INVENTED: two belt courses of white dressed stone round the eight-sided stage, at a third and two thirds of its height
  for (const y of [Y1 + M.S2_H / 3, Y1 + 2 * M.S2_H / 3]) {
    const [bh, bo, bw] = BELT2, ro = r2 + bo * c8;
    B.walls(o2(ro), y, o2(ro), y + bh, white, 9, ref); B.walls(o2(ro), y + bh, o2(r2), y + bh + bw, white, 9, [0, y - 30, 0]); B.walls(o2(r2), y, o2(ro), y + 0.001, white.clone().multiplyScalar(0.8), 9, [0, y + 30, 0]);
  }
  // the round stage: 8.7 m across, 8 m high; INVENTED: one belt course at four tenths of its height, and its cornice
  const r3 = M.S3_DIA / 2, n40 = (r) => ngon(40, r), yb = Y2 + M.S3_H * 0.4;
  B.round(0, 0, r3, Y2, r3, Y3 - 0.2, 40, C.plaster, 7);
  B.round(0, 0, r3 + BELT3[1], yb, r3 + BELT3[1], yb + BELT3[0], 40, white, 9); B.walls(n40(r3 + BELT3[1]), yb + BELT3[0], n40(r3), yb + BELT3[0] + BELT3[2], white, 9, [0, yb - 30, 0]); B.walls(n40(r3), yb - 0.001, n40(r3 + BELT3[1]), yb, white.clone().multiplyScalar(0.8), 9, [0, yb + 30, 0]);
  buildCornice(B, (d) => n40(r3 + d), Y3, CORNICE.s3, white);
  B.cap(n40(r3 + CORNICE.s3[3]), Y3, C.soot, 0);
  // the open ring hearth (INVENTED): a low kerb of sooted stone round the fire bed, round the foot of the pier
  B.round(0, 0, 3.75, Y3, 3.75, Y3 + 0.55, 32, C.soot, 0); B.round(0, 0, 3.4, Y3, 3.4, Y3 + 0.55, 32, C.soot, 0);
  B.walls(ngon(32, 3.4), Y3 + 0.55, ngon(32, 3.75), Y3 + 0.551, C.soot, 0, [0, 0, 0]);
  // the plain stone pier, 2.2 m thick and 5 m high, that carries the figure
  const hp = M.PIER_W / 2;
  B.box(-hp, Y3, -hp, hp, Y_PIER - 0.3, hp, C.plaster, 1); B.box(-hp - 0.18, Y_PIER - 0.3, -hp - 0.18, hp + 0.18, Y_PIER, hp + 0.18, C.plaster, 0);
}

// the great door: a pink Aswan granite doorway in the east face, 12.76 m high in all: two posts, each one stone, 11.56 m
// clear, and a lintel of one stone 1.2 m deep; the opening 6 m by 11.56 m; the sill 9 m above the platform.
// INVENTED: the lintel's mouldings (three plain fasciae stepping out toward the top and a cap course).
function buildDoor(B) {
  const C = COL, y0 = DOOR_Y0, y1 = DOOR_Y0 + DOOR_OPEN_H, yT = DOOR_Y0 + M.DOOR_H, hw = M.DOOR_W / 2, jw = M.DOOR_JAMB, xb = 13.9, xf = DOOR_FACE_X;
  for (const s of [-1, 1]) B.box(xb, y0, s > 0 ? hw : -hw - jw, xf, y1, s > 0 ? hw + jw : -hw, C.granite, 4);
  const lz = hw + jw + 0.25, cap = 0.21, fh = (M.DOOR_LINTEL - cap) / 3;
  for (let i = 0; i < 3; i++) B.box(xb, y1 + i * fh, -lz - i * 0.05, xf + 0.05 + i * 0.07, y1 + (i + 1) * fh, lz + i * 0.05, C.granite, 4);
  B.box(xb, yT - cap, -lz - 0.24, xf + 0.36, yT, lz + 0.24, C.granite, 4);
  // the shadow the cap throws on the top fascia, and the lintel's on the heads of the posts
  const sh = C.granite.clone().multiplyScalar(0.42);
  B.quad([xf + 0.2, yT - cap - 0.11, -lz - 0.1], [xf + 0.2, yT - cap - 0.11, lz + 0.1], [xf + 0.2, yT - cap, lz + 0.1], [xf + 0.2, yT - cap, -lz - 0.1], sh, 0, [0, yT, 0]);
  for (const s of [-1, 1]) B.quad([xf + 0.012, y1 - 0.3, s * hw], [xf + 0.012, y1 - 0.3, s * (hw + jw)], [xf + 0.012, y1, s * (hw + jw)], [xf + 0.012, y1, s * hw], sh.clone().lerp(C.granite, 0.35), 0, [0, y1, 0]);
  // the dark of the passage behind the opening
  B.quad([14.95, y0, -hw], [14.95, y0, hw], [14.95, y1, hw], [14.95, y1, -hw], C.dark, 0);
}

// a limb: a round tapered bar between two points (for bronzes, staffs, masts, oars)
export function limb(B, p0, p1, r0, r1, seg, color, k) {
  const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), len = d.length() || 1; d.divideScalar(len);
  const u = new THREE.Vector3(0, 1, 0); if (Math.abs(d.y) > 0.92) u.set(1, 0, 0);
  const a = new THREE.Vector3().crossVectors(d, u).normalize(), b = new THREE.Vector3().crossVectors(d, a);
  const ring = (p, r) => { const o = []; for (let i = 0; i < seg; i++) { const t = (i / seg) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); o.push([p[0] + (a.x * c + b.x * s) * r, p[1] + (a.y * c + b.y * s) * r, p[2] + (a.z * c + b.z * s) * r]); } return o; };
  const A = ring(p0, r0), Bq = ring(p1, r1), mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2];
  for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; B.quad(A[i], A[j], Bq[j], Bq[i], color, k, mid); }
  for (let i = 1; i < seg - 1; i++) { B.tri(Bq[0], Bq[i], Bq[i + 1], color, k, mid); B.tri(A[0], A[i], A[i + 1], color, k, mid); }
}
// a lump: a low-count ball, squashed (heads, shoulders, shells)
export function lump(B, c, rx, ry, rz, color, k, seg = 8, rows = 5) {
  const P = (i, j) => { const th = (j / rows) * Math.PI, ph = (i / seg) * Math.PI * 2; return [c[0] + Math.sin(th) * Math.cos(ph) * rx, c[1] + Math.cos(th) * ry, c[2] + Math.sin(th) * Math.sin(ph) * rz]; };
  for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
    if (j === 0) B.tri(P(i, 0), P(i, 1), P(i + 1, 1), color, k, c); else if (j === rows - 1) B.tri(P(i, j), P(i + 1, j), P(i, rows), color, k, c);
    else B.quad(P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j), color, k, c);
  }
}

// the summit figure: 7 m, dark bronze, standing, a long staff in the raised right hand; named for no god, no face
function buildSummitFigure(B) {
  const c = COL.bronze, y = Y_PIER, k = 5;
  // a long garment to the feet, the weight on one leg
  limb(B, [0, y, 0], [0, y + 2.6, 0.05], 0.78, 0.7, 10, c, k); limb(B, [0, y + 2.6, 0.05], [0, y + 4.3, 0], 0.7, 0.8, 10, c, k);
  limb(B, [0, y + 4.3, 0], [0, y + 5.55, 0], 0.8, 0.98, 10, c, k); lump(B, [0, y + 5.6, 0], 0.62, 0.42, 1.02, c, k);
  limb(B, [0, y + 5.7, 0], [0, y + 6.1, 0], 0.26, 0.24, 8, c, k); lump(B, [0, y + 6.52, 0], 0.42, 0.48, 0.44, c, k);
  // the right arm out and up to the staff, the left at the side with a fold of cloak
  limb(B, [0, y + 5.5, 0.92], [0.5, y + 5.2, 1.75], 0.24, 0.2, 7, c, k); limb(B, [0.5, y + 5.2, 1.75], [0.62, y + 6.0, 2.05], 0.19, 0.16, 7, c, k);
  limb(B, [0.62, y - 0.02, 2.1], [0.62, y + 8.1, 2.1], 0.085, 0.07, 6, c, k);
  limb(B, [0, y + 5.5, -0.92], [0.1, y + 4.2, -1.1], 0.24, 0.2, 7, c, k); limb(B, [0.1, y + 4.2, -1.1], [0.45, y + 3.3, -0.95], 0.2, 0.16, 7, c, k);
  limb(B, [0.05, y + 4.9, -1.0], [0.1, y + 2.2, -1.02], 0.34, 0.22, 6, c, k);
}

// the fire: ONE steady flame, a full ring of it round the pier, 4.4 m high (its tips 0.25 m under the figure's feet), with
// a soft wide halo in the air about it. No beam, no ray, no line.
export const FLAME_H = 4.4;
function buildFire(U) {
  const seg = 28, pos = [], uv = [], idx = [];
  for (const [r, off] of [[2.5, 0], [3.4, 0.41]]) {
    const base = pos.length / 3;
    for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; for (const v of [0, 1]) { pos.push(Math.cos(a) * r * (1 - 0.3 * v), Y3 + 0.35 + v * FLAME_H, Math.sin(a) * r * (1 - 0.3 * v)); uv.push(i / seg + off, v); } }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const flame = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uGain: U.uFireGain }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uGain; varying vec2 vUv;
      float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float v = clamp(vUv.y, 0., 1.);
        vec2 q = vec2(vUv.x * 28., v * 3.2 - uTime * 1.5);
        float f = .6 * n(q) + .3 * n(q * 2.1 + 7.) + .1 * n(q * 4.3);
        // tongues: full at the bed, torn toward the tips; never a flat sheet
        // (separate tongues with dark between them from a third of the way up, so the fire is never one rounded mass)
        // and three or four great licks round the ring that rise and sink slowly, so its outline is ragged from afar)
        float lick = .7 + .3 * n(vec2(vUv.x * 4. + 3., uTime * .35 + floor(vUv.x) * 7.));
        float body = smoothstep(0., .3, f + .84 - v * 1.3) * smoothstep(lick, lick - .3, v) * smoothstep(0., .06, v);
        // a white-orange core low in the bed, an orange body, red tips
        vec3 col = mix(vec3(1., .18, .03), vec3(1., .45, .08), smoothstep(.9, .35, v + .25 * (1. - f)));
        col = mix(col, vec3(1., .75, .35) * 1.3, smoothstep(.36, .0, v + .45 * (1. - f)));
        // the flame covers what is behind it (its own colour, not a wash of white over the plaster)
        gl_FragColor = vec4(col * uGain * 1.5, clamp(body, 0., 1.) * .9);
      }`,
  }));
  flame.name = 'fire'; flame.renderOrder = 6; flame.frustumCulled = false;
  // its glow: soft light round the flame, never a solid shape: one wide faint disc and one small warm one, each turned
  // about the fire's own place to face the eye, so that from afar the fire is a single steady point from every side.
  // (p1) It is light ADDED to what stands behind it and in it (its gain HEARTH_GLOW by the hour): it covers nothing, and what stands in it, the
  // hearth's ring, the pier and the figure, is the paler by it: most at the two sun hours, where by gain x the hour's exposure it is 2.60 and 2.54
  // against the dusk's 2.28 (r6: 1.15, 1.38 and 2.28). What stands nearer the eye than the discs' own face (from below, the figure's foot and near
  // flank) takes none of it.
  const gg = new THREE.PlaneGeometry(1, 1);
  const glow = new THREE.Mesh(gg, new THREE.ShaderMaterial({
    uniforms: { uGain: U.uGlowGain ?? U.uFireGain, uSize: { value: 64 }, uAt: { value: new THREE.Vector3(0, Y3 + 2.3, 0) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`uniform float uSize; uniform vec3 uAt; varying vec2 vUv;
      void main(){ vUv = position.xy * 2.; vec4 mv = viewMatrix * vec4(uAt, 1.); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform float uGain; varying vec2 vUv;
      void main(){ float r = clamp(length(vUv), 0., 1.); float a = 1. - r; float wide = a * a * a, warm = smoothstep(.3, 0., r);
        gl_FragColor = vec4(vec3(1., .4, .1) * wide * .3 * uGain + vec3(1., .5, .16) * warm * warm * .26 * uGain, 1.); }`,
  }));
  glow.name = 'fire-glow'; glow.renderOrder = 7; glow.frustumCulled = false;
  return { flame, glow };
}

// ---------------------------------------------------------------- the first stage's surface: windows, the one band, the foot
// a point on one leaning face of the first stage: n = the face's outward direction [nx, nz], s metres along the face,
// y the height, d metres proud of the plaster
const faceHalf = (y) => M.S1_FOOT / 2 - (M.S1_FOOT - M.S1_TOP) / 2 * clamp((y - M.PLATFORM_Y) / (M.S1_H - 0.9), 0, 1);
const facePt = (n, s, y, d) => { const h = faceHalf(y) + d; return [n[0] * h - n[1] * s, y, n[1] * h + n[0] * s]; };
function faceBox(B, n, s0, s1, y0, y1, d0, d1, color, k) {
  const c = facePt(n, (s0 + s1) / 2, (y0 + y1) / 2, (d0 + d1) / 2), P = (s, y, d) => facePt(n, s, y, d);
  B.quad(P(s0, y0, d1), P(s1, y0, d1), P(s1, y1, d1), P(s0, y1, d1), color, k, c);
  B.quad(P(s0, y1, d0), P(s1, y1, d0), P(s1, y1, d1), P(s0, y1, d1), color, k, c); B.quad(P(s0, y0, d0), P(s1, y0, d0), P(s1, y0, d1), P(s0, y0, d1), color, k, c);
  B.quad(P(s0, y0, d0), P(s0, y1, d0), P(s0, y1, d1), P(s0, y0, d1), color, k, c); B.quad(P(s1, y0, d0), P(s1, y1, d0), P(s1, y1, d1), P(s1, y0, d1), color, k, c);
}
const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a strip along one leaning face between two heights, each end at its own depth proud of the plaster; its ends reach
// the corners (or stop at s0, s1 when given)
function faceStrip(B, f, y0, d0, y1, d1, color, k, s0, s1) {
  const a0 = s0 ?? -(faceHalf(y0) + d0), b0 = s1 ?? faceHalf(y0) + d0, a1 = s0 ?? -(faceHalf(y1) + d1), b1 = s1 ?? faceHalf(y1) + d1;
  B.quad(facePt(f, a0, y0, d0), facePt(f, b0, y0, d0), facePt(f, b1, y1, d1), facePt(f, a1, y1, d1), color, k, [0, (y0 + y1) / 2 + (d1 - d0) * 40, 0]);
}
// ROWS OF SMALL WINDOWS (number, size and spacing a GUESS: 0.8 by 1.7 m, five to a face in nine rows, one row to a
// floor, in straight columns that close a little toward the top with the lean; every row the same small
// opening): none where the door and its lintel stand. Each is A REAL OPENING (round 6): the first stage's four walls
// are laid here in pieces round the openings, and each opening has its REVEAL, WINDOW_DEEP into the wall (two jambs,
// a head and a sill of plastered stone that darken inward; (p1) each LIES IN ITS WALL'S SHADE: it takes the sky's fill and
// the bright quarter by no more than the wall's own facing gives, so that in a wall turned from the quarter no jamb stands
// lit) and the dark of the room behind. INVENTED: the plain frame of
// white dressed stone round each (two jambs, a head and a sill that stands proud), the shade under the sill and the
// stain that runs down from it; the reveal's depth.
// lit(): the lamps' own stream, drawn for every window at every hour; lampsOn: at early dusk about one window in
// eight (WINDOW_LIT_SHARE) shows a lamp within, a dim amber (WINDOW_LAMP), and its light lies on the reveal.
// (WINDOW_DEEP and WINDOW_WALL_SHARE: beside the shader that reads them)
function buildWindows(B, lit, lampsOn) {
  const C = COL, K = M.PLATFORM_Y, shade = C.plaster.clone().multiplyScalar(0.46), white = C.plaster.clone().multiplyScalar(1.05), deep = C.plaster.clone().multiplyScalar(0.42), D = WINDOW_DEEP;
  let n = 0, lamps = 0;
  for (const f of FACES) {
    const P = (ss, yy, d) => facePt(f, ss, yy, d), ref = [0, 40, 0];
    // a piece of the wall between two heights and two edges (an edge: metres along the face, or the face's own corner)
    const piece = (y0, y1, a, b) => B.quad(P(a ?? -faceHalf(y0), y0, 0), P(b ?? faceHalf(y0), y0, 0), P(b ?? faceHalf(y1), y1, 0), P(a ?? -faceHalf(y1), y1, 0), C.plaster, 1, ref);
    let yDone = K;
    for (let r = 0; r < WINDOW_ROWS; r++) {
      const y = WINDOW_ROW_Y0 + r * WINDOW_ROW_STEP, w = M.WIN_W / 2, hgt = M.WIN_H, LAMP = WINDOW_LAMP, LAMP_TOP = WINDOW_LAMP.clone().multiplyScalar(WINDOW_ROOM_TOP), cuts = [];
      piece(yDone, y); yDone = y + hgt;
      for (const col of [-2, -1, 0, 1, 2]) {
        const s = col * faceHalf(y) * 0.36, dealt = lit() < WINDOW_LIT_SHARE, lamp = lampsOn && dealt;
        if (f[0] === 1 && Math.abs(s) < 6.4 && y < DOOR_Y0 + M.DOOR_H + 0.9) continue;
        cuts.push(s);
        const y1 = y + hgt, mid = [0, y, 0], kR = lamp ? 12 : 1;
        // the reveal: each of its four faces from the wall's face (pale) inward (dark), and the room behind
        B.quadC(P(s - w, y, 0), P(s - w, y1, 0), P(s - w, y1, -D), P(s - w, y, -D), white, white, deep, deep, kR, P(s - w - 1, y + hgt / 2, -D / 2));
        B.quadC(P(s + w, y, 0), P(s + w, y1, 0), P(s + w, y1, -D), P(s + w, y, -D), white, white, deep, deep, kR, P(s + w + 1, y + hgt / 2, -D / 2));
        B.quadC(P(s - w, y1, 0), P(s + w, y1, 0), P(s + w, y1, -D), P(s - w, y1, -D), white, white, deep, deep, kR, P(s, y1 + 1, -D / 2));
        B.quadC(P(s - w, y, 0), P(s + w, y, 0), P(s + w, y, -D), P(s - w, y, -D), white, white, deep, deep, kR, P(s, y - 1, -D / 2));
        if (lamp) B.quadC(P(s - w, y, -D), P(s + w, y, -D), P(s + w, y1, -D), P(s - w, y1, -D), LAMP, LAMP, LAMP_TOP, LAMP_TOP, 8, mid);
        else B.quad(P(s - w, y, -D), P(s + w, y, -D), P(s + w, y1, -D), P(s - w, y1, -D), C.dark, 11, mid);
        if (lamp) lamps++;
        // the frame: two jambs, a head, a sill
        const FR = WINDOW_FRAME, jw = FR.jamb[0], sw = FR.sill[2], sh = FR.sill[0];
        faceBox(B, f, s - w - jw, s - w, y, y1, 0, FR.jamb[1], white, 9); faceBox(B, f, s + w, s + w + jw, y, y1, 0, FR.jamb[1], white, 9);
        faceBox(B, f, s - w - FR.head[2], s + w + FR.head[2], y1, y1 + FR.head[0], 0, FR.head[1], white, 9);
        faceBox(B, f, s - w - sw, s + w + sw, y - sh, y, 0, FR.sill[1], white, 9);
        // the shade under the sill and the stain that runs down from it
        B.quad(P(s - w - sw, y - sh - 0.3, 0.012), P(s + w + sw, y - sh - 0.3, 0.012), P(s + w + sw, y - sh, 0.012), P(s - w - sw, y - sh, 0.012), shade, 0, mid);
        B.quad(P(s - w - 0.3, y - sh - 0.3, 0.01), P(s + w + 0.3, y - sh - 0.3, 0.01), P(s + w * 0.4, y - 3.4, 0.01), P(s - w * 0.6, y - 2.9, 0.01), shade.clone().lerp(C.plaster, 0.55), 0, mid);
        n++;
      }
      // the wall of this floor, between the openings
      let from; for (const s of cuts) { piece(y, y + hgt, from, s - w); from = s + w; }
      piece(y, y + hgt, from, undefined);
    }
    piece(yDone, Y1 - 0.9);
  }
  return { n, lamps };
}
// INVENTED: the BELT COURSES of the first stage, a string course of white dressed stone BELT_H (0.55 m) high standing
// BELT_OUT (0.32 m) proud, with a weathering of 0.14 m over it and a flat soffit under it, at
// every floor (1 m under each row of windows); on the east face the belts the door cuts stop at its posts, and the
// one just over the lintel runs on unbroken as a relieving course.
function buildBelts(B) {
  const white = COL.plaster.clone().multiplyScalar(1.06), soffit = white.clone().multiplyScalar(0.8), cut = M.DOOR_W / 2 + M.DOOR_JAMB + 0.3;
  let n = 0;
  for (const f of FACES) for (let i = 1; i < WINDOW_ROWS; i++) {
    const y = WINDOW_ROW_Y0 - BELT_UNDER + i * WINDOW_ROW_STEP;
    const door = f[0] === 1 && y < DOOR_Y0 + M.DOOR_H && y + BELT_H > DOOR_Y0;
    for (const [s0, s1] of door ? [[undefined, -cut], [cut, undefined]] : [[undefined, undefined]]) {
      faceStrip(B, f, y, BELT_OUT, y + BELT_H, BELT_OUT, white, 9, s0, s1); faceStrip(B, f, y + BELT_H, BELT_OUT, y + BELT_H + BELT_WEATHER, 0, white, 9, s0, s1); faceStrip(B, f, y, 0, y + 0.001, BELT_OUT, soffit, 9, s0, s1); n++;
    }
  }
  return n;
}
// INVENTED: narrow upright lights in the eight-sided stage (0.5 by 1.6 m), one to each flat in each third of its height,
// each with a plain sill; a lamp shows in about one in eight at early dusk (the same stream, drawn at every hour)
function buildSlits(B, lit, lampsOn) {
  const C = COL, d = M.S2_FLATS / 2, white = C.plaster.clone().multiplyScalar(1.05), shade = C.plaster.clone().multiplyScalar(0.46);
  let n = 0, lamps = 0;
  for (let i = 0; i < 8; i++) for (let lv = 0; lv < 3; lv++) {
    const a = i * Math.PI / 4, nx = Math.cos(a), nz = Math.sin(a), y = Y1 + (lv + 0.5) * M.S2_H / 3 - 0.3, lamp = lit() < WINDOW_LIT_SHARE && lampsOn, LAMP = WINDOW_LAMP, LAMP_TOP = WINDOW_LAMP.clone().multiplyScalar(WINDOW_ROOM_TOP);
    const P = (s, yy, o) => [nx * (d + o) - nz * s, yy, nz * (d + o) + nx * s], ref = [0, y, 0];
    if (lamp) B.quadC(P(-0.25, y, 0.02), P(0.25, y, 0.02), P(0.25, y + 1.6, 0.02), P(-0.25, y + 1.6, 0.02), LAMP, LAMP, LAMP_TOP, LAMP_TOP, 8, ref);
    else B.quad(P(-0.25, y, 0.02), P(0.25, y, 0.02), P(0.25, y + 1.6, 0.02), P(-0.25, y + 1.6, 0.02), C.dark, 0, ref);
    B.quad(P(-0.45, y - 0.2, 0.14), P(0.45, y - 0.2, 0.14), P(0.45, y, 0.14), P(-0.45, y, 0.14), white, 9, ref); B.quad(P(-0.45, y, 0.14), P(0.45, y, 0.14), P(0.45, y, 0), P(-0.45, y, 0), white, 9, [0, y - 30, 0]);
    B.quad(P(-0.45, y - 0.4, 0.012), P(0.45, y - 0.4, 0.012), P(0.3, y - 2.6, 0.012), P(-0.2, y - 2.2, 0.012), shade.clone().lerp(C.plaster, 0.5), 0, ref);
    n++; if (lamp) lamps++;
  }
  return { n, lamps };
}
// the harbour lights' furniture: a stone bollard with a shallow bronze bowl on it (the fire itself is makeCressetFlames)
function buildCressets(B) {
  const bowl = new THREE.Color('#5a4630'), R = BOWL_W / 2;
  for (const [x, y, z, h] of CRESSETS) {
    const hp = h - 0.16;
    B.walls(ngon(8, 0.27, 0, x, z), y, ngon(8, 0.22, 0, x, z), y + hp, COL.block, 2, [x, y - 20, z]); B.cap(ngon(8, 0.22, 0, x, z), y + hp, COL.block, 2);
    B.walls(ngon(8, 0.11, 0, x, z), y + hp, ngon(8, R, 0, x, z), y + h + 0.03, bowl, 5, [x, y + h + 3, z]);
    B.cap(ngon(8, R - 0.03, 0, x, z), y + h, COL.soot, 0);
  }
}
// the harbour lights' flames: to each two crossed upright sheets BOWL_W wide and SMALL_FLAME_H high, one small tongue of
// pitch flame: orange with a yellow heart, never white (its own gain, SMALL_FLAME_GAIN)
export function makeCressetFlames(U) {
  const pos = [], uv = [], ph = [], idx = [];
  CRESSETS.forEach(([x, y, z, h], i) => {
    for (const a of [0.4, 0.4 + Math.PI / 2]) {
      const b = pos.length / 3, c = Math.cos(a) * BOWL_W / 2, sn = Math.sin(a) * BOWL_W / 2, y0 = y + h - 0.02;
      pos.push(x - c, y0, z - sn, x + c, y0, z + sn, x + c, y0 + SMALL_FLAME_H, z + sn, x - c, y0 + SMALL_FLAME_H, z - sn); uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      for (let q = 0; q < 4; q++) ph.push(i * 1.618 + 0.37);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1)); g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uGain: { value: SMALL_FLAME_GAIN } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aPh; varying vec2 vUv; varying float vPh; void main(){ vUv = uv; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uGain; varying vec2 vUv; varying float vPh;
      float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float v = clamp(vUv.y, 0., 1.), x = (vUv.x - .5) * 2.;
        // one tongue that leans and tears: wide at the bowl, a point at the tip
        float lean = (n(vec2(vPh * 5. + v * 2.2, uTime * 1.9 + vPh * 11.)) - .5) * 1.1 * v;
        float wd = (1. - v) * (.5 + .3 * n(vec2(vPh * 3., uTime * 1.4 - v * 3.))) + .02;
        float body = (1. - smoothstep(wd * .45, wd, abs(x + lean))) * smoothstep(0., .07, v) * smoothstep(1., .7, v);
        vec3 col = mix(vec3(1., .2, .03), vec3(1., .46, .08), smoothstep(.85, .3, v));
        col = mix(col, vec3(1., .6, .2) * 1.1, smoothstep(.38, 0., v + abs(x + lean) * .8));
        gl_FragColor = vec4(col * uGain, clamp(body, 0., 1.) * .92);
      }`,
  }));
  m.name = 'cresset-fires'; m.renderOrder = 6; m.frustumCulled = false;
  return m;
}
// THE ONE BAND: dark metal shapes 0.5 m high in a row 24 m long, 48 m up the NORTH face (the seaward face that ships
// come in under; the designer's ruling of round 2). They form no letter of any script: each is a leaning four-cornered
// slab, some with a small square beside it. Nothing else in the world is lettered. INVENTED: so that the row reads as
// one band from the sea it lies on a plain course of paler stone 1.3 m high with a thin shadow line under it.
export const BAND_FACE = [0, -1];
function buildBand(B) {
  const br = makeRng(hashSeed('pharos-band')), y0 = M.PLATFORM_Y + M.BAND_UP, hgt = M.BAND_SHAPE_H, f = BAND_FACE, C = COL.bronze.clone().multiplyScalar(0.5);
  faceBox(B, f, -M.BAND_L / 2 - 0.6, M.BAND_L / 2 + 0.6, y0 - 0.4, y0 + 0.9, 0, 0.06, COL.plaster.clone().multiplyScalar(1.07), 0);
  faceBox(B, f, -M.BAND_L / 2 - 0.7, M.BAND_L / 2 + 0.7, y0 - 0.52, y0 - 0.4, 0, 0.12, COL.plaster.clone().multiplyScalar(0.8), 0);
  let s = -M.BAND_L / 2, n = 0;
  while (s < M.BAND_L / 2 - 0.3) {
    const wd = br.range(0.24, 0.42), lean = br.range(-0.12, 0.12), cut = br.range(0.04, 0.16), top = br.range(0.0, 0.1), d = 0.1;
    const a = facePt(f, s + Math.max(lean, 0), y0, d), b = facePt(f, s + wd, y0 + (lean > 0 ? 0 : cut), d), c = facePt(f, s + wd - Math.max(lean, 0) * 0.5, y0 + hgt - top, d), e = facePt(f, s + Math.max(-lean, 0), y0 + hgt - (lean > 0 ? cut : 0), d);
    B.quad(a, b, c, e, C, 0, [0, y0, 0]);
    s += wd + 0.1;
    if (br.chance(0.3)) { const q = br.range(0.1, 0.16), yq = y0 + br.range(0.05, hgt - q - 0.05); B.quad(facePt(f, s, yq, d), facePt(f, s + q, yq, d), facePt(f, s + q, yq + q, d), facePt(f, s, yq + q, d), C, 0, [0, y0, 0]); s += q + 0.1; }
    s += br.chance(0.14) ? 0.34 : 0.06; n++;
  }
  return n;
}
// INVENTED: the PLINTH, five courses of large stones from the platform up to the first floor's belt (5.6 m), standing
// 0.45 m proud at the foot and 0.3 m at the top, with a weathered slope and a cap course that is the first belt
function buildFoot(B) {
  const y0 = M.PLATFORM_Y, y1 = WINDOW_ROW_Y0 - BELT_UNDER, white = COL.plaster.clone().multiplyScalar(1.06), stone = COL.plaster.clone().multiplyScalar(0.95);
  for (const f of FACES) {
    faceStrip(B, f, y0, 0.45, y1, 0.3, stone, 10);
    const cap = 0.3 + BELT_OUT;   // (p1) the cap course stands the belt's own stand beyond the plinth's top
    faceStrip(B, f, y1 - 0.001, 0.3, y1, cap, white.clone().multiplyScalar(0.8), 9); faceStrip(B, f, y1, cap, y1 + BELT_H, cap, white, 9); faceStrip(B, f, y1 + BELT_H, cap, y1 + BELT_H + 0.45, 0, white, 9);
  }
}

// the four corner figures: dark bronze, 5 m (M.CORNER_FIG_H), fish-tailed, a shell horn raised; each on a plinth at a corner of the
// first terrace, looking out along the corner. They neither move nor sound. No face.
function buildCornerFigure(B, cx, cz, yaw) {
  const c = COL.bronze, k = 5, y0 = Y1 + 1.5, cs = Math.cos(yaw), sn = Math.sin(yaw);
  const sc = M.CORNER_FIG_H / 4, T = (p) => [cx + (p[0] * cs - p[2] * sn) * sc, y0 + p[1] * sc, cz + (p[0] * sn + p[2] * cs) * sc];
  const L = (a, b, r0, r1, seg = 7) => limb(B, T(a), T(b), r0, r1, seg, c, k);
  // the tail: a coil lying on the plinth, its fluke lifted behind
  const tail = [[-1.25, 1.45, 0.3], [-1.45, 0.75, 0.25], [-1.0, 0.26, -0.3], [-0.25, 0.3, -0.5], [0.4, 0.42, -0.05], [0.25, 1.0, 0.15]], tr = [0.1, 0.17, 0.26, 0.33, 0.4, 0.44];
  for (let i = 0; i < tail.length - 1; i++) L(tail[i], tail[i + 1], tr[i], tr[i + 1]);
  B.tri(T([-1.25, 1.45, 0.3]), T([-1.75, 1.95, 0.75]), T([-1.2, 2.05, 0.4]), c, k); B.tri(T([-1.25, 1.45, 0.3]), T([-1.6, 1.9, -0.25]), T([-1.2, 2.05, 0.4]), c, k);
  // the body upright from the coil, shoulders, neck, head
  L([0.25, 1.0, 0.15], [0.3, 2.3, 0.08], 0.44, 0.5, 9);
  const sh = T([0.3, 2.42, 0.08]); lump(B, sh, 0.62, 0.27, 0.62, c, k);
  L([0.32, 2.5, 0.08], [0.36, 2.85, 0.08], 0.17, 0.16); const hd = T([0.38, 3.08, 0.08]); lump(B, hd, 0.29, 0.33, 0.29, c, k);
  // the right arm lifts the shell horn to the head; the left hangs
  L([0.3, 2.45, 0.58], [0.78, 2.5, 0.78], 0.16, 0.14); L([0.78, 2.5, 0.78], [0.9, 3.05, 0.42], 0.14, 0.12);
  L([0.6, 3.02, 0.2], [1.05, 3.3, 0.36], 0.07, 0.15); L([1.05, 3.3, 0.36], [1.5, 3.68, 0.5], 0.15, 0.33, 8);
  L([0.3, 2.45, -0.45], [0.56, 1.72, -0.62], 0.16, 0.14); L([0.56, 1.72, -0.62], [0.52, 1.18, -0.3], 0.14, 0.12);
}
function buildCornerFigures(B) {
  const q = M.S1_TOP / 2 + CORNICE.s1[3] - PARAPET_IN[0] - 1.05;   // each plinth stands in the terrace's corner, against the parapet
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    B.box(sx * q - 1.0, Y1, sz * q - 1.0, sx * q + 1.0, Y1 + 1.5, sz * q + 1.0, COL.plaster, 1);
    B.box(sx * q - 1.12, Y1 + 1.36, sz * q - 1.12, sx * q + 1.12, Y1 + 1.5, sz * q + 1.12, COL.plaster, 0);
    buildCornerFigure(B, sx * q, sz * q, Math.atan2(sz, sx));
  }
}

// THE SMOKE (r6): NO COLUMN AND NO LINE. Over the hearth hangs a soft low haze: wide soft puffs, many at once and each
// wider than the step between two of them, born at the fire, drifting up and south on the north wind, growing and
// thinning to nothing: at early dusk within about 40 m (SMOKE: 13 m up, 40 m down the wind), at the two sun hours within
// about 28 m (SMOKE_BY_HOUR, below: 20 m up and 20 m down the wind). It glows with the fire under it where it is young; further off
// it takes the sky's light and the bright quarter's on that side; fainter by the hour as the sky behind it darkens
// (SMOKE_OPACITY: low sun, sunset, early dusk). Each puff turns to face the eye about its own place (a medium). It
// goes by the world clock: a puff that has thinned to nothing is the next born; where each puff is in its life at
// clock 0, its side-slip and its turn come from the smoke's own stream (rng), one puff to each equal share of the
// period, so the haze is even at every clock.
//   rise, lean: how far up and how far south it goes; size0, size1: a puff's half-width at its birth and end;
//   puffs: how many; period: seconds from birth to end; alpha: a puff's strength at its fullest
export const SMOKE = { rise: 13, lean: 40, size0: 2.6, size1: 9.5, puffs: 36, period: 18, alpha: 0.2 };
export const SMOKE_OPACITY = [1, 0.8, 0.5];
// (p1) THE HEARTH'S SMOKE BY THE HOUR (INVENTED BY NEED: every figure of the two sun rows). With the sun up a great wood fire has its smoke: A SOFT
// GREY HAZE OVER THE FIRE, which rises some 20 m as it drifts south on the north wind and has thinned to nothing within about 28 m. NO COLUMN, NO
// LINE AND NO STREAK (the head above stands): wide soft puffs, each much wider than the step to the next (3.2 to 13 m in half width: the haze is as
// wide as it is long), faint (alpha, a puff's strength at its fullest: .2 and .18; drawn with the hour's SMOKE_OPACITY, 1 and .8: .2 and .144), a
// grey between r6's pale haze and the day's sky (tone: the smoke's own grey, as a share of r6's; it takes the fire's light by the same share), and
// a little slower to thin than at dusk (thin: r6's 1.7 where not given). At the sun hours the smoke has 40 puffs where dusk has 36: the four more
// draw at the end of the smoke's own stream, and a puff's place in its life differs from r6's there. At early dusk: r6's low haze, figure for figure.
export const SMOKE_BY_HOUR = [
  { rise: 20, lean: 20, size0: 3.2, size1: 13, puffs: 40, period: 20, alpha: 0.2, tone: 0.62, thin: 1.4 },
  { rise: 19, lean: 21, size0: 3.4, size1: 13.6, puffs: 40, period: 20, alpha: 0.18, tone: 0.66, thin: 1.4 },
  SMOKE,
];
// (the town's hearths use the same law with measures of their own: S gives its measures, base its foot, root the fire's light
// on it, spread how far its puffs wander, opacity its strength)
export function makeSmoke(U, S, base, root, spread, opacity, rng) {
  const N = S.puffs, pos = [], uv = [], dat = [], idx = [];
  for (let i = 0; i < N; i++) {
    const ph = (i + rng()) / N, side = rng() * 2 - 1, k = rng(), b = pos.length / 3;
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(0, 0, 0); uv.push(u, v); dat.push(ph, side, k); }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(dat, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(base[0], base[1] + S.rise * 0.5, base[2] + S.lean * 0.5), S.rise + S.lean);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uSkyCol: U.uSkyCol, uGndCol: U.uGndCol, uGlowCol: U.uGlowCol, uGlowDir: U.uGlowDir, uSunCol: U.uSunCol, uFireCol: U.uFireCol,
      uShape: { value: new THREE.Vector4(S.rise, S.lean, S.size0, S.size1) }, uBase: { value: new THREE.Vector3(base[0], base[1], base[2]) }, uPeriod: { value: S.period },
      uRoot: { value: new THREE.Vector4(root, spread, S.alpha, opacity) }, uTone: { value: new THREE.Vector2(S.tone ?? 1, S.thin ?? 1.7) } },
    transparent: true, depthWrite: false, fog: true,
    vertexShader: /* glsl */`attribute vec3 aD; uniform float uTime, uPeriod; uniform vec4 uShape, uRoot; uniform vec3 uBase, uGlowDir; varying vec2 vUv, vLd; varying vec3 vP;
      #include <fog_pars_vertex>
      void main(){ vUv = uv;
        float h = fract(aD.x + uTime / uPeriod), sl = aD.y;
        // quick at the root, slower as it spreads; it leans more and more to the south, and wanders a little as it goes
        vec3 c = uBase + vec3(uRoot.y * (sl * (1.1 + 10. * h) + 5. * h * sin(h * 7. + aD.z * 6.28)), uShape.x * pow(h, .8) + uRoot.y * sl * 3. * h, uShape.y * pow(h, 1.2) + uRoot.y * 6. * h * cos(aD.z * 6.28 + h * 3.));
        float size = mix(uShape.z, uShape.w, pow(h, .75)) * (.8 + .4 * aD.z);
        vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += uv * size;
        vLd = normalize((viewMatrix * vec4(uGlowDir, 0.)).xy + vec2(1e-4, 0.)); vP = vec3(h, aD.z, sl);
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`uniform float uTime; uniform vec2 uTone; uniform vec3 uSkyCol, uGndCol, uGlowCol, uSunCol, uFireCol; uniform vec4 uRoot; varying vec2 vUv, vLd; varying vec3 vP;
      #include <fog_pars_fragment>
      float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
      void main(){
        float r = length(vUv); if (r > 1.) discard;
        float hh = clamp(vP.x, 0., 1.);
        // a soft ball with no edge (it thins to nothing at its rim), eaten a little by its own curl
        vec2 q = vUv * 1.6 + vP.y * 17. + vec2(0., -uTime * .05);
        float f = .55 * n(q) + .3 * n(q * 2.3 + 4.) + .15 * n(q * 4.9 + 9.);
        float ball = smoothstep(1., 0., r + (f - .5) * .5); ball *= ball;
        // it comes on at its birth and thins to nothing at its end
        float a = ball * smoothstep(0., .05, hh) * uRoot.z * pow(max(1. - hh, 0.), uTone.y) * uRoot.w;
        // light: the sky from above, the ground and sea from below, the bright quarter on the side that faces it
        float up = clamp(vUv.y * .5 + .5, 0., 1.), tw = clamp(dot(vUv, vLd) * .5 + .5, 0., 1.);
        vec3 lit = mix(uGndCol, uSkyCol, up) * 1.3 + (uGlowCol * 1.5 + uSunCol * .8) * tw * tw;
        vec3 col = vec3(.6, .57, .56) * uTone.x * lit * (.78 + .36 * f);
        // where it is young it glows with the fire under it
        col += uTone.x * uRoot.x * uFireCol * vec3(.6, .32, .13) * smoothstep(.45, 0., hh) * (.5 + .5 * f) * (1. - .4 * up);
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'smoke'; mesh.renderOrder = 5; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the landing's furniture (all INVENTED by the builder)
// firewood stacked by the tongue's north edge (four stacks; none stands on the door platform, the ramp or the
// tower: nothing invented is set on the monument as a thing of it); three awnings on poles (two on the tongue's
// north side, one on its south side west of the stair).
// (r6c) OWNED: the stacks' and the awnings' places are round one's figures, the builder's, neither dealt nor derived.
// Their reason is the landing's: the hearth's firewood is set down along the tongue's north edge, where a boat can
// lie under the wall and the ramp's foot and the walks stay free; the awnings shade those who wait beside the
// ramp's wall. They are kept where they are, so that nobody who stands or walks by them is moved.
// [x, z, length along x, depth along z]
export const AWNINGS = [[57.5, -9.9, 4.2, 3.0], [71, -9.9, 4.2, 3.0], [46, 9.6, 4.0, 3.0]];
export const AWNING_Y = M.PLATFORM_Y + 2.45;
function buildStacks(B) {
  const C = COL, K = M.PLATFORM_Y, log = C.wood, ends = C.wood.clone().multiplyScalar(1.5);
  // a stack: logs 1.5 m long laid across, rows of them, a little uneven
  const stack = (x0, z0, alongX, rows, wide, y) => {
    for (let r = 0; r < rows; r++) for (let i = 0; i < wide - (r % 2); i++) {
      const o = 0.14 + i * 0.27 + (r % 2) * 0.135, yy = y + 0.13 + r * 0.235, c = (i + r) % 3 === 0 ? ends : log;
      if (alongX) limb(B, [x0, yy, z0 + o], [x0 + 1.5, yy, z0 + o + 0.03], 0.13, 0.12, 5, c, 0); else limb(B, [x0 + o, yy, z0], [x0 + o + 0.03, yy, z0 + 1.5], 0.13, 0.12, 5, c, 0);
    }
  };
  for (const [x0, z0, rows, wide] of STACKS) stack(x0, z0, true, rows, wide, K);
  // the awnings' poles
  for (const [x, z, l, d] of AWNINGS) for (const sx of [-1, 1]) for (const sz of [-1, 1]) limb(B, [x + sx * l / 2, footingY(x, z), z + sz * d / 2], [x + sx * l / 2, AWNING_Y + 0.05, z + sz * d / 2], 0.05, 0.04, 5, log, 0);
}
// the cloth: awnings sagging between their poles and stirring; by the world clock
function buildCloth(U) {
  const pos = [], nor = [], col = [], fre = [], idx = [], cols = ['#c9bda2', '#a6593f', '#b89a5e', '#d6ccb4', '#8c6a4c'].map((h) => new THREE.Color(h));
  AWNINGS.forEach(([x, z, l, d], a) => {
    const NX = 6, NZ = 5, base = pos.length / 3, c = cols[a % 3];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const u = i / NX, v = j / NZ; pos.push(x + (u - 0.5) * l, AWNING_Y, z + (v - 0.5) * d); nor.push(0, 1, 0); col.push(c.r, c.g, c.b); fre.push(Math.max(4 * u * (1 - u), 4 * v * (1 - v)), 0); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const q = base + j * (NX + 1) + i; idx.push(q, q + 1, q + NX + 1, q + 1, q + NX + 2, q + NX + 1); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(fre, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec3 aC; attribute vec2 aF; uniform float uTime; varying vec3 vW, vN, vC;
      #include <fog_pars_vertex>
      void main(){ vec3 p = position; float f = aF.x, w = sin(uTime * 2.1 + p.x * 2.3 + p.z * 1.1), w2 = sin(uTime * 3.3 + p.x * 1.1 - p.z * 2.7);
        p.y += -.22 * f + f * (.06 * w + .035 * w2);
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = normal; vC = aC * (1. - .12 * f * w);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`varying vec3 vW, vN, vC;
      ${LIT_PARS}
      #include <fog_pars_fragment>
      void main(){ vec3 n = normalize(vN + vec3(0., 1e-6, 0.)); gl_FragColor = vec4(phLight(vC, n, vW, 1.) * .7 + phLight(vC, -n, vW, 1.) * .45, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'cloth'; mesh.frustumCulled = false;
  return mesh;
}

export async function buildHero(ctx, opts = {}) {
  const U = makeLightUniforms(opts.light);
  U.uTime = { value: 0 }; U.uFireGain = { value: opts.fireGain ?? HEARTH_GAIN[1] }; U.uGlowGain = { value: opts.hour != null ? HEARTH_GLOW[opts.hour] : U.uFireGain.value };
  const object = new THREE.Group(); object.name = 'pharos';
  const mat = makeLitMaterial(U);
  const Bg = makeBuilder(); buildGround(Bg, ctx.noise); await ctx.yield();
  const ramp = await buildRamp(Bg, ctx.yield); await ctx.yield(); buildStacks(Bg); await ctx.yield();
  const ground = new THREE.Mesh(await Bg.geometryInSteps(ctx.yield), mat); ground.name = 'rock-tongue-ramp'; object.add(ground); await ctx.yield();
  const Bt = makeBuilder(); buildTower(Bt); await ctx.yield(); buildDoor(Bt); buildSummitFigure(Bt); await ctx.yield();
  const lampRng = makeRng(hashSeed('pharos-window-lamps:' + ctx.seed));
  const win = buildWindows(Bt, lampRng, !!opts.lamps), windows = win.n; await ctx.yield();
  const belts = buildBelts(Bt); const slit = buildSlits(Bt, lampRng, !!opts.lamps); buildCressets(Bt); await ctx.yield();
  const bandShapes = buildBand(Bt); await ctx.yield(); buildFoot(Bt); await ctx.yield(); buildCornerFigures(Bt); await ctx.yield();
  const tower = new THREE.Mesh(await Bt.geometryInSteps(ctx.yield), mat); tower.name = 'tower'; object.add(tower); await ctx.yield();
  const fire = buildFire(U), smoke = makeSmoke(U, opts.hour != null ? SMOKE_BY_HOUR[opts.hour] : SMOKE, [0, Y3 + 2.4, 0], 1, 0.55, opts.smokeOpacity ?? 1, makeRng(hashSeed('pharos-smoke:' + ctx.seed))); object.add(smoke, fire.flame, fire.glow, buildCloth(U));
  // the small fires burn at the afterglow only (their posts, bowls and poles stand at every hour); their light is a
  // term of the lit law
  CRESSETS.forEach(([x, y, z, h], i) => U.uCresset.value[i].set(x, y + h + CRESSET_FLAME_UP, z));
  U.uCressetGain.value = opts.lamps ? SMALL_FIRE_LIGHT : 0;
  if (opts.lamps) object.add(makeCressetFlames(U));
  const fireBase = (opts.light.fireCol || new THREE.Color(1, 0.5, 0.2)).clone();
  return {
    object, radius: 110, height: Y_HEAD - 0, center: new THREE.Vector3(0, 55, 0), uniforms: U, material: mat, ramp, windows, windowLamps: win.lamps + slit.lamps, slits: slit.n, belts, bandShapes,
    anchors: { door: new THREE.Vector3(15.5, DOOR_YC, 0), fire: new THREE.Vector3(0, Y3 + 1.9, 0), head: new THREE.Vector3(0, Y_HEAD, 0) },
    update(dt, time) {
      U.uTime.value = time;
      // one steady flame: it breathes a few per cent, never flashes
      const breath = 1 + 0.025 * Math.sin(time * 0.9) + 0.015 * Math.sin(time * 2.3 + 1.1);
      U.uFireCol.value.copy(fireBase).multiplyScalar(breath);
    },
    ground: false,
  };
}
