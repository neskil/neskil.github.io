// HANDS IN THE PAINTED CAVE: the whole cave with its hands, one object, and the style everything else is made from.
//
// THE STYLE, as a painter of stencils would state it, and how each rule is done here:
//   ROCK     TWO GROUNDS BY PLACE, each in FOUR FLAT TONES told by lamplight: PALE LIMESTONE (near, lit, half, deep) and SOOT where the
//            lamps' smoke gathers (SOOT: #7A5236 in a lamp's pool, #56382A, #38241C, #24160F): everything beyond the doorway from the
//            crest of its rim inward (its reveal, the throat, the Last Wall, the last gallery, the end wall) and the hall's crown
//            (above 37 m, uneven by place; above 48 m over the Hand of Hands, so its field and its lamps stand on pale rock; and outside
//            the Great Sun's own round, 34 m about it: the Sun and its two rings of suns stand on pale rock with all their spray). The doorway's
//            arch is soot from its rim's crest inward and stands in whatever tone its lamps give it. groundAt
//            and its twin ground in the shader give the ground at a place; its border is cut like a tone's. THE LAW OF LIGHT: the
//            tone at a place follows THE LAMPS (the sum of their pools, summed in the vertex shader from the lamps' places with
//            their sway and breath by the world's clock: near above 0.55, lit above 0.38, half above 0.18, deep below; one lamp
//            alone: near to 0.65 of its reach, lit to 0.83, half to 1.11, deep beyond: A POOL ROUND EACH LAMP, darker rock between
//            the pools), THE FLOOR OF LIGHT (ambAt and its twin amb in the shader) and THE ROCK'S FORM. THE FLOOR OF LIGHT HAS NO
//            SOURCE: it is a least light GIVEN BY PLACE ALONE, which follows no lamp's sway, breath or reach and no clock; the rock
//            is never darker than it. It gives: the hall's wall the second tone to 15 m up on its south side, all over the Great
//            Sun and its first ring, and to 16 m either side of the doorway (18 m either way of its middle); the third tone from
//            there up to the crown's soot, which is deep; the passage's walls the second to 3 m and its vault the third; the
//            arch's two faces the second to 10 m, the third above; the columns' room the third to 24 m; the mouth's throat the
//            third; the Six's wall the second to 12 m. THE ROCK'S FORM (attribute aForm, baked by place in makePatch): hollows,
//            undersides, the junction of wall and roof stand ONE TONE DOWN; no island of a hollow or an underside is under 4 m
//            across (the vault beside the doorway and within the east wall's pool is calmed: no form there). THE EAST WALL'S
//            POOL: all rock within 13 m of the place by the plan of the lamp on the hall's wall east of the doorway (99.6, 15,
//            194.5) stands in the TOP tone. THE POOL IS GIVEN BY PLACE ALONE, by no lamp and no clock: that lamp gives the top
//            tone to 9.1 m only and the pool reaches 13 m, so beyond the lamp's own reach THE POOL HAS NO SOURCE. Its border is
//            cut in the picture like the border of the grounds, one round edge. EVERY BORDER IS CUT, NEVER SOFT: a tone's border lies
//            where the light crosses its threshold and is at most half a metre broad: a STIPPLE of the grain where the grain is
//            resolved, and where it is not a clean edge two picture elements broad. THE GRAIN (3 cm and 1.5 cm, fixed to the rock
//            by place) never decides a tone: it moves a border by a quarter of a metre either way at most, and it is FILTERED BY
//            THE PIXEL'S FOOTPRINT (whole at 2.5 picture elements a grain, gone at 1: a stipple to some 5 m, a clean edge beyond).
//            FACES OF ONE TONE: the Last Wall the top tone, the throat's roof the third, two small walls of the gallery from it,
//            and the great column the third all round (a tone under the wall beside the doorway): there the build gives a face
//            its tone by place (aForm -1 near, -2 lit, -3 half, -4 deep); the lamps do not decide there and the border between
//            two faces lies on their edge. THE WET BAND: from the water up to 0.4 to 0.6 m (uneven by place)
//            all rock stands one tone down, the band's upper border a stipple 12 cm broad. Never a line, never black.
//   PAINT    red, yellow, black, white exist only as SPRAY round a hand: style.stencil. ON SOOT THE PAINT IS WHITE OR YELLOW ONLY (three hands
//            in five white, by the hand's own number), with no under-field: dark wheels and hands in pale halos. A stencil is the rock's OWN triangles drawn again
//            (stamp()), so it lies on the true surface and cannot fight at depth; the hand is one distance function evaluated in the shader
//            (HAND_GLSL; its JavaScript twin is handDistance()), bare rock inside (alpha 0), its edge CRISP at every distance (one picture
//            element). Outside: a band DENSE AND EVEN (0.09 of the hand's height times the halo's measure R, lopsided by the hand's
//            seed), then SPATTER: hard-edged dots whose size belongs to the hand (a hand h metres tall: dots on grids of h/50 and h/100,
//            every dot 3 cm to 25 cm across), fewer outward to nothing over at most a quarter of the hand's height and never over 1.5 m.
//            The pixel's footprint filters the dots as it filters the grain: far off the fall is a soft edge of the same breadth.
//            Under an upright hand on a wall: runs of pigment, plain columns at most 2 m long. The wrist runs out of the halo.
//            PIGMENT AT FULL STRENGTH: red #B8381C, yellow #E3A63A, black #1B1412, white #F5ECD8 as they are (a fresh hand's: 0.8 of it), never multiplied by
//            the rock's tone, never dusted thin. THE UNDER-FIELD: where its rock is in the two upper tones a white-led stencil stands on a
//            solid field of red or black (by its own number) and a yellow-led one on red: whole under the pigment's dense band, it
//            shows beyond it as a rim 0.12 of the halo broad and spatters on its outer side. Later stencils lie over earlier ones
//            in index order: a bare hand shows what lay under it. On a wall of several faces a stencil ends at its own face's
//            edges: none lies across an edge between two faces.
//   THE HAND (counts 5 to 9; N counts the thumb): a ROUNDED PALM a little taller than broad (0.43 x 0.50 of the hand's height for a
//            five; its corners rounded by 0.62 of its half breadth) on a WRIST 0.55 of its breadth (never more than a quarter of the
//            hand's height across); N - 1 FINGERS of unequal length (the middle longest, the little finger shortest) with round tips,
//            a little slimmer toward the tip, rising from the palm's upper edge: a five's four fingers 15.5 degrees apart and 0.74 of
//            their pitch across (parted, so they count at a glance), a six's five 13 degrees and 0.88, seven to nine 8.4 to 9.8
//            degrees and 0.8; ONE THUMB, shorter and thicker, leaving the palm's side low down at 58 degrees. Six to nine: more
//            fingers side by side on a BROADER palm (0.55 to 0.75 of the height), their tips uneven by a fifth from seven on, the thumb
//            stays one: a hand with too many fingers, not a fan. THE FIRST SIX alone is SPREAD (stamp's o.spread): five fingers 21.8
//            degrees apart, each a fifth of its palm's breadth across, turned 8 degrees away from the thumb; its thumb 0.27 of the
//            height long and 0.116 across, at 58 degrees. TEN TO THIRTEEN keep a hand's shape: a round palm on a broad lower palm
//            (0.6 of the height across) and a wrist a quarter of the height across, the fingers a fan of 130 to 176 degrees, 0.064
//            of the height across at the root and 0.051 at their round tips. From fourteen the fan's fingers are fine (0.08 across
//            and less) and the fan opens further; from twenty-four a sun: a round palm with fingers all the way round. Wrongs (fork,
//            join, bend, palms from palms, hands on hands) are drawn on the same hand.
//   FLAME    a leaf 0.35 m tall (a great lamp's: 0.9 m), white in its belly, the flame's colour above, yellow at its tip, on a clay
//            bowl in the rock's lit tone (makeLamps). ONE SIZE BY ITS PLACE: nothing of a lamp reads the eye. NO CORDS: EVERY LAMP
//            STANDS ON ROCK: a broad flat ledge grown from a wall (shelfPatch: 1.5 m across, 0.5 m high), a ledge of the passage,
//            a stalagmite's top or an islet in the lake (standPatch). The bowl stands; the flame leans to where its light stands
//            by the clock. Over every flame that stands against a wall a round of rock (2.8 flames across, its middle 1.6
//            flames above the flame's foot) is kept bare of any hand's own shape; no mark is painted there.
//   WATER    the cave drawn a second time upside down (every mesh twice, scale y -1) under one sheet that multiplies its linear colour
//            by WATER_TINT (0.27, 0.20, 0.13): shown about half as bright, browner; in the mouth and the gallery from it (by place)
//            by 0.3 of that again: dark water under the doorway. Rings (makeWater): each drip sends two slow swells to 6 m, a pale
//            band and a dark band of half a metre that pass over the mirror's picture (times 1.5 and 0.5 in linear light; bands of
//            light, NOT a true bending of the picture: nothing here reads the picture back). THE MOUTH DRIPS: 160 sites more from the doorway to the last gallery
//            (60 from 327 m to 387 m flown, 100 from 340 m to 391 m), and on its dark water a ring is stronger (times 1.9 and 0.1) and slower to fade. No texture, no light, no fog.
//   MOTION   the puff that lays a fresh hand (makePuffs, by the metres flown); the lamps' light sways and breathes, so every border
//            the lamps decide creeps over rock and paint; flames lean; dust turns in each lamp's reach (16 motes a lamp); every 9 s a
//            run of white dust goes once round the Great Sun's fingers (880 motes leave the fingers as it passes their bearing, 1,320
//            at any moment: a thin steady fall), each falling 8 s through the lamplight (makeDust); rings spread. All by the world's
//            clock except the fresh hands. A mote is a disc turned to the eye, never smaller than 0.0014 of its distance.
//
// THE COUNT BY PLACE (countAt(x, y, z); the same on every seed; the seed never enters it). THE MEASURE: a surface belongs to the
// stretch of the flown line that passes nearest to it in the room it stands in; along that order the count of plain hands never
// falls BUT AT ONE SEAM: the Last Wall's 56 holds by place on the walls beside it at the bend (the rows below), and at the east
// edge of that place, from the floor to some 17 m up, the wall lies a metre or so of line past the Last Wall's own stretch, where the first suns of 60 stand across
// the way: a hand laid there (the hands that stand there are low, 2 to 4 m up) carries 56 beside a 60 (lineNear gives that stretch's metre; the rooms are the plan's; the line is 425.6 m long). A hand carries the count and
// the kind of the point its stencil is drawn about (THE MIDDLE THE STENCIL IS DRAWN ABOUT, below).
//   room         where                                   fingers (with the thumb)                              wrong
//   gallery      z < 7, x <= 57                          5, every one                                          none
//   first six    the gallery's end wall, x 56            6 (one hand, 7 m, fixed: five fingers and a thumb, spread)  none
//   passage      z 7 to 66                               6 to the line's 74.5 m (where it passes z 36.5), 7 after  none
//   columns      z 66 to 140, x < 70                     7; 8 from the line's 129.5 m; 9 from its 155.5 m      from z 103 one in three forks
//   arch         ITS OWN FACES AS FAR AS THEY RUN and    10, 11, 12, 13 by 3.5 m of z (the line runs along z;   joins or bends
//                the inner turn of the way in's rim:     thirteen from z 150.5 on)
//                within 8.2 m of x 46 under 17.5 m, z 140 to 157.6; and the rock behind the hall's wall (z under 154, 1.6 m and more north of the vault's plan surface)
//   hall         the dome, to the Sun's own stretch      14 to 40 by the line's metre alone: 14 where the line comes in (194 m), 40 at
//                                                        the Sun's stretch (277 m), a smooth step between; from 228 m they are suns
//                                                        (24 and more); one in five forks, one in seven bends. Its rock begins south
//                                                        of the north wall (z 182): the first hands on it count 19 and more
//   the Great Sun                                        48 (one hand, 30 m, fixed; it counts at its centre's stretch, 277 m)
//   hall after   the dome, every surface whose nearest   suns of 48 (the far half of the Sun's two rings of suns, the vault and the
//   the Sun      stretch comes after the Sun's           walls on the way back north)
//   north wall   the hall's side, z < 182, at any x and   suns of 48 (further than 20 m from the arch's middle 45 in 100 by place, the others 5 as palms from palms). THE ONE
//                any height, WHATEVER ITS STRETCH (the   EXCEPTION TO THE MEASURE: it stands behind the eye on the way in and is seen on the way back
//                                                        (its upper suns and the crown's stand in the picture from about 240 m flown, as the look turns north across the lake, before
//                                                        the eye reaches the Sun's own stretch at 277 m. That is no fall by the measure: the measure takes each hand at the stretch
//                                                        of the line nearest to it, and theirs is flown after the Sun's; and the Great Sun's own 48 has stood in the picture, through the arch, since 100 m)
//                arch's count holds on its own faces and the rim's inner turn only; the 48 begins on the hall's side of the rim)
//   pier         the great column at the mouth and the   suns of 48
//                hall's rock within 7.5 m of its axis
//   way out      behind the vault's plan surface:        by the line's metre alone, both walls alike: suns of 52 from the mouth (351.5 m)
//                x > 70, z < 168 (east jamb to           to the Last Wall's stretch, 56 in that stretch (the walls beside the Last Wall
//                z 170.5)                                at the bend), 60 after it; half by place; the others 5 as hands whose fingers are hands;
//                                                        all of it on soot: white and yellow
//   last wall    x 70 to 88, z < 140.8                   suns of 56, every one (its stretch: the line's 375 m to 384.5 m)
//   the sun behind the ring                              64 (one hand, 36 m, fixed, in yellow; over it the same sun 19 m across in white)
//   The hands that are wrong in kind stay fives (palms from palms, hands on hands, THE HAND OF HANDS, 14.3 m to its fingers'
//   roots, 20 m with its hands): the hand law ends every finger in a hand 0.8 of the finger's length tall, and from fourteen
//   fingers those hands would run together. The First Six is the one hand out of its room's count.
//   SIZES: gallery 0.7 to 1.9 m and 24 of 2 to 3 m, two of 2.8 and 3 m on each wall by the way in; beside the Six two of 2.6 and
//   2.8 m and four of 1.3 to 2.4 m; twelve of 1.2 to 2 m over the passage's opening (eight of them in two rows from 5.3 m to 9 m) and five of 1.4 to 2 m on the south wall by it: seventeen fives.
//   Passage: 1.4 to 2.2 m on its walls between 0.8 m and 3.6 m (asked every 3.47 m along the east wall and every 2.75 m along the west; where a place is taken, one of 1.4 m beside it; no stretch of a wall over 5 m bare: there one of 0.8 to 1.4 m), no hand on the middle of
//   its vault; on the vault's two haunches one row over each wall, asked every 2.6 m: hands of 1.1 to 1.4 m, their middles 0.8 m in from the wall's top, fingers up the vault and turned 60 degrees toward the way in, so that an eye on the line some metres before them sees them upright (31 to 38 stand of 44 asked). Where a wall of the gallery, the passage or the columns' room within 14 m of the line stands bare: small hands of 0.6 to 1.2 m.
//   Columns: 1 to 1.8 m in rising bands and four of 2.7 to 3 m on each column's side toward the flown line; its long walls 1 to
//   2.4 m, ten of 2 to 3 m and three of 5.5 m each. Arch: four whole fans of 4 m on each face. Hall: suns of 9.6 and
//   7.5 m in two rings about the Great Sun; of six further rings asked on the vault about the Sun (9.2 to 3.4 m, larger toward the
//   Sun) ONE STANDS IN PART, the second: 7 to 9 suns of 6.9 to 8.7 m (the first lies inside the Sun's own guard, the others meet no free
//   bearing; of the second's eleven places those whose spray would cross onto the crown's soot are left out); 2.4 to 4.6 m round the
//   lake; east of the Sun, from the water to 30 m up, 5 to 11 suns of 5 to 7 m stand of eighteen asked in three rows; seven of 5.5
//   to 8 m on the wall to either side of the arch and east of the mouth; over the way in two or three of 5 to 6.5 m stand of six asked; on
//   the north wall 1 to 7 stand of sixteen places, 11 to 16 of them asked a seed, at 4 to 6.5 m (at the mouth the mouth's law holds them to 2.5 m); five suns of 2.4 m and up to twelve of 1.3 to 2.3 m on the great
//   column. THE CROWN: four rings of suns about the vault's middle, 57, 52, 46.5 and 41.5 m up (14 of 6 m, 21 of 5.5 m, 29 of 5 m
//   and 37 of 4.4 m asked; 57 to 61 suns stand a seed, and at most two hands whose fingers are hands), white and yellow on the soot,
//   the middle left dark. ABOUT THE HAND OF HANDS a ring of suns of 2 to 2.4 m, 3 m and more clear of its field (thirteen places,
//   each asked only where the count at the point its sun is drawn about gives a plain sun: 8 to 11 a seed; 6 to 11 suns stand; a
//   sun of the crown gives way to each). AT THE MOUTH: its body of rock carries no hand
//   but suns of 0.95 m on the middle of its swelling (ten places, seven or eight of them asked a seed; 6 to 8 stand); east of it, on the vault clear of the body's
//   skirt, suns and palms from palms of 0.95 or 1.25 m at the vault's own grid places (2 to 9 suns and 1 to 5 palms from palms
//   stand); on each side of its reveal suns of 2 m (eight places; 5 to 7 stand: the east side's by the way out's count, the west
//   side's by the great column's, which is its place's). ONE GROUND AND NO SUN ON A SUN (hand() keeps both, near and far, so some
//   of what is asked above does not stand; both are taken, as are a hand's count, the laws of its size and its light, the near
//   faces' rule, the bare wall's test and the lists of hands, at THE MIDDLE THE STENCIL IS DRAWN ABOUT: on the vault, where every
//   stencil is laid flat, the grid's point nearest the place asked; on every other wall the place itself): a stencil is left out when one of sixteen places tried about its middle (on rounds of its
//   reach, its spray counted, and of 0.55 of it) lies more than 0.3 m inside the other ground (between those places an edge may lie deeper: on the average fewer than one hand a seed does, by up to some 1.3 m, nearly all of them suns 40 m and more up on the vault); a plain sun whose middle would
//   stand within another plain sun's own round, or which would hold another's middle, is left out (17 to 24 tries a seed fail by
//   the first and 12 to 21 by the second; a place tried at several sizes fails each time). The fresh hands take only sites that
//   stand on one ground. A STENCIL'S MEASURE ALONG A WALL IS TAKEN INSIDE ITS OWN FACE, never across a corner. Way out: 2 to 3.8 m
//   and 1.2 to 2.2 m, two of 2.4 m on the east jamb, one on each wall of the gallery from the mouth and two on each wall of the
//   last gallery asked at 5 m; above them, from 10 to 17 m up beside the line, hands of 2.1, 1.6 or 1.2 m at the walls' own grid
//   places as the near rule leaves room, and one of 1.2 m at every such place from 1.6 m up that still has no hand within 1.5 m:
//   nothing on the way out's walls stands taller than 4.5 m (the ring is its subject); the Last Wall fourteen suns of 2 to 4.1 m,
//   the greatest at its middle at its lamps' height.
//   NOTHING GREAT IS PASSED CLOSE (a law of place; hand() keeps it, so the sizes above are what is asked, not always what stands):
//   where the rock within 4 m of a hand's place comes nearer than 15 m to the flown line, the hand stands no taller than 0.8 of that
//   least distance (a hand whose fingers end in hands counts with them: 1.45 or 1.6 times its own height). At the mouth (the great column,
//   the mouth's body, the jambs, the first 10 m of the gallery from it) nothing is taller than 2.5 m. NEAR FACES KEEP THEIR HANDS WHOLE: on rock
//   nearer than 14 m to the flown line (and in the whole first gallery) no hand is reached by another stencil's dense band,
//   spatter or run of pigment (halos may meet at their rims); far walls crowd as they will. The Six, the Great Sun, its rings of suns and the Hand of Hands stand further off and keep their sizes;
//   the sun behind the ring is the ring's own rays and keeps its 36 m (its white, 19 m).
//   A HAND TALLER THAN 2 M STANDS IN LIGHT (a law of place; hand() keeps it): where the lamps and the floor of light leave a hand's
//   place under the second tone the hand is laid 2 m tall. Kept at their sizes all the same: the fixed hands, the Last Wall's suns, the
//   suns asked on the vault about the Sun, east of the Sun, over the way in and on the north wall (what stands of them: above), the
//   crown's rings and the ring about the Hand of Hands (suns above the lamps' light, on brown rock or on soot).
//
// export async function buildHero(ctx, opts) -> { object (at the origin, unrotated: the brief's own axes), radius 150, height 64, center,
//   anchors, style, path (makePath of PATH_POINTS), rooms, triangles (the cave's own, mirror counted), countAt,
//   setFlown(metres), update(dt, time, camera), dispose() }
//   opts: palette (the brief's ten hex strings), detail (0.6 to 1: thins small hands and dust, never a named hand), style (a shared
//   makeStyle instance). There are no cords and no option brings them back.
//   DRIVE IT: every frame hero.setFlown(u * hero.path.length) and hero.update(dt, time, camera). update reads TIME ONLY (dt 0 changes
//   nothing, the same time gives the same picture); the fresh hands read the METRES FLOWN only; nothing reads a still; the camera and the lens are read
//   only as the world file's head lists (the pixel's footprint in the shaders; the motes are discs turned to the eye).
//   FRESH HANDS' LAW (for the world file's head): a site abeam at m metres flown: from m-18 to m-14.67 the cloud blooms, to m-11.33 it
//   hangs and the halo comes whole under it (one alpha for the whole stencil), to m-8 the cloud thins; then the hand stays.
//   anchors: portalSeat { position (125.8, 7, 121.3), facing (-0.866, 0, 0.5), radius 7 }; flyThrough (the path's 32 points); gaze (GAZE, by
//   metres flown); entry; firstSix, greatSun, handOfHands, lastWall (centres); lamps [{ p, reach, size, sway [x, z], period, phase, stand }]
//   (80 of them; a lamp's LIGHT stands at p + sway * sin(2 pi time / period + phase): at most 0.25 m from p; its bowl stands at p);
//   stands [{ p, kind: shelf | ledge | stalagmite | islet }]; bigHands [{ p, n, tall, N, wrong, level, room }] (hands of 1.7 m and more);
//   allHands (x, y, z, tall, N of every hand laid by hand(), five numbers each; its place, like p in bigHands, is the point its stencil is drawn about); rounds (its true middle, own round, reach, face's normal, ground, kind: ten numbers each);
//   leftOut (what the ground rule, 1, and the sun rule, 2, left out: place, rule, whether the place was its own); tally (how many stand of each group laid by name);
//   drips; plan (PLAN: the clear spaces); fresh [{ m, p, n, tall, color, room, count }]; hands (how many stencils).
//   CLEAR AIR: rock is pushed OUTWARD from the plan's surfaces only (0 to amp: gallery 1.0, passage 0.3, columns 1.4, hall 1.3, way out
//   0.9 m and less); walls lean in toward their tops (0.01 to 0.10 m at the eye's height). The turn's inner corner at the gallery's
//   opening is cut back: the line keeps 2.4 m there and 2.4 m under the head of rock over the passage's far end, its least from any rock. THE LAMPS' STANDS ARE ROCK INSIDE THE PLAN'S CLEAR
//   SPACES (ten stalagmites in the columns' water; in the lake six islets and fourteen tall stalagmites along the foot of the Sun's
//   wall; ledges 0.9 m out of the walls): every lamp keeps 5 m and more from the line at every sway, every column 5 m (the
//   column the brief puts at (52, 108) stands at (53.5, 108): at the brief's place its rock came too near); a stand is moved off the
//   line and off the columns if the plan's place is nearer. The lamps' dust keeps 2.5 m, a fresh hand's cloud 3.6 m, the Sun's
//   run 8.2 m.
//   THE HALL'S TWO DOORWAYS (the way in from the arch, the mouth) are each ONE BODY OF ROCK (rockFace): a swelling of the hall's own
//   wall round the doorway, 2.2 m and more proud at its nose, rising from behind the vault's sheet and turning in at a rim. THE
//   MOUTH'S rim is two jambs that lean together into a rough arch (12.6 m across, 16.5 m high), its reveal running back in
//   soot and ending inside the walls and roof behind it. THE WAY IN'S rim has the arch's own outline and leaves the plan's opening
//   clear (14 m broad at the water, 16 m high at its corners, a little more at the middle): the arch's two faces and its roof
//   stand 0.6 m and 0.7 m outside the plan's lines and end inside the rim (nothing of the arch's room passes the rim's skin), so
//   the faces one flies between are the arch's own, in the lamps' tones, with their fans. THE VAULT'S OWN SHEET ENDS SHORT OF BOTH:
//   every cell of the vault with a corner nearer the way in's outline than the cell's own breadth is left out (the cells that stay
//   keep 3 m from the outline: none stands in the arch's room or in the opening), and the rim, broader there by as much as the
//   open cells reach (3 m to 5.75 m), closes what that opens: its skin meets the vault 0.9 m and more beyond the last open cell.
//   THE GREAT COLUMN (PLAN.pier; not in the brief; the ring's law asks it): one round column of rock in the lake at the mouth's west
//   side, from the water to the vault: a drum 9.5 m across to 11 m up (as broad as the ring's law asks), a shaft of under 6 m from
//   17.5 m leaning a little west (clear of the Hand of Hands), flared at foot and head. It hides
//   the last gallery from the hall's way in: no place of the line before 360 m flown sees the ring. It carries suns by its
//   place's count, none taller than 2.5 m; it stands in the third tone all round, a tone under the wall beside the doorway.
//   THE SHELL IS WHOLE (no sight line from the flown line leaves the cave, straight or by the water): a rib of rock stands behind each seam of the wall
//   over either opening of the passage with the wall beside it, and a head of rock closes each of those walls down to the passage's
//   vault; a slim post leaning with the arch's face stands at each jamb of the arch and a round one in the corner where the Last Wall meets the last gallery's wall; the
//   walls of the way out stand a metre above its roofs, risers close the step between the two roofs on its east and north sides;
//   the hall's two doorways are bodies of rock whose edges lie 0.5 m and more inside the vault, the walls and the roofs they
//   meet, and the arch's own faces and roof end 0.5 m and more inside the way in's rim: nothing of the arch's room passes the
//   hall's wall but inside that body; a stone closes the vault's crown; the passage's ledges run out to nothing at their ends.
//   THE LAMPS BY ROOM: gallery 11 shelves (two by the First Six, two over the passage's opening); passage 9 on the ledges; columns
//   10 stalagmites and 5 shelves; arch 2 shelves; hall THE GREAT SUN'S OWN ROW of 14 great lamps on tall stalagmites in the lake
//   along the foot of its wall (the hall is lit from below: the far wall's foot is the brightest thing in it), 6 islets,
//   7 shelves at 5 to 27 m round the wall away from the Sun (nothing lights the crown: the vault darkens
//   toward it), THE HAND OF HANDS' OWN FOUR about it; way out 6 shelves (three in the mouth's throat), two on the Last Wall and
//   two on the end wall over the ring's seat; THE DOORWAY'S OWN TWO inside its reveal, one at each jamb's foot on a low shelf of
//   the reveal's inner turn, 1 m over the water (flames of 0.56 m; they take the seed's turns of a stalagmite before the great
//   column and a shelf east of the doorway, which are not set: nothing stands between the eye and the doorway but the column).
//   80 in all. REACHES (metres; a lamp's near pool is 0.65 of it): gallery 7.5, by the
//   Six 4.6, over the passage's opening 4; passage 5.2; columns 10 and 13 (stalagmites), 9 (shelves); arch 7.5; the Sun's row 10.5;
//   islets 8; the hall's shelves 9 to 14; the Hand of Hands' 9.5 (the two under it) and 12; the doorway's two 8.5; the throat 7.5; the Last Wall 6.5; the
//   last gallery 12.5; the end wall 11.
//
// export function makeStyle(ctx, opts) -> { palette { near, lit, half, deep, red, yellow, black, white, flame, water } (linear Colors),
//   uniforms { uLamp[80], uSway[80], uTime, uFlown, uTone[4], uSoot[4] } (ONE set shared by every material; all 80 places hold a lamp),
//   rock, stencil, stencilPP (hands on hands), lamps, setLamps(list), lampPlace(i, time), lawOfLight(p, n, time) (the same sum the
//   shaders hold), toneAt(sum) (before the form and the grain), countAt, handGLSL, lightGLSL, toneGLSL, toneThresholds, toneMul,
//   setFlown(m), update(dt, time) }.
// export function handDistance(px, py, N, seed, wr, level) -> the hand's signed distance in the hand's own units (height 1, the wrist
//   at the origin, fingers up): THE JAVASCRIPT TWIN of the shader's handA / handB / handC, line for line, in float32 where the shader's
//   hash needs it (seeds are multiples of 1/8 so both hash alike). wr: 1 fork + 2 join + 4 bend + 8 spread + 64 an arm down from a
//   sun's palm (the stencil's shader reads 16, 32, 128, 256, 512 and 1024 besides: hands on hands, a field of spray, runs allowed, the under-field red or black, on rock of any tone); level 0, 1, 2.
//   Geometry helpers (exports): makeBatch, wallPatch, ceilPatch, columnPatch, domePatch, standPatch, shelfPatch, makePatch, stamp,
//   batchMeshes, makeWater, makeLamps, makePuffs, makeDust. To add rock: a patch into a batch (it bakes its own form), hands with
//   stamp(), then batchMeshes(batch, style, name). A material of the style needs the attribute aForm (0 where there is none).
//
// COST: under 220,000 triangles and 56 calls in any view, the mirror counted (the heaviest views are from the hall toward the mouth,
//   where every room stands in the picture; the cave's own geometry about 150,000 with the mirror, the lamps 13,400, the dust
//   6,900, the world's rare fall 5,600); some 960 to 1,010 stencils of hands a seed. The build is cut by yields into steps of some 20 ms (in the first build of a cold run a step may take some 32 ms). No texture, no
//   render target, no light, nothing made in update.
// POST ASSUMED: flat 1, bloom 0, grade neutral (the colour written is the colour shown; nothing exceeds 1), scene.background the deep
//   tone #3A2116, fov 62, style 'none'. Under another world's tone map (through its portal) the palette is the same stuffs a little greyer.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';

