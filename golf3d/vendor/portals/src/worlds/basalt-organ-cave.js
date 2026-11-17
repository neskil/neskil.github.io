// THE ORGAN CAVE: the world round the hero set piece src/parts/basalt-organ-cave.js (a sea cave of black basalt pipes
// with its own breathing water sheet). Axes are the part's: +Z seaward (south), +X east, mean sea level y = 0, the mouth at z = 0.
//
// THE FLIGHT  The part's own line (anchors.path) FROM THE JOIN ON, to the letter: the join lies 8.5 m before the mouth,
//   101.5 m along the part's line, and from it on nothing of the route, the clock or the script is other than it was.
//   Before it THE FIRST LEG RUNS ALONG THE CLIFF FROM THE WEST (order 14; A DEPARTURE from the brief's straight leg,
//   by the owner's leave, as the slow S of order 10 was, which it replaces). It begins 91.2 m west of the mouth's
//   line and 32.1 m out to sea, runs DUE EAST for 67.5 m a metre over the swell, the colonnade on the left hand and
//   the open sea and the west stack on the right (the lens 24.7 to 30.0 m from the plinth's foot on most deals; the
//   foot is dealt, see LEG_Z), and BENDS NORTH INTO THE MOUTH in one arc of 23.8 m radius, 89.5 degrees and 37.1 m,
//   onto the part's line at the join, heading as that line heads. THE LEG IS EXACTLY AS LONG AS THE S WAS to the same
//   place (104.6 m flown), its height at every flown metre is the S's own and the speed asked by the flown metre is
//   the law it was: the outside takes the seconds it took (the join at 12.67 s, the mouth at 13.54 s). THE GAZE ON
//   THE LEG: the route's own gaze is the chord 12 m ahead, level, no bank (the S's own gaze law, sGaze and S_LEAD,
//   went with the S). ON THE RUN THE GAZE LEADS IT TO THE LEFT, TOWARD THE MOUTH (order 15: legGaze, the leg's one
//   point of interest; build). At the first metre the gaze bears due east along the run (the lead is nought there):
//   the open sea and the west stack lie south of it, the colonnade north. From there the gaze swings left once,
//   29.4 degrees over the first 40 m flown (7.6 degrees a second, 8.2 at its most, at 1.5 s), and holds its lead:
//   from 5 s it bears 60 degrees east of north, toward the cliff's wall and the mouth ahead on the left hand.
//   On the bend the gaze goes round with the heading for the first 6.5 m and at half
//   the heading's rate from there; the heading catches it up, and from flown 90.6 m (14.0 m and 1.7 s before the
//   join) the gaze is the route's own again, to the bit. It never turns back to the right, and it is never more
//   than 30 degrees left of the heading as flown (29.9). As flown the camera's yaw is 18.3 degrees a second at its
//   most (11.4 s, two thirds of the way round the bend; the route's own gaze alone would turn 19.95), its pitch
//   between 1.6 degrees up (the run) and 0.4 down (the join), the speed 8.2 m/s
//   to 11.8 s and 9.1 at the join (the run-up to the mouth begins on the bend, 7.5 m before the join, at the flown
//   metre it always began at). The camera follows the gaze 0.4 s behind: at the join it has 2.0 degrees of the bend
//   still to turn (the lead leaves that as it was, to 0.02 of a degree), under 1 degree from 12.95 s, under 0.1
//   from 13.8 s.
//   TWO SHARES OF THE WAY: every u named in this file is the SCRIPT's, the share of the part's own line (306.4 m); the
//   engine's u is the share of the flown line (309.5 m: 3.1 m longer, the S's measure, kept). toV and toU turn one
//   into the other (as they did on the S: by the S's z over the S's length, by the metre from there on); update, the
//   pace and the points of interest are handed the engine's u and turn it first.
//   49.4 s (A DEPARTURE from the brief's 40 s, so that the gaze stays gentle and NO SPEED CHANGES BY MORE THAN ABOUT
//   3 m/s IN ANY ONE SECOND: every change of speed is even, 2.55 m/s each second, the launch up the chimney 2.9; the
//   duration is what these speeds give on the flown line): 105 m along the cliff and round into the mouth on a swell,
//   one slow left-hand eddy in the choir while the cave drains, the flood back up the nave, the surge to the back wall
//   and out up the blowhole on the spout (its head under the lens). FLOWN AS THE ENGINE FLIES IT (the pace read at 65 points and scaled to
//   the duration, the speed following what is asked 0.7 s behind; makeScript's clock is that flight, so every second
//   named in this file is a second of the flight): 8.2 m/s outside, 9.5 to 11.3 through the mouth (under the brief's
//   12 to 13.4: the run-up is even now, and the brake after it too), 3.0 to 3.6 right round the loop, up to 6.8 on the
//   surge, 4.2 to 5.2 down the glide and round the arc under the blowhole's foot, 9.7 to 14.1 up the chimney. The
//   greatest change of speed within one second is 2.8 m/s (down, just inside the mouth). The camera's yaw is 35.4
//   degrees a second at its most (the first turn; 33.7 on the turn back), its pitch 14.8 (the gaze's climb into the bell).
//   THE GAZE ON THE LOOP is led by ONE POINT OF INTEREST THAT TRAVELS (this world's choice; the brief names one fixed point, the
//   mouth's foot: no weight of a fixed point holds the mouth to the leg's end and still lets the gaze go round inside
//   40 degrees a second). By the route alone (u 0.472 to 0.672) it leads the gaze left round the first turn at an even
//   rate onto the mouth, RESTS ON THE MOUTH (a point 6 m up its slot from its foot) for the whole run back
//   toward it along the pavement (u 0.55 to 0.596, while the swell comes on outside the slot), then leads it back right-handed over the pavement and the choir, where the flood comes over the
//   stumps, to the nave (with the route's own left turn the gaze bore on the east wall from 4 m).
//   THE GAZE IS LIFTED INSIDE (order 8; the route's own gaze, the chord 12 m ahead, lies level a metre over the water
//   and dips 10 degrees on the glide under the bell, down onto the water). Two more points of interest, by the
//   route alone: ON THE FIRST PASS (passGaze, from 12 m before the mouth to the first turn) the gaze keeps the route's
//   bearing and is raised to 8.5 degrees above the level, toward the pipes and the roof's hanging ends over the
//   water's far edge (the travelling point takes it over at that pitch and
//   keeps the mouth's slot 7.5 to 11.5 degrees up). FROM THE TURN TO FACE THE BACK (liftGaze, u 0.672 on) the gaze
//   rests on a point on the blowhole's axis: first the middle of the shaft of daylight where it stands in the cave
//   (7.5 m up the axis; the
//   pitch 11.5 to 13 degrees); then from u 0.695, as the nave closes, the point climbs the axis into the bell (22 m up
//   it by u 0.775) and on to the ring's own middle (u 0.81), where the route's own gaze up the blowhole is the same
//   gaze. A STRAIGHT FROM THE LINE FIRST REACHES THE RING at 39.5 s (u 0.745),
//   the lens then 16 m short of the blowhole's foot and 3.5 s before it is under
//   it; the pitch climbs 14.8 degrees a second at its most.
//   THE BANK IS NOTHING (order 9: bank 0; A DEPARTURE from the brief's 0.3, on the owner's word: the horizon level, no
//   lurch; the cave's flat water is the horizon, and no roll at all while the gaze climbs into the bell): the engine
//   leans by the path's bend times the bank, so nothing leans; its own sway alone tilts the horizon, 0.09 degrees.
// THE WATER IS THE VEHICLE  Every level is a function of u (the route), read from tables made in build (makeScript):
//   the water under the lens is the path's height minus 1 m from the mouth's apron to the spout's foot; outside the whole
//   sea rises under us as the swell that carries us in, and goes down and up with the cave's level after. THE SURGE under
//   the bell, the level standing still: the sea draws back (the swell's trough rides under the lens: the hump's height
//   goes under zero, to -4.1 m, its half length drawn in from 16 m to 9) while the pile climbs the back wall to 3 m and
//   this world's face of white water stands on it; then the trough passes and the water lifts us into the spout. The part is told
//   at every update: setLevel, setSea, setSwell, setPile, setLift, setSpout, setFoam, setWetLine, setGlow, setFlood.
//   THE SWELLS (setSwell): the first humps up 2.3 m before the mouth, on the leg's bend, with its crest 10 m north
//   of the lens (between the lens and the cliff as the lens turns in: its back hides the cliff's foot ahead), the
//   lens comes up onto it and rides it in; the
//   next stands up 3.4 m out at sea while the gaze rests on the mouth (a dark hump with a white crest in the slot, on
//   this world's own sea, 58 m out and coming on), then runs in to the lens and carries it up the nave. THE FLOOD
//   (the route's, 0 to 1: nothing until that swell is in the mouth, u 0.62; whole through the surge to the back wall;
//   gone as the lens goes up the blowhole) goes to setFlood, and with the swell's place it lights this world's own
//   white water of the second pass (below); setFlood is asked for FLOOD_K (0.5: about a half) of it, eased to a little
//   over half of that under the bell, where the pile's own white comes on, and setLift (the part's white water round
//   the hump) for 0.14 with the flood, 0.09 under the bell, gone by 0.835 as the lens climbs away: THE FLOOD'S WHITE
//   ON THE OPEN WATER IS THE PART'S OWN (its sheet's body and torn white, under setFlood); this world lays no foam of
//   its own on the open water (order 9; below): white on green, the green plain between.
//   WHAT STARTS THE SPOUT IS THE WATER: setSpout is nothing until the pile against the back wall tops
//   out (u 0.805, the pile's own script: the heap has nowhere to go but up the blowhole); from that moment the spout
//   rises, whole by u 0.845, ITS HEAD HELD 1.5 m UNDER THE LENS all the way up (order 10; the route's own height of
//   the lens up the axis: the part's tube of ropes stood 12 m ahead of the lens, broad pale blades all round the
//   line; none of it is drawn ahead of the lens now; its strength still boils the part's sheet at its foot).
//   (The water is the vehicle: the lens rides the heap's
//   face to the blowhole's foot and is there as the heap tops out; no test of where the lens is starts anything.)
//   (THE TIE IS ONE CONSTANT OF THE ROUTE, U_TOP: the pile's script climbs to its top at U_TOP and the spout's script
//   starts at U_TOP. The spout does not read the pile's value: change one and the other follows only through U_TOP.)
//   setFoam, setWetLine (the highest
//   water the choir has had, falling 0.12 m a second of the route's own clock), setGlow (it follows the water's level);
//   and once, for the look: setSeaBody, setWind. Nothing is added to the camera.
// THE OPEN SEA is this world's own sheet (SEA: eight swell trains running in on the cliff, and the hump that carries us
//   in), and ITS LOOK IS THE PART'S ONE TEXT OF THE SEA LAW (SEA_GLSL, imported from the part and put into the sea's
//   fragment text: nothing of that law is written in this file), on the part's own uniform objects: the mirror by the
//   grazing law with the cliff standing in it in upright streaks, the dark tongue under the mouth, the emerald tongue
//   at the sill, the lace near rock, a gale's torn white, the sun's sparks. The law is handed the water's own height
//   and slopes: this sea's own where its surface moves, the law's own swell where it still lies flat by the part's
//   sheet (as the sheet hands it): one look on both waters there, no seam. Over the law, this sea's own strokes
//   only, all far from the hand-over: cloud shadows crossing it by place and time, small torn whitecaps on its own
//   trains when it blows, a surf line by the part's depthAt and its stacks (white lit as the law lights its own,
//   never brighter than the brightest of the sky, and under 0.8), and the coming swell's dark face and white crest.
//   ONE WATER AT EVERY PLACE: sea and the part's sheet stand on one level law (uSea and the hump). Where the sheet lies
//   whole and the sea has not begun (wRim under 0.58) the sea is not drawn; it comes in over the level sheet between
//   0.58 and 0.6, before the sheet's brow dives under it. ONE BODY: the body this world gives to setSeaBody (its own
//   deep water under the look's light), the wind it gives to setWind. THE LANE: along the line into the mouth as the
//   S flew it (as it always was), and along the leg's run by the cliff west of the slot's line (order 15; the line
//   is order 18's, the wider one: SLOT_OFF, SLOT_K),
//   the trains are taken down by place so that the lens keeps half a metre of air at every phase.
// OUTSIDE  kit sky (no dome cloud: the blowhole looks up into clean blue), a ring of pearl stratocumulus low all round,
//   the light rig (no shadow map). The cloud's shadow is one slow breath of the sun's strength, its phase dealt in build.
//   INSIDE THE HEADLAND seven dark unlit walls (behind the apse and the blowhole, behind each side of the nave; behind
//   the face, over the cave's roof, before the blowhole, and the nave's west wall carried up to under the turf, order
//   14: the leg along the cliff has the headland on its left hand; in none of the cave's air, none over the turf, none before
//   the disc; THE ONE BEHIND THE FACE stands 14 m in, behind the cap's set-back face, its top a metre of x at a time
//   1.4 m under the part's true turf over it: none of it stands over the cliff's pipes with air round it (order 9c);
//   THE FLOOR OVER THE ROOF, at 26 m, shows from below through a hole in the roof's mosaic more than a metre wide on
//   a few deals, a square metre or two, far off: the dark of the headland's inside): a sight line that slips through a hairline between two pipes of the part's wall ends on the dark of
//   solid rock, not on this world's sky; and NO STRAIGHT FROM THE ROUTE REACHES THE PORTAL'S DISC before the lens is
//   under the bell (each is cut by a wall, by place: measured in build for every eye of the flown line, the leg along
//   the cliff with it).
// LIFE (all by place, each kind from a stream of its own): BEFORE THE MOUTH, THE MOUTH'S OWN (order 15: where and as it
//   was before the leg along the cliff, by its old laws, so that what the mouth's slot shows from inside the cave is
//   what it showed): puffin strings on racetrack lanes either side of the line into the mouth, strings crossing that
//   line 100 to 68 m out, strings in file round a great level wheel over it, puffin rafts, one of which patters off
//   on the route's clock. What of it would come within its own law's clear air of the line as flown is dealt and
//   left out: the four lanes west of the mouth's line, which the leg's bend and run pass through. BESIDE THE LEG,
//   THE LEG'S OWN, WEST OF THE SLOT'S LINE (SLOT_OFF, SLOT_K. Counted for orders 17 and 18 on seventeen deals,
//   outside the build, against the part that is live and against the artist's part, whose columns are the same
//   bodies: from the join on no straight line from the lens reaches any of it, in any direction the engine can
//   turn a camera there (the seen edge, told at SLOT_K), by 1.1 m and more; a line through a hairline between
//   two of the part's pipes is not counted), dealt at LEG_LIFE
//   of the mouth's numbers: puffin strings on racetrack lanes beside the run (laid out about the brief's straight
//   leg and turned with it to lie along the run by the cliff: five lanes on the sea's side, three on the cliff's,
//   each ended at the slot's line; a lane keeps off the plinth and the stacks or takes no bird), strings that come
//   in past one ear and CROSS THE WAY close before the lens (five lanes, 10 to 42 m along the run; they keep their
//   clear air by height, measured against the lens at every moment of the leg, and fly no nearer the lens than the
//   mouth's strings flew on the S), strings in file round a level wheel which runs OVER the run about 38 m from its
//   first metre (the same measure of height; its radius the greatest that keeps it west of the slot's line), puffin
//   rafts beside the run (one, twenty birds ON THE CLIFF'S SIDE of the run, patters off east along the run and
//   toward the cliff on the route's clock, each strike of a bird on the water leaving one small splash that fades
//   by its own age: orders 17 and 20; it is the mirror of the raft order 15 had seaward of the run BUT FOR THESE
//   LAWS: each of its birds faces the way it runs and draws no other heading, and no two of its seats lie nearer
//   than half a metre (order 18); no bird of the leg's other rafts sits within a metre of its seats or of its
//   runs; no two birds of the leg's rafts sit nearer than 0.4 m, and no two of the pattering birds are nearer
//   than 0.3 m to each other at any moment of their runs (order 19); a sitting bird of the leg faces by the one
//   law of this world's rafts, in the world's own bearings, and the leg's wheel starts by its own draw (order 20)),
//   kittiwakes on the part's ledges, wheeling before the mouth (two wheels low and near: the leg's bend comes in under one of them) and in the bell under the bend (a lane is kept only if at
//   every point of its lap the bird's centre and both wing tips, through the lane's own rise and fall, lie outside every
//   column of the part's true rock and outside the cone to the portal's disc), grey seals on the part's stumps where the
//   whole body, flippers and all, lies in none of the part's true columns (each column's own outline, foot and top, read
//   from the part's meshes; a seal lies flat on the highest top under it, or draped over a stump with head or tail
//   hanging; they float off when the water covers a stump and lift their heads as it drops; none slides off), seals
//   afloat in the eddy the line turns round and beside it in the nave (each awash along the water, a wet back and a
//   head; what hangs under the surface veiled by the water over it, by its depth; up to three of these dive as the
//   lens comes round, each with a splash), shags drying their wings on the part's perches and on
//   the high stumps over the pass, moon jellies (small, a forearm across at most, MILK-WHITE in the green water with a
//   pale rim and four violet-white rings in the crown, in three loose drifts close by the line where the lens goes
//   slowly, no two touching, each a bell seen through its near skin, hanging just under the surface, beating; none
//   further off, where a bell is a pale dot), sand eels (a shoal in
//   the nave and one in the eddy), kelp that lies over with each surge and hangs when the level falls, the rare basking
//   shark. EVERY ONE OF THEM KEEPS ITS CLEAR AIR BY PLACE OR IS NOT THERE: a lane, a wheel, a seat, a body whose least
//   air to the flown line falls under CLEAR (2.4 m; the owner's bound is 2.0) is moved until it clears or left out,
//   in build; a loop that raises a thing and ends without clearing leaves the thing out (THE RAFT BIRDS AND THE SAND
//   EELS WITH THEM: a raft bird, with its whole run if it patters, is measured in plan and under CLEAR is dealt again
//   elsewhere; a shoal's course is drawn in until it clears, and a shoal that never clears is left out; a diving
//   seal's lifted head is counted at every stage of its dive). Inside, a body is lit after the part's seventh law for its rock: the mouth's cold light, the sun down the
//   nave where the part's own law lets it in (sunIn, by place: seals and birds in the beam are warm), of the emerald
//   from below a touch only. Kelp is broad straps, a hand and more wide, olive brown (it holds its olive under a warm
//   sun) with a darker midrib and edge, bent over into the surface in one smooth curve and dipping under it along its
//   length: dimmed where the water lies over it.
// WHITE WATER  THE BURST up the east jamb (on the route's clock): the wave strikes two seconds before the lens is 35 m
//   short of the jamb. IT IS THROWN WATER (order 9), not a cloud: A TALL NARROW PLUME, some four metres wide at its
//   foot and fifteen high, widening only a little, leaning east with the wave's throw and FANNING FROM ITS FOOT (a
//   piece east of its middle drifts and leans east, one west of it west). ALL OF IT IS SMALL PIECES DRAWN OUT ALONG
//   THEIR MOTION (a quarter to a half metre wide, eight times and more as long while they rise and stand, 4.5 as they fall; no
//   round tuft anywhere): each a torn streak with a head that leads and a tail that frays into threads, its grain
//   running up it while it rises and down it as it falls. A CORE of 240 pieces dealt thick about its middle, near
//   opaque (the pipes do not show through it); A VEIL of 140 pieces to two metres either side, threads with air
//   between (the pipes show through it); ITS HEAD, five thrown fingers of small pieces to 13 to 15.5 m; A BOIL of
//   44 short pieces at its foot before the plinth, where this sea's own sheet boils white and sends rings of foam
//   out over the water. ITS COLOUR: whiter and cooler than the sunlit rock: near-white where the sun strikes it (the
//   sun's light taken three quarters of the way to its own grey, under 0.8), the sky's blue-grey in its own shade and
//   where it thins; it stands in ROPES of light and shade half a metre wide that fan from its foot and run with the
//   water, by place. It stands at its height while the lens closes from 39 m to some 22 m, and falls as a curtain of
//   downward threads. NO PIPE OF THE CLIFF CUTS A PIECE (a piece lies in the view's plane, and a pipe standing
//   seaward of it would cut it with its own straight side: each is set seaward of the most seaward pipe under its
//   width and its drift, by the part's true rock, and by as much more as its rim can dip toward the rock when the gaze
//   turns; the short black stumps of the plinth do stand before its foot: they are rock). Behind it THE PIPES ARE WET
//   AND DARKER (a soft dark stain, sprites set half a metre before the rock, that comes up the rock with the water
//   and stays as the lens goes by); no thread or drop is left on the jamb once the body is down.
//   With it the thrown water as streaks, in three volleys: seven jets of torn sheets that lead its core, ropes in its
//   body, A FAN OF FINE DROPS beyond its head and A FRINGE OF SEPARATE DROPS out of its sides (short near-white dashes
//   that catch the light; nothing of them is wider than 0.3 m rising or 0.09 m falling); all of it is 5 m and more
//   east of
//   the line, each puff CLEAR and more from the line through its whole flight at its full size. THE FLOOD OF THE
//   SECOND PASS (by the route's flood and where the swell has come to): torn sheets pouring off the pavement's stumps,
//   spray off the feet of the nave's east wall and along the pavement's edge, and SOFT FOAM ONLY WHERE WATER MEETS
//   ROCK (order 9: at most eighteen patches in the lee of the pavement's stumps and eight along the east wall's foot,
//   flat on the water, soft-edged, low and grey-white, lit at 0.8 of what the part's sheet gives its own foam; NONE ON
//   THE OPEN WATER: the rafts of lace that ran north with the flood and raced to the face under the bell are out);
//   SPRAY FALLING IN THE BELL (some two hundred drops and short threads coming down through the shaft's light round
//   the blowhole's foot, each its own straight fall from its own height to the water, in the chimney's light by its
//   height; EACH IS KEPT OFF THE LINE AS A BODY: its whole fall, measured every half metre, CLEAR and more from the
//   flown line; NO HAZE OF SOFT PUFFS hangs in the bell any more) and THE BOIL UNDER THE SHAFT (order 10): where the
//   shaft's water lands round the blowhole's foot, a low boil of white water (300 heavy pieces thrown 0.3 to 1.6 m)
//   and a rise of fine spray (180 threads thrown 2 to 4.4 m, fading as they turn over), some 11 m wide and 3 to 5 m
//   high as the nave sees it; pieces as the burst's (drawn out along their motion, feathered, no round tuft, no pane),
//   near-white in the blowhole's daylight and blue-grey out of it, by place; alive on the time's loop; it shows
//   from the moment the swell comes in (the route's announce) and THE HEAP DROWNS IT (it goes down as the pile climbs
//   the back wall, gone before the pile is full: the face stands there then). A MEDIUM, BY PLACE BOIL_AIR (3 m) AND
//   MORE FROM THE WHOLE FLOWN LINE through every piece's whole flight at its full drawn-out size, at every height the
//   water stands there (it parts round the line that comes down the nave and goes up over its back; dealt thicker
//   behind the foot, where the nave sees it across that gap). No shaft of this world's stands at the back of the nave
//   any more (the shaft of daylight is the part's). Thin spray low at the
//   mouth's sill (the mouth's dark above it is the part's; every puff is soft where it meets the water), THE FACE at the back wall (torn sheets of white water as
//   high as the pile, a veil and thrown drops off its top), and IN THE CHIMNEY NOTHING BROAD (order 10: the ropes,
//   the torn sheets and the three shafts are out): 70 fine bright drops (0.18 to 0.4 m long, 4 to 5.5 cm wide) and 14
//   short threads of beads (0.5 to 0.9 m, 3 to 4 cm) FALLING near its wall, 5.3 m and more from the axis the lens
//   rides, each down its own straight way from its own top; THEY TAKE THE LOOK'S LIGHT by
//   their height: green-lit from below near the bell, the shaft's blue-white in the middle, the open sky and sun
//   toward the lip, warm white on golden. The rock, the green ends and the ring carry the climb. The fountain round the lip (lit by
//   the sun on its sunward side), the seals' splashes, the raft's wakes (white dashes that lie on the sea's own drawn surface), roof drips (drops a hand to a forearm
//   long, faint grey glints, that fall from the roof's own rock and land where and when the part's sheet opens a ring).
//   NOTHING OF IT STANDS BEFORE THE PORTAL'S DISC: every puff through its whole flight at its full size, every drop
//   and thread over its whole fall, is kept out of the cone from each point of the route that sees
//   the disc to the whole disc (radius 5.6 m and 0.15 beside).
// LOOKS (ctx.vary)  day: bright broken overcast; golden (also for night): a low sun due south down the nave, jade water;
//   dawn: sea fog; mood above 0.75 on a day: after a gale. With hour 'any' the look is dealt from the world's own stream.
//   Seasons by seed: early summer; late summer (guillemot rafts, fewer strings); autumn (white pups on the top stumps).
//   One air (colour, density) for each look, wherever the eye stands, for cliff, sea and bodies; the cave's own dark air
//   is the part's.
//
// WHAT READS THE EYE, and nothing else does (the clock only moves the ambient loops):
//   THE AIR between the eye and a thing: wAir (1 - exp(-(density x distance)^2)) on every body, puff and streak, and for
//     a body in the cave the part's own damp air by the share of the sight line that lies behind the mouth's plane
//     (thick in the mouth's first 6 m: from the sea a seal inside sinks into the dark slot with the rock it lies on);
//     the open law on the sea, which also fades into the horizon's sky between 1.5 and 3.4 km.
//   THE LEAST WIDTH IN PIXELS: streaks are never narrower than 1.5 pixels (uResY, the eye's distance, the lens's
//     projection), with the alpha taken down by as much as the width was put up. A kelp blade is not widened: its
//     width AS THE EYE SEES IT (edge-on across a low look it is a line) fades it out from 2.4 pixels down to 1; under
//     one pixel it is not drawn.
//   THE PIXEL'S FOOTPRINT (fwidth): on the sea a swell train finer than about two pixels is not handed to the law (the
//     part's law filters its own facets, lace and dashes by seaFw).
//   THE FACING OF SPRITES: puffs are quads in the view's plane (the view's own right and up give a puff's piece its
//     place in the world: for the water's height under it, for the wet's grain down the pipes, for the burst's ropes of
//     light and shade). THE WHOLE LIST: the mist at the sill, the face's veil, the fountain round the lip, the spume,
//     the flood's spray; THE WET STAIN on the pipes right of the mouth; EVERY PIECE OF THE BURST'S BODY (core, veil,
//     head, boil) AND OF THE BOIL UNDER THE SHAFT (heavy water, spray): drawn out along the view's own up, which is
//     the world's up but for the gaze's pitch, and leaning in
//     the view's plane). The fountain's puffs are lit as round things by the sun's bearing in the view; the burst's
//     pieces by place (its form and the sun's own bearing) and the boil's by place (how near the blowhole's axis),
//     not by the view. Streaks (the burst's jets, ropes, fan and
//     fringe of drops, the splashes, the face and its drops, the pour, the drops and threads in the chimney, the drops
//     falling in the bell, the roof's drips) are turned about their own axis to the eye (the foam at the
//     rock's feet and the wakes are not: they lie flat on the water); a sand eel is a sliver turned about its way to
//     the eye.
//   THE MIRROR AT A GRAZING LOOK: the part's sea law on this sea (its Fresnel term, the mirrored sky or cliff by the
//     eye's bearing, the sun's glint by the half way between the sun's bearing and the eye's); the coming swell's face
//     shows the water's dark body where its slope turns it to the eye (the same Fresnel, with the swell's own slope);
//     the coming swell's top lets a low sun through, and its spill is warmer, by the eye's bearing to the sun;
//     the water over jellies and kelp hides them as the look flattens, a jelly's thin bell shows most where the
//     look runs along its skin, and its far skin (the side turned from the eye) is not drawn; the wet sheen on a body's rim, and the highlights on a wet coat and on kelp (the
//     mouth's slot, the sun down the nave or outside, a touch of the water's glow: the half way between the light's
//     bearing and the eye's).
//   THE KIT'S OWN: sky, clouds and light rig take the camera (the dome and the ring follow the eye; clouds are lit by its
//     bearing).
//   WHAT IS KEPT THOUGH IT IS NOT TRUE TO THE THING (the owner's rule of 14 Oct on terms that read the eye): three
//     terms of this file fade or hide a thing by the eye. Each stands as it stands in the live world; none is of this
//     round. What each is, in plain words, and what the honest mend would be:
//     THE FAR SEA (hf, in the open sea's fragment text): between 1.5 and 3.4 km from the eye the sea's colour is let
//       go into the horizon's sky, by a curve that is not the air's own. The honest mend: let the air's law alone,
//       with the horizon's colour as its far colour, carry the sea into the sky.
//     A KELP BLADE (the fade by its width in pixels): a blade is a flat ribbon with no thickness; where it is far or
//       edge-on and under 2.4 pixels wide it fades, and under one pixel it is not drawn. The honest mend: keep the
//       blade at a least width in pixels with its alpha taken down by as much, as the streaks do, and give it a thickness.
//     A MOON JELLY'S FAR SKIN: the bell is a thin shell with no wall; above its rim the side turned from the eye is not
//       drawn (the short skirt under the rim is drawn all round but for its top edge), so that two thin skins do not read as a pale ball. The
//       honest mend: give the bell a wall with thickness and draw both skins, the far one dimmed by the body the ray crosses.
//     Other things of this world are laid once at build against the line the lens flies, or follow the place on the
//       route (the script: the water rides with the lens). A separate read of 14 Oct listed every place in this file
//       that reads the eye, the lens's line or the pixel's footprint; the list went to the owner with this round's
//       hand-in.
// BROUGHT IN: cutBy (does a straight cut a triangle) follows the ray-triangle test of Tomas Moller and Ben Trumbore,
//   journal of graphics tools 2(1), 1997, and its code raytri.c (github.com/erich666/jgt-code, folder
//   Volume_02/Number_1/Moller1997a; credited there "by Tomas Moller, May 2000"), under the MIT licence of that archive
//   (The MIT License (MIT), Copyright (c) 2015 Eric Haines).
// BROUGHT IN: h21 (in the dealing of the roof's drips) is hash12 of Hash without Sine by David Hoskins
//   (shadertoy.com/view/4djSRW) written in JavaScript, under the MIT licence, Copyright (c)2014 David Hoskins.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudFieldAsync, makeLightRig, skyDirection } from '../kit/sky.js';
import { buildHero, SEA_GLSL } from '../parts/basalt-organ-cave.js';

const FOV = 62;
const PALETTE = ['#12171B', '#1FC8A0', '#0E5560', '#D98AA0', '#C99A2E', '#EEF6F2', '#F26A1B'];
const AX0 = new THREE.Vector3(0, 3, -81), AXD = new THREE.Vector3(0, 0.92718, -0.37461);   // the blowhole's axis (the part's)
const DISC = 5.6;                  // the portal's radius
const AHEAD = 12;                 // how far down the route the gaze rests, metres
const U_LEAVE = 0.805;            // where the lens leaves the water for the spout
const U_TOP = 0.805;              // where the pile against the back wall tops out (the script of the water: the spout starts here)
const CLEAR = 2.4;                // clear air every body keeps from the flown line (the owner's bound is 2.0 m; the part keeps 2.3; this world 2.4: a margin over the owner's bound)
const WET_FALL = 0.12;            // the wet line's fall, metres a second of the route's clock
const FLOOD_K = 0.5;              // how much of the part's own flood of its sheet this world asks for (setFlood): about a half (order 9: the open water's white is the part's own body and torn white; this world lays none of its own there)
const SPOUT = 0.35;               // the spout's strength at its full (it drives the part's boil at the spout's foot and turns the part's shaft air down; the part's tube of ropes is held under the lens by its head, see the script)
const BOIL_AIR = 3, N_BOIL = 300, N_RISE = 180;   // (order 10) the boil under the shaft: the least air a piece of it leaves the flown line, by place; its heavy pieces and its threads of spray
const N_DROP = 70, N_THREAD = 14;   // (order 10) the drops and the short threads falling in the chimney: 84 things, where 266 ropes and sheets and 3 shafts stood
const ss = smoothstep, TAU = Math.PI * 2;
// THE WAY'S MEASURE IS THE S's (order 14). Until order 14 the first leg was ONE SLOW S about the brief's straight leg:
// from the arrival on the axis, 110 m out and heading north, the line swung east and came back onto the brief's line
// 30 m out. That S is flown no more (the leg now runs along the cliff, below), but ITS MEASURE OF THE WAY IS KEPT TO
// THE BIT: how many metres of the brief's line each flown metre stands for (the S was matched to the brief's line by
// z), and the 3.1 m by which it was longer. So every share of the way, every second of the clock and every moment of
// the script falls on the flown metre it fell on, and from the join on nothing of the flight is other than it was.
// The S's law is its slope by the way in (q = 110 - z, metres): nothing for the first S_Q[0] metres, then evenly up
// to S_T (the tangent of the heading at its most) by S_Q[1], held to S_Q[2], evenly over to the other hand by S_Q[3],
// held to S_Q[4] (which follows from the rest: the line came back), and evenly out to nothing at S_Q[5].
// sOff(z): how far east of the brief's line the S ran at z.
const S_Z0 = 110, S_T = Math.tan(24.5 * Math.PI / 180), S_Q = [6, 22, 27, 59, 0, 80];
S_Q[4] = 2 * ((S_Q[1] - S_Q[0]) / 2 + S_Q[2] - S_Q[1] + S_Q[3]) - S_Q[5];
const S_I2 = (S_Q[1] - S_Q[0]) / 2 + S_Q[2] - S_Q[1];
const sOff = (z) => { const q = S_Z0 - z, Q = S_Q; if (q <= Q[0] || q >= Q[5]) return 0;
  return S_T * (q < Q[1] ? 0.5 * (q - Q[0]) * (q - Q[0]) / (Q[1] - Q[0]) : q < Q[2] ? S_I2 - (Q[2] - q) : q < Q[3] ? S_I2 + (q - Q[2]) * (Q[3] - q) / (Q[3] - Q[2]) : q < Q[4] ? S_I2 - (q - Q[3]) : 0.5 * (Q[5] - q) * (Q[5] - q) / (Q[5] - Q[4])); };
// THE LEG ALONG THE CLIFF (order 14), in two numbers: LEG_Z, how far out the run lies (z, metres seaward of the mouth:
// the lens is then 24.7 to 30.0 m from the plinth's foot, the nearest place where the part's depthAt has the bed at
// the surface; THE FOOT IS DEALT: measured over nineteen deals the lens is never nearer it than 24.7 m on the run,
// and on six of them, where the plinth has a deep bay, it is further than 30 m over the bay, 34.3 at the most; the
// run cannot lie nearer: the bend's radius is what this z leaves, and the route's own gaze turns 19.95 degrees a
// second with it as flown; the camera, its gaze led on the run, 18.3), and LEG_U, the join: the script's u at which the leg is on the part's line again (a point of the
// script's own table of 800: 101.5 m along the part's line, 8.5 m before the mouth). PX: the brief's straight leg's
// own x, about which the birds' lanes and the rafts are laid out (build: the leg's frame).
const LEG_Z = 32.1, LEG_U = 265 / 800, PX = 2.9;
// WHAT THE MOUTH'S SLOT SHOWS FROM INSIDE THE CAVE IS THE MOUTH'S OWN, AS IT WAS (order 15). THE SLOT'S WEST LINE
// (order 17; its figures are order 18's, the wider line) runs from a foot SLOT_OFF metres west of the mouth's
// west jamb (the part's jamb anchor, mirrored in the mouth's middle) out to sea, SLOT_K metres west for each
// metre out: a law of where the leg's own may be, by place alone. WHAT IT IS MEASURED AGAINST (orders 17 and
// 18, outside the build, on seventeen deals): THE SEEN EDGE, the
// westmost place of the sea, and of the air to 7 m over it, that a straight line from the lens can reach from
// the join to the shaft's foot. By the engine's law a camera turns after the gaze asked and never past it: at a
// place of the route it faces no further left than the furthest left any gaze has asked by then; and the widest
// view the engine opens reaches 60 degrees to either side of that. What lies beyond that no line of sight
// reaches; of the rest, the part's columns stop what they stop (as they stand in its meshes, each
// taken 4 cm fatter: A SIGHT LINE THROUGH A HAIRLINE BETWEEN TWO PIPES IS NOT COUNTED; there are such, under 8 cm
// wide, through the choir's south end and the west tower, and no line of this kind cures them). THE EDGE IS
// REACHED FROM THE EAST END OF THE LOOP, by a camera that has turned as far left as the gaze was ever asked
// there: a fast flight does, a slow one keeps short of it. On each deal the edge is a straight line from near the jamb, 0.310 to 0.344 m west for each metre
// out (counted from the jamb to z 140); at its westmost of the seventeen it lies at x -11.2 where z is 8, -19.2 at the run, -28.7 at z 60, -37.0
// at z 84 (the order 15 line lay east of it by 0.8 m at z 8, 1.5 m at the run, 3.7 m at z 84).
// THE SAME EDGE WITH EITHER PART (order 18): counted with the part that is live and with the artist's part the
// stage will carry. The artist's columns are live's to the bit (place, foot, top, outline, number); that part
// adds rock on the ground, which can only hide more, and shading, and moves no body: on each of the seventeen
// deals the edge is the same to the last figure, and so is every margin told here.
// THIS LINE IS THE WIDER OF TWO (order 18). THE LEAST, to a tenth of a metre at its foot, that keeps every thing
// of the leg half a metre west of the seen edge, and 0.08 m more for each time the place is as far from the
// eye as the jamb is (twice what the fattening can move the edge), has its foot at 1.3 and falls 0.328: order
// 17 built that. THIS ONE, foot 1.7 and 0.33, LIES HALF A METRE AND MORE WEST OF THE SEEN EDGE ITSELF, from the
// jamb as far out as z 80, on every one of the seventeen deals, and gives every thing of the leg about 0.46 m
// more. On the seventeen deals, the least a thing keeps west of the edge: the lane's east edge, which lies ON
// the line at the run, 1.14 m; the finer cells' corner 1.27 m; a puffin's wing tip 2.35 m; a sitting raft bird
// 2.21 m; the raft that patters, its seats, runs and splashes, 5.4 m (2 m by its law). THE LINE ITSELF: 0.50 m
// west of the edge at z 80 on the deal where the edge lies westmost, 0.24 m at z 100, east of it beyond z 117
// (0.3 m at z 140): beyond the lane and the finer cells, which end by z 60, the law holds by the 1.5 m the
// birds keep from the line (on these deals the last of them lies at z 87), not by the line alone.
// EAST OF THE LINE EVERYTHING
// OUTSIDE IS AS IT WAS BEFORE THE LEG (the sea's cells, its lane, the birds and rafts before the mouth); WEST OF
// IT lie the leg's own: its finer sea cells (their east rim 0.4 m and more west of the line), its lane (SLOT_W:
// the metres west of the line over which the lane comes in), its birds and rafts, each
// 1.5 m and more west of the line. LEG_LIFE: the share of the mouth's numbers at which the leg's own strings and
// rafts are dealt (the water beside the run is narrower, the mouth's life stands beyond it on the same water,
// and both together stay inside the world's budget of triangles).
const SLOT_K = 0.33, SLOT_OFF = 1.7, SLOT_W = 4, LEG_LIFE = 0.5;
const GF = (x) => x.toFixed(6);

const LOOKS = {
  day: { preset: 'day', zenith: '#4F8FCC', horizon: '#DCE3E6', sunEl: 48, sunAz: 135, sun: '#FFF6E8', sunI: 2.6, sky: '#8FA9BC', skyI: 0.95,
    haze: '#C9D6D8', den: 0.0012, emerald: '#1FC8A0', glow: 1, swell: 0.6, wave: 110, seaFoam: 0.2, off: 0.15, foam: 0,
    deep: '#0B4252', cover: 0.62, exposure: 1, tint: '#ffffff', wind: 0.35 },
  golden: { preset: 'goldenHour', zenith: null, horizon: null, sunEl: 13, sunAz: 180, sun: '#FFD39A', sunI: 2.4, sky: '#8C9CC4', skyI: 0.8,
    mouth: '#FFDCAA', mouthI: 3.3, haze: '#D9C6B4', den: 0.0015, emerald: '#3CCB88', glow: 0.95 /* set by hand: low warm sun down the nave fills the cave, so the water's own emerald is a shade less of the light than by day */, swell: 0.6, wave: 110, seaFoam: 0.18, off: 0.15, foam: 0,
    deep: '#1F5560', cover: 0.4, exposure: 1.02, tint: '#fff4e4', wind: 0.25 },
  fog: { preset: 'overcast', zenith: '#AEB8BD', horizon: '#C4CDD0', sunEl: 30, sunAz: 135, sun: '#E8EEF0', sunI: 0.55, sky: '#AEB9BE', skyI: 1.35,
    mouth: '#DDE6EA', mouthI: 2.3, shaft: '#C8D4DC', shaftI: 1.7, haze: '#BFC8CB', den: 0.005, emerald: '#1FC8A0', glow: 1, swell: 0.5, wave: 110, seaFoam: 0.16, off: 0.15, foam: 0,
    deep: '#46606A', cover: 0.9, exposure: 1.05, tint: '#ffffff', wind: 0.1 },
  gale: { preset: 'day', zenith: '#4A7FB4', horizon: '#C9D2D6', sunEl: 48, sunAz: 135, sun: '#F2F4F0', sunI: 1.9, sky: '#8A9AA8', skyI: 1.0,
    haze: '#C2CDD0', den: 0.0019, emerald: '#62D6C0', glow: 1, swell: 1.2, wave: 90, seaFoam: 0.62, off: 1.1, foam: 0.22,
    deep: '#1C5560', cover: 0.78, exposure: 0.98, tint: '#ffffff', wind: 1 },
};

// ---------------------------------------------------------------- GLSL shared by everything this world draws
// The uniforms are the part's own objects (hero.uniforms), so cave and world agree on level, light and air.
const W_COMMON = /* glsl */`
uniform float uTime, uLevel, uPile, uSea, uGlowAmt, uAirDen;
uniform vec4 uHump;
uniform vec3 uSunDir, uSunCol, uSkyCol, uMouthCol, uShaftCol, uGlowCol, uAirCol, uFoamCol;
float wLevel(float z){ float d = (z-uHump.x)/max(uHump.z, 1.); return mix(uLevel, uSea, smoothstep(2., 20., z)) + uHump.y*exp(-d*d) + uPile*(1.-smoothstep(-86., -56., z)); }
float wH21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float wVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(wH21(i), wH21(i+vec2(1.,0.)), f.x), mix(wH21(i+vec2(0.,1.)), wH21(i+vec2(1.,1.)), f.x), f.y); }
float wDay(vec3 P){ return exp(min(P.z, 0.)*.085); }
float wBob(vec2 xz){ return .15*sin(uTime*1.18+xz.y*.045+xz.x*.03)*(.6+.4*sin(uTime*.37+xz.y*.02))*(1.-smoothstep(6., 20., xz.y)); }   // the cave sheet's own bob (the part's)
float wRim(vec2 xz){ return length(vec2(xz.x/16.5, max(xz.y-2., 0.)/34.)); }      // the part's measure of its sheet before the mouth: whole to 0.6, slipping under the sea from there, gone by 1
vec3 wNrm(vec3 v){ return v*inversesqrt(max(dot(v, v), 1e-12)); }      // (a vector that can be zero is never handed to normalize)
vec2 wNrm2(vec2 v){ return v*inversesqrt(max(dot(v, v), 1e-12)); }
// the S of the first leg, by place: how far east of the brief's line the flown line runs at z, and its slope by z (sOff, sOffD)
float wOff(float z){ float q = ${GF(S_Z0)}-z; if(q <= ${GF(S_Q[0])} || q >= ${GF(S_Q[5])}) return 0.;
  return ${GF(S_T)}*(q < ${GF(S_Q[1])} ? (q-${GF(S_Q[0])})*(q-${GF(S_Q[0])})*${GF(0.5 / (S_Q[1] - S_Q[0]))} : q < ${GF(S_Q[2])} ? ${GF(S_I2 - S_Q[2])}+q
    : q < ${GF(S_Q[3])} ? ${GF(S_I2)}+(q-${GF(S_Q[2])})*(${GF(S_Q[3])}-q)*${GF(1 / (S_Q[3] - S_Q[2]))} : q < ${GF(S_Q[4])} ? ${GF(S_I2 + S_Q[3])}-q
    : (${GF(S_Q[5])}-q)*(${GF(S_Q[5])}-q)*${GF(0.5 / (S_Q[5] - S_Q[4]))}); }
float wOffD(float z){ float q = ${GF(S_Z0)}-z; if(q <= ${GF(S_Q[0])} || q >= ${GF(S_Q[5])}) return 0.;
  return -${GF(S_T)}*(q < ${GF(S_Q[1])} ? (q-${GF(S_Q[0])})*${GF(1 / (S_Q[1] - S_Q[0]))} : q < ${GF(S_Q[2])} ? 1. : q < ${GF(S_Q[3])} ? 1.-(q-${GF(S_Q[2])})*${GF(2 / (S_Q[3] - S_Q[2]))}
    : q < ${GF(S_Q[4])} ? -1. : (q-${GF(S_Q[5])})*${GF(1 / (S_Q[5] - S_Q[4]))}); }
`;
// light on a body. env: 0 the open air, 1 the cave, 2 the blowhole (the part's three lights, simplified). In the cave it
// follows the part's seventh law for its rock, so that a body agrees with the stump it lies on: a little of the sky by
// the day that reaches the place; the mouth's cold light on what looks at it, broad in the first twenty metres; THE SUN
// DOWN THE NAVE where the part's own law (sunIn, by place) lets it in; of the emerald from below only a touch (the
// part's rock is black between the lines of its net: a body is no green lamp); the shaft's blue-white at the back.
const W_LIGHT = /* glsl */`
// the sun through the mouth, by place (the part's sunIn, to the letter, on this file's level law)
float wSunIn(vec3 P){
  float sz = uSunDir.z; if(sz < .02) return 0.; if(P.z >= 0.) return 1.;
  float t = -P.z/sz, bl = .3+.014*t; vec2 h = P.xy+uSunDir.xy*t;
  float hw = max(min(8.5, min(8.5-(h.y-12.)*.42, 24.-h.y)), 0.), lv0 = wLevel(0.);
  return smoothstep(.02, .1, sz)*(1.-smoothstep(hw-bl, hw+bl, abs(h.x)))*smoothstep(lv0-bl, lv0+bl, h.y)*(1.-smoothstep(23.-bl, 24.+bl, h.y)); }
vec3 wLight(vec3 P, vec3 N, vec3 alb, float env){
  float chim = step(1.5, env), cave = step(.5, env)*(1.-chim), open = 1.-step(.5, env);
  float day = wDay(P);
  vec3 col = open*alb*(uSunCol*max(dot(N, uSunDir), 0.)+uSkyCol*(.45+.55*N.y)*1.7);
  vec3 Lm = vec3(1.5, 10., 3.)-P; float dm = dot(Lm, Lm); Lm *= inversesqrt(max(dm, 1e-4));
  vec3 mouthC = mix(uMouthCol, min(uMouthCol, uSkyCol*1.25), smoothstep(-9., -1., P.z));      // (in the throat the mouth's light is the open sky's)
  float nlm = dot(N, Lm), day20 = exp(min(P.z, 0.)/11.)*(1.-.45*smoothstep(-7., -1., P.z));
  col += cave*alb*(uSkyCol*(.45+.55*N.y)*.3*day+mouthC*(min(.5, 820./(820.+dm))*(max(nlm, 0.)*.75+.12)+day20*max(nlm*.6+.4, 0.)*.36));
  float sI = cave > 0. ? wSunIn(P) : 0.;
  col += cave*sI*alb*uSunCol*max(dot(N, uSunDir)*.8+.2, 0.)*1.2;
  float lv = wLevel(P.z), h = max(P.y-lv, 0.);
  float zone = uGlowAmt*mix(.62, 1., smoothstep(-88., -50., P.z))*(1.-.8*smoothstep(-9., -2., P.z))*(1.-.6*sI);
  vec3 Lg = wNrm(vec3(-P.x*.5, lv-2.-P.y, 2.5));
  vec3 gcol = uGlowCol/1.3, gw = mix(gcol, vec3(dot(gcol, vec3(.3, .5, .2))), .45);
  vec3 glow = gw*alb*(zone*(.58*exp(-h/7.)+.42)*(.25+.55*max(dot(N, Lg), 0.)+.5*max(-N.y, 0.))*1.5);
  col += cave*glow/(1.+dot(glow, vec3(.3, .5, .2))/.45);
  vec3 Ls = vec3(0., 9., -80.)-P; float ds = dot(Ls, Ls);
  col += cave*alb*uShaftCol*(420./(420.+ds))*(1.-smoothstep(-62., -30., P.z))*(.5+.5*N.y)*.8;
  col += chim*alb*uShaftCol*(.6+.4*dot(N, vec3(0., .92718, -.37461)))*mix(.35, 1.1, smoothstep(3., 58., P.y));
  return col;
}
// THE AIR between eye and thing: the look's haze by the length of the sight line; and for a thing in the cave the part's
// own law for its damp air (the share of that line which lies behind the mouth's plane, thick with spray in the mouth's
// first 6 m: from the sea, what is inside sinks into the dark slot with the part's own rock)
vec3 wAir(vec3 col, vec3 P, float dist, float env){
  float f = 1.-exp(-uAirDen*uAirDen*dist*dist), cave = step(.5, env)*(1.-step(1.5, env));
  vec3 air = mix(uAirCol, uGlowCol*.016+uAirCol*.02*wDay(P), cave);
  float cz = min(cameraPosition.z, 0.), pz = min(P.z, 0.), dz = max(abs(cameraPosition.z-P.z), 1e-3);
  float inFrac = cameraPosition.z < 0. && P.z < 0. ? 1. : abs(cz-pz)/dz, thr = abs(max(cz, -6.)-max(pz, -6.))/dz;
  f = 1.-(1.-f)*exp(-dist*(inFrac*.010+thr*.07)*cave);
  return mix(col, air, f);
}
// the light white water takes at a place (as the part lights its own foam; outside, as its one sea law lights its white:
// warmed by a low sun)
vec3 wFoamLight(vec3 P){
  float inside = 1.-smoothstep(-4., 7., P.z), day = wDay(P), up = smoothstep(26., 40., P.y);
  inside *= 1.-up;
  float gz = uGlowAmt*mix(1., .5, 1.-smoothstep(-85., -20., P.z))*exp(-max(P.y-wLevel(P.z), 0.)/10.);
  vec3 Lmo = vec3(1.5, 10., 3.)-P; float mouthI = 650./(650.+dot(Lmo, Lmo));
  vec3 gw = mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3, .5, .2))), .35);
  vec3 fl = (uSkyCol*.7+uSunCol*(.16+.2*(1.-smoothstep(.2, .55, uSunDir.y))))*.96*(1.-inside)+inside*(uSkyCol*.3*day+uMouthCol*mouthI*.55+gw*gz*.45+uShaftCol*(1.-smoothstep(-80., -55., P.z))*.4);
  fl += uShaftCol*.35*up*step(P.z, -60.);
  return min(uFoamCol*.78*fl, vec3(.8));
}
// the light on foam that lies on the cave's sheet, as the part's eighth sheet lights its own foam (the mouth's light, the
// shaft's, the water's own glow from below), so that this world's lace and the sheet's foam are one white
vec3 wSheetFoam(vec3 P){
  float inside = 1.-smoothstep(-4., 7., P.z), day = wDay(P);
  vec3 Lmo = vec3(1.5, 10., 3.)-P; float mouthI = 650./(650.+dot(Lmo, Lmo)), shaftI = (1.-smoothstep(-84., -36., P.z))*inside;
  vec3 gw = mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3, .5, .2))), .35);
  float gz = uGlowAmt*mix(.3, 1., smoothstep(-90., -24., P.z));
  vec3 fl = uSkyCol*.55*mix(1., .5*day, inside)+uSunCol*(1.-inside)*.2+uMouthCol*inside*mouthI*.62+uShaftCol*shaftI*.9+gw*gz*.84;
  return min(uFoamCol*.78*fl*mix(1., 1.3, inside), vec3(.8));
}
`;
// THE OPEN SEA's law, by place and time alone: eight long-crested trains running in toward the cliff (four of swell, four
// of wind sea), their crests a little sharpened and gently bent. The same law lifts the sea's grid, turns its mirror and
// floats the rafts and the kelp. wSeaTop is the drawn surface: the part's own level (uSea and the hump) plus the trains.
// ONE WATER AT EVERY PLACE: where the part's sheet lies whole and level (wRim under 0.6) this sea is not drawn up to 0.58.
// From 0.6 the sheet dives under the sea's level, soon steeper than a low eye's line of sight, and its diving brow turns
// its own mirror to the sky (a pale line on dark water if it showed): so this sea comes in over the sheet while the sheet
// still lies level, from nothing at 0.58 to whole at 0.6: a hand-over one way, with no cut and no crossing, on one level
// law and with the sheet's own bob. Both waters wear the part's one text of the sea law (SEA_GLSL), and by the sheet
// this sea hands it what the sheet hands it (the law's own swell): no tint, no seam.
// Toward the apron the trains are held to 0.25 m at their highest (uSeaKin), and they come up from nothing past the
// hand-over (rim 0.62 to 1.25): a crest there would stand over the sheet as a lip a low eye could look under.
// THE LANE: within 4 m of the lane's own line (a place in the world, not the lens) the trains are taken down by
// uSeaLane.y, worked out at build so that at every phase of the sea's clock the lens keeps half a metre of air over the
// highest water. The lane's line is, as it always was, the line into the mouth as the S flew it (its x by z: wOff);
// and (order 15) the leg's run by the cliff (z = uLeg.z), WEST OF THE SLOT'S LINE ONLY: wLegD is the metres from the
// run, with uSlot.w more for each metre a place lies nearer the slot's line than uSlot.w: on the slot's line and
// east of it it is 16 m and more. The lesser of the two distances is taken: east of the slot's line that is the
// old one, or both are past the lane's edge, and the trains there stand as they stood before the leg, to the bit.
// The run needs its lane only west of the line: nearer the mouth the trains are low by the apron's law (uSeaKin);
// the lens's air under the law as it stands here is counted in build (info.sea.air).
const W_SEA = /* glsl */`
uniform vec4 uSw[8];        // a train's heading (x, z), wave number, amplitude
uniform vec2 uSwB[8];       // its phase, radians a second
uniform sampler2D uShoreTex; uniform vec4 uShoreRect;      // metres of water to the nearest rock (0..25.5), by place
uniform float uSeaKin;      // the trains' share by the part's sheet
uniform vec2 uSeaLane;      // the lane: its x into the mouth, the trains' share in it
uniform vec3 uLeg;          // the leg along the cliff: xy the frame its birds and rafts are laid out in (build: LEGF), z the run's z
uniform vec4 uSlot;         // the slot's west line (build: slotWest): its foot (x: the mouth's west jamb, mirrored, and SLOT_OFF more; z: the jamb's), the line's metres west for a metre out, the metres over which the leg's lane comes in
float wLegD(vec2 xz){ return abs(xz.y-uLeg.z)+uSlot.w*max(uSlot.w+uSlot.x+uSlot.z*(xz.y-uSlot.y)+xz.x, 0.); }
float wOpen(float z){ float d = (z-uHump.x)/max(uHump.z, 1.); return uSea+uHump.y*exp(-d*d); }
float wShore(vec2 xz){ return texture2D(uShoreTex, clamp((xz-uShoreRect.xy)*uShoreRect.zw, 0., 1.)).r*25.5; }
float wApron(vec2 xz){ return length(vec2(xz.x*2.1, max(xz.y-2., 0.))); }      // metres out from the mouth, the sides counted double
float wSeaK(vec2 xz){ return smoothstep(.62, 1.25, wRim(xz))*mix(uSeaKin, 1., smoothstep(38., 66., wApron(xz)))*mix(.5, 1., smoothstep(2., 20., wShore(xz)))*mix(uSeaLane.y, 1., smoothstep(4., 16., min(abs(xz.x-uSeaLane.x-wOff(xz.y)), wLegD(xz)))); }
float wWarp(vec2 xz){ return (wVn(xz*.011+vec2(3., uTime*.006))-.5)*1.6; }
float wSeaY(vec2 xz, float cell){
  float wp = wWarp(xz), y = 0.;
  for(int i = 0; i < 8; i++){ vec4 a = uSw[i];
    float th = a.z*dot(a.xy, xz)-uSwB[i].y*uTime+uSwB[i].x+wp*(i < 4 ? 1. : 2.5);
    y += a.w*(sin(th)-.18*cos(2.*th))*smoothstep(2., 4.5, 6.2832/(a.z*cell)); }      // a train only where the grid's cells (by place) can carry it
  return y;
}
float wSeaTop(vec2 xz, float cell){ return wOpen(xz.y)+wSeaY(xz, cell)*wSeaK(xz)+wBob(xz)*(1.-smoothstep(.68, 1.1, wRim(xz))); }      // (by the rim, the sheet's own bob)
`;
// the sea's grid: y from the law
const SEA_VERT = /* glsl */`
${W_COMMON}
${W_SEA}
attribute float aCell;
varying vec2 vXZ; varying vec3 vWp;
void main(){
  vec2 xz = position.xz;
  vXZ = xz; vWp = vec3(xz.x, wSeaTop(xz, aCell), xz.y);
  gl_Position = projectionMatrix*viewMatrix*vec4(vWp, 1.);
}`;
// its face. THE EYE IS READ HERE THREE WAYS, all of them the water's own optics or the pixel's size: (1) the mirror: Fresnel
// and the sun's glint by the angle of the look; (2) every train, ripple and line of lace is kept only while a pixel can hold
// it (the footprint of a pixel on the water, from the derivatives of the place), what is lost becoming roughness, and lace
// widened to a pixel with its alpha taken down to match; (3) the air between the eye and the water, and the far fade to the sky.
const SEA_FRAG = /* glsl */`
${W_COMMON}
${W_SEA}
uniform vec3 uMirH0, uMirH1, uMirM, uMirZ;      // the kit sky's own clear colours (the horizon's two sides, a third of the way up, high): the far sea's air, and the cap on this sea's white
uniform vec4 uPearl;       // the low ring of cloud: colour, amount (its shadows on the sea)
uniform vec4 uSeaF;        // foam, the swell's height, -, how far the coming swell's crest breaks (the route's)
uniform vec2 uSunXZ; uniform float uBurst; uniform vec3 uJamb;
varying vec2 vXZ; varying vec3 vWp;
// ---- THE PART'S ONE TEXT OF THE SEA LAW (SEA_GLSL, imported: nothing of it is written in this file). What it needs
// besides W_COMMON's uniforms is declared here, every one of them the part's own uniform object:
uniform float uWind, uSeaK; uniform vec3 uSeaBody, uDeep, uBasalt, uSeaZen, uSeaMid, uSeaHor, uSeaScat, uSeaScatDir; uniform vec4 uSeaP, uSeaQ; uniform sampler2D uCaus;
${SEA_GLSL}
void main(){
  float rim = wRim(vXZ), hand = smoothstep(.58, .6, rim);      // the hand-over from the part's sheet (see ONE WATER)
  if(hand < .004) discard;
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
  vec2 fw = max(fwidth(vXZ), vec2(1e-4));
  float sd = wShore(vXZ), k = wSeaK(vXZ), wp = wWarp(vXZ), t = uTime;
  // this sea's own surface (the vertices' law): the trains' height and slopes, each train only while a pixel can hold it
  vec2 slope = vec2(0.); float h = 0., cap = 0.;
  for(int i = 0; i < 8; i++){ vec4 a = uSw[i];
    float th = a.z*dot(a.xy, vXZ)-uSwB[i].y*t+uSwB[i].x+wp*(i < 4 ? 1. : 2.5);
    float f = smoothstep(1.5, 4., 6.2832/(a.z*dot(abs(a.xy), fw))), ka = a.z*a.w*k, s = sin(th);
    slope += a.xy*(ka*(cos(th)+.36*sin(2.*th))*f); h += a.w*(s-.18*cos(2.*th))*f;
    if(i == 4 || i == 5) cap += .5*s*f; }
  // and the swell that carries us in (the hump: a long back along z), its slope
  float hd = (vXZ.y-uHump.x)/max(uHump.z, 1.), hsl = -2.*hd*uHump.y*exp(-hd*hd)/max(uHump.z, 1.);
  // THE LOOK IS THE PART'S LAW, all over this sea. It is handed the water's own height and slopes: where this sea's
  // surface moves, its own (trains and hump: the shading and the vertices agree); by the part's sheet, where this sea
  // still lies flat (the trains come up from nothing past the hand-over), the law's own swell, as the sheet hands it:
  // the two waters wear one look there, and there is no seam
  float own = smoothstep(.62, 1.25, rim);
  vec3 col = seaLook(vXZ, V, seaFw(vXZ), t, mix(seaSwell(vXZ, t), vec3(h*k, slope.x, slope.y+hsl), own));
  // cloud shadows crossing the open sea, by place and time (broad, slow, with the wind); none by the part's sheet
  float cloud = smoothstep(.5, .68, wVn(vXZ*.0045+vec2(t*.031, t*.013))*.65+wVn(vXZ*.011+vec2(-t*.02, t*.027)+5.)*.35)*uPearl.a*1.6*smoothstep(.8, 1.8, rim);
  col *= 1.-.3*cloud;
  // THIS SEA'S OWN WHITE, over the law's lace: small whitecaps on its own trains' crests when it blows, and a surf line
  // where the sea meets rock (by the map of the shore). Lit as the law lights its own white (warm under a low sun),
  // never brighter than the brightest of the sky it lies under, and under 0.8
  float tex = wVn(vXZ*2.6+vec2(0., t*.3))*.6+wVn(vXZ*7.+vec2(t*.2, 0.))*.4, fo = uSeaF.x;
  float pm = wVn(vec2(vXZ.x*.017+t*.004, vXZ.y*.065+t*.02));
  float foam = smoothstep(.72, 1., cap+(tex-.5)*.5)*smoothstep(.3, .6, fo)*k*smoothstep(.45, .7, pm+.2)*(.25+.75*smoothstep(.4, .62, wVn(vec2(vXZ.x*.9, vXZ.y*2.7+t*.5))));      // (a whitecap is torn along its crest, not a white plate)
  float wash = .5+.5*sin(t*.8+vXZ.x*.07+3.*wVn(vXZ*.05)), sn = wVn(vXZ*.45+vec2(t*.15, 0.))*.6+wVn(vXZ*1.3-vec2(0., t*.2))*.4;
  float surf = 1.-smoothstep(-.6, .8, sd-2.4-2.4*wash+(sn-.5)*3.2);
  foam = max(foam, surf*(.75+.25*tex));
  // THE BURST'S FOOT BOILS (the route's clock, by place): where the wave strikes the plinth east of the mouth the sea is
  // beaten white from the strike on: a boil that spreads out from the rock's foot, torn and seething, and dies away
  // (none by the part's sheet: no edge of foam at the hand-over)
  // (order 9: under the plume's foot, 4 m wide, a white boil; from it RINGS OF LACE spread over the sea, a metre and a
  // half a second, torn and ever thinner, to 10 m and gone)
  { float bz = smoothstep(0., .5, uBurst)*(1.-smoothstep(5., 11., uBurst));
    vec2 bc = vXZ-vec2(uJamb.x+2.4, uJamb.z+5.4); float bl = length(bc*vec2(.8, 1.))+(sn-.5)*1.1, R = 2.2+1.5*uBurst;
    float seethe = wVn(vXZ*1.6+vec2(t*1.4, -t*.9))*.55+wVn(vXZ*3.7-vec2(t*1.1, t*1.7))*.45;
    float core = (1.-smoothstep(1.6, 3.4, bl))*(.45+.55*smoothstep(.3, .58, seethe));
    float rings = smoothstep(.2, .75, sin(bl*2.4-uBurst*3.6))*(1.-smoothstep(R-2.5, R, bl))*smoothstep(1.2, 2.8, bl)*smoothstep(.34, .6, seethe)*(1.-.6*smoothstep(3., 10., bl));
    foam = max(foam, bz*max(core, rings)*smoothstep(.62, .8, rim)); }
  vec3 fc = min(uFoamCol*.75*(uSkyCol*.7+uSunCol*(.16+.2*(1.-smoothstep(.2, .55, uSunDir.y))))*(.8+.35*tex), vec3(.78));
  float fcl = dot(fc, vec3(.2126, .7152, .0722)), skl = max(max(dot(uMirH0, vec3(.2126, .7152, .0722)), dot(uMirH1, vec3(.2126, .7152, .0722))), max(dot(uMirM, vec3(.2126, .7152, .0722)), dot(uMirZ, vec3(.2126, .7152, .0722))));
  fc *= min(1., skl/max(fcl, 1e-3));
  col = mix(col, fc, clamp(foam, 0., 1.));
  // THE COMING SWELL'S OWN FACE (the route's: uSeaF.w; this sea's own stroke over the law, far from the hand-over): where
  // its slope turns the water toward a low eye the mirror lets go (Fresnel, by the angle of the look, with the swell's
  // own slope) and the water's dark body shows: a swell coming is a dark hump
  { float nh = clamp((V.y-hsl*V.z)*inversesqrt(1.+hsl*hsl), 0., 1.), F0 = .02+.98*pow(1.-clamp(V.y, 0., 1.), 5.), Fh = .02+.98*pow(1.-nh, 5.);
    col = mix(col, uSeaBody*.7, uSeaF.w*clamp(1.7*(1.-Fh/F0), 0., 1.)*(1.-clamp(foam, 0., 1.))*.85); }
  // THE SWELL THAT COMES FOR THE MOUTH (the route's: uSeaF.w, and the hump standing over 1.2 m): its crest breaks white
  // on the open sea and spills 8 to 14 m down its near face in torn tongues (a low eye sees a swell's crest from below:
  // only what spills down the face shows); gone before the part's sheet takes the water over (no edge of foam at the hand-over)
  { float front = uHump.x-vXZ.y, crest = uSeaF.w*smoothstep(1.2, 2.4, uHump.y)*smoothstep(-2.5, -.5, front)*(1.-smoothstep(8., 14., front+5.*(sn-.5)))*smoothstep(.62, .85, rim);
    // THE LOW SUN LIGHTS IT (the look's sun, by the eye's bearing to it: light, not place): seen against a low sun the
    // thin water of the swell's top lets the sun through, green-gold, in a band under its crest, and the spill on its face
    // is the sun's own gold-white (never over 0.78, never brighter than the brightest of the sky)
    float low = 1.-smoothstep(.2, .55, uSunDir.y), toward = pow(clamp(dot(wNrm2(-V.xz), uSunXZ), 0., 1.), 2.)*low;
    float thin = uSeaF.w*smoothstep(1.2, 2.4, uHump.y)*smoothstep(-6., -1., front)*(1.-smoothstep(3., 16., front))*smoothstep(.62, .85, rim);
    col += uSunCol*vec3(.2, .3, .09)*(.9*thin*toward);
    crest = max(crest, uSeaF.w*smoothstep(1.2, 2.4, uHump.y)*toward*smoothstep(-2.5, -.5, front)*(1.-smoothstep(11., 19., front+7.*(sn-.5)))*smoothstep(.62, .85, rim)*(.55+.45*tex));
    vec3 fw2 = min(uFoamCol*.78*(uSkyCol*.3+uSunCol*.5), vec3(.78)); fw2 *= min(1., skl/max(dot(fw2, vec3(.2126, .7152, .0722)), 1e-3));      // (spray with the sun behind it: the sun's own colour, no brighter than the sky it stands against)
    col = mix(col, mix(fc*.97, fw2*(.85+.3*tex), toward), clamp(crest*1.5, 0., 1.)); }
  // this world's air over it (the part's own law for the open air, on its own uniforms), and the far sea into the horizon's sky
  float fg = 1.-exp(-uAirDen*uAirDen*dist*dist), hf = smoothstep(1500., 3400., dist);
  vec3 hz = mix(uMirH0, uMirH1, pow(clamp(.5+.5*dot(wNrm2(-V.xz), uSunXZ), 0., 1.), 2.));
  gl_FragColor = vec4(mix(col, mix(uAirCol, hz, hf), max(fg, hf)), hand);
}`;

// ---------------------------------------------------------------- bodies: two vertex programs and one fragment program
// FLY: birds on closed courses worked out in the shader from the time alone. Per bird iA, iB, iC:
//   mode 0 a racetrack beside the line: iA = (centre x, half width, far z, near z); mode 1 a level wheel: iA = (centre, radius);
//   iB = (start along the course or phase, speed m/s, height over the sea or the wheel's wobble, mode); iC = (sideways place, flap phase, size, env)
//   TWO TEXTS OF IT (flyVert; order 15): FLY_VERT, as it always was (racetracks, and a great wheel of 35 m of radius
//   and more, are laid out on the brief's line and go east with the S, by place: the mouth's own strings; and every
//   other bird on the wing flies by it), and FLY_VERT_LEG for the leg's own strings (every course of theirs is
//   laid out about the brief's straight leg, x = PX from z 110 northward, and that leg is turned a quarter and
//   laid along the run by the cliff: uLeg.xy, the leg's frame; their wheel flies over the sea whatever its radius).
const flyVert = (leg) => /* glsl */`
${W_COMMON}
attribute vec3 aCol, aW; attribute vec4 iA, iB, iC;      // aW: wing side (-1, 0, 1), the hinge's x, how far out along the wing
uniform vec3 uFlap;                       // radians a second, amplitude, share of the time gliding${leg ? '\nuniform vec3 uLeg;                        // xy: the leg\'s frame (the brief\'s straight leg laid along the run: x = uLeg.x - z, z = uLeg.y + x)' : ''}
varying vec3 vWp, vN, vCol, vLp; varying vec4 vE;
void main(){
  float mode = iB.w, t = uTime, PI = 3.14159265;
  vec3 c, f;
  if(mode < .5){
    float xc = iA.x, w = iA.y, zA = iA.z, zB = iA.w, Ls = zA-zB, Lp = 2.*Ls+2.*PI*w;
    float s = mod(iB.x+iB.y*t, Lp);
    if(s < Ls){ c = vec3(xc+w, 0., zA-s); f = vec3(0., 0., -1.); }
    else if(s < Ls+PI*w){ float th = (s-Ls)/w; c = vec3(xc+w*cos(th), 0., zB-w*sin(th)); f = vec3(-sin(th), 0., -cos(th)); }
    else if(s < 2.*Ls+PI*w){ c = vec3(xc-w, 0., zB+(s-Ls-PI*w)); f = vec3(0., 0., 1.); }
    else { float th = (s-2.*Ls-PI*w)/w; c = vec3(xc-w*cos(th), 0., zA+w*sin(th)); f = vec3(sin(th), 0., cos(th)); }
    c.y = uSea+iB.z+.22*sin(s*.13+iC.y*40.);
    c += vec3(-f.z, 0., f.x)*iC.x;
  } else {
    float th = iB.x+iB.y/iA.w*t;
    c = vec3(iA.x+iA.w*cos(th), iA.y+iB.z*sin(th*2.+iC.y*30.)+${leg ? 'uSea' : 'uSea*step(35., iA.w)'}, iA.z+iA.w*sin(th));      // (a great wheel's height is over the sea)
    f = vec3(-sin(th), .1*cos(th*2.+iC.y*30.), cos(th));
  }
${leg ? "  c.xz = vec2(uLeg.x-c.z, uLeg.y+c.x); f.xz = vec2(-f.z, f.x);      // (the leg's own: laid out about the brief's straight leg and turned a quarter with it to lie along the run, by place)"
    : "  if(mode < .5 || iA.w >= 35.){ f.x += wOffD(c.z)*f.z; c.x += wOff(c.z); }      // lanes beside the line and the great wheel are laid out on the brief's line and go east with the S, by place"}
  f = normalize(f)*sign(iB.y);
  vec3 r = normalize(cross(f, vec3(0., 1., 0.))), up = cross(r, f);
  vec3 p = position, n = normal;
  if(abs(aW.x) > .5){
    float glide = (1.-smoothstep(uFlap.z-.15, uFlap.z+.15, .5+.5*sin(t*.7+iC.y*50.)))*step(.01, uFlap.z);
    float ph = uFlap.y*mix(1., .12, glide)*sin(uFlap.x*t+iC.y*6.2832-.7*aW.z)+.12;
    float d = abs(p.x)-aW.y;
    p.x = aW.x*(aW.y+d*cos(ph)); p.y += d*sin(ph);
    n = normalize(vec3(-aW.x*sin(ph), cos(ph), 0.));
  }
  float roll = mode > .5 ? -.38*sign(iB.y)*(1.-smoothstep(35., 45., iA.w)) : 0.;      // (a wheel banks; a great one, 50 m across and more, is flown level)
  float cr = cos(roll), sr = sin(roll);
  p.xy = vec2(p.x*cr-p.y*sr, p.x*sr+p.y*cr); n.xy = vec2(n.x*cr-n.y*sr, n.x*sr+n.y*cr);
  vec3 P = c+iC.z*(r*p.x+up*p.y+f*p.z);
  vN = normalize(r*n.x+up*n.y+f*n.z); vCol = aCol; vLp = position; vE = vec4(iC.w, iC.y, 0., 0.);
  vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const FLY_VERT = flyVert(false), FLY_VERT_LEG = flyVert(true);
// POSED: bodies that keep a seat (sitting kittiwakes, shags, seals, the shark) or float on the sea (rafts). Per body
//   iA = (seat, heading), iB = (size, phase, env and a quarter of its pitch, how far it lifts its head), iC = (where it dives or patters to, when)
const POSED_VERT = /* glsl */`
${W_COMMON}
${W_SEA}
attribute vec3 aCol, aW; attribute vec4 iA, iB, iC;      // aW: head weight, wing side times weight, place along the body (-1..1)
uniform vec4 uHead;      // lift (keyed to the route), nod amplitude, nod rate, the pivot's z
uniform vec4 uWing;      // rest angle, shake amplitude, shake rate, the hinge's x
uniform vec4 uSwim;      // sideways wave: amplitude, wave number, rate; w: 1 floats on the open sea, 2 rises with the cave's water
uniform vec3 uPiv;       // the head pivot's y, the wing hinge's y, how fast a dive or a patter eases
uniform float uSlide;    // the route's clock for dives and patters (seconds)
varying vec3 vWp, vN, vCol, vLp; varying vec4 vE;
void main(){
  vec3 p = position, n = normal; float ph = iB.y, t = uTime;
  float tau = max(uSlide-iC.w, 0.), go = 1.-exp(-tau*uPiv.z);
  float busy = smoothstep(0., .3, tau)*(1.-smoothstep(2.5, 4., tau));
  float ha = uHead.x*iB.w+uHead.y*sin(t*uHead.z+ph*6.2832)*(.5+.5*sin(t*.31+ph*40.));
  float a = ha*aW.x, ca = cos(a), sa = sin(a);
  vec2 hq = vec2(p.y-uPiv.x, p.z-uHead.w);
  p.y = uPiv.x+hq.x*ca+hq.y*sa; p.z = uHead.w+hq.y*ca-hq.x*sa;
  float side = sign(aW.y), ww = abs(aW.y), raft = step(.5, uSwim.w)*(1.-step(1.5, uSwim.w));
  if(ww > 0.){
    float shake = sin(t*uWing.z+ph*17.)*smoothstep(.55, .9, sin(t*.4+ph*23.));
    float b = (uWing.x+uWing.y*shake)*ww+busy*raft*1.1*sin(t*38.+ph*9.)*ww;
    float dx = abs(p.x)-uWing.w, unf = mix(1., busy, raft);       // a rafting bird's wings are folded away until it patters
    p.x = side*(uWing.w+dx*cos(b)*unf); p.y += dx*sin(b)*unf;
  }
  p.x += uSwim.x*sin(aW.z*uSwim.y-t*uSwim.z+ph)*(.35+.65*(1.-smoothstep(-1., .3, aW.z)));
  float pt = (iB.z-floor(iB.z+.5))*4., cp = cos(pt), sp = sin(pt);      // a draped body's pitch, head up positive (radians; it rides on the env)
  p.yz = vec2(p.y*cp+p.z*sp, p.z*cp-p.y*sp); n.yz = vec2(n.y*cp+n.z*sp, n.z*cp-n.y*sp);
  float cy = cos(iA.w), sy = sin(iA.w), size = iB.x;
  vec3 q = vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy)*size;
  vec3 P = iA.xyz+q+iC.xyz*go;
  if(raft > .5) P.y += wSeaTop(iA.xz+iC.xz*go, 1.5)+.02*sin(t*2.1+ph*30.)+.05*busy;
  else if(uSwim.w > 1.5) P.y = max(iA.y+iC.y*go, wLevel(P.z)+wBob(P.xz)-.1-.45*abs(sp)-1.5*go)+q.y;      // afloat: awash, its back and its head out
  vN = normalize(mat3(modelMatrix)*vec3(n.x*cy+n.z*sy, n.y, -n.x*sy+n.z*cy)); vCol = aCol; vLp = position; vE = vec4(iB.z, ph, 0., 0.);
  vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const BODY_FRAG = /* glsl */`
${W_COMMON}
${W_LIGHT}
uniform vec4 uCoat;      // mottle amount, mottle scale, wet sheen; w: 1 = a shoal seen through the water over it, 0.5 = what of the body hangs under the water takes the water's glow by its depth
varying vec3 vWp, vN, vCol, vLp; varying vec4 vE;
void main(){
  vec3 N = wNrm(vN); if(!gl_FrontFacing) N = -N;
  vec3 V = cameraPosition-vWp; float dist = length(V); V /= max(dist, 1e-4);
  vec3 alb = vCol; float env = vE.x;
  float m = wVn(vLp.xz*uCoat.y+vE.y*37.)*.6+wVn(vLp.zy*uCoat.y*2.3+vE.y*11.)*.4;
  alb *= 1.-uCoat.x*.7*smoothstep(.4, .7, m);
  vec3 col = wLight(vWp, N, alb, env);
  float fr = pow(max(1.-max(dot(N, V), 0.), 0.), 3.);
  vec3 sheen = env < .5 ? uSkyCol*.5 : (env < 1.5 ? uMouthCol*.12*wDay(vWp)+uGlowCol*.03*uGlowAmt : uShaftCol*.3);
  col += sheen*fr*uCoat.z;
  if(env > .5 && env < 1.5){          // a wet coat in the cave: the mouth's cold slot lies on it as a highlight (the low sun's, where the sun comes down the nave), a touch of the water's green on what looks down at it
    vec3 Lm = vec3(1.5, 10., 3.)-vWp; float dm = dot(Lm, Lm); Lm *= inversesqrt(max(dm, 1e-4));
    vec3 Lg = wNrm(vec3(-vWp.x*.5, wLevel(vWp.z)-2.-vWp.y, 2.5));
    float nlm = dot(N, Lm), sI = wSunIn(vWp);
    col += uCoat.z*(uMouthCol*(min(.5, 820./(820.+dm))*(1.-.6*sI)*(step(0., nlm)*pow(max(dot(N, wNrm(Lm+V)), 0.), 24.)*1.1+fr*smoothstep(-.3, .5, nlm)*.5))
      +uSunCol*(sI*step(0., dot(N, uSunDir))*pow(max(dot(N, wNrm(uSunDir+V)), 0.), 24.)*.5)
      +uGlowCol*(uGlowAmt*pow(max(dot(N, wNrm(Lg+V)), 0.), 12.)*.08));
  }
  float al = 1.;
  if(uCoat.w > .5){ float depth = max(wLevel(vWp.z)-vWp.y, 0.); col = mix(col+alb*uGlowCol*.5*uGlowAmt, uGlowCol*.42*uGlowAmt, 1.-exp(-depth*.3)); al = .93; }
  else if(uCoat.w > .25){ float depth = max(wLevel(vWp.z)-vWp.y, 0.); col = mix(col, uGlowCol*.16*uGlowAmt, 1.-exp(-depth*1.6)); }      // (a seal afloat: its body under the surface is veiled by the water over it)
  gl_FragColor = vec4(wAir(min(col, vec3(.95)), vWp, dist, env), al);
}`;

// moon jellies: bells hanging UNDER the cave's surface and seen through it. The part's sheet is the water's whole body (it
// lets nothing under it through), so a bell is drawn after the sheet and wears the water that lies over it itself: the
// deeper a piece of it hangs, the dimmer and the greener (the water's own glow takes it), and the ripples over it make
// it waver. Each beats: the bell draws in and lets go, and it rises a little on each stroke.
const JELLY_VERT = /* glsl */`
${W_COMMON}
attribute vec4 iA, iB;      // iA: x, depth of its crown under the surface, z, radius; iB: phase, drift radius, pulse rate
varying vec3 vQ, vWp; varying float vTop;
void main(){
  float ph = iB.x, t = uTime, beat = fract(t*iB.z*.16+ph), pulse = smoothstep(0., .22, beat)*(1.-smoothstep(.22, .9, beat));      // a quick stroke, a slow letting go
  float low = 1.-smoothstep(-.2, .75, position.y);                                       // the bell's skirt draws in, its crown hardly
  vec3 p = position; p.xz *= 1.-.3*pulse*low; p.y *= 1.+.16*pulse;
  vec2 c = iA.xz+iB.y*vec2(cos(t*.13+ph*9.), sin(t*.11+ph*5.));
  float top = wLevel(c.y)+wBob(c);
  vec3 P = vec3(c.x, top-iA.y-.75*iA.w+.09*pulse, c.y)+p*iA.w;
  P.xz += .035*(1.+iA.y)*vec2(sin(t*2.3+P.z*3.1+ph*20.), cos(t*1.9+P.x*2.7+ph*11.));      // seen through the ripples over it
  vQ = position; vWp = P; vTop = top; gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
}`;
const JELLY_FRAG = /* glsl */`
${W_COMMON}
uniform float uJelly;
varying vec3 vQ, vWp; varying float vTop;
void main(){
  float r = length(vQ.xz);
  vec3 N = wNrm(vec3(vQ.x, vQ.y*1.6+.15, vQ.z)), V = wNrm(cameraPosition-vWp);
  if(dot(N, V) < 0. && vQ.y > .1) discard;      // a bell is seen through its near skin alone: its far skin is not drawn over it (no pale ball)
  vec2 g = abs(vQ.xz)-vec2(.25); float rings = (1.-smoothstep(.03, .075, abs(length(g)-.14)))*smoothstep(.3, .55, vQ.y);      // THE FOUR PALE RINGS in its crown
  float rim = smoothstep(.8, .93, r);                 // ITS RIM: the bell's margin, a pale line
  float edge = pow(max(1.-abs(dot(N, V)), 0.), 1.5);                                         // a bell is a thin skin: it shows most where the look runs along it
  float depth = max(vTop-vWp.y, 0.), dim = exp(-depth*.5), lum = dot(uGlowCol, vec3(.3, .5, .2))*uGlowAmt;
  // A MOON JELLY IS MILK-WHITE: the light on it is the water's glow taken most of the way to its grey, so the bell stays
  // pale in the green water; its four rings violet-white
  vec3 water = uGlowCol*.5*uGlowAmt, lightJ = mix(uGlowCol*uGlowAmt, vec3(lum), .72)*.8+uMouthCol*.1*wDay(vWp)+.16;
  vec3 col = mix(vec3(.86, .9, .96), vec3(.95, .84, 1.)*1.35, rings)*lightJ;
  col = mix(col, vec3(.95, .97, 1.)*lightJ*1.1, rim*(1.-rings)*.7);
  float al = max(max(.56+.2*edge, .95*rings), .7*rim);      // (a filled, milky bell: no hollow ring)
  col = mix(water, col*vec3(.9, 1., .95), dim);                  // dimmed and a little greened by the water over it
  float see = 1.-pow(max(1.-abs(V.y), 0.), 4.);          // at a grazing look the surface mirrors, and hides what is under it
  gl_FragColor = vec4(min(col, vec3(.9)), clamp(al*(.4+.6*dim)*uJelly*see*smoothstep(0., .08, depth), 0., .85));
}`;
// sand eels: a shoal of silver slivers circling under the surface, each flashing as it rolls
const EEL_VERT = /* glsl */`
${W_COMMON}
attribute vec4 iA, iB, iC;  // iA: place in the shoal (x, depth, z), lag; iB: phase, length; iC: the shoal's centre (x, z) and its course's half axes
varying vec2 vQ; varying vec4 vF; varying vec3 vWp;
void main(){
  float t = uTime*.5-iA.w, ph = iB.x;
  vec2 c = iC.xy+iC.zw*vec2(cos(t), sin(t));
  vec2 d = normalize(iC.zw*vec2(-sin(t), cos(t)));
  vec2 o = iA.xz*(1.+.25*sin(uTime*.9+ph*20.));
  vec3 C = vec3(c.x+o.x, 0., c.y+o.y); C.y = wLevel(C.z)-iA.y;
  vec3 dir = normalize(vec3(d.x, .12*sin(uTime*3.+ph*30.), d.y));
  vec3 sd = wNrm(cross(dir, cameraPosition-C));
  vec3 P = C+dir*position.x*iB.y+sd*(position.y*iB.y*.16+.02*sin(position.x*9.+uTime*14.+ph*40.));
  vQ = position.xy; vF = vec4(pow(abs(sin(uTime*5.+ph*50.+C.x*2.)), 6.), 0., 0., 0.); vWp = P;
  gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
}`;
const EEL_FRAG = /* glsl */`
${W_COMMON}
uniform float uJelly;
varying vec2 vQ; varying vec4 vF; varying vec3 vWp;
void main(){
  float depth = max(wLevel(vWp.z)-vWp.y, 0.);
  float al = (1.-abs(vQ.y)*2.)*(1.-4.*vQ.x*vQ.x)*(.4+.6*vF.x)*exp(-depth*.25)*uJelly;
  vec3 col = vec3(.75, .9, .85)*(uGlowCol*.4*uGlowAmt+.3+uMouthCol*.25*wDay(vWp))*(1.+2.*vF.x);
  gl_FragColor = vec4(min(col, vec3(1.2)), clamp(al, 0., .9));
}`;
// ribbons: kelp fronds, broad blades a hand and more wide. A frond leaves its root and bends over into the water's
// surface in one smooth curve (no corner: its height nears the surface as 1 - exp(-s/depth)); or hangs from its root the
// same way when the water has gone. Along the surface it lies just under the water and dips deeper here and there, so
// that half of it shows through the water and is dimmed and greened by it; it swings about its own heading with the
// surge. Its whole sweep is known at build, where it is kept clear of the flown line. BY THE PIXEL'S FOOTPRINT: where a
// blade's width as the eye sees it falls from 2.4 pixels to 1 it fades out; under one pixel it is not drawn (no line thinner than a frond).
const RIBBON_VERT = /* glsl */`
${W_COMMON}
${W_SEA}
attribute vec4 iA, iB;      // iA: root, length; iB: heading (x, z), phase, width
uniform float uFlow, uResY;
varying vec3 vWp, vSd; varying vec4 vK; varying float vA, vTop;
void main(){
  float t = position.y, ph = iB.z, wd = iB.w, L = iA.w, s = t*L;
  vec3 root = iA.xyz; vec2 b = iB.xy;
  float inC = 1.-step(8., root.z);
  float W = mix(wLevel(root.z)+wBob(root.xz), wSeaTop(root.xz, 1.5), smoothstep(.6, .75, wRim(root.xz))*step(0., root.z));      // the part's sheet, or the open sea beyond it
  float D = W-.05-root.y, aD = max(abs(D), .3), e = exp(-s/aD);
  float flow = mix(sin(uTime*.45+root.x*.03), uFlow, inC)+.2*sin(uTime*.8+ph*6.);
  float fl = clamp(flow, -1., 1.), an = .1*sin(uTime*.6+ph*11.+s)+(fract(ph*7.)-.5)*1.1*t*t;      // (each frond curves its own way toward its tip: it stays within its own length of its root)
  vec2 F = wNrm2(b*(1.-.8*abs(fl))+vec2(.2*sin(ph*40.), -fl)*abs(fl)+b*.001);      // the surge lays every frond over its way
  F = vec2(F.x*cos(an)-F.y*sin(an), F.x*sin(an)+F.y*cos(an));
  float lie = 1.-e;      // 0 at the root, 1 where it lies in the surface
  vec3 P = root+vec3(0., D*lie, 0.)+vec3(F.x, 0., F.y)*(s-aD*lie*.85);
  P.y += (.03*sin(uTime*1.3+s*2.+ph*9.)-.17*(.5+.5*sin(s*1.9+ph*20.+uTime*.3)))*lie*lie;      // it dips under the water along its length
  vec3 Vd = cameraPosition-P; float dist = length(Vd), px = dist*2./(projectionMatrix[1][1]*uResY); Vd /= max(dist, 1e-3);
  // a strap: a narrow stalk from the root, its full width from a fifth of its length on, a round tip; its edge a little waved
  float w0 = wd*(.3+.7*smoothstep(0., .22, t))*sqrt(max(1.-pow(max((t-.8)*5., 0.), 2.), 0.))*(1.+.14*sin(s*4.3+ph*30.));
  vec3 sdv = vec3(-F.y, 0., F.x);
  P += sdv*position.x*w0;
  // BY THE PIXEL'S FOOTPRINT: the blade's width as the eye sees it (a blade lying across a low look shows edge-on, as a
  // line): from 2.4 pixels down to 1 the blade fades out; under one pixel it is not drawn. No line thinner than a frond
  vA = smoothstep(1., 2.4, wd*sqrt(max(1.-pow(dot(sdv, Vd), 2.), 0.))/px); vK = vec4(t, position.x, 0., 1.-step(1., root.z)); vWp = P; vSd = vec3(-F.y, 0., F.x); vTop = W;
  gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
}`;
const RIBBON_FRAG = /* glsl */`
${W_COMMON}
${W_LIGHT}
uniform vec3 uKelpA, uKelpB;
varying vec3 vWp, vSd; varying vec4 vK; varying float vA, vTop;
void main(){
  float t = vK.x, env = vK.w, x = abs(vK.y)*2.;      // x: 0 on the midrib, 1 at the edge
  float mot = wVn(vec2(t*7., vWp.x*2.3+vWp.z*1.7));
  vec3 alb = mix(uKelpA, uKelpB, clamp(.25+.5*smoothstep(.1, .9, t)+.5*(mot-.5), 0., 1.));      // olive brown, mottled, a little lighter toward the tip
  alb *= (1.-.5*(1.-smoothstep(.04, .2, x)))*(1.-.35*smoothstep(.55, .95, x));      // a darker midrib and edge
  alb *= mix(.4, 1., env);      // (in the open day a frond on the sea is dark olive: it lies in the water's own film)
  vec3 N = wNrm(vec3(0., 1., 0.)+vSd*(vK.y*1.4));      // a blade is curved across: it falls away either side of the midrib
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  float depth = max(vTop-vWp.y, 0.), dry = 1.-smoothstep(0., .04, depth), wet = exp(-depth*4.);
  vec3 col = wLight(vWp, N, alb, env);
  // (a blade holds its own olive under a warm sun: its wet body gives back more of its own colour than of the light's)
  col = mix(col, alb*(dot(col, vec3(.3, .5, .2))/max(dot(alb, vec3(.3, .5, .2)), 1e-4)), .6);
  // UNDER THE WATER it is dimmed by the water over it and greened by the water's own glow, which comes up through the
  // thin blade as its own olive (the glow's strength, hardly its hue: no lime)
  vec3 gl = (vec3(dot(uGlowCol, vec3(.3, .5, .2)))*.8+uGlowCol*.2)*uGlowAmt*step(.5, env);
  col = mix(col*wet+alb*gl*(1.-wet)*.9, col, dry);
  // a wet gloss where it lies in the air: the mouth's cold slot inside, the sun outside (soft: a wet blade, not a wire)
  vec3 Lm = vec3(1.5, 10., 3.)-vWp; float dm = dot(Lm, Lm);
  col += dry*(step(.5, env)*uMouthCol*(min(.5, 820./(820.+dm))*pow(max(dot(N, wNrm(wNrm(Lm)+V)), 0.), 24.)*.16)
    +(1.-step(.5, env))*uSunCol*(pow(max(dot(N, wNrm(uSunDir+V)), 0.), 40.)*.05));
  float see = 1.-pow(max(1.-abs(cameraPosition.y-vWp.y)/max(dist, 1e-3), 0.), 2.5);             // at a grazing look the water's surface mirrors, and hides what is under it
  float edge = 1.-smoothstep(.45+.2*mot, 1., x);      // a soft, uneven edge
  gl_FragColor = vec4(wAir(col, vWp, dist, env), vA*edge*mix(exp(-depth*1.5)*see, 1., dry)*.95);
}`;
// puffs: soft noise-eroded sprites, quads in the view's plane (they face the lens: a puff has no side). mode 0 mist (drifts
// about its place), 2 the veil off the top of the face at the back wall, 3 the fountain round the lip, 4 spume off the plinth (2 to 4 loop on the time),
// 5 THE BURST'S BODY (thrown once, on the route's clock: pieces drawn out along their motion; iC.w 6 its core and head,
// 5.5 its veil, 7 the boil at its foot), 6 the flood's spray off a wall's foot (loops on the time; shows by the route's
// flood and where the swell has come to), 7 THE BOIL UNDER THE SHAFT (order 10: thrown water where the shaft's water
// lands round the blowhole's foot, pieces as the burst's; loops on the time, shows by the route's announce), 8 the wet
// on the pipes behind the burst.
// Every puff is soft where it meets the water: it fades over the half metre above the water's own height at its place.
const PUFF_VERT = /* glsl */`
${W_COMMON}
${W_LIGHT}
attribute vec4 iA, iB, iC;      // iA: start, size; iB: velocity, period (mode 5: drift x, the height it climbs to, drift z, when it is thrown); iC: mode, seed, opacity, gravity
uniform vec4 uGain; uniform vec2 uFlood; uniform float uBurst; uniform vec3 uJamb;
varying vec2 vQ, vB; varying vec4 vS; varying vec3 vC, vW, vCs, vSv, vK;      // vB: the burst alone: how far its body faces the sun at the piece's place; how far the piece has fallen (0 standing, 1 down); vK: how far its grain has run, its kind (0 core, 1 veil, 2 the boil at its foot), its lean
void main(){
  float mode = iC.x, seed = iC.y, a = iC.z, size = iA.w; vec3 P = iA.xyz, Lp; vB = vec2(1., 0.); vK = vec3(0.);
  if(mode < .5){ P += vec3(sin(uTime*.11+seed*20.)*1.2, wLevel(P.z)+sin(uTime*.07+seed*40.)*.25, cos(uTime*.09+seed*30.)); a *= uGain.x; }      // spray low at the mouth's sill: its height is over the water
  else if(mode > 4.5 && mode < 5.5){          // the burst's body, once: thrown up the jamb (fast, slowing to its height), standing there while the wave still drives it, then falling as a curtain
    float tau = uBurst-iB.w, on = step(0., tau), th = 3.3+.5*seed, tf = sqrt(2.*max(iB.y, .2)/iC.w); tau = max(tau, 0.);      // (th: how long it holds)
    float fall = max(tau-th, 0.);
    P += vec3(iB.x*tau, iB.y*(1.-exp(-1.7*tau))+.25*sin(tau*1.9+seed*40.)*smoothstep(.8, 1.6, tau)-.5*iC.w*fall*fall, iB.z*tau); size *= 1.+.1*tau;
    a *= on*smoothstep(0., .18, tau)*(1.-smoothstep(th+.8*tf, th+1.05*tf, tau));
    // THE BURST HAS A FORM, by place: a body that stands round the jamb's corner. Its face toward the look's sun is lit, its
    // flanks and what stands back against the rock lie in the shade of the rest
    vec3 Nb = wNrm(vec3((P.x-uJamb.x-2.2-.1*(P.y-uJamb.y))*.5, .3+.04*(P.y-uJamb.y), (P.z-uJamb.z-1.)*.3+.4));
    vB = vec2(clamp(dot(Nb, uSunDir)*1.5-.22, 0., 1.)*(.4+.6*fract(seed*7.3)), clamp(fall/tf, 0., 1.));      // (piece by piece it stands more or less in the sun: bright strands over blue-grey ones)
    // (its grain runs up through a piece while it rises and stands, the faster the faster it goes, and down it as it falls)
    vK = vec3(1.6*(1.-exp(-1.7*tau))*iB.y*.25+.5*tau+1.2*fall*fall, iC.w > 6.5 ? 2. : (iC.w < 5.75 ? 1. : 0.), clamp(iB.x*.8, -.5, .5));
  } else if(mode > 7.5){          // the wet on the pipes behind the burst: it comes up the rock with the water, and stays
    float tau = uBurst-iB.w; a *= smoothstep(0., .9, tau)*(1.-.5*smoothstep(9., 22., tau));
  } else {
    float T = iB.w, tau = fract(uTime/T+seed)*T; bool boil = mode > 6.5;
    P += iB.xyz*tau-vec3(0., .5*iC.w*tau*tau, 0.); size *= 1.+(boil ? .12 : .5)*tau;
    if(mode < 2.5) P.y += wLevel(iA.z)+iA.y*(uGain.y-1.);      // the face's veil rises off its top, as high as it stands now
    else if(mode > 5.5) P.y += wLevel(iA.z);     // the flood's spray, and the boil under the shaft, leave the water as it stands there now
    float g = mode < 2.5 ? uGain.y : (mode < 3.5 ? uGain.z : (mode < 4.5 ? uGain.w : (mode < 6.5 ? uFlood.x*smoothstep(-16., -6., iA.z-uHump.x) : uFlood.y)));
    a *= g*smoothstep(0., .2, tau)*(1.-smoothstep(.65*T, T, tau));
    if(boil){
      // THE BOIL UNDER THE SHAFT is thrown water as the burst's is (the same pieces, drawn out along their motion): each
      // is thrown up off the water and comes down again (its own gravity: heavy water low, fine spray held by the air),
      // over and over. THE HEAP DROWNS IT: as the pile climbs the back wall (the route's pile, uGain.y) the boil goes
      // down and the face of white water stands where it was; it is gone before the pile is full.
      // BY PLACE it stands in the blowhole's daylight or out of it: how near the blowhole's axis it is
      a *= 1.-smoothstep(.35, 1., uGain.y);
      float up = iB.y-iC.w*tau, ta = iB.y/iC.w; vec3 q = P-vec3(0., 3., -81.), axd = vec3(0., .92718, -.37461);
      vB = vec2((1.-smoothstep(4.5, 9., length(q-axd*dot(q, axd))))*(.7+.3*fract(seed*7.3)), clamp((tau-ta)/max(T-ta, .05), 0., 1.));
      vK = vec3(.45*(iB.y*tau-.5*iC.w*tau*tau)+.6*tau, iC.w > 6. ? 3. : 4., clamp(iB.x/max(abs(up), 1.5), -.5, .5));      // (kind 3 its heavy water, 4 its fine spray)
    }
  }
  Lp = mode > 4.5 && mode < 5.5 ? vec3(P.x, P.y, 9.) : P;      // (the burst stands outside, in the open sky's light: no share of the cave's)
  vec4 mv = viewMatrix*vec4(P, 1.); float dist = length(mv.xyz);
  // (spray falling is drawn out down its fall; the wet on the pipes down the pipes; a piece of the burst's water up its
  // throw, and further as it falls: its mist stays round)
  // (THE BURST: every piece is DRAWN OUT ALONG ITS MOTION, 3.6 times as long as wide while it rises and stands, 4.5 as
  // it falls, and leaning with its own drift; the boil at its foot 1.8)
  float tall = mode > 7.5 ? 2.4 : (mode > 6.5 ? (vK.y < 3.5 ? 1.5 : 3.4+.6*vB.y) : (mode > 4.5 && mode < 5.5 ? (vK.y > 1.5 ? 1.8 : 3.6+.9*vB.y) : 1.)), sx = position.x+position.y*tall*vK.z;
  mv.xy += vec2(sx, position.y*tall)*size*step(.003, a);
  vW = P+(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0])*sx+vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1])*position.y*tall)*size;
  vQ = position.xy; vS = vec4(seed, a, mode, 0.); vC = wAir(min(wFoamLight(Lp)*(mode > .5 ? 1.35 : 1.), vec3(.8)), P, dist, 0.); vCs = vC;
  // THE FOUNTAIN ROUND THE LIP stands in the open over the headland: its sunward side in the sun's own colour (warm
  // white under a low sun), its shade the sky's: two lights to each puff, laid in the fragment by the puff's roundness
  if(mode > 2.5 && mode < 3.5){ vC = wAir(min(uFoamCol*.78*(uSkyCol*.95+uSunCol*.06), vec3(.8)), P, dist, 0.); vCs = wAir(min(uFoamCol*.78*(uSkyCol*.6+uSunCol*.46), vec3(.8)), P, dist, 0.); }
  // THE BURST IS WHITE WATER, WHITER AND COOLER THAN THE SUNLIT ROCK: where the sun strikes it near-white (the sun's
  // light taken three quarters of the way to its own grey: never cream, never the rock's tone; under 0.8), in its own
  // shade and where it thins the sky's blue-grey
  if(mode > 4.5 && mode < 5.5){
    vec3 sunW = mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .75), Fw = uFoamCol*.78, sh = Fw*(uSkyCol*1.5+sunW*.14);
    vec3 lt = min(max(Fw*(uSkyCol*.7+sunW*.68), sh*1.35), vec3(.8)); float gl = dot(lt, vec3(.3, .5, .2)), gs = dot(sh, vec3(.3, .5, .2));
    sh *= min(1., .62*gl/max(gs, .001));      // (its own shade is never nearer its light than 0.62 of it: under an overcast sky too it has ropes of light and shade)
    vC = wAir(min(sh, vec3(.6)), P, dist, 0.); vCs = wAir(lt, P, dist, 0.); }
  // THE BOIL UNDER THE SHAFT takes the blowhole's daylight: near-white where the shaft's light falls on it (the
  // fragment lays it by vB.x, the piece's place, and by its ropes), blue-grey in its own shade: never over 0.8
  if(mode > 6.5 && mode < 7.5){
    vec3 lt = min(uFoamCol*.78*uShaftCol*1.05, vec3(.8));
    vC = wAir(lt*vec3(.46, .52, .58), P, dist, 0.); vCs = wAir(lt, P, dist, 0.); }
  if(mode > 7.5){ vC = wAir(vec3(.045, .04, .036)*(uSkyCol*1.1+uSunCol*.35), P, dist, 0.); vCs = vC; }      // wet basalt: dark
  vSv = mat3(viewMatrix)*uSunDir;
  gl_Position = projectionMatrix*mv;
}`;
const PUFF_FRAG = /* glsl */`
${W_COMMON}
uniform float uBurst; uniform vec3 uJamb;
varying vec2 vQ, vB; varying vec4 vS; varying vec3 vC, vW, vCs, vSv, vK;
void main(){
  float r = length(vQ), sunB = -1.; if(vS.y < .003 || r > 1.) discard;
  float n = wVn(vQ*2.2+vS.x*17.+uTime*.2)*.6+wVn(vQ*5.1+vS.x*31.-uTime*.3)*.4;
  float body = step(4.5, vS.z)*(1.-step(5.5, vS.z))+step(6.5, vS.z)*(1.-step(7.5, vS.z)), fine = step(6.5, vS.z), stain = step(7.5, vS.z);      // (body: the burst's pieces, and the boil's under the shaft)
  float e0 = vS.z > .5 ? mix(.42, .2, fine) : .2;            // white water is broken; mist is whole
  float al = vS.y*(1.-smoothstep(.3, 1., r))*smoothstep(e0, e0+.3, n+(1.-r)*.5);
  // thrown water is not smoke: it is drawn out into fibres along its way (up and down), light and grey by turns
  float fb = wVn(vec2(vQ.x*6.5+vS.x*29., vQ.y*1.1+vS.x*7.-uTime*1.3))*.6+wVn(vec2(vQ.x*15.+vS.x*13., vQ.y*2.3-uTime*2.2))*.4;
  if(body > .5){
    // THE BURST IS THROWN WATER (order 9): no round tuft anywhere. Every piece is a long torn streak in its own frame:
    // a HEAD that leads (the upper end while it rises and stands, the lower as it falls), widest just behind it, and a
    // TAIL that frays into threads and dies; its sides feathered by its own noise, its grain drawn out along its
    // length (cells some twenty times longer than wide) and RUNNING through it from tail to head. A piece of the core
    // is whole behind its head; a piece of the veil is threads with air between; all of it is torn further as it falls
    float sd = vS.x, fl = smoothstep(0., .22, vB.y), veil = step(.5, vK.y)*(1.-step(1.5, vK.y))+step(3.5, vK.y);      // (threads with air between: the burst's veil, the fine spray of the boil under the shaft)
    float h = vQ.y*(1.-2.*fl), bend = (wVn(vec2(sd*7., h*1.1+sd*3.))-.5)*.5, u = vQ.x+bend*(1.-.5*h);
    float wdt = mix(.44, .62, step(2.5, vK.y)*(1.-step(3.5, vK.y)))*(1.-smoothstep(.4, 1., h))*(.28+.72*smoothstep(-1., -.05, h));      // (the heavy water of the boil under the shaft is broader for its length)
    float f1 = wVn(vec2(u*4.5+sd*29., h*1.2-vK.x+sd*5.)), f2 = wVn(vec2(u*10.+sd*13., h*2.6-vK.x*1.8+sd*9.));
    fb = f1*.6+f2*.4;
    // (ITS OUTLINE IS FEATHERED AND BROKEN at the piece's own scale: a slow noise three cells across the piece
    // cuts deep into its sides and lets tongues of it out; it dies well inside its quad: no round rim anywhere)
    float fe = wVn(vec2(u*1.7+sd*17., h*.8-vK.x*.45+sd*3.));
    float ex = abs(u)/max(wdt, .001), edge = (1.-smoothstep(.3, 1., ex+(fe-.5)*1.3+(f2-.5)*.5))*(1.-smoothstep(.8, 1., r));
    float tear = mix(.3, .5, veil)+.24*(1.-smoothstep(-1., .25, h))+.3*vB.y;
    float dens = smoothstep(tear, tear+.2, fb+.3*(1.-ex)*(1.-.7*vB.y));
    al = vS.y*edge*dens*smoothstep(-1., -.6, h);
    // (its light: its thick strands stand out into the sun, near-white; between them, and where it thins, it is its
    // own blue-grey shade; a fine grain of drops down every strand)
    float f3 = wVn(vec2(u*23.+sd*41., h*3.4-vK.x*2.4));
    // (ROPES OF WATER, by place: the plume is thick in ropes half a metre wide and several long that fan from its foot
    // and run up with it, then down; between them it is thinner and lies in its own shade)
    float hy = vW.y-uJamb.y, xs = (vW.x-uJamb.x-2.2-.1*hy)/(1.+.05*hy), run = 4.*(1.-exp(-1.1*uBurst))+.5*uBurst-1.5*pow(max(uBurst-3.6, 0.), 2.);
    if(vK.y > 2.5){ hy = vW.y; xs = vW.x+.5*vW.z; run = uTime*1.6; }      // (the boil under the shaft: its ropes by its own place, climbing on the time)
    float rope = wVn(vec2(xs*2.3, (hy-run)*.28))*.65+wVn(vec2(xs*5.3+7., (hy-run)*.6+3.))*.35;
    // (the veil is thin between its ropes; and AS IT FALLS THE WHOLE CURTAIN COMES APART INTO ITS ROPES, downward
    // threads with air between them)
    al *= 1.-max(.45*veil, .85*smoothstep(.08, .55, vB.y))*(1.-smoothstep(.32, .58, rope));
    sunB = vB.x*smoothstep(.02, .5, edge*dens)*(.2+.8*smoothstep(.34, .66, fb))*(.8+.2*f3)*mix(.1, 1., smoothstep(.4, .66, rope));
  } else {
    if(stain > .5){ float xT = vW.x+.5*vW.z; fb = wVn(vec2(xT*2.6, vW.y*.11))*.6+wVn(vec2(xT*7.+3., vW.y*.3))*.4; }      // (the wet lies down the pipes, by place: it does not move)
    al *= mix(1., .5+.5*smoothstep(.3, .62, fb), .6*fine);
  }
  al *= smoothstep(0., .5, vW.y-wLevel(vW.z)-wBob(vW.xz));      // soft where it meets the water, by the water's own height at its place
  // a puff is round: its face toward the sun takes the sun's light, the rest the sky's (the burst alone has the two)
  // (its thick fibres stand out into the sun, its thin ones lie back in the shade of the rest)
  float sunny = sunB >= 0. ? sunB : smoothstep(.1, .85, dot(wNrm(vec3(vQ*.85, sqrt(max(1.-r*r, 0.))+.3)), vSv));
  gl_FragColor = vec4(mix(vC, vCs, sunny)*mix(.78+.22*n, .9+.1*smoothstep(.3, .7, fb), body), al);      // (never over its light: under 0.8)
}`;
// streaks: quads drawn along their own way and turned about it to face the eye (a streak has no flat side); never
// narrower than a pixel and a half, the alpha taken down by as much as the width was put up. Modes:
//   0 WHAT FALLS IN THE CHIMNEY as the lens goes up (order 10): fine drops and short threads of beads near the wall,
//     each falling from its own top (measured in build against the portal's outline) to the bell, over and over
//   1 a roof drip: a drop a hand to a forearm long, a faint grey glint, that falls from the roof's rock and lands where and when the part's sheet opens a ring
//     (the part's own cells and clock: its hash is this file's)
//   2 thrown water, ballistic on the route's clock (the jamb's burst, a seal's splash): as long as it is fast, a hand wide
//     at most as it falls (a rising sheet may be 0.3 m), gone where it meets the water again
//   (3 was a broad soft shaft of spray-filled light in the blowhole: out since order 10, its law with it)
//   4 drops thrown off the top of the face at the back wall (as 2, looping on the time)
//   5 THE FACE: a sheet of white water standing on the heap against the back wall, as high as the pile has grown, torn
//     toward its top, its fibres climbing
//   6 SOFT FOAM WHERE WATER MEETS ROCK, lying flat on the water: standing in a stump's lee or at a wall's foot with the
//     foam running through it (by the route's flood, from 16 m before the swell's crest back). (None runs with the
//     water any more: order 9)
//   9 SPRAY FALLING IN THE BELL: a drop or short thread on its own straight fall to the water (by the announce)
//   7 THE FLOOD POURING OFF A STUMP of the pavement: torn sheets falling from its rim to the water (loops on the time; by
//     the route's flood, where the swell has come to, and only while the stump's top stands out of the water)
//   8 A PATTERING BIRD'S MARK ON THE SEA, lit from its own moment of the route's clock and faded by its own age.
//     The mouth's raft: five dashes where each bird ran, white patches lying on the sea (every corner on the sea's
//     own drawn surface at its place and moment), as they were. The leg's raft (iC.w 1; order 20): ONE SPLASH FOR
//     EACH STRIKE of a bird on the water, STANDING on the sea where the bird struck: thrown water, no wider than
//     the bird is long and lower than that, up in a tenth of a second and sunk back as it fades (main; build)
const STREAK_VERT = /* glsl */`
${W_COMMON}
${W_LIGHT}
${W_SEA}
attribute vec4 iA, iB, iC;      // mode 0: iA offset from the axis, w its top; iB start, speed (down: under zero), length, width; iC mode, seed, alpha
                                // mode 1: iA the part's ring cell (x, z) and the roof's height (y); modes 2, 4: iA start, launch delay or period; iB velocity, width; iC mode, seed, alpha, gravity
                                // mode 5: iA foot (x, z); iB -, -, height, width; mode 6: iA x, sway, start z, run; iB speed, start, length, width; iC.w 1: on the flood
                                // mode 7: as 4, from a place of its own; mode 8: iA x, z, when, how long it lasts; iB its way (x, z), length, width (iC.w 1, a splash that stands: iB its throw, its height, its width)
uniform float uSpout, uResY, uBurst; uniform vec4 uGain; uniform vec2 uFlood;
varying vec2 vQ; varying vec3 vC; varying vec4 vF, vP;      // vF: alpha, how far it is torn into fibres (the face: its height; a raft: its length), seed, kind (0 streak, 2 the face, 3 a raft of foam); vP: the place, and how far a standing raft's foam has run through it
// THE SEA AS ITS GRID DRAWS IT near the line (1.5 m cells from x -30 to 30 and z -3 to 117, and west of x -30 in
// the leg's own block of 1.5 m cells on the same lines: seaGrid, fine; each cell split from its east corner at the
// lower z to its west corner at the higher): the law at the cell's corners, laid flat across each triangle. A
// wake's dash lies on this, every one of its corners at its own place; a strike's splash stands on it.
float wSeaDrawn(vec2 xz){
  vec2 g = floor(xz/1.5)*1.5, f = (xz-g)/1.5;
  float yb = wSeaTop(g+vec2(1.5, 0.), 1.5), yd = wSeaTop(g+vec2(0., 1.5), 1.5);
  if(f.x+f.y <= 1.){ float ya = wSeaTop(g, 1.5); return ya+f.x*(yb-ya)+f.y*(yd-ya); }
  float ye = wSeaTop(g+vec2(1.5), 1.5); return ye+(1.-f.x)*(yd-ye)+(1.-f.y)*(yb-ye);
}
// THE CHIMNEY'S WATER TAKES THE LOOK'S LIGHT, by its height up the axis (s, metres from the spout's foot): green-lit from
// below near the bell (the water's own glow), the shaft's blue-white in its middle, and toward the lip the open sky and
// the sun (warm white under a low sun)
vec3 wChim(float s){
  float lipK = smoothstep(14., 48., s), bellK = 1.-smoothstep(3., 26., s);
  vec3 gw = mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3, .5, .2))), .2);
  return min(uFoamCol*.78*(uShaftCol*.42*(1.-.65*lipK)+(uSkyCol*.7+uSunCol*(.16+.3*(1.-smoothstep(.2, .55, uSunDir.y))))*.96*lipK+gw*(uGlowAmt*.6*bellK)), vec3(.8)); }
void main(){
  float mode = iC.x, seed = iC.y, a, len = iB.z, wd = iB.w, fib = 0., kind = 0., shift = 0.; vec3 C, ax; vec3 lit = vec3(-1.);
  if(mode < .5){
    float s = 2.+mod(iB.x+iB.y*uTime, iA.w-2.);      // (it falls, iB.y under zero, from its own top to 2 m over the spout's foot, again and again)
    ax = vec3(0., .92718, -.37461);
    C = vec3(0., 3., -81.)+ax*s+iA.xyz;
    a = iC.z*min(uSpout*${(1 / SPOUT).toFixed(3)}, 1.)*smoothstep(2., 4., s)*(1.-smoothstep(iA.w-2., iA.w, s));
    shift = step(.4, len);       // (a thread is beads and short dashes down its length; a drop is whole)
    lit = wChim(s);
  } else if(mode < 1.5){
    vec2 ci = iA.xz; float hc = wH21(ci), rate = .22+.2*hc, ph = fract(uTime*rate+hc*7.);
    vec2 c = (ci+vec2(.3+.4*wH21(ci+3.1), .3+.4*wH21(ci+7.7)))*2.7;
    float lv = wLevel(c.y), h = max(iA.y-lv, .5), T = sqrt(2.*h/9.81), tau = T-(1.-ph)/rate;      // it lands as the ring opens
    ax = vec3(0., -1., 0.);
    len = clamp(.12+.02*9.81*max(tau, 0.), .12, .35);       // a drop, drawn out a little by its fall: a hand to a forearm long
    C = vec3(c.x, max(iA.y-4.905*tau*tau, lv+.5*len), c.y);
    a = iC.z*step(0., tau);
    vec3 L = min(wFoamLight(C), vec3(.8)); lit = mix(vec3(dot(L, vec3(.3, .5, .2))), L, .35)*.6;      // a faint glint of the light it falls through, near its grey (no bright coloured line)
  } else if(mode < 2.5 || (mode > 3.5 && mode < 4.5) || (mode > 6.5 && mode < 7.5) || mode > 8.5){
    bool loop = mode > 3.5, pour = mode > 6.5 && mode < 7.5, rain = mode > 8.5;
    float tau = loop ? fract(uTime/iA.w+seed)*iA.w : uBurst-iA.w, on = step(0., tau); tau = max(tau, 0.);
    vec3 vel = iB.xyz-vec3(0., iC.w*tau, 0.); float sp = length(vel);
    C = iA.xyz+iB.xyz*tau-vec3(0., .5*iC.w*tau*tau, 0.);
    if(loop && !pour && !rain) C.y += wLevel(iA.z)+iA.y*(uGain.y-1.);       // the face's drops leave its top, as high as it stands now
    ax = normalize(vel+vec3(0., vel.y < 0. ? -2.5 : 2.5, 0.));           // it stands upright where it hangs
    float fall = smoothstep(0., 3., -vel.y);
    wd = min(iB.w*(1.+.3*tau), pour ? .9 : .3); if(!pour) wd = mix(wd, min(wd, .09), fall);      // falling, a sheet is torn into ropes a hand wide (a stump's pour stays a sheet: it falls a metre or two)
    len = max(wd*5., sp*.13*(1.+1.5*min(iB.w, 1.))); len = mix(len, min(len, 1.1), fall);       // and the rope breaks: no falling piece is longer than 1.1 m
    if(pour) len = .5+.16*sp;
    float wet = smoothstep(-.25, .35, C.y-wLevel(C.z)-.5*len*max(-ax.y, 0.));          // gone where it meets the water again
    a = iC.z*on*smoothstep(0., .1, tau)*(rain ? wet*uFlood.y*(1.-smoothstep(.85*iA.w, iA.w, tau)) : pour ? wet*uFlood.x*smoothstep(-16., -6., iA.z-uHump.x)*smoothstep(0., .3, iA.y-wLevel(iA.z))*(1.-smoothstep(.75*iA.w, iA.w, tau))
      : (loop ? uGain.y*(1.-smoothstep(.7*iA.w, iA.w, tau)) : wet));
    fib = max(smoothstep(.15, .4, iB.w), .7*fall);
    if(!loop) shift = 1.;        // (thrown once: a thin jet of it is broken into beads down its length, in the fragment: no ruled line)
    if(rain) lit = wChim(dot(C-vec3(0., 3., -81.), vec3(0., .92718, -.37461)))*.95;      // (spray falling in the bell takes the chimney's light, by its height)
    if(!loop && iA.z > 0.) lit = min(uFoamCol*.78*(uSkyCol*.7+mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .75)*.68), vec3(.8));      // (thrown water outside the mouth stands in the open sky and sun: no share of the cave's; near-white where the sun strikes it, as the burst's body: drops that catch the light)
  } else if(mode > 7.5){
    float tau = uBurst-iA.z;
    ax = normalize(vec3(iB.x, 0., iB.y)); C = vec3(iA.x, wSeaTop(iA.xy, 1.5)+.04, iA.y);
    a = iC.z*step(0., tau)*smoothstep(0., .2, tau)*(1.-smoothstep(.35*iA.w, iA.w, tau)); fib = .8;
    lit = wFoamLight(vec3(C.x, C.y, 9.))*.9;
  } else if(mode < 5.5){
    float g = uGain.y, base = wLevel(iA.z)-.4;
    len = iB.z*g*(.82+.18*sin(uTime*1.9+seed*40.))+.4;
    ax = vec3(0., 1., 0.); C = vec3(iA.x, base+.5*len, iA.z);
    a = iC.z*smoothstep(.06, .4, g); fib = len; kind = 2.;
  } else {
    // A RAFT OF FOAM stands where the water tears on rock, in a stump's lee or at a wall's foot, and its foam runs
    // through it (iC.w 2; the law for one that runs north with the water, iC.w 0 or 1, is kept: none is dealt)
    bool stand = iC.w > 1.5;
    float run = stand ? iB.y : mod(iB.x*uTime+iB.y, iA.w), z = iA.z-run;
    ax = vec3(0., 0., -1.);
    C = vec3(iA.x+iA.y*sin(z*.35+seed*30.), wLevel(z)+.05, z);
    a = iC.z*(iC.w > .5 ? uFlood.x*smoothstep(-16., -6., z-uHump.x) : uGain.y)*smoothstep(0., 3., run)*(1.-smoothstep(iA.w-3., iA.w, run)); fib = len; kind = 3.;
    if(stand) shift = -uTime*iB.x;
    lit = wSheetFoam(C)*.8;
  }
  vec3 toEye = cameraPosition-C; float dist = length(toEye);
  vec3 sd = wNrm(cross(ax, toEye));
  if(mode > 5.5 && mode < 6.5) sd = vec3(1., 0., 0.);       // a raft is not turned to the eye: it lies flat on the water, level across its run
  if(mode > 7.5 && mode < 8.5) sd = normalize(vec3(-ax.z, 0., ax.x));     // (nor is a wake)
  float w = max(wd, 1.5*dist*2./(projectionMatrix[1][1]*uResY));
  vec3 P = C+ax*(position.y-.5)*len+sd*position.x*w;
  // A RAFT LIES ON THE WATER: every one of its fourteen corners (seven rows down its length) at the sheet's own height at
  // its own place (the level, the hump, the pile and the sheet's bob), 3 cm over it: the water's own face, nothing
  // standing in the air
  if(mode > 5.5 && mode < 6.5) P.y = wLevel(P.z)+wBob(P.xz)+.03;
  // A WAKE'S DASH LIES ON THE SEA: every one of its corners on the sea's own drawn surface at its own place and
  // moment (the grid's own flat triangles), 4 cm over it: never under the water, never in the air
  if(mode > 7.5 && mode < 8.5) P.y = wSeaDrawn(P.xz)+.04;
  // A STRIKE'S SPLASH STANDS ON THE SEA (mode 8 with iC.w 1: the leg's raft; order 20). Struck water is thrown UP: a
  // patch lying flat on the sea is next to nothing from a little over the water, a splash is not. Its foot is on
  // the sea's own drawn surface at the place where the bird struck (each corner's foot at its own place, 2 cm
  // over it); it is as wide as dealt (iB.w) and stands as high as dealt (iB.z) from 0.12 s after the strike,
  // leaning 0.4 of its height along its throw (iB.xy), and from 0.15 of its life on it sinks back, to a quarter
  // of its height at 0.8 of its life, while it fades (by its own age: the mark's law above). It is drawn as all
  // thrown water here is: an upright sheet, torn into fibres, turned about its upright toward the lens
  if(mode > 7.5 && mode < 8.5 && iC.w > .5){
    float tau = max(uBurst-iA.z, 0.), up = len*smoothstep(0., .12, tau)*(1.-.75*smoothstep(.15*iA.w, .8*iA.w, tau));
    P = vec3(iA.x, 0., iA.y)+wNrm(cross(vec3(0., 1., 0.), toEye))*position.x*w; P.y = wSeaDrawn(P.xz)+.02;
    P += (vec3(0., 1., 0.)+.4*ax)*position.y*up;
  }
  vP = vec4(P, shift);
  vF = vec4(a*wd/w, fib, seed, kind); vQ = position.xy;
  vC = wAir(lit.x < 0. ? wFoamLight(C) : lit, C, dist, 0.);
  gl_Position = projectionMatrix*viewMatrix*vec4(P, 1.);
}`;
const STREAK_FRAG = /* glsl */`
${W_COMMON}
varying vec2 vQ; varying vec3 vC; varying vec4 vF, vP;
void main(){
  float x = abs(vQ.x)*2., y = vQ.y, al, tone = 1.;
  if(vF.w > 2.5){
    // A RAFT OF FOAM: its outline is its own, lobed by noise and dying well inside its quad on all four sides; its
    // grain is drawn out down the flow, and the flow BENDS, by place (cur: every raft's grain follows the same slow
    // bends of the current as it passes them)
    float cur = .9*sin(vP.z*.19+1.3)+.45*sin(vP.z*.43+4.1);
    vec2 p = vec2(vP.x-cur, y*vF.y+vP.w)+vF.z*vec2(37., 91.);
    float m = (1.-x*x)*4.*y*(1.-y);
    float n1 = wVn(vec2(p.x*.75, p.y*.27))*.6+wVn(vec2(p.x*1.7+5., p.y*.6+3.))*.4;
    // (ORDER 9: SOFT FOAM WHERE WATER MEETS ROCK, low and grey-white: a soft-edged patch with a faint open grain, no
    // bright stroke and no crisp line in it; never brighter than the part's own foam)
    float v = n1+1.15*m-.78, body = smoothstep(.4, .82, v);
    float cell = wVn(vec2(p.x*2.3, p.y*.9))*.6+wVn(vec2(p.x*5.1+7., p.y*2.+3.))*.4;
    al = vF.x*body*(.5+.5*smoothstep(.3, .72, cell)); tone = .78+.14*cell;
  } else if(vF.w > 1.5){           // the face: whole at its foot, torn toward its top, its fibres climbing
    float yy = y*vF.y, n1 = wVn(vec2(vQ.x*4.+vF.z*31., yy*.7-uTime*2.4)), n2 = wVn(vec2(vQ.x*13.+vF.z*17., yy*1.6-uTime*4.2));
    float body = smoothstep(.3, .68, n1*.6+n2*.4+.42*(1.-y));
    al = vF.x*(1.-x*x)*body*(1.-smoothstep(.3+.5*n1, .95, y))*smoothstep(0., .05, y);
    tone = (.5+.65*n2)*mix(.8, 1.1, y);
  } else {
    al = vF.x*(1.-x*x)*smoothstep(0., .3, y)*(1.-smoothstep(.5, 1., y));
    al *= mix(1., smoothstep(.3, .62, wVn(vec2(vQ.x*5.+vF.z*31., y*1.3+vF.z*9.))), vF.y);      // a broad streak is a sheet torn into fibres
    al *= mix(1., .12+.88*smoothstep(.36, .6, wVn(vec2(vF.z*91., y*6.5+vF.z*13.))), vP.w*(1.-vF.y));      // a thin jet of thrown water is beads and short dashes
  }
  if(al < .003) discard;
  gl_FragColor = vec4(vC*tone, al);
}`;
// ---------------------------------------------------------------- geometry: small lofted bodies with painted vertices
const newG = () => ({ p: [], n: [], c: [], w: [], i: [] });
// paint: under a sun of 2.6 and a sky of 1.6 a white must be an albedo of about 0.3 to stay under 1, as the part's own are
const ALB = 0.34;
const hex = (h) => { const c = new THREE.Color(h); return [c.r * ALB, c.g * ALB, c.b * ALB]; };
// a tube through stations along z: [z, centre y, half width, half height, colour above, colour below]; split is the cosine
// (from the top) at which above turns to below; wOf(j, z, sin) gives a vertex its three animation weights
function loftZ(G, st, sides, split = 0, wOf = null) {
  const base = G.p.length / 3;
  for (let j = 0; j < st.length; j++) {
    const [z, yc, hw, hh, cT, cB] = st[j], jn = Math.min(st.length - 1, j + 1), jp = Math.max(0, j - 1);
    const slope = ((st[jn][2] + st[jn][3]) - (st[jp][2] + st[jp][3])) * 0.5 / Math.max(1e-4, st[jn][0] - st[jp][0]);
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * TAU, sa = Math.sin(a), ca = Math.cos(a);
      G.p.push(hw * sa, yc + hh * ca, z);
      let nx = sa * hh, ny = ca * hw; const l = Math.hypot(nx, ny) || 1, nl = Math.hypot(1, slope); nx /= l; ny /= l;
      G.n.push(nx / nl, ny / nl, -slope / nl);
      const c = ca > split ? cT : cB; G.c.push(c[0], c[1], c[2]);
      const w = wOf ? wOf(j, z, sa) : [0, 0, 0]; G.w.push(w[0], w[1], w[2]);
    }
  }
  for (let j = 0; j < st.length - 1; j++) for (let k = 0; k < sides; k++) {
    const a = base + j * sides + k, b = base + j * sides + (k + 1) % sides, c = a + sides, d = b + sides;
    G.i.push(a, c, b, b, c, d);
  }
}
// a flat sheet of three or four corners, its normal from its winding
function sheet(G, P, col, W) {
  const b = G.p.length / 3, A = P[0], B = P[1], C = P[2];
  const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
  for (let k = 0; k < P.length; k++) {
    const c = Array.isArray(col[0]) ? col[k] : col, w = W ? W[k] : [0, 0, 0];
    G.p.push(P[k][0], P[k][1], P[k][2]); G.n.push(nx / l, ny / l, nz / l); G.c.push(c[0], c[1], c[2]); G.w.push(w[0], w[1], w[2]);
  }
  G.i.push(b, b + 1, b + 2); if (P.length > 3) G.i.push(b, b + 2, b + 3);
}
// stand what was lofted along z upright: z becomes the height, the old height the way it faces
function upright(G, v0, i0) {
  for (let v = v0; v < G.p.length / 3; v++) { let t = G.p[v * 3 + 1]; G.p[v * 3 + 1] = G.p[v * 3 + 2]; G.p[v * 3 + 2] = t; t = G.n[v * 3 + 1]; G.n[v * 3 + 1] = G.n[v * 3 + 2]; G.n[v * 3 + 2] = t; }
  for (let i = i0; i < G.i.length; i += 3) { const t = G.i[i + 1]; G.i[i + 1] = G.i[i + 2]; G.i[i + 2] = t; }
}
// one instanced mesh of a body: the geometry's own attributes, then the per-body ones
function bodyMesh(G, material, count, attrs, name) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
  if (G.n) g.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
  if (G.c) g.setAttribute('aCol', new THREE.Float32BufferAttribute(G.c, 3));
  if (G.w) g.setAttribute('aW', new THREE.Float32BufferAttribute(G.w, 3));
  g.setIndex(G.i);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 400);
  const m = new THREE.Mesh(g, material); m.frustumCulled = false; m.name = name; m.userData.triangles = (G.i.length / 3) * count;
  return m;
}

// a flying sea bird: spindle body, deep or slim bill, two-part wings hinged at the shoulder, splayed feet if it shows them
function flyerGeo(o) {
  const G = newG(), L = o.L, K = hex(o.back), W = hex(o.belly), B = hex(o.bill), Cr = hex(o.crown || o.back), Ch = hex(o.cheek || o.belly);
  loftZ(G, [[-0.5 * L, 0, 0.004, 0.004, K, K], [-0.27 * L, 0, 0.1 * L, 0.08 * L, K, W], [0.06 * L, -0.01 * L, 0.17 * L, 0.16 * L, K, W],
    [0.31 * L, 0.03 * L, 0.115 * L, 0.115 * L, Cr, Ch], [0.42 * L, 0.02 * L, 0.05 * L, o.deep * L, B, B], [0.54 * L, -0.01 * L, 0.004, 0.004, B, B]], o.sides || 6, 0.1);
  const hx = 0.13 * L, half = o.span / 2, xm = hx + 0.5 * (half - hx), y = 0.05 * L, Wc = hex(o.wing), Tc = hex(o.tip);
  for (const s of [-1, 1]) {
    sheet(G, [[s * hx, y, 0.22 * L], [s * hx, y, -0.12 * L], [s * xm, y, -0.13 * L], [s * xm, y, 0.17 * L]], Wc, [[s, hx, 0], [s, hx, 0], [s, hx, 0.5], [s, hx, 0.5]]);
    sheet(G, [[s * xm, y, 0.17 * L], [s * xm, y, -0.13 * L], [s * half, y, -0.17 * L], [s * half, y, -0.06 * L]], [Wc, Wc, Tc, Tc], [[s, hx, 0.5], [s, hx, 0.5], [s, hx, 1], [s, hx, 1]]);
    if (o.feet) sheet(G, [[s * 0.05 * L, -0.1 * L, -0.36 * L], [s * 0.12 * L, -0.13 * L, -0.54 * L], [s * 0.02 * L, -0.13 * L, -0.54 * L]], hex(o.feet));
  }
  return G;
}
// a bird that floats or sits: low body, head carried up (its weight 1, so it nods and dips), wings that only show in a patter
function duckGeo(o) {
  const G = newG(), L = o.L, K = hex(o.back), W = hex(o.belly), B = hex(o.bill), Cr = hex(o.crown || o.back), Ch = hex(o.cheek || o.belly);
  loftZ(G, [[-0.52 * L, 0.11 * L, 0.004, 0.004, hex(o.tail || o.back), K], [-0.2 * L, 0.02 * L, 0.18 * L, 0.13 * L, K, W], [0.14 * L, 0.02 * L, 0.2 * L, 0.16 * L, K, W],
    [0.3 * L, 0.19 * L, 0.1 * L, 0.12 * L, K, W], [0.36 * L, 0.33 * L, 0.105 * L, 0.105 * L, Cr, Ch], [0.47 * L, 0.31 * L, 0.045 * L, o.deep * L, B, B], [0.6 * L, 0.28 * L, 0.004, 0.004, B, B]],
  o.sides || 6, o.split ?? 0.2, (j) => [j >= 3 ? 1 : 0, 0, 0]);
  const hx = 0.19 * L, Wc = hex(o.wing || o.back);
  if (!o.nowing) for (const s of [-1, 1]) sheet(G, [[s * hx, 0.1 * L, 0.16 * L], [s * hx, 0.1 * L, -0.1 * L], [s * 0.7 * L, 0.1 * L, -0.15 * L], [s * 0.7 * L, 0.1 * L, 0.05 * L]], Wc, [[0, 0, 0], [0, 0, 0], [0, s, 0], [0, s, 0]]);
  return G;
}
// a shag standing upright with its wings hung out to dry
function shagGeo() {
  const G = newG(), K = hex('#0b1512'), K2 = hex('#17231c'), Bl = hex('#8a8250');
  loftZ(G, [[0, 0, 0.004, 0.004, K, K], [0.08, 0, 0.085, 0.08, K, K], [0.28, 0, 0.11, 0.1, K, K2], [0.46, 0.02, 0.085, 0.075, K, K2], [0.57, 0.04, 0.04, 0.04, K, K],
    [0.67, 0.06, 0.032, 0.032, K, K], [0.72, 0.085, 0.045, 0.05, K, K], [0.765, 0.1, 0.004, 0.004, K, K]], 6, 0, (j) => [j >= 4 ? 1 : 0, 0, 0]);
  upright(G, 0, 0);
  sheet(G, [[-0.013, 0.728, 0.12], [0.013, 0.728, 0.12], [0, 0.716, 0.215]], Bl, [[1, 0, 0], [1, 0, 0], [1, 0, 0]]);
  sheet(G, [[-0.07, 0.1, -0.05], [0.07, 0.1, -0.05], [0.05, -0.04, -0.16], [-0.05, -0.04, -0.16]], K);
  for (const s of [-1, 1]) {
    sheet(G, [[s * 0.09, 0.52, 0], [s * 0.33, 0.47, -0.02], [s * 0.29, 0.24, -0.02], [s * 0.09, 0.3, 0]], [K2, K, K, K2], [[0, 0, 0], [0, s * 0.6, 0], [0, s * 0.6, 0], [0, 0, 0]]);
    sheet(G, [[s * 0.33, 0.47, -0.02], [s * 0.52, 0.34, -0.03], [s * 0.46, 0.06, -0.03], [s * 0.29, 0.24, -0.02]], K, [[0, s * 0.6, 0], [0, s, 0], [0, s, 0], [0, s * 0.6, 0]]);
  }
  return G;
}
// a grey seal lying along z, 2 m long: the front third carries the head's weight, so it lifts as one neck
function sealGeo(pup) {
  const G = newG(), K = hex(pup ? '#d9d3c0' : '#7e858a'), W = hex(pup ? '#e6e1d2' : '#d2ccb8'), H = hex(pup ? '#cfc8b4' : '#6b7277'), N = hex('#1b1b1d');
  loftZ(G, [[-1.02, 0.05, 0.17, 0.02, K, K], [-0.86, 0.07, 0.07, 0.05, K, K], [-0.62, 0.15, 0.19, 0.15, K, W], [-0.2, 0.24, 0.31, 0.245, K, W], [0.2, 0.25, 0.3, 0.25, K, W],
    [0.5, 0.235, 0.22, 0.21, K, W], [0.72, 0.25, 0.14, 0.135, H, W], [0.86, 0.27, 0.125, 0.12, H, W], [0.97, 0.25, 0.07, 0.065, H, H], [1.03, 0.24, 0.004, 0.004, N, N]],
  8, -0.25, (j, z) => [ss(0.3, 0.9, z), 0, z]);
  for (const s of [-1, 1]) sheet(G, [[s * 0.26, 0.06, 0.38], [s * 0.52, 0.01, 0.22], [s * 0.28, 0.03, 0.12]], K);
  return G;
}
// a basking shark, 7 m, its gape open: a white ring and a pale throat at the front
function sharkGeo() {
  const G = newG(), K = hex('#2a3034'), W = hex('#4a5258'), M = hex('#e8ece8'), T = hex('#b9c2c0'), w = (j, z) => [0, 0, z / 3.5];
  loftZ(G, [[-3.4, 0, 0.03, 0.1, K, K], [-2.6, 0, 0.12, 0.2, K, W], [-1.2, 0, 0.42, 0.5, K, W], [0.6, 0, 0.62, 0.72, K, W], [2.2, 0, 0.6, 0.7, K, W],
    [3.1, -0.02, 0.55, 0.62, K, W], [3.3, -0.02, 0.5, 0.58, M, M]], 8, -0.1, w);
  loftZ(G, [[2.75, 0, 0.004, 0.004, T, T], [3.0, -0.02, 0.3, 0.36, T, T], [3.3, -0.02, 0.5, 0.58, M, M]], 8, 0, w);
  sheet(G, [[0, 0.68, 0.9], [0, 1.45, 0.3], [0, 0.66, -0.2]], K, [[0, 0, 0.25], [0, 0, 0.1], [0, 0, -0.05]]);
  sheet(G, [[0, 0.12, -3.1], [0, 1.0, -3.9], [0, -0.08, -3.35]], K, [[0, 0, -0.9], [0, 0, -1], [0, 0, -0.95]]);
  sheet(G, [[0, -0.1, -3.1], [0, -0.6, -3.7], [0, 0.05, -3.3]], K, [[0, 0, -0.9], [0, 0, -1], [0, 0, -0.95]]);
  for (const s of [-1, 1]) sheet(G, [[s * 0.55, -0.3, 1.6], [s * 1.5, -0.6, 1.0], [s * 0.55, -0.3, 1.0]], K, [[0, 0, 0.45], [0, 0, 0.3], [0, 0, 0.3]]);
  return G;
}
// a moon jelly's bell: a dome of radius 1, three quarters of that high, with a short skirt hanging in under its rim
function jellyGeo() {
  const G = { p: [0, 0.75, 0], i: [] }, S = 12, rings = [[0.45, 0.68], [0.8, 0.45], [1, 0.12], [0.9, -0.2]];
  for (const [rr, y] of rings) for (let k = 0; k < S; k++) { const ph = k / S * TAU; G.p.push(rr * Math.cos(ph), y, rr * Math.sin(ph)); }
  for (let k = 0; k < S; k++) G.i.push(0, 1 + (k + 1) % S, 1 + k);
  for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < S; k++) { const a = 1 + j * S + k, b = 1 + j * S + (k + 1) % S; G.i.push(a, b, a + S, b, b + S, a + S); }
  return G;
}
// a strip (x across -0.5..0.5, y along 0..1) or a square (-1..1) for sprites
function stripG(seg) {
  const G = { p: [], i: [] };
  for (let k = 0; k <= seg; k++) G.p.push(-0.5, k / seg, 0, 0.5, k / seg, 0);
  for (let k = 0; k < seg; k++) { const a = k * 2; G.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  return G;
}
const squareG = (h) => ({ p: [-h, -h, 0, h, -h, 0, h, h, 0, -h, h, 0], i: [0, 1, 2, 0, 2, 3] });
// the open sea's grid, by place: 1.5 m cells where the lens flew low before the leg along the cliff (30 m either side of
// the mouth's line, from the mouth to 117 m out), each line beyond a quarter longer than the last, out to 3.6 km: THE
// GRID AS IT WAS (order 15: what the mouth's slot shows from inside the cave is drawn on the cells it was drawn on).
// aCell is the longer side of the cells at a vertex: the shader lets a wave train lift the grid only where its cells
// can carry it. skip(x0, z0, x1, z1) leaves a cell out.
// THE LEG'S FINER CELLS (fine: { x0, x1, z0, z1, coreX, coreZ }): one block of the grid's own cells, between lines of
// the grid (x1, its first fine line, -30; the first line at or west of x0; z0 to z1), is drawn instead on 1.5 m
// cells: lines 1.5 m apart westward from x1, on the grid's own lines of z. ITS RIM IS THE GRID'S OWN: along the
// block's north and south rims only the grid's own vertices stand, and the row of cells next to a rim is sewn to
// them triangle by triangle (zip), so the sheet has no seam; on its west and east rims the grid's own vertices are
// 1.5 m apart already. No vertex of the grid is moved or changed: the new ones come after them, the block's
// triangles after the grid's. aCell in the block is 1.5 m east of coreX and north of coreZ, and grows evenly (by
// its logarithm) from there to the rim's own figure at the west and south rims: the trains come down to what the
// grid beyond carries over a stretch of water, not in a step.
function seaGrid(skip, fine) {
  const line = (a, b, s, far) => {
    const L = []; for (let v = a; v <= b + 1e-6; v += s) L.push(v);
    for (let d = s, v = b; v < far;) { d *= 1.25; v += d; L.push(v); }
    for (let d = s, v = a; v > -far;) { d *= 1.25; v -= d; L.unshift(v); }
    return L;
  };
  const X = line(-30, 30, 1.5, 3600), Z = line(-3, 117, 1.5, 3600), nx = X.length, nz = Z.length;
  const lineAt = (L, v) => L.findIndex((q) => Math.abs(q - v) < 1e-6), xs = [];
  let iw = -1, ie = -1, jn = -1, js = -1;
  if (fine) { ie = lineAt(X, fine.x1); jn = lineAt(Z, fine.z0); js = lineAt(Z, fine.z1); iw = ie; while (iw > 0 && X[iw] > fine.x0) iw--; if (ie > 0 && jn >= 0 && js > jn + 1) for (let x = X[ie] - 1.5; x > X[iw] + 0.4; x -= 1.5) xs.unshift(x); }
  const nf = xs.length, rows = nf ? js - jn - 1 : 0, nv0 = nx * nz;
  const p = new Float32Array((nv0 + nf * rows) * 3), c = new Float32Array(nv0 + nf * rows), idx = [];
  const span = (L, i) => Math.max(L[Math.min(L.length - 1, i + 1)] - L[i], L[i] - L[Math.max(0, i - 1)]);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; p[k * 3] = X[i]; p[k * 3 + 2] = Z[j]; c[k] = Math.max(span(X, i), span(Z, j)); }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    if (nf && i >= iw && i < ie && j >= jn && j < js) continue;      // (the block's own cells: drawn fine, below)
    if (skip(X[i], Z[j], X[i + 1], Z[j + 1])) continue;
    const a = j * nx + i, b = a + 1, d = a + nx, e = d + 1; idx.push(a, d, b, b, d, e);
  }
  if (nf) {
    const rim = (x) => { let i = iw; while (i < ie - 1 && X[i + 1] <= x) i++; const f = (x - X[i]) / (X[i + 1] - X[i]); return c[js * nx + i] * (1 - f) + c[js * nx + i + 1] * f; };      // the south rim's own figure at x
    for (let r = 0; r < rows; r++) for (let k = 0; k < nf; k++) {
      const v = nv0 + r * nf + k, j = jn + 1 + r, x = xs[k], z = Z[j]; let cc = 1.5;
      if (z > fine.coreZ) cc = Math.max(cc, 1.5 * Math.pow(rim(x) / 1.5, (z - fine.coreZ) / (Z[js] - fine.coreZ)));
      if (x < fine.coreX) cc = Math.max(cc, 1.5 * Math.pow(c[j * nx + iw] / 1.5, (fine.coreX - x) / (fine.coreX - X[iw])));
      p[v * 3] = x; p[v * 3 + 2] = z; c[v] = cc;
    }
    // (a row of the block from west to east: the grid's own vertex on the west rim, the new ones, the grid's own on the east rim; a rim's row: the grid's own)
    const rowF = (r) => { const L = [(jn + 1 + r) * nx + iw]; for (let k = 0; k < nf; k++) L.push(nv0 + r * nf + k); L.push((jn + 1 + r) * nx + ie); return L; };
    const rowG = (j) => { const L = []; for (let i = iw; i <= ie; i++) L.push(j * nx + i); return L; };
    const tri = (a, b, d) => { if (!skip(Math.min(p[a * 3], p[b * 3], p[d * 3]), Math.min(p[a * 3 + 2], p[b * 3 + 2], p[d * 3 + 2]), Math.max(p[a * 3], p[b * 3], p[d * 3]), Math.max(p[a * 3 + 2], p[b * 3 + 2], p[d * 3 + 2]))) idx.push(a, b, d); };
    // (two rows sewn, the northern and the southern, each from west to east: the next vertex to the east on either row makes the next triangle; where both rows have the same lines, the grid's own two triangles a cell come out)
    const zip = (N, S) => { let a = 0, b = 0; while (a < N.length - 1 || b < S.length - 1) { if (b === S.length - 1 || (a < N.length - 1 && p[N[a + 1] * 3] <= p[S[b + 1] * 3])) { tri(N[a], S[b], N[a + 1]); a++; } else { tri(N[a], S[b], S[b + 1]); b++; } } };
    zip(rowG(jn), rowF(0)); for (let r = 0; r < rows - 1; r++) zip(rowF(r), rowF(r + 1)); zip(rowF(rows - 1), rowG(js));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aCell', new THREE.BufferAttribute(c, 1)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6000);
  return { geometry: g, triangles: idx.length / 3, fine: { fromX: nf ? X[iw] : 0, vertices: nf * rows } };
}

// ---------------------------------------------------------------- the script: every level as a function of u
// The lens rides 1 m over the water from the mouth's apron to the spout's foot: the cave's level is what is left of
// (path height - 1) once the hump and the pile at the lens's place are taken off. Outside, the sea itself is that level.
const FLOWN = 0.98, SP_S0 = 94;      // the speeds as flown are the speeds asked times FLOWN; where the run-up to the mouth begins, metres of the brief's line
function makeScript(path, K, fly) {
  const NT = 800, P = new Float32Array((NT + 1) * 3), v = new THREE.Vector3();
  for (let i = 0; i <= NT; i++) { path.pointAt(i / NT, v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
  const lens = (u, k) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)), f = x - i; return P[i * 3 + k] + (P[i * 3 + 3 + k] - P[i * 3 + k]) * f; };
  // speedAt: the metres a second asked along the route (flown: these times FLOWN, the speed following 0.7 s behind; see
  // the head). NO BRAKE, NO KICK: where the speed changes it changes evenly, SP_A metres a second each second and no
  // more (speed squared straight by the metres of the way), so that as flown no one second holds a change of more than
  // about 3 m/s: up from 8.4 before the mouth to its most a little inside it and down to the loop's 3.6 by u 0.458; up
  // again on the second pass with the swell that carries us (the surge) and down to 4.2 by u 0.742. The launch up the
  // chimney builds evenly too, SP_L (2.9) m/s each second from u 0.793 to 14.6 m/s. Slow from u 0.742 to 0.793, where the point the gaze is on
  // (12 m ahead) climbs the arc under the blowhole's foot: the gaze's pitch turns 79 degrees there, and stays under 30
  // degrees a second. On the loop 3.6, and 3.1 through the hairpin and the gaze's turn back to the nave (u 0.6 to 0.67:
  // a stretch wider than a twentieth of the flight). The pace is this over 5.9: the slowest share (0.525) above the
  // engine's floor of 0.35, the fastest (2.475) under its 2.5
  const SP_A = 2.55, SP_L = 2.9, Ls = path.length, up = (v0, s0, s) => Math.sqrt(v0 * v0 + 2 * SP_A * Math.max(s - s0, 0)), down = (v1, s1, s) => Math.sqrt(v1 * v1 + 2 * SP_A * Math.max(s1 - s, 0));
  const speedAt = (u) => {
    const s = u * Ls, v1 = Math.min(up(8.4, SP_S0, s), down(3.6, 0.458 * Ls, s)) - 0.5 * ss(0.582, 0.602, u) * (1 - ss(0.662, 0.68, u));
    return Math.min(Math.max(v1, up(3.1, 0.666 * Ls, s)), down(4.2, 0.742 * Ls, s)) + Math.min(Math.sqrt(4.2 * 4.2 + 2 * SP_L * Math.max(s - 0.793 * Ls, 0)), 14.6) - 4.2;
  };
  const pace = (u) => speedAt(u) / 5.9;
  // the route's own clock: the second at which the flight is at u, FLOWN AS THE ENGINE FLIES IT: the pace read at 65 points,
  // held within 0.35..2.5, drawn straight between and scaled to the duration; the speed following what is asked 0.7 s behind
  const acc = new Float32Array(NT + 1); let dur = 0;
  {
    // (the engine reads the pace along the flown line, whose measure of the way is the S's: fly.L its length, fly.toV
    // and fly.toU between its own share of the way and this script's u)
    const N = 64, pe = new Float32Array(N + 1), Lp = fly.L, tgt = new Float32Array(NT + 1); let inv = 0;
    for (let i = 0; i <= N; i++) pe[i] = clamp(pace(fly.toV(i / N)), 0.35, 2.5);
    for (let i = 0; i <= NT; i++) tgt[i] = fly.toU(i / NT) * Lp;
    // THE DURATION is what these speeds give on the flown line (the engine scales the pace to the duration: so the
    // duration is set to the one at which its scale is FLOWN): the flown line is longer than the part's (the S's 3.1 m,
    // kept), and the even changes of speed take longer than the brakes they replace
    for (let i = 0; i < N; i++) inv += 2 / (pe[i] + pe[i + 1]);
    dur = (inv / N) * Lp / (5.9 * FLOWN); inv = 0;
    for (let i = 0; i < N; i++) inv += 2 / (pe[i] + pe[i + 1]);
    const want = (u) => { const x = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(x)); return (pe[i] + (pe[i + 1] - pe[i]) * (x - i)) * (inv / N) * Lp / dur; };
    const dt = 1 / 240, k = 1 - Math.exp(-dt * 1.4);
    for (let i = 1, d = 0, t = 0, sp = want(0); i <= NT; ) { sp += (want(d / Lp) - sp) * k; d += sp * dt; t += dt; while (i <= NT && d >= tgt[i]) { acc[i] = t - (d - tgt[i]) / sp; i++; } }
  }
  const secAt = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return acc[i] + (acc[i + 1] - acc[i]) * (x - i); };
  const G = (d, half) => Math.exp(-(d / half) * (d / half)), pileF = (z) => 1 - ss(-86, -56, z);
  // THE SWELL OF THE APPROACH: it humps up 2.3 m before the mouth with its crest 10 m ahead of the lens (its back is
  // seen ahead, hiding the cliff's foot), the lens comes up onto it and rides its crest in through the mouth; inside
  // it is 0.9 m and long, and spent by the choir. (This script is written on the S, whose lens flew north: there the
  // crest lay 10 m ahead. On the leg along the cliff the build keeps that lead NORTHWARD of the leg's lens: the crest
  // lies between the lens and the cliff on the bend and is under the lens by the join.)
  const h1 = (u) => (2.3 * ss(0.232, 0.285, u) - 1.4 * ss(0.33, 0.39, u)) * (1 - ss(0.44, 0.52, u));
  const lead1 = (u) => 10 * (1 - ss(0.27, 0.335, u)), half1 = (u) => lerp(13, 20, ss(0.33, 0.39, u));
  // the swell that comes for the mouth while the gaze rests on it: it stands up 3.4 m outside (a dark hump in the slot,
  // its crest white on the open sea), and is 1.5 m by the time it comes under the lens
  const h2 = (u) => 3.4 * ss(0.545, 0.572, u) - 1.9 * ss(0.6, 0.645, u) - 0.5 * ss(0.66, 0.74, u);
  // UNDER THE BELL (u from U_BELL to U_LEAVE) the line glides down 3 m and is thrown up the blowhole. THE SURGE: the cave's
  // level stands still there (L_BELL); the sea draws back under us (the hump's height goes under zero: a trough, drawn in
  // to 9 m half length so that it is ours and the back wall keeps its water) while the swell that carried us runs on and
  // heaps 3 m against the back wall (the pile, full as we reach the bottom of the glide: the water ahead stands 4 m over
  // the water under the lens, 11 m away); then the line climbs the heap's face to the spout's foot, where the trough is
  // spent. The hump's height is what is left of (path height - 1) once level and pile are taken off.
  const U_BELL = 0.7, L_BELL = -0.5;
  const pile = (u) => 3 * ss(0.715, U_TOP, u) - 1.8 * ss(0.86, 0.96, u), hp = { z: 0, h: 0, half: 16 };
  const soft = (u) => U_LEAVE - 0.006 * Math.log(1 + Math.exp((U_LEAVE - u) / 0.006));      // u, coming smoothly to rest at U_LEAVE (the boil follows the lens to the spout's foot and comes to rest there: no stop within a frame)
  // the hump: the swell of the approach (its crest ahead of the lens, then under it), then the one that shows in the mouth, comes in to the
  // lens and rides with it; under the bell its trough, and the boil that stays at the spout's foot and sinks
  const hump = (u, o) => {
    if (u < 0.535) { o.z = lens(u, 2) - lead1(u); o.h = h1(u); o.half = half1(u); return o; }
    // (the next stands up 58 m out and comes on slowly to 34 m while the gaze rests on the mouth, on this world's own sea; then it runs in to the lens)
    o.z = lerp(58 - 24 * ss(0.54, 0.6, u), lens(soft(u), 2), ss(0.596, 0.648, u)); o.h = u <= U_BELL ? h2(u) : u <= U_LEAVE ? hBell(u) : H_LEAVE * (1 - ss(0.82, 0.9, u)); o.half = lerp(16, 9, ss(U_BELL, 0.745, u)); return o;
  };
  const levelIn = (u) => { hump(u, hp); return lens(u, 1) - 1 - hp.h * G(lens(u, 2) - hp.z, hp.half); };
  const L_B0 = levelIn(U_BELL), levelBell = (u) => lerp(L_B0, L_BELL, ss(U_BELL, 0.74, u));
  const hBell = (u) => lens(u, 1) - 1 - levelBell(u) - pile(u) * pileF(lens(u, 2)), H_LEAVE = hBell(U_LEAVE);
  const seaIn = (u) => lens(u, 1) - 1 - K.off * (1 - ss(0.2, 0.28, u)) - h1(u) * G(lead1(u), half1(u));
  const level = (u) => (u <= 0.36 ? seaIn(u) : u <= U_BELL ? levelIn(u) : u <= U_LEAVE ? levelBell(u) : lerp(L_BELL, 0.2, ss(U_LEAVE, 0.9, u)));
  // the open sea goes with the cave's level (a long swell's trough and crest): one number, so the part's sheet has no slope
  // across the mouth and this world's sea meets it level
  const sea = (u) => level(u);
  // the highest water the choir has: the level and what of the hump stands in it; the wet line trails its highest
  const choir = (u) => { hump(u, hp); const d = hp.z > -30 ? hp.z + 30 : hp.z < -60 ? -60 - hp.z : 0; return level(u) + hp.h * G(d, hp.half); };
  const wet = new Float32Array(NT + 1), flow = new Float32Array(NT + 1);
  for (let i = 0, w = -9; i <= NT; i++) { const u = i / NT; w = Math.max(choir(u), w - WET_FALL * (i ? secAt(u) - secAt((i - 1) / NT) : 0)); wet[i] = w; }
  for (let i = 0; i <= NT; i++) { const a = Math.max(0, i - 8) / NT, b = Math.min(NT, i + 8) / NT; flow[i] = clamp(1.3 * (choir(b) - choir(a)) / Math.max(0.05, secAt(b) - secAt(a)), -1, 1); }
  const tab = (T, u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return T[i] + (T[i + 1] - T[i]) * (x - i); };
  const at = (u, o) => {
    hump(u, hp);
    o.level = level(u); o.sea = sea(u); o.humpZ = hp.z; o.humpH = hp.h; o.humpHalf = hp.half; o.pile = pile(u);
    o.wet = tab(wet, u); o.flow = tab(flow, u); o.sec = secAt(u); o.lensY = lens(u, 1); o.lensZ = lens(u, 2);
    // THE SPOUT IS THE PILE'S DOING: the water heaped against the back wall tops out (U_TOP: one constant of the route
    // that both the pile's script and the spout's are written on; the spout does not read the pile's value) and
    // has nowhere to go but up the blowhole: from that moment the spout rises, whole 0.04 of the route later. (The water
    // is the vehicle: the lens rides the heap's face to the blowhole's foot, and is there as the heap tops out.) ITS
    // HEAD IS HELD UNDER THE LENS (order 10): 1.5 m below the lens's own height up the axis, by the route alone, and it
    // goes up with the water that carries the lens. (It stood 12 m ahead: the part's tube of ropes stood there as broad
    // pale blades all round the line. Nothing of the tube is drawn ahead of the lens now: the rock,
    // the green ends and the ring carry the climb.)
    o.spout = ss(U_TOP, U_TOP + 0.04, u); o.head = Math.max(0, (o.lensY - 3) / AXD.y) - 1.5;
    // the lift (the part's white water round the hump's place): THE FLOOD comes in white with the swell that enters the
    // mouth (u 0.625) and goes up the nave with us; whole as the water comes back under us and the face strikes; gone as the lens climbs away
    o.lift = (0.14 * ss(0.612, 0.65, u) - 0.05 * ss(0.72, 0.76, u)) * (1 - ss(0.8, 0.835, u));
    // THE FLOOD, 0 calm to 1: nothing until the swell is in the mouth, whole through the surge to the back wall, gone as
    // the lens goes up the blowhole; and what announces it at the back of the nave (the boil under the shaft, the falling spray)
    o.flood = ss(0.618, 0.662, u) * (1 - 0.45 * ss(0.725, 0.77, u)) * (1 - ss(0.83, 0.92, u)); o.announce = ss(0.6, 0.66, u) * (1 - ss(0.83, 0.9, u));
    o.crest = ss(0.52, 0.545, u);          // only the swell that comes for the mouth breaks at its crest (the approach's is a smooth back)
    o.foam = Math.min(0.95, lerp(0.06, 0.2, ss(0.27, 0.34, u)) + K.foam + 0.2 * ss(0.3, 0.35, u) * (1 - ss(0.42, 0.52, u)) + 0.14 * ss(0.6, 0.66, u) * (1 - ss(0.7, 0.76, u)) + 0.06 * ss(0.72, 0.765, u) + 0.14 * ss(0.775, 0.8, u) - 0.1 * ss(0.86, 0.95, u));
    return o;
  };
  return { pace, secAt, at, lens, level, sea, choir, duration: dur, NT };
}

// ---------------------------------------------------------------- the world
export default {
  id: 'basalt-organ-cave', name: 'The Organ Cave', category: 'ocean', weirdness: 0.1,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, yld = () => ctx.yield();
    // the cave first, from ctx.rng as its artist flew it; then every stream of this world at once
    const hero = await buildHero(ctx, { sea: false, demo: false, palette: PALETTE });
    const U = hero.uniforms, A = hero.anchors, F = {};
    for (const k of ['look', 'season', 'strings', 'rafts', 'sitters', 'wheels', 'bell', 'seals', 'shags', 'jellies', 'eels', 'kelp', 'mist', 'pileveil', 'lip', 'spume', 'burst', 'pile', 'fall', 'drips', 'shafts', 'sea', 'clouds', 'pups']) F[k] = rng.fork('organ-' + k);
    const hour = vary.hour || 'any', mood = vary.mood ?? 0.5, lr = F.look(), sr = F.season();
    const lookId = hour === 'golden' || hour === 'night' ? 'golden' : hour === 'dawn' ? 'fog' : mood > 0.75 ? 'gale' : hour === 'day' ? 'day' : lr < 0.55 ? 'day' : lr < 0.8 ? 'golden' : 'fog';
    const K = LOOKS[lookId], season = sr < 0.55 ? 'early' : sr < 0.8 ? 'late' : 'autumn';
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const tris = { hero: hero.stats.triangles.total }, clear = {}, info = {};
    const note = (kind, d) => { if (!(clear[kind] <= d)) clear[kind] = d; };

    // ---------------- sky, light, air
    const scene = new THREE.Scene();
    const sunDir = skyDirection(K.sunEl, K.sunAz);
    const skyOpts = { rng, preset: K.preset, clouds: false, clouds2: false, sunElevation: K.sunEl, sunAzimuth: K.sunAz, lightColor: K.sun };
    if (K.zenith) { skyOpts.zenith = K.zenith; skyOpts.horizon = K.horizon; }
    await yld();
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await yld();
    const rig = makeLightRig(sky, { shadow: false }); scene.add(rig.object);
    const fog = new THREE.FogExp2(K.haze, K.den); scene.fog = fog;
    // pearl stratocumulus low all round (never over 27 degrees up: overhead, and up the blowhole to the north, the sky is clean blue)
    const at = [], cr = F.clouds;
    for (const [n0, dist, y0, y1, w0, w1] of [[13, 560, 140, 230, 230, 400], [15, 880, 210, 340, 320, 540], [15, 1250, 300, 520, 420, 700]]) {
      const n = Math.round(n0 * (0.45 + 0.9 * K.cover));
      for (let i = 0; i < n; i++) { const a = (i + cr.range(0.1, 0.9)) / n * TAU, d = dist * cr.range(0.9, 1.12); at.push([Math.sin(a) * d, cr.range(y0, y1), -Math.cos(a) * d, cr.range(w0, w1)]); }
    }
    const clouds = await makeCloudFieldAsync({ rng: cr, sky, at, puffs: 16, height: 0.3, opacity: 0.9, fogFade: 0.5, wind: [1.2, 0, 0.5], farFade: [2300, 3000] }, ctx.yield);
    scene.add(clouds.object); tris.clouds = clouds.triangles;
    await yld();

    // the cave takes the same light and air
    hero.setLight({ sunDir, sun: K.sun, sunIntensity: K.sunI, sky: K.sky, skyIntensity: K.skyI, mouth: K.mouth, mouthIntensity: K.mouthI, shaft: K.shaft, shaftIntensity: K.shaftI });
    hero.setAir(K.haze, K.den); hero.setGlow(K.glow);      // one air for the look, wherever the eye stands, for the cliff, the sea and every body
    const em = new THREE.Color(K.emerald), emk = 1.3 / Math.max(em.r, em.g, em.b, 1e-4); U.uGlowCol.value.set(em.r * emk, em.g * emk, em.b * emk);
    const sunBase = U.uSunCol.value.clone(), shadePh = F.look.fork('shade')() * TAU;      // the cloud shadow's phase: dealt, so no fixed number sets what a moment holds
    scene.add(hero.object);
    // streams added since the first deal, forked from one that has made its own draws: nothing dealt before is moved
    { const more = F.look.fork('more'); for (const k of ['face', 'veins', 'ropes', 'splash', 'haul', 'perch', 'drift', 'afloat', 'cross', 'wake', 'body', 'halo', 'floodspray', 'fallspray', 'pour', 'floodveins', 'ahead', 'wet', 'threads', 'lee', 'rain', 'legstrings', 'legcross', 'legahead', 'legrafts', 'legwake']) F[k] = more.fork('organ-' + k); }

    // ---------------- the line and its script
    // THE PART'S OWN LINE (base: the brief's), THE S THAT MEASURES THE WAY (sLeg: the part's line read at knots 2.5 m of
    // z apart, each set east by sOff(z); it is flown no more, see THE WAY'S MEASURE at the head) AND THE FLOWN LINE
    // (flown): the leg along the cliff to the join, the part's line from there.
    const base = makePath(A.path, { samples: 1280 }), L0 = base.length, tv = new THREE.Vector3();
    const zDist = (pp, z) => { let a = 0, b = 130; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (pp.posAtDist(m, tv).z > z) a = m; else b = m; } return (a + b) / 2; };      // how far along a line its first leg comes to z
    const Z1 = S_Z0 - S_Q[5], sPts = [];
    for (let z = S_Z0; z > Z1 - 5.1; z -= 2.5) { base.posAtDist(z >= S_Z0 ? 0 : zDist(base, z), tv); sPts.push(new THREE.Vector3(tv.x + sOff(z), tv.y, tv.z)); }
    await yld();
    const sLeg = makePath(sPts, { samples: 320 }), d0J = zDist(base, Z1), dJ = zDist(sLeg, Z1), LJ = dJ - d0J, LF = L0 + LJ;
    // THE LEG ALONG THE CLIFF (order 14; nLeg). In plan: a straight run due east at z = LEG_Z, then ONE BEND, a single
    // arc of one radius, a left turn from due east onto the part's line's own heading at the join (legJ: the part's
    // line at the script's u LEG_U); the radius follows from those two (the arc leaves the run where it is tangent to
    // it and ends on the join, tangent to the part's line). In height: at every flown metre the height the S had at
    // that metre (the lens a metre over the water by the same law: the script reads the heights it read). Knots 2.5 m
    // of the flown way apart, counted back from the join, and two more beyond it on the part's line, so that the curve
    // comes onto that line as the line runs. THE LEG IS EXACTLY AS LONG AS THE S WAS TO THE SAME PLACE: the first knot
    // is set west until the curve, from its first metre to the join, measures dN (the join's flown metre by the S's
    // measure) to a thousandth of a micron. The leg is flown to the join and no further: from there the flown line IS
    // the part's line, the same curve read at the same places, and nothing of the way from there on is moved by a hair.
    const d0N = LEG_U * L0, dN = d0N + LJ, legJ = base.posAtDist(d0N, new THREE.Vector3()), legG = { x: 0, z: 0 };
    base.tangentAtDist(d0N, tv); const jl = Math.hypot(tv.x, tv.z), jtx = tv.x / jl, jtz = tv.z / jl;
    const legR = (LEG_Z - legJ.z) / (1 - jtx), legCx = legJ.x + legR * jtz, legCz = legJ.z - legR * jtx, legTurn = Math.atan2(-jtz, jtx), legArc = legR * legTurn;
    const legPlan = (sp, o) => { if (sp <= legArc) { const th = legTurn - sp / legR; o.x = legCx + legR * Math.sin(th); o.z = legCz + legR * Math.cos(th); } else { o.x = legCx - (sp - legArc); o.z = LEG_Z; } return o; };      // the plan's place sp metres (of the plan) back from the join
    const ty = new THREE.Vector3(), sY = (d) => (d < dJ ? sLeg.posAtDist(d, ty) : base.posAtDist(d - LJ, ty)).y;      // the height the S had at a flown metre
    const legKnots = (first) => {      // (first: how far the first knot lies before the second, metres of the flown way)
      const Kn = [], n = Math.floor((dN - 1.2) / 2.5); let sp = 0, yPrev = sY(dN);
      for (let j = 0; j <= n + 1; j++) { const y = sY(j <= n ? dN - 2.5 * j : 0), step = j <= n ? 2.5 : first; if (j > 0) sp += Math.sqrt(Math.max(0, step * step - (y - yPrev) * (y - yPrev))); legPlan(sp, legG); Kn.unshift(new THREE.Vector3(legG.x, y, legG.z)); yPrev = y; }
      Kn[Kn.length - 1].copy(legJ); for (const a of [2.5, 5]) Kn.push(base.posAtDist(d0N + a, new THREE.Vector3()));
      return Kn;
    };
    let legFirst = dN - 2.5 * Math.floor((dN - 1.2) / 2.5), legK = null, nLeg = null, dNl = 0;
    for (let it = 0; it < 6; it++) { legK = legKnots(legFirst); nLeg = makePath(legK, { samples: 16 }); dNl = zDist(nLeg, legJ.z); if (Math.abs(dN - dNl) < 1e-9) break; legFirst += dN - dNl; await yld(); }
    const legOff = dNl - dN;      // (what the fit leaves: under a thousandth of a micron)
    // THE LEG'S FRAME (LEGF, the shaders' uLeg.xy): the brief's straight leg (x = PX, from z 110 northward), turned a
    // quarter and laid along the run with its first metre on the leg's first metre. A place (x, z) about the brief's leg
    // lies in the world at (LEGF.x - z, LEGF.y + x): what lay east of the brief's leg lies seaward of the run, what lay
    // west of it toward the cliff, and what lay q metres along it lies q metres along the run.
    const LEGF = { x: legK[0].x + S_Z0, y: LEG_Z - PX };
    await yld();
    const NS = 1280, fx = new Float32Array(NS + 1), fy = new Float32Array(NS + 1), fz = new Float32Array(NS + 1);
    // THE LINE'S SAMPLES STAND IN BOXES (order 12: a lighter build, the answers the same to the bit): sixteen samples to
    // a box, each box the least and the greatest x, y and z of its own samples. A place is no nearer any sample of a
    // box than it is to the box, and that holds for the numbers as they are worked out here too (the same sums in the
    // same order, each no greater term by term): so a box that stands no nearer than the best sample found so far is
    // passed over, and the least of all the samples' distances comes out exactly as when every sample was looked at.
    // The search starts in the box that held the last answer (bHint: it changes how soon boxes are passed over, never
    // an answer). Eight boxes stand in a greater box in the same way (gLo, gHi), passed over whole by the same test.
    const BS = 16, NBX = Math.ceil((NS + 1) / BS), bLo = new Float32Array(NBX * 3), bHi = new Float32Array(NBX * 3); let bHint = 0, bHintXZ = 0;
    const GS = 8, NGX = Math.ceil(NBX / GS), gLo = new Float32Array(NGX * 3), gHi = new Float32Array(NGX * 3);
    const flown = {
      length: LF, points: legK.slice(0, legK.length - 3).concat(base.points.slice(1)), start: nLeg.start, end: base.end, startTangent: nLeg.startTangent, endTangent: base.endTangent,
      // (before the join: the leg's curve in plan, and for its height THE S's OWN HEIGHT AT THAT FLOWN METRE, the same
      // sum the S's line made: the knots hold those heights already, and between two knots the curve's own height
      // lay within two hundredths of a millimetre of them)
      posAtDist(d, out = new THREE.Vector3()) { if (d < dN) { nLeg.posAtDist(d + legOff, out); out.y = sY(d); return out; } return base.posAtDist(d - LJ, out); },
      tangentAtDist(d, out = new THREE.Vector3()) { return d < dN ? nLeg.tangentAtDist(d + legOff, out) : base.tangentAtDist(d - LJ, out); },
      pointAt(u, out = new THREE.Vector3()) { return flown.posAtDist(u * LF, out); },
      tangentAt(u, out = new THREE.Vector3()) { return flown.tangentAtDist(u * LF, out); },
      // (the FIRST sample of the least distance in plan, as before. The least distance among the samples of the hint's
      // box is measured first, as a bound only: no answer is taken from it. Then the boxes are gone through in the
      // line's own order, and a box is passed over when it stands further than THE LESSER of the two, the best found
      // so far and that bound; a box that stands exactly as far is opened. In a box a sample is taken only if it is
      // nearer than the best so far: so of equal samples the first stays)
      nearestXZ(x, z) {
        let best = Infinity, bi = 0, bound = Infinity, hb = bHintXZ;
        for (let i = bHintXZ * BS, e = Math.min(NS, i + BS - 1); i <= e; i++) { const dx = fx[i] - x, dz = fz[i] - z, d = dx * dx + dz * dz; if (d < bound) bound = d; }
        for (let b = 0; b < NBX; b++) {
          const k = b * 3, ax = x < bLo[k] ? bLo[k] - x : x > bHi[k] ? x - bHi[k] : 0, az = z < bLo[k + 2] ? bLo[k + 2] - z : z > bHi[k + 2] ? z - bHi[k + 2] : 0;
          if (ax * ax + az * az > (best < bound ? best : bound)) continue;
          for (let i = b * BS, e = Math.min(NS, i + BS - 1); i <= e; i++) { const dx = fx[i] - x, dz = fz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; hb = b; } }
        }
        bHintXZ = hb; return { dist: Math.sqrt(best), u: bi / NS, y: fy[bi] };
      },
      distanceTo(x, y, z) {
        let best = Infinity, hb = bHint;
        for (let i = bHint * BS, e = Math.min(NS, i + BS - 1); i <= e; i++) { const dx = fx[i] - x, dy = fy[i] - y, dz = fz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
        for (let g = 0; g < NGX; g++) {
          const kg = g * 3, gx = x < gLo[kg] ? gLo[kg] - x : x > gHi[kg] ? x - gHi[kg] : 0, gy = y < gLo[kg + 1] ? gLo[kg + 1] - y : y > gHi[kg + 1] ? y - gHi[kg + 1] : 0, gz = z < gLo[kg + 2] ? gLo[kg + 2] - z : z > gHi[kg + 2] ? z - gHi[kg + 2] : 0;
          if (gx * gx + gy * gy + gz * gz >= best) continue;
          for (let b = g * GS, be = Math.min(NBX, b + GS); b < be; b++) {
            if (b === bHint) continue;
            const k = b * 3, ax = x < bLo[k] ? bLo[k] - x : x > bHi[k] ? x - bHi[k] : 0, ay = y < bLo[k + 1] ? bLo[k + 1] - y : y > bHi[k + 1] ? y - bHi[k + 1] : 0, az = z < bLo[k + 2] ? bLo[k + 2] - z : z > bHi[k + 2] ? z - bHi[k + 2] : 0;
            if (ax * ax + ay * ay + az * az >= best) continue;
            for (let i = b * BS, e = Math.min(NS, i + BS - 1); i <= e; i++) { const dx = fx[i] - x, dy = fy[i] - y, dz = fz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; hb = b; } }
          }
        }
        bHint = hb; return Math.sqrt(best);
      },
      // (the same search for a place whose distance is asked only in case it is under lim, FOR A LIMIT OF NOUGHT OR
      // MORE: the distance, exactly as distanceTo gives it, if a sample lies nearer than lim and a thousandth of a
      // millimetre; Infinity if none does. Boxes further off than that are never opened. For a limit under nought it
      // does not hold: the square the search starts from is then that of the limit's size. It is never asked with
      // less than 2.4: only by the burst's body and the boil, with the least air of the pieces kept so far, CLEAR
      // (2.4) at the least, and the ball's own radius more)
      distanceUnder(x, y, z, lim) {
        const b0 = (lim + 1e-6) * (lim + 1e-6); let best = b0, hb = -1;
        for (let g = 0; g < NGX; g++) {
          const kg = g * 3, gx = x < gLo[kg] ? gLo[kg] - x : x > gHi[kg] ? x - gHi[kg] : 0, gy = y < gLo[kg + 1] ? gLo[kg + 1] - y : y > gHi[kg + 1] ? y - gHi[kg + 1] : 0, gz = z < gLo[kg + 2] ? gLo[kg + 2] - z : z > gHi[kg + 2] ? z - gHi[kg + 2] : 0;
          if (gx * gx + gy * gy + gz * gz >= best) continue;
          for (let b = g * GS, be = Math.min(NBX, b + GS); b < be; b++) {
            const k = b * 3, ax = x < bLo[k] ? bLo[k] - x : x > bHi[k] ? x - bHi[k] : 0, ay = y < bLo[k + 1] ? bLo[k + 1] - y : y > bHi[k + 1] ? y - bHi[k + 1] : 0, az = z < bLo[k + 2] ? bLo[k + 2] - z : z > bHi[k + 2] ? z - bHi[k + 2] : 0;
            if (ax * ax + ay * ay + az * az >= best) continue;
            for (let i = b * BS, e = Math.min(NS, i + BS - 1); i <= e; i++) { const dx = fx[i] - x, dy = fy[i] - y, dz = fz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; hb = b; } }
          }
        }
        if (hb < 0) return Infinity;
        bHint = hb; return Math.sqrt(best);
      },
      isClear(x, y, z, radius = 0, margin = 4) { return flown.distanceTo(x, y, z) > radius + margin; },
      frameAt(end, out = new THREE.Matrix4(), tilt = false) { return end ? base.frameAt(1, out, tilt) : nLeg.frameAt(0, out, tilt); },
    };
    for (let i = 0; i <= NS; i++) { flown.posAtDist(i / NS * LF, tv); fx[i] = tv.x; fy[i] = tv.y; fz[i] = tv.z; if (i % 320 === 319) await yld(); }
    for (let b = 0; b < NBX; b++) {
      const k = b * 3, i0 = b * BS; bLo[k] = bHi[k] = fx[i0]; bLo[k + 1] = bHi[k + 1] = fy[i0]; bLo[k + 2] = bHi[k + 2] = fz[i0];
      for (let i = i0 + 1, e = Math.min(NS, i0 + BS - 1); i <= e; i++) {
        if (fx[i] < bLo[k]) bLo[k] = fx[i]; if (fx[i] > bHi[k]) bHi[k] = fx[i]; if (fy[i] < bLo[k + 1]) bLo[k + 1] = fy[i]; if (fy[i] > bHi[k + 1]) bHi[k + 1] = fy[i];
        if (fz[i] < bLo[k + 2]) bLo[k + 2] = fz[i]; if (fz[i] > bHi[k + 2]) bHi[k + 2] = fz[i];
      }
    }
    for (let g = 0; g < NGX; g++) for (let a = 0; a < 3; a++) {
      let lo = Infinity, hi = -Infinity; for (let b = g * GS, be = Math.min(NBX, b + GS); b < be; b++) { if (bLo[b * 3 + a] < lo) lo = bLo[b * 3 + a]; if (bHi[b * 3 + a] > hi) hi = bHi[b * 3 + a]; }
      gLo[g * 3 + a] = lo; gHi[g * 3 + a] = hi;
    }
    // THE SCRIPT'S u IS THE PART'S LINE'S (every u named in this file: the share of the brief's line). The flown metre
    // and the part's metre are matched AS THEY WERE ON THE S (its measure, kept to the bit: order 14): over the S's
    // own length (to its join, z 30) by the S's z, from there on by the metre; so on the leg along the cliff every
    // moment of the script and of the clock falls on the flown metre it fell on, and the leg's own join (LEG_U),
    // which lies beyond the S's, is matched by the metre. toReal, toScript: a distance along the one to the distance
    // along the other
    const MT = 240, zS = new Float32Array(MT + 1), zB = new Float32Array(MT + 1);
    for (let k = 0; k <= MT; k++) { zS[k] = sLeg.posAtDist(k / MT * dJ, tv).z; zB[k] = base.posAtDist(k / MT * d0J, tv).z; }
    const across = (zA, lenA, zT, lenT, d) => {
      const x = clamp(d / lenA, 0, 1) * MT, i = Math.min(MT - 1, Math.floor(x)), z = zA[i] + (zA[i + 1] - zA[i]) * (x - i);
      let a = 0, b = MT; while (b - a > 1) { const m = (a + b) >> 1; if (zT[m] > z) a = m; else b = m; }
      return (a + (zT[a] - z) / Math.max(zT[a] - zT[b], 1e-9)) / MT * lenT;
    };
    const toReal = (d0) => (d0 <= 0 ? d0 : d0 >= d0J ? d0 + LJ : across(zB, d0J, zS, dJ, d0)), toScript = (d) => (d <= 0 ? d : d >= dJ ? d - LJ : across(zS, dJ, zB, d0J, d));
    const toV = (u) => toScript(u * LF) / L0, toU = (v) => toReal(v * L0) / LF;
    // the flown line as the script reads it: by the script's u and the part's metres
    const path = {
      length: L0,
      pointAt(v, out) { return flown.posAtDist(toReal(v * L0), out); }, posAtDist(d0, out) { return flown.posAtDist(toReal(d0), out); },
      tangentAt(v, out) { return flown.tangentAtDist(toReal(v * L0), out); },
      nearestXZ(x, z) { const n = flown.nearestXZ(x, z); n.u = toV(n.u); return n; }, distanceTo(x, y, z) { return flown.distanceTo(x, y, z); }, distanceUnder(x, y, z, lim) { return flown.distanceUnder(x, y, z, lim); },
    };
    await yld();
    // THE SCRIPT IS WRITTEN ON THE S (order 14: sRead, the S as the script always read it), so every table of it (the
    // clock, the levels, the wet line, the flow, the hump's height) is what it was to the bit, and from the join on
    // nothing of the script knows that the leg was changed. BEFORE THE JOIN two of its answers are the leg's own: the
    // lens's place (S.lens, and lensY and lensZ of S.at: the leg, read at the script's own 800ths and drawn straight
    // between as the script does) and the hump's place (humpZ: the hump keeps its lead of the lens, so it stands the
    // same metres NORTH of the leg's lens as it stood north of the S's). The heights are the S's at the same flown
    // metre, to the bit (flown.posAtDist): so the lens is a metre over the water on the leg by the law it had.
    // (S.lensS, S.atS: the script's own answers on the S, kept for the one count that is still made on it, the sea's lane.)
    const sRead = { length: L0, pointAt(v, out) { const d = toReal(v * L0); return d < dJ ? sLeg.posAtDist(d, out) : base.posAtDist(d - LJ, out); } };
    const S = makeScript(sRead, K, { L: LF, toV, toU }), sc = {};
    {
      const NL = Math.round(LEG_U * S.NT), PL = new Float32Array((NL + 1) * 3), lens0 = S.lens, at0 = S.at;
      for (let i = 0; i <= NL; i++) { path.pointAt(i / S.NT, tv); PL[i * 3] = tv.x; PL[i * 3 + 1] = tv.y; PL[i * 3 + 2] = tv.z; }
      const legLens = (u, k) => { const x = clamp(u, 0, 1) * S.NT, i = Math.min(NL - 1, Math.floor(x)), f = x - i; return PL[i * 3 + k] + (PL[i * 3 + 3 + k] - PL[i * 3 + k]) * f; };
      S.lensS = lens0; S.atS = at0;
      S.lens = (u, k) => (u < LEG_U ? legLens(u, k) : lens0(u, k));
      S.at = (u, o) => { at0(u, o); if (u < LEG_U) { const lead = o.lensZ - o.humpZ; o.lensY = legLens(u, 1); o.lensZ = legLens(u, 2); o.humpZ = o.lensZ - lead; } return o; };
    }
    const dTo = (x, y, z) => path.distanceTo(x, y, z), dToUnder = (x, y, z, lim) => path.distanceUnder(x, y, z, lim), dPlan = (x, z) => path.nearestXZ(x, z).dist;
    // THE LEG, said in figures: its knots, the run, the bend, the join, what the fit leaves, and its least air to each
    // stack's ROCK (stackRock: how far out from a stack's middle the part's own columns stand, each its middle and its
    // mean radius, read from the part's far mesh; the line's air is counted from that rock, not from the middle)
    const stackRock = A.stacks.map(() => 0);
    { const far = hero.object.getObjectByName('organ-cave-far'), fa = far && far.geometry.getAttribute('iA'), fc = far && far.geometry.getAttribute('iC3'), air = A.stacks.map(() => 1e9);
      if (fa && fc) for (let i = 0; i < fa.count; i++) { const x = fa.getX(i), z = fa.getY(i); if (z < 20) continue; for (let k = 0; k < A.stacks.length; k++) { const d = Math.hypot(x - A.stacks[k].x, z - A.stacks[k].z); if (d < 9 && d + fc.getZ(i) > stackRock[k]) stackRock[k] = d + fc.getZ(i); } }
      for (let k = 0; k < A.stacks.length; k++) if (!(stackRock[k] > 0)) stackRock[k] = 6.6;      // (no far mesh to read: the part's own figure for a stack, 5.2 m and a quarter more, and a column's half)
      for (let k = 0; k <= MT; k++) { nLeg.posAtDist(k / MT * dNl, tv); for (let q = 0; q < A.stacks.length; q++) air[q] = Math.min(air[q], Math.hypot(tv.x - A.stacks[q].x, tv.z - A.stacks[q].z) - stackRock[q]); }
      info.leg = { knots: legK.slice(0, legK.length - 2).map((q) => [+q.x.toFixed(2), +q.y.toFixed(2), +q.z.toFixed(2)]), runZ: LEG_Z, start: legK[0].toArray(), bend: { fromX: legCx, radius: legR, turnDeg: legTurn * 180 / Math.PI, length: legArc },
        join: { u: LEG_U, metre: d0N, flown: dN, at: legJ.toArray() }, fit: legOff, longer: LJ, length: LF, stackRock, stackAir: air }; }
    await yld();
    // THE GAZE ON THE LOOP is led by the one travelling point, by the route alone (u): from u0 it leaves the route's own
    // gaze (north, up the nave) and turns left at an even rate until, at u1, it lies on THE MOUTH (6 m up its slot from
    // its foot); it rests there for the whole run back toward the mouth along the pavement (to u2); then it turns BACK
    // THE WAY IT CAME, right, at an even rate, over the pavement and the choir (the wide side of the cave, where the
    // flood comes over the stumps) to the route's own gaze up the nave again (u3). The other way round, with the
    // route's own turn, the gaze bore on the nave's east wall from 4 m. Each of the three
    // is wider than a twentieth of the flight. The point stands 30 m from the route's point at u, on the bearing and
    // height this law gives.
    // THE GAZE IS LIFTED INSIDE (order 8), by the route alone, twice. ON THE FIRST PASS up the nave (passGaze: u LIFT.a0
    // to the first turn) the gaze keeps the route's own bearing and is raised to LIFT.pass above the level, toward
    // the pipes and the roof's hanging ends over the water's far edge. FROM THE
    // TURN TO FACE THE BACK ONWARD (liftGaze) the gaze rests on a POINT ON THE BLOWHOLE'S AXIS, a fixed place at each u:
    // first the middle of the shaft of daylight where it stands in the cave (LIFT.shaft metres up the axis from its
    // foot), then, from u LIFT.c0 as the nave closes, the point climbs the axis into the bell and up the chimney to the
    // ring's own middle (u LIFT.c1), where the route's own gaze up the blowhole takes it over. No eye is read: the
    // engine turns the camera toward the point it is given for the route's u, as for any point of interest.
    const LIFT = { pass: 8.5 * Math.PI / 180, a0: 0.318, a1: 0.385, shaft: 7.5, bell: 22, ring: (A.portal.y - AX0.y) / AXD.y, c0: 0.695, c1: 0.775, c2: 0.765, c3: 0.81, d0: 0.856, d1: 0.88, p: new THREE.Vector3() };
    LIFT.at = (u) => LIFT.p.copy(AX0).addScaledVector(AXD, LIFT.shaft + (LIFT.bell - LIFT.shaft) * ss(LIFT.c0, LIFT.c1, u) + (LIFT.ring - LIFT.bell) * ss(LIFT.c2, LIFT.c3, u));
    const GZ = { u0: 0.472, u1: 0.55, u2: 0.596, u3: 0.672, ramp: 0.25, mouth: new THREE.Vector3(A.mouthFoot.x, A.mouthFoot.y + 6, A.mouthFoot.z) };
    const framing = (() => {
      const p = new THREE.Vector3(), a = new THREE.Vector3(), out = new THREE.Vector3();
      const trap = (x) => { x = clamp(x, 0, 1); const r = GZ.ramp, h = 1 / (1 - r); return x < r ? 0.5 * h * x * x / r : x > 1 - r ? 1 - 0.5 * h * (1 - x) * (1 - x) / r : h * (x - 0.5 * r); };
      const route = (u, o) => { path.pointAt(u, p); path.posAtDist(Math.min(path.length, u * path.length + AHEAD), a); a.sub(p).normalize(); o[0] = Math.atan2(a.x, -a.z); o[1] = Math.asin(clamp(a.y, -1, 1)); return o; };
      const r0 = route(GZ.u0, [0, 0]), r3 = [0, 0]; r0[1] = LIFT.pass;                 // (it takes the gaze over at the first pass's lifted pitch, and hands it on lying on the shaft of daylight)
      path.pointAt(GZ.u3, p); a.copy(LIFT.at(GZ.u3)).sub(p).normalize(); r3[0] = Math.atan2(a.x, -a.z); r3[1] = Math.asin(clamp(a.y, -1, 1));        // (bearings: north 0, west a quarter turn under it; the mouth lies half a turn under, and the gaze comes back up from it)
      return (time, u) => {
        path.pointAt(u, p); a.copy(GZ.mouth).sub(p).normalize();
        let my = Math.atan2(a.x, -a.z); if (my > 0) my -= TAU; const mp = Math.asin(clamp(a.y, -1, 1)); let yaw, pitch;
        if (u < GZ.u1) { yaw = r0[0] + (my - r0[0]) * trap((u - GZ.u0) / (GZ.u1 - GZ.u0)); pitch = r0[1] + (mp - r0[1]) * ss(GZ.u0, GZ.u1, u); }
        else if (u < GZ.u2) { yaw = my; pitch = mp; }
        else { yaw = my + (r3[0] - my) * trap((u - GZ.u2) / (GZ.u3 - GZ.u2)); pitch = mp + (r3[1] - mp) * ss(GZ.u2, GZ.u3, u); }
        const c = Math.cos(pitch) * 30; return out.set(p.x + Math.sin(yaw) * c, p.y + Math.sin(pitch) * 30, p.z - Math.cos(yaw) * c);
      };
    })();
    const passAt = (() => {
      const p = new THREE.Vector3(), a = new THREE.Vector3(), out = new THREE.Vector3();
      return (u) => { path.pointAt(u, p); path.posAtDist(Math.min(path.length, u * path.length + AHEAD), a); a.sub(p); const yaw = Math.atan2(a.x, -a.z), c = Math.cos(LIFT.pass) * 30; return out.set(p.x + Math.sin(yaw) * c, p.y + Math.sin(LIFT.pass) * 30, p.z - Math.cos(yaw) * c); };
    })();
    const passGaze = { at: (time, u) => passAt(toV(u)), from: toU(LIFT.a0), to: toU(LIFT.a0 + 0.22), fade: (LIFT.a1 - LIFT.a0) / 0.22, weight: 1, arc: true, steady: true };
    const liftGaze = { at: (time, u) => LIFT.at(toV(u)), from: toU(GZ.u3), to: toU(LIFT.d1), fade: (LIFT.d1 - LIFT.d0) / (LIFT.d1 - GZ.u3), weight: 1, arc: true, steady: true };
    info.lift = { passDeg: LIFT.pass * 180 / Math.PI, shaft: LIFT.at(0).toArray(), ring: LIFT.at(1).toArray() };
    info.mouth = [GZ.mouth.x, A.mouthFoot.y, GZ.mouth.z];
    // ON THE RUN THE GAZE LEADS TO THE LEFT OF THE HEADING, TOWARD THE MOUTH (order 15, part two; legGaze, LEG_LEAD: the
    // engine's own turning toward a point of interest, whole: weight 1). The point is THE ROUTE'S OWN GAZE POINT (the
    // line's place 12 m ahead) TURNED LEFT ABOUT THE LENS'S OWN PLACE ON THE LINE by an angle that is a law of the
    // metres flown and nothing else: ONE EASED LEAD THAT NEVER TURNS BACK. The bearing asked is the bearing the
    // route's own gaze has at the first metre, turned left by three things that only ever grow: (1) THE LEAD, from
    // nought at the first metre to LEG_LEAD.deg over the first LEG_LEAD.d1 metres, at an even rate eased at both
    // ends (a fifth of it each), and standing from there; (2) THE BEND'S OWN TURN (the plan's one arc, by the flown
    // metre), whole as far as flown LEG_LEAD.d2 (the first 6.5 m of the bend: the gaze goes round with the heading,
    // its lead whole), and (3) LEG_LEAD.follow of the bend's turn from there: the
    // gaze turns at half the heading's rate, and the heading catches it up. Where the route's own gaze has itself
    // come round to the bearing asked, the lead has run out (rounded over LEG_LEAD.round degrees either side of
    // nought, so the gaze's quicker turn sets in and does not start), and from there the gaze IS the route's
    // own: the point is the route's own point, to the bit, from flown 90.6 m, 14.0 m before the join (counted:
    // info.legGaze). LEG_LEAD.deg is 29.4 and not 30 because the flown line itself swings half a degree to the
    // right before it bends: against the line's own tangent the gaze asked is never more than 30 degrees to the
    // left (counted along the whole leg: info.legGaze.ofTheHeading, 29.93). Level as the route's own gaze is (the
    // point keeps the chord's own height), no bank. AT THE FIRST METRE THE GAZE IS THE ROUTE'S OWN: the lead is nought
    // there (and the engine's guard gives no point of interest any weight at u 0). Nothing of the life
    // is moved for it. It reads the line's place at the engine's u; no lens, no clock.
    const LEG_LEAD = { deg: 29.4, d1: 40, ramp: 0.2, d2: 74, follow: 0.5, round: 5 };
    const legGaze = (() => {
      const w = 6 / LF, to = dN / LF, from = -w - 0.002, p = new THREE.Vector3(), a = new THREE.Vector3(), out = new THREE.Vector3(), Q = LEG_LEAD, RAD = Math.PI / 180;
      const trap = (x) => { x = clamp(x, 0, 1); const r = Q.ramp, h = 1 / (1 - r); return x < r ? 0.5 * h * x * x / r : x > 1 - r ? 1 - 0.5 * h * (1 - x) * (1 - x) / r : h * (x - 0.5 * r); };
      flown.posAtDist(0, p); flown.posAtDist(AHEAD, a); const b0 = Math.atan2(a.x - p.x, p.z - a.z);      // the chord's bearing at the first metre (east of north)
      const bendTurn = (d) => legTurn * clamp(1 - (dN - d) / legArc, 0, 1);      // how far the bend has turned the heading by a flown metre (the plan's one arc), radians
      // (the lead at a flown metre, radians; the chord there is left in a, the lens's place in p)
      const lead = (d) => {
        flown.posAtDist(d, p); flown.posAtDist(d + AHEAD, a); a.sub(p);
        let turned = b0 - Math.atan2(a.x, -a.z); if (turned > Math.PI) turned -= 2 * Math.PI; else if (turned < -Math.PI) turned += 2 * Math.PI;
        const grown = Q.deg * trap(d / Q.d1), sd = grown + (bendTurn(Math.min(d, Q.d2)) + Q.follow * (bendTurn(d) - bendTurn(Math.min(d, Q.d2))) - turned) / RAD, r = Math.min(Q.round, grown);
        return RAD * (sd >= r ? sd : sd <= -r ? 0 : (sd + r) * (sd + r) / (4 * r));
      };
      const at = (time, u) => {
        const d = clamp(u, 0, 1) * LF, del = d < dN ? lead(d) : (flown.posAtDist(d, p), flown.posAtDist(d + AHEAD, a), a.sub(p), 0), c = Math.cos(del), sn = Math.sin(del);
        return out.set(p.x + a.x * c + a.z * sn, p.y + a.y, p.z - a.x * sn + a.z * c);      // (east turned left is north: toward the cliff and the mouth)
      };
      let gone = dN; for (let d = dN; d > 0; d -= 0.25) { if (lead(d) > 0) break; gone = d; }
      let most = 0; for (let d = 0, tg = new THREE.Vector3(); d < dN; d += 0.5) { const l = lead(d), g = Math.atan2(a.x, -a.z) - l; flown.tangentAtDist(d, tg); let x = Math.atan2(tg.x, -tg.z) - g; if (x > Math.PI) x -= 2 * Math.PI; else if (x < -Math.PI) x += 2 * Math.PI; most = Math.max(most, x); }
      info.legGaze = { deg: Q.deg, grownBy: Q.d1, ofTheHeading: most / RAD, goneBy: gone, beforeTheJoin: dN - gone };
      return { at, from, to, fade: w / (to - from), weight: 1, arc: true, steady: true };
    })();

    // ---------------- THE PART'S TRUE ROCK about the cave and the blowhole, by place: every prism the part draws there (its
    // instances' own place, foot, top and seven corners, read once from its four column meshes), kept in 2 m cells. As the
    // part draws them: a drum may sit 3.5 cm off and 1.5 % wide, a dome stands 0.1 m over its top, a hanging end 0.15 m
    // under its foot. rockGap(x, z, ya, yb): how far the place lies outside the nearest prism that stands anywhere between
    // the heights ya and yb (0 or less: inside it; 9 where none is within a metre).
    const RK = { n: 0, x: [], z: [], y0: [], y1: [], c: [], e: [], cells: new Map() };
    const rockOf = (ia, C, i) => {          // (one prism read and kept: a plain function, called between the hand-backs)
        const x = ia.getX(i), z = ia.getY(i); if (x < -27 || x > 23 || z < -124 || z > 7) return;
        const c = [C[0].getX(i), C[0].getY(i), C[0].getZ(i), C[0].getW(i), C[1].getX(i), C[1].getY(i), C[1].getZ(i), C[1].getW(i), C[2].getX(i), C[2].getY(i), C[2].getZ(i), C[2].getW(i), C[3].getX(i), C[3].getY(i)];
        let rm = 0, area = 0;
        for (let k = 0; k < 14; k++) c[k] *= 1.015;
        for (let k = 0; k < 7; k++) { const k2 = (k + 1) % 7; rm = Math.max(rm, Math.hypot(c[k * 2], c[k * 2 + 1])); area += c[k * 2] * c[k2 * 2 + 1] - c[k2 * 2] * c[k * 2 + 1]; }
        if (area < 0) for (let k = 0; k < 3; k++) { const j = 6 - k, ax = c[k * 2], az = c[k * 2 + 1]; c[k * 2] = c[j * 2]; c[k * 2 + 1] = c[j * 2 + 1]; c[j * 2] = ax; c[j * 2 + 1] = az; }      // (counter-clockwise, seen with x to the right and z up)
        const id = RK.n++, pad = rm + 1.04; RK.x.push(x); RK.z.push(z); RK.y0.push(ia.getZ(i) - 0.15); RK.y1.push(ia.getW(i) + 0.1); RK.c.push(c); RK.e.push(null);
        for (let cx = Math.floor((x - pad) / 2); cx <= Math.floor((x + pad) / 2); cx++) for (let cz = Math.floor((z - pad) / 2); cz <= Math.floor((z + pad) / 2); cz++) { const key = cx * 4096 + cz; let L = RK.cells.get(key); if (!L) RK.cells.set(key, L = []); L.push(id); }
    };
    for (const name of ['near', 'stump', 'roof', 'far']) {
      const g = hero.object.getObjectByName('organ-cave-' + name), ia = g && g.geometry.getAttribute('iA'); if (!ia) continue;
      const C = [0, 1, 2, 3].map((k) => g.geometry.getAttribute('iC' + k));
      for (let i = 0; i < ia.count; i++) { rockOf(ia, C, i); if (i % 1500 === 1499) await yld(); }
      await yld();
    }
    // (a prism's seven edges, each its two steps and its length, are worked out the first time it is asked about and kept)
    const edgesOf = (id) => { const c = RK.c[id], E = new Float64Array(21); for (let k = 0; k < 7; k++) { const k2 = (k + 1) % 7, ex = c[k2 * 2] - c[k * 2], ez = c[k2 * 2 + 1] - c[k * 2 + 1]; E[k * 3] = ex; E[k * 3 + 1] = ez; E[k * 3 + 2] = Math.hypot(ex, ez); } return (RK.e[id] = E); };
    const rockGap = (x, z, ya, yb) => {
      const L = RK.cells.get(Math.floor(x / 2) * 4096 + Math.floor(z / 2)); let best = 9; if (!L) return best;
      for (let n = 0; n < L.length; n++) {
        const id = L[n]; if (RK.y1[id] < ya || RK.y0[id] > yb) continue;
        const c = RK.c[id], E = RK.e[id] || edgesOf(id), px = x - RK.x[id], pz = z - RK.z[id]; let d = -9;
        for (let k = 0; k < 7; k++) {
          const ex = E[k * 3], ez = E[k * 3 + 1], l = E[k * 3 + 2]; if (l < 1e-4) continue;
          d = Math.max(d, ((px - c[k * 2]) * ez - (pz - c[k * 2 + 1]) * ex) / l);        // outside an edge: positive
        }
        if (d - 0.035 < best) best = d - 0.035;
      }
      return best;
    };
    info.rock = RK.n;

    // ---------------- the open sea: this world's own sheet (the kit's ocean breaks its water into patches; this one has a way)
    // the shore, by place: metres of water to the nearest rock, from the part's depthAt (its bed falls 1.4 m a metre from the
    // headland's foot) and from the two stacks; far from any shore over the mouth's apron, where the part's sheet makes its own foam
    const SR = [-176, -144, 176, 176], SN = 128, shore = new Uint8Array(SN * SN);
    const shoreRow = (j) => {          // (a row of it: a plain function, called between the hand-backs)
      const z = SR[1] + (j + 0.5) / SN * (SR[3] - SR[1]);
      for (let i = 0; i < SN; i++) {
        const x = SR[0] + (i + 0.5) / SN * (SR[2] - SR[0]), d = hero.depthAt(x, z);
        let sd = d === -1 ? 25.5 : d === -5 ? 0 : (d + 6) / 1.4;
        for (const q of A.stacks) sd = Math.min(sd, Math.hypot(x - q.x, z - q.z) - 5.6);
        shore[j * SN + i] = Math.round(clamp(sd, 0, 25.5) * 10);
      }
    };
    for (let j = 0; j < SN; j++) { shoreRow(j); if (j % 32 === 31) await yld(); }
    const shoreTex = new THREE.DataTexture(shore, SN, SN, THREE.RedFormat, THREE.UnsignedByteType);
    shoreTex.magFilter = shoreTex.minFilter = THREE.LinearFilter; shoreTex.wrapS = shoreTex.wrapT = THREE.ClampToEdgeWrapping; shoreTex.generateMipmaps = false; shoreTex.unpackAlignment = 1; shoreTex.needsUpdate = true;
    // the trains: wavelength as a share of the look's swell, heading off due north (degrees), amplitude as a share of its height
    const TR = [[1, 0, 0.26], [0.62, 7, 0.17], [0.4, -9, 0.11], [0.245, 13, 0.07], [0.155, -20, 0.19], [0.1, 24, 0.125], [0.057, -31, 0.085], [0.034, 17, 0.05]];
    const uSw = TR.map(([l, deg, a]) => { const al = deg * Math.PI / 180; return new THREE.Vector4(Math.sin(al), -Math.cos(al), TAU / (K.wave * l), K.swell * a); });
    const uSwB = uSw.map((w) => new THREE.Vector2(F.sea() * TAU, Math.sqrt(9.81 * w.z)));
    // the highest the trains can stand over the sea's level at any phase (every crest at once), and from it, by place: their
    // share by the part's sheet (0.25 m at most), and their share in the lane (the lens keeps 0.5 m of air over them)
    const seaMax = 1.18 * uSw.reduce((a, w) => a + w.w, 0), seaKin = Math.min(1, 0.25 / seaMax);
    const seaOver = (x, z, ln) => { const r = Math.hypot(x * 2.1, Math.max(z - 2, 0)); return seaMax * lerp(seaKin, 1, ss(38, 66, r)) * ln; };
    const lensAirBy = (at, lens, u, ln) => { at(u, sc); const z = sc.lensZ, top = sc.sea + sc.humpH * Math.exp(-(((z - sc.humpZ) / Math.max(sc.humpHalf, 1)) ** 2)); return sc.lensY - top - seaOver(lens(u, 0), z, ln); };
    const lensAir = (u, ln) => lensAirBy(S.at, S.lens, u, ln);
    let uOut = 0; while (uOut < 0.4 && S.lens(uOut, 2) > 2) uOut += 0.002;
    const laneBy = (at, lens) => { let ln = 1; for (let u = 0; u <= uOut; u += 0.002) { const need = lensAirBy(at, lens, u, 0) - 0.52, have = seaOver(lens(u, 0), lens(u, 2), 1) - seaOver(lens(u, 0), lens(u, 2), 0); if (have > need) ln = Math.min(ln, Math.max(0, need) / have); } return ln; };
    // THE LANE'S SHARE IS COUNTED TWICE (order 14) and the lesser taken: on the S, as it always was (so that the sea by
    // the mouth, from the join on, is the sea it was), and on the leg as flown, as if the lens were in the whole of
    // the lane all the leg long. The lens's height over the level is the same on both at every moment, and on both
    // the count is settled early on the way, where the trains stand whole at the lens's place: the two counts come
    // out one number (info.sea.laneOnTheS, laneOnTheLeg).
    const laneS = laneBy(S.atS, S.lensS), laneLeg = laneBy(S.at, S.lens), lane = Math.min(laneS, laneLeg);
    // THE LANE BY PLACE, as the sea's shader has it (wSeaK; order 15): the trains' share at a place is the lane's
    // within 4 m of the nearer of its two lines and whole 16 m from it: the line into the mouth as the S flew it,
    // and the leg's run west of the slot's line (slotWest: how far west of that line a place lies, metres of x;
    // the run's distance is counted SLOT_W more for each metre the place lies nearer the line than SLOT_W).
    // THE LENS'S AIR IS COUNTED UNDER THIS LAW at every moment of the way in (info.sea.air): where the leg leaves
    // its lane, toward the slot's line and round the bend, the trains are low by the apron's law.
    const slotWest = (x, z) => -A.jamb.x - SLOT_OFF - SLOT_K * (z - A.jamb.z) - x;
    const laneAt = (x, z) => lerp(lane, 1, ss(4, 16, Math.min(Math.abs(x - 3 - sOff(z)), Math.abs(z - LEG_Z) + SLOT_W * Math.max(SLOT_W - slotWest(x, z), 0))));
    info.sea = { highest: seaMax, bySheet: seaMax * seaKin, lane, laneOnTheS: laneS, laneOnTheLeg: laneLeg, air: 9 };
    for (let u = 0; u <= uOut; u += 0.002) info.sea.air = Math.min(info.sea.air, lensAir(u, laneAt(S.lens(u, 0), S.lens(u, 2))));
    // the mirror: the kit sky's own clear colours read once (low away from the sun, low toward it, a third of the way up, high), and the pearl of the cloud ring
    const sunAz = Math.atan2(sunDir.x, -sunDir.z), sv = new THREE.Vector3(), scol = new THREE.Color();
    const skyAt = (el, az) => { const e = el * Math.PI / 180; sky.colorAt(sv.set(Math.sin(az) * Math.cos(e), Math.sin(e), -Math.cos(az) * Math.cos(e)), scol); return new THREE.Vector3(scol.r, scol.g, scol.b); };
    const pearl = sky.cloudLit.clone().lerp(sky.cloudShade, 0.35);
    // ONE BODY: the part's sheet before the mouth is given this sea's own deep body, as the sea lights it under this look's
    // sky and sun where the water lies flat (dark navy by day), and the wind of the look; this sea draws the part's one
    // text of the sea law with the part's own uniform objects, so the two cannot differ
    { const dp = new THREE.Color(K.deep), sk = U.uSkyCol.value, su = sunBase, k = 0.08 + 0.24 * Math.max(sunDir.y, 0);
      hero.setSeaBody(new THREE.Color(dp.r * (sk.x * 0.9 + su.x * k), dp.g * (sk.y * 0.9 + su.y * k), dp.b * (sk.z * 0.9 + su.z * k))); hero.setWind(K.wind); }
    const seaU = { uBasalt: U.uBasalt, uCaus: U.uCaus,
      uSeaBody: U.uSeaBody, uDeep: U.uDeep, uSeaZen: U.uSeaZen, uSeaMid: U.uSeaMid, uSeaHor: U.uSeaHor, uSeaScat: U.uSeaScat, uSeaScatDir: U.uSeaScatDir, uSeaP: U.uSeaP, uSeaQ: U.uSeaQ, uSeaK: U.uSeaK, uWind: U.uWind,
      uMirH0: { value: skyAt(3, sunAz + Math.PI) }, uMirH1: { value: skyAt(3, sunAz) }, uMirM: { value: skyAt(28, sunAz + Math.PI / 2).add(skyAt(28, sunAz - Math.PI / 2)).multiplyScalar(0.5) }, uMirZ: { value: skyAt(75, sunAz + Math.PI) },
      uPearl: { value: new THREE.Vector4(pearl.r, pearl.g, pearl.b, 0.55 * K.cover) }, uSunXZ: { value: new THREE.Vector2(sunDir.x, sunDir.z).normalize() } };
    // uniforms shared by what this world draws: the part's own, the sea's law, and a few of this world's
    const WU = { uTime: U.uTime, uLevel: U.uLevel, uPile: U.uPile, uSea: U.uSea, uGlowAmt: U.uGlowAmt, uAirDen: U.uAirDen, uHump: U.uHump, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol,
      uMouthCol: U.uMouthCol, uShaftCol: U.uShaftCol, uGlowCol: U.uGlowCol, uAirCol: U.uAirCol, uFoamCol: U.uFoamCol, uSpout: U.uSpout,
      uSw: { value: uSw }, uSwB: { value: uSwB }, uShoreTex: { value: shoreTex }, uShoreRect: { value: new THREE.Vector4(SR[0], SR[1], 1 / (SR[2] - SR[0]), 1 / (SR[3] - SR[1])) },
      uSeaKin: { value: seaKin }, uSeaLane: { value: new THREE.Vector2(3, lane) }, uLeg: { value: new THREE.Vector3(LEGF.x, LEGF.y, LEG_Z) }, uSlot: { value: new THREE.Vector4(A.jamb.x + SLOT_OFF, A.jamb.z, SLOT_K, SLOT_W) }, uSeaF: { value: new THREE.Vector4(K.seaFoam, K.swell, K.den, 0) },
      uSlide: { value: 0 }, uFlow: { value: 0 }, uResY: { value: 1080 }, uBurst: { value: -9 }, uGain: { value: new THREE.Vector4(1, 0, 0, 0) }, uJelly: { value: 1 }, uFlood: { value: new THREE.Vector2(0, 0) }, uJamb: { value: new THREE.Vector3(8.4, 0, 1.2) } };
    const mat = (vs, fs, own, extra) => new THREE.ShaderMaterial({ uniforms: { ...WU, ...own }, vertexShader: vs, fragmentShader: fs, ...extra });
    const V4 = (a, b, c, d) => ({ value: new THREE.Vector4(a, b, c, d) }), V3 = (a, b, c) => ({ value: new THREE.Vector3(a, b, c) });
    const add = (m, key, order) => { if (order != null) m.renderOrder = order; scene.add(m); tris[key] = (tris[key] || 0) + m.userData.triangles; return m; };
    await yld();
    {
      // no cells where the part's sheet lies whole and this sea is not yet begun (wRim under 0.57 at all four corners), nor
      // under the headland behind its face. The sea is drawn after the part's sheet (2) and blends in over it across the
      // hand-over; elsewhere it is whole
      const inF = (x, z) => hero.depthAt(x, z) === -5, whole = (x, z) => Math.hypot(x / 16.5, Math.max(z - 2, 0) / 34) <= 0.57;      // (wRim: the sea begins at 0.58)
      // (THE LEG'S FINER CELLS, order 15: one block of the grid, from the first of its lines 21 m and more behind the
      // leg's first metre to its own fine cells (x -30), from the cliff to 30 m seaward of the run, or (order 17:
      // fineS) to the last line of the grid before that at which the block's east rim is 0.4 m and more west of the
      // slot's line: as the line stands (order 18's), 27.9 m seaward of the run (z 60). Whole 1.5 m cells from 3 m
      // behind the first metre and to 15 m seaward of the run, coarser from there to the block's west and south
      // rims. THE BLOCK LIES WEST OF THE SLOT'S LINE: info.sea.fine.westOfTheSlot, metres, at its nearest corner (0.50))
      const fineZ = -3 + 1.5 * Math.ceil((LEG_Z + 15 + 3) / 1.5), fineS = Math.min(fineZ + 15, -3 + 1.5 * Math.floor((A.jamb.z + (30 - A.jamb.x - SLOT_OFF - 0.4) / SLOT_K + 3) / 1.5)), fine = { x0: legK[0].x - 21, x1: -30, z0: -3, z1: fineS, coreX: legK[0].x - 3, coreZ: fineZ };
      const SG = seaGrid((x0, z0, x1, z1) => { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; return (whole(x0, z0) && whole(x1, z0) && whole(x0, z1) && whole(x1, z1)) || (z1 <= 0 && inF(cx, cz) && inF(x0, z0) && inF(x1, z0) && inF(x0, z1) && inF(x1, z1)); }, fine);
      info.sea.fine = { fromX: SG.fine.fromX, toX: fine.x1, toZ: fine.z1, vertices: SG.fine.vertices, westOfTheSlot: slotWest(fine.x1, fine.z1) };
      const sea = new THREE.Mesh(SG.geometry, mat(SEA_VERT, SEA_FRAG, seaU, { transparent: true }));
      sea.frustumCulled = false; sea.name = 'organ-sea'; sea.userData.triangles = SG.triangles; add(sea, 'sea', 2.5);
    }
    await yld();

    // ---------------- THE MOUTH'S OWN LIFE (order 15): the puffin strings and the rafts before the mouth, WHERE AND AS THEY
    // WERE before the leg along the cliff: order 10's laws to the letter, each from the stream it always had, so that
    // what the mouth's slot shows from inside the cave is what it showed. Racetrack lanes either side of the brief's
    // line, set east with the S by place (sOff; in the shader wOff), strings crossing that line, the great wheel over
    // it, the rafts and the raft that patters. THEIR LAWS ARE MEASURED AS THEY WERE, against the way in as it was (the
    // S: dPlanS, its line in plan; S.atS and S.lensS, its lens at every moment): the same lanes, heights and deals
    // come out. THEN EACH IS MEASURED AGAINST THE LINE AS FLOWN, by its own law's figure, and what falls under it IS
    // DEALT AND LEFT OUT (the deal goes on as it did, so every bird that stays is the bird it was).
    // (the S in plan: the samples the flown line had when the S was flown; from the leg's join on they are the flown line's own)
    const oX = new Float32Array(NS + 1), oZ = new Float32Array(NS + 1);
    for (let i = 0; i <= NS; i++) { const d = i / NS * LF; if (d < dN) { if (d < dJ) sLeg.posAtDist(d, tv); else base.posAtDist(d - LJ, tv); oX[i] = tv.x; oZ[i] = tv.z; } else { oX[i] = fx[i]; oZ[i] = fz[i]; } }
    const dPlanS = (x, z) => { let best = Infinity; for (let i = 0; i <= NS; i++) { const dx = oX[i] - x, dz = oZ[i] - z, d = dx * dx + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
    await yld();
    // (a racetrack about the brief's straight leg: the place s metres round it and lat to one side, o.a across and o.b along; its length)
    const JIT = 0.3, trackIn = (Ln, s, lat, o) => {
      const xc = Ln[0], w = Ln[1], zA = Ln[2], zB = Ln[3], Ls = zA - zB, Lp = 2 * Ls + TAU * w; s = ((s % Lp) + Lp) % Lp; let cx, cz, fx0, fz0;
      if (s < Ls) { cx = xc + w; cz = zA - s; fx0 = 0; fz0 = -1; } else if (s < Ls + Math.PI * w) { const th = (s - Ls) / w; cx = xc + w * Math.cos(th); cz = zB - w * Math.sin(th); fx0 = -Math.sin(th); fz0 = -Math.cos(th); }
      else if (s < 2 * Ls + Math.PI * w) { cx = xc - w; cz = zB + (s - Ls - Math.PI * w); fx0 = 0; fz0 = 1; } else { const th = (s - 2 * Ls - Math.PI * w) / w; cx = xc - w * Math.cos(th); cz = zA + w * Math.sin(th); fx0 = Math.sin(th); fz0 = Math.cos(th); }
      o.a = cx - fz0 * lat; o.b = cz + fx0 * lat; return Lp;
    };
    const trackS = (Ln, s, lat, o) => { const Lp = trackIn(Ln, s, lat, o); o.z = o.b; o.x = o.a + sOff(o.z); return Lp; };      // (the mouth's: on the brief's line, set east with the S by place: the shader's wOff)
    // A LANE KEEPS ITS CLEAR AIR OR TAKES NO BIRD: its least air in plan (both edges of the string, all round the course;
    // the strings fly at the lens's own heights) is measured against a line; under CLEAR the lane is moved out
    // from the line a quarter of a metre at a time, and one that never clears is left out. (courseAir: the least of a
    // measure by place over both edges of a course)
    const courseAir = (track, plan) => (Ln) => { const o = { x: 0, z: 0 }, Lp = track(Ln, 0, 0, o); let m = 99; for (let s2 = 0; s2 < Lp; s2 += 1.5) for (const lat of [-JIT - 0.41, JIT + 0.41]) { track(Ln, s2, lat, o); m = Math.min(m, plan(o.x, o.z)); } return m; };
    const mLanes = [];
    for (const s of [1, -1]) for (const [din, w, zA, zB, share] of [[3.45, 3, 98, 27, 2.2], [5.5, 5, 96, 31, 1.6], [9.5, 8, 98, 36, 1], [17, 11, 126, 44, 0.5], [27, 9, 120, 52, 0.3]]) mLanes.push([PX + s * (din + w), w, zA, zB, share, false]);
    info.mouthLife = { lanes: { kept: 0, air: 99, leftOut: [] } };
    {
      // (on the S, as it was: the lane's place and whether it flew; then against the line as flown, by the same law
      // and figure: a lane whose course comes within CLEAR of it in plan takes no bird now, and is not moved: its
      // birds are dealt and left out, below. The four west of the mouth's line, which the leg's bend and run pass
      // through, are these)
      const airS = courseAir(trackS, dPlanS), airNow = courseAir(trackS, dPlan);
      for (const Ln of mLanes) {
        let air = airS(Ln); for (let k = 0; k < 16 && air < CLEAR; k++) { Ln[0] += Math.sign(Ln[0] - PX) * 0.25; air = airS(Ln); if (k % 4 === 3) await yld(); }
        if (air < CLEAR) Ln[4] = 0;
        else { const now = airNow(Ln);
          if (now < CLEAR) { Ln[5] = true; info.mouthLife.lanes.leftOut.push({ x: Ln[0], halfWidth: Ln[1], from: Ln[2], to: Ln[3], air: now }); } else { note('puffin strings', now); info.mouthLife.lanes.kept++; info.mouthLife.lanes.air = Math.min(info.mouthLife.lanes.air, now); } }
        await yld();
      }
    }
    // STRINGS CROSSING THE WAY IN AS IT WAS (F.cross): five racetracks set to one side of the brief's line, turn about,
    // which cross it 100, 92, 84, 76 and 68 m out from the cliff; and ONE GREAT LEVEL WHEEL (F.ahead), 50 m of radius,
    // its middle 48.4 m east of that line and 72 m out, which runs over it 84 to 60 m out. THEY FLY AT THE HEIGHTS AT
    // WHICH THEY KEPT CLEAR OF THE LENS ON THE S: so high over the sea that, at every moment of the way in as it was
    // (the sea's level then, the S's lens then), every point of their courses at the lowest a bird flies it was CLEAR
    // and more from the lens, the bird's own half span taken off (airS: order 10's measure; the crossing strings
    // raised 0.2 m at a time, the wheel 0.1). From the line as flown they are far: counted below by the leg's own
    // measure of height (airL) and in plan (info.mouthLife.cross, ahead).
    const WX = 14, mCross = [0, 1, 2, 3, 4].map((l) => [PX + (l % 2 ? 1 : -1) * 0.7071 * WX, WX, 130 - 8 * l, 110 - 8 * l, l % 2 ? -1 : 1, [0, 0.45, 0.15, 0.6, 0.3][l]]);
    const MW = { x: PX + 48.4, z: 72, R: 50, h: 3.9 + K.off, air: 0, w: 10.6 / 50, out: false, gone: false };
    let mHX = 3.9 + K.off, mCrossAir = 0, mCrossOut = false, mCrossGone = false;
    // (the script at its moments, every 0.004 of the route to u 0.4, with the lens's x, is read once and kept, on the S
    // and on the line as flown; the last of them is read into sc again at the end of each count, as the walk through
    // the script itself left it)
    let ATS = null, ATL = null, AU = 0;
    const walk = (at, lens) => { const AT = []; for (let u = 0; u <= 0.4; u += 0.004) { const o = at(u, {}); o.lensX = lens(u, 0); AT.push(o); AU = u; } return AT; };
    const airS = (h, pts) => {
      let m = 99; if (!ATS) ATS = walk(S.atS, S.lensS);
      for (let t = 0; t < ATS.length; t++) { const o = ATS[t], lx = o.lensX, y = o.sea + h - 0.22 - o.lensY; for (let k = 0; k < pts.length; k += 2) m = Math.min(m, Math.hypot(Math.max(0, Math.abs(pts[k] - lx) - JIT), y, pts[k + 1] - o.lensZ) - 0.42); }
      S.at(AU, sc); return m;
    };
    const airL = (h, pts) => {
      let m = 99; if (!ATL) ATL = walk(S.at, S.lens);
      for (let t = 0; t < ATL.length; t++) { const o = ATL[t], lx = o.lensX, y = o.sea + h - 0.22 - o.lensY; for (let k = 0; k < pts.length; k += 2) m = Math.min(m, Math.hypot(Math.max(0, Math.hypot(pts[k] - lx, pts[k + 1] - o.lensZ) - JIT), y) - 0.42); }      // (a bird may fly JIT to either side of its course: taken off the plan's distance, whichever way the course runs)
      S.at(AU, sc); return m;
    };
    {
      const o = { x: 0, z: 0 }, pts = [], ptsW = [], all = [], allW = [];
      for (const Ln of mCross) { const Lp = trackS(Ln, 0, 0, o); for (let s2 = 0; s2 < Lp; s2 += 1.5) { trackS(Ln, s2, 0, o); if (Math.abs(o.x - sOff(o.z) - PX) < 9) pts.push(o.x, o.z); all.push(o.x, o.z); } }
      for (let k = 0; k < 160; k++) { const th = Math.PI * (0.75 + 0.5 * k / 159), x = MW.x + MW.R * Math.cos(th), z = MW.z + MW.R * Math.sin(th); if (Math.abs(x - PX) < 9) ptsW.push(x + sOff(z), z); }
      for (let k = 0; k < 240; k++) { const th = k / 240 * TAU, z = MW.z + MW.R * Math.sin(th); allW.push(MW.x + MW.R * Math.cos(th) + sOff(z), z); }
      await yld();
      for (let k = 0; k < 12 && (mCrossAir = airS(mHX, pts)) < CLEAR + 0.05; k++) { mHX += 0.2; await yld(); }
      mCrossAir = airS(mHX, pts); mCrossOut = mCrossAir < CLEAR;      // (raised and still not clear: no string flew the crossing lanes)
      for (let k = 0; k < 30 && (MW.air = airS(MW.h, ptsW)) < CLEAR + 0.05; k++) { MW.h += 0.1; await yld(); }
      MW.air = airS(MW.h, ptsW); MW.out = MW.air < CLEAR;      // (and the same for the great wheel)
      // (against the line as flown: how far from it their courses lie in plan, and, for the points of them within
      // 10 m of it in plan, if there are any, their air by height at every moment of the leg; under CLEAR they are
      // dealt and left out)
      const plan = (Q) => { let m = 999; for (let k = 0; k < Q.length; k += 2) m = Math.min(m, dPlan(Q[k], Q[k + 1])); return m; };
      const near = (Q) => { const R = []; for (let k = 0; k < Q.length; k += 2) if (dPlan(Q[k], Q[k + 1]) < 10) R.push(Q[k], Q[k + 1]); return R; };
      const cl = airL(mHX, near(all)), wl = airL(MW.h, near(allW));
      mCrossGone = !mCrossOut && cl < CLEAR; MW.gone = !MW.out && wl < CLEAR;
      if (!mCrossOut && !mCrossGone) note('puffin strings crossing', cl);
      if (!MW.out && !MW.gone) note('puffin string ahead', wl);
      info.mouthLife.cross = { height: mHX, airOnTheS: mCrossAir, air: cl, fromTheLine: plan(all), leftOut: mCrossOut || mCrossGone };
      info.mouthLife.ahead = { height: MW.h, airOnTheS: MW.air, air: wl, fromTheLine: plan(allW), leftOut: MW.out || MW.gone };
      await yld();
    }
    const puffinG = flyerGeo({ L: 0.3, sides: 5, span: 0.55, back: '#0d0f12', belly: '#e9ece8', bill: '#F26A1B', cheek: '#d5d8d4', crown: '#0d0f12', deep: 0.105, wing: '#121417', tip: '#0b0c0e', feet: '#F26A1B' });
    // (the bodies that stay, in the order they were dealt, moved up over those left out; how many)
    const keep = (n, gone, arrs) => { let m = 0; for (let i = 0; i < n; i++) { if (gone[i]) continue; if (m < i) for (const q of arrs) q.copyWithin(m * 4, i * 4, i * 4 + 4); m++; } return m; };
    {
      const r = F.strings, NA = Math.round(500 * density * (season === 'late' ? 0.6 : 1)), NX = mCrossOut ? 0 : Math.round(NA * 0.42), N = NA - NX, perW = clamp(Math.round(8 * density), 6, 10), NW = MW.out ? 0 : 16 * perW, iA = new Float32Array((NA + NW) * 4), iB = new Float32Array((NA + NW) * 4), iC = new Float32Array((NA + NW) * 4), o = { x: 0, z: 0 }, gone = new Uint8Array(NA + NW);
      const live = mLanes.filter((l) => l[4] > 0), total = live.reduce((a, l) => a + l[4], 0);
      {
        const rx = F.cross, Ls = mCross.map((Ln) => trackS(Ln, 0, 0, o)), all = Ls.reduce((a, b) => a + b, 0); let i = N;
        for (let l = 0; l < mCross.length; l++) {
          const Ln = mCross[l], Lp = Ls[l], nS = clamp(Math.round(NX / mCross.length / 7), 2, 6), per = Math.floor(NX * Lp / all / nS), v = rx.range(12, 13.5) * Ln[4], s0 = rx() * Lp;
          for (let q = 0; q < nS; q++) { const gap = rx.range(1.2, 1.8), sq = s0 + (q + rx.range(-0.2, 0.2)) * Lp / nS, h = mHX + Ln[5] + rx.range(0, 0.2);
            for (let k = 0; k < per && i < NA; k++, i++) { iA.set(Ln.slice(0, 4), i * 4); iB.set([sq + k * gap * Math.sign(-v), v, h + rx.range(0, 0.3), 0], i * 4); iC.set([rx.range(-JIT, JIT), rx(), rx.range(1.25, 1.45), 0], i * 4); } }
        }
        for (; i < NA; i++) { iA.set(mCross[0].slice(0, 4), i * 4); iB.set([rx() * Ls[0], 12.5, mHX + rx.range(0, 0.7), 0], i * 4); iC.set([rx.range(-JIT, JIT), rx(), rx.range(1.25, 1.45), 0], i * 4); }      // (what the division left over: single birds on the first lane)
        if (mCrossGone) gone.fill(1, N, NA);
      }
      for (let i = 0; i < N && live.length;) {
        let pick = r() * total, Ln = live[live.length - 1]; for (const l of live) { pick -= l[4]; if (pick <= 0) { Ln = l; break; } }
        const Lp = trackS(Ln, 0, 0, o), n = Math.min(N - i, r.int(6, 22)), gap = r.range(1.2, 2), s0 = r() * Lp, v = r.range(11, 14) * r.sign(), h = r.range(1.3, 3.4);
        for (let k = 0; k < n; k++, i++) {
          iA.set(Ln.slice(0, 4), i * 4); iB.set([s0 + k * gap * Math.sign(-v), v, h + r.range(-0.25, 0.25), 0], i * 4); iC.set([r.range(-JIT, JIT), r(), r.range(1.25, 1.45), 0], i * 4);
          if (Ln[5]) gone[i] = 1;      // (a bird of a lane the flown line passes through: dealt, and left out)
        }
      }
      // the strings on the great wheel (sixteen, in file, each bird a little off the file's line and height)
      for (let q = 0, i = NA, ra = F.ahead; q < 16 && NW > 0; q++) { const th0 = (q + ra.range(-0.15, 0.15)) / 16 * TAU, gap = ra.range(1.3, 1.7);
        for (let k = 0; k < perW; k++, i++) { const R = MW.R + ra.range(-0.25, 0.25); iA.set([MW.x, MW.h + ra.range(0, 0.35), MW.z, R], i * 4); iB.set([th0 - k * gap / MW.R, MW.w * R, 0.15, 1], i * 4); iC.set([0, ra(), ra.range(1.25, 1.45), 0], i * 4); } }
      if (MW.gone) gone.fill(1, NA, NA + NW);
      const n = keep(NA + NW, gone, [iA, iB, iC]);
      if (n) add(bodyMesh(puffinG, mat(FLY_VERT, BODY_FRAG, { uFlap: V3(44, 0.95, 0), uCoat: V4(0, 4, 0.15, 0) }, { side: THREE.DoubleSide }), n, { iA: iA.subarray(0, n * 4), iB: iB.subarray(0, n * 4), iC: iC.subarray(0, n * 4) }, 'organ-puffins'), 'puffins');
      info.mouthLife.strings = { dealt: NA + NW, flying: n, leftOut: NA + NW - n };
      await yld();
    }

    // ---------------- the mouth's rafts on the sea outside (puffins; guillemots late in the summer), as they were. One raft,
    // twenty birds 3 to 6 m right of the S, patters off toward the cliff and away from that line at the route's clock
    // for u 0.105, each bird within 0.6 s of that, running 10 to 16 m; each leaves a wake of white dashes and splashes
    // where it ran (the streaks, below). (The lens came on it 15 m short when the S was flown; it patters on the
    // same clock still, 70 m ahead of the lens on the run, and sits from then on where it sat.)
    // A RAFT BIRD KEEPS ITS CLEAR AIR OR IS NOT THERE: its place on the water, and for a pattering bird its whole run
    // an eighth at a time, in plan (the lens flies over the water: the plan's distance is the least it can be).
    // Against the S, as it was dealt: under CLEAR it was left out and dealt again elsewhere. Against the line as
    // flown: under CLEAR it is dealt and left out (none is: the run lies 11 m and more from the nearest).
    const patter = [], mRaft = [];      // (mRaft: where the mouth's raft birds sit, the pattering ones before and after their run)
    const raftL = season === 'late' ? 0.4 : 0.3, raftCol = season === 'late' ? { L: raftL, back: '#2b231d', belly: '#e9ece8', bill: '#17181a', cheek: '#2b231d', crown: '#2b231d', deep: 0.04, split: 0.3 }
      : { L: raftL, back: '#0d0f12', belly: '#e9ece8', bill: '#F26A1B', cheek: '#d5d8d4', crown: '#0d0f12', deep: 0.105, split: 0.3 };
    const raftG = duckGeo(raftCol), raftM = mat(POSED_VERT, BODY_FRAG, { uHead: V4(0, 0.35, 1.7, 0.25 * raftL), uWing: V4(0.2, 0, 0, 0.19 * raftL), uSwim: V4(0, 0, 0, 1), uPiv: V3(0.1 * raftL, 0.1 * raftL, 0.35), uCoat: V4(0, 4, 0.2, 0) }, { side: THREE.DoubleSide });
    {
      const r = F.rafts, N = Math.round(300 * density), iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), iC = new Float32Array(N * 4), gone = new Uint8Array(N);
      const stacks = A.stacks, okAt = (x, z) => Math.abs(x - PX) >= 2.9 && z > 43 && stacks.every((q) => Math.hypot(x + sOff(z) - q.x, z - q.z) > 13);      // (x: on the brief's line)
      let i = 0, least = 99;
      const group = (cx, cz, n, spread, pat) => {
        for (let k = 0, tries = 0; k < n && i < N && tries < n * 12; tries++) {
          const x0 = cx + r.gauss() * spread, z = cz + r.gauss() * spread * 1.4; if (!okAt(x0, z)) continue;
          const x = x0 + sOff(z);      // (set east with the S, by place)
          iA.set([x, 0.06, z, r.range(-0.7, 0.7) + (r.chance(0.15) ? Math.PI : 0)], i * 4); iB.set([r.range(0.95, 1.1), r(), 0, 1], i * 4);
          let air = dPlanS(x, z) - 0.22, now = dPlan(x, z) - 0.22;
          if (pat) { iC.set([r.range(4.5, 7.5), 0, r.range(-15, -9), S.secAt(0.105) + r.range(-0.6, 0.6)], i * 4); for (let g = 0.125; g <= 1; g += 0.125) { const qx = x + iC[i * 4] * g, qz = z + iC[i * 4 + 2] * g; air = Math.min(air, dPlanS(qx, qz) - 0.22); now = Math.min(now, dPlan(qx, qz) - 0.22); } } else iC.set([0, 0, 0, 1e6], i * 4);
          if (air < CLEAR) continue;
          if (now < CLEAR) gone[i] = 1;
          else { if (pat) patter.push([x, z, iC[i * 4], iC[i * 4 + 2], iC[i * 4 + 3]]); note('rafts', now); least = Math.min(least, now); mRaft.push(x, z); if (pat) mRaft.push(x + iC[i * 4], z + iC[i * 4 + 2]); }
          i++; k++;
        }
      };
      group(PX + 4.5, 63, 20, 1.3, true);
      for (let tries = 0; i < N && tries < 60; tries++) { const side = r.sign(), off = 3.6 + 42 * r() * r(); group(PX + side * off, r.range(46, 104), r.int(10, 30), r.range(1.4, 3.6), false); if (tries % 6 === 5) await yld(); }
      const n = keep(i, gone, [iA, iB, iC]);
      if (n) add(bodyMesh(raftG, raftM, n, { iA: iA.subarray(0, n * 4), iB: iB.subarray(0, n * 4), iC: iC.subarray(0, n * 4) }, 'organ-rafts'), 'rafts');
      info.mouthLife.rafts = { birds: n, leftOut: i - n, air: least };
      await yld();
    }

    // ---------------- THE LEG'S OWN LIFE (order 14; order 15: from streams of its own, at LEG_LIFE of the mouth's numbers, and
    // WEST OF THE SLOT'S LINE, 1.5 m and more: by the count of orders 17 and 18, against the part that is live and
    // against the artist's, no straight line from the lens reaches any of it from the join on;
    // the count and what it leaves out are told at SLOT_K). IN THE LEG'S FRAME: every
    // lane, the wheel and the rafts below are laid out about the brief's straight leg, as the mouth's are, and lie
    // along the run by the cliff with it (LEGF; toW: a place of that frame, in the world). THE CLIFF AND THE WEST
    // STACK ARE ROCK: toward the cliff only the three inner lanes fly, the third narrower; on the sea's side the third
    // lane is narrower and the fifth lies further out, so that the stack stands between courses. A LANE IS ENDED AT
    // THE SLOT'S LINE: its end toward the mouth is drawn back a metre at a time until every point of its course (both
    // edges of the string) lies 1.5 m and more west of that line, and it takes as many birds for a metre of its
    // course as it would have taken whole. A LANE KEEPS OFF THE ROCK OR TAKES NO BIRD
    // (rockAir, by place: metres of open water about a place, outside the plinth's foot by the part's depthAt, whose
    // bed falls 1.3 m a metre from the foot, and outside each stack's rock; every point of a course keeps 1.5 m).
    const toW = (xf, zf, o) => { o.x = LEGF.x - zf; o.z = LEGF.y + xf; return o; };
    const trackAt = (Ln, s, lat, o) => { const Lp = trackIn(Ln, s, lat, o); toW(o.a, o.b, o); return Lp; };      // (the leg's: into the world by the leg's frame: the shader's uLeg)
    const rockAir = (x, z) => { const d = hero.depthAt(x, z); let m = d === -1 ? 99 : d === -5 ? -5 : d / 1.3; for (let k = 0; k < A.stacks.length; k++) m = Math.min(m, Math.hypot(x - A.stacks[k].x, z - A.stacks[k].z) - stackRock[k]); return m; };
    const lanes = [];
    for (const [s, list] of [[1, [[3.45, 3, 98, 27, 2.2], [5.5, 5, 96, 31, 1.6], [9.5, 4.5, 98, 36, 1], [17, 11, 126, 44, 0.5], [41, 7, 120, 52, 0.3]]], [-1, [[3.45, 3, 98, 44, 2.2], [5.5, 5, 96, 46, 1.6], [9.5, 5, 98, 42, 1]]]]) for (const [din, w, zA, zB, share] of list) lanes.push([PX + s * (din + w), w, zA, zB, share, share]);
    // (the lane's own law, against the flown line: its least air in plan, both edges of the string, all round the
    // course; under CLEAR it is moved out from the line a quarter of a metre at a time, and one that never clears,
    // or that the move sets nearer the slot's line than 1.5 m, is left out)
    const laneAir = courseAir(trackAt, dPlan), laneSlot = courseAir(trackAt, slotWest);
    const laneRock = (Ln, lats) => { const o = { x: 0, z: 0 }, Lp = trackAt(Ln, 0, 0, o); let m = 99; for (let s2 = 0; s2 < Lp; s2 += 1.5) for (const lat of lats) { trackAt(Ln, s2, lat, o); m = Math.min(m, rockAir(o.x, o.z)); } return m; };      // a course's least open water (both edges of the string)
    info.lanes = { rock: 99, leftOut: 0, endedAtTheSlot: 0, slot: 99 };
    for (const Ln of lanes) {
      const o = { x: 0, z: 0 }, Lp0 = trackAt(Ln, 0, 0, o); let sl = laneSlot(Ln), ended = false;
      for (let k = 0; k < 80 && sl < 1.5 && Ln[2] - Ln[3] > 20; k++) { Ln[3] += 1; sl = laneSlot(Ln); ended = true; if (k % 4 === 3) await yld(); }
      let air = laneAir(Ln); for (let k = 0; k < 16 && air < CLEAR; k++) { Ln[0] += Math.sign(Ln[0] - PX) * 0.25; air = laneAir(Ln); if (k % 4 === 3) await yld(); }
      sl = laneSlot(Ln);
      if (air < CLEAR || sl < 1.5) Ln[4] = 0; else { note('puffin strings', air); Ln[4] *= trackAt(Ln, 0, 0, o) / Lp0; info.lanes.slot = Math.min(info.lanes.slot, sl); if (ended) info.lanes.endedAtTheSlot++; }
      await yld();
    }
    for (const Ln of lanes) { if (Ln[4] > 0) { const ra = laneRock(Ln, [-JIT - 0.41, JIT + 0.41]); if (ra < 1.5) Ln[4] = 0; else info.lanes.rock = Math.min(info.lanes.rock, ra); } if (!(Ln[4] > 0)) info.lanes.leftOut++; await yld(); }
    // STRINGS CROSSING THE WAY (F.legcross): five racetracks set to one side of the line (the first, fourth and fifth
    // toward the cliff, the second and third seaward: the fourth, seaward, would turn through the west stack), so that
    // a string comes up from behind 4.1 m to that side of the line (flying the way the lens flies, a little
    // faster), then swings across the line at half a right angle 10, 18, 26, 34 and 42 m along the run, and over
    // to the other side: it crosses the line ahead of the lens, slowly against it. They keep their clear air BY HEIGHT:
    // a string flies hX over the sea, and hX is raised until, at every moment of the leg (the sea's level then, the
    // lens's place then), every point of the lanes at the lowest a bird flies it is CLEAR and more from the lens, the
    // bird's own half span taken off; AND NO NEARER THE LENS THAN THE MOUTH'S CROSSING STRINGS FLEW ON THE S (order
    // 15: raised until the air is no less than theirs was by their measure, which comes to one step of 0.2 m more).
    const crossSide = [-1, 1, 1, -1, -1], crossLanes = [0, 1, 2, 3, 4].map((l) => [PX + crossSide[l] * 0.7071 * WX, WX, 130 - 8 * l, 110 - 8 * l, -crossSide[l], [0, 0.45, 0.15, 0.6, 0.3][l]]);
    let hX = 3.9 + K.off, crossAir = 0, crossOut = false;
    // A WHEEL OVER THE RUN (F.legahead): a level wheel whose cliffward side runs 1.6 m cliffward of the line's own
    // plane, OVER the line, 38 m along the run, the birds there flying the lens's way a little faster than the
    // lens: a string comes in over the line from seaward, flies 16 m of the ring at or cliffward of the line and
    // bears away seaward again. IT STARTS BY ITS OWN DRAW (order 20): where round the ring its strings stand at
    // the clock's nought is the first draw of the wheel's own stream. The strings follow one another about 18 m
    // apart round the ring, so a bird is at or cliffward of the line at any clock (counted over a whole turn on
    // seventeen deals: one bird at the least, two to seven on most; a count, not a law). ITS RADIUS IS THE GREATEST, to half a metre and 50 m at the most, THAT KEEPS
    // THE WHOLE RING WEST OF THE SLOT'S LINE, 2.2 m and more (a bird flies 0.66 m off the ring at the most, its half
    // span with it): 20.5 m (under order 17's line and under order 18's wider one; 23 m under order 15's); the west
    // stack stands inside the ring, 2.3 m
    // and more of open water between its rock and the ring on the seventeen deals counted (the ring keeps 1.5 m
    // by its law or flies no string). Strings follow one another round it about 18 m
    // apart. It keeps its clear air BY HEIGHT over the sea, as the crossing lanes do (the same measure, and no nearer
    // the lens than the mouth's great wheel flew on the S).
    const wheelR = Math.min(50, Math.floor(2 * (-A.jamb.x - SLOT_OFF + SLOT_K * A.jamb.z - 2.2 - (LEGF.x - 72) - SLOT_K * (LEGF.y + PX - 1.6)) / (SLOT_K + Math.hypot(1, SLOT_K))) / 2);
    const WHEEL = { x: PX - 1.6 + wheelR, z: 72, R: wheelR, h: 3.9 + K.off, air: 0, w: 10.6 / wheelR, strings: clamp(Math.round(TAU * wheelR / 19.6), 4, 16), out: !(wheelR >= 12) };
    {
      const o = { x: 0, z: 0 }, pts = [], ptsW = []; let slotC = 99, slotR = 99;
      // (the points of the courses that lie within 10 m of the flown line in plan: no other can come near the lens;
      // and how far west of the slot's line the courses keep, a bird's own reach off its course taken off)
      for (const Ln of crossLanes) { const Lp = trackAt(Ln, 0, 0, o); for (let s2 = 0; s2 < Lp; s2 += 1.5) { trackAt(Ln, s2, 0, o); if (dPlan(o.x, o.z) < 10) pts.push(o.x, o.z); slotC = Math.min(slotC, slotWest(o.x, o.z) - JIT - 0.41); } }
      await yld();
      for (let k = 0; k < 240; k++) { const th = k / 240 * TAU; toW(WHEEL.x + WHEEL.R * Math.cos(th), WHEEL.z + WHEEL.R * Math.sin(th), o); if (dPlan(o.x, o.z) < 10) ptsW.push(o.x, o.z); slotR = Math.min(slotR, slotWest(o.x, o.z) - 0.66); }
      await yld();
      // (and their least open water: a crossing lane's whole course; the wheel all round. Too near the rock, or
      // nearer the slot's line than 1.5 m: no string flies them)
      { let m = 99; for (const Ln of crossLanes) m = Math.min(m, laneRock(Ln, [0])); crossOut = m < 1.5 || slotC < 1.5; info.lanes.crossRock = m; info.lanes.crossSlot = slotC; await yld();
        m = 99; for (let k = 0; k < 240; k++) { const th = k / 240 * TAU; toW(WHEEL.x + WHEEL.R * Math.cos(th), WHEEL.z + WHEEL.R * Math.sin(th), o); m = Math.min(m, rockAir(o.x, o.z)); } WHEEL.out = WHEEL.out || m < 1.5 || slotR < 1.5; info.lanes.wheelRock = m; info.lanes.wheelSlot = slotR; await yld(); }
      const atLeast = (a) => Math.max(CLEAR + 0.05, a < 9 ? a : 0);      // (the mouth's strings' own air on the S, where they flew)
      for (let k = 0; k < 12 && (crossAir = airL(hX, pts)) < atLeast(mCrossAir); k++) { hX += 0.2; await yld(); }
      crossAir = airL(hX, pts); crossOut = crossOut || crossAir < CLEAR;      // (raised and still not clear, or too near the rock or the slot's line: no string flies the crossing lanes)
      if (!crossOut) note('puffin strings crossing', crossAir); info.cross = { height: hX, air: crossAir, leftOut: crossOut };
      for (let k = 0; k < 30 && (WHEEL.air = airL(WHEEL.h, ptsW)) < atLeast(MW.air); k++) { WHEEL.h += 0.1; await yld(); }
      WHEEL.air = airL(WHEEL.h, ptsW); WHEEL.out = WHEEL.out || WHEEL.air < CLEAR;      // (and the same for the wheel)
      if (!WHEEL.out) note('puffin string ahead', WHEEL.air); info.ahead = { height: WHEEL.h, air: WHEEL.air, radius: WHEEL.R, strings: WHEEL.strings, leftOut: WHEEL.out };
    }
    {
      // (the leg's numbers: LEG_LIFE of the mouth's; the lanes' birds as many for a metre of course as the lanes would have had whole)
      const r = F.legstrings, NA = Math.round(LEG_LIFE * 500 * density * (season === 'late' ? 0.6 : 1)), NX = crossOut ? 0 : Math.round(NA * 0.42), live = lanes.filter((l) => l[4] > 0), total = live.reduce((a, l) => a + l[4], 0), laid = live.reduce((a, l) => a + l[5], 0);
      const N = live.length ? Math.round((NA - Math.round(NA * 0.42)) * total / laid) : 0, NT = N + NX, perW = clamp(Math.round(8 * density), 6, 10), NW = WHEEL.out ? 0 : WHEEL.strings * perW, iA = new Float32Array((NT + NW) * 4), iB = new Float32Array((NT + NW) * 4), iC = new Float32Array((NT + NW) * 4), o = { x: 0, z: 0 };
      {
        const rx = F.legcross, Ls = crossLanes.map((Ln) => trackAt(Ln, 0, 0, o)), all = Ls.reduce((a, b) => a + b, 0); let i = N;
        for (let l = 0; l < crossLanes.length; l++) {
          const Ln = crossLanes[l], Lp = Ls[l], nS = clamp(Math.round(NX / crossLanes.length / 7), 2, 6), per = Math.floor(NX * Lp / all / nS), v = rx.range(12, 13.5) * Ln[4], s0 = rx() * Lp;
          for (let q = 0; q < nS; q++) { const gap = rx.range(1.2, 1.8), sq = s0 + (q + rx.range(-0.2, 0.2)) * Lp / nS, h = hX + Ln[5] + rx.range(0, 0.2);
            for (let k = 0; k < per && i < NT; k++, i++) { iA.set(Ln.slice(0, 4), i * 4); iB.set([sq + k * gap * Math.sign(-v), v, h + rx.range(0, 0.3), 0], i * 4); iC.set([rx.range(-JIT, JIT), rx(), rx.range(1.25, 1.45), 0], i * 4); } }
        }
        for (; i < NT; i++) { iA.set(crossLanes[0].slice(0, 4), i * 4); iB.set([rx() * Ls[0], 12.5, hX + rx.range(0, 0.7), 0], i * 4); iC.set([rx.range(-JIT, JIT), rx(), rx.range(1.25, 1.45), 0], i * 4); }      // (what the division left over: single birds on the first lane)
      }
      for (let i = 0; i < N;) {
        let pick = r() * total, Ln = live[live.length - 1]; for (const l of live) { pick -= l[4]; if (pick <= 0) { Ln = l; break; } }
        const Lp = trackAt(Ln, 0, 0, o), n = Math.min(N - i, r.int(6, 22)), gap = r.range(1.2, 2), s0 = r() * Lp, v = r.range(11, 14) * r.sign(), h = r.range(1.3, 3.4);
        for (let k = 0; k < n; k++, i++) {
          iA.set(Ln.slice(0, 4), i * 4); iB.set([s0 + k * gap * Math.sign(-v), v, h + r.range(-0.25, 0.25), 0], i * 4); iC.set([r.range(-JIT, JIT), r(), r.range(1.25, 1.45), 0], i * 4);
        }
      }
      // the strings on the wheel (in file, each bird a little off the file's line and height)
      for (let q = 0, i = NT, ra = F.legahead, ph = ra() * TAU; q < WHEEL.strings && NW > 0; q++) { const th0 = ph + (q + ra.range(-0.15, 0.15)) / WHEEL.strings * TAU, gap = ra.range(1.3, 1.7);
        for (let k = 0; k < perW; k++, i++) { const R = WHEEL.R + ra.range(-0.25, 0.25); iA.set([WHEEL.x, WHEEL.h + ra.range(0, 0.35), WHEEL.z, R], i * 4); iB.set([th0 - k * gap / WHEEL.R, WHEEL.w * R, 0.15, 1], i * 4); iC.set([0, ra(), ra.range(1.25, 1.45), 0], i * 4); } }
      if (NT + NW) add(bodyMesh(puffinG, mat(FLY_VERT_LEG, BODY_FRAG, { uFlap: V3(44, 0.95, 0), uCoat: V4(0, 4, 0.15, 0) }, { side: THREE.DoubleSide }), NT + NW, { iA, iB, iC }, 'organ-puffins-leg'), 'puffins');
      info.lanes.birds = N; info.cross.birds = NX; info.ahead.birds = NW;
      await yld();
    }

    // ---------------- the leg's own rafts (order 14; order 15: from a stream of their own, LEG_LIFE of the mouth's number, 1.5 m
    // and more west of the slot's line, none within 0.8 m of a bird of the mouth's rafts), in the leg's frame: along
    // the run, on open water 3 m and more outside the plinth's foot; fewer toward the cliff, where the water is narrow.
    // ONE RAFT, TWENTY BIRDS, LIES ON THE CLIFF'S SIDE OF THE RUN (order 17; a law of the place: these birds gather
    // on the water close in below the rock they nest on), most of its seats 3 to 6 m left of the line and none
    // nearer than 2.9 m, and patters off east along the run and toward the cliff: at
    // the route's clock for u 0.105 (the lens 15 m short of it: the raft lies where the lens is abreast of it at the
    // flown metre at which it was abreast of the mouth's pattering raft on the S), each bird within 0.6 s of that,
    // running 10 to 17 m on along the run and away from the line, TOWARD THE CLIFF (9 to 15 m along the run, 4.5
    // to 7.5 m in); each strike of a bird on the water leaves one splash where it struck (the streaks, below). IT IS THE
    // MIRROR, across the run's line, of the raft order 15 had seaward of the run, by three signs (the side its
    // seats are dealt to, the side its runs go to, the side its station lies on): the same deal, the same
    // station along the run, the same distance from the line, the same second, the same length of run; A MIRROR
    // BUT FOR TWO LAWS (order 18). A BIRD FACES THE WAY IT RUNS: its heading is taken from its run and it draws
    // no other (order 20: no draw is taken and not used; a bird of the mouth's pattering raft keeps the heading
    // it is dealt). NO TWO OF ITS SEATS LIE NEARER THAN HALF A METRE
    // (apart, by place: a seat nearer than that to one already taken is not taken and is dealt again; from the
    // first seat so left out the deal runs on otherwise than order 15's, and the raft is the mirror in its laws,
    // no longer bird for bird). That the birds patter and settle and do not lift is the design. Order 15's raft
    // is not kept. NO BIRD OF THE LEG'S OTHER RAFTS SITS WITHIN A METRE OF ITS SEATS OR OF ITS RUNS (offPat: a
    // seat so near is not taken and is dealt again; the raft that patters is dealt first).
    // TWO LAWS MORE (order 19), of the birds among themselves, by place and by the route's clock; they read
    // nothing of the lens or of any view. NO TWO BIRDS OF THE LEG'S RAFTS SIT NEARER THAN 0.4 m (roomy: every seat of every raft
    // of the leg against every seat taken before it, the pattering seats with them; a seat nearer is not taken
    // and is dealt again, so a close raft lies a little wider on the water, and one that cannot hold its number
    // in its tries holds fewer and a later raft takes the rest). NO TWO PATTERING BIRDS ARE NEARER THAN 0.3 m AT
    // ANY MOMENT (meets): a bird's place is its seat and its run times 1 - exp(-0.35 s) from its own second on
    // (the body's law: raftM's uPiv.z), so from the second the later of two birds goes the line between them is
    // a straight piece in exp(-0.35 s), and before it, while one runs and the other sits, another: the least
    // distance of two birds over all time is the least of the origin's distances to those two pieces, exact; the
    // end, where both have settled, is the second piece's end. A bird that would come nearer to one taken before
    // it is dealt again whole (seat, run and second). The mouth's rafts keep neither law: they are as they were
    // (two of their birds may sit in one place or run through each other). Both distances are a millimetre over
    // the law in the build (0.401, 0.301) for the rounding of the buffers.
    // A SITTING BIRD'S HEADING IS ONE LAW FOR EVERY RAFT OF THIS WORLD (order 20): the leg's sitting birds face
    // as the mouth's do, in the world's own bearings (the nose within 0.7 radians of due seaward, 15 in a hundred
    // turned about), not turned with the leg's frame
    {
      const r = F.legrafts, N = Math.round(LEG_LIFE * 300 * density), iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), iC = new Float32Array(N * 4);
      const stacks = A.stacks, w2 = { x: 0, z: 0 }, free = (x, z) => { for (let k = 0; k < mRaft.length; k += 2) if (Math.hypot(mRaft[k] - x, mRaft[k + 1] - z) < 0.8) return false; return true; };
      // (x, z: about the brief's straight leg; in the world: west of the slot's line, off the stacks, the water 4 m deep and more by the part's depthAt: 3 m outside the plinth's foot; clear of the mouth's rafts)
      const okAt = (x, z) => { if (Math.abs(x - PX) < 2.9 || z <= 43) return false; toW(x, z, w2); return slotWest(w2.x, w2.z) >= 1.5 && stacks.every((q) => Math.hypot(w2.x - q.x, w2.z - q.z) > 13) && hero.depthAt(w2.x, w2.z) > 4 && free(w2.x, w2.z); };
      let i = 0, raftOut = 0, runOut = 0;
      const pat0 = patter.length, offPat = (x, z) => { for (let k = pat0; k < patter.length; k++) { const q = patter[k], t = clamp(((x - q[0]) * q[2] + (z - q[1]) * q[3]) / (q[2] * q[2] + q[3] * q[3]), 0, 1); if (Math.hypot(x - q[0] - q[2] * t, z - q[1] - q[3] * t) < 1) return false; } return true; };
      const apart = (x, z) => { for (let k = pat0; k < patter.length; k++) if (Math.hypot(x - patter[k][0], z - patter[k][1]) < 0.5) return false; return true; };
      const roomy = (x, z) => { for (let k = 0; k < i; k++) if (Math.hypot(x - iA[k * 4], z - iA[k * 4 + 2]) < 0.401) return false; return true; };      // (order 19: no seat within 0.4 m of one taken)
      const off0 = (ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = clamp(-(ax * dx + az * dz) / Math.max(dx * dx + dz * dz, 1e-9), 0, 1); return Math.hypot(ax + dx * t, az + dz * t); };      // (how near the origin a straight piece comes)
      const meets = (x, z, rx, rz, t0) => {      // (order 19: would this bird come within 0.3 m of a pattering bird taken before it, at any moment: the two straight pieces, above)
        for (let k = pat0; k < patter.length; k++) {
          const q = patter[k], first = t0 <= q[4], e = Math.exp(-0.35 * Math.abs(q[4] - t0)), ux = first ? rx : -q[2], uz = first ? rz : -q[3], vx = first ? q[2] : -rx, vz = first ? q[3] : -rz;
          const ax = x - q[0], az = z - q[1], bx = ax + ux * (1 - e), bz = az + uz * (1 - e);
          if (Math.min(off0(ax, az, bx, bz), off0(bx, bz, ax + ux - vx, az + uz - vz)) < 0.301) return true;
        }
        return false;
      };
      const group = (cx, cz, n, spread, pat) => {
        for (let k = 0, tries = 0; k < n && i < N && tries < n * 12; tries++) {
          const x0 = cx + (pat ? -1 : 1) * r.gauss() * spread, z0 = cz + r.gauss() * spread * 1.4; if (!okAt(x0, z0)) continue;
          const x = LEGF.x - z0, z = LEGF.y + x0;      // (into the world by the leg's frame; a pattering bird's run is turned a quarter with it and gives its heading, below; a sitting bird's heading is not turned)
          if (pat ? !apart(x, z) : !(offPat(x, z) && roomy(x, z))) continue;
          iA.set([x, 0.06, z, pat ? 0 : r.range(-0.7, 0.7) + (r.chance(0.15) ? Math.PI : 0)], i * 4); iB.set([r.range(0.95, 1.1), r(), 0, 1], i * 4);
          // (A RAFT BIRD KEEPS ITS CLEAR AIR OR IS NOT THERE: its place on the water, and for a pattering bird its whole
          // run an eighth at a time, against the flown line in plan (the lens flies over the water: the plan's distance
          // is the least it can be); under CLEAR it is left out and dealt again elsewhere; so is a pattering bird
          // whose run would end nearer the slot's line than 1.5 m)
          let air = dPlan(x, z) - 0.22;
          if (pat) { const pa = r.range(4.5, 7.5), pb = r.range(-15, -9); iC.set([-pb, 0, -pa, S.secAt(0.105) + r.range(-0.6, 0.6)], i * 4); iA[i * 4 + 3] = Math.atan2(iC[i * 4], iC[i * 4 + 2]); for (let g = 0.125; g <= 1; g += 0.125) air = Math.min(air, dPlan(x + iC[i * 4] * g, z + iC[i * 4 + 2] * g) - 0.22); if (slotWest(x + iC[i * 4], z + iC[i * 4 + 2]) < 1.5) air = 0; } else iC.set([0, 0, 0, 1e6], i * 4);
          if (air < CLEAR) { raftOut++; continue; }
          if (pat && meets(x, z, iC[i * 4], iC[i * 4 + 2], iC[i * 4 + 3])) { runOut++; continue; }
          if (pat) patter.push([x, z, iC[i * 4], iC[i * 4 + 2], iC[i * 4 + 3], 1]);
          note('rafts', air);
          i++; k++;
        }
      };
      group(PX - 4.5, S_Z0 - toReal(S_Z0 - 63), 20, 1.3, true);
      for (let tries = 0; i < N && tries < 60; tries++) { const side = r.sign(), off = 3.6 + (side > 0 ? 42 : 16) * r() * r(); group(PX + side * off, r.range(46, 104), r.int(10, 30), r.range(1.4, 3.6), false); if (tries % 6 === 5) await yld(); }
      if (i) add(bodyMesh(raftG, raftM, i, { iA, iB, iC }, 'organ-rafts-leg'), 'rafts'); info.rafts = { birds: i, leftOut: raftOut, pattering: patter.length - pat0, runsDealtAgain: runOut };
      await yld();
    }

    // ---------------- THE PORTAL'S DISC STAYS CLEAR, by place: from every point of the route that can see the disc (a straight
    // line to it lies in the blowhole's bore or under the cave's roof, by the part's own measures) no bird, at any moment of
    // its lane, stands before it. That leaves the bell under the bend for birds on the wing, and seats on the wall's steps.
    const e2x = new THREE.Vector3(0, AXD.z, -AXD.y);              // with x, the two ways across the blowhole's axis
    const bore = (s) => 6.3 + 2.7 * (1 - ss(9, 21, s));           // the blowhole's radius s metres up its axis (the part's)
    const eyes = [], q3 = new THREE.Vector3(); let uSee = -1;
    const inAir = (x, y, z) => { q3.set(x, y, z).sub(AX0); const s = q3.dot(AXD); if (s > -3 && s < 62 && q3.lengthSq() - s * s < bore(s) ** 2) return true; const c = hero.ceilAt(x, z); return c > 0 && y < c; };
    {
      const e = new THREE.Vector3(), t = new THREE.Vector3();
      for (let k = 0, u = 0.6; u < 0.9995; u += 0.0025, k++) {
        path.pointAt(u, e); if ((e.x - A.portal.x) * AXD.x + (e.y - A.portal.y) * AXD.y + (e.z - A.portal.z) * AXD.z > -0.5) break;
        let sees = false;
        for (let j = 0; j < 9 && !sees; j++) {
          const th = j * TAU / 8, rr = j === 8 ? 0 : DISC * 0.85; t.copy(A.portal); t.x += rr * Math.cos(th); t.addScaledVector(e2x, rr * Math.sin(th));
          const n = Math.ceil(e.distanceTo(t) / 2); let open = true;
          for (let i = 1; i < n && open; i++) open = inAir(e.x + (t.x - e.x) * i / n, e.y + (t.y - e.y) * i / n, e.z + (t.z - e.z) * i / n);
          sees = open;
        }
        if (sees) { eyes.push(e.clone()); if (uSee < 0) uSee = u; }
        if (k % 16 === 15) await yld();
      }
      info.disc = { eyes: eyes.length, from: uSee };
    }
    // (each eye's place, the way from it to the disc's middle and how far up the axis that is: worked out once an eye,
    // and the eyes laid in the order of their own height along the axis, the lowest first: a ball stands before no eye
    // that is higher along the axis than its own top, so the asking ends at the first such eye, with a thousandth of
    // a millimetre to spare; whether ANY eye has it before the disc does not hang on the order they are asked in)
    const EN = eyes.length, eyeC = new Float64Array(EN * 8);
    { const eA = eyes.map((e) => e.x * AXD.x + e.y * AXD.y + e.z * AXD.z), ord = eyes.map((e, i) => i).sort((a, b) => eA[a] - eA[b] || a - b);
      for (let n = 0; n < EN; n++) { const e = eyes[ord[n]], px = A.portal.x - e.x, py = A.portal.y - e.y, pz = A.portal.z - e.z, pe = px * AXD.x + py * AXD.y + pz * AXD.z; eyeC.set([e.x, e.y, e.z, px, py, pz, pe, eA[ord[n]]], n * 8); } }
    // does a ball of radius rb at c stand in the cone from one of those eyes to the WHOLE disc (0.15 m beside it)? The cone's
    // section at the ball's own height up the axis: its centre and its radius; a ball that reaches back through the disc's
    // own plane counts, one wholly past the plane does not
    const beforeDisc = (c, rb) => {
      const cx = c.x, cy = c.y, cz = c.z, ax = AXD.x, ay = AXD.y, az = AXD.z, top = cx * ax + cy * ay + cz * az + rb - 0.01 + 1e-6;
      for (let o = 0, oe = EN * 8; o < oe && eyeC[o + 7] <= top; o += 8) {
        const ex = eyeC[o], ey = eyeC[o + 1], ez = eyeC[o + 2], pe = eyeC[o + 6];
        const dn = (cx - ex) * ax + (cy - ey) * ay + (cz - ez) * az; if (dn + rb <= 0.01 || dn - rb >= pe) continue;
        const k = clamp(dn, 0.01, pe) / pe, sx = cx - ex - eyeC[o + 3] * k, sy = cy - ey - eyeC[o + 4] * k, sz = cz - ez - eyeC[o + 5] * k, al = sx * ax + sy * ay + sz * az;
        if (Math.sqrt(Math.max(0, sx * sx + sy * sy + sz * sz - al * al)) < (DISC + 0.15) * k + rb) return true;
      }
      return false;
    };
    await yld();
    // THE HEADLAND IS SOLID. The part draws its rock as one skin of columns; where a sight line slips through a hairline
    // between two pipes of the cave's wall and no other rock stands behind, it would end on this world's bright sky (two
    // such lines stood over the water at the bell's foot). Dark unlit walls stand inside the rock: one behind the apse and
    // the blowhole (tilted with its axis, 14 m behind it), one behind each side of the nave: such a line now ends on
    // the dark of the headland's inside. None of them stands in the cave's air (info.liner.inAir counts the places of
    // the walls, on a metre's grid, where the part has open air)
    {
      const P = [], I = [], c = new THREE.Vector3(); let bad = 0, n = 0;
      const quad = (a, b, cc, d) => { const k = P.length / 3; for (const q of [a, b, cc, d]) P.push(q[0], q[1], q[2]); I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      const back = (x, s) => { c.copy(AX0).addScaledVector(AXD, s).addScaledVector(e2x, 14); return [x, c.y, c.z]; };
      quad(back(-26, -12), back(19, -12), back(19, 38), back(-26, 38));
      quad([-23, -8, -6], [-23, -8, -112], [-23, 30, -112], [-23, 30, -6]);
      quad([16, -8, -6], [16, -8, -112], [16, 30, -112], [16, 30, -6]);
      for (let x = -26; x <= 19; x++) for (let s = -12; s <= 38; s++) { const q = back(x, s); n++; if (inAir(q[0], q[1], q[2])) bad++; }
      await yld();
      for (const x of [-23, 16]) for (let z = -6; z >= -112; z--) for (let y = -8; y <= 30; y += 2) { n++; if (inAir(x, y, z)) bad++; }
      await yld();
      // THE DISC IS NOT SEEN BEFORE THE BELL. The portal's disc stands in the lip, its upper half over the turf; a straight
      // from the sea that slips through a hairline of the face, or one from the nave through a hairline of the roof,
      // could reach a patch of it through the hollow of the headland: a bright speck on the cliff. Three more dark walls
      // inside the rock close every such straight BY PLACE (no test of the columns is needed: each straight is cut by a
      // wall, whatever the columns do): (A) upright behind the face, 14 m in, from 26 m (over the cave's roof) to 1.4 m
      // under the part's true turf over it (44.6 m at most); (B) a floor over the cave's roof at 26 m, from 6 m in back
      // to z -79 (THROUGH A HOLE IN THE ROOF'S MOSAIC more than a metre wide, on a few deals, a square metre or two of
      // it shows from below: the dark of the headland's inside over the roof, far off); (C) a wall leaning with
      // the blowhole's axis 11 m south of it, from under that floor's end down to 12 m up the axis (behind the bell's
      // own wall). MEASURED HERE, on the flown line (the leg along the cliff with it): for every eye of the route, a step of 0.0025 of its u
      // at a time, and every place of the disc on a grid of 0.7 m (to 0.2 m outside its rim), the straight from the eye to
      // the place is cut by one of this world's dark walls: info.liner.shut tells up to which u that holds for every
      // straight (the whole way outside and through the nave and the choir, to a few metres before the disc comes into
      // view up the bore), and how many straights there are before the mouth and how many of them are open (none).
      // None of the walls stands in the cave's air, over the turf, or before the disc for an eye that sees it:
      // info.liner.inAir, .overTurf, .beforeDisc (places of the walls, on a metre's grid: none)
      const front = (x, s) => { c.copy(AX0).addScaledVector(AXD, s).addScaledVector(e2x, -11); return [x, c.y, c.z]; };
      // (A) STANDS UNDER THE TURF, BY THE PART'S TRUE CAP (order 9c): at 6 m in it stood among the free pipes of the
      // towers, where the cap is broken away and set back, and rose over them as a flat dark bar on the skyline. It
      // stands 14 m in now, behind the cap's set-back face, and ITS TOP FOLLOWS THE TURF OVER IT: a metre of x at a
      // time, 1.4 m under the lowest the part's own cap lies over the strip (its ground mesh's own triangles, kinds 0
      // and 1: capTop), never over 44.6 m; where no cap lies over a strip, or lower than 28.4 m, the strip is left out.
      const WZ = -14, capTris = [];          // (nine numbers a triangle, one after another)
      { const gg = hero.object.getObjectByName('organ-cave-ground'), gp = gg && gg.geometry.getAttribute('position'), gi = gg && gg.geometry.getIndex(), gk = gg && gg.geometry.getAttribute('aK');
        if (gp && gi) for (let t = 0; t < gi.count; t += 3) {
          const ia = gi.getX(t), ib = gi.getX(t + 1), ic = gi.getX(t + 2); if (t % 9000 === 0) await yld(); if (gk && gk.getX(ia) > 1.5) continue;
          const ax = gp.getX(ia), az = gp.getZ(ia), bx = gp.getX(ib), bz = gp.getZ(ib), cx = gp.getX(ic), cz = gp.getZ(ic);
          if (Math.max(ax, bx, cx) < -25 || Math.min(ax, bx, cx) > 18 || Math.max(az, bz, cz) < WZ - 1.5 || Math.min(az, bz, cz) > WZ + 1.5) continue;
          capTris.push(ax, gp.getY(ia), az, bx, gp.getY(ib), bz, cx, gp.getY(ic), cz);
        } }
      const capTop = (x, z) => {          // the turf's height over a place, by the cap's own triangles (-99: no cap over it)
        let hi = -99;
        for (let o = 0; o < capTris.length; o += 9) {
          const ax = capTris[o], ay = capTris[o + 1], az = capTris[o + 2], bx = capTris[o + 3], by = capTris[o + 4], bz = capTris[o + 5], cx = capTris[o + 6], cy = capTris[o + 7], cz = capTris[o + 8];
          const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-9) continue;
          const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l3 = 1 - l1 - l2; if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
          hi = Math.max(hi, l1 * ay + l2 * by + l3 * cy);
        }
        return hi;
      };
      const Q0 = [[[[-23, 26, -6], [16, 26, -6], [16, 26, -79], [-23, 26, -79]], 40, 76], [[front(-12, 12), front(12, 12), front(12, 22), front(-12, 22)], 40, 76]];
      let underTurf = 99, stripsOut = 0;
      { let x0 = -23, top0 = -1;          // (strips of one top are laid as one quad)
        for (let x = -23; x <= 16; x++) {
          let top = -1;
          if (x < 16) { let lo = 99; for (const dx of [0, 0.5, 1]) for (const dz of [-0.7, 0, 0.7]) lo = Math.min(lo, capTop(x + dx, WZ + dz)); top = Math.min(44.6, lo - 1.4); if (top < 27) { top = -1; stripsOut++; } else underTurf = Math.min(underTurf, lo - top); await yld(); }
          if (x > x0 && Math.abs(top - top0) > 0.02) { if (top0 > 0) Q0.push([[[x0, 26, WZ], [x, 26, WZ], [x, top0, WZ], [x0, top0, WZ]], Math.max(2, 2 * (x - x0)), 24]); x0 = x; }
          if (x === x0) top0 = top;
        }
      }
      // (D) THE NAVE'S WEST WALL, CARRIED UP (order 14: the leg along the cliff has the headland on its left hand, and
      // looks at it from the west). From the run a straight to the disc crosses the plane of the nave's west wall
      // (x -23) higher than that wall stands (30 m): up to 47 m, 72 m in, where the turf of the lip's mound lies at
      // 52.6 m. One more dark wall in that plane closes them BY PLACE: from 29.5 m up to 0.8 m over the highest such
      // straight (the straights from every metre of the leg west of the wall to the disc's rim, 0.2 m outside it:
      // the leg is level there, so the highest of them lie on one slope, that of the steepest from the leg's first
      // metre; the wall's top runs on that slope and then level at the highest crossing), from half a metre south of
      // the southmost crossing to half a metre north of the northmost. It stands in the rock west of the cave, under
      // the turf by 3 m and more (measured with the other walls, below: info.liner.overTurf), behind the floor over
      // the roof (B) for every eye that is under that floor and east of it: no place of the route from the join on
      // has it in a straight that B, or the west wall under it, does not cut first.
      let westQuads = 0, westWall = null;
      { const e0 = new THREE.Vector3(), rim = [], kp = []; let zS = -999, zN = 999, yHi = 0, H = -99, ks = 0;
        for (let j = 0; j < 24; j++) { const th = j / 24 * TAU, a = (DISC + 0.2) * Math.cos(th), b = (DISC + 0.2) * Math.sin(th); rim.push(new THREE.Vector3(A.portal.x + a + e2x.x * b, A.portal.y + e2x.y * b, A.portal.z + e2x.z * b)); }
        flown.posAtDist(0, e0); for (const t of rim) ks = Math.max(ks, (t.y - e0.y) / (e0.z - t.z));
        for (let d = 0; d < dN; d += 1) { flown.posAtDist(d, e0); if (e0.x > -24) break;
          for (const t of rim) { const f = (-23 - e0.x) / (t.x - e0.x), y = e0.y + (t.y - e0.y) * f, z = e0.z + (t.z - e0.z) * f; if (y > 29.5) kp.push(z, y); } }
        for (let i = 0; i < kp.length; i += 2) { zS = Math.max(zS, kp[i]); zN = Math.min(zN, kp[i]); yHi = Math.max(yHi, kp[i + 1]); H = Math.max(H, kp[i + 1] + ks * kp[i]); }
        if (kp.length) {
          zS += 0.5; zN -= 0.5; const yT = yHi + 0.8, zT = Math.max(zN, Math.min(zS, (H + 0.8 - yT) / ks)), yS = Math.min(yT, H + 0.8 - ks * zS);
          Q0.push([[[-23, 29.5, zS], [-23, 29.5, zT], [-23, yT, zT], [-23, yS, zS]], Math.max(2, Math.round(zS - zT)), 20]); westQuads++;
          if (zT > zN + 0.01) { Q0.push([[[-23, 29.5, zT], [-23, 29.5, zN], [-23, yT, zN], [-23, yT, zT]], Math.max(2, Math.round(zT - zN)), 20]); westQuads++; }
          westWall = { x: -23, fromZ: zS, toZ: zN, levelFromZ: zT, top: yT, topAtItsSouthEnd: yS, crossings: kp.length / 2 };
        }
        await yld(); }
      let over = 0, before = 0;
      for (const [Q, ni, nj] of Q0) {
        quad(Q[0], Q[1], Q[2], Q[3]);
        for (let i = 0; i <= ni; i++) for (let j = 0; j <= nj; j++) {
          if (j % 26 === 0) await yld();
          const a = i / ni, b = j / nj, x = lerp(lerp(Q[0][0], Q[1][0], a), lerp(Q[3][0], Q[2][0], a), b), y = lerp(lerp(Q[0][1], Q[1][1], a), lerp(Q[3][1], Q[2][1], a), b), z = lerp(lerp(Q[0][2], Q[1][2], a), lerp(Q[3][2], Q[2][2], a), b);
          n++; if (inAir(x, y, z)) bad++; if (y > hero.topAt(x, z) - 1.2) over++;
          // (before the disc: in the cone from an eye that sees the disc, with nothing but air between that eye and the place;
          // the straight is asked from the place back to the eye, the same half metres of it: a wall's place stands in rock, met at once)
          if (beforeDisc(c.set(x, y, z), 0.3)) for (const e of eyes) { const m = Math.ceil(e.distanceTo(c) / 0.5); let open = true; for (let k = m - 1; k >= 1 && open; k--) open = inAir(e.x + (x - e.x) * k / m, e.y + (y - e.y) * k / m, e.z + (z - e.z) * k / m); if (open) { before++; break; } }
        }
        await yld();
      }
      // every straight from the route to the disc against the walls (each quad as two triangles)
      const T = []; for (let k = 0; k < I.length; k += 3) T.push([0, 1, 2].map((j) => new THREE.Vector3(P[I[k + j] * 3], P[I[k + j] * 3 + 1], P[I[k + j] * 3 + 2])));
      const TE = T.map(([a, b, cc]) => [a, b.clone().sub(a), cc.clone().sub(a)]), dv = new THREE.Vector3(), pv = new THREE.Vector3(), tv = new THREE.Vector3(), qv = new THREE.Vector3(), ev = new THREE.Vector3(), tg = new THREE.Vector3();
      // (the triangle that cut the last straight is asked first, then the others in their order: whether ANY cuts it does
      // not hang on the order)
      // cutBy follows the ray-triangle test of Moller and Trumbore, the branch without culling, the hit kept only between the straight's ends: BROUGHT IN, see the head.
      const cutBy = (e, tr) => { const a = tr[0], e1 = tr[1], e2 = tr[2]; pv.crossVectors(dv, e2); const det = e1.dot(pv); if (Math.abs(det) < 1e-9) return false; tv.copy(e).sub(a); const uu = tv.dot(pv) / det; if (uu < 0 || uu > 1) return false; qv.crossVectors(tv, e1); const vv = dv.dot(qv) / det; if (vv < 0 || uu + vv > 1) return false; const tt = e2.dot(qv) / det; return tt > 0 && tt < 1; };
      let cutLast = 0;
      const cut = (e, t) => {
        dv.copy(t).sub(e);
        if (cutLast < TE.length && cutBy(e, TE[cutLast])) return true;
        for (let i = 0; i < TE.length; i++) if (i !== cutLast && cutBy(e, TE[i])) { cutLast = i; return true; }
        return false;
      };
      const spots = []; for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) { const a = i * 0.7, b = j * 0.7; if (Math.hypot(a, b) <= DISC + 0.2) spots.push(new THREE.Vector3(A.portal.x + a + e2x.x * b, A.portal.y + e2x.y * b, A.portal.z + e2x.z * b)); }
      let shutTo = -1, sea = 0, seaOpen = 0, uMouth = 0; const uEnd = toU(uSee);
      for (let u = 0, k = 0; u < uEnd; u += 0.0025, k++) {
        flown.pointAt(u, ev); let open = 0; for (const t of spots) if (!cut(ev, t)) open++;
        if (ev.z > 0) { sea += spots.length; seaOpen += open; uMouth = u; }
        if (open && shutTo < 0) shutTo = u;
        if (k % 3 === 2) await yld();
      }
      info.liner = { places: n, inAir: bad, overTurf: over, beforeDisc: before, behindTheFace: { z: WZ, quads: Q0.length - 2 - westQuads, stripsLeftOut: stripsOut, leastUnderTheTurf: underTurf }, west: westWall, shut: { to: shutTo < 0 ? uEnd : shutTo, discSeenFrom: uEnd, mouthAt: uMouth, straightsFromTheSea: sea, open: seaOpen } };
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      const m = new THREE.Mesh(g, mat('void main(){ gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }', 'void main(){ gl_FragColor = vec4(.004, .006, .007, 1.); }', {}, { side: THREE.DoubleSide }));
      m.frustumCulled = false; m.name = 'organ-headland-inside'; m.userData.triangles = I.length / 3; add(m, 'headland inside');
    }
    await yld();
    // the part's own fringe of grass round the lip, by the same test: root, tip and the tip at its furthest lean toward the axis
    {
      const gm = hero.object.getObjectByName('organ-cave-grass'), iG = gm && gm.geometry.getAttribute('iG'), v = new THREE.Vector3(); let n = 0, near = 99;
      if (iG) for (let i = 0; i < iG.count; i++) {
        const x = iG.getX(i), y = iG.getY(i), z = iG.getZ(i), h = iG.getW(i);
        q3.set(x, y, z).sub(AX0); const sa = q3.dot(AXD), rho = Math.sqrt(Math.max(0, q3.lengthSq() - sa * sa)); if (rho > 9) continue;
        near = Math.min(near, rho); let hx = -x, hz = AX0.z + AXD.z * sa - z; const hl = Math.hypot(hx, hz) || 1; hx *= 0.45 / hl; hz *= 0.45 / hl;
        if (beforeDisc(v.set(x, y, z), 0.06) || beforeDisc(v.set(x, y + h, z), 0.06) || beforeDisc(v.set(x + hx, y + h, z + hz), 0.06)) n++;
        if (i % 600 === 599) await yld();
      }
      info.disc.grass = { before: n, nearest: near };
    }
    await yld();

    // ---------------- kittiwakes: on the part's ledges, wheeling before the mouth, turning in the blowhole's bell
    {
      const r = F.sitters, seats = A.kittiwakes, N0 = Math.min(seats.length, Math.round(100 * density)), iA = new Float32Array(N0 * 4), iB = new Float32Array(N0 * 4), iC = new Float32Array(N0 * 4), L = 0.4;
      const order = r.shuffle(seats.map((_, k) => k)).slice(0, N0), v = new THREE.Vector3(); let N = 0, left = 0, near = 0;
      for (let k = 0; k < N0; k++) {
        const p = seats[order[k]], chim = p.z < -80 && p.y > 13, i = N; let yaw = r.range(-0.9, 0.9);
        if (chim) { v.copy(p).sub(AX0); const s = v.dot(AXD); v.addScaledVector(AXD, -s); yaw = Math.atan2(-v.x, -v.z) + r.range(-0.5, 0.5); }
        const size = r.range(0.95, 1.1), ph = r();
        if (chim && beforeDisc(v.set(p.x, p.y + 0.15, p.z), 0.3)) { left++; continue; }
        const air = dTo(p.x, p.y + 0.1, p.z) - 0.3; if (air < CLEAR) { near++; continue; }      // (a seat within the line's clear air stays empty)
        iA.set([p.x, p.y + 0.05, p.z, yaw], i * 4); iB.set([size, ph, chim ? 2 : 0, 0], i * 4); iC.set([0, 0, 0, 1e6], i * 4); N++;
        note('kittiwakes sitting', air);
      }
      info.disc.sittersLeftOut = left; info.sittersTooNear = near;
      const G = duckGeo({ L, nowing: true, back: '#a4abb3', belly: '#eef0ec', bill: '#d8c23a', cheek: '#eef0ec', crown: '#eef0ec', tail: '#141618', deep: 0.04, split: 0.3 });
      const m = mat(POSED_VERT, BODY_FRAG, { uHead: V4(0, 0.3, 1.1, 0.25 * L), uWing: V4(0, 0, 0, 0.19 * L), uSwim: V4(0, 0, 0, 0), uPiv: V3(0.1 * L, 0.1 * L, 1), uCoat: V4(0, 4, 0.1, 0) }, {});
      add(bodyMesh(G, m, N, { iA, iB, iC }, 'organ-kittiwakes-sitting'), 'kittiwakes');
      await yld();
    }
    {
      const r = F.wheels, rh = F.bell, galeK = lookId === 'gale' ? 2 : 1, nW = Math.round(34 * density * galeK), want = Math.round(26 * density * galeK), q = new THREE.Vector3(), lanes = [];
      // small level wheels in the bell's two side pockets, east and west of the sight lines up to the disc: a lane is taken
      // only if at every point of its lap (48 places round it, at its highest, middle and lowest) the bird's centre is
      // 0.91 m and more in plan (its half span of 0.66 m and 0.25 beside) from every column of the part's true rock that
      // stands within half a metre of its height, lies 1.06 m and more inside the bore's own radius, is outside the cone
      // to the disc as a ball of its half span, and keeps its clear air from the line
      for (let tries = 0; lanes.length < 6 && tries < 360; tries++) {
        const sg = tries % 2 ? 1 : -1, s0 = rh.range(6, 15), R = rh.range(1, 2.3), wob = rh.range(0.25, 0.55), cx = sg * rh.range(3.9, 6), cy = AX0.y + AXD.y * s0, cz = AX0.z + AXD.z * s0 + rh.range(-1.5, 1.5); let m = 1e9;
        for (let k = 0; k < 48 && m > 0; k++) for (const dy of [-wob, 0, wob]) {
          const th = k / 48 * TAU; q.set(cx + R * Math.cos(th), cy + dy, cz + R * Math.sin(th));
          q3.copy(q).sub(AX0); const s = q3.dot(AXD), rho = Math.sqrt(Math.max(0, q3.lengthSq() - s * s));
          if (s < 4 || rho + 0.66 > bore(s) - 0.4 || rockGap(q.x, q.z, q.y - 0.5, q.y + 0.5) < 0.91 || beforeDisc(q, 0.66)) { m = -1; break; }
          m = Math.min(m, dTo(q.x, q.y, q.z) - 0.61);
        }
        if (m >= CLEAR && !lanes.some((o) => o[5] === sg && Math.abs(o[1] - cy) < 1.4 && Math.hypot(o[0] - cx, o[2] - cz) < 1.2)) lanes.push([cx, cy, cz, R, wob, sg, m]);
        if (tries % 8 === 7) await yld();
      }
      const nH = Math.min(want, lanes.length * 5);
      info.disc.bell = { lanes: lanes.length, birds: nH };
      const N = nW + nH, iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), iC = new Float32Array(N * 4);
      // (the first two are LOW AND NEAR: they turn 20 to 36 m before the mouth, 6.9 and 8.4 m up, over the line into
      // the mouth as the brief drew it. The leg's bend comes in under the second's lap and passes 3 m outside the
      // first's: the birds pass large over the way in; each is dealt twice as many birds as a high wheel)
      const low = [[PX + 1.5, 6.9, 30, 6.5], [PX - 2.5, 8.4, 20, 7.5]].map((w) => [...w, 1]), high = [[3, 13, 15, 7], [-9, 17, 13, 6], [14, 11, 17, 8], [2, 22, 18, 10], [-18, 9, 16, 7.5], [24, 15, 14, 6.5]].map((w) => [...w, 0]);
      const wheels = [low[0], low[1], high[0], low[0], high[1], low[1], high[2], high[3], high[4], high[5]].map((w) => [w[0], w[1], w[2], w[3], r.sign(), w[4]]);
      // (A WHEELING BIRD KEEPS ITS CLEAR AIR OR FLIES NOT: its whole lap, at its highest and lowest, measured against the
      // flown line; under CLEAR it is raised 0.4 m at a time, and one that never clears is left out: its size is nothing)
      let wheelOut = 0;
      for (let i = 0; i < nW; i++) {
        const w = wheels[i % wheels.length], R = w[3] + r.range(-0.8, 0.8), wob = r.range(0.5, 1.1) * (w[5] ? 0.5 : 1), size = r.range(0.95, 1.1);
        const lapAir = (y) => { let m = 99; for (let k = 0; k < 32; k++) { const th = k / 32 * TAU; for (const dy of [-wob, wob]) m = Math.min(m, dTo(w[0] + R * Math.cos(th), y + dy, w[2] + R * Math.sin(th)) - 0.55 * size); } return m; };
        let y = w[1], air = lapAir(y); for (let k = 0; k < 8 && air < CLEAR; k++) { y += 0.4; air = lapAir(y); }
        const ok = air >= CLEAR; if (ok) note('kittiwakes wheeling', air); else wheelOut++;
        iA.set([w[0], y, w[2], R], i * 4); iB.set([r() * TAU, r.range(6, 9) * w[4], wob, 1], i * 4); iC.set([0, r(), ok ? size : 0, 0], i * 4);
        if (i % 8 === 7) await yld();
      }
      info.wheelersLeftOut = wheelOut;
      for (let k = 0; k < nH; k++) { const [cx, cy, cz, R, wob, sg, m] = lanes[k % lanes.length], i = nW + k; iA.set([cx, cy, cz, R], i * 4); iB.set([rh() * TAU, rh.range(3, 4.2) * sg, wob, 1], i * 4); iC.set([0, rh(), rh.range(0.95, 1.1), 2], i * 4); note('kittiwakes in the bell', m); }
      const G = flyerGeo({ L: 0.4, span: 1, back: '#a4abb3', belly: '#eef0ec', bill: '#d8c23a', crown: '#eef0ec', cheek: '#eef0ec', deep: 0.045, wing: '#a4abb3', tip: '#101214' });
      add(bodyMesh(G, mat(FLY_VERT, BODY_FRAG, { uFlap: V3(19, 0.55, 0.45), uCoat: V4(0, 4, 0.1, 0) }, { side: THREE.DoubleSide }), N, { iA, iB, iC }, 'organ-kittiwakes-flying'), 'kittiwakes');
      await yld();
    }

    // ---------------- the water at a place at a moment of the route (the part's own law), and the highest it comes there
    const waterAt = (z, o) => lerp(o.level, o.sea, ss(2, 20, z)) + o.humpH * Math.exp(-(((z - o.humpZ) / Math.max(o.humpHalf, 1)) ** 2)) + o.pile * (1 - ss(-86, -56, z));
    // the highest and the lowest it comes at a place over the whole flight: tables by z (half a metre apart, from -96 to 44; the
    // higher, or the lower, of the two entries about a place)
    const WZ0 = -96, WN = 281, wHi = new Float32Array(WN).fill(-9), wLo = new Float32Array(WN).fill(9);
    const wRow = () => { for (let i = 0; i < WN; i++) { const y = waterAt(WZ0 + i * 0.5, sc); if (y > wHi[i]) wHi[i] = y; if (y < wLo[i]) wLo[i] = y; } };          // (one moment over all the places: a plain function)
    for (let k = 0; k <= 320; k++) { S.at(k / 320, sc); wRow(); if (k % 80 === 79) await yld(); }
    const wIdx = (z) => clamp(Math.floor((z - WZ0) * 2), 0, WN - 2);
    const waterMax = (z) => { const i = wIdx(z); return Math.max(wHi[i], wHi[i + 1]); };
    const waterMin = (z) => { const i = wIdx(z); return Math.min(wLo[i], wLo[i + 1]); };
    const v = new THREE.Vector3(), v2 = new THREE.Vector3();

    // ---------------- grey seals on the part's stumps: afloat while the water covers a stump, hauled out as it drops; heads lift
    // as we come round. WHERE A SEAL LIES: a stump is about a metre across and a seal two metres long, so a seat is taken
    // only where two tests pass. (1) lieFit: the tops under the body (six places along it on both flanks; at each the
    // highest top of a true column that comes within 8 cm of the place) let it lie, flat on the highest of them or
    // draped. (2) lying: no column of the part's true rock (each prism's own outline, foot and top, a wall's column like
    // any other) stands into the body or within 6 cm of it, from 0.2 m over its underside to its back at the highest
    // the water floats it and to its lifted head, at fifteen places along it on its middle line and both flanks, and
    // at its fore flippers. Near each of the part's anchors the flattest such seat and heading is taken (stumps within
    // 3.5 m and 0.9 m of its height, twelve headings); where there is none, no seal. Each is kept only if its whole
    // body, at every height the water can carry it to, keeps its clear air from the line.
    // the top of what stands at a place in the cave, by the part's true rock: the highest top of a prism that rises from
    // below (its foot under 4 m: the rest is the roof) and comes within 8 cm of the place; -9 over open water; 99 behind the wall
    const topHere = (x, z) => {
      if (hero.ceilAt(x, z) < 0) return 99;
      const L = RK.cells.get(Math.floor(x / 2) * 4096 + Math.floor(z / 2)); let top = -9; if (!L) return top;
      for (let n = 0; n < L.length; n++) {
        const id = L[n]; if (RK.y0[id] > 4 || RK.y1[id] - 0.1 <= top) continue;
        const c = RK.c[id], px = x - RK.x[id], pz = z - RK.z[id]; if (px * px + pz * pz > 1.7) continue; const E = RK.e[id] || edgesOf(id); let d = -9;
        for (let k = 0; k < 7 && d <= 0.115; k++) { const ex = E[k * 3], ez = E[k * 3 + 1], l = E[k * 3 + 2]; if (l > 1e-4) d = Math.max(d, ((px - c[k * 2]) * ez - (pz - c[k * 2 + 1]) * ex) / l); }
        if (d <= 0.115) top = RK.y1[id] - 0.1;
      }
      return top;
    };
    // A SEAL'S BODY AND THE ROCK: true where any prism stands into it or within 6 cm of it. The body lies along its heading
    // from tail (a = -1) to nose (a = 1), pitched; tested every 0.15 of its half length at its middle line and both
    // flanks (its own widths), and at its two fore flippers, between the heights lo(a) and hi(a) (what it lies on is under lo)
    const sealRock = (x, z, yaw, size, pitch, lo, hi) => {
      const sy = Math.sin(yaw), cy = Math.cos(yaw), cp = Math.cos(pitch);
      for (let a = -1.05; a <= 1.051; a += 0.15) {
        const hw = (a < -0.75 ? 0.19 : a < 0.35 ? 0.33 : a < 0.6 ? 0.25 : a < 0.9 ? 0.16 : 0.09) * size, ya = lo(a), yb = hi(a);
        for (const l of [-hw, 0, hw]) if (rockGap(x + (sy * a * cp) * size + cy * l, z + (cy * a * cp) * size - sy * l, ya, yb) < 0.06) return true;
      }
      for (const l of [-0.54, -0.4, 0.4, 0.54]) for (const a of [0.14, 0.26, 0.38]) if (rockGap(x + sy * a * cp * size + cy * l * size, z + cy * a * cp * size - sy * l * size, lo(a), lo(a) + 0.2) < 0.04) return true;
      return false;
    };
    // HOW A BODY LIES at a seat with a heading: null where the tops do not let it. Flat: of the tops under it (six places
    // along it on both flanks) none is more than 0.3 m over its seat's and they lie within 0.45 m of one another; the
    // body rests on the highest of them (rise). Draped (the pavement is a staircase of unequal stumps): its middle lies
    // on its seat (the tops there within 0.05 m above and 0.4 m below), and it is pitched head up or head down (to 30
    // degrees) so that nothing stands up into it, while head and tail may hang a metre at most over a lower stump or
    // the water, as a seal lies on one rock.
    const lieFit = (p, yaw, size, draped) => {
      const sy = Math.sin(yaw), cy = Math.cos(yaw), T = [], wl = waterMin(p.z) - 0.3; let lo = -0.5, hi = 0.5, tMax = 0, tMin = 0;
      for (let a = -1; a <= 1.001; a += 0.4) for (const l of [-0.22, 0.22]) {
        let t = topHere(p.x + (sy * a + cy * l) * size, p.z + (cy * a - sy * l) * size); if (t > 90) return null;
        if (draped && Math.abs(a) > 0.45) { t = Math.max(t, wl) - p.y; T.push(a * size, t); if (a > 0) lo = Math.max(lo, (t - 0.05) / (a * size)); else hi = Math.min(hi, (0.05 - t) / (-a * size)); continue; }
        t -= p.y; if (draped ? t > 0.05 || t < -0.4 : t > 0.3) return null; tMax = Math.max(tMax, t); tMin = Math.min(tMin, t);
      }
      if (!draped) return tMax - tMin > 0.45 ? null : { dev: 2 * tMax - tMin, pitch: 0, rise: tMax };
      if (lo > hi) return null;
      let best = null;
      for (let k = 0; k <= 4; k++) {
        const sp = lerp(lo, hi, k / 4); let gap = 0, ok = true;
        for (let i = 0; i < T.length && ok; i += 2) { const g = T[i] * sp - T[i + 1]; if (g > 1.05) ok = false; gap += Math.max(g, 0); }
        if (ok && (!best || 0.4 * Math.abs(sp) + 0.06 * gap < best.dev)) best = { dev: 0.4 * Math.abs(sp) + 0.06 * gap, pitch: Math.asin(sp), rise: 0 };
      }
      return best;
    };
    // HAULED OUT BY THE PASS: seats of this world's own, by place: stumps 2.9 to 6.4 m from the line where it runs back along
    // the pavement toward the mouth, standing out of the water as it is when the lens is nearest. They are dealt first.
    const stumpNear = []; for (let i = 0; i < A.stumps.length; i++) { stumpNear.push(path.nearestXZ(A.stumps[i].x, A.stumps[i].z)); if (i % 90 === 89) await yld(); }      // each stump's nearest point of the line, in plan
    const splashes = [], placed = [], floats = [];
    let lx0 = 0, lz0 = 0; { let ln = 0; for (let u = 0.5; u <= 0.64; u += 0.004) { lx0 += S.lens(u, 0); lz0 += S.lens(u, 2); ln++; } lx0 /= ln; lz0 /= ln; }      // the middle of the eddy the line makes in the choir
    {
      const passSeats = [];
      for (let i = 0; i < A.stumps.length; i++) {
        const q = A.stumps[i], nq = stumpNear[i]; if (nq.dist < 2.9 || nq.dist > 6.4 || nq.u < 0.54 || nq.u > 0.62) continue;
        const wl = waterAt(q.z, S.at(nq.u, sc)); if (q.y < wl - 0.05 || q.y > wl + 1.6) continue;
        passSeats.push({ p: q, d: nq.dist, near: 1.6, pass: true });
      }
      passSeats.sort((a, b) => a.d - b.d);
      const r = F.seals, seats = passSeats.concat(A.seals.map((p) => ({ p, d: dPlan(p.x, p.z), near: 3.5, pass: false })).sort((a, b) => a.d - b.d)), N = Math.min(seats.length, A.seals.length + 7), NF = 6;
      const iA = new Float32Array((N + NF) * 4), iB = new Float32Array((N + NF) * 4), iC = new Float32Array((N + NF) * 4);
      // the least clear air of a lying seal: its whole length, from its seat up to the highest the water can float it and its lifted head
      const least = (p, yaw, size, pitch = 0) => {
        const top = waterMax(p.z) + 0.2 + Math.abs(Math.sin(pitch)) * size; let m = 1e9;
        for (let a = -1; a <= 1; a += 0.5) {
          const x = p.x + Math.sin(yaw) * a * size, z = p.z + Math.cos(yaw) * a * size;
          for (let y = p.y; y <= Math.max(p.y, top) + (a > 0 ? 1.1 : 0.55) * size; y += 0.3) m = Math.min(m, dTo(x, y, z) - 0.33 * size);
        }
        // its two fore flippers (out to 0.6 of its size either side), and its head lifted and stretched forward past its nose
        for (const a of [0.14, 0.38]) for (const l of [-0.6, 0.6]) { const x = p.x + (Math.sin(yaw) * a + Math.cos(yaw) * l) * size, z = p.z + (Math.cos(yaw) * a - Math.sin(yaw) * l) * size; for (let y = p.y; y <= Math.max(p.y, top) + 0.3; y += 0.3) m = Math.min(m, dTo(x, y, z) - 0.1 * size); }
        { const x = p.x + Math.sin(yaw) * 1.2 * size, z = p.z + Math.cos(yaw) * 1.2 * size; for (let y = p.y; y <= Math.max(p.y, top) + 1.25 * size; y += 0.3) m = Math.min(m, dTo(x, y, z) - 0.2 * size); }
        return m;
      };
      // and no rock in it: from 0.2 m over its own underside (what it lies on is below that; a stump that stands higher
      // beside it is rock in it) up to its back at the highest the water floats it, and its head lifted
      const lying = (p, yaw, size, pitch = 0) => { const sp = Math.sin(pitch), fl = Math.max(0, waterMax(p.z) - 0.25 - p.y); return !sealRock(p.x, p.z, yaw, size, pitch, (a) => p.y + a * size * sp + 0.2, (a) => p.y + a * size * sp + fl + (a > 0.3 ? 1.05 : 0.6) * size); };
      let n = 0, divers = 0, nPass = 0, tried = 0;
      for (const { p: an, near, pass } of seats) {
        if (n >= N || (pass && nPass >= 7)) continue;
        const rs = pass ? F.haul : r;
        let size = pass ? rs.range(0.9, 1) : rs.range(0.75, 1); const ph = rs(), lift = rs.range(0.6, 1), y0 = rs() * TAU, cands = [];
        for (const [sz, draped] of pass ? [[size, false], [size, true], [0.68, false], [0.68, true]] : [[size, false], [0.62, false], [size, true]]) {          // where a grown seal has no room to lie flat, a yearling may, or it lies draped over its one stump
          if (cands.length) break; size = sz;
          for (const q of A.stumps) {
            const dq = Math.hypot(q.x - an.x, q.z - an.z); if (dq > near || Math.abs(q.y - an.y) > 0.9 || placed.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < 2.3)) continue;
            for (let k = 0; k < 12; k++) { const yaw = y0 + k * TAU / 12, fit = lieFit(q, yaw, size, draped); if (!fit) continue; const at = { x: q.x, y: q.y + fit.rise, z: q.z }; if (lying(at, yaw, size, fit.pitch)) cands.push({ q, at, yaw, pitch: fit.pitch, score: fit.dev + 0.06 * dq }); }
            if (++tried % 2 === 0) await yld();
          }
          await yld();
        }
        cands.sort((a, b) => a.score - b.score);
        let take = null;
        for (const c of cands.slice(0, pass ? 12 : 5)) { const m = least(c.at, c.yaw, size, c.pitch); await yld(); if (m >= CLEAR) { take = { q: c.q, at: c.at, yaw: c.yaw, pitch: c.pitch, m }; break; } }
        if (!take) continue;
        const q = take.q; note('seals', take.m); placed.push(q);
        iA.set([q.x, take.at.y + 0.05, q.z, take.yaw], n * 4); iB.set([size, ph, 1 + take.pitch / 4, lift], n * 4); iC.set([0, 0, 0, 1e6], n * 4);      // (its pitch rides on its env, a quarter of it)
        n++; if (pass) nPass++;
      }
      // AFLOAT, by place: seals in the water where the line turns its eddy in the choir (round its middle, 3 m and more from
      // every leg of it) and in the nave west of the line, over open water deep enough at the lowest level. Each lies awash
      // along the water, a wet grey back and a head out of it (none stands upright); they lift their heads with the rest, and up to
      // three of them dive as the lens comes round, each with its splash (no seal slides off a stump: every diver is afloat).
      let nFloat = 0;
      {
        const fr = F.afloat, lowAt = (z) => waterMin(z);
        const afloat = (x, z, yaw, size, pitch, dive) => {
          const sy = Math.sin(yaw), cy = Math.cos(yaw), hl = size * Math.cos(pitch), low = lowAt(z), high = waterMax(z); let m = 1e9;
          if (hero.floorAt(x, z) > low - 2.4) return -1;
          for (let a = -1; a <= 1.001; a += 0.5) for (const l of [-0.3, 0.3]) if (topHere(x + sy * a * hl + cy * l, z + cy * a * hl - sy * l) > low - 1.2) return -1;
          const deep = () => low - 1.3 - size * Math.abs(Math.sin(pitch)), up = () => high + 1.1 * size;          // no rock in it at any level the water carries it to
          if (sealRock(x, z, yaw, size, pitch, deep, up)) return -1;
          for (let a = -1; a <= 1.001; a += 0.5) for (let y = low - 1.2; y <= high + 1.1 * size; y += 0.3) m = Math.min(m, dTo(x + sy * a * hl, y, z + cy * a * hl) - 0.33 * size);
          for (const a of [0.14, 0.38]) for (const l of [-0.6, 0.6]) for (let y = low - 0.6; y <= high + 0.3; y += 0.3) m = Math.min(m, dTo(x + (sy * a + cy * l) * size, y, z + (cy * a - sy * l) * size) - 0.1 * size);      // its fore flippers
          for (let y = low - 0.6; y <= high + 1.25 * size; y += 0.3) m = Math.min(m, dTo(x + sy * 1.2 * hl, y, z + cy * 1.2 * hl) - 0.2 * size);      // its head, lifted and stretched forward
          if (dive) for (let g = 1; g <= 4; g++) {          // its dive: 1.8 m on the way it faces, 1.5 m down
            const gx = x + sy * 1.8 * g / 4, gz = z + cy * 1.8 * g / 4; if (topHere(gx, gz) > low - 1.2 - 0.375 * g || sealRock(gx, gz, yaw, size, pitch, () => deep() - 1.5, up)) return -1;
            for (let y = low - 1.2 - 0.375 * g; y <= high + 0.3 - 0.375 * g; y += 0.3) m = Math.min(m, dTo(gx + sy * hl, y, gz + cy * hl) - 0.33 * size, dTo(gx - sy * hl, y, gz - cy * hl) - 0.33 * size);
            for (let y = low - 0.6 - 0.375 * g; y <= high + 1.25 * size - 0.375 * g; y += 0.3) m = Math.min(m, dTo(gx + sy * 1.2 * hl, y, gz + cy * 1.2 * hl) - 0.2 * size);      // (and its head, lifted and stretched forward, at every stage of the dive)
          }
          return m;
        };
        const spots = [];
        for (let k = 0; k < 60; k++) { const a = fr() * TAU, rr = fr.range(0, 2.2); spots.push([lx0 + Math.cos(a) * rr * 0.6, lz0 + Math.sin(a) * rr * 2.2, 0]); }
        for (let k = 0; k < 40; k++) { const u = fr.range(0.4, 0.47), off = fr.range(3.2, 5.6); spots.push([S.lens(u, 0) - off, S.lens(u, 2), 1]); }
        const got = [0, 0], want = [4, 2];
        for (let k = 0; k < spots.length && nFloat < NF; k++) {
          const [x, z, grp] = spots[k], size = fr.range(0.85, 1), pitch = fr.range(0.05, 0.2), ph = fr(), lift = fr.range(0.7, 1), uD = fr.range(0.53, 0.6);
          if (got[grp] >= want[grp] || floats.some((o) => Math.hypot(o[0] - x, o[1] - z) < 2.6) || placed.some((o) => Math.hypot(o.x - x, o.z - z) < 2.6)) continue;
          let yaw = fr() * TAU, m = -1, dv = false;
          if (grp === 0 && divers < 3) for (let j = 0; j < 8; j++) { const yj = yaw + j * TAU / 8, mj = afloat(x, z, yj, size, pitch, true); await yld(); if (mj > m) { m = mj; if (mj >= CLEAR) { yaw = yj; dv = true; } } }
          if (!dv) m = afloat(x, z, yaw, size, pitch, false);
          await yld();
          if (m < CLEAR) continue;
          note('seals', m); floats.push([x, z]); got[grp]++;
          const i = n + nFloat; iA.set([x, -50, z, yaw], i * 4); iB.set([size, ph, 1 + pitch / 4, lift], i * 4);
          if (dv) { const t0 = S.secAt(uD); iC.set([Math.sin(yaw) * 1.8, 0, Math.cos(yaw) * 1.8, t0], i * 4); divers++; splashes.push({ x: x + Math.sin(yaw) * 0.7, y: waterAt(z, S.at(uD, sc)) - 0.05, z: z + Math.cos(yaw) * 0.7, t: t0 + 0.25 }); }
          else iC.set([0, 0, 0, 1e6], i * 4);
          nFloat++;
        }
        n += nFloat;
      }
      info.seals = { anchors: A.seals.length, lying: n - nFloat, byThePass: nPass, afloat: nFloat, diving: divers };
      await yld();
      const sealU = { uHead: V4(0, 0.07, 0.7, 0.45), uWing: V4(0, 0, 0, 0.3), uSwim: V4(0, 0, 0, 2), uPiv: V3(0.2, 0, 0.5), uCoat: V4(0.6, 6.5, 0.7, 0.5) };
      const sealMat = mat(POSED_VERT, BODY_FRAG, sealU, {});
      add(bodyMesh(sealGeo(false), sealMat, n, { iA, iB, iC }, 'organ-seals'), 'seals');
      sc.sealHead = sealU.uHead.value;
      if (season === 'autumn') {              // white pups, high on the staircase where the water seldom comes: each on a seat with room for its metre
        const pr = F.pups, cand = pr.shuffle(A.stumps.filter((q) => q.y > 0.7 && q.y < 2.6 && q.x > -15 && q.x < -7)), put = [], pA = new Float32Array(28), pB = new Float32Array(28), pC = new Float32Array(28);
        for (let c = 0; c < cand.length && put.length < 7; c++) {
          const q = cand[c]; if (put.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < 2) || placed.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < 2)) continue;
          const y0 = pr() * TAU, at = { x: q.x, y: q.y, z: q.z }; let yaw = 0, dev = 9, rise = 0;
          for (let k = 0; k < 12; k++) { const fit = lieFit(q, y0 + k * TAU / 12, 0.5, false); if (!fit || fit.dev >= dev) continue; at.y = q.y + fit.rise; if (lying(at, y0 + k * TAU / 12, 0.5)) { dev = fit.dev; yaw = y0 + k * TAU / 12; rise = fit.rise; } }
          if (dev > 1) continue;
          at.y = q.y + rise; const m = least(at, yaw, 0.5); if (c % 3 === 2) await yld(); if (m < CLEAR) continue;
          note('seal pups', m); const k = put.length; pA.set([q.x, at.y + 0.05, q.z, yaw], k * 4); pB.set([0.5, pr(), 1, 0.5], k * 4); pC.set([0, 0, 0, 1e6], k * 4); put.push(q);
        }
        info.seals.pups = put.length;
        const pupMat = mat(POSED_VERT, BODY_FRAG, { ...sealU, uCoat: V4(0.12, 5, 0.3, 0.5) }, {});
        add(bodyMesh(sealGeo(true), pupMat, put.length, { iA: pA, iB: pB, iC: pC }, 'organ-pups'), 'seals');
      }
      await yld();
    }

    // ---------------- shags drying their wings on the highest stumps
    {
      const r = F.shags, N0 = A.shags.length, iA = new Float32Array((N0 + 8) * 4), iB = new Float32Array((N0 + 8) * 4), iC = new Float32Array((N0 + 8) * 4); let N = 0;
      for (let i = 0; i < N0; i++) {
        const p = A.shags[i], size = r.range(1, 1.15), yaw = Math.atan2(2 - p.x, -p.z) + r.range(-0.5, 0.5), ph = r();
        let air = 99; for (const dy of [0.1, 0.4, 0.8]) air = Math.min(air, dTo(p.x, p.y + dy * size, p.z) - 0.55 * size);      // (its hung wings: 0.55 of its size about its middle)
        if (air < CLEAR) continue;      // (a seat within the line's clear air stays empty)
        iA.set([p.x, p.y, p.z, yaw], N * 4); iB.set([size, ph, 1, 0], N * 4); iC.set([0, 0, 0, 1e6], N * 4); N++;
        note('shags', air);
      }
      // and above the seals by the pass, by place: on stumps 4.5 to 9 m from the line where it runs back along the pavement,
      // over the highest the water comes, with no taller stump within 1.6 m on the line's side of them
      {
        const pr = F.perch, cand = pr.shuffle(A.stumps.map((q, i) => i).filter((i) => { const nq = stumpNear[i]; return nq.dist >= 4.5 && nq.dist <= 9 && nq.u >= 0.54 && nq.u <= 0.62 && A.stumps[i].y < 3; })), put = [];
        for (let c = 0; c < cand.length && put.length < 8; c++) {
          const q = A.stumps[cand[c]], dq = stumpNear[cand[c]].dist; if (c % 12 === 11) await yld();
          if (q.y < waterMax(q.z) + 0.25 || put.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < 2.2) || placed.some((o) => Math.hypot(o.x - q.x, o.z - q.z) < 1.7)) continue;
          if (A.stumps.some((o, j) => o !== q && Math.hypot(o.x - q.x, o.z - q.z) < 1.6 && stumpNear[j].dist < dq && o.y > q.y + 0.3)) continue;
          const size = pr.range(1.15, 1.3), m = dTo(q.x, q.y + 0.4, q.z) - 0.55 * size; if (m < CLEAR) continue;
          note('shags', m); iA.set([q.x, q.y, q.z, Math.atan2(lx0 - q.x, lz0 - q.z) + pr.range(-0.35, 0.35)], N * 4); iB.set([size, pr(), 1, 0], N * 4); iC.set([0, 0, 0, 1e6], N * 4); N++; put.push(q);      // breast and hung wings to the eddy the line turns in
        }
        info.shags = { anchors: N0, byThePass: put.length, placed: N };
      }
      const m = mat(POSED_VERT, BODY_FRAG, { uHead: V4(0, 0.14, 0.9, 0.04), uWing: V4(0, 0.2, 9, 0.09), uSwim: V4(0, 0, 0, 0), uPiv: V3(0.57, 0.4, 1), uCoat: V4(0.2, 9, 0.1, 0) }, { side: THREE.DoubleSide });
      add(bodyMesh(shagGeo(), m, N, { iA, iB, iC }, 'organ-shags'), 'shags');
    }

    // ---------------- the rare basking shark: it cruises out along the west side of the nave under the surface as we come in
    const SHARK_X = -2.5, T_SHARK = S.secAt(0.29), sharkZ = (sec) => -22 + 3 * Math.max(0, sec - T_SHARK) * ss(T_SHARK, T_SHARK + 2, sec), sharkWant = (z) => 1.2 + 3.8 * ss(2, 20, z);      // in the nave its back fin cuts the surface
    // the sand under its way (the part's floorAt, read once): it keeps its belly 0.5 m off it
    const sharkBed = new Float32Array(72); for (let i = 0; i < 72; i++) sharkBed[i] = Math.max(hero.floorAt(SHARK_X, -24 + i * 2), hero.floorAt(SHARK_X - 1, -24 + i * 2), hero.floorAt(SHARK_X + 1, -24 + i * 2));
    const sharkDeep = (z, water) => { const x = clamp((z + 24) / 2, 0, 70.999), i = Math.floor(x), bed = Math.max(sharkBed[i], sharkBed[i + 1]); return Math.max(0.9, Math.min(sharkWant(z), water - bed - 1.2)); };
    let shark = null;
    if (rare) {
      // ITS CLEAR AIR, all along its way: the route's u a two-thousandth at a time (the shark moves 0.15 m at most between
      // two of them), its body every 0.875 m of its 7 m with its girth, tail swing and fin; under CLEAR there is no shark
      let air = 99;
      for (let k = 0; k <= 2000; k++) {
        S.at(k / 2000, sc); const z = sharkZ(sc.sec), wy = waterAt(z, sc), y = wy - sharkDeep(z, wy);
        for (let a = -3.5; a <= 3.501; a += 0.875) for (const dy of [-0.7, 0.75, 1.45]) air = Math.min(air, dTo(SHARK_X, y + dy, z + a) - 0.95);
        if (k % 50 === 49) await yld();
      }
      info.shark = { air, leftOut: air < CLEAR };
      if (air >= CLEAR) {
        note('basking shark', air);
        const one = () => new Float32Array([0, 0, 0, 0]);
        const m = mat(POSED_VERT, BODY_FRAG, { uHead: V4(0, 0, 0, 0), uWing: V4(0, 0, 0, 9), uSwim: V4(0.28, 2.4, 1.5, 0), uPiv: V3(0, 0, 1), uCoat: V4(0.5, 0.8, 0.2, 1) }, { transparent: true });
        shark = add(bodyMesh(sharkGeo(), m, 1, { iA: one(), iB: new Float32Array([1, 0.3, 1, 0]), iC: new Float32Array([0, 0, 0, 1e6]) }, 'organ-shark'), 'shark', 3);
      }
      await yld();
    }

    // ---------------- moon jellies in the emerald, and two shoals of sand eels
    {
      // SMALL (a bell a forearm across at most: 0.26 to 0.44 m), PALE, IN THREE LOOSE DRIFTS CLOSE BY THE LINE WHERE THE
      // LENS GOES SLOWLY (F.drift: two west of it where it slows at the end of the first pass and the gaze swings over
      // them, one east of the run back along the pavement; each a band 7 m long beside the line, its bells 2.65 to 4.3 m from it): a bell is a small thing and is kept
      // close by the line; none further off, none on the flood. A bell
      // hangs JUST UNDER THE
      // SURFACE, its crown 0.25 to 0.6 m down, and the lens flies a metre over the water: its clear air is measured with
      // 0.95 m of height (less than it has). NO TWO TOUCH: each keeps 0.6 m of water and more from
      // the next at the widest of both their drifts.
      const r = F.jellies, rd = F.drift, N1 = 0, N = N1 + Math.round(24 * density), iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), st = A.stumps, took = [], cents = []; let n = 0;
      for (const [u0, sg] of [[0.462, -1], [0.492, -1], [0.585, -1]]) cents.push([u0 + rd.range(-0.004, 0.004), sg]);
      // does a bell at (x, z) with its reach stand within 0.2 m of a stump? (A stump further off than the two reaches along
      // x or along z alone is no nearer than them in plan: the root is not taken for it. A plain function)
      const onStump = (x, z, reach) => { for (let i = 0; i < st.length; i++) { const q = st[i], R = q.r + reach + 0.2, dx = q.x - x, dz = q.z - z; if (dx < R + 1e-6 && dx > -R - 1e-6 && dz < R + 1e-6 && dz > -R - 1e-6 && Math.hypot(dx, dz) < R) return true; } return false; };
      for (let tries = 0; n < N && tries < 2400; tries++) {
        const line = n >= N1, rr = line ? rd : r; let x, z;
        if (line) { const c = cents[tries % cents.length], u = c[0] + rr.range(-3.6, 3.6) / path.length, off = rr.range(2.65, 4.3); path.pointAt(u, v); path.tangentAt(u, v2); const tl = Math.hypot(v2.x, v2.z) || 1; x = v.x - c[1] * off * v2.z / tl; z = v.z + c[1] * off * v2.x / tl; }
        else { x = rr.range(-9, 7.5); z = rr.range(-78, -3); }
        const rad = rr.range(0.13, 0.22), drift = rr.range(0.15, 0.35), reach = rad + drift;
        if (tries % 150 === 149) await yld();
        if (z > -3 || hero.ceilAt(x, z) < 5 || hero.ceilAt(x - 1.2, z) < 5 || hero.ceilAt(x + 1.2, z) < 5) continue;
        if (hero.floorAt(x, z) > Math.min(-4, waterMin(z) - 1.6)) continue;          // water enough under it at the lowest the level comes there
        const d = Math.hypot(Math.max(dPlan(x, z) - reach, 0), 0.95); if (d < CLEAR + 0.05) continue;
        if (onStump(x, z, reach)) continue;
        if (took.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + reach + 0.6)) continue;
        note('moon jellies', d); iA.set([x, rr.range(0.25, 0.6), z, rad], n * 4); iB.set([rr(), drift, rr.range(1.6, 2.6), 0], n * 4); took.push([x, z, reach]); n++;
      }
      const jm = mat(JELLY_VERT, JELLY_FRAG, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const G = jellyGeo(); add(bodyMesh({ p: G.p, i: G.i }, jm, n, { iA, iB }, 'organ-jellies'), 'jellies', 3);
      await yld();
      // SAND EELS: one shoal in the nave west of the line, one inside the eddy the line makes in the choir (its middle, by
      // place: the mean of the line's own points there), each on a course as wide as leaves it its clear air (measured, as
      // the jellies', with the height the lens flies over the water: the eels keep 0.3 m and more under the surface)
      const er = F.eels, sq = squareG(0.5), M = Math.round(150 * density), eA = new Float32Array(M * 8), eB = new Float32Array(M * 8), eC = new Float32Array(M * 8); let e = 0, eelOut = 0;
      const eelAir = (cx, cz, ax, az, spread) => { let m = 9; for (let k = 0; k < 24; k++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const t = k / 24 * TAU; m = Math.min(m, Math.hypot(Math.max(dPlan(cx + ax * Math.cos(t) + sx * spread * 1.25, cz + az * Math.sin(t) + sz * spread * 1.3 * 1.25) - 0.15, 0), 1.2)); } return m; };
      for (let [cx, cz, ax, az, spread] of [[-2.2, -15, 1.2, 6, 1], [lx0, lz0, 1.4, 5, 0.8]]) {
        for (let k = 0; k < 12 && eelAir(cx, cz, ax, az, spread) < CLEAR + 0.05; k++) { ax *= 0.85; az *= 0.85; spread *= 0.9; }
        await yld();
        if (eelAir(cx, cz, ax, az, spread) < CLEAR) { eelOut++; continue; }      // (drawn in twelve times and still not clear: no shoal there)
        for (let i = 0; i < M; i++, e++) { eA.set([er.range(-spread, spread), er.range(0.3, 1), er.range(-spread, spread) * 1.3, er.range(0, 0.5)], e * 4); eB.set([er(), er.range(0.2, 0.34), 0, 0], e * 4); eC.set([cx, cz, ax, az], e * 4); }
        note('sand eels', eelAir(cx, cz, ax, az, spread));
      }
      add(bodyMesh({ p: sq.p, i: sq.i }, mat(EEL_VERT, EEL_FRAG, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide }), e, { iA: eA, iB: eB, iC: eC }, 'organ-eels'), 'eels', 3); info.eels = { eels: e, shoalsLeftOut: eelOut };
      await yld();
    }

    // ---------------- kelp: fronds from the part's anchors (stump feet, the plinth's edge). A frond can reach anywhere within
    // its own length of its root: it is shortened, or left out, where that would come within the clear air of the line.
    {
      const r = F.kelp, per = 450 * density / A.kelp.length, cap = Math.ceil(A.kelp.length * (per + 1)), iA = new Float32Array(cap * 4), iB = new Float32Array(cap * 4); let n = 0, c = 0;
      for (const p of A.kelp) {
        const k = Math.floor(per) + (r() < per % 1 ? 1 : 0);
        for (let j = 0; j < k; j++) {
          const x = p.x + r.range(-0.35, 0.35), z = p.z + r.range(-0.35, 0.35), a = r() * TAU, ph = r(), wd = r.range(0.24, 0.4); let L = r.range(2, 3.2);      // (a blade's width, a hand and more)
          const d = dTo(x, p.y, z); if (d < L + CLEAR + 0.25) L = d - CLEAR - 0.25; if (L < 0.8) continue;
          note('kelp', d - L - 0.2); iA.set([x, p.y, z, L], n * 4); iB.set([Math.sin(a), Math.cos(a), ph, wd], n * 4); n++;
        }
        if (++c % 60 === 0) await yld();
      }
      const km = mat(RIBBON_VERT, RIBBON_FRAG, { uKelpA: V3(0.03, 0.032, 0.014), uKelpB: V3(0.14, 0.13, 0.05) }, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const G = stripG(16); add(bodyMesh({ p: G.p, i: G.i }, km, n, { iA, iB }, 'organ-kelp'), 'kelp', 3);
      await yld();
    }

    // ---------------- white water in the air: mist, spray over the pile at the back wall, the fountain round the lip, spume
    // along the plinth. All of it stands off the line: the lens passes outside every puff.
    // THE BACK WALL of the bell, by place: how far from the spout's foot the rock stands on a bearing (0 is due north, the way
    // the surge runs), and how high the face of white water stands against it there when the pile is full
    const wallR = (th) => { const sx = Math.sin(th), cz = -Math.cos(th); let r = 3; while (r < 10 && hero.ceilAt(sx * r, AX0.z + cz * r) >= 0) r += 0.1; return r; };
    const faceH = (th) => 3.6 * (0.55 + 0.45 * Math.cos(Math.min(Math.abs(th), 1.6)));
    // THE BURST's moment and foot: the wave strikes the east jamb two seconds before the lens is 35 m short of it along
    // the route (the lens is then some 52 m out); its body is at its height by 39 m, stands until some 22 m and comes
    // down as the lens goes under it
    let uJ = 0.3; while (uJ < 0.4 && S.lens(uJ, 2) > A.jamb.z) uJ += 0.0005;
    const T_BURST = S.secAt(uJ - 35 / path.length) - 2; let uB = uJ - 35 / path.length; while (uB > 0.02 && S.secAt(uB) > T_BURST) uB -= 0.0005;
    const jy = waterAt(A.jamb.z, S.at(uB, sc)) - 0.15; WU.uJamb.value.set(A.jamb.x, jy, A.jamb.z);
    // the plinth east of the mouth, by the part's true rock: how far out toward the sea a stump stands in the water at x
    // (the wave strikes there first), and where the cliff's own pipes stand behind it (tall rock: 8 m and more over the sea)
    const edgeZ = (x) => { let z = 7.6; while (z > A.jamb.z + 2 && rockGap(x, z, jy - 1, jy + 0.3) > 0) z -= 0.2; return z; };
    const faceZ = (x) => { let z = 6; while (z > -1 && rockGap(x, z, 9, 30) > 0.05) z -= 0.1; return z; };
    // THE FLOOD shows a piece at z from the moment the swell's crest is within 16 m of it (the shaders' own law): how much, at u
    const floodAt = (z, u) => { S.at(u, sc); return sc.flood * ss(-16, -6, z - sc.humpZ); };
    // THE FLOOD'S MOMENTS: the script at every 0.003 of the route from u 0.6 to 0.93, with the lens's x, read once and
    // kept (floodMoments). Who walks them reads the last of them into sc again at the end (floodLast), as the walk
    // through the script itself left it.
    let FT = null, FU = 0;
    const floodMoments = () => { if (!FT) { FT = []; for (let u = 0.6; u <= 0.93; u += 0.003) { const o = S.at(u, {}); o.lensX = S.lens(u, 0); FT.push(o); FU = u; } } return FT; };
    const floodLast = () => S.at(FU, sc);
    {
      const rows = [], e2 = new THREE.Vector3(0, AXD.z, -AXD.y);        // each kind from its own stream
      const push = (r, x, y, z, size, vx, vy, vz, T, mode, op, g) => rows.push(x, y, z, size, vx, vy, vz, T, mode, r(), op, g);
      // a puff over its whole flight with its full size as it grows (the shader's own law): the least air it leaves the line,
      // or -1 if at any moment it stands in the cone to the disc
      const puffAir = (x, y, z, size, vx, vy, vz, T, g, grow = 0.5) => {
        let air = 99;
        for (let j = 0; j <= 12; j++) { const tau = T * j / 12, R = size * (1 + grow * tau); v.set(x + vx * tau, y + vy * tau - 0.5 * g * tau * tau, z + vz * tau); if (beforeDisc(v, R)) return -1; air = Math.min(air, dTo(v.x, v.y, v.z) - R); }
        return air;
      };
      // a piece of the flood (a ball of radius R about a place that is at height y over the water as it stands then, or at
      // a height of its own): the least air it leaves the LENS over all the moments at which it shows at all
      const floodAir = (x, y, z, R, overWater) => {
        let air = 99; const ft = floodMoments();
        for (let t = 0; t < ft.length; t++) { const o = ft[t]; if (o.flood * ss(-16, -6, z - o.humpZ) < 0.02) continue; air = Math.min(air, Math.hypot(o.lensX - x, o.lensY - (overWater ? waterAt(z, o) + y : y), o.lensZ - z) - R); }
        floodLast();
        return air;
      };
      // thin spray low at the mouth's sill (half a metre to two over the water there, none higher: the mouth's dark is the
      // part's), off the line in plan by its own size, its drift (1.56 m at its most) and 1.7 m
      for (let k = 0, tries = 0, r = F.mist; k < 10 && tries < 500; tries++) {
        const x = r.range(-7.5, 7.5), y = r.range(0.5, 2), z = r.range(-5, 3), size = r.range(1.2, 2.2);
        if (dPlan(x, z) < size + 1.56 + 1.7) continue; push(r, x, y, z, size, 0, 0, 0, 0, 0, r.range(0.02, 0.035), 0); k++;
      }
      // a veil of spray off the top of the face at the back wall (its sheets, drops and veins are streaks, below)
      for (let k = 0, r = F.pileveil; k < 26; k++) {
        const th = r.range(-1.75, 1.75), rw = wallR(th) - r.range(0.4, 1.2), x = Math.sin(th) * rw, z = AX0.z - Math.cos(th) * rw, size = r.range(0.8, 1.25), y = faceH(th) * r.range(0.6, 1), vy = r.range(1, 2.6), T = r.range(0.9, 1.7);
        const vx = -Math.sin(th) * r.range(0, 0.5), vz = Math.cos(th) * r.range(0, 0.5), op = r.range(0.06, 0.1), air = puffAir(x, waterMax(z) + y, z, size, vx, vy, vz, T, 9.81);
        if (air < CLEAR) continue;
        note('the face', air); push(r, x, y, z, size, vx, vy, vz, T, 2, op, 9.81);
      }
      // the fountain round the lip: thrown up and outward from a ring outside the disc's rim. A puff grows as it flies and
      // gravity draws it back and across the axis: each is dealt until its whole flight, full size, stays out of the cone
      let nLip = 0, lipAir = 99;
      for (let k = 0, r = F.lip; k < 900 && nLip < 40; k++) {
        const th = r() * TAU, rad = r.range(7, 8.4), up = r.range(6, 10), out = r.range(1.5, 3), c = Math.cos(th), s = Math.sin(th), size = r.range(0.7, 1.2), T = r.range(1.5, 2.3), op = r.range(0.3, 0.5);
        v.copy(A.portal).addScaledVector(AXD, r.range(0, 1.5)); v.x += rad * c; v.addScaledVector(e2, rad * s);
        const x = v.x, y = v.y, z = v.z, vx = AXD.x * up + out * c + e2.x * out * s, vy = AXD.y * up + e2.y * out * s, vz = AXD.z * up + e2.z * out * s, air = puffAir(x, y, z, size, vx, vy, vz, T, 6);
        if (air < CLEAR) continue;
        lipAir = Math.min(lipAir, air); push(r, x, y, z, size, vx, vy, vz, T, 3, op, 6); nLip++;
        if (k % 60 === 59) await yld();
      }
      info.disc.lip = nLip;
      // THE BURST'S BODY (F.body; on the route's clock from T_BURST): thrown water where the wave strikes the plinth east
      // of the mouth and goes up the jamb behind it (its form is told below, at THE PLUME). Each piece is thrown to its
      // own height (fast, slowing), holds there 3.3 to 3.8 s from the strike and then falls (the shader's own law,
      // replayed here): kept only if over its whole life, at its full drawn-out size, it leaves the line its clear air.
      {
        const jx = A.jamb.x, jz = A.jamb.z, bb = F.body; let nCore = 0, air = 99;
        // NO PIPE OF THE CLIFF CUTS A PIECE: a piece lies in the view's plane, and a pipe that stood seaward of it would cut
        // it with its own straight side. The cliff's face is read once from the part's true rock (every 0.2 m along it),
        // and every piece is set seaward of the most seaward pipe anywhere under its width, its lean and its drift: by
        // 0.4 m and by 0.9 of its size (as much as its rim can dip toward the rock while the gaze is turned or raised)
        const FZ = []; for (let i = 0; i <= 80; i++) { FZ.push(faceZ(jx - 4 + 0.2 * i)); if (i % 6 === 5) await yld(); }
        const front = (x0, x1) => { let m = -9; for (let i = Math.max(0, Math.floor((x0 - jx + 4) / 0.2)); i <= Math.min(80, Math.ceil((x1 - jx + 4) / 0.2)); i++) m = Math.max(m, FZ[i]); return m; };
        let nFront = 0;
        const fly = (r, x, y, z, size, vx, H, vz, delay, op, g) => {
          const seed = r(), th = 3.3 + 0.5 * seed, life = th + Math.sqrt(2 * Math.max(H, 0.2) / g), T = g > 6.5 ? 1.8 : 4.5, ln = clamp(vx * 0.8, -0.5, 0.5); let m = 99;
          { const R = 1.25 * size * (1 + Math.abs(ln) * T), zf = front(x - R + Math.min(vx, 0) * life, x + R + Math.max(vx, 0) * life) + 0.4 + 0.9 * size; if (z < zf) { z = zf; nFront++; } }
          // (a piece is drawn out along its motion, to 4.5 times its width as it falls, and leans with its drift: measured
          // over its whole life as the leaning capsule that holds it, five balls down its length; a piece that fails at
          // one moment is left out there and then, the later moments not asked. A ball's air is measured only where
          // it could be under the least air of the pieces kept so far: no other ball can fail the piece or lower that least)
          for (let j = 0; j <= 24; j++) {
            const tau = life * j / 24, fall = Math.max(tau - th, 0), R = size * (1 + 0.1 * tau), px = x + vx * tau, py = y + H * (1 - Math.exp(-1.7 * tau)) + 0.25 * Math.sin(tau * 1.9 + seed * 40) * ss(0.8, 1.6, tau) - 0.5 * g * fall * fall, pz = z + vz * tau;
            for (let k = -2; k <= 2; k++) { const oy = k * 0.5 * (T - 1) * R; m = Math.min(m, dToUnder(px + ln * oy, py + oy, pz, air + R) - R); }
            if (m < CLEAR) return false;
          }
          air = Math.min(air, m); rows.push(x, y, z, size, vx, H, vz, delay, 5, seed, op, g); return true;
        };
        // THE WET ON THE PIPES behind it (F.wet): a soft dark stain on the cliff's own pipes (set half a metre before their
        // faces, by the part's true rock), which comes up the rock with the water, from the strike, and stays; it is
        // drawn out down the pipes, lower toward the east. (Dealt before the white water: it lies behind it)
        let nWet = 0;
        for (let k = 0, r = F.wet; k < 18; k++) {
          const x = jx + r.range(0.5, 4.6), top = 12.5 - 1.6 * Math.abs(x - jx - 2.4), y = jy + r.range(1.2, Math.max(top, 2.5)), size = r.range(0.9, 1.5), z = faceZ(x) + 0.5, op = r.range(0.18, 0.26), sd = r();
          if (x - size < jx - 0.6 || dTo(x, y, z) - 2.4 * size < CLEAR) continue;
          rows.push(x, y, z, size, 0, 0, 0, 0.25 + (y - jy) / 16, 8, sd, op, 0); nWet++;
        }
        // THE PLUME (order 9): TALL AND NARROW, some four metres wide at its foot and fifteen high, widening only a
        // little and leaning east with the wave's throw (its middle 0.1 m further east for every metre it climbs); all of
        // it SMALL PIECES DRAWN OUT ALONG THEIR MOTION (a quarter to a half metre wide, 3.6 times as long):
        // (a) THE CORE, 240 pieces dealt thick about its middle (within 0.9 m of it), near opaque: the pipes do not show
        // through it; (b) THE VEIL, 140 pieces of threads with air between, to 2 m either side, a third as dense: the
        // pipes show through it; (c) ITS HEAD, five thrown fingers of small pieces that lead it to 13 to 15.5 m and fan
        // apart as they go (the fan of fine drops beyond them is the streaks', below); (d) THE BOIL AT ITS FOOT on the
        // water before the plinth, low and short (this sea's own sheet boils white under it and spreads in rings)
        const axis = (h) => jx + 2.2 + 0.1 * h, bellD = () => (bb() + bb() + bb() - 1.5) * 1.15;
        let nVeil = 0, nHead = 0, nBoil = 0;
        await yld();
        for (let k = 0; k < 240; k++) {
          // (it FANS FROM ITS FOOT: a piece east of its middle drifts and leans east, one west of it west)
          const q = Math.pow(bb(), 0.8), H = 1.2 + 12.3 * q, size = lerp(0.44, 0.27, q) * bb.range(0.85, 1.2), off = 0.62 * bellD() * (1 - 0.3 * q), fan = 0.2 * off, x = axis(H) + off - fan * 2.2;
          if (fly(bb, x, jy + 0.2, jz + bb.range(0.9, 1.7), size, 0.1 + fan + bb.range(-0.06, 0.06), H, bb.range(0.02, 0.15), bb.range(0, 0.35), bb.range(0.68, 0.84), 6)) nCore++;
          if (k % 6 === 5) await yld();
        }
        for (let k = 0; k < 140; k++) {
          const q = Math.pow(bb(), 0.9), H = 0.8 + 12.5 * q, size = lerp(0.5, 0.3, q) * bb.range(0.85, 1.25), off = clamp(1.5 * bellD(), -1.9, 2.1) * (1 - 0.2 * q), fan = clamp(0.17 * off, -0.3, 0.35), x = axis(H) + off - fan * 2.2;
          if (fly(bb, x, jy + 0.2, jz + bb.range(0.9, 2.2), size, 0.1 + fan + bb.range(-0.06, 0.06), H, bb.range(0.02, 0.2), bb.range(0.05, 0.5), bb.range(0.24, 0.38), 5.5)) nVeil++;
          if (k % 6 === 5) await yld();
        }
        for (let f = 0; f < 5; f++) {
          const x = axis(14) + (f - 2) * 0.55 + bb.range(-0.2, 0.2), z = jz + bb.range(0.9, 1.6), top = [15.3, 13.4, 14.6, 12.9, 14][f] + bb.range(-0.3, 0.3), vx = (f - 2) * 0.14 + bb.range(-0.06, 0.12), vz = bb.range(0.02, 0.15), d0 = bb.range(0, 0.25);
          for (let j = 0; j < 9; j++) { if (fly(bb, x - vx * 3 + bb.range(-1, 1) * (0.05 + 0.03 * j), jy + 0.2, z, 0.17 + 0.022 * j, vx + bb.range(-0.04, 0.04), top * (1 - 0.03 * j), vz, d0 + 0.012 * j, bb.range(0.5, 0.68), 6)) nHead++; if (j === 4) await yld(); }
          await yld();
        }
        for (let k = 0; k < 44; k++) {
          const x = jx + bb.range(0.2, 4.6), z = edgeZ(x) + bb.range(0.5, 1.6), H = 0.4 + 1.9 * Math.pow(bb(), 1.6), size = bb.range(0.34, 0.6);
          if (fly(bb, x, jy + 0.25, z, size, bb.range(-0.1, 0.15), H, bb.range(0.05, 0.3), bb.range(0, 0.25), bb.range(0.55, 0.75), 7)) nBoil++;
          if (k % 6 === 5) await yld();
        }
        info.burstBody = { core: nCore, veil: nVeil, head: nHead, boil: nBoil, wet: nWet, air, setForward: nFront };
        await yld();
      }
      // THE FLOOD'S SPRAY (F.floodspray): thrown up off the water at the feet of the nave's east wall and along the
      // pavement's edge, from the moment the swell is there; each leaves the lens its clear air at every moment it shows
      {
        const r = F.floodspray; let nS = 0, air = 99, k = 0;
        const edge = A.stumps.filter((q) => q.z < -27 && q.z > -62 && q.x > -10.5 && q.y > -1.2);
        for (let tries = 0; tries < 600 && nS < 90; tries++) {
          const west = tries % 2 === 1 && edge.length > 0; let x, z;
          if (west) { const q = edge[Math.min(edge.length - 1, Math.floor(r() * edge.length))]; x = q.x + q.r + r.range(0.2, 0.7); z = q.z + r.range(-0.4, 0.4); }
          else { z = r.range(-62, -28); x = 4; while (x < 12 && hero.ceilAt(x + 0.3, z) >= 0) x += 0.2; x -= r.range(0.4, 1); }
          const size = r.range(0.6, 1.05), y = r.range(0.15, 0.45), vx = (west ? 1 : -1) * r.range(0.1, 0.8), vy = r.range(2.6, 5), vz = r.range(-1.6, 0.2), T = r.range(0.8, 1.4), op = r.range(0.13, 0.22);
          if (++k % 5 === 0) await yld();
          if (hero.ceilAt(x, z) < 3 || topHere(x, z) > waterMin(z)) continue;
          let m = 99; for (let j = 0; j <= 4 && m >= CLEAR; j++) { const tau = T * j / 4; m = Math.min(m, floodAir(x + vx * tau, y + vy * tau - 4.905 * tau * tau, z + vz * tau, size * (1 + 0.5 * tau), true)); }
          if (m < CLEAR) continue;
          air = Math.min(air, m); push(r, x, y, z, size, vx, vy, vz, T, 6, op, 9.81); nS++;
        }
info.flood = { spray: nS, sprayAir: air };
      }
      // (ORDER 10) THE BOIL UNDER THE SHAFT (F.fallspray; mode 7): where the shaft's water lands, round the blowhole's
      // foot, from the moment the swell comes in (the route's announce) until the heap drowns it (the route's pile: the
      // shader's law): A LOW BOIL OF WHITE WATER, heavy pieces thrown 0.3 to 1.6 m off the water and down again, and A
      // RISE OF FINE SPRAY into the shaft's light, threads thrown 2 to 4.4 m up that fade as they turn over; some 11 m
      // wide and 3 to 5 m high as the nave sees it. Its pieces are the burst's (drawn out along their motion, feathered, no
      // round tuft, no pane), near-white in the shaft's light and blue-grey out of it (by place). A MEDIUM, AND BY PLACE
      // WELL CLEAR OF THE LINE: a piece is kept only if over its whole flight, at its full drawn-out size, at every
      // height the water stands there, it is BOIL_AIR (3 m) and more from the whole flown line (the lens comes down
      // the nave through its middle and goes up over its back: it parts round the line), outside the cone to the
      // disc, clear of the rock round it and under the roof.
      {
        const rf = F.fallspray, wr = []; let nB = 0, nR = 0, air = 99;
        for (let i = 0; i < 48; i++) { wr.push(wallR((i + 0.5) / 48 * TAU - Math.PI)); if (i % 6 === 5) await yld(); }
        // (its least air over its whole flight, or -1 before the disc; a piece that has come within BOIL_AIR at one
        // moment is left out whatever follows, so the later moments are not asked: what comes back is then under BOIL_AIR.
        // A ball's air is measured only where it could be under the least air of the pieces kept so far: what comes
        // back for a piece that is kept is its own least air if that is under theirs, and no less than theirs if not)
        const boilFly = (x, y, z, size, vx, vy, vz, T, g, tall) => {
          const lo = waterMin(z), hi = waterMax(z); let m = 99;
          for (let j = 0; j <= 6; j++) {
            const tau = T * j / 6, R = size * (1 + 0.12 * tau), px = x + vx * tau, py = y + vy * tau - 0.5 * g * tau * tau, pz = z + vz * tau, ln = clamp(vx / Math.max(Math.abs(vy - g * tau), 1.5), -0.5, 0.5);
            for (let q = -2; q <= 2; q++) for (let l = 0; l <= 2; l++) {
              const oy = q * 0.5 * (tall - 1) * R; v.set(px + ln * oy, py + oy + lerp(lo, hi, l / 2), pz);
              if (beforeDisc(v, R)) return -1; m = Math.min(m, dToUnder(v.x, v.y, v.z, air + R) - R); if (m < BOIL_AIR) return m;
            }
          }
          return m;
        };
        for (let tries = 0; tries < 3600 && nB + nR < N_BOIL + N_RISE; tries++) {
          // (dealt thicker toward the north, behind the foot, where the nave sees it across the line's own gap)
          const rise = nR < N_RISE && (tries % 3 === 2 || nB >= N_BOIL), th = Math.PI * rf.range(-1, 1) * (0.3 + 0.7 * rf() * rf()), size = rise ? rf.range(0.16, 0.26) : rf.range(0.36, 0.62);
          const rw = Math.min(wr[Math.min(47, Math.floor((th + Math.PI) / TAU * 48))] - 0.5 - 1.2 * size, 7), rad = lerp(3, rw, Math.pow(rf(), 0.8)), x = Math.sin(th) * rad, z = AX0.z - Math.cos(th) * rad;
          const g = rise ? rf.range(2.4, 3.4) : 9.81, H = rise ? rf.range(2, 4.4) : 0.3 + 1.3 * Math.pow(rf(), 1.5), vy = Math.sqrt(2 * g * H), T = vy / g * (rise ? rf.range(1.05, 1.3) : 1.85);
          const vx = Math.sin(th) * rf.range(0, 0.45) + rf.range(-0.2, 0.2), vz = -Math.cos(th) * rf.range(0, 0.45) + rf.range(-0.2, 0.2), op = rise ? rf.range(0.4, 0.6) : rf.range(0.6, 0.85), tall = rise ? 4 : 1.5;
          if (tries % 3 === 2) await yld();
          if (rw < 3.2 || hero.ceilAt(x, z) < waterMax(z) + H + 2 * size || topHere(x, z) > waterMin(z) - 0.3) continue;
          const m = boilFly(x, 0.1, z, size, vx, vy, vz, T, g, tall);
          if (m < BOIL_AIR) continue;
          air = Math.min(air, m); push(rf, x, 0.1, z, size, vx, vy, vz, T, 7, op, g); if (rise) nR++; else nB++;
        }
        info.boil = { pieces: nB, spray: nR, air }; note('the boil under the shaft', air);
        await yld();
      }
      for (let k = 0, r = F.spume; k < 60; k++) { const s = r.sign(); push(r, PX + s * r.range(14, 70), 0.4, r.range(5, 8), r.range(0.6, 1.2), 0, r.range(3.5, 7), r.range(-0.5, 0.5), r.range(2.6, 4.5), 4, r.range(0.2, 0.35), 9.81); }
      const N = rows.length / 12, iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), iC = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { iA[i * 4 + k] = rows[i * 12 + k]; iB[i * 4 + k] = rows[i * 12 + 4 + k]; iC[i * 4 + k] = rows[i * 12 + 8 + k]; }
      const sq = squareG(1), pm = mat(PUFF_VERT, PUFF_FRAG, {}, { transparent: true, depthWrite: false });
      add(bodyMesh({ p: sq.p, i: sq.i }, pm, N, { iA, iB, iC }, 'organ-puffs'), 'white water', 5);
      await yld();
    }
    // ---------------- streaks: the burst up the east jamb, the seals' splashes, the face at the back wall with its drops and
    // drops, the foam at the rock, the drops and threads falling in the chimney, the spray falling in the bell, the roof's drips.
    // THE BURST is thrown water, keyed to the route (T_BURST, above). Its body is the puffs' (above); here are its jets,
    // ropes and drops, thrown in THREE VOLLEYS a second apart (the wave drives on while the body stands). The heavy
    // water is down as the lens passes, 5 m and more east of the line (info.burst.east), in pieces no wider than
    // 0.09 m and no longer than 1.1 m as they fall; nothing of it comes down after the body.
    {
      const br = F.burst, e2 = new THREE.Vector3(0, AXD.z, -AXD.y), rows = [];
      const put = (a, b, c) => rows.push(a[0], a[1], a[2], a[3], b[0], b[1], b[2], b[3], c[0], c[1], c[2], c[3]);
      const jx = A.jamb.x, jz = A.jamb.z, G9 = 9.81; let east = 1e9;
      const shoot = (x, z, vx, vy, vz, delay, wdt, al, g) => {
        put([x, jy, z, delay], [vx, vy, vz, wdt], [2, br(), Math.min(0.78, al * (1 + 0.6 * K.foam)), g]);
        east = Math.min(east, x - 3 - 0.5 * wdt, x + vx * 2 * vy / g - 3 - 0.5 * wdt);          // its nearest to the line's x through the mouth, at launch and where it lands
      };
      // (order 9) UPWARD STREAKS IN THE PLUME: seven jets of torn sheets that lead its core, each as long as it is fast;
      // ropes in its body; A FAN OF FINE DROPS beyond its head, thrown higher than the fingers and spread east, and A
      // FRINGE OF SEPARATE DROPS out of its sides: each a short bright dash that catches the light (near-white), long
      // while it is fast and a drop at its apex; none comes nearer the line than 5 m in plan
      const axis = (h) => jx + 2.2 + 0.1 * h;
      for (let f = 0; f < 7; f++) {
        const x = jx + 1 + 2.4 * (f + br.range(0.2, 0.8)) / 7, z = jz + br.range(0.3, 1.2), lead = f < 3 ? br.range(14.5, 17) : br.range(11.5, 14.5), vx = br.range(0, 0.5), vz = br.range(0.1, 0.5), d0 = br.range(0, 0.3) + [0, 1.05, 2.1][f % 3];
        for (let k = 0; k < 12; k++) {
          const q = k / 11;
          shoot(x + br.range(-0.12, 0.12) * (1 + 2 * q), z + br.range(-0.15, 0.15), vx + br.range(-0.12, 0.12), lead * (1 - 0.55 * q - br.range(0, 0.04)), vz + br.range(-0.1, 0.1), d0 + 0.03 * k + br.range(0, 0.05), lerp(0.1, 0.3, q) * br.range(0.8, 1.25), lerp(0.75, 0.45, q), G9);
        }
      }
      for (let k = 0; k < 60; k++) shoot(jx + br.range(0.8, 3.6), jz + br.range(0.2, 1.2), br.range(-0.05, 0.4), br.range(6.5, 14), br.range(0, 0.5), br.range(0, 0.45) + [0, 1, 2][k % 3], br.range(0.12, 0.26), br.range(0.22, 0.34), G9);
      for (let k = 0; k < 90; k++) shoot(axis(0) + br.range(-0.9, 0.9), jz + br.range(0.3, 1.2), br.range(-0.4, 1.3), br.range(13.5, 18.5), br.range(-0.1, 0.9), br.range(0, 0.4) + [0, 1.05, 2.1][k % 3], br.range(0.05, 0.08), br.range(0.55, 0.78), G9);
      for (let k = 0; k < 70; k++) { const sg = k % 3 === 0 ? -1 : 1; shoot(axis(0) + sg * br.range(0.9, sg > 0 ? 1.9 : 1.5), jz + br.range(0.3, 1.4), sg > 0 ? br.range(0.3, 1.7) : -br.range(0.1, 0.4), br.range(5, 12.5), br.range(0, 0.9), br.range(0, 0.5) + [0, 1.05, 2.1][k % 3], br.range(0.05, 0.07), br.range(0.5, 0.75), G9); }
      // (NOTHING OF IT IS LEFT ON THE JAMB when the body is down: the held spray that came down slowly after it and the
      // threads of water that ran down the pipes were, once the plume had fallen, pale dashes on the rock just inside
      // the mouth; they are out. What falls is the plume's own pieces and drops, and it is gone with them)
      info.burst = { at: T_BURST, abreast: S.secAt(uJ), east };
      // a seal's splash where it meets the water: a few drops thrown up, on the route's clock, none of them toward the line
      for (const sp of splashes) for (let k = 0, r = F.splash; k < 18; k++) {
        const vx = r.range(-1.1, 1.1), vz = r.range(-1.1, 1.1), vy = r.range(1.6, 4.4), x = sp.x + r.range(-0.3, 0.3), z = sp.z + r.range(-0.3, 0.3);
        if (dPlan(x + vx * 2 * vy / G9, z + vz * 2 * vy / G9) < 2.2 || dPlan(x, z) < 2.2) continue;
        put([x, sp.y, z, sp.t - T_BURST + r.range(0, 0.55)], [vx, vy, vz, r.range(0.05, 0.11)], [2, r(), r.range(0.45, 0.7), G9]);
      }
      // THE MOUTH'S RAFT'S WAKES (F.wake), AS THEY WERE: where each pattering bird ran, five white dashes on the sea,
      // each lit as the bird passes its place and gone in three seconds, and a few drops kicked up at each. Nothing
      // of them is changed by order 20 (their stream, their rows and their order among the rows are what they were).
      // THE LEG'S RAFT'S SPLASHES (F.legwake; order 20): A PATTERING BIRD STRIKES THE WATER AT ITS OWN BEAT, and each
      // strike leaves ONE SPLASH AT THE PLACE WHERE IT STRUCK. The beat is the bird's own: 4.5 to 6 strikes a second
      // (its rate), each interval an eighth longer or shorter at the most, the first strike a dealt share of one
      // interval after the bird's own second; it strikes as long as its wings beat (4 s: the body's law, POSED_VERT's
      // busy), left and right in turn, 5 to 16 cm to the side of its way. The place is the bird's own at that
      // moment (its seat and its run times 1 - exp(-0.35 s)). A splash is water thrown up where the bird struck:
      // it STANDS on the sea there, half a bird to a bird wide and 0.3 to 0.7 of a bird high, thrown along the
      // bird's way or up to 0.6 radians to either side of it (it leans that way), torn into fibres (the streak's
      // own); IT FADES BY ITS OWN AGE from the moment it was struck (the streak's law: up in a fifth of a second,
      // whole to a third of its life, gone at its life's end; it sinks back as it fades), ITS LIFE 0.8 TO 1.2 s, as
      // struck water's is; its strength is the wings' own (the last strikes, as the beat dies, leave little). No
      // length of wake is set anywhere: what stands behind a bird is what it struck in the last second, as far
      // apart as it flew between strikes. The splash is the thrown water: no drop is dealt beside it (a drop
      // thrown from one level of the sea, as the mouth's raft's are, would start under this sea, which rises all
      // along the leg). It reads the route's clock, the same the bird runs by, and nothing else of the route
      for (const [x, z, dx, dz, t0, leg] of patter) {
        if (leg) {
          const r = F.legwake, dl = Math.hypot(dx, dz), ux = dx / dl, uz = dz / dl, rate = r.range(4.5, 6); let side = r.sign();
          for (let ts = r() / rate; ts < 4; ts += (1 + r.range(-0.12, 0.12)) / rate, side = -side) {
            const beat = ss(0, 0.3, ts) * (1 - ss(2.5, 4, ts)), g = 1 - Math.exp(-0.35 * ts), lat = side * r.range(0.05, 0.16), wx = x + dx * g - uz * lat, wz = z + dz * g + ux * lat, th = r.range(-0.6, 0.6), c = Math.cos(th), sn = Math.sin(th);
            put([wx, wz, t0 + ts - T_BURST, r.range(0.8, 1.2)], [ux * c - uz * sn, uz * c + ux * sn, raftL * r.range(0.3, 0.7), raftL * r.range(0.5, 1)], [8, r(), r.range(0.4, 0.6) * beat, 1]);
          }
          continue;
        }
        const r = F.wake, dl = Math.hypot(dx, dz), G = [0.05, 0.13, 0.23, 0.34, 0.46]; S.at(0.105, sc);
        for (let k = 0; k < 5; k++) {
          const g = G[k], tk = t0 - Math.log(1 - g) / 0.35, wx = x + dx * g, wz = z + dz * g, len = dl * (k < 4 ? G[k + 1] - g : 0.12) * 1.15;
          put([wx, wz, tk - T_BURST, r.range(2.6, 3.6)], [dx / dl, dz / dl, len, r.range(0.14, 0.22)], [8, r(), r.range(0.4, 0.55), 0]);
          for (let j = 0; j < 2; j++) put([wx + r.range(-0.15, 0.15), sc.sea + 0.05, wz + r.range(-0.15, 0.15), tk - T_BURST + r.range(-0.05, 0.1)], [r.range(-0.6, 0.6) - dx / dl * 0.8, r.range(1.3, 2.7), r.range(-0.6, 0.6) - dz / dl * 0.8, r.range(0.04, 0.07)], [2, r(), r.range(0.4, 0.6), G9]);
        }
      }
      // THE FLOOD ON THE SECOND PASS UP THE NAVE (the route's flood; each piece shows from the moment the swell's crest is
      // within 16 m of its place, and is measured against the lens at the moments it shows):
      // POURING OVER THE PAVEMENT (F.pour): at stumps of the pavement's nave side that the flood covers or its run-up
      // wets (tops from -1.2 to 2.6 m), torn sheets fall from the rim into the hollow beside it, where the next place stands lower
      {
        const r = F.pour; let nP = 0, air = 99, k = 0;
        for (const q of A.stumps) {
          if (q.z > -27 || q.z < -62 || q.x < -14.5 || q.y < -1.2 || q.y > 2.6) continue;
          for (let e = 0; e < 3; e++) {
            const th = r.range(-1.25, 1.25), c = Math.cos(th), sn = Math.sin(th), x = q.x + (q.r + 0.15) * c, z = q.z + (q.r + 0.15) * sn, v = r.range(0.5, 1.1), wd = r.range(0.4, 0.8), T = r.range(0.6, 0.95), al = r.range(0.35, 0.55), s1 = r(), s2 = r();
            if (++k % 15 === 0) await yld();
            if (topHere(q.x + (q.r + 0.45) * c, q.z + (q.r + 0.45) * sn) > q.y - 0.5) continue;
            let m = 99; { const ft = floodMoments(); for (let t = 0; t < ft.length; t++) { const o = ft[t]; if (o.flood * ss(-16, -6, z - o.humpZ) < 0.02) continue; m = Math.min(m, Math.hypot(o.lensX - x, o.lensY - q.y, o.lensZ - z) - 0.9); } floodLast(); }
            if (m < CLEAR) continue;
            air = Math.min(air, m); nP++;
            for (const sd of [s1, s2]) put([x, q.y + 0.03, z, T], [c * v, 0.3, sn * v, wd], [7, sd, al, G9]);
          }
        }
        // FOAM ON THE FLOOD (F.lee): SOFT FOAM flat on the water WHERE IT MEETS ROCK ONLY: in the lee (north) of the
        // pavement's stumps and along the east wall's foot, the foam running through it. It is the water's own face:
        // the lens passes over it as it passes over the water, at the height it flies over the water (its least
        // distance from the lens at the moments it shows is noted)
        const rl = F.lee; let nLee = 0, nFoot = 0;
        const wallX = (z) => { let x = 4; while (x < 12 && hero.ceilAt(x + 0.3, z) >= 0) x += 0.2; return x; };
        const lensNear = (x, half, z0, z1) => {          // a strip of water from z0 north to z1, half wide about x: its least distance from the lens while the flood shows
          let near = 99;
          { const ft = floodMoments(); for (let t = 0; t < ft.length; t++) { const o = ft[t]; if (o.flood < 0.02) continue; const zc = clamp(o.lensZ, z1, z0); near = Math.min(near, Math.hypot(Math.max(0, Math.abs(o.lensX - x) - half), o.lensY - waterAt(zc, o) - 0.05, o.lensZ - zc)); } floodLast(); }
          return near;
        };
        let least = 99;
        // (ORDER 9: NOTHING OF THIS WORLD'S FOAM LIES ON THE OPEN WATER. The rafts that ran north with the flood either
        // side of the line were bright wriggling strokes just before the lens: they are out, and so are the small rafts
        // that raced to the face under the bell. The open water's white is the part's own law under setFlood)
        await yld();
        { let k = 0;
          for (const q of A.stumps) {          // in a stump's lee
            if (q.z > -27 || q.z < -62 || q.x < -14.5 || q.y < -1.2 || q.y > 2.6 || nLee >= 18 || rl() < 0.45) continue;
            const wd = 2 * q.r + rl.range(0.3, 0.8), len = rl.range(2.2, 3.6), x = q.x + rl.range(-0.2, 0.2), zc = q.z - q.r - 0.5 * len + 0.4, flow = rl.range(0.8, 1.6), sd = rl(), al = rl.range(0.34, 0.46);
            if (++k % 6 === 0) await yld();
            if (hero.ceilAt(x, zc - 0.5 * len) < 0) continue;
            least = Math.min(least, lensNear(x, 0.5 * wd, zc + 0.5 * len, zc - 0.5 * len));
            put([x, 0, zc + 4, 12], [flow, 4, len, wd], [6, sd, al, 2]); nLee++;
          }
          for (let z = -29.5; z > -61; z -= rl.range(3.6, 5.2)) {          // along the east wall's foot
            const wd = rl.range(0.8, 1.2), len = rl.range(4.5, 6), x = Math.min(wallX(z), wallX(z - 0.4 * len), wallX(z + 0.4 * len)) - 0.42 * wd, flow = rl.range(0.8, 1.6), sd = rl(), al = rl.range(0.34, 0.46);
            least = Math.min(least, lensNear(x, 0.5 * wd, z + 0.5 * len, z - 0.5 * len));
            put([x, 0, z + 4, 12], [flow, 4, len, wd], [6, sd, al, 2]); nFoot++;
          }
        }
        info.flood.pour = nP; info.flood.pourAir = air; info.flood.rafts = 0; info.flood.lee = nLee; info.flood.foot = nFoot; note('foam at the rock (flat on the water)', least);
      }
      // THE SURGE at the back wall, all of it by place and grown by the pile (the route's table): THE FACE, broad sheets of
      // white water standing on the heap against the rock right round the apse, two deep; drops thrown off its top into the
      // shaft's light
      for (let k = 0, r = F.face; k < 52; k++) {
        const th = (k % 26 + r.range(0.1, 0.9)) / 26 * 3.6 - 1.8, rw = wallR(th) - (k < 26 ? 0.45 : 1.05) - r.range(0, 0.3), x = Math.sin(th) * rw, z = AX0.z - Math.cos(th) * rw, wd = r.range(0.9, 1.9);
        let H = faceH(th) * r.range(0.45, 1.15) * (k < 26 ? 1 : 0.75); const top = waterMax(z) + 0.4;
        while (H > 1 && (beforeDisc(v.set(x, top + H, z), 0.5 * wd) || beforeDisc(v.set(x, top + 0.5 * H, z), 0.5 * wd) || beforeDisc(v.set(x, top, z), 0.5 * wd) || dTo(x, top + H, z) - 0.5 * wd < CLEAR)) H -= 0.5;
        if (H <= 1 || dTo(x, top, z) - 0.5 * wd < CLEAR) continue;
        note('the face', dTo(x, top + H, z) - 0.5 * wd); note('the face', dTo(x, top, z) - 0.5 * wd);
        put([x, 0, z, 0], [0, 0, H, wd], [5, r(), r.range(0.42, 0.58), 0]);
      }
      for (let k = 0, r = F.pile; k < 170; k++) {
        const th = r.range(-1.75, 1.75), rw = wallR(th) - r.range(0.5, 1.5), x = Math.sin(th) * rw, z = AX0.z - Math.cos(th) * rw, y = faceH(th) * r.range(0.5, 1), T = r.range(0.9, 1.7);
        const vx = -Math.sin(th) * r.range(0, 0.7), vy = r.range(4, 10), vz = Math.cos(th) * r.range(0, 0.7), wd = r.range(0.03, 0.07), sd = r(), al = r.range(0.4, 0.6);
        if (beforeDisc(v.set(x + vx * vy / 9.81, y + vy * vy / 19.62 + waterMax(z), z + vz * vy / 9.81), 0.75) || beforeDisc(v.set(x, y + waterMax(z), z), 0.75) || beforeDisc(v.set(x + vx * T, y + vy * T - 4.905 * T * T + waterMax(z), z + vz * T), 0.75)) continue;          // its start, its apex and its end over the highest the water stands there, as a ball of half its greatest length
        put([x, y, z, T], [vx, vy, vz, wd], [4, sd, al, 9.81]);
      }
      // SPRAY FALLING IN THE BELL (F.rain): drops and short threads of water coming down through the shaft's light round
      // the blowhole's foot, from the moment the swell comes in (the route's announce). Each falls its own straight way
      // from its own height to the water, again and again (the time's loop); by place its whole fall, measured every
      // half metre of it, keeps the line its clear air (CLEAR), and stands outside the cone to the disc
      { const r = F.rain; let nRain = 0, air = 99, nMeas = 0;
        for (let tries = 0; tries < 1400 && nRain < 220; tries++) {
          const th = r() * TAU, rad = r.range(2.7, 7.2), x = rad * Math.sin(th), z = AX0.z - 2.5 - rad * Math.cos(th) * 1.25, top = r.range(6, 24), v0 = r.range(2.5, 5), wd = r.range(0.03, 0.07), sd = r(), al = r.range(0.35, 0.6);
          if (tries % 40 === 39) await yld();
          const c = hero.ceilAt(x, z); if (c < 4) continue;
          const y0 = Math.min(top, c - 0.4), wl = waterMin(z) - 0.2; if (y0 < waterMax(z) + 3) continue;      // (it falls to the lowest the water stands there; the shader ends it at the water as it stands)
          let ok = true, m = 99;
          for (let j = 0; j <= 6 && ok; j++) { const y = lerp(y0, wl, j / 6); ok = !beforeDisc(v.set(x, y, z), 0.2); }
          if (!ok) continue;
          { const nq = Math.ceil((y0 + 0.6 - wl) / 0.5); for (let j = 0; j <= nq && m >= CLEAR + 0.02; j++) m = Math.min(m, dTo(x, lerp(y0 + 0.6, wl, j / nq), z) - 0.1); }      // (its clear air, AS A BODY: its whole fall, every half metre of it, from half a thread's length over its top)
          if (++nMeas % 6 === 0) await yld();
          if (m < CLEAR + 0.02) continue;
          const T = (-v0 + Math.sqrt(v0 * v0 + 2 * 3 * (y0 - wl))) / 3;          // its fall to the water (gravity 3: the drop is spray, held by the air)
          air = Math.min(air, m); put([x, y0, z, T], [0, -v0, 0, wd], [9, sd, al, 3]); nRain++;
        }
        info.rain = { drops: nRain, air }; note('spray falling in the bell', air);
      }
      // NOTHING OF THIS CROSSES THE PORTAL'S DISC, by place: how high up the blowhole a thing of half-width rb, standing at
      // (c, s) across the axis, may reach before one of the eyes that see the disc sees it inside the disc's outline
      const reach = (c, s, rb, from, to) => {
        for (let h = from; h <= to; h += 1) { v.copy(AX0).addScaledVector(AXD, h); v.x += c; v.addScaledVector(e2, s); if (beforeDisc(v, rb)) return h - 1; }
        return to;
      };
      // (ORDER 10) WHAT IS IN THE CHIMNEY AS WE GO UP IS DROPS, and nothing broad: fine bright drops (0.18 to 0.4 m
      // long, 4 to 5.5 cm wide) and a few short threads of beads (half a metre to 0.9 m, 3 to 4 cm wide) FALLING near the
      // blowhole's wall, 5.3 to 6 m from the axis the lens rides, each down its own straight way from its own top to the
      // bell, again and again (the time's loop), in the chimney's light by its height. No rope, no sheet and no shaft
      // stands there any more: nothing of this world's in the chimney is wider than 5.5 cm. Each one's top is as high as
      // it may be and still lie outside the cone to the disc (reach): none crosses before the ring.
      const fallIn = async (r, tries, want, thread) => {
        let n = 0;
        for (let i = 0; i < tries && n < want; i++) {
          const th = r() * TAU, wd = thread ? r.range(0.03, 0.04) : r.range(0.04, 0.055), rad = r.range(5.3, 6), c = rad * Math.cos(th), s = rad * Math.sin(th), len = thread ? r.range(0.5, 0.9) : r.range(0.18, 0.4);
          const top = Math.min(reach(c, s, 0.5 * wd + 0.1, 0, 59) - 0.5 * len - 0.2, r.range(18, 58));
          if (i % 40 === 39) await yld();
          if (top < 16) continue;
          put([c + e2.x * s, e2.y * s, e2.z * s, top], [r() * 58, -r.range(7, 12), len, wd], [0, r(), thread ? r.range(0.6, 0.8) : r.range(0.7, 0.9), 0]); n++;
        }
        return n;
      };
      const nDrop = await fallIn(F.fall, 600, N_DROP, false), nThread = await fallIn(F.ropes, 300, N_THREAD, true);
      await yld();
      // THE ROOF'S DRIPS: one over each cell of the part's sheet that opens rings (its own law: cells of 2.7 m, the cell's
      // hash over 0.35), where a hanging end of the part's true roof stands over open water (none under the open
      // blowhole), 3 m and more from the line in plan and not before the disc. It falls from that end's own foot, and the
      // shader drops it on the cell's own clock so that it lands as the ring opens.
      const roofHere = (x, z) => {
        const L = RK.cells.get(Math.floor(x / 2) * 4096 + Math.floor(z / 2)); let y = 99; if (!L) return -1;
        for (let n = 0; n < L.length; n++) {
          const id = L[n]; if (RK.y0[id] < 2 || RK.y0[id] + 0.15 >= y) continue;
          const c = RK.c[id], E = RK.e[id] || edgesOf(id), px = x - RK.x[id], pz = z - RK.z[id]; let d = -9;
          for (let k = 0; k < 7 && d <= 0; k++) { const ex = E[k * 3], ez = E[k * 3 + 1], l = E[k * 3 + 2]; if (l > 1e-4) d = Math.max(d, ((px - c[k * 2]) * ez - (pz - c[k * 2 + 1]) * ex) / l); }
          if (d <= 0) y = RK.y0[id] + 0.15;
        }
        return y > 90 ? -1 : y;
      };
      // h21 is the part shader's h21 in JavaScript: hash12 of Hash without Sine by David Hoskins: BROUGHT IN, see the head.
      const fr = (x) => x - Math.floor(x), h21 = (px, py) => { let a = fr(px * 0.1031), b = fr(py * 0.1031), c = fr(px * 0.1031); const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fr((a + b) * c); };
      let nDrip = 0;
      for (let iz = -33; iz <= -1; iz++) for (let ix = -8; ix <= 5; ix++) {
        const hc = h21(ix, iz); if (hc < 0.36) continue;
        const x = (ix + 0.3 + 0.4 * h21(ix + 3.1, iz + 3.1)) * 2.7, z = (iz + 0.3 + 0.4 * h21(ix + 7.7, iz + 7.7)) * 2.7, roof = roofHere(x, z);
        if (roof < 3 || z > -1 || dPlan(x, z) < 3 || topHere(x, z) > -8) continue;
        let hid = false; for (let j = 0; j < 5 && !hid; j++) hid = beforeDisc(v.set(x, lerp(roof, 0, j / 4), z), 0.15);
        if (!hid) { put([ix, roof, iz, 0], [0, 0, 0.3, 0.02], [1, F.drips(), 0.15, 0]); nDrip++; }
      }
      info.drips = nDrip;
      info.disc.white = { drops: nDrop, threads: nThread, fromAxis: 5.3 };      // (F.shafts deals nothing now: its name stays in the list of streams so that every other stream is dealt as before)
      // the spout: the second of the route from which it rises, and how far the lens is from the blowhole's axis then
      { q3.set(S.lens(U_TOP, 0), S.lens(U_TOP, 1), S.lens(U_TOP, 2)).sub(AX0); const al = q3.dot(AXD); info.spout = { risesAt: S.secAt(U_TOP), u: U_TOP, offAxis: Math.sqrt(Math.max(0, q3.lengthSq() - al * al)), upAxis: al }; }
      info.veins = 'flat on the water'; info.wind = K.wind;
      const N = rows.length / 12, iA = new Float32Array(N * 4), iB = new Float32Array(N * 4), iC = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) for (let k = 0; k < 4; k++) { iA[i * 4 + k] = rows[i * 12 + k]; iB[i * 4 + k] = rows[i * 12 + 4 + k]; iC[i * 4 + k] = rows[i * 12 + 8 + k]; }
      const G = stripG(6), sm = mat(STREAK_VERT, STREAK_FRAG, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide });
      add(bodyMesh({ p: G.p, i: G.i }, sm, N, { iA, iB, iC }, 'organ-streaks'), 'white water', 5);
      await yld();
    }
    await yld();
    if (ctx.renderer) await sky.prewarm(ctx.renderer, null, scene);

    // ---------------- every update: the route's tables into the part's hooks and this world's uniforms (nothing is made here)
    const buf = new THREE.Vector2(), gain = WU.uGain.value, mistK = 1, spumeK = lookId === 'gale' ? 1 : 0.25;
    const drive = (u, time) => {
      S.at(u, sc);
      hero.setLevel(sc.level); hero.setSea(sc.sea); hero.setSwell(sc.humpZ, sc.humpH, sc.humpHalf); hero.setPile(sc.pile);
      hero.setSpout(sc.spout * SPOUT, sc.head); hero.setFoam(sc.foam); hero.setWetLine(sc.wet); hero.setLift(sc.lift);
      hero.setGlow(K.glow * lerp(1, 0.7, ss(-1.4, 0.9, S.choir(u))));           // the glow follows the water's level in the choir (the table): full when it is low, 0.7 when the cave stands flooded high
      // cloud shadow: the sun's strength breathes slowly with the time (one value for the whole view; no shadow map)
      U.uSunCol.value.copy(sunBase).multiplyScalar(1 - 0.16 * (0.5 + 0.5 * Math.sin(time * 0.21 + shadePh)) * (0.5 + 0.5 * Math.sin(time * 0.083 + shadePh * 1.7)));
      WU.uSlide.value = sc.sec; WU.uFlow.value = sc.flow; WU.uBurst.value = sc.sec - T_BURST;
      WU.uFlood.value.set(sc.flood, sc.announce); WU.uSeaF.value.w = sc.crest;
      hero.setFlood(FLOOD_K * sc.flood);          // the part's own flood of its sheet, at FLOOD_K of its full: white ON green
      gain.set(mistK, clamp(sc.pile / 2.2, 0, 1), ss(0.8, 0.87, u), spumeK);
      sc.sealHead.x = 0.75 * ss(0.47, 0.53, u) * (1 - ss(0.66, 0.72, u));
      if (shark) { const z = sharkZ(sc.sec), wy = waterAt(z, sc); shark.position.set(SHARK_X, wy - sharkDeep(z, wy), z); }
    };
    const update = (dt, time, camera, u) => {
      drive(toV(clamp(u ?? 0, 0, 1)), time);      // (the engine's u is the flown line's; the script's is the part's line's)
      hero.update(dt, time);
      sky.update(dt, time, camera); rig.update(dt, time, camera); clouds.update(dt, time, camera);
      if (ctx.renderer) WU.uResY.value = ctx.renderer.getDrawingBufferSize(buf).y;
    };
    drive(0, 0); hero.update(0, 0);
    tris.total = Object.values(tris).reduce((a, b) => a + b, 0);

    return {
      scene, path: flown, duration: S.duration, pace: (u) => S.pace(toV(u)),
      camera: { fov: FOV, near: 0.3, far: 4000, lookAhead: AHEAD, bank: 0, sway: 0.2, nearThrough: 0.3 },
      pois: [legGaze, passGaze, { at: (time, u) => framing(time, toV(u)), from: toU(GZ.u0 - 0.02), to: toU(GZ.u3 + 0.05), fade: 0.02 / (GZ.u3 + 0.07 - GZ.u0), weight: 1, arc: true, steady: true }, liftGaze],
      portal: { shape: 'circle', radius: DISC, color: '#BFE0FF', glow: 1, tilt: true },
      post: { exposure: K.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.03, contrast: 1.04, tint: K.tint, shadowTint: '#000000', vignette: 0.3, grain: 0.02, aberration: 0 } },
      info: { look: lookId, season, density, rare, triangles: tris, clear, clock: (u) => S.secAt(toV(u)), toV, toU, ...info },
      update,
      dispose() { sky.dispose(); },
    };
  },
};
