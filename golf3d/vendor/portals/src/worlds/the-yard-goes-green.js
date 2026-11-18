// THE YARD GOES GREEN: a railway signal yard at night in rain, drawn as light on black. The world file: the yard,
// the route and the plan of twelve, built round the part's LAMP TOWER with the part's makers.
//
// THE WORLD'S ANSWER TO THE VISITOR (the one thing here that goes by the metres flown): uFlown = u * the route's
// length (1,250 m), from the route's u alone, set in update(). EVERY lamp of the yard, bridge, tower, board, cutting
// and rim carries ONE number, turnAt, worked out at the build from its own place by the part's yardTurnAt() (the
// brief's one formula, the same text for all: lampAt() below calls it for every lamp and pane; tintAt() calls it for
// the place of a wet thing a lamp tints; a wet thing UNDER THE DECK of the covered way (from s 1138) takes the number
// of the rim's pane that stands nearest its own place: rimNear; the cutting's two roads, which run to the rim and
// hold its image on their crowns as two hairlines, take the number of the pane nearest their end), and its state is
// the part's yardLamp(uFlown - turnAt). What follows a lamp's state uses the same number: semaphore arms and spectacles
// (ARM_MOVE), the tint on wet steel, rail crowns, streaks, steam and rain. With the eye still no lamp changes colour.
// NOTHING ELSE goes by u or by the metres: the train, the express, steam, rain, drips and flicker go by the world's
// clock (the time argument of update) at fixed places.
// THE LAST LAMP: the rim's twelve panes are worked out first, and the build stands no lamp where turnAt would come
// later than the rim's first pane (or LAST_TURN, 985 since order 2, if that is sooner); the hood's rim, last by its place under
// the same formula, turns at about 1,115 to 1,137. Its faltering is the part's eased flicker on the clock.
// THE WAY OUT AND ITS DOUBLE (the owner's section 177): this world sets neither portal.drawWithin nor portal.drawIn
// (the portal below: our own hood stands in the ring's place; the engine's frame, glow and halo are off). The rim
// has NO second ring in the floor: its double in the cutting's water is the long broken smear of each pane's own
// light and colour (the panes' streaks in the cutting's mirror, cut by the drum's black double) and shows no picture
// of what stands inside the hood. That double and every light of the rim (its six pools, lane, floor streaks, runs,
// the hairlines on the two rails, the faces it lights) stand at every metre by place and take their pane's one
// number like the pane itself; none comes on or goes by the metres still to fly.
// THE HASH: one salt for the whole world, YARD_SALT = 17 below (29 until order 1's PASS C, whose new heights of the
// route moved the rim's places by some centimetres into other cells). Why 17: under it the 5 m cell of the last post's
// lamp and the cells of all twelve panes of the rim hash above 1/50 + 1/30, so none of them stands green at the
// arrival and none doubts; the build checks this on every load and fails by name if a later change of place
// breaks it (YARD SALT FAILS). It is one number for every lamp; no line is written for the rim or the post.
//
// USES OF THE EYE in this file (the part names its own), each lawful under the brief's list and no other:
//  (1) none here (the lens's beam and glints are the part's);
//  (2) a tone by distance alone: yardTone() on rail crowns, far lamps and the express's strip (RAIL_VS, FAR_VS,
//      EXLIGHT_FS). THE RIM'S OWN LIGHT carries none: its panes and their pale edges, the panes' doubles in the
//      floor's water and their six pools at the hood's foot, its lane, floor streaks and runs, its hairlines on
//      the two rails and the faces it lights (rimLit) are as bright from the lip as from under the deck (tone 0
//      to the part's makers: a streak told so takes neither the tone nor the beam's falloff by the direction to
//      the eye; RIM_VS reads no eye; a pool keeps use (1) alone, the side toward the eye). The strokes and bars
//      of the covered way that only take the rim's colour as their tint (the girders' bars, drips) are bars and
//      strokes like any other of the world and carry the world's one tone (the part's use (2): 0.96 of itself
//      at the lip, whole within 60 m);
//  (3) by the pixel's footprint: rail crowns keep 1.5 pixels and dim, sleepers, the rim's ribs and the film's pools
//      go to their mean (fwidth: RAIL_FS, RIM_FS, the film's mask, FLOODPT_FS); a far lamp's fixed quad is given
//      room for its least width by its distance from the eye (FAR_VS), as the part's streaks are;
//  (4) none here (rain strokes are the part's);
//  (5) THE ANSWER by the metres flown (uFlown).
// update() reads no camera: it sets the world's clock and the metres flown; it places, moves, turns, sizes, hides nothing.
//
// ORDER 1, PASS A (the look): steel is cold here too: a rail's crown and sleepers carry no lamp colour (RAIL_FS; the
// aTint a road carries is no longer drawn). A lamp's colour reaches the ground as its POOL (the part's makePools: the
// yard's lamps within 28 m of the flown line, and the cutting's), the water as its long STREAK, the cutting's wet
// piles as SMEARS (makeSmears, smearCut), the air as its lit CONE of rain (lampRain -> the part's addLampRain) and
// the steam (the part's makeSteam). Far lamps keep 0.85 of their strength as points.
//
// THE MIRROR, no render target: one group to each water level (the yard at y 0, the cutting's floor at y -22):
// mirrored bodies with their black faces, the lamp units of the board, the tower and the cutting, and every lamp's
// streak, then that level's wet film (it writes depth),
// then the upright world. Black faces hide: every body is opaque and writes depth, up and down.
//
// ORDER 1, PASS B (ground, water, the cutting, the way out):
//  B1 THE GROUND IS A BLACK BODY: the cutting's mirror, floor film, bodies, lamp faces, pools and rim are queued
//     AFTER the yard's film (CUT.* orders, late()), whose depth hides them: the cutting shows only through its mouth.
//  B2 WATER: the film's mask opens broad sheets on three turned grids of noise (uPud: threshold and mean share by
//     the weather); the far lamps' streaks run to 7 lamp heights as broken glitter (FAR_FS); the floodlight has its
//     own streak, a sheaf of white dashes under its image (FLOODPT_FS); the cutting's floor mirrors 0.86.
//  B3 THE FAR BAND: besides the files, 64 clumps (a black shed, house or stack, a gantry's two tiers of lamps, lamp
//     masts to 70 m), the bodies in the yard's mirror too.
//  B4 THE WAY OUT: one ring. The drum (bHood) stands in the upright world only; the rim has no second ring; each
//     pane's streak in the cutting's mirror is its double (a long broken smear); panes stand 1.1 m apart.
//  B5 THE CUTTING: wall heads run to CUT_LAST (the last metre the one formula allows under LAST_TURN: s 1080 since
//     order 2, so none stands under the deck); piles carry shade lines, smears, beads; the deck's underside takes the wall heads' pools;
//     seven drips to a girder.
//  B6 no strip of the last of the night: deep night on every look (the seeded draw of the hour is kept, unused).
//
// ORDER 1, PASS C (the plan of twelve BY PLACE; nothing is placed, timed, lit or hidden for a still):
//  C1 we arrive 13 m up (the route's height knots, Hk) and come down to the file; the coaling tower stands 27.9 m to
//     port of s 72, astride the fan's outer road, the floodlight between its legs from s 25.
//  C2 the file by the flown line is 19 larger ground signals (1.6 times a dwarf), 4.33 m apart, flown at the height
//     of their glass (1.9 m, s 84-128); the gaze slides up the file with us.
//  C3 the mast wood's arms are half as large again (o.arm 1.5), spectacles 1.8, masts stouter; flown at arm height.
//  C4 the engine FACES us, its front at s 322 on the fifth road (8.25 m to STARBOARD), so the floodlight lies on the
//     flank it turns to us; both six-foots beside it stand clear; the goods train's wet sides stand to port.
//  C5 the twelve-road bridge at s 475: its heads' numbers run 420 to 439, so the front stands in the row at s 415-440.
//  C6 switch lanterns on 2.6 m posts, each over its pool (lantPool; 6 m and set apart since order 2); vents and low steam 40 m or more off the line.
//  C7 the board looks across the leg (25 degrees back from square): from before s 830 its narrow, deep-hooded lamps
//     are over 49 degrees off axis and black (the part's narrow units go wholly dark off their beam), its panels
//     carry no frames or rails, its legs show only under it; one cold outline round the whole. It lights by s 875.
//  C8 3 m over the floor of the open cutting (s 1088), then up close under the girders (5.7 m under the deck, s
//     1150-1196; each girder a flange, stiffeners and drips near the line), then down to the hood's middle.
//  C9 the tower's axis at s 832: the formula's step at m 810 falls 10 m before its first lamp.
//  C10 the looks: the leading signals stand over the fan too; where the goods train stands (trainAt, three places);
//     drizzle is short slow ticks with thick low steam; after the rain no strokes, wide water, thicker steam still;
//     the express's strip is its whole row of lit windows, keeping 2 pixels, doubled in the wet.
//  C11 the report adds bridgeHeads, trainAt, leastGap; a guy is claimed along its sag.
//
// ORDER 2, PASS D (one line each, as the lead asked at D6, then what the pass did):
//  THE ENGINE stands on the STARBOARD road (the fifth, 8.25 m to starboard at s 322-345): the brief said port; the lead accepts it.
//  THE CUTTING'S BODIES ARE QUEUED LATE by the flag pass B set (late(): transparent + forceSinglePass, CUT.* orders): they are still opaque, depth-writing black bodies, only drawn AFTER the yard's film, whose depth then hides everything under yard level except through the cutting's own mouth.
//  THE ONE SALT is 17 (YARD_SALT): under it the last post's lamp and all twelve panes of the rim neither doubt nor stand green early; checkSalt fails by name if a change of place breaks it.
//  D1 THE ONE RED LAMP, by place: LAST_TURN is 985, so no lamp but the rim turns after we reach the cutting's lip; the
//     wall heads stand from the mouth to s 1080 (CUT_LAST, asked of the formula) and the covered way has no lamp but
//     the rim. The report's notGreenButRim counts the lamps of the whole world not yet green at u 0.79 and 0.87.
//  D2 THE COVERED WAY IS LIT BY THE RIM ALONE: past CUT_LAST every wet thing of the cutting takes the rim's number
//     (tintAt -> rimNear: the number of the pane nearest the thing's own place); the rim's image lies in the floor's water as a broad path of twelve long streaks (rimFloor),
//     along both pile walls as runs at each pane's height and under every girder's flange as a hard line (rimRuns,
//     the part's makeRuns), on the two rails as hairlines (RAIL_FS rimK), on floor and deck underside as pools of
//     glints. Each follows its pane's own number: red to 1,115 m flown, dark, then green by 1,137.
//  D3 THE HALO IN RANKS: yardNeighbours bakes each lamp's metres to its nearest neighbour; the part's halo rule uses
//     it (see the part's head); the rim's panes' glow ends half way across the bar between panes (RIM_FS).
//  D4 THE DELTA lies at s 580-690 (DELTA0, DELTA1), its lanterns 14 m apart or more over the whole braid, each with
//     a 6 m pool and a short streak; the drowned line's first posts step clear of its last roads (offRoads). (The
//     route's heights are NOT touched: a change of height moves every later place by centimetres into other cells of
//     the hash and the one salt then fails.)
//  D5 the apron's water is 58 m wide either side of the leg and 112 m round the tower; the board stands at BOARD_AT.
//
// ORDER 3, PASS E (the pictures BY PLACE; where a line above differs, this holds):
//  THE PLAN IS HELD, THE HEIGHTS ARE FREE (makeRoute: Hk0 lays the plan where order 2 laid it, Hk is the height flown):
//     no lamp, pane or post left its cell of the hash; the salt is still 17 and the build still checks it.
//  E1 water in every foreground: we fly lower (7 m at the arrival, 14 m before the tower, 5.5 m along the board, 3.4 m
//     at the lip); the cutting's mouth stands at MOUTH (s 997.5, 12.5 m nearer; PC() places it); a GANTRY of ten heads
//     spans the mouth at s 1046 (green from the lip on: their streaks lie in the lip's water to our feet); the film's
//     rings are no tile (the part's yardRing); the board's double is longer and stronger; flooded four-foots run on
//     to s 604; sheets of water by place round the arrival's post and round the mouth (the film's mask).
//  E2 no two alike: THE CUTTING'S LAST SIGNAL (s 1093, 3.6 m to starboard, its number 984.5 by the formula: the last metre
//     a lamp may stand) is the close green glass of 0.87, the covered way off centre past it; THE SIGNAL CABIN ON
//     STILTS (14 m to port of s 662-674, a rank of eight repeaters inside, lever frame, stair, wet roof) is the subject
//     where the leg begins (its rank turns at about 583 by the formula: it is green when we are close; nothing near
//     us can stand in mid turn under the one formula, which turns a lamp some 0.14 of its metre before we reach it);
//     the mast wood's two nearest lines carry large spectacle glasses.
//  E3 THE ENGINE is a steam locomotive by its parts, on the THIRD road (13.75 m to starboard), front at s 327.
//  E4 THE ARRIVAL: one tall searchlight signal 7 m to port of s 38, red as we arrive, over its own sheet of water; the
//     coaling tower stands whole, 64 m to starboard of s 118. THE STRAY WHITE DOT WAS THE FLOODLIGHT: it now has a body
//     (FLOODPT_FS: a rank of five heads on a head frame and its mast, 2.2 km off, with its streak as before).
//  E5 THE DELTA: 29 lanterns 10.5 m apart with 0.5 m glass; a pool is the part's thinning glints plus POOLRAIL (the
//     roads through it: bright crowns in the lantern's colour, sparkling ballast, dark sleepers), no disc.
//  E6 nothing close before the lens: no rain stroke within 4 m of the flown line (no drip within 2.3 m); the tower's
//     guys go out square to the leg and along it (the part's guyTurn); no pools on the deck's underside; the board
//     has no outline and no foot rail (its legs stand as a rank of posts).
//  E7 the weather by numbers: calm, ringK, rainK, pud (see the build's head); the looks drawn on seeds 7, 21, 8, 3,
//     1, 2 are rain/arms, drizzle/lights, rain/lights, after/arms, drizzle/arms, after/arms.
//  rE: one stream of chance for all that PASS E stands, forked from the dwarf file's finished stream.
//
// ORDER 3, PASS F ("THE MEAN AND THE FILLED PATCH": the designer's second word, items M1 to M8; where a line above
// differs, this holds). No eye is read for any of it but by the footprint, use (3).
//  M1 every reflection is ONE COLUMN in a few long pieces and goes over into its MEAN (a smooth dim band) where a
//     piece is under about 4 pixels or the column under 1.5: the part's STREAK_FS (streaks, smears, runs), FAR_FS
//     (a far row of lamps lays one smooth band under the row), FLOODPT_FS (one white column, no sheaf of dashes).
//  M2 far lines get dimmer by the footprint: rail crowns' floor 0.06, far sleepers at half their mean (RAIL_FS); the
//     part's bodies 0.045; far rain strokes a seventh. No stroke of rain was added.
//  M3 FILLED PATCHES: a pool is the part's filled soft patch (yard, delta, cutting, rim's foot); the ballast in a
//     pool is at its mean (POOLRAIL_FS); THE LIT FACES (LIT_REACH 9 m, RIM_REACH 22 m; the part's yardLightFaces):
//     see the assembly. The switch lanterns shine all round (site.back 1).
//  M4 a lattice leg and a girder are black bodies with their bracing on them (lattice(), truss(): band-less faces).
//  M5 THE TOWER'S AXIS at s 822 (TOWER_S; 10 m sooner), flown 10 m sooner (Hk), the gaze to its middle (36 m up)
//     until it comes abeam: where its middle turns it spans the picture's height.
//  M6 the hood's drum takes no lit face, the rim's foot pool is quiet (0.7), a far run falls to a twentieth: from the
//     lip the rim is one red lamp over one red column.
//  M7 one switch lantern stands by the engine's buffers (s 323.8, 11 m to starboard): pool, streak, lit smokebox.
//
// ORDER 3, PASS G (items G1 to G12; where a line above differs, this holds). No eye is read for any of it but the
// part's use (3) on the mirrored rain's breaks.
//  G1 STEAM, few and soft, each with a source or a lamp: the part's soft pieces; every sheet takes its NEAREST LAMP
//     by place at the assembly (nearestLamp) and shows only within STEAM_REACH of it, by that lamp's state; no
//     floodlight on steam. Low banks (drizzle, after the rain) stand 8 m and more from the flown line, by lamps only.
//  G2 THE LIT RAIN, LONG AND FEW, by the designer's R1 to R6 (the part's head says each): the course's columns
//     (COURSE_RAIN 2,600 of the 8,400 drawn, 3 to 8 m long, to 36 m up, 36 m either side) and each lamp's own (one
//     of five drawn) take their nearest lamp and its number at the assembly; RAIN_REACH (the part's ONE NAMED
//     NUMBER, 60) is the farthest a stroke is lit from its lamp; the rain lies again in both waters' mirror groups.
//     By weather: rain all, drizzle half (not shorter, slower), after the rain none (the tower streams instead).
//  G4 THE BRIDGE'S FRONT OVER A STRETCH, by place: BRIDGE_SKEW 45 degrees, BRIDGE_S 471 (report: bridgeRow).
//  G5 THE CUTTING'S LAST SIGNAL is a bracket signal (S.cutD: the part's 'dwarf' case at twice its size hanging from
//     an 11 m lattice arm off the starboard wall, 4 m to starboard of s 1091, 5.3 m over the floor).
//  G6 the floodlight's streak is one thin column in four long pieces (FLOODPT_FS).
//  G7 black faces: the cabin's braced bays, and a face from every semaphore mast to its ladder.
//  G8 the rim lights the covered way's floor as a LANE 14 m wide (rimLane), by place alone; the wide
//     flood is OUT (the lead's mends: the rim's own light carries no tone by the eye's distance at all: head, use (2)); no rain under the deck.
//  G9 after the rain: a quarter of the rings stay (ringK 0.25), pools carry drip rings and plainer swells (the
//     part's uCalm), low banks drift by every second lamp, the tower streams (drips 12, dripLen 2.6; order 6: no bank, drips 20, dripLen 3).
//  G10 a pool's roads shine as their crowns alone (POOLRAIL_FS): no lit ballast, no tile.
//
// ORDER 4, PASS H (items H1 to H9; where a line above differs, this holds). No eye is read for any of it but the
// part's named uses; the formula, the salt 17 and the halo's rule stand untouched.
//  H1 plates near a lamp carry its graded light BY PLACE: the train's plates lie in 1.6 m strips with their own
//     pivots and take the nearest of 40 standing lamps by the loop as they pass (TRAIN_MOVE: uTL/uTL2 into the
//     part's yardLit hook); RIM_REACH 34; the cutting's wall heads stand 2.2 m out from the piles (aside 12.8).
//  H2 THE BOARD: BOARD_AT [914, 44], parallel to the leg; a black panel in a steel frame on lattice legs, with
//     walkways, rails and a ladder; its lamps are hooded units aimed BOARD_AIM 80 degrees back along the leg with
//     the lens BOARD_BEAM [55, 60] (use (1)): dark from the leg before s 763, whole and full from s 850 to 928
//     (the lead's mend after order 4: aimed at 57 with [32, 37] the near panels went dark as we passed abeam).
//  H3 THE DELTA flown low (route heights 6.6, 8.5, 7.5, 4 at s 474, 540, 600, 650); lanterns down to s 546; the
//     gaze slides 58 m ahead of the eye; far guys go out by the part's cable law.
//  H4 THE ROADS LIE FLAT: roadAside(k, s, 1) gathers the drawn roads from s 642 to 682 into a double line; roadEnd.
//  H5 the coaling tower's hopper is four black walls with bands and hoops, a bracket lamp before each and one under.
//  H6 no rain stroke nearer the leg than NEAR_RAIN 6 m; near ones are short.
//  H7 a pool's roads carry sleepers by the route's metre; POOLRAIL codes 20 (cable trough by the dwarf file,
//     s 54 to 140) and 40 (the drain along the cutting's lip); every pool site has its strips.
//  H8 SHEET PILES: a rib at every joint, walers as plates at WALER_Y, two long runs per waler per rim pane; wall
//     drips are few and long.
//
// ORDER 4, PASS J (items J1 to J5: no two pictures alike, and the upper half; where a line above differs, this
// holds). No eye is read for any of it; the formula, the salt 17 and the halo's rule stand untouched; every cure
// is by place, by the line's height or by the gaze's looks (pois), each over a stretch.
//  J1 THE HOME SIGNAL (HOME): one great semaphore 4.8 m to starboard of s 207.5 and its fellow at s 240; the mast
//     wood is flown 4.3 m up (it was 10) and the gaze goes UP ALONG ITS POST (s 150 to 214). THE BRIDGE'S HEADS are
//     cases 1.8 by 3.6 m (scale 3, 2.6 m over the deck) and the gaze goes into the row's near half (s 370 to 447);
//     the starboard six-foot before the row stands clear (s 412 to 458).
//  J2 THE GAZE GOES ASIDE in the cutting (u 0.838 to 0.896): 32 degrees to starboard and up, to the pile wall 21 m
//     ahead of the eye; the bracket signal crosses that picture; back on the axis by s 1120.
//  J3 SEVEN TALL LAMP MASTS (MASTS): two-stage lattice, a ring of eight lamps on a hoop aimed at a route metre,
//     each lamp by the one formula at its own place; halo by the rule, streak, lit faces, a cone of lit rain.
//  J4 THE VISITS DIFFER: (a) after the rain as before (no stroke, wide still water); (b) DRIZZLE is fine short
//     strokes close to lamps only (DRIZZLE_LEN, DRIZZLE_REACH); (c) the signals that lead stand in the mast wood
//     too and are larger over the fan; (d) by seed (trainLook, from what is left of the first two draws): the goods
//     train's loop to port or to STARBOARD, 45, 28 or 14 wagons, the standing engine's regulator open or shut.
//     NO BLOB WITHOUT A LAMP: the low banks sown by chance are not stood (LOW_FREE); a bank stands at the foot of
//     its own burning lamp no higher than 7.5 m.
//  ghost: a post that would stand where a home signal, a mast or the train's road is, is not stood, its draws kept.
//
// ORDER 5, PASS K (the way's line and the places: items K1 to K4; where a line above differs, this holds). No eye
// is read for any of it: a look (pois) is a point of the yard or a table made at the build from the line and a
// body's place, read by u; the formula, the salt 17, the halo's rule, the way out and its double stand untouched.
//  THE YARD'S PLAN LINE AND THE FLOWN LINE (makeRoute): every body stands where the plan line put it; the flown line
//     is the plan line set over to port by WAY_ASIDE between s 237 and s 390 and nowhere else (the route is 2.9 m
//     longer; the usual stills from 0.43 on stand within 1.7 m of where they stood). near() measures from the flown
//     line (the one formula's metre and metres aside, clear air, the rain's keeping off); nearPlan() from the plan.
//  K1 THE ENGINE IS THE BODY OF ITS STRETCH: ENG_AT (the third road, its buffers at s 310), flown along at 21 m,
//     the eye 3.8 m up from s 280 to s 338; the gaze rests on it from s 218 to s 388 (ENG_LOOK, engGaze: the point
//     that halves the angle it is seen under, led by 4.4 m of way for the eye's lateness) and we linger along it
//     (ENG_SLOW: pace 0.43). Flown on both cameras it stands WHOLE from s 188 to s 365, a quarter of a 16:9
//     picture's width and more over 64 to 70 m of way, a third over 48 m, HALF over 26 to 28 m (s 313 to 339).
//     EIGHTY METRES AT HALF THE WIDTH IS NOT TO BE HAD BY ANY LINE THAT DOES NOT CIRCLE THE ENGINE: a body 27 m
//     long is half a 94 degree picture only from inside the circle of 16 m that hangs on its two ends (see
//     WAY_ASIDE). The six-foots between the line and the engine stand clear from the wood's end to the bridge.
//  K2 NEAR BODIES WHOLE OR BACK: the cutting's bracket signal stands 8 m off the line, its middle 4.2 m over the
//     floor, its head aimed at the line (CUT_SIG), and the look aside there goes level, 40 degrees off the axis;
//     the starboard bridge of s 300 is not stood and the port bridge of s 372 stands back at s 349 over the two
//     outer roads; the wood's clearing runs to its end (HOME_CLEAR 263); the gaze rests at the board's foot while
//     the board is far (board and double whole) and rises to its middle abeam.
//  K3 THE CALM GROUND: from s 200 to the bridge every second post of the far six-foots is not stood (its draws
//     kept). THE WAY GOES UNDER THE ROW: BRIDGE_SKEW 60 degrees: the row of twelve heads lies along the way for
//     105 m and its look slides along it with us until we are under the deck; the front walks it over 87 m.
//
// ORDER 5, PASS L (the light: items L1 to L8; where a line above differs, this holds). No eye is read for any of it
// but the part's use (3), the footprint; the formula, the salt 17, the halo's rule, the way out, its rim and its
// double stand untouched; every new lamp is one more place of the one rule (lampAt).
//  L1/L2/L5 THE ENGINE IS LIT BY THE YARD'S OWN LAMPS: a strict RANK OF FIVE switch lanterns (ENG_LAMPS) down the
//     six-foot along it, each with its pool, its band in the water, its graded patch on the engine's wet plate (the
//     lit face's law, its reach on faces 5.6 m: black between lamps) and its filled streak with an edge down the
//     cab's and the tender's plate (engSmear: the part's smear under its band law). No fire, no lit window.
//  L3 ITS STEAM has an outline (the part's STEAM_FS) and is lit by the lamp nearest its foot, by place, by that
//     lamp's number, as it was: red before the turn, green after. Nothing asks whether a lamp is in the picture.
//  L4 THE HEADLAMP (HEAD_VS/FS, HEAD_REACH 17 m: the one typed number): a lamp body in the floodlight's pale steel:
//     a drum over the smokebox door, its glass a disc with an edge, and a short filled wedge on the rails and
//     sleepers before the buffers. IT IS NO SIGNAL AND STANDS OUTSIDE THE GREEN LAW: no number, no turn, not among
//     the lamps counted; it is no second floodlight (it draws no line and lights no face, rain or steam).
//  L6 BEFORE THE CUTTING: THE APPROACH RANK (APPROACH: two files of seven lanterns from s 921 to s 975, 6.5 m
//     either side, pools and bands). IN THE CAGE: a platelayers' gallery with a hut and a hoist on the port wall
//     (CAGE_HUT, s 1143 to 1163), lit by the rim alone (rimNear, three runs): something to pass. No lamp stands
//     under the deck: the one formula allows none there before the rim.
//  L7 THE RED RAIN is a third fewer in the rain look (RAIN_THIN: every third lit stroke of the yard's level is not
//     stood; the tower's rings' the same), reach and length as they were. THE WATER MIRRORS THE LAMPS, NOT THE RAIN:
//     the yard's water draws no stroke again; every lamp's mirror is the part's BAND, a filled smooth spindle with
//     an edge that goes over into its mean by the footprint (use (3)); a mast's ring of eight lays one band.
//
// ORDER 6, PASS M (the three mends before the freeze; where a line above differs, this holds). No eye is read for
// any of it but the part's uses (1), (2) and (3) in the rank's band; the formula, the salt 17, the halo's rule, the
// way's line, the gaze, the pace, the engine and its five lanterns, the way out and its double stand untouched.
//  M1 THE STEAM HAS A SOURCE ONE CAN SEE: the ONE steam of the world is the engine's plume over its chimney (tall by
//     the open regulator, a wisp by the shut one). No low bank stands on any seed (LOW_BANKS false: none at a lamp's
//     foot, none round the tower), the six ground vents blow nothing, the cylinder cock's low puff is gone. No more
//     is added (no body that makes steam stands whole elsewhere). After the rain the tower streams harder instead.
//  M2 A RANK OF LAMPS MIRRORS AS ONE BAND, THE RANK'S OWN (the part's makeRankBands; RANK_GAP): the lamps of one
//     file (site.rank: the dwarf file, each six-foot's file of the fan, the wood and the side country, the two
//     files of the off-road lights, each bridge's row) that follow each other within RANK_GAP metres are linked,
//     and the water shows ONE filled graded band along the rank with a brighter knot under each lamp, each lamp's
//     share in its own colour by its own number; a linked lamp lays no streak of its own. A lone lamp (the
//     arrival's glass, a home signal, a tall post's upper head, a mast's ring, the last post) keeps its spindle.
//     It goes over into its mean by the footprint, use (3), in the part.
//  M3 NO FRAME NEARLY ALL BLACK BEFORE THE ENGINE: the engine's file of lanterns runs on toward the entry (ENG_LEAD:
//     three more, 14.5 m apart, at s 292.3, 277.8 and 263.3 in the same six-foot), each a lamp under the one green
//     law over its own filled pool with the rails through it and its band in the water; 11 m and more from the line.
//
// ORDER 6, PASS N (the bridge's row ahead, the board, the checks; where a line above differs, this holds). No eye is
// read for it; no body, lamp, line, height or pace moved: ONE look of the gaze changed (pois: a point of the yard
// read by u).
//  N1 THE ROW LARGE AHEAD (ROW_LOOK): the way stays under the row; the look takes the row from s 340, 2 m after the
//     engine's tender is past (131 m before we go under; whole by s 380), and holds it till we are under the deck
//     (it was s 370 to 472.5 at weight 0.6, a plain mix). It is mixed along the angle (arc) at weight 0.92, so the eye
//     comes round from the engine behind us evenly; its point rests 8 m to starboard on the row at the deck's
//     height (higher by 9 m while the row is far: the starboard mast's ring stays in the picture) and slides to the
//     port half over the last 49 m. At the usual fifth ten heads stand in the picture, none cut, the nearest three
//     53, 39 and 30 pixels tall of 360 (the live fifth: 36, 30, 27; the built round's: 43, 31, 24). The report's
//     n.row gives the heads' places. The engine's look (ENG_LOOK) is untouched: the row's look, later in the list,
//     takes the eye from it as its own weight rises.
//
// ORDER 6, PASS P (the last small pass before the freeze; where a line above differs, this holds). No eye is read
// for it; the line, the gaze, the pace, the formula and the salt 17 stand untouched: FIVE lanterns more, by place.
//  P1 A SECOND SHORT FILE OF LANTERNS TO PORT (PORT_LEAD): four of the engine's own lantern, 11 m apart from s 267.5
//     to s 300.5 in the six-foot 16.5 m to port of the plan line (the first that the flown line neither crosses nor
//     comes nearer than 6 m to: the line passes the file 9 to 13 m off), each a lamp under the one green law over its
//     own filled pool with the rails through it; the file is a rank ('port lead') and lies as ONE band in the water
//     (makeRankBands), no lantern of it lays a streak of its own. A signal post of the side country that would stand
//     within 1.2 m of one of them is not stood (its draws kept). A pool lights no rail where none is laid (the ninth
//     road's gap while the goods loop lies to starboard). ENG_LEAD has one more further back (the fourth, s 248.8).
//     THE GOODS TRAIN'S PLATES (TRAIN_MOVE, TRAIN_LAMPS 44, it was 40): while the loop lies to port the file stands
//     1.4 m behind the wagons; a side plate takes the nearest lamp that stands OUT BEYOND IT on its own side of the
//     road, a plate that lies flat the nearest that stands OVER it (black faces hide: the wagon itself hides a lamp
//     from its other side; the lantern behind took the near sides' and the tops' lamps from them and they went black).
//     THE GATE'S NEAR BLACK AT u 0.2 IS NOT CURED BY IT (seed 21 stays over 55 in a hundred): what is left black
//     there is the sky and the ground under the flown line itself, which no pool of a lantern 9 m off reaches.
//  N2 THE BOARD AND ITS DOUBLE: NOTHING CHANGED. No one number of the line makes both whole at s 875 to 878: the
//     board's top stands 30.5 m up and its double's foot 30.5 m under the water, 44.7 m from the eye: 29 degrees up
//     and 39 down in a picture 62 degrees high (from 12 m up: 22 and 44; from 20 m: 13 and 48, wider still off the
//     gaze's axis). It wants the line 16 m further off AND the gaze held at the waterline: two numbers, and the
//     ninth still's place would move by more than the 5 m order 5 allows.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  buildHero, makeYardStyle, makeBodyBuilder, makeBodyMaterial, makeLampUnits, makeStreaks, makeRain, makeWetFilm,
  addDwarfSignal, addBoardPanel, yardTurnAt, yardSite, yardCell, STYLE_GLSL, LAMP_KINDS, ORDER, PALETTE,
  makePools, makeSmears, makeSteam, addLampRain, makeRuns, yardNeighbours, yardLightFaces, RAIN_REACH, STEAM_REACH,
  makeRankBands,
} from '../parts/the-yard-goes-green.js';