// ---------------------------------------------------------------- the plan (the brief's figures; x east, y up, z south; water at y 0)
export const PALETTE = ['#F2DFB4', '#D9B77E', '#9A673E', '#3A2116', '#B8381C', '#E3A63A', '#1B1412', '#F5ECD8', '#FFD88A', '#0D0807'];
const DIR = [0.866, -0.5], C0 = [86, 144.3];
export const PATH_POINTS = [[0, 2.4, 0], [14, 2.4, 0], [28, 2.4, 0.5], [37, 2.3, 3], [43, 2.2, 8.5], [45.5, 2.2, 17], [46, 2.2, 30], [46, 2.2, 48], [46, 2.4, 62], [43, 3, 80], [49, 3.5, 98], [44, 3.5, 116], [46, 3, 134], [46, 3, 152], [48, 5, 170], [50, 9, 190], [51, 13, 206], [53, 17, 219], [58, 19.5, 229], [66, 20, 233], [74, 19, 229], [79, 16.5, 218], [80, 13, 203], [80, 10, 187], [80, 8, 173], [80, 7.2, 163], [80.3, 7, 156], [82.5, 7, 149.5], [86, 7, 144.3], [96.4, 7, 138.3], [110.2, 7, 130.3], [125.8, 7, 121.3]];
export const GAZE = [   // by metres flown: from, to, weight, and either a target (at: a point) or a look (arc: [metre, bearing east of north, up] in degrees, eased from one to the next); in the passage the eye looks along its own way
  { from: 8, to: 52, weight: 0.8, at: [56, 5.8, 0.3] },
  { from: 196, to: 228, weight: 0.7, at: [52, 30, 247], rise: 12 },   // the Great Sun
  // from the Sun round by the east, level across the lake, onto the Hand of Hands over the doorway: the look sinks from the Sun's to a few degrees up and stays there
  { from: 226, to: 290, weight: 0.96, rise: 8, arc: [[228, 178, 20], [234, 152, 14], [240, 116, 10], [246, 80, 8], [252, 50, 7], [258, 30, 6.5], [264, 22, 6.5], [270, 17, 7], [276, 13, 8], [282, 11, 3], [290, 6, 2]] },
  { from: 276, to: 302, weight: 0.75, at: [80, 23, 162], rise: 12 },   // the Hand of Hands
  { from: 298, to: 348, weight: 0.92, at: [80, 8.25, 170], rise: 10 },   // the doorway under it, square on: the middle of its opening (9 degrees down at 315 m flown, 6 at 336 m), so its jambs stand upright in the picture
  { from: 350, to: 440, weight: 0.65, at: [125.8, 7, 121.3], rise: 10 }];   // toward the ring's seat, eased in over 10 m (rise), to the end
export const PLAN = {   // the clear spaces: the rock's rough form is pushed OUTWARD from them; walls lean in toward their tops, and the ledges, the pier and the lamps' stands are rock inside them
  gallery: { x0: -20, x1: 56, z0: -6, z1: 6, h: 16 }, opening: { x0: 36, x1: 51.6 },
  passage: { x0: 41, x1: 51, z0: 6, z1: 66, h: 5.2, ledge: 0.7 },
  columns: { x0: 24, x1: 68, z0: 66, z1: 140, h: 18, list: [[36, 78, 1.4], [53, 76, 1.1], [56, 90, 1.8], [38, 94, 1.3], [30, 104, 2.0], [53.5, 108, 1.2], [58, 120, 1.6], [37, 122, 1.5], [33, 134, 1.1], [54, 132, 1.3], [62, 102, 1.0], [28, 86, 1.2]] },
  arch: { x0: 39, x1: 53, z0: 140, z1: 154, h: 16 },
  hall: { c: [52, 0, 204], r: 50, h: 62 }, mouth: { x0: 72, x1: 88, h: 20 }, pier: { c: [71, 165.95, 4.75, 34] },   // the pier: a great round column (x, z of its foot, radius of its lower drum, height)
  out1: { x0: 72, x1: 88, z0: 139, z1: 166, h: 20 }, out2: { from: C0, dir: DIR, half: 8, len: 50, h: 18 },
  firstSix: { c: [56, 5.8, 0.3], tall: 7 }, greatSun: { c: [52, 30, 247], across: 30 }, handOfHands: { c: [80, 29.5, 166], tall: 20 }, lastWall: { c: [80, 9, 139], w: 13, h: 14 },
  portalSeat: { position: [125.8, 7, 121.3], facing: [-0.866, 0, 0.5], radius: 7 },
};
const NL = 80;                         // lamps in the law of light (unused ones stand far away)
export const TONE_T = [0.55, 0.38, 0.18];   // the light at a place: near above .55, lit above .38, half above .18, deep below (one lamp alone: 0.65, 0.83, 1.11 of its reach)
// THE FLOOR OF LIGHT HAS NO SOURCE: a least light given by place alone, which follows no lamp's sway, breath or reach and no clock: the
// rock is never darker than this, and a lamp's pool shows only where it is brighter. FL2 lies in the second tone, FL3 in the third; no floor reaches the top tone:
// the east wall's pool (below) is the ONE light given by place that does.
const FL2 = (TONE_T[0] + TONE_T[1]) / 2, FL3 = (TONE_T[1] + TONE_T[2]) / 2, HALL_LIT = 15, HALL_HALF = 37, SUN_FLOOR = 30, COL_HALF = 24;
const SUN_ROUND = 34;   // the Great Sun's own round, by the floor's measure: no soot within it; it holds the Sun's two rings of suns with their spray
// THE EAST WALL'S POOL: all rock within EAST_R of the place by the plan of the lamp on the hall's wall east of the doorway stands in ONE
// tone, the top one. The pool is GIVEN BY PLACE ALONE (no lamp, no clock): that lamp gives the top tone to 9.1 m only (0.65 of its reach of
// 14 m) and the pool reaches 13 m, so beyond the lamp's own reach IT HAS NO SOURCE; there the wall is calmed too (no form). Its border is
// cut in the picture like the border of the grounds, so it is one round edge and no ring of lesser tones.
const EAST_POOL = [99.6, 15, 194.5], EAST_R = 13;
export const eastPoolAt = (x, y, z) => EAST_R - Math.hypot(x - EAST_POOL[0], y - EAST_POOL[1], z - EAST_POOL[2]);   // metres inside that pool
const sst01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function ambAt(x, y, z) {
  const w = 1.5 * Math.sin(x * 0.11 + z * 0.07) + Math.sin(x * 0.05 - z * 0.13 + 1.7); let f = 0;
  if (z > 157.2 && Math.hypot(x - 52, z - 204) < 50 * Math.sqrt(Math.max(0, 1 - (y / 62) * (y / 62))) + 1.6) {   // THE HALL, lit from below along the Sun's wall: the second tone to HALL_LIT, the third to HALL_HALF, the crown deep; the Sun's own disc and first ring the second
    const south = sst01(196, 214, z + 0.3 * w), dS = Math.hypot(x - 52, y - 30, (z - 247) * 0.5);
    return Math.max(FL2 * (1 - sst01(HALL_LIT - 3, HALL_LIT + 3, y + w)) * south, FL3 * (1 - sst01(-2.34, 3.66, y - crownAt(x, z))), FL2 * (1 - sst01(SUN_FLOOR - 3, SUN_FLOOR + 3, dS)),
      FL2 * (1 - sst01(15, 18, y + 0.5 * w)) * (1 - sst01(17, 20, Math.abs(x - 80))) * (1 - sst01(186, 192, z))); }   // the last: the wall either side of the doorway, 12 m either way of its jambs
  if (x > 70 && z > 139 && z < 172) f = FL3 * (1 - sst01(88, 94, x));   // the mouth's throat: the third tone but for its lamps' pools
  if (z > 139.6 && z < 159.2 && Math.abs(x - 46) > 5.9 && Math.abs(x - 46) < 8.9) f = Math.max(f, (FL3 + (FL2 - FL3) * (1 - sst01(9, 11, y + 0.5 * w))) * sst01(139.6, 142, z));   // the arch's two faces: the second tone as high as their fans
  if (x > 35 && x < 52.5 && z > 6.5 && z < 67) return (FL3 + (FL2 - FL3) * (1 - sst01(2.6, 3.6, y + 0.3 * w))) * sst01(6.5, 9, z);   // the passage: the second tone at the hands' height, the third on the vault
  if (z > 63.5 && z < 141.6 && x > 18 && x < 74) f = Math.max(f, FL3 * (1 - sst01(COL_HALF - 2, COL_HALF + 2, y + w)));   // the columns' room: the third tone to COL_HALF, deep above
  if (x > 55 && z > -8 && z < 8 && y < 18) f = Math.max(f, (FL3 + (FL2 - FL3) * (1 - sst01(10.5, 13, y + 0.5 * w))) * sst01(55, 56, x));   // the Six's wall: the second tone as high as the Six and its fives
  return f;
}
const G = (v) => (Number.isInteger(v) ? v + '.' : String(v));
const AMB_GLSL = /* glsl */`
float amb(vec3 p){
  float x = p.x, y = p.y, z = p.z, w = 1.5 * sin(x * .11 + z * .07) + sin(x * .05 - z * .13 + 1.7), f = 0.;
  if (z > 157.2 && length(vec2(x - 52., z - 204.)) < 50. * sqrt(max(0., 1. - (y / 62.) * (y / 62.))) + 1.6) {
    float south = smoothstep(196., 214., z + .3 * w), dS = length(vec3(x - 52., y - 30., (z - 247.) * .5));
    return max(max(${G(FL2)} * (1. - smoothstep(${G(HALL_LIT - 3)}, ${G(HALL_LIT + 3)}, y + w)) * south, ${G(FL3)} * (1. - smoothstep(-2.34, 3.66, y - (${G(HALL_HALF)} + w + 11. * exp(-((x - 80.) / 13.) * ((x - 80.) / 13.)) * (1. - smoothstep(190., 204., z)))))), max(${G(FL2)} * (1. - smoothstep(${G(SUN_FLOOR - 3)}, ${G(SUN_FLOOR + 3)}, dS)),
      ${G(FL2)} * (1. - smoothstep(15., 18., y + .5 * w)) * (1. - smoothstep(17., 20., abs(x - 80.))) * (1. - smoothstep(186., 192., z)))); }
  if (x > 70. && z > 139. && z < 172.) f = ${G(FL3)} * (1. - smoothstep(88., 94., x));
  if (z > 139.6 && z < 159.2 && abs(x - 46.) > 5.9 && abs(x - 46.) < 8.9) f = max(f, (${G(FL3)} + ${G(FL2 - FL3)} * (1. - smoothstep(9., 11., y + .5 * w))) * smoothstep(139.6, 142., z));
  if (x > 35. && x < 52.5 && z > 6.5 && z < 67.) return (${G(FL3)} + ${G(FL2 - FL3)} * (1. - smoothstep(2.6, 3.6, y + .3 * w))) * smoothstep(6.5, 9., z);
  if (z > 63.5 && z < 141.6 && x > 18. && x < 74.) f = max(f, ${G(FL3)} * (1. - smoothstep(${G(COL_HALF - 2)}, ${G(COL_HALF + 2)}, y + w)));
  if (x > 55. && z > -8. && z < 8. && y < 18.) f = max(f, (${G(FL3)} + ${G(FL2 - FL3)} * (1. - smoothstep(10.5, 13., y + .5 * w))) * smoothstep(55., 56., x));
  return f;
}`;
// THE TWO GROUNDS, by place alone: pale limestone, and SOOT where the lamps' smoke gathers: everything beyond the doorway from the crest of
// its rim inward (its reveal, the throat, the Last Wall, the last gallery, the end wall) and the hall's crown above crownAt (37 m, uneven
// by place; 48 m over the Hand of Hands, whose field and lamps stay on pale rock; never within the Great Sun's own round, SUN_ROUND by the
// floor's own measure). groundAt and its twin ground in the shader give metres inside the soot (negative outside).
export const SOOT = ['#7A5236', '#56382A', '#38241C', '#24160F'];   // the soot family's four flat tones, a lamp's pool first
const wob = (x, z) => 1.5 * Math.sin(x * 0.11 + z * 0.07) + Math.sin(x * 0.05 - z * 0.13 + 1.7);
const crownAt = (x, z) => HALL_HALF + wob(x, z) + 11 * Math.exp(-(((x - 80) / 13) ** 2)) * (1 - sst01(190, 204, z));
export function groundAt(x, y, z) {
  const dx = x - 80, dy = y - 4, g = Math.hypot(dx / 7.5, dy / 13.7), md = dy <= 0 ? Math.abs(dx) - 7.5 : (g - 1) * Math.hypot(dx, dy) / Math.max(g, 1e-6);
  const rad = Math.hypot(x - 52, z - 204) - 50 * Math.sqrt(Math.max(0.04, 1 - (Math.max(0, y) / 62) ** 2));   // metres outside the hall's own round at this height: measured from the hall's upright axis, so it is the same on every flank of the vault
  const out = Math.min(rad - (-3 + 5.2 * sst01(0.1, 0.6, md)), x - 70.6, 190 - z);   // beyond the doorway: inside its outline (and to the crest of its rim, 0.1 to 0.6 m outside it) all rock from 3 m inside the hall's round outward; elsewhere only rock 2.2 m and more outside that round (the vault's own rock is pushed out 1.3 m at most); east of x 70.6 and north of z 190 only
  const crown = Math.min(y - crownAt(x, z), Math.hypot(x - 52, y - 30, (z - 247) * 0.5) - SUN_ROUND);   // the crown: above its height and outside the Great Sun's own lit round
  return [Math.max(out, crown), out, crown];   // metres inside the soot; inside the doorway's soot; inside the crown's
}
const GROUND_GLSL = /* glsl */`
float ground(vec3 p){
  float x = p.x, y = p.y, z = p.z, w = 1.5 * sin(x * .11 + z * .07) + sin(x * .05 - z * .13 + 1.7);
  float ym = max(0., y) / 62., rad = length(vec2(x - 52., z - 204.)) - 50. * sqrt(max(.04, 1. - ym * ym));
  float dx = x - 80., dy = y - 4., g = length(vec2(dx / 7.5, dy / 13.7)), md = dy <= 0. ? abs(dx) - 7.5 : (g - 1.) * length(vec2(dx, dy)) / max(g, 1e-6);
  float outw = min(min(rad - (-3. + 5.2 * smoothstep(.1, .6, md)), x - 70.6), 190. - z);
  float crown = min(y - (${G(HALL_HALF)} + w + 11. * exp(-(dx / 13.) * (dx / 13.)) * (1. - smoothstep(190., 204., z))), length(vec3(x - 52., y - 30., (z - 247.) * .5)) - ${G(SUN_ROUND)});
  return max(outw, crown);
}`;
export const WATER_TINT = [0.27, 0.20, 0.13];   // the mirror: the cave's LINEAR colour times this (shown: about half as bright, browner)
const TONE_MUL = [0.30, 0.60, 0.86, 1.0];   // what a puff's cloud is multiplied by on rock of each tone (deep, half, lit, near); 0.8 and more tells a stencil its rock is in the two upper tones

// ---------------------------------------------------------------- GLSL: the law of light (vertex), the cut into four tones (fragment)
const LIGHT_VERT = /* glsl */`
uniform vec4 uLamp[${NL}];   // xyz the lamp's place at rest, w its reach in metres
uniform vec4 uSway[${NL}];   // xy the sway (x and z, metres), z its period in seconds, w its phase
uniform float uTime;
varying float vL, vForm; varying vec3 vP;
${AMB_GLSL}
float lampSum(vec3 p, vec3 n){   // the lamps' pools summed, never under the floor of light at the place
  float s = 0.;
  for (int i = 0; i < ${NL}; i++) {
    vec4 L = uLamp[i], S = uSway[i];
    float a = sin(uTime * 6.2832 / max(S.z, 1.) + S.w);
    vec3 d = L.xyz + vec3(S.x, 0., S.y) * a - p;
    float r = max(length(d), 1e-3), q = r / (L.w * (1. + .05 * sin(uTime * 1.3 + S.w * 5.)));
    float pool = exp(-1.4 * q * q);
    s += pool * (.75 + .25 * min(1., abs(dot(n, d)) / r * 1.5));
  }
  return max(s, amb(p));
}`;
const TONE_FRAG = /* glsl */`
varying float vL, vForm; varying vec3 vP;
uniform vec3 uTone[4], uSoot[4];
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
// THE GRAIN: grains of 3 cm and 1.5 cm fixed to the rock by place. Each is FILTERED BY THE PIXEL'S FOOTPRINT fw (metres): whole while
// it covers 2.5 picture elements, gone below 1 (whole to some 4.5 m, gone from 11 m on: never noise).
// Returns x: the grain (0..1, mean .5), y: how much of it is resolved (1 near .. 0 far).
vec2 grain2(vec3 p, float fw){
  float r1 = clamp((.03 / max(fw, 1e-5) - 1.) / 1.5, 0., 1.), r2 = clamp((.015 / max(fw, 1e-5) - 1.) / 1.5, 0., 1.), a = .5, b = .5;
  if (r1 > 0.) a = smoothstep(.15, .85, vn(p / .03));
  if (r2 > 0.) b = smoothstep(.15, .85, vn(p / .015 + 31.7));
  float amp = .7 * r1 + .3 * r2;
  return vec2(.5 + (.7 * r1 * (a - .5) + .3 * r2 * (b - .5)) / max(amp, 1e-3), min(1., amp / .7));
}
// how much of a border's far side shows: x = how far past the border in units of the border's breadth. Resolved grain: a stipple of
// soft dots (the edge of a spray); unresolved: a soft edge of the same breadth.
float cov(float x, vec2 gr){ return mix(clamp(x + .5, 0., 1.), smoothstep(-.12, .12, gr.x - .5 + x), gr.y); }
// A TONE'S BORDER (x: how far past it in half metres): the same stipple where the grain is resolved; where it is not, a crisp edge two
// footprints broad (gK: half a metre over that breadth), never broader than the half metre. gSoot: how much of the place is soot ground.
float gK, gSoot;
float covT(float x, vec2 gr){ return mix(clamp(x * gK + .5, 0., 1.), smoothstep(-.12, .12, gr.x - .5 + x), gr.y); }
${GROUND_GLSL}
// THE CUT INTO FOUR TONES: rgb the rock's tone at this place, a: 1 in the top tone and less below (TONE_MUL). The lamps' sum vL decides the tone; the
// grain moves a border by a quarter of a metre either way at most (B: what the light changes over half a metre) and never decides it.
// vForm (baked in the build: hollows, undersides, the junction of wall and roof) takes the rock one tone down, and so does the wet band at the water.
vec4 faceTone(float t, float pf, float cs){
  float e1 = clamp((t - 1.5) / pf + .5, 0., 1.), e2 = clamp((t - 2.5) / pf + .5, 0., 1.), e3 = clamp((t - 3.5) / pf + .5, 0., 1.);
  return vec4(mix(mix(mix(mix(uTone[0], uSoot[0], cs), mix(uTone[1], uSoot[1], cs), e1), mix(uTone[2], uSoot[2], cs), e2), mix(uTone[3], uSoot[3], cs), e3), mix(mix(mix(1., ${TONE_MUL[2]}, e1), ${TONE_MUL[1]}, e2), ${TONE_MUL[0]}, e3));
}
vec4 toneAt(float fw, vec2 gr){
  float f = max(fw, 1e-5), B = max(.5 * length(vec2(dFdx(vL), dFdy(vL))) / f, 1e-4), Bf = max(.5 * length(vec2(dFdx(vForm), dFdy(vForm))) / f, 1e-3);
  gK = max(1., .25 / f);
  float c0 = covT((vL - ${TONE_T[0]}) / B, gr), c1 = covT((vL - ${TONE_T[1]}) / B, gr), c2 = covT((vL - ${TONE_T[2]}) / B, gr);
  // the east wall's pool: the top tone within its round, by place
  float ce = covT((${G(EAST_R)} - length(vP - vec3(${EAST_POOL.map(G).join(', ')}))) / .5, gr); c0 = max(c0, ce); c1 = max(c1, ce); c2 = max(c2, ce);
  // THE GROUND: pale limestone or soot, by place; the border between them cut like a tone's
  float cs = covT(ground(vP) / .5, gr); gSoot = cs;
  vec3 t0 = mix(uTone[0], uSoot[0], cs), t1 = mix(uTone[1], uSoot[1], cs), t2 = mix(uTone[2], uSoot[2], cs), t3 = mix(uTone[3], uSoot[3], cs);
  // THE WET BAND: the rock stands one tone down from the water up to 0.4 to 0.6 m (uneven by place), its upper border stippled by the grain
  float wl = cov((.5 + .07 * sin(vP.x * .83 + vP.z * 1.31) + .04 * sin(vP.x * 2.1 - vP.z * 1.7) - vP.y) / .12, gr);
  float cf = max(covT((vForm + .3 * (vn(vP / 1.3 + 7.1) - .5) - .5) / Bf, vec2(1. - gr.x, gr.y)), wl);   // the form's border bends by place: never straight for long
  vec3 up = mix(mix(mix(t3, t2, c2), t1, c1), t0, c0), dn = mix(mix(t3, t2, c1), t1, c0);
  float mu = mix(mix(mix(${TONE_MUL[0]}, ${TONE_MUL[1]}, c2), ${TONE_MUL[2]}, c1), 1., c0), md = mix(mix(${TONE_MUL[0]}, ${TONE_MUL[1]}, c1), ${TONE_MUL[2]}, c0);
  vec4 o = vec4(mix(up, dn, cf), mix(mu, md, cf));
  // A FACE OF ONE TONE (aForm -1 near, -2 lit, -3 half, -4 deep: the mouth's planes, given by place in the build): the lamps do not
  // decide there; the border between two such faces lies on their edge. Its wet band stands one tone down like any other rock's.
  if (vForm < -.5) { float pf = max(length(vec2(dFdx(vForm), dFdy(vForm))), 1e-4); o = mix(faceTone(-vForm, pf, cs), faceTone(-vForm + 1., pf, cs), wl); }
  // on soot no stencil is told its rock is pale
  o.a = mix(o.a, min(o.a, .6), cs);
  return o;
}`;

