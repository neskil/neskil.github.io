// flavian-amphitheatre, THE WORLD: Rome's new amphitheatre on a morning of its opening games in the year 80, about the
// third hour, its arena flooded. The flight comes in level over a temple's terrace on the hill south of the building,
// out over the terrace's front beside a market way under pines, up beside the sunlit wall's south-east quarter, round
// over the east gate and the mast heads, and down through the awning's open eye along the long axis, over boats and
// wading horses, to the ring. The part (src/parts/flavian-amphitheatre.js) builds the building, the seating with
// its people and the arena's life; this file builds the valley, the water's surface, the light and the flight.
// THE NAME in this file is a plain working name; the owner sets the title that is shown at the release.
//
// TWO FILES. The part holds three sections, each with its own head: the building (the wall, the rig, the bowl's stone
// that carries nobody), THE SEATING AND ITS PEOPLE and THE ARENA'S LIFE ON THE WATER. What the three hold in common
// (the light's one law, the uniforms, the water's hook) is the one opts object this file hands to the part.
//
// AXES: one unit is one metre, +Y up; the building's centre is x 0, z 0; its LONG AXIS lies on X; +X is the EAST GATE
// END (compass bearing 110), -X the west gate end; +Z is bearing 200 (the Caelian side), -Z bearing 20 (the Oppian
// side and the Baths). y 0 is the pavement round the building and the arena's floor level.
//
// WHAT IS SURE, ARGUED, UNKNOWN, INVENTED (the building's own list stands at the head of the part; "the research" is
// design/sw/research/amphitheatre-building.md, cited by its paragraphs). Of this file:
//  SURE that they stood in 80 (Suetonius, Martial; dug up): the new Baths on the Oppian slope and the old palace wing
//    east of them. OF THE TEMPLE ON ITS TERRACE ON THE CAELIAN THE TERRACE RESEARCH SAYS LESS THAN SURE
//    (design/sw/research/amphitheatre-terrace-answer.txt, P1 and P2): a Flavian temple and precinct stood, or was
//    building, in 80 (Suetonius, Vespasian 9); THE YEAR OF ITS DEDICATION AND HOW MUCH OF IT WAS FINISHED BY 80 ARE
//    UNKNOWN (it is shown finished, by our choice). The Baths' and the terrace's places are the research's estimates
//    from modern maps (7.20, 7.24); THE OLD PALACE WING'S PLACE IS OURS (7.22 says only: east of the Baths). The
//    pavement of travertine 17.5 m wide round the building and its row of stone posts are DUG UP (five posts stand);
//    WHETHER THE BAND AND ITS POSTS WERE FINISHED IN THE YEAR 80 IS UNKNOWN (2.22).
//  ARGUED: THE WATER. It is ONE writer's tale: Cassius Dio 66.25, writing more than a century later, in an
//    abridgement, says that at the opening this arena was filled with water, and that horses and bulls and other tame
//    beasts taught to move in it were brought in, and people on ships (he tells them in that order); no other ancient
//    writer says it of this building in that year and scholars still argue it. Shallow (1.0 m here; one author: not
//    above 1.2 m; others up to 1.5 m). THAT THE ANIMALS AND THE BOATS ARE ON THE WATER AT ONE TIME IS OURS, A JOINING
//    of two shows the source tells one after the other (the owner's words of 14:17; it goes in no caption, text or
//    card as fact).
//  UNKNOWN: whether an awning was rigged at the opening (shown, by our choice: the part's head); the terrace's floor's
//    level in the year 80, its walls' heights, the temple's place on it (ITS SIZE IS NOT WHOLLY UNKNOWN: it is
//    RECONSTRUCTED, said below at THE ENTRY OVER THE TERRACE); what stood on the slopes and on the open ground in the
//    year 80, and where trees stood (7.34).
//  INVENTED, each by name (none goes in a caption, a text or a card as a fact; the whole list is the world's own list
//    of invented things). THE OWNER'S RULING OF 13:14: what gives a form, a number or a colour to a thing the research
//    has as attested or dug up is INVENTED BY NEED (of this file: the water's level, ledge, floor, ripples and glints;
//    the pavement's slabs); the rest of this list is INVENTED, OURS (the day, the terrace and the temple's place and
//    forms, the open ground and its basalt, the market, the pines, the town, the people outside, the litters, the
//    hills' buildings, the far city and the fields beyond it); THE ALTAR is INVENTED BY NEED (the owner's word).
//    THE SEASON, THE DAY, THE HOUR AND THE WEATHER (a fair morning about midsummer, the third hour, a deep blue sky
//    with a few large clouds, a light wind); THE SUN'S PLACE (bearing 86 to 88, 32.0 to 34.4 degrees up by the visit:
//    the range for a third hour of summer; in it every arch, cornice and mast of the south-east wall throws its
//    shade; inside, the sun comes over the east wall and through the awning's eye from behind the lens: its open
//    patch lies on the west half of the water and on the west seating behind the ring, which stands in FULL SUN down
//    to the water (the cloths' dyed light above it; the east stands under the lens lie in the wall's shade));
//    THE ENTRY OVER THE TERRACE ("the terrace research" is design/sw/research/amphitheatre-terrace-answer.txt; its
//    words RECONSTRUCTED, DUG, DISPUTED, UNKNOWN are kept). THE TERRACE'S SIZE IS NOT WHOLLY UNKNOWN: it is
//    RECONSTRUCTED as 177.6 by 199.8 m (about 180 by 200 m; a restitution on the map, not a dig) FOR ITS FINAL,
//    PROBABLY VESPASIANIC STATE (the first state about 156 by 182.5 m; whether the widening was finished by 80 is
//    UNKNOWN), THE SHORT SIDE TOWARD THE AMPHITHEATRE. OURS IS 175 m wide by 260 m deep: the width inside the plans'
//    scatter, THE DEPTH 60 m MORE THAN THE RESTITUTION, OURS (the line, the walk and the rows are solved on it); its
//    floor's height (16.2 m over the pavement) is OURS. THE TERRACE'S BEARING IS OURS: the research has the north
//    front facing about bearing 339 (its own measure off the modern map); ours is squared to the building's axes, its
//    valley face toward bearing 20: about 41 degrees off. THE FRONT'S PLACE IS OURS, said by one measure, from the
//    amphitheatre's outer wall: AS DUG the front stood HIGH ON THE SLOPE, the rooms' front about 81 m from the outer
//    wall and the back wall about 91 to 97 m; OURS STANDS AT THE SLOPE'S FOOT, one wall to the valley floor: its
//    nearest point (its west corner) about 65 m from the outer wall, its middle about 109 m, its east corner about 176
//    m: nearer than the dug front at its west end, farther along most of its length (the wall's line carried to the
//    short axis, where the terrace does not stand, lies 39.5 m from the pavement's edge). THE VALLEY FACE IS ONE LONG
//    PLAIN CLOSED BRICK WALL (the terrace research has the front, RECONSTRUCTED on dug evidence, as a long plain
//    closed brick wall): brick-faced and coursed (the world's own wall kind and its courses, in the world's own fired
//    clay tone, the roofs' tiles': no tone is typed for it), no fountain, no basin, no prow, no upper storey; THAT IT
//    HAS NO OPENING IS OURS (whether the front wall had any is UNKNOWN in the research); ITS HEIGHT is the terrace's
//    own, UNKNOWN in the research, OURS; NO PICTURE OF THE FLOWN LINE SHOWS A DOT OF IT, OF THE LAW: the wall's face,
//    as points half a metre apart, is put through the lens at every quarter metre of the line (1,446 places) with the
//    sweeping camera and with the steady one, at 16:9 and at 21:9, and no place has a point of it in the picture (the
//    count's paper: shots/flavian-amphitheatre/p1d/counts/W12-the-valley-face-in-no-picture.txt). THE NORTH SIDE'S
//    ROOMS AS WATER TANKS are an old reading, not a find: no water and no tank is built. THE BRICK AS DRAWN ON THE
//    WALL: the wall kind's own courses and weather and, over them, THE BRICK'S OWN COURSES by the world's law of
//    coursed blocks (staggered, a tone of its own to each brick, the joints melted where one is under a pixel): A
//    BRICK IS DRAWN 0.60 m LONG AND A COURSE 0.30 m HIGH: THE WORLD'S OWN LAW OF COURSED WALLS AT THAT MEASURE, FAR
//    LARGER THAN A ROMAN BRICK, OURS (no reason of sight is given for the measure: no picture of the flown line shows
//    the wall). THE ONE BRICK BLOCK BEFORE THE FRONT IS NOT SHOWN (the owner's ruling of 13 Oct 2026). The dig found
//    one three storey brick block before the north front: in plan ABOUT 13 m along the front by ABOUT 12 m outward,
//    ABOUT 7.8 m before the front wall, its middle ABOUT 81.5 m west of the terrace's north-east corner (the research
//    thread's scaling of the published plans; every figure of it is ABOUT), its faces about 60 and 72 m from the
//    amphitheatre's outer wall. NOT SHOWN: its height, its top and its openings are UNKNOWN, and a plain closed box in
//    its place would be our invention; it is built only when the research gives a height or a roof. THE PATCH THE OPEN
//    GROUND'S CROWDS KEEP OFF (the part's CROWD.DUG in groundPlan) IS NOT THE DUG PLACE: it is the dug block's plan
//    (about 13 by 12 m) set before OUR front by the research's two offsets: x 140.5 to 153.5, z 115.2 to 127.2, about
//    99 and 107 m from the outer wall where the research has the block about 60 and 72 m from it. Our front stands
//    where it stands (OURS), so the patch is OURS: a rule of where the crowds stand, and NOTHING IS BUILT ON IT. THE
//    GATHERINGS, THE SINGLE KNOTS AND THE FANS' WAYS KEEP OFF IT (OF THE LAW, seeds 1 to 40: no figure of the crowds'
//    own stands on it or crosses it). THE MARKET'S OWN DO NOT: three stalls of its east row (numbers 0, 1 and 2) stand
//    on it, its way's first 4 m run through it and its way's walkers and standers go and stand there (about 181
//    walkers and 9 standers a seed). A STREAM THAT FINDS NO CLEAR WAY IN EIGHT TRIES KEEPS ITS OWN LINE ACROSS IT (A
//    RATE: on 4 of seeds 1 to 40, the seeds 13, 16, 17 and 19, 45 to 106 walkers of one stream from a lane's mouth),
//    AND THE CARRIED LITTERS ARE NOT LAID ANEW (one crosses it on seeds 13 and 17). THE EAST FACE IS A PLAIN WALL,
//    WHICH IS OURS, UNLIKE THE EXCAVATED REMAINS. WHAT WAS DUG THERE: a niched brick wall of Nero's time, its niched
//    stretch 167 m long, with SEVEN GREAT RECESSES from north to south (half-round, square, half-round, a larger
//    square hall with an apse, then the mirror: half-round, square, half-round) and small half-round niches in two
//    rows between them; their widths and heights are UNKNOWN in the research, so none is built. The two rows of arches
//    in the terrace's WEST wall are dug up. THE TEMPLE WAS NEVER FOUND: its facing is DISPUTED (north by the older
//    reading, west by the reading since 1960), its place on the terrace is UNKNOWN and its measures are calculations:
//    OURS STANDS AT THE FRONT AND FACES THE VALLEY, OURS, with every form of it (six by eleven fluted columns, bases,
//    capitals, the entablature, the room's coursed wall, a great door). A PORTICO ON THE TERRACE IS AN ANCIENT TEXT
//    (Martial) that gives it no form: OUR THREE COLUMNED WALKS along the east, west and back sides ARE OURS. A PLAIN
//    ALTAR BLOCK before the temple's stair with a thin smoke (nobody at it, nothing on it), the walk and its row of
//    cypresses, the beds, the parapet. THE TERRACE'S PEOPLE (INVENTED, OURS): plain far figures of the world's own
//    kind in loose knots at the parapet, before the temple and in its porch, on the front walk, in the three columned
//    walks, on the garden's gravel paths and in the walk round the temple's room (by the day's fullness: 441 to 729 a
//    visit on seeds 1 to 40, OF THE LAW; none nearer the lens than 20 m; nobody at the altar; those under a roof stand
//    in its shade); THE OPEN PAVED GROUND between the terrace and the building and ITS DARK PAVING BEYOND THE
//    TRAVERTINE BAND (basalt blocks: the research has basalt beyond the posts only as NOT CHECKED, 2.23; its reach
//    over the open ground is ours); THE MARKET: a way 64 m long BESIDE the line, 20 m to the building's side of it (no
//    stall's MIDDLE nearer the line than 15 m in plan; the nearest cloth 13.60 m), 46 plain stalls under coloured
//    cloths (nothing lettered, no wares drawn): 28 in two rows along the way and 18 in rows beside it (one back to
//    back with the way's far row and facing the pines, two beyond the pines facing them: a second, shaded way under
//    the pines); ONE row of six umbrella pines on the way's far side; the posts' bars and which gaps stand open; THE
//    PEOPLE OUTSIDE, IN CROWDS (plain far figures, each with its shade; by the day's fullness, 4,735 to 8,460 on the
//    ground a visit on seeds 1 to 40, OF THE LAW: streams from the lanes' mouths to the gaps and in at the arches (THE
//    EAST GATE'S ARCH AMONG THEM, OURS: the wider street's walkers, its carried litters and one stream on every seed
//    go in at it, and by the fans a few walkers a seed go in at each of the other three axes' arches; the research,
//    2.26, RECONSTRUCTED, gives the two entrances of the long axis to the procession and the performers and the two of
//    the short axis to the emperor and the highest ranks), EACH STREAM A FAN, narrow in its lane's mouth, wide before
//    the posts, parting to the open gaps beside its own and going in across the band to the arch behind its gap and to
//    the arch on either side of it, its people in loose walking knots of one to four; gatherings of three to six knots
//    of standers of two to five on the open ground, and single knots; knots of standers at the stalls and walkers
//    along the market's way and its shaded way; a few carried litters, and 24 litters SET DOWN, two to four at a
//    place, before the eight barred gaps beside the four axes' gaps, their bearers standing by: all INVENTED, OURS);
//    the town (blocks, roofs, lanes, courts with a tree, cloths across lanes, smokes); every form and size of the
//    Baths' front and stair; the old palace wing's place, its front, its depth (42 m: the front block of a wing about
//    365 m by 183 m) and height; the gardens (terraces, beds with box edging, shrubs, cypresses and pines); THE FAR
//    CITY all round but east (true roofs in houses, rows and whole blocks to 1,750 m from the centre, beyond them the
//    ground painted as quarters with streets and trees' clumps), THE FIELDS BEYOND THE FAR CITY (from 1,500 m out) and
//    the far hills' rise; THE VELIA'S RISE west of the building, 6 m (the research: about 5 m, 5 to 7 m); THE CLOUDS'
//    SHADE drifting over the ground, the terrace and the outer wall (never inside the oval; a third of the ground at
//    most; where it lies is the visit's own, from a stream of its own); EVERY TREE AND SHRUB STIRRING IN THE WIND BY
//    ONE LAW; birds (six flocks over the roofs, three round the wall's top, one about the temple's roof, each from a
//    stream of its own); the water's level, its ledge, its pale sand floor, its ripples, the sun's net on its floor
//    and its glints.
// NOT BUILT, AND WHY (the owner's word of 13:14): THE BRONZE FIGURE ON THE VELIA, the colossus of the sun, which stood
//    in the year 80 on the rise west of the building: ITS POSE, ITS RAYS AND ITS FACE IN THAT YEAR ARE UNKNOWN (9.18),
//    and this world shows no ruler and no portrait. The research has it 220 to 300 m from the centre at bearing 288 to
//    296, its head at 37 to 42 m over the pavement (7.16, 7.17 with 7.33): from the crest it MIGHT show small beyond
//    the far mast heads, or not at all (the paper says only that from inside the bowl it was not in sight; no paper
//    says it of a place over the wall). It is left out, and that is said here. THE CONE FOUNTAIN south-west of the
//    building is NOT BUILT either: whether it stood in the year 80 is DISPUTED (7.8).
// NOTHING IS LETTERED. NO RULER AND NO NAMED PERSON IS SHOWN. PEOPLE: plain far figures, no face, NONE NEARER THE LENS
// THAN 20 m IN SPACE (built to 20.5 m), counted from the lens's place every 0.25 m of the line against the highest
// point a figure can reach. THE CROWD, both figures of the law: 45,009 places at 0.40 m of bench a person (as built);
// 40,231 at 0.45 m (0.45 m is the mean of two authors' 0.40 and 0.50 m, ours; that the knights' rows were this
// building's first fourteen is ARGUED; where the guests' wedges lay is UNKNOWN: said at the seating's head).
// No fight, no blood, no weapon, no ram, no boarding, nothing struck: two sides of oared boats lie apart; horses and
// bulls wade. Nothing is taken from a film, a game, a painting, a museum model or a modern illustration of this
// building.
//
// THE SKY, THE CROWDS, THE TERRACE, THE RIG'S HEM, THE PORCHES, THE WATER'S FLOOR AND THE BOATS' LIE, EACH BY NAME:
//  THE SKY AND THE AIR: a deep saturated blue from the zenith far down (a dark zenith, a blue middle), a pale blue
//    band only at the horizon, the sun's warm scatter round the sun; a thin haze in the air's own pale blue grey, by
//    ONE law for the whole world; a few large clouds with a lit and a shaded side, and their shade on the ground.
//  THE OPEN GROUND'S CROWDS, THE MARKET AND THE LITTERS (said above at THE MARKET and THE PEOPLE OUTSIDE): of the
//    world's own kinds only (the far figure, the stall, the litter); nothing lettered, no wares, no animal.
//  THE TERRACE AND ITS PEOPLE (said above at THE ENTRY OVER THE TERRACE): the valley face a plain closed brick wall,
//    BUILT, with no opening, OURS; the one dug brick block before it NOT SHOWN; the east face a plain wall, OURS; the
//    terrace's size and its state, ITS BEARING AND ITS FRONT'S PLACE (both OURS), the tanks, the temple and the
//    portico are said there in the terrace research's own words.
//  THE CLOTHS' HEM IS HELD ON ITS ROPE: a cloth bellies up between its two ropes (to 1.5 m), and its belly falls to
//    nought over the last tenth of its drawn length before its hem (the part's CLOTH.HOLD): the hem's line is its
//    own scallop. No measure of the rig goes by it; the masts are 240 squared posts 3 m over the cornice.
//  THE FOUR PORCHES' WHITE MARBLE IS BUILT STONE: slabs on its level faces, coursed blocks on its block and attic,
//    a soft shade under its cornice, and THE GILT GROUP'S SHADE on the attic's top; the same for all four.
//  THE WATER'S TONE GOES BY DEPTH AND BY THE RIPPLES: THE SAND FLOOR'S LIE, IN THE TONE ALONE (low shoals with 0.8 m
//    of water over them and a bank toward the pit's wall; THE BUILT FLOOR IS LEVEL AND ONE METRE DOWN, and every law
//    of the arena's section reads that metre); the smooth lanes between the wind's bands show the floor more
//    clearly and the bands mirror more. THE WATER MIRRORS A SKY OF ITS OWN (typed at the water: pale low down, blue
//    higher), not the sky's own picture: OURS, by our choice.
//  ON THE TRAVERTINE BAND A GAP'S PEOPLE PART TO THREE ARCHES (the arch behind their gap and the arch on either side
//    of it): their ways cross the band aslant, and no straight funnel of people stands before a gap.
//  THE BOATS' LIE AND SWING (where each boat of a side lies on the water, how it is turned and how it swings there) IS
//    INVENTED BY NEED: built in the part's section THE ARENA'S LIFE ON THE WATER and said, with its law, at that head.
//  WHAT IS INVENTED OF THESE, OURS, AT BOTH HEADS: the crowds, the market's stalls, the litters and the terrace's
//    people (how many people there were, where they stood and went, the stalls, the litters and where they were set
//    down are UNKNOWN), with THE RULE THAT THE OPEN GROUND'S CROWDS KEEP OFF A PATCH BEFORE THE TERRACE'S FRONT (the
//    dug block's plan set before our front: not the dug place), THE THREE ARCHES A GAP'S PEOPLE PART TO and THE EAST
//    GATE'S ARCH TAKEN BY THE WIDER STREET AND ONE STREAM; the sky's colours; THE TERRACE'S BEARING AND ITS FRONT'S
//    PLACE; the brick wall's height, its tone, THAT IT HAS NO OPENING and its courses as drawn (a brick 0.60 m long, a
//    course 0.30 m high: the world's law of coursed walls at that measure, far larger than a Roman brick); THE HEM'S
//    HOLD (how a cloth's hem was held is UNKNOWN, as the whole rig is a modern reconstruction); THE SAND FLOOR'S LIE
//    in the water's tone (its shoals, its bank and their measures) and the mirror's own sky; THE PORCHES' MARBLE AS
//    SLABS AND COURSED BLOCKS, their sizes, the shade under the cornice and the group's shade on the attic (the
//    porches' every form is invented by need).
//  PEOPLE IN LOOSE KNOTS (the part's CROWD and its laws): two to five together with unequal gaps and turns of their
//    own; streams never one file. WHAT THE LAW TRIES FOR A KNOT, AND WHEN IT GIVES UP: each of these is A RATE and not
//    a never (OF THE LAW, seeds 1 to 40, every knot counted by its own members:
//    shots/flavian-amphitheatre/p1d/counts/W10-the-knots-rates-1-40.txt). THREE ON ONE LINE: a knot is dealt again
//    until the middle one of any three stands off the line through the other two by a fifth of their distance (in a
//    standing knot, before a stall and along an edge; by 0.18 of it in a walking knot; by 0.15 on the garden's paths,
//    after the squeeze to the path), and THE 16th TRY IS KEPT whatever it is (the 8th on the paths). By that measure
//    three stand on a line in none of 4,140 knots of three and more on the open ground and in the three walks, in none
//    of 3,333 on the paths, in 2 of 187 in the porch (seeds 20 and 24), and OFTEN WHERE A KNOT STANDS OR GOES IN A
//    ROW: 31 in 100 round the temple's room, 55 in 100 at the parapet and before the stair, 59 in 100 before a stall
//    of the rows beside the way, 95 in 100 of the walking knots of four (7 of 12,493 of three), on every seed. TWO OF
//    A STANDING KNOT IN ONE DYE: a dye is drawn again up to 12 times: 35 of 12,232 standing knots (3 in 1,000; on 25
//    of the 40 seeds). TWO SIDE BY SIDE OF A WALKING KNOT IN ONE DYE: none of 56,756. TWO WHO FACE EACH OTHER
//    SQUARELY: one pass through a knot's pairs, then up to four passes through all the standers within 2.2 m of each
//    other: none left on the 40 seeds. TWO NEARER THAN A BODY'S BREADTH (0.50 m): none within a knot (the least 0.55 m
//    standing, 0.50 m on the paths, 0.60 m walking) BUT BEFORE A STALL OF THE ROWS (356 pairs in 607 knots, on 39 of
//    the 40 seeds: the 16th try kept) AND BETWEEN TWO KNOTS OF BEARERS AT THE LITTERS SET DOWN (289 pairs, 7 a seed:
//    those knots are dealt with no look at each other; 9 pairs more on the terrace). The market way's own standers
//    (the part's outsidePlan) are dealt one by one before a stall, in no knot's law: 26 such pairs a seed. Walkers of
//    different knots cross one another's lines.
//  ONE LAW OF PLACE FOR EVERY SEED: nothing is set where a still stands, for the lens, by how far the flight has come,
//    by a seed's number or by a clock value; how many people there are goes by the day's fullness. THE COUNTS, OF THE
//    LAW (seeds 1 to 40): 4,735 to 8,460 figures on the ground a visit (their mean 6,471) and 441 to 729 on the
//    terrace (586); 46 stalls and 24 litters set down on every visit. THE DEAL: the people outside are dealt first
//    (the part's outsidePlan, from the stream 'amphitheatre-people-outside:' with the seed); the crowds and the
//    terrace's people draw after it from two streams of their own ('amphitheatre-p1-ground:' and
//    'amphitheatre-p1-entry:' with the seed: plain names of streams; a stream's name is a part of its key).
//  THE CLEAR AIR, counted from the lens's place (the line's own point every 0.25 m, whatever the camera's turn) TO A
//    FIGURE'S BODY (its feet to 2.0 m over them, a figure's highest reach, and its breadth with its sway): NOBODY
//    NEARER THAN 20 m IN SPACE (built to 20.5 m and more; OF THE LAW, seeds 1 to 40, the least is 20.76 m). HOW IT IS
//    KEPT (the paper: shots/flavian-amphitheatre/p1d/counts/W12-how-each-place-keeps-its-distance-1-40.txt): WHERE THE
//    LINE PASSES THE TERRACE'S PEOPLE THE PLAN TRIES EACH PLACE AGAINST THE LINE and deals again where it is nearer
//    than 20.5 m and a body's (at the parapet, before the temple and in its porch, on the front walk's run east of the
//    line, on the garden's paths and in the walk round the temple's room: the least 20.76 m); THE REST OF THE TERRACE
//    KEEPS IT BY PLACE, with no test (the east walk 37.0 m and more from the line, the front walk's run west of the
//    temple's stair 40.0 m, the west walk 101.9 m, the back walk 192.9 m); THE GROUND'S PEOPLE AND THE LITTERS KEEP IT
//    BY THE LINE'S HEIGHT ALONE, with no test (the line is nowhere lower than 23.5 m over the open ground; less a
//    figure's 2.0 m that is 21.5 m, and the least counted is 21.50 m). NO STALL'S MIDDLE NEARER THE LINE THAN 15 m IN
//    PLAN (15.15 m; the nearest cloth of the 28 along the way 13.60 m; the rows beside the way stand 26.40 m and more
//    off, to the cloth's edge).
//  WHAT HERE READS THE PIXEL OR THE EYE (section 153), each named: THE BRICK'S COURSES on the wall and THE JOINTS OF
//    THE PORCHES' MARBLE (its slabs and coursed blocks) are melted where one is under a pixel (the pixel's footprint,
//    as the wall kind's own courses and every course of this world are: named below with them). THE PORCHES' MARBLE
//    ALSO TAKES THE PIXEL'S SLOPE OF ITS OWN PLACE (how fast the face's two level measures change from one pixel to
//    the next: fwidth) TO TELL WHICH WAY AN UPRIGHT FACE RUNS: by it the blocks' courses run along the face and a
//    block takes its tone (the faces are a box's, each with one of the two measures constant: the answer is the same
//    for every eye). THE WATER'S FLOOR AND ITS BANK ARE READ WHERE THE BENT SIGHT FROM THE EYE MEETS THE FLOOR (by the
//    direction from the water to the eye, as the sand's grain and the sun's net on it are): the shoals and the bank
//    are a law of the floor's place, the same for every visit and every eye; where on the sheet they are seen goes by
//    that direction. The hem's hold and the band's three arches read no lens, no place of the route, no still and no
//    seed: they are laws of the cloth's own length and of the gaps' and arches' places. The water's mirror and its
//    share read the eye (named below, at the laws that read the eye). The people are the world's own far figures and
//    the haze is the world's own (thicker with the distance from the eye). SECTION 177: THIS WORLD SETS NEITHER
//    drawWithin NOR drawIn, AND SHOWS NEITHER A LIGHT NOR AN IMAGE OF ITS RING (RING_MIRROR 0).
//
// THE LINE (the law is routeLaw() in the part; every figure a place of the world, but the flight's own two marks over
// the boats' water, said below at the seconds; nothing in it is a typed length): 362.5 m, 43.4 s (the world's
// duration: the line's metres each divided by its pace). THE OUTSIDE, 235.6 m flown (what the places give; the owner's
// bound of 235 m is checked, not aimed at): THE ENTRY is the place (186, 23.5, 198) on the temple's terrace, over the
// walk, level with the temple's back wall, 30 m east of its flank, 7.3 m over the terrace's floor; the line is solved
// to it and begins heading compass bearing 1.8 (18.2 degrees off the short axis toward the west), level, along the
// temple's east flank and out over the terrace's front edge (metre 66.5); the climb's foot beside the market way
// (metre 79.0); up beside the wall's south-east quarter (never nearer its face than 48.5 m in plan while under its
// top); the turn toward the long axis (metre 183.7, radius 30 m) over the east gate; THE CREST'S TOP at (94, 63.5, 0):
// over the east gate at the outer wall's line, 12 m of clear air over the mast heads. THE INSIDE, 126.9 m: from the
// crest's top the line ROUNDS OVER onto the way down (20 degrees under level after 8 m, 27.5 at the gallery roof's
// edge 20 m on) and is from there ONE straight line at 27.5 degrees down the long axis, its last 110 m, to the ring at
// (-19.5, 7.5, 0). THE RING LEANS WITH THE LINE (portal.tilt; the kit's own tilted exit; radius 4 m): there is no ease
// at the foot and no nod at the crossing. THE RING'S MIRROR IS OUT OF THE WATER (RING_MIRROR 0: the water carries no
// glow whose source cannot be told). THE FIGURES, OF THE LAW: THE STEEPEST CLIMB 20.9 degrees on the path as flown
// (metre 121; the law's slope 0.38 is 20.8); THE STEEPEST DESCENT 27.5 degrees, held from the gallery roof's edge to
// the ring; THE HEADING'S GREATEST TURN, in the turn over the east gate: 11.4 degrees a second over a metre of the
// path as flown (metre 224), 10.9 on the law's circle of 30 m; by the path's own tangent it is over 12 on a quarter of
// a metre at metre 226.6 (12.7 at the most); THE GAZE'S GREATEST TURN about 6 degrees a second with the sweeping
// camera, 7.4 with the steady one. THE LOOKS are by places of the line alone (the part's flightPlan finds each place
// on the path; no span is a typed metre): OUTSIDE the gaze goes from the building whole to the arches at a slant and
// down along the wall's foot to the pavement, the posts and the streams (10 degrees under level), up to the top
// storey's face (7 under level), then over the cornice toward the water's centre; it is over level from metre 11 to
// metre 96 alone, by 2.6 degrees at the most (metre 82, three metres past the climb's foot); in the bowl ONE lowering
// of the gaze (36 degrees under level by metre 280; held from there between 34.4 and 36.8 under level, the lowest at
// metre 314, and 7 to 9 under the heading: the boats, the water's centre, the horses at the ring's foot) and ONE
// lifting to the ring over the last 23 m. THESE TILTS ARE THE SWEEPING CAMERA'S: the steady one's gaze is over level
// from metre 17 to metre 152 (by 6.7 degrees at the most, at metre 84) and 24 under level at its lowest in the bowl.
// PACE by place, in metres a second: 13 over the terrace, 11 on the climb beside the
// wall, 5.7 through the turn, 7.6 in the bowl. EACH CHANGE OF PACE LIES BETWEEN TWO NAMED PLACES OF THE LINE, as the
// looks do (the part's FLIGHT.RAMP; no metre is typed): 13 to 11 from the climb's foot (metre 79.0, second 6.1) to
// where the lens is level with the top storey's foot (128.0, second 10.2); 11 to 5.7 from there to where the turn over
// the east gate begins (183.7, second 17.2; the pace is 6.6 at the cornice and 5.9 over the mast heads); 5.7 held
// through the turn to the crest's top (235.6, second 26.3); 5.7 to 7.6 from the crest's top to the gallery roof's edge
// (255.3, second 29.3); 7.6 from there to the ring (the awning's eye at second 34.1, the flight's own two marks over
// the boats' water at 37.5 and 40.0, the end at 43.4). THE FLIGHT'S TWO MARKS ON THE BOATS' WATER, x 20.5 and x 3.5 on
// the long axis, ARE FIGURES OF THE FLIGHT'S OWN (the part's flightPlan makes them of two of the arena's measures),
// kept so that the looks and the pace stand as they were made: they are no ends of the boats' water, for the boats lie
// from x -3 to x 30 (the arena's head). The seconds follow from the pace and the line's length. Nothing is placed,
// hidden, moved, timed or lit by how far the flight has come, a seed's number, a clock value or the lens.
//
// LAWS THAT READ THE EYE, each named (none places, hides or times a thing): the haze (thicker with the distance from
// the eye); THE WATER's mirror and its share of mirror to floor (by the direction from the water to the eye), ITS
// FLOOR, read where the bent sight meets it (the sand, its lie and its bank, the sun's net: by that direction), and
// the sun's glints (the sun's own mirror: by that direction); the ground's facing (from the picture's own slopes of
// the ground's place); the ribs of roof tiles, the lines of steps and courses, a shaft's flutes, the paving's joints
// and a leaf's grain, the brick's courses and the joints of the porches' marble (melted where one is under a pixel:
// the pixel's footprint); which way an upright face of the porches' marble runs (the pixel's slope of the face's own
// place); A SMOKE'S RIBBON (its breadth turned across the eye's line, as a rope's is: the smoke's place, height and
// lean are the same for every eye). The part's own are named at its head (there: a rope under a pixel wide, by THE
// FOOTPRINT FILTER of section 153).
// TWO LAWS OF THE ARENA READ THE EYE'S PLACE, AND ARE DECLARED BY THE OWNER; both are built in the part's arena
// section and said in the same words at its head and at the part's top head:
//  THE MIRRORED FORMS (declared by the owner at 14:17 on 12 Oct 2026 as the world's own optics under section 153):
//    each point of the arena's one mesh of bodies that stands over the water (of the hulls with their posts, steering
//    oar and streamer, of the crews, of the animals and of the handlers on the ledge: what of each stands over the
//    surface, the image cut at the waterline; THE ROWING OARS ARE NOT MIRRORED) is drawn once more as a dim image on
//    the water, where the sight from the eye's place to that point's mirror image under the surface meets the surface:
//    in the body's own colour and the body's own light, with one face's strength at a point of the picture, and only
//    where water is (not inside a hull's own plan at the waterline, not off the pit's water); it reads the eye's PLACE
//    and nothing else of the eye, and the bodies stand and move the same for every eye.
//  AN ANIMAL'S SHADE ON THE FLOOR (declared by the owner at 14:17 on 12 Oct 2026 as the world's own optics under
//    section 153): the shade an animal throws on the pit's floor through a metre of clear water, and the dark of its
//    own bulk under the surface, are drawn on the water's surface (on a sheet 0.02 m over it), each point of it
//    showing what the sight from the eye's place to that point, bent there as water bends it (the sine of its angle
//    off the plumb divided by 1.33), goes down to: the shade on the floor a metre under, the bulk at its own built
//    depth (a tenth of a metre under for a horse, two tenths for a bull); it reads the eye's PLACE and nothing else of
//    the eye, and goes out as the sight grows flat by the water's own rule. IT IS AN ANIMAL'S SHADE ONLY: a hull's
//    soft shade is a mark laid on the water beside the hull, down the sun's way, by place, and reads no eye.
//  THEIR TERMS (the arena's head, in its words): each reads the eye's PLACE and nothing else of the eye: not where
//    the lens looks, not its width, not the picture's size, no seed, no place of the flight (the lens is read only to
//    put the finished place on the screen, as for every thing drawn). OF THE CLOCK: the bodies and the shade's caster
//    move on the world's clock, a hull's plan goes with its hull, and the mirrored image wavers on the world's clock;
//    the sun a body is lit by and a shade is read in comes through the cloths, whose ripple runs on the world's clock
//    in the light's own law; nothing else of the clock. THE IMAGE TAKES NOTHING ITS BODY DOES NOT HAVE: less than the
//    body it may have; more, other or elsewhere it may not. THE MIRRORED IMAGE: only of what stands over the water,
//    cut at the waterline; only where water is (not outside the pit's oval, not inside a hull's own plan at the
//    waterline: inside a hull lie its floor boards, not water); drawn ON ITS OWN SIGHT a little before the surface,
//    between 0.03 m and 0.08 m over it (moving a point along its own sight changes no place in the picture). FOR AN
//    EYE LESS THAN 0.08 m OVER THE WATER the lift stands as high as the eye or higher, and the image is lost by the
//    lift and not by the sight's own rule: no place of the flight is near it (the lens comes no lower than 7.75 m over
//    the water). THE BODY'S OWN COLOUR IN THE BODY'S OWN LIGHT by the one law the body's own picture takes, read at
//    the body's own point; ONE FACE'S STRENGTH AT A POINT of the picture, the nearest along the sight, no strength by
//    layers; then the water's: the mirror's share by the sight's angle and the ripple's loss with the point's height
//    over the water; ITS WAVER the water's ripple in kind with figures of its own, OURS, by our choice. A HANDLER'S
//    IMAGE IS NOT TESTED AGAINST THE LEDGE'S OWN EDGE: the lowest 0.2 m or so of his legs may show on the water where
//    a true mirror would show the pit's wall. THE SHADE ON THE FLOOR: read by THE BENT SIGHT'S TRUE SUM AT EVERY ANGLE
//    (the sine of the angle off the plumb divided by 1.33, with no fixed share shallower); THE SHEET'S REACH IS WORKED
//    OUT, NOT TYPED (from the lines' own balls, the animal's scale and the lowest sun of the day's range, 32 degrees);
//    the sun read where the sun's own ray to the floor point enters the water, the same for every eye. WHAT CASTS: the
//    body, the neck and the head, and a bull's two horns: LINES WORKED OUT FROM THE BUILT RINGS BY ONE RULE, none
//    typed; so the shade is NO LARGER THAN THE BUILT ANIMAL'S OWN TO SOME CENTIMETRES (by a count against the built
//    faces of body, neck, head and horns, across the sun's way, the edge of its lines' own shade lies nowhere more
//    than 0.04 m outside the true shade while the animal stands, about 0.05 m while a horse is held up or half way up,
//    and as much as 0.08 m for a moment of a rise when the sun stands dead ahead (the built body is an open shell, and
//    the sun comes in under the chest's end there)) and LESS than the true: by the same count a horse's whole dark is
//    0.63 to 0.81 of its true shade's area while it stands, is held up or is half way up (less by a fifth and more)
//    and as much as 0.88 at that moment of a rise; a bull's is 0.57 to 0.65 (less by a third and more); LESS THAN THE
//    BODY in every case counted. NEVER LEGGED, AND NO BAND RUNS FROM THE ANIMAL TO ITS SHADE. THE SHADE IS THE SIZE OF
//    ITS CASTER: its soft rim is centred on the edge of the lines' own shade (at that edge half the line's own
//    strength, gone a quarter of a metre outside it, whole a quarter of a metre inside it where a line is that thick),
//    the same for every eye; A LINE THINNER THAN THE RIM THROWS NO MORE DARK THAN ITS COVER. THE POOL (the dark of the
//    animal's own bulk under the surface) is read by the same bent sight at the bulk's own depth, BY KIND, FROM THE
//    BUILT RINGS (half the mean depth of the belly's own line under the surface along the body: 0.10 m for a horse,
//    0.20 m for a bull); its colour the animal's own coat, darkened by the water's loss of colour over twice that
//    depth of the light's way.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as P from '../parts/flavian-amphitheatre.js';
// (the fold, order two: the seating with its people and the arena's life are two sections of the world's own part)
const SEATING = P.SEATING, ARENA = P.ARENA;

