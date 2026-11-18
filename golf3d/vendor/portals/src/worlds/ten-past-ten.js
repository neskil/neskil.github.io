// TEN PAST TEN: a clockmakers' exchange of iron and glass, about four times life, on a bright morning.
// x east, y up, z SOUTH. Every floor is y 0. Three rooms on a bent way:
//   THE PASSAGE      x -40..4, z 124..60, walls to y 30, a glazed segmental vault (crown y 44) on ribs every 8 m
//   THE ROUND COURT  centre the origin, wall radius 64, three ring galleries (decks y 14, 28, 42), drum to y 58, a dome
//                    of 24 ribs to the lantern at y 96; the floor is one inlaid dial of radius 50; the great pendulum
//   THE GREAT SHED   x 58..282, z -56..56, a glass barrel roof (crown y 96); its east gable is THE GREAT DIAL
//                    (src/parts/ten-past-ten.js), centre (280, 44, 0), radius 38, the portal in its hub.
//
// WHAT THE GREAT HANDS DO. They stand at ten past ten from the start of the route (and when this world is seen through
// the opening before it) up to 205 m. From 205 m they turn forward by the metres flown alone: the minute hand one and
// five sixths turns (660 degrees), the hour hand 55 degrees, gathering pace to 235 m, even to 385 m, slowing to 420 m.
// From 420 m to the end both stand straight up at twelve, at rest. update() calls hero.setMetres(u x the route's
// length) and nothing else moves them: no timer, no clock. Every other dial stands at ten past ten always
// (TEN_PAST_TEN, written once in the part file; this file never writes a hand angle).
//
// THE WAY. The brief's 41 points, unmoved; 483.8 m; duration 50; pace(u) is the brief's speed by metres over its mean.
// Beats, in metres of route: 0..57 the passage; 57..120 into the court; 120..225 the turn round the pendulum;
// 225..254 to the east arch; 254..330 the rain of watches; 330..420 the post clocks and the dial of light;
// 420..462 the face; 462..483.8 the hub and the portal. Gaze: the pendulum 60..215 m, the great hub 215..440 m
// and, a lesser part beside it from 300 m to 436 m, the centre of the dial of light on the shed's floor.
//
// WHAT SWINGS moves by the time given to update(), in shaders, by instance attributes: the great pendulum (12 s),
// every longcase, regulator and drop-clock pendulum (1.6..3.2 s by its length, dealt 0.97 to 1.03 times that:
// 1.55..3.30 s; a phase each; the walls of clocks' among them: 479
// small pendulums in all), the shop windows' and the work benches' balances, every watch on its chain (a quarter turn and back in
// 7..12 s; a swing of at most 0.5 m in 6.8..13.7 s: six seconds and a tenth of a second for each metre of its
// chain). The rare visit (ctx.vary.rare)
// takes PENDULUMS ONLY: every longcase, regulator and drop-clock pendulum swings with the great pendulum's period
// (12 s) and in its phase. Balances and watches keep their own time. Every draw of the random stream is made
// whether the visit is rare or not, so a seed deals the same clocks, woods and benches either way.
//
// LOOKS. ctx.vary gives hour, rare, density and mood; it gives no weather hint, so the look is read from mood:
// hour 'day' or mood >= 0.52 morning sun; mood 0.30..0.52 wind and cloud; mood < 0.30 rain on the glass (a low sky of
// silver and blue-grey cloud drifting by the clock, lighter toward the horizon; water in sheets and threads on every
// pane; the shed's floor wet). Behind the glass, in every look, a level floor of mist with slow billows lies under the
// horizon and a bright band along it.
// ctx.rng deals the iron's paint (green, prussian, graphite), the enamel (white or ivory), the passage's tile figure,
// the pair of woods, each longcase clock's shade about its wood (8 per cent either way), the case of each clock on the
// court's walls (one of four woods, or brass), every phase, every period but that of a watch's swing
// (the plan's, by the length of its chain), each watch's facing and the azimuth of its swing. density thins only the watches of the lattice and the benches' dressing; the graphics level
// thins no watch and no clock (it sets the dust's count and the great dial's rivets). Never dealt: ten past ten,
// the hands' red, the counts, places and sizes of the plan (a watch's place, its size and the reach of its swing
// are the plan's: two seeds hang every watch alike). The plan's too, from generators of its own (the same on every
// seed): which of the four longcase woods a longcase clock is of, the radius of each clock of the walls of clocks
// and the order of the ranks in each of their storeys.
//
// DIAL WEIGHTS are dealt once at build by plan distance d from the flown line (never by the eye):
//   watches             near d < 10 (the case with bow, crown and engine-turned back), middle d < 30, far beyond
//   post clocks         near (the inner row's eight: seven 10 m off, one 16 m), middle (the eight at 21 m)
//   bracket clocks      near;   passage wall and shop clocks: middle;   tower dials: middle
//   longcase clocks     middle d < 30, far beyond;   the floor dial: the face law in the floor's own shader
//   court wall clocks   (the walls of clocks) and the piers' roundels: near d < 14, middle d < 30, far beyond
// Gallery balusters are modelled where the deck's edge is within 20 m of the line in plan and drawn on a flat member
// beyond. Lattice webs, glazing bars and the gable's fan work are drawn on flat members at every distance, each
// filtered by the pixel's footprint to its true cover (see PANE_FRAG); the nearest glazing bars to the line are the
// south screen's (8.0 m, behind the start), the shed's west gable's (8.2 m), the shop windows' (14.2 m) and the
// passage vault's (20.8 m, at its springing).
//
// THE SUN'S SHADOWS are closed forms of the plan (worldSun in SHADOW_GLSL): walls, vault, dome and roof ribs, purlins
// and glazing bars, gallery decks, the pendulum's bob, the post clocks on the shed's floor, and in the shed the part's
// dial of light. There is no shadow map, no halo and no glare card. In the court, the shed and the passage, surfaces
// turned from the sun take a fill of sky light and of the sunlit floor's bounce, by place (FILL_GLSL).
//
// STRUCTURE OF THIS FILE: plan constants; a geometry writer; GLSL (SHADOW_GLSL light and shadows, FILL, SOLID, PANE, FLOOR,
// SKY, DUST, CHAIN); setup(): look, path and pace, hero, materials; then the steps of build(): the passage; the court
// (walls, piers, galleries; ranks, walls of clocks, drum, dome); the shed; floors, sky and the great pendulum; the dials (instanced);
// watches; post clocks, benches and dust; the counts of clear air. update() sets uniforms and the pendulum's angle.
//
// DIALS OF THE PLAN, the same on every seed: 82 shop clocks, 176 wall clocks, 12 bracket-clock faces, 30 tower dials
// (28 in the shed, 2 in the court), 260 longcase clocks, 210 court wall clocks (the walls of clocks), 12 roundels on
// the court's piers and the east arch's jambs, 64 post-clock faces, 9 standing regulators, 586 watches, the floor
// dial and the great dial: 1,443. Only a density hint under 1
// takes any away: it thins the lattice's watches by a dealt rank (507 are left at a density of 0.7). The graphics
// level takes none.
//
// WEIGHT, counted by the renderer's own law (each mesh's bounding sphere against the frustum, fov 60 at 16:9; an
// instanced mesh counts every instance; the watches, the pendulum and the sky are drawn in every view) along the
// WHOLE line, every 2 m of route, with the engine's gaze (look-ahead 18 m, the three pois, the bank): the greatest
// figure of any look and any setting is 392,603 triangles, at the very start of the route (392,523 at 2 m: the
// passage whole, and through its mouth the court and the shed, by their bounding spheres), alike on every setting;
// and from 170 m to 182 m of route (in the turn round the pendulum, as the gaze leaves it: court, arch and shed all
// in view) it is 385,497 on the high setting, in every look alike (the looks build the same things; medium weighs
// 648 less there and low 846 less, by the great dial's rivets). It holds for every seed: it is counted
// with every bench fully dressed and every watch kept (a density hint under 1 hangs fewer: 382,363 at the start
// with the 507 of a density of 0.7), and the watches' weights are the plan's (115 near at 412 triangles, 276 middle
// at 134, 195 far at 54, 586 chains of 2: 96,066). The walls of clocks weigh 39,698 in all (210 dials: 148 near at 166, 14
// middle at 48, 48 far at 16, 26,008; cases with their backs, boards, battens and frames 10,726; 114 pendulums of
// 26, 2,964). The twelve roundels' dials weigh 1,092 (6 near, 6 far).
// THINGS ARE DRAWN BY ROOM, because the renderer leaves a mesh out only when its whole bounding sphere stands
// outside the view: the passage's shell and its middle dials as four rooms (pasRoom), the walls of clocks as
// three groups (by the passage's mouth, north of the east arch, south of it), the court, the shed and its east end.
// Everything built, were it all in view at once, is 422,993 triangles at most (the high setting, every bench fully
// dressed, every watch kept), in 67 draws (66 meshes and the dust's points); info.trianglesBuilt and info.meshes
// hold the visit's own figures. The page's renderer adds the engine's own objects to both.
//
// CLEAR AIR, counted by build() into info.clearAir against the line every 0.25 m, each thing over its whole sweep
// (metres of clear air: the thing's own size is taken off): the pendulum's bob with the nut under it 24.8 m and its
// rod 29.2 m; post clocks 5.6 m (each part taken as its axis swollen by a radius that holds it, the head a ball of
// 4.4 m; the built heads, shafts and feet themselves stand 7.5 m off or more, counted from 250 m to the line's
// end); bracket clocks 13.6 m; gallery fronts and columns 7.36 m; the piers' inner corners
// with their mouldings, and the roundels on their faces, 5.42 m; the east arch's jambs and their roundels 6.48 m;
// THE WALLS OF CLOCKS 6.9 m (every case with its glass, every trunk; none stands more than 0.5 m proud of its
// wall); the great hands at every angle 9.26 m; everything
// else (floors, walls, ranks, the hub's bore) 6.6 m. Watches: no chain hangs nearer the line than 4.7 m in plan;
// taken as the plan takes it (watchSize: a ball of 1.26 radii swollen by 1.3 times the swing's reach, on its
// chain) no watch comes nearer than 3.24 m, on every seed. Dust: no speck is dealt within 6 m of the line (sampled
// every half metre and at its very end; between two samples the line bows less than a millimetre from the straight,
// so a place that is left stands 5.993 m off or more), and a speck drifts 1.45 m at the most, so none comes nearer
// than 4.54 m.
// THE SIGHT CONE, counted by build() into info.sightCone, for every eye of the line from 254 m to 420 m (every
// 0.5 m). THE WATCHES keep the cone from the eye to the circle of radius 34 about the great dial's centre (the
// minute hand's reach): least margin of any watch (case, bow, swing and chain) 0.31 m; watchesMoved: the places
// that were raised or set aside to clear it (151). THE POST CLOCKS keep a narrower cone of their own, to the circle
// of radius 12 about the hub (the boss, the collar and the hands' roots): least margin of any post clock (head,
// brackets, roof, finial, column, foot) 1.19 m (posts); a head the cone holds under its cap is held 0.5 m from the
// two hands as well (postsToHands), and a head that the cone does not hold, where it would stand before a hand,
// is set further from the line until it does not (one is: see the departure of the post clocks), so no head
// stands before a hand (postsBeforeHands 0).
// WATCH TO POST CLOCK, counted by build() into info.watchToPost: the least distance of any watch (case, bow and
// swing) or chain from any part of any post clock: 0.51 m; moved: the places moved for a post alone (29).
// WATCH TO WATCH, counted by build() into info.watchToWatch: the least distance between any two watches as the plan
// takes them (each case with its bow at its greatest swing and turn, each chain over its whole swing): 0.3 m;
// moved: the places moved for another watch alone (83). All three counts are the same on every seed, setting and
// density (a place the density hint thins away is set clear with the rest and then left out).
// info.watchesGathered: the watches of the gathering as they hang after those moves (277).
//
// WHAT STANDS IN WHAT. No surface of one thing crosses a surface of another, and no two lie in one plane over one
// another, but at a JOINT, where the one is made to sit on or in the other: pieces of one thing (a head on its
// trunk, a bezel over its own case's lip, a middle dial's ring on its disc, a near dial's glass in its bezel, a
// chain's foot in its bow (inside the ring of a near watch's bow; on the top side of a middle or far watch's flat
// bow, edge to edge), a watch's pendant in its bow, a modelled longcase's finial in its hood's round top (a far
// case's finial, one flat triangle, touches the hood's ridge at the middle of its base, the base's two corners a
// little above the flats), a pendulum's rod run up into its clock's head: a small one's
// into its case, a long one's into its hood, through the moulding under it on a modelled case and through the
// hood's own floor on a far one); the building's fixed members let into or
// butted against one another (a rail into a post, a deck into a pier, a pilaster against its wall, purlins
// through ribs; the shed's roof, its glass and its purlins, ends on the plane of the east gable's fan work, and
// the fan work's outline lies on the roof's flats, corner for corner; the passage's vault, its glass and its purlins, runs on through the round wall over the mouth,
// and west of the mouth as far as that wall where it falls back north, 0.12 m into it, and the wall over the
// mouth stands with its foot on the vault's glass as it is built, flat by flat, its purlins passing through that
// foot; the drum's ring beam, where the east arch's round cuts it, is carried on to the arch and ends on the
// soffit's inner line as that is built, its end in the arch's brow but for 0.044 to 0.048 square metres of its
// section, which stand bare beside the brow in the brow's own paint); a thing with its back in
// its wall's plane, or butted against the side of the iron beside it; glass run into the iron that bounds it, or
// laid on the outer face of the rib that carries it (the shed's west gable's glass stands with its foot on the
// dome's flat panes and on the drum's top as they are built); a contact shade under the thing it shades and, at a
// bay's end, on under the pilaster; what hangs, in what it hangs from (a watch's chain from a hook, which is not
// built, 0.02 to 0.11 m under its glass or its iron, or in the end of a short iron arm out of the roof's iron).
// What moves keeps clear over its whole sweep (a longcase clock's bob by 0.024 m at the most its swing may reach).
// A FLAT FIELD ON A FACE is a sheet a little before that face. Two on a modelled longcase touch nothing: its
// raised panel 0.02 m before its plinth's face, the dark glass of its hood's door 0.01 m before the hood's front;
// the door's frame, a little before the hood's front too, is crossed by the hood's two columns and its cornice
// bar. Of the same kind, among others, are the battens of the walls of clocks, a little before their boards (some
// meet iron at an end), a wall clock's field, a little before its board too, a drop-dial's dark
// back, a little before that field, and the panel of an open shop door's leaf, a little off its leaf. A balance
// wheel's hub, on no face, stands a little clear of its arms.
// IN ONE PLANE AND SEEN TOGETHER from the line, and why they do not fight: two panes of one buffer (the first
// rib's lattice web, which stands in the west gable's glass's own plane) are drawn in the order they are written,
// without depth writing, so the later lies over the earlier at every pixel; two faces of one paint that look one way (a bar's end flush in
// the bar it meets: an iron pier's mouldings, the balustrades' rails, the drum's mullions, the side walls'
// mouldings, a bench's rails, a balance wheel's arms, a great hand's plates) take one colour and one light, so the
// pixel is the same whichever of the two is drawn.
// OPEN, AND MEANT (nothing else is: no ray from the line passes out of a room but through an opening of the
// plan or through this, and from no place on the line does the sky show where a wall, a roof, a floor or glass
// belongs): the bore of the great dial's hub, radius 6.6, is open air with the portal in it, and the sky shows
// through it. THE PORTAL (radius 6, 2 m west of the glass; brief: a clear warm white with a bright rim) is named
// with a warm white, '#ffe9c4', the engine's 'ring' look and a glow of 0.75 (the engine gives 1 where a world
// names none): the white is taken that deep and the glow under 1 because the rim burns white in the picture and
// its bloom falls on the boss's dark iron beside it. THE RIM, measured in the picture from 454.7 m of route (29 m
// before the portal; 640 by 360 pixels): its white (all three channels over 235) lies from 5.6 m to 6.25 m of
// the portal's middle, the greater part of it inside the portal's edge and all of it inside the bore's (6.6 m).
// That white, none of it sky seen through glass, moves with the moment (the engine turns lobes of brighter and
// dimmer light round the rim in time). Counted at two moments in the sun look and at one in the rain, in more
// than one dealt world of each look, it is 0.58 to 0.64 per cent of ALL the picture's pixels in the sun look and
// 0.67 per cent in the rain; by the stricter count, the same white over the pixels that are not sky, it is 0.87
// to 1.03 per cent in the sun look and 1.18 to 1.19 per cent in the rain. The disc within the rim is the
// engine's own.
// NOT OPEN, BUT GLASS WHERE THE ARCH IS: the shed's west gable's glass ends on the east arch's true
// round, so it stands 0 to 0.032 m inside the outer edge of the soffit's 36 straight runs, which touch that round
// at their middles: a lip of glass, 0.48 square metres in all (0.46 of them between the jambs' lines), where a
// soffit laid inside the round would leave a slit. The lip is seen from the line, faintly, the gable's own glass
// along the soffit's edge: at 26 m of route, from 92 m to 228 m and from 238 m to 242 m, counted from an eye at
// every 2 m (from 28 m to 90 m no place of it is in view; from 230 m to 236 m what is built before it hides
// it).
//
// DEPARTURES FROM THE BRIEF (the brief is not edited; no point of the way is moved):
//   - Longcase clocks: 260, one every 2.6 m (brief: one every 3.2 m, about 400). The galleries and their ranks stand
//     on 158 degrees of the round, in four stretches between the piers; at 3.2 m that holds 216. A longcase clock's
//     dial is 1.6 m across (brief: 1.3 m), so that it reads from the line.
//   - Dials in all: 1,443 (brief: about 1,270), by the longcase count above, the walls of clocks, the piers'
//     roundels and the watches below.
//   - The first bay of the passage's east side (z 60 to 68) has no shop (brief: each side wall a shop front, with
//     shelves of small clocks behind the panes): the court's round wall meets the passage's east wall at z 63.87,
//     and that wall and the pier at 82 to 86 degrees stand where the shop's recess would be. The bay has a closed
//     front of iron panels; its six clocks and two balances are not built: 82 shop clocks.
//   - THE WALLS OF CLOCKS are not the brief's: 210 wall clocks hung close in ranks where the line passes nearest
//     to a wall. By the passage's mouth (the line passes them nearest from 64 m to 83 m of route, 7.6 to 12.5 m
//     off in plan): on both cheeks of the pier at 134 to 138 degrees (16
//     and 10 clocks), on the plaster between that pier and the mouth's west jamb (7), and on the passage's west wall
//     where it runs on to the court's round wall (20). By the east arch (nearest from 227 m to 244 m of route): on
//     both cheeks of the pier at 310 to 314 degrees (25 and 16) and on the plaster between it and the arch's north
//     jamb (three bays of 16); and the same three bays south of the arch (48; 58 to 67 m from the line in plan).
//     And 10 on each of two cheeks more, the one toward the coming eye of the piers at 168.5 and at 244.03 degrees
//     (on the 3.85 m toward the court; 13.8 to 15.7 m from the line in plan, which passes them nearest at 111.5 m
//     and at 171.5 m of route, 14.7 m off).
//     Round clocks in turned cases (96) and drop-dial clocks (114: an eight-sided head over a trunk with an opening
//     in which a small pendulum swings), dials 1.10 to 2.19 m across (each radius the programme's less up to 18 per
//     cent, and the order of a storey's ranks dealt, both by generators of the plan's own), cases of four woods
//     (the dealt pair's two, a honey wood and a pale oak) and of brass, on boards of panelled wood between iron
//     rails, the plaster's in iron frames; every dial the kit's, at ten past ten. The ranks stand from 3 m to 26.7 m up and, by the east arch,
//     where the eye passes at 27.5 to 29 m, a third storey on to 40.5 m; a large one hangs next the eye's
//     height where the line passes. For them the cheeks of those two piers and the two cheeks more have no sunk
//     panel or lattice web below their rail at 27.5 m (the arch's pier none at all), the passage's west wall has
//     none where it runs on to the court,
//     and the plaster behind the boards has no sunk panels.
//   - The galleries stop at piers set back from two openings: at 50 degrees either side of the east arch's axis (its
//     jambs stand at 32) and at 138 degrees by the passage's mouth (its west jamb stands at 129), so that the gallery
//     fronts keep 7.36 m from the line. The line itself is the brief's, and by the plan it passes the mouth's west
//     jamb at 9.4 m (brief: 14.3 m from the west pier) and the east arch's north jamb at 6.5 m (brief: 9.8 m).
//   - The court's two tower dials stand in the round wall with their faces at radius 64.9 (brief: centres at radius
//     64.0 and 63.5).
//   - Under the great pendulum's bob hangs a turned brass rating nut, its tip 7.2 m below the bob's centre (2.2 m
//     below its rim, 4.8 m over the floor at rest); the brief names the bob and rod only.
//   - The shop windows' balances stand open before their clocks, with no glass dome over them (brief: some clocks
//     under glass domes with a turning balance). The shed's work benches carry balances too, each open on a
//     turned brass stand among the bench's dressing and thinned with it (the brief has balances in the shop
//     windows only).
//   - WOOD stands in more places than the brief gives it (brief: wood only for the longcase clocks' cases and the
//     benches, in dark and honey tones). Besides the walls of clocks named above: the passage's wall clocks of its
//     three lower rows have cases of the dealt pair of woods, lifted to a luminance of 0.15 and 0.19 at the least
//     (the top row's are black); the shop windows' clocks have cases of the two darker case woods (0.105, 0.125)
//     and stand in recesses lined with wood (the sides the boards' wood, 0.15 or over; the back the fields', 0.19
//     or over); the shops' shelves and recess floors are of the lighter of those passage case woods (0.19 or
//     over), and the shed's crates of the pair at its dealt luminance. Both dealt woods are turned from red toward
//     brown at their own luminance, whichever pair is dealt (as paint the woods of every pair then stand from
//     33 to 40 degrees of hue, where the pairs as dealt stand from 21 to 33). THE WOODS ARE
//     FOUR where the brief has dark and honey: the pair's darker and lighter wood, a honey wood and a pale oak
//     (the walls of clocks' cases at 0.105, 0.125, 0.30 or over and 0.415; the longcase clocks' at 0.11, 0.15,
//     the honey and 0.85 of the oak). Which of the four a longcase clock is of is the plan's: 68, 68, 66 and 58
//     of the 260.
//   - NO PANE IS BUILT BEFORE A TRUNK'S PENDULUM (brief: a glazed trunk door behind which its pendulum swings).
//     A longcase clock's long door, a regulator's and a drop clock's trunk are each an opening on a dark back,
//     before which the pendulum swings; where a line below calls such a door or trunk glazed, it means that
//     opening.
//   - Watches: 586 (brief: about 420). 304 places are laid as a gathering by the way, and 277 of them hang, after
//     the moves below, between 258 m and 335 m of route within 26 m of the line in plan and within 12 m of the
//     eye's height there; the rest hang on a lattice of 5.6 m (brief: about 9 m) through the rest of the shed's
//     air. A watch is 0.7 to 1.4 m across (brief: 0.45 to 1.0 m). THE GATHERING IS DEALT LARGE: a place of the
//     gathering is a large watch, 1.12 to 1.40 m across, whatever the plan's draw for it says (the draw is still
//     made, so no other draw moves), where the lattice keeps the plan's deal of one large watch in four: 372
//     watches are 1.12 m across or more, the 304 of the gathering and 68 of the lattice's 282.
//     They are paid for by the near weight's threshold: a watch is of the near weight within 10 m of the line in
//     plan (the court's wall clocks within 14 m), so 115 are near, 276 middle and 195 far.
//     No watch and no chain hangs in the watches' sight cone (above) or within 0.5 m of a post clock, and no two
//     watches come within 0.3 m of each other at any moment of their swings and turns: 151 places are raised over
//     the cone or set aside from it in plan, 29 are moved for a post and 83 for another watch, each by the least
//     move, so that they ring the great dial instead of crossing it. Three watches of the lattice so raised hang
//     with their dials' centres at y 56.6, 57.0 and 58.1 (brief: y 16 to 54), and two hang at x 61.25 and 61.39
//     (brief: from x 62) by the lattice's jitter of 1.5 m either way. Their weight is 96,066 triangles (brief:
//     25,000; near 110 with its chain, far 36): a near watch is 414 with its chain, a middle one 136, a far one 56.
//     Which watches are the large ones, each watch's size and the reach of its swing are the plan's, the same on
//     every seed (brief: which watches are the large ones is the seed's), so that no place is cleared by a number
//     the seed deals and two seeds hang every watch alike; the seed deals a watch's facing, its two phases, the
//     period of its turn (7 to 12 s) and the azimuth of its swing.
//   - A watch's swing has the period 6 s and a tenth of a second for each metre of its chain (6.8 to 13.7 s as
//     they hang): the plan's, not the seed's (brief: the seed deals the periods of everything that swings).
//   - A chain whose line meets the roof's iron on its way up ends at that iron and hangs from it (brief: each on
//     its chain from the roof): of the 586 chains 508 hang from the roof's glass, 63 from a purlin and 15 from the
//     lower chord of a rib; 17 of those 78 hang from a short iron arm out of that iron, which stands beside their
//     line or steeply over it. The hook a chain hangs by is not built.
//   - Weight: the greatest figure along the line is 392,603 triangles (brief: an aim of 400,000 and a limit of
//     450,000), but its classes weigh otherwise than the brief's. Wall, window and bracket clocks (brief: 40,000
//     together): the court's walls of clocks weigh 39,698, the piers' roundels 1,092 by their dials, and the
//     passage's wall, shop and bracket clocks 16,872
//     more by their dials and pendulums alone (258 middle dials at 48, 12 near dials at 166, 96 pendulums at 26;
//     their cases are written into the passage's shell), with 3,300 for the shop windows' 30 balances at 110
//     (the work benches' balances, at most 18 more in the same mesh, are set out and thinned with the benches' dressing); the
//     16 post clocks weigh 43,416 (brief: 42,000; 16 heads at 1,856, 16 bases at 272, 15 shafts at 168, 32 near
//     faces at 166 and 32 middle faces at 48); and the 260 longcase clocks weigh 72,332 (brief: 48,000; near 180,
//     far 60): 208 with the modelled case at 320 each (case 240, a middle dial 48, pendulum 32) and 52 with the far
//     case at 111 (63, a far dial 16, 32). The 9 standing regulators, in the far case, weigh 999 more.
//   - A small pendulum's period is dealt 0.97 to 1.03 times the period of its length, so the periods run from
//     1.55 to 3.30 s (brief: 1.6 to 3.2 s by length): pendulums of one length drift against one another.
//   - A watch's chain is one ribbon turned about its own length to face the eye (a round chain looks alike from
//     every side). The chain is 0.06 m wide. Where one pixel at the chain's straight distance from the eye is
//     wider than 0.06 m (from 37.4 m on a frame 720 pixels high, 23.4 m on 450, 56.1 m on 1080) the ribbon is
//     drawn that one pixel wide and its cover is 0.06 m over the drawn width, so drawn width times cover is the
//     chain's true width at every distance: the pixel's filter, by which nothing is thinned or faded. The
//     one-pixel width holds at the frame's middle; away from the middle, where a metre at the same straight
//     distance spans more pixels, the ribbon is 1/cos A to 1/cos^2 A pixels wide (A the angle from the frame's
//     axis) and the cover, a ratio of two widths in metres, stays true. The sun's share is read on the chain's
//     axis.
//   - Post clocks: the inner row stands 10 m from the line in plan (brief: 9 m), the outer 21 m; and ONE OF THE
//     INNER ROW, at 398 m of route, stands 16 m off. At 10 m its head, at the eye's height as the brief has it and
//     not held lower by the cone, would stand before a great hand as it turns for some eye of the line (4.56 m
//     inside the hand as the posts' plan takes it, handBars): such a head is set outward 2 m at a time until it
//     keeps 0.5 m from both hands (postPair), and at 16 m it keeps 0.83 m. It then stands 8.9 m in plan from the
//     outer post of its side at 391 m (the like two at 363 m and 370 m stand 13.7 m apart) and 37.6 m from the
//     post across the way at 405 m (the seven like pairs before it stand 31.65 to 31.86 m apart). THE HEADS OF THE
//     SOUTH SIDE stand as the brief has them: the inner row's four at the eye's height at their stations (33.49 m
//     at 314 m of route, 34.62, 37.13 and 40.15 m at 398 m), the outer row's four 4 m over it and under it by
//     turns (37.4, 30.2, 40.4 and 35.4 m). THE HEADS OF THE NORTH SIDE stand BELOW the eye (brief: at the eye's
//     height, the outer row 4 m higher or lower): the way runs south of the dial's axis there, and at the eye's
//     height they would stand before the hub. Each is as high as keeps it 0.5 m outside the posts' sight cone (to
//     radius 12 about the hub) and 0.5 m from the two great hands as the posts' plan takes them for each eye
//     (handBars): 9.6 to 23.4 m above the floor, 10.5 to 31.3 m under the eye. A low head stands on a shorter
//     fluted column, and the lowest (at 405 m) on a foot of 4.57 m alone, with no column (brief: on fluted
//     columns): 15 columns.
//   - THE POSTS' SIGHT CONE (the brief names no cone; it sets each head at the eye's height and asks nothing
//     before the hub's ring and the portal, which this keeps) is narrower than the watches' (radius 12 about the
//     hub where the watches keep 34), so a head may stand before the dial's face: counted on the built heads,
//     columns and feet from every eye from 254 m to 420 m (every 0.5 m), six heads stand before the circle of
//     radius 34 for some eye, all of the north side (those at 300, 328, 349, 356, 377 and 384 m: over eyes from
//     254 m to 343.5 m in all), the innermost 19.17 m from the dial's centre (the head at 349 m, seen from
//     269.5 m of route); no part of any post stands before the circle of radius 12, so none before the boss or
//     the collar, and NONE BEFORE A GREAT HAND as it stands for that eye: no post comes nearer the minute hand
//     as seen than 1.87 m (taken in the hand's own plane), and none nearer the hour hand than 2.79 m.
//   - The hour hand's plane stands 1.3 m before the great dial's glass (brief: 1.6 m; the minute hand's 2.4 m, as
//     the brief): a hand with its flanges, rivets and bolts is 1.06 m deep, so the hour hand lies from 0.96 to
//     2.02 m before the glass and the minute hand from 2.06 to 3.12 m, and the one passes behind the other with
//     0.04 m between them; at 1.6 m the two would meet.
//   - The dial of light reads the hub in its depth (brief: the ray is carried on to the plane x 280 and tested
//     there against the dial's ring, strokes, web, hub and hands): the boss ring as it is built, from 0.9 m behind
//     the glass to its chamfered mouth 2.6 m before it (the bore 6.6 in radius as far as 2.3 m before the glass
//     and 6.9 at the mouth; the outer side 9.5 and 9.2), each hand with its collar in the hand's own plane (1.3
//     and 2.4 m before the glass), and a place nearer the glass than a hand's plane is not shaded by that hand. A
//     hand is drawn outside its collar only, so that the two covers add and their mean holds under a wide
//     footprint (the part gives the cuts and the figures). So the bore passes light to 93.3 square metres of the
//     floor (as built: 93.2; a plain disc in the glass's plane would light 135.5, of which the boss as built
//     shades 42.3), and the drawn shade of hub and hands differs from the shade of what is built over 17 to 35
//     square metres of floor, counted at every metre of route over the hands' whole turn, from 205 m to 420 m
//     (with the boss and the two collars read as one flat ring in the glass's plane, the blades and tails in the
//     hands' own planes: over 123 to 146; with the hands read in the glass's plane as well, as the brief has it:
//     over more still). What is left is the depth of the hands and their
//     collars themselves (the hour hand's bare collar 0.66 m, from 1.00 to 1.66 m before the glass; the minute
//     hand's with its gussets 1.00 m, from 2.10 to 3.10 m; a hand 1.06 m), each read at its one plane. On the wet
//     floor the mirror takes each hand in its own plane too, less what the boss, between its mouth and that
//     plane, hides of it from the mirrored eye. The boss is read there at two depths at most, its throat and its
//     mouth (for the minute hand, whose plane stands farther from the glass than the throat, at the mouth alone),
//     and the bolt heads and rivets that stand proud of its mouth are not read: for a mirrored eye from
//     250 m to 390 m of route, counted at every 20 m, nothing is left red where the boss stands first; from
//     about 400 m on the mirror's image of the hub is not exact, where a turned ray can clip the boss's side
//     between the hour hand's plane and the throat, cross its slope between the two depths, meet a bolt head
//     or a rivet before the boss or, at the very end, begin nearer the glass than the mouth: specks at first,
//     then slivers and, in the last few metres of the route, a large part of the red the mirror draws of the
//     hands, at floor places steeply below the eye. Under a wide footprint the bore's cover is the least of
//     three rounds along the ray (its back, its throat and its mouth), each filtered as a disc that keeps its
//     area: exact where the ray is square on to the dial; under the world's sun (a ray drifts 0.14 and 1.01 m
//     across the dial for each metre before the glass) the three stand apart, the lit shape is a lens of 94.21
//     square metres in the glass's plane, and the least of the three stands over the lens's own area by 1.0005,
//     1.0042, 1.0117, 1.0305 and 1.0720 under footprints of 1, 3, 5, 8 and 12 m. Its exact form would be the
//     lens's own closed mean.
//   - THE DIAL'S FIXED IRON IS DRAWN FLAT IN THE DIAL OF LIGHT, in the glass's plane, though it is built deep: the
//     rim from 0.9 m behind the glass to 1.69 m before it, the strokes from 0.10 to 0.94 m before it, the minute
//     ring to 0.70 m, the web from 0.25 m behind it to 0.64 m before. Under the slanting sun (a ray drifts 1.02 m
//     across the dial for each metre before the glass) the iron as built shades, inside the dial's circle, 447
//     square metres, counted in the glass's plane (a hundredth less on the floor), that the law draws lit, with
//     the hands at ten past ten (over half of it by the web, then by the rim, the minute ring and the strokes;
//     442 of them where no hand shades as well), and 454 at twelve; the law draws dark about 4 square metres
//     that nothing built shades. Of the light that falls on the dial's disc the law passes 0.535 where the dial
//     as built passes 0.456 (a little more of each at twelve). Outside the dial's circle the rim as
//     built, by its depth, shades about 141 square metres more, over the dado's top, where the law draws the
//     gable's mean share of light (0.777).
//   - The great hands (the part) are bold iron plate girders with flanges, rivets, a raised rib and a pierced eye (the
//     minute hand 3.4 m wide at its root and 1.6 m at its waist, the hour hand 5.2 m and 3.0 m, painted a deeper shade
//     of the same vermilion so that the two are told apart at twelve), not open lattice; they take the haze at half,
//     so that their red carries the shed's length. The web behind them and the gable's fan work have 24 radial bars
//     (and the web three rings), each member 0.30 m wide (the fan work's second order and its band are named
//     below); the web's 72 bolted plates where bar meets ring (0.68 m square) are modelled but left out of the
//     dial of light.
//   - THE GREAT DIAL'S SMALL IRON IS DEALT BY WHAT THE LINE SEES OF IT (brief: rivets far from the line are drawn
//     on flat members and near it modelled; the great dial 40,000 triangles; the boss with its bolts and collar):
//     the rim's 192 bolts, the farthest from the line, are square nuts of 14 triangles each;
//     the hour hand's collar, behind the minute hand's, is bare; the minute hand's collar, the one seen, carries
//     24 radial gussets 1.4 m long, 0.68 m wide at the foot and 0.34 m proud, with a bolt between each pair; the
//     boss's face has a bolt groove 0.45 m deep. The great dial weighs 29,062 triangles in 5 draws on the high
//     setting (28,414 on medium, 28,216 on low). The gussets and the second collar are the world's own.
//   - A THIRD POI (brief: two pois, the pendulum and the great hub): the centre of the dial of light on the
//     shed's floor, (236.43, 0, -6.12), where the sun's ray through the great dial's centre meets the floor
//     (worked from SUN and the dial's centre, not written), from 300 m to 436 m of route at a weight of 0.3 with
//     a fade of 0.45, so that the gaze dips to the floor's figure and the hub stands higher in the picture.
//     Counted every 0.25 m from 300 m to 440 m at 9.68 m/s: the gaze lifts at most 2.57 degrees a second (at
//     411.25 m) and falls at most 1.61 (at 344.5 m), its lowest pitch 5.68 degrees under the level (at 383.5 m);
//     the hub stands between 0.368 and 0.520 of the frame's height from its top (0.481 to 0.532 with two pois).
//   - Glazing bars are drawn flat on their panes at every distance (brief: modelled near the line); the nearest are
//     named above. Every glazing bar 0.12 m wide or less is filtered over three pixels' footprint to its true cover
//     at every distance (brief: one pixel wide at true cover), so that a roof's bars are a faint tint of the pane
//     and its ribs and purlins its lines.
//   - The sun's shadows of the plan: outside the great dial's circle the gable's fan work shades by its mean alone
//     (no bars are told in its shadow), and so do the gable's two glazed corners under the springing where they
//     lie inside the roof's round; outside that round they shade as the roof's glass does. A roof rib's two chords
//     shade as two bands a fixed 1.9 m apart along the shed, which is true under the crown only (lower on the
//     roof's round the two draw together). The roof's far passing share is its sets' own means multiplied,
//     0.7055, where counted along one rib bay with the bars where they stand the roof passes 0.7069: 0.2 per
//     cent under. The rounds in these shadows (the great bob, the lantern's floor, the great dial's rim and its
//     bore) are filtered as discs that keep each round's area under any footprint (the bob's shade summed over
//     its own area: 1.0000 under footprints 2 to 16 m wide, in the measure that makes the bob a ball) but not the
//     shape of its mean under a footprint wider than the round (at the bob's centre the shade is 0.9085 under
//     10 m and 0.6641 under 16 m, by the disc's form).
//   - Looks are read from ctx.vary.mood (and hour 'day' as sun): ctx.vary carries no weather hint.
//   - The shed's roof is a half round of radius 56 springing at y 40 (crown y 96 as the brief): the walls end at y 38
//     and a wall plate 2 m deep carries the ribs.
//   - Shafts of light are not drawn (brief: the haze shows the sun as soft shafts under the roofs): the haze is
//     the scene's fog (0.0047 of a pixel's light at 30 m, 0.237 at 226 m), and the shafts show only as the dust
//     they light. A speck of dust is a mote 0.0024 to 0.0048 m wide, as dealt, of one brightness (0.6 of the sun's
//     colour where the sun reaches it) at any distance. It is drawn its true width in pixels wide, or one pixel
//     wide where that is less, and then with its light times its true area over the pixel's. None is dealt within
//     6 m of the flown line and none comes nearer the eye than 4.54 m, where on a frame 720 pixels high the
//     coarsest is 0.659 of a pixel wide.
//   - Rain look: the wet reflection (roof ribs, the great dial and its red hands) lies on the shed's floor only; the
//     passage's tiles and the court's marble are not wet. The mirror reads the rain sky's mean tone, not its clouds.
//     A thread of water on a pane is 0.12 m wide, so that it reads from the line.
//   - A fill light (FILL_GLSL) is given by place and by a surface's turn from the sun, in the court, the shed and the
//     passage, in the sun and cloud looks (none under the rain): half the sky light again, and a bounce worked
//     from each floor's palest stone (of the sun's colour 0.10 near the court's floor, 0.115 in the shed, 0.05 in
//     the passage; by the floors' own means as laid it would be 0.083, 0.105 and 0.031 or 0.036, and the coded
//     shares are kept over these by rule); in the passage the sky light itself stands half as high again
//     (skyLift). It is no light of the brief's, which names the sun and the sky alone.
//   - THE COURT'S FLOOR carries a figure of its own beside the brief's dial (brief: white marble, a dark minute
//     track, twelve dark wedge strokes and two brass hands): a chequer course of dark blocks 3 degrees wide between
//     the minute track and the face's edge (radius 48.19 to 50 m: 279.17 m2, 0.0355 of the face disc) and a dark
//     ring from radius 28 to 29.6 m (289.53 m2, 0.0369; the minute hand lies over 1.38 m2 of it), both in the
//     strokes' tone: the face's dark cover is 0.1724 where the dial's own is 0.1002, and the face disc's mean
//     albedo 0.568 where the dial's alone is 0.614. Round the dial, from radius 50.6 to 56.94 m, a border of slabs
//     7.5 degrees wide, SLATE (the passage's slate blue; 24 slabs on the gallery columns' lines, 1,071 m2) and grey
//     marble by turns: the brief gives the court no slate.
//   - THE SHED'S FLOOR has a course of darker stone (brief: pale limestone in large flags with thin brass strips):
//     1.33 m wide under every rib line (every 16 m) and along z -16 and z 16, the brass strips of those lines down
//     its middle, in a mid tone (luminance 0.220; the flag's 0.470). It covers 0.105 of the floor (crosswise
//     0.0831, lengthwise 0.0238) and by the course alone the floor's mean albedo is 0.944 of the flags' (0.940
//     with the joints and strips). Under a pixel wider than the course the course's and the strips' means are
//     multiplied though the rib lines' strips lie within the course: counted over a 16 m square of the floor
//     clear of the two lengthwise courses, with each set of lines at its mean (a pixel 16 m wide or wider), the
//     course holds 0.0821 of the floor where its own share is 0.0764, and the floor's tone stands 0.32 per cent
//     under its own mean by the three shares of flag, course and brass (0.40 with the joints' darkening counted
//     in).
//   - THE PASSAGE'S TILES (brief: cream, black and a slate blue in a large repeating figure with brass strips;
//     brass only as small glints, never a wash): the brass strips are 0.30 m wide, 0.144 of the floor; the slate
//     blue, which the brief's palette does not hold, is the world's own tone laid at 1.5 times its hex, a mid tone
//     that stays a clear blue in the shade. The figure repeats every 8 m, its cells light and dark by turns; of the
//     two figures dealt, the diamond stands in every cell and the disc in the dark cells alone: cream 0.475 or
//     0.615 of the floor, slate 0.260 or 0.167, black 0.120 or 0.074. Under a pixel wider than the figure the
//     four tones' weights stand at 0.9933 to 1.0076 of their own, because the joints' mean (0.986098 of the
//     tone) is multiplied into the figure's.
//   - THE PIERS' ROUNDELS (the brief has no dial on a pier): twelve dials of the kit, at ten past ten, on square
//     tablets of the modelled pier faces: two on each jamb of the east arch (1.54 m across) and two on the inner
//     face of each of the piers at 46, 82, 134 and 310 degrees (1.74 m across); six near dials and six far ones,
//     1,092 triangles. The plate behind a pier's lattice is the pier's own paint at 0.7 of its tone.
//   - THE BLIND ARCHES' RECESSES are dressed under their tower dials (the brief names the dials alone): an iron
//     plinth to 2.6 m, an iron string course from 19.3 to 20.8 m and between them two fielded panels 8.4 m wide and
//     14 m high, all behind the round wall's line.
//   - THE GABLE'S FAN WORK has a second order and a band (brief: round the dial the gable is iron fan work and
//     glass): 96 radial bars and a ring at every 2 m of radius, 0.07 m wide, and a lattice band from the dial's rim
//     to the first ring (radius 38 to 42 m; its two sets of diagonals cover 0.223 of it), all drawn on the panes.
//     With them the gable's mean share of light is 0.777 (0.855 by the first order alone): the sunlit floor outside
//     the dial of light takes 9.1 per cent less sun.
//   - THE ENAMEL'S HIGHLIGHT UNDER A WIDE PIXEL IS A FIT OFF THE DIAL'S AXIS (brief: every small dial is enamel with
//     a slight dome and a soft highlight; every drawn pattern goes to its true mean under a wide pixel): under a
//     pixel wider than 0.35 of a dial radius the highlight is the dome's own mean over the face, exactly so with
//     the half vector on the dial's axis (0.662366 of the highlight's peak for the sun's, 0.880900 for the sky's);
//     off the axis its fall with the angle is a fit, the 31.1st and the 12.3rd power of the angle's cosine, whose
//     greatest misfit, counted at every half degree from 0 to 40 degrees, is 0.0041 of the peak for the sun's
//     highlight (at 9.5 degrees) and 0.0020 for the sky's (at 36 degrees).
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { FACE_GLSL, DIAL_LIGHT_GLSL, GREAT, GLASS_PASS, IRON_PAINT, makeDialKit, buildHero, handAngles } from '../parts/ten-past-ten.js';

// ---------------------------------------------------------------------------------------------------------------
// THE PLAN (metres)
// ---------------------------------------------------------------------------------------------------------------
const ROUTE = [[-16, 12, 116], [-16.03, 12, 103.95], [-16.73, 12.03, 91.93], [-18.88, 12.36, 80.08], [-22.46, 13.01, 68.58], [-26.81, 13.84, 57.28],
  [-31.17, 14.76, 46.04], [-35.54, 15.64, 34.81], [-39.89, 16.39, 23.57], [-43.55, 17.12, 12.1], [-45.11, 17.84, 0.13], [-43.55, 18.69, -11.78],
  [-38.9, 19.75, -22.86], [-31.48, 20.92, -32.31], [-21.8, 22.14, -39.5], [-10.6, 23.34, -43.85], [1.35, 24.45, -45.09], [13.22, 25.42, -43.2],
  [24.58, 26.49, -39.08], [35.61, 27.58, -34.21], [46.61, 28.55, -29.31], [57.66, 29.62, -24.39], [68.67, 30.71, -19.49], [79.67, 31.75, -14.59],
  [90.68, 32.62, -9.69], [101.73, 33.24, -4.77], [112.74, 33.5, 0.13], [123.77, 33.77, 4.96], [135.07, 34.39, 9.14], [146.83, 35.29, 11.98],
  [158.81, 36.4, 13.25], [170.85, 37.65, 12.95], [182.75, 38.97, 11.11], [194.43, 40.27, 8.13], [206.07, 41.48, 4.84], [217.8, 42.53, 2.08],
  [229.74, 43.35, 0.49], [241.77, 43.86, 0.02], [253.87, 44, 0], [265.91, 44, 0], [278, 44, 0]];
const SUN = [0.7002, 0.7071, 0.0984];                      // the direction to the sun: 45 degrees up, 8 degrees south of east
const PAL = ['#F3F0E6', '#15191C', '#2F6B62', '#C8A545', '#8FC3EA', '#D8432B', '#D9D2C0', '#1E2F5C'];
// the passage: a segmental vault through (x -40, y 30), (x -18, y 44), (x 4, y 30): radius (22^2 + 14^2) / 28 = 24.2857,
// its axis at x -18, y 44 - 24.2857 = 19.7143
const PAS = { x0: -40, x1: 4, zS: 124, zN: 60, wallY: 30, cx: -18, cy: 19.7143, r: 24.2857, bay: 8 };
// the court: the dome is a sphere through (r 64, y 58) and (r 6, y 96): centre y 23.5789, radius 72.668
const CRT = { R: 64, galIn: 57, decks: [14, 28, 42], solidY: 51, drumY: 58, domeCy: 23.5789, domeR: 72.668, lanternR: 6, lanternY: 96, archHalf: 34, archSpring: 32 };
// the shed: a half round roof of radius 56 about the line y 40, z 0 (springing y 40, crown y 96), ribs every 16 m from x 58
const SHD = { x0: 58, x1: 282, z: 56, r: 56, cy: 40, bay: 16, gableX: 280 };
const PEN = { pivotY: 98, len: 86, bobR: 5, bobT: 1, amp: 10.5 * Math.PI / 180, period: 12 };
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const gf = (x) => { const s = Number(x).toFixed(5); return s.indexOf('.') < 0 ? s + '.0' : s; };   // a number as a GLSL float
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the brief's speed by metres of route
const speedAt = (s) => 11.5 - 1.5 * sm(50, 120, s) + 0.5 * sm(225, 262, s) - 1.5 * sm(318, 372, s) - 1.5 * sm(392, 430, s) + 2.5 * sm(452, 478, s);

// THE PASSAGE IS DRAWN AS FOUR ROOMS: west and east of its axis (x -18), south and north of z 90, for its shell and
// for its middle dials (the shop fronts' and the wall clocks'). Nothing looks different: the renderer leaves a mesh
// out when its bounding sphere stands outside the view, and where the line swings round the court (162 to 190 m
// of route) the one sphere of the whole passage (radius 49 m) reached into the view's edge though no part of
// the passage did; the two west rooms' spheres (32 m and 31 m) do not, and their 15,212 triangles of shell (7,148
// north of z 90 and 8,064 south of it) and 132 dials are left out there.
const pasRoom = (x, z) => (x > -18 ? 2 : 0) + (z > 90 ? 1 : 0);

// ---------------------------------------------------------------------------------------------------------------
// GEOMETRY WRITER. Positions, flat (or turned) normals, a colour with a gloss (rgb + 0..1), and for panes seven more
// floats (uv in metres, four pattern numbers, the pattern's kind). The shaders turn every normal toward the eye, so
// winding is free. A matrix, when set, places what is written.
// ---------------------------------------------------------------------------------------------------------------
function mkW(pane = false) {
  const P = [], N = [], C = [], X = [];
  const w = { P, N, C, X, M: null, aux: [0, 0, 0, 0, 0, 0, 0] };
  const e = new THREE.Vector3();
  const tp = (p) => { if (!w.M) return p; e.set(p[0], p[1], p[2]).applyMatrix4(w.M); return [e.x, e.y, e.z]; };
  const put = (p, n, c) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c[0], c[1], c[2], c[3] ?? 0); };
  w.tri = (a0, b0, c0, col) => {
    const a = tp(a0), b = tp(b0), c = tp(c0);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
    put(a, n, col); put(b, n, col); put(c, n, col);
  };
  w.quad = (a, b, c, d, col) => { w.tri(a, b, c, col); w.tri(a, c, d, col); };
  // a flat quad with a colour to each corner (a soft change of tone across it)
  w.quadC = (a0, b0, c0, d0, ca, cb, cc, cd) => {
    const a = tp(a0), b = tp(b0), c = tp(c0), d = tp(d0);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l];
    put(a, n, ca); put(b, n, cb); put(c, n, cc); put(a, n, ca); put(c, n, cc); put(d, n, cd);
  };
  // a pane quad: corners with their uv (metres); par = [Tu, hu, Tv, hv], kind as in PANE_FRAG
  w.pane = (a, b, c, d, uva, uvb, uvc, uvd, par, kind, col) => {
    w.quad(a, b, c, d, col);
    for (const uv of [uva, uvb, uvc, uva, uvc, uvd]) X.push(uv[0], uv[1], par[0], par[1], par[2], par[3], kind);
  };
  // an axis-aligned box; skip: a string of faces to leave out ('x-', 'y+' ...)
  w.box = (x0, y0, z0, x1, y1, z1, col, skip = '') => {
    const c = typeof col === 'function' ? col : () => col;
    if (!skip.includes('x-')) w.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c('x-'));
    if (!skip.includes('x+')) w.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], c('x+'));
    if (!skip.includes('y-')) w.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c('y-'));
    if (!skip.includes('y+')) w.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], c('y+'));
    if (!skip.includes('z-')) w.quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], c('z-'));
    if (!skip.includes('z+')) w.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c('z+'));
  };
  // a turned form about the y axis through (cx, cz): profile [[r, y], ...]; smooth: normals turned about the axis
  w.lathe = (profile, seg, col, cx = 0, cz = 0, a0 = 0, a1 = TAU) => {
    for (let j = 0; j < profile.length - 1; j++) {
      const [r0, y0] = profile[j], [r1, y1] = profile[j + 1], dr = r1 - r0, dy = y1 - y0, l = Math.hypot(dr, dy) || 1, nr = dy / l, ny = -dr / l;
      const cj = typeof col === 'function' ? col(j) : col;
      for (let i = 0; i < seg; i++) {
        const t0 = a0 + (a1 - a0) * i / seg, t1 = a0 + (a1 - a0) * (i + 1) / seg, c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const p00 = tp([cx + r0 * c0, y0, cz + r0 * s0]), p01 = tp([cx + r0 * c1, y0, cz + r0 * s1]), p10 = tp([cx + r1 * c0, y1, cz + r1 * s0]), p11 = tp([cx + r1 * c1, y1, cz + r1 * s1]);
        let n0 = [nr * c0, ny, nr * s0], n1 = [nr * c1, ny, nr * s1];
        if (w.M) { e.set(...n0).transformDirection(w.M); n0 = [e.x, e.y, e.z]; e.set(...n1).transformDirection(w.M); n1 = [e.x, e.y, e.z]; }
        if (r0 > 1e-6) { put(p00, n0, cj); put(p10, n0, cj); put(p01, n1, cj); }
        if (r1 > 1e-6) { put(p01, n1, cj); put(p10, n0, cj); put(p11, n1, cj); }
      }
    }
  };
  // a bar of rectangular section along a list of points; up(i) gives the section's "depth" direction at point i
  w.bar = (pts, ups, depth, width, col, caps = false) => {
    const sec = (i) => {
      const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      const t = new THREE.Vector3(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize(), u = new THREE.Vector3(...ups[i]).normalize();
      const s = new THREE.Vector3().crossVectors(t, u).normalize();
      const at = (a, b) => [p[0] + u.x * a * depth / 2 + s.x * b * width / 2, p[1] + u.y * a * depth / 2 + s.y * b * width / 2, p[2] + u.z * a * depth / 2 + s.z * b * width / 2];
      return [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)];
    };
    let a = sec(0);
    if (caps) w.quad(a[0], a[1], a[2], a[3], col);
    for (let i = 1; i < pts.length; i++) { const b = sec(i); for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; w.quad(a[k], a[k1], b[k1], b[k], col); } a = b; }
    if (caps) w.quad(a[0], a[1], a[2], a[3], col);
  };
  Object.defineProperty(w, 'triangles', { get: () => P.length / 9 });
  // the geometry; given a yield function it hands the page back between the attributes
  w.geometry = (y) => (y ? (async () => { const g = new THREE.BufferGeometry(); for (const f of w.fill(g)) { f(); await y(); } return g; })() : (() => { const g = new THREE.BufferGeometry(); for (const f of w.fill(g)) f(); return g; })());
  w.fill = (g) => [
    () => g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)),
    () => g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)),
    () => g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 4)),
    () => { if (pane) g.setAttribute('aPane', new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(new Float32Array(X), 7), 2, 0)),
      g.setAttribute('aPar', new THREE.InterleavedBufferAttribute(g.attributes.aPane.data, 4, 2)),
      g.setAttribute('aPk', new THREE.InterleavedBufferAttribute(g.attributes.aPane.data, 1, 6)); },
  ];
  return w;
}

// ---------------------------------------------------------------------------------------------------------------
// GLSL: THE LIGHT OF THE PLAN.
// worldSun(place, normal, footprint) is the share of sunlight that reaches a place: closed forms of the plan, no
// shadow map. Each test carries the place's ray toward the sun to a member of the plan and takes the box integral
// of that member over the pixel's footprint widened by the sun's own width (uTptPen metres for each metre of ray):
// tptEdge (one edge), tptBox (one band), tptDisc (one round, its area kept) and tptLines (a set of evenly spaced
// bars: the exact periodic box mean, which tends to 2 h / T by itself under a wide pixel, so it needs no typed
// figure). Crossed sets combine as tptOr.
//
// THE SHED ROOF'S RIB as the sun sees it (one every 16 m): two chords, each 0.5 m wide along the shed and so a band
// of half width 0.40 with the ray's slant, 1.9 m apart, and between them the lattice web, 1.1 m of band, whose
// cover is that of two crossed sets of diagonals, each 0.14 m wide at 1.2 m spacing:
//   one set 0.14 / 1.2 = 0.116667; crossed 1 - (1 - 0.116667)^2 = 0.219722.
// TYPED MEAN, the shed roof's passing share (the far value of shedRoof below: what its sets of bars tend to under a
// wide pixel, in the shed and, through the east arch, on the court's floor):
//   glass 0.92;  ribs 1 - (2 x 0.80 + 0.219722 x 1.10) / 16 = 1 - 0.115106 = 0.884894;
//   purlins (0.50 m every 7.330383 m of arc) 1 - 0.068209 = 0.931791;  glazing bars (0.07 m every metre of the
//   shed's length, running up the slope) 0.93;
//   0.92 x 0.884894 x 0.931791 x 0.93 = 0.705473.
// (Each set's own mean, multiplied. Counted along one rib bay with the glazing bars where they stand, three of the
// bay's sixteen under the rib's chords and web, the roof passes 0.706891: the far value stands 0.2 per cent under it.)
// ---------------------------------------------------------------------------------------------------------------
const WEB_COVER = 1 - (1 - 0.14 / 1.2) * (1 - 0.14 / 1.2);                                                  // 0.219722
const SHED_PURLIN_T = Math.PI * SHD.r / 24;                                                                 // 7.330383
const SHED_MEAN = GLASS_PASS * (1 - (2 * 0.80 + WEB_COVER * 1.10) / 16) * (1 - 0.50 / SHED_PURLIN_T) * (1 - 0.07 / 1.0);                            // 0.705473
const NOISE_GLSL = /* glsl */`
float wHash3(vec3 p){ return fract(sin(dot(p, vec3(99.7, 287.9, 73.1))) * 46210.1010); }
float wHash1(float x){ return fract(sin(x * 97.0113) * 45210.3581); }
// value noise: a blend, with weights that sum to one, of values spread evenly over 0..1, so its mean is one half by
// its form. Counted in single precision: the three-number hash's mean over every whole-number point to 40 either way
// is 0.4987, the one-number hash's over the whole numbers -700 to 699 is 0.4989, and the noise's over 8,000,000 places
// at random (x, y in -30..30, z in 0..20) is 0.4983.
float wNoise3(vec3 p){
  vec3 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(wHash3(i), wHash3(i + vec3(1.0, 0.0, 0.0)), u.x), mix(wHash3(i + vec3(0.0, 1.0, 0.0)), wHash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
             mix(mix(wHash3(i + vec3(0.0, 0.0, 1.0)), wHash3(i + vec3(1.0, 0.0, 1.0)), u.x), mix(wHash3(i + vec3(0.0, 1.0, 1.0)), wHash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}`;
// the cloud look's travelling bands, written once for GLSL and once for update() (the great dial's own sun term)
const bandShapeJS = (x, z, t) => { const ph = (x * 0.9 + z * 0.44) * 0.024 - t * 0.72, b = 0.5 + 0.5 * Math.sin(ph + 0.8 * Math.sin(ph * 0.37 + 1.7)); return sm(0.22, 0.62, b); };
const SHADOW_GLSL = DIAL_LIGHT_GLSL + /* glsl */`
uniform vec3 uBob; uniform vec2 uLook;       // uLook: (wind and cloud, rain), each 0 or 1
#ifndef TPT_UTIME
#define TPT_UTIME
uniform float uTime;
#endif

float tptOr(float a, float b){ return 1.0 - (1.0 - a) * (1.0 - b); }
float sunBandShape(vec3 p){
  float ph = (p.x * 0.9 + p.z * 0.44) * 0.024 - uTime * 0.72;
  return smoothstep(0.22, 0.62, 0.5 + 0.5 * sin(ph + 0.8 * sin(ph * 0.37 + 1.7)));
}
// the sky light: it rises as the sun fades (cloud look); under rain the water on the glass lays a soft moving shade,
// 13 per cent either way: a product of two sines, whose mean is 0, so the factor's mean is 1. In the passage (south
// of z 74, west of x 7.5; rising from z 62) it stands half as high again in the sun and cloud looks (1.50 x 0.253 =
// 0.380 in luminance; not under rain): a lift by rule, not by reckoning, because the route begins there and the
// brief asks that its first metres be the least dark.
float skyLift(vec3 p){
  float pass = 1.0 + 0.50 * uSun * smoothstep(62.0, 74.0, p.z) * step(p.x, 7.5);
  return (1.0 + 0.34 * uLook.x * (1.0 - sunBandShape(p))) * pass * (1.0 + 0.13 * uLook.y * sin(p.x * 0.8 + uTime * 1.9) * sin(p.z * 0.7 - p.y * 0.9 - uTime * 2.3));
}
// THE PASSAGE: the east wall (x 4, solid to y 30), then the vault: a cylinder of radius ${gf(PAS.r)} about (x -18, y ${gf(PAS.cy)}),
// ribs 0.8 m wide every 8 m from z 60, purlins 0.28 m wide every 4 m of arc from the crown, glazing bars 0.06 m every metre.
// Ribs and glazing bars run the same way and never overlap, so their covers are added; the purlins cross both.
float sunPassage(vec3 p, vec3 S, float fp){
  float t = (4.0 - p.x) / S.x;
  float lit = 1.0 - tptEdge(p.y + t * S.y - 30.0, fp + uTptPen * max(t, 0.0));
  vec2 o = vec2(p.x + 18.0, p.y - ${gf(PAS.cy)}), d = vec2(S.x, S.y);
  float a = dot(d, d), b = dot(o, d), c = dot(o, o) - ${gf(PAS.r * PAS.r)};
  float tv = (-b + sqrt(max(b * b - a * c, 0.0))) / a;
  vec3 H = p + S * tv; float w = fp + uTptPen * max(tv, 0.0);
  float arc = atan(H.x + 18.0, max(H.y - ${gf(PAS.cy)}, 1e-3)) * ${gf(PAS.r)};
  float ribs = tptLines(H.z + 340.0, 8.0, 0.40, w);                        // 340 = 400 - 60: ribs on z = 60 + 8 k
  float purl = tptLines(arc + 400.0, 4.0, 0.14, w);
  float bars = tptLines(H.z + 400.5, 1.0, 0.03, w);
  return lit * ${gf(GLASS_PASS)} * (1.0 - ribs - bars) * (1.0 - purl);
}
// where a gallery deck is: they stop at the piers of the four arches. In degrees round the court from east toward
// south: the east arch's piers at 50 either side of 0, the passage mouth's at 82 and 138, the west blind arch's at
// 180 -+ 11.5, the north blind arch's at 255.53 -+ 11.5 (GALLERY_ZONES in the plan)
float deckAt(vec2 q){
  float a = degrees(atan(q.y, q.x + step(abs(q.x) + abs(q.y), 1e-6) * 1e-4)); a += a < 0.0 ? 360.0 : 0.0;
  float on = step(50.0, a) * step(a, 82.0) + step(138.0, a) * step(a, 168.5) + step(191.5, a) * step(a, 244.03) + step(267.03, a) * step(a, 310.0);
  return min(on, 1.0);
}
float deckShade(vec3 p, vec3 S, float fp, float y){
  float t = (y - p.y) / S.y; if (t <= 0.0) return 0.0;
  vec2 q = p.xz + S.xz * t;
  return tptBox(length(q) - 60.5, 3.5, fp + uTptPen * t) * deckAt(q);
}
// THE COURT: the wall (radius 64, solid to y 51 but for the east arch), the glazed drum (y 51..58, a mullion 0.44 m wide
// every 1/96 of the round), the dome (a sphere of radius ${gf(CRT.domeR)} about y ${gf(CRT.domeCy)}: 24 ribs 0.7 m wide, rings 0.3 m wide
// every 6 m of meridian, the lantern's floor of radius 6 solid), the three gallery decks (radius 57..64), and the
// great bob, an ellipsoid of half axes 5, 5, 1, read in the measure that makes it a ball. The lantern's floor and the
// bob are rounds filtered by tptDisc, which keeps their area under any footprint.
float shedRoof(vec3 p, vec3 D, float fp, float pen);
float sunCourt(vec3 p, vec3 S, float fp){
  vec2 o = p.xz, d = S.xz; float a = dot(d, d), b = dot(o, d), c = dot(o, o) - 4096.0;
  float t = (-b + sqrt(max(b * b - a * c, 0.0))) / a;
  vec3 Q = p + S * t; float w = fp + uTptPen * max(t, 0.0);
  vec3 o3 = vec3(p.x, p.y - ${gf(CRT.domeCy)}, p.z); float b3 = dot(o3, S), c3 = dot(o3, o3) - ${gf(CRT.domeR * CRT.domeR)};
  float ts = -b3 + sqrt(max(b3 * b3 - c3, 0.0)); vec3 H = p + S * ts; float rh = max(length(H.xz), 1e-3), ws = fp + uTptPen * max(ts, 0.0);
  float ribs = tptLines((atan(H.z, H.x + step(abs(H.x) + abs(H.z), 1e-6) * 1e-4) + 3.14159265) * rh, rh * 0.2617994, 0.35, ws);
  float mer = ${gf(CRT.domeR)} * acos(clamp((H.y - ${gf(CRT.domeCy)}) / ${gf(CRT.domeR)}, -1.0, 1.0));
  float rings = tptLines(mer, 6.0, 0.15, ws);
  float dome = ${gf(GLASS_PASS)} * (1.0 - ribs) * (1.0 - rings) * (1.0 - tptDisc(rh, 6.0, ws));
  float drum = ${gf(GLASS_PASS)} * (1.0 - tptLines((atan(Q.z, Q.x) + 3.14159265) * 64.0, 4.1887902, 0.22, w));
  float dA = Q.y < 32.0 ? abs(Q.z) - 34.0 : length(vec2(Q.z, Q.y - 32.0)) - 34.0;
  // through the east arch, then out by the shed's roof: its own ribs, purlins and glazing bars as the place's ray
  // meets them (it leaves above the springing, between the arch and the gable); under a wide pixel those sets of
  // bars tend by themselves to the typed mean above, ${gf(SHED_MEAN)}
  float low = tptEdge(dA, w) * step(0.0, Q.x) * shedRoof(p, S, fp, uTptPen);
  float light = mix(low, mix(drum, dome, 1.0 - tptEdge(Q.y - 58.0, w)), 1.0 - tptEdge(Q.y - 51.0, w));
  light *= (1.0 - deckShade(p, S, fp, 14.0)) * (1.0 - deckShade(p, S, fp, 28.0)) * (1.0 - deckShade(p, S, fp, 42.0));
  vec3 ob = (uBob - p) * vec3(1.0, 1.0, 5.0), sb = S * vec3(1.0, 1.0, 5.0);
  float along = dot(ob, sb) / dot(sb, sb);
  float bob = step(0.0, along) * tptDisc(length(ob - sb * along), 5.0, 2.0 * (fp + uTptPen * max(along, 0.0)) + 1e-3);
  return light * (1.0 - bob);
}
// THE SHED: the ray is carried to the gable's plane (x 280). Inside the gable's outline (the half round of radius 56
// about y 40) it meets the great dial: the part's dial of light, which gives uTptGable outside the dial's circle;
// below y 6 the gable is a solid iron dado. Otherwise it leaves by the roof: ribs (see the head of this section),
// purlins, glazing bars up the slope; below the springing (y 40) the side wall stops it.
// the shed roof's passing share along any ray (D unit, pen metres of blur for each metre of ray)
float shedRoof(vec3 p, vec3 D, float fp, float pen){
  vec2 o = vec2(p.y - 40.0, p.z), d = vec2(D.y, D.z); float a = max(dot(d, d), 1e-5), b = dot(o, d), c = dot(o, o) - 3136.0;
  float tr = (-b + sqrt(max(b * b - a * c, 0.0))) / a; vec3 H = p + D * tr; float w = fp + pen * max(tr, 0.0);
  float X = H.x + 1542.0;                                                  // 1542 = 1600 - 58: ribs on x = 58 + 16 k
  float ribs = min(tptLines(X, 16.0, 0.40, w) + tptLines(X - 1.9, 16.0, 0.40, w) + ${gf(WEB_COVER)} * tptLines(X - 0.95, 16.0, 0.55, w), 1.0);
  float arc = atan(H.z, max(H.y - 40.0, 1e-3)) * 56.0 + ${gf(100 * SHED_PURLIN_T)};
  float purl = tptLines(arc, ${gf(SHED_PURLIN_T)}, 0.25, w);
  float bars = tptLines(H.x + 1601.0, 1.0, 0.035, w);
  return ${gf(GLASS_PASS)} * (1.0 - ribs) * (1.0 - purl) * (1.0 - bars) * (1.0 - tptEdge(H.y - 40.0, w));
}
float sunShed(vec3 p, vec3 S, float fp){
  float tg = (280.0 - p.x) / S.x; vec3 G = p + S * tg; float wg = fp + uTptPen * max(tg, 0.0);
  float inside = tptEdge(length(vec2(G.z, G.y - 40.0)) - 56.0, wg) * step(0.0, tg);
  float dado = tptEdge(G.y - 6.0, wg) * (1.0 - tptEdge(length(vec2(G.z, G.y - 44.0)) - 38.0, wg));
  float dial = tptDialLight(p, fp) * (1.0 - dado);
  return mix(shedRoof(p, S, fp, uTptPen), dial, inside);
}
float worldSun(vec3 wp, vec3 n, float fp){
  vec3 S = uTptSun; float f = max(fp, 1e-4), s;
  if (wp.x > 61.0) s = sunShed(wp, S, f);
  else if (wp.z > 61.5 && wp.x < 6.0) s = sunPassage(wp, S, f);
  else s = sunCourt(wp, S, f);
  return s * mix(1.0, 0.06 + 0.94 * sunBandShape(wp), uLook.x);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// GLSL: WHAT MOVES. Each declares  mat4 tptMove(mat4 mm): the placing matrix in, the matrix to draw with out.
//   MOVE_PEND   a pendulum or a balance: it turns about its own z axis at its origin. aSw = (phase, period s, amplitude rad)
//   MOVE_WATCH  a watch on its chain: a twist about the chain (an eighth of a turn either way: a quarter turn and
//               back) and a swing about the chain's top. aSw = (twist phase, twist period, swing phase, swing period),
//               aSw2 = (chain length to the top, swing amplitude rad, azimuth of the swing's axis)
// ---------------------------------------------------------------------------------------------------------------
const MOVE_NONE = 'mat4 tptMove(mat4 mm){ return mm; }';
const MOVE_PEND = /* glsl */`
attribute vec3 aSw;
#ifndef TPT_UTIME
#define TPT_UTIME
uniform float uTime;
#endif

mat4 tptMove(mat4 mm){
  float th = aSw.z * sin(6.2831853 * uTime / aSw.y + aSw.x), c = cos(th), s = sin(th);
  return mm * mat4(c, s, 0.0, 0.0, -s, c, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
}`;
const WATCH_SWING_GLSL = /* glsl */`
attribute vec4 aSw; attribute vec3 aSw2;
#ifndef TPT_UTIME
#define TPT_UTIME
uniform float uTime;
#endif

// the swing about the chain's top: a turn by th about the level axis a = (cos az, 0, sin az), written out as the
// matrix  c I + s [a]x + (1 - c) a a^T
mat3 tptSwingRot(){
  float th = aSw2.y * sin(6.2831853 * uTime / aSw.w + aSw.z), c = cos(th), s = sin(th), k = 1.0 - c;
  vec3 a = vec3(cos(aSw2.z), 0.0, sin(aSw2.z));
  return mat3(c + a.x * a.x * k, a.z * s, a.x * a.z * k,   -a.z * s, c, a.x * s,   a.x * a.z * k, -a.x * s, c + a.z * a.z * k);
}`;
const MOVE_WATCH = WATCH_SWING_GLSL + /* glsl */`
mat4 tptMove(mat4 mm){
  float tw = 0.7853982 * sin(6.2831853 * uTime / aSw.y + aSw.x), c = cos(tw), s = sin(tw);
  mat3 R = tptSwingRot() * mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
  mat3 m3 = R * mat3(mm);
  vec3 top = mm[3].xyz + vec3(0.0, aSw2.x, 0.0);
  // the bow stands 0.14 of the radius behind the dial's plane (watchGeometry): the dial and its case are set that
  // far before the chain's line, so the chain's foot ends in the bow (inside the ring of a near watch's bow; on
  // the top side of the flat bow of the middle and far weights, edge to edge) and the watch turns about its
  // chain
  return mat4(vec4(m3[0], 0.0), vec4(m3[1], 0.0), vec4(m3[2], 0.0), vec4(top + tptSwingRot() * vec3(0.0, -aSw2.x, 0.0) + m3[2] * 0.14, 1.0));
}`;

// ---------------------------------------------------------------------------------------------------------------
// GLSL: SOLIDS (iron, brass, wood, plaster). Vertex colour with a gloss in its fourth number. Paint: a breakup of
// period 1.6 m, 8 per cent either way about the plain colour; the noise's mean counts 0.497 to 0.499 by the region,
// so the factor's mean is 0.9996 to 0.9998: under a wide pixel the paint is its plain colour, at most 0.0004 over it.
// ---------------------------------------------------------------------------------------------------------------
const SOLID_VERT = (move) => /* glsl */`
attribute vec4 aCol;
varying vec4 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vO;
#include <common>
#include <fog_pars_vertex>
${move}
void main(){
  #ifdef USE_INSTANCING
    mat4 mm = modelMatrix * instanceMatrix;
  #else
    mat4 mm = modelMatrix;
  #endif
  mm = tptMove(mm);
  vCol = aCol;
  #ifdef USE_INSTANCING_COLOR
    vCol.rgb *= instanceColor;
  #endif
  vN = mat3(mm) * normal;
  vec4 wp = mm * vec4(position, 1.0);
  vW = wp.xyz; vO = position * length(mm[0].xyz) + mm[3].xyz * 0.37;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LIGHT_PARS = /* glsl */`
uniform vec3 uSkyCol; uniform vec3 uGroundCol; uniform vec3 uSunCol; uniform vec3 uSunDir; uniform float uSun;
`;
// THE FILL LIGHT. The court, the shed and the passage stand under glass on pale floors in full sun, so a surface there
// that the sun does not reach is still lit: by the open sky through the glass (cool: half the sky light again, in
// each of the three) and by the sunlit floor's bounce. It is given by place and by the surface's own turn alone: in
// the court's drum (radius 64.5, fading out by 66.5), in the shed (from x 54, where the drum's fill ends on the east
// arch's jambs, to x 280, fading out by 282; out to 56.5 m either side of its middle, fading out by 58, so that the
// side walls' own plane at 56 m stands inside it) and in the passage (south of z 61.5, west of x 7.5), to surfaces
// turned from the sun (in full where the sun's cosine is under 0.05, none above 0.55). With the sun's share it is
// scaled (none under the rain, whose sky light is already even).
// THE FLOOR'S BOUNCE, as a share of the sun's colour, is half the sunlit floor's own brightness (an upright face
// sees the floor in half its view) times the share of the floor that the sun reaches; the sun stands 45 degrees up
// (sine 0.7071), so a shadow reaches as far as its wall is high. It is worked as if each floor were all of its
// palest stone; after each working stands the floor's own figure, by its mean albedo as it is laid.
//   court: the dome's mean pass 0.816 x 0.7071 x the marble's albedo 0.689 = 0.397, its half 0.199; the wall
//          (solid to y 51, radius 64) shades all but the lens of two such discs 51.0 m apart, 0.506 of the floor:
//          0.101, coded 0.10 at the floor, falling by rule to four tenths of that from 40 m up; by the face's
//          mean albedo as laid (0.568) 0.083, and by the mean of the sunlit lens, border and all (0.546), 0.080
//   shed: the roof's mean pass 0.7055 x 0.7071 x the limestone's albedo 0.470 = 0.235, its half 0.117; the south
//          wall (38 m high) shades a strip 5.3 m wide of the 112 m: 0.112, coded 0.115; by the floor's mean
//          (0.442) 0.105
//   passage: the vault's mean pass 0.7187 x 0.7071 x the cream tile's albedo 0.580 = 0.295, its half 0.147; the
//          east wall (solid to y 30) shades 29.7 m of the 44 m width, leaving 0.325: 0.048, coded 0.05; by the
//          tiles' mean (0.371 or 0.436 by the figure dealt) 0.031 or 0.036
// The three coded shares stand over the floors' own figures and are kept there by rule, not by reckoning, as the
// passage's sky lift is (see skyLift): the shade under the glass is to stay light, the passage's most of all.
// So an upright face turned from the sun has, in luminance, 0.231 with no fill; 0.478 in the court 10 m up and 0.414
// from 40 m up; 0.520 in the shed; 0.544 in the passage (with its sky lift); the sun on a level face is 0.707.
// The bounce follows the sun that reaches the floor: in the cloud look it falls to 0.06 and rises again with the
// band's shade at the place and the clock (the band is level and 260 m from crest to crest, so the floor under a
// surface has the surface's own shade), as the sun's own term does; the sky's share stays.
const FILL_GLSL = /* glsl */`
#define TPT_FILL
// where a place stands: x in the court's drum, y in the shed (which takes over where the drum's share ends), z in
// the passage (no two at once)
vec3 fillZone(vec3 p){
  float inC = 1.0 - smoothstep(64.5, 66.5, length(p.xz));
  float inS = step(54.0, p.x) * (1.0 - smoothstep(56.5, 58.0, abs(p.z))) * (1.0 - smoothstep(280.0, 282.0, p.x));
  float inP = step(61.5, p.z) * step(p.x, 7.5);
  return vec3(inC, (1.0 - inC) * inS, (1.0 - inC) * inP);
}
// the sunlit floor's bounce on an upright face there, as a share of the sun's colour
float fillBounce(vec3 p, vec3 zone){
  float low = 1.0 - 0.6 * clamp(p.y / 40.0, 0.0, 1.0);
  return dot(zone, vec3(0.10 * low, 0.115, 0.05)) * mix(1.0, 0.06 + 0.94 * sunBandShape(p), uLook.x);
}
vec3 tptFill(vec3 p, vec3 N){
  vec3 zone = fillZone(p);
  float turn = 1.0 - smoothstep(0.05, 0.55, dot(N, uSunDir));
  return (turn * uSun) * (uSkyCol * dot(zone, vec3(0.5, 0.5, 0.5)) + uSunCol * fillBounce(p, zone));
}
// the same floor as a gloss mirrors it: the floor's own brightness, twice its half on an upright face
vec3 fillFloor(vec3 p){ return uSunCol * (2.0 * uSun * fillBounce(p, fillZone(p))); }
`;
const SOLID_FRAG = /* glsl */`
${LIGHT_PARS}
varying vec4 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vO;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${SHADOW_GLSL}
${FILL_GLSL}
void main(){
  vec3 N = vN / max(length(vN), 1e-6);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float fp = max(length(dFdx(vW)), length(dFdy(vW)));                  // the pixel's width on the surface, metres
  float toMean = 1.0 - smoothstep(0.4, 1.6, fp);
  vec3 alb = vCol.rgb * (1.0 + 0.16 * (wNoise3(vO / 1.6) - 0.5) * toMean);
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5) * skyLift(vW) + tptFill(vW, N);
  float sh = uSun * worldSun(vW, N, fp);
  vec3 col = alb * (hemi + uSunCol * (sh * max(dot(N, uSunDir), 0.0)));
  // gloss (brass in full, polished wood at 0.35, painted iron at 0.15): the surface mirrors the sky and, below, the ground
  // light with the sunlit floor of its place (fillFloor), and takes the sun's soft glint
  vec3 R = reflect(-V, N), Hs = uSunDir + V; Hs /= max(length(Hs), 1e-4);
  vec3 env = mix(uGroundCol + fillFloor(vW), uSkyCol, clamp(R.y * 0.7 + 0.5, 0.0, 1.0));
  float g = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  col = mix(col, alb * env * 1.5, 0.55 * vCol.a) + vCol.a * (alb * uSunCol * (sh * 1.1 * pow(max(dot(N, Hs), 0.0), 28.0)) + uSkyCol * (0.10 * g * g * g));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------------
// GLSL: PANES, flat members on which iron is drawn. aPane is the place in metres, aPar four numbers, aPk the kind:
//   0  glazing   bars of half width par.y every par.x along u, of half width par.w every par.z along v; glass between
//   1  lattice   two sets of diagonals of half width par.y every par.x (measured across the bars); open air between
//   2  balusters a baluster of half width par.y every par.x along u; the sheet is par.z + par.w high, with a rail
//                2 par.w high at its foot and another at its top; open air between
//   3  fan work  about the great dial's centre (uv from it): par.x radial bars of half width par.y, rings of half
//                width par.w every par.z of radius; between them the second order and the lattice band of FAN (the
//                east gable's fan work, where the plan and its count stand); glass between
// Every set is the exact box mean of its bars over the pixel (tptLines, tptBox), so the iron's cover is true at any
// distance and tends by itself to the pattern's mean; crossed sets combine as 1 - (1 - a)(1 - b). The pixel is then
// iron over that cover and glass (or air) over the rest; no bar is drawn thicker or darker than its cover (glazing
// bars 0.12 m wide or less, and the fan work's second order, take the box mean over three pixels instead of one: see
// where they are drawn). The two rails of kind 2 are filtered as one set of bars whose period is the sheet's height,
// so under any footprint they keep their own mean 4 par.w / (par.z + par.w), 0.202532 for the one sheet built.
// Rain (uLook.y), on glass only. Sheets: a noise of mean 0.5, period 4.5 m. Threads: one in each column of 0.8 m, a
// line of half width 0.06 m broken along its length by 0.5 + 0.5 sin, whose mean is 0.5:
//   TYPED MEAN of the threads (2 x 0.06 / 0.8) x 0.5 = 0.075.
// The water is laid on the pane in layers, each linear in its own pattern, so the pixel's mean is the layers' means:
// the sheen, then the sheet (a film that dims what lies behind it to a deep blue-grey: 0.55 of it at its thickest),
// then the thread over both (it catches the sky's light: 0.9 of it, brighter than the sky behind).
// ---------------------------------------------------------------------------------------------------------------
// the fan work's numbers (see THE EAST GABLE'S FAN WORK, by the shed): the first order's bars and rings, the second
// order's (bars2 in the round, a ring every ringT2, all of half width h2), and the lattice band about radius bandR
// (half height bandH: latN diamonds in the round and latRows half diamonds in the band's height, bars of half width latH)
const FAN = { bars: 24, barH: 0.15, ringT: 6, ringH: 0.15, bars2: 96, ringT2: 2, h2: 0.035, bandR: 40, bandH: 2, latN: 144, latRows: 5, latH: 0.07 };
FAN.latU = TAU * FAN.bandR / FAN.latN;                                   // a diamond's width on the band's mid line, metres
FAN.latK = FAN.latRows * FAN.latU / (4 * FAN.bandH);                     // the radius's measure in the lattice: latRows half diamonds in the band
FAN.latT = FAN.latU * Math.SQRT1_2;                                      // one set's period across its bars, in the lattice's measure
FAN.latHm = FAN.latH * Math.hypot(1, FAN.latK) * Math.SQRT1_2;           // a bar's half width in that measure
FAN.latCover = 1 - (1 - 2 * FAN.latHm / FAN.latT) ** 2;                  // the two sets' cover, crossed
const PANE_VERT = /* glsl */`
attribute vec4 aCol; attribute vec2 aPane; attribute vec4 aPar; attribute float aPk;
varying vec4 vCol; varying vec3 vN; varying vec3 vW; varying vec2 vUV; varying vec4 vPar; varying float vPk;
#include <common>
#include <fog_pars_vertex>
void main(){
  vCol = aCol; vUV = aPane; vPar = aPar; vPk = aPk;
  vN = mat3(modelMatrix) * normal;
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PANE_FRAG = /* glsl */`
${LIGHT_PARS}
uniform vec3 uGlassCol;        // the sheen of a pane: the sky it mirrors
varying vec4 vCol; varying vec3 vN; varying vec3 vW; varying vec2 vUV; varying vec4 vPar; varying float vPk;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${SHADOW_GLSL}
${FILL_GLSL}
void main(){
  vec3 N = vN / max(length(vN), 1e-6);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  // the east arch is cut out of the court's drum and dome where they cross it (the arch's own outline, exactly)
  if (vW.x > 30.0 && vW.x < 65.9 && abs(vW.z) < 34.0 && vW.y < 32.0 + sqrt(max(1156.0 - vW.z * vW.z, 0.0))) discard;
  float w = max(max(length(dFdx(vUV)), length(dFdy(vUV))), 1e-4);      // the pixel's width on the member, metres
  float fp = max(length(dFdx(vW)), length(dFdy(vW)));
  float cover, glass = 1.0;
  if (vPk < 0.5) {
    // glazing bars (0.12 m wide or less) are filtered over three pixels instead of one at every distance: the same
    // box mean over a wider footprint, so that a roof's bars go to the pane's faint tint a third as far off as
    // they would, and the ribs and purlins are its lines. Heavier members (the drum's mullions) keep the one-pixel footprint.
    float wb = w * (1.0 + 2.0 * step(vPar.y, 0.061));
    cover = tptOr(tptLines(vUV.x, vPar.x, vPar.y, wb), tptLines(vUV.y, vPar.z, vPar.w, wb));
  } else if (vPk < 1.5) {
    float off = 400.0 * vPar.x;
    cover = tptOr(tptLines((vUV.x + vUV.y) * 0.7071068 + off, vPar.x, vPar.y, w), tptLines((vUV.x - vUV.y) * 0.7071068 + off, vPar.x, vPar.y, w));
    glass = 0.0;
  } else if (vPk < 2.5) {
    cover = tptOr(tptLines(vUV.x, vPar.x, vPar.y, w), tptLines(vUV.y, vPar.z + vPar.w, 2.0 * vPar.w, w));
    glass = 0.0;
  } else {
    // radial members: the first order, and the second order's bars that no bar of the first hides (parallel sets
    // that never meet: their covers add). Rings the same. The second order is filtered over three pixels.
    float r = max(length(vUV), 1e-3), th = atan(vUV.x, vUV.y) + 3.14159265, arc = th * r, rr = r + 400.0 * vPar.z, w3 = 3.0 * w;
    float rad = min(tptLines(arc, r * 6.2831853 / vPar.x, vPar.y, w) + max(tptLines(arc, r * 6.2831853 / ${gf(FAN.bars2)}, ${gf(FAN.h2)}, w3) - tptLines(arc, r * 6.2831853 / vPar.x, ${gf(FAN.h2)}, w3), 0.0), 1.0);
    float rng = min(tptLines(rr, vPar.z, vPar.w, w) + max(tptLines(rr, ${gf(FAN.ringT2)}, ${gf(FAN.h2)}, w3) - tptLines(rr, vPar.z, ${gf(FAN.h2)}, w3), 0.0), 1.0);
    // the lattice band: two sets of diagonals in the band's own measure (the bearing times the mid radius, and the
    // height above the band's foot times latK); the pixel's width is carried into that measure across the bars
    float lu = th * ${gf(FAN.bandR)}, lv = (r - ${gf(FAN.bandR - FAN.bandH)}) * ${gf(FAN.latK)} + ${gf(400 * FAN.latU)};
    float wl = w * sqrt(${gf(FAN.bandR * FAN.bandR / 2)} / (r * r) + ${gf(FAN.latK * FAN.latK / 2)});
    float lat = tptOr(tptLines((lu + lv) * 0.7071068, ${gf(FAN.latT)}, ${gf(FAN.latHm)}, wl), tptLines((lv - lu) * 0.7071068, ${gf(FAN.latT)}, ${gf(FAN.latHm)}, wl));
    cover = tptOr(tptOr(rad, rng), tptBox(r - ${gf(FAN.bandR)}, ${gf(FAN.bandH)}, w) * lat);
  }
  float g = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  float aG = 0.02 + 0.22 * g * g * g;
  vec3 glassCol = uGlassCol;
  if (uLook.y > 0.5) {
    float sheet = mix(0.5, wNoise3(vec3(vUV.x * 0.22, vUV.y * 0.10 + uTime * 0.55, 3.7)), 1.0 - smoothstep(1.125, 4.5, w));
    float ci = floor(vUV.x / 0.8), h1 = wHash1(ci), h2 = wHash1(ci + 17.3), h3 = wHash1(ci + 51.9);
    float xl = vUV.x - (ci + 0.5) * 0.8 - (h1 - 0.5) * 0.4 - 0.04 * sin(vUV.y * 1.7 + h2 * 40.0);
    float dash = 0.5 + 0.5 * sin(vUV.y * (0.9 + 0.6 * h2) + uTime * (2.2 + 1.5 * h3) + h1 * 6.2831853);
    float thread = mix(0.075, tptBox(xl, 0.06, w) * dash, 1.0 - smoothstep(0.2, 0.8, w));     // typed mean 0.075 (above)
    // (the sheet's shape is sharpened about its mean: smoothstep(0.3, 0.7, n) is odd about 0.5, as the noise is, so its mean stays 0.5)
    float sh = smoothstep(0.30, 0.70, sheet), aS = 0.55 * sh, aT = 0.9 * thread;
    vec3 pre = glassCol * aG + uGlassCol * (0.5 * aS);                 // sheen and sheet, colour times cover
    aG += aS;
    pre = pre * (1.0 - aT) + uGlassCol * (1.75 * aT);                  // the thread over both
    aG += (1.0 - aG) * aT;
    glassCol = pre / max(aG, 1e-4);
  }
  aG = clamp(aG, 0.0, 1.0) * glass;
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5) * skyLift(vW) + tptFill(vW, N);
  vec3 iron = vCol.rgb * (hemi + uSunCol * (uSun * worldSun(vW, N, fp) * max(dot(N, uSunDir), 0.0)));
  float alpha = cover + (1.0 - cover) * aG;
  gl_FragColor = vec4((iron * cover + glassCol * ((1.0 - cover) * aG)) / max(alpha, 1e-4), alpha);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------------
// GLSL: THE THREE FLOORS (one shader, FLOORK 0 the passage's tiles, 1 the court's marble dial, 2 the shed's flags).
// ---------------------------------------------------------------------------------------------------------------
// THE PASSAGE'S TILES: a figure on a 4 m cell (c from the cell's centre, -2..2), two figures dealt by ctx.rng. The
// cells are dealt light and dark by turns like a chequer, so the figure repeats every 8 m: a DARK cell carries a
// slate panel 3.2 m square about its centre, a LIGHT cell is cream. In figure 0 each cell carries a diamond in the
// other cell's colour, bound by a black band; in figure 1 the dark cells alone carry a cream disc bound by a black
// ring and the light cells lie plain. Brass strips 0.30 m wide lie on every cell's four edges.
// TYPED MEANS (shares of the 64 m2 block of four cells; the colour under a wide pixel is the sum of colour x share):
//   brass strips, 0.30 m wide on the cell's four edges:     1 - (3.7 / 4)^2                          = 0.144375  (both figures)
//   figure 0  black band 1.2 <= |x| + |y| < 1.55, 4 cells:  4 x 2 x (1.55^2 - 1.2^2) / 64            = 0.120313
//             slate: two panels less diamond and band, and two diamonds |x| + |y| < 1.2:
//                    (2 x (3.2^2 - 2 x 1.55^2) + 2 x 2 x 1.2^2) / 64                                 = 0.259844
//             cream, the rest:                              1 - 0.144375 - 0.120313 - 0.259844       = 0.475468
//   figure 1  black ring 0.9 <= r < 1.25, 2 dark cells:     2 x pi (1.25^2 - 0.9^2) / 64             = 0.073877
//             slate: two panels less disc and ring:         2 x (3.2^2 - pi 1.25^2) / 64             = 0.166602
//             cream, the rest:                              1 - 0.144375 - 0.073877 - 0.166602       = 0.615146
// The joints between the 1 m tiles are sets of bars (exact box means), laid over the figure.
// HOW THE FIGURE IS FILTERED, so that every colour keeps its share under any pixel (fp, the pixel's width on the
// floor). The parts of a figure do not overlap, so their covers ADD and cream is what they leave.
//   strips                     crossed sets of bars: tptLines, the exact box mean for any fp
//   panels                     bars 3.2 m wide about the centres of the even cells one way times those of the odd
//                              cells the other way, and the same turned about: two products of exact box means
//   diamond (figure 0)         tptEdge of the mitred distance (|x| + |y| - 1.2) / sqrt 2. Its ramp of width w adds
//                              w^2 / 3 to the area 2.88 (the level line at distance d is 4 sqrt 2 x 1.2 + 8 d long and
//                              the ramp is odd about 0: 8 x 2 x (w^2/16 - w^2/24)), so the cover is scaled by
//                              2.88 / (2.88 + w^2 / 3). True while the ramp stays in the cell: w <= 1.13; w = min(fp, 1.1).
//   its band                   tptBox about the middle line |x| + |y| = 1.375, half width 0.175 / sqrt 2: a box is even
//                              about that line and the level lines grow evenly, so it keeps its area while it stays in
//                              the cell: 0.1237 + w / 2 <= 0.4419; w = min(fp, 0.6).
//   disc (figure 1)            tptDisc (the part file): its area for any w; w = min(fp, 1.5), inside the cell
//   its ring                   tptBox about r = 1.075, half width 0.175, true while it stays in the cell and clear of
//                              the centre: 1.25 + w / 2 <= 2; w = min(fp, 1.5)
// The middle figure and its band lie wholly inside a dark cell's panel and are filtered inside their own cell, so
// the panel's cover less theirs is the slate left of it, and the cell's turn (light or dark) is taken at the pixel's
// centre (in figure 1 that turn also keeps the disc and its ring out of the light cells). Beyond those widths the figure, still summing true, goes over to its typed mean: from fp 0.6 m to 3 m
// (figure 0), from 1 m to 3 m (figure 1).
const TILE_SHARES = [
  { brass: 0.144375, slate: 0.259844, black: 0.120313, cream: 0.475468 },
  { brass: 0.144375, slate: 0.166602, black: 0.073877, cream: 0.615146 },
];
const FLOOR_VERT = /* glsl */`
varying vec3 vW;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLOOR_FRAG = (K, fig) => /* glsl */`
${LIGHT_PARS}
uniform vec3 uTile[4];          // cream, black, slate blue, brass
uniform vec3 uStone;            // the shed's limestone
uniform vec3 uOpalRef;          // the opal ring as the wet floor mirrors it
uniform vec3 uRedRef;           // the great hands' vermilion
uniform vec4 uPosts[16];        // the post clocks: foot x, foot z, the head's centre height, the head's half width
varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
${NOISE_GLSL}
${FACE_GLSL}
${SHADOW_GLSL}
void main(){
  vec3 V = cameraPosition - vW; float dist = max(length(V), 1e-3); V /= dist;
  vec3 N = vec3(0.0, 1.0, 0.0);
  float fp = max(max(length(dFdx(vW.xz)), length(dFdy(vW.xz))), 1e-4);     // the pixel's width on the floor, metres
  vec3 alb; float gloss = 0.0;
#if ${K} == 0
  vec2 c = mod(vW.xz, 4.0) - 2.0, ac = abs(c);
  // a dark cell's panel (cells counted from x, z = -400: dark where one count is even and the other odd), and that
  // turn at the pixel's own centre for the middle figure
  float panel = tptLines(vW.x + 398.0, 8.0, 1.6, fp) * tptLines(vW.z + 394.0, 8.0, 1.6, fp) + tptLines(vW.x + 394.0, 8.0, 1.6, fp) * tptLines(vW.z + 398.0, 8.0, 1.6, fp);
  float turn = mod(floor(vW.x * 0.25) + floor(vW.z * 0.25), 2.0);
  float mid, black;
  #if ${fig} == 0
    float wd = min(fp, 1.1), wb = min(fp, 0.6);
    mid = tptEdge((ac.x + ac.y - 1.2) * 0.7071068, wd) * (2.88 / (2.88 + wd * wd / 3.0));
    black = tptBox((ac.x + ac.y - 1.375) * 0.7071068, 0.1237437, wb);
    vec3 mean = uTile[0] * 0.475468 + uTile[2] * 0.259844 + uTile[1] * 0.120313 + uTile[3] * 0.144375;      // typed means above
    float toMean = 1.0 - smoothstep(0.6, 3.0, fp);
  #else
    float r = length(c), wd = min(fp, 1.5);
    mid = tptDisc(r, 0.9, wd);
    black = tptBox(r - 1.075, 0.175, wd);
    mid *= turn; black *= turn;          // the roundel and its ring lie in the dark cells alone
    vec3 mean = uTile[0] * 0.615146 + uTile[2] * 0.166602 + uTile[1] * 0.073877 + uTile[3] * 0.144375;      // typed means above
    float toMean = 1.0 - smoothstep(1.0, 3.0, fp);
  #endif
  // slate: the panel less the middle figure and its band in a dark cell; in a light one the middle figure alone
  // (figure 0: figure 1 has none there)
  float slate = max(panel + mid * (1.0 - 2.0 * turn) - black * turn, 0.0);
  float strip = tptOr(tptLines(vW.x + 400.0, 4.0, 0.15, fp), tptLines(vW.z + 400.0, 4.0, 0.15, fp));
  vec3 pat = uTile[0] * max(1.0 - slate - black - strip, 0.0) + uTile[1] * black + uTile[2] * slate + uTile[3] * strip;
  alb = mix(mean, pat, toMean);
  float joint = tptOr(tptLines(vW.x + 400.5, 1.0, 0.007, fp), tptLines(vW.z + 400.5, 1.0, 0.007, fp));
  alb *= 1.0 - 0.5 * joint;
  // the gloss follows the strips' own filtered cover, so under any footprint its mean over a cell is its own (0.572187)
  gloss = 0.5 + 0.5 * strip;
#elif ${K} == 1
  // the inlaid dial: the part's face law, kind 3, the face disc 50 m in radius (the law's face radius is 0.88), twelve to the north
  float k = 50.0 / 0.88; vec2 q = vec2(vW.x, -vW.z) / k; float r = length(vW.xz);
  vec3 cov = tptFaceCov(q, fp / k, 1.0);
  float ang = atan(vW.z, vW.x + step(r, 1e-6) * 1e-4) + 3.14159265, rs = max(r, 1e-3);
  // THE DIAL'S OWN FIGURE in the strokes' colour, laid between the dial's parts so that every cover adds:
  //   a chequer course between the minute track and the face's edge, radius 48.19..50: dark blocks 3 degrees wide
  //   on the sixty minute lines, as much marble between them: half of pi (50^2 - 48.19^2) = 279.17 m2, 0.035545 of
  //   the face disc (7853.98 m2)
  //   a dark ring, radius 28..29.6, between the hour hand's point (23.9) and the quarter strokes (from 30.7):
  //   pi (29.6^2 - 28^2) = 289.53 m2, 0.036864 of the face disc; the minute hand lies over it
  // Both are box means for any pixel (a band across the radius, a set of bars round it), so they need no typed figure.
  float chq = tptBox(r - 49.095, 0.905, fp) * tptLines(ang * r, rs * 0.10471976, r * 0.02617994, fp);
  float ring = tptBox(r - 28.8, 0.8, fp) * (1.0 - tptHandMinute(q, fp / k));
  // round it: a brass ring 50..50.6, then to the brass strip at 57 a border of slabs 7.5 degrees wide, slate (the
  // passage's own, uTile[2]) on the gallery columns' lines and grey marble between them, a joint at every slab's edge
  float brass = min(tptBox(r - 50.3, 0.3, fp) + tptBox(r - 57.0, 0.06, fp), 1.0);
  float slab = tptBox(r - 53.77, 3.17, fp) * tptLines(ang * r, rs * 0.2617994, r * 0.0654498, fp);
  float jn = tptLines(ang * r + r * 0.0654498, rs * 0.1308997, 0.02, fp);
  vec3 border = mix(mix(uTptFaceCol[3] * vec3(0.80, 0.84, 0.90), uTile[2], slab) * (1.0 - 0.5 * jn), uTptHandCol[3], brass);
  float inside = tptEdge(r - 50.0, fp);
  alb = mix(border, uTptFaceCol[3], inside) + (uTptStrokeCol[3] - uTptFaceCol[3]) * ((cov.x + cov.y) * inside + chq + ring)
    + (uTptHandCol[3] - uTptFaceCol[3]) * (cov.z * inside);
  // veining: period 3 m, 7 per cent either way, mean 1
  alb *= 1.0 + 0.14 * (wNoise3(vec3(vW.xz / 3.0, 2.3)) - 0.5) * (1.0 - smoothstep(0.75, 3.0, fp));
  gloss = 0.45 + 0.5 * mix(brass, cov.z, inside);
#else
  // limestone flags 4 m by 2.667 m in running bond; a flag's tone is 5 per cent either way about 1 (a hash spread
  // evenly over 0..1, mean 0.5); joints 0.024 m; brass strips 0.10 m wide on the pier lines and every 16 m across
  float row = floor(vW.z / 2.6667), fx = vW.x + 2.0 * mod(row, 2.0), id = floor(fx / 4.0);
  float tone = 1.0 + 0.10 * (wHash3(vec3(id, row, 1.0)) - 0.5) * (1.0 - smoothstep(1.0, 4.0, fp));
  float joint = tptOr(tptLines(fx + 400.0, 4.0, 0.012, fp), tptLines(vW.z + 266.67, 2.6667, 0.012, fp));
  float strip = tptOr(tptLines(vW.x + 1542.0, 16.0, 0.05, fp), tptLines(vW.z + 400.0, 16.0, 0.05, fp));
  // a course of darker stone 1.33 m wide (the black tile's tone brought 0.45 of the way to the flag's) under every
  // rib line (x = 58 + 16 k) and along z = -16 and z = 16, the brass strips of those lines down its middle: bands and
  // a set of bars, each its box mean for any pixel
  float course = tptOr(tptLines(vW.x + 1542.0, 16.0, 0.665, fp), min(tptBox(vW.z - 16.0, 0.665, fp) + tptBox(vW.z + 16.0, 0.665, fp), 1.0));
  alb = mix(mix(uStone * tone, mix(uTile[1], uStone, 0.45), course) * (1.0 - 0.45 * joint), uTile[3], strip);
  gloss = 0.25 + 0.6 * strip;
#endif
  // CONTACT DARKENING, closed forms of the plan: what stands on a floor hides part of the sky from it at its foot.
  // ao is the share of sky light left; each term fades to nothing within a few metres.
  float ao = 1.0;
#if ${K} == 0
  // the shop fronts' risers along both walls (x -40 and x 4, standing 0.5 m proud)
  ao = 1.0 - 0.45 * (1.0 - smoothstep(0.5, 3.6, min(vW.x + 40.0, 4.0 - vW.x)));
#elif ${K} == 1
  // the ranks' plinths (from radius 62.2) and the gallery columns (radius 57.75, on every 15 degrees), where galleries stand
  float rr = length(vW.xz), onDeck = deckAt(vW.xz);
  float aDeg = degrees(atan(vW.z, vW.x + step(rr, 1e-6) * 1e-4)), dCol = length(vec2((aDeg - 15.0 * floor(aDeg / 15.0 + 0.5)) * 0.0174533 * rr, rr - 57.75));
  ao = 1.0 - onDeck * max(0.5 * smoothstep(58.2, 62.0, rr), 0.5 * (1.0 - smoothstep(0.5, 2.6, dCol)));
#else
  // the side walls' dado and what stands along it (benches, crates, regulators: one to a bay, about its middle)
  float wd = 56.0 - abs(vW.z), bx = mod(vW.x - 58.0, 16.0) - 8.5;
  ao = 1.0 - max(0.4 * (1.0 - smoothstep(0.3, 3.0, wd)), 0.5 * (1.0 - smoothstep(0.6, 1.0, length(vec2(bx / 6.5, (wd - 5.5) / 3.4)))));
  ao *= 1.0 - 0.4 * (1.0 - smoothstep(0.3, 3.0, 280.0 - vW.x));        // the east gable's dado
#endif
  vec3 hemi = uSkyCol * skyLift(vW);
  float sh = uSun * worldSun(vW, N, fp);
#if ${K} == 2
  // the post clocks' own shadows, a closed form too: the floor's ray toward the sun passes each post's axis at a
  // level distance dAx and a height hAt; the post is a column of radius 0.6 up to its head and a head of half width
  // uPosts.w and half height 2.6 (its roof and finial are left out). A band's box integral, softened by the sun's width.
  vec2 sdir = uTptSun.xz / max(length(uTptSun.xz), 1e-4); float rise = uTptSun.y / max(length(uTptSun.xz), 1e-4), postShade = 0.0;
  for (int i = 0; i < 16; i++) {
    vec2 rel = uPosts[i].xy - vW.xz; float along = dot(rel, sdir);
    if (along > 0.0) {
      float dAx = abs(rel.x * sdir.y - rel.y * sdir.x), hAt = along * rise, wAt = fp + uTptPen * along * 1.42;
      float rad = hAt < uPosts[i].z - 2.6 ? 0.6 : uPosts[i].w;
      postShade = max(postShade, tptBox(dAx, rad, wAt) * tptEdge(hAt - (uPosts[i].z + 2.6), wAt));
    }
    ao *= 1.0 - 0.55 * (1.0 - smoothstep(1.7, 4.4, length(rel)));       // the post's foot (radius 1.95)
  }
  sh *= 1.0 - postShade;
#endif
  // the foot's own shadow goes with it where the sun falls: six tenths of the darkening
  vec3 col = alb * (hemi * ao + uSunCol * (sh * uSunDir.y * mix(1.0, ao, 0.6)));
  // a polished floor mirrors the sky faintly toward the grazing eye, and the sun where it is lit
  float g = 1.0 - clamp(V.y, 0.0, 1.0), fres = 0.03 + 0.5 * g * g * g * g * g;
  vec3 Hs = uSunDir + V; Hs /= max(length(Hs), 1e-4);
  col += gloss * (uSkyCol * fres * 0.6 + uSunCol * sh * 0.25 * pow(max(Hs.y, 0.0), 60.0));
#if ${K} == 2
  if (uLook.y > 0.5) {
    // THE WET FLOOR mirrors the roof and the great dial: the eye's ray, turned in the floor and stirred a little by
    // the falling water, is carried to the gable's plane and reads the same dial law as the dial of light (the two
    // hands at their present angles); elsewhere it reads the roof.
    vec3 Rr = vec3(-V.x, V.y, -V.z);
    Rr.xz += 0.035 * (vec2(wNoise3(vec3(vW.xz * 0.7, uTime * 0.8)), wNoise3(vec3(vW.zx * 0.7 + 9.0, uTime * 0.8))) - 0.5) * (1.0 - smoothstep(0.35, 1.4, fp));
    Rr /= max(length(Rr), 1e-4);
    float tg = (280.0 - vW.x) / max(Rr.x, 1e-3), wq = fp * (1.0 + tg / dist) + 0.012 * tg;
    vec3 Gp = vW + Rr * tg; vec2 qd = vec2(Gp.z, Gp.y - 44.0);
    // gable, dial and hands are mirrored only where the turned ray heads east toward the gable's plane; as the ray
    // turns along that plane its meeting place runs off beyond the gable's round, so the mirror reads the roof there
    // before the step falls
    float inG = tptEdge(length(vec2(Gp.z, Gp.y - 40.0)) - 56.0, wq) * step(0.0, Rr.x);
    // (the turned ray drifts -qh across the dial for each metre before the glass and begins depF before it: the
    // boss is read through its depth, and each hand with its collar where the ray meets the hand's own plane, 2.4
    // and 1.3 m before the glass, if the ray begins beyond that plane and less what the boss, between its mouth and
    // that plane, hides of it from the turned eye)
    vec2 qh = Rr.zy / max(Rr.x, 1e-3); float depF = 280.0 - vW.x;
    float pass = tptDialGlass(qd, -qh, depF, wq);
    float hands = tptOr(tptGreatMinute(qd - qh * ${gf(GREAT.minute.z)}, uTptHands.x, wq) * tptEdge(${gf(GREAT.minute.z)} - depF, wq) * (1.0 - tptBossBefore(qd, -qh, ${gf(GREAT.minute.z)}, depF, wq)),
      tptGreatHour(qd - qh * ${gf(GREAT.hour.z)}, uTptHands.y, wq) * tptEdge(${gf(GREAT.hour.z)} - depF, wq) * (1.0 - tptBossBefore(qd, -qh, ${gf(GREAT.hour.z)}, depF, wq)));
    vec3 skyRef = vec3(0.40, 0.44, 0.51);                                 // the rain sky's own mean tone (silver and blue-grey in equal parts, lightened a little toward the rim)
    // the sky is read through the glass's passing share less the opal ring's; the opal's own tone lies on the
    // opal's cover, twice its passing share, under the same footprint
    float ol = tptOpalLight(qd, wq);
    vec3 seen = skyRef * max(pass - ol, 0.0) + uOpalRef * (2.0 * ol);
    seen = mix(seen, uRedRef, hands);
    // the roof's passing share; where the turned ray leaves under the springing it meets the glazed side walls, whose
    // iron and clocks let about a third of the sky through
    vec3 roof = skyRef * (0.34 + 0.66 * shedRoof(vW, Rr, fp, 0.012 + fp / dist));
    vec3 refl = mix(roof, seen, inG);
    float fw = 0.5 + 0.5 * g * g;                                         // a wet polished floor: a strong mirror at every angle of the flight
    col = col * 0.6 * (1.0 - fw) + refl * fw;
  }
#endif
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------------
// GLSL: THE SKY (a dome that follows the eye), THE DUST (motes lit by worldSun, so they show the sun's shafts and
// vanish in shade) and THE CHAINS of the watches.
// ---------------------------------------------------------------------------------------------------------------
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
// THE CLOUDS' COVER BY LOOK: [the cover's true mean, the mean of the cloud's tone weighted by the cover, the
// threshold's shift under a pixel 0, 0.02, 0.04 ... 0.50 wide (in the noise's units)]. The cover is a threshold of
// the noise (sun: 0.57 with an edge of 0.10; cloud: 0.44 with 0.20), and the same threshold on a filtered noise
// loses cover as the noise flattens (the sun look's by 3 per cent at a width of 0.06, by 17 at 0.18, by 40 at 0.30,
// all of it from 0.42). So the threshold is lowered with the pixel's width by just what keeps the cover's mean: each
// typed shift is the one that keeps the mean of the cover over the noise at its width. From a width of 0.5 the noise is flat
// (0.5 everywhere) and the last shift alone would make the cover smoothstep(0.4762, 0.5762, 0.5) = 0.1430, where its
// mean is 0.1431. EVERY FIGURE HERE IS OF ONE SAMPLE: the noise in single precision at 8,000,000 places at
// random (x and y from -30 to 30, z from 0 to 20, in the noise's units); between the sample's two halves (its even
// places and its odd) a shift differs by 0.00005 at most, a cover's mean by 0.00011 and a tone's mean by 0.00024.
// The rain's sky draws its own sheet over the clouds and takes the first row.
const CLOUDS = ({
  sun: [0.1431, 0.262, [0.0000, 0.0000, 0.0010, 0.0022, 0.0032, 0.0043, 0.0045, 0.0055, 0.0083, 0.0113, 0.0133, 0.0141, 0.0142,
    0.0147, 0.0182, 0.0247, 0.0334, 0.0438, 0.0550, 0.0663, 0.0769, 0.0854, 0.0909, 0.0933, 0.0938, 0.0938]],
  cloud: [0.3662, 0.547, [0.0000, 0.0000, 0.0003, 0.0005, 0.0008, 0.0011, 0.0011, 0.0014, 0.0021, 0.0030, 0.0035, 0.0037, 0.0037,
    0.0038, 0.0049, 0.0068, 0.0093, 0.0123, 0.0153, 0.0180, 0.0200, 0.0212, 0.0217, 0.0219, 0.0220, 0.0220]],
});
const skyDefs = (K) => `#define SKY_MEAN ${K[0].toFixed(4)}\n#define SKY_TONE ${K[1].toFixed(3)}\nconst float SKY_SHIFT[26] = float[26](${K[2].map((v) => v.toFixed(4)).join(', ')});\n`;
const SKY_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uMist; uniform vec3 uMistSh; uniform vec3 uBand;
uniform vec4 uCl; uniform float uClEdge; uniform vec3 uSunDir;   // uCl: cloud scale, threshold, speed, rain (0 or 1); uClEdge: the softness of a cloud's edge
varying vec3 vDir;
${NOISE_GLSL}
// four octaves of value noise (each of mean 0.5) with weights that sum to one: mean 0.5. w is the pixel's width in the
// noise's own units: an octave whose period falls from four pixels to two goes to its mean, so the sum keeps its mean
// under any pixel and nothing finer than the pixel is drawn.
float skyFbm(vec3 p, float w){
  return 0.5 * mix(0.5, wNoise3(p), 1.0 - smoothstep(0.25, 0.5, w))
    + 0.25 * mix(0.5, wNoise3(p * 2.03 + 7.1), 1.0 - smoothstep(0.25, 0.5, w * 2.03))
    + 0.125 * mix(0.5, wNoise3(p * 4.1 + 3.3), 1.0 - smoothstep(0.25, 0.5, w * 4.1))
    + 0.125 * mix(0.5, wNoise3(p * 8.3 + 1.7), 1.0 - smoothstep(0.25, 0.5, w * 8.3));
}
// THE COVER KEEPS ITS MEAN under any pixel: its threshold is lowered by the typed shift at the pixel's width
// (skyShift: the table of CLOUDS, straight between its knots), so the clouds do not thin away toward the horizon;
// from a width of 0.36 to 0.44, where the noise is all but flat and the least error of a shift would tell, the cover
// goes over to its typed mean itself.
// THE TONE within a cloud is taken from the same lowered threshold, and from a width of 0.09 to 0.42 it goes to its
// typed mean (the cover's own weighting), so that the light of the clouds is kept as well.
float skyShift(float w){
  float t = min(w / 0.02, 24.999); int i = int(floor(t));
  return mix(SKY_SHIFT[i], SKY_SHIFT[i + 1], t - floor(t));
}
float skyCover(float cl, float w){
  float a = uCl.y - skyShift(w);
  return mix(SKY_MEAN, smoothstep(a, a + uClEdge, cl), 1.0 - smoothstep(0.36, 0.44, w));
}
float skyTone(float cl, float w){
  float a = uCl.y - skyShift(w);
  return mix(SKY_TONE, smoothstep(a, a + 0.30, cl), 1.0 - smoothstep(0.09, 0.42, w));
}
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4); float h = d.y;
  // the clear sky: a full light blue overhead, a little lighter low down; its pale lies in the band along the
  // horizon (below), so that white enamel and the cloud tops stand lighter than the sky behind them
  vec3 col = mix(uHor, uZen, pow(clamp(h, 0.0, 1.0), 0.60));
  // clouds on a level sheet far above, drifting by the clock
  vec2 q = d.xz / max(h + 0.10, 0.03) * uCl.x + vec2(uTime * 0.030, uTime * 0.010) * uCl.z;
  float wq = max(length(dFdx(q)), length(dFdy(q)));
  float cl = skyFbm(vec3(q, uTime * 0.006 * uCl.z), wq);
  float m = skyCover(cl, wq) * smoothstep(-0.01, 0.10, h);
  vec3 cc = mix(vec3(0.74, 0.82, 0.96), vec3(1.25, 1.22, 1.15), skyTone(cl, wq));
  col = mix(col, cc, m * 0.94);
  // the rain's lower sheet: its place and its pixel's width are taken here, before the branch on the look
  vec2 q2 = d.xz / max(h + 0.16, 0.05) * 2.7 + vec2(uTime * 0.085, -uTime * 0.034);
  float wq2 = max(length(dFdx(q2)), length(dFdy(q2)));
  if (uCl.w > 0.5) {
    // RAIN: low cloud from rim to rim. Two sheets drift across each other by the clock, the lower one finer and
    // quicker; where they swell the cloud is silver, in their hollows blue-grey, and toward the horizon the whole
    // lightens. In luminance its brightest silver is 0.54 and the band along the horizon 0.69; a standing white
    // dial in this light is 0.63 (0.54 to 0.71 as the rain's ripple passes over it), an ivory one 0.51.
    float c2 = skyFbm(vec3(q2, 5.0 + uTime * 0.02), wq2);
    float low = smoothstep(0.36, 0.64, 0.6 * cl + 0.4 * c2);
    vec3 rc = mix(vec3(0.20, 0.25, 0.33), vec3(0.50, 0.54, 0.60), low);
    col = mix(rc, uBand, 0.9 * pow(1.0 - clamp(h, 0.0, 1.0), 5.0));
  }
  // below the horizon a level floor of mist far under the eye: soft billows, each white on its side toward the sun
  // and blue in the shadow on its side away (the difference of the billows' height one step toward the sun), deeper
  // in the hollows; toward the horizon it thins into one bright band of light that lies along the horizon itself,
  // narrow under the sun and broad under rain
  vec2 P = d.xz / max(0.08 - h, 0.03) * 1.5 + vec2(uTime * 0.011, uTime * 0.006);
  float wP = max(length(dFdx(P)), length(dFdy(P)));
  vec2 sd = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float b0 = skyFbm(vec3(P, 1.0 + uTime * 0.005), wP), b1 = skyFbm(vec3(P + sd * 0.24, 1.0 + uTime * 0.005), wP);
  float tone = clamp(0.5 + 6.0 * (b0 - b1) + 1.8 * (b0 - 0.5), 0.0, 1.0);          // 0.5 where the billows go to their mean
  vec3 mcol = mix(uMistSh, uMist, tone);
  col = mix(col, mcol, 1.0 - smoothstep(-0.05, 0.035, h));
  col = mix(col, uBand, mix(0.55, 0.88, uCl.w) * exp(-abs(h + 0.01) / mix(0.018, 0.045, uCl.w)));
  gl_FragColor = vec4(col, 1.0);
}`;
const DUST_VERT = /* glsl */`
attribute vec4 aSeed;                              // three phases and the speck's size in metres
uniform float uPxH; uniform float uSun; uniform vec3 uSunCol;
varying vec3 vCol;
${SHADOW_GLSL}
void main(){
  vec3 p = position;
  p.x += 0.9 * sin(uTime * 0.11 + aSeed.x * 6.2831853);
  p.y += 0.7 * sin(uTime * 0.07 + aSeed.y * 6.2831853);
  p.z += 0.9 * cos(uTime * 0.09 + aSeed.z * 6.2831853);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = max(-mv.z, 0.1);
  float px = aSeed.w * projectionMatrix[1][1] * uPxH * 0.5 / d;        // the speck's true width in pixels
  // THE LAW: a speck has one true width in metres, as dealt, and one true brightness. Its drawn width is the greater
  // of one pixel and its true width in pixels; its light is its brightness times its true area over its drawn area.
  // No cap, no floor and no other term in the distance stands here. The speck is taken as a square of its own width.
  float drawn = max(px, 1.0);
  gl_PointSize = drawn;
  // lit by the sun alone, through the same closed forms as every surface: a speck in shade is not drawn
  vCol = uSunCol * (uSun * worldSun(p, vec3(0.0, 1.0, 0.0), 0.5) * 0.6 * px * px / (drawn * drawn));
}`;
const DUST_FRAG = /* glsl */`
varying vec3 vCol;
void main(){
  gl_FragColor = vec4(vCol, 1.0);
}`;
// A chain is a brass ribbon 0.06 m wide. Where one pixel at the chain's straight distance from the eye is wider
// than 0.06 m the ribbon is drawn that one pixel wide and its cover is 0.06 m over the drawn width, so drawn width
// times cover is the chain's true width at every distance: the pixel's filter, by which nothing is thinned or
// faded. The one-pixel width holds at the frame's middle; away from the middle the ribbon is 1/cos A to
// 1/cos^2 A pixels wide (A the angle from the frame's axis) and the cover, a ratio of two widths in metres, stays
// true. The sun's share is read on the chain's axis.
// ITS LINKS, period 0.16 m: by turns a link seen flat (an oval ring: between 0.3 and 1.0 of the half width from its
// centre) and a link seen on edge (a bar 0.4 of the width, the whole half period long). Typed mean cover of the
// ribbon: flat link pi x (1 - 0.3 x 0.3) / 4 = 0.7147, edge link 0.4; mean (0.7147 + 0.4) / 2 = 0.5574. Under a
// pixel wider than half a link (0.08 m) the ribbon is its mean; the links are drawn where a pixel is under 0.02 m.
const CHAIN_VERT = /* glsl */`
attribute vec3 aTop; attribute float aLen;
uniform float uPxH; uniform float uSun; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGroundCol; uniform vec3 uBrass;
varying vec4 vCol; varying vec3 vS;
#include <common>
#include <fog_pars_vertex>
${WATCH_SWING_GLSL}
${SHADOW_GLSL}
void main(){
  vec3 down = tptSwingRot() * vec3(0.0, -1.0, 0.0);
  vec3 c = aTop + down * (position.y * aLen);
  vec3 toEye = cameraPosition - c; float d = max(length(toEye), 0.1);
  vec3 side = cross(down, toEye); side /= max(length(side), 1e-4);
  float pix = d * 2.0 / (projectionMatrix[1][1] * uPxH);             // one pixel's width at that distance, metres
  float halfW = max(0.03, 0.5 * pix);
  vec3 lit = mix(uGroundCol, uSkyCol, 0.5) + uSunCol * (uSun * worldSun(c, vec3(-1.0, 0.0, 0.0), 0.3) * 0.5);
  c += side * (position.x * halfW);
  vCol = vec4(uBrass * lit, 0.03 / halfW);
  vS = vec3(position.y * aLen, pix, position.x);
  vec4 mvPosition = viewMatrix * vec4(c, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CHAIN_FRAG = /* glsl */`
varying vec4 vCol; varying vec3 vS;
#include <common>
#include <fog_pars_fragment>
void main(){
  float t = vS.x / 0.16, flat_ = step(fract(t), 0.5), q = fract(t * 2.0) * 2.0 - 1.0, r = length(vec2(vS.z, q));
  float links = mix(step(abs(vS.z), 0.4), step(0.3, r) * step(r, 1.0), flat_);
  float toMean = smoothstep(0.02, 0.08, vS.y);
  float cover = mix(links, 0.5574, toMean);                             // typed mean (above)
  // a flat link is the lighter. TYPED MEAN of the shade, weighted by cover (the halves of the period cover 0.4 and
  // 0.7147): (0.4 x 0.8 + 0.7147 x 1.15) / (0.4 + 0.7147) = 1.0244
  float shade = mix(mix(0.8, 1.15, flat_), 1.0244, toMean);
  gl_FragColor = vec4(vCol.rgb * shade, vCol.a * cover);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------------
// BUILD. Sections below push their steps into STEPS (run in order) and LAST (run after them: writers to meshes,
// dial lists to instanced meshes, the counts). Every step yields.
// ---------------------------------------------------------------------------------------------------------------
const STEPS = [], LAST = [];
const lin = (hex, k = 1, gloss = 0) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k, gloss]; };
const mulc = (c, k, gloss = c[3]) => [c[0] * k, c[1] * k, c[2] * k, gloss];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

async function setup(ctx) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const mood = ctx.vary?.mood ?? 0.6, hour = ctx.vary?.hour ?? 'any';
  const look = hour === 'day' ? 'sun' : mood < 0.30 ? 'rain' : mood < 0.52 ? 'cloud' : 'sun';
  // the seeded swaps, dealt here in one fixed order before anything else draws
  const iron = rng.pick(['green', 'prussian', 'graphite']);
  const enamel = rng() < 0.5 ? 0 : 1;                       // the dial kit's kind: 0 white, 1 ivory
  const tileFig = rng() < 0.5 ? 0 : 1;
  const wood = rng.pick([['#553623', '#7A5236'], ['#75583A', '#94754E'], ['#3E2C22', '#5F4433']]);
  const rare = !!ctx.vary?.rare, density = Math.min(1, Math.max(0.7, ctx.vary?.density ?? 1));
  const scene = new THREE.Scene();
  const path = makePath(ROUTE), L = path.length;
  let T = 0; for (let i = 0; i < 480; i++) T += (L / 480) / speedAt((i + 0.5) / 480 * L);
  const meanSpeed = L / T;

  await ctx.yield();
  const hero = await buildHero(ctx, { palette: PAL, look, iron, sunDir: SUN });
  hero.object.position.set(SHD.gableX, 6, 0); hero.object.rotation.y = -Math.PI / 2;
  scene.add(hero.object); hero.syncLight();
  await ctx.yield();

  const rain = look === 'rain';
  const ENV = {
    // THE LIGHT. Sky light on a level white surface in shade: cool and blue. The sun, a pale lemon white: through
    // the roof (0.7055 of it, SHED_MEAN) onto a level surface at 45 degrees it adds 2.8 times the sky light (in
    // luminance: 1.416 x 0.7055 x 0.7071 = 0.707 against 0.253), so a sunlit level white is 3.8 times the same white
    // in shade. Both stand low enough that a sunlit pale floor keeps its tone under the picture's curve: of 255, the
    // court's marble shows 219 between the dome's bars and 122 in shade, the shed's limestone 201 and 93. Every use
    // of the sun's colour is multiplied by uSun, so the rain look takes none of it and the one value serves all
    // looks. Under rain there is no sun: the whole low sky sheds an even silver light, under which a standing
    // white dial is 0.63 in luminance (0.54 to 0.71 as the ripple passes), an ivory one 0.51, against the brightest
    // cloud seen through the panes (0.54), under the band along the horizon (0.69).
    uSkyCol: { value: rain ? V3(1.0, 1.05, 1.13) : V3(0.19, 0.255, 0.42) },
    uGroundCol: { value: rain ? V3(0.60, 0.63, 0.69) : V3(0.19, 0.21, 0.25) },
    uSunCol: { value: V3(1.65, 1.40, 0.89) }, uSunDir: { value: V3(...SUN).normalize() }, uSun: { value: rain ? 0 : 1 },
    uGlassCol: { value: rain ? V3(0.62, 0.66, 0.73) : V3(0.62, 0.76, 0.98) },
    uTime: { value: 0 }, uBob: { value: V3(0, PEN.pivotY - PEN.len, 0) }, uLook: { value: new THREE.Vector2(look === 'cloud' ? 1 : 0, rain ? 1 : 0) },
    uPxH: { value: 450 },
    ...hero.lightUniforms,
  };
  // THE HAZE: thin and bright, a light blue under the sun (lighter than the clear sky from 5 degrees up, darker than
  // the band along the horizon, so that far iron goes blue and not white) and the rain sky's own blue-grey silver
  // under rain. At 30 m it takes under one part in a hundred, at 226 m (the great dial from the east arch) almost a
  // quarter (0.24): the far gable stands back from the near iron.
  const fogCol = rain ? new THREE.Color(0.50, 0.54, 0.60) : new THREE.Color(0.40, 0.58, 0.92);
  scene.fog = new THREE.FogExp2(fogCol, 0.0023);
  const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const kitOpts = { palette: PAL, sunGLSL: SHADOW_GLSL + FILL_GLSL + '\n#define TPT_SKY_LIFT\nfloat tptSkyLift(vec3 p){ return skyLift(p); }\n', sunUniforms: { ...hero.lightUniforms, uTime: ENV.uTime, uBob: ENV.uBob, uLook: ENV.uLook } };
  const kit = makeDialKit(ctx, kitOpts), kitW = makeDialKit(ctx, { ...kitOpts, moveGLSL: MOVE_WATCH });
  for (const k of [kit, kitW]) {
    k.uniforms.uSkyCol.value.copy(ENV.uSkyCol.value); k.uniforms.uGroundCol.value.copy(ENV.uGroundCol.value);
    k.uniforms.uSunCol.value.copy(ENV.uSunCol.value); k.uniforms.uSunDir.value.copy(ENV.uSunDir.value); k.uniforms.uSun.value = ENV.uSun.value;
    k.uniforms.uTptFaceCol.value[3].set(0.70, 0.69, 0.65);              // the court floor's marble
  }
  // the great dial's own materials face west, away from the sun: they are lit by the shed's bright air
  hero.uniforms.uSkyCol.value.set(...(rain ? [0.66, 0.69, 0.74] : [0.60, 0.72, 0.96]));
  hero.uniforms.uGroundCol.value.set(...(rain ? [0.38, 0.40, 0.43] : [0.40, 0.42, 0.47]));
  hero.uniforms.uSunCol.value.copy(ENV.uSunCol.value);
  // THE OPAL RING'S GLOW. Under the sun the ring's mean is 1.105 in luminance and its brightest 1.523: of 255 it shows
  // 229 and 237, against the mist behind it (225 on its sunlit tops, 207 at its mean) and the sky behind its upper
  // half (169 at 10 degrees); only a cloud's sunlit top (231) is as light. Under rain, 1.7: the ring's mean 1.022
  // shows 226 against the rain's mist (200 on its tops), the brightest thing on the gable. Both glows keep the
  // ring's brightest part just under the brief's white (all three channels over 235): 239, 237, 233 under the sun,
  // 233, 235, 239 under rain.
  hero.uniforms.uOpalGlow.value = rain ? 1.7 : 1.5;

  // THE IRON'S PAINT: the dealt colour a quarter of the way toward its own grey, times 1.15 (0.65 under rain, whose
  // sky light is four times the sun look's); lighter members 1.45 of it, darker ones 0.8; a painted gloss of 0.15.
  // Of 255 through the picture's curve, at the picture's middle, a near upright member of the main tone shows, in
  // the sun and in the shed's shade: green 106 and 55, graphite 106 and 57, prussian 101 and 51 (its blue 128 in
  // that shade); at 200 m the haze lifts the three shaded tones to 114 or 115. The darker members are the deepest
  // tones of the building's iron, and deepest in the court's shade: low in the court green 40, graphite 38, prussian
  // 37, and 35 m up 36, 32 and 32. They are kept at 0.8 of the paint so that the green stays over the brief's near
  // black (32 and under) wherever the fill light stands, and the graphite and the prussian in all but the court's
  // top, where both stand on that line (the prussian a deep blue there: its blue 104). A member turned to the sun
  // that stands in a cast shadow takes no fill (FILL_GLSL) and is deeper: its main tone shows green 24 or 25,
  // graphite 18, prussian 20 or 21. Under rain the three darker tones show 41, 39 and 37 in every place.
  const ironRaw = lin(IRON_PAINT[iron] || PAL[2], rain ? 0.65 : 1.15), ironY = 0.2126 * ironRaw[0] + 0.7152 * ironRaw[1] + 0.0722 * ironRaw[2];
  const paint = ironRaw.map((v, i) => (i < 3 ? v + (ironY - v) * 0.25 : 0.15));
  // THE WOODS. Both woods of the dealt pair (a darker and a lighter) are first turned from red toward brown at their
  // own luminance (warm: green not under 0.63 of red, blue not over 0.45 of green; as paint the woods of every pair
  // then stand from 33 to 40 degrees of hue, where the pairs as dealt stand from 21 to 33, and every pair is turned):
  // the one red is the great hands'. The floor of green stands that high because the picture's curve shows a dark
  // brown in shade redder than its paint.
  // The pair is too deep for this light to be told from black where
  // it stands in shade, so the wood that is seen is lifted by its luminance (the tone's own, linear) and keeps its colour: a wall
  // of clocks' boards are the lighter wood at 0.15 or over, the fields behind the clocks 1.25 of it and 0.19 or over
  // (and so the shop recess's sides and back; its floor and its shelf are the lighter of the two woods named last
  // below, 0.19 or over). THE CASES' WOODS are four: the darker wood set to 0.105 and the
  // lighter to 0.125 (both under the field, a dark case on it), a honey wood (the lighter carried six tenths of the
  // way to a honey colour, 0.30 or over) and a pale oak (0.415). THE LONGCASE WOODS are the same four at 0.11, 0.15,
  // the honey and 0.85 of the oak: they stand against pale stone. THE CASES ON THE PASSAGE'S WHITE WALLS are the
  // pair itself, the darker wood at 0.15 or over and the lighter at 0.19 or over; a shop's clocks, before the wood of
  // its recess, have the two darker case woods.
  const lumOf = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], setY = (c, Y) => mulc(c, Y / lumOf(c));
  const warm = (c) => { const g = Math.max(c[1], 0.63 * c[0]), d = [c[0], g, Math.min(c[2], 0.45 * g), c[3]]; return mulc(d, lumOf(c) / lumOf(d)); };
  const woodL = warm(lin(wood[1], 1, 0.35)), woodD = warm(lin(wood[0], 1, 0.35)), atLeast = (c, Y) => mulc(c, Math.max(1, Y / lumOf(c)));
  const honeyRaw = lin('#C9913F'), honey = atLeast(woodL.map((v, i) => (i < 3 ? v + (honeyRaw[i] - v) * 0.6 : v)), 0.30), oak = lin('#C4A97A', 1, 0.35);
  const col = {
    iron: mulc(paint, 1.0), ironL: mulc(paint, 1.45), ironD: mulc(paint, 0.8), black: lin(PAL[1], 1.2), brass: lin(PAL[3], 0.95, 1), brassD: lin(PAL[3], 0.62, 1),
    white: lin('#EFEBDD', 0.76), wall: lin('#F0E4C8', 0.80), cream: lin('#E4DCC6', 0.76), stone: lin('#D9D2C0', 0.72), shade: lin('#9AA3AE', 0.55),
    woodD, woodL, woodB: atLeast(woodL, 0.15), woodF: atLeast(mulc(woodL, 1.25), 0.19), steel: lin(PAL[7]), dark: lin('#566370'),
    caseD: atLeast(woodD, 0.15), caseL: atLeast(woodL, 0.19),
    caseWoods: [setY(woodD, 0.105), setY(woodL, 0.125), honey, oak], longWoods: [setY(woodD, 0.11), setY(woodL, 0.15), honey, mulc(oak, 0.85)],
  };
  const solid = (move) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...ENV }, vertexShader: SOLID_VERT(move), fragmentShader: SOLID_FRAG, fog: true, side: THREE.DoubleSide });
  const B = {
    ctx, rng, detail, look, rain, rare, density, iron, enamel, tileFig, scene, path, L, meanSpeed, hero, ENV, fogU, kit, kitW, col,
    mat: { solid: solid(MOVE_NONE), pend: solid(MOVE_PEND), watch: solid(MOVE_WATCH),
      pane: new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...ENV }, vertexShader: PANE_VERT, fragmentShader: PANE_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false }) },
    // writers: solids and panes by room
    w: { pas: mkW(), crt: mkW(), crt2: mkW(), shd: mkW(), shdE: mkW(), wm: mkW(), wa: mkW(), ws: mkW(), panePas: mkW(true), paneCrt: mkW(true), paneShd: mkW(true) },
    // dial lists by weight and room: each entry [Matrix4, kind]; watch dials carry their swing too
    dials: { near: {}, middle: {}, far: {} }, wdials: { near: [], middle: [], far: [] },
    count: {}, moving: {}, air: {}, sight: {}, updaters: [], late: [], trash: new Set(), tris: 0, calls: 0,
  };
  // plan distance from the flown line
  B.planDist = (x, z) => path.nearestXZ(x, z).dist;
  // a dial of the kit: centre, facing (unit, level or not), radius, kind; twelve is up (or up0 for a dial lying flat)
  const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
  B.dialMatrix = (pos, facing, radius, up0) => {
    _z.copy(facing).normalize(); _y.copy(up0 || V3(0, 1, 0)); _x.crossVectors(_y, _z).normalize(); _y.crossVectors(_z, _x);
    return new THREE.Matrix4().makeBasis(_x, _y, _z).scale(V3(radius, radius, radius)).setPosition(pos);
  };
  B.addDial = (room, weight, pos, facing, radius, kind, what) => {
    if (room === 'pas' && weight === 'middle') room = 'pas' + pasRoom(pos.x, pos.z);
    (B.dials[weight][room] ||= []).push([B.dialMatrix(pos, facing, radius), kind]);
    B.count[what] = (B.count[what] || 0) + 1;
  };
  // an instanced mesh from a geometry, a material and a list of matrices (and optional per-instance arrays)
  B.instanced = (geo, mat, mats, attrs = {}, order = 0) => {
    const g = Object.keys(attrs).length ? geo.clone() : geo;
    if (g !== geo) B.trash.add(geo);
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k].data), attrs[k].size));
    const im = new THREE.InstancedMesh(g, mat, mats.length);
    for (let i = 0; i < mats.length; i++) im.setMatrixAt(i, mats[i]);
    im.instanceMatrix.needsUpdate = true; im.renderOrder = order;
    scene.add(im); B.calls++; B.tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * mats.length;
    return im;
  };
  B.mesh = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; scene.add(m); B.calls++; B.tris += geo.attributes.position.count / 3; return m; };
  return B;
}

export default {
  id: 'ten-past-ten',
  name: 'Ten Past Ten',
  category: 'interior',
  weirdness: 0.2,
  media: ['interior', 'air'],
  async build(ctx) {
    const B = await setup(ctx);
    for (const step of STEPS) { await step(B); await ctx.yield(); }
    for (const step of [...LAST, ...B.late]) { await step(B); await ctx.yield(); }
    const { scene, path, L, hero, ENV } = B;
    const size = new THREE.Vector2(), dialAt = V3(SHD.gableX, 44, 0);
    // the middle of the dial of light: where the sun's ray through the great dial's centre meets the floor
    const lightAt = V3(dialAt.x - dialAt.y * SUN[0] / SUN[1], 0, dialAt.z - dialAt.y * SUN[2] / SUN[1]);
    // everything built, the great dial with it: every mesh's triangles (an instanced one counts every instance)
    let built = 0, draws = 0;
    const tally = (o) => {
      if (!o.visible) return;
      if (o.isMesh) { const g = o.geometry; built += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : g.isInstancedBufferGeometry ? g.instanceCount : 1); draws++; } else if (o.isPoints) draws++;
      for (const ch of o.children) tally(ch);
    };
    tally(scene);
    return {
      scene, path, duration: 50,
      pace: (u) => speedAt(Math.min(1, Math.max(0, u)) * L) / B.meanSpeed,
      camera: { fov: 60, near: 0.3, far: 3000, lookAhead: 18, sway: 0.35, bank: 0.3 },
      pois: [
        { at: V3(0, 22, 0), from: 60 / L, to: 215 / L, weight: 0.55 },
        { at: dialAt, from: 215 / L, to: 440 / L, weight: 0.5 },
        { at: lightAt, from: 300 / L, to: 436 / L, weight: 0.3, fade: 0.45 },
      ],
      portal: { shape: 'circle', radius: 6, color: '#ffe9c4', glow: 0.75, style: 'ring', revealDistance: 200 },
      post: { exposure: 1.0, bloom: { strength: 0.22, radius: 0.55, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.03, tint: B.rain ? '#f4f7ff' : '#fffaf2', shadowTint: '#0b1730', vignette: 0.22, grain: 0.015, aberration: 0 } },
      ride: 'none', style: 'none',
      info: { look: B.look, iron: B.iron, rare: B.rare, dials: B.count, moving: B.moving, clearAir: B.air, sightCone: B.sight, watchToPost: B.watchToPost, watchToWatch: B.watchToWatch, watchesGathered: B.gathered, trianglesBuilt: built, meshes: draws },
      update(dt, time, camera, u) {
        ENV.uTime.value = time;
        // THE GREAT HANDS: by the metres flown alone (at u 0 they stand at ten past ten)
        hero.setMetres(u * L);
        hero.update(dt, time, camera);
        if (B.look === 'cloud') hero.setSun(0.06 + 0.94 * bandShapeJS(dialAt.x, dialAt.z, time));
        ctx.renderer.getDrawingBufferSize(size); ENV.uPxH.value = size.y;
        for (let i = 0; i < B.updaters.length; i++) B.updaters[i](dt, time, camera, u);
      },
      // the originals of cloned geometries are not in the scene
      dispose() { for (const g of B.trash) g.dispose(); },
    };
  },
};

// ---------------------------------------------------------------------------------------------------------------
// SMALL PARTS shared by the rooms: a turned form on any axis, a small pendulum's list, the period law.
// ---------------------------------------------------------------------------------------------------------------
// a turned form (profile [[radius, height along the axis]]) at pos about the unit axis dir
function turned(w, pos, dir, profile, seg, col) {
  const y = dir.clone().normalize(), x = Math.abs(y.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0), z = new THREE.Vector3().crossVectors(x, y).normalize(); x.crossVectors(y, z);
  w.M = new THREE.Matrix4().makeBasis(x, y, z).setPosition(pos); w.lathe(profile, seg, col); w.M = null;
}
// AN IRON PIER'S FACE, modelled as a plate girder stood on end. M places it: local x across the face (0..W), y up
// (0..H), z out of the face. From the floor: a base of three mouldings (to 1.85 m, the lowest 0.45 m proud); a
// flange 0.55 m wide and 0.3 m proud up each edge with a line of rivets 0.32 m across and about 1.4 m apart; storeys
// divided by rails 1 m high (centred on the heights given) with a line of rivets each; in the storeys by turns a
// sunk panel (a raised fillet 0.35 m wide round a field) and a lattice web of flat bars 0.4 m wide and 0.2 m deep
// crossing before a plate in a darker tone of the same paint (0.7 of it); where the storey between its margins is
// under 1.5 m wide the fillet is 0.22 m and the bars 0.28 m. Under every rail and under the impost the storey's
// ground darkens upward to 0.7 of its tone (over 1.2 m of a lattice's plate, over the 0.6 m margin of a panel). An
// impost of three mouldings steps out from 3 m under the top (the uppermost 0.5 m proud) under a plain frieze.
// tablets: each sunk panel carries a square tablet from margin to margin (0.16 m proud, at most 2.2 m square) at
// its end toward the lattice storey, and the tablets' middles and half widths are returned for the caller's
// roundels. bare: storeys (counted from the floor) left
// without panel or web, for what a caller hangs there. foot: the share of their 0.45, 0.36 and 0.26 m that the base's
// mouldings stand proud (1 but for the cheek at 310 degrees, where the last longcase clock of a rank stands 0.33 m
// from the cheek: there 0.65, the lowest 0.29 m proud). decked: a gallery's deck is let into this face on the rails'
// lines, its top (y 14, y 28) at the height of the rails' tops and over the whole of them (the rails stand 0.22 m
// proud between radius 57.9 and 63.4, the deck lies from 57 to 64): the deck is their top there, and no top is
// written for them.
function ironPier(w, c, M, W, H, rails, bare = [], foot = 1, decked = false, tablets = false) {
  w.M = M;
  const spots = [];
  const rivets = (x0, y0, x1, y1, z) => {
    const k = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 1.4)), r = 0.16;
    for (let i = 0; i < k; i++) {
      const x = x0 + (x1 - x0) * (i + 0.5) / k, y = y0 + (y1 - y0) * (i + 0.5) / k, p = [x, y, z + 0.08];
      w.tri([x - r, y - r * 0.58, z], [x + r, y - r * 0.58, z], p, c.ironD); w.tri([x + r, y - r * 0.58, z], [x, y + r * 1.15, z], p, c.ironL); w.tri([x, y + r * 1.15, z], [x - r, y - r * 0.58, z], p, c.iron);
    }
  };
  w.quad([0, 0, 0], [W, 0, 0], [W, H, 0], [0, H, 0], c.ironD);
  w.box(-0.1, 0, 0, W + 0.1, 1.3, 0.45 * foot, c.ironD, 'y-z-'); w.box(-0.05, 1.3, 0, W + 0.05, 1.6, 0.36 * foot, c.ironL, 'y-z-'); w.box(0, 1.6, 0, W, 1.85, 0.26 * foot, c.iron, 'y-z-');
  const yi = H - 3.0;
  w.box(0, yi, 0, W, yi + 0.3, 0.26, c.iron, 'z-'); w.box(-0.05, yi + 0.3, 0, W + 0.05, yi + 0.75, 0.38, c.ironL, 'z-'); w.box(-0.1, yi + 0.75, 0, W + 0.1, yi + 1.1, 0.5, c.iron, 'z-');
  w.box(0, yi + 1.1, 0, W, H, 0.2, c.iron, 'z-y-');
  for (const x of [0, W - 0.55]) { w.box(x, 1.85, 0, x + 0.55, yi, 0.3, c.ironL, 'y-y+z-'); rivets(x + 0.275, 2.1, x + 0.275, yi - 0.25, 0.3); }
  const x0 = 0.55, x1 = W - 0.55, edges = [1.85, ...rails.flatMap((r) => [r - 0.5, r + 0.5]), yi];
  for (const r of rails) { w.box(x0, r - 0.5, 0, x1, r + 0.5, 0.22, c.iron, decked ? 'x-x+z-y+' : 'x-x+z-'); rivets(x0 + 0.2, r, x1 - 0.2, r, 0.22); }
  const plate = mulc(c.iron, 0.7);
  for (let j = 0; j * 2 < edges.length; j++) {
    const a0 = x0 + 0.4, a1 = x1 - 0.4, b0 = edges[j * 2] + 0.6, b1 = edges[j * 2 + 1] - 0.6, wide = a1 - a0 > 1.5;
    if (bare.includes(j)) continue;
    // the storey's ground under the rail or the impost over it: it darkens upward to 0.7 of its tone
    const yB = edges[j * 2], yT = edges[j * 2 + 1], g = j % 2 ? plate : c.ironD, gs = mulc(g, 0.7), hs = j % 2 ? 1.2 : 0.6;
    if (j % 2) w.quad([x0, yB, 0.03], [x1, yB, 0.03], [x1, yT - hs, 0.03], [x0, yT - hs, 0.03], g);
    w.quadC([x0, yT - hs, 0.03], [x1, yT - hs, 0.03], [x1, yT, 0.03], [x0, yT, 0.03], g, g, gs, gs);
    if (j % 2 === 0) {
      const fw = wide ? 0.35 : 0.22, f = wide ? Math.max(fw + 0.15, Math.min(0.6, (a1 - a0) * 0.2)) : (a1 - a0) * 0.2;
      for (const [p, q, r, t] of [[a0, b0, a1, b0 + fw], [a0, b1 - fw, a1, b1], [a0, b0 + fw, a0 + fw, b1 - fw], [a1 - fw, b0 + fw, a1, b1 - fw]]) w.box(p, q, 0, r, t, 0.12, c.ironL, 'z-');
      w.quad([a0 + f, b0 + f, 0.05], [a1 - f, b0 + f, 0.05], [a1 - f, b1 - f, 0.05], [a0 + f, b1 - f, 0.05], c.iron);
      if (tablets && wide) {
        const h = Math.min((a1 - a0) / 2, 1.1), cx = (a0 + a1) / 2, cy = j ? b0 + fw + 0.15 + h : b1 - fw - 0.15 - h;
        w.box(cx - h, cy - h, 0, cx + h, cy + h, 0.16, c.ironL, 'z-'); spots.push([cx, cy, h]);
      }
    } else {
      const bw = wide ? 0.4 : 0.28, m = Math.max(1, Math.round((b1 - b0) / (a1 - a0)));
      for (let k = 0; k < m; k++) {
        const c0 = b0 + (b1 - b0) * k / m, c1 = b0 + (b1 - b0) * (k + 1) / m;
        for (const [p, q, z] of [[a0, a1, 0.11], [a1, a0, 0.15]]) w.bar([[p, c0, z], [q, c1, z]], [[0, 0, 1], [0, 0, 1]], 0.2, bw, c.ironL);
        if (k) w.box(a0, c0 - bw / 2, 0, a1, c0 + bw / 2, 0.1, c.iron, 'x-x+z-');
      }
    }
  }
  w.M = null;
  return spots;
}
// CONTACT DARKENING ON A WALL: what hangs on a wall hides part of the sky from the wall round it. A rim of the
// wall's own colour is laid 0.03 m before the wall round the thing: dark (k of the wall's colour) at the thing's
// outline, the wall's colour at its outer edge, a little deeper below than above. at(u, v) places a point of the
// wall's plane (u level, v up).
function contactDisc(w, at, cu, cv, r, grow, wall, k = 0.55, seg = 12) {
  const dark = mulc(wall, k);
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, g0 = grow * (1.25 - 0.45 * Math.sin(a0)), g1 = grow * (1.25 - 0.45 * Math.sin(a1));
    w.quadC(at(cu + (r - 0.06) * Math.cos(a0), cv + (r - 0.06) * Math.sin(a0)), at(cu + (r - 0.06) * Math.cos(a1), cv + (r - 0.06) * Math.sin(a1)),
      at(cu + (r + g1) * Math.cos(a1), cv + (r + g1) * Math.sin(a1)), at(cu + (r + g0) * Math.cos(a0), cv + (r + g0) * Math.sin(a0)), dark, dark, wall, wall);
  }
}
function contactRect(w, at, u0, v0, u1, v1, grow, wall, k = 0.55) {
  const dark = mulc(wall, k), gB = grow * 1.7;
  const I = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], O = [[u0 - grow, v0 - gB], [u1 + grow, v0 - gB], [u1 + grow, v1 + grow * 0.8], [u0 - grow, v1 + grow * 0.8]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; w.quadC(at(...I[i]), at(...I[j]), at(...O[j]), at(...O[i]), dark, dark, wall, wall); }
}
// a small pendulum or balance: pivot, facing (the swing is in the plane across it), length; period by its length
// (1.6 s at 1 m to 3.2 s at 3.2 m, dealt 0.97 to 1.03 times that), a phase and an amplitude of its own. On the rare visit every pendulum takes
// the great pendulum's 12 s and its phase (the sympathy of clocks); its three draws are made all the same, so
// that a seed deals everything else alike on a rare visit and on a plain one. Balances keep their own time always.
// amp: the swing's half angle, dealt 0.85 to 1.15 times; most: the angle the plan lets it reach (what the stream deals
// over it is held to it).
function addPendulum(B, list, pivot, facing, len, rng, amp = 0.11, most = Infinity) {
  const d1 = rng(), d2 = rng(), d3 = rng();
  const period = B.rare ? PEN.period : Math.min(3.2, Math.max(1.6, 1.6 + (len - 1.0) * (1.6 / 2.2))) * (0.97 + 0.06 * d1);
  list.push({ m: B.dialMatrix(pivot, facing, len), sw: [B.rare ? 0 : d2 * TAU, period, Math.min(most, amp * (0.85 + 0.3 * d3))] });
}

// ---------------------------------------------------------------------------------------------------------------
// THE PASSAGE
// ---------------------------------------------------------------------------------------------------------------
STEPS.push(async (B) => {
  const w = B.w.pas, wp = B.w.panePas, c = B.col, rng = B.rng.fork('passage'), P = PAS;
  B.pends = []; B.balances = []; B.pendsW = { wm: [], wa: [], ws: [] };      // (pendsW: the walls of clocks, by group)
  const halfAng = Math.asin(22 / P.r);                                    // the vault's half angle, 64.9 degrees
  const arcPt = (a, r, z) => [P.cx + r * Math.sin(a), P.cy + r * Math.cos(a), z];
  for (const din of [1, -1]) {
    const xw = din > 0 ? P.x0 : P.x1, X = (t) => xw + din * t, face = V3(din, 0, 0);
    const bx = (t0, y0, z0, t1, y1, z1, col, skip) => w.box(Math.min(X(t0), X(t1)), y0, z0, Math.max(X(t0), X(t1)), y1, z1, col, skip);
    for (let k = 0; k < 8; k++) {
      const z0 = P.zN + 8 * k, z1 = z0 + 8, zc = z0 + 4, door = (k === 2 || k === 5);
      // THE FIRST BAY OF THE EAST SIDE (z 60 to 68) has no shop: the court's round wall (radius 64) meets this wall at
      // z 63.87, and behind the bay stand that wall and the pier at 82 to 86 degrees, where a recess would be. Its
      // front is closed with iron panels; its six clocks and two balances are not built (their draws are made).
      const closed = din < 0 && k === 0;
      // shop front: stall riser with panels, the window's recess with a shelf (or, on the closed bay, an iron front with three panels);
      // at a door the riser stands either side of the door's stone step (3.2 m wide), 1.8 m of it a side with a panel 1.2 m wide each
      if (door) for (const s of [-1, 1]) {
        bx(0, 0, zc + (s < 0 ? -3.4 : 1.6), 0.5, 1.6, zc + (s < 0 ? -1.6 : 3.4), c.ironD, s < 0 ? 'y-z+' : 'y-z-');
        bx(0.5, 0.25, zc + (s < 0 ? -3.1 : 1.9), 0.6, 1.35, zc + (s < 0 ? -1.9 : 3.1), c.iron, 'y-');
      } else {
        bx(0, 0, z0 + 0.6, 0.5, 1.6, z1 - 0.6, c.ironD, 'y-');
        for (let j = 0; j < 3; j++) bx(0.5, 0.25, z0 + 0.9 + j * 2.27, 0.6, 1.35, z0 + 2.83 + j * 2.27, c.iron, 'y-');
      }
      const back = c.woodF, side = c.woodB;                               // the recess is lined with wood: the dials read against it
      if (closed) {
        bx(0, 1.6, z0 + 0.6, 0.15, 9.2, z1 - 0.6, c.ironD, 'y-');
        for (let j = 0; j < 3; j++) bx(0.15, 2.0, z0 + 0.9 + j * 2.27, 0.25, 8.8, z0 + 2.83 + j * 2.27, c.iron);
      } else {
        w.quad([X(-3), 1.6, z0 + 0.6], [X(-3), 9.2, z0 + 0.6], [X(-3), 9.2, z1 - 0.6], [X(-3), 1.6, z1 - 0.6], back);
        w.quad([X(0), 1.6, z0 + 0.6], [X(-3), 1.6, z0 + 0.6], [X(-3), 1.6, z1 - 0.6], [X(0), 1.6, z1 - 0.6], c.caseL);
        w.quad([X(0), 9.2, z0 + 0.6], [X(-3), 9.2, z0 + 0.6], [X(-3), 9.2, z1 - 0.6], [X(0), 9.2, z1 - 0.6], side);
        w.quad([X(0), 1.6, z0 + 0.6], [X(-3), 1.6, z0 + 0.6], [X(-3), 9.2, z0 + 0.6], [X(0), 9.2, z0 + 0.6], side);
        w.quad([X(0), 1.6, z1 - 0.6], [X(-3), 1.6, z1 - 0.6], [X(-3), 9.2, z1 - 0.6], [X(0), 9.2, z1 - 0.6], side);
      }
      if (door) {      // an open shop door: no pane, a leaf standing ajar, a dark way in
        w.quad([X(-2.95), 1.6, zc - 1.5], [X(-2.95), 8.2, zc - 1.5], [X(-2.95), 8.2, zc + 1.5], [X(-2.95), 1.6, zc + 1.5], c.dark);
        w.quad([X(0.1), 1.6, zc - 1.6], [X(2.2), 1.6, zc - 2.5], [X(2.2), 8.6, zc - 2.5], [X(0.1), 8.6, zc - 1.6], c.iron);
        w.quad([X(0.5), 3.0, zc - 1.75], [X(1.9), 3.0, zc - 2.35], [X(1.9), 7.9, zc - 2.35], [X(0.5), 7.9, zc - 1.75], c.ironL);
        bx(0, 0, zc - 1.6, 1.2, 1.6, zc + 1.6, c.stone, 'y-');
      } else if (!closed) {
        wp.pane([X(0.15), 1.6, z0 + 0.6], [X(0.15), 1.6, z1 - 0.6], [X(0.15), 9.2, z1 - 0.6], [X(0.15), 9.2, z0 + 0.6],
          [0, 0], [6.8, 0], [6.8, 7.6], [0, 7.6], [2.2667, 0.06, 5.2, 0.06], 0, c.iron);
      }
      if (!closed) bx(-2.9, 5.05, z0 + 0.7, -1.3, 5.2, z1 - 0.7, c.caseL);
      // the shop's clocks: three on the recess's floor, three on the shelf; the two outer ones below have a balance
      for (let s = 0; s < 2; s++) for (let j = 0; j < 3; j++) {
        const z = zc + (j - 1) * 2.1 + (s ? 0.5 : -0.4), y0 = s ? 5.2 : 1.6, R = 0.40 + 0.14 * rng(), hgt = R * 2.5 + 0.3, tone = c.caseWoods[rng() < 0.5 ? 0 : 1];
        if (door && j === 1) { rng(); continue; }
        if (closed) { if (!s && j !== 1) { rng(); rng(); } continue; }
        bx(-2.3, y0, z - R * 1.25, -1.7, y0 + hgt, z + R * 1.25, tone, 'y-');
        w.quad([X(-1.7), y0 + hgt, z - R * 1.25], [X(-1.7), y0 + hgt + R * 0.7, z], [X(-1.7), y0 + hgt, z + R * 1.25], [X(-1.7), y0 + hgt, z + R * 1.25], tone);
        w.tri([X(-2.3), y0 + hgt, z - R * 1.25], [X(-2.0), y0 + hgt + R * 0.7, z], [X(-1.7), y0 + hgt, z - R * 1.25], mulc(tone, 0.8));
        w.tri([X(-2.3), y0 + hgt, z + R * 1.25], [X(-2.0), y0 + hgt + R * 0.7, z], [X(-1.7), y0 + hgt, z + R * 1.25], mulc(tone, 0.8));
        B.addDial('pas', 'middle', V3(X(-1.66), y0 + hgt - R * 1.12, z), face, R, B.enamel, 'shop clocks');
        if (!s && j !== 1) {     // a brass balance turning to and fro before the case's foot
          B.balances.push({ m: B.dialMatrix(V3(X(-1.2), y0 + 0.5, z), V3(0, 1, 0), 0.34, V3(din, 0, 0)), sw: [rng() * TAU, 1.6 + 0.5 * rng(), 1.4] });
          turned(w, V3(X(-1.2), y0, z), V3(0, 1, 0), [[0.42, 0], [0.42, 0.1], [0.06, 0.14], [0.05, 0.5]], 8, c.brassD);
        }
      }
      // the fascia with a panel and two brass bosses, the cornice on its brackets
      bx(0, 9.2, z0, 0.6, 11, z1, c.iron, 'y-');
      bx(0.6, 9.55, z0 + 0.8, 0.7, 10.65, z1 - 0.8, c.ironL);
      turned(w, V3(X(0.7), 10.1, z0 + 1.6), face, [[0.34, 0], [0.26, 0.12], [0, 0.16]], 8, c.brass);
      turned(w, V3(X(0.7), 10.1, z1 - 1.6), face, [[0.34, 0], [0.26, 0.12], [0, 0.16]], 8, c.brass);
      bx(0, 11, z0, 1.1, 11.45, z1, c.ironL); bx(0, 11.45, z0, 0.7, 12, z1, c.iron);
      for (let j = 0; j < 4; j++) bx(0.6, 10.3, z0 + 1 + j * 2 - 0.12, 1.0, 11, z0 + 1 + j * 2 + 0.12, c.ironD);
      // the wall field, its frieze, a string course
      w.quad([X(0), 12, z0], [X(0), 29, z0], [X(0), 29, z1], [X(0), 12, z1], mulc(c.white, din > 0 ? 1 : 0.93));
      bx(0, 29, z0, 0.5, 30, z1, c.iron); bx(0, 17.95, z0, 0.18, 18.2, z1, c.cream);
      // THE WALL CLOCKS: four rows, every one laid inside the 7.0 m that the pilasters (0.5 m either side of the rib
      // lines, 0.45 m proud) leave of the bay's 8 m: no case, cap, box or dial comes within 0.055 m of a pilaster or
      // 0.06 m of its neighbour, and no row reaches the next. Their contact shades lie in one plane (0.03 m before
      // the wall) and none overlaps another: at a bay's two ends the shades of rows B, C and D run on 0.02 to 0.08 m
      // under the pilaster and end inside it (row A's ends 0.13 m short of it, and 0.004 m over the cornice's top
      // below); every shade ends before the string course and before the frieze. A round or eight-sided case's shade has its inner edge 0.06 m inside the
      // case's outline, under the case. ROW A'S SHADE IS ONE RIM round the row's three cases: its inner edge lies
      // 3.19 m either way of the bay's middle, 0.06 m inside the outer trunks' sides (3.25 m; the heads reach 3.30,
      // the feet 3.35, the caps 3.42), at y 12.31 below, 0.06 m over the feet's undersides, and at y 17.66 above,
      // 0.06 m under the caps' tops: under the cases all round, but where it passes the gaps between them (0.2 m
      // between two feet, 0.06 m between two caps).
      const wallC = mulc(c.white, din > 0 ? 1 : 0.93), onWall = (u, v) => [X(0.03), v, u];
      // row A's contact shade: one rim round the row's three cases
      contactRect(w, onWall, zc - 3.19, 12.31, zc + 3.19, 17.66, 0.18, wallC);
      // row A: three glazed regulators 2.3 m apart (the caps, 2.24 m wide, stand 0.06 m apart and 0.08 m from a pilaster);
      // a dial is 1.600 m from corner to corner of its bezel's sixteen sides and 1.569 m across their flats
      for (let j = -1; j <= 1; j++) {
        const z = zc + j * 2.3, wd = rng() < 0.5 ? c.caseD : c.caseL;
        bx(0, 12.4, z - 0.8, 0.12, 15.5, z + 0.8, mulc(wd, 0.75), 'z-z+');        // (the dark back, between the two sides)
        bx(0, 12.4, z - 0.95, 0.75, 15.5, z - 0.8, wd); bx(0, 12.4, z + 0.8, 0.75, 15.5, z + 0.95, wd);
        bx(0, 12.25, z - 1.05, 0.85, 12.45, z + 1.05, wd); bx(0, 15.5, z - 1.0, 0.8, 17.5, z + 1.0, wd);
        bx(0, 17.5, z - 1.12, 0.92, 17.72, z + 1.12, mulc(wd, 1.2));
        B.addDial('pas', 'middle', V3(X(0.82), 16.5, z), face, 0.8, B.enamel, 'wall clocks');
        addPendulum(B, B.pends, V3(X(0.42), 15.52, z), face, 2.35, rng, 0.15);   // its rod runs 0.02 m up into the head (from y 15.5); the pendulum shows in the trunk: the bob (radius 0.31) swings at most 0.41 m each way in a trunk 0.8 m each way
      }
      // row B: two large round clocks in turned cases (3.24 m across, dials 2.54 m), 1.8 m either side of the bay's middle, centres y 20.05: 0.36 m between the cases, 0.08 m to a pilaster
      // (a case has the bezel's own sixteen sides, so its lip's inner edge and the bezel's outer edge are one outline; its back, 0.05 m before the wall, runs corner to corner of its side and closes it behind the dial)
      for (const j of [-1, 1]) {
        const z = zc + j * 1.8;
        contactDisc(w, onWall, z, 20.05, 1.62, 0.12, wallC);
        turned(w, V3(X(0), 20.05, z), face, [[1.62, 0], [1.62, 0.2], [1.45, 0.36], [1.27, 0.3]], 16, (i) => [c.caseD, c.caseL, c.caseD][i]);
        turned(w, V3(X(0.05), 20.05, z), face, [[0, 0], [1.62, 0]], 16, mulc(c.caseD, 0.75));
        B.addDial('pas', 'middle', V3(X(0.3), 20.05, z), face, 1.27, B.enamel, 'wall clocks');
      }
      // row C: three eight-sided drop clocks (heads 2.17 m across, dials 1.66 m) 2.36 m apart, centres y 24.4: 0.19 m between the heads, 0.055 m to a pilaster; under each head a box (1.24 m wide, from y 21.85) in which the bob swings
      // (a head's back, 0.05 m before the wall, closes it behind the dial: the lip's eight corners, at 0.85 m, stand 0.02 m outside the bezel's)
      for (let j = -1; j <= 1; j++) {
        const z = zc + j * 2.36, wd = rng() < 0.5 ? c.caseL : c.caseD;
        contactDisc(w, onWall, z, 24.4, 1.085, 0.06, wallC, 0.55, 8);
        turned(w, V3(X(0), 24.4, z), face, [[1.085, 0], [1.085, 0.26], [0.85, 0.34]], 8, (i) => [wd, mulc(wd, 1.25)][i]);
        turned(w, V3(X(0.05), 24.4, z), face, [[0, 0], [1.085, 0]], 8, mulc(wd, 0.75));
        bx(0, 22.0, z - 0.55, 0.1, 23.5, z + 0.55, mulc(wd, 0.75));
        bx(0, 22.0, z - 0.62, 0.3, 23.5, z - 0.5, wd); bx(0, 22.0, z + 0.5, 0.3, 23.5, z + 0.62, wd); bx(0, 21.85, z - 0.62, 0.3, 22.0, z + 0.62, wd);
        B.addDial('pas', 'middle', V3(X(0.33), 24.4, z), face, 0.83, B.enamel, 'wall clocks');
        addPendulum(B, B.pends, V3(X(0.2), 23.36, z), face, 1.0, rng, 0.28);     // its rod runs 0.045 m up into the head's foot (the lowest corner, y 23.315): the bob (radius 0.13) swings at most 0.45 m each way between sides 0.5 m each way, its foot 0.23 m over the box's
      }
      // row D: three small round clocks (2.0 m across, dials 1.72 m) 2.4 m apart, centres y 27.3, over those of row C: 0.4 m between the cases, 0.1 m to a pilaster
      // (a case's back, 0.05 m before the wall, closes it behind the dial: the lip has twelve sides and the bezel sixteen)
      for (let j = -1; j <= 1; j++) {
        const z = zc + j * 2.4;
        contactDisc(w, onWall, z, 27.3, 1.0, 0.14, wallC);
        turned(w, V3(X(0), 27.3, z), face, [[1.0, 0], [1.0, 0.16], [0.86, 0.2]], 12, c.black);
        turned(w, V3(X(0.05), 27.3, z), face, [[0, 0], [1.0, 0]], 12, c.black);
        B.addDial('pas', 'middle', V3(X(0.19), 27.3, z), face, 0.86, B.enamel, 'wall clocks');
      }
      await B.ctx.yield();
    }
    await B.ctx.yield();
    // pilasters on the rib lines, base and cap
    for (let k = 0; k <= 8; k++) {
      const z = P.zN + 8 * k;
      bx(0, 0, z - 0.6, 0.8, 11, z + 0.6, c.iron, 'y-'); bx(0, 0, z - 0.75, 0.95, 1.2, z + 0.75, c.ironD, 'y-'); bx(0, 10.2, z - 0.72, 0.92, 11, z + 0.72, c.ironL);
      bx(0, 12, z - 0.5, 0.45, 29, z + 0.5, c.iron); bx(0.45, 12.6, z - 0.28, 0.55, 28.4, z + 0.28, c.ironL);
    }
    // the wall runs on to the court's round wall
    const zEnd = Math.sqrt(CRT.R * CRT.R - xw * xw);
    // (the west wall only: 10 m of it; the line passes its plane at 9.65 m in plan). Its iron pier face keeps base, flanges, rails
    // and impost; its three storeys carry a WALL OF CLOCKS (see clockBay), the largest in the second, at the eye's height
    if (zEnd < P.zN) {
      const M = new THREE.Matrix4().makeBasis(V3(0, 0, 1), V3(0, 1, 0), V3(din, 0, 0)).setPosition(xw, 0, zEnd), W = P.zN - zEnd;
      ironPier(w, c, M, W, 30, [10.6, 19.4], [0, 1, 2]);
      (B.clockBays ||= []).push({ M, n: V3(din, 0, 0), x0: 0.55, x1: W - 0.55, end: (y) => (y < 11 ? W - 0.6 : W - 0.55), group: 'wm', boards: [[1.85, 10.1], [11.1, 18.9], [19.9, 27.0]],
        storeys: [[3.0, 9.9, [['d', 3, 0.95], ['r', 4, 0.80]]], [11.3, 18.7, [['R', 3, 1.10], ['d', 3, 0.95]]], [20.1, 26.8, [['r', 4, 0.80], ['d', 3, 0.95]]]] });
    }
  }
  await B.ctx.yield();
  // WEST OF THE MOUTH THE VAULT RUNS ON TO THE COURT'S ROUND WALL. The vault's last rib stands at z 60; east of
  // x -22.27 the round wall stands south of that line and on the vault (which passes into it, as far as z 63.87 at
  // the east wall), but west of it the wall falls back north, to z 49.96 at the passage's west wall. There the
  // vault's purlins and its glass run on north as far as the round wall and 0.12 m into it (zRun: the wall over the
  // mouth stands on the glass there as it does on the east), over the west wall where it runs on: the glass at the springing
  // closes that wall's top (y 30).
  const zRun = (x) => Math.min(P.zN, Math.sqrt((CRT.R - 0.12) * (CRT.R - 0.12) - x * x));
  // the vault: nine ribs (web and two flanges), purlins every 4 m of arc, glass between (and, last, the seven panes that run on from the last rib's line to the round wall)
  const SEG = 16;
  for (let k = 0; k <= 8; k++) {
    const z = P.zN + 8 * k;
    for (const [r, depth, width, col] of [[P.r - 0.08, 0.16, 0.8, c.ironL], [P.r - 0.66, 1.0, 0.36, c.iron], [P.r - 1.24, 0.16, 0.8, c.ironL]]) {
      const pts = [], ups = [];
      for (let i = 0; i <= SEG; i++) { const a = -halfAng + 2 * halfAng * i / SEG; pts.push(arcPt(a, r, z)); ups.push([Math.sin(a), Math.cos(a), 0]); }
      w.bar(pts, ups, depth, width, col);
    }
    if (k % 3 === 2) await B.ctx.yield();
  }
  for (let j = -6; j <= 6; j++) {
    const a = j * 4 / P.r, p0 = arcPt(a, P.r - 0.2, zRun(P.cx + (P.r - 0.2) * Math.sin(a))), p1 = arcPt(a, P.r - 0.2, P.zS);
    w.bar([p0, p1], [[Math.sin(a), Math.cos(a), 0], [Math.sin(a), Math.cos(a), 0]], 0.32, 0.28, c.iron);
  }
  for (let k = 0; k < 8; k++) for (let i = 0; i < SEG; i++) {
    const a0 = -halfAng + 2 * halfAng * i / SEG, a1 = -halfAng + 2 * halfAng * (i + 1) / SEG, z0 = P.zN + 8 * k, z1 = z0 + 8;
    wp.pane(arcPt(a0, P.r, z0), arcPt(a0, P.r, z1), arcPt(a1, P.r, z1), arcPt(a1, P.r, z0),
      [z0 + 400.5, a0 * P.r], [z1 + 400.5, a0 * P.r], [z1 + 400.5, a1 * P.r], [z0 + 400.5, a1 * P.r], [1.0, 0.03, 1000, 0], 0, c.iron);
  }
  for (let i = 0; i < SEG; i++) {
    const a0 = -halfAng + 2 * halfAng * i / SEG, a1 = -halfAng + 2 * halfAng * (i + 1) / SEG, z0 = zRun(P.cx + P.r * Math.sin(a0)), z1 = zRun(P.cx + P.r * Math.sin(a1));
    if (z0 > P.zN - 1e-6 && z1 > P.zN - 1e-6) continue;
    wp.pane(arcPt(a0, P.r, z0), arcPt(a0, P.r, P.zN), arcPt(a1, P.r, P.zN), arcPt(a1, P.r, z1),
      [z0 + 400.5, a0 * P.r], [P.zN + 400.5, a0 * P.r], [P.zN + 400.5, a1 * P.r], [z1 + 400.5, a1 * P.r], [1.0, 0.03, 1000, 0], 0, c.iron);
  }
  // the south end, behind the start: a glazed iron screen, bars 0.10 m wide every metre, transoms every 6 m
  wp.pane([P.x0, 0, P.zS], [P.x1, 0, P.zS], [P.x1, 30, P.zS], [P.x0, 30, P.zS], [0, 0], [44, 0], [44, 30], [0, 30], [1.0, 0.05, 6, 0.05], 0, c.iron);
  for (let i = 0; i < SEG; i++) {
    const a0 = -halfAng + 2 * halfAng * i / SEG, a1 = -halfAng + 2 * halfAng * (i + 1) / SEG, p0 = arcPt(a0, P.r, P.zS), p1 = arcPt(a1, P.r, P.zS);
    wp.pane([p0[0], 30, P.zS], [p1[0], 30, P.zS], p1, p0, [p0[0] + 40, 30], [p1[0] + 40, 30], [p1[0] + 40, p1[1]], [p0[0] + 40, p0[1]], [1.0, 0.05, 6, 0.05], 0, c.iron);
  }
  // six double-faced bracket clocks, three a side, 5.5 m out from the wall on iron brackets that spring from the pilasters, dials 3.2 m, centres y 20
  for (const [din, zs] of [[1, [108, 92, 76]], [-1, [100, 84, 68]]]) for (const z of zs) {
    const xw = din > 0 ? P.x0 : P.x1, xc = xw + din * 5.5, cp = V3(xc, 20, z);
    w.box(Math.min(xw, xc - din * 1.9), 20.9, z - 0.22, Math.max(xw, xc - din * 1.9), 21.35, z + 0.22, c.iron);
    w.bar([[xw, 24.5, z], [xw + din * 1.6, 23.2, z], [xw + din * 3.2, 22.0, z], [xc - din * 1.2, 21.5, z]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]], 0.3, 0.3, c.ironL);
    w.bar([[xw, 17.2, z], [xw + din * 1.8, 18.6, z], [xc - din * 1.75, 19.6, z]], [[0, 1, 0], [0, 1, 0], [0, 1, 0]], 0.26, 0.26, c.iron);
    // the drum, with a flat bezel on each end from its mouth (radius 1.72) in to 1.56, behind the dial's edge (1.6)
    turned(w, V3(xc, 20, z - 0.55), V3(0, 0, 1), [[1.56, 0], [1.72, 0], [1.9, 0.12], [1.9, 0.98], [1.72, 1.1], [1.56, 1.1]], 24, (i) => [c.ironD, c.ironL, c.iron, c.ironL, c.ironD][i]);
    turned(w, V3(xc, 21.9, z), V3(0, 1, 0), [[0.5, 0], [0.34, 0.3], [0.12, 0.42], [0.2, 0.7], [0, 1.05]], 8, c.brass);
    for (const s of [1, -1]) B.addDial('pas', 'near', V3(xc, 20, z + s * 0.56), V3(0, 0, s), 1.6, B.enamel, 'bracket clocks');
    (B.airItems ||= []).push({ cls: 'bracket clocks', p: [xc, 20, z], r: 1.95 });
  }
  await B.ctx.yield();
});

// ---------------------------------------------------------------------------------------------------------------
// THE ROUND COURT, first part: the wall with its four arches, the piers, the three galleries.
// Angles are degrees round the court from east (+x) toward south (+z).
// ---------------------------------------------------------------------------------------------------------------
const GALLERY_ZONES = [[50, 82], [138, 168.5], [191.5, 244.03], [267.03, 310]];      // where the galleries (and the longcase ranks) stand
const BLIND = [{ a: 180, name: 'west' }, { a: 255.53, name: 'north' }];              // the two blind arches' centres: (-64, 0) and toward (-16, -62)
const pol = (r, deg, y) => [r * Math.cos(deg * D2R), y, r * Math.sin(deg * D2R)];
const archY = (z) => CRT.archSpring + Math.sqrt(Math.max(0, CRT.archHalf * CRT.archHalf - z * z));   // the east arch's soffit
const inArch = (x, y, z) => x > 30 && Math.abs(z) < CRT.archHalf && y < archY(z);
const vaultY = (x) => PAS.cy + Math.sqrt(Math.max(0, PAS.r * PAS.r - (x - PAS.cx) * (x - PAS.cx)));    // the passage vault's soffit
// the dome: a point at mer metres of meridian from the pole, deg round the court, dr outside the sphere; its glass runs
// from the drum's top (DOME_MER[0]) to the lantern (DOME_MER[1]) in 12 rings of flat panes between the 24 ribs
const DOME_MER = [CRT.domeR * Math.acos((CRT.drumY - CRT.domeCy) / CRT.domeR), CRT.domeR * Math.acos((CRT.lanternY - CRT.domeCy) / CRT.domeR)];
const domePt = (mer, deg, dr = 0) => { const th = mer / CRT.domeR, r = (CRT.domeR + dr) * Math.sin(th); return [r * Math.cos(deg * D2R), CRT.domeCy + (CRT.domeR + dr) * Math.cos(th), r * Math.sin(deg * D2R)]; };
// THE DOME AS BUILT, WHERE THE SHED'S WEST GABLE (x 58) CUTS IT. The dome's glass is flat between ribs and rings, so
// in that plane it is a line of straight runs under the true round (up to 1.0 m under it, at z 24 either way).
// domeCut58() gives that line's corners [z, y] from north to south: every place where an edge of one of the pane
// writer's two triangles of a dome pane passes the plane. Its two ends stand on the drum's top (y 58) at z 25.78
// either way; from there to z 27.055 the dome's foot stands inside the plane and the drum's top is the outline.
function domeCut58() {
  const out = [];
  for (let k = 0; k < 24; k++) for (let j = 0; j < 12; j++) {
    const d0 = -180 + k * 15, d1 = d0 + 15, m0 = DOME_MER[0] + (DOME_MER[1] - DOME_MER[0]) * j / 12, m1 = DOME_MER[0] + (DOME_MER[1] - DOME_MER[0]) * (j + 1) / 12;
    const q = [domePt(m0, d0), domePt(m0, d1), domePt(m1, d1), domePt(m1, d0)];
    for (const [a, b] of [[0, 1], [1, 2], [2, 0], [2, 3], [3, 0]]) {
      const u = q[a], v = q[b]; if ((u[0] - 58) * (v[0] - 58) >= 0) continue;
      const f = (58 - u[0]) / (v[0] - u[0]); out.push([u[2] + f * (v[2] - u[2]), u[1] + f * (v[1] - u[1])]);
    }
  }
  out.sort((p, q) => p[0] - q[0]);
  return out.filter((p, i) => i === 0 || p[0] - out[i - 1][0] > 1e-6);
}
STEPS.push(async (B) => {
  const w = B.w.crt, wp = B.w.paneCrt, c = B.col, R = CRT.R;
  const wallCol = (y) => mulc(c.wall, y < 42 ? 0.94 : 1.0);
  // A PIER'S ROUNDELS: a dial of the kit on each tablet of a pier's face (ironPier), 0.17 m less than the tablet's
  // half width in radius, its weight by its distance from the line in plan as the walls of clocks take theirs. The
  // count of clear air takes each with its tablet as a cylinder on the face (the tablet's half diagonal in radius;
  // as proud as a near dial's domed glass, 0.19 m and 0.19 of the dial's radius, and 0.01 m more).
  const roundels = (M, n, spots, room, cls) => {
    for (const [x, y, h] of spots) {
      const p = V3(x, y, 0.19).applyMatrix4(M), dl = B.planDist(p.x, p.z);
      B.addDial(room, dl < 14 ? 'near' : dl < 30 ? 'middle' : 'far', p, n, h - 0.17, B.enamel, 'pier roundels');
      (B.airItems ||= []).push({ cls, cyl: [V3(x, y, 0).applyMatrix4(M), n, h * Math.SQRT2, 0.2 + 0.19 * (h - 0.17)], r: 0 });
    }
  };
  // the wall where the galleries stand, and the returns beside the arches: four bands with a skirting and pilasters
  const plain = (a0, a1) => {
    const n = Math.max(1, Math.round((a1 - a0) / 3.75));
    for (let i = 0; i < n; i++) {
      const p0 = a0 + (a1 - a0) * i / n, p1 = a0 + (a1 - a0) * (i + 1) / n;
      // each storey's wall, with the contact darkening of what stands against its foot (to 1.8 m)
      for (const [y0, y1] of [[0, 14], [14, 28], [28, 42], [42, 51]]) {
        const cw = wallCol(y0), cd = mulc(cw, 0.6);
        w.quadC(pol(R, p0, y0), pol(R, p1, y0), pol(R, p1, y0 + 1.8), pol(R, p0, y0 + 1.8), cd, cd, cw, cw);
        w.quad(pol(R, p0, y0 + 1.8), pol(R, p1, y0 + 1.8), pol(R, p1, y1), pol(R, p0, y1), cw);
      }
    }
  };
  // the round wall, plain, in four stretches; at the passage's mouth it ends in the planes of the passage's two walls, at 86.417 and 128.682 degrees
  const mouthE = Math.acos(PAS.x1 / R) / D2R, mouthW = Math.acos(PAS.x0 / R) / D2R;
  for (const [a0, a1] of [[32.09, mouthE], [mouthW, 171], [189, 246.53], [264.53, 327.91]]) plain(a0, a1);
  // over the passage's mouth (the vault's arch) and over the east arch. Over the mouth THE WALL STANDS ON THE
  // VAULT'S GLASS AS IT IS BUILT: the glass is sixteen flats between seventeen stations of the vault's round, and
  // the wall has sixteen runs whose low corners stand at those same stations, where the wall's round passes them
  // (mouthPt). A flat is the same all along the passage, so the foot of each run is a line of its own flat: along
  // the whole mouth the wall neither stands over the glass nor passes through it. (The purlins pass through the
  // wall's foot with the vault; eight of the thirteen stand with their tops over the flats, by up to 0.024 m.)
  const mouthA = Math.asin((PAS.x1 - PAS.cx) / PAS.r);
  const mouthPt = (i, y) => { const a = -mouthA + 2 * mouthA * (16 - i) / 16, x = PAS.cx + PAS.r * Math.sin(a); return [x, y ?? PAS.cy + PAS.r * Math.cos(a), Math.sqrt(R * R - x * x)]; };
  for (let i = 0; i < 16; i++) w.quad(mouthPt(i), mouthPt(i + 1), mouthPt(i + 1, 51), mouthPt(i, 51), wallCol(44));
  for (let i = 0; i < 20; i++) {
    const p0 = -32.09 + 64.18 * i / 20, p1 = -32.09 + 64.18 * (i + 1) / 20, y0 = Math.min(51, archY(R * Math.sin(p0 * D2R))), y1 = Math.min(51, archY(R * Math.sin(p1 * D2R)));
    if (y0 < 51 || y1 < 51) w.quad(pol(R, p0, y0), pol(R, p1, y1), pol(R, p1, 51), pol(R, p0, 51), wallCol(44));
  }
  // the east arch's reveal: an iron soffit from the court's inner surface (wall, drum, then the dome) out to the round
  // wall's own line or to the shed's west gable (x 58), whichever is further east. It is built in 36 straight runs:
  // on the court's side their corners stand on the arch's true round (radius 34; the brow covers the round's rise
  // over each run, 0.032 m at the most); on the outer side the corners stand 34 / cos(2.5 degrees) = 34.032 m out,
  // so that each run's middle touches the true round and none lies inside it. The pane shader draws no glass inside
  // the true round: so the shed's west gable's glass, which ends on that round, ends behind the soffit's outer edge
  // (0.032 m behind it at the corners) and no slit is left between glass and soffit.
  const xIn = (y, z) => y > CRT.drumY ? Math.sqrt(Math.max(0, CRT.domeR * CRT.domeR - (y - CRT.domeCy) * (y - CRT.domeCy) - z * z)) : Math.sqrt(R * R - z * z);
  const brow = [], browUp = [], kOut = 1 / Math.cos(Math.PI / 72);
  for (let i = 0; i <= 36; i++) {
    const al = Math.PI * i / 36, z = CRT.archHalf * Math.cos(al), y = CRT.archSpring + CRT.archHalf * Math.sin(al);
    brow.push([xIn(y, z) - 0.2, y, z]); browUp.push([0, Math.sin(al), Math.cos(al)]);
    if (i < 36) {
      const al1 = Math.PI * (i + 1) / 36, z1 = CRT.archHalf * Math.cos(al1), y1 = CRT.archSpring + CRT.archHalf * Math.sin(al1);
      const xo = Math.max(58, Math.sqrt(R * R - z * z)), xo1 = Math.max(58, Math.sqrt(R * R - z1 * z1));
      if (xo - xIn(y, z) > 0.02 || xo1 - xIn(y1, z1) > 0.02) w.quad([xIn(y, z), y, z], [xo, CRT.archSpring + (y - CRT.archSpring) * kOut, z * kOut], [xo1, CRT.archSpring + (y1 - CRT.archSpring) * kOut, z1 * kOut], [xIn(y1, z1), y1, z1], i % 2 ? c.iron : c.ironD);
    }
  }
  w.bar(brow, browUp, 1.3, 0.9, c.ironL);
  for (const s of [-1, 1]) {
    const z = s * CRT.archHalf, x0 = Math.sqrt(R * R - z * z);
    const Mj = new THREE.Matrix4().makeBasis(V3(1, 0, 0), V3(0, 1, 0), V3(0, 0, -s)).setPosition(x0, 0, z);
    roundels(Mj, V3(0, 0, -s), ironPier(w, c, Mj, 58 - x0, CRT.archSpring, [11, 21.5], [], 1, false, true), s < 0 ? 'wa' : 'ws', 'east arch jambs');
    w.bar([[x0 - 0.2, 0, z], [x0 - 0.2, CRT.archSpring, z]], [[0, 0, s], [0, 0, s]], 1.3, 0.9, c.ironL);
    // (for the count of clear air: that jamb bar's corner toward the way, 0.64 from the point 0.2 inside its middle)
    (B.airItems ||= []).push({ cls: 'east arch jambs', seg: [[x0 - 0.2, 0, z - s * 0.2], [x0 - 0.2, CRT.archSpring, z - s * 0.2]], r: 0.64 });
  }
  // piers from the wall to the galleries' edge, at the ends of the gallery zones: the inner face of each is a
  // modelled pier face (ironPier, its rails on the galleries' lines), and so are both cheeks of the two piers the
  // line passes nearest (at 134..138 degrees by the passage's mouth, 6.0 m in plan, and at 310..314 degrees, 7.8 m); the
  // other cheeks carry a fielded panel in each storey
  const pier = (a0, a1, top, cheeks) => {
    const q = [pol(57, a0, 0), pol(57, a1, 0), pol(R, a1, 0), pol(R, a0, 0)];
    for (let k = 1; k < 4; k++) { const k1 = (k + 1) % 4; w.quad(q[k], q[k1], [q[k1][0], top, q[k1][2]], [q[k][0], top, q[k][2]], c.iron); }
    w.quad(...q.map((v) => [v[0], top, v[2]]), c.ironL);
    const am = (a0 + a1) / 2, da = (a1 - a0) / 2 - 0.45, A = am * D2R, nIn = V3(-Math.cos(A), 0, -Math.sin(A));
    const along = V3(q[1][0] - q[0][0], 0, q[1][2] - q[0][2]), wd = along.length(); along.normalize();
    const Mp = new THREE.Matrix4().makeBasis(along, V3(0, 1, 0), nIn).setPosition(q[0][0], 0, q[0][2]);
    roundels(Mp, nIn, ironPier(w, c, Mp, wd, top, [13.5, 27.5], [], 1, false, true), a0 === 310 ? 'wa' : a0 === 134 ? 'wm' : a0 === 46 ? 'ws' : 'crt', 'arch piers');
    for (const [a, sgn] of [[a0, -1], [a1, 1]]) {
      const Ac = a * D2R, out = V3(Math.cos(Ac), 0, Math.sin(Ac)), tang = V3(-Math.sin(Ac) * sgn, 0, Math.cos(Ac) * sgn), o = sgn * 0.09 / (60 * D2R);       // o: 0.09 m off the cheek, as degrees at radius 60
      if (cheeks === 2 || (cheeks === 1 && sgn < 0)) {
        // a cheek of the two piers the line passes nearest, and the cheek toward the coming eye of the piers at 168.5
        // and 244.03 degrees: the iron pier's frame (base, flanges, rails, impost) with
        // its two lower storeys (on the pier by the east arch all three) left bare for a WALL OF CLOCKS (see clockBay). On the side where a gallery ends the
        // clocks keep to the 3.85 m toward the court: the gallery's longcase rank stands beyond (at 244.03 degrees
        // its last case stands as near the cheek as at 310, and the base's mouldings are held back alike).
        const f = pol(57.35, a, 0), M = new THREE.Matrix4().makeBasis(out, V3(0, 1, 0), tang).setPosition(f[0] + tang.x * 0.02, 0, f[2] + tang.z * 0.02);
        const gal = GALLERY_ZONES.some(([g0, g1]) => g0 === a || g1 === a);
        ironPier(w, c, M, 6.6, top, [13.5, 27.5], a0 === 310 ? [0, 1, 2] : [0, 1], a === 310 || a === 244.03 ? 0.65 : 1, gal);
        (B.clockBays ||= []).push({ M, n: tang.clone(), x0: 0.55, x1: gal ? 4.4 : 6.05, prog: gal ? 'bay' : 'wide', high: a0 === 310, under: gal, group: a0 === 134 || a0 === 168.5 ? 'wm' : 'wa', y0: 1.85, late: cheeks === 1 });
        continue;
      }
      // a flat cheek's fielded panels, one a storey (30 panels on the ten flat cheeks, five quads each): a field
      // 0.117 m proud of the cheek (at radius 60; 1.3 times o), with bevelled margins (0.8 m wide, 0.7 m above and
      // below) that run down to the cheek itself, where they end on it. The panel of the cheek at 86 degrees
      // stands behind the plane of the passage's east wall (x 4), on which the passage's first east pilaster
      // stands: 0.029 m or more from that pilaster (from its cap; 0.037 m from its shaft below the cap, 0.044 m
      // from its shaft above), whose base stands 0.143 m and more from that cheek.
      for (const [y0, y1] of [[2.6, 12.4], [15.2, 26.4], [29.2, 40.4]]) {
        const O = [pol(58.2, a, y0), pol(62.8, a, y0), pol(62.8, a, y1), pol(58.2, a, y1)];
        const F = [pol(59.0, a + o * 1.3, y0 + 0.7), pol(62.0, a + o * 1.3, y0 + 0.7), pol(62.0, a + o * 1.3, y1 - 0.7), pol(59.0, a + o * 1.3, y1 - 0.7)];
        for (let i = 0; i < 4; i++) w.quad(O[i], O[(i + 1) % 4], F[(i + 1) % 4], F[i], c.ironD);
        w.quad(F[0], F[1], F[2], F[3], c.iron);
      }
    }
    // the count of clear air takes the pier's two inner corners, each with the 0.6 m its mouldings and cheeks stand proud
    for (const a of [a0, a1]) (B.airItems ||= []).push({ cls: 'arch piers', seg: [pol(57, a, 0), pol(57, a, top)], r: 0.6 });
  };
  await B.ctx.yield();
  for (const [a0, a1] of [[46, 50], [82, 86], [134, 138], [168.5, 171], [189, 191.5], [244.03, 246.53], [264.53, 267.03], [310, 314]]) { pier(a0, a1, 46, a0 === 134 || a0 === 310 ? 2 : a0 === 168.5 || a0 === 244.03 ? 1 : 0); if (a0 === 134 || a0 === 244.03) await B.ctx.yield(); }
  await B.ctx.yield();
  // the two blind arches: a recess 1.5 m deep, 20 m wide and 44 m high (a half round head of radius 10 from y 34)
  for (const b of BLIND) {
    const A = b.a * D2R, n = V3(-Math.cos(A), 0, -Math.sin(A)), t = V3(-Math.sin(A), 0, Math.cos(A));   // n faces the court, t runs along the wall
    const at = (lat, y, r) => [Math.cos(A) * r + t.x * lat, y, Math.sin(A) * r + t.z * lat];
    const rw = (lat) => Math.sqrt(R * R - lat * lat);
    const head = (lat) => 34 + Math.sqrt(Math.max(0, 100 - lat * lat));
    w.quad(at(-10, 0, 65.5), at(10, 0, 65.5), at(10, 44, 65.5), at(-10, 44, 65.5), mulc(c.cream, 0.8));
    // the recess's dressing under the dial, all of it behind the round wall's line: an iron plinth to y 2.6 (0.45 m
    // before the back), an iron string course from y 19.3 to 20.8 (0.4 m) with its shade on the wall under it, and
    // between them two fielded panels 8.4 m wide and 14 m high (margins 0.8 m, the field 0.12 m before the back)
    {
      const back = mulc(c.cream, 0.8), run = (y0, r0, y1, r1, col, col1 = col) => w.quadC(at(-10, y0, r0), at(10, y0, r0), at(10, y1, r1), at(-10, y1, r1), col, col, col1, col1);
      run(0, 65.05, 2.2, 65.05, c.ironD, c.iron); run(2.2, 65.05, 2.6, 65.5, c.ironL);
      run(19.3, 65.5, 19.6, 65.1, c.ironD); run(19.6, 65.1, 20.4, 65.1, c.iron); run(20.4, 65.1, 20.8, 65.5, c.ironL);
      run(17.9, 65.49, 19.3, 65.49, back, mulc(back, 0.62));
      for (const l0 of [-9, 0.6]) {
        const O = [[l0, 3.8], [l0 + 8.4, 3.8], [l0 + 8.4, 17.8], [l0, 17.8]].map(([l, y]) => at(l, y, 65.5));
        const F = [[l0 + 0.8, 4.6], [l0 + 7.6, 4.6], [l0 + 7.6, 17.0], [l0 + 0.8, 17.0]].map(([l, y]) => at(l, y, 65.38));
        for (let i = 0; i < 4; i++) w.quad(O[i], O[(i + 1) % 4], F[(i + 1) % 4], F[i], mulc(c.cream, i === 2 ? 0.5 : i === 0 ? 0.74 : 0.6));
        w.quad(F[0], F[1], F[2], F[3], mulc(c.cream, 0.94));
      }
    }
    const out = [], ups = [];
    for (let i = 0; i <= 16; i++) {
      const lat = -10 + 20 * i / 16, lat1 = lat + 20 / 16;
      if (i < 16) {
        w.quad(at(lat, head(lat), rw(lat)), at(lat1, head(lat1), rw(lat1)), at(lat1, 51, rw(lat1)), at(lat, 51, rw(lat)), wallCol(44));
        w.quad(at(lat, head(lat), rw(lat)), at(lat1, head(lat1), rw(lat1)), at(lat1, head(lat1), 65.5), at(lat, head(lat), 65.5), c.ironD);
      }
      const al = Math.PI * i / 16; out.push(at(-10 * Math.cos(al), 34 + 10 * Math.sin(al), rw(10 * Math.cos(al)) - 0.3)); ups.push([-t.x * Math.cos(al), Math.sin(al), -t.z * Math.cos(al)]);
    }
    w.bar(out, ups, 0.9, 0.8, c.ironL);
    for (const s of [-1, 1]) {
      { const e = b.a + s * Math.asin(10 / R) / D2R, f = b.a + s * 9; for (const [y0, y1] of [[0, 42], [42, 51]]) w.quad(pol(R, e, y0), pol(R, f, y0), pol(R, f, y1), pol(R, e, y1), wallCol(y0)); }      // (the round wall's plain stretch ends 9 degrees from the arch's middle and the recess's edge stands asin(10 / 64) = 8.989 degrees from it: the 0.012 m between them is wall)
      w.quad(at(s * 10, 0, rw(10)), at(s * 10, 0, 65.5), at(s * 10, 34, 65.5), at(s * 10, 34, rw(10)), c.ironD);
      w.bar([at(s * 10, 0, rw(10) - 0.3), at(s * 10, 34, rw(10) - 0.3)], [[t.x * s, 0, t.z * s], [t.x * s, 0, t.z * s]], 0.9, 0.8, c.ironL);
    }
    // its tower dial, 14 m across, centre y 30: a turned iron surround with a brass inner ring
    // (and an iron back 0.05 m before the recess's wall, corner to corner of the surround's side: the surround has 48 sides and the bezel sixteen, and the back closes it behind the dial)
    const cp = V3(Math.cos(A) * 65.5, 30, Math.sin(A) * 65.5);
    turned(w, cp, n, [[8.3, 0], [8.3, 0.7], [7.7, 1.0], [7.25, 0.9], [7.0, 0.62]], 48, (i) => [c.iron, c.ironL, c.iron, c.brass][i]);
    turned(w, cp.clone().addScaledVector(n, 0.05), n, [[0, 0], [8.3, 0]], 48, c.ironD);
    B.addDial('crt', 'middle', cp.clone().addScaledVector(n, 0.6), n, 7.0, B.enamel, 'tower dials');
  }
  await B.ctx.yield();
  // the galleries: deck, soffit, fascia; balusters modelled where the edge is within 20 m of the line, drawn beyond
  B.columns = []; B.balusters = [];
  for (const [a0, a1] of GALLERY_ZONES) {
    const n = Math.max(1, Math.round((a1 - a0) / 3.75));
    // where the columns of the deck above stand on a deck's edge (every 15 degrees): no baluster stands in a column's foot
    const feet = []; for (let a = Math.ceil((a0 + 1.5) / 15) * 15; a <= a1 - 1.5; a += 15) feet.push(pol(57.75, a, 0));
    for (const y of CRT.decks) for (let i = 0; i < n; i++) {
      const p0 = a0 + (a1 - a0) * i / n, p1 = a0 + (a1 - a0) * (i + 1) / n, pm = (p0 + p1) / 2;
      // a gallery's deck (darkening toward the wall where the rank stands on it, from radius 61.4), its soffit and its fascia
      { const cs = mulc(c.stone, 0.9), cd = mulc(cs, 0.55);
        w.quad(pol(57, p0, y), pol(57, p1, y), pol(61.4, p1, y), pol(61.4, p0, y), cs); w.quadC(pol(61.4, p0, y), pol(61.4, p1, y), pol(R, p1, y), pol(R, p0, y), cs, cs, cd, cd); }
      w.quad(pol(57.3, p0, y - 0.7), pol(57.3, p1, y - 0.7), pol(R, p1, y - 0.7), pol(R, p0, y - 0.7), mulc(c.white, 0.62));
      w.quad(pol(57, p0, y - 1.1), pol(57, p1, y - 1.1), pol(57, p1, y + 0.12), pol(57, p0, y + 0.12), c.iron);
      w.quad(pol(56.9, p0, y - 0.3), pol(56.9, p1, y - 0.3), pol(56.9, p1, y - 0.02), pol(56.9, p0, y - 0.02), c.ironL);
      w.quad(pol(57, p0, y - 1.1), pol(57, p1, y - 1.1), pol(57.3, p1, y - 1.1), pol(57.3, p0, y - 1.1), c.ironD);
      const mid = pol(57, pm, y), arcLen = 57 * (p1 - p0) * D2R;
      if (B.planDist(mid[0], mid[2]) < 20) {
        // the balustrade modelled: balusters, a top rail and a foot rail; on the fascia a sunk panel and two bosses
        const nb = Math.max(1, Math.round(arcLen / 0.95));
        for (let j = 0; j < nb; j++) {
          const q = pol(57.12, p0 + (p1 - p0) * (j + 0.5) / nb, y + 0.12);
          if (y < 42 && feet.some((f) => Math.hypot(q[0] - f[0], q[2] - f[2]) < 0.82)) continue;      // (a foot is 0.66 m in radius, a baluster's own 0.12)
          B.balusters.push(new THREE.Matrix4().makeTranslation(q[0], q[1], q[2]));
        }
        w.bar([pol(57.12, p0, y + 1.62), pol(57.12, p1, y + 1.62)], [[0, 1, 0], [0, 1, 0]], 0.16, 0.26, c.ironL);
        w.quad(pol(56.93, p0 + 0.35, y - 0.95), pol(56.93, p1 - 0.35, y - 0.95), pol(56.93, p1 - 0.35, y - 0.42), pol(56.93, p0 + 0.35, y - 0.42), c.ironD);
        for (const pb of [p0, pm]) { const q = pol(57, pb, y - 0.68), A = pb * D2R; turned(w, V3(q[0], q[1], q[2]), V3(-Math.cos(A), 0, -Math.sin(A)), [[0.2, 0], [0.14, 0.12], [0, 0.16]], 6, c.brassD); }
        w.bar([pol(57.12, p0, y + 0.2), pol(57.12, p1, y + 0.2)], [[0, 1, 0], [0, 1, 0]], 0.14, 0.2, c.iron);
      } else {
        // the balustrade drawn: the same balusters 0.20 m wide every 0.95 m, a top rail centred on 1.50 m and a foot rail, each 0.16 m high
        wp.pane(pol(57.12, p0, y + 0.12), pol(57.12, p1, y + 0.12), pol(57.12, p1, y + 1.70), pol(57.12, p0, y + 1.70),
          [57.12 * p0 * D2R, 0], [57.12 * p1 * D2R, 0], [57.12 * p1 * D2R, 1.58], [57.12 * p0 * D2R, 1.58], [0.95, 0.10, 1.50, 0.08], 2, c.iron);
      }
    }
    await B.ctx.yield();
    // a column under each deck's edge on the dome ribs' lines (every 15 degrees)
    for (let a = Math.ceil((a0 + 1.5) / 15) * 15; a <= a1 - 1.5; a += 15) for (const y of CRT.decks) {
      const q = pol(57.75, a, y - 14);
      B.columns.push(new THREE.Matrix4().makeRotationY(-a * D2R).setPosition(q[0], q[1], q[2]));
      (B.airItems ||= []).push({ cls: 'gallery fronts and columns', seg: [q, [q[0], y, q[2]]], r: 0.6 });
    }
    for (const y of CRT.decks) for (let i = 0; i <= 8; i++) (B.airItems ||= []).push({ cls: 'gallery fronts and columns', p: pol(57, a0 + (a1 - a0) * i / 8, y + 0.4), r: 1.4, ring: [a0, a1, y] });
  }
  await B.ctx.yield();
});

// ---------------------------------------------------------------------------------------------------------------
// THE ROUND COURT, second part: the ranks of longcase clocks, the drum, the dome and its lantern.
// ---------------------------------------------------------------------------------------------------------------
// one longcase clock, 8.4 m tall, foot at the origin, facing +z; tone 1 is the case's wood (the instance's colour).
// From the floor: a plinth (2 m wide) on a moulded foot with a raised panel; a waist 1.7 m wide whose long door is
// glazed (an opening 1.4 m by 3.3 m on a dark glossy back, in which the bob swings); a hood 2 m wide with a
// round top (radius 1 about the dial's centre at 6.85 m), a round-topped glazed door round the dial (1.6 m across),
// a column at each side, an arched cornice and a finial. The far weight keeps the foot, the plinth, the waist with its opening and the hood with its round top, all plain, and has one flat triangle for a finial; it has no raised panel, no mouldings, no hood door, no columns and no cornice.
function longcaseGeometry(near) {
  const w = mkW(), W = [1, 1, 1, 0.35], D = [0.6, 0.6, 0.6, 0.1], L = [1.25, 1.25, 1.25, 0.35], G = [0.16, 0.16, 0.18, 0.95];
  const arch = (r, a, z) => [r * Math.cos(a), 6.85 + r * Math.sin(a), z], n = 6;
  w.box(-1.14, 0, -0.7, 1.14, 0.2, 0.76, L, 'y-');
  for (let i = 0; i < n; i++) {                                           // the hood's round top: its front and its top flats (no back is built)
    const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI, up = Math.sin((a0 + a1) / 2) > 0.7;
    w.tri([0, 6.85, 0.62], arch(1, a0, 0.62), arch(1, a1, 0.62), W);
    w.quad(arch(1, a0, 0.62), arch(1, a0, -0.6), arch(1, a1, -0.6), arch(1, a1, 0.62), up ? L : W);
  }
  w.box(-1.0, 5.72, -0.6, 1.0, 6.85, 0.62, W, near ? 'y+y-z-' : 'y+z-');                    // (the far weight's hood has its own floor, at 5.72; the near weight's floor is the top of the moulding below it)
  if (near) {
    w.box(-1.07, 0.2, -0.66, 1.07, 0.42, 0.7, W, 'y-'); w.box(-1.0, 0.42, -0.6, 1.0, 1.55, 0.62, W, 'y-');
    w.quad([-0.7, 0.62, 0.64], [0.7, 0.62, 0.64], [0.7, 1.35, 0.64], [-0.7, 1.35, 0.64], L);
    w.box(-0.95, 1.55, -0.55, 0.95, 1.7, 0.57, L, 'y-');
    w.quad([-0.7, 1.7, -0.3], [0.7, 1.7, -0.3], [0.7, 5.5, -0.3], [-0.7, 5.5, -0.3], G);
    w.box(-0.85, 1.7, -0.45, -0.7, 5.5, 0.48, W, 'y-y+'); w.box(0.7, 1.7, -0.45, 0.85, 5.5, 0.48, W, 'y-y+');
    w.box(-0.7, 1.7, 0.36, 0.7, 1.95, 0.48, W, 'y-x-x+'); w.box(-0.7, 5.25, 0.36, 0.7, 5.5, 0.48, W, 'y+x-x+');
    w.box(-1.02, 5.5, -0.6, 1.02, 5.72, 0.66, L, 'z-');                                      // (the moulding under the hood, with its top: the hood stands on it 0.02 m in at each side and 0.04 m in at the front)
    // the hood's door: dark glass round the dial, a light frame with a round top
    w.quad([-0.83, 5.95, 0.63], [0.83, 5.95, 0.63], [0.83, 6.85, 0.63], [-0.83, 6.85, 0.63], G);
    w.quad([-0.95, 5.83, 0.66], [0.95, 5.83, 0.66], [0.95, 5.95, 0.66], [-0.95, 5.95, 0.66], L);
    for (const sx of [-1, 1]) w.quad([sx * 0.83, 5.95, 0.66], [sx * 0.95, 5.95, 0.66], [sx * 0.95, 6.85, 0.66], [sx * 0.83, 6.85, 0.66], L);
    for (let i = 0; i < 6; i++) {
      const a0 = i / 6 * Math.PI, a1 = (i + 1) / 6 * Math.PI;
      w.tri([0, 6.85, 0.63], arch(0.83, a0, 0.63), arch(0.83, a1, 0.63), G);
      w.quad(arch(0.83, a0, 0.66), arch(0.95, a0, 0.66), arch(0.95, a1, 0.66), arch(0.83, a1, 0.66), L);
    }
    for (const sx of [-0.93, 0.93]) w.lathe([[0.12, 5.74], [0.08, 5.9], [0.08, 6.72], [0.12, 6.88]], 4, L, sx, 0.72);
    const pts = [], ups = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5 * Math.PI; pts.push(arch(1.04, t, 0.64)); ups.push([Math.cos(t), Math.sin(t), 0]); }
    w.bar(pts, ups, 0.14, 0.2, L);
    w.lathe([[0.15, 7.78], [0.15, 8.02], [0.08, 8.14], [0, 8.4]], 4, L);                    // (the finial's foot stands inside the hood's round top: 0.07 m under its ridge, 0.03 m under its flats at the finial's corners)
  } else {
    // the trunk: its front is a frame round the door's opening (1.4 m by 3.3 m); behind the opening hangs the
    // pendulum, before a dark back 0.3 m behind the pivot, as in the near case
    w.box(-1.0, 0.2, -0.6, 1.0, 1.55, 0.62, W, 'y-'); w.box(-0.85, 1.55, -0.45, 0.85, 5.72, 0.48, W, 'y-y+z+');
    for (const [xa, ya, xb, yb] of [[-0.85, 1.55, -0.7, 5.72], [0.7, 1.55, 0.85, 5.72], [-0.7, 1.55, 0.7, 1.95], [-0.7, 5.25, 0.7, 5.72]]) w.quad([xa, ya, 0.48], [xb, ya, 0.48], [xb, yb, 0.48], [xa, yb, 0.48], W);
    w.quad([-0.85, 1.55, -0.3], [0.85, 1.55, -0.3], [0.85, 5.72, -0.3], [-0.85, 5.72, -0.3], G);
    w.tri([-0.12, 7.85, 0], [0.12, 7.85, 0], [0, 8.4, 0], L);
  }
  return w.geometry();
}
// a longcase clock's pendulum, of length 1 hanging from the origin, facing +z: a brass rod 0.08 m wide and a lens
// bob half a metre across at the clock's own length of 3.3 m (0.0758 of the length in radius). The rod runs on
// 0.075 of the length over the pivot (0.2475 m at 3.3 m), up into the clock's head.
function longPendGeometry(brass) {
  const w = mkW(), b = mulc(brass, 1.2, 0.8);
  w.quad([-0.012, -0.95, 0], [0.012, -0.95, 0], [0.012, 0.075, 0], [-0.012, 0.075, 0], brass);
  w.M = new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, -1, 0);
  w.lathe([[0.0758, 0], [0.052, 0.014], [0, 0.02]], 10, (i) => (i ? b : brass)); w.M = null;
  return w.geometry();
}
// a pendulum of length 1 hanging from the origin, facing +z: a rod and a lens bob (brass)
function pendulumGeometry(brass, steel) {
  const w = mkW();
  w.quad([-0.014, -0.9, 0], [0.014, -0.9, 0], [0.014, 0, 0], [-0.014, 0, 0], steel);
  w.M = new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, -1, 0);
  w.lathe([[0.13, 0], [0.095, 0.022], [0, 0.032]], 8, brass); w.M = null;
  return w.geometry();
}
// a balance wheel of radius 1 in its own xy plane (it turns about z): rim, two crossed arms, a hub
function balanceGeometry(brass) {
  const w = mkW();
  w.M = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  w.lathe([[1.0, 0], [0.82, 0], [0.82, 0.16], [1.0, 0.16], [1.0, 0]], 10, brass); w.lathe([[0.22, 0.2], [0, 0.2]], 6, brass); w.M = null;
  w.box(-0.85, -0.07, 0.02, 0.85, 0.07, 0.14, brass); w.box(-0.07, -0.85, 0.02, 0.07, 0.85, 0.14, brass);
  return w.geometry();
}
// ---------------------------------------------------------------------------------------------------------------
// A WALL OF CLOCKS: one flat bay of wall between iron members, hung close with wall clocks in ranks, storey by
// storey between iron rails (at 13 to 14 m and 27 to 28 m, the galleries' lines; a passage wall's own rails).
// Behind them a board of panelled wood (the tone table's board wood): a lighter field behind each clock, a darker
// batten under each rank.
// bay: M places it (local x across the wall, y up, z out of it), n its outward normal, x0..x1 the clear width,
// group the room it is drawn with (wm by the passage's mouth, wa north of the east arch, ws south of it), late: a
// bay on a pier's cheek, built after the others (its middle and far dials are drawn with the court's own),
// frame: the bay's width where it brings its own iron frame (two uprights, a foot rail, the rails, a head rail),
// boards: the storeys' fields [from, to], storeys: [from, to, programme] for the ranks, or prog and high for the
// standard storeys: 3.0 to 12.8 m, 14.3 to 26.7 m and, where high (by the east arch, where the eye passes at 27.5
// to 29 m), 28.3 to 40.5 m.
// THE RANKS are the plan's: a programme is [kind, how many across, dial radius] from the storey's foot up; the
// order of a storey's ranks is dealt by a generator of the plan's own (a large clock's rank keeps its place, the
// others change places), so that no two bays need read alike.
// Kinds: r a round clock in a turned case; R the same, a large one, set next the eye's height where the line
// passes (by the mouth, at 15 m, the first of the second storey; by the arch the last of the second and the first
// of the third); d a drop-dial clock: an eight-sided head over a glazed trunk (an opening on a dark glossy back)
// in which its pendulum swings. A dial is 1.10 to 2.19 m across as built (radius 0.55 to 1.10), its case 1.22 times
// that; a radius is cut to what the bay's width holds and takes up to 18 per cent off from the plan's generator,
// so every seed hangs the same clocks in the same places. The stream deals each case's tone (one of the four case
// woods; three round cases in ten are brass), and each pendulum's phase, period and reach.
// WEIGHT of each dial, dealt once by place, as every dial's is: near where the dial's centre is within 14 m of the
// flown line in plan, middle within 30 m, far beyond.
// Nothing stands more than 0.5 m proud of the wall: the board 0.06 m, a round case's lip 0.26 m at the most, a
// drop-dial's trunk 0.3 m, the largest near dial's domed glass 0.47 m.
// A FAR DIAL is the kit's one flat disc of sixteen sides with its corners at the dial's radius, and it carries its
// own bezel: it is set 0.01 m before the lip's inner edge, so that the whole disc shows before the case (a far
// case's lip has eight sides, and their middles come in to 0.92 of that radius). A NEAR OR MIDDLE DIAL is set
// 0.005 m before the lip's inner edge, so that its disc and its bezel lie whole before the case and nothing of
// the lip stands through them. Of the 148 near cases 79 are drop-dials, whose heads have eight sides with their
// corners at the dial's radius: those are corners of the bezel's sixteen sides too, so the lip stands inside the
// bezel all round. The other 69 are round cases of ten sides with their corners at the dial's radius: where a
// corner passes the bezel's sixteen sides it shows 0.005 m behind the bezel's foot, and behind it stands the
// case's own back (0.05 m before its foot, corner to corner of its side), which closes the case behind its dial.
// ---------------------------------------------------------------------------------------------------------------
const CLOCK_PROG = {
  wide: { low: [['d', 2, 0.95], ['r', 3, 0.68], ['d', 2, 0.90]], up: [['R', 2, 1.05], ['d', 2, 0.95], ['r', 3, 0.68], ['d', 2, 0.95]] },
  bay: { low: [['r', 1, 1.10], ['d', 2, 0.68], ['d', 1, 1.00]], up: [['R', 1, 1.10], ['d', 2, 0.68], ['r', 2, 0.68], ['d', 1, 1.05]] },
  narrow: { low: [['d', 1, 0.90], ['r', 1, 0.95], ['d', 1, 0.90]], up: [['R', 1, 0.96], ['d', 1, 0.90], ['r', 1, 0.80], ['d', 1, 0.95]] },
};
const clockHeight = (kind, r) => (kind === 'd' ? 3.668 : 2.44) * r;          // a drop-dial: head 1.22 r, then 0.9 x 1.22 r and a trunk 1.35 r
function clockBay(B, bay, plan, deal, order) {
  const c = B.col, w = B.w[bay.group], M = bay.M, n = bay.n, U = bay.x1 - bay.x0, G = [0.16, 0.16, 0.18, 0.95];
  const at = (x, y, z) => V3(x, y, z).applyMatrix4(M);
  const board = c.woodB, field = c.woodF, batten = mulc(c.woodB, 0.8), W = c.caseWoods;
  // the order of a storey's ranks: a large clock's rank keeps its place, the others change places as the generator
  // of orders deals (a shuffle of the places left)
  const mixed = (ranks) => {
    const out = [...ranks], free = out.map((q, i) => i).filter((i) => out[i][0] !== 'R');
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(order() * (i + 1)); [out[free[i]], out[free[j]]] = [out[free[j]], out[free[i]]]; }
    return out;
  };
  const P = CLOCK_PROG[bay.prog];
  const storeys = (bay.storeys || (bay.high ? [[3.0, 12.8, P.low], [14.3, 26.7, [...P.up].reverse()], [28.3, 40.5, P.up]] : [[3.0, 12.8, P.low], [14.3, 26.7, P.up]])).map(([ya, yb, ranks]) => [ya, yb, mixed(ranks)]);
  const boards = bay.boards || (bay.high ? [[bay.y0, 13.0], [14.0, 27.0], [28.0, bay.frame || bay.under ? 41.0 : 43.0]] : [[bay.y0, 13.0], [14.0, 27.0]]);
  w.M = M;
  if (bay.frame) {
    // the bay's own iron frame: two uprights, a foot rail, the rails between the storeys, a head rail
    const Wb = bay.frame, yTop = boards[boards.length - 1][1];
    for (const [xa, xb] of [[0, 0.15], [Wb - 0.15, Wb]]) w.box(xa, 2.0, 0, xb, yTop + 0.5, 0.2, c.iron, 'y-z-');
    w.box(0.15, 2.0, 0, Wb - 0.15, 2.5, 0.18, c.ironD, 'x-x+y-z-'); w.box(0.15, yTop, 0, Wb - 0.15, yTop + 0.5, 0.2, c.ironL, 'x-x+z-');
    for (let i = 0; i + 1 < boards.length; i++) w.box(0.15, boards[i][1], 0, Wb - 0.15, boards[i + 1][0], 0.22, c.iron, 'x-x+z-');
  }
  // the boards behind the clocks, one a storey
  // (each ends on the side of the iron it meets: a frame's uprights or a pier face's flanges; where bay.end is given
  // it tells the far end by height, for the passage's west wall where it runs on: below y 11 the side of the
  // pilaster that stands 0.05 m before the far flange, above it the far flange's own side. Under a gallery, where
  // the clocks stop short of the far flange, a board ends free on the pier's plate 0.08 m past the clear width.
  // A batten ends where its board does, or at the clear width's end if that comes first.)
  const e0 = bay.frame ? bay.x0 - 0.08 : bay.x0, endAt = (y) => (bay.end ? bay.end(y) : bay.frame || bay.under ? bay.x1 + 0.08 : bay.x1);
  for (const [ya, yb] of boards) w.quad([e0, ya, 0.06], [endAt(ya), ya, 0.06], [endAt(ya), yb, 0.06], [e0, yb, 0.06], board);
  w.M = null;
  for (const [ya, yb, ranks] of storeys) {
    // radii: the programme's, cut to the width, less the plan's 0..18 per cent; then all cut alike if the storey is short
    const rs = ranks.map(([kind, k, r]) => Math.min(r, ((U + 0.25) / k - 0.25) / 2.44) * (1 - 0.18 * plan()));
    const sum = rs.reduce((a, r, i) => a + clockHeight(ranks[i][0], r), 0), fit = Math.min(1, (yb - ya - 0.2 * ranks.length) / sum);
    const gap = (yb - ya - sum * fit) / ranks.length;
    let y = ya + gap / 2;
    for (let j = 0; j < ranks.length; j++) {
      const [kind, k] = ranks[j], r = rs[j] * fit, ro = 1.22 * r, h = clockHeight(kind, r), cy = y + h - ro, cell = U / k;
      // the batten under the rank
      const b1 = Math.min(bay.x1, endAt(y - gap / 2));
      w.M = M; w.quad([bay.x0, y - gap / 2 - 0.06, 0.1], [b1, y - gap / 2 - 0.06, 0.1], [b1, y - gap / 2 + 0.06, 0.1], [bay.x0, y - gap / 2 + 0.06, 0.1], batten); w.M = null;
      for (let i = 0; i < k; i++) {
        const cx = bay.x0 + (i + 0.5) * cell, t = deal();
        // the case's tone, one of five: a drop-dial's is one of the four woods, a round case's brass (three in ten) or a wood
        const tone = kind === 'd' ? W[t < 0.25 ? 0 : t < 0.45 ? 1 : t < 0.7 ? 2 : 3] : t < 0.3 ? c.brass : W[t < 0.5 ? 0 : t < 0.65 ? 1 : t < 0.85 ? 2 : 3];
        const lip = kind !== 'd' && t < 0.3 ? c.brassD : mulc(tone, 1.25), d = 0.10 + 0.1 * r / 1.1, pos = at(cx, cy, 0.04 + d);
        const dl = B.planDist(pos.x, pos.z), wgt = dl < 14 ? 'near' : dl < 30 ? 'middle' : 'far';
        // one clock of a wall of clocks: its field on the board, a drop-dial's trunk and pendulum, the turned case, the dial
        w.M = M;
        w.quad([cx - cell / 2 + 0.1, y - 0.04, 0.08], [cx + cell / 2 - 0.1, y - 0.04, 0.08], [cx + cell / 2 - 0.1, y + h + 0.04, 0.08], [cx - cell / 2 + 0.1, y + h + 0.04, 0.08], field);
        if (kind === 'd') {             // the trunk: two sides and a foot round an opening on a dark glossy back; the pendulum hangs in it
          const hi = 0.56 * r, hw = 0.66 * r, yT = cy - 0.9 * ro, yB = yT - 1.35 * r, zf = 0.3;
          w.quad([cx - hi, yB, 0.09], [cx + hi, yB, 0.09], [cx + hi, yT, 0.09], [cx - hi, yT, 0.09], G);
          w.box(cx - hw, yB + 0.1 * r, 0.06, cx - hi, yT, zf, tone, wgt === 'far' ? 'y+y-z-x+' : 'y+y-z-'); w.box(cx + hi, yB + 0.1 * r, 0.06, cx + hw, yT, zf, tone, wgt === 'far' ? 'y+y-z-x-' : 'y+y-z-');
          w.box(cx - hw, yB, 0.06, cx + hw, yB + 0.1 * r, zf, lip, wgt === 'far' ? 'z-x-x+' : 'z-');
          w.M = null;
          addPendulum(B, B.pendsW[bay.group], at(cx, cy - 0.84 * ro, 0.19), n, 0.95 * r, deal, 0.28);    // its rod runs up into the head (whose lowest corner, 0.13 m out from the board where the rod hangs, stands 0.85 ro under the centre or lower): the bob (radius 0.124 r) swings its centre at most 0.30 r each way, its edge to 0.43 r, in an opening 0.56 r each way, its foot 0.25 r over the trunk's
          (B.airItems ||= []).push({ cls: 'walls of clocks', cyl: [at(cx, (yT + yB) / 2, 0), n, 0.945 * r, zf] });
        }
        w.M = null;
        turned(w, at(cx, cy, 0.06), n, wgt === 'far' ? [[ro, 0], [r, d]] : [[ro, 0], [ro, 0.6 * d], [r, d]], kind === 'd' ? 8 : wgt === 'near' ? 10 : 8, (b) => (b ? lip : tone));
        if (kind !== 'd' && wgt === 'near') turned(w, at(cx, cy, 0.11), n, [[0, 0], [ro, 0]], 10, mulc(tone, 0.6));     // a ten-sided case's back, 0.05 m before its foot and 0.03 m before the field
        B.addDial(bay.late && wgt !== 'near' ? 'crt' : bay.group, wgt, at(cx, cy, (wgt === 'far' ? 0.07 : 0.065) + d), n, r, B.enamel, 'court wall clocks');     // (a late bay's middle and far dials are drawn with the court's own)
        (B.airItems ||= []).push({ cls: 'walls of clocks', cyl: [at(cx, cy, 0), n, ro, 0.065 + d + 0.19 * r] });
      }
      y += h + gap;
    }
  }
}
STEPS.push(async (B) => {
  const w = B.w.crt2, wp = B.w.paneCrt, c = B.col, R = CRT.R, rng = B.rng.fork('court');
  // THE LONGCASE RANKS: one every 2.6 m of wall (a case is 2.3 m wide at its hood), on the floor and on each gallery,
  // where the galleries stand
  // THE WOODS are four (the tone table's longcase woods: the seeded pair's darker and lighter wood, a honey wood and
  // a pale oak), dealt case by case from a generator of the plan's own (the same on every seed), each case 8 per
  // cent either way about its wood's tone.
  // THE WALL BEHIND is pale stone, panelled: a pilaster 0.7 m wide between the groups and at a rank's ends, from each
  // floor to the soffit over it, with a capital (its foot runs plain to the floor behind the cases' plinths, which
  // stand 0.01 m before it); over each group, above the hoods, a sunk panel with a
  // raised field.
  // A CASE'S PENDULUM hangs behind the door's opening (no pane is built). Its pivot stands at 5.49 m and its rod runs on over the
  // pivot, 0.2475 m, up into the hood: on a modelled case (208) through the moulding under the hood (5.5 to
  // 5.72 m, whose under side stands 0.01 m over the pivot), on a far one (52) through the hood's own floor, 0.23 m
  // over the pivot; a standing regulator (9, the far case at 1.2 times) has its floor 0.276 m over its pivot and
  // its rod 0.297 m. The rod's top stands 0.0175 m inside the hood at rest (a regulator's 0.021 m); at the
  // greatest swing dealt, 0.13, the middle of its top edge stands 0.0154 m inside and the edge's two corners
  // 0.0103 and 0.0205 m (a regulator's 0.0185 m; 0.0123 and 0.0247 m). The
  // swing is held to 0.13: the bob is ten-sided and turns with the rod, so at 0.13 its outermost corner stands
  // 3.3 sin 0.13 + 0.2501 cos 0.13 = 0.676 m from the case's middle, 0.024 m inside the waist's inner face
  // (0.70 m); the stream would deal up to 0.12 x 1.15 = 0.138.
  B.longNear = []; B.longFar = []; B.longTone = { near: [], far: [] }; B.pendsLong = [];
  const stepDeg = 2.6 / 62.9 / D2R, woods = c.longWoods.map((t) => new THREE.Color().setRGB(t[0], t[1], t[2])), pickWood = makeRng(4207);
  const stoneP = mulc(c.wall, 0.9), stoneF = mulc(c.wall, 1.06), stoneD = mulc(c.wall, 0.74);
  for (const [a0, a1] of GALLERY_ZONES) {
    const n = Math.floor((a1 - a0 - 2.2) / stepDeg), start = (a0 + a1) / 2 - n * stepDeg / 2, lv = [0, ...CRT.decks];
    for (let li = 0; li < 4; li++) for (let i = 0; i <= n; i++) {
      const y = lv[li], a = start + i * stepDeg, A = a * D2R, q = pol(62.9, a, y), facing = V3(-Math.cos(A), 0, -Math.sin(A));
      const near = B.planDist(q[0], q[2]) < 30;
      const m = B.dialMatrix(V3(q[0], q[1], q[2]), facing, 1);
      (near ? B.longNear : B.longFar).push(m);
      B.longTone[near ? 'near' : 'far'].push(woods[Math.floor(pickWood() * 4)].clone().multiplyScalar(0.92 + 0.16 * rng()));
      B.addDial('crt', near ? 'middle' : 'far', V3(q[0], y + 6.85, q[2]).addScaledVector(facing, near ? 0.66 : 0.64), facing, 0.8, B.enamel, 'longcase clocks');
      addPendulum(B, B.pendsLong, V3(q[0], y + 5.49, q[2]).addScaledVector(facing, 0.02), facing, 3.3, rng, 0.12, 0.13);
    }
    // pilasters and panels
    const ends = [];
    for (let i = 0; i <= n + 1; i++) if (i === 0 || i === n + 1 || i % 4 === 0) ends.push(start + (i - 0.5) * stepDeg);
    const dA = 0.35 / 64 / D2R;                                           // 0.35 m of wall, as degrees
    for (let li = 0; li < 4; li++) {
      const y = lv[li], top = li < 3 ? y + 13.3 : 51;
      for (let k = 0; k < ends.length; k++) {
        const e = ends[k];
        w.quad(pol(63.62, e - dA, y), pol(63.62, e + dA, y), pol(63.62, e + dA, top), pol(63.62, e - dA, top), stoneF);
        for (const sg of [-1, 1]) w.quad(pol(63.62, e + sg * dA, y), pol(64, e + sg * dA, y), pol(64, e + sg * dA, top), pol(63.62, e + sg * dA, top), stoneP);
        for (const [y0, y1, r] of [[top - 1.0, top - 0.25, 63.46]]) {
          w.quad(pol(r, e - dA * 1.35, y0), pol(r, e + dA * 1.35, y0), pol(r, e + dA * 1.35, y1), pol(r, e - dA * 1.35, y1), stoneF);
          for (const sg of [-1, 1]) w.quad(pol(r, e + sg * dA * 1.35, y0), pol(64, e + sg * dA * 1.35, y0), pol(64, e + sg * dA * 1.35, y1), pol(r, e + sg * dA * 1.35, y1), stoneP);
          w.quad(pol(r, e - dA * 1.35, y0 > y ? y0 : y1), pol(r, e + dA * 1.35, y0 > y ? y0 : y1), pol(64, e + dA * 1.35, y0 > y ? y0 : y1), pol(64, e - dA * 1.35, y0 > y ? y0 : y1), stoneD);
        }
        if (k + 1 < ends.length) {
          const p0 = e + dA * 2.6, p1 = ends[k + 1] - dA * 2.6, y0 = y + 9.0, y1 = top - 1.5;
          w.quad(pol(63.97, p0, y0), pol(63.97, p1, y0), pol(63.97, p1, y1), pol(63.97, p0, y1), stoneD);
          w.quad(pol(63.9, p0 + dA, y0 + 0.4), pol(63.9, p1 - dA, y0 + 0.4), pol(63.9, p1 - dA, y1 - 0.4), pol(63.9, p0 + dA, y1 - 0.4), stoneF);
        }
      }
    }
    await B.ctx.yield();
  }
  // the wall's returns beside the east arch and west of the passage's mouth: the same stone, a pilaster at each end
  // and a sunk panel with a raised field in each storey
  { const dA = 0.35 / 64 / D2R, lv = [0, ...CRT.decks];
    for (const [r0, r1] of [[33.3, 45.4], [314.6, 326.7], [129.4, 133.4]]) for (let li = 0; li < 4; li++) {
      const y = lv[li], top = li < 3 ? y + 14 : 51;
      for (const e of [r0, r1]) {
        w.quad(pol(63.62, e - dA, y), pol(63.62, e + dA, y), pol(63.62, e + dA, top), pol(63.62, e - dA, top), stoneF);
        for (const sg of [-1, 1]) w.quad(pol(63.62, e + sg * dA, y), pol(64, e + sg * dA, y), pol(64, e + sg * dA, top), pol(63.62, e + sg * dA, top), stoneP);
        w.quad(pol(63.46, e - dA * 1.35, top - 1.0), pol(63.46, e + dA * 1.35, top - 1.0), pol(63.46, e + dA * 1.35, top - 0.25), pol(63.46, e - dA * 1.35, top - 0.25), stoneF);
        w.quad(pol(63.46, e - dA * 1.35, top - 1.0), pol(63.46, e + dA * 1.35, top - 1.0), pol(64, e + dA * 1.35, top - 1.0), pol(64, e - dA * 1.35, top - 1.0), stoneD);
      }
      const p0 = r0 + dA * 2.6, p1 = r1 - dA * 2.6, y0 = y + 2.2, y1 = top - 1.8;
      if (li < (r0 === 129.4 ? 2 : 3)) continue;                          // a wall of clocks stands on the lower storeys
      w.quad(pol(63.97, p0, y0), pol(63.97, p1, y0), pol(63.97, p1, y1), pol(63.97, p0, y1), stoneD);
      w.quad(pol(63.9, p0 + dA, y0 + 0.4), pol(63.9, p1 - dA, y0 + 0.4), pol(63.9, p1 - dA, y1 - 0.4), pol(63.9, p0 + dA, y1 - 0.4), stoneF);
    }
    // THE WALLS OF CLOCKS on that plaster: the return is divided into flat bays (three beside the east arch on
    // either side, one west of the passage's mouth), each on a chord of the wall (at most 0.04 m before it)
    for (const [r0, r1, nb, group] of [[33.3, 45.4, 3, 'ws'], [314.6, 326.7, 3, 'wa'], [129.4, 133.4, 1, 'wm']]) {
      const p0 = r0 + dA * 2.6, p1 = r1 - dA * 2.6;
      for (let k = 0; k < nb; k++) {
        const b0 = p0 + (p1 - p0) * k / nb, b1 = p0 + (p1 - p0) * (k + 1) / nb, Am = (b0 + b1) / 2 * D2R;
        let P0 = V3(...pol(63.99, b0, 0)), P1 = V3(...pol(63.99, b1, 0));
        const nIn = V3(-Math.cos(Am), 0, -Math.sin(Am));
        if (new THREE.Vector3().subVectors(P1, P0).cross(V3(0, 1, 0)).dot(nIn) < 0) [P0, P1] = [P1, P0];
        const ax = new THREE.Vector3().subVectors(P1, P0), Wb = ax.length(); ax.normalize();
        const nz = new THREE.Vector3().crossVectors(ax, V3(0, 1, 0)).normalize();
        (B.clockBays ||= []).push({ M: new THREE.Matrix4().makeBasis(ax, V3(0, 1, 0), nz).setPosition(P0), n: nz, x0: 0.23, x1: Wb - 0.23, frame: Wb, prog: nb === 1 ? 'narrow' : 'bay', high: nb > 1, group, y0: 2.5 });
      }
    }
    // every wall of clocks: the plan's own generators lay the ranks (their radii from one, their order in each
    // storey from another: the same on every seed), a fork of the court's stream, taken after its last draw, deals
    // woods, brass and what swings
    // (the two cheeks' walls by the blind arches come after all the others, from a generator and a fork of their
    // own: the fork is taken off the walls' stream after its last draw, so no other wall's deal moves)
    { const plan = makeRng(4203), deal = rng.fork('clockwalls'), order = makeRng(4206);
      for (const bay of B.clockBays || []) if (!bay.late) { clockBay(B, bay, plan, deal, order); await B.ctx.yield(); }
      const planL = makeRng(4205), dealL = deal.fork('cheeks');
      for (const bay of B.clockBays || []) if (bay.late) { clockBay(B, bay, planL, dealL, order); await B.ctx.yield(); } } }
  // the drum: a sill at y 51, glass with a mullion every 1/96 of the round, a ring beam at y 58.
  // THE RING BEAM AT THE EAST ARCH. A run of a beam whose middle lies inside the arch is left out. Where such a run
  // of the ring beam has one end clear of the arch (the two runs that would begin at 22.5 degrees either side of
  // the arch's axis; the arch's round passes y 58 at 20.1 degrees), the beam is carried on from that end along the
  // run's own line, in its own section (0.7 m by 1.0 m) and paint, as far as THE ARCH'S LINE AS IT IS BUILT, the
  // straight runs of the soffit's inner edge (archZ): its under side ends on that line at z 22.45, its top at
  // z 21.26, and its two cheeks are cut to the corner of that line between them (y 58.05, z 21.85). So nothing of
  // it stands inside the arch's opening as that is built. By the arch's true round (radius 34), which the built
  // line touches at its corners only, the end's two corners at y 58.05 stand on the round and its other four
  // 0.024 to 0.026 m inside it. The end stands in the arch's brow but for 0.048 square metres of its section
  // (1.16) north of the arch and 0.044 south of it, which stand bare beside the brow, in the brow's own paint.
  // It closes the level strip between the
  // dome's foot (24 sides) and the drum's top (96 sides), up to 0.55 m wide, as the beam does all round. Ten
  // triangles either side of the arch.
  const archZ = (y) => { const k = Math.floor(Math.asin((y - CRT.archSpring) / CRT.archHalf) / (Math.PI / 36)), ya = CRT.archSpring + CRT.archHalf * Math.sin(Math.PI * k / 36), yb = CRT.archSpring + CRT.archHalf * Math.sin(Math.PI * (k + 1) / 36);
    return CRT.archHalf * (Math.cos(Math.PI * k / 36) + (Math.cos(Math.PI * (k + 1) / 36) - Math.cos(Math.PI * k / 36)) * (y - ya) / (yb - ya)); };
  for (let i = 0; i < 96; i++) {
    const p0 = -180 + i * 3.75, p1 = p0 + 3.75, u0 = i * 4.1887902, u1 = u0 + 4.1887902;
    wp.pane(pol(R, p0, 51), pol(R, p1, 51), pol(R, p1, 58), pol(R, p0, 58), [u0, 0], [u1, 0], [u1, 7], [u0, 7], [4.1887902, 0.22, 1000, 0], 0, c.iron);
    for (const [y, d] of [[51, 0.7], [58, 1.0]]) {
      const m = pol(R - 0.3, p0 + 1.875, y);
      if (!inArch(m[0], m[1] - 0.6, m[2])) { w.bar([pol(R - 0.3, p0, y), pol(R - 0.3, p1, y)], [[0, 1, 0], [0, 1, 0]], d, 0.7, c.ironL); continue; }
      if (y === 58) for (const [e, f] of [[p0, p1], [p1, p0]]) {
        const A = pol(R - 0.3, e, y); if (inArch(A[0], y - d / 2, A[2])) continue;                // (this end stands in the arch)
        const Bq = pol(R - 0.3, f, y), l = Math.hypot(Bq[0] - A[0], Bq[2] - A[2]), tx = (Bq[0] - A[0]) / l, tz = (Bq[2] - A[2]) / l, sg = Math.sign(A[2]);
        const pt = (b, yy, on) => { const x0 = A[0] - tz * b * 0.35, z0 = A[2] + tx * b * 0.35, la = on ? (sg * archZ(yy) - z0) / tz : 0; return [x0 + tx * la, yy, z0 + tz * la]; };   // a point of the cheek b at height yy: at the run's end, or on the arch's line
        const ys = [y - d / 2]; for (let k = 1; k < 18; k++) { const yc = CRT.archSpring + CRT.archHalf * Math.sin(Math.PI * k / 36); if (yc > y - d / 2 + 1e-6 && yc < y + d / 2 - 1e-6) ys.push(yc); } ys.push(y + d / 2);
        const fan = (ps, nx, ny, nz) => { for (let k = 1; k + 1 < ps.length; k++) { const a = ps[0], b = ps[k], q = ps[k + 1];                                               // a flat face as a fan, wound to look along (nx, ny, nz)
          const flip = ((b[1] - a[1]) * (q[2] - a[2]) - (b[2] - a[2]) * (q[1] - a[1])) * nx + ((b[2] - a[2]) * (q[0] - a[0]) - (b[0] - a[0]) * (q[2] - a[2])) * ny + ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])) * nz < 0;
          w.tri(a, flip ? q : b, flip ? b : q, c.ironL); } };
        for (const yy of [ys[0], ys[ys.length - 1]]) fan([pt(-1, yy, 0), pt(1, yy, 0), pt(1, yy, 1), pt(-1, yy, 1)], 0, yy - y, 0);
        for (const b of [-1, 1]) fan([pt(b, ys[0], 0), pt(b, ys[ys.length - 1], 0), ...ys.slice().reverse().map((yy) => pt(b, yy, 1))], -tz * b, 0, tx * b);
      }
    }
  }
  // the dome: 24 ribs on the meridians, rings every 6 m of meridian from the lantern, glass between
  const DR = CRT.domeR, merTop = DOME_MER[1], merBot = DOME_MER[0];
  const domeUp = (mer, deg) => { const th = mer / DR; return [Math.sin(th) * Math.cos(deg * D2R), Math.cos(th), Math.sin(th) * Math.sin(deg * D2R)]; };
  for (let k = 0; k < 24; k++) {
    const deg = -180 + k * 15;
    for (const [dr, depth, width, col] of [[-0.75, 1.5, 0.34, c.iron], [-1.5, 0.16, 0.7, c.ironL]]) {
      const pts = [], ups = [];
      for (let i = 0; i <= 14; i++) { const mer = merBot + (merTop - merBot) * i / 14, p = domePt(mer, deg, dr); if (inArch(p[0], p[1] - 1.5, p[2])) continue; pts.push(p); ups.push(domeUp(mer, deg)); }
      if (pts.length > 1) w.bar(pts, ups, depth, width, col);
    }
    if ((k & 3) === 3) await B.ctx.yield();
  }
  for (let j = 1; j <= 13; j++) {
    const mer = 6 * j;
    for (let i = 0; i < 48; i++) {
      const p0 = domePt(mer, i * 7.5, -0.2), p1 = domePt(mer, (i + 1) * 7.5, -0.2), u = domeUp(mer, i * 7.5 + 3.75);
      if (inArch((p0[0] + p1[0]) / 2, p0[1] - 0.6, (p0[2] + p1[2]) / 2)) continue;
      w.bar([p0, p1], [u, u], 0.4, 0.3, j === 1 ? c.ironL : c.iron);
    }
    if ((j & 3) === 3) await B.ctx.yield();
  }
  await B.ctx.yield();
  for (let k = 0; k < 24; k++) for (let j = 0; j < 12; j++) {
    const d0 = -180 + k * 15, d1 = d0 + 15, m0 = merBot + (merTop - merBot) * j / 12, m1 = merBot + (merTop - merBot) * (j + 1) / 12;
    wp.pane(domePt(m0, d0), domePt(m0, d1), domePt(m1, d1), domePt(m1, d0), [0, m0], [1, m0], [1, m1], [0, m1], [1000, 0, 1000, 0], 0, c.iron);
  }
  // the lantern: a ring beam at radius 6, a glazed drum of its own, an iron cap; the bearing's beam crosses it at y 98
  for (let i = 0; i < 24; i++) {
    const p0 = i * 15, p1 = p0 + 15;
    wp.pane(pol(6, p0, 96), pol(6, p1, 96), pol(6, p1, 101), pol(6, p0, 101), [i * 1.5708, 0], [i * 1.5708 + 1.5708, 0], [i * 1.5708 + 1.5708, 5], [i * 1.5708, 5], [1.5708, 0.07, 1000, 0], 0, c.iron);
  }
  w.lathe([[6.3, 95.6], [6.3, 96.3], [5.7, 96.3], [5.7, 95.6], [6.3, 95.6]], 24, c.ironL);
  w.lathe([[6.4, 101], [6.4, 101.5], [3.2, 103.4], [0.5, 104.2], [0, 106]], 24, (i) => [c.ironL, c.iron, c.iron, c.brass][i]);
  w.box(-6, 97.6, -0.5, 6, 98.4, 0.5, c.iron); w.box(-0.9, 97.3, -0.9, 0.9, 98.7, 0.9, c.ironL);
  await B.ctx.yield();
});
// columns, balusters, longcase cases, small pendulums and balances as instanced meshes
LAST.push(async (B) => {
  const c = B.col;
  let w = mkW();
  w.lathe([[0.66, 0], [0.66, 0.5], [0.5, 0.62], [0.42, 0.95], [0.34, 1.15], [0.30, 11.8], [0.37, 11.95], [0.33, 12.15], [0.56, 12.85], [0.64, 12.95], [0.64, 13.3]], 10,
    (i) => [c.ironD, c.iron, c.ironL, c.iron, c.iron, c.ironL, c.iron, c.ironL, c.iron, c.ironD][i]);
  for (const s of [-1, 1]) {      // a curved bracket either way along the gallery's edge, and one back toward the wall
    const pts = [], ups = [];
    for (let i = 0; i <= 4; i++) { const t = i / 4 * Math.PI / 2; pts.push([-0.1, 13.1 - 2.3 * Math.cos(t), s * (0.3 + 2.3 * Math.sin(t))]); ups.push([0, Math.sin(t), -s * Math.cos(t)]); }
    w.bar(pts, ups, 0.22, 0.2, c.ironL);
  }
  B.instanced(w.geometry(), B.mat.solid, B.columns);
  w = mkW();
  w.lathe([[0.12, 0], [0.12, 0.1], [0.06, 0.2], [0.17, 0.56], [0.065, 1.08], [0.11, 1.42]], 5, (i) => [c.ironL, c.iron, c.iron, c.ironL, c.iron][i]);
  B.instanced(w.geometry(), B.mat.solid, B.balusters);
  await B.ctx.yield();
  for (const [list, near, key] of [[B.longNear, true, 'near'], [B.longFar, false, 'far']]) {
    if (!list.length) continue;
    const im = B.instanced(longcaseGeometry(near), B.mat.solid, list);
    B.longTone[key].forEach((col, i) => im.setColorAt(i, col)); im.instanceColor.needsUpdate = true;
  }
  const sw = (list) => ({ aSw: { data: list.flatMap((p) => p.sw), size: 3 } });
  const pendGeo = pendulumGeometry(c.brass, c.steel);
  for (const list of [B.pends, B.pendsW.wm, B.pendsW.wa, B.pendsW.ws]) if (list.length) B.instanced(pendGeo, B.mat.pend, list.map((p) => p.m), sw(list));
  B.instanced(longPendGeometry(c.brass), B.mat.pend, B.pendsLong.map((p) => p.m), sw(B.pendsLong));
  if (B.balances.length) B.instanced(balanceGeometry(c.brass), B.mat.pend, B.balances.map((p) => p.m), sw(B.balances));
  B.moving['small pendulums'] = B.pends.length + B.pendsLong.length + B.pendsW.wm.length + B.pendsW.wa.length + B.pendsW.ws.length; B.moving.balances = B.balances.length;
  await B.ctx.yield();
});

// ---------------------------------------------------------------------------------------------------------------
// THE GREAT SHED: side walls with piers, dado, glazing and the tower dials; the roof's ribs, purlins and glass; the
// two gables (the east one round the great dial is fan work and glass over an iron dado).
// ---------------------------------------------------------------------------------------------------------------
// THE EAST GABLE'S FAN WORK round the great dial (centre y 44, radius 38), under the roof's half round (radius 56
// about y 40) and above the dado (y 6), in two orders and a band (FAN, by the panes' shader):
//   the first order: 24 radial bars 0.30 m wide, carrying on the 24 bars of the dial's own web, and rings 0.30 m
//   wide at every 6 m of radius;
//   the second order: 96 radial bars and a ring at every 2 m of radius, all 0.07 m wide (every fourth bar and every
//   third ring is hidden by one of the first order: 72 bars and two rings in three show);
//   the lattice band from the dial's rim to the first ring (radius 38 to 42): two sets of diagonals 0.14 m wide,
//   144 diamonds in the round and five half diamonds in the band's height (a diamond 1.75 m wide on the band's mid
//   line and 1.6 m high). Its two sets cover 0.223 of the band.
// uTptGable, the share of sunlight that passes the gable outside the dial's circle, is COUNTED from that plan: the
// glass's 0.92 times the open share (1 - (24 x 0.30 + 72 x 0.07) / (2 pi r)) x (1 - rings) x (1 - 0.223 in the band)
// summed over a 0.25 m grid of the gable outside the dial's circle (rings and band: their share of the cell's 0.25 m
// of radius). The south half alone is counted: the north half is its mirror and has the same mean. It comes to 0.777.
function gableOpenShare() {
  const F = (y, T, h) => { const k = Math.floor(y / T); return k * 2 * h + Math.min(y - k * T, 2 * h); };
  const lines = (x, T, h, w) => (F(x + 0.5 * w + h, T, h) - F(x - 0.5 * w + h, T, h)) / w;      // the shader's tptLines
  let sum = 0, n = 0;
  for (let z = 0.125; z < 56; z += 0.25) for (let y = 6.125; y < 96; y += 0.25) {
    if (z * z + (y - SHD.cy) * (y - SHD.cy) > SHD.r * SHD.r) continue;
    const r = Math.hypot(z, y - 44); if (r < GREAT.R) continue;
    const bars = Math.min(1, (FAN.bars * 2 * FAN.barH + (FAN.bars2 - FAN.bars) * 2 * FAN.h2) / (TAU * r));
    const ring = Math.min(1, lines(r, FAN.ringT, FAN.ringH, 0.25) + lines(r, FAN.ringT2, FAN.h2, 0.25) - lines(r, FAN.ringT, FAN.h2, 0.25));
    const band = Math.max(0, Math.min(r + 0.125, FAN.bandR + FAN.bandH) - Math.max(r - 0.125, FAN.bandR - FAN.bandH)) / 0.25;
    sum += (1 - bars) * (1 - ring) * (1 - band * FAN.latCover); n++;
  }
  return GLASS_PASS * sum / n;
}
STEPS.push(async (B) => {
  const w = B.w.shd, wE = B.w.shdE, wp = B.w.paneShd, c = B.col, S = SHD, T = SHED_PURLIN_T;
  B.hero.lightUniforms.uTptGable.value = gableOpenShare();
  await B.ctx.yield();
  const roofPt = (deg, r, x) => [x, S.cy + r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];      // deg from the crown toward south
  const roofUp = (deg) => [0, Math.cos(deg * D2R), Math.sin(deg * D2R)];
  // side walls, fourteen bays a side
  for (const s of [-1, 1]) {
    const zw = s * S.z, Z = (t) => zw - s * t, face = V3(0, 0, -s);
    const bz = (ww, x0, y0, t0, x1, y1, t1, col, skip) => ww.box(x0, y0, Math.min(Z(t0), Z(t1)), x1, y1, Math.max(Z(t0), Z(t1)), col, skip);
    for (let k = 0; k < 14; k++) {
      const x0 = S.x0 + 16 * k, x1 = x0 + 16, xc = x0 + 8, ww = k < 7 ? w : wE;
      bz(ww, x0, 0, 0, x0 + 1.6, 40, 1.3, c.iron, 'y-'); bz(ww, x0 - 0.15, 0, 0, x0 + 1.75, 2.2, 1.5, c.ironD, 'y-'); bz(ww, x0 + 0.5, 2.6, 1.3, x0 + 1.1, 37, 1.42, c.ironL);
      bz(ww, x0 - 0.2, 36.6, 0, x0 + 1.8, 38, 1.7, c.ironL);
      ww.quad([x0 + 1.6, 0, Z(0.2)], [x1, 0, Z(0.2)], [x1, 7, Z(0.2)], [x0 + 1.6, 7, Z(0.2)], c.ironD);
      for (let j = 0; j < 4; j++) bz(ww, x0 + 2.2 + j * 3.45, 1.0, 0.2, x0 + 5.0 + j * 3.45, 6.0, 0.36, c.iron, 'y-');
      bz(ww, x0 + 1.6, 6.6, 0, x1, 7.2, 0.7, c.ironL);
      wp.pane([x0 + 1.6, 7.2, zw], [x1, 7.2, zw], [x1, 38, zw], [x0 + 1.6, 38, zw], [1.6, 0], [16, 0], [16, 30.8], [1.6, 30.8], [1.2, 0.05, 7.7, 0.05], 0, c.iron);
      bz(ww, x0, 38, 0, x1, 40, 1.0, c.iron); bz(ww, x0, 38.4, 1.0, x1, 39.6, 1.1, c.ironL);
      // the tower dial, 9 m across, centre y 23, on an iron roundel
      const cp = V3(xc, 23, Z(0.3));
      turned(ww, cp, face, [[0, 0.05], [5.5, 0.05], [5.5, 0.6], [4.95, 0.85], [4.5, 0.62]], 32, (i) => [c.ironD, c.iron, c.ironL, c.brass][i]);
      ww.bar([[xc - 5.4, 23, Z(0.25)], [x0 + 1.6, 23, Z(0.25)]], [[0, 1, 0], [0, 1, 0]], 0.5, 0.3, c.iron); ww.bar([[xc + 5.4, 23, Z(0.25)], [Math.min(x1, S.gableX - 0.4), 23, Z(0.25)]], [[0, 1, 0], [0, 1, 0]], 0.5, 0.3, c.iron);   // the last bay's tie ends inside the end pier
      ww.bar([[xc, 28.4, Z(0.25)], [xc, 38, Z(0.25)]], [[1, 0, 0], [1, 0, 0]], 0.5, 0.3, c.iron); ww.bar([[xc, 7.2, Z(0.25)], [xc, 17.6, Z(0.25)]], [[1, 0, 0], [1, 0, 0]], 0.5, 0.3, c.iron);
      B.addDial(k < 7 ? 'shd' : 'shdE', 'middle', cp.clone().addScaledVector(face, 0.62), face, 4.5, B.enamel, 'tower dials');
      if (k % 5 === 4) await B.ctx.yield();
    }
    bz(wE, S.gableX - 1.2, 0, 0, S.gableX + 0.4, 40, 1.3, c.iron, 'y-');
    await B.ctx.yield();
  }
  // the roof: ribs every 16 m (two chords 1.9 m apart with a lattice web drawn between them), 25 purlins 0.5 m
  // square, glass in bars 0.07 m wide that run up the slope, one a metre. The glass lies flat between the 25
  // stations of the round (24 flats). AT THE EAST GABLE the purlins and the last bay's glass run on to the plane
  // of the gable's fan work (gx, 0.05 m east of the dial's own plane), and the fan work's outline is laid on those
  // flats, corner for corner (reach and roofCorners, below): the roof ends on the gable and the gable on the roof.
  // Between the corners the two outlines agree to 0.000005 m in the stored numbers.
  const gx = S.gableX + 0.05;
  const lattices = [];              // the ribs' lattice webs, written into the pane buffer after all the shed's glass (below)
  for (let k = 0; k <= 14; k++) {
    const x = Math.min(S.x0 + 16 * k, S.gableX - 0.6), ww = k < 7 ? w : wE;
    for (const r of [S.r - 0.15, S.r - 2.05]) {
      const pts = [], ups = [];
      for (let i = 0; i <= 24; i++) { const d = -90 + 7.5 * i; pts.push(roofPt(d, r, x)); ups.push(roofUp(d)); }
      ww.bar(pts, ups, 0.3, 0.5, c.ironL);
    }
    if (k % 3 === 2) await B.ctx.yield();
    for (let i = 0; i < 24; i++) {
      const d0 = -90 + 7.5 * i, d1 = d0 + 7.5, ri = S.r - 1.9, ro = S.r - 0.3, a0 = d0 * D2R * (S.r - 1.1), a1 = d1 * D2R * (S.r - 1.1);
      lattices.push([roofPt(d0, ri, x), roofPt(d1, ri, x), roofPt(d1, ro, x), roofPt(d0, ro, x), [a0, 0], [a1, 0], [a1, 1.6], [a0, 1.6], [1.2, 0.07, 0, 0], 1, c.iron]);
    }
  }
  for (let j = -12; j <= 12; j++) {
    const d = j * 7.5, u = roofUp(d);
    w.bar([roofPt(d, S.r - 0.3, S.x0), roofPt(d, S.r - 0.3, 170)], [u, u], 0.5, 0.5, c.iron); wE.bar([roofPt(d, S.r - 0.3, 170), roofPt(d, S.r - 0.3, gx)], [u, u], 0.5, 0.5, c.iron);
  }
  await B.ctx.yield();
  for (let k = 0; k < 14; k++) for (let i = 0; i < 24; i++) {
    const x0 = S.x0 + 16 * k, x1 = Math.min(x0 + 16, gx), d0 = -90 + 7.5 * i, d1 = d0 + 7.5, v0 = d0 * D2R * S.r + 100.125 * T, v1 = d1 * D2R * S.r + 100.125 * T;
    wp.pane(roofPt(d0, S.r, x0), roofPt(d0, S.r, x1), roofPt(d1, S.r, x1), roofPt(d1, S.r, x0), [x0 + 1601, v0], [x1 + 1601, v0], [x1 + 1601, v1], [x0 + 1601, v1], [1.0, 0.035, 1000, 0], 0, c.iron);
  }
  // the west gable (x 58): glass in bars from the court's outline up to the roof. The outline in the gable's plane:
  // THE DOME AS IT IS BUILT (domeCut58: the straight runs in which its flat panes pass the plane), out to z 25.78
  // either way, where its foot comes down to the drum's top; the drum's top (y 58) from there to where the court's
  // round wall passes the plane (z 27.055); from there to the arch's jambs (z 34) the arch's soffit (the pane
  // shader draws no glass inside the arch's true round, and the soffit's outer edge is built on and over that
  // round: see the east arch's reveal); beyond the jambs the floor, as far as the side walls' first piers (1.3 m deep,
  // from z 54.7), and over those piers their top (y 40). A pane ends at each corner of the dome's line and at each
  // of those places, so that the glass's foot lies on what is built and none runs from one stretch into the next.
  const zJ = Math.sqrt(CRT.R * CRT.R - 58 * 58), zP = S.z - 1.3, cut = domeCut58(), zC = cut[cut.length - 1][0];
  const domeLo = (z) => { if (z <= cut[0][0] || z >= zC) return CRT.drumY; let i = 0; while (cut[i + 1][0] < z) i++; return cut[i][1] + (cut[i + 1][1] - cut[i][1]) * (z - cut[i][0]) / (cut[i + 1][0] - cut[i][0]); };
  let gz = [];
  for (let i = 0; i <= 28; i++) gz.push(-56 + 4 * i);
  gz.push(-zP, -CRT.archHalf, -zJ, zJ, CRT.archHalf, zP, ...cut.map((q) => q[0])); gz.sort((p, q) => p - q);
  gz = gz.filter((z, i) => i === 0 || z - gz[i - 1] > 1e-6);
  for (let i = 0; i < gz.length - 1; i++) {
    const z0 = gz[i], z1 = gz[i + 1], zm = Math.abs(z0 + z1) / 2;
    const lo = (z) => zm < zJ ? domeLo(z) : (zm < CRT.archHalf ? archY(z) : (zm < zP ? 0 : S.cy));
    const hi = (z) => S.cy + Math.sqrt(Math.max(0, S.r * S.r - z * z));
    wp.pane([58, lo(z0), z0], [58, lo(z1), z1], [58, hi(z1), z1], [58, hi(z0), z0], [z0 + 56, lo(z0)], [z1 + 56, lo(z1)], [z1 + 56, hi(z1)], [z0 + 56, hi(z0)], [1.0, 0.05, 8, 0.05], 0, c.iron);
  }
  // the east gable: the dado, then fan work and glass from the great dial's rim to the roof
  wE.box(S.gableX - 0.1, 0, -S.z, S.gableX + 0.5, 6, S.z, c.ironD, 'y-');
  for (let j = 0; j < 14; j++) wE.box(S.gableX - 0.3, 0.9, -55 + j * 8, S.gableX - 0.1, 5.2, -49 + j * 8, c.iron, 'x+');
  wE.box(S.gableX - 0.5, 5.6, -S.z, S.gableX, 6.2, S.z, c.ironL);
  const ri = 37.2;
  // reach(t): from the dial's centre along t (from twelve toward south), the first of THE ROOF AS IT IS BUILT (the
  // nearest of its 24 flats; a flat's line stands S.r cos 3.75 degrees from the roof's centre, 4 m under the
  // dial's), under the springing (y 40) the roof's whole round, and the dado's top
  const reach = (t) => {
    const dy = Math.cos(t), dz = Math.sin(t), b = dy * 4, cc = 16 - S.r * S.r, far = -b + Math.sqrt(b * b - cc);
    let flat = Infinity;
    for (let i = 0; i < 24; i++) { const m = (-86.25 + 7.5 * i) * D2R, den = dy * Math.cos(m) + dz * Math.sin(m); if (den > 1e-9) flat = Math.min(flat, (S.r * Math.cos(3.75 * D2R) - 4 * Math.cos(m)) / den); }
    if (44 + flat * dy >= S.cy) return flat;
    return dy < 0 ? Math.min(far, (6 - 44) / dy) : far;
  };
  // the roof's 25 corners, by their bearing from the dial's centre and their distance from it
  const roofCorners = [];
  for (let j = -12; j <= 12; j++) { const q = roofPt(j * 7.5, S.r, gx); roofCorners.push([(Math.atan2(q[2], q[1] - 44) + TAU) % TAU, Math.hypot(q[2], q[1] - 44)]); }
  const gP = (t, r) => [gx, 44 + r * Math.cos(t), r * Math.sin(t)], gU = (t, r) => [r * Math.sin(t), r * Math.cos(t)];
  for (let i = 0; i < 96; i++) {
    const t0 = i / 96 * TAU, t1 = (i + 1) / 96 * TAU;
    // a pane of the fan work: over the springing its outer edge is one straight run between two points of the
    // roof as built, and on one flat it lies on that flat (under the springing the edge runs on the line of the
    // roof's whole round, where no roof is built, and on the dado's top: reach, above). Where a corner of the roof stands between the pane's two sides the pane is
    // written in two, parted along the bearing of that corner, so that the edge turns where the roof turns (24 of
    // the 25 corners: the crown's is a side of two panes).
    const r0 = reach(t0), r1 = reach(t1);
    if (r0 <= ri && r1 <= ri) continue;
    const st = [[t0, r0], ...roofCorners.filter(([tc]) => tc > t0 + 1e-9 && tc < t1 - 1e-9), [t1, r1]];
    for (let k = 0; k + 1 < st.length; k++) {
      const [ta, ra] = st[k], [tb, rb] = st[k + 1];
      wp.pane(gP(ta, ri), gP(tb, ri), gP(tb, Math.max(ri, rb)), gP(ta, Math.max(ri, ra)), gU(ta, ri), gU(tb, ri), gU(tb, Math.max(ri, rb)), gU(ta, Math.max(ri, ra)), [FAN.bars, FAN.barH, FAN.ringT, FAN.ringH], 3, c.iron);
    }
  }
  // THE GABLE'S TWO CORNERS UNDER THE SPRINGING. Below y 40 the roof's round, which bounds the fan work, curves
  // inward: between it, the dado's top (y 6) and the end piers (their faces at z 54.7 either way) the gable is
  // plain glass in upright iron bars of the fan work's own width (0.30 m), one against the pier and one every
  // 2.2 m from it. A pane runs from each outer edge of the fan work level out to the pier, as high as that edge;
  // where the round passes the pier's face (y 28) the last pane ends on it. Written after the fan work and before
  // the ribs' lattice webs (the order of drawing, below).
  for (let i = 0; i < 96; i++) {
    let a = gP(i / 96 * TAU, Math.max(ri, reach(i / 96 * TAU))), b = gP((i + 1) / 96 * TAU, Math.max(ri, reach((i + 1) / 96 * TAU)));
    const sg = a[2] + b[2] < 0 ? -1 : 1, zp = S.z - 1.3, out = (q) => zp - sg * q[2];        // out: metres from the pier's face
    if (Math.max(a[1], b[1]) < 6.001 || Math.min(a[1], b[1]) > S.cy || (out(a) <= 1e-6 && out(b) <= 1e-6)) continue;
    const cutAt = (p, q) => { const f = out(p) / (out(p) - out(q)); return [gx, p[1] + f * (q[1] - p[1]), sg * zp]; };
    if (out(a) < 0) a = cutAt(a, b); else if (out(b) < 0) b = cutAt(b, a);
    wp.pane(a, b, [gx, b[1], sg * zp], [gx, a[1], sg * zp], [out(a), a[1]], [out(b), b[1]], [0, b[1]], [0, a[1]], [2.2, 0.15, 1000, 0], 0, c.iron);
  }
  await B.ctx.yield();
  // THE RIBS' LATTICE WEBS, AND THE ORDER OF DRAWING. A pane buffer is drawn in the order it is written, without depth writing. A rib's lattice
  // hangs before the roof's glass and, seen from inside the shed, before the east gable's glass: it is written
  // after all the shed's glass, so that it is drawn over it and neither the glass's sheen nor its rain is blended
  // over the lattice's iron. Seen from the court, through the west gable's glass (x 58), the lattices stand BEHIND
  // that glass, and being written after it they are drawn over it all the same: there the gable's glass lays
  // neither its sheen, its rain nor its own glazing bars over a lattice, and a lattice's bar shows whole where a
  // bar of the gable crosses before it (both are iron of one paint). The first rib's lattice stands in the gable's
  // own plane and is laid over its glass at every pixel.
  for (const a of lattices) wp.pane(...a);
  await B.ctx.yield();
});

// ---------------------------------------------------------------------------------------------------------------
// THE FLOORS, THE SKY and THE GREAT PENDULUM
// ---------------------------------------------------------------------------------------------------------------
STEPS.push(async (B) => {
  const { scene, ENV, col: c } = B, v3 = (a, k = 1) => V3(a[0] * k, a[1] * k, a[2] * k);
  const FU = {
    ...B.fogU(), ...ENV,
    uTptFaceCol: B.kit.uniforms.uTptFaceCol, uTptStrokeCol: B.kit.uniforms.uTptStrokeCol, uTptHandCol: B.kit.uniforms.uTptHandCol,
    // (the slate blue stands half as light again as its hex: a mid tone that stays a clear blue in the shade)
    uTile: { value: [v3(lin('#E6DDC3', 0.80)), v3(lin('#1B1F22', 1.1)), v3(lin('#46627F', 1.5)), v3(c.brass, 0.9)] },
    uPosts: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, -100, 0)) },
    // (the wet floor mirrors the opal ring at the ring's own mean: its colour times its glow times 0.66, which is the
    // band's mean 0.873 x its edges' shade 0.976 x the lift's mean 0.94 x the drift's mean 0.96 x 0.86 without the sun)
    uStone: { value: v3(lin('#DAD3C1', 0.72)) }, uOpalRef: { value: B.hero.uniforms.uOpalCol.value.clone().multiplyScalar(B.hero.uniforms.uOpalGlow.value * 0.66) }, uRedRef: { value: v3(lin(PAL[5])) },
  };
  B.floorU = FU;
  // THE THREE FLOORS LIE IN ONE PLANE, y 0, and none lies over another: the court's is a round of 96 sides that
  // holds the round wall's whole circle (its corners at 64 / cos(180 / 96 degrees) = 64.034 m, so that its sides'
  // middles stand at radius 64) and, in one piece with it, the floor of each blind arch's recess (20 m wide, back
  // to 65.5 m: from each side of the round within the recess's width a strip back to the recess's wall); the
  // passage's and the shed's start at that round's own sides and corners. The passage's runs from the sides between
  // 86.25 and 131.25 degrees south to z 128 (x -42.2 to 4.2: under its walls, and under the wall that runs on to the
  // court); the shed's from the sides between -33.75 and 33.75 degrees east to x 284 (so that the arch's throat has
  // its floor) and, beyond the arch either way, from x 53.2 between z 35.6 and 56.
  const rim = (i) => { const a = i * TAU / 96, rc = CRT.R / Math.cos(Math.PI / 96); return [rc * Math.cos(a), rc * Math.sin(a)]; };     // a corner of the court's floor, in plan [x, z]
  // a floor's geometry from flat polygons of the plan ([x, z] corners, convex, wound either way), in the floor mesh's own frame (x, -z)
  const floorGeo = (polys) => {
    const pos = [], idx = [];
    for (const q of polys) {
      const k = pos.length / 3; let area = 0;
      for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; area += b[0] * a[1] - a[0] * b[1]; pos.push(a[0], -a[1], 0); }
      for (let i = 1; i + 1 < q.length; i++) { if (area > 0) idx.push(k, k + i, k + i + 1); else idx.push(k, k + i + 1, k + i); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  };
  const floor = (K, polys) => {
    const geo = floorGeo(polys), m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...B.fogU(), ...FU }, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG(K, B.tileFig), fog: true }));
    m.rotation.x = -Math.PI / 2; scene.add(m); B.calls++; B.tris += geo.index.count / 3; return m;
  };
  { const pas = [], crt = [], shd = [];
    for (let i = 23; i < 35; i++) pas.push([rim(i), rim(i + 1), [rim(i + 1)[0], 128], [rim(i)[0], 128]]);
    for (let i = 0; i < 96; i++) crt.push([[0, 0], rim(i), rim(i + 1)]);
    for (const b of BLIND) {
      const A = b.a * D2R, ca = Math.cos(A), sa = Math.sin(A), at = (lat, dep) => [ca * dep - sa * lat, sa * dep + ca * lat];
      for (let i = 0; i < 96; i++) {
        const p = rim(i), q = rim(i + 1), lp = -sa * p[0] + ca * p[1], dp = ca * p[0] + sa * p[1], lq = -sa * q[0] + ca * q[1], dq = ca * q[0] + sa * q[1];
        if (dp < 0 || dq < 0 || Math.min(lp, lq) >= 10 || Math.max(lp, lq) <= -10) continue;
        // the side's part within the recess's width (10 m either way of its middle)
        const f = (l) => (l - lp) / (lq - lp), f0 = Math.max(0, Math.min(1, lq > lp ? f(-10) : f(10))), f1 = Math.max(0, Math.min(1, lq > lp ? f(10) : f(-10)));
        const l0 = lp + (lq - lp) * f0, d0 = dp + (dq - dp) * f0, l1 = lp + (lq - lp) * f1, d1 = dp + (dq - dp) * f1;
        crt.push([at(l0, d0), at(l1, d1), at(l1, 65.5), at(l0, 65.5)]);
      }
    }
    for (let i = -9; i < 9; i++) shd.push([rim(i), rim(i + 1), [284, rim(i + 1)[1]], [284, rim(i)[1]]]);
    for (const sg of [-1, 1]) shd.push([rim(9 * sg), [rim(9)[0], 56 * sg], [284, 56 * sg], [284, rim(9 * sg)[1]]]);
    floor(0, pas); floor(1, crt); floor(2, shd); }
  // the sky: a dome about the eye; clouds by the look (scale, threshold, speed, rain)
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.ShaderMaterial({
    uniforms: { uTime: ENV.uTime, uSunDir: ENV.uSunDir, uZen: { value: V3(0.10, 0.30, 0.78) }, uHor: { value: V3(0.19, 0.41, 0.87) },
      // the mist's lit white, its blue shadow, the bright band along the horizon (rain: all three in silver and blue-grey)
      uMist: { value: B.rain ? V3(0.52, 0.56, 0.62) : V3(0.95, 0.96, 0.96) }, uMistSh: { value: B.rain ? V3(0.23, 0.28, 0.37) : V3(0.18, 0.31, 0.66) },
      uBand: { value: B.rain ? V3(0.66, 0.69, 0.74) : V3(1.0, 1.03, 1.06) },
      uCl: { value: B.look === 'cloud' ? new THREE.Vector4(0.9, 0.44, 3.2, 0) : B.rain ? new THREE.Vector4(1.4, 0.5, 2.6, 1) : new THREE.Vector4(1.7, 0.57, 2.4, 0) },
      uClEdge: { value: B.look === 'sun' ? 0.10 : 0.20 } },     // morning sun: small clouds with firm edges; the other looks: broad soft ones
    vertexShader: SKY_VERT, fragmentShader: skyDefs(CLOUDS[B.look === 'cloud' ? 'cloud' : 'sun']) + SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky); B.calls++; B.tris += 24 * 16 * 2;
  await B.ctx.yield();

  // THE GREAT PENDULUM: bearing at (0, 98, 0), a rod 86 m long, a brass lens bob 10 m across and 2 m thick, swinging
  // in the plane z 0 (it turns about z), 10.5 degrees either side in 12 s, by the time given to update().
  const w = mkW(), steel = lin('#2A3A55', 1, 0.6), L = PEN.len;
  w.box(-0.7, -2.2, -0.45, 0.7, 0, 0.45, c.brass); w.box(-0.25, -4.2, -0.12, 0.25, -2.2, 0.12, steel);
  const rod = [[0.34, -4.0]];
  for (let y = -12; y > -78; y -= 11) rod.push([0.3, y + 0.9], [0.5, y + 0.6], [0.5, y - 0.6], [0.3, y - 0.9]);
  rod.push([0.3, -L + 6.2], [0.6, -L + 5.8], [0.6, -L + 5.2]);
  w.lathe(rod, 10, (i) => (i % 4 === 2 ? c.brass : steel));
  // the bob: a lens turned about z, a raised rim band, a boss, a ring of studs on each face; the rod's strap over it
  const lens = [[0, 1.0], [1.4, 0.97], [1.5, 1.08], [1.8, 1.05], [1.9, 0.93], [3.2, 0.78], [4.2, 0.52], [4.45, 0.55], [4.7, 0.36], [4.9, 0.2], [5.0, 0], [4.9, -0.2], [4.7, -0.36], [4.45, -0.55], [4.2, -0.52], [3.2, -0.78], [1.9, -0.93], [1.8, -1.05], [1.5, -1.08], [1.4, -0.97], [0, -1.0]];
  w.M = new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, -L, 0);
  w.lathe(lens, 48, (i) => ((i >= 1 && i <= 3) || (i >= 16 && i <= 18) || i === 7 || i === 12 ? c.brassD : c.brass));
  w.M = null;
  for (const s of [1, -1]) for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    turned(w, V3(3.75 * Math.cos(a), -L + 3.75 * Math.sin(a), s * 0.62), V3(0, 0, s), [[0.2, 0], [0.14, 0.12], [0, 0.16]], 6, c.brassD);
  }
  for (const s of [1, -1]) w.box(-0.42, -L - 5.3, s * 1.0, 0.42, -L + 5.3, s * 1.14, steel);
  w.lathe([[0.42, -L - 5.2], [0.8, -L - 5.5], [0.8, -L - 6.3], [0.3, -L - 6.6], [0, -L - 7.2]], 10, c.brassD);
  const pend = new THREE.Mesh(w.geometry(), B.mat.solid);
  pend.position.set(0, PEN.pivotY, 0); pend.frustumCulled = false; scene.add(pend); B.calls++; B.tris += w.triangles;
  B.updaters.push((dt, time) => {
    const th = PEN.amp * Math.sin(TAU * time / PEN.period);
    pend.rotation.z = th;
    ENV.uBob.value.set(L * Math.sin(th), PEN.pivotY - L * Math.cos(th), 0);
  });
  await B.ctx.yield();
});

// ---------------------------------------------------------------------------------------------------------------
// LAST: the writers become meshes; the dial lists become instanced meshes of the kit's three weights.
// ---------------------------------------------------------------------------------------------------------------
LAST.push(async (B) => {
  const y = () => B.ctx.yield();
  {
    // the passage's shell by its four rooms: a triangle goes with its centre; one that runs more than 25 m across
    // or 30 m along the passage goes to the north-east room: those are the vault's purlins, 104 triangles, and
    // nothing else (the shell holds no triangle of the floor, which is a mesh of its own)
    const P = B.w.pas.P, N = B.w.pas.N, C = B.w.pas.C, nT = P.length / 9, room = new Uint8Array(nT), count = [0, 0, 0, 0];
    for (let t = 0, i = 0; i < nT; t += 9, i++) {
      const xa = P[t], xb = P[t + 3], xc = P[t + 6], za = P[t + 2], zb = P[t + 5], zc = P[t + 8];
      const long = Math.max(xa, xb, xc) - Math.min(xa, xb, xc) > 25 || Math.max(za, zb, zc) - Math.min(za, zb, zc) > 30;
      count[room[i] = long ? 2 : pasRoom((xa + xb + xc) / 3, (za + zb + zc) / 3)]++;
    }
    await y();
    for (let r = 0; r < 4; r++) {
      if (!count[r]) continue;
      const p = new Float32Array(count[r] * 9), n = new Float32Array(count[r] * 9), c = new Float32Array(count[r] * 12);
      for (let i = 0, o = 0; i < nT; i++) {
        if (room[i] !== r) continue;
        for (let j = 0; j < 9; j++) { p[o * 9 + j] = P[i * 9 + j]; n[o * 9 + j] = N[i * 9 + j]; }
        for (let j = 0; j < 12; j++) c[o * 12 + j] = C[i * 12 + j];
        o++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); g.setAttribute('aCol', new THREE.BufferAttribute(c, 4));
      B.mesh(g, B.mat.solid); await y();
    }
  }
  for (const k of ['crt', 'crt2', 'shd', 'shdE', 'wm', 'wa', 'ws']) { if (B.w[k].triangles) B.mesh(await B.w[k].geometry(y), B.mat.solid); await y(); }
  for (const k of ['panePas', 'paneCrt', 'paneShd']) { if (B.w[k].triangles) B.mesh(await B.w[k].geometry(y), B.mat.pane, 1); await y(); }
  const kinds = (list) => ({ aKind: { data: list.map((d) => d[1]), size: 1 } });
  for (const wgt of ['near', 'middle', 'far']) for (const room in B.dials[wgt]) {
    const list = B.dials[wgt][room], mats = list.map((d) => d[0]);
    B.instanced(B.kit[wgt].geometry, B.kit[wgt].material, mats, kinds(list));
    if (wgt === 'near') B.instanced(B.kit.near.glassGeometry, B.kit.near.glassMaterial, mats, kinds(list), 2);
    await B.ctx.yield();
  }
});

// ---------------------------------------------------------------------------------------------------------------
// THE SIGHT CONE: the cone from the eye to a circle about the great dial's centre, for every eye of the line from
// 254 m to 420 m, half a metre of route apart. THE WATCHES keep the cone to the circle of radius 34 (SIGHT_R, the
// minute hand's reach): no watch at any point of its swing and no chain hangs in it. THE POST CLOCKS keep a
// narrower cone of their own, to the circle of radius 12 (POST_R: the boss, the collar and the hands' roots): no
// part of a post clock stands in that one, and a head may stand before the dial's face outside it. Margins are
// metres in the plane across the shed at the thing (its own size and swing taken off); build() puts the least for
// the watches and for the posts into info.sightCone.
// ---------------------------------------------------------------------------------------------------------------
const SIGHT_R = 34, SIGHT_CLEAR = 0.3, POST_R = 12, POST_CLEAR = 0.5;
function sightEyes(B) {
  if (!B.eyes) {
    const q = new THREE.Vector3(); B.eyes = new Float32Array(333 * 3);
    for (let i = 0; i < 333; i++) { B.path.posAtDist(254 + i * 0.5, q); B.eyes[i * 3] = q.x; B.eyes[i * 3 + 1] = q.y; B.eyes[i * 3 + 2] = q.z; }
  }
  return B.eyes;
}
// a thing that hangs from the roof at (x, z), its body a ball of radius size (its swing with it) about a centre at
// height y, its chain above it: its margin against every sight cone. Where the cone's axis is higher than the
// body, the chain crosses that height and the margin is the level one.
function hangMargin(eyes, x, y, z, size) {
  let least = Infinity;
  for (let i = 0; i < eyes.length; i += 3) {
    const ex = eyes[i]; if (x <= ex + 0.5) continue;                    // behind the eye
    const t = (x - ex) / (SHD.gableX - ex), cy = eyes[i + 1] + t * (44 - eyes[i + 1]), dz = z - eyes[i + 2] * (1 - t);
    least = Math.min(least, Math.hypot(Math.max(y, cy) - cy, dz) - t * SIGHT_R - size);
  }
  return least;
}
// the least height of that body's centre at (x, z) that keeps it clear above every sight cone (-Infinity where no
// cone comes within clear of its hanging line). every: take one eye in so many (a quick lower bound of the same).
// hangOverEye: the eye (its place in the list) whose cone asked the most in the last count; eyeOver: one eye's ask.
let hangOverEye = 0;
function eyeOver(eyes, i, x, z, clear) {
  const ex = eyes[i]; if (x <= ex + 0.5) return -Infinity;
  const t = (x - ex) / (SHD.gableX - ex), cy = eyes[i + 1] + t * (44 - eyes[i + 1]), dz = z - eyes[i + 2] * (1 - t), rad = t * SIGHT_R + clear;
  return dz < rad && -dz < rad ? cy + Math.sqrt(rad * rad - dz * dz) : -Infinity;
}
function hangOver(eyes, x, z, clear, every = 1) {
  let need = -Infinity;
  for (let i = 0; i < eyes.length; i += 3 * every) {
    const ex = eyes[i]; if (x <= ex + 0.5) continue;
    const t = (x - ex) / (SHD.gableX - ex), cy = eyes[i + 1] + t * (44 - eyes[i + 1]), dz = z - eyes[i + 2] * (1 - t), rad = t * SIGHT_R + clear;
    if (Math.abs(dz) < rad) { const v = cy + Math.sqrt(rad * rad - dz * dz); if (v > need) { need = v; hangOverEye = i; } }
  }
  return need;
}
// A POST CLOCK'S PARTS as every count takes them: upright bodies about the post's axis, [y0, y1, radius], heights
// from the head's centre; each is the axis from y0 to y1 swollen by its radius (a ball where y0 = y1).
//   the head     a ball of 4.4: it holds the cornice's corner (2.55, 2.5, 2.55: 4.39 from the centre), the roof's
//                eaves (4.27), the gablets (4.30), the corner columns (4.18) and the plinth (4.19)
//   the brackets the four scrolls under the corners reach 2.97 from the axis between 2.4 and 4.6 under the centre
//   the roof     above the ball: from 4.2 over the centre (1.15 wide there) to its top at 5.0
//   the finial   from 5.0 to its tip at 7.7, at most 0.62 thick
// and the column with its foot: 1.95 about the axis from the floor to 2.5 under the head's centre.
const POST_PARTS = [[0, 0, 4.4], [-4.6, -2.5, 3.0], [4.2, 5.0, 1.15], [5.0, 7.7, 0.65]], POST_FOOT = [-2.5, 1.95];
// the margin of a post at x, z with its head's centre at yh against every sight cone
function postMargin(eyes, x, z, yh) {
  let least = Infinity;
  for (let i = 0; i < eyes.length; i += 3) {
    const ex = eyes[i], ey = eyes[i + 1], ez = eyes[i + 2];
    if (x <= ex + 0.5) continue;                                       // the post is behind the eye
    const t = (x - ex) / (SHD.gableX - ex), cy = ey + t * (44 - ey), cz = ez * (1 - t), rad = t * POST_R;
    // each part's nearest height to the cone's axis
    for (const [y0, y1, r] of POST_PARTS) least = Math.min(least, Math.hypot(Math.max(yh + y0, Math.min(yh + y1, cy)) - cy, z - cz) - rad - r);
    least = Math.min(least, Math.hypot(Math.max(0, Math.min(yh + POST_FOOT[0], cy)) - cy, z - cz) - rad - POST_FOOT[1]);
  }
  return least;
}
// THE TWO GREAT HANDS AS THE POSTS' PLAN TAKES THEM, for each eye of the sight cone as they stand when we are there
// (the part's own law of the hands, by metres flown): each hand two bars in its own plane before the dial, six
// numbers each (the plane's x; y and z of one end; y and z of the other; the bar's half width): the blade from the
// collar's edge to its point, as wide all the way as its eye's ring, and the tail from the boss to its
// counterpoise, as wide as the counterpoise. A hand at a degrees clockwise from twelve, read from the west, points
// to y 44 + u cos a, z u sin a.
function handBars(B) {
  if (!B.handBars) {
    const bars = B.handBars = new Float32Array(333 * 24);
    for (let i = 0, o = 0; i < 333; i++) {
      const a = handAngles(254 + i * 0.5);
      for (const [h, deg] of [[GREAT.minute, a.minuteDeg], [GREAT.hour, a.hourDeg]]) {
        const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180), x = SHD.gableX - h.z;
        bars.set([x, 44 + h.u0 * c, h.u0 * s, 44 + (h.tip - h.Re) * c, (h.tip - h.Re) * s, h.Re, x, 44 - GREAT.bossOut * c, -GREAT.bossOut * s, 44 - h.cu * c, -h.cu * s, h.cr], o);
        o += 12;
      }
    }
  }
  return B.handBars;
}
// the least distance, in a plane, between an upright stroke (at z, from ya up to yb) and a bar from (z0, y0) to (z1, y1)
function uprightGap(z, ya, yb, z0, y0, z1, y1) {
  const dz = z1 - z0, dy = y1 - y0, dd = dz * dz + dy * dy;
  if (dz !== 0 && (z0 - z) * (z1 - z) <= 0) { const y = y0 + (z - z0) / dz * dy; if (y >= ya && y <= yb) return 0; }     // the bar passes through the stroke
  const ta = dd > 0 ? Math.max(0, Math.min(1, ((z - z0) * dz + (ya - y0) * dy) / dd)) : 0, tb = dd > 0 ? Math.max(0, Math.min(1, ((z - z0) * dz + (yb - y0) * dy) / dd)) : 0;
  const az = z - z0 - dz * ta, ay = ya - y0 - dy * ta, bz = z - z0 - dz * tb, by = yb - y0 - dy * tb;      // the stroke's two ends to the bar
  const cy = y0 - Math.max(ya, Math.min(yb, y0)), ey = y1 - Math.max(ya, Math.min(yb, y1));                // the bar's two ends to the stroke
  return Math.sqrt(Math.min(az * az + ay * ay, bz * bz + by * by, (z0 - z) * (z0 - z) + cy * cy, (z1 - z) * (z1 - z) + ey * ey));
}
// the least gap between a post at x, z with its head's centre at yh and the two great hands as they stand for each
// eye: taken in the plane across the shed at the post, each bar carried there from the eye, both sizes taken off.
// least: a figure to begin from (a bar that cannot come nearer than it is passed over): asked with POST_CLEAR the
// answer is POST_CLEAR where the true gap is that or more; asked with nothing it is the true gap.
function postHands(eyes, bars, x, z, yh, least = Infinity) {
  for (let i = 0, o = 0; i < eyes.length; i += 3, o += 24) {
    const ex = eyes[i], ey = eyes[i + 1], ez = eyes[i + 2];
    if (x <= ex + 0.5) continue;                                       // the post is behind the eye
    for (let k = o; k < o + 24; k += 6) {
      const th = (x - ex) / (bars[k] - ex), y0 = ey + th * (bars[k + 1] - ey), z0 = ez + th * (bars[k + 2] - ez), y1 = ey + th * (bars[k + 3] - ey), z1 = ez + th * (bars[k + 4] - ez), rr = th * bars[k + 5];
      // (passed over: a bar whose reach across and whose heights leave it farther than least from the widest part, 4.4)
      const gz = Math.max(Math.min(z0, z1) - z, z - Math.max(z0, z1), 0), gy = Math.max(Math.min(y0, y1) - yh - 7.7, 0), far = least + rr + 4.4;
      if (far < 1e9 && gz * gz + gy * gy >= far * far) continue;
      for (const [a, b, r] of POST_PARTS) least = Math.min(least, uprightGap(z, yh + a, yh + b, z0, y0, z1, y1) - r - rr);
      least = Math.min(least, uprightGap(z, 0, yh + POST_FOOT[0], z0, y0, z1, y1) - POST_FOOT[1] - rr);
    }
  }
  return least;
}
// THE HEIGHT OF A POST'S HEAD: hi where the post keeps POST_CLEAR outside every sight cone with its head there
// (postPair then sees to the great hands by its place). Where the cone holds it lower (the greatest height that
// keeps POST_CLEAR from every cone, found by halving eighteen times between 7 m and hi), it is held POST_CLEAR from the two great
// hands as well, as they stand for each eye: from the cone's height down by half metres to the first height that
// is clear of them, then the half metre above that halved twelve times.
function postCap(eyes, bars, x, z, hi) {
  if (postMargin(eyes, x, z, hi) >= POST_CLEAR) return hi;
  let lo = 7;
  for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (postMargin(eyes, x, z, m) >= POST_CLEAR) lo = m; else hi = m; }
  const clear = (y) => postHands(eyes, bars, x, z, y, POST_CLEAR) >= POST_CLEAR;
  if (clear(lo)) return lo;
  hi = lo; lo = Math.max(7, hi - 0.5);
  while (lo > 7 && !clear(lo)) { hi = lo; lo = Math.max(7, hi - 0.5); }
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (clear(m)) lo = m; else hi = m; }
  return lo;
}
// THE PLAN OF THE POST CLOCKS, worked out once and read by the watches' step and by the posts' own: at every 14 m of
// route from 300 m to 398 m one stands 10 m from the line in plan, left and right by turns; 7 m of route after
// each, one stands 21 m off on the other side. A head's centre is asked at the eye's height at its station (the
// inner row) or 4 m over or under it (the outer row: two over, two under, so higher and lower by turns on each
// side), and postCap holds it lower where the posts' cone would not have it there (held). A head of the inner row
// that stands at its asked height and there comes within POST_CLEAR of a great hand, as handBars takes the hands
// for some eye, is set outward from the line 2 m at a time (to 20 m at the most) until it is clear of both: off is
// the distance it then stands at.
function postPair(B, i) {            // the i-th inner post and the outer one after it
  const eyes = sightEyes(B), bars = handBars(B), pair = [];
  for (const [s, off, weight, up] of [[300 + 14 * i, (i % 2 ? 1 : -1) * 10, 'near', 0], [307 + 14 * i, (i % 2 ? -1 : 1) * 21, 'middle', (i >> 1) % 2 ? -4 : 4]]) {
    const p = B.path.posAtDist(s), t = B.path.tangentAtDist(s), l = Math.hypot(t.x, t.z), nx = -t.z / l, nz = t.x / l;     // n: to the right of the way
    let o = off, x = p.x + nx * o, z = p.z + nz * o, y = postCap(eyes, bars, x, z, p.y + up);
    while (y >= p.y + up && Math.abs(o) < 20 && postHands(eyes, bars, x, z, y, POST_CLEAR) < POST_CLEAR) { o += Math.sign(o) * 2; x = p.x + nx * o; z = p.z + nz * o; y = postCap(eyes, bars, x, z, p.y + up); }
    pair.push({ x, y, z, off: Math.abs(o), yaw: Math.atan2(-t.x, -t.z), weight, held: y < p.y + up, cone: postMargin(eyes, x, z, y), hands: postHands(eyes, bars, x, z, y) });
  }
  return pair;
}
function postPlan(B) {
  if (!B.postPlan) { B.postPlan = []; for (let i = 0; i < 8; i++) B.postPlan.push(...postPair(B, i)); }
  return B.postPlan;
}
// WATCHES AND POST CLOCKS. A watch with its chain is taken as the plan takes it (watchSize, below: a ball of 1.26
// radii about the point where its chain's line meets the dial's height, swollen by 1.3 times the reach of its
// swing), carried from that point up to where its chain hangs. postOver:
// the least height of that centre at (x, z) that keeps the whole of it clear (its own size and the clear air wanted,
// together) above every part of every post clock; -Infinity where no post stands under it. postGap: the least
// distance from such a hanging body to any part of any post, both sizes taken off.
function postOver(posts, x, z, clear) {
  let need = -Infinity;
  for (const p of posts) {
    const dx = x - p.x, dz = z - p.z, far = 4.4 + clear;                 // (4.4: the widest part)
    if (dx > far || dx < -far || dz > far || dz < -far) continue;
    const dh = Math.sqrt(dx * dx + dz * dz);
    for (const [, y1, r] of POST_PARTS) if (dh < r + clear) need = Math.max(need, p.y + y1 + Math.sqrt((r + clear) * (r + clear) - dh * dh));
    if (dh < POST_FOOT[1] + clear) need = Math.max(need, p.y + POST_FOOT[0] + Math.sqrt((POST_FOOT[1] + clear) * (POST_FOOT[1] + clear) - dh * dh));
  }
  return need;
}
function postGap(posts, x, y, top, z, size) {
  let least = Infinity;
  for (const p of posts) {
    const dh = Math.hypot(x - p.x, z - p.z);
    for (const [y0, y1, r] of POST_PARTS) least = Math.min(least, Math.hypot(dh, Math.max(0, y - (p.y + y1), p.y + y0 - top)) - r - size);
    least = Math.min(least, Math.hypot(dh, Math.max(0, y - (p.y + POST_FOOT[0]))) - POST_FOOT[1] - size);
  }
  return least;
}

// A WATCH AS EVERY COUNT TAKES IT. Its body: a ball about the point where its chain's line meets the dial's
// height, of 1.26 times the dial's radius (the case's rim with its depth, 1.12, and the 0.14 by which the dial
// stands before the chain's line; it turns about that line, an eighth either way), swollen by the swing: a watch
// swings about its chain's top, its centre by the reach s at the most, its furthest point by no more than 1.3 s
// (the chain is never shorter than 2 m over the bow: as the plan hangs them the shortest is 7.26 m). So
// watchSize = 1.26 R + 1.3 s. Its chain with pendant and bow: the line from that point up to where the chain
// hangs (the roof's glass, or roof iron on its line), 0.22 R thick (the bow), swept by no more than s.
// What keeps two watches 0.3 m apart at every moment. watchPlan: the least distance in plan (the higher one's body
// beside the lower one's chain); watchBall: the least distance between the two points (body to body); watchGap:
// the least clear distance between the two as they hang (bodies, and body to chain), sweeps taken.
const watchSize = (R, swing) => 1.26 * R + 1.3 * swing, WATCH_CLEAR = 0.3;
const watchPlan = (a, b) => Math.max(a.size + 0.22 * b.R + b.swing, b.size + 0.22 * a.R + a.swing) + WATCH_CLEAR;
const watchBall = (a, b) => a.size + b.size + WATCH_CLEAR;
function watchGap(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z, dy = a.y - b.y, dh = Math.sqrt(dx * dx + dz * dz), hi = dy >= 0 ? a : b, lo = dy >= 0 ? b : a;
  return Math.min(Math.sqrt(dh * dh + dy * dy) - a.size - b.size, dh - hi.size - 0.22 * lo.R - lo.swing);
}

// ---------------------------------------------------------------------------------------------------------------
// THE RAIN OF WATCHES: each on its own brass chain from the roof (from its glass, or from a purlin or a rib where
// the chain's line meets one: see hangTop).
// THE GATHERING, laid by the way: between 258 m and 335 m of route, 28 rows 2.74 m of route apart, each of twelve
// places across the way, six a side from 4.9 m to 25.9 m from the line in plan (3.5 m apart), each jittered in
// its cell; a place hangs within 11.5 m of the eye's height at its row. 336 places, less those that would hang in
// the court's round wall beside the east arch; build() counts those that
// are within 26 m of the line in plan, within 12 m of the eye's height at the line's nearest point and whose
// nearest point lies between 258 m and 335 m of route, and puts the count into info (watchesGathered).
// THE REST, as a staggered lattice (5.6 m) with jitter between x 62 and x 190, y 16 to y 54, wherever the
// gathering is not: whole to x 135 (about 330 m of route) and thinning to three in ten at x 190. A lattice place
// within 4.7 m of the flown line in plan is moved straight out to 4.9..6.5 m, so none hangs within 4.5 m.
// A watch is 0.7..1.4 m across: a place of the gathering is a large watch (1.12..1.40 m) whatever its draw says,
// a place of the lattice is large by the plan's deal of one in four (place(): big). It turns an eighth either
// way on its chain in 7..12 s (the seed's) and swings at most 0.5 m, in 6 s and a tenth of a second for each
// metre of its chain (the plan's).
// The density hint thins the lattice by a dealt rank and never the gathering; the graphics level thins neither.
// ---------------------------------------------------------------------------------------------------------------
// a watch case of radius 1 behind a kit dial (facing +z). Near weight (seg 16): a case band of three mouldings, an
// engine-turned back (two rings of sixteen facets and a rose of sixteen, light and dark by turns like a chequer),
// a pendant with a ribbed crown, and a bow of three-sided section through the pendant. Lighter weights: fewer bands, a flat bow
// (the middle weight's on a four-sided pendant, the far weight's on a flat stem).
// The mouth (radius 1 at its corners) is where the dial sits: a near dial's disc and bezel have the near mouth's own
// sixteen corners; a middle dial's face disc stands inside the middle mouth's ten sides (their middles at 0.951)
// and its ring rises from the disc to 0.03 before the mouth at its outer edge, over the lip; a far dial is one disc of sixteen sides that
// carries its own bezel, and it lies on the far mouth's eight sides as a lid, its rim over the lip.
function watchGeometry(seg, bands, brass, brassD) {
  const w = mkW(), brassL = mulc(brass, 1.18);
  w.M = new THREE.Matrix4().makeRotationX(-Math.PI / 2);                 // the lathe's axis (y) laid along -z
  if (bands >= 4) {
    w.lathe([[1.0, 0], [1.09, 0.05], [1.1, 0.2], [1.02, 0.3]], seg, (i) => [brassL, brass, brassD][i]);
    const ring = [[1.02, 0.3], [0.62, 0.39], [0.3, 0.42], [0, 0.42]];
    for (let j = 0; j < 3; j++) for (let i = j < 2 ? 0 : 1; i < seg; i += j < 2 ? 1 : 2) {
      const a0 = i / seg * TAU, a1 = (i + 1) / seg * TAU, [r0, d0] = ring[j], [r1, d1] = ring[j + 1], col = (i + j) % 2 ? brassD : brassL;
      const P = (r, d, a) => [r * Math.cos(a), d, r * Math.sin(a)];
      if (r1 > 0) w.quad(P(r0, d0, a0), P(r1, d1, a0), P(r1, d1, a1), P(r0, d0, a1), col); else w.tri(P(r0, d0, a0 - TAU / seg), [0, d1, 0], P(r0, d0, a1), brass);
    }
  } else w.lathe(bands === 3 ? [[1.0, 0], [1.08, 0.12], [0.8, 0.32], [0, 0.42]] : [[1.0, 0], [1.07, 0.14], [0, 0.42]], seg, (i) => (i % 2 ? brassD : brass));
  w.M = new THREE.Matrix4().makeTranslation(0, 0, -0.14);                // pendant, crown and bow stand over the case band's middle
  if (bands >= 4) {
    w.lathe([[0.12, 1.02], [0.12, 1.12]], 6, brassD);
    for (let i = 0; i < 6; i++) {                                         // the crown: six ribs, light and dark by turns
      const a0 = i / 6 * TAU, a1 = (i + 1) / 6 * TAU, col = i % 2 ? brassD : brassL, P = (r, y, a) => [r * Math.cos(a), y, r * Math.sin(a)];
      w.quad(P(0.2, 1.12, a0), P(0.2, 1.12, a1), P(0.2, 1.27, a1), P(0.2, 1.27, a0), col); w.tri(P(0.2, 1.27, a0), P(0.2, 1.27, a1), [0, 1.31, 0], brass);
    }
    const n = 8;                                                         // the bow: a ring of three-sided section, radius 0.21 about y 1.49
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, p = (a, r, z) => [r * Math.cos(a), 1.49 + r * Math.sin(a), z];
      w.quad(p(a0, 0.16, 0), p(a1, 0.16, 0), p(a1, 0.215, 0.045), p(a0, 0.215, 0.045), brassL);
      w.quad(p(a0, 0.215, 0.045), p(a1, 0.215, 0.045), p(a1, 0.215, -0.045), p(a0, 0.215, -0.045), brass);
      w.quad(p(a0, 0.215, -0.045), p(a1, 0.215, -0.045), p(a1, 0.16, 0), p(a0, 0.16, 0), brassD);
    }
  } else {
    // the flat bow's top side stands at y 1.68, where the chain's foot ends: the ribbon ends on the bow edge to edge
    // (run on into the flat bow it would lie in the bow's own plane whenever the two face one way)
    const n = 6, bowY = 1.68 - 0.215 * Math.sin(TAU / 6), bowLo = bowY - 0.215 * Math.sin(TAU / 6);
    if (bands >= 3) w.lathe([[0.12, 1.02], [0.17, 1.08], [0.17, 1.27], [0.1, bowLo + 0.016]], 4, brass);  // (its top stands 0.016 inside the bow's lowest side)
    // (the far watch's pendant: a flat stem in the bow's plane, from 0.04 inside the case's top corner, y 1.07, to the bow's lowest side)
    else w.quad([-0.07, 1.03, 0], [0.07, 1.03, 0], [0.07, bowLo, 0], [-0.07, bowLo, 0], brass);
    for (let i = 0; i < n; i++) {                                         // the bow: a flat ring over the pendant
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, p = (a, r) => [r * Math.cos(a), bowY + r * Math.sin(a), 0];
      w.quad(p(a0, 0.15), p(a1, 0.15), p(a1, 0.215), p(a0, 0.215), brass);
    }
  }
  w.M = null;
  return w.geometry();
}
STEPS.push(async (B) => {
  // THE PLACES AND THE SIZES ARE THE PLAN'S, the same on every seed: the cells' jitter, the heights, the thinning
  // ranks and the way out of the corridor come from the plan's own generators, and so do each watch's size and the
  // reach of its swing (a place may not be cleared by a number the seed deals). ctx.rng deals what does not move a
  // place: each watch's facing, its two phases, the period of its turn (7 to 12 s) and the swing's azimuth (it
  // still makes its eight draws to a place, so that nothing else it deals has changed). The period of its swing
  // is the plan's: 6 s and a tenth of a second for each metre of its chain (wt.sw below).
  const rng = B.rng.fork('watches'), plan = makeRng(4201), planG = makeRng(4202), planS = makeRng(4204), S = SHD, a = 5.6, rowH = a * 0.8660254;
  const keep = Math.min(1, B.density), places = [];
  if (!B.postPlan) { const list = []; for (let i = 0; i < 8; i++) { list.push(...postPair(B, i)); await B.ctx.yield(); } B.postPlan = list; }
  const hang = (gathered) => {
    // every draw is made for every place, so that thinning never changes another watch
    rng(); rng(); const ph1 = rng() * TAU, ph2 = rng() * TAU, t1 = 7 + 5 * rng(), yaw = (rng() - 0.5) * 1.2, az = rng() * TAU; rng();
    const dealt = planS() < 0.25, big = gathered || dealt, rr = planS(), swing = 0.2 + 0.3 * planS();   // (a gathered place is large whatever its first draw says)
    return (x, z, y, yEye, kept = true) => {
      const R = big ? 0.56 + 0.14 * rr : 0.35 + 0.15 * rr;
      places.push({ x, y, z, R, swing, size: watchSize(R, swing), gathered, yEye, kept, facing: V3(-Math.cos(yaw), 0, Math.sin(yaw)), ph1, t1, ph2, az });
    };
  };
  // the gathering
  const q = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < 28; i++) {
    for (let j = 0; j < 12; j++) {
      const js = planG(), jl = planG(), jy = planG(); planG();              // (the place's fourth draw is not used)
      const sR = 258.6 + 2.74 * i + (js - 0.5) * 2.4, side = j < 6 ? -1 : 1, off = side * (4.9 + 3.5 * (j % 6) + (0.15 + 0.7 * jl) * 3.5);
      B.path.posAtDist(sR, q); B.path.tangentAtDist(sR, t);
      const tl = Math.hypot(t.x, t.z) || 1, x = q.x - t.z / tl * off, z = q.z + t.x / tl * off, y = q.y + (2 * jy - 1) * 11.5;
      const put = hang(true);
      if (x * x + z * z < 68 * 68 || Math.abs(z) > 53 || x < 60) continue;   // the court's round wall, the shed's walls
      if (B.path.nearestXZ(x, z).dist < 4.7) continue;
      put(x, z, y, q.y);
    }
    if ((i & 3) === 3) await B.ctx.yield();
  }
  // the rest
  let row = 0;
  for (let z0 = -52; z0 <= 52; z0 += rowH, row++) {
    for (let x0 = 62 + (row % 2) * a / 2; x0 <= 190; x0 += a) {
      const jx = (plan() - 0.5) * 3.0, jz = (plan() - 0.5) * 3.0, y = 16 + 38 * plan(), rank = plan(), thin = plan(), out = 4.9 + 1.6 * plan();
      let x = x0 + jx, z = Math.max(-53, Math.min(53, z0 + jz));
      const put = hang(false);
      if (x * x + z * z < 67 * 67) continue;                               // the court's round wall stands there
      if (rank > (x <= 135 ? 1 : 1 - 0.7 * (x - 135) / 55)) continue;      // thinning after x 135
      const near = B.path.nearestXZ(x, z), sN = near.u * B.L;
      if (near.dist <= 26.5 && sN >= 257 && sN <= 336) continue;           // the gathering hangs there
      if (near.dist < 4.7) {
        // straight out across the way (never along it), on the side it already hangs
        const qq = B.path.pointAt(near.u), tt = B.path.tangentAt(near.u), tl = Math.hypot(tt.x, tt.z) || 1, nx = -tt.z / tl, nz = tt.x / tl;
        const side = (x - qq.x) * nx + (z - qq.z) * nz < 0 ? -1 : 1;
        x = qq.x + nx * side * out; z = qq.z + nz * side * out;
      }
      put(x, z, y, undefined, thin <= keep);                               // a place the density hint thins away is still laid: it holds its place
    }
    if (row & 1) await B.ctx.yield();
  }
  // EVERY PLACE IS SET CLEAR, in the plan's order, of three things: THE SIGHT CONE of every eye from 254 m to
  // 420 m, EVERY POST CLOCK (0.5 m), and EVERY WATCH ALREADY HUNG (0.3 m: see watchGap). A place that is not
  // clear is moved by the plan, never taken away: raised on a shorter chain, or carried level across the shed's
  // air on a grid of half metres (never nearer the line than 4.7 m in plan, never into a wall) and raised there
  // as far as it must be; of all such places the one with the least move in space (a watch of the gathering is not
  // raised higher than 11.5 m over the eye's height at its row). The search runs on until a clear place is found.
  // So the watches stand round the sight as a ring about the dial, none hangs in or through a post clock, and no
  // two come within 0.3 m of each other at any moment of their swings and turns. Places thinned by the density
  // hint are set clear with the rest and left out afterwards, so a thinned visit hangs the same watches in the
  // same places, fewer of them.
  const eyes = sightEyes(B), posts = postPlan(B), lineXZ = [], roofAt = (zz) => S.cy + Math.sqrt(S.r * S.r - zz * zz) - 0.3;
  for (let sx = 230; sx <= B.L; sx += 0.5) { B.path.posAtDist(sx, q); lineXZ.push(q.x, q.z); }
  const offLine = (x, z) => { let m = Infinity; for (let i = 0; i < lineXZ.length; i += 2) { const dx = x - lineXZ[i], dz = z - lineXZ[i + 1], d = dx * dx + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  const CELL = 3.2, grid = new Map(), cellOf = (x, z) => Math.floor(x / CELL) * 1000 + Math.floor(z / CELL);
  // the watches already hung in the nine cells about a place: one list a cell, kept until a watch is hung near it
  const nbOf = new Map(), around = (x, z) => {
    const key = cellOf(x, z); let list = nbOf.get(key);
    if (!list) { list = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = grid.get(key + i * 1000 + j); if (l) for (let k = 0; k < l.length; k++) list.push(l[k]); } nbOf.set(key, list); }
    return list;
  };
  let moved = 0, movedPost = 0, movedWatch = 0, n = 0, hotEye = 0;
  for (const wt of places) {
    const clear = wt.size + SIGHT_CLEAR + 0.01, clearP = wt.size + POST_CLEAR + 0.01;
    // the least height, not under its own, at which it hangs clear at (x, z); Infinity where it cannot hang, or
    // where the move (hd in plan, then up) would be no less than the least found so far
    const heightAt = (x, z, hd = 0, sofar = Infinity) => {
      // the cone first, by lower bounds, since most places fall here: the one eye that turned the last place away,
      // then one eye in eight
      const far2 = sofar * sofar - hd * hd, c1 = eyeOver(eyes, hotEye, x, z, clear) - wt.y;
      if (c1 > 0 && c1 * c1 >= far2) return Infinity;
      const c8 = hangOver(eyes, x, z, clear, 8);
      if (c8 > wt.y && (c8 - wt.y) * (c8 - wt.y) >= far2) { hotEye = hangOverEye; return Infinity; }
      const nb = around(x, z);
      for (let k = 0; k < nb.length; k++) { const o = nb[k], dx = x - o.x, dz = z - o.z, D = watchPlan(wt, o) + 0.005; if (dx * dx + dz * dz < D * D) return Infinity; }
      let y = Math.max(wt.y, postOver(posts, x, z, clearP));
      if (y > 120 || Math.hypot(hd, y - wt.y) >= sofar) return Infinity;
      y = Math.max(y, c8);
      if (Math.hypot(hd, y - wt.y) >= sofar) return Infinity;
      y = Math.max(y, hangOver(eyes, x, z, clear));
      for (let turn = 0, again = true; again && turn < 40; turn++) {
        again = false;
        for (let k = 0; k < nb.length; k++) { const o = nb[k], dh = Math.hypot(x - o.x, z - o.z), D = watchBall(wt, o) + 0.005; if (dh < D) { const v = Math.sqrt(D * D - dh * dh); if (Math.abs(y - o.y) < v) { y = o.y + v; again = true; } } }
      }
      return y <= roofAt(z) - 1.68 * wt.R - 2 && !(wt.gathered && y > wt.yEye + 11.5) ? y : Infinity;
    };
    const x0 = wt.x, z0 = wt.z, y0 = wt.y, h0 = heightAt(x0, z0);
    let best = h0 - y0;
    if (best > 0) {
      if (hangOver(eyes, x0, z0, clear) > y0) moved++; else if (postOver(posts, x0, z0, clearP) > y0) movedPost++; else movedWatch++;
      let bx = x0, bz = z0, by = h0;
      const tryAt = (dx, dz) => {
        const x2 = x0 + 0.5 * dx, z2 = z0 + 0.5 * dz, hd = 0.5 * Math.sqrt(dx * dx + dz * dz);
        if (hd >= best || Math.abs(z2) > 53 || x2 > 192 || x2 * x2 + z2 * z2 < 67 * 67) return;
        const y2 = heightAt(x2, z2, hd, best), cost = Math.hypot(hd, y2 - y0);
        if (cost < best && offLine(x2, z2) >= 4.7) { best = cost; bx = x2; bz = z2; by = y2; }
      };
      for (let k = 1; k <= 400 && 0.5 * k < best; k++) {                  // the square ring k half metres out
        for (let e = -k; e <= k; e++) { tryAt(e, -k); tryAt(e, k); if (e !== -k && e !== k) { tryAt(-k, e); tryAt(k, e); } }
        if ((k & 7) === 7) await B.ctx.yield();
      }
      wt.x = bx; wt.z = bz; wt.y = by; if (!(best < Infinity)) wt.kept = false;      // (never so: the roof is high and the shed wide)
      await B.ctx.yield();
    }
    const key = cellOf(wt.x, wt.z); if (!grid.has(key)) grid.set(key, []); grid.get(key).push(wt);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) nbOf.delete(key + i * 1000 + j);
    if ((++n & 7) === 7) await B.ctx.yield();
  }
  B.watches = places.filter((wt) => wt.kept);
  // WHERE A CHAIN HANGS FROM. From the roof's glass: its top stands 0.02 m under the flat pane over it (taken at
  // the ribbon's edge farther from the ridge, 0.03 m from its middle, where the pane is lower: 0.02 to 0.11 m under
  // the pane at the ribbon's middle, the most on the steep panes by the springing). A chain whose line meets roof iron on its way up, or passes it nearer than
  // its own thickness (0.03 m each way) and the reach of its swing at the iron's height, ends at that iron and
  // hangs from it: a purlin (0.5 m square, one every 7.5 degrees of the round) or a rib's lower chord (0.5 m wide,
  // its foot 2.2 m inside the glass, one rib every 16 m). Where the iron stands OVER the chain's line the top
  // stands 0.02 m under the iron's lowest side over the ribbon's width. A HOOK IS MEANT wherever a top stands
  // under its glass, or 0.06 m or less under its iron: the hook is not built. Where the iron stands BESIDE the
  // line, or more than 0.06 m over the top at the ribbon's middle (under a steep side of it), the chain hangs from
  // A SHORT IRON ARM, 0.08 m square, that runs from the chain's top (which stands 0.04 m inside the arm's end)
  // into the iron: into the purlin to within 0.17 m of its middle line each way, or up into the chord's middle
  // (as they hang with every watch kept: 17 arms, which reach 0.12 to 0.42 m from the iron's point to the chain's
  // top; their bars, written 0.04 m past the top, are 0.16 to 0.46 m long; 12 triangles each). So none passes through
  // iron or swings into the iron it hangs beside. No place is changed by this: only the chain's length (and with
  // it the swing's period and angle).
  const flatY = (zz, rr) => {              // the height at zz of the straight run between two stations (every 7.5 degrees) of the round of radius rr
    const d0 = Math.floor(Math.asin(zz / rr) / D2R / 7.5) * 7.5 * D2R, d1 = d0 + 7.5 * D2R, z0 = rr * Math.sin(d0), z1 = rr * Math.sin(d1);
    return S.cy + rr * (Math.cos(d0) + (Math.cos(d1) - Math.cos(d0)) * (zz - z0) / (z1 - z0));
  };
  const hangTop = (wt) => {
    const za = Math.abs(wt.z) + 0.03, glass = flatY(za, S.r) - 0.02, by = (yIron) => 0.28 + wt.swing * Math.max(0, glass - yIron) / (glass - wt.y);
    const hold = (v) => Math.max(-0.17, Math.min(0.17, v));
    let top = glass; wt.arm = null;
    for (let j = -11; j <= 11; j++) {
      // the purlin's square in its own frame (out along the round's radius, and across it); enter(zz, hh): the least
      // height over its middle at which the upright line at zz stands in the square of half side hh (or none)
      const d = j * 7.5 * D2R, cd = Math.cos(d), sd = Math.sin(d), zc = (S.r - 0.3) * sd, yc = S.cy + (S.r - 0.3) * cd, h = by(yc - 0.4);
      const enter = (zz, hh) => {
        const r0 = (zz - zc) * sd, t0 = (zz - zc) * cd; let lo = (-hh - r0) / cd, hi = (hh - r0) / cd;
        if (Math.abs(sd) > 1e-9) { const a = (t0 - hh) / sd, b = (t0 + hh) / sd; lo = Math.max(lo, Math.min(a, b)); hi = Math.min(hi, Math.max(a, b)); } else if (Math.abs(t0) > hh) return null;
        return lo <= hi ? lo : null;
      };
      const near = enter(wt.z, h); if (near === null) continue;
      // the iron itself on the chain's line (and at the ribbon's two edges, and at the square's lowest corner between them)
      const own = enter(wt.z, 0.25); let t = near;
      if (own !== null) {
        t = own; for (const s of [-0.03, 0.03]) { const q = enter(wt.z + s, 0.25); if (q !== null && q < t) t = q; }
        const zLow = zc - 0.25 * sd + 0.25 * Math.sign(sd) * cd; if (Math.abs(zLow - wt.z) <= 0.03) t = Math.min(t, -0.25 * (cd + Math.abs(sd)));
      }
      if (yc + t - 0.02 >= top) continue;
      top = yc + t - 0.02; wt.arm = null;
      if (own === null || own - t > 0.04) {
        const rr = hold((wt.z - zc) * sd + (top - yc) * cd), cc = hold((wt.z - zc) * cd - (top - yc) * sd);
        wt.arm = [wt.x, yc + rr * cd - cc * sd, zc + rr * sd + cc * cd];
      }
    }
    const foot = flatY(za, S.r - 2.2) - 0.02;
    for (let k = 0; k <= 14; k++) {
      const xr = Math.min(S.x0 + 16 * k, S.gableX - 0.6), dx = wt.x - xr; if (Math.abs(dx) > by(foot) || foot >= top) continue;
      top = foot; wt.arm = null;
      if (Math.abs(dx) > 0.25 || flatY(Math.abs(wt.z), S.r - 2.2) - foot > 0.06) wt.arm = [xr + hold(dx), flatY(Math.abs(wt.z), S.r - 2.05), wt.z];
    }
    return top;
  };
  let gathered = 0, least = Infinity, leastPost = Infinity, leastWatch = Infinity;
  n = 0;
  for (const wt of B.watches) {
    wt.top = hangTop(wt); wt.Lc = wt.top - wt.y; wt.d = B.planDist(wt.x, wt.z);
    // a chain's iron arm (see WHERE A CHAIN HANGS FROM), written into the shed's shell or its east end's
    if (wt.arm) {
      const q = wt.arm, v = [wt.x - q[0], wt.top - q[1], wt.z - q[2]], l = Math.hypot(v[0], v[1], v[2]), k = 1 + 0.04 / l, up = Math.abs(v[0]) > 1e-6 ? [0, 0, 1] : [1, 0, 0];
      (wt.x < 170 ? B.w.shd : B.w.shdE).bar([[q[0] + v[0] * k, q[1] + v[1] * k, q[2] + v[2] * k], q], [up, up], 0.08, 0.08, B.col.iron, true);
    }
    wt.sw = [wt.ph1, wt.t1, wt.ph2, 6 + 0.1 * wt.Lc]; wt.sw2 = [wt.Lc, wt.swing / wt.Lc, wt.az];
    least = Math.min(least, hangMargin(eyes, wt.x, wt.y, wt.z, wt.size));
    leastPost = Math.min(leastPost, postGap(posts, wt.x, wt.y, wt.top, wt.z, wt.size));
    for (const o of around(wt.x, wt.z)) if (o !== wt && o.kept) leastWatch = Math.min(leastWatch, watchGap(wt, o));
    if (wt.gathered) { const near = B.path.nearestXZ(wt.x, wt.z), sN = near.u * B.L; if (near.dist <= 26 && sN >= 258 && sN <= 335 && Math.abs(wt.y - B.path.posAtDist(sN, t).y) <= 12) gathered++; }
    if ((++n & 31) === 31) await B.ctx.yield();
  }
  B.gathered = gathered; B.sight.watches = Math.round(least * 100) / 100; B.sight.watchesMoved = moved;
  B.watchToPost = { margin: Math.round(leastPost * 100) / 100, moved: movedPost };
  B.watchToWatch = { margin: Math.round(leastWatch * 100) / 100, moved: movedWatch };
});
LAST.push(async (B) => {
  const c = B.col, groups = { near: [], middle: [], far: [] };
  for (const wt of B.watches) groups[wt.d < 10 ? 'near' : wt.d < 30 ? 'middle' : 'far'].push(wt);
  const geo = { near: watchGeometry(16, 4, c.brass, c.brassD), middle: watchGeometry(10, 3, c.brass, c.brassD), far: watchGeometry(8, 2, c.brass, c.brassD) };
  for (const wgt of ['near', 'middle', 'far']) {
    const list = groups[wgt]; if (!list.length) continue;
    const mats = list.map((wt) => B.dialMatrix(V3(wt.x, wt.y, wt.z), wt.facing, wt.R));
    const attrs = () => ({ aSw: { data: list.flatMap((wt) => wt.sw), size: 4 }, aSw2: { data: list.flatMap((wt) => wt.sw2), size: 3 } });
    const kd = { aKind: { data: list.map(() => B.enamel), size: 1 } };
    for (const im of [B.instanced(B.kitW[wgt].geometry, B.kitW[wgt].material, mats, { ...attrs(), ...kd }),
      B.instanced(geo[wgt], B.mat.watch, mats, attrs()),
      wgt === 'near' ? B.instanced(B.kitW.near.glassGeometry, B.kitW.near.glassMaterial, mats, { ...attrs(), ...kd }, 2) : null]) if (im) im.frustumCulled = false;
    B.count.watches = (B.count.watches || 0) + list.length;
    await B.ctx.yield();
  }
  // the chains: one ribbon each from its hanging place (the roof's glass, a purlin or a rib) to the bow, facing the eye
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  const all = B.watches;
  g.setAttribute('aTop', new THREE.InstancedBufferAttribute(new Float32Array(all.flatMap((wt) => [wt.x, wt.top, wt.z])), 3));
  g.setAttribute('aLen', new THREE.InstancedBufferAttribute(new Float32Array(all.map((wt) => wt.Lc - 1.68 * wt.R)), 1));
  g.setAttribute('aSw', new THREE.InstancedBufferAttribute(new Float32Array(all.flatMap((wt) => wt.sw)), 4));
  g.setAttribute('aSw2', new THREE.InstancedBufferAttribute(new Float32Array(all.flatMap((wt) => wt.sw2)), 3));
  g.instanceCount = all.length;
  const chains = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...B.fogU(), ...B.ENV, uBrass: { value: V3(c.brass[0], c.brass[1], c.brass[2]) } },
    vertexShader: CHAIN_VERT, fragmentShader: CHAIN_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  chains.frustumCulled = false; chains.renderOrder = 1; B.scene.add(chains); B.calls++; B.tris += 2 * all.length;
});

// ---------------------------------------------------------------------------------------------------------------
// THE POST CLOCKS, placed by the way: at every 14 m of route from 300 m to 398 m one stands 10 m from the line in
// plan, left and right by turns (the last, at 398 m, 16 m: postPair sets it out clear of the great hands); and
// 7 m of route after each, one stands 21 m off on the other side. Dials 3.4 m.
// One face of each head looks back along the way.
// THEIR HEIGHTS (postPair, postCap): a head's centre is asked at THE EYE'S HEIGHT at its station for the inner
// row, and 4 m over or under it for the outer row, higher and lower by turns on each side. A post stands so
// wherever it keeps 0.5 m outside the posts' own sight cone (radius 12 about the hub), and that is the south
// side's eight (the way runs south of the dial's axis there): their heads stand at 30.2 to 40.4 m. On the north
// side the cone holds every head lower, and there a head is held 0.5 m from the two great hands as well (as
// handBars takes them): the eight stand at 9.6 to 23.4 m, 10.5 to 31.3 m under the eye. A head stands on a
// fluted column over a foot of 6.6 m; the lowest (at 405 m) on a foot of 4.57 m alone.
// ---------------------------------------------------------------------------------------------------------------
// a post clock's head, its centre at the origin: an iron cube 4.3 m with a turned roundel round each dial, corner
// columns, bosses, dentils, gablets and scroll brackets, a cornice, a four-sided roof with a finial, a turned neck
function postHeadGeometry(c) {
  const w = mkW();
  w.box(-2.15, -2.15, -2.15, 2.15, 2.15, 2.15, c.iron);
  for (let k = 0; k < 4; k++) {
    const dir = V3(Math.sin(k * Math.PI / 2), 0, Math.cos(k * Math.PI / 2));
    turned(w, dir.clone().multiplyScalar(2.15), dir, [[2.08, 0], [2.08, 0.2], [1.9, 0.32], [1.72, 0.22]], 20, (i) => [c.ironD, c.ironL, c.iron][i]);
    const cx = 2.22 * (Math.sin(k * Math.PI / 2) + Math.cos(k * Math.PI / 2)), cz = 2.22 * (Math.cos(k * Math.PI / 2) - Math.sin(k * Math.PI / 2));
    w.lathe([[0.2, -2.35], [0.32, -2.1], [0.19, -1.9], [0.19, 1.9], [0.32, 2.1], [0.2, 2.35]], 6, (i) => (i === 2 ? c.ironL : c.brassD), cx, cz);
    // on each face: four spandrel bosses, a row of dentils under the cornice, a low gablet over it; a scroll bracket under each corner
    const side = V3(dir.z, 0, -dir.x), at = (u, y, o) => [dir.x * o + side.x * u, y, dir.z * o + side.z * u];
    for (const [u, y] of [[-1.78, -1.78], [1.78, -1.78], [-1.78, 1.78], [1.78, 1.78]]) turned(w, V3(...at(u, y, 2.15)), dir, [[0.24, 0], [0.17, 0.1], [0, 0.14]], 6, c.brassD);
    for (let j = 0; j < 8; j++) { const u = -1.75 + j * 0.5, a = at(u - 0.14, 1.93, 2.15), b = at(u + 0.14, 2.15, 2.3); w.box(Math.min(a[0], b[0]), 1.93, Math.min(a[2], b[2]), Math.max(a[0], b[0]), 2.15, Math.max(a[2], b[2]), c.ironL, 'y+'); }
    w.tri(at(-1.9, 2.5, 2.56), at(1.9, 2.5, 2.56), at(0, 3.45, 2.56), c.ironL);
    w.quad(at(-1.9, 2.5, 2.56), at(0, 3.45, 2.56), at(0, 3.45, 1.2), at(-1.9, 2.5, 1.9), c.iron); w.quad(at(1.9, 2.5, 2.56), at(0, 3.45, 2.56), at(0, 3.45, 1.2), at(1.9, 2.5, 1.9), c.ironD);
    turned(w, V3(...at(0, 2.82, 2.56)), dir, [[0.2, 0], [0.14, 0.08], [0, 0.12]], 6, c.brass);
    const pts = [], ups = [], dg = V3(dir.x + side.x, 0, dir.z + side.z).normalize();
    for (let i = 0; i <= 5; i++) { const t = i / 5 * Math.PI / 2, o = 0.75 + 2.1 * Math.sin(t), y = -2.5 - 2.0 * Math.cos(t); pts.push([dg.x * o, y, dg.z * o]); ups.push([dg.x * Math.cos(t), Math.sin(t), dg.z * Math.cos(t)]); }
    w.bar(pts, ups, 0.24, 0.2, c.ironL);
  }
  w.box(-2.55, 2.15, -2.55, 2.55, 2.5, 2.55, c.ironL); w.box(-2.4, -2.45, -2.4, 2.4, -2.15, 2.4, c.ironL);
  const q = Math.SQRT2;
  w.lathe([[2.45 * q, 2.5], [2.2 * q, 2.95], [1.25 * q, 3.7], [0.5 * q, 4.6], [0.3 * q, 5.0]], 4, (i) => (i % 2 ? c.iron : c.ironD), 0, 0, Math.PI / 4, Math.PI / 4 + TAU);
  w.lathe([[0.38, 5.0], [0.62, 5.3], [0.26, 5.6], [0.52, 6.0], [0.13, 6.4], [0.1, 7.3], [0, 7.7]], 8, c.brass);
  w.lathe([[0.55, -5.0], [0.72, -4.6], [0.6, -4.2], [1.2, -3.25], [2.25, -2.6], [2.4, -2.45]], 12, (i) => [c.ironL, c.iron, c.ironD, c.iron, c.ironL][i]);
  return w.geometry();
}
// a post clock's foot, 6.6 m tall, on the floor: an eight-sided turned pedestal with four brass bosses
function postBaseGeometry(c) {
  const w = mkW();
  w.lathe([[1.95, 0], [1.95, 0.8], [1.62, 1.0], [1.5, 2.7], [1.72, 2.95], [1.72, 3.2], [1.1, 3.8], [0.92, 5.3], [1.2, 5.55], [1.2, 5.75], [0.75, 6.3], [0.62, 6.6]], 8,
    (i) => [c.ironD, c.iron, c.iron, c.ironL, c.ironD, c.iron, c.iron, c.ironL, c.ironD, c.iron, c.ironL][i], 0, 0, Math.PI / 8, Math.PI / 8 + TAU);
  for (let k = 0; k < 4; k++) turned(w, V3(1.5 * Math.sin(k * Math.PI / 2), 1.85, 1.5 * Math.cos(k * Math.PI / 2)), V3(Math.sin(k * Math.PI / 2), 0, Math.cos(k * Math.PI / 2)), [[0.5, 0], [0.4, 0.14], [0, 0.2]], 8, c.brassD);
  return w.geometry();
}
// the fluted shaft, one metre tall (it is scaled to its height): twelve faces, alternately light and dark, two rings
function postShaftGeometry(c) {
  const w = mkW(), prof = [[0.62, 0], [0.57, 0.02], [0.545, 0.33], [0.5, 1.0]];
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < 12; i++) {
    const a0 = i / 12 * TAU, a1 = (i + 1) / 12 * TAU, [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
    w.quad([r0 * Math.cos(a0), y0, r0 * Math.sin(a0)], [r0 * Math.cos(a1), y0, r0 * Math.sin(a1)], [r1 * Math.cos(a1), y1, r1 * Math.sin(a1)], [r1 * Math.cos(a0), y1, r1 * Math.sin(a0)], i % 2 ? c.iron : c.ironD);
  }
  w.lathe([[0.68, 0.33], [0.68, 0.345], [0.56, 0.35]], 12, c.ironL); w.lathe([[0.64, 0.66], [0.64, 0.675], [0.54, 0.68]], 12, c.ironL);
  return w.geometry();
}
STEPS.push(async (B) => {
  const c = B.col, heads = [], bases = [], shafts = [];
  B.posts = [];
  let coneLeast = Infinity, handLeast = Infinity, beforeHands = 0;
  const place = ({ x, y: yh, z, yaw, weight, cone, off, held, hands }) => {
    coneLeast = Math.min(coneLeast, cone);
    if (held) handLeast = Math.min(handLeast, hands); else if (hands < 0) beforeHands++;
    // the foot is 6.6 m tall, or as tall as the head's own foot (5.0 m under its centre) leaves; the column fills the rest
    const foot = Math.min(6.6, yh - 5.0);
    heads.push(new THREE.Matrix4().makeRotationY(yaw).setPosition(x, yh, z));
    bases.push(new THREE.Matrix4().makeScale(1, foot / 6.6, 1).setPosition(x, 0, z));
    if (yh - 5.0 - foot > 0.05) shafts.push(new THREE.Matrix4().makeScale(1, yh - 5.0 - foot, 1).setPosition(x, foot, z));
    for (let k = 0; k < 4; k++) {
      const f = V3(Math.sin(k * Math.PI / 2), 0, Math.cos(k * Math.PI / 2)).applyAxisAngle(V3(0, 1, 0), yaw);
      B.addDial(x < 170 ? 'shd' : 'shdE', weight, V3(x, yh, z).addScaledVector(f, 2.4), f, 1.7, B.enamel, 'post clock faces');
    }
    B.floorU.uPosts.value[B.posts.length].set(x, z, yh, 2.3);
    B.posts.push({ x, y: yh, z, off });
  };
  await B.ctx.yield();
  for (const p of postPlan(B)) place(p);
  await B.ctx.yield();
  B.sight.posts = Math.round(coneLeast * 100) / 100; B.sight.postsToHands = Math.round(handLeast * 100) / 100; B.sight.postsBeforeHands = beforeHands;
  B.late.push(async () => {
    B.instanced(postHeadGeometry(c), B.mat.solid, heads); B.instanced(postBaseGeometry(c), B.mat.solid, bases); B.instanced(postShaftGeometry(c), B.mat.solid, shafts);
    B.moving['post clocks (standing)'] = heads.length;
  });
  await B.ctx.yield();
  // ALONG THE SHED'S SIDE WALLS, low: work benches with their dressing, crates, and standing regulators (the court's
  // longcase clock at 1.2 times its size). The density hint thins the dressing and the crates only.
  const w = B.w.shd, wE = B.w.shdE, rng = B.rng.fork('benches'), dens = Math.min(1, B.density);
  for (const s of [-1, 1]) for (let k = 0; k < 14; k++) {
    const x0 = SHD.x0 + 16 * k, ww = k < 7 ? w : wE, z = s * 50.5, zi = s * 48.9, zo = s * 52.1, kind = (k + (s > 0 ? 1 : 0)) % 3;
    const r = [rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng()];
    if (kind === 0) {
      // a work bench 9 m long and 3.6 m high (top, apron with three drawers, legs, a shelf) with its dressing
      const xa = x0 + 4, xb = x0 + 13, top = mulc(c.woodL, 1.1), leg = c.woodD;
      ww.box(xa, 3.3, Math.min(zi, zo), xb, 3.6, Math.max(zi, zo), top); ww.box(xa + 0.2, 2.6, Math.min(zi, zo) + 0.15, xb - 0.2, 3.3, Math.max(zi, zo) - 0.15, leg, 'y+');
      for (let j = 0; j < 3; j++) { ww.box(xa + 0.6 + j * 2.75, 2.72, zi - s * 0.03 - 0.03, xa + 2.9 + j * 2.75, 3.2, zi - s * 0.03 + 0.03, c.woodL); turned(ww, V3(xa + 1.75 + j * 2.75, 2.96, zi - s * 0.06), V3(0, 0, -s), [[0.1, 0], [0.07, 0.1], [0, 0.12]], 6, c.brass); }
      for (const xl of [xa + 0.3, xb - 0.6]) for (const zl of [zi + s * 0.2, zo - s * 0.5]) ww.box(xl, 0, Math.min(zl, zl + s * 0.3), xl + 0.3, 2.6, Math.max(zl, zl + s * 0.3), leg, 'y-y+');
      ww.box(xa + 0.3, 0.7, Math.min(zi, zo) + 0.2, xb - 0.3, 0.85, Math.max(zi, zo) - 0.2, leg);
      for (let j = 0; j < 4; j++) {
        if (r[j] > dens * 0.85) continue;
        const xj = xa + 1.2 + j * 2.2, zj = z + (r[j + 4] - 0.5) * 1.2;
        if (j % 2) { B.balances.push({ m: B.dialMatrix(V3(xj, 3.95, zj), V3(0, 1, 0), 0.5, V3(1, 0, 0)), sw: [r[j] * 40, 1.7 + r[j + 4], 1.3] }); turned(ww, V3(xj, 3.6, zj), V3(0, 1, 0), [[0.55, 0], [0.55, 0.1], [0.07, 0.14], [0.06, 0.36]], 8, c.brassD); }
        else ww.box(xj - 0.7, 3.6, zj - 0.4, xj + 0.7, 4.3 + 0.5 * r[j + 4], zj + 0.4, j ? c.ironD : c.woodD, 'y-');
      }
    } else if (kind === 1) {
      const n = 1 + Math.round(2 * dens * r[0]);
      for (let j = 0; j < n; j++) {
        // a crate: a plank box, banded
        const xc = x0 + 3.6 + j * 3.8, sz = 1.3 + 0.5 * r[1 + j], yb = 0, tone = mulc(c.woodL, 0.9 + 0.3 * r[4 + j]);
        ww.box(xc - sz, yb, z - sz, xc + sz, yb + 2 * sz, z + sz, tone, 'y-');
        for (const yy of [0.4, 2 * sz - 0.6]) ww.box(xc - sz - 0.05, yy, z - sz - 0.05, xc + sz + 0.05, yy + 0.22, z + sz + 0.05, c.woodD, 'y-y+');
      }
    } else {
      // a standing regulator, facing the shed
      const f = V3(0, 0, -s), q = V3(x0 + 8, 0, s * 51.5), wt = B.planDist(q.x, q.z) < 30 ? 'middle' : 'far';
      (wt === 'middle' ? B.longNear : B.longFar).push(B.dialMatrix(q, f, 1.2));
      B.longTone[wt === 'middle' ? 'near' : 'far'].push(new THREE.Color().setRGB(c.longWoods[0][0], c.longWoods[0][1], c.longWoods[0][2]).lerp(new THREE.Color().setRGB(c.longWoods[1][0], c.longWoods[1][1], c.longWoods[1][2]), r[0]));     // (between the longcase's two deeper woods)
      B.addDial(k < 7 ? 'shd' : 'shdE', wt, V3(q.x, 6.85 * 1.2, q.z).addScaledVector(f, 0.8), f, 0.96, B.enamel, 'standing regulators');
      addPendulum(B, B.pendsLong, V3(q.x, 5.49 * 1.2, q.z).addScaledVector(f, 0.03), f, 3.3 * 1.2, rng, 0.12, 0.13);
    }
  }
  await B.ctx.yield();
  // DUST: fine specks (0.0024 to 0.0048 m) in the air within 18 m of the flown line in plan, from the floor to 12 m over
  // the eye. They are lit by the sun alone (DUST_VERT), so they stipple the sun's shafts and are absent from shade.
  // Their places are laid along the line from 485 samples of it (one a metre). NONE IS DEALT WITHIN 6 M OF THE LINE
  // (measured to the line sampled every half metre and at its very end): a place dealt nearer is left out, so about
  // one in seven is. Between two samples the line bows less than a millimetre from the straight, so a place that is
  // left stands 5.993 m from the line or more; a speck drifts at most 1.45 m about its place (0.9, 0.7 and 0.9 m
  // along the three axes), so none comes nearer the eye than 4.54 m.
  const N = Math.round(240000 * B.detail), pos = new Float32Array(N * 3), seed = new Float32Array(N * 4), dr = B.rng.fork('dust'), q = new THREE.Vector3();
  const nS = Math.ceil(B.L), line = new Float32Array((nS + 1) * 3);
  for (let i = 0; i <= nS; i++) { B.path.posAtDist(Math.min(B.L, i), q); line[i * 3] = q.x; line[i * 3 + 1] = q.y; line[i * 3 + 2] = q.z; }
  // the line's half-metre samples (and its very end) in one list; a plan grid of 8 m cells lists, for each cell,
  // every fourth sample (and the last) within 7 m of it in plan. A place within 6 m of some sample is within 7 m of
  // the listed sample next to it (never more than two samples, 1 m of line, away), so a place is tested against
  // the listed samples to 7 m and, where one is that near, against the five samples about it to 6 m: the same
  // places are left out as by testing every sample.
  const GX0 = -80, GZ0 = -80, GC = 8, GNX = 48, GNZ = 28, lists = Array.from({ length: GNX * GNZ }, () => []);
  const nF = Math.ceil(B.L / 0.5), fine = new Float32Array((nF + 1) * 3);
  for (let i = 0; i <= nF; i++) {
    B.path.posAtDist(Math.min(B.L, 0.5 * i), q); fine[i * 3] = q.x; fine[i * 3 + 1] = q.y; fine[i * 3 + 2] = q.z;
    if (i % 4 && i !== nF) continue;
    for (let cx = Math.floor((q.x - 7 - GX0) / GC); cx <= Math.floor((q.x + 7 - GX0) / GC); cx++) for (let cz = Math.floor((q.z - 7 - GZ0) / GC); cz <= Math.floor((q.z + 7 - GZ0) / GC); cz++) lists[cz * GNX + cx].push(i);
  }
  const cells = lists.map((a) => new Int32Array(a));
  await B.ctx.yield();
  let M = 0;
  for (let i = 0; i < N; i++) {
    const k = Math.min(nS, Math.floor(dr() * (nS + 1))) * 3;
    const px = line[k] + (dr() - 0.5) * 36, py = Math.max(0.5, line[k + 1] - 12 + dr() * 24), pz = line[k + 2] + (dr() - 0.5) * 36;
    const s0 = dr(), s1 = dr(), s2 = dr(), s3 = 0.0024 + 0.0024 * dr();
    let near = false;
    const cl = cells[Math.floor((pz - GZ0) / GC) * GNX + Math.floor((px - GX0) / GC)];
    for (let j = 0; j < cl.length && !near; j++) {
      const c = cl[j], c3 = c * 3, dx = px - fine[c3], dy = py - fine[c3 + 1], dz = pz - fine[c3 + 2];
      if (dx * dx + dy * dy + dz * dz >= 49) continue;
      for (let f = Math.max(0, c - 2), f1 = Math.min(nF, c + 2); f <= f1; f++) {
        const ex = px - fine[f * 3], ey = py - fine[f * 3 + 1], ez = pz - fine[f * 3 + 2];
        if (ex * ex + ey * ey + ez * ez < 36) { near = true; break; }
      }
    }
    if (!near) { pos[M * 3] = px; pos[M * 3 + 1] = py; pos[M * 3 + 2] = pz; seed[M * 4] = s0; seed[M * 4 + 1] = s1; seed[M * 4 + 2] = s2; seed[M * 4 + 3] = s3; M++; }
    if (i % 4000 === 3999) await B.ctx.yield();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, M * 3), 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(seed.subarray(0, M * 4), 4));
  B.dustCount = M;
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: { ...B.ENV }, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  dust.frustumCulled = false; dust.renderOrder = 3; B.scene.add(dust); B.calls++;
  await B.ctx.yield();
});

// ---------------------------------------------------------------------------------------------------------------
// THE COUNTS OF CLEAR AIR: the least distance from the flown line, sampled every 0.25 m, to each class of thing on
// its built place and over its whole sweep (metres of clear air: the thing's own size is taken off). Into info.
// ---------------------------------------------------------------------------------------------------------------
LAST.push(async (B) => {
  const L = B.L, n = Math.ceil(L / 0.25), P = new Float32Array((n + 1) * 3), v = new THREE.Vector3(), air = B.air;
  for (let i = 0; i <= n; i++) { B.path.posAtDist(Math.min(L, i * 0.25), v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; }
  const idx = (s) => Math.max(0, Math.min(n, Math.round(s / 0.25)));
  const note = (cls, d) => { if (air[cls] === undefined || d < air[cls]) air[cls] = d; };
  // least distance from the samples i0..i1 to the segment a-b (a point when b is a)
  const dSeg = (a, b, i0 = 0, i1 = n) => {
    const ex = b[0] - a[0], ey = b[1] - a[1], ez = b[2] - a[2], ee = ex * ex + ey * ey + ez * ez; let best = Infinity;
    for (let i = i0; i <= i1; i++) {
      const px = P[i * 3] - a[0], py = P[i * 3 + 1] - a[1], pz = P[i * 3 + 2] - a[2];
      const t = ee > 0 ? Math.max(0, Math.min(1, (px * ex + py * ey + pz * ez) / ee)) : 0, dx = px - ex * t, dy = py - ey * t, dz = pz - ez * t, d = dx * dx + dy * dy + dz * dz;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  // the great pendulum over its whole sweep, 81 angles: the bob as a ball of radius 5 about its centre (its lens is
  // thinner) and the rating nut under it (0.8 about the rod's line, to 7.2 m beyond the bob's centre); the rod from
  // the bearing to the bob's centre with its greatest radius 0.6
  for (let k = 0; k <= 80; k++) {
    const th = PEN.amp * (k / 40 - 1), sn = Math.sin(th), cs = Math.cos(th), bob = [PEN.len * sn, PEN.pivotY - PEN.len * cs, 0];
    note('pendulum bob', dSeg(bob, bob, 0, idx(300)) - PEN.bobR); note('pendulum rod', dSeg([0, PEN.pivotY, 0], bob, 0, idx(300)) - 0.6);
    note('pendulum bob', dSeg(bob, [(PEN.len + 7.2) * sn, PEN.pivotY - (PEN.len + 7.2) * cs, 0], 0, idx(300)) - 0.8);
  }
  await B.ctx.yield();
  // watches: the chain's line from its top down to the dial's height, with the watch's size as the plan takes it
  // (watchSize: its ball and the reach of its swing) taken off
  let plan = Infinity, i = 0;
  for (const wt of B.watches) {
    note('watches with their chains', dSeg([wt.x, wt.top, wt.z], [wt.x, wt.y, wt.z], idx(235), n) - wt.size);
    plan = Math.min(plan, wt.d);
    if ((++i & 63) === 0) await B.ctx.yield();
  }
  air['watch chains, in plan'] = plan;
  // post clocks: every part of POST_PARTS (head, brackets, roof, finial) and the column with its foot
  for (const p of B.posts) {
    for (const [y0, y1, r] of POST_PARTS) note('post clocks', dSeg([p.x, p.y + y0, p.z], [p.x, p.y + y1, p.z], idx(250), n) - r);
    note('post clocks', dSeg([p.x, 0, p.z], [p.x, p.y + POST_FOOT[0], p.z], idx(250), n) - POST_FOOT[1]);
  }
  // a clock of the walls of clocks: a cylinder standing on its wall (centre on the wall, the wall's normal, its
  // radius, how far it stands proud): the distance to its nearest point
  const dCyl = ([cc, nn, rad, proud]) => {
    let best = Infinity;
    for (let i = 0; i <= idx(300); i++) {
      const px = P[i * 3] - cc.x, py = P[i * 3 + 1] - cc.y, pz = P[i * 3 + 2] - cc.z, hh = px * nn.x + py * nn.y + pz * nn.z;
      const q = Math.sqrt(Math.max(0, px * px + py * py + pz * pz - hh * hh)), d = Math.hypot(Math.max(0, q - rad), Math.max(0, Math.abs(hh) - proud));
      if (d < best) best = d;
    }
    return best;
  };
  { let k = 0;
    for (const it of B.airItems || []) {
      if (!it.ring) note(it.cls, it.cyl ? dCyl(it.cyl) : (it.seg ? dSeg(it.seg[0], it.seg[1], 0, idx(300)) : dSeg(it.p, it.p, 0, idx(300))) - it.r);
      if ((++k & 63) === 0) await B.ctx.yield();
    } }
  await B.ctx.yield();
  // gallery fronts: the fascia and balustrade (from 1.1 m under each deck to 1.7 m over it) at radius 57, every half degree
  for (const [a0, a1] of GALLERY_ZONES) {
    for (const y of CRT.decks) for (let a = a0; a <= a1; a += 0.5) { const q = pol(57, a, 0); note('gallery fronts and columns', dSeg([q[0], y - 1.1, q[2]], [q[0], y + 1.7, q[2]], idx(40), idx(270)) - 0.2); }
    await B.ctx.yield();
  }
  // the great dial's hands at every angle (5 degree steps): the collar's ring (radius 9.56) and the blade to its point
  for (const [key, xh] of [['minute', SHD.gableX - GREAT.minute.z], ['hour', SHD.gableX - GREAT.hour.z]]) for (let a = 0; a < 360; a += 5) {
    const s = Math.sin(a * D2R), c = Math.cos(a * D2R), h = GREAT[key];
    note('great hands, every angle', dSeg([xh, 44 + 9.56 * c, 9.56 * s], [xh, 44 + h.tip * c, h.tip * s], idx(400), n) - 0.3);
  }
  // everything else: floors, the passage's walls (cornice 1.1 m proud), the court's ranks (radius 62.2), the east
  // arch's jambs and soffit, the shed's walls, and the great dial's boss (bore radius 6.6)
  for (let k = 0; k <= n; k++) {
    const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2], r = Math.hypot(x, z);
    let d = y;
    const ang = (Math.atan2(z, x) / D2R + 360) % 360, ranks = GALLERY_ZONES.some(([a0, a1]) => ang >= a0 && ang <= a1);
    if (x > 62) d = Math.min(d, SHD.z - 1.5 - Math.abs(z), x > SHD.gableX - 2.7 ? GREAT.bossIn - Math.hypot(y - 44, z) : Infinity);
    else if (r < 64.5 && ranks) d = Math.min(d, 62.2 - r);                                       // before a rank of longcase clocks
    else if (z > 0 && ang > 82 && ang < 138) d = z > 58 ? Math.min(d, x - (PAS.x0 + 1.1), PAS.x1 - 1.1 - x) : d;   // in the passage and its mouth; before the mouth, inside the court, only the floor
    else if (x > 0 && (ang < 50 || ang > 310)) d = Math.min(d, x > 53.5 ? CRT.archHalf - (y > CRT.archSpring ? Math.hypot(z, y - CRT.archSpring) : Math.abs(z)) - 0.65 : Infinity);   // between the east arch's jambs (they stand from x 54.2 to 58) and under its soffit
    else d = Math.min(d, 64 - r);                                                                // before a blind arch
    note('everything else', d);
  }
  for (const k in air) air[k] = Math.round(air[k] * 100) / 100;
});