// ---------------------------------------------------------------- GLSL: THE HAND LAW, one distance function of the hand's own coordinates
// p: x right, y up, the wrist at y 0, the longest finger's tip at y 1 (a sun, N >= 24: centre (0, .5), radius .5).
// N: fingers counted WITH the thumb. wr: 1 FORK + 2 JOIN + 4 BEND (which fingers, by the hand's seed). Negative inside the hand.
// FIVE TO NINE is a stencilled hand: a palm taller than broad running into a wrist, N-1 fingers of unequal length rising from the palm's
// upper edge 8.4 to 15.5 degrees apart (the middle longest, the little finger shortest), and ONE THUMB, shorter and thicker, leaving
// the palm's side low down at 58 degrees. From ten the fan opens past the palm's sides (ten to thirteen: on a broad palm with a wrist,
// each finger 0.05 of the height across and more); from twenty-four it is a sun.
// handA is a plain hand; handB ends every finger in a handA (PALMS FROM PALMS); handC ends every finger in a handB.
// handDistance() below is the same law in JavaScript (the hash is linear, fract(n * .618034), so both agree to about 1e-4).
const HAND_HEAD = /* glsl */`
float hh(float n){ return fract(n * .618034); }
// wr carries more than the hand's wrongs: 8 spread (or palms from palms), 16 hands on hands, 32 a field, 64 an arm, 128 a run allowed, 256 and 512 the under-field (red, black), 1024 that field on rock of any tone
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.); return length(pa - ba * h); }
vec2 adir(float a){ return vec2(sin(a), cos(a)); }
float fLen(float i, float nf, float Lm, float seed, float N){
  if (N > 23.5) return Lm;
  float x = 2. * i / max(nf - 1., 1.) - 1.;
  float pr = N < 9.5 ? 1. - .26 * (x + .2) * (x + .2) : 1. - .30 * x * x - .07 * x;
  return Lm * pr * (1. - (N < 9.5 ? .2 : .08) * hh(seed + i * 1.37) * step(6.5, N));
}`;
const handFn = (name, sub) => /* glsl */`
float ${name}(vec2 p, float N, float seed, float wr){
  float s = smoothstep(14., 24., N), sun = step(23.5, N), few = step(N, 9.5), mid = step(9.5, N) * step(N, 13.5);
  float nf = few > .5 ? N - 1. : N, sp = few * step(.5, mod(floor(wr / 8.), 2.)), arm = step(.5, mod(floor(wr / 64.), 2.));   // sp: a hand spread wide (the First Six); arm: a forearm down from a sun's palm
  float pitch = .108 * pow(5.6 / max(nf + .6, 5.6), .35), daF = sp > .5 ? .38 : (nf < 4.5 ? .27 : (nf < 5.5 ? .2269 : .2443 - .0122 * nf));
  float r0 = few > .5 ? (sp > .5 ? .31 : pitch / daF) : mix(.25, .2, s);
  vec2 C = vec2(0., few > .5 ? .5 - r0 : mix(.27, .5, s));
  float Lm = few > .5 ? .5 : 1. - C.y - r0;
  float hf = few > .5 ? .5 * daF * (nf - 1.) : mix(1.13, 2.75, clamp((N - 10.) / 12., 0., 1.));
  float da = sun > .5 ? 6.28319 / nf : 2. * hf / max(nf - 1., 1.), a0 = sun > .5 ? -3.14159 + .5 * da : -hf + .14 * sp;
  float w = few > .5 ? (sp > .5 ? .048 : (nf > 5.5 ? .40 : (nf < 4.5 ? .37 : .44)) * pitch) : (mid > .5 ? .032 : min(.040, .27 * r0 * da));
  float fork = step(.5, mod(wr, 2.)), join = step(.5, mod(floor(wr / 2.), 2.)), bend = step(.5, mod(floor(wr / 4.), 2.));
  float d = length(p - C) - (r0 + .012);
  if (few > .5) {   // palm, the ball of the thumb, wrist, thumb
    float hb = sp > .5 ? .24 : .5 * (nf - 1.) * pitch + w + .012, rc = .62 * hb;
    d = max(d, length(max(abs(p - vec2(0., .27)) - vec2(hb - rc, .25 - rc), 0.)) - rc);
    d = min(d, length(p - vec2(.045 - hb, .17)) - .085);
    d = min(d, sdSeg(p, vec2(0., .12), vec2(0., -.2)) - min(.55 * hb, .125));
    vec2 tu = vec2(-.848, .53), Bt = vec2(.05 - hb, .17), T = Bt + (sp > .5 ? .27 : .29) * tu; d = min(d, sdSeg(p, Bt, T) - (sp > .5 ? .058 : .047));
    ${sub ? `{ float sc = .26; vec2 r = p - T; if (dot(r, r) < sc * sc * 1.7) d = min(d, ${sub}(vec2(tu.y * r.x - tu.x * r.y, dot(tu, r)) / sc + vec2(0., .06), 5., seed + 77., 0.) * sc); }` : ''}
  } else if (N < 13.5) {   // ten to thirteen: a broad palm on a wrist under the fan
    d = min(d, length(max(abs(p - vec2(0., .2)) - vec2(.21, .1), 0.)) - .09);
    d = min(d, sdSeg(p, vec2(0., .1), vec2(0., -.06)) - .125);
  }
  if (arm > .5) d = min(d, sdSeg(p, vec2(0., .42), vec2(0., -.62)) - .0833);
  vec2 q = p - C; float fi = clamp(floor(((dot(q, q) > 1e-10 ? atan(q.x, q.y) : 0.) - a0) / da + .5), 0., nf - 1.);
  for (int k = -2; k <= 2; k++) {
    float i = fi + float(k);
    if (sun > .5) i = mod(i + nf, nf); else if (i < -.5 || i > nf - .5) continue;
    float a = a0 + i * da, len = fLen(i, nf, Lm, seed, N);
    vec2 u = adir(a), B = C + (r0 - .05) * u, K = C + (r0 + .55 * len) * u, T = C + (r0 + len) * u;
    float h1 = hh(seed * 1.31 + i * 2.17 + 3.), h2 = hh(seed * .77 + i * 3.71 + 11.);
    float ip = i + 1. - 2. * mod(i, 2.), jn = join * step(hh(seed + floor(i * .5) * 5.3 + 2.), .6) * step(ip, nf - .5);
    float e = sdSeg(p, B, K), plain = 0.;
    if (jn > .5) { vec2 Tp = C + (r0 + fLen(ip, nf, Lm, seed, N)) * adir(a0 + ip * da); e = min(e, min(sdSeg(p, K, T), sdSeg(p, T, Tp))); }
    else if (fork > .5 && h1 < .55) { float g = clamp(.4 * da * (r0 + .8 * len) / max(.45 * len, 1e-3), .1, .45);
      e = min(e, min(sdSeg(p, K, K + .45 * len * adir(a + g)), sdSeg(p, K, K + .45 * len * adir(a - g)))); if (h2 < .3) e = min(e, sdSeg(p, K, T)); }
    else if (bend > .5 && h1 > .5) { float b = (h2 < .5 ? -1. : 1.) * (1. + hh(seed + i)); e = min(e, sdSeg(p, K, K + .45 * len * adir(a + b))); }
    else { e = min(e, sdSeg(p, K, T)); plain = 1.; }
    float hx = clamp((dot(q, u) - r0) / max(len, 1e-3), 0., 1.);
    d = min(d, e - w * (1. + hx * (few > .5 ? -.14 : (mid > .5 ? -.2 : s * len / r0))));
    ${sub ? `if (plain > .5) { float sc = .8 * len; vec2 r = p - T; if (dot(r, r) < sc * sc * 1.7) d = min(d, ${sub}(vec2(u.y * r.x - u.x * r.y, dot(u, r)) / sc + vec2(0., .06), 5., seed + i * 7.3 + 1., 0.) * sc); }` : ''}
  }
  return d;
}`;
export const HAND_GLSL = HAND_HEAD + handFn('handA', '') + handFn('handB', 'handA') + handFn('handC', 'handB');
// THE SAME LAW IN JAVASCRIPT: handDistance(x, y, N, seed, wr, level) (level 0 handA, 1 handB, 2 handC). Line for line the shader's.
const F32 = Math.fround, fract = (v) => v - Math.floor(v), hhJ = (n) => fract(F32(F32(n) * F32(0.618034)));
const segJ = (px, py, ax, ay, bx, by) => { const bax = bx - ax, bay = by - ay, h = Math.max(0, Math.min(1, ((px - ax) * bax + (py - ay) * bay) / Math.max(bax * bax + bay * bay, 1e-6))); return Math.hypot(px - ax - bax * h, py - ay - bay * h); };
const ssJ = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fLenJ = (i, nf, Lm, seed, N) => { if (N > 23.5) return Lm; const x = 2 * i / Math.max(nf - 1, 1) - 1, pr = N < 9.5 ? 1 - 0.26 * (x + 0.2) * (x + 0.2) : 1 - 0.30 * x * x - 0.07 * x; return Lm * pr * (1 - (N < 9.5 ? 0.2 : 0.08) * hhJ(seed + i * 1.37) * (N >= 6.5 ? 1 : 0)); };
export function handDistance(px, py, N, seed = 1, wr = 0, level = 0) {
  const s = ssJ(14, 24, N), sun = N > 23.5, few = N <= 9.5, mid = N >= 9.5 && N <= 13.5, nf = few ? N - 1 : N, mod = (a, b) => a - b * Math.floor(a / b), sp = few && mod(Math.floor(wr / 8), 2) >= 0.5, arm = mod(Math.floor(wr / 64), 2) >= 0.5;
  const pitch = 0.108 * Math.pow(5.6 / Math.max(nf + 0.6, 5.6), 0.35), daF = sp ? 0.38 : (nf < 4.5 ? 0.27 : (nf < 5.5 ? 0.2269 : 0.2443 - 0.0122 * nf));
  const r0 = few ? (sp ? 0.31 : pitch / daF) : 0.25 + (0.2 - 0.25) * s, Cy = few ? 0.5 - r0 : 0.27 + (0.5 - 0.27) * s, Lm = few ? 0.5 : 1 - Cy - r0;
  const hf = few ? 0.5 * daF * (nf - 1) : 1.13 + (2.75 - 1.13) * Math.max(0, Math.min(1, (N - 10) / 12));
  const da = sun ? 6.28319 / nf : 2 * hf / Math.max(nf - 1, 1), a0 = sun ? -3.14159 + 0.5 * da : -hf + (sp ? 0.14 : 0), w = few ? (sp ? 0.048 : (nf > 5.5 ? 0.40 : (nf < 4.5 ? 0.37 : 0.44)) * pitch) : (mid ? 0.032 : Math.min(0.040, 0.27 * r0 * da));
  const fork = mod(wr, 2) >= 0.5, join = mod(Math.floor(wr / 2), 2) >= 0.5, bend = mod(Math.floor(wr / 4), 2) >= 0.5;
  const subD = (rx, ry, ux, uy, sc, sd) => handDistance((uy * rx - ux * ry) / sc, (ux * rx + uy * ry) / sc + 0.06, 5, sd, 0, level - 1) * sc;
  let d = Math.hypot(px, py - Cy) - (r0 + 0.012);
  if (few) {
    const hb = sp ? 0.24 : 0.5 * (nf - 1) * pitch + w + 0.012, rc = 0.62 * hb;
    d = Math.max(d, Math.hypot(Math.max(Math.abs(px) - (hb - rc), 0), Math.max(Math.abs(py - 0.27) - (0.25 - rc), 0)) - rc);
    d = Math.min(d, Math.hypot(px - (0.045 - hb), py - 0.17) - 0.085);
    d = Math.min(d, segJ(px, py, 0, 0.12, 0, -0.2) - Math.min(0.55 * hb, 0.125));
    const tux = -0.848, tuy = 0.53, tl = sp ? 0.27 : 0.29, bx = 0.05 - hb, by = 0.17, tx = bx + tl * tux, ty = by + tl * tuy; d = Math.min(d, segJ(px, py, bx, by, tx, ty) - (sp ? 0.058 : 0.047));
    if (level > 0) { const sc = 0.26, rx = px - tx, ry = py - ty; if (rx * rx + ry * ry < sc * sc * 1.7) d = Math.min(d, subD(rx, ry, tux, tuy, sc, seed + 77)); }
  } else if (N < 13.5) {
    d = Math.min(d, Math.hypot(Math.max(Math.abs(px) - 0.21, 0), Math.max(Math.abs(py - 0.2) - 0.1, 0)) - 0.09);
    d = Math.min(d, segJ(px, py, 0, 0.1, 0, -0.06) - 0.125);
  }
  if (arm) d = Math.min(d, segJ(px, py, 0, 0.42, 0, -0.62) - 0.0833);
  const qx = px, qy = py - Cy, fi = Math.max(0, Math.min(nf - 1, Math.floor(((qx * qx + qy * qy > 1e-10 ? Math.atan2(qx, qy) : 0) - a0) / da + 0.5)));
  for (let k = -2; k <= 2; k++) {
    let i = fi + k; if (sun) i = mod(i + nf, nf); else if (i < -0.5 || i > nf - 0.5) continue;
    const a = a0 + i * da, len = fLenJ(i, nf, Lm, seed, N), ux = Math.sin(a), uy = Math.cos(a);
    const Bx = (r0 - 0.05) * ux, By = Cy + (r0 - 0.05) * uy, Kx = (r0 + 0.55 * len) * ux, Ky = Cy + (r0 + 0.55 * len) * uy, Tx = (r0 + len) * ux, Ty = Cy + (r0 + len) * uy;
    const h1 = hhJ(seed * 1.31 + i * 2.17 + 3), h2 = hhJ(seed * 0.77 + i * 3.71 + 11), ip = i + 1 - 2 * mod(i, 2), jn = join && hhJ(seed + Math.floor(i * 0.5) * 5.3 + 2) <= 0.6 && ip <= nf - 0.5;
    let e = segJ(px, py, Bx, By, Kx, Ky), plain = false; const tip = (ang) => [Kx + 0.45 * len * Math.sin(ang), Ky + 0.45 * len * Math.cos(ang)];
    if (jn) { const lp = r0 + fLenJ(ip, nf, Lm, seed, N), ap = a0 + ip * da; e = Math.min(e, segJ(px, py, Kx, Ky, Tx, Ty), segJ(px, py, Tx, Ty, lp * Math.sin(ap), Cy + lp * Math.cos(ap))); }
    else if (fork && h1 < 0.55) { const g = Math.max(0.1, Math.min(0.45, 0.4 * da * (r0 + 0.8 * len) / Math.max(0.45 * len, 1e-3))), t1 = tip(a + g), t2 = tip(a - g);
      e = Math.min(e, segJ(px, py, Kx, Ky, t1[0], t1[1]), segJ(px, py, Kx, Ky, t2[0], t2[1])); if (h2 < 0.3) e = Math.min(e, segJ(px, py, Kx, Ky, Tx, Ty)); }
    else if (bend && h1 > 0.5) { const t1 = tip(a + (h2 < 0.5 ? -1 : 1) * (1 + hhJ(seed + i))); e = Math.min(e, segJ(px, py, Kx, Ky, t1[0], t1[1])); }
    else { e = Math.min(e, segJ(px, py, Kx, Ky, Tx, Ty)); plain = true; }
    const hx = Math.max(0, Math.min(1, (qx * ux + qy * uy - r0) / Math.max(len, 1e-3)));
    d = Math.min(d, e - w * (1 + hx * (few ? -0.14 : (mid ? -0.2 : s * len / r0))));
    if (plain && level > 0) { const sc = 0.8 * len, rx = px - Tx, ry = py - Ty; if (rx * rx + ry * ry < sc * sc * 1.7) d = Math.min(d, subD(rx, ry, ux, uy, sc, seed + i * 7.3 + 1)); }
  }
  return d;
}