const M = P.M, DEG = P.DEG;
const lin = (hex) => new THREE.Color(hex);
// CHOSEN: THE HOUR'S LIGHT (order three, addendum 1, 3b: the third hour must read as the third hour, not as noon):
// the sun's light WARM (a low sun's yellow), the shade COOL AND DEEP (the sky's blue fill alone, about a third of the
// lit on a level stone and less on a wall that faces the sun), a little warm bounce from the lit stone; the haze thin,
// in the air's own pale blue grey. Three uniforms (uSunCol, uSkyCol, uBounceCol): one law for all.
const SUN_COL = '#ffdfb4', SUN_POWER = 1.42, SKY_COL = '#92abda', SKY_POWER = 0.3, BOUNCE_COL = '#e6c99c', BOUNCE_POWER = 0.18;
const HAZE_COL = '#c6ccd4', HAZE_DENSITY = 0.00011;   // the haze: the air's own pale blue grey, thin (one law for the whole world)
// THE RING'S MIRROR IN THE WATER: OUT (the water carries no glow whose source cannot be told, white, pale or gold): strength nought,
// this one constant
const RING_MIRROR = 0;
// THE SUN'S PLACE (order three, part II; found by trial inside the lead's range, bearing 80 to 88 and 32 to 38 degrees up)
// (The part's arena section holds the lowest height by hand, SUN_LOW 32 degrees, for the reach of the sheet an
// animal's shade is drawn on: it MUST FOLLOW SUN.EL's lower figure.)
const SUN = { EL: [32, 34.4], BEARING: [86, 88] };
// CHOSEN: the cloths' colours (INVENTED BY NEED; Lucretius's three for other theatres: yellow, red, rust dark)
const LINEN = '#e8dfc9', SAFFRON = '#cfae70', RED = '#b07a66', RUST = '#8a6252', CLOTH_PALE = 0.3;   // CHOSEN: unbleached linen; weathered dyes (saffron yellow, madder red, rust), none pure

export default {
  id: 'flavian-amphitheatre',
  name: 'The New Amphitheatre',
  category: 'wonders',
  placeKind: 'city',
  place: 'Rome',
  year: 'AD 80',
  media: ['air'],
  weirdness: 0.1,
  async build(ctx) {
    const { clamp, smoothstep } = ctx.core;
    // THE FORKS, in one list, each a stream of its own made from the world's seed and a name
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('amphitheatre-' + name + ':' + ctx.seed));
    const R = { vary: stream('vary'), cloth: stream('cloth'), town: stream('town'), hills: stream('hills'), far: stream('far-city'), people: stream('people-outside'), sky: stream('sky'), shade: stream('cloud-shade'), arcades: stream('arcades'), air: stream('air'), altar: stream('altar') };
    const vary = ctx.vary || {}, density = clamp(vary.density ?? 1, 0.7, 1.3), detail = ctx.quality ? ctx.quality.detail : 1;
    // (the mood's draw is taken on every visit, also when the site hands a mood over: the hour's draw after it is then the same number)
    const moodDrawn = R.vary(), mood = vary.mood ?? moodDrawn, rare = !!vary.rare;
    // THE HOUR (order three, part II): the sun's height, 32 to 34.4 degrees, its bearing with it (86 to 88: the sun's own
    // arithmetic for latitude 41.89 about midsummer, in the third hour); the visitor's Hour leans it inside that
    let sunEl = R.vary.range(SUN.EL[0], SUN.EL[1]);
    if (vary.hour === 'dawn' || vary.hour === 'golden') sunEl = SUN.EL[0] + (sunEl - SUN.EL[0]) * 0.3;
    if (vary.hour === 'day') sunEl = SUN.EL[0] + (SUN.EL[1] - SUN.EL[0]) * 0.7 + (sunEl - SUN.EL[0]) * 0.3;
    const sunBearing = SUN.BEARING[0] + (sunEl - SUN.EL[0]) / (SUN.EL[1] - SUN.EL[0]) * (SUN.BEARING[1] - SUN.BEARING[0]);
    const sunV = new THREE.Vector3(...P.sunVector(sunEl, sunBearing));
    // THE CLOTHS: how far drawn (26 to 34 m by the density; the rare look: drawn back to the masts) and their colours
    const draw = rare ? 1.2 : M.CLOTH_DRAW_MIN + (density - 0.7) / 0.6 * (M.CLOTH_DRAW_MAX - M.CLOTH_DRAW_MIN);
    // the dyes (order three: every visit has stripes of dye and linen; a visit differs by which dye leads and by how
    // weathered the dyes are): saffron and red, one of them leading (the 'cloth' stream's first draw says which), with
    // the mood over 0.8 a little rust too; the lower the mood the more the dyes have paled toward the linen (CLOTH_PALE
    // of the way at the most); then the runs round the oval (the part's clothRuns())
    const dyes = mood < 0.8 ? 2 : 3, saffronLeads = R.cloth() < 0.62, pale = CLOTH_PALE * (1 - mood);
    const dye = (hex) => '#' + lin(hex).lerp(lin(LINEN), pale).getHexString();
    const clothCols = (saffronLeads ? [SAFFRON, RED, RUST] : [RED, SAFFRON, RUST]).map(dye);
    const runs = P.clothRuns(R.cloth, dyes);

    // the dye's tint of the light through a cloth is scaled so that plain linen keeps its brightness (the light's law, uCloth.z)
    const LINEN_TINT_LUMA = (() => { const c = lin(LINEN), t = P.RIG.SHADE.TINT; return 0.2126 * Math.pow(c.r, t) + 0.7152 * Math.pow(c.g, t) + 0.0722 * Math.pow(c.b, t); })();
    const scene = new THREE.Scene();
    // ------------------------------------------------------------ the light's uniforms, shared by every shader
    const U = {
      uSun: { value: sunV }, uSunCol: { value: lin(SUN_COL).multiplyScalar(SUN_POWER) }, uSkyCol: { value: lin(SKY_COL).multiplyScalar(SKY_POWER) },
      uBounceCol: { value: lin(BOUNCE_COL).multiplyScalar(BOUNCE_POWER) }, uHaze: { value: new THREE.Vector4(...lin(HAZE_COL).toArray(), HAZE_DENSITY) }, uTime: { value: 0 },
      uCloth: { value: new THREE.Vector4(1 - draw / P.RIG.SPAN, P.RIG.SHADE.THROUGH, 1 / LINEN_TINT_LUMA, 0) }, uClothCol: { value: clothCols.map((c) => lin(c)) }, uClothTex: { value: null },
      uArc: { value: new THREE.Vector4(P.ARC.c2, P.ARC.c4, 0, 0) },
      // where the clouds' shade lies is the visit's own: the field's shift in patches, the two numbers of a stream of
      // its own ('amphitheatre-cloud-shade:' + seed; the sky's stream is the kit's sky's alone)
      uCloudAt: { value: new THREE.Vector2(R.shade() * 64, R.shade() * 64) },
    };
    {
      // one row of 240 colours (linear), a strip's cloth each: linen or a dye, times the strip's tone
      const data = new Uint8Array(M.MASTS * 4), cols = [lin(LINEN), ...clothCols.map((c) => lin(c))];
      for (let j = 0; j < M.MASTS; j++) { const c = cols[runs.kind[j]], t = runs.tone[j]; data[j * 4] = Math.min(255, Math.round(c.r * t * 255)); data[j * 4 + 1] = Math.min(255, Math.round(c.g * t * 255)); data[j * 4 + 2] = Math.min(255, Math.round(c.b * t * 255)); data[j * 4 + 3] = 255; }
      const tex = new THREE.DataTexture(data, M.MASTS, 1, THREE.RGBAFormat);
      tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
      U.uClothTex.value = tex;
    }
    await ctx.yield();
    // the sky: one call into the kit, a step of its own
    // (a morning's sky: A DEEP SATURATED BLUE from the zenith far down, a pale cool band only at the horizon, the
    // warmth kept to the sun's side by the kit's own scatter; A FEW LARGE SOFT CLOUDS with a lit and a shaded side,
    // no flecks, their own haze thin)
    const sky = makeSky({ rng: R.sky, preset: 'day', sunDirection: sunV, zenith: '#143c98', mid: '#4d82d2', horizon: '#c6d6e8', horizonPow: 4.4, scatterColor: '#fbe7c6', scatter: 0.8, scatterPow: 3.2, scatterHigh: 0.2, sunColor: '#ffe9c4', sunSize: 1.4, sunIntensity: 9, sunGlow: 0.7,
      clouds: { coverage: 0.36, softness: 0.3, scale: 0.34, opacity: 0.96, detail: 0.5, haze: 0.13, absorb: 1.9, lit: '#fff5e4', shade: '#74819f' }, clouds2: false });
    scene.add(sky.object);
    scene.fog = null;
    await ctx.yield();

    // ------------------------------------------------------------ the route (the part's law), the pace and the looks by place
    const path = makePath(P.routePoints());
    const L = path.length;
    // the places of the line in metres flown, the pace by place and the looks by place are the part's law (flightPlan):
    // brisk at the entry, slower along the wall, slowest through the turn over the east gate, slow in the bowl; the
    // looks: the building whole, the arches by the east gate and the wall's foot, the top storey, the whole bowl, the
    // boats, the water's centre and the horses at liberty on the way down, then the ring on the heading
    const flight = P.flightPlan(path), PLACE = flight.place, pace = flight.pace, pois = flight.pois;
    await ctx.yield();

    // ------------------------------------------------------------ the building (the part)
    // ONE opts object for the part's three sections: the light's one law, the uniforms, the water's hook.
    // seats: while the seating part's READY is false the hero draws its own plain rows, platforms, gallery steps and
    // standing floor; when it is true the hero leaves them out and the seating part builds exactly those, with the people.
    const opts = { U, sunV, draw, rare, mood, density, detail, seats: SEATING.READY !== true };
    const hero = await P.buildHero(ctx, opts);
    scene.add(hero.object);
    // a part is called from the hour its READY is true; until then an empty stand-in holds its place (a part that
    // another builder is still writing must not stop this world at any hour)
    const standIn = () => ({ object: new THREE.Group(), info: { triangles: 0, calls: 0, pieces: {}, people: {} }, update() {}, dispose() {} });
    await ctx.yield();
    const seating = SEATING.READY === true ? await SEATING.buildSeating(ctx, hero, opts) : standIn();
    scene.add(seating.object);
    await ctx.yield();
    const arena = ARENA.READY === true ? await ARENA.buildArena(ctx, hero, opts) : standIn();
    scene.add(arena.object);
    await ctx.yield();

    // ------------------------------------------------------------ the valley and the water
    // the water's own uniforms: the arena's marks (the hook: arena.marks(time, out) writes up to 24 of (x, z, radius,
    // strength) and returns how many; none if a stand-in holds the arena's place) and the crowd's tone in the mirror
    const water = { marks: new Float32Array(4 * WATER_MARKS), uMarks: { value: null }, uMarkN: { value: 0 }, uCrowd: { value: SEATING.READY === true ? 1 : 0 } };
    water.uMarks.value = water.marks;
    const valley = await buildValley(ctx, { U, R, stream, density, detail, path, scene, water });
    await ctx.yield();

    return {
      scene, path, duration: flight.duration, pace, pois, style: 'none', ride: 'none', companion: 'none',
      camera: { near: 0.5, far: 9000, sway: 0.6, bank: 0.5 },
      portal: { shape: 'circle', radius: M.RING_R, color: '#ffc76a', glow: 0.8, tilt: true },   // THE RING LEANS with the line's last 27.5 degrees
      post: { exposure: 1.0, bloom: { strength: 0.16, radius: 0.5, threshold: 1.25 }, grade: { saturation: 1.05, contrast: 1.05, tint: '#fffaf0', shadowTint: '#0a1230', vignette: 0.2, grain: 0.015, aberration: 0 } },
      info: { length: L, PLACE, sunEl, sunBearing, draw, rare, mood, density, parts: hero.info, valley: valley.info, seating: seating.info, arena: arena.info, seatingReady: SEATING.READY === true, arenaReady: ARENA.READY === true },
      update(dt, time, camera) { U.uTime.value = time; if (arena.marks) water.uMarkN.value = Math.min(WATER_MARKS, arena.marks(time, water.marks) | 0); sky.update(dt, time, camera); hero.update(dt, time, camera); seating.update(dt, time, camera); arena.update(dt, time, camera); valley.update(dt, time, camera); },
      dispose() { sky.dispose?.(); U.uClothTex.value?.dispose(); hero.dispose(); seating.dispose(); arena.dispose(); valley.dispose(); },
    };
  },
};

