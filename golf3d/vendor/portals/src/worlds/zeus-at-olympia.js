// CAPTION, the owner's word of 9 Oct: Phidias made the seated god of ivory and gold over a wooden frame. The geographer Strabo wrote that his head almost touched the roof.
//
// The Statue of Zeus at Olympia: at dawn on a festival morning in high summer about AD 170. The flight begins inside the
// sacred grove north east of the temple, 13 m up over the stadium's road where it leaves the gate ground (the stadium's gate stands
// north of the long colonnade's end; the colonnade is 26 m and more from the lens), the sun low and gold behind and the white
// temple ahead with its east front and the long row of its north side: one wide first sight. After a few metres it leaves the
// road to the right hand and goes down at once, to 3.3 m over the ground, due west through an alley of wild olives and old planes,
// statues on their bases and pillars close on both hands, people in small knots among them, a small altar with a thin smoke where
// the alley ends, the ash altar's cone and its tall smoke ahead on the right between the planes' trunks, the temple on the left
// between the olives. It turns south out of the trees before the temple's north east corner and goes down the cross way's east
// half along the east front, the front squaring up, to head height at the ramp's foot; up the ramp, between the middle columns, through the porch with its three
// bronze gates and the great bronze door into the dim room, to the black pool of oil and slowly up before the seated god to the
// bay of the south gallery beside his right hand, where the ring stands. The statue is src/parts/zeus-at-olympia.js.
// Behind the entry the road runs straight back to the stadium's gate: nothing solid stands across that line.
//
// Axes: +X east, +Z south, y 0 the grove's ground. The temple's axis is z 0, its centre x 0, its door to the east.
// Daylight enters the room by the east door alone. The three.js sky light is the ROOM's dark fill; the open air's sky
// light is added by place in this world's own materials (zeusOpen below: 1 in the open, less under the colonnade,
// 0 in the room), so nothing but the sun's blade, two soft lights thrown up from the sunlit floor and the oil, and
// six small lamps finds the god above the knees.
//
// SAID IN THE OPEN (the owner's rule on places, 10 Oct): what is drawn, lit or placed by where the lens is, and why.
// - THE RING IS FIRST DRAWN where THE MOUTH OF ITS BAY OPENS TO THE LENS past THE BAY'S EAST UPPER COLUMN: the ring stands in the mouth of
//   the south gallery's bay, between that bay's two upper columns. Seen from far down the nave the east column closes the mouth; in plan,
//   the straight line from the lens to the middle of the mouth (half way between the two columns, on the line of their axes) clears that
//   column's shaft (its lower radius) from a place of the lens's line on (route.D.mouth), and from there the ring is drawn. The engine
//   then opens it about its own middle. The rule is the plan's alone: no picture, look, window or seed is read.
// - THE WAY IN IS TYPED BY THINGS THAT ALWAYS STAND (the road and its gate ground, the cross way, the temple's north east corner, the
//   ramp's foot: see WAY_IN) and is the same on every visit. DESIGN, SAID HERE, for the whole stretch from the entry to the ramp's foot
//   and for every seed (nothing below reads a place of the lens other than the line's own metres, nor a look, a clock or a seed):
//   . A LANE BY PLACE ALONG THE LINE: the grove's deal stays the deal by the seed, but no tree, statue, base, altar, standing person or
//     walker's beat is dealt nearer the line than its clear air (WAY_AIR, WAY_STATUE, WAY_ALTAR, WAY_FOLK, WAY_WALK; the lens's own
//     height there counted); a candidate that would stand in it is not dealt (dealGrove, dealLife).
//   . THE WAY'S TREES are placed to be seen from the way: thirteen trees (six old planes on the right hand, seven wild olives on both)
//     always stand beside its first run, the same shapes at the same places on every visit (WAY_TREES): the alley the lens flies down.
//     No plane's crown stands south of the sight from the entry to the temple's north west corner: the first sight keeps the temple whole.
//   . ROWS OF STATUES FACING THE WAY stand along both its hands (dealt by the seed from a stream of their own, 'statues-way-in': which
//     stand, of what kind, how far back): they are DENSER NEAR THE WAY than the grove's statues are far from it, and thin less with the
//     visit's density. ONE SMALL ALTAR with a thin smoke always stands on the right hand where the alley ends (its place along the line,
//     its size and turn by the seed; "always" is a RATE: OF THE LAW, the deal's 24 tries found it a place on 2,000 of 2,000 seeds
//     counted, 1 to 2,000: see dealGrove), and knots of people and walkers' beats are dealt beside the way (streams of their own).
//   . THE CLOSE VIEW: every statue of the grove is ONE MAKE (statueGeo: a carved figure of one of eight kinds, its head with a face's
//     planes, the paint of the age on marble, a sheen on bronze; on the bare bodies of the near and middle makes the forms are drawn by
//     the light from the body's own coordinates, a pure rule of the place on the body) at four finenesses BY THE PLACE IT STANDS AT: the NEAR make where the
//     lens passes within WAY_CLOSE (6.5 m) of it, the lens's own height counted; the MIDDLE make from there to WAY_MID (12 m); the FAR
//     make beyond; the FARTHEST where it stands farther than WAY_FAR (40 m) from every place of the way outdoors. (SINCE r5 THE FOUR
//     ARE NOT ONE FIGURE WITH FEWER FACES: step 4 gives the near make heads and limbs of its own and step 5 gives kind 6 a mantle
//     on the near and middle makes alone, so A KIND IS TWO FIGURES BY HOW NEAR THE WAY IT STANDS: see r5 step 4 and step 5 below.)
//     A base within WAY_MID has its mouldings, and a wreath or a garland of leaves is laid on a few of those. A standing person
//     within WAY_CLOSE of the line is modelled in the round; those farther than WAY_FAR are the plainest. WHAT THE NEAR THINGS GAIN,
//     THE FAR ONES GIVE UP. Detail by the place a thing STANDS at: the same on every visit, whatever the lens does. (THIS HOLDS OF
//     THE STATUES, THE BASES AND LIVE'S OWN PEOPLE. It does not hold of r5 step 10's people: each of them changes make by the
//     lens's distance in metres: see WHAT OF r5 READS THE LENS below.)
//   . THE BEATEN PATH under the way in is drawn in the ground (WAY_PATH): people have walked where the lens flies.
//   . THE PACE is quickest outdoors (PACE.grove as far as the top step) and slow from the great door on: more than half of the flight's
//     seconds are spent beyond the great door.
// - THE LOOK ON THE WAY IN is a law of places (makeRoute): at the entry the temple's north east corner column (the first sight); as the
//   lens goes down it turns toward the way ahead and, from before the alley's end, back to that corner, the two turns overlapping: the
//   gaze keeps on the temple's side of the line all the way down and through the alley and never swings round to due west and back (so
//   an arrival through a ring, at whatever speed it is carried in, turns under 30 degrees a second: 27.9 at the most with the sweeping
//   camera, 23.1 with the steady one, see the camera's spec); down the cross way's leg along the east front (the cross way's east
//   half, m 68 to 97; the ramp's foot is at m 107.95) it goes to the east front, and from the ramp's foot on it is the old look.
// - TWO INCENSE BURNERS stand before the barrier's blue faces, one on either side of the gateway, each before the middle of its face
//   (BURNER): placed to be seen from the nave, the same on every visit; their shade lies on the floor behind them and climbs the face.
// - WHAT MOVES moves by its own rule on the film's clock: nothing begins because the lens arrives, nothing is placed or timed for a
//   view. IN THE HALL: the six lamps' flames (each on its own phases; its light on the floor, the barrier and the gold breathes with it:
//   the six levels are handed to the part as opts.lampLevel); the incense (a thread from the small altar and from each burner, spent
//   under the beams, where what they have given hangs in two thin drifting sheets along the whole nave, over the crown of his head);
//   the oil's slow sheen and the swell that travels over it; the dust in the blade of sun and the lit air's own unevenness, from the
//   east front to his knees; the curtain's side spans; the still figures' slow shift of weight. OUTSIDE: the walkers, the leaves, the
//   kites and swallows, the altars' smokes and fires, the standing people's and the offerers' slow shift of weight, the hanging ends
//   of the woollen fillets tied round the altars and round one statue's base in three.
//   A MEDIUM THINS TO NOTHING NEAR THE LENS (the dust, the incense's threads, the smokes): from 2.5 m down to 0.6 m of true distance,
//   at every place and on every visit.
// - WHAT IS LEFT UNDRAWN BY THE LENS'S PLACE (each hides only what cannot be in the picture; see WHAT IS LEFT UNDRAWN, 1 to 4, in build):
//   1 the oil and its mirror picture while the curtain before the barrier hides the whole of the oil from the lens; 2 the grove and the
//   far land while the lens is inside the room (a plain stand-in of the land lies beyond the open door); 3 the god while the lens is
//   outside the room and no straight line from it through the great door's opening can reach him; 4 a part of the grove (east or west
//   of PART_X; the near and middle statues by cells of 16 m) whose own box lies wholly outside the picture.
// - THE LOOK INDOORS is a law of things and places (makeRoute): his shins as far as the barrier, then up his body to his face over the
//   closed floor; up the rise it slides from his face half way to the bay's mouth (reached where the lens is level with the gallery's
//   floor) and turns on to the bay's mouth on the last straight. There is no look down at the pool.
// - r5 AS BUILT (13 Oct, with the readers' mends of the first freeze; each said below): IN are step 1 (the room), 2c (the sun taken
//   away once), 4 (the near statues' forms), 5 (the robed man with the palm: no longer a switch), 6 (the ring opens by place), 7
//   (the forms let go by the pixel's width), 10 a, b, c (life where the pictures were empty, its knots by THE RULE OF THE KNOT)
//   with C1 (the make by the lens's distance, BY METRES), C2 (the shade of a body on open paving) and C3 (the two makes' one
//   dress). Steps 2a, 3 and 9 were tried and are NOT IN (the last lines of this head). Nothing in the world is lettered.
//   EVERY COUNT BELOW SAYS ITS KIND: OF THE LAW (the deal and the makes read as numbers, no picture) or OF THE PICTURE (counted in
//   the drawn page), and its seeds. A count OF THE LAW on seeds 1 to 200 is taken with the visit's variation as the page deals it
//   from the seed (with a plain visit the figures are others). A count of seeds or of places is a RATE, no law of the form.
//   OURS, NOT THE RESEARCH'S (the research names no kinds of statue, says nothing of their heads and lists the grove's ways as
//   unknown): the statues' EIGHT KINDS, their THREE HEADS BY KIND (step 4), THE ROBED MAN WITH THE PALM (step 5), that the way
//   the lens flies is kept free by live's deal (a rule of ours, no ancient custom: see lifeSteps), and step 10's walkers who
//   climb the temple's three steps beside the ramp (the research gives the ramp as the way up). THE DESIGN'S FILE as this
//   round found it (design/sw/briefs/zeus-at-olympia.json) carries no word of r5: its kinds and heads, its counts of people and
//   its distances are of earlier rounds, and its nearest standing person was counted in the picture; r5's clear air below is
//   OF THE LAW, not of the picture.
//   SECTION 177: the world sets portal.drawWithin and portal.drawIn; it shows no light and no image of its ring (the pool's
//   mirror takes layer 1 alone, on which the world sets only things of its own; nothing of the world takes the ring's colour).
// - r5 step 1, THE ROOM BOUGHT FIRST: the statues' MIDDLE, FAR and FARTHEST makes are thinned (statueGeo: each thinned figure stands
//   in a thin(was, now) marked "r5 step 1"; R5_STEP1 false gives those three makes as they were, kind 6's but for step 5). The near make and every statue's place, kind,
//   tone and size are as they were. MIDDLE (the lens never nearer than 6.5 m): the head 8 columns by 6 rings for 10 by 7, the bare
//   trunk 8 columns round for 10, an arm 4 sides for 5. FAR (never nearer than 12 m): the head 5 columns by 4 rings for 6 by 5, the
//   bare trunk 4 rings for 5, an arm 3 sides for 4. FARTHEST (40 m and more): the head 2 rings for 3, the bare trunk 3 rings for 4,
//   an arm that hangs straight 2 places for 3. Legs, hands, feet, garments, bands, wreaths and things held are as they were.
// - r5 step 2c, THE SUN'S LIGHT IS TAKEN AWAY ONCE (zeusOnce, R5_STEP2C, for the whole world and every seed): the painted shade keeps
//   three kinds apart (the buildings', the trees', the statues' and people's). On the ground and on every body, what a building has
//   shaded no other shadow darkens further: in a building's full shade (it leaves R5_DEEP of the sun) the place keeps exactly that
//   share; in its half shade a second shadow takes the rest of the sun and no more; in the sun everything is as it was. So inside the
//   long colonnade's shadow the ground under a tree is as light as the open ground there, a body under a crown as light as a body
//   beside it, and a statue's shadow shows only where the sun reaches. The shade's own depth and colour are as they were; no light is
//   added. (Within one kind the painted picture still lays shadow on shadow: a crown is a sieve of many leaves.) R5_STEP2C false: as
//   it was (the ground took the darkest of the three, a body the trees' share times the buildings').
//   THE STEPS' WALKERS' GROUND STRIP (step 10; r5 A5) stands partly outside this rule: on the ground east of the lowest step's
//   foot it takes the painted shade as every other painted shadow does (what a building or a tree has shaded there it darkens
//   no further); ON THE STEPS IT TAKES NO SHADE (there the painted shade holds the temple's own footprint and would take the
//   strip whole); and THE MAP'S SHADOWS CUT NO PAINTED STRIP, this one or another, on the steps or on the ground before them:
//   where a shadow of the map lies (a standing body's shadow board), a walker's strip darkens the place once more.
//   THE FIRST METRES' SHADE IS THE LONG COLONNADE'S OWN: the ground the lens looks down on from the entry (m 0 to 12, the strip 8 to
//   40 m ahead) lies in the shadow that the long colonnade behind it throws at this sunrise: the long colonnade (the research's
//   long Echo Stoa; its length, height and place are the design's) under the design's sun, neither touched; the building stands
//   on every seed. COUNTED, OF THE LAW (the painted shade read as the world paints it for the seed, no picture), on the six
//   seeds 7, 14, 37, 128, 162 and 195, RATES OF PLACES: 92 places in 100 of that strip have under half the sun, 82 by the
//   colonnade, 5.5 by the trees alone. So no tree was moved for it, and by 2c no second shadow darkens that ground further.
// - r5 step 4, THE NEAR STATUES' FORMS (R5_STEP4 and R5_AIR at statueGeo; the near make alone, no statue moved, none added, no
//   triangle added): the shoulder falls from the neck over a round cap into the arm; thigh, calf, upper arm and forearm swell; three
//   heads by kind (the victor's, a youth's, a bearded man's: OURS; planes only: no eyeball, no worked lips, no likeness; the near
//   heads carry a face's planes as live's do). THE NEAR MAKE ALONE, SO A KIND IS TWO FIGURES BY HOW NEAR THE WAY IT STANDS: within
//   WAY_CLOSE (6.5 m) of the line kind 3 is bearded and kinds 2 and 4 have cropped hair and no band; beyond it kind 3 is beardless
//   and kinds 2 and 4 wear the band, as live's do. A statue's make is by its place, so none changes in flight.
//   IN SHADE THE FORMS STILL READ, by a rule of the surface's own turn and of the sun's bearing (the seed's): what of a near statue
//   faces the sun's side of the sky takes R5_AIR.side more of the air's light, what faces away as much less, and a furrow of the
//   body's forms R5_AIR.furrow less. The side share reads nothing of the lens, the way or the clock. THE FURROW SHARE READS THE
//   PIXEL'S WIDTH: it is cut with the forms themselves by step 7's filter (statueMat's zBk), so it fades with the lens's
//   distance and the window as they do.
// - THE BODY'S FORMS LET GO WHERE A PIXEL IS WIDER THAN A FURROW (r5 step 7; statueMat's zBk): the plates and furrows the light draws on
//   the near and middle statues' bare bodies stand at full strength where a pixel is under 0.8 cm of the surface wide and are gone
//   where it is 2.2 cm and more: a filter by the pixel's own width against shimmer, the one filter through which those forms, and
//   step 4's furrow share with them, read the lens.
// - r5 step 5: THE ROBED MAN WITH THE PALM (statue kind 6; he was the charioteer in the long belted robe; step 5 is no longer a
//   switch: the charioteer's branch is out of this file) is OURS. The earlier robed kind answered to one surviving kind of work in
//   all six of the choices that described it; two of the six are changed so that it answers to no one work: for the high belt,
//   the belt AT THE WAIST in every make and a mantle with body over the left shoulder and upper arm on the near and middle
//   makes; for the forearm held to the reins, both arms LOWERED in every make and a palm in the right hand: a frond on the
//   near and middle makes, one blade on the far make, none on the farthest. Four are kept: he stands alone, the long robe in
//   upright folds, the short sleeves, the band round the hair. A palm in a victor's right hand is the lead's own knowledge of
//   ancient custom, not in this world's research. He goes on the design's list of ours. See statueGeo.
// - r5 step 6: THE RING OPENS (portal.drawIn, R5_STEP6) over the metres of the line from where its bay's mouth opens to the lens
//   (route.D.mouth, where it is first drawn) to the pool's east edge (route.D.pool): typed as the difference of those two places.
// - r5 step 10, LIFE WHERE THE PICTURES WERE EMPTY (R5_STEP10, R5_STEP10C, LIFE10, KNOT10 and GROUND10 at lifeSteps; rules of place
//   for every seed, dealt from streams of their own after the rest of the deal, which does not move: live's deal stands to the bit):
//   (a) ON THE EAST FRONT people of the world's own makes stand in the gaps between the columns to either hand of the ramp, on the
//   steps beside it and the ground before them, along the ramp's two edges and in the porch to the sides of the great door, and a
//   few walk up and down the steps beside the ramp on closed beats. THE DOOR'S LANE STAYS OPEN: none of them stands nearer the
//   temple's axis than 3.0 m on the ramp and 3.3 m from the top step to the door (the lane between the nearest bodies' middles is
//   6.0 m and 6.6 m wide, over a door 5.0 m wide); none stands in the room. THE RAMP HOLDS EIGHT AT MOST (LIFE10.ramp: every
//   one on it is in the round and in the god's first frame; OF THE PICTURE, seed 75: with the ramp unbounded that frame drew
//   492,195 triangles, over the lead's term of 492,000).
//   (b) UNDER THE ENTRY people stand and walk on the stadium's road from 8 to 60 m past the entry, none nearer the lens's line than
//   WAY_CLOSE (each place is tested against the line, the lens's height counted).
//   (c) ON THE GROUND BEFORE THE TEMPLE knots of two to four stand on the open ground below the east front north of the ramp and
//   past the temple's north-east corner (GROUND10.fields; none nearer the temple's axis than 7.4 m, and none nearer the lens's
//   line in plan than WAY_CLOSE: each place is tested against the line), and walkers go on closed beats toward the ramp's foot.
//   THE RULE OF THE KNOT (r5 A1; of step 10's people alone: live's own knots are dealt as they were, to the bit, and may still
//   stand in a row): a knot is two to four people in a loose ring or arc with unequal gaps. Each is turned by a draw of its own:
//   to the knot's middle, to the knot's sight (the great door; for two of the porch's places a thing of the porch; for (b) and
//   (c) the temple's front) or half away; one who would be the third of its knot turned alike is turned on. Off the ramp NO THREE
//   STAND ON ONE LINE (KNOT10.line, off; for (a) live's offerers are counted with them). ON THE RAMP'S EDGES a knot is a file of
//   two or three with unequal gaps; KNOT10.edge (2.5 m) of free edge lies between two knots of one edge; the knots of the two
//   edges do not stand opposite one another (KNOT10.across); EACH EDGE HOLDS A THIRD OF THE RAMP'S PEOPLE AND MORE. NO MIRROR, NO
//   TWIN: each takes its dye, its mantle's dye, its skin and hair and what it holds from draws of its own, and none wears the
//   dye or holds the thing of a neighbour within KNOT10.twin (2.5 m) of its place or of its mirror place across the temple's
//   axis. COUNTED, OF THE LAW, seeds 1 to 200: no line of three among step 10's people and the offerers; no file of more than
//   three on an edge of the ramp; no edge under a third; the least free edge between two knots 2.90 m; no two such neighbours
//   in one dye or holding the same thing; no three of a knot turned alike within KNOT10.alike.
//   THE CLEAR AIR IS A RULE (section 169: 2.0 m, its margin 2.3 m). (b) and (c) are dealt WAY_CLOSE (6.5 m) and more off the
//   line. One of (a) whose make's greatest reach in plan (reach10: 0.36 m at rest; 0.54 to 0.78 m with the arm held out, bare or
//   with a wreath, a dish or a branch in the hand) would come within KNOT10.air (2.3 m) of the lens's line is not placed (r5
//   A2). COUNTED, OF THE LAW, seeds 1 to 200, against the lens's place as flown from the entry to 6 m past the door (both
//   cameras fly that line and only turn): of (a) the least is 2.923 m to the body's axis and 2.623 m to a post of 0.30 m about
//   it; of the 3,485 people in the round, 2.458 m to the TRUE CORNERS of the round make as it stands and 2.367 m with its
//   shift of weight taken whole (none under 2.3 m; two under 2.5 m). Of (b) 6.626 m and of (c) 6.451 m to the post; the
//   walkers' beats 9.463 m (those of the steps that are drawn: beatNear leaves out every one whose beat comes within WAY_CLOSE
//   of the line in plan), 6.674 m (b) and 7.088 m (c).
//   THE COUNTS A SEED (OF THE LAW, seeds 1 to 200, the visit's variation as the page deals it: the least / the mean / the most):
//   (a) 19 / 27.9 / 38 standing (of them on the ramp 3 / 7.1 / 8), 11 / 17.4 / 22 of them in the round, and 0 / 2.0 / 4 walkers
//   of the steps dealt, 0 / 0.7 / 2 of them drawn; (b) 8 / 15.2 / 23 standing and 1 / 2.0 / 2 walkers; (c) 14 / 17.6 / 20
//   standing and 1 / 2.4 / 3 walkers. In all 47 / 60.7 / 74 stand, beside live's 110 / 170.6 / 244.
// - WHAT OF r5 READS THE LENS, NAMED HERE (section 153 of the crews' rules; nothing of it reads a look, a clock or a seed): one is
//   A LEVEL OF DETAIL BY METRES FROM THE LENS, one a filter by a pixel's width, one a timing by the lens's place on the line; the
//   others leave out what cannot be seen.
//   . DRAWN BY THE LENS'S DISTANCE, BY METRES (step 10's own, under no switch; r5 C1, R5_C1, adds the round make to it): each of
//     step 10's people is live's standing figure or walker in the knots' make while the lens is within LIFE10.far (40 m: WAY_FAR's
//     figure typed again) of him and in the plainest make beyond. THIS IS NO FILTER BY A PIXEL'S WIDTH: it is 40 m from the lens
//     in metres, the same at every window and lens angle: a level of detail by where the eye is, changed on one frame with no
//     fade; a law by the eye under section 153, named here as that. LIVE NEVER HAD IT: live's makes are by the place a thing
//     stands at and never change in flight (its plainest make is by the body's distance from the way, this one by the lens's:
//     unlike rules). NOW, ON EVERY VISIT, a person of step 10 changes make in flight on the frame where the lens comes within
//     40 m of him. One who STANDS nearer the lens's line than WAY_CLOSE (the ramp's edges, the top step's inner gaps, the porch)
//     is live's figure in the round (fineFigureGeo, dressed from his own dealt draws: kind10, held10; its arm one tube through
//     the elbow, o.join) while the lens is within 40 m of him, and the plainest make beyond: by the body's place and the lens's
//     distance. With R5_C1 false the change at 40 m stands and only the round make goes.
//     THE TWO MAKES WEAR ONE DRESS (r5 C3): the plainest make of a long garment carries its mantle as the round one does (rolled
//     across the chest to the left shoulder, over the left arm, its end behind) in the mantle's own dye (aDye2), so that the
//     change at 40 m moves no DYE OF GARMENT OR MANTLE. Skin, hair and what is held still change there: the plainest make's skin
//     and hair are the make's own and the round make's are the person's; the wreath, the staff and the offering are in the
//     round make alone; the head's shape and the limbs' roundness change.
//   . NOT DRAWN OUTSIDE THE PICTURE: one of step 10's people whose ball (1.5 m about his middle) lies wholly outside the picture
//     is not drawn (the renderer's own test of a thing out of the picture, made a body at a time).
//   . THE WALKERS LEFT OUT NEAR THE LINE (beatNear): the world has no walker in the round, so a walker of the steps whose beat
//     comes nearer the lens's line in plan than WAY_CLOSE (one that climbs through a gap next to the ramp) is not drawn on any
//     frame of any visit; its beat stays dealt and kept free, so that nothing else of the deal moves. By the beat's place alone.
//     (OF THE LAW, seeds 1 to 200: 269 of the 400 walkers of the steps dealt are left out.)
//   . BY THE PIXEL'S WIDTH: step 7's filter on the statues' bodies, and step 4's furrow share through it (both named above).
//   . TIMED BY THE LENS'S PLACE ON THE LINE: the ring's opening (step 6: over the metres from route.D.mouth to route.D.pool, two
//     places of the world and the line; no seed, no still).
//   . PLACED BY THE LINE'S PLACES, NOT BY THE LENS IN FLIGHT (rules of place, the same on every frame of every visit): who is
//     made in the round, which walkers are left out, (b)'s and (c)'s test against the line, and (a)'s by its make's reach (A2).
// - THE SHADE OF A BODY ON OPEN PAVING (r5 C2, R5_C2; the 'pave' material: steps, ramp, its side walls): where the sun's map of
//   shadows shades paving that lies open to the sky, half of the sky's upper light is taken from it and half of the lower, warm light
//   given, by the surface's own turn upward, so that the shade has the tone of the side walls' shaded faces there and is neither
//   brighter nor bluer than it; under the roof (the roof's edge by zeusOpen's four figures, typed again in paveShade) nothing is changed. A rule of the
//   surface and of the map alone: nothing of the lens, the way or the clock is read. The front people's unseen shadow boards have
//   a neck and a head (a body's outline, not a tapered slab).
// - THE ROOM AS BUILT (OF THE PICTURE: counted in the page at 320 x 180, on the two seeds 14 and 75 alone; the budget is 500,000
//   triangles and 200 draw calls, the lead's term 492,000 triangles): on seed 14 the flight's first frame draws 489,156 triangles
//   in 193 calls and the god's first frame (m 82.1) 481,069; on seed 75 they draw 481,969 in 192 calls and 491,072, the heaviest
//   frame found on those two seeds. No rule of the code bounds a seed's triangles as a whole; step 10's people are bounded by
//   LIFE10 (front, ramp, ground). The god in the kept map of shadows (step 9) does not fit in it.
// - WHAT r5 NO LONGER SHOWS, AND WHAT IS NOW SEEN BY CHANCE:
//   NEVER NOW: the charioteer (kind 6) in any make; within WAY_CLOSE of the line the band on a youth's hair (kinds 2 and 4) and
//   a beardless kind 3 (beyond it both are as live's).
//   NEVER ON LIVE, NOW ON EVERY VISIT: a person of step 10 changes make in flight where the lens comes within 40 m of him.
//   BY CHANCE NOW, where live never had it: on the last turn before the ramp's foot (m 96.9 to 107.9) one of (a) may stand
//   before part of the great door's opening. COUNTED, OF THE LAW, seeds 1 to 200 (the reader's own count run on this deal:
//   bodies as posts of 0.30 m, 25 marks of the opening, the line every half metre): at 1,296 of 4,600 places, on 169 seeds of
//   200, RATES (at the worst 6 marks of 25); from the ramp's foot to the door at none of 15,600 places.
// - THREE THINGS OF r5 WERE TRIED AND ARE NOT IN (nothing of them is left in this file):
//   step 2a (the first plane moved to frame the first pictures): the alley's right hand row is that wall already; nothing seen was gained.
//   step 3 (a body cut by the picture's foot on the way in moved outward): six strangers of six preferred live's fuller foreground (the paper: shots/zeus-at-olympia/r5-previews.txt).
//   step 9 (the god in the kept map of shadows): on the map's frame he is drawn twice (794,836 triangles); a ghost left his feet's shade unlike.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import * as terrain from '../kit/terrain.js';
import { buildHero } from '../parts/zeus-at-olympia.js';

// ---------------------------------------------------------------- the design's measures (metres)
const FLOOR = 5.12;                       // the room floor
const MOUND = 3.0, STY = 4.52;            // the foot of the lowest step, the top step
const COL_H = 10.43, COL_D_END = 2.25, COL_D_SIDE = 2.21, COL_D_TOP = 1.70, CAP_W = 2.65;
const BEAM_H = 1.77, FRIEZE_H = 1.74, CORNICE_H = 0.6, GABLE_H = 3.3;
const Y_BEAM = STY + COL_H, Y_FRIEZE = Y_BEAM + BEAM_H, Y_CORNICE = Y_FRIEZE + FRIEZE_H, Y_EAVE = Y_CORNICE + CORNICE_H;
const COLS_X = [-30.89, -26.10, -20.88, -15.66, -10.44, -5.22, 0, 5.22, 10.44, 15.66, 20.88, 26.10, 30.89];
const COLS_Z = [-12.62, -7.83, -2.61, 2.61, 7.83, 12.62];
const CELLA_X = 23.42, CELLA_Z = 8.2;     // the inner building's outer faces
const ROOM_X = 14.37, ROOM_Z = 6.63;      // the room's inner faces
const lensInRoom = (camera) => camera.matrixWorld.elements[12] < ROOM_X;   // the lens is in the room: west of the door wall's inner face
const DOOR_X = 15.7, DOOR_W = 5.0, DOOR_H = 9.5;
const LEAF_W = 2.44, LEAF_OPEN = 140 * Math.PI / 180;   // the great door's two bronze leaves stand wide open in the porch, each swung 140 degrees back toward the door wall: their panels face the morning and the way in, and the doorway is clear to its jambs
const PORCH_Y = 4.82;                     // the porch floor: one step over the colonnade's
const IN_Z = 4.05, IN_X = [10.78, 7.19, 3.59, 0, -3.59, -7.19, -10.78];
const LOW_H = 7.0, GALLERY = 8.0, UP_H = 4.3, RAIL_H = 0.9, CEIL = 14.0;
const BASE_X = -2.63;                     // the base's front edge: the statue's origin
const POOL = { x0: -2.63, x1: 3.87, z: 3.25, rim: 0.15, rimW: 0.3 };
const BARRIER_X = 6.87, BARRIER_T = 0.22, BARRIER_H = 1.1, GATE_HALF = 1.5;
const CURTAIN_TOP = 1.2, CURTAIN_SAG = 0.08;   // the curtain's hem at its stands, a hand over the barrier, and how far it sags between them
// the east porch's gates: where they hang (x), their posts across the porch (beside the columns' flanks and at the walls), a leaf's breadth
// (the middle gate's, the side gates'), their height
const GATE_X = 22.5, GATE_POSTS = [1.68, 3.58, 6.53], GATE_LEAF = [1.5, 1.38], GATE_H = 3.2;
// the curtain: where it hangs (west of the barrier), its four cord stands across the room, the cord's middle over the hem line and its
// half thickness, a stand's top over the hem line at the stands
const CURTAIN = { x: BARRIER_X - 0.55, cords: [-3.25, -GATE_HALF, GATE_HALF, 3.25], cord: 0.03, cordR: 0.016, stand: 0.1 };
const BARRIER_LEAF = { len: GATE_HALF - 0.08, h: BARRIER_H - 0.05, rail: 0.025 };   // the barrier's open gate leaves: a leaf's length, its top rail's height, the rail's half thickness
// THE BARRIER'S STONE FRAME: a coping (its top is the barrier's top, BARRIER_H), a base course with a small moulding over it, a post at
// each end of each half (beside the gateway and at the column); the blue face lies between them. BURNER: two bronze incense burners
// stand before the blue faces, one on either side of the gateway (x, |z|, the foot's radius, the height)
const BAR = { cope: 0.07, copeOut: 0.04, base: 0.14, baseOut: 0.07, post: 0.22, postOut: 0.05, clear: 0.03 };
const BURNER = { x: BARRIER_X + BARRIER_T + 0.42, z: (GATE_HALF + IN_Z - 0.6) / 2 + 0.01, r: 0.15, h: 1.0 };
const LAMP_H = 0.92;                         // the lamps' low stands
const LAMP_AT = [[6.45, 2.75], [6.45, -2.75], [4.3, 3.05], [4.3, -3.05], [-2.45, 3.66], [-2.45, -3.66]], LAMP_FLAME = 0.37, LAMP_TONGUE = 0.27, LAMP_SWELL = 0.3;   // where the six lamps stand (x, z); a flame's tip over its stand at its tallest (the tongue LAMP_TONGUE from 0.01 m over the stand, at most LAMP_SWELL taller as it breathes)
const JAR = { x: 5.25, z: -1.95, r: 0.33, h: 0.9 };   // the bronze jar on the closed floor: its place, its greatest radius, its height
// the lens's line in the room: it leaves the room's axis by DRIFT m, to the NORTH (the side away from the ring's bay and from his right
// hand), by ONE easing of place (the owner's word of 9 Oct): DRIFT times a smooth step of x from the door wall's inner face (ROOM_X) to the
// barrier's east face (the face toward the door). Every knot of the room reads driftZ; from the barrier to the top of the rise the lens
// stands DRIFT north of the axis, and from there the last straight heads across the nave into the bay.
const DRIFT = -1.0;
const smoothStep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const driftZ = (x) => DRIFT * smoothStep((ROOM_X - x) / (ROOM_X - BARRIER_X - BARRIER_T));
// the ring stands in the nave before the SOUTH row's bay between the upper columns IN_X[BAY] and IN_X[BAY + 1] (the owner's word of 9 Oct:
// the bay beside his right hand and the Victory), TOP_H above the floor. Across the room its rim's south point stands on the line through
// the middles of the bay's two columns: the ring stands in the bay's mouth, over the Victory on his hand. The last straight is
// level and LAST m long (the owner: 4.5 to 6 m); it starts at the top of the rise, which stands on the lens's line (DRIFT north of the axis).
const BAY = 4, TOP_H = 10.6, RING_R = 1.3, LAST = 5.0;
const RING = { x: (IN_X[BAY] + IN_X[BAY + 1]) / 2, y: FLOOR + TOP_H, z: IN_Z - RING_R, r: RING_R };
const RISE_TOP = { x: RING.x + Math.sqrt(LAST * LAST - (RING.z - DRIFT) ** 2), z: DRIFT };
// the footstool on the base (the part's measures): its height, how far behind the base's front edge its middle lies (it reaches from 0.25
// to 2.85 m behind that edge), and how far behind that edge its two front lions crouch
const STOOL = 0.9, STOOL_MID = 1.55;
// the owner's term: the face is never nearer than FACE_CLEAR while any of it is seen (counted on the built file, not steered by it): the turn
// aside and the pace's last ramp end at the place on the last straight FACE_CLEAR from his face
const FACE_CLEAR = 5;
// the small stone altar on the closed floor between the barrier and the pool, south of the gateway: its top slab's outline, its height,
// the slab's thickness and how far the slab stands out over the block
const SMALL_ALTAR = { x0: 4.9, x1: 5.6, z0: 2.1, z1: 2.8, h: 0.72, slab: 0.1, over: 0.05 };
// THE FLOOR'S DRESS (the owner's law of 9 Oct): a still thing on a floor whose top stays DRESS.under or more under the lens's height is the
// floor's dress and keeps DRESS.under from the lens's place; one that reaches higher is a body and keeps 2 m of clear air. So from the
// barrier to the pool the lens stands DRESS.under and DRESS.spare over the highest top of any still thing within DRESS.near of its line.
const DRESS = { under: 1.0, spare: 0.10, near: 2.0 };
// the still things on the room's floor at the barrier and on the closed floor behind it: each its ground plan x0, z0, x1, z1 and its top over the floor
const FLOOR_THINGS = [
  [CURTAIN.x, CURTAIN.cords[0], CURTAIN.x, CURTAIN.cords[3], CURTAIN_TOP + CURTAIN.cord + CURTAIN.cordR],                         // the curtain's hem and cord
  ...CURTAIN.cords.map((z) => [CURTAIN.x, z, CURTAIN.x, z, CURTAIN_TOP + CURTAIN.stand]),                          // its four cord stands
  ...LAMP_AT.map((q) => [q[0], q[1], q[0], q[1], LAMP_H + LAMP_FLAME]),                                           // the lamps with their flames
  [JAR.x - JAR.r, JAR.z - JAR.r, JAR.x + JAR.r, JAR.z + JAR.r, JAR.h],                                           // the bronze jar
  ...[-1, 1].map((s) => [BURNER.x - BURNER.r, s * BURNER.z - BURNER.r, BURNER.x + BURNER.r, s * BURNER.z + BURNER.r, BURNER.h]),   // the two incense burners before the barrier
  [SMALL_ALTAR.x0, SMALL_ALTAR.z0, SMALL_ALTAR.x1, SMALL_ALTAR.z1, SMALL_ALTAR.h],                               // the small altar
  [POOL.x1 - POOL.rimW, -POOL.z, POOL.x1, POOL.z, POOL.rim],                                                     // the pool's rim, its east side
  ...[-1, 1].flatMap((s) => [
    [BARRIER_X - BAR.copeOut, Math.min(s * GATE_HALF, s * (IN_Z - 0.6)), BARRIER_X + BARRIER_T + BAR.baseOut, Math.max(s * GATE_HALF, s * (IN_Z - 0.6)), BARRIER_H],   // the barrier with its frame, either side of its gateway
    [BARRIER_X + BARRIER_T, s * GATE_HALF, BARRIER_X + BARRIER_T + BARRIER_LEAF.len, s * GATE_HALF, BARRIER_LEAF.h + BARRIER_LEAF.rail],                    // its open gate leaves
  ]),
];
const CROSS_X = 60;                       // the cross way before the east front
const PACE = { grove: 2.5, top: 2.5, porch: 2.0, room: 0.35, rise: 0.35, last: 1.5 };   // the pace at places (the engine's own measure: quickest 2.5, slowest 0.35)
// the look: its weight; LOOK_EASE: the eased share of each of its turns (at the turn's start or at its end)
const LOOK_HOLD = 1, LOOK_EASE = 0.15, LOOK_BOTH = 0.5, LOOK_REACH = 10, LOOK_AHEAD = 20, LOOK_LEVEL = 0.4, LOOK_LEAD = 22, LOOK_TURN = 34;
const INC_THREAD = 4.0, INC_SHEET = 1.05, INC_DOOR = 0.5, INC_SUN = 0.5, INC_GOLD = 0.016;   // the incense: a thread's strength at the bowl, a sheet's; the door's daylight on it, the sun's, the gold's
const GOLD_UP = 30;   // the gold's light on the timber over him: its strength (it falls with the square of the distance from his chest)
// the ash altar's smoke: how high it stands, its radius at the fire and at its head, a puff's breadth at the fire and at the head
const SMOKE = { h: 44, radius: [0.5, 4.2], size: [1.1, 6.5] };
const ALTAR = { x: 45, z: -70, h: 7.0, stage: 12.7, stageH: 1.1, r: 5.2, top: 3.1 };   // the stone stage 12.7 m across, the cone of ash on it (r: its foot's radius), 3.1 m across at its top, 7 m high in all
const PILLAR = { x: 63, z: 15, h: 8.81, all: 10.9 };
const STOA_X = 150;
const SUN_WIDE = 0.0093;   // the sun's breadth in the sky (radians): a shadow's edge is this soft per metre of its length
const SHADE = { x0: -150, z0: -140, x1: 170, z1: 100, w: 2048, h: 2048 };   // the painted shade's field on the ground and its picture

const C = (hex) => new THREE.Color(hex);
const paint = (g, c) => {
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
};
const box = (x0, y0, z0, x1, y1, z1, c) => paint(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), c);
const merged = (list) => { const g = mergeGeometries(list.map((q) => (q.index ? q.toNonIndexed() : q)), false); for (const q of list) q.dispose(); return g; };

// ---------------------------------------------------------------- light by place: the open air's sky light, shaded under roofs
// zeusOpen: how much of the sky a place sees. 1 in the open and on the roof, falling under the colonnade's ceiling,
// less in the porch, none in the room. zeusDoor: the daylight the open door throws into the room, on faces turned to it.
// (A FIGURE TYPED TWICE: the roof's edge in zeusOpen (32.9, 14.7, and the fall from -0.8 to 3.6 m inside it) is typed again in
// paveShade in build (r5 C2); neither is read from the other: who changes one changes the other.)
// r5 step 2c (the sun's light taken away once: see zeusOnce and the head): how the painted shade's kinds combine on the ground and on
// a body. R5_STEP2C false: as it was (the ground the darkest of the three, a body the trees' share times the buildings').
const R5_STEP2C = true, R5_DEEP = 0.08;   // (R5_DEEP: the sun's share that a building's painted shade leaves: 1 - 0.92. A FIGURE TYPED TWICE: the 0.92 stands in mass() in build and is not read from here: who changes one changes the other)
const SHADE_GROUND = R5_STEP2C ? 'zeusOnce(zs.b, min(zs.r, zs.g))' : 'min(zs.r, min(zs.g, zs.b))', SHADE_BODY = R5_STEP2C ? 'zeusOnce(zs.b, zs.r)' : 'zs.r * zs.b';
const PLACE_GLSL = /* glsl */`
uniform vec3 uSkyTop; uniform vec3 uSkyLow; uniform vec3 uDoorCol; uniform vec4 uLamp[6]; uniform vec3 uLampCol;
// the grove's painted shade: r the trees' long shadows, g the statues' and small things', b the buildings' (1 = in the sun)
uniform sampler2D uShade; uniform vec4 uShadeBox; uniform vec3 uSunRough;
// the ground's marks, painted from the deal: r fallen leaves under the plane trees, g ground worn to the earth (round bases, altars, where people stand)
uniform sampler2D uMarks; uniform vec4 uWay; uniform vec3 uEarth; uniform vec3 uSlab;
float zeusHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float zeusVal(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(zeusHash(i), zeusHash(i + vec2(1.0, 0.0)), f.x), mix(zeusHash(i + vec2(0.0, 1.0)), zeusHash(i + vec2(1.0, 1.0)), f.x), f.y); }
// the painted shade is the ground's: what stands higher than a building's shadow reaches is in the sun (uStoa: the long colonnade's
// ridge x and height, the sun's rise and its bearing off the axis per metre; elsewhere the far masses' shadows reach no higher than 8.5 m)
uniform vec4 uStoa; uniform vec3 uShadeTint; uniform vec3 uShadeHue;
float zeusOver(vec3 p) {
  float d = uStoa.x - p.x, zc = p.z + d * uStoa.w;
  float lane = step(0.0, d) * step(${(-64).toFixed(1)}, zc) * step(zc, ${(44).toFixed(1)});
  return smoothstep(-0.5, 0.5, p.y - mix(8.5, uStoa.y - d * uStoa.z, lane));
}
vec3 zeusShade(vec3 p) { vec3 s = texture2D(uShade, (p.xz - uShadeBox.xy) * uShadeBox.zw).rgb; s.b = max(s.b, zeusOver(p)); return s; }
// r5 step 2c: THE SUN'S LIGHT IS TAKEN AWAY ONCE. b: the sun's share a building's shadow leaves at a place; m: the share the other
// shadows there (trees, statues, people) would leave by themselves. What a building has shaded no other shadow darkens further (in
// its full shade, where it leaves ${R5_DEEP.toFixed(2)}, the place keeps exactly that; in its half shade in proportion; in the sun m stands as it was).
float zeusOnce(float b, float m) { return min(b, max(m, ${R5_DEEP.toFixed(2)} * (1.0 - b) / ${(1 - R5_DEEP).toFixed(2)})); }
// the ground mist of the dawn: a thin layer lying in the grove's hollows and thick toward the river, none on the temple's mound; its
// density falls with height (uMist.y); what the lens sees of it is the true depth of it along the line of sight (a medium)
uniform vec4 uMist; uniform vec3 uMistSun; uniform vec3 uMistShade; uniform float uClock;
float zeusMistField(vec2 q) {
  vec2 w = q + vec2(0.45, -0.12) * uClock;   // the mist drifts west with the morning air, half a metre a second
  float a = 0.5 + 0.5 * sin(w.x * 0.043 + 1.3 + 0.9 * sin(w.y * 0.031)) * sin(w.y * 0.052 - 0.4 + 0.8 * sin(w.x * 0.027));
  float valley = smoothstep(110.0, 250.0, q.y);
  float mound = smoothstep(2.0, 16.0, max(abs(q.x) - 33.4, abs(q.y) - 15.2));
  return (a * a * a * a * 1.2 + valley) * mound;
}
float zeusMist(vec3 p, vec3 cam) {
  float H = uMist.y, dy = p.y - cam.y, dist = length(p - cam);
  float a = exp(-max(cam.y, 0.0) / H), b = exp(-max(p.y, 0.0) / H);
  float mean = abs(dy) > 0.02 ? H * (a - b) / dy : a;
  float field = 0.5 * (zeusMistField(p.xz) + zeusMistField(mix(cam.xz, p.xz, 0.6)));
  return 1.0 - exp(-uMist.x * field * max(mean, 0.0) * dist);
}
float zeusOpen(vec3 p) {
  vec2 q = vec2(abs(p.x), abs(p.z));
  float roofIn = min(32.9 - q.x, 14.7 - q.y);
  float ring = 1.0 - 0.52 * smoothstep(-0.8, 3.6, roofIn) * (1.0 - smoothstep(19.2, 19.6, p.y));
  float wallIn = min(${CELLA_X.toFixed(2)} - q.x, ${CELLA_Z.toFixed(2)} - q.y);
  float porch = (0.2 + 0.24 * smoothstep(${DOOR_X.toFixed(2)}, ${CELLA_X.toFixed(2)}, q.x)) * smoothstep(14.5, ${DOOR_X.toFixed(2)}, q.x);
  float inside = smoothstep(0.0, 0.2, wallIn) * (1.0 - smoothstep(19.25, 19.5, p.y));
  return mix(ring, porch, inside);
}
// THE SHADE OF WHAT STANDS BEFORE THE BARRIER, in the door's daylight (uStand: each thing's x, z, half breadth and height over the floor):
// the open door is a broad, tall light (2.5 m to either side of the axis, 4.6 m up and down from its middle); a thing hides the share of
// it that it covers, sharply close behind it, softly further off. It lies on the floor behind the thing and climbs the barrier's face.
uniform vec4 uStand[2];
float zeusStands(vec3 p) {
  if (p.x > ${(BURNER.x + 0.6).toFixed(2)} || p.x < ${(BARRIER_X + 0.1).toFixed(2)} || abs(p.z) > 3.7 || p.y > ${(FLOOR + 1.3).toFixed(2)}) return 1.0;
  float k = 1.0; vec3 c = vec3(${DOOR_X.toFixed(2)}, ${(FLOOR + 4.6).toFixed(2)}, 0.0);
  for (int i = 0; i < 2; i++) {
    float t = (uStand[i].x - p.x) / (c.x - p.x);
    if (t > 0.0 && t < 1.0) {
      float lat = abs(p.z + t * (c.z - p.z) - uStand[i].y), yr = p.y + t * (c.y - p.y) - ${FLOOR.toFixed(2)}, w = 2.5 * t / (1.0 - t), wv = 4.6 * t / (1.0 - t), r = uStand[i].z;
      k *= 1.0 - 0.85 * clamp(r / max(w, 1e-3), 0.0, 1.0) * (1.0 - smoothstep(max(r - w, 0.0), r + w, lat)) * (1.0 - smoothstep(uStand[i].w - wv, uStand[i].w + wv, yr));
    }
  }
  return k;
}
vec3 zeusDoor(vec3 p, vec3 n) {
  float d = max(15.0 - p.x, 0.0), lat = max(abs(p.z) - 2.0, 0.0), up = max(p.y - 14.0, 0.0);
  float room = step(abs(p.z), ${ROOM_Z.toFixed(2)} + 0.1) * step(abs(p.x), 14.6) * step(p.y, 19.3);
  return uDoorCol * room * (0.12 + 0.88 * max(n.x, 0.0) + 0.22 * max(n.y, 0.0)) * 30.0 / (30.0 + d * d + 5.0 * lat * lat + 4.0 * up * up) * zeusStands(p);
}
// the sun lies as a strip down the porch's floor from the middle columns through the doorway: what stands beside it (the porch's columns, the
// door's leaves and its deep jambs) is lit warm from below by it
uniform vec3 uStripCol;
vec3 zeusStrip(vec3 p, vec3 n) {
  float along = smoothstep(${(ROOM_X - 0.3).toFixed(2)}, ${(ROOM_X + 0.3).toFixed(2)}, p.x) * (1.0 - smoothstep(30.4, 32.6, p.x));
  vec2 d = vec2(clamp(p.z, -1.3, 1.3) - p.z, ${PORCH_Y.toFixed(2)} - p.y); float dist = length(d);
  return uStripCol * along * max(dot(vec2(n.z, n.y), d / max(dist, 1e-3)), 0.0) * 2.4 / (2.4 + 0.3 * dist * dist);
}
// under the east porch's roof whatever faces east looks out between the columns at the low bright sky round the rising sun
uniform vec3 uEast;
vec3 zeusEast(vec3 p, vec3 n) {
  float k = smoothstep(${(DOOR_X - 0.3).toFixed(2)}, ${(DOOR_X + 0.1).toFixed(2)}, p.x) * (1.0 - smoothstep(${CELLA_X.toFixed(2)}, ${(CELLA_X + 1).toFixed(2)}, p.x)) * step(abs(p.z), ${CELLA_Z.toFixed(2)});
  return uEast * k * (0.45 + 0.4 * smoothstep(${DOOR_X.toFixed(2)}, ${CELLA_X.toFixed(2)}, p.x)) * max(n.x, 0.0);
}
// THE EAST END'S NOOKS (contact shade, by place): the air's light, and a share of the sun's, is less where a shaft of the east front or
// of the porch stands on its floor (uFoot: each shaft's foot x, y, z and its radius there), at the foot of the porch's walls, of the door
// wall and of the inner building's east ends, and on the floor beside them
uniform vec4 uFoot[8];
float zeusNook(vec3 p) {
  float az = abs(p.z);
  if (p.x < ${(DOOR_X - 0.2).toFixed(2)} || p.x > 33.2 || az > 14.9 || p.y < ${(STY - 0.25).toFixed(2)} || p.y > ${(STY + 4.5).toFixed(2)}) return 1.0;
  float k = 1.0;
  for (int i = 0; i < 8; i++) { float d = max(length(p.xz - uFoot[i].xz) - uFoot[i].w, 0.0), h = max(p.y - uFoot[i].y, 0.0); k *= 1.0 - 0.5 * exp(-(d / 0.3 + h / 0.45)); }
  float h = p.y - ${STY.toFixed(2)}, dw = length(max(vec2(p.x - ${CELLA_X.toFixed(2)}, az - ${CELLA_Z.toFixed(2)}), 0.0));
  if (az < ${ROOM_Z.toFixed(2)} + 0.02) {
    if (p.x > ${CELLA_X.toFixed(2)}) dw = length(vec2(p.x - ${CELLA_X.toFixed(2)}, ${ROOM_Z.toFixed(2)} - az));
    else { h = p.y - ${PORCH_Y.toFixed(2)}; dw = min(${ROOM_Z.toFixed(2)} - az, p.x - ${DOOR_X.toFixed(2)} + 9.0 * step(az, ${(DOOR_W / 2 + 0.25).toFixed(2)})); }
  }
  return k * (1.0 - 0.38 * exp(-(max(dw, 0.0) / 0.35 + max(h, 0.0) / 0.55)));
}
// in the east walk and the porch's mouth the sun lies on the floor between the columns: what stands over it takes a warm light from below
// (undersides most, upright faces near the floor a little), fading with height: higher up and further in the shade is the sky's, cooler and deeper
vec3 zeusWalk(vec3 p, vec3 n) {
  float k = smoothstep(${(CELLA_X - 1.2).toFixed(2)}, ${(CELLA_X + 0.4).toFixed(2)}, p.x) * (1.0 - smoothstep(32.3, 33.0, p.x)) * step(abs(p.z), 14.7), h = max(p.y - ${STY.toFixed(2)}, 0.0);
  return uStripCol * k * (0.3 * max(-n.y, 0.0) / (1.0 + 0.012 * h * h) + 0.22 * (1.0 - abs(n.y)) * exp(-h / 2.2));
}
// THE SUN'S BLADE lies on the room's floor from the great door to the barrier (its middle line by the sun's bearing: uBlade.x metres to
// the side per metre west of the east front's columns): what stands beside and before it takes a warm light from below, strongest low
// and near it. So the barrier's face is lit warm at its foot beside the gateway and cooler and deeper up and away from it.
uniform vec2 uBlade;
vec3 zeusBlade(vec3 p, vec3 n) {
  if (p.x < ${(BARRIER_X - 0.7).toFixed(2)} || p.x > ${(DOOR_X + 0.4).toFixed(2)} || abs(p.z) > ${(ROOM_Z + 0.1).toFixed(2)} || p.y > ${(FLOOR + 7).toFixed(2)}) return vec3(0.0);
  float qx = clamp(p.x + 1.6, ${(BARRIER_X + BARRIER_T + 0.3).toFixed(2)}, ${(DOOR_X - 0.3).toFixed(2)}), zc = -(${COLS_X[12].toFixed(2)} - qx) * uBlade.x;
  vec3 dq = vec3(qx, ${FLOOR.toFixed(2)}, clamp(p.z, zc - 1.2, zc + 1.2)) - p; float dist = length(dq);
  return uStripCol * uBlade.y * max(dot(n, dq / max(dist, 1e-3)), 0.0) * 2.0 / (2.0 + dist * dist);
}
// the six small lamps (xyz, w their breathing)
vec3 zeusLamps(vec3 p, vec3 n) {
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    vec3 dl = uLamp[i].xyz - p; float d2 = dot(dl, dl);
    sum += uLampCol * uLamp[i].w * (0.25 + 0.75 * max(dot(n, dl) / sqrt(max(d2, 1e-4)), 0.0)) / (0.35 + d2);
  }
  return sum;
}
`;

// ---------------------------------------------------------------- a plain standing figure: head, shoulders, arms, a garment, legs; no face
// h: height in metres; o.kind: 'tunic' (to the knee), 'cloak' (wrapped to the ankle) or 'nude' (a statue of an athlete);
// o.armR / o.armL: 0 hanging, 1 forward, 2 raised, 3 bent to the chest; o.lean: a small shift of the hips; colours linear.
function figureGeo(h, o) {
  const list = [], s = h / 1.7, skin = o.skin, cloth = o.cloth, k = o.lean || 0, far = !!o.far, plain = !!o.plain || far, LS = far ? 3 : plain ? 4 : 6;   // o.plain: a far figure, a quarter of the faces; o.far: a farther one (see WAY_FAR), half of those
  const ball = (r, c) => paint(new THREE.SphereGeometry(r, far ? 4 : plain ? 5 : 7, far ? 2 : plain ? 3 : 5), c);
  const cyl = (r0, r1, len, c, seg = 7) => paint(new THREE.CylinderGeometry(r1, r0, len, far ? Math.min(seg, 4) : plain ? Math.min(seg, 5) : seg, 1, true), c);
  const limb = (r0, r1, a, b, c) => {
    const d = new THREE.Vector3().subVectors(b, a), len = d.length(), g = cyl(r0, r1, len, c, LS);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    return g;
  };
  const v = (x, y, z) => new THREE.Vector3(x * s, y * s, z * s);
  // o.tags: each vertex also carries (which way it swings in a walk, the height it swings about, 1 where it is skin)
  // (o.mark, r5 C3: the mantle's parts, the roll across the chest, the left upper arm under it and its end behind, carry 2 there: the one drawn many times gives them a dye of their own; the roll then lies on the chest as the round make's does)
  let swing = 0, pivot = 0, mark = 0;
  const put = (...gs) => {
    for (const g of gs) {
      if (o.tags) { const cl = g.attributes.color, n = cl.count, a = new Float32Array(n * 3), isSkin = mark || (Math.abs(cl.getX(0) - skin.r) + Math.abs(cl.getY(0) - skin.g) + Math.abs(cl.getZ(0) - skin.b) < 1e-4 ? 1 : 0); for (let i = 0; i < n; i++) { a[i * 3] = swing; a[i * 3 + 1] = pivot * s; a[i * 3 + 2] = isSkin; } g.setAttribute('aLimb', new THREE.BufferAttribute(a, 3)); }
      list.push(g);
    }
  };
  // legs (the weight on one: the free knee a little forward)
  const hipY = 0.9, kneeY = 0.48;
  for (const sd of [-1, 1]) {
    swing = sd; pivot = hipY;
    const fx = sd * k > 0 ? 0.07 : 0;
    put(limb(0.07 * s, 0.06 * s, v(fx * 0.6, 0.06, sd * 0.09), v(fx, kneeY, sd * 0.09), o.kind === 'cloak' ? cloth : skin), limb(0.085 * s, 0.07 * s, v(fx, kneeY, sd * 0.09), v(k * 0.03, hipY, sd * 0.09), o.kind === 'nude' ? skin : cloth));
    if (!far) put(paint(new THREE.BoxGeometry(0.2 * s, 0.07 * s, 0.09 * s).translate((fx * 0.6 + 0.04) * s, 0.035 * s, sd * 0.09 * s), skin));
  }
  // trunk: hips to shoulders, the garment over it
  swing = 0; pivot = 0;
  put(cyl(0.15 * s, 0.17 * s, 0.56 * s, o.kind === 'nude' ? skin : cloth, 9).scale(0.72, 1, 1.12).translate(k * 0.02 * s, 1.17 * s, 0));
  if (o.kind === 'tunic') put(cyl(0.24 * s, 0.16 * s, 0.5 * s, cloth, 10).scale(0.8, 1, 1.05).translate(k * 0.02 * s, 0.72 * s, 0));
  if (o.kind === 'cloak') { put(cyl(0.26 * s, 0.17 * s, 1.02 * s, cloth, 10).scale(0.82, 1, 1.05).translate(k * 0.02 * s, 0.56 * s, 0)); mark = o.mark ? 2 : 0; put(o.mark ? limb(0.07 * s, 0.05 * s, v(0.11, 0.97, 0.17), v(0.05, 1.43, -0.17), cloth) : limb(0.07 * s, 0.05 * s, v(0.02, 0.95, 0.2), v(-0.04, 1.44, -0.16), cloth), cyl(0.1 * s, 0.06 * s, 0.86 * s, cloth, 5).scale(0.42, 1, 1).translate(-0.15 * s, 1.0 * s, -0.15 * s)); mark = 0; }
  // shoulders, neck, head
  put(paint(new THREE.SphereGeometry(0.12 * s, far ? 4 : plain ? 5 : 6, far ? 2 : plain ? 3 : 4), o.kind === 'nude' ? skin : cloth).scale(0.8, 0.5, 1.75).translate(0, 1.42 * s, 0));
  if (!far) put(cyl(0.05 * s, 0.045 * s, 0.1 * s, skin).translate(0, 1.5 * s, 0));
  put(ball(0.105 * s, o.hair || skin).scale(1, 1.15, 0.92).translate(0.01 * s, 1.61 * s, 0));
  // arms by their gesture
  const arm = (sd, mode) => {
    swing = -sd; pivot = 1.4;
    const sh = v(0, 1.4, sd * 0.2);
    let el, hd;
    if (mode === 1) { el = v(0.1, 1.16, sd * 0.24); hd = v(0.36, 1.2, sd * 0.2); }
    else if (mode === 2) { el = v(0.06, 1.56, sd * 0.3); hd = v(0.12, 1.84, sd * 0.26); }
    else if (mode === 3) { el = v(0.03, 1.13, sd * 0.25); hd = v(0.2, 1.24, sd * 0.07); }
    else { el = v(-0.01, 1.13, sd * 0.25); hd = v(0.04, 0.86, sd * 0.24); }
    const c = o.kind === 'cloak' && mode !== 2 ? cloth : skin;
    mark = o.mark && sd < 0 && c === cloth && o.kind === 'cloak' ? 2 : 0;   // (o.mark: the mantle lies over the left upper arm)
    put(limb(0.05 * s, 0.042 * s, sh, el, o.kind === 'nude' ? skin : c)); mark = 0; put(limb(0.042 * s, 0.035 * s, el, hd, skin));
    if (!plain) put(paint(new THREE.SphereGeometry(0.045 * s, 4, 3).translate(hd.x, hd.y, hd.z), skin));
  };
  arm(1, o.armR || 0); arm(-1, o.armL || 0);
  // o.gift: what the forward right hand holds: 1 a wreath, 2 an olive branch, 3 a shallow dish (o.giftCol: its colour)
  if (o.gift) {
    swing = 0; pivot = 0; const gc = o.giftCol || cloth, hx = 0.4 * s, hy = 1.22 * s, hz = 0.2 * s;
    if (o.gift === 1) put(paint(new THREE.TorusGeometry(0.11 * s, 0.022 * s, 4, 9).rotateY(Math.PI / 2).translate(hx, hy - 0.1 * s, hz), gc));
    else if (o.gift === 2) put(paint(new THREE.CylinderGeometry(0.008 * s, 0.012 * s, 0.6 * s, 4).rotateZ(-0.5).translate(hx + 0.12 * s, hy + 0.2 * s, hz), gc), paint(new THREE.ConeGeometry(0.09 * s, 0.4 * s, 5).rotateZ(-0.5).translate(hx + 0.2 * s, hy + 0.36 * s, hz), gc));
    else put(paint(new THREE.CylinderGeometry(0.13 * s, 0.07 * s, 0.05 * s, 8).translate(hx, hy + 0.04 * s, hz), gc));
  }
  return merged(list);
}

// ---------------------------------------------------------------- a figure for the close view (the people beside the way in; the statues
// are statueGeo's): the same kinds, gestures and measures as figureGeo, modelled in the round: legs with thigh, knee, calf and ankle, the
// weight on one and the other knee forward; a trunk with hips, waist and chest; shoulders, neck, a head under its mass of hair (no face);
// hands and feet; a tunic belted and falling in folds to the knee, or a long garment in folds to the ankle with a mantle rolled across
// the body to the left shoulder, its end hanging behind. o.mantle: the mantle's colour; o.staff: a staff in the right hand (its colour);
// o.wreath: a wreath on the head (its colour); o.gift as figureGeo's; o.join: each arm one tube through its elbow (r5 C1).
function fineFigureGeo(h, o) {
  const list = [], s = h / 1.7, skin = o.skin, cloth = o.cloth, hair = o.hair || skin, mantle = o.mantle || cloth, k = o.lean || 0, kind = o.kind;
  const P = (x, y, z) => new THREE.Vector3(x * s, y * s, z * s);
  // a tube of rings through the centres cs: round (radius rs[i]) and square to its line, or (level) oval and level ([half depth, half
  // breadth], its centres from the lowest up), in folds if fold = [how many, their depth at each ring as a share of the radius];
  // low: closed underneath
  const tube = (cs, rs, sides, col, level, fold, low) => {
    const n = cs.length, pos = [], idx = [], d = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const c = cs[i];
      if (!level) { d.subVectors(cs[Math.min(i + 1, n - 1)], cs[Math.max(i - 1, 0)]).normalize(); u.set(0, 0, 1).cross(d); if (u.lengthSq() < 1e-6) u.set(1, 0, 0).cross(d); u.normalize(); w.crossVectors(u, d); }
      for (let j = 0; j < sides; j++) {
        const a = j / sides * 6.2832, ca = Math.cos(a), sa = Math.sin(a), m = fold ? 1 + fold[1][i] * Math.cos(fold[0] * a + 0.7) : 1;
        if (level) pos.push(c.x + ca * rs[i][0] * s * m, c.y, c.z + sa * rs[i][1] * s * m);
        else pos.push(c.x + (u.x * ca + w.x * sa) * rs[i] * s, c.y + (u.y * ca + w.y * sa) * rs[i] * s, c.z + (u.z * ca + w.z * sa) * rs[i] * s);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, b = i * sides + (j + 1) % sides; idx.push(a, a + sides, b, b, a + sides, b + sides); }
    if (low) { const c0 = pos.length / 3; pos.push(cs[0].x, cs[0].y, cs[0].z); for (let j = 0; j < sides; j++) idx.push(c0, j, (j + 1) % sides); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
    g.setIndex(idx); g.computeVertexNormals();
    return paint(g, col);
  };
  const ball = (r, sx, sy, sz, at, col, ws = 8, hs = 6) => paint(new THREE.SphereGeometry(r * s, ws, hs).scale(sx, sy, sz).translate(at.x, at.y, at.z), col);
  const mid = (a, b, t) => a.clone().lerp(b, t);
  // the weight is on one leg (the side away from k), the hips swung over it, the shoulders a little back the other way
  const hz = -k * 0.022, nz = k * 0.008;
  for (const sd of [-1, 1]) {
    const free = sd * k > 0, fx = free ? 0.075 : 0, z0 = sd * 0.088 + hz, zf = sd * (free ? 0.118 : 0.086) + hz * 0.4;
    if (kind !== 'cloak') list.push(tube([P(fx * 0.55 - 0.005, 0.075, zf), P(fx * 0.7 - 0.014, 0.22, zf), P(fx * 0.85 - 0.022, 0.37, lerp(zf, z0, 0.3)), P(fx, 0.49, lerp(zf, z0, 0.5)), P(fx * 0.7 + 0.006, 0.64, lerp(zf, z0, 0.75)), P(fx * 0.35 + 0.006, 0.8, z0), P(0, 0.93, z0)], [0.036, 0.044, 0.059, 0.053, 0.071, 0.086, 0.088], 8, skin));
    list.push(paint(new THREE.SphereGeometry(s, 7, 5).scale(0.122, 0.044, 0.05).rotateY(-sd * (free ? 0.34 : 0.18)).translate((fx * 0.55 + 0.055) * s, 0.044 * s, zf * s), skin));
  }
  if (kind === 'nude') list.push(tube([P(0, 0.84, hz), P(0, 0.93, hz), P(0, 1.03, hz * 0.5), P(0, 1.15, 0), P(0.004, 1.27, nz), P(0, 1.37, nz), P(0, 1.445, nz)], [[0.096, 0.15], [0.108, 0.158], [0.09, 0.13], [0.104, 0.15], [0.122, 0.172], [0.1, 0.19], [0.06, 0.085]], 12, skin, true));
  if (kind === 'tunic') list.push(tube([0.53, 0.68, 0.84, 0.97, 1.035, 1.1, 1.25, 1.375, 1.44].map((y) => P(0, y, y < 1 ? hz : nz)), [[0.172, 0.215], [0.156, 0.2], [0.136, 0.18], [0.116, 0.158], [0.1, 0.14], [0.126, 0.17], [0.126, 0.186], [0.106, 0.206], [0.07, 0.12]], 18, cloth, true, [9, [0.1, 0.085, 0.06, 0.03, 0, 0.035, 0.012, 0, 0]], true));
  if (kind === 'cloak') {
    list.push(tube([0.085, 0.3, 0.6, 0.88, 1.05, 1.24, 1.375, 1.44].map((y) => P(0, y, y < 1 ? hz : nz)), [[0.165, 0.205], [0.142, 0.182], [0.135, 0.176], [0.138, 0.186], [0.128, 0.176], [0.134, 0.19], [0.108, 0.206], [0.07, 0.12]], 20, cloth, true, [10, [0.11, 0.09, 0.065, 0.04, 0.025, 0.015, 0, 0]], true));
    // the mantle: rolled from the right hip across the body to the left shoulder and over it; its end hangs down behind
    list.push(tube([P(0.02, 0.95, 0.19 + hz), P(0.118, 1.03, 0.1), P(0.152, 1.16, -0.02), P(0.104, 1.32, -0.13), P(0, 1.45, -0.19), P(-0.1, 1.37, -0.17), P(-0.137, 1.16, -0.15)], [0.04, 0.05, 0.056, 0.055, 0.05, 0.045, 0.04], 7, mantle));
    list.push(tube([0.6, 0.8, 0.98, 1.17].map((y) => P(-0.14, y, -0.15)), [[0.036, 0.105], [0.03, 0.088], [0.03, 0.07], [0.036, 0.05]], 8, mantle, true, [4, [0.2, 0.2, 0.15, 0]], true));
  }
  // neck, head, the hair as one mass over the crown and the back of the head
  list.push(tube([P(0, 1.43, nz), P(0.012, 1.54, nz)], [0.05, 0.044], 8, skin));
  list.push(ball(0.105, 1, 1.17, 0.9, P(0.015, 1.615, nz), skin, 9, 7));
  list.push(paint(new THREE.SphereGeometry(0.113 * s, 9, 5, 0, 6.2832, 0, 1.85).rotateZ(0.5).scale(1.02, 1.1, 0.97).translate(0.008 * s, 1.63 * s, nz * s), hair));
  // shoulders and arms by their gesture
  const arm = (sd, mode) => {
    const sh = P(0, 1.39, sd * 0.2 + nz); let el, hd;
    if (mode === 1) { el = P(0.1, 1.16, sd * 0.24 + nz); hd = P(0.36, 1.2, sd * 0.2 + nz); }
    else if (mode === 2) { el = P(0.06, 1.56, sd * 0.3 + nz); hd = P(0.12, 1.84, sd * 0.26 + nz); }
    else if (mode === 3) { el = P(0.03, 1.13, sd * 0.25 + nz); hd = P(0.2, 1.24, sd * 0.07 + nz); }
    else { el = P(-0.01, 1.13, sd * 0.25 + nz); hd = P(0.045, 0.87, sd * 0.235 + nz); }
    const wrapped = kind === 'cloak' && sd < 0 && mode !== 2;   // the mantle lies over the left arm
    list.push(ball(0.064, 0.95, 0.8, 1.05, P(0, 1.385, sd * 0.196 + nz), kind === 'nude' ? skin : wrapped ? mantle : cloth, 7, 5));
    // (o.join, r5 C1: the upper arm and the forearm are one tube through the elbow, its ring there on the bend's middle line and as much wider as the bend takes from it: no slit of light at the elbow)
    if (o.join) { const bend = Math.max(Math.cos(el.clone().sub(sh).angleTo(hd.clone().sub(el)) / 2), 0.62); list.push(tube([sh, mid(sh, el, 0.5), el, mid(el, hd, 0.35), hd], [0.052, 0.049, 0.04 / bend, 0.041, 0.029], 7, wrapped ? mantle : skin)); }
    else list.push(tube([sh, mid(sh, el, 0.5), el], [0.052, 0.049, 0.04], 7, wrapped ? mantle : skin), tube([el, mid(el, hd, 0.35), hd], [0.04, 0.041, 0.029], 7, wrapped ? mantle : skin));
    const dir = hd.clone().sub(el).normalize();
    list.push(ball(0.043, 1.3, 0.75, 0.85, hd.clone().addScaledVector(dir, 0.035 * s), skin, 6, 4));
    return hd;
  };
  const handR = arm(1, o.armR || 0); arm(-1, o.armL || 0);
  if (o.staff) list.push(paint(new THREE.CylinderGeometry(0.014 * s, 0.017 * s, 1.72 * s, 5).translate(handR.x + 0.03 * s, 0.86 * s, handR.z), o.staff));
  if (o.wreath) list.push(paint(new THREE.TorusGeometry(0.103 * s, 0.017 * s, 4, 10).rotateX(Math.PI / 2).rotateZ(0.22).translate(0.012 * s, 1.675 * s, nz * s), o.wreath));
  if (o.gift) {
    const gc = o.giftCol || cloth, hx = 0.4 * s, hy = 1.22 * s, hzz = (0.2 + nz) * s;
    if (o.gift === 1) list.push(paint(new THREE.TorusGeometry(0.11 * s, 0.022 * s, 4, 9).rotateY(Math.PI / 2).translate(hx, hy - 0.1 * s, hzz), gc));
    else if (o.gift === 2) list.push(paint(new THREE.CylinderGeometry(0.008 * s, 0.012 * s, 0.6 * s, 4).rotateZ(-0.5).translate(hx + 0.12 * s, hy + 0.2 * s, hzz), gc), paint(new THREE.ConeGeometry(0.09 * s, 0.4 * s, 5).rotateZ(-0.5).translate(hx + 0.2 * s, hy + 0.36 * s, hzz), gc));
    else list.push(paint(new THREE.CylinderGeometry(0.13 * s, 0.07 * s, 0.05 * s, 8).translate(hx, hy + 0.04 * s, hzz), gc));
  }
  return merged(list);
}

// ---------------------------------------------------------------- THE STATUES' ONE MAKE: a carved figure of one of eight kinds, at one of four
// finenesses (lv 0 the near make, 1 the middle, 2 the far, 3 the farthest: see WAY_CLOSE, WAY_MID, WAY_FAR. They are no longer one
// figure with fewer faces: since r5 step 4 the near make has heads and limbs of its own, so A KIND IS TWO FIGURES BY HOW NEAR THE
// WAY IT STANDS: within WAY_CLOSE kind 3 is bearded and kinds 2 and 4 wear no band, beyond it they are beardless and banded; and
// kind 6's mantle is on the near and middle makes alone). Height 1.75 m over its feet (the boy less), facing +x, inside 0.42 m of
// its upright axis and under 1.95 m (the clear air's own cylinder in the deal). THE EIGHT KINDS ARE OURS (the research names no
// kinds of statue): 0 one who binds the band round his head, 1 one with
// a palm branch, 2 one with a discus at his side, 3 one who scrapes himself, 4 a jumper with his weights, 5 a boy with his hand raised
// to his wreath, 6 a man in a long robe belted at the waist with a palm branch (r5 step 5: he was a charioteer), 7 a draped man,
// bearded, his cloak's folds falling to a hem over the feet.
// THE HEAD is a sculptor's blocking: skull, the hair as a mass of short locks with a hairline, a band or a wreath, the brow's ledge, the
// nose's ridge, the eye hollows (no eyeballs), cheeks, one soft fold for the mouth, chin and jaw, ears as low forms, a neck that widens
// to the shoulders; each kind's head turned or bowed its own way (THE HEADS ARE OURS: the research says nothing of the statues'
// heads; a face's planes, no eyeball, no worked lips, no likeness). THE BODY: shoulders broader than the hips, chest and belly as forms,
// the weight on one leg, the other knee eased and the hips tilted, elbow, wrist, a hand with a thumb. Nothing is lettered.
// It carries for each vertex aPaint (0 the body, 1 hair, 2 band or wreath, 3 a garment, 4 a garment's border, 5 the thing held) and
// aHollow (0 to 1: how deep in a hollow it lies); statueTint turns these into its colours. The near and middle makes also carry THE
// BODY'S OWN COORDINATES on the bare trunk, the bare legs and the bare arms (aBody: which part (1 the trunk, 2 a leg, 3 an arm; 0 none:
// a garment, the head, a hand, a thing held, and all of the far makes), the cosine and the sine of how far round the part (0: its front;
// a leg's sine grows to its inner side; an arm's 0 is the inside of the elbow's bend), how far up it (the trunk and a leg: metres over
// the feet at the figure's own scale; an arm: 0 the shoulder, 1 the elbow, 2 the wrist)): the statues' material draws the body's forms
// from them by the light (zbForm). Where an arm or a thigh comes out of the bare trunk its normals are carried over from the trunk's,
// so that the shoulder's cap and the hip flow into the trunk under the light and no ball reads at the joint (no vertex moves).
const STATUE_KINDS = 8, STATUE_WREATH = [1, 5, 7];   // (the kinds that wear a wreath; the others a band, but kinds 2 and 4 in the near make, which wear none: r5 step 4)
// r5 step 1: THE ROOM BOUGHT FIRST. The middle, the far and the farthest makes are THINNED (the near make is as it was): see the head.
// Every thinned figure stands in a thin(was, now) below, marked "r5 step 1"; with R5_STEP1 false those three makes are live's (r4t)
// to the bit, kind 6's but for step 5 (which is no switch); the near make is live's only with R5_STEP4 false.
const R5_STEP1 = true;
// r5 step 4: THE NEAR MAKE'S FORMS (lv 0 alone; the other makes, every statue's place, kind, tone and size are as they were; no ring
// and no triangle is added: the same rings stand at other places). THE SHOULDER: the trunk ends narrower under the neck, the arm's joint
// stands nearer the body and lower, and two of the arm's rings shape the shoulder's cap (the ring half way down the forearm, which
// lay on the straight line from elbow to wrist, is the second of them), so that from the front the outline falls from the neck over
// the cap into the arm with no shelf and no corner. THE LIMBS SWELL: the rings of thigh, calf, upper arm and forearm are ovals, deeper
// than broad, and stand off the limb's line where the muscle lies (the thigh forward and outward, the calf back and inward, the
// forearm's mass by the elbow). THREE HEADS BY KIND (OURS; planes only: no eyeball, no worked lips, no likeness): the VICTOR'S (kinds 0, 1, 5, 6: full hair that the
// band or wreath presses in), A YOUTH'S (kinds 2 and 4: short hair close to the skull, low over the brow and cropped at the nape,
// a narrower jaw, NO BAND), A BEARDED MAN'S (kinds 3 and 7: a higher brow, a heavier brow ledge, the hair long over the nape, a full
// beard that hangs under the chin). The near make alone is changed: so kind 3 is bearded, and kinds 2 and 4 are bandless, within
// WAY_CLOSE of the line only (see the head). IN SHADE: see R5_AIR. R5_STEP4 false: the near make is as it was, to the bit (kind 6's but for step 5).
const R5_STEP4 = true;
// r5 step 5: THE ROBED MAN WITH THE PALM (kind 6; he was the robed charioteer) is OURS. Step 5 is no longer a switch: the
// charioteer's branch is out of this file (r5 A4). The six choices that described the earlier kind (a charioteer standing alone; a
// long robe belted high; upright folds like flutes below the belt; short sleeves; a forearm held out to the reins; a victor's
// band round the hair) answered, all six, to one surviving kind of work. TWO are changed so that the kind answers to no one work:
// for the high belt the robe is belted AT THE WAIST in every make, and a MANTLE lies over the left shoulder and upper arm on the
// near and middle makes (r5 A3); for the forearm held to the reins both arms are LOWERED in every make, and the right hand holds a
// palm: a FROND on the near and middle makes (r5 A3), one blade on the far make, none on the farthest. Four are kept. A palm in a
// victor's right hand is the lead's own knowledge of ancient custom, not in this world's research.
// r5 step 4, FORMS THAT STILL READ IN SHADE (the near make alone; a rule of the surface's own turn and of the sun's bearing, which the
// seed deals; nothing of the lens or the clock): the air's light is not the same from all sides at sunrise: the half of the sky where
// the sun stands is the brighter. What of a near statue faces the sun's bearing takes R5_AIR.side more of the air's light, what faces
// away as much less (its mean is as it was: no light is added), and a furrow of the body's forms takes R5_AIR.furrow less of it (it
// sees less sky). In the sun the sun's own light rules as before; in shade the forms now turn from light to dark across the body.
const R5_AIR = { side: 0.34, furrow: 0.24 };
function statueGeo(kind, lv) {
  const parts = [], V = (x, y, z) => new THREE.Vector3(x, y, z), G = (x, s) => Math.exp(-(x * x) / (s * s)), sst = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
  const pick = (a) => a[lv], thin = (was, now) => (R5_STEP1 ? now : was);   // r5 step 1
  const near4 = R5_STEP4 && lv === 0, N4 = near4 ? 4 : 0;   // r5 step 4 (N4: the near make's mark in aBody's first figure, see R5_AIR)
  // a skin over rings: ring i has its points at pt(i, j) for column j (cols columns, closed round); paint: a class or (i, j) => class;
  // lo / hi: closed with a fan to that point
  const loft = (n, cols, pt, paint, lo, hi, body) => {
    const pos = [], idx = [], pc = [], bd = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < cols; j++) { const p = pt(i, j), q = body && lv < 2 ? body(i, j) : null; pos.push(p.x, p.y, p.z); pc.push(typeof paint === 'function' ? paint(i, j) : paint); if (q) bd.push(q[0] + N4, q[1], q[2], q[3]); else bd.push(N4, 0, 0, 0); }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < cols; j++) { const a = i * cols + j, b = i * cols + (j + 1) % cols; idx.push(a, a + cols, b, b, a + cols, b + cols); }
    if (lo) { const c = pos.length / 3; pos.push(lo.x, lo.y, lo.z); pc.push(pc[0]); bd.push(bd[0], 0, 0, bd[3]); for (let j = 0; j < cols; j++) idx.push(c, j, (j + 1) % cols); }
    if (hi) { const c = pos.length / 3, o = (n - 1) * cols; pos.push(hi.x, hi.y, hi.z); pc.push(pc[o]); bd.push(bd[o * 4], 0, 0, bd[o * 4 + 3]); for (let j = 0; j < cols; j++) idx.push(c, o + (j + 1) % cols, o + j); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // how deep in a hollow: where its neighbours on the skin stand out over it along its own normal
    const nor = g.attributes.normal.array, hol = new Float32Array(pos.length / 3);
    for (let i = 0; i < n; i++) for (let j = 0; j < cols; j++) {
      const a = i * cols + j, nb = [i * cols + (j + 1) % cols, i * cols + (j + cols - 1) % cols]; if (i > 0) nb.push(a - cols); if (i < n - 1) nb.push(a + cols);
      let c = 0, e = 0; for (const b of nb) { const dx = pos[b * 3] - pos[a * 3], dy = pos[b * 3 + 1] - pos[a * 3 + 1], dz = pos[b * 3 + 2] - pos[a * 3 + 2]; c += dx * nor[a * 3] + dy * nor[a * 3 + 1] + dz * nor[a * 3 + 2]; e += Math.hypot(dx, dy, dz); }
      hol[a] = Math.min(Math.max(c / Math.max(e, 1e-6) * 2.4, 0), 1);
    }
    g.setAttribute('aPaint', new THREE.Float32BufferAttribute(pc, 1)); g.setAttribute('aHollow', new THREE.BufferAttribute(hol, 1)); g.setAttribute('aBody', new THREE.Float32BufferAttribute(bd, 4));
    parts.push(g); return g;
  };
  // a round or oval limb through the points cs (radii rs: a number, or [across, along its own breadth axis ax]), sides round
  const limb = (cs, rs, sides, paint, o = {}) => {
    const n = cs.length, d = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3(), fr = [];
    for (let i = 0; i < n; i++) {
      d.subVectors(cs[Math.min(i + 1, n - 1)], cs[Math.max(i - 1, 0)]).normalize(); u.copy(o.ax || V(0, 0, 1)).cross(d); if (u.lengthSq() < 1e-6) u.set(1, 0, 0).cross(d); u.normalize(); w.crossVectors(u, d);
      fr.push([u.clone(), w.clone(), d.clone()]);
    }
    const g = loft(n, sides, (i, j) => { const a = j / sides * 6.2832 + (o.turn || 0), r = rs[i], ru = r.length ? r[0] : r, rw = r.length ? r[1] : r; return cs[i].clone().addScaledVector(fr[i][0], Math.cos(a) * ru).addScaledVector(fr[i][1], Math.sin(a) * rw); }, paint, o.lo ? cs[0] : null, o.hi ? cs[n - 1] : null,
      o.body ? (i, j) => { const a = j / sides * 6.2832 + (o.turn || 0), B = o.body, dd = fr[i][2], dir = fr[i][0].clone().multiplyScalar(Math.cos(a)).addScaledVector(fr[i][1], Math.sin(a)), F = B.F.clone().addScaledVector(dd, -B.F.dot(dd)).normalize(), sv = new THREE.Vector3().crossVectors(dd, F); return [B.part, dir.dot(F), dir.dot(sv) * B.flip, B.up[i]]; } : null);
    if (o.blend) g.userData.blend = o.blend;
    return g;
  };
  const K = [
    // lean: the free leg's side; head: [turned, bowed, tilted] in radians; band: 1 a band, 2 a wreath
    { lean: 1, head: [0.22, 0.2, 0.05], band: 1 }, { lean: -1, head: [-0.3, 0.02, -0.04], band: 2 }, { lean: 1, head: [-0.35, 0.26, -0.06], band: 1 }, { lean: 1, head: [-0.12, 0.34, 0], band: 1 },
    { lean: -1, head: [0.16, -0.05, 0.03], band: 1 }, { lean: -1, head: [0.2, 0.16, 0.1], band: 2 }, { lean: 1, head: [0.28, 0.02, 0], band: 1 }, { lean: 1, head: [-0.24, 0.06, -0.03], band: 2, beard: 1 },
  ][kind], k = K.lean, boy = kind === 5;
  // r5 step 4: the near make's head by kind: 0 the victor's, 1 a youth's (no band), 2 a bearded man's (-1: the head as it was)
  const hd = near4 ? [0, 0, 1, 2, 1, 0, 0, 2][kind] : -1;
  if (hd === 1) K.band = 0; if (hd === 2) K.beard = 1;
  // ---- the head: rows from under the chin to the crown [height (-1 to 1), middle x, front, back, half breadth]
  const HEAD = [[-1, 0.042, 0.04, 0.042, 0.036], [-0.9, 0.034, 0.064, 0.056, 0.054], [-0.74, 0.025, 0.074, 0.07, 0.064], [-0.58, 0.02, 0.08, 0.085, 0.07], [-0.44, 0.015, 0.084, 0.095, 0.074], [-0.3, 0.012, 0.086, 0.102, 0.077], [-0.12, 0.01, 0.087, 0.107, 0.08],
    [0.03, 0.008, 0.088, 0.11, 0.081], [0.16, 0.008, 0.092, 0.111, 0.082], [0.32, 0.006, 0.092, 0.111, 0.082], [0.46, 0.004, 0.09, 0.109, 0.08], [0.62, 0, 0.084, 0.104, 0.076], [0.78, -0.004, 0.07, 0.092, 0.066], [0.92, -0.008, 0.044, 0.062, 0.044], [1, -0.01, 0.012, 0.016, 0.012]];
  const HAIRLINE = [[[0, 0.37], [0.75, 0.34], [1.3, 0.08], [1.62, 0.18], [1.95, -0.1], [2.3, -0.5], [3.2, -0.56]], [[0, 0.27], [0.5, 0.31], [0.95, 0.25], [1.3, 0.1], [1.62, 0.2], [1.95, -0.04], [2.3, -0.38], [3.2, -0.42]], [[0, 0.45], [0.75, 0.4], [1.3, 0.05], [1.62, 0.13], [1.95, -0.22], [2.3, -0.7], [3.2, -0.8]]];   // (r5 step 4: a youth's, a bearded man's)
  const HH = 0.124, hairLine = (aa) => { const T = HAIRLINE[Math.max(hd, 0)]; for (let i = 1; i < T.length; i++) if (aa <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (aa - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return -0.56; };
  const hairAt = (a, yh) => sst(-0.05, 0.06, yh - hairLine(Math.abs(a)));
  const beardAt = (a, yh) => (K.beard ? sst(0.02, 0.14, -0.5 - yh + 0.58 * G(Math.abs(a) - 1.7, 0.42)) * sst(2.1, 1.7, Math.abs(a)) * (1 - G(a, 0.34) * G(yh + 0.57, 0.07)) : 0);
  const headPt = (a, yh, out = 0) => {
    let i = 1; while (i < HEAD.length - 1 && HEAD[i][0] < yh) i++;
    const A = HEAD[i - 1], B = HEAD[i], t = Math.min(Math.max((yh - A[0]) / (B[0] - A[0]), 0), 1), L = (q) => A[q] + (B[q] - A[q]) * t, c = Math.cos(a), sn = Math.sin(a), aa = Math.abs(a);
    const nose = yh < -0.46 ? 0 : yh < -0.32 ? (yh + 0.46) / 0.14 : yh < 0.06 ? 1 - 0.72 * (yh + 0.32) / 0.38 : Math.max(0.28 - (yh - 0.06) * 2.2, 0);
    const hair = hairAt(a, yh), beard = beardAt(a, yh);
    if (hd >= 0) {
      // r5 step 4: the three heads (see the head of statueGeo): each its own mass of hair, brow, cheek and jaw; the bearded man's chin hangs lower
      const lock = ((Math.sin(a * 12.9898 + yh * 78.233) * 43758.5453) % 1 + 1) % 1 - 0.5, by = 0.6 - 0.3 * (1 - c) / 2;
      let d = 0.03 * G(a, 0.17) * nose * (hd === 2 ? 1.12 : hd === 1 ? 0.92 : 1) + (hd === 2 ? 0.014 : hd === 1 ? 0.007 : 0.009) * G(yh - 0.15, 0.085) * G(a, 1.0) - (hd === 2 ? 0.015 : 0.013) * G(aa - 0.5, 0.22) * G(yh - 0.02, 0.09)
        + (hd === 1 ? 0.009 : 0.005) * G(aa - 0.78, hd === 1 ? 0.42 : 0.35) * G(yh + (hd === 1 ? 0.28 : 0.2), hd === 1 ? 0.26 : 0.2) + (hd === 2 ? 0.004 * G(aa - 0.85, 0.3) * G(yh + 0.04, 0.11) : 0)
        + 0.005 * G(a, 0.36) * G(yh + 0.58, 0.11) - 0.008 * G(a, 0.42) * G(yh + 0.585, 0.035) + (hd === 1 ? 0.005 : 0.008) * G(a, 0.42) * G(yh + 0.88, 0.1) + 0.012 * G(aa - 1.75, 0.15) * G(yh + 0.08, 0.2) * (1 - hair)
        - (hd === 1 ? 0.007 * G(aa - 1.25, 0.45) * sst(-0.35, -0.85, yh) * (1 - hair) : 0) + out;
      if (hd === 0) d += hair * ((0.019 + 0.017 * lock + 0.004 * Math.sin(a * 5 + yh * 6)) * (1 - 0.62 * G(yh - by, 0.1)) + 0.007 * G(yh - by - 0.24, 0.11) * sst(1.9, 1.1, aa) + 0.006 * sst(1.9, 2.5, aa) * G(yh + 0.3, 0.2));
      else if (hd === 1) d += hair * (0.0075 + 0.006 * lock + 0.0035 * G(a, 0.5) * G(yh - 0.3, 0.07));
      else d += hair * (0.02 + 0.017 * lock + 0.004 * Math.sin(a * 5 + yh * 6) + 0.012 * sst(1.9, 2.6, aa) * G(yh + 0.52, 0.2)) + beard * (0.019 + 0.008 * lock + 0.005 * Math.sin(a * 7 + yh * 11)) + 0.006 * G(aa - 0.24, 0.17) * G(yh + 0.5, 0.045);
      const drop = hd === 2 ? 0.3 * sst(-0.6, -1, yh) * sst(1.9, 0.6, aa) : 0, wide = hd === 1 ? 1.03 : hd === 2 ? 0.985 : 1;
      return V(L(1) + c * ((c > 0 ? L(2) : L(3)) + d) + (hd === 2 ? 0.012 * sst(-0.6, -1, yh) * sst(1.2, 0.3, aa) : 0), (yh - drop) * HH, sn * (L(4) * wide + d));
    }
    let d = 0.03 * G(a, 0.17) * nose + 0.009 * G(yh - 0.15, 0.085) * G(a, 1.0) - 0.013 * G(aa - 0.5, 0.22) * G(yh - 0.02, 0.09) + 0.005 * G(aa - 0.78, 0.35) * G(yh + 0.2, 0.2)
      + 0.005 * G(a, 0.36) * G(yh + 0.58, 0.11) - 0.008 * G(a, 0.42) * G(yh + 0.585, 0.035) + 0.008 * G(a, 0.42) * G(yh + 0.88, 0.1) + 0.012 * G(aa - 1.75, 0.15) * G(yh + 0.08, 0.2) * (1 - hair)
      + hair * (0.014 + 0.015 * (((Math.sin(a * 12.9898 + yh * 78.233) * 43758.5453) % 1 + 1) % 1 - 0.5) + 0.004 * Math.sin(a * 5 + yh * 6)) + beard * (0.012 + 0.003 * Math.sin(a * 6 + yh * 9)) + out;
    return V(L(1) + c * ((c > 0 ? L(2) : L(3)) + d), yh * HH, sn * (L(4) + d));
  };
  const hs = boy ? 1.07 : 1, HM = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(K.head[2], -K.head[0], -K.head[1], 'YZX')), HC = V(0.014, 1.62, k * 0.008), HP = V(-0.012, -0.1, 0);
  // a point of the head put in its place: turned about the top of the neck
  const hp = (p) => p.sub(HP).multiplyScalar(hs).applyMatrix4(HM).add(HP).add(HC);
  {
    const half = pick([[0.16, 0.34, 0.55, 0.8, 1.1, 1.45, 1.85, 2.4], thin([0.24, 0.62, 1.3, 2.2], [0.62, 1.3, 2.2]), null, null]), cols = half ? [0, ...half, Math.PI, ...half.slice().reverse().map((x) => -x)] : pick([0, 0, thin([0, 1.05, 2.1, 3.14, -2.1, -1.05], [0, 1.2, 2.5, -2.5, -1.2]), [0.785, 2.356, -2.356, -0.785]]);   // r5 step 1
    const rows = pick([[-1, -0.9, -0.74, -0.58, -0.44, -0.3, -0.12, 0.03, 0.16, 0.28, 0.4, 0.58, 0.78, 0.92], thin([-0.95, -0.7, -0.4, -0.02, 0.16, 0.46, 0.8], [-0.95, -0.4, -0.02, 0.16, 0.46, 0.8]), thin([-0.9, -0.4, 0.1, 0.55, 0.9], [-0.9, -0.36, 0.3, 0.86]), thin([-0.85, 0, 0.8], [-0.62, 0.52])]);   // r5 step 1
    loft(rows.length, cols.length, (i, j) => hp(headPt(cols[j], rows[i])), (i, j) => (hairAt(cols[j], rows[i]) > 0.5 || beardAt(cols[j], rows[i]) > 0.5 ? 1 : 0), hp(V(0.03, -1.02 * HH, 0)), hp(V(-0.01, 1.0 * HH + 0.014, 0)));
    // the victor's band (a ribbon round the hair, lower behind, its two ends hanging at the nape) or a wreath of leaves
    const bandY = (a) => 0.6 - 0.3 * (1 - Math.cos(a)) / 2;
    if (K.band === 1 && lv < 2) {
      const n = pick([14, 6]);
      loft(3, n, (i, j) => { const a = j / n * 6.2832; return hp(headPt(a, bandY(a) + (i - 1) * 0.085, i === 1 ? 0.0055 : 0.001)); }, 2);
      if (lv === 0) for (const sd of [-1, 1]) limb([hp(headPt(3.14 + sd * 0.12, bandY(3.14), 0.004)), hp(headPt(3.14 + sd * 0.2, -0.1, 0.012)), hp(headPt(3.14 + sd * 0.3, -0.5, 0.03))], [[0.003, 0.009], [0.003, 0.009], [0.003, 0.011]], 3, 2, { hi: true });
    }
    if (K.band === 2 && lv < 2) {
      const n = pick([12, 6]);
      loft(4, n, (i, j) => { const a = (j + (i % 2) * 0.5) / n * 6.2832, by = bandY(a) * 0.9 + 0.04, tip = (i === 0 || i === 3) && (j + (i ? 1 : 0)) % 2 === 0; return hp(headPt(a, by + [-0.11, -0.025, 0.06, 0.15][i] + (tip ? (i ? 0.07 : -0.06) : 0), [0.003, 0.013, 0.014, 0.004][i] + (tip ? 0.012 : 0))); }, 2);
    }
  }
  // ---- the body. The weight is on one leg (the side away from k): the hips swung over it and tilted, the shoulders tilted back the other way
  const hz = -k * 0.022, nz = k * 0.008, draped = kind >= 6, mid = (a, b, t) => a.clone().lerp(b, t);
  const yT = (y, z) => y + z * (draped ? 0 : -0.085 * k * sst(1.12, 0.94, y) + 0.05 * k * sst(1.15, 1.33, y));
  const NECK = near4 ? [[1.43, 0.069, 0.085, 0.114, 0], [1.468, 0.055, 0.065, 0.07, 0], [1.51, 0.048, 0.052, 0.052, 0], [1.575, 0.045, 0.047, 0.047, 0]]   // (r5 step 4: the slope from the neck)
    : [[1.43, 0.068, 0.084, 0.14, 0], [1.465, 0.054, 0.064, 0.078, 0], [1.51, 0.048, 0.052, 0.052, 0], [1.575, 0.045, 0.047, 0.047, 0]];
  // r5 step 4: a trunk's or a robe's row at the shoulders' height ends where the arm's cap begins (it stood out over the arm as a shelf)
  const sh4 = (T) => (near4 ? T.map((q) => (q[0] > 1.38 && q[0] < 1.4 ? [q[0] + 0.003, q[1] + 0.001, q[2], q[4] === undefined ? 0.178 : 0.182, ...q.slice(4)] : q)) : T);
  // a trunk or a robe: level rows [height, front, back, half breadth, depth of its folds], cols round; folds: how many; twist: how far the
  // columns wind round with height (the folds then fall slanting); feat: the forms of an athlete's trunk
  const trunk = (rows, cols, paint, o = {}) => { const g0 = loft(rows.length, cols, (i, j) => {
    const R = rows[i], y = R[0], a = j / cols * 6.2832 + (o.twist ? o.twist(y) : 0), c = Math.cos(a), sn = Math.sin(a), aa = Math.abs(Math.atan2(sn, c)), F = sst(0, 0.5, c), B = sst(0, 0.5, -c);
    let d = 0;
    if (o.feat && y < 1.45) d = 0.016 * F * G(aa - 0.62, 0.42) * sst(1.2, 1.24, y) * sst(1.4, 1.3, y) - 0.009 * G(aa, 0.15) * sst(0.96, 1.02, y) * sst(1.38, 1.32, y) - 0.01 * sst(1.5, 1.2, aa) * G(y - 0.86 - 0.14 * sst(0.2, 1.3, aa), 0.03) + 0.006 * F * G(y - 1.1, 0.07) * G(aa - 0.3, 0.3) - 0.005 * F * G(y - 1.2, 0.02) * G(aa - 0.55, 0.5)
      - 0.008 * G(aa - 3.1416, 0.14) * sst(0.94, 1.0, y) * sst(1.42, 1.36, y) + 0.012 * B * G(aa - 2.55, 0.42) * G(y - 0.9, 0.065) - 0.009 * G(aa - 3.1416, 0.1) * G(y - 0.87, 0.07) + 0.006 * B * G(aa - 2.5, 0.4) * G(y - 1.3, 0.06);
    const m = 1 + (o.folds ? R[4] * Math.cos(o.folds * (j / cols * 6.2832)) * (0.75 + 0.25 * Math.cos(3 * a + 1)) : 0), zc = (o.z || 0) + (y < 1 ? hz : y > 1.15 ? nz : hz + (nz - hz) * (y - 1) / 0.15), xc = (o.x || 0) + (y > 1.45 ? (y - 1.45) * 0.1 : 0);
    const z = zc + sn * (R[3] + d) * m; return V(xc + c * ((c > 0 ? R[1] : R[2]) + d) * m, yT(y, z - zc), z);
  }, paint, o.lo ? V(o.x || 0, rows[0][0] - (o.lo === 1 ? 0.02 : 0), hz + (o.z || 0)) : null, o.hi ? V(o.x || 0, rows[rows.length - 1][0], o.z || 0) : null, o.feat ? (i, j) => { const a = j / cols * 6.2832; return [1, Math.cos(a), Math.sin(a), rows[i][0]]; } : null);
    // (a garment's folds are cut in flat faces where o.flat says so: each fold has its lit side, its floor and its shaded side)
    if (o.folds && o.flat) { const g = g0.toNonIndexed(); g.computeVertexNormals(); g.setIndex(Array.from({ length: g.attributes.position.count }, (_, i) => i)); parts[parts.indexOf(g0)] = g; g0.dispose(); return g; }
    return g0; };
  const sub = (rows, sets) => (sets[lv] ? sets[lv].map((i) => rows[i]) : rows);
  let TR = null;   // (the bare trunk)
  if (!draped) {
    const T = [[0.815, 0.05, 0.066, 0.075], [0.86, 0.088, 0.104, 0.15], [0.93, 0.097, 0.114, 0.158], [1.0, 0.093, 0.1, 0.146], [1.06, 0.09, 0.088, 0.134], [1.13, 0.095, 0.09, 0.143], [1.195, 0.103, 0.096, 0.157], [1.235, 0.109, 0.1, 0.166], [1.275, 0.115, 0.104, 0.176], [1.33, 0.113, 0.108, 0.194], [1.385, 0.092, 0.1, 0.21], ...NECK];
    TR = trunk(sub(sh4(T), [null, [0, 2, 4, 7, 10, 11, 14], thin([0, 3, 8, 10, 14], [0, 3, 10, 14]), thin([2, 4, 10, 14], [2, 10, 14])]), pick([12, thin(10, 8), 6, 4]), 0, { feat: lv < 2, lo: 1 });   // r5 step 1
  }
  // legs: ankle, calf, knee, thigh; the free leg's knee eased forward, its foot set out to the side (trail: drawn back, the heel off the ground)
  const feet = [];
  for (const sd of [-1, 1]) {
    const free = sd * k > 0, trail = free && (kind === 0 || kind === 2 || kind === 5), kx = free ? 0.075 : 0, ax = free ? (trail ? -0.09 : 0.036) : -0.005, ay = trail ? 0.115 : 0.075, z0 = sd * 0.088 + hz, zf = sd * (free ? (trail ? 0.13 : 0.118) : 0.086) + hz * 0.4, L = (a, b, t) => a + (b - a) * t;
    feet.push([sd, ax, zf, trail ? 0.3 : 0, sd * (free ? 0.36 : 0.18)]);
    if (draped) continue;
    const P = [V(ax, ay, zf), V(L(ax, kx, 0.3) - 0.012, ay + 0.13, zf), V(L(ax, kx, 0.62) - 0.02, L(ay, 0.5, 0.62), L(zf, z0, 0.3)), V(kx - 0.006, 0.445, L(zf, z0, 0.45)), V(kx + 0.009, 0.5, L(zf, z0, 0.5)), V(kx * 0.7 + 0.006, 0.62, L(zf, z0, 0.75)), V(kx * 0.35 + 0.006, 0.76, z0), V(0, 0.9, sd * 0.07 + hz)];
    // (r5 step 4, the near make: ovals [front to back, side to side], the calf's mass behind the shin, the thigh's before the bone)
    if (near4) [-0.001, -0.004, -0.013, -0.003, 0.004, 0.005, 0.007, 0].forEach((dx, i) => { P[i].x += dx; });
    const R = near4 ? [[0.037, 0.031], [0.043, 0.036], [0.066, 0.056], [0.048, 0.046], [0.054, 0.052], [0.068, 0.061], [0.087, 0.078], [0.076, 0.07]] : [0.035, 0.041, 0.058, 0.048, 0.055, 0.066, 0.08, 0.072], pk = pick([null, [0, 2, 4, 7], [0, 3, 7], [0, 7]]), PP = pk ? pk.map((i) => P[i]) : P, g = limb(PP, pk ? pk.map((i) => R[i]) : R, pick([8, 6, 4, 3]), 0, lv < 2 ? { body: { part: 2, F: V(1, 0, 0), flip: sd, up: PP.map((p) => p.y) }, blend: lv === 0 ? PP.map((p) => sst(0.66, 0.88, p.y)) : null } : {});
    // between the thighs is a hollow
    { const p = g.attributes.position, h = g.attributes.aHollow; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.55 && sd * (p.getZ(i) - z0) < -0.02) h.setX(i, Math.min(1, h.getX(i) + 0.55 * sst(0.55, 0.75, p.getY(i)))); }
  }
  if (lv < 2) for (const [sd, ax, zf, pitch, ang] of feet) {
    const f = V(Math.cos(ang), 0, Math.sin(ang)), sv = V(-Math.sin(ang), 0, Math.cos(ang)), FT = sub([[-0.05, 0.022, 0.024, 0.03], [-0.01, 0.045, 0.034, 0.048], [0.06, 0.028, 0.041, 0.03], [0.125, 0.015, 0.042, 0.017], [0.165, 0.008, 0.032, 0.01]], [null, [1, 4], null, null]), n = pick([5, 3, 3, 3]);
    const at = (t, y, w) => V(ax, 0, zf).addScaledVector(f, t + 0.01).addScaledVector(sv, w).setY(y + Math.max(0.125 - t, 0) * pitch);
    loft(FT.length, n, (i, j) => { const a = j / n * 6.2832 + 0.5236, R = FT[i], sn = Math.sin(a); return at(R[0], R[3] + (sn > 0 ? sn : sn * 0.6) * R[1], Math.cos(a) * R[2]); }, 0, at(FT[0][0] - 0.004, FT[0][3], 0), at(FT[FT.length - 1][0] + 0.004, FT[FT.length - 1][3], 0));
  }
  // arms: shoulder, elbow E, wrist W; o.cloth: wrapped to the wrist (2) or sleeved to the elbow (1); a hand (curl 0 open to 1 closed) with a thumb
  const arm = (sd, E, W, o = {}) => {
    const J = near4 ? V(0, 1.348, sd * 0.178 + nz) : V(0, 1.36, sd * 0.192 + nz); J.y = yT(J.y, J.z); const up = E.clone().sub(J).normalize(), fat = o.cloth ? 1.18 : 1, pc = o.cloth === 2 ? 3 : o.cloth === 1 ? (i) => (i <= (lv === 0 ? 2 : lv === 1 ? 1 : 0) ? 3 : 0) : 0;
    const P = [V(0.004, J.y + 0.004, sd * 0.13 + nz), J.clone().addScaledVector(up, 0.035), mid(J, E, 0.5), mid(J, E, 0.86), E, mid(E, W, 0.3), mid(E, W, 0.7), W], R = [0.045, 0.06 * fat, 0.049 * fat, 0.042 * fat, 0.039 * (o.cloth === 2 ? fat : 1), 0.044 * (o.cloth === 2 ? fat : 1), 0.035 * (o.cloth === 2 ? fat : 1), 0.027];
    const pk = pick([[0, 1, 2, 4, 5, 6, 7], [0, 1, 4, 5, 7], [1, 4, 7], o.straight ? thin([1, 4, 7], [1, 7]) : [1, 4, 7]]);   // r5 step 1
    if (near4) {
      // r5 step 4: the near make's seven rings: within the trunk, the shoulder's cap (two), the upper arm's swell, the elbow, the
      // forearm's swell by the elbow, the wrist; ovals [front to back, across]
      const f2 = o.cloth === 2 ? fat : 1, P4 = [V(0.004, J.y + 0.02, sd * 0.114 + nz), J.clone().addScaledVector(up, 0.031), J.clone().addScaledVector(up, 0.082), mid(J, E, 0.56), E, mid(E, W, 0.27), W];
      if (!o.cloth) P4[3].x += 0.005;
      const R4 = [[0.055, 0.048], [0.06 * fat, 0.047 * fat], [0.063 * fat, 0.056 * fat], [0.056 * fat, 0.047 * fat], [0.041 * f2, 0.037 * f2], [0.047 * f2, 0.041 * f2], [0.03, 0.024]];
      limb(P4, R4, 7, typeof pc === 'function' ? (i) => (i <= 3 ? 3 : 0) : pc, !o.cloth ? { body: { part: 3, F: J.clone().sub(E).normalize().add(W.clone().sub(E).normalize()).add(V(0.3, 0, 0)).normalize(), flip: sd, up: [0, 0.06, 0.3, 0.56, 1, 1.27, 2] }, blend: [1, 0.8, 0.35, 0, 0, 0, 0] } : {});
    } else
    limb(pk ? pk.map((i) => P[i]) : P, pk ? pk.map((i) => R[i]) : R, pick([7, thin(5, 4), thin(4, 3), 3]) /* r5 step 1 */, typeof pc === 'function' ? (i) => pc(i) : pc,
      lv < 2 && !o.cloth ? { body: { part: 3, F: J.clone().sub(E).normalize().add(W.clone().sub(E).normalize()).add(V(0.3, 0, 0)).normalize(), flip: sd, up: pk.map((i) => [0, 0.1, 0.5, 0.86, 1, 1.3, 1.7, 2][i]) }, blend: pk.map((i) => [1, lv ? 0.7 : 0.85, 0, 0, 0, 0, 0, 0][i]) } : {});
    const dH = (o.to ? o.to.clone().sub(W) : W.clone().sub(E)).normalize(); let pn = o.palm ? o.palm.clone() : V(0, 0, -sd); pn.addScaledVector(dH, -pn.dot(dH)); if (pn.lengthSq() < 0.01) pn.set(0, -1, 0).addScaledVector(dH, dH.y); pn.normalize();
    const tb = new THREE.Vector3().crossVectors(dH, pn).multiplyScalar(sd), c = o.curl ?? 0.25, dir = (q) => dH.clone().multiplyScalar(Math.cos(q)).addScaledVector(pn, Math.sin(q));
    const p1 = W.clone().addScaledVector(dH, 0.045), p2 = p1.clone().addScaledVector(dir(c * 0.9), 0.05), p3 = p2.clone().addScaledVector(dir(c * 2.3), 0.058);
    if (lv === 0) {
      limb([W.clone().addScaledVector(dH, -0.01), p1, p2, p3], [[0.027, 0.02], [0.04, 0.014], [0.038, 0.012], [0.025, 0.007]], 6, 0, { ax: pn, hi: true });
      limb([W.clone().addScaledVector(dH, 0.018).addScaledVector(tb, 0.02), W.clone().addScaledVector(dH, 0.05).addScaledVector(tb, 0.05).addScaledVector(pn, 0.012), W.clone().addScaledVector(dH, 0.085).addScaledVector(tb, 0.056).addScaledVector(pn, 0.024 + 0.02 * c)], [0.0115, 0.0098, 0.006], 4, 0, { hi: true });
    } else if (lv === 1) limb([W, p2, p3], [[0.03, 0.02], [0.038, 0.014], [0.024, 0.008]], 3, 0, { ax: pn, hi: true });
    return { W, dH, pn, tb, grip: p1.clone().addScaledVector(pn, 0.022) };
  };
  const hang = (sd, x = 0.04, back = -0.01) => arm(sd, V(back, 1.1, sd * 0.25 + nz), V(x, 0.865, sd * 0.238 + nz), { straight: true });   // (straight: r5 step 1)
  if (kind === 0) {
    // he binds the band: both hands at the back of his head, the elbows out and up
    const r = arm(1, V(0.1, 1.56, 0.33), V(-0.025, 1.71, 0.165), { to: V(-0.07, 1.7, 0.06), curl: 0.7 }), l = arm(-1, V(0.11, 1.53, -0.335), V(-0.005, 1.685, -0.17), { to: V(-0.06, 1.69, -0.06), curl: 0.7 });
    if (lv < 2) for (const h of [r, l]) limb([h.grip, mid(h.grip, hp(headPt(3.14, 0.3, 0.004)), 0.6), hp(headPt(3.14, 0.3, 0.004))], [[0.003, 0.009], [0.003, 0.009], [0.003, 0.009]], 3, 2);
  } else if (kind === 1) {
    // a palm branch upright in his left hand, leaning on the shoulder
    hang(1); const l = arm(-1, V(-0.02, 1.1, -0.25 + nz), V(0.19, 1.02, -0.215), { curl: 0.85 });
    const B = [V(0.235, 0.86, -0.2), V(0.2, 1.02, -0.2), V(0.1, 1.3, -0.225), V(0.035, 1.5, -0.245), V(-0.005, 1.66, -0.255), V(-0.005, 1.77, -0.255), V(0.03, 1.835, -0.25)];
    if (lv < 3) limb(B.slice(0, 4), [0.008, 0.008, 0.007, 0.006], pick([4, 3, 3]), 5, { lo: true });
    const at = (t) => { const q = 2 + t * 3.999, i = Math.floor(q); return mid(B[i], B[i + 1], q - i); };
    if (lv < 3) limb([0, 0.5, 1].map(at), [0.006, 0.005, 0.003], pick([4, 3, 3]), 5, { hi: true });
    // (each leaflet a thin blade from the rib out and up; at the far makes the frond is one blade)
    if (lv < 2) { const n = pick([7, 4]); for (let i = 0; i < n; i++) for (const sd of [-1, 1]) { const t = (i + 0.3) / n, a = at(t), b = at(Math.min(t + 0.9 / n, 1)), tip = mid(a, b, 0.5).add(V(0.012 * sd, 0.055, sd * (0.075 - 0.03 * t))); limb([a, mid(mid(a, b, 0.5), tip, 0.45), tip], [[0.004, 0.022], [0.003, 0.017], [0.001, 0.003]], 3, 5, { ax: V(1, 0, 0) }); } }
    else limb([0, 0.5, 1].map(at), [[0.006, 0.02], [0.006, 0.06], [0.004, 0.02]], 3, 5, { ax: V(1, 0, 0), hi: true, lo: true });
  } else if (kind === 2) {
    // the discus held at his left side against the thigh; the right forearm eased forward
    arm(1, V(-0.03, 1.1, 0.26 + nz), V(0.125, 0.94, 0.245), { curl: 0.15 }); hang(-1, 0.035);
    const n = pick([10, 8, 6, 4]), c = V(0.045, 0.765, -0.262 + nz); loft(2, n, (i, j) => { const a = -j / n * 6.2832; return V(c.x + Math.cos(a) * 0.105, c.y + Math.sin(a) * 0.105, c.z + (i ? 0.007 : -0.007)); }, 5, V(c.x, c.y, c.z - 0.016), V(c.x, c.y, c.z + 0.016));
  } else if (kind === 3) {
    // he scrapes himself: both hands low before him, the scraper in the right laid to the left wrist
    const r = arm(1, V(0.03, 1.12, 0.25 + nz), V(0.19, 1.175, 0.05), { curl: 0.8, palm: V(0, -1, 0) }); arm(-1, V(-0.01, 1.11, -0.25 + nz), V(0.2, 1.13, -0.1), { curl: 0.2, palm: V(0, 1, 0) });
    if (lv < 2) limb([r.grip.clone().add(V(0.01, 0.01, 0.045)), r.grip, r.grip.clone().add(V(0.0, -0.03, -0.07)), r.grip.clone().add(V(-0.03, -0.045, -0.14))], [[0.005, 0.005], [0.011, 0.003], [0.012, 0.003], [0.008, 0.003]], 4, 5, { ax: V(0, 1, 0), hi: true, lo: true });
  } else if (kind === 4) {
    // the jumper: a weight in each hand, the right forward, the left at his side
    const r = arm(1, V(0, 1.1, 0.25 + nz), V(0.2, 1.045, 0.2), { curl: 0.9, palm: V(0, -1, 0) }), l = arm(-1, V(-0.04, 1.1, -0.25 + nz), V(-0.02, 0.865, -0.25), { curl: 0.9 });
    if (lv < 3) for (const [h, d] of [[r, V(1, 0, 0)], [l, V(1, -0.15, 0)]]) { const c = h.grip.clone().addScaledVector(h.dH, 0.02); limb([-0.09, -0.04, 0.04, 0.09].map((t) => c.clone().addScaledVector(d, t).add(V(0, Math.abs(t) > 0.05 ? 0.012 : 0, 0))), [0.03, 0.02, 0.02, 0.03], pick([5, 4, 3]), 5, { hi: true, lo: true }); }
  } else if (kind === 5) {
    // the boy: his right hand raised to the wreath on his head
    arm(1, V(0.14, 1.53, 0.3), V(0.075, 1.725, 0.135), { to: V(0.03, 1.76, 0.03), curl: 0.5 }); hang(-1);
  } else if (kind === 6) {
    // r5 step 5 (ours: see the head): the long robe belted at the waist and bloused over the belt, in straight folds to the ankles;
    // short sleeves; both arms lowered; on the near and middle makes a mantle over the left shoulder and upper arm, falling before
    // the breast to the hip and behind to the knee's back (r5 A3: no narrow band, no border); a palm in the right hand, before the
    // arm and the shoulder (a frond on the near and middle makes, one blade on the far make, none on the farthest); the band round the hair
    const T = [[0.1, 0.114, 0.12, 0.152, 0.21], [0.4, 0.11, 0.116, 0.148, 0.21], [0.75, 0.112, 0.118, 0.153, 0.19], [0.96, 0.108, 0.112, 0.15, 0.1], [1.01, 0.1, 0.1, 0.142, 0.03], [1.035, 0.094, 0.094, 0.136, 0], [1.075, 0.096, 0.095, 0.138, 0], [1.1, 0.11, 0.101, 0.153, 0.06], [1.22, 0.119, 0.106, 0.172, 0.06], [1.34, 0.114, 0.108, 0.192, 0.03], [1.385, 0.092, 0.1, 0.208, 0], ...NECK];
    // (what the cloak and the palm cost is saved on the robe's own rows where it can be: the near make leaves two rows of the straight folds out, the middle one)
    const R = sub(sh4(lv === 0 ? T.filter((q) => q[0] !== 0.4 && q[0] !== 0.96) : T), [null, [0, 3, 5, 6, 8, 10, 11, 12, 14], [0, 2, 5, 8, 10, 12, 14], [0, 5, 9, 11, 14]]);
    const n = pick([24, 12, 6, 4]), o = { folds: pick([8, 6, 0, 0]) }, belt = R.findIndex((q) => q[0] > 1.03), up = R.slice(belt - 1);
    trunk(R.slice(0, belt), n, 3, { ...o, lo: 2, flat: true }); trunk(up, n, (i) => (up[i][0] > 1.45 ? 0 : up[i][0] > 1.03 && up[i][0] < 1.08 ? 4 : 3), o);
    arm(-1, V(-0.01, 1.1, -0.25 + nz), V(0.04, 0.865, -0.238 + nz), { cloth: 1, straight: true });
    const r = arm(1, V(-0.02, 1.1, 0.25 + nz), V(0.07, 0.9, 0.238 + nz), { cloth: 1, curl: 0.85, palm: V(1, 0, 0) });
    if (lv < 2) {
      // r5 A3, THE MANTLE (near and middle makes): rows from the front hem over the shoulder to the back hem [its middle x, y, z; to
      // its outer edge y, z; its outward side x, y, z; how far its edges fall back toward the body; its folds' depth]. Across a row
      // [where (1 the outer edge, -1 the edge by the neck), how high] the outer face stands in ridges and furrows (three folds on the
      // near make, two on the middle), cut in flat faces as the robe's folds are; the under face is one furrow; at a hem the ridges hang lower
      const MR = [[0.105, 0.9, -0.1, 0, -0.075, 1, 0, 0, 0.012, 0.045], [0.09, 1.12, -0.1, 0, -0.085, 1, 0, 0, 0.014, 0.045], [0.1, 1.3, -0.12, -0.012, -0.1, 0.96, 0.28, 0, 0.022, 0.042], [0.062, 1.388, -0.185, -0.085, -0.105, 0.62, 0.74, -0.26, 0.055, 0.038],
        [-0.004, 1.425, -0.19, -0.09, -0.105, 0, 0.9, -0.42, 0.065, 0.038], [-0.072, 1.385, -0.185, -0.085, -0.105, -0.66, 0.7, -0.26, 0.055, 0.038], [-0.09, 1.12, -0.11, 0, -0.095, -1, 0, 0, 0.016, 0.045], [-0.125, 0.5, -0.1, 0, -0.08, -1, 0, 0, 0.012, 0.045]];
      const rowsM = lv === 0 ? MR : [0, 2, 4, 7].map((i) => MR[i]), SC = lv === 0 ? [[1, 0.2], [0.72, 1], [0.4, 0.12], [0.08, 1], [-0.28, 0.12], [-0.62, 1], [-1, 0.2], [0, 0]] : [[1, 0.2], [0.45, 1], [-0.1, 0.1], [-0.6, 1], [-1, 0.2], [0, 0]];
      const mp = (i, sx, f) => { const q = rowsM[i], e = (q[9] * f - q[8] * sx * sx) / Math.hypot(q[5], q[6], q[7]); return V(q[0] + q[5] * e, q[1] + q[3] * sx + q[6] * e - (i === 0 || i === rowsM.length - 1 ? 0.05 * (f - 0.5) : 0), q[2] + q[4] * sx + q[7] * e); };
      const g0 = loft(rowsM.length, SC.length, (i, j) => mp(i, SC[j][0], SC[j][1]), 3, mp(0, 0, 0.5), mp(rowsM.length - 1, 0, 0.5)), g = g0.toNonIndexed();
      g.computeVertexNormals(); g.setIndex(Array.from({ length: g.attributes.position.count }, (_, i) => i)); parts[parts.indexOf(g0)] = g; g0.dispose();
    }
    // (the far make's one blade stands on the rib as it was; the near and middle makes' rib bows forward at its top)
    const B = (lv < 2 ? [[0.012, -0.15, 0], [0, 0, 0], [0, 0.22, 0.004], [-0.006, 0.44, 0.012], [0.002, 0.62, 0.02], [0.03, 0.77, 0.024], [0.085, 0.88, 0.022]] : [[0.012, -0.15, 0], [0, 0, 0], [0, 0.22, 0.012], [-0.006, 0.5, 0.03], [-0.014, 0.68, 0.045], [-0.018, 0.8, 0.05], [0.018, 0.87, 0.046]]).map((d) => r.grip.clone().add(V(d[0], d[1], d[2])));
    const at = (t) => { const q = 2 + t * 3.999, i = Math.floor(q); return mid(B[i], B[i + 1], q - i); };
    if (lv < 2) {
      // r5 A3, THE FROND (near and middle makes): the stalk through the hand, then ONE leaf on the bowed rib: rows up the rib, by turns
      // the rib alone and a pair of leaflets' tips (out to either side, swept upward along the rib and a little back; longer in the
      // middle of the frond), so that each leaflet is a blade from the rib to its tip and the whole reads as a leaf with a toothed edge
      limb([B[0], B[1], B[2]], [0.008, 0.008, 0.007], pick([4, 3]), 5, { lo: true });
      const nl = pick([6, 4]), along = (t) => at(Math.min(t + 0.02, 1)).sub(at(Math.max(t - 0.02, 0))).normalize();
      loft(2 * nl + 1, 4, (i, j) => { const t = i / (2 * nl), c = at(t), L = i % 2 ? 0.04 + 0.07 * Math.pow(Math.sin(Math.PI * t), 0.8) : 0.011;
        return j % 2 === 0 ? c.add(V(j ? -0.006 : 0.006, 0, 0)) : c.addScaledVector(along(t), i % 2 ? L + 0.03 : 0).add(V(i % 2 ? -0.2 * L : 0, 0, (j === 1 ? 1 : -1) * L)); }, 5, null, at(1).addScaledVector(along(1), 0.07));
    } else if (lv === 2) limb([B[1], at(0.3), at(1)], [[0.006, 0.008], [0.006, 0.06], [0.004, 0.02]], 3, 5, { ax: V(1, 0, 0), hi: true, lo: true });
  } else {
    // the draped man: wrapped in his cloak, its folds falling slanting from the left shoulder to a hem over the feet, a coloured border on
    // the hem and along the rolled edge that crosses the body; the right arm in the cloak's sling, the hand at the chest; an end hangs at the left
    const T = [[0.085, 0.128, 0.128, 0.168, 0.2], [0.135, 0.126, 0.127, 0.166, 0.2], [0.42, 0.116, 0.119, 0.156, 0.19], [0.8, 0.115, 0.119, 0.157, 0.17], [1.02, 0.113, 0.113, 0.154, 0.15], [1.15, 0.111, 0.107, 0.158, 0.12], [1.27, 0.117, 0.108, 0.176, 0.08], [1.34, 0.113, 0.108, 0.194, 0.05], [1.39, 0.093, 0.1, 0.208, 0.02], ...NECK];
    const R = sub(sh4(T), [null, [1, 2, 4, 6, 8, 9, 10, 12], [1, 3, 6, 8, 10, 12], [1, 5, 8, 10, 12]]), n = pick([24, 12, 6, 4]), o = { folds: pick([8, 6, 0, 0]), twist: (y) => -0.95 * sst(0.45, 1.35, y) };
    if (lv < 2) trunk(T.slice(0, 2), n, 4, { ...o, lo: 2, flat: true });
    const all = lv < 2 ? R : [T[0], ...R.slice(1)], cut = all.findIndex((q) => q[0] > 1.3), up = all.slice(cut - 1);
    trunk(all.slice(0, cut), n, 3, lv < 2 ? { ...o, flat: true } : { ...o, lo: 2 }); trunk(up, n, (i) => (up[i][0] > 1.45 ? 0 : 3), o);
    if (lv < 3) limb([V(0.03, 0.98, 0.17 + hz), V(0.125, 1.07, 0.085), V(0.146, 1.2, -0.03), V(0.105, 1.33, -0.135), V(0, 1.445, -0.19), V(-0.095, 1.37, -0.17), V(-0.13, 1.16, -0.145)].filter((q, i) => lv === 0 || i % 2 === 0), lv === 0 ? [0.036, 0.047, 0.052, 0.052, 0.048, 0.044, 0.038] : [0.04, 0.052, 0.048, 0.038], pick([7, 5, 4]), (i, j) => (j < pick([2, 1, 1]) ? 4 : 3), { turn: 2.2 });
    if (lv < 2) { const E = [[0.5, 0.02, 0.02, 0.066, 0.28], [0.545, 0.022, 0.022, 0.066, 0.28], [0.75, 0.022, 0.022, 0.058, 0.25], [0.93, 0.024, 0.024, 0.048, 0.15], [1.02, 0.03, 0.03, 0.04, 0]]; trunk(lv ? [E[1], E[3], E[4]] : E, pick([9, 6]), (i) => (i === 0 ? 4 : 3), { folds: 3, x: 0.03, z: -0.25 - hz, lo: 2, flat: true }); }
    arm(1, V(0.03, 1.12, 0.23 + nz), V(0.15, 1.265, 0.035), { cloth: 2, curl: 0.5, palm: V(-1, 0, 0) }); arm(-1, V(-0.02, 1.1, -0.25 + nz), V(0.1, 0.93, -0.235), { cloth: 2, curl: 0.6 });
  }
  // THE SHOULDER AND THE HIP: where an arm or a thigh comes out of the bare trunk, its normals are the trunk's own there (the nearest of
  // the trunk's, weighed by nearness), going over into the limb's own along it: the light then runs unbroken from chest and back over
  // the shoulder's cap into the upper arm, and from the hips into the thigh. No vertex moves.
  if (TR && lv < 2) {
    const tp = TR.attributes.position, tn = TR.attributes.normal;
    for (const q of parts) {
      const bw = q.userData.blend; if (!bw) continue;
      const p = q.attributes.position, nn = q.attributes.normal, sides = p.count / bw.length;
      for (let i = 0; i < p.count; i++) {
        const w0 = bw[Math.floor(i / sides)]; if (!(w0 > 0)) continue;
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i); let sx = 0, sy = 0, sz = 0;
        for (let k = 0; k < tp.count; k++) { const dx = tp.getX(k) - x, dy = tp.getY(k) - y, dz = tp.getZ(k) - z, e = dx * dx + dy * dy + dz * dz + 1e-5, f = 1 / (e * e); sx += tn.getX(k) * f; sy += tn.getY(k) * f; sz += tn.getZ(k) * f; }
        const l = Math.hypot(sx, sy, sz) || 1, ax = nn.getX(i) * (1 - w0) + sx / l * w0, ay = nn.getY(i) * (1 - w0) + sy / l * w0, az = nn.getZ(i) * (1 - w0) + sz / l * w0, m = Math.hypot(ax, ay, az) || 1;
        nn.setXYZ(i, ax / m, ay / m, az / m);
      }
    }
  }
  const g = mergeGeometries(parts, false); for (const q of parts) q.dispose();
  const sc = 1.75 / 1.7 * (boy ? 0.86 : 1); g.scale(sc, sc, sc);
  return g;
}
// THE STATUE'S COLOURS from its make. Marble takes its own tone, warm white, its hollows deeper, and THE PAINT OF THE AGE: the hair and the
// band or wreath coloured, a coloured border on a garment, the thing held in its own colour; lips and eyes are left plain. Bronze is its
// own dark brown all over (the hair a shade darker), with a little green in its hollows. pal: { tone, bronze, hair, band, border, held }.
// It leaves the geometry with color and aBronze (1 where bronze: the material gives that its sheen).
const VERDIGRIS = new THREE.Color('#5f8f74');
function statueTint(g, pal) {
  const n = g.attributes.position.count, pa = g.attributes.aPaint.array, ho = g.attributes.aHollow.array, col = new Float32Array(n * 3), br = new Float32Array(n), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const h = ho[i], p = pa[i];
    if (pal.bronze) { c.copy(pal.tone).lerp(VERDIGRIS, 0.5 * h).multiplyScalar((p === 1 ? 0.86 : 1) * (1 - 0.2 * h)); br[i] = 1; }
    else { c.copy(pal.tone); if (p === 1) c.lerp(pal.hair, 0.66); else if (p === 2) c.lerp(pal.band, 0.78); else if (p === 4) c.lerp(pal.border, 0.78); else if (p === 5) c.lerp(pal.held, 0.72); c.multiplyScalar(1 - 0.5 * h); c.b *= 1 - 0.08 * h; }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.deleteAttribute('aPaint'); g.deleteAttribute('aHollow'); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aBronze', new THREE.BufferAttribute(br, 1));
  return g;
}

// ---------------------------------------------------------------- the flight (the design's knots, eased): the line, the pace, the one look
// A pure function of the statue's places (the part's info): the line is the same on every visit.
// The sacred way runs from the long colonnade's gate to the ramp's foot.
const WAY = { x0: 55, z0: 0, x1: 148, z1: -6.5 };
const wayZ = (x) => WAY.z0 + (WAY.z1 - WAY.z0) * clamp((x - WAY.x0) / (WAY.x1 - WAY.x0), 0, 1);
// The stadium's road: the stadium lies behind the long colonnade, and the way from it comes into the grove by a gate north of the colonnade's
// end. From the gate the road runs straight toward the middle of the temple's east front (AIM), across the gate ground (ground m long, half m
// to either side) and bend m further; then it swings south in one curve and joins the sacred way where the cross way before the east front
// meets it. The curve leaves the straight along itself (out m) and comes into the sacred way along the way (inn m). air: no leaf nearer its middle.
const ROAD = { gx: 141.5, gz: -72, ground: 28, half: 10, bend: 20, join: CROSS_X, out: 24, inn: 30, air: 3.5 };
const AIM = { x: COLS_X[12], z: 0 };
const roadAt = (() => {
  const s0 = (AIM.z - ROAD.gz) / (ROAD.gx - AIM.x), c0 = 1 / Math.hypot(1, s0), wl = Math.hypot(WAY.x1 - WAY.x0, WAY.z1 - WAY.z0);
  const xe = ROAD.gx - ROAD.ground * c0, xa = xe - ROAD.bend * c0, za = ROAD.gz + (ROAD.gx - xa) * s0, zj = wayZ(ROAD.join);
  const bx = [xa, xa - ROAD.out * c0, ROAD.join + ROAD.inn * (WAY.x1 - WAY.x0) / wl, ROAD.join], bz = [za, za + ROAD.out * s0 * c0, zj + ROAD.inn * (WAY.z1 - WAY.z0) / wl, zj];
  const cub = (q, t) => { const u = 1 - t; return u * u * u * q[0] + 3 * u * u * t * q[1] + 3 * u * t * t * q[2] + t * t * t * q[3]; };
  // z of the road's middle at x: the straight east of the bend's head, the sacred way west of the join, the curve between (x falls all along it)
  const z = (x) => {
    if (x >= xa) return ROAD.gz + (ROAD.gx - x) * s0;
    if (x <= ROAD.join) return wayZ(x);
    let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (cub(bx, m) > x) lo = m; else hi = m; }
    return cub(bz, (lo + hi) / 2);
  };
  // the road's middle as a line of points from the gate to the join, for what is laid beside it
  const line = [[ROAD.gx, ROAD.gz], [xe, z(xe)]]; for (let i = 0; i <= 28; i++) line.push([cub(bx, i / 28), cub(bz, i / 28)]);
  const off = (x, zz) => { let m = 1e9; for (let i = 1; i < line.length; i++) { const [ax, az] = line[i - 1], [cx, cz] = line[i], dx = cx - ax, dz = cz - az, t = clamp(((x - ax) * dx + (zz - az) * dz) / (dx * dx + dz * dz), 0, 1); m = Math.min(m, Math.hypot(x - ax - dx * t, zz - az - dz * t)); } return m; };
  // how far a place lies from the gate ground's middle line (the road's first stretch, from the gate to xe)
  const offGround = (x, zz) => { const [ax, az] = line[0], [cx, cz] = line[1], dx = cx - ax, dz = cz - az, t = clamp(((x - ax) * dx + (zz - az) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - ax - dx * t, zz - az - dz * t); };
  return { z, xe, xa, s0, c0, line, off, offGround };
})();
const roadZ = roadAt.z;
// near the ways: within NEAR_WAY of the sacred way's middle east of the temple, of the stadium's road or of the way in's line (there stand the finer figures)
const NEAR_WAY = 10.2, nearWays = (x, z) => (x > 30 && Math.abs(z - wayZ(x)) < NEAR_WAY) || roadAt.off(x, z) < NEAR_WAY || wayGap(x, z, 0, 99) < NEAR_WAY;
// beaten earth [x0, z0, x1, z1, half width]: the sacred way, the cross way before the east front, the way to the ash altar, two ways across the grove
const WAYS = [[WAY.x0, WAY.z0, WAY.x1, WAY.z1, 4.6], [60, -110, 60, 70, 3.2], [60, -22, ALTAR.x + 6, ALTAR.z + 10, 2.6], [100, -3, 118, 62, 2.4], [96, -4, 84, -96, 2.4]];
const ROAD_HALF = 3.0;
const rampY = (x) => STY * clamp((55 - x) / 22.94, 0, 1);
// THE WAY IN, typed by things that always stand (the stadium's road and its gate ground, the ash altar, the cross way, the temple's north
// east corner, the ramp's foot). The lens comes in over the road at the gate ground's inner end, ENTRY.y up and along the road (toward
// the temple's front: the one wide first sight, the temple over the grove), level for the first WAY_IN.first m, and leaves the road at
// once to the right hand in one curve of radius WAY_IN.turn that ends DUE WEST; it goes DOWN at once, to WAY_IN.low over the grove's
// floor WAY_IN.down m from the entry, into the alley of the way's trees (THE WAY'S TREES below): wild olives on both hands, old planes
// behind them on the right, statues before them on both hands; the ash altar's cone and smoke ahead on the right between the planes'
// trunks, the temple on the left between the olives. WAY_IN.arc before the cross way's east half (x legX) it turns south in an arc of
// that radius, out of the trees, the temple's north east corner before it and the ash altar passing behind on the right hand, and flies
// DOWN THE CROSS WAY'S EAST HALF along the east front, down to WAY_IN.legLow at the leg's end; there it turns west in an arc whose
// radius is the leg's distance from the ramp's foot, and from the ramp's foot on the line is the old one.
const ENTRY = { x: roadAt.xe, y: 13 };
const LENS_OUT = 1.7, LENS_IN = 1.7;                  // head height: the lens over the ground at the ramp's foot, over the ramp and the porch's floor; over the room's floor at the great door
const WAY_IN = { first: 8, down: 30, low: 3.3, turn: 40, legX: CROSS_X + 2, arc: 14, legLow: 2.7, foot: 55 };
// the way in as a line of points [x, y, z, metres from the entry in plan]; the places on it: where it heads due west (west), the arc's
// first point (arc), the leg's first point (leg), the last turn's first point (bend), the ramp's foot (foot)
const wayIn = (() => {
  const E = [ENTRY.x, roadZ(ENTRY.x)], X = WAY_IN.legX, R = WAY_IN.arc, R2 = X - WAY_IN.foot, RT = WAY_IN.turn, th = Math.atan(roadAt.s0);
  const plan = [], put = (x, z) => plan.push([x, z]), run = (a, b, n, skip) => { for (let i = skip ? 1 : 0; i <= n; i++) put(lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)); };
  const at = {}, cx = E[0] - RT * Math.sin(th), cz = E[1] - RT * Math.cos(th), zw = cz + RT;
  for (let i = 0; i <= 5; i++) { const a = th * (1 - i / 5); put(cx + RT * Math.sin(a), cz + RT * Math.cos(a)); } at.west = plan.length - 1;
  run([cx, zw], [X + R, zw], 4, true); at.arc = plan.length - 1;
  for (let i = 1; i <= 5; i++) { const a = i / 5 * Math.PI / 2; put(X + R - R * Math.sin(a), zw + R - R * Math.cos(a)); } at.leg = plan.length - 1;
  run([X, zw + R], [X, -R2], 5, true); at.bend = plan.length - 1;
  for (let i = 1; i <= 4; i++) { const a = i / 4 * Math.PI / 2; put(WAY_IN.foot + R2 * Math.cos(a), -R2 + R2 * Math.sin(a)); } at.foot = plan.length - 1;
  let s = 0; const cum = plan.map((q, i) => (s += i ? Math.hypot(q[0] - plan[i - 1][0], q[1] - plan[i - 1][1]) : 0));
  const y = (m) => (m <= cum[at.leg] ? lerp(ENTRY.y, WAY_IN.low, smoothStep((m - WAY_IN.first) / (WAY_IN.down - WAY_IN.first)))
    : m <= cum[at.bend] ? lerp(WAY_IN.low, WAY_IN.legLow, smoothStep((m - cum[at.leg]) / (cum[at.bend] - cum[at.leg])))
      : lerp(WAY_IN.legLow, LENS_OUT, smoothStep((m - cum[at.bend]) / (cum[at.foot] - cum[at.bend]))));
  return { knots: plan.map((q, i) => [q[0], y(cum[i]), q[1], cum[i]]), at, cum, zw };
})();
// LENS_HIGH: the lens's height over the room's floor from the barrier to the pool (see DRESS): over the highest top of any still thing of the
// floor that stands within DRESS.near of the lens's line, in plan, between the barrier's east face and the pool's east edge
const LENS_HIGH = (() => {
  const line = []; for (let i = 0; i <= 64; i++) { const x = lerp(POOL.x1, BARRIER_X + BARRIER_T, i / 64); line.push([x, driftZ(x)]); }
  let top = 0;
  for (const [x0, z0, x1, z1, t] of FLOOR_THINGS) if (line.some(([x, z]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1)) < DRESS.near)) top = Math.max(top, t);
  return top + DRESS.under + DRESS.spare;
})();
// the lens rises to LENS_HIGH inside the room (where the grove is no longer drawn): from the door wall's inner face, by one even easing, to
// the place half the gateway's breadth before the barrier's east face (just east of the ends of its open leaves), and holds it to the
// pool's east edge
const X_HIGH = BARRIER_X + BARRIER_T + GATE_HALF;
// the room's knots stand at places of the room: the great door, the door wall's inner face, half way from it to the first lower columns,
// the first lower columns, X_HIGH, the barrier's east face, the middle of the closed floor (half way from the barrier to the pool's edge),
// the pair of lamps by the pool's east corners
const ROOM_KNOTS = [DOOR_X, ROOM_X, (ROOM_X + IN_X[0]) / 2, IN_X[0], X_HIGH, BARRIER_X + BARRIER_T, (BARRIER_X + POOL.x1) / 2, LAMP_AT[2][0]];
function makeRoute(info = {}) {
  const F = FLOOR, V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
  // the rise's line: from head height at the pool's east edge to the top of the rise. The lens holds LENS_HIGH as far as the pool's east
  // edge and goes up to that line from there (it is on it from the line's first knot on)
  const A0 = [POOL.x1 + 0.03, F + LENS_IN, DRIFT], B0 = [RISE_TOP.x, F + TOP_H, RISE_TOP.z];
  const onRise = (t) => [lerp(A0[0], B0[0], t), lerp(A0[1], B0[1], t), lerp(A0[2], B0[2], t)];
  const onLast = (t) => [lerp(B0[0], RING.x, t), F + TOP_H, lerp(B0[2], RING.z, t)];
  const ss = smoothStep;
  // in the room: the lens's height over the floor at a place east of the pool, and its knot there
  const inH = (x) => lerp(LENS_IN, LENS_HIGH, ss((ROOM_X - x) / (ROOM_X - X_HIGH))), room = (x) => [x, F + inH(x), driftZ(x)];
  // the way in (wayIn above): its last knot is the ramp's foot, where the lens is at head height on the temple's axis
  const path = makePath([
    ...wayIn.knots.map((q) => [q[0], q[1], q[2]]),
    [47, LENS_OUT + rampY(47), 0], [40, LENS_OUT + rampY(40), 0], [33.6, LENS_OUT + rampY(33.6), 0], [30.4, STY + LENS_OUT, 0],
    [26.5, STY + LENS_OUT + 0.03, 0], [22.5, PORCH_Y + LENS_OUT, 0], [19, F + LENS_IN - 0.08, 0], ...ROOM_KNOTS.map(room),
    room(A0[0]), onRise(0.13), onRise(0.3), onRise(0.5), onRise(0.7), onRise(0.86),
    [B0[0] + 0.25, B0[1] - 0.5, lerp(A0[2], B0[2], 0.97)], onLast(0.07), onLast(0.3), onLast(0.62), [RING.x, RING.y, RING.z],
  ]);
  const L = path.length;
  // metres flown at places of the world, found on the line itself (the line is single valued in x up to the top of the rise)
  // (the search halves on x between the entry and 0.985 of the route. The bound is a typed margin of no weight: every x sought, from the
  // ramp's foot (55) to the oil's east edge (3.57), is passed once and for good before it (the line's x is -3.66 there, and where x
  // rises at all, by 0.17 m on the cross way's leg, it stays over 61.9); any bound from there to the route's end gives the same places)
  const metresAtX = (x) => { let lo = 0, hi = L * 0.985; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (path.posAtDist(m, V1).x > x) lo = m; else hi = m; } return (lo + hi) / 2; };
  // glide: where the level stretch ends; cross: the cross way before the east front; ramp: the ramp's foot; top: the top step; porch: the porch's
  // front; door: the great door; room: the door wall's inner face; barrier; pool: the pool's east edge; oil: the oil's east edge (the rim's
  // inner face); riseEnd: the top of the rise
  // metres flown where the line passes a knot of the way in (the nearest place of the line to it, sought round the knot's own metres in plan)
  const metresAtKnot = (i) => { const q = wayIn.knots[i]; let best = 0, bd = 1e9; for (let m = Math.max(0, q[3] - 6); m <= q[3] + 10; m += 0.02) { const dd = path.posAtDist(m, V1).distanceToSquared(V2.set(q[0], q[1], q[2])); if (dd < bd) { bd = dd; best = m; } } return best; };
  // first: where the level first sight ends; west: where the line heads due west; down: where the lens is down in the alley; arc: where it
  // turns out of the trees; leg: where it is on the cross way's east half; bend: where it turns to the ramp's foot; ramp: the ramp's foot;
  const D = { first: WAY_IN.first, west: metresAtKnot(wayIn.at.west), down: WAY_IN.down, arc: metresAtKnot(wayIn.at.arc), leg: metresAtKnot(wayIn.at.leg), bend: metresAtKnot(wayIn.at.bend), ramp: metresAtX(55), top: metresAtX(32.06), porch: metresAtX(CELLA_X), door: metresAtX(DOOR_X), room: metresAtX(ROOM_X), barrier: metresAtX(BARRIER_X), pool: metresAtX(POOL.x1), oil: metresAtX(POOL.x1 - POOL.rimW) };
  const lastLen = Math.hypot(RING.x - B0[0], RING.z - B0[2]);
  D.riseEnd = L - lastLen;
  // pace, from place to place: quick over the grove, up the ramp and to the top step, a little slower through the porch, slow from the great
  // door on (more than half of the flight's seconds are spent beyond it), slowest from the barrier up the rise (the engine lets no stretch be slower than a seventh of the quickest: the rise is as
  // slow as the glide in allows), and quicker again into the ring: it gathers pace from where the lens is level with the ring's lowest
  // point (D.ringLow) to the place FACE_CLEAR from his face on the last straight (D.five)
  const pace = (u) => {
    const d = u * L;
    let p = lerp(PACE.grove, PACE.top, smoothstep(D.ramp, D.top, d));
    p = lerp(p, PACE.porch, smoothstep(D.top, D.porch, d));
    p = lerp(p, PACE.room, smoothstep(D.porch, D.door, d));
    p = lerp(p, PACE.rise, smoothstep(D.room, D.barrier, d));
    p = lerp(p, PACE.last, smoothstep(D.ringLow, D.five, d));
    return p;
  };
  // ONE look, sliding between named things at named places. Outside it is the east front (the beam's underside over its two middle
  // columns); up the ramp it goes down the aisle to the god's lap; from the porch's front to the lower columns that stand by the barrier
  // (D.cols) to his shins: his whole figure in the picture, the oil and the gold in it in the picture's lower part. There is no look down:
  // from where the lens is over the barrier (D.barrier) to the pool's east edge (D.pool, the foot of the rise) the look climbs his body,
  // evenly, from his shins to his face. Up the rise, from the pool's edge to where the lens is level with the gallery's floor (D.gallery),
  // it slides by one smooth step from his face to THE HOLD: the place that stands, seen from the lens, at the share LOOK_BOTH of the angle
  // from his face to the middle of the bay's mouth where the ring stands (half way: his head and the bay's mouth both in the picture).
  // The hold lasts to the top of the rise (D.riseEnd); from there to the place FACE_CLEAR from his face on the last straight (D.five) the
  // look turns on, evenly, to the middle of the bay's mouth (by then the engine has let it go onto the line ahead, the same place).
  const HW = (q, dflt) => { const v = q || dflt; return new THREE.Vector3(v[0] + BASE_X, v[1] + F, v[2]); };
  const P_FRONT = new THREE.Vector3(COLS_X[12], Y_BEAM, 0);
  const P_LAP = HW(info.lap, [-4.4, 7.0, 0]), P_CHEST = HW(info.chest, [-5.5, 9.6, 0]), P_FACE = HW(info.face, [-5.64, 12.1, 0]), P_KNEES = HW(info.knees, [-2.0, 6.3, 0]);
  // the footstool stands STOOL m high on the base, its middle STOOL_MID behind the base's front edge; the gold sandals rest on it
  const P_FEET = new THREE.Vector3(BASE_X - STOOL_MID, F + (info.baseTop ?? 1.09) + STOOL, 0);
  const P_SHINS = P_FEET.clone().lerp(P_KNEES, 0.5);
  const P_BAY = new THREE.Vector3(RING.x, RING.y, RING.z);
  const lastAt = (t, o) => o.set(lerp(B0[0], RING.x, t), F + TOP_H, lerp(B0[2], RING.z, t));
  { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (lastAt(m, V1).distanceTo(P_FACE) > FACE_CLEAR) lo = m; else hi = m; } D.five = D.riseEnd + lo * lastLen; }
  D.cols = metresAtX(IN_X[1]);
  // metres flown where the lens, on the rise, is level with a height of the world
  const metresAtY = (y) => { let lo = D.pool, hi = D.riseEnd; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (path.posAtDist(m, V1).y < y) lo = m; else hi = m; } return (lo + hi) / 2; };
  // where the lens comes level with the floor of the south gallery, in the mouth of whose bay the ring stands (the look's slide ends there);
  // where it comes level with the ring's own lowest point: from there it gathers pace
  D.gallery = metresAtY(F + GALLERY); D.ringLow = metresAtY(RING.y - RING.r);
  // where the bay's mouth opens to the lens: in plan, the distance of the bay's east upper column's axis from the straight line that runs
  // from the lens to the middle of the mouth (RING.x on the row's line IN_Z) is more than the column's lower radius. From there the ring is drawn
  { const mouthClear = (m) => { path.posAtDist(m, V1); const mx = RING.x - V1.x, mz = IN_Z - V1.z; return Math.abs(mz) * (IN_X[BAY] - RING.x) / Math.hypot(mx, mz) > UP_R; };
    let lo = D.top, hi = D.pool; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (mouthClear(m)) hi = m; else lo = m; } D.mouth = hi; }
  // an even rise from 0 to 1 with an eased share (LOOK_EASE of its way) at its start alone, and at both its ends
  const easeIn = (t) => { const a = LOOK_EASE; t = clamp(t, 0, 1); return (t < a ? t * t / (2 * a) : t - a / 2) / (1 - a / 2); };
  const easeBoth = (t) => { const a = LOOK_EASE; t = clamp(t, 0, 1); return t < a ? t * t / (2 * a * (1 - a)) : t > 1 - a ? 1 - (1 - t) * (1 - t) / (2 * a * (1 - a)) : (t - a / 2) / (1 - a); };
  const lookOut = new THREE.Vector3(), lookTmp = new THREE.Vector3(), lookA = new THREE.Vector3(), lookB = new THREE.Vector3(), lookC = new THREE.Vector3();
  // the point on the line from a to b that stands, seen from the lens, at the share s of the angle between them (the triangle lens, a, point: the law of sines)
  const onAngle = (lens, a, b, s, out) => {
    const la = lookA.subVectors(a, lens), ab = lookB.subVectors(b, a), ph = s * la.angleTo(lookC.subVectors(b, lens)), al = Math.PI - la.angleTo(ab);
    return out.copy(a).addScaledVector(ab, clamp(la.length() * Math.sin(ph) / (Math.sin(ph + al) * ab.length()), 0, 1));
  };
  // the gaze's lines where the climb begins (to his shins, from the lens over the barrier) and where it ends (to the hold, from the lens at
  // the pool's east edge), and the angle between them: the climb turns evenly from the one to the other
  const gazeAt = (d, p) => p.clone().sub(path.posAtDist(d, V1)).normalize();
  const gazeLow = gazeAt(D.barrier, P_SHINS), gazeFace = gazeAt(D.pool, P_FACE), climbAll = gazeLow.angleTo(gazeFace);
  // THE WAY IN'S LOOK, a law of places: the temple's north east corner column, 3 m over its foot, at the entry (the first sight: the temple
  // over the grove); over the LOOK_TURN m after the level first sight, as the lens goes down, it turns toward the way ahead (the line LOOK_AHEAD m on, its rise or
  // fall from the lens taken at the share LOOK_LEVEL: the gaze stays near level in the alley); from LOOK_LEAD before the arc's first
  // point (the two turns overlap: the gaze keeps well on the temple's side of the line all the way down and through the alley, the
  // temple whole in the picture's left half; it never swings round to due west and back, which an arrival through a ring at a great
  // carried speed flew at 49 degrees a second: it now turns at 27.9 at the most, see the count at the camera's spec)
  // to the arc's last, to the temple's north east corner column at half its height (the statues before the front stand whole under it); down the cross way's leg, to the east front
  // (the old look from the ramp's foot on)
  const P_CORNER = new THREE.Vector3(COLS_X[12], STY + 5.5, COLS_Z[0]), P_FIRST = new THREE.Vector3(COLS_X[12], STY + 3, COLS_Z[0]), lookWay = new THREE.Vector3();
  const lookAt = (time, u) => {
    const d = u * L, o = lookOut;
    o.copy(P_FRONT);
    if (d < D.ramp) {
      // the gaze's line turns from one of these to the next (their lines are blended, not their places: a far thing and a near one)
      path.posAtDist(d, lookTmp); path.posAtDist(d + LOOK_AHEAD, lookWay); lookWay.y = lookTmp.y + (lookWay.y - lookTmp.y) * LOOK_LEVEL;
      const g = lookA.copy(P_FIRST).sub(lookTmp).normalize();
      g.lerp(lookB.copy(lookWay).sub(lookTmp).normalize(), smoothstep(D.first, D.first + LOOK_TURN, d)).normalize();
      g.lerp(lookB.copy(P_CORNER).sub(lookTmp).normalize(), smoothstep(D.arc - LOOK_LEAD, D.leg, d)).normalize();
      g.lerp(lookB.copy(P_FRONT).sub(lookTmp).normalize(), smoothstep(D.leg, D.bend, d)).normalize();
      o.copy(lookTmp).addScaledVector(g, LOOK_AHEAD);
    }
    o.lerp(P_LAP, smoothstep(D.ramp, D.top, d));
    o.lerp(P_SHINS, smoothstep(D.porch, D.cols, d));
    if (d > D.barrier) {
      path.posAtDist(d, lookTmp);
      if (d < D.pool) {
        // up his body, evenly, from his shins to the hold: a place LOOK_REACH along the gaze's own line as it turns
        const s = easeBoth((d - D.barrier) / (D.pool - D.barrier));
        o.copy(gazeLow).multiplyScalar(Math.sin((1 - s) * climbAll)).addScaledVector(gazeFace, Math.sin(s * climbAll)).normalize().multiplyScalar(LOOK_REACH).add(lookTmp);
      } else onAngle(lookTmp, P_FACE, P_BAY, d < D.riseEnd ? LOOK_BOTH * smoothStep((d - D.pool) / (D.gallery - D.pool)) : lerp(LOOK_BOTH, 1, easeIn((d - D.riseEnd) / (D.five - D.riseEnd))), o);   // the slide to the hold, the hold, the turn on to the bay's mouth
    }
    return o;
  };
  // the look is open from before the line's first metre to beyond its last (the engine alone brings it in, and lets every look go over the
  // last part of a route's length, onto the line ahead: by then this look is on the bay, which is the line ahead)
  const LOOK = { at: lookAt, from: -1, to: 2, fade: 0.3, weight: LOOK_HOLD, arc: true, steady: true };
  return { path, L, D, pace, look: LOOK, lookAt, A0, B0, lastLen, drawWithin: L - D.mouth, drawIn: clamp(D.pool - D.mouth, 0, 14) /* (r5 step 6: by the two places; the engine's own clamp) */, places: { P_FRONT, P_SHINS, P_FEET, P_KNEES, P_LAP, P_CHEST, P_FACE, P_BAY } };
}

// ---------------------------------------------------------------- the grove's layout: a pure deal from the seed, by rules of the place
// ---------------------------------------------------------------- the ground: grove floor, the temple's mound, the stadium's banks, the hill
// A pure function of the place (and the visit's noise for its small swells).
const HILL = { x: 10, z: -265, r: 165, h: 80 };
function makeGround(noise) {
  const moundAt = (x, z) => {
    const dx = Math.max(Math.abs(x) - 33.4, 0), dz = Math.max(Math.abs(z) - 15.2, 0);
    return MOUND * (1 - smoothstep(0, 10, Math.hypot(dx, dz)));
  };
  const groundY = (x, z) => {
    let y = moundAt(x, z);
    // the old hero's mound in the grove: a low swell inside its five sided wall
    y += 1.5 * (1 - smoothstep(5, MOUND_FENCE.r - 1, Math.hypot(x - MOUND_FENCE.x, z - MOUND_FENCE.z)));
    // the stadium east of the long colonnade: a sunk track between two grass banks, its length east to west
    const sx = smoothstep(STOA_X + 14, STOA_X + 40, x), bz = z + 46;
    y += sx * (5.2 * Math.exp(-(((bz - 34) / 11) ** 2)) + 5.6 * Math.exp(-(((bz + 34) / 12) ** 2)) - 0.6 * Math.exp(-((bz / 17) ** 2)));
    // the hill of Kronos to the north: a steep wooded cone
    const hr = Math.hypot(x - HILL.x, (z - HILL.z) * 1.1) / HILL.r;
    if (hr < 1.25) y += HILL.h * Math.pow(Math.max(0, 1 - hr), 1.35) * (0.9 + 0.2 * noise.fbm2(x * 0.012, z * 0.012, 3));
    // low swells far out, flat where the grove and the valley lie
    const far = smoothstep(260, 700, Math.hypot(x, z + 40));
    y += far * 10 * (0.5 + 0.5 * noise.fbm2(x * 0.0021 + 3, z * 0.0021, 3)) * smoothstep(-200, -500, z) + 0.25 * noise.fbm2(x * 0.03, z * 0.03, 2) * (1 - smoothstep(4, 14, moundAt(x, z) * 4));
    return y;
  };
  return { moundAt, groundY };
}

// The sacred way (WAY above) runs from the ramp's foot east to the long colonnade's gate; the stadium's road (ROAD above) comes in from the
// north east and joins it at the cross way; the far masses are fixed; trees, statues, small altars and people are dealt, each kind from a
// stream of its own.
// plain masses [x0, z0, x1, z1, wall height, roof rise, name]
const MASSES = [
  [STOA_X - 5.5, -64, STOA_X + 5.5, 44, 5.6, 1.9, 'the long colonnade'], [-52, -104, 2, -86, 6.4, 2.2, 'the old low temple'], [20, -139, 112, -128, 5.0, 1.6, 'the treasuries'],
  [-12, -126, 12, -116, 5.5, 0.4, 'the fountain building'], [-128, 84, -52, 158, 7.5, 2.4, 'a large house to the south west'], [40, 100, 84, 128, 7, 2.2, 'the council house'],
  [-70, 138, 110, 150, 6, 2.0, 'the south colonnade'], [-196, -84, -128, -18, 6.5, 2.0, 'the wrestling school'], [-190, -200, -120, -100, 6, 2.0, 'the training ground'],
];
const ROUND = { x: -92, z: -84, r: 7.6, h: 9 }, MOUND_FENCE = { x: -38, z: -46, r: 17 };
const AVENUE = 14, SQUARE = 18.4, CROWN = 0.7, FRONT_X = 32.06, FRONT_HALF = 13.84;
// THE OPEN GROUND before the east front and along the temple's north side, where the festival gathers: it runs out to a point at the stadium's
// gate. Its corners: the front's south corner, the temple's north west corner, the gate; its south east side is the stadium's road, then the
// sacred way down to the ramp's foot. No tree of the grove's own deal stands on it (the wild olives of the way in do, set by the way's
// line: THE WAY'S TREES, one of them about (82, -42)); statues on low bases, small altars and people do.
const OPEN = [[FRONT_X, FRONT_HALF], [-FRONT_X, -FRONT_HALF], ...roadAt.line, [WAY.x0, WAY.z0]];
// how far outside the open ground a place lies (0 on it)
const offOpen = (x, z) => {
  let inside = false, m = 1e9;
  for (let i = 0, j = OPEN.length - 1; i < OPEN.length; j = i++) {
    const [ax, az] = OPEN[j], [bx, bz] = OPEN[i], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t));
    if ((az > z) !== (bz > z) && x < ax + (z - az) * dx / dz) inside = !inside;
  }
  return inside ? 0 : m;
};
// statues: none nearer the road's middle than ROAD_STATUE and none on the gate ground (ROAD.half to either side of its middle); a statue on a
// tall pillar none nearer than ROAD_PILLAR to the road or the sacred way
const ROAD_STATUE = 3.6, ROAD_PILLAR = 6.5, WAY_ROWS = { from: 10, step: [3.6, 5.4] };
// THE WAY IN'S LINE for the deal: the flown line's own places every half metre from the entry to the ramp's foot [x, z, the lens's height,
// metres flown], its named places (D) and its place and heading in plan at any metre
let wayMemo = null;
const theWay = () => wayMemo || (wayMemo = (() => {
  const R = makeRoute(), V = new THREE.Vector3(), pts = [];
  for (let m = 0; m <= R.D.ramp; m += 0.5) { R.path.posAtDist(m, V); pts.push([V.x, V.z, V.y, m]); }
  const at = (m) => { R.path.posAtDist(m, V); const x = V.x, z = V.z; R.path.posAtDist(m + 0.5, V); const dx = V.x - x, dz = V.z - z, l = Math.hypot(dx, dz) || 1; return [x, z, dx / l, dz / l]; };
  const box = [Math.min(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[1]))];
  // (r5 C1) up: the line's places from the ramp's foot to the great door, as pts
  const up = []; for (let m = R.D.ramp; m <= R.D.door; m += 0.5) { R.path.posAtDist(m, V); up.push([V.x, V.z, V.y, m]); }
  return { pts, D: R.D, at, box, up };
})());
// THE LANE ALONG THE WAY IN (design under rule BB TWO, by places of the line alone, the same on every visit): how near the lens comes to a
// thing that stands at (x, z), r wide from its middle and top high: the least distance in metres between the line and the thing, across
// the ground where the lens passes lower than its top and in height too where it passes over it. No dealt thing stands nearer than its
// kind's measure: a tree's outermost leaf WAY_AIR (the tree taken at the kit's widest, TREE_REACH of its height, and a tenth higher),
// a statue's stone WAY_STATUE, a small altar WAY_ALTAR, a standing person WAY_FOLK, a walker anywhere on its beat WAY_WALK.
const wayGap = (x, z, r, top) => {
  const W = theWay(), b = W.box, far = r + 12;
  let m = 1e9;
  if (x < b[0] - far || x > b[1] + far || z < b[2] - far || z > b[3] + far) return m;
  for (const q of W.pts) { const dx = x - q[0], dz = z - q[1]; if (Math.abs(dx) > r + 12 || Math.abs(dz) > r + 12) continue; m = Math.min(m, Math.hypot(Math.max(Math.hypot(dx, dz) - r, 0), Math.max(q[2] - top, 0))); }
  return m;
};
// (r5 C1) the same measure against the line from the ramp's foot to the great door (top: the body's top, its height over the sea of the grove's floor)
const upGap = (x, z, top) => { let m = 1e9; for (const q of theWay().up) m = Math.min(m, Math.hypot(Math.hypot(x - q[0], z - q[1]), Math.max(q[2] - top, 0))); return m; };
const TREE_REACH = 1.05, WAY_AIR = 2.4, WAY_OVER = 1.5, WAY_STATUE = 3.0, WAY_ALTAR = 4.6, WAY_FOLK = 2.6, WAY_WALK = 3.2;
// THE CLOSE VIEW (detail by the place a thing stands at, the same on every visit and whatever the gaze). A STATUE is the one make
// (statueGeo) at four finenesses: the NEAR make where the lens passes within WAY_CLOSE of it (the lens's own height counted: there a
// figure fills a quarter of the picture's height and more), the MIDDLE make from there to WAY_MID, the FAR make beyond, the FARTHEST
// where it stands farther than WAY_FAR from every place of the way outdoors (the way in, the ramp: at that distance a figure is under a
// twentieth of the picture's height). A base within WAY_MID has its mouldings. The near and middle statues are drawn in cells of
// STATUE_CELL m (a cell whose box lies wholly outside the picture is not drawn). NEIGHBOUR: no two statues within that many metres of
// each other are of the same kind, or of the same tone of the same stuff. A STANDING PERSON the lens passes within WAY_CLOSE of is
// modelled in the round; one farther than WAY_FAR from the way, or on the river's bank, is the plainest figure.
// WHAT THE NEAR THINGS GAIN, THE FAR ONES GIVE UP.
// (r5: "the same on every visit and whatever the gaze" holds of the statues, the bases and live's own people. Step 10's people
// change make by the lens's distance in metres: LIFE10.far. A FIGURE TYPED TWICE: LIFE10.far is WAY_FAR's 40 m typed again and
// not read from it: who changes one changes the other.)
const WAY_CLOSE = 6.5, WAY_MID = 12, WAY_FAR = 40, STATUE_CELL = 16, NEIGHBOUR = 7;
const wayFar = (x, z) => { const P = theWay().pts; if (Math.hypot(x - 34, z) < WAY_FAR) return false; for (let i = 0; i < P.length; i += 4) if (Math.hypot(x - P[i][0], z - P[i][1]) < WAY_FAR) return false; return true; };
// THE GROVE IN PARTS: its instanced things (trees, statues, their bases, people) are drawn in parts by where they stand (east of x
// PART_X, and west of it); a part whose own box lies wholly outside the picture is not drawn (the renderer's test for a thing out of
// the picture, made with the part's true box in place of a wide ball).
const PART_X = 70, WAY_PATH = 2.3;
const PLANE_COL = { leaf: '#5d8236', leafLight: '#93ae50', leafDark: '#3c5a26', bark: '#b3aa96', barkDark: '#857c6a' };
const OLIVE_COL = { leaf: '#73836a', leafLight: '#adb99e', leafDark: '#4c5c44', bark: '#6b5d4d', barkDark: '#4a4036' };
// THE WAY'S TREES always stand (like the ash altar and the pillar: the deal by the seed does not move them; design under rule BB TWO: they
// are placed to be flown through, by places of the line, the same on every visit). OLD PLANES stand on the right hand of the way in, from
// WAY_TREES.planeFrom m of it to the turn out of the trees, their crowns over the way high above the lens; no plane's outermost leaf
// stands between the entry and the temple (it keeps north of the sight from the entry to the temple's north west corner: so the first
// planes stand further back). WILD OLIVES stand before them on the right hand where the lens comes down (as far as the alley's first
// near plane) and on the left hand from where the road has swung away to the turn's first part. Each is modelled once (shapes: fixed
// streams of the kit's tree, the planes drawn taller by planeTall) and its trunk stands as near the line as its own measured shape
// allows: nothing of it that is lower than the lens + WAY_OVER comes nearer the line across the ground than its air (WAY_AIR; for the
// olives beside the statues' rows WAY_TREES.rows), anywhere along the line. What is higher than the lens + WAY_OVER is out of the
// picture before it is nearer than 2 m.
// (THE STREAM NUMBERS olives [0, 48, 81] and planes [162, 431, 486] are typed: each is a stream of the kit's tree maker, picked by
// hand among its shapes for a trunk that clears the lens and a crown that stands off the line; a tree's shape is no thing of chance
// here: the alley's thirteen trees are of these six shapes on every visit; where each stands, its size and its turn come from ONE
// FIXED STREAM ("the way's trees": see wayTrees), not from the seed: the same on every visit.)
const WAY_TREES = { olives: [0, 48, 81], oliveH: 6.2, oliveScale: [0.95, 1.2], from: 10, step: [6.5, 8.5], rows: 3.4, turn: 0.5, planes: [162, 431, 486], planeH: 17, planeTall: 1.5, planeFrom: 18, planeStep: [6.4, 7.4], planeOff: 7.2, sway: 0.3, level: 0.25 };
const wayTreeModels = [];
// a model: its geometry, and the widest reach from the trunk's foot of anything of it lower than each level (levels WAY_TREES.level apart)
const wayTreeModel = (i) => wayTreeModels[i] || (wayTreeModels[i] = (() => {
  const W = WAY_TREES, kind = i < W.olives.length ? 1 : 0, stream = kind ? W.olives[i] : W.planes[i - W.olives.length], height = kind ? W.oliveH : W.planeH, tall = kind ? 1 : W.planeTall;
  const g = flora.oakGeometry({ height, fullness: kind ? 1.25 : 1.1, flex: 0.6, ...(kind ? OLIVE_COL : PLANE_COL), rng: makeRng(hashSeed((kind ? 'way-olive-shape-' : 'way-plane-shape-') + stream)), detail: 2 });
  if (!kind) { g.scale(1, tall, 1); g.userData.height = height * tall; }
  const pa = g.attributes.position, n = Math.ceil(height * tall / W.level) + 3, prof = new Float32Array(n);
  for (let j = 0; j < pa.count; j++) { const k = clamp(Math.floor(pa.getY(j) / W.level), 0, n - 1), rr = Math.hypot(pa.getX(j), pa.getZ(j)); if (rr > prof[k]) prof[k] = rr; }
  for (let k = 1; k < n; k++) prof[k] = Math.max(prof[k], prof[k - 1]);
  return { g, kind, h: height * tall, prof };
})());
const WAY_TREE_MODELS = WAY_TREES.olives.length + WAY_TREES.planes.length;
let wayTreesMemo = null;
const wayTrees = () => wayTreesMemo || (wayTreesMemo = (() => {
  const W = WAY_TREES, way = theWay(), r = makeRng(hashSeed("the way's trees")), models = [], list = [];
  for (let i = 0; i < WAY_TREE_MODELS; i++) models.push(wayTreeModel(i));
  // may this model stand here at this scale? (every place of the line is tried)
  const clear = (x, z, m, sc, air) => {
    for (const q of way.pts) { const hd = Math.hypot(x - q[0], z - q[1]); if (hd > 30) continue; if (hd < sc * m.prof[clamp(Math.floor((q[2] + WAY_OVER) / sc / W.level), 0, m.prof.length - 1)] + W.sway + air) return false; }
    return true;
  };
  // the first sight: a plane's whole crown keeps north of the line from the entry to the temple's north west corner
  const E = way.pts[0], kNW = (-FRONT_HALF - E[1]) / (E[0] + FRONT_X), sight = (x, z, m, sc) => m.kind || z + sc * m.prof[m.prof.length - 1] < E[1] + (E[0] - x) * kNW;
  // at metre s of the line, on the hand sd (1 right, -1 left): the nearest allowed place at least off from the line, and back a little
  const stand = (s, sd, mi, sc, air, off, back, rot) => {
    const q = way.at(s), nx = -q[3] * sd, nz = q[2] * sd, m = models[mi], ok = (x, z) => clear(x, z, m, sc, air) && sight(x, z, m, sc);
    for (let d = off; d < 26; d += 0.2) { const x = q[0] + nx * d, z = q[1] + nz * d; if (!ok(x, z)) continue;
      const x2 = q[0] + nx * (d + back), z2 = q[1] + nz * (d + back), far = ok(x2, z2), X = far ? x2 : x, Z = far ? z2 : z;
      if (roadAt.off(X, Z) < ROAD_HALF + 1.5 || roadAt.offGround(X, Z) < ROAD.half || list.some((t) => Math.hypot(t.x - X, t.z - Z) < (t.kind && m.kind ? 5 : 4))) return false;
      list.push({ x: X, z: Z, h: m.h * sc, kind: m.kind, rot, way: true, m: mi, s: sc }); return true; }
    return false;
  };
  const D = way.D;
  // the planes, from planeFrom to the turn's first third
  let k = 0, firstNear = D.arc;
  for (let s = W.planeFrom; s < D.arc + 0.34 * (D.leg - D.arc); k++) {
    const mi = W.olives.length + (k % W.planes.length), sc = r.range(0.94, 1.06), back = r.range(0, 1.4), rot = r.range(0, 6.28), step = r.range(W.planeStep[0], W.planeStep[1]);
    if (stand(s, 1, mi, sc, WAY_AIR, W.planeOff, back, rot)) { const t = list[list.length - 1], q = way.at(s); if (firstNear === D.arc && Math.hypot(t.x - q[0], t.z - q[1]) < W.planeOff + 2.5) firstNear = s; }
    s += step;
  }
  // the olives: right hand as far as the first near plane, left hand to the turn's first part
  for (const sd of [1, -1]) for (let s = W.from; s < (sd > 0 ? firstNear - 3 : lerp(D.arc, D.leg, W.turn)); ) {
    const mi = r.int(0, W.olives.length - 1), sc = r.range(W.oliveScale[0], W.oliveScale[1]), back = r.range(0, 1.0), rot = r.range(0, 6.28), step = r.range(W.step[0], W.step[1]);
    s += stand(s, sd, mi, sc, s < WAY_ROWS.from + 6 ? WAY_AIR : W.rows, 2.6, back, rot) ? step : 2;
  }
  return { models, list };
})());
// is a place nearer than m to the trunk of one of the way's trees?
const nearWayTree = (x, z, m) => wayTrees().list.some((t) => Math.hypot(t.x - x, t.z - z) < m);
function dealGrove(seed, vary = {}) {
  const mk = (name) => makeRng(hashSeed(name + ':' + seed)), density = clamp(vary.density ?? 1, 0.7, 1.3), TAN5 = Math.tan(5 * Math.PI / 180);
  const inMass = (x, z, m) => MASSES.some((q) => x > q[0] - m && x < q[2] + m && z > q[1] - m && z < q[3] + m) || Math.hypot(x - ROUND.x, z - ROUND.z) < ROUND.r + m;
  const onMound = (x, z, m) => Math.abs(x) < 43.5 + m && Math.abs(z) < 25.5 + m;
  const nearAltar = (x, z, m) => Math.hypot(x - ALTAR.x, z - ALTAR.z) < ALTAR.stage / 2 + m;
  const inAltis = (x, z) => x > -112 && x < 141 && z > -124 && z < 86;
  // would a thing h metres high here throw its shadow on the east front (the sun 5 degrees up at the lowest)?
  const shadesFront = (x, z, h) => x > 33 && Math.abs(z) < 21 && h - 1.5 > (x - 33) * TAN5;
  // trees: plane trees (kind 0, 13 to 21 m) and wild olives (kind 1, 5 to 7.5 m), one candidate to a cell of a jittered grid
  const rt = mk('trees'), trees = [];
  for (let gx = -130; gx < 150; gx += 17) for (let gz = -128; gz < 92; gz += 17) {
    const x = gx + rt.range(1, 16), z = gz + rt.range(1, 16), olive = rt.chance(0.5), h = olive ? rt.range(5, 7.5) : rt.range(13, 21), rot = rt.range(0, 6.28), keep = rt();
    // the sacred way is an open avenue AVENUE m wide from the long colonnade's gate to the ramp: no crown's outermost leaf (CROWN of the tree's
    // height from its trunk) comes over it; on the square before the gate (east of x 122) the open way is SQUARE m wide
    const lane = x > 30 && x < 152 && Math.abs(z - wayZ(x)) < (x > 122 ? SQUARE / 2 : AVENUE / 2) + CROWN * h;
    // no crown's outermost leaf comes over the open ground, nearer the stadium road's middle than ROAD.air, or over the gate ground
    const reach = CROWN * h, open = offOpen(x, z) < reach + 0.5 || roadAt.off(x, z) < ROAD.air + reach || roadAt.offGround(x, z) < ROAD.half + reach;
    if (!inAltis(x, z) || inMass(x, z, 5) || onMound(x, z, olive ? 3 : 7) || nearAltar(x, z, 9) || lane || shadesFront(x, z, h) || open) continue;
    if (Math.hypot(x - PILLAR.x, z - PILLAR.z) < 9 || keep > 0.8) continue;
    // the lane along the way in; and none within 5 m of the trunk of one of the way's trees
    if (wayGap(x, z, TREE_REACH * h + 0.7, h * 1.1) < WAY_AIR || nearWayTree(x, z, 5)) continue;
    trees.push({ x, z, h, kind: olive ? 1 : 0, rot });
  }
  // the way's trees (they always stand: see WAY_TREES)
  for (const t of wayTrees().list) trees.push({ ...t });
  // outside the grove: the valley's trees, thin
  for (let i = 0; i < 64; i++) {
    const a = rt.range(0, 6.28), r = rt.range(170, 520), x = 20 + Math.cos(a) * r, z = Math.sin(a) * r * 0.9, h = rt.range(8, 17), rot = rt.range(0, 6.28), kind = rt.chance(0.5) ? 1 : 0;
    // the stadium, its banks, the open field south of it and the road's field north of it (east of the long colonnade) carry no tree but the bank's olives
    if (inMass(x, z, 6) || (x > STOA_X + 4 && z < 70 && z > -116) || z < -150 || inAltis(x, z)) continue;
    trees.push({ x, z, h, kind, rot, far: true });
  }
  // wild olives along the south foot of the stadium's bank
  const rb = mk('bank-trees');
  for (let x = 172; x < 345; x += rb.range(9, 17)) trees.push({ x: x + rb.range(-2, 2), z: rb.range(11, 27), h: rb.range(4.6, 7.2), kind: 1, rot: rb.range(0, 6.28), bank: true });
  // statues, each row or crowd from a stream of its own, every draw of a candidate taken before it is tried. Bases of three kinds: a low block
  // (kind 0), a tall pillar (1), a long base with two or three figures side by side (2). Pillars stand among the trees and behind the rows, never
  // on the open ground or within ROAD_PILLAR of the road or the sacred way: there a pillar's draw gives a low block.
  // A statue of the rows down the way in (way: [the line's place x, z, the unit vector from it to the statue's hand x, z]) stands with its
  // nearest stone WAY_STATUE and a little more from the line, facing it; there a pillar's draw gives a pillar (the figure at the lens's
  // height) and the rows thin less with the visit's density. Those rows are dealt first; no other statue stands within half a metre of
  // one of theirs, none nearer the wayside altar than a metre, none at the foot of one of the way's trees.
  const statues = [], bases = [], taken = [];
  const stat = (r, x, z, yaw0, big, way) => {
    const yaw = yaw0 + r.range(-0.25, 0.25) * (way ? 0.4 : 1), v = [r.int(0, 7), r.int(0, 7), r.int(0, 7)], low = r.range(0.7, 1.9) * (big ? 1.25 : 1), bw = r.range(0.75, 1.15), sc = r.range(1.0, 1.32) * (big ? 1.15 : 1);
    const bronze = r.chance(0.62), keep = r(), pick = r(), n = 2 + r.int(0, 1), tall = r.range(3.2, 4.6), long = r.range(0.55, 1.05), back = r.range(0.05, 0.9);
    let kind = way ? (pick < 0.42 ? 0 : pick < 0.74 ? 1 : 2) : pick < 0.56 ? 0 : pick < 0.76 ? 1 : 2;
    // deep: a figure's and its base's half depth; reach: how far its stone comes from its middle (a long base: to the corner of a figure's share of it)
    const w0 = kind === 1 ? 0.6 + 0.22 * bw : bw, deep = Math.max(0.56 * w0, 0.42 * sc) + 0.05, reach = kind === 2 ? Math.hypot(deep, 1.15 * sc / 2 + 0.15) : deep;
    if (way) { x = way[0] + way[2] * (WAY_STATUE + reach + back); z = way[1] + way[3] * (WAY_STATUE + reach + back); }
    if (inMass(x, z, 1.5) || onMound(x, z, -8.5) || nearAltar(x, z, 3) || Math.hypot(x - PILLAR.x, z - PILLAR.z) < 4) return;
    // the mound's east slope before the front carries no statue
    if (x > 33 && x < 44.5 && Math.abs(z) < 27) return;
    const offRoad = roadAt.off(x, z), offWay = x > 30 && x < 152 ? Math.abs(z - wayZ(x)) : 1e9;
    if (!way && kind === 1 && (offOpen(x, z) === 0 || offRoad < ROAD_PILLAR || offWay < ROAD_PILLAR + 3)) kind = 0;
    const gap = 1.15 * sc, half = kind === 2 ? (n - 1) * gap / 2 : 0;
    if (offWay < 6.2 + half || offRoad < ROAD_STATUE + half || roadAt.offGround(x, z) < ROAD.half) return;
    if (keep >= (way ? 0.7 + 0.3 * density / 1.3 : density / 1.3)) return;
    const base = kind === 1 ? tall : kind === 2 ? long : low, w = kind === 1 ? 0.6 + 0.22 * bw : bw, top = base + 0.1 + 1.95 * sc, rad = Math.hypot(deep, half + (kind === 2 ? 0.15 : 0));
    const at = []; for (let i = 0; i < (kind === 2 ? n : 1); i++) { const off = kind === 2 ? (i - (n - 1) / 2) * gap : 0; at.push([x - Math.sin(yaw) * off, z + Math.cos(yaw) * off]); }
    // the lane along the way in (every figure of a long base is tried); the rows' own room; the way's trees' feet
    if (at.some((q) => wayGap(q[0], q[1], reach, top) < WAY_STATUE - 1e-6)) return;
    if (taken.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + rad + (q[3] ?? 0.5)) || wayTrees().list.some((t) => Math.hypot(t.x - x, t.z - z) < (t.kind ? 0.9 : 1.9) + rad)) return;
    if (way) taken.push([x, z, rad]);
    bases.push({ x, z, yaw, w, len: kind === 2 ? n * gap + 0.25 : w * 0.92, h: base, kind, way: !!way });
    for (let i = 0; i < at.length; i++) statues.push({ x: at[i][0], z: at[i][1], yaw, v: v[i], base, bw: kind === 2 ? gap : w, s: sc, bronze, kind, way: !!way, r: reach, top });
  };
  // the wayside altar: one small altar stands by the way in where the alley ends, on the right hand, WAY_ALTAR and more from the
  // line, clear of the planes' trunks; a thin smoke rises from it (the place along the line, its distance, size and turn by the seed).
  // THAT IT ALWAYS STANDS IS A RATE (r5 step 7: COUNTED, OF THE LAW): the 24 tries below found it a place on 2,000 of 2,000 seeds
  // (1 to 2,000); a rate of seeds, no law of the form: were a seed dealt no place, no altar would stand there and no smoke rise.
  // ITS RANGE along the line, from 7 m before the arc's first point
  // (where the lens turns out of the trees) to 4 m after it: before that the planes' trunks and the statues' rows hold the right hand,
  // after it the line has turned away south and the altar would stand behind the lens's shoulder; within it the altar stands where
  // the alley opens, before the gaze as the lens comes to the turn.
  let wayAltar = null;
  { const r = mk('wayside-altar'), D = theWay().D, s0 = r.range(D.arc - 7, D.arc + 4), back = r.range(0.3, 1.4), w = r.range(1.0, 1.4), h = r.range(0.95, 1.2), rot = r.range(0, 6.28);
    for (let i = 0; i < 24 && !wayAltar; i++) { const sA = s0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.2, q = theWay().at(sA), x = q[0] - q[3] * (WAY_ALTAR + w + back), z = q[1] + q[2] * (WAY_ALTAR + w + back);
      if (wayGap(x, z, w * 1.1, h + 0.5) < WAY_ALTAR || nearWayTree(x, z, 2.4 + w) || roadAt.off(x, z) < 7.5) continue;
      wayAltar = { x, z, w, h, rot, wall: false, len: 0, wallH: 0, way: true }; taken.push([x, z, w * 1.1, 1.0]); } }
  // rows down the way in, facing it, close on both hands: from WAY_ROWS.from m of it (the lens is still high there) to the cross way; down
  // the cross way's leg on its east hand alone (its west hand there is the cross way's own beaten earth)
  { const r = mk('statues-way-in'), way = theWay(), D = way.D;
    for (let s = WAY_ROWS.from; s < D.bend - 1; s += r.range(WAY_ROWS.step[0], WAY_ROWS.step[1])) for (const sd of [1, -1]) {
      const jit = r.range(-0.7, 0.7), bigger = r.chance(0.25), q = way.at(s + jit), nx = -q[3] * sd, nz = q[2] * sd;
      if (sd > 0 && s > D.leg - 4) continue;
      stat(r, 0, 0, Math.atan2(-nz, -nx), bigger, [q[0], q[1], nx, nz]);
    } }
  // two rows down the sacred way, facing it
  { const r = mk('statues-way'); for (let x = 60; x < 144; x += r.range(4.2, 7.5)) for (const sd of [-1, 1]) { stat(r, x + r.range(-1, 1), wayZ(x) + sd * r.range(6.8, 8.6), sd > 0 ? -Math.PI / 2 : Math.PI / 2, false); const second = r.chance(0.45), bigger = r.chance(0.3); if (second) stat(r, x + r.range(-2, 2), wayZ(x) + sd * r.range(10.5, 13.5), sd > 0 ? -Math.PI / 2 : Math.PI / 2, bigger); } }
  // two rows along the stadium's road from the gate ground to the cross way, facing it, and a looser row behind each
  { const r = mk('statues-road'), L = roadAt.line; let ahead = 0;
    for (let i = 2; i < L.length; i++) { const [ax, az] = L[i - 1], [bx, bz] = L[i], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      while (ahead < len) { const t = ahead / len, px = ax + dx * t, pz = az + dz * t, nx = -dz / len, nz = dx / len;
        for (const sd of [-1, 1]) { const o1 = r.range(ROAD_STATUE + 0.3, ROAD_STATUE + 1.9), o2 = r.range(7.2, 10.5), second = r.chance(0.5), bigger = r.chance(0.35);
          const face = Math.atan2(-sd * nz, -sd * nx); stat(r, px + sd * nx * o1, pz + sd * nz * o1, face, false); if (second) stat(r, px + sd * nx * o2 + r.range(-1.5, 1.5), pz + sd * nz * o2, face, bigger); }
        ahead += r.range(5.2, 8.8); }
      ahead -= len; } }
  // the crowd of them before the east front
  { const r = mk('statues-front'); for (let i = 0; i < 46; i++) { const x = r.range(44.5, 58), z = r.range(7.5, 27) * (r.chance(0.5) ? 1 : -1), bigger = r.chance(0.25); stat(r, x, z, 0, bigger); } }
  // rows on the cross way, facing it
  { const r = mk('statues-cross'); for (let z = -104; z < 74; z += r.range(4.5, 8)) for (const sd of [-1, 1]) stat(r, CROSS_X + sd * r.range(4.2, 6.2), z, sd > 0 ? Math.PI : 0, false); }
  // the rest about the grove
  { const r = mk('statues-grove'); for (let i = 0; i < 150; i++) { const x = r.range(-108, 138), z = r.range(-120, 82), yaw = r.range(0, 6.28), bigger = r.chance(0.15); if (inAltis(x, z)) stat(r, x, z, yaw, bigger); } }
  // small altars: plain blocks, away from the sacred way and the road; each stands on a step; two in five have a low wall of rough stones
  // behind them (len: how long)
  const ra = mk('altars'), altars = [];
  for (let i = 0; i < 22; i++) {
    const x = ra.range(-100, 136), z = ra.range(-116, 78), w = ra.range(0.9, 1.7), h = ra.range(0.8, 1.25), rot = ra.range(0, 6.28), wall = ra.chance(0.4), len = ra.range(3.2, 5.5), wallH = ra.range(0.45, 0.75);
    if (inMass(x, z, 3) || onMound(x, z, 2) || nearAltar(x, z, 6) || Math.abs(z - wayZ(x)) < 9 || roadAt.off(x, z) < 7.5 || !inAltis(x, z)) continue;
    // the lane along the way in (the wall behind it counted in its breadth); clear of the rows down the way in and of the way's trees
    const ar = wall ? len / 2 + 1 : w * 1.1;
    if (wayGap(x, z, ar, h + 0.5) < WAY_ALTAR || taken.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + ar + 0.6) || nearWayTree(x, z, 2 + ar)) continue;
    altars.push({ x, z, w, h, rot, wall, len, wallH });
  }
  if (wayAltar) altars.push(wayAltar);
  return { trees, statues, bases, altars, wayAltar, density, mk, rules: { inMass, onMound, nearAltar, inAltis } };
}

// People: a grown man's height [least, most] in metres. No one stands within ROAD_OFF of the road's middle, nor within STAND_OFF of the sacred
// way's last stretch (cross way to ramp); no walker's beat comes within WALK_OFF of either.
const PEOPLE_H = [1.6, 1.75], ROAD_OFF = 4.0, STAND_OFF = 5.5, WALK_OFF = 9;
// r5 step 10: LIFE WHERE THE PICTURES ARE EMPTY (see the head). People of the world's own makes, dealt AFTER everything of the deal
// above from streams of their own, in this order: front-walkers, front-ramp, front-porch, front-top, front-steps, under-walkers,
// under-people, ground-walkers, ground-people (and, in the build, front-sway: the round people's phases), so that nothing else
// of the deal moves; a new body that finds no place among the others is left out. R5_STEP10 false: none of them.
// (a) THE EAST FRONT, in knots by the rule of the knot (r5 A1: see KNOT10 and the deal): files of two or three along the ramp's
// two edges inside its side walls (LIFE10.ramp people at the most), knots of up to three at the porch's four free places to the
// sides of the great door (porchFree: clear of the gates' leaves, the door's leaves, the tripod, the horses' base and the
// porch's columns), a ring of up to four in each of the four gaps between the columns to either hand of the ramp (FRONT_GAPS:
// |z| of a gap, 0.3 m clear of the columns' feet), knots of two to four across the two lower steps and the ground before them
// beside the ramp, and walkers who go up the three steps beside the ramp, along the top step within one gap and down again on
// closed beats; LIFE10.front people at most. THE DOOR'S LANE: none of them stands nearer the temple's axis than LIFE10.lane on
// the ramp and LIFE10.laneTop from the top step to the door: the lane kept free is 6.0 m wide on the ramp and 6.6 m from the
// top step to the door between the middles of the nearest bodies, over a door 5.0 m wide. FROM THE RAMP'S FOOT ON no straight
// line from the lens's line to the door's opening meets a body (COUNTED, OF THE LAW, seeds 1 to 200: at none of 15,600 places);
// on the last turn before the foot (m 96.9 to 107.9) one of (a) may stand before part of the opening (on 169 seeds of 200, a
// rate: see the head). No body's shadow falls through the door (by the sun's bearing).
// (b) UNDER THE ENTRY: on the stadium's road (the way the ground draws under the entry) from LIFE10.road[0] to LIFE10.road[1] m past
// the entry, walkers who go down one edge of the road and back up the other (each on a lane of its own) and knots standing in its
// middle, none nearer the lens's line than WAY_CLOSE (the lens's height counted). Live's own people keep off the road as before (ROAD_OFF); these stand on it.
// THE MAKE BY THE LENS'S DISTANCE, BY METRES (a level of detail by where the eye is: a law by the eye under section 153 of the
// crews' rules, named at the head; it is no filter by the pixel's width): each of step 10's people is the standing figure of
// live's knots and offerers (figureGeo) or live's walker; while the lens is farther from it than LIFE10.far (40 m, WAY_FAR's
// figure typed again: a figure is then under a twentieth of the picture's height) it is drawn in the plainest make, and it
// changes make in flight on the frame where the lens comes within LIFE10.far of it, which live never showed (live draws in
// the plainest make those who STAND that far from the way: a rule of the body's place, unlike this one); one outside the
// picture is not drawn.
// (c) THE GROUND BEFORE THE TEMPLE (R5_STEP10C; dealt after (a) and (b) from the streams ground-walkers and ground-people, so that
// live's deal, (a) and (b) do not move): LIFE10.ground people in knots of two to four (a knot that cannot place two is left out),
// in four fields north of the ramp [x from, to, z from, to] (GROUND10.fields): the slope and the ground below the east front beside
// the ramp (inside the temple's box of shadows for every sun of a visit: they throw true ones, as (a)'s do), the mound's north-east
// slope, the ground before it, and the open ground along the temple's north flank with the ground before it (their long shadows
// are painted, as live's knots' are, and lie north of the temple's steps: no knot stands between z -13.6 and -16.2, the fields'
// bounds with the 0.3 m by which one of a knot may stand outside its field); the
// first three tries are for the first field (until one knot stands there), the next six go through the other three in turn.
// LIFE10.groundWalkers walkers go on closed beats (out on one lane, back on the next) from the open ground toward the ramp's foot
// and turn before it (a straight beat 11 to 30 m long, north to north-west of its near end; one that finds no free line is left
// out). None of (c) stands or walks nearer the lens's line IN PLAN than WAY_CLOSE, nor nearer the temple's axis than GROUND10.off,
// nor within GROUND10.steps of the temple's steps, nor east of x GROUND10.east; so none is on the stadium's road or the sacred
// way's last stretch: the way the lens flies, kept free by us (see the deal).
const R5_STEP10 = true, R5_STEP10C = true;
const GROUND10 = { off: 7.4, east: 56, steps: 0.9, fields: [[35.5, 51, -13.3, -7.7], [34.5, 44.5, -29, -16.5], [44, 55, -38, -17], [10, 34, -38, -17]] };
const R5_C1 = true;   // r5 C1: step 10's people the lens passes within WAY_CLOSE of are modelled in the round while within LIFE10.far of the lens (see the people's build)
// r5 C1, THE WALKERS OF THE STEPS (beatNear): the world has no walker in the round, so a walker of (a) whose beat comes nearer the lens's
// line IN PLAN than WAY_CLOSE (one that climbs through a gap next to the ramp) is NOT DRAWN; its beat stays dealt and kept free, so that
// nothing else of the deal moves (live's own walkers pass the line at WAY_WALK).
const beatNear = (b) => b.course.pts.some((p) => Math.min(wayGap(p[0], p[2], 0, 1e3), upGap(p[0], p[2], 1e3)) < WAY_CLOSE);
const R5_C2 = true;   // r5 C2: the shade of a body on open paving has the tone of the ramp's side walls' shade (see the head and the paving's material)
const R5_STEP6 = true;   // r5 step 6 (portal.drawIn by place: see the head and the portal's spec)
// LIFE10: lane, laneTop: the door's lane; front: (a)'s bound; ramp: the ramp's bound (see the deal); road: (b)'s metres past the
// entry; far: the metres from the lens beyond which one of step 10 is the plainest make (A FIGURE TYPED TWICE: WAY_FAR's 40 m
// typed again and not read from it: who changes one changes the other); underWalkers: two or three are drawn, but THE THIRD IS
// NEVER PLACED: its lane lies 2.7 m and a little off the road's middle (1.9 m and 0.4 m for each one placed) and fails onRoad's
// own bound (ROAD_HALF less 0.3 m) on every try (OF THE LAW: the most on seeds 1 to 200 is 2); the draw stays as it is, so
// that the deal stays.
const LIFE10 = { lane: 3.0, laneTop: 3.3, front: 40, ramp: 8, road: [8, 60], far: 40, underKnots: [6, 8], underWalkers: [2, 3], ground: [12, 20], groundWalkers: [2, 3] };
const FRONT_GAPS = [[4.05, 6.4], [9.25, 11.2]];
// r5 A1, A2 (see the head): WHAT ONE OF STEP 10 IS AND HOLDS, by its own draws (look, arm, hold), for the deal and the build alike: its
// make (the number in the people's KINDS: 0 a tunic, 1 a long garment and mantle, 2 the same with the right arm bent, 3 a tunic with
// the right arm held out), what it holds (0 nothing, 1 a staff, 2 to 4 an offering in the hand held out: a wreath, a branch, a dish),
// and THE ROUND MAKE'S REACH: how far that make comes from its own axis in plan (COUNTED, of the law, over every such make at every
// height and lean: at rest 0.329 m, the arm held out 0.508, with a wreath 0.540, a branch 0.748, a dish 0.593; the shift of weight
// adds 0.031 at most: so the figures of reach10).
const kind10 = (q) => (q.look % 3 === 0 ? (q.arm === 1 ? 3 : 0) : q.arm === 3 ? 2 : 1);
const held10 = (q) => { const v = kind10(q); return v === 3 ? (q.hold % 2 ? 0 : 2 + (q.hold >> 1) % 3) : v < 2 && q.hold % 4 === 1 ? 1 : 0; };
const reach10 = (q) => (kind10(q) < 3 ? 0.36 : [0.54, 0, 0.58, 0.78, 0.63][held10(q)]);
// KNOT10: line, off: three stand ON ONE LINE when the two shorter of their three distances are under line (each end within that of the
// one between) and the flattest height of their triangle is under off; twin: how near a neighbour stands (to one's own place or to its mirror place across the temple's axis);
// alike: two are turned alike within this many radians; air: section 169's margin; edge: the free edge between two knots of one
// edge of the ramp; across: how far apart along the ramp the middles of two knots on its two edges stand at the least.
const KNOT10 = { line: 1.6, off: 0.3, twin: 2.5, alike: 0.5, air: 2.3, edge: 2.5, across: 1.5 };
const porchFree = (x, z) => {
  const az = Math.abs(z);
  if (x < 16.4 || x > 22.0 || az < LIFE10.laneTop || az > 6.15) return false;
  if (Math.hypot(x - 19.4, z - 4.5) < 1.0) return false;                                                    // the tripod
  if (x > 16.9 && x < 21.1 && z > -5.52 && z < -3.48) return false;                                       // the horses' base
  if (x > GATE_X - 0.14 - GATE_LEAF[1] - 0.4 && (Math.abs(az - GATE_POSTS[1]) < 0.4 || Math.abs(az - GATE_POSTS[2]) < 0.4)) return false;   // the side gates' open leaves
  { const ax = 15.78, a2 = 2.5, dx = 1.57, dz = 1.87, t = clamp(((x - ax) * dx + (az - a2) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(x - ax - dx * t, az - a2 - dz * t) < 0.5) return false; }   // the great door's open leaf
  return Math.hypot(x - 22.52, az - 2.61) > 1.35;                                                          // the porch's columns
};
// ---------------------------------------------------------------- what moves by the clock: closed courses, dealt by place
// A course is a closed line of points; a body's place at clock t is its own phase plus t * speed / length round the line,
// so the bodies are spread round their lines alike at every clock. Of live's courses nothing here reads the flown line: kites keep to
// the air over the ash altar, swallows to the temple's flanks, its side walks and the air high over its roof, live's walkers to
// beats that stay off the sacred way, the stadium's road, the ramp and the mound. (r5 step 10's own are other: its walkers go on
// the stadium's road, on the mound and up the temple's steps, and its deal reads the flown line's places: onRoad and open test a
// place against it, KNOT10.air keeps (a) off it, beatNear leaves a walker of the steps undrawn by it.)
function closedCourse(pts) {
  const cum = [0];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
  return { pts, cum, len: cum[pts.length] };
}
function courseAt(c, s, out) {
  const n = c.pts.length; let d = s % c.len; if (d < 0) d += c.len;
  let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c.cum[m] <= d) lo = m; else hi = m; }
  const a = c.pts[lo], b = c.pts[(lo + 1) % n], seg = c.cum[lo + 1] - c.cum[lo], t = seg > 0 ? (d - c.cum[lo]) / seg : 0;
  out[0] = a[0] + (b[0] - a[0]) * t; out[1] = a[1] + (b[1] - a[1]) * t; out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}
// THE LIFE'S DEAL, STEP BY STEP (r5 F2): lifeSteps is the deal itself, written as a generator: every yield of it is a place where the build
// lets the page draw (a step of the build ends there) and nothing else: the same code runs in the same order, every stream takes the same
// draws. dealLife runs it to its end in one piece (the tools' way in: route, deal, life at the world's end).
function dealLife(seed, vary = {}, grove = dealGrove(seed, vary)) { const it = lifeSteps(seed, vary, grove); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
function* lifeSteps(seed, vary, grove) {
  const mk = (name) => makeRng(hashSeed(name + ':' + seed)), density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare, R = grove.rules;
  const ring = (n, f) => { const pts = []; for (let i = 0; i < n; i++) pts.push(f(i / n * 6.2832)); return closedCourse(pts); };
  // kites: wide slow rings round the ash altar's smoke, above the trees
  const rk = mk('kites'), kites = [], few = rk.int(0, 2), nK = rare ? 10 : 4 + few;
  for (let i = 0; i < 12; i++) {
    const cx = ALTAR.x + rk.range(-8, 8), cz = ALTAR.z + rk.range(-8, 8), r = rk.range(11, 30), y = rk.range(23, 50), bob = rk.range(0.6, 2.2), bn = rk.int(1, 3), ph = rk.range(0, 6.28), dir = rk.chance(0.5) ? 1 : -1;
    const o = { course: ring(96, (a) => [cx + Math.cos(a * dir) * r, y + bob * Math.sin(bn * a + ph), cz + Math.sin(a * dir) * r]), speed: rk.range(7.5, 10.5), phase: rk.range(0, 1), span: 1.55, kind: 'kite' };
    if (i < nK) kites.push(o);
  }
  // swallows: long loops along the temple's flanks under the eaves, rings high over the roof, and two that thread the side walks
  const rs = mk('swallows'), swallows = [], nS = (rare ? 15 : 9) + rs.int(0, 3);
  for (let i = 0; i < 18; i++) {
    const sd = rs.chance(0.5) ? 1 : -1, tl = rs.range(0, 6.28), speed = rs.range(8.5, 12.5), phase = rs();
    let course;
    if (i % 3 < 2) { const cx = rs.range(-20, 22), cz = sd * rs.range(18.8, 22), rx = rs.range(6, 15), rz = rs.range(1.6, 3.4), cy = rs.range(9.5, 19), ry = rs.range(0.6, 2.2); course = ring(72, (a) => [cx + Math.cos(a) * rx, cy + ry * Math.sin(a + tl) + 0.4 * ry * Math.sin(2 * a), cz + Math.sin(a) * rz]); }
    else { const cx = rs.range(-18, 18), cz = rs.range(-5, 5), r = rs.range(7, 15), cy = rs.range(28.5, 35), ry = rs.range(0.3, 1.2); course = ring(72, (a) => [cx + Math.cos(a) * r, cy + ry * Math.sin(2 * a + tl), cz + Math.sin(a) * r * 0.7]); }
    if (i < nS) swallows.push({ course, speed, phase, span: 0.33, kind: 'swallow' });
  }
  const sp = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.3);
  for (const sd of [-1, 1]) {
    // in between two columns at one end, along the walk under its ceiling, out between two at the other end, back outside
    const y0 = rs.range(9.6, 12), course = ring(160, (a) => [23.49 * sp(Math.cos(a)), y0 + 1.1 * Math.sin(a), sd * (13.3 + 3.1 * sp(Math.sin(a)))]);
    swallows.push({ course, speed: rs.range(8, 10), phase: rs(), span: 0.33, kind: 'swallow in the walk' });
  }
  // walkers: oval beats in the grove, each tried against the rules of the place; people standing in small groups
  // what stands in the grove, sorted into cells 6 m square, so that a place is tried against its neighbours alone
  const cells = new Map(), cellOf = (x, z) => (Math.floor(x / 6) + 512) * 2048 + Math.floor(z / 6) + 512;
  const stand = (x, z, r) => { const k = cellOf(x, z); if (!cells.has(k)) cells.set(k, []); cells.get(k).push([x, z, r]); };
  for (const q of grove.statues) stand(q.x, q.z, q.bw * 0.7);
  for (const t of grove.trees) stand(t.x, t.z, t.way && !t.kind ? 1.5 : 0.6); for (const q of grove.altars) stand(q.x, q.z, 0.9);
  const clearOf = (x, z, m) => {
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const list = cells.get(cellOf(x + i * 6, z + j * 6)); if (list) for (const q of list) if (Math.hypot(q[0] - x, q[1] - z) < m + q[2]) return false; }
    return true;
  };
  // the way the lens flies is kept free by us (a rule of ours, no ancient custom: the research has a procession and lists the grove's
  // ways as unknown): no one of this deal stands or walks within m of the middle of the stadium's road, nor of the sacred way's
  // last stretch from the cross way to the ramp; on the sacred way east of the cross way people stand (r5 step 10 sets its own
  // few people on the road under the entry and on the east front: see LIFE10)
  const offWays = (x, z, way, road) => roadAt.off(x, z) >= road && (x > CROSS_X + way || Math.abs(z - wayZ(x)) >= way);
  // the lane along the way in: no one stands nearer the line than WAY_FOLK, no walker's beat comes nearer than WAY_WALK (where the lens is high they pass under it)
  const freeAt = (x, z, m, way, road = ROAD_OFF, lane = WAY_FOLK) => R.inAltis(x, z) && !R.inMass(x, z, 2.5) && !R.onMound(x, z, 4.5) && !R.nearAltar(x, z, 3.2) && Math.hypot(x - PILLAR.x, z - PILLAR.z) > 3 && offWays(x, z, way, Math.min(way, road)) && clearOf(x, z, m) && wayGap(x, z, 0.4, 1.9) >= lane;
  const rw = mk('walkers'), walkers = [], nW = Math.round(20 * density);
  for (let i = 0; i < 240 && walkers.length < nW; i++) {
    if (i % 80 === 79) yield;
    const cx = rw.range(-70, 134), cz = rw.range(-112, 76), rx = rw.range(6, 24), rz = rw.range(3.5, 12), rot = rw.range(0, 3.14), cr = Math.cos(rot), sr = Math.sin(rot), dir = rw.chance(0.5) ? 1 : -1;
    const o = { course: ring(72, (a) => [cx + cr * Math.cos(a * dir) * rx - sr * Math.sin(a * dir) * rz, 0, cz + sr * Math.cos(a * dir) * rx + cr * Math.sin(a * dir) * rz]), speed: rw.range(1.0, 1.45), phase: rw(), h: rw.range(PEOPLE_H[0], PEOPLE_H[1]), look: rw.int(0, 5), kind: 'walker' };
    if (o.course.pts.every((q) => freeAt(q[0], q[2], 0.75, WALK_OFF, WALK_OFF, WAY_WALK))) { walkers.push(o); for (const q of o.course.pts) stand(q[0], q[2], 0.5); }
  }
  // by the way in: a few who pace up and down beside it, behind the statues' rows or under the high lens
  { const r = mk('walkers-way-in'), way = theWay(), nWay = Math.round(3 * density), n0 = walkers.length;
    for (let i = 0; i < 60; i++) {
      const sW = r.range(12, way.D.bend - 4), sd = r.chance(0.5) ? 1 : -1, o = r.range(3.6, 10), rx = r.range(4, 9), rz = r.range(0.9, 2.2), dir = r.chance(0.5) ? 1 : -1, speed = r.range(1.0, 1.4), phase = r(), h = r.range(PEOPLE_H[0], PEOPLE_H[1]), look = r.int(0, 5);
      if (walkers.length - n0 >= nWay) continue;
      const q = way.at(sW), cx = q[0] - q[3] * sd * o, cz = q[1] + q[2] * sd * o, w = { course: ring(56, (a) => [cx + q[2] * Math.cos(a * dir) * rx - q[3] * Math.sin(a * dir) * rz, 0, cz + q[3] * Math.cos(a * dir) * rx + q[2] * Math.sin(a * dir) * rz]), speed, phase, h, look, kind: 'walker' };
      if (w.course.pts.every((c) => freeAt(c[0], c[2], 0.75, ROAD_OFF, ROAD_OFF, WAY_WALK))) { walkers.push(w); for (const c of w.course.pts) stand(c[0], c[2], 0.5); }
    } }
  yield;
  // people standing: each kind of place deals from a stream of its own, and every draw for a place is taken before the place is tried
  const people = [];
  const group = (r, gx, gz, n, focus, way, keep = true) => {
    for (let k = 0; k < n; k++) {
      const a = r.range(0, 6.28), rad = r.range(0.45, 1.5) * (n === 1 ? 0 : 1), x = gx + Math.cos(a) * rad, z = gz + Math.sin(a) * rad, h = r.range(PEOPLE_H[0], PEOPLE_H[1]), look = r.int(0, 5), arm = r.pick([0, 0, 0, 3, 1]), turn = r.range(-1, 1);
      const yaw = focus ? Math.atan2(-(focus[1] - z), focus[0] - x) + 0.3 * turn : Math.atan2(-(gz - z), gx - x) + 0.5 * turn;
      if (keep && freeAt(x, z, 0.6, way)) { people.push({ x, z, h, look, arm, yaw }); stand(x, z, 0.1); }
    }
  };
  // by the way in: small knots close beside it among the statues' rows and behind them, in talk or looking at the temple; two or three at the wayside altar
  { const r = mk('people-way-in'), way = theWay(), n0 = Math.round(12 * density);
    for (let k = 0; k < n0; k++) { const sP = r.range(12, way.D.bend - 2), sd = r.chance(0.5) ? 1 : -1, o = r.range(WAY_FOLK + 0.5, 8), n = r.int(2, 4), toFront = r.chance(0.3), q = way.at(sP);
      group(r, q[0] - q[3] * sd * o, q[1] + q[2] * sd * o, n, toFront ? [FRONT_X, 0] : null, STAND_OFF); }
    const q = grove.wayAltar, a = r.range(0, 6.28), n = r.int(2, 3); if (q) group(r, q.x + Math.cos(a) * 2.4, q.z + Math.sin(a) * 2.4, n, [q.x, q.z], STAND_OFF); }
  // at the ash altar: on the stage's south steps and before them, looking to the fire
  { const r = mk('people-ash-altar'); for (let k = 0; k < 4; k++) { const x = ALTAR.x + r.range(-9, 9), z = ALTAR.z + r.range(11.5, 17), n = r.int(2, 5); group(r, x, z, n, [ALTAR.x, ALTAR.z], STAND_OFF); } }
  // beside the stadium's road, from the bend's head to the cross way: small groups by the statues' rows, some looking at the temple
  { const r = mk('people-road'), L = roadAt.line, n0 = Math.round(13 * density);
    for (let k = 0; k < n0; k++) { const i = 2 + r.int(0, L.length - 3), sd = r.chance(0.5) ? 1 : -1, o = r.range(ROAD_OFF + 0.4, 9), n = r.int(2, 4), toFront = r.chance(0.35), [ax, az] = L[i - 1], [bx, bz] = L[i], len = Math.hypot(bx - ax, bz - az);
      group(r, bx - sd * (bz - az) / len * o, bz + sd * (bx - ax) / len * o, n, toFront ? [FRONT_X, 0] : null, STAND_OFF); } }
  // by the bases of the statues that stand along the road: two or three before one base in four, looking up at it
  { const r = mk('people-bases'); for (const q of grove.bases) { const keep = r.chance(0.25), a = r.range(0, 6.28), n = r.int(2, 3); if (roadAt.off(q.x, q.z) < NEAR_WAY) group(r, q.x + Math.cos(a) * 2.3, q.z + Math.sin(a) * 2.3, n, [q.x, q.z], STAND_OFF, keep); } }
  // on the sacred way east of the cross way and along its edges, and before the east front, looking at the statues or the temple
  { const r = mk('people-sacred-way'), n0 = Math.round(14 * density); for (let k = 0; k < n0; k++) { const x = r.range(40, 138), sd = r.chance(0.5) ? 1 : -1, onIt = r.chance(0.4), o = onIt ? r.range(0, 3.2) : r.range(6.5, 15), n = r.int(1, 5), toFront = r.chance(0.4); group(r, x, wayZ(x) + sd * o, n, toFront ? [FRONT_X, 0] : null, STAND_OFF); } }
  // about the grove
  { const r = mk('people-grove'), n0 = Math.round(10 * density); for (let k = 0; k < n0; k++) { const x = r.range(-90, 136), z = r.range(-112, 78), n = r.int(1, 4); group(r, x, z, n, null, STAND_OFF); } }
  // at the small altars: two or three before one altar in three, looking at it
  { const r = mk('people-altars'); for (const q of grove.altars) { const keep = r.chance(0.34) && !q.way, a = r.range(0, 6.28), n = r.int(2, 3); group(r, q.x + Math.cos(a) * 2.6, q.z + Math.sin(a) * 2.6, n, [q.x, q.z], STAND_OFF, keep); } }
  // on the beaten ways across the grove: small knots of people standing in talk
  { const r = mk('people-ways'), n0 = Math.round(9 * density); for (let k = 0; k < n0; k++) { const w = WAYS[1 + r.int(0, 3)], t = r(), sd = r.chance(0.5) ? 1 : -1, ox = r.range(0, 0.6), oz = r.range(0, 0.6), n = r.int(2, 4); group(r, lerp(w[0], w[2], t) + sd * ox * w[4], lerp(w[1], w[3], t) + sd * oz * w[4], n, null, STAND_OFF); } }
  // on the stadium's south bank, over the track: a few early watchers in twos and threes, looking down at it
  { const r = mk('people-bank'), n0 = Math.round(16 * density);
    for (let k = 0; k < n0; k++) {
      const gx = r.range(168, 335), gz = r.range(-25, -14), n = r.int(1, 5);
      for (let i = 0; i < n; i++) people.push({ x: gx + r.range(-1.6, 1.6), z: gz + r.range(-1.2, 1.2), h: r.range(PEOPLE_H[0], PEOPLE_H[1]), look: r.int(0, 5), arm: r.pick([0, 0, 3, 1]), yaw: Math.PI / 2 + r.range(-0.5, 0.5), bank: true });
    } }
  // still figures with offerings: on the two lower steps of the east front either side of the ramp, facing the door, and on the ground beside
  // the ramp's foot; the ramp is the lens's: its side walls stand 3.95 m from the axis and no figure of these stands nearer the axis
  // than 5 m (r5 step 10 sets its own people along the ramp's two edges, LIFE10.lane and more from the axis)
  const offerers = [], nO = Math.round(6 * density);
  const far = (x, z) => offerers.every((q) => Math.hypot(q.x - x, q.z - z) > 0.9);
  { const r = mk('offerers-steps');
    for (let i = 0; i < 40 && offerers.length < nO; i++) {
      const sd = r.chance(0.5) ? 1 : -1, low = r.chance(0.5), x = low ? 33.0 : 32.38, z = sd * r.range(5.2, 12.4), o = { x, z, y: MOUND + (low ? 0.48 : 0.96), h: r.range(PEOPLE_H[0], PEOPLE_H[1]), look: r.int(0, 5), gift: r.int(1, 3), yaw: Math.PI + r.range(-0.6, 0.6) };
      if (far(x, z)) offerers.push(o);
    } }
  { const r = mk('offerers-ramp-foot');
    for (let i = 0; i < 40 && offerers.length < nO + Math.round(4 * density); i++) {
      const sd = r.chance(0.5) ? 1 : -1, x = r.range(46, 57.5), z = sd * r.range(5.0, 6.8), o = { x, z, y: null, h: r.range(PEOPLE_H[0], PEOPLE_H[1]), look: r.int(0, 5), gift: r.int(1, 3), yaw: Math.PI + r.range(-0.5, 0.5) };
      if (far(x, z)) offerers.push(o);
    } }
  // r5 step 10 (see LIFE10): dealt here, after everything of live's deal
  const front = [], frontWalkers = [], under = [], underWalkers = [], ground = [], groundWalkers = [];
  if (R5_STEP10) {
    const beats = [], offBeats = (x, z, m) => beats.every((q) => Math.hypot(q[0] - x, q[1] - z) > m), offOfferers = (x, z, m) => offerers.every((q) => Math.hypot(q.x - x, q.z - z) > m);
    const full = () => front.length + frontWalkers.length >= LIFE10.front;
    // r5 A1, A2: ONE OF A KNOT (K: the knot's number, its middle gx gz, its sight, the lists it is tried against, those of it placed m,
    // how many of them look to the sight). Every draw is taken before the place is tried. ITS TURN IS ITS OWN, by a draw: to the
    // knot's middle (half of them), to the knot's sight (three in ten; two of a knot at most, a third looks to the middle), or half
    // away (two in ten: 1.7 to 2.5 rad off the middle, to either hand); one who would be the third of its knot turned alike is turned
    // 1.1 rad on. ITS DRESS AND WHAT IT HOLDS are draws of its own (dye, dye2, own, hold) and unlike its neighbours' (unlike). It is
    // NOT PLACED: on one line with two others (inLine; the ramp's edges have their own rule of the file); (a) alone: where its make's
    // reach would come within KNOT10.air of the lens's line in plan (section 169 as a rule).
    const lineGap = (x, z) => Math.min(wayGap(x, z, 0, 1e3), upGap(x, z, 1e3));
    const inLine = (x, z, lists) => {
      const nb = []; for (const l of lists) for (const q of l) if (Math.hypot(q.x - x, q.z - z) < 2 * KNOT10.line) nb.push(q);
      for (let i = 0; i < nb.length; i++) for (let j = i + 1; j < nb.length; j++) { const A = nb[i], B = nb[j], d = [Math.hypot(A.x - x, A.z - z), Math.hypot(B.x - x, B.z - z), Math.hypot(A.x - B.x, A.z - B.z)].sort((a, b) => a - b); if (d[1] < KNOT10.line && Math.abs((A.x - x) * (B.z - z) - (B.x - x) * (A.z - z)) / d[2] < KNOT10.off) return true; }
      return false;
    };
    // NO MIRROR, NO TWIN: one whose neighbour wears its dye takes the next dye that none of them wears (of the plainer makes' eight
    // too); its mantle is of another dye than its garment and than its neighbours' mantles; one who would hold what a neighbour holds holds nothing
    const unlike = (q, lists) => {
      const nb = []; for (const l of lists) for (const p of l) if (Math.hypot(p.x - q.x, p.z - q.z) < KNOT10.twin || Math.hypot(p.x - q.x, p.z + q.z) < KNOT10.twin) nb.push(p);
      for (let i = 0; i < 9 && nb.some((p) => p.dye % 8 === q.dye % 8); i++) q.dye = (q.dye + 1) % 10;
      for (let i = 0; i < 9 && (q.dye2 === q.dye || nb.some((p) => kind10(p) % 3 && p.dye2 === q.dye2)); i++) q.dye2 = (q.dye2 + 1) % 10;
      if (held10(q) && nb.some((p) => held10(p) === held10(q))) q.hold = 3;
    };
    let knots = 0;
    const knot = (gx, gz, sight, by, more) => ({ id: knots++, gx, gz, sight, by, m: [], sees: 0, ...more });
    const one = (r, list, K, x, z, y, ok, at) => {
      const h = r.range(PEOPLE_H[0], PEOPLE_H[1]), look = r.int(0, 5), arm = r.pick([0, 0, 0, 3, 1]), mode = r(), turn = r.range(-1, 1), hand = r.chance(0.5) ? 1 : -1, off = r.range(1.7, 2.5), dye = r.int(0, 9), dye2 = r.int(0, 9), own = r.int(0, 11), hold = r.int(0, 7);
      const sees = mode >= 0.5 && mode < 0.8 && K.sees < 2, q = { x, z, y, h, look, arm, yaw: 0, at, knot: K.id, dye, dye2, own, hold };
      q.yaw = sees ? Math.atan2(-(K.sight[1] - z), K.sight[0] - x) + 0.3 * turn : Math.atan2(-(K.gz - z), K.gx - x) + (mode >= 0.8 ? hand * off : 0.45 * turn);
      if (K.m.filter((p) => Math.abs(Math.atan2(Math.sin(p.yaw - q.yaw), Math.cos(p.yaw - q.yaw))) < KNOT10.alike).length >= 2) q.yaw += hand * 1.1;
      if (!ok(x, z) || !list.every((p) => Math.hypot(p.x - x, p.z - z) > 0.55) || !offBeats(x, z, 0.8) || !offOfferers(x, z, 0.9) || (!K.file && inLine(x, z, K.by))) return null;
      unlike(q, K.by);
      if (K.air && lineGap(x, z) - reach10(q) < KNOT10.air) return null;
      list.push(q); K.m.push(q); if (sees) K.sees++;
      return q;
    };
    // (a) the walkers of the steps: from the mound's ground up the three steps, along the top step, down, and back
    { const r = mk('front-walkers'), nWk = r.int(2, 4);
      for (let i = 0; i < 160; i++) {
        const sd = r.chance(0.5) ? 1 : -1, gap = FRONT_GAPS[r.int(0, 1)], za = sd * r.range(gap[0] + 0.45, gap[1] - 0.45), zb = sd * r.range(gap[0] + 0.45, gap[1] - 0.45), xE = r.range(38, 43.5), dir = r.chance(0.5), speed = r.range(0.75, 1.05), phase = r(), h = r.range(PEOPLE_H[0], PEOPLE_H[1]), look = r.int(0, 5);
        if (frontWalkers.length >= nWk || Math.abs(za - zb) < 0.6) continue;
        const pts = [], nx = Math.round((xE - 31.72) / 0.4), nz = Math.max(2, Math.round(Math.abs(zb - za) / 0.4));
        for (let k = 0; k < nx; k++) pts.push([lerp(xE, 31.72, k / nx), 0, za]); for (let k = 0; k < nz; k++) pts.push([31.72, 0, lerp(za, zb, k / nz)]);
        for (let k = 0; k < nx; k++) pts.push([lerp(31.72, xE, k / nx), 0, zb]); for (let k = 0; k < nz; k++) pts.push([xE, 0, lerp(zb, za, k / nz)]);
        if (dir) pts.reverse();
        if (pts.every((q) => offOfferers(q[0], q[2], 0.6) && offBeats(q[0], q[2], 0.7) && (q[0] < 33.6 || clearOf(q[0], q[2], 0.75)))) { frontWalkers.push({ course: closedCourse(pts), speed, phase, h, look, kind: 'walker' }); for (const q of pts) beats.push([q[0], q[2]]); }
      } }
    // (a) the ramp's two edges, inside its side walls (dealt first of the standing, so that the front's bound cuts it last): a knot
    // here is a FILE of two or three along the edge, its two gaps unequal; the knots go to the two edges by turns (the first by a
    // draw); a knot takes the first of its four dealt places that leaves KNOT10.edge of free edge to every knot of its own edge and
    // stands KNOT10.across and more along the ramp from the middle of every knot of the other edge (none: it is left out). THE RAMP
    // HOLDS LIFE10.ramp AT MOST (the room: every one of them is in the round, and the lens sees them all on the god's first frame;
    // OF THE PICTURE, seed 75: with the ramp unbounded that frame drew 492,195 triangles, over the lead's term of 492,000)
    { const r = mk('front-ramp'), n0 = r.int(3, 5), first = r.chance(0.5) ? 1 : -1, spans = []; let onRamp = 0;
      for (let i = 0; i < n0; i++) {
        const sd = i % 2 ? -first : first, tries = [r.range(35.5, 51.5), r.range(35.5, 51.5), r.range(35.5, 51.5), r.range(35.5, 51.5)], n = r.int(2, 3), g1 = r.range(0.6, 0.8), g2 = r.range(0.9, 1.25), swap = r.chance(0.5);
        const offs = [0, swap ? g1 : g2, g1 + g2], len = offs[n - 1];
        const gx = tries.find((c) => spans.every((q) => (q[0] === sd ? c - len / 2 - 0.1 - q[2] >= KNOT10.edge || q[1] - (c + len / 2 + 0.1) >= KNOT10.edge : Math.abs(c - q[3]) >= KNOT10.across)));
        const K = knot(gx ?? 0, sd * 3.1, [DOOR_X, sd * 1.5], [front, offerers], { air: true, file: true });
        for (let k = 0; k < n; k++) { const x = (gx ?? 0) - len / 2 + offs[k] + r.range(-0.1, 0.1), z = sd * r.range(LIFE10.lane, 3.2); if (one(r, front, K, x, z, rampY(x) - 0.01, (xx) => gx !== undefined && !full() && onRamp < LIFE10.ramp && xx >= 33.6 && xx <= 53.6, 'ramp')) onRamp++; }
        if (gx !== undefined) spans.push([sd, gx - len / 2 - 0.1, gx + len / 2 + 0.1, gx]);
      }
      // (each edge holds a third of the ramp's people and more: the last placed of the fuller edge is taken off until it does)
      for (;;) { const on = front.filter((q) => q.at === 'ramp'), a = on.filter((q) => q.z > 0).length; if (Math.min(a, on.length - a) * 3 >= on.length) break; front.splice(front.indexOf(on.filter((q) => (q.z > 0) === (a * 2 > on.length)).pop()), 1); }
    }
    // (a) the porch, to the sides of the great door
    { const r = mk('front-porch');
      // (its four free places [x0, x1, z0, z1, what a knot there looks at; none: the great door]: west of the tripod, in the south side gate's way, before the horses, in the north side gate's way)
      for (const [x0, x1, z0, z1, see] of [[17.75, 18.35, 3.35, 6.0, [19.4, 4.5]], [20.55, 21.85, 4.05, 6.05, null], [17.2, 20.8, -3.47, -LIFE10.laneTop, [19, -4.5]], [21.15, 21.85, -6.05, -4.05, null]]) {
        const keep = r.chance(0.75), n = r.int(2, 3), K = knot((x0 + x1) / 2, (z0 + z1) / 2, see || [DOOR_X, 0], [front, offerers], { air: true });
        for (let k = 0; k < n; k++) one(r, front, K, r.range(x0, x1), r.range(z0, z1), PORCH_Y, (x, z) => keep && !full() && porchFree(x, z), 'porch');
      } }
    // (a) the top step between the columns: a ring in each gap
    { const r = mk('front-top');
      for (const sd of [-1, 1]) for (const gap of FRONT_GAPS) {
        const n = r.int(3, 4), K = knot(r.range(30.6, 31.15), sd * (gap[0] + gap[1]) / 2 + r.range(-0.15, 0.15), [DOOR_X, 0], [front, offerers], { air: true }); let a = r.range(0, 6.28);
        for (let k = 0; k < n; k++) { const rad = r.range(0.5, 0.85); one(r, front, K, K.gx + Math.cos(a) * rad, K.gz + Math.sin(a) * rad, STY, (x, z) => !full() && x >= 29.95 && x <= 31.8 && z * sd >= gap[0] && z * sd <= gap[1], 'top'); a += 6.28 / n * r.range(0.6, 1.4); }
      } }
    // (a) the two lower steps beside the ramp and the ground before them: a knot stands across the treads (no more than two of it are dealt one tread)
    { const r = mk('front-steps'), n0 = r.int(6, 8);
      for (let i = 0; i < n0; i++) {
        const sd = r.chance(0.5) ? 1 : -1, gz = sd * r.range(4.9, 12.6), n = r.int(2, 4), K = knot(33.2, gz, [DOOR_X, 0], [front, offerers], { air: true }), on = [0, 0, 0];
        for (let k = 0; k < n; k++) { let tread = r.int(0, 2); const z = gz + r.range(-1.0, 1.0), xg = r.range(33.8, 35.0); if (on[tread] >= 2) tread = (tread + 1) % 3; on[tread]++;
          one(r, front, K, [xg, 33.0, 32.38][tread], z, [null, MOUND + 0.48, MOUND + 0.96][tread], (xx, zz) => !full() && Math.abs(zz) >= 4.45 && Math.abs(zz) <= 13.3, 'steps'); }
      } }
    // (b) the road under the entry: its middle line from the entry on, by metres
    const RL = roadAt.line.slice(1), cum = [0]; for (let i = 1; i < RL.length; i++) cum.push(cum[i - 1] + Math.hypot(RL[i][0] - RL[i - 1][0], RL[i][1] - RL[i - 1][1]));
    const roadPt = (m) => { let i = 1; while (i < RL.length - 1 && cum[i] < m) i++; const a = RL[i - 1], b = RL[i], l = cum[i] - cum[i - 1], t = (m - cum[i - 1]) / l; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
    const onRoad = (x, z, m) => roadAt.off(x, z) <= ROAD_HALF - 0.3 && wayGap(x, z, 0.4, 1.9) >= WAY_CLOSE && clearOf(x, z, m);
    { const r = mk('under-walkers'), nWk = r.int(LIFE10.underWalkers[0], LIFE10.underWalkers[1]);
      for (let i = 0; i < 12; i++) {
        const m0 = r.range(LIFE10.road[0], LIFE10.road[1] - 16), len = r.range(14, 30), o = 1.9 + 0.4 * underWalkers.length + r.range(0, 0.01), dir = r.chance(0.5), speed = r.range(1.0, 1.4), phase = r(), h = r.range(PEOPLE_H[0], PEOPLE_H[1]), look = r.int(0, 5);
        if (underWalkers.length >= nWk) continue;
        const m1 = Math.min(m0 + len, LIFE10.road[1]), pts = [], n = Math.round(m1 - m0);
        for (let k = 0; k <= n; k++) { const q = roadPt(lerp(m0, m1, k / n)); pts.push([q[0] - q[3] * o, 0, q[1] + q[2] * o]); }
        for (let k = 1; k < 5; k++) { const q = roadPt(m1), a = k / 5 * Math.PI; pts.push([q[0] - q[3] * o * Math.cos(a) + q[2] * o * Math.sin(a), 0, q[1] + q[2] * o * Math.cos(a) + q[3] * o * Math.sin(a)]); }
        for (let k = n; k >= 0; k--) { const q = roadPt(lerp(m0, m1, k / n)); pts.push([q[0] + q[3] * o, 0, q[1] - q[2] * o]); }
        for (let k = 1; k < 5; k++) { const q = roadPt(m0), a = k / 5 * Math.PI; pts.push([q[0] + q[3] * o * Math.cos(a) - q[2] * o * Math.sin(a), 0, q[1] - q[2] * o * Math.cos(a) - q[3] * o * Math.sin(a)]); }
        if (dir) pts.reverse();
        if (pts.every((q) => onRoad(q[0], q[2], 0.75))) underWalkers.push({ course: closedCourse(pts), speed, phase, h, look, kind: 'walker' });
      } }
    for (const b of underWalkers) for (const q of b.course.pts) beats.push([q[0], q[2]]);
    { const r = mk('under-people'), n0 = r.int(LIFE10.underKnots[0], LIFE10.underKnots[1]);
      for (let i = 0; i < n0; i++) {
        const q = roadPt(r.range(LIFE10.road[0], LIFE10.road[1])), o = r.range(-0.4, 0.4), n = r.int(2, 4), K = knot(q[0] - q[3] * o, q[1] + q[2] * o, [FRONT_X, 0], [under]); let a = r.range(0, 6.28);
        for (let k = 0; k < n; k++) { const rad = r.range(0.4, 0.8); one(r, under, K, K.gx + Math.cos(a) * rad, K.gz + Math.sin(a) * rad, null, (x, z) => onRoad(x, z, 0.6), 'road'); a += 6.28 / n * r.range(0.6, 1.4); }
      } }
    // (c) the ground before the temple (see GROUND10): the walkers toward the ramp's foot first, then the knots
    if (R5_STEP10C) {
      yield;
      // (the cheap tests first. The whole of (c) lies within x <= GROUND10.east and z <= -GROUND10.off: COUNTED over that region every 0.25 m,
      // the stadium's road's middle is 8.10 m and more from it, the sacred way's 7.31 m and more square to its line (7.33 m by the deal's
      // own measure, |z - wayZ(x)|; both at the corner x 56, z -7.4), so live's rule of the ways (STAND_OFF 5.5,
      // ROAD_OFF 4.0) holds at every place of it, and (b)'s people, who stand on the road, are never near; the lens's line from the ramp's
      // foot to the door lies on the temple's axis, from which GROUND10.off keeps them farther than WAY_CLOSE; the way in is measured)
      const nearBeats = beats.filter((q) => q[0] <= GROUND10.east + 1 && q[1] <= -GROUND10.off + 1), offNear = (x, z, m) => nearBeats.every((q) => Math.hypot(q[0] - x, q[1] - z) > m);
      const open = (x, z, m) => z <= -GROUND10.off && x <= GROUND10.east && (x >= 33.32 + GROUND10.steps || z <= -15.1 - GROUND10.steps) && clearOf(x, z, m) && R.inAltis(x, z) && !R.inMass(x, z, 2.5) && !R.nearAltar(x, z, 3.2) && Math.hypot(x - PILLAR.x, z - PILLAR.z) > 3
        && wayGap(x, z, 0, 1e3) >= WAY_CLOSE && offOfferers(x, z, 0.9) && front.every((q) => Math.hypot(q.x - x, q.z - z) > 0.8);
      { const r = mk('ground-walkers'), nWk = r.int(LIFE10.groundWalkers[0], LIFE10.groundWalkers[1]);
        for (let i = 0; i < 900; i++) {
          if (i % 150 === 149) yield;
          const nx = r.range(36.5, 52.5), nz = -(GROUND10.off + r.range(1.0, 5.5)), bear = r.range(-0.6, 1.3), reach = r.range(11, 30), fx = nx - Math.sin(bear) * reach, fz = nz - Math.cos(bear) * reach, dir = r.chance(0.5), speed = r.range(1.0, 1.4), phase = r(), h = r.range(PEOPLE_H[0], PEOPLE_H[1]), look = r.int(0, 5);
          if (groundWalkers.length >= nWk || !open(nx, nz, 0.75) || !open(fx, fz, 0.75) || !open((nx + fx) / 2, (nz + fz) / 2, 0.75)) continue;   // (its two ends and its middle are tried before the whole beat)
          const len = Math.hypot(nx - fx, nz - fz), ux = (nx - fx) / len, uz = (nz - fz) / len, o = 0.45, n = Math.round(len), pts = [];
          for (let k = 0; k <= n; k++) pts.push([lerp(fx, nx, k / n) - uz * o, 0, lerp(fz, nz, k / n) + ux * o]);
          for (let k = 1; k < 5; k++) { const a = k / 5 * Math.PI; pts.push([nx - uz * o * Math.cos(a) + ux * o * Math.sin(a), 0, nz + ux * o * Math.cos(a) + uz * o * Math.sin(a)]); }
          for (let k = n; k >= 0; k--) pts.push([lerp(fx, nx, k / n) + uz * o, 0, lerp(fz, nz, k / n) - ux * o]);
          for (let k = 1; k < 5; k++) { const a = k / 5 * Math.PI; pts.push([fx + uz * o * Math.cos(a) - ux * o * Math.sin(a), 0, fz - ux * o * Math.cos(a) - uz * o * Math.sin(a)]); }
          if (dir) pts.reverse();
          if (pts.every((q, k) => k % 6 || (open(q[0], q[2], 0.75) && offNear(q[0], q[2], 0.7))) && pts.every((q) => open(q[0], q[2], 0.75) && offNear(q[0], q[2], 0.7))) { groundWalkers.push({ course: closedCourse(pts), speed, phase, h, look, kind: 'walker' }); for (const q of pts) { beats.push([q[0], q[2]]); nearBeats.push([q[0], q[2]]); } }   // (every sixth place first, then all)
        } }
      { const r = mk('ground-people'), goal = r.int(LIFE10.ground[0] + 2, LIFE10.ground[1]);
        for (let i = 0; i < 60; i++) {
          const pick = r.int(0, 3), fi = i < 3 ? 0 : i < 9 ? 1 + i % 3 : pick, Fd = GROUND10.fields[fi], gx = r.range(Fd[0], Fd[1]), gz = r.range(Fd[2], Fd[3]), n = r.int(2, 4), kn = [], K = knot(gx, gz, [FRONT_X, 0], [ground, kn]); let a = r.range(0, 6.28);
          for (let k = 0; k < n; k++) {
            const rad = r.range(0.5, 1.2), q = one(r, kn, K, gx + Math.cos(a) * rad, gz + Math.sin(a) * rad, null, (x, z) => x >= Fd[0] - 0.9 && x <= Fd[1] + 0.9 && z >= Fd[2] - 0.3 && z <= Fd[3] + 0.3 && open(x, z, 0.6) && offNear(x, z, 0.8) && ground.every((p) => Math.hypot(p.x - x, p.z - z) > 0.55), 'ground');
            if (q) q.box = fi === 0; a += 6.28 / n * r.range(0.6, 1.4);
          }
          if (kn.length >= 2 && ground.length < goal && ground.length + kn.length <= LIFE10.ground[1] && !(i > 0 && i < 3 && ground.length)) ground.push(...kn);
        } }
    }
  }
  return { kites, swallows, walkers, people, offerers, front, frontWalkers, under, underWalkers, ground, groundWalkers };
}

// The still figures inside the room: a handful at most, whatever the visit's density. The room has two kinds of standing place: the open
// floor before the barrier (in the bay between the two lower columns east of it, on either side) and the galleries' east ends (at the rail
// between the upper columns, from the door wall to the second upper column); no one stands beside the great door's opening. Each kind deals
// its stands from a stream of its own, every draw of a candidate taken before it is tried. No one stands nearer the room's axis than AISLE
// (the lens's greatest distance from the axis there, |DRIFT|, plus 2 m of clear air, plus BODY, a body's half breadth); none within
// IN_R + BODY of a lower column's middle (UP_R + BODY of an upper one's), nor within STAND of another. A third stream then says how many
// of the stands are filled on this visit (INSIDE_FILLED: from so many to so many) and draws a lot for every stand: the lowest lots stand.
// All look toward the god. y: 0 the floor, GALLERY the gallery's floor.
const BODY = 0.35, IN_R = 0.75, UP_R = 0.5, PIER = 0.42, AISLE = Math.abs(DRIFT) + 2 + BODY, STAND = 0.8;
const INSIDE_STANDS = { floor: 5, galleries: 3 }, INSIDE_FILLED = [3, 5];
function dealInside(seed) {
  const stands = [];
  const deal = (place, n, tries, at) => {
    const r = makeRng(hashSeed('inside ' + place + ':' + seed)); let got = 0;
    for (let i = 0; i < tries && got < n; i++) {
      const sd = r.chance(0.5) ? 1 : -1, q = at(r, sd), turn = r.range(-0.2, 0.2), fig = { h: r.range(PEOPLE_H[0], PEOPLE_H[1]), cloak: r.chance(0.6), cloth: r.int(0, 5), armR: r.pick([0, 0, 3]), armL: r.pick([0, 3]), lean: r.pick([-1, 1]) };
      if (q.ok !== false && stands.every((o) => o.y !== q.y || Math.hypot(o.x - q.x, o.z - q.z) > STAND)) { stands.push({ place, x: q.x, y: q.y, z: q.z, yaw: Math.atan2(q.z, BASE_X - 3 - q.x) + turn, ...fig }); got++; }
    }
  };
  deal('the open floor before the barrier', INSIDE_STANDS.floor, 30, (r, sd) => ({ x: r.range(IN_X[1] + IN_R + BODY, IN_X[0] - IN_R - BODY), y: 0, z: sd * r.range(AISLE, IN_Z + BODY) }));
  deal("the galleries' east ends", INSIDE_STANDS.galleries, 30, (r, sd) => { const x = r.range(IN_X[1] + UP_R + BODY, ROOM_X - PIER - BODY), z = sd * r.range(IN_Z - 0.1, IN_Z + BODY); return { x, y: GALLERY, z, ok: Math.abs(x - IN_X[0]) > UP_R + BODY }; });
  // which stands are filled: the number first, then a lot for every stand (all drawn before any is read)
  const r = makeRng(hashSeed('inside filled:' + seed)), n = r.int(INSIDE_FILLED[0], INSIDE_FILLED[1]), lots = stands.map(() => r());
  const last = lots.slice().sort((p, q) => p - q)[Math.min(n, stands.length) - 1];
  return stands.filter((q, i) => lots[i] <= last);
}

export default {
  id: 'zeus-at-olympia', name: 'The Statue of Zeus at Olympia', category: 'wonders', placeKind: 'interior',
  wonder: 'The Seven Wonders', place: 'Olympia', year: 'about AD 170', media: ['interior'], weirdness: 0.1,
  route: makeRoute, deal: dealGrove, life: dealLife, inside: dealInside, courseAt, ground: makeGround,
  site: { masses: MASSES, open: OPEN, road: roadAt.line, gateGround: ROAD.half, altar: ALTAR, pillar: PILLAR },   // the site's own places
  async build(ctx) {
    const { noise } = ctx;
    const detail = ctx.quality ? ctx.quality.detail : 1;
    const scene = new THREE.Scene();
    // THE CLOCK (tU: the flight's own seconds). The phases typed on it (the mist's drift, the oil's sheen and swell, the curtain's side
    // spans, the lit air's unevenness and its dust, the incense's threads and sheets) are numbers of the hall and the hour, the same on
    // every visit, and no seed is mixed into them: what the visitor comes to see is the one room, and a place of the line with a
    // clock gives one picture (the still tools' key); only the grove's deal, the hour's light and the people differ by the seed.
    const tU = { value: 0 }, updates = [], V2size = new THREE.Vector2();
    // the textures this world makes itself and hands to its materials only as uniforms: freed in dispose() (the engine's clearing does not see them)
    const ownTextures = [];
    const outdoor = new THREE.Group(); scene.add(outdoor);              // the grove, the far land and the temple's outside (see WHAT IS LEFT UNDRAWN)

    // ------------------------------------------------------------ the forks, all taken here before any loop
    // each kind of thing has a stream of its own, made from the world's seed and a name: nothing draws from another's
    const mk = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    const rv = mk('visit'), rSkyFork = mk('sky'), rFar = mk('far');

    // ------------------------------------------------------------ what this visit is like
    const vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare, mood = vary.mood ?? 0.5;
    // the hour changes nothing but the sun's height inside its 5 to 7 degrees (the design: the moment is fixed)
    const hourBias = vary.hour === 'dawn' ? -0.3 : vary.hour === 'golden' ? -0.15 : vary.hour === 'day' ? 0.3 : 0;
    const sunEl = clamp(rv.range(5.3, 6.7) + hourBias, 5, 7), sunOff = rv.range(-1.6, 1.6);
    const smokeLean = rv.range(0.12, 0.34) * (rv.chance(0.5) ? 1 : -1), smokeDrift = rv.range(-0.5, 0.5);
    const haze = 0.00085 + 0.00045 * mood;
    const elR = sunEl * Math.PI / 180, offR = sunOff * Math.PI / 180;
    // toward the sun: low in the east, in the door's line
    const SUN = new THREE.Vector3(Math.cos(elR) * Math.cos(offR), Math.sin(elR), Math.cos(elR) * Math.sin(offR)).normalize();
    const tanEl = Math.tan(elR);

    // ------------------------------------------------------------ sky, fog, lights
    // DAWN: the sun low and gold behind the visitor; the sky over the temple and the western hills is the one opposite the sun: deep clear blue above,
    // a dusky blue violet under it, a soft rose band over the hills; a few small clouds lit rose gold from below
    const sky = makeSky({
      rng: rSkyFork, preset: 'day', zenith: '#1c3777', mid: '#6a6498', horizon: '#e9a898', ground: '#8f8292',
      horizonPow: 11, midPow: 2.6, scatterColor: '#ffb768', scatter: 0.5, scatterPow: 7, sunElevation: sunEl, sunAzimuth: 90 + sunOff,
      sunColor: '#ffd9a0', sunSize: 1.3, sunIntensity: 9, sunGlow: 0.8,
      clouds: { coverage: 0.17 + 0.05 * mood, opacity: 0.8, scale: 0.95, lit: '#f2a886', shade: '#6a5d8a', softness: 0.3 }, clouds2: false,
    });
    scene.add(sky.object);
    await ctx.yield();
    // the far air: the hills stand dusky under the rose band
    const fogCol = C('#a895a8');
    scene.fog = new THREE.FogExp2(fogCol, haze);
    const sunCol = C('#ffc27e');
    const sun = new THREE.DirectionalLight(sunCol, 3.6);
    sun.position.copy(SUN).multiplyScalar(90).add(new THREE.Vector3(0, 10, 0));
    sun.target.position.set(0, 10, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -15.5; sc.right = 15.5; sc.bottom = -11; sc.top = 17; sc.near = 20; sc.far = 170; sc.updateProjectionMatrix();
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 1.6;
    // nothing that casts in the box moves (the temple, the god, the barrier, the curtain's cords, the still figures on the steps): the map of
    // shadows is drawn in full and kept from a frame of this world's own flight (u over 0: while the world is made ready, and while it is
    // seen through the world before, the engine draws it in parts or from another place) on which the lens is outside the room, where
    // everything that casts into the box is drawn (see WHAT IS LEFT UNDRAWN, 2; the god, left undrawn there by 3, is not in it: see the
    // head, r5 step 9). Until such a frame the map is drawn anew on every frame.
    updates.push((dt, time, camera, u) => { if (sun.shadow.autoUpdate && u > 0 && !lensInRoom(camera)) { sun.shadow.autoUpdate = false; sun.shadow.needsUpdate = true; } });
    // the room's own dark fill (see the head of this file), warm from below as the floor throws it: the only sky light three.js knows of here
    const roomFill = new THREE.HemisphereLight(C('#4c4c68'), C('#c9a884'), 0.3);
    // the soft light thrown up from the sunlit floor and from the oil: two wide lamps of no body, pointing up
    const bounceCol = C('#ffcf96');
    const upPool = new THREE.SpotLight(bounceCol, 27, 0, 1.25, 1, 2), upFloor = new THREE.SpotLight(bounceCol, 15, 0, 1.25, 1, 2);
    upPool.position.set(0.6, FLOOR + 0.25, 0); upPool.target.position.set(0.6 - 3.2, FLOOR + 10, 0);
    upFloor.position.set(10.6, FLOOR + 0.25, 0); upFloor.target.position.set(10.6 - 1.5, FLOOR + 10, 0);
    scene.add(sun, sun.target, roomFill, upPool, upPool.target, upFloor, upFloor.target);
    const place = { uSkyTop: { value: C('#8fb0e6').multiplyScalar(1.6) }, uSkyLow: { value: C('#e6b182').multiplyScalar(0.95) }, uDoorCol: { value: C('#a3a9e6').multiplyScalar(2.5) },
      uLamp: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -99, 0, 1)) }, uLampCol: { value: C('#ffb36a').multiplyScalar(0.8) }, 
      // grass, stubble and trodden earth are not a flat sheet: their small upright faces catch the low sun
      uSunRough: { value: sunCol.clone().multiplyScalar(3.6 * 0.6 / Math.PI) }, uShadeTint: { value: new THREE.Vector3(1.0, 0.97, 1.22) }, uShadeHue: { value: new THREE.Vector3(0.84, 0.82, 1.16) }, uShade: { value: null }, uShadeBox: { value: new THREE.Vector4(SHADE.x0, SHADE.z0, 1 / (SHADE.x1 - SHADE.x0), 1 / (SHADE.z1 - SHADE.z0)) },
      uStoa: { value: new THREE.Vector4(STOA_X, 5.6 + 1.9, SUN.y / SUN.x, SUN.z / SUN.x) },
      uFoot: { value: [...COLS_Z.map((z) => new THREE.Vector4(COLS_X[12], STY, z, COL_D_END / 2)), new THREE.Vector4(22.52, PORCH_Y, -2.61, 0.95), new THREE.Vector4(22.52, PORCH_Y, 2.61, 0.95)] },
      uStand: { value: [-1, 1].map((sd) => new THREE.Vector4(BURNER.x, sd * BURNER.z, 0.085, BURNER.h)) }, uBlade: { value: new THREE.Vector2(SUN.z / SUN.x, 1.1) },
      uStripCol: { value: C('#ffc88c').multiplyScalar(1.5) }, uEast: { value: C('#ffd2a0').multiplyScalar(1.5) }, uMarks: { value: null }, uWay: { value: new THREE.Vector4(WAY.x0, WAY.z0, WAY.x1, WAY.z1) }, uEarth: { value: C('#a98a62') }, uSlab: { value: C('#cfc4ad') },
      uMist: { value: new THREE.Vector4(0.035 + 0.02 * mood, 1.1, 0, 0) }, uMistSun: { value: C('#f1cfa0').multiplyScalar(0.8) }, uMistShade: { value: C('#8793b0').multiplyScalar(0.42) }, uClock: tU };
    // every material of this world's own goes through here
    const lit = (mat, key = 'std', more = null) => {
      const prev = mat.onBeforeCompile, prevKey = more && more.kit ? mat.customProgramCacheKey() : '';
      mat.onBeforeCompile = (sh, r) => {
        if (more && more.kit) prev.call(mat, sh, r);
        for (const k of Object.keys(place)) sh.uniforms[k] = place[k];
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vZW;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvec4 zwp = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nzwp = instanceMatrix * zwp;\n#endif\nvZW = (modelMatrix * zwp).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vZW;\n' + PLACE_GLSL)
          .replace('#include <lights_fragment_begin>', '#include <lights_fragment_begin>\n{ vec3 zN = inverseTransformDirection(normal, viewMatrix);\n float zo = zeusOpen(vZW) * zeusNook(vZW);\n irradiance += uSkyTop * (zN.y * 0.5 + 0.5) * zo + uSkyLow * (0.5 - 0.5 * zN.y) * min(1.0, zo * 3.0) + zeusDoor(vZW, zN) + zeusLamps(vZW, zN) + zeusStrip(vZW, zN) + zeusEast(vZW, zN) + zeusWalk(vZW, zN) + zeusBlade(vZW, zN); }')
          .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ reflectedLight.directDiffuse *= mix(1.0, zeusNook(vZW), 0.55); }');
        sh.fragmentShader = sh.fragmentShader.replace('#include <fog_fragment>', '#include <fog_fragment>\n{ float zm = zeusMist(vZW, cameraPosition); gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(uMistShade, uMistSun, zeusShade(vec3(vZW.x, 0.0, vZW.z)).b), zm); }');
        if (more && more.kit) sh.vertexShader = sh.vertexShader.replace('vec4 mvPosition = viewMatrix * fWorld;', 'vZW = fWorld.xyz;\n vec4 mvPosition = viewMatrix * fWorld;');
        if (more) (more.then || more)(sh);
      };
      mat.customProgramCacheKey = () => prevKey + 'zeus-place-' + key;
      return mat;
    };
    const std = (o, key, more) => lit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, ...o }), key, more);
    // the sun's light on a thing of the grove, cut by the painted shade (expr: which of its three kinds shade this thing)
    const shaded = (expr, rough) => (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ vec3 zs = zeusShade(vZW); float zk = ' + expr + ';' + (rough ? ' reflectedLight.directDiffuse += uSunRough * diffuseColor.rgb;' : '') + ' reflectedLight.directDiffuse *= zk; reflectedLight.directSpecular *= zk;' + (rough ? ' float zc = 1.0 - 0.6 * texture2D(uMarks, (vZW.xz - uShadeBox.xy) * uShadeBox.zw).b; reflectedLight.indirectDiffuse *= zc * mix(uShadeTint, vec3(1.0), zk); reflectedLight.directDiffuse *= zc;' : '') + ' }');
    };
    // a soft round glow with a size in METRES (its width at the place it stands), drawn at that size on any screen; uPxH is the drawing's
    // height in pixels (set each frame); breathe: how fast it breathes on a closed period
    const glowPx = { value: 450 };
    updates.push(() => { ctx.renderer.getDrawingBufferSize(V2size); glowPx.value = V2size.y; });
    const softSprite = (metres, col, clock, breathe = 0, phase = 0) => new THREE.ShaderMaterial({
      uniforms: { uPxH: glowPx, uCol: { value: col }, uSize: { value: metres }, uTime: clock, uBreathe: { value: breathe }, uPhase: { value: phase } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'uniform float uPxH; uniform float uSize; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * 0.5 * uPxH * projectionMatrix[1][1] / max(-mv.z, 0.05); }',
      fragmentShader: 'uniform vec3 uCol; uniform float uTime; uniform float uBreathe; uniform float uPhase; void main(){ float r = clamp(length(gl_PointCoord - 0.5) * 2.0, 0.0, 1.0); float a = (1.0 - r) * (1.0 - r); gl_FragColor = vec4(uCol * a * a * (1.0 + 0.12 * sin(uTime * uBreathe + uPhase)), 1.0); }',
    });
    // WHAT IS LEFT UNDRAWN, 4: a part of the grove (see PART_X) whose box lies wholly outside the picture
    const cullParts = [], frustum = new THREE.Frustum(), PV = new THREE.Matrix4();
    const part = (mesh, box) => { cullParts.push({ mesh, box, shown: true }); return mesh; };
    // the box of an instanced mesh: every instance's place, its shape's own reach about it
    const boxOf = (im) => {
      const b = new THREE.Box3(), m = new THREE.Matrix4(), c = new THREE.Vector3(), g = im.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); const r = g.boundingSphere.radius * m.getMaxScaleOnAxis() + 0.6; c.copy(g.boundingSphere.center).applyMatrix4(m); b.expandByPoint(c.clone().addScalar(r)); b.expandByPoint(c.clone().addScalar(-r)); }
      return b;
    };
    updates.push((dt, time, camera) => {
      frustum.setFromProjectionMatrix(PV.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      for (const q of cullParts) { const seen = frustum.intersectsBox(q.box); if (seen !== q.shown) { q.shown = seen; q.mesh.visible = seen; } }
    });
    const add = (geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.castShadow = !!o.cast; m.receiveShadow = o.receive !== false; if (o.order != null) m.renderOrder = o.order; if (o.mirror) m.layers.enable(1); scene.add(m); return m; };
    await ctx.yield();
    // ------------------------------------------------------------ the ground: grove floor, the temple's mound, the stadium's banks, the hill
    const { moundAt, groundY } = makeGround(noise);
    // the great river in the valley to the south, the smaller one under the western hills
    const riverZ = (x) => 292 + 46 * Math.sin(x * 0.0042 + 1.0), riverX = (z) => -268 + 24 * Math.sin(z * 0.006 + 0.4);
    // beaten earth: the way from the ramp east to the long colonnade, a cross way before the east front, a way north to the altar
    const wayDist = (x, z) => {
      let best = 99;
      for (const w of WAYS) {
        const ax = w[2] - w[0], az = w[3] - w[1], t = clamp(((x - w[0]) * ax + (z - w[1]) * az) / (ax * ax + az * az), 0, 1);
        best = Math.min(best, Math.hypot(x - w[0] - ax * t, z - w[1] - az * t) / w[4]);
      }
      // the stadium's road, beaten ROAD_HALF to either side of its middle; the path down the alley of the way in, WAY_PATH to either side
      return Math.min(best, roadAt.off(x, z) / ROAD_HALF, wayGap(x, z, 0, 99) / WAY_PATH);
    };
    {
      // a grid finer near the temple's east side, where the route comes down to head height
      const xs = [], zs = [];
      const axis = (lo, hi, fineLo, fineHi, fine, coarse) => { const out = []; let v = lo; while (v < hi) { out.push(v); const inF = v >= fineLo && v < fineHi, edge = Math.min(Math.abs(v - fineLo), Math.abs(v - fineHi)); v += inF ? fine : Math.min(coarse, fine + edge * 0.22); } out.push(hi); return out; };
      const run = (a, b, st) => { const out = []; for (let v = a; v < b - 1e-6; v += st) out.push(v); return out; };
      xs.push(...axis(-900, -112, -113, -112, 6, 90).slice(0, -1), ...run(-112, -44.8, 5.6), ...run(-44.8, 140, 3.2), ...run(140, 322, 6.5), ...axis(322, 1100, 322, 323, 6.5, 90));
      zs.push(...axis(-1000, -132, -133, -132, 6, 90).slice(0, -1), ...run(-132, -60, 6), ...run(-60, 61.6, 3.2), ...run(61.6, 91.6, 6), ...axis(91.6, 1000, 91.6, 92, 6, 90));
      const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), colr = new Float32Array(nx * nz * 3), uv = new Float32Array(nx * nz * 2), idx = [];
      const gravel = C('#cdc6b2'), straw = C('#d0bd80'), dry = C('#b0914e'), green = C('#7f8a4e'), earth = C('#a98a62'), hillG = C('#66704a'), tmp = new THREE.Color();
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const x = xs[i], z = zs[j], k = j * nx + i, y = groundY(x, z);
          pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; uv[k * 2] = x / 7; uv[k * 2 + 1] = z / 7;
          const n1 = noise.fbm2(x * 0.045, z * 0.045, 3) * 0.5 + 0.5, n2 = noise.fbm2(x * 0.011 + 9, z * 0.011, 2) * 0.5 + 0.5;
          tmp.copy(straw).lerp(dry, n1).lerp(green, clamp(n2 * 2.2 - 0.85, 0, 0.75)).multiplyScalar(0.84 + 0.3 * n1);
          tmp.lerp(earth, 0.9 * (1 - smoothstep(0.55, 1.25, wayDist(x, z))));
          tmp.lerp(earth, 0.8 * smoothstep(STOA_X + 12, STOA_X + 30, x) * (1 - smoothstep(12.5, 15.5, Math.abs(z + 46))));
          tmp.lerp(gravel, 0.9 * (1 - smoothstep(40, 62, Math.abs(z - riverZ(x)))) + 0.9 * (1 - smoothstep(22, 36, Math.abs(x - riverX(z)))));
          tmp.lerp(hillG, clamp(smoothstep(14, 36, y), 0, 0.85));
          colr[k * 3] = tmp.r; colr[k * 3 + 1] = tmp.g; colr[k * 3 + 2] = tmp.b;
        }
        if (j % 2 === 1) await ctx.yield();
      }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(idx); g.computeVertexNormals();
      await ctx.yield();
      // a grain so that near ground is never one flat tone
      const cv = document.createElement('canvas'); cv.width = cv.height = 128;
      const c2 = cv.getContext('2d'), im = c2.createImageData(128, 128), rg = rFar.fork('grain');
      for (let i = 0; i < 128 * 128; i++) { const v = 196 + Math.floor(rg() * 59) - (rg() < 0.06 ? 60 : 0); im.data[i * 4] = v; im.data[i * 4 + 1] = v; im.data[i * 4 + 2] = v - 6; im.data[i * 4 + 3] = 255; }
      c2.putImageData(im, 0, 0);
      const grain = new THREE.CanvasTexture(cv); grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.colorSpace = THREE.SRGBColorSpace; grain.anisotropy = 4;
      // the grove's floor is no lawn: dry grass in broken tones, worn to the earth in patches and round every base, fallen leaves under the
      // planes, and down the sacred way large worn slabs; what is finer than a pixel is left to its mean (the ground's own metres to a pixel)
      const groundMore = (sh) => {
        shaded(SHADE_GROUND, true)(sh);   // (r5 step 2c)
        sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec2 q = vZW.xz; float fw = max(fwidth(q.x), fwidth(q.y));
          float n1 = zeusVal(q * 0.17), n2 = zeusVal(q * 0.63 + 7.3), n3 = zeusVal(q * 2.7 + 3.1) * (1.0 - smoothstep(0.12, 0.5, fw)) + 0.5 * smoothstep(0.12, 0.5, fw);
          vec4 mk = texture2D(uMarks, (q - uShadeBox.xy) * uShadeBox.zw);
          vec3 zs0 = zeusShade(vZW); float zk0 = ${SHADE_GROUND.replaceAll('zs.', 'zs0.')};   // (r5 step 2c)
          vec3 c = diffuseColor.rgb * (0.82 + 0.3 * n1) * (0.9 + 0.2 * n3);
          c = mix(c, c * vec3(1.1, 1.0, 0.8), smoothstep(0.4, 0.75, n2));
          { float zp = zeusVal(q * 0.31 + 11.0) * 0.6 + zeusVal(q * 0.09 + 4.0) * 0.4; c = mix(c * vec3(1.08, 0.98, 0.7), c * vec3(0.86, 0.96, 0.76), smoothstep(0.42, 0.62, zp)) * (0.86 + 0.3 * zeusVal(q * 1.1 + 2.0)); }
          float worn = clamp(mk.g + 0.7 * smoothstep(0.6, 0.78, n1 * 0.55 + n2 * 0.45), 0.0, 1.0);
          c = mix(c, uEarth * (0.86 + 0.28 * n3), worn * 0.85);
          float fine = 1.0 - smoothstep(0.04, 0.16, fw), lh = zeusHash(floor(q * 5.5)), lk = mk.r * 0.6;
          c = mix(c, mix(vec3(0.3, 0.2, 0.07), vec3(0.5, 0.36, 0.1), zeusHash(floor(q * 5.5) + 3.7)), 0.85 * mix(lk, step(lh, lk), fine));
          // the sacred way: slabs about 1.9 by 1.3 m in four rows, each row's joints shifted, worn and dusty at their edges
          vec2 wd = uWay.zw - uWay.xy; float wl = length(wd); wd /= wl;
          float a = dot(q - uWay.xy, wd), b = dot(q - uWay.xy, vec2(-wd.y, wd.x));
          float inWay = step(0.0, a) * step(a, wl) * (1.0 - smoothstep(2.5, 2.7, abs(b) + 0.25 * (n2 - 0.5)));
          float row = floor(b / 1.3 + 2.0), along = a / 1.9 + zeusHash(vec2(row, 5.0)) ;
          vec2 cell = vec2(floor(along), row), f = vec2(fract(along) * 1.9, fract(b / 1.3 + 2.0) * 1.3);
          float joint = min(min(f.x, 1.9 - f.x), min(f.y, 1.3 - f.y));
          float jw = max(0.035, fw * 0.7), jk = (1.0 - smoothstep(jw * 0.5, jw * 1.5, joint)) * min(1.0, 0.05 / max(fw, 0.012));
          vec3 slab = uSlab * (0.8 + 0.3 * zeusHash(cell)) * (0.92 + 0.16 * n3);
          slab = mix(slab, uEarth, 0.5 * smoothstep(0.45, 0.8, n2) + 0.25 * (1.0 - smoothstep(0.0, 0.3, joint)));
          slab = mix(slab, slab * 0.5, jk * 0.8);
          c = mix(c, slab, inWay);
          // in the shade the ground is lit by the sky alone: its own ochre goes dusky, toward the blue violet of the high sky
          diffuseColor.rgb = mix(mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))) * uShadeHue, c, 0.4), c, zk0);
        }`);
      };
      add(g, std({ map: grain, roughness: 0.96 }, 'ground', groundMore), { order: 2 });
    }
    await ctx.yield();

    // ------------------------------------------------------------ the temple outside: steps, ramp, the 34 columns, beam, band, cornice, gables, roof
    const STUCCO = C('#ece5d6'), STUCCO_D = C('#d9d0be'), MARBLE = C('#f1ede4'), RED = C('#a23a2a'), BLUE = C('#2f4f8f'), LIME = C('#cdbf9f'), TILE = C('#e6e0d2'), TILE_L = C('#f0ebdf'), BLUE_DEEP = C('#14224a'), GABLE_BLUE = C('#3b5787');
    // The temple's laid and painted work, drawn by place on its stone: the sunk coffers of the stone ceilings over the walk and the porches; the
    // inner building's walls (a dado course DADO high, courses COURSE high above it, upright joints breaking bond, each stone a little of its
    // own tone); under the porches' ceilings a painted band (a red stripe and a blue one, colour only); a row of hanging leaves, red and blue
    // by turns, on the cornice's lower moulding and a row of upright ones on the gutter. A line thinner than a pixel is drawn by its share of it.
    const COFFER = 1.3, COURSE = 0.56, DADO = 1.12, STONE_LEN = 1.5, G = (v) => v.toFixed(3);
    const templePaint = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 zn = inverseTransformDirection(normalize(vNormal), viewMatrix), zp = vZW; vec2 za = abs(zp.xz);
        if (zn.y < -0.5 && abs(zp.y - ${G(Y_CORNICE)}) < 0.06 && za.x < 32.95 && za.y < 14.75) {
          vec2 cq = zp.xz / ${G(COFFER)}, cf = abs(fract(cq) - 0.5), cw = fwidth(cq); float aa = max(cw.x, cw.y) + 1e-4, cm = max(cf.x, cf.y);
          diffuseColor.rgb *= mix(mix(0.5, 0.72, smoothstep(0.22 - aa, 0.22 + aa, cm)), 1.0, smoothstep(0.35 - aa, 0.35 + aa, cm));
        }
        float onZ = step(abs(za.y - ${G(ROOM_Z)}), 0.03) + step(abs(za.y - ${G(CELLA_Z)}), 0.03), onX = step(abs(za.x - ${G(ROOM_X)}), 0.03) + step(abs(za.x - ${G(DOOR_X)}), 0.03) + step(abs(za.x - ${G(CELLA_X)}), 0.03);
        float wall = min(1.0, onZ * step(0.5, abs(zn.z)) + onX * step(0.5, abs(zn.x))) * step(za.x, ${G(CELLA_X + 0.05)}) * step(za.y, ${G(CELLA_Z + 0.05)}) * step(${G(STY - 0.02)}, zp.y);
        if (wall > 0.5) {
          float along = abs(zn.z) > 0.5 ? zp.x : zp.z, h = zp.y - ${G(PORCH_Y)}, fh = fwidth(h) + 1e-4, fa = fwidth(along) + 1e-4, up = step(${G(DADO)}, h);
          float course = (h - ${G(DADO)}) / ${G(COURSE)}, row = floor(course), dj = (0.5 - abs(fract(course) - 0.5)) * ${G(COURSE)};
          float bond = along / mix(${G(2 * STONE_LEN)}, ${G(STONE_LEN)}, up) + 0.5 * mod(row, 2.0) * up, du = (0.5 - abs(fract(bond) - 0.5)) * mix(${G(2 * STONE_LEN)}, ${G(STONE_LEN)}, up);
          float wl = max(0.005, 0.5 * fh), wu = max(0.005, 0.5 * fa);
          float level = (1.0 - smoothstep(wl, wl + fh, min(dj, abs(h - ${G(DADO)}) + (1.0 - up) * 9.0))) * min(1.0, 0.012 / fh) * step(-0.01, h);
          float upright = (1.0 - smoothstep(wu, wu + fa, du)) * min(1.0, 0.012 / fa) * step(0.0, h);
          float tone = fract(sin(dot(vec2(row * up + 7.0, floor(bond)), vec2(12.9898, 78.233))) * 43758.5453);
          diffuseColor.rgb *= (0.94 + 0.09 * tone) * mix(0.9, 1.0, up) * (1.0 - 0.24 * max(level, upright));
          float porchIn = min(1.0, step(${G(DOOR_X - 0.05)}, za.x) * step(za.y, ${G(ROOM_Z + 0.03)}) + step(${G(CELLA_X - 0.03)}, za.x));
          // the stucco's small unevenness; in the porches the dado's crowning moulding (a pale fillet over a line of shade) and over it a
          // painted band at a standing man's shoulder (a red stripe, a thin blue one: colour only)
          float zu = zeusVal(vec2(along * 0.9, h * 0.7) + 3.7), zu2 = zeusVal(vec2(along * 4.3, h * 3.9));
          diffuseColor.rgb *= 0.955 + 0.06 * zu + 0.03 * zu2; diffuseColor.b *= 0.97 + 0.05 * (1.0 - zu);
          float dm = h - ${G(DADO)};
          float fillet = smoothstep(-0.075 - fh, -0.075 + fh, dm) * (1.0 - smoothstep(-0.005 - fh, -0.005 + fh, dm)), under = smoothstep(-0.115 - fh, -0.115 + fh, dm) * (1.0 - smoothstep(-0.075 - fh, -0.075 + fh, dm));
          diffuseColor.rgb *= (1.0 + 0.1 * fillet * porchIn) * (1.0 - 0.3 * under * porchIn);
          float red2 = smoothstep(0.1 - fh, 0.1 + fh, dm) * (1.0 - smoothstep(0.27 - fh, 0.27 + fh, dm)), blue2 = smoothstep(0.33 - fh, 0.33 + fh, dm) * (1.0 - smoothstep(0.4 - fh, 0.4 + fh, dm));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${RED.r.toFixed(3)}, ${RED.g.toFixed(3)}, ${RED.b.toFixed(3)}), 0.8 * red2 * porchIn);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${BLUE.r.toFixed(3)}, ${BLUE.g.toFixed(3)}, ${BLUE.b.toFixed(3)}), 0.8 * blue2 * porchIn);
          float b = ${G(Y_CORNICE)} - zp.y, red = smoothstep(0.12 - fh, 0.12 + fh, b) * (1.0 - smoothstep(0.4 - fh, 0.4 + fh, b)), blue = smoothstep(0.47 - fh, 0.47 + fh, b) * (1.0 - smoothstep(0.66 - fh, 0.66 + fh, b));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${RED.r.toFixed(3)}, ${RED.g.toFixed(3)}, ${RED.b.toFixed(3)}), 0.88 * red * porchIn);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${BLUE.r.toFixed(3)}, ${BLUE.g.toFixed(3)}, ${BLUE.b.toFixed(3)}), 0.88 * blue * porchIn);
        }
        float outZ = step(14.6, za.y) * step(0.5, abs(zn.z)), outX = step(32.8, za.x) * step(0.5, abs(zn.x));
        if (outZ + outX > 0.5 && zp.y > ${G(Y_CORNICE - 0.01)} && zp.y < ${G(Y_EAVE + 0.31)}) {
          float along = outZ > 0.5 ? zp.x : zp.z, fa = fwidth(along) + 1e-4;
          // a leaf: broad at its foot (v 0), round to its tip (v 1)
          float u1 = along / 0.26, v1 = (${G(Y_CORNICE + 0.21)} - zp.y) / 0.2, a1 = 2.0 * fa / 0.26;
          float l1 = (1.0 - smoothstep(0.84 * (1.0 - v1 * v1) - a1, 0.84 * (1.0 - v1 * v1) + a1, abs(fract(u1) - 0.5) * 2.0)) * step(0.0, v1) * step(v1, 1.0);
          float u2 = along / 0.43, v2 = (zp.y - ${G(Y_EAVE + 0.03)}) / 0.24, a2 = 2.0 * fa / 0.43;
          float l2 = (1.0 - smoothstep(0.84 * (1.0 - v2 * v2) - a2, 0.84 * (1.0 - v2 * v2) + a2, abs(fract(u2) - 0.5) * 2.0)) * step(0.0, v2) * step(v2, 1.0) * outZ;
          vec3 zr = vec3(${RED.r.toFixed(3)}, ${RED.g.toFixed(3)}, ${RED.b.toFixed(3)}), zb = vec3(${BLUE.r.toFixed(3)}, ${BLUE.g.toFixed(3)}, ${BLUE.b.toFixed(3)});
          diffuseColor.rgb = mix(diffuseColor.rgb, mod(floor(u1), 2.0) < 0.5 ? zr : zb, 0.82 * l1);
          diffuseColor.rgb = mix(diffuseColor.rgb, mod(floor(u2), 2.0) < 0.5 ? zb : zr, 0.82 * l2);
        }
        // the barrier's blue face toward the door: matt paint on stone, brushed a little unevenly, a shade deeper toward the floor
        if (abs(zp.x - ${G(BARRIER_X + BARRIER_T + 0.012)}) < 0.004 && zn.x > 0.5 && za.y < ${G(IN_Z)}) {
          float zb1 = zeusVal(vec2(zp.z * 2.1, zp.y * 1.3) + 9.0), zb2 = zeusVal(vec2(zp.z * 0.9, zp.y * 14.0));
          diffuseColor.rgb *= (0.86 + 0.2 * zb1) * (0.95 + 0.08 * zb2) * (0.86 + 0.14 * smoothstep(${G(FLOOR + 0.15)}, ${G(FLOOR + 0.7)}, zp.y));
        }
        // the barrier's paintings: nine pairs of standing figures, flat and soft, in a few earth colours on a dark red ground with an ochre
        // border. Three pairs on each side barrier (one to a bay, on the face toward the pool) and three on the front barrier's face toward
        // the god: one on each half, the third pair standing one figure either side of the gateway. The face toward the door is plain blue.
        float by = zp.y - ${G(FLOOR)};
        float sideFace = step(abs(za.y - ${G(IN_Z - 0.11)}), 0.02) * step(0.5, abs(zn.z)) * step(0.0, -zn.z * zp.z) * step(${G(IN_X[4] + 0.7)}, zp.x) * step(zp.x, ${G(IN_X[1] - 0.7)});
        float frontFace = step(abs(zp.x - ${G(BARRIER_X)}), 0.02) * step(0.5, -zn.x) * step(${G(GATE_HALF)}, za.y) * step(za.y, ${G(IN_Z - 0.6)});
        if (sideFace + frontFace > 0.5 && by > 0.0 && by < ${G(BARRIER_H)}) {
          float bay = (zp.x - ${G(IN_X[4])}) / ${G(IN_X[3] - IN_X[4])}, us = (fract(bay) - 0.5) * ${G(IN_X[3] - IN_X[4])}, uf = za.y - ${G((GATE_HALF + IN_Z - 0.6) / 2)};
          float u = mix(us, uf, frontFace), hw = mix(${G((IN_X[3] - IN_X[4]) / 2 - 0.7)}, ${G((IN_Z - 0.6 - GATE_HALF) / 2)}, frontFace), aa = fwidth(u) + fwidth(by) + 1e-4;
          float id = mix(floor(bay) + 3.0 * step(0.0, zp.z), 7.0 + step(0.0, zp.z), frontFace);
          float inner = min(hw - 0.07 - abs(u), min(by - 0.1, ${G(BARRIER_H - 0.08)} - by));
          vec3 pc = mix(vec3(0.5, 0.39, 0.2), vec3(0.2, 0.085, 0.06), smoothstep(-aa, aa, inner));
          // the pair: on a side bay 0.38 m either side of its middle; on the front the pair stands toward the wall, the single figure by the gate
          float x1 = mix(-0.38, -0.02, frontFace), x2 = mix(0.38, 0.6, frontFace);
          float f1 = zeusFig(vec2(u - x1, by - 0.16), aa), f2 = zeusFig(vec2(u - x2, by - 0.16), aa), f3 = zeusFig(vec2(u + 0.64, by - 0.16), aa) * frontFace;
          float line = frontFace * (1.0 - smoothstep(0.012, 0.012 + aa, abs(u + 0.33))) * step(0.1, by) * step(by, ${G(BARRIER_H - 0.08)});
          vec3 pale = vec3(0.56, 0.43, 0.27), umber = vec3(0.36, 0.2, 0.11), green = vec3(0.27, 0.29, 0.17);
          float k = fract(id * 0.37 + 0.2);
          pc = mix(pc, k < 0.5 ? pale : green, f1 * 0.9); pc = mix(pc, k < 0.33 ? umber : pale, f2 * 0.9); pc = mix(pc, umber, f3 * 0.9); pc = mix(pc, vec3(0.5, 0.39, 0.2), line);
          diffuseColor.rgb = pc;
        }
      }`).replace('void main() {', `// a standing figure for a painted panel: feet at 0, 0.78 m high (a garment's oval, a head, two legs); 1 on it, soft at its edge
      float zeusFig(vec2 q, float aa) {
        float body = length((q - vec2(0.0, 0.42)) / vec2(0.105, 0.26)) - 1.0, head = (length(q - vec2(0.0, 0.73)) - 0.055) / 0.055;
        float legs = max(abs(abs(q.x) - 0.04) - 0.022, abs(q.y - 0.1) - 0.1) / 0.03;
        return 1.0 - smoothstep(-0.05, 0.12 + 6.0 * aa, min(min(body, head), legs));
      }
      void main() {`);
    };
    const stone = std({ roughness: 0.78 }, 'temple', templePaint);
    // laid stone: slabs drawn by place (their joints, and each slab's small difference of tone), fading out where a joint is thinner than a pixel
    const slabs = (size, base, amp, joint) => (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ vec2 zq = vZW.xz / ' + size.toFixed(3) + ' + vec2(0.37, 0.5); vec2 zg = abs(fract(zq) - 0.5); vec2 zw = fwidth(zq); float zj = max(smoothstep(0.5 - 0.012 - zw.x, 0.5 - 0.004, zg.x), smoothstep(0.5 - 0.012 - zw.y, 0.5 - 0.004, zg.y)) * clamp(1.0 - 3.0 * max(zw.x, zw.y), 0.0, 1.0); vec2 zc = floor(zq); float zh = fract(sin(dot(zc, vec2(12.9898, 78.233))) * 43758.5453); diffuseColor.rgb *= (' + base.toFixed(3) + ' + ' + amp.toFixed(3) + ' * zh) * (1.0 - ' + joint.toFixed(3) + ' * zj); }');
    };
    // a worn stone floor is no flat sheet: its grain catches the low sun, so that where the sun lies on a LEVEL floor it lies bright (GRAZE: by how
    // much); the ramp, tilted to the sun, takes the sun's light as it is
    const GRAZE = 2.5, grazed = (inner) => (sh) => {
      inner(sh);
      sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ reflectedLight.directDiffuse *= 1.0 + ' + GRAZE.toFixed(2) + ' * smoothstep(0.985, 0.998, inverseTransformDirection(normal, viewMatrix).y); }');
    };
    // r5 C2, THE SHADE OF A BODY ON OPEN PAVING (see the head): where the sun's map shades the paving's upward faces under the open sky
    // (east of the roof's edge. A FIGURE TYPED TWICE: zeusOpen's four figures of that edge, 32.9, 14.7, -0.8 and 3.6, are typed again in
    // the line below and not read from zeusOpen: who changes one changes the other) the paving takes the air's light as an upright face of it does (half the
    // sky above, half the warm low sky): the shade has the tone of the ramp's side walls' own shaded faces and not the open sky's blue.
    // (zsh: the share of the sun the map takes away, read from the sun's own light after three.js has cut it by the map.)
    const paveShade = (inner) => (sh) => {
      inner(sh);
      if (R5_C2) sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', '#include <lights_fragment_begin>\n#if NUM_DIR_LIGHT_SHADOWS > 0\n{ vec3 zN = inverseTransformDirection(normal, viewMatrix); float zsh = 1.0 - clamp(directLight.color.r / max(directionalLights[0].color.r, 1e-4), 0.0, 1.0);\n float zo = zeusOpen(vZW) * zeusNook(vZW), zw = zsh * max(zN.y, 0.0) * (1.0 - smoothstep(-0.8, 3.6, min(32.9 - abs(vZW.x), 14.7 - abs(vZW.z))));\n irradiance += zw * 0.5 * (uSkyLow * min(1.0, zo * 3.0) - uSkyTop * zo); }\n#endif');
    };
    const pave = std({ roughness: 0.78 }, 'pave', paveShade(grazed(slabs(1.45, 0.95, 0.09, 0.26))));
    {
      const parts = [];
      parts.push(box(-33.32, MOUND - 0.6, -15.10, 33.32, MOUND + 0.48, 15.10, LIME), box(-32.69, MOUND + 0.48, -14.47, 32.69, MOUND + 0.96, 14.47, LIME), box(-32.06, MOUND + 0.96, -13.84, 32.06, STY, 13.84, STUCCO_D));
      // the ramp to the middle of the east front: 7 m wide, from the ground at x 55 to the top step
      const ramp = new THREE.BufferGeometry(), r0 = 55, r1 = 32.06, hw = 3.5;
      ramp.setAttribute('position', new THREE.Float32BufferAttribute([r0, 0, -hw, r0, 0, hw, r1, STY, hw, r1, STY, -hw, r0, -0.5, -hw, r0, -0.5, hw, r1, -0.5, hw, r1, -0.5, -hw], 3));
      ramp.setIndex([0, 2, 1, 0, 3, 2, 1, 6, 5, 1, 2, 6, 4, 3, 0, 4, 7, 3]);
      const rampN = ramp.toNonIndexed(); rampN.computeVertexNormals(); rampN.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(rampN.attributes.position.count * 2), 2)); ramp.dispose();
      parts.push(paint(rampN, LIME));
      // low side walls of the ramp
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const xa = 55 - i * 3.82, xb = xa - 3.82; parts.push(box(xb, -0.4, s * 3.5, xa, rampY(xb) + 0.45, s * 3.95, STUCCO_D)); }
      add(merged(parts), pave, { cast: false });
    }
    // one column drawn 34 times: 20 flutes, a swelling taper, three rings, the cushion and the square slab
    const columnGeo = (d0, d1, h, capW, segs, ringCol) => {
      const shaftH = h * 0.893, echH = h * 0.052, r0 = d0 / 2, r1 = d1 / 2, list = [];
      const ST = [0, 0.33, 0.66, 0.955, 0.956, 0.989, 0.99, 1], nh = ST.length - 1;
      const sh = new THREE.CylinderGeometry(1, 1, 1, segs, nh, true), p = sh.attributes.position, cl = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const row = Math.round((p.getY(i) + 0.5) * nh), t = ST[row], a = Math.atan2(p.getZ(i), p.getX(i)), fl = Math.abs(Math.sin(a * 10));
        const r = (lerp(r0, r1, t) + 0.012 * d0 * Math.sin(Math.PI * t)) * (1 - 0.045 * fl);
        p.setXYZ(i, Math.cos(a) * r, t * shaftH, Math.sin(a) * r);
        const ring = row === 4 || row === 5 ? 1 : 0, cc = ring ? ringCol : STUCCO;
        cl[i * 3] = cc.r; cl[i * 3 + 1] = cc.g; cl[i * 3 + 2] = cc.b;
      }
      sh.setAttribute('color', new THREE.BufferAttribute(cl, 3)); sh.computeVertexNormals(); list.push(sh);
      // aFl: x 1 on the shaft (the flutes are drawn there), y how far up the shaft (0 its foot, 1 its top; 2 on the capital)
      const mark = (g, v) => { const n = g.attributes.position.count, a = new Float32Array(n * 2), q = g.attributes.position; for (let i = 0; i < n; i++) { a[i * 2] = v; a[i * 2 + 1] = v ? q.getY(i) / shaftH : 2; } g.setAttribute('aFl', new THREE.BufferAttribute(a, 2)); return g; };
      mark(sh, 1);
      const prof = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5; prof.push(new THREE.Vector2(lerp(r1, capW * 0.49, Math.pow(t, 0.62)), shaftH + echH * t)); }
      list.push(mark(paint(new THREE.LatheGeometry(prof, 28), STUCCO), 0));
      list.push(mark(box(-capW / 2, shaftH + echH, -capW / 2, capW / 2, h, capW / 2, STUCCO), 0));
      return merged(list);
    };
    // the columns' twenty flutes take the light: across each flute the face turns from one sharp edge to the next (the same shape the shaft
    // is modelled to, drawn finer), so a low light lays a soft shade line down every flute; finer than a pixel it fades to the plain round.
    // THE STONE'S FORM, drawn by the place on the shaft (the same from wherever it is seen): each flute a shade deeper toward its two
    // sharp edges and the edge itself a fine pale line; the drums' joints faint lines, each drum a little of its own tone; the white
    // stucco a little uneven and warmer in patches; a shade gathering under the capital. (The shade at the shaft's foot is the east end's
    // nooks': zeusNook.)
    const DRUMS = 7;
    const stucco = std({ roughness: 0.62 }, 'column', (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 aFl; varying vec4 vFl; varying float vFlId; varying vec2 vFlOut;').replace('#include <begin_vertex>', `#include <begin_vertex>
vFl = vec4(position.x, position.z, aFl.x, aFl.y);
#ifdef USE_INSTANCING
vFlId = instanceMatrix[3].x * 0.371 + instanceMatrix[3].z * 0.613;
{ vec2 zc = instanceMatrix[3].xz; vFlOut = abs(zc.x) < 15.0 ? vec2(0.0) : (abs(zc.x) / 30.89 >= abs(zc.y) / 12.62 ? vec2(sign(zc.x), 0.0) : vec2(0.0, sign(zc.y))); }
#else
vFlId = 0.0; vFlOut = vec2(0.0);
#endif`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vFl; varying float vFlId; varying vec2 vFlOut;')
        .replace('#include <color_fragment>', `#include <color_fragment>
{ float za = atan(vFl.y, vFl.x + 1e-6) * 10.0, zf = abs(sin(za)), zw = min(fwidth(za), 3.0), zk = step(0.5, vFl.z) * (1.0 - smoothstep(0.5, 1.5, zw));
  float zband = 1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.8, zf)), zline = 0.13 * (1.0 - smoothstep(0.03, 0.09 + zw, zf));
  diffuseColor.rgb *= mix(0.925, zband + zline, zk);
  if (vFl.w < 1.5) {
    float zd = vFl.w * ${DRUMS.toFixed(1)}, zdw = fwidth(zd) + 1e-5, zj = 0.5 - abs(fract(zd) - 0.5);
    float zjl = (1.0 - smoothstep(0.004, 0.004 + zdw, zj)) * min(1.0, 0.012 / zdw) * step(0.5, zd) * step(zd, ${(DRUMS - 0.5).toFixed(1)});
    float ztone = fract(sin((floor(zd) + 1.0) * 12.9898 + floor(vFlId * 7.0 + 0.5) * 78.233) * 43758.5453);
    float zu = zeusVal(vec2(za * 0.35 + vFlId, vZW.y * 1.3)), zu2 = zeusVal(vec2(za * 1.9 + vFlId * 3.0, vZW.y * 6.1));
    diffuseColor.rgb *= (1.0 - 0.2 * zjl) * (0.975 + 0.05 * ztone) * (0.95 + 0.07 * zu + 0.035 * zu2) * (1.0 - 0.26 * smoothstep(0.82, 0.955, vFl.w) * step(vFl.w, 0.9555));
    diffuseColor.b *= 0.97 + 0.05 * (1.0 - zu);
  }
}`)
        .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ float za = atan(vFl.y, vFl.x + 1e-6) * 10.0; float zk = step(0.5, vFl.z) * (1.0 - smoothstep(0.5, 1.5, min(fwidth(za), 3.0))); vec3 zc = cross((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz, normal); vec3 zt = zc * inversesqrt(max(dot(zc, zc), 1e-8)); normal = normalize(normal - zt * (0.85 * cos(za) * sign(sin(za)) * zk)); }')
        // a shaft of the outer colonnade or a porch is lit by the air from the open side: round it, toward the wall, the shade deepens
        .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ vec3 zN = inverseTransformDirection(normal, viewMatrix); reflectedLight.indirectDiffuse *= mix(1.0, mix(0.58, 1.0, smoothstep(-0.7, 0.5, dot(zN.xz, vFlOut))), dot(vFlOut, vFlOut)); }');
    });
    const M4 = new THREE.Matrix4(), Q0 = new THREE.Quaternion(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
    const instanced = (geo, mat, list) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((q, i) => { M4.compose(V1.set(q[0], q[1], q[2]), Q0, V2.set(q[3] ?? 1, q[4] ?? q[3] ?? 1, q[3] ?? 1)); im.setMatrixAt(i, M4); });
      im.instanceMatrix.needsUpdate = true; im.receiveShadow = true; im.computeBoundingSphere(); scene.add(im); return im;
    };
    const ghosts = [];                                               // what casts the sun's shadow: plain shapes a little inside the skins
    const ghostCyl = (x, y, z, r0, r1, h) => ghosts.push(new THREE.CylinderGeometry(r1 * 0.93, r0 * 0.93, h, 14, 1).translate(x, y + h / 2, z));
    const ghostBox = (x0, y0, z0, x1, y1, z1) => ghosts.push(new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
    {
      const front = [], rest = [], k = COL_D_SIDE / COL_D_END;
      for (const z of COLS_Z) { front.push([COLS_X[12], STY, z]); rest.push([COLS_X[0], STY, z]); }
      for (let i = 1; i < 12; i++) for (const z of [COLS_Z[0], COLS_Z[5]]) rest.push([COLS_X[i], STY, z, k, 1]);
      instanced(columnGeo(COL_D_END, COL_D_TOP, COL_H, CAP_W, detail < 1 ? 60 : 80, RED), stucco, front);   // drawn from within the room too: they stand before the open door
      await ctx.yield();
      outdoor.add(instanced(columnGeo(COL_D_END, COL_D_TOP, COL_H, CAP_W, 20, RED), stucco, rest));   // the flanks and the west front: plain round shafts (the flutes are drawn by the light, as on every column)
      for (const q of front.concat(rest)) ghostCyl(q[0], STY, q[2], COL_D_END / 2, COL_D_TOP / 2, COL_H);
    }
    await ctx.yield();
    const RIDGE = Y_EAVE + GABLE_H + 0.45, PITCH = Math.atan2(RIDGE - Y_EAVE, 14.7), GHOST_TOP = FLOOR + CEIL + 0.63;
    {
      const parts = [];
      // the beam and the band over it, on the columns' axes; the cornice and the walk's ceiling as a ring round the inner building
      for (const s of [-1, 1]) {
        parts.push(box(s * 30.0, Y_BEAM, -13.51, s * 31.78, Y_CORNICE, 13.51, STUCCO), box(-30.0, Y_BEAM, s * 11.73, 30.0, Y_CORNICE, s * 13.51, STUCCO));
        parts.push(box(s * CELLA_X, Y_CORNICE, -14.7, s * 32.9, Y_EAVE, 14.7, STUCCO), box(-CELLA_X, Y_CORNICE, s * CELLA_Z, CELLA_X, Y_EAVE, s * 14.7, STUCCO));
        parts.push(box(s * DOOR_X, Y_CORNICE, -CELLA_Z, s * CELLA_X, Y_EAVE, CELLA_Z, STUCCO_D));
        // the red band at the top of the beam
        parts.push(box(s * 31.78, Y_FRIEZE - 0.16, -13.53, s * 31.82, Y_FRIEZE, 13.53, RED), box(-31.8, Y_FRIEZE - 0.16, s * 13.51, 31.8, Y_FRIEZE, s * 13.55, RED));
        // the gable's back wall and the roof's two slopes
        const tri = new THREE.Shape([new THREE.Vector2(-14.2, 0), new THREE.Vector2(14.2, 0), new THREE.Vector2(0, GABLE_H + 0.1)]);
        const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.5, bevelEnabled: false }).rotateY(Math.PI / 2).translate(s * 31.3 - 0.25, Y_EAVE, 0);
        parts.push(paint(tg, GABLE_BLUE));   // the gable's ground: a quiet blue, so that the marble figures before it read as figures
        const slope = Math.hypot(14.7, RIDGE - Y_EAVE);
        parts.push(paint(new THREE.BoxGeometry(65.8, 0.4, slope).rotateX(s * PITCH).translate(0, (Y_EAVE + RIDGE) / 2 - 0.2, s * 7.35), TILE));
      }
      add(merged(parts), stone);
      for (const s of [-1, 1]) {
        // shadow shapes: every beam casts its true shadow
        ghostBox(s * 30.1, Y_BEAM + 0.02, -13.4, s * 31.74, Y_CORNICE, 13.4);
        ghostBox(-30, Y_BEAM + 0.1, s * 11.8, 30, Y_CORNICE, s * 13.4);
        ghostBox(-CELLA_X, STY, s * (ROOM_Z + 0.1), CELLA_X, GHOST_TOP, s * (CELLA_Z - 0.1));
        ghostBox(s * (ROOM_X + 0.1), FLOOR, -ROOM_Z, s * (DOOR_X - 0.1), GHOST_TOP, s > 0 ? -DOOR_W / 2 : ROOM_Z);
        if (s > 0) ghostBox(ROOM_X + 0.1, FLOOR, DOOR_W / 2, DOOR_X - 0.1, GHOST_TOP, ROOM_Z);
      }
      ghostBox(ROOM_X + 0.1, FLOOR + DOOR_H, -DOOR_W / 2, DOOR_X - 0.1, GHOST_TOP, DOOR_W / 2);
      ghostBox(-ROOM_X - 1.2, GHOST_TOP - 0.13, -CELLA_Z + 0.1, CELLA_X - 0.1, GHOST_TOP, CELLA_Z - 0.1);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the inner building: walls, porches, the door wall, floors
    const WALL = C('#e3dccb'), WALL_IN = C('#d8cfbb'), FLOORC = C('#a79f8f'), BRONZE = C('#a58c5e'), BRONZE_D = C('#b89d6a'), TIMBER = C('#2e2218'), CEDAR = C('#8f6c4a'), CEDAR_D = C('#5c4430');
    {
      const parts = [], top = Y_CORNICE, wallTop = FLOOR + CEIL + 0.7;
      for (const s of [-1, 1]) {
        parts.push(box(-CELLA_X, STY, s * ROOM_Z, CELLA_X, wallTop, s * CELLA_Z, WALL));
        // the door wall (east) and the room's west wall
        if (s > 0) { parts.push(box(ROOM_X, STY, -ROOM_Z, DOOR_X, wallTop, -DOOR_W / 2, WALL), box(ROOM_X, STY, DOOR_W / 2, DOOR_X, wallTop, ROOM_Z, WALL), box(ROOM_X, FLOOR + DOOR_H, -DOOR_W / 2, DOOR_X, wallTop, DOOR_W / 2, WALL)); }
        else parts.push(box(-DOOR_X, STY, -ROOM_Z, -ROOM_X, wallTop, ROOM_Z, WALL));
        // the porch's beam and band over its two columns
        parts.push(box(s * 21.75, PORCH_Y + 9.83, -CELLA_Z, s * 23.3, top, CELLA_Z, STUCCO));
      }
      // the floors: slabs 1.2 m square, their joints and their small differences of tone drawn by place
      const floorMat = std({ roughness: 0.55 }, 'floor', grazed(slabs(1.2, 0.9, 0.16, 0.3)));
      const floors = [box(-ROOM_X, STY - 0.2, -ROOM_Z, DOOR_X, FLOOR, ROOM_Z, FLOORC)];
      for (const s of [-1, 1]) floors.push(box(s * DOOR_X, STY - 0.2, -ROOM_Z, s * CELLA_X, PORCH_Y, ROOM_Z, FLOORC));
      add(merged(floors), floorMat);
      // the upper walls of the room above the galleries' beams are the same walls; the ceiling boards over the beams
      parts.push(box(-ROOM_X, FLOOR + CEIL + 0.45, -ROOM_Z, ROOM_X, FLOOR + CEIL + 0.7, ROOM_Z, TIMBER));
      add(merged(parts), stone, { mirror: true });
      const pc = [];
      for (const s of [-1, 1]) for (const z of [-2.61, 2.61]) { pc.push([s * 22.52, PORCH_Y, z]); ghostCyl(s * 22.52, PORCH_Y, z, 0.95, 0.74, 9.83); }
      instanced(columnGeo(1.9, 1.48, 9.83, 2.3, 60, RED), stucco, pc);
      ghostBox(21.85, PORCH_Y + 9.85, -CELLA_Z, 23.26, top, CELLA_Z);
    }
    await ctx.yield();
    // ------------------------------------------------------------ the room: two tiers of columns, galleries, beams and ceiling
    const F = FLOOR;
    // the gold's light on the roof over him: where it comes from (his chest; set when the statue is built) and its strength; its colour
    const goldUp = { value: new THREE.Vector4(BASE_X - 5.5, FLOOR + 9.6, 0, GOLD_UP) }, goldUpCol = { value: C('#fff0d8') };
    {
      const low = [], up = [], parts = [];
      for (const x of IN_X) for (const s of [-1, 1]) { low.push([x, F, s * IN_Z]); up.push([x, F + GALLERY, s * IN_Z]); }
      for (const im of [instanced(columnGeo(1.5, 1.16, LOW_H, 1.8, 40, STUCCO_D), stucco, low), instanced(columnGeo(2 * UP_R, 0.8, UP_H, 1.22, 40, STUCCO_D), stucco, up)]) im.layers.enable(1);
      for (const s of [-1, 1]) {
        // the beam on the lower columns and the gallery's floor over the side aisle
        parts.push(box(-ROOM_X, F + LOW_H, s * (IN_Z - 0.62), ROOM_X, F + GALLERY - 0.28, s * (IN_Z + 0.62), STUCCO_D));
        parts.push(box(-ROOM_X, F + GALLERY - 0.28, s * (IN_Z - 0.78), ROOM_X, F + GALLERY, s * ROOM_Z, WALL_IN));
        // the beam on the upper columns, and the wall plate up to the ceiling beams
        parts.push(box(-ROOM_X, F + GALLERY + UP_H, s * (IN_Z - 0.5), ROOM_X, F + CEIL, s * (IN_Z + 0.5), STUCCO_D));
        // a pilaster at each end of each row, both tiers
        for (const e of [-1, 1]) parts.push(box(e * ROOM_X, F, s * (IN_Z - 0.7), e * (ROOM_X - 0.42), F + LOW_H, s * (IN_Z + 0.7), STUCCO_D), box(e * ROOM_X, F + GALLERY, s * (IN_Z - 0.48), e * (ROOM_X - 0.3), F + GALLERY + UP_H, s * (IN_Z + 0.48), STUCCO_D));
      }
      add(merged(parts), stone, { mirror: true });
      // dark timber: beams across the whole room with their undersides at the ceiling's height, boards above
      const beams = [];
      for (let i = 0; i <= 16; i++) { const x = -ROOM_X + 0.4 + i * (2 * ROOM_X - 0.8) / 16; beams.push(box(x - 0.21, F + CEIL, -ROOM_Z, x + 0.21, F + CEIL + 0.46, ROOM_Z, CEDAR)); }
      for (const z of [-5.3, -3.2, -1.07, 1.07, 3.2, 5.3]) beams.push(box(-ROOM_X, F + CEIL + 0.18, z - 0.09, ROOM_X, F + CEIL + 0.46, z + 0.09, CEDAR));
      // the boards over the beams: each coffer a sunk panel
      beams.push(box(-ROOM_X, F + CEIL + 0.44, -ROOM_Z, ROOM_X, F + CEIL + 0.5, ROOM_Z, CEDAR_D));
      // the beams' ends lie in a timber plate along each wall: no wall shows between them
      for (const s of [-1, 1]) beams.push(box(-ROOM_X, F + CEIL - 0.02, s * (ROOM_Z - 0.07), ROOM_X, F + CEIL + 0.46, s * ROOM_Z, CEDAR_D), box(s * (ROOM_X - 0.07), F + CEIL - 0.02, -ROOM_Z, s * ROOM_X, F + CEIL + 0.46, ROOM_Z, CEDAR_D));
      // THE ROOF OVER HIM IS SEEN: the gold of his robe and wreath throws a faint warm light up onto the timber close over him (the lamps'
      // and the door's light, given back by the gold). By the place alone: from his chest (goldUp, set where the statue is built), by the
      // square of the distance and by how the timber's face is turned to it: strongest over his head and lap, falling off toward the door.
      // It is no lamp of the scene and falls on nothing but the timber
      add(merged(beams), std({ roughness: 0.8 }, 'timber', (sh) => {
        sh.uniforms.uGoldUp = goldUp; sh.uniforms.uGoldUpCol = goldUpCol;
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uGoldUp; uniform vec3 uGoldUpCol;')
          .replace('#include <lights_fragment_maps>', '{ vec3 zG = inverseTransformDirection(normal, viewMatrix); vec3 zg = uGoldUp.xyz - vZW; float zd = dot(zg, zg);\n irradiance += uGoldUpCol * uGoldUp.w * (0.3 + 0.7 * max(dot(zG, zg) * inversesqrt(max(zd, 1e-4)), 0.0)) / (1.0 + zd); }\n#include <lights_fragment_maps>');
      }), { mirror: true });
    }
    await ctx.yield();
    // the barrier (stone, waist high: an upright wall with a coping, a base course and posts, its face toward the door a deep matt blue), the pool's rim, the black floor of the pool
    const BLUE_DARK = C('#213c8e'), RIM = C('#ebe7dd'), BLACK = C('#0b0b0d'), COPE = C('#e6e0d2'), BASEC = C('#c9c0ac');
    {
      const parts = [], bx0 = BARRIER_X, bx1 = BARRIER_X + BARRIER_T, B = BAR, topY = F + BARRIER_H - B.cope;
      for (const s of [-1, 1]) {
        // AN UPRIGHT STONE WALL: its body; a coping slab along its top (it stands out a little over both faces, not into the gateway);
        // on the face toward the door a base course on the floor with a small moulding over it, and a post at each end (beside the
        // gateway, clear of the gate leaf's hinge line, and against the column): the blue face lies between them, sunk a little
        const zg = s * (GATE_HALF + B.clear), zc = s * (IN_Z - 0.6);
        parts.push(box(bx0, F, s * GATE_HALF, bx1, topY, zc, WALL_IN));
        parts.push(box(bx0 - B.copeOut, topY, s * GATE_HALF, bx1, F + BARRIER_H, zc, COPE), box(bx1, topY, zg, bx1 + B.baseOut, F + BARRIER_H, zc, COPE));
        parts.push(box(bx1, F, zg, bx1 + B.baseOut, F + B.base, zc, BASEC), box(bx1, F + B.base, zg, bx1 + B.baseOut * 0.6, F + B.base + 0.035, zc, COPE));
        parts.push(box(bx1, F + B.base + 0.035, zg, bx1 + B.postOut, topY, zg + s * B.post, WALL_IN), box(bx1, F + B.base + 0.035, zc - s * B.post, bx1 + B.postOut, topY, zc, WALL_IN));
        // the face toward the door: plain deep blue (matt paint on stone; nothing figured)
        parts.push(box(bx1, F + B.base + 0.035, zg + s * B.post, bx1 + 0.012, topY, zc - s * B.post, BLUE_DARK));
        // between the columns of each row from the second to the fifth: the same wall, coping and base course (the painted panels are on the faces toward the pool)
        for (let i = 1; i < 4; i++) {
          const xa = IN_X[i + 1] + 0.7, xb = IN_X[i] - 0.7, za = s * (IN_Z - 0.11), zb = s * (IN_Z + 0.11);
          parts.push(box(xa, F, za, xb, topY, zb, WALL_IN), box(xa, topY, za - s * B.copeOut, xb, F + BARRIER_H, zb + s * B.copeOut, COPE));
        }
        // the pool's rim, north and south
        parts.push(box(POOL.x0, F, s * (POOL.z - POOL.rimW), POOL.x1, F + POOL.rim, s * POOL.z, RIM));
      }
      parts.push(box(POOL.x1 - POOL.rimW, F, -POOL.z, POOL.x1, F + POOL.rim, POOL.z, RIM));
      const m = add(merged(parts), stone, { cast: true });
      m.name = 'barrier';
      add(box(POOL.x0, F - 0.02, -POOL.z + POOL.rimW, POOL.x1 - POOL.rimW, F + 0.02, POOL.z - POOL.rimW, BLACK), std({ roughness: 0.9 }, 'stone'));
    }

    // ------------------------------------------------------------ the god (the part): its origin is the middle of the base's front edge on the floor
    // the blade's top: the true shadow of the front beam's underside (its east edge at x 31.78)
    const sunTopAt = (x) => Y_BEAM - (31.78 - x) * tanEl - FLOOR;
    const LAMPS = LAMP_AT.map((q) => [q[0], F + LAMP_H + 0.09, q[1]]);
    // the six lamps' levels (1 = a lamp's steady light; each flame's own breathing, 0.8 to 1.2): this one object is handed to the part
    // (opts.lampLevel: the part keeps the object and reads its six numbers every frame), so the lamps' light plays on the gold near them
    // as the flames move; the world writes the numbers where it moves the flames
    const lampLevel = { value: [1, 1, 1, 1, 1, 1] };
    const hero = await buildHero(ctx, {
      sunDir: SUN.clone(), sunColor: sunCol.clone(), bounce: { color: bounceCol.clone(), strength: 0.7 },
      lamps: LAMPS.map((q) => [q[0] - BASE_X, q[1] - F, q[2]]), lampLevel, envMap: null, detail,
    });
    hero.object.position.set(BASE_X, F, 0);
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    // WHAT IS LEFT UNDRAWN, 3: the god, while the lens is outside the room and no straight line from it through the great door's opening
    // can reach him: by the lens's place in plan alone, whatever the gaze (the room has no other opening; he stands between the inner
    // colonnades, west of his base's front edge + 1 m). From the entry to the cross way's leg no such line reaches him.
    {
      const HZ = IN_Z + IN_R, HX = BASE_X + 1, K = (DOOR_W / 2 + HZ) / (DOOR_X - HX);
      let shownGod = true;
      updates.push((dt, time, camera) => {
        const e = camera.matrixWorld.elements, x = e[12], z = Math.abs(e[14]), seen = x <= DOOR_X || z - DOOR_W / 2 <= K * (x - DOOR_X);
        if (seen !== shownGod) { shownGod = seen; hero.object.visible = seen; }
      });
    }
    await ctx.yield();
    {
      const g = mergeGeometries(ghosts, false); for (const q of ghosts) q.dispose();
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
      m.castShadow = true; m.receiveShadow = false; m.renderOrder = 50; scene.add(m);
    }

    await ctx.yield();
    // ------------------------------------------------------------ the flight: the line, the pace and the one look (makeRoute above)
    const info = hero.info || {};
    if (info.chest) goldUp.value.set(info.chest[0] + BASE_X, info.chest[1] + FLOOR, info.chest[2], GOLD_UP);
    const route = makeRoute(info), path = route.path, L = route.L, D = route.D, pace = route.pace, LOOK = route.look;
    // ------------------------------------------------------------ the pool: olive oil a finger deep over black stone, a dim slow mirror
    const OIL_Y = F + 0.1;
    {
      const w = POOL.x1 - POOL.rimW - POOL.x0, d = 2 * (POOL.z - POOL.rimW);
      const oil = new Reflector(new THREE.PlaneGeometry(w, d), {
        textureWidth: 640, textureHeight: 384, clipBias: 0.002, multisample: 0,
        shader: {
          name: 'ZeusOil',
          uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uTime: tU },
          vertexShader: /* glsl */`
            uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
            void main() { vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: /* glsl */`
            uniform sampler2D tDiffuse; uniform float uTime; varying vec4 vUv; varying vec3 vW;
            void main() {
              // a slow heavy sheen: swells a metre and more long, a few thousandths of slope, never a ripple that races; one broader
              // swell travels slowly over it from the door's side toward the god, and where it passes the mirror picture bends and
              // trembles a little (oil is heavy: it shivers finely and settles)
              vec2 q = vW.xz; float t = uTime;
              vec2 sl = 0.0017 * vec2(sin(q.x * 1.7 + t * 0.31) + 0.6 * sin(q.y * 2.9 - t * 0.23 + 1.3), sin(q.y * 1.3 - t * 0.27) + 0.6 * sin(q.x * 2.3 + t * 0.29 + 2.1));
              float zs = q.x * 1.05 + 0.22 * sin(q.y * 0.9) + t * 0.42, zw = sin(zs), zenv = 0.5 + 0.5 * sin(zs * 0.5 + 0.8);
              sl += vec2(0.0046 * zw * zenv, 0.0016 * cos(zs * 1.3 + q.y)) + 0.0007 * zenv * vec2(sin(q.x * 9.0 + t * 2.3), sin(q.y * 11.0 - t * 2.9));
              vec3 N = normalize(vec3(sl.x, 1.0, sl.y)), V = normalize(cameraPosition - vW);
              float c = clamp(dot(N, V), 0.0, 1.0), k = 1.0 - c, fres = 0.05 + 0.95 * k * k * k * k * k;
              vec4 uvp = vUv; uvp.xy += sl * 2.0 * max(uvp.w, 0.0);
              vec3 refl = texture2D(tDiffuse, uvp.xy / max(uvp.w, 1e-4)).rgb;
              gl_FragColor = vec4(refl * fres * vec3(0.94, 0.86, 0.6) + vec3(0.004, 0.004, 0.003), 1.0);
            }`,
        },
      });
      oil.rotation.x = -Math.PI / 2; oil.position.set((POOL.x0 + POOL.x1 - POOL.rimW) / 2, OIL_Y, 0);
      // the mirror shows what stands over the pool: the god, the columns and the beams (layer 1), not the grove
      oil.camera.layers.set(1);
      for (const o of [sun, roomFill, upPool, upFloor]) o.layers.enable(1);
      hero.object.traverse((o) => { if (o.isMesh) o.layers.enable(1); });
      scene.add(oil); ownTextures.push(oil);   // its dispose frees the mirror picture's render target and its material
      // WHAT IS LEFT UNDRAWN, 1: the oil and its mirror picture, while the curtain before the barrier hides the whole of the oil from the lens:
      // the sight line from the lens to the oil's far edge then passes under the curtain's lowest hem line (CURTAIN_LOW over the floor); or
      // while the lens is lower than the oil's own level, where the room's floor hides it
      const farX = POOL.x0 + POOL.rimW, CURTAIN_LOW = CURTAIN_TOP - CURTAIN_SAG - 0.03;
      let shownOil = true;
      updates.push((dt, time, camera) => {
        const e = camera.matrixWorld.elements, x = e[12], y = e[13];
        const seen = y > OIL_Y && (x <= BARRIER_X - 0.55 || OIL_Y + (y - OIL_Y) * (BARRIER_X - 0.55 - farX) / (x - farX) > F + CURTAIN_LOW);
        if (seen !== shownOil) { shownOil = seen; oil.visible = seen; }
      });
    }
    // WHAT IS LEFT UNDRAWN, 2 (nothing is left out for being small or far; there is no third):
    // the grove and the far land are not drawn while the lens is inside the room (west of the door wall's inner face): by place alone,
    // whatever the gaze. A plain stand-in of the land then lies beyond the open door (the ground's mean tone out to the long colonnade, a
    // dusky band of the grove's trees beyond it); the porch, the east front's six columns and the sky stay as they are.
    {
      const land = new THREE.BufferGeometry();
      land.setAttribute('position', new THREE.Float32BufferAttribute([34, 0.02, -160, 34, 0.02, 160, STOA_X, 0.02, 160, STOA_X, 0.02, -160, STOA_X, 0.02, -160, STOA_X, 0.02, 160, STOA_X, 15, 160, STOA_X, 15, -160], 3));
      land.setAttribute('color', new THREE.Float32BufferAttribute([...Array(4).fill(C('#a98f5a').toArray()).flat(), ...Array(4).fill(C('#59624e').toArray()).flat()], 3));
      land.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
      const standIn = new THREE.Mesh(land, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })); standIn.visible = false; scene.add(standIn);
      let shownOut = true;
      updates.push((dt, time, camera) => {
        const inside = lensInRoom(camera);
        if (inside === shownOut) { shownOut = !inside; outdoor.visible = shownOut; standIn.visible = inside; }
      });
    }
    await ctx.yield();
    // ------------------------------------------------------------ the curtain let down on its cords, the lamps, the jar and the small altar
    const PURPLE = C('#3a1846'), BRONZE_L = C('#c4aa74');
    const CURTAIN_X = CURTAIN.x, CORDS = CURTAIN.cords;
    const curtainTop = (z) => { let i = 0; while (i < 2 && z > CORDS[i + 1]) i++; const t = clamp((z - CORDS[i]) / (CORDS[i + 1] - CORDS[i]), 0, 1); return CURTAIN_TOP - CURTAIN_SAG * Math.sin(Math.PI * t) ** 2; };
    {
      const nz = 96, ny = 7, pos = [], uvs = [], idx = [];
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nz; i++) {
        const z = lerp(CORDS[0], CORDS[3], i / nz), v = j / ny, top = curtainTop(z);
        // heavy folds: deep at the foot, gathered small at the cord
        const fold = (0.035 + 0.075 * (1 - v)) * Math.sin(z * 8.3 + 0.9 * Math.sin(z * 2.1)) + 0.02 * Math.sin(z * 21.0 + 1.7);
        pos.push(CURTAIN_X + fold, F + top * v + 0.01, z); uvs.push(i / nz, v);
      }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nz; i++) { const a = j * (nz + 1) + i, b = a + 1, c = a + nz + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
      paint(g, PURPLE);
      // it stirs very slightly, and only where it hangs in the barrier's shade: on the two side spans (beyond the gate's jambs) and below the
      // shade line the barrier's top throws on it; across the gate, where the sun strikes it, and at its upper hem it hangs still: nothing that
      // casts moves in the blade of sun, so the one map of shadows stays true
      const cloth = lit(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, side: THREE.DoubleSide }), 'cloth', (sh) => {
        sh.uniforms.uTime = tU;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += max(0.0, 1.0 - uv.y / 0.8) * smoothstep(' + (GATE_HALF + 0.1).toFixed(2) + ', ' + (GATE_HALF + 0.6).toFixed(2) + ', abs(position.z)) * 0.045 * (sin(uTime * 0.7 + position.z * 1.3) + 0.5 * sin(uTime * 1.13 + position.z * 3.1));');
      });
      add(g, cloth, { cast: true });
      const parts = [];
      // the cords' stands: slender bronze, three small feet, a thin stem, a little cup where the cord is tied and its end hanging down
      const stem = [[0.0, 0.05], [0.03, 0.06], [0.018, 0.1], [0.013, 0.5], [0.012, CURTAIN_TOP - 0.06], [0.03, CURTAIN_TOP - 0.02], [0.034, CURTAIN_TOP + 0.03], [0.012, CURTAIN_TOP + 0.05], [0.0, CURTAIN_TOP + CURTAIN.stand]].map((q) => new THREE.Vector2(q[0], q[1]));
      for (const z of CORDS) {
        parts.push(paint(new THREE.LatheGeometry(stem, 8).translate(CURTAIN_X, F, z), BRONZE_L));
        for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; parts.push(paint(new THREE.CylinderGeometry(0.008, 0.012, 0.15, 5).rotateZ(1.1).rotateY(a).translate(CURTAIN_X + 0.06 * Math.cos(a), F + 0.035, z - 0.06 * Math.sin(a)), BRONZE_L)); }
        parts.push(paint(new THREE.CylinderGeometry(0.012, 0.02, 0.26, 5).translate(CURTAIN_X + 0.04, F + CURTAIN_TOP - 0.14, z + (z > 0 ? 0.03 : -0.03)), PURPLE));
      }
      for (let i = 0; i < 3; i++) for (let k = 0; k < 8; k++) {
        const za = lerp(CORDS[i], CORDS[i + 1], k / 8), zb = lerp(CORDS[i], CORDS[i + 1], (k + 1) / 8), ya = curtainTop(za) + CURTAIN.cord, yb = curtainTop(zb) + CURTAIN.cord;
        parts.push(paint(new THREE.CylinderGeometry(CURTAIN.cordR, CURTAIN.cordR, Math.hypot(zb - za, yb - ya), 5).rotateX(Math.PI / 2 - Math.atan2(yb - ya, zb - za)).translate(CURTAIN_X, F + (ya + yb) / 2, (za + zb) / 2), BRONZE_L));
      }
      // the bronze jar (0.9 m) and the small altar on the closed floor, the lamps' low stands: a foot, a thin stem, a small dish of oil
      const jar = [[0.16, 0], [0.2, 0.03], [0.3, 0.3], [JAR.r, 0.5], [0.27, 0.72], [0.15, 0.8], [0.17, JAR.h]].map((q) => new THREE.Vector2(q[0], q[1]));
      parts.push(paint(new THREE.LatheGeometry(jar, 18).translate(JAR.x, F, JAR.z), BRONZE_L));
      { const a = SMALL_ALTAR; parts.push(box(a.x0 + a.over, F, a.z0 + a.over, a.x1 - a.over, F + a.h - a.slab, a.z1 - a.over, RIM), box(a.x0, F + a.h - a.slab, a.z0, a.x1, F + a.h, a.z1, RIM)); }
      for (const q of LAMPS) {
        const stand = [[0.14, 0], [0.14, 0.025], [0.035, 0.06], [0.018, 0.4], [0.022, LAMP_H - 0.1], [0.075, LAMP_H - 0.05], [0.085, LAMP_H], [0.0, LAMP_H]].map((v) => new THREE.Vector2(v[0], v[1]));
        parts.push(paint(new THREE.LatheGeometry(stand, 10).translate(q[0], F, q[2]), BRONZE_L));
      }
      add(merged(parts), std({ roughness: 0.45, metalness: 0.75 }, 'metal'), { cast: true });
    }
    // six small flames, each on its own phases (the stream 'lamps'): a tongue that swells and sinks, leans as the room's slow air takes
    // it and trembles; a soft glow round each that swells with its own flame; the lamp's light on the floor, the barrier and the gold
    // near it breathes with it (uLamp's fourth number here, lampLevel for the part)
    {
      const tongue = new THREE.LatheGeometry([[0, 0], [0.03, 0.025], [0.042, 0.07], [0.026, 0.14], [0, 0.22]].map((q) => new THREE.Vector2(q[0], q[1])), 8);
      const flames = new THREE.InstancedMesh(tongue, new THREE.MeshBasicMaterial({ color: C('#ffb04a').multiplyScalar(5.5), fog: false }), 6);
      const glowG = new THREE.BufferGeometry(); glowG.setAttribute('position', new THREE.Float32BufferAttribute(LAMPS.flat(), 3));
      const glowLv = new THREE.BufferAttribute(new Float32Array(6).fill(1), 1); glowG.setAttribute('aLv', glowLv);
      // the glow round each flame is 0.75 m wide where it stands (at its flame's steady level), on any screen
      const glow = new THREE.Points(glowG, new THREE.ShaderMaterial({
        uniforms: { uPxH: glowPx, uCol: { value: C('#ff9a3c').multiplyScalar(0.6) }, uSize: { value: 0.75 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: 'attribute float aLv; uniform float uPxH; uniform float uSize; varying float vLv; void main(){ vLv = aLv; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * (0.7 + 0.3 * aLv) * 0.5 * uPxH * projectionMatrix[1][1] / max(-mv.z, 0.05); }',
        fragmentShader: 'uniform vec3 uCol; varying float vLv; void main(){ float r = clamp(length(gl_PointCoord - 0.5) * 2.0, 0.0, 1.0); float a = (1.0 - r) * (1.0 - r); gl_FragColor = vec4(uCol * a * a * vLv, 1.0); }',
      }));
      glow.frustumCulled = false; flames.frustumCulled = false; scene.add(flames, glow);
      const rl = mk('lamps'), ph = LAMPS.map(() => [rl.range(0, 6.28), rl.range(0.8, 1.3), rl.range(0, 6.28)]);
      const QL = new THREE.Quaternion(), EL = new THREE.Euler(), K0 = LAMP_TONGUE / 0.22;
      updates.push((dt, time) => {
        for (let i = 0; i < 6; i++) {
          const f = ph[i][1], a = ph[i][0], c = ph[i][2];
          // its level: a slow breathing, a quicker one, a tremble (0.8 to 1.2)
          const b = clamp(1 + 0.1 * Math.sin(time * 2.1 * f + a) + 0.06 * Math.sin(time * 5.3 + c) + 0.045 * Math.sin(time * 11.7 * f + a * 3.0) * Math.sin(time * 1.9 + c), 0.8, 1.2);
          // its lean: toward the west with the door's slow air, swaying, and a small quick tremble
          const lx = 0.1 + 0.11 * Math.sin(time * 0.83 * f + c) + 0.035 * Math.sin(time * 7.9 + a), lz = 0.09 * Math.sin(time * 0.61 * f + a * 2.0) + 0.03 * Math.sin(time * 9.1 * f + c);
          QL.setFromEuler(EL.set(lz, 0, lx));
          M4.compose(V1.set(LAMPS[i][0], LAMPS[i][1] - 0.08, LAMPS[i][2]), QL, V2.set(1, K0 * (1 + (b - 1) * LAMP_SWELL / 0.2), 1)); flames.setMatrixAt(i, M4);
          place.uLamp.value[i].set(LAMPS[i][0], LAMPS[i][1], LAMPS[i][2], 1 + 1.8 * (b - 1));
          lampLevel.value[i] = b; glowLv.array[i] = 1 + 2.0 * (b - 1);
        }
        flames.instanceMatrix.needsUpdate = true; glowLv.needsUpdate = true;
      });
    }
    await ctx.yield();
    // ------------------------------------------------------------ the blade of sun in the air: the room's air is a thin medium, lit where the sun's ray is free
    // The lit air is a slab: SHAFT.half to either side of the ray through the middle of the east front's middle gap, under the true shadow of
    // the front beam's underside, from the porch's front to the god's base. What is seen of it is the true length of each sight line inside
    // it (so it is thin near the lens), brighter toward the sun than away from it.
    {
      const SHAFT = { half: 1.5, x0: BASE_X + 0.05, x1: CELLA_X, k: 0.018, wisp: 0.8 }, aS = SUN.z / SUN.x, bS = SUN.y / SUN.x;
      const zc = (x) => -(COLS_X[12] - x) * aS, top = (x) => Y_BEAM - (31.78 - x) * bS + 0.05, hw = SHAFT.half + 0.05, y0 = F + 0.02;
      const P = []; for (const x of [SHAFT.x0, SHAFT.x1]) for (const [sy, sz] of [[0, -1], [0, 1], [1, 1], [1, -1]]) P.push(x, sy ? top(x) : y0, zc(x) + sz * hw);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 3, 2, 6, 3, 6, 7, 1, 5, 6, 1, 6, 2, 0, 3, 7, 0, 7, 4]);
      const shaft = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uCol: { value: sunCol.clone().multiplyScalar(0.42) }, uSunDir: { value: SUN.clone() }, uTime: tU }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: 'varying vec3 vW; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }',
        fragmentShader: /* glsl */`
          uniform vec3 uCol; uniform vec3 uSunDir; uniform float uTime; varying vec3 vW;
          float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
          // one face of the slab: f <= 0 inside; a: f at the lens, b: f at the far point; t0, t1: the part of the sight line inside so far
          void cut(float a, float b, inout float t0, inout float t1) { if (a > 0.0 && b > 0.0) { t1 = -1.0; return; } if (a > 0.0) t0 = max(t0, a / max(a - b, 1e-5)); else if (b > 0.0) t1 = min(t1, a / min(a - b, -1e-5)); }
          void main() {
            if (gl_FrontFacing) discard;   // the far faces alone: each sight line once
            vec3 c = cameraPosition, d = vW - c; float t0 = 0.0, t1 = 1.0;
            float sc = c.z + (${G(COLS_X[12])} - c.x) * ${G(aS)}, sd = vW.z + (${G(COLS_X[12])} - vW.x) * ${G(aS)};
            cut(sc - ${G(SHAFT.half)}, sd - ${G(SHAFT.half)}, t0, t1); cut(-sc - ${G(SHAFT.half)}, -sd - ${G(SHAFT.half)}, t0, t1);
            cut(c.y + (31.78 - c.x) * ${G(bS)} - ${G(Y_BEAM)}, vW.y + (31.78 - vW.x) * ${G(bS)} - ${G(Y_BEAM)}, t0, t1);
            cut(${G(SHAFT.x0)} - c.x, ${G(SHAFT.x0)} - vW.x, t0, t1); cut(c.x - ${G(SHAFT.x1)}, vW.x - ${G(SHAFT.x1)}, t0, t1); cut(${G(F)} - c.y, ${G(F)} - vW.y, t0, t1);
            float far = length(d), len = max(t1 - t0, 0.0) * far, toSun = max(dot(d / max(far, 1e-4), uSunDir), 0.0);
            // what hangs in the air (dust, the incense's thinned smoke) is uneven and drifts slowly west and a little up with the door's
            // air: its measure at four places along the lit part of the sight line (a place in the room, not on the picture)
            float den = 0.0;
            for (int i = 0; i < 4; i++) { vec3 q = c + d * (t0 + (t1 - t0) * (float(i) + 0.5) * 0.25) + vec3(0.16, -0.05, 0.0) * uTime;
              den += smoothstep(0.3, 0.72, 0.65 * n3(q * vec3(0.5, 1.05, 1.05)) + 0.35 * n3(q * vec3(1.3, 2.4, 2.4) + vec3(0.0, uTime * 0.03, 7.0))); }
            den = ${G(1 - SHAFT.wisp * 0.5)} + ${G(SHAFT.wisp * 0.25)} * den;
            gl_FragColor = vec4(uCol * (1.0 - exp(-${G(SHAFT.k)} * len * den)) * (0.6 + 0.9 * toSun * toSun), 1.0);
          }`,
      }));
      shaft.renderOrder = 40; scene.add(shaft);
    }
    // ------------------------------------------------------------ dust in the blade of sun: a medium, lit only where the sun's ray is free
    // (from the east front's middle columns, through the walk, the porch and the door, to his knees: drifting and turning slowly)
    {
      const rd = mk('dust'), nFine = 18000, nSoft = 560, n = Math.round((nFine + nSoft) * detail), pos = new Float32Array((nFine + nSoft) * 3), seed = new Float32Array((nFine + nSoft) * 4);
      for (let i = 0; i < nFine + nSoft; i++) {
        const soft = i >= nFine, x = rd.range(BASE_X, COLS_X[12] - 0.4), top = Math.max(0.6, sunTopAt(x) + 0.3);
        pos[i * 3] = x; pos[i * 3 + 1] = F + 0.08 + rd() * Math.min(top, 7.5); pos[i * 3 + 2] = rd.range(-2.1, 2.1);
        seed[i * 4] = rd.range(0, 6.28); seed[i * 4 + 1] = rd.range(0, 6.28); seed[i * 4 + 2] = soft ? rd.range(0.35, 0.7) : rd.range(0.009, 0.024); seed[i * 4 + 3] = soft ? 1 : 0;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
      g.setDrawRange(0, n);
      const U = { uTime: tU, uPxH: glowPx, uSun: { value: new THREE.Vector3(SUN.z / SUN.x, SUN.y / SUN.x, 0) }, uCol: { value: sunCol.clone() } };
      const dust = new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec4 aSeed; uniform float uTime; uniform float uPxH; uniform vec3 uSun; varying float vA; varying float vSoft;
          void main() {
            vec3 p = position;
            // a slow turning drift on closed loops: the same at every clock
            p += vec3(0.5 * sin(uTime * 0.11 + aSeed.x), 0.22 * sin(uTime * 0.14 + aSeed.y), 0.3 * cos(uTime * 0.12 + aSeed.x * 1.7));
            // is the sun's ray to this mote free? the front beam's underside, the gap of the middle columns, the porch's columns, the door
            float yBeam = p.y + (31.78 - p.x) * uSun.y, zFront = p.z + (30.89 - p.x) * uSun.x, zPorch = p.z + (22.52 - p.x) * uSun.x, zDoor = p.z + max(15.7 - p.x, 0.0) * uSun.x, zLeaf = p.z + max(${(DOOR_X + LEAF_W * Math.sin(LEAF_OPEN)).toFixed(2)} - p.x, 0.0) * uSun.x;
            float litK = (1.0 - smoothstep(${(Y_BEAM - 0.15).toFixed(2)}, ${Y_BEAM.toFixed(2)}, yBeam)) * (1.0 - smoothstep(1.4, 1.62, abs(zFront))) * (1.0 - smoothstep(1.52, 1.7, abs(zPorch))) * (1.0 - smoothstep(2.35, 2.5, abs(zDoor))) * (1.0 - smoothstep(${(DOOR_W / 2 - LEAF_W * Math.cos(LEAF_OPEN) - 0.1).toFixed(2)}, ${(DOOR_W / 2 - LEAF_W * Math.cos(LEAF_OPEN)).toFixed(2)}, abs(zLeaf)));
            vec4 mv = modelViewMatrix * vec4(p, 1.0); float dist = length(mv.xyz);
            gl_Position = projectionMatrix * mv;
            float px = aSeed.z * 0.5 * uPxH * projectionMatrix[1][1] / max(dist, 0.3);   // its size in metres at its distance, on any screen
            vSoft = aSeed.w;
            // a medium: it thins near the lens over 0.6 to 2.5 m of true distance; a mote smaller than a pixel and a half is drawn at that
            // size and fainter by as much, so the light it gives is the same on any screen
            float nearK = smoothstep(0.6, 2.5, dist);
            float small = min(1.0, px / 1.5);
            // a fine mote turns as it drifts and glints by turns
            float glint = mix(0.55 + 0.45 * sin(uTime * (1.3 + aSeed.y * 0.35) + aSeed.x * 7.0), 1.0, aSeed.w);
            vA = litK * nearK * small * small * glint * mix(0.6, 0.05, aSeed.w);
            gl_PointSize = max(px, 1.5);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying float vA; varying float vSoft;
          void main() { float r = clamp(length(gl_PointCoord - 0.5) * 2.0, 0.0, 1.0); float a = 1.0 - r; a = mix(a, a * a, vSoft); gl_FragColor = vec4(uCol * vA * a, 1.0); }`,
      }));
      dust.frustumCulled = false; dust.renderOrder = 60; scene.add(dust);
    }
    await ctx.yield();

    // ------------------------------------------------------------ incense (a medium: it thins to nothing within 2.5 m of the lens)
    // THREADS: a thin thread of blue grey smoke from the small altar and from each of the two burners before the barrier. A thread is a
    // line of small soft puffs that leave the bowl one after another; every puff keeps the sideways way the air gave it when it left, so
    // the thread curls and its curls are carried up with it; it widens and thins as it rises, leans west with the door's slow air, and
    // INC.h up, under the beams, it is spent. UNDER THE BEAMS what the threads have given hangs in two thin sheets in the nave's strip
    // between the wall plates, over the crown of his head and the eagle of his sceptre: uneven, in long wisps, the lower sheet drifting
    // slowly toward the door, the upper back toward the god. All of it is lit by place: by the door's daylight (blue grey, falling with
    // the distance from the door), by the gold's light where it hangs over him (as the timber is), and by the sun where the sun's ray
    // to it is free (the blade: the same free ray as the dust; the sheets hang above it).
    {
      const INC = { per: 420, h: FLOOR + CEIL - 0.5 - (F + BURNER.h), rate: 0.03, s0: 0.06, grow: 0.055, lean: 0.016, sheets: [CEIL - 0.45, CEIL - 0.18] };
      const a = SMALL_ALTAR, SRC = [[(a.x0 + a.x1) / 2, F + a.h + 0.03, (a.z0 + a.z1) / 2], [BURNER.x, F + BURNER.h + 0.01, -BURNER.z], [BURNER.x, F + BURNER.h + 0.01, BURNER.z]];
      const leafZ = DOOR_W / 2 - LEAF_W * Math.cos(LEAF_OPEN);
      const LIGHT = /* glsl */`
        uniform float uTime; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uDoor; uniform vec4 uGoldUp; uniform vec3 uGoldCol;
        vec3 smokeLight(vec3 p) {
          float yBeam = p.y + (31.78 - p.x) * uSun.y, zFront = p.z + (30.89 - p.x) * uSun.x, zPorch = p.z + (22.52 - p.x) * uSun.x, zDoor = p.z + max(15.7 - p.x, 0.0) * uSun.x, zLeaf = p.z + max(${(DOOR_X + LEAF_W * Math.sin(LEAF_OPEN)).toFixed(2)} - p.x, 0.0) * uSun.x;
          float litK = (1.0 - smoothstep(${(Y_BEAM - 0.15).toFixed(2)}, ${Y_BEAM.toFixed(2)}, yBeam)) * (1.0 - smoothstep(1.4, 1.62, abs(zFront))) * (1.0 - smoothstep(1.52, 1.7, abs(zPorch))) * (1.0 - smoothstep(2.35, 2.5, abs(zDoor))) * (1.0 - smoothstep(${(leafZ - 0.1).toFixed(2)}, ${leafZ.toFixed(2)}, abs(zLeaf)));
          // the door's daylight: the open door is a broad light in the east wall; a place takes of it as it sees it (aslant from under the beams near it)
          vec3 zd = vec3(${G(DOOR_X)}, ${G(F + DOOR_H / 2)}, 0.0) - p, g = uGoldUp.xyz - p; float d2 = dot(zd, zd);
          return uDoor * (30.0 * max(zd.x, 0.0) * inversesqrt(max(d2, 1e-4)) / (30.0 + d2) + 0.07) + uGoldCol * (uGoldUp.w / (1.0 + dot(g, g))) + uSunCol * litK;
        }`;
      const U = { uTime: tU, uPxH: glowPx, uSun: { value: new THREE.Vector3(SUN.z / SUN.x, SUN.y / SUN.x, 0) }, uSunCol: { value: sunCol.clone().multiplyScalar(INC_SUN) }, uDoor: { value: C('#9aa8e6').multiplyScalar(INC_DOOR) }, uGoldUp: goldUp, uGoldCol: { value: C('#fff0d8').multiplyScalar(INC_GOLD) } };
      // ---- the threads
      {
        const ri = mk('incense'), n = SRC.length * INC.per, pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
        SRC.forEach((q, k) => { const p0 = ri.range(0, 6.28), p1 = ri.range(0, 6.28), w = ri.range(0.9, 1.1); for (let i = 0; i < INC.per; i++) { const j = k * INC.per + i; pos.set(q, j * 3); seed[j * 4] = (i + ri.range(0, 0.3)) / INC.per; seed[j * 4 + 1] = p0; seed[j * 4 + 2] = p1; seed[j * 4 + 3] = w * Math.sign(-q[2]); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
        const threads = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          vertexShader: /* glsl */`
          attribute vec4 aSeed; uniform float uPxH; varying vec3 vC; ${LIGHT}
          void main() {
            float turn = uTime * ${G(INC.rate)} + aSeed.x, age = fract(turn), h = ${G(INC.h)} * age * (0.7 + 0.3 * age);
            float born = (floor(turn) - aSeed.x) / ${G(INC.rate)};   // the clock at which this puff left the bowl
            float amp = 0.012 * h + 0.006 * h * h, size = (${G(INC.s0)} + ${G(INC.grow)} * h) * abs(aSeed.w), gap = ${G(INC.h / INC.per)} * (0.7 + 0.6 * age);
            // (aSeed.w's sign: toward the nave's axis, where the rising air draws it in a little)
            float fine = 0.015 * min(h, 1.5) * (1.0 + 0.5 * h) * (0.35 + 0.65 * sin(born * 0.71 + aSeed.y * 2.0));
            vec3 p = position + vec3(amp * (sin(born * 0.5 + aSeed.y) + 0.45 * sin(born * 1.1 + aSeed.z + h * 0.9)) + fine * (sin(born * 2.9 + aSeed.z * 2.0) + 0.6 * sin(born * 4.7 + aSeed.y)) - ${G(INC.lean)} * h * h, h, 0.6 * amp * (cos(born * 0.43 + aSeed.z) + 0.45 * sin(born * 0.9 + aSeed.y + h * 1.1)) + fine * (cos(born * 2.3 + aSeed.y * 3.0) + 0.6 * sin(born * 3.9 + aSeed.z)) + sign(aSeed.w) * 0.004 * h * h);
            vec4 mv = modelViewMatrix * vec4(p, 1.0); float dist = length(mv.xyz); gl_Position = projectionMatrix * mv;
            // a puff smaller than a pixel and a half is drawn at that size and fainter by as much; the thread's own brightness falls as it
            // widens, and a puff's share of it is its gap over its breadth
            float px = size * 0.5 * uPxH * projectionMatrix[1][1] / max(dist, 0.3), small = min(1.0, px / 1.5);
            vC = smokeLight(p) * (smoothstep(0.0, 0.01, age) * (1.0 - smoothstep(0.45, 1.0, age)) * (${G(INC.s0)} / size) * (gap / size) * ${G(INC_THREAD)} * smoothstep(0.6, 2.5, dist) * small * small);
            gl_PointSize = max(px, 1.5);
          }`,
          fragmentShader: 'varying vec3 vC; void main() { float r = clamp(length(gl_PointCoord - 0.5) * 2.0, 0.0, 1.0); float a = 1.0 - r; gl_FragColor = vec4(vC * a * a, 1.0); }' }));
        threads.frustumCulled = false; threads.renderOrder = 59; scene.add(threads);
      }
      // ---- the two sheets under the beams
      {
        const P = [], zh = IN_Z - 0.5, xh = ROOM_X - 0.3; INC.sheets.forEach((y, k) => { for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.push(sx * xh, F + y, sz * zh); });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
        const sheets = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
          vertexShader: 'varying vec3 vW; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }',
          fragmentShader: /* glsl */`
          varying vec3 vW; ${LIGHT}
          float sh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float sn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(sh(i), sh(i + vec2(1.0, 0.0)), f.x), mix(sh(i + vec2(0.0, 1.0)), sh(i + vec2(1.0, 1.0)), f.x), f.y); }
          float sf(vec2 p) { return 0.5 * sn(p) + 0.3 * sn(p * 2.03 + 7.1) + 0.2 * sn(p * 4.1 + 3.3); }
          void main() {
            // the lower sheet drifts toward the door, the upper back toward the god. Where the smoke hangs (broad uneven fields, slowly
            // changing) it is drawn out in fine threads along its drift, bent by the air's slow eddies; each sheet's threads are its own
            float upper = step(${G(F + (INC.sheets[0] + INC.sheets[1]) / 2)}, vW.y), t = uTime, flow = mix(0.14, -0.09, upper) * t;
            vec2 w = vec2(vW.x - flow, vW.z) + upper * vec2(37.0, 11.0);
            vec2 eddy = vec2(sn(w * 0.45 + vec2(0.0, t * 0.021)), sn(w * 0.45 + vec2(5.2, -t * 0.017))) - 0.5;
            float field = smoothstep(0.38, 0.7, sf(w * vec2(0.3, 0.55) + vec2(0.0, t * 0.01)));
            vec2 q = (w + 2.1 * eddy + 0.5 * (vec2(sn(w * 1.3 + vec2(9.0, t * 0.03)), sn(w * 1.3 + vec2(-4.0, t * 0.026))) - 0.5)) * vec2(0.62, 2.0);
            float a1 = 1.0 - abs(2.0 * sn(q) - 1.0), a2 = 1.0 - abs(2.0 * sn(q * vec2(1.9, 2.3) + vec2(3.1, t * 0.04)) - 1.0);
            float d = field * (0.07 + (0.7 * a1 * a1 * a1 * a1 + 0.4 * a2 * a2 * a2 * a2 * a2) * (0.45 + 0.75 * sn(w * 0.9 + vec2(2.0, -t * 0.02))));
            float room = (1.0 - smoothstep(${G(IN_Z - 1.3)}, ${G(IN_Z - 0.55)}, abs(vW.z))) * (1.0 - smoothstep(${G(ROOM_X - 1.6)}, ${G(ROOM_X - 0.4)}, abs(vW.x)));
            gl_FragColor = vec4(smokeLight(vW) * (d * room * ${G(INC_SHEET)} * smoothstep(0.6, 2.5, length(vW - cameraPosition))), 1.0);
          }` }));
        sheets.renderOrder = 58; scene.add(sheets);
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ bronze: the galleries' rails, the grilles, the gates, the great door's leaves; the wooden stairs
    {
      const parts = [], bars = [], bar = (x, y0, y1, z, r) => bars.push([x, y0, z, r, y1 - y0]);   // every upright bar is one shape drawn again
      // a run of upright bars between two rails along x (or along z when turn is set)
      const run = (a0, a1, fixed, y0, h, step, turn) => {
        const nb = Math.max(2, Math.round(Math.abs(a1 - a0) / step));
        for (let i = 0; i <= nb; i++) { const a = lerp(a0, a1, i / nb); if (turn) bar(fixed, y0, y0 + h, a, 0.016); else bar(a, y0, y0 + h, fixed, 0.016); }
        for (const yy of [y0 + 0.08, y0 + h]) parts.push(turn ? box(fixed - 0.025, yy - 0.025, a0, fixed + 0.025, yy + 0.025, a1, BRONZE_L) : box(a0, yy - 0.025, fixed - 0.025, a1, yy + 0.025, fixed + 0.025, BRONZE_L));
      };
      const xsUp = [ROOM_X - 0.3, ...IN_X, -ROOM_X + 0.3];
      for (const s of [-1, 1]) {
        for (let i = 0; i < xsUp.length - 1; i++) run(xsUp[i] - 0.45, xsUp[i + 1] + 0.45, s * (IN_Z - 0.45), F + GALLERY, RAIL_H, 0.2, false);
        // from the fifth column west: plain bronze grilles as high as the barrier
        const xsG = [IN_X[4], IN_X[5], IN_X[6], -ROOM_X + 0.4];
        for (let i = 0; i < 3; i++) run(xsG[i] - 0.72, xsG[i + 1] + 0.72, s * IN_Z, F, BARRIER_H, 0.17, false);
        // the barrier's double gate, standing open toward the door
        run(BARRIER_X + BARRIER_T, BARRIER_X + BARRIER_T + BARRIER_LEAF.len, s * GATE_HALF, F, BARRIER_LEAF.h, 0.14, false);
        // the EAST porch's three double gates (between the two columns, and between each column and its wall end), all standing open: each leaf
        // hangs on two hinges from a bronze post at its opening's side and is swung square back into the porch. A leaf: two stiles, a foot rail,
        // a middle rail and a top rail, upright bars between, every bar ending in a point over the top rail. The west porch has no gates.
        for (const [zz, len] of [[GATE_POSTS[0], GATE_LEAF[0]], [GATE_POSTS[1], GATE_LEAF[1]], [GATE_POSTS[2], GATE_LEAF[1]]]) {
          const z = s * zz, x0 = GATE_X, y0 = PORCH_Y, h = GATE_H, xa = x0 - 0.14, xb = x0 - 0.14 - len;
          parts.push(box(x0 - 0.08, y0, z - 0.08, x0 + 0.08, y0 + h + 0.3, z + 0.08, BRONZE_D), paint(new THREE.ConeGeometry(0.11, 0.16, 4).rotateY(Math.PI / 4).translate(x0, y0 + h + 0.38, z), BRONZE_L));
          for (const x of [xa, xb]) parts.push(box(x - 0.04, y0 + 0.06, z - 0.035, x + 0.04, y0 + h, z + 0.035, BRONZE_D));
          for (const yy of [0.1, h * 0.5, h - 0.1]) parts.push(box(xb, y0 + yy - 0.045, z - 0.03, xa, y0 + yy + 0.045, z + 0.03, BRONZE_D));
          for (const yy of [0.55, h - 0.55]) parts.push(box(xa, y0 + yy - 0.05, z - 0.045, x0 - 0.06, y0 + yy + 0.05, z + 0.045, BRONZE_L));
          const nb = Math.round((len - 0.1) / 0.13);
          for (let i = 1; i < nb; i++) { const x = lerp(xa, xb, i / nb); bar(x, y0 + 0.1, y0 + h + 0.12, z, 0.018); parts.push(paint(new THREE.ConeGeometry(0.032, 0.13, 4, 1, true).translate(x, y0 + h + 0.185, z), BRONZE_L)); }
        }
        // the great door's bronze leaves, each swung LEAF_OPEN into the porch: stiles and five rails, four raised panels, a row of round
        // bosses on every rail, the same on both faces
        const leaf = [box(0, 0, -0.04, LEAF_W, DOOR_H, 0.04, BRONZE), box(0, 0, -0.075, 0.2, DOOR_H, 0.075, BRONZE_D), box(LEAF_W - 0.2, 0, -0.075, LEAF_W, DOOR_H, 0.075, BRONZE_D)];
        const railH = 0.3, panelH = (DOOR_H - 5 * railH) / 4;
        for (let j = 0; j < 5; j++) {
          const y = j * (railH + panelH);
          leaf.push(box(0.2, y, -0.075, LEAF_W - 0.2, y + railH, 0.075, BRONZE_D));
          for (let i = 0; i < 5; i++) for (const f of [-1, 1]) leaf.push(paint(new THREE.SphereGeometry(0.065, 6, 4).scale(1, 1, 0.7).translate(0.42 + i * 0.4, y + railH / 2, f * 0.08), BRONZE_L));
          if (j < 4) leaf.push(box(0.36, y + railH + 0.16, -0.06, LEAF_W - 0.36, y + railH + panelH - 0.16, 0.06, BRONZE_L));
        }
        parts.push(merged(leaf).rotateY(Math.atan2(s * Math.cos(LEAF_OPEN), Math.sin(LEAF_OPEN))).translate(DOOR_X + 0.08, F, s * DOOR_W / 2));
        await ctx.yield();
      }
      // the two incense burners before the barrier's blue faces: a spreading foot, a slender stem with a knop, a bowl, a pierced domed lid
      for (const sd of [-1, 1]) {
        const b = BURNER, prof = [[b.r, 0], [b.r, 0.02], [0.05, 0.07], [0.02, 0.12], [0.018, 0.42], [0.04, 0.45], [0.018, 0.48], [0.02, b.h - 0.24], [0.085, b.h - 0.16], [0.1, b.h - 0.1], [0.085, b.h - 0.085], [0.07, b.h - 0.05], [0.03, b.h - 0.012], [0.012, b.h - 0.02], [0.02, b.h], [0, b.h]].map((v) => new THREE.Vector2(v[0], v[1]));
        parts.push(paint(new THREE.LatheGeometry(prof, 10).translate(b.x, F, sd * b.z), BRONZE_L));
      }
      // where the sun reaches it the bronze catches it: a broad warm sheen about the line the sun is thrown back along
      const bronzeMat = std({ roughness: 0.42, metalness: 0.3 }, 'bronze', (sh) => {
        // cast and worn: its tone a little uneven, darker in patches
        sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ vec2 zq = vec2(vZW.x + vZW.z, vZW.y); float zu = zeusVal(zq * 2.3 + 5.1), zu2 = zeusVal(zq * 9.0); diffuseColor.rgb *= (0.88 + 0.2 * zu) * (0.95 + 0.1 * zu2); diffuseColor.g *= 0.97 + 0.05 * zu; }');
        sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
#if NUM_DIR_LIGHTS > 0
{ vec3 zl = directionalLights[0].direction, zh = normalize(zl + geometryViewDir); float zs = pow(saturate(dot(normal, zh)), 9.0) * saturate(dot(normal, zl) * 4.0);
  float zlit = dot(reflectedLight.directDiffuse, vec3(0.333)) / max(dot(diffuseColor.rgb, vec3(0.333)) * 1.1, 1e-3);
  reflectedLight.directSpecular += diffuseColor.rgb * directionalLights[0].color * (0.5 * zs * min(zlit, 1.0)); }
#endif`);
      });   // worn bronze: it takes the warm light of the floor and the sky, and throws the sun back where the sun reaches it between the columns
      add(merged(parts), bronzeMat, { cast: true });
      await ctx.yield();
      const barIm = instanced(paint(new THREE.CylinderGeometry(1, 1, 1, 5, 1, true).translate(0, 0.5, 0), BRONZE_L), bronzeMat, bars);
      barIm.castShadow = true;
      // the wooden stairs to the galleries, one each side of the door, along the side walls
      const wood = [];
      for (const s of [-1, 1]) {
        for (let i = 0; i < 26; i++) { const x = 6.2 + i * 0.29, y = F + (i + 1) * (GALLERY - 0.3) / 26; wood.push(box(x, y - 0.06, s * 5.25, x + 0.33, y, s * 6.5, CEDAR_D)); }
        wood.push(paint(new THREE.BoxGeometry(10.9, 0.3, 0.08).rotateZ(Math.atan2(GALLERY - 0.3, 7.54)).translate(9.97, F + 3.7, s * 5.22), CEDAR_D));
      }
      add(merged(wood), std({ roughness: 0.85 }, 'stone'));
    }
    await ctx.yield();
    // the still figures inside, as dealt (dealInside): on the open floor by the columns before the barrier, at the galleries' east rails
    {
      const parts = [], skin = C('#9a6a48'), cloths = ['#b8ab92', '#8f7a5c', '#a39a8c', '#6f5a48', '#c2b8a0', '#7c6a70'].map(C);
      // each shifts its weight and turns a little, very slowly, on phases of its own (the stream 'inside-sway'): about its own feet, so
      // it stays on its stand (none stands in the blade of sun: the one map of shadows stays true)
      const rs = mk('inside-sway');
      for (const q of dealInside(ctx.seed)) {
        const g = figureGeo(q.h, { kind: q.cloak ? 'cloak' : 'tunic', skin, cloth: cloths[q.cloth], hair: C('#2a2018'), armR: q.armR, armL: q.armL, lean: q.lean }).rotateY(q.yaw).translate(q.x, F + q.y, q.z);
        const n = g.attributes.position.count, a = new Float32Array(n * 4), ph = rs.range(0, 6.28);
        for (let i = 0; i < n; i++) { a[i * 4] = q.x; a[i * 4 + 1] = q.z; a[i * 4 + 2] = ph; a[i * 4 + 3] = F + q.y; }
        g.setAttribute('aFig', new THREE.BufferAttribute(a, 4)); parts.push(g);
      }
      if (parts.length) add(merged(parts), std({ roughness: 0.9 }, 'figure-in', (sh) => {
        sh.uniforms.uTime = tU;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aFig; uniform float uTime;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float zh = max(transformed.y - aFig.w, 0.0), za = 0.07 * sin(uTime * 0.21 + aFig.z) + 0.03 * sin(uTime * 0.53 + aFig.z * 2.3), zc = cos(za), zn = sin(za); vec2 zd = transformed.xz - aFig.xy; transformed.xz = aFig.xy + vec2(zd.x * zc - zd.y * zn, zd.x * zn + zd.y * zc) + zh * 0.016 * vec2(sin(uTime * 0.37 + aFig.z * 1.7), cos(uTime * 0.29 + aFig.z)); }');
      }), { cast: true });
    }
    await ctx.yield();
    // ------------------------------------------------------------ the grove: the deal, then the trees (plane trees and wild olives)
    // the way's trees' shapes are made and measured one by one before the deal that stands them
    for (let i = 0; i < WAY_TREE_MODELS; i++) { wayTreeModel(i); await ctx.yield(); }
    theWay(); await ctx.yield();
    wayTrees(); await ctx.yield();
    const grove = dealGrove(ctx.seed, vary);
    await ctx.yield();
    // (the life's deal part by part, a step of the build each: see lifeSteps)
    const lifeIt = lifeSteps(ctx.seed, vary, grove); let lifeStep = lifeIt.next();
    while (!lifeStep.done) { await ctx.yield(); lifeStep = lifeIt.next(); }
    const life = lifeStep.value;
    await ctx.yield();
    const TREE_H = [17, 6.2];                                         // the heights the two kinds are modelled at
    {
      const wind = flora.makeWind({ direction: [-0.9, 0.3], strength: 1.35, speed: 0.9 });
      const leafOpts = { wind, ambient: 1, leafAmbient: 1, backlight: 0.7, backlightTint: '#e2f08a', wrap: 0.7, sheen: 0.4 };
      await flora.prepareLeafTexture(leafOpts, ctx.yield);
      // a plane's bark is pale and mottled: it flakes off in large plates, cream where the newest have gone, grey olive where the old
      // bark holds, tan between (drawn by the place on the trunk; the paler the kind's bark, the more: the olives' dark bark keeps its furrows alone)
      const leafMat = lit(flora.windMaterial(leafOpts), 'leaf', { kit: true, then: (sh) => {
        shaded('zs.b')(sh);
        sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', `{ float zl = dot(vColor.rgb, vec3(0.3, 0.6, 0.1)), zk = (1.0 - smoothstep(0.0, 0.5, vFlora.x)) * smoothstep(0.17, 0.3, zl);
          if (zk > 0.0) { vec3 zq = vFloraPos; float za = floraNoise(zq * vec3(1.9, 1.1, 1.9) + 3.1), zb = floraNoise(zq * vec3(4.3, 2.6, 4.3) + 17.0), zc = floraNoise(zq * vec3(0.8, 0.5, 0.8) + 41.0);
            float zp = smoothstep(0.45, 0.52, za + 0.25 * (zc - 0.5)), zo = smoothstep(0.52, 0.6, zb) * (1.0 - zp);
            diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(0.8, 0.8, 0.7), vec3(1.2, 1.15, 1.02), zp) * mix(vec3(1.0), vec3(0.74, 0.78, 0.66), zo), zk); } }
#include <normal_fragment_begin>`);
      } });
      const PLANE = PLANE_COL, OLIVE = OLIVE_COL;
      const nearV = [], farV = [];
      for (let i = 0; i < 5; i++) {
        const olive = i >= 3, o = { height: TREE_H[olive ? 1 : 0], fullness: olive ? 1.25 : 1.1, flex: 0.6, ...(olive ? OLIVE : PLANE) };
        nearV.push(flora.oakGeometry({ ...o, rng: mk('tree-shape-' + i), detail: 1 })); await ctx.yield();
        farV.push(flora.oakGeometry({ ...o, rng: mk('tree-far-shape-' + i), detail: 0 })); await ctx.yield();
      }
      // the finer trees stand near the sacred way and the temple's axis (a place of the world), the plainer ones beyond
      const pts = grove.trees.filter((t) => !t.far && !t.way).map((t, i) => ({ x: t.x, y: groundY(t.x, t.z), z: t.z, s: t.h / TREE_H[t.kind], rot: t.rot, d: Math.min(Math.abs(t.z - wayZ(t.x)), roadAt.off(t.x, t.z), wayGap(t.x, t.z, 0, 99)), u: t.bank ? 0.9 : 0.8 * clamp((t.x + 130) / 285, 0, 0.999), v: t.kind ? 3 + (i % 2) : i % 3 }));
      const trees = flora.makeScatter({ rng: mk('tree-scatter'), points: pts, variants: nearV, farVariants: farV, farDistance: 24, chunks: 5, material: leafMat, tint: 0.14, hue: 0.04, stretch: 0.1, tilt: 0.03, sink: 0.01 });
      outdoor.add(trees.object);
      updates.push((dt, time, camera) => trees.update(dt, time, camera));
      for (const m of trees.meshes) part(m, boxOf(m));
      await ctx.yield();
      // the way's trees: each stands as it was measured (no stretch, no tilt, not sunk), in its own finer shape
      const WT = wayTrees(), wpts = WT.list.map((t) => ({ x: t.x, y: groundY(t.x, t.z) - 0.04, z: t.z, s: t.s, rot: t.rot, d: 0, u: 0.5, v: t.m }));
      const wtrees = flora.makeScatter({ rng: mk('way-tree-scatter'), points: wpts, variants: WT.models.map((m) => m.g), material: leafMat, tint: 0.1, hue: 0.03, stretch: 0, tilt: 0, sink: 0 });
      outdoor.add(wtrees.object);
      for (const m of wtrees.meshes) part(m, boxOf(m));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the painted shade: at so low a sun every thing of the grove throws a shadow many times its height
    // One picture of the grove's floor, drawn from the sun's true direction: r the trees, g the statues, altars, ash cone and
    // pillar, b the buildings. The ground takes all three; a thing takes the kinds that are not itself (see shaded above).
    {
      const cv = document.createElement('canvas'); cv.width = SHADE.w; cv.height = SHADE.h;
      const c2 = cv.getContext('2d'), sx = SHADE.w / (SHADE.x1 - SHADE.x0), sz = SHADE.h / (SHADE.z1 - SHADE.z0);
      c2.fillStyle = '#fff'; c2.fillRect(0, 0, SHADE.w, SHADE.h);
      c2.setTransform(sx, 0, 0, sz, -SHADE.x0 * sx, -SHADE.z0 * sz);
      c2.globalCompositeOperation = 'multiply';
      // the shadow of a point h metres up lies h * (KX, KZ) from its foot
      const KX = -SUN.x / SUN.y, KZ = -SUN.z / SUN.y, K = Math.hypot(KX, KZ), ang = Math.atan2(KZ, KX), nx = -KZ / K, nz = KX / K;
      const CH_R = 'rgba(0,255,255,', CH_G = 'rgba(255,0,255,', CH_B = 'rgba(255,255,0,';
      const poly = (pts, style) => { c2.fillStyle = style; c2.beginPath(); pts.forEach((q, i) => (i ? c2.lineTo(q[0], q[1]) : c2.moveTo(q[0], q[1]))); c2.closePath(); c2.fill(); };
      const hull = (pts) => {
        const a = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]), cr = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]), lo = [], hi = [];
        for (const q of a) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
        for (let i = a.length - 1; i >= 0; i--) { const q = a[i]; while (hi.length > 1 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
        return lo.slice(0, -1).concat(hi.slice(0, -1));
      };
      // a strip along the shadow from height h0 to h1 of a thing w0 wide at h0 and w1 at h1
      // (style ends in an alpha and a bracket; with soft, the shadow thins toward its far end as the sun's disc blurs it)
      const strip = (x, z, h0, h1, w0, w1, style, soft) => {
        let fill = style;
        if (soft) { const m = style.match(/^(.*,)([\d.]+)\)$/), a = +m[2]; fill = c2.createLinearGradient(x + KX * h0, z + KZ * h0, x + KX * h1, z + KZ * h1); fill.addColorStop(0, style); fill.addColorStop(0.6, m[1] + (a * 0.85).toFixed(3) + ')'); fill.addColorStop(1, m[1] + (a * 0.3).toFixed(3) + ')'); }
        poly([[x + KX * h0 + nx * w0 / 2, z + KZ * h0 + nz * w0 / 2], [x + KX * h1 + nx * w1 / 2, z + KZ * h1 + nz * w1 / 2], [x + KX * h1 - nx * w1 / 2, z + KZ * h1 - nz * w1 / 2], [x + KX * h0 - nx * w0 / 2, z + KZ * h0 - nz * w0 / 2]], fill);
      };
      // the small dark shade under a thing where it meets the ground
      const foot = (x, z, r, alpha, ch) => { const gr = c2.createRadialGradient(x, z, 0, x, z, r); gr.addColorStop(0, ch + alpha + ')'); gr.addColorStop(0.55, ch + (alpha * 0.8).toFixed(3) + ')'); gr.addColorStop(1, ch + '0)'); c2.fillStyle = gr; c2.beginPath(); c2.arc(x, z, r, 0, 6.2832); c2.fill(); };
      // a crown: the shadow of a ball rh wide and rv high with its middle hc up, soft at its rim
      const crown = (x, z, hc, rh, rv, alpha, ch) => {
        c2.save(); c2.translate(x + KX * hc, z + KZ * hc); c2.rotate(ang); c2.scale(Math.hypot(rh, rv * K), rh);
        const gr = c2.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, ch + alpha + ')'); gr.addColorStop(0.7, ch + (alpha * 0.92).toFixed(3) + ')'); gr.addColorStop(1, ch + '0)');
        c2.fillStyle = gr; c2.beginPath(); c2.arc(0, 0, 1, 0, 6.2832); c2.fill(); c2.restore();
      };
      const inField = (x, z) => x > SHADE.x0 - 10 && x < SHADE.x1 + 200 && z > SHADE.z0 - 30 && z < SHADE.z1 + 30;
      let n = 0;
      for (const t of grove.trees) {
        if (!inField(t.x, t.z)) continue;
        const h = t.h;
        strip(t.x, t.z, 0, h * 0.34, h * (t.kind ? 0.07 : 0.05), h * 0.04, CH_R + '0.9)');
        if (t.kind) crown(t.x, t.z, h * 0.6, h * 0.5, h * 0.38, 0.74, CH_R); else crown(t.x, t.z, h * 0.62, h * 0.4, h * 0.36, 0.82, CH_R);
        foot(t.x, t.z, h * (t.kind ? 0.2 : 0.11), 0.6, CH_R);
        if (++n % 40 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (const q of grove.statues) {
        const hf = 1.75 * q.s, w = 0.5 * q.s;
        strip(q.x, q.z, 0, q.base, q.bw, q.bw, CH_G + '0.9)');
        strip(q.x, q.z, q.base, q.base + hf * 0.82, w, w * 0.9, CH_G + '0.86)');
        strip(q.x, q.z, q.base + hf * 0.82, q.base + hf, w * 0.5, w * 0.4, CH_G + '0.7)', true);
        foot(q.x, q.z, q.bw * 1.25, 0.55, CH_G);
        if (++n % 120 === 0) await ctx.yield();
      }
      for (const q of grove.altars) { strip(q.x, q.z, 0, q.h, q.w * 1.2, q.w * 1.2, CH_G + '0.88)', true); foot(q.x, q.z, q.w * 1.3, 0.5, CH_G); }
      // the people who stand: a body's width at the hips, a head's at the far end
      for (const q of life.people.concat(life.under, life.ground.filter((f) => !f.box)) /* (under, ground: r5 step 10) */) { strip(q.x, q.z, 0, q.h * 0.86, 0.44, 0.34, CH_G + '0.82)'); strip(q.x, q.z, q.h * 0.86, q.h, 0.2, 0.16, CH_G + '0.7)', true); foot(q.x, q.z, 0.5, 0.5, CH_G); if (++n % 120 === 0) await ctx.yield(); }
      // the ash cone and its stage, the three sided pillar and the figure on it
      strip(ALTAR.x, ALTAR.z, 0, ALTAR.h, ALTAR.r * 2, ALTAR.top, CH_G + '0.9)', true); strip(ALTAR.x, ALTAR.z, 0, ALTAR.stageH, ALTAR.stage, ALTAR.stage, CH_G + '0.9)');
      strip(PILLAR.x, PILLAR.z, 0, PILLAR.h, 2.0, 1.3, CH_G + '0.9)'); strip(PILLAR.x, PILLAR.z, PILLAR.h, PILLAR.all, 1.5, 0.5, CH_G + '0.8)', true); foot(PILLAR.x, PILLAR.z, 2.4, 0.55, CH_G);
      await ctx.yield();
      // the buildings: the footprint swept along the shadow to the height of the walls, the ridge beyond
      const mass = (x0, z0, x1, z1, hw, rise) => {
        const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], alongX = x1 - x0 > z1 - z0, hr = hw + rise;
        for (const q of pts.slice(0, 4)) pts.push([q[0] + KX * hw, q[1] + KZ * hw]);
        if (alongX) pts.push([x0 + KX * hr, (z0 + z1) / 2 + KZ * hr], [x1 + KX * hr, (z0 + z1) / 2 + KZ * hr]); else pts.push([(x0 + x1) / 2 + KX * hr, z0 + KZ * hr], [(x0 + x1) / 2 + KX * hr, z1 + KZ * hr]);
        // the shadow's far edge is as soft as the sun is wide (half a degree): PEN m along the ground at the ridge's shadow
        const hp = hull(pts), far = Math.max(...hp.map((q) => q[0] * KX / K + q[1] * KZ / K)), pen = hr * SUN_WIDE * (1 + K * K);
        const gr = c2.createLinearGradient((far - pen) * KX / K, (far - pen) * KZ / K, far * KX / K, far * KZ / K);
        // (0.92: the share of the sun a building's painted shade takes where it is full. A FIGURE TYPED TWICE: R5_DEEP, 0.08 at the head
        // of the shaders, is 1 less this and is typed apart: who changes one changes the other)
        gr.addColorStop(0, CH_B + '0.92)'); gr.addColorStop(0.5, CH_B + '0.46)'); gr.addColorStop(1, CH_B + '0)');
        poly(hp, gr);
      };
      for (const m of MASSES) mass(m[0], m[1], m[2], m[3], m[4], m[5]);
      mass(-33.3, -15.1, 33.3, 15.1, Y_EAVE, RIDGE - Y_EAVE);
      strip(ROUND.x, ROUND.z, 0, ROUND.h, ROUND.r * 2, ROUND.r * 1.2, CH_B + '0.92)');
      // the field's rim stays in the sun, so that what lies beyond it is lit plain
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalCompositeOperation = 'source-over'; c2.strokeStyle = '#fff'; c2.lineWidth = 6; c2.strokeRect(0, 0, SHADE.w, SHADE.h);
      const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 4;
      place.uShade.value = tex; ownTextures.push(tex);
    }
    // the ground's marks (the same field as the shade): fallen leaves under each plane tree's crown, fewer under an olive; the ground worn
    // to the earth round every base and altar, where people stand, at the foot of the steps and along the paving's edges
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
      const c2 = cv.getContext('2d'), sx = 1024 / (SHADE.x1 - SHADE.x0), sz = 1024 / (SHADE.z1 - SHADE.z0);
      c2.fillStyle = '#000'; c2.fillRect(0, 0, 1024, 1024);
      c2.setTransform(sx, 0, 0, sz, -SHADE.x0 * sx, -SHADE.z0 * sz);
      c2.globalCompositeOperation = 'lighter';
      const disc = (x, z, r, a, ch) => { const gr = c2.createRadialGradient(x, z, 0, x, z, r); gr.addColorStop(0, ch + a + ')'); gr.addColorStop(0.6, ch + (a * 0.7).toFixed(3) + ')'); gr.addColorStop(1, ch + '0)'); c2.fillStyle = gr; c2.beginPath(); c2.arc(x, z, r, 0, 6.2832); c2.fill(); };
      const R = 'rgba(255,0,0,', G = 'rgba(0,255,0,', B = 'rgba(0,0,255,';
      for (const t of grove.trees) if (!t.far && !t.bank) { disc(t.x, t.z, t.kind ? t.h * 0.42 : t.h * 0.46, t.kind ? 0.35 : 0.95, R); disc(t.x, t.z, 0.6 + t.h * 0.05, 0.8, B); }
      // the contact shade: under every base, altar and standing person the ground is dark where the sky does not reach it
      for (const b of grove.bases) { const n = Math.max(1, Math.round(b.len / 0.9)); for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.9; disc(b.x - Math.sin(b.yaw) * o, b.z + Math.cos(b.yaw) * o, b.w * 0.75 + 0.55, 0.95, B); } }
      for (const q of grove.altars) disc(q.x, q.z, q.w * 0.8 + 0.6, 0.9, B);
      for (const q of life.people.concat(life.under, life.front.filter((f) => f.y == null), life.ground) /* (r5 step 10) */) if (!q.bank) disc(q.x, q.z, 0.62, 0.85, B);
      disc(PILLAR.x, PILLAR.z, 2.2, 0.9, B);
      for (const q of grove.statues) disc(q.x, q.z, q.bw * 1.5 + 0.7, 0.8, G);
      for (const q of grove.altars) disc(q.x, q.z, q.w + 1.8, 0.9, G);
      for (const q of life.people) if (!q.bank) disc(q.x, q.z, 1.2, 0.55, G);
      disc(ALTAR.x, ALTAR.z, ALTAR.stage / 2 + 5, 1.0, G); disc(PILLAR.x, PILLAR.z, 3.6, 0.9, G);
      c2.fillStyle = G + '0.7)'; c2.fillRect(34.5, -17, 4.5, 34); c2.fillRect(-39, -17, 4.5, 34); c2.fillRect(-35, -19.5, 70, 3); c2.fillRect(-35, 16.5, 70, 3);
      const tex = new THREE.CanvasTexture(cv); tex.flipY = false; tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      place.uMarks.value = tex; ownTextures.push(tex);
    }
    await ctx.yield();
    // ------------------------------------------------------------ the later buildings: far plain masses, walls and a tiled roof each
    const ROOF = C('#b28e72'), ROOF_D = C('#a07e64'), PLASTER = C('#e0d6c2'), PLASTER_D = C('#cbbfa8');
    const farMat = std({ roughness: 0.88 }, 'far', (sh) => {
      shaded('zs.r')(sh);
      // rows of roof tiles on the far roofs (the red toned faces), fading where they would be finer than the picture's grain
      sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n{ float zr = step(vColor.b * 2.0, vColor.r); vec3 zc = cross(dFdx(vZW), dFdy(vZW)); vec3 zfn = zc * inversesqrt(max(dot(zc, zc), 1e-12)); vec2 zd = zfn.xz / max(length(zfn.xz), 1e-3); vec2 zt = vec2(dot(vZW.xz, vec2(-zd.y, zd.x)) * 1.7, dot(vZW.xz, zd) * 1.1); vec2 zf = clamp(1.0 - fwidth(zt) * 1.6, 0.0, 1.0); vec2 zl = smoothstep(0.0, 0.16, abs(fract(zt) - 0.5)); diffuseColor.rgb *= 1.0 - zr * ((1.0 - zl.x) * zf.x * 0.24 + (1.0 - zl.y) * zf.y * 0.07); }');
    });
    {
      const parts = [];
      // a gabled roof over a rectangle, its ridge along the longer side
      const roof = (x0, z0, x1, z1, y, rise, over = 0.5) => {
        const alongX = x1 - x0 > z1 - z0, half = (alongX ? z1 - z0 : x1 - x0) / 2 + over, len = (alongX ? x1 - x0 : z1 - z0) + 2 * over;
        const g = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(half, 0), new THREE.Vector2(0, rise)]), { depth: len, bevelEnabled: false });
        g.translate(0, 0, -len / 2); if (alongX) g.rotateY(Math.PI / 2);
        g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
        const p = g.attributes.position, nr = g.attributes.normal, cl = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) { const c = nr.getY(i) > 0.2 ? ((Math.floor((alongX ? p.getX(i) : p.getZ(i)) * 0.5) & 1) ? ROOF : ROOF_D) : PLASTER; cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); return g;
      };
      const house = (x0, z0, x1, z1, hw, rise, c = PLASTER) => { const y = groundY((x0 + x1) / 2, (z0 + z1) / 2); parts.push(box(x0, y - 1, z0, x1, y + hw, z1, c), roof(x0, z0, x1, z1, y + hw, rise)); };
      // a court house: four wings round an open yard
      const court = (x0, z0, x1, z1, hw, rise, d) => { house(x0, z0, x1, z0 + d, hw, rise); house(x0, z1 - d, x1, z1, hw, rise); house(x0, z0 + d, x0 + d, z1 - d, hw, rise, PLASTER_D); house(x1 - d, z0 + d, x1, z1 - d, hw, rise, PLASTER_D); };
      const post = (x, z, y0, y1, r) => parts.push(paint(new THREE.CylinderGeometry(r * 0.85, r, y1 - y0, 8, 1, true).translate(x, (y0 + y1) / 2, z), PLASTER));
      for (const m of MASSES) {
        const [x0, z0, x1, z1, hw, rise, name] = m;
        if (name === 'the long colonnade') {
          // a back wall to the east, a roof on two rows of columns open to the grove
          const y = 0; parts.push(box(x0, y - 0.5, z0, x1, y + 0.35, z1, PLASTER_D), box(x1 - 0.7, y, z0, x1, y + hw, z1, PLASTER), box(x0, y, z0, x1, y + hw, z0 + 0.7, PLASTER), box(x0, y, z1 - 0.7, x1, y + hw, z1, PLASTER));
          parts.push(box(x0, y + hw - 0.75, z0, x0 + 0.8, y + hw, z1, PLASTER), roof(x0, z0, x1, z1, y + hw, rise, 0.6));
          for (let z = z0 + 3; z < z1 - 1; z += 6) parts.push(box(x1, y, z - 0.45, x1 + 0.35, y + hw - 0.5, z + 0.45, PLASTER_D));
          parts.push(box(x1, y, z0, x1 + 0.18, y + 1.1, z1, PLASTER_D), box(x1, y + hw - 0.5, z0, x1 + 0.25, y + hw, z1, PLASTER_D));
          for (let z = z0 + 1.6; z < z1 - 1; z += 2.48) { post(x0 + 0.4, z, y + 0.35, y + hw - 0.75, 0.38); if (Math.round((z - z0) / 2.48) % 2 === 0) post(x0 + 5.2, z, y + 0.35, y + hw, 0.3); }
        } else if (name === 'the old low temple') {
          house(x0 + 2, z0 + 2, x1 - 2, z1 - 2, hw, 0.4, PLASTER_D); parts.push(box(x0, 0, z0, x1, 0.9, z1, PLASTER_D), roof(x0, z0, x1, z1, 0.9 + hw, rise, 0.3));
          for (let i = 0; i < 16; i++) { const x = lerp(x0 + 0.9, x1 - 0.9, i / 15); post(x, z1 - 0.9, 0.9, 0.9 + hw, 0.62); post(x, z0 + 0.9, 0.9, 0.9 + hw, 0.62); }
          for (let i = 1; i < 5; i++) { const z = lerp(z0 + 0.9, z1 - 0.9, i / 5); post(x1 - 0.9, z, 0.9, 0.9 + hw, 0.62); post(x0 + 0.9, z, 0.9, 0.9 + hw, 0.62); }
        } else if (name === 'the treasuries') {
          // a terrace under the hill and on it a row of small houses, each with its gable to the grove
          const y = groundY((x0 + x1) / 2, z1 + 4); parts.push(box(x0 - 4, y - 1, z0 - 2, x1 + 4, y + 2.2, z1 + 2.5, PLASTER_D));
          for (let i = 0; i < 11; i++) { const xa = x0 + i * (x1 - x0) / 11 + 0.7, xb = x0 + (i + 1) * (x1 - x0) / 11 - 0.7, zb = z1 - (i % 3) * 0.8; parts.push(box(xa, y + 2.2, z0, xb, y + 2.2 + hw, zb, i % 2 ? PLASTER : PLASTER_D), roof(xa, z0, xb, zb, y + 2.2 + hw, rise, 0.3)); }
        } else if (name === 'the fountain building') {
          house(x0, z1 - 4, x1, z1, hw, rise); parts.push(paint(new THREE.CylinderGeometry(11, 11, hw + 1.5, 20, 1, false, Math.PI / 2, Math.PI).translate(0, (hw + 1.5) / 2, z1 - 4), PLASTER_D));
        } else if (name === 'a large house to the south west' || name === 'the wrestling school' || name === 'the training ground') court(x0, z0, x1, z1, hw, rise, name === 'the training ground' ? 9 : 13);
        else house(x0, z0, x1, z1, hw, rise);
      }
      await ctx.yield();
      // the stadium: the two starting sills across the track, the judges' stand on the near bank, the altar on the far one, the vaulted way in from the grove
      for (const x of [181, 373]) parts.push(box(x, groundY(x, -46) - 0.2, -60, x + 0.6, groundY(x, -46) + 0.1, -32, PLASTER));
      { const jy = groundY(262, -27.5); parts.push(box(256, jy - 2, -30.5, 268, jy + 0.9, -24.5, PLASTER_D), box(257, jy + 0.9, -29.5, 267, jy + 1.3, -25.5, PLASTER), box(258.5, jy - 2, -32, 265.5, jy + 0.35, -30.5, PLASTER_D)); }
      { const ay = groundY(270, -66); parts.push(box(268.8, ay - 1, -67, 271.2, ay + 1.3, -65, PLASTER), box(268.5, ay + 1.3, -67.3, 271.5, ay + 1.5, -64.7, PLASTER)); }
      parts.push(box(161, 0, -49.6, 175, 4.4, -48.4, PLASTER_D), box(161, 0, -43.6, 175, 4.4, -42.4, PLASTER_D), paint(new THREE.CylinderGeometry(3.6, 3.6, 14, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2).translate(168, 4.4, -46), PLASTER_D));
      // the round building: a drum on steps, a ring of columns, a cone of a roof
      parts.push(paint(new THREE.CylinderGeometry(ROUND.r + 0.6, ROUND.r + 1.2, 1.0, 28).translate(ROUND.x, 0.5, ROUND.z), PLASTER_D), paint(new THREE.CylinderGeometry(ROUND.r - 2.3, ROUND.r - 2.3, ROUND.h - 2, 24).translate(ROUND.x, ROUND.h / 2, ROUND.z), PLASTER));
      parts.push(paint(new THREE.ConeGeometry(ROUND.r + 0.5, 2.6, 28).translate(ROUND.x, ROUND.h - 1 + 1.3, ROUND.z), ROOF));
      for (let i = 0; i < 18; i++) { const a = i / 18 * 6.2832; post(ROUND.x + Math.cos(a) * (ROUND.r - 0.4), ROUND.z + Math.sin(a) * (ROUND.r - 0.4), 1.0, ROUND.h - 1, 0.42); }
      // the grove's wall on the west and the south, and the terrace wall under the hill
      parts.push(box(-113, 0, -124, -112, 2.6, 86, PLASTER_D), box(-113, 0, 86, 141, 2.6, 87, PLASTER_D), box(-113, 0, -125, 18, 2.2, -124, PLASTER_D));
      outdoor.add(add(merged(parts), farMat));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the ash altar: a stone stage, the cone of ash with steps cut in it, the fire and its smoke
    const MARBLE_W = C('#efe9dc'), groveMat = std({ roughness: 0.8 }, 'grove', shaded(SHADE_BODY));
    {
      const parts = [], ax = ALTAR.x, az = ALTAR.z, ASH = C('#b3aea4'), ASH_D = C('#6f6a63'), ASH_L = C('#d8d4ca'), STAGE = C('#cdc4b0'), ra = mk('ash');
      const SH = ALTAR.stageH, SR = ALTAR.stage / 2;
      parts.push(paint(new THREE.CylinderGeometry(SR, SR + 0.12, SH, 40).translate(ax, SH / 2, az), STAGE));
      // four stone steps up to the stage on the south and on the north
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) parts.push(box(ax - 1.6, 0, az + sd * (SR - 0.1), ax + 1.6, SH / 4 * (i + 1) - 0.01, az + sd * (SR + 0.36 * (4 - i)), STAGE));
      const rAt = (t) => lerp(ALTAR.r, ALTAR.top / 2, Math.pow(t, 0.82)), nA = 44, nH = 14, pos = [], col = [], idx = [], off = ra.range(0, 50), tc = new THREE.Color();
      for (let j = 0; j <= nH; j++) for (let i = 0; i <= nA; i++) {
        const t = j / nH, a = i / nA * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
        // ash slumps: a rough, runnelled skin; paler where fresh ash has been laid, dark near the fire
        const nz = noise.fbm2(ca * 2.2 + off, sa * 2.2 + t * 3.1, 3), rill = noise.fbm2(ca * 7 + 9 + off, sa * 7 + t * 0.6, 2);
        const r = rAt(t) * (1 + 0.05 * nz + 0.025 * rill) + (j === 0 ? 0.2 : 0);
        pos.push(ax + ca * r, SH + t * (ALTAR.h - SH), az + sa * r);
        tc.copy(ASH).lerp(ASH_L, clamp(0.5 + 0.9 * rill, 0, 1) * 0.7).lerp(ASH_D, clamp(smoothstep(0.78, 1, t) * 0.7 + 0.25 * clamp(-nz, 0, 1), 0, 0.8));
        col.push(tc.r, tc.g, tc.b);
      }
      for (let j = 0; j < nH; j++) for (let i = 0; i < nA; i++) { const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const cone = new THREE.BufferGeometry(); cone.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cone.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      cone.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); cone.setIndex(idx); cone.computeVertexNormals();
      parts.push(cone, paint(new THREE.CylinderGeometry(ALTAR.top / 2 + 0.02, ALTAR.top / 2 + 0.02, 0.12, 20).translate(ax, ALTAR.h, az), C('#3a332c')));
      // steps trodden into the ash on the south side, from the stage to the top
      for (let i = 0; i < 15; i++) { const t = (i + 0.5) / 15, r = rAt(t) + 0.12; parts.push(box(ax - 0.7, SH + t * (ALTAR.h - SH) - 0.2, az + r - 0.45, ax + 0.7, SH + t * (ALTAR.h - SH) + 0.05, az + r + 0.3, ASH_L)); }
      // the logs of the fire, dark on the top
      for (let i = 0; i < 7; i++) parts.push(paint(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 6).rotateZ(Math.PI / 2 - 0.12).rotateY(i * 0.9 + ra.range(-0.2, 0.2)).translate(ax + ra.range(-0.25, 0.25), ALTAR.h + 0.16 + 0.07 * (i % 3), az + ra.range(-0.25, 0.25)), C('#2a1c12')));
      outdoor.add(add(merged(parts), groveMat));
      await ctx.yield();
      // the fire of white poplar on the top: tongues that breathe on closed periods, and its glow in the smoke's foot (a size in metres)
      const tongue = new THREE.LatheGeometry([[0, 0], [0.2, 0.12], [0.26, 0.34], [0.15, 0.72], [0, 1.0]].map((q) => new THREE.Vector2(q[0], q[1])), 8);
      { const tp = tongue.attributes.position, tc2 = new Float32Array(tp.count * 3); for (let i = 0; i < tp.count; i++) { const k = tp.getY(i); tc2[i * 3] = 1; tc2[i * 3 + 1] = 0.78 - 0.5 * k; tc2[i * 3 + 2] = 0.42 - 0.38 * k; } tongue.setAttribute('color', new THREE.BufferAttribute(tc2, 3)); }
      const NF = 11, fire = new THREE.InstancedMesh(tongue, new THREE.MeshBasicMaterial({ color: C('#ffb060').multiplyScalar(4.2), vertexColors: true, fog: false }), NF);
      const fp = []; for (let i = 0; i < NF; i++) { const a = ra.range(0, 6.28), r = ra.range(0, 0.95); fp.push([Math.cos(a) * r, Math.sin(a) * r, ra.range(1.3, 2.3) * (1 - 0.35 * r), ra.range(0, 6.28), ra.range(1.6, 2.6)]); }
      updates.push((dt, time) => {
        for (let i = 0; i < NF; i++) { const q = fp[i], b = q[2] * (0.72 + 0.28 * Math.sin(time * q[4] * 3.1 + q[3]) + 0.12 * Math.sin(time * 7.7 + q[3] * 2.0)); M4.compose(V1.set(ax + q[0], ALTAR.h + 0.2, az + q[1]), Q0, V2.set(1, b, 1)); fire.setMatrixAt(i, M4); }
        fire.instanceMatrix.needsUpdate = true;
      });
      fire.frustumCulled = false; outdoor.add(fire);
      {
        const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute([ax, ALTAR.h + 1.3, az], 3));
        const fireGlow = new THREE.Points(gg, softSprite(5.2, C('#ff8a3c').multiplyScalar(0.75), tU, 2.3, mk('ash-glow').range(0, 6.28))); fireGlow.frustumCulled = false; fireGlow.renderOrder = 61; outdoor.add(fireGlow);
      }
      await ctx.yield();
      // the smoke: tall in the still morning air, leaning a little as this visit's air moves (a medium; it thins near the lens)
      // lit by the low sun: gold on its east side, blue grey on its west, glowing at its foot; it thins out well under the height the lens comes in at
      const smokeOpts = { time: tU, color: '#dfa061', colorTop: '#e6b584', shadowColor: '#566078', ambient: '#161c2a', hot: '#8a3c10', hotFalloff: 2.2, sunDir: SUN, sunColor: '#ffb060', wind: [Math.sign(smokeLean), 0, smokeDrift], bend: Math.abs(smokeLean) * 1.5, rate: 0.06, opacity: 0.82, scatter: 0.18, rim: 0.16 };
      const smokes = [fx.makeSmokeColumn({ ...smokeOpts, rng: mk('smoke'), position: [ax, ALTAR.h + 0.7, az], height: SMOKE.h, radius: SMOKE.radius, size: SMOKE.size, count: 170, cluster: 0.4 })];
      // a rare morning: a second, thinner smoke from one of the small altars
      if (rare && grove.altars.length) { const q = grove.altars[0]; smokes.push(fx.makeSmokeColumn({ ...smokeOpts, rng: mk('smoke-2'), position: [q.x, q.h + 0.3, q.z], height: 34, radius: [0.25, 4.5], size: [1.0, 10], count: 46, opacity: 0.6 })); }
      // the wayside altar's thin smoke (every visit)
      if (grove.wayAltar) { const q = grove.wayAltar; smokes.push(fx.makeSmokeColumn({ ...smokeOpts, rng: mk('smoke-wayside'), position: [q.x, q.h + 0.35, q.z], height: 8.5, radius: [0.1, 1.0], size: [0.45, 2.4], count: 28, opacity: 0.5 })); }
      for (const sm of smokes) { outdoor.add(sm.object); updates.push((dt, time) => sm.update(dt, time)); }
    }
    await ctx.yield();
    // ------------------------------------------------------------ the three sided pillar and the winged Victory alighting on it; the old mound's wall
    {
      const parts = [], px = PILLAR.x, pz = PILLAR.z, hp = PILLAR.h;
      const shaft = new THREE.CylinderGeometry(0.98, 1.3, hp - 0.3, 3, 12).rotateY(Math.PI / 6).translate(px, (hp - 0.3) / 2, pz), sp = shaft.attributes.position, sc = new Float32Array(sp.count * 3);
      for (let i = 0; i < sp.count; i++) { const k = (Math.round(sp.getY(i) / ((hp - 0.3) / 12)) & 1) ? 1 : 0.93; sc[i * 3] = MARBLE_W.r * k; sc[i * 3 + 1] = MARBLE_W.g * k; sc[i * 3 + 2] = MARBLE_W.b * k; }
      shaft.setAttribute('color', new THREE.BufferAttribute(sc, 3));
      parts.push(shaft, paint(new THREE.CylinderGeometry(1.12, 1.12, 0.3, 3, 1).rotateY(Math.PI / 6).translate(px, hp - 0.15, pz), MARBLE_W), paint(new THREE.CylinderGeometry(1.5, 1.62, 0.5, 3, 1).rotateY(Math.PI / 6).translate(px, 0.25, pz), MARBLE_W));
      // she comes down facing east, leaning into the air, her mantle blown out behind her, her wings raised
      const hv = PILLAR.all - hp, fig = figureGeo(hv * 0.93, { kind: 'cloak', skin: MARBLE_W, cloth: MARBLE_W, armR: 1, armL: 0, lean: 1 });
      fig.rotateZ(-0.2).translate(px + 0.1, hp + 0.02, pz); parts.push(fig);
      for (const sd of [-1, 1]) {
        const wing = new THREE.Shape([[0, 0], [-0.25, 0.75], [-0.75, 1.25], [-1.3, 1.45], [-1.0, 0.85], [-0.75, 0.3], [-0.3, -0.1]].map((q) => new THREE.Vector2(q[0], q[1])));
        parts.push(paint(new THREE.ExtrudeGeometry(wing, { depth: 0.07, bevelEnabled: false }).rotateY(sd * 0.5).translate(px - 0.12, hp + hv * 0.66, pz + sd * 0.2), MARBLE_W));
      }
      const veil = new THREE.Shape([[0, 0], [-0.5, 0.25], [-1.25, 0.2], [-1.5, -0.45], [-0.9, -0.9], [-0.25, -0.75]].map((q) => new THREE.Vector2(q[0], q[1])));
      parts.push(paint(new THREE.ExtrudeGeometry(veil, { depth: 0.1, bevelEnabled: false }).translate(px - 0.15, hp + hv * 0.62, pz - 0.05), MARBLE_W));
      for (let i = 0; i < 5; i++) {
        const a0 = i / 5 * 6.2832 + 0.3, a1 = (i + 1) / 5 * 6.2832 + 0.3, r = MOUND_FENCE.r, x0 = MOUND_FENCE.x + Math.cos(a0) * r, z0 = MOUND_FENCE.z + Math.sin(a0) * r, x1 = MOUND_FENCE.x + Math.cos(a1) * r, z1 = MOUND_FENCE.z + Math.sin(a1) * r;
        parts.push(paint(new THREE.BoxGeometry(Math.hypot(x1 - x0, z1 - z0), 1.7, 0.5).rotateY(-Math.atan2(z1 - z0, x1 - x0)).translate((x0 + x1) / 2, 0.85, (z0 + z1) / 2), PLASTER_D));
      }
      outdoor.add(add(merged(parts), groveMat));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the statues on their bases (hundreds; bronze and marble; nothing lettered), the small altars
    {
      const W = C('#ffffff');
      // THE ONE MAKE at its four finenesses (statueGeo), each of its eight kinds once; which a statue takes is by the place it stands at
      const makes = [[], [], [], []];
      for (let lv = 0; lv < 4; lv++) for (let i = 0; i < STATUE_KINDS; i++) { makes[lv].push(statueGeo(i, lv)); if (lv < 2 || i % 2 === 1) await ctx.yield(); }
      const rc = mk('statue-colours'), rp = mk('statue-paint'), BRONZES = ['#5e4c34', '#4f4232', '#6a5230', '#58462e', '#4c4638'].map(C), MARBLES = ['#dcd6c9', '#d2cab9', '#e0dbd0', '#d9cfbb', '#cfcbc2'].map(C), WAX = new THREE.Color(0.9, 0.87, 0.8), BASES = ['#c9c0ac', '#b9b09c', '#d2cab8', '#a9a393'].map(C);
      // the paint of the age (marble): the hair, the band (red or blue; a wreath green or gilded), a garment's border (the other of red and blue), the thing held
      const HAIRS = ['#7a5a36', '#5b4630', '#8a6a3c', '#6e4a34'].map(C), RED = C('#a3342a'), BLUE = C('#3f5f95'), LEAF = C('#5f7340'), GILT = C('#b8923f'), HELD = [null, LEAF, C('#9a8458'), C('#9a8458'), C('#a39c8e'), null, LEAF /* (the palm: r5 step 5) */, null];
      const cells = new Map(), buckets = new Map(), placed = [], baseList = [], E = new THREE.Euler(), QY = new THREE.Quaternion(); let nNear = 0;
      // each statue's draws, in the deal's order: its tone (of its own stuff, bronze or marble), its paint, its kind (the deal's).
      // (A DRAW MADE AND THROWN AWAY: rc's first draw for a statue, a pick among its tones, is taken and not used (the tone is rp's draw,
      // settled among the neighbours below); it stays so that every later draw of that stream, the statues' shades and the bases'
      // tones, is what the rounds before dealt.)
      const looks = grove.statues.map((q) => { const tones = q.bronze ? BRONZES : MARBLES; return { q, tones, shade: (rc.pick(tones), rc.range(0.9, 1.08)), hair: rp.pick(HAIRS), red: rp.chance(0.5), gilt: rp.chance(0.35), tone: rp.int(0, tones.length - 1), v: q.v, gap: wayGap(q.x, q.z, 0, q.top) }; });
      // NO TWO NEIGHBOURS ALIKE (the statues the lens passes nearest are settled first): a statue takes, from its own draw on, the first
      // kind that none settled before it within NEIGHBOUR of it has (where a crowd holds all the kinds: the kind whose nearest like
      // stands farthest off); its tone likewise among those of its own stuff, and never the tone of a neighbour of its own kind and stuff
      // while another tone is free
      for (const L of looks.slice().sort((a, b) => a.gap - b.gap)) {
        const q = L.q, n = L.tones.length, nb = placed.map((p) => [p, Math.hypot(p.q.x - q.x, p.q.z - q.z)]).filter((e) => e[1] < NEIGHBOUR);
        const unlike = (first, m, same) => { let best = first, far = -1; for (let i = 0; i < m && far < 1e9; i++) { const c = (first + i) % m; let d = 1e9; for (const [p, dist] of nb) if (dist < d && same(p, c)) d = dist; if (d > far) { far = d; best = c; } } return best; };
        L.v = unlike(L.v, STATUE_KINDS, (p, c) => p.v === c); L.tone = unlike(L.tone, n, (p, c) => p.q.bronze === q.bronze && p.tone === c);
        if (nb.some(([p]) => p.v === L.v && p.q.bronze === q.bronze && p.tone === L.tone)) L.tone = unlike(L.tone, n, (p, c) => p.v === L.v && p.q.bronze === q.bronze && p.tone === c);
        placed.push(L); if (placed.length % 50 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (const { q, tones, shade, hair, red, gilt, tone, v, gap } of looks) {
        // the NEAR make where the lens passes within WAY_CLOSE of the statue (the lens's own height counted), the MIDDLE make to WAY_MID,
        // the FAR make beyond, the FARTHEST where it stands farther than WAY_FAR from every place of the way outdoors
        const col = tones[tone].clone().multiplyScalar(shade), gy = groundY(q.x, q.z) - 0.12, lv = gap < WAY_CLOSE ? 0 : gap < WAY_MID ? 1 : wayFar(q.x, q.z) ? 3 : 2;
        if (lv < 2) {
          // (a marble figure seen close is WAXED AND TONED, the warm ivory of a finished statue: its tone a little down and warm, so
          // that its sunlit side keeps its forms; the far makes keep the marble's own tone)
          const wc = q.bronze ? col : col.clone().multiply(WAX);
          QY.setFromEuler(E.set(0, -q.yaw, 0)); M4.compose(V1.set(q.x, gy + q.base + 0.1, q.z), QY, V2.set(q.s, q.s, q.s));
          const g = statueTint(makes[lv][v].clone(), { tone: wc, bronze: q.bronze, hair, band: STATUE_WREATH.includes(v) ? (gilt ? GILT : LEAF) : red ? RED : BLUE, border: red ? BLUE : RED, held: HELD[v] || wc }).applyMatrix4(M4);
          // (they are drawn in cells of STATUE_CELL m by where they stand: a cell whose box lies wholly outside the picture is not drawn)
          const key = Math.floor(q.x / STATUE_CELL) + ':' + Math.floor(q.z / STATUE_CELL); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(g);
          if (++nNear % 2 === 0) await ctx.yield(); continue;
        }
        const key = lv + ':' + v + (q.x >= PART_X ? 'e' : 'w');
        if (!buckets.has(key)) buckets.set(key, { lv, v, list: [] });
        buckets.get(key).list.push({ q, col, gy });
      }
      await ctx.yield();
      // the bases [x, y, z, breadth, height, yaw, colour, depth over breadth]: a low block on a foot course; a tall pillar on a foot with a cap;
      // a long base on a foot course, its figures side by side
      // near the way (within WAY_MID of the lens's line) a base has its mouldings: a second foot course, a crowning course of two members
      // under the figure, a pillar a necking under its cap
      // WOOLLEN FILLETS (the festival's): tied round every altar and round one statue's base in three (a stream of their own, 'fillets'):
      // a band round the stone and, at its front, two ends that hang and stir in the morning air, each pair on its own phase
      const rf = mk('fillets'), WOOL = ['#a3342a', '#e4dccb', '#8a2d3c', '#b8862e', '#a3342a'].map(C), fillets = [[], []];
      const tie = (x, y, z, wx, wz, yaw, y0) => {
        const col = rf.pick(WOOL), c = Math.cos(yaw), sn = Math.sin(yaw), off = rf.range(-0.3, 0.3) * wz, kx = x + c * (wx / 2 + 0.03) - sn * off, kz = z + sn * (wx / 2 + 0.03) + c * off, ph = rf.range(0, 6.28), P = [], I = [], A = [];
        { const band = new THREE.BoxGeometry(wx + 0.03, 0.06, wz + 0.03).rotateY(-yaw).translate(x, y, z); band.deleteAttribute('uv'); const n = band.attributes.position.count, t = new Float32Array(n * 4); for (let j = 0; j < n; j++) t[j * 4] = -1e3; band.setAttribute('aTie', new THREE.BufferAttribute(t, 4)); fillets[x >= PART_X ? 1 : 0].push(paint(band, col)); }
        for (const sd of [-1, 1]) {
          const len = Math.min(rf.range(0.32, 0.6), y - y0 - 0.1), n0 = P.length / 3, SEG = 5;
          for (let k = 0; k <= SEG; k++) for (const e of [-0.022, 0.022]) { const t = sd * (0.02 + 0.05 * (k / SEG)) + e, o = 0.004 * k; P.push(kx + c * o - sn * t, y + 0.02 - len * k / SEG, kz + sn * o + c * t); A.push(y, ph + sd * 0.4, -sn, c); }
          for (let k = 0; k < SEG; k++) { const a = n0 + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTie', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I); g.computeVertexNormals();
        fillets[x >= PART_X ? 1 : 0].push(paint(g, col));
      };
      // A WREATH OR A GARLAND OF LEAVES is laid on a few of the bases near the way (within WAY_MID of the lens's line; never on a pillar; a
      // stream of their own, 'base-leaves'): a wreath lying on the stone at a front corner beside the figure's feet, or a garland hung
      // along the front under the crown. They are this morning's leaves, not stone: they are drawn with the fillets.
      const rl = mk('base-leaves'), LEAVES = ['#5f7340', '#6f8048', '#56683c'].map(C); let nBase = 0;
      const leafy = (b, pts, col) => {
        const c = Math.cos(b.yaw), sn = Math.sin(b.yaw);
        for (const p of pts) {
          const g = new THREE.OctahedronGeometry(0.062, 0).scale(1.4, 0.85, 0.55).rotateY(p[3] - b.yaw).translate(b.x + c * p[0] - sn * p[2], p[1], b.z + sn * p[0] + c * p[2]); g.deleteAttribute('uv');
          const n = g.attributes.position.count, t = new Float32Array(n * 4); for (let j = 0; j < n; j++) t[j * 4] = -1e3; g.setAttribute('aTie', new THREE.BufferAttribute(t, 4)); fillets[b.x >= PART_X ? 1 : 0].push(paint(g, col));
        }
      };
      for (const b of grove.bases) {
        const gy = groundY(b.x, b.z) - 0.12, bc = rc.pick(BASES), close = wayGap(b.x, b.z, 0, b.h + 2) < WAY_MID, k = b.len / b.w, long = (m) => (b.len + (m - 1) * b.w) / (b.w * m);
        if (b.kind === 1) {
          baseList.push([b.x, gy, b.z, b.w * 1.5, 0.42, b.yaw, bc, 1], [b.x, gy + 0.3, b.z, b.w, b.h - 0.24, b.yaw, bc, 1], [b.x, gy + b.h - 0.06, b.z, b.w * 1.28, 0.18, b.yaw, bc, 1]);
          if (close) baseList.push([b.x, gy + 0.4, b.z, b.w * 1.24, 0.15, b.yaw, bc, 1], [b.x, gy + b.h - 0.19, b.z, b.w * 1.12, 0.14, b.yaw, bc, 1]);
        } else {
          baseList.push([b.x, gy, b.z, b.w, b.h + 0.12, b.yaw, bc, k], [b.x, gy, b.z, b.w * 1.22, 0.34, b.yaw, bc, long(1.22)]);
          if (close) baseList.push([b.x, gy + 0.32, b.z, b.w * 1.1, 0.13, b.yaw, bc, long(1.1)], [b.x, gy + b.h - 0.1, b.z, b.w * 1.07, 0.1, b.yaw, bc, long(1.07)], [b.x, gy + b.h, b.z, b.w * 1.15, 0.125, b.yaw, bc, long(1.15)]);
        }
        if (++nBase % 40 === 0) await ctx.yield();
        if (close && b.kind !== 1) {
          const what = rl(), side = rl.chance(0.5) ? 1 : -1, col = rl.pick(LEAVES), turn = rl.range(0, 6.28), top = gy + b.h + 0.125, pts = [];
          if (what < 0.17) { const cx = b.w * 0.575 - 0.13, cz = side * (b.len / 2 + 0.075 * b.w - 0.13); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832 + turn; pts.push([cx + Math.cos(a) * 0.105, top + 0.04, cz + Math.sin(a) * 0.105, -a + 1.5708]); } }
          else if (what < 0.36) { const sag = Math.min(0.2, b.h * 0.3), n = Math.ceil(b.len * 0.9 / 0.09); for (let i = 0; i <= n; i++) { const t = i / n; pts.push([b.w / 2 + 0.04, top - 0.17 - sag * 4 * t * (1 - t), (t - 0.5) * b.len * 0.9, 1.5708 + (t - 0.5) * 1.2]); } }
          if (pts.length) leafy(b, pts, col);
        }
        if (rf.chance(0.34)) { if (b.kind === 1) tie(b.x, gy + 0.3 + (b.h - 0.24) * 0.84, b.z, b.w, b.w, b.yaw, gy + 0.42); else tie(b.x, gy + (b.h + 0.12) * 0.72, b.z, b.w, b.len, b.yaw, gy + 0.34); }
      }
      // bronze has a sheen (aBronze: 1 where the figure is bronze, by vertex in the near and middle makes, by figure in the far ones, whose
      // paint the bronze does not take): it takes the sun, and where it looks up or turns away from the eye it mirrors the open sky, in the
      // sun and in shade alike; marble is the warm ivory of a waxed, finished statue in the sun and cooler in its own shade. On the bare
      // bodies of the near and middle makes the forms are drawn by the light (BODY_GLSL; the far makes and the bases carry aBody as nought)
      const BODY_GLSL = `
// THE BODY'S FORMS DRAWN BY THE LIGHT (the bare trunks, legs and arms of the near and middle statues), from the body's own coordinates
// on the vertices (aBody, see statueGeo). Each form is a low plate with a soft edge, a soft furrow or a low rise, its edge 1 to 3 cm
// wide at the figure's own scale, never a drawn line: zbForm gives the form's height over the surface in metres (a furrow under it) and
// how deep in a furrow the place lies (0 to 1); the surface's normal is bent by the height's slope (taken from the rule itself, a small
// step to each side, and carried to the picture by the coordinates' own change from pixel to pixel), so the sun and the sky give each
// form a lit lip and a shaded lip, and the tone deepens a little in the furrow. A pure rule of the place on the body: no noise at all,
// nothing of the lens, the way, a seed or the clock.
float zbG(float x, float s) { x /= s; return exp(-x * x); }
float zbS(float x, float w) { return smoothstep(-w, w, x); }
float zbW(float a, float b, float e, float x) { return smoothstep(a - e, a + e, x) * (1.0 - smoothstep(b - e, b + e, x)); }
vec2 zbForm(float part, float ang, float y) {
  float aa = abs(ang), ab = 3.14159 - aa, h = 0.0, f = 0.0, q, w;
  if (part < 1.5) {
    // the trunk: fr its front, bk its back; aa how far round from the breastbone, ab from the spine
    float fr = 1.0 - smoothstep(1.35, 1.75, aa), bk = smoothstep(1.4, 1.8, aa);
    // the chest: two broad plates, their lower edge clear (rising to the armpit), the breastbone's furrow between them
    float ye = 1.208 + 0.035 * aa * aa; w = zbW(0.1, 1.25, 0.09, aa) * fr;
    h += 0.0065 * zbS(y - ye, 0.011) * (1.0 - smoothstep(1.27, 1.39, y)) * w;
    f += 0.8 * zbG(y - ye + 0.004, 0.012) * w + 0.6 * zbG(aa, 0.07) * zbW(1.215, 1.37, 0.02, y) * fr;
    // the arch of the ribs: the chest's cage stands a little over the belly, from the breastbone's end down and outward
    float ya = 1.192 - 0.11 * smoothstep(0.0, 1.05, aa); w = zbW(0.14, 1.2, 0.12, aa) * fr;
    h += 0.0036 * zbS(y - ya, 0.014) * (1.0 - smoothstep(ya + 0.02, ya + 0.09, y)) * w; f += 0.35 * zbG(y - ya + 0.005, 0.014) * w;
    // the belly: the straight muscle a low rise, its middle line, two cross furrows, the navel a small hollow
    w = (1.0 - smoothstep(0.36, 0.58, aa)) * fr;
    h += 0.0026 * w * zbW(1.0, 1.2, 0.03, y);
    q = zbG(aa, 0.075) * zbW(1.035, 1.195, 0.015, y) * fr; h -= 0.0034 * q; f += 0.5 * q;
    q = (zbG(y - 1.135, 0.012) + zbG(y - 1.075, 0.012)) * w; h -= 0.003 * q; f += 0.4 * q;
    q = zbG(y - 1.018, 0.012) * zbG(aa, 0.09) * fr; h -= 0.006 * q; f += q;
    // THE HIP'S FURROW, the clearest: from the hip bone's point down and inward to the groin, the flank's roll over it; fainter round
    // the hip's crest to the back
    float dh = y - (0.86 + 0.14 * smoothstep(0.2, 1.3, aa)); w = zbW(0.12, 2.3, 0.1, aa) * mix(1.0, 0.4, smoothstep(1.3, 1.9, aa));
    h += w * (0.0045 * zbG(dh - 0.034, 0.03) - 0.0058 * zbG(dh, 0.013)); f += 1.1 * w * zbG(dh, 0.013);
    // the collar bones (a low rise) and the pit of the throat
    h += 0.003 * zbG(y - (1.402 + 0.012 * aa), 0.009) * zbW(0.13, 1.05, 0.06, aa) * fr;
    q = zbG(y - 1.418, 0.013) * zbG(aa, 0.09) * fr; h -= 0.005 * q; f += q;
    // the back: the spine's furrow (deepest at the loins), the two shoulder blades as low plates (inner border and lower edge), the
    // loins' two hollows
    q = zbG(ab, 0.075) * zbW(0.93, 1.41, 0.03, y) * bk; h -= 0.0045 * q * (1.0 + 0.4 * zbG(y - 1.03, 0.08)); f += 0.7 * q;
    float yb = 1.2 + 0.13 * (ab - 0.42);
    h += 0.004 * zbS(ab - (0.36 + 0.5 * (y - 1.2)), 0.08) * zbS(y - yb, 0.012) * (1.0 - smoothstep(1.3, 1.39, y)) * (1.0 - smoothstep(0.95, 1.3, ab)) * bk;
    f += 0.4 * zbG(y - yb + 0.004, 0.012) * zbW(0.42, 1.0, 0.08, ab) * bk;
    q = zbG(y - 0.965, 0.016) * zbG(ab - 0.3, 0.1) * bk; h -= 0.0045 * q; f += 0.8 * q;
  } else if (part < 2.5) {
    // a leg: the knee's cap with the furrow under it, the shin's edge, the calf's two heads and the swell's lower edge
    h += 0.007 * zbG(y - 0.475, 0.032) * zbG(aa, 0.5);
    q = zbG(y - 0.43, 0.012) * zbG(aa, 0.65); h -= 0.004 * q; f += 0.5 * q;
    h += 0.004 * zbG(ang - 0.1, 0.22) * zbW(0.13, 0.41, 0.03, y);
    q = zbG(ab, 0.26) * zbW(0.27, 0.4, 0.03, y); h -= 0.0026 * q; f += 0.4 * q;
    float yc = 0.25 + 0.03 * ab; w = 1.0 - smoothstep(0.9, 1.4, ab);
    h += 0.0045 * zbS(y - yc, 0.012) * (1.0 - smoothstep(0.3, 0.4, y)) * w; f += 0.4 * zbG(y - yc + 0.004, 0.012) * w;
  } else {
    // an arm: the hollow of the elbow
    q = zbG(y - 1.02, 0.09) * zbG(aa, 0.6); h -= 0.0045 * q; f += 0.8 * q;
  }
  return vec2(h, min(f, 1.0));
}
`;
      const statueMat = std({ roughness: 0.62 }, 'statue', (sh) => {
        shaded(SHADE_BODY)(sh);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aBronze; attribute vec4 aBody; varying float vBronze; varying vec4 vBody;')
          .replace('#include <color_vertex>', '#include <color_vertex>\nvBronze = aBronze; vBody = aBody;\n#ifdef USE_INSTANCING_COLOR\n vColor.rgb = mix(vColor.rgb, instanceColor.rgb * (0.74 + 0.26 * min(1.0, dot(color.rgb, vec3(0.45)))), aBronze);\n#endif');
        // the body's forms (zbForm): whatever reads the neighbouring pixels stands at the head of main, above everything that could leave
        // the pixel undrawn; zBk lets the forms go where a pixel is wider than a furrow (by the surface's own step from pixel to pixel)
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBronze; varying vec4 vBody;\n' + BODY_GLSL)
          .replace('void main() {', 'void main() {\n vec4 zBdx = dFdx(vBody), zBdy = dFdy(vBody); vec3 zBpx = dFdx(-vViewPosition), zBpy = dFdy(-vViewPosition); float zBk = 1.0 - smoothstep(0.008, 0.022, max(length(zBpx), length(zBpy))), zBr2 = dot(vBody.yz, vBody.yz), zBhx = 0.0, zBhy = 0.0, zBf = 0.0;\n if (vBody.x > 0.5 && zBr2 > 0.0625 && zBk > 0.0) { float zBa = atan(vBody.z, vBody.y), zBey = vBody.x > 2.5 ? 0.004 : 0.001, zBg = smoothstep(0.25, 0.6, sqrt(zBr2)) * zBk; vec2 zB0 = zbForm(vBody.x, zBa, vBody.w); float zBha = (zbForm(vBody.x, zBa + 0.01, vBody.w).x - zB0.x) / 0.01, zBhw = (zbForm(vBody.x, zBa, vBody.w + zBey).x - zB0.x) / zBey; zBhx = zBg * (zBha * (vBody.y * zBdx.z - vBody.z * zBdx.y) / zBr2 + zBhw * zBdx.w); zBhy = zBg * (zBha * (vBody.y * zBdy.z - vBody.z * zBdy.y) / zBr2 + zBhw * zBdy.w); zBf = zB0.y * zBg; }')
          .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ vec3 zR1 = cross(zBpy, normal), zR2 = cross(normal, zBpx); float zDet = dot(zBpx, zR1); if (abs(zDet) > 1e-10) { vec3 zGr = sign(zDet) * (zBhx * zR1 + zBhy * zR2); zGr *= min(1.0, 0.7 * abs(zDet) / max(length(zGr), 1e-12)); normal = normalize(abs(zDet) * normal - zGr); } }')
          .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n{ float zb = vBronze; roughnessFactor = mix(roughnessFactor, 0.36, zb); metalnessFactor = mix(metalnessFactor, 0.5, zb); diffuseColor.rgb *= (1.0 + 0.9 * zb) * (1.0 - 0.12 * zBf); }')
          .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ vec3 zNw = inverseTransformDirection(normal, viewMatrix); float zf = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0); reflectedLight.indirectSpecular += vBronze * uSkyTop * (0.04 + 0.26 * zf) * (0.3 + 0.7 * max(zNw.y, 0.0)) * zeusOpen(vZW); }');
        if (R5_STEP4) {
          // r5 step 4 (R5_AIR): the near make is marked by 4 added to aBody's first figure (zBp: the part without the mark); on it the
          // air's light is the brighter from the sun's side of the sky and the less in a furrow of the body's forms
          sh.uniforms.uAir = { value: new THREE.Vector4(SUN.x / Math.hypot(SUN.x, SUN.z), SUN.z / Math.hypot(SUN.x, SUN.z), R5_AIR.side, R5_AIR.furrow) };
          sh.fragmentShader = sh.fragmentShader.split('vBody.x').join('zBp').replace('void main() {', 'void main() {\n float zBp = vBody.x > 3.5 ? vBody.x - 4.0 : vBody.x;')
            .replace('varying float vBronze; varying vec4 vBody;', 'varying float vBronze; varying vec4 vBody; uniform vec4 uAir;')
            .replace('#include <lights_fragment_maps>', 'if (vBody.x > 3.5) { vec3 zNa = inverseTransformDirection(normal, viewMatrix); irradiance *= (1.0 + uAir.z * dot(normalize(zNa.xz + vec2(1e-5)), uAir.xy) * length(zNa.xz)) * (1.0 - uAir.w * zBf); }\n#include <lights_fragment_maps>');
        }
      });
      await ctx.yield();
      for (const bk of buckets.values()) {
        // (a far figure's paint is the same on all of its kind: the hair, a red band, a blue border)
        const g = statueTint(makes[bk.lv][bk.v].clone(), { tone: W, bronze: false, hair: HAIRS[bk.v % 4], band: STATUE_WREATH.includes(bk.v) ? LEAF : RED, border: BLUE, held: HELD[bk.v] || W });
        g.setAttribute('aBronze', new THREE.InstancedBufferAttribute(new Float32Array(bk.list.map((it) => (it.q.bronze ? 1 : 0))), 1));
        const im = new THREE.InstancedMesh(g, statueMat, bk.list.length);
        bk.list.forEach((it, i) => { const q = it.q; QY.setFromEuler(E.set(0, -q.yaw, 0)); M4.compose(V1.set(q.x, it.gy + q.base + 0.1, q.z), QY, V2.set(q.s, q.s, q.s)); im.setMatrixAt(i, M4); im.setColorAt(i, it.col); });
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); outdoor.add(part(im, boxOf(im)));
        if (++nNear % 4 === 0) await ctx.yield();
      }
      await ctx.yield();
      for (const figs of cells.values()) { const m = add(mergeGeometries(figs, false), statueMat); for (const g of figs) g.dispose(); m.geometry.computeBoundingBox(); outdoor.add(part(m, m.geometry.boundingBox.clone())); await ctx.yield(); }
      for (const list of makes) for (const g of list) g.dispose();
      for (const q of grove.altars) {
        const gy = groundY(q.x, q.z) - 0.1, cr = Math.cos(q.rot), sr = Math.sin(q.rot);
        baseList.push([q.x, gy, q.z, q.w * 2.1, 0.3, q.rot, BASES[1]], [q.x, gy + 0.2, q.z, q.w, q.h + 0.1, q.rot, BASES[0]], [q.x, gy + 0.2 + q.h, q.z, q.w * 1.14, 0.16, q.rot, BASES[2]]);
        if (q.wall) baseList.push([q.x - sr * (q.w * 1.05 + 0.9), gy, q.z + cr * (q.w * 1.05 + 0.9), q.len, q.wallH + 0.1, q.rot, BASES[3], 0.42 / q.len]);
        tie(q.x, gy + 0.2 + (q.h + 0.1) * 0.74, q.z, q.w, q.w * 0.92, q.rot, gy + 0.3);
      }
      await ctx.yield();
      {
        const filletMat = std({ roughness: 0.95, side: THREE.DoubleSide }, 'fillet', (sh) => {
          shaded(SHADE_BODY)(sh); sh.uniforms.uTime = tU;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aTie; uniform float uTime;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float zd = max(aTie.x - transformed.y, 0.0), zk = zd * zd, zw = sin(uTime * 1.3 + aTie.y + zd * 4.0) + 0.5 * sin(uTime * 2.1 + aTie.y * 1.7 + zd * 6.0); transformed.xz += aTie.zw * (0.2 * zk * zw) + vec2(aTie.w, -aTie.z) * (0.1 * zk * (0.7 + 0.5 * sin(uTime * 0.9 + aTie.y + zd * 3.0))); }');
        });
        for (const list of fillets) if (list.length) { const m = add(merged(list), filletMat); m.geometry.computeBoundingBox(); outdoor.add(part(m, m.geometry.boundingBox.clone().expandByScalar(0.3))); await ctx.yield(); }
      }
      const unit = paint(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), W); unit.setAttribute('aBronze', new THREE.BufferAttribute(new Float32Array(unit.attributes.position.count), 1)); unit.setAttribute('aBody', new THREE.BufferAttribute(new Float32Array(unit.attributes.position.count * 4), 4));
      for (const east of [false, true]) {
        const bl = baseList.filter((b) => (b[0] >= PART_X) === east); if (!bl.length) continue;
        const bases = new THREE.InstancedMesh(unit, statueMat, bl.length);
        bl.forEach((b, i) => { QY.setFromEuler(E.set(0, -b[5], 0)); M4.compose(V1.set(b[0], b[1], b[2]), QY, V2.set(b[3], b[4], b[3] * (b[7] ?? 0.92))); bases.setMatrixAt(i, M4); bases.setColorAt(i, b[6]); });
        bases.instanceMatrix.needsUpdate = true; bases.instanceColor.needsUpdate = true; bases.computeBoundingSphere(); outdoor.add(part(bases, boxOf(bases)));
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ the far land: ridges round the valley, the two rivers' glint, the wood on the hill
    {
      const ridges = terrain.makeHorizonRidges({ rng: mk('ridges'), layers: 3, radius: [1500, 3100], height: [80, 250], jagged: 0.22, coverage: 0.85, colorNear: '#6c7a58', fog: scene.fog, sunDir: SUN, sunColor: sunCol, sunIntensity: 0.9, snow: false, rim: 0.35 });
      outdoor.add(ridges.object); updates.push((dt, time, camera) => ridges.update(dt, time, camera));
      await ctx.yield();
      // water: a pale band that mirrors the low sky; seen from the grove it is a glint between the trees
      const pos = [], idx = [], band = (at, n, a0, a1, half, swap) => {
        const base = pos.length / 3;
        for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), c = at(a); for (const sd of [-1, 1]) { if (swap) pos.push(c + sd * half, 0.55, a); else pos.push(a, 0.55, c + sd * half); } }
        for (let i = 0; i < n; i++) { const k = base + i * 2; if (swap) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); else idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      };
      band(riverZ, 60, -1200, 1400, 27, false); band(riverX, 30, -700, 300, 11, true);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const water = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: C('#e6e2d4').multiplyScalar(1.15) })); water.renderOrder = 3; outdoor.add(water);
      // the hill's wood: dark pines and oaks as plain rounded crowns, one shape drawn many times
      const rw = mk('hill-wood'), crown = new THREE.OctahedronGeometry(1, 1).scale(1, 0.85, 1).translate(0, 0.9, 0);
      { const cp = crown.attributes.position; for (let i = 0; i < cp.count; i++) { const k = 1 + 0.22 * noise.fbm2(cp.getX(i) * 2.1 + 5, cp.getZ(i) * 2.1 + cp.getY(i) * 1.7, 2); cp.setXYZ(i, cp.getX(i) * k, cp.getY(i) * k, cp.getZ(i) * k); } crown.computeVertexNormals(); }
      paint(crown, C('#ffffff'));
      const list = [], GREENS = ['#35502c', '#415a30', '#4c6236', '#2e4628'].map(C), OLIVE_FAR = C('#6f7f62'), PLANE_FAR = C('#567a34');
      for (let i = 0; i < 460; i++) {
        const a = rw.range(0, 6.2832), r = Math.sqrt(rw()) * HILL.r * 0.98, x = HILL.x + Math.cos(a) * r, z = HILL.z + Math.sin(a) * r / 1.1, y = groundY(x, z), sc = rw.range(4, 7), c = rw.pick(GREENS), rot = rw.range(0, 6.28);
        if (y > 9 && z > HILL.z - 40) list.push([x, y - 1, z, sc, c, rot]);
        if (i % 50 === 49) await ctx.yield();
      }
      // the valley's far trees: the same plain crowns, paler
      for (const t of grove.trees) if (t.far) list.push([t.x, groundY(t.x, t.z) - 0.2, t.z, t.h * 0.52, t.kind ? OLIVE_FAR : PLANE_FAR, t.rot]);
      const wood = new THREE.InstancedMesh(crown, lit(new THREE.MeshLambertMaterial({ vertexColors: true }), 'wood'), list.length), E = new THREE.Euler(), QY = new THREE.Quaternion();
      list.forEach((q, i) => { QY.setFromEuler(E.set(0, q[5], 0)); M4.compose(V1.set(q[0], q[1], q[2]), QY, V2.set(q[3], q[3] * 1.15, q[3])); wood.setMatrixAt(i, M4); wood.setColorAt(i, q[4]); });
      wood.instanceMatrix.needsUpdate = true; wood.instanceColor.needsUpdate = true; wood.computeBoundingSphere(); outdoor.add(wood);
    }
    await ctx.yield();
    // ------------------------------------------------------------ the small crowd: people standing in groups (still), walkers on their beats
    const P1 = [0, 0, 0], P2 = [0, 0, 0], P3 = [0, 0, 0];
    {
      const SKIN = ['#a98566', '#9a775a', '#b59274'].map(C), CLOTH = ['#d9d0bc', '#c9bfa6', '#b3a58a', '#e3ddd0', '#9c8a70', '#b7a9a0', '#8f8f84', '#c4b08c'].map(C), HAIR = ['#2a2018', '#3a2c20', '#5a5248', '#8c887e'].map(C);
      const E = new THREE.Euler(), QY = new THREE.Quaternion(), WHITE = C('#ffffff');
      // one material for all of them: the garment takes each one's own colour, the skin keeps its own; a walker's legs and arms swing;
      // one who stands shifts the weight and turns a little, very slowly, on a phase of the place it stands at
      const folkMat = std({ roughness: 0.9 }, 'walker', (sh) => {
        shaded(SHADE_BODY)(sh);
        sh.uniforms.uTime = tU;
        // (r5 C3: where aLimb.z is 2, the mantle's parts of step 10's plainest make, the vertex takes the one's second dye aDye2; no other shape carries a 2)
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aLimb; attribute vec2 aWalk; attribute vec3 aDye2; uniform float uTime;')
          .replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\n vColor.rgb = aLimb.z > 1.5 ? color.rgb * aDye2 : mix(vColor.rgb, color.rgb, aLimb.z);\n#endif')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float zp = uTime * aWalk.x + aWalk.y, za = aLimb.x * 0.5 * sin(zp) * step(0.001, aWalk.x), zc = cos(za), zn = sin(za); vec2 zr = transformed.xy - vec2(0.0, aLimb.y); transformed.xy = vec2(zr.x * zc - zr.y * zn, zr.x * zn + zr.y * zc) + vec2(0.0, aLimb.y); transformed.y += 0.025 * abs(cos(zp)) * step(0.001, aWalk.x); }\n#ifdef USE_INSTANCING\n{ float zst = 1.0 - step(0.001, aWalk.x), zq = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3, zb = zst * (0.06 * sin(uTime * 0.21 + zq) + 0.025 * sin(uTime * 0.53 + zq * 2.3)), zcc = cos(zb), zss = sin(zb); transformed.xz = vec2(transformed.x * zcc - transformed.z * zss, transformed.x * zss + transformed.z * zcc) + zst * transformed.y * 0.012 * vec2(sin(uTime * 0.37 + zq * 1.7), cos(uTime * 0.29 + zq)); }\n#endif');
      });
      // four kinds of standing figure in three finenesses; the finer ones stand near the ways and before the east front, the plainest far
      // from the way (see WAY_FAR) and on the river's bank
      const KINDS = [['tunic', 0], ['cloak', 0], ['cloak', 3], ['tunic', 1]], geos = [];
      for (let i = 0; i < 12; i++) { const k = KINDS[i % 4]; geos.push(figureGeo(1.7, { kind: k[0], skin: SKIN[i % 3], cloth: WHITE, hair: HAIR[i % 4], armR: k[1], armL: 0, lean: i % 2 ? 1 : -1, plain: i >= 4 && i < 8, far: i >= 8, tags: true })); await ctx.yield(); }
      // in the close view (see WAY_CLOSE) each stands in the round, in a tunic or a long garment and mantle of its own dye; one in four
      // wears the festival's olive wreath, some lean on a staff, some hold an offering
      const DYES = ['#d9d0bc', '#a6482e', '#c9a244', '#b3a58a', '#58708c', '#e3ddd0', '#7c8450', '#8c4c58', '#c4b08c', '#7a5a40'].map(C), WREATH = C('#66783c'), STAFF = C('#5a4630');
      const buckets = []; for (let i = 0; i < 24; i++) buckets.push([]);
      const closeFolk = [[], []], rfs = mk('folk-sway'); let nc = 0;
      for (const q of life.people) {
        const nearWay = !q.bank && nearWays(q.x, q.z), tunic = q.look % 3 === 0, v = tunic ? (q.arm === 1 ? 3 : 0) : (q.arm === 3 ? 2 : 1);
        if (!q.bank && wayGap(q.x, q.z, 0, q.h) < WAY_CLOSE) {
          const k = KINDS[v], i = nc++, dye = DYES[(q.look * 3 + i) % DYES.length], offer = k[1] === 1 && i % 2 === 0;
          const g = fineFigureGeo(q.h, { kind: k[0], skin: SKIN[i % 3], cloth: dye, mantle: k[0] === 'cloak' ? DYES[(q.look + i * 7 + 3) % DYES.length] : dye, hair: HAIR[(q.look + i) % 4], armR: k[1], armL: tunic ? 0 : 3, lean: i % 2 ? 1 : -1,
            staff: k[1] === 0 && i % 4 === 1 ? STAFF : null, wreath: i % 4 === 0 ? WREATH : null, gift: offer ? 1 + (i >> 1) % 3 : 0, giftCol: offer ? [WREATH, C('#74875a'), C('#8a6532')][(i >> 1) % 3] : null });
          g.rotateY(q.yaw).translate(q.x, groundY(q.x, q.z) - 0.03, q.z);
          { const n = g.attributes.position.count, a = new Float32Array(n * 4), ph = rfs.range(0, 6.28), y0 = groundY(q.x, q.z) - 0.03; for (let j = 0; j < n; j++) { a[j * 4] = q.x; a[j * 4 + 1] = q.z; a[j * 4 + 2] = ph; a[j * 4 + 3] = y0; } g.setAttribute('aFig', new THREE.BufferAttribute(a, 4)); }
          closeFolk[q.x >= PART_X ? 1 : 0].push(g);
          if (nc % 2 === 0) await ctx.yield();
          continue;
        }
        buckets[v + (nearWay ? 0 : q.bank || wayFar(q.x, q.z) ? 8 : 4) + (q.x >= PART_X ? 12 : 0)].push(q);
      }
      await ctx.yield();
      buckets.forEach((list, i) => {
        if (!list.length) return;
        const g = geos[i % 12].clone(); g.setAttribute('aWalk', new THREE.InstancedBufferAttribute(new Float32Array(list.length * 2), 2));
        const im = new THREE.InstancedMesh(g, folkMat, list.length);
        list.forEach((q, k) => { QY.setFromEuler(E.set(0, q.yaw, 0)); M4.compose(V1.set(q.x, groundY(q.x, q.z) - 0.03, q.z), QY, V2.setScalar(q.h / 1.7)); im.setMatrixAt(k, M4); im.setColorAt(k, CLOTH[(q.look * 3 + k) % CLOTH.length]); });
        im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); outdoor.add(part(im, boxOf(im)));
      });
      await ctx.yield();
      // r5 step 10 (see LIFE10): the standing people of the east front, of the road under the entry and of the ground before the temple: live's standing figure, each
      // in the plainest make while the lens is farther from it than LIFE10.far, and not drawn while it stands outside the picture
      // (r5 C3: the plainest make of a long garment is made again with its mantle's parts marked, so that one of C1's wears its mantle's own dye in it too)
      const geo10 = life.front.length + life.under.length + life.ground.length ? [0, 1, 2, 3, 8, 9, 10, 11].map((i) => (R5_C1 && i >= 8 && KINDS[i % 4][0] === 'cloak' ? figureGeo(1.7, { kind: 'cloak', skin: SKIN[i % 3], cloth: WHITE, hair: HAIR[i % 4], armR: KINDS[i % 4][1], armL: 0, lean: i % 2 ? 1 : -1, far: true, tags: true, mark: true }) : geos[i].clone())) : null;
      for (const g of geos) g.dispose();
      await ctx.yield();
      // r5 C1 (see the head and LIFE10): those of step 10 the lens passes within WAY_CLOSE of (near: by the place each stands at against
      // the line's own places, the way in and the line from the ramp's foot to the great door, the lens's height counted) are modelled
      // in the round as live's are, each dressed from its own dealt draws (kind10, held10; its dye, mantle's dye, skin, hair and what it
      // holds: r5 A1, no mirror); all of them are ONE
      // shape, of which the triangles of those within LIFE10.far of the lens and inside the picture are drawn (fine10.draw: the list of
      // corners drawn, written anew when one of them comes or goes); beyond LIFE10.far each is the plainest make in the same dye
      const fine10 = { folk: [], mesh: null, all: 0 };
      if (geo10) {
        const folk = life.front.concat(life.under, life.ground).map((q) => { const y = q.y ?? groundY(q.x, q.z) - 0.03; return { q, y, v: kind10(q), col: CLOTH[q.dye % CLOTH.length], ball: new THREE.Sphere(new THREE.Vector3(q.x, y + 0.9, q.z), 1.5), on: -2,
          near: R5_C1 && Math.min(wayGap(q.x, q.z, 0, y + q.h), upGap(q.x, q.z, y + q.h)) < WAY_CLOSE }; });
        if (R5_C1) {
          const gs = [], rs = mk('front-sway');
          for (const f of folk) if (f.near) {
            const q = f.q, k = KINDS[f.v], dye = DYES[q.dye], hd = held10(q);
            const g = fineFigureGeo(q.h, { kind: k[0], skin: SKIN[q.own % 3], cloth: dye, mantle: k[0] === 'cloak' ? DYES[q.dye2] : dye, hair: HAIR[(q.look + q.own) % 4], armR: k[1], armL: k[0] === 'tunic' ? 0 : 3, lean: q.own % 2 ? 1 : -1, join: true,
              staff: hd === 1 ? STAFF : null, wreath: q.hold % 4 === 0 ? WREATH : null, gift: hd > 1 ? hd - 1 : 0, giftCol: hd > 1 ? [WREATH, C('#74875a'), C('#8a6532')][hd - 2] : null });
            g.rotateY(q.yaw).translate(q.x, f.y, q.z);
            { const n = g.attributes.position.count, a = new Float32Array(n * 4), ph = rs.range(0, 6.28); for (let j = 0; j < n; j++) { a[j * 4] = q.x; a[j * 4 + 1] = q.z; a[j * 4 + 2] = ph; a[j * 4 + 3] = f.y; } g.setAttribute('aFig', new THREE.BufferAttribute(a, 4)); f.v0 = fine10.all; f.vn = n; fine10.all += n; }
            f.col = dye; f.dye2 = k[0] === 'cloak' ? DYES[q.dye2] : dye; gs.push(g); fine10.folk.push(f);
            if (gs.length % 2 === 0) await ctx.yield();
          }
          if (gs.length) { fine10.geo = merged(gs); fine10.draw = new THREE.BufferAttribute(new Uint32Array(fine10.all), 1); fine10.draw.setUsage(THREE.DynamicDrawUsage); fine10.geo.setIndex(fine10.draw); fine10.geo.setDrawRange(0, 0); }
          await ctx.yield();
        }
        const ims = geo10.map((g, j) => {
          const cap = Math.max(1, folk.filter((f) => f.v === j % 4).length); g.setAttribute('aWalk', new THREE.InstancedBufferAttribute(new Float32Array(cap * 2), 2));
          if (j >= 4) g.setAttribute('aDye2', new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3));
          const im = new THREE.InstancedMesh(g, folkMat, cap); im.setColorAt(0, WHITE); im.count = 0; im.frustumCulled = false; im.receiveShadow = true; outdoor.add(im); return im;
        });
        const far2 = LIFE10.far * LIFE10.far;
        updates.push((dt, time, camera) => {
          const e = camera.matrixWorld.elements; let changed = false, fine = false;
          for (const f of folk) { const on = frustum.intersectsSphere(f.ball) ? ((f.q.x - e[12]) ** 2 + (f.y + 0.9 - e[13]) ** 2 + (f.q.z - e[14]) ** 2 > far2 ? 4 + f.v : f.near ? 8 : f.v) : -1; if (on !== f.on) { if (on === 8 || f.on === 8) fine = true; f.on = on; changed = true; } }
          if (!changed) return;
          if (fine) { const a = fine10.draw.array; let k = 0; for (const f of fine10.folk) if (f.on === 8) for (let j = 0; j < f.vn; j++) a[k++] = f.v0 + j; fine10.draw.needsUpdate = true; fine10.geo.setDrawRange(0, k); }
          const n = ims.map(() => 0);
          for (const f of folk) if (f.on >= 0 && f.on < 8) { const im = ims[f.on], k = n[f.on]++; QY.setFromEuler(E.set(0, f.q.yaw, 0)); M4.compose(V1.set(f.q.x, f.y, f.q.z), QY, V2.setScalar(f.q.h / 1.7)); im.setMatrixAt(k, M4); im.setColorAt(k, f.col); if (f.on >= 4) { const c = f.dye2 || f.col; im.geometry.attributes.aDye2.setXYZ(k, c.r, c.g, c.b); } }
          ims.forEach((im, j) => { im.count = n[j]; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; if (j >= 4) im.geometry.attributes.aDye2.needsUpdate = true; });
        });
        // those of the front (and of the ground beside the ramp: (c)'s first field) stand in the temple's own box of shadows and throw
        // true ones: a flat shape of a body's outline, square to the sun's bearing, drawn into the shadows' map alone
        const inBox = life.front.concat(life.ground.filter((f) => f.box));
        if (inBox.length) {
          // (r5 C2: the outline [half breadth, share of the height]: the garment's foot, the hips, the shoulders, the neck, the head)
          const BOARD = R5_C2 ? [[0.17, 0], [0.2, 0.5], [0.24, 0.8], [0.06, 0.865], [0.1, 0.92], [0.085, 0.985], [0.04, 1]] : [[0.17, 0], [0.24, 0.8], [0.1, 1]];
          const pos = [], idx = [], hy = Math.hypot(SUN.x, SUN.z), px = -SUN.z / hy, pz = SUN.x / hy;
          inBox.forEach((q, i) => {
            const y = q.y ?? groundY(q.x, q.z) - 0.03, a = i * BOARD.length * 2;
            for (const [w, t] of BOARD) for (const sd of [-1, 1]) pos.push(q.x + px * w * sd, y + q.h * t, q.z + pz * w * sd);
            for (let k = 0; k < BOARD.length - 1; k++) { const b = a + k * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
          });
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
          const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide })); m.castShadow = true; m.receiveShadow = false; m.renderOrder = 50; scene.add(m);
        }
      }
      // (those in the round shift their weight as the others do: about their own feet, each on its own phase, the stream 'folk-sway')
      { const folkClose = std({ roughness: 0.9 }, 'grove-folk', (sh) => {
          shaded(SHADE_BODY)(sh); sh.uniforms.uTime = tU;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aFig; uniform float uTime;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float zh = max(transformed.y - aFig.w, 0.0), za = 0.06 * sin(uTime * 0.21 + aFig.z) + 0.025 * sin(uTime * 0.53 + aFig.z * 2.3), zc = cos(za), zn = sin(za); vec2 zd = transformed.xz - aFig.xy; transformed.xz = aFig.xy + vec2(zd.x * zc - zd.y * zn, zd.x * zn + zd.y * zc) + zh * 0.012 * vec2(sin(uTime * 0.37 + aFig.z * 1.7), cos(uTime * 0.29 + aFig.z)); }');
        });
        for (const figs of closeFolk) if (figs.length) { const m = add(merged(figs), folkClose); m.geometry.computeBoundingBox(); outdoor.add(part(m, m.geometry.boundingBox.clone())); await ctx.yield(); }
        if (fine10.geo) { const m = add(fine10.geo, folkClose); m.frustumCulled = false; outdoor.add(m); } }
      // the still figures with offerings on the east steps and beside the ramp's foot: a wreath, an olive branch or a dish in the forward hand;
      // they stand in the temple's own box of shadows and throw true ones
      await ctx.yield();
      if (life.offerers.length) {
        const parts = [], GIFT = [null, C('#5f7a3a'), C('#74875a'), C('#8a6532')];
        // each shifts the weight and turns a little, very slowly, about its own feet (the stream 'offer-sway'); the shadow each throws
        // is the temple's kept one: the shift is a few centimetres, inside the shadow's own softness
        const ro = mk('offer-sway');
        for (const q of life.offerers) {
          const y0 = q.y ?? groundY(q.x, q.z) - 0.03, g = figureGeo(q.h, { kind: q.look % 3 === 0 ? 'tunic' : 'cloak', skin: SKIN[q.look % 3], cloth: CLOTH[(q.look * 3 + 1) % CLOTH.length], hair: HAIR[q.look % 4], armR: 1, armL: q.look % 2 ? 3 : 0, lean: q.look % 2 ? 1 : -1, gift: q.gift, giftCol: GIFT[q.gift] }).rotateY(q.yaw).translate(q.x, y0, q.z);
          const n = g.attributes.position.count, a = new Float32Array(n * 4), ph = ro.range(0, 6.28); for (let j = 0; j < n; j++) { a[j * 4] = q.x; a[j * 4 + 1] = q.z; a[j * 4 + 2] = ph; a[j * 4 + 3] = y0; }
          g.setAttribute('aFig', new THREE.BufferAttribute(a, 4)); parts.push(g);
          if (parts.length % 4 === 0) await ctx.yield();
        }
        await ctx.yield();
        outdoor.add(add(merged(parts), std({ roughness: 0.9 }, 'figure-out', (sh) => {
          sh.uniforms.uTime = tU;
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aFig; uniform float uTime;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float zh = max(transformed.y - aFig.w, 0.0), za = 0.05 * sin(uTime * 0.21 + aFig.z) + 0.02 * sin(uTime * 0.53 + aFig.z * 2.3), zc = cos(za), zn = sin(za); vec2 zd = transformed.xz - aFig.xy; transformed.xz = aFig.xy + vec2(zd.x * zc - zd.y * zn, zd.x * zn + zd.y * zc) + zh * 0.01 * vec2(sin(uTime * 0.37 + aFig.z * 1.7), cos(uTime * 0.29 + aFig.z)); }');
        }), { cast: true }));
      }
      await ctx.yield();
      // walkers: one figure drawn many times, its legs and arms swinging about hip and shoulder as it goes
      const nW = life.walkers.length;
      if (nW) {
        const wg = figureGeo(1.7, { kind: 'tunic', skin: SKIN[0], cloth: WHITE, hair: HAIR[0], tags: true });   // legs and arms that swing: see folkMat
        const walk = new Float32Array(nW * 2);
        life.walkers.forEach((b, i) => { walk[i * 2] = 2 * Math.PI * b.speed / 1.4; walk[i * 2 + 1] = b.phase * 40; });
        wg.setAttribute('aWalk', new THREE.InstancedBufferAttribute(walk, 2));
        const im = new THREE.InstancedMesh(wg, folkMat, nW);
        life.walkers.forEach((b, i) => im.setColorAt(i, CLOTH[b.look % CLOTH.length]));
        im.instanceColor.needsUpdate = true; im.frustumCulled = false; outdoor.add(im);
        // each walker's long shadow goes with it: a strip laid on the ground from its feet away from the sun, as long as the sun's height
        // makes it, wider and fainter to its far end; where the ground is in shade already it adds nothing
        const SEG = 5, NV = (SEG + 1) * 2, sv = new Float32Array(nW * NV * 3), sa = new Float32Array(nW * NV), si = [];
        for (let i = 0; i < nW; i++) for (let k = 0; k <= SEG; k++) { const a = i * NV + k * 2; sa[a] = sa[a + 1] = (1 - k / SEG) ** 0.7; if (k < SEG) si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sv, 3)); sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1)); sg.setIndex(si);
        const shadeMat = new THREE.ShaderMaterial({
          uniforms: { ...place }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
          vertexShader: 'attribute float aA; varying float vA; varying vec3 vZW; void main(){ vA = aA; vZW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
          fragmentShader: PLACE_GLSL + 'varying float vA; varying vec3 vZW; void main(){ vec3 zs = zeusShade(vec3(vZW.x, 0.0, vZW.z)); gl_FragColor = vec4(vec3(1.0 - 0.52 * vA * ' + SHADE_GROUND + '), 1.0); }',   // (SHADE_GROUND: r5 step 2c)
        });
        const shades = new THREE.Mesh(sg, shadeMat); shades.frustumCulled = false; shades.renderOrder = 4; outdoor.add(shades);
        const sdx = -SUN.x / Math.hypot(SUN.x, SUN.z), sdz = -SUN.z / Math.hypot(SUN.x, SUN.z);
        updates.push((dt, time) => {
          for (let i = 0; i < nW; i++) {
            const b = life.walkers[i], c = b.course, s0 = b.phase * c.len + time * b.speed;
            courseAt(c, s0, P1); courseAt(c, s0 + 0.7, P2);
            QY.setFromEuler(E.set(0, Math.atan2(-(P2[2] - P1[2]), P2[0] - P1[0]), 0));
            M4.compose(V1.set(P1[0], groundY(P1[0], P1[2]) - 0.02, P1[2]), QY, V2.setScalar(b.h / 1.7)); im.setMatrixAt(i, M4);
            const len = b.h / tanEl;
            for (let k = 0; k <= SEG; k++) {
              const t = k / SEG, x = P1[0] + sdx * len * t, z = P1[2] + sdz * len * t, w = 0.2 + 0.3 * t, a = (i * NV + k * 2) * 3, y = groundY(x, z) + 0.05;
              sv[a] = x - sdz * w; sv[a + 1] = y; sv[a + 2] = z + sdx * w; sv[a + 3] = x + sdz * w; sv[a + 4] = y; sv[a + 5] = z - sdx * w;
            }
          }
          im.instanceMatrix.needsUpdate = true; sg.attributes.position.needsUpdate = true;
        });
      }
      // r5 step 10 (see LIFE10): the walkers of the steps beside the ramp, of the road under the entry and of the ground before the
      // temple (but those of the steps whose beat comes within WAY_CLOSE of the lens's line: beatNear): live's walker, in the
      // plainest make while the lens is farther from it than LIFE10.far, not drawn while outside the picture. One on the steps
      // stands on the stone it walks over (it rises to the next step in the last 0.3 m before it); its shadow is a strip laid
      // over the ground, the steps' treads and risers and the top step from its feet away from the sun, as far as the sun's ray
      // over its head goes before it meets them; one on the road has live's walkers' strip. THE STEPS' WALKERS' STRIP AND THE SHADE
      // (r5 A5): on the ground east of the lowest step's foot (from x 33.5 on, whole from 33.8) it takes the painted shade as live's
      // strips do, so that it darkens no further what a building or a tree has shaded there; ON THE STEPS IT TAKES NO SHADE (the
      // painted shade holds the temple's footprint there and would take the strip whole); and the map's shadows cut no painted
      // strip, on the steps or on the ground: where a standing body's shadow board lies, the strip darkens the place once more.
      // Said at the head.
      const w10 = life.frontWalkers.filter((b) => !beatNear(b)).map((b) => ({ b, front: true })).concat(life.underWalkers.concat(life.groundWalkers).map((b) => ({ b, front: false })));
      if (w10.length) {
        const wim = [false, true].map((far) => {
          const g = figureGeo(1.7, { kind: 'tunic', skin: SKIN[0], cloth: WHITE, hair: HAIR[0], tags: true, far }); g.setAttribute('aWalk', new THREE.InstancedBufferAttribute(new Float32Array(w10.length * 2), 2));
          const im = new THREE.InstancedMesh(g, folkMat, w10.length); im.setColorAt(0, WHITE); im.count = 0; im.frustumCulled = false; im.receiveShadow = true; outdoor.add(im); return im;
        });
        const RISERS = [[33.32, MOUND + 0.48], [32.69, MOUND + 0.96], [32.06, STY]];
        const frontY = (x, z) => (x > 33.32 ? groundY(x, z) : x > 32.69 ? MOUND + 0.48 : x > 32.06 ? MOUND + 0.96 : STY);   // the top of what lies beside the ramp
        const stepY = (x, z) => { const base = x > 33.32 ? groundY(x, z) - 0.02 : frontY(x, z); for (const [xe, hi] of RISERS) if (x > xe && x < xe + 0.3) { const t = (x - xe) / 0.3; return hi + (base - hi) * t * t * (3 - 2 * t); } return base; };
        const K = 12, NV = K * 2, sv = new Float32Array(w10.length * NV * 3), sa = new Float32Array(w10.length * NV), sgr = new Float32Array(w10.length * NV), si = [];
        w10.forEach((w, i) => { for (let k = 0; k < NV; k++) sgr[i * NV + k] = w.front ? 0 : 1; for (let k = 0; k < K - 1; k++) { const a = i * NV + k * 2; si.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sv, 3)); sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1)); sg.setAttribute('aG', new THREE.BufferAttribute(sgr, 1)); sg.setIndex(si);
        const shades = new THREE.Mesh(sg, new THREE.ShaderMaterial({
          uniforms: { ...place }, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
          vertexShader: 'attribute float aA; attribute float aG; varying float vA; varying float vG; varying vec3 vZW; void main(){ vA = aA; vG = aG; vZW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }',
          fragmentShader: PLACE_GLSL + 'varying float vA; varying float vG; varying vec3 vZW; void main(){ vec3 zs = zeusShade(vec3(vZW.x, 0.0, vZW.z)); gl_FragColor = vec4(vec3(1.0 - 0.52 * vA * mix(1.0, ' + SHADE_GROUND + ', max(vG, smoothstep(33.5, 33.8, vZW.x)))), 1.0); }',   // (r5 A5: on the ground east of the lowest step's foot the steps' walkers' strip takes the painted shade too)
        }));
        shades.frustumCulled = false; shades.renderOrder = 4; outdoor.add(shades);
        const sdx = -SUN.x / Math.hypot(SUN.x, SUN.z), sdz = -SUN.z / Math.hypot(SUN.x, SUN.z), BALL = new THREE.Sphere(new THREE.Vector3(), 1.5), far2 = LIFE10.far * LIFE10.far, pts = [];
        updates.push((dt, time, camera) => {
          const e = camera.matrixWorld.elements, n = [0, 0];
          w10.forEach((w, i) => {
            const b = w.b, c = b.course, s0 = b.phase * c.len + time * b.speed;
            courseAt(c, s0, P1); courseAt(c, s0 + 0.7, P2);
            const x0 = P1[0], z0 = P1[2], y = w.front ? stepY(x0, z0) : groundY(x0, z0) - 0.02, len = b.h / tanEl;
            BALL.center.set(x0, y + 0.9, z0);
            if (frustum.intersectsSphere(BALL)) {
              const far = (x0 - e[12]) ** 2 + (y + 0.9 - e[13]) ** 2 + (z0 - e[14]) ** 2 > far2 ? 1 : 0, im = wim[far], k = n[far]++;
              QY.setFromEuler(E.set(0, Math.atan2(-(P2[2] - z0), P2[0] - x0), 0)); M4.compose(V1.set(x0, y, z0), QY, V2.setScalar(b.h / 1.7)); im.setMatrixAt(k, M4); im.setColorAt(k, CLOTH[b.look % CLOTH.length]);
              im.geometry.attributes.aWalk.setXY(k, 2 * Math.PI * b.speed / 1.4, b.phase * 40);
            }
            // the strip's places [metres from the feet, height]
            pts.length = 0;
            if (!w.front) for (let k = 0; k <= 5; k++) { const t = len * k / 5; pts.push([t, groundY(x0 + sdx * t, z0 + sdz * t) + 0.05]); }
            else {
              const H = y + b.h, top = (t) => frontY(x0 + sdx * t, z0 + sdz * t), ray = (t) => H - t * tanEl, cut = Math.min(len, (x0 - 23.6) / -sdx);
              let end = cut, onRiser = false;
              for (let t = 0.2; t < cut; t += 0.2) if (top(t) >= ray(t)) { end = t; let lo = t - 0.2, hi = t; for (let j = 0; j < 8; j++) { const m = (lo + hi) / 2; if (top(m) >= ray(m)) hi = m; else lo = m; } end = hi; break; }
              pts.push([0, top(0)]);
              for (const [xe, hi] of RISERS) { const te = (x0 - xe) / -sdx; if (te <= 0 || te > end + 0.02) continue; const low = top(te - 0.01); pts.push([te, Math.min(low, ray(te))]); pts.push([te, Math.min(hi, ray(te))]); if (hi >= ray(te)) onRiser = true; }
              for (let j = 1; j < 4; j++) { const t = end * j / 4; if (RISERS.every((q) => Math.abs((x0 - q[0]) / -sdx - t) > 0.12)) pts.push([t, Math.min(top(t), ray(t))]); }
              if (!onRiser) pts.push([end, Math.min(top(end - 0.01), ray(end))]);
              pts.sort((a, b2) => a[0] - b2[0] || a[1] - b2[1]);
              for (const q of pts) q[1] += 0.03;
            }
            for (let k = 0; k < K; k++) {
              const q = pts[Math.min(k, pts.length - 1)], t = q[0], x = x0 + sdx * t, z = z0 + sdz * t, wd = 0.2 + 0.3 * t / len, a = (i * NV + k * 2) * 3;
              sv[a] = x - sdz * wd; sv[a + 1] = q[1]; sv[a + 2] = z + sdx * wd; sv[a + 3] = x + sdz * wd; sv[a + 4] = q[1]; sv[a + 5] = z - sdx * wd;
              sa[i * NV + k * 2] = sa[i * NV + k * 2 + 1] = Math.max(1 - t / len, 0) ** 0.7;
            }
          });
          wim.forEach((im, j) => { im.count = n[j]; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.geometry.attributes.aWalk.needsUpdate = true; });
          sg.attributes.position.needsUpdate = true; sg.attributes.aA.needsUpdate = true;
        });
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ kites over the ash altar's smoke, swallows round the temple's roof and through its side walks
    {
      // a bird of plain flat shapes, its beak to +X: a body, two wings bent at the wrist, a forked tail
      const birdGeo = (span, len, fork, sweep, top, pale) => {
        const tri = [], col = [], h = span / 2, T = (a, b, c, k) => { tri.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) col.push(k.r, k.g, k.b); };
        for (const sd of [-1, 1]) {
          const rl = [0.14 * len, 0, sd * 0.04 * span], rt = [-0.2 * len, 0, sd * 0.04 * span], wl = [0.2 * len - sweep * 0.25 * len, 0.05 * span, sd * h * 0.45], wt = [-0.16 * len - sweep * 0.3 * len, 0.04 * span, sd * h * 0.42], tip = [-sweep * len, 0.02 * span, sd * h];
          T(rl, wl, rt, top); T(wl, wt, rt, top); T(wl, tip, wt, pale);
          T([-0.2 * len, 0, 0], [-0.5 * len - fork, 0, sd * 0.1 * span], [-0.46 * len, 0, sd * 0.01 * span], top);
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
        g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(tri.length / 3 * 2), 2));
        return merged([g, paint(new THREE.OctahedronGeometry(1, 0).scale(len * 0.5, 0.06 * span, 0.07 * span), pale)]);
      };
      const birdMat = lit(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 'bird');
      const flock = (list, geo) => {
        if (!list.length) return;
        const im = new THREE.InstancedMesh(geo, birdMat, list.length), X = new THREE.Vector3(), Yv = new THREE.Vector3(), Z = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
        im.frustumCulled = false; outdoor.add(im);
        updates.push((dt, time) => {
          for (let i = 0; i < list.length; i++) {
            const b = list[i], c = b.course, s0 = b.phase * c.len + time * b.speed, st = b.span * 2.5 + 0.6;
            courseAt(c, s0, P1); courseAt(c, s0 + st, P2); courseAt(c, s0 + 2 * st, P3);
            X.set(P2[0] - P1[0], P2[1] - P1[1], P2[2] - P1[2]).normalize();
            // it leans into its turn
            const turn = ((P2[2] - P1[2]) * (P3[0] - P2[0]) - (P2[0] - P1[0]) * (P3[2] - P2[2])) / (st * st), roll = clamp(turn * 2.2, -0.75, 0.75);
            Z.crossVectors(X, UP).normalize(); Yv.crossVectors(Z, X);
            Yv.multiplyScalar(Math.cos(roll)).addScaledVector(Z, Math.sin(roll)); Z.crossVectors(X, Yv);
            M4.makeBasis(X, Yv, Z).setPosition(P1[0], P1[1], P1[2]); im.setMatrixAt(i, M4);
          }
          im.instanceMatrix.needsUpdate = true;
        });
      };
      flock(life.kites, birdGeo(1.55, 0.62, 0.16, 0.12, C('#5b3d26'), C('#a48a6c')));
      flock(life.swallows, birdGeo(0.33, 0.18, 0.07, 0.5, C('#1b2130'), C('#2c3344')));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the temple's order in colour: triglyphs in blue, the slabs under the cornice, the gilded shields, the roof
    const GOLD = C('#f0b848'), goldMat = std({ roughness: 0.24, metalness: 0.72, side: THREE.DoubleSide }, 'gold'), goldParts = [];   // gilded bronze: it throws the low sun back as a glint
    {
      const parts = [], FACES = [{ ax: 'x', s: 1, at: 31.78, half: 13.51 }, { ax: 'x', s: -1, at: 31.78, half: 13.51 }, { ax: 'z', s: 1, at: 13.51, half: 31.78 }, { ax: 'z', s: -1, at: 13.51, half: 31.78 }];
      // a block on a face: a0..a1 along it, o0..o1 out from it
      const fb = (f, a0, a1, y0, y1, o0, o1, c) => (f.ax === 'x' ? box(f.s * (f.at + o0), y0, a0, f.s * (f.at + o1), y1, a1, c) : box(a0, y0, f.s * (f.at + o0), a1, y1, f.s * (f.at + o1), c));
      const shield = new THREE.LatheGeometry([[0, 0.13], [0.2, 0.11], [0.42, 0.05], [0.5, 0.05], [0.525, 0]].map((q) => new THREE.Vector2(q[0], q[1])), 20), pegs = [];
      for (const f of FACES) {
        const cols = f.ax === 'x' ? COLS_Z : COLS_X, tri = [], n = cols.length;
        for (let i = 0; i < n; i++) { const c = i === 0 ? -(f.half - 0.52) : i === n - 1 ? f.half - 0.52 : cols[i]; tri.push(c); if (i < n - 1) { const nx = i === n - 2 ? f.half - 0.52 : cols[i + 1]; tri.push((c + nx) / 2); } }
        tri.forEach((c, i) => {
          // three upright bars over a dark ground, the strip under the red band, the slab under the cornice
          parts.push(fb(f, c - 0.52, c + 0.52, Y_FRIEZE, Y_CORNICE - 0.03, 0, 0.05, BLUE_DEEP));
          for (const k of [-0.35, 0, 0.35]) parts.push(fb(f, c + k - 0.13, c + k + 0.13, Y_FRIEZE, Y_CORNICE - 0.03, 0.05, 0.12, BLUE));
          parts.push(fb(f, c - 0.52, c + 0.52, Y_FRIEZE - 0.3, Y_FRIEZE - 0.17, 0, 0.07, BLUE), fb(f, c - 0.5, c + 0.5, Y_CORNICE - 0.1, Y_CORNICE, 0.14, 1.02, BLUE));
          // six blue pegs hang under the strip
          for (let k = 0; k < 6; k++) { const a = c + (k - 2.5) * 0.165; pegs.push(f.ax === 'x' ? [f.s * (f.at + 0.04), Y_FRIEZE - 0.39, a] : [a, Y_FRIEZE - 0.39, f.s * (f.at + 0.04)]); }
          if (i < tri.length - 1) {
            const m = (c + tri[i + 1]) / 2;
            parts.push(fb(f, m - 0.5, m + 0.5, Y_CORNICE - 0.1, Y_CORNICE, 0.14, 1.02, BLUE));
            // the gilded shields: one on each panel of the east front, and on the eleven eastmost of the south side
            if ((f.ax === 'x' && f.s > 0) || (f.ax === 'z' && f.s > 0 && i >= tri.length - 12)) {
              const g = shield.clone();
              if (f.ax === 'x') g.rotateZ(-Math.PI / 2).translate(f.at + 0.03, Y_FRIEZE + 0.86, m); else g.rotateX(Math.PI / 2).translate(m, Y_FRIEZE + 0.86, f.at + 0.03);
              goldParts.push(paint(g, GOLD));
            }
          }
        });
        await ctx.yield();
      }
      shield.dispose();
      outdoor.add(instanced(paint(new THREE.CylinderGeometry(0.036, 0.028, 0.09, 5, 1, true).translate(0, 0.045, 0), BLUE), std({ roughness: 0.78 }, 'stone'), pegs));   // one small peg drawn 432 times
      await ctx.yield();
      // the roof: marble tiles in rows down each slope, a ridge, a raised edge with the lions' heads for spouts (51 a side)
      const slope = Math.hypot(14.7, RIDGE - Y_EAVE);
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 108; i++) parts.push(paint(new THREE.BoxGeometry(0.15, 0.09, slope).rotateX(sd * PITCH).translate(-32.6 + i * 0.6094, (Y_EAVE + RIDGE) / 2 + 0.03, sd * 7.35), TILE_L));
        parts.push(box(-32.9, Y_EAVE, sd * 14.52, 32.9, Y_EAVE + 0.3, sd * 14.72, MARBLE));
        for (let i = 0; i < 51; i++) { const x = -32.2 + i * 1.288; parts.push(box(x - 0.13, Y_EAVE + 0.02, sd * 14.72, x + 0.13, Y_EAVE + 0.26, sd * 14.98, MARBLE), box(x - 0.06, Y_EAVE + 0.04, sd * 14.98, x + 0.06, Y_EAVE + 0.14, sd * 15.08, STUCCO_D)); }
        // the gable's own cornice along its two slopes
        for (const e of [-1, 1]) parts.push(paint(new THREE.BoxGeometry(1.5, 0.42, slope + 0.3).rotateX(sd * PITCH).translate(e * 32.2, (Y_EAVE + RIDGE) / 2 + 0.06, sd * 7.35), MARBLE));
        await ctx.yield();
      }
      parts.push(box(-32.9, RIDGE - 0.06, -0.14, 32.9, RIDGE + 0.14, 0.14, TILE_L));
      await ctx.yield();
      outdoor.add(add(merged(parts), stone));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the gables full of plain marble figures; on the roof the gilded Victory, the shield under her, a cauldron at each corner
    {
      const parts = [], rg = mk('gables'), MW = C('#f3efe6'), floorY = Y_EAVE + 0.02;
      const fig = (h, kind, armR, armL, plain) => figureGeo(h, { kind, skin: MW, cloth: MW, armR, armL, lean: rg.pick([-1, 1]), plain });
      // a horse of plain round shapes, its head to +Z
      const horse = (sc) => {
        const g = [paint(new THREE.SphereGeometry(1, 8, 6).scale(0.3, 0.36, 0.86).translate(0, 1.22, 0), MW), paint(new THREE.CylinderGeometry(0.15, 0.24, 0.95, 6, 1, true).rotateX(0.7).translate(0, 1.72, 0.92), MW), paint(new THREE.BoxGeometry(0.2, 0.26, 0.56).rotateX(0.5).translate(0, 2.1, 1.34), MW)];
        for (const lx of [-0.16, 0.16]) for (const lz of [-0.6, 0.62]) g.push(paint(new THREE.CylinderGeometry(0.075, 0.06, 0.95, 5, 1, true).translate(lx, 0.47, lz), MW));
        return merged(g).scale(sc, sc, sc);
      };
      for (const e of [1, -1]) {
        const x = e * 32.15, turn = e > 0 ? 0 : Math.PI, put = (g, z, dx = 0) => parts.push(g.rotateY(turn).translate(x + e * dx, floorY, z)), plain = e < 0;
        // the middle figure the tallest, the rest by the room the slope leaves: standing, shorter, then the horses, a sitting one, one lying in the corner
        put(fig(3.0, 'cloak', 0, 3, plain), 0);
        for (const sd of [-1, 1]) {
          put(fig(2.62, sd > 0 ? 'nude' : 'cloak', sd > 0 ? 0 : 3, 0, plain), sd * 1.75); put(fig(2.45, 'cloak', 3, 0, plain), sd * 3.3); put(fig(1.85, 'tunic', 1, 0, plain), sd * 4.75, 0.2);
          await ctx.yield();
          // the east gable: a groom kneeling before each team (a figure sunk to its thighs), then the team of four
          if (e > 0) { parts.push(fig(1.75, 'tunic', 1, 0, false).rotateY(turn + sd * 1.2).translate(x + 0.1, floorY - 0.55, sd * 6.05)); for (let k = 0; k < 4; k++) parts.push(horse(0.86).rotateY(sd > 0 ? Math.PI : 0).translate(x - 0.42 + k * 0.27, floorY, sd * (7.5 + k * 0.16))); }
          else { put(fig(2.1, 'nude', 2, 0, true), sd * 6.3); put(fig(2.0, 'cloak', 1, 3, true), sd * 7.5, 0.25); put(fig(1.75, 'nude', 3, 1, true), sd * 8.6); }
          // a sitting figure (a standing one sunk to its hips behind a block) and one lying along the corner
          parts.push(box(x - 0.3, floorY, sd * 10.3 - 0.35, x + 0.35, floorY + 0.5, sd * 10.3 + 0.35, MW)); parts.push(fig(1.75, 'cloak', 3, 0, true).rotateY(turn + sd * 0.8).translate(x - e * 0.05, floorY - 0.42, sd * 10.3));
          parts.push(fig(1.9, 'cloak', 0, 3, true).rotateX(sd * (Math.PI / 2 - 0.18)).rotateY(turn).translate(x, floorY + 0.24, sd * 11.25));
        }
      }
      outdoor.add(add(merged(parts), stone));
      await ctx.yield();
      // gilded: the Victory on the east gable's peak, her wings raised; the round shield with its boss under her; the four cauldrons on their three legs
      const gv = figureGeo(2.5, { kind: 'cloak', skin: GOLD, cloth: GOLD, armR: 1, armL: 0, lean: 1 }).translate(32.25, RIDGE + 0.62, 0); goldParts.push(gv);
      for (const sd of [-1, 1]) {
        const wing = new THREE.Shape([[0, 0], [-0.3, 0.9], [-0.9, 1.5], [-1.55, 1.75], [-1.2, 1.0], [-0.9, 0.35], [-0.35, -0.1]].map((q) => new THREE.Vector2(q[0], q[1])));
        goldParts.push(paint(new THREE.ExtrudeGeometry(wing, { depth: 0.08, bevelEnabled: false }).rotateY(sd * 0.55).translate(32.1, RIDGE + 0.62 + 1.7, sd * 0.24), GOLD));
      }
      goldParts.push(paint(new THREE.LatheGeometry([[0, 0.3], [0.12, 0.28], [0.2, 0.16], [0.5, 0.1], [0.78, 0.04], [0.82, 0]].map((q) => new THREE.Vector2(q[0], q[1])), 24).rotateZ(-Math.PI / 2).translate(32.97, RIDGE - 0.95, 0), GOLD));
      const bowl = [[0.0, 0.9], [0.3, 0.92], [0.52, 1.05], [0.62, 1.3], [0.56, 1.52], [0.6, 1.56], [0.5, 1.56], [0.0, 1.2]].map((q) => new THREE.Vector2(q[0], q[1]));
      for (const e of [-1, 1]) for (const sd of [-1, 1]) {
        goldParts.push(paint(new THREE.LatheGeometry(bowl, 14).translate(e * 32.2, Y_EAVE + 0.5, sd * 14.0), GOLD));
        for (let k = 0; k < 3; k++) goldParts.push(paint(new THREE.CylinderGeometry(0.035, 0.05, 1.5, 5, 1, true).translate(e * 32.2 + 0.5 * Math.cos(k * 2.094), Y_EAVE + 0.5 + 0.75, sd * 14.0 + 0.5 * Math.sin(k * 2.094)), GOLD));
      }
      parts.length = 0;
      parts.push(box(31.7, RIDGE + 0.1, -0.5, 32.8, RIDGE + 0.62, 0.5, MARBLE));
      for (const e of [-1, 1]) for (const sd of [-1, 1]) parts.push(box(e * 32.2 - 0.6, Y_EAVE + 0.2, sd * 14.0 - 0.6, e * 32.2 + 0.6, Y_EAVE + 0.5, sd * 14.0 + 0.6, MARBLE));
      outdoor.add(add(merged(parts), stone));
      outdoor.add(add(merged(goldParts), goldMat));
    }
    await ctx.yield();
    // ------------------------------------------------------------ over the porches, inside the colonnade: twelve carved panels (dim, in the walk's shade); votive gifts in the east porch
    {
      const parts = [], MW = C('#e6dfd0'), rp2 = mk('panels');
      for (const e of [1, -1]) for (let i = 0; i < 6; i++) {
        const z = (i - 2.5) * 2.72, x = e * 23.3, y0 = Y_FRIEZE + 0.1;
        parts.push(box(x, y0, z - 0.75, x + e * 0.06, y0 + 1.6, z + 0.75, STUCCO_D));   // each panel 1.5 m broad, 1.6 m high
        // two or three plain figures in low relief on each: a standing one, one bent to a labour, no more than shapes
        if (e > 0) for (let k = 0; k < 2; k++) parts.push(figureGeo(1.38, { kind: k ? 'cloak' : 'nude', skin: MW, cloth: MW, armR: rp2.pick([1, 2, 3]), armL: rp2.pick([0, 3]), lean: k ? 1 : -1, plain: true }).rotateY(k ? Math.PI / 2 : -Math.PI / 2).scale(0.22, 1, 1).translate(x + 0.08, y0 + 0.08, z + (k ? 0.33 : -0.33)));
      }
      outdoor.add(add(merged(parts), stone));
      await ctx.yield();
      // bronze in the east porch, to the sides of the way to the door: a tripod with its bowl, a row of small horses on a long base, a few plain bases
      const br = [], tri = (x, z, h) => {
        br.push(paint(new THREE.LatheGeometry([[0.0, h * 0.72], [0.22, h * 0.74], [0.4, h * 0.86], [0.44, h], [0.36, h], [0.0, h * 0.84]].map((q) => new THREE.Vector2(q[0], q[1])), 14).translate(x, PORCH_Y, z), BRONZE_L));
        for (let k = 0; k < 3; k++) br.push(paint(new THREE.CylinderGeometry(0.03, 0.04, h * 0.9, 5, 1, true).rotateZ(0.12 * Math.cos(k * 2.094)).rotateX(-0.12 * Math.sin(k * 2.094)).translate(x + 0.38 * Math.cos(k * 2.094), PORCH_Y + h * 0.45, z + 0.38 * Math.sin(k * 2.094)), BRONZE_L));
      };
      // on the left as one enters (south): the tripod; on the right (north): the small bronze horses in a row on their long stone base
      tri(19.4, 4.5, 1.7);
      const HORSES = { x0: 17.5, x1: 20.5, z: -4.5, half: 0.42, h: 0.72 };
      const GREY = C('#8f887c'), GREY_D = C('#7a746a');   // the base: a dark grey limestone
      for (let k = 0; k < 4; k++) {
        const hx = lerp(HORSES.x0, HORSES.x1, (k + 0.5) / 4), g = [paint(new THREE.SphereGeometry(1, 8, 6).scale(0.11, 0.125, 0.3).translate(0, 0.46, 0), BRONZE_L), paint(new THREE.CylinderGeometry(0.05, 0.09, 0.38, 6, 1, true).rotateX(0.6).translate(0, 0.66, 0.32), BRONZE_L), paint(new THREE.BoxGeometry(0.075, 0.1, 0.22).rotateX(0.5).translate(0, 0.82, 0.48), BRONZE_L), paint(new THREE.CylinderGeometry(0.012, 0.03, 0.3, 4, 1, true).rotateX(-0.5).translate(0, 0.4, -0.36), BRONZE_L)];
        for (const lx of [-0.065, 0.065]) for (const lz of [-0.21, 0.22]) g.push(paint(new THREE.CylinderGeometry(0.028, 0.02, 0.36, 4, 1, true).translate(lx, 0.18, lz), BRONZE_L));
        br.push(merged(g).rotateY(Math.PI / 2).translate(hx, PORCH_Y + HORSES.h, HORSES.z));
      }
      outdoor.add(add(merged(br), std({ roughness: 0.45, metalness: 0.7 }, 'metal'), { cast: true }));
      // the horses' base: a foot course, the block, a top course
      add(merged([box(HORSES.x0 - 0.1, PORCH_Y, HORSES.z - HORSES.half - 0.1, HORSES.x1 + 0.1, PORCH_Y + 0.14, HORSES.z + HORSES.half + 0.1, GREY_D), box(HORSES.x0, PORCH_Y + 0.14, HORSES.z - HORSES.half, HORSES.x1, PORCH_Y + HORSES.h - 0.1, HORSES.z + HORSES.half, GREY), box(HORSES.x0 - 0.06, PORCH_Y + HORSES.h - 0.1, HORSES.z - HORSES.half - 0.06, HORSES.x1 + 0.06, PORCH_Y + HORSES.h, HORSES.z + HORSES.half + 0.06, GREY_D)]), std({ roughness: 0.8 }, 'stone'), { cast: true });
    }
    await ctx.yield();

    return {
      scene, path, duration: 50, pace, ride: 'none', companion: 'none', style: 'none',
      measures: { hero: info, places: D, length: L, sunElevation: sunEl, sunOff, counts: { trees: grove.trees.length, statues: grove.statues.length, altars: grove.altars.length, kites: life.kites.length, swallows: life.swallows.length, walkers: life.walkers.length, standing: life.people.length } },   // read by this world's own checks, not by the engine
      // lookAhead 12 (it was 20): the engine's own first pose looks at the line this far ahead, and the line goes down and turns
      // WAY_IN.first m after the entry. WHY 12: a figure of the line (how far ahead the look runs), the same for every seed, typed after
      // the arrival's count and not from any picture: THE COUNT (tools/sw/camarrive, taken again in r5): the sweeping camera's first
      // pose stands 6.7 to 8.5 degrees off the level entry frame (4.1 to 5.7 down) and an arrival through a ring turns at 17 to 27.9
      // degrees a second at the most, by the speed it is carried in; the steady camera's stands 21.1 degrees off (8.6 down) and turns
      // at 23.1 at the most; none over 30. (At 20 m the sweeping pose stood 22 degrees off, a nod of 43 degrees a second.) Indoors the look is this world's own (LOOK) from 7 m to 162.5 m of the
      // route; the last turn on to the bay's mouth is a little quicker for it and stays under the tilt's rate (the report says both).
      camera: { fov: 58, near: 0.2, far: 5200, lookAhead: 12, sway: 0.5, bank: 0 },
      pois: [LOOK],
      // the ring is asked for as a plain ring: left to the engine's deal, two visits in three would draw it as an iris, a pearl film or a flock.
      // The engine's own swirl in the amber gold of his lit mantle, with the engine's rim and halo round it; it opens over the last straight.
      // drawWithin (the owner's field of 9 Oct): the ring is not drawn while more of the route is left than from the place where the mouth of
      // its bay opens to the lens past the bay's east upper column (route.D.mouth, see the head of this file); from there the engine opens it
      // about its own middle over drawIn (r5 step 6): the metres from that place to the pool's east edge (route.D.pool - route.D.mouth),
      // where the lens begins to rise before him: the ring is whole when the look has reached his face (the look climbs from his shins
      // to his face between route.D.barrier and route.D.pool)
      portal: { shape: 'circle', radius: RING.r, style: 'ring', color: '#d9a23a', glow: 0.9, halo: true, veil: '#3a2a12', drawWithin: route.drawWithin, ...(R5_STEP6 ? { drawIn: route.drawIn } : {}), revealDistance: route.lastLen, blendDistance: route.lastLen },
      post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.05, contrast: 1.04, tint: '#fffaf1', shadowTint: '#0b0d18', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera);
        hero.update?.(dt, time, camera);
        for (const f of updates) f(dt, time, camera, u);
      },
      dispose() { hero.dispose?.(); sky.dispose?.(); for (const t of ownTextures) t.dispose(); ownTextures.length = 0; },
    };
  },
};