const ROCK_VERT = LIGHT_VERT + /* glsl */`
attribute float aForm;
void main(){ vP = position; vForm = aForm; vL = lampSum(position, normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const ROCK_FRAG = TONE_FRAG + /* glsl */`
void main(){ float fw = length(fwidth(vP)); vec4 t = toneAt(fw, grain2(vP, fw)); if (vP.y < 0.) discard; gl_FragColor = vec4(t.rgb, 1.); }`;
const STEN_VERT = LIGHT_VERT + /* glsl */`
attribute float aForm; attribute vec3 aUV; attribute vec4 aH, aC; varying vec3 vUV; varying vec4 vH, vC;
void main(){ vUV = aUV; vH = aH; vC = aC; vP = position; vForm = aForm; vL = lampSum(position, normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// THE STENCIL IS SPRAY, NOT BLUR. Bare inside the hand (alpha 0), its edge CRISP at every distance (one picture element). Outside: a
// band DENSE AND EVEN next to the hand (0.09 R of the hand's height, lopsided by the hand's seed), then SPATTER: hard-edged dots whose
// size belongs to the hand (a hand h metres tall: dots on grids of h/50 and h/100, a cell 3 cm to 25 cm, every dot 3 cm to 25 cm across), fewer and smaller
// outward to nothing over at most a quarter of the hand's height and never over 1.5 m. THE PIXEL'S FOOTPRINT filters the dots as it
// filters the rock's grain (a dot is whole at 2.5 picture elements of the footprint's mean breadth, gone at 1: far off the fall is a
// soft edge of the same breadth).
// vUV.z is the hand's height in metres (stamp() gives it). SPRAY_D0, SPRAY_W: the same figures in stamp()'s cull.
const SPRAY_D0 = 0.09, SPRAY_W = 0.25, SPRAY_WM = 1.5, FIELD_R = 0.58, DISC_R = 0.92, PP_R = [1.0, 1.14];
const stenFrag = (fn) => TONE_FRAG + HAND_HEAD + (fn === 'handA' ? handFn('handA', '') : handFn('handA', '') + handFn('handB', 'handA') + handFn('handC', 'handB')) + /* glsl */`
varying vec3 vUV; varying vec4 vH, vC; uniform float uFlown; uniform vec3 uRim[2];
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
// hard dots on a grid of cell c (the hand's own units), each cell's dot there with chance P, larger where P is high. dpx, dpy: what
// one picture element across and one down are in the hand's units: each dot's edge is one element broad whichever way the rock is turned
float gHm;   // the hand's height in metres (main sets it): a dot is clamped to 3 cm .. 25 cm across
float spat(vec2 p, float c, float P, vec2 dpx, vec2 dpy, float sd){
  vec2 g = p / c, i0 = floor(g); float a = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 id = i0 + vec2(float(x), float(y)); float h1 = h21(id + sd), h2 = h21(id * 1.31 + sd + 17.3);
    if (h1 < P) { float lo = .015 / (c * gHm), r = clamp(.26 + .26 * h2 + .3 * P, lo, max(lo, .125 / (c * gHm))); vec2 v = g - id - .5 - .34 * (vec2(h2, fract(h2 * 57.3)) - .5); float l = length(v); vec2 n = v / max(l, 1e-5);
      float ee = max(.5 * length(vec2(dot(dpx, n), dot(dpy, n))) / c, 1e-5); a = max(a, 1. - smoothstep(r - ee, r + ee, l)); }
  }
  return a;
}
void main(){
  vec2 p = vUV.xy; float hm = max(vUV.z, .05); gHm = hm; float N = floor(vH.x + .5), wq = floor(vH.z + .5), seed = vH.y, heavy = step(5., vC.w), R = vC.w - 10. * heavy, field = step(31.5, mod(wq, 64.));
  float rimc = mod(floor(wq / 256.), 4.), rimAll = step(.5, mod(floor(wq / 1024.), 2.));   // the under-field: 1 red, 2 black; rimAll: on rock of any tone
  if (vP.y < 0.) discard;
  float disc = max(heavy, field), la = hh(seed * 3.3) * 6.283; vec2 lo = vec2(cos(la), sin(la));   // the side the spray came from
  vec2 c = p - vec2(0., N > 23.5 ? .5 : .46); float rr = length(c);
  vec2 dpx = dFdx(p), dpy = dFdy(p);
  float fu = max(length(fwidth(p)), 1e-5), fw = length(fwidth(vP)), e = .5 * fu, fa = max(sqrt(abs(dpx.x * dpy.y - dpx.y * dpy.x)), 1e-5);   // fa: the footprint's mean breadth
  vec4 tn = toneAt(fw, grain2(vP, fw));
  float d = field > .5 ? rr - ${FIELD_R} * R : ${fn === 'handA' ? 'handA(p, N, seed, wq)' : '(mod(wq, 32.) > 15.5 ? handC(p, N, seed, 0.) : handB(p, N, seed, 0.))'};
  float skew = disc > .5 ? 1. : 1. + .4 * dot(c, lo) / max(rr, 1e-4);
  float wf = (N < 9.5 && disc < .5) ? smoothstep(-.3, -.03, p.y) : 1.;                 // the wrist runs out of the halo
  float W = min(${SPRAY_W}, ${SPRAY_WM} / hm) * clamp(R, .6, 1.) * (.4 + .43 * skew) * (1. - .7 * field * step(.5, R));   // a field's spatter is a narrow fringe; a small field's (R under .5) is as broad as a hand's
  float dd = field > .5 ? d : d - ${SPRAY_D0} * R * skew * wf; if (heavy > .5) dd = min(dd, rr - ${DISC_R} * R);
  ${fn === 'handA' ? '' : 'dd = max(dd, rr - (mod(wq, 32.) > 15.5 ? ' + PP_R[1].toFixed(2) + ' : ' + PP_R[0].toFixed(2) + ') + W);   // hands on hands: the spray ends inside the stamp\'s own round'}
  // a run of pigment under the hand: a plain column a tenth of a metre broad, at most 2 m long
  float nc = max(22., floor(hm / .11)), cx = floor(p.x * nc), hr = hh(seed + cx * 1.7), rl = min(.2 + .5 * hh(cx + seed * 2.1), 2. / hm), ec = e * nc;
  float run = step(.5, mod(floor(wq / 128.), 2.)) * step(hr, .13) * step(p.y, .3) * step(abs(p.x), .5) * (1. - field) * (1. - smoothstep(.3 - ec, .3 + ec, abs(fract(p.x * nc) - .5))) * (1. - smoothstep(rl - e, rl + e, d));
  // the edges' breadth: half a picture element of the distance itself, so an edge is one element broad on rock seen aslant too
  float ed = max(.5 * length(vec2(dFdx(d), dFdy(d))), 1e-6), edd = max(.5 * length(vec2(dFdx(dd), dFdy(dd))), 1e-6);
  if (dd > W && run < .004) discard;
  // THE UNDER-FIELD (by place: where the rock under the stencil is in the two upper tones; THE HAND OF HANDS: everywhere): a solid field of
  // red or black under the pigment's dense band, showing beyond it as a rim 0.12 of the halo broad and spattering on its outer side
  float rk = step(.5, rimc) * max(rimAll, smoothstep(.7, .8, tn.a)) * (1. - gSoot), rw = max(.12 * (${SPRAY_D0} * R * skew * wf + W), .035 / hm), Wl = mix(W, rw, rimAll);
  float t = clamp(dd / max(Wl, 1e-4), 0., 1.), P = (1. - t) * (1. - t) * (dd > 0. ? wf : 1.) * step(dd, Wl);
  float aD = 1. - smoothstep(-edd, edd, dd), a = aD, D1 = clamp(hm / 50., .03, .25) / hm, r1 = clamp((D1 / fa - 1.) / 1.5, 0., 1.);
  if (a < .996 && P > .002 && dd > -edd) {
    float D2 = clamp(hm / 100., .03, .25) / hm, P2 = .8 * P, r2 = clamp((D2 / fa - 1.) / 1.5, 0., 1.);
    float a1 = P * (.38 + .4 * P), a2 = P2 * (.38 + .4 * P2);
    if (r1 > 0.) a1 = mix(a1, spat(p, D1, P, dpx, dpy, seed), r1);
    if (r2 > 0.) a2 = mix(a2, spat(p + 7.7, D2, P2, dpx, dpy, seed + 3.1), r2);
    a = max(a, 1. - (1. - a1) * (1. - a2));
  }
  a = max(a, run * .9);
  float ar = 0.;
  if (rk > .004) {
    float tr = clamp((dd - rw) / max(W - rw, 1e-4), 0., 1.), Pr = (1. - tr) * (1. - tr) * (dd > 0. ? wf : 1.) * step(dd, W);
    ar = 1. - smoothstep(-edd, edd, dd - rw);
    if (ar < .996 && Pr > .002) { float a1 = Pr * (.38 + .4 * Pr); if (r1 > 0.) a1 = mix(a1, spat(p + 3.3, D1, Pr, dpx, dpy, seed + 5.7), r1); ar = max(ar, a1); }
    ar *= rk;
  }
  float edge = field > .5 ? 1. : smoothstep(-ed, ed, d);                              // the hand's own edge: crisp at every distance
  float born = vH.w, fresh = step(-500., born);
  edge *= mix(1., smoothstep(born - 14.67, born - 11.33, uFlown), fresh);        // a fresh hand comes whole, by the metres flown alone
  // from the top down: the pigment's dense band, the under-field's rim and spatter, the pigment's own spatter
  float aL = (aD + a * (1. - aD) * (1. - ar)) * edge, aR = ar * (1. - aD) * edge;
  if (aL + aR < .004) discard;
  // PIGMENT AT FULL STRENGTH: the pigment's own colour, never multiplied by the rock's tone
  gl_FragColor = vec4((vC.rgb * aL + (rimc > 1.5 ? uRim[1] : uRim[0]) * aR) / (aL + aR) * (1. - .2 * fresh), aL + aR);
}`;

// ---------------------------------------------------------------- THE COUNT BY PLACE: a function of where a hand stands, never of the seed
const fr = (v) => v - Math.floor(v), ph = (x, y, z) => fr(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453);
// THE MEASURE: a surface belongs to the stretch of the flown line that passes nearest to it in the room it stands in; along that
// order the count of plain hands never falls but at the one seam beside the Last Wall (the head). lineNear(x, y, z, from, to): the metre flown at that stretch (the line sampled every
// half metre, searched between two metres). LM: the metres at which the line passes from room to room and at which a count changes
// (the passage's 7, the columns' 8 and 9), and the Great Sun's own metre: it counts at its centre's stretch.
let LINE = null; const LM = {};
function lineInit() {
  const pa = makePath(PATH_POINTS), n = Math.round(pa.length * 2); LINE = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) { const q = pa.posAtDist(Math.min(pa.length, i * 0.5)); LINE[i * 3] = q.x; LINE[i * 3 + 1] = q.y; LINE[i * 3 + 2] = q.z; }
  const atZ = (z) => { for (let i = 0; i <= n; i++) if (LINE[i * 3 + 2] >= z) return i * 0.5; return n * 0.5; };
  LM.end = n * 0.5; LM.gallery = atZ(7); LM.seven = atZ(36.5); LM.passage = atZ(66); LM.eight = atZ(90.7); LM.nine = atZ(115.4); LM.columns = atZ(140); LM.arch = atZ(154);
  for (let i = Math.round(LM.arch * 2) + 200; i <= n; i++) if (LINE[i * 3 + 2] <= 171) { LM.hall = i * 0.5; break; }   // the way back reaches the mouth
  const c = PLAN.greatSun.c; LM.sun = lineNear(c[0], c[1], c[2], LM.arch, LM.hall);
  LM.bend0 = 1e9; LM.bend1 = 0;   // the stretch the Last Wall belongs to, from its first metre to its last
  for (let x = 70; x <= 88; x += 0.5) for (let y = 0; y <= 21; y += 1) for (const z of [137.5, 139, 140.8]) { const m = lineNear(x, y, z, LM.hall, LM.end); LM.bend0 = Math.min(LM.bend0, m); LM.bend1 = Math.max(LM.bend1, m); }
}
export function lineNear(x, y, z, from = 0, to = 1e9) {
  if (!LINE) lineInit();
  let best = 1e18, bi = 0; const i1 = Math.min(LINE.length / 3 - 1, Math.round(to * 2));
  for (let i = Math.max(0, Math.round(from * 2)); i <= i1; i++) { const k = i * 3, dx = LINE[k] - x, dy = LINE[k + 1] - y, dz = LINE[k + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) { best = d; bi = i; } }
  return bi * 0.5;
}
export function lineMetres() { if (!LINE) lineInit(); return LM; }
export function countAt(x, y, z) {   // -> { room, N (fingers with the thumb), wrong (1 fork + 2 join + 4 bend), level (0 hand, 1 palms from palms, 2 hand of hands) }
  const h = ph(Math.round(x * 2), Math.round(y * 2), Math.round(z * 2)), H = PLAN.hall; if (!LINE) lineInit();
  if (z < 7 && x <= 57) return { room: 'gallery', N: 5, wrong: 0, level: 0 };
  if (z < 66) return { room: 'passage', N: lineNear(x, y, z, LM.gallery, LM.passage) < LM.seven ? 6 : 7, wrong: 0, level: 0 };
  if (z < 140 && x < 70) { const m = lineNear(x, y, z, LM.passage, LM.columns); return { room: 'columns', N: m < LM.eight ? 7 : m < LM.nine ? 8 : 9, wrong: z > 103 && h < 1 / 3 ? 1 : 0, level: 0 }; }
  if (Math.hypot(x - PLAN.pier.c[0], z - PLAN.pier.c[1]) < 7.5 && y < 34) return { room: 'pier', N: 48, wrong: 0, level: 0 };   // the great column at the mouth and the hall's rock about it
  const za = H.c[2] - Math.sqrt(Math.max(100, H.r * H.r * (1 - (Math.max(0, y) / H.h) ** 2) - (x - H.c[0]) ** 2));   // the vault's plan surface at x, y: the hall's own rock stands at it, the way out lies behind it
  if (x < 70 && ((z < 154 && z < za - 1.6) || (z < 157.6 && Math.abs(x - 46) < 8.2 && y < 17.5))) return { room: 'arch', N: 10 + Math.min(3, Math.max(0, Math.floor((z - 140) / 3.5))), wrong: h < 0.5 ? 2 : 4, level: 0 };   // the arch's own room only (the rock behind the hall's wall north of z 154, and its faces and the rim's inner turn as far as they run, to z 157.6; the hall's wall beside it is the north wall's); the line runs along z here: by z is by the line
  // AFTER THE GREAT SUN'S 48 NOTHING ON THE WAY IS FEWER, in the order of the line: the hall after the Sun 48, the north wall 48, the
  // pier 48; the way out by the line's metre alone, so both walls are alike: 52 from the mouth to the Last Wall's stretch, 56 in that
  // stretch (the whole Last Wall and the walls beside it at the bend), 60 after it (the sun behind the ring is 64); the hands that
  // are wrong in kind (palms from palms, hands of hands) stand among them as fives
  if (x > 70 && x < 88 && z < 140.8) return { room: 'last wall', N: 56, wrong: 0, level: 0 };
  if (z < za - 0.4 && ((x > 70 && z < 168 && (z < 162 || y < 21)) || (x > 73.5 && x < 90 && z < 170.5 && y < 21))) { const mo = lineNear(x, y, z, LM.hall, LM.end);
    return { room: 'wayout', N: h < 0.5 ? (mo < LM.bend0 ? 52 : mo <= LM.bend1 ? 56 : 60) : 5, wrong: 0, level: h < 0.5 ? 0 : 2 }; }
  const m = lineNear(x, y, z, LM.arch, LM.hall), north = z < H.c[2] - 22;
  if (m > LM.sun || north) {   // the hall after the Sun: every surface whose nearest stretch of the line comes after the Sun's own; and THE NORTH WALL, ALL OF IT (the hall's side at any x and any height, over the way in too) whatever its stretch (the one exception to the measure: it stands behind the eye on the way in and is seen on the way back)
    if (north && h >= 0.45 && Math.abs(x - 46) > 20) return { room: 'north wall', N: 5, wrong: 0, level: 1 };   // beside the arch (20 m either way of its middle) suns only
    return { room: north ? 'north wall' : 'hall after the sun', N: 48, wrong: 0, level: 0 }; }
  // the hall on the way to the Sun: 14 where the line comes in, 40 at the Sun's own stretch, by the line's metre alone (a smooth step)
  const t = Math.max(0, Math.min(1, (m - LM.arch) / (LM.sun - LM.arch)));
  return { room: 'hall', N: Math.round(14 + 26 * t * t * (3 - 2 * t)), wrong: h < 0.2 ? 1 : (h < 0.35 ? 4 : 0), level: 0 };
}

// ---------------------------------------------------------------- THE STYLE: palette, the shared uniforms, the materials, the lamps' law
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE, col = (i) => new THREE.Color(hex[i]);
  const palette = { near: col(0), lit: col(1), half: col(2), deep: col(3), red: col(4), yellow: col(5), black: col(6), white: col(7), flame: col(8), water: col(9) };
  const lampV = [], swayV = [];
  for (let i = 0; i < NL; i++) { lampV.push(new THREE.Vector4(0, -9999, 0, 1)); swayV.push(new THREE.Vector4(0, 0, 6, 0)); }
  const uniforms = {   // ONE set, shared by every material of the world: drive them through update() and setFlown()
    uLamp: { value: lampV }, uSway: { value: swayV }, uTime: { value: 0 }, uFlown: { value: 0 },
    uTone: { value: [palette.near, palette.lit, palette.half, palette.deep] }, uSoot: { value: SOOT.map((h) => new THREE.Color(h)) }, uRim: { value: [palette.red, palette.black] },
  };
  const base = { uniforms, side: THREE.DoubleSide };
  const rock = new THREE.ShaderMaterial({ ...base, vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG });
  const sten = (fn) => new THREE.ShaderMaterial({ ...base, vertexShader: STEN_VERT, fragmentShader: stenFrag(fn), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const stencil = sten('handA'), stencilPP = sten('handC');
  const lamps = [];
  const style = {
    palette, uniforms, rock, stencil, stencilPP, lamps, handGLSL: HAND_GLSL, lightGLSL: LIGHT_VERT, toneGLSL: TONE_FRAG, countAt, toneThresholds: TONE_T, toneMul: TONE_MUL,
    // lamps: [{ p: [x, y, z], reach, sway: [sx, sz], period, phase, hang }] ; 80 places, all set ; set once in the build
    setLamps(list) {
      lamps.length = 0;
      list.slice(0, NL).forEach((l, i) => { lamps.push(l); lampV[i].set(l.p[0], l.p[1], l.p[2], l.reach); swayV[i].set(l.sway[0], l.sway[1], l.period, l.phase); });
    },
    lampPlace(i, time, out = new THREE.Vector3()) { const l = lamps[i], a = Math.sin(time * 6.2832 / l.period + l.phase); return out.set(l.p[0] + l.sway[0] * a, l.p[1], l.p[2] + l.sway[1] * a); },
    // THE LAW OF LIGHT as the shaders hold it: the sum of the lamps' pools at a place p (with the rock's normal n) at a time
    lawOfLight(p, n, time = 0) {
      let s = 0;
      for (const l of lamps) {
        const a = Math.sin(time * 6.2832 / l.period + l.phase), dx = l.p[0] + l.sway[0] * a - p.x, dy = l.p[1] - p.y, dz = l.p[2] + l.sway[1] * a - p.z;
        const r = Math.max(Math.hypot(dx, dy, dz), 1e-3), q = r / (l.reach * (1 + 0.05 * Math.sin(time * 1.3 + l.phase * 5))), pool = Math.exp(-1.4 * q * q);
        s += pool * (n ? 0.75 + 0.25 * Math.min(1, Math.abs(n.x * dx + n.y * dy + n.z * dz) / r * 1.5) : 1);
      }
      return Math.max(s, ambAt(p.x, p.y, p.z), eastPoolAt(p.x, p.y, p.z) > 0 ? TONE_T[0] + 0.05 : 0);   // never under the floor of light; the top tone within the east wall's pool
    },
    toneAt(sum) { return sum > TONE_T[0] ? 3 : sum > TONE_T[1] ? 2 : sum > TONE_T[2] ? 1 : 0; },   // 3 near, 2 lit, 1 half, 0 deep (before the grain)
    setFlown(m) { uniforms.uFlown.value = m; },
    update(dt, time) { uniforms.uTime.value = time; },   // time only: dt 0 changes nothing
  };
  return style;
}

// ---------------------------------------------------------------- geometry: rock as grid patches, stencils as the rock's own cells drawn again
const mkS = () => ({ P: [], Nn: [], F: [], UV: [], H: [], C: [], I: [] });
export const makeBatch = () => ({ P: [], Nn: [], F: [], I: [], s: mkS(), pp: mkS(), patches: [] });
function gridNormals(P, Nn, nu, nv, sg, wrap) {   // wrap: the first and the last column are one place (a column, the dome): one normal, no seam
  const W = wrap ? nu - 1 : 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = ((W ? (i + 1) % W : Math.min(nu - 1, i + 1)) + j * nu) * 3, b = ((W ? (i - 1 + W) % W : Math.max(0, i - 1)) + j * nu) * 3, c = (i + Math.min(nv - 1, j + 1) * nu) * 3, d = (i + Math.max(0, j - 1) * nu) * 3;
    const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = sg / Math.max(1e-9, Math.hypot(nx, ny, nz));
    const k = (i + j * nu) * 3; Nn[k] = nx * l; Nn[k + 1] = ny * l; Nn[k + 2] = nz * l;
  }
}
// makePatch(B, nu, nv, fn, o): fn(i, j, out) gives the base point (the plan's clear surface); the rock is pushed OUTWARD from it (never
// into the clear space) by lobes and scallops of noise. o: sg (sign that turns the grid's normal outward), amp (metres, or a function of
// the place), skip(x, y, z) -> true leaves a cell out (a doorway), noise (ctx.noise). Returns the patch (for stamp()).
const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function makePatch(B, nu, nv, fn, o) {
  const n = nu * nv, P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), F = new Float32Array(n), out = [0, 0, 0], nz3 = o.noise;
  for (let j = 0, k = 0; j < nv; j++) for (let i = 0; i < nu; i++, k += 3) { fn(i, j, out); P[k] = out[0]; P[k + 1] = out[1]; P[k + 2] = out[2]; }
  gridNormals(P, Nn, nu, nv, o.sg || 1, o.wrap);
  for (let k = 0; k < n * 3; k += 3) {
    const x = P[k], y = P[k + 1], z = P[k + 2], a = typeof o.amp === 'function' ? o.amp(x, y, z) : (o.amp ?? 0.6);
    const d = a * (0.72 * (0.5 + 0.5 * nz3.n3(x / 5.5, y / 5.5, z / 5.5)) + 0.28 * (0.5 + 0.5 * nz3.n3(x / 1.7 + 9, y / 1.7, z / 1.7)));
    P[k] += Nn[k] * d; P[k + 1] += Nn[k + 1] * d; P[k + 2] += Nn[k + 2] * d; F[k / 3] = a > 0.05 ? d / a : 0;
  }
  if (o.wrap) for (let j = 0; j < nv; j++) { const a = j * nu * 3, b = (nu - 1 + j * nu) * 3; P[b] = P[a]; P[b + 1] = P[a + 1]; P[b + 2] = P[a + 2]; F[nu - 1 + j * nu] = F[j * nu]; }   // watertight at the seam
  gridNormals(P, Nn, nu, nv, o.sg || 1, o.wrap);
  // THE ROCK'S FORM, baked by place (0 .. 1; above .5 the rock stands one tone down): hollows (where the rock lies deepest behind the
  // plan's surface), undersides (o.under [lo, hi] on the upward part of the rock's own normal; false: none), and what the caller names
  // by grid place (o.form(i, j): the junction of wall and roof).
  const un = o.under === false ? null : (o.under || [0.3, 0.55]), hol = o.hollow || [0.7, 0.84];
  // NO SMALL ISLAND OF A LOWER TONE: the hollows and undersides are first cut by vertex, then only blocks of them 4 m and more
  // across are kept (a vertex stays down if it lies in a block of down vertices that broad both ways), then the field is smoothed
  // over its neighbours; the shader bends the border and stipples it. What the caller names (the junction) is laid over it whole.
  { const nw = o.wrap ? nu - 1 : nu, dn = new Uint8Array(n), keep = new Uint8Array(n), ix = (i) => o.wrap ? ((i % nw) + nw) % nw : i;
    let du = 0, dv = 0, cu = 0, cv = 0;
    for (let j = 0; j < nv; j += 3) for (let i = 0; i + 1 < nu; i += 3) { const a = (i + j * nu) * 3; du += Math.hypot(P[a + 3] - P[a], P[a + 4] - P[a + 1], P[a + 5] - P[a + 2]); cu++; }
    for (let j = 0; j + 1 < nv; j += 3) for (let i = 0; i < nu; i += 3) { const a = (i + j * nu) * 3, b = a + nu * 3; dv += Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]); cv++; }
    const Ki = Math.max(2, Math.min(nw, Math.round(4 / Math.max(du / Math.max(cu, 1), 0.05)))), Kj = Math.max(2, Math.min(nv, Math.round(4 / Math.max(dv / Math.max(cv, 1), 0.05))));
    for (let k = 0; k < n; k++) { let f = sst(hol[0], hol[1], F[k]); if (un) f = Math.max(f, sst(un[0], un[1], Nn[k * 3 + 1])); dn[k] = f > 0.5 ? 1 : 0; }
    for (let j = 0; j + Kj <= nv; j++) for (let i = 0; i < (o.wrap ? nw : nu - Ki + 1); i++) { let all = 1;
      for (let b = 0; b < Kj && all; b++) for (let a = 0; a < Ki; a++) if (!dn[ix(i + a) + (j + b) * nu]) { all = 0; break; }
      if (all) for (let b = 0; b < Kj; b++) for (let a = 0; a < Ki; a++) keep[ix(i + a) + (j + b) * nu] = 1; }
    if (o.wrap) for (let j = 0; j < nv; j++) keep[nu - 1 + j * nu] = keep[j * nu];
    for (let j = 0, k = 0; j < nv; j++) for (let i = 0; i < nu; i++, k++) { let sm = 0, c = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const jj = j + b, ii = o.wrap ? ix(i + a) : i + a; if (jj < 0 || jj >= nv || ii < 0 || ii >= nu) continue; sm += keep[ii + jj * nu]; c++; }
      F[k] = sm / c; } }
  for (let j = 0, k = 0; j < nv; j++) for (let i = 0; i < nu; i++, k++) {
    let f = F[k]; if (o.calm) f *= 1 - o.calm(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]);   // a quiet face: no hollow, no underside there (o.calm: 0 .. 1 by place)
    if (o.form) f = Math.max(f, o.form(i, j));
    if (o.tone) { const t = o.tone(i, j, P[k * 3], P[k * 3 + 1], P[k * 3 + 2]); if (t >= 0) f = -(1 + t); }   // A FACE OF ONE TONE (0 near .. 3 deep): the lamps do not decide there
    F[k] = f;
  }
  const mask = new Uint8Array((nu - 1) * (nv - 1)), base = B.P.length / 3;
  for (let k = 0; k < n * 3; k++) { B.P.push(P[k]); B.Nn.push(Nn[k]); } for (let k = 0; k < n; k++) B.F.push(F[k]);
  for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
    const a = i + j * nu, b = a + 1, c = a + nu, d = c + 1;
    if (o.skip && o.skip((P[a * 3] + P[d * 3]) / 2, (P[a * 3 + 1] + P[d * 3 + 1]) / 2, (P[a * 3 + 2] + P[d * 3 + 2]) / 2)) continue;
    if (o.skipCell && o.skipCell(P, a * 3, b * 3, c * 3, d * 3)) continue;   // by its four corners
    mask[i + j * (nu - 1)] = 1; B.I.push(base + a, base + b, base + c, base + b, base + d, base + c);
  }
  const pt = { nu, nv, P, Nn, F, mask, wrap: !!o.wrap, at(i, j, v) { const k = (Math.round(i) + Math.round(j) * nu) * 3; return v.set(P[k], P[k + 1], P[k + 2]); } };
  B.patches.push(pt); return pt;
}
// a wall along a plan line pts [[x, z], ...] with the ROCK ON THE RIGHT of the direction of travel, from y0 to y1, leaning in toward its top
// o: cell, lean, cove (metres the top leans and curls in), amp, skip, ys (the rows' heights, instead of cell), shelf { y, w } (a ledge w wide below y; it runs out to nothing over the wall's two last cells, so that it has no open end)
export function wallPatch(B, pts, y0, y1, o) {
  const cell = o.cell || 1, line = [], seg = [0], faces = []; let L = 0;
  for (let s = 0; s < pts.length - 1; s++) { const [ax, az] = pts[s], [bx, bz] = pts[s + 1], d = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.round(d / cell));
    for (let k = s && !o.faces ? 1 : 0; k <= m; k++) line.push([ax + (bx - ax) * k / m, az + (bz - az) * k / m]); L += d; seg.push(line.length - 1); faces.push([line.length - 1 - m, line.length - 1]); }
  const nu = line.length, yb = y0 <= 0 ? -0.5 : y0, ys = o.ys, nv = ys ? ys.length : Math.max(2, Math.round((y1 - yb) / cell) + 1), lean = o.lean ?? 0.8, cove = o.cove ?? 1.6, shelf = o.shelf;
  const tan = line.map((p, i) => { const a = line[Math.max(0, i - 1)], b = line[Math.min(nu - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; });
  const pt = makePatch(B, nu, nv, (i, j, out) => {
    const y = ys ? ys[j] : yb + (y1 - yb) * j / (nv - 1), h = (y - yb) / (y1 - yb), e = Math.max(0, (h - 0.7) / 0.3), sh = lean * h * h + cove * e * e + (shelf && y < shelf.y ? shelf.w * Math.min(1, i / 2, (nu - 1 - i) / 2) : 0);
    out[0] = line[i][0] + tan[i][1] * sh; out[1] = y; out[2] = line[i][1] - tan[i][0] * sh;
  }, { form: o.junction === false ? null : (i, j) => sst(0.74, 0.9, ys ? (ys[j] - yb) / (y1 - yb) : j / (nv - 1)), tone: o.faceTone ? (i) => { for (let k = 0; k < faces.length; k++) if (i >= faces[k][0] && i <= faces[k][1]) return o.faceTone[k]; return -1; } : null, ...o, sg: 1 });
  pt.du = L / (nu - 1); pt.yb = yb; pt.dy = (y1 - yb) / (nv - 1); pt.L = L; if (faces.length > 1) pt.faces = faces; return pt;
}
// a ceiling over the plan rectangle from (ox, oz) along A = (ax, az) for la metres and to its right for lb metres, at height yFn(x, z)
export function ceilPatch(B, ox, oz, ax, az, la, lb, yFn, o) {
  const cell = o.cell || 1.5, nu = Math.max(2, Math.round(la / cell) + 1), nv = Math.max(2, Math.round(lb / cell) + 1);
  return makePatch(B, nu, nv, (i, j, out) => {
    const a = la * i / (nu - 1), b = lb * j / (nv - 1); out[0] = ox + ax * a - az * b; out[2] = oz + az * a + ax * b; out[1] = yFn(out[0], out[2]);
  }, { ...o, sg: -1 });
}
// a column from the water to the roof (the rock is INSIDE it): radius r, flaring at foot and head
export function columnPatch(B, x, z, r, h, o) {
  const nu = 13, nv = Math.round(h / 1.3) + 1;
  return makePatch(B, nu, nv, (i, j, out) => {
    const t = j / (nv - 1), y = -0.5 + (h + 1.5) * t, f = Math.abs(2 * t - 1), rr = (r + (o.amp ?? 0.3)) * (1 + 0.9 * f * f * f * f * f * f), a = i / (nu - 1) * Math.PI * 2;
    out[0] = x + rr * Math.cos(a); out[1] = y; out[2] = z + rr * Math.sin(a);
  }, { ...o, sg: 1, wrap: true });
}
// the hall's dome: half an ellipsoid over the lake, i around, j from the water to the crown
export function domePatch(B, cx, cz, R, Hh, o) {
  const nu = (o.around || 120) + 1, nv = (o.up || 34) + 1;
  return makePatch(B, nu, nv, (i, j, out) => {
    const a = i / (nu - 1) * Math.PI * 2, t = j / (nv - 1), f = -0.012 + 1.012 * t, e = Math.PI / 2 * Math.min(1, f) * 0.985;
    out[0] = cx + R * Math.cos(e) * Math.cos(a); out[1] = f < 0 ? f * 40 : Hh * Math.sin(e); out[2] = cz + R * Math.cos(e) * Math.sin(a);
  }, { ...o, sg: -1, wrap: true });
}
// A LAMP'S STAND (no lamp hangs: every one stands on rock). standPatch: a stalagmite or an islet, rock of revolution from under the water
// to a flat top at y (r0 across at the water, r1 at the top). shelfPatch: a broad flat ledge (three times as wide as it is high) grown out of a wall at the wall's own vertex (i, j),
// half of it in the wall; returns the lamp's place [x, y, z] on its flat top. Both are rock like any other (lit, toned, mirrored).
export function standPatch(B, x, z, y, r0, r1, o) {
  const nu = 9, rows = [[r0 * 1.35, -0.5], [r0, 0.06], [r0 * 0.5 + r1 * 0.5, y * 0.32], [r0 * 0.24 + r1 * 0.8, y * 0.68], [r1, y - 0.03], [0.01, y]];
  const pt = makePatch(B, nu, rows.length, (i, j, out) => { const a = i / (nu - 1) * Math.PI * 2; out[0] = x + rows[j][0] * Math.cos(a); out[1] = rows[j][1]; out[2] = z + rows[j][0] * Math.sin(a); },
    { ...o, amp: (px, py) => (py > y - 0.1 ? 0.02 : Math.min(0.22, 0.3 * r0)), sg: 1, wrap: true, under: false, hollow: [2, 3] });
  pt.stand = true; return pt;
}
export function shelfPatch(B, wall, i, j, o) {
  const k = (i + j * wall.nu) * 3, P = wall.P, Nn = wall.Nn, nl = Math.hypot(Nn[k], Nn[k + 2]) || 1, ox = -Nn[k] / nl, oz = -Nn[k + 2] / nl;   // level, out of the rock
  const sz = 0.55 + 0.45 * (o.size || 1), cx = P[k] + ox * 0.15 * sz, cz = P[k + 2] + oz * 0.15 * sz, top = [cx + ox * 0.3 * sz, P[k + 1], cz + oz * 0.3 * sz];
  const nu = 11, rows = [[0.01, -0.5], [0.5, -0.5], [0.72, -0.3], [0.75, -0.06], [0.72, 0], [0.01, 0]];   // 1.5 across, 0.5 high (times sz): flat above, blunt below
  const pt = makePatch(B, nu, rows.length, (ii, jj, out) => { const a = ii / (nu - 1) * Math.PI * 2, [r, h] = rows[jj];
    out[0] = cx + r * sz * Math.cos(a); out[1] = P[k + 1] + h * sz; out[2] = cz + r * sz * Math.sin(a); },
    { ...o, amp: 0.03, sg: 1, wrap: true, under: [0.25, 0.5], hollow: [2, 3] });
  pt.stand = true; return [top[0], top[1] + 0.1 * (o.size || 1), top[2]];
}
// stamp(B, patch, o): ONE STENCIL = the patch's own cells under the halo drawn again with the hand's coordinates (it cannot fight at depth).
// o: ci, cj (grid place of the hand's centre), tall (metres, wrist to longest tip; a sun: its diameter), N, seed, wrong, level (0, 1, 2),
//    color (THREE.Color), R (halo radius in hands, .85 to 1.2), rot (radians), side (+1 / -1), born (metres flown at which a FRESH hand's
//    site is abeam; leave out for a hand that was always there), frame (true: lay the hand flat on the tangent plane, for great hands on the dome),
//    field (true: no hand, a field of overspray only), heavy (true: a solid disc of pigment about the hand), norun (true: no run of
//    pigment under it), rim (the under-field: 1 red, 2 black, where the rock is in the two upper tones; add 4: on rock of any tone)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _T = new THREE.Vector3(), _U = new THREE.Vector3();
export function stamp(B, pt, o) {
  const S = o.level ? B.pp : B.s, { nu, nv, P, Nn, F, mask } = pt, W = pt.wrap ? nu - 1 : 0, wi = (i) => (W ? ((i % W) + W) % W : i);
  const i0 = Math.round(o.ci), j0 = Math.max(1, Math.min(nv - 2, Math.round(o.cj))), iq = W ? wi(i0) : Math.max(1, Math.min(nu - 2, i0));
  // THE MEASURE ALONG THE WALL IS TAKEN INSIDE THE STENCIL'S OWN FACE: at a face's last column from the column before it, never across
  // the corner to the next face's first column (the corner's double, which stands at the same place)
  let im = iq; if (pt.faces && !W) for (const f of pt.faces) if (i0 >= f[0] && i0 <= f[1]) { im = Math.max(f[0], Math.min(f[1] - 1, iq)); break; }
  pt.at(im, j0, _a); pt.at(im + 1, j0, _b); const du = _a.distanceTo(_b); _T.subVectors(_b, _a).normalize(); pt.at(iq, j0, _a); pt.at(iq, j0 + 1, _c);
  const dv = _a.distanceTo(_c), R = o.R || 1, lv = o.level || 0;
  // THE SPRAY'S REACH (the shader's own figures): the dense band, the spatter's fall, a run of pigment under the hand
  const W0 = Math.min(SPRAY_W, SPRAY_WM / o.tall) * Math.max(0.6, Math.min(1, R)), dcut = (o.field ? (R < 0.5 ? 1 : 0.3) * W0 : SPRAY_D0 * R * 1.4 + W0) + (lv === 1 ? 0.45 : lv === 2 ? 0.62 : 0);
  const runs = !o.field && !lv && !o.norun && !pt.wrap && pt.yb !== undefined && Math.abs(o.rot || 0) < 0.45 && o.N < 23.5;   // a run of pigment: under an upright hand on a wall
  const rcut = o.field ? FIELD_R * R + dcut : (o.heavy ? DISC_R * R + W0 : 0), runL = runs ? Math.min(0.7, 2 / o.tall) : 0;
  const rad = (o.arm ? 1.2 : lv ? PP_R[lv - 1] : Math.max(rcut, 0.64 + Math.max(dcut, runL))) * o.tall, ri = Math.ceil(rad / du) + 1, rj = Math.ceil(rad / dv) + 1;
  _U.subVectors(_c, _a); _U.addScaledVector(_T, -_U.dot(_T)).normalize();
  let ia = W ? i0 - ri : Math.max(0, i0 - ri), ib = W ? i0 + ri : Math.min(nu - 1, i0 + ri); const ja = Math.max(0, j0 - rj), jb = Math.min(nv - 1, j0 + rj);
  // NO STENCIL LIES ACROSS AN EDGE BETWEEN TWO FACES: on a wall of several faces (pt.faces: each face's columns) the halo is cut at its own face's edges
  if (pt.faces && !W) for (const f of pt.faces) if (i0 >= f[0] && i0 <= f[1]) { ia = Math.max(ia, f[0]); ib = Math.min(ib, f[1]); break; }
  const w = ib - ia + 1, cs = Math.cos(o.rot || 0), sn = Math.sin(o.rot || 0), side = o.side || 1, cy = o.N > 23.5 ? 0.5 : 0.46, half = 0.5 * Math.hypot(du, dv) / o.tall;
  const wr = o.field ? 32 : (o.wrong || 0) + (lv === 1 ? 8 : lv === 2 ? 16 : (o.spread ? 8 : 0)) + (o.arm ? 64 : 0) + (runs ? 128 : 0), born = o.born ?? -1000, n = w * (jb - ja + 1);
  const rr = new Float32Array(n), dd = new Float32Array(n), rn = new Uint8Array(n), uu = new Float32Array(n), vv = new Float32Array(n), id = new Int32Array(n).fill(-1);
  // every hand of the law lies inside this box of its own units: beyond the spray's reach of the box no distance need be asked
  const bx = 0.75, by0 = o.arm ? -0.74 : -0.36, by1 = 1.07, out = Math.max(dcut, runL) + 2.5 * half;
  for (let j = ja; j <= jb; j++) for (let i = ia; i <= ib; i++) {
    const k = (wi(i) + j * nu) * 3; let x, y;
    if (o.frame) { const dx = P[k] - _a.x, dy = P[k + 1] - _a.y, dz = P[k + 2] - _a.z; x = dx * _T.x + dy * _T.y + dz * _T.z; y = dx * _U.x + dy * _U.y + dz * _U.z; }
    else { x = (i - o.ci) * du; y = (j - o.cj) * dv; }
    const u = (x * cs + y * sn) / o.tall, v = (y * cs - x * sn) / o.tall, q = (i - ia) + (j - ja) * w, bd = Math.hypot(Math.max(Math.abs(u) - bx, 0), Math.max(by0 - v - cy, v + cy - by1, 0));
    uu[q] = side * u; vv[q] = v + cy; rr[q] = Math.hypot(u, v); rn[q] = v + cy < 0.3 && Math.abs(u) < 0.5 ? 1 : 0;
    dd[q] = o.field ? rr[q] - FIELD_R * R : (bd > out ? bd : handDistance(side * u, v + cy, o.N, o.seed, lv ? 0 : wr, 0));
  }
  const put = (q) => { if (id[q] >= 0) return id[q]; const i = ia + (q % w), j = ja + Math.floor(q / w), k = (wi(i) + j * nu) * 3;
    S.P.push(P[k], P[k + 1], P[k + 2]); S.Nn.push(Nn[k], Nn[k + 1], Nn[k + 2]); S.F.push(F[k / 3]); S.UV.push(uu[q], vv[q], o.tall);
    S.H.push(o.N, o.seed, wr + 256 * (o.rim || 0), born); S.C.push(o.color.r, o.color.g, o.color.b, o.heavy ? R + 10 : R); return (id[q] = S.P.length / 3 - 1); };
  for (let j = ja; j < jb; j++) for (let i = ia; i < ib; i++) {
    if (!mask[wi(i) + j * (nu - 1)]) continue;
    const a = (i - ia) + (j - ja) * w, b = a + 1, c = a + w, d = c + 1, lo = Math.min(dd[a], dd[b], dd[c], dd[d]);
    // only the cells the spray reaches: none wholly beyond its fall (where no corner tells, the middles of the cell's four quarters are asked, each with a quarter's own reach), none wholly inside the bare hand
    if (lo > Math.max(dcut, runL) + half && !(o.heavy && Math.min(rr[a], rr[b], rr[c], rr[d]) <= rcut + half)) continue;
    if (!o.field && !lv && Math.max(dd[a], dd[b], dd[c], dd[d]) < -half) continue;
    const hit = (q) => dd[q] <= dcut || (runs && rn[q] && dd[q] <= runL) || (o.heavy && rr[q] <= rcut);
    let reach = hit(a) || hit(b) || hit(c) || hit(d); const sl = half / 2;
    for (let q = 0; q < 4 && !reach; q++) { const fs = 0.25 + 0.5 * (q & 1), ft = 0.25 + 0.5 * (q >> 1), u = (uu[a] * (1 - fs) + uu[b] * fs) * (1 - ft) + (uu[c] * (1 - fs) + uu[d] * fs) * ft, v = (vv[a] * (1 - fs) + vv[b] * fs) * (1 - ft) + (vv[c] * (1 - fs) + vv[d] * fs) * ft;
      const r = Math.hypot(u, v - cy), e = o.field ? r - FIELD_R * R : handDistance(u, v, o.N, o.seed, lv ? 0 : wr, 0);
      reach = e <= dcut + sl || (runs && v < 0.3 && Math.abs(u) < 0.5 && e <= runL + sl) || (o.heavy && r <= rcut + sl); }
    if (!reach) continue;
    const A = put(a), Bq = put(b), C = put(c), D = put(d); S.I.push(A, Bq, C, Bq, D, C);
  }
}
// THE MIDDLE A STENCIL IS DRAWN ABOUT (out), for the same ci, cj and frame as stamp() takes: laid flat it is the grid's point nearest
// that place (stamp's own origin); else the place itself on the two triangles of its cell, as the cells are drawn
export function stampMiddle(pt, ci, cj, frame, out) {
  const { nu, nv } = pt, W = pt.wrap ? nu - 1 : 0, wi = (i) => (W ? ((i % W) + W) % W : Math.max(0, Math.min(nu - 1, i)));
  if (frame) return pt.at(W ? wi(Math.round(ci)) : Math.max(1, Math.min(nu - 2, Math.round(ci))), Math.max(1, Math.min(nv - 2, Math.round(cj))), out);
  const i0 = Math.floor(ci), j0 = Math.max(0, Math.min(nv - 2, Math.floor(cj))), fi = ci - i0, fj = Math.max(0, Math.min(1, cj - j0)), lo = fi + fj <= 1;
  pt.at(wi(lo ? i0 : i0 + 1), lo ? j0 : j0 + 1, out); pt.at(wi(i0 + 1), j0, _b); pt.at(wi(i0), j0 + 1, _c);
  return lo ? out.multiplyScalar(1 - fi - fj).addScaledVector(_b, fi).addScaledVector(_c, fj) : out.multiplyScalar(fi + fj - 1).addScaledVector(_b, 1 - fj).addScaledVector(_c, 1 - fi);
}
// a batch into meshes: rock, its stencils, and the same three again upside down for the water (scale y -1)
export function batchMeshes(B, style, name) {
  const g = new THREE.Group(); g.name = name; let tris = 0;
  const geo = (P, Nn, F, I, extra) => { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ge.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); ge.setAttribute('aForm', new THREE.Float32BufferAttribute(F, 1));
    if (extra) { ge.setAttribute('aUV', new THREE.Float32BufferAttribute(extra.UV, 3)); ge.setAttribute('aH', new THREE.Float32BufferAttribute(extra.H, 4)); ge.setAttribute('aC', new THREE.Float32BufferAttribute(extra.C, 4)); }
    ge.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1)); ge.computeBoundingSphere(); tris += I.length / 3; return ge; };
  const add = (ge, mat, ro) => { for (const m of [1, -1]) { const me = new THREE.Mesh(ge, mat); me.scale.y = m; me.renderOrder = m > 0 ? ro + 4 : ro; me.matrixAutoUpdate = false; me.updateMatrix(); g.add(me); } };
  add(geo(B.P, B.Nn, B.F, B.I), style.rock, 0);
  if (B.s.I.length) add(geo(B.s.P, B.s.Nn, B.s.F, B.s.I, B.s), style.stencil, 1);
  if (B.pp.I.length) add(geo(B.pp.P, B.pp.Nn, B.pp.F, B.pp.I, B.pp), style.stencilPP, 2);
  g.userData.triangles = tris; return g;
}