// ------------------------------------------------------------------ THE VALLEY (the ground, the pavement and its posts, the town, the hills, the far city) AND THE WATER
const V = P.VALLEY;
// THE HOUSES' SHADE (order two, step 4): the town's tops as one picture from above (uTownH: a house's height over
// the sea of the valley floor, a quarter metre a step; uTownBox: its corner x, z and one over its width and depth);
// the way from a place to the sun is tried against it at five lengths. A law by place: it reads no eye.
const TOWN_SHADE_GLSL = /* glsl */`
uniform sampler2D uTownH; uniform vec4 uTownBox;
float townSun(vec3 P) {
  vec2 uv = (P.xz - uTownBox.xy) * uTownBox.zw;
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return 1.;
  vec2 dir = normalize(uSun.xz); float k = uSun.y / max(length(uSun.xz), 1e-3), lit = 1.;
  for (int i = 0; i < 5; i++) {
    float t = float(i), sl = 1.1 + t * (1.2 + t * .45);
    float h = texture2D(uTownH, (P.xz + dir * sl - uTownBox.xy) * uTownBox.zw).r * 63.75;
    lit = min(lit, smoothstep(-.7, .25, P.y + k * sl - h));
  }
  return lit;
}`;
// THE WIND'S STIRRING: ONE LAW FOR EVERY TREE AND SHRUB OF THE WORLD (the terrace's cypresses, the market's pines, the
// hills' gardens, the courts' trees of the town, the shrubs of every bed). A leafy thing at the place p leans down
// the wind, the way the clouds' shade drifts and the cloths stream (the part's SKYSHADE.DRIFT), on the world's clock:
// a slow sway and a quicker tremble whose reach is the wind's own speed times STIR.SLOW and STIR.QUICK seconds (at
// 7 m a second: 0.2 m and 0.09 m), times the thing's freedom: for a tree the square of the height in its crown
// (nought at the crown's foot, one at its top; stems and stone stand), for a shrub's clump STIR.SHRUB. The same law
// wherever a tree or a shrub stands; nothing in it knows the line.
const STIR = { SLOW: 0.029, QUICK: 0.013, SHRUB: 0.35 };
const STIR_GLSL = (() => { const d = P.SKYSHADE.DRIFT, sp = Math.hypot(d[0], d[1]), f = (v) => v.toFixed(4);
  return /* glsl */`
vec2 stir(vec2 p, float t) { return vec2(${f(d[0] / sp)}, ${f(d[1] / sp)}) * (${f(STIR.SLOW * sp)} * sin(t * 1.3 + p.x * .13 + p.y * .09) + ${f(STIR.QUICK * sp)} * sin(t * 3.1 + p.x * .7 + p.y * .5)); }`; })();
// a garden's ground from its own metres (order two, step 5): beds between gravel paths, each bed rows of low plants on
// earth, or grass, or both (rows and paths melted where one is under a pixel)
const GARDEN_GLSL = /* glsl */`
${STIR_GLSL}
vec3 gardenAlb(vec2 q, vec2 bed) {
  vec2 c = floor(q / bed), f = q - c * bed; float h = hash21(c + 3.7), fw = max(fwidth(q.x), fwidth(q.y));
  float path = 1. - smoothstep(.7, .95 + fw, min(min(f.x, bed.x - f.x), min(f.y, bed.y - f.y)));
  vec3 gravel = vec3(.58, .53, .43), earth = vec3(.4, .33, .24), lawn = vec3(.2, .26, .11), plant = vec3(.09, .14, .06);
  // (order three, addendum 6, point 5: A BED IS A BED: a clipped box edging round it, dark and
  // 0.8 m wide, and inside it shrubs in round clumps on dark earth or on grass, or plain grass; no stripes)
  float inner = min(min(f.x, bed.x - f.x), min(f.y, bed.y - f.y));
  float box = (1. - smoothstep(1.65, 1.8 + fw, inner)) * (1. - path);
  vec2 cq = f / 2.3, ci = floor(cq), cf = fract(cq) - .5 - (vec2(hash21(ci + c * 7.1), hash21(ci + c * 3.3 + 5.1)) - .5) * .45;
  // the shrubs stir in the wind by the one law (stir): a clump leans by its freedom, STIR.SHRUB, at its own place
  cf -= stir(c * bed + (ci + .5) * 2.3, uTime) * ${(STIR.SHRUB / 2.3).toFixed(4)};
  float clump = mix(1. - smoothstep(.2, .36, length(cf)), .4, smoothstep(.4, 1.6, fw));
  vec3 bedc = h < .4 ? mix(earth * .8, plant * 1.3, clump) : h < .72 ? lawn * (.85 + .3 * vnoise(q * .8)) : mix(lawn, plant * 1.25, clump);
  bedc = mix(bedc, vec3(.065, .115, .05) * (.85 + .3 * vnoise(q * 2.3)), box);
  return mix(bedc, gravel, path) * (.9 + .2 * vnoise(q * .35));
}`;
// THE MARKET'S SHADE ON THE GROUND (order three, addendum 2), by the part's law of place (marketPlan, pineTree): each
// pine's crown throws a round soft shade (a level disc keeps its size on level ground) at its height's length along
// the sun's way, its stem a thin line from its foot; each stall's cloth a small square shade beside it.
const MARKET_PLAN = P.marketPlan();
// the stalls of the rows beside the way (the part's marketMore)
const MARKET_MORE = P.marketMore();
const MORE_SHADE_GLSL = `  // the stalls of the rows beside the way: the same square shade, a row by its place across the way and its first and last stall
  for (int j = 0; j < 2; j++) {
    vec2 q = p - sd * (j == 0 ? 2.4 : 1.2) * k - w0; float t = dot(q, wa), sx = q.x * wa.y - q.y * wa.x, tk = (t - ${(P.MARKET.STALL.W / 2).toFixed(2)}) / ${P.MARKET.STALL.EVERY.toFixed(2)};
${MARKET_MORE.rows.map((r) => `    { float kk = clamp(floor(tk + .5), ${r.k0.toFixed(1)}, ${r.k1.toFixed(1)}); lit = min(lit, .3 + .7 * smoothstep(-.15, .3, max(abs(tk - kk) * ${P.MARKET.STALL.EVERY.toFixed(2)} - ${(P.MARKET.STALL.W / 2).toFixed(2)}, abs(sx - ${r.s.toFixed(2)}) - ${(P.MARKET.STALL.D / 2).toFixed(2)}))); }`).join('\n')}
  }
`;
const MARKET_SHADE_GLSL = /* glsl */`
float pineRowShade(vec2 p, vec4 row, vec3 par) {
  vec2 o = row.xy, a = row.zw, sd = -uSun.xz / max(length(uSun.xz), 1e-3); float k = length(uSun.xz) / max(uSun.y, .1), lit = 1.;
  float k0 = floor(dot(p - sd * ${(0.86 * (P.MARKET.PINE.H[0] + P.MARKET.PINE.H[1]) / 2).toFixed(1)} * k - o, a) / par.x + .5);
  for (int i = -1; i <= 1; i++) {
    float kk = k0 + float(i);
    if (kk < 0. || kk > par.y - .5) continue;
    float h = ${P.MARKET.PINE.H[0].toFixed(1)} + ${(P.MARKET.PINE.H[1] - P.MARKET.PINE.H[0]).toFixed(1)} * fract(kk * .618034 + par.z);
    float r = ${P.MARKET.PINE.R[0].toFixed(2)} + ${(P.MARKET.PINE.R[1] - P.MARKET.PINE.R[0]).toFixed(2)} * fract(kk * .414214 + par.z * 2.3);
    vec2 foot = o + a * kk * par.x, c = p - foot; float along = dot(c, sd), miss = abs(c.x * sd.y - c.y * sd.x), reach = h * .86 * k;
    // the crown: a disc, a little longer along the sun's way (its depth), its rim broken by the needles' tufts
    vec2 e = vec2((along - reach) / (r * 1.22), miss / r); float dd = length(e) + .1 * (vnoise(p * .9) - .5);
    lit = min(lit, .22 + .78 * smoothstep(.8, 1.06, dd));
    // the stem
    if (along > 0. && along < reach) lit = min(lit, .3 + .7 * smoothstep(.22, .55, miss));
  }
  return lit;
}
float marketSun(vec2 p) {
  float lit = 1.;
${MARKET_PLAN.rows.map((r) => `  lit = min(lit, pineRowShade(p, vec4(${r.ox.toFixed(3)}, ${r.oz.toFixed(3)}, ${r.ax.toFixed(5)}, ${r.az.toFixed(5)}), vec3(${r.every.toFixed(1)}, ${r.n.toFixed(1)}, ${r.phase.toFixed(2)})));`).join('\n')}
  // the stalls: in the way's own measures (t along it, s across it); a stall's cloth 2.4 m up throws its square
  vec2 w0 = vec2(${MARKET_PLAN.way.x.toFixed(3)}, ${MARKET_PLAN.way.z.toFixed(3)}), wa = vec2(${MARKET_PLAN.way.dx.toFixed(5)}, ${MARKET_PLAN.way.dz.toFixed(5)});
  vec2 sd = -uSun.xz / max(length(uSun.xz), 1e-3); float k = length(uSun.xz) / max(uSun.y, .1);
  for (int j = 0; j < 2; j++) {
    vec2 q = p - sd * (j == 0 ? 2.4 : 1.2) * k - w0; float t = dot(q, wa), sx = q.x * wa.y - q.y * wa.x;
    float tk = (t - ${(P.MARKET.STALL.W / 2).toFixed(2)}) / ${P.MARKET.STALL.EVERY.toFixed(2)}, kk = floor(tk + .5);
    if (kk < 0. || kk > ${(MARKET_PLAN.stalls.length / 2 - 1).toFixed(1)}) continue;
    float da = abs(tk - kk) * ${P.MARKET.STALL.EVERY.toFixed(2)} - ${(P.MARKET.STALL.W / 2).toFixed(2)}, ds = abs(abs(sx) - ${(P.MARKET.WAY + P.MARKET.STALL.D / 2).toFixed(2)}) - ${(P.MARKET.STALL.D / 2).toFixed(2)};
    lit = min(lit, .3 + .7 * smoothstep(-.15, .3, max(da, ds)));
  }
${MORE_SHADE_GLSL}  return lit;
}
// dark basalt paving: many sided blocks about 1.1 m across, each its own tone, the joints filled with pale dust
// (the blocks melt into one tone where a block is under a pixel)
vec3 basaltAt(vec2 p) {
  vec2 q = p / 1.15, i = floor(q), f = fract(q); float d1 = 9., d2 = 9., id = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); float d = length(g + .15 + .7 * vec2(hash21(i + g), hash21(i + g + 17.3)) - f);
    if (d < d1) { d2 = d1; d1 = d; id = hash21(i + g + 5.1); } else if (d < d2) d2 = d;
  }
  float joint = 1. - smoothstep(.03, .12, d2 - d1), melt = smoothstep(.25, .8, fwidth(q.x) + fwidth(q.y));
  vec3 stone = vec3(.205, .21, .225) * (.74 + .52 * id);
  return mix(mix(stone, vec3(.36, .33, .28), joint * .8), vec3(.225, .225, .232), melt) * (.86 + .28 * fbm2(p * .045 + 3.));
}`;
const GROUND_FS = /* glsl */`
varying vec3 vW;
${P.LIGHT_GLSL}
${P.NOISE_GLSL}
${TOWN_SHADE_GLSL}
${GARDEN_GLSL}
${MARKET_SHADE_GLSL}
void main() {
  float d = famD(vW.xz, 60.);
  if (d < ${(M.RING_DEPTH - 1.0).toFixed(1)}) discard;
  float e = d - ${M.RING_DEPTH.toFixed(1)};
  vec2 p = vW.xz;
  vec3 N = normalize(cross(dFdx(vW), dFdy(vW))); if (N.y < 0.) N = -N;
  // the travertine pavement, 17.5 m wide, in slabs; grey basalt paving beyond the posts over the whole open ground and
  // along the wider street to the east gate
  float ang = atan(p.y, p.x);
  // (slabs about 3.3 m by 2.9 m in six courses round the building: CHOSEN, the research gives the band's width
  // alone; each its own tone, the joints melted where a slab is under a few pixels)
  vec2 slab = vec2(ang * 30. + .5 * floor(e / 2.917), e / 2.917);
  vec2 sf = abs(fract(slab) - .5);
  float joint = smoothstep(.45, .5, max(sf.x, sf.y)) * (1. - smoothstep(.1, .45, max(fwidth(slab.x), fwidth(slab.y))));
  vec3 trav = vec3(.73, .685, .585) * (.86 + .24 * hash21(floor(slab))) * (.95 + .1 * vnoise(p * .7)) * (1. - .34 * joint);
  vec3 basalt = basaltAt(p);
  float pave = 1. - smoothstep(${M.PAVE_W.toFixed(1)} - .15, ${M.PAVE_W.toFixed(1)} + .15, e);
  float plaza = 1. - smoothstep(${(V.PLAZA - 2).toFixed(1)}, ${(V.PLAZA + 1).toFixed(1)}, e);
  float street = (1. - smoothstep(${V.STREET_HALF.toFixed(1)} - .3, ${V.STREET_HALF.toFixed(1)} + .3, abs(p.y))) * step(0., p.x) * (1. - smoothstep(${(V.TOWN.X1 - 40).toFixed(1)}, ${V.TOWN.X1.toFixed(1)}, p.x));
  // the town's lanes: trodden earth and rough paving, mostly in the houses' shade
  float inTown = step(${V.TOWN.XW.toFixed(1)}, p.x) * step(p.x, ${V.TOWN.X1.toFixed(1)}) * step(${V.TOWN.Z0.toFixed(1)}, p.y) * step(p.y, ${V.TOWN.Z1.toFixed(1)});
  inTown *= max(step(${V.TOWN.X0.toFixed(1)}, p.x), step(${V.S_FOOT.toFixed(1)}, p.y));
  // (order two: trodden pale earth and worn paving stones, a darker wet line down the lane's middle)
  vec3 lane = mix(vec3(.47, .42, .34), vec3(.36, .34, .32), smoothstep(.35, .7, vnoise(p * .45))) * (.82 + .36 * vnoise(p * 2.3));
  // the hills' slopes (grass, scrub and garden earth) and their level tops (gravel and beaten earth)
  float slope = 1. - smoothstep(.985, .998, N.y);
  vec3 green = mix(vec3(.2, .24, .11), vec3(.33, .31, .17), fbm2(p * .06));
  vec3 earth = mix(vec3(.36, .32, .25), vec3(.46, .41, .32), fbm2(p * .05));
  // the far city: roofs in haze, drawn flat (terracotta, ochre and plaster in small cells with the lanes dark between)
  vec2 rc = p / 13. + .35 * vec2(vnoise(p * .011), vnoise(p * .011 + 5.));
  vec2 rf = abs(fract(rc) - .5); float rh = hash21(floor(rc));
  vec3 roofs = mix(vec3(.5, .27, .17), vec3(.62, .46, .3), rh) * (1. - .55 * smoothstep(.36, .5, max(rf.x, rf.y)));
  roofs = mix(roofs, green, step(.82, hash21(floor(rc / 5.) + 3.)));
  float r = length(p);
  // (painted flat only beyond the true far roofs, which stand to ${P.FARCITY.R_END} m: nearer, the ground between them is yards'
  // trodden earth and garden green)
  float city = smoothstep(${(P.FARCITY.WIDE.end - 160).toFixed(1)}, ${(P.FARCITY.WIDE.end + 40).toFixed(1)}, r) * (1. - inTown) * (1. - smoothstep(3200., 5600., r));
  city *= smoothstep(.16, .4, fbm2(p * .0016 + 2.));
  // (order three, addendum 8: far off the single roofs melt: whole quarters each in its own tone with the wider streets
  // dark between them and gardens' trees in clumps, so that the far town reads as built ground into the haze)
  vec2 qc = p / vec2(96., 71.) + .6 * vec2(vnoise(p * .004), vnoise(p * .004 + 5.)); vec2 qf = abs(fract(qc) - .5); float qh = hash21(floor(qc) + 11.);
  roofs = mix(roofs, mix(vec3(.47, .25, .16), vec3(.66, .52, .36), qh) * (1. - .4 * smoothstep(.4, .5, max(qf.x, qf.y))), smoothstep(1400., 2600., r));
  roofs = mix(roofs, vec3(.13, .19, .09), smoothstep(.56, .66, fbm2(p * .011 + 4.)) * .85);
  vec3 fields = mix(vec3(.3, .33, .16), vec3(.52, .47, .29), fbm2(p * .004));   // (THE FIELDS BEYOND THE FAR CITY: INVENTED, OURS)
  vec3 alb = mix(earth, green, max(slope, smoothstep(600., 1800., r) * .7));
  alb = mix(alb, fields, smoothstep(1500., 3000., r));
  alb = mix(alb, roofs, city * (1. - slope));
  float yards = smoothstep(${(M.RIM_A + V.PLAZA).toFixed(1)}, ${(M.RIM_A + V.PLAZA + 60).toFixed(1)}, r) * (1. - smoothstep(${(P.FARCITY.WIDE.end - 160).toFixed(1)}, ${(P.FARCITY.WIDE.end + 40).toFixed(1)}, r)) * (1. - slope * (1. - smoothstep(900., 1100., r)));
  alb = mix(alb, mix(lane * 1.05, green * 1.1, smoothstep(.42, .6, fbm2(p * .012 + 9.))), yards * .8);
  // (addendum 8: beyond 600 m the yards between the far roofs carry trees in dark clumps and trodden lanes)
  alb = mix(alb, vec3(.13, .19, .09), yards * smoothstep(600., 900., r) * smoothstep(.5, .62, fbm2(p * .019 + 4.)) * .8);
  // the north hill's level top between the Baths and the palace wing: a garden, its avenue a gravel walk
  float gx = step(${P.GARDEN.X[0].toFixed(1)}, p.x) * step(p.x, ${P.GARDEN.X[1].toFixed(1)}) * step(${(V.PALACE.Z + V.PALACE.PORTICO_D).toFixed(1)}, p.y) * step(p.y, ${V.N_TOP.toFixed(1)});
  if (gx > .5) { alb = gardenAlb(p + vec2(0., ${(-V.N_TOP).toFixed(1)}), vec2(30., 16.)); alb = mix(alb, vec3(.58, .53, .43), 1. - smoothstep(${(P.GARDEN.AVENUE_HALF - 2.5).toFixed(1)}, ${(P.GARDEN.AVENUE_HALF - 2).toFixed(1)}, abs(p.y - ${P.GARDEN.AVENUE_Z.toFixed(1)}))); }
  float lit = 1.;
  if (inTown > .5) { alb = lane; }
  if (street > .5) { alb = basalt; lit = 1.; }
  // (order three: the open paved ground between the terrace's front and the building's own)
  float fore = step(${V.FORE.X0.toFixed(1)}, p.x) * (1. - smoothstep(${(V.FORE.X1 - 1).toFixed(1)}, ${(V.FORE.X1 + .5).toFixed(1)}, p.x)) * smoothstep(${(V.FORE.Z0 - 1.5).toFixed(1)}, ${V.FORE.Z0.toFixed(1)}, p.y) * step(p.y, ${V.FORE.Z1.toFixed(1)});
  plaza = max(plaza, fore);
  // (beyond the posts the whole open ground is DARK BASALT PAVING: the research has basalt beyond the posts only as
  // NOT CHECKED, 2.23; its reach over the open ground is ours; the market's pines and stalls shade it)
  alb = mix(alb, basalt, plaza); lit = mix(lit, 1., plaza);
  alb = mix(alb, trav, pave);
  lit *= mix(1., marketSun(p), plaza * (1. - pave));
  // the houses' shade lies on the lanes, the courts and the open ground's edge
  lit *= townSun(vW + vec3(0., .1, 0.));
  vec3 sun = sunAt(vW + vec3(0., .05, 0.)) * uSunCol * max(dot(N, uSun), 0.) * lit;
  // (between the houses less of the sky is seen, and the walls' warm light comes down instead)
  vec3 col = alb * (sun + uSkyCol * .85 * (1. - .4 * inTown * (1. - street)) + uBounceCol * (.2 + .9 * inTown));
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
const WORLD_VS = /* glsl */`varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

