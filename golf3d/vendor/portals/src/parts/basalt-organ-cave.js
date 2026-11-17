// THE ORGAN CAVE: hero set piece of the world "basalt-organ-cave".
//
// WHAT IS WHERE (local space = the brief's: +Z seaward/south, +X east, +Y up, mean sea level y = 0, the mouth at z = 0;
// add hero.object to the scene at the origin, unrotated: the shaders read place in this space)
//   The headland: a superellipse 240 m wide (x -120..120), its face bowing 3 m, from z = 0 back to z = -130; turf top at 46 m
//     rising to 58.6 m round the blowhole's lip. Its front and returns (to z = -47) are an ORGAN of true polygonal columns:
//     towers of pipes 2 m proud either side of the mouth (x 9.5 to 24), then bays standing 4.6 m back between buttresses
//     (the first bay at 25 to 44 m from the mouth, the rest dealt by the seed). The pipes stand in bundles about 3 m wide
//     that end at their own heights (27 to 38 m; the towers to 44 m), the rows behind stepping up and back. Over them a
//     10 m cap (entablature) of thin slumped columns in broad sheaves: it hangs out over the bays with its underside in
//     shade, throws its shadow down the pipes, and is broken away 6.4 m back over the towers and some buttresses, where
//     the pipes stand free against the sky. Behind z = -47 the cap slumps to the sea as one displaced cliff.
//     The foot: a causeway of stumps 5.2 m wide stepping down into the sea (1.4 m a step, the last awash) on a dark
//     wave-cut plinth; up to 64 fallen drums lie across the steps; the swash runs up the stumps and leaves lace.
//     Long grass (about 2,500 tufts of two blades, tossing) fringes the cap's edge and the blowhole's lip; round the lip no
//     tuft, root or tip, stands nearer the axis than the chimney's wall (6.3 m).
//   The cave: a gothic slot 16 m wide and 24 m high at the mouth, 88.6 m deep. Nave x -8..8; the choir z -30..-60 widens west to
//     x = -18 (26 m) over a staircase of about 390 stumps from 3.4 m below to 4.2 m above mean level (its low steps level
//     shelves; plus a broken shelf along the nave's west foot); beyond z = -62 the walls close to 12 m and the apex falls to
//     17 m. Roof: about 1,900 hanging stubs at uneven depths. Sand floor 5 to 7 m down along the middle, banked to 3.3 m down
//     along the walls' feet, a sill in the mouth, low boulders behind z = -62 (never higher than 4 m down there).
//   The blowhole: a tube 12.6 m wide round the axis from (0, 3, -81) leaning north at 68 degrees for 60 m to the lip at
//     (0, 58.6, -103.5); it opens in a bell 18 m across above the cave's roof (from 9 m along the axis). Its walls are the ends
//     and sides of vertical columns: a staircase of cupped tops on the north side, hanging ends on the south.
//   Two stacks of columns 14 m tall stand in the sea at (63, 46) and (-57, 60).
//   Every column is the Voronoi cell of a jittered, warped honeycomb (pitch 1.05 m; 5, 6 or 7 sides), with three real master
//   joints whose drums sit a little off each other, cross joints every 0.4 to 1.2 m, worn shoulders, a cupped or domed end.
//   THE ROCK'S LIGHT. A joint between two columns is a crack in shadow. Each face takes its tone from its own normal: sun and
//   the sky of its open side outside; the mouth, the shaft and the water inside. Each pipe breaks at its own heights (the
//   shader deals one cross joint to every 0.8 m of it, anywhere in that 0.8 m, bowed and tilted, and a third of them are
//   closed so tight that nothing shows: drums of 0.15 to 2.5 m, no two pipes in step, never a ruled grid); of the joints
//   that show a third are flush hairlines, at the others the upper or the lower drum stands a finger proud. A JOINT IS A
//   DARK GROOVE WITH A HAIR OF LIGHT ON THE LIP BELOW IT (the lip takes a little more of whatever light its face has: it
//   turns no mirror and no glint, so no joint is a bright rule; the gilt is the long edges' and the wet shoulders'), and
//   it is seen only near: gone before a pixel is a hand wide. WET ROCK HAS GLOSS: its film mirrors the mouth's slot (a soft cold streak down the flank of each
//   pipe that is turned for it, the pipe taken as round, broken where a drum turns a little off its neighbour), the shaft,
//   and the lit water (a green sheen from below). Outside, UNDER A LOW SUN (below some 20 degrees) THE ORGAN FRONT IS FRONT-LIT:
//   wet rock that faces the sun takes a broad sheen of the sun's own colour, deepened (bronze to gold on the face turned
//   to it, by the film's normal, so it slides over a pipe as the round thing it is and over a drum as a little barrel),
//   the flanks fall away to the cold teal-black between pipes, the worn shoulders are gilt, the cap's turf is warm; a
//   flat flank does not flash back at an eye that has the sun behind it. Under a high sun the cliff stays dark slate.
//   The mouth's jambs stand in the spray: wet black rock, dark slate in any sun. A bay of the front is in DEEP SHADE, the
//   cold teal-black (never one flat blue, never a hole): the day comes back into it off the sea and the lit buttress
//   beside it, its pipes are faintly seen by their wet shoulders, and under the cap their upper ends die into shade;
//   the mouth alone is black. NOTHING LARGE IS PURE BLACK: a face the sun does not reach takes the sky's fill off the open
//   sea (the wet film gives it back, most on what looks out to sea and up, so a pipe in shade is a round wet thing) and,
//   under a low sun, a little warm light back off the lit rock, most by the mouth; in the mouth's throat a jamb's inner
//   pipes take the same fill from the sky that stands before the mouth. Inside, the top of a stump is a dark wet
//   hexagon holding a disc of water (a cup's, or a flat break's ragged puddle) that mirrors the green hall and the mouth.
//   A face narrower than a few pixels draws no more of the film's mirror than its share of a pixel, and each drum mirrors
//   by its own measure, none at the joint. Columns and ground are drawn on both sides, their backs as the rock's own dark:
//   a sight line that slips through a hairline between pipes ends on that dark, never on the sky beyond the headland.
//   (But a stump that hangs out over the nave or the bell has no underside built: inside, its top seen from behind, and
//   round the bell the inside of a hanging step looked up into from below, are drawn AS that underside: a hexagon end
//   that looks down and takes the emerald from below and the shaft's blue-white. No loose black block hangs there.)
//   INSIDE, A PIPE IS A ROUND THING BEFORE ITS NEIGHBOURS: its nose (the part that looks out of the wall) takes the light,
//   its flanks fall into the hollow between two pipes, which stays dark, for as long as a pipe is a pixel or two wide:
//   the wall's light is parted into columns far down the nave. All the rock in there is wet alike (no cloud of damp in
//   the stone: the green on it is the water's light, the wash and the net).
//   Tide bands by height over MEAN level; their limits wander by noise in world space, a column nudges them by 3 cm at
//   most: a dusty rose coralline crust with darker pits (-3.5..0.5), a barnacle speckle thickening to a white-grey crust
//   (to 2), the tar-black lichen belt (to 4), ochre lichen in ragged patches thinning upward (4..11; daylight only: the
//   cliff and the first 12 m in), sea-ivory specks above. In the cave's own light the rose, the white and the ochre stand
//   at a fuller value and chroma than in the open day, and a pale crust gives back the white part of the green light.
//   Inside, THE GROWTH IGNORES THE MASONRY: it is laid by noise in SPACE, so a crust and a band's ragged limit cross a
//   pipe's edges, its joints and the cracks between pipes unbroken: the rose a continuous crust with small pits a hand
//   across (dark and matt, a few more of them on the proud fronts than in the hollows), the barnacles a pale grain of
//   clusters and never a wash. Where water pours off a broken head, down the tracks of its ropes for a metre or so, and
//   here and there on a worn shoulder, the crust is scoured off and the black wet rock shows: a stump is a short black
//   pipe with a dark wet head, wearing its bands at their true heights. IT IS CRUST, NOT PAINT: inside, a band's limit
//   steps from pipe to pipe (each pipe carries its growth up to half a metre higher or lower than its neighbour) and is
//   ragged within a pipe; the rose wanders from rose to mauve to a bleached grey-pink, each pipe a little its own;
//   clusters of barnacle white bite down into its upper edge; dark wet tracks run down it where the wall drains; every
//   joint is a dark line across it. Over the white belt the TAR BELT is, inside, a thin dark stain on wet rock (order 11:
//   as a matt black skin it lay on the walls in shapeless black blotches that swallowed the pipes): the rock under it
//   keeps its film, its edge light and the net, so shade there follows the columns' form. The ochre lichen
//   climbs the cave's walls as far in as the day reaches (some 20 m).
//   THE CAVE'S WALLS ARE BLACK WET ROCK CARRYING A NET OF LIGHT. The emerald from below is the caustic net's bright lines
//   only (one baked 256 x 256 tile laid twice, meshes about 1.7 and 3 m, drifting and swaying, a little out of focus:
//   curved filaments a hand to a forearm wide with soft edges and brighter knots, lying in pools of light that drift).
//   IT HAS ONE SCALE ON EVERY FACE, whatever way the face looks: on a pipe's sides it is laid as on a round thing (across,
//   the pipe's girth unrolled from its nose and carried on from pipe to pipe by the pipe's place along its wall; up, its
//   height), on a top or an underside by place. On the pavement's blocks it is faint: a stump's own form reads first. THE
//   TALL WALL BEHIND THE PAVEMENT (the choir's west wall, x under -9) IS A QUIET WALL OF COLUMNS: the net lies low on it,
//   clear and slow (whole to 2 m over the water, 0.43 of itself 12 m up, three tenths far up, at four tenths the pace), each pipe is read
//   by its edges' light (its worn shoulders carry a line of the water's green and of the mouth's cold day) and by its
//   gloss, and the tide bands on its tall pipes keep to their heights: the rose a low band at the waterline. EACH STUMP OF THE PAVEMENT IS A FORM: a
//   lighter top (it takes the light that stands over it: the mouth's day, the shaft's, the water's green, the sun where
//   it comes in; most on its worn rim round the shining cup), dark flanks, darker down into the gaps between stumps, the
//   rose and the white belts kept plain at its foot. The net is
//   strong over the lowest 8 m above the water as it stands at that moment, thinning with height to a faint net under the
//   roof; between the lines the rock is near black with its cold gloss (a faint even wash models the pipes, no more);
//   a crust keeps a fuller wash, so the bands hold their own colours. In the flood (setFlood) a second, faster net runs
//   over the first. Daylight thins it toward the mouth; none of it falls outside the cave.
//   THE MOUTH'S COLD WHITE: every worn shoulder whose bearing looks at the mouth carries a hard narrow white line just
//   inside the crack (near pipes only: it melts before a pipe is narrow; broken at the drums), and in the first twenty
//   metres the walls take the mouth's daylight broadly, each pipe on its side toward the mouth, its flank away from it dark.
//   THE SUN DOWN THE NAVE (sunIn, by place): a point inside is in the
//   sun when the straight line from it toward the sun leaves by the mouth's slot (17 m wide to 12 m up, closing to its
//   point at 24 m). What it reaches is gilded, AND THE GILT IS ON THE EDGES: a pipe is lit as the round thing it is (its
//   side toward the sun a thin bronze sheen, its flank dark), the gold lies on the wet worn shoulders that face the sun
//   (a hard line and a soft run of light a hand's length wide beside it), the mouth's own broad daylight gives way
//   there; the net is drowned there, the water under it is jade, and the damp air shows the beam faintly (sunAir). THE
//   LIT WALL'S LIGHT COMES BACK ACROSS THE NAVE: where the sun lies on the wall across from a place that is itself out of
//   the sun, the noses of its pipes and blocks take a warm sheen (their flanks stay black): the shaded wall reads as pipes. At 13 degrees the sun drops 20 m over the nave's length: its patch on the back wall stands
//   to some 4 m over the water only. THE SHAFT IS THE CAVE'S SECOND GREAT LIGHT (shaftAt, by place): from the beam (the lit
//   column of spray from the water to the bell's mouth) its light falls on the rock in its own colour: strong within some
//   metres, a half at 15 m, a sixth at 30 m; the recess's jambs throw their shadow out into the choir. EVERY PIPE THERE HAS
//   A LIT SIDE AND A SHADED SIDE (the side of its curve toward the beam; the light comes along a wall, so it reaches the
//   flank that looks at it), the cracks stay black, its worn shoulders carry a hard line of it; the roof's hanging ends
//   over the foot take the light that comes up off the lit pool. On the water a bright pool three metres about the
//   foot and a glow of it for a dozen metres round; the sheet mirrors the beam as a path of light toward the eye.
//   The water: the cave's own sheet, x -22..18, z -91..41, 32 x 96 quads. Its level is the world's (setLevel); it blends to the
//   open sea's level (uSea) between z = 2 and z = 20; before the mouth it lies whole to 22 m out on the line and 10 m to
//   either side (where depthAt cuts a world's ocean away), then slips away under the open sea and has faded to nothing by
//   36 m and 16.5 m. OUTSIDE THE MOUTH IT IS THE SEA (seaLook, in the ONE TEXT export const SEA_GLSL, which the
//   stand-in sea wears too and a world's own sea includes: see the remark over it for what it needs): the body handed
//   to setSeaBody; a swell with a body (24 and 13 m, 0.6 m high: its backs let more of the water's light up, its slopes
//   turn the mirror); chop and facets in five sizes (0.12 to 3.3 m) running before the wind (setWind: slack and
//   long-crested at 0, quick, steep and with a little white torn off the crests at 1); a mirror by the grazing law (2%
//   head-on) that shows the sky, the sun in sparks, and THE CLIFF where the mirrored line meets it: as bright as the
//   cliff's own face on that look (gold-bronze under a low sun in the south, slate by day, a grey loom in fog), in upright
//   streaks of uneven width and tone, each bundle of pipes swaying by its own measure, and from 3 to 14 m off the cliff's
//   foot outward thrown aside by the water they lie on (a metre and more, differently every few metres of their length:
//   runs and breaks, no stripe ruled down the water). THE MIRROR IS BROKEN BY THE SEA:
//   facets turned up toward the eye show the sky over the brow and the water's own dark colour (a third to a half of the
//   water some thirty metres out, few at the cliff's foot; more where a cat's-paw ruffles it, in lanes long down the
//   wind), so the streaks are torn into runs. The mouth in the water is the cave seen in the water: dark green-black
//   with the emerald low in it, its outline soft and ragged; WHITE only as froth close to rock (within 9 m of
//   the plinth and the stacks) and off a gale's crests: no threads and no flecks on open water (order 11: seen flat
//   across the sea they were stray hairs); in the mouth's own slot the nearest rock is a jamb,
//   so no shore froth lies over the sill, and the sea's froth gives way there to the cave's own white); and THE EMERALD
//   FROM THE SILL, a green tongue on the water with depth (clouds of the lamp's light, darker hollows, a soft dapple
//   of the sun's light where the sun lies on it), brightest at the sill, its solid fan dead by 19 m; AND IT RUNS OUT IN TONGUES
//   AND LACE, no ruled edge: beyond the fan it wavers, thins, pales and breaks into islands (near the sill nearly all the
//   water is green with dark holes in it; the last pale patches lie some 35 m out), the dark sea between, so the green
//   lies on both sides of any crest that stands before the mouth; and the hand-over from the cave's water to the sea's
//   face (z -4 to 7) wobbles along the sill by some metres: the sea's ripples run in here, the cave's water out there.
//   Inside it is THE LAMP of the cave: a slab of lit emerald, the brightest thing in there after
//   the mouth, AND IT HAS A SHAPE (by place): the emerald itself over a lane of pale sand some 6 m wide that wanders a
//   little down the middle of the nave and lies in pools (the sand's net peaks at 1.3), sliding to deep bottle green
//   toward the walls, in the shadow close under a wall or a standing stump, in the choir's far corner, and steadily
//   toward the back (0.3 of its strength at the back wall); the wall's shadow lies on the sand under it as on the water
//   over it. THE SHEET IS DEEP, STIRRED WATER AND HIDES WHAT IS UNDER IT: the water on the sight line takes away what
//   lies below, an e-fold in 0.8 m in the calm and in a quarter of a metre under setFlood (a drowned pipe is gone into the
//   water's own emerald within a metre and a half; within half a metre in the flood); only the pale sand shows through a
//   metre of green in the drain, and a drowned top just under the surface. So THE SHEET CARRIES ITS OWN LIGHT AND DARK: clouds
//   of light and dark at two sizes (deep emerald in the hollows, bright where the lamp is below), every ripple's trough
//   darker than its crest, the lamp's net as fine bright lines; where it meets rock a soft dark contact line, half a
//   metre wide, under the grey-white ring: the wall stands IN the water. Where the sun lies on it (the sill) it is
//   translucent jade with depth: darker hollows, the sun's caustic lines, the swell's crest thin and dark in patches with
//   lace drawn along it (the crest's outline itself is the height law's and is not moved). On it: the
//   mirror (never whole inside: the glow comes through all down the nave), the mouth's light as a path of glitter, drip
//   rings; where water meets rock, where it pours off a stump and where a trough leaves it thin over a sand bank: lace
//   (broken soft clots and threads drawn into streaks by the flow, the green showing through; thicker and reaching
//   further where the surge piles against the back wall, where a little spray also lifts up the rock's foot); in open
//   water only thin white lace (threads a few centimetres wide in loose fields), thick foam only under the swell's crest,
//   at the pile and round the spout's foot. A swell of negative height (a trough) is taken as it is: the sheet dips and
//   keeps the foam it has, and a sand bank it lays bare is dark wet sand. The sheet's own slope (hump, trough, pile) turns
//   its mirror: a steep face looked at head-on is smooth glass over the lamp, and the wall's mirrored pipes melt on it.
//   setLift whitens it round the hump (white water with body, torn, veins racing to the back wall). A CONTACT RING of
//   grey-white froth hugs every wall's foot and every stump that stands out of the water. setFlood: WHITE WATER ON GREEN:
//   rafts a couple of metres across streaming up the nave, each of them TORN FOAM (tornFoam: a net of white threads and
//   small clots a hand wide and a metre long, drawn long by the flow, bright; never a soft pale wash, never a flat
//   floe), white water along the walls' feet and over the pavement, the emerald (jade where the sun lies) plain and
//   strong between. All thick foam on the sheet (setFoam, the crest, the pile, the spout's foot, setLift's white) is
//   torn the same way.
//   White water, THE DRAIN: ribbons (300 built) pour off the stumps' rims while the level is under a stump's top and for
//   some seconds after (until the wet line has sunk 2.2 m under the top). A FALL ONLY WHERE WATER GATHERS AND LEAVES A
//   TOP: half the stumps pour, one fall each; along the nave's foot east of x = -11, two in five, and those a fifth
//   wider.
//   EACH IS ONE FALL WITH A SHAPE: a rope (three in ten a ragged veil) that leaves the lip as a smooth bright tongue,
//   widens, wavers, and tears as it drops: a whiter core in a thin veil of strands, lower down drops, and a ragged
//   white splash where it lands; no two alike. Nothing is drawn on a stump's flank: between falls it is dark wet rock
//   with its gloss (order 10's cords down every face read as a comb of stripes and are gone).
//   THE SPOUT is a tube of ropes round the blowhole's axis (radius 2.5 to 4 m, open at both ends). It is drawn over its
//   lowest 32 m only: by its height up the axis it thins from 22 m and is NOTHING from 32 m up, and it draws nothing at
//   all at strength zero. So no sight line from the line's last 60 m to any point of the portal's disc (5.6 m) meets a
//   drawn part of it (from the line itself such a sight line first meets the tube's wall at 36 m up; with the lens 0.6 m
//   off the line, at 32 m). THE SHAFT, the daylight falling down the blowhole, HAS THE COLOUR OF THE LOOK'S OWN SKY
//   (shaftCol): the handed shaft colour (blue-white by day and in a gale, grey in fog); and while the sun stands low
//   (between the horizon and some 30 degrees, full under 12) it is turned to the sun's own warm white at the same
//   brightness: on a golden look the shaft, seen from the nave too, is warm gold-white. It is A STRONG BEAM, the
//   brightest thing inside after the mouth: seen from the side a soft body of lit spray two metres about the axis with
//   a bright core in it from the water up to the bell's mouth (gone by 15 m up), and round it separate bright threads
//   of falling spray (a forearm wide, a metre apart, each with its own strength and breaks, bright runs sparkling down
//   them; to 22 m up, gone by 32 m); wisps falling in it, single drops sparkling near the lens; a low white mist where
//   it meets the water; a soft glow of lit spray in the bell, where it comes from; and the rock round it lit by it AS
//   PIPES (shaftAt, above). The lit air and spray give way to the heap under the bell and to the spout (THE BEAM GIVES
//   WAY TO THE WATER, below); the pool on the water gives way to the spout; the light on the rock stays.
//   THE BELL AND THE CHIMNEY ARE DARK WET ROCK, black-blue, read by gloss, rims and light, never by a pale coat, AND THEY
//   WEAR THE WORLD'S COLOURS TO THE END, by the way a face looks: what looks up the axis (the cupped tops, their discs,
//   wet shoulders) takes the sky in the ring in the sky's own colour, deepened (blue by day, gold under a low sun); a
//   face turned to the axis takes only a little of the shaft's light on its rock; THE THROAT IS A LIT WELL WITH DARK
//   SEAMS (order 11): from 4 to some 30 m up the axis the film on the part of each pipe turned to the axis gives back
//   the sky's light that comes down the chimney (by place: full to 19 m, a third from 31 m, none from 50 m, so the upper
//   chimney keeps its black); THE FILM MIRRORS THE RING (one bright streak of the ring's sky down each
//   pipe that has the bearing for it, its flanks black; a pipe a pixel or two wide keeps two thirds of its streak's
//   mean, so the high walls of the well shine at their grazing angle) and every rim carries a line of the ring's light; what looks down
//   (the hanging hexagon ends) takes THE EMERALD from the water below as the net's own figure, and the net's lines climb
//   the wet walls of the lower chimney too (strong for 20 m, gone by 50 m up the axis; the even green wash is gone by
//   y = 46); UNDER A LOW SUN IN THE SOUTH the wet edges and tops that look up and south are GILT well down the chimney,
//   strongest high up (gold, emerald and black to the end); and near the lip, where the straight line from a place to
//   the sun clears the lip's south rim, the sun itself gilds the wet edges that face it.
//   What belongs to a whole pipe (its seed, its kind, its open side) is carried FLAT to the pixels: the same number at
//   every pixel of the pipe (carried smoothly it could differ by a bit, and a pipe whose seed stood at a hash's step was
//   stippled with another pipe's tone).
//
// ORDER 12, THE CLIFF'S OUTER FACE, ITS PLINTH, CAP AND STACKS AND THE SEA BEFORE IT, AWAY FROM THE MOUTH.
//   THE NEW LOOK'S GROUND, BY PLACE ALONE (and, on a pipe, by what stands beyond each side: only where a side looks
//   into open air; sides that look into the rock or at a neighbour are seen from inside the cave through hairlines
//   between the wall's pipes and keep the old look): everything below is laid only AWAY FROM THE MOUTH'S OWN GROUND:
//   more than 16 m east and west of x = 3, the line that runs into the mouth (coming in over 6 m), above 12 m beside
//   the mouth's own jambs (never within 13 m of x = 0: nothing changes at the mouth), before z = -50; on the sea, outside
//   the wedge of water before the mouth that opens southward from its jambs by 0.38 m a metre (the grounds begin
//   outside it and open by 0.42 and 0.5). In the mouth's own ground, in the cave and behind z = -50 every number of
//   every shader is the one it was, to the bit (each new term stands in a branch that is not taken there).
//   THE COLONNADE: a pipe is shaded as the round thing it is (its own round, from its axis out), far off too; it keeps
//     its own tone; MASTER JOINTS every 2.9 m or so are shadow lines, the long drums between them each of its own tone
//     and turn; one joint in seven has a NICHE under it where a drum is gone (dark, a pale sill, lime under it); pipes
//     are TAKEN to stand back or out by up to half a metre, bundle by bundle and pipe by pipe (dealRelief: PAINT, a
//     number each pipe carries; no body is moved, see there why); a pipe that stands back takes its prouder neighbour's
//     shadow; the hollow between two pipes is dark. MARKS OF HEIGHT: a wet dark band riding over the water, long dark
//     seep from the cap and ledges, pale lime under the free heads where birds sit, ochre lichen under the cap.
//     THE SHADE IS DARK WET BASALT DRAWN BY ITS GLOSS: what the sun does not reach is taken down and turned to the cold
//     teal-black, most in the hollows; the wet film mirrors the sky in a rib on each pipe. Nothing is lit from below.
//   THE PLINTH stays the rough wave-cut plinth with its stumps as they were dealt;
//     the fallen planks beyond the mouth's ground are rows of DRUMS; THE WHITE WATER AT THE COLUMNS' FEET goes by the
//     swell's own clock and rides at the water's edge wherever the sea stands (uSea and the law's swell on the rock; the
//     sea's own height on the water).  THE CAP stays the entablature of thin curving columns: they are read (in threes,
//     each round and of its own tone), the turf hangs over the brow in tongues, sods and tussocks stand on it; its shade
//     is the cliff's own.  THE SEA (SEA_GLSL): the white band at the rock's foot and BROKEN FOAM LACE in fields beside
//     the plinth and, on the open water west of the mouth alone (west of x = -13 - 0.42 z, coming in over 6 m, out
//     to 38 m before the cliff's front and gone by 52 m: the design asks for lace on that run of water).  THE STACKS: the
//     pipes' own round, out from the stack's middle; the sky's fill and the film's rib in their shade; wet all over.
//   ORDER 13.  THE HEXAGON ENDS ROUND THE BELL are the live file's again, to the letter: no feet, no plate taken out,
//     nothing that comes or goes by an event of the route.  THE LACE IS BROKEN LACE, NO NET: torn patches and long
//     streaks of unlike size, full of open ragged holes, with thin strands round them that end (the water's slopes
//     are not read for its place: they smeared it into blades); most of the water
//     between them clear; more of it toward the plinth's surf, less and smaller toward the line where the mouth's view
//     begins (it thins out over 34 m and does not end on a line); none on the sea north of z = -60; in a gale
//     the open water carries the sea's own torn white and this lace stays out of it.  THE WET FOOT IS WET BLACK ROCK
//     (all of it in the new look's ground alone): from the water up to some four metres over it the tide's pale belts
//     are no lighter than the wet rock by more than a third, on the pipes' and stumps' sides and tops, on the plinth
//     and on the fallen drums, and the stumps and the wall's foot are three tenths darker; the film's flat sheen of
//     the sky is dim and cool and eased over the level look (no step where the mirrored line turns from falling to
//     rising); the cold turn of the shade is the dark rock's
//     only (what is light in the shade keeps its own colour); the rib on a soaked face is no more than a third over
//     the rib on a damp one; in the wet band a drum's own tone is held to half its spread; the lime under a niche is
//     a faint streaked stain, no pale block, and there is no lime on a head the sea washes (under some 4 m over the
//     water); a cup outside holds dark water with a dim sheen; A THIN BRIGHT LINE lies
//     at the waterline; and the run of white up the rock is by day what it is in a gale.
//   ORDER 14.  A GALE'S WHITE ON THE OPEN SEA (SEA_GLSL; by the wind as handed, none up to 0.55): the rows of like
//     dashes, a stride apart and all on one bearing, step aside for BREAKING CRESTS: a crest breaks along a front
//     that bows and
//     wavers, in pieces of a hand to tens of metres with unlike gaps and ends that thin out; thick torn foam lies at
//     the front and the lace's own torn, holed foam trails down the crest's back, lying on the water, older and
//     sparser the further behind; two families of unlike size and bearing, running down the wind by the world's
//     clock; further forward where the water handed in stands high.
//   ORDER 16.  ONE LAW FOR THE SEA'S WHITE OVER ALL THE OPEN WATER ON A GALE DEAL.  THE WIND'S THRESHOLD is 0.55 (the
//     wind as handed, uWind): above it the breaking crests are the sea's white on all the open water, and the rows
//     of dashes are gone from it seaward of the band before the sill (order 17): no second law, no edge; nothing in
//     it reads the eye's place, a deal's number or the route. At and under the threshold no branch of it is entered.
//     GALE DEALS: 50 of the deals 1 to 200, a quarter (counted by the deal's own law, with the hour left free: the
//     world deals a gale where the deal's mood is over 0.75, unless the hour is set to golden, night or dawn: then
//     there is none).
//     AT THE CLIFF'S FOOT AND ON THE SKERRY the law does nothing of its own: the same fronts lie on the water up to
//     the rock; the white band at the rock's foot and the lace keep their own places (orders 12 and 13).
//     NOTHING DRAWN IS ADDED: no triangle, no draw call, no uniform, no texture.
//   ORDER 17.  THE OPEN SEA'S WHITE AND THE CAVE'S OWN WATER MEET BY PLACE, IN A BAND BEFORE THE SILL (gale deals).
//     WHERE THE NEW LAW ENDS: nothing of it shows inside the cave. It meets the cave's own water over THE BAND, the
//     11 m of water before the sill.  THE BAND'S WIDTH: 11 m (order 16's, kept), measured from the cave's own strip
//     of water, which runs from the sill at z = 0 a hundred metres back, 11.5 m to a side of the middle (order 18;
//     8 m to a side in order 17).  THE MEASURE (m16's, in seaLook) is the length of two distances: the water's
//     distance before the sill, and its distance outside 8 m to a side times a factor. The factor is 0 beside the
//     strip's whole length out to 11.5 m; it comes to 1 over the first metre before the sill (and behind the
//     strip's far end) and from 11.5 m out to 18 m; it is 1 beyond either: there the measure is the distance from
//     the 8 m strip, as it was. So the band lies straight across before the sill and round at the jambs' feet from
//     a metre before the sill on, as it did; within that metre its level lines are drawn out sideways over the
//     water at the jambs' feet, where the measure falls toward the distance before the sill alone (every term
//     continuous: no step, no edge).
//     WHY 11.5 m: from the sill's line back to z = -25.7 no water of the mouth or the slot lies further out than
//     10.9 m, and the sea's look has weight in the sheet only as far back as z = -7.5 (HOW FAR BACK, below).
//     The slot's side is 8 m and 0.45 m times the deal's noise (eastW, westW), and that noise is never over 0.998
//     (by its own code: 70 times the sum over three corners of (0.5 - r2)^4 times a gradient's dot): 8.45 m. A cell
//     is the cave's air where its point lies inside that side, and every cell is cut from an octagon 1.68 m about
//     its point: 10.13 m. A cell of open sea has its point before the face's foot. Within 9.4 m of the middle the
//     face leaves the sill's line from 8.5 m out (the towers come 2 m proud), and such a cell reaches 10.86 m out
//     at most at the sill's line. From 9.4 m out every cell within 3.5 m before the face carries a stump of the
//     causeway (at the sill's line nearer than 16.9 m: its two first rows, tops 3.5 m and more over the sea's
//     zero); open sea from 21 m out. The water under a neighbour column's inset, 3 cm: 10.9 m.  THE MARGIN: 0.6 m.
//     HOW FAR BACK THE BOUND HOLDS: the side is no more than that 8 m and the noise wherever westW's widening for
//     the choir is 0, and it is exactly 0 from z = -27.5 forward (it is a smoothstep from z = -27.5 to -31.5,
//     times one less a smoothstep from -58 to -62.5; eastW has none). A cell whose point stands behind z = -27.5
//     reaches 1.68 m forward of it at most, and the water under a neighbour column's inset 3 cm more: so the
//     bound holds for all the water of the mouth and the slot from the sill's line back to z = -25.7.
//     WHY THAT IS FAR ENOUGH: the sheet takes the sea's look by one less its own weight (inside, in the sheet's
//     shader: 1 in the cave, 0 out at sea). That weight is one less a smoothstep from -4 to 7 of the water's z
//     moved by two noises, by 2.5 m and by 1 m at most: it is exactly 1 from z = -7.5 back. So the sea's look
//     has weight only as far as 7.5 m behind the sill, and the bound holds 18.2 m further back than that.
//     WHY 18 m: it is under 18.95 m, the nearest place to the middle where water within a metre of the sill's line
//     lies 11 m from the 8 m strip: so wherever the measure was 11 m or more it is the same number, to the bit.
//     ONE MEETING: across the band toward the sill the breaking crests' foam BREAKS UP INTO SCRAPS (its cut rises,
//     the thick foam at a front goes, a front's leading edge is drawn out and ragged: no flat patch with a clean
//     leading edge in the last metres) and what is left of it is gone at the sill; over the same band the sea's own
//     rows of dashes COME IN: none of them seaward of the band, whole at the sill. No cut on the sill's line, no
//     straight edge.
//     AT THE SILL AND BEHIND IT the water of the mouth and the slot is the one it was, to the bit, on every deal,
//     gale deals too: the cave's own water, and all of the sea's look that shows through the sheet's seaward lip
//     (the sheet's own blend, from 7 m before the sill to 4 m behind it, ragged by up to 3.5 m either way).
//     BY LAW (order 18): the line that gives m16 in seaLook gives exactly 0 at and behind the sill's line out to
//     11.5 m a side, so neither of the band's branches is entered there; and no water of the mouth or the slot
//     lies outside that as far back as the sea's look has any weight (WHY 11.5 m).
//     FURTHER BACK, IN THE CHOIR, the cave's own water does lie outside that, to the west, out to the choir's
//     own side (its staircase sinks at both ends), between z = -25.7 and z = -64.3 at the most. THE BOUND, by the
//     code: westW is 18.45 m at its greatest (18 m and 0.45 m times the noise) and a cell reaches 1.68 m from its
//     point: 20.13 m; the water under a neighbour column's inset, 3 cm: under 20.2 m. On a gale deal the measure
//     is over 0 on that water and both of the band's branches are entered there. The sea's look weighs exactly 0
//     there by the sheet's own weight (WHY THAT IS FAR ENOUGH): so that water is the one it was, to the bit, by
//     that weight and not by the measure.
//     NOT HELD BY THE LAW, further out than 11.5 m: water that shows only through the hairline between two columns
//     (the sheet lies on under the rock), and the sea where it stands over a stump of the causeway (tops 3.5 m and
//     more nearer than 16.9 m, lower beyond); and the choir's water to the west, which the sheet's own weight
//     holds instead (above), as it holds a hairline's water behind z = -7.5. On all of these the measure is over
//     0 at and behind the sill's line, as it was before; beside the strip's length it is lower than it was from
//     11.5 m out to 18 m, and the same number from 18 m on.
//     The band's terms read the water's place alone (m16's measure, from the strip): not the eye, not the lens, no
//     clock but the sea's own, no deal's number, no share of the flight.  SEAWARD OF THE BAND every number is order
//     16's: each term the band brings is a multiple of one less the band's measure (0 at the sill, 1 at the band's
//     seaward edge and beyond), or a factor that is 1 where that measure is 1.
//     WHAT HOLDS: (a) on a deal that is not a gale deal nothing of orders 14, 16 and 17 is entered and every number
//     is the one it was, to the bit; (b) on a gale deal the water of the mouth and the slot at the sill and behind
//     it is the one it was, to the bit: by law out to 11.5 m a side, which is all of that water as far back as the
//     sea's look weighs anything (the cave's own water, and the sea's look under the sheet's seaward lip); further
//     back, where the choir's water lies outside that, by the sheet's own weight; (c) on a gale deal what shows
//     differs from what it was only in the sea's white, and only on the open sea (before the sill; beside the
//     towers from 21 m out) and on the hairline water and the sea over the causeway's stumps NOT HELD above; in
//     the choir the band's branches are entered, but nothing of them shows.
//     NOTHING DRAWN IS ADDED: no triangle, no draw call, no uniform, no texture, no lookup.
//
// WHAT READS THE EYE (every term, and nothing else does: nothing is lit, faded, hidden or thinned by its distance from the
// lens, by the seed, by a place on the route or by the clock)
//   THE AIR between eye and thing (airMix): the scene's haze by the length of the sight line; and the part of that line
//     which lies behind the mouth's plane (z < 0) is taken as the cave's damp air, 0.010 a metre, toward near black: so the
//     far end of the nave sinks into the dark. In the mouth's throat (z 0 to -6) that air is thick with spray, 0.07 a
//     metre: a sight line that crosses the whole throat loses a third of what lies behind it, so from the sea the cave
//     stays a dark slot whatever glows inside, and it clears as the eye comes in through it.
//   THE WATER PATH (the water between the eye and a thing: by place): rock under the sheet is taken away by the length
//     of the sight line that runs under water (from the eye's height and bearing; inside 1.5 a metre in the calm, 5 under
//     setFlood), and the sheet itself hides what lies under it by the refracted length of that line down to the sand or a
//     drowned top, or level to the rock close by (1.2 a metre, 4 under setFlood); the water's own colour gathers along it.
//   THE UNDERSIDE: round the bell (by place) the inside of a hanging step is drawn as its underside only where the sight
//     line climbs into it (more than 17 degrees up); which side of a face is seen is the eye's too (the backs' dark).
//   THE FOOTPRINT FILTERS: what one pixel covers of a surface (screen derivatives of place). Every crack, joint, ledge,
//     shoulder, speckle, mottle, ripple, strand and caustic band fades to the mean of its face as the pixel grows past it,
//     and a far pipe's faces melt to the turn of the whole pipe: the far cliff is calm tone and big shapes.
//     (A separate read of 14 Oct found that this does not hold everywhere: at some places a pattern is let go to bare
//     ground, to full brightness or to nothing and not to its face's own mean. A list of them went to the owner with
//     this round's hand-in; they stand as built in this stage.)
//   THE MIRROR: the sheet's reflection by the eye's bearing (Fresnel): the dark roof; near a wall, at a grazing look, the
//     wall's own pipes, and where the mirrored line runs down the nave the BACK wall's pipes with the shaft's light on
//     them (order 11: the side walls' image used to give out on a straight line there: a dark box on the water; and
//     the walls' image is spread by the length of the mirrored path and swayed by the ripples, by place: no ruled
//     fence of cracks and no straight band edge lies on the far water); the
//     mouth's light; THE BEAM (where the mirrored sight line passes the shaft's lit column between the water and the
//     bell's mouth: a path of light on the water toward the eye, in sparks); outside (the sea's face), the cliff where the mirrored line meets
//     it, the sky over it, the sun. Where it shows the cliff the mirror is given MORE than the grazing law allows the sky
//     (the law's fifth power eased to its third: the order's bar, not the true law), and the cliff's image keeps its place
//     across the face by the eye's own bearing, the facets swaying it by an eighth to a half of what they turn it (upright
//     streaks, not a scramble). THE SKY FACETS read the eye's bearing too: a facet shows the sky when its slope is turned
//     toward the eye by more than a measure set by place (the share of sky open over the brow) and by the cat's-paws; this
//     again is the order's bar: by the true law few facets under a cliff are steep enough. The discs of water on the stumps mirror
//     the same way, and so does the wet film on rock: the mouth's slot where the mirrored sight line leaves by it, the lit
//     water where that line goes down to the sheet.
//   THE HIGHLIGHTS: the gloss of wet rock, foam and water toward sun, shaft and the emerald (half vectors); outside, none
//     on a flat flank when a low sun stands behind the eye; in the chimney the film's mirror takes the sky's colour or the
//     shaft's by where the mirrored sight line looks, and shows the ring's sky where that line (by the film's normal)
//     leaves by the chimney's ring, 5.6 m about the axis and 60 m up it (seeR: the bright streak down a pipe); the
//     streak's other part is a half-vector gloss toward the axis. (The gilt down the chimney, the rims' line, the emerald
//     on the ends and walls, the quiet wall, the stumps' form and the drain's cords read nothing of the eye but their
//     footprint; nor do the tongues of emerald on the sea or the hand-over at the sill: by place.)
//     (The hard white line on a worn shoulder, the sun's gilding and its
//     light come back off the wall across, the broad daylight of the first twenty metres, the net, the bands, the
//     chimney's three colours and sunIn read NOTHING of the eye: they go by the surface's bearing to the mouth, the sun,
//     the shaft or the axis and by place; the line has its footprint filter, no more.)
//   THE BEAM: the shaft's light is gathered along the sight line by the length that line runs through the shaft's column
//     of lit air (shaftAir: long through its middle, nothing at its rim), and is laid on what this part draws behind it,
//     inside the cave only; its veils of spray are laid by the place where that sight line passes nearest the axis. The
//     sun's beam down the nave is gathered the same way (sunAir: by the length the sight line runs through the beam).
//     The shaft's core, the mist at its foot and the glow in the bell are gathered the same way (soft shapes of lit
//     air, closed form); the drops are laid by the place where the line passes nearest the axis, each with its footprint.
//     (The spout's tube no longer carries it: it reads nothing of the eye but its footprint.)
//     sideK (order 11c) READS ONE THING, THE SIGHT LINE'S BEARING TO THE BLOWHOLE'S AXIS: the shaft's lit air (threads,
//     body, core, the bell's glow, three quarters of the foot's mist) is nothing for a line within 15 degrees of the
//     axis itself and all of itself from 25 degrees on (a line that runs up the shaft runs with the falling water,
//     between the threads). From the nave such a line is one that rises more than 43 degrees into the roof, so THE
//     SHAFT IS AT FULL STRENGTH FOR EVERY SIGHT LINE THAT MEETS IT FROM THE SIDE, whatever its rise, from anywhere in
//     the nave and from the pavement, on both passes, however near or far the eye stands. A visitor meets the term
//     only under the bell, looking up the shaft: the ring and the rock up the chimney are seen through clear air, the
//     lit fall stands all round them. IT READS NOTHING OF WHERE THE EYE IS: the eleventh part's second
//     factor (all of the fall with the axis 7 m ahead of the eye, nothing under 2.5 m) is taken out: it faded a thing
//     by the lens's own distance from it. (Up to the tenth part the bearing's limits were 51 and 66 degrees: because
//     the axis leans, a line from the nave that rose more than 17 degrees had none of the shaft.)
//     THE BEAM GIVES WAY TO THE WATER, BY THE EVENT ALONE (it reads nothing of the eye; the same from every place): the
//     shaft's lit air and spray, and their image on the water, thin as the surge heaps under the bell (uPile, the
//     heap's height in metres, set through setPile: whole up to 1.7 m, gone at 2.6 m: the air the heap drives up the
//     blowhole takes the falling spray with it) and are away while the spout stands (uSpout, as before). The shaft's
//     light on the rock stays; its pool on the water gives way to the spout alone. The threads are laid by the place
//     where the sight line passes nearest the axis (its offset from the axis), each with its footprint.
//   THE WET FILM'S MIRROR ON THE COLONNADE, THE STACKS AND THE CAP OUTSIDE (order 12, in the new look's ground): the rib
//     of sky on a pipe lies where the mirrored sight line (from the eye's bearing, off the pipe's own round) looks out
//     over the sea, and is stronger at a grazing look (Fresnel, third power). It reads the bearing alone, never how far.
//     (Order 13: in the new look's ground the film's FLAT SHEEN OF THE SKY and the sky in a cup's disc of water are the
//     same mirror terms as before, by the eye's bearing alone (Fresnel, fifth power), only dimmer; the sheen is eased
//     over the level look where it stepped.)
//     (Order 12's marks on a pipe, the cap's thin columns and the foam lace's patches, holes and strands, and order
//     13's line at the waterline, have their FOOTPRINT FILTERS like everything else: they melt to the mean of their
//     face, the lace to a pale veil of its field's own shape, as a pixel grows past them; far off the lace reads no
//     noise finer than a pixel.)
//
// OPTS  { palette: 7 hex colours as the brief's (basalt, emerald, deep teal, coralline pink, ochre, foam white, puffin orange),
//         sea: false to leave out the stand-in sea disc (A WORLD WITH ITS OWN OCEAN MUST PASS sea: false),
//         demo: false to stop the stand-in breathing that runs until setLevel is first called }
//   ctx.rng gives each seed its own columns, heights, bays, stumps' deal, ledges and lichen; the plan of the cave, the sizes
//   and the clear air round the line are the same on every seed. ctx.quality.detail thins the runoff ribbons and the grass.
//
// EXPORTS  the part's builder, and SEA_GLSL: the one text of the outside sea's law (GLSL), for a world's own sea to include.
//
// HOOKS (also on object.userData.organCave; anchors on object.userData.anchors)
//   setLevel(y)            the sheet's level inside the cave (the brief: path y minus 1). The first call ends the stand-in.
//   setWetLine(y | null)   overrides the wet line; null hands it back. Left alone, update()
//                          trails it: the highest recent level, falling 0.3 m/s (by the time passed to update, never a clock).
//   setSwell(z, h, half)   the travelling hump: crest at z, h metres high, a Gaussian of half-length `half` (16 m; never under 8,
//                          so no sharp front passes under the lens). KEEP level + hump at the lens 1 m under the path.
//                          h may be negative (a trough): the sheet dips, its slope turns the mirror, it keeps the foam it has.
//   setPile(h)             water piled against the back wall (rises from z = -56 to -86). The shaft's lit air and spray
//                          give way to it: whole up to 1.7 m, gone at 2.6 m.
//   setSpout(a, head)      the spout's strength 0..1 and how far up the axis (m from its foot) its frayed head has climbed.
//   setFoam(a) setGlow(a)  foam cover 0..1; the emerald's strength (1 = peak 1.3).
//   setSea(y)              the open sea's level outside (0).
//   setWind(w)             the wind on the sea outside the mouth, 0 slack air .. 1 a gale (0.35 unless called): the facets'
//                          steepness, length and speed, and the white torn off them over 0.55.
//   setLift(k)             0..1 (0 unless called): whitens the sheet inside the cave within the hump's half length round the
//                          hump's place (k times the hump's own Gaussian): at 1 white water with body, torn, the green in its
//                          hollows, its veins racing toward the back wall; at 0 nothing.
//   setFlood(k)            0..1 (0 unless called): THE FLOOD, the next swell come in. At 1 the cave's sheet is marbled thick
//                          with rafts of torn foam streaming up the nave (white ON green: threads and small clots, the
//                          emerald plain between), white water lies along the walls' feet and over the pavement, and the
//                          net of light on the walls quickens (a second, faster net).
//                          It moves no water (the level and the swell stay the world's); at 0 nothing.
//   setSeaBody(c | null)   the colour of the sea's body that the sheet's rim wears outside the mouth: the only road for it.
//                          Left alone (or null), the part's own dark sea. (Nothing is looked for in the scene, and no
//                          frames are counted: the part's look does not depend on how many frames have been drawn.)
//   setLight({ sunDir, sun, sunIntensity, sky, skyIntensity, mouth, mouthIntensity, shaft, shaftIntensity })
//   followLights(on)       OFF unless called. On: update() reads the scene's first DirectionalLight and HemisphereLight
//                          (sun's way and colour; sky, mouth and shaft from the sky's colour), so a dusk look carries.
//   setAir(colour, density)  haze; left alone the piece follows scene.fog when it is a FogExp2.
//   levelAt(z), floorAt(x, z), ceilAt(x, z), topAt(x, z), wetLine(), depthAt(x, z) (metres of open sea for a world's ocean:
//   negative on the headland and over the mouth's apron, where this sheet rules), sheetAt(x, z) (1 where the cave's own
//   sheet lies whole outside the mouth, 0 where it has slipped away under the sea: a world's ocean must cover every place
//   where this is under 1).
//   uniforms: every material shares one set (hero.uniforms): uLevel uWetLine uHump(z, h, half) uPile uSpout uSpoutHead uFoam
//   uGlowAmt uSea uWind uLift uFlood uSeaBody uSunDir uSunCol uSkyCol uMouthCol uShaftCol uGlowCol uAirCol uAirDen and the palette colours; uMap (the
//   cave's plan: wall distance, sand floor, nearest stump top, distance to its rim) and uCaus (the caustic tile).
//
// ANCHORS (local space)
//   path        the flown line's 57 points: the brief's first eight; the bend into the blowhole (a glide from (0, 1.5, -58)
//               and one even arc of 6.1 m radius under the axis' foot, lowest at y = -1.5 near z = -75); the foot (0, 3, -81);
//               then points on the one straight to the portal's seat (the last 60 m; the pitch climbs to it and never
//               passes it). Every column, stump and roof stub keeps 2.3 m or more from THIS line as the kit's spline flies
//               it (the walls 4 m and more), measured in 3D.
//   portal, portalDir   the seat in the lip (0, 58.6, -103.5) and the way the line leaves through it; lip { center, radius 6.3,
//               axisFoot, axisDir }.
//   mouthFoot, mouthTop, jamb, jambTop (the east jamb where the wave bursts, 15 m), choir, bell, backWall.
//   seals (12 low stump tops near the line), shags (9 highest stumps), kittiwakes (60 ledges on the cliff's snapped pipes and
//   the stacks, 40 on the chimney's steps), drips (48 hanging ends), kelp (stump feet and the causeway's edge),
//   stumps [{ x, y, z, r, cup }], stacks, sheet { x0, x1, z0, z1 }. Each kind is drawn from its own stream.
//
// COST  288,852 to 300,663 triangles by the seed (counted over seventeen seeds) in 11 draw calls (10 with sea: false).
//   Without order 12's added mesh it is 280,688 to 291,351 in 10 (the grass gives way so that this stays under
//   292,000); order 12 adds 8,164 to 9,364 and 1 call:
//   the ground's added mesh (fallen drums 110 to 171 x 20, sods 138 to 146 x 22, tussocks 552 to 584 x 5), in a
//   material the part already has. (Order 13: the feet round the bell and their call are gone.) Columns near
//   340 x 119, stumps, chimney steps and the causeway by the mouth 870 x 63, hanging stubs 1,890 x 35, far 3,300 to
//   3,950 x 21 (one material, four meshes);
//   ground (cap, plinth, sand, fallen columns) 22.2k 1; grass 2,400 to 2,700 tufts x 6 1; water 6.1k 1; ribbons 3.6k 1;
//   spout 2.5k 1; stand-in sea 1. Two textures: the 200 x 660 RGBA byte plan and the 256 x 256 one-byte caustic tile.
//   Build about 600 ms in steps under 20 ms. (Orders 12 and 13: every body carries eight numbers more, iF0 and iF1:
//   for each of its seven sides the height from which it looks into open air, and its taken set-back (paint); they
//   are dealt after the anchors; the whole build hands back to the engine 18 to 21 times more than the live file's,
//   13 to 16 of them in that dealing.)
//
// LIGHT  The piece lights itself (no scene light is read unless followLights is on): sun and sky on the cliff (defaults: sun
//   48 degrees up from the south-east #FFF6E8 x 2.6, sky #8FA9BC x 0.95), and inside three lights, none warm: the emerald
//   from the water, the cold white mouth, the blue-white shaft down the blowhole (which a low sun turns warm white:
//   shaftCol, by the sun's height alone); and when the sun stands low in the
//   south (setLight's sunDir with z over 0.02 and the line to it clear through the mouth's slot) a fourth, warm: the sun
//   itself down the nave. Linear HDR; the emerald is capped at 1.3;
//   foam under 0.8. Wants bloom at about the default and exposure 1.
//
// WHAT IS KEPT THOUGH IT IS NOT TRUE TO THE THING (the owner's rule of 14 Oct on terms that read the eye): three terms
//   of this piece fade or hide a thing by the eye's bearing to hide what its body lacks. Each stands as it stands in the
//   live world; none is of this round. What each is, in plain words, and what the honest mend would be:
//   THE SHAFT'S LIT SPRAY (sideK): the lit falling water in the blowhole is a volume with no real gaps between its
//     threads; for a sight line within 15 degrees of the blowhole's axis most of it is taken away (a faint veil, the
//     drops and a quarter of the foot's mist stay), and it is whole from 25 degrees on. The honest mend: give the fall
//     real separate threads with open air between them, and gather their light along the sight line's own path.
//   THE BACKS OF COLUMNS: a standing column has no underside and no rock behind it; a back face is drawn as the rock's
//     dark, or as the hanging underside that was never built (indoors a top's back; indoors round the bell also a
//     side's back above 8 m looked up into from below). The honest mend: build the undersides and the backs.
//   THE GROUND'S BACK FACES: the cap (its faces, slumped sides and turf top) and the plinth are shells with no body
//     behind them; a back of theirs is drawn as the rock's dark. The honest mend: close the bodies so that no sight line reaches a back.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';

// ---------------------------------------------------------------- the brief's sizes (metres; they hold on every seed)
const PITCH = 1.05;                 // honeycomb pitch: columns 0.8 to 1.5 m across after warp and jitter
const FOOT = -8.5;                  // column feet, under the sand
const CAP_BASE = 36, CAP_TOP = 46;  // 6 m plinth, colonnade to 36, entablature to 46
const HX = 120, HZ = 65, HCZ = -62; // headland footprint: a superellipse 240 m wide about (0, HCZ)
const AX0 = new THREE.Vector3(0, 3, -81);                    // foot of the blowhole axis
const AXD = new THREE.Vector3(0, Math.sin(68 * Math.PI / 180), -Math.cos(68 * Math.PI / 180));   // 68 degrees, leaning north
const PORTAL = new THREE.Vector3(0, 58.6, -103.5);
const CLEAR = 2.3;                  // clear air round the flown line for every body (the owner's 2.0 plus margin)
const BAY = 4.6, NOTCH = 3.2, NOTCHB = 6.4, APRON = 5.2;   // a bay stands 4.6 m back; where the cap is broken away the pipes stand free 3.2 m deeper and the cap's face 6.4 m back; the causeway of stumps is 5.2 m wide
const BRIEF_PATH = [[3, 1, 110], [3, 3, 0], [4, 1, -32], [2, -1, -54], [-5, -1.5, -50], [-5, -1.5, -38], [3, 0, -33], [0, 1.5, -58], [0, 3, -81]];
const DEFAULT_PALETTE = ['#12171B', '#1FC8A0', '#0E5560', '#D98AA0', '#C99A2E', '#EEF6F2', '#F26A1B'];

const sstep = smoothstep;
const fract = (x) => x - Math.floor(x);

// ---------------------------------------------------------------- the cave's form (pure functions of place and of a few seed numbers)
function makeForm(S) {
  // S: { n2 (seeded simplex), o1..o4 seed offsets }
  const n2 = S.n2;
  const eastW = (z) => {
    let w = lerp(8, 6, sstep(-57, -63, z)) + 0.45 * n2(z * 0.11 + S.o1, 3.7);
    if (z < -80) w *= Math.sqrt(Math.max(0, 1 - ((-80 - z) / 8.6) ** 2));
    return z > 0.5 ? 8 : w;
  };
  const westW = (z) => {
    const choir = sstep(-27.5, -31.5, z) * (1 - sstep(-58, -62.5, z));
    let w = lerp(lerp(8, 6, sstep(-57, -63, z)), 18, choir) + 0.45 * n2(z * 0.11 + S.o2, 9.1);
    if (z < -80) w *= Math.sqrt(Math.max(0, 1 - ((-80 - z) / 8.6) ** 2));
    return z > 0.5 ? 8 : w;
  };
  const apex = (z) => 24 - 1.2 * sstep(-5, -25, z) + 1.6 * sstep(-28, -38, z) * (1 - sstep(-52, -60, z)) - 7 * sstep(-58, -70, z) + 0.7 * n2(z * 0.07 + S.o3, 1.3);
  // gothic slot: the ceiling over (x, z), or -1 where (x, z) is not under the cave
  const ceilAt = (x, z) => {
    if (z > 0.5 || z < -88.6) return -1;
    const hw = x >= 0 ? eastW(z) : westW(z);
    const s = Math.abs(x) / Math.max(hw, 0.01);
    if (s >= 1) return -1;
    const H = apex(z), rise = Math.min(13.9, H - 8);
    const A = Math.sqrt(Math.max(0, 4 - (s + 1) * (s + 1))) / 1.7320508;
    return H - rise + rise * A;
  };
  // turf top of the headland
  const topAt = (x, z) => CAP_TOP + 12.6 * sstep(-38, -100, z) * Math.exp(-((x / 75) ** 2));
  // blowhole: a tube round the axis, 12.6 m wide, a bell 18 m across at its foot
  const lipDip = (x, z) => {            // the turf folds down into the blowhole's lip
    const y = topAt(x, z), px = x - AX0.x, py = y - AX0.y, pz = z - AX0.z, s = AXD.y * py + AXD.z * pz;
    const rho = Math.sqrt(Math.max(0, px * px + py * py + pz * pz - s * s));
    return 2.6 * (1 - sstep(6.3, 10.5, rho));
  };
  const chimR = (s) => 6.3 + 2.7 * (1 - sstep(9, 21, s));
  const inChim = (x, y, z) => {
    const px = x, py = y - AX0.y, pz = z - AX0.z;
    const s = AXD.y * py + AXD.z * pz;
    if (s < 9) return false;                  // under this the cave's own roof is the air; the bell opens above it
    const r2 = px * px + py * py + pz * pz - s * s, R = chimR(s);
    return r2 < R * R;
  };
  // the headland's footprint: under 1 inside. The front bows 3 m; the mouth's jambs are held true at z = 0
  const roughAt = (x, z) => (0.03 * n2(x * 0.022 + S.o4, z * 0.022) + 0.018 * n2(x * 0.06 + S.o4, z * 0.06) + 0.008 * n2(x * 0.17, z * 0.17 + S.o4)) * sstep(9, 26, Math.abs(x) + Math.max(0, -z - 20));
  // THE ORGAN'S PLAN along the face (u: metres along it from the mouth, east positive, running on round the returns):
  // towers of pipes either side of the mouth stand 2 m proud; bays stand 4.6 m back between buttresses; where the cap is
  // broken away (a notch, always on a buttress or a tower) the pipes stand free to their own tops
  const uAt = (x, z) => x + Math.sign(x) * Math.max(0, -z - 8);
  const towerAt = (u) => { const a = Math.abs(u); return sstep(8.5, 10.5, a) * (1 - sstep(20, 25, a)); };
  const bayAt = (u) => { const a = Math.abs(u); return Math.max(sstep(25, 29, a) * (1 - sstep(39, 44, a)), sstep(0.02, 0.3, n2(u * 0.05 + S.o1, 7.7)) * sstep(42, 48, a)); };
  const notchAt = (u) => Math.max(towerAt(u), (1 - bayAt(u)) * sstep(0.05, 0.35, n2(u * 0.031 + S.o3, 4.1)) * sstep(44, 52, Math.abs(u)));
  const frontK = (z) => 1 - sstep(-38, -50, z);
  const faceBackU = (u) => BAY * bayAt(u) - 2 * towerAt(u);               // metres the face stands back from the smooth footprint
  const faceBack = (x, z) => faceBackU(uAt(x, z)) * frontK(z);
  const footS = (x, z) => ((Math.abs(x) / HX) ** 6 + (Math.abs(z - HCZ) / HZ) ** 6) ** (1 / 6) + roughAt(x, z);   // the smooth footprint: the cap's and the plinth's
  const foot = (x, z) => footS(x, z) + faceBack(x, z - (HCZ + HZ)) / 66;   // the columns' own: with its bays and towers
  const frontZ0 = (x) => HCZ + HZ * Math.max(0, 1 - (Math.abs(x) / HX) ** 6) ** (1 / 6);   // the unroughened front
  const FRONT_SHIFT = frontZ0(0);            // 3.0: the whole footprint is slid so that the mouth stands at z = 0
  const inFoot = (x, z) => foot(x, z + FRONT_SHIFT) < 1;
  // staircase of the choir's west pavement: top of the stump at (x, z), or null where there is none
  const stumpTop = (x, z, h) => {
    const ww = westW(z); if (-x > ww) return null;
    if (z > -29.5 && z < -12 && -x > ww - 2.5) return -3.4 + 1.9 * h * sstep(-12, -17, z);      // a broken shelf along the nave's west foot
    if (z > -29.5 || z < -60.5 || x > -7.2) return null;
    const t = clamp((-7.2 - x) / 10.6, 0, 1);
    const ends = Math.min(sstep(-29.5, -33, z), 1 - sstep(-57, -60.5, z));           // the staircase sinks at both ends of the choir
    let y = -3 + 7 * Math.pow(t, 0.62);
    y = Math.round(y / 0.5) * 0.5 + (h - 0.5) * (y < -0.2 ? 0.13 : 0.36);           // the low steps are level shelves (their tops within 0.15 m): somewhere to lie
    y = lerp(-3.4, y, 0.35 + 0.65 * ends);
    return clamp(y, -3.4, 4.2);
  };
  // sand floor: 5 to 7 m down along the nave's middle, banked up to 3.3 m down along the walls, boulders at the back, a sill at the mouth
  // (what of it hangs on z alone is worked out once for a z and kept while the next places asked lie on the same z, as a
  // map's row does; a term whose own factor is nought there, the bank far from a wall, the boulders before the back, adds
  // nothing and its noise is not asked: the height is the same to the bit)
  let fZ = NaN, fSill = 0, fEast = 0, fWest = 0, fBank = 0, fBack = 0, fTop = 0;
  const floorAt = (x, z) => {
    if (z !== fZ) {
      fZ = z; fSill = 1.0 * sstep(-8, 6, z) * (1 - sstep(8, 30, z)) - 2.5 * sstep(14, 40, z);
      if (z < 3) { fEast = eastW(z); fWest = lerp(8, 6, sstep(-57, -63, z)) + 0.9; fBank = 1 - sstep(-60, -66, z); }
      fBack = sstep(-62, -78, z); fTop = lerp(-3.2, -4.0, sstep(-60, -66, z));
    }
    let y = -6 + 0.9 * n2(x * 0.06 + S.o1, z * 0.05) + 0.25 * n2(x * 0.21, z * 0.19 + S.o2);
    y += fSill;      // a low sill in the mouth, deepening seaward
    // sand banked against the walls' feet and the foot of the choir's pavement: pale shallows beside the deep channel
    if (z < 3) {
      const wd = Math.min(fEast - x, fWest + x), near = sstep(5.2, 0.8, wd);
      if (near !== 0) y += 2.7 * near * (0.65 + 0.35 * n2(z * 0.11 + S.o3, x * 0.2)) * fBank;
    }
    if (fBack !== 0) y += fBack * (0.5 + 0.9 * Math.abs(n2(x * 0.33 + S.o3, z * 0.33)) + 0.5 * Math.max(0, n2(x * 0.7, z * 0.7 + S.o1)));   // boulders
    return clamp(y, -7.6, fTop);                 // the lens dips to -1.5 under the blowhole: the floor keeps well under it
  };
  return { eastW, westW, apex, ceilAt, topAt, lipDip, roughAt, chimR, inChim, inFoot, foot, footS, uAt, towerAt, bayAt, notchAt, frontK, faceBackU, faceBack, frontZ0, FRONT_SHIFT, stumpTop, floorAt };
}

// ---------------------------------------------------------------- honeycomb lattice: jittered, warped, each cell a true Voronoi polygon
function makeLattice(S) {
  const n2 = S.n2;
  const hash = (i, j, k) => fract(Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + S.h0) * 43758.5453123);
  const px = new Map();
  const point = (i, j) => {
    const key = i * 4096 + j; let p = px.get(key); if (p) return p;
    const bx = (i + 0.5 * (j & 1)) * PITCH, bz = j * PITCH * 0.8660254;
    const wx = 0.55 * n2(bx * 0.035 + S.o2, bz * 0.035), wz = 0.55 * n2(bx * 0.035, bz * 0.035 + S.o3);
    const a = hash(i, j, 1) * 6.2831853, r = PITCH * 0.3 * Math.sqrt(hash(i, j, 2));
    p = [bx + wx + Math.cos(a) * r, bz + wz + Math.sin(a) * r]; px.set(key, p); return p;
  };
  // the six lattice neighbours, then the six of the second ring that can still cut a corner (four lists, made once: read, never written)
  const NB_ODD = [[1, 0], [-1, 0], [0, 1], [1, 1], [0, -1], [1, -1]], NB_EVEN = [[1, 0], [-1, 0], [-1, 1], [0, 1], [-1, -1], [0, -1]];
  const NB2_ODD = [[0, 2], [0, -2], [2, 1], [-1, 1], [2, -1], [-1, -1]], NB2_EVEN = [[0, 2], [0, -2], [1, 1], [-2, 1], [1, -1], [-2, -1]];
  const NB = (j) => ((j & 1) ? NB_ODD : NB_EVEN);
  const NB2 = (j) => ((j & 1) ? NB2_ODD : NB2_EVEN);
  const tmpA = [], tmpB = [];
  const OCT = []; { const R = PITCH * 1.6; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; OCT.push(Math.cos(a) * R, Math.sin(a) * R); } }      // (the octagon every cell is cut from: made once)
  // Voronoi cell of (i, j): 7 corners (dx, dz) about the point, counter-clockwise, inset by gap
  const cell = (i, j, gap = 0.028) => {
    const c = point(i, j);
    let poly = tmpA, out = tmpB; poly.length = 0;
    for (let k = 0; k < 16; k++) poly.push(OCT[k]);
    const clip = (di, dj) => {
      const q = point(i + di, j + dj), nx = q[0] - c[0], nz = q[1] - c[1], d = (nx * nx + nz * nz) * 0.5;
      out.length = 0; const n = poly.length / 2;
      for (let k = 0; k < n; k++) {
        const ax = poly[k * 2], az = poly[k * 2 + 1], k2 = (k + 1) % n, bx = poly[k2 * 2], bz = poly[k2 * 2 + 1];
        const da = ax * nx + az * nz - d, db = bx * nx + bz * nz - d;
        if (da <= 0) out.push(ax, az);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push(ax + (bx - ax) * t, az + (bz - az) * t); }
      }
      const s = poly; poly = out; out = s;
    };
    { const nb = NB(j), nb2 = NB2(j); for (let k = 0; k < 6; k++) clip(nb[k][0], nb[k][1]); for (let k = 0; k < 6; k++) clip(nb2[k][0], nb2[k][1]); }
    let pts = []; for (let k = 0; k < poly.length; k += 2) pts.push([poly[k], poly[k + 1]]);
    // merge the shortest edge until 7 corners are left; double a corner until there are 7
    while (pts.length > 7) {
      let bi = 0, bd = Infinity;
      for (let k = 0; k < pts.length; k++) { const q = pts[(k + 1) % pts.length], d = (q[0] - pts[k][0]) ** 2 + (q[1] - pts[k][1]) ** 2; if (d < bd) { bd = d; bi = k; } }
      const q = pts[(bi + 1) % pts.length]; pts[bi] = [(pts[bi][0] + q[0]) / 2, (pts[bi][1] + q[1]) / 2]; pts.splice((bi + 1) % pts.length, 1);
    }
    // drop edges under 14 cm (they would read as a sliver), keeping at least 5 sides
    for (let guard = 0; guard < 3 && pts.length > 5; guard++) {
      let bi = -1, bd = 0.14 * 0.14;
      for (let k = 0; k < pts.length; k++) { const q = pts[(k + 1) % pts.length], d = (q[0] - pts[k][0]) ** 2 + (q[1] - pts[k][1]) ** 2; if (d < bd) { bd = d; bi = k; } }
      if (bi < 0) break;
      const q = pts[(bi + 1) % pts.length]; pts[bi] = [(pts[bi][0] + q[0]) / 2, (pts[bi][1] + q[1]) / 2]; pts.splice((bi + 1) % pts.length, 1);
    }
    const sides = pts.length;
    let rmax = 0, rsum = 0;
    for (const p of pts) { const r = Math.hypot(p[0], p[1]) || 1e-3, k = Math.max(0.2, 1 - gap / r * 1.15); p[0] *= k; p[1] *= k; rmax = Math.max(rmax, r * k); rsum += r * k; }
    const rmean = rsum / pts.length;
    while (pts.length < 7) pts.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
    return { x: c[0], z: c[1], pts, sides, rmax, rmean };
  };
  return { point, cell, hash, NB, NB2 };
}

// ---------------------------------------------------------------- which cells stand where: solid spans of every cell, and what of them the air can see
// Returns the four instance lists (near, far, roof, stump) and the lists the anchors are drawn from.
async function dealColumns(ctx, F, L, S, ref, detail) {
  const info = new Map();
  const cellInfo = (i, j) => {
    const key = i * 4096 + j; let c = info.get(key); if (c) return c;
    const p = L.point(i, j), x = p[0], z = p[1];
    const f = F.foot(x, z + F.FRONT_SHIFT), h = L.hash(i, j, 3), h2 = L.hash(i, j, 4);
    if (f >= 1) {
      // the causeway: stumps stepping down into the sea before the face's foot, row by row, the last ones awash
      const dOut = (f - 1) * 66, reach = APRON * (1 - sstep(-34, -44, z));
      if (dOut < reach && Math.abs(x) > 9.4) {
        const top = 6.3 - Math.floor(dOut / 1.05 + 0.6 * h2) * 1.4 - 0.9 * h + 0.5 * S.n2(x * 0.3 + S.o2, z * 0.3);
        if (top > -0.9) { c = { out: false, apron: true, x, z, voids: [[top, 1e3]], spans: [[FOOT, top, false, true]], indoor: 0, h, h2, stump: null, broken: true, ceil: -1, dFace: 0 }; info.set(key, c); return c; }
      }
      c = { out: true }; info.set(key, c); return c;
    }
    const voids = [];
    let indoor = 0;
    // the cave's own air over this cell
    const ce = F.ceilAt(x, z);
    let stump = null;
    if (ce > 0) {
      stump = F.stumpTop(x, z, h);
      const hang = ce + 0.15 + 1.9 * h * h + (h2 < 0.07 ? -0.9 : 0) + (h2 > 0.93 ? 1.6 : 0);     // uneven depths of the hanging mosaic
      voids.push([stump === null ? -1e3 : stump, hang]); indoor = 1;
    }
    // the blowhole
    if (Math.abs(x) < 11 && z < -66 && z > -116) {
      const top = F.topAt(x, z); let lo = 1e9, hi = -1e9;
      for (let y = -4; y <= top + 0.5; y += 0.25) if (F.inChim(x, y, z)) { if (y < lo) lo = y; hi = y; }
      if (hi > lo) { voids.push([lo - 0.3 * h, hi + 0.25 + 0.9 * h2 * h2]); indoor = Math.max(indoor, ce > 0 ? 1 : 2); }
    }
    // the top: under the cap, under the turf round the lip, or broken short on the cliff's face
    let top = CAP_BASE + 4, broken = false, dFace = 0;
    if (Math.abs(x) < 17 && z < -84) top = F.topAt(x, z) - F.lipDip(x, z) - 0.45;
    else if (ce < 0) {
      const d = (1 - f) * 66;                                                  // metres behind the face, roughly
      dFace = d;
      if (z > -50 && Math.abs(x) > 9.5) {
        // the organ: bundles of pipes 2.5 to 4 m wide end at their own heights, the rows behind stepping up and back under
        // the cap's brow; where the cap is broken away they stand free, tall or snapped short, tallest by the mouth
        const u = F.uAt(x, z), nt = F.notchAt(u) * F.frontK(z), tw = F.towerAt(u), row = Math.min(3, Math.floor(d / 1.2));
        const bun = Math.floor(u / 3.1 + 1.1 * S.n2(u * 0.11 + S.o1, 2.2)), hb = L.hash(bun, 77, 6);
        const sk = 31.5 + 2.6 * S.n2(u * 0.045 + S.o2, 6.1) + 4.6 * (hb - 0.5) + nt * (2 + 5 * S.n2(u * 0.027 + S.o4, 8.8)) + tw * 5.5 + row * (1.1 + 1.5 * h) + (h2 - 0.5) * 1.4;
        if (d < 3.6 + NOTCH * nt + 2 * tw && (sk < CAP_BASE + 3.4 || nt > 0.25)) { top = Math.min(sk, 47.5); broken = true; }
        if (d < 1.2 && h2 < 0.07) { top = 10 + 18 * h; broken = true; }         // a pipe snapped low here and there in the front row
      }
    }
    if (broken) voids.push([top, 1e3]);
    voids.sort((a, b) => a[0] - b[0]);
    // solid spans: what is left of [FOOT, top]
    const spans = []; let y = FOOT;
    for (const v of voids) { if (v[0] > y + 0.3 && y < top) spans.push([y, Math.min(v[0], top), false, true]); y = Math.max(y, v[1]); }
    if (y < top - 0.3) spans.push([y, top, spans.length > 0 || y > FOOT + 0.01, false]);
    // span: [y0, y1, bottom end in air, top end in air]; a broken top is in air too
    for (const s of spans) { if (s[0] > FOOT + 0.01) s[2] = true; if (broken && s[1] === top) s[3] = true; }
    c = { out: false, x, z, voids, spans, indoor, h, h2, stump, broken, ceil: ce, dFace };
    info.set(key, c); return c;
  };

  const near = [], far = [], roof = [], stump = [];
  const lists = { stumps: [], roofEnds: [], ledges: [], chimLedges: [], runoff: [], dropped: 0, minClear: 1e9 };
  const I0 = -Math.ceil(126 / PITCH), I1 = -I0, J0 = -Math.ceil(134 / (PITCH * 0.866)), J1 = Math.ceil(12 / (PITCH * 0.866));
  let work = 0, made = 0;
  // THE SPANS OF ONE CELL: a plain function, called a cell at a time. The engine's hand-back for the bodies made lies
  // AFTER the cell, below: once, if the count of bodies made reached a multiple of sixteen within that cell (before
  // order 12 it lay inside the cell, at the sixteenth body itself). At most one a cell: as many hand-backs as before,
  // unless one cell makes seventeen bodies or more
  const spansOf = (i, j, c) => {
      const nb = L.NB(j); let cellPoly = null;
      for (let si = 0; si < c.spans.length; si++) {
        const sp = c.spans[si]; let lo = 1e9, hi = -1e9, outside = false, seen = 0, ox = 0, oz = 0;
        for (let nk = 0; nk < 6; nk++) {
          const di = nb[nk][0], dj = nb[nk][1], n = cellInfo(i + di, j + dj);
          if (n.out) {
            if (c.z > -47.5) { lo = Math.min(lo, sp[0]); hi = Math.max(hi, sp[1]); outside = true; const q = L.point(i + di, j + dj), l = Math.hypot(q[0] - c.x, q[1] - c.z) || 1; ox += (q[0] - c.x) / l * (sp[1] - sp[0]); oz += (q[1] - c.z) / l * (sp[1] - sp[0]); }
            continue;
          }
          for (const v of n.voids) {
            const a = Math.max(sp[0], v[0]), b = Math.min(sp[1], v[1]);
            if (b - a > 0.06) { lo = Math.min(lo, a); hi = Math.max(hi, b); if (v[1] < 900) seen = Math.max(seen, n.indoor); const l = Math.hypot(n.x - c.x, n.z - c.z) || 1; ox += (n.x - c.x) / l * (b - a); oz += (n.z - c.z) / l * (b - a); }
          }
        }
        { const l = Math.hypot(ox, oz); if (l > 0.3) { ox /= l; oz /= l; } else { ox = 0; oz = 0; } }      // the span's open side
        if (sp[3]) { hi = sp[1]; lo = Math.min(lo, sp[1] - 1.4); }
        if (sp[2]) { lo = sp[0]; hi = Math.max(hi, sp[0] + 1.1); }
        if (lo > hi) continue;
        let y0 = Math.max(sp[0], lo - 0.7), y1 = Math.min(sp[1], hi + 0.7);
        if (outside) y0 = sp[0];
        if (!cellPoly) cellPoly = L.cell(i, j);
        const P = cellPoly;
        // clear air round the flown line, by place: a body that would come within CLEAR is cut back or left out
        const hang = sp[2] && !sp[3];
        if (c.indoor || seen || Math.abs(c.x - 3) < 14) {
          let d = ref.clearOf(c.x, c.z, P.rmax, y0, y1);
          if (d < CLEAR) {
            if (sp[3] && !hang) { for (let k = 0; k < 40 && d < CLEAR && y1 > y0 + 0.4; k++) { y1 -= 0.25; d = ref.clearOf(c.x, c.z, P.rmax, y0, y1); } }
            else if (hang) { for (let k = 0; k < 40 && d < CLEAR && y1 > y0 + 0.4; k++) { y0 += 0.25; d = ref.clearOf(c.x, c.z, P.rmax, y0, y1); } }
            if (d < CLEAR) { lists.dropped++; continue; }
          }
          if (d < lists.minClear) lists.minClear = d;
        }
        made++;
        const dPath = ref.planDist(c.x, c.z, 0.5 * (y0 + y1));
        const topType = sp[3] ? (c.h2 < 0.62 ? 1 : 2) : 0, botType = sp[2] ? (c.h < 0.5 ? 1 : 2) : 0;
        // lit as the cave, the blowhole or the open cliff: by the air the span stands in (a jamb belongs to the cave from 0.8 m in)
        let indoor = Math.max(c.indoor, seen);
        if (outside && c.z > -0.8) indoor = 0;
        if (indoor === 1 && 0.5 * (y0 + y1) > 26 && c.z < -70) indoor = 2;
        // on the cliff: how far round to east and west the sky stands open before a prouder part of the face cuts it off
        // (tangents of the two angles), and how far the cap's brow stands out over this body
        let tE = 6, tW = 6, over = 0;
        if (!indoor) {
          const u = F.uAt(c.x, c.z), fk = F.frontK(c.z), d0 = (1 - F.footS(c.x, c.z + F.FRONT_SHIFT)) * 66;
          for (let k = 1; k <= 8; k++) {
            const du = k * 1.5, be = d0 - F.faceBackU(u + du) * fk, bw = d0 - F.faceBackU(u - du) * fk;
            if (be > 0.9) tE = Math.min(tE, du / be); if (bw > 0.9) tW = Math.min(tW, du / bw);
          }
          { const nt = F.notchAt(u) * fk; over = Math.max(0, d0 + 1.9 * (1 - nt) - (NOTCHB + 0.4) * nt); }
        }
        const inst = { ci: i, cj: j, x: c.x, z: c.z, y0, y1, P, seed: c.h * 0.97 + 0.015, top: topType, bot: botType, indoor, joint: 0.4 + 0.8 * L.hash(i, j, 5), rec: over, ox, oz, tE, tW };
        const isStump = c.stump !== null && si === 0, close = indoor || (dPath < 26 && c.dFace < 2.6);
        if (hang) { roof.push(inst); if (indoor === 1 && c.ceil > 0) lists.roofEnds.push([c.x, y0, c.z]); }
        else if (isStump) { stump.push(inst); lists.stumps.push({ x: c.x, y: y1, z: c.z, r: P.rmean, i, j, P, cup: topType === 1 }); }
        else if (c.apron) (dPath < 22 ? stump : far).push(inst);
        else if (sp[3] && y1 - y0 < 9 && close) { stump.push(inst); if (indoor === 2) lists.chimLedges.push([c.x, y1, c.z]); else if (!indoor) lists.ledges.push([c.x, y1, c.z]); }
        else if (close) { near.push(inst); if (sp[3]) (indoor === 2 ? lists.chimLedges : lists.ledges).push([c.x, y1, c.z]); }
        else { far.push(inst); if (sp[3]) lists.ledges.push([c.x, y1, c.z]); }
      }
  };
  for (let j = J1; j >= J0; j--) {
    const bz = j * PITCH * 0.8660254;
    for (let i = I0; i <= I1; i++) {
      // cells deep in the rock, with no air near them, are never looked at: only the face's rim (17 m), the cave and the blowhole
      const bx = (i + 0.5 * (j & 1)) * PITCH;
      const rim = bz > -53 && ((Math.abs(bx) / HX) ** 6 + (Math.abs(bz + F.FRONT_SHIFT - HCZ) / HZ) ** 6) ** (1 / 6) > 0.74;
      if (!rim && !(Math.abs(bx) < 23 && bz < 4 && bz > -119)) continue;
      const c = cellInfo(i, j); if (c.out) { if (++work % 120 === 0) await ctx.yield(); continue; }
      if (++work % 120 === 0) await ctx.yield();
      const m0 = made; spansOf(i, j, c); if ((made >> 4) !== (m0 >> 4)) await ctx.yield();
    }
  }
  // the pavement's runoff: for every stump, the side that drops furthest toward open water
  for (const s of lists.stumps) {
    let best = null, bd = 0.45;
    const nb = L.NB(s.j);
    for (const [di, dj] of nb) {
      const n = cellInfo(s.i + di, s.j + dj); if (n.out) continue;
      const nt = n.stump === null ? (n.ceil > 0 ? -9 : 99) : n.stump;
      const drop = s.y - nt; if (drop > bd) { bd = drop; best = n; }
    }
    if (best) { const dx = best.x - s.x, dz = best.z - s.z, l = Math.hypot(dx, dz) || 1; lists.runoff.push({ x: s.x + dx / l * s.r * 0.86, z: s.z + dz / l * s.r * 0.86, y: s.y, nx: dx / l, nz: dz / l, drop: Math.min(bd, 8), w: s.r }); }
  }
  void detail;
  return { near, far, roof, stump, lists, cellInfo };
}

// The flown line's points: the brief's first eight; then the bend into the blowhole; then the straight to the portal.
// The bend lies in the plane x = 0, wholly below and before the axis' foot (the straight is the whole of the last 60 m, so
// the turn must be made before it; a turn up to 68 degrees that ends at y = 3 has to come from underneath): a straight
// glide from the brief's (0, 1.5, -58) down at 10.3 degrees, then one even arc (radius 6.1 m, its curvature eased in and
// out over 12 % of its length at either end, 9.5 m long) that bottoms at y = -1.5 near z = -75 (the brief's own lowest
// height, in the choir: the water it needs under the lens is inside the breath) and runs out, tangent, into the straight
// 0.15 m before the foot (0, 3, -81). From the foot every point lies on the one straight to the portal's seat (59.97 m at
// 67.97 degrees: the seat stands 3 cm off the 68 degree axis). The points stand 0.3 m apart on the arc and their spacing
// grows by half from one to the next along the glide and up the straight, so that the kit's spline through them keeps the
// arc even and never pitches over the straight.
function flownPoints() {
  const pts = BRIEF_PATH.slice(0, 8).map((p) => p.slice()), B = BRIEF_PATH[7], Ft = BRIEF_PATH[8];
  const dy = PORTAL.y - Ft[1], dz = PORTAL.z - Ft[2], AL = Math.hypot(dy, dz), pitch = Math.atan2(dy, -dz);
  const K0 = 0.16296869251325385, PHI0 = -10.349116934544327 * Math.PI / 180, RAMP = 0.12, STEP = 0.3, GROW = 1.5, PRE = 0.15, n = 4000;
  const Lb = (pitch - PHI0) / (K0 * (1 - RAMP)), ds = Lb / n, arc = [];
  let y = Ft[1] - Math.sin(pitch) * PRE, z = Ft[2] + Math.cos(pitch) * PRE, phi = pitch;      // walked back from just before the foot
  for (let i = 0; i < n; i++) { const q = (i + 0.5) / n, k = K0 * Math.min(1, q / RAMP, (1 - q) / RAMP), pm = phi - k * ds * 0.5; y -= Math.sin(pm) * ds; z += Math.cos(pm) * ds; phi -= k * ds; arc.push([y, z]); }
  const S0 = arc[n - 1], gl = Math.hypot(S0[0] - B[1], S0[1] - B[2]), gd = [], nA = Math.max(4, Math.round(Lb / STEP));
  for (let d = STEP * GROW, at = d; at < gl - d * 0.8; d *= GROW, at += d) gd.push(at);
  for (const q of gd.reverse()) pts.push([0, S0[0] + (B[1] - S0[0]) * q / gl, S0[1] + (B[2] - S0[1]) * q / gl]);
  for (let k = nA; k >= 1; k--) { const q = arc[Math.round(n * k / nA) - 1]; pts.push([0, q[0], q[1]]); }
  pts.push(Ft.slice());
  for (let d = STEP * GROW, at = d; at < AL - d * 0.7; d = Math.min(d * GROW, 16), at += d) pts.push([0, Ft[1] + dy * at / AL, Ft[2] + dz * at / AL]);
  pts.push([PORTAL.x, PORTAL.y, PORTAL.z]);
  return pts;
}
// the flown line, for clearances
async function makeRef(ctx) {
  const pts = flownPoints();
  await ctx.yield();
  const path = makePath(pts, { samples: 64 });
  await ctx.yield();
  const N = 1400, sx = new Float32Array(N + 1), sy = new Float32Array(N + 1), sz = new Float32Array(N + 1), v = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { path.pointAt(i / N, v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; if (i % 350 === 349) await ctx.yield(); }
  // nearest distance from the line to an upright prism of radius r standing from y0 to y1 at (x, z), taken at its largest:
  // a drum may sit 3.5 cm off and 1.5 % wide, a dome stands 0.1 m over its top, a hanging end 0.15 m under its foot
  // THE SAMPLES STAND IN BOXES of sixteen (the least and the greatest x, y and z of each box's own samples), so that the
  // search need not look at every sample; its answer is the same to the bit. A prism is no nearer any sample of a box
  // than it is to the box; the box's distance is worked out the way a sample's is, its part in plan taken a millionth
  // short (far more than the roundings of the two square roots differ by), so it is never greater than the distance of
  // a sample inside it, and a box that stands no nearer than the best sample found so far is passed over. The search
  // starts in the box that held the last answer (hint: it changes how soon boxes are passed over, never an answer).
  const BS = 16, NBX = Math.ceil((N + 1) / BS), bLo = new Float32Array(NBX * 3), bHi = new Float32Array(NBX * 3); let hint = 0;
  for (let b = 0; b < NBX; b++) {
    const k = b * 3, i0 = b * BS; bLo[k] = bHi[k] = sx[i0]; bLo[k + 1] = bHi[k + 1] = sy[i0]; bLo[k + 2] = bHi[k + 2] = sz[i0];
    for (let i = i0 + 1, e = Math.min(N, i0 + BS - 1); i <= e; i++) {
      if (sx[i] < bLo[k]) bLo[k] = sx[i]; if (sx[i] > bHi[k]) bHi[k] = sx[i]; if (sy[i] < bLo[k + 1]) bLo[k + 1] = sy[i]; if (sy[i] > bHi[k + 1]) bHi[k + 1] = sy[i];
      if (sz[i] < bLo[k + 2]) bLo[k + 2] = sz[i]; if (sz[i] > bHi[k + 2]) bHi[k + 2] = sz[i];
    }
  }
  const clearOf = (x, z, r, y0, y1) => {
    let best = 1e9, hb = hint; r = r * 1.015 + 0.035; y0 -= 0.15; y1 += 0.1;
    for (let p = -1; p < NBX; p++) {
      if (p === hint) continue;
      const b = p < 0 ? hint : p, k = b * 3;
      if (p >= 0) {
        const by = bHi[k + 1] < y0 ? y0 - bHi[k + 1] : bLo[k + 1] > y1 && bLo[k + 1] >= y0 ? bLo[k + 1] - y1 : 0;
        const ax = x < bLo[k] ? bLo[k] - x : x > bHi[k] ? x - bHi[k] : 0, az = z < bLo[k + 2] ? bLo[k + 2] - z : z > bHi[k + 2] ? z - bHi[k + 2] : 0;
        const hl = Math.max(0, Math.sqrt(ax * ax + az * az) * 0.999999 - r);
        if (hl * hl + by * by >= best) continue;
      }
      for (let i = b * BS, e = Math.min(N, i + BS - 1); i <= e; i++) {
        const dy = sy[i] < y0 ? y0 - sy[i] : sy[i] > y1 ? sy[i] - y1 : 0; if (dy * dy >= best) continue;
        const hd = Math.max(0, Math.hypot(sx[i] - x, sz[i] - z) - r), d = hd * hd + dy * dy;
        if (d < best) { best = d; hb = b; }
      }
    }
    hint = hb; return Math.sqrt(best);
  };
  const planDist = (x, z, y) => { let best = 1e9; for (let i = 0; i <= N; i += 4) { const d = (sx[i] - x) ** 2 + (sz[i] - z) ** 2 + 0.25 * (sy[i] - y) ** 2; if (d < best) best = d; } return Math.sqrt(best); };
  return { path, pts, clearOf, planDist };
}

// ---------------------------------------------------------------- prism geometries (corner positions come from the instance; a vertex only names its corner)
// position = (corner k, joint m, side of the joint s);  aSide = (first corner of the face, which end of the face, kind)
// kind: 0 side, 1 top rim, 2 top inner ring, 3 top centre, 4 bottom rim, 5 bottom inner ring, 6 bottom centre
// joints: m = -1 is the foot, m = 3 the head; m = 0..2 are the master joints, with s = -1 just under and s = +1 just over
function prismGeometry(rings, cap) {
  // rings: list of [m, s] from foot to head; cap: 'cup' (top rim, inner ring, centre), 'fan' (top, flat), 'under' (bottom rim, inner ring, centre)
  const pos = [], side = [], idx = [];
  const v = (k, m, s, k0, e, kind) => { pos.push(k, m, s); side.push(k0, e, kind); return pos.length / 3 - 1; };
  for (let r = 0; r < rings.length - 1; r++) {
    const [m0, s0] = rings[r], [m1, s1] = rings[r + 1];
    for (let k = 0; k < 7; k++) {
      const a0 = v(k, m0, s0, k, 0, 0), b0 = v((k + 1) % 7, m0, s0, k, 1, 0), a1 = v(k, m1, s1, k, 0, 0), b1 = v((k + 1) % 7, m1, s1, k, 1, 0);
      idx.push(a0, a1, b1, a0, b1, b0);
    }
  }
  if (cap === 'cup' || cap === 'fan') {
    const rim = [], inn = [];
    for (let k = 0; k < 7; k++) rim.push(v(k, 3, 0, k, 0, 1));
    if (cap === 'cup') {
      for (let k = 0; k < 7; k++) inn.push(v(k, 3, 0, k, 0, 2));
      const c = v(0, 3, 0, 0, 0, 3);
      for (let k = 0; k < 7; k++) { const k2 = (k + 1) % 7; idx.push(rim[k], inn[k2], inn[k], rim[k], rim[k2], inn[k2]); idx.push(c, inn[k], inn[k2]); }
      for (let i = idx.length - 21 * 3; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }   // tops face up
    } else {
      const c = v(0, 3, 0, 0, 0, 3);
      for (let k = 0; k < 7; k++) idx.push(c, rim[(k + 1) % 7], rim[k]);
    }
  }
  if (cap === 'under') {
    const rim = [], inn = [];
    for (let k = 0; k < 7; k++) rim.push(v(k, -1, 0, k, 0, 4));
    for (let k = 0; k < 7; k++) inn.push(v(k, -1, 0, k, 0, 5));
    const c = v(0, -1, 0, 0, 0, 6);
    for (let k = 0; k < 7; k++) { const k2 = (k + 1) % 7; idx.push(rim[k], inn[k2], inn[k], rim[k], rim[k2], inn[k2]); idx.push(c, inn[k], inn[k2]); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3));
  g.setIndex(idx);
  return g;
}

function fillInstances(geo, list) {
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = [0, 1, 2, 3].map(() => new Float32Array(n * 4)), Dd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const q = list[i], p = q.P.pts;
    A.set([q.x, q.z, q.y0, q.y1], i * 4);
    B.set([q.seed, q.top + 4 * q.bot, q.indoor, q.joint], i * 4);
    C[0].set([p[0][0], p[0][1], p[1][0], p[1][1]], i * 4); C[1].set([p[2][0], p[2][1], p[3][0], p[3][1]], i * 4);
    C[2].set([p[4][0], p[4][1], p[5][0], p[5][1]], i * 4); C[3].set([p[6][0], p[6][1], q.P.rmean, q.rec || 0], i * 4);   // rec: metres the cap's brow stands out over this body
    Dd.set([q.ox || 0, q.oz || 0, q.tE ?? 6, q.tW ?? 6], i * 4);                 // the open side (level unit vector), and how far round to east and west the sky stands open (tangents)
  }
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4));
  geo.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  for (let k = 0; k < 4; k++) geo.setAttribute('iC' + k, new THREE.InstancedBufferAttribute(C[k], 4));
  geo.setAttribute('iD', new THREE.InstancedBufferAttribute(Dd, 4));
  // (order 12, iF0 and iF1.xyz: for each of the body's seven sides, the height above which that side looks into OPEN
  // AIR (-1000: at every height; 1000: nowhere); iF1.w: metres the pipe is TAKEN to stand back or out, for its shading
  // alone (nought on every body until dealRelief deals the open cliff's)
  { const f1 = new Float32Array(n * 4).fill(-1000); for (let i = 0; i < n; i++) f1[i * 4 + 3] = 0;
    geo.setAttribute('iF0', new THREE.InstancedBufferAttribute(new Float32Array(n * 4).fill(-1000), 4));
    geo.setAttribute('iF1', new THREE.InstancedBufferAttribute(f1, 4)); }
  geo.instanceCount = n;
  return geo;
}

// ORDER 12, THE COLONNADE'S RELIEF, BY PLACE, AS PAINT. A body of the open cliff that stands in the new look's ground
// (more than 16 m east or west of x = 3, the line that runs into the mouth, coming in over 6 m, and before z = -50) carries a number:
// how far it is TAKEN to stand back or out from its neighbours along its open side (up to half a metre, by the bundle
// it stands in and by its own place). The fragment shader lays the prouder neighbour's shadow across a pipe that
// stands back and darkens it. NO BODY IS MOVED AND NO HEAD IS RAISED: the cliff's outer columns are seen from behind,
// from inside the cave, through hairlines between the wall's pipes, so their geometry belongs to the look inside the
// cave, which order 12 binds to the bit (a true set-back of a body shows through those hairlines).
// The anchors, the lists and the random streams are not touched by this. Nothing here knows the lens.
// AND WHERE EACH SIDE OF SUCH A BODY LOOKS INTO OPEN AIR (iF0, iF1), BY PLACE: for each of its seven sides, the cell that
// stands beyond it (of the twelve that cut a cell: the one whose point is the body's own point mirrored in the side;
// where a side was merged of two and none fits, the nearest cells to three points a hand beyond it) is open sea or sky
// at every height (-1000), or a column whose head is broken off in the open (the air begins at that head), or rock
// (1000: no air); of unlike answers the highest stands. The new look is laid on a side only above that height: a side that
// looks into the rock, or at a neighbour, keeps the old look to the bit (those are the faces a sight line from inside
// the cave ends on once it has slipped through a hairline between two wall pipes: the rock's inside carries no bodies)
async function dealRelief(ctx, F, S, L, deal, sets, seats) {
  const key = (x, z) => Math.round(x * 64) * 65536 + Math.round(z * 64), hold = new Set();
  for (const p of seats) hold.add(key(p[0], p[2]));
  const hh = (x, z, k) => fract(Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453);
  const rx = new Float64Array(12), rz = new Float64Array(12), ra = new Float64Array(12);
  const NBS = [L.NB(0).concat(L.NB2(0)), L.NB(1).concat(L.NB2(1))];
  let moved = 0, work = 0;
  for (const [, geo, list] of sets) {
    const F0 = geo.getAttribute('iF0').array, F1 = geo.getAttribute('iF1').array;
    for (let i = 0; i < list.length; i++) {
      const q = list[i]; if (q.indoor) continue;
      const gz = sstep(-60, -50, q.z); if (gz === 0) continue;
      if (q.ci !== undefined && Math.max(sstep(16, 22, Math.abs(q.x - 3)), sstep(13, 16, Math.abs(q.x))) > 0) {
        const nb = NBS[q.cj & 1];
        for (let m = 0; m < 12; m++) { const p = L.point(q.ci + nb[m][0], q.cj + nb[m][1]); rx[m] = p[0] - q.x; rz[m] = p[1] - q.z; ra[m] = 2000; }
        if ((++work & 255) === 0) await ctx.yield();                    // (a hand-back to the engine every 256 bodies: no long step)
        for (let m = 0; m < 12; m++) { const N = deal.cellInfo(q.ci + nb[m][0], q.cj + nb[m][1]); let h = 1000; if (N.out) h = -1000; else for (const v of N.voids) if (v[1] > 900) h = v[0]; ra[m] = h; }
        const pts = q.P.pts;
        for (let k = 0; k < 7; k++) {
          const p0 = pts[k], p1 = pts[(k + 1) % 7], ex = p1[0] - p0[0], ez = p1[1] - p0[1], el = Math.hypot(ex, ez);
          let a = -1000;
          if (el > 1e-4) {
            let nx = ez / el, nz = -ex / el; if (nx * (p0[0] + p1[0]) + nz * (p0[1] + p1[1]) < 0) { nx = -nx; nz = -nz; }
            const dm = nx * (p0[0] + p1[0]) + nz * (p0[1] + p1[1]) + 0.03, mx = nx * dm, mz = nz * dm; let b = 0, bd = 1e9;
            for (let m = 0; m < 12; m++) { const d = (mx - rx[m]) * (mx - rx[m]) + (mz - rz[m]) * (mz - rz[m]); if (d < bd) { bd = d; b = m; } }
            a = ra[b];
            if (bd > 0.01) for (let t = 0.25; t < 0.8; t += 0.25) {
              const sx = p0[0] + ex * t + nx * 0.32, sz = p0[1] + ez * t + nz * 0.32; b = 0; bd = 1e9;
              for (let m = 0; m < 12; m++) { const d = (sx - rx[m]) * (sx - rx[m]) + (sz - rz[m]) * (sz - rz[m]); if (d < bd) { bd = d; b = m; } }
              a = Math.max(a, ra[b]);
            }
          }
          if (k < 4) F0[i * 4 + k] = a; else F1[i * 4 + k - 4] = a;
        }
      }
      if (!(q.ox || q.oz)) continue;
      const g = sstep(16, 22, Math.abs(q.x - 3)) * gz; if (g === 0 || hold.has(key(q.x, q.z))) continue;
      const h1 = hh(q.x, q.z, 1);
      const u = F.uAt(q.x, q.z), bun = Math.floor(u / 3.1 + 1.1 * S.n2(u * 0.11 + S.o1, 2.2));
      F1[i * 4 + 3] = clamp((hh(bun, 7, 4) - 0.5) * 0.6 + (h1 - 0.55) * 0.55, -0.5, 0.4) * g; moved++;
    }
  }
  return moved;
}

// ---------------------------------------------------------------- THE SEA LAW: one text
// The whole look of open water outside the mouth. The part's own sheet wears it before the mouth, the stand-in sea all
// over, and a world's own sea includes this same text (import { SEA_GLSL } from the part), so the three cannot differ.
// NEEDS, declared before it by the shader that includes it (all of them are in hero.uniforms, on these names):
//   uniform float uWind, uGlowAmt, uAirDen, uSeaK;
//   uniform vec3 uSunDir, uSunCol, uSkyCol, uAirCol, uSeaBody, uGlowCol, uDeep, uBasalt, uFoamCol,
//                uSeaZen, uSeaMid, uSeaHor, uSeaScat, uSeaScatDir;
//   uniform vec4 uSeaP, uSeaQ;  uniform sampler2D uCaus;      (uCaus: the part's caustic tile, hero.uniforms.uCaus)
//   and screen derivatives (fwidth), for seaFw alone. Nothing else: no varying, no other helper.
// DEFINES (the shader that includes it must not define these names itself): nrm, h11, h21, vn, fbm2, causTap, slab,
//   lampBody, glowZ, seaSky, vnd, seaFw, seaSwell, seaShore, cliffFace, seaFace, seaLook.
// USE  vec3 col = seaLook(q, V, seaFw(q), time, seaSwell(q, time));   then the includer's own air over it.
//   q: the place on the water (x, z) in the part's space (+z seaward, the cliff's front at z = 0);  V: unit vector from
//   that place to the eye;  the last argument is the water's own height and slopes there (height, dh/dx, dh/dz): a flat
//   sheet hands it seaSwell (the law's own swell), a sea whose surface already rises and falls hands its own.
export const SEA_GLSL = /* glsl */`
// (a vector that can be zero is never handed to normalize, nor a base that rounding can take under zero to pow)
vec3 nrm(vec3 v){ return v*inversesqrt(max(dot(v, v), 1e-12)); }
float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1.,0.)), f.x), mix(h21(i+vec2(0.,1.)), h21(i+vec2(1.,1.)), f.x), f.y); }
float fbm2(vec2 p){ return .5*vn(p)+.25*vn(p*2.03+7.1)+.125*vn(p*4.01+3.3)+.0625*vn(p*8.07+1.7); }
// one tap of the caustic tile (stored as a square root); lod picks its smaller copies
float causTap(vec2 uv, float lod){ float c = textureLod(uCaus, uv, lod).r; return c*c; }
// the water's own colour where it is deep: the emerald with its red and blue drunk out
vec3 slab(){ return uGlowCol*mix(vec3(1.), uGlowCol/1.3, .5); }
// THE LAMP: the water's own glow, by how open the place is (1 over the pale sand in mid nave: the emerald itself; 0 in
// the shadow close under a wall: deep green)
vec3 lampBody(float open){ return mix(slab()*.17+uDeep*.03, uGlowCol*.6, open); }
// the lamp's strength down the cave: the daylight that came in by the mouth and back off the sand dies toward the deep back
float glowZ(float z){ return uGlowAmt*mix(.42, 1., smoothstep(-88., -50., z)); }
// the sky as a clear-sky gradient (used only while uSeaK is 1; the part leaves it 0 and mirrors its own sky colour)
vec3 seaSky(vec3 d){ float inv = max(1.-clamp(d.y, 0., 1.), 1e-4);
  vec3 c = mix(uSeaZen, uSeaMid, pow(inv, max(uSeaP.x, .01))); c = mix(c, uSeaHor, pow(inv, max(uSeaP.y, .01)));
  float sc = pow(max(.5+.5*dot(d, uSeaScatDir), 1e-4), max(uSeaP.w, .01))*mix(uSeaQ.x, 1., pow(inv, max(uSeaQ.y, .01)));
  return mix(c, uSeaScat, clamp(sc*uSeaP.z, 0., 1.)); }
vec3 vnd(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*(3.-2.*f), du = 6.*f*(1.-f);
  float a = h21(i), b = h21(i+vec2(1., 0.)), c = h21(i+vec2(0., 1.)), d = h21(i+vec2(1., 1.)), k = a-b-c+d;
  return vec3(a+(b-a)*u.x+(c-a)*u.y+k*u.x*u.y, du*(vec2(b-a, c-a)+k*u.yx)); }
// what a pixel covers of the water, metres (the root of its area)
float seaFw(vec2 q){ vec2 d = fwidth(q); return max(sqrt(d.x*d.y), .35*(d.x+d.y)); }
// THE SWELL: long low backs from the open sea running onto the cliff (it faces south), 24 m and 13 m from crest to crest,
// 0.6 m from trough to crest in slack air, twice that in a gale. Returns (height, slope along x, slope along z)
vec3 seaSwell(vec2 q, float t){
  float am = mix(1., 2., smoothstep(.45, 1., uWind));
  float a1 = (q.y+.22*q.x)*.262+t*1.05+5.*vn(q*vec2(.021, .013)+3.), a2 = (q.y-.45*q.x)*.48+t*1.45+4.*vn(q*vec2(.03, .02)+11.);
  return am*vec3(.2*sin(a1)+.1*sin(a2), .0115*cos(a1)-.0216*cos(a2), .0524*cos(a1)+.048*cos(a2)); }
// metres (roughly) from a place on the sea to the nearest rock standing in it: the headland's foot, or one of the two stacks
float seaShore(vec2 q){
  float ex = q.x/120., ez = (q.y+65.)/65.; ex *= ex; ez *= ez;
  float d = (pow(ex*ex*ex+ez*ez*ez+1e-9, 1./6.)-1.)*66.-4.2;
  return min(d, min(length(q-vec2(63., 46.)), length(q-vec2(-57., 60.)))-3.5); }
// THE CLIFF AS THE SEA MIRRORS IT, by the mirrored PLACE on its face (xc across it, yc up it; L: metres from the water
// to it; fw: metres of the face one pixel's mirror covers): as bright as the cliff's own south face under this look's sun
// and sky (gold-bronze under a low sun in the south, slate by day, a grey loom through fog); pipes 1.05 m wide, each
// its own tone, a dark joint between two; broad lights and darks for the bundles and bays; the wet dark foot; the mouth
// a dark slot with the emerald low in it
vec3 cliffFace(float xc, float yc, float L, float fw){
  // (no pipe is ruled: its edges wander up its length, its width is its own, and it is built of drums of uneven tone)
  float keep = 1.-smoothstep(.2, .75, fw), wob = vn(vec2(xc*.45, yc*.16))-.5;
  float c = xc/1.05+.3*sin(xc*.7)+.55*wob*keep, id = floor(c), f = fract(c);
  float tone = mix(.82, .5+.62*h11(id*7.3+2.), keep)*mix(.86, .42+.58*smoothstep(0., .13, min(f, 1.-f)), keep);
  tone *= mix(1., .7+.6*vn(vec2(id*1.7, yc*.3)), keep);
  // (and the pipes stand in bundles of four or five, each bundle its own tone, a dark gap between two: these last when a
  // single pipe has melted)
  float cb = xc/4.6+.6*sin(xc*.19)+.2*wob, fb = fract(cb);
  tone *= mix(1., (.5+.85*h11(floor(cb)*3.7+5.))*(.4+.6*smoothstep(0., .13, min(fb, 1.-fb))), 1.-smoothstep(.9, 3.6, fw));
  float bay = smoothstep(.2, .42, vn(vec2(xc*.07, 3.))+.25*(1.-smoothstep(9., 26., abs(xc))));      // (towers by the mouth, bays and buttresses beyond: a quarter of the face is bay)
  // (up the face: the wet dark foot, the pipes' ragged heads, and over them the cap's brow in its own shade)
  tone *= (.5+.5*smoothstep(.3, 5., yc))*(1.-.6*smoothstep(32., 37., yc+5.*(vn(vec2(xc*.21, 7.))-.5)));
  float lowS = 1.-smoothstep(.2, .55, uSunDir.y), nl = max(uSunDir.z, 0.);
  vec3 sunG = uSunCol*mix(vec3(1.), uSunCol/max(max(uSunCol.r, uSunCol.g), max(uSunCol.b, 1e-3)), .7);
  vec3 lit = uBasalt*(uSunCol*nl*.62+uSkyCol*.75)+sunG*(lowS*nl*nl*.17), shade = uBasalt*uSkyCol*.45+uDeep*.004;
  vec3 col = mix(shade, lit, .12+.88*bay)*tone;
  // THE MOUTH IN THE WATER IS THE CAVE SEEN IN THE WATER: dark green-black, the emerald of the sill and of the lit walls
  // low in it, a little lighter up its jambs; its outline is soft and ragged (the jambs are broken pipes, and the dark
  // of the cave has no edge)
  float hw = 8.*(1.-.8*smoothstep(8., 24., yc)), mw = 1.5+.6*fw+.06*L, rag = (vn(vec2(xc*.8, yc*.21))-.5)*2.2+(vn(vec2(xc*2.7, yc*.6)+5.)-.5)*.9;
  float mouth = (1.-smoothstep(hw-mw, hw+mw, abs(xc)+rag))*(1.-smoothstep(18., 26., yc+2.*rag));
  vec3 cave = slab()*uGlowAmt*(.03+.15*exp(-max(yc, 0.)/4.5))*(.75+.5*smoothstep(.45, 1., abs(xc)/max(hw, 1.)))+uDeep*.012;
  col = mix(col, cave, mouth);
  return mix(col, uAirCol, 1.-exp(-uAirDen*uAirDen*L*L)); }
// THE SEA'S FACE. q: place (x, z); V: unit vector to the eye; fw: what a pixel covers of the water (seaFw); body: the
// water's own colour; sw: the water's own height and slopes there. uWind (setWind): 0 slack air .. 1 a gale.
// Chop and facets in five sizes (0.12 to 3.3 m) run before the wind (it blows onto the cliff), long-crested and low in
// slack air, short, steep and quick in a gale; what a pixel cannot hold of them becomes roughness (al). THE MIRROR is the
// true grazing law, 2% head-on: looking down at thirty degrees one sees the body, only toward the horizon the sky. Where
// the mirrored line meets the cliff's face (z = 0) under its ragged top it shows THE CLIFF (cliffFace: drawn out by the
// facets into long upright streaks that wobble and break), over that the sky, the haze low down; the sun in sparks, a
// path of dashes under a low sun. The swell has a body: a back lets more of the water's own light up than a trough, and
// its slopes turn the mirror up the cliff and down it. In a gale a little white is torn off the crests (white, 0..1)
vec3 seaFace(vec2 q, vec3 V, float fw, float t, vec3 body, vec3 sw, out float white){
  const vec2 WD = vec2(.3162, -.9487), WC = vec2(.9487, .3162);
  float w = uWind, f = .3, lost = 0., lostC = 0., hgt = sw.x*.22;
  vec2 p = vec2(dot(q, WC)*mix(.4, .85, w), dot(q, WD)), sl = sw.yz, slC = vec2(0.), slF = vec2(0.);      // (slC: the two large sizes of chop; slF: the three small: the facets)
  for(int i = 0; i < 5; i++){
    float a = i < 2 ? mix(.045, .1, w)*(1.+.4*float(i)) : mix(.07, .2, w)*(1.-.22*float(i-2)), k = 1.-smoothstep(.22, .8, fw*f);
    vec3 n = vnd(p*f+vec2(float(i)*17.3, -t*mix(.4, 1.7, w)*sqrt(f)));
    vec2 ds = (WC*(n.y*.5)+WD*n.z)*(a*k); float dl = a*a*.3*(1.-k*k);
    if(i < 2){ slC += ds; lostC += dl; } else slF += ds;
    lost += dl; hgt += (n.x-.5)*a*k; f *= i == 1 ? 2.533 : (i == 0 ? 2.5 : 2.1); }
  sl += slC+slF;
  vec3 N = nrm(vec3(-sl.x, 1., -sl.y));
  float al = sqrt(lost), fz = 1.-clamp(dot(N, V)+al*.6, 0., 1.), F = .02+.98*pow(fz, 5.);
  vec3 R = reflect(-V, N); R.y = abs(R.y)+al*.5+1e-3;
  // (where the mirrored line meets the cliff's face: the headland's front, z = 0, 240 m wide, 30 to 46 m tall)
  float tc = max(q.y, 0.)/max(-R.z, 1e-3), yc = tc*R.y, xc = q.x+R.x*tc;
  float rock = step(R.z, -1e-3)*step(0., q.y)*(1.-smoothstep(30., 46., yc+5.*vn(vec2(xc*.3, 1.))))*(1.-smoothstep(90., 126., abs(xc)));
  vec3 sky = mix(mix(uAirCol*.55+uSkyCol*.35, uSkyCol*1.15, smoothstep(0., .3, R.y)), seaSky(R), uSeaK);
  // (the cliff's image is drawn out UPRIGHT: a facet throws the mirrored place far up and down the face, but the pipes are
  // upright and all alike along their length, so their image keeps its place across the face, wobbling by a part of what
  // the facet turns it: long streaks that sway and break, never a scramble)
  // THE MIRROR IS BROKEN BY THE SEA. Under a cliff nearly every flat facet mirrors the cliff; the sky comes into the
  // water by the facets TURNED UP TOWARD THE EYE (they throw the mirrored line up over the brow): of the facets in view a
  // share that grows with the share of the sky standing open over the brow from that place (a third to a half some thirty
  // metres out, few at the cliff's foot), more of them where a cat's-paw ruffles the water, fewer in the glassy lanes
  // between. They are the SMALL facets (half a metre and under) while a pixel can hold those; as they melt, the faces of
  // the larger chop that look at the eye carry the same share; and when those melt too it is an even share. The swell's
  // face toward the eye carries a little more of them than its back. They show the sky over the brow, not the cliff
  float m1 = mix(.045, .1, w), m2 = mix(.07, .2, w), vF = .576*m2*m2, vC = .888*m1*m1;      // (the spread of the small and the large slopes)
  vec2 Vh = V.xz*inversesqrt(max(dot(V.xz, V.xz), 1e-6));
  float dq = max(q.y, .5), bias = clamp(-dot(sw.yz, Vh)*4., -.3, .3);
  // (a cat's-paw is long down the wind: lanes some ten metres wide and longer than that, drifting with it)
  float ruf = smoothstep(.3, .7, vn(p*vec2(.2, .07)+vec2(5., -t*.035))*.75+vn(p*vec2(.06, .021)+vec2(1., -t*.012))*.25);
  float fS = min(clamp(1.05*(1.-.6366*atan(30./dq)), 0., .42)*(.55+.75*ruf), .5);
  float th = 1.1*(1.-2.*fS)-bias;
  float skyF = mix(smoothstep(th-.2, th+.2, -dot(slF, Vh)*inversesqrt(vF)),
    mix(smoothstep(th-.45, th+.45, -dot(slC, Vh)*inversesqrt(vC)), fS, clamp(lostC/vC, 0., 1.)), clamp((lost-lostC)/vF, 0., 1.));
  vec3 Ru = nrm(vec3(R.x, max(R.y, 44./dq*max(-R.z, .05)), R.z));
  vec3 skyU = mix(uSkyCol*1.15, seaSky(Ru), uSeaK);
  // (the streaks sway little in a glassy lane, are thrown about where the water is ruffled: torn into runs, not combed)
  // (and no two bundles of pipes sway alike)
  float t0 = min(max(q.y, 0.)/max(V.z, 1e-3), 400.), xe = q.x-V.x*t0;
  float xs = xe+clamp(R.x*tc+V.x*t0, -30., 30.)*mix(.12, .5, ruf)*(.45+1.1*h11(floor(xe/3.7+.4*sin(xe*.31))*5.1+1.));
  // (and away from the cliff's foot the swell's own chop tears them: a streak is thrown aside by the water it lies on, a
  // metre and more, differently every few metres of its length: runs and breaks, no stripe ruled down the water)
  xs += (vn(vec2(xe*.21, q.y*.42-t*.45)+3.)+.5*vn(vec2(xe*.5, q.y*1.1-t*.8)+9.)-.75)*4.2*mix(.45, 1., ruf)*smoothstep(3., 14., q.y);
  vec3 env = mix(sky, mix(cliffFace(xs, yc, tc, fw+al*tc*.12), skyU, skyF), rock);
  float e = 2./(.0067+lost);
  // (THE CLIFF STANDS ON THE WATER: where the mirror shows the cliff it is given more than the grazing law allows the sky
  // (the law's fifth power eased to its third), so that the lit cliff is seen in the water from a little above too, as an
  // eye sees it on dark water under a bright wall. This is the order's bar, not the true law, and it is by what is mirrored.
  // A facet that shows the sky keeps the true law: turned toward the eye, it lets the water's own dark colour up)
  F = mix(F, .02+.98*fz*fz*fz, rock*(1.-skyF));
  vec3 col = mix(body*(1.+2.2*hgt), env, F)+uSunCol*min(F*.01*e*pow(max(dot(N, nrm(uSunDir+V)), 0.), e), .8);      // (a crest lets a little more of the body's light up)
  // (white: where a gust lies, thin crest lines a hand to a forearm wide and a metre or two long, torn into dashes.
  // Orders 14, 16 and 17: on a gale deal seaLook takes this white out seaward of the band before the sill and lays
  // breaking crests there; at the sill and behind it this white stands whole)
  float gust = vn(p*vec2(.2, .5)+vec2(3., -t*.7)), n1 = vn(p*vec2(.45, .3)+vec2(9., -t*.39)), rdg = (.5+.5*cos(6.2832*(p.y*.7+.9*n1-t*.9)))*smoothstep(.4, .6, n1), tear = vn(p*vec2(2.3, 6.)+vec2(0., -t*2.));
  white = smoothstep(.55, 1., w)*smoothstep(.55, .8, gust)*smoothstep(.87, .97, rdg)*smoothstep(.3, .6, tear)*(1.-smoothstep(.1, .35, fw))*.85;
  return col; }
// THE WHOLE LOOK OF OPEN WATER at q (linear light, before the air). Over seaFace: THE EMERALD FROM THE SILL, a tongue of
// the cave's lit water reaching out from the mouth, brightest at the sill, dead by 19 m (in the body, and a little of it
// up through the mirror); a gale's torn white; and froth close to rock (within 9 m of the plinth and the stacks; no
// threads or flecks on open water); grey-white, under 0.8, lit by the sky and warmed by a low sun. (Order 12, by place,
// away from the mouth's own ground: the white water at the columns' feet and foam lace in fields; orders 14, 16 and
// 17: on the open water a gale's breaking crests in the stead of its rows of dashes, the two meeting by place in the
// band before the sill: see the end of seaLook)
vec3 seaLook(vec2 q, vec3 V, float fw, float t, vec3 sw){
  float tg = (1.-smoothstep(0., 19., q.y))*(1.-smoothstep(4., 8.5+.35*max(q.y, 0.), abs(q.x)))*step(-1., q.y); tg *= tg;
  // (NO RULED EDGE where the cave's water meets the sea: the emerald RUNS OUT IN TONGUES AND LACE: lanes of it a few
  // metres wide, wavering with the flow out of the mouth, torn along their length, some reaching nearly 40 m, the dark
  // sea lying in between them; so the green is on both sides of any crest that stands before the mouth)
  // (a tongue WAVERS as it runs out, thins, pales and breaks into islands: near the sill nearly all the water is green
  // with dark holes in it, far out only a few pale patches are left: never a straight ray, never a ribbon)
  float ty = max(q.y, 0.), reach = 1.-smoothstep(3., 36., ty);
  float txw = q.x+(1.6*sin(q.y*.19+t*.07)+1.1*sin(q.y*.47+1.7-t*.05)+(vn(vec2(q.y*.31-t*.06, 3.))-.5)*2.4)*smoothstep(1., 10., ty);
  float tl = vn(vec2(txw*.3, q.y*.1-t*.02)+2.)*.65+vn(vec2(txw*.8+3., q.y*.3-t*.05)+5.)*.35, tb = vn(vec2(txw*1.3+t*.05, q.y*.7-t*.09)+7.);
  float lane = smoothstep(.66-.36*reach, .84-.3*reach, tl)*(.3+.7*smoothstep(.3, .6, tb))*reach*(.4+.6*reach)
    *(1.-smoothstep(4.5, 8.5+.22*ty, abs(txw)))*step(-1., q.y);
  tg = max(tg, .7*lane);
  vec3 em = lampBody(.6)*glowZ(0.);
  // (the sill's water has depth: clouds of the lamp's light in it, darker in the hollows; and where the sun lies on it
  // the sun's own caustic lines, fine and bright, melting to their mean as a pixel grows)
  // (ORDER 11: no fine caustic LINES on the sea's tongue: seen flat across the water they were long pale curved hairs.
  // The sun's light in it is a soft dapple, a metre across, melting to its mean as a pixel grows)
  float mo = fbm2(q*.37+vec2(.03, -.06)*t+3.);
  float cn = mix(.5, 2.*smoothstep(.4, .8, vn(q*1.1+vec2(.05, -.08)*t+1.))*vn(q*2.7-vec2(.07, .04)*t+6.), 1.-smoothstep(.3, 1.2, fw));
  vec3 sunL = uSunCol*vec3(.1, .5, .3)*(.05*cn*smoothstep(-.05, .1, uSunDir.z)*smoothstep(0., .1, uSunDir.y));
  float white; vec3 col = seaFace(q, V, fw, t, mix(uSeaBody, em*(.3+1.05*mo)+sunL, tg), sw, white)+em*(tg*.16);
  vec3 fl = min(uFoamCol*.75*(uSkyCol*.7+uSunCol*(.16+.2*(1.-smoothstep(.2, .55, uSunDir.y)))), vec3(.8));
  // (ORDERS 16 TO 18: ON A GALE DEAL (the wind as handed over 0.55: a16 over 0) THE SEA'S OWN ROWS OF DASHES GO OUT
  // BY PLACE, SEAWARD: whole on the cave's own strip of water and at the sill, as they ever were (m16 is 0 there, the
  // branch is not taken and white is the one it was, to the bit); thinner across the band before the sill (m16: by
  // the water's place alone, its measure from that strip: 0 on it, 1 from 11 m off: see the end of seaLook); none
  // seaward of the band, where the breaking crests are the sea's white. On every other deal m16 is 0 on all the water.
  // THE STRIP runs from the sill's line, z = 0, a hundred metres back, 11.5 m to a side. THE MEASURE is the length
  // of (the distance outside 8 m to a side, times a factor; the distance before the sill, or behind the strip's far
  // end). The factor is exactly 0 beside the strip's whole length out to 11.5 m (both its smoothsteps are 0 there):
  // so on the strip the length is 0 and m16 is 0, not a small number. It is exactly 1 from a metre off either end
  // of the strip on, and from 18 m out: there the measure is the old one, the distance from the 8 m strip, to the
  // bit. Between, it is continuous with no step. Why 11.5 m and 18 m: at the head)
  float a16 = smoothstep(.55, 1., uWind);
  float m16 = a16 > 0. ? smoothstep(0., 11., length(vec2(max(abs(q.x)-8., 0.)*(1.-(1.-smoothstep(0., 1., max(q.y, 0.)+max(-100.-q.y, 0.)))*(1.-smoothstep(11.5, 18., abs(q.x)))), max(q.y, 0.)+max(-100.-q.y, 0.)))) : 0.;
  if(m16 > 0.) white *= 1.-m16;
  col = mix(col, fl, white);
  // (in the mouth's own slot the nearest rock is a jamb, not the headland's foot: the water of the sill is open water,
  // and its white hugs the jambs: no milk lies over the swell there)
  float sd = max(seaShore(q), min(7.8-abs(q.x), 6.)), near = 1.-smoothstep(5., 44., sd), close = 1.-smoothstep(.5, 9., sd);
  vec2 lq = q+vec2(.11, -.27)*t+sw.yz*9.+(vec2(vn(q*.21+t*.05), vn(q*.21+7.-t*.04))-.5)*4.;
  lq = vec2(lq.x*.7+lq.y*.08, lq.y);                                           // (drawn out a little along the swell's crests)
  // (ORDER 11: NO THREADS AND NO FLECKS ON THE OPEN SEA: the long threads swept across the near water like stray hairs,
  // and clots in their place lay on it like scraps of paper. The sea's white is the froth close to rock (within 9 m of
  // the plinth and the stacks) and the gale's torn crests; open water is clean)

  float froth = close*smoothstep(.45, .8, vn(lq*.9)+.4*close-.25)*.5;
  float lace = clamp(froth, 0., 1.)*.8;
  // (in the mouth's slot the sea's lace gives way to the cave's own white: there the water glows, and lace under the
  // sky's light alone would lie dark on it)
  lace *= 1.-(1.-smoothstep(-2., 9., q.y))*(1.-smoothstep(6.5, 8.5, abs(q.x)));
  // ORDER 12, BY PLACE ALONE (g12a, g12w: 0 on the mouth's own water: the wedge before the mouth that opens southward
  // from its jambs, by 0.38 m a metre at its widest, which holds all the water that lies in sight from inside the
  // cave; these grounds begin 5 m and more outside it and open by 0.42 and 0.5 m a metre; and
  // (order 13) 0 on all the water north of z = -60, as the new look on the rock is. Where they are 0 the branch below is not
  // taken and the look is the one it was, to the bit):
  // THE WHITE WATER AT THE COLUMNS' FEET, east and west of the mouth's own ground: a broken band at the rock's foot (the
  // plinth's, the stacks') that WORKS BY THE SWELL'S OWN CLOCK: as the water handed in stands high at the rock (sw.x, the
  // sea's own height there) the white reaches 5 m out, in a trough it falls back to a metre and breaks up; it lies on
  // the water, so it rides at the water's edge wherever the sea stands.
  // AND FOAM LACE (ORDER 13: BROKEN LACE, NO NET): where foam lies (dn: fields drawn out along the crests, most of the
  // water between them clear, more of them toward the plinth's surf, fewer and smaller toward the line where the
  // mouth's view begins: it thins out over 34 m and does not end on a line) it is TORN FOAM: ragged scraps a hand to
  // three metres across, no two alike (one field of five sizes, cut at a height that rises toward a field's edge so
  // that the foam breaks up there instead of fading), full of open holes of unlike size; LONG STREAKS, a hand to two
  // hands wide and metres long, lying along one family of bearings, each of its own width from place to place, broken
  // into pieces of unlike length, ragged, holed; and thin STRANDS that leave the torn foam and end. Streaks and
  // strands are the level lines of a noise drawn out along a bearing. No tile, no cell, no mesh. It drifts on the
  // water (fq: its place wanders gently; the water's slopes are not read for it: they smeared it into blades). As a
  // pixel grows past a size of it that size melts to its mean (an edge is a pixel wide by the slope the field still
  // has), and far off a field is a faint veil of its own shape. IN A GALE the open water carries the sea's own torn
  // white and this lace stays out there (by the wind as handed, uWind); the foam beside the plinth stays, thinner.
  // Under 0.8
  float zp12 = max(q.y, 0.), g12s = smoothstep(-60., -50., q.y), g12w = smoothstep(13.+.42*zp12, 19.+.42*zp12, -q.x)*g12s, g12a = max(g12w, smoothstep(22.+.5*zp12, 28.+.5*zp12, q.x)*g12s);
  if(g12a > 0.){
    float sdr = seaShore(q), am12 = mix(1., 2., smoothstep(.45, 1., uWind)), srg = smoothstep(-.18, .26, sw.x/am12);
    vec2 fq = q+vec2(.13, -.31)*t+(vec2(vn(q*.17+t*.04), vn(q*.17+7.-t*.035))-.5)*1.8;
    float fine = 1.-smoothstep(.3, 1.2, fw);
    float n1 = mix(.5, vn(fq*.55+3.)*.6+vn(fq*1.6+9.)*.4, fine);
    float rch = 1.+4.2*srg+2.*(vn(q*.3+vec2(0., t*.1))-.5), band = 1.-smoothstep(rch-1.6, rch+.8, sdr);
    float w1 = band*smoothstep(.62-.55*band, .86-.45*band, n1+.2*srg);
    float fld = vn(fq*vec2(.07, .13)+7.)*.6+vn(fq*vec2(.23, .41)+2.)*.4+.08*(srg-.5);
    float nearK = 1.-smoothstep(3., 24., sdr), thin = smoothstep(13.+.42*zp12, 47.+.42*zp12, -q.x), calm = 1.-smoothstep(.5, .9, uWind);
    float c0 = .47+.22*(1.-thin)-.1*nearK, opn = g12w*(1.-smoothstep(38., 52., q.y))*calm, shr = nearK*(1.-smoothstep(20., 30., sdr))*g12a*mix(.6, 1., calm);
    float dn = max(smoothstep(c0, c0+.2, fld)*opn, smoothstep(c0-.04, c0+.16, fld)*shr);
    float dnS = max(smoothstep(c0-.1, c0+.1, fld)*opn, smoothstep(c0-.14, c0+.06, fld)*shr);      // (streaks reach a little past the torn foam)
    float l12 = 0.;
    if(dnS > 0.){
      // (lv4, lv5, lh: how much of each size is still alive at this footprint)
      vec4 lv4 = 1.-smoothstep(.2, .6, fw*vec4(.55, 1.35, 3.3, 8.9)); float lv5 = 1.-smoothstep(.2, .6, fw*23.);
      vec3 lh = 1.-smoothstep(.2, .6, fw*vec3(2.4, 5.6, 13.));
      vec2 vq = fq+(vec2(vn(fq*vec2(.31, .53)+11.), vn(fq*vec2(.29, .47)+23.))-.5)*vec2(.7, .6);
      // (torn: the place is pulled about by a finger to a hand, so no edge is a smooth curve and no hole an oval)
      vec2 wq = vq+(vec2(vn(vq*vec2(3.1, 3.7)+41.), vn(vq*vec2(3.3, 3.5)+57.))-.5)*(.1*(1.-smoothstep(.2, .6, fw*3.6)))
        +(vec2(vn(vq*vec2(9., 11.)+3.), vn(vq*vec2(10., 9.)+29.))-.5)*(.035*(1.-smoothstep(.2, .6, fw*10.5)));
      float pw = max(fw, .012), e = max(.012, .4*fw*(dot(lv4, vec4(.15, .3, .69, 1.6))+2.53*lv5));
      float pb = .5+(vn(wq*vec2(.4, .55)+3.)-.5)*.28*lv4.x+(vn(wq*vec2(1., 1.35)+8.)-.5)*.22*lv4.y+(vn(wq*vec2(2.6, 3.3)+1.)-.5)*.21*lv4.z
        +(vn(wq*vec2(7.3, 8.9)+6.)-.5)*.18*lv4.w+(vn(wq*vec2(19., 23.)+2.)-.5)*.11*lv5;
      float pt = .54+.16*(1.-dn)+.03*(1.-nearK), body = smoothstep(pt-e, pt+e, pb)*smoothstep(0., .08, dn), rim = smoothstep(pt-.1, pt-.02, pb);
      // (open holes: one field of three sizes, and pinholes)
      float hA = .5+(vn(wq*vec2(1.7, 2.4)+31.)-.5)*.35*lh.x+(vn(wq*vec2(4.3, 5.6)+17.)-.5)*.4*lh.y+(vn(wq*vec2(11., 13.)+4.)-.5)*.25*lh.z;
      float hS = smoothstep(.6-e, .7+e, .5+(vn(wq*vec2(17., 21.)+13.)-.5)*(1.-smoothstep(.2, .6, fw*21.)))*.8;
      float tornK = body*(1.-max(smoothstep(.47-e, .52+e, hA), hS));
      // (streaks, the first two, and strands, the last two and only in the rim round torn foam: the level line of a
      // noise drawn out along a bearing rc by kf; wd: its width here; each ends where the last noise breaks it)
      float stK = 0., sdK = 0., rgL = 1.-smoothstep(.2, .6, fw*7.3), rimK = rim*(1.-body)*smoothstep(.1, .5, dn);
      for(int i = 0; i < 4; i++){
        if(i > 1 && rimK <= 0.) break;
        vec2 rc = i == 0 ? vec2(.966, .259) : (i == 1 ? vec2(.891, .454) : (i == 2 ? vec2(1., 0.) : vec2(.94, .34)));
        vec2 kf = i == 0 ? vec2(.1, .5) : (i == 1 ? vec2(.17, .75) : (i == 2 ? vec2(1.3, 2.1) : vec2(2.9, 4.3)));
        float off = i == 0 ? 60. : (i == 1 ? 90. : (i == 2 ? 0. : 40.)), wL = i == 0 ? .2 : (i == 1 ? .11 : (i == 2 ? .03 : .018));
        vec2 uL = vec2(wq.x*rc.x-wq.y*rc.y, wq.x*rc.y+wq.y*rc.x)*kf+off;
        vec3 nd = vnd(uL); float gL = length(nd.yz*kf), dL = abs(nd.x-.5)/max(gL, .03);
        float wd = wL*(.25+1.7*vn(uL*vec2(2.3, 1.3)+9.)), rg = i < 2 ? (vn(wq*vec2(6.1, 7.3)+off)-.5)*rgL*wd*2. : 0.;
        float aL = clamp((wd-dL+rg)/pw+.5, 0., 1.)*min(1., 2.*wd/pw)*smoothstep(.48, .64, vn(uL*vec2(3.7, 1.9)+5.))*smoothstep(.08, .25, gL);
        if(i < 2) stK = max(stK, aL); else sdK = max(sdK, aL);
      }
      stK *= (1.-max(smoothstep(.56-e, .62+e, hA), hS))*smoothstep(0., .4, dnS);
      l12 = mix(max(max(sdK*rimK*.7, stK*.66), tornK*.72), smoothstep(.3, .8, dn)*.12, smoothstep(.3, 1., fw))*.8;
    }
    lace = max(lace, max(g12a*w1*.95, l12));
  }
  // ORDERS 14, 16 AND 17: ON A GALE DEAL BREAKING CRESTS ARE THE SEA'S WHITE ON ALL THE OPEN WATER: one law, no second
  // law, no edge. The branch is entered by the wind as handed alone (uWind over 0.55: a16; on every other deal it is
  // not entered and nothing of this is worked). The sea's own white is rows of like dashes, a stride apart and all
  // on one bearing; on a gale deal it is gone seaward of the band before the sill (above). Here A CREST BREAKS ALONG
  // A FRONT: the downwind edge of
  // a high place of a field that runs down the wind by the world's clock (two families of unlike size and bearing,
  // each front's bearing swinging from place to place, so no two fronts lie alike or run side by side for long; a
  // front bows, wavers and turns; it stands further forward where the water handed in stands high, sw.x). It is
  // broken along its length by one field of three sizes cut once: pieces of a hand to tens of metres, unlike gaps,
  // and a piece's ends thin out. AT THE FRONT lies thick torn foam, a hand to two feet of it, its edge pulled about at
  // three sizes; DOWN THE CREST'S BACK it leaves what the lace is made of (the same torn, holed foam, lying on the
  // water in the water's own frame fq): close and bright under the front, more holes and smaller scraps the further
  // behind, gone by one to five metres. More fronts break and the white is denser as the wind rises. As a pixel grows
  // past a size, that size melts to its mean (fw: the footprint, as everywhere in this law); when a family's own size
  // melts its fronts go, and far off a faint even share is left. Under 0.8.
  // WHERE THE OPEN SEA MEETS THE CAVE'S OWN WATER THE LAW DOES NOT REACH INSIDE: the two whites meet BY PLACE IN A BAND
  // OF 11 m BEFORE THE SILL (m16: by the measure from the cave's own strip of water, which runs from the sill, z = 0,
  // 100 m back, 11.5 m to a side: 0 on the strip, 1 from 11 m off; from a metre before the sill on it is the distance
  // from the 8 m of the strip about the middle: the band lies straight across before the sill and round at the
  // jambs' feet, its level lines drawn out sideways in the last metre: no edge along open water, no wedge; on the
  // strip nothing of the law is worked: there the water is what it ever was, to the bit, rows of dashes and all).
  // ORDER 17, ACROSS THE BAND TOWARD THE SILL
  // (k17 = 1-m16: 0 seaward of the band, 1 at the sill; every term below that the band brings is k17's or m16's and
  // is nothing where k17 is 0: seaward of the band every number is order 16's): THE NEW FOAM BREAKS UP INTO SCRAPS
  // instead of thinning: the cut of the torn foam rises (by 0.24 at the sill, as k17's square: little in the band's
  // outer half, most in the last metres), so a patch opens into pieces, the pieces shrink and are gone before the
  // sill; the thick foam at a front goes with m16; A FRONT'S LEADING EDGE IS DRAWN OUT (over up to 0.8 m at the
  // sill), so the cut is highest at the edge itself and the scraps dwindle toward it: no clean line leads a patch;
  // and only in the last three metres does what is left lose strength (so that it is nothing at the strip's edge:
  // no step there). Meanwhile the rows of dashes come in toward the sill (above). The band's terms read the
  // water's place alone: not the eye, not the lens, no clock but the sea's own, no deal's number.
  // AT THE CLIFF'S FOOT AND ON THE SKERRY THE LAW DOES NOTHING OF ITS OWN: the same fronts lie on the water up to the
  // rock; the white band at the rock's foot and the lace are order 12's and 13's, by their own places, as they were
  if(m16 > 0.){
    float gw16 = 0., k17 = 1.-m16;
    vec2 fq = q+vec2(.13, -.31)*t+(vec2(vn(q*.17+t*.04), vn(q*.17+7.-t*.035))-.5)*1.8;      // (the water's own frame, as the lace has it)
    vec2 cq = vec2(dot(q, vec2(.9487, .3162)), dot(q, vec2(.3162, -.9487))-1.8*t);      // (along the crests, down the wind)
    float pw = max(fw, .012), gT = -.2+.3*(1.-a16), gust = smoothstep(gT, gT+.3, vn(cq*vec2(.025, .04)+vec2(3., 7.+.03*t)));
    float rg = (vn(fq*vec2(.8, .9)+13.)-.5)*.7*(1.-smoothstep(.2, .6, fw*.9))+(vn(fq*vec2(2.7, 3.1)+13.)-.5)*.3*(1.-smoothstep(.2, .6, fw*3.1))
      +(vn(fq*vec2(8.3, 9.1)+71.)-.5)*.1*(1.-smoothstep(.2, .6, fw*9.1));
    float thr = .5-.2*(smoothstep(-.2, .3, sw.x/mix(1., 2., smoothstep(.45, 1., uWind)))-.5), mT = .42+.2*(1.-a16), co = 0., fr = 0., far = 0.;
    for(int i = 0; i < 2; i++){
      vec2 rc = i == 0 ? vec2(.978, .208) : vec2(.961, -.276), kf = i == 0 ? vec2(.1, .2) : vec2(.2, .4); float off = i == 0 ? 13. : 71.;
      float l1 = 1.-smoothstep(.2, .6, fw*kf.y), l2 = 1.-smoothstep(.2, .6, fw*kf.y*2.1);
      if(l1 <= 0.){ far = max(far, gust); continue; }                             // (this family's own size has melted: its even share alone)
      // (a front's bearing swings from place to place, by up to some thirty degrees over twenty metres: no two run side by side for long)
      float bb = cq.y+8.*(vn(cq*vec2(.06, .045)+vec2(31.+off, 17.))-.5);
      vec2 uL = vec2(cq.x*rc.x-bb*rc.y, cq.x*rc.y+bb*rc.x)*kf+off;
      vec3 nA = vnd(uL), nB = vnd(uL*vec2(2.3, 2.1)+5.);
      vec2 gF = (nA.yz*(.6*l1)+nB.yz*vec2(2.3, 2.1)*(.4*l2))*kf; float gl = max(length(gF), .012);
      // (live: this edge of the field looks down the wind: a front; the edges that run with the wind or look back are none)
      float live = smoothstep(.1, .55, (gF.x*rc.y-gF.y*rc.x)/gl)*gust*l1; far = max(far, (1.-l1)*gust);
      if(live <= 0.) continue;
      float m = vn(cq*vec2(.045, .23)+vec2(.05*t+off, off))*.45+vn(cq*vec2(.23, .5)+vec2(off-.04*t, 3.))*.33
        +mix(.5, vn(cq*vec2(1.3, 1.9)+vec2(off, 9.)), 1.-smoothstep(.2, .6, fw*1.9))*.22, mK = smoothstep(mT, mT+.1, m);
      if(mK <= 0.) continue;
      // (d: metres behind the front, under 0 before it; hw: half the thick foam's width here)
      float d = (.5+(nA.x-.5)*.6*l1+(nB.x-.5)*.4*l2-thr)/gl+rg, hw = (i == 0 ? .17 : .1)*(.3+1.5*vn(cq*vec2(.7, .9)+off))*mK;
      float inF = clamp(d/(pw+.8*k17)+.5, 0., 1.)*live;
      co = max(co, inF*(1.-smoothstep(hw, 3.*hw, d))*min(1., 3.*hw/pw));
      fr = max(fr, inF*smoothstep(0., .5, mK)*(1.-clamp((d-2.*hw)/((i == 0 ? 3.2 : 1.6)*(.3+1.3*mK)), 0., 1.)));
    }
    co *= m16;
    if(fr > 0.){
      vec4 lv4 = 1.-smoothstep(.2, .6, fw*vec4(.55, 1.35, 3.3, 8.9)); float lv5 = 1.-smoothstep(.2, .6, fw*23.);
      vec3 lh = 1.-smoothstep(.2, .6, fw*vec3(2.4, 5.6, 13.));
      vec2 vq = fq+(vec2(vn(fq*vec2(.31, .53)+11.), vn(fq*vec2(.29, .47)+23.))-.5)*vec2(.7, .6);
      vec2 wq = vq+(vec2(vn(vq*vec2(3.1, 3.7)+41.), vn(vq*vec2(3.3, 3.5)+57.))-.5)*(.1*(1.-smoothstep(.2, .6, fw*3.6)))
        +(vec2(vn(vq*vec2(9., 11.)+3.), vn(vq*vec2(10., 9.)+29.))-.5)*(.035*(1.-smoothstep(.2, .6, fw*10.5)));
      float e = max(.012, .4*fw*(dot(lv4, vec4(.15, .3, .69, 1.6))+2.53*lv5));
      float pb = .5+(vn(wq*vec2(.4, .55)+3.)-.5)*.28*lv4.x+(vn(wq*vec2(1., 1.35)+8.)-.5)*.22*lv4.y+(vn(wq*vec2(2.6, 3.3)+1.)-.5)*.21*lv4.z
        +(vn(wq*vec2(7.3, 8.9)+6.)-.5)*.18*lv4.w+(vn(wq*vec2(19., 23.)+2.)-.5)*.11*lv5;
      // (the cut falls at the front and rises down the back: thick foam, then lace, then scraps; and it rises across
      // the band toward the sill)
      float pt = .47+.3*(1.-fr)-.2*co+.24*k17*k17, hT = .47+.04*fr+.12*co;
      float hA = .5+(vn(wq*vec2(1.7, 2.4)+31.)-.5)*.35*lh.x+(vn(wq*vec2(4.3, 5.6)+17.)-.5)*.4*lh.y+(vn(wq*vec2(11., 13.)+4.)-.5)*.25*lh.z;
      float hS = smoothstep(.6-e, .7+e, .5+(vn(wq*vec2(17., 21.)+13.)-.5)*(1.-smoothstep(.2, .6, fw*21.)))*.8;
      gw16 = smoothstep(pt-e, pt+e, pb)*(1.-max(smoothstep(hT-e, hT+.05+e, hA), hS*(1.-.6*co)))*mix(.3+.35*fr, .85, co)*smoothstep(0., .15, fr);
    }
    gw16 = max(gw16, far*.02)*smoothstep(0., .4, a16)*smoothstep(0., .15, m16);
    lace = max(lace, gw16);
  }
  return mix(col, fl, lace); }
`;

// ---------------------------------------------------------------- GLSL shared by every surface of the piece
const GLSL_COMMON = /* glsl */`
uniform float uTime, uLevel, uWetLine, uGlowAmt, uFoam, uPile, uSpout, uSea;
uniform vec4 uHump, uRect;                // uHump: z of the crest, height, half length, unused; uRect: the sheet's map (x0, z0, width, depth)
uniform vec3 uSunDir, uSunCol, uSkyCol, uMouthCol, uShaftCol, uGlowCol;
uniform vec3 uBasalt, uPink, uOchre, uBarn, uIvory, uDeep, uFoamCol, uAirCol, uSeaBody;
uniform float uAirDen, uSeaK, uWind, uLift, uFlood;
uniform sampler2D uCaus, uMap;
uniform vec3 uSeaZen, uSeaMid, uSeaHor, uSeaScat, uSeaScatDir; uniform vec4 uSeaP, uSeaQ;
const vec3 AX0 = vec3(0., 3., -81.), AXD = vec3(0., .92718, -.37461);
// THE SHAFT'S LIGHT IS THE LOOK'S OWN SKY'S (shaftCol): as handed under a high sun (blue-white by day, grey in fog, cold
// in a gale); under a LOW SUN the sky in the ring is orange and rose, and the light that falls down the blowhole is warm
// gold-white: the handed strength, the low sun's hue. shaftSky: the same as the spray and the wet film scatter it (the
// sky's, a shade colder than the shaft's own by day; under a low sun as warm as the shaft)
float shaftLow(){ return (1.-smoothstep(.2, .55, uSunDir.y))*smoothstep(-.02, .08, uSunDir.y); }
vec3 shaftCol(){ vec3 w = vec3(.3, .5, .2);
  return mix(uShaftCol, dot(uShaftCol, w)*mix(vec3(1.), uSunCol/max(dot(uSunCol, w), 1e-3), .85), shaftLow()); }
vec3 shaftSky(){ return shaftCol()*mix(vec3(.8, .93, 1.15), vec3(1.), shaftLow()); }
${SEA_GLSL}
// the same in space: a growth laid by it crosses a pipe's edges, its joints and the cracks between pipes unbroken
float h31(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1., 0., 0.)), f.x), mix(h31(i+vec3(0., 1., 0.)), h31(i+vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h31(i+vec3(0., 0., 1.)), h31(i+vec3(1., 0., 1.)), f.x), mix(h31(i+vec3(0., 1., 1.)), h31(i+vec3(1., 1., 1.)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return (.5*vn3(p)+.25*vn3(p*2.03+7.1)+.125*vn3(p*4.01+3.3))*1.0714; }
// the water's level over a place: the sheet, the travelling hump of a swell, the pile against the back wall
float levelAt(float z){ float d = (z-uHump.x)/max(uHump.z, 1.); return mix(uLevel, uSea, smoothstep(2., 20., z)) + uHump.y*exp(-d*d) + uPile*(1.-smoothstep(-86., -56., z)); }
// daylight left at a place inside (1 at the mouth, dying down the nave)
float dayAt(vec3 P){ return exp(min(P.z, 0.)*.085); }
// THE SHAFT IS THE CAVE'S SECOND GREAT LIGHT (the mouth is its first). Its light at a place inside (by place): xyz the way
// to the nearest place of the BEAM (the lit column of falling spray, from the water at the blowhole's foot to the bell's
// mouth 13 m up the axis), w its strength there: strong within some metres of the beam, a half at 15 m, a sixth at
// 30 m, a twentieth at 50 m, falling off along the nave; and the recess's jambs (the walls close to 12 m behind z = -62) stand before it: a
// place out in the choir that the straight line to the beam does not reach through that opening is in their shadow
vec4 shaftAt(vec3 P){
  vec3 L = AX0+AXD*clamp(dot(P-AX0, AXD), -2., 13.)-P; float ds = dot(L, L), k = 400./(400.+ds);
  float see = mix(1., 1.-smoothstep(5.5, 7.5, abs(P.x)*18./max(P.z+80., 18.)), smoothstep(-64., -60., P.z));
  return vec4(L*inversesqrt(max(ds, 1e-4)), k*sqrt(k)*see); }
// THE LAMP'S SHAPE INSIDE, by place: brightest over the pale sand in mid nave, sliding to deep bottle green in the shadow
// under the walls (wallD: metres to the nearest wall column) and in the choir's far corner, and steadily toward the back
float lampOpen(vec2 xz, float wallD){
  float xc = 1.2*sin(xz.y*.105+.6)+.6*sin(xz.y*.27+2.);                   // (the pale lane wanders a little down the nave, and lies in pools)
  return smoothstep(.2, 3., wallD)*(1.-.97*smoothstep(1.6, 7.2, abs(xz.x-xc)))*(.72+.28*smoothstep(.3, .62, fbm2(xz*.16+4.))); }
vec3 lampIn(float open){ return mix(slab()*.07+uDeep*.03, uGlowCol*.62, open); }
float glowIn(float z){ return uGlowAmt*mix(.3, 1., smoothstep(-90., -24., z)); }
// the caustics as LIGHT on rock and sand: curved bright filaments with soft edges and brighter knots: the tile laid twice
// (the second larger, turned, drifting against the first, both swaying), a little out of focus (sp: by how much; a wall asks
// more of it with height). Each layer is weighed by its own mean at its softness, so the light's mean is 1 at any footprint:
// as a pixel grows past a filament the net melts into an even light of the same strength
float causMean(float l){ return .0105+.045*exp(-.6*l); }
float causLight(vec2 uv, float t, float fw, float sp){
  float l0 = log2(max(fw*256., 1.)), la = l0+sp, lb = max(l0-.86, 0.)+sp;
  vec2 w = .022*vec2(sin(uv.y*7.+t*2.3), sin(uv.x*6.-t*1.9));
  vec2 ub = vec2(.8*uv.x-.6*uv.y, .6*uv.x+.8*uv.y)*.55-w*.7+t*vec2(-.019, .023)+.37;
  float a = causTap(uv+w+t*vec2(.031, .017), la)/causMean(la), b = causTap(ub, lb)/causMean(lb);
  return .5+.5*min(.5*(a+b), 13.); }
// barnacles: a fine pale speckle, cones 2 to 4 cm across, each a ring round a dark mouth; it melts to its mean before a
// pixel can pick its grid out
float barnCell(vec2 g){ vec2 gi = floor(g), gf = fract(g)-.5; float h = h21(gi), h2 = fract(h*57.31), h3 = fract(h*13.7);
  float r = .17+.28*h; vec2 o = (vec2(h2, h3)-.5)*1.9*(.5-r); float d = length(gf-o)/r;
  return (1.-smoothstep(.6, 1., d))*(.35+.65*smoothstep(.1, .45, d))*step(.42, fract(h*91.7)+.25*h); }
float speck(vec2 p, float fw){
  float a = barnCell(vec2(.8*p.x-.6*p.y, .6*p.x+.8*p.y)*38.), b = barnCell(vec2(.94*p.x+.34*p.y, -.34*p.x+.94*p.y)*23.+17.);
  return mix(.22, max(a, b*.9), 1.-smoothstep(.12, .45, fw*30.)); }
// the tide bands in true order, by height over MEAN sea level (they do not move with the water): pink coralline crust,
// barnacle belt, black tar lichen, ochre lichen where daylight reaches, pale sea-ivory above. A band's limits wander by
// noise in WORLD space (a tide line does not know where a column ends); a column nudges them by a few centimetres only.
// sc: a coordinate on the surface (metres), for the mottle inside a band. crust: how much matt crust lies here.
// kin: 0 in the open day, 1 in the cave's own light, where the bands are the palette's answer to all that green: there the
// rose and the white stand at their full value and chroma (in the sun the same crusts are dusty and dull). In there the
// growth ignores the masonry: a crust is continuous across pipes and joints with small natural gaps, thicker in the
// hollow between two pipes and thinner on a pipe's proud front (hol: 0 on the front, 1 in the hollow), and the barnacles
// are a pale grain, never a wash
float gMouthR = 1.;                    // (how much of the mouth's broad daylight a pipe's side takes here, as the round thing it is: the column shader sets it)
float gTar = 0.;                       // (how much tar lichen lies at the place tideBands was last asked about: the column shader reads it)
float gShaftR = 1.;                    // (how much of the shaft's light a pipe's side takes here, as the round thing it is: its side toward the beam lit, its side away dark: the column shader sets it)
float gCalm = 0.;                      // (1 on the tall pipes of the wall behind the pavement: there the tide bands keep to their heights, the rose a low band at the waterline: the column shader sets it)
float gNose = 1.;                      // (the share of light the hollow between two pipes leaves a pipe's flank: the column shader sets it; the shaft's light comes ALONG a wall and reaches the flank that looks at it)
void tideBands(vec3 P, vec2 sc, float seed, float D, float fw, float kin, float hol, float wear, inout vec3 alb, inout float rough, out float crust){
  float ins = step(.001, kin);
  float n = fbm2(P.xz*.21+3.)-.47, m = vn(P.xz*1.3+11.)-.5;
  // (inside, a band's limit also steps from pipe to pipe, each pipe carrying its growth up to half a metre higher or
  // lower than its neighbour, and is ragged within a pipe; clusters of barnacles bite down into the rose's upper edge)
  float y = P.y+(n*1.7+m*.35)*(1.-.7*gCalm)+(h11(seed*31.7)-.5)*mix(.06, .55, ins), bite = 0.;
  if(ins > .5 && y > -2.5 && y < 5.5){
    y += (fbm3(P*vec3(1.2, .9, 1.2)+5.)-.47)*.8*(1.-.6*gCalm)+(vn(sc*vec2(6., 1.7)+seed*3.)-.5)*.24;
    bite = smoothstep(.5, .66, vn3(P*vec3(1.9, 1.2, 1.9)+9.)); }
  float yb = y+1.2*bite;
  float pink = smoothstep(-3.7, -2.9, y)*(1.-smoothstep(.2, .75, yb));
  float barn = smoothstep(.2, .75, yb)*(1.-smoothstep(1.7, 2.4, y));
  float tar = smoothstep(1.7, 2.4, y)*(1.-smoothstep(3.6, 4.6, y));
  float Do = mix(D, max(D, smoothstep(-24., -6., P.z)), ins);              // (the ochre lichen lives up the cave's walls as far in as the day reaches: some twenty metres)
  float och = smoothstep(3.8, 4.8, y)*(1.-smoothstep(9.5, 12., y))*Do, ivo = smoothstep(9., 12.5, y)*D;
  // mottle and speckle finer than a hand; each melts to its mean as the pixel grows past it
  float f1 = 1.-smoothstep(.25, .9, fw*9.), f2 = 1.-smoothstep(.25, .9, fw*26.);
  float g0 = fbm2(sc*1.6+5.), g1 = mix(.5, vn(sc*9.+3.), f1), g2 = mix(.5, vn(sc*26.+7.), f2);
  // coralline: a dusty rose crust in ragged sheets, darker pits, a paler growing edge; bare wet rock between
  float pe = g0+.14*(g1-.5)+.06*(g2-.5);
  // (inside the growth is laid by noise in SPACE: small gaps a hand or two across, a few more of them on the proud fronts;
  // a gap is a pit in the crust, dark and matt; wear: where water pours off a broken head, and here and there on a worn
  // shoulder, the crust is scoured off and the black wet rock shows)
  float gap = .47, bnI = .5, ocI = 0.;
  if(ins > .5){
    if(pink > 0.) gap = mix(.47, fbm3(P*vec3(6.5, 5.2, 6.5)+17.), 1.-smoothstep(.1, .4, fw*6.5))+.08*(g1-.5)+.05*(g2-.5)+(hol-.5)*.07;
    if(barn > 0.) bnI = fbm3(P*1.1+2.);
    if(och > 0.) ocI = fbm3(P*.55+3.); }
  // (dark wet tracks run down it where water drains off the wall: there the crust is thin and the rock shows, wet)
  float track = ins*pink*smoothstep(.6, .76, vn(vec2(sc.x*2.4+seed*7., P.y*.1+3.))+.12*(g1-.5));
  float gapE = 1.-smoothstep(.34, .44, gap), cov = smoothstep(.25, .37, gap)*(1.-.85*wear)*(1.-.8*track);
  float pk = pink*mix(smoothstep(.36, .46, pe), cov, ins);
  float pit = pink*ins*(1.-smoothstep(.25, .37, gap))*(1.-wear)*(1.-track);
  vec3 pg = vec3(dot(uPink, vec3(.3, .5, .2)));
  // (inside its colour wanders: rose, mauve where it is old, grey-pink where it is bleached; each pipe a little its own)
  float mo = .5, mo2 = .5, cs = h11(seed*47.3);
  if(ins > .5 && pink > 0.){ mo = fbm3(P*vec3(.55, .8, .55)+31.)+(cs-.5)*.24; mo2 = vn3(P*vec3(.9, 1.3, .9)+53.); }
  vec3 roseIn = mix(mix(uPink, pg, .1), mix(uPink*vec3(.7, .68, 1.1), mix(uPink, pg, .62)*1.1, smoothstep(.4, .65, mo2)), smoothstep(.42, .6, mo))*(.82+.36*cs);
  vec3 rose = mix(mix(uPink, pg, .4)*.2, roseIn*.29*(.6+.8*fbm2(sc*1.1+9.)), kin);
  vec3 pcol = rose*(.75+.5*g1)*(1.-.55*smoothstep(.58, .78, g2));
  pcol = mix(pcol, rose*1.35+.03, mix(1.-smoothstep(.46, .53, pe), gapE, ins)*.6);
  alb = mix(alb, pcol, pk*.92)*(1.-.5*pit);
  // barnacles: a speckle at the belt's ragged margins, thickening to a crust in its middle
  float bn = fbm2(sc*.9+2.)+.22*(1.-abs(y-1.25)/1.1);
  float dn = barn*mix(smoothstep(.3, .62, bn), (.5+.5*smoothstep(.3, .6, bnI+(hol-.5)*.12))*(1.-.85*wear), ins);
  float sp = speck(sc+seed*3., fw);
  float cover = smoothstep(0., 1., dn*2.-1.+sp*1.25*step(.02, dn));
  // (inside: the belt is a grain of clusters a hand across, the wet black rock between them; it melts to a pale grey only
  // when a pixel is wider than a cluster)
  float grain = mix(.62, smoothstep(.34, .6, vn3(P*vec3(11., 9., 11.)+5.)*.55+vn(sc*27.+3.)*.45), 1.-smoothstep(.2, .8, fw*11.));
  cover *= mix(1., .4+.6*grain, ins);
  alb = mix(alb, uBarn*mix(.12+.62*sp, .7+.3*sp, max(kin, .8*ins))*(.75+.5*g1)*(.7+.6*g0), cover);
  // tar lichen: a black belt, a little rock showing through
  float tarP = tar*(.72+.28*smoothstep(.3, .55, g0));
  // (INSIDE THE TAR BELT IS NO BLACK SKIN: it lay on the walls as shapeless black blotches that swallowed the pipes. In
  // there it is a thin dark stain on wet rock that keeps its film, its edge light and the net: shade follows the form)
  gTar = tarP*(1.-.8*ins);
  alb = mix(alb, vec3(.012, .013, .015)*(1.+.8*kin)*(1.-.55*ins), tarP*(1.-.12*kin)*(1.-.5*ins));
  // ochre lichen: dull, in ragged patches that thin out upward
  float thr = .53+.04*(y-4.);
  float ochP = och*smoothstep(thr, thr+.1, mix(fbm2(sc*.5+3.), ocI, ins)+.2*(g1-.5)+.12*(g2-.5));
  vec3 dull = mix(mix(uOchre, vec3(.11, .12, .08), .7)*.16, mix(uOchre, vec3(.2, .19, .1), .3)*.34, max(kin, .9*ins))*(.65+.7*g1)*(.8+.4*g2);
  alb = mix(alb, dull, ochP*.9);
  float ivp = ivo*smoothstep(.6, .72, fbm2(sc*1.9+11.))*(.4+.6*g1)*f1;
  alb = mix(alb, uIvory*.7, ivp*.3);
  crust = max(max(max(pk*.9, cover), max(ochP, ivp*.5)), pit*.6);
  rough = mix(rough, .92, max(crust, tar*(1.-.3*kin)*(1.-.8*ins)));                // (outside the tar belt dulls the rock's gloss; in the cave it is a thin dark stain and dulls it by a fifth of that only: the wet rock under it keeps its film's sheen, its edge light and the net)
}
// THE SUN THROUGH THE MOUTH, by place: a point inside is in the sun when the straight line from it toward the sun leaves
// the cave by the mouth's slot (at z = 0: 17 m wide up to 12 m, closing to its point at 24 m; open from the water up).
// Returns the sun's share there, its edge softer the deeper in (the slot's edge is ragged pipes, and the sun has a width)
float sunIn(vec3 P){
  float sz = uSunDir.z; if(sz < .02) return 0.; if(P.z >= 0.) return 1.;
  float t = -P.z/sz, bl = .3+.014*t; vec2 h = P.xy+uSunDir.xy*t;
  float hw = max(min(8.5, min(8.5-(h.y-12.)*.42, 24.-h.y)), 0.), lv0 = levelAt(0.);
  return smoothstep(.02, .1, sz)*(1.-smoothstep(hw-bl, hw+bl, abs(h.x)))*smoothstep(lv0-bl, lv0+bl, h.y)*(1.-smoothstep(23.-bl, 24.+bl, h.y)); }
// light on a surface. indoor: 0 the cliff outside, 1 inside; chim: 1 in the blowhole. sunSh: the sun's share left by the
// neighbours. cnet: the caustic light here (mean 1). crust: matt crust (it does not carry the wet film's shine).
// Nf: the face's normal without its pits (the wet film lies smooth over them). edge: 1 on a worn shoulder or a broken end,
// 0 on a pipe's flat flank. film: the share of the film's mirror this place may draw (a face narrower than a few pixels
// draws no more of it than its share of a pixel; each drum has its own). O: the body's open side (level unit vector; zero when it has none). sky: the share of the sky
// its place sees
vec3 shade(vec3 P, vec3 N, vec3 Nf, vec3 V, vec3 alb, float rough, float wet, float indoor, float chim, float ao, float sunSh, float cnet, float crust, float edge, float film, vec3 O, float sky){
  float NV = max(dot(N, V), 0.), out_ = 1.-indoor, cave = indoor*(1.-chim);
  float D = mix(1., dayAt(P), indoor)*(1.-chim);
  float gl = mix(120., 10., rough), sAmp = mix(.03, .55, wet)*(.25+gl*.012)*(1.-.85*crust);
  float F = (.04+.96*pow(clamp(1.-NV, 0., 1.), 5.))*mix(.12, 1., wet*wet);
  vec3 R = reflect(-V, N);
  float toOpen = dot(O, O) > .25 ? max(dot(N, O), 0.) : .6;                 // a face that looks out of the rock sees the sky, or the nave
  vec3 col = vec3(0.);
  // outside: the sun; the sky from the open side and from above (a face turned to its neighbour sees little of it).
  // A low sun (under some 20 degrees) is a soft one: a flat wet flank does not flash it straight back at an eye that has
  // it behind (the film mirrors little head-on); a worn shoulder turns through every bearing and keeps its glint: under
  // a low sun the edges are gilt, the flanks slate. Under a high sun nothing is changed
  float nl = max(dot(N, uSunDir), 0.);
  vec3 H = nrm(uSunDir+V);
  float flash = max(edge, max(smoothstep(.2, .55, uSunDir.y), smoothstep(.03, .3, 1.-max(dot(V, H), 0.))));
  // (and it lights a pipe as the round thing it is, a drum as a little barrel: by the film's normal, so its light slides
  // over each drum's curve and no drum is one flat colour; the film itself gives a broad warm sheen at a grazing look)
  float lowS = 1.-smoothstep(.2, .55, uSunDir.y);
  nl = mix(nl, max(dot(Nf, uSunDir), 0.), .75*lowS);
  col += out_*uSunCol*sunSh*nl*(alb+sAmp*flash*pow(max(dot(N, H), 0.), gl));
  col += out_*uSunCol*sunSh*lowS*(1.-smoothstep(.3, .78, rough))*(1.-.85*crust)*film*min((.03+.97*pow(clamp(1.-max(dot(V, H), 0.), 0., 1.), 5.))*pow(max(dot(Nf, H), 0.), 30.)*2.2, .3);
  // THE LOW SUN'S WARMTH: wet rock that faces a low sun takes a broad sheen of the sun's own colour (not the rock's): the
  // face turned to it bronze to gold, the flank falling away into the cold shade between pipes
  // (the light of a low sun comes back off wet brown-black rock deeper than it came: sunG)
  vec3 sunG = uSunCol*mix(vec3(1.), uSunCol/max(max(uSunCol.r, uSunCol.g), max(uSunCol.b, 1e-3)), .7);
  float warm = pow(max(dot(Nf, uSunDir), 0.), 2.)*(.075+.06*wet)*(1.-.6*crust)*ao;
  col += out_*sunG*sunSh*lowS*warm;
  float skyW = mix(.2+.8*toOpen, 1., max(N.y, 0.))*(1.-.7*max(-N.y, 0.));
  col += out_*uSkyCol*alb*ao*sky*skyW*1.15;
  col += out_*F*uSkyCol*ao*wet*sky*(1.-rough)*(R.y > 0. ? .5 : .12)+out_*uSkyCol*alb*ao*sky*.3*max(-N.y, 0.);   // the wet film's sheen; under an overhang, the sea's light from below
  col += cave*uSkyCol*alb*ao*D*.14*(.3+.7*toOpen);
  // the mouth: a cold white slot. The day that comes in by it is weak beside the day outside; faces that look at it take
  // a little of it, faces turned away none
  vec3 Lm = vec3(1.5, 10., 3.)-P; float dm = dot(Lm, Lm); Lm *= inversesqrt(max(dm, 1e-4));
  // (in the throat itself the mouth's light IS the open sky's: a jamb's inner face, which the sea sees, is lit and mirrors
  // no brighter than the sky that stands before it; deeper in it is the mouth's own)
  vec3 mouthC = mix(uMouthCol, min(uMouthCol, uSkyCol*1.25), smoothstep(-9., -1., P.z));
  vec3 Im = mouthC*cave*min(.5, 820./(820.+dm));
  col += Im*alb*(max(dot(Nf, Lm)*.8+.2*dot(N, Lm), 0.)*.3+(.02+.05*toOpen)*ao);      // (by the film's normal: it slides over a pipe's curve)
  // In the first twenty metres the walls take the mouth's daylight BROADLY: a cold sheen on the wet rock that looks toward
  // the mouth, and the crusts (the ochre lichen up the walls, the rose, the white) their own colours in it
  // (it is wet dark rock in daylight, not pale stone; and in the throat itself, which the sea sees, it is held back: from
  // outside the jambs' inner faces are no brighter than the cliff)
  // (where the sun itself lies, it is the light: the sky's broad sheen from the mouth is small beside it)
  float sI = cave > 0. ? sunIn(P) : 0.;
  float day20 = exp(min(P.z, 0.)/11.)*(1.-.45*smoothstep(-7., -1., P.z)), wrapM = max(dot(Nf, Lm)*.6+.4, 0.);
  col += mouthC*cave*day20*wrapM*ao*gMouthR*((.02+.03*wet)*(1.-.6*crust)*(1.-.75*sI)+alb*.36);
  // THE SUN DOWN THE NAVE (sunIn: by place, through the mouth's slot): what it reaches is gilded: a face turned to it warm
  // gold, a wet one with the sun's own sheen, a worn shoulder with its glint; a crust takes it matt
  // (sunSh: a pipe is lit as the round thing it is, its side toward the sun, its flank dark; so the gilt is no flat coat:
  // a thin bronze sheen on the face that looks at the sun, and THE GOLD ON THE WET EDGES, the worn shoulders turned to it)
  float sIr = sI*sunSh, nS = max(dot(Nf, uSunDir), 0.);
  col += uSunCol*cave*sIr*ao*(alb*max(nS*.7+.3*dot(N, uSunDir), 0.)*1.5+sAmp*.4*max(edge, .3)*pow(max(dot(N, H), 0.), gl))
    +sunG*cave*sIr*ao*(nS*nS*nS*(.027+.033*wet)*(1.-.6*crust)+edge*wet*max(dot(N, uSunDir), 0.)*.2*(1.-.7*crust));
  // THE LIT WALL'S LIGHT COMES BACK ACROSS THE NAVE: where the sun lies on the wall across from a place (sunIn there, at
  // this depth of the cave), that wall's warm light falls on what faces it and is itself out of the sun: the noses of the
  // shaded wall's pipes take a warm sheen, their flanks stay black: the dark wall reads as pipes
  if(cave > 0. && uSunDir.z > .02){
    float xo = P.x > 0. ? -7.7 : 7.7, sB = sunIn(vec3(xo, clamp(P.y, 2.5, 9.), P.z))*(1.-sI);
    vec3 Lb = nrm(vec3(xo-P.x, 1.5, 2.));
    col += sunG*sB*ao*(16./(16.+abs(xo-P.x)))*max(dot(Nf, Lb)*.75+.25, 0.)*((.03+.05*wet)*(1.-.5*crust)+alb*.6);
  }
  // THE WET FILM'S MIRROR: where the mirrored sight line leaves the cave by the mouth's slot (16 m wide at the water, closing
  // to its point at 24 m) lies a broad cold sheen: a soft streak down the flank of each pipe that has a face turned for it,
  // broken where a drum turns a little off its neighbour. The film's roughness spreads the slot's image and thins it
  float gloss = (1.-smoothstep(.3, .78, rough))*(1.-.85*crust)*ao*film;
  vec3 Rf = reflect(-V, Nf);
  float Ff = min(.06+.94*pow(clamp(1.-max(dot(Nf, V), 0.), 0., 1.), 5.), .5);
  float tz = max(-P.z, 0.)/max(Rf.z, .03), bl = 2.5+tz*mix(.12, .36, rough);
  vec2 hp = P.xy+Rf.xy*tz;
  float hw = 8.*(1.-.8*smoothstep(8., 24., hp.y));
  // (the slot's image is brightest through its middle and low down, where the day is: so the sheen slides over a drum's
  // curve and no drum mirrors one flat light)
  float slot = step(.03, Rf.z)*(1.-smoothstep(.15*hw, hw+bl, abs(hp.x)))*smoothstep(-bl, .5*bl, hp.y)*(1.-smoothstep(5., 24.+bl, hp.y))*8./(8.+bl);
  float flank = 1.-.85*smoothstep(.5, .95, Nf.y);                          // (a top that looks up is pitted rock round its cup: dark and wet, no mirror)
  col += mouthC*cave*gloss*Ff*slot*.75*flank;
  // the shaft down the blowhole: blue-white, on the back of the cave and all the way up the chimney; a broad sheen on wet
  // rock that looks toward it
  // (ITS LIGHT ON THE ROCK, by place (shaftAt): every pipe of the recess and of the nave's walls near it has a LIT SIDE,
  // the side of its curve that looks at the beam, and a shaded side: the wall reads as round pipes, crisp, and the
  // cracks between stay black; a crust takes it matt and pale; the hanging ends of the roof over the foot take the
  // light that comes up off the lit pool on their lower faces)
  vec4 sA = shaftAt(P); vec3 Ls = sA.xyz;
  vec3 Is = shaftCol()*cave*sA.w;
  vec3 Hs = nrm(Ls+V);
  float Fs = min(.06+.94*pow(clamp(1.-max(dot(V, Hs), 0.), 0., 1.), 5.), .5);
  float nlS = max(dot(Nf, Ls), 0.), aoS = ao/max(gNose, .28)*mix(1., gNose, .3);
  vec2 dFt = P.xz-vec2(0., -80.4);
  col += shaftCol()*cave*exp(-dot(dFt, dFt)/260.)*max(-N.y, 0.)*(.03+.04*wet)*(1.-.5*crust)*ao;
  col += Is*(alb*(max(dot(N, Ls), 0.)*.9+.06*ao)*gShaftR+gloss*Fs*pow(max(dot(Nf, Hs), 0.), 14.)*1.6*flank
    +(.14+.2*wet)*nlS*sqrt(nlS)*(1.-.55*crust)*aoS*gShaftR*(1.-.7*max(N.y, 0.))
    // (round the shaft the wet back wall is lit by it AS PIPES: each takes the light on the part of its curve that looks at
    // it and falls away dark at its flanks, and the cracks between stay black: a fall of light in a dark recess, no pane)
    +(.05+.08*wet)*pow(nlS, 10.)*(1.-.6*crust)*ao*(1.-.8*max(-N.y, 0.)));       // (and the wall close round its foot stands wet and bright in it)                           // (the roof's hanging ends round the bell take it on their lower faces)
  float sAx = dot(P-AX0, AXD);
  // THE CHIMNEY HAS THREE COLOURS ON ITS ROCK, by the way a face looks. What looks UP the axis (the cupped tops of the
  // steps, wet shoulders) takes the sky through the ring in the sky's own colour, deepened: blue by day, warmed by a low
  // sun. What is turned TO the axis takes the shaft's cold blue-white. What looks DOWN (the hanging hexagon ends, the
  // undersides) takes the emerald from the water below, which climbs the lower chimney and is gone some 40 m up. And
  // near the lip the sun itself, where the straight line from a place to it clears the lip's south rim, gilds the wet
  // edges that face it
  if(chim > 0.){
    float upK = smoothstep(0., 60., sAx), lumS = dot(shaftCol(), vec3(.3, .5, .2)), lumK = max(dot(uSkyCol, vec3(.3, .5, .2)), 1e-3);
    vec3 skyR = mix(uSkyCol, uSunCol*(lumK/max(dot(uSunCol, vec3(.3, .5, .2)), 1e-3)), .85*lowS);
    skyR = max(mix(vec3(dot(skyR, vec3(.3, .5, .2))), skyR, 1.7), vec3(0.))*(lumS/lumK);
    vec3 toAx = nrm(AX0+AXD*sAx-P);
    float fUp = max(dot(Nf, AXD), 0.), fAx = max(dot(Nf, toAx), 0.), fDn = max(-dot(N, AXD), 0.);
    float kw = (.05+.09*wet)*(1.-.6*crust)*ao;
    col += chim*skyR*mix(.3, 1.15, upK)*(alb*(fUp*.6+.1)+kw*fUp*fUp*1.1);
    // (THE BELL'S MOUTH IS BRIGHT WITH THE SKY'S LIGHT: low in the bell, where the shaft's light spreads on the rock that
    // stands round it, the faces turned to the axis are lit the most of all: from the nave the bell's wall over the back
    // of the cave is a lit place in the roof)
    // IT IS DARK WET ROCK, black-blue, AND ITS FORM IS READ BY GLOSS, RIMS AND LIGHT, NOT BY A PALE COAT. A face turned to
    // the axis takes the shaft's light on its rock only (basalt: little of it comes back); the broad sheen of the film is
    // kept low in the bell alone, where the light spreads on the rock round its mouth (the lit place in the nave's roof)
    float bellK = 1.-smoothstep(11., 24., sAx);
    // (ORDER 11: THE THROAT IS A LIT WELL WITH DARK SEAMS: light comes down the chimney, and its wet walls take a little
    // of the sky's light from above, by place: most high up, falling off downward to the bell, on the part of each pipe
    // that is turned to the axis; the cracks black. The well's real light is the film's mirror of the ring, below)
    float well = smoothstep(4., 14., sAx)*(1.-.65*smoothstep(19., 31., sAx))*(1.-smoothstep(36., 50., sAx));
    col += chim*shaftSky()*mix(.45, .9, upK)*(alb*fAx*.28+kw*(pow(fAx, 1.5)*(.6*bellK+well)+well*.12*fDn));
    // THE FILM MIRRORS THE RING: where the mirrored sight line (by the film's normal, which turns round a pipe as round a
    // round thing) leaves by the chimney's ring (5.6 m about the axis, 60 m up it) it shows the sky there, in the sky's
    // own colour: one bright streak down each pipe that has the bearing for it, its flanks black; a rough film spreads it
    float tR = max(60.-sAx, 0.)/max(dot(Rf, AXD), .05); vec3 qR = P+Rf*tR-AX0; qR -= AXD*dot(qR, AXD);
    float blR = .8+tR*mix(.02, .1, rough), seeR = step(.05, dot(Rf, AXD))*(1.-smoothstep(5.6-blR, 5.6+blR, length(qR)))*5.6/(5.6+blR);
    vec3 mirC = mix(shaftSky(), skyR, smoothstep(.25, .85, dot(R, AXD)));
    // (a far pipe, a pixel or two wide, keeps the MEAN of its streak, not nothing: looked up into from under the bell the
    // high walls of the well shine with the ring's sky at their grazing angle, and the throat is lit, brightest high up)
    float glossC = (1.-smoothstep(.3, .78, rough))*(1.-.85*crust)*ao*mix(.65, 1., film);
    col += chim*mix(.3, 1.15, upK)*(mirC*(sAmp*pow(max(dot(N, nrm(AXD+V)), 0.), min(gl, 90.))*.8*film)+skyR*(glossC*Ff*seeR*1.1));
    // (the RIMS: a worn shoulder, the lip of a broken end, turn through every bearing: they carry a line of the ring's light)
    col += chim*skyR*mix(.35, 1.2, upK)*edge*wet*(1.-.7*crust)*ao*.3*max(dot(N, AXD)*.7+.3, 0.)*(1.-fDn);
    // (THE EMERALD CLIMBS THE LOWER CHIMNEY: on what looks down, the hanging hexagon ends, as the net's own figure, bright
    // lines on a green-black end, never one flat green tile; a little of it on every wet face)
    float nE = max(cnet-.5, 0.)*2.;
    col += chim*uGlowCol*(uGlowAmt*exp(-max(sAx, 0.)/20.)*(1.-smoothstep(30., 50., sAx)))*(alb*(fDn+.08)*2.+kw*(fDn*fDn*2.1*(.3+.75*nE)+.05+.3*nE*(1.-fDn)));
    // (UNDER A LOW SUN the warm light of the gilded lip and of the orange sky comes down the chimney: the wet edges and
    // tops that look up and south are gilt well down it, strongest high up: gold, emerald and black to the end)
    col += chim*sunG*shaftLow()*step(.02, uSunDir.z)*mix(.25, 1., upK)*wet*(1.-.7*crust)*ao*(edge*.7+.012)*pow(max(dot(N, vec3(0., .6, .8)), 0.), 1.5);
    float tS = (-97.2-P.z)/max(uSunDir.z, .05), lipS = step(.02, uSunDir.z)*smoothstep(57., 59.5, P.y+uSunDir.y*tS)*(1.-smoothstep(4.5, 6.5, abs(P.x+uSunDir.x*tS)));
    col += chim*sunG*lipS*(kw*(max(dot(Nf, uSunDir), 0.)*.6+edge*1.6*max(dot(N, uSunDir), 0.))+uSunCol/max(max(uSunCol.r, uSunCol.g), max(uSunCol.b, 1e-3))*alb*max(dot(N, uSunDir), 0.)*2.);
  }
  // THE EMERALD FROM BELOW IS A NET OF LIGHT ON BLACK WET ROCK: the caustic net's bright lines (its dark cells are left
  // dark: the rock between the lines is near black, with its cold gloss), strong over the lowest 8 m above the water as
  // it stands now, thinning with height to a faint net under the roof; a top that looks up takes little of it; under it
  // only a faint even wash that models the rock. Daylight thins both toward the mouth. A pale crust gives back the white
  // part of the light too, so beside the green it keeps its own colour. None of it outside the cave
  float lv = levelAt(P.z), h = max(P.y-lv, 0.), hi = smoothstep(6., 12., h);
  float Wh = .58*exp(-h/7.)+.42, Wn = .9*exp(-h/5.)+.1;
  float zone = uGlowAmt*mix(.62, 1., smoothstep(-88., -50., P.z))*mix(1., mix(.7, .45, hi), smoothstep(mix(-26., -40., hi), mix(-2., -8., hi), P.z))*(1.-.8*smoothstep(-9., -2., P.z));       // (in the mouth's throat the day drowns it: from the sea the jambs do not glow)
  vec3 Lg = nrm(vec3(-P.x*.5, lv-2.-P.y, 2.5));                          // it comes up off the water, from the cave's middle and from the mouth's side, where the water is lit
  float form = .25+.2*hi+.55*max(dot(N, Lg), 0.)+.5*max(-N.y, 0.)+.16*toOpen;       // (high up the light has come off every wall on its way: it is even)
  form = mix(form, .62, .45*crust);                                        // (a matt crust takes the light more evenly than a wet face)
  vec3 gcol = uGlowCol/1.3, gw = mix(gcol, vec3(dot(gcol, vec3(.3, .5, .2))), .1+.7*crust);
  // (the lines alone: the tile's dark cells stay dark; the net lies in pools of light that drift, strong here, faint there)
  float n0 = max(cnet-.5, 0.)*2., net = n0*smoothstep(.12, 1.1, n0)*(.55+1.*smoothstep(.25, .75, vn3(P*.12+vec3(0., uTime*.035, 0.))));
  float sunK = cave > 0. ? 1.-.6*sI : 1.;                                    // (where the sun lies the net is drowned in it)
  // (ORDER 11: IT IS A WALL OF COLUMNS, quiet but plain: the net lies LOW on it, clear and slow (whole to 2 m over the
  // water, 0.43 of itself 12 m up, three tenths far up; no blotchy pools), and each pipe is read by its EDGES' LIGHT (its worn
  // shoulders carry a line of the water's green from below and of the mouth's cold day) and by its film's gloss)
  float quietW = cave*(1.-smoothstep(-11.5, -9., P.x));
  net *= mix(1., .3+.7*exp(-max(h-2., 0.)/6.), quietW);
  col += quietW*edge*wet*(1.-.7*crust)*ao*flank*(1.-max(-N.y, 0.))*(uGlowCol*(zone*.1*Wh)+mouthC*(min(.5, 820./(820.+dm))*.14));
  float light = zone*ao*sunK*(form*Wh*mix(mix(.09, .18, hi), mix(.8, 1., hi), crust)+Wn*mix(.6, .6, crust)*(1.-.85*max(N.y, 0.))*net*(.4+.6*form));
  vec3 glow = gw*alb*light*4.6;
  // the film mirrors the lit water as well: a green sheen where the mirrored sight line goes down to the sheet (a wet face
  // seen from over its own height, an underside: the roof's hanging ends shimmer with the net), and a broad soft one
  // on each pipe's flank that stands between the eye and the water
  float run = h*length(Rf.xz)/max(-Rf.y, .02);
  glow += uGlowCol*zone*gloss*(Ff*smoothstep(.02, .3, -Rf.y)*(1.-smoothstep(8., 22., run))*.42*(.6+.4*cnet)+Wh*pow(max(dot(Nf, nrm(Lg+V)), 0.), 6.)*.06);
  // (it keeps its hue under its limit: never brighter than the water it comes from)
  glow /= 1.+dot(glow, vec3(.3, .5, .2))/mix(.4, .5, crust);              // (a soft limit: a line of the net keeps its soft flanks and its brighter knots)
  col += indoor*(1.-chim*smoothstep(14., 46., P.y))*glow;
  return col;
}
// THE SHAFT (order 10: its even halo is all but gone, .005; what shows is threads, core, mist and the bell's glow, see
// below): the daylight that falls down the blowhole lights the damp AIR in a soft column round the axis (1.5 m to its
// shoulder) that stands on the water at the back of the nave: full to 22 m up the axis, gone by 32 m (by place: the upper
// chimney's air is clear), giving way as the spout comes on. A sight line gathers its light by the length it runs through
// the column (a Gaussian across the axis: closed form), and what lies behind the column is seen through that light. It is
// air: no surface carries it, and it lies on nothing that this part does not draw
float erfA(float x){ float x2 = x*x; return sign(x)*sqrt(max(1.-exp(-x2*(1.27324+.147*x2)/(1.+.147*x2)), 0.)); }
// (the light a sight line gathers in a soft ball of lit air about M, radii r in metres: a Gaussian, closed form)
float ballAir(vec3 d, float dist, vec3 M, vec3 r){
  vec3 w = (cameraPosition-M)/r, e = d/r; float a = max(dot(e, e), 1e-5), b = dot(w, e), k = sqrt(a);
  return exp(-max(dot(w, w)-b*b/a, 0.))*.8862/k*(erfA((dist*a+b)/k)-erfA(b/k));
}
vec3 shaftAir(vec3 P, float dist){
  vec3 d = (P-cameraPosition)/max(dist, 1e-4), w0 = cameraPosition-AX0; w0 -= AXD*dot(w0, AXD); vec3 wd = d-AXD*dot(d, AXD);
  float a = max(dot(wd, wd), 1e-4), b = dot(w0, wd), c = dot(w0, w0), r2 = max(c-b*b/a, 0.), tn = clamp(-b/a, 0., dist);
  vec3 Pc = cameraPosition+d*tn;                                            // the place where the line passes nearest the axis, between the eye and what it meets
  float sc = dot(Pc-AX0, AXD);                                              // and its height up the axis
  // IT IS A SKYLIGHT FULL OF FALLING SPRAY, not a slab of light: a bright narrow CORE where the drops fall thickest, in
  // the faintest of halos; the column's girth swells and thins down its length as the spray falls (each side its own), so its
  // edges are soft and uneven; puffs and wisps of it fall (laid by that place; they melt to their mean before a pixel is
  // wider than they), and near the lens single DROPS sparkle in it. The light it scatters is the sky's: colder than the shaft's own
  // (ua: the place ACROSS the shaft where the line passes it, measured from the axis: what is laid by it falls down the axis)
  vec3 o = w0+wd*tn; float side = dot(o, cross(AXD, d)) > 0. ? 1. : -1.;
  float ua = o.x*.8-(o.y*.3746+o.z*.92718)*.6-48., fa = min(fwidth(ua)+fwidth(sc)*.1, 1.), tf = uTime;
  float g1 = .65+.7*vn(vec2(sc*.27+tf*1.2, side*4.+2.)), g2 = .55+.9*vn(vec2(sc*.5+tf*2.1, side*3.+9.));
  float vh = 5.2*g1, vc = .55*g2, kh = sqrt(a/vh), kc = sqrt(a/vc);
  float Ih = exp(-r2/vh)*.8862/kh*(erfA((dist+b/a)*kh)-erfA(b/a*kh)), Ic = exp(-r2/vc)*.8862/kc*(erfA((dist+b/a)*kc)-erfA(b/a*kc));
  float keep = 1.-smoothstep(.05, .22, fa);
  float puff = fbm2(vec2(ua*.55+.4*sin(sc*.35+tf*.6), sc*.26+tf*1.5));
  float wisp = mix(.5, vn(vec2(ua*2.6+7., sc*.42+tf*2.6)), keep);
  // (drops: short bright dashes that fall fast and wink; a hand long: only near)
  vec2 dg = vec2(ua*4.5, sc*1.7+tf*8.5), di = floor(dg), df = fract(dg)-.5; float dh = h21(di), dh2 = fract(dh*57.3);
  float drop = step(.72, dh)*(1.-smoothstep(.0, .09, length(vec2(df.x-(dh2-.5)*.7, df.y*.35))))*(.35+.65*step(.45, fract(dh*31.+tf*2.3)));
  drop = mix(.004, drop, 1.-smoothstep(.012, .05, fa))*exp(-r2/2.5);
  float col = smoothstep(-4.5, -2.5, sc)*(1.-smoothstep(22., 32., sc));
  // (the core is the spray where it is thickest, over the water: it thins upward and is gone under the bell's mouth, and
  // over that the chimney's air is thin: an eye that climbs the shaft looks through little of it)
  // (THE FALLING WATER IS SEPARATE BRIGHT THREADS, a forearm wide, a metre apart, each with its own breaks, the dark wet
  // wall seen between them; they melt to their mean as a pixel grows past them. The even veil of lit air is thin)
  float cu = ua*.77+.3, ci = floor(cu), cf = fract(cu), thA = h11(ci*7.3+1.), thW = .14+.1*h11(ci*3.1+5.);
  float thB = vn(vec2(ci*1.7, sc*.22+tf*.9)), thF = fwidth(cu);
  float thL = (1.-smoothstep(thW*.45, thW+thF, abs(cf-(.3+.4*h11(ci*5.7+2.)))))*step(.22, thA)*(.65+.55*thA);
  thL *= 1.+1.6*smoothstep(.62, .9, vn(vec2(ci*5.3+2., sc*2.2+tf*6.)));        // (the threads SPARKLE in the beam: bright runs falling down each)
  float thrd = mix(.2, thL*(.3+1.3*smoothstep(.3, .7, thB))*(.75+.5*wisp), 1.-smoothstep(.3, .8, thF));
  // (sideK, ORDER 11c: IT READS ONE THING, THE SIGHT LINE'S BEARING TO THE BLOWHOLE'S AXIS (a is the squared sine of the
  // angle between the two): a line within 15 degrees of the axis itself runs with the falling water, between the
  // threads, and meets none of it; from 25 degrees on it meets all of it. THE SHAFT IS AT FULL STRENGTH FOR EVERY SIGHT
  // LINE THAT MEETS IT FROM THE SIDE, whatever its rise, from anywhere in the nave and from the pavement, however near
  // or far the eye stands. It reads nothing of where the eye is: the factor of the eleventh part that took the fall
  // away as the eye came within 7 m of the axis is OUT (it faded a thing by the lens's own distance from it))
  float sideK = smoothstep(.067, .179, a);
  // (ORDER 11: IT IS A STRONG BEAM, the brightest thing inside after the mouth: seen from the side a soft body of lit
  // spray two metres about the axis, the bright core in it from the water up to the bell's mouth, the threads
  // sparkling in it)
  float I = col*(.005*(1.-exp(-Ih*.45))*(.5+1.*puff)+sideK*(.4*(1.-exp(-Ih*.3))*thrd*exp(-r2/9.)
    +.09*(1.-exp(-Ih*.45))*(.5+1.*puff)
    +(1.-smoothstep(6., 15., sc))*(.45*(1.-exp(-Ic*.9))*(.65+.7*wisp)*(.7+.6*puff)))+(1.-smoothstep(1.5, 7.5, sc))*.5*drop);
  // THE BELL'S MOUTH in the roof is bright with the sky's light: the spray that hangs in the bell is lit from above (a
  // soft ball of it, 4 m about the bell's place); what stands before it is seen against it
  float Ib = ballAir(d, dist, vec3(0., 14.5, -84.6), vec3(4.2, 1.7, 4.2));
  // WHERE IT MEETS THE WATER lies a low white mist (a flat cloud, 0.6 m deep, 3 m about the foot), drifting
  float Im = ballAir(d, dist, vec3(0., levelAt(-80.6)+.35, -80.6), vec3(3.3, .45, 3.));
  vec2 mq = Pc.xz*.5+vec2(tf*.21, -tf*.13);
  vec3 sky = shaftSky();
  // (THE BEAM GIVES WAY TO THE WATER, BY THE EVENT ALONE, the same for every eye wherever it stands: what shows the
  // beam is the spray that falls down the blowhole. When the surge heaps against the back wall under the bell (uPile,
  // the heap's height in metres, set by the world through setPile) the air it drives up the blowhole takes the falling
  // spray up with it: the lit spray, its core, its drops, the bell's glow and the foot's mist thin from a heap of
  // 1.7 m and are gone at 2.6 m, before the spout stands in the shaft (uSpout, as before). The light itself still
  // falls: the lit rock and the pool on the water (shaftAt) stay. The part's own stand-in breath heaps 1.4 m: there the
  // spout alone takes the beam, as before)
  float give = (1.-smoothstep(1.7, 2.6, uPile))*(1.-smoothstep(0., .3, uSpout));
  return (sky*(I+.1*sideK*(1.-exp(-Ib*.3)))+shaftCol()*(.26*(.25+.75*sideK)*(1.-exp(-Im*.55))*(.55+.9*vn(mq))))*give;
}
// THE SUN'S BEAM IN THE AIR: where the sun shines in by the mouth (sunIn) the damp air shows it faintly. A sight line
// gathers it by the length it runs through the beam: the slot taken as a soft shape (a Gaussian 8.4 m by 12 m about the
// slot's middle), carried down the cave along the sun's own way: closed form, by place and the sun's bearing
vec3 sunAir(vec3 P, float dist){
  float sz = uSunDir.z; if(sz < .02) return vec3(0.);
  vec3 d = (P-cameraPosition)/max(dist, 1e-4), C = cameraPosition;
  float t0 = C.z > 0. ? clamp(C.z/max(-d.z, 1e-4), 0., dist) : 0.;                 // (the part of the line that lies inside)
  vec2 hC = C.xy-uSunDir.xy*(C.z/sz)-vec2(0., 10.), hd = d.xy-uSunDir.xy*(d.z/sz), iv = vec2(1./35., 1./72.);
  float A = max(dot(hd*hd, iv), 1e-5), B = dot(hC*hd, iv), Cc = dot(hC*hC, iv), k = sqrt(A);
  float I = exp(-max(Cc-B*B/A, 0.))*.8862/k*(erfA((dist+B/A)*k)-erfA((t0+B/A)*k));
  return uSunCol*(.05*(1.-exp(-max(I, 0.)*.035))*smoothstep(.02, .1, sz));
}
// THE AIR between eye and thing: the scene's haze outside, a dark damp breath inside
vec3 airMix(vec3 col, vec3 P, float dist, float indoor){
  float f = 1.-exp(-uAirDen*uAirDen*dist*dist);
  vec3 air = mix(uAirCol, uGlowCol*.016+uAirCol*.02*dayAt(P), indoor);
  // the cave's own damp air stands in the way for as much of the path as lies behind the mouth's plane: the far end sinks
  // into the dark. In the mouth's throat (its first 6 m) that air is thick with spray, 0.07 a metre: seen from the sea
  // the cave behind it stays a dark slot, whatever glows in there, and it clears as the eye comes in through it
  float cz = min(cameraPosition.z, 0.), pz = min(P.z, 0.), dz = max(abs(cameraPosition.z-P.z), 1e-3);
  float inFrac = cameraPosition.z < 0. && P.z < 0. ? 1. : abs(cz-pz)/dz, thr = abs(max(cz, -6.)-max(pz, -6.))/dz;
  f = 1.-(1.-f)*exp(-dist*(inFrac*.010+thr*.07)*indoor);
  col = mix(col, air, f);
  if(indoor > 0.) col += (shaftAir(P, dist)+sunAir(P, dist))*(1.-f)*indoor;
  return col;
}
`;

// ---------------------------------------------------------------- the one column shader (near, far, roof stubs, stumps)
const COLUMN_VERT = /* glsl */`
attribute vec3 aSide; attribute vec4 iA, iB, iC0, iC1, iC2, iC3, iD, iF0, iF1;
varying vec3 vP, vWp, vN, vT; varying vec4 vF; flat varying vec4 vI, vD; varying vec3 vR; flat varying float vRec, vE, vAir;
float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
vec2 corner(float k){ k = mod(k+.5, 7.)-.5;
  return k < .5 ? iC0.xy : k < 1.5 ? iC0.zw : k < 2.5 ? iC1.xy : k < 3.5 ? iC1.zw : k < 4.5 ? iC2.xy : k < 5.5 ? iC2.zw : iC3.xy; }
void main(){
  float k = position.x, m = position.y, s = position.z, kind = aSide.z;
  // (iF1.w, order 12: how far the pipe is TAKEN to stand back (under 0) or out from its neighbours, metres, for its
  // shading alone: NO BODY IS MOVED (from inside the cave a sight line slips here and there through a hairline between
  // two wall pipes and ends on the back of the cliff's outer columns: their geometry is part of the look inside the cave))
  float y0 = iA.z, y1 = iA.w, seed = iB.x;
  float topT = mod(iB.y, 4.), botT = floor(iB.y/4.+.01);
  // three master joints: each drum sits a little off the one under it
  float mj = clamp(m, 0., 2.);
  float jy = y0+(y1-y0)*(mj+.5+(h11(seed*91.7+mj*13.1)-.5)*.6)/3.;
  float y = m < -.5 ? y0 : (m > 2.5 ? y1 : jy+s*.02);
  float drum = m < -.5 ? 0. : (m > 2.5 ? 3. : mj+(s > 0. ? 1. : 0.));
  vec2 off = (vec2(h11(seed*57.3+drum*7.7), h11(seed*23.9+drum*11.3))-.5)*.045*step(.5, drum);
  float grow = 1.+(h11(seed*77.1+drum*3.3)-.5)*.03;
  vec2 p2; vec3 N = vec3(0., 1., 0.); vec3 T = vec3(1., 0., 0.);
  vF = vec4(0.); vR = vec3(0.); vAir = -1000.;
  if(kind < .5){
    vec2 cA = corner(aSide.x), cB = corner(aSide.x+1.), d = cB-cA; float len = length(d);
    { float kf = aSide.x;      // (order 12: the height above which this side of the body looks into open air)
      vAir = kf < .5 ? iF0.x : kf < 1.5 ? iF0.y : kf < 2.5 ? iF0.z : kf < 3.5 ? iF0.w : kf < 4.5 ? iF1.x : kf < 5.5 ? iF1.y : iF1.z; }
    p2 = mix(cA, cB, aSide.y)*grow;
    if(len > 1e-4){ N = vec3(d.y, 0., -d.x)/len; T = vec3(d.x, 0., d.y)/len; }
    vF = vec4(aSide.y, len, 1., 0.); vR = vec3(p2.x, y1, p2.y);
  } else {
    bool top = kind < 3.5; float ring = top ? kind-1. : kind-4.;      // 0 rim, 1 inner, 2 centre
    float rr = ring < .5 ? 1. : (ring < 1.5 ? .6 : 0.);
    p2 = corner(k)*rr*grow;
    float ty = top ? topT : botT;
    float a = 0., b = 0.;
    if(top){ if(ty > .5 && ty < 1.5){ a = -.075; b = -.115; } else if(ty > 1.5){ a = .06; b = .09; } }
    else { if(ty > .5 && ty < 1.5){ a = -.09; b = -.14; } else if(ty > 1.5){ a = .07; b = .1; } }
    y += ring < .5 ? 0. : (ring < 1.5 ? a : b);
    N = vec3(0., top ? 1. : -1., 0.);
    vF = vec4(.5, 1., rr, top ? 1. : 2.);
    vR = vec3(p2.x, ty, p2.y);
  }
  vec3 P = vec3(iA.x+p2.x+off.x, y, iA.y+p2.y+off.y);
  vP = P; vN = N; vT = T; vI = vec4(seed, topT, iB.z, iB.w); vRec = iC3.w; vD = iD; vE = iF1.w;
  vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

const COLUMN_FRAG = /* glsl */`
${GLSL_COMMON}
// (vI, vD, vRec belong to a whole pipe: its seed and kind, its open side, its recess. They are FLAT: the same number at
// every pixel of the pipe to the last bit. Carried smoothly, a pipe's seed came out a bit's worth different at some pixels
// of a face, and on a pipe whose seed stands at the edge of a hash's step those pixels drew another pipe's tone: a stipple)
varying vec3 vP, vWp, vN, vT; varying vec4 vF; flat varying vec4 vI, vD; varying vec3 vR; flat varying float vRec, vE, vAir;
// a pipe breaks at its own heights: one cross joint somewhere in the middle half of every 0.8 m of it, so its drums are 0.4
// to 1.2 m tall and no two pipes break in step. None runs level: each is an arc, a cup or a dome across the face (xf: place
// across the face, w: the face's width)
float jointAt(float i, float seed, float xf, float w){
  return i+.5+(h11(i*7.7+seed*51.)-.5)*.68+(xf*(h11(i*7.1+seed*3.)-.5)*.34+(xf*xf-.08)*(h11(i*3.3+seed*11.)-.5)*.8)*min(w/.8, 1.); }
void main(){
  vec3 P = vP; float seed = vI.x, indoor = min(vI.z, 1.), chim = step(1.5, vI.z), outd = 1.-indoor, cave = indoor*(1.-chim);
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
  // the back of a pipe is seen only through a hairline between two others, from inside the rock: it is the dark of the rock
  // (but a stump that hangs out over the bell or the nave has no underside drawn: its top, seen from below through its
  // open foot, is drawn AS that underside: a hanging hexagon end that looks down and takes the emerald and the shaft)
  // ORDER 12, THE NEW LOOK'S GROUND OUTSIDE (nw), BY PLACE ALONE: 0 on the mouth's own ground (within 16 m east and
  // west of x = 3, the line that runs into the mouth, up to 12 m, and the mouth's own slot and jambs, within
  // 13 m of x = 0, at every height; behind z = -50 and inside the cave and the blowhole); 1 on the colonnade beyond,
  // coming in over 6 m. Where it is 0 every number below is the one it was, to the bit: each new term stands inside a
  // branch that is not taken there, and no screen derivative is taken inside one
  // AND BY WHAT STANDS BEYOND THE FACE (nwF, by place: vAir, dealt by dealRelief): a side of a pipe wears the new look
  // only above the height from which it looks into OPEN AIR (the sea or the sky beyond the cliff's foot, or the air over
  // a neighbour's broken head), coming in over 0.4 m; a head wears it; a side that looks into the rock or at a
  // neighbour, and an underside, keep the old look to the bit. From inside the cave a sight line slips here and there
  // through a hairline between two wall pipes and ends, across the rock's inside (which carries no bodies), on the
  // rock-side faces of the cliff's outer columns: those faces are part of the look inside the cave (a stack has no
  // rock behind it: all its faces look to the air)
  float nwX = smoothstep(16., 22., abs(P.x-3.));
  float nwF = vN.y < -.5 ? 0. : (vN.y < .5 ? smoothstep(vAir, vAir+.4, P.y) : 1.);
  float nw = outd*smoothstep(-60., -50., P.z)*max(nwX, smoothstep(12., 18., P.y)*smoothstep(13., 16., abs(P.x)))*nwF;
  vec4 vFq = vF;
  if(!gl_FrontFacing){
    if(vF.w > .5 && vF.w < 1.5 && indoor > .5) vFq.w = 2.;
    else if(vF.w < .5 && indoor > .5 && V.y < -.3 && P.y > 8. && length(P.xz-vec2(0., -84.)) < 14.) vFq = vec4(.5, 1., .6, 2.);      // (round the bell, looked up into from below: the inside of a hanging step)
    else { gl_FragColor = vec4(airMix(uBasalt*.02, P, dist, 1.), 1.); return; }
  }
  // FOOTPRINT FILTERS: what a pixel covers of the surface (metres), up it, across it, and across a face. Every line, joint,
  // crack and speckle below fades to the mean of its face as the pixel grows past it; nothing else is read from the eye here
  float fwY = fwidth(P.y), fwX = fwidth(P.x)+fwidth(P.z), fwP = max(fwY, fwX), fwE0 = fwidth(vFq.x);
  float along = P.x*.8+P.z*.6;
  vec3 N = nrm(vN), T = nrm(vT), O = vec3(vD.x, 0., vD.y);
  float ao = 1., sunSh = 1., pool = 0., poolR = .7, prd = 0., rimWet = 0., rimL = 0., crust = 0., dark = 0., darkJ = 0., jsh = 0., edge = 1., filmT = 0., filmL = 0., filmK = 1., turn = 0., hol = .5, wear = 0., hlK = 0., hlJ = 1., hlW = 0., lipH = 0.; vec3 hlN = vec3(0., 1., 0.);
  float hcol = h11(seed*41.3);
  float D = mix(1., dayAt(P), indoor)*(1.-chim);
  float farC = 1.-smoothstep(.07, .26, fwX);                                // a column's own tone and its faces' own turns last until it is a few pixels wide
  // (order 12: in the new look's ground a pipe keeps its own tone far off too: max(farC, 0) is farC itself)
  vec3 alb = uBasalt*.85*mix(.85, .55+.6*hcol, max(farC, .9*nw));
  // (order 12, set in the side-face branch where nw is over 0: the pipe's own round (Nr) and the way its wall looks
  // (nOx), the master joint's shadow line (nLn), the long drum's tone (nTone), a niche where a drum is gone (nNi), its
  // pale sill (nSill) and the lime under it (nDrip), the pipe's nose toward the open side (nNz), the stack it is of (nSt))
  vec3 Nr = vec3(0., 0., 1.); vec2 nOx = vec2(0., 1.);
  float nLn = 0., nTone = 1., nNi = 0., nSill = 0., nDrip = 0., nNz = 1., nSt = 0., nLace = 0.;
  float rough = .78;
  // the sand under this place (inside the sheet's map), and how far over it this point stands
  vec2 muv = (P.xz-uRect.xy)/uRect.zw;
  float inMap = step(0., muv.x)*step(muv.x, 1.)*step(0., muv.y)*step(muv.y, 1.);
  float hf = P.y-(textureLod(uMap, muv, 0.).g*16.-8.);
  vec2 sc;
  if(vFq.w < .5){
    // a side face
    sc = vec2(along, P.y);
    float e = min(vFq.x, 1.-vFq.x)*vFq.y, fwE = fwE0*vFq.y, sgn = vFq.x < .5 ? -1. : 1.;
    float eA = 1.-smoothstep(.03, .14, fwE);
    // the joint between two columns is a crack in shadow; the worn shoulder beside it turns toward the neighbour, so it is
    // lit only where that way looks at a light
    float sh = 1.-smoothstep(0., .075+fwE, e);
    N = nrm(N+T*((vFq.x-.5)*.6+sgn*sh*.6*eA));
    ao *= 1.-eA*.5*sh*sh; edge = sh*eA;
    dark = (1.-smoothstep(.006, .022+fwE*1.2, e))*eA;
    // THE HARD WET HIGHLIGHT of a worn shoulder: a narrow line just inside the crack, which the shoulder shows when its
    // own bearing (half way round to the neighbour's face) looks at a light: the mouth's cold white, the sun's gold where
    // its beam reaches, the shaft's blue-white at the back. Never thinner than its share of a pixel (then as much fainter)
    hlK = smoothstep(.012, .03, e)*(1.-smoothstep(.045, .07+fwE, e))*(1.-smoothstep(.022, .075, fwE));
    hlN = nrm(N+T*sgn*.9);
    // (and beside it a soft run of light a hand's length wide down the shoulder: the sun's gold where its beam reaches)
    hlW = smoothstep(.008, .03, e)*(1.-smoothstep(.06, .24, e))*(1.-smoothstep(.1, .3, fwE));
    // cross joints: the one under this point and the one over it, and the drum between them
    float yq = (P.y+seed*13.)/.8, ci = floor(yq), xf = vFq.x-.5;
    float jm = jointAt(ci, seed, xf, vFq.y), upj = step(jm, yq), jo = jointAt(ci+2.*upj-1., seed, xf, vFq.y);
    float id = ci+upj-1., dA = max(mix(jm, jo, upj)-yq, 0.)*.8, dB = max(yq-mix(jo, jm, upj), 0.)*.8;
    float jA = 1.-smoothstep(.02, .075, fwY), jW = 1.-smoothstep(.12, .45, fwY);      // (a joint is seen only near: gone before a pixel is a hand wide)
    // (NO RULED GRID: a joint stands anywhere in its 0.8 m, bowed and tilted, and a third of the joints are closed so
    // tight that nothing of them shows: the drums are 0.15 to 2.5 m tall, no two pipes alike)
    float cl0 = step(h11(id*5.9+seed*29.), .36), cl1 = step(h11((id+1.)*5.9+seed*29.), .36);
    float cl0b = cl0*step(h11((id-1.)*5.9+seed*29.), .36), tid = id-cl0-cl0b-cl0b*step(h11((id-2.)*5.9+seed*29.), .36);      // (drums that a closed joint parts are one drum: one tone, one turn)
    dA += cl1*9.; dB += cl0*9.;
    float hd = h11(tid*1.31+seed*97.), hd2 = h11(tid*3.7+seed*5.);
    alb *= mix(1., .86+.28*hd, jW);                                         // each drum has its own tone (a little: never a tile)
    turn = (hd2-.5)*.16*jW;                                                  // and its own slight turn (given below, where no crust lies over it): the highlight breaks at every joint
    // a third of the joints are tight and flush: a hairline. At the others one drum stands a finger proud of the other, the
    // upper or the lower: a step of light and shadow
    float kA = h11((id+1.)*5.3+seed*19.), kB = h11(id*5.3+seed*19.);
    float pA = step(.34, kA)*step(kA, .67), qA = step(.67, kA), pB = step(.34, kB)*step(kB, .67), qB = step(.67, kB);
    float wA = .03+.07*h11((id+1.)*2.1+seed*7.);
    float shA = pA*(1.-smoothstep(0., wA+fwY, dA));                         // the shadow of the proud drum above, on this one's head
    float lipA = qA*(1.-smoothstep(0., .035+fwY, dA));                      // this drum's own proud head: a ledge that takes the light from above
    float shB = qB*(1.-smoothstep(0., .03+fwY, dB));                        // the corner over the proud ledge of the drum below
    float lipB = pB*(1.-smoothstep(0., .035+fwY, dB));                      // this drum's proud foot: its under-lip looks down at the water
    jsh = jA*(.55*shA+.5*shB);
    float kN = dA < dB ? kA : kB;
    darkJ = (1.-smoothstep(.003, .012+fwY*1.2, min(dA, dB)))*jA*mix(.06, .5, h11((dA < dB ? id+1. : id)*9.1+seed*3.3))*mix(.2, 1., step(.34, kN));   // some joints gape, some are closed tight
    // (A JOINT IS A DARK GROOVE WITH A HAIR OF LIGHT ON THE LIP BELOW IT: the lip takes a little more of whatever light its
    // face has; it turns no mirror and no glint, so no joint is ever a bright rule: the gilt is the long edges')
    lipH = jA*smoothstep(.004, .014, dA)*(1.-smoothstep(.016, .04+fwY, dA));
    // (a drum is a little barrel: its head rounds up to the joint, its foot down: the film's sheen has a shape on each drum)
    filmT = (hd2-.5)*.4*jW; filmL = clamp((dB-dA)/max(dA+dB, .05), -1., 1.)*.16*jW*(1.-cl0)*(1.-cl1);
    // where the water pours off a broken head, and here and there on a worn shoulder, the crust is scoured off (vR.y: the
    // height of this pipe's head)
    // and down the tracks of the ropes that run off it, a metre or so
    float topD = vR.y-P.y;
    wear = max(1.-smoothstep(.1, .55, topD+(vn(vec2(along*4., seed*9.))-.5)*.2), sh*eA*smoothstep(.4, .62, vn3(P*vec3(2.6, 1.9, 2.6))));
    wear = max(wear, smoothstep(.5, .68, vn(P.xz*2.9+3.)+.12*(vn(vec2(along*9., P.y*2.))-.5))*(1.-smoothstep(.25, 1.7, topD)));
    // the film's mirror: a face a pixel or two wide draws no more of it than its share (fwE0: the share of the face's
    // width under one pixel), and it breaks at every cross joint: each drum mirrors by its own measure, none at the joint
    filmK = (1.-smoothstep(.2, .65, fwE0))*mix(1., (.7+.3*hd)*smoothstep(0., .05+fwY, min(dA, dB)), jW);
    hlJ = mix(.6, (.25+.75*hd2)*smoothstep(0., .06+fwY, min(dA, dB))*smoothstep(.25, .6, vn(vec2(seed*40.+sgn*3., P.y*1.1))+.25*hd), jW);
    // INSIDE, A PIPE IS A ROUND THING STANDING BEFORE ITS NEIGHBOURS: its nose (the part of it that looks out of the wall)
    // takes the light, its flanks fall away into the hollow between two pipes, which stays dark. This parts the wall's
    // light into columns for as long as a pipe is a pixel or two wide: the nave is an organ, far off too
    if(dot(O, O) > .25){
      float nose = dot(vR.xz*inversesqrt(max(dot(vR.xz, vR.xz), 1e-6)), O.xz);
      hol = (1.-smoothstep(.05, .85, nose))*(1.-.5*sh*eA);
      gNose = 1.-indoor*.72*(1.-smoothstep(-.1, .75, nose))*(1.-smoothstep(.45, 1.3, fwX)); ao *= gNose;
    }
    // a neighbour standing proud throws its shadow from the sunward edge
    float sside = dot(uSunDir, T) > 0. ? (1.-vFq.x) : vFq.x;
    float wsh = .5*(h11(seed*77.+T.x*31.+T.z*17.)-.3);
    sunSh = mix(1., smoothstep(wsh-.03, wsh+.05, sside*vFq.y), eA);
    float noseS = dot(vR.xz*inversesqrt(max(dot(vR.xz, vR.xz), 1e-6)), uSunDir.xz*inversesqrt(max(dot(uSunDir.xz, uSunDir.xz), 1e-6)));
    // (and by the mouth's daylight: a pipe's side toward the mouth is lit, its flank away from it dark: no flat panel)
    vec2 toM = vec2(1.5, 3.)-P.xz; gMouthR = mix(1., .12+.88*smoothstep(-.3, .65, dot(vR.xz*inversesqrt(max(dot(vR.xz, vR.xz), 1e-6)), toM*inversesqrt(max(dot(toM, toM), 1e-6)))), cave*(1.-smoothstep(.45, 1.3, fwX)));
    sunSh *= mix(1., smoothstep(-.35+.2*cave, .55+.2*cave, noseS), max(outd*(1.-smoothstep(.2, .55, uSunDir.y)), cave)*(1.-smoothstep(.45, 1.3, fwX)));      // (inside too, where the sun comes down the nave)
    // (and by the shaft's light: a pipe's side toward the beam is lit, its side away from it dark)
    vec2 toS = vec2(0., -80.4)-P.xz; gShaftR = mix(1., .08+.92*smoothstep(-.35, .6, dot(vR.xz*inversesqrt(max(dot(vR.xz, vR.xz), 1e-6)), toS*inversesqrt(max(dot(toS, toS), 1e-6)))), cave*(1.-smoothstep(.45, 1.3, fwX)));
    // far off a pipe is one round thing: its faces' turns melt to the way the whole body looks
    // (ORDER 12: in the new look's ground to ITS OWN ROUND, the way from its axis out through this place, far off wholly
    // and near by a half: a pipe is a pipe from thirty metres, not a board. Elsewhere, as it was, to the way its wall looks)
    if(nw > 0.){
      Nr = vec3(vR.x, 0., vR.z)*inversesqrt(max(dot(vR.xz, vR.xz), 1e-6));
      // (the way the pipe's wall looks: its open side; on a stack, out from the stack's own middle, by place)
      vec2 stC = P.x > 0. ? vec2(63., 46.) : vec2(-57., 60.), stR = P.xz-vR.xz-stC;
      nSt = 1.-step(100., dot(stR, stR));
      nOx = dot(O, O) > .25 ? O.xz : (nSt > .5 ? stR*inversesqrt(max(dot(stR, stR), 1e-4)) : vec2(0., 1.));
      nNz = dot(Nr.xz, nOx);
      // MASTER JOINTS: one somewhere in every 2.9 m of a pipe, a shadow line that lasts where the fine joints have
      // melted; the long drums between them each of its own tone and turned a little, so the gloss breaks at them. Here
      // and there (one joint in seven) THE DRUM UNDER THE JOINT IS GONE for 0.3 to 1.5 m: a dark niche with a pale sill
      float pq = (P.y+seed*41.)/2.9, pj = floor(pq), jm = pj+.5+(h11(pj*5.1+seed*61.)-.5)*.76;
      float did = pj+step(jm, pq), dj = (pq-jm)*2.9, fm = 1.-smoothstep(.35, 1.5, fwY);
      nTone = mix(1., .79+.42*h11(did*3.17+seed*83.+.5), fm);
      nLn = (1.-smoothstep(.015, .05+fwY, abs(dj)))*clamp(.12/max(fwY, 1e-3), 0., 1.);
      float nh = min(.7+.8*h11(pj*1.9+seed*7.), (jm-pj)*2.9-.1), isN = step(h11(pj*9.7+seed*23.), .14)*fm*(1.-nSt);
      nNi = isN*smoothstep(-nh-.5*fwY, -nh+.04+.5*fwY, dj)*(1.-smoothstep(-.04-.5*fwY, .5*fwY, dj));
      nSill = isN*(1.-smoothstep(.02, .1+fwY, abs(dj+nh+.07)));
      nDrip = isN*smoothstep(-nh-2.2, -nh-.1, dj)*(1.-smoothstep(-nh-.12, -nh-.02, dj));
      float tr = (h11(did*5.3+seed*31.)-.5)*.5*fm, ca = cos(tr), sa = sin(tr);
      Nr = vec3(Nr.x*ca-Nr.z*sa, 0., Nr.x*sa+Nr.z*ca);
      vec3 No = dot(O, O) > .25 ? nrm(mix(N, O, (1.-farC)*.8)) : N;
      N = nrm(mix(No, nrm(mix(N, Nr, mix(.85, .5, farC))), nw));
    } else if(dot(O, O) > .25) N = nrm(mix(N, O, (1.-farC)*.8));
  } else {
    // a broken end: a cup holding a disc of water, a dome, or a flat break
    sc = P.xz;
    vec2 rd = vR.xz; float rl = length(rd); rd = rl > 1e-4 ? rd/rl : vec2(1., 0.);
    float ty = vR.y, rad = vFq.z, up = vFq.w < 1.5 ? 1. : -1.;
    float sl = ty > .5 && ty < 1.5 ? -smoothstep(.15, .95, rad)*.55 : (ty > 1.5 ? smoothstep(.1, 1., rad)*.5 : 0.);
    N = nrm(vec3(rd.x*sl*up, up, rd.y*sl*up)+vec3(vn(P.xz*9.)-.5, 0., vn(P.xz*9.+7.)-.5)*.25);
    float tA = 1.-smoothstep(.03, .14, fwP);
    dark = smoothstep(.9, .98, rad)*tA*.7;
    rimL = up > 0. ? smoothstep(.74, .86, rad)*(1.-smoothstep(.9, .97, rad))*tA : 0.;   // the worn rim of a top
    // the cup's disc: brimming to the rim while the wet line still stands over this top, sunk back when it has drained
    float brimC = smoothstep(P.y-.5, P.y+.15, max(uWetLine, levelAt(P.z)));
    poolR = mix(.68, .93, brimC)*mix(1., .76, indoor);                        // (inside, a dark wet rim of rock frames each disc)
    prd = rad;
    if(up > 0. && ty > .5 && ty < 1.5) pool = 1.-smoothstep(poolR-.04, poolR+.04, rad);
    // inside, a flat break holds a puddle of its own: ragged, smaller, a finger deep
    if(up > 0. && ty < .5 && indoor > .5){ poolR = mix(.34, .6, vn(P.xz*.7+seed*17.))*mix(.75, 1., brimC); prd = rad+(vn(P.xz*6.+seed*5.)-.5)*.22; pool = 1.-smoothstep(poolR-.05, poolR+.05, prd); }
    alb *= .85+.3*vn(P.xz*5.+seed*9.);
    rimWet = up > 0. ? mix(.25, .8, brimC) : .1;
  }
  // the rock's own skin: pitted and mottled, its relief turning the light; all of it melts with distance
  float skin = 1.-smoothstep(.012, .09, fwP);
  vec2 gp = vec2(along, P.y)*5.5+seed*7.;
  float g0 = vn(gp)*.6+vn(gp*3.7)*.4, g1 = vn(gp+vec2(.25, 0.))*.6+vn(gp*3.7+vec2(.25, 0.))*.4, g2 = vn(gp+vec2(0., .25))*.6+vn(gp*3.7+vec2(0., .25))*.4;
  // (the wet film lies smooth over the pits; for its mirror a pipe is a round thing, so every pipe that shows the right
  // flank carries the streak, and each drum's own turn breaks it at the cross joints)
  vec3 Nf = N;
  if(vFq.w < .5){ Nf = nrm(nrm(vN)+T*((vFq.x-.5)*1.15+filmT)+vec3(0., filmL, 0.));
    if(nw > 0.){ vec3 Nfo = dot(O, O) > .25 ? nrm(mix(Nf, O, (1.-farC)*.8)) : Nf; Nf = nrm(mix(Nfo, nrm(mix(Nf, Nr, mix(.85, .5, farC))+vec3(0., filmL, 0.)), nw)); }      // (order 12: the film too follows the pipe's own round there)
    else if(dot(O, O) > .25) Nf = nrm(mix(Nf, O, (1.-farC)*.8)); }
  if(vFq.w < .5) N = nrm(N+(T*(g0-g1)+vec3(0., g0-g2, 0.))*1.5*skin);
  alb *= mix(1., .62+.76*g0, skin)*mix(1., .85+.3*vn(vec2(along, P.y)*31.+seed*7.), 1.-smoothstep(.006, .03, fwP));
  vec3 alb0 = alb;
  gCalm = vFq.w < .5 ? cave*(1.-smoothstep(-11.5, -9., P.x-vR.x))*step(6.2, vR.y) : 0.;
  tideBands(P, sc, seed, D, fwP, cave*(1.-.65*D), hol, wear, alb, rough, crust);
  // (THE TAR BELT inside is a thin dark stain over the white belt (gTar is a fifth of it there): the film, the net and
  // the hard white line are hardly dimmed by it)
  float tarK = gTar*cave;
  if(vFq.w < .5) N = nrm(N+T*turn*(1.-.85*crust));                           // a drum's own turn, where no crust lies over it
  // inside, the top of a stump is scoured: a dark wet hexagon; its crusts grow on its flanks
  float topK = vFq.w > .5 && vFq.w < 1.5 ? .85*cave : 0.;
  alb = mix(alb, alb0*.8, topK); crust *= 1.-topK; rough = mix(rough, .78, topK);
  // water: the wet line trails the highest recent level; under it the rock is soaked and a film sheets down
  // (the cliff's foot stands in the open sea: its water is the sea's, its wet line the swash's reach)
  float seaK = outd*smoothstep(9., 13., abs(P.x)+max(P.z-4., 0.));
  float lv = mix(levelAt(P.z), uSea, seaK), wl = mix(max(uWetLine, lv), uSea+1., seaK);
  float wnoise = (vn(vec2(along*1.7, 3.))-.5)*.5;
  float soak = 1.-smoothstep(wl-.15+wnoise, wl+.45+wnoise, P.y);
  // (outside: uneven from column to column and in broad patches; inside all the rock is wet alike: the green on it is the
  // water's light, never a cloud in the stone)
  float damp = mix(.4+.24*vn(vec2(along*.6, P.y*.3))+.2*(h11(seed*29.)-.5), .84+.06*(h11(seed*29.)-.5), indoor);
  // the mouth's jambs stand in the spray: wet black rock (under a low sun dark slate, its light a sheen on the film)
  float jamb = outd*(1.-smoothstep(9., 16., abs(P.x)))*(1.-smoothstep(1., 7., P.z))*(1.-smoothstep(10., 22., P.y));
  damp = max(damp, .92*jamb); alb *= 1.-.45*jamb*(1.-.7*crust);
  float band = smoothstep(lv, lv+.25, P.y)*soak;
  float streak = vn(vec2(along*7., P.y*.55+uTime*1.5))*vn(vec2(along*19.+3., P.y*.21+uTime*.8));
  float film = band*smoothstep(.16, .45, streak)*(1.-smoothstep(.05, .3, fwP));
  float wet = clamp(max(damp, soak)+rimWet+film, 0., 1.);
  alb *= mix(1., .62, soak*(1.-.7*crust));                                  // wet rock is darker; a wet crust keeps its colour
  rough = mix(rough, .26, wet*wet*(1.-.8*max(crust, .85*tarK)));
  rough = mix(rough, .1, film*(1.-crust));                                   // the film behind the falling level: glass over the rock, not paint
  rough = mix(rough, .85, smoothstep(0., .12, lv-P.y)*indoor);               // (under the sheet there is no film to mirror the mouth: the sheet does that)
  dark = max(dark, darkJ*(1.-.4*crust)); ao *= 1.-jsh*(1.-.3*crust);          // a joint breaks a crust too: a dark line across it
  alb *= 1.-.92*dark;                                                        // cracks and grooves: in shadow, never a bright line
  // ORDER 13, IN THE NEW LOOK'S GROUND (nw, by place): THE WET FOOT OF THE WALL AND OF THE STUMPS IS WET BLACK ROCK. The
  // pale belts of the tide (barnacle white, rose) lay on whole faces there, five times as light as the rock beside
  // them, and in the shade the cold turn made bright blue-green panes of them: glass boxes. From the water as it stands
  // up to some four metres over it (ragged from pipe to pipe) no crust is lighter than the wet rock under it by more
  // than a third: the belts are still there, as the rock's own darker and lighter growth, on sides and tops alike
  if(nw > 0.){
    float lz13 = nw*(1.-smoothstep(3.5, 5.5, P.y-uSea-2.*wnoise));
    alb *= mix(1., min(1., 1.3*dot(alb0, vec3(.3, .5, .2))*(1.-.92*dark)*mix(1., .62, soak)/max(dot(alb, vec3(.3, .5, .2)), 1e-4)), lz13);
  }
  // ORDER 12, THE MARKS OF HEIGHT AND OF BUILD on the colonnade outside (nw, by place), all of them the rock's own
  // colour, none a light: each long drum its own tone; A WET DARK BAND over the water, riding with the sea's level, its
  // upper edge ragged from pipe to pipe; DARK SEEP running down in long stains from the cap and the ledges; PALE LIME
  // under a free head where birds sit, on a niche's sill and in streaks under both; OCHRE LICHEN in patches under the
  // cap, from some 20 m up. A stack is wet black rock all over (the spray's)
  if(nw > 0. && vFq.w < .5){
    float headD = vR.y-P.y, freeH = step(.5, vI.y)*(1.-smoothstep(36.5, 38., vR.y))*smoothstep(4., 8., vR.y-uSea);      // (order 13: no lime on a head the sea washes, under some 4 m over the water: the plinth's stumps stood as pale blocks)
    float sA = vn(vec2(along*2.1+seed*5., P.y*.05+3.)), sB = vn(vec2(along*5.3+3., P.y*.11+seed*9.));
    float seep = smoothstep(.52, .78, sA*.65+sB*.35)*smoothstep(8., 30., P.y+10.*sA);
    float lim = smoothstep(.38, .7, vn(vec2(along*8.+seed*3., P.y*.22)));
    float pale = freeH*max((1.-smoothstep(.08, .4, headD))*.9, (1.-smoothstep(.3, 1.5+2.5*h11(seed*71.), headD))*lim);
    pale = max(pale, max(nSill, .35*nDrip*lim))*(1.-nNi);          // (order 13: the lime under a niche is a faint streaked stain: it stood as a pale block a drum long and, in the shade, as a blue-green pane)
    float och = smoothstep(20., 28., P.y+(vn(vec2(along*.3, 7.))-.5)*9.)*smoothstep(.4, .62, fbm2(sc*.4+11.)+.25*(hcol-.5));
    float wb = 1.-smoothstep(1.4, 3.4, P.y-uSea-2.4*h11(seed*19.)-2.*wnoise);
    alb *= mix(1., nTone, .9*nw*(1.-.5*wb));                       // (order 13: in the wet band a drum's own tone is held to half its spread: no wet drum is lighter than the one beside it by more than a third)
    alb *= 1.-nw*(.4*seep*(1.-.5*crust)+.45*wb*(1.-.6*crust)+.55*nNi);
    alb = mix(alb, mix(uOchre, vec3(.2, .19, .1), .3)*.3*(.7+.6*g0), .75*nw*och*(1.-nNi));
    alb = mix(alb, vec3(.34, .35, .31)*(.8+.4*g0), .6*nw*pale);
    wet = max(wet, nw*max(.9*wb, .55*nSt)); rough = mix(rough, .3, nw*max(.6*wb, .3*nSt)*(1.-.8*crust));
    crust = max(crust, .7*nw*max(och, pale));
  }
  // outside, the swash runs up the causeway's stumps and drains back, leaving lace
  float sw = uSea+.45+.4*sin(uTime*.9+along*.11)+.5*vn(vec2(along*.23, uTime*.35));
  float surf = seaK*(1.-smoothstep(sw-.15, sw+.25, P.y+.3*g0))*smoothstep(uSea-1.2, uSea-.3, P.y);
  float lace = surf*smoothstep(.42, .7, fbm2(vec2(along*.9, P.y*2.2-uTime*.6)+P.xz*.7)+.25*surf);
  alb = mix(alb, uFoamCol*.6, lace*.85); rough = mix(rough, .9, lace);
  // (ORDER 12: in the new look's ground THE WHITE WATER AT THE COLUMNS' FEET goes by the swell's own clock and rides at
  // the water's edge wherever the sea stands: its top is the sea's level (uSea) and the law's own swell at this place
  // of the rock (seaSwell) and, as a crest stands at the foot, a run of white up the stump that drains in the trough
  // behind it; broken, never a ruled band)
  if(nw > 0. && seaK > 0.){
    vec3 s12 = seaSwell(P.xz, uTime); float am12 = mix(1., 2., smoothstep(.45, 1., uWind)), srg = smoothstep(-.18, .26, s12.x/am12);
    float top12 = uSea+s12.x+.1+(.2+.9*srg*srg)*1.41*(.5+.8*vn(vec2(along*.31, uTime*.3)));
    float sf12 = (1.-smoothstep(top12-.5, top12+.15, P.y+.35*g0))*smoothstep(uSea-1.4, uSea-.4, P.y);
    nLace = nw*sf12*smoothstep(.4-.2*srg, .68-.2*srg, fbm2(vec2(along*.8, P.y*1.7-uTime*.8)+P.xz*.6)+.3*sf12);
    // (ORDER 13: A THIN BRIGHT LINE AT THE WATERLINE on a pipe's or a stump's side: where the water stands against the wet
    // black rock at this moment (the sea's level and the law's own swell at this place of the rock) a hand's breadth of
    // white, a little broken along the rock; it has its footprint filter. And the run of white up the rock is by day
    // what it is in a gale (1.41: the root of the gale's 2), so the band at the feet rises and falls as heavily)
    if(vFq.w < .5) nLace = max(nLace, nw*.8*(1.-smoothstep(.04, .1+fwY, abs(P.y-uSea-s12.x-.05)))*clamp(.14/max(fwY, 1e-3), 0., 1.)*(.45+.55*smoothstep(.25, .6, vn(vec2(along*1.7, uTime*.3)))));
    alb = mix(alb, uFoamCol*.75, nLace); rough = mix(rough, .9, nLace); crust = max(crust, .8*nLace);
  }
  // inside, where the surge piles against the back wall, a little spray lifts up the rock's foot and drains back as lace
  float spr = cave*clamp(uPile, 0., 1.5)*(1.-smoothstep(-86., -64., P.z));
  spr *= (1.-smoothstep(lv+.1, lv+.5+1.5*spr, P.y+.5*g0))*smoothstep(lv-.3, lv+.05, P.y);
  float sprL = spr*smoothstep(.42, .7, fbm2(vec2(along*1.3, P.y*1.3-uTime*1.3))+.3*spr)*(1.-smoothstep(.1, .5, fwP));
  alb = mix(alb, uFoamCol*.45, sprL*.75); rough = mix(rough, .9, sprL); crust = max(crust, sprL*.8);
  // the feet: weed-dark toward the sand, and a ground shadow where the pipe meets it (the sand darkens to meet it)
  float kn = vn(vec2(along*1.1, 23.))*1.5+vn(vec2(along*4.3, P.y*1.3))*.5;
  float weed = inMap*(1.-smoothstep(.15, 1.3+kn, hf));
  alb = mix(alb, vec3(.012, .02, .012), weed*.9);
  float touch = inMap*(1.-smoothstep(0., .5, hf));
  // the caustic net crawling on walls, roof and tops: its meshes 1.7 and 3 m, its filaments a hand to a forearm wide, a
  // little taller than wide on a wall, softer with height over the water
  float flatS = step(.6, abs(N.y));
  // ONE SCALE ON EVERY FACE, whatever way it looks: on a pipe's sides the net is laid as on a round thing: across, the
  // pipe's own girth unrolled from its nose (the way its wall looks, taken to the nearer of the four quarters), carried
  // on from pipe to pipe by the pipe's place along the wall; up, its height. On a top or an underside, by place
  vec2 Oq = dot(O, O) > .25 ? (abs(O.x) > abs(O.z) ? vec2(O.x > 0. ? 1. : -1., 0.) : vec2(0., O.z > 0. ? 1. : -1.)) : vec2(1., 0.), tQ = vec2(-Oq.y, Oq.x);
  vec2 rv = vR.xz; float rvl = length(rv); vec2 rdn = rvl > 1e-4 ? rv/rvl : Oq;
  float girth = dot(P.xz-rv, tQ)+rvl*atan(dot(rdn, tQ), dot(rdn, Oq)+1e-5);
  vec2 cuv = mix(vec2(girth, P.y-uTime*.03), P.xz, flatS)/6.;
  // (on the wall behind the pavement the net is SLOW: each pipe there, by its own place, runs it at four tenths the pace)
  float cnet = causLight(cuv, uTime*mix(.3, .12, cave*step(P.x-vR.x, -10.2)), fwP/6., .85+.06*clamp(P.y-lv, 0., 24.))*mix(1., .8+.4*g0, skin*(1.-flatS));
  // (in the flood the net quickens: a second, faster net runs over the first; a little brighter, no more: the foam on
  // the water lets less light up)
  if(uFlood > 0.) cnet = mix(cnet, causLight(cuv*1.25+.37, uTime*.75, fwP/4.8, .85+.06*clamp(P.y-lv, 0., 24.)), .6*uFlood*smoothstep(-11.5, -9., P.x))*(1.+.15*uFlood);      // (not on the quiet wall behind the pavement)
  cnet = mix(cnet, .5, .6*tarK);
  // (on the pavement's blocks the net is faint: a stump's own form reads first, its dark head, its shining cup, its crust)
  cnet = mix(cnet, .55, .6*cave*(1.-smoothstep(4.6, 6.2, vFq.w < .5 ? vR.y : P.y)));
  // outside: a pipe standing back from its neighbours is in their shadow. A prouder part of the face cuts the sun off a bay
  // (vD.zw: the tangents of how far round the sky stands open to east and west of the body's open side); the cap's brow,
  // vRec metres out over the body, throws its shadow down the pipes; and a bay sees less of the sky
  sunSh *= 1.-outd*.6*(1.-smoothstep(0., .35, h11(seed*13.7)))*farC;
  vec2 Oh = dot(O, O) > .25 ? O.xz : vec2(0., 1.);
  float sf = dot(uSunDir.xz, Oh), tanAz = dot(uSunDir.xz, vec2(Oh.y, -Oh.x))/max(sf, .03);
  float openS = smoothstep(-.3, .3, (tanAz > 0. ? vD.z : vD.w)-abs(tanAz));
  float capS = mix(1., smoothstep(-.7, .7, 37.4-vRec*uSunDir.y/max(sf, .05)-P.y), step(.05, vRec)*step(P.y, 39.));
  sunSh *= mix(1., openS*capS, outd);
  // (ORDER 12, in the new look's ground: a pipe taken to stand back (vE under 0: metres; paint) is in the shadow of the prouder
  // neighbour on the sun's side, as far across it as the sun's bearing throws it; the hollow between two pipes is dark
  // (nNz: the pipe's nose toward its open side); a niche is in the shade of the drum over it, its foot alone in the sun)
  if(nw > 0. && vFq.w < .5){
    float bk = max(-vE, 0.), across = dot(vR.xz, vec2(Oh.y, -Oh.x))*(tanAz > 0. ? 1. : -1.);
    float cst = step(.04, bk)*smoothstep(-.08, .08, across-(.5-bk*abs(tanAz)));
    sunSh *= 1.-nw*max(cst, nNi*.85);
    ao *= mix(1., (.5+.5*smoothstep(-.3, .55, nNz))*(1.-.55*nLn)*(1.-.5*nNi)*(1.-.35*smoothstep(.1, .45, bk)), nw);
  }
  float skyOpen = (vD.z/(1.+vD.z)+vD.w/(1.+vD.w))/1.72;
  float sky = mix(1., (.3+.7*skyOpen)*(1.-.8*smoothstep(1., 7., vRec)*smoothstep(16., 34., P.y)), outd);      // (a recess sees little of the sky; under the cap its pipes' upper ends die into shade)
  vec3 col = shade(P, N, Nf, V, alb, rough, wet, indoor, chim, ao*(1.-.6*dark), sunSh, cnet, crust, edge, filmK, O, sky);
  // ORDER 13, IN THE NEW LOOK'S GROUND (nw, by place): THE WET FILM'S FLAT SHEEN OF THE SKY IS A DIM COOL ONE. shade() gives
  // a wet face the sky's sheen by its flat normal, four times as strong where the mirrored sight line rises as where it
  // falls: low on the wall and on the stumps' tops, a few metres over the water, whole wet faces stood as bright panes
  // beside dark ones. Here that term is taken out again (the same numbers: what is left is never under zero) and, after
  // the shade has been turned cold below, laid back at no more than two fifths of its upper strength, eased over the
  // level look, in the sky's own colour. (THIS READS THE EYE'S BEARING as the term it replaces does: named at the head)
  vec3 sh13 = vec3(0.);
  if(nw > 0.){
    float Ry13 = reflect(-V, N).y;
    vec3 s13 = uSkyCol*((1.-indoor)*(.04+.96*pow(clamp(1.-max(dot(N, V), 0.), 0., 1.), 5.))*mix(.12, 1., wet*wet)*ao*(1.-.6*dark)*wet*sky*(1.-rough));
    col = max(col-nw*s13*(Ry13 > 0. ? .5 : .12), 0.);
    sh13 = nw*s13*mix(.1, .2, smoothstep(-.4, .4, Ry13));
  }
  // a bay is in shade, not in the dark: the day comes back into it off the sea and off the lit buttress beside it, and
  // its wet shoulders take the most of that: dark slate with wet edges (the mouth alone is black)
  col += outd*(1.-openS*capS)*alb*ao*(1.-.6*dark)*(mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3, .5, .2))), .6)*.7+uSunCol*(.03+.1*max(uSunDir.y, 0.)))*(1.+1.5*edge*wet);
  // (deep shade outside is the cold teal-black, never a flat blue: the pipes in a recess are faintly seen by their wet
  // shoulders and by the light that comes back off the sea)
  float shd = outd*(1.-openS*capS);
  col = mix(col, uDeep*(dot(col, vec3(.3, .5, .2))/max(dot(uDeep, vec3(.3, .5, .2)), 1e-4)), .5*shd)*(1.-.3*shd*(1.-skyOpen));
  // (ORDER 13, nw by place: THE COLD TURN OF THE SHADE IS THE DARK ROCK'S. What is light in the shade (lime, a crust, a wet
  // top) was turned to the teal by half in the line above and stood as a bright blue-green pane; there it takes its own colour back
  // in the sky's cool light: that turn is undone by the share its lightness has (the same numbers, worked back))
  if(nw > 0.){
    float a13 = .5*shd, L13 = dot(col, vec3(.3, .5, .2));
    vec3 un13 = (col-a13*uDeep*(L13/max(dot(uDeep, vec3(.3, .5, .2)), 1e-4)))/(1.-a13);
    col = mix(col, max(un13, 0.), nw*smoothstep(.06, .22, L13));
  }
  // NOTHING LARGE IS PURE BLACK OUTSIDE: a face the sun does not reach takes the sky's fill off the open sea before it
  // and, under a low sun, the warm light that comes back off the lit rock and the water (most by the mouth, where the
  // lit jamb stands across from it); its wet shoulders show its pipes
  float unlit = outd*(1.-sunSh*smoothstep(0., .25, dot(N, uSunDir)));
  vec3 sunGm = uSunCol*mix(vec3(1.), uSunCol/max(max(uSunCol.r, uSunCol.g), max(uSunCol.b, 1e-3)), .7);
  // (it is the wet film that gives it back, not the black rock: a broad sheen, most on what looks out to sea and up,
  // so a pipe in shade is a round wet thing)
  float seaW = .3+.7*max(dot(Nf, vec3(0., .45, .893)), 0.), lowB = (1.-smoothstep(.2, .55, uSunDir.y))*step(0., uSunDir.z);
  col += unlit*ao*(1.-.6*dark)*(1.-.5*crust)*(.4+.6*sky)*(uSkyCol*(.07+.11*wet)*seaW+sunGm*((.012+.04*jamb)*lowB*(.5+.5*seaW)));
  // ORDER 12, THE SHADE OF THE COLONNADE OUTSIDE (nw, by place) IS DARK WET BASALT DRAWN BY ITS GLOSS, never a flat
  // tone: what the sun does not reach is taken down (to six tenths on a pipe's nose, to a fifth in the hollow between
  // two pipes) and turned to the cold teal-black; and THE WET FILM MIRRORS THE SKY as on a round thing: a rib of the
  // sky's own colour on the part of each pipe whose mirror looks out over the sea, none where it looks along the wall
  // or into the rock, more at a grazing look. THIS READS THE EYE'S BEARING (V), as every mirror does; it is named at the
  // head. Nothing here is a light from below, and nothing is lighter than the sky that it mirrors
  if(nw > 0. && vFq.w < .5){
    float seam = 1.-smoothstep(-.3, .55, nNz), k12 = nw*unlit;
    // (A STACK stands alone under the whole sky and was a black cut-out: its shade takes a little of the sky's fill,
    // most on the pipes' noses that look out from its middle, and so comes to the cliff's own shade: dark, cold)
    col += k12*nSt*uSkyCol*alb*ao*(.3+.7*smoothstep(-.2, .8, nNz))*.5;
    vec3 teal = uDeep*(dot(col, vec3(.3, .5, .2))/max(dot(uDeep, vec3(.3, .5, .2)), 1e-4));
    col = mix(col, teal, k12*(.25+.45*seam)*(1.-smoothstep(.06, .22, dot(col, vec3(.3, .5, .2)))));      // (order 13: the cold turn is the dark rock's; what is light in the shade keeps its own colour)
    col *= 1.-k12*mix(.4+.4*seam, .2+.5*seam, nSt);
    vec3 Rf = reflect(-V, Nf);
    float outK = smoothstep(-.15, .55, dot(Rf.xz*inversesqrt(max(dot(Rf.xz, Rf.xz), 1e-6)), nOx));
    // (A STACK stands free: at its limb the mirrored sight line runs on past it into the open sky, so its outline and
    // each pipe's edge carry the sky's rim: THE LIT RIM, cold, the sky's own colour)
    outK = max(outK, nSt);
    float Fg = .05+.95*pow(clamp(1.-max(dot(Nf, V), 0.), 0., 1.), 3.);
    // (order 13: the rib on a soaked face is no more than a third over the rib on the damp pipe beside it: .45 to .65)
    col += nw*uSkyCol*(outK*Fg*mix(.45, .65, wet)*(1.-.8*crust)*(1.-.8*nNi)*ao*(.35+.65*sky)*mix(.45, .8, unlit));
  }
  // (order 13: the film's flat sheen, dim and cool: see above. And THE WET FOOT IS DARK: the stumps stand in the open
  // under the whole sky and their wet faces took twice the light of the pipes of the wall behind them; from the water
  // up to some four metres over it everything but the white water is taken down by three tenths, by place)
  if(nw > 0.){ col += sh13; col *= 1.-.3*nw*(1.-smoothstep(3.5, 5.5, P.y-uSea-2.*wnoise))*(1.-max(nLace, lace)); }
  // (order 12: the white on the rock is no brighter than the sea's own: under 0.8)
  if(nLace > 0.) col = mix(col, min(col, vec3(.8)), nLace);
  // (and in the mouth's throat a jamb's inner pipes, out of the sun, take the same fill from the sky that stands before
  // the mouth: no slab of black stands just inside it)
  float thro = cave*smoothstep(-13., -2., P.z);
  col += thro*ao*(1.-.6*dark)*(1.-.5*crust)*gMouthR*(uSkyCol*(.06+.1*wet)*(.3+.7*max(dot(Nf, vec3(0., .3, .954)), 0.))+sunGm*(.014*lowB));
  if((hlK > 0. || hlW > 0.) && cave > 0.){
    vec3 Lm = vec3(1.5, 10., 3.)-P; float dm = dot(Lm, Lm); Lm *= inversesqrt(max(dm, 1e-4));
    vec4 sA = shaftAt(P);
    float sI = sunIn(P);
    vec3 sunGc = uSunCol*mix(vec3(1.), uSunCol/max(max(uSunCol.r, uSunCol.g), max(uSunCol.b, 1e-3)), .7);
    col += cave*hlW*(1.-.8*crust)*(1.-dark)*wet*ao*sunGc*(sI*smoothstep(0., .6, dot(hlN, uSunDir))*.17)*(.5+.5*hlJ);
    vec3 hc = uMouthCol*(min(.5, 820./(820.+dm))*smoothstep(.1, .55, dot(hlN, Lm))*.5*(1.-sI))
      +uSunCol*(sI*smoothstep(.05, .5, dot(hlN, uSunDir))*.42)
      +shaftCol()*(sA.w*smoothstep(.1, .55, dot(hlN, sA.xyz))*.6);
    col += cave*hlK*(1.-.8*crust)*(1.-.6*tarK)*(1.-dark)*wet*ao*hc*hlJ;
  }
  col *= (1.-.8*touch)*(1.+.55*lipH*(1.-.6*crust));
  // EACH STUMP OF THE PAVEMENT IS A FORM (a low block inside: its top under 6 m): a LIGHTER TOP (the wet top takes the
  // light that stands over it: the mouth's day, the shaft's, the water's green, each by place) with its lighter worn rim
  // round the shining cup; DARK FLANKS, darker down into the gaps between stumps (a neighbour stands before them); the
  // crusts at its foot, the rose and the white, keep their light: the belts stay plain
  float stK = cave*(1.-smoothstep(4.6, 6.2, vFq.w < .5 ? vR.y : P.y));
  if(stK > 0.){
    if(vFq.w < .5){ float dT = vR.y-P.y; col *= 1.-stK*(.25+.4*smoothstep(.15, 1.3, dT))*(1.-.85*crust); col *= 1.+stK*.35*crust; }
    else if(vFq.w < 1.5){
      vec3 Lmt = vec3(1.5, 10., 3.)-P; float mIt = min(.5, 820./(820.+dot(Lmt, Lmt)));
      vec3 over = uMouthCol*mIt*.05+shaftCol()*shaftAt(P).w*.09+uGlowCol*uGlowAmt*.02+uSunCol*sunIn(P)*.05;
      col += stK*over*(1.-pool)*(1.-.6*dark)*(.6+.4*g0+.9*rimL);
    }
    // (THE DRAIN'S WHITE WATER is the ribbons' alone (RUNOFF): one fall where the water gathers and leaves a top. Nothing is
    // drawn on a flank: between falls it is dark wet rock with its gloss. Order 10's cords down every face read as a comb
    // of stripes and are gone)
  }
  // the cup's disc of water: it mirrors the sky outside; inside, the dark roof and the mouth's white slot
  if(pool > 0.){
    vec3 Nw = nrm(vec3((vn(P.xz*23.+uTime*.7)-.5)*.1, 1., (vn(P.xz*23.+5.-uTime*.6)-.5)*.1));
    float Fw = .03+.97*pow(clamp(1.-max(dot(Nw, V), 0.), 0., 1.), 5.);
    vec3 Rw = reflect(-V, Nw);
    vec3 Lm = vec3(1.5, 10., 3.)-P; float dm = dot(Lm, Lm), mI = min(.5, 820./(820.+dm)); Lm *= inversesqrt(max(dm, 1e-4));
    float slot = pow(max(dot(Rw, Lm), 0.), 24.);                              // the mouth is wide: its image fills a cup that looks toward it
    vec3 mirror = uSkyCol*outd*1.5+cave*(uGlowCol*uGlowAmt*.14+uMouthCol*mI*.5)+chim*mix(shaftCol(), uSkyCol*(dot(shaftCol(), vec3(.3, .5, .2))/max(dot(uSkyCol, vec3(.3, .5, .2)), 1e-3)), .6)*.9;     // (inside: the green-lit hall over it, and the mouth's day; in the chimney the sky in the ring, in its own colour)
    vec3 wc = mix(col*.25, mirror, clamp(Fw*1.4+.55, 0., 1.));
    wc += uMouthCol*cave*mI*slot*(.35+.65*Fw)*1.6+uSunCol*outd*pow(max(dot(Nw, nrm(uSunDir+V)), 0.), 300.)*2.;
    wc += (uMouthCol*cave*mI*.4+uSkyCol*outd*.5+uGlowCol*uGlowAmt*cave*.2)*(1.-smoothstep(0., .07, abs(prd-poolR)));   // the meniscus
    // (ORDER 13, nw by place: A CUP OUTSIDE HOLDS DARK WATER WITH A DIM COOL SHEEN. Its disc gave back the sky at one and a
    // half times the sky's own light from every bearing: a pane of bright glass on each stump. In the new look's ground
    // it is dark water over the rock, the sky in it at half and by the look's slant alone, the sun's point, a thin rim)
    if(nw > 0.) wc = mix(wc, mix(col*.25, uSkyCol*.5, clamp(Fw*1.2+.1, 0., 1.))+uSunCol*(pow(max(dot(Nw, nrm(uSunDir+V)), 0.), 300.)*2.)
      +uSkyCol*(.2*(1.-smoothstep(0., .07, abs(prd-poolR)))), nw);
    col = mix(col*(1.-.45*smoothstep(poolR, poolR+.12, prd)*(1.-smoothstep(.86, .97, vFq.z))), wc, pool);      // the cup's wall is in its own shade
  }
  // the wet rim of a top takes the light that comes up off the water, and the mouth's
  if(rimL > 0.){
    vec3 Lm2 = vec3(1.5, 10., 3.)-P; float mI2 = min(.5, 820./(820.+dot(Lm2, Lm2)));
    col += rimL*(1.-pool)*cave*smoothstep(0., .15, P.y-lv)*(uGlowCol*uGlowAmt*.16*exp(-max(P.y-lv, 0.)/5.)+uMouthCol*mI2*.1);
  }
  // under the sheet: the rock keeps its own detail; the water takes the red out of its light with depth, and stands between
  // it and the eye (THE WATER PATH: the length of the sight line under the sheet, from the eye's height and bearing)
  float depth = lv-P.y;
  if(depth > 0.){
    vec3 ext = exp(-depth*vec3(mix(.26, .2, indoor), .05, .08));
    float pl = min(cameraPosition.y > lv ? depth/max(V.y, .15) : dist, dist);
    float gz = mix(uGlowAmt*mix(1., .5, (1.-smoothstep(-85., -20., P.z)))*mix(.25, 1., exp(-length(P.xz)/9.)), glowIn(P.z), indoor);
    vec3 wcol = mix(slab()*mix(.3, .36, indoor), uDeep*.3, clamp(depth*.14, 0., 1.))*gz;
    // (INSIDE THE WATER IS DEEP AND STIRRED: a drowned pipe is gone into the water's own emerald, the colour the sheet
    // has under a wall, within a metre and a half of water on the sight line; within half a metre in the flood)
    wcol = mix(wcol, lampIn(.1)*glowIn(P.z), cave);
    col = mix(wcol, col*ext, exp(-pl*mix(mix(.1, .08, indoor), mix(1.5, 5., uFlood), cave)));
  }
  gl_FragColor = vec4(airMix(col, P, dist, indoor), 1.);
}`;


// ---------------------------------------------------------------- the ground: cap (entablature, turf, the slumped sides), plinth, sand floor: one mesh
// aK: x = kind (0 cap face and slumped sides, 1 turf top, 2 plinth, 3 sand), y = metres along the face, z = indoor
async function buildGround(ctx, F, S, L) {
  const pos = [], kd = [], idx = [], tv = [], planks = [];      // (tv, order 12: how far up the cap's face a vertex stands, 0 at its foot to 1 at the brow and on the top; 0 elsewhere)
  const browRows = [[], [], []];        // the brow: the face's last row, the edge, the first row of the top (for the grass fringe)
  const n2 = S.n2;
  const lipDip = F.lipDip;
  // --- cap: rows up the face, then rows in over the top to a centre
  const NA = 220, NS = 16, NT = 22, CZ = HCZ - F.FRONT_SHIFT;
  const ring = [];
  let arc = 0, lx = 0, lz = 0;
  for (let a = 0; a <= NA; a++) {
    const th = (a / NA) * Math.PI * 2, sn = Math.sin(th), cs = Math.cos(th);
    const R0 = Math.pow(Math.pow(Math.abs(sn) / HX, 6) + Math.pow(Math.abs(cs) / HZ, 6), -1 / 6);
    const R = R0 * (1 - F.roughAt(sn * R0, HCZ + cs * R0));                // the face as the columns' roughened footprint draws it
    const bx = sn * R, bz = CZ + cs * R;
    if (a > 0) arc += Math.hypot(bx - lx, bz - lz); lx = bx; lz = bz;
    ring.push({ bx, bz, sn, cs, arc });
  }
  for (let a = 0; a <= NA; a++) {
    const q = ring[a], p = ring[(a + NA - 1) % NA], nx2 = ring[(a + 1) % NA];
    let ox = nx2.bz - p.bz, oz = -(nx2.bx - p.bx); const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
    if (ox * q.sn + oz * q.cs < 0) { ox = -ox; oz = -oz; }
    q.ox = ox; q.oz = oz;
    // the plan here: the cap is broken away over a notch (set back, its brow slumped), and hangs out over a bay
    const fr = 1 - sstep(-40, -54, q.bz), u = F.uAt(q.bx, q.bz);
    q.nt = F.notchAt(u) * F.frontK(q.bz) * fr; q.bay = F.bayAt(u) * F.frontK(q.bz) * fr;
    q.dip = (3.8 * q.nt + 1.2 * (0.5 + 0.5 * n2(q.arc * 0.013 + S.o2, 3.3))) * fr;
  }
  const arcLen = ring[NA].arc;
  for (let v = 0; v <= NS + NT; v++) {
    for (let a = 0; a <= NA; a++) {
      const q = ring[a], aw = a % NA, qa = ring[aw];
      let x, y, z, kind;
      const side = sstep(-40, -54, qa.bz);                               // 0 on the front, 1 where the cap slumps to the sea
      if (v <= NS) {
        // row 0 is the soffit's inner edge (the cap's underside runs back into the rock), row 1 the foot, row NS the brow
        const t = Math.max(0, (v - 1) / (NS - 1)), fr = 1 - side;
        const yb = lerp(CAP_BASE - 1.2 + 2.8 * n2(qa.arc * 0.021 + S.o3, 2.2) + 1.2 * n2(qa.arc * 0.09, 5.5 + S.o1), -5.5, side), yt = F.topAt(qa.bx, qa.bz) - qa.dip;
        y = lerp(yb, yt, Math.pow(t, lerp(1, 0.8, side)));
        const rough = 1.3 * n2(qa.arc * 0.07 + S.o1, y * 0.11) + 0.5 * n2(qa.arc * 0.23, y * 0.3 + S.o2) + (0.5 + 0.9 * side) * n2(qa.arc * 0.4 + S.o2, y * 0.025);
        // the front's foot stands back behind the colonnade's stepped tops (less over a bay: there it overhangs) and swells out to the brow
        let out = 1.0 + rough * (0.3 + 0.7 * side) + side * 7 * (1 - t) * (1 - t) + 0.9 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * fr * (1 - qa.nt) - 1.6 * sstep(0.86, 1, t) - (4.2 - 2.2 * qa.bay) * fr * (1 - qa.nt) * (1 - sstep(0, 0.2, t)) - NOTCHB * qa.nt;
        if (v === 0) { out -= 9.5 * fr + 0.5; y += 1.2 * fr; }
        x = qa.bx + qa.ox * out; z = qa.bz + qa.oz * out; kind = t > 0.97 ? 1 : 0;
      } else {
        const t = Math.pow((v - NS) / NT, 1.35), back = 0.6 + NOTCHB * qa.nt;
        x = lerp(qa.bx - qa.ox * back, 0, t); z = lerp(qa.bz - qa.oz * back, CZ - 3, t);
        y = F.topAt(x, z) - lipDip(x, z) + 0.5 * n2(x * 0.05 + S.o3, z * 0.05) + 0.18 * n2(x * 0.3, z * 0.3) + 0.5 * sstep(0, 0.15, t) - qa.dip * (1 - sstep(0, 0.1, t));
        kind = 1;
      }
      pos.push(x, y, z); kd.push(kind, q.arc, 0); tv.push(v <= NS ? Math.max(0, (v - 1) / (NS - 1)) : 1);
      if (v >= NS - 1 && v <= NS + 1 && a < NA) browRows[v - NS + 1].push([x, y, z, qa.ox, qa.oz, side]);
    }
    if (v % 4 === 3) await ctx.yield();
  }
  const W1 = NA + 1;
  for (let v = 0; v < NS + NT; v++) for (let a = 0; a < NA; a++) { const i0 = v * W1 + a, i1 = i0 + 1, i2 = i0 + W1, i3 = i2 + 1; idx.push(i0, i1, i2, i1, i3, i2); }
  await ctx.yield();
  // --- plinth: the wave-cut shelf the causeway's stumps stand on, following the bays, sinking away at the mouth
  const NP = 190, PR = [[-1.4, 5.2], [0.6, 4.7], [1.7, 3.0], [2.9, 1.3], [4.3, -0.5], [6.2, -2.5], [9.5, -6.2]];
  const base = pos.length / 3, aHalf = Math.round(NA * 0.31);
  for (let r = 0; r < PR.length; r++) {
    for (let k = 0; k <= NP; k++) {
      const fa = (k / NP - 0.5) * 2 * aHalf, a0 = Math.floor(fa), ft = fa - a0;
      const qa = ring[((a0 % NA) + NA) % NA], qb = ring[(((a0 + 1) % NA) + NA) % NA];
      const bx = lerp(qa.bx, qb.bx, ft), bz = lerp(qa.bz, qb.bz, ft), ox = lerp(qa.ox, qb.ox, ft), oz = lerp(qa.oz, qb.oz, ft);
      const ar = fa * arcLen / NA;
      const m = sstep(9.5, 17.5, Math.abs(bx)) * (1 - sstep(-36, -52, bz));
      const jag = 0.9 * n2(ar * 0.16 + S.o2, r * 1.7) + 0.5 * n2(ar * 0.5, r * 3.1 + S.o1);
      const d = PR[r][0] + (r > 0 ? jag * (0.5 + 0.25 * r) : 0), yy = PR[r][1] + (r > 0 && r < 6 ? 0.7 * n2(ar * 0.21 + S.o3, r * 2.3) : 0);
      const dd = d * (0.35 + 0.65 * m) - F.faceBack(bx, bz);
      pos.push(bx + ox * dd, lerp(-6.8, yy, m), bz + oz * dd); kd.push(2, ar, 0);
    }
  }
  for (let r = 0; r < PR.length - 1; r++) for (let k = 0; k < NP; k++) { const i0 = base + r * (NP + 1) + k, i1 = i0 + 1, i2 = i0 + NP + 1, i3 = i2 + 1; idx.push(i0, i2, i1, i1, i2, i3); }
  await ctx.yield();
  // --- fallen columns lying across the causeway's steps: six-sided drums a few metres long, askew, their seaward ends lower
  const prY = (d) => 5.85 - Math.floor(Math.max(d, 0) / 1.05 + 0.3) * 1.4;      // the causeway's steps, as the stumps are dealt
  let fallen = 0;
  for (let n = 0; n < 64; n++) {
    const h1 = L.hash(n, 901, 11), h2 = L.hash(n, 902, 12), h3 = L.hash(n, 903, 13), h4 = L.hash(n, 904, 14), h5 = L.hash(n, 905, 15);
    const fa = (h1 - 0.5) * 2 * aHalf * 0.96, a0 = Math.floor(fa), ft = fa - a0;
    const qa = ring[((a0 % NA) + NA) % NA], qb = ring[(((a0 + 1) % NA) + NA) % NA];
    const bx = lerp(qa.bx, qb.bx, ft), bz = lerp(qa.bz, qb.bz, ft), ox = lerp(qa.ox, qb.ox, ft), oz = lerp(qa.oz, qb.oz, ft);
    if (Math.abs(bx) < 19 || bz < -34) continue;
    const d = 1.4 + 3.6 * h2 - F.faceBack(bx, bz), rad = 0.42 + 0.26 * h3, len = 2.2 + 4.6 * h4 * h4, yaw = (h5 - 0.5) * 1.7, fb = F.faceBack(bx, bz);
    const tx = -oz, tz = ox;                                           // along the face
    let ax = tx * Math.cos(yaw) + ox * Math.sin(yaw), az = tz * Math.cos(yaw) + oz * Math.sin(yaw);
    const dOut = Math.sin(yaw) * len * 0.5, yA = prY(d + fb - dOut) + rad * 0.55, yB = prY(d + fb + dOut) + rad * 0.55;
    let ay = (yB - yA) / len; const al = Math.hypot(ax, ay, az); ax /= al; ay /= al; az /= al;
    const cx = bx + ox * d, cz = bz + oz * d, cy = 0.5 * (yA + yB);
    // two unit vectors across the axis
    let ux = az, uy = 0, uz = -ax; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
    const wx = ay * uz - az * uy, wy = az * ux - ax * uz, wz = ax * uy - ay * ux;
    const b0 = pos.length / 3, roll = h3 * 1.05;
    // (ORDER 12: a plank that lies wholly in the new look's ground, every point of it more than 16 m east or west of
    // x = 3, is drawn nowhere (kind 4.6: the vertex shader folds it away; its triangles stay in the count,
    // which the grass fringe's thickness hangs on) and a row of drums stands in for it (buildExtras). The others are as they were)
    const pk = Math.abs(cx - 3) - (len * 0.5 + rad) > 16 ? 4.6 : 4;
    if (pk > 4.5) planks.push({ n, c: [cx, cy, cz], a: [ax, ay, az], u: [ux, uy, uz], w: [wx, wy, wz], rad, len, roll });
    for (let k = 0; k < 6; k++) {
      for (const e of [0, 1]) {
        const ang = roll + (k + e) * Math.PI / 3, c = Math.cos(ang) * rad, sn = Math.sin(ang) * rad;
        for (const hl of [-0.5, 0.5]) { pos.push(cx + ax * len * hl + ux * c + wx * sn, cy + ay * len * hl + uy * c + wy * sn, cz + az * len * hl + uz * c + wz * sn); kd.push(pk, (hl + 0.5) * len, h5); }
      }
      const q = b0 + k * 4; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
    }
    for (const hl of [-0.5, 0.5]) {
      const c0 = pos.length / 3;
      for (let k = 0; k < 6; k++) { const ang = roll + k * Math.PI / 3, c = Math.cos(ang) * rad, sn = Math.sin(ang) * rad; pos.push(cx + ax * len * hl + ux * c + wx * sn, cy + ay * len * hl + uy * c + wy * sn, cz + az * len * hl + uz * c + wz * sn); kd.push(pk, (hl + 0.5) * len, h5); }
      for (let k = 1; k < 5; k++) { if (hl > 0) idx.push(c0, c0 + k, c0 + k + 1); else idx.push(c0, c0 + k + 1, c0 + k); }
    }
    fallen++;
  }
  await ctx.yield();
  // --- sand floor under the cave and out through the mouth
  const SX0 = -22, SX1 = 18, SZ0 = -91, SZ1 = 42, GX = 20, GZ = 66, b2 = pos.length / 3;
  for (let k = 0; k <= GZ; k++) for (let i = 0; i <= GX; i++) {
    const x = lerp(SX0, SX1, i / GX), z = lerp(SZ0, SZ1, k / GZ);
    pos.push(x, F.floorAt(x, z), z); kd.push(3, x, 1);
  }
  for (let k = 0; k < GZ; k++) for (let i = 0; i < GX; i++) { const i0 = b2 + k * (GX + 1) + i, i1 = i0 + 1, i2 = i0 + GX + 1, i3 = i2 + 1; idx.push(i0, i2, i1, i1, i2, i3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(kd, 3));
  { const t = new Float32Array(pos.length / 3); t.set(tv); g.setAttribute('aT', new THREE.BufferAttribute(t, 1)); }
  g.setIndex(idx);
  await ctx.yield();
  // vertex normals, in slices (area-weighted, as three's own)
  const nrm = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2], e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
    const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
    if (t % 6000 === 5997) await ctx.yield();
  }
  for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, -62), 150);
  return { geometry: g, triangles: idx.length / 3, lipDip, browRows, fallen, pos, idx, topFrom: NS * W1, topTo: (NS + NT + 1) * W1, planks };
}

// ORDER 12, WHAT IS ADDED TO THE GROUND, a mesh of its own (the ground's own triangles stay as they were and are counted
// as they were: the grass fringe's thickness hangs on that count). All of it stands in the new look's ground, by place:
// - FALLEN DRUMS: every plank that lies wholly more than 16 m east or west of x = 3 is broken into a
//   row of six-sided drums, 0.5 to 1.1 m long, each a little off its neighbour and turned, a gap between two, one in
//   seven gone, one in five slipped down the step (kind 5; the plank itself is folded away);
// - SODS OF TURF hanging over the front's brow (kind 7) and TUSSOCKS standing on it, five blades each, 0.8 to 1.5 m
//   tall, leaning out over the edge (kind 8): only where the brow lies more than 17.5 m from x = 0 and before z = -32.
// Flat normals of its own; no random stream is drawn from (the lattice's hash by number); nothing here knows the lens
async function buildExtras(ctx, L, ground) {
  const pos = [], nor = [], kd = [], idx = [];
  const hh = (n, k) => L.hash(n, 930 + k, 50 + k);
  const prism = (c, a, u, w, rad, hl, roll, tone) => {
    for (let k = 0; k < 6; k++) {
      const a0 = roll + k * Math.PI / 3, am = a0 + Math.PI / 6, b0 = pos.length / 3, cm = Math.cos(am), sm = Math.sin(am);
      for (const da of [0, Math.PI / 3]) for (const e of [-1, 1]) {
        const cs = Math.cos(a0 + da) * rad, sn = Math.sin(a0 + da) * rad;
        pos.push(c[0] + a[0] * hl * e + u[0] * cs + w[0] * sn, c[1] + a[1] * hl * e + u[1] * cs + w[1] * sn, c[2] + a[2] * hl * e + u[2] * cs + w[2] * sn);
        nor.push(u[0] * cm + w[0] * sm, u[1] * cm + w[1] * sm, u[2] * cm + w[2] * sm); kd.push(5, tone, 0);
      }
      idx.push(b0, b0 + 2, b0 + 1, b0 + 1, b0 + 2, b0 + 3);
    }
    for (const e of [-1, 1]) {
      const c0 = pos.length / 3;
      for (let k = 0; k < 6; k++) {
        const cs = Math.cos(roll + k * Math.PI / 3) * rad, sn = Math.sin(roll + k * Math.PI / 3) * rad;
        pos.push(c[0] + a[0] * hl * e + u[0] * cs + w[0] * sn, c[1] + a[1] * hl * e + u[1] * cs + w[1] * sn, c[2] + a[2] * hl * e + u[2] * cs + w[2] * sn);
        nor.push(a[0] * e, a[1] * e, a[2] * e); kd.push(5, tone, 1);
      }
      for (let k = 1; k < 5; k++) idx.push(c0, c0 + k, c0 + k + 1);
    }
  };
  let drums = 0;
  for (const p of ground.planks) {
    let s = -p.len / 2, m = 0;
    while (s < p.len / 2 - 0.3 && m < 14) {
      const q = p.n * 16 + m, dl = Math.min(0.5 + 0.6 * hh(q, 1), p.len / 2 - s), gap = 0.04 + 0.12 * hh(q, 2);
      if (hh(q, 3) > 0.14) {
        const o1 = (hh(q, 4) - 0.5) * 0.16, o2 = (hh(q, 5) - 0.5) * 0.12, drop = hh(q, 6) < 0.2 ? -0.25 - 0.5 * hh(q, 7) : 0, at = s + dl / 2;
        prism([p.c[0] + p.a[0] * at + p.u[0] * o1 + p.w[0] * o2, p.c[1] + p.a[1] * at + p.u[1] * o1 + p.w[1] * o2 + drop, p.c[2] + p.a[2] * at + p.u[2] * o1 + p.w[2] * o2],
          p.a, p.u, p.w, p.rad * (0.9 + 0.2 * hh(q, 8)), Math.max(0.12, (dl - gap) / 2), p.roll + hh(q, 9) * 1.05, hh(q, 10));
        drums++;
      }
      s += dl; m++;
    }
  }
  await ctx.yield();
  // the brow: sods and tussocks
  const rows = ground.browRows, NA = rows[1].length; let sods = 0, tufts = 0;
  for (let a = 0; a < NA; a++) {
    const a2 = (a + 1) % NA, p0 = rows[1][a], p1 = rows[1][a2];
    if (p0[5] > 0.4 || Math.min(Math.abs(p0[0]), Math.abs(p1[0])) < 17.5 || Math.min(p0[2], p1[2]) < -32) continue;
    const tx = p1[0] - p0[0], tz = p1[2] - p0[2], tl = Math.hypot(tx, tz) || 1, ex = tx / tl, ez = tz / tl, ox = p0[3], oz = p0[4];
    for (let k = 0; k < 2; k++) {
      const q = a * 8 + k, f = (k + hh(q, 11)) / 2, th = 0.35 + 0.5 * hh(q, 12), ct = Math.cos(th), st = Math.sin(th);
      const rx = 0.6 + 0.7 * hh(q, 13), rz = 0.45 + 0.35 * hh(q, 14), ry = 0.3 + 0.25 * hh(q, 15), out = 0.15 + 0.4 * hh(q, 16);
      const cx = lerp(p0[0], p1[0], f) + ox * out, cy = lerp(p0[1], p1[1], f) - 0.2 - 0.3 * hh(q, 17), cz = lerp(p0[2], p1[2], f) + oz * out;
      const fo = [ox * ct, -st, oz * ct], up = [ox * st, ct, oz * st], b0 = pos.length / 3, tone = hh(q, 18);
      for (const [rr, hy] of [[1, 0], [0.62, 0.75]]) for (let j = 0; j < 6; j++) {
        const cs = Math.cos(j * Math.PI / 3) * rr, sn = Math.sin(j * Math.PI / 3) * rr;
        const dx = ex * cs * rx + fo[0] * sn * rz + up[0] * hy * ry, dy = fo[1] * sn * rz + up[1] * hy * ry, dz = ez * cs * rx + fo[2] * sn * rz + up[2] * hy * ry;
        pos.push(cx + dx, cy + dy, cz + dz);
        const nx = ex * cs / rx + fo[0] * sn / rz + up[0] * (hy + 0.35) / ry, ny = fo[1] * sn / rz + up[1] * (hy + 0.35) / ry, nz = ez * cs / rx + fo[2] * sn / rz + up[2] * (hy + 0.35) / ry, nl = Math.hypot(nx, ny, nz) || 1;
        nor.push(nx / nl, ny / nl, nz / nl); kd.push(7, tone, 0);
      }
      pos.push(cx + up[0] * ry, cy + up[1] * ry, cz + up[2] * ry); nor.push(up[0], up[1], up[2]); kd.push(7, tone, 0);
      for (let j = 0; j < 6; j++) { const j2 = (j + 1) % 6; idx.push(b0 + j, b0 + j2, b0 + 6 + j, b0 + j2, b0 + 6 + j2, b0 + 6 + j, b0 + 6 + j, b0 + 6 + j2, b0 + 12); }
      const c0 = pos.length / 3;
      for (let j = 0; j < 6; j++) { pos.push(pos[(b0 + j) * 3], pos[(b0 + j) * 3 + 1], pos[(b0 + j) * 3 + 2]); nor.push(-up[0], -up[1], -up[2]); kd.push(7, tone, 0); }
      for (let j = 1; j < 5; j++) idx.push(c0, c0 + j + 1, c0 + j);
      sods++;
    }
    for (let k = 0; k < 8; k++) {
      const q = a * 8 + k, f = (k + hh(q, 21)) / 8, tr = 0.4 + 0.9 * hh(q, 22), r0 = Math.min(1, Math.floor(tr)), ft = tr - r0;
      const A = rows[r0][a], B = rows[r0][a2], C = rows[r0 + 1][a], D = rows[r0 + 1][a2];
      const bx = lerp(lerp(A[0], B[0], f), lerp(C[0], D[0], f), ft), by = lerp(lerp(A[1], B[1], f), lerp(C[1], D[1], f), ft) - 0.1, bz = lerp(lerp(A[2], B[2], f), lerp(C[2], D[2], f), ft);
      const over = 1 - clamp(tr - 0.6, 0, 1), tone = hh(q, 23);
      for (let j = 0; j < 5; j++) {
        const yaw = hh(q, 24) * 6.283 + j * 1.2566, hw = 0.11 + 0.09 * hh(q + j, 25), H = 0.8 + 0.7 * hh(q + j, 26), dx = Math.cos(yaw), dz = Math.sin(yaw);
        const lx = ox * over * 0.4 + dx * 0.28, lz = oz * over * 0.4 + dz * 0.28, b0 = pos.length / 3;
        pos.push(bx + dz * hw + dx * 0.12, by, bz - dx * hw + dz * 0.12, bx - dz * hw + dx * 0.12, by, bz + dx * hw + dz * 0.12, bx + dx * 0.12 + lx * H, by + H, bz + dz * 0.12 + lz * H);
        nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0); kd.push(8, tone, 0, 8, tone, 0, 8, tone, 1); idx.push(b0, b0 + 1, b0 + 2);
      }
      tufts++;
    }
    if (a % 40 === 39) await ctx.yield();
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(kd, 3)); g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(pos.length / 3), 1));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, -62), 150);
  return { geometry: g, triangles: idx.length / 3, drums, sods, tufts };
}

const GROUND_VERT = /* glsl */`
uniform float uTime;
attribute vec3 aK; attribute float aT; varying vec3 vP, vWp, vN, vK; varying float vT;
// (order 12: a tussock's blade (kind 8, the added mesh's) bows to the wind by its own height; a plank that the drums
// stand in for (kind 4.6) is folded away to one point outside the clip volume, so that it draws nothing. Every other
// vertex is as it was, to the bit)
void main(){ vec3 p = position;
  if(aK.x > 7.5 && aK.x < 8.5){ float g = sin(uTime*1.9+p.x*.31+p.z*.23)*.5+sin(uTime*3.7+p.x*.9)*.22; p.xz += vec2(.8, .25)*(aK.z*aK.z*(.22+.2*g)); }
  vP = p; vN = normal; vK = aK; vT = aT; vec4 wp = modelMatrix*vec4(p, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp;
  if(aK.x > 4.5 && aK.x < 4.7) gl_Position = vec4(0., 0., -2., 1.);
}`;
const GROUND_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec3 vP, vWp, vN, vK; varying float vT;
void main(){
  vec3 P = vP; float kind = vK.x;
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
  vec3 N = nrm(vN);
  // ORDER 12, THE NEW LOOK'S GROUND (nw), BY PLACE ALONE, as on the columns: 0 within 16 m east and west of x = 3,
  // the line that runs into the mouth (the plinth) and within 13 m of x = 0 (the cap over the mouth), and behind z = -44
  // (the slumped sides, the top round the blowhole); 1 beyond, coming in over 3 to 10 m. Where it
  // is 0 no branch below is taken and every number is the one it was
  float nw = smoothstep(-44., -34., P.z)*(kind < 1.5 ? max(smoothstep(16., 22., abs(P.x-3.)), smoothstep(13., 16., abs(P.x))) : smoothstep(16., 22., abs(P.x-3.)));
  float nLace = 0.;
  float fwP = max(fwidth(P.y), fwidth(P.x)+fwidth(P.z));
  // the blowhole's lip: the turf is open where the chimney comes up through it
  vec3 pa = P-AX0; float sa = dot(pa, AXD); float rho = sqrt(max(dot(pa, pa)-sa*sa, 0.));
  vec3 alb; float rough = .8, wet = .2, cnet = .3, ao = 1., crust = 0., sunSh = 1.;
  float turf = 0.;
  float s = vK.y, slump = fbm2(vec2(s*.035, P.y*.05))*9.+fbm2(vec2(s*.11, P.y*.16)+3.)*2.2;
  float u = (s+slump+P.y*.25)/.42, fwU = fwidth(u)*.42, fwJ = fwidth(P.y);
  float u2 = (s+slump*.8+P.y*.2+2.4*vn(vec2(s*.11, P.y*.08)))/5.6, fw2 = fwidth(u2);
  float u3 = (s+slump+P.y*.25)/1.05, fw3 = fwidth(u3);
  float lj = (vK.y+vK.z*.4)/.8, fwL = fwidth(lj);                  // a fallen column: metres along its length, in drums
  vec4 mp = textureLod(uMap, (P.xz-uRect.xy)/uRect.zw, 0.);
  if(kind < 1.5 && rho < 6.25 && P.y > 40.) discard;
  if(!gl_FrontFacing && kind < 2.5){ gl_FragColor = vec4(airMix(uBasalt*.02, P, dist, 1.), 1.); return; }       // the rock's own dark, seen from inside it
  if(kind < 1.5){
    // the entablature: thin columns that curve and lean, slumped, standing in broad calm sheaves five to six metres wide
    // with a shadowed cleft between sheaves; its underside in shade; turf over the brow. Thin things melt to their mean
    float fu = fract(u), du = min(fu, 1.-fu)*.42;
    float amp = clamp(.05/max(fwU, 1e-4), 0., 1.);
    float line = (1.-smoothstep(.01, .03+fwU*1.5, du))*amp;
    float cid = h11(floor(u)*1.7);
    float vj = (P.y+cid*5.)/.9, fj = fract(vj), dj = min(fj, 1.-fj)*.9;
    float jl = (1.-smoothstep(.01, .03+fwJ*1.5, dj))*clamp(.05/max(fwJ, 1e-4), 0., 1.)*.6;
    float f2 = fract(u2), d2 = min(f2, 1.-f2), amp2 = clamp(.5/max(fw2, 1e-4), 0., 1.);
    float cleft = (1.-smoothstep(.01, .1+fw2, d2))*amp2;
    float sid = h11(floor(u2)*3.1);
    float f3 = fract(u3), d3 = min(f3, 1.-f3), amp3 = clamp(.3/max(fw3, 1e-4), 0., 1.)*(1.-.7*amp);
    float gap3 = (1.-smoothstep(.03, .2+fw3, d3))*amp3;                      // nearer, the thin columns read in threes
    alb = uBasalt*.8*(.8+.3*mix(.5, cid, amp))*(1.-.6*max(line, jl))*(.86+.28*mix(.5, sid, amp2))*(1.-.3*gap3);
    alb *= .8+.4*fbm2(vec2(s*.05, P.y*.09)+7.);                             // broad weathering, the size of the sheaves
    N = nrm(N+vec3(N.z, 0., -N.x)*((fu-.5)*.9*amp+(f3-.5)*.5*amp3+(f2-.5)*.75*amp2));      // each thin column is round, and so is each sheaf
    tideBands(P, vec2(vK.y, P.y), .37, 1., fwP, 0., .5, 0., alb, rough, crust);
    float under = smoothstep(.15, .6, -N.y);                                  // the soffit
    ao = (.75+.25*smoothstep(-2., 6., P.y))*(1.-.55*cleft)*(1.-.5*under)*(.55+.45*smoothstep(0., 3.5, P.y-(34.+2.*fbm2(vec2(s*.03, 1.)))));
    sunSh = (1.-.6*cleft)*(1.-under);
    float sside = dot(uSunDir, vec3(N.z, 0., -N.x)) > 0. ? 1.-f2 : f2;            // a sheaf standing proud shades its neighbour's flank
    sunSh *= mix(1., smoothstep(.0, .22, sside), amp2*step(.45, sid));
    float grass = fbm2(P.xz*.33+P.y*.21);
    vec3 turfCol = mix(vec3(.065, .1, .03), vec3(.15, .17, .055), fbm2(P.xz*.11+2.))*(.8+.5*vn(P.xz*3.1));
    float sway = vn(vec2(P.x*.21+uTime*.9, P.z*.21-uTime*.35));            // wind running over the long grass
    turfCol *= .82+.5*sway*sway;
    turf = max(smoothstep(.15, .75, kind+(grass-.5)*.5), smoothstep(.55, .8, N.y+.25*grass)*step(8., P.y));
    alb = mix(alb, turfCol, turf); rough = mix(rough, .95, turf);
    wet = mix(.4, .05, turf); sunSh = mix(sunSh, 1., turf); ao = mix(ao, 1., turf);
    // ORDER 12 (nw, by place): THE ENTABLATURE'S THIN CURVING COLUMNS ARE READ from the run: bound in threes (1.05 m)
    // they last until a pixel holds a whole one: each its own tone, round, a dark gap between two; and THE TURF HANGS
    // OVER the brow in ragged tongues, a fifth of the face deep, dark earth and its shadow under its edge
    if(nw > 0.){
      float a3 = clamp(.45/max(fw3, 1e-4), 0., 1.), g3 = (1.-smoothstep(.03, .22+fw3, d3))*a3, bare = nw*(1.-turf);
      alb *= mix(1., (.72+.56*mix(.5, h11(floor(u3)*5.3+1.), a3))*(1.-.5*g3), bare);
      N = nrm(N+vec3(N.z, 0., -N.x)*((f3-.5)*1.1*a3*bare));
      ao *= 1.-.45*g3*bare;
      float thrT = .8+.16*(vn(vec2(s*.35, 2.))-.5)+.1*(vn(vec2(s*1.3, 5.))-.5);
      float tf2 = nw*smoothstep(thrT-.02, thrT+.03, vT)*(1.-turf), earth = nw*smoothstep(thrT-.1, thrT-.02, vT)*(1.-tf2)*(1.-turf);
      alb = mix(alb, vec3(.035, .028, .02), .8*earth); ao *= 1.-.5*earth;
      alb = mix(alb, turfCol*.85, tf2); rough = mix(rough, .95, tf2); wet = mix(wet, .05, tf2); sunSh = mix(sunSh, 1., tf2); ao = mix(ao, 1., tf2);
      turf = max(turf, tf2);
    }
  } else if(kind < 2.5){
    // the plinth: rough wave-cut rock wearing every band, and the surf line: swash running up it and draining back
    float r = fbm2(vec2(vK.y*.4, P.y*.7))*.6+vn(P.xz*2.3)*.4;
    alb = uBasalt*(.2+.4*r);
    tideBands(P, mix(vec2(vK.y, P.y), P.xz, step(.6, N.y)), .11, 0., fwP, 0., .5, 0., alb, rough, crust);
    float soak = 1.-smoothstep(.9, 2.2, P.y+r*.8);
    wet = max(.3, soak); alb *= mix(1., .6, soak*(1.-.7*crust));
    ao = (.5+.3*smoothstep(-1., 5., P.y))*(.55+.6*r);
    float sw = uSea+.45+.4*sin(uTime*.9+vK.y*.11)+.5*vn(vec2(vK.y*.23, uTime*.35));
    float surf = (1.-smoothstep(sw-.15, sw+.2, P.y+r*.5))*smoothstep(uSea-1.2, uSea-.3, P.y);
    float lace = smoothstep(.25, .55, fbm2(vec2(vK.y*.9, P.y*2.2-uTime*.6))+.3*surf);
    alb = mix(alb, uFoamCol*.75, surf*lace); rough = mix(rough, .9, surf*lace);
    // (ORDER 12, nw by place: the plinth's rock is wet and dark for a metre or two over the water wherever the sea
    // stands, and its white goes by the swell's own clock, as on the stumps: see the column shader)
    if(nw > 0.){
      // (ORDER 13: THE PLINTH'S WET FOOT IS WET BLACK ROCK too: from the water up to some four metres over it no crust on it
      // is lighter than its wet rock (at the rock's middle tone) by more than a third: its pale belts stood as light boxes)
      alb *= mix(1., min(1., 1.3*dot(uBasalt, vec3(.3, .5, .2))*.45*mix(1., .6, soak)/max(dot(alb, vec3(.3, .5, .2)), 1e-4)), nw*(1.-smoothstep(3.5, 5.5, P.y-uSea+r*.8)));
      float wb = 1.-smoothstep(1.2, 3., P.y-uSea+r*.8);
      alb *= 1.-.4*nw*wb*(1.-.6*crust); wet = max(wet, .9*nw*wb);
      vec3 s12 = seaSwell(P.xz, uTime); float am12 = mix(1., 2., smoothstep(.45, 1., uWind)), srg = smoothstep(-.18, .26, s12.x/am12);
      float top12 = uSea+s12.x+.1+(.2+.9*srg*srg)*1.41*(.5+.8*vn(vec2(vK.y*.31, uTime*.3)));
      float sf12 = (1.-smoothstep(top12-.5, top12+.15, P.y+.35*r))*smoothstep(uSea-1.4, uSea-.4, P.y);
      nLace = nw*sf12*smoothstep(.4-.2*srg, .68-.2*srg, fbm2(vec2(vK.y*.8, P.y*1.7-uTime*.8)+P.xz*.6)+.3*sf12);
      // (order 13: the thin bright line at the waterline, as on the stumps: see the column shader)
      nLace = max(nLace, nw*.8*(1.-smoothstep(.04, .1+fwJ, abs(P.y-uSea-s12.x-.05)))*clamp(.14/max(fwJ, 1e-3), 0., 1.)*(.45+.55*smoothstep(.25, .6, vn(vec2(vK.y*1.7, uTime*.3)))));
      alb = mix(alb, uFoamCol*.75, nLace); rough = mix(rough, .9, nLace);
    }
  } else if(kind < 3.5){
    // pale shell sand, rippled, under the caustic light: the lamp of the whole cave. Weed and shadow gather where a pipe stands in it
    float warp = fbm2(P.xz*.21)*2.4;
    float rp = sin((P.z*.92+P.x*.3+warp)*6.2831853/.42), fwR = fwP/.42;
    float ripple = mix(.5+.5*rp, .5, smoothstep(.15, .6, fwR));
    alb = mix(vec3(.5, .47, .38), vec3(.78, .76, .66), ripple)*(.85+.3*vn(P.xz*1.3));
    float boulder = smoothstep(-5.2, -4.2, P.y)*(1.-smoothstep(-70., -60., P.z));
    alb = mix(alb, uBasalt*1.6+uPink*.25*vn(P.xz*.9), boulder);
    float cd = min(mp.r*3., mp.a*2.)+(vn(P.xz*1.7)-.5)*.4;
    alb = mix(alb, vec3(.03, .045, .028), (1.-smoothstep(.1, 1.2, cd))*.9);
    float lv = levelAt(P.z), depth = max(lv-P.y, 0.), bare = smoothstep(0., .22, P.y-lv);       // (a trough can lay a bank bare: dark wet sand, no net on it)
    cnet = mix(causLight(P.xz/6., uTime*.3, fwP/6., 1.), 1., bare);
    float gz = glowIn(P.z)*mix(.3, 1., (1.-smoothstep(6., 34., P.z)));
    // the lamp's own face: pale sand under the net, its filaments at the emerald's peak. The water drinks its light with
    // depth, red first, and stands between it and the eye: over the deep channel it is lost in the water's own glow
    vec3 col = alb*uGlowCol*gz*(.42+.5*cnet)*exp(-depth*vec3(.3, .055, .1))*(1.-.75*(1.-smoothstep(0., .5, cd)))*mix(1., .34, bare);
    float open = lampOpen(P.xz, mp.r*3.);
    col = mix(col*mix(.12, 1., open), lampIn(open)*gz, 1.-exp(-depth*.13));      // (the wall's shadow lies on the sand under it as on the water over it)
    gl_FragColor = vec4(airMix(min(col, uGlowCol), P, dist, 1.), 1.); return;
  } else if(kind > 4.8){
    // ORDER 12, THE ADDED MESH (its own triangles, none of the ground's): kind 5 A FALLEN DRUM, six-sided, a column's
    // width across and half a metre to a metre long, one of a row that a fallen column broke into (vK.y: its own tone;
    // vK.z: 1 on its two ends); kind 7 A SOD OF TURF hanging over the brow (dark earth under it); kind 8 A TUSSOCK'S
    // BLADE against the sky (vK.z: 0 at its root to 1 at its tip)
    if(kind < 5.5){
      float g = vn(P.xz*5.+P.y*3.);
      alb = uBasalt*.8*(.55+.65*vK.y)*(.7+.6*g)*(1.-.3*vK.z*smoothstep(.3, .7, vn(P.xz*9.+P.y*7.)));
      float rk13 = dot(alb, vec3(.3, .5, .2));
      tideBands(P, vec2(P.x+P.z, P.y), .23, 1., fwP, 0., .5, 0., alb, rough, crust);
      float soak = 1.-smoothstep(.9, 2.2, P.y-uSea+g*.8);
      wet = max(.35, soak); alb *= mix(1., .6, soak*(1.-.7*crust));
      // (order 13: a fallen drum's wet foot is wet black rock: no crust on it lighter than its own wet rock by more than a third)
      alb *= mix(1., min(1., 1.3*rk13*mix(1., .6, soak)/max(dot(alb, vec3(.3, .5, .2)), 1e-4)), nw*(1.-smoothstep(3.5, 5.5, P.y-uSea+g*.8)));
      rough = mix(rough, .3, wet*wet*(1.-.8*crust));
      ao = .5+.5*smoothstep(-.5, .5, N.y);
      vec3 s12 = seaSwell(P.xz, uTime); float am12 = mix(1., 2., smoothstep(.45, 1., uWind)), srg = smoothstep(-.18, .26, s12.x/am12);
      float top12 = uSea+s12.x+.1+(.2+.9*srg*srg)*1.41*(.5+.8*vn(vec2((P.x+P.z)*.31, uTime*.3)));
      float sf12 = (1.-smoothstep(top12-.5, top12+.15, P.y+.35*g))*smoothstep(uSea-1.4, uSea-.4, P.y);
      nLace = sf12*smoothstep(.4-.2*srg, .68-.2*srg, fbm2(vec2((P.x+P.z)*.8, P.y*1.7-uTime*.8)+P.xz*.6)+.3*sf12);
      alb = mix(alb, uFoamCol*.75, nLace); rough = mix(rough, .9, nLace);
    } else if(kind < 7.5){
      vec3 tc = mix(vec3(.065, .1, .03), vec3(.15, .17, .055), fbm2(P.xz*.11+2.))*(.8+.5*vn(P.xz*3.1));
      float sway = vn(vec2(P.x*.21+uTime*.9, P.z*.21-uTime*.35)), under = smoothstep(.1, .5, -N.y);
      tc *= .82+.5*sway*sway;
      alb = mix(tc*(.75+.5*vK.y), vec3(.035, .028, .02), under); rough = .95; wet = .05; ao = 1.-.55*under; turf = 1.-under;
    } else {
      float tb = vK.z; vec3 a8 = mix(mix(vec3(.05, .085, .025), vec3(.2, .24, .07), tb), vec3(.3, .27, .13), step(.7, vK.y)*tb*.8);
      gl_FragColor = vec4(airMix(a8*(uSkyCol*.9+uSunCol*(.22+.45*tb)), P, dist, 0.), 1.); return;
    }
  } else {
    // a fallen column lying on the plinth: the same rock, jointed across its length
    float fl = fract(lj), dl = min(fl, 1.-fl)*.8;
    float jn = (1.-smoothstep(.01, .03+fwL*1.2, dl))*clamp(.4/max(fwL, 1e-4), 0., 1.);
    float g = vn(P.xz*5.+P.y*3.);
    alb = uBasalt*.8*(.6+.6*h11(floor(lj)+vK.z*7.))*(.7+.6*g)*(1.-.7*jn);
    tideBands(P, vec2(vK.y, P.y+P.x), .23, 1., fwP, 0., .5, 0., alb, rough, crust);
    float soak = 1.-smoothstep(.9, 2.2, P.y+g*.8);
    wet = max(.35, soak); alb *= mix(1., .6, soak*(1.-.7*crust));
    rough = mix(rough, .3, wet*wet*(1.-.8*crust));
    ao = .6+.4*smoothstep(-.3, .5, N.y);
  }
  vec3 col = shade(P, N, N, V, alb, rough, wet, 0., 0., ao, sunSh, 1., crust, 1., 1., vec3(0.), 1.);
  // (ORDER 13, nw by place: on the plinth and the fallen drums THE WET FILM'S FLAT SHEEN OF THE SKY IS A DIM COOL ONE, as on
  // the stumps: the term shade() gave is taken out again and laid back at no more than two fifths of its upper
  // strength, eased over the level look. It reads the eye's bearing as the term it replaces does: named at the head)
  if(nw > 0. && kind > 1.5 && kind < 5.5){
    float Ry13 = reflect(-V, N).y;
    vec3 s13 = uSkyCol*((.04+.96*pow(clamp(1.-max(dot(N, V), 0.), 0., 1.), 5.))*mix(.12, 1., wet*wet)*ao*wet*(1.-rough));
    col = max(col-nw*s13*(Ry13 > 0. ? .5 : .12), 0.)+nw*s13*mix(.1, .2, smoothstep(-.4, .4, Ry13));
  }
  col += turf*uSunCol*alb*(1.-smoothstep(.2, .55, uSunDir.y))*.4;            // (long grass stands up into a low sun: the turf is warm)
  // (ORDER 12, nw by place: THE CAP'S SHADE IS THE CLIFF'S OWN: where the sun does not reach its rock it takes the
  // sky's fill, cold, turned to the teal-black of the wall's shade, and its wet film mirrors the sky at a grazing look
  // (THIS READS THE EYE'S BEARING, as every mirror does; named at the head): its thin columns are read in the shade
  // too, and it is no black cut-out. No warmth is added, and nothing from below)
  if(nw > 0. && kind < 1.5){
    float k12 = nw*(1.-turf)*(1.-sunSh*smoothstep(0., .25, dot(N, uSunDir)));
    col += k12*uSkyCol*alb*ao*.8;
    col = mix(col, uDeep*(dot(col, vec3(.3, .5, .2))/max(dot(uDeep, vec3(.3, .5, .2)), 1e-4)), .45*k12);
    col += k12*uSkyCol*((.04+.96*pow(clamp(1.-max(dot(N, V), 0.), 0., 1.), 3.))*.3*ao*(1.-.8*crust));
  }
  if(nLace > 0.) col = mix(col, min(col, vec3(.8)), nLace);
  float depth2 = uSea-P.y;
  if(depth2 > 0.) col = mix(col*vec3(.5, .9, .85), uDeep*.35, 1.-exp(-depth2*.5));
  gl_FragColor = vec4(airMix(col, P, dist, 0.), 1.);
}`;


// ---------------------------------------------------------------- the cave's water sheet
// A baked map over the sheet (0.2 m a texel): R = metres to the nearest wall column (0 to 3), G = the sand floor (-8 to 8),
// B = the top of the nearest stump (-8 to 8), A = metres to that stump's rim (0 to 2): a stump rings the water only while it stands out of it.
const WX0 = -22, WX1 = 18, WZ0 = -91, WZ1 = 41, MAPW = 200, MAPH = 660;
async function bakeMap(ctx, F, bodies) {
  const data = new Uint8Array(MAPW * MAPH * 4);
  const tx = (WX1 - WX0) / MAPW, tz = (WZ1 - WZ0) / MAPH;
  // (a row of the floor, a body's texels and a run of the last pass are plain functions, called between the hand-backs)
  const floorRow = (k) => {
    const z = WZ0 + (k + 0.5) * tz;
    for (let i = 0; i < MAPW; i++) { const x = WX0 + (i + 0.5) * tx, f = F.floorAt(x, z); data[(k * MAPW + i) * 4 + 1] = Math.round(clamp((f + 8) / 16, 0, 1) * 255); }
  };
  for (let k = 0; k < MAPH; k++) { floorRow(k); if (k % 3 === 2) await ctx.yield(); }
  const NT = MAPW * MAPH, wallD = new Float32Array(NT).fill(3), stD = new Float32Array(NT).fill(2), stTop = new Float32Array(NT).fill(-8);
  let n = 0;
  // (a texel that already has a body nearer than this one stands, by the squares of the two steps and a thousandth of a
  // millimetre to spare, is passed over before the root is taken: the root is taken only where it can lower the texel)
  const splat = (b) => {
    const reach = b.r + (b.wall ? 3 : 2), rr = b.r * 0.94, cur = b.wall ? wallD : stD;
    const i0 = Math.max(0, Math.floor((b.x - reach - WX0) / tx)), i1 = Math.min(MAPW - 1, Math.ceil((b.x + reach - WX0) / tx));
    const k0 = Math.max(0, Math.floor((b.z - reach - WZ0) / tz)), k1 = Math.min(MAPH - 1, Math.ceil((b.z + reach - WZ0) / tz));
    for (let k = k0; k <= k1; k++) {
      const dz = WZ0 + (k + 0.5) * tz - b.z, dz2 = dz * dz;
      for (let i = i0; i <= i1; i++) {
        const q = k * MAPW + i, dx = WX0 + (i + 0.5) * tx - b.x, far = cur[q] + rr + 1e-6; if (dx * dx + dz2 > far * far) continue;
        const d = Math.max(0, Math.hypot(dx, dz) - rr);
        if (b.wall) { if (d < wallD[q]) wallD[q] = d; } else if (d < stD[q]) { stD[q] = d; stTop[q] = b.top; }
      }
    }
  };
  for (const b of bodies) { splat(b); if (++n % 40 === 0) await ctx.yield(); }
  const pack = (q0, q1) => {
    for (let q = q0; q < q1; q++) { data[q * 4] = Math.round(wallD[q] / 3 * 255); data[q * 4 + 2] = Math.round(clamp((stTop[q] + 8) / 16, 0, 1) * 255); data[q * 4 + 3] = Math.round(stD[q] / 2 * 255); }
  };
  for (let q = 0; q < NT; q += 16000) { pack(q, Math.min(NT, q + 16000)); await ctx.yield(); }
  const tex = new THREE.DataTexture(data, MAPW, MAPH, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}

// The caustic net's tile (256 x 256, one byte, stored as a square root): the edges of jittered cells that wrap round the tile,
// curved by a wrapped warp: bright thin lines, brighter knots, a faint skirt, dark cells. Its smaller copies do the filtering.
async function bakeCaustics(ctx, L) {
  const N = 256, G = 4, TAU = Math.PI * 2, data = new Uint8Array(N * N);
  const cx = new Float32Array(G * G), cy = new Float32Array(G * G), cb = new Float32Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { cx[j * G + i] = i + 0.15 + 0.7 * L.hash(i, j, 21); cy[j * G + i] = j + 0.15 + 0.7 * L.hash(i, j, 22); cb[j * G + i] = 0.55 + 0.45 * L.hash(i, j, 23); }
  // (the part of the warp that hangs on the column alone is worked out once a column, the part on the row once a row;
  // the cells' numbers are whole numbers kept as such, a row of cells wrapped once for its three)
  const wcol = new Float64Array(N); for (let x = 0; x < N; x++) wcol[x] = 0.022 * Math.sin(TAU * ((x + 0.5) / N * 2 + 0.7));
  const row = (y) => {
    const v = (y + 0.5) / N, wrow = 0.022 * Math.sin(TAU * (v * 2 + 0.3));
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N;
      const wu = wrow + 0.012 * Math.sin(TAU * (v * 5 + u * 3)), wv = wcol[x] + 0.012 * Math.sin(TAU * (u * 4 - v * 3));
      const gx = (u + wu) * G, gy = (v + wv) * G, i0 = Math.floor(gx) | 0, j0 = Math.floor(gy) | 0;
      let f1 = 9, f2 = 9, b1 = 1, b2 = 1;
      for (let dj = -1; dj <= 1; dj++) {
        const j = j0 + dj, jw = ((j % G) + G) % G, oj = j - jw;
        for (let di = -1; di <= 1; di++) {
          const i = i0 + di, iw = ((i % G) + G) % G, q = jw * G + iw;
          const dx = cx[q] + (i - iw) - gx, dy = cy[q] + oj - gy, d = Math.sqrt(dx * dx + dy * dy);
          if (d < f1) { f2 = f1; b2 = b1; f1 = d; b1 = cb[q]; } else if (d < f2) { f2 = d; b2 = cb[q]; }
        }
      }
      const e = f2 - f1, val = Math.min(1, 0.5 * (b1 + b2) * (Math.exp(-(e * e) / 0.00068) + 0.04 * Math.exp(-e / 0.1)));
      data[y * N + x] = Math.round(255 * Math.sqrt(val));
    }
  };
  for (let y = 0; y < N; y++) { row(y); if (y % 6 === 5) await ctx.yield(); }      // (a row is a plain function, called between the hand-backs)
  const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

const WATER_VERT = /* glsl */`
uniform float uTime, uLevel, uPile, uSea; uniform vec4 uHump;
varying vec3 vP, vWp;
float levelAt(float z){ float d = (z-uHump.x)/max(uHump.z, 1.); return mix(uLevel, uSea, smoothstep(2., 20., z)) + uHump.y*exp(-d*d) + uPile*(1.-smoothstep(-86., -56., z)); }
void main(){
  vec3 P = position;
  // the sheet's own bob: 0.15 m, a period over five seconds, long in space: small and slow
  P.y = levelAt(P.z)+.15*sin(uTime*1.18+P.z*.045+P.x*.03)*(.6+.4*sin(uTime*.37+P.z*.02))*(1.-smoothstep(6., 20., P.z));   // (no bob where the open sea takes over)
  // outside the mouth, toward its rim, the sheet slips away under the open sea (1.7 m down at the rim, where it has faded
  // to nothing): a world's own sea lies over it there, so the two never show a level step or a rim
  P.y = mix(P.y, uSea-1.7, smoothstep(.6, .9, length(vec2(P.x/16.5, max(P.z-2., 0.)/34.)))*smoothstep(0., 3., P.z));
  vP = P; vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const WATER_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec3 vP, vWp;
// a wall of the nave as the sheet mirrors it: dark pipes, each its own tone, a crack between two, the pale crust low on
// them, all of it lit from below as the wall itself is; the pipes melt to a mean wall as a pixel grows over them
vec3 wallMirror(float zh, float yh, float lv, float fw){
  float c = zh/1.05+.35*sin(zh*.7), id = floor(c), f = fract(c), keep = 1.-smoothstep(.25, .8, fw);
  float tone = mix(.8, .5+.6*h11(id*7.3+2.), keep)*mix(1., smoothstep(0., .12, min(f, 1.-f)), keep);
  float band = 1.-smoothstep(1.4-fw, 2.6+fw, yh+.4*sin(zh*.9));
  float Wh = .5*exp(-max(yh-lv, 0.)/7.)+.5;
  return uGlowCol*(uGlowAmt*mix(.075, .15, band)*tone*Wh);
}
// TORN FOAM (order 11: thick foam is never a soft pale wash, and never a flat floe): at p (a place that drifts with the
// flow, its length down the nave halved, so everything in it is drawn long by the flow) a share cov of the water is
// white: a net of threads (the caustic tile's cell edges at two sizes, 2.4 and 1.4 m) and small clots a hand wide and a
// metre long, more and thicker as cov grows; the clear water stands between. It melts to its mean cover as a pixel
// grows past a clot (fwT)
float tornFoam(vec2 p, float cov, float ll, float fwT, float bub){
  float net = clamp((causTap(p/2.4+.13, ll+.2)+.8*causTap(vec2(.8*p.x-.6*p.y, .6*p.x+.8*p.y)/1.4+.61, ll+.9))*1.5, 0., 1.);
  vec2 g = vec2(p.x*5., p.y*1.8);
  float fine = 1.-smoothstep(.1, .5, fwT);
  float grain = vn(g)*.55+vn(g*vec2(2.7, 2.1)+5.)*.3+bub*.15+(vn(g*vec2(7., 5.)+9.)-.5)*.22*fine;      // (near, a clot is ragged and full of holes)
  float clot = smoothstep(.74-.3*cov, .8-.3*cov+fwT*.1, grain)*mix(1., .55+.45*smoothstep(.3, .6, vn(g*vec2(11., 4.)+2.)), fine);
  return mix(cov*.45, max(net*(.4+.6*cov), clot), 1.-smoothstep(.5, 1.8, fwT))*smoothstep(0., .08, cov); }
void main(){
  vec3 P = vP;
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
  float fwP = fwidth(P.x)+fwidth(P.z);
  vec2 dPx = dFdx(P.xz), dPy = dFdy(P.xz);
  vec2 muv = (P.xz-uRect.xy)/uRect.zw;
  vec4 mp = texture2D(uMap, muv);
  float top = mp.b*16.-8.;
  float emerge = smoothstep(-.25, .25, top-P.y);                            // the nearest stump stands out of the water here
  float shore = min(mp.r*3., mix(2., mp.a*2., emerge));                   // metres to the nearest body standing out of the water
  float over = P.y-(mp.g*16.-8.), depth = max(over, .05);                  // (over: the water over the sand; a trough can lay a bank bare)
  // what lies under the glass here: the sand, or the top of a drowned stump
  float depthU = mix(depth, clamp(P.y-top, .05, depth), (1.-smoothstep(0., .3, mp.a*2.))*(1.-emerge));
  // (the hand-over to the sea's face is not ruled across the mouth: the sea's ripples run in here, the cave's water out there)
  float inside = (1.-smoothstep(-4., 7., P.z+5.*(vn(vec2(P.x*.38, P.z*.12+uTime*.05)+4.)-.5)+2.*(vn(vec2(P.x*1.3+uTime*.1, P.z*.5)+8.)-.5)));       // 1 in the cave, 0 out at sea
  float day = mix(1., dayAt(P), inside);
  float t = uTime;
  // small ripples; their slope turns the mirror
  vec2 q = P.xz;
  float r1 = vn(q*1.9+vec2(t*.35, -t*.22)), r2 = vn(q*4.3+vec2(-t*.5, t*.41)+3.);
  float r1x = vn(q*1.9+vec2(t*.35, -t*.22)+vec2(.12, 0.)), r1z = vn(q*1.9+vec2(t*.35, -t*.22)+vec2(0., .12));
  float r2x = vn(q*4.3+vec2(-t*.5, t*.41)+3.+vec2(.12, 0.)), r2z = vn(q*4.3+vec2(-t*.5, t*.41)+3.+vec2(0., .12));
  float melt = 1.-smoothstep(.05, .5, fwP);
  vec3 N = nrm(vec3(-((r1x-r1)*1.5+(r2x-r2)*.8)*melt, 1., -((r1z-r1)*1.5+(r2z-r2)*.8)*melt));
  // roof drips: rings opening on the sheet
  vec2 cq = q/2.7, ci = floor(cq), cf = fract(cq);
  float hc = h21(ci), ph = fract(t*(.22+.2*hc)+hc*7.);
  vec2 cc = vec2(.3+.4*h21(ci+3.1), .3+.4*h21(ci+7.7));
  float rr = length(cf-cc)*2.7, ring = (1.-smoothstep(0., .07+fwP, abs(rr-ph*1.3)))*(1.-ph)*inside*step(.35, hc)*melt;
  N = nrm(N+vec3(ring*.5*(cf.x-cc.x), 0., ring*.5*(cf.y-cc.y)));
  // the sheet's own slope (the swell's hump or trough, the pile) turns the mirror: a steep face looked at head-on is
  // smooth glass over the lamp, not a mirror of the walls
  float hd = (P.z-uHump.x)/max(uHump.z, 1.), eh = exp(-hd*hd), ps = clamp((P.z+86.)/30., 0., 1.);
  float dz = -2.*hd*uHump.y*eh/max(uHump.z, 1.)-uPile*.2*ps*(1.-ps), steep = smoothstep(.06, .22, abs(dz));
  float dxh = uHump.y*eh*(.0374*cos(P.x*.83+t*.5+P.z*.21)+.0111*cos(P.x*.37-t*.3+1.7));       // (a swell is not ruled: along its crest it leans a little this way and that, and its mirror with it)
  N = nrm(N+vec3(-dxh*inside, 0., -dz*inside));
  // IN THE CAVE (all of this down to the mirror; outside the mouth the sheet wears the sea's face, below).
  // (ripples too small to see roughen the far sheet: it never turns to a whole mirror, and the lamp's glow comes through
  // it all the way down the nave)
  float NV = max(dot(N, V), 0.), fr5 = pow(clamp(1.-NV, 0., 1.), 5.), Fr = .025+.8*fr5;
  // THE WATER PATH: the sight line bends down as it enters the water; what lies under shows through that length of it,
  // and the water's own glow gathers along it. THE LAMP: that glow is the emerald itself over the pale sand in mid nave
  // (the brightest thing in the cave after the mouth), sliding to deep green in the shadow close under a wall or a
  // standing stump, and toward the deep back. The shallows show their sand and the net on it; the deep channel is a lit slab
  float cosT = sqrt(max(1.-(1.-NV*NV)/1.77, .05));
  float gz = glowIn(P.z);
  float cl = causLight(q/7., t*.3, fwP/7., 2.2);
  float open = lampOpen(q, mp.r*3.)*mix(1., .5+.5*smoothstep(0., 1.8, mp.a*2.), emerge);
  float mott = fbm2(q*.13+2.);
  // THE SHEET CARRIES ITS OWN LIGHT AND DARK: this water is deep and stirred, and hides what is under it; so its body has its
  // own light and dark: clouds of it at two sizes drifting slowly (deep emerald in the hollows, bright where the lamp
  // is below), every ripple's trough darker than its crest, and the lamp's net seen in the water as fine bright lines
  float mot2 = fbm2(q*.47+vec2(t*.05, -t*.08)+7.), rip = (r1*.6+r2*.4-.5)*melt;
  float netL = clamp(causLight(q/3.1+.21, t*.3, fwP/3.1, .25)-.9, 0., 2.);
  float body = (.45+1.1*mott)*(.6+.8*mot2)*(1.+1.*rip)*(.92+.08*cl);
  // (a hollow is deep emerald, not the bright one dimmed: the lamp's own colour slides with it)
  vec3 scat = lampIn(clamp(open*body, 0., 1.15))*gz*min(.7+.3*body+.15*netL*(.35+.65*mot2), 1.3);
  // (where the shaft's light falls on the water at the foot of the blowhole lies a pale blue-white pool of it)
  // (ORDER 11: a BRIGHT pool, three metres about the foot, and a glow of it in the water for a dozen metres round)
  vec2 dsh = q-vec2(0., -80.4); float dS2 = dot(dsh, dsh), shOn = inside*(1.-smoothstep(0., .3, uSpout));
  float poolS = exp(-dS2/9.)*shOn, glowS = exp(-dS2/150.)*shOn;
  scat += shaftCol()*(poolS*.5*(.7+.3*cl)*(.6+.8*mot2)+glowS*.13*(.5+.5*body+.4*netL));
  // (where the sun shines in on it the water turns JADE: its own green paler and milkier, warmed by the sun's light in it)
  float sJ = inside*sunIn(P);
  // (LESS MILK, MORE WATER: the sun's own scatter in it is translucent, with depth: darker in the hollows and the
  // ripples' troughs, the bed's dark seen in patches through the hump's thin crest, the sun's caustic lines bright in it)
  float thinC = smoothstep(.85, .99, eh)*clamp(uHump.y*.45, 0., 1.)*smoothstep(.4, .7, vn(vec2(q.x*.31+t*.05, q.y*.12+3.)));
  float hol = clamp((.4+1.2*mot2)*(1.+1.2*rip)*(.7+.6*mott), .25, 1.7)*(1.-.55*thinC);
  scat = mix(scat, scat*.62+uSunCol*(vec3(.28, .52, .25)*(.08*hol*(.8+.2*cl))+vec3(.1, .5, .3)*(.05*netL)), sJ);
  // (THE WATER BETWEEN THE EYE AND WHAT LIES BELOW takes it away: the path the bent sight line runs in the water down
  // to the sand or a drowned top, or, close to a wall or a standing stump, level to the rock; an e-fold in 0.8 m in the
  // calm and in a quarter of a metre in the flood. The pale sand shows through a metre of it; a drowned top shows just
  // under the surface; nothing else)
  float sinT = sqrt(max(1.-cosT*cosT, 0.)), kS = mix(1.2, 4., uFlood);
  float aBody = 1.-exp(-min(depthU/cosT, (shore+.12)/max(sinT, .3))*kS);
  // (WHERE THE SHEET MEETS ROCK the water is dark in the rock's own shadow and stands against it: a soft dark contact
  // line, half a metre wide, under the grey-white ring: the wall stands IN the water)
  float cont = (1.-smoothstep(.05, .6, shore))*inside;
  scat *= 1.-.5*cont; aBody = max(aBody, .72*cont);
  // THE MIRROR (it reads the eye's bearing): the dark roof; near a wall, at a grazing look, the wall's own pipes standing
  // in the water; the mouth's light lying toward the eye as a path of glitter; the shaft's; outside, the sky and the sun
  vec3 R = reflect(-V, N); R.y = abs(R.y)+1e-3;
  float choir = (1.-smoothstep(-37., -26., P.z))*smoothstep(-68., -56., P.z);
  float xw = R.x > 0. ? 7.8 : -mix(7.8, 17.5, choir), tw = (xw-P.x)/(abs(R.x) > 1e-3 ? R.x : 1e-3);
  // (THE BACK WALL IS A WALL IN THE MIRROR TOO: a mirrored line that runs down the nave ends on it and shows its pipes and
  // the shaft's light on them. Before, the side walls' image gave out on a straight line there and left a dark box on
  // the water round the shaft's foot: two laws meeting on a ruled edge)
  float tb = (-88.-P.z)/min(R.z, -1e-3);
  bool bk = R.z < 0. && (tw < 0. || tb < tw); float th = bk ? tb : tw;
  float yh = P.y+th*R.y, zh = bk ? P.x+th*R.x+40. : P.z+th*R.z, zr = bk ? -88. : zh;
  float hit = step(0., th)*(1.-smoothstep(8., 15., yh-P.y))*(1.-smoothstep(-3., 1., zr));
  // (ORDER 11, THE SEAM: the wall's image lay on the far water as a RULED GRID: its cracks a fence of straight lines
  // every metre, its crust band's edge a straight step across the nave: a rectangle's edges round the shaft's foot. Water
  // does not mirror so: ripples too small to see spread the image by the length of the mirrored path (the pipes stand
  // in the water only close under a wall and melt into one soft tone a few metres out), and the larger ones sway it
  // (by place): the cracks waver and break, the band's edge wanders)
  float zhW = zh+(vn(vec2(q.x*.7+t*.15, q.y*.3-t*.1)+11.)-.5)*min(th*.3, 1.6)+(vn(q*2.3+vec2(-t*.3, t*.2)+4.)-.5)*min(th*.1, .5);
  float yhW = yh+(vn(vec2(q.x*.5-t*.1, q.y*.4+t*.12)+17.)-.5)*min(th*.4, 2.);
  vec3 wallC = wallMirror(zhW, yhW, P.y, fwidth(zh)+fwidth(yh)+steep+.6*uFlood+th*.09)+shaftCol()*(shaftAt(vec3(bk ? P.x+th*R.x : xw, yh, zr)).w*shOn*.05);
  vec3 envIn = mix(uGlowCol*.03*uGlowAmt, wallC, hit);       // (on a steep face the wall's pipes melt to a mean wall: no rows of lines)
  vec3 env = envIn;
  vec3 Lmv = vec3(1.5, 9., 4.)-P; float dmm = length(Lmv); vec3 Lm = Lmv/max(dmm, 1e-3);
  float sh = mix(.09, .2, 1.-melt)+5./max(dmm, 9.)*.5;                        // the mouth is wide; ripples too fine to see spread its image further
  vec2 dR = vec2(length(R.xz-Lm.xz), R.y-Lm.y);
  float lobe = exp(-dR.x*dR.x/(2.*sh*sh)-dR.y*dR.y/(2.*sh*sh*9.));           // long toward the mouth, narrow across
  float spk = vn(q*13.+vec2(t*1.1, -t*.7))*vn(q*21.+vec2(-t*.9, t*1.3)+5.);
  spk = mix(.3, 4.*spk*spk, melt*(1.-smoothstep(.02, .12, fwP)));           // near the lens the path breaks into sparks
  vec3 glit = uMouthCol*inside*(.35+.65*day)*lobe*(.25+.75*spk)*.9;
  // (THE BEAM IN THE WATER: where the mirrored sight line passes the lit column of spray, between the water and the
  // bell's mouth, the sheet shows it: a bright path lying on the water from the shaft's foot toward the eye, broken
  // into sparks by the ripples)
  vec3 w0s = P-AX0; w0s -= AXD*dot(w0s, AXD); vec3 wdS = R-AXD*dot(R, AXD);
  float aS = max(dot(wdS, wdS), 1e-4), bS = dot(w0s, wdS), tS = max(-bS/aS, 0.), r2S = max(dot(w0s, w0s)-bS*bS/aS, 0.);
  float scS = dot(P+R*tS-AX0, AXD);
  // (the image goes with the beam: it gives way to the heap as the beam does, by the event alone)
  float beamM = exp(-r2S/(1.5+.004*tS*tS))*step(0., -bS)*smoothstep(-3., 0., scS)*(1.-smoothstep(10., 16., scS))*shOn*(1.-smoothstep(1.7, 2.6, uPile));
  glit += shaftSky()*beamM*(.5+.8*spk)*1.1;
  float a = 1.-(1.-Fr)*(1.-aBody);
  vec3 col = (scat*aBody*(1.-Fr)+env*Fr)/max(a, 1e-3)+glit*max(Fr, .12)/max(a, .12);
  // OUTSIDE THE MOUTH THE WATER IS THE SEA (seaLook, the one text SEA_GLSL that a world's own sea includes too, so no edge
  // shows where the sheet slips under it): its face, the emerald's tongue from the sill, its lace
  vec3 seaC = seaLook(q, V, seaFw(q), t, seaSwell(q, t));
  col = mix(seaC, col, inside); a = mix(1., a, inside);
  // (THE SWELL'S CREST IS NOT RULED, in the cave and on the sill alike (to 14 m before the mouth; the open sea beyond
  // has its own): along its length the crest is thin water, the dark under it coming up through it in patches)
  float mouthK = 1.-smoothstep(4., 14., P.z);
  col *= 1.-clamp(uHump.y*.45, 0., 1.)*smoothstep(.8, 1., eh)*(.16+.5*thinC)*mouthK;
  // white water. In open water only thin white lace: threads of foam drawn out by the flow, in loose fields (the cells of
  // the caustic tile, sharp); it is thick only where the swell's crest passes (a trough takes it away), where the water
  // piles and where the spout's foot boils. Where water meets rock, where it pours off a stump and where a trough leaves
  // it thin over a sand bank it is LACE too: broken, soft-edged clots and threads drawn into streaks by the flow, the
  // green showing through; thicker and reaching further where the surge piles against the back wall
  float crest = max(uHump.y, 0.)*eh*.22;                                      // (a trough keeps the foam it has)
  float pile = uPile*(1.-smoothstep(-86., -56., P.z))*.45;
  float boil = uSpout*(1.-smoothstep(2., 8., length(P.xz-vec2(0., -81.))));   // the spout's foot boils
  float fld = uFlood*inside;                                                   // THE FLOOD (setFlood)
  float amt = clamp(uFoam+crest+pile+boil+.1*fld, 0., 1.);
  vec2 flow = vec2(.12, .5)*t*(.4+amt);
  float f1 = fbm2(q*.42+flow*.6), f2 = fbm2(q*1.25-flow*.35+4.);
  float dens = f1*.62+f2*.5, lth = mix(.74, .5, amt);
  float bub = vn(q*6.+flow*2.)*.6+vn(q*15.-flow*1.3)*.4;
  float thick = smoothstep(lth, lth+.3, dens+(bub-.5)*.2*melt+(vn(q*2.7+flow*1.5)-.5)*.22);              // 0 open water .. 1 deep white water
  vec2 lq = q+flow*1.4+(vec2(f1, f2)-.5)*1.5;
  float ll = log2(max(max(sqrt(fwidth(P.x)*fwidth(P.z)), fwP*.35)*51.2, 1.));
  float lace = causTap(lq/5.+.13, ll+.2)+.8*causTap(vec2(.8*lq.x-.6*lq.y, .6*lq.x+.8*lq.y)/2.9+.61, ll+.99);
  float marb = smoothstep(lth-.16, lth+.1, dens)*clamp(lace*1.5, 0., 1.)*(.55+.45*smoothstep(.25, .75, bub));
  float pour = emerge*smoothstep(top-.15, top+.55, uWetLine)*smoothstep(.05, .4, top-P.y);
  float reach = .45+.45*amt+.45*pour+2.2*pile+.9*fld;
  float band = max(1.-smoothstep(.0, reach, shore+(vn(q*3.1+t*.6)-.5)*.3*reach), 1.-smoothstep(.02, .3, over));
  vec2 sq = vec2(q.x*1.6, q.y*.5)+flow*vec2(.5, 1.)+(vec2(f1, f2)-.5)*.8;                    // streaks: long down the nave, with the flow
  float froth = vn(sq*2.1)*.55+vn(sq*5.3+7.)*.3+bub*.15;
  float thr = clamp((causTap(sq/3.3+.27, ll+.3)+.7*causTap(vec2(.8*sq.x-.6*sq.y, .6*sq.x+.8*sq.y)/2.1+.43, ll+.9))*1.6, 0., 1.);
  float dn = band*(.4+.6*clamp(amt+pour, 0., 1.));
  float contact = max(smoothstep(.74-.3*dn, .9-.3*dn, froth+.25*thr)*(.45+.55*bub), thr*.75)*smoothstep(0., .25, band)*.9;
  // (ORDER 11: NO PALE MUD: thick foam is never a soft wash over the water. What there is of it is TORN into crisp clots
  // and streaks, long down the flow, the clear emerald between them: its amount is the share of the water it covers)
  // (and it is LACE AND CLOTS (tornFoam): a net of white threads drawn long by the flow, with small clots where the foam
  // is deep; never a flat white floe)
  float fwT0 = fwidth(q.x)*5.+fwidth(q.y)*.9, covT = thick*amt*amt;
  float thickT = tornFoam(vec2(q.x, q.y*.5)+flow*vec2(.4, .25)+(vec2(f1, f2)-.5)*.6, covT, ll, fwT0, bub);
  float foam = clamp(max(thickT, marb*mix(.5, .95, amt))*inside+contact, 0., 1.);       // (the open water's lace and thick foam are the cave's; the sea has its own white)
  // A CONTACT RING: where the water touches rock (a wall's foot, a stump that stands out of it) a thin ragged ring of
  // grey-white froth hugs the rock, a hand to a forearm wide: white is in every view inside. In the flood the pavement
  // is under white water
  // THE FLOOD (setFlood) IS WHITE WATER ON GREEN: rafts of torn foam streaming up the nave toward the back wall, long
  // down the flow, thick in their middles, torn to lace and drawn-out threads at their edges; at its fullest they lie
  // on some four tenths of the sheet, and the emerald (jade where the sun lies) stands plain and strong between them:
  // no wash over the whole
  vec2 fq = vec2(q.x, q.y+1.3*t)+(vec2(f1, f2)-.5)*2.2;
  // (ORDER 11: IT IS FOAM, NOT PALE MUD: the rafts are smaller (a couple of metres across, long down the flow), bright,
  // and TORN: each is broken into crisp clots and threads by its own grain, thick in its middle, the clear emerald
  // showing in its holes and between the rafts)
  float fm = fbm2(vec2(fq.x*.8, fq.y*.26)+9.)+.16*(vn(vec2(fq.x*2.1, fq.y*.7))-.5), fth = mix(.78, .585, fld);
  float raftF = smoothstep(fth-.05, fth+.09, fm);
  // (the tear is long down the flow: threads and small clots streaming along the nave; it melts by its own footprint
  // to the raft's mean cover)
  float flCore = fld > 0. ? tornFoam(vec2(fq.x, fq.y*.5), raftF, ll, fwT0, bub) : 0.;
  float flF = flCore*min(fld*4., 1.);
  foam = max(foam, flF*.97);
  float ringF = (1.-smoothstep(.06, .3+.4*vn(q*2.3+vec2(0., t*.4)), shore))*(.55+.45*bub)*inside*(1.-smoothstep(.25, .9, fwP));
  float pav = fld*(1.-smoothstep(.2, 1.9, mp.a*2.))*(.45+.55*thr);
  foam = max(foam, max(ringF*.8, pav*.9));
  // (the swell's crest carries lace in patches along its length, never a line of it)
  float crL = smoothstep(.93, .995, eh)*clamp(uHump.y*.45, 0., 1.)*smoothstep(.36, .66, vn(vec2(q.x*.37-t*.06, q.y*.14+11.)))*mouthK;
  // (its threads lie along the crest, drawn out by it, with soft clots between)
  float crT = clamp(causTap(vec2(q.x*.4+f1*.6, q.y*1.2-t*.25)/2.9+.37, ll+.4)*1.8, 0., 1.);
  foam = max(foam, crL*max(crT, .4*smoothstep(.45, .8, vn(vec2(q.x*1.3+t*.2, q.y*.5))))*(.55+.45*bub)*.85);
  // THE LIFT (setLift, 0..1): within the hump's half length round its place the sheet turns to white water with body: torn
  // foam with the green in its hollows, its veins racing toward the back wall
  float lift = uLift*eh*inside;
  vec2 lw = vec2(q.x*.9, q.y*.3+t*2.2)+(vec2(f1, f2)-.5)*1.2;
  float tn = vn(lw*1.3)*.5+vn(lw*3.1+5.)*.3+bub*.2+.3*causTap(vec2(q.x*1.5, q.y*.4+t*3.)/3.+.2, ll+.3);
  // (order 11: the lift's white is torn foam too, threads and clots racing up the nave: at half strength it lay on the
  // water as soft pale patches, the "muddy" ones)
  float torn = tornFoam(vec2(q.x, q.y*.5+t*1.1)+(vec2(f1, f2)-.5)*.6, smoothstep(.68-.3*lift, .86-.3*lift, tn)*min(lift*3., 1.), ll, fwT0, bub);
  foam = max(foam, torn);
  // it has body: its thickness turns the light (the slope of the thickness itself), and its thin edges let the green through
  float hgt = max(max(thickT, band*.9), max(torn, flF))*(.55+.45*bub);
  vec2 dH = vec2(dFdx(hgt), dFdy(hgt)); float det = dPx.x*dPy.y-dPx.y*dPy.x;
  vec2 gH = abs(det) > 1e-10 ? vec2(dPy.y*dH.x-dPx.y*dH.y, dPx.x*dH.y-dPy.x*dH.x)/det : vec2(0.);
  gH *= melt/max(1., length(gH)*.4);
  vec3 Nf = nrm(vec3(-gH.x*.7, 1., -gH.y*.7));
  vec3 Lmo = vec3(1.5, 10., 3.)-P; float dmo = dot(Lmo, Lmo), mouthI = 650./(650.+dmo); Lmo *= inversesqrt(max(dmo, 1e-4));
  vec4 sAw = shaftAt(P); vec3 Lsh = nrm(sAw.xyz+vec3(0., .7, 0.)); float shaftI = sAw.w*inside*1.2;
  vec3 gw = mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3, .5, .2))), .35);
  vec3 fl = uSkyCol*.55*mix(1., .5*day, inside)*(.55+.45*Nf.y)+uSunCol*(1.-inside)*.22*max(dot(Nf, uSunDir), 0.)+uSunCol*sJ*.16*(.3+.7*max(dot(Nf, uSunDir), 0.))
    +uMouthCol*inside*mouthI*(.3+.6*max(dot(Nf, Lmo), 0.))+shaftCol()*shaftI*(.35+.9*max(dot(Nf, Lsh), 0.))+gw*gz*(1.05+.25*max(flF, thickT))*(1.-.45*hgt);      // (the flood's clots are lit through from below: bright)
  col = mix(col, min(uFoamCol*.78*fl*mix(.92, .54+.62*bub, melt)*mix(1., 1.3+.15*max(flF, thickT), inside), vec3(.8)), foam);
  a = max(a, foam);
  // the sheet's rim: outside the mouth it dies away to nothing where the world's own sea takes over
  float rimM = length(vec2(P.x/16.5, max(P.z-2., 0.)/34.)), sea = 1.-smoothstep(.8, 1., rimM);
  a *= mix(sea, 1., inside*step(P.z, 0.));
  gl_FragColor = vec4(airMix(col, P, dist, inside), a);
}`;


// ---------------------------------------------------------------- white water: the stumps' runoff and the spout
// A ribbon pours from a stump's rim while the water stands below its top and the wet line (the highest recent level,
// trailing down at 0.3 m/s) is still above it: so the pavement drains from the top down as the level falls past it.
const RUNOFF_VERT = /* glsl */`
uniform float uTime, uLevel, uPile, uWetLine, uSea; uniform vec4 uHump;
attribute vec4 iR, iQ; varying vec4 vS; varying vec3 vP, vWp; varying vec2 vT;
float levelAt(float z){ float d = (z-uHump.x)/max(uHump.z, 1.); return mix(uLevel, uSea, smoothstep(2., 20., z)) + uHump.y*exp(-d*d) + uPile*(1.-smoothstep(-86., -56., z)); }
void main(){
  float s = position.x, t = position.y, seed = iQ.w;
  float lv = levelAt(iR.z), Hf = clamp(iR.y-lv, 0., iQ.z);
  // (A FALL ONLY WHERE WATER GATHERS AND LEAVES A TOP, by place: half the stumps pour; along the nave's foot east of
  // x = -11 (coming in from -13 to -9.5), two in five, and those falls a fifth wider (order 11c: eased from 1.35, so
  // that a veil keeps the clear air round the path: at its widest, at its foot, it is 2.03 of its stump's radius))
  float nearL = smoothstep(-13., -9.5, iR.x), pour = step(mix(.5, .6, nearL), fract(seed*7.31+.17));
  float a = smoothstep(.05, .4, iR.y-lv)*smoothstep(iR.y-2.2, iR.y+.2, uWetLine)*pour;      // (it pours while the level falls past the top and for some seconds after)
  float tau = t*sqrt(2.*Hf/9.81), veil = step(seed, .3);
  vec3 n = vec3(iQ.x, 0., iQ.y), tg = vec3(-iQ.y, 0., iQ.x);
  float w = iR.w*mix(.8, 1.25, smoothstep(0., 1., t))*mix(1., 1.35, veil)*mix(1., 1.2, nearL);        // (a little wider as it drops)
  vec3 P = vec3(iR.x, iR.y+.02, iR.z)+n*(.04+.75*tau)-vec3(0., 4.905*tau*tau, 0.)+tg*s*w*step(.004, a);
  vS = vec4(s, t*Hf, a, seed); vT = vec2(Hf, veil); vP = P;
  vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const RUNOFF_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec4 vS; varying vec3 vP, vWp; varying vec2 vT;
void main(){
  float s = vS.x, m = vS.y, a = vS.z, seed = vS.w, Hf = vT.x, vk = vT.y;
  if(a < .004) discard;
  float dist = length(cameraPosition-vWp);
  // ONE FALL WITH A SHAPE (order 11; before, two or three parallel ropes and a veil: a comb of stripes): a ROPE, or on
  // three stumps in ten a ragged VEIL: a smooth bright tongue a hand or two wide at the lip, widening as it drops, its
  // edges ragged, its middle wavering; it TEARS as it falls: first into strands, lower into drops; and where it lands
  // a white SPLASH. No two alike (place, width, raggedness and breaks by the stump's own number). Strands and drops melt
  // to their mean as a pixel grows past them, and a fall narrower than a pixel is drawn a pixel wide and as much thinner
  float fwS = fwidth(s), keep = 1.-smoothstep(.03, .12, fwS);
  float x = s-(.05*sin(m*2.1+seed*30.-uTime*3.5)+.035*sin(m*5.3+seed*11.-uTime*6.))*smoothstep(0., .5, m);
  float rag = mix(.5, vn(vec2(seed*37.+(x > 0. ? 5. : 0.), m*2.3-uTime*4.)), keep);
  float hw = mix(mix(.11, .2, vk), mix(.2, .38, vk), smoothstep(0., 1.3, m))*(.75+.5*rag);
  float thin = min(1., 2.*hw/max(fwS, 1e-4));
  float body = (1.-smoothstep(hw*.5, hw+fwS, abs(x)))*thin*(1.-pow(abs(2.*s), 6.));
  float tear = smoothstep(.08, 1.2, m)*mix(1., 1.4, vk);
  float stn = mix(.5, vn(vec2(x*31.+seed*50., m*.45-uTime*5.5))*.6+vn(vec2(x*73.+seed*9., m*.8-uTime*7.))*.4, keep);
  float drp = mix(.55, vn(vec2(x*26.+seed*3., m*6.-uTime*13.)), keep);
  // (a veil of strands about a whiter core: the core a rope two fingers thick that holds together for a metre or so
  // and then breaks into drops; the veil thin enough that the wet rock shows through it)
  float dens = mix(1., smoothstep(.3+.26*tear, .52+.26*tear, stn), min(tear*1.6, 1.))*mix(.95, .6, min(tear*1.3, 1.));
  dens *= mix(1., min(smoothstep(.3, .6, drp)*1.25, 1.), smoothstep(.8, 2.4, m));
  float xc = x-(vn(vec2(seed*19., m*1.7-uTime*3.))-.5)*hw*.5;
  float core = (1.-smoothstep(hw*.12, hw*.3+fwS, abs(xc)))*thin*mix(1., smoothstep(.3, .55, drp), smoothstep(.7, 2., m))*(1.-vk*.6);
  dens = max(dens, core/max(body, .05));
  float lip = 1.-smoothstep(0., .22, m), dE = Hf-m;
  // (the splash: a ragged puff of white a hand or two over the place where it lands; the fall itself thins into it, and
  // nothing ends on a ruled line)
  float sn = mix(.5, vn(vec2(s*8.+seed*7., uTime*7.+seed*3.)), keep), dQ = dE-.14-.1*sn;
  float sg = mix(.5, vn(vec2(s*23.+seed*7., m*11.-uTime*9.)), keep);
  float spl = exp(-dQ*dQ/.012)*smoothstep(.3, .6, sn*.5+sg*.5+.12)*(1.-smoothstep(hw*1.1, hw*2.+fwS, abs(x)))*(1.-pow(abs(2.*s), 4.))*smoothstep(.3, .7, Hf)*smoothstep(0., .07, dE);
  float fallA = clamp(body*dens*(1.-.45*smoothstep(1.5, 3.5, m))*(.2+.8*smoothstep(0., .3+.2*sn, dE))+spl*.7, 0., 1.)*a*smoothstep(0., .04, m+.015)*smoothstep(0., .05, dE);
  float inside = (1.-smoothstep(-4., 7., vP.z)), day = dayAt(vP);
  float gz = glowIn(vP.z);
  vec3 Lmo = vec3(1.5, 10., 3.)-vP; float mouthI = 650./(650.+dot(Lmo, Lmo));
  vec3 gw = mix(uGlowCol, vec3(dot(uGlowCol, vec3(.3, .5, .2))), .5);
  vec3 fl = uSkyCol*.35*day+uMouthCol*mouthI*.6+gw*gz*.8+shaftCol()*shaftAt(vP).w*.7+uSunCol*sunIn(vP)*.2;
  vec3 col = min(uFoamCol*.8*fl*(.7+.3*dens+.25*lip+.2*spl), vec3(.8));       // (bright at the lip, where the tongue is whole)
  gl_FragColor = vec4(airMix(col, vP, dist, inside), min(fallA, 1.)*.95);
}`;

// The spout: a tube of white ropes round the blowhole's axis, 2.5 m in radius at the foot and 4 m at the lip, open at both ends.
// It is drawn over its lowest 32 m only (it thins away from 22 m up, by its height: see the shader), and not at all at
// strength zero: no sight line from the line's last 60 m to the portal's disc meets a drawn part of it.
// uSpout is its strength, uSpoutHead how far up the axis (metres from the foot) its frayed head has climbed.
const SPOUT_VERT = /* glsl */`
attribute vec2 aS; varying vec2 vS; varying vec3 vP, vWp;
void main(){ vS = aS; vP = position; vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const SPOUT_FRAG = /* glsl */`
${GLSL_COMMON}
uniform float uSpoutHead;
varying vec2 vS; varying vec3 vP, vWp;
float vnw(vec2 p, float per){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); float x0 = mod(i.x, per), x1 = mod(i.x+1., per);
  return mix(mix(h21(vec2(x0, i.y)), h21(vec2(x1, i.y)), f.x), mix(h21(vec2(x0, i.y+1.)), h21(vec2(x1, i.y+1.)), f.x), f.y); }
float ridge(float v){ return 1.-abs(2.*v-1.); }
void main(){
  float u = vS.x, s = vS.y, t = uTime;
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
  float fw = fwidth(vP.x)+fwidth(vP.y)+fwidth(vP.z);
  // BY PLACE (the height s up the axis, never the lens's distance) the tube thins to NOTHING from 22 m up and is gone at
  // 32 m: the line rides the axis over its last 60 m, and from a lens at height sL on it a piece of the tube at height s,
  // r from the axis, stands on a sight line to the portal's disc (5.6 m, at 60 m) only if r*(60-sL) < 5.6*(s-sL): for no
  // s under 36.3 m with the lens on the line, under 32.2 m with the lens up to 0.6 m off it. So nothing drawn of the tube
  // can cross the disc. And it draws nothing at all at strength zero (no shaft, no film: the ropes are all there is)
  float thin = 1.-smoothstep(22., 32., s);
  // the spout: white water going up in ropes: broad rope-ways that start, swell and end as they climb, each a sheaf of thin
  // strands and racing streaks with a dense core; clots of it rise faster than the rest; open air between. Thin things melt to
  // their mean as a pixel grows over them: a white column with body where a pixel is large on it, streaks where it is small
  float tw = u+.008*sin(s*.23+t*1.3+u*12.566)+s*.0022;
  float r1 = ridge(vnw(vec2(tw*22., s*.028-t*1.6), 22.)*.6+vnw(vec2(tw*22.+7., s*.012-t*1.1), 22.)*.4);      // nearly straight: a rope drifts round the tube only slowly
  float r2 = ridge(vnw(vec2(tw*70.+3., s*.12-t*4.6), 70.));
  float r3 = vnw(vec2(tw*200., s*.5-t*8.), 200.);
  float fwU = fwidth(u)*19., fwS = fwidth(s);                                 // a pixel's reach across the ropes and along them
  float fine = 1.-smoothstep(.03, .12, fwU);
  float strands = mix(.3, max(smoothstep(.88, .985, r2), smoothstep(.7, .9, r3)*.85*(1.-smoothstep(.6, 2., fwS))), fine);
  float clot = .25+.75*smoothstep(.3, .7, vnw(vec2(tw*9., s*.22-t*5.), 9.));
  float way = smoothstep(.74, .9, r1), core = smoothstep(.92, .99, r1);
  float fleck = step(.93, vnw(vec2(tw*300., s*4.-t*20.), 300.))*.4*(1.-smoothstep(.01, .03, fwU))*(1.-smoothstep(.1, .3, fwS));
  float rope = clamp(way*(.15+.85*strands)*clot+core*.8+fleck, 0., 1.);
  float head = 1.-smoothstep(uSpoutHead-8.-5.*vnw(vec2(u*7., t*.6), 7.), uSpoutHead, s);
  float ar = rope*uSpout*head*smoothstep(-4., 2., s)*.94*thin;
  vec3 fl = shaftCol()*(.42+.5*smoothstep(0., 60., s))+uGlowCol*uGlowAmt*.45*exp(-max(s, 0.)/12.);
  vec3 cr = min(uFoamCol*.78*fl*(.45+.8*clamp(core+strands*.4*fine, 0., 1.)), vec3(.8));
  if(ar < .003) discard;
  gl_FragColor = vec4(airMix(cr, vP, dist, 1.), ar);
}`;


// The stand-in sea serves the set-piece viewer when no world drives the part (opts.sea !== false): one flat disc of dark
// northern water 0.2 m under uSea, cut away inside the cave and over the mouth's apron, where the part's own sheet rules.
// A world with its own ocean passes { sea: false }.
const SEA_VERT = /* glsl */`
uniform float uSea; varying vec3 vP, vWp;
void main(){ vec3 P = vec3(position.x, uSea-.2, position.z); vP = P; vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const SEA_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec3 vP, vWp;
void main(){
  vec3 P = vP;
  if(P.z < .5 && P.z > -92. && abs(P.x) < 20.5) discard;
  if(length(vec2(P.x*2.1, max(P.z-2., 0.))) < 21. && P.z > -1.) discard;
  vec3 Vv = cameraPosition-vWp; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-4);
  float fwP = fwidth(P.x)+fwidth(P.z);
  vec2 q = P.xz, o1 = vec2(uTime*.25, uTime*.4);
  vec3 col = seaLook(q, V, seaFw(q), uTime, seaSwell(q, uTime));                   // the same look the sheet wears before the mouth
  // the surf line along the plinth (the stand-in's own; a world's ocean reads depthAt for its shore)
  float ex = P.x/120., ez = (P.z+65.)/65.; ex *= ex; ez *= ez;
  float shoreD = (pow(ex*ex*ex+ez*ez*ez+1e-9, 1./6.)-1.)*66.-4.2;
  float surf = (1.-smoothstep(.2, 3.4, shoreD+.9*sin(uTime*.9+P.x*.11)))*step(-56., P.z);
  col = mix(col, min(uFoamCol*.7*(uSkyCol+uSunCol*.2), vec3(.8)), surf*smoothstep(.25, .6, fbm2(q*.9+o1*.5)+.35*surf));
  gl_FragColor = vec4(airMix(col, P, dist, 0.), 1.);
}`;

function buildWhiteWater(runoff, U) {
  // ribbons: 6 spans of 2 triangles
  const rp = [], ri = [];
  for (let k = 0; k <= 6; k++) rp.push(-0.5, k / 6, 0, 0.5, k / 6, 0);
  for (let k = 0; k < 6; k++) { const a = k * 2; ri.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const rg = new THREE.InstancedBufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
  const n = runoff.length, R = new Float32Array(n * 4), Q = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const r = runoff[i]; R.set([r.x, r.y, r.z, r.w], i * 4); Q.set([r.nx, r.nz, r.drop, r.seed], i * 4); }
  rg.setAttribute('iR', new THREE.InstancedBufferAttribute(R, 4)); rg.setAttribute('iQ', new THREE.InstancedBufferAttribute(Q, 4));
  rg.instanceCount = n; rg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-10, 0, -45), 40);
  const rm = new THREE.ShaderMaterial({ uniforms: U, vertexShader: RUNOFF_VERT, fragmentShader: RUNOFF_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const ribbons = new THREE.Mesh(rg, rm); ribbons.frustumCulled = false; ribbons.renderOrder = 3; ribbons.name = 'organ-cave-runoff';
  // spout tube
  const NS = 44, NR = 28, sp = [], sa = [], si = [];
  const e2 = new THREE.Vector3(0, AXD.z, -AXD.y);
  for (let k = 0; k <= NS; k++) {
    const s = -4 + 66 * (k / NS), r = lerp(2.5, 4.0, clamp(s / 60, 0, 1));
    for (let j = 0; j <= NR; j++) {
      const ph = (j / NR) * Math.PI * 2, c = Math.cos(ph) * r, d = Math.sin(ph) * r;
      sp.push(AX0.x + AXD.x * s + c, AX0.y + AXD.y * s + e2.y * d, AX0.z + AXD.z * s + e2.z * d); sa.push(j / NR, s);
    }
  }
  for (let k = 0; k < NS; k++) for (let j = 0; j < NR; j++) { const a = k * (NR + 1) + j, b = a + 1, c = a + NR + 1, d = c + 1; si.push(a, c, b, b, c, d); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aS', new THREE.Float32BufferAttribute(sa, 2)); sg.setIndex(si);
  sg.computeBoundingSphere();
  const sm = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SPOUT_VERT, fragmentShader: SPOUT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const spout = new THREE.Mesh(sg, sm); spout.frustumCulled = false; spout.renderOrder = 4; spout.name = 'organ-cave-spout';
  return { ribbons, spout, triangles: n * 12 + si.length / 3 };
}

// ---------------------------------------------------------------- the turf's fringe of long grass: tufts of two blades, instanced
// Along the cap's brow (front and returns) and round the blowhole's lip. iG: root x, y, z, height; iH: yaw, lean x, lean z, seed.
const GRASS_VERT = /* glsl */`
uniform float uTime;
attribute vec4 iG, iH; varying vec3 vP, vWp; varying vec2 vC;
float h11(float p){ p = fract(p*.1031); p *= p+33.33; p *= p+p; return fract(p); }
void main(){
  float bl = position.z, t = position.y, seed = iH.w;
  float yaw = iH.x+bl*2.1+seed*6., hgt = iG.w*(.7+.3*h11(seed*31.+bl*7.));
  vec2 dir = vec2(cos(yaw), sin(yaw));
  // a blade leans out over the edge and bows to the wind; gusts run through the fringe
  float gust = sin(uTime*1.9+iG.x*.31+iG.z*.23+seed*3.)*.5+sin(uTime*3.7+iG.x*.9+seed*11.)*.22;
  vec2 bow = iH.yz*(.3+.5*t)+vec2(.8, .25)*(.3+.3*gust)+dir*(h11(seed*13.+bl)-.5)*.5;
  float bend = t*t;
  vec3 P = iG.xyz+vec3(dir.x*position.x, 0., dir.y*position.x)+vec3(bow.x*bend*hgt, t*hgt*(1.-.25*bend*min(dot(bow, bow), 1.6)), bow.y*bend*hgt);
  vP = P; vC = vec2(t, h11(seed*77.+bl*3.));
  vec4 wp = modelMatrix*vec4(P, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const GRASS_FRAG = /* glsl */`
${GLSL_COMMON}
varying vec3 vP, vWp; varying vec2 vC;
void main(){
  float t = vC.x, dist = length(cameraPosition-vWp);
  vec3 alb = mix(mix(vec3(.05, .085, .025), vec3(.2, .24, .07), t), vec3(.3, .27, .13), step(.7, vC.y)*t*.8);
  vec3 col = alb*(uSkyCol*.9+uSunCol*(.22+.45*t));
  gl_FragColor = vec4(airMix(col, vP, dist, 0.), 1.);
}`;
async function buildGrass(ctx, ground, L, U, thick) {
  const G = [], H = [], rows = ground.browRows, NA = rows[1].length, dens = thick;      // thick: 1 the full fringe
  // the brow of the front and the returns
  let n = 0;
  for (let a = 0; a < NA; a++) {
    const a2 = (a + 1) % NA, p0 = rows[1][a], p1 = rows[1][a2];
    if (p0[5] > 0.6) continue;
    const count = Math.round(Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) * 5.2 * dens);
    for (let k = 0; k < count; k++, n++) {
      const f = L.hash(n, 911, 31), tr = 0.25 + 1.5 * L.hash(n, 912, 32), r0 = Math.min(1, Math.floor(tr)), ft = tr - r0;
      const A = rows[r0][a], B = rows[r0][a2], C = rows[r0 + 1][a], D = rows[r0 + 1][a2];
      const x = lerp(lerp(A[0], B[0], f), lerp(C[0], D[0], f), ft), y = lerp(lerp(A[1], B[1], f), lerp(C[1], D[1], f), ft), z = lerp(lerp(A[2], B[2], f), lerp(C[2], D[2], f), ft);
      const over = 1 - clamp(tr - 0.6, 0, 1);                             // those at the very edge hang out over it
      G.push(x, y - 0.12, z, 0.65 + 0.7 * L.hash(n, 913, 33)); H.push(L.hash(n, 914, 34) * 6.283, p0[3] * over, p0[4] * over, L.hash(n, 915, 35));
    }
    if (a % 40 === 39) await ctx.yield();
  }
  // round the blowhole's lip: the turf's own triangles there give each tuft its footing
  const pos = ground.pos, idx = ground.idx, tris = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c = idx[t + 2];
    if (a < ground.topFrom || a >= ground.topTo) continue;
    const cx = (pos[a * 3] + pos[b * 3] + pos[c * 3]) / 3, cz = (pos[a * 3 + 2] + pos[b * 3 + 2] + pos[c * 3 + 2]) / 3;
    if (Math.abs(cx) < 13 && cz < -89 && cz > -118) tris.push(a * 3, b * 3, c * 3);
    if (t % 30000 === 29997) await ctx.yield();
  }
  const heightAt = (x, z) => {
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t], b = tris[t + 1], c = tris[t + 2];
      const x1 = pos[b] - pos[a], z1 = pos[b + 2] - pos[a + 2], x2 = pos[c] - pos[a], z2 = pos[c + 2] - pos[a + 2], den = x1 * z2 - x2 * z1;
      if (Math.abs(den) < 1e-9) continue;
      const px = x - pos[a], pz = z - pos[a + 2], u = (px * z2 - x2 * pz) / den, v = (x1 * pz - px * z1) / den;
      if (u >= -1e-4 && v >= -1e-4 && u + v <= 1.0001) return pos[a + 1] + u * (pos[b + 1] - pos[a + 1]) + v * (pos[c + 1] - pos[a + 1]);
    }
    return null;
  };
  const e2y = AXD.z, e2z = -AXD.y, NL = Math.round(720 * dens);
  const axisAt = (x, y, z) => { const px = x - AX0.x, py = y - AX0.y, pz = z - AX0.z, sa = py * AXD.y + pz * AXD.z; return [Math.sqrt(Math.max(0, px * px + py * py + pz * pz - sa * sa)), sa]; };
  for (let k = 0; k < NL; k++, n++) {
    const ph = (k + L.hash(n, 916, 36)) / NL * Math.PI * 2, hh = L.hash(n, 917, 37), hgt = 0.6 + 0.7 * L.hash(n, 918, 38);
    // by place: neither a tuft's root nor its tip at its furthest lean (its full height up, 0.45 m toward the axis) comes
    // nearer the blowhole's axis than the chimney's own wall (6.3 m): nothing of the fringe stands before the portal's disc
    for (let rho = 6.7 + 1.6 * hh * hh, tries = 0; tries < 7; tries++, rho += 0.3) {
      const cx = Math.cos(ph) * rho, cs = Math.sin(ph) * rho;
      let s = 59, x = AX0.x + cx, y = 0, z = 0, g = null;
      for (let it = 0; it < 5; it++) {
        y = AX0.y + AXD.y * s + e2y * cs; z = AX0.z + AXD.z * s + e2z * cs;
        g = heightAt(x, z); if (g === null) break;
        s += (g - y) / AXD.y;
      }
      if (g === null) break;
      z = AX0.z + AXD.z * s + e2z * cs; g = heightAt(x, z); if (g === null) break;
      const sa = axisAt(x, g, z)[1], ax = AX0.x, az = AX0.z + AXD.z * sa;      // the axis' point abreast of the root
      let hx = ax - x, hz = az - z; const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
      const near = Math.min(axisAt(x, g - 0.12, z)[0], axisAt(x + hx * 0.45, g, z + hz * 0.45)[0], axisAt(x + hx * 0.45, g + hgt, z + hz * 0.45)[0], axisAt(x, g + hgt, z)[0]);
      if (near < 6.35) continue;
      G.push(x, g - 0.12, z, hgt); H.push(L.hash(n, 919, 39) * 6.283, -hx * 0.6, -hz * 0.6, L.hash(n, 920, 40));      // the rim's tufts lean back from the hole
      break;
    }
    if (k % 60 === 59) await ctx.yield();
  }
  // one tuft: two blades, each a tapering strip (3 triangles); position = (across, along 0..1, blade)
  const bp = [], bi = [];
  for (let b = 0; b < 2; b++) { const o = b * 5; bp.push(-0.05, 0, b, 0.05, 0, b, -0.032, 0.55, b, 0.032, 0.55, b, 0, 1, b); bi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); geo.setIndex(bi);
  geo.setAttribute('iG', new THREE.InstancedBufferAttribute(new Float32Array(G), 4)); geo.setAttribute('iH', new THREE.InstancedBufferAttribute(new Float32Array(H), 4));
  geo.instanceCount = G.length / 4; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 46, -50), 170);
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: GRASS_VERT, fragmentShader: GRASS_FRAG, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.name = 'organ-cave-grass';
  return { mesh, tufts: G.length / 4, triangles: G.length / 4 * 6 };
}

// ---------------------------------------------------------------- the stand-in breathing serves the set-piece viewer when no world drives the part
const DEMO_T = 16, DEMO_HI = 2.6, DEMO_LO = -2.5, WET_FALL = 0.3;
function demoLevel(t) {
  const p = ((t % DEMO_T) + DEMO_T) % DEMO_T;
  if (p < 4.5) return DEMO_HI;
  if (p < 8) return lerp(DEMO_HI, DEMO_LO, sstep(0, 1, (p - 4.5) / 3.5));
  if (p < 13) return DEMO_LO;
  return lerp(DEMO_LO, DEMO_HI, sstep(0, 1, (p - 13) / 3));
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map((c) => new THREE.Color(c));
  const S = { n2: ctx.noise.n2, o1: rng.range(0, 90), o2: rng.range(0, 90), o3: rng.range(0, 90), o4: rng.range(0, 90), h0: rng.range(0, 500) };
  const F = makeForm(S), L = makeLattice(S);
  await ctx.yield();
  const ref = await makeRef(ctx);
  await ctx.yield();

  // ---- uniforms: one set for every material of the piece
  const lit = (c, k) => new THREE.Vector3(c.r * k, c.g * k, c.b * k);
  const peak = (c, p) => { const m = Math.max(c.r, c.g, c.b, 1e-4); return new THREE.Vector3(c.r / m * p, c.g / m * p, c.b / m * p); };
  const U = {
    uTime: { value: 0 }, uLevel: { value: 0 }, uWetLine: { value: 0 }, uGlowAmt: { value: 1 }, uFoam: { value: 0.3 }, uPile: { value: 0 },
    uSpout: { value: 0 }, uSpoutHead: { value: 62 }, uSea: { value: 0 }, uHump: { value: new THREE.Vector4(60, 0, 16, 0) },
    uSunDir: { value: new THREE.Vector3(0.42, 0.74, 0.52).normalize() }, uSunCol: { value: lit(new THREE.Color('#FFF6E8'), 2.6) },
    uSkyCol: { value: lit(new THREE.Color('#8FA9BC'), 0.95) }, uMouthCol: { value: new THREE.Vector3(2.7, 2.9, 3.0) }, uShaftCol: { value: new THREE.Vector3(1.25, 1.7, 2.2) },
    uGlowCol: { value: peak(pal[1], 1.3) }, uBasalt: { value: peak(pal[0], 0.1) }, uPink: { value: lit(pal[3], 1) }, uOchre: { value: lit(pal[4], 1) },
    uBarn: { value: lit(pal[5], 0.34) }, uIvory: { value: new THREE.Vector3(0.36, 0.42, 0.33) }, uDeep: { value: lit(pal[2], 3.2) }, uFoamCol: { value: lit(pal[5], 1) },
    uAirCol: { value: lit(new THREE.Color('#C9D6D8'), 1) }, uAirDen: { value: 0.0012 }, uSeaBody: { value: new THREE.Vector3(0.02, 0.06, 0.07) }, uSeaK: { value: 0 }, uWind: { value: 0.35 }, uLift: { value: 0 }, uFlood: { value: 0 },
    uSeaZen: { value: new THREE.Vector3(0.2, 0.35, 0.6) }, uSeaMid: { value: new THREE.Vector3(0.5, 0.6, 0.7) }, uSeaHor: { value: new THREE.Vector3(0.8, 0.84, 0.85) }, uSeaScat: { value: new THREE.Vector3(1, 0.95, 0.85) },
    uSeaScatDir: { value: new THREE.Vector3(0, 1, 0) }, uSeaP: { value: new THREE.Vector4(1, 4, 0, 8) }, uSeaQ: { value: new THREE.Vector4(1, 1, 0, 0) },
    uMap: { value: null }, uRect: { value: new THREE.Vector4(WX0, WZ0, WX1 - WX0, WZ1 - WZ0) }, uCaus: { value: null },
  };
  U.uCaus.value = await bakeCaustics(ctx, L);
  await ctx.yield();

  // ---- the columns
  const deal = await dealColumns(ctx, F, L, S, ref, detail);
  await ctx.yield();
  // the two stacks out at sea: 14 m of columns 60 m either side of the line
  const stacks = [[63, 46], [-57, 60]];
  for (const [cx, cz] of stacks) {
    const R = 5.2, i0 = Math.round(cx / PITCH), j0 = Math.round(cz / (PITCH * 0.866));
    for (let j = j0 - 7; j <= j0 + 7; j++) for (let i = i0 - 6; i <= i0 + 6; i++) {
      const p = L.point(i, j), d = Math.hypot(p[0] - cx, p[1] - cz) / (R * (1 + 0.25 * S.n2(p[0] * 0.3 + S.o1, p[1] * 0.3)));
      if (d > 1) continue;
      const h = L.hash(i, j, 3), top = Math.max(1.5, 14 * (1 - 0.75 * d * d) - 3 * h * h - (L.hash(i, j, 4) < 0.2 ? 4 : 0));
      deal.far.push({ x: p[0], z: p[1], y0: FOOT, y1: top, P: L.cell(i, j), seed: h * 0.97 + 0.015, top: 1, bot: 0, indoor: 0, joint: 0.4 + 0.8 * L.hash(i, j, 5) });
      deal.lists.ledges.push([p[0], top, p[1]]);
    }
    await ctx.yield();
  }
  // (both sides are drawn: where a sight line slips through a hairline between pipes it ends on the dark back of the rock
  // behind, never on the sky beyond the headland)
  const colMat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: COLUMN_VERT, fragmentShader: COLUMN_FRAG, side: THREE.DoubleSide });
  const root = new THREE.Group(); root.name = 'organ-cave';
  const R8 = [[-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [2, -1], [2, 1], [3, 0]], R4 = [[-1, 0], [1, -1], [1, 1], [3, 0]], R2 = [[-1, 0], [3, 0]];
  const sets = [['near', prismGeometry(R8, 'cup'), deal.near, 119], ['stump', prismGeometry(R4, 'cup'), deal.stump, 63], ['roof', prismGeometry(R2, 'under'), deal.roof, 35], ['far', prismGeometry(R2, 'fan'), deal.far, 21]];
  const stats = { instances: {}, triangles: {}, calls: 0, minClear: deal.lists.minClear, dropped: deal.lists.dropped };
  for (const [name, geo, list, tris] of sets) {
    fillInstances(geo, list);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, -50), 190);
    const mesh = new THREE.Mesh(geo, colMat); mesh.frustumCulled = false; mesh.name = 'organ-cave-' + name; root.add(mesh);
    stats.instances[name] = list.length; stats.triangles[name] = list.length * tris; stats.calls++;
    await ctx.yield();
  }

  // ---- cap, plinth and sand
  const ground = await buildGround(ctx, F, S, L);
  const groundMesh = new THREE.Mesh(ground.geometry, new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, side: THREE.DoubleSide }));
  groundMesh.frustumCulled = false; groundMesh.name = 'organ-cave-ground'; root.add(groundMesh);
  stats.triangles.ground = ground.triangles; stats.calls++;
  await ctx.yield();
  // (order 12: fallen drums, sods and tussocks, a mesh of their own in the ground's material; not in the count below)
  const extras = await buildExtras(ctx, L, ground);
  { const mesh = new THREE.Mesh(extras.geometry, groundMesh.material); mesh.frustumCulled = false; mesh.name = 'organ-cave-ground-added'; root.add(mesh); }
  stats.triangles.added = extras.triangles; stats.instances.drums = extras.drums; stats.instances.sods = extras.sods; stats.instances.tussocks = extras.tufts; stats.calls++;
  await ctx.yield();
  // the fringe gives way when a seed deals many columns: without order 12's added mesh the part stays under 292,000
  // triangles (280,688 to 291,351 counted over seventeen seeds); with that mesh it is 288,852 to 300,663
  const spent = stats.triangles.near + stats.triangles.stump + stats.triangles.roof + stats.triangles.far + ground.triangles + 32 * 96 * 2 + 6200 + 48;
  const grass = await buildGrass(ctx, ground, L, U, (0.5 + 0.5 * detail) * clamp((292000 - spent) / 6 / 2750, 0.35, 1));
  root.add(grass.mesh); stats.triangles.grass = grass.triangles; stats.instances.grass = grass.tufts; stats.calls++;
  await ctx.yield();

  // ---- the water sheet and its baked map
  const bodies = [];
  for (const q of deal.stump) bodies.push({ x: q.x, z: q.z, r: q.P.rmean, top: q.y1, wall: q.y1 > 5 });
  for (const q of deal.near) if (q.y0 < 6) bodies.push({ x: q.x, z: q.z, r: q.P.rmean, top: 8, wall: true });
  for (const q of deal.far) if (q.y0 < 6 && q.z < WZ1 + 3 && q.x > WX0 - 3 && q.x < WX1 + 3) bodies.push({ x: q.x, z: q.z, r: q.P.rmean, top: q.y1, wall: q.y1 > 5 });
  U.uMap.value = await bakeMap(ctx, F, bodies);
  await ctx.yield();
  const wg = new THREE.PlaneGeometry(WX1 - WX0, WZ1 - WZ0, 32, 96);
  await ctx.yield();
  wg.rotateX(-Math.PI / 2); wg.translate((WX0 + WX1) / 2, 0, (WZ0 + WZ1) / 2);
  wg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-2, 0, -25), 75);
  const water = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false }));
  water.frustumCulled = false; water.renderOrder = 2; water.name = 'organ-cave-water'; root.add(water);
  stats.triangles.water = 32 * 96 * 2; stats.calls++;
  await ctx.yield();

  if (opts.sea !== false) {
    const sg = new THREE.CircleGeometry(1400, 48); sg.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 }));
    sea.frustumCulled = false; sea.name = 'organ-cave-stand-in-sea'; root.add(sea); stats.triangles.sea = 48; stats.calls++;
  }

  // ---- runoff ribbons (thinned by detail) and the spout
  const rr = rng.fork('runoff');
  const pick = rr.shuffle(deal.lists.runoff.slice()).slice(0, Math.round(300 * (0.5 + 0.5 * detail)));
  for (const r of pick) r.seed = rr();
  const ww = buildWhiteWater(pick, U);
  root.add(ww.ribbons, ww.spout); stats.triangles.whiteWater = ww.triangles; stats.calls += 2;
  stats.triangles.total = Object.values(stats.triangles).reduce((a, b) => a + b, 0);
  await ctx.yield();

  // ---- anchors (local space)
  // each kind its own stream, all forked from the one 'anchors' stream (the part draws from ctx.rng exactly as often as before:
  // a world's own streams, forked after the part is built, stay as they were)
  const ar = rng.fork('anchors'), arSeal = ar.fork('seals'), arKit = ar.fork('kittiwakes'), arChim = ar.fork('chimney-ledges'), arDrip = ar.fork('drips');
  const spaced = (cands, n, gap) => { const out = []; for (const c of cands) { if (out.length >= n) break; if (out.every((o) => Math.hypot(o[0] - c[0], o[2] - c[2]) >= gap)) out.push(c); } return out; };
  const st = deal.lists.stumps;
  const seals = spaced(arSeal.shuffle(st.filter((s) => s.y > -2.7 && s.y < -0.4 && s.x > -12.5).map((s) => [s.x, s.y, s.z])), 12, 2.1);
  const shags = spaced(st.filter((s) => s.y > 2.8).sort((a, b) => b.y - a.y).map((s) => [s.x, s.y, s.z]), 9, 1.25);
  const kitti = spaced(arKit.shuffle(deal.lists.ledges.filter((p) => p[1] > 7)), 60, 2.2).concat(spaced(arChim.shuffle(deal.lists.chimLedges.filter((p) => p[1] > 14)), 40, 1.8));
  const drips = spaced(arDrip.shuffle(deal.lists.roofEnds.slice()), 48, 3);
  // (order 12: the colonnade's relief, by place; a body that carries a kittiwake's seat is left where it was dealt.
  // One hand-back to the engine before it, and one every 256 bodies within it)
  await ctx.yield();
  stats.instances.relief = await dealRelief(ctx, F, S, L, deal, sets, kitti);
  const kelp = [];
  for (const s of st) if (s.y < -0.8) kelp.push([s.x, s.y, s.z]);
  for (let x = -112; x <= 112; x += 2.6) { if (Math.abs(x) < 13) continue; const z = F.frontZ0(x) - F.FRONT_SHIFT + 6 - 0.8 * F.faceBackU(x) + 1.2 * S.n2(x * 0.2, 4.4); kelp.push([x, -0.6 + 1.2 * S.n2(x * 0.31, 9.9), z]); }
  const anchors = {
    path: ref.pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])),            // the flown line's points (flownPoints): brief, bend, straight
    portal: PORTAL.clone(), portalDir: AXD.clone(),                           // the seat in the lip, and the way the line leaves through it
    lip: { center: PORTAL.clone(), radius: 6.3, axisFoot: AX0.clone(), axisDir: AXD.clone() },
    mouthFoot: new THREE.Vector3(0, 0, 0), mouthTop: new THREE.Vector3(0, 24, 0),
    jamb: new THREE.Vector3(8.4, 0, 1.2), jambTop: new THREE.Vector3(8.4, 15, 1.2),   // the east jamb, where the wave bursts
    choir: new THREE.Vector3(-4, 0, -45), bell: new THREE.Vector3(0, 15, -84), backWall: new THREE.Vector3(0, 0, -88),
    seals: seals.map((p) => new THREE.Vector3(p[0], p[1], p[2])), shags: shags.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    kittiwakes: kitti.map((p) => new THREE.Vector3(p[0], p[1], p[2])), drips: drips.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    kelp: kelp.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    stumps: st.map((s) => ({ x: s.x, y: s.y, z: s.z, r: s.r, cup: s.cup })),
    stacks: stacks.map(([x, z]) => new THREE.Vector3(x, 14, z)),
    sheet: { x0: WX0, x1: WX1, z0: WZ0, z1: WZ1 },
  };

  // ---- hooks: the level is the world's
  let driven = false, level = 0, wet = 0, wetSet = null, airSet = false, lastTime = null, follow = false, seaSet = false;
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const hooks = {
    setLevel(y) { if (!driven) { driven = true; wet = Math.max(wet, y); U.uHump.value.y = 0; U.uPile.value = 0; U.uSpout.value = 0; U.uFoam.value = 0.3; } level = y; },
    setWetLine(y) { wetSet = (y === null || y === undefined) ? null : y; },
    setSwell(zCrest, height, halfLength = 16) { U.uHump.value.set(zCrest, height, Math.max(8, halfLength), 0); },
    setPile(h) { U.uPile.value = h; },
    setSpout(strength, head = 62) { U.uSpout.value = clamp(strength, 0, 1); U.uSpoutHead.value = head; },
    setFoam(a) { U.uFoam.value = clamp(a, 0, 1); },
    setGlow(a) { U.uGlowAmt.value = a; },
    setLight(o = {}) {
      const set = (u, c, k) => { if (c !== undefined) { const col = new THREE.Color(c); u.value.set(col.r * k, col.g * k, col.b * k); } };
      if (o.sunDir) U.uSunDir.value.copy(o.sunDir).normalize();
      set(U.uSunCol, o.sun, o.sunIntensity ?? 2.6); set(U.uSkyCol, o.sky, o.skyIntensity ?? 0.95); set(U.uMouthCol, o.mouth, o.mouthIntensity ?? 3); set(U.uShaftCol, o.shaft, o.shaftIntensity ?? 2.2);
    },
    // left off, the piece keeps its own lights (setLight). Turned on, it takes the sun from the scene's first DirectionalLight and
    // the sky from its first HemisphereLight each frame, and makes the mouth's and the shaft's light out of those two
    followLights(on = true) { follow = !!on; },
    setAir(color, density) { airSet = true; const c = new THREE.Color(color); U.uAirCol.value.set(c.r, c.g, c.b); U.uAirDen.value = density; },
    levelAt(z) { const h = U.uHump.value, d = (z - h.x) / Math.max(h.z, 1); return lerp(U.uLevel.value, U.uSea.value, sstep(2, 20, z)) + h.y * Math.exp(-d * d) + U.uPile.value * sstep(-56, -86, z); },
    setSea(y) { U.uSea.value = y; },
    setWind(w) { U.uWind.value = clamp(w, 0, 1); },
    setLift(k) { U.uLift.value = clamp(k, 0, 1); },
    setFlood(k) { U.uFlood.value = clamp(k, 0, 1); },
    setSeaBody(color) { if (color === null || color === undefined) { seaSet = false; return; } seaSet = true; const c = new THREE.Color(color); U.uSeaBody.value.set(c.r, c.g, c.b); },
    floorAt: F.floorAt, ceilAt: F.ceilAt, topAt: F.topAt, wetLine: () => U.uWetLine.value,
    // how much of the cave's own sheet is left at (x, z) outside the mouth: 1 where it lies whole at the water's level, falling to
    // 0 where it has slipped away under the open sea (the same numbers as the sheet's shader). A world's ocean must cover every
    // place where this is under 1, and may end anywhere it is 1
    sheetAt(x, z) { if (z <= 0) return Math.abs(x) < 9.5 ? 1 : 0; return 1 - sstep(0.6, 0.9, Math.hypot(x / 16.5, Math.max(z - 2, 0) / 34)); },
    // metres of open sea at (x, z) for a world's own ocean: negative on the headland and over the mouth's apron, where this sheet rules
    depthAt(x, z) {
      if (F.inFoot(x, z)) return -5;
      if (z > -1 && Math.hypot(x * 2.1, Math.max(z - 2, 0)) < 21) return -1;
      return clamp(1.3 * ((F.foot(x, z + F.FRONT_SHIFT) - 1) * 66 - 4.6), -6, 30);
    },
  };
  root.userData.organCave = hooks; root.userData.anchors = anchors;

  function update(dt, time) {
    U.uTime.value = time;
    if (!driven && opts.demo !== false) {
      // the stand-in breath: 16 s, worked out from the time alone (no state)
      level = demoLevel(time); let w = level;
      for (let k = 1; k <= 60; k++) w = Math.max(w, demoLevel(time - k * 0.4) - WET_FALL * k * 0.4);
      wet = w;
      const p = ((time % DEMO_T) + DEMO_T) % DEMO_T, fl = sstep(12, 13.5, p) * (1 - sstep(15.5, 16, p));
      U.uHump.value.set(lerp(34, -86, clamp((p - 12) / 4.5, 0, 1)), 1.3 * fl, 16, 0);
      const pk = p < 3 ? Math.sin(Math.PI * p / 3) : 0;
      U.uPile.value = 1.4 * Math.max(pk, sstep(15, 16, p)); U.uSpout.value = Math.pow(pk, 0.6); U.uSpoutHead.value = 62;
      U.uFoam.value = 0.28 + 0.45 * Math.max(fl, pk);
    } else {
      const step = lastTime === null ? 0 : clamp(time - lastTime, 0, 0.25);
      wet = Math.max(level, wet - WET_FALL * step);
    }
    lastTime = time;
    U.uLevel.value = level; U.uWetLine.value = wetSet === null ? wet : wetSet;
    if (!airSet) {
      // the air is the scene's: follow its fog, if it has one of the exponential kind
      let s = root; while (s.parent) s = s.parent;
      if (s.fog && s.fog.isFogExp2) { U.uAirCol.value.set(s.fog.color.r, s.fog.color.g, s.fog.color.b); U.uAirDen.value = s.fog.density; }
    }
    // outside the mouth the sheet wears the sea's face (seaFace) over the body a world hands it by setSeaBody; left alone,
    // the part's own dark sea under the part's own sky. (Nothing is looked for in the scene, and nothing here counts frames)
    if (!seaSet) { const d = U.uDeep.value, k = U.uSkyCol.value, q = U.uSunCol.value; U.uSeaBody.value.set(d.x * 0.5 * (k.x * 1.3 + q.x * 0.05), d.y * 0.5 * (k.y * 1.3 + q.y * 0.05), d.z * 0.5 * (k.z * 1.3 + q.z * 0.05)); }
    if (follow) {
      let s = root; while (s.parent) s = s.parent;
      let sun = null, hemi = null;
      for (const o of s.children) { if (o.isDirectionalLight && !sun) sun = o; else if (o.isHemisphereLight && !hemi) hemi = o; }
      if (sun) {
        tmpA.setFromMatrixPosition(sun.matrixWorld); tmpB.setFromMatrixPosition(sun.target.matrixWorld); tmpA.sub(tmpB);
        if (tmpA.lengthSq() > 1e-8) U.uSunDir.value.copy(tmpA).normalize();
        U.uSunCol.value.set(sun.color.r, sun.color.g, sun.color.b).multiplyScalar(sun.intensity);
      }
      if (hemi) U.uSkyCol.value.set(hemi.color.r, hemi.color.g, hemi.color.b).multiplyScalar(hemi.intensity * 0.8);
      const k = U.uSkyCol.value, q = U.uSunCol.value;
      U.uMouthCol.value.set(k.x * 4 + q.x * 0.6, k.y * 4 + q.y * 0.6, k.z * 4 + q.z * 0.6);
      U.uShaftCol.value.set(k.x * 4.6, k.y * 4.6, k.z * 4.6);
    }
    void dt;
  }
  update(0, 0);

  return {
    object: root, radius: 125, height: 60, center: new THREE.Vector3(0, 16, -40), anchors,
    update, dispose() {}, ground: false, groundY: 0,
    uniforms: U, stats, ...hooks,
  };
}