// ---------------------------------------------------------------- the water (a sheet over the mirrored copy), its rings, the lamps, the dust
// THE MIRROR: every mesh of the cave is drawn a second time scaled y -1 (batchMeshes does it); this sheet lies over that copy and
// multiplies its linear colour by WATER_TINT (in the mouth and the gallery from it by 0.3 of that again), adding nothing. Rings: instanced bands on the sheet, each site by the world's clock.
export function makeWater(style, sites) {   // sites: [[x, z, period, phase], ...]
  const g = new THREE.Group();
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(240, 330).rotateX(-Math.PI / 2).translate(60, 0, 120), new THREE.ShaderMaterial({
    uniforms: { uW: { value: new THREE.Vector3(...WATER_TINT) } }, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,   // in the mouth and the gallery from it (by place) the water is dark: 0.3 of the mirror
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,   // the picture below the sheet times uW: the mirror half as bright and browner
    vertexShader: 'varying vec2 vXZ; void main(){ vXZ = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform vec3 uW; varying vec2 vXZ; void main(){ float s = (vXZ.x - 86.) * .866 - (vXZ.y - 144.3) * .5, k = (1. - smoothstep(168., 172., vXZ.y)) * (1. - smoothstep(-1., 4., s)) * step(69., vXZ.x); gl_FragColor = vec4(uW * (1. - .7 * k), 1.); }' }));
  sheet.renderOrder = 3; g.add(sheet);
  // THE RINGS: a drip's ring is a swell that passes over the mirror: a pale band and a dark band side by side (the mirror's picture times
  // 1.5 and 0.5 in linear light), half a metre each, spreading to 6 m and fading. Drawn as the picture times twice the colour written (0.5 changes nothing).
  // A drip whose site is on the dark water of the mouth gives a ring nearly twice as strong (times 1.9 and 0.1) that fades more slowly, so the dark water still moves.
  const q = new THREE.InstancedBufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1], 3)); q.setIndex([0, 2, 1, 1, 2, 3]);
  q.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(sites.flat()), 4)); q.instanceCount = sites.length;
  const rings = new THREE.Mesh(q, new THREE.ShaderMaterial({ uniforms: { uTime: style.uniforms.uTime }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    vertexShader: /* glsl */`attribute vec4 iS; uniform float uTime; varying vec2 vQ; varying float vA, vK;
      void main(){ vQ = position.xz * 6.6; vA = fract(uTime / max(iS.z, 1.) + iS.w); float s = (iS.x - 86.) * .866 - (iS.y - 144.3) * .5; vK = (1. - smoothstep(168., 172., iS.y)) * (1. - smoothstep(-1., 4., s)) * step(69., iS.x); gl_Position = projectionMatrix * modelViewMatrix * vec4(iS.x + position.x * 6.6, .012, iS.y + position.z * 6.6, 1.); }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vA, vK;
      float band(float r, float r1, float w){ float s = clamp((r - r1) / .5, -1., 1.); return sin(3.14159 * s) * clamp(.5 / max(2.5 * w, 1e-4), 0., 1.); }
      void main(){ float r = length(vQ), w = fwidth(r), fade = (1. - vA) * mix(1. - vA, 1., vK) * smoothstep(0., .08, vA);
        float a = band(r, vA * 6., w) + .6 * band(r, vA * 6. - 1.5, w) * step(1.5, vA * 6.);   // two slow rings a drip
        gl_FragColor = vec4(vec3(.5 + (.24 + .2 * vK) * a * fade), 1.); }` }));
  rings.renderOrder = 3.5; rings.frustumCulled = false; g.add(rings);
  return g;
}
// THE LAMP: a clay bowl 0.38 m across on its stand, one flame leaf 0.35 m tall, white in its belly (a lamp of size z: z times as
// large). All the lamps are one mesh, drawn twice (the second time for the water).
export function makeLamps(style) {   // NO CORDS: a bowl on its stand and a flame, a leaf 0.35 m tall, white at the core
  const pal = style.palette, P = [], Lt = [], Pt = [], I = [];
  const lathe = (prof, seg, part) => { const b = P.length / 3;
    for (let j = 0; j < prof.length; j++) for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; P.push(prof[j][0] * Math.cos(a), prof[j][1], prof[j][0] * Math.sin(a)); Lt.push(part > 0.5 ? [0.3, 1, 0.75, 0][j] : 0); Pt.push(part + (part < 0.5 && j < 2 ? 0.25 : 0)); }
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < seg; i++) { const a = b + i + j * (seg + 1), c = a + seg + 1; I.push(a, c, a + 1, a + 1, c, c + 1); } };
  lathe([[0.001, -0.10], [0.13, -0.085], [0.19, 0.03], [0.001, 0.0]], 8, 0);
  lathe([[0.001, 0.0], [0.09, 0.10], [0.058, 0.22], [0.001, 0.35]], 6, 1);
  const ge = new THREE.InstancedBufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ge.setAttribute('aCore', new THREE.Float32BufferAttribute(Lt, 1)); ge.setAttribute('aPart', new THREE.Float32BufferAttribute(Pt, 1)); ge.setIndex(I);
  const n = style.lamps.length, iP = new Float32Array(n * 4), iS = new Float32Array(n * 4);
  style.lamps.forEach((l, i) => { iP.set([l.p[0], l.p[1], l.p[2], l.size || 1], i * 4); iS.set([l.sway[0], l.sway[1], l.period, l.phase], i * 4); });
  ge.setAttribute('iPos', new THREE.InstancedBufferAttribute(iP, 4)); ge.setAttribute('iSw', new THREE.InstancedBufferAttribute(iS, 4)); ge.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uTime: style.uniforms.uTime, uCol: { value: [pal.lit, pal.flame, new THREE.Color('#FFFBF0'), pal.yellow] } },
    // the bowl STANDS (it does not move) in the rock's lit tone; the flame leans toward where its light stands by the clock; ONE SIZE BY ITS PLACE (iPos.w)
    vertexShader: /* glsl */`attribute float aCore; attribute float aPart; attribute vec4 iPos; attribute vec4 iSw; uniform float uTime; uniform vec3 uCol[4]; varying vec3 vCol; varying float vF;
      void main(){ float a = sin(uTime * 6.2832 / max(iSw.z, 1.) + iSw.w); vec3 p = position;
        vCol = aPart > .5 ? uCol[1] : uCol[0];
        if (aPart > .5) { float h = p.y / .35; p.xz += (vec2(iSw.x, iSw.y) * a * .6 + .03 * vec2(sin(uTime * 1.9 + iSw.w * 3.), cos(uTime * 1.3 + iSw.w))) * h; p.y *= 1. + .12 * sin(uTime * 2.3 + iSw.w * 7.); }
        vF = aPart > .5 ? aCore : -1.;   // the leaf's own shape: white in its belly, the flame's colour above, yellow at the tip
        gl_Position = projectionMatrix * modelViewMatrix * vec4(iPos.xyz + p * iPos.w, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uCol[4]; varying vec3 vCol; varying float vF; void main(){ gl_FragColor = vec4(vF < 0. ? vCol : mix(mix(uCol[3], vCol, smoothstep(.16, .22, vF)), uCol[2], smoothstep(.5, .56, vF)), 1.); }` });
  const g = new THREE.Group(); for (const m of [1, -1]) { const me = new THREE.Mesh(ge, mat); me.scale.y = m; me.frustumCulled = false; me.renderOrder = m > 0 ? 4 : 0; me.matrixAutoUpdate = false; me.updateMatrix(); g.add(me); }
  g.userData.triangles = I.length / 3 * n * 2; return g;
}