// THE WATER (order two, step 1): a dark, clear, shallow sheet. What the eye meets in it, in this order: the small
// moving ripples (plain waves' sums on the world's clock, each melted where it is under a pixel: the pixel's footprint);
// the MIRROR of the bowl by the bowl's own section, of the cloths strip by strip by the rig's law and of the sky through
// the eye (THE LEANING RING'S MIRROR IS OUT: RING_MIRROR is nought); the BOTTOM a metre down through the water's own colour, lit by the ONE law (the
// sun through the eye with its moving net of light, the wall's shade, the cloths' coloured light); glints where the
// sun lies on it; a darker wet edge at the ledge; soft rings at the marks the arena's law hands over (uMarks: round
// every boat and, faintly, every animal).
// Laws that read the eye here (shading only): the mirror and its share against the bottom, the glints' broad lobe, and
// where the bent sight meets the bottom (the sand, its lie and its bank, the sun's net).
const WATER_MARKS = 24;
// THE WATER'S TONE BY DEPTH. A level floor a metre down under clear water gives every place of the sheet one tone. THE
// FLOOR'S LIE, IN THE TONE ALONE, OURS: packed sand is never dead level. The floor lies the head's one metre down at
// its deepest; in the water's tone it rises in low SHOALS (to SHOAL of the metre less: 0.8 m of water over them;
// fields about 18 m across, by a plain law of place: the same floor for every visit) and is BANKED toward the pit's
// wall (BANK of the depth less at the wall, gone BANK_W m out from it: 0.8 m at the wall, 0.64 m where a shoal meets
// the bank); the sand of a shoal is a little paler (PALE: it lies nearer the light and is packed harder). So the water
// is paler, greener and warmer over the shoals and along the ledge, and deepest in tone over the level floor: BY THIS
// LAW THE DEPTH IN THE TONE IS NEVER MORE THAN THE METRE AND THE SAND NEVER DARKER THAN THE LEVEL FLOOR'S. BY THE
// RIPPLES' OWN LAW (in the shader, at the mirror's share): the smooth lanes between the wind's bands show the floor
// more clearly and a ruffled band mirrors more of what is over it. THE BUILT FLOOR IS LEVEL AND A METRE DOWN, AND
// EVERY LAW OF THE ARENA'S SECTION READS THAT METRE (the animals' shade and pool, the boats, the mirrored images). THE
// MIRROR'S SKY IS A SKY OF ITS OWN (typed in the shader: pale low down, blue higher), not the sky's own picture: OURS,
// by our choice; its share goes by the water's own law. THE FLOOR, ITS LIE AND ITS BANK ARE READ WHERE THE BENT SIGHT
// FROM THE EYE MEETS THE FLOOR (the direction from the water to the eye; the ripple's slope shifts the place a
// little): the shoals and the bank are a law of the floor's place, the same for every visit and every eye. Nothing
// here reads a place of the route, a still or a seed.
const WATER_LIE = { SHOAL: 0.2, BANK: 0.2, BANK_W: 12, PALE: 0.22, GRAIN: 0.055 };
const WATER_FS = /* glsl */`
varying vec3 vW;
${P.LIGHT_GLSL}
${P.NOISE_GLSL}
uniform vec4 uMarks[${WATER_MARKS}]; uniform float uMarkN; uniform float uCrowd;
// the bowl's large shape: the stone's height at d metres out from the arena wall (the section's own figures)
float secY(float d) {
  if (d < 0.) return 0.;
  if (d < ${M.PODIUM_D.toFixed(2)}) return ${M.PODIUM_H.toFixed(2)} + d * ${((M.PODIUM_TOP - M.PODIUM_H) / M.PODIUM_D).toFixed(4)};
  if (d < ${P.SECTION.Z1_D1.toFixed(2)}) return ${P.SECTION.Z1_Y0.toFixed(2)} + (d - ${M.PODIUM_D.toFixed(2)}) * ${(M.ROW_H / M.ROW_D).toFixed(4)};
  if (d < ${P.SECTION.Z2_D0.toFixed(2)}) return ${P.SECTION.Z2_Y0.toFixed(2)};
  if (d < ${M.WALL5_D0.toFixed(2)}) return ${P.SECTION.Z2_Y0.toFixed(2)} + (d - ${P.SECTION.Z2_D0.toFixed(2)}) * ${(M.ROW_H / M.ROW_D).toFixed(4)};
  if (d < ${(M.RING_DEPTH - 1.8).toFixed(1)}) return ${M.ROOF_Y.toFixed(1)};
  return ${M.WALL_H.toFixed(1)};
}
// the ripples' slope at the plan point p: six plain waves of 3.7 m to 0.41 m, each melted where its length is under
// two pixels (fp: metres of water under one pixel), their strength wandering slowly from place to place
#define WAVE(kx, kz, L, A, w) { float ph = (p.x * kx + p.y * kz) * (6.2831853 / L) + t * w; s += vec2(kx, kz) * (A * cos(ph) * (1. - smoothstep(.22 * L, .6 * L, fp))); }
vec2 ripple(vec2 p, float t, float fp) {
  vec2 s = vec2(0.);
  WAVE(.80, .60, 3.7, .008, .9)
  WAVE(-.35, .94, 2.3, .007, -1.2)
  WAVE(.96, -.28, 1.45, .006, 1.6)
  WAVE(-.71, -.70, .93, .0038, -2.1)
  WAVE(.26, .97, .61, .0025, 2.7)
  WAVE(-.92, .39, .41, .0016, -3.4)
  s *= .65 + .7 * vnoise(p * .21 + vec2(t * .05, -t * .04));
  s += (vec2(vnoise(p * 5.1 + vec2(t * .5, 0.)), vnoise(p * 5.1 + vec2(7.3, -t * .45))) - .5) * .0015 * (1. - smoothstep(.05, .18, fp));
  return s;
}
void main() {
  vec3 V = normalize(vW - cameraPosition);
  vec2 p = vW.xz; float t = uTime;
  float fp = max(length(dFdx(p)), length(dFdy(p)));
  vec2 sl = ripple(p, t, fp);
  // (order three, addendum 6, point 2: the water is never one flat tone. THE WIND'S SKIN: soft bands where the light air ruffles the
  // surface, drifting across the long axis on the world's clock; in a band the ripples stand higher and the water
  // mirrors more of what is over it. No white in it anywhere. ADDENDUM 7 (a), a law of the water: its own ripples
  // stay UNDER the oar rings' strength (a ring's slope is 0.021 at a boat's mark of 0.3; the ripples' own reach 0.013
  // in a band and half of that between), so the rings read on it.)
  float ruff = smoothstep(.38, .72, vnoise(vec2(p.x * .09 + t * .05, p.y * .23 + t * .16)) * .65 + vnoise(vec2(p.x * .31 - t * .07, p.y * .6 + t * .22) + 3.) * .35);
  sl *= .5 + .75 * ruff;
  float nearBeast = 99.;
  // lane B's marks: soft rings spreading from where a boat or a beast stands (x, z, radius, strength)
  for (int i = 0; i < ${WATER_MARKS}; i++) {
    if (float(i) >= uMarkN) break;
    vec4 m = uMarks[i]; vec2 dv = p - m.xy; float r = length(dv) + 1e-3;
    sl += dv / r * (.07 * m.w * smoothstep(m.z, .25 * m.z, r) * smoothstep(0., .35, r) * cos(7.5 * r - 4.2 * t));
    if (m.w < .2) nearBeast = min(nearBeast, r);   // (an animal's mark is the faint one: 0.14 walking, 0.1 standing)
  }
  vec3 N = normalize(vec3(-sl.x, 1., -sl.y));
  vec3 R = reflect(V, N); R.y = max(R.y, .02);
  // THE MIRROR. The way of the mirrored sight against the bowl's section (a march, then one step back by the rule of
  // three so that the place it meets the stone is not stepped)
  float run = length(R.xz) + 1e-4, sHit = -1., sPrev = 0., gPrev = -1., dh = 0., gMax = -9., sMax = 0., dMax = 0.;
  for (int i = 1; i <= 16; i++) {
    float s = float(i) * 6.5 / run;
    vec3 q = vW + R * s;
    float dq = famD(q.xz, 20.), gq = secY(dq) - q.y;
    if (sHit < 0. && gq > 0.) { sHit = mix(sPrev, s, clamp(-gPrev / max(gq - gPrev, 1e-4), 0., 1.)); dh = dq; }
    if (sHit < 0.) { sPrev = s; gPrev = gq; if (gq > gMax) { gMax = gq; sMax = s; dMax = dq; } }
  }
  float up = clamp(R.y / run, 0., 1.);
  vec3 sky = mix(vec3(.74, .82, .93), vec3(.2, .4, .8), pow(up, .55)) * 1.1;
  // past the bowl: the cloths, strip by strip, or the sky through the bare ropes and the eye
  vec3 mir = sky;
  {
    float s = (42. - vW.y) / R.y, d = 27.;
    for (int i = 0; i < 3; i++) { d = famD(vW.xz + R.xz * s, d); s = (${M.RINGROPE_Y.toFixed(1)} + ${(M.MAST_TOP - M.RINGROPE_Y).toFixed(1)} * clamp((d - ${P.RIG.D_RING.toFixed(1)}) / ${P.RIG.SPAN.toFixed(1)}, -.2, 1.2) - vW.y) / R.y; }
    vec2 h = vW.xz + R.xz * s;
    float tau = (d - ${P.RIG.D_RING.toFixed(1)}) / ${P.RIG.SPAN.toFixed(1)};
    // (the mirror is soft: the smallest ripples blur an edge, the larger make it waver)
    float on = smoothstep(uCloth.x - .045, uCloth.x + .045, tau) * (1. - smoothstep(.97, 1.01, tau));
    float ang = atan(h.y / (FA_B + FA_K * d), h.x / (FA_A + d));
    float jf = fract(ang / 6.2831853 + uArc.x * sin(2. * ang) + uArc.y * sin(4. * ang)) * ${M.MASTS.toFixed(1)};
    float j = floor(jf - .5), a = jf - .5 - j;
    float belly = .74 + .26 * sin(3.14159 * fract(jf));        // each strip's own belly between its two ropes
    vec3 cp = vec3(h.x, ${M.RINGROPE_Y.toFixed(1)} + ${(M.MAST_TOP - M.RINGROPE_Y).toFixed(1)} * tau + 2., h.y);
    float lit = sunAt(cp).x;                                   // the wall's shade on the cloth's upper side
    float lift = clothLiftG(a, 1. - tau, j, uTime);
    vec3 cc = mix(clothColour(mod(j, ${M.MASTS.toFixed(1)})), clothColour(mod(j + 1., ${M.MASTS.toFixed(1)})), smoothstep(.15, .85, a)) * (uSunCol * uCloth.y * 1.5 * lit * (.75 + .4 * lift) + uSkyCol * .5) * belly;
    mir = mix(sky, cc, on);
  }
  // the stone before them; a sight that only just clears the stone's edge takes a share of it (the mirrored edge is
  // soft, as ripples make it)
  float graze = smoothstep(-1.6, 0., gMax);
  if (sHit < 0. && graze > 0.) { sHit = sMax; dh = dMax; } else graze = 1.;
  if (sHit > 0.) {
    vec3 hp = vW + R * sHit;
    vec2 rad = normalize(hp.xz / vec2((FA_A + dh) * (FA_A + dh), (FA_B + FA_K * dh) * (FA_B + FA_K * dh)));
    float wallish = step(dh, .15) + smoothstep(${(M.WALL5_D0 - 1.2).toFixed(1)}, ${M.WALL5_D0.toFixed(1)}, dh);
    vec3 nS = normalize(vec3(-rad.x, mix(1.7, .05, clamp(wallish, 0., 1.)), -rad.y));
    vec3 zone = mix(vec3(${P.COLOUR.MARBLE.map((x) => x.toFixed(3)).join(', ')}), vec3(.34, .29, .23), smoothstep(${(M.WALL5_D0 - 1).toFixed(1)}, ${(M.WALL5_D0 + 1.5).toFixed(1)}, dh));
    // the rows' people (lane C's, from the hour its part stands): a broken darker tone on the two zones and the podium
    float crowd = uCrowd * (1. - smoothstep(${(M.WALL5_D0 - 1).toFixed(1)}, ${(M.WALL5_D0 + 1.5).toFixed(1)}, dh)) * step(.2, dh);
    // (addendum 6, point 2: the crowd's colours in the far water: wedge by wedge a warmer or a cooler cloth, darker
    // high up, as the seating's own rings of dress go)
    float cw = hash21(floor(vec2(atan(hp.z, hp.x) * 13., dh * .22)));
    vec3 dress = mix(mix(vec3(.74, .7, .64), vec3(.62, .36, .26), smoothstep(.55, .8, cw)), vec3(.36, .3, .26), smoothstep(${(M.WALL5_D0 - 9).toFixed(1)}, ${(M.WALL5_D0 - 2).toFixed(1)}, dh));
    zone = mix(zone, dress * (.8 + .4 * hash21(floor(vec2(atan(hp.z, hp.x) * 90., dh * 1.4)))), crowd * .85);
    zone = mix(zone, vec3(${P.COLOUR.TRAVERTINE.map((x) => x.toFixed(3)).join(', ')}), smoothstep(${(M.STAND_D1 + 2).toFixed(1)}, ${(M.STAND_D1 + 5).toFixed(1)}, dh));
    vec3 sunS = sunAt(hp + vec3(0., .3, 0.)) * uSunCol * max(dot(nS, uSun), 0.);
    // (addendum 2, point 5: the ripples turn a third of such a sight on up into the sky: the stone's mirror is the
    // stone's own tone paled toward the sky, never a browner band)
    mir = mix(mir, mix(zone * (sunS + uSkyCol * (.55 + .3 * nS.y) + uBounceCol * .6), sky, .34), graze);
  }
  // (ADDENDUM 8: OUT. RING_MIRROR is nought and the glow below adds nothing; the law stands for the day it is wanted.)
  // THE RING'S MIRROR (order three: no outline; addendum 4 (a): ONE SOFT PALE GLOW, no bright broken strips: there is
  // no foam at the animals before the ring's foot, and nothing may look like it): the leaning ring is a glowing thing over the water
  // (its lower rim 1.5 m clear of the surface); the water gives it back as one faint even glow about the mirrored
  // sight's place on the ring's own plane, widest at the middle, gone before one and a half of the ring's radius
  float ringGlow = 0.;
  {
    vec3 rc = vec3(${M.RING.map((x) => x.toFixed(2)).join(', ')}), rn = vec3(${(-Math.cos(P.ROUTE.DOWN_DEG * P.DEG)).toFixed(5)}, ${(-Math.sin(P.ROUTE.DOWN_DEG * P.DEG)).toFixed(5)}, 0.);
    vec3 Rg = reflect(V, vec3(0., 1., 0.));
    float dn = dot(Rg, rn), tr = dot(rc - vW, rn) / (abs(dn) > 1e-3 ? dn : 1e-3);
    float rr = length(vW + Rg * tr - rc);
    // (addendum 6, point 2: GOLD, and drawn out toward the lens as the ripples draw a light's mirror out: one soft
    // road, three times as long as it is wide, no strips in it)
    vec3 dv = vW + Rg * tr - rc; float along = dv.x * ${Math.sin(P.ROUTE.DOWN_DEG * P.DEG).toFixed(5)} - dv.y * ${Math.cos(P.ROUTE.DOWN_DEG * P.DEG).toFixed(5)};
    rr = length(vec2(dv.z, along / 3.6));
    if (tr > 0.) { float g = 1. - smoothstep(0., ${(M.RING_R * 1.4).toFixed(2)}, rr); ringGlow = g * g * ${RING_MIRROR.toFixed(2)}; }
  }
  // THE BOTTOM: packed sand a metre down, seen where the bent sight meets it, through the water's own colour (the red
  // goes first), lit by the one law; the sun's moving net of light where the sun reaches it
  float c = clamp(dot(-V, N), 0., 1.);
  vec2 bp = p + V.xz / max(-V.y, .3) * ${(M.WATER_DEEP * 0.55).toFixed(2)} + sl * 6.;
  vec3 sunB = sunAt(vec3(bp.x, vW.y + .05, bp.y));
  // (order three, addendum 2, point 3: THE LIT WATER IS THE CLEAREST AND MOST COLOURED WATER IN THE BOWL. The cloths'
  // pale mirror must not lie as a milky sheet over a dark floor, nor the sun's patch be only blue: the floor is PALE
  // packed sand; a metre of clear water over
  // it in the sun is green-blue and bright, with the sun's net of light moving on the sand (meshes about a metre: they
  // show from the line); in the shade the same floor stands in the fill alone, dim; and the mirror takes the share
  // water gives it: little where the sight is steep, growing as the sight flattens toward the far ledge.)
  float n1 = vnoise(bp * 2.1 + vec2(t * .3, t * .2)), n2 = vnoise(bp * 2.6 + vec2(-t * .26, t * .23) + 11.);
  float net = pow(1. - abs(n1 - n2), 10.);
  float caust = mix(.88 + .66 * net, 1., smoothstep(.2, .7, fp));
  vec3 sand = vec3(.52, .475, .4) * (.84 + .32 * fbm2(bp * .31));
  // (THE FLOOR'S LIE, IN THE TONE ALONE; see WATER_LIE above this shader)
  float lie = clamp((fbm2(bp * ${WATER_LIE.GRAIN.toFixed(3)} + vec2(3.7, 9.1)) - .5) * 5., -1., 0.);
  float bank = 1. - smoothstep(0., ${WATER_LIE.BANK_W.toFixed(1)}, -(famD(bp, -4.) + 1.5));
  float deep = ${M.WATER_DEEP.toFixed(1)} * (1. + ${WATER_LIE.SHOAL.toFixed(2)} * lie) * (1. - ${WATER_LIE.BANK.toFixed(2)} * bank);
  sand *= 1. - ${WATER_LIE.PALE.toFixed(2)} * lie;
  float way = deep * (1. / max(uSun.y, .3) + 1. / mix(.72, 1., c));
  // (addendum 6, point 2: THE SHADED WATER KEEPS ITS COLOUR: the sky's fill through the eye and the day thrown back
  // by the lit stands reach the floor under the shade too: shade on clear water, not a grey half)
  vec3 fillB = uSkyCol * 1.15 + uBounceCol * .9;
  // (THE WATER'S LOSS OF COLOUR, a metre of the light's way, red first: .43, .092, .06. The part's arena section
  // holds the same figure by hand, WATER_LOSS, for the pool under an animal: the figures stand by hand in both files
  // and each MUST FOLLOW the other.)
  vec3 bottom = sand * exp(-vec3(.43, .092, .06) * way) * (sunB * uSunCol * uSun.y * caust + fillB);
  // the water's own colour: the light scattered back out of its depth (more where the sun is in it)
  bottom += vec3(.01, .05, .075) * (.85 + 1.0 * dot(sunB, vec3(.3333)));
  // the mirror's share by the eye's direction (the plain surface's, a little of the ripple's)
  float cF = mix(clamp(-V.y, 0., 1.), c, .35);
  // (addendum 6, point 2: the far water, where the sight is flat, mirrors the stands, the crowd and the cloths; a
  // ruffled band mirrors a little more; and the ripples' slopes take the day's light and lose it, facet by facet)
  float F = .07 + .93 * pow(1. - cF, 2.6);
  // (by the ripples' own law: the smooth lanes between the wind's bands show the floor more clearly and a ruffled
  // band mirrors more: .78 + 1.1 times the ruffle; at a mean ruffle of .4 that is 1.22 times the plain surface's share)
  F = min(1., F * (.78 + 1.1 * ruff) + .05 * ruff);
  vec3 col = mix(bottom, mir, F);
  col *= 1. + 9. * dot(sl, normalize(uSun.xz)) * (1. - smoothstep(.3, 1.2, fp));
  // the glints where the sun lies on the water (order three: fewer, larger, moving, in the sun's patch alone): short
  // bright streaks on the ripples' crests, each drifting with the ripples and turning in and out of the sun on the
  // world's clock, one cell in six at a time; IN THE SUN'S ROAD ALONE (addenda 2 and 4: no fine white
  // speckle over the lit water): where the eye looks toward the sun's own mirror, and none where it looks down the sun (the
  // line flies west with the morning sun behind it: from the line the lit water shows its pale floor and the sun's
  // net, not glitter; this is a law of the water and holds over its whole face); far off, where a streak is under a
  // pixel, their mean as a soft shimmer
  vec3 sunW = sunAt(vW + vec3(0., .05, 0.));
  vec2 gq = vec2(p.x / 1.5 - t * .12, p.y / .7 + t * .05), gc = floor(gq); float gh = hash21(gc);
  float tw = pow(max(sin(t * (1.1 + 1.7 * gh) + gh * 40.), 0.), 6.) * step(.83, hash21(gc + 1.3));
  vec2 gd = fract(gq) - .5 - (vec2(hash21(gc + 3.1), hash21(gc + 7.7)) - .5) * .5;
  float dot1 = smoothstep(.2, .02, length(gd * vec2(1., 2.6)));
  float lobe = pow(max(dot(normalize(R), uSun), 0.), 4.);
  float glint = mix(tw * dot1 * 2.6, .1 * (.5 + vnoise(p * 1.7 + vec2(t * .9, -t * .6))), smoothstep(.1, .5, fp));
  // (addendum 7 (a), a law of the water: no glint within 3 m of an animal's mark: nothing splashes at a wading body)
  col += sunW * uSunCol * glint * lobe * smoothstep(3., 4.5, nearBeast);
  // (addendum 7: it must read as THE GOLD RING'S MIRROR, not as white water: the ring's own gold, full, never pale)
  col = mix(col, vec3(1., .6, .15) * 1.02, ringGlow * max(F, .8));
  // the wet edge: darker where the water lies against the ledge's wall, its border wavering with the ripples
  float e = famD(p, -4.) + 1.5 + .12 * sin(p.x * 2.1 + t * 1.3) * sin(p.y * 1.7 - t * 1.1);
  col *= 1. - .5 * smoothstep(-.8, -.05, e);
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
// the town's houses: plastered walls with a few small windows and doors, roofs of small rough tiles with their ribs
// running down the slope and a line of ridge tiles (ribs and courses melted where one is under a pixel: the pixel's
// footprint); a court's tree; a cloth hung across a lane (it stirs on the world's clock). aUV.z: 0 a wall, 1 a roof,
// 2 a tree, 3 a hung cloth.
const TOWN_VS = /* glsl */`
attribute vec3 aCol; attribute vec3 aUV;
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vUV;
${STIR_GLSL}
void main() {
  vec3 p = position;
  if (aUV.z > 2.5) p.y += .09 * aUV.y * sin(uTime * 1.3 + position.x * .7 + position.z * .3) + .05 * aUV.y * sin(uTime * 2.9 + position.x * 1.9);
  if (aUV.z > 1.5 && aUV.z < 2.5) p.xz += stir(position.xz, uTime) * aUV.y * aUV.y;   // a court's tree: the one law of stirring
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normal; vCol = aCol; vUV = aUV; gl_Position = projectionMatrix * viewMatrix * w;
}`;
const TOWN_FS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vUV;
${P.LIGHT_GLSL}
${P.NOISE_GLSL}
${TOWN_SHADE_GLSL}
void main() {
  vec3 N = normalize(vN), alb = vCol; float ao = 1., lit = 1., cloud = cloudSun(vW);
  vec2 key = floor(vCol.rg * 96. + .5);                      // the house's own number (a varying's last bits waver)
  if (vUV.z > 2.5) {
    // a hung cloth: lit from above or through its weave from below, both plainly
    if (!gl_FrontFacing) N = -N;
    alb *= .92 + .08 * sin(vUV.x * 9.);
    vec3 c = alb * (uSunCol * (.35 + .65 * abs(N.y)) * townSun(vW + vec3(0., .3, 0.)) * cloud + uSkyCol * .9 + uBounceCol * .5);
    gl_FragColor = vec4(hazed(c, vW), 1.); return;
  } else if (vUV.z > 1.5) {
    // a tree: leaves in clumps, darker inside and below
    alb *= (.7 + .6 * vnoise(vW.xz * 1.7 + vW.y * 1.3)) * (.6 + .4 * vUV.y);
    lit = .55 + .45 * vnoise(vW.xy * 2.3 + 7.);
  } else if (vUV.z > .5) {
    // a roof: small pan tiles, a rib every 0.3 m down the slope, a course every 0.36 m, every tile a little its own
    // tone, older and paler patches, the ridge tiles' line along the top
    float fw = fwidth(vUV.x), fwv = fwidth(vUV.y), rib = abs(fract(vUV.x / .3) - .5) * 2.;
    float near = 1. - smoothstep(.07, .26, max(fw, fwv));
    float ribs = mix(.9, 1. - .34 * smoothstep(.5, .92, rib), near);
    float course = 1. - .16 * smoothstep(.72, 1., fract(vUV.y / .36)) * near;
    float tileTone = mix(1., .82 + .36 * hash21(floor(vec2(vUV.x / .3, vUV.y / .36)) + key * 1.37), near);
    float patchy = .78 + .44 * vnoise(vW.xz * .55 + key * .61);
    float lichen = smoothstep(.62, .85, vnoise(vW.xz * 1.9 + 11.)) * .3;
    alb = mix(alb * ribs * course * tileTone * patchy, vec3(.45, .42, .34), lichen);
    float ridge = 1. - smoothstep(.16, .3, vUV.y);
    alb = mix(alb, vCol * 1.12 * (.9 + .2 * step(.5, fract(vUV.x / .42))), ridge * .8);
  } else {
    // a wall: plaster with streaks, a darker foot, small shuttered windows high up and doors on the lane
    alb *= .9 + .2 * vnoise(vec2(vUV.x * .8, vUV.y * 2.5));
    float wx = abs(fract(vUV.x / 3.1) - .5) * 3.1, upper = step(abs(vUV.y - 4.6), .5) + step(abs(vUV.y - 7.9), .5) * step(9., vCol.r * 0. + vUV.y + 1.6);
    float win = step(wx, .32) * min(upper, 1.) * step(.3, hash21(floor(vec2(vUV.x / 3.1, vUV.y / 3.3)) + key * 1.91));
    float door = step(abs(fract(vUV.x / 6.2 + .25) - .5) * 6.2, .6) * step(vUV.y, 2.2);
    alb = mix(alb, vec3(.07, .06, .05), max(win, door) * (1. - .7 * smoothstep(.2, .7, fwidth(vUV.x))));
    alb *= 1. - .25 * (1. - smoothstep(0., 1.2, vUV.y));
    ao = mix(.5, 1., smoothstep(0., 7., vUV.y));
    // the neighbours' shade on it (the wall's own house stands behind it)
    lit = townSun(vW + N * .6);
  }
  vec3 sun = uSunCol * max(dot(N, uSun), 0.) * lit * cloud;
  vec3 col = alb * (sun + uSkyCol * (.55 + .35 * N.y) * ao + uBounceCol * (.9 - .5 * N.y) * ao * (.55 + .45 * cloud));
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
const TOWN_TONES = [[0.70, 0.53, 0.30], [0.78, 0.71, 0.56], [0.55, 0.30, 0.22]];
const ROOF_TONE = [0.53, 0.31, 0.2];
async function townGeometry(houses, rng, farRoofs = [], pause = async () => {}) {
  const pos = [], nor = [], col = [], uv = [], idx = []; let n = 0;
  const quad = (a, b, c, d, nrm, c3, uvs) => {
    for (const [q, t] of [[a, uvs[0]], [b, uvs[1]], [c, uvs[2]], [d, uvs[3]]]) { pos.push(q[0], q[1], q[2]); nor.push(nrm[0], nrm[1], nrm[2]); col.push(c3[0], c3[1], c3[2]); uv.push(t[0], t[1], t[2]); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  };
  const tri = (a, b, c, nrm, c3, uvs) => {
    [a, b, c].forEach((q, i) => { pos.push(q[0], q[1], q[2]); nor.push(nrm[0], nrm[1], nrm[2]); col.push(c3[0], c3[1], c3[2]); uv.push(uvs[i][0], uvs[i][1], uvs[i][2]); });
    idx.push(n, n + 1, n + 2); n += 3;
  };
  // (a far roof's house leaves out the walls no place of the line can face: its .no)
  let done = 0;
  for (const h of [...houses, ...farRoofs]) {
    if (++done % 130 === 0) await pause();                       // (a slice of at most 130 houses, then the page breathes)
    const { x0, x1, z0, z1, base, eave, ridge } = h, w = x1 - x0, d = z1 - z0, top = eave - base, no = h.no || '';
    const tv = 0.88 + 0.24 * rng(), c = TOWN_TONES[h.tone].map((v) => v * tv), rv = 0.78 + 0.4 * rng(), old = rng() * rng(), rc = ROOF_TONE.map((v, i) => (v + ([0.44, 0.37, 0.29][i] - v) * old) * rv * (i === 0 ? 1 : 0.9 + 0.2 * rng()));
    // the four walls (outward, counter clockwise seen from outside); uv: metres along the wall, metres above the base
    if (!no.includes('f')) quad([x0, base, z1], [x1, base, z1], [x1, eave, z1], [x0, eave, z1], [0, 0, 1], c, [[0, 0, 0], [w, 0, 0], [w, top, 0], [0, top, 0]]);
    if (!no.includes('b')) quad([x1, base, z0], [x0, base, z0], [x0, eave, z0], [x1, eave, z0], [0, 0, -1], c, [[0, 0, 0], [w, 0, 0], [w, top, 0], [0, top, 0]]);
    if (!no.includes('r')) quad([x1, base, z1], [x1, base, z0], [x1, eave, z0], [x1, eave, z1], [1, 0, 0], c, [[0, 0, 0], [d, 0, 0], [d, top, 0], [0, top, 0]]);
    if (!no.includes('l')) quad([x0, base, z0], [x0, base, z1], [x0, eave, z1], [x0, eave, z0], [-1, 0, 0], c, [[0, 0, 0], [d, 0, 0], [d, top, 0], [0, top, 0]]);
    const o = 0.45, rise = ridge - eave;
    if (h.axis === 0) {
      // the ridge along X: slopes fall to -Z and +Z, gables on the X ends
      const zm = (z0 + z1) / 2, half = d / 2, sl = Math.hypot(half + o, rise * (half + o) / half), ny = half / Math.hypot(half, rise), nz = rise / Math.hypot(half, rise), ye = eave - rise * o / half;
      quad([x0 - o, ye, z1 + o], [x1 + o, ye, z1 + o], [x1 + o, ridge, zm], [x0 - o, ridge, zm], [0, ny, nz], rc, [[0, sl, 1], [w, sl, 1], [w, 0, 1], [0, 0, 1]]);
      quad([x1 + o, ye, z0 - o], [x0 - o, ye, z0 - o], [x0 - o, ridge, zm], [x1 + o, ridge, zm], [0, ny, -nz], rc, [[0, sl, 1], [w, sl, 1], [w, 0, 1], [0, 0, 1]]);
      if (!no.includes('r')) tri([x1, eave, z1], [x1, eave, z0], [x1, ridge, zm], [1, 0, 0], c, [[0, top, 0], [d, top, 0], [half, top + rise, 0]]);
      if (!no.includes('l')) tri([x0, eave, z0], [x0, eave, z1], [x0, ridge, zm], [-1, 0, 0], c, [[0, top, 0], [d, top, 0], [half, top + rise, 0]]);
    } else {
      const xm = (x0 + x1) / 2, half = w / 2, sl = Math.hypot(half + o, rise * (half + o) / half), ny = half / Math.hypot(half, rise), nx = rise / Math.hypot(half, rise), ye = eave - rise * o / half;
      quad([x1 + o, ye, z1 + o], [x1 + o, ye, z0 - o], [xm, ridge, z0 - o], [xm, ridge, z1 + o], [nx, ny, 0], rc, [[0, sl, 1], [d, sl, 1], [d, 0, 1], [0, 0, 1]]);
      quad([x0 - o, ye, z0 - o], [x0 - o, ye, z1 + o], [xm, ridge, z1 + o], [xm, ridge, z0 - o], [-nx, ny, 0], rc, [[0, sl, 1], [d, sl, 1], [d, 0, 1], [0, 0, 1]]);
      if (!no.includes('f')) tri([x0, eave, z1], [x1, eave, z1], [xm, ridge, z1], [0, 0, 1], c, [[0, top, 0], [w, top, 0], [half, top + rise, 0]]);
      if (!no.includes('b')) tri([x1, eave, z0], [x0, eave, z0], [xm, ridge, z0], [0, 0, -1], c, [[0, top, 0], [w, top, 0], [half, top + rise, 0]]);
    }
  }
  await pause();
  // a court's tree: a short trunk and a round, lumpy crown of forty eight faces with the crown's own normals (uv.y: 0 low,
  // 1 high; uv.z 2); the leaf a dull dark green (holm oak, laurel, fig: the kind is not said)
  for (const c of houses.courts) {
    const R = Math.min(c.r * 0.72, 3.4) * (0.8 + 0.4 * rng()), ty = c.base + 2.2 + R * 0.5, cy = ty + R * 0.75, tr = 0.22, lv = 0.8 + 0.4 * rng(), leaf = [0.062 * lv, 0.082 * lv, 0.04 * lv], bark = [0.25, 0.2, 0.15];
    const tx = c.x + (rng() - 0.5) * c.r * 0.5, tz = c.z + (rng() - 0.5) * c.r * 0.5;
    for (let k = 0; k < 4; k++) {
      const f0 = Math.PI / 2 * k, f1 = Math.PI / 2 * (k + 1), a = [tx + tr * Math.cos(f0), tz + tr * Math.sin(f0)], b = [tx + tr * Math.cos(f1), tz + tr * Math.sin(f1)], fm = (f0 + f1) / 2;
      quad([b[0], c.base, b[1]], [a[0], c.base, a[1]], [a[0], ty, a[1]], [b[0], ty, b[1]], [Math.cos(fm), 0, Math.sin(fm)], bark, [[0, 0, 2], [0, 0, 2], [0, 0.4, 2], [0, 0.4, 2]]);
    }
    const S = 8, rings = [[-0.92, 0.38], [-0.45, 0.88], [0.1, 1.0], [0.6, 0.78], [0.97, 0.25]], first = n;
    for (let r = 0; r < rings.length; r++) for (let k = 0; k < S; k++) {
      const f = Math.PI * 2 * (k + 0.5 * (r % 2)) / S, lump = 0.82 + 0.36 * rng(), rr = rings[r][1] * R * lump, y = rings[r][0] * R * 0.85 * (0.9 + 0.2 * rng());
      const px = rr * Math.cos(f), pz = rr * Math.sin(f), l = Math.hypot(px, y * 1.2, pz) || 1;
      pos.push(tx + px, cy + y, tz + pz); nor.push(px / l, y * 1.2 / l, pz / l); col.push(leaf[0], leaf[1], leaf[2]); uv.push(0, 0.5 + 0.5 * rings[r][0], 2);
    }
    n += rings.length * S;
    for (let r = 0; r + 1 < rings.length; r++) for (let k = 0; k < S; k++) {
      const a = first + r * S + k, b = first + r * S + (k + 1) % S, c2 = first + (r + 1) * S + k, d2 = first + (r + 1) * S + (k + 1) % S;
      idx.push(a, c2, b, b, c2, d2);
    }
    for (let k = 1; k + 1 < S; k++) { idx.push(first, first + k, first + k + 1); const t = first + (rings.length - 1) * S; idx.push(t, t + k + 1, t + k); }
  }
  // a cloth hung across a lane, sagging in its middle (uv.y: how free it is to stir; uv.z 3)
  const HUNG = [[0.72, 0.68, 0.58], [0.62, 0.48, 0.25], [0.5, 0.27, 0.2], [0.36, 0.4, 0.45]];
  for (const h of houses.hung) {
    const c = HUNG[h.tone < 0.45 ? 0 : h.tone < 0.65 ? 1 : h.tone < 0.83 ? 2 : 3], xa = h.x - h.w / 2, xb = h.x + h.w / 2, zm = (h.z0 + h.z1) / 2, ys = h.y - 0.3 - 0.3 * h.tone;
    quad([xa, h.y, h.z0], [xa, ys, zm], [xb, ys, zm], [xb, h.y, h.z0], [0, 1, 0], c, [[0, 0, 3], [0, 1, 3], [h.w, 1, 3], [h.w, 0, 3]]);
    quad([xa, ys, zm], [xa, h.y, h.z1], [xb, h.y, h.z1], [xb, ys, zm], [0, 1, 0], c, [[0, 1, 3], [0, 0, 3], [h.w, 0, 3], [h.w, 1, 3]]);
  }
  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  await pause();
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
  await pause();                                                 // (the lists are long: each is made the geometry's own by itself)
  g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3)); g.setIndex(idx);
  await pause();
  return g;
}
// the town's tops from above, for the houses' shade (TOWN_SHADE_GLSL): one byte a place, a quarter metre a step
const TOWN_MAP = 1024;
function townHeights(houses) {
  const T = V.TOWN, x0 = T.XW - 12, z0 = T.Z0 - 12, w = T.X1 - T.XW + 24, d = T.Z1 - T.Z0 + 24, N = TOWN_MAP, data = new Uint8Array(N * N);
  for (const h of houses) {
    const v = Math.min(255, Math.round((h.eave + (h.ridge - h.eave) * 0.4) / 0.25));
    const c0 = Math.max(0, Math.floor((h.x0 - x0) / w * N)), c1 = Math.min(N - 1, Math.ceil((h.x1 - x0) / w * N)), r0 = Math.max(0, Math.floor((h.z0 - z0) / d * N)), r1 = Math.min(N - 1, Math.ceil((h.z1 - z0) / d * N));
    for (let r = r0; r < r1; r++) data.fill(v, r * N + c0, r * N + c1);
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { uTownH: { value: tex }, uTownBox: { value: new THREE.Vector4(x0, z0, 1 / w, 1 / d) } };
}

// THE HILLS' GREAT MASSES (forms INVENTED, OURS): plain large boxes; their colonnades, arcades, windows, tiles and
// steps are drawn on their faces from the face's own metres (uv) and four figures (par): the bay's width, the opening's
// height, the storey's height, the pier's or column's width.
const HK = { WALL: 0, COLONNADE: 1, ARCADE: 2, TILE: 3, STAIR: 4, TOP: 5, SHADE: 6, GARDEN: 7, LEAF: 8, COLUMN: 9, CLOTH: 10, CELLA: 11, ENTAB: 12 };
const HILL_VS = /* glsl */`
attribute vec3 aCol; attribute vec3 aUV; attribute vec4 aPar;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vUV; varying vec4 vPar;
uniform float uTime;
// THE WIND STIRS THE TREES by the one law (stir): a leaf's vertex leans by the square of its height in its crown
${STIR_GLSL}
void main() {
  vec3 p = position;
  if (aUV.z > ${(HK.LEAF - 0.5).toFixed(1)} && aUV.z < ${(HK.LEAF + 0.5).toFixed(1)}) { float h = clamp(aUV.y, 0., 1.); p.xz += stir(position.xz, uTime) * h * h; }
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normal; vCol = aCol; vUV = aUV; vPar = aPar; gl_Position = projectionMatrix * viewMatrix * w; }`;
// THE TERRACE'S ROWS' LONG SHADOWS (order three: the hour for the eye): the shade of a row's cypresses on the terrace's
// floor, from the part's law of place (terraceRows, rowTree): the way from a place toward the sun meets the row's line
// at one tree; that tree and its two neighbours are tried, each a spindle by its height and girth
const ROWS = P.terraceRows(), WALK = ROWS.find((r) => r.walk).walk, TEMPLE = P.hillMasses().temple;
const ROW_SHADE_GLSL = /* glsl */`
float spindle(float v) { return v < .05 ? .5 : v < .36 ? mix(.5, 1., (v - .05) / .31) : v < .74 ? mix(1., .6, (v - .36) / .38) : mix(.6, 0., (v - .74) / .26); }
float rowShade(vec2 p, vec4 row, vec3 par) {
  vec2 sd = uSun.xz; float sl = max(length(sd), 1e-3); sd /= sl; float k = uSun.y / sl;
  vec2 o = row.xy, a = row.zw, q = o - p;
  float den = sd.x * a.y - sd.y * a.x;
  if (abs(den) < 1e-3) return 1.;
  float s = (q.x * sd.y - q.y * sd.x) / den, k0 = floor(s / par.x + .5), lit = 1.;
  for (int i = -1; i <= 1; i++) {
    float kk = k0 + float(i);
    if (kk < 0. || kk > par.y - .5) continue;
    float h = ${P.GARDEN.ROW_H[0].toFixed(1)} + ${(P.GARDEN.ROW_H[1] - P.GARDEN.ROW_H[0]).toFixed(1)} * fract(kk * .618034 + par.z);
    float r = ${P.GARDEN.ROW_R[0].toFixed(2)} + ${(P.GARDEN.ROW_R[1] - P.GARDEN.ROW_R[0]).toFixed(2)} * fract(kk * .414214 + par.z * 2.3);
    vec2 c = o + a * kk * par.x - p;
    float along = dot(c, sd), miss = abs(c.x * sd.y - c.y * sd.x), y = along * k;
    if (along < 0. || y > h) continue;
    float prof = r * spindle(y / h);
    lit = min(lit, smoothstep(prof - .3, prof + .3, miss));
  }
  return lit;
}
float terraceSun(vec2 p) {
  float lit = 1.;
${ROWS.map((r) => `  lit = min(lit, rowShade(p, vec4(${r.ox.toFixed(3)}, ${r.oz.toFixed(3)}, ${r.ax.toFixed(5)}, ${r.az.toFixed(5)}), vec3(${r.every.toFixed(1)}, ${r.n.toFixed(1)}, ${r.phase.toFixed(2)})));`).join('\n')}
  return lit;
}`;
// A BRICK FACE (the terrace's valley wall; par: minus a brick's length, a course's height): over the wall kind's own
// courses and weather, THE BRICK'S OWN COURSES by the world's own law of coursed blocks (the walks' back wall's and
// the temple room's: courses of staggered blocks, a tone of its own to each, the joints melted where one is under a
// pixel: the pixel's footprint). It takes no part in the light.
const BRICK = [0.6, 0.3];   // a brick's length and a course's height as drawn, in metres: the world's law of coursed walls at this measure, far larger than a Roman brick, OURS (said at the head)
const BRICK_GLSL = /* glsl */`    if (vPar.x < 0.) {
      vec2 bq = vec2(u / -vPar.x + .5 * floor(v / vPar.y), v / vPar.y), bf = abs(fract(bq) - .5);
      float seen = 1. - smoothstep(.15, .5, max(fwidth(u) / -vPar.x, fwidth(v) / vPar.y));
      alb *= mix(1., .94 + .1 * hash21(floor(bq)), seen) * (1. - .16 * smoothstep(.44, .5, max(bf.x, bf.y)) * seen);
    }
