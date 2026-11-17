// iron-tower-first-night: an evening of the Paris exposition of 1889 (an evening of that summer, not the first night:
// no lift ran then; and AN EVENING PUT TOGETHER FROM SEVERAL of 1889: the far fireworks' three sites are those of
// 6 May, the lifts running, the public on the decks and the Bengal fire's two flarings those of later evenings).
// We come down the river at dusk, pass under the second arch of the stone bridge, turn in over the
// quay, fly in under the new iron tower between its four legs, climb round it to the lantern while the gas comes on,
// fly out over the garden and its fountains, come about, and run back down the axis to the portal in the great arch.
//
// THE FRAME (fixed in the part file, src/parts/iron-tower-first-night.js, whose FRAME, TOWER and ROUTE this file takes
// every place from): the tower's centre at ground level is the origin; Y is up, metres; the ground of the Champ de Mars
// is y 0. +Z runs down the garden to the central dome and the glass hall, -Z to the river and the Trocadero; +X is
// upstream (north-east), -X downstream. The river flows from +X to -X; the bridge lies along Z at x 0.
//
// THE SOURCES (the tower as it stood that year; no later lighting of it anywhere in this world):
// COLOUR: the iron is a glossy red-brown, darkest at the foot and paling in five bands to near gold at the cupola, as
//   the builder's own book La tour de trois cents metres (1900) describes the last coat of spring 1889 and Les
//   Merveilles de l'Exposition de 1889 describes its tints.
// LAMPS: the lamps are gas burners in opal glass globes about 0.35 m apart, in lines on each platform, on the pier
//   bases and round the four great arches, and none up the legs, as La tour de trois cents metres (1900) states, with
//   3,836 burners by the count in Le Genie civil of 1889. BUILT: 4,077 burners (counted from the built deal: the
//   arches and pier bases 2,476, the first platform 819, the second 433, the third and its terrace 349); the
//   spacing is the source's, the difference is the lines' length as built (WORKING).
// BEACON: the beacon is a fixed white electric light in the lantern with a drum turning in about ninety seconds that
//   gives red, white and blue flashes, as La tour de trois cents metres (1900) and Le Genie civil of 1889 give it (Les
//   Merveilles de la science says green for blue), and it is not seen from the grounds, per the Guide bleu du Figaro
//   of 1889.
// A CONFLICT, NAMED: the tower's present official history dates the first graded paint to 1899 and gives 10,000
//   burners. This world follows the builder's own book (La tour de trois cents metres, 1900) and two works of 1889
//   (Le Genie civil; Les Merveilles de l'Exposition de 1889), and takes the paint's five tints from Les Merveilles
//   de l'Exposition de 1889.
// WHAT THE PAINT AND THE BURNERS REST ON: the crew's research in those three works as read in their scanned text;
//   the builder's book itself could not be opened to read its printed date for the last coat (the scanned text
//   prints 1899 for it and the sentence after it shows the spring of 1889), so the graded paint of 1889 stands on
//   that reading and on Les Merveilles de l'Exposition de 1889, a book of that year, and the burners' number on
//   Le Genie civil of 1889.
//
// WHAT RUNS BY WHAT (the world's clock or the metres flown, nothing else; every place named is one of ROUTE.places,
// found on the route by geometry in the part):
// THE HOUR, by metres flown: skyAt(metres) is the one place that sets it. One number, night, is 0 from the start to
//   bridgeOut (the bridge's downstream face), rises smoothly from bridgeOut to helixTop and is 1 from helixTop to the
//   end; from it alone come the sky's colours, its stars and its afterglow, the two lights, the fog, the river's
//   colours, the city's windows, street glow and net of gas, the far palace's gas, the garden's and the trees' fills
//   and the tower's own light. No clock moves the hour.
// THE TOWER'S GAS COMING ON, by metres flown (the part's wave over the route's places): the four great arches, each
//   from both springings up to its crown, from bridgeOut to half way between quayTop and towerIn; the pier bases
//   from there to towerIn; nothing between towerIn and helixStart; the first platform's rim and its arcades' globes
//   from helixStart to helixWide; the second platform's from helixWide to half way between helixGarden and
//   helixDownstream; the third's from there to helixDownstream; the terrace's from helixDownstream to helixRiver.
// THE GROUND'S LAMPS COMING ON, by the night number and so by metres flown: the bridge's arc lamps burn from the
//   start, six in ten of the warm lamps (the gas of the quays, the avenues, the awning walks and the kiosks; the
//   small electric lamps of the lawns and lakes) burn already in the dusk, and the
//   rest (and the arc lamps on the palace fronts) come on one by one, each at its own dealt threshold of night, between
//   bridgeOut and quayTop: every one burns whole at quayTop, before the tower's arches are whole.
// THE HALLS' LIGHT, by the night number and so by metres flown: the share of the arcades' bays that are lit, the
//   levels of their gas, of the glass hall's pearl arc light and of the central dome's gold, and the fill and the
//   warm wash on their walls all come from skyAt's one number; the glass hall glows faintly in the dusk and whole
//   from helixTop. The burners on the dome and the palace fronts are ground lamps and come on with those.
// THE BENGAL FIRE, by metres flown, TWICE (the sources' two flarings of an evening; the part's bengalFlares): on
//   the climb it rises from half way between helixGarden and helixDownstream, is full from helixDownstream to
//   helixRiver and its flames are out half way to helixTop (it burns while the gaze rests on the river side and
//   pans back: its dying flames and its smoke come in with the tower's head); on the run back it is full from axisWholeFrom to
//   axisWholeTo (the stretch from which the whole tower stands in the picture), rising over half that stretch's
//   length before it, its flames out half its length after it. The red on the iron goes with the flames. ITS
//   SMOKE OUTLASTS THEM, by metres flown: the slender columns grow from where a flaring begins to rise and stand
//   whole where it is full; from where the flames begin to die the smoke thins, to nothing at helixTop (the
//   first) and at portalRun (the second), so that it hangs on the three decks well after the flames are out,
//   ever fainter; as they go out it loses its red for the dull grey light of the gas below and lifts off the rims.
// THE PROJECTORS' LIGHT, by metres flown: the river side's beam is lit from helixRiver, full half way to helixTop,
//   and doused from helixTop to half way to comeAboutStart; the garden side's begins to come on at that same
//   place, half way from helixTop to comeAboutStart, is full at comeAboutStart and burns to the end. THE TWO
//   NEVER SHOW TOGETHER: at any place one beam alone plays, or none.
// THE FAR FIREWORKS' LIGHT, by metres flown: the two sets up the river (each at its sourced site's bearing and
//   distance from the tower) come up from helixGarden to helixDownstream and burn to the end; no look of the
//   route turns toward them, so no planned picture holds them; the set on the isle down the river is
//   DARK WHILE IT STANDS BEHIND THE TOWER (from the helix's top the isle lies straight behind the lantern, and no
//   firework rose from the tower): its light comes up from the first place past helixTop from which the whole set
//   stands 20 degrees and more clear of the tower's axis in plan (found at build from the route's own curve, some
//   150 m past helixTop), is whole at the first place from which it stands 23 degrees clear (found likewise),
//   burns through the fly-out and the come-about, and falls from comeAboutEnd to axisWholeTo. The far cascade's
//   glow, the palace's lit openings, its gas and its fire's light on the river rise with the night number from
//   the start.
// THE FOUNTAINS' COLOURED LIGHT, by metres flown: unlit and pale in the dusk, it comes up on the garden's three
//   basins from towerOut (the line leaves the tower by its far arch and the garden opens beside it) and is whole
//   at helixGarden (the climb's first pass over the garden's side); the light on the fountain under the tower is
//   the gas of the arches over it and comes up with the part's first stage of the gas.
// THE CROWD'S LIGHT, by the night number and so by metres flown: each figure takes the kit's night fill and street
//   glow, the light of the warm or arc lamp nearest its walk from that lamp's own threshold of night on, and the
//   coloured light of the basin it stands at as the fountains' own uniform gives it (so by metres flown).
// THE VAPOURS' AND THE FOAM'S LIGHT, by the night number: steam, smoke and wakes take the sky's fill and horizon
//   from skyAt and more of the streets' warm gas from below as the night comes; the movers' lamps burn a little
//   stronger with it.
// BY THE WORLD'S CLOCK, each a pure function of it: the flicker of every gas lamp (the tower's, the ground's, the
//   far palace's) and the hum of the arc lamps (the small electric lamps of the lawns and lakes burn steady); the
//   beacon's round of flashes (22.5 s); the two projectors' rests
//   and swings and the haze drifting along their beams; the Bengal fire's flames, its smoke's wisps climbing their plumes and the plumes' sway
//   (while it burns and while it hangs after) and the waver of its red on the iron; the fireworks' rockets and shells (this file's own: every spark's place a pure function of the clock and of its shell's round, each round's place in
//   the set's box, breadth, colour and moment dealt from the shell's index and that round) and the glint of the isle's set on the river, of its burning shells' own colours; the stars' twinkle (the kit sky's); the
//   river's water (the kit's river shader) and the trembling of the lamps' streaks on it and on the lakes; the far cascade's
//   falling veils, sliding bands, slow swell and its basin's ripples, and the ripples and sparkle of the far palace's fire on the river; the twinkle of the far city's lamps; the windows' gas; the halls' gas wavering
//   behind their glass and the hum of the glass hall's arc light; the trees' sway; the tower's lift cars and
//   counterweights and its flags (the part); every drop of the fountains on its own flight, their mist, the rings in
//   their glow and each basin's round of the six colours (A DEPARTURE, WORKING: a light is shown 8.6 to 11.8 s
//   where the sources give a change each minute; the flight lasts fifty seconds); every boat's place on its round (by the round's own clock, laid once
//   at build: a boat keeps its round's speed by the flown bridge and runs faster in the far reaches, a law of the
//   place), its roll, its steam, its
//   wake (laid along the round behind it) and its lamps' trembling streaks; the little train's place in its trench
//   and its plume; the chimneys' smoke; every cab's place on its road; every figure of the crowd: a stroller's
//   place on its own short loop of a walk, and one who stands turning a little, shifting its weight and moving an
//   arm. A stroller's STEP goes by the metres it has walked (its own pace times the clock, so a pure function of
//   the clock still): its legs swing from the hip and its arms the other way, its body sinks as the legs part and
//   rises as they pass, its weight goes over the standing leg, a skirt's hem swings. A boat's round begins and
//   ends at the built river's end, 2,650 m off in the haze; a cab that leaves its lane's end comes in again at its
//   beginning, 1,100 m off and small in the dusk (the fog takes a third of it there, no more); the train turns
//   back; a cab's round of the streets and a stroller's loop close on themselves. So each place is a pure function
//   of the clock.
// THE GROUND KEPT EMPTY BEHIND THE ENTRY, A REGION BY PLACE (ENTRY_FAN, typed once, in metres behind the entry's
//   point, the same on every seed): the fan whose point is the route's first point, whose axis is the first heading
//   produced back, whose half breadth is half the metres back (and a mover's own half size), ending 320 m back,
//   and with it, for what stands or goes on the far bank, a round of 120 m about the entry's point. This world is
//   drawn from before its entry while it is seen through the opening before it (camera.nearThrough: its river
//   lies lower than an opening is tall), so what stands behind the entry is in that picture. IN THE FAN NO BODY
//   THAT MOVES is at any clock: no hull, deck house, awning, funnel or boat's lamp, no puff of steam or smoke, no
//   cab (a flat wake may lie there). The far bank's cabs and the crowd keep the round of 120 m as well (no figure
//   of the crowd stands within 20 m of either; the round's far rim reaches over the river onto the tower's quay,
//   whose one lane of cabs is not turned for it and passes up to 10 m inside that rim, 110 m and more from the
//   entry's point); the boats keep the fan alone: their two rounds come about below and
//   above it, each turn moved off along the river until its whole line stands 60 m clear of the fan, the lower
//   round's turn on the open water before the start. The far quay's cabs come about either side of the fan and
//   the round, and no chimney whose plume would drift into the fan smokes. It is a region of the built world fixed
//   by place: nothing in it reads a lens or is laid for one, and ground further back or further aside is not kept.
// BY THE DEAL'S DENSITY (order L6): the number of boats, the number of cabs and the number of the crowd's figures,
//   and nothing else, each clamped between 0.7 and 1.3 of its number at density 1.
// THE CROWD'S RULE (order L5 and section 4), settled AT BUILD from the route's own curve: no figure is made any
//   step of whose whole walk brings any part of its body within 20 m of the flown line. The build steps every
//   walk half a metre apart, measures from the figure's upright line (feet to hat) to the curve and keeps a metre
//   more: 0.66 m of it for the body's reach about that line in any pose (a hem, a foot at its furthest, an arm, a
//   brim), the rest for the gap between two steps; so no body comes nearer than 20 m at any density. Nor is one
//   made within 20 m of the ground kept empty behind the entry (ENTRY_LENS, the movers' own region by place:
//   the fan of 320 m and the round of 120 m about the entry's point, counted in plan and so at any
//   height), nor one that would step into the axis's empty lane, onto the bridge or its ramps, onto a lawn, into
//   water or a building. A kiosk within 8 m of the line or in the lane is not made.
// The streak the tower's lit arches lay on the river takes its strength from the part's first stage of the gas
//   (metres flown, bridgeOut to half way between quayTop and towerIn); each lamp's streak is lit with its lamp.
//   A lake's rim lamps' streaks and the light a tree's crown takes from its nearest warm lamp are lit likewise, each
//   with its lamp's own threshold of night; the low sky the river and the lakes carry takes the hour's own tones.
//
// THE LAWFUL READINGS OF THE EYE USED (order L1; each named here, none other is made):
// THE AIR: the scene carries one exponential fog (the order's own dusk air; its colour and density are the hour's,
// set by skyAt) and every material takes it. It is by nature a fade by distance to the eye and is named here for
// that: it falls on every thing alike, and no thing is singled out, hidden, thinned or swapped by it. BY NIGHT ITS
// COLOUR IS THE CITY'S GASLIGHT HELD IN THE HAZE (the sky under the horizon falls to the same colour): the far
// districts melt into a warm band under the sky, and no other thing draws that glow.
// A SQUARE TURNED TO THE EYE, wherever one is named below (a lamp, a drop, a puff), is a turning only: none is
// sized, faded or hidden by how far off the eye is (its least size on the screen is the hold by a pixel's footprint).
// the kit sky's own update takes the camera (the dome rides with the eye); the kit river shades by the direction from
// the water to the eye (its mirror of the sky) and filters its ripples by a pixel's footprint; the kit facade material
// filters its masonry and its windows by a pixel's footprint; the city's net of gaslight (this file's own shader:
// the far city's roof plane and the pavements round the built blocks) is A HOLD BY A PIXEL'S FOOTPRINT: the far
// city's streets, roofs, courts, lit fronts, lamps and lamp chains are filtered by the pixel's footprint on the
// plan (the derivatives of the plan's place across neighbouring pixels, taken along and across each street), a
// row of lamps going to its mean where the footprint outgrows the lamps' spacing, and the gathering of the lit
// fronts into districts awake and asleep going to its mean likewise; the pavements' lamp pools
// likewise (fwidth; a pavement's strength is its street's RANK, settled at build by the plan alone); the net's level sheets are lit ground and are drawn from above alone (gl_FrontFacing: which
// side of a sheet is seen, so that a lens under the ground's level never sees the streets' light from beneath);
// the city's blocks take one of two levels of
// detail AT BUILD by where the route runs low (single houses near it, plain masses elsewhere), never by the eye, and
// so do the cabs (the whole cab on the quays, the bridge and the avenues' through lanes; three plain blocks on the
// rounds of the streets behind the avenues' blocks, which the line passes far off and high above); the
// garden's ground (this file's own colouring of the standard lit material) filters every edge of its plan (lawns,
// walks, kerbs, rims, beds) and its grain and mowing (each to its mean) by a pixel's footprint (fwidth), and the
// stripes of the awnings are filtered likewise (the kiosks' by the kit facade, the walks' by the halls' material,
// going to their mean); the kit's glows (the far palace's lines of gas) keep
// each burner at the kit's own pixel floor, never smaller than a set angle, and carry the kit's own fade near the
// eye (a glow within a few metres of the lens goes out), which CANNOT ACT HERE BY PLACE: the nearest such burner
// stands over 150 m from the flown line; the far fireworks (this file's own shader) are small squares TURNED TO
// THE EYE, each drawn out along its own flight as the eye sees it, sized in metres and HELD BY A PIXEL'S FOOTPRINT
// (a spark is never drawn under about a pixel's radius, its light lowered by the same ratio); the ground's lamps (this file's own shader) are sized in metres and HELD
// BY A PIXEL'S FOOTPRINT: a globe is never drawn under about a pixel's radius, its light lowered by the same ratio;
// the lamps' streaks on the river (this file's own shader) are a SHADING BY THE DIRECTION FROM THE WATER TO THE
// EYE (a point of water shows a lamp where its ripples can mirror that lamp to the eye) with the ripples filtered
// by a pixel's footprint (each of the three trains by the footprint along its own run, from the derivatives of
// the place; the slopes a pixel no longer shows spread the lamp's image instead, most along the stream: a long
// narrow column of dashes), and the same strip gives back the sky's low band (the horizon's tone, the
// afterglow's rose on its bearing) off its ripples, likewise by the direction to the eye; the lakes' water (in the
// garden's ground material) does both in the same way: the low sky and its rim lamps' streaks by the direction
// from the water to the eye, its ripples filtered by a pixel's footprint; the far cascade's veils, bands and ripples are filtered by a pixel's footprint (fwidth); the far
// palace's fire on the river (the same mesh) is a SHADING BY THE DIRECTION FROM THE WATER TO THE EYE as the lamps'
// streaks are (its ripples and its chop's sparkle filtered by a pixel's footprint); the halls'
// material (this file's own colouring of the standard lit material) filters every bar, rib, course, tile joint and
// opening's edge by a pixel's footprint (fwidth), each going to its mean where it falls under a pixel, and its
// glass, its enamelled tile and (the garden's ground) the lakes' still water take the standard lit material's own
// sheen, a SHADING BY THE DIRECTION FROM THE SURFACE TO THE EYE (the world's two lights mirrored in a smooth
// face); every lamp of the ground is a small square turned to the eye. THE TOWER (the part, which names each at its own head):
// its fine lattice is real bars on every face the route passes within the part's reach of (A LEVEL OF DETAIL BY
// THE ROUTE, decided at build: here every face); its bars are never drawn
// thinner than a pixel and a half (a filter by a pixel's footprint, worked from each bar's own depth and the
// projection: it widens, never hides or fades), and a bar a pixel or two broad is shaded by the mean light of its
// faces turned to the eye, as is a broad bar's face that shows as a sliver under a pixel or two (a filter by a
// pixel's footprint, with the direction from the bar to the eye); over each face lies a plate that CLOSES a cell
// of the lattice into the face's mean as the cell's hole falls from the part's CLOSE.open pixels across (three)
// to its CLOSE.shut (one and a half), and the face's own bracing bars go over to that mean as the face closes and
// is seen aslant (A FILTER BY A PIXEL'S FOOTPRINT, counted across the face: the metres one pixel covers at the
// place's own depth by the projection, over the cosine between the face and the line of sight, so a face seen
// aslant closes by its foreshortened breadth; never pinholes of sky nor a field of dashes), and a closed cell
// carries a share of the sky's own tone on the line of sight through it, less as the face is seen aslant and
// none edge-on (A SHADING BY THE DIRECTION FROM THE CELL TO THE EYE, by direction alone, one number at any
// range: far off a face is lace against the sky, not a slab); its plates, its decks' flat solids and
// its flags turn their light to the side of the sheet that is seen (gl_FrontFacing); its
// arcades, railings and lit windows are filtered by a pixel's footprint (fwidth); its glossy paint
// mirrors the dusk sky and the afterglow by the direction from the surface to the eye; its lamps (the gas globes,
// the beacon) are small squares TURNED TO THE EYE, sized in metres and HELD BY A PIXEL'S FOOTPRINT: never drawn under
// about a pixel's radius, their light lowered with the ratio, so a far cordon is one calm line; a cordon's globe is
// SHADED BY THE DIRECTION FROM IT TO THE EYE (seen along its own row, the nearer globe hides the farther), and so
// is the beacon (its whole light within the level sheet its optic throws, its lit glass alone to an eye under that
// sheet); its two beams' breadth is held by a pixel's footprint likewise, and the beams are shaded by the direction
// from the beam to the eye (the depth of lit haze along the line of sight); the Bengal fire's plumes of smoke and
// its flames are upright blades that turn about their own uprights to face the eye.
// THE FOUNTAINS AND WHAT MOVES (this file's own two shaders, each named again at its place): a fountain's drop and
// a puff of its mist are small squares TURNED TO THE EYE, a drop's drawn out along its own flight as the eye sees
// it, sized in metres and HELD BY A PIXEL'S FOOTPRINT (never under about a pixel across, its light lowered by the
// share it was widened); the lamps of the boats and the cabs are squares turned to the eye, held by a pixel's
// footprint as the ground's lamps are; every puff of steam and of smoke is a square turned to the eye; a boat's
// lamps' streaks on the river are a SHADING BY THE DIRECTION FROM THE WATER TO THE EYE with the ripples filtered by
// a pixel's footprint (the river's own ripples and their filter), as the other streaks are; a wake's foam is filtered by a pixel's footprint (fwidth),
// going to its mean. Which chimneys smoke is settled AT BUILD by the route's own curve (clear air), never by the eye.
// THE CROWD reads nothing of the eye: its figures are plain lit solids placed and posed by the clock; which of them
// are made is settled AT BUILD by the route's own curve, and so is its LEVEL OF DETAIL BY THE ROUTE: a figure whose
// walk comes within 35 m of the flown line is a whole form (legs or a skirt, a coat or a bodice, arms, a head, a
// hat), every other the plain form of the same build and tones.
//
// WHAT IS SOURCED AND WHAT IS INVENTED BY NEED (each tagged again at its place; the sources are
// design/cb/newworld/figures.md, src-site.md and src-light.md; the tower's own things are listed at the part's head).
// SOURCED, as it stood or ran in 1889:
//   the river's line BETWEEN THE TWO NEXT BRIDGES with its quay walls, the stone bridge of five arches with a horse
//   and a man on each of its four end pedestals (dark masses, roughly sculpted),
//   the low bank with its sheds, the row of quay houses and the little railway's trench behind them; the two next
//   bridges (the stone one upstream, the iron footbridge downstream with its close row of gas);
//   the avenue across the Champ's far end; the far palace's round hall, two towers and wings in their sizes,
//   its gas at night (the gas and its number: no burner's place), its cascade's place, the basin of 75 by 44 m, that basin's four gilt animals (plain masses)
//   and the cascade's gold glow; the garden's lawns,
//   walks, trees and parterres of flowers in kind, its two lakes with lamps round them, the awning walks' two lines;
//   the fountains' four places, the main jet's height, the canal's fourteen jets, the six colours and their order; the great group in its
//   basin and the tower fountain's 9 by 12 m; the glass hall's place, three sizes, nineteen bays, side galleries
//   and pearl light; the central dome, its gold and its dotted outline; the two palaces' places, plan and tints;
//   the halls' plan round the court; the square tower by the lake; the terminus of the little railway and its
//   train in the trench; the four music kiosks' places, the fountains' operator's kiosk; the tower park's twelve
//   pavilions IN NUMBER AND PLACE ONLY (five on the park's upstream side, seven on its downstream; they are built
//   far smaller than they stood: one was 1,600 square metres and each was of its own style); THE SMALL WARM ELECTRIC LAMPS along the lawns and round the basins and lakes
//   (incandescent, about 3,000 in the source: here each built lamp stands for a run of them and burns steady);
//   the enclosure's gas in kind (1,886 candelabra in the source: here the gas of the awning walks, the kiosks
//   and the palaces' fronts, which flickers); the arc lamps of the bridge, of the two palaces' fronts, along the
//   railway and the four at the tower fountain's corners; boats under way at night with their lamps; the far
//   fireworks at the isle, the terrace and the point, in the tricolour alone; the Bengal fire's two flarings of an
//   evening (the part); the crowd in ranks round the basins and under the arches.
//   PLACED BY MEMORY OF THE MAP, CHECKED BY THE AUDIT'S OWN ARITHMETIC (the research marks each as remembered): the
//   far arch, the great dome, the far temple's dome, the cathedral with its spire and the school's dome, each by
//   its bearing, distance and height; the far fireworks' three sites.
// INVENTED BY NEED (no line of research gives it; each is laid before the owner by name):
//   THE RIVER'S FAR REACHES beyond the two next bridges (a straight line that drifts from the true one) with their
//   quays' gas, and the glints of that gas and of the near quays' on the water under the quay walls; the built city round the grounds (two lattices of blocks, the boulevards, the houses' plots, mansards, courts
//   and chimneys), the gas of its quays and avenues and its streets' ranks (an avenue's, a boulevard's and the
//   quay's pavements bright, a lesser street's faint); the far city's plan (quarters, boulevards, the star's
//   avenues, squares, lit fronts and their gathering into districts awake and asleep, haze, twinkle); the glow of
//   the city's gas in the night's haze; the streets' gas on the far landmarks' feet; three
//   further bridges with their gas (two of three stone arches up the river; one of six low iron arches down it,
//   where by memory of the map a cast-iron bridge stood); the cascade's eight falls, cheeks and raised basin; the
//   hill garden's walks, terraces, trees and lamps; the far palace's end pavilions and storeys, its towers' square plan, open
//   stage and gilt dome, its lit arcades'
//   and windows' number and spacing, the warm wash of its gas on its stone, WHERE EACH OF ITS LINES OF GAS RUNS
//   (along the galleries' and pavilions' cornices, round the hall's cornices and lantern, two level lines round
//   the three seen sides of each tower's head, the cascade's terrace, cheeks and basin; none up a tower) and its
//   fire's light on the river; the
//   far fireworks' shells (their breadth, heights, flight, trails, rockets and rates, each rocket's spark of its
//   shell's own colour: WORKING); the quay houses'
//   dress and roofs; the low bank's sheds' dress (doors, lintels, eaves and ridge boards); the bridge's dressed stone (archivolts, keystones, caps, bare pilasters, cornice, coping, lamp
//   blocks), its pedestals' dress (plinth, panelled die, cornice, attic), its four groups' pose and modelling (a
//   standing horse, a man at its head) and the light on its stone (its arc lamps'
//   from above, the water's from below); the flower beds' pattern; the walks cut in the lawns; the awnings' striped cloth, posts and eave lamps;
//   the places of the enclosure's gas; the lamps'
//   streaks on the water; the trees' forms and the lamp light on their crowns; every
//   kiosk's and pavilion's form, front, size and place within its ground, and their lamps' places; the two fountain
//   groups' massed forms; the jets' forms and the plain gas on the tower fountain; the glass hall's drawn ribs;
//   the central dome's body and lantern; the halls' heights, sheds and arcaded fronts, the axis gallery's height
//   and last 20 m, the level of the light in their roofs' glazed ridges and their zinc's dark tone (laid at build, the same at dusk); the palaces' bays and the dim light behind their unlit ones; the square tower's low hall; the
//   terminus's shed; the boats' two kinds (a steam launch; a passenger steamer with a lit saloon under a promenade
//   deck), rounds, turns, pace by place, number, wakes and steam; the horse cabs, their lanes,
//   rounds and the three-block cab of the far streets; the train's engine, cars, plume and lit openings; the
//   chimneys' smoke; the crowd's figures (their build, dress, walk, tones, paces, numbers, the places where they
//   gather beyond the basins and the arches, those on the tower's two lower platforms); the ground kept empty
//   behind the start (ENTRY_FAN: the fan of 320 m, the boats' turns moved clear of it; the round of 120 m that
//   the far bank's cabs and the crowd keep as well, the crowd with its 20 m); the city's net of gas drawn from above alone; the sky, its
//   afterglow and stars, the dusk's air and the ground beyond the built city.
// NOT BUILT (each sourced, each left out, each laid before the owner by name):
//   THE COVER THE STONE BRIDGE WORE IN 1889 (it was covered that year; the cover's form was not found, so the
//   bridge stands open); the eagles carved on the bridge's piers (the pilasters stand bare: nothing is put in
//   their place); the two footbridges over the far quay's road at the bridge's end; the long isle below the
//   footbridge (the isle's fireworks burst over its true place, which here is built land behind the far quay);
//   the true sizes and forms of the tower park's twelve pavilions; the esplanade before the great dome; the far
//   city's bare hill; the two Ville de Paris pavilions; cabs over the footbridge; the train's run to the
//   terminus; the bursts "from all over Paris" of 14 July; a crowd on the tower bank's quay walk; lanterns and parasols
//   in the crowd's hands; smoke of the far fireworks; the glass
//   hall's dimming for the fountains' shows; the fountains' change of colour each minute (theirs is quicker
//   here, see above); anything lettered, any face or named person, anything later than 1889.
import * as THREE from 'three';
import * as core from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as S from '../kit/structures.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';
import { FRAME, TOWER, ROUTE, layRoute, layRouteLine, buildHero, buildLamps, LIGHTS } from '../parts/iron-tower-first-night.js';

const RAD = Math.PI / 180;
const { makeRng } = core;

// THE ONE LOOK, DUSK GOING TO NIGHT BY METRES FLOWN: the two ends of one ramp. DUSK is the look at the river (a clear
// deep blue dusk, the afterglow low on its bearing, the first stars, few windows lit); NIGHT the look from the helix's
// top to the end (a navy night, never black, the stars out, the afterglow a last ember kept to the end, the city a
// glowing net of gas). Every key of the two is mixed by one number, night(metres), in skyAt. WORKING throughout:
// the sources give the hour and the lights, not these values.
const DUSK = {
  zenith: '#0b1c52', mid: '#1f5a86', horizon: '#6c6ea4', ground: '#566a9e',
  scatterColor: '#ff9a4c', scatter: 1.2, scatterPow: 5, scatterFall: 9, sunGlow: 0.35, glowColor: '#ffb070', stars: 0.12,
  key: '#ffa070', keyK: 1.8,                             // the warm low light from the afterglow
  skyFill: '#7fb2e2', groundFill: '#2f4c7c', fillK: 1.7, // the cool fill
  fog: '#566a9e', fogDensity: 0.0006,                    // the sky's own colour under the horizon: far things stay readable, never black
  groundFall: 7,                                         // how fast the sky under the horizon falls to that colour (the kit's own measure)
  waterAmbient: '#b4b0d0', waterDeep: '#525c92', waterShallow: '#7a80b0',   // the river's body: a deep dusk blue under the mirrored sky
  // the kit's materials: the gate of their lamps, the share of windows lit, the fill and the street glow as they act
  lamps: 0.36, windows: 0.14, nightFill: '#3c5494', nightFillK: 0.3, streetGlow: 0.03, towerLit: 0.5,
  palaceGas: 1.3,                                        // the strength of the far palace's lines of gas
  leafFill: '#a8bbda', leafFillK: 0.1,                     // the fill the grass and the leaves take beside it
  // the city's net: its roofs under the sky, its courts, its streets' gas and the lamp pools on the pavements
  roof: '#3b4558', roofB: '#4d5566', court: '#2a2830', park: '#2c3d3c', street: '#d8a868', streetK: 0.55, lamp: '#ffd28a', lampK: 0.6,
  // the halls: the share of their bays lit, the levels of their gas, their pearl arc light and the dome's gold, their own fill, the gas's wash on their fronts
  hallLit: 0.62, hallGas: 0.5, hallPearl: 0.32, hallGold: 0.55, hallFill: '#8aa0c8', hallFillK: 0, hallWash: '#ffb070', hallWashK: 0.12,
};
const NIGHT = {
  zenith: '#080f33', mid: '#102555', horizon: '#2a3466', ground: '#5f4439',
  scatterColor: '#e85a2c', scatter: 0.9, scatterPow: 11, scatterFall: 15, sunGlow: 0.14, glowColor: '#f0683a', stars: 0.6,
  key: '#e8744a', keyK: 0.4,                             // the ember's last red light
  skyFill: '#5a78c0', groundFill: '#28396a', fillK: 0.95, // a cool navy that never lets a surface go dead black
  groundFall: 34,                                        // (by night the haze's glow stands close under the horizon: the far roofs' last edge, wholly in the haze, is lost in it)
  fog: '#5f4439', fogDensity: 0.00055,                   // THE CITY'S GLOW IN THE HAZE (INVENTED BY NEED): the gaslight of a whole city held in the night's haze, the sky's own colour under the horizon: the far districts melt into it, a warm band under the sky
  waterAmbient: '#6672b4', waterDeep: '#23316e', waterShallow: '#3d4b8c',   // the river gives the night sky back: a clearer navy than the roofs beside it
  lamps: 0.74, windows: 0.42, nightFill: '#32468a', nightFillK: 0.26, streetGlow: 0.2, towerLit: 1,
  palaceGas: 2.6,
  leafFill: '#a8bbda', leafFillK: 0.6,
  // (the streets' gas is kept well under the tower's own cordons: a soft warm net between slate roofs, never a grid of light)
  roof: '#1c243c', roofB: '#262f4a', court: '#2e2620', park: '#15232f', street: '#e2a458', streetK: 0.26, lamp: '#ffd08a', lampK: 0.8,
  hallLit: 1, hallGas: 1, hallPearl: 1, hallGold: 1.1, hallFill: '#8aa0c8', hallFillK: 0.09, hallWash: '#ffb070', hallWashK: 0.9,
};
// WORKING: the share of the afterglow's light that a window pane mirrors (the kit's glass throws the sun's image
// back five times over: a house turned square to the afterglow gleams with it, and is not burnt to one white patch)
const PANE_GLINT = 0.3;
const HOUR_COLOURS = ['zenith', 'mid', 'horizon', 'ground', 'scatterColor', 'glowColor', 'key', 'skyFill', 'groundFill', 'fog',
  'waterAmbient', 'waterDeep', 'waterShallow', 'nightFill', 'leafFill', 'roof', 'roofB', 'court', 'park', 'street', 'lamp', 'hallFill', 'hallWash'];
// THE IRON'S LIGHT at the ramp's two ends, in linear light as the tower's programs take it (albedo times light): the
// key from the afterglow on a face square to it, the fill from above (the sky) and the fill from the sides and below
// (the horizon's rose at dusk, the gaslit grounds at night). WORKING: found by the picture, so that the paint reads
// as the sources' red-brown at every hour: warm where the afterglow lights it, a dark red that is still red in its
// shade, with its green above its blue (a red-brown under a blue fill alone goes to violet and then to black).
const IRON_LIGHT = {
  dusk: { key: [0.86, 0.36, 0.20], top: [0.36, 0.47, 0.48], under: [0.44, 0.38, 0.26] },
  night: { key: [0.20, 0.06, 0.03], top: [0.30, 0.42, 0.50], under: [0.46, 0.40, 0.26] },
};
const POND_SKY = 0.4;                                    // WORKING: the share of the sky's middle blue the lakes' still water gives back
const FOOT_ROSE = 0.2;                                   // WORKING: the afterglow's share in the footings' fill from the sides (the rose round the horizon)
const IRON_GLOSS = 0.5;                                  // WORKING: the share of the part's sheen the paint keeps: more, and the sky mirrored in it greys the red
const KEY_ELEVATION = 12, EXPOSURE = 1.15;               // the afterglow's light comes from this many degrees up; the exposure is fixed

// THE RIVER'S LINE. At the bridge the river lies between FRAME.river.z0 (the Trocadero's bank) and z1 (the tower's);
// its middle bends toward +Z both ways from the bridge through the two places figures.md B gives (the next bridge
// upstream, the iron footbridge downstream). SOURCED: the line between those two bridges. INVENTED BY NEED: its far
// reaches beyond them (the river must run on to the haze; no line of research gives its course there). WORKING: a
// parabola from the bridge to each place, straight beyond it at the slope it has there, so that the far reaches
// drift from the true river.
const RV = FRAME.river, RIVER_MID = (RV.z0 + RV.z1) / 2, RIVER_HALF = (RV.z1 - RV.z0) / 2;
function riverBend(x) { return x >= 0 ? RV.upstreamBend : RV.downstreamBend; }
function riverZ(x) {
  const b = riverBend(x), t = x / b.x;
  return RIVER_MID + (t <= 1 ? b.dz * t * t : b.dz * (2 * t - 1));
}
function riverSlope(x) { const b = riverBend(x), t = x / b.x; return 2 * b.dz / b.x * Math.min(t, 1); }
// a place beside the river: the middle at x, moved `off` metres across the stream (+ toward the tower's bank)
function riverSide(x, off) {
  const s = riverSlope(x), h = Math.hypot(1, s);
  return [x - s * off / h, riverZ(x) + off / h];
}
const LOW_BANK_DEEP = 12;                                // WORKING: the low bank's depth before the quay wall (the route's checker takes the same)
const BANK_FAR = -RIVER_HALF, BANK_NEAR = RIVER_HALF, BANK_LOW = RIVER_HALF - LOW_BANK_DEEP;   // offsets across the stream
const BRIDGE_MOUTH = FRAME.bridge.pedestals.x[1] + 2;    // half the gap left in the quay parapets at the bridge: to the pedestals' outer faces
const RIVER_REACH = 2800;                               // metres of river built each way from the bridge: the fog has it beyond
// stations along the river's middle, upstream first: every 25 m near the bridge, every 100 m in the far reaches
const RIVER_XS = (() => {
  const xs = [];
  for (let x = RIVER_REACH; x >= -RIVER_REACH; x -= (Math.abs(x) <= 700 && Math.abs(x - 25) <= 700 ? 25 : 100)) xs.push(x);
  xs.push(BRIDGE_MOUTH, -BRIDGE_MOUTH);                  // the quay parapets stop either side of the bridge's mouth
  return xs;
})();

// THE TOWER'S BANK beside the river follows the river's line: each thing FRAME places by its z at the bridge keeps that
// distance from the quay wall all along. Offsets across the stream, as riverSide takes them.
const QH = FRAME.quayHouses, HOUSE_OFF0 = BANK_NEAR + (QH.z0 - RV.z1), HOUSE_OFF1 = BANK_NEAR + (QH.z1 - RV.z1);
// WORKING: the quay houses' dress in metres: plinth [height, proud], string course [height over the ground, depth,
// proud], cornice [depth, proud, its ledge's drop under eaves without an overhang], chimney stack [thick, long],
// dormer [width, height, spacing]
const HOUSE_DRESS = { plinth: [0.7, 0.1], course: [3.3, 0.28, 0.12], cornice: [0.42, 0.3, 0.25], stack: [0.8, 1.25], dormer: [1.3, 1.5, 3.1] };
const RC = FRAME.railwayCut, CUT_OFF0 = BANK_NEAR + (RC.z0 - RV.z1), CUT_OFF1 = BANK_NEAR + (RC.z1 - RV.z1);
const GROUNDS_X = FRAME.farAvenue.fenceX;                // the exposition's grounds lie between the fences at x -230 and +230
// two more stations, one each way, where the ground's seam behind the railway's cut meets a fence: the hole left in
// the ground plane for the garden then has its sides on the fences' own lines
for (const sgn of [-1, 1]) {
  let x = sgn * GROUNDS_X;
  for (let k = 0; k < 30; k++) x += sgn * GROUNDS_X - riverSide(x, CUT_OFF1)[0];
  RIVER_XS.push(x);
}
RIVER_XS.sort((a, b) => b - a);
const CUT_MOUTH = 25, CUT_END = 225;                     // WORKING: the trench runs in a tunnel under the bridge's approach (|x| under 25) and ends short of the fences
function inRailwayCut(xa, xb) {
  return xa * xb > 0 && Math.min(Math.abs(xa), Math.abs(xb)) >= CUT_MOUTH && Math.max(Math.abs(xa), Math.abs(xb)) <= CUT_END;
}
// a number from 0 to 1 for item i and use k: the per-item tones and shapes of this file come from here, never from a shared stream
function hash01(i, k = 0) {
  let h = (Math.imul(i | 0, 0x9e3779b1) ^ Math.imul((k | 0) + 0x7f4a7c15, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// THE BRIDGE'S ARCH: a segment of a circle found from the span and the rise FRAME.bridge gives; the height of its
// underside at dz metres along the bridge from the arch's middle
const BR = FRAME.bridge;
const ARCH_R = (BR.span * BR.span / 4 + BR.rise * BR.rise) / (2 * BR.rise);
function soffitY(dz) { return BR.crownY - ARCH_R + Math.sqrt(Math.max(0, ARCH_R * ARCH_R - dz * dz)); }

// one four-cornered face of stone, its normal given, its masonry laid by the metre from each corner's own place;
// the first two corners take the lower shade. Turned to face along the normal whatever the corners' order.
// `lit`, where given, is how many times paler a corner's stone is drawn at its place (a lamp's light on it).
function stoneFace(b, P, n, c0, c1, uvOf, lit = null) {
  const ux = P[1][0] - P[0][0], uy = P[1][1] - P[0][1], uz = P[1][2] - P[0][2], vx = P[3][0] - P[0][0], vy = P[3][1] - P[0][1], vz = P[3][2] - P[0][2];
  const facing = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
  const Q = facing >= 0 ? [0, 1, 2, 3] : [1, 0, 3, 2];
  const i = Q.map((q, k) => { const p = P[q], c = k < 2 ? c0 : c1, t = uvOf(p), f = lit ? lit(p) : 1; return b.v(p[0], p[1], p[2], n[0], n[1], n[2], Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f), t[0], t[1]); });
  b.quad4(i[0], i[1], i[2], i[3]);
}

// a flat four-cornered piece laid face up whatever the order of its corners (each corner [x, y, z])
function laidQuad(b, p0, p1, p2, p3, uv) {
  const ux = p1[0] - p0[0], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vz = p3[2] - p0[2];
  if (uz * vx - ux * vz >= 0) b.quad(p0, p1, p2, p3, uv); else b.quad(p0, p3, p2, p1, uv);
}

// the kit sky's noise texture, made by the same generator and settings as the kit's own but in steps that hand the
// frame back, and passed to makeSky as its noiseTexture: the same sky, a shorter call
async function skyNoiseSteps(ctx) {
  const N = 256, d = new Uint8Array(N * N * 4); let a = 0x2545f491;
  const r = () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) & 255; };
  for (let y = 0; y < N; y++) { for (let i = y * N, e = i + N; i < e; i++) { d[i * 4] = r(); d[i * 4 + 2] = r(); d[i * 4 + 3] = 255; } if (y % 32 === 31) await ctx.yield(); }
  for (let y = 0; y < N; y++) { for (let x = 0; x < N; x++) d[(y * N + x) * 4 + 1] = d[(((y + 17) & 255) * N + ((x + 37) & 255)) * 4]; if (y % 32 === 31) await ctx.yield(); }
  const { DataTexture, LinearFilter } = THREE, t = new DataTexture(d, N, N, THREE.RGBAFormat);   // the smooth filter, as the kit's own noise has it
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = LinearFilter; t.generateMipmaps = false; t.colorSpace = THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

// ---- THE CITY'S PLAN (Paris of 1889 outside the exposition's fences, by hand). Two lattices of blocks: the tower's
// bank laid square to the Champ de Mars (an avenue down each fence, one across its far end, a street on the axis
// beyond), the Trocadero's bank turned a little; both cut back from the quays along the river's line and cut through
// by slanting boulevards. Within CITY.x and CITY.z the blocks are built; beyond, the far city's roof plane draws
// a plan of its own (FAR_CITY below). INVENTED BY NEED (the sources give the exposition's grounds, not the streets
// about them: without a city the grounds would stand in a void). WORKING throughout: the plan is a likeness.
const AVENUE = 30, STREET = 14, QUAY_ROAD = 24;
const CITY = (() => {
  const x0 = GROUNDS_X + AVENUE, px = (x0 - STREET / 2) / 3, pz = 70, z0 = FRAME.farAvenue.z + AVENUE / 2;
  return {
    left: { x0, px, z0, pz },                              // blocks begin at |x| = x0 + k px and z = z0 + j pz
    right: { turn: -12 * RAD, pu: 92, pv: 66 },            // the Trocadero bank's lattice, turned about the origin
    x: x0 + 9 * px - STREET / 2, zSouth: z0 + 6 * pz - STREET / 2, zNorth: -1000,   // the built city's edges: street middles
    // slanting boulevards as [x, z, x, z, half width]: two on each bank
    boulevards: { left: [[800, 70, 290, 930, 15], [-560, 180, -100, 1150, 15]], right: [[60, -800, 1260, -1160, 15], [-300, -640, -1100, -330, 13]] },
    // plots kept clear of blocks, [x0, z0, x1, z1]: the school's, the great dome's church, the Trocadero's hill and gardens
    plots: [[-130, 900, 130, 1080], [520, 1100, 760, 1320], [-330, -900, 330, -250]],
  };
})();

// the part of a convex outline (corners [x, z]) on the side of the line through (px, pz) that its normal (nx, nz) points to
function clipOutline(poly, px, pz, nx, nz) {
  const out = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i], c = poly[(i + 1) % n], da = (a[0] - px) * nx + (a[1] - pz) * nz, dc = (c[0] - px) * nx + (c[1] - pz) * nz;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (dc >= 0)) { const t = da / (da - dc); out.push([a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t]); }
  }
  return out;
}
// a convex outline drawn in by d metres on every side (walls' normals outward, as the kit's prism asks); null when
// the outline is too small for it
function insetOutline(poly, d) {
  const n = poly.length, out = [];
  const inward = (a, c) => { const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dz / l, -dx / l]; };
  for (let i = 0; i < n; i++) {
    const p = poly[(i + n - 1) % n], q = poly[i], r = poly[(i + 1) % n], n1 = inward(p, q), n2 = inward(q, r), k = d / (1 + n1[0] * n2[0] + n1[1] * n2[1]);
    out.push([q[0] + (n1[0] + n2[0]) * k, q[1] + (n1[1] + n2[1]) * k]);
  }
  for (let i = 0; i < n; i++) {
    const a = poly[i], c = poly[(i + 1) % n], a2 = out[i], c2 = out[(i + 1) % n];
    if ((c2[0] - a2[0]) * (c[0] - a[0]) + (c2[1] - a2[1]) * (c[1] - a[1]) <= 0.25 * ((c[0] - a[0]) ** 2 + (c[1] - a[1]) ** 2)) return null;
  }
  return out;
}
function outlineArea(poly) { let s = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i], c = poly[(i + 1) % poly.length]; s += a[0] * c[1] - c[0] * a[1]; } return Math.abs(s) / 2; }
function outlineMiddle(poly) { let x = 0, z = 0; for (const q of poly) { x += q[0]; z += q[1]; } return [x / poly.length, z / poly.length]; }

// the tower bank's lattice: whether the block of column k and row j reaches across the street to its upstream
// neighbour (about one in four; the column beside the downstream avenue never), and the river-side edge of row j
function blockJoined(k, j) { return k !== -7 && hash01(k * 64 + j, 41) < 0.28; }
function blockRowZ(j) { return CITY.left.z0 + j * CITY.left.pz - (j < 0 ? AVENUE - STREET : 0); }
// every block of the built city as a convex outline [x, z] (walls' normals outward): the two lattices' cells, less
// the grounds and the plots, cut back from the quays along the river's line and cut through by the boulevards.
// bank 0 is the tower's, 1 the Trocadero's.
function cityBlocks() {
  const blocks = [], L = CITY.left, R = CITY.right, EDGE = CITY.x - STREET / 2;
  const inPlot = (x, z) => (Math.abs(x) < L.x0 && z < L.z0 && z > riverZ(x)) || CITY.plots.some((q) => x > q[0] && x < q[2] && z > q[1] && z < q[3]);
  const add = (poly, bank) => {
    if (poly.length < 3) return;
    const [mx, mz] = outlineMiddle(poly);
    if (inPlot(mx, mz)) return;
    // the quay's line beside the river at the block's own x: the block keeps what lies behind it
    const sgn = bank === 0 ? 1 : -1, q = riverSide(mx, sgn * (RIVER_HALF + QUAY_ROAD)), sl = riverSlope(mx), h = Math.hypot(1, sl);
    let polys = [clipOutline(poly, q[0], q[1], -sl / h * sgn, sgn / h)];
    for (const [ax, az, bx, bz, half] of bank === 0 ? CITY.boulevards.left : CITY.boulevards.right) {
      const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, next = [];
      for (const c of polys) {
        if (c.length < 3) continue;
        next.push(clipOutline(c, ax + nx * half, az + nz * half, nx, nz), clipOutline(c, ax - nx * half, az - nz * half, -nx, -nz));
      }
      polys = next;
    }
    for (const c of polys) {
      if (c.length < 3 || outlineArea(c) < 900 || !insetOutline(c, 8)) continue;   // slivers are left as open ground
      const m = outlineMiddle(c);
      blocks.push({ poly: c, bank, x: m[0], z: m[1], id: blocks.length });
    }
  };
  for (let k = -21; k <= 8; k++) for (let j = -20; j <= 5; j++) {
    // (rows on the river's side of the far avenue stand back from it by its width; about one block in four reaches
    // across the street to its upstream neighbour, so that the plan is no ruled grid)
    const xa = L.x0 + k * L.px, joined = blockJoined(k, j), xb0 = xa + L.px - STREET;
    const za = blockRowZ(j), zb = za + L.pz - STREET;
    if (xb0 > CITY.x || xa < -CITY.x) continue;
    const xb = xb0 + (joined && xb0 + L.px < CITY.x ? STREET : 0);
    add([[xa, zb], [xb, zb], [xb, za], [xa, za]], 0);
  }
  const co = Math.cos(R.turn), si = Math.sin(R.turn), W = (u, v) => [co * u - si * v, si * u + co * v];
  for (let k = -16; k <= 16; k++) for (let j = -18; j <= 4; j++) {
    const ua = k * R.pu, ub = ua + R.pu - (hash01(k * 64 + j, 42) < 0.28 ? 0 : STREET), va = j * R.pv, vb = va + R.pv - STREET;
    let c = [W(ua, vb), W(ub, vb), W(ub, va), W(ua, va)];
    const m = outlineMiddle(c);
    if (Math.abs(m[0]) > CITY.x + 80 || m[1] < CITY.zNorth - 80 || m[1] > 300) continue;
    c = clipOutline(clipOutline(clipOutline(c, 0, CITY.zNorth + STREET / 2, 0, 1), EDGE, 0, -1, 0), -EDGE, 0, 1, 0);
    add(c, 1);
  }
  return blocks;
}

// ---- THE FAR CITY'S PLAN (Paris of 1889 beyond the built blocks, drawn on the far roof plane by the net's shader).
// SOURCED, each at its own place: the river's line and its two next bridges (figures.md B "River line"), the arch
// 1.7 km off at bearing 1, the great dome and the school's dome (figures.md B "Far city"; built as far landmarks),
// the avenue across the Champ's far end (src-site.md, table, "Avenue de La Motte-Picquet", carried on past the
// built blocks as avenues[12]).
// INVENTED BY NEED (the sources give a city of gaslit streets round the grounds and no plan of it; the place cannot
// stand in a void): everything else here, a likeness of an old city laid from memory of the map, no line of
// research behind any of it: the QUARTERS (the plane is dealt into quarters some 540 m across, each with its own
// street angle and block sizes, so that no line of streets is ruled from the eye to the horizon; the seams between
// quarters are wider streets, four in ten of them boulevards); the LONG BOULEVARDS below (the axis through the
// arch to the river and out beyond it, the avenues of the star about the arch, the avenue to the wood, the tower
// bank's outer boulevards; the built city's four slanting boulevards are carried on from where they leave the
// blocks); the SQUARES where they meet; the DARK MASSES without lamps (the great wood to the west beyond the far
// bank's last houses, the gardens beside the axis's lower half, two small parks, and about one quarter in twelve
// a park or a burial ground); the CITY'S HEART (up the river, east of the tower: the streets are closest and
// brightest within `heart` metres of it and thin out beyond, toward the walls and the fields).
// NOT BUILT: the esplanade before the great dome and what stood on it that summer (no line in the sources; half
// its ground lies under the built blocks).
// WORKING: every place, size and level.
const FAR_CITY = {
  quarter: 540, street: 11,
  heart: [2816, 2626, 5200, 1500],                        // x, z; dense within the third, thinning over the fourth
  // the long boulevards as [x, z, x, z]: 0 the axis from the arch to the river, 1 the same axis outward, 2 to 11
  // the star's other avenues (two of them the built far bank's boulevards carried on), 12 the avenue across the
  // Champ's far end carried on, 13 to 20 the tower bank's (the built bank's two carried on to their crossing and
  // beyond, the great dome's axis, the outer boulevards), 21 and 22 the far bank's downstream pair carried on
  avenues: [
    [1256, -1163, 1850, 600], [1256, -1163, 780, -2580], [1256, -1163, 2600, -350], [1256, -1163, 2600, -1255], [1256, -1163, 150, -1955],
    [1256, -1163, 1012, -1086], [1256, -1163, 1030, -1250], [1030, -1250, 629, -1000], [1256, -1163, 1012, -510], [1256, -1163, 1012, -1000],
    [1256, -1163, 1461, -1727], [1256, -1163, 1829, -1565], [1012, 885, 1509, 1034], [1509, 1034, 1749, 2836], [63, 1313, -396, 2087],
    [-23, 1313, 217, 2038], [475, 1313, -38, 1634], [560, 1330, 217, 2038], [217, 2038, 689, 3656], [217, 2038, -2300, 1700],
    [-1012, 760, -2100, 1500], [-1012, -364, -2000, 19], [-1012, -478, -1700, -700],
  ],
  // the squares as [x, z, radius]: the star's round place, the round point half way down the axis, the place at
  // the axis's river end, and the crossings of the tower bank's boulevards
  squares: [[1256, -1163, 120], [1591, -168, 70], [1822, 500, 95], [15, 1394, 50], [-38, 1634, 55], [217, 2038, 55], [1030, -1250, 45], [150, -1955, 60], [1509, 1034, 50]],
  // the dark masses as [x, z, half length, half breadth, turn in degrees]: the wood, the two gardens beside the
  // axis's lower half, two small parks
  dark: [[-1600, -2886, 1350, 950, 30], [1920, 205, 300, 125, 71.4], [1556, 326, 300, 125, 71.4], [-776, -1400, 170, 120, 0], [2444, -883, 180, 130, 20]],
};

// ---- THE CITY'S NET OF GASLIGHT. One cheap shader of this file's own draws three things in one mesh: (kind 0) the
// far city's roof plane beyond the built blocks, which draws FAR_CITY's plan: quarters of slate roofs round dark
// courts, each quarter's streets at its own angle with a row of gas lamps down each street, house fronts lit here
// and there, boulevards and squares as brighter chains and knots of lamps, parks and the wood as dark masses, a
// faint warm haze over the closest quarters; (kind 1) the pavement round every built block, a warm band with a
// string of lamp pools; (kind 2) the far plane's plain dark edge walls.
// EVERY LAMP OF THE FAR CITY TWINKLES BY THE WORLD'S CLOCK (gas seen through a mile of air): each at two rates of
// its own, a pure function of its place and the clock.
// LAWFUL READING (order L1), A HOLD BY A PIXEL'S FOOTPRINT: every street, roof, court, lit front, lamp and lamp
// chain is filtered by the pixel's footprint on the plan (the derivatives of the place across neighbouring pixels,
// taken along and across each street): a lamp is a small gaussian that widens with the footprint and keeps its
// light, a row of lamps goes to the row's mean where the footprint outgrows the lamps' spacing (and its twinkle
// with it), a block's roofs and fronts go to the block's mean and then to the quarter's. Nothing here fades, hides
// or thins by distance to the eye: the thinning toward the horizon is the plan's own (the distance from the
// city's heart, a place on the ground).
const NET_VS = /* glsl */`
  attribute vec3 aNet;                                   // kind (a pavement's, about 1, also carries its street's rank: 0.6 the least, 1.4 the greatest); then the bank (kind 0) or metres along the kerb and the share across the pavement (kind 1)
  varying vec3 vNet; varying vec3 vWorld;
  #include <fog_pars_vertex>
  void main() {
    vNet = aNet; vec4 wp = modelMatrix * vec4(position, 1.0); vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const NET_FS = /* glsl */`
  uniform vec3 uRoof, uRoofB, uCourt, uStreet, uLamp, uPark; uniform float uStreetW, uNetK, uTime, uWin;
  uniform vec4 uAve[${FAR_CITY.avenues.length}];         // the long boulevards: each from (x, z) to (x, z)
  uniform vec3 uKnot[${FAR_CITY.squares.length}];        // the squares: x, z, radius
  uniform vec4 uDark[${FAR_CITY.dark.length}];           // the dark masses: x, z, half length, half breadth
  uniform vec2 uDarkTurn[${FAR_CITY.dark.length}];       // each one's turn, as cosine and sine
  uniform vec4 uHeart;                                   // the city's heart: x, z, the radius it is dense within, the metres it thins over
  varying vec3 vNet; varying vec3 vWorld;
  const float RING = 13.;                                // the depth of the houses that ring a block's court
  const float QUARTER = ${FAR_CITY.quarter.toFixed(1)}, STW = ${FAR_CITY.street.toFixed(1)};
  #include <fog_pars_fragment>
  vec2 gDx, gDy;                                         // the pixel's footprint on the plan: the place's change to the next pixel across and down
  // the footprint's breadth along a direction of the plan, in metres
  float foot(vec2 n) { return abs(dot(n, gDx)) + abs(dot(n, gDy)); }
  // the share of a footprint w about d that lies within h of 0: a band, filtered
  float band(float d, float h, float w) { w = max(w, 1e-3); return clamp((min(d + .5 * w, h) - max(d - .5 * w, -h)) / w, 0., 1.); }
  // the share of a footprint w about x where fract(x) lies under duty: a row of blocks, filtered
  float blocks(float x, float duty, float w) {
    w = max(w, 1e-4); float a = x - .5 * w, b = x + .5 * w;
    return clamp(((floor(b) * duty + min(fract(b), duty)) - (floor(a) * duty + min(fract(a), duty))) / w, 0., 1.);
  }
  float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 h2(vec2 p) { return vec2(h1(p), h1(p + 19.19)); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1., 0.)), f.x), mix(h1(i + vec2(0., 1.)), h1(i + 1.), f.x), f.y); }
  // A LAMP, FILTERED: a gaussian of breadth s0 at d metres, seen through a footprint fw: it widens with the
  // footprint and keeps its light; one of a row every sp metres, it goes to the row's mean where it has grown as
  // broad as the spacing (gone: how far it has gone to the mean)
  float lamp(float d, float sp, float s0, float fw, out float gone) {
    float s = sqrt(s0 * s0 + .16 * fw * fw);
    gone = smoothstep(.3, .55, s / sp);
    return mix(exp(-d * d / (2. * s * s)) * s0 / s, 2.5066 * s0 / sp, gone);
  }
  // a row of lamps every sp metres along a, each twinkling by the clock at two rates of its own (key: the row's number)
  float lampRow(float a, float sp, float s0, float fw, float key) {
    float i = floor(a / sp), gone, l = lamp((a / sp - i - .5) * sp, sp, s0, fw, gone), n = h1(vec2(i, key));
    return l * (1. + .34 * (1. - gone) * sin(uTime * (2.2 + 3.1 * n) + n * 61.) * sin(uTime * (.7 + 1.3 * n) + n * 17.));
  }
  // how close the city is built at a place: 1 near its heart, thinning toward the walls, a little uneven
  float closeAt(vec2 p) { return (1. - .72 * smoothstep(uHeart.z, uHeart.z + uHeart.w, length(p - uHeart.xy))) * (.78 + .44 * vn(p / 870.)); }
  // THE FAR CITY at a place of the plan
  vec3 farCity(vec2 p0) {
    vec2 pw = p0 + 46. * sin(p0.yx / 530. + vec2(1.3, 4.1)) + 15. * sin(p0.yx / 171. + vec2(2.7, .4));   // the old streets bend
    gDx = dFdx(pw); gDy = dFdy(pw);
    float iso = max(max(length(gDx), length(gDy)), .01), gone;
    // THE QUARTERS: the nearest and the next nearest of the quarters' middles (one dealt to each square of QUARTER
    // metres); the seam between the two is a wider street
    vec2 g = pw / QUARTER, gi = floor(g), gf = g - gi, c1 = gi, c2 = gi, s1 = vec2(9.), s2 = vec2(9.);
    float d1 = 1e9, d2 = 1e9;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)), c = gi + o, s = o + .15 + .7 * h2(c) - gf; float d = dot(s, s);
      if (d < d1) { d2 = d1; c2 = c1; s2 = s1; d1 = d; c1 = c; s1 = s; } else if (d < d2) { d2 = d; c2 = c; s2 = s; }
    }
    vec2 sn = normalize(s2 - s1), st = vec2(-sn.y, sn.x);
    float seam = dot(.5 * (s1 + s2), sn) * QUARTER, pair = h1(c1 + c2 + 2.2), big = step(pair, .42);
    // the quarter's own numbers: its street angle, its blocks' two sizes, how close it is built, whether it is a park
    float hA = h1(c1 + 3.1), hB = h1(c1 + 17.7), hC = h1(c1 + 41.3), hD = h1(c1 + 71.9);
    float dq = closeAt((c1 + .15 + .7 * h2(c1)) * QUARTER), park = step(hD, .085);
    float th = hA * 3.14159, co = cos(th), si = sin(th);
    vec2 per = vec2(46. + 54. * hB, 38. + 30. * hC) * (1.4 - .4 * min(dq, 1.));
    vec2 r = vec2(co * pw.x + si * pw.y, co * pw.y - si * pw.x) + 300. * h2(c1 + 5.5), q = r / per;
    vec2 wm = vec2(abs(co * gDx.x + si * gDx.y) + abs(co * gDy.x + si * gDy.y), abs(co * gDx.y - si * gDx.x) + abs(co * gDy.y - si * gDy.x)), w = wm / per;
    vec2 duty = 1. - STW / per, cell = floor(q), f = q - cell, key = cell + c1 * 13.1, rd = duty * per;
    // two filters: lod where a whole block is smaller than a pixel, fine where a single house still shows
    float lod = smoothstep(.22, .6, max(w.x, w.y)), wmm = max(max(wm.x, wm.y), .01), fine = 1. - smoothstep(3., 11., wmm);
    // about one block in four reaches across the street on one side
    float joined = step(h1(key + 7.3), .26), joinedL = step(h1(key + vec2(-1., 0.) + 7.3), .26);
    float roof = mix(blocks(q.x, mix(duty.x, 1., joined), w.x), duty.x + .26 * (1. - duty.x), lod) * blocks(q.y, duty.y, w.y);
    // A BLOCK: houses RING deep round a dark court, each house a tone of its own and its front lit or dark; where
    // the city thins, more and more blocks are gardens. Metres in from the block's edges; a joined side has no edge.
    vec2 m0 = f * per, m1 = (duty - f) * per;
    m0.x = mix(m0.x, 999., joinedL); m1.x = mix(m1.x, 999., joined);
    float ex = min(m0.x, m1.x), ey = min(m0.y, m1.y), e = min(ex, ey), side = step(ex, ey);
    float court = clamp(.5 + (e - RING) / wmm, 0., 1.), hid = floor(mix(f.x * per.x, f.y * per.y, side) / 19.);   // (hid: the house's number along its side)
    float courtMean = max(rd.x - 2. * RING, 0.) * max(rd.y - 2. * RING, 0.) / (rd.x * rd.y), frontMean = 9. * (rd.x + rd.y) / (rd.x * rd.y);
    float gardenMean = clamp(1. - 1.5 * dq, 0., 1.), garden = mix(step(1.5 * dq, h1(key + 3.3)), gardenMean, lod);
    vec3 slate = mix(uRoof, uRoofB, h1(key + 11.7)) * (.6 + .8 * h1(key));
    vec3 seen = mix(slate * (.8 + .4 * h1(key * 17.3 + vec2(hid, 5.1 + 4.6 * side))), uCourt, court);
    vec3 roofs = mix(mix(mix(slate, uCourt, courtMean), seen, fine), mix(mix(uRoof, uRoofB, .5), uCourt, courtMean), lod);
    // (three filters for the lit fronts: house by house where a house shows, by lengths of two houses round the
    // block's ring where the ring shows, the block's own mean beyond; each has the same mean)
    // (INVENTED BY NEED, WORKING: the lit fronts gather: a district is awake or asleep by a number of its place, some 250 m across, which
    // goes to its mean where the footprint outgrows it: warm uneven clusters, no even sowing of lit windows)
    float cl = mix(.25 + 1.75 * smoothstep(.32, .7, vn(pw / 250. + 3.7)), 1.07, smoothstep(70., 250., iso));
    float along = mix(f.x * per.x, f.y * per.y, side), wk = 2.4 * h1(key + 23.1) * h1(key + 31.9) * min(dq, 1.) * cl, lit = min(uWin * wk, 1.);
    float litHouse = step(h1(key * 9.1 + vec2(hid, 3.7 + side)), lit), litPair = step(h1(key * 5.3 + vec2(floor(along / 38.), 1.9 + side)), lit);
    float mid = 1. - smoothstep(9., 30., wmm), ringK = frontMean / max(1. - courtMean, .25);
    float win = mix(mix(mix(lit * frontMean, litPair * (1. - court) * ringK, mid), litHouse * exp(-e / 4.5) * (1. - court), fine), uWin * .6 * min(dq, 1.) * cl * frontMean, lod) * (1. - garden);
    // THE STREETS: a dim warm canyon and a row of gas lamps down the middle of each, one street brighter than the
    // next and all of them well under the boulevards (THE NET'S RANKS: a lesser street's row is a faint thread, a
    // seam's a clearer one, a boulevard's an unbroken bright chain, a square a knot of light)
    float cy = .5 * (duty.y + 1.), cx = .5 * (duty.x + 1.), ny = floor(q.y - cy + .5), nx = floor(q.x - cx + .5);
    float sy = (q.y - cy - ny) * per.y, sx = (q.x - cx - nx) * per.x, shut = f.x > .5 ? joined : joinedL;
    float rows = lampRow(r.x, 27., 2.4, wm.x, ny + key.y * .37) * lamp(sy, per.y, 2.4, wm.y, gone) * (.3 + .7 * h1(vec2(ny, c1.x + 9.4)))
      + lampRow(r.y, 27., 2.4, wm.y, nx + key.x * .53) * lamp(sx, per.x, 2.4, wm.x, gone) * (.3 + .7 * h1(vec2(nx, c1.y + 4.9))) * (1. - shut * (1. - lod));
    vec3 col = mix(uStreet * (.45 * min(dq, 1.)), mix(roofs, uPark, garden), roof);
    col += uLamp * (.9 * win * roof + .62 * rows * mix(.4, 1., min(dq, 1.)) * (.5 + .5 * cl));
    // THE DARK MASSES: a quarter that is a park, the wood, the gardens: trees, no lamps (their grain to its mean far off)
    float dark = park;
    for (int i = 0; i < ${FAR_CITY.dark.length}; i++) {
      vec2 d = p0 - uDark[i].xy, t = uDarkTurn[i]; d = vec2(t.x * d.x + t.y * d.y, t.x * d.y - t.y * d.x) / uDark[i].zw;
      dark = max(dark, clamp(.5 - (length(d) - .82 - .36 * vn(p0 / 150. + float(i) * 9.)) * min(uDark[i].z, uDark[i].w) / iso, 0., 1.));   // (its edge wanders)
    }
    col = mix(col, uPark * mix(.8 + .4 * vn(p0 / 41.), 1., smoothstep(14., 50., iso)), dark);
    // THE SEAMS between quarters: a wider street with its lamps, four in ten a boulevard with a brighter chain
    float fwS = foot(sn), road = band(seam, mix(6., 11., big), fwS);
    col = mix(col, uStreet * mix(.45, 1., big), road);
    col += uLamp * (lampRow(abs(dot(pw, st)), mix(27., 21., big), mix(3., 4.5, big), foot(st), pair * 91.) * lamp(seam, QUARTER, mix(3., 5., big), fwS, gone) * mix(1.1, 3.6, big));
    // THE LONG BOULEVARDS: a warm roadway with a close row of lamps down each kerb, the two staggered, from end to
    // end: the built avenues' own drawing (their lamps stand so, groundLampPlaces; a built block's pavement on a
    // boulevard is of the same rank, buildCity), so a boulevard carried on from the built blocks keeps its
    // strength at their edge. Far off the two rows go to one line's mean: one bright thread to the haze
    for (int i = 0; i < ${FAR_CITY.avenues.length}; i++) {
      vec2 ab = uAve[i].zw - uAve[i].xy, pa = p0 - uAve[i].xy; float len = length(ab); vec2 t = ab / len, n = vec2(-t.y, t.x);
      float al = dot(pa, t), over = max(max(-al, al - len), 0.), d = length(vec2(dot(pa, n), over)), fwn = foot(n);
      if (d > 90. + 2. * fwn) continue;
      col = mix(col, uStreet * .62, band(d, 13., fwn));
      float side = dot(pa, n), ft = foot(t);
      col += uLamp * (3.3 * (lampRow(al, 20., 3.6, ft, float(i) * 7.7 + 3.) * lamp(side - 11., 400., 3.8, fwn, gone) + lampRow(al + 10., 20., 3.6, ft, float(i) * 7.7 + 4.) * lamp(side + 11., 400., 3.8, fwn, gone)) * step(over, 0.));
    }
    // THE SQUARES: an open paved place, a ring of lamps round it and their light gathered over its middle
    for (int i = 0; i < ${FAR_CITY.squares.length}; i++) {
      vec2 d = p0 - uKnot[i].xy; float rr = uKnot[i].z, dl = length(d);
      if (dl > rr + 60. + 2. * iso) continue;
      col = mix(col, uStreet * 1.1, clamp(.5 + (rr - dl) / iso, 0., 1.));
      col += uLamp * (4.2 * lampRow(atan(d.y, d.x) * rr + 400., 16., 4.5, iso, float(i) * 3.3 + 51.) * lamp(dl - rr * .82, 400., 5., iso, gone) + .42 * exp(-dl * dl / (.7 * rr * rr)));
    }
    // the haze over the closest quarters: a faint warm lift
    float close = closeAt(p0);
    return col + uStreet * (.05 * close * close);
  }
  void main() {
    // the roof plane and the pavements are drawn from above alone: a lens the engine stands under the ground
    // (behind the start, inside the far bank) must not see them as a lit sheet overhead
    if (vNet.x < 1.5 && !gl_FrontFacing) discard;
    vec3 col;
    if (vNet.x < .5) col = farCity(vWorld.xz);
    else if (vNet.x < 1.5) {
      float sp = 28., uu = vNet.y / sp, fw = fwidth(uu), across = (vNet.z - .4) * uStreetW * .5;
      float d = (fract(uu) - .5) * sp, edge = exp(-across * across / 20.);
      float pool = mix(exp(-d * d / 20.), .283, smoothstep(.25, .7, fw)) * edge;   // .283: a pool's mean along the kerb
      float rank = clamp((vNet.x - .6) / .8, 0., 1.);       // the street's rank (buildCity): 1 an avenue, a boulevard, the quay; low a lesser street
      // (the band's own glow is kept near the far plan's street canyons: brighter, a built street seen end on from
      // above is one solid gold bar that stops dead where the built blocks end and the plan's thin streets begin)
      col = uStreet * ((.3 + .3 * (1. - vNet.z)) * mix(.55, 1.5, rank)) + uLamp * (pool * mix(.4, 2., rank));
    } else col = uRoof * 1.25 + uStreet * .18;
    gl_FragColor = vec4(col * uNetK, 1.);
    #include <fog_fragment>
  }`;
// the net's material and a small gatherer of its four-cornered pieces: corners [x, y, z], each with its aNet
function makeNet() {
  const P = [], A = [], I = [], FC = FAR_CITY, tone = (hex) => ({ value: new THREE.Color(hex) });
  const material = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uRoof: tone(DUSK.roof), uRoofB: tone(DUSK.roofB), uCourt: tone(DUSK.court), uPark: tone(DUSK.park),
      uStreet: tone(DUSK.street), uLamp: tone(DUSK.lamp), uStreetW: { value: STREET }, uNetK: { value: 1 }, uTime: { value: 0 }, uWin: { value: DUSK.windows },
      uAve: { value: FC.avenues.map((q) => new THREE.Vector4(q[0], q[1], q[2], q[3])) }, uKnot: { value: FC.squares.map((q) => new THREE.Vector3(q[0], q[1], q[2])) },
      uDark: { value: FC.dark.map((q) => new THREE.Vector4(q[0], q[1], q[2], q[3])) }, uDarkTurn: { value: FC.dark.map((q) => new THREE.Vector2(Math.cos(q[4] * RAD), Math.sin(q[4] * RAD))) },
      uHeart: { value: new THREE.Vector4(...FC.heart) } },
    vertexShader: NET_VS, fragmentShader: NET_FS });
  // (a level piece, the roof plane's or a pavement's, is laid with its face up whichever way its corners were
  // given: the program draws those from above alone)
  const quad = (p0, p1, p2, p3, n0, n1, n2, n3) => {
    const i = P.length / 3, down = n0[0] < 1.5 && (p1[2] - p0[2]) * (p2[0] - p0[0]) - (p1[0] - p0[0]) * (p2[2] - p0[2]) < 0;
    if (down) { P.push(...p0, ...p3, ...p2, ...p1); A.push(...n0, ...n3, ...n2, ...n1); } else { P.push(...p0, ...p1, ...p2, ...p3); A.push(...n0, ...n1, ...n2, ...n3); }
    I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  const mesh = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aNet', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material); m.name = 'city-net'; return m;
  };
  return { material, quad, mesh, get triangles() { return I.length / 3; } };
}

// THE FAR CITY'S ROOF PLANE, laid into the net: level with the built blocks' cornices, from the built city's edges
// and the far reaches' quays out to the ground's edge on both banks, with plain edge walls down to the ground
// toward the river and toward the built city. WORKING: its height, the mean of the cornices.
const ROOF_Y = 21;
function layFarRoofs(net, farZ) {
  const Y = ROOF_Y, G = FRAME.groundY, xs = [];
  const quayZ = (x, sgn) => riverZ(x) + sgn * (RIVER_HALF + QUAY_ROAD) * Math.hypot(1, riverSlope(x));
  for (let x = RIVER_REACH; x > CITY.x; x -= 100) xs.push(x);
  xs.push(CITY.x, -CITY.x);
  for (let x = -Math.ceil(CITY.x / 100) * 100; x >= -RIVER_REACH; x -= 100) xs.push(x);
  const wall = (ax, az, bx, bz) => net.quad([ax, G, az], [bx, G, bz], [bx, Y, bz], [ax, Y, az], [2, 0, 0], [2, 0, 0], [2, 0, 0], [2, 0, 0]);
  for (let i = 0; i + 1 < xs.length; i++) {
    const xa = xs[i], xb = xs[i + 1], middle = xa === CITY.x && xb === -CITY.x;
    for (const [sgn, bank] of [[1, 0], [-1, 1]]) {
      const inner = sgn > 0 ? CITY.zSouth : CITY.zNorth, za = middle ? inner : quayZ(xa, sgn), zb = middle ? inner : quayZ(xb, sgn), n = [0, bank, 0];
      net.quad([xa, Y, za], [xb, Y, zb], [xb, Y, sgn * farZ], [xa, Y, sgn * farZ], n, n, n, n);
      wall(xa, za, xb, zb);
      if (middle) { wall(xa, quayZ(xa, sgn), xa, inner); wall(xb, quayZ(xb, sgn), xb, inner); }   // the two walls facing the built city across its last streets
    }
  }
}

// ---- THE CITY'S BLOCKS. INVENTED BY NEED, as the plan they stand on is (the common house of the Paris of 1889; no
// line of the sources gives a block). Pale stone to a cornice about 20 m up with the kit's window pattern, a dark slate mansard, a
// zinc cap, rows of chimneys; nothing lettered. Two kinds, chosen at build by where the route runs low (order L1: a
// level of detail by the route, never by the eye): near it a block is a ring of single houses round a dark court,
// each with its own cornice and tone; elsewhere it is one plain mass under one roof.
const CITY_WALLS = ['#cdbfa3', '#c2b59c', '#b9ab92', '#d3c8b0', '#bcb2a2', '#c8b79a'], CITY_SLATE = '#3f434e', CITY_ZINC = '#74777a', CITY_STACK = '#6b5a4e', CITY_COURT = '#34343a';
const MANSARD = 3.4, COURT_IN = 15, RIDGE_UP = 2.2, NEAR_REACH = 350, NEAR_UNDER = 90;   // the mansard's height; a court's distance in from the street; a block is near when within 350 m in plan of the line where it flies under 90 m
function makeCityTones() {
  return { walls: CITY_WALLS.map(S.lin), slate: S.lin(CITY_SLATE), zinc: S.lin(CITY_ZINC), stack: S.lin(CITY_STACK), court: S.lin(CITY_COURT) };
}
// a mansard over a convex outline from y0, drawn in 2.4 m, under a low zinc roof of tone k (two slopes to a ridge
// round the court, or one hipped cap where there is no court); returns the mansard's upper outline
function mansardOver(b, T, poly, y0, k = 1) {
  const top = insetOutline(poly, 2.4) || poly, n = poly.length, y1 = y0 + MANSARD;
  b.col(T.slate, 0.8, 1.05).surf(S.SURF.TILES, 0, 1);
  for (let i = 0; i < n; i++) {
    const a = poly[i], c = poly[(i + 1) % n], a2 = top[i], c2 = top[(i + 1) % n];
    b.quad([a[0], y0, a[1]], [c[0], y0, c[1]], [c2[0], y1, c2[1]], [a2[0], y1, a2[1]], [0, 0, Math.hypot(c[0] - a[0], c[1] - a[1]), MANSARD * 1.2]);
  }
  // the zinc roof: a ring round a dark court sunk 9 m where the block is wide enough for one, else a whole cap
  const court = insetOutline(poly, COURT_IN), ridge = court && insetOutline(poly, (2.4 + COURT_IN) / 2), P = (q, y) => [q[0], y, q[1]], yr = y1 + RIDGE_UP;
  b.col(T.zinc.map((v) => v * k)).surf(S.SURF.PLAIN);
  if (!court || !ridge) {
    const m = outlineMiddle(top);
    for (let i = 0; i < n; i++) b.tri(P(top[i], y1), P(top[(i + 1) % n], y1), P(m, yr));
    return top;
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    b.quad(P(top[i], y1), P(top[j], y1), P(ridge[j], yr), P(ridge[i], yr)).quad(P(ridge[i], yr), P(ridge[j], yr), P(court[j], y1), P(court[i], y1));
  }
  // the court's walls: the houses' backs, their windows lit here and there
  b.col(T.walls[0], 0.5, 0.8).surf(S.SURF.WINDOW, 0.37 + 0.11 * n, 0.9);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, len = Math.hypot(court[j][0] - court[i][0], court[j][1] - court[i][1]); b.quad(P(court[j], y1 - 9), P(court[i], y1 - 9), P(court[i], y1), P(court[j], y1), [0, 0, Math.max(1, Math.round(len / 2.6)), 3]); }
  b.col(T.court).surf(S.SURF.PLAIN);
  for (let i = 1; i + 1 < n; i++) b.tri(P(court[0], y1 - 9), P(court[i], y1 - 9), P(court[i + 1], y1 - 9));
  return top;
}
// INVENTED BY NEED, WORKING: how awake a district of the built city is by night, for its share of lit windows: a smooth number of the place,
// some 250 m across, about 1 in the mean (the far plan's lit fronts gather the same way, NET_FS): lit windows in
// warm uneven clusters, no even sowing
function districtAwake(x, z) {
  const gx = x / 250 + 64, gz = z / 250 + 64, ix = Math.floor(gx), iz = Math.floor(gz), sm = (t) => t * t * (3 - 2 * t), fx = sm(gx - ix), fz = sm(gz - iz), h = (i, j) => hash01(i * 256 + j, 58);
  const v = (h(ix, iz) * (1 - fx) + h(ix + 1, iz) * fx) * (1 - fz) + (h(ix, iz + 1) * (1 - fx) + h(ix + 1, iz + 1) * fx) * fz;
  return 0.25 + 1.75 * sm(Math.min(1, Math.max(0, (v - 0.32) / 0.38)));
}
// the plain kind: one mass, one roof, a chimney row along each of its two longest sides
function plainBlock(b, T, blk) {
  const { poly, id } = blk, n = poly.length, G = FRAME.groundY, cornice = 15 + 10 * hash01(id, 21);   // (unlike enough that a quay's row of blocks, seen low from the river, is no one flat-topped wall)
  b.col(T.walls[Math.floor(hash01(id, 24) * T.walls.length)], 0.7, 1).surf(S.SURF.WINDOW, hash01(id, 22), (0.3 + 0.8 * hash01(id, 23)) * districtAwake(blk.x, blk.z));
  b.prism(poly, G, cornice, { cellW: 2.6, cellH: 3.2, top: false });
  const top = mansardOver(b, T, poly, cornice, 0.75 + 0.5 * hash01(id, 25)), sides = [];
  for (let i = 0; i < n; i++) { const a = top[i], c = top[(i + 1) % n]; sides.push([Math.hypot(c[0] - a[0], c[1] - a[1]), a, c]); }
  sides.sort((p, q) => q[0] - p[0]);
  b.col(T.stack, 0.8, 1).surf(S.SURF.PLAIN);
  for (const [len, a, c] of sides.slice(0, 2)) {
    b.tr((a[0] + c[0]) / 2, 0, (a[1] + c[1]) / 2, Math.atan2(-(c[1] - a[1]), c[0] - a[0]));
    b.cbox(0, cornice + MANSARD, -2.2, len * 0.55, 1.5, 1.0);
    b.pop();
  }
}
// the near kind: single houses along every side, each owning the corner it starts from, round a dark court
function housesBlock(b, T, blk) {
  const { poly, id } = blk, n = poly.length, G = FRAME.groundY, DEEP = 13;
  for (let i = 0; i < n; i++) {
    const a = poly[i], c = poly[(i + 1) % n], dx = c[0] - a[0], dz = c[1] - a[1], run = Math.hypot(dx, dz) - DEEP;
    if (run < 9) continue;
    const count = Math.max(1, Math.round(run / 19));
    b.tr(a[0], 0, a[1], Math.atan2(-dz, dx));               // X along the side, Z outward
    for (let k = 0; k < count; k++) {
      const hid = id * 64 + i * 8 + k, x0 = run * k / count, x1 = run * (k + 1) / count, cornice = 16.5 + 6 * hash01(hid, 31);
      b.col(T.walls[Math.floor(hash01(hid, 34) * T.walls.length)], 0.7, 1).surf(S.SURF.WINDOW, hash01(hid, 32), 0.3 + 1.0 * hash01(hid, 33));
      b.box(x0, G, -DEEP, x1, cornice, 0, { cellW: 2.4, cellH: 3.2, top: false });
      b.col(T.slate, 0.8, 1.05).surf(S.SURF.TILES, 0, 1).frustum((x0 + x1) / 2, -DEEP / 2, x1 - x0, DEEP, x1 - x0, DEEP - 4.6, cornice, cornice + MANSARD, { m: 1, capColor: T.zinc });
      b.col(T.stack, 0.8, 1).surf(S.SURF.PLAIN).cbox(x0 + 0.5, cornice + 0.5, -DEEP / 2, 0.9, MANSARD + 1.3, DEEP * 0.5);
    }
    b.pop();
  }
  const court = insetOutline(poly, DEEP - 0.5);
  if (court) { b.col(T.court).surf(S.SURF.PLAIN); for (let i = 1; i + 1 < n; i++) b.tri([court[0][0], G + 0.3, court[0][1]], [court[i][0], G + 0.3, court[i][1]], [court[i + 1][0], G + 0.3, court[i + 1][1]]); }
}

// THE CITY, laid in chunks of 200 m with a step between chunks, into a few meshes: the near houses of each bank and
// the plain blocks of each bank's upstream and downstream halves. Tones and shapes come from each block's number.
async function buildCity(ctx, scene, mats, net) {
  const blocks = cityBlocks(), T = makeCityTones(), C = ROUTE.curve, low = [];
  await ctx.yield();
  for (let i = 0; i < C.count; i += 40) if (C.y[i] < NEAR_UNDER) low.push(C.x[i], C.z[i]);
  const chunkOf = (blk) => Math.floor(blk.x / 200) * 64 + Math.floor(blk.z / 200);
  blocks.sort((p, q) => chunkOf(p) - chunkOf(q) || p.id - q.id);
  const builders = new Map();
  const into = (name) => { if (!builders.has(name)) builders.set(name, new S.Builder(8192)); return builders.get(name); };
  let last = null, near = 0;
  const nearBlocks = [];                                  // the blocks built as single houses: the chimneys that smoke are theirs
  // A STREET'S RANK (INVENTED BY NEED, WORKING), for the pavement along a block's side from a to c: 1 where the side looks on a road wider
  // than a street (an avenue, a boulevard, the quay road, an open plot: no block stands a street's breadth across
  // from its middle); else a low number of the street's own, the same along its whole length and on both its
  // pavements (it is dealt from the street's middle line), so that one lesser street is fainter than the next.
  // A side on the built city's outer edge is a lesser street's (the far plan's thin streets carry on from it).
  const within = (q, x, z) => {
    const n = q.poly.length;
    for (let i = 0; i < n; i++) { const p = q.poly[i], r = q.poly[(i + 1) % n], dx = r[0] - p[0], dz = r[1] - p[1]; if ((x - p[0]) * dz - (z - p[1]) * dx < -3 * Math.hypot(dx, dz)) return false; }
    return true;
  };
  const streetRank = (blk, a, c) => {
    const dx = c[0] - a[0], dz = c[1] - a[1], l = Math.hypot(dx, dz) || 1, ox = -dz / l, oz = dx / l, mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2;
    const px = mx + ox * (STREET + 5), pz = mz + oz * (STREET + 5), flip = ox > 1e-6 || (Math.abs(ox) <= 1e-6 && oz > 0) ? 1 : -1;
    const lesser = 0.42 * hash01(Math.round(((mx + ox * STREET / 2) * ox + (mz + oz * STREET / 2) * oz) * flip / 4) * 64 + Math.round(Math.atan2(oz * flip, ox * flip) * 9), 59);
    if (Math.abs(px) > CITY.x - 1 || pz > CITY.zSouth - 1 || pz < CITY.zNorth + 1) return lesser;
    for (const q of blocks) if (q !== blk && Math.abs(q.x - px) < 140 && Math.abs(q.z - pz) < 140 && within(q, px, pz)) return lesser;
    return 1;
  };
  for (const blk of blocks) {
    const ch = chunkOf(blk);
    if (ch !== last) { await ctx.yield(); last = ch; }
    let d2 = Infinity;
    for (let i = 0; i < low.length; i += 2) d2 = Math.min(d2, (low[i] - blk.x) ** 2 + (low[i + 1] - blk.z) ** 2);
    // the gaslit pavement round the block, out to the middle of each street, of its street's rank
    const kerb = insetOutline(blk.poly, -STREET / 2), PAVE_Y = FRAME.groundY + 0.15;
    for (let i = 0; kerb && i < kerb.length; i++) {
      const j = (i + 1) % kerb.length, a = blk.poly[i], c = blk.poly[j], a2 = kerb[i], c2 = kerb[j], len = Math.hypot(c[0] - a[0], c[1] - a[1]), k = 0.6 + 0.8 * streetRank(blk, a, c);
      net.quad([a[0], PAVE_Y, a[1]], [c[0], PAVE_Y, c[1]], [c2[0], PAVE_Y, c2[1]], [a2[0], PAVE_Y, a2[1]], [k, 0, 0], [k, len, 0], [k, len, 1], [k, 0, 1]);
    }
    const bank = blk.bank === 0 ? 'tower-bank' : 'far-bank';
    if (d2 < NEAR_REACH * NEAR_REACH) { housesBlock(into('city-houses-' + bank), T, blk); nearBlocks.push(blk); near++; }
    else plainBlock(into('city-blocks-' + bank + (blk.x < 0 ? '-downstream' : '-upstream')), T, blk);
  }
  let triangles = 0;
  for (const [name, b] of builders) {
    await ctx.yield();
    const mesh = new THREE.Mesh(b.toGeometry(), mats.facade); mesh.name = name; triangles += b.triangles;
    scene.add(mesh);
  }
  await ctx.yield();
  return { blocks: blocks.length, near, nearBlocks, triangles, meshes: builders.size };
}

// ---- ACROSS THE RIVER: the Trocadero's hill, its palace, its cascade and its garden, as plain masses (nothing finer
// than a metre or so). SOURCED: the round hall (z -690 to -600, lantern 57 m), the two towers at x 50 either
// side (82.5 m), the two curved wings to 430 m overall ending at z -570 (figures.md B, table; src-site.md
// "Trocadero"), and that the whole burned with gas at night ("gas, 15,000 burners on ordinary nights", "presque un
// brasier", src-light.md 6; figures.md C "gas gold"). INVENTED BY NEED (the sources give the overall sizes and
// the gas, no drawing and no burner's place): the wings' end pavilions, the storeys' heights, the towers' square plan, their open
// stage and gilt dome, the arcades' and windows' number and spacing and that each is lit (PALACE_FACE), where the
// lines of gas run (PALACE_GAS). The cascade and the garden: FALLS, HILL_GARDEN below.
const TR = FRAME.trocadero;
// THE PALACE'S FACE BY NIGHT. SOURCED: that the palace burned with gas at night and how it looked ("gas, 15,000
// burners on ordinary nights", "presque un brasier", src-light.md 6; figures.md C "gas gold"). The sources give
// the gas and no place for a single burner, so INVENTED BY NEED: that every arcade and window is lit from within,
// the openings' number, sizes and spacing, the stone's warm wash, and every line of burners' place (PALACE_GAS).
// WORKING: every number here.
const PALACE_FACE = {
  light: '#ffb25e', arcade: 0.62, window: 0.46,          // the lit openings' colour; the strength of an arcade's light and of a window's
  wash: 1.1, washFall: 60, gilt: 1.3,                    // the gas's wash on the stone: its strength at the walls' foot, the metres over which it falls with height; on the gilt domes
  proud: 0.6,                                            // an opening lies this far off its wall (the depth buffer's step at 1 km is a fifth of a metre)
  hall: { bays: 44, w: 3.7, drum: 30 },                  // the round hall: arcades round its ring (in the whole round), their breadth; windows round its drum
  tower: { storey: 9, w: 1.7, h: 4.6 },                  // a tower's windows: a storey's height, a window's sizes
  wing: { bay: 5.2, w: 3.3, h: 12.5 },                   // a wing's gallery: a bay's length, an arch's sizes
  pavilion: { w: 4.6, h: 15 },
};
// WORKING: the hill is a smooth rise from the far quay to the palace's level, falling again at the plot's sides and back
function trocaderoY(x, z) {
  const sm = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
  return TR.hill.rise * sm((TR.hill.fromZ - z) / 220) * (1 - sm((Math.abs(x) - 240) / 85)) * (1 - sm((-770 - z) / 120));
}
// the hill's ground is drawn in flat pieces on this grid (buildTrocadero lays them; a road over the hill's foot
// takes its height from the same)
const HILL_GRID = { nx: 14, nz: 14, x0: -330, x1: 330, z0: -900, z1: TR.hill.fromZ + 5 };
// the drawn hill's height over the ground at a place: straight between its piece's four corners, each lifted a
// little over the ground as they are laid; 0 where no piece is laid
function hillY(x, z) {
  const H = HILL_GRID, fx = (x - H.x0) / (H.x1 - H.x0) * H.nx, fz = (z - H.z0) / (H.z1 - H.z0) * H.nz;
  if (fx < 0 || fx >= H.nx || fz < 0 || fz >= H.nz) return 0;
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, at = (a, b) => trocaderoY(H.x0 + (H.x1 - H.x0) * a / H.nx, H.z0 + (H.z1 - H.z0) * b / H.nz);
  const y00 = at(i, j), y10 = at(i + 1, j), y11 = at(i + 1, j + 1), y01 = at(i, j + 1);
  if (Math.max(y00, y10, y11, y01) < 0.05) return 0;
  return 0.2 + (y00 * (1 - u) + y10 * u) * (1 - v) + (y01 * (1 - u) + y11 * u) * v;
}
// THE PALACE'S LINES OF GAS. SOURCED: the gas and its number ("gas, 15,000 burners on ordinary nights",
// src-light.md 6; figures.md C "gas gold"). INVENTED BY NEED: where each line runs (the sources place no burner:
// the lines are laid along the galleries' and pavilions' cornices, round the hall's cornices and lantern, in two
// level lines round the three seen sides of each tower's head, along the cascade's terrace, cheeks and basin; none
// runs up a tower).
// WORKING: the spacings (a burner drawn stands for a score of the true ones).
const PALACE_GAS = { step: 3, towerStep: 3.4, rimStep: 5, hallTurn: 1.4 };   // metres between drawn burners; the share of a half turn the hall's rings are lit over (1.4: 252 degrees, the river's side)
// THE CASCADE'S MEASURES (FRAME.trocadero.pool: the cascade and its basin lie on the axis from z -600 to -490, the
// basin 75 by 44 m at their foot). SOURCED: the place, the basin's size, that the water fell in a cascade to a
// great basin with four animals at it (figures.md B "Cascade and pool"; src-site.md "grand bassin en cascade").
// INVENTED BY NEED (the sources give a cascade and a basin, not their drawing): eight falls of 0.85 m between level
// treads 22 m wide, stone cheeks either side, the low arcaded terrace they come from, and the basin raised as a
// stone tank on the slope (its water just over the ground at its upper end, its front wall 6 m over the garden
// toward the river). WORKING: every size here.
const FALLS = (() => {
  const PL = TR.pool, poolZ = PL.z1 - PL.sizeZ, z0 = TR.rotunda.z1 + 4, steps = 8, riser = 0.85;
  const poolY = TR.hill.rise * (() => { const t = Math.min(1, Math.max(0, (TR.hill.fromZ - poolZ) / 220)); return t * t * (3 - 2 * t); })() + 0.6;
  return { z0, poolZ, z1: PL.z1, steps, riser, tread: (poolZ - z0) / steps, half: 11, cheek: 2, poolHalf: PL.sizeX / 2, poolY, topY: poolY + steps * riser, rim: 0.7, wall: 1.2 };
})();
// THE GARDEN'S PLAN on the hill before the palace.
// SOURCED: that the palace and its grounds burned with gas at night ("gas, 15,000 burners on ordinary nights",
// "presque un brasier", src-light.md 6): the garden's lamps are part of that fire.
// INVENTED BY NEED (the sources give the hill and its rise and no drawing of its garden; a bare slope cannot stand
// for it): two curved gravel avenues from the wings' end pavilions round to the garden's foot before the bridge, a
// broad walk down the axis from the basin, walks beside the cascade and round the basin, a terrace walk before the
// wings, three level cross terraces held by low stone walls with a parapet (the uppermost in line with the
// basin's front wall), lawns between, trees outside the avenues, and where each lamp stands. WORKING: every size
// and spacing; a lamp here stands for many of the true burners.
const HILL_GARDEN = {
  foot: [34, -380],                                      // where each curved avenue comes to the garden's foot: |x|, z
  avenue: { half: 4, lamps: 14, parts: 24 },             // an avenue's half breadth, the metres between its pairs of lamps, its straight lengths
  axis: { half: 6, lamps: 13 },
  side: { half: 4.5, off: 5.5 },                         // the walks beside the cascade and the basin: half breadth, metres off the stone
  wings: { half: 5, off: 9, lamps: 12 },                 // the terrace walk before the wings: half breadth, metres off the wings' face
  terraces: [-492, -446, -402],                          // the cross terraces' middles (z)
  terrace: { back: 4, front: 4.6, wall: 0.7, rail: 0.9, lamps: 18, gap: 8.5, short: 6 },   // metres up the hill and down it from the middle; the wall's thickness; the parapet over the walk; lamps; the axis walk's gap; how far short of the avenue it ends
  lift: 0.5, lamp: 3.6, glow: 1.2,                       // a draped walk's lift off the hill; a lamp's height; the gravel's light under its lamps
  // the trees: the grid's square, a tree's height and its crown's radius (least, most), the metres kept from an
  // avenue, the ground they stand on (|x| out to `edge`, z between; beside and behind the wings only past `flank`)
  trees: { grid: 17, height: [8, 13], crown: [3.6, 5.6], keep: 7, edge: 300, z: [-690, -386], flank: 226 },
};
async function buildTrocadero(ctx, scene, mats) {
  const b = new S.Builder(8192), TOP = TR.hill.rise, RO = TR.rotunda, TW = TR.towers;
  const LAWN = S.lin('#5a6a5c'), RIM = S.lin('#b7ab93'), STONE = S.lin('#b9a98c'), DARK = S.lin('#2a2f3a'), GILT = S.lin('#d2a84c'), WATER = S.lin('#33485e');
  // the hill, in flat pieces 47 by 40 m
  const { nx: NX, nz: NZ, x0: X0, x1: X1, z0: Z0, z1: Z1 } = HILL_GRID, at = (i, j) => { const x = X0 + (X1 - X0) * i / NX, z = Z0 + (Z1 - Z0) * j / NZ; return [x, trocaderoY(x, z), z]; };
  // (a piece that lies flat on the ground is left out; the low pieces at the rim take the ground's own pale tone)
  b.surf(S.SURF.PLAIN);
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const q = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)], top = Math.max(q[0][1], q[1][1], q[2][1], q[3][1]), k = Math.min(1, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4 / 9);
    if (top < 0.05) continue;
    for (const c of q) c[1] += 0.2;
    b.col(RIM.map((v, n) => v + (LAWN[n] - v) * k));
    laidQuad(b, q[0], q[1], q[2], q[3]);
  }
  await ctx.yield();
  // THE PALACE'S FACE BY NIGHT (PALACE_FACE): every wall of the hall, the towers, the wings and their pavilions is
  // dressed stone washed by the palace's own gas (the kit's night wash on stone, strongest low on the wall), and
  // every arcade and window is a lit opening laid just proud of it: a tall light with a narrowed head, warm gold
  // (the kit's glow, which comes up with the lamps' gate: dim in the dusk, whole by night).
  const PF = PALACE_FACE, LIGHT = S.lin(PF.light);
  const wall = (tone) => b.col(STONE, tone, 1).surf(S.SURF.MASONRY, 0, 1.6).flood(PF.wash, TOP - 4, PF.washFall);
  const roof = () => b.col(DARK).surf(S.SURF.PLAIN).flood(0);
  // an opening on a wall: its foot's middle, the wall's outward direction in plan, its breadth and height
  const opening = (x, y, z, nx, nz, w, h) => {
    const rx = nz, rz = -nx, px = x + nx * PF.proud, pz = z + nz * PF.proud, hs = h - 0.45 * w, a = w / 2, c = w * 0.2;
    b.quad([px - rx * a, y, pz - rz * a], [px + rx * a, y, pz + rz * a], [px + rx * a, y + hs, pz + rz * a], [px - rx * a, y + hs, pz - rz * a]);
    b.quad([px - rx * a, y + hs, pz - rz * a], [px + rx * a, y + hs, pz + rz * a], [px + rx * c, y + h, pz + rz * c], [px - rx * c, y + h, pz - rz * c]);
  };
  const lights = (k) => b.col(LIGHT).surf(S.SURF.GLOW, 0, k).flood(0);
  // the round hall: a wide ring of two storeys of arcades, a higher drum of tall windows, a low cone and its lantern
  // (heights over the hill's top); the openings stand on the three quarters of each round turned to the river
  const rc = (RO.z0 + RO.z1) / 2, rr = (RO.z1 - RO.z0) / 2, ringR = rr * 0.74;
  wall(0.6).lathe(RO.x, TOP, rc, [[rr, 0], [rr, 22]], 28, { m: 1 });
  roof().lathe(RO.x, TOP + 22, rc, [[rr, 0], [ringR, 3]], 28);
  wall(0.75).lathe(RO.x, TOP + 25, rc, [[ringR, 0], [ringR, 15]], 28, { m: 1 });
  roof().lathe(RO.x, TOP + 40, rc, [[rr * 0.76, 0], [5, 11], [5, 14], [0, RO.lantern - 40]], 28);
  await ctx.yield();
  const round = (r, n, y, w, h) => { for (let k = 0; k < n; k++) { const a = Math.PI * 2 * (k + 0.5) / n; if (Math.sin(a) > -0.72) opening(RO.x + r * Math.cos(a), y, rc + r * Math.sin(a), Math.cos(a), Math.sin(a), w, h); } };
  lights(PF.arcade); round(rr, PF.hall.bays, TOP + 1.2, PF.hall.w, 8.6); round(rr, PF.hall.bays, TOP + 12, PF.hall.w, 8.4);
  lights(PF.window); round(ringR, PF.hall.drum, TOP + 27, 2.8, 10.5); round(5, 8, TOP + 51.4, 1.5, 2.4);
  await ctx.yield();
  // the two towers: a square shaft with lit windows up it, an open stage, a gilt dome and its point
  for (const tx of TW.x) {
    const shaft = TW.height * 0.78, stage = TW.height * 0.1;
    wall(0.55).cbox(tx, TOP, TW.z, 13, shaft, 13, { m: 1, capColor: DARK, capStyle: S.SURF.PLAIN });
    wall(0.8).cbox(tx, TOP + shaft, TW.z, 10, stage, 10, { m: 1, capColor: DARK, capStyle: S.SURF.PLAIN });
    b.col(GILT, 0.7, 1.1).surf(S.SURF.PLAIN).flood(PF.gilt, TOP + shaft, 30).sphere(tx, TOP + TW.height * 0.88, TW.z, 5.6, 12, 6, { sy: 1.25 });
    b.cyl(tx, TOP + TW.height * 0.93, TW.z, 0.7, 0.1, TW.height * 0.07, 6);
    for (const [nx, nz] of [[0, 1], [1, 0], [-1, 0]]) {
      lights(PF.window);
      for (let y = TOP + 7; y + 5 < TOP + shaft; y += PF.tower.storey) for (const off of [-3.1, 3.1]) opening(tx + nx * 6.5 + nz * off, y, TW.z + nz * 6.5 - nx * off, nx, nz, PF.tower.w, PF.tower.h);
      lights(PF.arcade);
      for (const off of [-2.3, 2.3]) opening(tx + nx * 5 + nz * off, TOP + shaft + 0.8, TW.z + nz * 5 - nx * off, nx, nz, 2.4, stage - 2);
    }
  }
  await ctx.yield();
  // the two wings: an arc about a point on the axis, from each tower out to the wing's end, in straight lengths,
  // each length a gallery of tall lit arches over a plain base on the side turned to the river
  // (each ends in a pavilion 28 m square whose outer face stands at the wing's end, so that the whole is FRAME's width)
  const WG = TR.wings, WING_DEEP = 17, WING_H = 17, SEG = 8, PAV = 28, PAV_X = WG.overall / 2 - PAV / 2;
  const zc = (PAV_X * PAV_X + WG.endZ * WG.endZ - TW.x[1] * TW.x[1] - TW.z * TW.z) / (2 * (WG.endZ - TW.z)), R = Math.hypot(TW.x[1], TW.z - zc);
  const f0 = Math.asin(TW.x[1] / R), f1 = Math.asin(PAV_X / R);
  for (const side of [-1, 1]) {
    const P = (f, r) => [side * r * Math.sin(f), zc - r * Math.cos(f)], ro = R + WING_DEEP / 2, ri = R - WING_DEEP / 2;
    for (let k = 0; k < SEG; k++) {
      const fa = f0 + (f1 - f0) * k / SEG, fb = f0 + (f1 - f0) * (k + 1) / SEG;
      const poly = side > 0 ? [P(fa, ri), P(fb, ri), P(fb, ro), P(fa, ro)] : [P(fb, ri), P(fa, ri), P(fa, ro), P(fb, ro)];
      wall(0.6).prism(poly, TOP - 4, TOP + WING_H, { m: 1, capColor: DARK });
      // the gallery's arches along this length's river face (its outward direction: toward the arc's middle point)
      const A = P(fa, ri), B = P(fb, ri), len = Math.hypot(B[0] - A[0], B[1] - A[1]), bays = Math.max(1, Math.round(len / PF.wing.bay)), mx = (A[0] + B[0]) / 2, mz = (A[1] + B[1]) / 2, ml = Math.hypot(mx, mz - zc);
      lights(PF.arcade);
      for (let n = 0; n < bays; n++) { const t = (n + 0.5) / bays; opening(A[0] + (B[0] - A[0]) * t, TOP + 1.5, A[1] + (B[1] - A[1]) * t, -mx / ml, (zc - mz) / ml, PF.wing.w, PF.wing.h); }
    }
    wall(0.6).cbox(side * PAV_X, TOP - 6, WG.endZ, PAV, WING_H + 13, PAV, { m: 1, top: false });
    roof().hip(side * PAV_X - PAV / 2, WG.endZ - PAV / 2, side * PAV_X + PAV / 2, WG.endZ + PAV / 2, TOP + WING_H + 7, 7, { ridge: 0.1, overhang: 0, style: S.SURF.PLAIN });
    // the pavilion: three tall arches on its river face and on each flank
    lights(PF.arcade);
    for (const [nx, nz] of [[0, 1], [1, 0], [-1, 0]]) for (const off of [-8, 0, 8]) opening(side * PAV_X + nx * PAV / 2 + nz * off, TOP + 1.5, WG.endZ + nz * PAV / 2 - nx * off, nx, nz, PF.pavilion.w, PF.pavilion.h);
    await ctx.yield();
  }
  // THE CASCADE AND ITS BASIN (FALLS): eight level treads of water between two stone cheeks, a fall from each to the
  // next, down from a low arcaded terrace before the hall to the basin; the basin a raised stone tank whose front
  // wall stands over the garden toward the river. The water here is a dim still tone; its light and its motion
  // are the shimmer's (buildCascade), laid over it.
  const F = FALLS, CHEEK = S.lin('#c9bda4'), yb = (z) => trocaderoY(F.half + F.cheek, z) - 0.6;
  b.flood(0.9, TOP, 14);
  b.col(STONE, 0.6, 1).surf(S.SURF.ARCHED, 0.43, 1.6).box(-F.half - 5, TOP, RO.z1 - 1, F.half + 5, F.topY + 1.3, F.z0, { cellW: 5.2, cellH: F.topY + 1.3 - TOP, capColor: CHEEK });
  for (let k = 0; k < F.steps; k++) {
    const za = F.z0 + k * F.tread, zb = za + F.tread, y = F.topY - k * F.riser;
    b.col(WATER).surf(S.SURF.PLAIN);
    laidQuad(b, [-F.half, y, za], [F.half, y, za], [F.half, y, zb], [-F.half, y, zb]);
    b.quad([-F.half, y - F.riser, zb], [F.half, y - F.riser, zb], [F.half, y, zb], [-F.half, y, zb]);   // the fall's face, toward the river
    b.col(CHEEK, 0.6, 1).surf(S.SURF.MASONRY, 0, 1.2);
    for (const sx of [-1, 1]) b.box(Math.min(sx * F.half, sx * (F.half + F.cheek)), yb(zb), za, Math.max(sx * F.half, sx * (F.half + F.cheek)), y + 0.9, zb, { m: 1 });
  }
  await ctx.yield();
  // the basin: its water, its four walls up to a rim (the back wall in two lengths either side of the cascade)
  const PH = F.poolHalf, PW = F.wall, rimY = F.poolY + F.rim, lowY = trocaderoY(0, F.z1 + PW) - 0.6;
  b.col(WATER).surf(S.SURF.PLAIN);
  laidQuad(b, [-PH, F.poolY, F.poolZ], [PH, F.poolY, F.poolZ], [PH, F.poolY, F.z1], [-PH, F.poolY, F.z1]);
  b.col(CHEEK, 0.55, 1).surf(S.SURF.MASONRY, 0, 1.4).flood(1.1, lowY, 10);
  b.box(-PH - PW, lowY, F.z1, PH + PW, rimY, F.z1 + PW, { m: 1 });
  for (const sx of [-1, 1]) {
    b.box(Math.min(sx * PH, sx * (PH + PW)), lowY, F.poolZ - PW, Math.max(sx * PH, sx * (PH + PW)), rimY, F.z1, { m: 1 });
    b.box(Math.min(sx * (F.half + F.cheek), sx * PH), yb(F.poolZ), F.poolZ - PW, Math.max(sx * (F.half + F.cheek), sx * PH), rimY, F.poolZ, { m: 1 });
  }
  // the basin's four animals: a plain gilt mass of a beast on a stone pedestal at each corner of the basin's wall
  // (no feature). WORKING: their places and sizes.
  b.flood(0.9, rimY, 8);
  for (const sx of [-1, 1]) for (const pz of [F.poolZ - PW / 2, F.z1 + PW / 2]) {
    const px = sx * (PH + PW / 2), y = rimY, toward = 1;   // each faces the river
    b.col(STONE, 0.6, 1).surf(S.SURF.MASONRY, 0, 1.2).cbox(px, y, pz, 3, 2.4, 4.6, { m: 1 });
    b.col(GILT, 0.5, 0.85).surf(S.SURF.PLAIN);
    b.cbox(px, y + 2.4, pz + toward * 1.2, 0.5, 1.2, 0.5).cbox(px, y + 2.4, pz - toward * 1.2, 0.5, 1.2, 0.5);
    b.cbox(px, y + 3.6, pz, 1.3, 1.5, 3.6).cbox(px, y + 4.5, pz + toward * 2.1, 0.8, 1.2, 1.1);
  }
  // THE GARDEN (HILL_GARDEN). Its lamps' places go to `garden`, for the same glows as the palace's gas.
  const GN = HILL_GARDEN, GRAVEL = S.lin('#c4bfb4'), LEAF = S.lin('#4f6e58'), garden = [];
  // a walk along a line of plan points [x, z], `half` either side, draped on the hill; a pair of lamps every `step`
  // metres along it, one at each edge (0: none)
  const walk = (pts, half, step) => {
    let prev = null, run = 0, next = step / 2;
    for (let k = 0; k < pts.length; k++) {
      const a = pts[Math.max(0, k - 1)], c = pts[Math.min(pts.length - 1, k + 1)], l = Math.hypot(c[0] - a[0], c[1] - a[1]), nx = -(c[1] - a[1]) / l, nz = (c[0] - a[0]) / l, p = pts[k];
      const edge = (sd) => { const x = p[0] + sd * nx * half, z = p[1] + sd * nz * half; return [x, hillY(x, z) + GN.lift, z]; }, here = [edge(1), edge(-1)];
      if (prev) {
        laidQuad(b, prev[0], prev[1], here[1], here[0]);
        const q = pts[k - 1], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        for (; step && next <= run + d; next += step) for (const sd of [-1, 1]) {
          const t = (next - run) / d, x = q[0] + (p[0] - q[0]) * t + sd * nx * (half + 1), z = q[1] + (p[1] - q[1]) * t + sd * nz * (half + 1);
          garden.push([x, hillY(x, z) + GN.lamp, z]);
        }
        run += d;
      }
      prev = here;
    }
  };
  const line = (x0, z0, x1, z1) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 10)), o = []; for (let k = 0; k <= n; k++) o.push([x0 + (x1 - x0) * k / n, z0 + (z1 - z0) * k / n]); return o; };
  // an avenue's |x| at a z of its curve (a quarter of an oval from the pavilion's front to the foot)
  const aveTop = WG.endZ + PAV / 2 + 6, aveA = PAV_X - GN.foot[0], aveB = GN.foot[1] - aveTop;
  const aveX = (z) => GN.foot[0] + aveA * Math.sqrt(Math.max(0, 1 - ((z - aveTop) / aveB) ** 2));
  b.col(GRAVEL).surf(S.SURF.PLAIN).flood(GN.glow, 99, 1);   // (the same light at every height)
  const sideX = F.half + F.cheek + GN.side.off, poolX = PH + PW + GN.side.off, T1 = GN.terraces[0];
  for (const sx of [-1, 1]) {
    const ave = []; for (let k = 0; k <= GN.avenue.parts; k++) { const f = Math.PI / 2 * k / GN.avenue.parts; ave.push([sx * (GN.foot[0] + aveA * Math.cos(f)), aveTop + aveB * Math.sin(f)]); }
    ave.push([0, GN.foot[1]]);
    walk(ave, GN.avenue.half, GN.avenue.lamps);
    walk(line(sx * sideX, RO.z1 + 2, sx * sideX, F.poolZ - 6), GN.side.half, 0);
    walk(line(sx * (sideX - GN.side.half), F.poolZ - 6, sx * (poolX + GN.side.half), F.poolZ - 6), GN.side.half, 0);
    walk(line(sx * poolX, F.poolZ - 6, sx * poolX, T1 - GN.terrace.back), GN.side.half, 0);
    // the terrace walk before the wing, on the wing's arc, and its link to the cascade's side
    const rw = R - WING_DEEP / 2 - GN.wings.off, fa = Math.asin((TW.x[1] - 3) / rw), fb = Math.asin((PAV_X - PAV / 2 - GN.wings.half - 4) / rw), arc = [];
    for (let k = 0; k <= SEG; k++) { const f = fa + (fb - fa) * k / SEG; arc.push([sx * rw * Math.sin(f), zc - rw * Math.cos(f)]); }
    walk(arc, GN.wings.half, GN.wings.lamps);
    walk(line(arc[0][0], arc[0][1], sx * sideX, RO.z1 + 2), GN.side.half, 0);
  }
  walk(line(0, T1 + GN.terrace.front + GN.terrace.wall, 0, GN.foot[1]), GN.axis.half, GN.axis.lamps);
  await ctx.yield();
  // the cross terraces: a level gravel walk on a stone bank, its river face a wall with a parapet; two lengths
  // each, either side of the axis walk (the uppermost starts at the basin's wall), ending short of the avenue
  const TC = GN.terrace;
  GN.terraces.forEach((tz, n) => {
    const zb = tz - TC.back, zf = tz + TC.front, top = hillY(0, zb) + 0.4, low = trocaderoY(0, zf + TC.wall) - 0.6;
    const xa = n ? TC.gap : PH + PW, xb = aveX(tz) - GN.avenue.half - TC.short;
    for (const sx of [-1, 1]) {
      const x0 = Math.min(sx * xa, sx * xb), x1 = Math.max(sx * xa, sx * xb);
      b.col(CHEEK, 0.55, 1).surf(S.SURF.MASONRY, 0, 1.3).flood(1.2, low, 8);
      b.box(x0, low, zb, x1, top, zf, { m: 1, capStyle: S.SURF.PLAIN, capColor: GRAVEL });
      b.box(x0, low, zf, x1, top + TC.rail, zf + TC.wall, { m: 1 });
      for (let x = xa + TC.lamps / 2; x < xb; x += TC.lamps) garden.push([sx * x, top + GN.lamp, zb + 1], [sx * x, top + TC.rail + 1.2, zf + TC.wall / 2]);
    }
  });
  // the trees outside the avenues: one to each square of a grid, shifted within it, where the ground is the
  // garden's and no walk passes
  const TREES = GN.trees, treeRng = makeRng('trocadero-garden');
  b.col(LEAF, 0.5, 1).surf(S.SURF.PLAIN).flood(0.9, 99, 1);
  for (let x = TREES.grid / 2; x < TREES.edge; x += TREES.grid) for (let z = TREES.z[0]; z < TREES.z[1]; z += TREES.grid) for (const sx of [-1, 1]) {
    const tx = x + treeRng.range(-0.35, 0.35) * TREES.grid, tz = z + treeRng.range(-0.35, 0.35) * TREES.grid;
    const h = treeRng.range(TREES.height[0], TREES.height[1]), r = treeRng.range(TREES.crown[0], TREES.crown[1]);
    if (tz < aveTop ? tx < TREES.flank : tx < aveX(tz) + GN.avenue.half + TREES.keep) continue;
    if (trocaderoY(tx, tz) < 1.5) continue;              // (the hill's own ground only)
    b.lathe(sx * tx, hillY(sx * tx, tz) - 0.3, tz, [[r * 0.5, 1.6], [r, h * 0.45], [r * 0.72, h * 0.78], [0, h]], 5, { start: treeRng() * 6 });
  }
  await ctx.yield();
  b.flood(0);
  await ctx.yield();
  // THE PALACE'S GAS (PALACE_GAS): the places of its lines of burners, for the world's glows: along the river edge
  // of each wing's cornice and round the three seen sides of each end pavilion's; round the hall's two cornices on
  // the river's side and round its lantern; round the three seen sides of each tower's shaft head and under its
  // dome (two level lines, the back bare: no line runs up a tower); along the front of the terrace the cascade comes from, down both its cheeks and round
  // its basin's rim; the garden's lamps join them at the end.
  const gas = [], PG = PALACE_GAS, ri = R - WING_DEEP / 2 - 0.4;
  const row = (x0, z0, x1, z1, y, step) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / step)); for (let k = 0; k <= n; k++) gas.push([x0 + (x1 - x0) * k / n, y, z0 + (z1 - z0) * k / n]); };
  // (the three sides of a square turned to the river and to either hand)
  const three = (cx, cz, h, y, step) => { row(cx - h, cz + h, cx + h, cz + h, y, step); row(cx - h, cz - h, cx - h, cz + h - step, y, step); row(cx + h, cz - h, cx + h, cz + h - step, y, step); };
  for (const side of [-1, 1]) {
    for (let k = 0, n = Math.round(R * (f1 - f0) / PG.step); k <= n; k++) { const f = f0 + (f1 - f0) * k / n; gas.push([side * ri * Math.sin(f), TOP + WING_H + 0.6, zc - ri * Math.cos(f)]); }
    three(side * PAV_X, WG.endZ, PAV / 2 + 0.4, TOP + WING_H + 7.6, PG.step);
  }
  for (const [r, y, turn] of [[rr + 0.4, TOP + 22.6, PG.hallTurn], [ringR + 0.4, TOP + 40.6, PG.hallTurn], [5.4, TOP + 54.4, 2]]) {
    const n = Math.max(8, Math.round(r * Math.PI * turn / PG.step));
    for (let k = 0; k < n + (turn < 2 ? 1 : 0); k++) { const a = Math.PI * (0.5 - turn / 2 + turn * k / n); gas.push([RO.x + r * Math.cos(a), y, rc + r * Math.sin(a)]); }
  }
  for (const tx of TW.x) { three(tx, TW.z, 6.9, TOP + TW.height * 0.78 + 0.5, PG.towerStep); three(tx, TW.z, 5.4, TOP + TW.height * 0.88 + 0.5, PG.towerStep); }
  row(-F.half - 5, F.z0 + 0.4, F.half + 5, F.z0 + 0.4, F.topY + 1.9, PG.step);
  // (a burner on each cheek at every fall, a row along the basin's rim on its three outer sides)
  for (const sx of [-1, 1]) {
    for (let k = 0; k <= F.steps; k++) gas.push([sx * (F.half + F.cheek / 2), F.topY - Math.max(0, k - 1) * F.riser + 1.5, F.z0 + k * F.tread - (k ? 0.6 : 0)]);
    for (let z = F.poolZ + 3; z <= F.z1; z += PG.rimStep) gas.push([sx * (PH + PW / 2), rimY + 0.6, z]);
    for (let x = PG.rimStep / 2; x < PH; x += PG.rimStep) gas.push([sx * x, rimY + 0.6, F.z1 + PW / 2]);
  }
  for (const p of garden) gas.push(p);
  const mesh = new THREE.Mesh(b.toGeometry(), mats.facade); mesh.name = 'trocadero';
  scene.add(mesh);
  await ctx.yield();
  // the palace's lit masses as eight lights for its fire on the river (PALACE_SHEEN): the hall, the two towers'
  // heads, the middle of each wing's gallery, the two pavilions, the cascade's basin: [x, y, z, strength]
  const wingMid = (f0 + f1) / 2, fires = [[RO.x, TOP + 24, RO.z1, 1.2], [0, F.poolY + 3, (F.poolZ + F.z1) / 2, 1.1]];
  for (const side of [-1, 1]) fires.push([TW.x[1] * side, TOP + TW.height * 0.8, TW.z, 0.5], [side * ri * Math.sin(wingMid), TOP + 9, zc - ri * Math.cos(wingMid), 1.0], [side * PAV_X, TOP + 10, WG.endZ + PAV / 2, 0.8]);
  return { triangles: b.triangles, gas, lights: fires };
}

// ---- THE RIVER'S FAR REACHES: its bridges and its lamps, both ways from the two next bridges.
// SOURCED: the two next bridges where FRAME has them (figures.md B "River line": a stone bridge upstream, the iron
// footbridge downstream); the footbridge's close row of gas ("la passerelle de Passy est une longue dentelle
// d'or", Le Temps from the tower's top, src-light.md 7).
// INVENTED BY NEED: the three FURTHER bridges (the river ran on through the city under bridge after bridge; the
// sources name only the nearest two. These stand where memory of the map puts the next bridges that stood in
// 1889, two of stone up the river and one of iron down it (kit-history.md, by memory: an iron bridge stood
// further downstream; its six arches and its cast iron are this file's own memory, WORKING); no bridge is built between the two upper ones, where the map of 1889 has none; no
// line of research gives their places or their drawing): the upper two each the upstream bridge's own plain
// form, three low stone arches; the lower one six low arches in the footbridge's dark iron; the gas lamps on the
// four road bridges' parapets and on the far reaches' quays (a city bridge and quay of 1889 were gaslit; the
// sources give no count for them) and each bridge lamp's glint on the water beside it. WORKING: every size,
// spacing and level; a quay lamp here stands for several true ones.
// CLEAR AIR (order L5): the nearest of these (the footbridge's row and its glints) stands some 400 m from the flown line.
const FAR_RIVER = {
  quay: { from: 720, to: 2400, step: 52, globe: 0.5 },   // the far quays' lamps: beyond the near rows' last, to the haze
  // each bridge: its station, its half width, its lamps' spacing, their height over the ground, the globe drawn;
  // `stone`: built here as three low stone arches (rise, crown under the ground's level): the further two up the
  // river; `iron`: built here as so many low arches of dark iron: the further one down the river
  bridges: [
    { x: RV.upstreamBend.x, half: 10, step: 16, up: 4.4, globe: 0.5 },
    { x: RV.downstreamBend.x, half: 3, step: 7.5, up: 2.6, globe: 0.34 },
    { x: 1400, half: 9, step: 16, up: 4.4, globe: 0.5, stone: { rise: 4, crown: 0.6 } },
    { x: 1930, half: 9, step: 16, up: 4.4, globe: 0.5, stone: { rise: 4, crown: 0.6 } },
    { x: -1400, half: 9, step: 16, up: 4.4, globe: 0.5, iron: { arches: 6, rise: 2.6, crown: 0.6 } },
  ],
  glint: { out: 7, radius: 9 },                          // a bridge lamp's glint on the water, or a far quay lamp's: metres out from the parapet or the wall, its radius
};
// the far reaches' lamps for the ground's lamps: each [x, y, z, globe, glint as [x, y, z, radius]]
function farRiverLamps() {
  const R = FAR_RIVER, G = FRAME.groundY, out = [];
  for (const bank of [1, -1]) for (const side of [-1, 1]) for (let x = R.quay.from + R.quay.step; x <= R.quay.to; x += R.quay.step) {
    const [px, pz] = riverSide(side * x, bank * (RIVER_HALF + 1.3)), g = riverSide(side * x, bank * (RIVER_HALF - R.glint.out));
    out.push([px, G + GROUND_LAMPS.gas.post + 0.25, pz, R.quay.globe, [g[0], FRAME.waterY + 0.16, g[1], R.glint.radius]]);
  }
  for (const B of R.bridges) {
    const sl = riverSlope(B.x), h = Math.hypot(1, sl), n = Math.round(2 * RIVER_HALF / B.step);
    for (const sx of [-1, 1]) for (let k = 0; k <= n; k++) {
      const [mx, mz] = riverSide(B.x, -RIVER_HALF + 2 * RIVER_HALF * (k + (sx > 0 ? 0 : 0.5)) / (n + 0.5)), at = (d) => [mx + sx * d / h, mz + sx * d * sl / h];
      const p = at(B.half - 0.3), g = at(B.half + R.glint.out);
      out.push([p[0], G + B.up, p[1], B.globe, [g[0], FRAME.waterY + 0.16, g[1], R.glint.radius]]);
    }
  }
  return out;
}
// a plain bridge of N low arches square across the river's line at station x, laid into builder b: of stone in
// masonry, or (an iron tone given) of that dark iron, plain, on slimmer piers
function archBridge(b, x, HW, RISE, CROWN_UNDER, N = 3, iron = null) {
  const G = FRAME.groundY, BED_Y = FRAME.waterY - 2.5, STONE = iron || S.lin('#b9ae98'), ROAD = S.lin('#8d877c'), lo = STONE.map((v) => v * 0.55), byZ = (p) => [p[2], p[1]];
  const PIER = iron ? 2.4 : 5, SPAN = (2 * RIVER_HALF - (N - 1) * PIER) / N, CROWN = G - CROWN_UNDER, DECK = CROWN + 1.4, SEG = iron ? 6 : 10;
  const R = (SPAN * SPAN / 4 + RISE * RISE) / (2 * RISE), under = (dz) => CROWN - R + Math.sqrt(Math.max(0, R * R - dz * dz)), p = riverSide(x, 0);
  b.tr(p[0], 0, p[1], -Math.atan(riverSlope(x)));          // X along the stream, Z across it
  b.col(STONE, 0.6, 1);
  if (iron) b.surf(S.SURF.PLAIN); else b.surf(S.SURF.MASONRY, 0, 1.2);
  for (let k = 0; k < N; k++) {
    const zc = -RIVER_HALF + SPAN / 2 + k * (SPAN + PIER);
    for (let i = 0; i < SEG; i++) {
      const za = zc - SPAN / 2 + SPAN * i / SEG, zb = za + SPAN / SEG, ua = under(za - zc), ub = under(zb - zc);
      for (const sx of [-1, 1]) stoneFace(b, [[sx * HW, ua, za], [sx * HW, ub, zb], [sx * HW, DECK, zb], [sx * HW, DECK, za]], [sx, 0, 0], lo, STONE, byZ);
      stoneFace(b, [[-HW, ua, za], [HW, ua, za], [HW, ub, zb], [-HW, ub, zb]], [0, -1, 0], lo, lo, (q) => [q[0], q[2]]);
    }
    if (k + 1 < N) b.box(-HW - 2, BED_Y, zc + SPAN / 2, HW + 2, DECK, zc + SPAN / 2 + PIER, { m: 1, top: false });
  }
  b.col(STONE, 0.9, 1).box(-HW, DECK, -RIVER_HALF, -HW + 0.5, DECK + 1, RIVER_HALF, { m: 1 }).box(HW - 0.5, DECK, -RIVER_HALF, HW, DECK + 1, RIVER_HALF, { m: 1 });
  b.col(ROAD).surf(S.SURF.PLAIN);
  laidQuad(b, [-HW, DECK, -RIVER_HALF], [HW, DECK, -RIVER_HALF], [HW, DECK, RIVER_HALF], [-HW, DECK, RIVER_HALF]);
  b.pop();
}
// THE BRIDGES LAID into builder b: the stone bridge upstream (its rise 7 m, its crown 0.9 m under the ground's
// level), the three further ones (two of stone up the river, one of iron down it), and downstream the iron
// footbridge, a thin dark deck on slender piers.
// SOURCED: the stone bridge upstream and the iron footbridge downstream, each at its place (figures.md B, "River
// line"). INVENTED BY NEED: the three further ones (the river runs on past them to the ground's edge and would
// lie bare), the lower one's six arches of iron by memory of the bridge that stood there (kit-history.md gives an iron
// bridge by memory; the six arches are this file's own memory, WORKING).
// WORKING: every size (the widths, the arches' rise, the piers).
function buildFarBridges(b) {
  const G = FRAME.groundY, BED_Y = FRAME.waterY - 2.5, IRON = S.lin('#23262c');
  archBridge(b, RV.upstreamBend.x, 10, 7, 0.9);
  for (const B of FAR_RIVER.bridges) {
    if (B.stone) archBridge(b, B.x, B.half, B.stone.rise, B.stone.crown);
    if (B.iron) archBridge(b, B.x, B.half, B.iron.rise, B.iron.crown, B.iron.arches, IRON);
  }
  {
    const HW = 3, DECK = G + 0.4, DEEP = 1.6, PIERS = 6, p = riverSide(RV.downstreamBend.x, 0);
    b.tr(p[0], 0, p[1], -Math.atan(riverSlope(RV.downstreamBend.x)));
    b.col(IRON, 0.8, 1.1).surf(S.SURF.PLAIN);
    b.box(-HW, DECK - DEEP, -RIVER_HALF, HW, DECK, RIVER_HALF, { bottom: true });
    for (const sx of [-1, 1]) b.box(Math.min(sx * HW, sx * (HW - 0.15)), DECK, -RIVER_HALF, Math.max(sx * HW, sx * (HW - 0.15)), DECK + 1.1, RIVER_HALF);
    for (let k = 1; k <= PIERS; k++) for (const sx of [-1, 1]) b.cbox(sx * (HW - 0.6), BED_Y, -RIVER_HALF + 2 * RIVER_HALF * k / (PIERS + 1), 0.9, DECK - DEEP - BED_Y, 0.9, { top: false });
    b.pop();
  }
}

// ---- THE FAR LANDMARKS of FRAME.farCity, each a plain shape of the city's own stone under slate and nothing else tall:
// by night a dark dome or tower standing over the roofs against the haze's glow, the streets' gas washing its
// foot alone (FAR_MARK, INVENTED BY NEED: the sources give these no light of their own): the great dome on its
// church, the arch, the far temple's dome, the cathedral with its spire, the school's low dome. The last two of
// the far ones stand 4 km off at the ground's far edge, all but lost in the dusk's haze; FRAME's bare hill, 4.75 km
// off and beyond the ground's edge, is wholly within the haze and is not built. With them, the two next bridges.
// SOURCED in kind, PLACED BY MEMORY OF THE MAP, CHECKED BY THE AUDIT'S OWN ARITHMETIC: all five, each by its bearing,
// distance and height (figures.md B, "Far city", which marks every one as remembered). NOT BUILT: the bare hill.
// WORKING: every size but the heights and places FRAME gives.
const FAR_MARK = { wash: 0.5, fall: 16 };               // INVENTED BY NEED, WORKING: the streets' gas on a landmark's walls: its strength at the foot, the metres over which it falls with height
function buildFarLandmarks(scene, mats) {
  const b = new S.Builder(2048), FC = FRAME.farCity, G = FRAME.groundY, STONE = S.lin('#a39a88'), ROOF = S.lin(CITY_SLATE);
  const body = (x, z, w, d, h) => b.flood(FAR_MARK.wash, G, FAR_MARK.fall).col(STONE, 0.6, 0.95).surf(S.SURF.PLAIN).cbox(x, G, z, w, h, d, { capColor: ROOF });
  // a drum, a dome and a lantern on a body: the dome's top at domeTop, the lantern's point at top
  const domed = (x, z, r, y0, drumTop, domeTop, top) => {
    b.flood(0).col(STONE, 0.6, 0.75).surf(S.SURF.PLAIN).cyl(x, y0, z, r, r, drumTop - y0, 14);
    b.col(ROOF, 0.8, 1).sphere(x, drumTop, z, r * 1.04, 14, 6, { sy: (domeTop - drumTop) / (r * 1.04) });
    b.col(STONE, 0.7, 0.7).cyl(x, domeTop - 1, z, r * 0.2, r * 0.16, (top - domeTop) * 0.6 + 1, 8).cyl(x, domeTop + (top - domeTop) * 0.6, z, r * 0.16, 0, (top - domeTop) * 0.4, 8);
  };
  const iv = FC.invalides; body(iv.x, iv.z, 110, 70, 26); body(iv.x, iv.z, 56, 56, 46); domed(iv.x, iv.z, 14, 46, 64, 88, iv.height);
  const pn = FC.pantheon; body(pn.x, pn.z, 84, 110, 28); domed(pn.x, pn.z, 13, 28, 52, 72, pn.height);
  const sd = FC.schoolDome; body(sd.x, sd.z + 20, 190, 24, 18); body(sd.x, sd.z, 44, 40, 24);
  b.flood(0).col(ROOF, 0.8, 1).surf(S.SURF.PLAIN).frustum(sd.x, sd.z, 30, 30, 9, 9, 24, sd.height - 4).cyl(sd.x, sd.height - 4, sd.z, 2, 0, 4, 6);
  // the arch: two piers and the attic over the opening
  const ar = FC.arch, AW = 45, AD = 22, PIER = 13.5, OPEN_Y = 29;
  b.flood(FAR_MARK.wash, G, FAR_MARK.fall);
  for (const sx of [-1, 1]) b.col(STONE, 0.6, 0.95).cbox(ar.x + sx * (AW - PIER) / 2, G, ar.z, PIER, OPEN_Y, AD, { top: false });
  b.cbox(ar.x, OPEN_Y, ar.z, AW, ar.height - OPEN_Y, AD, { capColor: ROOF, bottom: true });
  // the cathedral: a long nave, two square towers at its head, a thin spire over the crossing
  const ct = FC.cathedral; body(ct.x, ct.z, 120, 44, 34);
  for (const sz of [-1, 1]) body(ct.x - 52, ct.z + sz * 13, 16, 16, 69);
  b.flood(0).col(ROOF).cyl(ct.x + 8, 34, ct.z, 3.2, 0, ct.height - 34, 8);
  buildFarBridges(b);
  const mesh = new THREE.Mesh(b.toGeometry(), mats.facade); mesh.name = 'far-landmarks';
  scene.add(mesh);
  return b.triangles;
}

// a quay house by its number: its station along the river and its middle's offset across, its width, depth, whole
// height (roof and all) and kind of roof. In its own bay, half the row each side of the gap at the axis.
function quayHouse(h) {
  const perSide = QH.count / 2, bay = (GROUNDS_X - QH.gapHalf) / perSide, zone = HOUSE_OFF1 - HOUSE_OFF0, side = h < perSide ? -1 : 1, k = h % perSide;
  const d = 9 + 11 * hash01(h, 5), back = 1 + (zone - 2 - d) * hash01(h, 6);
  return { x: side * (QH.gapHalf + (k + 0.5) * bay), off: HOUSE_OFF0 + back + d / 2, w: bay * (0.72 + 0.26 * hash01(h, 4)), d,
    H: QH.minHeight + (QH.maxHeight - QH.minHeight) * hash01(h, 7), kind: Math.floor(hash01(h, 3) * 6) };
}
const SHED_DRESS = { every: 6.5, door: [2.7, 2.1], lintel: 0.2, proud: 0.05, eaves: 0.24, ridge: 0.5 };   // a door to so many metres of front, its breadth and height, its lintel's height, how far it stands off the boards; the eaves board's height, the ridge board's breadth
// THE TOWER'S BANK: the low bank's sheds, the row of small quay houses (no two alike, none lettered) and the railway's
// trench with its low walls. All follow the river's line; the flown line crosses them on its climb from the bridge.
// SOURCED: figures.md B, "Low berge with sheds", "Quay houses" (43 or 44 houses, 5 to 15 m high) and "Decauville
// trench" (15 m wide, below grade). INVENTED BY NEED: each house's dress and roof (the sources give the row).
async function buildTowerBank(ctx, scene, mats) {
  const b = new S.Builder(8192), G = FRAME.groundY, LB = FRAME.lowBank;
  // a frame set at a place beside the river: its X along the stream, its Z away from the water
  const along = (x, off) => { const p = riverSide(x, off); return b.tr(p[0], 0, p[1], -Math.atan(riverSlope(x))); };
  // the sheds: long low timber sheds under tarred roofs on the low bank, their ridges 4 m over it
  // (all along the bank each way from the bridge's foot, to where the river's far reaches are too far to tell them).
  // SOURCED: figures.md B, 'Low berge with sheds'. WORKING tones: weathered boards and a tarred felt gone grey, both
  // pale enough to take the dusk's light (a dark board under a black roof reads from the line as a hole in the bank)
  const TIMBER = S.lin('#8c7f6c'), TAR = S.lin('#6a7078'), SHED_DEEP = 6.5, SHED_WALL = 2.6, SHED_REACH = 700;
  // THE SHEDS' DRESS (SHED_DRESS). INVENTED BY NEED (the sources give the low bank its sheds and no drawing of one;
  // bare, a shed reads from the river as a plank box): on the river front a row of tarred double doors, each under
  // a pale lintel; a pale board along the eaves; a pale ridge board, its top at the ridge's own height. WORKING: every size and tone.
  const SD = SHED_DRESS, DOOR = S.lin('#574e45'), BOARD = S.lin('#b3a68f');
  let n = 0;
  for (const side of [-1, 1]) for (let x = CUT_MOUTH; x < SHED_REACH; n++) {
    const len = 16 + 14 * hash01(n, 1), gap = 3 + 6 * hash01(n, 2);
    along(side * (x + len / 2), BANK_LOW + 2 + SHED_DEEP / 2);
    b.col(TIMBER, 0.7, 1).surf(S.SURF.PLANKS, 0, 1).box(-len / 2, LB.y, -SHED_DEEP / 2, len / 2, LB.y + SHED_WALL, SHED_DEEP / 2, { m: 0.5, top: false });
    b.col(TAR).gable(-len / 2, -SHED_DEEP / 2, len / 2, SHED_DEEP / 2, LB.y + SHED_WALL, LB.shedHeight - SHED_WALL, { overhang: 0.3, wallColor: TIMBER, style: S.SURF.PLAIN });
    const doors = Math.max(1, Math.round(len / SD.every)), zf = -SHED_DEEP / 2 - SD.proud, ze = -SHED_DEEP / 2 - 0.32, yw = LB.y + SHED_WALL, yr = LB.y + LB.shedHeight;
    for (let k = 0; k < doors; k++) {
      const cx = -len / 2 + len * (k + 0.5) / doors, x0 = cx - SD.door[0] / 2, x1 = cx + SD.door[0] / 2, y0 = LB.y + 0.1, y1 = LB.y + SD.door[1];
      b.col(DOOR, 0.75, 1).surf(S.SURF.PLANKS, 0, 1).quad([x1, y0, zf], [x0, y0, zf], [x0, y1, zf], [x1, y1, zf], [0, 0, SD.door[0], SD.door[1]]);
      b.col(BOARD).surf(S.SURF.PLAIN).quad([x1 + 0.18, y1, zf], [x0 - 0.18, y1, zf], [x0 - 0.18, y1 + SD.lintel, zf], [x1 + 0.18, y1 + SD.lintel, zf]);
    }
    b.col(BOARD, 0.85, 1).surf(S.SURF.PLAIN).quad([len / 2 + 0.3, yw - 0.13 - SD.eaves, ze], [-len / 2 - 0.3, yw - 0.13 - SD.eaves, ze], [-len / 2 - 0.3, yw - 0.13, ze], [len / 2 + 0.3, yw - 0.13, ze]);
    b.box(-len / 2 - 0.3, yr - 0.1, -SD.ridge / 2, len / 2 + 0.3, yr, SD.ridge / 2, { bottom: false });
    b.pop();
    x += len + gap;
    if (n % 16 === 15) await ctx.yield();
  }
  await ctx.yield();

  // the quay houses: QH.count of them in a row, half each side of the gap at the axis, each in its own bay; height,
  // width, depth, set-back, roof and tone from the house's number
  const WALLS = ['#d8cbb0', '#c9b594', '#b8a487', '#cfc6b8', '#a9856a', '#bfae9a', '#d2c2a0'].map(S.lin);
  const ROOFS = ['#3b4252', '#4a4f5a', '#5a4a44', '#3d4a4a', '#6a5a50'].map(S.lin);
  // THE HOUSES' DRESS (HOUSE_DRESS). INVENTED BY NEED (the sources give the row's houses no forms: src-site.md "Quay
  // strip", sizes not found; bare, they read as boxes from the river): a dark plinth, a pale string course over the
  // ground floor, a pale cornice under the eaves, brick chimney stacks under a pale cap and a dark block of pots, and
  // on the mansards' river slope dormers with one window each. WORKING: every size.
  const HD = HOUSE_DRESS, BRICK = S.lin('#8a5d4b'), POT = S.lin('#2c2622'), ZINC = S.lin('#7d8791');
  // (under: how far a roof with an overhang hangs below the eaves at its edge, its underside too. The cornice of
  // such a house stands wholly under that and has no top face: the roof covers it. Under a roof without an overhang
  // the cornice's ledge lies HD.cornice[2] under the eaves. Either way no face of it lies within centimetres of a
  // face of the roof: two such faces fight for depth from across the river)
  const dress = (w, d, eaves, wall, under = 0) => {
    const pale = wall.map((v) => Math.min(1, v * 1.2)), p = HD.plinth[1], c = HD.cornice[1], k = HD.course[2], top = eaves - (under || HD.cornice[2]);
    b.col(wall, 0.5, 0.58).surf(S.SURF.PLAIN).box(-w / 2 - p, G, -d / 2 - p, w / 2 + p, G + HD.plinth[0], d / 2 + p);
    if (eaves - G > HD.course[0] + 2.5) b.col(pale, 0.9, 1).box(-w / 2 - k, G + HD.course[0], -d / 2 - k, w / 2 + k, G + HD.course[0] + HD.course[1], d / 2 + k, { bottom: true });
    b.col(pale, 0.72, 1.05).box(-w / 2 - c, top - HD.cornice[0], -d / 2 - c, w / 2 + c, top, d / 2 + c, { bottom: true, top: under === 0 });
  };
  // a chimney stack at a place on the house, from its foot inside the roof to its top; its long side across the ridge
  const stack = (x, z, y0, y1, turn) => {
    const sx = turn ? HD.stack[1] : HD.stack[0], sz = turn ? HD.stack[0] : HD.stack[1];
    b.col(BRICK, 0.7, 1).surf(S.SURF.PLAIN).cbox(x, y0, z, sx, y1 - y0, sz, { top: false });
    b.col(S.lin('#cfc4ae'), 0.9, 1).cbox(x, y1, z, sx + 0.24, 0.16, sz + 0.24, { bottom: true });
    b.col(POT).cbox(x, y1 + 0.16, z, sx * 0.45, 0.45, sz * 0.75);
  };
  // the dormers of a mansard: a row on the river slope (the house's -Z), each a small box in the roof's tone with a
  // window in its front; inset is the slope's run, rise its height
  const dormers = (h, w, d, eaves, rise, inset, roof) => {
    const n = Math.max(1, Math.floor((w - 2.4) / HD.dormer[2])), tall = Math.min(HD.dormer[1], rise - 0.5), y0 = eaves + 0.25, zf = -d / 2 + 0.3;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5 - n / 2) * (w - 2.4) / n, x0 = x - HD.dormer[0] / 2, x1 = x + HD.dormer[0] / 2, zb = -d / 2 + inset * (0.25 + tall) / rise + 0.1;
      // its lid and two cheeks; the window is its front itself (a second face a few centimetres behind it would fight it for depth)
      b.col(roof, 0.8, 1).surf(S.SURF.PLAIN).box(x0, y0, zf, x1, y0 + tall, zb, { sides: false }).wall(x1, zb, x1, zf, y0, y0 + tall).wall(x0, zf, x0, zb, y0, y0 + tall);
      b.col(S.lin('#cfc6b8'), 0.85, 1).surf(S.SURF.WINDOW, hash01(h, 10) + i * 0.37, 0.5 + 0.8 * hash01(h, 11)).wall(x1, zf, x0, zf, y0, y0 + tall, { cellW: 1, cols: 1, rows: 1 });
    }
  };
  for (let h = 0; h < QH.count; h++) {
    const { x: hx, off: hoff, w, d, H, kind } = quayHouse(h);
    const wall = WALLS[Math.floor(hash01(h, 8) * WALLS.length)], roof = ROOFS[Math.floor(hash01(h, 9) * ROOFS.length)];
    const cells = { cellW: 2.2, cellH: 3, capColor: roof };
    along(hx, hoff);
    b.col(wall, 0.78, 1).surf(S.SURF.WINDOW, hash01(h, 10), 0.5 + 0.8 * hash01(h, 11));
    if (kind === 0 || kind === 1) {                         // a pitched roof, its ridge along the quay or across it
      const rise = Math.min(H * 0.32, 3.5);
      b.box(-w / 2, G, -d / 2, w / 2, G + H - rise, d / 2, { ...cells, top: false });
      b.col(roof).gable(-w / 2, -d / 2, w / 2, d / 2, G + H - rise, rise, { overhang: 0.35, alongX: kind === 0, wallColor: wall });
      dress(w, d, G + H - rise, wall, 0.35 * rise / ((kind === 0 ? d : w) / 2) + 0.2);   // (the kit's gable: its edge's drop and its underside's 0.14 m)
      for (let i = 0; i < 1 + Math.floor(hash01(h, 12) * 2); i++) {      // a stack at one gable end or at both, astride the ridge
        const e = (i ? -1 : 1) * (hash01(h, 13) < 0.5 ? -1 : 1);
        if (kind === 0) stack(e * (w / 2 - 0.7), 0, G + H - rise, G + H + 1, false); else stack(0, e * (d / 2 - 0.7), G + H - rise, G + H + 1, true);
      }
    } else if (kind === 2) {                                // a hipped roof
      const rise = Math.min(H * 0.3, 3);
      b.box(-w / 2, G, -d / 2, w / 2, G + H - rise, d / 2, { ...cells, top: false });
      b.col(roof).hip(-w / 2, -d / 2, w / 2, d / 2, G + H - rise, rise, { overhang: 0.35, ridge: 0.45 });
      dress(w, d, G + H - rise, wall, 0.08);                // (the kit's hip keeps a level underside just under the eaves)
      stack((hash01(h, 13) < 0.5 ? -1 : 1) * w * 0.2, 0.7, G + H - rise, G + H + 0.9, false);
    } else if (kind === 3 && H < 8) {                       // a low house: a flat roof behind a low parapet
      b.box(-w / 2, G, -d / 2, w / 2, G + H - 0.6, d / 2, cells);
      b.col(wall, 0.9, 1).surf(S.SURF.PLAIN);
      b.box(-w / 2, G + H - 0.6, -d / 2, w / 2, G + H, -d / 2 + 0.4).box(-w / 2, G + H - 0.6, d / 2 - 0.4, w / 2, G + H, d / 2);
      dress(w, d, G + H - 0.6, wall);
      stack((hash01(h, 13) < 0.5 ? -1 : 1) * (w / 2 - 1.2), d * 0.2, G + H - 0.6, G + H + 1.3, true);
    } else if (kind === 3 || kind === 4) {                  // a mansard with a flat zinc cap: a steep one or a slacker one
      const rise = Math.min(H * (kind === 3 ? 0.26 : 0.3), 3.2), inset = kind === 3 ? 0.9 : 1.2;
      b.box(-w / 2, G, -d / 2, w / 2, G + H - rise, d / 2, { ...cells, top: false });
      b.col(roof, 0.85, 1).surf(S.SURF.TILES).frustum(0, 0, w, d, w - 2 * inset, d - 2 * inset, G + H - rise, G + H, { m: 1, capColor: ZINC });
      dress(w, d, G + H - rise, wall);
      dormers(h, w, d, G + H - rise, rise, inset, roof);
      for (const e of hash01(h, 12) < 0.5 ? [1] : [-1, 1]) stack(e * (w / 2 - inset - 0.9), d * 0.12, G + H - 0.4, G + H + 1.3, true);
    } else {                                                // a low body with a small upper pavilion under a pointed roof
      const low = H * 0.55, up = Math.min(w, d) * 0.55;
      b.box(-w / 2, G, -d / 2, w / 2, G + low, d / 2, cells);
      b.cbox(0, G + low, 0, up, H * 0.25, up, { cellW: 2, cellH: 2.6, top: false });
      b.col(roof, 0.85, 1).surf(S.SURF.TILES).frustum(0, 0, up + 0.6, up + 0.6, 0, 0, G + H * 0.8, G + H, { m: 1 });
      dress(w, d, G + low, wall);
      stack((hash01(h, 13) < 0.5 ? -1 : 1) * (w / 2 - 1), d / 2 - 1, G + low - 0.2, G + low + 2.2, false);
    }
    b.pop();
    if (h % 8 === 7) await ctx.yield();
  }
  await ctx.yield();
  return b;
}

// THE RAILWAY'S CUT: the narrow-gauge line's trench behind the quay houses, its floor dim under its arc lamps
// (groundLampPlaces), with a low wall along each lip and
// a black mouth where it goes under the bridge's approach. Laid into builder b over the gap left in the ground.
// SOURCED: figures.md B, "Decauville trench" (its place, 15 m wide, below grade, the tunnel at the axis). WORKING:
// its depth, walls and tones.
function buildRailwayCut(b) {
  const G = FRAME.groundY, FLOOR_Y = G - RC.depth, LIP = 1, THICK = 0.4;   // WORKING: the low walls 1 m high, 0.4 m thick
  const WALL = S.lin('#6e675c'), BALLAST = S.lin('#6b675d'), MOUTH = S.lin('#07080b');   // (the bed's gravel pale enough to take the sky: a dark one reads from above as a pit without a floor)
  const at = (x, off, y) => { const p = riverSide(x, off); return [p[0], y, p[1]]; };
  for (let i = 0; i + 1 < RIVER_XS.length; i++) {
    const xa = RIVER_XS[i], xb = RIVER_XS[i + 1];
    if (!inRailwayCut(xa, xb)) continue;
    // (the floor and the walls' feet take a dim wash of the trench's lamps by night: WORKING, its strength and reach)
    b.col(BALLAST).surf(S.SURF.PLAIN).flood(0.5, FLOOR_Y, 3.5);
    laidQuad(b, at(xa, CUT_OFF0, FLOOR_Y), at(xb, CUT_OFF0, FLOOR_Y), at(xb, CUT_OFF1, FLOOR_Y), at(xa, CUT_OFF1, FLOOR_Y));
    for (const [off, out] of [[CUT_OFF0, -THICK], [CUT_OFF1, THICK]]) {
      const ia = at(xa, off, 0), ib = at(xb, off, 0), oa = at(xa, off + out, 0), ob = at(xb, off + out, 0);
      b.col(WALL, 0.35, 0.9).surf(S.SURF.MASONRY, 0, 1.2);
      if (out < 0) b.wall(ib[0], ib[2], ia[0], ia[2], FLOOR_Y, G + LIP, { m: 1 }); else b.wall(ia[0], ia[2], ib[0], ib[2], FLOOR_Y, G + LIP, { m: 1 });
      b.col(WALL, 0.8, 0.95);
      if (out < 0) b.wall(oa[0], oa[2], ob[0], ob[2], G, G + LIP, { m: 1 }); else b.wall(ob[0], ob[2], oa[0], oa[2], G, G + LIP, { m: 1 });
      laidQuad(b, [ia[0], G + LIP, ia[2]], [ib[0], G + LIP, ib[2]], [ob[0], G + LIP, ob[2]], [oa[0], G + LIP, oa[2]]);
    }
    // the trench's two ends: the black mouth toward the bridge, a stone wall at the far end, a low wall over each
    for (const [x, toward] of [[xa, -1], [xb, 1]]) {
      const ax = Math.abs(x); if (ax !== CUT_MOUTH && ax !== CUT_END) continue;
      const s = riverSlope(x), h = Math.hypot(1, s), nrm = [toward / h, 0, toward * s / h], dark = ax === CUT_MOUTH;
      const P = [at(x, CUT_OFF0, FLOOR_Y), at(x, CUT_OFF1, FLOOR_Y), at(x, CUT_OFF1, G + LIP), at(x, CUT_OFF0, G + LIP)];
      const lo = dark ? MOUTH : WALL.map((v) => v * 0.35), hi = dark ? MOUTH : WALL.map((v) => v * 0.9);
      b.surf(dark ? S.SURF.PLAIN : S.SURF.MASONRY, 0, 1.2);
      stoneFace(b, P, nrm, lo, hi, (q) => [q[2], q[1]]);
      if (dark) {                                           // the mouth's stone lintel and the low wall above it
        const L = [at(x, CUT_OFF0, G - 0.8), at(x, CUT_OFF1, G - 0.8), at(x, CUT_OFF1, G + LIP), at(x, CUT_OFF0, G + LIP)].map((q) => [q[0] + nrm[0] * 0.05, q[1], q[2] + nrm[2] * 0.05]);
        b.surf(S.SURF.MASONRY, 0, 1.2);
        stoneFace(b, L, nrm, WALL.map((v) => v * 0.7), WALL.map((v) => v * 0.9), (q) => [q[2], q[1]]);
      }
      b.flood(0);
      const back = P.map((q) => [q[0] - nrm[0] * THICK, Math.max(q[1], G), q[2] - nrm[2] * THICK]);
      b.col(WALL, 0.8, 0.95).surf(S.SURF.MASONRY, 0, 1.2);
      stoneFace(b, back, [-nrm[0], 0, -nrm[2]], WALL.map((v) => v * 0.8), WALL.map((v) => v * 0.95), (q) => [q[2], q[1]]);
      laidQuad(b, P[3], P[2], back[2], back[3]);
    }
  }
  b.flood(0);
}

// ---- THE GARDEN'S PLAN (the Champ de Mars inside the fences, from the quay to the far avenue). Every place is FRAME's;
// what FRAME does not give (the lawns' panels, the widths of walks, kerbs and rims) is WORKING, a likeness of the plan
// of 1889: the tower zone with a planted lake in a lawn either side, the garden between the two palaces with the sunk
// parterre, the awning walks and the three basins on the axis, the court before the central dome, the halls beyond.
// SOURCED: the lakes, the parterre, the awning walks' lines and the basins (figures.md B); lawns, trees, shrubbery
// and parterres of flowers in kind (src-site.md). INVENTED BY NEED: the lawns' panels and the walks cut in them.
// THE EMPTY LANE (order section 4; the route's checker names it): along the axis, 11 m either side of it, from
// z 143 to the portal's arch (z 42) the line runs under 20 m up; nothing stands there, only flat gravel and the sunk
// parterre (the awnings' nearest posts are 23 m off the axis, the nearest tree 42 m). The checker's other lane is the
// bridge's own roadway.
const GARDEN = (() => {
  const F = FRAME, PL = F.palaces, AW = F.awningWalks.x[1], IN = F.industries, LK = F.lakes;
  const z0 = -100, z1 = F.farAvenue.z;                    // from just behind the railway cut's far lip to the far avenue
  const walk = 9, lawnX0 = AW + walk, lawnX1 = PL.xNear - walk - 1, domeZ = PL.dome.z;   // lawns lie between the awning walks and the palaces' forecourts
  const courtZ1 = F.centralDome.z - F.centralDome.diameter / 2 - 30;                    // the court's lawns stop short of the dome
  // lawn panels on the +X side as [x0, z0, x1, z1] (the -X side mirrors them): the lake's lawn beside the tower, three
  // between the walks and a palace with a cross walk on the domes' line, one in the court
  const lawns = [
    [70, -68, 205, 68],
    [lawnX0, F.parterre.z0 + 3, lawnX1, 142], [lawnX0, 152, lawnX1, domeZ - 16], [lawnX0, domeZ + 16, lawnX1, PL.z1 - 4],
    [lawnX0, IN.z0 + 8, lawnX1, courtZ1],
    [LK.x[1] - LK.sizeX / 2 - 6.5, -32, 76, 32],            // the lake lawn's tongue between the two pier bases: the lake's rim lies 5 m inside it
  ];
  const PT = F.parterre, bank = 3;                        // the parterre's grass bank: 3 m of slope down to the sunk floor
  // under the tower: four lawn quarters between the pier bases, about a cross of walks 18 m wide on the two axes and
  // a ring walk round the fountain's basin (each quarter from `near` to `far` off both axes, outside `ring` from the centre)
  const under = { near: 9, far: 34, ring: F.fountain.basinDiameter / 2 + 10, round: 4 };
  // gravel walks cut into the lawns, +X side (the -X side mirrors them). WORKING, a likeness of the park's walks:
  // a walk round each lake between `lakeWalk` metres out from the water's edge; two straight walks across the
  // lake's lawn and one from the axis side to each music kiosk, each [middle x, middle z, half x, half z]; a round
  // of gravel under each music kiosk [x, z, radius] (src-site.md "Music kiosks": z +283, x 70 and z +419, x 80)
  const lakeWalk = [1.6, 7.6], walks = [[160.5, 0, 44.5, 2.5], [136, 0, 2.5, 68], [53, 283, 17, 2.2], [58, 419, 22, 2.2]];
  const rounds = [[70, 283, 9], [80, 419, 9]];
  return { z0, z1, lawns, under, lakeWalk, walks, rounds, lawnRound: 6, kerb: 0.6, lakeRim: 1.6, apron: 4, walkHalf: 4, courtHalf: PL.xNear,
    parterre: { x: PT.halfWidth, z0: PT.z0, z1: PT.z1, bank, y: F.groundY - PT.sunk } };
})();

// THE PARTERRE'S FLOWER BEDS. SOURCED in kind: "parterres of flowers" (src-site.md "Garden and fountains"); the
// lamps' yellow light lying in them (src-light.md 7, Vogue: the lights "ruissellent en nappes jaunes dans les
// parterres"). INVENTED BY NEED in pattern (no source gives a bed's plan; plain dark discs read as holes in the
// lawn). WORKING: the spacing along the floor, a round bed's radius, a long bed's half sizes, the edging's and the
// pale band's widths, the lozenge's half sizes (in the round bed, in the long one), the tones.
const BEDS = { step: 20, round: 4.6, long: [3.4, 7.8], edge: 0.3, band: 0.7, lozenge: [1.5, 4.4], pale: '#c9c08e', gold: '#c2923a', red: '#8e3038', fill: 1 };
// THE LAKES' WATER (POND). SOURCED in kind: the two lakes of the tower's park, the small electric lamps "le long
// des pelouses autour des bassins" (src-light.md 6 "Garden": incandescent, steady). Still dark water that gives back the low sky and the afterglow, and draws
// each rim lamp's light out into a trembling streak, as the river does. LAWFUL READINGS (order L1): A SHADING BY THE
// DIRECTION FROM THE WATER TO THE EYE (the sky's low band and each lamp show where the water's slopes would mirror
// them to the eye) and A FILTER BY A PIXEL'S FOOTPRINT (ripples under a pixel go into the slopes' breadth). The
// ripples run BY THE WORLD'S CLOCK; a lamp's streak is lit by the lamp's own threshold of night. WORKING: all.
const POND = { lamps: 20, sigma: 0.05, ripple: 0.014, facet: 2.5, band: 4, reach: 14, level: 1.3, face: 0.22, glow: 0.6 };
// the uniforms the lakes' water runs by: the low sky's two tones, the clock, the night number, the rim lamps of the
// +X lake and then of the -X one (each [x, z, threshold of night, 0]; a lamp never dealt stays unlit)
function pondUniforms() {
  const lamps = []; for (let i = 0; i < 2 * POND.lamps; i++) lamps.push(new THREE.Vector4(0, 0, 9, 0));
  return { uPondHorizon: { value: new THREE.Color(0, 0, 0) }, uPondGlow: { value: new THREE.Color(0, 0, 0) }, uPondDir: { value: new THREE.Vector2(FRAME.afterglow.x, FRAME.afterglow.z) },
    uPondTime: { value: 0 }, uPondNight: { value: 0 }, uPondLamp: { value: lamps } };
}
// the rim lamps dealt to the lakes' water: the ground's warm lamps on posts that stand round each lake (the small
// electric ones)
function pondLamps(pond, lamps) {
  const LK = FRAME.lakes, n = [0, 0];
  for (const l of lamps) if (l.kind === 0 && l.post && Math.abs(Math.abs(l.p[0]) - LK.x[1]) < LK.sizeX / 2 + 4 && Math.abs(l.p[2] - LK.z) < LK.sizeZ / 2 + 4) {
    const side = l.p[0] < 0 ? 1 : 0;
    if (n[side] < POND.lamps) pond.uPondLamp.value[side * POND.lamps + n[side]++].set(l.p[0], l.p[2], l.threshold, 0);
  }
  return n;
}
// THE GARDEN'S GROUND MATERIAL: the standard lit material with the plan drawn into its colour from each pixel's own
// place on the ground (gravel, lawn panels with pale kerbs and the walks cut into them, the four lawn quarters under the tower, the lakes' still
// dark water in pale rims, stone aprons round the pier bases and the basins, the parterre's beds). LAWFUL READING (order L1): every edge of the plan is
// filtered by a pixel's footprint (fwidth); nothing fades or thins by distance. It takes the kit materials' own night
// fill and street glow (their uniforms, shared) so that it stands in the same light as the pale ground round it.
function makeGardenMaterial(mats, tones, uLeafFill, uPondSky, pond) {
  const G = GARDEN, F = FRAME, f = (v) => v.toFixed(2), v3 = (c) => `vec3(${S.lin(c).map((v) => v.toFixed(4)).join(', ')})`, U = mats.uniforms, UT = G.under;
  const feet = Object.keys(TOWER.legs).map((leg) => TOWER.legBox(0, leg)).filter((b) => b.x > 0 && b.z > 0)[0];
  const lawnRows = G.lawns.map(([x0, za, x1, zb]) => `d = min(d, gBox(q, vec2(${f((x0 + x1) / 2)}, ${f((za + zb) / 2)}), vec2(${f((x1 - x0) / 2)}, ${f((zb - za) / 2)}), ${f(G.lawnRound)}));`).join('\n      ');
  const lk = F.lakes, bas = [[F.fountain.z, F.fountain.basinDiameter / 2], [F.mainJet.z, F.mainJet.basinDiameter / 2], [F.coutan.z, F.coutan.basinDiameter / 2]];
  const head = /* glsl */`
    uniform vec3 uGravel, uLawn, uKerb, uWater, uBed, uNightFill, uWarm, uLeafFill, uPondSky; uniform float uNight, uStreetGlow;
    varying vec3 vGW; float gWater, gLawn, gBed;
    float gCov(float d, float aa) { return clamp(.5 - d / aa, 0., 1.); }
    float gBox(vec2 p, vec2 c, vec2 h, float r) { vec2 e = abs(p - c) - h + r; return length(max(e, 0.)) + min(max(e.x, e.y), 0.) - r; }
    float gH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    uniform vec3 uPondHorizon, uPondGlow; uniform vec2 uPondDir; uniform float uPondTime, uPondNight; uniform vec4 uPondLamp[${2 * POND.lamps}];
    // the light a lake's water gives the eye at a place: the low sky mirrored in its ripples, and its rim lamps' streaks
    vec3 pondLight(vec3 P) {
      vec3 V = normalize(cameraPosition - P); vec2 p = P.xz, w = fwidth(p); float k = 1. - smoothstep(.25, 1.2, max(w.x, w.y));
      vec2 d1 = vec2(.8, .6), d2 = vec2(-.5, .866);
      vec2 rip = ${POND.ripple.toFixed(3)} * k * (d1 * sin(dot(p, d1) * 5.2 + uPondTime * 1.7) + d2 * sin(dot(p, d2) * 3.3 - uPondTime * 1.2 + 2.));
      float s2 = ${(POND.sigma ** 2).toFixed(5)} + ${(POND.ripple ** 2).toFixed(6)} * (1. - k);
      vec3 N = normalize(vec3(-rip.x, ${(1 / POND.facet).toFixed(3)}, -rip.y)), R = reflect(-V, N);
      float low = exp(-abs(R.y) * ${POND.band.toFixed(1)}), toGlow = max(dot(normalize(R.xz + 1e-5), uPondDir), 0.), g1 = 1. - clamp(V.y, 0., 1.);
      vec3 col = (mix(uPondSky, uPondHorizon, low) + uPondGlow * (toGlow * toGlow * low)) * (${POND.face.toFixed(2)} + ${(1 - POND.face).toFixed(2)} * g1 * g1 * g1);
      int o = P.x < 0. ? ${POND.lamps} : 0;
      for (int i = 0; i < ${POND.lamps}; i++) {
        vec4 q = uPondLamp[o + i]; vec3 L = vec3(q.x, ${(FRAME.groundY + GROUND_LAMPS.gas.post + 0.25).toFixed(2)}, q.y) - P; float d = length(L);
        vec3 H = normalize(V + L / d); vec2 s = H.xz / max(H.y, .04) - rip;
        col += ${`vec3(${GROUND_LAMPS.gas.colour.map((c) => (c * POND.level).toFixed(3)).join(', ')})`} * (smoothstep(0., ${GROUND_LAMPS.front.toFixed(4)}, uPondNight - q.z) * exp(-dot(s, s) / (2. * s2)) * ${(POND.reach ** 2).toFixed(1)} / (${(POND.reach ** 2).toFixed(1)} + d * d));
      }
      return col;
    }
    float gN(vec2 p) { vec2 i = floor(p), u = fract(p); u = u * u * (3. - 2. * u); return mix(mix(gH(i), gH(i + vec2(1., 0.)), u.x), mix(gH(i + vec2(0., 1.)), gH(i + 1.), u.x), u.y); }
    vec3 gardenColour(vec2 p) {
      vec2 q = vec2(abs(p.x), p.y), w = fwidth(p); float aa = max(max(w.x, w.y), 1e-3), d = 1e5;
      ${lawnRows}
      // the lake: a rounded pond in its lawn, a pale rim round still dark water; the walks cut into the lawns
      float lake = gBox(q, vec2(${f(lk.x[1])}, ${f(lk.z)}), vec2(${f(lk.sizeX / 2)}, ${f(lk.sizeZ / 2)}), ${f(lk.sizeX * 0.42)});
      d = max(d, min(lake - ${f(G.lakeWalk[0])}, ${f(G.lakeWalk[1])} - lake));
      ${G.walks.map(([cx, cz, hx, hz]) => `d = max(d, -gBox(q, vec2(${f(cx)}, ${f(cz)}), vec2(${f(hx)}, ${f(hz)}), .5));`).join(' ')}
      ${G.rounds.map(([cx, cz, r]) => `d = max(d, ${f(r)} - length(q - vec2(${f(cx)}, ${f(cz)})));`).join(' ')}
      d = min(d, max(gBox(vec2(q.x, abs(p.y)), vec2(${f((UT.near + UT.far) / 2)}), vec2(${f((UT.far - UT.near) / 2)}), ${f(UT.round)}), ${f(UT.ring)} - length(p)));   // the quarters under the tower
      // the stone aprons: round each pier base, round the three basins and along the canal
      float apron = gBox(vec2(q.x, abs(p.y)), vec2(${f(feet.x)}, ${f(feet.z)}), vec2(${f(feet.half + G.apron)}), 1.);
      ${bas.map(([z, r]) => `apron = min(apron, length(p - vec2(0., ${f(z)})) - ${f(r + G.apron)});`).join(' ')}
      apron = min(apron, gBox(p, vec2(0., ${f((F.canal.z0 + F.canal.z1) / 2)}), vec2(${f(F.canal.halfWidth + G.apron)}, ${f((F.canal.z1 - F.canal.z0) / 2 + G.apron)}), 1.));
      // the parterre's sunk floor: lawn within a gravel border, a row of flower beds down its middle
      float floorD = gBox(p, vec2(0., ${f((G.parterre.z0 + G.parterre.z1) / 2)}), vec2(${f(G.parterre.x - G.parterre.bank - 1.5)}, ${f((G.parterre.z1 - G.parterre.z0) / 2 - G.parterre.bank - 1.5)}), 2.);
      float slope = gBox(p, vec2(0., ${f((G.parterre.z0 + G.parterre.z1) / 2)}), vec2(${f(G.parterre.x)}, ${f((G.parterre.z1 - G.parterre.z0) / 2)}), .5);
      // THE PARTERRE'S BEDS (BEDS): a row down the floor's middle, a round bed and a long one by turns; each a pale
      // edging, inside it a band of pale flowers, then a field of red crossed by a lozenge of gold
      float bedZ = (p.y - ${f(G.parterre.z0)}) / ${f(BEDS.step)}, bedT = mod(floor(bedZ), 2.); vec2 bp = vec2(p.x, (fract(bedZ) - .5) * ${f(BEDS.step)});
      float bed = max(mix(length(bp) - ${f(BEDS.round)}, gBox(bp, vec2(0.), vec2(${f(BEDS.long[0])}, ${f(BEDS.long[1])}), ${f(BEDS.long[0] - 0.1)}), bedT), floorD + 3.);
      float loz = (abs(bp.x) / ${f(BEDS.lozenge[0])} + abs(bp.y) / mix(${f(BEDS.lozenge[0])}, ${f(BEDS.lozenge[1])}, bedT) - 1.) * ${f(BEDS.lozenge[0] * 0.8)};
      d = min(d, floorD);
      // (the grain and the mowing go to their mean, the noise's .5, where a pixel's footprint outgrows them)
      float grain = .96 + .08 * mix(gN(p / 17.), .5, smoothstep(4., 17., aa)), mow = .86 + .28 * mix(gN(p / 31. + 9.), .5, smoothstep(8., 31., aa));
      vec3 col = uGravel * grain;
      col = mix(col, uKerb * .92, gCov(apron, aa));
      col = mix(col, uLawn * .8 * mow, gCov(slope, aa) * (1. - gCov(floorD - 1.5, aa)));          // the grass bank
      col = mix(col, uKerb, gCov(d - ${f(G.kerb)}, aa));
      col = mix(col, uLawn * mow, gCov(d, aa));
      col = mix(col, uKerb, gCov(bed, aa));
      col = mix(col, ${v3(BEDS.pale)}, gCov(bed + ${f(BEDS.edge)}, aa));
      gBed = gCov(bed + ${f(BEDS.edge + BEDS.band)}, aa);
      col = mix(col, mix(uBed, ${v3(BEDS.gold)}, gCov(loz, aa)), gBed);
      gBed = gCov(bed + ${f(BEDS.edge)}, aa);
      col = mix(col, uKerb, gCov(lake - ${f(G.lakeRim)}, aa));
      gWater = gCov(lake, aa);
      gLawn = max(gCov(d, aa), gCov(slope, aa) * (1. - gCov(floorD - 1.5, aa))) * (1. - gCov(bed, aa)) * (1. - gCov(lake - ${f(G.lakeRim)}, aa));   // where grass is
      return mix(col, uWater, gWater);
    }`;
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86, metalness: 0 });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uGravel: { value: new THREE.Color().fromArray(tones.gravel) }, uLawn: { value: new THREE.Color().fromArray(tones.lawn) },
      uKerb: { value: new THREE.Color().fromArray(tones.kerb) }, uWater: { value: new THREE.Color().fromArray(tones.water) }, uBed: { value: new THREE.Color().fromArray(tones.bed) },
      uNight: U.uNight, uNightFill: U.uNightFill, uWarm: U.uWarm, uStreetGlow: U.uStreetGlow, uLeafFill, uPondSky, ...pond });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <color_fragment>', 'diffuseColor.rgb = gardenColour(vGW.xz);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .1, gWater);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * ((uNightFill + uWarm * (uStreetGlow * .5)) * smoothstep(.12, .7, uNight) + uLeafFill * (gLawn + gBed * ${BEDS.fill.toFixed(2)}));\nif (gWater > 0.) totalEmissiveRadiance += pondLight(vGW) * gWater;`);
  };
  return material;
}

// THE GARDEN'S GROUND: one mesh over the hole left in the pale ground plane between the fences (x0 to x1), from
// GARDEN.z0 to the far avenue, with the parterre truly sunk into it (a grass bank down to its floor). A flat strip
// lies just under its outer edge, so that no gap can show where its long edges meet the plane's shorter pieces.
function buildGardenGround(scene, mats, x0, x1, uLeafFill, uPondSky, pond) {
  const G = GARDEN, P = G.parterre, Y = FRAME.groundY, pos = [], nor = [];
  const xs = [x0, -P.x, -P.x + P.bank, P.x - P.bank, P.x, x1], zs = [G.z0, P.z0, P.z0 + P.bank, P.z1 - P.bank, P.z1, G.z1];
  const yAt = (i, j) => (i >= 2 && i <= 3 && j >= 2 && j <= 3 ? P.y : Y);
  const tri = (a, b, c) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    if (ny < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; }
    pos.push(...a, ...b, ...c); for (let k = 0; k < 3; k++) nor.push(nx / l, ny / l, nz / l);
  };
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++) {
    const at = (ii, jj) => [xs[ii], yAt(ii, jj), zs[jj]];
    quad(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
  }
  const E = 2.5, YU = Y - 0.06;                             // the strip under the edge: 2.5 m either side of it, 6 cm down
  quad([x0 - E, YU, G.z0 - E], [x1 + E, YU, G.z0 - E], [x1 + E, YU, G.z0 + E], [x0 - E, YU, G.z0 + E]);
  quad([x0 - E, YU, G.z1 - E], [x1 + E, YU, G.z1 - E], [x1 + E, YU, G.z1 + E], [x0 - E, YU, G.z1 + E]);
  for (const x of [x0, x1]) quad([x - E, YU, G.z0 + E], [x + E, YU, G.z0 + E], [x + E, YU, G.z1 - E], [x - E, YU, G.z1 - E]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.computeBoundingSphere();
  const tones = { gravel: S.lin('#b7ab93'), lawn: S.lin('#3c5f3c'), kerb: S.lin('#d6ccb4'), water: S.lin('#16233f'), bed: S.lin(BEDS.red) };
  const mesh = new THREE.Mesh(geo, makeGardenMaterial(mats, tones, uLeafFill, uPondSky, pond)); mesh.name = 'garden-ground';
  scene.add(mesh);
  return pos.length / 9;
}

// ---- THE KIOSKS AND SMALL PAVILIONS OF THE GARDEN (src-site.md, "Tower park", "Garden and fountains" and the plan's
// table). Plain little buildings, nothing on them lettered, each with one gas lamp:
// SOURCED: the four music kiosks (src-site.md table, "Music kiosks": z +283, x 70 and z +419, x 80, either side);
// the fountains' operator's kiosk (src-site.md "un kiosque voisin", Huard); the pavilions of the tower's park IN
// NUMBER AND PLACE ONLY, five on the upstream side and seven beside the Brazilian tower on the downstream side
// (src-site.md "Tower park", Huard's list). NOT BUILT: their true sizes and forms (src-site.md gives one of them
// 1,600 square metres, and each was of its own style): every one here is far smaller than it stood.
// INVENTED BY NEED (the sources name them and give no build): every form here. A music kiosk is an eight-sided
// stand on a low base under a pointed roof; the operator's is a hut 3 m square; a park pavilion is a plain hall under
// a hipped roof with a striped awning along its front, or a round one under a pointed roof with an awning all round
// (they were larger and each of its own style: here all are small and plain, since nothing tells one from another
// and the line is flown 23 m over their lawns). WORKING: every size, tone and place but the music kiosks' places.
// CLEAR AIR (order L5): a kiosk any of whose corners, at the ground or at its top, lies within KIOSKS.clear metres
// of the flown line (the route's own curve, at build) or that stands in the axis's empty lane is not made.
const KIOSKS = {
  clear: 8,
  music: { r: 4.2, floor: 1, eave: 4.6, top: 7.4 },
  operator: { x: -19.5, z: 205, half: 1.5, wall: 2.8, rise: 1.4 },
  // the park's pavilions: [x, z, half x, half z, the front's side as (x, z)]; half z 0: a round one of radius half x
  park: [[154, -11, 7, 4, 0, 1], [176, 9.5, 4.5, 0, 0, -1], [125.5, 48, 4, 6, 1, 0], [148, -46, 4.5, 6, -1, 0], [166, -59, 7, 4, 0, -1],
    [-154, -11, 7, 4, 0, 1], [-176, 9.5, 4.5, 0, 0, -1], [-125.5, 50, 4, 6, -1, 0], [-148, -46, 4.5, 6, 1, 0], [-166, -59, 7, 4, 0, -1],
    [-186, -17, 5, 5, 0, 1], [-186, 59, 4, 0, 0, 1]],
  awning: 2.2,                                           // metres an awning stands out from its wall
  // THE PAVILIONS AS A FAIR AT NIGHT. SOURCED in kind: the tower park's pavilions (src-site.md "Tower park") in a
  // garden lit by gas (src-light.md 6 "Garden"). INVENTED BY NEED (no source gives their fronts; plain boxes with a
  // dim panel read as sheds): a bright open front under the awning, the awning's cloth washed by that light, rows of
  // windows (lit and dark) round a hall's walls. WORKING: the front's strength, the cloth's wash, the windows' share.
  lit: 1.25, wash: 1.1, windows: 1.5,
};
// every kiosk as { kind: 'music' | 'hut' | 'hall' | 'round', x, z, hx, hz (its half sizes: a round one's radius),
// wall, top, front: [x, z], lamp: [x, y, z], pool: [x, z, radius], n: its own number }, dealt once
const kioskPlaces = (() => {
  let list = null;
  return () => {
    if (list) return list;
    const K = KIOSKS, G = FRAME.groundY, out = [], M = K.music, O = K.operator;
    for (const [x, z] of GARDEN.rounds) for (const sx of [1, -1]) out.push({ kind: 'music', x: sx * x, z, hx: M.r + 0.7, hz: M.r + 0.7, wall: M.eave, top: M.top, front: [0, 0], lamp: [sx * x, G + M.eave - 0.5, z], pool: [sx * x, z, M.r + 2.5] });
    out.push({ kind: 'hut', x: O.x, z: O.z, hx: O.half, hz: O.half, wall: O.wall, top: O.wall + O.rise, front: [1, 0], lamp: [O.x + O.half + 0.4, G + 2.6, O.z], pool: [O.x + O.half + 1.6, O.z, 4] });
    K.park.forEach(([x, z, hx, hz, fx, fz], i) => {
      const round = hz === 0, wall = round ? 3.6 : 4 + 1.2 * hash01(i, 301), reach = (round ? hx : fx ? hx : hz) + K.awning;
      out.push({ kind: round ? 'round' : 'hall', x, z, hx, hz: round ? hx : hz, wall, top: wall + (round ? hx * 0.8 : 1.8 + hash01(i, 302)), front: [fx, fz],
        lamp: [x + fx * (reach + 0.3), G + 3.1, z + fz * (reach + 0.3)], pool: [x + fx * (reach + 1.6), z + fz * (reach + 1.6), 5] });
    });
    // clear air and the lane, from the route's own curve
    const C = ROUTE.curve, near2 = (K.clear + 0.5) ** 2;
    const clear = (x, y, z) => { for (let i = 0; i < C.count; i += 2) if ((C.x[i] - x) ** 2 + (C.y[i] - y) ** 2 + (C.z[i] - z) ** 2 < near2) return false; return true; };
    const lane = (x, z) => Math.abs(x) < AXIS_LANE.half && z > AXIS_LANE.z0 && z < AXIS_LANE.z1;
    list = out.filter((k) => {
      const e = k.kind === 'hall' ? K.awning + 0.6 : 0.6;
      for (const sx of [-1, 0, 1]) for (const sz of [-1, 0, 1]) for (const y of [G, G + k.wall, G + k.top]) {
        const x = k.x + sx * (k.hx + e), z = k.z + sz * (k.hz + e);
        if (!clear(x, y, z) || lane(x, z)) return false;
      }
      return true;
    });
    list.forEach((k, i) => { k.n = i; });
    return list;
  };
})();

// THE GARDEN'S WORKS, one mesh on the kit's material: the pale rims and still water (a dim blue: it gives back the sky) of the fountain group's
// basin, the main jet's basin, the canal and the great group's basin; the two groups each within FRAME's size (an
// upper basin, a plinth, a dark dish and the sculpture as plain dark masses, no figure); the two awning walks as long
// striped roofs on thin posts; the kiosks and small pavilions. WORKING: rim sizes, the masses' profiles, the awnings' width, height and stripes.
// the kiosks laid into a Builder: walls, roofs, awnings and each one's lit opening
function layKiosks(b) {
  const Y = FRAME.groundY, K = KIOSKS, M = K.music;
  const WALLS = ['#d9cdb2', '#cfc4ae', '#e0d6c0', '#c9bda6'].map(S.lin), ROOFS = ['#5d6c78', '#4d5560', '#6f6258'].map(S.lin);
  const CLOTH = ['#b5503f', '#4a6f9c', '#4f7a5a', '#c79f88'].map(S.lin), POST = S.lin('#3a3f48'), BASE = S.lin('#bfb49c'), LIT = S.lin('#ffc27a');
  for (const k of kioskPlaces()) {
    const { x, z, hx, hz, wall, top, n } = k, [fx, fz] = k.front;
    const tone = WALLS[Math.floor(hash01(n, 303) * WALLS.length)], roof = ROOFS[Math.floor(hash01(n, 304) * ROOFS.length)], cloth = CLOTH[Math.floor(hash01(n, 305) * CLOTH.length)];
    if (k.kind === 'music') {
      // a low eight-sided base, eight thin posts, a pointed roof with a striped valance under its eave
      b.col(BASE, 0.8, 1).surf(S.SURF.PLAIN).lathe(x, Y, z, [[M.r + 0.4, 0], [M.r + 0.4, M.floor], [0, M.floor]], 8);
      b.col(POST, 0.8, 1);
      for (let a = 0; a < 8; a++) { const t = (a + 0.5) * Math.PI / 4; b.cbox(x + M.r * Math.cos(t), Y + M.floor, z + M.r * Math.sin(t), 0.14, M.eave - M.floor, 0.14, { top: false }); }
      b.col(cloth, 0.9, 1).surf(S.SURF.STRIPES, 0, 1).lathe(x, Y, z, [[M.r + 0.7, M.eave - 0.55], [M.r + 0.7, M.eave]], 8, { uvBand: [24, 0, 1] });
      b.col(roof, 0.8, 1.1).surf(S.SURF.PLAIN).lathe(x, Y, z, [[M.r + 0.7, M.eave], [M.r * 0.35, M.eave + 1.7], [0, M.top]], 8);
    } else if (k.kind === 'round') {
      // a round wall with a lit band of glazing, a striped awning all round, a pointed roof
      b.col(tone, 0.8, 1).surf(S.SURF.PLAIN).lathe(x, Y, z, [[hx, 0], [hx, 1]], 10);
      b.col(LIT).surf(S.SURF.GLOW, 0, K.lit).lathe(x, Y, z, [[hx, 1], [hx, 2.5]], 10);
      b.col(tone, 0.9, 1).surf(S.SURF.PLAIN).lathe(x, Y, z, [[hx, 2.5], [hx, wall]], 10);
      b.col(cloth, 0.9, 1).surf(S.SURF.STRIPES, 0, 1).flood(K.wash, Y + 3.3, 2).lathe(x, Y, z, [[hx + K.awning, 2.5], [hx, 3.3]], 10, { uvBand: [Math.round(hx * 5), 0, 1] }).flood(0);
      b.col(roof, 0.8, 1.1).surf(S.SURF.PLAIN).lathe(x, Y, z, [[hx + 0.5, wall], [0, top]], 10);
    } else {
      // four walls under a hipped roof (a park pavilion's with a row of windows); on the front a lit opening and (a
      // park pavilion) a striped awning over it
      if (k.kind === 'hall') b.col(tone, 0.8, 1).surf(S.SURF.WINDOW, hash01(n, 306), K.windows).box(x - hx, Y, z - hz, x + hx, Y + wall, z + hz, { top: false, cellW: 2.4, cellH: wall });
      else b.col(tone, 0.8, 1).surf(S.SURF.PLAIN).box(x - hx, Y, z - hz, x + hx, Y + wall, z + hz, { top: false });
      b.col(roof, 0.9, 1.1).hip(x - hx, z - hz, x + hx, z + hz, Y + wall, top - wall, { overhang: 0.4, style: S.SURF.PLAIN });
      const out = fx ? hx : hz, half = (fx ? hz : hx) * 0.8, tx = fz, tz = -fx;
      const at = (along, o, y) => [x + fx * (out + o) + tx * along, Y + y, z + fz * (out + o) + tz * along];
      b.col(LIT).surf(S.SURF.GLOW, 0, K.lit).quad(at(-half, 0.05, 0.4), at(half, 0.05, 0.4), at(half, 0.05, 2.4), at(-half, 0.05, 2.4));
      if (k.kind === 'hall') {
        const A = K.awning, w = half + 0.6, uv = [0, 0, Math.round(w * 2 / 1.1), 1];
        b.col(cloth, 0.9, 1).surf(S.SURF.STRIPES, 0, 1).flood(K.wash, Y + 3.4, 2);                 // the cloth takes the lit front's light from under it
        b.quad(at(w, 0, 3.4), at(-w, 0, 3.4), at(-w, A, 2.5), at(w, A, 2.5), uv).quad(at(-w, 0, 3.4), at(w, 0, 3.4), at(w, A, 2.5), at(-w, A, 2.5), uv);   // the cloth's top and its underside
        b.flood(0);
      }
    }
  }
  b.surf(S.SURF.PLAIN);
}

async function buildGardenWorks(ctx, scene, mats) {
  const b = new S.Builder(4096), F = FRAME, Y = F.groundY;
  const RIM = S.lin('#d8cfb8'), WATER = S.lin('#34508c'), MASS = S.lin('#d4cab2'), POST = S.lin('#3a3f48');
  const STILL = [S.SURF.GLOW, 0, 0.22];                    // WORKING: still water gives back the sky: a dim blue of its own, more as the night comes
  const RIM_H = 0.7, RIM_W = 0.9, WATER_Y = Y + 0.4;
  const roundBasin = (x, z, r) => {
    b.col(RIM, 0.75, 1).surf(S.SURF.PLAIN).lathe(x, Y, z, [[r, 0], [r, RIM_H], [r - RIM_W, RIM_H], [r - RIM_W, WATER_Y - Y]], 36);
    b.col(WATER).surf(...STILL).disc(x, WATER_Y, z, r - RIM_W, 36, true);
  };
  roundBasin(F.fountain.x, F.fountain.z, F.fountain.basinDiameter / 2);
  roundBasin(F.mainJet.x, F.mainJet.z, F.mainJet.basinDiameter / 2);
  roundBasin(F.coutan.x, F.coutan.z, F.coutan.basinDiameter / 2);
  // the canal: four rim walls round a strip of water, FRAME's whole length from the main jet's basin into the rim
  // of the great group's
  const CN = F.canal, cx = CN.halfWidth, cz0 = CN.z0, cz1 = CN.z1;
  b.col(RIM, 0.75, 1).surf(S.SURF.PLAIN);
  for (const sx of [-1, 1]) b.box(Math.min(sx * cx, sx * (cx - RIM_W)), Y, cz0, Math.max(sx * cx, sx * (cx - RIM_W)), Y + RIM_H, cz1);
  b.box(-cx + RIM_W, Y, cz0, cx - RIM_W, Y + RIM_H, cz0 + RIM_W).box(-cx + RIM_W, Y, cz1 - RIM_W, cx - RIM_W, Y + RIM_H, cz1);
  b.col(WATER).surf(...STILL);
  laidQuad(b, [-cx + RIM_W, WATER_Y, cz0 + RIM_W], [cx - RIM_W, WATER_Y, cz0 + RIM_W], [cx - RIM_W, WATER_Y, cz1 - RIM_W], [-cx + RIM_W, WATER_Y, cz1 - RIM_W]);
  await ctx.yield();
  // THE TWO FOUNTAIN GROUPS, each within FRAME's width and height. SOURCED: the great group "emerge d'un bassin
  // superieur" over the lower basins (src-site.md "Garden and fountains"); the group under the tower 9 m high on a
  // base 12 m across (the same, Saint-Vidal's fountain). INVENTED BY NEED in form (no source gives either group's
  // drawing here, and no figure is to have features): an upper basin of pale stone with its own lit water standing in
  // the lower one, a plinth, a wide dish on a waist, and the sculpture as plain masses: a ring of unlike seated
  // masses on the upper water, a ring of smaller ones on the dish, one tall mass over all. WORKING: all sizes, and
  // the tone (the exhibition's groups were modelled in plaster: a warm pale stone that takes the arc lamps' light
  // and reads as a lit group, where a dark one stands as a hole in its bright basin).
  const GROUP = S.lin('#9a917e');
  const mass = (x, z, half, h, seed) => {
    const up = (prof) => prof.map(([r, y]) => [r * half, y * (h - 0.4)]), H = h - 0.4;
    b.col(RIM, 0.75, 1).surf(S.SURF.PLAIN).lathe(x, WATER_Y, z, up([[1, 0], [1, 0.11], [0.93, 0.11], [0.93, 0.075]]), 16);
    b.col(WATER).surf(S.SURF.GLOW, 0, 0.5).disc(x, WATER_Y + 0.075 * H, z, 0.93 * half, 16, true);
    b.col(MASS, 0.7, 1).surf(S.SURF.PLAIN).lathe(x, WATER_Y, z, up([[0.56, 0.075], [0.56, 0.16], [0.5, 0.16]]), 8);
    b.col(GROUP, 0.8, 1.25).lathe(x, WATER_Y, z, up([[0.5, 0.16], [0.4, 0.3], [0.8, 0.42], [0.84, 0.46], [0.34, 0.46]]), 16, { smooth: true });
    b.col(GROUP, 0.8, 1.3).lathe(x, WATER_Y, z, up([[0.34, 0.46], [0.3, 0.7], [0.17, 0.86], [0.1, 0.94], [0, 1]]), 10, { smooth: true });
    // the masses: each a tapering lump of its own breadth and height, by its own number
    const lumps = (count, ring, y0, size, key) => {
      for (let i = 0; i < count; i++) {
        const a = (i + 0.3 * hash01(seed + i, key)) / count * Math.PI * 2, w = size * (0.8 + 0.5 * hash01(seed + i, key + 1)), t = size * (1.5 + 1.1 * hash01(seed + i, key + 2));
        b.lathe(x + Math.cos(a) * ring * half, WATER_Y + y0 * H, z + Math.sin(a) * ring * half, [[w, 0], [w * 1.15, t * 0.3], [w * 0.7, t * 0.68], [w * 0.38, t * 0.9], [0, t]], 6, { smooth: true });
      }
    };
    lumps(5, 0.74, 0.075, 0.13 * half, 311);
    lumps(3, 0.56, 0.46, 0.09 * half, 321);
  };
  mass(F.fountain.x, F.fountain.z, F.fountain.groupWidth / 2, F.fountain.groupHeight, 0);
  mass(F.coutan.x, F.coutan.z, 6, F.coutan.height, 40);
  await ctx.yield();
  // the awning walks' posts: a thin one under each eave every 11 m (the nearest stands some 23 m from the flown
  // line on the axis); their cloth is laid with the halls (layAwning), whose material filters its stripes
  const AW = F.awningWalks, BAY = 11, len = AW.z1 - AW.z0;
  for (const wx of AW.x) {
    b.col(POST, 0.8, 1).surf(S.SURF.PLAIN);
    for (let k = 0; k * BAY <= len + 0.01; k++) for (const sx of [-1, 1]) b.cbox(wx + sx * (GARDEN.walkHalf - 0.15), Y, AW.z0 + k * BAY, 0.16, AWNING.eave, 0.16, { top: false });
    await ctx.yield();
  }
  layKiosks(b);
  await ctx.yield();
  const mesh = new THREE.Mesh(b.toGeometry(), mats.facade); mesh.name = 'garden-works';
  scene.add(mesh);
  await ctx.yield();
  return b.triangles;
}

// ---- THE HALLS OF THE EXPOSITION (figures.md B and C, src-site.md): the glass hall across the far end, the central
// dome and the industries halls round their court, the two palaces with their blue domes, the small tower and the
// little railway's terminus. All of them are gathered by the kit's Builder and drawn with ONE material of this
// file's own: the standard lit material (the world's two lights and its fog) with each surface's skin drawn from the
// vertex's `win` attribute, read here as (kind, a, b), and its uv. Nothing is lettered: every frieze is a plain band.
// THE KINDS (HK): PLAIN (the vertex colour; a: a warm wash from the gas along the fronts, set by the Builder's
// flood()); BAND (brick with pale string courses; uv in metres; b: metres between courses); TILE (enamelled tile, a
// little glossy; uv in metres); ARCADE (a wall of arched glazed bays lit from within: u in bays, v in metres up; a:
// a bay's width in metres plus 64 times its form: 0 tall, 1 broad, 2 slender; the opening's size follows); GLASS (a glazed roof lit from within, dark ribs at
// every whole u, purlins every a metres of v, fine glazing bars); FAN (a glazed gable: uv in metres from its foot's
// middle, upright and level bars below the springing at a metres, a fan of radial bars above it); CLOTH (striped
// cloth, u in stripes' periods: the awning walks'); GLOW (a plain lit surface). For the lit kinds b carries the light and its strength: its whole part picks the light (0 gas, 1 warm
// white, 2 pearl arc light, 3 gold), its fraction is half the strength.
// THE HALLS' LIGHT COMES UP WITH THE NIGHT NUMBER (skyAt writes uHallLit: the share of bays lit and the three
// lights' levels) and WAVERS BY THE WORLD'S CLOCK (each bay's gas at its own two rates; the arc light's faint hum).
// LAWFUL READING (order L1): every bar, rib, course and opening's edge is filtered by a pixel's footprint (fwidth):
// a bar thinner than a pixel darkens its pixel by the share it covers. Nothing fades or thins by distance.
const HK = { PLAIN: 0, GLOW: 8, TILE: 11, ARCADE: 12, GLASS: 13, FAN: 14, CLOTH: 15, BAND: 16 };
const LIGHT = { gas: 0, warm: 1, pearl: 2, gold: 3 };
const lightCode = (light, strength) => light + Math.min(0.995, strength / 2);   // the b of a lit kind
const TALL = 0, BROAD = 1, SLENDER = 2;                  // an arcade's forms: the opening 0.72 of the bay wide and 1.45 of it high; 0.72 and 1.05; 0.5 and 2.2
const HALL_TONES = { cream: '#e9dcbe', iron: '#8fa9bd', glassDark: '#1a2330', glassPale: '#9aa6ae' };   // WORKING: terracotta's cream, the frames' soft blue, unlit glass
const HALL_FRAG = /* glsl */`
  uniform vec3 uNightFill, uWarm, uHallFill, uHallWash, uHallCream, uHallIron, uHallDark, uHallPale;
  uniform float uNight, uStreetGlow, uHallTime; uniform vec4 uHallLit;
  varying vec3 vHW, vHP, vHN; varying vec2 vHUv;
  vec3 hEmit; float hRough;
  float hH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  // the share of a footprint aa about d that lies within h of 0: a bar, filtered
  float hBar(float d, float h, float aa) { aa = max(aa, 1e-4); return clamp((min(d + .5 * aa, h) - max(d - .5 * aa, -h)) / aa, 0., 1.); }
  float hEvery(float x, float step) { return abs(fract(x / step + .5) - .5) * step; }   // metres to the nearest multiple of step
  vec3 hLight(float i) { return i < .5 ? vec3(1., .70, .36) : i < 1.5 ? vec3(1., .86, .62) : i < 2.5 ? vec3(.80, .88, .96) : vec3(1., .64, .22); }
  float hLevel(float i) { return i < 1.5 ? uHallLit.y : i < 2.5 ? uHallLit.z : uHallLit.w; }
  // a bay's light by the clock: gas wavers at two rates of its own, arc light hums faintly
  float hWaver(float i, float n) {
    return i > 1.5 && i < 2.5 ? 1. + .035 * sin(uHallTime * (7. + 5. * n) + n * 61.) + .025 * sin(uHallTime * (1.3 + n) + n * 17.)
      : 1. + .08 * sin(uHallTime * (1.7 + 2.1 * n) + n * 97.) + .05 * sin(uHallTime * (3.9 + 3.1 * fract(n * 7.31)) + n * 41.);
  }
  vec3 hallSurface(vec3 base) {
    float kind = floor(vHW.x + .5), li = floor(vHW.z + 1e-3), lv = fract(vHW.z) * 2.;
    vec2 q = vHUv, w = fwidth(q); float aa = max(max(w.x, w.y), 1e-4);
    hEmit = vec3(0.); hRough = .85;
    if (kind < .5) return base;
    if (kind < 8.5) { hEmit = base * (lv * hLevel(li)); return base * .3; }
    if (kind < 11.5) {                                     // enamelled tile: each tile a tone of its own, to its mean far off
      hRough = .3;
      return base * mix(.88 + .24 * hH(floor(q / .7)), 1., smoothstep(.25, .9, aa));
    }
    if (kind < 12.5) {                                     // a bay of the arcade: metres from its middle, metres up
      float form = floor(vHW.y / 64. + 1e-3), cw = max(vHW.y - 64. * form, .5), bay = floor(q.x);
      float hw = (form > 1.5 ? .25 : .36) * cw, top = (form < .5 ? 1.45 : form < 1.5 ? 1.05 : 2.2) * cw, ys = top - hw;
      vec2 p = vec2((fract(q.x) - .5) * cw, q.y); float pa = max(max(w.x * cw, w.y), 1e-4);
      float d = p.y > ys ? length(vec2(p.x, p.y - ys)) - hw : max(abs(p.x) - hw, .9 - p.y);   // under 0: the opening
      float glass = clamp(.5 - d / pa, 0., 1.), ring = hBar(d - .3, .3, pa), impost = hBar(p.y - ys, .22, pa) * (1. - glass);
      float post = hBar(abs(p.x) - .5 * cw, .2, pa);        // the iron upright between two bays
      // the glazing: two uprights and a transom at the springing, three radial bars in the head
      float bars = max(hBar(abs(p.x) - hw / 3., .08, pa), hBar(p.y - ys, .1, pa));
      if (p.y > ys) { vec2 h = vec2(abs(p.x), p.y - ys); bars = max(hBar(p.y - ys, .1, pa), max(hBar(h.x, .08, pa), hBar((h.x - h.y) * .7071, .08, pa))); }
      float n = hH(vec2(bay, floor(cw * 37.) + floor((vHP.y - q.y) * .37)));   // a number of the bay's own: its place in the row, the row's bay width and foot
      // a bay whose own gas is not lit yet still shows the hall's light within, dimly, behind its bars: never a black hole
      float on = mix(.2, 1., step(n, uHallLit.x)), inner = (.62 + .38 * fract(n * 13.7)) * (1.08 - .3 * smoothstep(0., top, p.y));
      hEmit = hLight(li) * (lv * hLevel(li) * on * inner * hWaver(li, n) * glass * (1. - .8 * bars));
      vec3 wall = mix(base, uHallCream, max(ring, impost) * .85);
      wall = mix(wall, uHallIron, post * .9);
      hRough = mix(.85, .2, glass);
      return mix(wall, uHallDark, glass);
    }
    if (kind < 13.5) {                                     // a glazed roof: ribs, purlins, fine bars over the light within
      float bay = floor(q.x), fu = fract(q.x), n = hH(vec2(bay, 3.));
      float dark = max(hBar(min(fu, 1. - fu), .032, w.x), vHW.y > .01 ? .85 * hBar(hEvery(q.y, max(vHW.y, .5)), .2, w.y) : 0.);
      dark = max(dark, .45 * hBar(hEvery(q.x, 1. / 12.), .004, w.x));
      float pool = .78 + .36 * exp(-pow((fu - .5) / .3, 2.));
      hEmit = base * (lv * hLevel(li) * (.84 + .28 * n) * pool * hWaver(li, n) * (1. - .92 * dark));
      hRough = .3;
      // (by night a pane shows the light within and little of the sky's: a lit roof glows of itself, no grey sheet)
      return mix(mix(uHallPale * base * 1.15, uHallDark * 1.5, .75 * smoothstep(.12, .7, uNight)), uHallDark, dark);
    }
    if (kind < 14.5) {                                     // a glazed gable: bars upright and level, a fan above the springing
      float ys = vHW.y, bars;
      if (q.y < ys) bars = max(hBar(hEvery(q.x, 5.75), .2, aa), hBar(hEvery(q.y, 6.), .2, aa));
      else {
        vec2 h = vec2(q.x, q.y - ys); float r = length(h), seg = 3.14159265 / 16.;
        bars = max(hBar(hEvery(atan(h.y, h.x), seg) * r, .2, aa), max(hBar(hEvery(r, 9.), .2, aa), hBar(q.y - ys, .4, aa)));
      }
      hEmit = base * (lv * hLevel(li) * (.8 + .25 * exp(-q.y / 30.)) * hWaver(li, .37) * (1. - .92 * bars));
      hRough = .3;
      return mix(uHallPale, uHallDark, bars);
    }
    if (kind < 15.5) {                                     // striped cloth: u in stripes' periods, half of each pale; to its mean where a period nears a pixel
      float s = mix(hBar(abs(fract(q.x) - .5), .25, w.x), .5, smoothstep(.3, 1., w.x));
      return mix(base, uHallCream, .8 * s);
    }
    return mix(base, uHallCream, .85 * hBar(hEvery(q.y, max(vHW.z, .5)), .28, w.y));   // brick under pale string courses
  }`;

// the halls' material: the standard lit material with the skins above; it shares the kit materials' night uniforms
// (the fill and the street glow every stone of this world stands in) and takes the halls' own from `hallU`
function makeHallMaterial(mats, hallU) {
  const U = mats.uniforms, tone = (hex) => ({ value: new THREE.Color().fromArray(S.lin(hex)) });
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, hallU, { uNight: U.uNight, uNightFill: U.uNightFill, uWarm: U.uWarm, uStreetGlow: U.uStreetGlow,
      uHallCream: tone(HALL_TONES.cream), uHallIron: tone(HALL_TONES.iron), uHallDark: tone(HALL_TONES.glassDark), uHallPale: tone(HALL_TONES.glassPale) });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 win; varying vec3 vHW, vHP, vHN; varying vec2 vHUv;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvHW = win; vHUv = uv; vHP = (modelMatrix * vec4(transformed, 1.)).xyz; vHN = normalize(mat3(modelMatrix) * normal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + HALL_FRAG)
      .replace('#include <color_fragment>', 'diffuseColor.rgb = hallSurface(vColor);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = hRough;')
      // the light a surface gives of itself: its lit glass; the night's fill and the street's glow as the kit's stone
      // takes them; the halls' own fill; and on plain, banded and arcaded walls the wash of the gas along the fronts
      // (the Builder's flood() sets it on the first two; an arcade's is strongest at its foot)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float hKind = floor(vHW.x + .5), hWash = hKind < .5 || hKind > 15.5 ? vHW.y : hKind > 11.5 && hKind < 12.5 ? .9 * (.3 + .7 * exp(-max(vHP.y, 0.) / 14.)) : 0.;
        totalEmissiveRadiance += hEmit + diffuseColor.rgb * ((uNightFill * (.55 + .45 * vHN.y) + uWarm * (uStreetGlow * exp(-max(vHP.y, 0.) / 9.) * (1. - .5 * max(vHN.y, 0.)))) * smoothstep(.12, .7, uNight) + uHallFill + uHallWash * hWash);`);
  };
  return material;
}
// one flat four-cornered face laid into builder b, turned to face along `out` whatever its corners' order; each
// corner [x, y, z] takes its uv from uvOf (so a slanted or many-cornered wall can carry one pattern in metres)
function hallQuad(b, P, out, uvOf, k = 1) {
  const ux = P[1][0] - P[0][0], uy = P[1][1] - P[0][1], uz = P[1][2] - P[0][2], vx = P[3][0] - P[0][0], vy = P[3][1] - P[0][1], vz = P[3][2] - P[0][2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz);
  if (l < 1e-9) {                                           // the first and last corners at one place (a three-cornered piece): the normal from the other two sides
    const wx = P[2][0] - P[0][0], wy = P[2][1] - P[0][1], wz = P[2][2] - P[0][2];
    nx = uy * wz - uz * wy; ny = uz * wx - ux * wz; nz = ux * wy - uy * wx;
  }
  const facing = nx * out[0] + ny * out[1] + nz * out[2] >= 0, s = (facing ? 1 : -1) / (Math.hypot(nx, ny, nz) || 1), Q = facing ? [0, 1, 2, 3] : [1, 0, 3, 2], c = b.c;
  nx *= s; ny *= s; nz *= s;
  const i = Q.map((n) => { const p = P[n], t = uvOf ? uvOf(p) : [0, 0]; return b.v(p[0], p[1], p[2], nx, ny, nz, c[0] * k, c[1] * k, c[2] * k, t[0], t[1]); });
  b.quad4(i[0], i[1], i[2], i[3]);
  return b;
}

// THE GLASS HALL (the hall of machines; figures.md B: 420 by 145 m, ridge 48 m, a glass roof; src-site.md: nineteen
// bays, side galleries 15 m, the nave under ground glass, a gable a great glass window; figures.md C: a pearl-grey
// glow). SOURCED: the place, the three sizes, the nineteen bays between twenty trusses, the two side galleries, the
// glass roof and gables and their pearl light. INVENTED BY NEED (the sources give that it was a pointed arch of iron
// and glass, not its line): the truss's outline below, the galleries' height and arcades, the purlins' spacing and
// the gables' bars. The trusses are drawn under the glass as dark ribs (the material's GLASS kind), one at every
// whole bay; nothing of the hall is nearer than 300 m to the flown line.
const GLASS_HALL = {
  gallery: 15, galleryWall: 12, galleryTop: 15, plinth: 8, bays: 19, purlin: 9, fanFrom: 24, level: 0.44,
  // the truss's outer line as [metres in from the nave's wall, metres up]: a near-upright leg, a round haunch, a long rafter to the ridge
  arch: [[0, 0], [0.9, 10], [2.6, 17.5], [5.6, 23.5], [10.5, 28.5], [18, 33], [28, 37.6], [40, 42.2], [50, 45.6], [57.5, 48]],
};
const HALL_STONE = { brick: '#bfa58f', rose: '#c98f7c', terracotta: '#d9b79a', zinc: '#6b7d8c', slate: '#46505e', iron: '#27303c', gilt: '#d8a640', pearl: [0.80, 0.88, 0.96], warm: [1, 0.86, 0.62], gold: [1, 0.64, 0.22] };
// a line of [d, y] cut at height y0: the points at and above it, the first one on the cut
function cutAbove(line, y0) {
  const out = [];
  for (let i = 0; i < line.length; i++) {
    const p = line[i], q = line[i - 1];
    if (p[1] < y0) continue;
    if (!out.length && q && p[1] > y0) { const t = (y0 - q[1]) / (p[1] - q[1]); out.push([q[0] + (p[0] - q[0]) * t, y0]); }
    out.push(p);
  }
  return out;
}
// an upright arcaded wall on the plan from (ax, az) to (bx, bz), y0 to y1, facing `out`: whole bays of about `bay` metres
function arcadeWall(b, ax, az, bx, bz, y0, y1, out, bay, form, light, strength) {
  const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / bay)), cw = len / n;
  b.surf(HK.ARCADE, cw + 64 * form, lightCode(light, strength));
  return hallQuad(b, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], out, (p) => [Math.hypot(p[0] - ax, p[2] - az) / cw, p[1] - y0]);
}
// an upright wall of brick under pale string courses every `courses` metres (a plain wall when 0), with the gas's wash
function brickWall(b, ax, az, bx, bz, y0, y1, out, courses = 4) {
  b.surf(courses ? HK.BAND : HK.PLAIN, 0, courses || 1);
  return hallQuad(b, [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], out, (p) => [Math.hypot(p[0] - ax, p[2] - az), p[1]]);
}
// a shed's roof over a rectangle: two zinc slopes from the eaves (yE) up to a glazed strip either side of the ridge
// (yR), the strip `share` of each slope, its bays about 8 m long; the ridge runs along Z when alongZ
const ROOF_ZINC = 0.6;                                   // INVENTED BY NEED, WORKING: the share of its tone a hall's zinc roof keeps, laid at build and the same at every hour (weathered zinc: a dark ground for the lit glazing)
function shedRoof(b, x0, z0, x1, z1, yE, yR, alongZ, zinc, light = LIGHT.warm, strength = 0.5, share = 0.4) {
  const c = alongZ ? (x0 + x1) / 2 : (z0 + z1) / 2, half = (alongZ ? x1 - x0 : z1 - z0) / 2, l0 = alongZ ? z0 : x0, l1 = alongZ ? z1 : x1;
  const bays = Math.max(1, Math.round((l1 - l0) / 8)), yS = yR - (yR - yE) * share, slope = Math.hypot(half * share, yR - yS);
  const P = (across, y, along) => (alongZ ? [across, y, along] : [along, y, across]), wash = [b.fl, b.flY, b.flL];
  for (const s of [-1, 1]) {
    const e = c + s * half, m = c + s * half * share;
    // (the zinc takes none of the fronts' wash: the gas along a front lights its wall, not the roof over it)
    b.flood(0).col(zinc).surf(HK.PLAIN);
    hallQuad(b, [P(e, yE, l0), P(e, yE, l1), P(m, yS, l1), P(m, yS, l0)], [0, 1, 0], null, ROOF_ZINC);
    b.col(light === LIGHT.pearl ? HALL_STONE.pearl : HALL_STONE.warm).surf(HK.GLASS, 0, lightCode(light, strength));
    hallQuad(b, [P(m, yS, l0), P(m, yS, l1), P(c, yR, l1), P(c, yR, l0)], [0, 1, 0], (p) => [((alongZ ? p[2] : p[0]) - l0) / (l1 - l0) * bays, p[1] === yR ? slope : 0]);
  }
  b.flood(...wash);
}
// a gabled front across a shed's end, on the plan from (ax, az) to (bx, bz), facing `out`: an arcaded wall to the
// eaves and above it the gable as one glazed fan
function shedFront(b, ax, az, bx, bz, y0, yE, yR, out, wall, bay, light = LIGHT.warm, strength = 0.8) {
  const mx = (ax + bx) / 2, mz = (az + bz) / 2;
  b.col(wall);
  arcadeWall(b, ax, az, bx, bz, y0, yE, out, bay, BROAD, light, strength);
  b.col(light === LIGHT.pearl ? HALL_STONE.pearl : HALL_STONE.warm).surf(HK.FAN, yE - y0, lightCode(light, strength * 0.8));
  const side = (p) => Math.sign((p[0] - mx) * (bx - ax) + (p[2] - mz) * (bz - az)) * Math.hypot(p[0] - mx, p[2] - mz);
  return hallQuad(b, [[ax, yE, az], [bx, yE, bz], [mx, yR, mz], [ax, yE, az]], out, (p) => [side(p), p[1] - y0]);
}
// a dome's line from its foot (radius R at y0) up to its crown (radius rTop, H higher), as [radius, height] in n lengths
function domeLine(R, y0, H, rTop, n) {
  const a1 = Math.acos(rTop / R), out = [];
  for (let i = 0; i <= n; i++) { const a = a1 * i / n; out.push([R * Math.cos(a), y0 + H * Math.sin(a) / Math.sin(a1)]); }
  return out;
}
// a dome's ribs: `count` raised bars up the dome's line about (cx, cz), each `wide` across and `deep`; and, when
// `lamps` is given, a small burner every `step` metres up each rib, pushed onto it as [x, y, z, globe]
function domeRibs(b, cx, cz, line, count, wide, deep, lamps, step, globe) {
  for (let k = 0; k < count; k++) {
    const a = Math.PI * 2 * k / count, ca = Math.cos(a), sa = Math.sin(a);
    let run = step / 2;
    for (let i = 0; i + 1 < line.length; i++) {
      const [ra, ya] = line[i], [rb, yb] = line[i + 1], len = Math.hypot(rb - ra, yb - ya), o = deep * 0.3;
      b.beam([cx + (ra + o) * ca, ya, cz + (ra + o) * sa], [cx + (rb + o) * ca, yb, cz + (rb + o) * sa], wide, deep);
      for (; lamps && run <= len; run += step) { const t = run / len, r = ra + (rb - ra) * t + deep + 0.25; lamps.push([cx + r * ca, ya + (yb - ya) * t + 0.2, cz + r * sa, globe]); }
      run -= len;
    }
  }
}
function layGlassHall(b) {
  const F = FRAME.glassHall, H = GLASS_HALL, Y = FRAME.groundY, X0 = -F.halfWidth, X1 = F.halfWidth, zc = (F.z0 + F.z1) / 2, half = (F.z1 - F.z0) / 2 - H.gallery;
  const BRICK = S.lin(HALL_STONE.brick), ZINC = S.lin(HALL_STONE.zinc), IRON = S.lin(HALL_STONE.iron), CREAM = S.lin(HALL_TONES.cream);
  const bayW = (X1 - X0) / H.bays, cw = bayW / 3, roof = cutAbove(H.arch, H.galleryTop), glassEnd = cutAbove(H.arch, H.plinth);
  for (const side of [-1, 1]) {
    const zAt = (d) => zc + side * (half - d), zOut = side < 0 ? F.z0 : F.z1, zIn = zAt(0);
    // the glass roof, from the gallery's roof up to the ridge: one long piece to each length of the truss's line
    b.col(HALL_STONE.pearl).surf(HK.GLASS, H.purlin, lightCode(LIGHT.pearl, H.level));
    for (let i = 0, v = 0; i + 1 < roof.length; i++) {
      const [da, ya] = roof[i], [db, yb] = roof[i + 1], va = v, vb = (v += Math.hypot(db - da, yb - ya));
      hallQuad(b, [[X0, Y + ya, zAt(da)], [X1, Y + ya, zAt(da)], [X1, Y + yb, zAt(db)], [X0, Y + yb, zAt(db)]], [0, 0.2, side], (p) => [(p[0] - X0) / bayW, p[1] === Y + ya ? va : vb]);
    }
    // the side gallery: its arcaded wall lit from within, a pale cornice, a zinc lean-to up to the nave, its two ends
    b.col(BRICK).surf(HK.ARCADE, cw, lightCode(LIGHT.warm, 0.9));
    hallQuad(b, [[X0, Y, zOut], [X1, Y, zOut], [X1, Y + H.galleryWall, zOut], [X0, Y + H.galleryWall, zOut]], [0, 0, side], (p) => [(p[0] - X0) / cw, p[1] - Y]);
    b.col(CREAM).surf(HK.PLAIN);
    hallQuad(b, [[X0, Y + H.galleryWall - 0.7, zOut + side * 0.35], [X1, Y + H.galleryWall - 0.7, zOut + side * 0.35], [X1, Y + H.galleryWall, zOut + side * 0.35], [X0, Y + H.galleryWall, zOut + side * 0.35]], [0, 0, side]);
    b.col(ZINC);
    hallQuad(b, [[X0, Y + H.galleryWall, zOut + side * 0.35], [X1, Y + H.galleryWall, zOut + side * 0.35], [X1, Y + H.galleryTop, zIn], [X0, Y + H.galleryTop, zIn]], [0, 1, 0]);
    for (const [x, out] of [[X0, -1], [X1, 1]]) {
      b.col(BRICK).surf(HK.BAND, 0, 4);
      hallQuad(b, [[x, Y, zOut], [x, Y, zIn], [x, Y + H.galleryTop, zIn], [x, Y + H.galleryWall, zOut]], [out, 0, 0], (p) => [p[2], p[1]]);
    }
  }
  // the ridge's iron cap
  b.col(IRON).surf(HK.PLAIN).box(X0, Y + F.ridge - 0.5, zc - 0.7, X1, Y + F.ridge + 0.1, zc + 0.7);
  // the two gables: a brick foot with a row of lit doorways, and above it one great window under the truss's line
  for (const [x, out] of [[X0, -1], [X1, 1]]) {
    const pcw = 2 * half / 23;
    b.col(BRICK).surf(HK.ARCADE, pcw, lightCode(LIGHT.warm, 0.9));
    hallQuad(b, [[x, Y, zc - half], [x, Y, zc + half], [x, Y + H.plinth, zc + half], [x, Y + H.plinth, zc - half]], [out, 0, 0], (p) => [(p[2] - zc + half) / pcw, p[1] - Y]);
    b.col(HALL_STONE.pearl).surf(HK.FAN, H.fanFrom, lightCode(LIGHT.pearl, H.level));
    for (const side of [-1, 1]) for (let i = 0; i + 1 < glassEnd.length; i++) {
      const [da, ya] = glassEnd[i], [db, yb] = glassEnd[i + 1], za = zc + side * (half - da), zb = zc + side * (half - db);
      hallQuad(b, [[x, Y + H.plinth, za], [x, Y + H.plinth, zb], [x, Y + yb, zb], [x, Y + ya, za]], [out, 0, 0], (p) => [p[2] - zc, p[1] - Y]);
    }
  }
}

// THE CENTRAL DOME (figures.md B: 30 m across, the dome's top at 55 m, a figure to 65 m; src-site.md: a balcony 10 m
// up, two square pavilions each flanked by four pylons; figures.md C: gold within, a dotted gold outline). SOURCED:
// the place, the three sizes, the balcony, the two pavilions and their pylons, the gold light and the dotted line of
// gas. INVENTED BY NEED (the sources give a dome over the main entrance, not its drawing): the square body under the
// drum, the porch's one great arch, the drum's sixteen windows, the dome's line and sixteen ribs, every colour. The
// figure is a plain gilt point with no feature.
const CENTRAL = { body: 20, bodyH: 22, porch: 12, porchDeep: 5, porchH: 29, drumH: 10, ribs: 16, crown: 3.2, pavilion: 12, pavilionX: 26, pavilionH: 19, pylon: 2.2, pylonH: 25, balcony: 10, glow: 0.42, lampStep: 2.3 };
function layCentralDome(b, lamps) {
  const CD = FRAME.centralDome, C = CENTRAL, Y = FRAME.groundY, x = CD.x, z = CD.z, R = CD.diameter / 2, zf = z - C.body, zp = zf - C.porchDeep;
  const CREAM = S.lin(HALL_TONES.cream), TERRA = S.lin(HALL_STONE.terracotta), GILT = S.lin(HALL_STONE.gilt), SLATE = S.lin(HALL_STONE.slate), drumY = Y + C.bodyH, domeY = drumY + C.drumH;
  // the square body: three broad lit bays on each side, a plain front either side of the porch, a pale cornice
  b.col(CREAM).flood(0.8, Y, 16);
  for (const sx of [-1, 1]) {
    arcadeWall(b, x + sx * C.body, zf, x + sx * C.body, z + C.body, Y, drumY, [sx, 0, 0], 13, BROAD, LIGHT.gold, 1.2);
    brickWall(b, x + sx * C.porch, zf, x + sx * C.body, zf, Y, drumY, [0, 0, -1], 5.5);
  }
  b.col(SLATE).surf(HK.PLAIN);
  hallQuad(b, [[x - C.body, drumY, zf], [x + C.body, drumY, zf], [x + C.body, drumY, z + C.body], [x - C.body, drumY, z + C.body]], [0, 1, 0]);
  // the porch: one great arch gold within, its balcony, a low gable over it
  b.col(CREAM);
  arcadeWall(b, x - C.porch, zp, x + C.porch, zp, Y, Y + C.porchH, [0, 0, -1], 2 * C.porch, BROAD, LIGHT.gold, 1.6);
  for (const sx of [-1, 1]) brickWall(b, x + sx * C.porch, zp, x + sx * C.porch, zf, Y, Y + C.porchH, [sx, 0, 0], 5.5);
  b.col(TERRA).surf(HK.PLAIN).box(x - C.porch * 0.72, Y + C.balcony - 1, zp - 1.2, x + C.porch * 0.72, Y + C.balcony, zp, { bottom: true });
  b.col(SLATE).gable(x - C.porch, zp, x + C.porch, zf, Y + C.porchH, 4, { alongX: false, overhang: 0.5, style: HK.PLAIN, wallColor: CREAM });
  // the two square pavilions, each under a slate cap between four pylons with pointed heads
  for (const sx of [-1, 1]) {
    const px = x + sx * C.pavilionX, pz = zf - 2, h = C.pavilion / 2;
    b.col(CREAM);
    for (const [ox, oz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) arcadeWall(b, px - h * (oz - ox), pz + h * (oz + ox), px + h * (oz + ox), pz + h * (oz - ox), Y, Y + C.pavilionH, [ox, 0, oz], C.pavilion, TALL, LIGHT.gold, 1.0);
    b.col(SLATE, 0.8, 1.1).surf(HK.PLAIN).frustum(px, pz, C.pavilion + 0.8, C.pavilion + 0.8, 2, 2, Y + C.pavilionH, Y + C.pavilionH + 7);
    for (const cx of [-1, 1]) for (const cz of [-1, 1]) {
      b.col(TERRA).surf(HK.BAND, 0, 5).cbox(px + cx * h, Y, pz + cz * h, C.pylon, C.pylonH, C.pylon, { top: false, m: 1 });
      b.col(GILT).surf(HK.PLAIN).frustum(px + cx * h, pz + cz * h, C.pylon + 0.5, C.pylon + 0.5, 0, 0, Y + C.pylonH, Y + C.pylonH + 3);
    }
  }
  // the drum: sixteen windows gold within; the dome: gold glass between sixteen gilt ribs; the crown and the figure's plain gilt point
  b.col(CREAM).surf(HK.ARCADE, Math.PI * 2 * R / C.ribs + 64 * TALL, lightCode(LIGHT.gold, 1.4)).lathe(x, drumY, z, [[R, 0], [R, C.drumH]], 32, { uvBand: [C.ribs, 0, C.drumH] });
  b.col(GILT).surf(HK.PLAIN).lathe(x, domeY - 0.8, z, [[R + 0.7, 0], [R + 0.7, 0.8], [R, 0.8]], 32);
  const crownY = Y + CD.domeTop - 3, line = domeLine(R, domeY, crownY - domeY, C.crown, 10);
  let len = 0; for (let i = 0; i + 1 < line.length; i++) len += Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]);
  b.col(HALL_STONE.gold).surf(HK.GLASS, 4.5, lightCode(LIGHT.gold, C.glow)).lathe(x, 0, z, line, 32, { smooth: true, uvBand: [C.ribs, 0, len] });
  b.col(GILT, 0.8, 1.05).surf(HK.PLAIN);
  domeRibs(b, x, z, line, C.ribs, 0.9, 0.6, lamps, C.lampStep, 0.2);
  b.lathe(x, crownY, z, [[C.crown + 0.5, 0], [C.crown + 0.5, 0.8], [C.crown - 0.6, 3], [0, 3]], 16);
  b.cyl(x, Y + CD.domeTop, z, 1.3, 0, CD.statueTop - CD.domeTop, 8);
  // the dotted line of gas: round the dome's foot, along the body's cornice, up the porch's jambs and round its arch
  for (let k = 0; k < 48; k++) { const a = Math.PI * 2 * (k + 0.5) / 48; lamps.push([x + (R + 1.1) * Math.cos(a), domeY + 0.4, z + (R + 1.1) * Math.sin(a), 0.2]); }
  for (const sx of [-1, 1]) for (let q = zf + 1.5; q < z + C.body; q += 3) lamps.push([x + sx * (C.body + 0.4), drumY + 0.4, q, 0.2]);
  const cw = 2 * C.porch, hw = 0.36 * cw + 0.9, ys = 1.05 * cw - 0.36 * cw;
  for (let k = 0; k <= 14; k++) { const a = Math.PI * k / 14; lamps.push([x + hw * Math.cos(a), Y + ys + hw * Math.sin(a), zp - 0.4, 0.2]); }
  for (const sx of [-1, 1]) for (let y = 2.5; y < ys; y += 2.6) lamps.push([x + sx * hw, Y + y, zp - 0.4, 0.2]);
}

// THE INDUSTRIES HALLS round their court (figures.md B: z 359 to 690, out to x 215 either side; src-site.md: the
// gallery 30 m wide on the axis from the dome to the glass hall, and the two galleries 30 m wide between the
// palaces' ends and these halls). SOURCED: the places and the plan (two wings beside the court, a body across its
// end behind the dome, the axis gallery, the two cross galleries). INVENTED BY NEED (the sources give no height and
// no drawing): 18 m to the ridges (FRAME's working height), the sheds' number and their ridges' run, the glazed
// strips along the ridges, the fronts' arcades and fan gables, the axis gallery's greater height (26 m to its ridge:
// src-site.md finds none) and its last 20 m (src-site.md gives it from z 510 to 700; it is carried on to the glass
// hall's own wall at z 720, since the two halls stood joined). NOT BUILT: the two Ville de Paris pavilions in the
// court (src-site.md: z 377 to 458, 52 m either side of the axis, 81 by 22 m, no height and no drawing).
const INDUSTRY = { wall: 11, sheds: 4, bay: 8.7, spine: 15, spineWall: 19, spineRidge: 26, strip: 0.3 };   // (strip: the level of the light in the ridges' glazing: from above each shed is a long warm lantern of lit glass along its ridge between dark zinc, bay by bay as the gas within lights it)
function layIndustries(b) {
  const IN = FRAME.industries, GH = FRAME.glassHall, PL = FRAME.palaces, N = INDUSTRY, Y = FRAME.groundY, yE = Y + N.wall, yR = Y + IN.height;
  const TERRA = S.lin(HALL_STONE.terracotta), BRICK = S.lin(HALL_STONE.brick), ZINC = S.lin(HALL_STONE.zinc), court = GARDEN.courtHalf, far = IN.halfWidth, zBody = FRAME.centralDome.z + CENTRAL.body;
  b.flood(0.7, Y, 10);
  for (const sx of [-1, 1]) {
    const span = (a, c) => [Math.min(sx * a, sx * c), Math.max(sx * a, sx * c)];
    // a wing beside the court: sheds with their ridges along Z, an arcade along the court, brick to the avenue and behind
    for (let k = 0, w = (far - court) / N.sheds; k < N.sheds; k++) { const [x0, x1] = span(court + k * w, court + (k + 1) * w); shedRoof(b, x0, IN.z0, x1, IN.z1, yE, yR, true, ZINC, LIGHT.warm, N.strip, 0.3); }
    b.col(TERRA);
    arcadeWall(b, sx * court, IN.z0, sx * court, zBody, Y, yE, [-sx, 0, 0], N.bay, BROAD, LIGHT.warm, 0.8);
    b.col(BRICK);
    brickWall(b, sx * far, PL.z1, sx * far, IN.z1, Y, yE, [sx, 0, 0]);
    // the body across the court's end: sheds either side of the axis gallery, each with a gabled front to the court
    for (let k = 0, w = (court - N.spine) / N.sheds; k < N.sheds; k++) {
      const [x0, x1] = span(N.spine + k * w, N.spine + (k + 1) * w);
      shedRoof(b, x0, zBody, x1, IN.z1, yE, yR, true, ZINC, LIGHT.warm, N.strip, 0.3);
      shedFront(b, x0, zBody, x1, zBody, Y, yE, yR, [0, 0, -1], TERRA, N.bay);
    }
    // the back, toward the glass hall: brick to the eaves, a plain gable over each shed
    b.col(BRICK);
    brickWall(b, sx * N.spine, IN.z1, sx * far, IN.z1, Y, yE, [0, 0, 1]);
    for (let k = 0, n = 2 * N.sheds, w = (far - N.spine) / n; k < n; k++) {
      const [x0, x1] = span(N.spine + k * w, N.spine + (k + 1) * w);
      hallQuad(b.surf(HK.PLAIN), [[x0, yE, IN.z1], [x1, yE, IN.z1], [(x0 + x1) / 2, yR, IN.z1], [x0, yE, IN.z1]], [0, 0, 1]);
    }
    // the cross gallery between the palace's end and the wing: one shed, a gabled front at each end
    const [g0, g1] = span(court, far);
    shedRoof(b, g0, PL.z1, g1, IN.z0, yE, yR, false, ZINC, LIGHT.warm, N.strip, 0.3);
    shedFront(b, sx * court, PL.z1, sx * court, IN.z0, Y, yE, yR, [-sx, 0, 0], TERRA, 10);
    shedFront(b, sx * far, PL.z1, sx * far, IN.z0, Y, yE, yR, [sx, 0, 0], TERRA, 10);
    // the axis gallery's side: lit windows over the sheds' eaves, brick down to the ground between the halls
    b.col(TERRA);
    arcadeWall(b, sx * N.spine, zBody, sx * N.spine, GH.z0, yE, Y + N.spineWall, [sx, 0, 0], 6.5, BROAD, LIGHT.pearl, 0.7);
    b.col(BRICK);
    brickWall(b, sx * N.spine, IN.z1, sx * N.spine, GH.z0, Y, yE, [sx, 0, 0]);
  }
  // the axis gallery: a higher nave from the dome to the glass hall under a roof three quarters glass
  shedRoof(b, -N.spine, zBody, N.spine, GH.z0, Y + N.spineWall, Y + N.spineRidge, true, ZINC, LIGHT.pearl, 0.42, 0.75);
  shedFront(b, -N.spine, zBody, N.spine, zBody, yE, Y + N.spineWall, Y + N.spineRidge, [0, 0, -1], TERRA, 7.5, LIGHT.pearl, 0.7);
}

// A PALACE (fine arts on +X, liberal arts on -X, the two alike; figures.md B: 230 by 82 m, z 97 to 329, a nave
// 52.8 m wide, a dome 56 m high of blue tile on rose brick at x 155, z 223; src-site.md: side galleries, the soft
// blue of the iron and the tender rose of the brick; figures.md C: small warm points along the fronts). SOURCED: the
// place and size, the nave and its two galleries, the dome's height, its blue tile and rose brick, the iron's soft
// blue, the gas along the garden front. INVENTED BY NEED (the sources give iron frames filled with brick and
// terracotta and a tiled dome, not their drawing): 25 m to the nave's ridge (FRAME's working height) and the
// heights under it, the bays' count and form, the entrance under the dome, the dome's square foot, its drum's
// lancets, its line, its sixteen ribs and its lantern.
const PALACE = { front: 13.2, cornice: 14, galleryTop: 16, clerestory: 19.5, bay: 7.25, porch: 15, porchOut: 3, porchH: 21,
  foot: 18, footH: 28, drumR: 15, drumH: 8, lancets: 28, ribs: 16, crown: 2.6, domeTop: 52.5, lantern: 2.5, wash: 0.9 };
const ENAMEL = { deep: '#2a63ad', pale: '#49a6c9', rib: '#d6e6e2' };   // WORKING: the tile's blue at the dome's foot and toward its crown, the ribs' paler glaze
function layPalace(b, sx, lamps) {
  const PL = FRAME.palaces, D = PL.dome, P = PALACE, Y = FRAME.groundY, cx = sx * D.x, n0 = D.x - PL.nave / 2, n1 = D.x + PL.nave / 2;
  const ROSE = S.lin(HALL_STONE.rose), CREAM = S.lin(HALL_TONES.cream), ZINC = S.lin(HALL_STONE.zinc), IRON = S.lin(HALL_TONES.iron), SLATE = S.lin(HALL_STONE.slate);
  const span = (a, c) => [Math.min(sx * a, sx * c), Math.max(sx * a, sx * c)], yF = Y + P.front, yG = Y + P.galleryTop, yC = Y + P.clerestory, yR = Y + PL.bodyHeight;
  b.flood(P.wash, Y, 12);
  // the two long fronts: an arcade of tall glazed bays lit from within between the iron's blue uprights, a pale cornice
  for (const [ax, out, strength] of [[PL.xNear, -sx, 1.0], [PL.xFar, sx, 0.6]]) {
    b.col(ROSE);
    arcadeWall(b, sx * ax, PL.z0, sx * ax, PL.z1, Y, yF, [out, 0, 0], P.bay, TALL, LIGHT.warm, strength);
    const [c0, c1] = [Math.min(sx * ax, sx * ax + out * 0.6), Math.max(sx * ax, sx * ax + out * 0.6)];
    b.col(CREAM).surf(HK.PLAIN).box(c0, yF, PL.z0, c1, Y + P.cornice, PL.z1, { bottom: true });
  }
  // the galleries' lean-to roofs, the nave's lit clerestory over them, the nave's roof with its glazed strips
  b.flood(0).col(ZINC).surf(HK.PLAIN);
  hallQuad(b, [[sx * PL.xNear, Y + P.cornice, PL.z0], [sx * PL.xNear, Y + P.cornice, PL.z1], [sx * n0, yG, PL.z1], [sx * n0, yG, PL.z0]], [0, 1, 0], null, ROOF_ZINC);
  hallQuad(b, [[sx * PL.xFar, Y + P.cornice, PL.z0], [sx * PL.xFar, Y + P.cornice, PL.z1], [sx * n1, yG, PL.z1], [sx * n1, yG, PL.z0]], [0, 1, 0], null, ROOF_ZINC);
  b.flood(P.wash, Y, 12).col(ROSE);
  arcadeWall(b, sx * n0, PL.z0, sx * n0, PL.z1, yG, yC, [-sx, 0, 0], P.bay / 2, BROAD, LIGHT.warm, 0.8);
  arcadeWall(b, sx * n1, PL.z0, sx * n1, PL.z1, yG, yC, [sx, 0, 0], P.bay / 2, BROAD, LIGHT.warm, 0.6);
  const [r0, r1] = span(n0, n1);
  shedRoof(b, r0, PL.z0, r1, PL.z1, yC, yR, true, ZINC, LIGHT.warm, 0.4, 0.45);
  b.col(IRON).surf(HK.PLAIN).box(cx - 0.5, yR - 0.2, PL.z0, cx + 0.5, yR + 0.5, PL.z1);
  // the two ends: the nave's gabled front with five tall bays under a glazed fan, a gallery's end either side
  for (const [z, out] of [[PL.z0, -1], [PL.z1, 1]]) {
    shedFront(b, r0, z, r1, z, Y, yC, yR, [0, 0, out], ROSE, PL.nave / 5, LIGHT.warm, 0.9);
    for (const [xa, xb, ya] of [[PL.xNear, n0, Y + P.cornice], [PL.xFar, n1, Y + P.cornice]]) {
      b.col(ROSE);
      arcadeWall(b, sx * xa, z, sx * xb, z, Y, yF, [0, 0, out], 9, TALL, LIGHT.warm, 0.8);
      b.surf(HK.BAND, 0, 4);
      hallQuad(b, [[sx * xa, yF, z], [sx * xb, yF, z], [sx * xb, yG, z], [sx * xa, ya, z]], [0, 0, out], (q) => [q[0], q[1]]);
    }
  }
  // the entrance under the dome: a block three tall bays wide standing out from the garden front, under a low slate roof
  const fx = sx * (PL.xNear - P.porchOut), [p0, p1] = span(PL.xNear - P.porchOut, PL.xNear + 6);
  b.col(CREAM);
  arcadeWall(b, fx, D.z - P.porch, fx, D.z + P.porch, Y, Y + P.porchH, [-sx, 0, 0], 10, TALL, LIGHT.warm, 1.2);
  for (const s of [-1, 1]) brickWall(b, fx, D.z + s * P.porch, sx * (PL.xNear + 6), D.z + s * P.porch, Y, Y + P.porchH, [0, 0, s], 5);
  b.col(SLATE).hip(p0, D.z - P.porch, p1, D.z + P.porch, Y + P.porchH, 3.5, { overhang: 0.5, ridge: 0.6, style: HK.PLAIN });
  // THE DOME: a square foot of rose brick through the roofs, three broad lit bays to a side; a drum of rose brick
  // with slender lit lancets; the dome of blue enamelled tile, deeper at its foot, under paler ribs; a lit lantern
  const F = P.foot, footY = Y + P.footH, domeY = footY + P.drumH, DEEP = S.lin(ENAMEL.deep), PALE = S.lin(ENAMEL.pale);
  b.col(ROSE);
  for (const [ox, oz] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) arcadeWall(b, cx + (ox + oz) * F, D.z + (oz - ox) * F, cx + (ox - oz) * F, D.z + (oz + ox) * F, Y + P.cornice - 2, footY, [ox, 0, oz], 12, BROAD, LIGHT.warm, 0.7);
  b.col(CREAM).surf(HK.PLAIN).box(cx - F - 0.6, footY - 0.9, D.z - F - 0.6, cx + F + 0.6, footY, D.z + F + 0.6, { bottom: true, capColor: SLATE });
  b.col(ROSE).surf(HK.ARCADE, Math.PI * 2 * P.drumR / P.lancets + 64 * SLENDER, lightCode(LIGHT.warm, 0.6)).lathe(cx, footY, D.z, [[P.drumR, 0], [P.drumR, P.drumH]], 32, { uvBand: [P.lancets, 0, P.drumH] });
  b.col(CREAM).surf(HK.PLAIN).lathe(cx, domeY - 0.9, D.z, [[P.drumR + 0.8, 0], [P.drumR + 0.8, 0.9], [P.drumR, 0.9]], 32);
  const line = domeLine(P.drumR + 0.4, domeY, Y + P.domeTop - domeY, P.crown, 12);
  b.surf(HK.TILE, 0, 1).lathe(cx, 0, D.z, line, 32, { smooth: true, m: 1, colors: line.map((q, i) => DEEP.map((v, k) => v + (PALE[k] - v) * Math.pow(i / 12, 1.5))) });
  b.col(S.lin(ENAMEL.rib), 0.85, 1.05).surf(HK.TILE, 0, 1);
  domeRibs(b, cx, D.z, line, P.ribs, 1.0, 0.6);
  b.col(CREAM).surf(HK.ARCADE, Math.PI * 2 * P.crown / 12 + 64 * TALL, lightCode(LIGHT.warm, 1.0)).lathe(cx, Y + P.domeTop, D.z, [[P.crown, 0], [P.crown, P.lantern]], 12, { uvBand: [12, 0, P.lantern] });   // the lantern: twelve small lit lights in a cream drum
  b.col(DEEP).surf(HK.TILE, 0, 1).lathe(cx, Y + P.domeTop + P.lantern, D.z, [[P.crown + 0.5, 0], [P.crown * 0.4, 0.6], [0, D.height - P.domeTop - P.lantern]], 12);
  // the gas along the garden front: one small burner between every two bays, under the cornice, and along the entrance's eaves
  for (let k = 0, n = Math.round((PL.z1 - PL.z0) / P.bay); k <= n; k++) {
    const z = PL.z0 + (PL.z1 - PL.z0) * k / n;
    if (Math.abs(z - D.z) > P.porch + 1) lamps.push([sx * (PL.xNear - 0.8), Y + P.front - 1.2, z, 0]);
  }
  for (let k = 0; k <= 6; k++) lamps.push([fx - sx * 0.8, Y + P.porchH - 1, D.z - P.porch + 2 * P.porch * k / 6, 0]);
}

// THE SMALL TOWER (figures.md B: the pavilion's square tower about 40 m high, at FRAME.brazilTower; its place is
// WORKING there). SOURCED: a square tower of about 40 m beside the lake on the downstream side. INVENTED BY NEED
// (the sources give its height and that it was square, nothing more): a slender plain shaft with three storeys of
// lit lancets, a small lit stage, a pointed tiled cap, and the low plain hall of its pavilion at its foot.
const SMALL_TOWER = { side: 7, shaft: 29, stage: 5, cap: 5.4, hall: [18, 13, 8] };
function laySmallTower(b) {
  const T = FRAME.brazilTower, W = SMALL_TOWER, Y = FRAME.groundY, x = T.x, z = T.z, h = W.side / 2, storey = W.shaft / 3;
  const WALL = S.lin('#e2d8c4'), TILE = S.lin('#8a4f3c'), CREAM = S.lin(HALL_TONES.cream);
  b.flood(0.7, Y, 14);
  const faces = [[0, -1], [1, 0], [0, 1], [-1, 0]], ring = (r, y0, y1, bay, form, strength) => {
    for (const [ox, oz] of faces) arcadeWall(b.col(WALL), x + (ox + oz) * r, z + (oz - ox) * r, x + (ox - oz) * r, z + (oz + ox) * r, y0, y1, [ox, 0, oz], bay, form, LIGHT.gas, strength);
  };
  for (let k = 0; k < 3; k++) ring(h, Y + k * storey, Y + (k + 1) * storey, W.side / 2, SLENDER, 0.8);
  b.col(CREAM).surf(HK.PLAIN).box(x - h - 0.5, Y + W.shaft - 0.6, z - h - 0.5, x + h + 0.5, Y + W.shaft, z + h + 0.5, { bottom: true });
  ring(h - 0.5, Y + W.shaft, Y + W.shaft + W.stage, W.side / 2 - 0.5, TALL, 1.1);
  b.col(TILE, 0.8, 1.1).surf(HK.TILE, 0, 1).frustum(x, z, W.side + 0.8, W.side + 0.8, 0, 0, Y + W.shaft + W.stage, Y + W.shaft + W.stage + W.cap, { m: 1 });
  b.col(S.lin(HALL_STONE.iron)).surf(HK.PLAIN).cyl(x, Y + W.shaft + W.stage + W.cap - 0.3, z, 0.14, 0.05, T.height - W.shaft - W.stage - W.cap + 0.3, 5);
  // the pavilion's low hall, on the side away from the lake
  const [hx, hz, hy] = W.hall, x1 = x - h, x0 = x1 - hx, z0 = z - hz / 2, z1 = z + hz / 2;
  b.col(WALL);
  arcadeWall(b, x0, z0, x1, z0, Y, Y + hy, [0, 0, -1], 4.5, TALL, LIGHT.gas, 0.8);
  arcadeWall(b, x0, z1, x1, z1, Y, Y + hy, [0, 0, 1], 4.5, TALL, LIGHT.gas, 0.8);
  arcadeWall(b, x0, z0, x0, z1, Y, Y + hy, [-1, 0, 0], 4.5, TALL, LIGHT.gas, 0.8);
  b.col(TILE, 0.8, 1.1).hip(x0, z0, x1, z1, Y + hy, 3, { overhang: 0.5, ridge: 0.45, style: HK.TILE, m: 1 });
}
// THE LITTLE RAILWAY'S TERMINUS (figures.md B and src-site.md: the narrow-gauge line's terminal station near the
// corner of the glass hall, FRAME.railwayEnd). SOURCED: a terminal station there. INVENTED BY NEED (no source
// draws it): a low brick shed 10 m wide under a zinc roof with a glazed strip, its gable toward the line a lit fan.
const TERMINUS = { half: 5, wall: 4.2, ridge: 7 };
function layTerminus(b) {
  const R = FRAME.railwayEnd, T = TERMINUS, Y = FRAME.groundY, x0 = R.x - T.half, x1 = R.x + T.half, BRICK = S.lin(HALL_STONE.brick);
  b.flood(0.6, Y, 6);
  shedRoof(b, x0, R.z0, x1, R.z1, Y + T.wall, Y + T.ridge, true, S.lin(HALL_STONE.zinc), LIGHT.gas, 0.5, 0.35);
  shedFront(b, x0, R.z0, x1, R.z0, Y, Y + T.wall, Y + T.ridge, [0, 0, -1], BRICK, 3.4, LIGHT.gas, 0.9);
  b.col(BRICK);
  for (const [x, out] of [[x0, -1], [x1, 1]]) arcadeWall(b, x, R.z0, x, R.z1, Y, Y + T.wall, [out, 0, 0], 3.6, BROAD, LIGHT.gas, 0.7);
  brickWall(b, x0, R.z1, x1, R.z1, Y, Y + T.wall, [0, 0, 1], 0);
  hallQuad(b, [[x0, Y + T.wall, R.z1], [x1, Y + T.wall, R.z1], [R.x, Y + T.ridge, R.z1], [x0, Y + T.wall, R.z1]], [0, 0, 1]);
}
// a place on the plan inside the terminus's shed and a tree's breadth round it: no tree or lamp of the avenue stands there
function inTerminus(x, z) { const R = FRAME.railwayEnd; return Math.abs(x - R.x) < TERMINUS.half + 4 && z > R.z0 - 4 && z < R.z1 + 4; }

// AN AWNING WALK'S CLOTH. SOURCED: figures.md B, 'Velum walks' (the awning lines either side of the great walk);
// INVENTED BY NEED in form (no source gives the cloth's cut): into a hall's builder, a low two-pitched roof of
// striped cloth along the line x = wx, its stripes across the walk, seen from above and from under. WORKING: its
// heights, its tone and its stripes' breadth: broad bands, a stripe and its pale neighbour 3 m together, since the
// line flies along the walks and a finer stripe would pass by most of its own breadth between two pictures.
const AWNING = { eave: 3.6, ridge: 4.7, period: 3, cloth: '#c79f88' };
function layAwning(b, wx) {
  const AW = FRAME.awningWalks, A = AWNING, Y = FRAME.groundY, uvOf = (p) => [(p[2] - AW.z0) / A.period, 0];
  b.col(S.lin(A.cloth), 0.9, 1).surf(HK.CLOTH, 0, 0);
  for (const sx of [-1, 1]) {
    const P = [[wx + sx * GARDEN.walkHalf, Y + A.eave, AW.z0], [wx + sx * GARDEN.walkHalf, Y + A.eave, AW.z1], [wx, Y + A.ridge, AW.z1], [wx, Y + A.ridge, AW.z0]];
    hallQuad(b, P, [sx, 1, 0], uvOf); hallQuad(b, P, [-sx, -1, 0], uvOf);
  }
}
// THE HALLS LAID: each group of halls into a builder of its own (one mesh, one call, each), with a step between
// groups; and the places of the small gas burners that pick out the dome and the palaces' fronts, for the ground's
// lamps. Returns [[name, builder], ...] and the burners as [x, y, z, globe's radius or 0 for the small one].
async function layHalls(ctx) {
  const pieces = [], lamps = [];
  const glass = new S.Builder(1024);
  layGlassHall(glass);
  layTerminus(glass);
  pieces.push(['glass-hall', glass]);
  await ctx.yield();
  const court = new S.Builder(4096);
  layCentralDome(court, lamps);
  await ctx.yield();
  layIndustries(court);
  await ctx.yield();
  pieces.push(['dome-and-industries', court]);
  await ctx.yield();
  for (const sx of [1, -1]) {
    const palace = new S.Builder(8192);
    layPalace(palace, sx, lamps);
    for (const wx of FRAME.awningWalks.x) if (wx * sx > 0) layAwning(palace, wx);
    if (sx < 0) laySmallTower(palace);
    pieces.push([sx > 0 ? 'palace-upstream' : 'palace-downstream', palace]);
    await ctx.yield();
  }
  return { pieces, lamps };
}
// THE HALLS DRAWN: the pieces as meshes on the halls' one material. hallU's four uniforms are skyAt's and the
// update's to write (the lit share and the lights' levels by the night number, the fill and the wash, the clock).
async function buildHalls(ctx, scene, mats) {
  const uniforms = { uHallLit: { value: new THREE.Vector4(0, 0, 0, 0) }, uHallFill: { value: new THREE.Color(0, 0, 0) }, uHallWash: { value: new THREE.Color(0, 0, 0) }, uHallTime: { value: 0 } };
  const material = makeHallMaterial(mats, uniforms), laid = await layHalls(ctx);
  let triangles = 0;
  for (const [name, b] of laid.pieces) {
    const mesh = new THREE.Mesh(b.toGeometry(), material); mesh.name = name; mesh.matrixAutoUpdate = false; triangles += b.triangles;
    scene.add(mesh);
    await ctx.yield();
  }
  return { uniforms, lamps: laid.lamps, triangles, meshes: laid.pieces.length, dispose() { material.dispose(); } };
}

// ---- THE TREES: a trunk under a crown of several lumps (a main mass, three side masses at unlike heights), drawn
// as instances in one call: rows along the quay, down the two side avenues, beside the garden's walks and lawns, a
// few by each lake; unlike in size, turn and tone, each from its own number. SOURCED in kind: "trees, shrubbery,
// parterres of flowers" and clumps on the lawns (src-site.md "Garden and fountains"); INVENTED BY NEED in form (the
// sources give no tree's shape; one plain ball each read as a toy). They sway a little by the world's clock alone
// (a pure function of time in the vertex shader, each tree's phase from its own place). A CROWN NEAR A GAS LAMP
// takes that lamp's warm light on its underside and on the side turned to the lamp (TREE.lamp), lit by the lamp's
// own threshold of night. CLEAR AIR (order L5): the rows' places are chosen clear of the flown line; every planned
// tree is planted. WORKING: every size and level.
const TREE = { size: [0.7, 0.6], rough: 0.1, lamp: { reach: 14, level: 7 } };   // a tree's size: least, and the span over it; the share of a lump's radius a point of it stands in or out; a lamp's reach to a crown in metres, its light's strength on the leaves
function treeGeometry() {
  const pos = [], nor = [], col = [], sway = [], low = [], idx = [];
  const BARK = S.lin('#4a3c30'), LEAF = S.lin('#36583c');
  // (aLow: how much of a lamp's light a point takes by its height: whole at the crown's foot, none at its top)
  const v = (x, y, z, nx, ny, nz, c, k) => { pos.push(x, y, z); const l = Math.hypot(nx, ny, nz) || 1; nor.push(nx / l, ny / l, nz / l); col.push(c[0] * k, c[1] * k, c[2] * k);
    sway.push(Math.max(0, y - 1) / 8); low.push(Math.min(1, Math.max(0, (6.4 - y) / 3))); return pos.length / 3 - 1; };
  // the trunk: three sides from the ground into the crown
  for (let s = 0; s < 3; s++) {
    const a0 = s * Math.PI * 2 / 3, a1 = a0 + Math.PI * 2 / 3, am = a0 + Math.PI / 3, r = 0.3;
    const i = v(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(am), 0, Math.sin(am), BARK, 1);
    v(Math.cos(a0) * r, 3.6, Math.sin(a0) * r, Math.cos(am), 0, Math.sin(am), BARK, 0.7); v(Math.cos(a1) * r, 3.6, Math.sin(a1) * r, Math.cos(am), 0, Math.sin(am), BARK, 0.7); v(Math.cos(a1) * r, 0, Math.sin(a1) * r, Math.cos(am), 0, Math.sin(am), BARK, 1);
    idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  // a lump: a soft ball of `seg` sides about a middle, by rings of [radius share, height share]; its faces darker
  // underneath and toward the tree's foot, its normals those of a ball about its own middle. Each point stands a
  // little in or out of the ball by its own number (TREE.rough), so that a crown's outline is uneven, as leaves
  // are, and no lump shows the regular outline of its sides
  const lump = (cx, cy, cz, r, h, seg, rings, turn, tone = 1) => {
    const ring0 = [];
    for (let k = 0; k < rings.length; k++) {
      const [rr, hh] = rings[k], y = cy + hh * h, sh = tone * (0.36 + 0.84 * Math.min(1, Math.max(0, (y - 2.8) / 6.2)));
      ring0.push(pos.length / 3);
      for (let s = 0; s < seg; s++) { const a = turn + s / seg * Math.PI * 2, o = 1 + TREE.rough * (2 * hash01(pos.length, 58) - 1); v(cx + Math.cos(a) * rr * r * o, y, cz + Math.sin(a) * rr * r * o, Math.cos(a) * rr, hh * 2.2 * r / h + (rr === 0 ? Math.sign(hh) : 0), Math.sin(a) * rr, LEAF, sh); }
    }
    for (let k = 0; k + 1 < rings.length; k++) for (let s = 0; s < seg; s++) {
      const a = ring0[k] + s, c = ring0[k] + (s + 1) % seg, a2 = ring0[k + 1] + s, c2 = ring0[k + 1] + (s + 1) % seg;
      if (rings[k][0] > 0) idx.push(a, a2, c);
      if (rings[k + 1][0] > 0) idx.push(c, a2, c2);
    }
  };
  lump(0, 6, 0, 2.7, 6.4, 7, [[0, -0.5], [0.8, -0.38], [1, -0.02], [0.74, 0.36], [0, 0.5]], 0);        // the main mass
  const side = [[0, -0.5], [0.95, -0.12], [0.66, 0.3], [0, 0.5]];
  lump(1.75, 4.9, 0.7, 1.85, 3.5, 6, side, 0.5, 0.8);                                                       // three side masses, low, middle and high
  lump(-1.3, 5.9, 1.45, 1.7, 3.3, 6, side, 2.1, 1.18);
  lump(-0.6, 7.1, -1.7, 1.55, 3, 6, side, 3.9, 0.92);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
  g.setAttribute('aLow', new THREE.Float32BufferAttribute(low, 1)); g.setIndex(idx);
  return { geometry: g, height: 9.2, radius: 3.7, triangles: idx.length / 3 };
}
// where the trees stand, as [x, z, size]: WORKING, a likeness of the plan's rows
function treePlaces() {
  const out = [], G = GARDEN, F = FRAME, PL = F.palaces, lawn = G.lawns[1], AVE = GROUNDS_X + 11;
  const row = (x, z, s = 1) => out.push([x, z, s]);
  for (const sx of [-1, 1]) {
    for (let x = 24; x <= 205; x += 11) { row(sx * x, G.z0 + 7); row(sx * x, G.z0 + 19); }             // two rows along the quay
    for (let z = G.z0 + 10; z <= G.z1 - 5; z += 14) row(sx * AVE, z);                                 // one row down each side avenue
    for (let z = PL.z0 + 3; z <= PL.z1 - 3; z += 12) row(sx * (lawn[2] + 4), z);                       // before each palace's front
    for (let z = F.industries.z0 + 8; z <= G.lawns[4][3]; z += 12) row(sx * (lawn[2] + 4), z);         // down the court's sides
    for (const [x0, z0, , z1] of G.lawns.slice(1, 4)) for (let z = z0 + 5; z <= z1 - 5; z += 12) row(sx * (x0 + 6), z);   // inside the lawns, beside the awning walks
    for (let z = -60; z <= 60; z += 12) row(sx * 199, z);                                             // the lake lawn's outer edge
    for (let z = -24; z <= 24; z += 12) row(sx * (F.lakes.x[1] + F.lakes.sizeX / 2 + G.lakeWalk[1] + 1.9), z, 0.55);   // the lake's planting, small, beyond its walk
  }
  // (none where the terminus's shed stands, none before a palace's entrance, none on a walk cut through a lawn)
  const onWalk = (x, z) => G.walks.some(([cx, cz, hx, hz]) => Math.abs(Math.abs(x) - cx) < hx + 1.5 && Math.abs(z - cz) < hz + 1.5);
  return out.filter(([x, z]) => !inTerminus(x, z) && !onWalk(x, z) && !(Math.abs(x) < PL.xNear && Math.abs(x) > PL.xNear - 8 && Math.abs(z - PL.dome.z) < PALACE.porch + 3));
}

async function buildTrees(ctx, scene, mats, uLeafFill) {
  const T = treeGeometry(), places = treePlaces(), U = mats.uniforms, uTreeTime = { value: 0 }, uLampNight = { value: 0 };
  const GL = GROUND_LAMPS.gas, uLampWarm = { value: new THREE.Color(GL.colour[0], GL.colour[1], GL.colour[2]).multiplyScalar(TREE.lamp.level) };
  await ctx.yield();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTreeTime, uNight: U.uNight, uNightFill: U.uNightFill, uWarm: U.uWarm, uStreetGlow: U.uStreetGlow, uLeafFill, uLampNight, uLampWarm });
    // (aLamp: the way on the ground to the tree's nearest warm lamp, that lamp's share of light here, its threshold of night)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSway, aLow; attribute vec4 aLamp; uniform float uTreeTime, uLampNight; varying float vLampK;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float treePhase = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .23;
          transformed.x += aSway * (.22 * sin(uTreeTime * 1.1 + treePhase) + .07 * sin(uTreeTime * 2.7 + treePhase * 1.7));
          transformed.z += aSway * (.18 * sin(uTreeTime * .9 + treePhase * 1.3) + .07 * sin(uTreeTime * 2.3 + treePhase * 2.1));
          vec3 treeN = normalize(mat3(instanceMatrix) * objectNormal);
          vLampK = aLamp.z * aLow * (.15 + .7 * max(dot(treeN.xz, aLamp.xy), 0.) + .6 * max(-treeN.y, 0.)) * smoothstep(0., ${GROUND_LAMPS.front.toFixed(4)}, uLampNight - aLamp.w);
        #else
          vLampK = 0.;
        #endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uNightFill, uWarm, uLeafFill, uLampWarm; uniform float uNight, uStreetGlow; varying float vLampK;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * ((uNightFill + uWarm * (uStreetGlow * .4)) * smoothstep(.12, .7, uNight) + uLeafFill) + uLampWarm * (vLampK * mix(dot(diffuseColor.rgb, vec3(.333)), diffuseColor.g, .4));');
  };
  const count = places.length, mesh = new THREE.InstancedMesh(T.geometry, material, count), m = new THREE.Matrix4(), q = new THREE.Quaternion(), tone = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let n = 0; n < count; n++) {
    const [x, z, size] = places[n], s = size * (TREE.size[0] + TREE.size[1] * hash01(n, 51));   // each tree's size, turn and tone from its own number
    q.setFromAxisAngle(up, hash01(n, 52) * Math.PI * 2);
    mesh.setMatrixAt(n, m.compose(p.set(x, FRAME.groundY, z), q, sc.set(s * (0.86 + 0.26 * hash01(n, 53)), s * (0.9 + 0.22 * hash01(n, 57)), s * (0.86 + 0.26 * hash01(n, 54)))));
    const t = 0.8 + 0.4 * hash01(n, 55); mesh.setColorAt(n, tone.setRGB(t, t * (0.95 + 0.1 * hash01(n, 56)), t));
    if (n % 128 === 127) await ctx.yield();
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
  mesh.name = 'trees';
  const lampAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
  T.geometry.setAttribute('aLamp', lampAttr);
  scene.add(mesh);
  await ctx.yield();
  // the lamps' light on the crowns, dealt once the ground's lamps are known: to each tree the gas lamp on a post or
  // a bracket that lights it most (nearest first, falling to nothing at TREE.lamp.reach)
  const light = (lamps) => {
    const near = lamps.filter((l) => l.kind === 0 && l.pool && !l.globe), R = TREE.lamp.reach;
    for (let n = 0; n < count; n++) {
      const [x, z] = places[n]; let best = 0, bq = null;
      for (const l of near) { const d = Math.hypot(l.p[0] - x, l.p[2] - z); if (d < R) { const k = (1 - d / R) ** 1.2; if (k > best) { best = k; bq = l; } } }
      if (!bq) continue;
      const dx = bq.p[0] - x, dz = bq.p[2] - z, d = Math.hypot(dx, dz) || 1;
      lampAttr.setXYZW(n, dx / d, dz / d, best, bq.threshold);
    }
    lampAttr.needsUpdate = true;
  };
  // (dispose: the instances' matrices and tones; the engine's clearing frees the geometry and the material)
  return { count, triangles: count * T.triangles, uTreeTime, uLampNight, light, dispose() { mesh.dispose(); } };
}

// ---- THE LAMPS OF THE GROUND. SOURCED (figures.md C; src-light.md 6): the bridge's ten white arc lamps on their
// standards ("10 sur le pont d'Iena"); THE SMALL WARM ELECTRIC LAMPS round the lawns' edges and the lakes (src-light.md
// 6 "Garden": small incandescent lamps "le long des pelouses autour des bassins", about 3,000; figures.md C
// "Lawn edges": small warm points, steady): they burn STEADY, with no gas flicker, and each built lamp stands for
// a run of the small ones (WORKING: its spacing, its post, its globe); the enclosure's GAS ("1 886 candelabres"),
// which here is the gas under the awning walks' eaves, at the kiosks and in the line of small burners along each
// palace's front, and flickers; the white arc lamps on the palace fronts, along the railway's cut and at
// the four corners of the fountain under the tower (each tagged at its place below). One kind of warm lamp stands
// in the code; the two are told apart by where they stand (the lawns' edges and the lakes' rims are the electric
// ones). INVENTED BY NEED (the sources
// count no lamp outside the enclosure, and give no place for the candelabra within it): the gas on posts along both quays,
// down the avenues beside the grounds and across their far end (a quay and an avenue of the city of 1889 were
// gaslit; unlit, the river's banks and the grounds' sides are black bands at night), and the places of the gas under the awning
// walks' eaves and of the one lamp at each kiosk (a covered walk and a kiosk open at night were lit). Each lamp is one
// small square turned to the eye (a globe in its own halo) and,
// but for the palaces' lines, one soft pool of light laid flat on the ground under it: all in ONE call. WORKING:
// every size, colour, level and spacing here (the sources give the kinds of lamp and where they stood).
// THEY COME ON WITH THE NIGHT NUMBER: each lamp has a threshold dealt at build from its own index; LIT of the gas
// burns already in the dusk (the lamplighters' round is most of the way done at the river), the rest come on one by
// one before the night number reaches `last`, the world's own night number at ROUTE.places.quayTop (where the line
// tops the quay): well before the tower's arches are whole. The arc lamps of the bridge burn from the start. A pure function of night.
// THE GAS FLICKERS and the arcs hum BY THE WORLD'S CLOCK (two slow wavers and a rare dip; two fast faint ones);
// the small electric lamps burn steady.
// LAWFUL READING (order L1), A HOLD BY A PIXEL'S FOOTPRINT: a globe is sized in metres and never drawn under
// minPixels pixels' radius (the metres one pixel covers there, from the lamp's own depth and the projection), its
// light lowered by the same ratio, so a far row of lamps is a calm string of points. It widens and dims; it never
// hides, thins or fades a lamp. CLEAR AIR (order L5): no lamp, post or pool stands within CLEAR metres of the flown
// line (counted from the route's own curve at build) or in the empty lane on the axis.
const GROUND_LAMPS = {
  gas: { colour: [1.0, 0.66, 0.30], level: 3.4, globe: 0.26, pool: 7, poolLevel: 0.4, post: 3.6 },
  small: { level: 2.2, globe: 0.16 },                    // the palaces' lines of burners: smaller, no pool
  arc: { colour: [0.72, 0.85, 1.0], level: 6.5, globe: 0.32, bridge: 0.19, pool: 14, poolLevel: 0.5, mast: 16 },
  halo: 8, haloSigma: 2.4, haloK: 0.1, minPixels: 0.9,  // a globe's halo: its reach and breadth in globe radii, its strength beside the globe; the pixel hold
  lit: 0.6, front: 0.006,                                // the share of the gas lit in the dusk; a lamp's soft coming on, in night number
  clear: 8, step: { quay: 26, avenue: 26, lawn: 13, lake: 12, palace: 6, cut: 50 },
  glint: { out: 7, radius: 7, level: 1.5 },              // a quay lamp's glint on the water under its wall: metres out from the wall, its radius, its level beside a pool's
  cut: { mast: 7.5, pool: 9, poolK: 0.3 },               // the railway cut's arc lamps: a mast's height from the trench's floor, its pool's radius on that floor and its share of an arc pool's level (a dim floor)
  fountain: { out: 15, mast: 8, pool: 8 },               // the four arc lamps at the tower fountain's corners: metres from its middle, the mast, the pool
};
const AXIS_LANE = { half: 11, z0: 42, z1: 143 };          // the empty lane on the axis as the garden's plan above gives it (order section 4)
const GLAMP_VERT = /* glsl */`
attribute vec3 iPos;                     // the lamp's place, or its pool's middle on the ground
attribute vec4 iPar;                     // its threshold of night, a number of its own (-1: a steady electric lamp), its kind, its radius in metres
attribute vec3 iCol;
uniform float uNight, uTime;
uniform vec2 uPx;                        // x: the drawing buffer's height in pixels
varying vec3 vQ; varying vec3 vCol;      // vQ.z: 1 for a pool
void main() {
  float n = iPar.y, kind = iPar.z, pool = step(1.5, kind), arc = step(.5, kind) * (1. - pool) + step(2.5, kind);
  float lit = smoothstep(0., ${GROUND_LAMPS.front.toFixed(4)}, uNight - iPar.x);
  // gas: two slow wavers at the lamp's own rates and a rare short dip; an arc: steady, with a faint quick hum
  float turn = fract(uTime / (9. + 8. * fract(n * 13.7)) + n * 5.3);
  float gas = (1. + .07 * sin(uTime * (1.9 + 2.3 * n) + n * 97.) + .045 * sin(uTime * (4.1 + 3.7 * fract(n * 7.31)) + n * 41.))
    * (1. - .3 * smoothstep(0., .015, turn) * (1. - smoothstep(.02, .05, turn)));
  float hum = 1. + .03 * sin(uTime * (38. + 9. * n) + n * 61.) + .02 * sin(uTime * (61. + 13. * fract(n * 5.3)) + n * 17.);
  float k = lit * mix(mix(gas, hum, arc), 1., step(n, -.5)), show = step(1e-4, lit);   // a steady lamp neither flickers nor hums; an unlit lamp draws nothing
  vec4 mv;
  if (pool > .5) {
    mv = modelViewMatrix * vec4(iPos + vec3(position.x, 0., -position.y) * (iPar.w * show), 1.);   // laid flat, face up
    vCol = iCol * k; vQ = vec3(position.xy, 1.);
  } else {
    mv = modelViewMatrix * vec4(iPos, 1.);
    float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
    float drawn = max(iPar.w, ${GROUND_LAMPS.minPixels.toFixed(2)} * mPerPx);
    vCol = iCol * (k * iPar.w / drawn); vQ = vec3(position.xy * ${GROUND_LAMPS.halo.toFixed(1)}, 0.);
    mv.xy += position.xy * (${GROUND_LAMPS.halo.toFixed(1)} * drawn * show);
  }
  gl_Position = projectionMatrix * mv;
}`;
const GLAMP_FRAG = /* glsl */`
varying vec3 vQ; varying vec3 vCol;
void main() {
  float r = length(vQ.xy), a;
  if (vQ.z > .5) { float f = max(1. - r * r, 0.); a = f * f; }   // a pool: brightest under the lamp, out to nothing at its rim
  else a = (1. - smoothstep(.5, 1.2, r)) + ${GROUND_LAMPS.haloK.toFixed(3)} * max(exp(-r * r / ${(2 * GROUND_LAMPS.haloSigma ** 2).toFixed(2)}) - ${Math.exp(-(GROUND_LAMPS.halo ** 2) / (2 * GROUND_LAMPS.haloSigma ** 2)).toFixed(4)}, 0.);
  gl_FragColor = vec4(vCol * a, 1.);
}`;
// the points every `step` metres (as many as stand evenly) round a rounded rectangle given by its middle, half sizes
// and corner radius, `out` metres outside it: each [x, z]
function roundLoop(cx, cz, hx, hz, r, out, step) {
  const line = [], R = r + out, ax = hx - r, az = hz - r, pts = [];
  for (let c = 0; c < 4; c++) {
    const sx = c === 0 || c === 3 ? 1 : -1, sz = c < 2 ? 1 : -1;
    for (let k = 0; k <= 6; k++) { const a = (c + k / 6) * Math.PI / 2; line.push([cx + sx * ax + R * Math.cos(a), cz + sz * az + R * Math.sin(a)]); }
  }
  line.push(line[0]);
  const acc = [0];
  for (let i = 0; i + 1 < line.length; i++) acc.push(acc[i] + Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1]));
  const len = acc[acc.length - 1], n = Math.max(4, Math.round(len / step));
  for (let k = 0, i = 0; k < n; k++) {
    const d = (k + 0.5) * len / n;
    while (acc[i + 1] < d) i++;
    const f = (d - acc[i]) / (acc[i + 1] - acc[i]);
    pts.push([line[i][0] + (line[i + 1][0] - line[i][0]) * f, line[i][1] + (line[i + 1][1] - line[i][1]) * f]);
  }
  return pts;
}

// WHERE THE GROUND'S LAMPS STAND. Each: { p: the light's place, kind: 0 gas, 1 arc, 2 a palace's small burner,
// pool: [x, y, z, radius] or null, post: [x, y, z, height, breadth] or null, steady: true for a small electric
// lamp of the lawns and lakes (a warm lamp as the gas is, without its flicker) }; a quay's lamp also carries its bank
// (quay: 1 the tower's, -1 the far one) and its metres along from the bridge. The bridge's ten are the places of its
// standards. WORKING: the rows are a likeness of the plan's (figures.md C names the kinds and where they burned).
function groundLampPlaces(bridgeLamps, hallLamps) {
  const L = GROUND_LAMPS, F = FRAME, G = F.groundY, GD = GARDEN, out = [], POOL_Y = G + 0.14;
  const gas = (x, z, y0 = G, steady = false) => out.push({ p: [x, y0 + L.gas.post + 0.25, z], kind: 0, pool: [x, POOL_Y, z, L.gas.pool], post: [x, y0, z, L.gas.post, 0.16], steady });
  const electric = (x, z) => gas(x, z, G, true);
  // the bridge: each arc lamp's pool lies on the roadway inside the parapets
  // (its globe is drawn at L.arc.bridge: an arc lamp in its glass on a standard, a small hard glare, where the
  // masts' lamps over the gardens are drawn larger)
  for (const [x, y, z] of bridgeLamps) out.push({ p: [x, y, z], kind: 1, pool: [Math.sign(x) * 2.4, BR.deckY + 0.12, z, 4.3], post: null, globe: L.arc.bridge });
  // the quays, both banks, either way from the bridge's mouth: a post just behind the parapet, its pool on the
  // quay behind it (never out over the wall). The STREAK.quay lamps of a bank nearest the bridge are mirrored by
  // the water's streaks; each lamp beyond them throws a soft glint flat on the water under its wall instead
  // (INVENTED BY NEED: the sources give the quays' gas, not its light on the water), so that from above the river
  // is edged its whole length by two chains of lamps and their light on the water.
  for (const bank of [1, -1]) for (const side of [-1, 1]) for (let x = BRIDGE_MOUTH + 14, k = 0; x <= 720; x += L.step.quay, k++) {
    const off = bank * (RIVER_HALF + 1.3), [px, pz] = riverSide(side * x, off), [qx, qz] = riverSide(side * x, off + bank * 3.6);
    const g = k >= STREAK.quay / 2 ? riverSide(side * x, bank * (RIVER_HALF - L.glint.out)) : null;
    out.push({ p: [px, G + L.gas.post + 0.25, pz], kind: 0, pool: [qx, POOL_Y, qz, 4.4], post: [px, G, pz, L.gas.post, 0.16], quay: bank, along: x, glint: g && [g[0], F.waterY + 0.16, g[1], L.glint.radius] });
  }
  // the avenues beside the grounds, a row along each kerb, the two staggered; and the avenue across the far end
  const A0 = GROUNDS_X + 2.5, A1 = GROUNDS_X + AVENUE - 2.5, FZ = F.farAvenue.z;
  for (const sx of [-1, 1]) for (let z = GD.z0 + 8; z <= FZ - 20; z += L.step.avenue) { gas(sx * A0, z); gas(sx * A1, z + L.step.avenue / 2); }
  for (let x = -GROUNDS_X + 13; x <= GROUNDS_X - 13; x += L.step.avenue) { gas(x, FZ - AVENUE / 2 + 2.5); gas(x + L.step.avenue / 2, FZ + AVENUE / 2 - 2.5); }
  // THE SMALL ELECTRIC LAMPS (SOURCED, src-light.md 6 "Garden"; steady): round each lawn's edge, on the gravel
  // just outside its kerb (none where another lawn or the lake's lawn joins it)
  const inLawn = (x, z, skip) => GD.lawns.some((q, i) => i !== skip && Math.abs(x) > q[0] - 1 && Math.abs(x) < q[2] + 1 && z > q[1] - 1 && z < q[3] + 1);
  GD.lawns.slice(0, 5).forEach(([x0, z0, x1, z1], i) => {
    for (const [x, z] of roundLoop((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, GD.lawnRound, GD.kerb + 1.1, L.step.lawn)) {
      if (!inLawn(x, z, i)) { electric(x, z); electric(-x, z); }
    }
  });
  // and round each lake, on its walk just outside the rim
  const LK = F.lakes;
  for (const lx of LK.x) for (const [x, z] of roundLoop(lx, LK.z, LK.sizeX / 2, LK.sizeZ / 2, LK.sizeX * 0.42, GD.lakeRim + 1.6, L.step.lake)) electric(x, z);
  // THE ENCLOSURE'S GAS: under the awning walks' eaves, a lamp on a bracket outside every second post (no post of its own)
  const AW = F.awningWalks;
  for (const wx of AW.x) for (const sx of [-1, 1]) for (let z = AW.z0 + 5.5; z <= AW.z1; z += 22) {
    const x = wx + sx * (GD.walkHalf + 0.4);
    out.push({ p: [x, G + 3.3, z], kind: 0, pool: [x + sx * 1.5, POOL_Y, z, 5], post: null });
  }
  // one gas lamp to each kiosk: on a bracket at its front (a music kiosk's hangs under its roof), no post of its own
  for (const k of kioskPlaces()) out.push({ p: k.lamp, kind: 0, pool: [k.pool[0], POOL_Y + (k.kind === 'music' ? KIOSKS.music.floor : 0), k.pool[1], k.pool[2]], post: null });
  // the halls' small burners (the lines along the palaces' garden fronts, the dotted line that picks out the
  // central dome): each at the place the halls give, the dome's with a larger globe of their own
  const PL = F.palaces;
  for (const [x, y, z, globe] of hallLamps) out.push({ p: [x, y, z], kind: 2, pool: null, post: null, globe });
  // THE ARC LAMPS ON THE PALACE FRONTS. SOURCED: "arcs on the palace fronts" (src-light.md 6 "Garden"). WORKING:
  // their number, masts and places: four on masts close against each palace's garden front, clear of its
  // entrance, and one either side of the walk before the central dome's front at the court's far end; a palace
  // front's lamp throws its pool on the walk before it. (No arc lamp stands out among the lawns: the sources give
  // none there.)
  const masts = [-95, -45, 45, 95].map((dz) => [PL.xNear - 0.9, PL.dome.z + dz, -6]);
  masts.push([GD.lawns[4][0] + 9, GD.lawns[4][3] + 10, 0]);
  for (const [x, z, dx] of masts) for (const sx of [-1, 1]) out.push({ p: [sx * x, G + L.arc.mast + 0.4, z], kind: 1, pool: [sx * (x + dx), POOL_Y, z, L.arc.pool], post: [sx * x, G, z, L.arc.mast, 0.34] });
  // the river's far reaches (FAR_RIVER): the far quays' gas and the far bridges' rows, each bridge lamp with its
  // glint on the water; no posts (the nearest stand some 400 m from the flown line and are never seen as more than a point)
  for (const [x, y, z, globe, glint] of farRiverLamps()) out.push({ p: [x, y, z], kind: 0, pool: glint, post: null, globe });
  // THE RAILWAY CUT'S ARC LAMPS. SOURCED: arc lamps "le long du chemin de fer" (src-light.md 6 "Quay and bridges":
  // 31 along the whole line). WORKING: one every step.cut metres on a mast against the trench's garden wall, its
  // pool on the trench's floor under the track.
  for (const side of [-1, 1]) for (let x = CUT_MOUTH + 20; x <= CUT_END - 15; x += L.step.cut) {
    const [px, pz] = riverSide(side * x, CUT_OFF1 - 0.5), [qx, qz] = riverSide(side * x, TRAIN.off), y0 = G - RC.depth;
    out.push({ p: [px, y0 + L.cut.mast + 0.4, pz], kind: 1, pool: [qx, y0 + 0.14, qz, L.cut.pool], poolK: L.cut.poolK, post: [px, y0, pz, L.cut.mast, 0.2] });
  }
  // THE FOUR ARC LAMPS AT THE TOWER FOUNTAIN'S CORNERS. SOURCED: "4 regulateurs de 25 amperes ... aux angles de la
  // fontaine ... au-dessous de la Tour" (src-light.md 6 "Garden"). WORKING: their distance out, their masts.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = F.fountain.x + sx * L.fountain.out * Math.SQRT1_2, z = F.fountain.z + sz * L.fountain.out * Math.SQRT1_2;
    out.push({ p: [x, G + L.fountain.mast + 0.4, z], kind: 1, pool: [x, POOL_Y, z, L.fountain.pool], post: [x, G, z, L.fountain.mast, 0.26] });
  }
  // CLEAR AIR and the empty lane: a lamp is left out when its light, its post's foot or its pool lies within CLEAR
  // metres of the flown line where the line is low (the curve's own points, two metres apart), or in the axis lane
  const C = ROUTE.curve, low = [], near2 = (L.clear + 1) ** 2;
  for (let i = 0; i < C.count; i += 4) if (C.y[i] < L.arc.mast + L.clear + 12) low.push(C.x[i], C.y[i], C.z[i]);
  const clear = (x, y, z) => { for (let i = 0; i < low.length; i += 3) if ((low[i] - x) ** 2 + (low[i + 1] - y) ** 2 + (low[i + 2] - z) ** 2 < near2) return false; return true; };
  const lane = (x, z) => Math.abs(x) < AXIS_LANE.half && z > AXIS_LANE.z0 && z < AXIS_LANE.z1;
  return out.filter((q) => clear(q.p[0], q.p[1], q.p[2]) && !lane(q.p[0], q.p[2]) && !(q.post && inTerminus(q.p[0], q.p[2])) && (!q.pool || clear(q.pool[0], q.pool[1], q.pool[2])) && (!q.glint || clear(q.glint[0], q.glint[1], q.glint[2])) && (!q.post || clear(q.post[0], q.post[1], q.post[2])));
}

// a square of two triangles, corners at -1 and 1, for a mesh of instances
function unitSquare() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1));
  return g;
}
// light added to the picture behind it: no depth written, hidden by what stands in front
function lightMaterial(uniforms, vertexShader, fragmentShader, more = {}) {
  return new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, ...more });
}

// THE GROUND'S LAMPS DRAWN: the pools and the lights as instances of one square in one call, the posts and masts as
// one dark mesh on the kit's material. Each lamp's threshold of night and its own number come from its index (the
// bridge's arcs burn from the start, the masts' come on in the first half of the gas's span). uPx is the tower's
// own uniform of the drawing buffer's height; last is the night number by which every lamp burns whole (so the
// latest threshold dealt stands a lamp's soft coming on before it). Returns the
// uniforms, and every lamp with its threshold.
async function buildGroundLamps(ctx, scene, mats, bridgeLamps, hallLamps, uPx, last) {
  const L = GROUND_LAMPS, pos = [], par = [], col = [], tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k], whole = Math.max(0, last - L.front);
  const lamps = groundLampPlaces(bridgeLamps, hallLamps).map((q, i) => ({ ...q, n: hash01(i, 73),
    threshold: q.kind === 1 ? (q.post ? whole * 0.5 * hash01(i, 72) : -1) : hash01(i, 71) < L.lit ? -1 : whole * hash01(i, 72) }));
  await ctx.yield();
  for (const q of lamps) if (q.pool) {
    const a = q.kind === 1 ? L.arc : L.gas;
    pos.push(q.pool[0], q.pool[1], q.pool[2]); par.push(q.threshold, q.steady ? -1 : q.n, q.kind === 1 ? 3 : 2, q.pool[3]); col.push(...tint(a.colour, a.poolLevel * (q.poolK ?? 1)));
  }
  // a quay lamp's glint: a pool of its gas laid flat on the river
  for (const q of lamps) if (q.glint) { pos.push(q.glint[0], q.glint[1], q.glint[2]); par.push(q.threshold, q.n, 2, q.glint[3]); col.push(...tint(L.gas.colour, L.gas.poolLevel * L.glint.level)); }
  for (const q of lamps) {
    const a = q.kind === 1 ? L.arc : L.gas, s = q.kind === 2 ? L.small : a;
    pos.push(q.p[0], q.p[1], q.p[2]); par.push(q.threshold, q.steady ? -1 : q.n, q.kind === 1 ? 1 : 0, q.globe || s.globe); col.push(...tint(a.colour, q.globe ? a.level : s.level));
  }
  const g = unitSquare();
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(par), 4));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(col), 3));
  g.instanceCount = par.length / 4;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, (FRAME.farAvenue.z + FRAME.river.z0) / 2), FAR_RIVER.quay.to + 700);   // the grounds' lamps and the river's far reaches
  const uniforms = { uNight: { value: 0 }, uTime: { value: 0 }, uPx };
  const material = lightMaterial(uniforms, GLAMP_VERT, GLAMP_FRAG, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'ground-lamps'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 3;
  scene.add(mesh);
  await ctx.yield();
  // the posts and the masts: plain dark iron, four sides each
  const b = new S.Builder(4096);
  b.col(S.lin('#23262c'), 0.8, 1.1).surf(S.SURF.PLAIN);
  let posts = 0;
  for (const q of lamps) if (q.post) {
    b.cbox(q.post[0], q.post[1], q.post[2], q.post[4], q.post[3], q.post[4], { top: false });
    if (++posts % 256 === 0) await ctx.yield();
  }
  const postMesh = new THREE.Mesh(b.toGeometry(), mats.facade); postMesh.name = 'lamp-posts';
  scene.add(postMesh);
  await ctx.yield();
  return { uniforms, lamps, posts, triangles: g.instanceCount * 2 + b.triangles, dispose() { g.dispose(); material.dispose(); } };
}

// ---- THE WATER'S STREAKS: the lamps' light on the river. One flat strip of quads lies just over the kit's river
// along its bent line, and adds to it, pixel by pixel, the light the rippled water throws back from each of STREAK.n
// lights: the bridge's ten arcs, the quays' lamps nearest the bridge on both banks, the tower's four lit arches and
// the far fireworks. LAWFUL READINGS (order L1): A SHADING BY THE DIRECTION FROM THE WATER TO THE EYE: a point of
// water shows a lamp when the slope the water would need there to mirror that lamp to the eye is one the ripples
// have, so each lamp's light draws out into a long streak on the line from under the lamp toward the eye, as on real
// water (the strip itself never moves); and A FILTER BY A PIXEL'S FOOTPRINT (each train by the pixel's footprint
// along its own run, from the derivatives of the place): ripples smaller than a pixel go into the breadth of the
// slopes instead of being drawn. THE STREAKS TREMBLE BY THE WORLD'S CLOCK: three trains of ripples run up and
// down the stream, their crests across it, pure functions of place and time. A lamp's streak is lit by the lamp's own
// threshold of night. INVENTED BY NEED (the sources give the lamps, not their light on the water: a lit lamp
// over black water that gave nothing back would read as a fault). WORKING: the slopes' breadth, the ripples, the
// reach and every level.
const STREAK = {
  n: 64, quay: 24,                                       // lights in all; the quays' lamps taken on each bank, nearest the bridge first
  sigma: 0.03, ripple: 0.11,                             // the breadth of the water's fine slopes; the height of each ripple train's slope (well over
                                                         // that breadth: a lamp's light is broken into dashes, one to each crest that can mirror it)
  along: 0.96,                                           // the share of the ripples' slopes that lies along the stream (their crests lie across it)
  arc: 90, gas: 60, tower: 150, fire: 700,               // metres from a light at which its streak has fallen to half
  arcK: 0.45, gasK: 1.1, towerK: 2.2, fireK: 3,           // the streaks' strengths beside the lamps' own colours
  // THE LOW SKY CARRIED ON THE WATER (the same reading by the direction to the eye): each ripple's face mirrors the
  // sky's low band, the horizon's own tone all round (rim) and the afterglow's rose toward its bearing (glow); `band`
  // is how fast that light falls as the mirrored ray climbs from the horizon, `facet` the ripples' share in tilting it
  rim: 0.42, glow: 0.5, band: 4, facet: 0.55,
  down: 0.45,                                            // the share of a streak the water still gives an eye that looks straight down on it
  lift: 0.08,                                            // the strip lies this far over the river's surface
};
// THE RIVER'S RIPPLES, as the strip's shader and the boats' streaks share them: three trains by place and clock,
// running up and down the stream (the wind in the river's trench and the hulls drive them so), their crests across
// it: a lamp seen along the river is mirrored in a narrow column of short level dashes, one to each crest that can
// mirror it. Each train's crests bend (its phase wanders across its own run) and are SHORT: along its crests a
// train swells and sinks in groups a few metres long (e1 to e3, each group's place wandering with the run), as wind
// ripples do, so that no crest runs on as a ruled line; the two short trains never die wholly and the longest runs
// lower, so that close under the eye a lamp's image stays a column of small dashes and no broad smear. Returns the slope the ripples have at the place; a train
// finer than the pixel's footprint along its own run is not drawn: the spread of its slopes goes into s2 (the
// slopes' spread along the stream and across it) instead (A FILTER BY A PIXEL'S FOOTPRINT).
const RIPPLE_GLSL = /* glsl */`
vec2 riverRipples(vec2 p, vec2 gx, vec2 gy, float t, out vec2 s2) {   // (gx, gy: the place's change to the next pixel across and down)
  vec2 d1 = vec2(.978, .208), d2 = vec2(-.966, .259), d3 = vec2(.993, -.122);
  float a1 = dot(p, d1), a2 = dot(p, d2), a3 = dot(p, d3), c1 = dot(p, vec2(-d1.y, d1.x)), c2 = dot(p, vec2(-d2.y, d2.x)), c3 = dot(p, vec2(-d3.y, d3.x));
  float b1 = .9 * sin(c1 * .71 + t * .5) + .7 * sin(c1 * .29 + a1 * .17), b2 = 1. * sin(c2 * .43 - t * .4 + 2.) + .8 * sin(c2 * .19 - a2 * .13), b3 = 1.1 * sin(c3 * .23 + t * .3 + 4.) + .9 * sin(c3 * .11 + a3 * .07);
  float e1 = .62 + .38 * sin(c1 * 2.1 + 2.1 * sin(a1 * .9 + t * .23)), e2 = .62 + .38 * sin(c2 * 1.3 + 2.3 * sin(a2 * .5 - t * .19) + 1.), e3 = .5 + .5 * sin(c3 * .8 + 2.5 * sin(a3 * .27 + t * .13) + 3.);
  float k1 = 1. - smoothstep(.15, .55, abs(dot(d1, gx)) + abs(dot(d1, gy))), k2 = 1. - smoothstep(.3, 1.1, abs(dot(d2, gx)) + abs(dot(d2, gy))), k3 = 1. - smoothstep(.6, 2.1, abs(dot(d3, gx)) + abs(dot(d3, gy)));
  float lost = ${(STREAK.ripple ** 2 / 2).toFixed(6)} * (2.36 - k1 - k2 - .36 * k3);
  s2 = vec2(${(STREAK.sigma ** 2).toFixed(6)} + ${STREAK.along.toFixed(2)} * lost, ${(STREAK.sigma ** 2).toFixed(6)} + ${(1 - STREAK.along).toFixed(2)} * lost);
  return ${STREAK.ripple.toFixed(3)} * (d1 * (1.47 * k1 * e1 * sin(a1 * 12. + t * 6.2 + b1)) + d2 * (1.47 * k2 * e2 * sin(a2 * 6.3 - t * 4.4 + 1.7 + b2)) + d3 * (.98 * k3 * e3 * sin(a3 * 3.3 + t * 3.2 + 4.1 + b3)));   // (1.47: a group's swell keeps a train's mean slope; the longest train runs at six tenths of the others')
}`;
const STREAK_VERT = /* glsl */`
varying vec3 vW;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const STREAK_FRAG = /* glsl */`
uniform vec4 uLampP[${STREAK.n}];        // a light's place, its threshold of night
uniform vec4 uLampC[${STREAK.n}];        // its colour and strength, the reach of its streak
uniform float uNight, uTime;
uniform vec3 uRim, uGlow;                // the horizon's tone and the afterglow's, as the hour has them
uniform vec2 uGlowDir;                   // the afterglow's bearing on the ground
varying vec3 vW;
${RIPPLE_GLSL}
void main() {
  vec3 V = normalize(cameraPosition - vW);
  // the ripples' slope here, and the spread of the slopes a pixel no longer shows (along the stream, across it)
  vec2 s2, rip = riverRipples(vW.xz, dFdx(vW.xz), dFdy(vW.xz), uTime, s2);
  float gain = ${(STREAK.sigma ** 2).toFixed(6)} / sqrt(s2.x * s2.y), graze = ${STREAK.down.toFixed(2)} + ${(1 - STREAK.down).toFixed(2)} * pow(1. - clamp(V.y, 0., 1.), 3.);
  vec3 col = vec3(0.);
  for (int i = 0; i < ${STREAK.n}; i++) {
    vec3 L = uLampP[i].xyz - vW; float d = length(L);
    vec3 H = normalize(V + L / d);
    vec2 s = H.xz / max(H.y, .04) - rip;
    float lit = smoothstep(0., ${GROUND_LAMPS.front.toFixed(4)}, uNight - uLampP[i].w), r = uLampC[i].w;
    col += uLampC[i].rgb * (lit * exp(-.5 * (s.x * s.x / s2.x + s.y * s.y / s2.y)) * r * r / (r * r + d * d));
  }
  // the low sky on the ripples: the eye's ray mirrored in a ripple's face; the nearer the horizon it leaves, the brighter
  vec3 N = normalize(vec3(-rip.x, ${(1 / STREAK.facet).toFixed(3)}, -rip.y)), R = reflect(-V, N);
  float toGlow = max(dot(normalize(R.xz + 1e-5), uGlowDir), 0.), g1 = 1. - clamp(V.y, 0., 1.);
  vec3 low = (uRim + uGlow * (toGlow * toGlow)) * (exp(-abs(R.y) * ${STREAK.band.toFixed(1)}) * g1 * g1 * g1);
  gl_FragColor = vec4(col * (gain * graze) + low, 1.);
}`;
// the strip and its material; lights: [{ p: [x, y, z], colour: [r, g, b], reach, threshold }], as many as STREAK.n
// (the rest burn black). Returns the uniforms; a light's colour may be written again by the update.
function buildWaterStreaks(scene, lights) {
  const P = [], I = [], y = FRAME.waterY + STREAK.lift, xs = RIVER_XS.filter((x) => Math.abs(x) <= 1500);
  xs.forEach((x, i) => {
    const a = riverSide(x, BANK_FAR + 0.3), b = riverSide(x, BANK_LOW - 0.3);
    P.push(a[0], y, a[1], b[0], y, b[1]);
    if (i) { const k = 2 * i; I.push(k - 2, k, k - 1, k - 1, k, k + 1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeBoundingSphere();
  const lampP = [], lampC = [];
  for (let i = 0; i < STREAK.n; i++) {
    const q = lights[i];
    lampP.push(q ? new THREE.Vector4(q.p[0], q.p[1], q.p[2], q.threshold) : new THREE.Vector4(0, 50, 0, 9));
    lampC.push(q ? new THREE.Vector4(q.colour[0], q.colour[1], q.colour[2], q.reach) : new THREE.Vector4(0, 0, 0, 1));
  }
  const uniforms = { uLampP: { value: lampP }, uLampC: { value: lampC }, uNight: { value: 0 }, uTime: { value: 0 },
    uRim: { value: new THREE.Color(0, 0, 0) }, uGlow: { value: new THREE.Color(0, 0, 0) }, uGlowDir: { value: new THREE.Vector2(FRAME.afterglow.x, FRAME.afterglow.z) } };
  const material = lightMaterial(uniforms, STREAK_VERT, STREAK_FRAG, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'water-streaks'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 1;
  scene.add(mesh);
  return { uniforms, lampC, triangles: I.length / 3, dispose() { g.dispose(); material.dispose(); } };
}

// ---- THE FAR FIREWORKS. SOURCED, each set at a site the sources name (src-light.md 4, Le Genie civil t. XV on
// the night of 6 May: fireworks "sur le terre-plein du Pont-Neuf, sur la terrasse des Tuileries et sur l'ile des
// Cygnes"; Le Temps: "A 10 heures... a l'ile des Cygnes"; figures.md C: tricolour bursts, none from the tower).
// The three sites are those of the evening of 6 May; the lifts, the public on the decks and the Bengal fire are of
// later evenings of that summer: this evening is put together from several.
// EACH SET STANDS AT ITS SITE'S BEARING AND DISTANCE FROM THE TOWER, laid into the frame by the frame's own
// compass (+X lies at bearing 44, +Z at bearing 134: x = distance cos(bearing - 44), z = distance sin(bearing - 44)),
// whatever any place on the route then shows of it:
//   the isle (the long isle in the river below the iron footbridge), its middle: bearing 232, 980 m: x -970, z -136;
//   the terrace (the garden terrace above the river, up the river on its far bank): bearing 79, 2,390 m: x 1,958, z 1,371;
//   the point (the terre-plein du Pont-Neuf, the paved point of the island, further up the river): bearing 92, 3,400 m: x 2,275, z 2,527.
// The three sites are PLACED BY MEMORY OF THE MAP, CHECKED BY THE AUDIT'S OWN ARITHMETIC, as figures.md B's far city
// is (the same reckoning gives the footbridge and the great dome at figures.md's own places). This world's river
// beyond the two next bridges is INVENTED BY NEED, a straight WORKING line that drifts from the true one, so the
// isle's true place lies some 50 m behind the far quay here and its bursts open over built land; the other two
// stand far from the built river: each stands where the compass puts it all the same.
// NOT BUILT: the long isle itself, below the footbridge (the isle's set bursts over its true place with no isle
// under it); the bursts "from all over Paris" of 14 July (src-light.md 4): no site is given for them.
// THE TRICOLOUR ALONE (figures.md C; "pluies tricolores", src-light.md 4): every shell is red, white or blue, and a
// spark keeps its shell's colour from the burst's opening to its fall.
// DRAWN AS THE WORLD'S OWN (FIRE_VERT, FIRE_FRAG): every spark and every rocket is one small square of light, the
// isle's set one mesh, the two sets up the river a second on the same material (two calls at the most): this
// file's own shader, not the kit's.
// EVERY SPARK'S PLACE IS A PURE FUNCTION OF THE WORLD'S CLOCK and of its shell's own round. A set has `shells`
// places in time, evenly apart over one `period`; a shell's round is the whole number of periods the clock has run
// at its place in time. From the shell's index and its round alone (a hash of the two: no seed is read, nothing is
// kept) are dealt its heart's place in the set's box (now low, now high), how wide it opens, its colour, whether
// its inner sparks are of another of the three, and its moment within the round. In a round a rocket's spark, of
// its shell's own colour and dimmer, first climbs from the ground to the heart, slowing (`rise` seconds); then the shell opens: its sparks fly out
// from the heart on every side against the air's drag to a full round ball, hang, and fall, each drawing a short
// trail behind it along its own flight, and go out one by one (`life` seconds at the longest), flickering as they
// die. With `shells` evenly apart, life / period of them are in the air at any clock (the isle's: five or six
// burning, the last of them dying, so three to five tell), now here, now there in the box, some over one another.
// WHEN THEY BURN, BY METRES FLOWN (each set's light is one number between two places of the route): the terrace's
// and the point's come up from helixGarden to helixDownstream and burn to the end over the river's upper reach,
// where they stand; no look of the route turns toward them, so no planned picture holds them. THE ISLE'S IS
// KEPT DARK WHILE IT STANDS BEHIND THE TOWER: from the helix's top the isle lies straight behind the lantern, and
// the source gives no firework from the tower, so none may stand beside the iron as if fired from it. Its light
// comes up from THE FIRST PLACE PAST helixTop FROM WHICH THE SET STANDS CLEAR OF THE TOWER, found at build from the
// route's own curve: the place from which the nearest corner of the set's box, grown by its widest shell, lies
// `clear[0]` degrees and more to one side of the tower's axis in plan (some 150 m past helixTop); it is whole at
// the first place from which that corner lies `clear[1]` degrees clear (found likewise, some 50 m further on),
// burns whole through the fly-out and the come-about, and falls
// from comeAboutEnd to axisWholeTo (on the axis run the isle lies 45 degrees and more to the side of the tower
// the line flies at).
// The isle's set throws a glint on the river's water, of its burning shells' own colours (`streak`); the other two
// are too far from it.
// CLEAR AIR (order L5): each set's whole box, grown by its widest shell, its sparks' fall and its rockets' climb,
// lies over 300 m from the flown line (the nearest set's is some 500 m off).
// LAWFUL READINGS (order L1): a spark is A SQUARE TURNED TO THE EYE, drawn out along its own flight as the eye sees
// it (a turning only); it is sized in metres and HELD BY A PIXEL'S FOOTPRINT: never drawn under `minPixels` pixels'
// radius (the metres one pixel covers at the spark's own depth by the projection), its light lowered by the same
// ratio. It widens and dims; no spark is hidden, thinned or faded by how far off the eye is.
// WORKING (the sources give the sites, the hour and the colours, not a shell's size or flight): the shells' breadth
// (136 to 200 m at their widest at the isle), the boxes' sizes and heights, the rates, the sparks' numbers, flight,
// size and strengths, the point's lower level (it stands deepest in the night's air).
const FIREWORKS = {
  colours: [[1.0, 0.045, 0.02], [1.0, 0.88, 0.7], [0.035, 0.13, 1.0]],   // the tricolour alone (figures.md C): a deep red, white, blue, in linear light
  gains: [2.0, 0.6, 1.9],                                // each colour's own strength (the white tells most, the blue least against a navy sky)
  level: 1.3,
  rocketK: 0.4,                                          // the climbing spark's strength beside a burst spark's of its shell's own colour
  sets: [
    // (bearing, distance: the site's, from the tower; y, area: the box's middle height and its sizes; radius: a shell's
    // least and greatest; open: the two places of the route between which the light comes up, or 'clear': where the
    // set stands clear of the tower; close: the two places between which it falls)
    { name: 'isle', bearing: 232, distance: 980, open: 'clear', close: ['comeAboutEnd', 'axisWholeTo'], y: 200, area: [360, 200, 200], shells: 10, sparks: 200, period: 6.3, radius: [68, 100], level: 1 },
    { name: 'terrace', bearing: 79, distance: 2390, open: ['helixGarden', 'helixDownstream'], y: 230, area: [300, 130, 300], shells: 5, sparks: 84, period: 6.9, radius: [75, 120], level: 1, streak: false },
    { name: 'point', bearing: 92, distance: 3400, open: ['helixGarden', 'helixDownstream'], y: 250, area: [160, 120, 160], shells: 5, sparks: 84, period: 6.5, radius: [85, 130], level: 0.9, streak: false },
  ],
  rise: 1.5, life: 3.9, wait: 0.8,                       // seconds: a rocket's climb, a spark's longest life, the most a shell's moment is put off within its round
  drag: 1.7, fall: 19,                                   // a spark's flight: the air's drag (1/s) and the speed its fall comes to (m/s)
  trail: [0.25, 0.8], tail: 0.1,                         // a trail's length in seconds of flight at the burst and at the end; its tail's light beside its head's
  inner: [0.28, 0.52], two: 0.45,                        // the share of a shell's sparks in its inner ball and that ball's size; the share of shells whose inner ball is of one colour with the outer
  spark: 2.4, minPixels: 1.1, ground: 4,                 // a spark's radius in metres (its glare, not its body); the pixel hold; the height the rockets leave from
  clear: [20, 23],                                       // the isle's set: degrees clear of the tower's axis at which it begins to come up, and at which it is whole
  glint: 0.8,                                            // the strength of a burning shell's colour in its glint on the river
};
const FIRE_VERT = /* glsl */`
attribute vec4 iDir;                     // a spark's direction from its shell's heart, and its kind: 0 of the outer ball, 1 of the inner, -1 the rocket
attribute vec4 iShell;                   // its shell's index, the shell's place in time (a share of the period), its set, the spark's own number
uniform float uTime;
uniform vec2 uPx;                        // x: the drawing buffer's height in pixels
uniform vec3 uSetC[3], uSetA[3];         // a set's box: its middle, its sizes
uniform vec4 uSetP[3];                   // its period, its shells' least and greatest radius, its light (the update's)
uniform vec3 uPal[3];
varying vec3 vCol; varying vec3 vQ;      // vQ: along the trail and across it in spark radii, half the trail's length
float deal(float a, float b, float c) { return fract(sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453); }
// a spark's place t seconds after the burst: out from the heart against the drag, and falling ever nearer its last speed
vec3 flown(vec3 heart, vec3 dir, float R, float t) {
  float e = 1. - exp(-${FIREWORKS.drag.toFixed(2)} * t);
  return heart + dir * (R * e) - vec3(0., ${FIREWORKS.fall.toFixed(1)} * (t - e / ${FIREWORKS.drag.toFixed(2)}), 0.);
}
void main() {
  int si = int(iShell.z + .5);
  vec4 P = uSetP[si];
  float cyc = uTime / P.x + iShell.y, turn = floor(cyc), tau = (cyc - turn) * P.x, rnd = mod(turn, 97.);
  float b = iShell.x + 17. * iShell.z, n = iShell.w;
  // dealt from the shell's index and its round: its moment, its heart, its breadth, its colours
  float wait = ${FIREWORKS.wait.toFixed(2)} * fract(rnd * .618034 + b * .381966 + .25), t = tau - wait - ${FIREWORKS.rise.toFixed(2)};
  vec3 heart = uSetC[si] + (vec3(deal(b, rnd, 1.), deal(b, rnd, 2.), deal(b, rnd, 3.)) - .5) * uSetA[si];
  float R = mix(P.y, P.z, deal(b, rnd, 4.));
  float ci = floor(fract(rnd * .754878 + b * .569840 + .1) * 3.), cj = mod(ci + 1. + floor(deal(b, rnd, 5.) * 2.), 3.);
  float inner = step(.5, iDir.w), other = inner * step(${FIREWORKS.two.toFixed(2)}, deal(b, rnd, 6.));
  vec3 head, tail, col; float k, show;
  if (iDir.w < -.5) {
    // the rocket: from the ground under the heart (a little aside) up to it, slowing to a stand
    float s = clamp((tau - wait) / ${FIREWORKS.rise.toFixed(2)}, 0., 1.), s0 = max(s - .16, 0.);
    vec3 foot = vec3(heart.x + (deal(b, rnd, 7.) - .5) * 30., ${FIREWORKS.ground.toFixed(1)}, heart.z + (deal(b, rnd, 8.) - .5) * 30.);
    head = mix(foot, heart, 1. - (1. - s) * (1. - s)); tail = mix(foot, heart, 1. - (1. - s0) * (1. - s0));
    show = step(wait, tau) * step(t, 0.);
    k = ${FIREWORKS.rocketK.toFixed(2)} * (.7 + .3 * sin(uTime * 31. + b * 9.)) * smoothstep(0., .08, s) * (1. - smoothstep(.9, 1., s));
    col = ci < .5 ? uPal[0] : (ci < 1.5 ? uPal[1] : uPal[2]);
  } else {
    float life = ${FIREWORKS.life.toFixed(2)} * (.7 + .3 * n), s = clamp(t / life, 0., 1.), speed = .88 + .12 * fract(n * 7.31);
    float back = max(t - mix(${FIREWORKS.trail[0].toFixed(2)}, ${FIREWORKS.trail[1].toFixed(2)}, s), 0.), r = R * speed * mix(1., ${FIREWORKS.inner[1].toFixed(2)}, inner);
    head = flown(heart, iDir.xyz, r, max(t, 0.)); tail = flown(heart, iDir.xyz, r, back);
    show = step(0., t) * step(t, life);
    // it brightens as the ball opens (while the sparks still lie on one another each gives little, so that the
    // heart keeps its colour and is no white disc), dims slowly, then dies over the last of its life, flickering
    float die = smoothstep(.5, .92, s), open = 1. - exp(-${FIREWORKS.drag.toFixed(2)} * max(t, 0.));
    k = smoothstep(0., .55, open) * (1. - .45 * s) * (1. - smoothstep(.62, 1., s)) * mix(1., .5 + .5 * sin(uTime * (17. + 23. * n) + n * 61.), die);
    col = other > .5 ? (cj < .5 ? uPal[0] : (cj < 1.5 ? uPal[1] : uPal[2])) : (ci < .5 ? uPal[0] : (ci < 1.5 ? uPal[1] : uPal[2]));
  }
  vec4 mh = modelViewMatrix * vec4(head, 1.), mt = modelViewMatrix * vec4(tail, 1.);
  // the hold by a pixel's footprint: the spark's radius is never under minPixels pixels, its light lowered by the same ratio
  float mPerPx = 2. * max(-mh.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
  float w = max(${FIREWORKS.spark.toFixed(2)}, ${FIREWORKS.minPixels.toFixed(2)} * mPerPx);
  // drawn out from the trail's end to the spark, as the eye sees the two
  vec2 d = mh.xy - mt.xy; float len = length(d), hl = .5 * len / w; vec2 ax = len > 1e-3 ? d / len : vec2(1., 0.);
  vec3 mid = .5 * (mh.xyz + mt.xyz);
  mid.xy += ax * (position.x * (hl + 1.) * w) + vec2(-ax.y, ax.x) * (position.y * w);
  vQ = vec3(position.x * (hl + 1.), position.y, hl);
  vCol = col * (k * P.w * ${FIREWORKS.spark.toFixed(2)} / w);
  gl_Position = show * P.w > 1e-4 ? projectionMatrix * vec4(mid, 1.) : vec4(2., 2., 2., 1.);   // a spark not burning draws nothing
}`;
const FIRE_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vQ;
void main() {
  // a round spark at the trail's head, the trail behind it fading to its tail
  float r = length(vec2(max(abs(vQ.x) - vQ.z, 0.), vQ.y)), along = vQ.z > .01 ? clamp((vQ.x + vQ.z) / (2. * vQ.z), 0., 1.) : 1.;
  float a = (1. - smoothstep(.3, 1., r)) * mix(${FIREWORKS.tail.toFixed(2)}, 1., along * along * along);
  gl_FragColor = vec4(vCol * a, 1.);
}`;
// The far fireworks drawn: sets: [{ centre, area, shells, sparks, period, radius, level, far }], uPx the tower's own
// uniform of the drawing buffer's height. A set's sparks are dealt at build from their own indices alone: the outer
// ball's directions evenly over the sphere, the inner ball's likewise, one rocket to a shell. Returns the uniforms
// (uSetP[i].w is set i's light, the update's to write) and each set's shells' places in time.
function buildFireworks(scene, sets, uPx) {
  const F = FIREWORKS, GOLD = Math.PI * (3 - Math.sqrt(5));
  const uniforms = { uTime: { value: 0 }, uPx,
    uSetC: { value: sets.map((f) => new THREE.Vector3(f.centre[0], f.centre[1], f.centre[2])) }, uSetA: { value: sets.map((f) => new THREE.Vector3(f.area[0], f.area[1], f.area[2])) },
    uSetP: { value: sets.map((f) => new THREE.Vector4(f.period, f.radius[0], f.radius[1], 0)) }, uPal: { value: F.colours.map((c, i) => new THREE.Vector3(c[0] * F.gains[i], c[1] * F.gains[i], c[2] * F.gains[i])) } };
  const material = lightMaterial(uniforms, FIRE_VERT, FIRE_FRAG);
  const geometries = [], phases = sets.map((f) => Array.from({ length: f.shells }, (_, k) => (k + 0.5) / f.shells));
  // one mesh for the sets near the river, one for the far ones: each is left out of a picture its sets are not in
  for (const far of [false, true]) {
    const dir = [], shell = [], lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    sets.forEach((f, si) => {
      if (!!f.far !== far) return;
      const inner = Math.round((f.sparks - 1) * F.inner[0]), outer = f.sparks - 1 - inner, reach = f.radius[1] + F.fall * F.life;
      for (let n = 0; n < 3; n++) { lo[n] = Math.min(lo[n], f.centre[n] - f.area[n] / 2 - reach); hi[n] = Math.max(hi[n], f.centre[n] + f.area[n] / 2 + reach); }
      lo[1] = Math.min(lo[1], 0);
      for (let k = 0; k < f.shells; k++) for (let i = 0; i < f.sparks; i++) {
        const own = hash01(k * 977 + i, 211 + si);
        if (i === 0) dir.push(0, 1, 0, -1);
        else {
          // (evenly over the sphere: a spiral of equal steps in height, turned by the golden angle; each shell's is turned about the upright by its own share)
          const core = i > outer, j = core ? i - outer - 1 : i - 1, m = core ? inner : outer, y = 1 - 2 * (j + 0.5) / m, r = Math.sqrt(Math.max(0, 1 - y * y)), a = j * GOLD + hash01(k, 213 + si) * 6.2832;
          dir.push(Math.cos(a) * r, y, Math.sin(a) * r, core ? 1 : 0);
        }
        shell.push(k, phases[si][k], si, own);
      }
    });
    if (!shell.length) continue;
    const g = unitSquare();
    g.setAttribute('iDir', new THREE.InstancedBufferAttribute(new Float32Array(dir), 4)); g.setAttribute('iShell', new THREE.InstancedBufferAttribute(new Float32Array(shell), 4));
    g.instanceCount = shell.length / 4;
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2), Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2);
    const mesh = new THREE.Mesh(g, material); mesh.name = far ? 'fireworks-far' : 'fireworks-isle'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 4;
    scene.add(mesh); geometries.push(g);
  }
  return { uniforms, phases, triangles: geometries.reduce((s, g) => s + g.instanceCount * 2, 0), dispose() { for (const g of geometries) g.dispose(); material.dispose(); } };
}
// the light of a set's burning shells at a clock, by colour, into out [r, g, b] (for its glint on the river): the
// same deal of each shell's moment and colour as the shader's, each shell flaring as it opens and dying over its life
function fireGlint(set, si, phases, time, out) {
  const F = FIREWORKS, fr = (v) => v - Math.floor(v);
  out[0] = out[1] = out[2] = 0;
  for (let k = 0; k < phases.length; k++) {
    const cyc = time / set.period + phases[k], turn = Math.floor(cyc), tau = (cyc - turn) * set.period, rnd = ((turn % 97) + 97) % 97, b = k + 17 * si;   // (the round as the shader's mod has it, at a clock under 0 too)
    const t = tau - F.wait * fr(rnd * 0.618034 + b * 0.381966 + 0.25) - F.rise;
    if (t <= 0 || t >= F.life) continue;
    const w = Math.pow(1 - t / F.life, 1.5) * Math.min(1, t * 3), c = F.colours[Math.floor(fr(rnd * 0.754878 + b * 0.569840 + 0.1) * 3)];
    out[0] += c[0] * w; out[1] += c[1] * w; out[2] += c[2] * w;
  }
  return out;
}
// a compass bearing and a distance from the tower as a place in the frame [x, z] (the part's own rule: +X at bearing 44)
function fromBearing(deg, dist) { return [Math.cos((deg - 44) * RAD) * dist, Math.sin((deg - 44) * RAD) * dist]; }

// ---- THE CASCADE'S LIGHT AND MOTION: over the still water of the far palace's cascade and basin (FALLS) lies one
// mesh of light that moves BY THE WORLD'S CLOCK: on each fall a bright veil of falling streaks; on each tread long
// bands of brighter water sliding toward the next fall; on the basin slow ripples and the churn at the last
// fall's foot; and down the whole flight a slow swell of the flow, so that the falls brighten one after another
// from the hall to the basin. Each is drawn from the place on the water (metres across, metres down the flight)
// and the time alone.
// SOURCED: its colour and that it glowed: the cascade under the palace's gas "comme de la fonte en fusion"
// (src-light.md 6; figures.md C "glowing cascade"): molten gold, the falls its brightest part.
// LAWFUL READING (order L1): the streaks, bands and ripples are filtered by a pixel's footprint (fwidth), going to
// their mean where they are smaller than a pixel; the swell is as long as several falls and stays.
// WORKING: the rates, sizes and levels; the night number raises its level.
// THE PALACE'S FIRE ON THE RIVER (PALACE_SHEEN), in the same mesh and call: a flat strip of quads lies just over
// the river before the palace, and adds to it the light the rippled water throws back from `lights`, eight lights
// that stand for the palace's lit masses (the hall, the two towers' heads, the wings' galleries, the two
// pavilions, the cascade's basin). SOURCED: the blaze itself ("presque un brasier", src-light.md 6). INVENTED BY
// NEED (the sources give the fire, not its light on the water; a palace ablaze above black water that gave nothing
// back would read as a fault). LAWFUL READINGS (order L1): A SHADING BY THE DIRECTION FROM THE WATER TO THE EYE, as
// the lamps' streaks are: a point of water shows a light when the slope the water would need there to mirror it to
// the eye is one the water has. The water has two kinds of slope: its fine ripples (a narrow spread: to a low eye
// each light draws out into a long streak toward it) and the chop of the boats' wakes (a broad spread, `chop`: to
// an eye high over the far bank the palace's fire lies as a wide sheen on the water under it, strongest at the far
// quay's foot and dying across the stream); ripples smaller than a pixel go into the spread, and the chop's
// sparkle goes to its mean (A FILTER BY A PIXEL'S FOOTPRINT, fwidth). The ripples run and the sparkle shifts BY
// THE WORLD'S CLOCK; the night number raises its level with the palace's gas. The strip never moves.
// WORKING: the lights' places and strengths, the spreads, the reach and the levels.
const CASCADE = { colour: [1.0, 0.6, 0.24], dusk: 0.55, night: 1.7, speed: 3.2, lift: 0.3, swell: [0.21, 1.15] };
const PALACE_SHEEN = {
  colour: [1.0, 0.56, 0.21], dusk: 0.6, night: 0.85,     // the fire's colour on the water; its level in the dusk and by night
  sigma: 0.06, ripple: 0.03, chop: 0.26, chopK: 0.62,    // the fine slopes' spread and the ripples' own slope; the chop's spread and its share
  reach: 330, down: 0.45,                                // metres from a light at which its light on the water has fallen to half; the share an eye straight above still sees
  half: 560, fade: 160, step: 40, lift: 0.05,            // the strip: its half length along the river from the axis, the metres over which it dies at its ends, its quads' length, its height over the lamps' streaks
};
const CASCADE_VERT = /* glsl */`
attribute vec3 aFall;                    // metres across the water, metres down the flight, 0 on a fall, 1 on the basin, 2 on a tread; on the river (3): the strip's share at its ends
varying vec3 vFall; varying vec3 vW;
void main() { vFall = aFall; vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const CASCADE_FRAG = /* glsl */`
uniform vec3 uColour, uSheen; uniform float uTime;
uniform vec4 uSheenP[8];                 // a light of the palace: its place, its strength
varying vec3 vFall; varying vec3 vW;
float ch(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(ch(i), ch(i + vec2(1., 0.)), f.x), mix(ch(i + vec2(0., 1.)), ch(i + 1.), f.x), f.y); }
void main() {
  if (vFall.z > 2.5) {
    // the river before the palace: the light its ripples and its chop mirror to the eye from each of the palace's lights
    vec3 V = normalize(cameraPosition - vW);
    vec2 p = vW.xz, w = fwidth(p); float foot = max(w.x, w.y);
    vec2 d1 = vec2(.83, .56), d2 = vec2(-.37, .93);
    float k1 = 1. - smoothstep(.4, 1.5, foot), k2 = 1. - smoothstep(.9, 3.5, foot);
    vec2 rip = ${PALACE_SHEEN.ripple.toFixed(3)} * (d1 * (k1 * sin(dot(p, d1) * 5.1 + uTime * 4.1 + 1.9 * sin(dot(p, vec2(-d1.y, d1.x)) * .61 + uTime * .5)))
      + d2 * (k2 * sin(dot(p, d2) * 2.3 - uTime * 2.9 + 2.1 * sin(dot(p, vec2(-d2.y, d2.x)) * .33 - uTime * .4))));
    float s2 = ${(PALACE_SHEEN.sigma ** 2).toFixed(6)} + ${(PALACE_SHEEN.ripple ** 2 / 2).toFixed(6)} * (2. - k1 - k2), gain = ${(PALACE_SHEEN.sigma ** 2).toFixed(6)} / s2;
    float tw = cn(p * .37 + vec2(uTime * .6, -uTime * .45)) * cn(p * .13 - vec2(uTime * .2, uTime * .27) + 5.);
    float glit = ${PALACE_SHEEN.chopK.toFixed(2)} * mix(1., .45 + 2.2 * tw, 1. - smoothstep(1.5, 6., foot));
    float graze = ${PALACE_SHEEN.down.toFixed(2)} + ${(1 - PALACE_SHEEN.down).toFixed(2)} * pow(1. - clamp(V.y, 0., 1.), 3.), sum = 0.;
    for (int i = 0; i < 8; i++) {
      vec3 L = uSheenP[i].xyz - vW; float d = length(L);
      vec3 H = normalize(V + L / d);
      vec2 s = H.xz / max(H.y, .04) - rip; float ss = dot(s, s);
      sum += uSheenP[i].w * (gain * exp(-ss / (2. * s2)) + glit * exp(-ss / ${(2 * PALACE_SHEEN.chop ** 2).toFixed(4)})) * ${(PALACE_SHEEN.reach ** 2).toFixed(1)} / (${(PALACE_SHEEN.reach ** 2).toFixed(1)} + d * d);
    }
    gl_FragColor = vec4(uSheen * (sum * graze * vFall.x), 1.);
    return;
  }
  vec2 q = vFall.xy, w = fwidth(q); float foot = max(w.x, w.y), a;
  float swell = 1. + .3 * sin(q.y * ${CASCADE.swell[0].toFixed(2)} - uTime * ${CASCADE.swell[1].toFixed(2)});
  if (vFall.z < .5) {
    // a fall: a veil of streaks falling fast, each a hand's breadth across
    float veil = cn(vec2(q.x * 2.3, q.y * 1.1 - uTime * 6.));
    a = mix(1., .55 + .9 * veil, 1. - smoothstep(.5, 2., foot)) * swell;
  } else if (vFall.z > 1.5) {
    // a tread: long bands across the water sliding to the fall, broken along their length
    float down = q.y - uTime * ${CASCADE.speed.toFixed(1)}, band = cn(vec2(q.x * .35, down * .42)) * .65 + cn(vec2(q.x * 1.1 + 7., down * 1.3)) * .35;
    a = mix(.42, .12 + 1.1 * band * band, 1. - smoothstep(1.2, 5., foot)) * swell;
  } else {
    // the basin: slow ripples, and the churn under the last fall dying out over a few metres
    float rip = cn(q * .3 + vec2(uTime * .5, -uTime * .35)) * cn(q * .17 - vec2(uTime * .22, uTime * .3) + 9.);
    a = mix(.3, .1 + 1.6 * rip, 1. - smoothstep(2.5, 9., foot)) + .7 * swell * exp(-vFall.y / 5.) * (1. - smoothstep(9., 13., abs(q.x)));
  }
  gl_FragColor = vec4(uColour * a, 1.);
}`;
// the light over every tread, every fall's face and the basin, a little off each; and the strip on the river
// before the palace. lights: the palace's eight lights [x, y, z, strength]
function buildCascade(scene, lights) {
  const F = FALLS, L = CASCADE.lift, P = [], A = [], I = [];
  // a quad from its four corners; `down` at its upper and its lower edge, `half` its half breadth
  const quad = (c, half, d0, d1, kind) => {
    const i = P.length / 3;
    P.push(...c[0], ...c[1], ...c[2], ...c[3]); A.push(-half, d0, kind, half, d0, kind, half, d1, kind, -half, d1, kind);
    I.push(i, i + 1, i + 2, i, i + 2, i + 3);
  };
  for (let k = 0; k < F.steps; k++) {
    const za = F.z0 + k * F.tread, zb = za + F.tread, y = F.topY - k * F.riser + L, d = k * (F.tread + F.riser);
    quad([[-F.half, y, za + L], [F.half, y, za + L], [F.half, y, zb + L], [-F.half, y, zb + L]], F.half, d, d + F.tread, 2);
    quad([[-F.half, y, zb + L], [F.half, y, zb + L], [F.half, y - F.riser, zb + L], [-F.half, y - F.riser, zb + L]], F.half, d + F.tread, d + F.tread + F.riser, 0);
  }
  const y = F.poolY + L;
  quad([[-F.poolHalf, y, F.poolZ], [F.poolHalf, y, F.poolZ], [F.poolHalf, y, F.z1], [-F.poolHalf, y, F.z1]], F.poolHalf, 0, F.z1 - F.poolZ, 1);
  // the river's strip: from the far quay's foot to the low bank's edge along the river's own line, dying at its two ends
  const PS = PALACE_SHEEN, wy = FRAME.waterY + STREAK.lift + PS.lift;
  for (let x = -PS.half; x <= PS.half + 1e-6; x += PS.step) {
    const a = riverSide(x, BANK_FAR + 0.3), b = riverSide(x, BANK_LOW - 0.3), e = Math.min(1, (PS.half - Math.abs(x)) / PS.fade), i = P.length / 3;
    P.push(a[0], wy, a[1], b[0], wy, b[1]); A.push(e, 0, 3, e, 0, 3);
    if (x > -PS.half) I.push(i - 2, i, i - 1, i - 1, i, i + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aFall', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I); g.computeBoundingSphere();
  const uniforms = { uColour: { value: new THREE.Color(0, 0, 0) }, uSheen: { value: new THREE.Color(0, 0, 0) }, uTime: { value: 0 },
    uSheenP: { value: Array.from({ length: 8 }, (_, i) => { const q = lights[i]; return q ? new THREE.Vector4(q[0], q[1], q[2], q[3]) : new THREE.Vector4(0, 50, 0, 0); }) } };
  const material = lightMaterial(uniforms, CASCADE_VERT, CASCADE_FRAG, { side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'cascade-shimmer'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 1;
  scene.add(mesh);
  return { uniforms, triangles: I.length / 3, dispose() { g.dispose(); material.dispose(); } };
}

// ---- THE FOUNTAINS (figures.md B: the main jet of 20 m in its basin, the canal's fourteen jets, the great group's
// basin before the dome, the group under the tower; figures.md C: lit from below in yellow, green, red, violet, blue
// and white in turn, z 220 to 303). SOURCED: the four places, the main jet's height, the canal's fourteen jets, the
// six colours and their order, the coloured light on the three basins of the garden. INVENTED BY NEED (the sources
// give that the water played, not its drawing): the canal's jets in two rows of seven leaning in, the great group's
// ring of jets and the fall from its dish, the water of the group under the tower (a low ring of jets and a fall
// from its dish; its light is the plain gas of the arches over it, since the sources give colour to the garden's
// three basins alone), every size and strength.
// EVERY DROP IS A PURE FUNCTION OF THE WORLD'S CLOCK: it leaves its nozzle, rises and falls on its own parabola under
// gravity and is at its nozzle again when it meets the water; its share of that flight at clock 0 is its own. The
// mist at each jet's foot breathes and the rings in each basin's glow run outward by the clock. THE COLOURS GO
// ROUND BY THE CLOCK, each basin on a round of its own (FOUNTAIN.rounds), one light going smoothly over to the next.
// THE COLOURED LIGHT COMES UP BY METRES FLOWN between two of the route's own places (FOUNTAIN.from): unlit, the
// water is a pale spray under the sky. All of it is one call. LAWFUL READINGS (order L1): each drop, each puff of mist is a small square TURNED TO
// THE EYE, a drop's drawn out along its own flight as the eye sees it; a drop is sized in metres and HELD BY A
// PIXEL'S FOOTPRINT: never drawn under FOUNTAIN.minPixels pixels across, its light lowered by the share it was
// widened, so a far jet is one calm plume. Nothing fades or thins by distance.
// CLEAR AIR (order L5), over every drop's whole flight with its own length: the main jet's highest drop tops out
// 19.4 m up, under FRAME's 20 m and well under the line's lowest pass over that basin; no drop comes within 17 m
// of the flown line and no puff of mist within 16 m (the nearest are the tower fountain's, under the line's pass
// between the legs).
const FOUNTAIN = {
  lights: [[1.0, 0.72, 0.14], [0.16, 1.0, 0.32], [1.0, 0.12, 0.07], [0.58, 0.2, 1.0], [0.14, 0.38, 1.0], [0.84, 0.92, 1.0]],   // yellow, green, red, violet, blue, white
  // each basin's round: the seconds one light is shown and where the round stands at clock 0 (in lights): the main
  // jet's, the canal's, the great group's. A DEPARTURE, WORKING: the sources' change came each minute (figures.md C
  // "changing each minute"); the flight lasts some fifty seconds, so a light here is shown 8.6 to 11.8 s.
  // The three rounds differ in length, so the basins never keep step and any clock shows some three of the colours.
  rounds: [[8.6, 0.2], [10.2, 2.5], [11.8, 4.3]],
  change: 0.3,                                           // the share of a light's time over which it goes over to the next
  from: ['towerOut', 'helixGarden'],                     // the route's two places between which the coloured light comes up
  gas: [1.0, 0.7, 0.36],                                 // the tower fountain's light: the gas of the arches over it
  level: 1.3, top: 0.45, fall: 14,                       // a lit drop's strength at the foot; the share left high up; metres over which it falls to that
  mist: 0.22, glow: 0.42, pale: 0.3,                     // the mist's and the basin glow's strengths; the share of the sky's horizon the unlit spray gives back
  g: 9.81, water: 0.4, nozzle: 0.3,                      // gravity; the basins' water over the ground (as the garden's works lay it); a nozzle's height over it
  stretch: 0.07, minPixels: 1.1,                         // a drop's length grows by this share of its radius for each metre a second it moves across the view; the pixel hold
  headroom: 1.2,                                         // the main jet's nozzle sends its fastest drop this far short of FRAME's height: the drop's own length stays under it
};
const FOUNT_VERT = /* glsl */`
attribute vec3 iBase;                    // a drop's nozzle; a puff of mist's or a glow's middle
attribute vec4 iVel;                     // a drop's launch velocity and the seconds of its flight
attribute vec4 iPar;                     // its share of its flight at clock 0 (a puff's own number), its radius in metres, its basin, its kind (0 a drop, 1 mist, 2 the glow laid on the water)
uniform float uTime; uniform vec3 uLight[4]; uniform vec3 uPale; uniform vec2 uPx;
varying vec3 vQ; varying vec3 vCol;      // vQ.z: the kind
void main() {
  float n = iPar.x, kind = iPar.w;
  vec3 light = iPar.z < .5 ? uLight[0] : iPar.z < 1.5 ? uLight[1] : iPar.z < 2.5 ? uLight[2] : uLight[3];
  vec4 mv;
  if (kind < .5) {
    float s = fract(uTime / iVel.w + n), t = s * iVel.w;
    vec3 p = iBase + iVel.xyz * t, vel = iVel.xyz;
    p.y -= ${(FOUNTAIN.g / 2).toFixed(4)} * t * t; vel.y -= ${FOUNTAIN.g.toFixed(3)} * t;
    mv = viewMatrix * vec4(p, 1.);
    vec2 dir = (viewMatrix * vec4(vel, 0.)).xy; float sp = length(dir); dir = sp > 1e-4 ? dir / sp : vec2(0., 1.);
    // the drop swells into spray as it flies; its length follows its speed across the view
    float rad = iPar.y * (.6 + .9 * s), len = rad * (1. + ${FOUNTAIN.stretch.toFixed(3)} * sp);
    float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
    float rd = max(rad, ${(FOUNTAIN.minPixels / 2).toFixed(3)} * mPerPx), ld = max(len, rd);
    mv.xy += dir * (position.y * ld) + vec2(dir.y, -dir.x) * (position.x * rd);   // (across, along): the square keeps its facing
    // lit from below: strongest at the foot, a share of it left high up
    float low = mix(1., ${FOUNTAIN.top.toFixed(2)}, smoothstep(0., ${FOUNTAIN.fall.toFixed(1)}, p.y - iBase.y));
    vCol = (light * (${FOUNTAIN.level.toFixed(2)} * low) + uPale) * (rad * len / (rd * ld)) * smoothstep(0., .03, s) * (1. - smoothstep(.94, 1., s));
    vQ = vec3(position.xy, 0.);
  } else if (kind < 1.5) {
    vec3 p = iBase + iPar.y * .18 * vec3(sin(uTime * .5 + n * 40.), .6 * sin(uTime * .8 + n * 17.), cos(uTime * .45 + n * 23.));
    mv = viewMatrix * vec4(p, 1.);
    mv.xy += position.xy * (iPar.y * (1. + .16 * sin(uTime * 1.3 + n * 31.)));
    vCol = (light * ${FOUNTAIN.mist.toFixed(2)} + uPale * .35) * (.75 + .25 * sin(uTime * 2.1 + n * 50.));
    vQ = vec3(position.xy, 1.);
  } else {
    mv = viewMatrix * vec4(iBase + vec3(position.x, 0., -position.y) * iPar.y, 1.);   // laid flat, face up
    vCol = light * ${FOUNTAIN.glow.toFixed(2)};
    vQ = vec3(position.xy, 2. + n);
  }
  gl_Position = projectionMatrix * mv;
}`;
const FOUNT_FRAG = /* glsl */`
uniform float uTime;
varying vec3 vQ; varying vec3 vCol;
void main() {
  float r2 = dot(vQ.xy, vQ.xy), a;
  if (vQ.z < .5) a = max(exp(-3.2 * r2) - .041, 0.);                // a soft bright drop, out to nothing at its square's rim
  else if (vQ.z < 1.5) { a = max(1. - r2, 0.); a *= a; }             // a puff of mist
  else {
    // the light on the basin's water and rim: brightest at the middle, slow rings running outward by the clock
    float r = sqrt(r2), f = max(1. - r2, 0.);
    a = f * (.72 + .28 * sin(r * 21. - uTime * 2.4 + fract(vQ.z) * 40.));
  }
  gl_FragColor = vec4(vCol * a, 1.);
}`;
// THE FOUNTAINS' JETS, laid from FRAME: each { basin (0 the main jet's, 1 the canal's, 2 the great group's, 3 the
// tower's), p: the nozzle, v: the launch velocity of its middle drop, spread: metres a second its drops scatter
// sideways, drops, size: a drop's radius }. WORKING: all but the main jet's height and the canal's count.
function fountainJets() {
  const F = FRAME, FN = FOUNTAIN, W = F.groundY + FN.water, N = W + FN.nozzle, jets = [];
  const up = (h) => Math.sqrt(2 * FN.g * h);              // the launch speed that tops out h metres over the nozzle
  // a jet from (x, z) that tops out h over its nozzle and comes down `reach` metres off toward (tx, tz)
  const arch = (basin, x, z, tx, tz, reach, h, spread, drops, size) => {
    const vy = up(h), T = 2 * vy / FN.g, d = Math.hypot(tx - x, tz - z) || 1;
    jets.push({ basin, p: [x, N, z], v: [(tx - x) / d * reach / T, vy, (tz - z) / d * reach / T], spread, drops, size });
  };
  // the water that falls from a group's dish: sources round the dish's rim, thrown a little outward
  const dish = (basin, x, z, r, y, count, drops) => {
    for (let k = 0; k < count; k++) { const a = Math.PI * 2 * (k + 0.5) / count; jets.push({ basin, p: [x + r * Math.cos(a), y, z + r * Math.sin(a)], v: [0.9 * Math.cos(a), 0.6, 0.9 * Math.sin(a)], spread: 0.35, drops, size: 0.2 }); }
  };
  const ring = (basin, x, z, r0, r1, h, count, drops, size) => {
    for (let k = 0; k < count; k++) { const a = Math.PI * 2 * k / count; arch(basin, x + r0 * Math.cos(a), z + r0 * Math.sin(a), x, z, r0 - r1, h, 0.22, drops, size); }
  };
  // the main jet: straight up to FRAME's height over the ground, less the room its own drop takes
  const MJ = F.mainJet;
  jets.push({ basin: 0, p: [MJ.x, N, MJ.z], v: [0, up(MJ.jetHeight - (N - F.groundY) - FN.headroom), 0], spread: 0.55, drops: 320, size: 0.44 });
  // the canal: FRAME's jets in two rows down its length, each leaning in over the water
  const CN = F.canal, perRow = CN.jets / 2;
  for (const sx of [-1, 1]) for (let k = 0; k < perRow; k++) {
    const z = CN.z0 + (CN.z1 - CN.z0) * (k + 0.5) / perRow;
    arch(1, sx * (CN.halfWidth - 2.6), z, 0, z, CN.halfWidth - 3.6, CN.jetHeight - (N - F.groundY) - 0.6, 0.2, 44, 0.3);
  }
  // the great group: a ring of ten jets arching in toward it, and the fall from its dish (the dish as the garden's works shape it)
  const CT = F.coutan, dishR = 0.84 * 6, dishY = (h) => W + 0.46 * (h - 0.4);
  ring(2, CT.x, CT.z, CT.basinDiameter / 2 - 4, 7, 6, 10, 36, 0.3);
  dish(2, CT.x, CT.z, dishR, dishY(CT.height), 14, 10);
  // the group under the tower: a low ring of eight jets and the fall from its dish
  const TF = F.fountain;
  ring(3, TF.x, TF.z, TF.basinDiameter / 2 - 2.2, 6, 3.2, 8, 24, 0.24);
  dish(3, TF.x, TF.z, dishR, dishY(TF.groupHeight), 12, 8);
  return jets;
}
// EVERY DROP of the jets above: { basin, p, v, T: the seconds from its nozzle to the water, phase: its share of that
// flight at clock 0, size }. Each drop's speed, scatter and phase come from its own number, never from a shared stream.
function fountainDrops() {
  const FN = FOUNTAIN, W = FRAME.groundY + FN.water, drops = [];
  fountainJets().forEach((j, jn) => {
    for (let i = 0; i < j.drops; i++) {
      const id = jn * 1024 + i, k = 1 - 0.12 * hash01(id, 81) * hash01(id, 82), a = Math.PI * 2 * hash01(id, 83), s = j.spread * Math.sqrt(hash01(id, 84));
      const v = [j.v[0] * k + s * Math.cos(a), j.v[1] * k, j.v[2] * k + s * Math.sin(a)];
      const T = (v[1] + Math.sqrt(v[1] * v[1] + 2 * FN.g * (j.p[1] - W))) / FN.g;
      drops.push({ basin: j.basin, p: j.p, v, T, phase: (i + hash01(id, 85)) / j.drops, size: j.size * (0.8 + 0.4 * hash01(id, 86)) });
    }
  });
  return drops;
}
// a basin's light at a clock: one of FOUNTAIN.lights going smoothly over to the next, round and round
function fountainLight(out, time, seconds, shift) {
  const L = FOUNTAIN.lights, s = time / seconds + shift, i = Math.floor(s), t = Math.min(1, Math.max(0, (s - i - (1 - FOUNTAIN.change)) / FOUNTAIN.change)), k = t * t * (3 - 2 * t);
  const a = L[((i % L.length) + L.length) % L.length], b = L[(((i + 1) % L.length) + L.length) % L.length];
  out[0] = a[0] + (b[0] - a[0]) * k; out[1] = a[1] + (b[1] - a[1]) * k; out[2] = a[2] + (b[2] - a[2]) * k;
  return out;
}
// THE FOUNTAINS DRAWN: the glows on the basins first, then the mist, then the drops, as instances of one square in
// one call. Returns the uniforms and set(time, night, pale, gas): the update's writes (uniforms only).
async function buildFountains(ctx, scene, uPx) {
  const F = FRAME, FN = FOUNTAIN, W = F.groundY + FN.water, base = [], vel = [], par = [];
  const add = (p, v, T, a, size, basin, kind) => { base.push(p[0], p[1], p[2]); vel.push(v[0], v[1], v[2], T); par.push(a, size, basin, kind); };
  // the glow on each basin's water and rim, a little wider than the basin; the canal's as a row of rounds
  const GLOW_Y = F.groundY + 0.78, CN = F.canal, still = [0, 0, 0];
  add([F.mainJet.x, GLOW_Y, F.mainJet.z], still, 1, 0.1, F.mainJet.basinDiameter / 2 + 3, 0, 2);
  for (let k = 0; k < 6; k++) add([0, GLOW_Y, CN.z0 + (CN.z1 - CN.z0) * (k + 0.5) / 6], still, 1, 0.13 * k + 0.05, CN.halfWidth + 3.5, 1, 2);
  add([F.coutan.x, GLOW_Y, F.coutan.z], still, 1, 0.4, F.coutan.basinDiameter / 2 + 3, 2, 2);
  add([F.fountain.x, GLOW_Y, F.fountain.z], still, 1, 0.7, F.fountain.basinDiameter / 2 + 2.5, 3, 2);
  // the mist: one soft puff at each jet's foot, larger under the taller jets
  fountainJets().forEach((j, n) => {
    const h = j.v[1] * j.v[1] / (2 * FN.g), size = 0.9 + 0.22 * h;
    add([j.p[0], Math.max(j.p[1], W + 0.2) + size * 0.45, j.p[2]], still, 1, hash01(n, 87), size, j.basin, 1);
  });
  await ctx.yield();
  const drops = fountainDrops();
  await ctx.yield();
  for (const d of drops) add(d.p, d.v, d.T, d.phase, d.size, d.basin, 0);
  const g = unitSquare();
  g.setAttribute('iBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 3)); g.setAttribute('iVel', new THREE.InstancedBufferAttribute(new Float32Array(vel), 4));
  g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(par), 4));
  g.instanceCount = par.length / 4;
  const z0 = F.fountain.z - 20, z1 = F.coutan.z + 25;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, (z0 + z1) / 2), (z1 - z0) / 2 + 12);
  const uniforms = { uTime: { value: 0 }, uLight: { value: [0, 1, 2, 3].map(() => new THREE.Color(0, 0, 0)) }, uPale: { value: new THREE.Color(0, 0, 0) }, uPx };
  const material = lightMaterial(uniforms, FOUNT_VERT, FOUNT_FRAG, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'fountains'; mesh.matrixAutoUpdate = false; mesh.renderOrder = 3;
  scene.add(mesh);
  await ctx.yield();
  const c = [0, 0, 0];
  return { uniforms, drops: drops.length, triangles: g.instanceCount * 2,
    // time: the clock; metres: the metres flown; horizon: the sky's colour at the horizon; arches: the share of the tower's arches lit
    set(time, metres, horizon, arches) {
      const m0 = ROUTE.places[FN.from[0]], t = Math.min(1, Math.max(0, (metres - m0) / (ROUTE.places[FN.from[1]] - m0))), lit = t * t * (3 - 2 * t), L = uniforms.uLight.value;
      uniforms.uTime.value = time;
      FN.rounds.forEach(([seconds, shift], b) => { fountainLight(c, time, seconds, shift); L[b].setRGB(c[0] * lit, c[1] * lit, c[2] * lit); });
      L[3].setRGB(FN.gas[0] * arches, FN.gas[1] * arches, FN.gas[2] * arches);
      uniforms.uPale.value.copy(horizon).multiplyScalar(FN.pale);
    },
    dispose() { g.dispose(); material.dispose(); } };
}

// ---- THE GROUND KEPT EMPTY BEHIND THE ENTRY (ENTRY_FAN): A REGION BY PLACE, typed once here in metres behind the
// entry's point and the same on every seed; a rule of the build for every mover. INVENTED BY NEED (no source; the
// engine's way of showing this world through the opening before it asks for it). While this world is the next one, the engine draws it
// through the previous world's opening by a lens that stands BEHIND THE ROUTE'S START: on the first heading
// produced back or beside it (the viewer may come at the opening askew), at the start's height or above, as far
// back as that viewer is from the opening, with everything before the entry in its picture. A body that moved
// there would pass through that lens. So: inside the fan whose point is the route's start, whose axis is the first heading produced back,
// whose half breadth is `spread` metres for each metre back and which ends `back` metres back, NO BODY THAT MOVES
// MAY BE AT ANY CLOCK, counted in plan (so at any height) from the mover's middle less its own half size: no hull,
// deck house, awning, funnel or boat's lamp, no puff of steam or smoke, no cab. A flat wake or a lamp's streak on
// the water may lie there. The boats' rounds and the cabs' lanes below are laid outside it and a chimney whose
// plume would drift into it does not smoke; the crowd keeps its own ground (ENTRY_LENS).
// `back` is the engine's own default reach: it shows a world's opening over the last 320 m of the world before
// (src/core/engine.js, revealDist), and the lens stands no further back than that viewer does. A world before that
// asks for a longer reveal, or turns hard into its opening, can stand the lens outside this fan: the fan is the
// ground this world keeps, not a bound on the engine.
// `round`: what stands or goes on the far bank beside the start (the cabs, the crowd) keeps as well out of a round
// of this many metres about the start, where a world before that turns into its opening brings the lens in from
// the side (WORKING: its breadth; its far rim lies over the tower's quay across the river, whose lane of cabs
// is not turned for it). The boats' lower round turns on the open water before the start, in the
// visitor's own first picture, and keeps the fan alone.
const ENTRY_FAN = { back: 320, spread: 0.5, round: 120 };
// the fan in plan from the route's own first two points: gap(x, z) is the metres from a place to the fan's edge,
// under 0 inside it; near(x, z) the same to the fan and the round about the start together
function entryFan() {
  const C = ROUTE.curve, F = ENTRY_FAN, ax = C.x[0], az = C.z[0], hl = Math.hypot(C.x[1] - ax, C.z[1] - az);
  const bx = -(C.x[1] - ax) / hl, bz = -(C.z[1] - az) / hl, w = F.back * F.spread;
  const P = [[ax, az], [ax + bx * F.back - bz * w, az + bz * F.back + bx * w], [ax + bx * F.back + bz * w, az + bz * F.back - bx * w]];
  const turn = Math.sign((P[1][0] - ax) * (P[2][1] - az) - (P[1][1] - az) * (P[2][0] - ax));
  return { corners: P, gap(x, z) {
    let least = Infinity, inside = true;
    for (let i = 0; i < 3; i++) {
      const a = P[i], b = P[(i + 1) % 3], ex = b[0] - a[0], ez = b[1] - a[1], t = Math.min(1, Math.max(0, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez)));
      least = Math.min(least, Math.hypot(x - a[0] - ex * t, z - a[1] - ez * t));
      if ((ex * (z - a[1]) - ez * (x - a[0])) * turn < 0) inside = false;
    }
    return inside ? -least : least;
  }, near(x, z) { return Math.min(this.gap(x, z), Math.hypot(x - ax, z - az) - F.round); } };
}

// ---- THE RIVER'S LIFE (figures.md C: boats on the river with a few warm lamps, bow and stern lights; the tower's
// projectors rested on boats). SOURCED: boats under way on the river at night with warm lamps and bow and stern
// lights (src-light.md 6, "Boats": seventeen lamps and bow and stern signals; src-light.md 3: followed by the
// projectors). INVENTED BY NEED (the sources give boats and their lamps, not their build): two plain kinds of 1889,
// a small steam launch under a pale awning and a passenger steamer (a long dark hull with a pale strake, a saloon
// with a row of lit windows a side, its roof a promenade deck under a pale awning with lamps hung under it, a
// wheelhouse, one funnel); their sizes, speeds and number. Nothing on them is lettered.
// THEIR ROUNDS: INVENTED BY NEED (river traffic is sourced, not its lines; the entry fan above lies across the
// river's far half behind the route's start and the flown line has the tower's side before it, so no boat can
// pass the start either way). Two rounds, each a line laid once at build:
//   BELOW THE FAN: up the river's far half from its lower end, under the second arch of the flown bridge from the
//     far bank, out toward the far bank and about in a half circle between the bridge and the fan (before the
//     visitor on the river's first stretch), then down again BESIDE THE FLOWN LINE, some 30 m to its far side,
//     and under the bridge's MIDDLE arch (the flown line takes the next arch toward the tower's bank);
//   ABOVE THE FAN: down along the far bank from the river's upper end, under the far arch of the next bridge
//     upstream, about in a wide half circle across the river above the fan and up again along the tower's side
//     under that bridge's near arch.
// No boat comes into being in the open: a round begins and ends at the built river's end, 2,650 m off in the haze.
// EVERY BOAT'S PLACE IS A PURE FUNCTION OF THE WORLD'S CLOCK: it keeps one round, and the round's own clock at
// each of its places is laid once at build: A BOAT KEEPS THE ROUND'S SPEED WITHIN `pace.near` METRES OF THE FLOWN
// BRIDGE (making for an arch and for its turn) AND RUNS UP TO `pace.times` AS FAST IN THE FAR REACHES, a law of
// the place alone; so the boats, set evenly apart in time along a round, stand close on the water by the bridge
// at any clock and thin out toward the haze. A boat's place is its round's at its own start plus the clock, and
// past the round's end it comes in again at its beginning. Its steam, its lamps' streaks and its wake follow from
// the same clock: the wake is laid in lengths along the round itself behind the hull, so it lies where the boat
// has been, through the turn too.
// THE COUNT scales with the deal's density (order L6).
// CLEAR AIR (order L5): the flown line comes down the river from the far side of its middle to the tower's side
// and goes under the second arch from the tower's bank; that arch and the water between the line and the tower's
// bank are an EMPTY LANE; the boats below the fan keep the line's far side. Over each round's whole length, with
// the larger hull's corners, lamps, awning and funnel and every puff of steam through its life (its radius taken
// off): no hull comes within 22 m of the flown line, no lamp within 21 m, no steam within 16 m; and no hull,
// lamp, funnel or puff comes within 47 m of the entry fan (a wake's foam lies flat on the water, 3.3 m under the line's height).
const BOATS = {
  spacing: 60,                                           // metres between two boats of a round near the flown bridge at density 1
  pace: { near: 350, far: 900, times: 3.4 },             // a boat keeps its round's speed within `near` metres of the flown bridge and runs `times` as fast beyond `far`
  fan: 60,                                               // a round's line keeps this far from the entry fan (by the count above it leaves hull, lamp, funnel and puff 47 m from the fan)
  reach: RIVER_REACH - 150,                              // a round begins and ends this many metres down or up the river from the bridge
  // each round: `sign` +1 comes up from the river's lower end and -1 down from its upper end; its speed; `turn`,
  // the station of its half circle's middle (the nearest to the fan it may have: boatRounds moves it off); `come` and `go`, the leg that comes to the turn and the leg that
  // leaves it, as offsets across the stream at stations [x, offset] (+ toward the tower's bank; the flown bridge's
  // arches' middles lie 62 and 31 m to the far side of the river's middle and at the middle itself, the flown
  // line's own arch 31 m to the tower's side of it; the next bridge's side arches 53 m either side of the middle).
  // The half circle joins the two legs' offsets at the turn's station.
  rounds: [
    { sign: 1, speed: 2.4, turn: 165, come: [[-300, -50], [-60, -31], [20, -31], [165, -68.5]], go: [[-300, -20], [-60, 0], [60, -1], [110, -8], [165, -25.5]] },
    { sign: -1, speed: 2.6, turn: 520, come: [[520, -51], [700, -53.3], [900, -53.3], [1200, -50]], go: [[520, 45], [700, 47], [900, 47], [1200, 40]] },
  ],
  // the two kinds, in metres: half length, half beam, the funnel's place along the hull and its top over the
  // water, the bow and stern lamps as [along, up], the lamp amidships (`cabin`: under the launch's awning, the
  // middle one under the steamer's), the steamer's two other lamps under its awning (`deck`) and the place along
  // its side from which its saloon's windows light the water (`side`), the size of its wake and steam beside the
  // launch's
  kinds: [
    { name: 'launch', half: 5.75, beam: 1.3, funnel: [2.0, 3.6], lamps: [[5.3, 1.6], [-5.4, 1.4]], cabin: [-1.6, 1.9], big: 1 },
    { name: 'steamer', half: 15, beam: 2.5, funnel: [1.9, 6.4], lamps: [[14.2, 2.7], [-14.5, 2.4]], cabin: [-4.7, 4.75], deck: [[-8.5, 4.75], [-0.9, 4.75]], side: [-2, 2.2], big: 1.8 },
  ],
  steamers: 0.7,                                         // the share of the boats that are steamers
  heave: 0.05, roll: 0.02,                               // a hull's rise and fall in metres and its roll in radians, by the clock
  // a launch's wake: its length, its half breadth at the stern, how fast it widens, its foam's strength; `cuts`:
  // the shares of its length at which its lengths join (short by the stern, where the foam is strong)
  wake: { long: 46, half: 1.1, spread: 0.2, level: 0.85, cuts: [0, 0.06, 0.14, 0.24, 0.36, 0.5, 0.66, 0.82, 1] },
  steam: { puffs: 8, life: 5, rise: 5, size: 0.7 },      // a funnel's puffs: how many, a puff's life in seconds, its rise and its first radius in metres
  // the lamps: their colour, level and globe; their streaks' share of that light and reach (`saloon`: the reach of
  // the light the steamer's windows lay on the water); pool: half the square of water a streak is drawn in
  lamp: { colour: [1.0, 0.68, 0.32], level: 3.2, globe: 0.2, streak: 0.5, reach: 11, saloon: 20, pool: 34 },
};
// how many times its round's speed a boat runs at station x: once near the flown bridge, BOATS.pace.times in the far reaches
function boatPace(x) {
  const P = BOATS.pace, t = Math.min(1, Math.max(0, (Math.abs(x) - P.near) / (P.far - P.near)));
  return 1 + (P.times - 1) * t * t * (3 - 2 * t);
}
// a leg's offset across the stream at x: from one station to the next by a smooth step
function laneOffset(line, x) {
  if (x <= line[0][0]) return line[0][1];
  for (let i = 0; i + 1 < line.length; i++) if (x <= line[i + 1][0]) {
    const t = (x - line[i][0]) / (line[i + 1][0] - line[i][0]);
    return line[i][1] + (line[i + 1][1] - line[i][1]) * t * t * (3 - 2 * t);
  }
  return line[line.length - 1][1];
}
// THE ROUNDS LAID: each { pts: its line as places [x, z], acc: the metres along it to each, clock: the seconds a
// boat takes to each (by the round's speed and the pace of each place), total: its metres, seconds: its whole
// time, speed }: the coming leg from the river's end to the turn, the half circle, the going leg back to the
// river's end
function boatRounds() {
  const B = BOATS, STEP = 12, ARC = 28, fan = entryFan();
  // a round's line with its half circle's middle at station `turn`
  const lay = (R, turn) => {
    const pts = [], end = -R.sign * B.reach, n = Math.ceil(Math.abs(turn - end) / STEP);
    const oc = laneOffset(R.come, turn), og = laneOffset(R.go, turn), mid = (oc + og) / 2, r = Math.abs(og - oc) / 2;
    for (let k = 0; k < n; k++) { const x = end + (turn - end) * k / n; pts.push(riverSide(x, laneOffset(R.come, x))); }
    for (let k = 0; k <= ARC; k++) { const a = Math.PI * k / ARC; pts.push(riverSide(turn + R.sign * r * Math.sin(a), mid + (oc - mid) * Math.cos(a))); }
    for (let k = 1; k <= n; k++) { const x = turn + (end - turn) * k / n; pts.push(riverSide(x, laneOffset(R.go, x))); }
    return pts;
  };
  return B.rounds.map((R) => {
    // the turn is the round's own station, moved away from the entry fan ten metres at a time (down the river for the
    // round below it, up the river for the round above) until every point of the line keeps B.fan metres from the fan
    let turn = R.turn, pts = lay(R, turn);
    for (let k = 0; k < 80 && pts.some((q) => fan.gap(q[0], q[1]) < B.fan); k++) { turn -= R.sign * 10; pts = lay(R, turn); }
    const acc = [0], clock = [0];
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      acc.push(acc[i - 1] + len); clock.push(clock[i - 1] + len / (R.speed * boatPace((pts[i][0] + pts[i - 1][0]) / 2)));
    }
    return { pts, acc, clock, total: acc[acc.length - 1], seconds: clock[clock.length - 1], speed: R.speed };
  });
}
// a round's place at d metres along it: out.x and out.z (nothing is made here: the update calls it)
function roundPoint(lane, d, out) {
  const acc = lane.acc, pts = lane.pts;
  let lo = 0, hi = acc.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] <= d) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi], t = Math.min(1, Math.max(0, (d - acc[lo]) / Math.max(1e-6, acc[hi] - acc[lo])));
  out.x = a[0] + (b[0] - a[0]) * t; out.z = a[1] + (b[1] - a[1]) * t;
  return out;
}
// the same with the way a hull heads there: out.yaw, the turn about Y that points its own +X along the round,
// taken from the round `span` metres behind and before the place
const _ra = { x: 0, z: 0 }, _rb = { x: 0, z: 0 };
function roundPlace(lane, d, out, span = 3) {
  roundPoint(lane, Math.max(0, d - span), _ra); roundPoint(lane, Math.min(lane.total, d + span), _rb);
  out.yaw = Math.atan2(-(_rb.z - _ra.z), _rb.x - _ra.x);
  return roundPoint(lane, d, out);
}
// THE FLEET: every boat as { lane, kind, t0: its seconds along its round's clock at clock 0, n: a number of its
// own }; evenly apart in time along each round (so `spacing` metres apart near the flown bridge, further apart
// where they run faster), each a little off its even place by its own number (by an eighth of the spacing at the
// most either way: two steamers, each 30 m long, never touch at any density of the deal)
function boatFleet(rounds, density) {
  const B = BOATS, fleet = [];
  rounds.forEach((lane, l) => {
    const count = Math.max(1, Math.round(lane.seconds * lane.speed / B.spacing * density));
    for (let k = 0; k < count; k++) {
      const id = l * 256 + k;
      fleet.push({ lane: l, kind: hash01(id, 91) < B.steamers ? 1 : 0, t0: lane.seconds * (k + 0.5 + 0.25 * (hash01(id, 92) - 0.5)) / count, n: hash01(id, 93) });
    }
  });
  return fleet;
}
// a boat's metres along its round at a clock: its start plus the clock, wrapped into the round's whole time, and
// the metres the round's own clock gives there
function boatAlong(boat, lane, time) {
  const s = boat.t0 + time, t = s - Math.floor(s / lane.seconds) * lane.seconds, clock = lane.clock;
  let lo = 0, hi = clock.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (clock[m] <= t) lo = m; else hi = m; }
  return lane.acc[lo] + (lane.acc[hi] - lane.acc[lo]) * (t - clock[lo]) / Math.max(1e-6, clock[hi] - clock[lo]);
}
// THE TWO HULLS, each laid by the kit's Builder in its own frame: +X toward the bow, Y up from the waterline.
// Plain shapes: a dark hull with a timber deck and one funnel; the launch's pale awning on four posts over its
// benches; the steamer's saloon with ten lit windows a side, its roof a promenade deck with canvas along its
// rails under a pale awning on thin posts, three lamps hung under the awning, the wheelhouse before the funnel,
// a pale strake along the hull, a pale band on the funnel (no letter, no mark).
function layBoat(b, kind) {
  const K = BOATS.kinds[kind], H = K.half, W = K.beam;
  const HULL = S.lin('#1b1f27'), DECK = S.lin('#5a4a3a'), PALE = S.lin('#d6cdb8'), HOUSE = S.lin('#c4b9a0'), IRON = S.lin('#23262c'), LIT = S.lin('#ffc97a');
  const free = kind ? 1.1 : 0.8;                          // the deck's height over the water
  b.col(HULL, 0.7, 1.05).surf(S.SURF.PLAIN);
  b.prism([[-H, 0.58 * W], [-0.88 * H, W], [0.4 * H, W], [0.8 * H, 0.6 * W], [H, 0], [0.8 * H, -0.6 * W], [0.4 * H, -W], [-0.88 * H, -W], [-H, -0.58 * W]], -0.5, free, { capColor: DECK });
  b.col(IRON, 0.8, 1.1).cyl(K.funnel[0], free, 0, kind ? 0.44 : 0.2, kind ? 0.4 : 0.17, K.funnel[1] - free, 8);
  if (kind === 0) {
    b.col(IRON, 0.8, 1.1).cbox(K.funnel[0], free, 0, 1.3, 0.9, 1.1);                        // the boiler's casing
    b.col(PALE, 0.55, 0.72).box(-0.86 * H, free - 0.26, -W - 0.03, 0.4 * H, free - 0.07, W + 0.03, { top: false });   // the strake
    b.col(PALE, 0.85, 1).surf(S.SURF.CANVAS, 0, 1).box(-4.7, 2.25, -W + 0.1, 1.2, 2.34, W - 0.1, { bottom: true });
    for (const sz of [-1, 1]) b.box(-4.7, 1.97, sz * (W - 0.1) - 0.02, 1.2, 2.25, sz * (W - 0.1) + 0.02, { top: false });   // the awning's valance
    b.col(DECK, 1.1, 1.3).surf(S.SURF.PLAIN).box(-4.3, free, -W + 0.25, -0.2, free + 0.45, W - 0.25);   // the benches' block
    b.col(IRON).surf(S.SURF.PLAIN);
    for (const x of [-4.6, 1.1]) for (const sz of [-1, 1]) b.cbox(x, free, sz * (W - 0.18), 0.07, 2.25 - free, 0.07, { top: false });
    b.col(LIT).surf(S.SURF.GLOW, 0, 0.8).cbox(K.cabin[0], K.cabin[1], 0, 0.22, 0.22, 0.22, { bottom: true });   // the lamp hung under the awning
  } else {
    const hx0 = -10, hx1 = 6.2, hw = W - 0.6, y1 = 3.1, up = 5.1, ax1 = 0.5;   // the saloon's ends and half width, its roof, the awning's height and fore end
    b.col(PALE, 0.8, 0.95).cyl(K.funnel[0], K.funnel[1] - 1.5, 0, 0.47, 0.46, 0.55, 8, { cap: false });   // the funnel's pale band
    b.col(PALE, 0.55, 0.72).box(-0.86 * H, free - 0.32, -W - 0.03, 0.4 * H, free - 0.08, W + 0.03, { top: false });   // the strake
    b.col(HOUSE, 0.75, 1).box(hx0, free, -hw, hx1, y1, hw, { top: false });
    b.col(DECK, 0.9, 1).box(hx0 - 0.6, y1, -hw - 0.3, hx1 + 0.4, y1 + 0.1, hw + 0.3, { bottom: true });   // the promenade deck
    b.col(PALE, 0.7, 0.92).surf(S.SURF.CANVAS, 0, 1);
    for (const sz of [-1, 1]) b.box(hx0 - 0.6, y1 + 0.1, sz * (hw + 0.27) - 0.03, hx1 + 0.4, y1 + 0.95, sz * (hw + 0.27) + 0.03);   // the canvas along its rails
    b.col(PALE, 0.85, 1).box(hx0 - 0.3, up, -hw - 0.55, ax1, up + 0.1, hw + 0.55, { bottom: true });   // the awning
    b.col(IRON).surf(S.SURF.PLAIN);
    for (const x of [hx0, -6.5, -3, ax1 - 0.3]) for (const sz of [-1, 1]) b.cbox(x, y1 + 0.1, sz * (hw + 0.2), 0.07, up - y1 - 0.1, 0.07, { top: false });
    b.col(HOUSE, 0.75, 1).cbox(4.7, y1 + 0.1, 0, 1.9, 2.1, 2.3, { capColor: PALE });        // the wheelhouse
    b.col(DECK, 0.8, 1).cbox(10.2, free, 0, 1.6, 0.5, 1.4);                                  // the foredeck's hatch
    b.col(LIT).surf(S.SURF.GLOW, 0, 1.1);
    for (let k = 0; k < 10; k++) for (const sz of [-1, 1]) {
      const xa = hx0 + 0.55 + k * 1.55, z = sz * (hw + 0.03);
      if (sz > 0) b.quad([xa, 1.75, z], [xa + 1.05, 1.75, z], [xa + 1.05, 2.65, z], [xa, 2.65, z]); else b.quad([xa + 1.05, 1.75, z], [xa, 1.75, z], [xa, 2.65, z], [xa + 1.05, 2.65, z]);
    }
    b.quad([5.67, y1 + 1.0, 0.85], [5.67, y1 + 1.0, -0.85], [5.67, y1 + 1.85, -0.85], [5.67, y1 + 1.85, 0.85]);   // the wheelhouse's lit front
    for (const [x, y] of [K.cabin, ...K.deck]) b.cbox(x, y - 0.14, 0, 0.24, 0.26, 0.24, { bottom: true });       // the lamps hung under the awning
  }
  // the bow and stern lamps: a short post and a small lit globe each
  for (const [x, y] of K.lamps) {
    b.col(IRON).surf(S.SURF.PLAIN).cbox(x, free, 0, 0.06, y - free - 0.1, 0.06, { top: false });
    b.col(LIT).surf(S.SURF.GLOW, 0, 1.2).cbox(x, y - 0.12, 0, 0.2, 0.24, 0.2, { bottom: true });
  }
  return b;
}

// ---- THE LIGHTS AND VAPOURS OF WHAT MOVES: one program for the small soft things that ride on a mover (a boat, a
// cab, the little train) or stand at a place (a chimney): each mover is an instance with a matrix (its place and
// heading, written by the update) and each thing a square of the instance's geometry with a kind:
//   0 A LAMP: a warm globe in its halo, flickering by the clock like the ground's gas;
//   1 A PUFF of steam or smoke: by the clock it leaves its funnel, stays in the air where it was let go (so it
//     falls behind a mover by the mover's own speed), rises, goes down the wind and swells and thins as it ages;
//   2 A LENGTH OF A WAKE: a flat piece of water behind a hull, laid along the round the hull has come by (a wake
//     is a chain of such lengths, each an instance of its own whose matrix carries its two ends), widening and
//     fading astern, its foam drawn in metres of the water itself (the round's speed times the clock runs the
//     pattern back, so the foam lies still on the river by the flown bridge and slides in the far reaches, where
//     a boat runs faster than its round's speed);
//   3 A LAMP'S STREAK ON THE WATER: a flat square of water round the lamp's foot, shaded as the river's other
//     streaks are;
//   4 A LAMP'S POOL on the road under it.
// EVERY ONE IS A PURE FUNCTION OF THE CLOCK and of its mover's matrix. LAWFUL READINGS (order L1): lamps and puffs
// are squares TURNED TO THE EYE; a lamp is sized in metres and HELD BY A PIXEL'S FOOTPRINT (never under
// GROUND_LAMPS.minPixels pixels' radius, its light lowered by the same ratio); a streak is A SHADING BY THE
// DIRECTION FROM THE WATER TO THE EYE (a point of water shows the lamp where its ripples can mirror it to the eye)
// with the river's own ripples, each train FILTERED BY A PIXEL'S FOOTPRINT ALONG ITS OWN RUN (dFdx, dFdy), and a
// wake's foam goes to its mean by the footprint. Nothing
// fades, hides or thins by distance to the eye.
const VAPOUR_COVER = 0.6;                               // WORKING: how much a puff of steam or smoke veils at its thickest
// WORKING: the light of the vapours and the foam. A puff takes this share of the sky's fill and of the horizon's
// colour and a little grey of its own, and from the lamps below this much of the kit's warm light at dusk and at
// night; the foam takes this much of the horizon's colour and a grey; the movers' lamps burn at these levels at dusk and at night.
const LIFE_LIGHT = { fill: 0.22, horizon: 0.55, grey: 0.2, warm: [0.2, 0.8], foam: 1.1, foamGrey: 0.1, lamp: [0.75, 1] };
const WIND = { x: Math.cos(0.9) * 1.5, z: Math.sin(0.9) * 1.5 };   // metres a second, down the bearing the tower's flags fly on (the part's wind)
const LIFE_VERT = /* glsl */`
attribute vec3 aAt, aAtB;                // the square's middle in its mover's frame, for the mover's first and second kind
attribute float aKind;
attribute vec4 aPar;                     // radius or half size; a number of its own; a puff's life in seconds or a wake's length; a puff's rise, a wake's widening or a streak's reach
attribute vec3 aCol;
attribute vec4 iCar;                     // the mover: its kind (0 or 1), its speed (a puff's trail takes it times the length of the matrix's first column, where a mover that changes speed writes its share, and once more by the column's fourth number, where a boat writes how much faster it runs in the far reaches), a number of its own, its things' size beside the first kind's
attribute vec3 iTint;
uniform float uTime, uWaterY, uLamp; uniform vec2 uPx, uWind;
varying vec4 vQ; varying vec3 vCol; varying vec3 vW; varying vec4 vLamp; varying float vAge;
void main() {
  vec3 at = mix(aAt, aAtB, iCar.x), wc = (instanceMatrix * vec4(at, 1.)).xyz;
  vec3 fwd = normalize(vec3(instanceMatrix[0].x, 0., instanceMatrix[0].z) + vec3(1e-6, 0., 0.)), side = vec3(-fwd.z, 0., fwd.x);
  float n = aPar.y + iCar.z * 7.3, big = iCar.w;
  vec4 mv; vAge = 0.; vLamp = vec4(0.); vW = wc; vCol = aCol * iTint; vQ = vec4(0.);
  // (a square its mover's kind does not carry has its place given far under the water: it is drawn nowhere)
  if (at.y < -90.) { gl_Position = vec4(2., 2., 2., 1.); return; }
  if (aKind < .5) {
    mv = viewMatrix * vec4(wc, 1.);
    float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.), drawn = max(aPar.x, ${GROUND_LAMPS.minPixels.toFixed(2)} * mPerPx);
    float gas = 1. + .07 * sin(uTime * (1.9 + 2.3 * fract(n)) + n * 97.) + .045 * sin(uTime * (4.1 + 3.7 * fract(n * 7.31)) + n * 41.);
    vCol *= uLamp * gas * aPar.x / drawn;
    mv.xy += position.xy * (${GROUND_LAMPS.halo.toFixed(1)} * drawn);
    vQ = vec4(position.xy * ${GROUND_LAMPS.halo.toFixed(1)}, 0., n);
  } else if (aKind < 1.5) {
    float life = aPar.z, age = fract(uTime / life + n), t = age * life, rise = 1. - (1. - age) * (1. - age);
    wc += vec3(uWind.x, 0., uWind.y) * t - fwd * (iCar.y * (length(instanceMatrix[0].xyz) + instanceMatrix[0].w) * t) + vec3(0., aPar.w * big * rise, 0.);
    wc.xz += .3 * aPar.x * big * age * vec2(sin(uTime * .9 + n * 40.), cos(uTime * .8 + n * 23.));
    mv = viewMatrix * vec4(wc, 1.);
    mv.xy += position.xy * (aPar.x * big * (.7 + 2.4 * age));
    vAge = age; vW = wc; vQ = vec4(position.xy, 1., n);
  } else if (aKind < 2.5) {
    // one length of a wake: its instance's matrix carries no frame but the length's two ends on the water (first
    // column: x and z of each), the unit way across the wake at each (second column) and the shares of the wake's
    // whole length at which they lie (third column)
    float e = position.x * .5 + .5, u = mix(instanceMatrix[2].x, instanceMatrix[2].y, e), len = aPar.z * big, hw = aPar.x * big + u * len * aPar.w;
    vec2 c = mix(instanceMatrix[0].xy, instanceMatrix[0].zw, e), sd = mix(instanceMatrix[1].xy, instanceMatrix[1].zw, e);
    vW = vec3(c.x + sd.x * position.y * hw, uWaterY + .12, c.y + sd.y * position.y * hw);
    mv = viewMatrix * vec4(vW, 1.);
    vLamp = vec4(len, iCar.y, hw, 0.); vQ = vec4(u, position.y, 2., n);
  } else if (aKind < 3.5) {
    vW = vec3(wc.x, uWaterY + .16, wc.z) + vec3(position.x, 0., position.y) * aPar.x;
    mv = viewMatrix * vec4(vW, 1.);
    vCol *= uLamp; vLamp = vec4(wc, aPar.w); vQ = vec4(position.xy, 3., n);
  } else {
    vW = wc + (fwd * position.x + side * position.y) * aPar.x;
    mv = viewMatrix * vec4(vW, 1.);
    vCol *= uLamp; vQ = vec4(position.xy, 4., n);
  }
  gl_Position = projectionMatrix * mv;
}`;
const LIFE_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uSmoke, uSmokeWarm, uFoam;
varying vec4 vQ; varying vec3 vCol; varying vec3 vW; varying vec4 vLamp; varying float vAge;
float lh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ln(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(lh(i), lh(i + vec2(1., 0.)), f.x), mix(lh(i + vec2(0., 1.)), lh(i + 1.), f.x), f.y); }
${RIPPLE_GLSL}
void main() {
  vec2 q = vQ.xy, gx = dFdx(vW.xz), gy = dFdy(vW.xz), fw = abs(gx) + abs(gy); float kind = vQ.z, n = vQ.w, foot = max(fw.x, fw.y), r2 = dot(q, q);
  if (kind < .5) {
    float r = sqrt(r2), a = (1. - smoothstep(.5, 1.2, r)) + ${GROUND_LAMPS.haloK.toFixed(3)} * max(exp(-r2 / ${(2 * GROUND_LAMPS.haloSigma ** 2).toFixed(2)}) - ${Math.exp(-(GROUND_LAMPS.halo ** 2) / (2 * GROUND_LAMPS.haloSigma ** 2)).toFixed(4)}, 0.);
    gl_FragColor = vec4(vCol * a, 0.);
  } else if (kind < 1.5) {
    // a soft round puff with a lumpy rim: pale under the sky, warm underneath from the lamps below while it is low and young
    float lump = ln(q * 2.3 + n * 17.) + .5 * ln(q * 5.1 - n * 9. + uTime * .2);
    float a = pow(1. - smoothstep(.05, 1., sqrt(r2) + .3 * (lump - .75)), 1.5) * smoothstep(0., .08, vAge) * (1. - vAge);
    vec3 col = vCol.rgb * (uSmoke + uSmokeWarm * ((1. - vAge) * (.6 - .4 * q.y)));
    a *= ${VAPOUR_COVER.toFixed(2)};
    gl_FragColor = vec4(col * a, a);
  } else if (kind < 2.5) {
    // the wake: two arms of foam along its edges and the churned water between them, in metres of the river
    float u = q.x, v = abs(q.y);
    vec2 p = vec2(u * vLamp.x + vLamp.y * uTime, q.y * vLamp.z);
    float fine = 1. - smoothstep(.8, 3.5, foot);
    float foam = mix(.5, ln(p * vec2(.3, .8) + n * 31.) * .6 + ln(p * vec2(.8, 1.9) + 7.) * .4, fine);
    float arms = smoothstep(.55, .9, v) * (1. - smoothstep(.9, 1., v)), churn = (1. - smoothstep(.1, .5 - .3 * u, v)) * (1. - u);
    float a = (arms * (.35 + foam) + churn * foam * 1.5) * pow(1. - u, 1.4) * smoothstep(0., .03, u);
    a = min(a, 1.);
    gl_FragColor = vec4(uFoam * vCol * a, a * .35);
  } else if (kind < 3.5) {
    // the lamp's streak, as the river's other streaks are worked: the slope the water would need here to mirror
    // the lamp to the eye, against the slopes its ripples have
    vec3 V = normalize(cameraPosition - vW), L = vLamp.xyz - vW; float d = length(L);
    vec3 H = normalize(V + L / d);
    vec2 s2, s = H.xz / max(H.y, .04) - riverRipples(vW.xz, gx, gy, uTime, s2);
    float gain = ${(STREAK.sigma ** 2).toFixed(6)} / sqrt(s2.x * s2.y), graze = ${STREAK.down.toFixed(2)} + ${(1 - STREAK.down).toFixed(2)} * pow(1. - clamp(V.y, 0., 1.), 3.);
    float r = vLamp.w, edge = max(1. - r2, 0.);
    gl_FragColor = vec4(vCol * (exp(-.5 * (s.x * s.x / s2.x + s.y * s.y / s2.y)) * r * r / (r * r + d * d) * gain * graze * edge * edge), 0.);
  } else {
    float f = max(1. - r2, 0.);
    gl_FragColor = vec4(vCol * (f * f), 0.);
  }
}`;
// the program's material: what it adds is its colour, what it veils is its alpha (a lamp adds and veils nothing; a
// puff veils what is behind it by its cover). `shared` holds the uniforms every mesh of the kind shares.
function lifeMaterial(shared) {
  return new THREE.ShaderMaterial({ uniforms: shared, vertexShader: LIFE_VERT, fragmentShader: LIFE_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide });
}
// a gatherer of the squares one mover carries: add(kind, at, atB, size, n, c, d, colour); geometry() gives them as one piece
function lifeSquares() {
  const pos = [], at = [], atB = [], kind = [], par = [], col = [], idx = [];
  return {
    add(k, a, b, size, n, c, d, colour) {
      const i = pos.length / 3;
      for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); at.push(a[0], a[1], a[2]); atB.push(b[0], b[1], b[2]); kind.push(k); par.push(size, n, c, d); col.push(colour[0], colour[1], colour[2]); }
      idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    },
    get count() { return idx.length / 6; },
    geometry() {
      const g = new THREE.BufferGeometry(), f = (a, n) => new THREE.Float32BufferAttribute(a, n);
      g.setAttribute('position', f(pos, 3)); g.setAttribute('aAt', f(at, 3)); g.setAttribute('aAtB', f(atB, 3)); g.setAttribute('aKind', f(kind, 1));
      g.setAttribute('aPar', f(par, 4)); g.setAttribute('aCol', f(col, 3)); g.setIndex(idx);
      return g;
    },
  };
}
// an instanced mesh of such squares for `count` movers; car(i) gives each mover's [kind, speed, number, size] and tint(i) its tint
function lifeMesh(name, squares, material, count, car, tint) {
  const g = squares.geometry(), cars = new Float32Array(count * 4), tints = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { cars.set(car(i), i * 4); tints.set(tint ? tint(i) : [1, 1, 1], i * 3); }
  g.setAttribute('iCar', new THREE.InstancedBufferAttribute(cars, 4)); g.setAttribute('iTint', new THREE.InstancedBufferAttribute(tints, 3));
  const mesh = new THREE.InstancedMesh(g, material, count);
  mesh.name = name; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.renderOrder = 2;
  return mesh;
}

// a mover's matrix written straight into an instanced mesh's buffer at slot i: its place, its turn about Y (its own
// +X along its way) and a roll about its own length
function writeMover(e, i, x, y, z, yaw, roll = 0) {
  const o = i * 16, c = Math.cos(yaw), s = Math.sin(yaw), cr = Math.cos(roll), sr = Math.sin(roll);
  e[o] = c; e[o + 1] = 0; e[o + 2] = -s; e[o + 3] = 0;
  e[o + 4] = s * sr; e[o + 5] = cr; e[o + 6] = c * sr; e[o + 7] = 0;
  e[o + 8] = s * cr; e[o + 9] = -sr; e[o + 10] = c * cr; e[o + 11] = 0;
  e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1;
}
// THE BOATS DRAWN: the hulls of each kind as instances of one mesh on the kit's material (two calls), every boat's
// lamps, steam and streaks as instances of one piece of squares (one call) and every wake as a chain of lengths,
// each an instance of one square (one call). Returns place(time): the update's writes, matrices only.
async function buildBoats(ctx, scene, mats, material, density) {
  const B = BOATS, rounds = boatRounds(), fleet = boatFleet(rounds, density), WY = FRAME.waterY, hulls = [];
  await ctx.yield();
  for (const kind of [0, 1]) {
    const count = fleet.filter((q) => q.kind === kind).length, b = layBoat(new S.Builder(512), kind);
    const mesh = new THREE.InstancedMesh(b.toGeometry(), mats.facade, Math.max(1, count));
    mesh.count = count; mesh.name = 'boats-' + B.kinds[kind].name; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    scene.add(mesh); hulls.push({ mesh, triangles: b.triangles * count, next: 0 });
    await ctx.yield();
  }
  for (const q of fleet) q.slot = hulls[q.kind].next++;
  // what each boat carries, at its place on the launch and on the steamer: the bow and stern lamps and the one
  // amidships, their streaks on the water, the funnel's steam; the steamer alone (NONE: the launch carries no
  // such square) the light its saloon's windows lay on the water either side of it and two more lamps under its awning
  const sq = lifeSquares(), [A, C] = B.kinds, L = B.lamp, NONE = [0, -99, 0], lampCol = L.colour.map((v) => v * L.level), streakCol = L.colour.map((v) => v * L.level * L.streak);
  const lampsOf = (K) => [[K.lamps[0][0], K.lamps[0][1], 0], [K.lamps[1][0], K.lamps[1][1], 0], [K.cabin[0], K.cabin[1], 0]];
  lampsOf(A).forEach((a, k) => sq.add(3, a, lampsOf(C)[k], L.pool, 0.11 + 0.23 * k, 0, L.reach, k < 2 ? streakCol : streakCol.map((v) => v * 1.6)));
  for (const sz of [-1, 1]) sq.add(3, NONE, [C.side[0], C.side[1], sz * (C.beam + 0.3)], L.pool, 0.83 + 0.07 * sz, 0, L.saloon, streakCol.map((v) => v * 1.5));
  for (let k = 0; k < B.steam.puffs; k++) sq.add(1, [A.funnel[0], A.funnel[1] + 0.3, 0], [C.funnel[0], C.funnel[1] + 0.3, 0], B.steam.size, (k + 0.37) / B.steam.puffs, B.steam.life, B.steam.rise, [1, 1, 1]);
  lampsOf(A).forEach((a, k) => sq.add(0, a, lampsOf(C)[k], k < 2 ? L.globe : L.globe * 0.8, 0.19 + 0.31 * k, 0, 0, k < 2 ? lampCol : lampCol.map((v) => v * 0.5)));
  C.deck.forEach((d, k) => sq.add(0, NONE, [d[0], d[1], 0], L.globe * 0.8, 0.57 + 0.19 * k, 0, 0, lampCol.map((v) => v * 0.5)));
  const carOf = (q) => [q.kind, rounds[q.lane].speed, q.n, B.kinds[q.kind].big];
  const lights = lifeMesh('boat-lights', sq, material, fleet.length, (i) => carOf(fleet[i]));
  scene.add(lights);
  await ctx.yield();
  // the wakes: one square, an instance for each length of each boat's wake
  const cuts = B.wake.cuts, SEG = cuts.length - 1, wsq = lifeSquares();
  wsq.add(2, [0, 0, 0], [0, 0, 0], B.wake.half, 0.37, B.wake.long, B.wake.spread, [B.wake.level, B.wake.level, B.wake.level]);
  const wakes = lifeMesh('boat-wakes', wsq, material, fleet.length * SEG, (i) => carOf(fleet[Math.floor(i / SEG)]));
  scene.add(wakes);
  await ctx.yield();
  const o = { x: 0, z: 0, yaw: 0 }, we = wakes.instanceMatrix.array, le = lights.instanceMatrix.array, at = new Float64Array((SEG + 1) * 4);
  we.fill(0);
  return { fleet, rounds, triangles: hulls[0].triangles + hulls[1].triangles + sq.count * 2 * fleet.length + 2 * SEG * fleet.length, calls: 4,
    place(time) {
      for (let i = 0; i < fleet.length; i++) {
        const q = fleet[i], lane = rounds[q.lane], K = B.kinds[q.kind], d = boatAlong(q, lane, time);
        roundPlace(lane, d, o);
        const y = WY + B.heave * Math.sin(time * 0.9 + q.n * 40), roll = B.roll * Math.sin(time * 0.7 + q.n * 23);
        writeMover(hulls[q.kind].mesh.instanceMatrix.array, q.slot, o.x, y, o.z, o.yaw, roll);
        writeMover(le, i, o.x, y, o.z, o.yaw, roll);
        le[i * 16 + 3] = boatPace(o.x) - 1;                 // how much faster than its round's speed it runs here: its steam trails by its true speed
        // the wake: where the stern was when the hull's middle was each cut's metres further back along the
        // round (so the first is the stern itself), and the way across the wake there
        const len = B.wake.long * K.big;
        for (let k = 0; k <= SEG; k++) {
          roundPlace(lane, Math.max(0, d - cuts[k] * len), o);
          const c = Math.cos(o.yaw), s = Math.sin(o.yaw);
          at[k * 4] = o.x - c * K.half; at[k * 4 + 1] = o.z + s * K.half; at[k * 4 + 2] = s; at[k * 4 + 3] = c;
        }
        for (let k = 0; k < SEG; k++) {
          const w = (i * SEG + k) * 16, a = k * 4, b = a + 4;
          we[w] = at[a]; we[w + 1] = at[a + 1]; we[w + 2] = at[b]; we[w + 3] = at[b + 1];
          we[w + 4] = at[a + 2]; we[w + 5] = at[a + 3]; we[w + 6] = at[b + 2]; we[w + 7] = at[b + 3];
          we[w + 8] = cuts[k]; we[w + 9] = cuts[k + 1];
        }
      }
      hulls[0].mesh.instanceMatrix.needsUpdate = true; hulls[1].mesh.instanceMatrix.needsUpdate = true; lights.instanceMatrix.needsUpdate = true; wakes.instanceMatrix.needsUpdate = true;
    },
    // (an instanced mesh's own dispose frees its instances' buffers, which the geometry's does not hold)
    dispose() { for (const h of hulls) { h.mesh.geometry.dispose(); h.mesh.dispose(); } lights.geometry.dispose(); lights.dispose(); wakes.geometry.dispose(); wakes.dispose(); } };
}

// ---- THE CARRIAGES. INVENTED BY NEED (no source line names them; figures.md E rules out motor cars and electric
// trams, which leaves the horse cab for the gaslit streets of 1889; the traffic is of the place, its lines and
// its spacing are this world's): plain horse
// cabs, each a dark box on four wheels behind a plain dark block of a horse, with one warm lamp. They keep to
// the roads this world has: the far bank's quay, the tower bank's quay outside the exposition's fences, the two
// avenues beside the grounds, the avenue across their far end, the next stone bridge upstream (the next bridge
// downstream is SOURCED as a footbridge and carries none: src-site.md, "passerelle metallique pietonniere") and the streets
// the built blocks leave open behind the two avenues. NONE GOES ON THE FLOWN BRIDGE'S ROADWAY: it is an empty lane.
// EVERY CAB'S PLACE IS A PURE FUNCTION OF THE WORLD'S CLOCK: it keeps one lane (a line laid once at build) and
// that lane's one speed, its metres along the lane are its own start plus speed times the clock, and at the lane's
// end it comes in again at the lane's beginning. A lane's two ends lie 1,100 m up or down the river or out along
// the far avenue, far off and small in the dusk (the fog takes a third of a cab there, no more), or it is a
// closed round and has none. Lanes that meet at a corner keep to their own
// side of it and a round keeps its blocks on its right hand, so no two lanes cross.
// THE ENTRY FAN (ENTRY_FAN) lies across the far quay's road behind the route's start, so no lane runs through
// there: the far quay's cabs below it come about on the road before it and go back down, those above it come about
// beyond it, one round within the other, the outer going on over the next bridge.
// THE STREETS' ROUNDS: behind each avenue's row of blocks, a cab goes round a few blocks of the city's own lattice
// (down the avenue's kerb, in along a cross street, up the street behind and out again), only by streets no block
// is built across. TWO FORMS, A LEVEL OF DETAIL DECIDED AT BUILD BY WHERE THE ROUTE RUNS (order L1), never by the
// eye: on the quays, the bridge and the avenues' through lanes the whole cab; on the streets' rounds, which the
// flown line never comes within 125 m of and passes high above, three plain dark blocks (body, driver, horse)
// under the same lamp. THE COUNT of each scales with the deal's density (order L6).
// CLEAR AIR (order L5), along every lane's whole length: no cab comes within 100 m of the flown line (its own
// reach taken off), none within 10 m of the entry fan or of the round about the start (its reach taken off
// likewise), which keeps the far quay's turns out of a lens that stands some way off the fan's axis.
const CABS = {
  spacing: 90, streets: 62,                              // metres between two cabs of a lane at density 1: the through lanes, the streets' rounds
  end: 1100,                                             // a lane runs this far up or down the river (or out along the far avenue) before it wraps
  quay: [RIVER_HALF + 4.8, RIVER_HALF + 8, RIVER_HALF + 15, RIVER_HALF + 18.5],   // four lines on a quay's road, in metres from the river's middle: beside the parapet, the river's side, the houses' side, by the houses' kerb
  avenue: [GROUNDS_X + 11, GROUNDS_X + 19],              // two lines down an avenue, as |x|: the fence's side and the houses' side
  far: 5,                                                // the two lines of the avenue across the far end lie this far either side of its middle
  bridge: 3,                                             // the two lines on the upstream bridge, either side of its middle
  round: [24, 25, 90],                                   // before the flown bridge's far ramp the far quay's lines swing this far out round its foot, between these |x|
  fan: 14,                                               // the far quay's lanes keep this far from the entry fan and its round (a cab's own reach and 10 m)
  kerb: [4.5, 5.5, 3],                                   // a streets' round keeps this far from its blocks' faces, this far on the avenue's side; its corners are cut by the last
  rows: [-1, -13, 3, 2],                                 // the streets' rounds: the lattice's rows they take beside each avenue (first and last), the most rows and the most columns of blocks in one
  speeds: [3.1, 4.1],                                    // a trot, in metres a second: each lane takes its own between these
  lamp: { colour: [1.0, 0.66, 0.3], level: 3.0, globe: 0.13, pool: 2.6, poolLevel: 0.22 },
};
// THE LANES, each a line of points [x, y, z] with the metres along it to each point: { pts, acc, total, speed,
// far: true on a streets' round }
function cabLanes() {
  const C = CABS, G = FRAME.groundY, E = C.end, [QP, QR, QH, QK] = C.quay, [AV0, AV1] = C.avenue, FZ = FRAME.farAvenue.z, BX = RV.upstreamBend.x, lanes = [], fan = entryFan();
  // a place on a quay's road at station x on a bank (+1 the tower's, -1 the far one), `off` from the river's middle;
  // the far bank's swings out round the foot of the flown bridge's ramp and climbs the hill's first rise with the ground
  const at = (bank, off, x) => {
    const t = Math.min(1, Math.max(0, (Math.abs(x) - C.round[1]) / (C.round[2] - C.round[1]))), out = bank < 0 ? C.round[0] * (1 - t * t * (3 - 2 * t)) : 0;
    const p = riverSide(x, bank * (off + out));
    return [p[0], bank < 0 ? G + hillY(p[0], p[1]) : G, p[1]];
  };
  // a quay's line from station xa to xb
  const quay = (pts, bank, off, xa, xb) => { const n = Math.max(1, Math.ceil(Math.abs(xb - xa) / 10)); for (let k = 0; k <= n; k++) pts.push(at(bank, off, xa + (xb - xa) * k / n)); };
  // the half turn on the far quay's road at station x that takes a cab from the line offA to the line offB,
  // bulging up the river (way +1) or down it (-1)
  const about = (pts, offA, offB, x, way) => { const mid = (offA + offB) / 2, r = Math.abs(offB - offA) / 2; for (let k = 1; k < 8; k++) { const a = Math.PI * k / 8; pts.push(at(-1, mid + (offA - mid) * Math.cos(a), x + way * r * Math.sin(a))); } };
  // the station at which a line `off` from the river's middle on the tower's bank meets the avenue's line at x
  const meet = (off, x) => { let s = x; for (let k = 0; k < 20; k++) s += x - riverSide(s, off)[0]; return s; };
  // across the upstream bridge on the line lx metres from its middle, from the far bank's line offA to the tower bank's offB (or back)
  const bridge = (pts, lx, offA, offB) => {
    const s = riverSlope(BX), h = Math.hypot(1, s), c = riverSide(BX, 0), n = 16;
    for (let k = 0; k <= n; k++) {
      const lz = offA + (offB - offA) * k / n, t = Math.min(1, Math.max(0, (RIVER_HALF + 4 - Math.abs(lz)) / 4));
      pts.push([c[0] + (lx - lz * s) / h, G + 0.5 * t * t * (3 - 2 * t), c[1] + (lx * s + lz) / h]);
    }
  };
  const lane = (pts, far) => {
    const acc = [0], n = lanes.length;
    for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
    lanes.push({ pts, acc, total: acc[acc.length - 1], speed: C.speeds[0] + (C.speeds[1] - C.speeds[0]) * hash01(n, 95), far: !!far });
  };
  // where the far quay's lanes come about either side of the entry fan and its round: the nearest stations, found
  // from the fan itself, at which a half turn between the road's outer lines keeps C.fan metres from both (stepped
  // 2 m at a time up the river from below the round, and from well above the fan down it)
  const turnClear = (x, way) => { const p = []; about(p, QP, QK, x, way); p.push(at(-1, QP, x), at(-1, QK, x)); return p.every((q) => fan.near(q[0], q[2]) >= C.fan); };
  let below = ROUTE.curve.x[0] - ENTRY_FAN.round - 3 * C.fan, above = ROUTE.curve.x[0] + 2 * ENTRY_FAN.back;
  while (turnClear(below + 2, 1) && below < above) below += 2;
  while (turnClear(above - 2, -1) && above > below) above -= 2;
  let p;
  // the far quay below the fan: up by the river from the lower end, about before the fan, down again by the houses
  p = []; quay(p, -1, QR, -E, below); about(p, QR, QH, below, 1); quay(p, -1, QH, below, -E); lane(p);
  // the far quay above the fan: down by the houses from the upper end, about beyond the fan, up again by the river
  p = []; quay(p, -1, QH, E, above); about(p, QH, QR, above, -1); quay(p, -1, QR, above, E); lane(p);
  // down the far quay by the houses' kerb, about round that turn and up beside the parapet, over the bridge, back
  // down the tower's quay, down the upstream avenue and out along the far avenue
  p = []; quay(p, -1, QK, E, above); about(p, QK, QP, above, -1); quay(p, -1, QP, above, BX - C.bridge - 4); bridge(p, -C.bridge, -QP + 4, QP - 4); quay(p, 1, QP, BX - C.bridge - 4, meet(QP, AV0));
  p.push([AV0, G, FZ + C.far], [E, G, FZ + C.far]); lane(p);
  // in along the far avenue, up the upstream avenue and away up the tower's quay by the houses
  p = [[E, G, FZ - C.far], [AV1, G, FZ - C.far]]; quay(p, 1, QH, meet(QH, AV1), E); lane(p);
  // down the tower's quay from upstream, over the bridge and away up the far quay
  p = []; quay(p, 1, QR, E, BX + C.bridge + 4); bridge(p, C.bridge, QR - 4, -QP + 4); quay(p, -1, QP, BX + C.bridge + 4, E); lane(p);
  // the downstream side: in along the tower's quay by the houses, down the avenue and out along the far avenue; and back the other way
  p = []; quay(p, 1, QH, -E, meet(QH, -AV1)); p.push([-AV1, G, FZ - C.far], [-E, G, FZ - C.far]); lane(p);
  p = [[-E, G, FZ + C.far], [-AV0, G, FZ + C.far]]; quay(p, 1, QR, meet(QR, -AV0), -E); lane(p);
  // THE STREETS' ROUNDS beside each avenue (side +1 upstream, -1 downstream), from the lattice of the city's own
  // plan: rows are taken from the far avenue toward the river, a round takes the fewest columns of blocks from the
  // avenue whose far street no block of its rows is built across, and neighbouring rows with the same columns go
  // into one round; a row with no open street within C.rows[3] columns has no round. Each round goes with its
  // blocks on its right hand: down the avenue's kerb on the upstream side, up it on the downstream side.
  const L = CITY.left, [K0, K1, CUT] = C.kerb, [J1, J0, ROWS, COLS] = C.rows;
  const columns = (side, j) => { for (let c = 0; c < COLS; c++) if (!blockJoined(side > 0 ? c : -8 - c, j)) return c + 1; return 0; };
  for (const side of [1, -1]) for (let j = J1; j >= J0;) {
    const cols = columns(side, j);
    let rows = 1;
    while (cols && rows < ROWS && j - rows >= J0 && columns(side, j - rows) === cols) rows++;
    if (cols) {
      const zT = blockRowZ(j) + L.pz - STREET + K0, zB = blockRowZ(j - rows + 1) - K0, xA = side * (L.x0 - K1), xF = side * (L.x0 + cols * L.px - STREET + K0);
      const x0 = Math.min(xA, xF), x1 = Math.max(xA, xF), q = [];
      // (the corners in the order a cab takes them, each cut by CUT metres)
      for (const [cx, cz, ix, iz, ox, oz] of [[x1, zT, 0, 1, -1, 0], [x0, zT, -1, 0, 0, -1], [x0, zB, 0, -1, 1, 0], [x1, zB, 1, 0, 0, 1]])
        q.push([cx - ix * CUT, G, cz - iz * CUT], [cx - (ix - ox) * CUT * 0.3, G, cz - (iz - oz) * CUT * 0.3], [cx + ox * CUT, G, cz + oz * CUT]);
      q.push(q[0]);
      lane(q, true);
    }
    j -= rows;
  }
  return lanes;
}
// a lane's place at d metres along it: out.x, out.y, out.z (nothing is made here)
function lanePoint(lane, d, out) {
  const acc = lane.acc, pts = lane.pts;
  let lo = 0, hi = acc.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (acc[mid] <= d) lo = mid; else hi = mid; }
  const a = pts[lo], b = pts[hi], t = Math.min(1, Math.max(0, (d - acc[lo]) / Math.max(1e-6, acc[hi] - acc[lo])));
  out.x = a[0] + (b[0] - a[0]) * t; out.y = a[1] + (b[1] - a[1]) * t; out.z = a[2] + (b[2] - a[2]) * t;
  return out;
}
// THE CABS: each { lane, d0: its metres along the lane at clock 0, n: a number of its own }; the through lanes'
// first, then the streets' rounds' (the lanes are laid in that order)
function cabFleet(lanes, density) {
  const cabs = [];
  lanes.forEach((lane, l) => {
    const count = Math.max(1, Math.round(lane.total / (lane.far ? CABS.streets : CABS.spacing) * density));
    for (let k = 0; k < count; k++) { const id = l * 256 + k; cabs.push({ lane: l, d0: lane.total * (k + 0.5 + 0.6 * (hash01(id, 96) - 0.5)) / count, n: hash01(id, 97) }); }
  });
  return cabs;
}
// ONE CAB, laid by the kit's Builder in its own frame: +X the way it goes, Y up from the road, the cab's body over
// the origin. Plain dark shapes: the closed body on four wheels (eight-sided discs), the driver's box with a plain
// block for the driver, two shafts, and the horse as a block of a body on two blocks of legs with a block of a
// neck and head; one small lit lamp at the body's front corner. Nothing on it is lettered; no figure has a face.
function layCab(b) {
  const BODY = S.lin('#15171c'), WHEEL = S.lin('#211d19'), HORSE = S.lin('#2b221b'), COAT = S.lin('#1b1c20'), LIT = S.lin('#ffc97a');
  b.col(BODY, 0.8, 1.1).surf(S.SURF.PLAIN);
  b.box(-1.25, 0.7, -0.72, 0.6, 2.1, 0.72, { bottom: true });                              // the body
  b.box(0.6, 0.85, -0.6, 1.2, 1.45, 0.6, { bottom: true });                                // the driver's box
  b.col(COAT).box(0.7, 1.45, -0.26, 1.08, 2.3, 0.26);                                      // the driver, a plain block
  b.col(WHEEL);
  for (const [x, r] of [[-0.6, 0.64], [0.75, 0.5]]) for (const sz of [-1, 1]) {
    const z = sz * 0.82, at = (k) => { const a = sz * k * Math.PI / 4; return [x + r * Math.cos(a), r + r * Math.sin(a), z]; };
    for (let k = 1; k <= 6; k++) b.tri(at(0), at(k), at(k + 1));
  }
  for (const sz of [-1, 1]) b.box(1.2, 1.05, sz * 0.42 - 0.03, 2.2, 1.12, sz * 0.42 + 0.03, { bottom: true });   // the shafts
  b.col(HORSE, 0.8, 1.05);
  b.box(2.0, 0.95, -0.3, 3.7, 1.7, 0.3, { bottom: true });                                 // the horse's body
  b.box(2.05, 0, -0.26, 2.3, 0.95, 0.26).box(3.35, 0, -0.26, 3.6, 0.95, 0.26);             // hind and fore legs, each pair one block
  b.box(3.5, 1.5, -0.17, 4.0, 2.25, 0.17, { bottom: true });                               // neck and head
  b.col(LIT).surf(S.SURF.GLOW, 0, 1.1).box(0.62, 1.62, 0.74, 0.8, 1.86, 0.92, { bottom: true });   // the lamp
  return b;
}
// THE CAB OF THE STREETS' ROUNDS, in the same frame and to the same sizes: three plain dark blocks, the closed
// body down to its axles, the driver on his box, the horse; no lit box (the lamp's own square is its light)
function layFarCab(b) {
  b.col(S.lin('#15171c'), 0.8, 1.1).surf(S.SURF.PLAIN).box(-1.25, 0.3, -0.72, 0.6, 2.1, 0.72);
  b.col(S.lin('#1b1c20')).box(0.6, 0.85, -0.5, 1.2, 2.3, 0.5);
  b.col(S.lin('#2b221b'), 0.8, 1.05).box(2.0, 0.35, -0.3, 3.8, 1.75, 0.3);
  return b;
}
const CAB_LAMP = [0.71, 1.74, 0.83];                     // the lamp's place on a cab
// THE CABS DRAWN: every whole cab an instance of the one cab and every cab of the streets' rounds an instance of
// its three blocks, both on the kit's material (two calls), and every cab's lamp and its pool of light on the road
// as instances of one piece of squares (one call). All three ride on one buffer of matrices (the whole cabs first).
// Returns place(time): the update's writes, matrices only.
async function buildCabs(ctx, scene, mats, material, density) {
  const C = CABS, lanes = cabLanes(), cabs = cabFleet(lanes, density), L = C.lamp, whole = cabs.filter((c) => !lanes[c.lane].far).length;
  await ctx.yield();
  const e = new Float32Array(cabs.length * 16), meshes = [];
  for (const [name, b, from, count] of [['cabs', layCab(new S.Builder(256)), 0, whole], ['cabs-streets', layFarCab(new S.Builder(64)), whole, cabs.length - whole]]) {
    const mesh = new THREE.InstancedMesh(b.toGeometry(), mats.facade, Math.max(1, count));
    mesh.instanceMatrix = new THREE.InstancedBufferAttribute(e.subarray(from * 16, (from + Math.max(1, count)) * 16), 16);
    mesh.count = count; mesh.name = name; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
    scene.add(mesh); meshes.push({ mesh, triangles: b.triangles * count });
    await ctx.yield();
  }
  const sq = lifeSquares();
  sq.add(4, [1.6, 0.1, 0.5], [1.6, 0.1, 0.5], L.pool, 0.3, 0, 0, L.colour.map((v) => v * L.level * L.poolLevel));
  sq.add(0, CAB_LAMP, CAB_LAMP, L.globe, 0.6, 0, 0, L.colour.map((v) => v * L.level));
  const lights = lifeMesh('cab-lamps', sq, material, cabs.length, (i) => [0, lanes[cabs[i].lane].speed, cabs[i].n, 1]);
  lights.instanceMatrix = new THREE.InstancedBufferAttribute(e, 16);   // the lamps ride on the cabs' own matrices
  scene.add(lights);
  await ctx.yield();
  const p = { x: 0, y: 0, z: 0 }, q = { x: 0, y: 0, z: 0 };
  return { lanes, cabs, whole, triangles: meshes[0].triangles + meshes[1].triangles + sq.count * 2 * cabs.length, calls: 3,
    place(time) {
      for (let i = 0; i < cabs.length; i++) {
        const c = cabs[i], lane = lanes[c.lane], d0 = c.d0 + lane.speed * time, d = d0 - Math.floor(d0 / lane.total) * lane.total;
        // its heading from the lane a little behind and a little before it; a trot's small rise and fall by the clock
        lanePoint(lane, Math.max(0, d - 1.5), p); lanePoint(lane, Math.min(lane.total, d + 1.5), q);
        const yaw = Math.atan2(-(q.z - p.z), q.x - p.x);
        lanePoint(lane, d, p);
        writeMover(e, i, p.x, p.y + 0.025 * (1 + Math.sin(time * 9 + c.n * 60)), p.z, yaw);
      }
      meshes[0].mesh.instanceMatrix.needsUpdate = true; meshes[1].mesh.instanceMatrix.needsUpdate = true; lights.instanceMatrix.needsUpdate = true;
    },
    dispose() { for (const m of meshes) { m.mesh.geometry.dispose(); m.mesh.dispose(); } lights.geometry.dispose(); lights.dispose(); } };
}
// ---- STEAM AND SMOKE. THE LITTLE RAILWAY'S TRAIN: SOURCED, the narrow-gauge
// line's trench behind the quay houses and its tunnel at the axis (figures.md B, "Decauville trench"); INVENTED BY
// NEED (the sources give the line, not its stock): a small tank engine and four open cars under canvas roofs, plain
// and dark, a lamp under each roof, and the engine's plume of steam. NOT BUILT: its run along the fence to the
// terminus (this world lays no track there). CHIMNEY SMOKE: INVENTED BY NEED (no source line names it; a city of
// coal fires at night): a slow grey plume from one in five of the near houses' stacks and from two in five of the quay houses, each
// given a plain stack; lit warm from below by the streets' gas while it is low, pale under the sky above.
// THE TRAIN'S PLACE IS A PURE FUNCTION OF THE WORLD'S CLOCK: it goes to and fro along the trench's middle, through
// the tunnel under the bridge's approach, easing to a stand at each end; its plume trails by its speed at that
// clock and leans with the wind. While the engine is in the tunnel its plume is drawn down under the ground, and
// comes up again as it leaves the mouth. Every puff is a square TURNED TO THE EYE (the lawful reading named above).
// CLEAR AIR (order L5): over the train's whole round no puff of its steam comes within 14 m of the flown line
// (its radius taken off); a chimney smokes only where, counted at build from the route's own curve,
// every puff of its plume keeps 8 m and its own radius from the line and its own radius and a metre from the entry
// fan (ENTRY_FAN: no puff of smoke drifts where the lens stands behind the start).
const TRAIN = {
  off: (CUT_OFF0 + CUT_OFF1) / 2,                        // the track lies down the trench's middle
  reach: CUT_END - 25,                                   // the train's middle goes this far up and down the river from the axis: short of the trench's end walls
  round: 230,                                            // seconds for the run there and back
  rail: 0.15,                                            // the rails' height over the trench's floor
  loco: 4.2, car: 5.6, gap: 0.5, cars: 4,                // lengths in metres: the engine, a car, the gap between two
  funnelTop: 2.9,                                        // the funnel's top over the rails
  sink: [30, 60, 12],                                    // the plume is wholly under the ground while the funnel is within the first of these of the axis, wholly up beyond the second; how far down it goes
};
const TRAIN_LONG = TRAIN.loco + TRAIN.cars * (TRAIN.car + TRAIN.gap), TRAIN_FUNNEL = TRAIN_LONG / 2 - 0.6, TRAIN_FAST = TRAIN.reach * 6 / TRAIN.round;   // its length; the funnel's place from its middle; its speed at the middle of a run
// the train at a clock: out.x its middle's station along the river, out.v its speed there (+ upstream), metres a second
function trainStation(time, out) {
  const T = TRAIN, p = time / T.round - Math.floor(time / T.round), tri = 4 * Math.abs(p - 0.5) - 1;
  out.x = T.reach * tri * (1.5 - 0.5 * tri * tri);
  out.v = T.reach * 1.5 * (1 - tri * tri) * (p < 0.5 ? -4 : 4) / T.round;
  return out;
}
// THE TRAIN, laid by the kit's Builder in its own frame: +X upstream (the engine's end), Y up from the rails, its
// middle over the origin. Plain shapes: the engine's frame, boiler, cab, dome and funnel with one lit lamp before
// it; each car a floor, a bench down its middle, four posts and a pale canvas roof with a lit lamp under it.
function layTrain(b) {
  const T = TRAIN, IRON = S.lin('#1d2226'), ENGINE = S.lin('#1e2a26'), TIMBER = S.lin('#4a3b2e'), PALE = S.lin('#cfc5ae'), LIT = S.lin('#ffc97a');
  const x1 = TRAIN_LONG / 2, x0 = x1 - T.loco;
  b.col(IRON, 0.8, 1.1).surf(S.SURF.PLAIN).box(x0, 0.3, -0.7, x1, 0.85, 0.7, { bottom: true });
  b.col(ENGINE, 0.8, 1.1).box(x0 + 1.5, 0.85, -0.5, x1 - 0.1, 1.9, 0.5);                    // the boiler
  b.box(x0, 0.85, -0.75, x0 + 1.5, 2.45, 0.75, { capColor: IRON });                        // the cab
  b.col(IRON).cyl(TRAIN_FUNNEL, 1.9, 0, 0.2, 0.16, T.funnelTop - 1.9, 8).cyl(x0 + 2.4, 1.9, 0, 0.26, 0.2, 0.35, 8);
  b.col(LIT).surf(S.SURF.GLOW, 0, 1.2).box(x1 - 0.1, 1.55, -0.14, x1 + 0.12, 1.85, 0.14, { bottom: true });   // the engine's lamp
  for (let k = 0; k < T.cars; k++) {
    const c = x0 - T.gap - T.car / 2 - k * (T.car + T.gap), h = T.car / 2;
    b.col(TIMBER, 0.7, 1).surf(S.SURF.PLANKS, 0, 1).box(c - h, 0.4, -0.8, c + h, 0.62, 0.8, { bottom: true });
    b.col(IRON).surf(S.SURF.PLAIN).box(c - h + 0.4, 0.62, -0.3, c + h - 0.4, 1.1, 0.3);     // the bench
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cbox(c + sx * (h - 0.1), 0.62, sz * 0.74, 0.08, 1.7, 0.08, { top: false });
    b.col(PALE, 0.85, 1).surf(S.SURF.CANVAS, 0, 1).box(c - h - 0.1, 2.32, -0.95, c + h + 0.1, 2.42, 0.95, { bottom: true });
    b.col(LIT).surf(S.SURF.GLOW, 0, 0.9).cbox(c, 2.1, 0, 0.2, 0.2, 0.2, { bottom: true });   // the lamp under the roof
    // INVENTED BY NEED (the cars are open under their roofs; from the garden the train read as a dark bar): the
    // lamp-lit inside shown as three lit openings a side between the roof and the rail
    b.surf(S.SURF.GLOW, 0, 0.7);
    for (let w = 0; w < 3; w++) {
      const a = c - h + 0.25 + w * (T.car - 0.5) / 3, e = a + (T.car - 0.5) / 3 - 0.22;
      b.wall(a, 0.72, e, 0.72, 1.25, 2.2).wall(e, -0.72, a, -0.72, 1.25, 2.2);
    }
  }
  return b;
}
// THE CHIMNEYS' SMOKE. INVENTED BY NEED (no line of the sources gives it: the houses of 1889 burned coal, and a
// quarter of roofs at dusk with nothing rising from it stands dead; order L9).
// WORKING: a chimney's plume is `puffs` squares, each born at its stack, living `life` seconds, rising `rise`
// metres and growing from 0.7 to 3.1 times `size` (times its plume's own size), a warm grey; the train's plume
// has its own such numbers, quicker and white; `quay` and `city` are the shares of the quay houses and of the near
// houses that smoke; `clear` is the clear air a plume must keep from the flown line; a quay house's stack is `stack` square.
const SMOKE = { puffs: 18, life: 14, rise: 10, size: 1.6, tint: [0.62, 0.58, 0.55], train: { puffs: 12, life: 5, rise: 5, size: 1.3 }, quay: 0.4, city: 0.2, clear: 8, stack: 0.7 };
// whether a plume born at p keeps the line's clear air and keeps out of the entry fan: every puff through its
// whole life, its radius and its wander taken off; `low` holds the route's own points (x, y, z in turn, two metres
// apart), `fan` the entry fan
function plumeClear(p, big, low, fan) {
  const K = SMOKE;
  for (let k = 0; k <= 8; k++) {
    const a = k / 8, t = a * K.life, x = p[0] + WIND.x * t, y = p[1] + K.rise * big * (1 - (1 - a) * (1 - a)), z = p[2] + WIND.z * t;
    const r = K.size * big * (0.7 + 2.7 * a) + K.clear + 1, r2 = r * r;
    if (fan.gap(x, z) < r - K.clear) return false;
    for (let i = 0; i < low.length; i += 3) if ((low[i] - x) ** 2 + (low[i + 1] - y) ** 2 + (low[i + 2] - z) ** 2 < r2) return false;
  }
  return true;
}
// the route's own points where it flies under 70 m, two metres apart: x, y, z in turn
function routeLow() {
  const C = ROUTE.curve, low = [];
  for (let i = 0; i < C.count; i += 4) if (C.y[i] < 70) low.push(C.x[i], C.y[i], C.z[i]);
  return low;
}
// THE CHIMNEYS THAT SMOKE, each { p: its stack's top, big: its plume's size, n: a number of its own }, chosen by
// each house's own number; one whose plume would come too near the flown line does not smoke. Of the quay houses
// (each also carries its stack's place in the house's own frame, for the stack laid on it):
function quayChimneys() {
  const K = SMOKE, G = FRAME.groundY, low = routeLow(), fan = entryFan(), quay = [];
  for (let h = 0; h < QH.count; h++) {
    if (hash01(h, 88) >= K.quay) continue;
    const q = quayHouse(h), [px, pz] = riverSide(q.x, q.off), ry = -Math.atan(riverSlope(q.x)), lx = 0.36 * q.w;
    const top = q.kind === 5 ? G + q.H * 0.55 + 1.6 : G + q.H + 0.7, big = 0.7 + 0.3 * hash01(h, 89);
    const p = [px + lx * Math.cos(ry), top, pz - lx * Math.sin(ry)];
    if (plumeClear(p, big, low, fan)) quay.push({ p, big, n: hash01(h, 90), frame: [px, pz, ry, lx] });
  }
  return quay;
}
// and of the near houses of the city, at the stacks housesBlock lays on them:
function cityChimneys(nearBlocks) {
  const K = SMOKE, G = FRAME.groundY, low = routeLow(), fan = entryFan(), city = [];
  for (const blk of nearBlocks) {
    const poly = blk.poly, n = poly.length, DEEP = 13;
    for (let i = 0; i < n; i++) {
      const a = poly[i], c = poly[(i + 1) % n], dx = c[0] - a[0], dz = c[1] - a[1], len = Math.hypot(dx, dz), run = len - DEEP;
      if (run < 9) continue;
      const count = Math.max(1, Math.round(run / 19));
      for (let k = 0; k < count; k++) {
        const hid = blk.id * 64 + i * 8 + k;
        if (hash01(hid, 98) >= K.city) continue;
        const lx = run * k / count + 0.5, lz = -DEEP / 2, big = 0.8 + 0.4 * hash01(hid, 99);
        const p = [a[0] + (lx * dx - lz * dz) / len, G + 16.5 + 6 * hash01(hid, 31) + 0.5 + MANSARD + 1.3, a[1] + (lx * dz + lz * dx) / len];
        if (plumeClear(p, big, low, fan)) city.push({ p, big, n: hash01(hid, 94) });
      }
    }
  }
  return city;
}
// a plain stack on each quay house that smokes, laid into the bank's builder
function layQuayStacks(b, quay) {
  b.col(S.lin(CITY_STACK), 0.8, 1).surf(S.SURF.PLAIN);
  for (const q of quay) { b.tr(q.frame[0], 0, q.frame[1], q.frame[2]); b.cbox(q.frame[3], q.p[1] - 2.8, 0, SMOKE.stack, 2.8, SMOKE.stack); b.pop(); }
}
// THE TRAIN AND THE SMOKES DRAWN: the train one rigid piece on the kit's material (one call), its plume one piece
// of squares (one call), every chimney's plume an instance of one plume of squares (one call). Returns
// place(time): the update's writes, matrices only.
async function buildSmokes(ctx, scene, mats, material, chimneys) {
  const T = TRAIN, K = SMOKE, b = layTrain(new S.Builder(512));
  const train = new THREE.Mesh(b.toGeometry(), mats.facade);
  train.name = 'train'; train.matrixAutoUpdate = false; train.frustumCulled = false;
  scene.add(train);
  await ctx.yield();
  const plume = (P) => { const sq = lifeSquares(); for (let k = 0; k < P.puffs; k++) sq.add(1, [0, 0, 0], [0, 0, 0], P.size, (k + 0.37) / P.puffs, P.life, P.rise, [1, 1, 1]); return sq; };
  const steam = lifeMesh('train-steam', plume(K.train), material, 1, () => [0, TRAIN_FAST, 0.5, 1]);
  const mesh = lifeMesh('smokes', plume(K), material, chimneys.length, (i) => [0, 0, chimneys[i].n, chimneys[i].big], () => K.tint);
  const e = steam.instanceMatrix.array, o = { x: 0, v: 0 }, railY = FRAME.groundY - RC.depth + T.rail;
  chimneys.forEach((c, i) => writeMover(mesh.instanceMatrix.array, i, c.p[0], c.p[1], c.p[2], 0));
  scene.add(steam, mesh);
  await ctx.yield();
  return { triangles: b.triangles + 2 * K.train.puffs + 2 * K.puffs * chimneys.length, calls: 3,
    place(time) {
      trainStation(time, o);
      const s = riverSlope(o.x), h = Math.hypot(1, s), px = o.x - s * T.off / h, pz = riverZ(o.x) + T.off / h, yaw = -Math.atan(s);
      train.matrix.makeRotationY(yaw).setPosition(px, railY, pz); train.matrixWorldNeedsUpdate = true;
      // the plume at the funnel's top: drawn down while the funnel is in the tunnel; the first column of its matrix
      // carries the train's speed at this clock beside its speed at the middle of a run (the program's trail reads it)
      const fx = px + Math.cos(yaw) * TRAIN_FUNNEL, fz = pz - Math.sin(yaw) * TRAIN_FUNNEL, k = o.v / TRAIN_FAST;
      const out = Math.min(1, Math.max(0, (Math.abs(fx) - T.sink[0]) / (T.sink[1] - T.sink[0]))), down = 1 - out * out * (3 - 2 * out);
      writeMover(e, 0, fx, railY + T.funnelTop - T.sink[2] * down, fz, yaw);
      e[0] *= k; e[2] *= k;
      steam.instanceMatrix.needsUpdate = true;
    },
    dispose() { train.geometry.dispose(); steam.geometry.dispose(); steam.dispose(); mesh.geometry.dispose(); mesh.dispose(); } };
}
// ---- THE CROWD (src-site.md "Crowds", de Vogüé: "en rangs pressés, autour des bassins"; "reflue sous les arches").
// SOURCED: a great crowd in ranks round the basins and under the tower's arches on the evenings of the lights.
// INVENTED BY NEED (the sources give a crowd, not a build for a visitor; the dress is the common dress of 1889, no
// line of research gives a cut): each is a plain figure WITHOUT A FACE OR A FEATURE, its head a plain prism of ONE
// tone (the same for all). A MAN: two trouser legs, a coat to the hips or the knee, broader at the shoulders, a
// pale shirt front, two arms, a hat with a brim and a crown (tall or low). A WOMAN: a long skirt to the ground,
// full behind below a narrow waist, a fitted bodice, two arms, a hat with a brim and a trimmed point. A child is
// either, smaller. Heights, girths, coat lengths, hats and tones are each figure's own. No named person.
// TWO LEVELS OF DETAIL, DECIDED AT BUILD BY THE ROUTE (order L1, never by the eye): a figure any step of whose walk
// lies within CROWD.fine metres of the flown line is one of the two whole forms above (43 and 45 triangles);
// every other is the plain form of the same build and tones (16 triangles: skirt or trousers, body and shoulders
// in one three-sided shell with a waist, the head and the hat two crossed upright squares). Two draw calls: the
// plain figures as instances of their one form, the whole ones (two forms) gathered into one geometry.
// WORKING: every size, tone, pace and number, and where they gather beyond the basins and the arches.
// EVERY FIGURE'S PLACE AND POSE IS A PURE FUNCTION OF THE WORLD'S CLOCK: a stroller walks a short loop of its own
// (two straights and two half turns) at its own slow pace from its own start, so it is on its loop at any entry
// clock; BY THE METRES IT HAS WALKED its legs swing fore and aft from the hip and its arms the other way, its body
// sinks a little as the legs part and rises as they pass, its weight goes over the standing leg and a skirt's hem
// swings; one who stands turns a little this way and that, shifts its weight from foot to foot and moves an arm.
// The vertex program places it from the clock uniform; crowdAt() is the same reckoning of its feet in JS, for the
// build's rule.
// THE RULE (order L5 and section 4): NO FIGURE WITHIN CROWD.clear METRES OF THE FLOWN LINE, NOR OF THE LENS'S
// GROUND BEHIND THE START (ENTRY_LENS). It is decided at build from the route's own curve: every figure's whole
// walk is stepped half a metre apart and less, and a figure the upright line of which (feet to hat) at any step
// lies nearer than clear + margin to any point of the curve is not made (the margin holds the body's own reach
// from that upright, CROWD.reach, and the quarter metre between two steps); nor is one any step of which lies in
// the axis's empty lane or on the bridge and its ramps, on a lawn, in water, in the sunk parterre or inside a
// building. THE COUNT scales with the deal's density (order L6).
// THEIR LIGHT: the world's two lights and its fog as every solid has them, the kit's night fill and street glow,
// and, dealt at build from where each walks, the gas or arc lamp nearest it (lit by that lamp's own threshold of
// night) and the coloured light of the basin it stands at (the fountains' own uniform).
// THE GROUND BEHIND THE ENTRY (the rule's second part: the same region by place, for the crowd). While this world is seen through the opening before it, the
// engine draws it by a lens that stands behind the route's start: on the first heading produced back, the further
// back the further off the viewer is, and to the side of that line by the viewer's own bearing from the opening.
// The rule counts that ground as it counts the flown line: no figure is made any step of whose walk lies, in plan
// and so whatever the lens's height, within clear + margin metres of any place up to `back` metres behind the start
// and up to `spread` metres to the side for each metre back (27 degrees either side), nor within clear + margin
// metres of the round of `round` metres about the start: the movers' own ground (ENTRY_FAN), counted here with
// the crowd's 20 m about it.
const ENTRY_LENS = ENTRY_FAN;
const CROWD = {
  clear: 20, margin: 1,                                  // the rule; the metres more that the build keeps: the body's reach and the gap between two steps
  reach: 0.66,                                           // no part of a figure (a hem, a foot at its furthest, an arm, a brim) is further than this from the upright through its feet (the forms' greatest is 0.57 m)
  fine: 35,                                              // WORKING: a figure whose walk comes within this of the flown line is a whole form (the level of detail, by the route)
  tall: 1.8, hip: 0.9, head: '#c2a086',                  // a grown figure to the top of its hat; its hip joint; the one plain tone of every head
  pace: [0.45, 0.95], straight: [3, 11], turn: [0.5, 1.1],   // a stroller's metres a second; half its loop's straight; its turns' radius
  scale: 1.1,                                            // the zones' numbers are multiplied by this and by the density
  gasReach: 5, arcReach: 10, fountReach: 9,              // metres over which a lamp's light on a figure falls away (to 1/e squared at twice this); a basin's from its rim
  gasK: 0.55, arcK: 0.7, fountK: 0.8, deckK: 0.5,        // the share of a lamp's or a basin's light a figure right at it takes; a platform's gas on those who stand there
  men: ['#1c1d22', '#24262e', '#2a2420', '#1f2a3a', '#33302c', '#4a4640', '#3b2f26', '#3c5068'],
  women: ['#e6dcc8', '#d9c7c7', '#c9d3de', '#b9c9b4', '#d8b7a6', '#8e6a7c', '#6f7fa0', '#a8554f', '#efe9dd', '#c6b08a'],
};
// a figure's feet at a clock: out = [x, z, heading]; f carries its loop { x, z, dir, L, r, v, s0 }
function crowdAt(f, time, out) { return crowdLoop(f, f.s0 + f.v * time, out); }
// the same at s metres along its loop
function crowdLoop(f, at, out) {
  const L = f.L, r = Math.max(f.r, 1e-3), P = 4 * L + 2 * Math.PI * r;
  let s = at % P, px, pz, a;
  if (s < 0) s += P;
  if (s < 2 * L) { px = s - L; pz = -r; a = 0; }
  else if (s < 2 * L + Math.PI * r) { const t = (s - 2 * L) / r; px = L + r * Math.sin(t); pz = -r * Math.cos(t); a = t; }
  else if (s < 4 * L + Math.PI * r) { px = L - (s - 2 * L - Math.PI * r); pz = r; a = Math.PI; }
  else { const t = (s - 4 * L - Math.PI * r) / r; px = -L - r * Math.sin(t); pz = r * Math.cos(t); a = Math.PI + t; }
  const c = Math.cos(f.dir), n = Math.sin(f.dir);
  out[0] = f.x + px * c - pz * n; out[1] = f.z + px * n + pz * c; out[2] = f.dir + a;
  return out;
}
const CROWD_VERT = /* glsl */`
attribute vec4 aPart;                    // the piece: 0 skirt or trousers, 1 shirt front, 2 head, 3 hat, 4 coat or bodice, 5 the plain form's head and hat in one; its weight in the skirt's flare; in the hat's brim; in the coat's length (under 0) or the hat's height (over 0)
attribute vec2 aLimb;                    // a limb's swing (a leg 1 or -1, an arm a share the other way) and the height of its joint; 0 for all else
attribute vec4 iLoop;                    // the loop's middle x and z, its bearing, the floor's height
attribute vec4 iWalk;                    // half the straight, the turns' radius, metres a second, the start in metres
attribute vec4 iWho;                     // the figure's scale, its skirt's flare, a number of its own, the pale shirt front's share
attribute vec4 iTone;                    // the cloth's colour; the hat: under 1 a grey, from 1 the cloth's own paled by the rest
attribute vec4 iLamp;                    // the gas lamp's share and its threshold of night, the arc lamp's share and its threshold
attribute vec2 iGlow;                    // the basin whose coloured light falls on it, and its share
uniform float uCrowdTime, uCrowdNight, uNight, uStreetGlow; uniform vec3 uNightFill, uWarm, uCrowdHead, uFount[4];
varying vec3 vCrowd, vCrowdHat, vCrowdLight; varying float vCrowdSplit;
float crowdWalked;                       // the metres the figure has walked at this clock (its start and its pace by the clock)
vec3 crowdFeet(out float turn) {
  crowdWalked = iWalk.w + iWalk.z * uCrowdTime;
  float L = iWalk.x, r = max(iWalk.y, .001), P = 4. * L + 6.2831853 * r, s = mod(crowdWalked, P), a; vec2 p;
  if (s < 2. * L) { p = vec2(s - L, -r); a = 0.; }
  else if (s < 2. * L + 3.14159265 * r) { float t = (s - 2. * L) / r; p = vec2(L + r * sin(t), -r * cos(t)); a = t; }
  else if (s < 4. * L + 3.14159265 * r) { p = vec2(L - (s - 2. * L - 3.14159265 * r), r); a = 3.14159265; }
  else { float t = (s - 4. * L - 3.14159265 * r) / r; p = vec2(-L - r * sin(t), r * cos(t)); a = 3.14159265 + t; }
  float c = cos(iLoop.z), n = sin(iLoop.z), own = iWho.z, still = step(iWalk.z, 1e-4);
  // one who stands turns a little this way and that (the walk's own rise and fall is the body's, below)
  turn = iLoop.z + a + still * .3 * sin(uCrowdTime * (.25 + .4 * own) + own * 40.);
  return vec3(iLoop.x + p.x * c - p.y * n, iLoop.w, iLoop.y + p.x * n + p.y * c);
}`;
const CROWD_NORMAL = /* glsl */`
float crowdTurn; vec3 crowdBase = crowdFeet(crowdTurn); float crowdC = cos(crowdTurn), crowdS = sin(crowdTurn);
vec3 objectNormal = vec3(normal.x * crowdC - normal.z * crowdS, normal.y, normal.x * crowdS + normal.z * crowdC);`;
const CROWD_BEGIN = /* glsl */`
vec3 fig = position;
// the figure's own numbers (three more from its one), whether it stands, whether it wears a skirt
float own = iWho.z, g1 = fract(own * 17.31), g2 = fract(own * 53.7), g3 = fract(own * 91.13), still = step(iWalk.z, 1e-4), go = 1. - still, lady = step(.5, iWho.y);
// THE DRESS: the skirt's flare and the hat's brim (a woman's the wider), a coat to the hips or toward the knee, a
// tall hat or a low one, the figure's girth
fig.xz *= (1. + aPart.y * iWho.y) * (1. + aPart.z * mix(.35 + .3 * g2, .3 + .9 * g2, lady)) * (.9 + .22 * g3);
fig.y += aPart.w < 0. ? aPart.w * .26 * g1 : -aPart.w * mix(.09 * smoothstep(.3, .6, g2), .1 * g1, lady);
// THE WALK, by the metres walked: a step is longer at a quicker pace and for a taller figure; each leg turns about
// the hip, fore and aft, the arms the other way; the body sinks as the legs part (so the feet stay on the
// ground), the weight goes over the standing leg, a skirt's hem swings forward as the legs pass. ONE WHO STANDS
// moves an arm a little, shifts its weight from foot to foot and leans, each at a slow rate of its own.
float stride = (.3 + .42 * iWalk.z) * iWho.x, ph = crowdWalked * 3.14159265 / max(stride, .05);
float legs = go * .57 * (.3 + .42 * iWalk.z) * sin(ph);
float sw = aLimb.x * legs + still * step(abs(aLimb.x), .8) * aLimb.x * .14 * sin(uCrowdTime * (.4 + .5 * g3) + own * 31.), drop = aLimb.y - fig.y;
fig.x += drop * sin(sw) + go * max(aPart.y, 0.) * .03 * cos(2. * ph);
fig.y += drop * (1. - cos(sw)) - go * ${CROWD.hip.toFixed(2)} * (1. - cos(legs));
float high = min(fig.y / .9, 1.);
fig.z += -go * .025 * high * cos(ph) + still * (fig.y * .014 * sin(uCrowdTime * (.5 + .5 * own) + own * 23.) + .02 * high * sin(uCrowdTime * (.3 + .3 * g1) + g2 * 6.28));
fig *= iWho.x;
vec3 transformed = crowdBase + vec3(fig.x * crowdC - fig.z * crowdS, fig.y, fig.x * crowdS + fig.z * crowdC);
// THE TONES: a man's trousers his coat's tone or a greyer one, a woman's bodice her skirt's tone or a darker; the
// hat a grey (under 1) or the cloth's own paled toward straw; the plain form's head and hat are told apart by the
// height on their one piece (vCrowdSplit, in the fragment program)
vec3 crowdHat = iTone.w < 1. ? vec3(iTone.w) : mix(iTone.rgb, vec3(.62, .56, .44), iTone.w - 1.);
vec3 crowdLow = mix(mix(iTone.rgb, vec3(.17, .17, .18), .6 * g1), iTone.rgb, lady), crowdUp = iTone.rgb * mix(1., .68 + .32 * step(.4, g3), lady);
vCrowd = aPart.x < .5 ? crowdLow : aPart.x < 1.5 ? mix(crowdUp, vec3(.74, .72, .66), iWho.w) : aPart.x < 2.5 ? uCrowdHead : aPart.x < 3.5 ? crowdHat : aPart.x < 4.5 ? crowdUp : uCrowdHead;
vCrowdHat = crowdHat; vCrowdSplit = aPart.x > 4.5 ? position.y : 0.;
vCrowdLight = (uNightFill + uWarm * (uStreetGlow * .5)) * smoothstep(.12, .7, uNight)
  + vec3(${GROUND_LAMPS.gas.colour.map((v) => v.toFixed(2)).join(', ')}) * (iLamp.x * smoothstep(0., ${GROUND_LAMPS.front.toFixed(4)}, uCrowdNight - iLamp.y))
  + vec3(${GROUND_LAMPS.arc.colour.map((v) => v.toFixed(2)).join(', ')}) * (iLamp.z * smoothstep(0., ${GROUND_LAMPS.front.toFixed(4)}, uCrowdNight - iLamp.w))
  + (iGlow.x < .5 ? uFount[0] : iGlow.x < 1.5 ? uFount[1] : iGlow.x < 2.5 ? uFount[2] : uFount[3]) * iGlow.y;`;

// ONE FIGURE OF A FORM ('man', 'woman' or 'plain'), its front toward +X, its feet at the origin, 1.8 m to its hat's
// top before its own scale. Each corner carries its piece and its weights (aPart) and its limb's swing and joint
// (aLimb); the normals stand out from each piece's own middle, so the facets shade as rounds. Drawn from both sides.
// Returns the form's vertices as plain arrays (position, normal, aPart, aLimb) and its triangles' index.
// man, 43 triangles: two three-sided trouser legs, a four-sided coat (its hem carries the coat's length) under a
// flat shoulder, a pale shirt front, two flat arms set aslant (seen from the front and from the side), a
// three-sided head, a hat's brim and three-sided crown (its top carries the hat's height).
// woman, 45 triangles: a five-sided skirt of three rings (the hem and the fullness behind carry the flare), a
// four-sided bodice from a narrow waist to the shoulders, two flat arms, the head, a brim and a pointed crown.
// plain, 16 triangles: a three-sided shell of three rings (feet or hem, waist, shoulders: the hem carries the
// flare, the waist and the shoulders draw in for a woman), and the head and the hat as two crossed upright squares.
function crowdGeometry(form) {
  const pos = [], nor = [], part = [], limb = [], index = [], seen = new Map(), D = Math.PI / 180, R2 = Math.SQRT2, HIP = CROWD.hip, TOP = CROWD.tall;
  // a corner { p, n, kind, flare, brim, lift, swing, joint } is one vertex however many triangles meet at it
  const put = (q) => {
    let i = seen.get(q);
    if (i === undefined) { i = pos.length / 3; seen.set(q, i); pos.push(q.p[0], q.p[1], q.p[2]); nor.push(q.n[0], q.n[1], q.n[2]); part.push(q.kind, q.flare || 0, q.brim || 0, q.lift || 0); limb.push(q.swing || 0, q.joint || 0); }
    return i;
  };
  // a triangle of three corners, wound to face its corners' normals
  const tri = (a, b, c) => {
    const ux = b.p[0] - a.p[0], uy = b.p[1] - a.p[1], uz = b.p[2] - a.p[2], vx = c.p[0] - a.p[0], vy = c.p[1] - a.p[1], vz = c.p[2] - a.p[2];
    const nx = a.n[0] + b.n[0] + c.n[0], ny = a.n[1] + b.n[1] + c.n[1], nz = a.n[2] + b.n[2] + c.n[2];
    if ((uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz < 0) [b, c] = [c, b];
    index.push(put(a), put(b), put(c));
  };
  const quad = (a, b, c, d) => { tri(a, b, c); tri(a, c, d); };
  // a level ring of corners about (cx, cz), radii rx and rz, one corner at each of `angles` (degrees round from
  // the front); `back` pushes the corner behind further out; the rest of each corner is `more`
  const ring = (y, cx, cz, rx, rz, angles, more, back = 1) => angles.map((a) => {
    const c = Math.cos(a * D), s = Math.sin(a * D), l = Math.hypot(c * rz, s * rx) || 1;
    return { p: [cx + rx * c * (a === 180 ? back : 1), y, cz + rz * s], n: [c * rz / l, 0, s * rx / l], ...more };
  });
  // the sides between rings from the lowest up (a ring of one corner closes them to a point)
  const tube = (...rings) => {
    for (let r = 0; r + 1 < rings.length; r++) {
      const lo = rings[r], hi = rings[r + 1], n = lo.length;
      for (let k = 0; k < n; k++) { const j = (k + 1) % n; if (hi.length === 1) tri(lo[k], lo[j], hi[0]); else quad(lo[k], lo[j], hi[j], hi[k]); }
    }
  };
  // a flat piece of three or four places facing n
  const flat = (places, n, more, each = []) => { const q = places.map((p, i) => ({ p, n, ...more, ...(each[i] || {}) })); if (q.length === 3) tri(q[0], q[1], q[2]); else quad(q[0], q[1], q[2], q[3]); };
  const level = (y, hx, hz, more) => flat([[hx, y, hz], [hx, y, -hz], [-hx, y, -hz], [-hx, y, hz]], [0, 1, 0], more);
  // an arm: a flat strip from the shoulder to the hand, set aslant, swinging about the shoulder
  const arm = (sg, sz, hand, share) => {
    const top = [0, 1.43, sg * sz], h = [0.032, 0, -0.032 * sg], more = { kind: 4, swing: -share * sg, joint: 1.43 };
    flat([[top[0] - h[0], top[1], top[2] - h[2]], [top[0] + h[0], top[1], top[2] + h[2]], [hand[0] + h[0], hand[1], sg * hand[2] + h[2]], [hand[0] - h[0], hand[1], sg * hand[2] - h[2]]], [0.707, 0, 0.707 * sg], more);
  };
  const TRI = [60, 180, 300], SQ = [45, 135, 225, 315], PENTA = [36, 108, 180, 252, 324];
  if (form === 'man') {
    for (const sg of [-1, 1]) {
      const leg = { kind: 0, swing: sg, joint: HIP };
      tube(ring(0, 0.03, sg * 0.085, 0.105, 0.075, TRI, leg), ring(HIP, 0.02, sg * 0.092, 0.11, 0.1, TRI, leg));
      arm(sg, 0.255, [0.02, 0.84, 0.25], 0.6);
    }
    tube(ring(0.84, 0, 0, 0.125 * R2, 0.19 * R2, SQ, { kind: 4, lift: -1 }), ring(1.46, 0, 0, 0.115 * R2, 0.225 * R2, SQ, { kind: 4 }));
    level(1.46, 0.115, 0.225, { kind: 4 });
    flat([[0.128, 1.1, 0.055], [0.128, 1.1, -0.055], [0.122, 1.42, -0.07], [0.122, 1.42, 0.07]], [1, 0, 0], { kind: 1 });
    tube(ring(1.47, 0.01, 0, 0.095, 0.095, TRI, { kind: 2 }), ring(1.68, 0.01, 0, 0.095, 0.095, TRI, { kind: 2 }));
    level(1.665, 0.1, 0.1, { kind: 3, brim: 1 });
    const crown = ring(TOP, 0.01, 0, 0.1, 0.1, TRI, { kind: 3, lift: 1 });
    tube(ring(1.665, 0.01, 0, 0.1, 0.1, TRI, { kind: 3 }), crown);
    flat(crown.map((q) => q.p), [0, 1, 0], { kind: 3, lift: 1 });
  } else if (form === 'woman') {
    tube(ring(0.02, -0.02, 0, 0.16, 0.145, PENTA, { kind: 0, flare: 1 }), ring(0.84, -0.03, 0, 0.13, 0.118, PENTA, { kind: 0, flare: 0.35 }, 1.45), ring(1.05, 0, 0, 0.088, 0.1, PENTA, { kind: 0 }));
    tube(ring(1.04, 0, 0, 0.082 * R2, 0.1 * R2, SQ, { kind: 4 }), ring(1.43, 0, 0, 0.095 * R2, 0.185 * R2, SQ, { kind: 4 }));
    level(1.43, 0.095, 0.185, { kind: 4 });
    for (const sg of [-1, 1]) arm(sg, 0.212, [0.07, 0.86, 0.2], 0.35);
    tube(ring(1.45, 0.01, 0, 0.09, 0.09, TRI, { kind: 2 }), ring(1.655, 0.01, 0, 0.09, 0.09, TRI, { kind: 2 }));
    level(1.64, 0.1, 0.1, { kind: 3, brim: 1 });
    tube(ring(1.64, 0, 0, 0.095, 0.095, TRI, { kind: 3 }), [{ p: [0, TOP, 0], n: [0, 1, 0], kind: 3, lift: 1 }]);
  } else {
    tube(ring(0, 0.02, 0, 0.125, 0.17, TRI, { kind: 0, flare: 1 }), ring(0.95, 0.02, 0, 0.155, 0.22, TRI, { kind: 0, flare: -0.16 }));
    tube(ring(0.95, 0.02, 0, 0.155, 0.22, TRI, { kind: 4, flare: -0.16 }), ring(1.45, 0.02, 0, 0.16, 0.27, TRI, { kind: 4, flare: -0.1 }));
    const up = [{}, {}, { lift: 1 }, { lift: 1 }], hh = { kind: 5 };
    flat([[0, 1.46, 0.09], [0, 1.46, -0.09], [0, TOP, -0.09], [0, TOP, 0.09]], [1, 0, 0], hh, up);
    flat([[-0.09, 1.46, 0], [0.09, 1.46, 0], [0.09, TOP, 0], [-0.09, TOP, 0]], [0, 0, 1], hh, up);
  }
  return { position: new Float32Array(pos), normal: new Float32Array(nor), aPart: new Float32Array(part), aLimb: new Float32Array(limb), index, vertices: pos.length / 3, triangles: index.length / 3 };
}

// WHERE THE CROWD GATHERS. Each zone: { n: figures at density 1, walk: the share that stroll, maxL: the longest half
// straight, tight: a narrow floor (two abreast at most, close turns), kind: 'garden' (on the garden's gravel), 'quay' (the far quay's pavement) or 'deck' (a platform's
// gallery), at(h): a place dealt from numbers h(0..3) as { x, z, along: the bearing a stroller walks, face: the
// bearing one who stands looks (none: toward the middle of its knot), y: the floor, room: the metres a walk may
// reach either way (none: the zone's maxL alone) }. Thick round the basins, under
// and round the tower, on the quay's plain before it, before the dome and the palaces and round the music kiosks; strollers on the walks, under the awnings
// and on the quays; a few on the tower's two lower platforms (the first's gallery, the second's rail and its open
// floor). THE GARDEN IS FULL (src-site.md "Crowds": "hundreds of thousands of visitors"): most of all on the gravel
// before the tower either side of the axis's lane, on the two walks beside the parterre and round the two lakes,
// where nearly all stroll. The rule of 20 m and the lane thin every zone the line passes. WORKING: every zone and number.
function crowdZones() {
  const F = FRAME, G = GARDEN, PL = F.palaces, AW = F.awningWalks, LK = F.lakes, CN = F.canal, Y = F.groundY, PI = Math.PI, zones = [];
  const ring = (cx, cz, r0, r1, n, walk) => zones.push({ kind: 'garden', n, walk, maxL: 3, at: (h) => {
    const a = h(0) * 2 * PI, r = r0 + (r1 - r0) * h(1) * h(1);   // closest packed at the rim
    return { x: cx + r * Math.cos(a), z: cz + r * Math.sin(a), along: a + PI / 2, face: a + PI, y: Y };
  } });
  const rect = (x0, z0, x1, z1, n, walk, along, face, maxL = CROWD.straight[1]) => zones.push({ kind: 'garden', n, walk, maxL,
    at: (h) => {
      const x = x0 + (x1 - x0) * h(0), z = z0 + (z1 - z0) * h(1);   // room: the metres to the zone's nearer end along the walk
      return { x, z, along, face, y: Y, room: along === 0 ? Math.min(Math.abs(x - x0), Math.abs(x1 - x)) : Math.min(z - z0, z1 - z) };
    } });
  const both = (fn) => { fn(1); fn(-1); };
  // in ranks round the three basins of the garden and the tower's; along the canal, looking at its jets
  ring(F.mainJet.x, F.mainJet.z, F.mainJet.basinDiameter / 2 + 0.9, F.mainJet.basinDiameter / 2 + 5.8, 130, 0.12);
  ring(F.coutan.x, F.coutan.z, F.coutan.basinDiameter / 2 + 0.9, F.coutan.basinDiameter / 2 + 6, 130, 0.12);
  ring(F.fountain.x, F.fountain.z, F.fountain.basinDiameter / 2 + 0.9, G.under.ring - 0.5, 90, 0.2);
  both((sx) => rect(sx * (CN.halfWidth + 0.9), CN.z0 + 3, sx * (CN.halfWidth + 4.6), CN.z1 - 3, 40, 0.25, PI / 2, sx > 0 ? PI : 0));
  // under the tower's arches: the walks on its two axes between the pier bases, and the whole floor between and
  // round the four piers, strolling both ways (the rule and the ground's test leave the lawns, the piers and the
  // air under the flown line empty)
  rect(-8.5, -60, 8.5, -23, 30, 0.6, PI / 2);
  both((sx) => rect(sx * 23, -8.5, sx * 37, 8.5, 14, 0.5, 0));
  rect(-66, -66, 66, 66, 240, 0.55, 0);
  rect(-66, -66, 66, 66, 240, 0.55, PI / 2);
  // the gravel before the tower on the garden's side, either side of the axis's empty lane
  both((sx) => rect(sx * 12, 60, sx * 46, 146, 260, 0.8, PI / 2));
  // before the central dome and in the court; before each palace's entrance and along its front
  rect(-34, 451, 34, 464, 60, 0.2, 0);
  rect(-22, 328, 22, 450, 60, 0.6, PI / 2);
  both((sx) => {
    rect(sx * 36, 452, sx * 106, 512, 10, 0.6, 0);
    rect(sx * (PL.xNear - 9.2), PL.dome.z - 13, sx * (PL.xNear - 5), PL.dome.z + 13, 22, 0.25, PI / 2);
    rect(sx * (PL.xNear - 4.8), PL.z0 + 3, sx * (PL.xNear - 1.4), PL.dome.z - 19, 12, 0.85, PI / 2);
    rect(sx * (PL.xNear - 4.8), PL.dome.z + 19, sx * (PL.xNear - 1.4), PL.z1 - 3, 10, 0.85, PI / 2);
    // under the awnings and on the walk between them and the parterre; the cross walks between the lawns
    rect(sx * (AW.x[1] - 2.6), AW.z0 + 3, sx * (AW.x[1] + 2.6), AW.z1 - 3, 110, 0.85, PI / 2);
    rect(sx * (G.parterre.x + 1.5), G.parterre.z0 + 3, sx * (AW.x[1] - G.walkHalf - 0.6), G.parterre.z1 - 1, 110, 0.9, PI / 2);
    rect(sx * (G.lawns[2][0] + 1), G.lawns[2][3] + 2, sx * (G.lawns[2][2] - 1), G.lawns[3][1] - 2, 40, 0.6, 0);
    rect(sx * (G.lawns[1][0] + 1), G.lawns[1][3] + 2, sx * (G.lawns[1][2] - 1), G.lawns[2][1] - 2, 8, 1, 0);
    rect(sx * 33, G.lawns[3][3] + 3, sx * 108, G.lawns[4][1] - 3, 36, 0.6, 0);
    // round the music kiosks, looking at them
    for (const [x, z, r] of G.rounds) ring(sx * x, z, KIOSKS.music.r + 1.3, r - 0.6, 18, 0);
    // the lake's lawn: its two straight walks; the band between it and the garden's lawns; the walk along the fence
    rect(sx * 117, -2, sx * 204, 2, 30, 0.8, 0);
    rect(sx * 134.2, -67, sx * 137.8, 67, 34, 0.8, PI / 2);
    rect(sx * 37, G.lawns[0][3] + 2, sx * 200, G.lawns[1][1] - 2, 14, 0.85, 0);
    rect(sx * 207, -60, sx * 227, 90, 6, 1, PI / 2);
    // the promenade between the railway's cut and the garden, and under the quay's two rows of trees; the whole
    // open gravel between the cut and the tower's lawns, where the line comes in over the quay
    rect(sx * 26, G.z0 - 21, sx * 214, G.z0 - 4, 18, 0.9, 0);
    rect(sx * 26, G.z0 + 9.5, sx * 205, G.z0 + 16.5, 18, 0.85, 0);
    rect(sx * 2, G.z0 - 19, sx * 212, G.lawns[0][1] - 2, 230, 0.7, 0);
  });
  // the walk round each lake: places along a line 4.6 m outside the water's edge, 2.2 m either side of it
  for (const lx of LK.x) {
    const line = roundLoop(lx, LK.z, LK.sizeX / 2, LK.sizeZ / 2, LK.sizeX * 0.42, (G.lakeWalk[0] + G.lakeWalk[1]) / 2, 2);
    zones.push({ kind: 'garden', n: 90, walk: 0.7, maxL: 4, at: (h) => {
      const i = Math.floor(h(0) * line.length) % line.length, a = line[i], c = line[(i + 1) % line.length], along = Math.atan2(c[1] - a[1], c[0] - a[0]);
      const off = (h(1) - 0.5) * 4.4;                       // (the loop runs with the water on its left, so +off is toward the lawn)
      return { x: a[0] + Math.sin(along) * off, z: a[1] - Math.cos(along) * off, along, face: along + PI / 2, y: Y };
    } });
  }
  // the far quay's pavement either side of the bridge: strollers between the lamps and the roadway, and some at
  // the parapet looking over the river at the tower (the tower's bank has no quay walk inside the fences: its
  // houses stand on the wall)
  for (const sx of [-1, 1]) for (const [n, walk, o0, o1] of [[26, 1, 2.3, 2.9], [18, 0, 1.0, 1.15]]) zones.push({ kind: 'quay', tight: true, n, walk, maxL: 8, at: (h) => {
    const x = sx * (BRIDGE_MOUTH + 6 + 390 * h(0)), [px, pz] = riverSide(x, -(RIVER_HALF + o0 + (o1 - o0) * h(1))), along = Math.atan2(riverSlope(x), 1);
    return { x: px, z: pz, along, face: along + PI / 2, y: Y, room: Math.abs(x) - BRIDGE_MOUTH - 2 };
  } });
  // the tower's first platform, on the gallery behind its arcades, and the second's, at its rail: [the gallery's
  // inner and outer edge from the axis, the reach along a face, its floor, figures to a face, the share that stroll]
  const D = TOWER.decks, d1 = D[0], d2 = D[1];
  for (const [r0, r1, reach, y, n, walk] of [[d1.half - d1.galleryWidth + 0.8, d1.half - 0.75, d1.half - 5, d1.floor - d1.galleryDrop, 30, 0.5], [d2.half - d2.galleryWidth + 0.8, d2.half - 0.75, d2.half - 3, d2.floor, 12, 0.4]]) {
    for (const [ox, oz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) zones.push({ kind: 'deck', tight: true, n, walk, maxL: 7, at: (h) => {
      const t = (h(0) * 2 - 1) * reach, r = r0 + (r1 - r0) * h(1), out = Math.atan2(oz, ox);
      return { x: ox * r - oz * t, z: oz * r + ox * t, along: out + PI / 2, face: out, y, room: reach - Math.abs(t) };
    } });
  }
  // the second platform's open floor between the four legs (the part lays its tanks, cabin, tents and lift frames:
  // these four rooms are the floor left free of them), each [x0, z0, x1, z1, figures, the bearing strollers walk]
  for (const [x0, z0, x1, z1, n, along] of [[6.2, -3.8, 11, 3.8, 14, 0], [-11, -3.8, -6.2, 3.8, 14, 0], [-4.2, -10, 4.2, -5.2, 18, 0], [-4.2, 5.2, 4.2, 8.2, 14, 0]]) {
    zones.push({ kind: 'deck', tight: true, n, walk: 0.5, maxL: 3, at: (h) => {
      const x = x0 + (x1 - x0) * h(0), z = z0 + (z1 - z0) * h(1);
      return { x, z, along, y: d2.floor, room: Math.min(x - x0, x1 - x) + 0.5 };
    } });
  }
  return zones;
}

// WHERE A FIGURE ON THE GARDEN'S GROUND MAY BE: returns open(x, z), true on gravel and stone alone (and with it
// open.free(x, z), the last of its tests alone, for the far quay's pavement). It is false on
// every lawn as the ground's material draws it (kerbs and all), on the lakes and their rims, in the basins and the
// canal, on the sunk parterre, on the pier bases, inside the halls and the kiosks, in the railway's cut, in the
// axis's empty lane and on the bridge with its ramps, and within a pace of a tree, a lamp post or an awning post.
function crowdGround(lamps) {
  const G = GARDEN, F = FRAME, LK = F.lakes, PL = F.palaces, P = G.parterre, UT = G.under, AW = F.awningWalks, CN = F.canal, mid = (UT.near + UT.far) / 2, hq = (UT.far - UT.near) / 2;
  const box = (px, pz, cx, cz, hx, hz, r) => { const ex = Math.abs(px - cx) - hx + r, ez = Math.abs(pz - cz) - hz + r; return Math.hypot(Math.max(ex, 0), Math.max(ez, 0)) + Math.min(Math.max(ex, ez), 0) - r; };
  const feet = Object.keys(TOWER.legs).map((leg) => TOWER.legBox(0, leg)).filter((b) => b.x > 0 && b.z > 0)[0];
  const basins = [F.fountain, F.mainJet, F.coutan].map((q) => [q.x, q.z, q.basinDiameter / 2 + 0.5]), kiosks = kioskPlaces();
  // the things that stand on the walks, in cells of 4 m: [x, z, the room each takes]
  const CELL = 4, cells = new Map(), key = (x, z) => Math.floor(x / CELL) * 4096 + Math.floor(z / CELL);
  const stand = (x, z, r) => { const k = key(x, z); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(x, z, r); };
  for (const [x, z, size] of treePlaces()) stand(x, z, 0.3 * size + 0.5);
  for (const q of lamps) if (q.post) stand(q.post[0], q.post[2], q.post[4] / 2 + 0.4);
  for (const wx of AW.x) for (const sx of [-1, 1]) for (let k = 0; k * 11 <= AW.z1 - AW.z0 + 0.01; k++) stand(wx + sx * (G.walkHalf - 0.15), AW.z0 + k * 11, 0.5);
  // free(x, z): no tree, post or awning post within its room of this place
  const free = (x, z) => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) {
      const c = cells.get(i * 4096 + j);
      if (c) for (let k = 0; k < c.length; k += 3) if ((c[k] - x) ** 2 + (c[k + 1] - z) ** 2 < c[k + 2] * c[k + 2]) return false;
    }
    return true;
  };
  const open = (x, z) => {
    const q = Math.abs(x);
    if (q < AXIS_LANE.half + 0.5 && z > AXIS_LANE.z0 - 0.5 && z < AXIS_LANE.z1 + 0.5) return false;       // the axis's empty lane
    if (q < BR.halfWidth + 1.5 && z < BR.z1 + 28) return false;                                             // the bridge and its ramp
    if (z < G.z0 && (z < RC.z1 + 1.5 || q > GROUNDS_X - 1)) return false;                                   // the railway's cut and all beyond it
    let d = 1e5;
    for (const [x0, za, x1, zb] of G.lawns) d = Math.min(d, box(q, z, (x0 + x1) / 2, (za + zb) / 2, (x1 - x0) / 2, (zb - za) / 2, G.lawnRound));
    const lake = box(q, z, LK.x[1], LK.z, LK.sizeX / 2, LK.sizeZ / 2, LK.sizeX * 0.42);
    d = Math.max(d, Math.min(lake - G.lakeWalk[0], G.lakeWalk[1] - lake));
    for (const [cx, cz, hx, hz] of G.walks) d = Math.max(d, -box(q, z, cx, cz, hx, hz, 0.5));
    for (const [cx, cz, r] of G.rounds) d = Math.max(d, r - Math.hypot(q - cx, z - cz));
    d = Math.min(d, Math.max(box(q, Math.abs(z), mid, mid, hq, hq, UT.round), UT.ring - Math.hypot(x, z)));
    if (d < G.kerb + 0.4 || lake < G.lakeRim + 0.4) return false;                                           // lawn, kerb, water, rim
    if (q < P.x + 0.5 && z > P.z0 - 0.5 && z < P.z1 + 0.5) return false;                                    // the sunk parterre
    for (const [bx, bz, r] of basins) if (Math.hypot(x - bx, z - bz) < r) return false;
    if (q < CN.halfWidth + 0.5 && z > CN.z0 - 0.5 && z < CN.z1 + 0.5) return false;
    if (Math.abs(q - feet.x) < feet.half + 0.6 && Math.abs(Math.abs(z) - feet.z) < feet.half + 0.6) return false;   // a pier's base
    // the halls: the palaces and their entrances, the industries' wings, the dome with its pavilions, the hall across the court
    if (z > PL.z0 - 1 && q > PL.xNear - 1) return false;
    if (Math.abs(z - PL.dome.z) < PALACE.porch + 1 && q > PL.xNear - PALACE.porchOut - 1) return false;
    if (z > F.centralDome.z - CENTRAL.body - 10 && q < CENTRAL.pavilionX + CENTRAL.pavilion / 2 + 1.5) return false;
    if (z > F.centralDome.z + CENTRAL.body - 1.5 || inTerminus(x, z)) return false;
    for (const k of kiosks) if (Math.abs(x - k.x) < k.hx + 0.4 && Math.abs(z - k.z) < k.hz + 0.4) return false;
    return free(x, z);
  };
  return Object.assign(open, { free });
}

// THE CROWD DEALT AND RULED: every figure that is made, each { x, z, dir, y, L, r, v, s0 (its loop), scale, flare,
// front, tone, hat, n (its looks), form (its level of detail: 'man', 'woman' or 'plain'), gas, gasAt, arc, arcAt,
// basin, glow (its light) }. Figures are dealt zone by zone in knots of one to four, each knot at the better lit of
// two dealt places; strollers of one knot walk abreast on one loop. Every number is the hash of the zone's, the
// knot's and the figure's own index, so a denser deal adds knots and moves none. THE RULE is applied here: a
// figure is kept only if at every step of its whole walk (half a metre apart and less) the upright line from its
// feet to its hat stands clear + margin metres from every point of the route's curve and outside the lens's
// ground behind the start, and (in the garden) on open gravel, (on the far quay) clear of the lamp posts. The
// same steps give the least distance of its walk from the curve, and with it its form (CROWD.fine).
// lamps: the ground's lamps; ctx: yields inside the loop.
async function crowdFigures(density, lamps, ctx) {
  const C = CROWD, zones = crowdZones(), open = crowdGround(lamps), out = [], PI = Math.PI, F = FRAME, o = [0, 0, 0];
  const cellsOf = (size) => { const m = new Map(); return { add(x, z, v) { const k = Math.floor(x / size) * 4096 + Math.floor(z / size); if (!m.has(k)) m.set(k, []); m.get(k).push(v); },
    each(x, z, reach, fn) { const cx = Math.floor(x / size), cz = Math.floor(z / size); for (let i = cx - reach; i <= cx + reach; i++) for (let j = cz - reach; j <= cz + reach; j++) { const c = m.get(i * 4096 + j); if (c) for (const v of c) if (fn(v) === false) return false; } return true; } }; };
  // the route's curve, every point of it (half a metre apart), in cells of 25 m
  const RT = ROUTE.curve, route = cellsOf(25), need2 = (C.clear + C.margin) ** 2;
  for (let i = 0; i < RT.count; i++) route.add(RT.x[i], RT.z[i], i);
  // the lens behind the start: metres back along the first heading produced (s) and metres to its side (c), in plan
  const EL = ENTRY_LENS, hx = RT.x[1] - RT.x[0], hz = RT.z[1] - RT.z[0], hl = Math.hypot(hx, hz), need = C.clear + C.margin, wide = need * Math.hypot(1, EL.spread);
  const behind = (x, z) => { const s = -((x - RT.x[0]) * hx + (z - RT.z[0]) * hz) / hl, c = Math.abs((x - RT.x[0]) * hz - (z - RT.z[0]) * hx) / hl; return (s > -need && s < EL.back + need && c < EL.spread * Math.max(s, 0) + wide) || Math.hypot(s, c) < EL.round + need; };
  // the square of the least distance from the upright line at (x, z) between heights y0 and y1 to the route's
  // curve (true to 50 m, the cells' reach; Infinity beyond)
  const least2 = (x, z, y0, y1) => {
    let best = Infinity;
    route.each(x, z, 2, (i) => { const ry = RT.y[i], v = Math.max(0, y0 - ry, ry - y1), d2 = (RT.x[i] - x) ** 2 + (RT.z[i] - z) ** 2 + v * v; if (d2 < best) best = d2; });
    return best;
  };
  // the lamps whose light falls on figures: the gas with a pool on the ground, the arcs on their masts
  const lit = cellsOf(16), light = { gas: 0, gasAt: -1, arc: 0, arcAt: -1 };
  for (const q of lamps) if (q.pool && (q.kind === 0 || q.post)) lit.add(q.p[0], q.p[2], q);
  const lampAt = (x, z) => {
    light.gas = light.arc = 0; light.gasAt = light.arcAt = -1;
    lit.each(x, z, 2, (q) => {
      const d2 = (q.p[0] - x) ** 2 + (q.p[2] - z) ** 2, arc = q.kind === 1, R = arc ? C.arcReach : C.gasReach, k = Math.exp(-d2 / (2 * R * R)), at = q.threshold === undefined ? -1 : q.threshold;
      if (arc) { if (k > light.arc) { light.arc = k; light.arcAt = at; } } else if (k > light.gas) { light.gas = k; light.gasAt = at; }
    });
    return light.gas + light.arc;
  };
  const CN = F.canal, basins = [[F.mainJet, 0], [F.coutan, 2], [F.fountain, 3]];
  const men = C.men.map(S.lin), women = C.women.map(S.lin);
  if (ctx) await ctx.yield();
  for (let zi = 0; zi < zones.length; zi++) {
    const Z = zones[zi], want = Math.round(Z.n * C.scale * density);
    for (let g = 0, dealt = 0; dealt < want; g++) {
      const id = zi * 8192 + g, h = (k) => hash01(id, 310 + k);
      const size = 1 + Math.floor(h(1) * (Z.tight ? 2 : h(0) < Z.walk ? 2.7 : 3.6));
      dealt += size;
      const pa = Z.at((k) => hash01(id, 320 + k)), pb = Z.at((k) => hash01(id, 330 + k)), p = lampAt(pb.x, pb.z) > lampAt(pa.x, pa.z) ? pb : pa;
      const room = p.room === undefined ? Z.maxL : Math.min(Z.maxL, p.room - 0.5), L0 = Math.min(room, C.straight[0] + (C.straight[1] - C.straight[0]) * h(2));
      const strolls = h(0) < Z.walk && L0 >= 1.5, L = strolls ? L0 : 0, r = !strolls ? 0 : Z.tight ? 0.25 : C.turn[0] + (C.turn[1] - C.turn[0]) * h(3);
      const dir = p.along + (h(4) < 0.5 ? 0 : PI), v = strolls ? C.pace[0] + (C.pace[1] - C.pace[0]) * h(5) : 0, P = 4 * L + 2 * PI * r, s0 = h(6) * P, gap = Z.tight ? 0.6 : 0.62;
      for (let m = 0; m < size; m++) {
        const fn = id * 4 + m, k = (j) => hash01(fn, 340 + j), off = (m - (size - 1) / 2) * gap, f = { y: p.y, L, r, v, s0: s0 - (strolls && m === 2 ? 0.5 : 0) };
        if (strolls) { f.x = p.x - Math.sin(dir) * off; f.z = p.z + Math.cos(dir) * off; f.dir = dir; }
        else if (p.face !== undefined) { const j = (k(8) - 0.5) * 0.3; f.x = p.x - Math.sin(p.face) * off + Math.cos(p.face) * j; f.z = p.z + Math.cos(p.face) * off + Math.sin(p.face) * j; f.dir = p.face + (k(9) - 0.5) * 0.5; }
        else { const a = 2 * PI * (m + h(7)) / size, rr = size === 1 ? 0 : 0.3 + 0.17 * size; f.x = p.x + rr * Math.cos(a); f.z = p.z + rr * Math.sin(a); f.dir = a + PI + (k(9) - 0.5) * 0.5; }
        // who it is: the third and fourth of a knot are mostly children, the second a woman
        const child = m >= 2 ? k(0) < 0.7 : size === 1 && k(0) < 0.04, woman = m === 1 || k(1) < (m === 0 ? (size === 1 ? 0.42 : 0.25) : 0.5);
        f.scale = child ? 0.56 + 0.2 * k(2) : woman ? 0.86 + 0.12 * k(2) : 0.93 + 0.14 * k(2);
        f.flare = woman ? (child ? 0.9 : 1.3 + 0.6 * k(3)) : 0; f.front = woman ? (k(4) < 0.5 ? 0.3 : 0) : 1; f.n = k(5);
        const cloth = woman ? women[Math.floor(k(6) * women.length)] : men[Math.floor(k(6) * men.length)], shade = 0.85 + 0.3 * k(7);
        f.tone = [cloth[0] * shade, cloth[1] * shade, cloth[2] * shade]; f.hat = woman ? 1.15 + 0.6 * k(10) : k(10) < 0.12 ? 0.42 : 0.02 + 0.04 * k(11);
        // THE RULE, over the whole walk; the lamps' light gathered on the way
        const steps = strolls ? Math.ceil(2 * P) : 1, tall = C.tall * f.scale;
        let ok = true, gas = 0, arc = 0, gasBest = 0, arcBest = 0, near2 = Infinity; f.gasAt = f.arcAt = -1;
        for (let i = 0; i < steps && ok; i++) {
          crowdLoop(f, i * P / steps, o);
          const d2 = least2(o[0], o[1], f.y, f.y + tall);
          if (d2 < near2) near2 = d2;
          ok = d2 >= need2 && !behind(o[0], o[1]) && (Z.kind === 'garden' ? open(o[0], o[1]) : Z.kind !== 'quay' || open.free(o[0], o[1]));
          if (ok && Z.kind !== 'deck') { lampAt(o[0], o[1]); gas += light.gas; arc += light.arc; if (light.gas > gasBest) { gasBest = light.gas; f.gasAt = light.gasAt; } if (light.arc > arcBest) { arcBest = light.arc; f.arcAt = light.arcAt; } }
        }
        if (!ok) continue;
        f.form = near2 >= C.fine * C.fine ? 'plain' : f.flare > 0 ? 'woman' : 'man';   // the level of detail, by the route
        f.gas = Z.kind === 'deck' ? C.deckK : C.gasK * gas / steps; f.arc = C.arcK * arc / steps;
        // the coloured light of the nearest basin, by the metres from its rim (the canal's from its edge)
        f.basin = 0; f.glow = 0;
        if (Z.kind === 'garden') {
          for (const [q, b] of basins) { const d = Math.max(0, Math.hypot(f.x - q.x, f.z - q.z) - q.basinDiameter / 2), g2 = C.fountK * Math.exp(-((d / C.fountReach) ** 2)); if (g2 > f.glow) { f.glow = g2; f.basin = b; } }
          const dc = Math.hypot(Math.max(0, Math.abs(f.x) - CN.halfWidth), Math.max(0, CN.z0 - f.z, f.z - CN.z1)), gc = C.fountK * Math.exp(-((dc / C.fountReach) ** 2));
          if (gc > f.glow) { f.glow = gc; f.basin = 1; }
        }
        out.push(f);
      }
      if (ctx) await ctx.yield();                          // after every knot: a knot's strollers are each stepped against the whole curve
    }
  }
  return out;
}

// THE CROWD DRAWN: two meshes (the plain figures, the whole ones) on one lit material of the kind every solid's
// kin uses (the world's two lights, its fog), its vertex program placing and posing each figure by the clock;
// two draw calls. fountLight: the fountains' own
// uniform of their four basins' light. Returns its uniforms (uCrowdTime, uCrowdNight: the update's to write).
async function buildCrowd(ctx, scene, mats, density, lamps, fountLight) {
  const all = await crowdFigures(density, lamps, ctx), U = mats.uniforms;
  await ctx.yield();
  const uniforms = { uCrowdTime: { value: 0 }, uCrowdNight: { value: 0 }, uCrowdHead: { value: new THREE.Color().fromArray(S.lin(CROWD.head)) }, uFount: fountLight,
    uNight: U.uNight, uNightFill: U.uNightFill, uWarm: U.uWarm, uStreetGlow: U.uStreetGlow };
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  material.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + CROWD_VERT)
      .replace('#include <beginnormal_vertex>', CROWD_NORMAL).replace('#include <begin_vertex>', CROWD_BEGIN);
    // (the plain form's one piece for head and hat: the hat's tone above the split's height, the head's below)
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCrowd, vCrowdHat, vCrowdLight; varying float vCrowdSplit;')
      .replace('#include <color_fragment>', 'vec3 crowdTone = vCrowdSplit > 1.645 ? vCrowdHat : vCrowd; diffuseColor.rgb = crowdTone;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += crowdTone * vCrowdLight;');
  };
  // TWO MESHES. The plain figures: instances of the plain form, each with its figure's own numbers. The whole
  // figures (men and women, two unlike forms): every one's own vertices in ONE geometry, its figure's numbers
  // written at each of its vertices under the same names, so that one program draws both meshes.
  const FORMS = { plain: crowdGeometry('plain'), man: crowdGeometry('man'), woman: crowdGeometry('woman') };
  const SHAPE = [['position', 3], ['normal', 3], ['aPart', 4], ['aLimb', 2]];
  const OWN = [['iLoop', 4, (f) => [f.x, f.z, f.dir, f.y]], ['iWalk', 4, (f) => [f.L, f.r, f.v, f.s0]], ['iWho', 4, (f) => [f.scale, f.flare, f.n, f.front]],
    ['iTone', 4, (f) => [f.tone[0], f.tone[1], f.tone[2], f.hat]], ['iLamp', 4, (f) => [f.gas, f.gasAt, f.arc, f.arcAt]], ['iGlow', 2, (f) => [f.basin, f.glow]]];
  const SPHERE = new THREE.Sphere(new THREE.Vector3(0, 40, 50), 720);   // both quays' pavements, the court's far end, the second platform
  const geometries = [], plain = all.filter((f) => f.form === 'plain'), whole = all.filter((f) => f.form !== 'plain');
  const add = (g, name) => { g.boundingSphere = SPHERE; const mesh = new THREE.Mesh(g, material); mesh.name = name; mesh.matrixAutoUpdate = false; scene.add(mesh); geometries.push(g); };
  {
    const g = new THREE.InstancedBufferGeometry(), F = FORMS.plain, n = plain.length;
    for (const [k, size] of SHAPE) g.setAttribute(k, new THREE.BufferAttribute(F[k], size));
    g.setIndex(F.index);
    for (const [name, size, of] of OWN) { const a = new Float32Array(n * size); plain.forEach((f, i) => a.set(of(f), i * size)); g.setAttribute(name, new THREE.InstancedBufferAttribute(a, size)); }
    g.instanceCount = n;
    add(g, 'crowd');
  }
  await ctx.yield();
  let vertices = 0, corners = 0;
  for (const f of whole) { vertices += FORMS[f.form].vertices; corners += FORMS[f.form].index.length; }
  const shape = SHAPE.map(([, size]) => new Float32Array(vertices * size));
  const own = OWN.map(([, size]) => new Float32Array(vertices * size)), index = vertices > 65535 ? new Uint32Array(corners) : new Uint16Array(corners);
  for (let k = 0, v = 0, c = 0; k < whole.length; k++) {
    const f = whole[k], F = FORMS[f.form];
    SHAPE.forEach(([name, size], j) => shape[j].set(F[name], v * size));
    OWN.forEach(([, size, of], j) => { const q = of(f), a = own[j]; for (let i = 0; i < F.vertices; i++) for (let m = 0; m < size; m++) a[(v + i) * size + m] = q[m]; });
    for (let i = 0; i < F.index.length; i++) index[c++] = F.index[i] + v;
    v += F.vertices;
    if ((k & 63) === 63) await ctx.yield();
  }
  {
    const g = new THREE.BufferGeometry();
    SHAPE.forEach(([name, size], j) => g.setAttribute(name, new THREE.BufferAttribute(shape[j], size)));
    OWN.forEach(([name, size], j) => g.setAttribute(name, new THREE.BufferAttribute(own[j], size)));
    g.setIndex(new THREE.BufferAttribute(index, 1));
    add(g, 'crowd-whole');
  }
  await ctx.yield();
  const triangles = plain.length * FORMS.plain.triangles + corners / 3;
  return { uniforms, count: all.length, triangles, dispose() { for (const g of geometries) g.dispose(); material.dispose(); } };
}

async function buildWorld(ctx) {
  if (!ctx) return null;
  layRouteLine();                                         // the part lays its route on call, in two steps of their own: the laid line,
  await ctx.yield();
  layRoute();                                             // then the knots, places, pace and looks; ROUTE's laid fields are read only after it
  // a short path takes the kit function's cold start out of the next step; it rides here behind the laying, so
  // that the yield after it is a true hand-back and the long path has a step to itself
  core.makePath(ROUTE.knots.slice(0, 100));
  await ctx.yield();
  // the kit's path through the part's knots, with a sample every metre and a half for its nearest-point readings
  const path = core.makePath(ROUTE.knots, { samples: Math.ceil(ROUTE.length / 1.5) });
  const LEN = path.length;
  await ctx.yield();
  const scene = new THREE.Scene();
  const rng = makeRng('iron-tower-first-night:' + ctx.seed);

  // ---- sky, light and fog: the dusk at the river
  const ag = FRAME.afterglow;                             // unit vector on the ground toward the glow
  const glowAzimuth = Math.atan2(ag.x, -ag.z) / RAD;      // the kit's azimuth: 0 looks down -Z, +90 down +X
  const skyNoise = await skyNoiseSteps(ctx);
  await ctx.yield();
  const sky = makeSky({ rng: rng.fork('sky'), preset: 'blueHour', noiseTexture: skyNoise,
    zenith: DUSK.zenith, mid: DUSK.mid, horizon: DUSK.horizon, ground: DUSK.ground, horizonPow: 4.2, midPow: 1.8,
    scatterColor: DUSK.scatterColor, scatter: DUSK.scatter, scatterPow: DUSK.scatterPow, scatterHigh: 0, scatterFall: DUSK.scatterFall,
    sunElevation: -5, sunAzimuth: glowAzimuth, sunIntensity: 0, sunColor: DUSK.glowColor, sunGlow: DUSK.sunGlow,
    stars: DUSK.stars, starDensity: 0.45, twinkle: 0.5, milkyWay: 0, bodies: [], clouds: false, clouds2: false, bake: false });
  scene.add(sky.object);
  await ctx.yield();
  scene.fog = new THREE.FogExp2(new THREE.Color(DUSK.fog), DUSK.fogDensity);
  const hemi = new THREE.HemisphereLight(new THREE.Color(DUSK.skyFill), new THREE.Color(DUSK.groundFill), DUSK.fillK);
  const key = new THREE.DirectionalLight(new THREE.Color(DUSK.key), DUSK.keyK);
  const ke = KEY_ELEVATION * RAD;
  key.position.set(ag.x * Math.cos(ke), Math.sin(ke), ag.z * Math.cos(ke)).multiplyScalar(1000);
  scene.add(hemi, key, key.target);
  // The tower's own light, as uniforms its programs share, written by skyAt with every other light: a key from the
  // afterglow and two fills, the sky's from above and the horizon's and the lit grounds' from the sides and below
  // (IRON_LIGHT gives each at the ramp's two ends). uGlow is the Bengal fire's red on the iron: black until the fires
  // are lit (the part's lamps write it, by the metres flown). uLit is the level of the tower's own lit windows and lantern glass.
  const towerLight = {
    uKeyDir: { value: key.position.clone().normalize() }, uKeyColor: { value: new THREE.Color() },
    uSkyTop: { value: new THREE.Color() }, uSkyHorizon: { value: new THREE.Color() }, uGlow: { value: new THREE.Color(0, 0, 0) }, uLit: { value: DUSK.towerLit },
    uAirLow: { value: new THREE.Color() }, uAirHigh: { value: new THREE.Color() },   // the sky's own tones behind a far lattice's closed cells
  };
  // the footings' masonry takes the two fills as every stone of this world has them
  const footingLight = { uSkyTop: { value: new THREE.Color() }, uSkyHorizon: { value: new THREE.Color() } };

  // ---- the kit's city materials: one set for every stone, wall and ground of this world
  // (the lamps' gate, the share of windows lit, the night fill and the street glow are skyAt's to write)
  const mats = S.makeMaterials({ night: DUSK.lamps, lit: DUSK.windows, glow: 2.2, warm: '#ffb866', cool: '#ffd9a0',
    nightFill: DUSK.nightFill, streetGlow: DUSK.streetGlow, streetY: FRAME.groundY, streetFall: 9,
    sky: { top: DUSK.zenith, horizon: DUSK.horizon, sun: DUSK.key, sunDir: key.position.clone().normalize() } });
  await ctx.yield();

  // ---- the ground and the river's channel. The ground is ONE PALE PLANE at y 0 either side of the river, with a
  // hole between the exposition's fences where the garden's own ground lies; the channel is the two quay walls, the
  // low bank on the tower's side and a dark bed under the water.
  const STONE = S.lin('#cdc2aa'), QUAY = S.lin('#b9ae98'), GRAVEL = S.lin('#b7ab93'), BED = S.lin('#0a1630'), BERGE = S.lin('#958b78');
  const G = FRAME.groundY, WY = FRAME.waterY, LB = FRAME.lowBank.y;
  const FAR_Z = 3800, BED_Y = WY - 2.5, PARAPET = 1, PARAPET_DEEP = 0.5;   // WORKING: the ground's reach, the bed's depth, the quay parapets
  const gb = new S.Builder(8192), gardenSpan = [Infinity, -Infinity];
  for (let i = 0; i + 1 < RIVER_XS.length; i++) {
    const xa = RIVER_XS[i], xb = RIVER_XS[i + 1];           // stations run downstream, from +X to -X
    const fa = riverSide(xa, BANK_FAR), fb = riverSide(xb, BANK_FAR), na = riverSide(xa, BANK_NEAR), nb = riverSide(xb, BANK_NEAR);
    const la = riverSide(xa, BANK_LOW), lb = riverSide(xb, BANK_LOW);
    const fa2 = riverSide(xa, BANK_FAR - PARAPET_DEEP), fb2 = riverSide(xb, BANK_FAR - PARAPET_DEEP);
    const na2 = riverSide(xa, BANK_NEAR + PARAPET_DEEP), nb2 = riverSide(xb, BANK_NEAR + PARAPET_DEEP);
    gb.col(GRAVEL).surf(S.SURF.PLAIN);
    // the tower bank's ground in three pieces at every station (so that neighbours share their corners): quay to
    // the railway's cut, the cut's own width (left open where the trench is), the cut to the far edge
    const ca = riverSide(xa, CUT_OFF0), cb = riverSide(xb, CUT_OFF0), da = riverSide(xa, CUT_OFF1), db = riverSide(xb, CUT_OFF1);
    laidQuad(gb, [na[0], G, na[1]], [nb[0], G, nb[1]], [cb[0], G, cb[1]], [ca[0], G, ca[1]]);
    if (!inRailwayCut(xa, xb)) laidQuad(gb, [ca[0], G, ca[1]], [cb[0], G, cb[1]], [db[0], G, db[1]], [da[0], G, da[1]]);
    if (Math.max(Math.abs(da[0]), Math.abs(db[0])) <= GROUNDS_X + 1e-6 && Math.max(da[1], db[1]) < GARDEN.z0) {
      // between the fences the plane stops at the garden's near edge and begins again at the far avenue: the
      // garden's own ground lies in the hole (its span in x is kept for it)
      laidQuad(gb, [da[0], G, da[1]], [db[0], G, db[1]], [db[0], G, GARDEN.z0], [da[0], G, GARDEN.z0]);
      laidQuad(gb, [da[0], G, GARDEN.z1], [db[0], G, GARDEN.z1], [db[0], G, FAR_Z], [da[0], G, FAR_Z]);
      gardenSpan[0] = Math.min(gardenSpan[0], da[0], db[0]); gardenSpan[1] = Math.max(gardenSpan[1], da[0], db[0]);
    } else laidQuad(gb, [da[0], G, da[1]], [db[0], G, db[1]], [db[0], G, FAR_Z], [da[0], G, FAR_Z]);
    laidQuad(gb, [fa[0], G, fa[1]], [fb[0], G, fb[1]], [fb[0], G, -FAR_Z], [fa[0], G, -FAR_Z]);
    gb.col(BED);
    laidQuad(gb, [fa[0], BED_Y, fa[1]], [fb[0], BED_Y, fb[1]], [lb[0], BED_Y, lb[1]], [la[0], BED_Y, la[1]]);
    // the Trocadero bank's wall faces +Z (laid toward +X), the tower bank's and the low bank's edge face -Z; each quay
    // wall carries a parapet but for the bridge's mouth, where the roadway comes through
    const mouth = Math.abs(xa) <= BRIDGE_MOUTH && Math.abs(xb) <= BRIDGE_MOUTH, top = mouth ? G : G + PARAPET;
    gb.col(QUAY, 0.62, 1).surf(S.SURF.MASONRY, 0, 1.2);
    gb.wall(fb[0], fb[1], fa[0], fa[1], BED_Y, top, { m: 1 });
    gb.wall(na[0], na[1], nb[0], nb[1], LB, top, { m: 1 });
    gb.wall(la[0], la[1], lb[0], lb[1], BED_Y, LB, { m: 1 });
    if (!mouth) {                                           // the parapets' backs and tops
      gb.col(QUAY, 0.9, 1);
      gb.wall(fa2[0], fa2[1], fb2[0], fb2[1], G, top, { m: 1 });
      gb.wall(nb2[0], nb2[1], na2[0], na2[1], G, top, { m: 1 });
      laidQuad(gb, [fa[0], top, fa[1]], [fb[0], top, fb[1]], [fb2[0], top, fb2[1]], [fa2[0], top, fa2[1]]);
      laidQuad(gb, [na[0], top, na[1]], [nb[0], top, nb[1]], [nb2[0], top, nb2[1]], [na2[0], top, na2[1]]);
    }
    // the low bank's top
    gb.col(BERGE).surf(S.SURF.PLAIN);
    laidQuad(gb, [la[0], LB, la[1]], [lb[0], LB, lb[1]], [nb[0], LB, nb[1]], [na[0], LB, na[1]]);
    if (i % 32 === 31) await ctx.yield();
  }
  await ctx.yield();
  const ground = new THREE.Mesh(gb.toGeometry(), mats.facade); ground.name = 'ground-and-channel';
  scene.add(ground);
  await ctx.yield();

  // ---- the garden: its ground in the hole between the fences
  // (the grass and the leaves take a fill of their own at night, written by skyAt: their greens are too deep to
  // show under the navy fill that suits the pale stone and gravel; the lakes' still water gives back the sky)
  const uLeafFill = { value: new THREE.Color(0, 0, 0) }, uPondSky = { value: new THREE.Color(0, 0, 0) };
  const pond = pondUniforms();
  buildGardenGround(scene, mats, gardenSpan[0], gardenSpan[1], uLeafFill, uPondSky, pond);
  await ctx.yield();
  await buildGardenWorks(ctx, scene, mats);
  const halls = await buildHalls(ctx, scene, mats);
  const trees = await buildTrees(ctx, scene, mats, uLeafFill);

  // ---- the river: the kit's river along the bent middle line, a little wider than the channel so that its faded
  // edges lie inside the walls; deep blue water that mirrors the sky and its band. Its ripple is kept low: the kit
  // draws its ripples long along the flow, and seen low from the line a strong ripple rules the whole reach with
  // straight lines that meet at the horizon; the lamps' streaks and their short-crested ripples are the strip's above
  // (the body of the water is lit by this light's ambient: the kit's own mean of the dome is a dark blue at dusk, so
  // a paler one is given here)
  const waterLight = Water.waterLight(sky, { ambient: DUSK.waterAmbient });
  await ctx.yield();
  const river = Water.makeRiver({ points: RIVER_XS.map((x) => [x, WY, riverZ(x)]), width: 2 * RIVER_HALF + 4, across: 10,
    speed: 0.8, foam: 0.04, bankFoam: 0.08, ripple: 0.25, chop: 0.2, opacity: 0.9, roughness: 0.03,
    deep: DUSK.waterDeep, shallow: DUSK.waterShallow, light: waterLight });
  scene.add(river.object);
  await ctx.yield();

  // ---- the bridge, by hand from FRAME.bridge: five low segmental arches along Z between x -7 and +7, four piers
  // with pointed cutwaters, the abutments, spandrel walls, a string course, the roadway with its two ramps to the
  // quays, parapets. The flown line passes under the arch at BR.archZ[3], the second from the tower's bank.
  const bb = new S.Builder(8192), HW = BR.halfWidth, HALF = BR.span / 2, ARCH_SEG = 24;
  const CAP_Y = BR.springY + 0.6, CUTWATER = 2.6, RAMP = 26;   // WORKING: the piers' cap course, the cutwaters' reach, the ramps' length
  const stoneLo = STONE.map((v) => v * 0.6), stoneHi = STONE, byZ = (p) => [p[2], p[1]];
  // THE LIGHT ON THE BRIDGE'S STONE (BRIDGE_LIGHT; INVENTED BY NEED with the dressed stone: under the dusk's one
  // fill the bridge is a flat grey strip). FROM THE LAMPS ABOVE: the stone of each face is drawn paler round the
  // foot of each of its own side's arc lamps (a tone laid at build on the faces' corners: `arc` times paler at a
  // standard's foot, half that `reach` metres from it), so that the parapet, the cornice and the spandrel under
  // each standard stand out pale and the stone between them falls back. FROM THE WATER BELOW: the kit's own
  // night wash on masonry (flood), strongest at the piers' caps and falling with height (`water`, `fall`): the
  // warm light the river throws up on the piers, the cutwaters and the arches' undersides. WORKING: every level.
  const BRIDGE_LIGHT = { arc: 1.0, reach: 4.5, water: 0.62, fall: 3.5, piece: 3.875 };
  const lampZ = (sx) => BR.archZ.map((za) => Math.min(BR.z1 - 0.5, Math.max(BR.z0 + 0.5, za + sx * (BR.span + BR.pierWidth) / 2)));
  const LAMP_Z = [lampZ(-1), lampZ(1)];
  const arcAt = (sx, y, z) => { let f = 0; for (const lz of LAMP_Z[sx > 0 ? 1 : 0]) f += 1 / (1 + ((z - lz) ** 2 + (BR.parapetY - y) ** 2) / BRIDGE_LIGHT.reach ** 2); return 1 + BRIDGE_LIGHT.arc * f; };
  const arcLit = [(p) => arcAt(-1, p[1], p[2]), (p) => arcAt(1, p[1], p[2])], litOf = (sx) => arcLit[sx > 0 ? 1 : 0];
  bb.flood(BRIDGE_LIGHT.water, BR.springY + 0.6, BRIDGE_LIGHT.fall);
  bb.col(STONE, 0.62, 1).surf(S.SURF.MASONRY, 0, 1.2);
  for (const zc of BR.archZ) {
    for (let k = 0; k < ARCH_SEG; k++) {
      const za = zc - HALF + BR.span * k / ARCH_SEG, zb = za + BR.span / ARCH_SEG, ua = soffitY(za - zc), ub = soffitY(zb - zc);
      for (const sx of [-1, 1]) stoneFace(bb, [[sx * HW, ua, za], [sx * HW, ub, zb], [sx * HW, BR.deckY, zb], [sx * HW, BR.deckY, za]], [sx, 0, 0], stoneLo, stoneHi, byZ, litOf(sx));
      // the soffit, facing down
      stoneFace(bb, [[-HW, ua, za], [HW, ua, za], [HW, ub, zb], [-HW, ub, zb]], [0, -1, 0], stoneLo, stoneLo, (p) => [p[0], p[2]]);
    }
  }
  await ctx.yield();
  // THE BRIDGE'S DRESSED STONE (BRIDGE_DRESS). SOURCED: five equal arches of 28 m and 3.3 m rise on piers 3 m
  // thick, 14 m from face to face, square bodies at the abutments under the pedestals (src-site.md "Pont d'Iena",
  // Lazare), carved eagles on the spandrels over the piers (src-site.md "eagles on the spandrels"). INVENTED BY
  // NEED (the sources give the arches and piers, not their mouldings; a plain block cannot stand for a stone
  // bridge of 1814): each arch's ARCHIVOLT, a ring of pale dressed stone along the arch's edge standing proud of
  // the face, closed underneath and above, with a keystone at its crown; a pale cap course on each pier and a
  // sloped stone cap on each cutwater; a flat pilaster up the spandrel over each pier, left bare (NOT BUILT: the
  // eagle that was carved there; nothing stands in its place); a cornice under the parapet (a dark hollow, a
  // pale fillet); a coping on the parapet and a stone block under each lamp standard. WORKING: every size.
  // NOT BUILT: the cover the bridge wore in 1889 (kit-history.md: it was covered that year, the cover's form not
  // found): the bridge stands open to the sky.
  const BRIDGE_DRESS = { ring: 0.75, proud: 0.18, seg: 12, key: [1.1, 0.4], cap: [0.5, 0.15], chaperon: 1, pilaster: [2.2, 0.2],
    cornice: [0.45, 0.45, 0.2], coping: [0.15, 0.1], block: [0.8, 1.5, 0.3] };
  const BD = BRIDGE_DRESS, DRESSED = S.lin('#ded5bf'), ringLo = DRESSED.map((v) => v * 0.88), ringHi = DRESSED.map((v) => v * 1.1), CORNICE_Y = BR.deckY - BD.cornice[1];
  bb.surf(S.SURF.PLAIN);
  for (const zc of BR.archZ) for (const sx of [-1, 1]) {
    const x = sx * (HW + BD.proud), f = sx * HW;
    for (let k = 0; k < BD.seg; k++) {
      const za = zc - HALF + BR.span * k / BD.seg, zb = za + BR.span / BD.seg, ua = soffitY(za - zc), ub = soffitY(zb - zc), ta = Math.min(ua + BD.ring, CORNICE_Y), tb = Math.min(ub + BD.ring, CORNICE_Y);
      stoneFace(bb, [[x, ua, za], [x, ub, zb], [x, tb, zb], [x, ta, za]], [sx, 0, 0], ringLo, ringHi, byZ, litOf(sx));
      stoneFace(bb, [[f, ua, za], [x, ua, za], [x, ub, zb], [f, ub, zb]], [0, -1, 0], ringLo, ringLo, byZ);     // its underside, over the opening's edge
      stoneFace(bb, [[f, ta, za], [x, ta, za], [x, tb, zb], [f, tb, zb]], [0, 1, 0], ringHi, ringHi, byZ);      // its upper edge
    }
    // the keystone: a block at the crown, proud of the ring, from the soffit's level to the cornice
    bb.col(DRESSED, 0.95, 1.15).box(Math.min(f, sx * (HW + BD.key[1])), BR.crownY, zc - BD.key[0] / 2, Math.max(f, sx * (HW + BD.key[1])), CORNICE_Y, zc + BD.key[0] / 2, { bottom: true, top: false });
  }
  bb.col(STONE, 0.62, 1).surf(S.SURF.MASONRY, 0, 1.2);
  await ctx.yield();
  // the piers and the two abutments: the spandrel over each, the body below
  const solids = [[BR.z0, BR.archZ[0] - HALF, false]];
  for (let k = 0; k + 1 < BR.archZ.length; k++) solids.push([BR.archZ[k] + HALF, BR.archZ[k + 1] - HALF, true]);
  solids.push([BR.archZ[BR.archZ.length - 1] + HALF, BR.z1, false]);
  for (const [za, zb, pier] of solids) {
    for (const sx of [-1, 1]) stoneFace(bb, [[sx * HW, BR.springY, za], [sx * HW, BR.springY, zb], [sx * HW, BR.deckY, zb], [sx * HW, BR.deckY, za]], [sx, 0, 0], stoneLo, stoneHi, byZ, litOf(sx));
    const zm = (za + zb) / 2;
    if (!pier) { bb.box(-HW, BED_Y, za, HW, BR.springY, zb, { m: 1, top: false }); continue; }
    // a pier: its body with the two pointed cutwaters up to the springing, a pale cap course a little wider, a
    // sloped cap on each cutwater up the face, a bare flat pilaster over it to the cornice
    const plan = (e) => [[-HW, zb + e], [HW, zb + e], [HW + CUTWATER + 1.6 * e, zm], [HW, za - e], [-HW, za - e], [-HW - CUTWATER - 1.6 * e, zm]];
    bb.col(STONE, 0.62, 1).surf(S.SURF.MASONRY, 0, 1.2).prism(plan(0), BED_Y, CAP_Y - BD.cap[0], { m: 1, top: false });
    bb.col(DRESSED, 0.9, 1.08).surf(S.SURF.PLAIN).prism(plan(BD.cap[1]), CAP_Y - BD.cap[0], CAP_Y, { capColor: DRESSED });
    for (const sx of [-1, 1]) {
      const f = sx * HW, tip = [sx * (HW + CUTWATER), CAP_Y, zm], top = [f, CAP_Y + BD.chaperon, zm], [pw, pp] = BD.pilaster, px = sx * (HW + pp);
      bb.col(DRESSED, 0.85, 1.05);
      if (sx > 0) bb.tri(tip, [f, CAP_Y, za], top).tri([f, CAP_Y, zb], tip, top); else bb.tri([f, CAP_Y, za], tip, top).tri(tip, [f, CAP_Y, zb], top);
      bb.col(STONE, 0.8 * arcAt(sx, CAP_Y, zm), Math.min(1.6, 1.02 * arcAt(sx, CORNICE_Y, zm))).surf(S.SURF.MASONRY, 0, 1.2).box(Math.min(f, px), CAP_Y, zm - pw / 2, Math.max(f, px), CORNICE_Y, zm + pw / 2, { m: 1, top: false });
      bb.surf(S.SURF.PLAIN);                               // the next cutwater's cap is plain dressed stone
    }
  }
  // the cornice under the parapets (a dark hollow sloping out, a pale fillet, its top), the parapets with their
  // copings, the roadway
  for (const sx of [-1, 1]) {
    const f = sx * HW, [co, , cf] = BD.cornice, e = sx * (HW + co), yf = BR.deckY - cf, hollow = STONE.map((v) => v * 0.42), slope = Math.hypot(co, yf - CORNICE_Y);
    bb.surf(S.SURF.PLAIN);
    stoneFace(bb, [[f, CORNICE_Y, BR.z0], [f, CORNICE_Y, BR.z1], [e, yf, BR.z1], [e, yf, BR.z0]], [sx * (yf - CORNICE_Y) / slope, -co / slope, 0], hollow, hollow, byZ);
    stoneFace(bb, [[e, BR.deckY, BR.z0], [e, BR.deckY, BR.z1], [f, BR.deckY, BR.z1], [f, BR.deckY, BR.z0]], [0, 1, 0], ringHi, ringHi, byZ);
    // (the fillet's face, the parapet's two faces and its coping's outer edge and top in short pieces along the
    // bridge, each corner paler by the lamps' light at its place)
    const lit = litOf(sx), fi = sx * (HW - 0.45), co0 = sx * (HW + BD.coping[1]), co1 = sx * (HW - 0.45 - BD.coping[1]), yc = BR.parapetY + BD.coping[0], N = Math.round(BR.length / BRIDGE_LIGHT.piece);
    const copeLo = DRESSED.map((v) => v * 0.95), copeHi = DRESSED.map((v) => Math.min(1, v * 1.1)), paraLo = STONE.map((v) => v * 0.85);
    for (let k = 0; k < N; k++) {
      const za = BR.z0 + BR.length * k / N, zb = BR.z0 + BR.length * (k + 1) / N;
      bb.surf(S.SURF.PLAIN);
      stoneFace(bb, [[e, yf, za], [e, yf, zb], [e, BR.deckY, zb], [e, BR.deckY, za]], [sx, 0, 0], ringHi, ringHi, byZ, lit);
      stoneFace(bb, [[co0, BR.parapetY, za], [co0, BR.parapetY, zb], [co0, yc, zb], [co0, yc, za]], [sx, 0, 0], copeLo, copeHi, byZ, lit);
      stoneFace(bb, [[co0, yc, za], [co0, yc, zb], [co1, yc, zb], [co1, yc, za]], [0, 1, 0], copeHi, copeHi, byZ, lit);
      bb.surf(S.SURF.MASONRY, 0, 1.2);
      stoneFace(bb, [[f, BR.deckY, za], [f, BR.deckY, zb], [f, BR.parapetY, zb], [f, BR.parapetY, za]], [sx, 0, 0], paraLo, STONE, byZ, lit);
      stoneFace(bb, [[fi, BR.deckY, za], [fi, BR.deckY, zb], [fi, BR.parapetY, zb], [fi, BR.parapetY, za]], [-sx, 0, 0], paraLo, STONE, byZ, lit);
    }
    // (the coping's inner edge and its two ends, the parapet's two ends)
    bb.col(DRESSED, 0.95, 1.1).surf(S.SURF.PLAIN).wall(co1, sx > 0 ? BR.z0 : BR.z1, co1, sx > 0 ? BR.z1 : BR.z0, BR.parapetY, yc);
    for (const [ze, dir] of [[BR.z0, -1], [BR.z1, 1]]) {
      const a = Math.min(co0, co1), c = Math.max(co0, co1), pa = Math.min(f, fi), pc = Math.max(f, fi);
      if (dir < 0) { bb.wall(c, ze, a, ze, BR.parapetY, yc); bb.col(STONE, 0.85, 1).wall(pc, ze, pa, ze, BR.deckY, BR.parapetY); } else { bb.wall(a, ze, c, ze, BR.parapetY, yc); bb.col(STONE, 0.85, 1).wall(pa, ze, pc, ze, BR.deckY, BR.parapetY); }
      bb.col(DRESSED, 0.95, 1.1);
    }
  }
  bb.col(STONE, 0.62, 1).surf(S.SURF.MASONRY, 0, 1.2);
  const ROAD = S.lin('#8d877c');
  bb.col(ROAD).surf(S.SURF.PLAIN);
  laidQuad(bb, [-HW, BR.deckY, BR.z0], [HW, BR.deckY, BR.z0], [HW, BR.deckY, BR.z1], [-HW, BR.deckY, BR.z1]);
  // the two ramps from the roadway down to the quays, with their side walls
  for (const [ze, dir] of [[BR.z0, -1], [BR.z1, 1]]) {
    const zf = ze + dir * RAMP;
    bb.col(ROAD).surf(S.SURF.PLAIN);
    laidQuad(bb, [-HW, BR.deckY, ze], [HW, BR.deckY, ze], [HW, G, zf], [-HW, G, zf]);
    bb.col(STONE, 0.7, 1).surf(S.SURF.MASONRY, 0, 1.2);
    for (const sx of [-1, 1]) {                             // a three-cornered wall under each edge of the ramp, facing outward
      const A = [sx * HW, G, ze], B = [sx * HW, G, zf], T = [sx * HW, BR.deckY, ze];
      if (-dir === sx) bb.tri(A, B, T, stoneLo, stoneLo, stoneHi, byZ(A), byZ(B), byZ(T)); else bb.tri(A, T, B, stoneLo, stoneHi, stoneLo, byZ(A), byZ(T), byZ(B));
    }
  }
  await ctx.yield();

  // the four pedestals at the bridge's ends, each with a dark group in the round, a standing horse and a man at
  // its head (no feature, no face, no letter), and the ten standards of the arc lamps on the parapets. SOURCED: figures.md B, "Pont
  // d'Iena" (four horsemen on end pedestals) and src-light.md 6, "Quay and bridges" (ten arcs on the bridge)
  // THE PEDESTALS' DRESS AND THE GROUPS' MASSES (INVENTED BY NEED with the bridge's dressed stone: the sources give
  // four horsemen on end pedestals, FRAME their place and height; a bare block reads from the river as an
  // unfinished house): each pedestal a plinth, a base moulding, the die with a pale dressed panel on each face, a
  // cornice in two steps and a low attic; each group a dark mass in the round, a standing horse (barrel, chest,
  // haunch, arched neck, head, four legs, one fore leg lifted, a tail) and a man at its head with one arm up to
  // the bridle: no feature, no face, no letter. WORKING: every size (PED: the die's width, the plinth's and the
  // cornice's, the group's size beside a man of two metres).
  const PD = BR.pedestals, PED_W = 4, PED_BASE = G, PED_TOP = PED_BASE + PD.height;   // WORKING: 4 m square; FRAME's height stands above the quay
  const PED = { plinth: [5, 1.1], base: [4.5, 0.3], cornice: [[4.5, 0.35], [5.1, 0.35]], attic: [4.2, 0.8], panel: [2.5, 0.08, 0.9], group: 1.35 };
  const BRONZE = S.lin('#2a2b30'), IRON = S.lin('#23262c'), washed = () => bb.flood(BRIDGE_LIGHT.water, BR.springY + 0.6, BRIDGE_LIGHT.fall);
  for (const pz of PD.z) for (const px of PD.x) {
    washed();                                               // the pedestals' stone takes the bridge's own wash; the dark groups none
    const toMid = pz < RIVER_MID ? 1 : -1;                  // the group faces along the bridge toward its middle
    const dieTop = PED_TOP - PED.attic[1] - PED.cornice[0][1] - PED.cornice[1][1], dieFoot = PED_BASE + PED.plinth[1] + PED.base[1];
    bb.col(STONE, 0.55, 0.7).surf(S.SURF.MASONRY, 0, 1.2).cbox(px, PED_BASE, pz, PED.plinth[0], PED.plinth[1], PED.plinth[0], { m: 1 });
    bb.col(DRESSED, 0.8, 0.95).surf(S.SURF.PLAIN).cbox(px, PED_BASE + PED.plinth[1], pz, PED.base[0], PED.base[1], PED.base[0]);
    bb.col(STONE, 0.66, 1).surf(S.SURF.MASONRY, 0, 1.2).cbox(px, dieFoot, pz, PED_W, dieTop - dieFoot, PED_W, { m: 1, top: false });
    bb.col(DRESSED, 0.82, 1.06).surf(S.SURF.PLAIN);
    for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {   // a pale panel on each face of the die
      const w = PED.panel[0], t = PED.panel[1], out = PED_W / 2 + t / 2;
      bb.cbox(px + ox * out, dieFoot + PED.panel[2], pz + oz * out, ox ? t : w, dieTop - dieFoot - 2 * PED.panel[2], ox ? w : t, { bottom: true });
    }
    bb.col(DRESSED, 0.9, 1.05).cbox(px, dieTop, pz, PED.cornice[0][0], PED.cornice[0][1], PED.cornice[0][0], { bottom: true });
    bb.col(DRESSED, 0.95, 1.1).cbox(px, dieTop + PED.cornice[0][1], pz, PED.cornice[1][0], PED.cornice[1][1], PED.cornice[1][0], { bottom: true });
    bb.col(STONE, 0.9, 1.05).cbox(px, PED_TOP - PED.attic[1], pz, PED.attic[0], PED.attic[1], PED.attic[0]);
    // the group, in its own frame on the pedestal's top: Z toward the bridge's middle, X toward the bridge's outer side
    bb.flood(0).col(BRONZE, 0.8, 1.15).surf(S.SURF.PLAIN).tr(px, PED_TOP, pz, toMid > 0 ? 0 : Math.PI, PED.group);
    const o = Math.sign(px) * toMid, hx = -0.4 * o, mx = 0.55 * o;   // the horse stands toward the roadway, the man outside it
    bb.beam([hx, 1.55, -0.85], [hx, 1.6, 0.75], 0.62, 0.7);                                                           // the barrel
    bb.sphere(hx, 1.62, 0.78, 0.43, 6, 4).sphere(hx, 1.6, -0.88, 0.46, 6, 4);                                         // chest and haunch
    bb.beam([hx, 1.8, 0.9], [hx, 2.62, 1.36], 0.3, 0.5).beam([hx, 2.7, 1.3], [hx, 2.3, 1.85], 0.22, 0.32);            // the neck arched, the head
    for (const s of [-1, 1]) {
      bb.beam([hx + s * 0.2, 1.3, -0.9], [hx + s * 0.2, 0.62, -1.08], 0.17).beam([hx + s * 0.2, 0.62, -1.08], [hx + s * 0.2, 0, -0.95], 0.13);   // a hind leg
      if (s * o > 0) bb.beam([hx + s * 0.2, 1.25, 0.8], [hx + s * 0.2, 0, 0.84], 0.14);                               // the fore leg that stands
      else bb.beam([hx + s * 0.2, 1.25, 0.8], [hx + s * 0.2, 0.78, 1.18], 0.15).beam([hx + s * 0.2, 0.78, 1.18], [hx + s * 0.2, 0.36, 1.02], 0.12);   // the one lifted
    }
    bb.beam([hx, 1.72, -1.28], [hx, 0.8, -1.56], 0.16, 0.24);                                                         // the tail
    bb.beam([mx - 0.11, 0, 1.2], [mx - 0.09, 0.95, 1.28], 0.17).beam([mx + 0.13, 0, 1.44], [mx + 0.09, 0.95, 1.3], 0.17);   // the man's legs, astride
    bb.beam([mx, 0.9, 1.29], [mx, 1.62, 1.31], 0.46, 0.27).sphere(mx, 1.83, 1.32, 0.14, 6, 4);                        // his body and head
    bb.beam([mx - 0.2 * o, 1.52, 1.36], [hx + 0.14 * o, 2.2, 1.66], 0.11).beam([mx + 0.24 * o, 1.54, 1.28], [mx + 0.3 * o, 0.92, 1.2], 0.11);   // one arm up to the bridle, one down
    bb.pop();
  }
  // WORKING: the standards' height and places: five to a side, over the four piers and at one end (the upstream
  // side's at the tower's bank, the downstream side's at the far bank), none over an arch's crown: the nearest
  // stands 16 m from the flown line (iron's margin, order L5). Each lamp's place is kept.
  const LAMP_POST = 6, bridgeLamps = [];
  for (const za of BR.archZ) for (const sx of [-1, 1]) {
    const lx = sx * (HW - 0.22), y0 = BR.parapetY, zc = Math.min(BR.z1 - 0.5, Math.max(BR.z0 + 0.5, za + sx * (BR.span + BR.pierWidth) / 2));
    // (a block of the parapet's stone under each standard; the standard's foot swells and a cup holds its globe)
    washed().col(DRESSED, 0.85 * arcAt(sx, BR.deckY, zc), 1.6).surf(S.SURF.PLAIN).cbox(lx, BR.deckY, zc, BD.block[0], BR.parapetY + BD.block[2] - BR.deckY, BD.block[1]);
    bb.flood(0).col(IRON, 0.8, 1.1).cbox(lx, y0, zc, 0.6, 0.5, 0.6);
    bb.cyl(lx, y0 + 0.5, zc, 0.13, 0.07, LAMP_POST, 6).sphere(lx, y0 + 0.5 + LAMP_POST + 0.28, zc, 0.24, 8, 5);
    bb.cyl(lx, y0 + 0.5, zc, 0.24, 0.12, 0.9, 6, { cap: false }).cyl(lx, y0 + LAMP_POST - 0.1, zc, 0.07, 0.22, 0.4, 6, { cap: false });
    bridgeLamps.push([lx, y0 + 0.5 + LAMP_POST + 0.28, zc]);
  }
  await ctx.yield();
  const bridge = new THREE.Mesh(bb.toGeometry(), mats.facade); bridge.name = 'bridge';
  scene.add(bridge);
  await ctx.yield();

  // ---- the tower's bank: sheds, quay houses, the railway's cut (one mesh)
  const bankB = await buildTowerBank(ctx, scene, mats);
  buildRailwayCut(bankB);
  await ctx.yield();
  const quaySmokes = quayChimneys();                      // the quay houses that smoke: each gets its stack here, its plume with the other vapours below
  layQuayStacks(bankB, quaySmokes);
  await ctx.yield();
  const bank = new THREE.Mesh(bankB.toGeometry(), mats.facade); bank.name = 'tower-bank';
  scene.add(bank);
  await ctx.yield();

  // ---- across the river: the Trocadero's hill and palace
  const trocadero = await buildTrocadero(ctx, scene, mats);
  // its gas: one call of the kit's glows, pale gold, each burner flickering a little by the world's clock; skyAt
  // sets its strength (the burners are lit at dusk and tell more as the night comes). The nearest stands over
  // 150 m from the flown line, so the kit's fade near the eye never acts (order L5).
  const T = { value: 0 };                                 // the world's clock, shared by the kit's effects
  const trocaderoGas = fx.makeGlows({ rng: makeRng('trocadero-gas:' + ctx.seed), positions: trocadero.gas, color: '#ffd89a', size: 4.5, intensity: DUSK.palaceGas, time: T, flicker: 0.14 });
  scene.add(trocaderoGas.object);
  await ctx.yield();

  // ---- the far landmarks
  buildFarLandmarks(scene, mats);
  await ctx.yield();

  // ---- the city by hand, both banks
  const net = makeNet();
  layFarRoofs(net, FAR_Z);
  await ctx.yield();
  const city = await buildCity(ctx, scene, mats, net);
  const netMesh = net.mesh();
  scene.add(netMesh);
  await ctx.yield();

  // ---- THE TOWER: the part's hero at the origin, its front toward +Z, lit by the dusk's own uniforms. It yields
  // inside itself between its pieces. Its update takes the clock alone (lift cars, flags, the windows' gas).
  const tower = await buildHero(ctx, { uniforms: towerLight, stoneUniforms: footingLight, gloss: IRON_GLOSS });
  scene.add(tower.object);
  // The places the tower gives for its lights, kept together for the lamps, the fires, the beacon and the beams:
  // cordons (the decks' rims, the piers, the four arches), arcadeGlobes, bengal, beacon, projectors, projectorRail.
  const towerPlaces = tower.anchors;
  await ctx.yield();

  // ---- THE HOUR, BY METRES FLOWN. night(metres) is 0 on the river, rises smoothly from the bridge's far side to
  // the helix's top (two of the route's own places) and is 1 from there to the end: a pure function of the metres
  // flown, so behind the previous portal (0 metres) the world stands in its dusk at any clock.
  const HOUR_FROM = ROUTE.places.bridgeOut, HOUR_TO = ROUTE.places.helixTop;
  const nightAt = (metres) => { const t = Math.min(1, Math.max(0, (metres - HOUR_FROM) / (HOUR_TO - HOUR_FROM))); return t * t * (3 - 2 * t); };
  const ends = {};
  for (const k of HOUR_COLOURS) ends[k] = [new THREE.Color(DUSK[k]), new THREE.Color(NIGHT[k])];
  const tone = (out, k, n) => out.copy(ends[k][0]).lerp(ends[k][1], n);
  const num = (k, n) => DUSK[k] + (NIGHT[k] - DUSK[k]) * n;
  const iron = (out, k, n) => { const a = IRON_LIGHT.dusk[k], b = IRON_LIGHT.night[k]; return out.setRGB(a[0] + (b[0] - a[0]) * n, a[1] + (b[1] - a[1]) * n, a[2] + (b[2] - a[2]) * n); };
  const SU = sky.uniforms, MU = mats.uniforms, NU = net.material.uniforms, RU = river.uniforms, LAMBERT = 1 / Math.PI;
  const glint0 = waterLight.sunColor.clone();             // the river's glint of the afterglow as the dusk has it
  // THE ONE PLACE WHERE THE HOUR IS SET: sky, lights, fog, water, the kit's materials (and with them the garden's
  // ground and the trees, which share their night uniforms), the city's net and the tower's light. Uniform writes only.
  function skyAt(metres) {
    const n = nightAt(metres);
    // the sky: its blues deepen to navy, the stars come out, the band on the afterglow's bearing draws in to an ember
    tone(SU.uZenith.value, 'zenith', n); tone(SU.uMid.value, 'mid', n); tone(SU.uHorizon.value, 'horizon', n); tone(SU.uGround.value, 'ground', n);
    tone(SU.uScatterColor.value, 'scatterColor', n); tone(SU.uSunColor.value, 'glowColor', n);
    SU.uGrad.value.y = num('scatter', n); SU.uGrad.value.z = num('scatterPow', n); SU.uGrad2.value.z = num('scatterFall', n); SU.uGrad.value.w = num('groundFall', n);
    SU.uSun.value.z = num('sunGlow', n); SU.uStars.value.x = num('stars', n);
    // the two lights: the afterglow's key dims and reddens, the fill goes to a cool navy
    tone(key.color, 'key', n); key.intensity = num('keyK', n);
    tone(hemi.color, 'skyFill', n); tone(hemi.groundColor, 'groundFill', n); hemi.intensity = num('fillK', n);
    // the fog takes the sky's own colour under the horizon at every moment
    tone(scene.fog.color, 'fog', n); scene.fog.density = num('fogDensity', n);
    // the river: its mirror of the sky and its body
    waterLight.zenith.copy(SU.uZenith.value); waterLight.mid.copy(SU.uMid.value); waterLight.horizon.copy(SU.uHorizon.value);
    waterLight.scatterColor.copy(SU.uScatterColor.value); waterLight.skyP.z = SU.uGrad.value.y; waterLight.skyP.w = SU.uGrad.value.z; waterLight.skyQ.y = SU.uGrad2.value.z;
    tone(waterLight.ambient, 'waterAmbient', n); tone(RU.uDeep.value, 'waterDeep', n); tone(RU.uShallow.value, 'waterShallow', n);
    waterLight.sunColor.copy(glint0).multiplyScalar(key.intensity / DUSK.keyK);
    // the kit's materials: the gate of their lamps opens with the night; the share of windows lit, the fill and the
    // street glow are given as they act, so each is divided by the gate the kit multiplies them by
    mats.setNight(num('lamps', n));
    const g0 = Math.min(1, Math.max(0, (MU.uNight.value - 0.12) / 0.58)), gate = Math.max(0.05, g0 * g0 * (3 - 2 * g0));
    MU.uLit.value = num('windows', n) / gate; MU.uStreetGlow.value = num('streetGlow', n) / gate;
    tone(MU.uNightFill.value, 'nightFill', n).multiplyScalar(num('nightFillK', n) / gate);
    tone(uLeafFill.value, 'leafFill', n).multiplyScalar(num('leafFillK', n)); uPondSky.value.copy(SU.uMid.value).multiplyScalar(POND_SKY);
    MU.uSkyTop.value.copy(SU.uZenith.value); MU.uSkyHorizon.value.copy(SU.uHorizon.value); MU.uSunColor.value.copy(key.color).multiplyScalar(PANE_GLINT);
    // the city's net: the roofs darken under the sky, the streets' gas and the pavements' lamp pools brighten
    tone(NU.uRoof.value, 'roof', n); tone(NU.uRoofB.value, 'roofB', n); tone(NU.uCourt.value, 'court', n); tone(NU.uPark.value, 'park', n); NU.uWin.value = num('windows', n);
    tone(NU.uStreet.value, 'street', n).multiplyScalar(num('streetK', n)); tone(NU.uLamp.value, 'lamp', n).multiplyScalar(num('lampK', n));
    // the tower: its key and its two fills, the level of its lit windows; the footings as every stone
    iron(towerLight.uKeyColor.value, 'key', n); iron(towerLight.uSkyTop.value, 'top', n); iron(towerLight.uSkyHorizon.value, 'under', n);
    towerLight.uLit.value = num('towerLit', n); towerLight.uAirLow.value.copy(SU.uHorizon.value); towerLight.uAirHigh.value.copy(SU.uMid.value);
    trocaderoGas.uniforms.uIntensity.value = num('palaceGas', n);
    // the halls: more of their bays lit and each light stronger as the night comes; their fill and the gas's wash
    halls.uniforms.uHallLit.value.set(num('hallLit', n), num('hallGas', n), num('hallPearl', n), num('hallGold', n));
    tone(halls.uniforms.uHallFill.value, 'hallFill', n).multiplyScalar(num('hallFillK', n)); tone(halls.uniforms.uHallWash.value, 'hallWash', n).multiplyScalar(num('hallWashK', n));
    const hk = hemi.intensity * LAMBERT, nf = MU.uNightFill.value, warm = MU.uWarm.value, sg = num('streetGlow', n), hs = hemi.color, hg = hemi.groundColor;
    footingLight.uSkyTop.value.setRGB(hs.r * hk + nf.r * gate, hs.g * hk + nf.g * gate, hs.b * hk + nf.b * gate);
    const kc = key.color, kk = key.intensity * LAMBERT * FOOT_ROSE;
    footingLight.uSkyHorizon.value.setRGB(hg.r * hk + nf.r * gate * 0.55 + warm.r * sg + kc.r * kk, hg.g * hk + nf.g * gate * 0.55 + warm.g * sg + kc.g * kk, hg.b * hk + nf.b * gate * 0.55 + warm.b * sg + kc.b * kk);
    return n;
  }
  skyAt(0);

  // ---- THE TOWER'S LAMPS (the part's): the gas cordons and the arcades' globes, the beacon, the two projectors' beams
  // and the Bengal fire, at the places the tower gives. They take the metres flown and the clock, and the night
  // number from the one ramp above.
  await ctx.yield();
  const lamps = await buildLamps(ctx, tower, { nightAt });
  scene.add(lamps.group);
  lamps.update(0, 0, 0);

  // ---- THE GROUND'S LAMPS: the bridge's arcs, the gas of the quays, the avenues and the garden, the garden's masts.
  // They take the night number from the one ramp and the clock; the last of them is lit where the line tops the quay.
  await ctx.yield();
  const groundLamps = await buildGroundLamps(ctx, scene, mats, bridgeLamps, halls.lamps, tower.uniforms.uPx, nightAt(ROUTE.places.quayTop));
  trees.light(groundLamps.lamps); pondLamps(pond, groundLamps.lamps);
  await ctx.yield();

  // ---- THE WATER'S STREAKS: the lights the river gives back, in this order: the bridge's arcs, each bank's quay
  // lamps nearest the bridge, the tower's four lit arches (one light at each arch's own face, three quarters of the
  // way up to its crown), the set of fireworks near the river (at its box's middle). The last two kinds' colours are
  // written by the update: the arches' by the part's own first stage of the gas (metres flown), the fireworks' by
  // their bursts' own phases (the clock).
  const GL = GROUND_LAMPS, k3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k], streakLights = [];
  for (const q of groundLamps.lamps) if (q.kind === 1 && !q.post) streakLights.push({ p: q.p, colour: k3(GL.arc.colour, GL.arc.level * STREAK.arcK), reach: STREAK.arc, threshold: q.threshold });
  for (const bank of [1, -1]) for (const q of groundLamps.lamps.filter((l) => l.quay === bank).sort((l, m) => l.along - m.along).slice(0, STREAK.quay))
    streakLights.push({ p: q.p, colour: k3(GL.gas.colour, GL.gas.level * STREAK.gasK), reach: STREAK.gas, threshold: q.threshold });
  const archAt = streakLights.length, archY = TOWER.arch.centreY + TOWER.arch.radius * 0.75;
  for (const a of Object.values(TOWER.arches)) {
    const out = a.sign * TOWER.halfOuter(archY);
    streakLights.push({ p: a.axis === 'x' ? [out, archY, 0] : [0, archY, out], colour: [0, 0, 0], reach: STREAK.tower, threshold: -1 });
  }
  const fireSets = FIREWORKS.sets.map((f) => { const [x, z] = fromBearing(f.bearing, f.distance); return { ...f, centre: [x, f.y, z], far: f.streak === false }; });
  for (const f of fireSets) if (f.streak !== false) { f.light = streakLights.length; streakLights.push({ p: f.centre, colour: [0, 0, 0], reach: STREAK.fire, threshold: -1 }); }
  const streaks = buildWaterStreaks(scene, streakLights);
  await ctx.yield();

  // ---- THE FAR FIREWORKS (FIREWORKS): this file's own squares of light, on the world's clock; each set's light
  // comes up and falls by the metres flown between places of the route.
  const fire = buildFireworks(scene, fireSets, tower.uniforms.uPx);
  // the first place past helixTop from which a set stands so many degrees clear of the tower: every corner of its
  // box (grown by its widest shell) that far and more to one side of the tower's axis in plan, from the route's own curve
  const clearFrom = (f, degrees) => {
    const C = ROUTE.curve, hx = f.area[0] / 2 + f.radius[1], hz = f.area[2] / 2 + f.radius[1];
    for (let d = ROUTE.places.helixTop; d < ROUTE.places.comeAboutStart; d += 2) {
      const i = Math.min(C.count - 1, Math.round(d / C.step)), x = C.x[i], z = C.z[i], toTower = Math.atan2(-x, -z);
      let lo = Infinity, hi = -Infinity;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        let a = Math.atan2(f.centre[0] + sx * hx - x, f.centre[2] + sz * hz - z) - toTower;
        a -= 2 * Math.PI * Math.round(a / (2 * Math.PI));
        lo = Math.min(lo, a); hi = Math.max(hi, a);
      }
      if (lo * hi > 0 && Math.min(Math.abs(lo), Math.abs(hi)) >= degrees * RAD) return d;
    }
    return ROUTE.places.comeAboutStart;
  };
  // each set's two windows in metres flown: where its light comes up, where (if anywhere) it falls
  const fireWindows = fireSets.map((f) => {
    const from = f.open === 'clear' ? clearFrom(f, FIREWORKS.clear[0]) : ROUTE.places[f.open[0]], to = f.open === 'clear' ? Math.max(from + 1, clearFrom(f, FIREWORKS.clear[1])) : ROUTE.places[f.open[1]];
    return { from, to, end: f.close ? [ROUTE.places[f.close[0]], ROUTE.places[f.close[1]]] : null };
  });
  const fireRamp = (m, a, b) => { const t = Math.min(1, Math.max(0, (m - a) / (b - a))); return t * t * (3 - 2 * t); };
  const fireGlow = [0, 0, 0];
  await ctx.yield();

  // ---- THE CASCADE'S SHIMMER across the river
  const cascade = buildCascade(scene, trocadero.lights);
  await ctx.yield();

  // ---- THE FOUNTAINS: the jets, their mist and the coloured light on their basins (one call)
  const fountains = await buildFountains(ctx, scene, tower.uniforms.uPx);

  // ---- WHAT MOVES ON THE RIVER AND THE ROADS. The deal's density scales the boats, the carriages and the crowd
  // alone (order L6). One material draws every mover's lamps, steam, wake and streaks; its uniforms are the update's to write.
  const density = Math.min(1.3, Math.max(0.7, ctx.vary && ctx.vary.density != null ? ctx.vary.density : 1));
  const lifeU = { uTime: { value: 0 }, uWaterY: { value: WY }, uLamp: { value: 1 }, uPx: tower.uniforms.uPx, uWind: { value: new THREE.Vector2(WIND.x, WIND.z) },
    uSmoke: { value: new THREE.Color(0, 0, 0) }, uSmokeWarm: { value: new THREE.Color(0, 0, 0) }, uFoam: { value: new THREE.Color(0, 0, 0) } };
  const lifeMat = lifeMaterial(lifeU);
  const boats = await buildBoats(ctx, scene, mats, lifeMat, density);
  const cabs = await buildCabs(ctx, scene, mats, lifeMat, density);
  const citySmokes = cityChimneys(city.nearBlocks);
  await ctx.yield();
  const smokes = await buildSmokes(ctx, scene, mats, lifeMat, [...quaySmokes, ...citySmokes]);

  // ---- THE CROWD: plain figures round the basins, on the walks and the quays and on the tower's two lower
  // platforms, none within 20 m of the flown line (two calls); its number scales with the density
  const crowd = await buildCrowd(ctx, scene, mats, density, groundLamps.lamps, fountains.uniforms.uLight);

  await ctx.yield();
  await sky.prewarm?.(ctx.renderer, null, scene);
  await ctx.yield();

  return {
    scene, path, duration: ROUTE.duration, pace: ROUTE.pace, ride: 'none',
    camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 6000, lookAhead: ROUTE.camera.lookAhead, sway: 0, bank: ROUTE.camera.bank },
    pois: ROUTE.looks,
    portal: ROUTE.portal,
    post: { exposure: EXPOSURE, bloom: { strength: 0.55, radius: 0.7, threshold: 0.9 },
      grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a1230', vignette: 0.25, grain: 0.03, aberration: 0 } },
    update(dt, time, camera, u = 0) {
      const night = skyAt(u * LEN), metres = u * LEN;
      sky.update(dt, time, camera);
      mats.update(dt, time);
      river.update(dt, time);
      tower.update(dt, time);
      lamps.update(dt, time, metres);
      groundLamps.uniforms.uNight.value = night; groundLamps.uniforms.uTime.value = time;   // the ground's lamps come on with the night and flicker by the clock
      // the water's streaks: by the night and the clock; the arches' light by the part's first stage of the gas
      streaks.uniforms.uNight.value = night; streaks.uniforms.uTime.value = time;
      // the low sky the water carries: the horizon's tone of this hour, the afterglow's with its key's strength
      streaks.uniforms.uRim.value.copy(SU.uHorizon.value).multiplyScalar(STREAK.rim);
      streaks.uniforms.uGlow.value.copy(SU.uScatterColor.value).multiplyScalar(STREAK.glow * key.intensity / DUSK.keyK);
      const st = lamps.stats.stages, arches = Math.min(1, Math.max(0, (metres - st[0][0]) / (st[1][0] - st[0][0]))), gold = LIGHTS.gas.gold, ak = STREAK.towerK * arches * arches;
      for (let k = 0; k < 4; k++) { const c = streaks.lampC[archAt + k]; c.x = gold[0] * ak; c.y = gold[1] * ak; c.z = gold[2] * ak; }
      // the fireworks: each set's light by the metres flown, its sparks by the clock; the isle's glint by its
      // burning shells' own colours
      fire.uniforms.uTime.value = time;
      for (let si = 0; si < fireSets.length; si++) {
        const f = fireSets[si], w = fireWindows[si], fireK = fireRamp(metres, w.from, w.to) * (w.end ? 1 - fireRamp(metres, w.end[0], w.end[1]) : 1);
        fire.uniforms.uSetP.value[si].w = FIREWORKS.level * f.level * fireK;
        if (f.light === undefined) continue;               // a set far from the river throws no glint on it
        const c = streaks.lampC[f.light], g = STREAK.fireK * FIREWORKS.glint * fireK, gl = fireGlint(f, si, fire.phases[si], time, fireGlow);
        c.x = gl[0] * g; c.y = gl[1] * g; c.z = gl[2] * g;
      }
      // the cascade: its level by the night, its bands by the clock
      const ck = CASCADE.dusk + (CASCADE.night - CASCADE.dusk) * night, cc = CASCADE.colour;
      cascade.uniforms.uColour.value.setRGB(cc[0] * ck, cc[1] * ck, cc[2] * ck); cascade.uniforms.uTime.value = time;
      // the palace's fire on the river: its level by the night, as the palace's gas
      const sk = PALACE_SHEEN.dusk + (PALACE_SHEEN.night - PALACE_SHEEN.dusk) * night, sc = PALACE_SHEEN.colour;
      cascade.uniforms.uSheen.value.setRGB(sc[0] * sk, sc[1] * sk, sc[2] * sk);
      // the fountains: their drops, mist and colours by the clock; the coloured light up by the metres flown, the
      // tower fountain's with the arches' gas over it
      fountains.set(time, metres, SU.uHorizon.value, arches);
      // what moves: every boat's place by the clock (matrices); the vapours' light from the sky's fill and horizon
      // and from the lamps below, the foam's from the horizon, the movers' lamps a little stronger as the night comes
      boats.place(time); cabs.place(time); smokes.place(time);
      lifeU.uTime.value = time; lifeU.uLamp.value = LIFE_LIGHT.lamp[0] + (LIFE_LIGHT.lamp[1] - LIFE_LIGHT.lamp[0]) * night;
      const hz = SU.uHorizon.value, fk = hemi.intensity * LIFE_LIGHT.fill, hzk = LIFE_LIGHT.horizon, gr = LIFE_LIGHT.grey;
      lifeU.uSmoke.value.setRGB(hemi.color.r * fk + hz.r * hzk + gr, hemi.color.g * fk + hz.g * hzk + gr, hemi.color.b * fk + hz.b * hzk + gr);
      lifeU.uSmokeWarm.value.copy(MU.uWarm.value).multiplyScalar(LIFE_LIGHT.warm[0] + (LIFE_LIGHT.warm[1] - LIFE_LIGHT.warm[0]) * night);
      lifeU.uFoam.value.setRGB(hz.r * LIFE_LIGHT.foam + LIFE_LIGHT.foamGrey, hz.g * LIFE_LIGHT.foam + LIFE_LIGHT.foamGrey, hz.b * LIFE_LIGHT.foam + LIFE_LIGHT.foamGrey);
      crowd.uniforms.uCrowdTime.value = time; crowd.uniforms.uCrowdNight.value = night;   // the crowd walks by the clock; its lamps' light comes on with the night
      trees.uTreeTime.value = time; trees.uLampNight.value = night;   // the trees sway by the clock alone; the lamps' light on their crowns comes on with the night
      // the lakes' water: the clock, the night number, the horizon's tone of this hour and the afterglow's with its key's strength
      pond.uPondTime.value = time; pond.uPondNight.value = night; pond.uPondHorizon.value.copy(SU.uHorizon.value);
      pond.uPondGlow.value.copy(SU.uScatterColor.value).multiplyScalar(POND.glow * key.intensity / DUSK.keyK);
      halls.uniforms.uHallTime.value = time;               // the halls' gas wavers and their arc light hums by the clock alone
      T.value = time;                                      // the gas flickers by the clock alone
      NU.uTime.value = time;                               // the far city's lamps twinkle by the clock alone
    },
    dispose() { sky.dispose?.(); skyNoise.dispose(); tower.dispose(); lamps.dispose(); groundLamps.dispose(); streaks.dispose(); fire.dispose(); cascade.dispose(); halls.dispose(); fountains.dispose(); trees.dispose(); boats.dispose(); cabs.dispose(); smokes.dispose(); crowd.dispose(); lifeMat.dispose(); },
  };
}

export default {
  id: 'iron-tower-first-night',
  name: 'Iron Tower First Night',
  category: 'city',
  weirdness: 0.05,
  media: ['air', 'water'],
  async build(ctx) {
    await ctx.yield();                                    // the task that starts build() also carries the loading of the modules
    buildWorld(null);                                     // compiled here, nothing run
    await ctx.yield();
    return buildWorld(ctx);
  },
};