// (order 2, D1) LAST_TURN: no lamp but the rim stands where its number would come later than 985 m flown. By place
// alone, under the one build rule that already stood no lamp later than the rim: so when we reach the cutting's lip
// (987 m flown) every lamp of the world has gone green and the rim, far down the cutting, is the ONE RED LAMP.
// (order 2, D4) DELTA0..DELTA1: the route metres over which the roads braid into one (40 m later than order 1).
// (order 2, D5) BOARD_AT: the board's middle, [route metre, metres to port] (20 m sooner and 4 m nearer than order 1).
const ROUTE_LEN = 1250, LAST_TURN = 985, FLOOR_Y = -22, DELTA0 = 580, DELTA1 = 690, BOARD_AT = [914, 44];
// (order 5, L7) RAIN_THIN: the share of the yard's lit strokes (the course's, each lamp's own, the tower's rings')
// that is stood: two thirds of what stood before, by density alone.
const RAIN_THIN = 2 / 3;
// (order 4, H2) THE BOARD stands PARALLEL to the leg, its face 44 m to port of s 884-944 (BOARD_AT its middle), and its
// lamps are AIMED back down the leg, BOARD_AIM degrees off the leg's line (each hooded lamp turned in its panel, as a
// signal lamp is aimed at whoever comes). The lens's own law (the part's beam, use (1)): a board lamp is full within
// BOARD_BEAM[0] degrees of its aim and dark beyond BOARD_BEAM[1]. By their place the lamps are dark from the leg
// before s 763, light column by column from the near end as we come, and from s 850 to 928 EVERY lamp of the grid
// stands at full strength to the last column, the board whole in the picture, half its width and more; its near end
// dims only when it is 135 degrees and more behind us (from s 928; dark from s 936), where the eye has left it.
// (Reckoned: a lamp m metres along at 44 m aside stands at atan(44 / (m - s)) off the leg; full between 25 and 135
// degrees, dark under 20 and over 140. The lead's mend after order 4: it was 57 with [32, 37], full to 89 degrees
// only, so the near panels stood dark while the board still filled the picture.)
const BOARD_AIM = 80, BOARD_BEAM = [55, 60];
// (order 3, M3) THE LIT FACES: a lamp lights the wet faces within LIT_REACH metres of it (the designer's 9 m); the
// rim's twelve panes, the one light of the covered way, light its piles, girders and drum to RIM_REACH.
const LIT_REACH = 9, RIM_REACH = 34;
// (order 4, H8) WALER_Y: the heights over the cutting's floor of the four walers along each pile wall
const WALER_Y = [3.2, 7.9, 12.6, 17.3];
// (order 4, H6) NEAR_RAIN: no stroke of rain stands within this many metres of the flown line (4 until this order)
const NEAR_RAIN = 6;
// (order 4, H1/H8) RIM_REACH (above) is 34 m, it was 22 (46 made the one red lamp a red block from the lip): the rim is the one lamp of the covered way, twelve large
// panes: its light falls GRADED along the wet pile walls, walers and girders, from full by the hood to nothing
// (order 3, G4) BRIDGE_SKEW: the twelve-road bridge crosses the fan this far off square (45 degrees; 25 until pass G)
// BRIDGE_S: the route metre at which it crosses the flown line (471; 475 until pass G)
// (order 5, K3) THE WAY GOES UNDER THE ROW: the bridge crosses the fan 60 degrees off square (BRIDGE_SKEW; 45 until
// this order), still over the flown line at s 471: its row of twelve heads now lies ALONG the way for 105 m (the
// starboard end at s 419, 30 m aside, the port end at s 523), so that we fly in under its starboard half and its
// heads pass close over and beside us one after another; their numbers by the one formula run from about 376 to
// 463, so the front walks the row ahead of us over some 87 m of flight (the report's bridgeRow).
const BRIDGE_SKEW = Math.PI / 3, BRIDGE_S = 471;
// (order 4, J1) HOME: the home signal and its fellow in the mast wood, each [route metre, metres to port, the
// pivot's height, the arm's size (1 is a blade 2.2 m long), the spectacle glass's size (1 is a lens 0.18 m across)]
const HOME = [[207.5, -4.8, 12.6, 3.6, 6.5], [240, 5.6, 16, 3.2, 5.4]], HOME_CLEAR = [190, 263];   // (order 5, K2: to the wood's end, s 263; it was 246: the posts 5.5 m off the line there crossed the whole picture as we turned to the engine)
// (order 4, J4) DRIZZLE IS ANOTHER NIGHT THAN RAIN, by numbers only: its strokes are FINE AND SHORT (DRIZZLE_LEN of a
// rain stroke's length: 1 to 2.4 m), they stand CLOSE TO LAMPS ONLY (lit no farther than DRIZZLE_REACH metres from
// their nearest lamp, where rain's reach is the part's RAIN_REACH; a stroke beyond it is not stood), three of each
// lamp's own five drawn strokes stand (rain: one), and they fall at 0.55 of the rain's speed.
const DRIZZLE_LEN = 0.3, DRIZZLE_REACH = 15;
// (order 4, J3) MASTS: the yard's tall lamp masts, each [route metre, metres to port, the height of its ring's
// middle]. Seven, by place: two beyond the engine (s 388, 395), two flanking the delta's far end (s 612, 655), one
// either side of the tower's leg (s 800, 830), one beyond the board (s 942). In six-foots or clear of every road,
// 14 m and more from the flown line. ONE RULE AIMS EVERY RING: at the flown line MAST_AIM metres before the mast's
// own route metre (a lamp is aimed at whoever comes; its lens is full within 45 degrees of that).
const MASTS = [[388, 22, 31], [395, -33, 29], [612, 36, 29], [655, -30, 26], [830, 18, 31], [800, -72, 29], [942, 15, 31]], MAST_AIM = 70;
// (order 5, K1) THE ENGINE'S PLACE, ENG_AT: [the plan's metre of its front buffers, metres to port of the plan line]:
// the third road to starboard, its front at s 310 (17 m sooner than order 3 stood it: the plan of twelve has the
// engine as the subject of the fourth twelfth of the flight, s 290 to 345, and its stretch now lies there).
// Everything of its stretch is
// typed in metres FROM THIS PLACE (a place of the yard, never a share of the flight): the lantern by its buffers,
// the six-foots kept clear beside it, the flown line's set-over (WAY_ASIDE), the gaze's keys (ENG_LOOK) and the
// lingering (ENG_SLOW).
// WAY_ASIDE: the flown line's metres to PORT of the yard's plan line, by the plan's metre. It swings 7.5 m to port
// before the engine (6.2 m short of the goods road's middle) and passes ALONG the engine 21 m from its middle
// line: the distance at which 27 m of engine is half a 16:9 picture's width and more and still WHOLE with eleven
// degrees to spare either side, which the still eye, the flown eye (it follows the gaze late) and the steady eye
// (later still) all need. (Half the width is being seen under 56 degrees or more: that is only inside a circle of
// 16 m hanging on the engine's two ends; no line that does not circle the engine holds it for more than 30 m of
// way.) Nought before s 237 and from s 390 on.
// ENG_LOOK: the gaze goes to the engine from [0] metres before its buffers to [1] metres past them; the point
// looked at slides along the boiler as we pass (the point that halves the angle the engine is seen under, taken
// [2] metres of the line ahead: engGaze in the build), so that the eye, which follows the gaze a little late,
// keeps the whole engine in the picture.
// ENG_SLOW: we linger (the pace falls by [2]) from [0] metres before its buffers to [1] metres past them.
const CUT_SIG = [1091, -8, 4.2];   // (order 5, K2) the cutting's bracket signal: [the plan's metre, metres to port, its middle's metres over the floor]
const ENG_AT = [310, -13.75], ENG_LOOK = [-92, 78, 4.4], ENG_SLOW = [-18, 60, 0.71];
// (order 6, N1) ROW_LOOK: the look on the bridge's row of heads goes from [0] metres past the engine's buffers (its
// tender's end is 28 m past them) to [1] metres past the place where the row crosses the flown line (BRIDGE_S); its
// point rests [2] metres aside on the row (to starboard: negative), [3] metres up, until 49 m before the crossing;
// while the row is still far (to 96 m before the crossing, eased out by 66 m) the point stands [4] metres higher, so
// that the tall mast we pass to starboard there (MASTS: s 395) keeps its ring of lamps inside the picture's top.
const ROW_LOOK = [30, 2, -8, 11.5, 9];
// (order 5, L1/L2) ENG_LAMPS: the rank of five switch lanterns in the six-foot along the engine, metres of the plan
// from its buffers. (L4) HEAD_REACH: how far the engine's headlamp lies on the rails before it, in metres: the ONE
// typed number of its reach.
const ENG_LAMPS = [-3.2, 5.5, 14.2, 22.9, 31.6], HEAD_REACH = 17;
// (order 6, M3) ENG_LEAD: the engine's own file of lanterns RUNS ON toward the entry down the same six-foot: [how
// many more, their pitch in metres], counted back from the first of ENG_LAMPS (so they stand 17.7, 32.2 and 46.7 m
// before the buffers: s 292.3, 277.8, 263.3). Each the same lantern, a lamp under the one green law at its own place.
const ENG_LEAD = [4, 14.5];   // (order 6, P1) one more of them further back: the fourth stands at s 248.8
// (order 6, P1) PORT_LEAD: A SECOND SHORT FILE of the same lantern TO PORT of the flown line: [the plan's metre of its
// first lantern, how many, their pitch in metres, metres to port of the plan line]. The six-foot 16.5 m to port (between
// the ninth road and the tenth) is the first that the flown line neither crosses nor comes nearer than 6 m to: the line
// swings 7.5 m to port here (WAY_ASIDE), so it passes the file 9 m off and more. Each a lamp under the one green law
// at its own place, over its own filled pool with the rails through it; the file is a rank and lies as ONE band.
const PORT_LEAD = [267.5, 4, 11, 16.5];
// (order 6, P1) TRAIN_LAMPS: how many standing lamps the goods train's wet sides take (the nearest its road, by place).
// It was 40; the port file's four lanterns stand 1.4 m from the wagons' far sides while the loop lies to port, so the
// list is four longer: no lamp that lit a wagon's side is put out of it by them.
const TRAIN_LAMPS = 44;
// (order 6, M2) A RANK OF LAMPS MIRRORS AS ONE BAND: lamps of one file (site.rank, given where the file is stood) that
// stand no farther apart than RANK_GAP metres are a rank: the part's makeRankBands lays ONE band lamp to lamp with a
// brighter knot under each lamp, and no lamp of a rank lays a streak of its own. A lone lamp keeps its spindle.
const RANK_GAP = 64;   // (the thinned files of the far field, every second post not stood, are ranks still)
// (order 5, L6) APPROACH: the two files of lanterns before the cutting: [first metre, last metre, pitch, metres aside].
const APPROACH = [921, 975, 9, 6.5], CAGE_HUT = [1143, 1163];   // CAGE_HUT: the gallery under the deck, first and last metre of the plan
const WAY_ASIDE = [[ENG_AT[0] - 73, 0], [ENG_AT[0] - 14, 7.5], [ENG_AT[0] + 14, 7.3], [ENG_AT[0] + 30, 6.6], [ENG_AT[0] + 80, 0]];
// (order 1, B1) the cutting's own draw orders, all AFTER the yard's film (ORDER.film) and before the upright air
// (ORDER.upright): its mirror's bodies, its mirror's lamps and streaks, its floor's film, what lies lit on the floor,
// its upright bodies, the rim's face.
const CUT = { mirrorBody: ORDER.film + 0.3, mirror: ORDER.film + 0.34, film: ORDER.film + 0.4, lit: ORDER.film + 0.45, body: ORDER.film + 0.5, face: ORDER.film + 0.55 };

// <route>
// The route in plan and height, metre by metre (s = metres along it). Heading th turns clockwise seen from above:
// the course is (-sin th, 0, cos th), starboard (cos th, 0, sin th) * -1 ... see side() below. +Z is the entry course.
function makeRoute() {
  const N = 1250, X = new Float64Array(N + 1), Y = new Float64Array(N + 1), Z = new Float64Array(N + 1), TH = new Float64Array(N + 1);
  // curvature (radians a metre, clockwise) by knots: straight over the fan, a widening spiral in, the hard turn onto
  // the leg at s 590-650, the leg s 650-975, a 20 degree bend, the main line straight from s 1004
  const K = [[0, 0], [140, 0], [200, 0.0030], [430, 0.0036], [585, 0.0046], [600, 0.0200], [638, 0.0200], [652, 0], [974, 0], [981, 0.0155], [997, 0.0155], [1004, 0], [1250, 0]];
  // height over rail level by knots (monotone between them): the plan of twelve's heights
  // (order 1, PASS C) C1: we arrive 13 m up over the fan and come down to the dwarf file, flown at the height of a
  // dwarf's glass (s 84-128); C3: arm height in the mast wood; C4: low by the engine; C8: 3 m over the floor of the open
  // cutting, then up close under the deck's girders (s 1150-1196) and down to the hood's middle
  // (order 3, PASS E) THE PLAN IS HELD, THE HEIGHTS ARE FREE. Hk0 is order 2's table of heights, kept only to lay the
  // route's PLAN exactly where it lay (each metre's level share of its step), so that no lamp, pane or post moves
  // into another cell of the hash and the one salt stands; Hk is the height actually flown. s is a metre of the plan.
  // E1/E4: we arrive 7 m up and low enough for the water to carry the red yard to our feet; E1: 10 m up before the
  // tower (it stands whole, foot and all), 21 m at its galleries, 5.5 m along the board (its double fills the lower
  // half), 3.4 m at the cutting's lip (the near lens's streak runs to our feet)
  const Hk0 = [[0, 13], [28, 12.4], [84, 1.9], [128, 1.9], [152, 4.5], [200, 10], [255, 8.5], [300, 3.0], [365, 3.4], [425, 6.5], [474, 6.6], [540, 26], [600, 14], [650, 4], [702, 12],
    [772, 30], [832, 22], [890, 6.5], [935, 6.5], [988, 9], [1040, -7], [1088, -19], [1150, -5.7], [1196, -5.7], [1250, -13]];
  // (order 4, H3) THE DELTA IS FLOWN LOW AND NEAR: 8.5 m over it at s 540 (26 m until this order) and 7.5 m at s 600:
  // its lanterns pass close under and beside us and their pools fill the ground from edge to edge
  // (order 4, J1) THE MAST WOOD IS FLOWN LOW, UNDER THE HOME SIGNAL: 4.3 m up at s 196 (10 m until this pass, the
  // height of the arms): we pass close under one great semaphore and look up along its post
  const Hk = [[0, 7], [28, 6], [84, 1.9], [128, 1.9], [152, 4.5], [196, 4.3], [224, 5.4], /* (order 5, K1) down to the engine's running plate sooner, and level along it: the eye 3.8 m up from 30 m before its buffers to its tender's end */ [252, 6.6], [ENG_AT[0] - 30, 3.8], [ENG_AT[0] + 28, 3.8], [365, 3.4], [425, 6.5], [474, 6.6], [540, 8.5], [600, 7.5], [650, 4], [692, 7],
    [762, 10.5], [816, 21], [870, 5.5], [935, 5.5], /* (order 3, M5) the tower's knots 10 m sooner, with the tower */ [975, 4.6], [1000, 3.4], [1040, -7], [1088, -19], [1150, -5.7], [1196, -5.7], [1250, -13]];
  const lin = (T, s) => { let i = 0; while (i < T.length - 2 && s > T[i + 1][0]) i++; const a = T[i], b = T[i + 1], t = Math.min(1, Math.max(0, (s - a[0]) / (b[0] - a[0]))); return a[1] + (b[1] - a[1]) * t; };
  const mkH = (Hk) => {
    const slope = (i) => { if (i === 0 || i === Hk.length - 1) return 0; const d0 = (Hk[i][1] - Hk[i - 1][1]) / (Hk[i][0] - Hk[i - 1][0]), d1 = (Hk[i + 1][1] - Hk[i][1]) / (Hk[i + 1][0] - Hk[i][0]); return d0 * d1 <= 0 ? 0 : 2 * d0 * d1 / (d0 + d1); };
    return (s) => { let i = 0; while (i < Hk.length - 2 && s > Hk[i + 1][0]) i++; const a = Hk[i], b = Hk[i + 1], h = b[0] - a[0], t = Math.min(1, Math.max(0, (s - a[0]) / h)), m0 = slope(i) * h, m1 = slope(i + 1) * h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * m1; };
  };
  const hgt = mkH(Hk), hgt0 = mkH(Hk0);
  // (order 5, K1) THE YARD'S PLAN LINE AND THE FLOWN LINE. X0, Z0, TH are the yard's plan line, as every order
  // laid it: every body of the world is placed from it (at(), so P()), and none moved. X, Z are THE FLOWN LINE:
  // the plan line set over to port by WAY_ASIDE metres (a table by the plan's metre, eased like the heights; nought
  // before s 246 and from s 404 on, so the flight from the bridge on is the line it was). It is the flown line
  // that the build walks for clear air, that the rain keeps off, and that the one formula measures every lamp's
  // metre and metres aside from (makeNearest).
  const X0 = new Float64Array(N + 1), Z0 = new Float64Array(N + 1), off = mkH(WAY_ASIDE);
  let th = 0; Y[0] = hgt(0);
  for (let s = 1; s <= N; s++) {
    th += lin(K, s - 0.5); TH[s] = th; Y[s] = hgt(s);
    const dy = hgt0(s) - hgt0(s - 1), hz = Math.sqrt(Math.max(0.01, 1 - dy * dy)), tm = th - 0.5 * lin(K, s - 0.5);
    X0[s] = X0[s - 1] - Math.sin(tm) * hz; Z0[s] = Z0[s - 1] + Math.cos(tm) * hz;
  }
  for (let s = 0; s <= N; s++) { const d = s > WAY_ASIDE[0][0] && s < WAY_ASIDE[WAY_ASIDE.length - 1][0] ? off(s) : 0; X[s] = X0[s] + Math.cos(TH[s]) * d; Z[s] = Z0[s] + Math.sin(TH[s]) * d; }
  // a place by (s, aside to PORT in metres) of the PLAN line: port of the course (-sin th, cos th) is (cos th, sin th) in (x, z)
  const at = (s, aside) => { const i = Math.min(N - 1, Math.max(0, Math.floor(s))), f = s - i, th = TH[i] + (TH[i + 1] - TH[i]) * Math.min(1, Math.max(0, f));
    const x = X0[i] + (X0[i + 1] - X0[i]) * f, z = Z0[i] + (Z0[i + 1] - Z0[i]) * f; return [x + Math.cos(th) * aside, z + Math.sin(th) * aside, th]; };
  const tower = at(820, -30), boardMid = at(945, 34);
  return { N, X, Y, Z, TH, at, hgt, tower, boardMid, X0, Z0, off };
}
// </route>

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the route metre nearest a place in plan, and the place's metres aside (the formula's m and aside)
function makeNearest(R) {
  const { X, Z, N } = R;
  return (x, z) => {
    let b = 0, bd = Infinity;
    for (let i = 0; i <= N; i += 10) { const dx = X[i] - x, dz = Z[i] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; b = i; } }
    const lo = Math.max(0, b - 10), hi = Math.min(N, b + 10);
    for (let i = lo; i <= hi; i++) { const dx = X[i] - x, dz = Z[i] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; b = i; } }
    let m = b, best = bd;
    for (const i of [b - 1, b]) {
      if (i < 0 || i >= N) continue;
      const ex = X[i + 1] - X[i], ez = Z[i + 1] - Z[i], t = Math.min(1, Math.max(0, ((x - X[i]) * ex + (z - Z[i]) * ez) / (ex * ex + ez * ez)));
      const dx = X[i] + ex * t - x, dz = Z[i] + ez * t - z, d = dx * dx + dz * dz; if (d <= best) { best = d; m = i + t; }
    }
    return { m, aside: Math.sqrt(best) };
  };
}