`;
const HILL_FS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vUV; varying vec4 vPar;
${P.LIGHT_GLSL}
${P.NOISE_GLSL}
${GARDEN_GLSL}
${ROW_SHADE_GLSL}
void main() {
  vec3 N = normalize(vN), alb = vCol; float kind = floor(vUV.z + .5), shade = 1., amb = 1., wrap = 0.;
  float u = vUV.x, v = vUV.y;
  if (kind == ${HK.COLONNADE}.) {
    // a portico's front: columns, the dark walk behind them, a plain beam over each storey
    float sv = mod(v, vPar.z), cu = abs(fract(u / vPar.x) - .5) * vPar.x;
    float open = step(vPar.w * .5, cu) * step(sv, vPar.y);
    alb = mix(alb, vCol * .3, open); shade = 1. - open;
    alb *= 1. - .18 * step(vPar.y, sv) * step(sv, vPar.y + .25);
  } else if (kind == ${HK.ARCADE}.) {
    // arches between piers, row on row
    float sv = mod(v, vPar.z), cu = abs(fract(u / vPar.x) - .5) * vPar.x, hw = (vPar.x - vPar.w) * .5, spring = vPar.y - hw;
    float open = step(cu, hw) * (sv < spring ? 1. : step(length(vec2(cu, sv - spring)), hw));
    alb = mix(alb, vCol * .26, open); shade = 1. - open;
    alb *= 1. - .15 * step(vPar.z - .5, sv);
    amb = 1.3;                                                  // (a pale front in its own shade stands in the sky's light)
  } else if (kind == ${HK.TILE}.) {
    amb = 1.25;
    float rib = abs(fract(u / .5) - .5) * 2.;
    alb *= mix(1. - .3 * smoothstep(.55, .9, rib), .87, smoothstep(.12, .45, fwidth(u))) * (.85 + .3 * vnoise(vW.xz * .7));
  } else if (kind == ${HK.STAIR}.) {
    // a flight of steps: each tread lit, each riser a thin dark line (melting where a step is under a pixel)
    alb *= mix(1. - .4 * step(.72, fract(v / vPar.x)), .9, smoothstep(.15, .5, fwidth(v) / vPar.x));
  } else if (kind == ${HK.TOP}.) {
    alb *= .9 + .2 * fbm2(vW.xz * .07);
    alb = mix(alb, vec3(.22, .27, .12), vPar.x * smoothstep(.45, .6, fbm2(vW.xz * .03 + 4.)));
  } else if (kind == ${HK.SHADE}.) {
    // the wall at the back of a portico's walk, under its roof: no sun, less sky; a plain door now and then
    float cu = abs(fract(u / 9.4) - .5) * 9.4;
    // (ashlar courses 0.6 m high, the joints melted where one is under a pixel)
    vec2 cq = vec2(u / 1.5 + .5 * floor(v / .6), v / .6), cf = abs(fract(cq) - .5);
    alb *= (.94 + .1 * hash21(floor(cq))) * (1. - .16 * smoothstep(.44, .5, max(cf.x, cf.y)) * (1. - smoothstep(.15, .5, max(fwidth(cq.x), fwidth(cq.y)))));
    alb = mix(alb * .8, vCol * .16, step(cu, .75) * step(v, 2.7) * (1. - smoothstep(.3, 1., fwidth(u))));
    shade = 0.; amb = .62;
  } else if (kind == ${HK.GARDEN}.) {
    alb = gardenAlb(vUV.xy, vPar.xy);
    if (vPar.z > .5) {
      // the temple's terrace (order three): a gravel walk across its garden along the row of cypresses, a paved border
      // round the temple and along the walks under the porticoes, and the rows' long shadows
      vec2 wq = vW.xz - vec2(${WALK.x.toFixed(3)}, ${WALK.z.toFixed(3)}), wa = vec2(${WALK.dx.toFixed(5)}, ${WALK.dz.toFixed(5)});
      float wd = abs(wq.x * wa.y - wq.y * wa.x), fw = fwidth(wd);
      vec3 gravel = vec3(.6, .55, .45) * (.9 + .2 * vnoise(vW.xz * 2.1)) * (.94 + .12 * vnoise(vW.xz * 9.));
      alb = mix(alb, gravel, 1. - smoothstep(${P.GARDEN.WALK.HALF.toFixed(1)} - .1, ${P.GARDEN.WALK.HALF.toFixed(1)} + .1 + fw, wd));
      alb = mix(alb, vec3(.5, .47, .41), (1. - smoothstep(.16, .22 + fw, abs(wd - ${(P.GARDEN.WALK.HALF + 0.2).toFixed(1)}))) * .8);
      vec2 tq = abs(vW.xz - vec2(${((TEMPLE[0] + TEMPLE[1]) / 2).toFixed(1)}, ${((TEMPLE[4] + TEMPLE[5]) / 2).toFixed(1)})) - vec2(${(V.TERRACE.TEMPLE_W / 2).toFixed(1)}, ${(V.TERRACE.TEMPLE_L / 2).toFixed(1)});
      float round_ = max(tq.x, tq.y);
      vec2 sf = abs(fract(vW.xz / 1.5) - .5);
      vec3 flags = vec3(.66, .62, .54) * (.92 + .1 * hash21(floor(vW.xz / 1.5))) * (1. - .2 * smoothstep(.44, .49, max(sf.x, sf.y)) * (1. - smoothstep(.2, .6, fwidth(vW.x))));
      float edge = min(min(vUV.x, ${V.TERRACE.W.toFixed(1)} - vUV.x), min(vUV.y, ${V.TERRACE.D.toFixed(1)} - vUV.y));
      alb = mix(alb, flags, max(1. - smoothstep(5.5, 5.8, round_), 1. - smoothstep(${(V.TERRACE.PORTICO_D + 4).toFixed(1)}, ${(V.TERRACE.PORTICO_D + 4.3).toFixed(1)}, edge)));
      // the rows' shadows, and the east walk's own (its roof's edge ${(V.TERRACE.PORTICO_H + 1.2).toFixed(1)} m over the floor)
      shade = terraceSun(vW.xz);
      float px = ${(V.TERRACE.CX + V.TERRACE.W / 2 - V.TERRACE.PORTICO_D - 0.5).toFixed(1)} - vW.x;
      shade = min(shade, smoothstep(-.4, .4, px * uSun.y / max(uSun.x, .05) - ${(V.TERRACE.PORTICO_H - 0.6).toFixed(1)}));
    }
  } else if (kind == ${HK.LEAF}.) {
    // a tree's leaf: clumps, darker low and inside, finer sprays where the eye is near
    // (order three, addendum 2: the sun lights one side and the light goes round into the sprays: a soft edge between
    // the lit side and the shaded one; the shaded side stands in the sky's light)
    alb *= (.72 + .56 * vnoise(vW.xz * 1.3 + vW.y * .9)) * (.6 + .4 * v) * (.82 + .36 * vnoise(vW.xz * 6.1 + vW.y * 4.3));
    // (tufts: darker hollows between the sprays, seen where the eye is near)
    alb *= 1. - .45 * smoothstep(.42, .7, vnoise(vW.xz * .85 + vW.y * 1.7 + 11.)) * (1. - smoothstep(.2, .8, fwidth(vW.x) + fwidth(vW.z)));
    // (the needles' grain: fine pale and dark flecks along the sprays, seen where the eye is near; and the sprays'
    // own relief: the face turns a little this way and that, so that a pad or a spindle is rough, not a smooth lump)
    float nearLeaf = 1. - smoothstep(.06, .4, fwidth(vW.x) + fwidth(vW.z));
    alb *= 1. + .8 * (vnoise(vec2(vW.x * 7.3 + vW.y * 2.1, vW.z * 7.3 - vW.y * 1.7)) - .5) * nearLeaf;
    vec3 q3 = vW * 1.7;
    N = normalize(N + nearLeaf * (1.1 * vec3(vnoise(q3.xz + q3.y) - .5, 0., vnoise(q3.zx * 1.1 + q3.y + 5.) - .5) + .7 * vec3(vnoise(q3.xz * 3.1 + 2.) - .5, 0., vnoise(q3.zx * 3.1 + 9.) - .5)));
    amb = 1.05; wrap = 1.;
  } else if (kind == ${HK.CELLA}.) {
    // THE TEMPLE'S ROOM WALL behind its columns (order three, addendum 2, point 2): coursed stone in the sun that comes
    // in between the columns, each column's shade a soft upright band on it, the entablature's shade along its top;
    // what the sun does not reach stands in the warm light thrown back by the sunlit floor and shafts. par: the
    // columns' spacing, the first column's place along the wall (world x or z), the walk's depth from the wall to
    // the columns' line, the columns' height over the floor. On the front wall (par.x under 0: -spacing) a tall door.
    float sp = abs(vPar.x), along = abs(N.x) > .5 ? vW.z : vW.x, ln = max(dot(N, uSun), 0.);
    vec2 cq = vec2(u / 1.8 + .5 * floor(v / .6), v / .6), cf = abs(fract(cq) - .5);
    alb *= vec3(1., .95, .86) * (.9 + .14 * hash21(floor(cq))) * (1. - .2 * smoothstep(.43, .5, max(cf.x, cf.y)) * (1. - smoothstep(.12, .5, max(fwidth(cq.x), fwidth(cq.y)))));
    if (ln > .02) {
      float shift = vPar.z * (abs(N.x) > .5 ? uSun.z : uSun.x) / ln, rise = vPar.z * uSun.y / ln;
      float cu = abs(fract((along + shift - vPar.y) / sp + .5) - .5) * sp;
      shade = min(smoothstep(.6, 1.05, cu), 1. - smoothstep(vPar.w - .5, vPar.w + .4, v + rise));
    } else shade = 0.;
    if (vPar.x < 0.) { vec2 dq = abs(vec2(u - 10.4, v - 4.6)) - vec2(2.1, 4.6); float door = 1. - smoothstep(-.05, .05, max(dq.x, dq.y)); alb = mix(alb, vec3(.2, .13, .07) * (.8 + .4 * step(.5, fract(u * 1.9 + .2))), door); shade *= 1. - door; }
    amb = 1.25;
  } else if (kind == ${HK.ENTAB}.) {
    // an entablature 3 m high: two bands of the beam, the plain frieze, the cornice standing out over its own shade
    // with a row of small blocks under it (melted where one is under a pixel)
    float fw = fwidth(v);
    alb *= 1. - .16 * (1. - smoothstep(.03, .06 + fw, abs(v - .5))) - .16 * (1. - smoothstep(.03, .06 + fw, abs(v - 1.05)));
    alb *= mix(1., .93, step(1.1, v) * step(v, 2.));
    float under = smoothstep(1.86, 2., v) * (1. - smoothstep(2.36, 2.44, v));
    alb *= 1. - under * mix(.5 + .3 * step(.5, fract(u / .55)), .62, smoothstep(.12, .4, fwidth(u) / .55));
    alb *= 1. - .12 * (1. - smoothstep(.02, .05 + fw, abs(v - 2.72)));
  } else if (kind == ${HK.CLOTH}.) {
    // a stall's cloth: plain woven stuff, a fold every hand's breadth across it, lit from above and through
    if (dot(N, uSun) < 0.) N = -N;
    alb *= (.93 + .07 * sin(u * 26.)) * (.94 + .1 * vnoise(vW.xz * 3.)); amb = 1.2; wrap = .6;
  } else if (kind == ${HK.COLUMN}.) {
    // a column's shaft: twenty flutes (melted where one is under a pixel), a little weather
    float fl = abs(fract(u * 20.) - .5) * 2.;
    alb *= (.94 + .1 * vnoise(vec2(u * 40., v * .4))) * mix(1. - .22 * smoothstep(.45, .95, fl), .9, smoothstep(.15, .5, fwidth(u * 20.)));
  } else {
    // a plain wall: courses, weather, and where asked a row of windows (par: bay, window's height, sill, window's width)
    alb *= (.92 + .12 * vnoise(vec2(u * .5, v * 1.5))) * (1. - .1 * step(.9, fract(v / 1.2)) * (1. - smoothstep(.1, .4, fwidth(v))));
${BRICK_GLSL}    if (vPar.x > 0.) { float cu = abs(fract(u / vPar.x) - .5) * vPar.x; float win = step(cu, vPar.w * .5) * step(vPar.z, v) * step(v, vPar.z + vPar.y); alb = mix(alb, vCol * .14, win); shade = 1. - win; }
  }
  float nl = dot(N, uSun);
  vec3 sun = sunAt(vW + N * .1) * uSunCol * mix(max(nl, 0.), max(nl * .62 + .38, 0.), wrap) * shade;
  // a pale front in shade still stands in the light of the sky and of the sunlit ground before it
  vec3 col = alb * (sun + (uSkyCol * (.8 + .35 * N.y) + uBounceCol * (1.6 - 1. * N.y)) * amb);
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;
function hillTools() {
  const pos = [], nor = [], col = [], uv = [], par = [], idx = []; let n = 0;
  const NONE = [0, 0, 0, 0];
  // a quad a, b, c, d (counter clockwise from outside) with its uv corners
  const quad = (a, b, c, d, c3, kind, pr, uvs) => {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], l = Math.hypot(nx, ny, nz) || 1;
    [a, b, c, d].forEach((q, i) => { pos.push(q[0], q[1], q[2]); nor.push(nx / l, ny / l, nz / l); col.push(c3[0], c3[1], c3[2]); uv.push(uvs[i][0], uvs[i][1], kind); par.push(pr[0], pr[1], pr[2], pr[3]); });
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  };
  // a box; faces: f (+Z), b (-Z), r (+X), l (-X), t (top), each { k: kind, p: par, c: colour } or absent
  const mass = (x0, x1, y0, y1, z0, z1, faces, c3) => {
    const w = x1 - x0, d = z1 - z0, h = y1 - y0, F = (o) => [o.c || c3, o.k || 0, o.p || NONE];
    if (faces.f) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], ...F(faces.f), [[0, 0], [w, 0], [w, h], [0, h]]);
    if (faces.b) quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], ...F(faces.b), [[0, 0], [w, 0], [w, h], [0, h]]);
    if (faces.r) quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], ...F(faces.r), [[0, 0], [d, 0], [d, h], [0, h]]);
    if (faces.l) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], ...F(faces.l), [[0, 0], [d, 0], [d, h], [0, h]]);
    if (faces.t) quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], ...F(faces.t), [[0, 0], [w, 0], [w, d], [0, d]]);
  };
  // a tiled gable roof over a rectangle: eaves at ye, ridge at yr along X (axis 0) or Z (axis 1); gables in the wall's colour
  const gable = (x0, x1, z0, z1, ye, yr, axis, tile, wall) => {
    const T = HK.TILE, W = HK.WALL;
    if (axis === 0) {
      const zm = (z0 + z1) / 2, sl = Math.hypot((z1 - z0) / 2, yr - ye), w = x1 - x0;
      quad([x0, ye, z1], [x1, ye, z1], [x1, yr, zm], [x0, yr, zm], tile, T, NONE, [[0, sl], [w, sl], [w, 0], [0, 0]]);
      quad([x1, ye, z0], [x0, ye, z0], [x0, yr, zm], [x1, yr, zm], tile, T, NONE, [[0, sl], [w, sl], [w, 0], [0, 0]]);
      quad([x1, ye, z1], [x1, ye, z0], [x1, yr, zm], [x1, yr, zm], wall, W, NONE, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      quad([x0, ye, z0], [x0, ye, z1], [x0, yr, zm], [x0, yr, zm], wall, W, NONE, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    } else {
      const xm = (x0 + x1) / 2, sl = Math.hypot((x1 - x0) / 2, yr - ye), d = z1 - z0;
      quad([x1, ye, z1], [x1, ye, z0], [xm, yr, z0], [xm, yr, z1], tile, T, NONE, [[0, sl], [d, sl], [d, 0], [0, 0]]);
      quad([x0, ye, z0], [x0, ye, z1], [xm, yr, z1], [xm, yr, z0], tile, T, NONE, [[0, sl], [d, sl], [d, 0], [0, 0]]);
      quad([x0, ye, z1], [x1, ye, z1], [xm, yr, z1], [xm, yr, z1], wall, W, NONE, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      quad([x1, ye, z0], [x0, ye, z0], [xm, yr, z0], [xm, yr, z0], wall, W, NONE, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    }
  };
  // one corner with its own normal; a face of four corners with one given normal
  const vert = (q, nrm, c3, t, kind, pr = NONE) => { pos.push(q[0], q[1], q[2]); nor.push(nrm[0], nrm[1], nrm[2]); col.push(c3[0], c3[1], c3[2]); uv.push(t[0], t[1], kind); par.push(pr[0], pr[1], pr[2], pr[3]); return n++; };
  const face = (pts, nrm, c3, kind, pr, uvs) => { const a = n; pts.forEach((q, i) => vert(q, nrm, c3, uvs[i], kind, pr)); idx.push(a, a + 1, a + 2, a, a + 2, a + 3); };
  // a round column of S sides with the column's own normals, a little slimmer at its head
  const column = (x, z, y0, y1, r, c3, S = 6) => {
    const a = n;
    for (let k = 0; k < S; k++) { const f = Math.PI * 2 * k / S, cs = Math.cos(f), sn = Math.sin(f); vert([x + r * cs, y0, z + r * sn], [cs, 0, sn], c3, [k / S, 0], HK.COLUMN); vert([x + r * 0.86 * cs, y1, z + r * 0.86 * sn], [cs, 0, sn], c3, [k / S, y1 - y0], HK.COLUMN); }
    for (let k = 0; k < S; k++) { const i = a + 2 * k, j = a + 2 * ((k + 1) % S); idx.push(i, j, i + 1, j, j + 1, i + 1); }
  };
  // A PORTICO WITH TRUE COLUMNS over the rectangle x0..x1, z0..z1 from y0, h high to its beam's top, open toward
  // 'f' (+Z), 'b' (-Z), 'r' (+X) or 'l' (-X): a row of round columns, the beam over them, the wall at the back of the
  // walk in the roof's shade, a tiled roof leaning down from the back wall to the beam, the two end walls
  const portico = (x0, x1, z0, z1, y0, h, open, bay, r, c3, tile, ends = true) => {
    const alongX = open === 'f' || open === 'b', L = alongX ? x1 - x0 : z1 - z0, D = alongX ? z1 - z0 : x1 - x0, bh = Math.min(1.3, h * 0.16), rise = D * 0.3, yt = y0 + h;
    const o = open === 'f' ? [0, 0, 1] : open === 'b' ? [0, 0, -1] : open === 'r' ? [1, 0, 0] : [-1, 0, 0];
    const at = (a, d, y) => open === 'f' ? [x0 + a, y, z0 + d] : open === 'b' ? [x0 + a, y, z1 - d] : open === 'r' ? [x0 + d, y, z0 + a] : [x1 - d, y, z0 + a];
    face([at(0, 0.05, y0), at(L, 0.05, y0), at(L, 0.05, yt + rise), at(0, 0.05, yt + rise)], o, c3, HK.SHADE, NONE, [[0, 0], [L, 0], [L, h + rise], [0, h + rise]]);
    face([at(0, D, yt - bh), at(L, D, yt - bh), at(L, D, yt), at(0, D, yt)], o, c3, HK.WALL, NONE, [[0, 0], [L, 0], [L, bh], [0, bh]]);
    const sl = Math.hypot(D + 0.5, rise), nl = Math.hypot(rise, D);
    face([at(0, D + 0.5, yt - 0.1), at(L, D + 0.5, yt - 0.1), at(L, 0, yt + rise), at(0, 0, yt + rise)], [o[0] * rise / nl, D / nl, o[2] * rise / nl], tile, HK.TILE, NONE, [[0, sl], [L, sl], [L, 0], [0, 0]]);
    const nC = Math.max(2, Math.round(L / bay)) + 1;
    for (let i = 0; i < nC; i++) { const q = at(r + i * (L - 2 * r) / (nC - 1), D - r - 0.1, y0); column(q[0], q[2], y0, yt - bh, r, c3); }
    if (ends) for (const [a, sg] of [[0, -1], [L, 1]]) {
      const nn = alongX ? [sg, 0, 0] : [0, 0, sg];
      face([at(a, 0, y0), at(a, D, y0), at(a, D, yt), at(a, 0, yt + rise)], nn, c3, HK.WALL, NONE, [[0, 0], [D, 0], [D, h], [0, h + rise]]);
    }
    return nC;
  };
  // rings of S corners about an upright axis, joined in bands, with the form's own normals (a tree's crown)
  const rings = (x, y, z, list, S, c3, rng, lump, tip) => {
    const a = n;
    list.forEach(([dy, r, v], q) => { for (let k = 0; k < S; k++) { const f = Math.PI * 2 * (k + 0.5 * (q % 2)) / S, rr = r * (1 - lump + 2 * lump * rng()), cs = Math.cos(f), sn = Math.sin(f), up = q === 0 ? -0.5 : q === list.length - 1 ? 0.7 : 0.25, l = Math.hypot(1, up); vert([x + rr * cs, y + dy, z + rr * sn], [cs / l, up / l, sn / l], c3, [k / S, v], HK.LEAF); } });
    for (let q = 0; q + 1 < list.length; q++) for (let k = 0; k < S; k++) { const i = a + q * S + k, j = a + q * S + (k + 1) % S; idx.push(i, i + S, j, j, i + S, j + S); }
    for (let k = 1; k + 1 < S; k++) idx.push(a, a + k, a + k + 1);
    const top = a + (list.length - 1) * S;
    if (tip !== undefined) { const t = vert([x, y + tip, z], [0, 1, 0], c3, [0, 1], HK.LEAF); for (let k = 0; k < S; k++) idx.push(top + k, t, top + (k + 1) % S); } else for (let k = 1; k + 1 < S; k++) idx.push(top, top + k + 1, top + k);
  };
  // a cypress: a slim dark spindle; a pine: a bare trunk and a wide flat crown
  const cypress = (t, rng) => {
    const lv = 0.8 + 0.4 * rng(), c3 = t.fine ? [0.115 * lv, 0.17 * lv, 0.075 * lv] : [0.05 * lv, 0.072 * lv, 0.04 * lv];
    // (a tree the line passes among: nine sides and six rings, its foot's stem; the others: five sides, three rings)
    if (t.fine) { rings(t.x, t.y + t.h * 0.02, t.z, [[0, t.r * 0.42, 0], [t.h * 0.1, t.r * 0.8, 0.15], [t.h * 0.34, t.r, 0.4], [t.h * 0.56, t.r * 0.86, 0.62], [t.h * 0.76, t.r * 0.6, 0.82], [t.h * 0.9, t.r * 0.3, 0.94]], 9, c3, rng, 0.1, t.h * 0.98); return; }
    rings(t.x, t.y, t.z, [[t.h * 0.05, t.r * 0.5, 0], [t.h * 0.36, t.r, 0.4], [t.h * 0.74, t.r * 0.6, 0.8]], 5, c3, rng, 0.08, t.h);
  };
  // (order three, addendum 5, point 1: A PINE THE LINE PASSES OVER is a tree in its parts, never one smooth mass: a stem
  // of six sides in furrowed bark that forks into three limbs; the crown in FLAT LAYERED PADS (one over the middle,
  // five round it, three lower and further in), each a shallow dome of needles with a dark underside, air between
  // them. Every pad lies inside the tree's own round (the part's pineTree: r about the stem, the top at h), which is
  // what the count and the ground's shade take.)
  const pad = (x, y, z, pr, th, c3, rng) => {
    const a = n, S = 8, ph = rng() * Math.PI * 2, low = c3.map((v) => v * 0.55);
    const ring = (dy, rr, up, v, col) => { for (let k = 0; k < S; k++) { const f = ph + Math.PI * 2 * k / S, q = rr * (0.88 + 0.24 * rng()), cs = Math.cos(f), sn = Math.sin(f), l = Math.hypot(1, up); vert([x + q * cs, y + dy, z + q * sn], [cs / l, up / l, sn / l], col, [k / S, v], HK.LEAF); } };
    ring(-th * 0.5, pr * 0.5, -3, 0, low); ring(-th * 0.12, pr * 0.9, -0.6, 0.25, low); ring(th * 0.2, pr * 0.86, 0.5, 0.7, c3); ring(th * 0.62, pr * 0.5, 2.2, 0.95, c3);
    for (let q = 0; q < 3; q++) for (let k = 0; k < S; k++) { const i2 = a + q * S + k, j2 = a + q * S + (k + 1) % S; idx.push(i2, i2 + S, j2, j2, i2 + S, j2 + S); }
    for (let k = 1; k + 1 < S; k++) idx.push(a, a + k, a + k + 1);
    const top = a + 3 * S, t = vert([x, y + th * 0.8, z], [0, 1, 0], c3, [0, 1], HK.LEAF);
    for (let k = 0; k < S; k++) idx.push(top + k, t, top + (k + 1) % S);
  };
  const limb = (p0, p1, r0, r1, c3) => {
    const a = n, d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], hl = Math.hypot(d[0], d[2]) || 1, sx = -d[2] / hl, sz = d[0] / hl;
    for (let k = 0; k < 4; k++) { const f = Math.PI / 2 * k, cs = Math.cos(f), sn = Math.sin(f), nx = sx * cs + (d[0] / hl) * sn * 0.3, nz = sz * cs + (d[2] / hl) * sn * 0.3, ny = -sn; vert([p0[0] + r0 * nx, p0[1] + r0 * ny * 0.6, p0[2] + r0 * nz], [nx, ny, nz], c3, [k / 4, 0], HK.COLUMN); vert([p1[0] + r1 * nx, p1[1] + r1 * ny * 0.6, p1[2] + r1 * nz], [nx, ny, nz], c3, [k / 4, 3], HK.COLUMN); }
    for (let k = 0; k < 4; k++) { const i2 = a + 2 * k, j2 = a + 2 * ((k + 1) % 4); idx.push(i2, j2, i2 + 1, j2, j2 + 1, i2 + 1); }
  };
  const finePine = (t, rng) => {
    const lv = 0.85 + 0.3 * rng(), c3 = [0.095 * lv, 0.165 * lv, 0.07 * lv], bark = [0.36, 0.25, 0.17], r = t.r, top = t.y + t.h, fork = top - r * 0.95, a = n;
    for (let k = 0; k < 6; k++) { const f = Math.PI / 3 * k, cs = Math.cos(f), sn = Math.sin(f); vert([t.x + 0.42 * cs, t.y, t.z + 0.42 * sn], [cs, 0, sn], bark, [k / 6, 0], HK.COLUMN); vert([t.x + 0.3 * cs, fork, t.z + 0.3 * sn], [cs, 0, sn], bark, [k / 6, 9], HK.COLUMN); }
    for (let k = 0; k < 6; k++) { const i2 = a + 2 * k, j2 = a + 2 * ((k + 1) % 6); idx.push(i2, j2, i2 + 1, j2, j2 + 1, i2 + 1); }
    const turn = rng() * Math.PI * 2, th = r * 0.24;
    // the pad over the middle (its top is the tree's height), five round it, three lower and further in
    pad(t.x, top - th * 0.8, t.z, r * 0.5, th, c3, rng);
    for (let k = 0; k < 5; k++) { const f = turn + Math.PI * 2 * k / 5, pr = r * (0.36 + 0.06 * rng()), out = r * 0.94 - pr * 1.0, y = top - th * (1.25 + 0.5 * rng()); pad(t.x + out * Math.cos(f), y, t.z + out * Math.sin(f), pr, th * 0.9, c3.map((v) => v * (0.9 + 0.2 * rng())), rng); }
    for (let k = 0; k < 3; k++) { const f = turn + 0.6 + Math.PI * 2 * k / 3, pr = r * (0.3 + 0.05 * rng()), out = r * 0.42, y = top - th * (2.1 + 0.4 * rng()); pad(t.x + out * Math.cos(f), y, t.z + out * Math.sin(f), pr, th * 0.8, c3.map((v) => v * 0.82), rng); limb([t.x, fork - 0.4, t.z], [t.x + out * Math.cos(f), y - th * 0.3, t.z + out * Math.sin(f)], 0.24, 0.12, bark); }
    limb([t.x, fork - 0.4, t.z], [t.x, top - th * 1.1, t.z], 0.26, 0.14, bark);
  };
  // a market stall (INVENTED, OURS): four poles, a cloth roof leaning to the back with a short fall at the front,
  // a cloth hung at the back, a bare trestle; st: its middle, its front's way (a unit), cloth: its colour
  const stall = (st, cloth, timber) => {
    const S = P.MARKET.STALL, hw = S.W / 2, hd = S.D / 2, ax = -st.fz, az = st.fx;
    const at = (a_, f_, y) => [st.x + ax * a_ + st.fx * f_, y, st.z + az * a_ + st.fz * f_];
    for (const [a_, f_, h] of [[-hw, hd, S.FRONT], [hw, hd, S.FRONT], [-hw, -hd, S.BACK], [hw, -hd, S.BACK]]) { const q = at(a_, f_, 0); mass(q[0] - 0.05, q[0] + 0.05, 0, h, q[2] - 0.05, q[2] + 0.05, { f: {}, b: {}, l: {}, r: {} }, timber); }
    const o = 0.3, uvs = (w, d) => [[0, 0], [w, 0], [w, d], [0, d]];
    quad(at(hw + o, hd + o, S.FRONT + 0.06), at(-hw - o, hd + o, S.FRONT + 0.06), at(-hw - o, -hd - o, S.BACK), at(hw + o, -hd - o, S.BACK), cloth, HK.CLOTH, NONE, uvs(S.W + 2 * o, S.D + 2 * o));
    quad(at(-hw - o, hd + o, S.FRONT - 0.34), at(hw + o, hd + o, S.FRONT - 0.34), at(hw + o, hd + o, S.FRONT + 0.06), at(-hw - o, hd + o, S.FRONT + 0.06), cloth, HK.CLOTH, NONE, uvs(S.W + 2 * o, 0.4));
    quad(at(hw, -hd, 0.5), at(-hw, -hd, 0.5), at(-hw, -hd, S.BACK), at(hw, -hd, S.BACK), cloth.map((v) => v * 0.8), HK.CLOTH, NONE, uvs(S.W, S.BACK));
    quad(at(hw - 0.2, hd - 0.2, S.TABLE), at(-hw + 0.2, hd - 0.2, S.TABLE), at(-hw + 0.2, hd - 1.1, S.TABLE), at(hw - 0.2, hd - 1.1, S.TABLE), timber, HK.WALL, NONE, uvs(S.W, 0.9));
    quad(at(-hw + 0.2, hd - 0.2, 0.1), at(hw - 0.2, hd - 0.2, 0.1), at(hw - 0.2, hd - 0.2, S.TABLE), at(-hw + 0.2, hd - 0.2, S.TABLE), timber.map((v) => v * 0.8), HK.WALL, NONE, uvs(S.W, 0.75));
  };
  const pine = (t, rng) => {
    const lv = 0.8 + 0.4 * rng(), c3 = [0.07 * lv, 0.105 * lv, 0.045 * lv], bark = [0.3, 0.22, 0.16], ty = t.y + t.h * 0.72, tr = 0.3;
    for (let k = 0; k < 4; k++) { const f0 = Math.PI / 2 * k, f1 = f0 + Math.PI / 2, fm = f0 + Math.PI / 4; face([[t.x + tr * Math.cos(f0), t.y, t.z + tr * Math.sin(f0)], [t.x + tr * Math.cos(f1), t.y, t.z + tr * Math.sin(f1)], [t.x + tr * Math.cos(f1), ty, t.z + tr * Math.sin(f1)], [t.x + tr * Math.cos(f0), ty, t.z + tr * Math.sin(f0)]], [Math.cos(fm), 0, Math.sin(fm)], bark, HK.WALL, NONE, [[0, 0], [0.4, 0], [0.4, 9], [0, 9]]); }
    rings(t.x, t.y + t.h * 0.82, t.z, [[-t.r * 0.3, t.r * 0.6, 0.15], [0, t.r, 0.6], [t.r * 0.34, t.r * 0.5, 1]], 7, c3, rng, 0.16);
  };
  const geometry = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3));
    g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 4)); g.setIndex(idx);
    return g;
  };
  return { quad, mass, gable, face, vert, column, portico, cypress, pine, finePine, stall, geometry, NONE };
}

// THE PEOPLE OUTSIDE: plain far figures (a body and a head, no face), each walking its own line on the world's clock
const FIGURE_TRIS = 11;
const FIGURE = { FOOT_W: 0.21, FOOT_D: 0.15, SHOULDER_W: 0.25, SHOULDER_D: 0.15, SHOULDER_Y: 1.44, HEAD_Y: 1.585, HEAD_R: 0.125, HEAD_H: 0.135 };   // (order three: a little broader, a cloak's hem; still inside the 1.06 m the count holds)
function figureGeometry() {
  const F = FIGURE, pos = [], nor = [], part = [], idx = []; let n = 0;
  const tri = (a, b, c, k) => {
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], l = Math.hypot(nx, ny, nz) || 1;
    for (const q of [a, b, c]) { pos.push(q[0], q[1], q[2]); nor.push(nx / l, ny / l, nz / l); part.push(k); }
    idx.push(n, n + 1, n + 2); n += 3;
  };
  // (order two: thinner, eleven faces for eighteen; nobody is nearer than 20 m) the body: three sides from the feet to
  // the shoulders (its flat back behind, x: across the shoulders, z: the way it walks) and the shoulders' top
  const lo = [[-F.FOOT_W, 0, -F.FOOT_D], [F.FOOT_W, 0, -F.FOOT_D], [0, 0, F.FOOT_D * 1.2]];
  const hi = [[-F.SHOULDER_W, F.SHOULDER_Y, -F.SHOULDER_D], [F.SHOULDER_W, F.SHOULDER_Y, -F.SHOULDER_D], [0, F.SHOULDER_Y, F.SHOULDER_D * 1.3]];
  for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; tri(lo[j], lo[i], hi[i], 0); tri(lo[j], hi[i], hi[j], 0); }
  tri(hi[0], hi[2], hi[1], 0);
  // the head: four plain faces
  const c = F.HEAD_Y, r = F.HEAD_R * 1.15, eq = [[-r, c - 0.03, -r * 0.6], [r, c - 0.03, -r * 0.6], [0, c - 0.03, r]], up = [0, c + F.HEAD_H * 1.1, 0];
  for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; tri(eq[j], eq[i], up, 1); }
  tri(eq[0], eq[1], eq[2], 1);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setIndex(idx);
  return g;
}
// A LITTER (order two, step 6; its form INVENTED, OURS): two poles, a closed couch with drawn curtains, a low roof.
// The same law moves it as moves a figure (its bearers are four figures of the plan beside it). aPart: 2 timber,
// 3 curtain, 4 roof.
function litterGeometry() {
  const L = P.OUTSIDE.LITTER, pos = [], nor = [], part = [], idx = []; let n = 0;
  const quad = (a, b, c, d, nrm, k) => { for (const q of [a, b, c, d]) { pos.push(q[0], q[1], q[2]); nor.push(nrm[0], nrm[1], nrm[2]); part.push(k); } idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; };
  const w = L.HALF_W, l = L.LEN / 2, y0 = L.FLOOR, y1 = L.TOP, pl = L.POLE_LEN / 2, t = 0.04;
  for (const sx of [-1, 1]) {
    const x = sx * L.POLE_X, y = L.POLE_Y;
    quad([x - t, y + t, -pl], [x + t, y + t, -pl], [x + t, y + t, pl], [x - t, y + t, pl], [0, 1, 0], 2);
    quad([x + sx * t, y - t, -pl], [x + sx * t, y + t, -pl], [x + sx * t, y + t, pl], [x + sx * t, y - t, pl], [sx, 0, 0], 2);
    quad([x * 0.82, y0, -l], [x * 0.82, y1, -l], [x * 0.82, y1, l], [x * 0.82, y0, l], [sx, 0, 0], 3);
  }
  for (const sz of [-1, 1]) quad([-w, y0, sz * l], [w, y0, sz * l], [w, y1, sz * l], [-w, y1, sz * l], [0, 0, sz], 3);
  quad([-w, y0, -l], [w, y0, -l], [w, y0, l], [-w, y0, l], [0, -1, 0], 2);
  const arch = [[-w - 0.06, y1], [-w * 0.5, y1 + L.ROOF], [w * 0.5, y1 + L.ROOF], [w + 0.06, y1]], lo = l + 0.08;
  for (let i = 0; i < 3; i++) { const a = arch[i], b = arch[i + 1], nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny); quad([a[0], a[1], -lo], [b[0], b[1], -lo], [b[0], b[1], lo], [a[0], a[1], lo], [nx / nl, ny / nl, 0], 4); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setIndex(idx);
  return g;
}
const FIGURE_VS = /* glsl */`
attribute float aPart; attribute vec4 aLine; attribute vec4 aWho; attribute vec4 aAt;
varying vec3 vW; varying vec3 vN; varying vec3 vWho;
uniform float uTime; uniform vec3 uSun;
void main() {
  // aAt: the floor's y under the figure; x 1 a figure that stands (it faces along its line from the first point and
  // shifts its weight now and then) or 0 one that walks its line; the share of open sun for a figure in an arcade
  // (under 0: the place's own light by the one law)
  vec2 a = aLine.xy, b = aLine.zw, dir = b - a; float len = max(length(dir), 1.); dir /= len;
  float stand = step(.5, aAt.y);
  float f = fract(aWho.x + uTime * aWho.y / len) * (1. - stand);
  // it slows toward its line's end by aAt.w (from 1 + w of its pace at the start to 1 - w at the end): they bunch at
  // the posts and the arches
  f += aAt.w * (f - f * f);
  vec2 at = a + dir * len * f;
  // the step's small rise and fall (two steps to 1.5 m of way)
  float bob = .025 * abs(sin(f * len * 2.1 + aWho.x * 40.)) * (1. - stand);
  vec3 p = position * aWho.z;
  p.x += stand * .05 * sin(uTime * (.5 + .5 * aWho.w) + aWho.x * 50.) * p.y;
  vec3 w = vec3(at.x + p.x * dir.y + p.z * dir.x, aAt.x + p.y + bob, at.y - p.x * dir.x + p.z * dir.y);
  vN = vec3(normal.x * dir.y + normal.z * dir.x, normal.y, -normal.x * dir.x + normal.z * dir.y);
  vW = w; vWho = vec3(aPart, aWho.w, aAt.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const FIGURE_FS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vWho;
${P.LIGHT_GLSL}
${TOWN_SHADE_GLSL}
void main() {
  vec3 N = normalize(vN);
  // white wool for most, dark cloaks for the rest; the head a plain brown (no face)
  float t = vWho.y;
  // (order three: on the paved ground a figure reads by its dress: half in white wool, the rest in undyed wool, brown,
  // dull red, ochre, grey blue and dark cloaks)
  // (addendum 8: no two figures alike in a row of whites: two in five in white wool, each its own white from fresh to worn grey; the
  // rest in undyed wool, brown, dull red, ochre, green, grey blue and dark cloaks, each a little lighter or darker)
  vec3 cloth = t < .4 ? mix(vec3(.62, .58, .5), vec3(.88, .86, .8), fract(t * 37.)) : t < .56 ? vec3(.56, .47, .34) : t < .68 ? vec3(.3, .22, .16) : t < .77 ? vec3(.56, .17, .12) : t < .85 ? vec3(.68, .47, .15) : t < .9 ? vec3(.3, .4, .2) : t < .95 ? vec3(.24, .32, .46) : vec3(.17, .16, .17);
  cloth *= .82 + .36 * fract(t * 173.);
  vec3 alb = vWho.x > .5 ? mix(vec3(.4, .27, .19), vec3(.2, .15, .12), step(.5, fract(t * 91.))) : cloth * (.75 + .25 * smoothstep(0., 1.2, vW.y));
  // a litter: timber poles, drawn curtains of a plain dyed or undyed cloth hanging in folds, a dark roof
  if (vWho.x > 1.5) {
    vec3 curtain = t < .4 ? vec3(.74, .7, .6) : t < .62 ? vec3(.5, .22, .17) : t < .82 ? vec3(.66, .52, .26) : vec3(.3, .34, .4);
    alb = vWho.x < 2.5 ? vec3(.34, .24, .15) : vWho.x < 3.5 ? curtain * (.82 + .18 * sin((vW.x + vW.z) * 23.)) : curtain * .55;
  }
  // (a figure in an arcade takes the sun that comes in at its opening: its own share; the others the place's light)
  vec3 sun = (vWho.z < 0. ? sunAt(vW + vec3(0., .1, 0.)) * townSun(vW) : vec3(vWho.z)) * uSunCol * max(dot(N, uSun), 0.);
  float inside = step(0., vWho.z);
  vec3 col = alb * (sun + uSkyCol * (.7 + .3 * N.y) * (1. - .45 * inside) + uBounceCol * (1.2 - .6 * N.y));
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;

// A FIGURE'S LONG SHADOW (order three: every person throws one): a flat tapering strip on the ground from the figure's
// feet away from the sun, as long as the figure is tall over the sun's height's tangent; drawn only where the ground
// itself lies in the sun (the one law and the houses' shade). The figure's own law of walking places it.
const SHADOW_VS = /* glsl */`
attribute vec4 aLine; attribute vec4 aWho; attribute vec4 aAt;
varying vec3 vW; varying vec2 vQ;
uniform float uTime; uniform vec3 uSun;
void main() {
  vec2 a = aLine.xy, b = aLine.zw, dir = b - a; float len = max(length(dir), 1.); dir /= len;
  float f = fract(aWho.x + uTime * aWho.y / len) * (1. - step(.5, aAt.y));
  f += aAt.w * (f - f * f);
  vec2 at = a + dir * len * f;
  vec2 sd = -uSun.xz / max(length(uSun.xz), 1e-3), across = vec2(-sd.y, sd.x);
  float reach = ${FIGURE.HEAD_Y.toFixed(2)} * aWho.z * length(uSun.xz) / max(uSun.y, .1);
  vec2 q = at + across * position.x * (.66 - .26 * position.y) + sd * (position.y * reach - .08);
  vW = vec3(q.x, aAt.x + .04, q.y); vQ = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const SHADOW_FS = /* glsl */`
varying vec3 vW; varying vec2 vQ;
${P.LIGHT_GLSL}
${TOWN_SHADE_GLSL}
void main() {
  float lit = sunAt(vW).g * townSun(vW);
  float a = .72 * lit * (1. - smoothstep(.55, 1., abs(vQ.x) * 2.)) * (1. - .4 * smoothstep(.5, 1., vQ.y));
  gl_FragColor = vec4(vec3(.05, .06, .09), a);
}`;

// THE AIR'S LIFE (order two, step 4; INVENTED, OURS). SMOKE: a thin ribbon from a roof's smoke hole, rising 9 to 16 m
// and leaning with the morning's light wind (one wind for the whole valley, dealt by the seed), its breadth turned
// across the eye's line (a law that reads the eye, as a rope's is), its wisps climbing on the world's clock.
const SMOKE_N = 7;
const SMOKE_VS = /* glsl */`
attribute vec3 aSrc; attribute vec3 aP;
uniform float uTime; uniform vec3 uWind;
varying vec3 vW; varying vec3 vP;
void main() {
  float h = aP.x, sd = aP.z, H = 9. + 7. * fract(sd * 7.13), t = uTime;
  vec3 c = aSrc + vec3(0., h * H, 0.);
  c.xz += uWind.xz * (h * h) * H * .6 + vec2(sin(t * .5 + sd * 40. + h * 3.1), cos(t * .43 + sd * 23. + h * 2.3)) * (.2 + 1.1 * h) * h;
  vec3 axis = normalize(vec3(uWind.x * h * 1.2, 1., uWind.z * h * 1.2));
  vec3 side = normalize(cross(axis, normalize(cameraPosition - c)));
  vec3 p = c + side * aP.y * (.55 + 2.3 * h);
  vW = p; vP = aP;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const SMOKE_FS = /* glsl */`
varying vec3 vW; varying vec3 vP;
${P.LIGHT_GLSL}
${P.NOISE_GLSL}
void main() {
  float h = vP.x, x = vP.y;
  float n = fbm2(vec2(x * 1.3 + vP.z * 9., h * 5.5 - uTime * .22));
  // (order three: a thick foot and a thinning, leaning plume)
  float a = .8 * pow(max(1. - x * x, 0.), 1.5) * smoothstep(0., .04, h) * pow(max(1. - h, 0.), 1.6) * (.45 + 1.1 * n);
  vec3 col = vec3(.62, .64, .7) * (uSunCol * .5 + uSkyCol * 1.5);
  gl_FragColor = vec4(hazed(col, vW), a);
}`;
// BIRDS: two plain faces a bird (its two wings from the body's line), each bird at its own place in its flock, the
// flock wheeling on its level oval (the part's flockPlan), wings beating and gliding by turns on the world's clock.
const BIRD_VS = /* glsl */`
attribute vec4 aFlock; attribute vec4 aOval; attribute vec4 aBird;
uniform float uTime;
varying vec3 vW; varying float vTone;
void main() {
  // aFlock: the oval's centre and its turn (radians a second); aOval: its two radii, the bird's size, its tone;
  // aBird: its place on the oval (radians), out or in from it, above or under it, its own beat
  float t = uTime, ang = aBird.x + t * aFlock.w + .25 * sin(t * .31 + aBird.w * 6.);
  float out_ = aBird.y + 1.6 * sin(t * .23 + aBird.w * 9.), sgn = sign(aFlock.w);
  vec3 c = aFlock.xyz + vec3(cos(ang) * (aOval.x + out_), aBird.z + .8 * sin(t * .4 + aBird.w * 4.), sin(ang) * (aOval.y + out_));
  vec3 fwd = normalize(vec3(-sin(ang) * aOval.x, 0., cos(ang) * aOval.y)) * sgn, right = vec3(-fwd.z, 0., fwd.x);
  // the wings: a beat for a few strokes, then a glide (position.x: -1 or 1 a wing's tip, 0 the body; position.z: along)
  float beat = sin(t * (9. + 3. * fract(aBird.w * 3.7)) + aBird.w * 20.) * smoothstep(-.2, .3, sin(t * .7 + aBird.w * 11.));
  float tip = abs(position.x);
  vec3 p = c + (right * position.x * (1. - .25 * tip * abs(beat)) + fwd * position.z + vec3(0., tip * (.12 + .55 * beat), 0.)) * aOval.z;
  vW = p; vTone = aOval.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const BIRD_FS = /* glsl */`
varying vec3 vW; varying float vTone;
${P.LIGHT_GLSL}
void main() {
  vec3 col = mix(vec3(.07, .07, .08), vec3(.34, .33, .34), vTone) * (uSunCol * .6 + uSkyCol * 1.2);
  gl_FragColor = vec4(hazed(col, vW), 1.);
}`;

async function buildValley(ctx, o) {
  const { U, scene, R } = o, info = { triangles: 0, calls: 0, pieces: {} };
  // the far hills' two shifts, dealt by the seed's own stream
  const far = [R.far() * 40, R.far() * 40];
  const add = (name, mesh, tris) => { mesh.name = name; mesh.matrixAutoUpdate = false; mesh.updateMatrix(); scene.add(mesh); info.triangles += tris; info.calls += 1; info.pieces[name] = tris; return mesh; };
  // THE TOWN's plan under the approach (INVENTED, OURS), by the part's law from the town's own stream, and its tops
  // from above for the houses' shade
  const houses = P.townPlan(R.town, far);
  await ctx.yield();
  const town = townHeights(houses);
  await ctx.yield();
  // the ground: one wide ring of plain triangles, shaded by place (it is cut away inside the building's outer line)
  {
    const radii = [30, 96]; while (radii[radii.length - 1] < 420) radii.push(radii[radii.length - 1] + 12);
    while (radii[radii.length - 1] < 7000) radii.push(Math.min(7000, radii[radii.length - 1] * 1.28));
    const NS = 128, pos = [], idx = [];
    for (let i = 0; i < radii.length; i++) for (let k = 0; k <= NS; k++) {
      const a = (k / NS) * Math.PI * 2, x = Math.cos(a) * radii[i], z = Math.sin(a) * radii[i];
      pos.push(x, P.groundY(x, z, far), z);
    }
    for (let i = 0; i + 1 < radii.length; i++) for (let k = 0; k < NS; k++) { const a = i * (NS + 1) + k, b = a + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...town }, vertexShader: WORLD_VS, fragmentShader: GROUND_FS, extensions: { derivatives: true } });
    add('ground', new THREE.Mesh(g, m), idx.length / 3).frustumCulled = false;
  }
  await ctx.yield();
  // THE TOWN's houses, courts' trees and hung cloths
  {
    // (with them, in the same call: the far city's true roofs, by the part's plan from the far city's own stream)
    // (the plan is taken in its steps, a frame handed back between them: it is one long loop of the far city's own
    // stream, and ctx.yield within the engine's slice would not part it; the draws and their order are the plan's)
    let farRoofs; { const steps = P.farRoofSteps(R.far, far); let r = steps.next(); while (!r.done) { await ctx.frame(); r = steps.next(); } farRoofs = r.value; }
    await ctx.yield();
    const g = await townGeometry(houses, R.town, farRoofs, () => ctx.yield());
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...town }, vertexShader: TOWN_VS, fragmentShader: TOWN_FS, extensions: { derivatives: true }, side: THREE.DoubleSide });
    add('town', new THREE.Mesh(g, m), g.index.count / 3).frustumCulled = false;
    info.houses = houses.length; info.farRoofs = farRoofs.length;
  }
  await ctx.yield();
  // THE HILLS' GREAT MASSES: the new Baths with their porticoed front, stair and foot portico, and the old palace wing's
  // long front (north, -Z); the walled terrace with its arcades, its temple of six columns at its front and three columned walks along its east, west and back sides (south, +Z)
  {
    const T = hillTools(), hm = P.hillMasses(), B = V.BATHS, Pl = V.PALACE, Te = V.TERRACE, K = HK;
    const stucco = [0.76, 0.70, 0.58], trav = P.COLOUR.TRAVERTINE, marble = [0.80, 0.78, 0.73], tile = ROOF_TONE, gravel = [0.56, 0.51, 0.41];
    const wall = { k: K.WALL }, tiles = { k: K.TILE, c: tile };
    let b = hm.baths;
    T.mass(...b, { f: wall, b: wall, l: { k: K.WALL, p: [10.5, 7, 6, 4.4] }, r: { k: K.WALL, p: [10.5, 7, 6, 4.4] } }, stucco);
    // (order two, step 5: three tiled roofs side by side over the block, the tall hall rising through the middle one)
    for (let q = 0; q < 3; q++) T.gable(b[0] + (b[1] - b[0]) * q / 3, b[0] + (b[1] - b[0]) * (q + 1) / 3, b[4], b[5], b[3], b[3] + 5.5, 1, tile, stucco);
    b = hm.bathsHall;
    T.mass(b[0], b[1], b[2], b[3] - 4, b[4], b[5], { f: { k: K.WALL, p: [11.3, 2.6, 0.8, 5] }, b: wall, l: { k: K.WALL, p: [11.6, 2.6, 0.8, 5] }, r: { k: K.WALL, p: [11.6, 2.6, 0.8, 5] } }, stucco);
    T.gable(b[0], b[1], b[4], b[5], b[3] - 4, b[3], 1, tile, stucco);
    b = hm.bathsFront;
    let columns = T.portico(b[0], b[1], b[4], b[5], b[2], B.FRONT_H - 2.4, 'f', 4.2, 0.5, marble, tile);
    // the stair, 36 m wide, lifted a hand above the slope it lies on, with its two cheek walls
    const sx0 = B.CX - B.STAIR_W / 2, sx1 = B.CX + B.STAIR_W / 2, sz0 = V.N_TOP, sz1 = B.STAIR_Z1, sy = V.N_Y + B.STAIR_LIFT, sl = Math.hypot(sz1 - sz0, sy);
    T.quad([sx0, 0.05, sz1], [sx1, 0.05, sz1], [sx1, sy, sz0], [sx0, sy, sz0], trav, K.STAIR, [0.62, 0, 0, 0], [[0, 0], [B.STAIR_W, 0], [B.STAIR_W, sl], [0, sl]]);
    T.quad([sx0, -0.5, sz0], [sx0, -0.5, sz1], [sx0, 0.05, sz1], [sx0, sy, sz0], trav, K.WALL, T.NONE, [[0, 0], [58, 0], [58, 1], [0, 18]]);
    T.quad([sx1, -0.5, sz1], [sx1, -0.5, sz0], [sx1, sy, sz0], [sx1, 0.05, sz1], trav, K.WALL, T.NONE, [[0, 0], [58, 0], [58, 18], [0, 1]]);
    b = hm.bathsFoot;
    columns += T.portico(b[0], b[1], b[4], b[5], b[2], 6, 'f', 4.5, 0.42, marble, tile);
    b = hm.palace;
    T.mass(b[0], b[1], b[2], b[3], b[4], b[5], { f: { k: K.WALL, p: [5.2, 2.2, 8.4, 1.6] }, r: wall, b: wall }, stucco);
    T.gable(b[0], b[1], b[4], b[5], b[3], b[3] + 3, 0, tile, stucco);
    b = hm.palacePortico;
    columns += T.portico(b[0], b[1], b[4], b[5], b[2], 5.4, 'f', 3.6, 0.36, marble, tile);
    // the terrace: two rows of travertine arches on its west side; its valley face a plain closed brick wall
    b = hm.terrace;
    // (THE VALLEY FACE IS ONE LONG PLAIN CLOSED BRICK WALL, no arch and no opening (that it has none is OURS): the
    // world's own wall kind (its courses) in the world's own fired clay tone, the roofs' tiles' (ROOF_TONE); its
    // height is the terrace's own: OURS; over the wall kind's courses and weather the brick's own courses (BRICK_GLSL
    // above: the world's law of coursed blocks at the brick's measure as drawn). The dug brick block before it is NOT
    // SHOWN: said at the head)
    const brick = { k: K.WALL, c: tile, p: [-BRICK[0], BRICK[1], 0, 0] };
    T.mass(b[0], b[1], -2 - 0.2, b[3], b[4], b[5], { l: { k: K.ARCADE, p: [6, 7.4, (b[3] + 0.2) / 2, 2.4] }, b: brick, r: wall, f: wall, t: { k: K.GARDEN, c: gravel, p: [23, 17, 1, 0] } }, trav);
    // (order three: the line flies low over the terrace) a parapet along its valley edge and its east edge's foot
    T.mass(b[0], b[1], b[3], b[3] + 1.05, b[4], b[4] + 0.5, { f: wall, b: wall, t: wall }, trav);
    const ty = V.S_Y + Te.PARAPET, ph = Te.PORTICO_H, pd = Te.PORTICO_D;
    columns += T.portico(b[1] - pd, b[1], b[4], b[5], ty, ph - 1.4, 'l', 3.5, 0.38, marble, tile);
    columns += T.portico(b[0], b[0] + pd, b[4], b[5], ty, ph - 1.4, 'r', 3.5, 0.38, marble, tile);
    columns += T.portico(b[0] + pd, b[1] - pd, b[5] - pd, b[5], ty, ph - 1.4, 'b', 3.5, 0.38, marble, tile, false);
    // the temple: a podium with its stair toward the valley, six columns across the front, a tiled gabled roof
    b = hm.temple;
    // (order three, addendum 6, point 5: the temple's own stone is a warm coursed stone, not white marble)
    const tstone = [0.69, 0.615, 0.5];
    const y1 = ty + Te.PODIUM, y2 = y1 + Te.COLUMN, y3 = y2 + Te.ENTAB;
    T.mass(b[0], b[1], ty, y1, b[4], b[5], { f: wall, b: wall, l: wall, r: wall, t: { k: K.TOP, c: tstone } }, tstone);
    T.quad([b[1], ty, b[4] - 8], [b[0], ty, b[4] - 8], [b[0], y1, b[4]], [b[1], y1, b[4]], tstone, K.STAIR, [0.6, 0, 0, 0], [[0, 0], [30, 0], [30, 9], [0, 9]]);
    // THE ALTAR (addendum 10; the owner's word of 13:14; INVENTED BY NEED): a plain block before the stair's foot, by
    // the part's law of place; nobody at it, nothing on it; its thin smoke is built with the roofs' smokes below
    { const al = P.altarPlan().box; T.mass(al[0], al[1], al[2], al[3], al[4], al[5], { f: wall, b: wall, l: wall, r: wall, t: { k: K.TOP, c: tstone } }, tstone); }
    // (order two, step 5: true columns all round, six by eleven, and the closed room inside them)
    const cr = 0.78, shade = { k: K.SHADE };
    // (order three: the line passes the temple's east flank at 16 to 27 m: twelve sides to a shaft, a base and a
    // capital to each column: a block, a spreading bell under it)
    const col = (x, z) => {
      T.column(x, z, y1 + 0.5, y2 - 1.5, cr, tstone, 12);
      T.mass(x - cr * 1.3, x + cr * 1.3, y1, y1 + 0.5, z - cr * 1.3, z + cr * 1.3, { f: wall, b: wall, l: wall, r: wall, t: wall }, tstone);
      T.column(x, z, y2 - 0.35, y2 - 1.5, cr * 1.28, tstone, 8);
      T.mass(x - cr * 1.25, x + cr * 1.25, y2 - 0.35, y2, z - cr * 1.25, z + cr * 1.25, { f: wall, b: wall, l: wall, r: wall }, tstone);
    };
    for (let i = 0; i < 6; i++) for (const z of [b[4] + cr + 0.2, b[5] - cr - 0.2]) col(b[0] + cr + 0.2 + i * (b[1] - b[0] - 2 * cr - 0.4) / 5, z);
    for (let i = 1; i < 10; i++) for (const x of [b[0] + cr + 0.2, b[1] - cr - 0.2]) col(x, b[4] + cr + 0.2 + i * (b[5] - b[4] - 2 * cr - 0.4) / 10);
    columns += 30;
    // (order three, addendum 2, point 2: the room's walls take the sun between the columns and the columns' shade (the
    // CELLA kind); the entablature in its bands under a cornice that stands out half a metre; a plain ceiling over the
    // walk round the room, so that the roof's underside is not seen; the great door in the front wall)
    const flankSp = (b[5] - b[4] - 2 * cr - 0.4) / 10, frontSp = (b[1] - b[0] - 2 * cr - 0.4) / 5, c0z = b[4] + cr + 0.2, c0x = b[0] + cr + 0.2, colH = Te.COLUMN;
    const stone = [0.74, 0.67, 0.56];
    T.mass(b[0] + 4.6, b[1] - 4.6, y1, y2, b[4] + 9.5, b[5] - 4.6, {
      r: { k: K.CELLA, p: [flankSp, c0z, 4.6 - cr - 0.2, colH] }, l: { k: K.CELLA, p: [flankSp, c0z, 4.6 - cr - 0.2, colH] },
      b: { k: K.CELLA, p: [-frontSp, c0x, 9.5 - cr - 0.2, colH] }, f: { k: K.CELLA, p: [frontSp, c0x, 4.6 - cr - 0.2, colH] } }, stone);
    T.mass(b[0], b[1], y2, y3, b[4], b[5], { f: { k: K.ENTAB }, b: { k: K.ENTAB }, l: { k: K.ENTAB }, r: { k: K.ENTAB } }, tstone);
    T.mass(b[0] - 0.5, b[1] + 0.5, y3 - 0.6, y3, b[4] - 0.5, b[5] + 0.5, { f: wall, b: wall, l: wall, r: wall }, tstone);
    T.quad([b[0] - 0.5, y3 - 0.6, b[4] - 0.5], [b[1] + 0.5, y3 - 0.6, b[4] - 0.5], [b[1] + 0.5, y3 - 0.6, b[5] + 0.5], [b[0] - 0.5, y3 - 0.6, b[5] + 0.5], tstone, K.WALL, T.NONE, [[0, 0], [31, 0], [31, 53], [0, 53]]);
    T.quad([b[0], y2, b[4]], [b[1], y2, b[4]], [b[1], y2, b[5]], [b[0], y2, b[5]], tstone.map((v) => v * 0.92), K.WALL, T.NONE, [[0, 0], [30, 0], [30, 52], [0, 52]]);
    T.gable(b[0], b[1], b[4], b[5], y3, y3 + Te.PEDIMENT, 1, tile, tstone);
    // THE GARDENS (order two, step 5): the north slope's terraces (a retaining wall with a low parapet, a planted level,
    // the end's cheek) and the trees, by the part's plan from the hills' own stream; the trees' lumps follow from it
    await ctx.yield();
    const garden = P.gardenPlan(R.hills), retain = [0.72, 0.64, 0.52], bed = [26, (V.N_FOOT - V.N_TOP) / P.GARDEN.TERRACES, 0, 0];
    for (const t of garden.terraces) {
      const w = t.x1 - t.x0, hw = t.y1 - t.y0 + 0.8, dd = t.zf - t.zb;
      T.face([[t.x0, t.y0, t.zf], [t.x1, t.y0, t.zf], [t.x1, t.y1 + 0.8, t.zf], [t.x0, t.y1 + 0.8, t.zf]], [0, 0, 1], retain, K.WALL, T.NONE, [[0, 0], [w, 0], [w, hw], [0, hw]]);
      T.face([[t.x0, t.y1, t.zf], [t.x1, t.y1, t.zf], [t.x1, t.y1, t.zb], [t.x0, t.y1, t.zb]], [0, 1, 0], retain, K.GARDEN, bed, [[0, 0], [w, 0], [w, dd], [0, dd]]);
      for (const [x, sg] of [[t.x0, -1], [t.x1, 1]]) T.face([[x, t.y0, t.zf], [x, t.y1, t.zf], [x, t.y1, t.zb], [x, t.y1, t.zb]], [sg, 0, 0], retain, K.WALL, T.NONE, [[0, 0], [0, 3], [dd, 3], [dd, 3]]);
    }
    await ctx.yield();
    for (const t of garden.trees) (t.kind === 0 ? T.cypress : T.pine)(t, R.hills);
    await ctx.yield();
    // THE MARKET (order three, addendum 2; INVENTED, OURS): its stalls and its ONE row of six pines, by the part's law
    // of place (the hills' stream gives each pine's lumps and tone after every other tree's)
    {
      const cloths = [[0.80, 0.76, 0.66], [0.72, 0.52, 0.24], [0.6, 0.27, 0.2], [0.36, 0.42, 0.5], [0.6, 0.52, 0.38], [0.84, 0.8, 0.7]], timber = [0.36, 0.27, 0.18];
      // (the way's own two rows, then the rows beside it)
      const stalls = [...MARKET_PLAN.stalls, ...MARKET_MORE.stalls];
      for (const st of stalls) T.stall(st, cloths[Math.floor(st.tone * cloths.length) % cloths.length], timber);
      for (const row of MARKET_PLAN.rows) for (let k = 0; k < row.n; k++) T.finePine({ ...P.pineTree(row, k), y: 0 }, R.hills);
      info.stalls = stalls.length; info.pines = MARKET_PLAN.rows.reduce((a, r) => a + r.n, 0);
    }
    await ctx.yield();
    info.trees = garden.trees.length; info.columns = columns;
    // THE POSTS at the pavement's outer edge: 80 stone posts 1.5 m high on the lines of the columns, joined two and
    // two by a plain bar; every other gap, and the gap on each of the four axes, is left open as a way in (the posts'
    // number, height and bar are INVENTED BY NEED; which gaps are open is CHOSEN)
    const posts = P.ellipseSteps(M.RIM_A, M.RIM_B, M.BAYS, -0.5), ph2 = M.POST_H, pw = 0.25, timber = P.COLOUR.TIMBER;
    const at = (q) => [q.x + q.nx * M.PAVE_W, q.z + q.nz * M.PAVE_W];
    for (let i = 0; i < M.BAYS; i++) {
      const [x, z] = at(posts[i]);
      T.mass(x - pw, x + pw, 0, ph2, z - pw, z + pw, { f: wall, b: wall, l: wall, r: wall, t: wall }, trav);
      if (i % 2 === 1) {
        const [x2, z2] = at(posts[(i + 1) % M.BAYS]), l = Math.hypot(x2 - x, z2 - z), ox = (-(z2 - z) / l) * 0.06, oz = ((x2 - x) / l) * 0.06;
        for (const [ya, yb, o] of [[1.0, 1.12, 1], [1.0, 1.12, -1]]) T.quad([x + ox * o, ya, z + oz * o], [x2 + ox * o, ya, z2 + oz * o], [x2 + ox * o, yb, z2 + oz * o], [x + ox * o, yb, z + oz * o].map((v) => v), timber, K.WALL, T.NONE, [[0, 0], [l, 0], [l, 0.12], [0, 0.12]].map((t) => t));
        T.quad([x - ox, 1.12, z - oz], [x2 - ox, 1.12, z2 - oz], [x2 + ox, 1.12, z2 + oz], [x + ox, 1.12, z + oz], timber, K.WALL, T.NONE, [[0, 0], [l, 0], [l, 0.12], [0, 0.12]]);
      }
    }
    const g = T.geometry();
    const m = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: HILL_VS, fragmentShader: HILL_FS, extensions: { derivatives: true }, side: THREE.DoubleSide });
    add('hills\' masses and posts', new THREE.Mesh(g, m), g.index.count / 3).frustumCulled = false;
  }
  await ctx.yield();
  // THE PEOPLE OUTSIDE, by the part's plan from their own stream (their number by the density)
  {
    // (with them, in the same call: the few who stand in the upper arcades and the many who pass behind the ground
    // arches, by the part's arcadePlan from a stream of its own)
    const plan = P.outsidePlan(R.people, o.density, houses.lanes), arc = P.arcadePlan(R.arcades, o.density), g = figureGeometry();
    // THE CROWDS AND THE TERRACE'S PEOPLE, dealt after the people outside and from streams of their own
    // ('amphitheatre-p1-ground:' and 'amphitheatre-p1-entry:' + seed: plain names of streams; a stream's name is a
    // part of its key). groundPlan lays the streams' walkers in their fans (ground.line, ground.slow: the plan's own
    // figures, a line and a slowing each) and deals the crowds; terracePlan deals the terrace's people. more: those
    // figures' sets in the order they are drawn (each with its floor's height y and its sun: -1 by the one law, or
    // its own share under a roof); roofed: how many of the last set stand under a roof (they throw no shade of their
    // own on the floor: they are the last before the arcades' figures, so that the shadows' count leaves them out as
    // it leaves the arcades' out)
    await ctx.yield();
    const ground = await P.groundPlan(plan, o.stream('p1-ground'), o.density, houses.lanes, () => ctx.yield(), () => ctx.frame()), pLine = ground.line, pSlow = ground.slow;
    await ctx.yield();
    const tp = await P.terracePlan(o.stream('p1-entry'), o.density, () => ctx.yield()), more = [ground.more, tp.open, tp.roofed], roofed = tp.roofed.n;
    info.peopleTerrace = tp.open.n + tp.roofed.n;
    await ctx.yield();
    const nOut = plan.n + more.reduce((a, q) => a + q.n, 0), nAll = nOut + arc.n;
    const line = new Float32Array(nAll * 4), who = new Float32Array(nAll * 4), at = new Float32Array(nAll * 4);
    line.set(pLine); who.set(plan.who); line.set(arc.line, nOut * 4); who.set(arc.who, nOut * 4);
    for (let i = 0; i < plan.n; i++) { at[i * 4 + 1] = plan.stand[i]; at[i * 4 + 2] = -1; at[i * 4 + 3] = pSlow[i]; }
    { let k = plan.n; for (const q of more) { line.set(q.line, k * 4); who.set(q.who, k * 4); for (let i = 0; i < q.n; i++, k++) { at[k * 4] = q.y[i]; at[k * 4 + 1] = q.stand[i]; at[k * 4 + 2] = q.sun[i]; at[k * 4 + 3] = q.slow[i]; } } }
    const sv = U.uSun.value;
    for (let i = 0; i < arc.n; i++) {
      // the sun comes in at an opening that faces it: a full share for one who stands at the opening, a part for one
      // who passes behind the piers
      const k = (nOut + i) * 4, face = arc.at[i * 4 + 2] * sv.x + arc.at[i * 4 + 3] * sv.z;
      at[k] = arc.at[i * 4]; at[k + 1] = arc.at[i * 4 + 1]; at[k + 2] = face > 0.12 ? (arc.at[i * 4 + 1] > 0.5 ? 1 : 0.3) : 0;
    }
    g.setAttribute('aLine', new THREE.InstancedBufferAttribute(line, 4)); g.setAttribute('aWho', new THREE.InstancedBufferAttribute(who, 4)); g.setAttribute('aAt', new THREE.InstancedBufferAttribute(at, 4));
    g.instanceCount = nAll; plan.n = nAll; info.peopleArcades = arc.n;
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...town }, vertexShader: FIGURE_VS, fragmentShader: FIGURE_FS });
    add('people outside', new THREE.Mesh(g, m), plan.n * FIGURE_TRIS).frustumCulled = false;
    info.peopleOutside = nAll - arc.n;
    // their long shadows: one for every figure of the people outside, standing or going, the bearers among them; none
    // for the terrace's people under a roof (they are dealt last) nor for those in the arcades (each stands on a floor
    // in the shade)
    {
      const sg = new THREE.InstancedBufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      sg.setAttribute('aLine', g.getAttribute('aLine')); sg.setAttribute('aWho', g.getAttribute('aWho')); sg.setAttribute('aAt', g.getAttribute('aAt'));
      sg.instanceCount = nAll - arc.n - roofed;
      const sm = new THREE.ShaderMaterial({ uniforms: m.uniforms, vertexShader: SHADOW_VS, fragmentShader: SHADOW_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const sh = add('people\'s shadows', new THREE.Mesh(sg, sm), (nAll - arc.n - roofed) * 2); sh.frustumCulled = false; sh.renderOrder = 1;
    }
    // the litters: the same law and the same material; the bearers are among the figures above. With the carried
    // litters (outsidePlan) the litters SET DOWN in groups before the barred gaps (groundPlan): the same form, each
    // standing still at its place, SET_DOWN lower than a carried one
    const lg = litterGeometry(), cat = (a, b) => { const c = new Float32Array(a.length + b.length); c.set(a); c.set(b, a.length); return c; };
    const lc = plan.litters, ld = ground.litters, lt = { n: lc.n + ld.n, line: cat(lc.line, ld.line), who: cat(lc.who, ld.who), slow: cat(lc.slow, ld.slow), y: cat(new Float32Array(lc.n), ld.y) };
    const lat = new Float32Array(lt.n * 4);
    for (let i = 0; i < lt.n; i++) { lat[i * 4] = lt.y[i]; lat[i * 4 + 2] = -1; lat[i * 4 + 3] = lt.slow[i]; }
    lg.setAttribute('aLine', new THREE.InstancedBufferAttribute(lt.line, 4)); lg.setAttribute('aWho', new THREE.InstancedBufferAttribute(lt.who, 4)); lg.setAttribute('aAt', new THREE.InstancedBufferAttribute(lat, 4));
    lg.instanceCount = lt.n;
    const lm = new THREE.ShaderMaterial({ uniforms: m.uniforms, vertexShader: FIGURE_VS, fragmentShader: FIGURE_FS, side: THREE.DoubleSide });
    add('litters', new THREE.Mesh(lg, lm), lt.n * (lg.index.count / 3)).frustumCulled = false;
    info.litters = lt.n;
  }
  await ctx.yield();
  // THE AIR'S LIFE: the roofs' smoke and the birds
  {
    const src = [], pp = [], idx = []; let n = 0;
    // the wind: light, across the long axis, the way the clouds' shade drifts (the part's SKYSHADE.DRIFT), a little to one
    // side or the other and stronger or weaker by the 'air' stream's first two draws; then a number for each roof's
    // smoke; the altar's smoke takes its number from the 'altar' stream
    const wb = (R.air() * 0.36 + 0.32) * Math.PI, ws = 0.5 + 0.5 * R.air();
    for (const sm of [...houses.smoke, { ...P.altarPlan().smoke, altar: true }]) {
      const sd = sm.altar ? R.altar() : R.air();
      for (let k = 0; k <= SMOKE_N; k++) for (const sidev of [-1, 1]) { src.push(sm.x, sm.y, sm.z); pp.push(k / SMOKE_N, sidev, sd); }
      for (let k = 0; k < SMOKE_N; k++) { const a = n + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      n += (SMOKE_N + 1) * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(src, 3)); g.setAttribute('aSrc', new THREE.Float32BufferAttribute(src, 3)); g.setAttribute('aP', new THREE.Float32BufferAttribute(pp, 3)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, uWind: { value: new THREE.Vector3(-Math.cos(wb) * ws, 0, -Math.sin(wb) * ws * 0.6) } }, vertexShader: SMOKE_VS, fragmentShader: SMOKE_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = add('roofs\' smoke', new THREE.Mesh(g, m), idx.length / 3); mesh.frustumCulled = false; mesh.renderOrder = 2;
    info.smokes = houses.smoke.length + 1;
  }
  {
    const flocks = P.flockPlan(o.stream), fl = [], ov = [], bd = []; let nb = 0;
    for (const f of flocks) for (let i = 0; i < f.n; i++) {
      const r = f.birds.subarray(i * 5, i * 5 + 5);
      // a flock keeps together on a part of its oval (a third of the way round for one that wheels over the roofs,
      // a sixth for one round the wall's top)
      fl.push(f.x, f.y, f.z, f.turn); ov.push(f.rx, f.rz, 0.42 + 0.2 * r[4], f.wall ? 0.1 * r[3] : r[3] * r[3]);
      bd.push((f.phase || 0) + r[0] * Math.PI * 2 * (f.wall ? 0.16 : 0.34), (r[1] * 2 - 1) * f.spread, (r[2] * 2 - 1) * P.AIR.RISE * 0.7, r[3]); nb++;
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, 0, 0, -0.45, -1, 0, -0.15, 1, 0, -0.15], 3)); g.setIndex([0, 2, 1, 0, 1, 3]);
    g.setAttribute('aFlock', new THREE.InstancedBufferAttribute(new Float32Array(fl), 4)); g.setAttribute('aOval', new THREE.InstancedBufferAttribute(new Float32Array(ov), 4)); g.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array(bd), 4));
    g.instanceCount = nb;
    const m = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: BIRD_VS, fragmentShader: BIRD_FS, side: THREE.DoubleSide });
    add('birds', new THREE.Mesh(g, m), nb * 2).frustumCulled = false;
    info.birds = nb; info.flocks = flocks.length;
  }
  await ctx.yield();
  // THE WATER (Cassius Dio's tale; ARGUED): a plain bright surface, shallow and clear over a pale sand floor, the bowl,
  // the cloths and the sky mirrored in it by the bowl's own section, broken by small ripples on the world's clock
  {
    const g = new THREE.CircleGeometry(1, 72); g.rotateX(-Math.PI / 2); g.scale(M.WATER_A, 1, M.WATER_B); g.translate(0, M.WATER_Y, 0);
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, uMarks: o.water.uMarks, uMarkN: o.water.uMarkN, uCrowd: o.water.uCrowd }, vertexShader: WORLD_VS, fragmentShader: WATER_FS });
    add('water', new THREE.Mesh(g, m), 72).frustumCulled = false;
  }
  await ctx.yield();
  return { info, update() {}, dispose() { town.uTownH.value.dispose(); } };
}