// ---------------------------------------------------------------- THE CAVE
const Pd = (s, o) => [C0[0] + s * DIR[0] + o * 0.5, C0[1] + s * DIR[1] + o * 0.866];   // the last gallery's own coordinates: s along it, o to its right
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, Y = async () => { if (ctx.yield) await ctx.yield(); };
  const style = opts.style || makeStyle(ctx, opts), pal = style.palette, detail = Math.max(0.6, Math.min(1, opts.detail ?? 1));
  const path = makePath(PATH_POINTS), object = new THREE.Group(); object.name = 'painted-cave'; await Y();
  const G = PLAN.gallery, H = PLAN.hall, hc = H.c;
  const domeY = (x, z) => H.h * Math.sqrt(Math.max(0, 1 - ((x - hc[0]) ** 2 + (z - hc[2]) ** 2) / (H.r * H.r)));
  const roofY = (x, z) => (z < 7 ? 16 : z < 66 ? 5.2 : z < 140 ? 18 : z < 154 && x < 70 ? 16 : x > 71 && z < 168 ? (z < 150 || x > 89 ? 18 : 20) : domeY(x, z));

  // ---- the rock, room by room (each room one batch: its rock, its stencils, and both again in the water)
  const R = {}; for (const k of ['gallery', 'passage', 'columns', 'arch', 'hall', 'out']) R[k] = makeBatch();
  const W = {};   // the patches that carry hands, by name
  const wo = (amp, more) => ({ noise, amp, cell: 1.25, ...more });
  // A the water gallery (rock on the right of each line's direction)
  W.gN = wallPatch(R.gallery, [[56.5, -6], [-21, -6]], 0, 17, wo(1.0)); await Y();
  W.gS = wallPatch(R.gallery, [[-21, 6], [36.3, 6]], 0, 17, wo(1.0)); await Y();   // the turn's inner corner is cut back: the line needs its clear air
  W.gS2 = wallPatch(R.gallery, [[51.3, 6], [56.5, 6]], 0, 17, wo(0.5)); W.gL = wallPatch(R.gallery, [[35.5, 6], [52, 6]], 5.0, 17, wo(0.5)); wallPatch(R.gallery, [[-20, -7], [-20, 7]], 0, 17, wo(0.8, { cell: 2 }));
  // a rib of rock behind each seam of the wall over the passage's opening with the south wall beside it: no sight line passes between the two
  wallPatch(R.gallery, [[36.2, 8.0], [36.2, 6.75], [42.5, 6.75]], 5.2, 17.5, wo(0.05, { cell: 1.6, junction: false, under: false }));
  wallPatch(R.gallery, [[51.0, 6.75], [57.0, 6.75]], 5.2, 17.5, wo(0.05, { cell: 1.6, junction: false, under: false }));
  W.six = wallPatch(R.gallery, [[56, 7], [56, -7]], 0, 17, wo(0.12, { cell: 0.7, lean: 0.3, cove: 0.8, faces: true })); await Y();   // the Six's wall: the floor of light holds it in the second tone as high as the Six and its fives, the white disc plain on it
  ceilPatch(R.gallery, -21, -7, 1, 0, 78, 14, () => 16, wo(1.2, { cell: 2.2 })); await Y();
  // C the low passage: ledges at both walls and over it A LOW ROUGH VAULT: highest over the middle (4.95 to 5.45 m, uneven along its
  // length), coming down to 3.3 to 3.9 m where it meets the walls. Where the vault ends, a head of rock of its own outline closes the
  // wall over each opening down to it.
  const pvy = (x, z) => { const wx = z > 14 ? 40.4 : z > 9.5 ? 38.6 + 0.4 * (z - 9.5) : 35.7 + 0.744 * Math.max(0, z - 5.6), c = (wx + 51.6) / 2, t = Math.min(1.2, Math.abs(x - c) / (51.6 - c));
    const crown = 5.2 + 0.25 * Math.sin(z * 0.31 + 0.6) * Math.sin(z * 0.113 + 2), edge = 3.6 + 0.3 * Math.sin(z * 0.47 + (x < c ? 1.9 : 0)); return edge + (crown - edge) * (1 - t * t); };
  const pys = [-0.5, 0.66, 0.72, 1.5, 2.3, 3.1, 3.9, 4.7, 5.6];
  W.pW = wallPatch(R.passage, [[35.7, 5.6], [38.6, 9.5], [40.4, 14], [40.4, 67]], 0, 5.6, wo(0.3, { ys: pys, shelf: { y: 0.7, w: 1.3 }, lean: 0.1, cove: 0, cell: 0.8, under: false, hollow: [2, 3] })); await Y();
  W.pE = wallPatch(R.passage, [[51.6, 67], [51.6, 5.6]], 0, 5.6, wo(0.3, { ys: pys, shelf: { y: 0.7, w: 1.3 }, lean: 0.1, cove: 0, cell: 0.8, under: false, hollow: [2, 3] })); await Y();
  // THE VAULT stands in the third tone (the floor of light) but for the pools over the ledge lamps; nothing else decides on it
  W.pC = ceilPatch(R.passage, 52.6, 5.9, 0, 1, 61.1, 18, pvy, wo(0.18, { cell: 0.75, under: false })); await Y();
  makePatch(R.gallery, 34, 4, (i, j, out) => { const x = 35.5 + 0.5 * i, y0 = Math.min(5.05, pvy(x, 6) - 0.25); out[0] = x; out[1] = y0 + (5.3 - y0) * j / 3; out[2] = 6; }, wo(0.15, { sg: 1, under: false }));
  makePatch(R.columns, 21, 4, (i, j, out) => { const x = 51 - 0.5 * i, y0 = Math.min(5.25, pvy(x, 66) - 0.25); out[0] = x; out[1] = y0 + (5.5 - y0) * j / 3; out[2] = 66.05; }, wo(0.15, { sg: 1, under: false }));
  // D the columns
  const D = PLAN.columns;
  W.dN1 = wallPatch(R.columns, [[69, 66], [51, 66]], 0, 19, wo(1.2)); W.dN2 = wallPatch(R.columns, [[41, 66], [23, 66]], 0, 19, wo(1.2)); wallPatch(R.columns, [[51, 66], [41, 66]], 5.2, 19, wo(0.8)); await Y();
  // a rib of rock behind each seam of the wall over the passage's opening with the north wall beside it, above the passage's vault
  wallPatch(R.columns, [[54.6, 64.7], [49.4, 64.7]], 5.6, 19.5, wo(0.05, { cell: 1.6, junction: false, under: false })); wallPatch(R.columns, [[42.6, 64.7], [37.4, 64.7]], 5.6, 19.5, wo(0.05, { cell: 1.6, junction: false, under: false }));
  W.dW = wallPatch(R.columns, [[24, 65], [24, 141]], 0, 19, wo(1.4, { cell: 1.6 })); await Y();
  W.dE = wallPatch(R.columns, [[68, 141], [68, 65]], 0, 19, wo(1.4, { cell: 1.6 })); await Y();
  W.dS1 = wallPatch(R.columns, [[23, 140], [39, 140]], 0, 19, wo(1.0)); W.dS2 = wallPatch(R.columns, [[53, 140], [69, 140]], 0, 19, wo(1.0)); wallPatch(R.columns, [[37.6, 140.2], [54.4, 140.2]], 15.4, 20, wo(0.1, { lean: 0, cove: 0, junction: false, under: false, hollow: [2, 3] })); await Y();
  // THE LINTEL over the arch: one block of rock 1.3 m proud of the wall, from 15.6 m to the roof, plain and upright (no curl, no hollows:
  // seen from far down the chamber it is a body of tone 4 m high, never a thin stroke); the arch's own roof and jambs end behind its face
  wallPatch(R.columns, [[37.4, 141.3], [37.4, 138.7], [54.6, 138.7], [54.6, 141.3]], 15.6, 19.8, wo(0.12, { lean: 0, cove: 0, faces: true, under: false, hollow: [2, 3] }));
  ceilPatch(R.columns, 23, 65, 1, 0, 46, 76, () => 18, wo(1.6, { cell: 2.6 })); await Y();
  W.cols = []; for (const [x, z, r] of D.list) { W.cols.push(columnPatch(R.columns, x, z, r, 18, { noise, amp: 0.3 })); await Y(); }
  // E the arch: two smooth pale faces. They stand 0.6 m outside the plan's lines (x 39 and 53) and the roof 0.7 m above the plan's
  // 16 m, and they run on south to z 157.5, where they END INSIDE THE RIM of the doorway to the hall (0.5 m behind its lip's plane,
  // 0.5 m and more under its skin on every side); the rim leaves the plan's opening clear: 14 m broad at the water, 16 m and more
  // high at the middle. The roof is no broader than the faces need. archSh: how far a face leans in at a height (the wall's own lean and curl).
  const archSh = (y) => { const h = (y + 0.5) / 17.5, e = Math.max(0, (h - 0.7) / 0.3); return 0.4 * h * h + 1.2 * e * e; };
  W.aW = wallPatch(R.arch, [[38.4, 139.5], [38.4, 157.5]], 0, 17, wo(0.12, { lean: 0.4, cove: 1.2 })); W.aE = wallPatch(R.arch, [[53.6, 157.5], [53.6, 139.5]], 0, 17, wo(0.12, { lean: 0.4, cove: 1.2 }));
  ceilPatch(R.arch, 39.2, 139.5, 1, 0, 13.6, 18, () => 16.7, wo(0.2, { cell: 1.7 })); await Y();
  // a slim round post of rock at each jamb of the arch, from the water to above the roofs, where the arch's face (leaning in) leaves
  // the end of the chamber's south wall: it leans with the face and is nowhere proud of the plan's line of it
  for (const sd of [-1, 1]) makePatch(R.arch, 9, 17, (i, j, out) => { const y = -0.5 + 20 * j / 16, a = i / 8 * Math.PI * 2;
    out[0] = 46 + sd * (7.6 - archSh(Math.min(y, 17)) + 0.6 * Math.cos(a)); out[1] = y; out[2] = 139.6 + 0.6 * Math.sin(a); }, { noise, amp: 0.12, sg: sd, wrap: true });
  // F the hall: one swelling vault over the lake, open at the arch and at the mouth
  // THE MOUTH'S OUTLINE on the hall's north wall (x across, y up): two jambs 15 m apart to 4 m, over them half an ellipse to 17.7 m.
  // THE WAY IN from the arch has the arch's own outline: the plan's opening, 14 m broad at the water, its sides leaning in as the
  // arch's faces do, its head 16 m at the corners and a little more at the middle. mouthD, wayinD: metres outside the outline
  // (inside: under 0); zA: where the vault's plan surface stands at x, y.
  const doorD = ([cx, a, y0, b]) => (x, y) => { const dx = x - cx, dy = y - y0; if (dy <= 0) return Math.abs(dx) - a; const g = Math.hypot(dx / a, dy / b); return (g - 1) * Math.hypot(dx, dy) / Math.max(g, 1e-6); };
  const MOUTH = [80, 7.5, 4, 13.7], mouthD = doorD(MOUTH);   // middle x, half its breadth, where its arch springs, the arch's rise
  const wayinD = (x, y) => Math.max(Math.abs(x - 46) - 7 + archSh(Math.min(y, 16)), y - 16.1);
  const zA = (x, y) => hc[2] - Math.sqrt(Math.max(100, H.r * H.r * (1 - (Math.max(0, y) / H.h) ** 2) - (x - hc[0]) ** 2));
  W.dome = domePatch(R.hall, hc[0], hc[2], H.r, H.h, { noise, amp: 1.3, under: [0.6, 0.85], calm: (x, y, z) => Math.max((1 - sst(16, 20, y)) * (1 - sst(18, 22, Math.abs(x - 80))) * (1 - sst(186, 192, z)), 1 - sst(12, 15, Math.hypot(x - EAST_POOL[0], y - EAST_POOL[1], z - EAST_POOL[2]))), skip: (x, y, z) => z < 180 && x > 64 && x < 96 && mouthD(x, y) < 1,
    // at the way in every cell is left out that has any corner nearer the outline than the cell is broad: no cell of the vault reaches into the arch's room
    skipCell: (P, a, b, c, d) => { if (P[a + 2] > 176 || P[a] < 22 || P[a] > 70) return false; const br = Math.max(Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]), Math.hypot(P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]));
      for (const k of [a, b, c, d]) if (wayinD(P[k], P[k + 1]) < br) return true; return false; } }); await Y();
  ceilPatch(R.hall, hc[0] - 3, hc[2] - 3, 1, 0, 6, 6, () => 61.4, wo(0.1, { cell: 2 }));   // the crown's own stone: the vault is whole
  // G the way out: a gallery north from the mouth, THE LAST WALL at the bend, the last gallery to the ring
  const q1 = Pd(52, -8), q2 = Pd(52, 8), e1 = Pd(50, 9), e2 = Pd(50, -9), oc = Pd(-4, -9);
  // THE MOUTH READS AS ONE DOORWAY: its walls the second tone from edge to edge, its roof the third, the Last Wall at its end the top tone
  W.oW = wallPatch(R.out, [[72, 138], [72, 157]], 0, 21, wo(0.5, { faces: true, hollow: [2, 3] })); await Y();
  W.oN = wallPatch(R.out, [q1, [88.9, 133.4], [86.5, 139]], 0, 21, wo(0.9)); await Y();
  W.last = wallPatch(R.out, [[86.5, 139], [71, 139]], 0, 21, wo(0.25, { cell: 0.8, lean: 0.4, cove: 1, faceTone: [0], faces: true, junction: false, hollow: [2, 3] })); await Y();
  W.oE = wallPatch(R.out, [[88, 170.5], [88, 152.4], q2], 0, 21, wo(0.6, { faces: true, lean: 0.4, cove: 0.8 })); await Y();
  W.end = wallPatch(R.out, [e1, e2], 0, 21, wo(0.3, { lean: 0.2, cove: 0.6 })); await Y();
  ceilPatch(R.out, 71, 138, 1, 0, 18, 35, () => 20, wo(1.0, { cell: 2.4, tone: () => 2, skip: (x, y, z) => z > zA(x, 20) - 3.2 })); ceilPatch(R.out, oc[0], oc[1], DIR[0], DIR[1], 58, 18, () => 18, wo(1.0, { cell: 2.4 })); await Y();
  // THE SHELL IS WHOLE: every wall of the way out stands a metre above its roof; where the last gallery's lower roof (18 m) leaves the
  // first one's (20 m) a riser of rock closes the step; a post of rock stands in the corner where the Last Wall meets the last gallery's wall
  wallPatch(R.out, [[89.3, 132.5], [89.3, 153.5]], 17.2, 22.5, wo(0.2, { cell: 2, lean: 0, cove: 0, faces: true, faceTone: [2], junction: false, under: false }));
  wallPatch(R.out, [[89.6, 137.9], [85.6, 137.9]], 18, 22.5, wo(0.2, { cell: 2, lean: 0, cove: 0, faces: true, faceTone: [2], junction: false, under: false }));
  columnPatch(R.out, 86.7, 139.3, 0.45, 21, { noise, amp: 0.3 }); await Y();
  // THE MOUTH'S FACE TO THE HALL IS ONE BODY OF ROCK: a swelling of the hall's own wall round the mouth, 2.6 m proud at its nose,
  // rising from behind the vault's sheet (its outer edge lies 0.9 m and more behind it), turning in at the mouth's rim (1.2 m inside
  // the outline: jambs 12.6 m apart, leaning together into a rough arch 16.5 m high) and running back as the mouth's reveal, whose end
  // turns outward into the gallery's own walls and roof (0.8 m and more inside them). Where the vault's cells end further from the
  // outline the swelling is broader (it is asked of the vault's own cells, column by column). No row of it is taken a tone down: its reveal stands in the light of the two lamps at its jambs' feet.
  const archMO = ([cx, a, y0, b]) => { const MO = [];
    for (const y of [-0.6, y0 - 3.1, y0 - 1.6]) MO.push([cx - a, y, -1, 0]);
    for (let k = 0; k <= 24; k++) { const f = k / 24 * Math.PI, c = Math.cos(f), s = Math.sin(f), l = Math.hypot(c / a, s / b); MO.push([cx - a * c, y0 + b * s, -c / a / l, s / b / l]); }
    for (const y of [y0 - 1.6, y0 - 3.1, -0.6]) MO.push([cx + a, y, 1, 0]); return MO; };
  // rockFace(MO, PR, zOf, form, amp): MO the outline's places with their outward directions, PR the body's profile (metres outside
  // the outline, metres toward the hall), zOf where a row stands (z), form its tone by grid place, amp its roughness
  const rockFace = (MO, PR, zOf, form, amp, kOf = (dh) => Math.max(0.5, Math.min(1.15, (dh + 1.1) / 4))) => { const D = W.dome, dn = D.nu - 1, dv = D.nv - 1;
    const open = (x, y) => { const a = (Math.atan2(zA(x, y) - hc[2], x - hc[0]) + Math.PI * 2) % (Math.PI * 2), t = (Math.asin(Math.min(1, Math.max(0.3, y) / H.h)) / (Math.PI / 2 * 0.985) + 0.012) / 1.012;
      return !D.mask[Math.min(dn - 1, Math.floor(a / (Math.PI * 2) * dn)) + Math.min(dv - 1, Math.floor(t * dv)) * dn]; };
    const K0 = MO.map(([x, y, nx, ny]) => { let dh = 0; for (let d = 0.25; d < 9; d += 0.25) if (open(x + nx * d, y + ny * d)) dh = d; return kOf(dh); });
    const K = K0.map((v, c) => Math.max(v, K0[Math.max(0, c - 1)], K0[Math.min(K0.length - 1, c + 1)]));
    const pt = makePatch(R.hall, MO.length, PR.length, (i, j, out) => { const [x, y, nx, ny] = MO[i], [d0, zo] = PR[j], d = d0 > 0 && j < 8 ? d0 * K[i] : d0;
      out[0] = x + nx * d; out[1] = y + ny * d; out[2] = zOf(j, x, y, nx, ny, out[0], out[1], zo); }, { noise, amp, sg: 1, hollow: [2, 3], form }); pt.K = K; return pt; };
  const PR = [[6.6, -2.2], [5.2, -0.8], [4, 0.5], [2.8, 1.5], [1.6, 2.2], [0.5, 2.6], [-0.5, 2.3], [-1.1, 1.2], [-1.2, -0.2], [-1.1, -2.2], [-0.8, -4.5], [4.2, -5.5]];
  W.face = rockFace(archMO(MOUTH), PR, (j, x, y, nx, ny, ox, oy, zo) => (j < 9 ? zA(ox, oy) : zA(x - nx * 1.2, y - ny * 1.2)) + zo, () => 0, 0.35); await Y();   // no row of it is taken a tone down: its reveal stands in its own lamps' light
  // THE WAY IN'S RIM: a body of the same kind round the arch's own outline. Its lip (the outline itself) stands on one upright
  // plane at z 158, in front of the vault everywhere; the arch's faces and roof end 0.5 m behind that plane, 0.5 m and more
  // inside the body; behind the lip the body turns outward through them (within 2 m) and is seen no more from the arch. Toward the
  // hall it swells as the mouth's does; where the vault stands far behind the plane (the east side's foot) it is a buttress.
  { const MI = [], ys = [-0.6, 1.6, 3.8, 6, 8.2, 10.2, 12, 13.4, 14.5, 15.3];
    for (const y of ys) MI.push([46 - 7 + archSh(y), y]);
    for (let k = 0; k <= 12; k++) { const l = -5.6 + 11.2 * k / 12; MI.push([46 + l, 16 + 0.1 * (1 - (l / 5.6) ** 2)]); }
    for (let k = ys.length - 1; k >= 0; k--) MI.push([46 + 7 - archSh(ys[k]), ys[k]]);
    const MO = MI.map((q, i) => { const a = MI[Math.max(0, i - 1)], b = MI[Math.min(MI.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [q[0], q[1], -(b[1] - a[1]) / l, (b[0] - a[0]) / l]; });
    const PI = [[6.6, -2.2], [5.2, -0.8], [4, 0.5], [2.8, 1.5], [1.6, 2], [0.7, 2.2], [0.2, 1.9], [0, 1.2], [0.02, 0.3], [0.25, -0.4], [1.2, -1.3], [3.6, -2.1]];
    W.faceIn = rockFace(MO, PI, (j, x, y, nx, ny, ox, oy, zo) => (j < 2 ? zA(ox, oy) : j < 7 ? Math.max(zA(ox, oy), 156.8) : 156.8) + zo, null, 0.1, (dh) => Math.max(0.5, Math.min(2, (dh + 0.7) / 4.2))); } await Y();   // the body reaches 0.7 m and more past the last cell the vault leaves out
  // THE GREAT COLUMN at the mouth's west side: one round column of rock standing in the lake from the water to the vault, flared at
  // foot and head. It stands between the hall's way in and the last gallery: no place of the line in the hall sees the ring past
  // it. It stands clear of the line.
  { const [cx, cz, cr, ch] = PLAN.pier.c, nu = 21, nv = 24;
    W.pier = makePatch(R.hall, nu, nv, (i, j, out) => { const y = -0.5 + (ch + 1.5) * j / (nv - 1), w = sst(11, 17.5, y), up = Math.max(0, y - 9), a = i / (nu - 1) * Math.PI * 2;
      const rr = (cr * (1 + 0.25 * sst(2.5, -0.5, y)) * (1 - w) + 2.9 * w) * (1 + 0.6 * sst(26, ch, y));   // a broad drum to 11 m, a shaft of 2.9 m from 17.5 m, flared at foot and head
      out[0] = cx - 0.11 * up + rr * Math.cos(a); out[1] = y; out[2] = cz - 0.05 * up + rr * Math.sin(a); },
      { noise, amp: 0.4, sg: 1, wrap: true, under: false, hollow: [2, 3], tone: () => 2 }); W.pier.dy = (ch + 1.5) / (nv - 1); }   // a face of one tone all round: the third, a tone under the wall beside the doorway

  // ---- THE LAMPS: every one STANDS ON ROCK (a shelf grown from a wall, a ledge, a stalagmite's top, an islet in the lake), never nearer
  // than 5 m to the flown line with its stand (a shelf is sought where its lamp keeps 6.15 m); its LIGHT sways 0.25 m about it by the clock (the bowl stands, the flame leans). Places by the plan,
  // periods and phases by the seed.
  const lampList = [], stands = [];
  const lampAt = (p, reach, kind, size = 1) => { const a = rng.range(0, Math.PI * 2); stands.push({ p, kind });
    lampList.push({ p, reach, size, sway: [Math.cos(a) * 0.25, Math.sin(a) * 0.25], period: rng.range(5, 8), phase: rng.range(0, 6.283), hang: 0, stand: kind }); };
  // OVER A FLAME THAT STANDS AGAINST A WALL THE ROCK STAYS BARE: no hand's own shape lies within 1.4 flames of the place 1.6 flames
  // above the flame's foot (written down here, kept by hand(); no mark is drawn there). fl: the flame's height.
  // OVER A FLAME that stands against a wall a round of rock is kept bare of any hand's own shape (its place and radius are written here
  // and laid into NEAR before the first hand); nothing is painted there
  const overL = [];
  const over = (room, pt, x, y, z, fl) => { overL.push(x, y + 1.6 * fl, z, 1.4 * fl); };
  const shelfLamp = (room, pt, x, y, z, reach, size = 1) => {   // a shelf at the wall's own vertex nearest to (x, y, z) that keeps the line's clear air
    let best = 1e9, bi = -1, bj = 0; const P = pt.P, Nn = pt.Nn, nu = pt.nu;
    for (let j = 2; j < pt.nv - 1; j++) for (let i = 1; i < nu - 1; i++) { const k = (i + j * nu) * 3, d = (P[k] - x) ** 2 + (P[k + 1] - y) ** 2 + (P[k + 2] - z) ** 2;
      if (d < best && pt.mask[i + j * (nu - 1)] && pt.mask[i - 1 + (j - 1) * (nu - 1)] && path.distanceTo(P[k] - 0.4 * Nn[k], P[k + 1] + 0.1, P[k + 2] - 0.4 * Nn[k + 2]) > 6.15) { best = d; bi = i; bj = j; } }
    if (bi >= 0) { const q = shelfPatch(R[room], pt, bi, bj, { noise, size }), k = (bi + bj * nu) * 3; lampAt(q, reach, 'shelf', size); over(room, pt, P[k], q[1], P[k + 2], 0.35 * size); }
  };
  const standLamp = (room, x, z, y, reach, r0, r1, kind, size = 1) => {
    for (let t = 0; t < 4; t++) {   // off the line, off the columns
      if (path.distanceTo(x, y, z) < 5.6 + r1) { const q = path.nearestXZ(x, z), pp = path.pointAt(q.u), tg = path.tangentAt(q.u), l = Math.hypot(tg.x, tg.z) || 1, nx = -tg.z / l, nz = tg.x / l, sd = (x - pp.x) * nx + (z - pp.z) * nz < 0 ? -1 : 1; x = pp.x + nx * sd * (6 + r1); z = pp.z + nz * sd * (6 + r1); }
      for (const [cx, cz, cr] of PLAN.columns.list) { const d = Math.hypot(x - cx, z - cz); if (d < cr + r0 + 1.2) { x = cx + (x - cx) / Math.max(d, 0.01) * (cr + r0 + 1.3); z = cz + (z - cz) / Math.max(d, 0.01) * (cr + r0 + 1.3); } }
    }
    standPatch(R[room], x, z, y, r0, r1, { noise }); lampAt([x, y + 0.1 * size, z], reach, kind, size);
  };
  // A the gallery: shelves on both walls, two of them by the First Six
  for (const [x, y] of [[-14, 4], [8, 5], [24.5, 4.5], [41, 5.5]]) shelfLamp('gallery', W.gN, x, y, -6.5, 7.5);
  for (const [x, y] of [[-3, 4.5], [19, 4], [33, 5]]) shelfLamp('gallery', W.gS, x, y, 6.5, 7.5);
  shelfLamp('gallery', W.gN, 49.5, 6.5, -6.5, 4.6); shelfLamp('gallery', W.gS2, 54, 6.5, 6.5, 4.6);   // the two by the Six: their near pools end short of its disc
  shelfLamp('gallery', W.gL, 39.5, 9.6, 6.4, 4); shelfLamp('gallery', W.gL, 47.5, 10, 6.4, 4);   // over the passage's opening: the wall beside the Six stands in pools
  await Y();
  // C the passage: on its two ledges
  for (let i = 0; i < 6; i++) { lampAt([51.4, 0.82, 12 + i * 10.4], 5.2, 'ledge'); over('passage', W.pE, 51.7, 0.82, 12 + i * 10.4, 0.35); }
  for (let i = 0; i < 3; i++) { lampAt([40.6, 0.82, 28 + i * 11], 5.2, 'ledge'); over('passage', W.pW, 40.3, 0.82, 28 + i * 11, 0.35); }
  // D the columns: stalagmites in the water, shelves on the long walls
  for (const [x, z] of [[36, 70], [52, 70], [33, 88], [57, 84], [39, 104], [57, 105], [36, 114], [53, 118], [38, 130], [56, 127]]) standLamp('columns', x, z, 1.3 + 2.0 * rng(), z > 108 ? 13 : 10, 0.85, 0.24, 'stalagmite');
  shelfLamp('columns', W.dW, 24, 7, 82, 9); shelfLamp('columns', W.dW, 24, 8, 107, 9); shelfLamp('columns', W.dW, 24, 8, 127, 9); shelfLamp('columns', W.dE, 68, 8, 85, 9); shelfLamp('columns', W.dE, 68, 8, 116.5, 9);   // each beside a great fan of the long walls
  await Y();
  // E the arch
  shelfLamp('arch', W.aW, 39, 6, 147, 7.5); shelfLamp('arch', W.aE, 53, 7.5, 150.5, 7.5);
  // F the hall: THE GREAT SUN'S OWN ROW stands in the lake: fourteen GREAT LAMPS (flames of 0.9 m) on tall stalagmites along the foot
  // of the Sun's wall, 4 m to 7 m out from it, their flames 3 m to 9 m above the water (the hall is lit from below: the far wall's
  // foot is the brightest thing in it); six islets in the lake; ledges at several heights round
  // the rest of the wall. Nothing lights the crown.
  { const hy = [6, 13, 21, 9, 17, 27, 5, 15], sy = [5, 8.5, 3.5, 7, 9, 4.5, 6.5, 8, 3, 7.5, 5.5, 9, 4, 6.5];
    for (let k = 0; k < 14; k++) { const a = Math.PI * (0.14 + 0.72 * (k + 0.5) / 14), rr = 43 + 3 * (k % 2);
      standLamp('hall', hc[0] + rr * Math.cos(a), hc[2] + rr * Math.sin(a), sy[k] - 0.26, 10.5, 0.9 + 0.11 * sy[k], 0.6, 'stalagmite', 2.6); }
    await Y();
    for (const [x, z] of [[36, 172], [62, 178], [30, 202], [68, 200], [42, 226], [60, 216]]) standLamp('hall', x, z, 0.45, 8, 1.7, 0.42, 'islet');
    // THE DOORWAY'S OWN TWO stand inside its reveal, one at each jamb's foot, on a low shelf grown from the reveal's inner turn (the body's column i, 0.9 m over the water): beside the opening, not before it
    const revealLamp = (i) => lampAt(shelfPatch(R.hall, W.face, i, 8, { noise, size: 1.6 }), 8.5, 'shelf', 1.6);
    revealLamp(1);   // the west jamb's
    for (let k = 8; k < 16; k++) { const a = (k + 0.5) / 16 * Math.PI * 2, y = hy[k % 8], rr = H.r * Math.sqrt(1 - (y / H.h) ** 2), x = hc[0] + rr * Math.cos(a), z = hc[2] + rr * Math.sin(a);
      if (k !== 14) shelfLamp('hall', W.dome, x, y, z, [12, 12, 12, 9.5, 11, 10, 9, 14][k - 8]); else revealLamp(29); }   // the wall away from the Sun (the two beside the way in reach less far: the arch's faces are lit by their own); none on the near wall east of the doorway: the east jamb's stands in its place
    await Y();
    // THE HAND OF HANDS' OWN FOUR (shelves about it: the hand over the way out stands in light)
    const HHc = PLAN.handOfHands.c;
    for (const [dx, dy] of [[-9, -6], [9, -4], [-8, 7], [8.5, 9]]) { const x = HHc[0] + dx, y = HHc[1] + dy; shelfLamp('hall', W.dome, x, y, hc[2] - Math.sqrt(Math.max(0, 2500 * (1 - (y / 62) ** 2) - (x - 52) ** 2)), dy < 0 ? 9.5 : 12); } }   // the lower two reach less far: their pools end above the doorway's head
  await Y();
  // G the way out
  shelfLamp('out', W.oW, 72, 8, 146, 7.5); shelfLamp('out', W.oE, 88, 9, 150, 7.5); shelfLamp('out', W.oE, 88, 12.5, 159.5, 7.5);
  shelfLamp('out', W.last, 76.1, 9.2, 139.3, 6.5); shelfLamp('out', W.last, 81.4, 9.2, 139.3, 6.5);   // THE LAST WALL'S OWN TWO
  { const a = Pd(14, -8.5), b = Pd(20, 8.5), c = Pd(41, -8.5); shelfLamp('out', W.oN, a[0], 8, a[1], 12.5); shelfLamp('out', W.oE, b[0], 9, b[1], 12.5); shelfLamp('out', W.oN, c[0], 8, c[1], 12.5);
    // two on the end wall over the ring's seat: the sun about the ring stands in light
    for (const o of [-5.4, 5.4]) { const e = Pd(49.4, o); shelfLamp('out', W.end, e[0], 15.4, e[1], 11); } }
  await Y();
  style.setLamps(lampList);
  await Y();

  // ---- THE HANDS. Every count comes from countAt(place); the seed chooses places, sizes, pigments and which way a fork turns.
  const pig = [pal.red, pal.yellow, pal.black, pal.white], look = Math.floor(rng() * 3);   // the seed's look: red led, yellow led, black and white led
  const LEAD = [[0.62, 0.22, 0.10, 0.06], [0.22, 0.62, 0.10, 0.06], [0.14, 0.10, 0.42, 0.34]];
  const pickW = (w) => { let r = rng(), k = 0; while (k < 3 && r > w[k]) { r -= w[k]; k++; } return k; };
  let hands = 0; const pv = new THREE.Vector3(), SIX = PLAN.firstSix, bigHands = [], allHands = [];
  const named = [[56, 5.8, 0.3, 9], [52, 30, 247, 31], [80, 29.5, 166, 15], [80, 9, 139, 9.5]];   // a hand named in the brief is never covered
  const free = (p, r) => named.every((n) => Math.hypot(p.x - n[0], p.y - n[1], p.z - n[2]) > n[3] + r);
  // NOTHING GREAT IS PASSED CLOSE (a law of place): where the rock within 4 m of a hand's place comes nearer than 15 m to the flown
  // line, the hand stands no taller than 0.8 of that least distance (a hand of hands counts with its hands: 1.45 or 1.6 of its first
  // hand). THE MOUTH (the jambs, the great column, the mouth's face, the first 10 m of the gallery from it): nothing taller than 2.5 m. IN THE GALLERY no
  // hand lies over another hand (halos may meet, hands not). ON A WALL OF SEVERAL FACES a hand stands whole inside one face.
  const LN = []; for (let m = 0; m <= path.length; m += 2) { const q = path.posAtDist(m); LN.push(q.x, q.y, q.z); }
  const lineDist = (x, y, z) => { let b = 1e9; for (let k = 0; k < LN.length; k += 3) { const d = (LN[k] - x) ** 2 + (LN[k + 1] - y) ** 2 + (LN[k + 2] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  const faceDist = (pt, qi, qj) => { const P = pt.P, nu = pt.nu, W1 = nu - 1, k0 = (qi + qj * nu) * 3, kI = (Math.min(W1, qi + 1) + qj * nu) * 3, kJ = (qi + Math.min(pt.nv - 1, qj + 1) * nu) * 3;
    const cu = Math.max(0.3, Math.hypot(P[kI] - P[k0], P[kI + 1] - P[k0 + 1], P[kI + 2] - P[k0 + 2])), cv = Math.max(0.3, Math.hypot(P[kJ] - P[k0], P[kJ + 1] - P[k0 + 1], P[kJ + 2] - P[k0 + 2])); let b = 1e9;
    if (lineDist(P[k0], P[k0 + 1], P[k0 + 2]) > 22) return 99;   // nothing within 4 m of it can be nearer than 15 m
    for (const a of [-4, -2, 0, 2, 4]) for (const c of [-4, -2, 0, 2, 4]) { let i = qi + Math.round(a / cu); const jj = qj + Math.round(c / cv); if (pt.wrap) i = ((i % W1) + W1) % W1;
      if (i < 0 || i > W1 || jj < 0 || jj > pt.nv - 1) continue; const k = (i + jj * nu) * 3; if (P[k + 1] < 0) continue; b = Math.min(b, lineDist(P[k], P[k + 1], P[k + 2])); }
    return b; };
  const inMouth = (x, z) => x > 64 && x < 96 && z > 155.5 && z < 177;
  // NEAR FACES KEEP THEIR HANDS WHOLE (a law of place): a hand on rock nearer than 14 m to the flown line (and every hand of the first
  // gallery) is written down here with its own radius, its halo's radius and the foot of its run of pigment; no later stencil's
  // dense band, spatter or run may reach its hand, nor its halo or run a later hand (halos may meet at their rims). A hand further
  // off whose halo could reach such rock is written down too (its last number 0): it bars the near hands only, so far walls crowd.
  const NEAR = []; for (let k = 0; k < overL.length; k += 4) NEAR.push(overL[k], overL[k + 1], overL[k + 2], overL[k + 3], overL[k + 3], 0, 0, 2);   // no hand's own shape lies over the round kept bare over a flame (its halo may reach it; a hand with a place of its own keeps its place)
  const haloOf = (tall, Rh) => (SPRAY_D0 * Rh + 0.8 * Math.min(SPRAY_W, SPRAY_WM / tall) * Math.max(0.6, Math.min(1, Rh))) * tall;
  const nearOk = (p, rh, ro, nr, own) => { for (let k = 0; k < NEAR.length; k += 8) { if ((!nr && !NEAR[k + 7]) || (own && NEAR[k + 7] === 2)) continue; const dy = p.y - NEAR[k + 1], dh = Math.hypot(NEAR[k] - p.x, NEAR[k + 2] - p.z);
    if (NEAR[k + 7] === 2) { if ((dh / (0.7 * rh + NEAR[k + 3])) ** 2 + (dy / (0.95 * rh + NEAR[k + 3])) ** 2 < 1) return false; continue; }   // the round over a flame: the hand's own shape (0.4 of its height either way, 0.55 up and down) clear of it
    if (Math.hypot(dh, dy) < Math.max(rh + NEAR[k + 4], ro + NEAR[k + 3])) return false;
    if (NEAR[k + 5] > 0 && dh < NEAR[k + 5] + rh && dy < 0 && p.y + rh > NEAR[k + 6]) return false; } return true; };
  const runFree = (p, tall, foot) => { for (let k = 0; k < NEAR.length; k += 8) if (Math.hypot(NEAR[k] - p.x, NEAR[k + 2] - p.z) < 0.5 * tall + NEAR[k + 3] && NEAR[k + 1] < p.y && NEAR[k + 1] + NEAR[k + 3] > foot) return false; return true; };
  // WHITE AND YELLOW ON PALE ROCK: a white-led stencil stands on an under-field of red or black (by its own number), a yellow-led one on red; the shader shows it where the rock is in the two upper tones
  const rimOf = (col, seed) => col === pal.white ? (hhJ(seed * 3.7) < 0.5 ? 1 : 2) : col === pal.yellow ? 1 : 0;
  const pm = new THREE.Vector3(), rounds = [], leftOut = [], SUNS = [], KEPT = [];
  // sixteen places about a middle p on its face (normal n), on rounds of ro and 0.55 ro: none more than 0.3 m inside the ground that is not the middle's (g0: the middle's metres inside the soot)
  const oneGround = (p, nx, ny, nz, ro, g0) => { const l = Math.hypot(nx, nz), ax = l > 1e-3 ? -nz / l : 1, az = l > 1e-3 ? nx / l : 0, bx = ny * az, by = nz * ax - nx * az, bz = -ny * ax;
    for (let k = 0; k < 16; k++) { const a = k * 0.3927, r = k % 2 ? ro : 0.55 * ro, c = Math.cos(a) * r, sn = Math.sin(a) * r, g = groundAt(p.x + ax * c + bx * sn, p.y + by * sn, p.z + az * c + bz * sn)[0]; if (g0 > 0 ? g < -0.3 : g > 0.3) return false; }
    return true; };
  // what stands of each group laid by name (tally: how many; hands whose fingers are hands apart)
  const tally = {}, tl = (name, ok) => { if (ok) { const k = name + (rounds[rounds.length - 1] & 2 ? ', hands of hands' : ''); tally[k] = (tally[k] || 0) + 1; } return ok; };
  const sunFree = (p, rh, own) => { for (const L of own ? [SUNS] : [SUNS, KEPT]) for (let k = 0; k < L.length; k += 4) if (Math.hypot(L[k] - p.x, L[k + 1] - p.y, L[k + 2] - p.z) < Math.max(rh, L[k + 3])) return false; return true; };
  let drawnCi = 0;   // the column of its wall the last hand laid was drawn about (after it was moved into its face)
  const hand = (room, pt, ci, cj, tall, w, extra) => {
    const seed = 1 + Math.round(rng() * 7200) / 8, col = pig[pickW(w)], Rr = 0.85 + rng() * 0.35, rot = (rng() - 0.5) * 0.7, side = rng() < 0.5 ? -1 : 1, W1 = pt.nu - 1;
    let qi = pt.wrap ? ((Math.round(ci) % W1) + W1) % W1 : Math.round(Math.max(0, Math.min(W1, ci))); const qj = Math.round(Math.max(0, Math.min(pt.nv - 1, cj))), frame = pt === W.dome;
    // THE ONE POINT A HAND STANDS AT (pm) is the point its stencil is drawn about (stampMiddle: on the vault, where every stencil is laid
    // flat, the grid's point nearest the place asked; on every other wall the place itself). Every law below that reads where the hand
    // stands reads it at pm, and the lists and the paint take the same pm; the grid's point nearest the place (qi, qj) gives only the
    // rock's normal and the rock about the hand
    stampMiddle(pt, ci, cj, frame, pm);
    if (room === 'out' && ((pm.x < 74 && pm.z > 153.8) || (pm.x > 86 && pm.x < 90 && pm.z > 162.2))) return false;   // no hand behind the mouth's face of rock
    if (pm.y < 0.3 || (!(extra && extra.force) && !free(pm, tall * Rr))) return false;
    // the count, the law's distance (the least of the rock within 4 m, read at the grid's points about the hand, and of pm itself) and
    // the sizes are taken AT pm: after the hand is moved into its face they are taken again at its new pm
    let c = null, vis = 1, fd = 0;
    for (let pass = 0; ; pass++) {
      const c1 = countAt(pm.x, pm.y, pm.z), v1 = c1.level === 2 ? 1.6 : c1.level === 1 ? 1.45 : 1;
      if (c && v1 > vis) tall *= vis / v1;   // moved to a place of another kind: its whole breadth stays what its face allowed
      c = c1; vis = v1; fd = Math.min(faceDist(pt, qi, qj), lineDist(pm.x, pm.y, pm.z));
      if (fd < 15) tall = Math.min(tall, 0.8 * fd / vis);
      if (inMouth(pm.x, pm.z)) tall = Math.min(tall, 2.5 / vis);
      if (room === 'out') tall = Math.min(tall, 4.5 / vis);   // the ring is the way out's subject: nothing over 4.5 m on its walls
      if (!(extra && (extra.force || extra.keep)) && pt !== W.last && tall * vis > 2 && style.lawOfLight(pm, null, 0) * 0.88 < TONE_T[1]) tall = 2 / vis;   // A HAND TALLER THAN 2 M STANDS IN LIGHT: where the rock at its middle is under the second tone it is laid 2 m tall
      if (tall < 0.5) return false;
      if (!pt.faces || pass === 3) break;
      const hw = 0.5 * tall * vis / pt.du, c0 = ci; let ok = false;
      for (const f of pt.faces) if (!ok && qi >= f[0] && qi <= f[1]) { if (f[1] - f[0] < 2 * hw + 0.5) return false; ci = Math.max(f[0] + hw, Math.min(f[1] - hw, ci)); ok = true; }
      if (ci === c0) break; qi = Math.round(Math.max(0, Math.min(W1, ci))); stampMiddle(pt, ci, cj, frame, pm); }
    const Re = (extra && extra.R) || Rr, rt = extra && extra.rot !== undefined ? extra.rot : rot, sun = c.N > 23.5, rh = c.level ? PP_R[c.level - 1] * tall : (sun ? 0.52 : 0.58) * tall, ro = c.level ? rh : rh + haloOf(tall, Re);
    const nr = fd < 14 || room === 'gallery';
    if (!nearOk(pm, rh, ro, nr, extra && extra.force)) return false;
    // ONE GROUND, AND NO SUN ON A SUN, near or far, both taken at pm, THE MIDDLE THE STENCIL IS DRAWN ABOUT (stampMiddle: on the vault,
    // where every stencil is laid flat, the grid's point nearest the place asked; on every other wall the place itself): a stencil is left out
    // when one of the sixteen places tried about pm (oneGround: on rounds of its reach ro, its shape and its spray, and of 0.55 ro) lies more than 0.3 m inside the other ground; so is a plain sun
    // whose middle would stand within another plain sun's own round or which would hold another's middle (a place kept for a sun laid
    // later counts as that sun). The same pm goes into the suns' list and the rounds, and the paint is led by the ground at pm.
    const qn = (qi + qj * pt.nu) * 3, g0 = groundAt(pm.x, pm.y, pm.z)[0], own = !!(extra && extra.force);
    if (!oneGround(pm, pt.Nn[qn], pt.Nn[qn + 1], pt.Nn[qn + 2], ro, g0)) { leftOut.push(pm.x, pm.y, pm.z, 1, own ? 1 : 0); return false; }
    if (sun && !c.level && !sunFree(pm, rh, own)) { leftOut.push(pm.x, pm.y, pm.z, 2, own ? 1 : 0); return false; }
    if (sun && !c.level) SUNS.push(pm.x, pm.y, pm.z, rh);
    rounds.push(pm.x, pm.y, pm.z, rh, ro, pt.Nn[qn], pt.Nn[qn + 1], pt.Nn[qn + 2], g0 > 0 ? 1 : 0, (sun ? 1 : 0) + (c.level ? 2 : 0) + (own ? 4 : 0));
    const foot = pm.y - (0.66 + Math.min(0.7, 2 / tall)) * tall, runs = !c.level && !sun && !pt.wrap && pt.yb !== undefined && Math.abs(rt) < 0.45 && runFree(pm, tall, foot);
    if (nr || fd < 18.5 + ro) NEAR.push(pm.x, pm.y, pm.z, rh, ro, runs ? 0.5 * tall : 0, foot, nr ? 1 : 0);
    const qk = qn, onSoot = g0 > 0;   // ON SOOT THE PAINT IS WHITE OR YELLOW (three in five white, by the hand's own number), with no under-field
    stamp(R[room], pt, { ci, cj, tall, N: c.N, wrong: c.wrong, level: c.level, seed, color: onSoot ? (hhJ(seed * 5.3) < 0.6 ? pal.white : pal.yellow) : col, R: Rr, rot, side, rim: onSoot ? 0 : rimOf(col, seed), norun: !runs, ...extra, frame }); hands++;
    if (tall * vis >= 1.7) bigHands.push({ p: [pm.x, pm.y, pm.z], n: [-pt.Nn[qk], -pt.Nn[qk + 1], -pt.Nn[qk + 2]], tall: tall * vis, N: c.N, wrong: c.wrong, level: c.level, room });
    allHands.push(pm.x, pm.y, pm.z, tall * vis, c.N); drawnCi = ci;
    return true;
  };
  // clusters of hands along a wall. o: y0, y1 (heights of the centres), t0, t1 (sizes), w (the leading pigments), big (how many of 2 to 3 m), every (metres between clusters)
  // NO WALL STANDS BARE BESIDE THE LINE: where a wall within 14 m of the flown line has no hand within 1.5 m of a place (asked every
  // 2.4 m along it, in rows 2.4 m apart), a small whole hand of 0.6 to 1.2 m of the place's own count is laid there
  const bare = (p) => { for (let k = 0; k < NEAR.length; k += 8) if (Math.hypot(NEAR[k] - p.x, NEAR[k + 1] - p.y, NEAR[k + 2] - p.z) - NEAR[k + 3] < 1.5) return false; return true; };
  const fill = (room, pt, y0, y1, w, cjOf, di = 2.4 / pt.du) => { const rows = Math.max(1, Math.round((y1 - y0) / 2.4));
    for (let r = 0; r < rows; r++) for (let ci = (0.5 + 0.5 * (r % 2)) * di; ci < pt.nu - 1 - 0.4 * di; ci += di) { const y = y0 + (r + 0.3 + 0.4 * rng()) * (y1 - y0) / rows, cj = cjOf ? cjOf(y) : (y - pt.yb) / pt.dy;
      stampMiddle(pt, ci, cj, pt === W.dome, pv); if (lineDist(pv.x, pv.y, pv.z) < 14 && bare(pv)) hand(room, pt, ci, cj, 0.6 + 0.6 * rng(), w); } };
  const wallHands = async (room, pt, n, o) => {
    const nc = Math.max(1, Math.round(pt.L / (o.every || 7))), cl = [];
    for (let c = 0; c < nc; c++) cl.push([(c + 0.2 + 0.6 * rng()) / nc * pt.L, rng() < 0.7 ? o.w : LEAD[Math.floor(rng() * 3)]]);
    n = Math.round(n * detail);
    for (let k = 0; k < n; k++) {
      const c = cl[k % nc], s = c[0] + rng.gauss() * (o.spread || 2.4), y = o.y0 + (o.y1 - o.y0) * Math.pow(rng(), 1.4), tall = k < (o.big || 0) ? 2 + rng() : o.t0 + (o.t1 - o.t0) * rng() * rng();
      if (k % 20 === 19) await Y();
      if (s < 1 || s > pt.L - 1) continue;
      if (!hand(room, pt, s / pt.du, (y - pt.yb) / pt.dy, tall, c[1]) && room === 'gallery') for (let t = 0; t < 3; t++) if (hand(room, pt, (1.5 + rng() * (pt.L - 3)) / pt.du, (o.y0 + (o.y1 - o.y0) * rng() - pt.yb) / pt.dy, tall, c[1])) break;
    }
  };
  lineMetres(); await Y();   // the line is sampled for the count in a step of its own
  // ---- FIRST THE HANDS WITH A PLACE OF THEIR OWN (the same on every visit), the greatest first, so that each stands whole; then the
  // fresh hands' sites; then four great hands on each column; then the many, each where the hands already there leave it room.
  // A the gallery: FIVE and sound, every one
  // laid first, so each has its place: on the north wall beside the Six two of 2.6 and 2.8 m and four fives of 1.3 to 2.4 m (4 m and
  // more from the white disc's edge): the Six is never alone in its picture; and two of 2.8 and 3 m on each wall by the way in
  for (const [x, y, tall] of [[46.5, 4.3, 2.8], [41.5, 5.2, 2.6], [48.3, 9.6, 1.5], [44.2, 9.4, 2.4], [43.6, 13.4, 1.4], [49, 13.2, 1.3], [20, 4.6, 3], [27, 8.8, 2.8]]) hand('gallery', W.gN, (56.5 - x) / W.gN.du, (y - W.gN.yb) / W.gN.dy, tall, LEAD[look], { force: true, R: 0.85, rot: (rng() - 0.5) * 0.3 }); await Y();
  // twelve plain fives of 1.2 to 2 m over the passage's opening in two staggered rows (clear of the two lamps there) and above them, and
  // five of 1.4 to 2 m on the south wall by the opening, with that wall's two of 3 and 2.8 m (nothing within 4 m of the Six's disc).
  // The low five at the opening's east end is laid before the five over it: a run of pigment never reaches a hand already laid, so
  // the upper five's pigment does not run and both stand
  for (const [x, y, tall] of [[39.5, 6.5, 1.9], [43.7, 6.5, 1.7], [47.6, 6.5, 1.8], [37.1, 8.2, 1.5], [41.7, 8.2, 1.6], [45.4, 8.2, 1.4], [51, 5.9, 1.2], [49.9, 8.2, 1.5], [41.6, 11.9, 1.9], [45.4, 12.4, 1.5], [50.2, 12.2, 1.4], [37.6, 13, 2]]) hand('gallery', W.gL, (x - 35.5) / W.gL.du, (y - W.gL.yb) / W.gL.dy, tall, LEAD[look], { force: true, rot: (rng() - 0.5) * 0.4 }); await Y();
  for (const [x, y, tall] of [[34.9, 5, 1.8], [31.3, 3.4, 2], [28.8, 7, 1.7], [30.2, 9.4, 1.5], [34.6, 11.2, 1.4], [24, 5, 3], [18, 6, 2.8]]) hand('gallery', W.gS, (x + 21) / W.gS.du, (y - W.gS.yb) / W.gS.dy, tall, LEAD[look], { force: true, rot: (rng() - 0.5) * 0.4 }); await Y();
  // THE FIRST SIX: five fingers and a thumb, 7 m tall: a DARK hand (the black field shows through it) in a white halo. The same on every seed.
  { const ci = (7 - SIX.c[2]) / W.six.du, cj = (SIX.c[1] - 0.04 * SIX.tall - W.six.yb) / W.six.dy, o = { ci, cj, tall: SIX.tall, N: 6, seed: 77, rot: 0, side: 1 };
    stamp(R.gallery, W.six, { ...o, color: pal.black, R: 1.3, field: true }); stamp(R.gallery, W.six, { ...o, color: pal.white, R: 0.87, heavy: true, spread: true }); hands++; }
  await Y();
  // E the arch: on each of its two smooth faces FOUR WHOLE FANS of ten to thirteen (joins and bends), 4 m or as tall as the place
  // allows, apart so that no halo reaches another's hand
  for (const pt of [W.aW, W.aE]) for (const [z, y] of [[142.4, 4.4], [146.4, 9.8], [150.2, 4.2], [153.2, 9.6]]) { await Y();
    hand('arch', pt, (pt === W.aW ? z - 139.5 : 157.5 - z) / pt.du, (y - pt.yb) / pt.dy, 4, pt === W.aW ? [0.6, 0.2, 0.1, 0.1] : [0.15, 0.6, 0.1, 0.15], { force: true, rot: (rng() - 0.5) * 0.3, R: 0.8 }); }
  await Y();
  // F the hall. The dome's grid place of a point: i around, j up
  const DM = W.dome, domeIJ = (x, y, z) => { const a = (Math.atan2(z - hc[2], x - hc[0]) + Math.PI * 2) % (Math.PI * 2), e = Math.asin(Math.max(0, Math.min(0.999, y / H.h)));
    return [a / (Math.PI * 2) * (DM.nu - 1), (e / (Math.PI / 2 * 0.985) + 0.012) / 1.012 * (DM.nv - 1)]; };
  const inDoor = (x, y, z) => (z < 176 && x > 30 && x < 62 && wayinD(x, y) < 5) || (z < 180 && x > 64 && x < 96 && mouthD(x, y) < 5);
  const domeHand = (x, y, z, tall, w, extra) => { const [ci, cj] = domeIJ(x, y, z); stampMiddle(DM, ci, cj, true, pv); if (inDoor(pv.x, pv.y, pv.z)) { rng(); rng(); rng(); rng(); rng(); return false; } return hand('hall', DM, ci, cj, tall, w, extra); };
  // the count a hand asked at a place of the vault would carry: the count at the point its stencil is drawn about
  const domeCount = (x, y, z) => { const [ci, cj] = domeIJ(x, y, z); stampMiddle(DM, ci, cj, true, pv); return countAt(pv.x, pv.y, pv.z); };
  // the hall's wall to either side of the arch and east of the mouth: seven of 5.5 to 8 m, each as tall as its place allows
  for (const [x, y, tall] of [[29.5, 9.5, 8], [19.5, 13.5, 7.5], [61.5, 8.5, 5.5], [66.8, 16.5, 6.5], [94.5, 9.5, 7.5], [101.5, 12, 8], [97.5, 20.5, 6.5]]) { await Y(); const rr2 = 2500 * (1 - (y / 62) ** 2) - (x - 52) ** 2;
    domeHand(x, y, hc[2] - Math.sqrt(Math.max(0, rr2)), tall, x < 52 ? [0.55, 0.25, 0.1, 0.1] : [0.2, 0.2, 0.1, 0.5], { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 }); }
  // the great column at the mouth: five suns of 2.4 m (its place's count) on its side toward the hall, one over another in two files
  for (const [da, y] of [[-0.7, 3.8], [0.7, 3.8], [0, 7.4], [-0.6, 12.2], [0.6, 12.2]]) hand('hall', W.pier, ((1.15 + da) / (Math.PI * 2) + 1) % 1 * (W.pier.nu - 1), (y + 0.5) / W.pier.dy, 2.4, LEAD[(look + 1) % 3], { force: true, R: 0.8, rot: 0 });
  // G the way out: suns and hands whose fingers are hands; THE LAST WALL: fourteen whole suns; a sun about the ring's seat
  const OW = [0.4, 0.14, 0.06, 0.4];
  // first two of 2.4 m on the east jamb (the mouth's own measure)
  for (const [z, y] of [[160, 4.6], [157, 9]]) hand('out', W.oE, (170.5 - z) / W.oE.du, (y - W.oE.yb) / W.oE.dy, 2.4, OW, { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 });
  // one of 5 m on each wall of the gallery from the mouth, two on each wall of the last gallery
  hand('out', W.oE, (170.5 - 150) / W.oE.du, (7 - W.oE.yb) / W.oE.dy, 5, OW, { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 }); hand('out', W.oW, (148 - 138) / W.oW.du, (7 - W.oW.yb) / W.oW.dy, 5, OW, { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 });
  for (const [pt, ci] of [[W.oN, (52 - 18) / W.oN.du], [W.oN, (52 - 31) / W.oN.du], [W.oE, (20.4 + 12) / W.oE.du], [W.oE, (20.4 + 21) / W.oE.du]]) hand('out', pt, ci, (6.5 - pt.yb) / pt.dy, 5, OW, { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 });
  // THE LAST WALL: fourteen WHOLE suns by the count of its place (56), 2 to 4.1 m, the greatest at the middle at its lamps'
  // height, apart so that no halo reaches another's sun; the top tone from edge to edge: the bright wall at the end of the throat
  { const L = W.last;
    await Y();
    for (const [x, y, tall] of [[78.75, 8.6, 4.1], [73.7, 8.4, 3.3], [83.8, 8.4, 3.2], [76.3, 3.7, 2.7], [81.2, 3.6, 2.7], [72.6, 3.4, 2.1], [85, 3.3, 2], [76.2, 13.5, 2.8], [81.3, 13.5, 2.8], [72.5, 13, 2.2], [85, 12.6, 2.2], [78.75, 17.3, 2.5], [74.5, 17, 2.1], [83.1, 16.9, 2.1]])
      hand('out', L, (86.5 - x) / L.du, (y - L.yb) / L.dy, tall, tall > 4 ? [1, 0, 0, 0] : [0.45, 0.3, 0.2, 0.05], { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 });   // the greatest in red; little white on the brightest wall
    await Y(); const E = W.end; stamp(R.out, E, { ci: 9 / E.du, cj: (7 - E.yb) / E.dy, tall: 36, N: 64, seed: 9, rot: 0, side: 1, color: pal.yellow, R: 0.62 }); stamp(R.out, E, { ci: 9 / E.du, cj: (7 - E.yb) / E.dy, tall: 19, N: 64, seed: 9, rot: 0, side: 1, color: pal.white, R: 0.4 }); hands++; }   // on soot: the sun of 36 m in yellow over the whole wall, and over it the same sun 19 m across in white, close about the ring's seat
  await Y();
  // ---- FRESH HANDS, laid before the many so that each has its place: sites every 9 to 14 m of the flown line (none abeam from 28 m to 60 m flown, none after 350 m), left and right in turn, on the rock 5 to 9.5 m from it. Each takes
  // the METRES FLOWN alone: from 18 m to 8 m before its site is abeam the cloud blooms, hangs (the halo comes whole under it), thins.
  // A FRESH HAND'S SITE IS ONE WHERE IT STANDS WHOLE: on one ground, as every other stencil (the sixteen places about its middle, which
  // is the grid's own point), and on a wall of several faces not within its own half breadth of its face's edge
  const fresh = [], siteOk = (pt, i, k, tall) => { const P = pt.P, c = countAt(P[k], P[k + 1], P[k + 2]), rh = c.level ? PP_R[c.level - 1] * tall : 0.58 * tall, ro = c.level ? rh : rh + haloOf(tall, 1.05);
    if (pt.faces) { const hw = 0.5 * tall * (c.level === 2 ? 1.6 : c.level === 1 ? 1.45 : 1) / pt.du; for (const f of pt.faces) if (i >= f[0] && i <= f[1] && (i < f[0] + hw || i > f[1] - hw)) return false; }
    return oneGround(pm.set(P[k], P[k + 1], P[k + 2]), pt.Nn[k], pt.Nn[k + 1], pt.Nn[k + 2], ro, groundAt(P[k], P[k + 1], P[k + 2])[0]); };
  { let m = 20 + rng() * 3, sd = rng() < 0.5 ? -1 : 1, cnt = 0;
    while (m < Math.min(350, path.length - 45)) {   // no site abeam after 350 m flown: the last cloud has thinned by 342 m, before the bend uncovers the ring
      if (m > 28 && m < 60) m = 60 + rng() * 3;   // none abeam from 28 m to 60 m flown: none beside the First Six (one may come before it in the first gallery, far from its disc)
      const p = path.posAtDist(m), t = path.tangentAtDist(m), l = Math.hypot(t.x, t.z) || 1, nx = -t.z / l * sd, nz = t.x / l * sd;
      const ty = Math.max(1.5, p.y + rng() * 2 - 0.4), tall = 0.7 + 0.7 * rng(), seed = 1 + Math.round(rng() * 7200) / 8, col = pig[pickW(LEAD[look])], rot = (rng() - 0.5) * 0.6, tx = p.x + nx * 7, tz = p.z + nz * 7;
      let best = 40, bp = null, bi = 0, bj = 0, br = '';
      for (const room of Object.keys(R)) for (const pt of R[room].patches) { if (pt.stand) continue; const P = pt.P, nu = pt.nu;
        if (!pt.box) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (let k = 0; k < P.length; k += 3) { if (P[k] < a) a = P[k]; if (P[k] > b) b = P[k]; if (P[k + 2] < c) c = P[k + 2]; if (P[k + 2] > d) d = P[k + 2]; } pt.box = [a, b, c, d]; }
        if (tx < pt.box[0] - 7 || tx > pt.box[1] + 7 || tz < pt.box[2] - 7 || tz > pt.box[3] + 7) continue;   // best starts at 40 (a square of distance): nothing farther than 6.4 m is taken
        for (let j = 1; j < pt.nv - 1; j++) for (let i = 1; i < nu - 1; i++) { const k = (i + j * nu) * 3, dx = P[k] - tx, dy = P[k + 1] - ty, dz = P[k + 2] - tz, d = dx * dx + dy * dy + dz * dz;
          if (d < best && pt.mask[i + j * (nu - 1)] && P[k + 1] > 1.1) { const hd = Math.hypot(P[k] - p.x, P[k + 2] - p.z); if (hd > 5 && hd < 9.5 && (P[k] - p.x) * nx + (P[k + 2] - p.z) * nz > 4 && siteOk(pt, i, k, tall)) { best = d; bp = pt; bi = i; bj = j; br = room; } } } }
      if (bp) { bp.at(bi, bj, pv); const c = countAt(pv.x, pv.y, pv.z), k = (bi + bj * bp.nu) * 3, rh = c.level ? PP_R[c.level - 1] * tall : 0.58 * tall, ro = c.level ? rh : rh + haloOf(tall, 1.05);
        const Q = bp.P, wd = (q) => Math.hypot(Q[q] - Q[k], Q[q + 1] - Q[k + 1], Q[q + 2] - Q[k + 2]), un = (a, b) => Math.max(a, b) > 1.25 * Math.min(a, b), flat = bp === W.dome || un(wd(k - 3), wd(k + 3)) || un(wd(k - 3 * bp.nu), wd(k + 3 * bp.nu));
        if (free(pv, tall) && nearOk(pv, rh, ro, true)) { NEAR.push(pv.x, pv.y, pv.z, rh, ro, 0, 0, 1);
        stamp(R[br], bp, { ci: bi, cj: bj, tall, N: c.N, wrong: c.wrong, level: c.level, seed, color: col, R: 1.05, rot, side: 1, born: m, frame: flat, rim: rimOf(col, seed), norun: true });   // flat: laid by the rock's own metres on the vault, and wherever the two cells to either side of its site, or the two above and below it, differ in breadth by more than a quarter
        fresh.push({ m, p: [pv.x, pv.y, pv.z], n: [-bp.Nn[k], -bp.Nn[k + 1], -bp.Nn[k + 2]], tall, color: col, room: br, count: c.N }); hands++; } }
      m += 9 + rng() * 5; sd = -sd; if (++cnt % 4 === 0) await Y();
    } }

  // ---- then the columns' great hands: four of 2.7 or 3 m at the eye's heights on each column's side toward the flown line (by place)
  for (let c = 0; c < W.cols.length; c++) { const pt = W.cols[c], w = LEAD[(look + c) % 3];
    const [cx, cz, cr] = D.list[c], q = path.pointAt(path.nearestXZ(cx, cz).u), a0 = Math.atan2(q.z - cz, q.x - cx);
    [[-1.15, 3.3], [-0.38, 6.4], [0.38, 3.0], [1.15, 6.1]].forEach(([da, y]) => { const a = ((a0 + da + (rng() - 0.5) * 0.2) / (Math.PI * 2) + 2) % 1;
      hand('columns', pt, a * (pt.nu - 1), (y + rng() + 0.5) / 19.5 * (pt.nv - 1), cr < 1.2 ? 2.7 : 3, w, { rot: (rng() - 0.5) * 0.3, R: 0.8 }); }); await Y(); }
  // ---- THE MANY
  await wallHands('gallery', W.gN, 185, { y0: 1.3, y1: 9.5, t0: 0.7, t1: 1.9, big: 13, w: LEAD[look] }); await Y();
  await wallHands('gallery', W.gS, 150, { y0: 1.3, y1: 9.5, t0: 0.7, t1: 1.9, big: 11, w: LEAD[look] }); await Y();
  fill('gallery', W.gN, 1.4, 9.4, LEAD[look]); await Y(); fill('gallery', W.gS, 1.4, 9.4, LEAD[look]); fill('gallery', W.gL, 5.6, 9.2, LEAD[look]); await Y();
  // C the low passage. THE WALLS carry its hands at the eye's height: whole hands of 1.4 to 2.2 m between 0.8 m and 3.6 m above the
  // water, asked every 3.47 m along the east wall and every 2.75 m along the west (each lamp on the ledges stands midway between two;
  // the round kept bare over it bars only a hand whose own shape would lie on it), in the leading pigments. The vault's middle carries no hand (its haunches' hands are laid last).
  for (let k = 0; k < 63; k++) rng();   // the vault's middle carries no hand: the turns of the seed that seven small hands there took are taken unused, so that what is laid after keeps its turn
  for (const [pt, s0, ds, t1] of [[W.pE, 4.73, 3.467, 2.2], [W.pW, 1.71, 2.75, 1.8]]) { const got = [];   // the hands standing on this wall: metres along it, height
    const lay = (sa, cj, tall, R) => { const ok = hand('passage', pt, sa / pt.du, cj, tall, LEAD[look], { R, rot: (rng() - 0.5) * 0.3 }); if (ok) got.push([drawnCi * pt.du, tall]); return ok; };
    for (let s = s0; s < pt.L - 1.4; s += ds) { const tall = 1.4 + (t1 - 1.4) * rng(), lo = 0.8 + 0.46 * tall, y = lo + rng() * Math.max(0, 3.3 - 0.54 * tall - lo);
      let ok = lay(s + 0.3 * (rng() - 0.5), 3 + (y - 1.5) / 0.8, tall, 1);
      // where its place is taken (a fresh hand's site, a neighbour's halo) a hand of 1.4 m is laid beside it, low or high, the nearest place first
      for (const d of [0, 0.8, -0.8, 1.6, -1.6]) for (const cj of [3, 4]) if (!ok) ok = lay(s + d, cj, 1.4, 0.85); }
    // NO STRETCH OF A PASSAGE WALL LONGER THAN 5 M STANDS BARE: where the shapes of two neighbours (0.3 of a hand's height either way)
    // leave more than 4.4 m, hands of 1.4, 1.1 and 0.8 m are tried along that stretch from its middle outward, low and high
    for (let pass = 0; pass < 3; pass++) { got.sort((p, q) => p[0] - q[0]); let at = 0.6; const gaps = [];
      for (const [sa, t] of [...got, [pt.L - 0.6, 0]]) { if (sa - 0.3 * t - at > 4.4) gaps.push([at, sa - 0.3 * t]); at = Math.max(at, sa + 0.3 * t); }
      if (!gaps.length) break;
      for (const [g0, g1] of gaps) { let ok = false; const mid = (g0 + g1) / 2;
        for (const tall of [1.4, 1.1, 0.8]) for (let d = 0; d < (g1 - g0) / 2 - 0.3; d += 0.4) for (const sg of [1, -1]) for (const cj of [3, 4]) if (!ok) ok = lay(mid + sg * d, cj, tall, 0.85); } } }
  await Y();
  for (const pt of [W.pW, W.pE]) fill('passage', pt, 1.3, 3.1, LEAD[look], (y) => 3 + (y - 1.5) / 0.8);
  await Y();
  // D the columns: each wrapped in rising bands of hands (seven to nine; from the middle on one in three forks); the chamber's walls
  for (let c = 0; c < W.cols.length; c++) { const pt = W.cols[c], n = Math.round(25 * detail), turn = (c % 2 ? -1 : 1) * (2.2 + rng()), w = LEAD[(look + c) % 3], o0 = rng() * 12;
    for (let k = 0; k < n; k++) { hand('columns', pt, o0 + k * turn + rng(), 1.3 + k * (pt.nv - 5) / n + rng() * 0.6, 1.0 + 0.8 * rng(), w); if (k % 13 === 12) await Y(); } }
  await Y();
  for (let c = 0; c < W.cols.length; c++) { const pt = W.cols[c]; fill('columns', pt, 1.6, 10, LEAD[(look + c) % 3], (y) => (y + 0.5) / 19.5 * (pt.nv - 1), 3); if (c % 4 === 3) await Y(); }
  for (const pt of [W.dW, W.dE]) { await wallHands('columns', pt, 52, { y0: 1.5, y1: 12, t0: 1.0, t1: 2.4, big: 10, w: LEAD[(look + 1) % 3], every: 8 }); await Y(); }
  // three of 5.5 m on each long wall, laid over the small ones (the walls are 20 m and more from the line)
  for (const [pt, zs] of [[W.dW, [76, 101, 133]], [W.dE, [79, 112, 121]]]) for (const z of zs) hand('columns', pt, (pt === W.dW ? z - 65 : 141 - z) / pt.du, (6.5 - pt.yb) / pt.dy, 5.5, LEAD[look], { force: true, R: 0.8, rot: (rng() - 0.5) * 0.3 });
  for (const pt of [W.dN1, W.dN2, W.dS1, W.dS2]) await wallHands('columns', pt, 15, { y0: 1.5, y1: 11, t0: 0.8, t1: 1.8, big: 2, w: LEAD[(look + 2) % 3], every: 8 });
  for (const pt of [W.dN1, W.dN2, W.dS1, W.dS2]) fill('columns', pt, 1.5, 9.5, LEAD[(look + 2) % 3]); await Y();
  // THE GREAT SUN: a round palm 12 m across, 48 fingers all the way round, 30 m across: bare pale rock in a SOLID RED FIELD out to the tips' circle, a red spattered rim outward
  const SUN = PLAN.greatSun.c, sunO = (() => { const [ci, cj] = domeIJ(SUN[0], SUN[1], SUN[2]); return { ci, cj, tall: 30, N: 48, seed: 5, rot: 0, side: 1, frame: true }; })();
  // ITS ARM: bare rock 5 m broad from the palm down to the waterline, the same solid red 1.5 m broad down both flanks, then spatter; again in the lake
  stamp(R.hall, DM, { ...sunO, arm: true, color: pal.red, R: 0.55, heavy: true }); hands++; await Y();
  // its two rings of smaller suns, by the count of their places: on the side the line comes from 40 fingers in the first and 39 or 40
  // in the second, on the side it leaves by 48 (no white about the Sun: yellow and black in the first, red among them in the second), then the vault's hands, large and ordered in rings about it, each pointing away from it
  const ringAt = (rho, b) => [SUN[0] - rho * Math.cos(b), SUN[1] + rho * Math.sin(b) * 0.92, SUN[2]];
  for (const [rho, n, tall] of [[20.5, 10, 9.6], [29.5, 13, 7.5]]) for (let k = 0; k < n; k++) { await Y(); const b = (k + 0.5 * (n % 2)) / n * Math.PI * 2, q = ringAt(rho, b);
    if (q[1] > 3.5) { for (const dr of [0, 2, 4, 6]) { const q1 = ringAt(rho + dr, b); if (domeHand(q1[0], q1[1], q1[2], tall, rho < 22 ? [0, 0.5, 0.5, 0] : [0.3, 0.3, 0.4, 0], { force: true, R: 0.74, rot: b - Math.PI / 2 })) break; } }   // where the wall comes within 14 m of the line a sun of the ring stands further out, clear of its neighbour's spray
    else { rng(); rng(); rng(); rng(); rng(); } }
  await Y();
  const RW = [[0.1, 0.15, 0.1, 0.65], [0.65, 0.2, 0.1, 0.05], [0.1, 0.1, 0.7, 0.1], [0.15, 0.65, 0.1, 0.1]];
  const RT = [9.2, 7.8, 6.4, 5.2, 4.2, 3.4];   // six rings asked, LARGER TOWARD THE SUN (the Sun's own guard and the vault's bounds leave the second standing)
  for (const [ri, rho] of [38.5, 48.5, 58, 68, 79, 91].entries()) { const n = Math.round(2 * Math.PI * rho / (1.45 * RT[ri]) * (0.7 + 0.3 * detail));
    for (let k = 0; k < n; k++) { if (k % 4 === 0) await Y(); const b = (k + 0.5 * (ri % 2)) / n * Math.PI * 2, q = ringAt(rho, b), tall = RT[ri] * (0.88 + 0.24 * rng());
      // the dome curves away: carry the ring's point onto it by its bearing from the hall's centre
      const dx = q[0] - hc[0], hx = Math.max(-49, Math.min(49, dx)), zz = hc[2] + Math.sqrt(Math.max(0, 2500 - hx * hx)) * (rho > 62 && Math.abs(dx) > 40 ? 0.2 : 1);
      if (q[1] > 3 && q[1] < 58 && Math.abs(dx) < 49.5) tl('vault rings', domeHand(hc[0] + hx, q[1], zz, tall, RW[ri % 4], { R: 0.82, rot: b - Math.PI / 2 + (rng() - 0.5) * 0.3, force: undefined, keep: true })); else { rng(); rng(); rng(); rng(); rng(); rng(); } } }
  await Y();
  // near the water all round the lake, by the hall's count; the north wall: suns and palms from palms
  for (let k = 0, n = Math.round(120 * detail); k < n; k++) { if (k % 8 === 0) await Y(); const a = (k + rng()) / n * Math.PI * 2, y = 2.5 + 11 * rng() * rng(), rr = 50 * Math.sqrt(1 - (y / 62) ** 2);
    domeHand(hc[0] + rr * Math.cos(a), y, hc[2] + rr * Math.sin(a), 2.4 + 2.2 * rng(), LEAD[(look + Math.floor(a * 1.6)) % 3]); }
  // the wall east of the Sun, beside and beyond it on the eye's way, from the water to 30 m up: eighteen suns asked in three rows
  for (let k = 0; k < 18; k++) { if (k % 6 === 0) await Y(); const a = 0.15 + ((k % 6) + 0.2 + 0.6 * rng()) / 6, y = 5 + (Math.floor(k / 6) + 0.2 + 0.6 * rng()) * 8.5, rr = 50 * Math.sqrt(1 - (y / 62) ** 2);
    tl('east of the Sun', domeHand(hc[0] + rr * Math.cos(a), y, hc[2] + rr * Math.sin(a), 5 + 2 * rng(), [0.3, 0.5, 0.1, 0.1], { keep: true })); }
  // the north wall over the way in, 22 m to 38 m up: six suns of 5 to 6.5 m, each within a metre of its place
  for (const [x0, y0] of [[40, 26], [48.5, 23], [57.5, 27], [44, 35], [54, 37], [64, 33]]) { const x = x0 + 2 * rng() - 1, y = y0 + 2 * rng() - 1;
    tl('over the way in', domeHand(x, y, hc[2] - Math.sqrt(Math.max(0, 2500 * (1 - (y / 62) ** 2) - (x - 52) ** 2)), 5 + 1.5 * rng(), [0.3, 0.5, 0.1, 0.1], { keep: true })); }
  for (let k = 0; k < 16; k++) { if (k % 4 === 0) await Y(); const a = 4.75 + 1.5 * rng(), y = 8 + 34 * rng(), rr = 50 * Math.sqrt(1 - (y / 62) ** 2);
    tl('north wall', domeHand(hc[0] + rr * Math.cos(a), y, hc[2] + rr * Math.sin(a), 4 + 2.5 * rng(), [0.3, 0.5, 0.1, 0.1], { keep: true })); }   // the north wall's sixteen, from over the way in round to the east
  // then small ones where there is room
  for (let k = 0; k < 12; k++) hand('hall', W.pier, rng() * (W.pier.nu - 1), (3 + 11 * rng()) / W.pier.dy, 1.3 + rng(), LEAD[(look + 1) % 3]);   // the column's other suns
  for (let k = 0; k < 128; k++) rng();   // the mouth's body of rock carries no hand (its swelling is too narrow and too steep to show one whole); the turns of the seed are spent as before, so all that is dealt after stands as it stood
  await Y();
  // THE HAND OF HANDS over the way out: 20 m tall, five fingers, each ending in a hand whose fingers end in hands: bare rock in a SOLID BLACK field with a red spattered rim, the same on every visit
  { const HH = PLAN.handOfHands.c, [ci, cj] = domeIJ(HH[0], HH[1] - 2.9, HH[2]), o = { ci, cj, tall: 14.3, N: 5, level: 2, seed: 31, rot: 0, side: 1, frame: true };
    await Y(); stamp(R.hall, DM, { ...o, color: pal.black, R: 1.3, rim: 5 }); hands++; }
  await Y();
  // then the others where there is room
  await wallHands('out', W.oW, 14, { y0: 2.5, y1: 12, t0: 2, t1: 3.6, w: OW, every: 6, spread: 2 });
  await wallHands('out', W.oE, 44, { y0: 2.5, y1: 12, t0: 2, t1: 3.8, w: OW, every: 6, spread: 2 }); await Y();
  await wallHands('out', W.oN, 34, { y0: 2.5, y1: 12, t0: 2, t1: 3.8, w: OW, every: 6, spread: 2 }); await Y();
  // and smaller ones in the room that is left
  for (const pt of [W.oW, W.oE, W.oN]) { await wallHands('out', pt, 36, { y0: 2, y1: 12.5, t0: 1.2, t1: 2.2, w: OW, every: 5, spread: 3 }); await Y(); }
  await Y();
  const dr = rng.fork ? rng.fork('drips') : rng;   // the drips' own turns of the seed are taken here: what is laid below changes nothing dealt above
  // ---- LAID LAST, where there is room
  // the places of the small suns about the Hand of Hands (laid further down) are kept: a sun of the crown gives way to them. A place is
  // kept where the count at the point its sun will be drawn about gives a plain sun
  { const zK = (x, y) => hc[2] - Math.sqrt(Math.max(100, 2500 * (1 - (y / 62) ** 2) - (x - 52) ** 2));
    for (let k = 0; k < 18; k++) { const a = (k + 0.5) / 18 * Math.PI * 2, x = 80 + 10.8 * Math.cos(a), y = 28 + 14 * Math.sin(a); if (y < 18.5) continue;
      const [ci, cj] = domeIJ(x, y, zK(x, y)); stampMiddle(DM, ci, cj, true, pm); if (countAt(pm.x, pm.y, pm.z).level === 0) KEPT.push(pm.x, pm.y, pm.z, 1.25); } }
  // THE CROWN'S RINGS: four rings of suns about the vault's middle, on the soot, smaller toward the middle's dark; each by its place's count
  for (const [y, tall] of [[57, 6], [52, 5.5], [46.5, 5], [41.5, 4.4]]) { const rr = H.r * Math.sqrt(1 - (y / H.h) ** 2), n = Math.round(2 * Math.PI * rr / (1.45 * tall));
    for (let k = 0; k < n; k++) { if (k % 6 === 0) await Y(); const a = (k + 0.5 * (n % 2)) / n * Math.PI * 2; tl('crown', domeHand(hc[0] + rr * Math.cos(a), y, hc[2] + rr * Math.sin(a), tall * (0.92 + 0.16 * rng()), [0.3, 0.5, 0.1, 0.1], { keep: true, R: 0.82 })); } }
  // THE WALL EAST OF THE DOORWAY: whole small suns (and palms from palms where the place's count gives them) at the eye's height, at the vault's own
  // grid places beyond the mouth's body: 1.25 m, or else 0.95 m, as the near rule leaves room; and one sun of 2.2 m above them where the count at the point it is drawn about gives a plain sun
  const wS = [0.3, 0.5, 0.1, 0.1], zN = (x, y) => hc[2] - Math.sqrt(Math.max(100, 2500 * (1 - (y / 62) ** 2) - (x - 52) ** 2));
  { const kE = Math.max(...W.face.K.slice(19));   // east of the mouth, clear of its body's skirt (the body's own breadth) by the sun's whole halo
    for (let j = 1; j < DM.nv - 1; j++) for (let i = 0; i < DM.nu - 1; i++) { DM.at(i, j, pv);
      if (pv.x > 89.5 && pv.x < 93.6 && pv.y > 2.5 && pv.y < 16 && pv.z < 178 && mouthD(pv.x, pv.y) > 4.6 * kE + 1.1 && countAt(pv.x, pv.y, pv.z).level < 2 && !tl('east of the doorway', hand('hall', DM, i, j, 1.25, wS))) tl('east of the doorway', hand('hall', DM, i, j, 0.95, wS)); } }
  if (domeCount(92.8, 17.2, zN(92.8, 17.2)).level === 0) tl('east of the doorway', domeHand(92.8, 17.2, zN(92.8, 17.2), 2.2, wS));
  // and on the mouth's own body small suns that its swelling carries whole (the middle of the swelling, 0.95 m), every 2.6 m up both sides
  for (const i of [27.5, 26, 24.5, 23, 21.5, 2.5, 4, 5.5, 7, 8.5]) { stampMiddle(W.face, i, 3.4, false, pv); if (countAt(pv.x, pv.y, pv.z).level === 0) tl('doorway body', hand('hall', W.face, i, 3.4, 0.95, wS)); }
  // THE DOORWAY'S REVEAL: suns on its inner face, white and yellow on the soot, one to every second column of its rock, where the place's count gives a plain sun
  for (const i of [27, 25, 23, 21, 3, 5, 7, 9]) for (const cj of [8.4 + 0.8 * (((i - 1) / 2) % 2), 8.8]) { stampMiddle(W.face, i, cj, false, pv); if (countAt(pv.x, pv.y, pv.z).level === 0 && tl('doorway reveal', hand('hall', W.face, i, cj, 2, wS))) break; }
  // ABOUT THE HAND OF HANDS: a ring of small suns round its field, 3 m and more clear of it, none under the field's foot, each asked
  // where the count at the point it is drawn about gives a plain sun
  for (let k = 0; k < 18; k++) { const a = (k + 0.5) / 18 * Math.PI * 2, x = 80 + 10.8 * Math.cos(a), y = 28 + 14 * Math.sin(a); if (y < 18.5) continue;
    if (domeCount(x, y, zN(x, y)).level === 0) tl('about the Hand of Hands', domeHand(x, y, zN(x, y), 2 + 0.4 * rng(), wS, { force: true })); }
  await Y();
  // THE PASSAGE'S VAULT carries hands on its two haunches only: one row over each wall, every 2.6 m, each hand's middle 0.8 m in from the
  // wall's top and its fingers up the vault (upright to an eye in the passage); the vault's middle is bare. As many turns of the seed
  // again are taken unused, so that what is laid after keeps its turn.
  for (let r = 0; r < 2; r++) for (let sa = 2.6 + r * 1.3; sa <= 58.6; sa += 2.6) { const t = 1.25 * (0.9 + 0.2 * rng()); rng();
    tl('passage haunches', hand('passage', W.pC, sa / 0.754, (r ? 11.4 : 1.8) / 0.75, t, LEAD[look], { rot: r ? Math.PI - 1.05 : 1.05 })); }
  for (let k = 0; k < 308; k++) rng();
  await Y();
  // THE WAY OUT'S WALLS ABOVE THEIR HANDS, from 10 to 17 m up beside the line: at the walls' own grid places, one after
  // another from the lowest row up, each 2.1 m or else 1.6 or 1.2 m as the near rule leaves it room. None where the Last Wall's own count
  // holds on the walls beside it, and none on the first 2 m of the line after that stretch, so the hands that stand there keep their order
  const roomFor = (p) => { const mo = lineNear(p.x, p.y, p.z, LM.hall, LM.end); return countAt(p.x, p.y, p.z).room !== 'last wall' && !(mo > LM.bend1 && mo <= LM.bend1 + 2); };
  for (const pt of [W.oW, W.oE, W.oN]) { for (let j = 1, q = 0; j < pt.nv - 1; j++) for (let i = 1; i < pt.nu - 1; i++) { pt.at(i, j, pv); if (pv.y > 10 && pv.y < 17) { if (++q % 12 === 0) await Y(); if (lineDist(pv.x, pv.y, pv.z) < 14 && roomFor(pv)) tl('way out upper walls', hand('out', pt, i, j, 2.1, OW) || hand('out', pt, i, j, 1.6, OW) || hand('out', pt, i, j, 1.2, OW)); } } await Y(); }
  // and small ones from 1.6 m up at every such place that still has no hand within 1.5 m
  for (const pt of [W.oW, W.oE, W.oN]) { for (let j = 1, q = 0; j < pt.nv - 1; j++) for (let i = 1; i < pt.nu - 1; i++) { pt.at(i, j, pv); if (pv.y > 1.6 && pv.y < 17) { if (++q % 40 === 0) await Y(); if (lineDist(pv.x, pv.y, pv.z) < 14 && roomFor(pv) && bare(pv)) tl('way out small', hand('out', pt, i, j, 1.2, OW)); } } await Y(); }
  // ---- into meshes
  let triangles = 0; const rooms = {};
  for (const k of Object.keys(R)) { const g = batchMeshes(R[k], style, k); rooms[k] = g; triangles += g.userData.triangles * 2; object.add(g); await Y(); }
  const drips = [];
  for (let i = 0; i < 64; i++) { const u = (i + dr()) / 64, p = path.pointAt(u), a = dr() * Math.PI * 2, r = 4 + dr() * (u > 0.4 && u < 0.78 ? 30 : 5); drips.push([p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, 5 + dr() * 5, dr()]); }
  // THE MOUTH DRIPS: 60 sites more within 6.5 m of the line from 327 m to 387 m flown, a ring every 3 to 5 s each; fixed by a hash of their number, not by the visit
  for (let i = 0; i < 60; i++) { const u = 0.77 + 0.14 * (i + hhJ(i * 7.3 + 1)) / 60, p = path.pointAt(u), a = hhJ(i * 3.1 + 2) * Math.PI * 2, r = 1 + 5.5 * hhJ(i * 5.7 + 3);
    drips.push([p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, 3 + 2 * hhJ(i * 1.9 + 4), hhJ(i * 2.3 + 5)]); }
  // and 100 sites more under the doorway and along the throat and the last gallery (340 m to 391 m flown), within 5.5 m of the line, a ring every 3 to 5 s each, fixed the same way
  for (let i = 0; i < 100; i++) { const u = 0.80 + 0.12 * (i + hhJ(i * 4.7 + 11)) / 100, p = path.pointAt(u), a = hhJ(i * 6.1 + 12) * Math.PI * 2, r = 1 + 4.5 * hhJ(i * 3.3 + 13);
    drips.push([p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, 3 + 2 * hhJ(i * 2.9 + 14), hhJ(i * 5.3 + 15)]); }
  const water = makeWater(style, drips); object.add(water);
  const lampsObj = makeLamps(style); object.add(lampsObj);
  const puffs = makePuffs(style, fresh); object.add(puffs);
  const dust = makeDust(style, SUN, detail); object.add(dust);
  await Y();

  const anchors = {
    portalSeat: { position: new THREE.Vector3(125.8, 7, 121.3), facing: new THREE.Vector3(-0.866, 0, 0.5), radius: 7 },
    flyThrough: PATH_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2])), gaze: GAZE, entry: new THREE.Vector3(0, 2.4, 0),
    firstSix: new THREE.Vector3(56, 5.8, 0.3), greatSun: new THREE.Vector3(52, 30, 247), handOfHands: new THREE.Vector3(80, 29.5, 166), lastWall: new THREE.Vector3(80, 9, 139),
    lamps: lampList, stands, bigHands, allHands, rounds, leftOut, tally, drips, plan: PLAN, fresh, hands,
  };
  return {
    object, radius: 150, height: 64, center: new THREE.Vector3(52, 20, 150), anchors, style, path, rooms, triangles, countAt,
    setFlown(m) { style.setFlown(m); },
    update(dt, time, camera) { style.update(dt, time, camera); },
    dispose() {}, ground: false, groundY: 0,
  };
}