// RAILS: a road is one flat strip; its two polished crowns and its wet sleepers are drawn in the strip's own
// fragment shader, added over the wet film. Use (3): a crown keeps 1.5 pixels and dims by true over drawn; the
// sleepers (each 0.7 m) go to their mean when finer than about 3 pixels. Use (2): yardTone. The crown carries the
// tint of the lamps of its own place (aTint: turnAt by the one formula at the rail's place, doubt, amount).
const RAIL_VS = /* glsl */`
attribute vec3 aT; attribute vec3 aTint; varying vec3 vT; varying vec3 vTint; varying float vDist;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vT = aT; vTint = aTint; vDist = length(wp.xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const RAIL_FS = /* glsl */`
varying vec3 vT; varying vec3 vTint; varying float vDist;
${STYLE_GLSL}
void main() {
  float a = vT.x, px = max(fwidth(a), 1e-5), pv = max(fwidth(vT.y), 1e-5), tone = yardTone(vDist);
  vec3 lampC = yardLampColor(yardLamp(vTint.x, vTint.y)) * vTint.z;
  // (order 3, M2) far rails go to their mean and get DIMMER: the crown's floor of strength is 0.06 (it was 0.2), and
  // far sleepers lie at half their mean, so the fan's far roads are a few dim strokes and never a pale fuzz
  float crown = yardLine(abs(a) - 0.7175, 0.035, px, 1.5, 0.06);
  float inb = 1. - smoothstep(1.2, 1.3, abs(a));
  float sl = yardLine((fract(vT.y / 0.7) - 0.5) * 0.7, 0.05, pv, 1.5, 0.);
  sl = mix(sl, 0.07, smoothstep(0.17, 0.47, pv)) * inb * (1. - vT.z);
  // STEEL IS COLD (order 1, A1): a crown is pale steel and a sleeper shade steel along their whole length; a lamp's
  // colour comes onto the ground only in the lamp's own pool (the part's makePools), never along a rail
  // (order 2, D2) but the main line's two roads in the cutting run to the rim, and on the wet floor their crowns hold
  // its reflection as two hairlines (a road that carries amount 0.9 or more: those two alone; vT.y is its metres from
  // the cutting's end wall, the rim stands at 238): strongest toward the rim, a quarter of that at the end wall
  float rimK = step(0.8, vTint.z) * mix(0.25, 1., smoothstep(40., 200., vT.y));
  vec3 col = uPale * 0.4 * tone * crown + uShade * 0.26 * tone * sl * (1. - crown) + lampC * 0.85 * rimK * crown;
  gl_FragColor = vec4(min(col, vec3(1.)), 1.);
}`;

// FAR LAMPS (400 m and more off): each a fixed upright quad by its place (never turned to the eye) holding the lamp's
// point and, below rail level, its streak in the wet. Use (3): the point keeps 1.5 pixels and dims; (2) tone.
const FAR_VS = /* glsl */`
attribute vec4 aF; attribute vec4 aLamp; varying vec4 vS; varying vec4 vLamp; varying float vI;
${STYLE_GLSL}
void main() {
  vec3 lw = (modelMatrix * vec4(aF.xyz, 1.)).xyz; float dist = length(cameraPosition - lw);
  float hw = 0.4 + dist / 240.;                                         // room for the least width (3)
  float y = mix(-aF.y - min(6. * aF.y, 60.), aF.y + hw, position.y);    // (order 1, B2) its streak runs to 7 lamp heights under the water (60 m at the most)
  vec2 t = vec2(cos(aF.w), sin(aF.w));
  vec3 p = vec3(aF.x + t.x * position.x * hw, y, aF.z + t.y * position.x * hw);
  vS = vec4(position.x * hw, y, aF.y, 0.); vLamp = aLamp; vI = 0.4 + 0.6 * yardTone(dist);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
}`;
const FAR_FS = /* glsl */`
varying vec4 vS; varying vec4 vLamp; varying float vI;
${STYLE_GLSL}
void main() {
  float a = vS.x, y = vS.y, h = max(vS.z, 0.5), seed = fract(vLamp.w);
  float px = max(fwidth(a), 1e-5), py = max(fwidth(y), 1e-5), pp = max(px, py);
  vec3 c = yardLampColor(yardLamp(vLamp.x, vLamp.y)) * vLamp.z * vI;
  float r = 0.2, dr = max(r, 0.8 * pp);
  float lamp = (1. - smoothstep(dr - 0.5 * pp, dr + 0.5 * pp, length(vec2(a, y - h)))) * max(r / dr, 0.85);   // (order 1, A2) far lamps are the brightest points
  // (order 3, M1) THE LAW OF EVERY REFLECTION (the part's STREAK_FS says it in full): one column under its lamp in a
  // few long pieces; where a piece is under about 4 pixels or the column under about 1.5, it GOES OVER INTO ITS MEAN:
  // no breaks, a smooth dim band some four pixels wide. A far lamp is always there: so under a far row of lamps lies
  // ONE smooth dim band of the row's colour, by each lamp's own state, and never a field of glitter.
  float ph = 6. * log(1. + max(-y, 0.) / (0.25 * h)) + 1.1 * sin(max(-y, 0.) * 0.33 + uTime * 1.6 + seed * 23.) + seed * 40., dpx = max(fwidth(ph), 1e-4);
  float mean = max(smoothstep(0.55, 1.5, dpx), smoothstep(0.55, 1.35, px / 0.22));
  float w = max(0.22, mix(0.75, 2.2, mean) * px), g = exp(-(a * a) / (w * w)) * max(0.22 / w, mix(0.3, 0.1, mean));
  // (order 1, B2) THE FAR BAND'S LONG REFLECTIONS: strongest at the lamp's image, drawn out toward us to 7 lamp
  // heights, cut into dashes that lengthen toward us and shiver by the world's clock; the dashes go to their mean (3)
  // (no two alike: each lamp's streak ends at its own share of that length, by its seed; more gap than dash, so
  // the band's double is a field of broken glitter and never a curtain)
  float d = max(-y, 0.), t = (d - h) / h, tEnd = min(6., 60. / h) * (0.3 + 0.7 * fract(seed * 7.31));
  float prof = (t < 0. ? exp(2.6 * t) : 1. / (1. + 0.9 * t)) * step(y, 0.) * (1. - smoothstep(0.25 * tEnd, tEnd, t));
  float brk = mix(mix(smoothstep(-0.35, 0.2, sin(ph)), 0.6, mean), 0.7, uCalm);   // (order 3, E7) after the rain: unbroken
  brk *= 1. + max(mean * 0.16, uCalm * 0.38) * sin(uTime * 1.9 + seed * 40. - d * 0.21);   // in its mean the band breathes by the clock, lamp by lamp: a slow swell down the column (smooth: no sparkle)
  gl_FragColor = vec4(c * (lamp + 0.62 * g * prof * brk), 1.);
}`;

// SEMAPHORE ARMS, a body that follows its lamp's state: a plate turns about its pivot (aAxis) round its face's axis
// (aDir.xyz) by uFlown - turnAt and nothing else: it drops over 8 m and rings twice; a doubter's (tn.y) falls
// early, goes back up and bangs on its stop. THE ANSWER (5); no clock, no eye.
const ARM_MOVE = /* glsl */`
void yardMove(inout vec3 p, inout vec3 ax, inout vec3 d, inout vec3 tn) {
  float dd = uFlown - tn.x, e = max(dd, 0.), e2 = max(dd + 50., 0.);
  float drop = smoothstep(-8., 0., dd) + 0.16 * exp(-e / 6.) * sin(e * 0.95);
  float tryD = tn.y * smoothstep(-72., -66., dd) * (1. - smoothstep(-54., -50., dd));
  float bang = tn.y * 0.12 * exp(-e2 / 4.) * sin(e2 * 1.6) * (1. - smoothstep(-12., -8., dd));
  float an = 0.96 * (drop + tryD) - bang;
  vec3 r = p - ax; float c = cos(an), s = sin(an);
  p = ax + r * c + cross(d, r) * s + d * dot(d, r) * (1. - c);
}`;

// THE TRAIN, a body carried along a fixed road by the world's clock and nothing else: a vertex is (metres aside of
// the road's centre, metres up, metres along the train); uLoop holds the road as 64 points evenly spaced along it
// (x, z, the one formula's turnAt at that place, 0), uLoopP its length, the speed, the count.
const TRAIN_MOVE = /* glsl */`
uniform vec4 uLoop[64]; uniform vec4 uLoopP;
// (order 4, H1) THE STANDING LAMPS BY THE TRAIN'S ROAD (uTL: place and turnAt; uTL2: doubt, strength, reach; reach 0:
// none), baked by place at the build: a wagon's wet plate takes the nearest of them to its own middle, where the
// world's clock has carried it, and shows that lamp's graded patch by the part's one law of the lit face
uniform vec4 uTL[${TRAIN_LAMPS}]; uniform vec4 uTL2[${TRAIN_LAMPS}];
vec4 yardRoad(float s, out vec2 tg) {
  float n = uLoopP.z, f = mod(s, uLoopP.x) / uLoopP.x * n, i = floor(f), t = f - i;
  vec4 p0 = uLoop[int(mod(i - 1. + n + 0.5, n))], p1 = uLoop[int(mod(i + 0.5, n))], p2 = uLoop[int(mod(i + 1.5, n))], p3 = uLoop[int(mod(i + 2.5, n))];
  vec2 c = 0.5 * (2. * p1.xy + (p2.xy - p0.xy) * t + (2. * p0.xy - 5. * p1.xy + 4. * p2.xy - p3.xy) * t * t + (3. * p1.xy - p0.xy - 3. * p2.xy + p3.xy) * t * t * t);
  tg = 0.5 * ((p2.xy - p0.xy) + 2. * (2. * p0.xy - 5. * p1.xy + 4. * p2.xy - p3.xy) * t + 3. * (3. * p1.xy - p0.xy - 3. * p2.xy + p3.xy) * t * t);
  tg /= max(length(tg), 1e-4);
  return vec4(c, mix(p1.z, p2.z, t), 0.);
}
void yardMove(inout vec3 p, inout vec3 ax, inout vec3 d, inout vec3 tn) {
  vec2 tg, ta; float s0 = uTime * uLoopP.y, sx = ax.x, flatY = abs(p.y - ax.y);   // sx: the plate's middle, metres aside of its road's middle; flatY: nought on a plate that lies flat (a top, a floor)
  vec4 c = yardRoad(p.z + s0, tg), ca = yardRoad(ax.z + s0, ta);
  p = vec3(c.x + tg.y * p.x, p.y, c.y - tg.x * p.x);
  ax = vec3(ca.x + ta.y * ax.x, ax.y, ca.y - ta.x * ax.x);
  d = vec3(ta.y * d.x + ta.x * d.z, d.y, -ta.x * d.x + ta.y * d.z);
  tn = vec3(c.z, 0., tn.z);
#ifndef YARD_NO_LIT
  if (aDir.w < 0.) {   // a plate (its middle rides in ax): its nearest standing lamp, if one reaches it
    // (order 6, P1) BLACK FACES HIDE: a lamp that stands on the wagon's other side is hidden from a side plate by the
    // wagon itself and is not that plate's lamp (a lantern 1.4 m behind a wagon took its near side's lamp from it)
    float best = 1e9; vec2 sideV = vec2(ta.y, -ta.x);
    for (int i = 0; i < ${TRAIN_LAMPS}; i++) {
      vec3 dl = uTL[i].xyz - ax; float dd = dot(dl, dl), R = uTL2[i].z + 0.9;
      bool front = abs(sx) >= 0.6 ? dot(uTL[i].xz - ca.xy, sideV) * sign(sx) > abs(sx) : (flatY > 0.05 || uTL[i].y > ax.y);   // a side: the lamp stands out beyond it; a top: the lamp stands over it; an end: any
      if (front && uTL2[i].z > 0. && dd < R * R && dd < best) { best = dd; yardLit = vec4(uTL[i].xyz, uTL2[i].z); yardLit2 = vec3(uTL[i].w, uTL2[i].x, uTL2[i].y); }
    }
  }
#endif
}`;

// THE EXPRESS'S STRIP OF COLD LIGHT: a glass-white line along each coach side, carried along the express's road by
// the world's clock (the train's own yardRoad). Use (3): it keeps 1.5 pixels and dims; (2) tone.
const EXLIGHT_VS = /* glsl */`
attribute vec2 aQ; varying vec2 vQ; varying float vDist;
${STYLE_GLSL}
#define YARD_NO_LIT
${TRAIN_MOVE}
void main() {
  vec2 tg; vec4 c = yardRoad(position.z + uTime * uLoopP.y, tg);
  vec4 wp = modelMatrix * vec4(c.x + tg.y * position.x, position.y, c.y - tg.x * position.x, 1.);
  vQ = aQ; vDist = length(wp.xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const EXLIGHT_FS = /* glsl */`
varying vec2 vQ; varying float vDist;
${STYLE_GLSL}
void main() {
  float py = max(fwidth(vQ.y), 1e-5);
  // (order 1, C10) the express must be SEEN when it runs: its strip is the whole row of lit windows, 1.8 m tall,
  // glass white, keeping 2 pixels: the brightest long thing on the horizon, and doubled in the yard's water
  float line = yardLine(vQ.y, 0.9, py, 2., 0.9) * smoothstep(0., 0.03, vQ.x) * (1. - smoothstep(0.97, 1., vQ.x));
  gl_FragColor = vec4(uGlass * line * (0.6 + 0.4 * yardTone(vDist)), 1.);
}`;

// STEAM: fixed crossed sheets by their place (never turned to the eye); a few curls with a hard inner edge rise by
// the world's clock, lit only where the lamps of its place (aTint, strongest at its foot) or the floodlight catch them.
// (order 1: the steam's shader is the part's now, makeSteam(); the world gives it the places.)
// THE FLOODLIGHT, one hard white point 2.2 km off with a small halo, and its streak in the wet below it: two fixed
// quads. Use (3): the point keeps 2 pixels, the streak's dashes go to their mean. aQ.z 0 the point, 1 the streak.
const FLOODPT_VS = /* glsl */`
attribute vec3 aQ; varying vec3 vQ;
void main() { vQ = aQ; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`;
const FLOODPT_FS = /* glsl */`
varying vec3 vQ; uniform float uDawn;
${STYLE_GLSL}
void main() {
  vec3 col; float px = max(0.7 * length(fwidth(vQ.xy)), 1e-5), py = max(fwidth(vQ.y), 1e-5);
  if (vQ.z < 0.5) {
    // (order 3, E4) THE FLOODLIGHT HAS A BODY: no stray white dot. A strict rank of five lamp heads on a head frame
    // (each keeps 1.2 pixels), the frame's bar under them and the lattice mast down to the ground, in pale steel
    // (each line keeps 1.5 pixels and dims, use (3)); its small halo round the rank as before
    float xk = clamp(floor(vQ.x / 9. + 0.5), -2., 2.) * 9., r = length(vec2(vQ.x - xk, vQ.y)), core = max(2.6, 1.2 * px), rr = length(vQ.xy * vec2(0.45, 1.));
    col = uGlass * ((1. - smoothstep(core - 0.5 * px, core + 0.5 * px, r)) + 0.4 * exp(-max(rr - 4., 0.) / 9.) * (1. - smoothstep(30., 44., rr)));
    float below = step(vQ.y, -3.);
    col += uPale * 0.5 * (yardLine(vQ.y + 5., 0.5, py, 1.5, 0.3) * step(abs(vQ.x), 22.) + (yardLine(abs(vQ.x) - 1.6 - 0.05 * (-vQ.y), 0.25, px, 1.5, 0.25)) * below * step(-57.5, vQ.y));
  } else {
    // (order 1, B2/B6) THE FLOODLIGHT'S STREAK in the wet (the last of the night's strip is gone: the hour is deep
    // night on every look): a fixed quad in the yard's mirror under the point's image (57 m under the water, 2.2 km
    // off), a long broken shivering path of glass white that shows only where standing water lies open. vQ.y: metres
    // under the water. The dashes lengthen toward us and go to their mean by the footprint (3).
    // The path is a sheaf of columns (each 8 m or 1.7 pixels, whichever is more), narrow at the image and widening
    // toward us; each column its own dashes, some of them out.
    float a = vQ.x, y = max(vQ.y, 0.), h = 57.2, t = (y - h) / h, tp = max(t, 0.);
    // (order 3, M1: it overrides the sheaf of dashes) ONE COLUMN under the floodlight's image, widening toward us,
    // in a few long pieces that shiver by the clock; where a piece is under about 4 pixels it is its mean: a smooth
    // dim band of glass white. Never a field of dashes.
    // (order 3, G6) it read as a pale stack of blocks behind the arrival's post: the column is THIN now (5 m at the
    // image, 14 m at our feet, never under 1.2 pixels) and its pieces are fewer and longer (four)
    float W = max(5. * (1. + 0.25 * min(tp, 7.)), 1.2 * px);
    float ph = 5.5 * log(1. + y / (0.25 * h)) + 0.8 * sin(y * 0.021 + uTime * 1.3), dpx = max(fwidth(ph), 1e-4);
    float brk = mix(mix(0.12, 1., smoothstep(-0.35, 0.2, sin(ph))), 0.62, smoothstep(0.55, 1.5, dpx));
    float prof = t < 0. ? exp(3. * t) : 1. / (1. + 0.2 * t);
    col = uGlass * (0.6 * exp(-(a * a) / (W * W)) * prof * brk + 0. * py * uDawn);
  }
  gl_FragColor = vec4(col, 1.);
}`;
// THE RIM of the way out: twelve panes of lamp glass round the hood's opening, each a lamp with its own number
// (uRim, by the one formula at the pane's place), on the drum's black front face. Use (3): ribs go to their mean.
// The eased flicker is the world's clock's (never under 0.6 of itself), from the first metre.
const RIM_VS = /* glsl */`
attribute vec2 aQ; varying vec2 vQ;
void main() { vQ = aQ; vec4 wp = modelMatrix * vec4(position, 1.); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const RIM_FS = /* glsl */`
varying vec2 vQ; uniform float uRim[12];
${STYLE_GLSL}
void main() {
  float r = length(vQ), px = max(0.7 * length(fwidth(vQ)), 1e-5);
  if (r < 7.5 || r > 9.) discard;
  float an = atan(vQ.y, vQ.x + 1e-5); if (an < 0.) an += 6.2831853;
  float f = an / 0.5235988, k = min(floor(f), 11.), t = (f - k - 0.5) * 0.5235988 * r;        // metres along the pane from its middle
  float turnAt = uRim[int(k)];
  vec2 st = yardLamp(turnAt, 0.);
  float ph = uTime * 1.3 + k * 0.618, ff = fract(ph);
  float dip = smoothstep(0., 0.12, ff) * (1. - smoothstep(0.2, 0.55, ff)) * step(0.45, yardHash(vec2(floor(ph), k * 7.3)));
  float power = 1. - 0.4 * dip;
  // (order 1, B4) twelve SEPARATE panes: a dark bar 1.1 m wide between neighbours (it holds as a gap far up the cutting)
  float hl = 0.2617994 * r - 0.55, dr = abs(r - 8.25) - 0.66, dt = abs(t) - hl, d = max(dr, dt);   // the pane's edge
  float inP = 1. - smoothstep(-px, 0., d);
  float rib = 0.5 + 0.5 * cos(6.2831853 * t / 0.16); rib = mix(rib, 0.5, smoothstep(0.04, 0.11, px));
  vec3 lampC = yardLampColor(st);
  vec3 col = uInk + lampC * inP * (0.78 + 0.22 * power) * (0.72 + 0.28 * rib);
  col += uGlass * inP * 0.55 * power * (st.x + st.y) * (1. - smoothstep(0.1, 0.34, abs(dr + 0.33))) * (1. - smoothstep(0.5 * hl, 0.9 * hl, abs(t)));   // the white-hot heart of the glass
  // its small glow on the wet face: (order 2, D3) THE HALO IN RANKS: nothing from half the way to the next pane on
  // (the bar between panes is 1.1 m: the glow ends 0.5 m from the pane's edge)
  col += lampC * (1. - inP) * 0.34 * power * exp(-max(d, 0.) / 0.3) * (1. - smoothstep(0.2, 0.5, d));
  col += uPale * yardLine(d - 0.03, 0.02, px, 1.5, 0.2) * 0.8;          // the pale rim of each pane (no tone by the eye's distance at the way out)
  col += uGlass * inP * 0.5 * smoothstep(0.75, 1., rib) * (1. - smoothstep(0.05, 0.3, abs(dr + 0.25)));   // a glint along the ribs
  gl_FragColor = vec4(min(col, vec3(1.)), 1.);
}`;

// (order 3, E5) A POOL IS LIGHT ON WET GROUND, broken by what lies in it: where a road runs through a switch lantern's
// reach its two crowns shine as two bright lines in the lantern's colour (by the lantern's own number), the wet
// ballast between the sleepers sparkles, the sleepers stay dark bars; all falling off to nothing with the metres from
// the lantern's foot (aFall, baked by place). Use (3): the crowns keep 1.5 pixels and dim, the sleepers and the
// sparkle go to their means by the footprint. No eye is read.
// (order 5, L4) THE ENGINE'S HEADLAMP, in the floodlight's pale steel, a LAMP BODY and no signal: IT STANDS OUTSIDE
// THE GREEN LAW (it has no number, never turns, and is not counted among the yard's lamps). Two things on one mesh:
// its glass, a DISC WITH AN EDGE on the drum over the smokebox door (aH: metres from its centre, 0, its radius), and
// a short FILLED WEDGE on the rails and sleepers before the buffers (aH: metres across from the road's middle, the
// route's metre, 1, metres from the lamp), graded from the lamp outward, with an edge, ending at HEAD_REACH (uReach:
// the one typed number). In the wedge the rails shine as two lines and the sleepers lie as dark bars (they go to
// their mean by the footprint, use (3)). It is NO SECOND FLOODLIGHT: it draws no line on any body (the yard's lines
// stay the one far floodlight's), lights no face, no rain and no steam; nothing of it hangs in the air. No eye is read.
const HEAD_VS = /* glsl */`
attribute vec4 aH; varying vec4 vH;
void main() { vH = aH; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`;
const HEAD_FS = /* glsl */`
varying vec4 vH; uniform float uReach;
${STYLE_GLSL}
void main() {
  float a = vH.x, px = max(fwidth(a), 1e-5), pv = max(fwidth(vH.y), 1e-5);
  if (vH.z < 0.5) {
    float pr = max(px, pv), r = length(vec2(a, vH.y)), R = max(vH.w, 1e-3);
    float fill = 1. - smoothstep(R - pr, R, r);
    float rim = yardLine(r - R * 0.84, 0.035, pr, 1.5, 0.5), core = 1. - smoothstep(R * 0.3, R * 0.5, r);
    gl_FragColor = vec4(mix(mix(uPale * 0.7, uGlass, core), uGlass, rim) * fill, 1.);
  } else {
    float d = clamp(vH.w / max(uReach, 1e-3), 0., 1.), wdg = mix(0.8, 3.3, d);
    float edge = 1. - smoothstep(wdg - max(px, 0.03), wdg + max(px, 0.03), abs(a));
    float end = 1. - smoothstep(1. - max(2. * pv / max(uReach, 1e-3), 0.01), 1., d);
    float fall = 1. - 0.72 * d;
    float crown = yardLine(abs(a) - 0.7175, 0.045, px, 1.5, 0.35);
    float bar = 1. - smoothstep(0.1, 0.16, abs(fract(vH.y / 0.7) - 0.5) * 0.7);
    bar = mix(bar, 0.36, smoothstep(0.07, 0.2, pv));
    float inb = 1. - smoothstep(1.25, 1.35, abs(a));
    float v = max(0.3 * fall * fall * (1. - 0.6 * bar * inb), 0.85 * crown * fall) * edge * end;
    gl_FragColor = vec4(uPale * v, 1.);
  }
}`;
const POOLRAIL_VS = /* glsl */`
attribute vec3 aT; attribute vec3 aLamp; varying vec3 vT; varying vec3 vLamp; varying vec2 vXZ;
void main() { vec4 wp = modelMatrix * vec4(position, 1.); vT = aT; vLamp = aLamp; vXZ = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const POOLRAIL_FS = /* glsl */`
varying vec3 vT; varying vec3 vLamp; varying vec2 vXZ;
${STYLE_GLSL}
void main() {
  float a = vT.x, px = max(fwidth(a), 1e-5), pv = max(fwidth(vT.y), 1e-5), pw = max(px, pv), fall = clamp(vT.z, 0., 1.);
  float crown = yardLine(abs(a) - 0.7175, 0.045, px, 1.5, 0.35);
  float bar = 1. - smoothstep(0.1, 0.16, abs(fract(vT.y / 0.7) - 0.5) * 0.7);              // a sleeper: a dark bar 0.25 m wide
  bar = mix(bar, 0.36, smoothstep(0.07, 0.2, pv));   // (order 4, H7) at its mean as soon as a bar is under some 3 pixels: no fine ladder, no tile
  vec2 ci = floor(vXZ / 0.11); float hh = yardHash(ci), wink = step(0.5, fract(hh * 7.3 + uTime * (0.2 + 0.5 * hh)));
  float spark = 0.135 + 0. * (hh + wink + pw);   // (order 3, M3) NO sparkle of ballast: it is at its mean at every distance
  float inb = 1. - smoothstep(1.25, 1.35, abs(a));
  float lit = fall * (2. - fall);
  vec3 c = yardLampColor(yardLamp(vLamp.x, vLamp.y)) * vLamp.z;
  // (order 3, G10) A PATCH HAS NO TILE: the ballast between the sleepers is no longer lit here (beyond the filled
  // patch's edge it lay as square tiles); the roads through a pool shine as their two crowns and nothing else
  // (order 4, H7) IN THE PATCH THE RAILS SHINE AS LINES AND THE SLEEPERS LIE AS DARK BARS: the strip is laid over
  // the pool with its own cover: a crown gives its line of the lamp's colour, a sleeper takes away 0.55 of what the
  // pool lit under it (between the rails only, fading with the patch: beyond a pool there is nothing to darken)
  float ca = min(lit * 1.3 * crown, 1.), ba = 0.55 * bar * inb * min(1., 3. * fall) * (1. - ca) + 0. * spark;
  // (order 4, H7) two more things that lie in the lit ground, on strips of their own (the whole part of vT.x / 20
  // says which): 1 a CABLE TROUGH (its concrete lids a shade lighter than the ballast, a dark joint each metre and
  // dark edges), 2 a DRAIN (a steel frame that takes the lamp's colour as two lines, its grating's bars each 0.16 m
  // dark slots over water). Joints and bars go to their mean when finer than about 3 pixels (3). No eye is read.
  float code = floor((vT.x + 10.) / 20.);
  if (code > 0.5) {
    float dr = step(1.5, code), b = vT.x - 20. * code, bx = max(fwidth(b), 1e-5), pitch = mix(1., 0.16, dr), jw = mix(0.025, 0.04, dr);
    float eL = yardLine(abs(b) - mix(0.25, 0.27, dr), 0.02, bx, 1.5, 0.25), inside = 1. - smoothstep(0.24, 0.28, abs(b));
    float jn = mix(yardLine((fract(vT.y / pitch) - 0.5) * pitch, jw, pv, 1.5, 0.), 2. * jw / pitch, smoothstep(pitch / 4., pitch / 2., pv));
    ca = min(lit * mix(0.2 * inside * (1. - jn) * (1. - eL), 0.95 * eL, dr), 1.);
    ba = mix(0.55 * max(jn * inside, eL), 0.7 * jn * inside * (1. - eL), dr) * min(1., 3. * fall) * (1. - ca);
  }
  gl_FragColor = vec4(c * ca + uInk * ba, ca + ba);
}`;

// THE ONE SALT of the hash of place for the whole world (see the head). Checked at the build by checkSalt().
const YARD_SALT = 17;

export default {
  id: 'the-yard-goes-green',
  name: 'The Yard Goes Green',
  category: 'city',
  weirdness: 0.3,
  media: ['air', 'open', 'rail'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    // THE SEEDED LOOKS: numbers and counts only; the lamp sites, the one formula and every shader are the same.
    // (order 4, J4d) the same two draws as before (rng.pick took one number each), and ONE THING MORE BY SEED from what
    // is left of each draw (its remainder is a fresh even number that no pick used): WHICH SIDE THE GOODS TRAIN
    // STANDS (its loop lies to port of the fan, or to starboard behind the engine), HOW LONG IT IS (45, 28 or 14
    // wagons) and WHETHER THE STANDING ENGINE'S REGULATOR IS OPEN (a tall plume) OR SHUT (a wisp at the chimney)
    const w0 = rng() * 3, l0 = rng() * 3, weather = ['rain', 'drizzle', 'after'][Math.floor(w0)], lead = ['arms', 'lights', 'dwarfs'][Math.floor(l0)];
    const trainLook = Math.floor((w0 % 1) * 6), trainSide = trainLook % 2 ? -1 : 1, trainWagons = [45, 28, 14][Math.floor(trainLook / 2)], regulator = Math.floor((l0 % 1) * 4) % 2 === 0;
    const dawn = vary.hour === 'dawn' || vary.hour === 'golden' ? true : vary.hour === 'night' ? false : rng.chance(0.4);
    const rare = !!vary.rare, density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const R = makeRoute(), near = makeNearest(R), { X, Y, Z, TH } = R;
    // (order 5, K1) near() measures from THE FLOWN LINE (the one formula's metre and metres aside, clear air, the
    // rain's keeping off); nearPlan() gives the PLAN's metre nearest a place, for what is laid by the plan's metre
    const nearPlan = makeNearest({ X: R.X0, Z: R.Z0, N: R.N });
    const flood = V3(0.5, 0.026, 0.866).normalize();
    // (order 3, E7) THE WEATHER MUST SHOW AT A GLANCE, by numbers only: RAIN long strokes, ringed water, broken
    // reflections; DRIZZLE half as many again of short fine ticks, fewer rings, low steam; AFTER THE RAIN no stroke
    // and no ring, water nearly everywhere and still (calm 1: long unbroken reflections), thick low steam, more drips
    // (order 3, G9) after the rain the yard still DRIPS: a quarter of the rain's rings stay on the water (ringK 0.25,
    // it was 0: with no rain and no ring almost nothing moved), each from its own drop by the world's clock
    const calm = weather === 'after' ? 1 : 0, ringK = weather === 'after' ? 0.25 : weather === 'drizzle' ? 0.6 : 1;
    const style = makeYardStyle({ palette: PALETTE, flood, salt: YARD_SALT, calm });
    const scene = new THREE.Scene(); scene.background = new THREE.Color(PALETTE[0]);
    const pts = []; for (let s = 0; s <= 1250; s += 10) pts.push([X[s], Y[s], Z[s]]);
    const path = makePath(pts, { samples: 1250 });
    // a place by route metre s, metres aside to port and height: P(s, aside, y)
    const P = (s, aside, y = 0) => { const a = R.at(s, aside); return V3(a[0], y, a[1]); };
    const course = (s) => { const th = TH[Math.min(1250, Math.max(0, Math.round(s)))]; return V3(-Math.sin(th), 0, Math.cos(th)); };
    const port = (s) => { const th = TH[Math.min(1250, Math.max(0, Math.round(s)))]; return V3(Math.cos(th), 0, Math.sin(th)); };
    // (order 3, E1) THE CUTTING'S MOUTH stands 12.5 m nearer (its end wall at MOUTH, s 997.5; s 1010 before): from the
    // lip the cutting and its floor's water fill the picture's middle and lower half. PC: a place of the cutting, on
    // the main line's straight carried back before s 1010 (five more piles a side; no lamp, pane or post moved)
    const MOUTH = 997.5, cuC = course(1100), kC = P(1011, 0).distanceTo(P(1010, 0));
    const PC = (s, aside, y = 0) => (s >= 1010 ? P(s, aside, y) : P(1010, aside, y).addScaledVector(cuC, (s - 1010) * kC));
    // THE ONE CALLER of the one formula in this file: a lamp's number from its own place. rail: its rail level.
    // null where turnAt would pass LAST_TURN: no lamp is stood there (the rim alone comes later, by its place).
    const all = []; let lastTurn = LAST_TURN;
    const lampAt = (p, rail = 0, key, rim = false) => {
      const n = near(p.x, p.z), s = yardSite(style, p, n.m, n.aside, p.y - rail, key);
      if (!rim && s.turnAt > lastTurn) return null;
      all.push(s.turnAt); return s;
    };
    // THE RIM'S TWELVE PANES first, so that the build knows the rim's first pane: no lamp is stood where its turnAt
    // would come later than that (the rim is last by its place under the same formula, never by a line for it)
    const hoodC = P(1250, 0, FLOOR_Y + 9), hU = port(1250), hC = course(1250), rimPanes = [];
    for (let k = 0; k < 12; k++) {
      const a = (k + 0.5) / 12 * 6.2831853, pos = hoodC.clone().addScaledVector(hU, Math.cos(a) * 8.25).add(V3(0, Math.sin(a) * 8.25, 0)).addScaledVector(hC, -9);
      rimPanes.push({ pos, L: lampAt(pos, FLOOR_Y, undefined, true) });
    }
    lastTurn = Math.min(LAST_TURN, ...rimPanes.map((p) => p.L.turnAt)) - 0.01;
    // (order 2, D1) CUT_LAST: the last route metre of the cutting where a wall head may stand under that rule, found by
    // asking the one formula (1080: its number is 982.8); beyond it THE COVERED WAY HAS NO LAMP BUT THE RIM, and a wet
    // thing under its deck (pile, girder, drip) takes the number of the rim's pane nearest its own place (rimNear;
    // D2: lit by the rim alone; DECK0 below)
    let CUT_LAST = 1020; for (let s = 1020; s <= 1240; s += 10) if (yardTurnAt(s, 12.8, 7.5, 1) <= lastTurn) CUT_LAST = s;
    // (the lead's mend after the reader of the frozen fifth build) NO NUMBER BUT A LAMP'S OWN: a wet thing of the
    // covered way takes the number of THE PANE THAT STANDS NEAREST ITS OWN PLACE (rimNear: floor things the lowest
    // panes', the deck's things the highest panes', a wall's things its own side's); it was one number asked of the
    // formula at the hood's middle, where no lamp stands
    // (the lead's mend after the verifiers) the switch stands AT THE DECK'S EDGE (DECK0, s 1138): only under the deck
    // is a wet thing lit by the rim alone; in the open cutting before it (s 1085 to 1138 too) a wet thing takes the
    // number of its own place by the one formula, as everywhere in the open
    const RIM_WAY = CUT_LAST + 5, DECK0 = 1138;
    const rimNear = (p) => { let b = rimPanes[0], bd = Infinity; for (const q of rimPanes) { const d = q.pos.distanceToSquared(p); if (d < bd) { bd = d; b = q; } } return b.L.turnAt; };
    // the number of a wet thing's own place (rails, plate, steam, rain): the same formula, no lamp counted
    const tintAt = (p, rail = 0) => { const n = near(p.x, p.z); return rail < -1 && n.m > DECK0 ? rimNear(p) : yardTurnAt(n.m, n.aside, Math.max(0, p.y - rail), 1); };
    // CLEAR AIR BY PLACE: every body claims spheres; walkRoute() at the foot walks the route each quarter metre
    const claims = [], claim = (name, p, r) => claims.push([name, p.x, p.y, p.z, r]);
    const claimBar = (name, a, b, r) => { const n = Math.max(1, Math.ceil(a.distanceTo(b) / 1.5)); for (let i = 0; i <= n; i++) claim(name, a.clone().lerp(b, i / n), r); };

    // groups in the mirror's order: each level's mirror, then its film, then the upright world
    const yardMirror = new THREE.Group(), yardFlip = new THREE.Group(); yardFlip.scale.y = -1; yardMirror.add(yardFlip);
    const cutMirror = new THREE.Group(), cutFlip = new THREE.Group(); cutFlip.scale.y = -1; cutFlip.position.y = FLOOR_Y; cutMirror.add(cutFlip);   // children in metres over the floor
    const upright = new THREE.Group();
    scene.add(yardMirror, cutMirror, upright);
    // lamp sites by kind (one makeLampUnits call each), streak sites by level, rain strokes, bodies
    const S = { dwarf: [], target: [], board: [], small: [], cutT: [], cutD: [] /* (order 3, G5) the cutting's bracket signal: a 'dwarf' unit queued late */ }, streakYard = [], streakCut = [], strokes = [];
    const bUp = makeBodyBuilder(style), bMir = makeBodyBuilder(style), bCut = makeBodyBuilder(style), bArm = makeBodyBuilder(style), bHood = makeBodyBuilder(style);
    await ctx.yield();

    // THE LAMP TOWER (the part's set piece) 30 m to starboard of the leg, in the apron; its double in the yard's mirror
    // (order 1, C9, stood it at s 832 so that the formula's step at m 810 fell before its first lamp; M5 holds now:)
    // (order 3, M5) THE TOWER FILLS THE PICTURE'S HEIGHT AS IT TURNS, BY PLACE: its axis at s 822 (10 m sooner on
    // the same straight leg): its lamps stand at m 810.7 to 833.3, so the formula's step at m 810 still falls before
    // the first of them. By the one formula a lamp h metres up turns when we are about 105 - 1.33 h metres before the
    // axis: the front climbs the tower while we fly s 728 to 818, and where its middle turns the tower stands 60 to
    // 70 m off and spans the picture from edge to edge in height: green below, dark in the turn, red above.
    // (Tried and left: the axis at s 797, before the step. There the front is 27 m higher at every metre flown; at
    // the eighth usual place all the tiers one can see are green already.) Nothing else of the plan moved.
    const TOWER_S = 822, tw = P(TOWER_S, -30), thL = TH[TOWER_S], legC = course(TOWER_S), legP = port(TOWER_S);
    const heroSite = (p) => {
      const x = tw.x + legP.x * p.x + legC.x * p.z, z = tw.z + legP.z * p.x + legC.z * p.z;
      return { x, y: p.y, z, m: TOWER_S + p.z, aside: Math.abs(30 - p.x) };   // on the straight leg, within 60 m of the axis
    };
    const hero = await buildHero(ctx, { inWorld: true, style, site: heroSite, detail: detail * (weather === 'rain' ? 1 : weather === 'drizzle' ? 0.65 : 0.45),
      ...(weather === 'after' ? { drips: 20, dripLen: 3 } : {}),   // (order 6, M1) twenty strings of 3 m drops to a gallery (it was twelve of 2.6 m): with the low banks at its foot gone, the tower's life after the rain is its streaming alone   // (order 3, G9) after the rain the tower streams: nine strings of long drops from every gallery
      ...(weather === 'drizzle' ? { rainLen: DRIZZLE_LEN, rainReach: 20 } : {}),   // (order 4, J4) drizzle: fine short strokes close to the rings only
      rain: detail * (weather === 'rain' ? RAIN_THIN : weather === 'drizzle' ? 1 : 0), rainMirror: 0,   // (order 5, L7) a third fewer; the water mirrors the lamps, not the rain   // (order 4, J4: drizzle now stands as many, short) (order 3, G2) the lead's decision by weather: the full curtain; half the strokes, not shorter; none after the rain
      // (order 3, E6) BY PLACE: the four guys go out square to the leg and along it (an eighth of a turn off the
      // diagonals), so that no anchor stands between the leg and the board and no guy crosses the board's picture
      flood: V3(flood.dot(legP), flood.y, flood.dot(legC)), guyTurn: Math.PI / 4 });
    hero.object.position.copy(tw); hero.object.rotation.y = -thL;
    hero.mirror.position.copy(tw); hero.mirror.rotation.y = -thL;
    upright.add(hero.object); yardMirror.add(hero.mirror);
    for (const s of hero.sites) all.push(s.turnAt);
    for (let k = 0; k < 12; k++) claim('tower gallery', V3(tw.x, 10 + 6 * k, tw.z), 11.8);
    // (order 1, C11) a guy is claimed along its SAG (the part hangs each 3.5 to 6.5 m: claimed at 5 m with 2 m about it)
    hero.anchors.guyAnchors.forEach((g) => { const w = heroSite(g), a = V3(tw.x, 78, tw.z), b = V3(w.x, 0.4, w.z); for (let i = 0; i <= 60; i++) { const p = a.clone().lerp(b, i / 60); p.y -= Math.sin(i / 60 * Math.PI) * 5; claim('tower guy', p, 2); } });
    await ctx.yield();

    // ROADS. Twelve roads at 5.5 m centres either side of the course (which flies over the six-foot between the
    // sixth and the seventh): one throat behind the entry, the fan to s 140, level and parallel to s 540, then
    // THE DELTA, where they braid together into the one line that runs into the apron's water at s 650.
    // (order 4, H4) THE TENT-LIKE PEAK at the leg's beginning was all twelve roads drawn into ONE line within a few
    // metres at s 660-690, weaving over each other: seen low it stood up as warped geometry. By place: the DRAWN
    // roads (drawn = 1: the rails, their flooded four-foots, the roads through a pool) gather from s 642 to 682 into
    // a plain DOUBLE LINE 5.5 m apart (six roads into each, as a throat does), which runs on level and straight into
    // the apron's water to s 724. Asked without `drawn`, the answer is as before: no lantern, post or body moved.
    const roadAside = (k, s, drawn = 0) => {
      if (drawn) { const dr = sstep(642, 682, s); return roadAside(k, Math.min(s, DELTA1), 0) * (1 - dr) + (k < 6 ? -2.75 : 2.75) * dr; }
      // (order 2, D4) BY PLACE: the delta lies 40 m farther along the route (s 580-690), so that the MIDDLE of its field
      // of lanterns stands at route metre 630, where the one formula's number is the metres flown at the high view
      // over it (538): the near half of its lanterns has turned, the far half has not
      const base = (k - 5.5) * 5.5, fan = 0.3 + 0.7 * sstep(-50, 140, s), dl = sstep(DELTA0, DELTA1, s), sn = Math.sin(dl * Math.PI);
      return base * fan * (1 - dl) + sn * sn * 5.2 * Math.sin((s - DELTA0) * 0.3 + k * Math.PI);
    };
    const rail = { pos: [], t: [], tint: [], idx: [] }, wat = { pos: [], idx: [] }, watCut = { pos: [], idx: [] };
    // one road through its centre points (on its rail level): a strip 2.7 m wide; o.flood: its four-foot is water
    const addRoad = (cps, o = {}) => {
      let v = 0; const base = rail.pos.length / 3, W = o.water || wat, wb = W.pos.length / 3, n = cps.length;
      for (let i = 0; i < n; i++) {
        const a = cps[Math.max(0, i - 1)], b = cps[Math.min(n - 1, i + 1)], c = cps[i];
        let nx = b.z - a.z, nz = a.x - b.x; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        if (i) v += c.distanceTo(cps[i - 1]);
        const tn = o.turnAt ?? tintAt(c, o.rail ?? 0), am = o.amount ?? 0.55, fl = o.flood && o.flood(i) ? 1 : 0;
        for (const sd of [-1, 1]) { rail.pos.push(c.x + nx * 1.35 * sd, c.y + 0.03, c.z + nz * 1.35 * sd); rail.t.push(1.35 * sd, v, fl); rail.tint.push(tn, 0, am); }
        if (o.flood) for (const sd of [-1, 1]) W.pos.push(c.x + nx * 0.62 * sd, c.y + 0.015, c.z + nz * 0.62 * sd);
        if (i) {
          const q = base + 2 * i; rail.idx.push(q - 2, q - 1, q, q - 1, q + 1, q);
          if (o.flood && fl && o.flood(i - 1)) { const w = wb + 2 * i; W.idx.push(w - 2, w - 1, w, w - 1, w + 1, w); }
        }
      }
    };
    // (order 4, H4) a road is laid each 2 m through the braid (each 4 m it stood as a kinked polyline), 4 m elsewhere
    const roadEnd = (k) => (k === 5 || k === 6 ? 724 : 660 + 4 * (k < 5 ? k : 11 - k));
    const roadPts = (k, s0, s1, step) => { const out = []; for (let s = s0; s <= s1 + 1e-6; s += (s >= DELTA0 - 4 && s < DELTA1 ? Math.min(step, 2) : step)) out.push(P(s, roadAside(k, s, 1))); return out; };
    for (let k = 0; k < 12; k++) {
      // alternate four-foots flooded over the fan and on to the bridge; the engine road and the goods road stay dry
      // (H4) the double line's two roads run on into the apron's water; the five that join each of them end one
      // after another where they meet it (a ladder of points, s 660 to 676), not all in one knot
      const wetRoad = k % 2 === 0 && k !== 8, endS = roadEnd(k);
      if (k === 8) { addRoad(roadPts(k, -60, 128, 4)); addRoad(roadPts(k, 504, endS, 4)); }   // between, it is the goods road
      else addRoad(roadPts(k, -60, endS, 4), { flood: wetRoad ? (i) => i < 173 : null });   // (i 159 is s 576; from there a point each 2 m: s 604)   // (order 3, E1) flooded on to the delta's first roads: water under the high view
      if (k % 4 === 3) await ctx.yield();
    }
    // THE GOODS ROAD: the eighth road's port neighbour... the road 13.75 m to port of s 130-500, closed into a loop
    // 1,900 m round that swings out to port and comes back behind the entry; never nearer the course than 9 m.
    // (order 4, J4d) BY SEED THE LOOP LIES TO STARBOARD INSTEAD (trainSide -1): along the road 24.75 m to starboard
    // of s 130-540 (the fifth road there, two roads behind the standing engine), swinging out to starboard over the
    // open ground inside the course's great bend (85 m and more from the leg, 105 m from the tower) and back behind
    // the entry; it passes under the starboard bridges between their legs and crosses the pole route midway
    // between two poles (s 15). Never nearer the course than 24 m.
    const loopCtl = []; for (let s = 130; s <= 500; s += 37) loopCtl.push(P(s, trainSide > 0 ? 13.75 : -24.75));
    for (const [s, a] of (trainSide > 0 ? [[540, 30], [575, 62], [585, 108], [560, 160], [500, 205], [410, 238], [300, 254], [180, 260], [60, 254], [-45, 230], [-112, 184], [-132, 128], [-115, 74], [-68, 34], [0, 17], [70, 13.75]]
      : [[540, -27], [575, -50], [590, -95], [568, -150], [505, -200], [410, -238], [300, -256], [180, -262], [60, -256], [-45, -234], [-112, -190], [-132, -134], [-115, -92], [-68, -70], [-20, -54], [15, -38.5], [60, -27], [100, -24.75]])) loopCtl.push(P(s, a));
    const loopCurve = new THREE.CatmullRomCurve3(loopCtl, true, 'centripetal'), loopLen = loopCurve.getLength();
    const loopSmp = [];   // (order 4, J4d) the loop's middle each 4 m (x, z): what stands in the train's road is not stood
    { const cps = loopCurve.getSpacedPoints(Math.round(loopLen / 4)); addRoad(cps); for (const p of cps) loopSmp.push(p.x, p.z); }
    await ctx.yield();
    // THE MAIN LINE in the cutting: two roads on the flooded floor from the end wall to the hood; their crowns
    // carry the rim's number (the lamp they run to), so its hairline lies along both rails toward us.
    for (const a of [-2.75, 2.75]) { const cps = [PC(MOUTH + 1.5, a, FLOOR_Y)]; for (let s = 1012; s <= 1262; s += 10) cps.push(P(s, a, FLOOR_Y)); addRoad(cps, { turnAt: rimNear(P(1241, a, FLOOR_Y)), amount: 0.9, rail: FLOOR_Y }); }
    const railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute('position', new THREE.Float32BufferAttribute(rail.pos, 3)); railGeo.setAttribute('aT', new THREE.Float32BufferAttribute(rail.t, 3));
    railGeo.setAttribute('aTint', new THREE.Float32BufferAttribute(rail.tint, 3)); railGeo.setIndex(rail.idx);
    const rails = new THREE.Mesh(railGeo, new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: RAIL_VS, fragmentShader: RAIL_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));   // crossing crowns do not add up
    rails.frustumCulled = false; rails.renderOrder = ORDER.film + 0.1; scene.add(rails);
    await ctx.yield();

    // THE WET FILM of the yard's level: open on standing water (the pools, by weather; the apron round the tower
    // and under the leg; the board's flood), shut on ballast; the pools go to their mean share by the footprint (3).
    // (order 2, D5) the apron's water wider and nearer: 58 m either side of the leg (46 before), 112 m round the tower
    // (96), and the board's flood moved with the board
    const fA = P(640, 0), fB = P(992, 0), fC = P(BOARD_AT[0] - 65, BOARD_AT[1] - 8), fD = P(BOARD_AT[0] + 17, BOARD_AT[1] + 6), g2 = (p) => `vec2(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`;
    // (order 1, B2) WATER FROM THE FIRST METRE: standing water lies wide (broad sheets some 55 m across with ragged
    // shores, besides the flooded four-foots and the apron): its threshold and its mean share by the seeded weather
    const pud = weather === 'after' ? [0.2, 0.95] : weather === 'drizzle' ? [0.5, 0.5] : [0.46, 0.58];
    const filmHead = /* glsl */`
uniform vec4 uPud;
float yardVn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(yardHash(i), yardHash(i + vec2(1., 0.)), f.x), mix(yardHash(i + vec2(0., 1.)), yardHash(i + 1.), f.x), f.y); }
float yardSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.)); }`;
    const filmMask = /* glsl */`
  // three scales of noise, each on its own turned grid, so that no shore runs square with the roads
  vec2 q1 = mat2(0.8776, 0.4794, -0.4794, 0.8776) * xz, q2 = mat2(0.3624, 0.932, -0.932, 0.3624) * xz, q3 = mat2(-0.5048, 0.8632, -0.8632, -0.5048) * xz;
  float n = 0.5 * yardVn(q1 / 19.) + 0.3 * yardVn(q2 / 8.3 + 31.) + 0.2 * yardVn(q3 / 3.7 + 11.), fp = length(fwidth(xz));
  float big = yardVn(mat2(0.6216, 0.7833, -0.7833, 0.6216) * xz / 55. + 7.3), nb = n + 0.5 * (big - 0.5);
  // near: hard shores; farther the broad sheets alone, soft, about their mean share; farthest the mean share (3)
  float pool = mix(smoothstep(uPud.x, uPud.x + 0.04, nb), mix(clamp(uPud.y + 1.5 * (big - 0.5), 0., 1.), uPud.y, smoothstep(14., 45., fp)), smoothstep(2.5, 9., fp));
  float lake = min(min(yardSeg(xz, ${g2(fA)}, ${g2(fB)}) - 58., length(xz - ${g2(tw)}) - 112.), yardSeg(xz, ${g2(fC)}, ${g2(fD)}) - 44.) + 10. * (n - 0.5);
  // (order 3, E4/E1) by place: a sheet of water round the arrival's tall post and before it (s 14-48), and the
  // sheet before the cutting's lip carried on round its mouth
  lake = min(lake, min(yardSeg(xz, ${g2(P(14, 4))}, ${g2(P(48, 7.5))}) - 8.5, yardSeg(xz, ${g2(P(992, 0))}, ${g2(P(1040, 0))}) - 46.) + 5. * (n - 0.5));
  return max(pool, 1. - smoothstep(-1., 1., lake));`;
    // the film's ground: everything round the cutting, which is left open (u along the main line from its end wall)
    const cw = PC(MOUTH, 0), cu = course(1100), cp = port(1100), fpos = [], fidx = [];
    // (cells of 60 m near the yard: one giant quad loses its depth where the near plane cuts it, and the film then
    // swallows the rails lying 3 cm over it)
    const cuts = (hole0, hole1) => { const a = [-1900, -1500, -1150, -900]; for (let v = -720; v <= 720; v += 60) a.push(v); a.push(900, 1150, 1500, 1900, hole0, hole1); return a.filter((v) => Math.abs(v) > 20 || v === hole0 || v === hole1).sort((p, q) => p - q); };
    const us = cuts(0.1, 280), ws = cuts(-14.9, 14.9), nu = us.length, nw = ws.length;
    for (let j = 0; j < nw; j++) for (let i = 0; i < nu; i++) fpos.push(cw.x + cu.x * us[i] + cp.x * ws[j], 0, cw.z + cu.z * us[i] + cp.z * ws[j]);
    for (let j = 0; j < nw - 1; j++) for (let i = 0; i < nu - 1; i++) {
      if (us[i] >= 0.1 && us[i + 1] <= 280 && ws[j] >= -14.9 && ws[j + 1] <= 14.9) continue;       // the cutting's opening
      const b = j * nu + i; fidx.push(b, b + nu + 1, b + 1, b, b + nu, b + nu + 1);
    }
    const filmGeo = new THREE.BufferGeometry(); filmGeo.setAttribute('position', new THREE.Float32BufferAttribute(fpos, 3)); filmGeo.setIndex(fidx);
    const film = makeWetFilm(style, { geometry: filmGeo, wet: 0.9, rings: ringK, head: filmHead, mask: filmMask, uniforms: { uPud: { value: new THREE.Vector4(pud[0], pud[1], 0, 0) } } });
    film.material.side = THREE.DoubleSide; film.material.polygonOffset = true; film.material.polygonOffsetFactor = 1; film.material.polygonOffsetUnits = 4; film.frustumCulled = false;
    const stripFilm = (W, order) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(W.pos, 3)); g.setIndex(W.idx);
      const m = makeWetFilm(style, { geometry: g, wet: 0.8, rings: ringK }); m.material.side = THREE.DoubleSide; m.frustumCulled = false; m.renderOrder = order; return m;
    };
    scene.add(stripFilm(wat, ORDER.film - 0.1), film);
    await ctx.yield();

    // LAMPS. The hand's faults: unequal strength (0.6 to 1), one in sixty dead. Each lamp near the course lights
    // its own rain (9 m round it, carrying its number); every lamp of the yard's level has its streak in the mirror.
    // (order 3, G2) the lead's decision by weather: rain, the full curtain; drizzle, the same strokes fewer by a half
    // (not shorter: they only fall slower); after the rain, none
    // (rainDraws: the draws of chance are made as before this pass, 1.5 to a stroke in drizzle, so that no body
    // that shares a stream with a lamp's rain moved; of the strokes drawn, the first rainK / rainDraws are stood)
    const rainK = weather === 'rain' ? 1 : weather === 'drizzle' ? 0.5 : 0, rainDraws = weather === 'rain' ? 1 : weather === 'drizzle' ? 1.5 : 0, UP = V3(0, 1, 0);
    const fault = (r) => (r.chance(1 / 60) ? 0 : r.range(0.6, 1));
    const rainReach = weather === 'drizzle' ? DRIZZLE_REACH : RAIN_REACH;   // (order 4, J4) the farthest a stroke is lit from its lamp, by the weather
    const lampRain = (r, pos, dir, L, n, reach = 9, rail = 0, of5 = 1) => {
      // the part's lit cone of rain in the lamp's beam (the same six draws of chance to a draw as before)
      const drawn = []; addLampRain(drawn, r, { pos, dir, turnAt: L.turnAt, doubt: L.doubt }, Math.round(n * rainDraws * detail), reach, rail);
      // (order 3, G2) A LAMP'S OWN RAIN IS UNDER THE ONE LAW TOO: a long stroke lit only inside a beam shows as a short
      // dash, so the strokes sown in the beam (one of each five drawn: FEW) are lit along their whole length by their
      // distance from this lamp, like every stroke of the world (R1), and fall 12 m
      const stood = rainDraws ? Math.round(drawn.length * rainK / rainDraws) : 0;
      for (let i = 0; i < stood; i++) { const st = drawn[i]; if (i % 5 >= (weather === 'drizzle' ? 3 : of5)) continue; st.lamp = { pos, reach: rainReach }; st.cone = undefined; st.amount = 1; st.own = 1; st.span = Math.min(12, Math.max(4, st.y - rail)); strokes.push(st); }
    };
    // a lamp looks back along the course at its own route metre, turned a little toward the flown line
    const lookBack = (p, turn = 0.12) => { const n = nearPlan(p.x, p.z), c = course(n.m), q = P(n.m, 0), t = V3(q.x - p.x, 0, q.z - p.z); if (t.lengthSq() > 1e-6) t.normalize(); return c.multiplyScalar(-1).addScaledVector(t, turn).normalize(); };
    // THE DWARF FILE, s 60-138: a ground signal at each turnout of the throat's ladder, 13 m apart, to port of the
    // seventh road's outer rail (3.0 to 4.2 m from the flown line); two lenses, red lowest
    const rd = rng.fork('dwarfs'), dwarfAt = (pos, r, o = {}) => {
      // (order 4, J3) o.ghost: not stood (a lamp mast stands there), every draw of chance taken as before (see addPost)
      const mark = o.ghost ? [S.dwarf.length, streakYard.length, strokes.length, claims.length, all.length] : null;
      const k = o.scale ?? 1, c = pos.clone().add(V3(0, 0.98 * k, 0)), L = lampAt(c); if (!L) return null;
      const dir = lookBack(pos, o.turn ?? 0.12), st = o.strength ?? fault(r);
      addDwarfSignal(o.ghost ? bVoid : bUp, S.dwarf, { pos, yaw: Math.atan2(dir.x, dir.z), turnAt: L.turnAt, doubt: L.doubt, strength: st, seed: r(), cracked: o.cracked, scale: k });
      const site = S.dwarf[S.dwarf.length - 1]; site.rank = o.rank; streakYard.push(site); claim('dwarf signal', c, 0.75 * k);
      if (o.rain) lampRain(r, c, dir, L, o.rain, 7);
      if (mark) { S.dwarf.length = mark[0]; streakYard.length = mark[1]; strokes.length = mark[2]; claims.length = mark[3]; all.length = mark[4]; return null; }
      return site;
    };
    // (order 1, C2) the file by the flown line: larger ground signals (1.6 times a dwarf: a case 1.8 m tall, its glass
    // at 1.6 m, where we fly), 4.33 m apart, so that along the whole file one stands at arm's length before us
    for (let i = 0; i < 19; i++) { const s = 60 + 4.333 * i; dwarfAt(P(s, roadAside(6, s) + 0.7175 + 0.75), rd, { strength: rd.range(0.8, 1), rain: 20, turn: 0.2, cracked: i === 13, scale: 1.6, rank: 'dwarf file' }); }
    // (order 3) one stream of chance for everything PASS E stands, forked from the dwarf file's own finished stream:
    // no draw is taken from the build's main stream, so every older draw of every seed stays what it was
    const rE = rd.fork('order 3');
    await ctx.yield();

    // POSTS. A semaphore post: a mast up to 2 degrees out of true, its arm 1.4 m to the left of the post as we come
    // (square-ended, a plate that turns about its pivot by its lamp's number: ARM_MOVE), its lamp beside the pivot.
    // A colour-light post carries a two-lens head instead. Posts stand in the six-foots, 5.5 m or more off the line.
    const rp = rng.fork('posts'), bUpReal = bUp, bArmReal = bArm;
    // (order 4, J1) o.ghost: the post is NOT STOOD (the home signal stands in its place), but every draw of chance
    // is taken as before, so no other post of any seed moves: its bars go to a builder that is never drawn (bVoid)
    // and its lamp, streak, rain and claims are taken back
    const bVoid = makeBodyBuilder(style);
    const addPost = (base, H, kind, r, o = {}) => {
      const bUp = o.ghost ? bVoid : bUpReal, bArm = o.ghost ? bVoid : bArmReal;
      const mark = o.ghost ? [S.small.length, S.dwarf.length, streakYard.length, strokes.length, claims.length, all.length] : null;
      const top = base.clone().add(V3(r.range(-0.035, 0.035) * H, H + 0.9, r.range(-0.035, 0.035) * H)), at = (y) => base.clone().lerp(top, y / (H + 0.9));
      const n = lookBack(base, 0.06), left = V3(-n.z, 0, n.x);   // the viewer's left as he comes
      const heads = o.co ? [H, H - 6.5] : [H]; let first = null;
      for (const h of heads) {
        const pv = at(h), lp = kind === 'arm' ? pv.clone().addScaledVector(left, -0.42).addScaledVector(n, 0.1) : at(h + 0.2).addScaledVector(n, 0.2);
        const L = lampAt(lp); if (!L) continue; first = first || L;
        const site = { pos: lp, dir: n, turnAt: L.turnAt, doubt: L.doubt, strength: fault(r), seed: r(), gain: o.gain, scale: o.scale, rank: o.co && h === H ? undefined : o.rank };   // (order 6, M2) its rank: the file it stands in (a tall post's upper head stands over the rank, alone)
        if (kind === 'arm') {
          S.small.push(site);
          // (order 1, C3) o.arm: the arm's size by place (the mast wood's arms are half as large again: a blade 3.3 m
          // by 0.45 m, plain at the eye's height from 5 m)
          const aS = o.arm ?? 1, q = (x, y) => pv.clone().addScaledVector(left, x * aS).add(V3(0, y * aS, 0)).addScaledVector(n, 0.03), t = [L.turnAt, L.doubt, 0.5];
          bArm.plate(q(-0.75, 0.15), q(1.45, 0.15), q(1.45, -0.15), q(-0.75, -0.15), { pivot: q(0, 0), spin: n, tint: t, codes: [1, 0.5] });
          claim('semaphore arm', pv, 1.7 * aS);
        } else { site.pos = lp; S.dwarf.push(site); bUp.bar(at(h - 0.5), lp.clone().add(V3(0, -0.5, 0)), 0.05, { carrier: 0.5 }); }
        streakYard.push(site);
        if (o.rain) lampRain(r, lp, n, L, o.rain, 9);
      }
      const t = first ? [first.turnAt, first.doubt, 0.6] : [0, 0, 0];
      bUp.bar(base, top, 0.1 * (o.mast ?? 1), { tint: t, carrier: 1.0 * (o.mast ?? 1) }); bUp.bar(at(H + 0.9), at(H + 1.5), 0.03, { carrier: 0.4 });
      bUp.bar(at(0.4).addScaledVector(n, -0.3), at(H - 0.4).addScaledVector(n, -0.3), 0.025, { carrier: 0.4 });   // its ladder
      // (order 3, G7) LIMIT 1: mast and ladder are ONE black body: a black face (band-less) from the mast's axis to
      // the ladder's stile hides what showed between the two lines; it takes the post's lamp as a lit face (M3)
      bUp.plate(at(0.4), at(H - 0.4), at(H - 0.4).addScaledVector(n, -0.3), at(0.4).addScaledVector(n, -0.3), { codes: [0, 0], tint: [t[0], t[1], 0] });
      claimBar('post', base, top, 0.35);
      if (mark) { S.small.length = mark[0]; S.dwarf.length = mark[1]; streakYard.length = mark[2]; strokes.length = mark[3]; claims.length = mark[4]; all.length = mark[5]; }
    };
    // THE MAST WOOD, s 150-262: semaphore posts 7 to 10 m apart on every six-foot; one in seven a 16 to 20 m post
    // with co-acting arms; the nearest lines 5.5 m off
    let nPosts = 0;
    for (const j of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
      let nth = 0;
      for (let s = 150 + rp.range(0, 6); s < 262; s += rp.range(7, 10)) {
        const tall = rp.chance(1 / 7);
        // (order 5, K3) THE FAR FIELD HOLDS HALF AS MANY MASTS, by place and by density alone: from s 200 on, in the
        // six-foots 22 m and more from the plan line, every second post of its line is not stood (its draws are
        // kept: o.ghost), so that the home signal and then the engine stand against a calm ground
        const thin = Math.abs(j) >= 4 && s > 200 && (nth++ & 1) === 1;
        // (order 4, J1) THE HOME SIGNAL STANDS IN A CLEARING OF THE WOOD: from s 190 to s 246 the three six-foots either
        // side of the flown line carry no post but the home signal and its fellow, so that from under it the wood's
        // other posts stand as a rank low in the picture and the yard lies small at its foot (HOME_CLEAR)
        const ghost = thin || HOME.some(([hs, ha]) => Math.abs(s - hs) < 8.5 && Math.abs(j * 5.5 - ha) < 4) || (Math.abs(j) <= 3 && s > HOME_CLEAR[0] && s < HOME_CLEAR[1]);
        // (order 4, J4c) THE SIGNALS THAT LEAD STAND IN THE MAST WOOD TOO (the seeded look, plain at 0.16): semaphore
        // posts as before; or colour-light posts (two-lens heads 1.1 m by 2.2 m on the same masts); or ground
        // signals, over which the home signal and its fellow stand alone. The same places and draws of height.
        const pb = P(s, j * 5.5 + rp.range(-0.25, 0.25)), ph = tall ? rp.range(16, 20) : 10 + rp.range(-0.5, 0.6), pr = Math.abs(j) < 4 ? 7 : 0;
        if (lead === 'dwarfs') dwarfAt(pb, rp, { rain: pr, scale: 1.3, ghost, rank: 'wood' + j });
        else if (lead === 'lights') addPost(pb, ph, 'light', rp, { co: tall, rain: pr, scale: Math.abs(j) === 1 ? 2.2 : 1.8, gain: 2.2, mast: 1.6, ghost, rank: 'wood' + j });
        else addPost(pb, ph, 'arm', rp, { co: tall, rain: pr, arm: 1.5, scale: Math.abs(j) === 1 ? 2.5 : 1.8, mast: 1.6, ghost, rank: 'wood' + j });
        nPosts++;   // (order 3, E2) the two lines by the flown line carry large spectacle glasses (0.45 m)
      }
      await ctx.yield();
    }
    // (order 4, J1) THE HOME SIGNAL AND ITS FELLOW, BY PLACE (HOME: route metre, metres to port, the pivot's height,
    // the arm's size, the glass's): ONE great semaphore on a lattice post 4.8 m to STARBOARD of s 207.5, its blade
    // 7.9 m long reaching back over the flown line 8 m above us, its spectacle a glass 1.2 m across with its own lit
    // rain. We fly close under it (4.3 m up) and the gaze goes up along its post from s 150 to s 214. By the one
    // formula from its own place its number is 191: its arm comes down as we come up to it (flown 183 to 191) and
    // its wet blade carries its glass's green. Its fellow, 16 m up and 5.6 m to port of s 240, has the number 216:
    // still red behind it while we look. The posts of the wood that would stand in their places are not stood.
    // rJ: one stream of chance for all that PASS J stands, forked from the dwarf file's finished stream (as rE was):
    // no draw is taken from any stream still in use, so every older draw of every seed stays what it was
    const homeAt = [], rJ = rd.fork('order 4, pass J');
    const standHome = () => { for (const [hs, ha, hH, aS, gl] of HOME) {   // called where the ironwork's makers stand (lattice)
      const base = P(hs, ha), n = lookBack(base, 0.06), left = V3(-n.z, 0, n.x), pv = base.clone().setY(hH);
      // (the glass stands 0.8 m before the blade on its bracket, so that the blade's wet face looks at it and carries its light)
      const lp = pv.clone().addScaledVector(left, -0.5 * aS).addScaledVector(n, 0.8), L = lampAt(lp); if (!L) continue;
      const t = [L.turnAt, L.doubt, 0.8], rH = rJ.fork('home ' + hs), w = 0.14 * aS, site = { pos: lp, dir: n, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: rH(), scale: gl, back: 1 };   // (back 1: its glass lights its own blade and post in full)
      S.small.push(site); streakYard.push(site); homeAt.push({ pv, L, site });
      lattice(bMir, base, left, n, w, hH - 0.5 * aS, 0.02 * aS, { name: 'home signal post', tint: t });
      bMir.bar(pv.clone().setY(hH - 0.5 * aS), pv.clone().setY(hH + 0.55 * aS), 0.04 * aS, { tint: t, carrier: 0.5 * aS }); bMir.bar(pv.clone().setY(hH + 0.55 * aS), pv.clone().setY(hH + 0.85 * aS), 0.012 * aS, { carrier: 0.4 });   // the doll and its finial
      // its landing under the arm, with a rail, and the ladder up the far face
      const k = (x, y, z) => pv.clone().addScaledVector(left, x * aS).add(V3(0, y * aS, 0)).addScaledVector(n, z * aS);
      bMir.plate(k(-0.42, -0.62, -0.3), k(0.42, -0.62, -0.3), k(0.42, -0.62, 0.3), k(-0.42, -0.62, 0.3), { codes: [1, 0.5], tint: t });
      bMir.chain([k(-0.42, -0.62, 0.3), k(-0.42, -0.3, 0.3), k(0.42, -0.3, 0.3), k(0.42, -0.62, 0.3)], 0.008 * aS, { carrier: 0.3 });
      bMir.bar(base.clone().addScaledVector(n, -w - 0.12).setY(0.4), k(0, -0.62, 0).addScaledVector(n, -w - 0.12), 0.03, { carrier: 0.4 });
      // the blade (it turns about its pivot by its lamp's number: ARM_MOVE) and the spectacle's plate beside the pivot
      const q = (x, y) => pv.clone().addScaledVector(left, x * aS).add(V3(0, y * aS, 0)).addScaledVector(n, 0.05 * aS);
      bArm.plate(q(-0.75, 0.2), q(1.45, 0.2), q(1.45, -0.2), q(-0.75, -0.2), { pivot: q(0, 0), spin: n, tint: [L.turnAt, L.doubt, 0.5], codes: [1, 0.5] });
      bMir.bar(pv.clone().addScaledVector(left, -0.5 * aS).addScaledVector(n, 0.05 * aS), lp.clone().addScaledVector(n, -0.1), 0.06, { carrier: 0.5 });
      lampRain(rH, lp, n, L, 36, 11);
      claim('semaphore arm', pv, 1.7 * aS); claim('home signal glass', lp, 0.3 * gl);
    } };
    // THE DROWNED LINE: colour-light posts standing in the apron's water either side of the leg, 8.5 m off, each
    // 22 m, s 660-1000: their lamps lie long in the water from our feet to the tower and the board
    // (order 2, D4) where the delta's last roads now run beside the leg (to s 698) a post stands clear of every road:
    // 8.5 m off, or by half metres farther until no road's middle lies within 1.9 m of it
    const offRoads = (s, sd) => { let a = 8.5; while (s < DELTA1 && a < 14 && Array.from({ length: 12 }, (_, k) => roadAside(k, s)).some((r) => Math.abs(r - sd * a) < 1.9)) a += 0.5; return sd * a; };
    // (order 2, D5) the line runs on to the cutting's lip: one more post, to starboard of s 1003
    for (let i = 0; i < 22; i++) { const s = 662 + i * 15.5, sd = i % 2 ? 1 : -1; addPost(P(s, offRoads(s, sd)), 6.6 + rp.range(-0.3, 0.3), 'light', rp, { rain: 8, gain: 2.2, scale: 1.4, rank: 'off' + sd }); nPosts++; }
    await ctx.yield();
    // THE SIGNALS THAT LEAD the side country (the seeded look): semaphore arms, colour-light heads, or dwarf lamps
    // along every road; s 262-540, clear of the bridge at s 475 and of the engine's side of the course at s 290-430
    const rs = rng.fork('side');
    for (const j of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6]) {
      let nth = 0;
      for (let s = 268 + rs.range(0, 12); s < 540; s += rs.range(13, 21) / density) {
        const a = j * 5.5 * (1 - sstep(540, 650, s)), skip = (s > 458 && s < 494) || (Math.abs(j) <= 2 && s > 405 && s <= 458) /* (order 4, J1) the two six-foots either side of the flown line stand clear before the bridge: no post crosses the row of heads */ || (j === 1 && s < 430) || (j === 2 && s < ENG_AT[0] + 62) /* (order 5, K1) the flown line swings to port here: the two six-foots it crosses and nears stand clear */ || ((j === -1 || j === -2) && s <= 458) || (j === -3 && s > ENG_AT[0] - 40 && s < ENG_AT[0] + 35);   // (order 5, K1/K2) no post stands in the two starboard six-foots next the flown line from the wood's end to the bridge: none between us and the engine, none before the lens as we turn from the engine to the bridge's row   // (order 3, E3) the six-foots between us and the engine on the third road, and both beside it   // (C4) both six-foots by the engine stand clear
        const h0 = rs.range(8, 11), jx = rs.range(-0.25, 0.25);
        if (skip) continue;
        // (order 3, G4) the skew bridge's deck (10.5 m up) now passes over places outside the old gap: a post under
        // it is no taller than 8 m, and one that would stand in an end leg stands 5 m on (the draws of chance as before)
        const sB = BRIDGE_S + a * Math.tan(BRIDGE_SKEW), inLeg = Math.abs(Math.abs(a) - 33) < 2 && Math.abs(s - sB) < 3, sp = inLeg ? s + 5 : s, h = Math.abs(sp - sB) < 4.5 ? Math.min(h0, 8) : h0;
        // (order 5, K3) the far field holds half as many masts to the bridge (s 432): in the six-foots 16 m and more
        // from the plan line every second post of its line is not stood (its draws are kept)
        const thin = Math.abs(j) >= 3 && sp < 432 && (nth++ & 1) === 1;
        const ghost = thin || MASTS.some(([ms, ma]) => Math.abs(sp - ms) < 5.5 && Math.abs(a - ma) < 3.5)   // (order 4, J3) a lamp mast stands in this six-foot here
          || (Math.abs(a - PORT_LEAD[3]) < 3.5 && Array.from({ length: PORT_LEAD[1] }, (_, i) => PORT_LEAD[0] + i * PORT_LEAD[2]).some((ls) => Math.abs(sp - ls) < 1.2));   // (order 6, P1) a lantern of the port file stands in this six-foot here: a post within 1.2 m of it is not stood (its draws kept)
        if (lead === 'dwarfs') dwarfAt(P(sp, a + jx), rs, { rain: Math.abs(j) < 3 ? 6 : 0, ghost, rank: 'side' + j });
        else addPost(P(sp, a + jx), lead === 'arms' ? h : h - 2.5, lead === 'arms' ? 'arm' : 'light', rs, { rain: Math.abs(j) < 3 ? 6 : 0, ghost, rank: 'side' + j });
        nPosts++;
      }
      await ctx.yield();
    }

    // IRONWORK MAKERS. A box of wet plate (its upright edges baked from the floodlight, rims as thin bars) and a
    // Warren truss between two points; both in the part's black-body style.
    const tintP = (p, am = 0.5, rail = 0) => [tintAt(p, rail), 0, am];
    const addBox = (b, c, ux, uz, hx, hy, hz, o = {}) => {
      const k = (sx, sy, sz) => c.clone().addScaledVector(ux, sx * hx).add(V3(0, sy * hy, 0)).addScaledVector(uz, sz * hz), t = o.tint || tintP(c, 0.5);
      const ring = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      const ta = [t[0], t[1], t[2] * (o.area ?? 0.4)];   // as area a plate takes less than its edges do
      for (let i = 0; i < 4; i++) { const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % 4]; b.plate(k(x0, -1, z0), k(x0, 1, z0), k(x1, 1, z1), k(x1, -1, z1), { tint: ta }); }
      b.plate(k(1, 1, 1), k(-1, 1, 1), k(-1, 1, -1), k(1, 1, -1), { codes: [0, 0] });
      if (!o.bare) for (const sy of [-1, 1]) b.chain(ring.map(([x, z]) => k(x, sy, z)), o.rim ?? 0.05, { closed: true, carrier: 0.6, tint: t });
    };
    const truss = (b, A, B, yb, yt, panels, r, o = {}) => {
      const pt = (i, y) => A.clone().lerp(B, i / panels).setY(y), t = o.tintAt || (() => undefined);
      for (let i = 0; i < panels; i++) {
        b.bar(pt(i, yb), pt(i + 1, yb), r * 1.3, { tint: t(i) }); b.bar(pt(i, yt), pt(i + 1, yt), r * 1.3, { tint: t(i) });
        b.bar(pt(i, i % 2 ? yt : yb), pt(i + 1, i % 2 ? yb : yt), r, { tint: t(i) });
        if (o.posts) b.bar(pt(i, yb), pt(i, yt), r * 0.8, { tint: t(i) });
        // (order 3, M3/M4) a girder is a black body with its bracing on it: a black web (no band) panel by panel
        b.plate(pt(i, yb), pt(i, yt), pt(i + 1, yt), pt(i + 1, yb), { codes: [0, 0], tint: t(i) });
      }
      b.bar(pt(panels, yb), pt(panels, yt), r, {});
    };
    // a lattice leg: four corner bars with zigzag bracing on two faces
    const lattice = (b, base, ux, uz, w, H, r, o = {}) => {
      const c = (sx, sz, y) => base.clone().addScaledVector(ux, sx * w).addScaledVector(uz, sz * w).setY(base.y + y), n = Math.max(2, Math.round(H / (w * 2.6)));
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) b.bar(c(sx, sz, 0), c(sx, sz, H), r, o);
      // (order 3, M4) BLACK FACES HIDE: a lattice leg is a black body with its lattice on it, never lines alone:
      // four black faces (no band) just inside its corner bars hide what stands behind it, and carry the light of
      // the lamp it stands by as a filled soft patch (M3: a mast's foot)
      { const q = 0.9, cs = [[1, 1], [-1, 1], [-1, -1], [1, -1]]; for (let i = 0; i < 4; i++) { const [x0, z0] = cs[i], [x1, z1] = cs[(i + 1) % 4]; b.plate(c(x0 * q, z0 * q, 0), c(x0 * q, z0 * q, H), c(x1 * q, z1 * q, H), c(x1 * q, z1 * q, 0), { codes: [0, 0], tint: o.tint }); } }
      for (let i = 0; i < n; i++) { const y0 = H * i / n, y1 = H * (i + 1) / n, f = i % 2 ? 1 : -1; b.bar(c(f, 1, y0), c(-f, 1, y1), r * 0.6, o); b.bar(c(1, f, y0), c(1, -f, y1), r * 0.6, o); b.bar(c(f, -1, y0), c(-f, -1, y1), r * 0.6, o); b.bar(c(-1, f, y0), c(-1, -f, y1), r * 0.6, o); }
      claimBar(o.name || 'lattice leg', base, c(0, 0, H), w * 1.5);
    };
    standHome();   // (order 4, J1) the home signal and its fellow
    // THE COALING TOWER, 40 m, a wet hopper on four legs 27.9 m to port of s 72: from the entry the floodlight stands
    // between its legs. In the mirror too (the fan's flooded four-foots lie before it).
    {
      // (order 1, C1) BY PLACE: large and near to port as we arrive: 27.9 m to port of s 72 (55 m from the eye at
      // s 25, where the floodlight stands between its legs), astride the outermost road of the fan and turned 8
      // degrees with it, so that road runs under its chutes between the legs
      // (order 3, E4) BY PLACE: the coaling tower stands WHOLE in the arrival's picture: 64 m to STARBOARD of s 118
      // (113 m from the eye at s 25: its 43 m stand whole under the picture's top on the side away from the tall
      // post, a black body before the far band), beyond the fan's outermost road and the pole route
      const c = P(118, -64), uz = course(118).addScaledVector(port(118), 0.14).normalize(), ux = V3(uz.z, 0, -uz.x).multiplyScalar(port(118).dot(V3(uz.z, 0, -uz.x)) < 0 ? -1 : 1), t = tintP(c.clone().setY(20), 0.7);
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) lattice(bMir, c.clone().addScaledVector(ux, sx * 6).addScaledVector(uz, sz * 6), ux, uz, 0.7, 22, 0.16, { tint: t, name: 'coaling tower' });
      // (order 4, H5) THE HOPPER IS A BLACK-FACED BODY WITH ITS BANDS, LIKE EVERY BODY (it stood as an empty wire box
      // beside the solid lattice): four walls of wet plate with upright stiffeners each 2 m and four hoops, a sloping
      // bottom down to the chutes, a pitched roof; and, as a coaling stage has, a LAMP on a bracket before each wall
      // and one hanging under the bottom (lamps like every lamp: the one formula at their own places, about 150 to
      // 160: red as we arrive), so that its wet walls carry graded lamp light and it stands as a solid in the sky
      {
        const k = (sx, y, sz, h = 8) => c.clone().addScaledVector(ux, sx * h).addScaledVector(uz, sz * h).setY(y), ring4 = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
        for (let i = 0; i < 4; i++) {
          const [x0, z0] = ring4[i], [x1, z1] = ring4[(i + 1) % 4], nrm = ux.clone().multiplyScalar((x0 + x1) / 2).addScaledVector(uz, (z0 + z1) / 2).normalize();
          bMir.plate(k(x0, 22, z0), k(x0, 36, z0), k(x1, 36, z1), k(x1, 22, z1), {});
          bMir.plate(k(x0, 22, z0), k(x0, 17, z0, 2.4), k(x1, 17, z1, 2.4), k(x1, 22, z1), { codes: [0.5, 0.5] });
          bMir.plate(k(x0, 36, z0), c.clone().setY(40), c.clone().setY(40.001), k(x1, 36, z1), { codes: [0, 0] });
          for (let j = 1; j < 8; j++) { const a = k(x0, 22, z0).lerp(k(x1, 22, z1), j / 8).addScaledVector(nrm, 0.14); bMir.bar(a, a.clone().setY(36), 0.09, { carrier: 0.7 }); }
          const lp = k(x0, 30.5, z0).lerp(k(x1, 30.5, z1), 0.5).addScaledVector(nrm, 1.7), L = lampAt(lp);
          if (L) {
            const site = { pos: lp, dir: nrm, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: 0.17 + 0.21 * i, scale: 2.4, back: 1 };
            S.target.push(site); streakYard.push(site);
            bMir.bar(lp.clone().addScaledVector(nrm, -1.7).setY(32.2), lp.clone().addScaledVector(nrm, -0.1).setY(31.4), 0.07, { carrier: 0.6 });
          }
        }
        for (const y of [22, 26.7, 31.3, 36]) bMir.chain(ring4.map(([x, z]) => k(x, y, z, 8.13)), y === 22 || y === 36 ? 0.12 : 0.08, { closed: true, carrier: 0.7 });
        const lp = c.clone().setY(15.2), L = lampAt(lp);
        if (L) { const site = { pos: lp, dir: lookBack(lp, 0.3), turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: 0.61, scale: 2, back: 1 }; S.target.push(site); streakYard.push(site); bMir.bar(c.clone().setY(17), lp, 0.05, { carrier: 0.5 }); }
      }
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) bMir.bar(c.clone().addScaledVector(ux, sx * 8).addScaledVector(uz, sz * 8).setY(36), c.clone().setY(40), 0.09, { tint: t });
      bMir.bar(c.clone().setY(40), c.clone().setY(43), 0.05, {});
      for (const sx of [-1, 1]) { bMir.bar(c.clone().addScaledVector(ux, sx * 2.5).setY(22), c.clone().addScaledVector(ux, sx * 3.5).setY(15), 0.5, { tint: t, carrier: 2.2 }); }   // the chutes
      for (const y of [8, 15]) for (const sz of [-1, 1]) bMir.bar(c.clone().addScaledVector(ux, -6).addScaledVector(uz, sz * 6).setY(y), c.clone().addScaledVector(ux, 6).addScaledVector(uz, sz * 6).setY(y), 0.1, { tint: t });
      claim('coaling tower', c.clone().setY(29), 12);
    }
    // (order 3, E4) THE ARRIVAL'S ONE THING TO LOOK AT: a tall searchlight signal on a lattice post in the six-foot
    // 7 m to port of s 38, its round target 2.9 m across, its glass 9.5 m up, looking back at whoever arrives.
    // By the one formula from its own place its number is about 39: it is red as we arrive and answers us first, as
    // we pass under it. It stands in a sheet of water (the film's mask below) that carries its long streak to our feet.
    let arrival = null;
    {
      const lp = P(38, 7.0, 9.5), L = lampAt(lp), base = P(38.6, 7.1);
      if (L) {
        const dir = lookBack(lp, 0.25), site = { pos: lp, dir, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: 0.23, scale: 3.6 };
        S.target.push(site); streakYard.push({ ...site, gain: 1.8 }); arrival = { site, L };   // (order 5, L7) the arrival's great glass keeps its long mirror to our feet at its old strength
        lampRain(rE.fork('arrival'), lp, dir, L, 30, 11);
        lattice(bMir, base, port(42), course(42), 0.3, 8.2, 0.06, { name: 'arrival post', tint: [L.turnAt, L.doubt, 0.8] });
        bMir.bar(base.clone().setY(8.2), base.clone().setY(11.6), 0.11, { tint: [L.turnAt, L.doubt, 0.8] }); bMir.bar(base.clone().setY(11.6), base.clone().setY(12.5), 0.03, { carrier: 0.4 });
        bMir.bar(base.clone().setY(9.5), lp.clone().addScaledVector(dir, -0.08), 0.08, { carrier: 0.6 });
        bMir.plate(base.clone().setY(7.9).addScaledVector(port(42), -0.7), base.clone().setY(7.9).addScaledVector(port(42), 0.7), base.clone().setY(7.9).addScaledVector(port(42), 0.7).addScaledVector(dir, -0.9), base.clone().setY(7.9).addScaledVector(port(42), -0.7).addScaledVector(dir, -0.9), { codes: [1, 0.5] });   // its landing
        claim('arrival post', lp, 1.5);
      }
    }
    await ctx.yield();
    // SIGNAL BRIDGES. A Warren truss on trestle legs, crossing the roads askew; a two-lens head on a doll over each
    // road it spans, lamps 2 m over the deck, looking back along the course. sC: where it crosses the flown line.
    const rb = rng.fork('bridges'), dripAt = []; let mainHeads = [], mainAt = [];
    const addBridge = (b, sC, a0, a1, skew, deck, o = {}) => {
      const at = (a, y) => P(sC + a * Math.tan(skew), a, y), uz = course(sC), A = at(a0, 0), B = at(a1, 0), span = A.distanceTo(B), panels = Math.max(4, Math.round(span / 6));
      const heads = [];
      for (let k = 0; k < 12; k++) {
        const a = (k - 5.5) * 5.5; if (a < a0 + 1 || a > a1 - 1) continue;
        // (order 4, J1) o.headUp: the lamp's height over the deck (2 m; the twelve-road bridge's large heads 2.6 m)
        const hp = at(a, deck + (o.headUp ?? 2)).addScaledVector(lookBack(at(a, 0), 0), 1.5), L = lampAt(hp); if (!L) continue;
        const dir = lookBack(hp, 0.05), site = { pos: hp, dir, turnAt: L.turnAt, doubt: L.doubt, strength: o.main ? rb.range(0.8, 1) : fault(rb), seed: rb(), scale: o.scale ?? (o.main ? 1.9 : 1.3), noPool: !!o.noPool, rank: 'bridge' + sC };
        S.dwarf.push(site); streakYard.push(site); heads.push([a, L, hp]);
        b.bar(at(a, deck).addScaledVector(dir, 1.2), hp.clone().add(V3(0, o.headUp ? 0.45 - 0.6 * site.scale : -0.7, 0)).addScaledVector(dir, -0.25), 0.07, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.7] });   // its doll
        b.bar(at(a, deck).addScaledVector(dir, 0), at(a, deck).addScaledVector(dir, 1.3), 0.06, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.5] });
        if (o.main || o.rain) lampRain(rb, hp, dir, L, o.rain || 10, 9);
      }
      for (let i = 0; i < (o.spare || 0); i++) { fault(rb); rb(); }   // (order 5, K2) a head no longer stood: its draws are kept
      const tintAtPanel = (i) => { const a = a0 + (a1 - a0) * (i + 0.5) / panels; let best = null, bd = 1e9; for (const [ha, L] of heads) if (Math.abs(ha - a) < bd) { bd = Math.abs(ha - a); best = L; } return best ? [best.turnAt, best.doubt, 0.6] : undefined; };
      for (const sz of [-1.2, 1.2]) truss(b, A.clone().addScaledVector(uz, sz), B.clone().addScaledVector(uz, sz), deck, deck + 3, panels, 0.12, { tintAt: tintAtPanel });
      for (let i = 0; i <= panels; i++) { const p = A.clone().lerp(B, i / panels); b.bar(p.clone().addScaledVector(uz, -1.2).setY(deck), p.clone().addScaledVector(uz, 1.2).setY(deck), 0.08, { carrier: 0.7 }); }
      // trestle legs in the six-foots: at the ends and (the twelve-road bridge) at the thirds
      for (const a of o.legs) { const base = at(a, 0); lattice(b, base, port(sC), uz, 0.55, deck, 0.11, { name: 'bridge leg', tint: tintAtPanel(Math.round((a - a0) / (a1 - a0) * panels)) }); }
      claimBar('bridge deck', A.clone().setY(deck + 1.5), B.clone().setY(deck + 1.5), 2.6);
      if (o.main) { mainHeads = heads.map(([, L]) => Math.round(L.turnAt)); mainAt = heads.map(([a, L, hp]) => ({ p: at(a, deck + 2), t: L.turnAt, h: hp })); }
      for (let i = 0; i < (o.drips || 0); i++) dripAt.push(A.clone().lerp(B, rb.range(0.04, 0.96)).addScaledVector(uz, rb.pick([-1.2, 1.2])).setY(deck - 0.15));
    };
    // THE TWELVE-ROAD BRIDGE at s 475, 25 degrees off square, deck 10.5 m up; legs at the ends and the thirds.
    // (order 1, C5) BY PLACE: stood 10 m later than the first build had it, its twelve heads' numbers (by the one
    // formula, from their own places) run from 421 at the starboard end to 439 at the port end, so the front stands
    // IN the row while we come up to it (s 415 to 440): green to starboard, dark in mid turn, red to port. Nothing
    // else of the plan moved with it but the side signals' gap under it.
    // (order 3, G4/F7: THE BRIDGE'S FRONT OVER A STRETCH, BY PLACE, never by the formula) at 25 degrees its heads'
    // numbers ran 420 to 439 and the front stood in the row for 29 m of flight (410 to 439 flown). The bridge now
    // crosses the fan ASKEW BY 45 DEGREES (BRIDGE_SKEW; railways build skew bridges), still over the flown line at
    // s 475: its heads' own places spread from s 445 (starboard) to s 505 (port), so their numbers by the one formula
    // run from about 392 to 450 and the front walks the row over some 60 m of flight (see the report's bridgeRow).
    // (it crosses the flown line at s 471, BRIDGE_S, 4 m sooner: askew, its deck lies longer over the line, which
    // climbs from s 478; at s 475 the deck's far side stood 2.17 m from it, here 2.69 m)
    // (order 4, J1) THE ROW OF HEADS CROSSES THE PICTURE LARGE: each head a case 1.8 m by 3.6 m with glasses 0.75 m
    // across (scale 3; it was 1.9), its middle 2.6 m over the deck. (NEARER BY THE LINE IS NOT TO BE HAD: under the
    // one formula a head 13 m up turns when we are still 33 m and more before it, so a row that holds the front
    // while we look stands that far off; the cure is the heads' size and the gaze, which goes a little to
    // starboard and up into the row's near half from s 370 to s 447.)
    addBridge(bMir, BRIDGE_S, -33, 33, BRIDGE_SKEW, 10.5, { main: true, legs: [-33, -11, 11, 33], drips: 14, scale: 3, headUp: 2.6 });
    await ctx.yield();
    // four lesser bridges over the side roads (starboard at s 300 and s 528, port at s 372 and over the fan's end)
    // (order 5, K2/K3) THE STARBOARD BRIDGE OF S 300 IS NOT STOOD: it crossed the engine's road 16 m before its
    // buffers, its near leg 11 m from the flown line (the lattice cut by the picture's edge as we came up to the
    // engine), and anywhere along the engine's stretch it stands in the engine's ground. By density alone: its draws
    // of chance are still taken (it is built into the builder that is never drawn and its lamps, claims and drips
    // are taken back, as a post's are: o.ghost), so every later bridge keeps its own.
    { const mark = [S.dwarf.length, streakYard.length, claims.length, all.length, dripAt.length];
      addBridge(bVoid, 300, -33, -11, -0.2, 8.5, { legs: [-33, -11], drips: 3 });
      S.dwarf.length = mark[0]; streakYard.length = mark[1]; claims.length = mark[2]; all.length = mark[3]; dripAt.length = mark[4]; }
    // (order 5, K2) the port bridge of s 372 stands back too: over the two outer roads at s 358 (legs 22 and 38.5 m
    // off the plan line, 15 m and more from the flown line, which swings to port here); a head's draws kept
    addBridge(bUp, ENG_AT[0] + 39, 22, 38.5, 0.25, 8.5, { legs: [22, 38.5], drips: 3, spare: 1 });
    addBridge(bUp, 528, -33, -11, 0.3, 9, { legs: [-33, -11], drips: 3 });
    addBridge(bUp, 150, 22, 44, -0.15, 9, { legs: [22, 44], drips: 2 });
    // (order 3, E1) THE GANTRY OVER THE CUTTING'S MOUTH, s 1046: a truss from bank to bank 12.5 m over the yard, a
    // strict rank of ten large heads looking back at whoever comes to the lip. By the one formula from their own
    // places they turn at about 950: from the lip on they are green, and their long streaks lie in the lip's water
    // toward our feet (the water before the mouth has nothing else above it to carry). No pool: they stand over the hole.
    // (ten heads: the gantry runs on over both banks, 61 m, so the whole width of the lip's water carries streaks)
    addBridge(bUp, 1046, -30.5, 30.5, 0, 12.5, { legs: [-30.5, -17.5, 17.5, 30.5], drips: 4, scale: 2.2, rain: 8, noPool: true });
    await ctx.yield();

    // (order 4, J3) THE TALL LAMP MASTS OF THE YARD (MASTS at the head): a lattice mast in two stages, 26 to 34 m to
    // its top, carrying a strict RING of eight lamps on a hoop 6.8 m across that faces the route metre it is aimed
    // at. Lamps like every lamp: each takes its number from the one formula at its own place (lampAt: so high a lamp
    // turns some 40 m of flight later than one at the rail, the ring's foot before its crown; where the number would
    // pass the last lamp's, no lamp is stood); its halo by the rule (yardNeighbours), its streak in the yard's water
    // (streakYard), its light on the mast's own wet faces (the lit face's law), and THE MAST'S LIT RAIN: strokes sown
    // by place in a tall cone under the ring, each lit by its nearest lamp alone under the rain's one law (law: 1:
    // brightest by the lamp, black well before the ground; drizzle half of them, after the rain none).
    const mastAt = [];
    for (const [ms, ma, mH] of MASTS) {
      const base = P(ms, ma), c = base.clone().setY(mH), dir = P(ms - MAST_AIM, 0, 6).sub(c).normalize(), rt = V3(dir.z, 0, -dir.x).normalize(), up = V3().crossVectors(rt, dir).normalize();
      if (up.y < 0) up.multiplyScalar(-1);
      const rM = rJ.fork('mast ' + ms), RR = 3.4, ring = [], sites = [];
      for (let k = 0; k < 8; k++) {
        const a = (k + 0.5) / 8 * 6.2831853, lp = c.clone().addScaledVector(rt, Math.cos(a) * RR).addScaledVector(up, Math.sin(a) * RR).addScaledVector(dir, 0.35), L = lampAt(lp);
        if (!L) continue;
        const site = { pos: lp, dir, turnAt: L.turnAt, doubt: L.doubt, strength: rM.range(0.8, 1), seed: rM(), scale: 3, back: 1 };
        S.target.push(site); streakYard.push({ ...site, width: 0.75, gain: 1.3 }); sites.push(site);   // (order 5, L7) a ring's eight mirrors lie as ONE band under the mast (each 1.5 m wide and more; the bands blend by the greater)
      }
      const t = sites.length ? [sites[0].turnAt, sites[0].doubt, 0.7] : tintP(c, 0.6), hx = V3(dir.x, 0, dir.z).normalize(), hz = V3(-hx.z, 0, hx.x);
      lattice(bMir, base, hx, hz, 0.8, mH * 0.55, 0.11, { name: 'lamp mast', tint: t });
      lattice(bMir, base.clone().setY(mH * 0.55), hx, hz, 0.5, mH * 0.45 + RR + 0.6, 0.09, { name: 'lamp mast', tint: t });
      bMir.plate(base.clone().setY(mH * 0.55).addScaledVector(hx, -1.3).addScaledVector(hz, -1.3), base.clone().setY(mH * 0.55).addScaledVector(hx, 1.3).addScaledVector(hz, -1.3), base.clone().setY(mH * 0.55).addScaledVector(hx, 1.3).addScaledVector(hz, 1.3), base.clone().setY(mH * 0.55).addScaledVector(hx, -1.3).addScaledVector(hz, 1.3), { codes: [1, 0.5] });   // its landing
      for (let k = 0; k < 16; k++) ring.push(c.clone().addScaledVector(rt, Math.cos(k * 0.3927) * RR).addScaledVector(up, Math.sin(k * 0.3927) * RR).addScaledVector(dir, 0.05));
      bMir.chain(ring, 0.07, { closed: true, carrier: 0.7, tint: t });
      for (let k = 0; k < 4; k++) bMir.bar(c.clone(), ring[k * 4 + 2], 0.05, { carrier: 0.5 });   // four spokes
      bMir.bar(c.clone().setY(mH + RR + 0.6), c.clone().setY(mH + RR + 2.4), 0.03, { carrier: 0.4 });   // its finial
      claim('mast ring', c, RR + 1.2);
      // the mast's rain: a cone under and before the ring, 14 to 24 m of fall
      for (let i = 0, nR = Math.round(60 * rainDraws * detail), nS = Math.round(60 * rainK * detail); i < nR; i++) {
        const span = rM.range(14, 24), top = mH + RR + 1 - rM.range(0, 9), dep = mH - (top - span * 0.5), rad = (1.5 + 0.3 * Math.max(0, dep)) * Math.sqrt(rM()), an = rM.range(0, 6.2831853), len = rM.range(3.5, 7), speed = rM.range(8, 11), phase = rM();
        if (i < nS) strokes.push({ x: c.x + dir.x * (1.5 + 0.2 * dep) + Math.cos(an) * rad, y: top, z: c.z + dir.z * (1.5 + 0.2 * dep) + Math.sin(an) * rad, span, len, speed, phase, rail: 0, law: 1, amount: 1 });
      }
      mastAt.push({ at: [ms, ma, mH], turnAt: sites.map((s) => Math.round(s.turnAt)) });
      await ctx.yield();
    }
    await ctx.yield();
    // THE WATER TOWER, 34 m, beyond the bridge's port leg: a round wet tank (one true round member) on six legs
    {
      const c = P(502, 46), t = tintP(c.clone().setY(26), 0.8), leg = (i, y, r = 5) => c.clone().add(V3(Math.cos(i * 1.0472) * r, y, Math.sin(i * 1.0472) * r));
      for (let i = 0; i < 6; i++) {
        bMir.bar(leg(i, 0, 6.2), leg(i, 24, 5), 0.22, { tint: t });
        for (const y of [8, 16]) bMir.bar(leg(i, y, 6.2 - y / 20), leg(i + 1, y, 6.2 - y / 20), 0.09, { tint: t });
        bMir.bar(leg(i, i % 2 ? 0 : 8, 6), leg(i + 1, i % 2 ? 8 : 0, 6), 0.07, { tint: t }); bMir.bar(leg(i, i % 2 ? 16 : 8, 5.6), leg(i + 1, i % 2 ? 8 : 16, 5.6), 0.07, { tint: t });
        bMir.bar(leg(i, 32, 6.2), c.clone().setY(34.6), 0.08, { tint: t });
      }
      bMir.bar(c.clone().setY(24), c.clone().setY(32), 6.2, { tint: t, carrier: 13.6 });
      for (const y of [24, 28, 32]) { const rim = []; for (let i = 0; i < 16; i++) rim.push(c.clone().add(V3(Math.cos(i * 0.3927) * 6.3, y, Math.sin(i * 0.3927) * 6.3))); bMir.chain(rim, y === 28 ? 0.05 : 0.1, { closed: true, tint: t, carrier: 0.8 }); }   // its hoops
      bMir.bar(c.clone().setY(0), c.clone().setY(24), 0.45, { tint: t }); bMir.bar(c.clone().setY(34.6), c.clone().setY(36.5), 0.05, {});
      claimBar('water tower', c.clone().setY(3), c.clone().setY(31), 6.5);
      for (let i = 0; i < 5; i++) dripAt.push(leg(i * 1.3, 23.8, 6.1));
    }
    // THE ENGINE ROAD: a banking engine standing in steam on the fifth road (8.25 m to starboard) at the water column
    // of s 340 (its front at s 322); boiler, chimney and dome are true round members, cab and tender wet plate
    const steamAt = [], engBox = [], engGaze = [], headGeo = { pos: [], h: [], idx: [] };
    {
      // (order 1, C4) THE ENGINE AS A SUBJECT, by place: it stands FACING us (smokebox and chimney toward the entry,
      // tender behind), its front at s 322, a large engine (boiler 2.5 m through, 10 m long), so that from s 290 to
      // 320 it is seen three-quarter on from the front, a fifth of the picture wide or more. g(d): d metres behind
      // its front buffer.
      // It stands 8.25 m to STARBOARD (the fifth road): the floodlight, ahead and to port here, then lies on the flank
      // it turns to us (a pale band along boiler, cab and tender), and the goods train's wet sides stand to port.
      // (order 3, E3) A STEAM LOCOMOTIVE AT A GLANCE, by place and by its parts. It stands on the THIRD road (13.75 m
      // to starboard), its front at s 327: from s 295 to 314 it is seen three quarters from the front at 19 to 35 m,
      // whole. A heavy eight-coupled engine a fifth larger than life (KE): buffer beam and buffers, the round
      // smokebox door with its ring, straps and dart handle, chimney, boiler with bands and handrail, dome, safety
      // valves, a cab with two round spectacle windows over the boiler's shoulders, running plate, cylinders,
      // spoked driving wheels as steel circles, coupling and connecting rods, a six-wheeled tender with coal
      // rails. All black body drawn by the floodlight (it lies on the flank turned to us); no lamp on it.
      // (order 5, K1) its place is ENG_AT (the third road, front at s 310: see the head of the constants)
      const a = ENG_AT[1], F = ENG_AT[0], KE = 1.2, c = (d, y, da = 0) => P(F + d * KE, a + da * KE, y * KE), ux = port(F + 10), uz = course(F + 10), t = tintP(c(6, 2.5), 0.9);
      const eb = (p, q, r, o = {}) => bUp.bar(p, q, r * KE, { ...o, carrier: o.carrier ? o.carrier * KE : undefined });
      // a disc of black plate square to the engine's length (the smokebox door, a wheel's web), and a ring on it
      const ringPts = (d, y, da, rad, n, side) => Array.from({ length: n }, (_, i) => (side ? c(d + Math.cos(i / n * 6.2831853) * rad, y + Math.sin(i / n * 6.2831853) * rad, da) : c(d, y + Math.sin(i / n * 6.2831853) * rad, da + Math.cos(i / n * 6.2831853) * rad)));
      const disc = (d, y, da, rad, n, side) => { const pts = ringPts(d, y, da, rad, n, side), o = c(d, y, da); for (let i = 0; i < n; i++) bUp.plate(o, pts[i], pts[(i + 1) % n], o, { codes: [0, 0] }); return pts; };
      eb(c(0.55, 3.0), c(2.4, 3.0), 1.2, { tint: t, carrier: 3.7 });                                   // smokebox
      eb(c(2.4, 3.0), c(11.0, 3.0), 1.1, { tint: t, carrier: 3.5 });                                   // boiler, to the cab
      { const door = disc(0.5, 3.0, 0, 1.18, 16, false); bUp.chain(door, 0.05 * KE, { closed: true, carrier: 0.6, tint: t });    // the smokebox door: its rim,
        bUp.chain(ringPts(0.46, 3.0, 0, 0.86, 14, false), 0.035 * KE, { closed: true, carrier: 0.5 });                           // its dished ring,
        for (const y of [2.62, 3.38]) eb(c(0.44, y, -0.95), c(0.44, y, 0.8), 0.035, { carrier: 0.45 });                           // its two hinge straps,
        eb(c(0.4, 3.0, 0), c(0.4, 2.55, 0.3), 0.04, { carrier: 0.45 }); eb(c(0.4, 3.0, 0), c(0.4, 3.05, -0.42), 0.04, { carrier: 0.45 }); }   // and its dart handles
      eb(c(1.35, 4.1), c(1.35, 5.3), 0.3, { tint: t, carrier: 1.2 }); eb(c(1.35, 5.25), c(1.35, 5.5), 0.4, { tint: t, carrier: 1.4 });   // chimney and its lip
      eb(c(5.4, 4.0), c(5.4, 4.7), 0.5, { tint: t, carrier: 1.6 }); eb(c(5.4, 4.7), c(5.4, 4.86), 0.3, { carrier: 1.1 });               // dome
      eb(c(9.3, 4.05), c(9.3, 4.6), 0.16, { tint: t, carrier: 0.8 }); eb(c(9.7, 4.05), c(9.7, 4.6), 0.16, { tint: t, carrier: 0.8 });   // safety valves
      for (const d of [3.4, 5.0, 6.6, 8.2, 9.9]) bUp.chain(Array.from({ length: 9 }, (_, k) => c(d, 3.0 + Math.sin(k * 0.3927) * 1.12, 1.12 * Math.cos(k * 0.3927))), 0.035 * KE, { carrier: 0.4 });   // boiler bands, over its crown
      // the cab: its front sheet with two round spectacle windows over the boiler's shoulders, sides with their
      // cut-outs, an oversailing roof; the frames, the buffer beam and its two buffers
      addBox(bUp, c(12.4, 3.25), ux, uz, 1.5 * KE, 1.55 * KE, 1.4 * KE, { tint: t });
      bUp.plate(c(10.7, 4.86, -1.75), c(10.7, 4.86, 1.75), c(14.3, 4.86, 1.75), c(14.3, 4.86, -1.75), { codes: [1, 0.5] });
      for (const da of [-0.98, 0.98]) { bUp.chain(ringPts(10.96, 3.98, da, 0.3, 12, false), 0.035 * KE, { closed: true, carrier: 0.45 }); eb(c(10.95, 3.98, da - 0.3), c(10.95, 3.98, da + 0.3), 0.02, { carrier: 0.3 }); }
      for (const da of [-1.52, 1.52]) bUp.chain([c(11.6, 3.35, da), c(13.0, 3.35, da), c(13.0, 4.35, da), c(11.6, 4.35, da)], 0.035 * KE, { closed: true, carrier: 0.45 });
      addBox(bUp, c(6.8, 1.2), ux, uz, 1.0 * KE, 0.5 * KE, 6.9 * KE, { tint: t, bare: true });
      bUp.plate(c(-0.12, 1.0, -1.35), c(-0.12, 1.0, 1.35), c(-0.12, 1.5, 1.35), c(-0.12, 1.5, -1.35), { codes: [0.5, 1] });
      for (const da of [-0.87, 0.87]) { eb(c(-0.12, 1.25, da), c(-0.6, 1.25, da), 0.09, { carrier: 0.6 }); eb(c(-0.6, 1.25, da), c(-0.72, 1.25, da), 0.26, { carrier: 0.95 }); }
      for (const da of [-1.47, 1.47]) {
        eb(c(0.7, 1.35, da), c(2.3, 1.35, da), 0.42, { carrier: 1.4, tint: t });                       // a cylinder
        bUp.plate(c(0.2, 2.0, da), c(10.9, 2.0, da), c(10.9, 2.0, da * 0.55), c(0.2, 2.0, da * 0.55), { codes: [1, 0.5] });   // the running plate
        eb(c(0.7, 3.62, da * 0.8), c(10.9, 3.62, da * 0.8), 0.022, { carrier: 0.35 });                  // the handrail
        // wheels as steel circles with spokes: a pony wheel, four coupled drivers (1.5 m), six tender wheels
        for (const [d, rad, sp] of [[1.5, 0.45, 6], [3.7, 0.75, 10], [5.4, 0.75, 10], [7.1, 0.75, 10], [8.8, 0.75, 10], [15.6, 0.56, 6], [17.9, 0.56, 6], [20.2, 0.56, 6]]) {
          const y = 0.08 + rad, rim = ringPts(d, y, da, rad, 16, true), o = c(d, y, da);
          bUp.chain(rim, 0.06 * KE, { closed: true, carrier: 0.5, tint: t }); bUp.chain(ringPts(d, y, da, 0.16, 6, true), 0.04 * KE, { closed: true, carrier: 0.4 });
          for (let i = 0; i < sp; i++) { const an = (i + 0.3) / sp * 6.2831853; bUp.bar(o, c(d + Math.cos(an) * rad, y + Math.sin(an) * rad, da), 0.022 * KE, { carrier: 0.3 }); }
        }
        const dz = da * 1.07;
        eb(c(3.7, 0.5, dz), c(8.8, 0.5, dz), 0.06, { carrier: 0.5, tint: t });                          // the coupling rod, on the four crank pins
        eb(c(2.3, 1.35, dz), c(7.1, 0.5, dz), 0.05, { carrier: 0.5 });                                  // the connecting rod
      }
      // the tender: a wet tank on its frames, coal rails round its top, a heap of coal as one dark plate
      addBox(bUp, c(18.0, 2.55), ux, uz, 1.45 * KE, 1.2 * KE, 3.5 * KE, { tint: t });
      addBox(bUp, c(18.0, 1.05), ux, uz, 1.0 * KE, 0.3 * KE, 3.6 * KE, { tint: t, bare: true });
      bUp.chain([c(14.6, 4.15, -1.4), c(21.4, 4.15, -1.4), c(21.4, 4.15, 1.4), c(14.6, 4.15, 1.4)], 0.03 * KE, { closed: true, carrier: 0.4 });
      for (const [d, da] of [[14.6, -1.4], [21.4, -1.4], [21.4, 1.4], [14.6, 1.4], [18, -1.4], [18, 1.4]]) eb(c(d, 3.75, da), c(d, 4.15, da), 0.03, { carrier: 0.4 });
      claimBar('banking engine', c(-1, 2.6), c(22.5, 2.6), 3.4);
      for (const d of [-0.72, 22.5]) for (const y of [0, 5.5]) for (const da of [-1.75, 1.75]) { const q = c(d, y, da); engBox.push([+q.x.toFixed(2), +q.y.toFixed(2), +q.z.toFixed(2)]); }   // (order 5, K4) its box, for the report
      // (order 5, K1) WHERE THE GAZE RESTS ON THE ENGINE, by place: from each place of the flown line (each 1/1250 of
      // it over the look's stretch) the point of the engine's length that halves the angle it is seen under (it
      // divides buffers to tender's end as the distances to the two: nearer the buffers as we come, the middle
      // abeam, nearer the tender after), taken ENG_LEAD metres of the line ahead of the place, because the eye
      // follows the gaze late by about that much way at the lingering pace. A table of the line and the engine's
      // place alone; the look (pois) reads it by u.
      { const f = c(-0.72, 3.0), r = c(22.5, 3.0), e = V3(), u0 = (F + ENG_LOOK[0]) / ROUTE_LEN, n = Math.round((ENG_LOOK[1] - ENG_LOOK[0]) + 1);
        // (the DIRECTION in which that point lies from the place ENG_LEAD metres ahead, laid off from the place itself)
        const e0 = V3();
        for (let i = 0; i < n; i++) { const d0 = (u0 + i / ROUTE_LEN) * path.length; path.posAtDist(d0, e0); path.posAtDist(Math.min(path.length, d0 + ENG_LOOK[2]), e); const dF = Math.hypot(e.x - f.x, e.z - f.z), dR = Math.hypot(e.x - r.x, e.z - r.z); engGaze.push(f.clone().lerp(r, dF / (dF + dR)).sub(e).add(e0)); } }
      // (order 5, L4) THE HEADLAMP, a lamp body in pale steel (HEAD_VS/FS: outside the green law): a drum on a bracket
      // over the smokebox door, its glass a disc with an edge, and its filled wedge on the road before the buffers
      {
        eb(c(0.3, 4.66), c(0.92, 4.66), 0.33, { tint: t, carrier: 1.2 }); eb(c(0.6, 4.2), c(0.6, 4.36), 0.1, { carrier: 0.5 });
        bUp.chain(ringPts(0.29, 4.66, 0, 0.35, 12, false), 0.03 * KE, { closed: true, carrier: 0.4 });
        const C = c(0.25, 4.66), R = 0.31 * KE, push = (p, h) => { headGeo.pos.push(p.x, p.y, p.z); headGeo.h.push(...h); };
        for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) push(C.clone().addScaledVector(ux, x * R).add(V3(0, y * R, 0)), [x * R, y * R, 0, R * 0.96]);
        headGeo.idx.push(0, 1, 2, 0, 2, 3);
        const n = 14, s0 = F - 0.9 * KE;
        for (let k = 0; k <= n; k++) {
          const d = k / n * HEAD_REACH, w = 0.8 + 2.5 * (k / n) + 0.4, s = s0 - d, i0 = headGeo.pos.length / 3;
          push(P(s, a - w, 0.055), [-w, s, 1, d]); push(P(s, a + w, 0.055), [w, s, 1, d]);
          if (k < n) headGeo.idx.push(i0, i0 + 1, i0 + 3, i0, i0 + 3, i0 + 2);
        }
      }
      // (order 4, J4d) by seed the regulator is OPEN (the tall plume, 30 m) or SHUT (a wisp 8 m over the chimney)
      steamAt.push(regulator ? { pos: c(1.35, 5.5), h: 30, w: 7, lean: ux.clone().multiplyScalar(-9), tint: t } : { pos: c(1.35, 5.5), h: 8, w: 2.6, lean: ux.clone().multiplyScalar(-2.5), tint: t });
      // (order 6, M1) THE STEAM HAS A SOURCE ONE CAN SEE: the engine's plume alone stands. The low puff of the cylinder
      // cock on its far side (5 m high, 3.5 m wide: low, not tall and thinning) is not stood any more.
      const wc = P(F + 24, a + 3.0);                                                                     // the water column, 9 m, by the tender
      bUp.bar(wc, wc.clone().setY(9), 0.17, { tint: t }); bUp.bar(wc.clone().setY(8.3), P(F + 24, a + 1.0, 7.9), 0.12, { tint: t, carrier: 0.8 });
      bUp.bar(P(F + 24, a + 1.0, 7.9), P(F + 24, a + 1.0, 6.6), 0.14, { carrier: 0.8 }); claimBar('water column', wc, wc.clone().setY(9), 0.5);
      dripAt.push(P(F + 24, a + 1.0, 6.5));
    }
    await ctx.yield();
    // THE DELTA, s 575-685 (DELTA0..DELTA1): beside the braiding roads stand switch lanterns on short posts;
    // three steam vents among them, one beside the bridge's wood, two by the leg
    const rl = rng.fork('delta'), lantPool = [], engLamps = [], engSmear = []; let nLant = 0;
    // (order 3, M7) A LIT FACE BY THE ENGINE, by place: one switch lantern (the delta's own kind: post, case, 0.5 m
    // glass, pool, short streak) stands in the six-foot 3.2 m before the engine's buffers, 2.75 m to port of its
    // road: its light lies on the wet smokebox door, the buffer beam and the cylinders as a filled patch, by its own
    // number from the one formula (about 275: red as we come, green from s 275 on). No chance is drawn for it.
    // (order 5, L1/L2/L5) THE ENGINE IS LIT BY THE YARD'S OWN LAMPS: that lantern is the first of a RANK OF FIVE
    // (ENG_LAMPS: metres of the plan from the engine's buffers), 6.8 m apart down the same six-foot, along boiler,
    // cab and tender: each a lamp like every lamp (its number by the one formula at its own place: about 270 to 290,
    // so the rank turns lamp by lamp as we come up to the engine), each with its pool, its band in the water, its
    // filled patch on the engine's wet plate (the lit face's law) and its filled streak with an edge down that
    // plate (engSmear below). No fire, no lit window: the yard's lamps alone.
    for (const [ei, off] of ENG_LAMPS.entries()) {
      const lanS = ENG_AT[0] + off, base = P(lanS, ENG_AT[1] + 2.75), lp = base.clone().setY(2.6), L = lampAt(lp);   // (order 5, K1) it stands with the engine
      if (L) {
        const dir = lookBack(base, 0), site = { pos: lp, dir, up: UP, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: (0.37 + ei * 0.171) % 1, scale: 2.7, sAt: lanS, back: 1, lit: 5.6 };   // (lit: this lamp's reach on wet faces, 5.6 m: the engine's plate is black between its lamps and graded round each, never one flat slab)
        engLamps.push(site);
        S.small.push(site); lantPool.push(site);
        bUp.bar(base, base.clone().setY(2.2), 0.08, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.8] });
        addBox(bUp, lp.clone().addScaledVector(dir, -0.36), V3(dir.z, 0, -dir.x), dir, 0.4, 0.46, 0.34, { tint: [L.turnAt, L.doubt, 0.6], rim: 0.035 });
        bUp.bar(lp.clone().add(V3(0, 0.46, 0)).addScaledVector(dir, -0.36), lp.clone().add(V3(0, 0.9, 0)).addScaledVector(dir, -0.36), 0.1, { carrier: 0.6 });
        claim('switch lantern', lp, 0.75);
      }
    }
    // (order 6, M3) NO FRAME NEARLY ALL BLACK BEFORE THE ENGINE, by place: the engine's file RUNS ON toward the entry
    // (ENG_LEAD: three more of the same lantern down the same six-foot, 14.5 m apart, the first 14.5 m before the
    // first of ENG_LAMPS), each a lamp like every lamp (its number by the one formula at its own place), each over its
    // own filled pool on the wet ground with the rails through it and its band in the water (lantPool). They stand
    // 11 m and more from the flown line, before the engine's buffers (none between the lens and the engine), and are
    // not among engLamps (the engine's plate keeps its five). No chance is drawn for them.
    for (let i = 1; i <= ENG_LEAD[0]; i++) {
      const lanS = ENG_AT[0] + ENG_LAMPS[0] - i * ENG_LEAD[1], base = P(lanS, ENG_AT[1] + 2.75), lp = base.clone().setY(2.6), L = lampAt(lp);
      if (!L) continue;
      const dir = lookBack(base, 0), site = { pos: lp, dir, up: UP, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: (0.19 + i * 0.171) % 1, scale: 2.7, sAt: lanS, back: 1 };
      S.small.push(site); lantPool.push(site);
      bUp.bar(base, base.clone().setY(2.2), 0.08, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.8] });
      addBox(bUp, lp.clone().addScaledVector(dir, -0.36), V3(dir.z, 0, -dir.x), dir, 0.4, 0.46, 0.34, { tint: [L.turnAt, L.doubt, 0.6], rim: 0.035 });
      bUp.bar(lp.clone().add(V3(0, 0.46, 0)).addScaledVector(dir, -0.36), lp.clone().add(V3(0, 0.9, 0)).addScaledVector(dir, -0.36), 0.1, { carrier: 0.6 });
      claim('engine lead lantern', lp, 0.75);
    }
    // (order 6, P1) THE PORT FILE, by place (PORT_LEAD): the same lantern again, in the six-foot 16.5 m to port of the
    // plan line, 9 m and more from the flown line: the way's own roads to port lie in its pools as the starboard roads
    // lie in the engine's file's. Each a lamp like every lamp (its number by the one formula at its own place), its
    // glass turned back along the way like its fellows'; rank 'port lead': the file's ONE band in the water
    // (makeRankBands), no streak of its own. No chance is drawn for them.
    for (let i = 0; i < PORT_LEAD[1]; i++) {
      const lanS = PORT_LEAD[0] + i * PORT_LEAD[2], base = P(lanS, PORT_LEAD[3]), lp = base.clone().setY(2.6), L = lampAt(lp);
      if (!L) continue;
      const dir = lookBack(base, 0), site = { pos: lp, dir, up: UP, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: (0.53 + i * 0.171) % 1, scale: 2.7, sAt: lanS, back: 1, rank: 'port lead' };
      S.small.push(site); lantPool.push(site);
      bUp.bar(base, base.clone().setY(2.2), 0.08, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.8] });
      addBox(bUp, lp.clone().addScaledVector(dir, -0.36), V3(dir.z, 0, -dir.x), dir, 0.4, 0.46, 0.34, { tint: [L.turnAt, L.doubt, 0.6], rim: 0.035 });
      bUp.bar(lp.clone().add(V3(0, 0.46, 0)).addScaledVector(dir, -0.36), lp.clone().add(V3(0, 0.9, 0)).addScaledVector(dir, -0.36), 0.1, { carrier: 0.6 });
      claim('port lead lantern', lp, 0.75);
    }
    // (order 5, L2) THE ENGINE'S WET PLATE CARRIES ITS LAMPS AS FILLED GRADED STREAKS WITH AN EDGE: one streak to a
    // lamp on each flat plate that faces it (the cab's side sheet, the tender's tank; plates in the engine's own
    // measure, KE 1.2), hung from the lamp's image on the plate: the part's smear under its band law (one filled
    // spindle, brightest at the image, by that lamp's own number). The round boiler takes the lit face alone.
    {
      const F = ENG_AT[0], a = ENG_AT[1], nrm = port(F + 10);
      for (const t of engLamps) for (const [s0, s1, aside, top, unit] of [[F + 13.3, F + 16.5, a + 1.83, 4.7, 0.85], [F + 17.6, F + 25.6, a + 1.77, 3.75, 0.62]]) {
        const s = Math.min(s1 - 0.6, Math.max(s0 + 0.6, t.sAt)), far = Math.abs(s - t.sAt);
        if (far > 7) continue;
        engSmear.push({ pos: P(s, aside, top), dir: nrm, unit, width: 0.34, turnAt: t.turnAt, doubt: t.doubt, strength: 1, seed: t.seed, gain: 1 / (1 + 0.3 * far) });
      }
    }
    // (order 5, L6) BEFORE THE CUTTING NO FRAME IS NEARLY ALL BLACK, and every lit patch has its lamp: THE APPROACH
    // RANK, by place: two strict files of switch lanterns (the delta's own kind) flank the way from the board's end
    // to the lip (APPROACH: first and last metre of the plan, their pitch, metres aside), each a lamp like every lamp
    // (its number by the one formula at its own place: about 810 to 860, so the files stand green before us from
    // s 860 on, and none is later than the lip), each over its own filled pool with its band in the water. They end
    // 6 m before the last post, behind the eye where the lip's own picture is taken. No chance is drawn for them.
    for (let s = APPROACH[0]; s <= APPROACH[1] + 0.01; s += APPROACH[2]) for (const sd of [-1, 1]) {
      const base = P(s, sd * APPROACH[3]), lp = base.clone().setY(2.6), L = lampAt(lp);
      if (!L) continue;
      const dir = lookBack(base, 0), site = { pos: lp, dir, up: UP, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: (s * 0.137 + sd * 0.31 + 1) % 1, scale: 2.7, sAt: s, back: 1 };
      S.small.push(site); lantPool.push(site);
      bUp.bar(base, base.clone().setY(2.2), 0.08, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.8] });
      addBox(bUp, lp.clone().addScaledVector(dir, -0.36), V3(dir.z, 0, -dir.x), dir, 0.4, 0.46, 0.34, { tint: [L.turnAt, L.doubt, 0.6], rim: 0.035 });
      bUp.bar(lp.clone().add(V3(0, 0.46, 0)).addScaledVector(dir, -0.36), lp.clone().add(V3(0, 0.9, 0)).addScaledVector(dir, -0.36), 0.1, { carrier: 0.6 });
      claim('approach lantern', lp, 0.75);
    }
    // (order 2, D4) A FIELD OF ROUND POOLS, by place: the lanterns stand beside the braiding roads over the WHOLE delta
    // (not only where two roads cross, which heaped them in its last 40 m), each only where no other stands within
    // 14 m of it (so each pool, 6 m in radius, lies alone on dark wet ground and pools are counted, not smeared
    // together), and none within 4.5 m of the flown line
    for (let s = DELTA0 + 4; s < DELTA1 - 6; s += 2) {
      for (let k = 0; k < 12; k++) {
        {
          const sd = (k + s / 2) % 2 ? 1 : -1;
          { const q = P(s + sd * 2.2, roadAside(k, s) + sd * 1.9); if (near(q.x, q.z).aside < 4.5 || lantPool.some((t) => Math.hypot(t.pos.x - q.x, t.pos.z - q.z) < 10.5)) continue; }   // (order 3, E5) about thirty of them: 10.5 m apart or more
          // (order 1, C6) a lantern stands on its post, 2.6 m up, a black case with a deep glass: a body the floodlight
          // draws from above, over its own pool (lantPool: 9 m of wet timbering round it, as the brief has it)
          const base = P(s + sd * 2.2, roadAside(k, s) + sd * 1.9), lp = base.clone().setY(2.6), L = lampAt(lp); if (!L) continue;
          const dir = lookBack(base, 0), site = { pos: lp, dir, up: UP, turnAt: L.turnAt, doubt: L.doubt, strength: Math.max(0.75, fault(rl)), seed: rl(), scale: 2.7, sAt: s, back: 1 };   // (order 3, E5) larger glass (0.5 m), none dead
          S.small.push(site); lantPool.push(site); nLant++;   // (D4) its own short streak (lantStreak below), not the yard's long one
          bUp.bar(base, base.clone().setY(2.2), 0.08, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.8] });
          addBox(bUp, lp.clone().addScaledVector(dir, -0.36), V3(dir.z, 0, -dir.x), dir, 0.4, 0.46, 0.34, { tint: [L.turnAt, L.doubt, 0.6], rim: 0.035 });
          bUp.bar(lp.clone().add(V3(0, 0.46, 0)).addScaledVector(dir, -0.36), lp.clone().add(V3(0, 0.9, 0)).addScaledVector(dir, -0.36), 0.1, { carrier: 0.6 });   // its vent cap
          claim('switch lantern', lp, 0.75);
          bUp.bar(base.clone().setY(0.12), P(s + sd * 2.2, roadAside(k, s) + sd * 0.7, 0.12), 0.03, { carrier: 0.4, tint: [L.turnAt, L.doubt, 0.8] });   // its rod to the blades
        }
      }
    }
    // (order 4, H3) THE FIELD BEGINS AT OUR FEET: the same lanterns by the same rule (beside a road, 10.5 m or more
    // from every other, none within 4.5 m of the flown line) stand on back along the parallel roads from s 546 to
    // the braid's first metres, laid AFTER the braid's own so that not one of those moved; no chance is drawn
    await ctx.yield();
    for (let s = DELTA0 + 2; s >= 546; s -= 2) {
      if (s % 8 === 0) await ctx.yield();
      for (let k = 0; k < 12; k++) {
        const sd = (k + s / 2) % 2 ? 1 : -1, base = P(s + sd * 2.2, roadAside(k, s) + sd * 1.9);
        if (near(base.x, base.z).aside < 4.5 || lantPool.some((t) => Math.hypot(t.pos.x - base.x, t.pos.z - base.z) < 10.5)) continue;
        const lp = base.clone().setY(2.6), L = lampAt(lp); if (!L) continue;
        const dir = lookBack(base, 0), site = { pos: lp, dir, up: UP, turnAt: L.turnAt, doubt: L.doubt, strength: 0.8 + 0.2 * ((s * 0.137 + k * 0.31) % 1), seed: (s * 0.071 + k * 0.193) % 1, scale: 2.7, sAt: s, back: 1 };
        S.small.push(site); lantPool.push(site); nLant++;
        bUp.bar(base, base.clone().setY(2.2), 0.08, { carrier: 0.6, tint: [L.turnAt, L.doubt, 0.8] });
        addBox(bUp, lp.clone().addScaledVector(dir, -0.36), V3(dir.z, 0, -dir.x), dir, 0.4, 0.46, 0.34, { tint: [L.turnAt, L.doubt, 0.6], rim: 0.035 });
        bUp.bar(lp.clone().add(V3(0, 0.46, 0)).addScaledVector(dir, -0.36), lp.clone().add(V3(0, 0.9, 0)).addScaledVector(dir, -0.36), 0.1, { carrier: 0.6 });
        claim('switch lantern', lp, 0.75);
      }
    }
    // (order 1, C6) the vents stand small and well away: none within 40 m of the flown line, none over 12 m tall
    for (const [s, a, h] of [[560, -44, 12], [604, 46, 10], [636, -47, 9], [232, -46, 12], [700, 44, 11], [905, -46, 11]]) {
      // (order 6, M1) the six ground vents blow NO steam any more (a 0.5 m stub is no body one can see making it; lit
      // by a lamp beside them they read as bushes of colour): the stubs stand, the two draws of chance are taken
      const p = P(s, a, 0.3), ventLean = V3(rl.range(-4, 4), 0, rl.range(-4, 4)); void h; void ventLean;
      bUp.bar(p.clone().setY(0), p.clone().setY(0.5), 0.3, { carrier: 1.2 });
    }
    await ctx.yield();

    // (order 3, E2) THE SIGNAL CABIN ON STILTS, 14 m to port of s 662-674, standing in the apron's water where the
    // leg begins: the thing close by at the start of the leg, whole and nameable, while the tower is still far.
    // A black body on eight braced stilts: its floor 6 m up, a band of windows (their bars drawn by the floodlight)
    // on the side toward the line and on the end we come to, a wet gabled roof, a stair up its near end. Inside, on
    // the block shelf along its back wall, a short strict rank of eight small repeater lamps (each a lamp under the
    // one formula from its own place) and, before the windows, the lever frame as steel lines. The rank's streaks
    // lie in the water under the stilts, its pools on the water at their feet.
    let cabinAt = null;
    {
      const rcab = rE.fork('cabin'), c0 = P(668, 14), ux = port(668), uz = course(668), k = (x, y, z) => c0.clone().addScaledVector(ux, x).addScaledVector(uz, z).setY(y);
      const HX = 2.25, HZ = 6, F = 6, SILL = 6.9, HEAD = 9.1, TOP = 9.8, b = bMir;
      const lampDir = ux.clone().multiplyScalar(-0.85).addScaledVector(uz, -0.53).normalize(), rank = [];
      for (let i = 0; i < 8; i++) {
        const lp = k(1.85, 8.7, -3.5 + i), L = lampAt(lp); if (!L) continue;
        const site = { pos: lp, dir: lampDir, turnAt: L.turnAt, doubt: L.doubt, strength: rcab.range(0.75, 1), seed: rcab(), scale: 1.5 };
        S.small.push(site); streakYard.push(site); rank.push(L);
      }
      const t = rank.length ? [rank[rank.length >> 1].turnAt, 0, 1] : [0, 0, 0];
      // stilts, two rows of four, braced crosswise on both long sides and at both ends
      const ZS = [-5, -1.7, 1.7, 5];
      for (const x of [-1.9, 1.9]) {
        for (const z of ZS) b.bar(k(x, 0, z), k(x, F, z), 0.14, { tint: t });
        for (let i = 0; i < 3; i++) { b.bar(k(x, 0.6, ZS[i]), k(x, F - 0.3, ZS[i + 1]), 0.05, { carrier: 0.5 }); b.bar(k(x, F - 0.3, ZS[i]), k(x, 0.6, ZS[i + 1]), 0.05, { carrier: 0.5 }); }
      }
      for (const z of [-5, 5]) { b.bar(k(-1.9, 0.6, z), k(1.9, F - 0.3, z), 0.05, { carrier: 0.5 }); b.bar(k(-1.9, F - 0.3, z), k(1.9, 0.6, z), 0.05, { carrier: 0.5 }); }
      // (order 3, G7) LIMIT 1, BLACK FACES HIDE: the stilts were bars through which the far lines showed. The braced
      // bays are black faces now (band-less: the bracing stands on them), on both long sides and at both ends, from
      // the water to the floor: the cabin stands on a black body that hides what is behind it, in the mirror too
      // (their tint's amount is nought: no beads on so large and near a face; they take the rank's light as lit faces)
      for (const x of [-1.9, 1.9]) b.plate(k(x, 0, -5), k(x, F, -5), k(x, F, 5), k(x, 0, 5), { codes: [0, 0], tint: [t[0], 0, 0] });
      for (const z of [-5, 5]) b.plate(k(-1.9, 0, z), k(-1.9, F, z), k(1.9, F, z), k(1.9, 0, z), { codes: [0, 0], tint: [t[0], 0, 0] });
      // the floor (seen from below) and the ceiling; the back wall and the far end whole
      b.plate(k(-HX, F, -HZ), k(-HX, F, HZ), k(HX, F, HZ), k(HX, F, -HZ), { codes: [1, 0.5] });
      b.plate(k(-HX, TOP, -HZ), k(-HX, TOP, HZ), k(HX, TOP, HZ), k(HX, TOP, -HZ), { codes: [0, 0] });
      b.plate(k(HX, F, -HZ), k(HX, F, HZ), k(HX, TOP, HZ), k(HX, TOP, -HZ), { codes: [0.5, 0] });
      b.plate(k(-HX, F, HZ), k(HX, F, HZ), k(HX, TOP, HZ), k(-HX, TOP, HZ), { codes: [0.5, 0] });
      // the windowed side (toward the line) and the windowed end (toward whoever comes): a wall under the sill, a
      // fascia over the heads, the glazing bars between as thin steel
      const faces = [[k(-HX, 0, -HZ), k(-HX, 0, HZ), 12], [k(HX, 0, -HZ), k(-HX, 0, -HZ), 4]];
      for (const [A, B, n] of faces) {
        const at = (f, y) => A.clone().lerp(B, f).setY(y);
        b.plate(at(0, F), at(1, F), at(1, SILL), at(0, SILL), { codes: [0.5, 1], tint: [t[0], 0, 0.5] });
        b.plate(at(0, HEAD), at(1, HEAD), at(1, TOP), at(0, TOP), { codes: [0.5, 0.5] });
        for (let i = 0; i <= n; i++) b.bar(at(i / n, SILL), at(i / n, HEAD), i === 0 || i === n ? 0.09 : 0.03, { carrier: i === 0 || i === n ? 0.7 : 0.35 });
        b.bar(at(0, 8.45), at(1, 8.45), 0.03, { carrier: 0.35 });
      }
      b.bar(k(HX, F, HZ), k(HX, TOP, HZ), 0.09, { carrier: 0.7 });
      cabinAt = { k, t, rcab, ux, uz, HX, HZ, F, TOP };
      claimBar('signal cabin', k(0, 8.2, -7), k(0, 8.2, 7), 4.4);
    }
    {
      const { k, t, rcab, HX, HZ, F, TOP } = cabinAt, b = bMir, EV = TOP + 0.05, RG = 11.4, OX = HX + 0.8, OZ = HZ + 0.7;
      // the wet gabled roof, oversailing: two slopes (pale at the eaves, wet with the rank's glints), two gables
      for (const sx of [-1, 1]) {
        b.plate(k(sx * OX, EV, -OZ), k(sx * OX, EV, OZ), k(0, RG, OZ), k(0, RG, -OZ), { codes: [1, 0.5], tint: [t[0], 0, sx < 0 ? 1 : 0.4] });
        b.bar(k(sx * OX, EV, -OZ), k(sx * OX, EV, OZ), 0.05, { carrier: 0.5 });
      }
      for (const sz of [-1, 1]) { b.plate(k(-HX, TOP, sz * HZ), k(HX, TOP, sz * HZ), k(0, RG, sz * HZ), k(0, RG, sz * HZ), { codes: [0, 0] }); for (const sx of [-1, 1]) b.bar(k(sx * OX, EV, sz * OZ), k(0, RG, sz * OZ), 0.05, { carrier: 0.5 }); }
      b.bar(k(0, RG, -OZ), k(0, RG, OZ), 0.06, { carrier: 0.6 });
      b.bar(k(1.2, 10.4, 3.2), k(1.2, 12.9, 3.2), 0.28, { carrier: 1.1 }); b.bar(k(1.2, 12.9, 3.2), k(1.2, 13.3, 3.2), 0.16, { carrier: 0.7 });   // its stove pipe
      // the stair up the near end to a landing at the floor: two strings, treads, a handrail
      const s0 = (x) => k(x, 0.2, -HZ - 7.6), s1 = (x) => k(x, F, -HZ - 1.3);
      for (const x of [-1.5, -0.4]) b.bar(s0(x), s1(x), 0.06, { carrier: 0.6 });
      for (let i = 1; i < 11; i++) b.bar(s0(-1.5).lerp(s1(-1.5), i / 11), s0(-0.4).lerp(s1(-0.4), i / 11), 0.03, { carrier: 0.4 });
      b.bar(s0(-1.5).setY(1.25), s1(-1.5).setY(F + 1.05), 0.03, { carrier: 0.4 });
      for (const f of [0, 0.5, 1]) { const p = s0(-1.5).lerp(s1(-1.5), f); b.bar(p, p.clone().setY(p.y + 1.05), 0.03, { carrier: 0.4 }); }
      b.plate(k(-1.7, F, -HZ - 1.3), k(-1.7, F, -HZ), k(-0.2, F, -HZ), k(-0.2, F, -HZ - 1.3), { codes: [1, 0.5] });
      b.bar(k(-1.7, F + 1.05, -HZ - 1.3), k(-1.7, F + 1.05, -HZ), 0.03, { carrier: 0.4 });
      for (const z of [-HZ - 1.3]) for (const x of [-1.7, -0.2]) b.bar(k(x, 0, z), k(x, F, z), 0.07, { carrier: 0.6 });
      // inside: the block shelf under the rank, and the lever frame before the windows (one lever in three pulled over)
      b.bar(k(2.0, 8.3, -4.2), k(2.0, 8.3, 4.2), 0.05, { carrier: 0.5 });
      b.bar(k(-0.9, F + 0.2, -4.3), k(-0.9, F + 0.2, 4.3), 0.06, { carrier: 0.5 });
      for (let i = 0; i < 15; i++) { const z = -4.2 + i * 0.6, pulled = rcab.chance(1 / 3); b.bar(k(-0.9, F + 0.2, z), k(pulled ? -1.55 : -0.55, F + 1.85, z), 0.028, { carrier: 0.32 }); }
      claimBar('cabin stair', k(-0.95, 1, -HZ - 7.6), k(-0.95, F + 1, -HZ - 1.3), 1.3);
    }
    await ctx.yield();
    // THE BOARD, 60 by 25 m on lattice legs: twelve panels in two rows of six, dark gaps and a walkway between,
    // each 8 rows of 10 hooded lamps (a row is one cell of the hash), nothing else. Its middle 34 m to port of
    // s 945, its east end 16 m to port of s 969; its lamps' beam is narrow, so by their place they are dark
    // from the course before s 830. Its rows turn from the foot up, as the one formula makes them.
    const rbd = rng.fork('board'), boardRain = []; let nBoard = 0;
    {
      // (order 2, D5) BY PLACE: the board stands 20 m sooner along the leg and 4 m nearer it (its middle 30 m to port
      // of s 925, its far end 17 m off the line: clear air kept), so that from s 875 it fills the picture's port half,
      // whole, over its double in the water. Turned as before, its narrow lamps find the eye from about s 790.
      const M = P(BOARD_AT[0], BOARD_AT[1]), cu0 = course(BOARD_AT[0]), pt0 = port(BOARD_AT[0]), e = cu0.clone().multiplyScalar(0.8).addScaledVector(pt0, -0.6), n = pt0.clone().multiplyScalar(-1);   // (order 4, H2) the face looks square across the leg (it looked 25 degrees back from square); the lamps are aimed (below)
      // (order 1, C7) BY PLACE: the board is turned to look across the leg (25 degrees back from square), so from the
      // leg before s 830 its deep-hooded lamps are seen more than 49 degrees off their axis (58 at s 650, 55 at s 762)
      // and show only their black hoods; its beam (BOARD below: dark past 46 degrees, full within 37) finds the eye
      // from about s 810 at its near end and it stands lit, three-quarter on, by s 875.
      const right = V3(n.z, 0, -n.x), sgn = right.dot(e) > 0 ? 1 : -1, PW = 9.5, PH = 10.5, GAP = 0.6, y0 = 8;
      for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) {
        const x = (i - 3) * (PW + GAP) + GAP / 2, origin = M.clone().addScaledVector(right, x).setY(y0 + row * (PH + 1.5));
        addBoardPanel(bMir, S.board, { origin, right, railTint: 0.25, frame: true, rails: false, lamp: (pos, key) => { const L = lampAt(pos, 0, key) || { turnAt: 0, doubt: 0 }; if (nBoard++ % 20 === 7) boardRain.push({ pos: V3(pos.x, pos.y, pos.z), L }); return { turnAt: L.turnAt, doubt: L.doubt, strength: fault(rbd), seed: rbd() }; } });
        if (i % 2) await ctx.yield();
      }
      // (order 2, D5) THE BOARD LIGHTS ITS RAIN: one lamp in twenty carries a cone of lit strokes 12 m out before the
      // panels, each by that lamp's own number, so the rows' turn from the foot up shows in the air before the board
      { const rbr = rbd.fork('board rain'); for (const t of boardRain) lampRain(rbr, t.pos, n, t.L, 4, 12, 0, 0); }   // (order 3, G2) none of its own is stood: far off they read as a cloud of dashes; the course's long strokes before the board take its lamps by the one law
      for (let i = 0; i <= 6; i++) {
        const x = (i - 3) * (PW + GAP) - GAP / 2 + (i === 0 ? 0.3 : i === 6 ? -0.3 : 0), base = M.clone().addScaledVector(right, x).addScaledVector(n, -0.9);
        // (order 1, C7) plain legs behind the black panels (one stout post and its strut to each), and ONE outline of
        // cold steel round the whole board: from the side and from afar it is a black body with an edge, not a grid
        // (its legs show only under the panels; behind them they carry no line)
        const top = base.clone().setY(y0 + 2 * PH + 2.2);
        // (order 4, H2) THE BOARD IS A THING: it stands on LATTICE LEGS (each a black body with its bracing, 1 m square)
        lattice(bMir, base.clone().addScaledVector(n, 0.2), right, n, 0.5, y0 - 0.5, 0.07, { name: 'board leg' }); claimBar('board leg', base, top, 0.75);
      }
      {
        // (order 4, H2) ... in a steel frame (each panel's own, the part's; a stout sill and head beam the whole
        // length), with a WALKWAY and its handrail between the two rows and another along the foot, a hood along the
        // head, and a LADDER up its near end: all cold steel the floodlight draws, black faces behind
        const Wd = 3 * (PW + GAP) + 0.2, at = (x, y, f) => M.clone().addScaledVector(right, x).addScaledVector(n, f).setY(y), yTop = y0 + 2 * PH + 1.5;
        for (const y of [y0 - 0.3, yTop + 0.3]) bMir.bar(at(-Wd, y, -0.05), at(Wd, y, -0.05), 0.16, { carrier: 0.9 });
        for (const sx of [-1, 1]) bMir.bar(at(sx * Wd, y0 - 0.3, -0.05), at(sx * Wd, yTop + 0.3, -0.05), 0.14, { carrier: 0.9 });
        bMir.plate(at(-Wd, yTop + 0.3, -0.2), at(Wd, yTop + 0.3, -0.2), at(Wd, yTop + 0.9, 1.5), at(-Wd, yTop + 0.9, 1.5), { codes: [0.5, 1] });   // the hood along the head
        for (const [y, deep] of [[y0 + PH + 0.35, 1.2], [y0 - 0.45, 1.5]]) {
          bMir.plate(at(-Wd, y, 0), at(Wd, y, 0), at(Wd, y, deep), at(-Wd, y, deep), { codes: [0.5, 1] });               // the walkway's deck: its edge toward us pale
          bMir.bar(at(-Wd, y + 1.05, deep), at(Wd, y + 1.05, deep), 0.03, { carrier: 0.5 });                              // its handrail
          for (let x = -Wd; x <= Wd + 1e-6; x += Wd / 9) bMir.bar(at(x, y, deep), at(x, y + 1.05, deep), 0.025, { carrier: 0.4 });
        }
        for (const dz of [0.25, 0.8]) bMir.bar(at(-Wd - 0.7, 0, dz), at(-Wd - 0.7, yTop + 1.3, dz), 0.04, { carrier: 0.5 });   // the ladder's stringers, and a rung each 0.5 m
        for (let y = 0.5; y < yTop + 1.2; y += 0.5) bMir.bar(at(-Wd - 0.7, y, 0.25), at(-Wd - 0.7, y, 0.8), 0.018, { carrier: 0.3 });
        for (const y of [y0 + PH + 0.35, yTop]) bMir.bar(at(-Wd - 0.7, y, 0.5), at(-Wd, y, 0.5), 0.03, { carrier: 0.4 });
        // THE LAMPS ARE AIMED: every unit turned in its panel BOARD_AIM degrees off the leg's line, back toward
        // whoever comes down the leg; it stands 0.3 m proud of the plate and is 1.45 times the part's unit (0.7 m,
        // its glass 0.26: a plain round glass one can see across the water)
        const th = BOARD_AIM * Math.PI / 180, aim = cu0.clone().multiplyScalar(-Math.cos(th)).addScaledVector(pt0, -Math.sin(th)).normalize();
        for (const t of S.board) { t.pos = t.pos.clone().addScaledVector(n, 0.3); t.dir = aim; t.scale = 1.45; }
      }
      const wa = M.clone().addScaledVector(right, -3 * (PW + GAP)), wb = M.clone().addScaledVector(right, 3 * (PW + GAP));
      // (order 3, E6) no outline round the dark board (from the leg before its stretch it read as an empty wire
      // rectangle, and so did a foot rail on its legs): its legs alone stand as a rank of posts in the water; lit, its
      // lamps' pale rims draw the panels
      void wa; void wb;
      for (let x = 0; x <= 1; x += 1 / 30) for (let y = y0; y <= y0 + 2 * PH + 2; y += 2) claim('board', wa.clone().lerp(wb, x).setY(y), 1.6);
      void e; void sgn;
    }
    await ctx.yield();

    // THE LAST POST at the cutting's lip: a searchlight signal, a round black target 1.6 m across, 3.4 m to port
    // and 1 m over the course at s 994; its lens cracked, faltering on the world's clock from the first metre
    {
      // (order 3, E1) the near cracked lens LARGE: a target 2.1 m across, 3.7 m to port, its glass a metre over the eye
      // (4.8 m over the water: we come low to the lip, so its long streak in the lip's water runs to our feet)
      const lp = P(993.5, 3.7, Y[994] + 1.1), dir = lookBack(lp, 0.3), L = lampAt(lp), base = P(994, 3.8);
      const site = { pos: lp, dir, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: 0.37, cracked: 1, flicker: 1, scale: 2.6 };
      S.target.push(site); streakYard.push(site); lampRain(rng.fork('last'), lp, dir, L, 50, 10);   // (order 2, D5) its lit cone of rain fuller and longer
      bUp.bar(base, base.clone().setY(lp.y + 1.3), 0.12, { tint: [L.turnAt, L.doubt, 0.9] }); bUp.bar(base.clone().setY(lp.y), lp.clone().addScaledVector(dir, -0.05), 0.07, { carrier: 0.6 });
      bUp.bar(base.clone().setY(0.3).addScaledVector(dir, -0.35), base.clone().setY(lp.y - 1).addScaledVector(dir, -0.35), 0.025, { carrier: 0.4 });
      claimBar('last post', base, base.clone().setY(lp.y + 1.3), 0.4); claim('last post', lp, 1.1);
    }
    // THE MAIN LINE'S CUTTING, 30 m wide and 22 m deep from its end wall at s 1010: wet steel pile walls (each
    // pile a plate, in and out), wall heads each 10 m to s 1140, a deck of twelve girders at yard level over
    // s 1140-1250, the hood at s 1250. The floor is water: its own mirror group and film.
    const smearCut = [], rimFloor = [], rimRuns = [];
    // (order 1, B5) the wall heads run on under the deck as far as the one formula lets a lamp stand before the rim's
    // first pane (lampAt stands none later): CUT_LAST is the last such metre, found by asking the formula, not typed.
    // (order 2, D1/D2) CUT_LAST is worked out at the head of the build; past it a pile takes the rim's number
    const rc = rng.fork('cutting'), cutTint =(s, side) => { if (s > DECK0) return [rimNear(P(s, side * 14.5, FLOOR_Y + 7.5)), 0, 1]; const p = P(Math.min(CUT_LAST, Math.max(1020, Math.round(s / 10) * 10)), side * 14.5, FLOOR_Y + 7.5); return [tintAt(p, FLOOR_Y), 0, 1]; };
    for (const side of [-1, 1]) {
      for (let i = 0; i < 117; i++) {
        // a pile takes its wall head's tint as area where the lamp reaches it: strongest on the pile under the
        // lamp and in the band of its height, long streaks down the plate, little elsewhere
        const s = MOUTH + i * 2.5, w0 = 15 + 0.35 * (i % 2), w1 = 15 + 0.35 * ((i + 1) % 2), t = cutTint(s + 1.25, side);
        // (order 2, D2) in the covered way every pile is wet toward the rim: its runs and beads take the rim's colour
        const ds = s + 1.25 > CUT_LAST + 6 ? 9 : Math.abs(s + 1.25 - Math.round((s + 1.25) / 10) * 10), hf = s + 1.25 > 1136 ? 0.55 : s + 1.25 > RIM_WAY ? 0.2 : ds < 1.5 ? 1 : ds < 4 ? 0.3 : 0.16;
        // (order 1, B5) deep in the cutting the floodlight finds no pile: shade lines only, and the lamps' smears,
        // pools and beads light the wet wall; only the top three metres of the open stretch catch the floodlight.
        // No step of tone across the wall: the lip's pale band is short and stops at the deck.
        for (const [y0, y1, vf] of [[FLOOR_Y, -3, 1], [-3, 0, 0.3]])
          bCut.plate(PC(s, side * w0, y0), PC(s, side * w0, y1), PC(s + 2.5, side * w1, y1), PC(s + 2.5, side * w1, y0), { tint: [t[0], 0, hf * vf], codes: vf === 1 || s >= 1137 ? [0.5, 0.5] : undefined });
        // (order 4, H8) THE WALLS ARE SHEET PILES: at every joint an upright RIB (the interlock: a steel line the
        // floodlight draws, black against a lit face), one each 2.5 m: a pitch one can read from the lip to the hood
        bCut.bar(PC(s, side * (w0 - 0.1), FLOOR_Y), PC(s, side * (w0 - 0.1), -0.2), 0.06, { carrier: 0.5 });
      }
      // (order 4, H8) THE WALERS: four level beams along each wall (WALER_Y over the floor) tie the piles: a black
      // face 0.44 m deep, proud of the piles, with its top flange; each carries the rim's image as ONE long clean
      // line (rimRuns below) and, by a wall head, that lamp's graded patch like every wet face
      for (const wy of WALER_Y) for (let s = MOUTH; s < 1287; s += 10) {
        const s1 = Math.min(1290, s + 10), y0 = FLOOR_Y + wy - 0.22, y1 = FLOOR_Y + wy + 0.22;
        bCut.plate(PC(s, side * 14.6, y0), PC(s1, side * 14.6, y0), PC(s1, side * 14.6, y1), PC(s, side * 14.6, y1), { codes: [0.5, 1] });
        bCut.plate(PC(s, side * 14.6, y1), PC(s1, side * 14.6, y1), PC(s1, side * 15.3, y1), PC(s, side * 15.3, y1), { codes: [0, 0] });
      }
      bCut.bar(PC(MOUTH, side * 15.2, 0), P(1290, side * 15.2, 0), 0.12, { carrier: 0.9 });
      for (let s = 1020; s <= 1240; s += 10) {
        // (order 4, H1) a wall head stands 2.2 m out from its wall on its bracket (it stood 0.6 m out, and its light
        // only grazed the piles): the wet piles and walers within its reach now face it and carry its GRADED PATCH
        const lp = P(s, side * 12.8, FLOOR_Y + 7.5), L = lampAt(lp, FLOOR_Y); if (!L) continue;
        const deckK = s >= 1138 ? 1.6 : 1;   // under the deck everything drips: the wet walls and floor give the lamps back more strongly (B5: the cutting peaks toward the hood)
        const dir = lookBack(lp, 0.4), site = { pos: lp, dir, turnAt: L.turnAt, doubt: L.doubt, strength: fault(rc), seed: rc(), scale: 1.9 };
        S.target.push(site); S.cutT.push(site); streakCut.push({ ...site, pos: lp.clone().setY(7.5), gain: 1.5 * deckK }); if (s < 1138) lampRain(rc, lp, dir, L, 14, 11, FLOOR_Y);   // (order 2, D2) the open cutting's wall heads at full strength
        // its smears down the wet piles (the part's makeSmears): three runs under the lamp's image on the wall
        for (const [da, g, un] of [[0, 1, 2.3], [-1.2, 0.7, 1.9], [1.3, 0.65, 2.1], [-2.5, 0.42, 1.6], [2.6, 0.42, 1.7], [-3.9, 0.22, 1.3], [4, 0.22, 1.4]]) smearCut.push({ pos: P(s + da, side * 14.9, FLOOR_Y + 7.3), dir: port(s).multiplyScalar(-side),
          unit: un, width: 0.34, turnAt: L.turnAt, doubt: L.doubt, strength: site.strength, seed: (site.seed + da * 0.37 + 1) % 1, gain: g * deckK });
        bCut.bar(P(s, side * 15, FLOOR_Y + 7.5), lp, 0.06, { carrier: 0.6 });
      }
      await ctx.yield();
    }
    // (order 3, E2) THE LAST SIGNAL OF THE CUTTING, s 1093: a searchlight signal on its post by the starboard road, 3.6 m
    // from the flown line, its large glass 3.9 m over the floor (the eye's height there). It stands at the last metre
    // where the one formula lets a lamp stand before the rim (lampAt: its number is about 984): green, close and
    // large on one side with its cone of rain, its smear down the wet piles behind it and its streak in the floor's
    // water, while the red-lit covered way runs on past it to the rim.
    let cutPost = null;
    {
      // (it stands to STARBOARD: the lip's large glass, the last post, stood to port: the two pictures are not alike)
      // (order 3, G5: it overrides the post) OF ANOTHER KIND THAN THE LIP'S GREAT ROUND LENS, BY PLACE: no disc on a
      // post but a BRACKET SIGNAL: an iron lattice arm reaches 11 m out from the starboard wall, stayed from above and
      // strutted from below, and from its end hangs a tall hooded case with two lenses one over the other (the
      // part's 'dwarf' unit at twice its size: the upper lens is the green one, the lower the red one, dark once it
      // has turned). Its middle hangs 5.3 m over the floor, 4 m to starboard of s 1091 (the last place the one
      // formula lets so high a lamp stand: its number is about 984): seen from below and half from the side.
      // (order 5, K2) IT STANDS BACK AND LOWER, by place (CUT_SIG: the plan's metre, metres to port, metres over the
      // floor): 8 m from the flown line (it was 4: tilted, cramped and cut by the picture's edges as we passed under
      // it) and its middle 4.2 m over the floor, a metre over the eye's height there, on a 7 m arm from the wall: the
      // eye looks at it level and it stands whole and upright. The one formula still lets it stand here (984.8).
      const KQ = 2, lp = P(CUT_SIG[0], CUT_SIG[1], FLOOR_Y + CUT_SIG[2]), L = lampAt(lp, FLOOR_Y);
      if (!L) console.error('YARD: the cutting\'s last signal cannot stand at s 1091 (its number passes the rim\'s rule)');
      if (L) {
        // (order 5, K2) its head is AIMED at the flown line some 6 m before its own place (52 degrees off the way's
        // line; it was 17): as we pass, the eye sees into its two glasses and not the case's edge
        const dir = lookBack(lp, 1.3), rt = V3(dir.z, 0, -dir.x), site = { pos: lp, dir, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: 0.61, scale: KQ, lit: 16.5, back: 1 };
        S.cutD.push(site); streakCut.push({ ...site, pos: lp.clone().setY(CUT_SIG[2]), gain: 1.6 }); cutPost = site;
        lampRain(rE.fork('cut post'), lp, dir, L, 26, 10, FLOOR_Y);
        // the case: five black plates behind the unit's face (as the part's dwarf case)
        const t = [L.turnAt, L.doubt, 0.55], pt = (sx, sy, bk) => lp.clone().addScaledVector(rt, sx * 0.27 * KQ).add(V3(0, sy * 0.57 * KQ, 0)).addScaledVector(dir, (-0.004 - bk * 0.34) * KQ);
        for (const sx of [-1, 1]) bCut.plate(pt(sx, -1, 0), pt(sx, 1, 0), pt(sx, 1, 1), pt(sx, -1, 1), { tint: t });
        for (const sy of [-1, 1]) bCut.plate(pt(-1, sy, 0), pt(1, sy, 0), pt(1, sy, 1), pt(-1, sy, 1), { tint: t });
        bCut.plate(pt(-1, -1, 1), pt(-1, 1, 1), pt(1, 1, 1), pt(1, -1, 1), {});
        // the arm (a Warren girder, a black body with its bracing on it), its hangers, stay and strut, its wall plate
        const mid = lp.clone().addScaledVector(dir, -0.17 * KQ), pw = port(1091), aside0 = near(mid.x, mid.z).aside;
        const A = mid.clone().addScaledVector(pw, 0.9), B = mid.clone().addScaledVector(pw, -(14.95 - aside0)), YB = FLOOR_Y + CUT_SIG[2] + 1.7, YT = FLOOR_Y + CUT_SIG[2] + 2.6;   // (order 5, K2) the arm hangs with the case (it stood at 7.0 to 7.9 m)
        truss(bCut, A, B, YB, YT, 8, 0.045, { posts: true, tintAt: () => [L.turnAt, L.doubt, 0.5] });
        for (const sx of [-1, 1]) bCut.bar(pt(sx * 0.8, 1, 0.5), pt(sx * 0.8, 1, 0.5).setY(YB), 0.04, { carrier: 0.5 });
        bCut.bar(B.clone().setY(YT + 3.4), A.clone().lerp(B, 0.3).setY(YT), 0.035, { carrier: 0.5 });
        bCut.bar(B.clone().setY(YB - 3.4), A.clone().lerp(B, 0.62).setY(YB), 0.06, { carrier: 0.6 });
        bCut.bar(B.clone().setY(YB - 3.8), B.clone().setY(YT + 3.8), 0.09, { carrier: 0.7 });
        for (const [da, g, un] of [[0, 1, 2.6], [-1.3, 0.7, 2.1], [1.2, 0.7, 2.2], [-2.6, 0.4, 1.7], [2.7, 0.4, 1.8]]) smearCut.push({ pos: P(CUT_SIG[0] + da, -14.9, FLOOR_Y + CUT_SIG[2] - 0.1), dir: port(1091),
          unit: un, width: 0.4, turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: (0.61 + da * 0.37 + 1) % 1, gain: g });
        claimBar('cutting bracket', A.clone().setY(YB + 0.45), B.clone().setY(YB + 0.45), 0.6); claim('cutting signal', lp, 1.35);
      }
    }
    for (const s of [MOUTH, 1290]) for (let i = 0; i < 12; i++) bCut.plate(PC(s, -15 + i * 2.5, FLOOR_Y), PC(s, -15 + i * 2.5, 0), PC(s, -12.5 + i * 2.5, 0), PC(s, -12.5 + i * 2.5, FLOOR_Y), { tint: [cutTint(1020, 1)[0], 0, 0.12] });
    for (let s = 1140; s <= 1250; s += 10) {
      const t = [tintAt(P(s, 0, -2.6), FLOOR_Y), 0, 1];          // a girder takes the number of the pane nearest ITSELF (the deck's level)
      bCut.plate(P(s, -15, -2.6), P(s, 15, -2.6), P(s, 15, 0), P(s, -15, 0), { codes: [0, 0] });
      bCut.bar(P(s, -15, -2.6), P(s, 15, -2.6), 0.16, { tint: t, carrier: 1.0 });
      // (order 1, C8) a girder is a heavy thing close overhead: a lower flange 0.9 m wide (a plate with its two edges
      // of shade steel), stiffeners down its web each 2.5 m, and three more drips near the flown line
      bCut.plate(P(s - 0.45, -15, -2.62), P(s - 0.45, 15, -2.62), P(s + 0.45, 15, -2.62), P(s + 0.45, -15, -2.62), { codes: [0.5, 0.5] });
      for (const ds of [-0.45, 0.45]) bCut.bar(P(s + ds, -15, -2.62), P(s + ds, 15, -2.62), 0.05, { tint: t, carrier: 0.6 });
      for (let w = -12.5; w <= 12.5; w += 2.5) bCut.bar(P(s - 0.02, w, -2.5), P(s - 0.02, w, -0.1), 0.045, { carrier: 0.5 });
      for (let i = 0; i < 7; i++) dripAt.push(P(s, rc.range(-13, 13), -2.8));   // (order 1, B5) strings of drips off every girder
      for (const w of [-3.4, 1.7, 4.1]) dripAt.push(P(s + 0.3, w, -2.8));
    }
    bCut.plate(P(1138, -15.4, 0.05), P(1138, 15.4, 0.05), P(1292, 15.4, 0.05), P(1292, -15.4, 0.05), { codes: [0, 0] });   // the deck
    // (order 5, L6) IN THE CAGE, SOMETHING TO PASS, by place: A PLATELAYERS' GALLERY on the port wall under the deck's
    // first bays (CAGE_HUT: its first and last metre of the plan), standing on the third waler 12.6 m over the floor:
    // a deck on raking brackets with its handrail, a HUT on it (door, window, lean-to roof) and a ladder down to the
    // floor. Black wet bodies under the one law of this place: no lamp stands here (none may: the rim alone turns
    // after the lip), so what lights them is the RIM, by the pane nearest each thing's own place (rimNear): its two
    // long runs lie along the hut's wet wall and one along the deck's edge, as they lie along the walers. It ends
    // before s 1168: the way's last picture, the hood head-on, is as it was.
    {
      const [G0, G1] = CAGE_HUT, gy = FLOOR_Y + WALER_Y[2], a0 = 8.2, a1 = 14.5, tn = (p) => [rimNear(p), 0, 1], mid = P((G0 + G1) / 2, a0, gy);
      bCut.plate(P(G0, a0, gy), P(G1, a0, gy), P(G1, a1, gy), P(G0, a1, gy), { codes: [0.5, 0] });
      bCut.plate(P(G0, a0, gy - 0.4), P(G1, a0, gy - 0.4), P(G1, a0, gy), P(G0, a0, gy), { codes: [0.5, 0.5], tint: tn(mid) });
      for (let s = G0; s <= G1 + 0.01; s += 2.5) { bCut.bar(P(s, a0, gy), P(s, a0, gy + 1.1), 0.03, { carrier: 0.4 }); bCut.bar(P(s, a0 + 0.1, gy - 0.35), P(s, a1, gy - 3), 0.07, { carrier: 0.6, tint: tn(P(s, a0, gy)) }); }
      for (const y of [0.55, 1.1]) bCut.bar(P(G0, a0, gy + y), P(G1, a0, gy + y), 0.03, { carrier: 0.45, tint: tn(mid) });
      const hs = G0 + 6, hc = P(hs + 3.2, 12.4, gy + 2.0), ia = 10.47;
      addBox(bCut, hc, port(hs + 3.2), course(hs + 3.2), 1.9, 2.0, 3.2, { tint: tn(hc) });
      bCut.plate(P(hs - 0.5, 9.9, gy + 4.0), P(hs + 6.9, 9.9, gy + 4.0), P(hs + 6.9, a1, gy + 4.8), P(hs - 0.5, a1, gy + 4.8), { codes: [1, 0.5] });
      // its HOIST: a jib out over the way from the hut's eaves (its tip 4.4 m from the flown line), a chain and a hook
      // block hanging from it: a thing passed close by
      { const jt = P(hs + 3.2, 4.4, gy + 4.55), jr = P(hs + 3.2, 10.3, gy + 4.2), hk = P(hs + 3.2, 4.6, gy - 1.2);
        bCut.bar(jr, jt, 0.1, { carrier: 0.7, tint: tn(jt) }); bCut.bar(P(hs + 3.2, 10.3, gy + 2.4), P(hs + 3.2, 6.3, gy + 4.45), 0.06, { carrier: 0.6 });
        bCut.bar(P(hs + 3.2, 4.6, gy + 4.5), hk, 0.035, { carrier: 0.5, tint: tn(hk) });
        addBox(bCut, hk.clone().add(V3(0, -0.4, 0)), port(hs + 3.2), course(hs + 3.2), 0.3, 0.42, 0.16, { tint: tn(hk) });
        bCut.chain([hk.clone().add(V3(0, -0.82, 0)), hk.clone().add(V3(0, -1.35, 0)), P(hs + 3.2, 4.25, gy - 2.75), P(hs + 3.2, 4.05, gy - 2.45)], 0.05, { carrier: 0.45 });
        claimBar('cage hoist', jr, jt, 0.35); claimBar('cage hoist', jt, hk.clone().add(V3(0, -1.6, 0)), 0.5); }
      bCut.chain([P(hs + 0.7, ia, gy + 0.05), P(hs + 1.7, ia, gy + 0.05), P(hs + 1.7, ia, gy + 2.2), P(hs + 0.7, ia, gy + 2.2)], 0.03, { closed: true, carrier: 0.4 });
      bCut.chain([P(hs + 3.1, ia, gy + 1.1), P(hs + 5.5, ia, gy + 1.1), P(hs + 5.5, ia, gy + 2.2), P(hs + 3.1, ia, gy + 2.2)], 0.03, { closed: true, carrier: 0.4 });
      for (const sx of [3.9, 4.7]) bCut.bar(P(hs + sx, ia, gy + 1.1), P(hs + sx, ia, gy + 2.2), 0.02, { carrier: 0.3 });
      for (const ds of [-0.25, 0.25]) bCut.bar(P(G1 - 1 + ds, a0 - 0.08, FLOOR_Y), P(G1 - 1 + ds, a0 - 0.08, gy + 1.1), 0.035, { carrier: 0.45 });
      for (let y = FLOOR_Y + 0.5; y < gy; y += 0.5) bCut.bar(P(G1 - 1.25, a0 - 0.08, y), P(G1 - 0.75, a0 - 0.08, y), 0.02, { carrier: 0.3 });
      claimBar('cage gallery', P(G0, 11.4, gy + 1.6), P(G1, 11.4, gy + 1.6), 3.4);
      const bk = course(hs + 3.2).multiplyScalar(-1);
      for (const dy of [0.75, 2.55]) rimRuns.push({ pos: P(hs + 6.2, ia - 0.03, gy + dy), dir: bk, unit: 2.2, len: 3.6, width: 0.06, turnAt: rimNear(P(hs + 6.2, ia, gy + dy)), doubt: 0, strength: 1, seed: (0.23 + dy * 0.31) % 1, gain: 1.6 });
      rimRuns.push({ pos: P(G1 - 0.3, a0 - 0.03, gy - 0.2), dir: bk, unit: 6, len: 4.2, width: 0.07, turnAt: rimNear(P(G1, a0, gy)), doubt: 0, strength: 1, seed: 0.71, gain: 1.6 });
    }
    for (const side of [-1, 1]) for (const y of [-1, -8, -15, -21]) claimBar('cutting wall', PC(MOUTH, side * 15.6, y), P(1290, side * 15.6, y), 1);
    claimBar('cutting end wall', PC(MOUTH, -15, -0.6), PC(MOUTH, 15, -0.6), 0.6);
    for (let s = 1140; s <= 1250; s += 10) claimBar('deck girder', P(s, -15, -1.3), P(s, 15, -1.3), 1.4);
    // THE HOOD, the way out: a black drum 18 m across and 9 m deep on the main line, its opening 7.5 m in radius,
    // its centre 9 m over the floor, its foot in the water; hooded above. Whole and lit from the first frame.
    {
      const ring = (r, s, i) => { const a = i / 24 * 6.2831853; return hoodC.clone().addScaledVector(hU, Math.cos(a) * r).add(V3(0, Math.sin(a) * r, 0)).addScaledVector(hC, s); };
      for (let i = 0; i < 24; i++) {
        const top = i >= 1 && i < 11 ? -12.5 : -9;                                   // the visor over the crown
        // (bHood: the drum stands in the upright world only; its double in the floor is its panes' long smear, B4)
        bHood.plate(ring(9, top, i), ring(9, 0, i), ring(9, 0, i + 1), ring(9, top, i + 1), { codes: [0.5, 0.5] });   // under the deck the floodlight finds no plate: shade lines only (no splayed pale blades round the visor)
        bHood.plate(ring(7.5, -9, i), ring(7.5, 0, i), ring(7.5, 0, i + 1), ring(7.5, -9, i + 1), { codes: [0, 0] });
        bHood.plate(ring(7.5, 0, i), ring(9, 0, i), ring(9, 0, i + 1), ring(7.5, 0, i + 1), { codes: [0, 0] });
        for (const s of [-8, -4, -0.5]) claim('hood drum', ring(8.25, s, i), 0.8);
      }
      // (order 1, B4) the drum reads as a DRUM: its front lip and the visor's lip in cold steel (no lamp colour), and
      // hoops round its shell; the mirror below shows them again, cut by the water's rings
      bHood.chain(Array.from({ length: 24 }, (_, i) => ring(9.04, i >= 1 && i < 11 ? -12.5 : -9, i)), 0.1, { closed: true, carrier: 0.9 });
      for (const s of [-6, -3, 0]) bHood.chain(Array.from({ length: 24 }, (_, i) => ring(9.04, s, i)), 0.06, { closed: true, carrier: 0.7 });
      for (let k = 0; k < 12; k++) {     // the rim's twelve panes (their numbers were taken at the head of the build)
        const { pos, L } = rimPanes[k];
        // a pane's streak is as wide as the pane stands in plan (the crown's and the foot's lie wide, the cheeks' narrow)
        streakCut.push({ rim: true, pos: pos.clone().setY(pos.y - FLOOR_Y), dir: hC.clone().multiplyScalar(-1), turnAt: L.turnAt, doubt: L.doubt, strength: 1, seed: k / 12, gain: 1.7, width: 0.3 + 0.45 * Math.abs(Math.sin((k + 0.5) / 12 * 6.2831853)) });
      }
      // (order 2, D2) THE COVERED WAY IS LIT BY THE RIM ALONE. Every wet surface that faces the rim carries its image as
      // a long broken reflection, each in ITS PANE'S colour by that pane's own number, shivering by the world's clock:
      // strongest by the rim, thinning toward us, gone 20 m short of the last wall head: seen from the lip the open
      // cutting is its wall heads' green and the rim far down it the one red lamp over its own red reflections
      const back = hC.clone().multiplyScalar(-1), face = 1241, reach = face - (CUT_LAST + 20);
      for (let k = 0; k < 12; k++) {
        const { pos, L } = rimPanes[k], h = pos.y - FLOOR_Y, a = (k + 0.5) / 12 * 6.2831853, sd = (k * 0.618 + 0.21) % 1;
        // 1. THE FLOOR'S WATER: the pane's image drawn out toward us as far as the water runs (the part's streak, to
        //    63 m under the floor: it reaches our feet all along the covered way), the twelve side by side a broad path
        rimFloor.push({ pos: pos.clone().setY(9).addScaledVector(hU, Math.sin(a) < 0 ? -1.3 * Math.sign(Math.cos(a)) : 0), dir: back, turnAt: L.turnAt, doubt: 0, strength: 1, seed: sd, gain: 1.15, width: 0.42 + 0.3 * Math.abs(Math.sin(a)), len: 7 });
        // 2. EACH WET PILE WALL: a long smear running along the wall toward us at the pane's own height (the part's
        //    run): the pane's nearer wall carries it strongest, two runs of unequal measure to each wall
        //    (order 4, H8) A FEW LONG CLEAN LINES ALONG THE WALERS: each waler of each wall holds the image of the pane
        //    that stands nearest its own height on its own side, as one hard line toward us (it was two blurred runs
        //    to a pane, twenty-four to a wall), and a fainter second line on the waler's wet upper edge
        for (const side of [-1, 1]) WALER_Y.forEach((wy, j) => {
          if (Math.cos(a) * side <= 0 || rimPanes.some((q, k2) => { const a2 = (k2 + 0.5) / 12 * 6.2831853; return Math.cos(a2) * side > 0 && Math.abs(q.pos.y - FLOOR_Y - wy) < Math.abs(h - wy) - 1e-6; })) return;
          for (const [dy, wd, gn] of [[-0.03, 0.16, 2], [0.2, 0.035, 1]])
            rimRuns.push({ pos: P(face, side * 14.56, FLOOR_Y + wy + dy), dir: back, unit: 15, len: 1 + reach / 15, width: wd, turnAt: L.turnAt, doubt: 0, strength: 1, seed: (sd + 0.37 * j + 0.19 * (side + 1) + dy) % 1, gain: gn });
        });
      }
      // 3. EACH GIRDER'S LOWER FLANGE: a hard line of the rim's colour along its edge, strongest under the line to the
      //    rim and running out to both walls (two runs to a girder, each by the number of the pane nearest its place)
      for (let s = 1140; s <= 1240; s += 10) for (const side of [-1, 1])
        rimRuns.push({ pos: P(s - 0.47, side * 0.4, -2.7), dir: port(s).multiplyScalar(side), unit: 5.5, len: 3.4, width: 0.04, turnAt: rimNear(P(s - 0.47, side * 0.4, -2.7)), doubt: 0, strength: 1, seed: (s * 0.071 + 0.3 * side + 1) % 1, gain: 1.5 + (s - 1140) * 0.012 });
    }
    await ctx.yield();

    // THE POLE ROUTE: telegraph poles along the starboard edge of the roads, 38.5 m off, each 30 m from the throat to
    // the delta, two crossarms, six wires sagging between and swaying on the world's clock (the body's own sway)
    {
      const rw = rng.fork('poles'), tops = [];
      for (let s = -30; s <= 540; s += 30) {
        const base = P(s, -38.5 + rw.range(-0.4, 0.4)), top = base.clone().add(V3(rw.range(-0.25, 0.25), 9.5, rw.range(-0.25, 0.25))), ux = port(s);
        bUp.bar(base, top, 0.11, { carrier: 0.9 });
        const arms = [8.9, 8.1].map((y) => { const c = base.clone().lerp(top, y / 9.5); bUp.bar(c.clone().addScaledVector(ux, -1.3), c.clone().addScaledVector(ux, 1.3), 0.05, { carrier: 0.5 }); return c; });
        tops.push({ arms, ux }); claimBar('telegraph pole', base, top, 0.4);
      }
      for (let i = 0; i < tops.length - 1; i++) for (let w = 0; w < 6; w++) {
        const a = tops[i], b = tops[i + 1], off = [-1.2, 0, 1.2][w % 3], row = w < 3 ? 0 : 1, sag = rw.range(0.5, 1.0) + (w === 4 ? 0.9 : 0), ph = rw.range(0, 6.28);   // one wire sags
        const A = a.arms[row].clone().addScaledVector(a.ux, off), B = b.arms[row].clone().addScaledVector(b.ux, off), sv = a.ux;
        for (let k = 0; k < 4; k++) {
          const t0 = k / 4, t1 = (k + 1) / 4, p0 = A.clone().lerp(B, t0), p1 = A.clone().lerp(B, t1), w0 = Math.sin(t0 * Math.PI), w1 = Math.sin(t1 * Math.PI);
          p0.y -= w0 * sag; p1.y -= w1 * sag;
          bUp.bar(p0, p1, 0.012, { carrier: 0.5, sway0: [sv.x * w0 * 0.25, 0, sv.z * w0 * 0.25, ph], sway1: [sv.x * w1 * 0.25, 0, sv.z * w1 * 0.25, ph] });
        }
      }
    }
    await ctx.yield();
    // THE SIDE COUNTRY AND THE HORIZON: lamps in files along roads we never reach, 45 m to 2.5 km from the course,
    // patches of true dark between; each a fixed quad by its place with its streak in the wet below (FAR_VS). Those
    // within 800 m of the yard's middle stand as crossed pairs. Each takes its number from its place like every
    // other lamp, so none is sown where it would pass LAST_TURN and the horizon turns behind the front.
    const rf = rng.fork('far'), YC = V3(-260, 0, 190), farF = [], farL = [];
    const inCut = (p) => { const dx = p.x - cw.x, dz = p.z - cw.z, u = dx * cu.x + dz * cu.z, w = dx * cp.x + dz * cp.z; return u > -30 && u < 320 && Math.abs(w) < 40; };
    const farLamp = (p) => {
      const n = nearPlan(p.x, p.z); if (n.aside < 45 || inCut(p) || Math.hypot(p.x - tw.x, p.z - tw.z) < 112) return;
      const L = lampAt(p); if (!L) return;
      const st = fault(rf) * (n.aside < 400 ? 0.8 : 1), sd = rf(), w = Math.atan2(p.x - YC.x, -(p.z - YC.z));
      farF.push(p.x, p.y, p.z, w); farL.push(L.turnAt, L.doubt, st, sd);
      if (Math.hypot(p.x - YC.x, p.z - YC.z) < 800) { farF.push(p.x, p.y, p.z, w + 1.5708); farL.push(L.turnAt, L.doubt, st, sd); }
    };
    // (order 1, B3) THE FAR BAND WITH DEPTH. Besides the files along far roads: CLUMPS, each a distant works round a
    // black body that cuts the band behind it (a shed, a stage on legs, a stack), with a gantry's strict rank of lamps
    // in two tiers 12 to 23 m up and one to three lamp masts (a strict upright rank to 28-70 m). Bodies and lamps by
    // place like every other: each lamp takes its number by the one formula, and none stands past LAST_TURN.
    {
      const rfc = rng.fork('far clumps'), nClump = Math.round(64 * density), fdir = V3(flood.x, 0, flood.z).normalize(), NOT = [0, 0, 0];
      for (let c = 0; c < nClump; c++) {
        const a = rfc.range(0, 6.2831853), rad = c % 3 === 0 ? rfc.range(210, 520) : rfc.range(420, 1500);
        const o = V3(YC.x + Math.cos(a) * rad, 0, YC.z + Math.sin(a) * rad), yaw = rfc.range(0, 3.14159), ux = V3(Math.cos(yaw), 0, Math.sin(yaw)), uz = V3(-ux.z, 0, ux.x);
        const kind = rfc.pick(['shed', 'stage', 'stack', 'shed', 'stage']), n = rfc.int(8, 16), gh = rfc.range(12, 20), nm = rfc.int(1, 3), L = rfc.range(24, 60), Hb = rfc.range(9, 20), mh = [rfc.range(28, 70), rfc.range(28, 70), rfc.range(28, 70)];
        const nn = nearPlan(o.x, o.z), e = V3(o.x - X[0], 0, o.z - Z[0]).normalize();
        if (nn.aside < 150 || inCut(o) || Math.hypot(o.x - tw.x, o.z - tw.z) < 190 || e.dot(fdir) > 0.965) continue;   // clear of the yard, the tower's water and the floodlight's bearing
        const at = (x, y, z) => o.clone().addScaledVector(ux, x).addScaledVector(uz, z).setY(y);
        if (kind === 'shed') addBox(bMir, at(0, Hb / 2, 0), ux, uz, L / 2, Hb / 2, 9, { tint: NOT, bare: true });
        else if (kind === 'stage') { addBox(bMir, at(0, Hb * 0.5 + 6, 0), ux, uz, L / 5, Hb * 0.5 + 6, 6, { tint: NOT, bare: true }); addBox(bMir, at(L / 5 + 9, Hb * 0.25, 0), ux, uz, 9, Hb * 0.25, 5, { tint: NOT, bare: true }); }   // a tall house with a lean-to: it stands on the ground whole, so its double hangs from it
        else bMir.bar(at(0, 0, 0), at(0, Hb * 3.2, 0), 2.1, { carrier: 5.2 });
        for (const sx of [-1, 1]) bMir.bar(at(sx * n * 3, 0, 13), at(sx * n * 3, gh + 4, 13), 0.3, { carrier: 1.3 });   // the gantry's legs and deck
        bMir.bar(at(-n * 3, gh - 1.2, 13), at(n * 3, gh - 1.2, 13), 0.4, { carrier: 1.5 });
        const nl = Math.max(4, Math.round(n * detail));
        for (let i = 0; i < nl; i++) for (const dy of [0, 3.2]) if (!rfc.chance(0.08)) farLamp(at((i - (nl - 1) / 2) * 6 * n / nl, gh + dy, 13));
        for (let k = 0; k < nm; k++) {
          const x = (k - 1) * (L / 2 + 6) + (nm === 1 ? L / 2 + 6 : 0);
          bMir.bar(at(x, 0, -4), at(x, mh[k] + 2, -4), 0.35, { carrier: 1.4 });
          for (let y = 14; y <= mh[k]; y += 5 / Math.min(1, detail + 0.2)) farLamp(at(x, y, -4));
        }
        if (c % 8 === 7) await ctx.yield();
      }
    }
    await ctx.yield();
    const nFiles = Math.round(540 * detail * density);
    for (let f = 0; f < nFiles; f++) {
      const inner = f % 4 === 0, a = rf.range(0, 6.2831853), rad = inner ? rf.range(120, 620) : 500 + 2000 * Math.sqrt(rf());
      const o = V3(YC.x + Math.cos(a) * rad, 0, YC.z + Math.sin(a) * rad), da = a + 1.5708 + rf.range(-0.7, 0.7), dx = Math.cos(da), dz = Math.sin(da);
      const n = rf.int(14, 46), gap = inner ? rf.range(9, 16) : rf.range(14, 34), h = rf.range(4, 9);
      for (let i = 0; i < n; i++) { if (rf.chance(0.12)) continue; farLamp(V3(o.x + dx * i * gap + rf.range(-1, 1), h + rf.range(-0.6, 0.6), o.z + dz * i * gap + rf.range(-1, 1))); }
      if (f % 12 === 11) await ctx.yield();
    }
    await ctx.yield();
    // RAIN ALONG THE COURSE: fixed columns by place, caught by the floodlight and by the lamps of their place;
    // DRIPS from the bridges, the water tower, the column, the girders, and water down the cutting's walls
    // (order 3, G2: THE LIT RAIN, LONG AND FEW) of the 8,400 columns drawn the first 2,600 are stood (COURSE_RAIN), each
    // stroke 3 to 8 m long, its fall beginning 4 to 36 m over the ground (4 to 20 in the cutting), 36 m either side
    // of the course. A stroke carries no light of its own: at the assembly (rainLamps below) it takes its NEAREST LAMP
    // by place, that lamp's own number, and is lit by THE ONE LAW of the part's RAIN_FS within RAIN_REACH of it; a
    // column that stands beyond every lamp's reach is not stood. So the curtains stand over the fields of lamps only.
    const COURSE_RAIN = 2600;
    const rr = rng.fork('rain'), nCourse = Math.round(8400 * rainDraws * detail), nStood = Math.round(COURSE_RAIN * rainK * detail);
    for (let i = 0; i < nCourse; i++) {
      const cut = i % 7 === 0, s = cut ? rr.range(1012, 1245) : rr.range(-20, 1005), a = rr.range(-1, 1) * (cut ? 14 : 36), rail = cut ? FLOOR_Y : 0;
      const u1 = rr.range(1, 11), len = 3 + (rr.range(1.4, 2.6) - 1.4) * 4.17, speed = rr.range(8, 11), phase = rr(); rr.range(0.12, 0.34); rr.chance(0.3);
      if (i < nStood && !(cut && s > 1139)) {   // (no rain falls under the deck of the covered way: G8, the one red lamp stands alone)
        const top = rail + 4 + (u1 - 1) * (cut ? 1.6 : 3.2), p = P(s, a, top); strokes.push({ x: p.x, y: top, z: p.z, span: Math.min(16, top - rail), len, speed, phase, rail, law: 1, amount: 1 }); }
      if (i % 1000 === 999) await ctx.yield();
    }
    const dripK = weather === 'after' ? 3 : 1;
    for (let i = 0; i < 100; i++) { const side = i % 2 ? 1 : -1; dripAt.push(P(rr.range(1012, 1245), side * 14.55, -0.4)); }
    // (order 4, H8: no speck on the trench walls) the water down the cutting's walls falls in LONG drops (1.2 to 2 m,
    // twice what a girder's drip is) and at most two strings to a place: short dashes all over the walls read as specks
    for (const d of dripAt) for (let k = 0; k < (d.y < 0 ? Math.min(dripK, 2) : dripK); k++) {
      const rail = d.y < 0 ? FLOOR_Y : 0, fall = d.y - rail, p = k ? d.clone().add(V3(rr.range(-0.6, 0.6), 0, rr.range(-0.6, 0.6))) : d;
      const period = Math.sqrt(2 * fall / 9.8) * 1.15, nd = 2 + Math.floor(fall / 12), ph = rr(), tn = tintAt(p, rail);
      for (let e = 0; e < nd; e++) strokes.push({ x: p.x, y: p.y, z: p.z, span: fall, len: rr.range(0.6, 1.0) * (d.y < 0 ? 2 : 1), speed: fall / period, phase: ph + e / nd, turnAt: tn, amount: 0.5, drip: 1 });
    }
    // (order 2, D5) RAIN GIVES THE AIR AT THE LIP TOO: the course's columns stopped at s 1005, so from the lip the air
    // over the cutting and its banks stood empty. Columns by place over s 1004-1125, 42 m either side: over the
    // cutting they fall into it. Each takes the number of its own place like all rain, but where that number is past
    // LAST_TURN (no lamp may stand there) no lamp lights it: the floodlight alone does.
    {
      // (order 3, G2) the same law here: 520 of the 1,700 columns drawn are stood, long, lit by their nearest lamp alone
      const rlip = rr.fork('lip rain'), nLip = Math.round(1700 * rainDraws * detail), nLipStood = Math.round(520 * rainK * detail);
      for (let i = 0; i < nLip; i++) {
        const s = rlip.range(1004, 1125), a = rlip.range(-42, 42), over = s > MOUTH + 0.5 && Math.abs(a) < 15, rail = over ? FLOOR_Y : 0, top = 4 + (rlip.range(2, 13) - 2) * 2, p = P(s, a, rail);
        const len = 3 + (rlip.range(1.4, 2.6) - 1.4) * 4.17, speed = rlip.range(8, 11), phase = rlip(); rlip.range(0.14, 0.34); rlip.chance(0.4);
        if (i < nLipStood) strokes.push({ x: p.x, y: top, z: p.z, span: Math.min(16, top - rail), len, speed, phase, rail, law: 1, amount: 1 });
        if (i % 600 === 599) await ctx.yield();
      }
    }
    await ctx.yield();

    // THE GOODS TRAIN: 45 wagons and an engine at each end, 330 m, creeping round its loop at 1.5 m/s by the
    // world's clock (TRAIN_MOVE). Built in its own frame (aside, up, along); one body mesh, the part's black-body style.
    const rt = rng.fork('train');
    const makeTrainMat = (curve, len, speed, tinted) => {
      const loop = []; for (let i = 0; i < 64; i++) { const p = curve.getPointAt(i / 64); loop.push(new THREE.Vector4(p.x, p.z, tinted ? tintAt(p) : 0, 0)); }
      // (order 4, H1) the goods train's wet sides take the standing lamps by its road (trainLamps: filled at the assembly, by place; the express passes no lamp)
      const tl = Array.from({ length: TRAIN_LAMPS }, () => new THREE.Vector4()), tl2 = Array.from({ length: TRAIN_LAMPS }, () => new THREE.Vector4());
      if (tinted) trainLamps = [tl, tl2];
      return makeBodyMaterial(style, { move: TRAIN_MOVE, uniforms: { uLoop: { value: loop }, uLoopP: { value: new THREE.Vector4(len, speed, 64, 0) }, uTL: { value: tl }, uTL2: { value: tl2 } } });
    };
    let trainLamps = null;
    const car = (b, z0, L, kind, am) => {
      const T = (x, y, z) => V3(x, y, z0 + z), t = [0, 0, am], ta = [0, 0, am * 0.45], box = (hx, y0, y1, z1, z2) => {
        // (order 4, H1) a side is laid in lengths of about 1.6 m, each carrying its own middle (pivot): TRAIN_MOVE gives
        // each length the standing lamp nearest it, so the lamp's graded patch lies across the whole wet side
        const nz = Math.max(1, Math.round((z2 - z1) / 1.6));
        for (const sx of [-1, 1]) for (let q = 0; q < nz; q++) { const za = z1 + (z2 - z1) * q / nz, zb = z1 + (z2 - z1) * (q + 1) / nz;
          b.plate(T(sx * hx, y0, za), T(sx * hx, y1, za), T(sx * hx, y1, zb), T(sx * hx, y0, zb), { tint: ta, codes: [q ? 0 : 1, q === nz - 1 ? 0.5 : 0], pivot: T(sx * hx, (y0 + y1) / 2, (za + zb) / 2) }); }
        for (const z of [z1, z2]) b.plate(T(-hx, y0, z), T(-hx, y1, z), T(hx, y1, z), T(hx, y0, z), { tint: ta, codes: [0.5, 0.5], pivot: T(0, (y0 + y1) / 2, z) });
        b.plate(T(-hx, y1, z1), T(hx, y1, z1), T(hx, y1, z2), T(-hx, y1, z2), { codes: [0, 0], pivot: T(0, y1, (z1 + z2) / 2) });
        for (const sx of [-1, 1]) b.bar(T(sx * hx, y1, z1), T(sx * hx, y1, z2), 0.05, { carrier: 0.6, tint: t });
      };
      for (const sx of [-1, 1]) { b.bar(T(sx * 1.2, 0.95, 0.3), T(sx * 1.2, 0.95, L - 0.3), 0.08, { carrier: 0.6, tint: t }); for (const z of [1.2, L - 1.2]) b.bar(T(sx * 1.25, 0.15, z), T(sx * 1.25, 0.95, z), 0.2, { carrier: 0.9 }); }
      if (kind === 'van') box(1.35, 1.05, 3.75, 0.5, L - 0.5);
      else if (kind === 'open') box(1.35, 1.05, 2.5, 0.5, L - 0.5);
      else if (kind === 'tank') b.bar(T(0, 2.25, 0.7), T(0, 2.25, L - 0.7), 1.15, { tint: t, carrier: 3.4 });
      else if (kind === 'engine' || kind === 'engineB') {
        const f = kind === 'engine' ? 1 : -1, zz = (z) => (f > 0 ? z : L - z);
        b.bar(T(0, 2.75, zz(2.9)), T(0, 2.75, zz(L - 0.6)), 1.08, { tint: t, carrier: 3.3 }); b.bar(T(0, 3.7, zz(L - 1.5)), T(0, 4.7, zz(L - 1.5)), 0.3, { tint: t, carrier: 1.2 });
        b.bar(T(0, 3.7, zz(L - 4.5)), T(0, 4.3, zz(L - 4.5)), 0.42, { tint: t, carrier: 1.4 }); box(1.4, 1.05, 4.4, Math.min(zz(0.4), zz(2.9)), Math.max(zz(0.4), zz(2.9)));
      }
    };
    const bTrain = makeBodyBuilder(style);
    // (order 4, J4d) HOW LONG IT IS, by seed: of the 45 wagons drawn (every draw as before) the first trainWagons stand
    { let z = 0; for (let i = 0; i < 47; i++) { const eng = i === 0 || i === 46, L = eng ? 9.5 : 7, kind = i === 0 ? 'engineB' : i === 46 ? 'engine' : rt.pick(['van', 'van', 'van', 'open', 'tank', 'van', 'flat']);
      if (eng || i <= trainWagons) { car(bTrain, z, L - 0.6, kind, 1); z += L; } if (i % 12 === 11) await ctx.yield(); } }
    const train = bTrain.build(makeTrainMat(loopCurve, loopLen, 1.5, true)); train.frustumCulled = false;
    // (order 1, C10) WHERE THE GOODS TRAIN STANDS is a seeded look: its tail at the clock's nought stands 45 m along
    // the loop (the train beside the mast wood and the engine, s 175-505), or 150 m before the loop's start (beside
    // the fan and the dwarf file, s -20 to 310), or 200 m along (from the engine on, its head swinging away to port)
    const trainAt = (rt.pick([45, -150, 200]) + loopLen) % loopLen;
    train.geometry.attributes.position.array.forEach((v, i, arr) => { if (i % 3 === 2) arr[i] = v + trainAt; });      // its place on the loop at the clock's nought
    { const ax = train.geometry.attributes.aAxis.array; for (let i = 2; i < ax.length; i += 3) ax[i] += trainAt; }
    upright.add(train);
    for (let d = 0; d < loopLen; d += 3) { const p = loopCurve.getPointAt(d / loopLen); claim('goods train (its whole loop)', p.setY(2.3), 2.4); }
    // THE RARE EVENT, the express: thirty coaches of pale lines with one long strip of cold light, crossing the
    // whole yard at 45 m/s on a ring 800 m from its middle (400 m or more from the course). It changes no lamp.
    // (the lead's mend after the reader of the frozen fifth build) it is BUILT ON THE RARE VISIT ALONE: on every
    // other visit it stood in the scene unseen from build() on; no mesh of this world is hidden
    if (rare) {
    const bEx = makeBodyBuilder(style);
    for (let i = 0; i < 30; i++) {
      const z0 = i * 22, T = (x, y, z) => V3(x, y, z0 + z);
      for (const sx of [-1, 1]) { bEx.plate(T(sx * 1.4, 1, 0.5), T(sx * 1.4, 1, 21.5), T(sx * 1.4, 4.1, 21.5), T(sx * 1.4, 4.1, 0.5), { codes: [0.5, 1] }); bEx.plate(T(sx * 1.45, 2.4, 1.2), T(sx * 1.45, 2.4, 20.8), T(sx * 1.45, 3.2, 20.8), T(sx * 1.45, 3.2, 1.2), { codes: [1, 1] }); }
      bEx.plate(T(-1.4, 4.1, 0.5), T(1.4, 4.1, 0.5), T(1.4, 4.1, 21.5), T(-1.4, 4.1, 21.5), { codes: [0, 0] });
    }
    const exPts = []; for (let i = 0; i < 24; i++) exPts.push(V3(YC.x + Math.cos(i / 24 * 6.2831853) * 800, 0, YC.z + Math.sin(i / 24 * 6.2831853) * 800));
    const exCurve = new THREE.CatmullRomCurve3(exPts, true, 'centripetal'), express = bEx.build(makeTrainMat(exCurve, exCurve.getLength(), 45, false));
    express.frustumCulled = false; upright.add(express);
    {   // its one long strip of cold light: a line of glass white along each side, carried by the same road and clock
      const pos = [], q = [], idx = [];
      for (let i = 0; i < 30; i++) for (const sx of [-1.47, 1.47]) { const b = pos.length / 3, z0 = i * 22 + 1.2, z1 = i * 22 + 20.8; pos.push(sx, 1.5, z0, sx, 1.5, z1, sx, 4.1, z1, sx, 4.1, z0); q.push(0, -1.3, 1, -1.3, 1, 1.3, 0, 1.3); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: express.material.uniforms, vertexShader: EXLIGHT_VS, fragmentShader: EXLIGHT_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.frustumCulled = false; m.renderOrder = ORDER.upright; upright.add(m);
      const mm = new THREE.Mesh(g, m.material); mm.frustumCulled = false; mm.renderOrder = ORDER.mirror; yardFlip.add(mm);   // its double in the wet
    }
    }
    await ctx.yield();

    // STEAM from the standing engine and six ground vents (and, in drizzle and after the rain, low sheets drifting
    // by the course); two fixed crossed sheets to each
    // (order 1, C10) the weather must show: in drizzle and after the rain the low steam stands thick along the course
    // (order 4, J4) NO SOFT BLOB OF LIGHT WITHOUT A LAMP ONE CAN SEE: the low sheets sown by chance along the course
    // (17 to 46 m off, lit by whatever lamp stood within STEAM_REACH) are NOT STOOD any more (LOW_FREE false; their
    // draws of chance are still taken, so nothing else moves): a low bank stands only at the foot of its own lamp
    // (the loop below), and only of a lamp that burns and stands no higher than 7.5 m: where the bank is in the
    // picture, its lamp is in it.
    // (order 6, M1) AND NO LOW BANK STANDS AT ALL, on any seed (LOW_BANKS false): the filled puffs at the feet of
    // lamps and round the tower's foot read as small bushes of colour. Their draws of chance are still taken. The
    // weather shows by the rain, the water's width and stillness and the drips; the one steam is the engine's plume.
    const LOW_FREE = false, LOW_BANKS = false;
    const rv = rng.fork('steam'), nLow = weather === 'rain' ? 0 : weather === 'drizzle' ? 44 : 64;
    // (order 2, D5) the low steam drifts on past the lip beside the cutting (to s 1085): where no lamp may stand (the
    // number of its place is past LAST_TURN) the floodlight alone lights it
    const steamTint = (p) => { const t = tintP(p, 0.8); return t[0] <= lastTurn ? t : [0, 0, 0]; };
    for (let i = 0; i < nLow; i++) { const ls = rv.range(20, 1085), sd = rv.pick([-1, 1]), la = rv.range(17, 46), p = P(ls, sd * (ls > 480 && ls < DELTA1 + 20 ? 41 + 0.5 * (la - 17) : la), 0.2);   /* (C6) over the delta they keep 41 m off */ if (LOW_FREE && Math.hypot(p.x - tw.x, p.z - tw.z) > 40) steamAt.push({ pos: p, h: rv.range(9, 14), w: rv.range(5, 8), lean: V3(rv.range(-6, 6), 0, rv.range(-6, 6)).multiplyScalar(0.3) /* (order 3, G1) it leans less: no wisp comes within 8 m of the line */, tint: steamTint(p), low: 1, gain: 0.5 }); }
    // (order 3, G1/G9) LOW STEAM STANDS ONLY WHERE A LAMP LIGHTS IT, and far from the flown line: after the rain (and,
    // thinner, in drizzle) a low bank drifts 2 to 4.5 m from the foot of every second lamp of the yard that stands
    // within 34 m of the line (every second after the rain, every sixth in drizzle), never nearer the line than 8 m: the lanterns' and the
    // posts' own breath, lit by that lamp alone, by its state. (The sheets above that no lamp reaches show nothing.)
    if (nLow) {
      const rls = rv.fork('lamp steam'), every = weather === 'after' ? 2 : 6;
      // and round the tower's foot: fourteen low banks on the apron's water, their middles 10 to 13.5 m from the mast
      // and none reaching past 22 m from it (8 m and more from the flown line), wide wisps to 10 m up, each lit by the lamp of the lowest rings that stands over it
      // (the lead's mend after pass G) SEVEN, not fourteen, and narrower and fainter: fourteen wide banks side by side
      // read from afar as one hard bar of light across the tower; seven stand apart as wisps with black between
      for (let i = 0; i < 14; i += 2) { const ang = (i + rls.range(0.1, 0.9)) * 0.4487989, rad = rls.range(10, 13.5); const bank = { pos: V3(tw.x + Math.cos(ang) * rad, 0.2, tw.z + Math.sin(ang) * rad), h: rls.range(10, 13), w: rls.range(3, 4), lean: V3(rls.range(-3, 3), 0, rls.range(-3, 3)), gain: 0.3, low: 1 }; if (LOW_BANKS) steamAt.push(bank); }
      for (let i = 0; i < streakYard.length; i++) {
        const t = streakYard[i], ang = rls.range(0, 6.2831853), dd = rls.range(2, 4.5), hh = rls.range(5.5, 8.5), ww = rls.range(4, 6.5), lx = rls.range(-3, 3), lz = rls.range(-3, 3);
        if (i % every || t.pos.y > 7.5 || !((t.strength ?? 1) > 0)) continue;   // (order 4, J4) by a low lamp that burns (it was: 12 m and any lamp)
        // (order 4, J4) the bank stands at its lamp's own foot (1 to 2.2 m from it; it was 2 to 4.5) and is narrower
        // and lower (0.7 of what was drawn), so that it reads as that lamp's breath and never as a blob beside it
        const d2 = 0.5 * dd, w2 = 0.7 * ww, p = V3(t.pos.x + Math.cos(ang) * d2, 0.2, t.pos.z + Math.sin(ang) * d2), n = near(p.x, p.z);
        if (n.aside < 8 + w2 || n.aside > 40) continue;         // (the whole sheet, its width either side of its foot, stays 8 m off)
        if (LOW_BANKS) steamAt.push({ pos: p, h: 0.7 * hh, w: w2, lean: V3(lx, 0, lz).multiplyScalar(0.5), gain: 0.5, low: 1 });
      }
    }
    const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
    const addMat = (vs, fs, u) => new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...(u || {}) }, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    // (order 1, C10) THE SIGNALS THAT LEAD stand over the fan too (s 14-140, the outer six-foots, clear of the dwarf
    // file and of the coaling tower): the seeded kind is plain from the first picture
    {
      const rfan = rng.fork('fan side');
      for (const j of [2, -2, 3, -3, 4, -4, 5, -5]) {
        for (let s = 14 + rfan.range(0, 14); s < 140; s += rfan.range(15, 23) / density) {
          const a = j * 5.5 * (0.3 + 0.7 * sstep(-50, 140, s)) + rfan.range(-0.15, 0.15), h = rfan.range(8, 11);
          if (j === 2 && s > 26 && s < 64) continue;                                                 // (order 3, E4) the arrival's tall post stands in this six-foot
          // (order 4, J4c) larger, so that the kind that leads is plain from the first picture: arms half as large
          // again with 0.3 m glasses, colour-light heads 1.1 m by 2.2 m, ground signals 1.4 times a dwarf
          // (a post that would stand in the goods train's road is not stood: within 3.2 m of a 4 m sample of the loop's middle)
          const pf = P(s, a); let ghost = false; for (let q = 0; q < loopSmp.length && !ghost; q += 2) ghost = Math.hypot(pf.x - loopSmp[q], pf.z - loopSmp[q + 1]) < 3.2;
          if (lead === 'dwarfs') dwarfAt(P(s, a), rfan, { rain: Math.abs(j) < 3 ? 6 : 0, scale: 1.4, ghost, rank: 'fan' + j });
          else addPost(P(s, a), lead === 'arms' ? h : h - 2.5, lead === 'arms' ? 'arm' : 'light', rfan, { rain: Math.abs(j) < 3 ? 6 : 0, ghost, rank: 'fan' + j, ...(lead === 'arms' ? { arm: 1.5, scale: 1.8, mast: 1.4 } : { scale: 1.8, gain: 2.2, mast: 1.4 }) });
          nPosts++;
        }
        await ctx.yield();
      }
    }
    // (order 3, G1) the steam is made at the assembly, when every lamp stands (each sheet takes its nearest lamp)
    // the floodlight's point (2.2 km off, 30 degrees to port of the entry course, 1.5 degrees up) and the strip of
    // the last of the night (a fixed ring 3.3 km out; its strength a number set once by the seeded hour)
    {
      const fp = flood.clone().multiplyScalar(2200), fx = V3(flood.z, 0, -flood.x).normalize(), pos = [], q = [], idx = [];
      for (const [x, y] of [[-46, -58], [46, -58], [46, 46], [-46, 46]]) { pos.push(fp.x + fx.x * x, fp.y + y, fp.z + fx.z * x); q.push(x, y, 0); }
      idx.push(0, 1, 2, 0, 2, 3);
      // (order 1, B6) no strip of the last of the night; (B2) the floodlight's streak in the wet, 30 to 1,000 m under its water
      for (const [x, y] of [[-130, 30], [130, 30], [130, 1000], [-130, 1000]]) { pos.push(fp.x + fx.x * x, -y, fp.z + fx.z * x); q.push(x, y, 1); }
      idx.push(4, 5, 6, 4, 6, 7);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3)); g.setIndex(idx);
      const m = new THREE.Mesh(g, addMat(FLOODPT_VS, FLOODPT_FS, { uDawn: { value: 0 } })); m.frustumCulled = false; m.renderOrder = ORDER.mirror; yardMirror.add(m);
    }
    // THE RIM: the drum's front face with its twelve panes; and its double in the cutting's floor
    const rimMat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uRim: { value: rimPanes.map((p) => p.L.turnAt) } }, vertexShader: RIM_VS, fragmentShader: RIM_FS, side: THREE.DoubleSide });
    {
      const c = hoodC.clone().addScaledVector(hC, -9.02), pos = [], q = [];
      for (const [x, y] of [[-9.6, -9.6], [9.6, -9.6], [9.6, 9.6], [-9.6, 9.6]]) { pos.push(c.x + hU.x * x, c.y + y, c.z + hU.z * x); q.push(x, y); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      // (order 1, B4) ONE ring, never a figure eight: the rim has no second ring in the floor; its double is the long
      // broken smear of each pane's colour (the panes' streaks in the cutting's mirror), cut by the drum's black double
      const rim = new THREE.Mesh(g, rimMat); rimMat.transparent = true; rimMat.forceSinglePass = true; rim.renderOrder = CUT.face; upright.add(rim);
    }
    await ctx.yield();

    // ASSEMBLY, in the mirror's order. Bodies: one mesh to a builder; those that stand by water again in its mirror.
    const put = (b, flip, off = 0, mat) => { const m = b.build(mat); upright.add(m); if (flip) { const mm = new THREE.Mesh(m.geometry, m.material); mm.position.y = off; flip.add(mm); } return m; };
    const litCount = [], litBodies = [put(bUp)]; await ctx.yield(); litBodies.push(put(bMir, yardFlip)); await ctx.yield();
    // (order 1, B1) THE GROUND IS A BLACK BODY. Everything of the cutting (its mirror, its floor's film, its bodies,
    // lamps, pools, the rim) is drawn AFTER the yard's film, which writes depth: so nothing under yard level shows
    // through the ground or its water, and the cutting is seen only through its own open mouth (the film's hole).
    // Its bodies are the same black body, only queued late (late(): no blending, depth written, one pass).
    const late = (mesh, order) => { mesh.material.transparent = true; mesh.material.forceSinglePass = true; mesh.renderOrder = order; return mesh; };
    { const m = bCut.build(makeBodyMaterial(style)), mm = new THREE.Mesh(m.geometry, m.material); mm.position.y = -FLOOR_Y; late(m, CUT.body); mm.renderOrder = CUT.mirrorBody; upright.add(m); cutFlip.add(mm);
      const hm = bHood.build(m.material); hm.renderOrder = CUT.body; upright.add(hm); litBodies.push(m); }   // (the hood's drum is not lit: its panes shine forward from its own face; a red drum would make the one red lamp larger)
    await ctx.yield();
    litBodies.push(put(bArm, null, 0, makeBodyMaterial(style, { move: ARM_MOVE }))); await ctx.yield();
    // (order 3, M3) THE LIT FACES: every wet face of the yard, the cutting, the hood and the arms takes its nearest
    // lamp within LIT_REACH (the part's yardLightFaces, baked here BY PLACE from the lamps' own sites: no eye, no
    // clock) and carries its colour as a filled soft patch by that lamp's state by the same number (the part's
    // BODY_FS). The rim's panes are lamps too and light the covered way's piles and girders to RIM_REACH.
    // The board's lamps are left out (their narrow beams look across the leg; its back and frame stay black), and
    // the trains (bodies that move past many lamps) keep the tint of their place only.
    {
      const rimLit = rimPanes.map((p) => ({ pos: p.pos, dir: hC.clone().negate(), turnAt: p.L.turnAt, doubt: p.L.doubt || 0, strength: 1, lit: RIM_REACH }));
      const litSites = [...S.dwarf, ...S.small, ...S.target, ...S.cutD, ...rimLit];
      for (const m of litBodies) { litCount.push(await yardLightFaces(m, litSites, { reach: LIT_REACH, pause: () => ctx.yield() })); await ctx.yield(); }
      // (order 4, H1) THE GOODS TRAIN'S WET SIDES: the standing lamps within LIT_REACH of where a wagon's side passes
      // (the forty nearest its road, by place), handed to TRAIN_MOVE; the one law of the lit face does the rest
      if (trainLamps) {
        const smp = [], cand = []; for (let d = 0; d < loopLen; d += 2) { const p = loopCurve.getPointAt(d / loopLen); smp.push(p.x, p.z); }
        await ctx.yield();
        let nT = 0;
        for (const t of [...S.dwarf, ...S.small, ...S.target]) {
          if (++nT % 150 === 149) await ctx.yield();
          if (t.pos.y < -1 || !((t.strength ?? 1) > 0)) continue;
          let bd = 1e9; const dv = Math.max(0, 1 - t.pos.y, t.pos.y - 3.75);
          for (let i = 0; i < smp.length; i += 2) { const d = Math.hypot(Math.max(0, Math.hypot(t.pos.x - smp[i], t.pos.z - smp[i + 1]) - 1.35), dv); if (d < bd) bd = d; }
          if (bd < LIT_REACH - 0.5) cand.push([bd, t]);
        }
        cand.sort((a, b) => a[0] - b[0]);
        cand.slice(0, TRAIN_LAMPS).forEach(([, t], i) => { trainLamps[0][i].set(t.pos.x, t.pos.y, t.pos.z, t.turnAt); trainLamps[1][i].set(t.doubt || 0, Math.min(1, t.strength ?? 1), LIT_REACH, 0); });
        litCount.push(cand.length); await ctx.yield();
      }
    }
    // (order 2, D3) THE HALO IN RANKS: each lamp's metres to its nearest neighbour lamp, baked by place over every
    // list of the world at once (the tower's are baked in the part, in its own frame)
    yardNeighbours([S.dwarf, S.small, S.board, S.target, S.cutD]); await ctx.yield();
    const units = (kind, sites, parent, o) => { const u = makeLampUnits(style, kind, sites, o); u.body.frustumCulled = false; u.halo.frustumCulled = false; parent.add(u.body, u.halo); return u; };
    // (order 4, H2) A PLAIN ROUND GLASS: the board's lens is 0.115 of its 0.24 unit (it was 0.09) under a hood to match
    const BOARD = { ...LAMP_KINDS.board, lens: 0.115, hood: 0.15, beam: [Math.cos(BOARD_BEAM[1] * Math.PI / 180), Math.cos(BOARD_BEAM[0] * Math.PI / 180), 0, 1] };          // (order 4, H2) dark beyond BOARD_BEAM[1] degrees off its aim, full within BOARD_BEAM[0]
    units('dwarf', S.dwarf, upright); await ctx.yield();
    units({ ...LAMP_KINDS.board }, S.small, upright); await ctx.yield();
    units(BOARD, S.board, upright); units({ ...BOARD, hood: 0 }, S.board, yardFlip, { order: ORDER.mirror }); await ctx.yield();
    late(units('target', S.target, upright).body, CUT.body);
    { const w = new THREE.Group(); w.position.y = -FLOOR_Y; cutFlip.add(w); late(units({ ...LAMP_KINDS.target, hood: 0 }, S.cutT, w, { order: CUT.mirror }).body, CUT.mirrorBody);
      // (order 3, G5) the cutting's bracket signal: the part's 'dwarf' unit, queued late like every body of the cutting, and its double
      late(units('dwarf', S.cutD, upright).body, CUT.body); late(units({ ...LAMP_KINDS.dwarf, hood: 0 }, S.cutD, w, { order: CUT.mirror }).body, CUT.mirrorBody); }
    await ctx.yield();
    // (order 1, A4) long broken reflections: to 7 lamp heights in the yard's water, 5 on the cutting's floor
    // (order 6, M2) THE RANKS, by place: the lamps of one file in the order of the plan's metre; two that follow each
    // other no farther apart than RANK_GAP (and not on one post) are linked: the rank's ONE band runs lamp to lamp
    // with a knot under each lamp, and a linked lamp lays no streak of its own (no tooth of a comb)
    const rankLinks = [], ranked = new Set();
    {
      const files = new Map();
      for (const t of [...streakYard, ...lantPool.filter((q) => q.rank !== undefined)]) if (t.rank !== undefined && (t.strength ?? 1) > 0) { /* (order 6, P1) the port file of lanterns is a rank too */ if (!files.has(t.rank)) files.set(t.rank, []); files.get(t.rank).push({ t, m: nearPlan(t.pos.x, t.pos.z).m }); }
      for (const f of files.values()) {
        f.sort((p, q) => p.m - q.m);
        for (let i = 0; i + 1 < f.length; i++) {
          const a = f[i].t, b = f[i + 1].t, d = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z);
          if (d < 1.5 || d > RANK_GAP) continue;
          rankLinks.push({ a, b, seed: (0.31 + rankLinks.length * 0.137) % 1 }); ranked.add(a); ranked.add(b);
        }
      }
    }
    await ctx.yield();
    yardFlip.add(makeRankBands(style, rankLinks, { gain: 0.56, high: 11 }));
    yardFlip.add(makeStreaks(style, streakYard.filter((t) => !ranked.has(t)), { len: [0.2, 7], width: 0.24, gain: 0.7, band: 1, high: 11 }));   // (order 5, L7) filled bands; a lamp 11 m up lies half as bright in the water as one at its foot
    yardFlip.add(makeStreaks(style, S.board, { len: [0.4, 2.2], width: 0.16, gain: 0.22, band: 1, beam: Math.cos(BOARD_BEAM[1] * Math.PI / 180) }));   // (the lead's mend) the double is dark where its lamp is dark (BOARD_BEAM; it kept the old narrow beam 0.79, so the near panels' doubles went dark under lit lamps)   // (order 4, H2) THE LAMPS ARE BRIGHTER THAN THEIR MIRROR: the double is shorter and at half its strength, by the same aim   // (order 3, E1) longer and stronger: the lower half of its picture is lit by it   // (order 2, D5) the board doubled in the water, plainer
    // (the lead's mend after the second reader) the rim's panes' doubles are a mesh of their own with tone 0
    { const m = makeStreaks(style, streakCut.filter((t) => !t.rim), { len: [0.3, 6], width: 0.26, gain: 0.8 }); m.renderOrder = CUT.mirror; cutFlip.add(m); }
    { const m = makeStreaks(style, streakCut.filter((t) => t.rim), { len: [0.3, 6], width: 0.26, gain: 0.8, tone: 0 }); m.renderOrder = CUT.mirror; cutFlip.add(m); }
    upright.add(makeSmears(style, smearCut, { gain: 1.3 })); await ctx.yield();
    upright.add(makeSmears(style, engSmear, { gain: 1.15, band: 1 }));   // (order 5, L2) the engine's filled streaks
    {   // (order 5, L4) the headlamp's glass and its wedge on the road: one mesh, one material (HEAD_VS/FS), from the build on
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(headGeo.pos, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(headGeo.h, 4)); g.setIndex(headGeo.idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uReach: { value: HEAD_REACH } }, vertexShader: HEAD_VS, fragmentShader: HEAD_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
      m.frustumCulled = false; m.renderOrder = ORDER.film + 0.25; scene.add(m);
    }
    // (order 2, D2) the rim's reflections down the covered way: its broad path in the floor's water (the cutting's
    // mirror), its runs along both pile walls and under every girder (the upright world; a body before them hides them)
    { const m = makeStreaks(style, rimFloor, { len: [0.25, 7], gain: 1, tone: 0 }); m.renderOrder = CUT.mirror; cutFlip.add(m); }
    upright.add(makeRuns(style, rimRuns, { gain: 1, tone: 0 })); await ctx.yield();
    // (order 1, A3) THE POOLS: what each near lamp (within 28 m of the flown line) lights on the wet ground
    { const yardPoolSites = streakYard.filter((t) => t.pos.y < 24 && !t.noPool && near(t.pos.x, t.pos.z).aside < 28);
      const pools = makePools(style, yardPoolSites, { y: 0, reach: 9, gain: 0.9 }); scene.add(pools);
      // (order 1, C6; order 2, D4) THE DELTA AS A FIELD OF ROUND POOLS: every switch lantern colours 4.2 m of wet
      // timbering round its own foot (lanterns 13 m apart or more: dark wet ground between pools), and its glass
      // lies in the wet as a short streak of its own (2.4 lantern heights), so that no pool is smeared into the next
      // (order 3, E5) no disc with an edge: the pool's glints thin out to nothing over 8.5 m (fill 0), and what lies in
      // it breaks it: the roads through it are drawn by poolRails below (bright crowns, sparkling ballast, dark sleepers)
      // (order 3, M3: it overrides the two notes above) a pool is the part's FILLED PATCH WITH A SOFT FALLING EDGE:
      // full colour at the lantern's foot, nothing at 9.5 m; the roads through it shine as lines in the lantern's
      // colour and the sleepers lie as dark bars (poolRails), the ballast at its mean (no sparkle)
      // (lanterns stand 10.5 m apart: a reach of 7.2 m leaves dark wet ground between pools, so they are counted)
      scene.add(makePools(style, lantPool, { y: 0, reach: 7.2, least: 7.2, gain: 2.4, fill: 0 }));
      {
        // (order 4, H7) THINGS IN THE LIT GROUND: the roads through EVERY pool (the yard's lamps' too, not the
        // lanterns' alone): each lamp's own reach on the ground and strength there, as the part's makePools has them
        const pos = [], at = [], lm = [], idx = [];
        const prSites = lantPool.map((t) => ({ t, R: 7.2, sAt: t.sAt, st: t.strength ?? 1, lant: 1 }));
        for (const t of yardPoolSites) { const h = Math.max(0, t.pos.y); prSites.push({ t, R: Math.min(9, Math.max(5, 4 + 0.8 * h)), sAt: nearPlan(t.pos.x, t.pos.z).m, st: (t.strength ?? 1) * (t.pool ?? 1) * 0.75 / (1 + (h / 7) * (h / 7)), lant: 0 }); }
        let nPr = 0;
        for (const { t, R, sAt, st, lant } of prSites) {
          if (++nPr % 12 === 11) await ctx.yield();
          for (let k = 0; k < 12; k++) {
            let prev = null, v = 0;
            for (let s = sAt - R - 3; s <= sAt + R + 3 + 1e-6; s += 1.5) {
              if (lant && k === 8 && trainSide < 0 && s > 128 && s < 504) { prev = null; continue; }   // (order 6, P1) no road lies there when the goods loop lies to starboard: a pool lights no rail that is not laid
              if (lant && t.sAt > 500 ? (s < 506 || s > roadEnd(k)) : !lant && (s < -60 || s > roadEnd(k) || (k === 8 && s > 128 && s < 504))) { prev = null; continue; }   // (the engine's lantern, s 323.8, lights its own roads)
              const c = P(s, roadAside(k, s, 1)), c2 = P(s + 0.5, roadAside(k, s + 0.5, 1)); let nx = c2.z - c.z, nz = c.x - c2.x; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
              const row = [-1, 1].map((sd) => { const x = c.x + nx * 1.35 * sd, z = c.z + nz * 1.35 * sd; return [x, z, 1.35 * sd, Math.max(0, 1 - Math.hypot(x - t.pos.x, z - t.pos.z) / R)]; });
              v = s;   // (order 4, H7) the sleepers lie by the route's own metres: two lamps' strips over one road lay the same bars
              const cur = { c, row, v };
              if (prev && (prev.row[0][3] > 0 || prev.row[1][3] > 0 || row[0][3] > 0 || row[1][3] > 0)) {
                const b = pos.length / 3;
                for (const q of [prev, cur]) for (const r of q.row) { pos.push(r[0], 0.045, r[1]); at.push(r[2], q.v, r[3]); lm.push(t.turnAt, t.doubt || 0, st); }
                idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
              }
              prev = cur;
            }
          }
        }
        await ctx.yield();
        // (order 4, H7) TWO MORE THINGS IN THE LIT GROUND, by place (POOLRAIL_FS draws them; they show only in a pool):
        // the signals' CABLE TROUGH along the file of ground signals (s 54-140, at the signals' feet on the side of
        // the flown line) and a DRAIN with its grating along the cutting's lip (1.7 m before the end wall, 30 m long)
        const strips = [
          { half: 0.3, code: 20, pts: Array.from({ length: 87 }, (_, i) => P(54 + i, roadAside(6, 54 + i) + 0.7175 + 0.75 - 0.95)) },
          { half: 0.32, code: 40, pts: Array.from({ length: 61 }, (_, i) => PC(MOUTH - 1.7, -15 + i * 0.5)) },
        ];
        for (const sp of strips) for (const { t, R, st } of prSites) {
          let prev = null, v = 0; const n = sp.pts.length;
          if (Math.hypot(t.pos.x - sp.pts[0].x, t.pos.z - sp.pts[0].z) > R + 90) continue;
          for (let i = 0; i < n; i++) {
            const c = sp.pts[i], c2 = sp.pts[Math.min(n - 1, i + 1)], c0 = sp.pts[Math.max(0, i - 1)]; let nx = c2.z - c0.z, nz = c0.x - c2.x; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
            const row = [-1, 1].map((sd) => { const x = c.x + nx * sp.half * sd, z = c.z + nz * sp.half * sd; return [x, z, sp.code + sp.half * sd, Math.max(0, 1 - Math.hypot(x - t.pos.x, z - t.pos.z) / R)]; });
            if (i) v += Math.hypot(c.x - c0.x, c.z - c0.z);
            const cur = { row, v };
            if (prev && (prev.row[0][3] > 0 || prev.row[1][3] > 0 || row[0][3] > 0 || row[1][3] > 0)) {
              const b = pos.length / 3;
              for (const q of [prev, cur]) for (const r of q.row) { pos.push(r[0], 0.05, r[1]); at.push(r[2], q.v, r[3]); lm.push(t.turnAt, t.doubt || 0, st); }
              idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
            }
            prev = cur;
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(at, 3));
        g.setAttribute('aLamp', new THREE.Float32BufferAttribute(lm, 3)); g.setIndex(idx);
        // (order 4, H7) laid OVER the pool (its own light times its own cover: the sleepers darken what lies under them)
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: POOLRAIL_VS, fragmentShader: POOLRAIL_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
          blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
        m.frustumCulled = false; m.renderOrder = ORDER.film + 0.25; scene.add(m);
      }
      yardFlip.add(makeStreaks(style, lantPool.filter((t) => !ranked.has(t)), { len: [0.2, 2.4], width: 0.22, gain: 0.7, band: 1 })); await ctx.yield();   // (order 6, P1) a lantern of a rank lays no streak of its own
      const cp = makePools(style, streakCut.filter((t) => t.pos.y < 9 && !t.rim), { y: 0, reach: 9, gain: 1.8, order: CUT.lit }); cp.position.y = FLOOR_Y; scene.add(cp);
      // (the lead's mend after the second reader) the six lower panes' pools at the hood's foot: their own mesh, tone 0
      { const rp = makePools(style, streakCut.filter((t) => t.pos.y < 9 && t.rim), { y: 0, reach: 9, gain: 1.8, order: CUT.lit, tone: 0 }); rp.position.y = FLOOR_Y; scene.add(rp); }
      // (order 1, B5) under the deck the wall heads light the wet plate overhead too: their pools on the deck's
      // underside, between the girders (which hide them by depth: drawn after the cutting's bodies)
      // (order 2, D2) no wall head stands under the deck now: what lights the wet floor and the deck's wet underside
      // there is the rim alone: ONE wide pool of hard glints to each, about the hood's foot, by the rim's own number
      // (thinning outward to the last wall head; the walls and the ground hide what lies beyond them)
      // (order 3, M3/M6) the pool is the filled soft patch now: quieter (0.7), so that from the lip the rim's light on
      // the far floor is a dim mean under ONE red lamp and its one column, and no red slab
      // (order 3, G8) ONE RED COLUMN NO WIDER THAN THE LAMP'S RING: the wide round pool lit the floor from wall to wall
      // and read from the lip as a red panel. The rim's light on the wet floor is a LANE now, by place: a chain of 23
      // soft patches 7.5 m in reach down the middle of the way (the ring is 14 m across), strongest at the hood's
      // foot and falling along the way to the deck's edge; the floor by the walls takes none
      // (the lead's mend after pass G) THE WIDE FLOOD IS OUT: it was toned by the eye's distance (a twentieth from the
      // lip, whole under the deck), and nothing at the way out may come on by the metres still to fly. The lane, by
      // place alone, is the rim's light on the floor from every place of the flight.
      const rimLane = [];
      // (the lead's mend after the reader of the frozen fifth build) each patch by the number of the pane nearest its
      // own place on the floor, and with NO TONE BY THE EYE'S DISTANCE AT ALL (tone 0; so too the rim's floor streaks,
      // its runs, the panes' doubles in the floor's water, their six pools and the panes' pale edges): the rim's own
      // light is as bright from the lip as from under the deck (the head's use (2) says what still carries the tone)
      for (let k = 0; k < 23; k++) rimLane.push({ pos: P(1241 - k * 4.8, 0, 0), turnAt: rimNear(P(1241 - k * 4.8, 0, FLOOR_Y)), doubt: 0, strength: 1, seed: 0.5, pool: Math.pow(1 - k / 24, 1.5) });
      const rp3 = makePools(style, rimLane, { y: 0, reach: 7.5, least: 7.5, gain: 0.8, order: CUT.lit, tone: 0 }); rp3.position.y = FLOOR_Y; scene.add(rp3);
      // (the underside's pools lie bay by bay between the girders, each within the cutting's own width, strongest by the rim)
      // (order 3, E6) the pools on the deck's underside are OUT (they read as green blotches along the picture's top
      // edge): the deck's wet underside carries the rim as the hard lines under every girder's flange and the drips' beads
    }
    await ctx.yield();
    {
      const g = quad(); g.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(farF), 4)); g.setAttribute('aLamp', new THREE.InstancedBufferAttribute(new Float32Array(farL), 4)); g.instanceCount = farF.length / 4;
      const far = new THREE.Mesh(g, addMat(FAR_VS, FAR_FS)); far.frustumCulled = false; far.renderOrder = ORDER.mirror; yardMirror.add(far);
    }
    // (order 3, G2 and G1) RAIN AND STEAM TAKE THEIR NEAREST LAMP, BY PLACE (no eye, no clock): every lamp of the
    // world (signals, lanterns, repeaters, the board's, the tower's, the rim's panes; dead ones apart) in a 15 m grid;
    // a stroke of the course takes the lamp nearest the middle of its fall, that lamp's own number and doubt (R2),
    // and is lit by THE ONE LAW within RAIN_REACH of it (R1); one that stands beyond 0.75 of the reach from every lamp
    // is not stood (it would show nothing). The board's lamps light only the rain before them.
    const rainLamps = new Map(), GC = 15;
    {
      hero.object.updateMatrix();
      const addL = (pos, L, dir, kind) => { if (L.strength === 0) return; const k = Math.floor(pos.x / GC) + ',' + Math.floor(pos.z / GC); let c = rainLamps.get(k); if (!c) rainLamps.set(k, c = []); c.push({ pos, turnAt: L.turnAt, doubt: L.doubt || 0, strength: L.strength ?? 1, dir, kind }); };
      for (const t of S.dwarf) addL(t.pos, t, null, 'dwarf');
      for (const t of S.small) addL(t.pos, t, null, 'small');
      for (const t of S.target) addL(t.pos, t, null, 'target');
      for (const t of S.cutD) addL(t.pos, t, null, 'target');
      for (const t of S.board) addL(t.pos, t, t.dir, 'board');
      for (const p of rimPanes) addL(p.pos, { turnAt: p.L.turnAt, doubt: p.L.doubt, strength: 1 }, null, 'rim');
      for (const t of hero.sites) addL(t.pos.clone().applyMatrix4(hero.object.matrix), t, null, 'tower');
    }
    await ctx.yield();
    const nearestLamp = (x, y, z, maxD) => {
      const ix = Math.floor(x / GC), iz = Math.floor(z / GC), rings = Math.ceil(maxD / GC); let best = null, bd = maxD;
      for (let r = 0; r <= rings; r++) {
        for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const c = rainLamps.get((ix + dx) + ',' + (iz + dz)); if (!c) continue;
          for (const L of c) { const d = Math.hypot(L.pos.x - x, L.pos.y - y, L.pos.z - z); if (d < bd) { bd = d; best = L; } }
        }
        if (best && bd < r * GC) break;
      }
      return best ? { L: best, d: bd } : null;
    };
    {
      let n = 0;
      for (const st of strokes) {
        if (!st.law) continue;
        const f = nearestLamp(st.x, st.y - 0.5 * st.span - 0.5 * st.len, st.z, 0.75 * rainReach);
        if (f) { st.lamp = { pos: f.L.pos, reach: rainReach, dir: f.L.dir || undefined }; st.turnAt = f.L.turnAt; st.doubt = f.L.doubt; st.amount = f.L.kind === 'board' ? 0.8 : Math.max(0.7, f.L.strength); } else st.dead = 1;
        if (++n % 250 === 249) await ctx.yield();
      }
    }
    // (order 3, G1) STEAM: each sheet takes the lamp nearest its foot (2 m up) within STEAM_REACH; no lamp, no steam
    for (const e of steamAt) {
      const f = nearestLamp(e.pos.x, e.pos.y + 2, e.pos.z, STEAM_REACH);
      if (f) { e.lamp = { pos: f.L.pos, reach: STEAM_REACH }; e.tint = [f.L.turnAt, f.L.doubt, e.gain ?? 1]; }
    }
    upright.add(makeSteam(style, steamAt.filter((e) => e.lamp)));
    await ctx.yield();
    // (order 3, E6) NOTHING CLOSE BEFORE THE LENS, by place: no rain stroke is born within 4 m of the flown line (a
    // drip none within 2.3 m): a column whose fall passes that near the line is not stood (its draws of chance were made)
    {
      const keep = [];
      for (let i = 0; i < strokes.length; i++) {
        // (order 4, H6) THE STRAY LINE at the picture's edge was a stroke of rain 4 m from the lens, 8 m long, hard by
        // a large lamp: brighter and longer than every other. By place: no stroke stands within NEAR_RAIN (6 m) of the
        // flown line, and one within 11 m of it is no longer than 3 m plus its metres beyond those 6 (3 m is R5's least)
        const st = strokes[i], n = near(st.x, st.z), lim = st.drip ? 2.3 : NEAR_RAIN;
        if (st.dead) continue;                                   // (order 3, G2) beyond every lamp's reach: not stood
        if (!st.drip && st.rail === 0 && i % 3 === 2 && RAIN_THIN < 1 && weather === 'rain') continue;   // (order 5, L7) THE LIT RAIN OF THE YARD, a third fewer, by density alone (every third stroke of the yard's level is not stood; reach, length and law as they are)
        if (!st.drip && n.aside < NEAR_RAIN + 5) st.len = Math.min(st.len, 3 + Math.max(0, n.aside - NEAR_RAIN));
        if (n.aside < lim) { const yr = Y[Math.min(1250, Math.round(n.m))], lo = st.y - st.span - (st.drip ? 0 : st.len), dv = yr > st.y ? yr - st.y : yr < lo ? lo - yr : 0; if (n.aside * n.aside + dv * dv < lim * lim) continue; }
        keep.push(st);
        if (i % 4000 === 3999) await ctx.yield();
      }
      strokes.length = 0; for (const st of keep) strokes.push(st);
    }
    // (order 1, C10) drizzle is not thin rain: its strokes are short slow ticks (numbers only: length and speed)
    // (order 3, G2: it overrides the line above) drizzle is the same long strokes, fewer by a half, falling slower
    if (weather === 'drizzle') for (const st of strokes) if (!st.drip) { st.speed *= 0.55; st.len *= DRIZZLE_LEN; }   // (order 4, J4) fine and short
    upright.add(makeRain(style, strokes)); await ctx.yield();
    // (order 3, G2, R6) THE WATER TAKES IT: the lit strokes again in each water's mirror group, by the mirror's own
    // rule (the part's YARD_RAIN_MIRROR: shivering, in a few long pieces; the film's wet mask and rings break them)
    // (order 5, L7) THE WATER MIRRORS THE LAMPS, NOT THE RAIN STROKE BY STROKE: the yard's water no longer draws the
    // strokes again (they lay under every rank of lamps as a comb, a "smeared pane"); each lamp's own mirror is a
    // filled band with an edge (the part's STREAK_FS, band: 1). The cutting's water keeps its rain as released.
    { const w = new THREE.Group(); w.position.y = -FLOOR_Y; cutFlip.add(w); w.add(makeRain(style, strokes.filter((st) => !st.drip && st.rail === FLOOR_Y), { mirror: 1, order: CUT.mirror })); }
    await ctx.yield();
    {   // the cutting's floor: water from wall to wall
      const pos = [], idx = [];
      for (let k = 0; k <= 12; k++) { for (const w of [-15.4, 15.4]) pos.push(cw.x + cu.x * k * 23.5 + cp.x * w, FLOOR_Y, cw.z + cu.z * k * 23.5 + cp.z * w); if (k) { const b = k * 2; idx.push(b - 2, b - 1, b, b - 1, b + 1, b); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const f = makeWetFilm(style, { geometry: g, wet: 0.86, rings: ringK }); f.material.side = THREE.DoubleSide; f.frustumCulled = false; f.renderOrder = CUT.film; scene.add(f);
    }
    await ctx.yield();

    // THE BUILD'S CHECKS AND REPORTS (console.error on a failure, by name).
    // 1. the one salt: no pane of the rim and no lamp of the last post's head doubts or stands green early
    const lastPost = S.target.find((t) => t.cracked && t.flicker);
    let saltBad = false;
    for (const [name, L] of [['the last post', lastPost], ...rimPanes.map((p, i) => ['rim pane ' + i, p.L])]) if (L.doubt || L.keep === 0 || L.turnAt <= 0) { saltBad = true; console.error('YARD SALT FAILS: ' + name + ' doubts or stands green early under salt ' + YARD_SALT); }
    if (saltBad) {   // name the salts that would pass at these thirteen places, for whoever moved them
      const pl = [lastPost.pos, ...rimPanes.map((p) => p.pos)], ok = [];
      for (let s = 1; s < 400 && ok.length < 8; s++) if (pl.every((p) => yardCell(p.x, p.y, p.z, s) >= 1 / 50 + 1 / 30)) ok.push(s);
      console.error('YARD SALT: salts that pass here: ' + ok.join(' '));
    }
    // 2. clear air by place: every claimed body against the flown line, each quarter metre, 2.3 m
    const fails = new Map(); let walked = 0, least = [1e9, '', 0];
    for (let ci = 0; ci < claims.length; ci++) {
      const [name, x, y, z, r] = claims[ci], n = near(x, z);
      if (n.aside < r + 3.3) {
        const s0 = Math.max(0, Math.floor(n.m) - 30), s1 = Math.min(1250, Math.ceil(n.m) + 30);
        for (let s = s0; s < s1; s += 0.25) {
          const i = Math.floor(s), f = s - i, dx = X[i] + (X[i + 1] - X[i]) * f - x, dy = Y[i] + (Y[i + 1] - Y[i]) * f - y, dz = Z[i] + (Z[i + 1] - Z[i]) * f - z, c = Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
          walked++;
          if (c < least[0]) least = [c, name, s];
          if (c < 2.3 && (!fails.has(name) || fails.get(name)[0] > c)) fails.set(name, [c, s]);
        }
      }
      if (ci % 400 === 399) await ctx.yield();
    }
    for (const [name, [c, s]] of fails) console.error('YARD CLEAR AIR FAILS: ' + name + ' stands ' + c.toFixed(2) + ' m from the flown line at s ' + s.toFixed(0));
    // 3. the report: the largest turnAt and its owner; the green share at the twelve u; bearings from the course
    const U12 = [0.02, 0.08, 0.16, 0.25, 0.34, 0.43, 0.52, 0.61, 0.7, 0.79, 0.87, 0.94];
    let maxYard = 0; for (const t of all) maxYard = Math.max(maxYard, t);
    const rimMax = Math.max(...rimPanes.map((p) => p.L.turnAt)), rimMin = Math.min(...rimPanes.map((p) => p.L.turnAt));
    const sorted = Float64Array.from(all).sort(), share = (f) => { let lo = 0, hi = sorted.length; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= f) lo = m + 1; else hi = m; } return Math.round(100 * lo / sorted.length); };
    const bearing = (s, p) => { const c = course(s), sb = port(s).multiplyScalar(-1), dx = p.x - X[s], dz = p.z - Z[s]; return Math.round(Math.atan2(dx * sb.x + dz * sb.z, dx * c.x + dz * c.z) * 57.29578); };
    const report = {
      lamps: all.length, largestTurnAt: +rimMax.toFixed(1), owner: 'a pane of the hood\'s rim (the rim turns ' + rimMin.toFixed(1) + ' to ' + rimMax.toFixed(1) + ')', largestBeforeRim: +Math.max(...all.filter((t) => t < rimMin)).toFixed(1),
      greenShare: U12.map((u) => share(u * ROUTE_LEN)), posts: nPosts, lanterns: nLant, farLamps: farF.length / 4, strokes: strokes.length + (hero.report ? 0 : 0), rain: [strokes.filter((st) => st.own).length, strokes.filter((st) => st.law).length, strokes.filter((st) => st.drip).length, steamAt.filter((e) => e.lamp).length, steamAt.length],   // (order 3, G2) strokes stood: the lamps' own, the course's, drips; steam sheets lit, drawn
      loop: +loopLen.toFixed(0), routeLength: +path.length.toFixed(1), claims: claims.length, walked,
      bearings: U12.map((u) => { const s = Math.round(u * ROUTE_LEN), tr = loopCurve.getPointAt(((trainAt + 165 + 1.5 * u * 46) % loopLen) / loopLen); return { u, tower: bearing(s, tw), board: bearing(s, P(BOARD_AT[0], BOARD_AT[1])), hood: bearing(s, hoodC), train: bearing(s, tr) }; }),
      // (order 2, D1) the lamps of the WHOLE world (so of any picture) that are not yet wholly green at u 0.79 and 0.87, the rim's panes apart
      deltaAt043: [lantPool.filter((t) => t.turnAt <= 537.5).length, lantPool.filter((t) => t.turnAt > 537.5 && t.turnAt <= 545).length, lantPool.filter((t) => t.turnAt > 545).length],   // (D4) lanterns green, in mid turn, red at the high view (537.5 m flown)
      notGreenButRim: [0.79, 0.87].map((u) => all.filter((t) => t > u * ROUTE_LEN).length - rimPanes.filter((p) => p.L.turnAt > u * ROUTE_LEN).length), cutLast: CUT_LAST,
      // (order 3, G4) the bridge's row at the metres flown 380 to 480: [flown, red, in mid turn, green, heads within 45 degrees of the course ahead]
      bridgeRow: Array.from({ length: 11 }, (_, i) => 380 + i * 10).map((f) => [f, mainAt.filter((h) => f - h.t <= -10 && h.t > 0).length, mainAt.filter((h) => f - h.t > -10 && f - h.t < 0).length, mainAt.filter((h) => f - h.t >= 0 || h.t <= 0).length, mainAt.filter((h) => Math.abs(bearing(Math.round(f * path.length / ROUTE_LEN), h.p)) < 45).length]),
      bridgeHeads: mainHeads, trainAt: Math.round(trainAt), leastGap: +least[0].toFixed(2), leastGapOf: least[1] + ' at s ' + Math.round(least[2]),
      extra: { masts: mastAt.map((m) => [m.at[0], Math.min(...m.turnAt), Math.max(...m.turnAt), m.turnAt.length]), home: homeAt.map((h) => [Math.round(h.L.turnAt), h.L.doubt, h.L.keep]), arrival: arrival ? [Math.round(arrival.L.turnAt), arrival.L.doubt, arrival.L.keep] : null, cutPost: cutPost ? [+cutPost.turnAt.toFixed(1), cutPost.doubt] : null, lastPostY: +lastPost.pos.y.toFixed(2), litFaces: litCount },
      // (order 5, K4) the engine's place and box (its eight corners), and the flown line's set-over from the plan line
      k: { engine: { at: ENG_AT, box: engBox }, wayAside: WAY_ASIDE, look: ENG_LOOK, slow: ENG_SLOW },
      // (order 6, M) the ranks' links and the lamps in ranks; the lead lanterns' numbers; the steam sheets stood
      m: { links: rankLinks.length, ranked: ranked.size, lead: lantPool.filter((t) => t.sAt > ENG_AT[0] - 70 &&t.sAt < ENG_AT[0] + ENG_LAMPS[0] - 1).map((t) => [+t.sAt.toFixed(1), Math.round(t.turnAt)]), steam: steamAt.length },
      // (order 6, N) the twelve heads of the bridge's row: each lamp's own place and number (the checks' measure of the row in the picture)
      n: { row: mainAt.map((h) => [+h.h.x.toFixed(2), +h.h.y.toFixed(2), +h.h.z.toFixed(2), +h.t.toFixed(1)]) },
      look: { weather, lead, rare, train: (trainSide > 0 ? 'port' : 'starboard') + ', ' + trainWagons + ' wagons, at ' + Math.round(trainAt), regulator: regulator ? 'open' : 'shut', hour: 'deep night' + (dawn ? '' : '') },   // (B6) the seeded draw of the hour is kept in its place; it shows nowhere
    };
    console.info('YARD REPORT ' + JSON.stringify(report));

    const engLook = V3(), boardLook = V3(), boardFoot = P(BOARD_AT[0] + 2, BOARD_AT[1], 0);   // (order 5, K1/K2) the looks' points, made here once (nothing is made in the flight)
    return {
      scene, path, duration: 46, report,
      // lingering at the dwarf file, the tower and the board; a pure, smooth function of u
      // (order 4, J1) and under the home signal, while its arm comes down (u 0.125 to 0.18)
      pace: (u) => 0.94 + 0.16 * sstep(0.08, 0.12, u) - 0.2 * sstep(0.122, 0.138, u) + 0.2 * sstep(0.166, 0.182, u) - 0.16 * sstep(0.48, 0.5, u) + 0.14 * sstep(0.72, 0.75, u) - 0.08 * sstep(0.85, 0.88, u)
        // (order 5, K1) and along the engine (ENG_SLOW: metres from the engine's own place, a place of the yard)
        - ENG_SLOW[2] * sstep(ENG_AT[0] + ENG_SLOW[0] - 22, ENG_AT[0] + ENG_SLOW[0], u * ROUTE_LEN) * (1 - sstep(ENG_AT[0] + ENG_SLOW[1], ENG_AT[0] + ENG_SLOW[1] + 22, u * ROUTE_LEN)),
      camera: { fov: 62, near: 0.3, far: 4000, bank: 0.3 },   // (order 3, E3) the horizon nearly level on the long bends
      pois: [
        // (order 1, PASS C) the gaze by place: to the coaling tower as we arrive; to the dwarf of the file that stands
        // next before us (the point slides up the file with us); into the starboard line of the mast wood at arm
        // height; to the engine's smokebox until it comes abeam
        { at: P(42, 7.2, 5), from: 0, to: 0.028, weight: 0.3 },   // (order 3, E4) a little toward the arrival's tall post and its streak, until it nears
        { at: (time, u) => { const s = Math.min(140, u * ROUTE_LEN + 5.5); return P(s, roadAside(6, s) + 1.4675, 1.5); }, from: 0.05, to: 0.118, weight: 0.72, arc: true },
        // (order 4, J1) UP ALONG THE HOME SIGNAL'S POST until it comes abeam (it stood: to the next post of the port line)
        ...(homeAt.length ? [{ at: homeAt[0].pv.clone().setY(HOME[0][2] - 3.2), from: 0.118, to: 0.172, weight: 0.86, arc: true }] : []),
        // (order 5, K1) TO THE ENGINE from 92 m before its buffers until 78 m past them (ENG_LOOK, metres from the
        // engine's own place; whole from 51 m before to 37 m past, where we look back at it over its tender, then let
        // go over the next 41 m while we still linger): it stands before
        // the bow as it grows, and the gaze stays on it while its side passes (arc: it lets go evenly; steady: the
        // steady camera keeps this look whole, so the engine is whole there too)
        { at: (time, u) => { const x = Math.min(engGaze.length - 1.001, Math.max(0, u * ROUTE_LEN - (ENG_AT[0] + ENG_LOOK[0]))), i = Math.floor(x); return engLook.copy(engGaze[i]).lerp(engGaze[i + 1], x - i); }, from: (ENG_AT[0] + ENG_LOOK[0]) / ROUTE_LEN, to: (ENG_AT[0] + ENG_LOOK[1]) / ROUTE_LEN, weight: 1, arc: true, steady: true, fade: 0.24 },
        // (order 4, J1) into the near half of the bridge's row; (order 5, K3) the point slides along the row with us,
        // from its starboard half (14 m to starboard) on to its port half (20 m to port, where its last heads turn),
        // 13.5 m up, until we are under its deck (s 372 to 470): the heads we pass go out by the picture's side whole
        // (order 6, N1) THE ROW LARGE AHEAD, by place (ROW_LOOK; metres from the engine's own place and the bridge's): the
        // look takes the row as soon as the engine's tender is past (30 m past its buffers, s 340; whole by s 380, 91 m
        // before we go under; it was s 370 to 472.5 at weight 0.6) and holds it till we are under the deck. Its point
        // rests in the row's starboard half (8 m to starboard, at the deck's height) while we come up, so that the row
        // stands across the picture from the nearest head still before us to the last, then slides to the port half
        // (20 m to port by s 470). arc: it takes the eye from the engine behind us evenly along the angle.
        { at: (time, u) => { const a = ROW_LOOK[2] + (20 - ROW_LOOK[2]) * sstep(BRIDGE_S - 49, BRIDGE_S - 1, u * ROUTE_LEN); return P(BRIDGE_S + a * Math.tan(BRIDGE_SKEW), a, ROW_LOOK[3] + ROW_LOOK[4] * (1 - sstep(BRIDGE_S - 96, BRIDGE_S - 66, u * ROUTE_LEN))); }, from: (ENG_AT[0] + ROW_LOOK[0]) / ROUTE_LEN, to: (BRIDGE_S + ROW_LOOK[1]) / ROUTE_LEN, weight: 0.92, fade: 0.3, arc: true },
        // (order 4, H3) the gaze goes down into the lanterns 58 m ahead of us along the braid and slides with us (as it
        // does up the dwarf file): the field fills the lower two thirds, the tower stays out to starboard
        // (order 5, K3) it takes hold from s 465 (it was 450: the row's look now lasts to the deck); it is whole by s 506
        // and lets go where it did (fade 0.337 of a shorter window is the same 0.033 of the flight)
        { at: (time, u) => P(Math.min(DELTA1, u * ROUTE_LEN + 58), 0, -3), from: 0.372, to: 0.47, weight: 0.8, fade: 0.337 },   // (it was a fixed point, P(622, 0, 0): order 2, D4) into the delta's near half (the same bearing as before: the tower stays out of this picture)   // (C6) held from under the bridge, so the climb never stares into the black
        { at: cabinAt.k(0, 7.2, -1), from: 0.468, to: 0.538, weight: 0.8, arc: true },   // (order 3, E2) to the signal cabin until it comes abeam
        { at: V3(tw.x, 36, tw.z), from: 0.55, to: 0.662, weight: 0.78 },   // (order 3, M5) to the tower's middle until it comes abeam (s 822): it spans the picture's height as the front climbs it
        // (order 5, K2) while the board is still far the gaze rests at its FOOT (3 m up), so that the board and its
        // double in the water both stand whole in the picture (the double was cut by the lower edge from s 825 to 860),
        // and rises to its middle as we come abeam (15 m up from s 878: the picture of the ninth still as it was)
        { at: (time, u) => boardLook.copy(boardFoot).setY(3 + 12 * sstep(BOARD_AT[0] - 62, BOARD_AT[0] - 36, u * ROUTE_LEN)), from: 0.648, to: 0.75, weight: 0.95 },   // (order 4, H2) to the board's middle: it stands whole, head to foot   // (order 3, E1) to the board's foot: its double in the water fills the lower half
        { at: lastPost.pos.clone(), from: 0.76, to: 0.82, weight: 0.3 },
        // (order 3, E2) to the cutting's last signal until it comes abeam: the covered way then lies off centre
        // (order 4, J2) THE GAZE GOES ASIDE to the thing we pass: up and to starboard, 32 degrees off the way's axis,
        // to the wet pile wall 21 m ahead of the eye (the point slides with us along the wall, as the gaze slides up
        // the dwarf file: so the eye turns only as the look comes and goes, eased). The bracket signal crosses that
        // picture from s 1070 to s 1089 and its tall case stands a third of the picture high at s 1087, its patch
        // down the wall behind it; the red-lit way and the small red rim stand at the picture's left edge. Back on
        // the axis by s 1120 (u 0.896). The route stays straight. (It was a look at the signal itself, weight 0.42.)
        // (order 5, K2) the look aside goes LEVEL: to the wall 15 m ahead of the eye at the signal's own height (it was
        // 21 m ahead and 7.5 m over the eye: the picture tipped up and the verticals leaned). 40 degrees off the axis:
        // the bracket signal crosses the picture whole and upright, and the red rim stands inside its left edge.
        ...(cutPost ? [{ at: (time, u) => P(u * ROUTE_LEN + 15, -15, FLOOR_Y + CUT_SIG[2] + 0.4), from: 0.838, to: 0.896, weight: 0.9, arc: true }] : []),   // (order 3, G5) more to it: the bracket signal hangs higher and nearer than the post stood
      ],
      // the way out: our own hood stands in the ring's place; the engine's ring, glow and halo are off
      portal: { shape: 'circle', radius: 7, frame: 0, glow: 0, halo: false, color: PALETTE[0], veil: PALETTE[0], revealDistance: 300, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      // a step of nought: the world's clock, and THE ANSWER by the metres flown (u times the route's length)
      update(dt, time, camera, u) { style.setTime(time); style.setFlown(u * ROUTE_LEN); },
      dispose() {},
    };
  },
};