// THE PUFF: a cloud of pigment grains that blooms against the rock, hangs and turns, thins. sites: [{ m, p, n, tall, color }] (m: metres flown at
// which the site is abeam; p the place on the rock; n the rock's normal into the cave). Its share is a function of the metres flown alone.
export function makePuffs(style, sites) {
  const P = [], Nn = [], Q = [], Bn = [], C = [], I = [], n = new THREE.Vector3(), T = new THREE.Vector3(), U = new THREE.Vector3();
  sites.forEach((s, k) => { n.set(s.n[0], s.n[1], s.n[2]).normalize(); T.set(0, 1, 0); if (Math.abs(n.y) > 0.9) T.set(1, 0, 0); T.cross(n).normalize(); U.crossVectors(n, T);
    const h = 1.5 * s.tall, b = P.length / 3;
    for (const [qx, qy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { P.push(s.p[0] + n.x * 0.35 + (T.x * qx + U.x * qy) * h, s.p[1] + n.y * 0.35 + (T.y * qx + U.y * qy) * h, s.p[2] + n.z * 0.35 + (T.z * qx + U.z * qy) * h);
      Nn.push(n.x, n.y, n.z); Q.push(qx, qy); Bn.push(s.m, k * 7.31 + 1); C.push(s.color.r, s.color.g, s.color.b); }
    I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); });
  const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); ge.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  ge.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 2)); ge.setAttribute('aB', new THREE.Float32BufferAttribute(Bn, 2)); ge.setAttribute('aC', new THREE.Float32BufferAttribute(C, 3)); ge.setIndex(I);
  const mat = new THREE.ShaderMaterial({ uniforms: style.uniforms, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: LIGHT_VERT + /* glsl */`attribute vec2 aQ, aB; attribute vec3 aC; varying vec2 vQ, vB; varying vec3 vC;
      void main(){ vQ = aQ; vB = aB; vC = aC; vP = position; vForm = 0.; vL = lampSum(position, normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: TONE_FRAG + /* glsl */`uniform float uFlown, uTime; varying vec2 vQ, vB; varying vec3 vC;
      void main(){ float m = vB.x, up = smoothstep(m - 18., m - 14.67, uFlown), dn = 1. - smoothstep(m - 11.33, m - 8., uFlown), fw = length(fwidth(vP));
        vec4 tn = toneAt(fw, vec2(.5, 0.)); if (up * dn < .003 || vP.y < 0.) discard;
        vec2 q = vQ / (.4 + .6 * up + .35 * (1. - dn)); float r = length(q); if (r > 1.) discard;
        float an = uTime * .12 + vB.y, cs = cos(an), sn = sin(an); vec2 g = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs) * 15., cell = floor(g), f = fract(g) - .5;
        float h = fract(sin(dot(cell, vec2(127.1, 311.7)) + vB.y) * 43758.5453), h2 = fract(h * 91.7), h3 = fract(h * 517.3);
        float a = (1. - smoothstep(.1 + .22 * h3, .16 + .3 * h3, length(f + vec2(h - .5, h2 - .5) * .75))) * step(h2, (1. - r * r) * up * dn * .95);
        g = vec2(q.x * sn + q.y * cs, q.y * sn - q.x * cs) * 27. + 3.7; cell = floor(g); f = fract(g) - .5; h = fract(sin(dot(cell, vec2(269.5, 183.3)) + vB.y) * 43758.5453); h2 = fract(h * 91.7);
        a = max(a, (1. - smoothstep(.2, .3, length(f + vec2(h - .5, h2 - .5) * .7))) * step(h2, (1. - r) * up * dn * .8));
        if (a < .02) discard; gl_FragColor = vec4(vC * tn.a, a); }` });
  const g = new THREE.Group(); for (const m of [1, -1]) { const me = new THREE.Mesh(ge, mat); me.scale.y = m; me.frustumCulled = false; me.renderOrder = m > 0 ? 7 : 2.5; me.matrixAutoUpdate = false; me.updateMatrix(); g.add(me); }
  return g;
}
// THE DUST: motes that hang and turn inside each lamp's reach; and every 9 s by the world's clock a slow run of white dust once round
// the Great Sun's fingers, falling as motes. One mesh.
export function makeDust(style, sun, detail = 1) {
  const D = [], per = Math.round(16 * detail), ns = Math.round(2200 * detail);
  style.lamps.forEach((l, i) => { for (let k = 0; k < per; k++) D.push(l.p[0], l.p[1], l.p[2], fr((i * per + k + 1) * 0.6180339) + 0.001); });
  for (let k = 0; k < ns; k++) D.push(0, 0, 0, -1 - (k + 0.5) / ns);
  const ge = new THREE.InstancedBufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); ge.setIndex([0, 1, 2, 1, 3, 2]);
  ge.setAttribute('iD', new THREE.InstancedBufferAttribute(new Float32Array(D), 4)); ge.instanceCount = D.length / 4;
  const me = new THREE.Mesh(ge, new THREE.ShaderMaterial({ uniforms: { uTime: style.uniforms.uTime, uSunC: { value: new THREE.Vector3(sun[0], sun[1], sun[2]) }, uA: { value: style.palette.near }, uB: { value: style.palette.white } },
    vertexShader: /* glsl */`attribute vec4 iD; uniform float uTime; uniform vec3 uSunC, uA, uB; varying vec2 vQ; varying vec3 vCol;
      void main(){ float s = abs(iD.w), h1 = fract(s * 7.13), h2 = fract(s * 13.7), h3 = fract(s * 29.3), size = .02 + .02 * h1, vis = 1.; vec3 c;
        if (iD.w >= 0.) { float an = s * 6.283 + uTime * (.05 + .09 * h2) * (h3 > .5 ? 1. : -1.), rad = .5 + 2.2 * h1; c = iD.xyz + vec3(cos(an) * rad, -1.6 + 3.2 * h3 + .25 * sin(uTime * .35 + s * 40.), sin(an) * rad); vCol = uA; }
        else {   // THE RUN: it passes the bearing th once in 9 s by the clock; two motes in five leave the fingers as it passes (the run one sees),
          // the others at any moment (a thin steady fall); each falls for 8 s through the lamplight
          float g1 = fract(sin(s * 91.3458) * 47453.5453), g2 = fract(sin(s * 37.719) * 23421.631), g3 = fract(sin(s * 12.9898) * 43758.5453), g4 = fract(g3 * 57.31);
          float th = g1 * 6.2832, run = step(g3, .4), age = fract(uTime / 9. - g1 - (run > .5 ? .18 * g2 : g2)), rr = 12.5 + 2.5 * g4;
          c = uSunC + vec3(cos(th) * rr * (1. + .1 * age) + .4 * sin(uTime * .5 + s * 60.), sin(th) * rr - age * age * 26., -1.2 - 2. * g2 - age * 3.);
          vis = step(age, .9) * step(.05, c.y); size = run > .5 ? .09 + .06 * g4 : .06 + .04 * g4; vCol = uB; }
        vec4 mv = modelViewMatrix * vec4(c, 1.); mv.xy += position.xy * max(size, -mv.z * .0014) * vis; vQ = position.xy; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'varying vec2 vQ; varying vec3 vCol; void main(){ if (dot(vQ, vQ) > 1.) discard; gl_FragColor = vec4(vCol, 1.); }' }));
  me.frustumCulled = false; me.renderOrder = 6;
  return me;
}
