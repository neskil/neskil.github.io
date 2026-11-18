// CAPTION, accepted with the build note: Ancient writers give its maker, its bronze and its height of seventy cubits; where it stood, how it posed and what it wore are one reading among several.
// The Colossus of Rhodes: sunrise on a summer festival morning about 275 BC. In at deck height between the mole heads and
// across the great harbour, through the gate of the harbour wall, up a straight climbing avenue with the bronze Helios at
// its head, under the roofed porch of his court and up before him to the height of his chest. The statue and its base are
// src/parts/colossus-of-rhodes.js.
//
// BROUGHT IN: cHash, pHash, mHash and fHash, a variant in two components on the constants of Hash without Sine
// (David Hoskins, 2014, MIT). At CITY_GLSL, propMaterial, mirrorMaterial and foamMaterial.
// (The line was set at round r9's freeze, in comments only, under the owner's section 181: the four stand in r7t
// to the letter, and rounds r8 and r9 brought nothing in.)
//
// ROUNDS r8 AND r9. These lines were written on 16 Oct 2026, before round r9 was frozen and before its deciding
// sheets against r7t were drawn. r7t is the round live as these lines are written; "step A" is round r8's second
// kept step, the file round r9 was built on. The papers named lie under shots/colossus-of-rhodes and design/sw/notes.
//
// SAID FIRST, IN THE STRANGERS' WORDS (the owner's section 180; colossus-r9-ruling.txt, point 4). Of the six strangers
// of round r9's blind preview two named the bales' wrapper in shade on the round's side, at seed 21, u 0.16: "some
// crates in the lower right stack have an odd greenish-grey face beside the orange ones" and "crate stack at right
// has uneven orange and grey-green patches on its faces". Each named the same stack on step A's side of that pair
// too ("blank pale grey crate blocks at lower left and lower right", "crates at far left and at right are flat
// blank grey-white boxes"), so by the rule written before the build no step was booked. It is not mended:
// DEPARTURES a, below. A third stranger named another thing on the round's side, at seed 7, u 0.18: "jars at bottom centre are very dark and partly cut off by the frame edge"; on step A's side of that pair the stranger named the same place ("dark red spiky lump at bottom centre with no jar shapes"), so by the same rule no step was booked. It is not mended either: DEPARTURES e, below.
//
// NOT CURED, SAID BEFORE WHAT THE ROUNDS KEEP:
// - THE STREET'S FLOOR (second on the owner's list after round r7: the dark, plain floor of the street run) IS r7t's
//   TO THE LETTER. Its mean in shade was and is 37.2, 25.8 and 27.9 of 255 at u 0.43, 0.61 and 0.70 (OF THE PICTURE:
//   seed 7, 640 by 360). Round r8 built three forms of a cure and none is in this file. Step F (a thrown light on
//   level ground and a paler worn band) went to four strangers: the step 16, r7t 8, but r7t 3 to 1 at the square
//   (u 0.61). Its four mends (the thrown light by place, modest or fuller; the worn way 1.20 or 1.40 times paler)
//   went blind to twelve strangers, 96 judgements: a mend 34, same 10, r7t 52; at the square r7t 30 of 36; four
//   strangers called the houses' shade broken on a mend's side only (it seemed to end at the kerb or partway down
//   the street); the most modest mend was told from r7t and r7t preferred, 12 to 6. Form W (the worn way as paler
//   stone alone) went to no stranger: to the lead's eye a bar of sun across it at the square stood less strongly
//   than r7t's. What the three taught: light added in the shade takes the dawn out of the square, and one even
//   paler lane reads as laid on the floor (colossus-r8-floor-ruling.txt).
// - NO SOFT SHADE of the sky's light lies under people, posts and things in the street: studied on paper in r8
//   (r8/build/k-study.txt), not built.
// - THE SACKS' FORM IS r7t's. Round r8's step S (the sack as a slumped loaf, a tied sack, bound bales) was built and
//   is NOT kept: of 30 judgements by six strangers it had 25 and step A 1, for its warm colours, but three of the
//   six called its low heap of sacks beside the way pale blank blocks or bare stone, on its side only
//   (colossus-r8-s-ruling.txt). Round r9 takes that step's bale, two lines mended, and leaves its sack: the sacks
//   here are r7t's blocks in a warmer cloth.
// - THE BALCONIES' BRACES whose foot hangs in the air of an open shop mouth (1,402 on seeds 1 to 200, OF THE LAW)
//   are r7t's: two cures were measured in r8 (the brace left out; its foot moved to the jamb) and neither was clean.
//
// WHAT ROUND r8 KEEPS, two steps (its floor steps and its step S are not in this file):
// - H, HOUSEKEEPING AND THE PURSE. NO PIXEL MOVED: 36 of 36 stills equal to r7t's by pixels (seeds 7, 21 and 67).
//   The quay's lots are written from the plan's and the gate round's own lines wherever the sum is the typed number
//   to the last bit; the courts' range ends and the doves' south ring stay typed, and their comments say that no
//   reason by place is known for them; his middle and the line of his jaw are read from the part. TAKEN OUT OF THE
//   DRAWING: the statue's shade (the part's skin for the sun's depth map, 9,737 triangles) is no longer sent to the
//   picture's pass, where it wrote nothing, at any place; and it is cast into the map only while his box meets the
//   sun's box, so that the same 9,737 are no longer sent there in vain. About u 0.13 to 0.21 is where they WERE sent in vain before (the shade lay wholly outside the sun's box there); it is no longer cast there.
//   TYPED: in lifeOf at THE LOTS' MEASURES, at THE SOUTH RING'S FOUR FIGURES and at THE RANGES' ENDS; over DAWN_GLSL
//   at THE BOX'S NUMBERS; over flightOf and in build() (his middle and the line of his jaw read from the part; THE
//   STATUE'S SHADE IS CAST ONLY WHILE HIS BOX MEETS THE SUN'S BOX, set in placeShadow); in the part at its mesh
//   'shade' and at info.looks.
// - A, THE AWNINGS: ONE RULE FOR BOTH STREETS, the lower as the upper. In r7t the cloth of an older shop's awning
//   ran through the floor of its own house's balcony: 711 awnings on seeds 1 to 200 (the lower street 252 of 1,292,
//   the upper 459 of 729; OF THE LAW). Now none does on seeds 1 to 1000: the cloth is cut round the floor by the
//   floor's place, one sheet of 16 triangles as before. AS r7t HAS THEM: the outer edge, the bar, the struts, the
//   dye and the stir, and the braces (above). SAID: an awning whose span ends within 0.15 m of a floor's end, which
//   r7t had clear of the floor, is drawn back 0.15 m clear and its bar's end stands bare; beside a floor's end the
//   slit can be seen close by as a small notch. The rule stands in avenueAfter at THE AWNING AND THE BALCONY.
//
// WHAT ROUND r9 ADDS: THE QUAY AS A WORKING HARBOUR FRONT. Seven steps on step A, all in the one mesh 'harbour front'
// (buildQuayThings, handCart, jarQ, bale; the deal in lifeOf gains only the mark "edge" on the kerb's two small
// lots), each by kind and place: nothing reads the eye, u, the clock or the seed, no stream draws once more or
// less, no call, mesh, material, light or texture is added, and nothing else in the world moves.
// B THE BALES: bound bales in a jute wrapper under tarred girths, the dye of the cloth inside at their two ends,
//   where r7t has pale boxes under cords (the cargo's stacks, the way's lots of three, the landing's lot three high).
// K THE SACKS' CLOTH: r7t's blocks in place and size, in a warmer cloth; the cargo's and the lots' sacks each darker
//   at its foot, a hand cart's three plain.
// J THE JAR STAND AND THE LOTS' JARS: a jar with a neck, a paler lip and a dark mouth; the landing's jars in two
//   tiers stand on a stand of two floors of planks on four posts, twelve below and six above; in a way's lot of ten
//   the two rows stand 0.4 m apart; on stand and lot no jar stands in another (in step A they did, by up to 10.8 cm).
// T THE TIMBER: the landing's baulks are squared, their long faces unbroken (the planks' joints cut step A's into
//   blocks), their sawn ends a step lighter; they and the cargo's stacks of timber stand in the quay's wood.
// C THE HAND CART: in the quay's wood; each wheel a pale disc of planks in its dark tread, the axle's dark end its hub.
// M THE TWO MOORING POSTS AND THE STALL'S FRAME: in the quay's wood (else the darkest things beside the rest).
// W THE SAME JAR ON THE HAND CARTS AND AT THE KERB, WITH ITS PAY: a loaded cart's six jars and the jars of the kerb's
//   two small lots are the necked jar, at five sides; the kerb's 78 mooring stones stand at five sides for six,
//   which pays for them (234 triangles fewer on every seed).
// WHERE EACH STEP IS TYPED (each place carries a comment marked r9): the two colours JUTE and QWOOD in the line of
// colours that holds CLAY and SACK; the two forms jarQ and bale before buildQuayThings. In buildQuayThings, the
// cargo list: B its bales (kind 3), K its sacks (kind 1), T its stacks of timber (kind 2, the last branch), W its
// jars by threes (kind 0, by the lot's mark edge). In buildQuayThings, the way's lots and the landing's: J the jars
// in two rows (kind 0) and the stand (kind 5), K the sacks (kind 1), B the bales by threes (kind 2) and three high
// (kind 8, the last branch), T the baulks (kind 6); after them M the stall's frame and the two mooring posts and W
// the mooring stones. In handCart: C its wood and wheels, K its three sacks, W its six jars. In lifeOf at THE LOTS:
// W the mark edge.
// WHAT IT INVENTS stands below, after round r7's list (OURS, INVENTED: WHAT ROUND r9 TYPES AT THE QUAY).
//
// WHERE ROUND r9 IS SEEN: FROM u 0.00 TO 0.22 ONLY. Against step A (stills of 800 by 450, both sides by one list of
// places in one order; OF THE PICTURE) seed 7 differs in 1,124 of 360,000 pixels at u 0.02, 2,434 at 0.08, 35,684 at
// 0.16, 62,289 at 0.17 (the most) and 4,626 at 0.21; at 0.22 and at every place drawn beyond it, on nine seeds, the
// stills are step A's bytes. Step A's own change against r7t is the awnings of the two streets.
//
// DEPARTURES AND FAULTS OF ROUND r9, SAID, under the letters of colossus-r9-ruling.txt, point 7 (a to e and g are
// not mended; f is):
// a THE BALES' WRAPPER IN SHADE reads greenish grey beside the dyed ends: two of the six strangers named it (seed 21
//   at u 0.16). Each named the same stack on step A's side too, as blank grey blocks, so by the rule written before
//   the build no step was booked; had a thing named on both sides been booked, the bales' step would have stood at
//   two strangers and the round would not be frozen. And a red end in shade goes near black at its foot (seed 2 at
//   u 0.16, the south heap).
// b TWO JAR FORMS ARE IN ONE PICTURE on seeds 2, 21 and 200 at u 0.16: the plain jar of two drums is kept in
//   the cargo list (by the ships, at the wall's foot, in the north heap and the plots beside the way) and, small,
//   on the stalls' boards; the necked jar stands at the kerb, on the hand carts, in the way's lots and on the stand.
//   The lead's rule for step W said "one jar form everywhere at the quay": that is more than the plan types and
//   than this file does. THE SOURCE GOVERNS.
// c THE STAND'S FOUR POSTS PASS THROUGH ITS LOWER FLOOR, which is typed whole (it reads as laid round them); its
//   upper floor lies 10 cm higher than step A's rack, 1.30 m for 1.20, while every jar's top is lower than step A's.
// d THE TIMBER END ON shows nine pale squares that can pass for small blocks (seeds 40, 67, 133 at u 0.14 to 0.16).
//   THE HAND CART'S WHEELS EDGE ON read as upright boards (seed 21 at u 0.16, both wheels of the near cart); step
//   A's read as dark legs there, and neither side reads as a wheel.
// e STEP A'S OWN FAULTS AT THE QUAY, met and not touched: in a stack of six baulks by the ships the third top baulk
//   has nothing under it; three sacks of the heap at the gate's south stall stand partly in the stall's block, on
//   every seed; stacks of timber and jars stand in a tower's wall; goods are cut by the frame's edge at u 0.17 and
//   0.18 (nothing is moved for a still); on seed 7 at u 0.18 a stranger named the round's "jars at bottom centre" as "very dark and partly cut off by the frame edge" (SAID FIRST, above), and to the lead's eye they are dark in the shade and cut by the frame's edge, as step A's lump was (colossus-r9-ruling.txt, point 5).
// f THE COMMENTS THE ADVERSARY OF THE LAWS FOUND FALSE ARE MENDED in this file: the line at JUTE and QWOOD says what
//   each colours and what it does not; the top bale of the lot three high turns "by 10.3" degrees, no longer "by
//   10"; the cargo list's plain jars, sacks and timber are no longer said to lie "by the ships" alone.
// g THE STRANGERS READ THE BALES AS CRATES OF WOOD ("wooden crates", "golden wood with banding"): the round's gain
//   is the goods' colour and form, not the reading "bale". And at 800 by 450 the mooring stones' five sides are not
//   told from six, by the lead's eye and the adversary's.
//
// THE COUNTS (OF THE LAW unless they say the picture):
// - THE HEAVIEST PLACE is seed 197 at u 0.252 to 0.256, where the lens comes through the gate: round r8 found it by
//   a scan of seeds 1 to 200 (round r8's plan had first named seed 200 at u 0.16, 460,577 by the page; the gate's
//   own places miss it). Triangles drawn there, the picture's pass and the sun's map together. BY THE PAGE: r7t
//   466,311, after step H 456,574 (r8/build/h-result.txt); step A and r9 were not counted by the page. BY THE COUNT
//   TOOL (one frame emulated headless), in 129 calls each time: r7t 465,746 (r8/build/verify-h/verdict.txt and
//   counts.txt), after step H and in step A 456,009 (r8/build/h-log.txt, a-result.txt), r9 455,533
//   (r9/build/r9-result.txt; the adversary of the laws and the whole check count the same). THE PURSE IS 470,000:
//   by the page the room was 3,689 in r7t and 13,426 after step H.
// - r9 AGAINST STEP A: the harbour front holds 54 to 238 triangles fewer by seed, never more (a stand 4 fewer, a
//   cart of jars 18 more, a kerb lot of jars 72 more, the stones 234 fewer); at nine places counted on seeds 197,
//   200 and 40 no figure is above step A's and the calls are step A's.
// - No cloth face of a bale or sack is pale: in every built colour blue is under 0.50 of red (the worst 0.471;
//   step A 0.56 to 0.75). The way's lots stand 1.076 m high at most (step A 1.115, over the 1.1 m their rule
//   names); the quay's things keep 2.458 m and more from the flown line (step A 2.416).
// - THE BLIND PREVIEW of round r9 against step A, once, at the quay (OF THE PICTURE): six strangers, seven pairs
//   each, 42 judgements: the round 42 (41 clear, 1 slight), step A 0.
//
// OPEN IN THE CODE, SAID (from r8's checks; none shows in a picture): KNEES, 13 m, is typed here and not read from
// the part, which hands out its knees' height; no reason by place is known for the courts' range ends and the
// doves' south ring; the last look rests on the line of his jaw, 29 m over his soles, and the pit of his throat is
// not taken as a look. Rounds r8 and r9 add no law that reads the eye: the list (a) to (g) below is r7t's.
//
// Axes: +X east, +Z south (north is -Z), +Y up, sea level y 0, the statue's axis at x 0, z 0, the court at y 21.5.
// Everything stands by place: the plan below is world coordinates in metres, and what moves keeps to courses of its own
// on the world clock (ships, walkers, the ox carts, the birds), each laid clear of the flown line by 2 m and more.
// Behind the entry (east of the mole's end on z -14) lies open sea; no ship's course enters that tube.
//
// PLACED SO AS TO BE SEEN WELL FROM THE WAY (each a rule of its place, the same on every seed and at every clock):
// - THE GREAT HARBOUR'S OPEN WATER: no ship rides at anchor inside the mole (the roads and the inner water between the roads'
//   line and the landing are kept open for ships under way). The rule stands at layoutShips.
// - THE GUARD'S LANE (ours): a watch of the harbour's guard rows its round on the festival morning well south of the
//   fairway, out of sight of a ship coming in on the fairway; the whole squadron rows it on a rare visit. The lane's
//   north reach lies two hulls' lengths (72 m) south of the fairway's middle. The rule stands at layoutShips.
// - THE WEST'S CLOUD stands in three fields typed in metres from the avenue's line (his axis running west): tall heaps
//   north of it, low heaps south of it, and a strip of 250 m to either hand kept for low far cloud only, so that from the
//   avenue, the porch and the climb his head and rays stand against sky or low far cloud. The fields stand at BANK.
// - THE LOOKS (where the gaze rests, by place): his chest from the water to the last cross lane, his feet into the porch,
//   his middle from the porch's front until the lens is as high as his knees, the line of his jaw from there on. They
//   stand at flightOf.
// - THE FIRST STREET'S MORNING SHADE is filled by the sky and by the lit roofs (1.8 fold) from the wall's inner face to the
//   first cross lane, so that the wall's long shadow reads as morning shade. The rule stands at DAWN_GLSL.
// - THE GATE ROUND keeps 3.4 m from the axis on the landing's way and 2.2 m in the gate (the middle is the procession's):
//   the festival's people go in by the gate on either hand of the way. THE QUAY'S LOTS lie beside the way to the gate, behind those
//   who stand along it; the gate's guard stands at each pier. The rules stand at lifeOf.
// - THE STORES' COURTS: in each of the avenue's four half blocks below the square one store keeps an open court behind its
//   front range (a garden, a potter's yard, a shrine's court, a dovecote's court), where the line rises over the roofs;
//   on the flat roofs of the avenue's rows and of the rows behind them the bedding is aired over the parapet that looks
//   toward the avenue. The rules stand at lifeOf and roofThings.
// - THE SQUARE'S WEST FRONTS: on the side that each corner house at the head of the upper street turns to the square, the
//   balcony and the shop keep to the wall's end at the avenue's corner. The rule stands at squareSide.
// - THE BIRDS' RINGS AND THE HEARTHS' SMOKE: swallows over the first street's and the upper street's middle, doves over
//   the dovecote and over the square's two hands, up to three hearths' smoke to each block of the avenue's tiled houses.
//   The rings' rule stands at lifeOf (MORE BIRDS), the smokes' in build() (THE HEARTHS OF THE AVENUE'S HOUSES).
// - SHIPS UNDER SAIL FAR OUT: two reaches off the north coast, 1.0 to 1.5 km from the statue, in the sea that opens beside
//   him on the climb. The rule stands at layoutShips.
// - THE DEDICATIONS BESIDE THE WAY'S FOUR TALL TRIPODS (r7): a bronze of the round never stands on a place a tall tripod
//   has taken (2.1 m); it takes the next free place of its own round. Counted on seeds 1 to 200: before this rule a bronze
//   stood within 2.1 m of a tall tripod on 103 seeds, now on none; the bronzes' places change on those 103 seeds and on
//   no other; no tall tripod is moved. The rule stands in build() at tallPlaces.
// - THE MIRROR'S BREAK AND FADE on the harbour go by the mirrored point's height over the water alone (r7).
//
// OURS, INVENTED: WHAT ROUND r7 ADDS TO THE TOWN (the town round him is our reconstruction throughout; none of these has a
// line of research behind it, none stands in the caption or in any text; laid before the owner by name, 12 Oct):
// - in the upper street (metres 250 to 290): more shop mouths with a counter, wares and an awning; small shuttered windows;
//   cloth under sills and on drying poles; pots; painted door frames and bands; sets of jars, sacks and baskets at the
//   wall's foot; a line of cloth over each mouth of the last cross lane; a wall fountain on that lane's north wall.
// - on the quay before the gate (metres 55 to 68): eight lots beside the way (jars in two rows, sacks, corded bales, coils
//   of rope, heaped baskets); three lots at the landing's edge: a RACK OF JARS IN TWO TIERS, BAULKS OF TIMBER ON BEARERS,
//   bales three high; TWO HAND CARTS (plain two-wheeled carts, the ox carts' build made small), one beside a stall's frame
//   under a striped awning; TWO MOORING POSTS of plain timber at the kerb. The rack, the baulks, the hand carts and the
//   posts are new in kind in this town: plain working things of a harbour, nothing lettered, stamped or badged.
//
// OURS, INVENTED: WHAT ROUND r9 TYPES AT THE QUAY (the crew's own forms and numbers, said here by the round's own
// rule; none has a line of research behind it in the round's papers; none is named in the caption; six strangers
// saw them blind, against step A):
// - THE BALES' WRAPPER AND DYES: jute, JUTE [0.7, 0.53, 0.25], with 0.35 of the sacking's colour in it in the way's
//   lots and at the landing; at a bale's two ends the cloth inside, 0.55 of its dye under the wrapper's dust, and
//   0.3 of that dye in the wrapper itself; the dye by the bale's own place: khaki on half the bales, ochre and red
//   on a quarter each (three of the town's cloth dyes); every upright face 0.86 at its foot, the top 1.14; two
//   tarred girths, on the lots' bales a third cord the long way; each bale turned a little, by its place.
// - THE SACKS' CLOTH: half sacking and half jute; the cargo's and the lots' sacks are shaded as the bales are, a
//   hand cart's three are plain blocks in it.
// - THE JAR'S FORM (jarQ), radii and heights as shares of the jar's size s: a foot of 0.05, a belly of 0.2 at 0.58,
//   a neck of 0.07 at 0.76, a lip of 0.095 at 0.98, where the jar ends; the lip's drum 1.45 times paler; the mouth
//   a dark fan. The sizes: 0.86 to 0.96 in a way's lot, 0.84 to 0.90 on the stand's lower floor and 0.81 to 0.88 on
//   its upper, 0.8 on a hand cart, 0.855 to 1.045 at the kerb; five sides on cart and kerb, six in lot and stand.
// - THE STAND'S TWO FLOORS: planks 2.16 by 1.66 m and 6 cm thick, their tops 0.14 m and 1.30 m over the paving, on
//   four posts 9 cm thick. It is the rack of jars in two tiers of round r7's list above, made anew in its own lot.
// - THE COLOUR OF THE TIMBER AND OF THE WORKED WOOD: QWOOD [0.4, 0.29, 0.17], for the cargo's stacks of timber
//   (0.75 to 1.15 of it), the landing's baulks (0.82 to 1.18 of it, their sawn ends 1.2 to 1.45, each times the
//   lot's tone), the stand (its posts 0.7 of its planks), the hand carts (the wheels' discs 1.5 of the cart's tone;
//   tread, axle and hub 0.55 of QWOOD), the stall's frame (0.8) and the kerb's two posts (0.9).
// - THE MOORING STONES' FIVE SIDES: the kerb's 78 stones, six-sided in r7t.
//
// THE LAWS THAT GO BY THE EYE (the owner's section 153; every law of this file that reads the lens stands in this list.
// Each reads WHERE THE EYE IS, whichever lens draws; none reads where it looks but (d), which leaves out only what lies
// outside the picture; none reads a place of the route, a seed or the clock):
// (a) PLAIN PEOPLE ARE DRAWN IN FEWER FACES FROM 60 m AND FROM 120 m FROM THE EYE: a quarter's grown people who carry
//     nothing stand as the plainer figure while the eye is more than 60 m from their quarter's bounds and as the
//     plainest beyond 120 m; those who carry or hold something as the plainest beyond 120 m; the same people at the
//     same places and step. The rule stands in build() at LOD and in update().
// (b) THE MIRROR ON THE HARBOUR'S WATER IS LAID BY THE EYE'S PLACE (what a mirror does): every point of the plain
//     bodies (the hulls, the great quay's face, the harbour wall) is turned down under the sea's level and laid where
//     the straight line from the eye to that mirrored point meets the water; the image is as strong as water mirrors
//     at the slant from the water to the eye, and it wavers square to the eye's bearing. The rule stands at
//     mirrorMaterial.
// (c) THE COURT'S INNER PEOPLE (those who keep west of x 24) ARE NOT DRAWN WHILE THE EYE IS EAST OF THE HARBOUR WALL'S
//     INNER FACE (x 290) AND UNDER THE COURT'S FLOOR (y 21.5). East of the wall the way keeps low (5.2 m up at most:
//     the water, the quay, the gate), and from there the straight line from the eye over the east lip of the porch's
//     floor (x 64) passes 2.3 m and more over the paving at x 24, and higher further west. The typed bound is plainer
//     and wider than that line: an eye east of the wall and close under the court's floor would find them not drawn;
//     no place of the way lies there. The rule stands in build() at THE COURT'S INNER PEOPLE and in update().
// (d) NOT IN THE PICTURE, NOT DRAWN: the harbour front and each ship, with her mirror image, foam, wake, oars and
//     pennant, by the eye's own frustum (the renderer's own rule for every bounded mesh, kept here for what the
//     renderer cannot judge). The rule stands in build() at frontBoxes and placeShips and in update().
// (e) THE HAZE BETWEEN THE EYE AND A PLACE is a medium: the city's, the things', the people's and the mirror's
//     materials thin what they draw by the haze's true depth along the straight line from the eye to the place. The
//     rule stands at DAWN_GLSL (dawnHaze).
// (f) FILTERS BY A PIXEL'S FOOTPRINT: the lines the materials draw (joints, tiles, panes, roofs' things, garden plots,
//     the far houses' windows, the leaves' flicker, the timber's strakes) fade where a pixel is wider than the line,
//     and the ripple that breaks the mirror's image goes by the pixel's own depth on the water. The rules stand at
//     CITY_GLSL (cityPane, cityDetail), propMaterial and mirrorMaterial.
// (g) THE KIT'S OWN THINGS AND THE PART are handed the lens every frame as they ask (the sky's dome, the ocean, the
//     cloud bank, the flocks; the statue's update): what each does with it is the kit's law and the part's. This file
//     hands each flock the route with 2 m of clear air (flockOf), by place.
// By the metres flown, not by the eye: the sun's shadow box stands 60 m on along the route (placeShadow); the statue's
// shade is cast into the sun's map only while his box meets that box, asked each time placeShadow sets the box down
// (r8); and the ring is first drawn where 61.3 m of the route are left (portal.drawWithin, in build()'s return).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/colossus-of-rhodes.js';

// ---------------------------------------------------------------- the plan (the design's measures)
const SEA = 0, QUAY_Y = 1.5, COURT_Y = 21.5;
const QUAY_X0 = 296, QUAY_X1 = 318, WALL_X0 = 290, WALL_X1 = 296, WALL_H = 6.5, TOWER_H = 11, TOWER_W = 8;
const GATE_W = 5.5, GATE_H = 7, GATE_TOWER_Z = 14, GATE_PIER = 2.2;
// the avenue is 12 m between its fronts; the town's rows keep their grid (the first back street 31 m from the axis), so the
// avenue's houses are 2 m deeper than the others; on the festival morning a middle way 3.6 m wide is kept clear down the axis
const AV_X0 = 290, AV_X1 = 64, AV_HALF = 6, GRID_HALF = 8, WAY_HALF = 1.8, LANE_W = 5.5, LANES = [244, 196, 148, 100];
const COURT = { x0: -64, x1: 64, z0: -70, z1: 58 };
const TERRACE_Z = -70, WALK_Z = -66.5;
// north of the terrace the ground falls to a lower road (6 m) and a bare shore (from z -86 to the water's edge at z -138)
const ROAD_Y = 6, SHORE_Z0 = -86, SHORE_Z1 = -138;
const MOLE_Z = -150, MOLE_W = 12;
// the northern bay beyond that shore (x -150 to 215), the spur between it and the great harbour, and the great harbour's waters
const BASIN_X0 = -150, BASIN_X1 = 215, SPUR_Z = -300;
const HARBOUR = { x0: QUAY_X1, x1: WALL_X1 + 150, z0: MOLE_Z + MOLE_W / 2, z1: 300 }, GATE_BERTH_Z = 28;
// the gangplank at the gate's berth: from the quay over the kerb to the covered cargo amidships of the ship lying there
const PLANK = { z: GATE_BERTH_Z + 1.14, half: 0.65, x0: QUAY_X1 - 1.3, x1: QUAY_X1 + 0.1, x2: QUAY_X1 + 3.1, rise: 0.42 };
// THE FAIRWAY, the lane 18 m wide that the harbour keeps clear of lying ships: in from the roads 14 m north of the gate's
// axis (the mole's lee side), bending to the gate's landing over its last 42 m. The route flies in along its middle.
const FAIRWAY = { half: 9, pts: [[WALL_X1 + 450, -14], [360, -14], [345, -11.2], [331, -5.5], [QUAY_X1, -1]] };
// THE ROADS: the harbour's outer water, from the mole's end inward for 62 m, is kept open for ships under way; the
// inner water begins at that line and reaches in to the landing. The flight comes in on the fairway's middle at the
// roads' inner line: 24 m before the fairway's bend, 91 m of water before the gate.
const ROADS_X = HARBOUR.x1 - 62, ENTRY_X = ROADS_X;
const LENS_SEA = 2.6, LENS_AV = 3.5, ALTAR = [20, 15], DURATION = 50, RAD = Math.PI / 180;
// below the court's east wall a street 7 m wide runs north and south (the avenue's last houses stand back from the wall)
const WALL_STREET_X = COURT.x1 + 8;
// THE PORCH of the court (a propylon of our own): a roofed gateway 11 m deep along the axis (x 62 to 73: 2 m into the
// court, over the four steps and over the street below the wall), 7 m clear between its four square pillars; a beam on each
// front, its underside 4.6 m above the court's paving, a timber ceiling above the beams and a low tiled roof with a gable
// to each front. Beside it the court wall's ends stand 5.2 m high for 11.5 m (they carry the hangings).
const PORCH = { x0: 62, x1: 73, clear: 7, pillar: 1.8, soffit: 4.6, under: 1.5, beam: 1.3, rise: 1.25, eave: 0.45, wall: 5.2, wing: 11.5, steps: 4, tread: 1.5 };
// THE RING hangs before the statue and beside him, on his lit side: 14 m east of his axis (before his front) and 12 m
// north of it, 28 m above the court's paving, the height of his chest (the chest's own look place). Its middle is 19.7 m
// from the middle of his head, and nothing of the flown line comes nearer to his head than that. It is small: 3 m in
// radius, less than his shoulders' reach.
const RING = [14, COURT_Y + 28, -12], RING_R = 3;
const avenueY = (x) => QUAY_Y + (COURT_Y - QUAY_Y) * clamp((AV_X0 - x) / (AV_X0 - AV_X1), 0, 1);
// THE MARKET SQUARE: between the lanes at x 196 and x 148 the avenue opens to 46 m (z -23 to +23). Its paving lies in the plane of
// the avenue (and over the two lanes' mouths); a stoa stands along its north and its south side, level, in three lengths that
// step up the slope: the floor of the length at x is stoaLevel(x). The town's rows: two rows of houses back to back (23 m), then
// a street 5.5 m wide.
const SQ = { x0: LANES[2] + LANE_W / 2, x1: LANES[1] - LANE_W / 2, z: 23, n: 3, edge: 23.6, back: 31 };
const ROW_PITCH = 28.5, ROW_BACK = 23;
const stoaLevel = (x) => { const w = (SQ.x1 - SQ.x0) / SQ.n; return avenueY(SQ.x0 + clamp(Math.floor((x - SQ.x0) / w), 0, SQ.n - 1) * w) + 0.12; };
const inSquare = (x) => x > SQ.x0 - LANE_W && x < SQ.x1 + LANE_W;

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// surface kinds of the city's one material (the fragment shader draws joints, tiles and grain from the world position)
const SF = { PLASTER: 0, ASHLAR: 1, PAVING: 2, TILE_X: 3, TILE_Z: 4, TIMBER: 5, EARTH: 6, ROCK: 7, MARBLE: 8, CLOTH: 9, LEAF: 10, BRONZE: 11, COURT: 12, FAR: 13, PANE: 15 };
// A FAR HOUSE'S WALL (the rows behind the first back street, the upper town west of the court): plaster whose windows and
// doors are drawn by the material from the wall's own place. The kind carries the level its floor stands on and whether
// it has an upper floor: 13.05 + level / 128, and 1 more for two storeys.
const farWall = (y, two) => SF.FAR + (two ? 1 : 0) + 0.05 + y / 128;
// A NEAR HOUSE'S WALL carries the level its floor stands on and its own height (each to a quarter of a metre) in its plaster's
// kind, so that the material can darken its foot and weather it under its eaves: (4 y * 64 + 4 h) / 32768, under 0.5.
// A TILED ROOF carries the height of its eaves: the kind's fraction is that height / 128. A FLAT ROOF IN USE is earth + 0.25
// (a far house's, whose things the material draws, earth + 0.32).
const wallSurf = (y, h) => (Math.round(y * 4) * 64 + Math.min(63, Math.round(h * 4))) / 32768, tileSurf = (ts, y) => ts + clamp(y / 128, 0, 0.45), TERRACE = SF.EARTH + 0.25;

// ---------------------------------------------------------------- a small geometry accumulator (position, normal, colour, surface kind)
function makeBuf(cap = 4096) {
  let P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), S = new Float32Array(cap), I = new Uint32Array(cap * 2);
  let n = 0, ni = 0, xc = 1, xs = 0, xo = 0, yo = 0, zo = 0, W = null, wa = 0, wp = 0;
  const grow = () => {
    cap *= 2;
    const p = new Float32Array(cap * 3); p.set(P); P = p;
    const q = new Float32Array(cap * 3); q.set(N); N = q;
    const c = new Float32Array(cap * 3); c.set(C); C = c;
    const s = new Float32Array(cap); s.set(S); S = s;
    if (W) { const w = new Float32Array(cap * 2); w.set(W); W = w; }
  };
  const growI = () => { const i = new Uint32Array(I.length * 2); i.set(I); I = i; };
  const b = {
    get triangles() { return ni / 3; },
    // a turn about the vertical (radians, +X toward -Z as it grows) and a shift, applied to everything added until reset
    at(x = 0, y = 0, z = 0, turn = 0) { xc = Math.cos(turn); xs = Math.sin(turn); xo = x; yo = y; zo = z; return b; },
    // cloth: everything added until wave(0) stirs along its normal by a metres, with phase p
    wave(a = 0, p = 0) { wa = a; wp = p; if ((a || p) && !W) W = new Float32Array(cap * 2); return b; },
    vert(x, y, z, nx, ny, nz, c, s) {
      if (n >= cap) grow();
      if (W) { W[n * 2] = wa; W[n * 2 + 1] = wp; }
      const k = n * 3;
      P[k] = xo + x * xc + z * xs; P[k + 1] = yo + y; P[k + 2] = zo - x * xs + z * xc;
      N[k] = nx * xc + nz * xs; N[k + 1] = ny; N[k + 2] = -nx * xs + nz * xc; C[k] = c[0]; C[k + 1] = c[1]; C[k + 2] = c[2]; S[n] = s;
      return n++;
    },
    // a..d counter-clockwise seen from the lit side
    quad(a, bq, c, d, col, s = 0, col2 = null) {
      const ux = bq[0] - a[0], uy = bq[1] - a[1], uz = bq[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const c2 = col2 || col;
      const i0 = b.vert(a[0], a[1], a[2], nx, ny, nz, col, s), i1 = b.vert(bq[0], bq[1], bq[2], nx, ny, nz, col, s);
      const i2 = b.vert(c[0], c[1], c[2], nx, ny, nz, c2, s), i3 = b.vert(d[0], d[1], d[2], nx, ny, nz, c2, s);
      if (ni + 6 > I.length) growI();
      I[ni++] = i0; I[ni++] = i1; I[ni++] = i2; I[ni++] = i0; I[ni++] = i2; I[ni++] = i3;
    },
    tri(a, bq, c, col, s = 0) {
      const ux = bq[0] - a[0], uy = bq[1] - a[1], uz = bq[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const i0 = b.vert(a[0], a[1], a[2], nx, ny, nz, col, s), i1 = b.vert(bq[0], bq[1], bq[2], nx, ny, nz, col, s), i2 = b.vert(c[0], c[1], c[2], nx, ny, nz, col, s);
      if (ni + 3 > I.length) growI();
      I[ni++] = i0; I[ni++] = i1; I[ni++] = i2;
    },
    // axis box; f is a string of the faces to draw out of 'xXyYzZ' (x = the face looking toward -X, X toward +X, ...)
    box(x0, y0, z0, x1, y1, z1, col, s = 0, f = 'xXYzZ', top = null, topS = null) {
      if (f.includes('X')) b.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, s);
      if (f.includes('x')) b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, s);
      if (f.includes('Z')) b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, s);
      if (f.includes('z')) b.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, s);
      if (f.includes('Y')) b.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top || col, topS === null ? s : topS);
      if (f.includes('y')) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, s);
    },
    // upright round shaft or drum, radius r0 at y0 and r1 at y1
    cyl(x, z, r0, r1, y0, y1, seg, col, s = 0, cap = true) {
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const i0 = b.vert(x + c0 * r0, y0, z + s0 * r0, c0, 0, s0, col, s), i1 = b.vert(x + c1 * r0, y0, z + s1 * r0, c1, 0, s1, col, s);
        const i2 = b.vert(x + c1 * r1, y1, z + s1 * r1, c1, 0, s1, col, s), i3 = b.vert(x + c0 * r1, y1, z + s0 * r1, c0, 0, s0, col, s);
        if (ni + 6 > I.length) growI();
        I[ni++] = i0; I[ni++] = i2; I[ni++] = i1; I[ni++] = i0; I[ni++] = i3; I[ni++] = i2;
        if (cap) b.tri([x, y1, z], [x + c1 * r1, y1, z + s1 * r1], [x + c0 * r1, y1, z + s0 * r1], col, s);
      }
    },
    // a smooth sheet: fn(u, v) -> [x, y, z] over nu by nv cells, normals from the sheet's own slopes; col may be a function (u, v)
    grid(nu, nv, fn, col, s = 0, flip = false, wfn = null) {
      const base = n, e = 0.002, colOf = typeof col === 'function' ? col : () => col;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = i / nu, v = j / nv, p = fn(u, v), pu = fn(Math.min(1, u + e), v), pd = fn(Math.max(0, u - e), v), pv = fn(u, Math.min(1, v + e)), pw = fn(u, Math.max(0, v - e));
        const ax = pu[0] - pd[0], ay = pu[1] - pd[1], az = pu[2] - pd[2], bx = pv[0] - pw[0], by = pv[1] - pw[1], bz = pv[2] - pw[2];
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1);
        if (wfn) { const w = wfn(u, v); b.wave(w[0], w[1]); }
        b.vert(p[0], p[1], p[2], nx / l, ny / l, nz / l, colOf(u, v), s);
      }
      if (wfn) b.wave(0);
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i, c = a + 1, d = a + nu + 1, f = d + 1;
        if (ni + 6 > I.length) growI();
        if (flip) { I[ni++] = a; I[ni++] = d; I[ni++] = c; I[ni++] = c; I[ni++] = d; I[ni++] = f; } else { I[ni++] = a; I[ni++] = c; I[ni++] = d; I[ni++] = c; I[ni++] = f; I[ni++] = d; }
      }
    },
    // a square timber from a to b, t thick (t2 high if given); ends: false leaves its two end faces out
    beam(a, bq, t, col, s = 0, t2 = t, ends = true) {
      let dx = bq[0] - a[0], dy = bq[1] - a[1], dz = bq[2] - a[2];
      const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      let ux = 0, uy = 1, uz = 0; if (Math.abs(dy) > 0.9) { ux = 1; uy = 0; }
      let rx = dy * uz - dz * uy, ry = dz * ux - dx * uz, rz = dx * uy - dy * ux; const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
      ux = ry * dz - rz * dy; uy = rz * dx - rx * dz; uz = rx * dy - ry * dx;
      const h = t / 2, k = t2 / 2, P4 = (q, sr, su) => [q[0] + rx * h * sr + ux * k * su, q[1] + ry * h * sr + uy * k * su, q[2] + rz * h * sr + uz * k * su];
      const c = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      for (let i = 0; i < 4; i++) { const p = c[i], q = c[(i + 1) % 4]; b.quad(P4(a, q[0], q[1]), P4(a, p[0], p[1]), P4(bq, p[0], p[1]), P4(bq, q[0], q[1]), col, s); }
      if (ends) { b.quad(P4(bq, 1, -1), P4(bq, -1, -1), P4(bq, -1, 1), P4(bq, 1, 1), col, s); b.quad(P4(a, 1, 1), P4(a, -1, 1), P4(a, -1, -1), P4(a, 1, -1), col, s); }
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, n * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, n * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, n * 3), 3));
      g.setAttribute('surf', new THREE.BufferAttribute(S.slice(0, n), 1));
      if (W) g.setAttribute('wave', new THREE.BufferAttribute(W.slice(0, n * 2), 2));
      g.setIndex(new THREE.BufferAttribute(I.slice(0, ni), 1));
      g.computeBoundingSphere(); g.computeBoundingBox();
      return g;
    },
  };
  return b;
}

// ---------------------------------------------------------------- the sunrise in every material of the place
// A haze lies on the sea and in the low town, thinning with height (uHaze.y: the height in metres over which it thins to a
// third). The low sun's rays come in through it, so the sun's own light is weak at the water and whole above the roofs
// (dawnSun: a rule of a place's height). Between the eye and a place the same haze is a medium: what it takes is its
// true depth along the straight line from the eye to the place (dawnHaze; (e) at the head). uHaze.x: its depth for the sun's light at sea level; uHaze.z: its
// thickness for the eye, per metre at sea level.
// THE FIRST STREET'S MORNING SHADE (a rule of the place, on every visit): at sunrise the harbour wall's shadow lies
// 60 m up the avenue, over the low zone and the first houses of the lower street. There the shade is filled by the
// sky and by the light the lit roofs and upper fronts throw back: the sky's and the ground's light count 1.8 fold on
// everything that stands in that stretch (from the wall's inner face to the first cross lane, fading out over the
// 20 m beyond it and from 14 to 22 m either side of the axis), stone, cloth and people alike.
// THE BOX'S NUMBERS (r8). Its east edge is the wall's inner face by the plan (WALL_X0), with a fade of a metre about it,
// half to either hand: written from the plan below. The others stay typed, for no figure of the plan is the same number:
// 246 lies in the mouth of the first cross lane (241.25 to 246.75 by LANES[0] and LANE_W), 0.75 m inside its east side,
// and 226 is the 20 m beyond it (4 m past the low zone's end at 230, where the wall's shadow ends by the rule above);
// 14 m lies in the back half of the avenue's rows (their fronts stand 6 m out and their plots, yards and courts
// counted, are 11 to 13.4 m deep, so their backs lie 17 to 19.4 m out): the street, both foot ways and every front
// take the fill whole. 22 m lies 0.5 to 2.4 m past the back line of the rows behind (their fronts stand 31 m out
// and their plots are 9.5 to 11.4 m deep, so their back walls and yard walls stand 19.6 to 21.5 m out; there the
// fill is down to 22 parts in 100 and less): it is gone just beyond them.
// FIRST_STREET_FILL 0.8 is the 1.8 fold less the light's own one.
const DAWN_GLSL = /* glsl */`
#define FIRST_STREET_FILL 0.8
uniform vec3 uSunW; uniform vec3 uHaze; uniform vec3 uHazeCol;
float dawnSun(float y){ return exp(-uHaze.x * exp(-max(y, 0.) / uHaze.y)); }
float dawnHaze(vec3 p, vec3 eye){
  float H = uHaze.y, dy = p.y - eye.y, a = exp(-max(eye.y, 0.) / H), b = exp(-max(p.y, 0.) / H);
  float mean = abs(dy) > 0.02 ? H * (a - b) / (sign(dy) * max(abs(dy), 0.02)) : a;
  return 1. - exp(-uHaze.z * max(mean, 0.) * distance(p, eye));
}
float dawnFill(vec3 p){ return smoothstep(226., 246., p.x) * (1. - smoothstep(${(WALL_X0 - 0.5).toFixed(1)}, ${(WALL_X0 + 0.5).toFixed(1)}, p.x)) * (1. - smoothstep(14., 22., abs(p.z))); }`;
const dawnInto = (sh, U) => { sh.uniforms.uSunW = U.uSunW; sh.uniforms.uHaze = U.uHaze; sh.uniforms.uHazeCol = U.uHazeCol; };

// ---------------------------------------------------------------- the city's material: one lit program, joints and tiles drawn from the place
// (BROUGHT IN, see the head: cHash, in the text below. This comment stands outside that text.)
const CITY_GLSL = /* glsl */`
varying float vSurf; varying vec3 vWp; varying vec3 vWn;
float cHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float cNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(cHash(i), cHash(i + vec2(1., 0.)), f.x), mix(cHash(i + vec2(0., 1.)), cHash(i + vec2(1., 1.)), f.x), f.y); }
float cTrack(vec2 p, vec2 a, vec2 b, float half_){ vec2 ab = b - a; float t = clamp(dot(p - a, ab) / dot(ab, ab), 0., 1.); return 1. - smoothstep(half_ * 0.5, half_, distance(p, a + ab * t)); }
// A PANE (a shuttered window or a door of a plain house, drawn on one flat piece): the piece's colour carries the place
// within it (red across, green up) and, in blue, its kind and the house's own number: (kind + number) / 4. Kind 0: a
// window in a surround of pale stone with a sill, its two slatted leaves shut; 1: one leaf open on the dark room; 2: a
// door of two leaves with their rails between stone jambs under a stone lintel. The number picks the timber's paint.
vec3 cityPane(vec3 c){
  float kind = floor(c.b * 4. + 0.001), rnd = fract(c.b * 4.), pick = floor(rnd * 4.);
  vec2 q = c.rg;
  vec3 stone = vec3(0.74, 0.69, 0.6) * (0.92 + 0.1 * fract(rnd * 7.)), room = vec3(0.085, 0.07, 0.058);
  vec3 leaf = pick < 0.5 ? vec3(0.2, 0.115, 0.06) : pick < 1.5 ? vec3(0.07, 0.2, 0.21) : pick < 2.5 ? vec3(0.33, 0.085, 0.06) : vec3(0.28, 0.2, 0.1);
  float fine = clamp(1. - fwidth(q.y) * 9., 0., 1.);
  if (kind > 1.5) {
    if (q.x < 0.1 || q.x > 0.9 || q.y > 0.935) return stone * (q.y > 0.935 ? 1.06 : 1.);
    vec2 d = vec2((q.x - 0.1) / 0.8, q.y / 0.935);
    return leaf * (abs(d.x - 0.5) < 0.014 ? 0.4 : 1.) * (1. - 0.28 * fine * step(abs(fract(d.y * 3. + 0.2) - 0.5), 0.06));
  }
  if (q.x < 0.14 || q.x > 0.86 || q.y < 0.15 || q.y > 0.85) return stone * (q.y < 0.15 ? (q.y < 0.05 ? 0.74 : 1.08) : 1.);
  vec2 d = (q - vec2(0.14, 0.15)) / vec2(0.72, 0.7);
  if (kind > 0.5 && d.x > 0.5) return room * (1. + 1.2 * (1. - d.y));
  return leaf * (abs(d.x - 0.5) < 0.025 ? 0.4 : 1.) * (1. - 0.3 * fine * step(fract(d.y * 6.), 0.24) - 0.07 * (1. - fine));
}
float cityDetail(){
  vec3 an = abs(vWn);
  vec2 uv = an.y > 0.6 ? vWp.xz : (an.x > an.z ? vWp.zy : vWp.xy);
  float fw = max(fwidth(uv.x), fwidth(uv.y));
  float near = clamp(1. - fw * 2.5, 0., 1.);
  float s = vSurf;
  float k = 0.9 + 0.16 * cNoise(uv * 0.8) + 0.07 * near * cNoise(uv * 6.3);
  if (s > 14.5) {
    k = 0.96 + 0.08 * cNoise(uv * 2.1);
  } else if (s < 0.5) {
    float run = smoothstep(0.5, 0.92, cNoise(vec2(uv.x * 2.6, uv.y * 0.16))) * (0.4 + 0.6 * cNoise(uv * 0.33));
    k *= (0.93 + 0.12 * cNoise(uv * 0.19 + 3.)) * (1. - 0.13 * run);
    float code = s * 32768. + 0.5;
    if (code > 1. && an.y < 0.6) {
      // a near house's wall (its floor's level and its height are in its kind): the foot dark with the street's splash and
      // dust, to a ragged line; under the eaves or the parapet a damp band, and dark runs down from it, each as long as its
      // own number says. On the avenue's own fronts (whose limewash already carries stain and damp) four tenths of it.
      float fl = floor(code / 64.), hy = vWp.y - fl * 0.25, below = (floor(code) - fl * 64.) * 0.25 - hy;
      float av = abs(abs(vWp.z) - 6.) < 0.3 && an.z > 0.6 ? 0.4 : 1.;
      float foot = 1. - smoothstep(0.1, 0.4 + 0.9 * cNoise(vec2(uv.x * 0.9, fl)), hy);
      float runE = smoothstep(0.35, 0.8, cNoise(vec2(uv.x * 1.9, fl * 7.3 + 1.)));
      k *= (1. - av * foot * (0.25 + 0.07 * near * cNoise(uv * 5.))) * (1. - av * step(0., below) * (0.3 * runE * (1. - smoothstep(0.15, 0.3 + 2.2 * cNoise(vec2(uv.x * 0.7, fl + 4.)), below)) + 0.14 * (1. - smoothstep(0.05, 0.4, below))));
    }
  } else if (s < 2.5) {
    vec2 cell = s < 1.5 ? vec2(1.15, 0.46) : vec2(1.1, 0.74);
    vec2 q = uv / cell; q.x += 0.5 * floor(q.y);
    vec2 f = fract(q);
    float d = min(min(f.x, 1. - f.x) * cell.x, min(f.y, 1. - f.y) * cell.y);
    float joint = 1. - smoothstep(0.008, 0.03 + fw, d);
    float hq = cHash(floor(q));
    k *= (s < 1.5 ? 0.92 + 0.16 * hq : (0.86 + 0.2 * hq - 0.13 * step(0.92, hq)) * (0.88 + 0.22 * cNoise(uv * 0.09)) * (0.95 + 0.1 * cNoise(uv * 0.7 + 9.))) * mix(1., 0.7, joint * near);
    if (s < 1.5 && an.y < 0.6) {
      // dressed ashlar: a drafted margin round each block, the face within it picked a shade rougher and darker; the
      // margin's upper edge takes the sky, its lower edge is in shade (thinned by the pixel's footprint)
      float face = smoothstep(0.045, 0.075 + fw, d), edge = (1. - face) * (1. - joint);
      k *= mix(1., (0.93 + 0.1 * cNoise(uv * 9.)) * mix(1.07, 1., face) * (1. + edge * 0.1 * sign(f.y - 0.5)), near);
      // the harbour wall's weather (its east face and its towers' fronts): dark runs down the stone under the crown
      // course, under the string course and under each tower's string course, each run as long as its own number says
      if (vWp.x > 295.9 && vWp.x < 298.3 && an.x > 0.6) {
        float yt = vWp.x > 297.5 ? 8.8 : (vWp.y > 5.8 ? 7.68 : 5.8), below = yt - vWp.y;
        float run = smoothstep(0.4, 0.8, cNoise(vec2(uv.x * 1.7, yt)));
        k *= 1. - 0.24 * run * step(0., below) * (1. - smoothstep(0.2, 0.6 + 2.2 * cNoise(vec2(uv.x * 0.6, yt + 4.)), below));
      }
    }
    if (s > 1.5 && an.y > 0.6 && vWp.x > 296. && vWp.x < 318.6 && abs(vWp.z) < 64.) {
      // THE QUAY'S PAVING IS WORN IN TRACKS TOWARD THE GATE: along the way from the landing, from the gate's berth and
      // from the slip's head to the gate, and up and down the quay's middle: there the slabs are trodden smooth and
      // pale, their joints filled
      vec2 p = vWp.xz + 0.5 * (cNoise(vWp.xz * 0.35) - 0.5);
      float w = max(max(cTrack(p, vec2(318., -1.), vec2(296., 0.), 2.7), cTrack(p, vec2(316.5, 29.), vec2(298.5, 3.), 1.6)), max(cTrack(p, vec2(309., -24.), vec2(298.5, -3.), 1.6), 0.7 * cTrack(p, vec2(306., -64.), vec2(306., 64.), 1.4)));
      k = mix(k, (1.02 + 0.07 * cNoise(uv * 0.7 + 9.)) * mix(1., 0.86, joint * near), 0.8 * w);
    }
  } else if (s > 2.5 && s < 4.5) {
    float p = (s < 3.5 ? vWp.x : vWp.z) / 0.38;
    float ridge = smoothstep(0.08, 0.5, abs(fract(p) - 0.5) * 2.);
    float course = smoothstep(0.0, 0.25, fract(vWp.y / 0.17));
    // every tile its own shade of the clay, one in sixteen a newer and paler one; long weather marks down the slope
    float tq = cHash(vec2(floor(p), floor(vWp.y / 0.17)));
    k *= mix(1., (0.74 + 0.32 * ridge) * (0.9 + 0.1 * course) * (0.88 + 0.22 * tq + 0.16 * step(0.94, tq)), near) * (0.9 + 0.2 * cNoise(uv * 0.35)) * (0.93 + 0.14 * cNoise(vec2(p * 0.3, vWp.y * 0.7)));
    // seen from further off than a tile is wide, the roof still reads in rows: every three pans a band of its own shade down
    // the slope, and here and there a patch relaid in newer clay
    k *= mix(1., (0.92 + 0.16 * cHash(vec2(floor(p / 3.), 3.))) * (1. + 0.13 * smoothstep(0.66, 0.7, cNoise(vec2(p * 0.12, vWp.y * 0.8) + 5.))), clamp(1.6 - fw * 0.9, 0., 1.));
    // the eaves' line (a house's roof carries its eaves' height in its kind): the lowest course lies in the shade of its own
    // lap, the course above it weathered pale
    float ye = fract(s) * 128., up = vWp.y - ye;
    if (ye > 0.6) k *= (1. - 0.3 * (1. - smoothstep(0.04, 0.13, up))) * (1. + 0.09 * smoothstep(0.1, 0.16, up) * (1. - smoothstep(0.22, 0.5, up)));
  } else if (s > 4.5 && s < 5.5) {
    float pl = abs(fract(uv.x / 0.24) - 0.5) * 2.;
    k *= mix(1., 0.82 + 0.18 * smoothstep(0.02, 0.2, 1. - pl), near) * (0.88 + 0.2 * cNoise(vec2(uv.x * 9., uv.y * 0.7)));
  } else if (s > 5.5 && s < 7.5) {
    k = (s < 6.5 ? 0.8 : 0.66) + 0.3 * cNoise(uv * 0.21) + 0.16 * cNoise(uv * 1.7) + 0.08 * near * cNoise(uv * 7.);
    if (s > 6.1 && s < 6.4) {
      // a flat roof in use: rolled clay mended in paler patches, darker where the rain stands, a web of fine cracks
      float mend = smoothstep(0.58, 0.62, cNoise(uv * 0.55 + 7.)), pool = smoothstep(0.55, 0.8, cNoise(uv * 0.33 + 21.));
      k *= (1. + 0.14 * mend) * (1. - 0.16 * pool * (1. - mend)) * (1. - 0.25 * near * (1. - smoothstep(0., 0.035, abs(cNoise(uv * 1.3 + 3.) - 0.5))));
      if (s > 6.3) {
        // a far house's flat roof (earth + 0.32): its things are the material's: in three places of ten a cloth or a mat
        // spread to dry (a pale patch a pace or two long), in one or two the stair's dark hatch
        vec2 cq = vWp.xz / 4.6, ci = floor(cq), cf = abs(fract(cq) - 0.5);
        float ch = cHash(ci + 31.), on = step(cf.x, 0.14 + 0.16 * cHash(ci + 5.)) * step(cf.y, 0.1 + 0.14 * cHash(ci + 9.)) * clamp(2. - fw * 0.5, 0., 1.);
        k *= 1. + on * (ch < 0.3 ? 0.5 : ch < 0.45 ? -0.5 : 0.);
      }
    }
    // outside the land wall (west of x -440) the open ground is fields: long plots from north to south, each its own
    // shade of stubble, fallow or green
    if (s < 6.5 && an.y > 0.6 && vWp.x < -440.) {
      float col = floor(vWp.x / 36. + 0.6 * cNoise(vec2(vWp.z * 0.006, 2.)));
      k *= mix(1., 0.7 + 0.55 * cHash(vec2(col, floor(vWp.z / 92. + 0.37 * col))), smoothstep(-440., -470., vWp.x));
    } else if (s < 6.5 && an.y > 0.6 && vWp.x < -72. && vWp.z < 250. && !(vWp.z > 80. && vWp.x > -214.)) {
      // inside the land wall the open ground west and north west of the court is garden ground: plots of 30 m by 44 m
      // between low walls; four in ten are orchards (the dark heads of trees in rows 7 m apart), three in ten beds in
      // rows, the others open. Far off, where a pixel is wider than the rows, a plot keeps its mean shade.
      vec2 pc = vec2(vWp.x / 30., vWp.z / 44. + 0.5 * floor(vWp.x / 30.)), pid = floor(pc), e = abs(fract(pc) - 0.5);
      float ph = cHash(pid + 3.), fine = clamp(1.5 - fw * 0.45, 0., 1.), g = 1.;
      if (ph < 0.42) g = mix(0.8, mix(0.42, 1., smoothstep(0.24, 0.36, length(fract(vWp.xz / 7. + cHash(pid) * 0.5) - 0.5))), fine);
      else if (ph < 0.72) g = mix(0.93, 0.86 + 0.14 * step(0.5, fract(vWp.x / 2.4)), fine);
      g *= (0.84 + 0.26 * cHash(pid + 9.)) * mix(0.78, 1., smoothstep(0.5, 0.47 - 0.02 * fine, max(e.x, e.y)));
      k *= mix(1., g, smoothstep(-72., -90., vWp.x));
    }
  } else if (s > 7.5 && s < 8.5) {
    k = 0.95 + 0.06 * cNoise(uv * 0.5) + 0.04 * near * cNoise(vec2(uv.x * 2. + uv.y * 3., uv.y * 0.6));
  } else if (s > 9.5 && s < 10.5) {
    k = 0.62 + 0.5 * cNoise(uv * vec2(2.3, 0.9)) + 0.3 * near * cNoise(uv * vec2(9., 4.));
    k *= mix(1., 0.72 + 0.56 * cNoise(vWp.xz * 1.6 + vWp.y * 1.1 + uTime * vec2(0.9, 0.7)), clamp(1. - fw * 1.2, 0., 1.)) * (0.72 + 0.6 * cNoise(vWp.xz * 0.3 + vWp.y * 0.2 - uTime * vec2(0.65, 0.62)));
  } else if (s > 12.5) {
    // a far house's wall: its plaster, darker toward the foot; on each storey a rank of small shuttered windows 2.7 m
    // apart (three places in ten are blank wall), here and there a door at the foot. hy: the height above its own floor
    float two = step(13.95, s), hy = vWp.y - (s - 13.05 - two) * 128., st = floor(hy / 3.3), fy = hy - st * 3.3, gx = fract(uv.x / 2.7) * 2.7;
    float hq = cHash(vec2(floor(uv.x / 2.7), st + floor(vWp.y * 0.05)) + 17.);
    float win = step(-0.5, st) * step(st, 0.5 + two) * step(0.3, hq) * step(0.95, gx) * step(gx, 1.75) * step(1.5, fy) * step(fy, 2.45);
    float door = step(-0.5, st) * step(st, 0.5) * step(hq, 0.16) * step(0.85, gx) * step(gx, 1.85) * step(fy, 2.1);
    k *= (0.93 + 0.12 * cNoise(uv * 0.19 + 3.)) * mix(0.8, 1., smoothstep(0., 1.6, hy)) * (1. - 0.62 * max(win, door) * clamp(1.4 - fw * 1.2, 0.3, 1.));
  } else if (s > 11.5) {
    vec2 cell = vec2(2.2, 1.45);
    vec2 q = uv / cell; q.x += 0.5 * floor(q.y);
    vec2 f = fract(q);
    float d = min(min(f.x, 1. - f.x) * cell.x, min(f.y, 1. - f.y) * cell.y);
    float joint = 1. - smoothstep(0.008, 0.03 + fw, d);
    k = (0.95 + 0.06 * cNoise(uv * 0.5)) * (0.96 + 0.07 * cHash(floor(q))) * (0.94 + 0.1 * cNoise(uv * 0.07)) * mix(1., 0.84, joint * near);
  } else if (s > 10.5) {
    k = 0.86 + 0.2 * cNoise(uv * 1.7) + 0.1 * cNoise(uv * 7.);
  }
  return k;
}`;
// What lies flat (paving, earth, the roofs' slopes) is rough: under a low sun its grains face the light, so its lighting
// normal leans toward the sun (0.55 for a level face, none for a wall). The sun's light is thinned by the sea haze by the
// place's height; walls take a little warm light thrown up from sunlit ground; the haze stands between the eye and the place.
// Leaves (the trees' crowns, the garlands' swags, the pot herbs) stir in the one wind: a hand's breadth to and fro along
// it; light and dark wander over them as they turn (where a pixel is no wider than a leaf: a filter by the pixel's
// footprint, (f) at the head), and the wind's gusts pass over them down the wind at 2 m a second, three tenths lighter
// and darker (at every distance).
function cityMaterial(U, tU) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    dawnInto(sh, U); sh.uniforms.uTime = tU;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float surf; uniform float uTime; varying float vSurf; varying vec3 vWp; varying vec3 vWn;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurf = surf; vWp = position; vWn = normal;\nif (surf > 9.5 && surf < 10.5) transformed.xz += vec2(0.72, 0.69) * (0.05 * sin(uTime * 2.1 + position.x * 0.9 + position.z * 1.3) + 0.03 * sin(uTime * 3.4 + position.y * 2.3 + position.x * 0.7));');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\n' + DAWN_GLSL + CITY_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\nif (vSurf > 14.5) diffuseColor.rgb = cityPane(vColor.rgb);\ndiffuseColor.rgb *= cityDetail();')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ float up = clamp(vWn.y * inversesqrt(max(dot(vWn, vWn), 1e-6)), 0., 1.); vec3 lean = normal + (viewMatrix * vec4(uSunW, 0.)).xyz * (0.55 * up * up); normal = lean * inversesqrt(max(dot(lean, lean), 1e-6)); }')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ float ds = dawnSun(vWp.y); reflectedLight.directDiffuse *= ds; float ny = vWn.y * inversesqrt(max(dot(vWn, vWn), 1e-6)); reflectedLight.indirectDiffuse += diffuseColor.rgb * ds * (vec3(0.15, 0.115, 0.075) * (1. - abs(ny)) + vec3(0.34, 0.25, 0.16) * max(-ny, 0.)); reflectedLight.indirectDiffuse *= 1. + FIRST_STREET_FILL * dawnFill(vWp); }')
      .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uHazeCol, dawnHaze(vWp, cameraPosition));');
  };
  m.customProgramCacheKey = () => 'colossus-city-19';
  return m;
}

// ---------------------------------------------------------------- the flown route
// In on the fairway's middle from the roads' inner line, level and straight to the fairway's bend, round to the gate's
// landing and through the gate. ONCE OVER THE ROOFS: from the gate's inner face the line climbs evenly (11.5 degrees) over
// the low zone's flat roofs and the ridges of the lower street, and comes down the same slope between the square's plane
// trees to 3.5 m over the paving at the square's middle; the crest, where the two slopes meet, lies 12 m before the
// square's east edge, 13 m over the avenue's paving.
// From the square on it keeps 3.5 m above the paving on the avenue's axis (the festival's middle way, 3.6 m wide, is kept
// clear under it); over the avenue's last block it rises evenly to the level it keeps under the porch (1.5 m under the
// undersides of the porch's beams, 3.1 m above the
// court's paving); level under the porch; from the porch's west edge one arc of 8 m bends the line up and a little north,
// and it runs straight up before his front to the ring that hangs before his chest on his north side.
// (xc, the crest: where the climb from the gate meets the equal slope that comes down to the square's middle)
const RISE = (() => { const x0 = AV_X0, x1 = (SQ.x0 + SQ.x1) / 2, slope = Math.tan(11.5 * RAD); return { x0, x1, slope, xc: (avenueY(x0) - avenueY(x1) + slope * (x0 + x1)) / (2 * slope) }; })();
// the lens's height on the avenue's axis at x: the lower of the climb from the gate and the slope down to the square's middle
function lensY(x) {
  if (x <= RISE.x1) return avenueY(x) + LENS_AV;
  const y0 = avenueY(RISE.x0) + LENS_AV, y1 = avenueY(RISE.x1) + LENS_AV;
  return x >= RISE.xc ? y0 + RISE.slope * (RISE.x0 - x) : y1 + RISE.slope * (x - RISE.x1);
}
const AV_KNOTS = [280, 268, 256, 244, 232, 220, 208, 196, 184, 172, 160, 148, 136, 124, 112, 100];
// the lens's level under the porch
const PORCH_LENS = COURT_Y + PORCH.soffit - PORCH.under;
const CLIMB = (() => {
  const P0 = [PORCH.x0, PORCH_LENS, 0], ARC = 8;
  // the arc joins the level line west to the straight that ends in the ring: its two tangents are equal, its length 8 m
  let T = ARC / 2, d1 = [-1, 0, 0], phi = 0.6, R = 13;
  for (let i = 0; i < 16; i++) {
    const v = [RING[0] - (P0[0] - T), RING[1] - P0[1], RING[2] - P0[2]], l = Math.hypot(v[0], v[1], v[2]);
    d1 = [v[0] / l, v[1] / l, v[2] / l]; phi = Math.acos(-d1[0]); R = ARC / phi; T = R * Math.tan(phi / 2);
  }
  // (n: the unit vector in the arc's plane, square to the level line, on the straight's side)
  const nl = Math.hypot(d1[1], d1[2]), n = [0, d1[1] / nl, d1[2] / nl];
  const at = (a) => [P0[0] - R * Math.sin(a), P0[1] + R * (1 - Math.cos(a)) * n[1], P0[2] + R * (1 - Math.cos(a)) * n[2]];
  const top = at(phi), run = Math.hypot(RING[0] - top[0], RING[1] - top[1], RING[2] - top[2]);
  return { P0, arc: ARC, phi, R, d1, at, top, run, pitch: Math.asin(d1[1]), length: ARC + run };
})();
// THE COURT'S WAYS (the processional way, the pilgrims' round and the terrace walk are the design's; the aprons are
// invented): white slabs between borders of darker stone, a finger above the court's own paving.
//   axis: the processional way, 7 m wide on the axis from the porch to the base's lowest step;
//   the pilgrims' round: 3 m wide on the circle of 40 m about the axis, from the temple's apron round to the apron again;
//   walk: the terrace walk, along the north parapet;
//   aprons: 3 m round the base's lowest step, the temple's (x -45 to -25, 13.5 m each side of the axis), the altar's square.
// Nothing is set up within 2.1 m of a way's slabs (wayGap); people may stand at their edges.
const ROUND_R = 40, APRON = { x0: -45, x1: -25, half: 13.5 }, ROUND_HALF = 1.5, ROUND_END = 180 - Math.asin(APRON.half / ROUND_R) * 180 / Math.PI;
const WAYS = { axis: { pts: [[COURT.x1, 0], [7.5, 0]], half: 3.5, verge: 0 }, walk: { pts: [[COURT.x0 + 5, WALK_Z], [COURT.x1 - 5, WALK_Z]], half: ROUND_HALF, verge: 0 } };
// how far a place on the water is from the fairway's edge (less than 0: in it)
function fairGap(x, z) { let d = 1e9; for (let i = 0; i < FAIRWAY.pts.length - 1; i++) d = Math.min(d, segDist(x, z, FAIRWAY.pts[i], FAIRWAY.pts[i + 1])); return d - FAIRWAY.half; }
function segDist(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}
// THE LANDING'S PLACES north of the gate begin where a ship of the longest kind (23 m, stern to the quay, her yard 7 m to
// each side) lies wholly clear of the fairway: found in steps of half a metre north from the gate's pier. Four places
// 10.5 m apart: the first is the slip, the other three are berths; the fishermen's quay begins 12 m beyond the last.
const BERTH = (() => { let z = -GATE_W / 2 - 2; while (fairGap(QUAY_X1 + 2.6 + 23, z) < 23 * 0.3 + 0.2) z -= 0.5; return { slip: z, z: z - 10.5, n: 3, pitch: 10.5, fish: z - 3 * 10.5 - 12 }; })();
// THE SLIP (the harbour's own: a hauling way where a hull is drawn out to be scraped and pitched): a ramp 7.2 m wide cut
// 10 m into the quay at the landing's first place, falling from the quay's level at its head to 1 m under the water 5 m
// outside the quay's edge.
const SLIP = { z: BERTH.slip, half: 3.6, x0: QUAY_X1 - 10, x1: QUAY_X1 + 5, pitch: Math.atan((QUAY_Y + 1) / 15) };
const slipY = (x) => QUAY_Y - (x - SLIP.x0) * Math.tan(SLIP.pitch);
// the hull on the slip: every heave (5 s) she creeps a hand's breadth (0.1 m) up the slip and settles back
const HAUL = { heave: 5, creep: 0.1 };
function haulAt(t, q) { const f = t / HAUL.heave + q.heave, g = f - Math.floor(f); return HAUL.creep * (smoothstep(0.08, 0.5, g) - smoothstep(0.62, 0.98, g)); }
// how far a place is from the nearest way's slabs (less than 0: on them)
function wayGap(x, z) {
  let g = 1e9;
  for (const k in WAYS) { const w = WAYS[k]; let d = 1e9; for (let i = 0; i < w.pts.length - 1; i++) d = Math.min(d, segDist(x, z, w.pts[i], w.pts[i + 1])); g = Math.min(g, d - w.half - w.verge); }
  if (Math.abs(Math.atan2(z, x)) * 180 / Math.PI < ROUND_END) g = Math.min(g, Math.abs(Math.hypot(x, z) - ROUND_R) - ROUND_HALF);
  return g;
}
// how far a place in the court is from the porch's front (its west face between the wings' ends)
function porchFrontGap(x, z) { return Math.hypot(PORCH.x0 - x, Math.max(0, Math.abs(z) - PORCH.wing)); }
function routeKnots() {
  const k = [], fw = FAIRWAY.pts, yp = PORCH_LENS, C = CLIMB;
  for (let i = 0; i < 3; i++) k.push([lerp(ENTRY_X, fw[1][0], i / 3), LENS_SEA, fw[0][1]]);
  // round the bend the lens lifts from 2.6 m over the water to 2.45 m over the quay at its edge (3.95 m over the water
  // there, its most before the quay), and comes onto the gate's
  // axis over the quay: at the quay's middle a sixth of the landing's offset is left, in the gate's middle none
  k.push([fw[1][0], LENS_SEA, fw[1][1]], [fw[2][0], LENS_SEA + 0.15, fw[2][1]], [fw[3][0], LENS_SEA + 0.8, fw[3][1]], [fw[4][0], QUAY_Y + 2.45, fw[4][1]]);
  k.push([(QUAY_X0 + QUAY_X1) / 2, QUAY_Y + 3.1, fw[4][1] / 6], [(WALL_X0 + WALL_X1) / 2, QUAY_Y + 3.3, 0]);
  for (const x of AV_KNOTS) k.push([x, lensY(x), 0]);
  const xa = AV_KNOTS[AV_KNOTS.length - 1], ya = avenueY(xa) + LENS_AV;
  for (let i = 1; i <= 3; i++) k.push([lerp(xa, PORCH.x1, i / 3), lerp(ya, yp, i / 3), 0]);
  k.push([(PORCH.x0 + PORCH.x1) / 2, yp, 0], C.P0);
  for (let i = 1; i <= 4; i++) k.push(C.at(C.phi * i / 4));
  for (let j = 1; j <= 6; j++) k.push([C.top[0] + C.d1[0] * C.run * j / 6, C.top[1] + C.d1[1] * C.run * j / 6, C.top[2] + C.d1[2] * C.run * j / 6]);
  return k;
}

// Everything that is dealt or placed by rule and that moves or stands near the flown line: the route and every course.
// A pure function of the kit's core, the seed and the visit's dials; build() draws the world from what it returns.
export function layoutOf(core, seed, vary = {}) {
  const a = layoutShips(layoutRoute(), seed, vary);
  return { ...a, ...lifeOf(a) };
}
// the layout in three parts (build() takes them in three steps): the route and its places; the ships; the people (lifeOf)
function layoutRoute() {
  const path = makePath(routeKnots()), L = path.length, _v = new THREE.Vector3();
  // the route laid out as points half a metre apart: the metre abeam of a place is the foot of the perpendicular on the
  // route's own pieces, and a place's distance from the route is its distance to the nearest piece (both in plan)
  const n = Math.round(L / 0.5), step = L / n, rx = new Float64Array(n + 1), rz = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) { path.posAtDist(i * step, _v); rx[i] = _v.x; rz[i] = _v.z; }
  const foot = (x, z) => {
    let best = 1e18, m = 0;
    for (let i = 0; i < n; i++) {
      const dx = rx[i + 1] - rx[i], dz = rz[i + 1] - rz[i], t = clamp(((x - rx[i]) * dx + (z - rz[i]) * dz) / (dx * dx + dz * dz || 1), 0, 1), ex = x - rx[i] - dx * t, ez = z - rz[i] - dz * t, d = ex * ex + ez * ez;
      if (d < best) { best = d; m = (i + t) * step; }
    }
    return { m, dist: Math.sqrt(best) };
  };
  const mAt = (x, z) => foot(x, z).m, gap = (x, z) => foot(x, z).dist, fw = FAIRWAY.pts;
  // the places along the line, in metres: the fairway's bend, the quay's edge, the gate, the low zone's end, the square's two
  // edges and its middle, the last cross lane, the porch's front, middle and west edge, where the climb's straight begins,
  // the ring
  const M = { bend: mAt(fw[1][0], fw[1][1]), quay: mAt(QUAY_X1, fw[4][1]), gate: mAt((WALL_X0 + WALL_X1) / 2, 0), low: mAt(LOW_ZONE_X, 0), crest: mAt(RISE.xc, 0), sq0: mAt(SQ.x1, 0), sqm: mAt(RISE.x1, 0), sq1: mAt(SQ.x0, 0), up: mAt(LANES[2] - LANE_W / 2, 0), lane: mAt(LANES[3], 0),
    front: mAt(PORCH.x1, 0), mid: mAt((PORCH.x0 + PORCH.x1) / 2, 0), west: mAt(PORCH.x0, 0), straight: mAt(CLIMB.top[0], CLIMB.top[2]), end: L };
  // where on the climb the lens stands as high as his knees (13 m above the court's paving)
  const lensAt = (h) => { let a = M.straight, b = L; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (path.posAtDist(m, _v).y < COURT_Y + h) a = m; else b = m; } return (a + b) / 2; };
  // (and where it stands as high as the middle of his waist; build() takes that height from the part's own info and
  // asks lensAt again)
  M.knees = lensAt(KNEES); M.waist = lensAt(WAIST);
  return { path, L, M, mAt, gap, lensAt };
}
function layoutShips(route, seed, vary = {}) {
  const { path, L, M, mAt, gap } = route;
  const mk = (name) => makeRng(hashSeed(name + ':' + seed));
  const density = clamp(vary.density ?? 1, 0.7, 1.15), rare = !!vary.rare;

  // ---- ships: each kind from a stream of its own; every one at a dealt place or on a closed course in a NAMED water of the
  // plan: HARBOUR, the great harbour between the quay and the great mole's end; FAIRWAY, the lane 18 m wide kept clear in it
  // from the roads to the gate; ROADS, the harbour's outer 62 m, kept open for ships under way.
  // THE GUARD'S LANE (ours: no source gives the harbour's guard a round; it is invented, by place). A watch of the harbour's
  // guard, three ships, rows its round on the festival morning well south of the fairway, out of sight of a ship coming
  // in on the fairway; on a rare visit the whole squadron rows it (three or four ships, at a quicker stroke). The round
  // lies on the south hand of the fairway (the left of a ship coming in). Its north reach runs along the fairway's outer
  // leg with her keel two hulls' lengths (72 m) south of the fairway's middle: the sea room a ship under sail needs to
  // wear round and come up into the fairway, with the boatmen's water between. The two reaches (38 m) are joined
  // by half circles whose radius is a hull's length (36 m), so that a ship turns as a ship can: the west turn comes 18 m
  // off the quay (clear of the ship at the gate's berth), the east turn reaches the mole's end line. They row out along
  // the fairway and come in again on the far reach, evenly apart; the stream deals where the first is and every ship's
  // stroke.
  const H = HARBOUR, fz = FAIRWAY.pts[0][1];
  const WR = WAR.L, hcz = fz + 2 * WR + WR, xw = QUAY_X1 + 18 + WR, xe = H.x1 - WR, hcx = (xw + xe) / 2, hax = (xe - xw) / 2 + WR, haz = WR;
  const warPts = stadiumPts(hcx, hcz, 1, 0, (xe - xw) / 2, WR, 24, 1), rwar = mk('warships'), warCourse = makeCourse(warPts, true);
  const rowS0 = rwar.range(0, warCourse.length), strokes = [0, 1, 2, 3].map(() => rwar.range(0, 6.28)), squadron = rwar.int(3, 4);
  const nRow = rare ? squadron : 3, rowGap = warCourse.length / nRow, rowV = rare ? 3.2 : 2.9;
  const war = [];
  for (let i = 0; i < nRow; i++) war.push({ kind: 'row', course: warCourse, s0: rowS0 - i * rowGap, v: rowV, phase: strokes[i], tint: i });
  // how far a place on the water is from the guard's lane (the water a rowing ship's oars sweep on her round)
  const laneGap = (x, z) => { let d = 1e9; for (let i = 0; i < warPts.length; i++) d = Math.min(d, segDist(x, z, warPts[i], warPts[(i + 1) % warPts.length])); return d - WAR.oarReach; };
  // SHIPS UNDER SAIL: two merchantmen, half a round apart, sail one closed reach across the one wind in the mole's lee
  // (the HARBOUR north of the fairway, 50 m and more from its middle, 12 m and more from the mole): out on one straight leg
  // and back on the other, the two joined by half circles of a hull's length (20 m). The length of the legs and the
  // round's place in that water are dealt. The yard is braced by the leg (a rule of the heading and the wind: brace()).
  const merchants = [], rsa = mk('sails'), sailCourses = [];
  const wl = Math.hypot(0.72, 0.69), wx = 0.72 / wl, wz = 0.69 / wl;
  { const SR = 20, half = rsa.range(14, 19), dir = rsa.chance(0.5) ? 1 : -1, fx = rsa.range(0, 1), fzz = rsa.range(0, 1), s0 = rsa.range(0, 1), ph = rsa.range(0, 6.28), tint = rsa.int(0, 5);
    const ex = half * wz + SR, ez = half * wx + SR, x0 = H.x0 + 34 + ex, x1 = H.x1 - 30 - ex, z0 = H.z0 + 12 + ez, z1 = fz - 50 - ez, cx = lerp(x0, Math.max(x0, x1), fx), cz = lerp(z0, Math.max(z0, z1), fzz);
    const pts = stadiumPts(cx, cz, wz, -wx, half, SR, 16, dir), course = makeCourse(pts, true);
    sailCourses.push({ cx, cz, a: half + SR, pts });
    for (let k = 0; k < 2; k++) merchants.push({ kind: 'sailing', course, s0: (s0 + k / 2) * course.length, v: 2.6, len: 20, ph: ph + k * 2.1, tint: tint + k * 2 }); }
  const offSails = (x, z, d) => !sailCourses.some((c) => Math.hypot(c.cx - x, c.cz - z) < c.a + d && c.pts.some((p) => Math.hypot(p[0] - x, p[1] - z) < d));
  // THE LANDING north of the gate: first THE SLIP (the place nearest the gate: SLIP), then three berths 10.5 m apart where
  // ships lie MOORED stern-to; six in ten of them have the sail loosed from the yard to dry in the first sun. Beyond them
  // the quay is the FISHERMEN'S QUAY (nets on their racks); south of the gate's berth lie the nets and the donkeys' walk.
  const rmo = mk('moored');
  for (let k = 0; k < BERTH.n; k++) {
    const z = BERTH.z - BERTH.pitch * k, take = rmo.chance(Math.min(0.95, 0.85 * density)), dry = rmo.chance(0.6), pk = rmo.pick([15, 19, 19, 23]), len = dry ? 20 : pk, per = rmo.range(20, 40), ph = rmo.range(0, 6.28), tint = rmo.int(0, 5);
    if (take || k === 0) merchants.push({ kind: 'moored', x: QUAY_X1 + 2.6 + len / 2, z, hx: 1, hz: 0, len, swing: 0.02, per, ph, tint, dry });
  }
  // THE SHIP ON THE SLIP: a merchantman of 15 m is being hauled out stern first. Her keel lies on the slip's rollers, her
  // stern a dealt 1.5 to 4 m below the slip's head, her forefoot still in the water. With every heave (5 s, the phase
  // dealt) she creeps a hand's breadth up and settles back (haulAt: a closed cycle, the same at every clock).
  { const rsl = mk('slip-ship'), len = 15, up = rsl.range(1.5, 4), cs = Math.cos(SLIP.pitch), xs = SLIP.x0 + up, xc = xs + len / 2 * cs;
    merchants.push({ kind: 'hauled', x: xc, z: SLIP.z, hx: 1, hz: 0, len, swing: 0, per: HAUL.heave, ph: rsl.range(0, 6.28), heave: rsl.range(0, 1), tint: rsl.int(0, 5), lift: slipY(xc) + 1.4 / cs, tilt: SLIP.pitch, stern: xs }); }
  // THE SHIP AT THE GATE'S BERTH: one merchantman lies broadside to the quay south of the gate (the berth's middle 28 m from
  // the axis: clear of the fairway), her bow toward the gate, her sail brailed up to the yard, a gangplank from her waist to the quay
  const rgb = mk('gate-ship'), gateShip = { kind: 'moored', broadside: true, x: QUAY_X1 + 0.9 + 0.145 * 19, z: GATE_BERTH_Z, hx: 0, hz: -1, len: 19, swing: 0.008, per: rgb.range(20, 40), ph: rgb.range(0, 6.28), tint: rgb.int(0, 5) };
  merchants.push(gateShip);
  // NO SHIP RIDES AT ANCHOR INSIDE THE MOLE (a rule of the harbour, ours): the roads and the inner water between the roads'
  // line and the landing (66 m from the entry to the quay) are kept open for ships under way and for those that turn there
  // to come stern-to at the landing. The ships that wait for a berth lie outside the mole, behind the entry, where no
  // place of the route sees them: they are not built.
  // SHIPS UNDER SAIL FAR OUT (ours): two merchantmen sail the open sea north west of the town, along the north coast and
  // back, each on a long closed reach of her own (east and west, 100 to 290 m off the shore, 1.0 to 1.5 km from the
  // statue), the two reaches joined by half circles of 30 m. Where each reach lies, its length, the ship's place on it
  // and which way round she goes are dealt.
  const farSails = [], rfs = mk('far-sails');
  for (let k = 0; k < 2; k++) {
    const cx = rfs.range(-1250, -950), cz = -550 - 130 * k - rfs.range(0, 60), half = rfs.range(180, 260), dir = rfs.chance(0.5) ? 1 : -1, s0 = rfs.range(0, 1), ph = rfs.range(0, 6.28), tint = rfs.int(0, 5);
    const course = makeCourse(stadiumPts(cx, cz, 1, 0, half, 30, 12, dir), true);
    farSails.push({ kind: 'sailing', course, s0: s0 * course.length, v: 2.6, len: 20, ph, tint });
  }
  // ROWING BOATS (the harbour's boatmen, who ply between the ships and the gate's landing): each on a small oval of its
  // own, dealt over THE BOATMEN'S WATER: the inner water from 16 m off the quay to 24 m inside the roads' line, within 50 m
  // of the fairway's middle on its north hand (the landing's side) and within 30 m on its south hand (before the gate's
  // berth), the boats by turns north and south of it. An oval keeps its long half axis and
  // 4 m clear of the fairway's edge and of the water the guard's oars sweep, 16 m clear of the sailing reach, 6 m clear of
  // every lying hull's ends, and lies 30 m and more from the next oval (the stream is the search's own).
  const boats = [], rbo = mk('boats'), nBoat = Math.round(rbo.int(3, 5) * density);
  for (let i = 0, tries = 0; i < nBoat && tries < 600; tries++) {
    const x = rbo.range(H.x0 + 16, ROADS_X - 24), z = fz + (i % 2 ? rbo.range(0, 30) : -rbo.range(0, 50)), ax = rbo.range(6, 10), az = rbo.range(3.5, 6), dir = rbo.chance(0.5) ? 1 : -1, s0 = rbo.range(0, 1), v = rbo.range(0.9, 1.3), phase = rbo.range(0, 6.28);
    if (fairGap(x, z) < ax + 4 || laneGap(x, z) < ax + 4 || !offSails(x, z, 16 + ax)) continue;
    if (merchants.some((q) => q.kind !== 'sailing' && Math.hypot(q.x - x, q.z - z) < q.len / 2 + 6 + ax) || boats.some((q) => Math.hypot(q.x - x, q.z - z) < 30)) continue;
    const course = makeCourse(ovalPts(x, z, ax, az, 28, dir), true);
    boats.push({ x, z, course, s0: s0 * course.length, v, phase }); i++;
  }
  // the fishermen's boats lie bow to their quay, one every 6 to 11 m
  { const rfb = mk('fishing-boats'); for (let z = BERTH.fish - rfb.range(0, 4); z > -113; z -= rfb.range(6, 11)) boats.push({ x: QUAY_X1 + 3.7, z, hx: -1, hz: 0, swing: 0.07, per: rfb.range(9, 16), ph: rfb.range(0, 6.28), phase: rfb.range(0, 6.28) }); }
  return { path, L, M, mAt, gap, mk, density, rare, war, merchants, boats, farSails, gateShip, wars: { x: hcx, z: hcz, ax: hax, az: haz } };
}

// ---------------------------------------------------------------- the flight's pace and its looks (rules of the route's places: no seed, no clock)
// PACE: five shares of the mean, each the level of a place, and one common factor on all five that closes the 50 s (it
// comes out near 1): over the water, through the gate and up the rise over the roofs to its crest 1.6; in the square
// 0.76 (the liveliest place: the line is level and low between the plane trees); up the upper street 1.05 (people walk
// 2.45 m from the line); under the porch 0.63; on the climb before the statue 0.535.
// Where each change begins and ends: down the descent, from the rise's crest to the square's middle; over the square's
// west lane, from the square's west edge to the lane's far side; from the last cross lane to the porch's front; from
// the porch's west edge to where the climb's straight begins.
// THE LOOKS aim at three fixed places of the statue (the part's own), each a plain pull along the angle from the way ahead.
// Each is on from one place and whole at the next; it lets go from a third place over as many metres as it took to come
// on, and that third place is where the next look comes on:
//   his chest, in three pulls that add (the same place, so their order is nothing): over the water, on from the fairway's
//     bend, whole at the quay's edge and let go from there; over the roofs, on from the quay's edge, whole in the gate,
//     let go from the square's middle (through the rise and the descent the gaze is on him, a look up); up the town,
//     half as strong, on from the quay's edge, whole in the gate, let go from the last cross lane;
//   his feet: on from the last cross lane, whole at the porch's front (into the porch the gaze is level, through the
//     court to his base and feet); lets go from the porch's front;
//   HIS MIDDLE (18.25 m above the paving: half the height of his crown over the paving, 14.25 m above his soles, where
//     his hands lie on his thighs): on from the porch's front, whole where the climb's straight begins (under the roof
//     the gaze lifts from his feet to his middle). From the climb's foot the gaze rests there until the lens is as high
//     as his knees (13 m above the paving);
//   THE LINE OF HIS JAW (33 m above the paving, between his shoulders and the middle of his head: 29 m above his
//     soles, half a metre over the underside of his chin. r7 named it his throat; the pit of his throat lies 2.5 m
//     lower, and the look is not moved there): on from the place where the lens is as high as his knees, whole where
//     it is as high as the middle of his waist: the part's own height, info.heights.waistMiddle.overBaseFoot (24.6 m
//     above the paving: where his trunk is narrowest between ribs and hips), which build() reads from the part as it
//     reads his chest and feet; WAIST below is the same number typed, for the layout that is handed out before the
//     part is built (r7: it was a typed 22.5). The gaze rises with the lens. The ring hangs up the line ahead, on his
//     north side.
//   (r8) These two places are the part's own as well (info.looks.middle and info.looks.jaw: half the height of its
//     crown, and its soles' height and 29 m; the same numbers to the last bit), and build() reads them as it reads his
//     chest and feet. MIDDLE and JAW below are the same numbers typed: they stand in before the part is built, and for
//     a part that hands out neither.
// These last two do not let go by themselves, and they pull half as hard again as a whole look: the engine lets every
// look go over the last 27 m before the ring, and with that these two are whole until 18 m before it and gone 6 m before
// it; from there the gaze is the way ahead, to the ring.
// (HEAD is the middle of his head, 34.6 m above the paving. No look rests on it now: it is kept, and handed out in
// rules, as the place from which a line's distance to his head is measured.)
const CHEST = [0.5, COURT_Y + 28, 0], FEET = [0.8, COURT_Y + 5, 0], HEAD = [0.3, COURT_Y + 34.6, 0], KNEES = 13, WAIST = 24.6, MIDDLE = [0.3, COURT_Y + 18.25, 0], JAW = [0.3, COURT_Y + 33, 0];
const PACE = { water: 1.6, square: 0.76, street: 1.05, porch: 0.63, climb: 0.535 }, LOOK_AHEAD = 16;
function flightOf(path, L, M, chest = CHEST, feet = FEET, middle = MIDDLE, jaw = JAW) {
  const mean = L / DURATION;
  // a chain of levels: each [metre where the change begins, metre where it ends, the level after it]
  const chain = (F) => [[M.crest, M.sqm, PACE.square * F], [M.sq1, M.up, PACE.street * F], [M.lane, M.front, PACE.porch * F], [M.west, M.straight, PACE.climb * F]];
  const paceWith = (F) => { const c = chain(F); return (u) => { const m = u * L; let v = PACE.water * F; for (const [a, b, to] of c) v = lerp(v, to, smoothstep(a, b, m)); return v; }; };
  let fLo = 0.6, fHi = 2;
  for (let it = 0; it < 26; it++) {
    const F = (fLo + fHi) / 2, pc = paceWith(F); let sum = 0;
    for (let i = 0; i < 600; i++) sum += 1 / pc((i + 0.5) / 600);
    if (sum / 600 > 1) fLo = F; else fHi = F;
  }
  const quick = (fLo + fHi) / 2, pace = paceWith(quick);
  // a look by places: on from m0, whole at m1, and from m2 it lets go over as many metres as it took to come on
  const look = (at, m0, m1, m2, weight) => ({ at, from: m0 / L, to: Math.min(1, (m2 + m1 - m0) / L), fade: (m1 - m0) / (Math.min(L, m2 + m1 - m0) - m0), weight, steady: true, arc: true });
  // a look that comes on from m0, is whole at m1 and does not let go by itself (the route ends first)
  const hold = (at, m0, m1, weight) => ({ at, from: m0 / L, to: (L + m1 - m0) / L, fade: (m1 - m0) / (L + m1 - 2 * m0), weight, steady: true, arc: true });
  const pois = [
    look(chest, M.bend, M.quay, M.quay, 1),
    look(chest, M.quay, M.gate, M.sqm, 1),
    look(chest, M.quay, M.gate, M.lane, 0.5),
    look(feet, M.lane, M.front, M.front, 0.9),
    hold(middle, M.front, M.straight, 1.5),
    hold(jaw, M.knees, M.waist, 1.5),
  ];
  const levels = {}; for (const k in PACE) levels[k] = PACE[k] * quick;
  return { pace, quick, pois, mean, levels };
}

// ---- the people and the animals: who is where, by habit. Every one keeps to a place of its own that lies off the flown line:
// in the avenue the side strips (4.9 to 6.9 m from the middle), standers at the walls, knots in the roadway on the hand away
// from the line, the carts 4.7 m south of the middle, the lanes and the back streets; in the square everything 9 m and more
// from the middle; on the quay everything 4.4 m and more from the line, but for the guard at each pier of the gate (3.85 m)
// and the gate's round (3.4 m off on the way in, 2.2 m off in the gate's passage); in the court everything under the
// climbing line (which is 3.1 m and more above the paving there). A walker goes round and round a closed walk (round a block by its two lanes
// and the street behind it; up and down the quay; round the statue's base) and so never ends and never pops.
// habit 0 stands, 1 walks a closed course, 2 hauls on a rope with the hull on the slip, 3 walks a closed course loaded one way.
// Every kind has a stream of its own (mk(name)); the quality's detail deals nothing: each body carries a share `cut` (0 to 1,
// from its number in the list) and a lower detail draws only those under it.
const LANE_X = [288, 244, 196, 148, 100, WALL_STREET_X - 3.5], BACK_Z = 31;
// THE TWO SMALL DOORS OF THE HARBOUR WALL (invented): where the street behind the avenue's first blocks meets the wall, on
// each hand, a door for people on foot leads through the wall to the quay (its middle on that street's middle, 33.75 m
// from the axis; 2.4 m wide, 3 m high). THE GATE ROUND goes through them: see lifeOf.
const POSTERN = { z: (BACK_Z + GRID_HALF + ROW_PITCH) / 2, w: 2.4, h: 3.0 };
// the lower street's corner fountain stands in the mouth of the lane east of the square, against the corner of the north block
const CORNER_FOUNTAIN = [SQ.x1 + LANE_W - 0.85, -AV_HALF - 1.6];
const DONKEY_LANE = [-4.62, 1, 0.95], CART_LANE = 4.62;
// THE BIRDS as they are handed to the kit's flock. Every bird is dealt ON its course: the spread sideways and in height
// that the kit is handed is nothing, so the bound on the dealt places is 0 whatever curve deals them; the birds are strung
// along the course by a dealt lag (lag: the share of the round they are strung over). What parts them is the wander alone,
// and that is bounded: east and west one and a half times its first number, in height its second, north and south its
// third (the fourth is its pace). wave is the course's own rise and fall (twice a round); body is the bird's greatest
// half measure, wing tip or bill, at its largest dealt size.
const FLOCKS = {
  gulls: { wander: [2.4, 1.6, 3.6, 0.3], wave: 2.2, body: 0.9, lag: 1, kit: { species: 'gulls', size: 1, speed: 7.5 } },
  swifts: { wander: [2.4, 1.6, 3.6, 0.3], wave: 2.2, body: 0.45, lag: 1, kit: { species: 'swifts', size: 1, speed: 11 } },
  doves: { wander: [1.4, 0.8, 2.1, 0.3], wave: 1, body: 0.5, lag: 0.5, kit: { species: 'crows', size: 0.66, speed: 9, flap: 5.5, glide: 0.15, body: '#8c939b', belly: '#a6acb3', wingC: '#7e858e', tip: '#3c4046', head: '#6f7780', tailC: '#5b6168' } },
};
// how far a bird can be from its ring, sideways (h) and in height (v): from what the kit is handed and nothing else
const flockReach = (kind) => { const f = FLOCKS[kind]; return { h: Math.hypot(1.5 * f.wander[0], f.wander[2]) + f.body, v: f.wander[1] + f.wave + f.body }; };
// the stand-off a flock keeps from the flown line beyond its own reach: 2.0 m of clear air and a metre more
const FLOCK_STAND = 3;
// what the kit's flock is handed for one ring: the count, the course (24 places round the ring), no spread but the lag,
// the wander, the bird (every bird at its true size: the kit draws them half as large again unless told); the bound on the
// kit's own bell-curve draws (three sigma: every flock is of the kit's loose form, where that bound holds); and the
// flown line with the 2.0 m of clear air every bird keeps from it, which the kit holds by shifting the course where a
// ring's own stand-off would not be enough (it takes no draw)
function flockOf(g, i, path) {
  const f = FLOCKS[g.kind], route = [], plain = g.plain ? { lod: 'low' } : {};
  for (let k = 0; k < 24; k++) { const a = k / 24 * 6.2832; route.push([g.c[0] + Math.cos(a) * g.r, g.c[1] + f.wave * Math.sin(a * 2 + i), g.c[2] + Math.sin(a) * g.r]); }
  return { count: g.n, route, closed: true, spread: [0, 0, f.lag * 2 * Math.PI * g.r], wander: f.wander, maxSigma: 3, keepClear: { path, dist: 2 }, ...f.kit, ...plain };
}
function lifeOf(lay) {
  const { gap, mk, density, merchants } = lay, people = [], animals = [];
  let thin = density * 0.45;
  const far = (x, z, d) => gap(x, z) >= d;
  // a body is dealt whole from its stream (body) and takes its place in the list (put); add does both
  const body = (r, o) => {
    const kind = o.kind ?? (r.chance(0.42) ? 0 : 1), sc = kind === 0 ? r.range(0.91, 0.99) : kind === 1 ? r.range(0.95, 1.03) : r.range(0.85, 1.1);
    const q = { zone: 'A', kind, habit: 0, x: 0, z: 0, face: 0, sc, ph: r.range(0, 6.28), hat: kind === 1 && r.chance(0.3) ? 1 : 0, jar: 0, sack: 0, g: r.int(0, 7), w: r.int(0, 5), lat: 0, back: 0, cut: 0, ...o };
    q.kind = kind; q.sc = sc;
    return q;
  };
  const put = (q) => { q.cut = (people.length * 0.618034) % 1; people.push(q); return q; };
  const add = (r, o) => put(body(r, o));
  // a knot of two to four standing together, turned to their own middle
  const knot = (r, zone, x, z, n, rad = 0.55) => {
    const a0 = r.range(0, 6.28);
    for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.2832 + r.range(-0.25, 0.25); add(r, { zone, x: x + Math.cos(a) * rad, z: z + Math.sin(a) * rad, face: a + Math.PI + r.range(-0.3, 0.3), kind: i === 0 && r.chance(0.25) ? 2 : undefined }); }
  };
  // a walk round a block: e metres out from its walls on the avenue (from the strip's own distance), in the lanes and behind
  const blockWalk = (side, i, span, zLane, dir) => {
    const e = AV_HALF - Math.abs(zLane), le = e > 3 ? 2.6 : Math.min(e, 2.4) * 0.9, eb = 0.6 + (e - 0.9);
    const xe = (i === 0 ? 286 : LANE_X[i] - LANE_W / 2) + (i === 0 ? Math.min(le + 0.4, 3.2) : le), xw = LANE_X[i + span] + LANE_W / 2 - le;
    return makeCourse(rectPts(xw, side * (AV_HALF - e), xe, side * (BACK_Z + eb), dir * side), true, 0.7);
  };
  // ---- THE AVENUE ON THE FESTIVAL MORNING. The middle way (1.8 m each side of the axis) is kept clear; the crowd keeps to both
  // sides of it, thickest at its edges. On each side three lines: nearest the way a line going UP to the god (2.45 m from the
  // axis), beside it a second line going up (2.95 m), and a line coming down (3.55 m); then the foot way under the walls, where
  // the ox carts (south) and the donkey train (north) go in the lower street (4.62 m) and people stand at doors and shops.
  // Everybody on one round walks at one pace, so nobody ever walks through the one ahead.
  //   THE ROUNDS: who goes up the first line comes down the third (a walk up one line and back down the other, turning 6 to
  //   9 m into the cross lane at each end); who goes up the second line comes home round the block by the back street. So
  //   two in three of those in the street are going up. Nobody ends, turns round or crosses the middle way in the avenue.
  //   Those going up carry what they bring: a water jar, a leafy branch, a garland, a basket or a sack.
  const UP1 = 2.45, UP2 = 2.95, DOWN = 3.55, load = (r, q, share) => {
    const c = r.range(0, 1) * 0.62 / share;
    if (q.kind === 0) { if (c < 0.3) q.jar = 1; else if (c < 0.62) q.branch = 1; } else if (q.kind === 1) { if (c < 0.28) q.sack = 1; else if (c < 0.55) q.jar = 1; } else if (c < 0.45) q.branch = 1;
  };
  const rwa = mk('avenue-rounds');
  const stripWalk = (side, ie, iw, v) => {
    const wallE = ie === 0 ? 286 : LANE_X[ie] - LANE_W / 2, wallW = LANE_X[iw] + LANE_W / 2, oE = ie === 0 ? 0.5 : 3.4, oW = 3.4, De = rwa.range(6, 9), Dw = rwa.range(6, 9);
    const za = side < 0 ? DOWN : UP1, zb = side < 0 ? UP1 : DOWN;
    const pts = [[wallW - oW - 0.7, side * za], [wallE + oE + 0.7, side * za], [wallE + oE + 0.7, side * (za + De)], [wallE + oE, side * (za + De)], [wallE + oE, side * zb], [wallW - oW, side * zb], [wallW - oW, side * (zb + Dw)], [wallW - oW - 0.7, side * (zb + Dw)]];
    const course = makeCourse(side > 0 ? pts.reverse() : pts, true, 0.5), n = Math.round(course.length / 11 * density * rwa.range(0.92, 1.08));
    for (let k = 0; k < n; k++) {
      const s0 = (k + rwa.range(0.1, 0.9)) / Math.max(1, n) * course.length, q = add(rwa, { habit: 1, course, s0, v });
      load(rwa, q, 0.45);
      const with2 = rwa.chance(0.2), c = body(rwa, { habit: 1, course, s0: s0 - 0.8, v: q.v, kind: 2 }); load(rwa, c, 0.45); if (with2) put(c);
    }
  };
  for (const side of [-1, 1]) { stripWalk(side, 0, 2, 1.12); stripWalk(side, 2, 4, 1.05); stripWalk(side, 4, 5, 1.0); }
  const rwb = mk('avenue-up');
  for (const side of [-1, 1]) {
    const course = blockWalk(side, 2, 2, UP2, -1), n = Math.round(course.length / 22 * density * rwb.range(0.92, 1.08));
    for (let k = 0; k < n; k++) { const s0 = (k + rwb.range(0.1, 0.9)) / Math.max(1, n) * course.length, q = add(rwb, { habit: 1, course, s0, v: 1.08 }); load(rwb, q, 0.7); }
  }
  // THE GATE ROUND (one on each hand): the festival's people go up the way from the landing to the gate (3.4 m from the
  // axis), in by the gate close to its jamb (2.2 m from the axis: the middle of the gate is the procession's, as the
  // middle way is), up the avenue's second line to the first cross lane (x 244), out along that lane's east
  // side (the carts and the donkeys keep its middle and its west side), home by the street behind the first block, out
  // to the quay again through the wall's small door, along the wall's foot (3.15 m from its face, before the gate tower)
  // and down the quay to the landing behind those who stand along the way (9.8 m from the axis). They go in GROUPS of
  // three or four, a group to every 21 m of the round, the men garlanded.
  // THE LOWER STREET'S ROUND (one on each hand) takes the avenue's second line on from the first cross lane to the lane
  // at the square's east corner: up it, out along that lane, home by the street behind the block and in again down the
  // first cross lane (on the north hand east of the donkeys' line, on the south hand west of the carts').
  { const rsu = mk('lower-street-up');
    for (const side of [-1, 1]) {
      const course = makeCourse(rectPts(LANE_X[2] + LANE_W / 2 - 2.6, side * UP2, LANE_X[1] + (side < 0 ? 0.2 : -1.85), side * POSTERN.z, -side), true, 0.7), n = Math.round(course.length / 22 * density * rsu.range(0.92, 1.08));
      for (let k = 0; k < n; k++) { const s0 = (k + rsu.range(0.1, 0.9)) / Math.max(1, n) * course.length, q = add(rsu, { habit: 1, course, s0, v: 1.08 }); load(rsu, q, 0.7); }
    } }
  const rgo = mk('gate-round'), GATE_LINE = 2.2, WAY_LINE = 3.4, WAY_BACK = 9.8, WAY_END = QUAY_X1 - 4.4;
  [-1, 1].forEach((side) => {
    const xw = LANE_X[1] + 1.85, xq = WALL_X1 + 3.15;
    const pts = [[WALL_X0 - 1.6, UP2], [xw, UP2], [xw, POSTERN.z], [xq - 0.75, POSTERN.z], [xq, POSTERN.z - 0.8], [xq, WAY_BACK + 1.6], [xq + 0.8, WAY_BACK], [WAY_END, WAY_BACK], [WAY_END, WAY_LINE], [WALL_X1 + 5.4, WAY_LINE], [WALL_X1 + 2.6, GATE_LINE], [WALL_X0 - 0.4, GATE_LINE]].map(([x, z]) => [x, side * z]);
    const course = makeCourse(pts, true, 0.7), groups = Math.round(course.length / 21 * density * rgo.range(0.92, 1.08));
    for (let g = 0; g < groups; g++) {
      const s0 = (g + rgo.range(0.15, 0.85)) / Math.max(1, groups) * course.length, m = rgo.int(3, 4);
      for (let j = 0; j < 4; j++) { const q = body(rgo, { habit: 1, course, s0: s0 - j * 0.9 - rgo.range(0, 0.15), v: 1.08 }), c = rgo.range(0, 1); if (q.kind === 1) { if (c < 0.6) q.jar = 1; else if (c < 0.75) q.sack = 1; } if (j < m) put(q); }
    }
  });
  // standers on the foot way, watching the street: in the low zone and the upper street 1.25 m before the fronts (4.75 m from the
  // axis: wares stand at the walls' foot there); in the lower street, where the beasts go along the foot way, at the shops' own
  // doors and counters (5.72 m)
  const rst = mk('avenue-standers');
  for (const side of [-1, 1]) {
    for (let x = 282 - rst.range(0, 9); x > WALL_STREET_X + 3; x -= rst.range(9, 18) / density) {
      const n = rst.int(1, 3), zc = side * (x < LANE_X[1] && x > LANE_X[2] ? 5.72 : 4.75), turn = rst.range(-0.5, 0.5);
      if (LANE_X.some((lx) => Math.abs(x - lx) < 4.6) || (x > SQ.x0 - 1 && x < SQ.x1 + 1)) continue;
      for (let i = 0; i < n; i++) add(rst, { x: x + (i - (n - 1) / 2) * 0.75 + rst.range(-0.1, 0.1), z: zc, face: (side > 0 ? -1 : 1) * Math.PI / 2 + (n > 1 ? (i - (n - 1) / 2) * -0.9 * side : turn) });
    }
  }
  // at the corner fountain: three or four with their jars
  { const rfo = mk('corner-fountain'), fx = CORNER_FOUNTAIN[0], fz = CORNER_FOUNTAIN[1];
    for (let i = 0, n = rfo.int(3, 4); i < n; i++) { const a = Math.PI * (0.62 + 0.76 * (i + rfo.range(0.2, 0.8)) / n), rad = rfo.range(1.25, 1.7); add(rfo, { kind: 0, x: fx + Math.cos(a) * rad, z: fz + Math.sin(a) * rad * 0.9, face: a + Math.PI, jar: rfo.chance(0.5) ? 1 : 0 }); } }
  { // the donkey trains: each a driver and three loaded donkeys; three trains a third of the round apart go round the two blocks
    // between the lanes at x 244 and x 148 on the north side, 4.62 m from the avenue's middle and up the middle of those two
    // lanes (where no strip walk turns). The avenue is 39 parts in 100 of the round, so at every clock one train at least
    // is on the avenue. The stream deals the phase.
    const rdk = mk('avenue-donkeys'), [zl, dir, v] = DONKEY_LANE, course = blockWalk(-1, 1, 2, zl, dir), s00 = rdk.range(0, course.length);
    for (let t = 0; t < 3; t++) {
      const s0 = s00 + t * course.length / 3;
      add(rdk, { habit: 1, course, s0, v, kind: 1, hat: 1, keep: 1 });
      for (let i = 0; i < 3; i++) animals.push({ kind: 0, habit: 1, course, s0: s0 - 2.3 - 2.25 * i, v, sc: rdk.range(0.92, 1.05), ph: rdk.range(0, 6.28), tint: rdk.int(0, 2) });
    }
  }
  { // the ox carts: each a pair of oxen under a yoke on one pole, a driver walking at their heads. Three go round one closed course,
    // evenly spaced: up the avenue's south side 4.62 m from its middle from the lane at x 244 to the lane at x 148 (through the
    // square), south up the middle of that lane, east along the street behind the blocks and down the middle of the lane at x 244
    // again, each corner taken on a curve of 3.4 m (a yoke on a pole does not turn on the spot). The climb up the avenue is 38
    // parts in 100 of the round, so at every clock one cart at least is climbing the avenue. The stream deals the phase.
    const rct = mk('carts'), course = makeCourse(rectPts(LANE_X[3], CART_LANE, LANE_X[1], BACK_Z + 1.08, -1, 3.4), true, 0.7), s0 = rct.range(0, course.length), v = 0.62;
    for (let i = 0; i < 3; i++) {
      const s = s0 + i * course.length / 3;
      animals.push({ kind: 2, habit: 1, course, s0: s, v, sc: 1, ph: rct.range(0, 6.28), tint: rct.int(0, 4) });
      add(rct, { habit: 1, course, s0: s + 5.4, v, kind: 1, hat: 1, keep: 1 });
    }
  }
  // ---- the market square, by its own plan (SQP). ONE MARGIN: nothing of the square's furniture stands within 2 m of its
  // east or west edge, and both hands are alike. LINES along the square, by their distance from the axis: the bronzes'
  // 7.6 m, the front stands' 11.4 m, the plane trees' 15.5 m, the back stands' 19.6 m. STANDS: a stand is 3.5 m long; the
  // front row's places lie 7 m apart about the square's middle, as many as the margins leave room for (six), the back row's
  // half a step on (five); the stream deals which are set up and moves each up to 0.3 m; none within 3.2 m of a tree's
  // place along the back row, none whose awning would reach the fountain house.
  // THE FOUNTAIN HOUSE takes the east end of the south hand's line of trees: its front on the trees' line, its plinth (3.3 m
  // to each side of its middle) one margin inside the square's east edge. PLANE TREES: three places to a row, evenly from a
  // crown's reach (8 m) inside the west edge to as far inside the east edge, both hands alike; a place within the margin of
  // the fountain house's plinth is no place (the south hand's east one: the house stands there), so the north row has
  // three trees and the south row two. The stream moves each a little (every place takes its draws, planted or not).
  // THE WOMEN AT THE FOUNTAIN stand in one rank along its step: the step reaches 0.9 m before the house's front, and each
  // stands off the step's edge by a jar's breadth (0.45 m: the jar is set down between her and the step while she waits)
  // and half her own depth (0.2 m).
  // BRONZES: at the four ends of the bronzes' line, at the margin; the stream leaves one out on some visits.
  // WALKS: a round about each front row (its ends half a margin inside the edges; 9.3 m and 13.2 m from the axis) and one
  // about each line of trees (its ends at the margin, on the south hand one margin short of the fountain house's plinth;
  // 14.6 m and 17.6 m out).
  const SQP = { margin: 2, bronze: 7.6, front: 11.4, tree: 15.5, back: 19.6, step: 7, stand: 3.5, mid: (SQ.x0 + SQ.x1) / 2, plinth: 3.3, crown: 8, fountStep: 0.9, jar: 0.45, depth: 0.4 };
  const rsq = mk('square'), square = { fountain: [SQ.x1 - SQP.margin - SQP.plinth, SQP.tree], trees: [], bronzes: [], stalls: [] };
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x0 = lerp(SQ.x0 + SQP.crown, SQ.x1 - SQP.crown, i / 2), tree = { x: x0 + rsq.range(-1, 1), z: side * (SQP.tree + rsq.range(-0.3, 0.3)), h: rsq.range(11, 13.5), tone: rsq.range(0, 1) };
    if (side < 0 || x0 < square.fountain[0] - SQP.plinth - SQP.margin) square.trees.push(tree);
  }
  { const rb = mk('square-bronzes'), xw = SQ.x0 + SQP.margin, xe = SQ.x1 - SQP.margin, spots = [[xe, -SQP.bronze], [xw, -SQP.bronze], [xw, SQP.bronze], [xe, SQP.bronze]], n = rb.int(3, 4), skip = rb.int(0, 3);
    spots.forEach(([x, z], i) => { const kind = rb.pick([0, 0, 1, 1]), size = rb.range(1.0, 1.3), baseH = rb.range(1.1, 1.5), tone = rb.range(0, 1), pose = rb.range(0, 1); if (n === 4 || i !== skip) square.bronzes.push({ x, z, y: avenueY(x), face: z < 0 ? Math.PI / 2 : -Math.PI / 2, kind, size, baseH, tone, pose, garland: false }); }); }
  // (every place of a row takes its draws, set up or not: the stand's dye and goods, its seller, three buyers)
  const rsl = mk('square-stalls'), nFront = Math.floor((SQ.x1 - SQ.x0 - 2 * SQP.margin - SQP.stand) / SQP.step) + 1;
  for (const side of [-1, 1]) for (const [zz, n] of [[SQP.front, nFront], [SQP.back, nFront - 1]]) for (let j = 0; j < n; j++) {
    const x = SQP.mid + SQP.step * (j - (n - 1) / 2), take = rsl.chance(Math.min(0.95, 0.72 * density)), tint = rsl.int(0, 5), goods = rsl.int(0, 2), nb = rsl.int(1, 3), jx = rsl.range(-0.3, 0.3);
    const z = side * zz, turn = side < 0 ? 0 : Math.PI, sg = side < 0 ? 1 : -1;
    const seller = body(rsl, { x: x + jx + rsl.range(-0.4, 0.4), z: z - sg * 0.95, face: sg * Math.PI / 2, kind: rsl.chance(0.5) ? 0 : 1 }), buyers = [];
    for (let i = 0; i < 3; i++) buyers.push(body(rsl, { x: x + jx + (i - (nb - 1) / 2) * 0.8 + rsl.range(-0.1, 0.1), z: z + sg * rsl.range(1.0, 1.25), face: -sg * Math.PI / 2 + rsl.range(-0.3, 0.3) }));
    const atTree = zz > SQP.tree && square.trees.some((t) => t.z * side > 0 && Math.abs(t.x - x) < 3.2), atFountain = side > 0 && x + SQP.stand / 2 > square.fountain[0] - SQP.plinth;
    if (!take || atTree || atFountain) continue;
    square.stalls.push({ x: x + jx, z, turn, tint, goods });
    put(seller); for (let i = 0; i < nb; i++) put(buyers[i]);
  }
  // walkers go round two closed walks on each hand (about the front row of stands; about the line of trees, before the back
  // row); knots stand under the trees (the roadway through the square is the walkers', the beasts' and the carts': no knot
  // stands in it); people in the shade of the stoas; women with jars before the fountain house's step
  const rsw = mk('square-walkers'), xwS = SQ.x0 + SQP.margin, xeS = (side) => (side > 0 ? square.fountain[0] - SQP.plinth - SQP.margin : SQ.x1 - SQP.margin);
  for (const side of [-1, 1]) for (const [xa, za, xb, zb, dir, v] of [[SQ.x0 + SQP.margin / 2, 9.3, SQ.x1 - SQP.margin / 2, 13.2, 1, 1.05], [xwS, 14.6, xeS(side), 17.6, -1, 0.9]]) {
    const course = makeCourse(rectPts(xa, side * za, xb, side * zb, dir * side), true, 0.7), n = Math.round(course.length / 16 * density * 0.9 * rsw.range(0.85, 1.2));
    for (let k = 0; k < n; k++) { const q = add(rsw, { habit: 1, course, s0: (k + rsw.range(0.15, 0.85)) / Math.max(1, n) * course.length, v }), c = rsw.range(0, 1); if (q.kind === 0 && c < 0.4) q.jar = 1; else if (q.kind === 1 && !q.hat && c < 0.3) q.sack = 1; }
  }
  // CHILDREN RUN IN THE SQUARE, a dog after them: on each hand a long round between the roadway's foot way and the front
  // row's walk (6.05 to 8.35 m from the axis, 13 m to each side of the square's middle; clear of the bronzes at its four
  // corners), two or three children a few strides apart at a child's run; on the north hand the dog runs behind the last.
  { const rch = mk('square-children');
    for (const side of [-1, 1]) {
      const course = makeCourse(stadiumPts(SQP.mid, side * 7.2, 1, 0, 13, 1.15, 5, side), true, 0.6), s0 = rch.range(0, course.length), v = rch.range(2.5, 2.9), n = rch.int(2, 3);
      for (let i = 0; i < 3; i++) { const q = body(rch, { habit: 1, course, s0: s0 - i * rch.range(2.2, 3.4), v, kind: 2, keep: 1 }); if (i < n) put(q); }
      if (side < 0) animals.push({ kind: 1, habit: 1, course, s0: s0 - 3 * 3.4 - 1.5, v, sc: 0.8, ph: rch.range(0, 6.28), tint: 2, dog: 1 });
    } }
  const rss = mk('square-standers'), taken = [];
  const sqFree = (x, z, gap) => !taken.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) && !square.trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.5) && (taken.push([x, z]), true);
  const rs1 = mk('square-knots');
  for (let i = 0, tries = 0, n = Math.round(rs1.int(6, 8) * density); i < n && tries < 200; tries++) {
    const side = rs1.chance(0.5) ? 1 : -1, x = rs1.range(xwS + 1, xeS(side) - 1), z = side * rs1.range(15.6, 16.6), m = rs1.int(2, 4);
    if (!sqFree(x, z, 3)) continue;
    knot(rs1, 'A', x, z, m); i++;
  }
  const wS = (SQ.x1 - SQ.x0) / SQ.n;
  for (const side of [-1, 1]) { const rs3 = mk(side < 0 ? 'square-stoa-north' : 'square-stoa-south'); for (let i = 0, tries = 0, n = Math.round(rs3.int(4, 6) * density); i < n && tries < 100; tries++) {
    const x = rs3.range(SQ.x0 + 1.5, SQ.x1 - 1.5), z = side * rs3.range(25.4, 29.4), f = (x - SQ.x0) % wS, m = rs3.int(1, 3);
    if (f < 2 || f > wS - 0.9 || !sqFree(x, z, 2.6)) continue;
    if (m === 1) add(rs3, { x, z, face: -side * Math.PI / 2 + rs3.range(-0.6, 0.6) }); else knot(rs3, 'A', x, z, m, 0.45);
    i++;
  } }
  for (let i = 0, n = rss.int(3, 4); i < n; i++) add(rss, { x: square.fountain[0] + (i - (n - 1) / 2) * 0.95 + rss.range(-0.1, 0.1), z: square.fountain[1] - SQP.fountStep - SQP.jar - SQP.depth / 2, face: Math.PI / 2 + rss.range(-0.3, 0.3), kind: 0, jar: i % 2 });
  // ---- the quay. North of the gate ships lie moored: by each a stack against the wall and porters between its stern and the stack,
  // loaded toward the wall. Walkers go up and down the quay's middle; knots stand on its seaward half, more of them near the gate;
  // south of the gate two donkey trains go round one short course along the wall's foot, half a round apart (so at every clock
  // one is on the stretch beside the gate); a man with a goat. Of these nothing stands or walks within 4.5 m of the flown line
  // (the gate's round and the gate's guard, further down, come nearer by lines of their own).
  const rq = mk('quay-cargo'), rpo = mk('quay-porters'), cargo = [], stalls = [];
  for (const m of merchants) {
    if (m.kind !== 'moored' || m.z > 0 || m.broadside) continue;
    cargo.push({ x: 298.3, z: m.z + rq.range(-1.5, 1.5), kind: rq.int(0, 2), n: rq.int(3, 6), ph: rq.range(0, 6.28) });
    { const landed = rq.chance(0.6), heap = { x: 314.0, z: m.z + rq.pick([-3.4, 3.4]), kind: rq.int(0, 2), n: rq.int(2, 4), ph: rq.range(0, 6.28) }; if (landed) cargo.push(heap); }
    const course = makeCourse(rectPts(300.6, m.z - 0.55, 316.6, m.z + 0.55, 1, 0.5), true, 0.5), n = rpo.chance(Math.min(0.9, thin)) ? 2 : 1;
    for (let k = 0; k < n; k++) add(rpo, { habit: 3, course, s0: (k + rpo.range(0.2, 0.8)) / n * course.length, v: 1.05, kind: 1, hat: rpo.chance(0.3) ? 1 : 0, sack: 1 });
  }
  // along the wall's foot, between the towers, a stack every 8 to 15 m from 39 m to 150 m on both sides of the gate (the
  // wall's foot between the gate tower and the small door is the gate round's); and on the
  // quay's seaward half two heaps landed beside the way to the gate
  const rqs = mk('quay-stacks');
  for (const sg of [-1, 1]) for (let z = 39 + rqs.range(0, 6); z < 150; z += rqs.range(8, 15) / Math.min(1.2, density + 0.2)) {
    const zz = sg * z, k = Math.round((z - 18) / 60), tz = 18 + 60 * k, kind = rqs.int(0, 2), n = rqs.int(3, 6), ph = rqs.range(0, 6.28);
    if (Math.abs(z - tz) < 6.5 || cargo.some((c) => c.x < 305 && Math.abs(c.z - zz) < 5)) continue;
    cargo.push({ x: 297.2, z: zz, kind, n, ph });
  }
  // (the two heaps beside the way to the gate: 7 m in from the quay's edge, 12.6 m north and 12.6 m south of the gate's axis)
  cargo.push({ x: QUAY_X1 - 7, z: -12.6, kind: rqs.int(0, 1), n: rqs.int(4, 6) }, { x: QUAY_X1 - 7, z: 12.6, kind: rqs.int(1, 2), n: rqs.int(3, 5) });
  // THE LOTS: cargo set down in lots on the quay before the gate, each lot one kind (jars standing in rows, sacks, corded
  // bales, coils of rope). North of the way six plots in two rows between the way's back line and the slip; south of
  // it three plots in a row toward the gate's berth; the stream deals which plots are taken (three in four at the plain
  // dial) and with what. And a small lot at the quay's edge on each hand of the way, where the boats land (always).
  // (r9) each of those two small lots carries the mark edge (the third figure of its place in the list below), by
  // which buildQuayThings stands the quay's jar in it where it is dealt jars; no draw is asked for the mark
  { const rlo = mk('quay-lots'), kinds = [0, 1, 3, 4, 3];
    for (const [x, z, edge] of [[304.6, -13.8], [304.6, -18.0], [304.6, -22.2], [308.6, -13.8], [308.6, -18.0], [308.6, -22.2], [312.9, 16.6], [312.9, 21.0], [312.9, 25.4], [QUAY_X1 - 2.1, -6.6, 1], [QUAY_X1 - 2.2, 4.9, 1]]) {
      const take = rlo.chance(Math.min(0.95, 0.75 * density)), kind = kinds[rlo.int(0, 4)], n = rlo.int(3, 4);
      if (take || edge) cargo.push({ x, z, kind, n: edge ? (kind === 0 ? 3 : 2) : n, lot: 1, edge });
    } }
  const rqw = mk('quay-walkers');
  for (const [za, zb] of [[-128, SLIP.z - SLIP.half - 2.4], [11.4, 150]]) for (const [inset, dir, v] of [[0, 1, 1.15], [0.7, -1, 1.28]]) {
    const course = makeCourse(rectPts(303.9 + inset, za + inset, 308.1 - inset, zb - inset, dir), true, 0.7), n = Math.round(course.length / 62 * thin * rqw.range(0.8, 1.2));
    for (let k = 0; k < n; k++) { const q = add(rqw, { habit: 1, course, s0: (k + rqw.range(0.15, 0.85)) / Math.max(1, n) * course.length, v }), jar = rqw.chance(0.3); if (q.kind === 0 && jar) q.jar = 1; }
  }
  { const rqd = mk('quay-donkeys'), course = makeCourse(rectPts(300.4, 12, 302.3, 72, 1, 0.9), true, 0.9), s0 = rqd.range(0, course.length);
    for (let t = 0; t < 2; t++) {
      const s = s0 + t * course.length / 2, n = rqd.int(3, 4);
      add(rqd, { habit: 1, course, s0: s, v: 0.95, kind: 1, hat: 1, keep: 1 });
      for (let i = 0; i < n; i++) animals.push({ kind: 0, habit: 1, course, s0: s - 2.3 - 2.25 * i, v: 0.95, sc: rqd.range(0.92, 1.05), ph: rqd.range(0, 6.28), tint: rqd.int(0, 2) });
    } }
  { const rqg = mk('quay-goat'), course = makeCourse(rectPts(308.9, 16.5, 310.1, 118, -1, 0.5), true, 0.5), s0 = rqg.range(0, course.length);
    add(rqg, { habit: 1, course, s0, v: 1.2, kind: 2, keep: 1 }); animals.push({ kind: 1, habit: 1, course, s0: s0 - 1.3, v: 1.2, sc: 0.85, ph: rqg.range(0, 6.28), tint: rqg.int(0, 2) }); }
  const spots = cargo.filter((c) => c.x > 305).map((c) => [c.x, c.z]), nets = [], rqn = mk('quay-nets');
  for (let i = 0, n = rqn.int(3, 4); i < n; i++) { const z = GATE_BERTH_Z + 18 + i * 30 + rqn.range(0, 14); nets.push({ x: 313.4, z, len: rqn.range(4, 5.5), ph: rqn.range(0, 6.28) }); spots.push([313.4, z - 1.6], [313.4, z + 1.6]); }
  { const rfq = mk('fishermens-quay'); for (let z = BERTH.fish + 1 - rfq.range(0, 5); z > -112; z -= rfq.range(11, 17)) { nets.push({ x: 313.4, z, len: rfq.range(4, 5.5), ph: rfq.range(0, 6.28) }); spots.push([313.4, z - 1.6], [313.4, z + 1.6]); } }
  // (and one rack north of the way, between it and the slip, 4.6 m from the quay's edge)
  { const rng = mk('quay-net-way'), z = -16.4; nets.push({ x: 313.4, z, len: 4.6, ph: rng.range(0, 6.28) }); spots.push([313.4, z - 1.6], [313.4, z + 1.6]); }
  const freeSpot = (x, z, gap) => !spots.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) && (spots.push([x, z]), true);
  // knots on the seaward half: two or three within 34 m of the gate (people gather where the way comes ashore), the rest along the
  // whole quay; some have goats with them
  const quayKnot = (rqk, z0, z1, count) => {
    for (let i = 0, tries = 0; i < count && tries < 300; tries++) {
      const x = rqk.range(312.8, 315.6), z = rqk.range(z0, z1), m = rqk.int(2, 4), goats = rqk.chance(0.4) ? rqk.int(1, 3) : 0;
      if (!far(x, z, 5.3) || (x > WAY_END - 1.6 && x < WAY_END + 1.6 && Math.abs(z) < WAY_BACK + 1.6) || (x > 314.9 && z > 5 && z < PLANK.z + 2) || Math.abs(z - SLIP.z) < SLIP.half + 1.6 || merchants.some((q) => q.kind === 'moored' && !q.broadside && Math.abs(q.z - z) < 2.2) || cargo.some((c) => Math.hypot(c.x - x, c.z - z) < 3.4) || !freeSpot(x, z, 4)) continue;
      knot(rqk, 'A', x, z, m); i++;
      for (let k = 0; k < goats; k++) animals.push({ kind: 1, habit: 0, x: x - 1.3 - 0.4 * k, z: z + 1.2 - 0.7 * k, face: rqk.range(0, 6.28), sc: rqk.range(1.05, 1.3), ph: rqk.range(0, 6.28), tint: rqk.int(1, 4) });
    }
  };
  { const ra = mk('quay-knots-gate'), rb = mk('quay-knots'); quayKnot(ra, -34, 34, Math.round(ra.int(2, 3) * density)); quayKnot(rb, -120, 140, Math.round(rb.int(5, 6) * thin)); }
  const rqe = mk('quay-edge');
  for (let i = 0, tries = 0, n = Math.round(rqe.int(3, 5) * thin); i < n && tries < 200; tries++) {
    const z = rqe.range(GATE_BERTH_Z + 12, 150), f = rqe.range(-0.4, 0.4); if (!freeSpot(317.1, z, 2.5)) continue;
    add(rqe, { x: 317.1, z, face: f }); i++;
  }
  // THE HAULING GANG: two lines of men on the two ropes, on the quay above the slip's head, their backs to the hull; they
  // step with every heave (habit 2). A foreman stands at the slip's head and watches the keel.
  { const rsg = mk('slip-gang'), hs = merchants.find((m) => m.kind === 'hauled'), nLine = Math.round(8 * Math.min(1, density + 0.1));
    for (const side of [-1, 1]) for (let i = 0; i < nLine; i++) add(rsg, { kind: 1, habit: 2, ship: hs, v: 0.3, x: SLIP.x0 - 0.7 - 0.95 * i, z: SLIP.z + side * 1.15, hat: rsg.chance(0.25) ? 1 : 0, keep: i < 5 ? 1 : 0 });
    add(rsg, { kind: 1, x: SLIP.x0 - 0.5, z: SLIP.z - SLIP.half - 0.9, face: 0.75, hat: 1, keep: 1 }); }
  const rqt = mk('quay-stalls');
  for (const sg of [-1, 1]) {
    // a stall against the wall on each hand of the gate, 3.6 m wide, beside the pier and clear of its hanging by 0.65 m; the
    // seller behind its board, one or two buyers 3.5 m out from the wall
    const zs = sg * (GATE_W / 2 + GATE_PIER + 0.65 + 1.8), xs = WALL_X1 + 0.1;
    stalls.push({ x: xs, z: zs, w: 3.6, face: 0, tint: rqt.int(0, 5), goods: rqt.int(0, 2) });
    add(rqt, { x: xs + 0.9, z: zs, face: 0, kind: rqt.chance(0.5) ? 0 : 1 });
    for (let i = 0, n = rqt.int(1, 2); i < n; i++) add(rqt, { x: xs + 3.5, z: zs + (i - (n - 1) / 2) * 0.9, face: Math.PI + rqt.range(-0.2, 0.2) });
  }
  // AT THE GATE: its guard, a man at the foot of each pier, turned to the harbour (his spear stands by him and his
  // shield leans on the pier: buildQuayThings); and on each hand a knot of three or four waiting before the pier, between
  // the stall and the round's line.
  { const rgw = mk('gate-waiting');
    for (const sg of [-1, 1]) {
      add(rgw, { x: WALL_X1 + 1.15, z: sg * 3.85, face: rgw.range(-0.25, 0.25), kind: 1, hat: 1, keep: 1, guard: 1 });
      knot(rgw, 'A', WALL_X1 + 3.9, sg * 4.9, rgw.int(3, 4), 0.5);
    } }
  // ---- THE GATE'S BERTH AND THE WAY IN. From the ship lying broadside south of the gate her cargo is carried in: porters come
  // down the gangplank, along the quay's edge and across to a stack at the gate's south pier, and go back unloaded by a lane of
  // their own; a man on the cargo hands the loads up, a tally man stands at the plank's foot. On both sides of the way in a
  // crowd stands along its edge, from the gate to the landing (none within 5.3 m of the flown line).
  { const rgp = mk('gate-porters'), pz = PLANK.z, xs = PLANK.x2 - 0.5, zi = 7.0, zo = 7.9, xw = 299.6;
    const course = makeCourse([[xs, pz - 0.3], [317.1, pz - 0.3], [317.1, zi], [xw, zi], [xw, zo], [316.2, zo], [316.2, pz + 0.3], [xs, pz + 0.3]], true, 0.45);
    const loadTo = (xs - 317.1) + (pz - 0.3 - zi) + (317.1 - xw), n = Math.max(3, Math.round(4 * density));
    for (let k = 0; k < n; k++) add(rgp, { habit: 3, course, loadTo, s0: (k + rgp.range(0.25, 0.75)) / n * course.length, v: 1.05, kind: 1, hat: rgp.chance(0.3) ? 1 : 0, sack: 1 });
    cargo.push({ x: 297.4, z: 6.0, kind: 1, n: 3 });
    add(rgp, { x: PLANK.x2 + 0.5, z: pz + 1.0, y: QUAY_Y + PLANK.rise - 0.1, face: Math.PI + 0.5, kind: 1, sack: 1 });
    add(rgp, { x: PLANK.x0 - 0.4, z: pz + 1.25, face: -0.6, kind: 1, hat: 1 });
    for (const sg of [-1, 1]) for (let rgc = mk(sg < 0 ? 'gate-crowd-north' : 'gate-crowd-south'), i = 0, tries = 0, n2 = Math.round(rgc.int(6, 8) * density), xs2 = []; i < n2 && tries < 200; tries++) {
      const x = rgc.range(302.6, 311.6), z = sg * rgc.range(5.5, 6.3), turn = rgc.range(-0.5, 0.5), kind = rgc.chance(0.15) ? 2 : undefined;
      if (!far(x, z, 5.3) || xs2.some((o) => Math.abs(o - x) < 0.75) || cargo.some((c) => Math.hypot(c.x - x, c.z - z) < 2.2)) continue;
      xs2.push(x); const q = add(rgc, { x, z, face: -sg * Math.PI / 2 + turn, kind }), jar = rgc.chance(0.3); if (q.kind === 0 && jar) q.jar = 1; i++;
    } }
  // ---- THE WAY'S LOTS AND THE LANDING'S (r7; ours, invented; the kinds are the quay's own: jars, sacks, corded bales,
  // coils of rope, baskets, baulks of timber, a hand cart, a stall's frame). A LOT IS A PLACE OF THE QUAY'S PLAN, the
  // same on every visit; what lies in it is dealt from the kinds by a stream of its own ('quay-way-lots': no older
  // stream is drawn on, and nobody is added, moved or thinned for a lot).
  //   THE WAY'S LOTS: along each edge of the middle way from the landing to the gate, inside the gate round's two
  //   lines (3.4 m from the axis), four lots on each hand: each 2.3 m long and 0.84 m deep, its face to the way 1.98 m
  //   from the axis and its back 0.58 m inside the walkers' line, 0.4 m between two, from x 302.5 (where the round's lines begin to close on the gate: the gate's
  //   passage and the 6.5 m before it stay clear) to x 312.9 (the round's turn is at x 313.6). Goods no higher
  //   than 1.1 m: the lens goes over the middle 2.8 m and more above the quay there.
  //   THE LANDING'S LOTS: on the quay's edge strip east of the round's turn (x 314.5 to 316.9), beside the two small
  //   lots that always lay there: north of the way one lot 2.3 m off the lens's line and one beyond the old lot; south
  //   of it one lot between the way and the old lot (south of that the porters go). Taller goods: jars stacked in
  //   two tiers, baulks, a loaded hand cart, bales three high; each place takes another kind. The far north place
  //   may be a knot's standing place on some visits: the deal asks, and a taken place is left bare.
  //   THE FRAME: a stall's frame under its awning, and a hand cart with its shafts down beside it, in the band
  //   behind the north crowd (between its backs, 6.6 m from the axis, and the round's back line, 9.8 m); on the south
  //   hand that band is the porters' lane, and nothing stands in it.
  //   TWO MOORING POSTS at the kerb, 2.2 m to each hand of the landing's middle (the fairway's end, z -1).
  //   THE LOTS' MEASURES (r8): the places below are written from the plan's and the gate round's own lines wherever
  //   the sum comes out the very number r7 typed, to the last bit. A lot's place feeds the hash that tones and sizes
  //   its goods (buildQuayThings), so a place one last bit off would change them: such a figure stays typed, and the
  //   line says so.
  const wayLots = [], rwl = mk('quay-way-lots');
  const LOT_LEN = 2.3, LOT_GAP = 0.4;   // a way lot's length along the way, and the clear ground between two
  const LOT_X0 = WALL_X1 + 6.5;   // the first lot begins 6.5 m before the wall's front: so much stays clear before the gate's passage
  const LOT_X1 = WAY_END - 0.7;   // the last lot ends 0.7 m short of the round's turn: as long as the stretch in which the round's walkers turn at a corner
  // how many lots that run takes, a gap between each two. The four fill it to the hair and the quotient comes out
  // 4.000000000000013; a billionth is added before the whole number is taken, for a last bit the other way would
  // make it three, and one lot fewer would move every draw of this stream after it
  const LOT_N = Math.floor((LOT_X1 - LOT_X0 + LOT_GAP) / (LOT_LEN + LOT_GAP) + 1e-9);
  const LOT_Z = WAY_LINE - 1;   // a way lot's middle, 1 m inside the walkers' line: the 0.58 m behind its back and half its depth of 0.84 m
  // the landing's strip: from 0.9 m east of the round's turn to 1.1 m short of the kerb (the mooring posts stand in that last metre)
  const EDGE_X0 = WAY_END + 0.9, EDGE_X1 = QUAY_X1 - 1.1;
  { const takenAt = (x0, z0, x1, z1) => [...people, ...animals].some((q) => !q.course && q.x > x0 - 0.8 && q.x < x1 + 0.8 && q.z > z0 - 0.8 && q.z < z1 + 0.8);
    for (const side of [-1, 1]) for (let i = 0; i < LOT_N; i++) wayLots.push({ x: LOT_X0 + LOT_LEN / 2 + (LOT_LEN + LOT_GAP) * i, z: side * LOT_Z, side, kind: rwl.int(0, 4), tone: rwl.range(0.88, 1.12), turn: rwl.int(0, 3) });
    const deal = [5, 6, 7, 8];
    for (let i = 3; i > 0; i--) { const j = rwl.int(0, i), t = deal[i]; deal[i] = deal[j]; deal[j] = t; }
    // the landing's three stand in the strip's middle (from the round's turn the same place would be WAY_END + 2.1,
    // which comes out 315.70000000000005, a last bit off: it is not written so). Across the way: -4.0, the lot north
    // of the way and off the lens's line, and -9.4, the one beyond the old north lot (which lies at -6.6), are r7's
    // own figures: no line of the plan or of the round gives them. The south one lies half way from the axis to the
    // old south lot (at 4.9). Each place is 1.8 m broad (0.9 to each hand: the broadest goods, the planks under the
    // upper jars, reach 0.83 m)
    [[-4.0, -1], [4.9 / 2, 1], [-9.4, -1]].forEach(([z, side], i) => wayLots.push({ x: (EDGE_X0 + EDGE_X1) / 2, z, side, edge: 1, kind: deal[i], tone: rwl.range(0.88, 1.12), turn: rwl.int(0, 3), taken: takenAt(EDGE_X0, z - 0.9, EDGE_X1, z + 0.9) })); }
  // the frame and its cart stand midway between the north crowd's far line (6.3 m from the axis: its deal above) and
  // the round's back line. Along the quay 306.9 (the frame) and 310.0 (the cart) are r7's own figures: no line of the
  // plan or of the round gives them (the frame's cloth lies from x 305.25 to 308.55, the cart's middle 3.1 m east of the frame's)
  const STALL_Z = -(6.3 + WAY_BACK) / 2;
  const wayStall = { x: 306.9, z: STALL_Z, tint: rwl.int(0, 3), goods: rwl.int(0, 2), cart: [310.0, STALL_Z], load: rwl.int(0, 1) };
  // ---- THE COURT OF HELIOS (the processional way, the pilgrims' round and what stands along it are the design's; the
  // details are invented). At the altar a priest and two attendants on its west side, turned to the sunrise; worshippers east
  // of it turned to the altar and the statue; people at the foot of the base on its east, north and south sides, looking up;
  // groups of visitors between the base and the round.
  // THE ROUND'S STATIONS: every 7.5 degrees of the round counted from the processional way, twenty on each hand (150 degrees
  // round, short of the temple's apron). At the INNER edge (36 m from the axis) every even station is a bronze's place, every
  // odd one a small altar's. At the OUTER edge (44 m) stations 1, 4, 7 ... are bronzes' places and 2, 5, 8 ... small altars';
  // behind stations 6, 12 and 18 is a place for a half round bench (its mouth 46.8 m out) and behind 9 and 15 a pair of
  // cypresses (47.6 m). THE COURT BEFORE THE PORCH LIES OPEN: a tree's place nearer to the porch's front than the porch's
  // own breadth (23 m) is no place (the pair behind station 3 on either hand). A place within 2.1 m of a way's slabs is left empty. The streams deal which places are taken:
  // 'dedication-places' nine to eleven of the bronzes' places, 'round-altars' eight to ten of the altars' (the first three
  // dealt burn incense), 'exedrae' two or three of the benches' (each carries a bronze on the pier in its back); every pair
  // of cypresses is planted. Three to five more bronzes stand on piers of the parapets (one place every 18 m along the terrace's:
  // 'parapet-bronzes').
  // THE ROUND'S PEOPLE: three closed walks along the slabs' two edges, 2.4 m from the round's middle: inside it the whole
  // round (out along the edge, back 34.3 m from the axis, behind the bronzes); outside it the south side and the north
  // side (each out along the edge and back 45.7 m out); groups stand at free altar places of the inner edge and look up.
  thin = density * 0.61;
  const C = 'C', toAxis = (x, z) => Math.atan2(-z, -x), AX = ALTAR[0], AZ = ALTAR[1], ral = mk('court-altar');
  add(ral, { zone: C, kind: 0, x: AX - 3.0, z: AZ, face: 0, g: 0, w: 0, hat: 0, priest: 1, keep: 1 });
  add(ral, { zone: C, kind: 1, x: AX - 2.7, z: AZ - 2.4, face: 0.35, hat: 0 }); add(ral, { zone: C, kind: 1, x: AX - 2.7, z: AZ + 2.5, face: -0.35, hat: 0 });
  animals.push({ kind: 1, habit: 0, x: AX - 3.6, z: AZ + 3.4, face: 0.5, sc: 1.2, ph: ral.range(0, 6.28), tint: 3 });
  const cs = [[AX - 3, AZ], [AX - 2.7, AZ - 2.4], [AX - 2.7, AZ + 2.5]];
  const cFree = (x, z, gap) => !cs.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) && (cs.push([x, z]), true);
  const offAltar = (x, z) => !(x > AX - 4.6 && x < AX + 3 && z > AZ - 5 && z < AZ + 5);
  const polar = (deg, r) => [Math.cos(deg * RAD) * r, Math.sin(deg * RAD) * r];
  const STN = 7.5, R_IN = 36, R_OUT = 44, R_BENCH = 46.8, R_CYP = 47.6, EDGE_OFF = 2.4, R_BACK_IN = 34.3, R_BACK_OUT = 45.7;
  const dedications = [], altars = [], exedrae = [], cypresses = [], bronzePlaces = [], altarPlaces = [], benchPlaces = [], pairPlaces = [];
  for (const sg of [-1, 1]) for (let k = 1; k <= 20; k++) {
    const deg = sg * STN * k;
    const put = (list, r, inner, dd = 0) => { const [x, z] = polar(deg + dd, r); if (wayGap(x, z) >= 2.1) list.push({ x, z, inner, face: toAxis(x, z) + (inner ? Math.PI : 0) }); };
    put(k % 2 ? altarPlaces : bronzePlaces, R_IN, true);
    if (k % 3 === 1) put(bronzePlaces, R_OUT, false); else if (k % 3 === 2) put(altarPlaces, R_OUT, false);
    else if (k % 6 === 0) put(benchPlaces, R_BENCH, false);
    else if ([-2.6, 2.6].every((dd) => porchFrontGap(...polar(deg + dd, R_CYP)) >= 2 * PORCH.wing)) { put(pairPlaces, R_CYP, false, -2.6); put(pairPlaces, R_CYP, false, 2.6); }
  }
  // THE WAY'S FOUR TALL TRIPODS' PLACES (by the plan alone: they are set up further down, where they always stood). A
  // place of the round within 2.1 m of one of them is TAKEN (2.1 m: the plan's own margin for what stands by a way).
  const tallPlaces = [];
  { const off = 2.1, zt = WAYS.axis.half + off; for (const rad of [ROUND_R - ROUND_HALF - off, ROUND_R + ROUND_HALF + off]) for (const sg of [-1, 1]) tallPlaces.push([Math.sqrt(rad * rad - zt * zt), sg * zt]); }
  const tallTakes = (q) => tallPlaces.some((t) => Math.hypot(t[0] - q.x, t[1] - q.z) < 2.1), bearing = (q) => Math.abs(Math.atan2(q.z, q.x));
  // (r7) THE DEAL ASKS WHETHER THE PLACE IS TAKEN: where it falls on a place a tall tripod has taken (or on one that such
  // a move has filled before), the bronze takes the next free place of its own round: the same edge, the same hand, the
  // next station on from the way. Both streams take the same draws in the same order and ranges as before (a filled
  // place stays in the list, marked), so every other bronze stands where it stood; no tall tripod is moved.
  const rdp = mk('dedication-places'), rd = mk('dedications');
  for (let n = Math.min(bronzePlaces.length, rdp.int(9, 11)), i = 0; i < n; i++) {
    let q = bronzePlaces.splice(rdp.int(0, bronzePlaces.length - 1), 1)[0];
    const kind = rd.pick([0, 0, 1, 1, 2]), size = kind === 2 ? rd.range(0.9, 1.25) : rd.range(1.0, 1.3), baseH = rd.range(1.0, 1.6), tone = rd.range(0, 1), pose = rd.range(0, 1), garland = rd.chance(0.3);
    if (q.used || tallTakes(q)) {
      const next = bronzePlaces.find((p) => !p.used && !tallTakes(p) && p.inner === q.inner && p.z * q.z > 0 && bearing(p) > bearing(q));
      if (!next) continue;
      next.used = true; q = next;
    }
    dedications.push({ x: q.x, z: q.z, face: q.face, kind, size, baseH, tone, pose, garland });
    cs.push([q.x, q.z]);
  }
  const ras = mk('round-altars');
  for (let n = Math.min(altarPlaces.length, ras.int(8, 10)), i = 0; i < n; i++) {
    const q = altarPlaces.splice(ras.int(0, altarPlaces.length - 1), 1)[0];
    const h = ras.range(0.85, 1.1), unused = ras.chance(0.5);
    altars.push({ x: q.x, z: q.z, face: q.face, burns: i < 3, h, garland: true, unused }); cs.push([q.x, q.z]);
  }
  const rex = mk('exedrae');
  for (let n = Math.min(benchPlaces.length, rex.int(2, 3)), i = 0; i < n; i++) {
    const q = benchPlaces.splice(rex.int(0, benchPlaces.length - 1), 1)[0];
    exedrae.push({ x: q.x, z: q.z, face: q.face });
    dedications.push({ x: q.x - Math.cos(q.face) * 2.25, z: q.z - Math.sin(q.face) * 2.25, face: q.face, kind: rex.pick([0, 1]), size: rex.range(0.95, 1.15), baseH: 1.55, tone: rex.range(0, 1), pose: rex.range(0, 1), garland: false, on: 'bench' });
    // one or two sit or stand in its mouth
    for (let k = 0, m = rex.int(1, 2); k < m; k++) add(rex, { zone: C, x: q.x - Math.cos(q.face) * 0.5 - Math.sin(q.face) * (k - (m - 1) / 2) * 1.1, z: q.z - Math.sin(q.face) * 0.5 + Math.cos(q.face) * (k - (m - 1) / 2) * 1.1, face: q.face + rex.range(-0.4, 0.4), gaze: 1 });
  }
  const rpb = mk('parapet-bronzes'), piers = [];
  for (let x = -48; x <= 60; x += 18) piers.push([x, TERRACE_Z - 0.3, Math.PI / 2]);
  for (let n = rpb.int(3, 5), i = 0; i < n; i++) {
    const [x, z, face] = piers.splice(rpb.int(0, piers.length - 1), 1)[0];
    dedications.push({ x, z, face, kind: rpb.pick([0, 1, 1]), size: rpb.range(1.0, 1.25), baseH: 1.5, tone: rpb.range(0, 1), pose: rpb.range(0, 1), garland: false, on: 'pier' });
    cs.push([x + Math.cos(face), z + Math.sin(face)]);
  }
  // cypresses: the round's pairs; along the west wall; three on each flank of the temple; in the two south corners; and a row
  // outside the south wall whose tops stand over the stoa's roof; 9 to 14 m
  const rcy = mk('cypresses');
  for (const q of pairPlaces) cypresses.push({ x: q.x, z: q.z, h: rcy.range(9, 12) });
  for (let z = -61; z < 55; z += rcy.range(6.5, 9)) { const x = -60.4 + rcy.range(-0.5, 0.5), h = rcy.range(9, 14); if (Math.abs(z) > 10.5) cypresses.push({ x, z, h }); }
  // (three on each flank of the temple, 3.3 m off its side walls, 7 m apart from 9 m behind its front; in each south
  // corner, beyond the stoa's end, two: 4.5 m inside the side wall and 8.5 m inside the south wall, and 7.5 m and 4 m)
  for (const sg of [1, -1]) for (let i = 0; i < 3; i++) cypresses.push({ x: TEMPLE.x1 - 9 - 7 * i, z: sg * (TEMPLE.half + 3.3), h: rcy.range(9.5, 13.5) });
  for (const sg of [1, -1]) for (const [dx, dz] of [[7.5, 4], [4.5, 8.5]]) cypresses.push({ x: sg * (COURT.x1 - dx), z: COURT.z1 - dz, h: rcy.range(9.5, 13.5) });
  for (let x = -62; x < 62; x += rcy.range(7, 11)) cypresses.push({ x, z: 61.5 + rcy.range(0, 1.5), h: rcy.range(10, 14), out: true });
  // THE ALTAR'S WORSHIPPERS: two rows east of it, facing it and the statue beyond: a place every 0.85 m along a row
  const rwo = mk('court-worshippers');
  for (let row = 0; row < 2; row++) for (let u = -4.25; u <= 4.26; u += 0.85) {
    const take = rwo.chance(Math.min(0.95, (0.7 - 0.25 * row) * density)), x = AX + 3.7 + row * 0.95 + rwo.range(-0.15, 0.15), z = AZ + u + rwo.range(-0.2, 0.2), q = body(rwo, { zone: C, x, z, face: Math.PI + rwo.range(-0.15, 0.15), gaze: 1 });
    if (take && cFree(x, z, 0.6)) put(q);
  }
  // THE CROWD BEFORE THE BASE: its lowest step is 17 m north to south. They stand in ranks along its east front, the first
  // 1.1 m out from the step, a rank every 0.85 m, a place every 0.8 m along a rank: the front ranks close, the back ones
  // thinner; a looser line along its north and its south side. All look up at him.
  const rba = mk('court-base');
  for (let rank = 0; rank < 6; rank++) for (let u = -7.6; u <= 7.61; u += 0.8) {
    const take = rba.chance(Math.min(0.95, (0.9 - 0.11 * rank) * density)), x = 8.6 + 0.85 * rank + rba.range(-0.2, 0.2), z = u + rba.range(-0.25, 0.25), child = rba.chance(0.12);
    const q = body(rba, { zone: C, x, z, face: Math.PI + rba.range(-0.25, 0.25), gaze: 1, kind: child ? 2 : undefined });
    if (take && cFree(x, z, 0.6)) put(q);
  }
  for (const side of [-1, 1]) for (let u = -6; u <= 6.01; u += 1.2) {
    const take = rba.chance(Math.min(0.95, 0.5 * density)), x = u + rba.range(-0.3, 0.3), z = side * (9.6 + rba.range(0, 1.3));
    const q = body(rba, { zone: C, x, z, face: -side * Math.PI / 2 + rba.range(-0.25, 0.25), gaze: 1 });
    if (take && cFree(x, z, 0.7)) put(q);
  }
  // THE PROCESSIONAL WAY'S PEOPLE: they go up to the base along one line of its slabs and come back along another, on two
  // closed walks (one north, one south of the axis), 2 m and 3.4 m from it, from 7 m before the porch to the crowd's back;
  // one every 5 m, some with a jar, a branch or a sack
  const rww = mk('way-walkers');
  for (const sg of [-1, 1]) {
    const course = makeCourse(rectPts(17.5, sg * 2, PORCH.x0 - 7, sg * 3.4, sg, 0.6), true, 0.6), m = Math.max(2, Math.round(course.length / 5 * density));
    for (let k = 0; k < m; k++) { const q = add(rww, { zone: C, habit: 1, course, s0: (k + rww.range(0.2, 0.8)) / m * course.length, v: 0.8 }), c = rww.range(0, 1); if (q.kind === 0) { if (c < 0.3) q.jar = 1; else if (c < 0.6) q.branch = 1; } else if (q.kind === 1) { if (c < 0.25) q.sack = 1; else if (c < 0.5) q.jar = 1; } else if (c < 0.5) q.branch = 1; }
  }
  const rvi = mk('court-visitors');
  for (let i = 0, tries = 0, n = Math.round(rvi.int(2, 4) * thin); i < n && tries < 400; tries++) {
    const a = rvi.range(-2.5, 1.0), rad = rvi.range(17, 28), x = Math.cos(a) * rad, z = Math.sin(a) * rad, n2 = rvi.int(1, 3), f = toAxis(x, z);
    if (!offAltar(x, z) || !cFree(x, z, 3.2)) continue;
    for (let k = 0; k < n2; k++) add(rvi, { zone: C, x: x - Math.sin(f) * (k - (n2 - 1) / 2) * 0.8, z: z + Math.cos(f) * (k - (n2 - 1) / 2) * 0.8, face: f + rvi.range(-0.25, 0.25), kind: k === 2 ? 2 : undefined, gaze: 1 });
    i++;
  }
  const rrw = mk('round-walkers');
  const arcWalk = (d0, d1, ra, rb, per, v) => {
    const pts = [], n = Math.max(2, Math.round(Math.abs(d1 - d0) / 4));
    for (let i = 0; i <= n; i++) pts.push(polar(lerp(d0, d1, i / n), ra));
    for (let i = n; i >= 0; i--) pts.push(polar(lerp(d0, d1, i / n), rb));
    const course = makeCourse(pts, true, 0.6), m = Math.max(1, Math.round(course.length / per * density));
    for (let k = 0; k < m; k++) { const q = add(rrw, { zone: C, habit: 1, course, s0: (k + rrw.range(0.15, 0.85)) / m * course.length, v }); if (rrw.chance(0.35)) { if (q.kind === 1) q.jar = 1; else q.branch = 1; } }
  };
  arcWalk(-153, 153, ROUND_R - EDGE_OFF, R_BACK_IN, 26, 0.8); arcWalk(9, 153, ROUND_R + EDGE_OFF, R_BACK_OUT, 40, 0.85);
  arcWalk(-9, -153, ROUND_R + EDGE_OFF, R_BACK_OUT, 40, 0.85);
  const rkn = mk('round-groups');
  for (let n = Math.min(altarPlaces.length, Math.round(rkn.int(3, 4) * density)), i = 0, got = 0; i < n && got < 2; i++) {
    const q = altarPlaces.splice(rkn.int(0, altarPlaces.length - 1), 1)[0], m = rkn.int(2, 3), f = toAxis(q.x, q.z);
    if (!q.inner) continue;
    got++;
    for (let k = 0; k < m; k++) add(rkn, { zone: C, x: q.x - Math.sin(f) * (k - (m - 1) / 2) * 0.8, z: q.z + Math.cos(f) * (k - (m - 1) / 2) * 0.8, face: f + rkn.range(-0.25, 0.25), kind: k === 2 && rkn.chance(0.5) ? 2 : undefined, gaze: 1 });
  }
  // THE TERRACE ROW (invented): along the court side of the terrace walk, 2.3 m from its
  // slabs, a station every 9 m from the grove's east edge to the court's east end: the stream deals the kinds over the free
  // stations (two bronzes on their bases, then small altars, stone benches and cypress pairs by turns); at some a knot of
  // pilgrims. Low things stand at the verge; a cypress pair stands back at the court's TREE LINE, 7.2 m from a way's
  // middle (as the round's cypresses do), where that place is free: else a bench takes the station
  const benches = [], TREE_LINE = 7.2;
  // (cFree takes the place it finds free)
  const treePlace = (x, z) => Math.hypot(x, z) >= R_CYP + 2.4 && x >= COURT.x0 + 3 && z >= COURT.z0 + 3 && wayGap(x, z) >= 2.1 && cFree(x, z, 2.5);
  { const rtr = mk('terrace-row'), zr = WALK_Z + ROUND_HALF + 2.3, zt = WALK_Z + TREE_LINE, st = [];
    for (let x = -24; x <= 60; x += 9) if (wayGap(x, zr) >= 2.1 && cFree(x, zr, 2.5)) st.push(x);
    const bag = st.map((_, i) => (i < 2 ? 0 : 1 + (i - 2) % 3));
    for (let i = bag.length - 1; i > 0; i--) { const j = rtr.int(0, i), t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
    st.forEach((x, i) => {
      const tone = rtr.range(0, 1), size = rtr.range(1.0, 1.25), pose = rtr.range(0, 1), h = rtr.range(10.3, 12.7), folk = rtr.chance(0.6), n = rtr.int(2, 3), fig = rtr.pick([0, 1, 1]);
      const kind = bag[i] === 3 && !treePlace(x, zt) ? 2 : bag[i];
      if (kind === 0) dedications.push({ x, z: zr, face: Math.PI / 2, kind: fig, size, baseH: 1.3 + 0.3 * tone, tone, pose, garland: pose > 0.6 });
      else if (kind === 1) altars.push({ x, z: zr, face: Math.PI / 2, burns: false, h: 0.85 + 0.25 * tone, garland: pose > 0.4 });
      else if (kind === 2) benches.push({ x, z: zr, turn: 0 });
      else for (const dx of [-1.3, 1.3]) cypresses.push({ x: x + dx, z: zt, h: h + dx });
      // (each a pace and more off a way's slabs)
      for (let k = 0; k < 3; k++) { const px = x + (k - (n - 1) / 2) * 0.8 + rtr.range(-0.15, 0.15), pz = zr + 1.5 + rtr.range(-0.2, 0.3), face = -Math.PI / 2 + rtr.range(-0.4, 0.4), q = body(rtr, { zone: C, x: px, z: pz, face, gaze: kind === 0 ? 1 : 0 }); if (folk && kind < 3 && k < n && wayGap(px, pz) >= 1.1) put(q); }
    }); }
  // watchers at the parapets: the terrace's west end, the terrace walk's north parapet (2.8 m from the walk's middle) and the
  // east wall's parapet beyond the porch's wings (each search has a stream of its own)
  const rp1 = mk('court-parapet-west'), rp2 = mk('court-parapet-north'), rp3 = mk('court-parapet-east');
  for (let i = 0, tries = 0, n = Math.round(rp1.int(2, 3) * thin); i < n && tries < 100; tries++) { const x = rp1.range(-60, -30), f = rp1.range(-0.3, 0.3); if (!cFree(x, -68.9, 1.4)) continue; add(rp1, { zone: C, x, z: -68.9, face: -Math.PI / 2 + f }); i++; }
  for (let i = 0, tries = 0, n = Math.round(rp2.int(5, 6) * density); i < n && tries < 200; tries++) { const x = rp2.range(-28, 62), f = rp2.range(-0.35, 0.35), two = rp2.chance(0.5); if (!cFree(x, -69.3, 1.9)) continue; add(rp2, { zone: C, x, z: -69.3, face: -Math.PI / 2 + f }); if (two) add(rp2, { zone: C, x: x + 0.7, z: -69.3, face: -Math.PI / 2 - f }); i++; }
  for (let i = 0, tries = 0, n = Math.round(rp3.int(2, 3) * thin); i < n && tries < 100; tries++) { const z = rp3.chance(0.65) ? rp3.range(12.5, 54) : rp3.range(-36, -12.5), f = rp3.range(-0.3, 0.3); if (!cFree(63.0, z, 1.4)) continue; add(rp3, { zone: C, x: 63.0, z, face: f }); i++; }
  // the temple: two or three on its lowest step, two or three in its porch behind the front columns
  const rte = mk('court-temple'), rts = mk('court-temple-steps'), TX = TEMPLE.x1;
  for (let i = 0, tries = 0, n = rts.int(2, 3); i < n && tries < 50; tries++) { const z = rts.range(-6, 6); if (!cFree(TX + 0.68, z, 1.2)) continue; add(rts, { zone: C, x: TX + 0.68, z, y: COURT_Y + TEMPLE.step, face: rts.chance(0.6) ? rts.range(-0.4, 0.4) : Math.PI + rts.range(-0.3, 0.3) }); i++; }
  for (let i = 0, n = rte.int(2, 3); i < n; i++) add(rte, { zone: C, x: TX - 2.6 + rte.range(-0.3, 0.3), z: (i - (n - 1) / 2) * 2.3 + rte.range(-0.3, 0.3), face: rte.range(-0.5, 0.5), kind: i === 0 ? 0 : undefined });
  // THE GROVE (invented): the court's north west corner, beyond the round and the way up to the terrace, is planted: seven to
  // nine plane trees and cypresses 5.5 m and more apart, two stone benches under them, people in their shade
  const rgr = mk('grove'), grove = { trees: [], benches: [] };
  for (let i = 0, tries = 0, n = rgr.int(7, 9); i < n && tries < 300; tries++) {
    const x = rgr.range(-57, -30), z = rgr.range(-60.5, -45.5), h = rgr.range(9, 12.5), tone = rgr.range(0, 1), cyp = rgr.chance(0.3);
    if (Math.hypot(x, z) < 52 || wayGap(x, z) < 3 || grove.trees.some((t) => Math.hypot(t.x - x, t.z - z) < 5.5)) continue;
    grove.trees.push({ x, z, h, tone, cyp }); cs.push([x, z]); i++;
  }
  const rgb2 = mk('grove-benches'), rgk = mk('grove-knot');
  for (let i = 0, tries = 0; i < 2 && tries < 100; tries++) {
    const x = rgb2.range(-54, -33), z = rgb2.range(-59, -47), turn = rgb2.range(0, Math.PI), m = rgb2.int(1, 2);
    if (Math.hypot(x, z) < 53 || !cFree(x, z, 3.2)) continue;
    grove.benches.push({ x, z, turn });
    for (let k = 0; k < m; k++) add(rgb2, { zone: C, x: x + Math.sin(turn) * 0.75 + Math.cos(turn) * (k - (m - 1) / 2) * 0.7, z: z + Math.cos(turn) * 0.75 - Math.sin(turn) * (k - (m - 1) / 2) * 0.7, face: Math.PI / 2 - turn + rgb2.range(-0.3, 0.3) });
    i++;
  }
  for (let i = 0, tries = 0, n = 1; i < n && tries < 100; tries++) { const x = rgk.range(-55, -32), z = rgk.range(-60, -46.5), m = rgk.int(2, 3); if (Math.hypot(x, z) < 53 || !cFree(x, z, 3)) continue; knot(rgk, C, x, z, m); i++; }
  const rgs = mk('garland-sellers'), sellers = [];
  for (const sg of [-1, 1]) {
    // (a table on each hand of the processional way, 7 m off its slabs, 6 m inside the porch give or take a metre)
    const x = PORCH.x0 - 6 + rgs.range(-1, 1), z = sg * (WAYS.axis.half + 7), kind = rgs.chance(0.5) ? 0 : 1;
    sellers.push({ x, z, sg, tint: rgs.int(0, 4) });
    add(rgs, { zone: C, kind, x, z: z + sg * 0.95, face: -sg * Math.PI / 2, hat: 0, jar: kind === 1 ? 1 : 0, branch: kind === 0 ? 1 : 0 });
    for (let i = 0, n = rgs.int(1, 2); i < n; i++) add(rgs, { zone: C, x: x + (i - (n - 1) / 2) * 0.85, z: z - sg * 1.15, face: sg * Math.PI / 2 + rgs.range(-0.2, 0.2) });
  }
  // THE FESTIVAL MORNING'S CROWD (invented). Two loose rings of people stand round the base, beyond the ranks and the side
  // lines: 14.8 m and 16.3 m from the axis, a place every 0.95 m of each; five places in ten of the inner ring are taken, three
  // in ten of the outer; all look up at him. North and south of the altar a row each, turned to it. On the processional
  // way's middle a file stands in pairs, from 9 m inside the porch toward the base, waiting to go up: garlands across the
  // chest, branches in the hand. Where the way meets the round four tall tripods stand, one at each corner, 2.1 m off both.
  const rri = mk('court-rings');
  for (const [rad, share] of [[14.8, 0.5], [16.3, 0.3]]) for (let i = 0, n = Math.round(6.2832 * rad / 0.95); i < n; i++) {
    const a = (i + 0.5) / n * 6.2832, x = Math.cos(a) * rad + rri.range(-0.2, 0.2), z = Math.sin(a) * rad + rri.range(-0.2, 0.2), take = rri.chance(Math.min(0.95, share * density));
    const q = body(rri, { zone: C, x, z, face: toAxis(x, z) + rri.range(-0.25, 0.25), gaze: 1 });
    if (take && offAltar(x, z) && cFree(x, z, 0.62)) put(q);
  }
  const rar = mk('court-altar-sides');
  for (const sg of [-1, 1]) for (let u = -2.6; u <= 2.61; u += 0.87) {
    const take = rar.chance(Math.min(0.95, 0.6 * density)), x = AX + u + rar.range(-0.15, 0.15), z = AZ + sg * (5.6 + rar.range(0, 0.5));
    const q = body(rar, { zone: C, x, z, face: -sg * Math.PI / 2 + rar.range(-0.2, 0.2), gaze: 1 });
    if (take && cFree(x, z, 0.6)) put(q);
  }
  const rgf = mk('garland-file');
  for (let i = 0; i < 8; i++) for (const sg of [-1, 1]) {
    const x = PORCH.x0 - 9 - 1.3 * i + rgf.range(-0.12, 0.12), z = sg * 0.6 + rgf.range(-0.08, 0.08), kind = rgf.chance(0.5) ? 0 : 1;
    add(rgf, { zone: C, kind, x, z, face: Math.PI + rgf.range(-0.12, 0.12), hat: 0, jar: kind === 1 ? 1 : 0, branch: kind === 0 ? 1 : 0, keep: 1 });
  }
  // (the way's four tall tripods, at their places of the plan: tallPlaces above)
  for (const [x, z] of tallPlaces) { dedications.push({ x, z, face: Math.PI, kind: 2, size: 2.0, baseH: 1.0, tone: 0.25, pose: 0, garland: true, tall: true }); cs.push([x, z]); }
  // ---- birds: loose flocks on closed rings of their own, each about a place of the plan: gulls over the warships' round
  // south of the fairway and over the fishermen's quay; gulls wheeling over the statue's head (12 m from his axis, 46 m above
  // the court: 8 m over the tips of his rays); swifts over the square's middle, 20 m above the paving; doves round the base (22 m from the axis, 11 m above
  // the court). Those are the plan's places. THE STAND-OFF FROM THE FLOWN LINE is laid from what the kit is handed: where
  // the line passes within a flock's sideways reach and the stand-off of its ring, the ring keeps the stand-off and the
  // flock's reach in height from the line, over it or under it as its plan height lies. reachH and reachV are that reach
  // (flockReach), carried with each ring.
  const sqx = (SQ.x0 + SQ.x1) / 2, W = lay.wars, _lv = new THREE.Vector3();
  const settle = (g) => {
    const f = flockReach(g.kind); let lo = 1e9, hi = -1e9;
    for (let m = 0; m <= lay.L; m += 0.5) { lay.path.posAtDist(m, _lv); if (Math.abs(Math.hypot(_lv.x - g.c[0], _lv.z - g.c[2]) - g.r) <= f.h + FLOCK_STAND) { lo = Math.min(lo, _lv.y); hi = Math.max(hi, _lv.y); } }
    if (hi >= lo) g.c[1] = g.c[1] > (lo + hi) / 2 ? Math.max(g.c[1], hi + FLOCK_STAND + f.v) : Math.min(g.c[1], lo - FLOCK_STAND - f.v);
    return { ...g, reachH: f.h, reachV: f.v };
  };
  // MORE BIRDS (each a ring about a place of the plan, as the others): gulls over the landing's water north of the
  // fairway (30 m off the quay, 40 m north of the axis); doves over the dovecote of the stores' courts (17 m from the
  // axis on its hand, 11 m over the street), over the square's north hand at its middle and over its south hand 7 m
  // inside its west edge (19 m from the axis, 9 m over its paving); swallows over the first street (its middle, between
  // the wall and the first lane) and over the upper street's middle, each over the roofs' height (16 m over the street;
  // the stand-off lifts them clear of the line).
  // These six are drawn as the kit's plain bird (a body and two wings).
  // (r8) THE SOUTH RING'S FOUR FIGURES ARE TYPED: 19 m from the axis, 9 m over the paving and 10 m round are its fellow's
  // on the north hand (the square's two hands alike), and no line of the plan gives the fellow's (the trees stand 15.5 m
  // out, the back stands 19.6 m). For the 7 m no reason by place is known: the thing nearest is the south row's west
  // plane tree, whose place is a crown's reach (8 m) inside the west edge, a metre east of the ring's middle, while the
  // north ring stands abeam of its row's middle tree. r7 found none, r8 found none; the four stay as typed.
  const xf = (WALL_X0 + LANE_X[1]) / 2, xu = (LANE_X[3] + LANE_X[4]) / 2;
  // THE STORES' COURTS (ours): in each of the avenue's four half blocks below the square one store of the low zone keeps
  // only a front range on the avenue and has an open court behind it, and each of the four is a court of another kind:
  // 0 a garden with a fig tree and a well, 1 a potter's yard with his kiln, 2 a small shrine's court with its cypress,
  // 3 a court with a dovecote. Which half block has which, and the place in its block (the store that stands over that
  // place is the one), the stream deals. The low town's doves have their ring over the dovecote.
  // (r8) THE RANGES' ENDS ARE TYPED AND NO REASON BY PLACE IS KNOWN FOR THEM. By the plan the first block's stores stand
  // from 246.75 to 286 and the second block's low zone from 230 (LOW_ZONE_X) to 241.25: the ranges lie 3.25 m and 20 m,
  // 2.5 m and 1.75 m inside those. r7 looked for what fixes 250, 266, 232.5 and 239.5 and found nothing; r8 looked again:
  // a store over any place of the plan's own stretches is a store of the low zone as well, the flown line climbs evenly
  // past all four with no step at any, and nothing of the plan stands at them. They stay as typed: the plan's ends would
  // deal each court another place and move all that stands on it, and that is a measured step of its own.
  const rsc = mk('store-courts'), kinds = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = rsc.int(0, i), t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
  const courts = [[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([side, block], i) => ({ side, kind: kinds[i], x: block ? rsc.range(232.5, 239.5) : rsc.range(250, 266) }));
  const cote = courts.find((c) => c.kind === 3);
  const gulls = [{ c: [W.x, 13, W.z], r: Math.min(W.ax, W.az) + 10, n: Math.round(12 * density), kind: 'gulls' },
    { c: [QUAY_X1 + 6, 12, (BERTH.fish - 113) / 2], r: 16, n: Math.round(8 * density), kind: 'gulls' },
    { c: [0, COURT_Y + 46, 0], r: 12, n: Math.round(10 * density), kind: 'gulls' },
    { c: [sqx, avenueY(sqx) + 20, 0], r: 27, n: Math.round(16 * density), kind: 'swifts' },
    { c: [0, COURT_Y + 11, 0], r: 22, n: Math.round(22 * density), kind: 'doves' },
    { c: [QUAY_X1 + 30, 12, -40], r: 20, n: Math.round(9 * density), kind: 'gulls', plain: 1 },
    { c: [cote.x, avenueY(cote.x) + 11, cote.side * 17], r: 9, n: Math.round(14 * density), kind: 'doves', plain: 1 },
    { c: [sqx, avenueY(sqx) + 9, -19], r: 10, n: Math.round(14 * density), kind: 'doves', plain: 1 },
    { c: [SQ.x0 + 7, avenueY(SQ.x0 + 7) + 9, 19], r: 10, n: Math.round(12 * density), kind: 'doves', plain: 1 },
    { c: [xf, avenueY(xf) + 16, 0], r: 13, n: Math.round(10 * density), kind: 'swifts', plain: 1 },
    { c: [xu, avenueY(xu) + 16, 0], r: 15, n: Math.round(12 * density), kind: 'swifts', plain: 1 }].map(settle);
  return { people, animals, cargo, stalls, nets, wayLots, wayStall, gulls, dedications, cypresses, square, courts, court: { altars, exedrae, sellers, grove, benches } };
}
// where a body on the ground is at world clock t: [x, z, hx, hz, loaded, moving] (one rule for every body: what is drawn stands where this says)
const _b6 = [0, 0, 0, 0, 0, 0];
function bodyAt(q, t, out = _b6) {
  out[4] = 1; out[5] = 0;
  if (q.habit === 2) { out[0] = q.x - haulAt(t, q.ship); out[1] = q.z; out[2] = -1; out[3] = 0; out[5] = 1; return out; }
  if (q.habit === 1 || q.habit === 3) { q.course.at(q.s0 + q.v * t, out); out[4] = q.habit !== 3 ? 1 : q.loadTo ? ((q.s0 + q.v * t) % q.course.length < q.loadTo ? 1 : 0) : smoothstep(0.2, 0.5, -out[2]); out[5] = 1; return out; }
  out[0] = q.x; out[1] = q.z; out[2] = Math.cos(q.face); out[3] = Math.sin(q.face);
  return out;
}
// the level a body stands on, by place
function walkY(x, z) {
  if (x >= WALL_X0 - 0.5) return QUAY_Y + (x > PLANK.x0 && Math.abs(z - PLANK.z) < PLANK.half + 0.2 ? PLANK.rise * clamp((x - PLANK.x0) / (PLANK.x1 - PLANK.x0), 0, 1) + 0.03 : 0);
  if (x <= COURT.x1 && x >= COURT.x0 && z >= TERRACE_Z && z <= COURT.z1) return COURT_Y + (x > TEMPLE.x0 && x < TEMPLE.x1 && Math.abs(z) < TEMPLE.half ? 3 * TEMPLE.step : 0);
  const az = Math.abs(z), sq = inSquare(x);
  if (sq && az > SQ.edge && az < SQ.back && x > SQ.x0 && x < SQ.x1) return stoaLevel(x);
  if (az <= (sq ? SQ.edge : AV_HALF + 0.6)) return avenueY(x);
  const edge = sq ? 24 : 8;
  return groundY(x, z) - (az < edge + 4 ? 0.35 * (edge + 4 - az) / 4 : 0);
}

// where a thing on the water is at world clock t: [x, z, hx, hz] (one rule for every hull: what is drawn floats where this says)
const _c4 = [0, 0, 0, 0];
function shipAt(q, t, out = _c4) {
  if (q.course) return q.course.at(q.s0 + q.v * t, out);
  if (q.kind === 'hauled') { out[0] = q.x - haulAt(t, q) * Math.cos(q.tilt); out[1] = q.z; out[2] = 1; out[3] = 0; return out; }
  // moored: the hull swings a little about its own middle
  const a = Math.atan2(q.hz, q.hx) + q.swing * Math.sin(t * 6.2832 / q.per + q.ph);
  out[0] = q.x; out[1] = q.z; out[2] = Math.cos(a); out[3] = Math.sin(a);
  return out;
}

// ---------------------------------------------------------------- the ground (a rule of place; no seed in it)
// The hill rises west with the avenue and climbs to the south and south west like the tiers of a theatre, to the acropolis: a
// plateau 92 m high whose middle lies at (-130, 380), south south west of the court (its near flank 450 m from the harbour's
// middle). Behind the harbour wall the ground stays low (no rise east of x 250). Due west of the court the ground stays low.
// North it falls to a lower road at 6 and a bare shore. East of the quay is the great harbour.
const ACRO = { x: -130, z: 380, h: 92 };
const acroK = (x, z) => smoothstep(320, 150, Math.hypot((x - ACRO.x) * 0.8, z - ACRO.z));
function groundY(x, z) {
  let h = avenueY(x);
  if (x < COURT.x0) h += 6 * smoothstep(COURT.x0, -420, x);
  if (z > 16) {
    h += smoothstep(lerp(64, 16, smoothstep(60, 110, x)), 430, z) * (24 + 40 * smoothstep(290, -200, x)) * smoothstep(250, 170, x);
    h = lerp(h, ACRO.h, acroK(x, z));
  }
  // the great harbour and the shore that bends east at its south end
  const east = QUAY_X1 + Math.max(0, z - 300) * 1.6;
  if (z > MOLE_Z - 6 && x > east - 30) h = lerp(h, 1.2, smoothstep(east - 30, east - 4, x));
  if (z > MOLE_Z - 6 && x > east) return lerp(1.2, -7, smoothstep(east, east + 5, x));
  if (z < -8) {
    const court = smoothstep(96, 86, x) * smoothstep(COURT.x0 - 12, COURT.x0, x);
    const zTop = lerp(-30, TERRACE_Z, court), road = Math.min(h, ROAD_Y);
    let y = lerp(h, road, smoothstep(zTop, -74, z));
    if (z < -84) y = lerp(y, Math.min(road, 4), smoothstep(-84, SHORE_Z0, z));
    if (z < SHORE_Z0) y = Math.min(y, 4 + (z - SHORE_Z0) * 0.1);
    if (z < SHORE_Z1) y = lerp(-1.2, -7, smoothstep(SHORE_Z1, -158, z));
    // the spur between the two harbours (east) and the arm that closes the basin on the west
    const spur = smoothstep(BASIN_X1 - 6, BASIN_X1 + 8, x), arm = smoothstep(BASIN_X0 + 6, BASIN_X0 - 10, x);
    if (spur > 0 && z < -80) { const land = lerp(Math.max(road, 2.4), -7, smoothstep(SPUR_Z, SPUR_Z - 14, z)); y = lerp(y, x > QUAY_X1 ? lerp(land, -7, smoothstep(QUAY_X1, QUAY_X1 + 5, x)) : land, spur); }
    if (arm > 0 && z < -80) y = lerp(y, lerp(Math.max(road, 3), -7, smoothstep(-400, -416, z)), arm);
    return y;
  }
  return h;
}

// terrain colour by place: paved dust in the town, dry grass and scrub on the hills, pale rock at the shores
function groundColor(x, z, y, noise) {
  const n = 0.5 + 0.5 * noise.fbm2(x * 0.013, z * 0.013, 3), n2 = 0.5 + 0.5 * noise.n2(x * 0.07 + 5, z * 0.07);
  const dust = mix3([0.5, 0.42, 0.3], [0.58, 0.5, 0.37], n2), grass = mix3([0.4, 0.36, 0.17], [0.27, 0.31, 0.13], n), rock = mix3([0.52, 0.47, 0.38], [0.62, 0.57, 0.47], n2);
  const town = lerp(smoothstep(-130, -70, x), smoothstep(-330, -250, x), smoothstep(60, 110, z)) * (1 - smoothstep(430, 520, z)) * smoothstep(-330, -290, z) * (1 - smoothstep(0.5, 0.7, acroK(x, z)));
  let c = mix3(grass, dust, clamp(town + 0.25 * (n2 - 0.5), 0, 1));
  c = mix3(c, rock, smoothstep(2.2, 0.4, y));
  return mix3(c, [0.2, 0.26, 0.24], smoothstep(-0.3, -2.5, y));
}

async function buildTerrain(ctx, noise) {
  const xs = [], zs = [];
  // (the grid's steps: from north to south 4 m over the town's middle band and 6 m over the hill and the north shore beyond
  // it, from east to west 6 m and 4 m across the great quay's edge, so that the harbour's floor falls away behind the quay's
  // face; growing outside)
  const axis = (lo, hi, a, bq, out, fine = [a, bq]) => {
    let v = a; const left = [];
    for (let s = 4; v > lo; s = Math.min(s * 1.45, 220)) { v -= s; left.push(Math.max(v, lo)); }
    left.reverse(); for (const q of left) out.push(q);
    for (v = a; v <= bq; v += v < fine[0] || v >= fine[1] ? 6 : 4) out.push(v);
    for (let s = 4, w = out[out.length - 1]; w < hi; s = Math.min(s * 1.45, 220)) { w += s; out.push(Math.min(w, hi)); }
  };
  axis(-2600, 1500, -84, 332, xs, [308, 332]); axis(-470, 2400, -172, 232, zs, [-64, 64]);
  const nx = xs.length, nz = zs.length, n = nx * nz;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), surf = new Float32Array(n).fill(SF.EARTH), idx = [];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], k = (j * nx + i) * 3;
      let y = groundY(x, z);
      // under the built slabs the ground is kept a little lower so that it never shows through them
      if (Math.abs(z) < (x > SQ.x0 - 8.5 && x < SQ.x1 + 8.5 ? 25 : AV_HALF + 1) && x > AV_X1 - 2 && x < AV_X0 + 30) y -= 0.35;
      if (x > COURT.x0 - 1 && x < COURT.x1 + 1 && z > TERRACE_Z - 0.5 && z < COURT.z1 + 1) y -= 0.6;
      const c = groundColor(x, z, y, noise);
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2];
    }
    if (j % 12 === 11) await ctx.yield();
  }
  await ctx.yield();
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    // no ground is laid where none can be seen: under the sea's own surface (all four corners 0.6 m and more under it), and
    // under the court's paving (all four corners within the court's walls)
    if (pos[a * 3 + 1] < -0.6 && pos[b * 3 + 1] < -0.6 && pos[c * 3 + 1] < -0.6 && pos[d * 3 + 1] < -0.6) continue;
    if (xs[i] >= COURT.x0 && xs[i + 1] <= COURT.x1 && zs[j] >= TERRACE_Z && zs[j + 1] <= COURT.z1) continue;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('surf', new THREE.BufferAttribute(surf, 1)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// metres of water for the sea's own look (the kit's ocean draws its shoal colour where this depth is under SHOAL.depth and a
// moving line of swash where it is under four tenths of it). IN THE GREAT HARBOUR the depth goes by the distance from the great
// quay's face (QUAY_SHELF): the rubble at the quay's foot (1 m of water at the face, 6.2 m at 2.5 m off: the swash's line
// lies within 1.5 m of the face), the harbour's floor shelving to 7 m at 20 m off and to 10 m at 55 m off (the greener water), then the roads' deep (a metre
// more with every metre: the blue water). 2.5 m at the slips' feet deepening north, deep outside; negative on land.
const SHOAL = { depth: 10, width: 24 }, QUAY_SHELF = [[2.5, 6.2], [20, 7], [55, 10]];
function seaDepth(x, z) {
  const off = x - QUAY_X1 - Math.max(0, z - 300) * 1.6;
  if (z > MOLE_Z - 6 && off > -3) {
    const S = QUAY_SHELF;
    return off < S[0][0] ? Math.max(-QUAY_Y, 1 + (S[0][1] - 1) * off / S[0][0]) : off < S[1][0] ? lerp(S[0][1], S[1][1], (off - S[0][0]) / (S[1][0] - S[0][0])) : off < S[2][0] ? lerp(S[1][1], S[2][1], (off - S[1][0]) / (S[2][0] - S[1][0])) : Math.min(30, S[2][1] + off - S[2][0]);
  }
  const g = groundY(x, z);
  if (g > -6.9) return -g;
  if (z < SHORE_Z1 && x < BASIN_X1 + 6 && x > BASIN_X0 - 10 && z > -446) return Math.min(30, 1.5 + 0.2 * (SHORE_Z1 - z));
  return 30;
}

// ---------------------------------------------------------------- colours of the place (linear)
const COL = {
  stone: lin('#d2c5a8'), stoneDark: lin('#b3a588'), paving: lin('#d6c29b'), court: lin('#dccfb4'), marble: lin('#ece8de'), lartos: lin('#7c8894'),
  plaster: ['#ece5d6', '#e6dcc6', '#dfd0b0', '#d9c49e', '#e9dfca', '#d3b78e'].map(lin), dado: ['#84503c', '#70483a', '#8a5a40', '#6a4634'].map(lin),
  tile: ['#b9785a', '#b06d50', '#c28462', '#a9684c'].map(lin), flat: lin('#c9b898'), timber: lin('#5a4130'), timberDark: lin('#3a2a20'),
  dark: [0.03, 0.028, 0.025], rock: lin('#a89c84'),
};

// THE WALL'S TOP (the form is ours): along a line of constant x or z a breastwork of broad low merlons, 2.5 m
// long and 1 m high, the gaps of 1.5 m between them closed by timber shutters hung from a rail (one in five propped open)
const SHUTTER = lin('#6b4a33');
function merlons(B, x0, z0, x1, z1, y, col) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 4)), alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), pitch = len / n, m = pitch * 0.31;
  if (alongX) B.box(x0, y, z0 - 0.3, x1, y + 0.2, z0 + 0.3, col, SF.ASHLAR, 'zZY'); else B.box(x0 - 0.3, y, z0, x0 + 0.3, y + 0.2, z1, col, SF.ASHLAR, 'xXY');
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), open = hash2(i * 3.1 + x0, z0 + i) < 0.2 ? 0.3 : 0.02, tone = mul(SHUTTER, 0.85 + 0.4 * hash2(i, x0 + z0));
    if (alongX) {
      B.box(x - m, y + 0.2, z - 0.3, x + m, y + 1.2, z + 0.3, col, SF.ASHLAR);
      if (i < n - 1) for (const sg of [-1, 1]) { const q = [[x + m, y + 1.14, z + sg * 0.26], [x + pitch - m, y + 1.14, z + sg * 0.26], [x + pitch - m, y + 0.24, z + sg * (0.26 + open)], [x + m, y + 0.24, z + sg * (0.26 + open)]]; if (sg > 0) q.reverse(); B.quad(q[0], q[1], q[2], q[3], tone, SF.TIMBER); }
    } else {
      B.box(x - 0.3, y + 0.2, z - m, x + 0.3, y + 1.2, z + m, col, SF.ASHLAR);
      if (i < n - 1) for (const sg of [-1, 1]) { const q = [[x + sg * 0.26, y + 1.14, z + m], [x + sg * 0.26, y + 1.14, z + pitch - m], [x + sg * (0.26 + open), y + 0.24, z + pitch - m], [x + sg * (0.26 + open), y + 0.24, z + m]]; if (sg < 0) q.reverse(); B.quad(q[0], q[1], q[2], q[3], tone, SF.TIMBER); }
    }
  }
}
// A TOWER: the shaft of ashlar, a string course, a storey with shuttered windows (two to a face) and over it a low
// pitched roof of tiles with broad eaves
function tower(B, x0, z0, x1, z1, y0, y1, col) {
  const ys = y1 - 3.4, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, e = 0.7, rise = 0.17 * Math.min(x1 - x0, z1 - z0);
  B.box(x0, y0, z0, x1, y1, z1, col, SF.ASHLAR, 'xXzZ');
  B.box(x0 - 0.18, ys - 0.3, z0 - 0.18, x1 + 0.18, ys, z1 + 0.18, mul(col, 0.92), SF.ASHLAR, 'xXzZyY');
  for (const f of [0.28, 0.72]) {
    const zc = lerp(z0, z1, f), xc = lerp(x0, x1, f), ya = ys + 0.9, yb = ys + 2.3;
    for (const [xa, sg] of [[x0, -1], [x1, 1]]) { B.box(Math.min(xa, xa + sg * 0.07), ya, zc - 0.55, Math.max(xa, xa + sg * 0.07), yb, zc + 0.55, SHUTTER, SF.TIMBER, 'xXzZyY'); B.box(Math.min(xa, xa + sg * 0.12), ya - 0.14, zc - 0.7, Math.max(xa, xa + sg * 0.12), ya, zc + 0.7, mul(col, 1.05), SF.ASHLAR, 'xXzZyY'); }
    for (const [za, sg] of [[z0, -1], [z1, 1]]) { B.box(xc - 0.55, ya, Math.min(za, za + sg * 0.07), xc + 0.55, yb, Math.max(za, za + sg * 0.07), SHUTTER, SF.TIMBER, 'xXzZyY'); B.box(xc - 0.7, ya - 0.14, Math.min(za, za + sg * 0.12), xc + 0.7, ya, Math.max(za, za + sg * 0.12), mul(col, 1.05), SF.ASHLAR, 'xXzZyY'); }
  }
  const a = [x0 - e, y1, z0 - e], b = [x1 + e, y1, z0 - e], c = [x1 + e, y1, z1 + e], d = [x0 - e, y1, z1 + e], top = [cx, y1 + rise, cz], tile = COL.tile[Math.floor(hash2(x0, z0) * 4)];
  B.tri(a, top, b, tile, SF.TILE_Z); B.tri(c, top, d, tile, SF.TILE_Z); B.tri(b, top, c, tile, SF.TILE_X); B.tri(d, top, a, tile, SF.TILE_X);
  B.quad(a, b, c, d, mul(COL.timber, 1.3), SF.TIMBER);
}

// the great harbour's front: quay, wall, towers, gate; the mole with its wall and towers
function buildHarbourFront(B) {
  const zA = MOLE_Z - MOLE_W / 2, zB = 300, top = QUAY_Y + WALL_H, st = COL.stone;
  // the quay, with the slip cut into it: north of the cut, south of it, and the quay behind the slip's head; the slip's
  // floor of stone slabs and, across it, timber rollers every 1.6 m
  const sa = SLIP.z - SLIP.half, sb = SLIP.z + SLIP.half, qs = mul(st, 0.9);
  B.box(QUAY_X0, -4, zA, QUAY_X1, QUAY_Y, sa, qs, SF.ASHLAR, 'XYZ', COL.paving, SF.PAVING); B.box(QUAY_X0, -4, sb, QUAY_X1, QUAY_Y, zB, qs, SF.ASHLAR, 'XYZz', COL.paving, SF.PAVING);
  B.box(QUAY_X0, -4, sa, SLIP.x0, QUAY_Y, sb, qs, SF.ASHLAR, 'XY', COL.paving, SF.PAVING);
  B.quad([SLIP.x0, QUAY_Y, sb], [SLIP.x1, slipY(SLIP.x1), sb], [SLIP.x1, slipY(SLIP.x1), sa], [SLIP.x0, QUAY_Y, sa], mul(st, 0.8), SF.ASHLAR);
  for (let x = SLIP.x0 + 1; x < QUAY_X1 + 2; x += 1.6) B.beam([x, slipY(x) + 0.08, sa + 0.4], [x, slipY(x) + 0.08, sb - 0.4], 0.17, mul(COL.timber, 1.5), SF.TIMBER);
  B.box(QUAY_X1, QUAY_Y, zA, QUAY_X1 + 0.5, QUAY_Y + 0.35, sa, COL.stoneDark, SF.ASHLAR, 'xXYZ'); B.box(QUAY_X1, QUAY_Y, sb, QUAY_X1 + 0.5, QUAY_Y + 0.35, zB, COL.stoneDark, SF.ASHLAR, 'xXYz');
  // the gate passage floor and the wall in two runs with the lintel between them
  B.quad([WALL_X0 - 0.5, QUAY_Y, GATE_W / 2], [WALL_X1, QUAY_Y, GATE_W / 2], [WALL_X1, QUAY_Y, -GATE_W / 2], [WALL_X0 - 0.5, QUAY_Y, -GATE_W / 2], COL.paving, SF.PAVING);
  // the curtain (6.5 m, with a walk and plain battlements) and, round the 7 m opening, the gate's own block: two piers of 2.2 m
  // carrying the lintel of timber beams and three courses of stone over it
  const gz = GATE_W / 2, pier = GATE_PIER, gTop = QUAY_Y + GATE_H + 1.7;
  // The wall is dressed: a plinth of darker stone 0.9 m high and a hand proud of the face, a string course 4.3 m up, a
  // crown course under the battlements; the gate's piers have the plinth and an impost band under the lintel's beams.
  const dark = mul(st, 0.8), pale = mul(st, 1.1);
  for (const [z0, z1] of [[zA, -gz - pier], [gz + pier, zB]]) {
    // (each run is cut by its small door: the wall's body and plinth in two pieces, the wall over the door's head, the
    // door's floor, a lintel and two jamb stones of the paler stone a hand proud of the face)
    const pz = Math.sign(z0 + z1) * POSTERN.z, pa = pz - POSTERN.w / 2, pb = pz + POSTERN.w / 2, ph = QUAY_Y + POSTERN.h;
    for (const [a, b] of [[z0, pa], [pb, z1]]) { B.box(WALL_X0, QUAY_Y - 2, a, WALL_X1, top, b, st, SF.ASHLAR, 'xXYzZ'); B.box(WALL_X1, QUAY_Y, a, WALL_X1 + 0.14, QUAY_Y + 0.9, b, dark, SF.ASHLAR, 'XY' + (a === pb ? 'z' : 'Z')); }
    B.box(WALL_X0, ph, pa, WALL_X1, top, pb, st, SF.ASHLAR, 'xXYy');
    B.quad([WALL_X0 - 0.5, QUAY_Y + 0.01, pb], [WALL_X1, QUAY_Y + 0.01, pb], [WALL_X1, QUAY_Y + 0.01, pa], [WALL_X0 - 0.5, QUAY_Y + 0.01, pa], COL.paving, SF.PAVING);
    B.box(WALL_X1, ph, pa - 0.45, WALL_X1 + 0.12, ph + 0.45, pb + 0.45, pale, SF.MARBLE, 'XYyzZ');
    for (const [a, b] of [[pa - 0.3, pa], [pb, pb + 0.3]]) B.box(WALL_X1, QUAY_Y, a, WALL_X1 + 0.1, ph, b, pale, SF.MARBLE, 'XzZ');
    merlons(B, WALL_X1 - 0.3, z0, WALL_X1 - 0.3, z1, top, st);
    B.box(WALL_X1, QUAY_Y + 4.3, z0, WALL_X1 + 0.1, QUAY_Y + 4.56, z1, pale, SF.MARBLE, 'XYy');
    B.box(WALL_X1, top - 0.32, z0, WALL_X1 + 0.16, top, z1, pale, SF.MARBLE, 'XYy');
  }
  for (const sg of [-1, 1]) {
    const za = sg > 0 ? gz : -gz - pier, zb = sg > 0 ? gz + pier : -gz;
    B.box(WALL_X0 - 0.3, QUAY_Y - 2, za, WALL_X1 + 0.3, gTop, zb, mul(st, 1.02), SF.ASHLAR, 'xXYzZ');
    B.box(WALL_X1 + 0.3, QUAY_Y, za - 0.12, WALL_X1 + 0.44, QUAY_Y + 0.9, zb + 0.12, dark, SF.ASHLAR, 'XYzZ'); B.box(WALL_X0 - 0.3, QUAY_Y, za - 0.12, WALL_X1 + 0.3, QUAY_Y + 0.9, zb + 0.12, dark, SF.ASHLAR, 'YzZ');
    B.box(WALL_X0 - 0.36, QUAY_Y + GATE_H - 0.34, za - 0.08, WALL_X1 + 0.38, QUAY_Y + GATE_H - 0.06, zb + 0.08, pale, SF.MARBLE, 'xXyYzZ');
  }
  B.box(WALL_X0 - 0.3, QUAY_Y + GATE_H + 0.45, -gz, WALL_X1 + 0.3, gTop, gz, mul(st, 1.02), SF.ASHLAR, 'xXYy');
  B.box(WALL_X0 - 0.5, gTop, -gz - pier - 0.2, WALL_X1 + 0.5, gTop + 0.3, gz + pier + 0.2, mul(st, 1.06), SF.ASHLAR, 'xXyYzZ');
  for (let i = 0; i < 9; i++) { const z = -gz - 0.3 + (i + 0.5) * (GATE_W + 0.6) / 9; B.box(WALL_X0 - 0.45, QUAY_Y + GATE_H, z - 0.26, WALL_X1 + 0.45, QUAY_Y + GATE_H + 0.45, z + 0.26, mul(COL.timber, 1.7), SF.TIMBER, 'xXyYzZ'); }
  // towers every 60 m; the gate stands in a recessed curtain 28 m long between its two towers (their inner faces 14 m either
  // side of the axis: the wall's own plan); the towers stand 2 m proud of the wall's face
  const ty = QUAY_Y + TOWER_H;
  for (let k = -3; k <= 4; k++) {
    for (const sg of k === 0 ? [-1, 1] : [Math.sign(k)]) {
      const zc = sg * (GATE_TOWER_Z + TOWER_W / 2) + (k === 0 ? 0 : k * 60);
      if (zc - TOWER_W / 2 < zA || zc + TOWER_W / 2 > zB) continue;
      tower(B, WALL_X0 - 0.6, zc - TOWER_W / 2, WALL_X1 + 2, zc + TOWER_W / 2, QUAY_Y - 2, ty, mul(st, 0.97));
      // each tower's door at the quay (a strong timber leaf in a surround of the paler stone, a step before it) and two
      // slits to the harbour, a third of the way up its shaft
      const xf = WALL_X1 + 2;
      B.box(xf, QUAY_Y, zc - 0.6, xf + 0.05, QUAY_Y + 2.15, zc + 0.6, mul(SHUTTER, 0.8), SF.TIMBER, 'XY');
      B.box(xf, QUAY_Y + 2.15, zc - 0.88, xf + 0.14, QUAY_Y + 2.5, zc + 0.88, pale, SF.MARBLE, 'XyYzZ');
      for (const s2 of [-1, 1]) B.box(xf, QUAY_Y, zc + s2 * 0.74 - 0.14, xf + 0.1, QUAY_Y + 2.15, zc + s2 * 0.74 + 0.14, pale, SF.MARBLE, 'XzZ');
      B.box(xf, QUAY_Y, zc - 0.95, xf + 0.45, QUAY_Y + 0.16, zc + 0.95, dark, SF.ASHLAR, 'XYzZ');
      for (const s2 of [-1, 1]) { B.box(xf, QUAY_Y + 4.0, zc + s2 * 2.5 - 0.09, xf + 0.03, QUAY_Y + 5.2, zc + s2 * 2.5 + 0.09, ROOM, SF.PLASTER, 'X'); B.box(xf, QUAY_Y + 3.86, zc + s2 * 2.5 - 0.26, xf + 0.09, QUAY_Y + 4.0, zc + s2 * 2.5 + 0.26, pale, SF.MARBLE, 'XYyzZ'); }
    }
  }
  // (the rods of the two gate towers' hangings)
  for (const sg of [-1, 1]) { const zc = sg * (GATE_TOWER_Z + TOWER_W / 2), y = ty - 3.4 - 0.5, peg = lin('#8e6c40'); B.beam([WALL_X1 + 2.14, y, zc - 1.0], [WALL_X1 + 2.14, y, zc + 1.0], 0.07, peg, SF.BRONZE); for (const z of [zc - 0.95, zc + 0.95]) B.beam([WALL_X1 + 2, y, z], [WALL_X1 + 2.18, y, z], 0.07, peg, SF.BRONZE); }
  // for the festival a rope wound with leaves hangs in festoons from bronze pegs: one across the gate's lintel from pier
  // to pier, and one on the curtain each side, from a peg beside the pier to a peg 4.3 m along (over the stalls)
  { const leafc = [0.13, 0.25, 0.09], peg = lin('#8e6c40');
    const festoon = (x, z0, z1, yt, drop) => {
      for (let i = 0; i < 6; i++) { const t0 = i / 6, t1 = (i + 1) / 6, sag = (t) => yt - 0.08 - 4 * drop * t * (1 - t); B.beam([x + 0.16, sag(t0), lerp(z0, z1, t0)], [x + 0.16, sag(t1), lerp(z0, z1, t1)], 0.17, mul(leafc, 0.85 + 0.35 * (i % 2)), SF.LEAF, 0.17, false); }
      for (const z of [z0, z1]) { B.beam([x, yt, z], [x + 0.3, yt, z], 0.11, peg, SF.BRONZE); B.box(x + 0.3, yt - 0.13, z - 0.13, x + 0.35, yt + 0.13, z + 0.13, mul(peg, 1.2), SF.BRONZE, 'XyYzZ'); }
    };
    festoon(WALL_X1 + 0.3, -gz + 0.25, gz - 0.25, gTop - 0.25, 0.55);
    for (const sg of [-1, 1]) festoon(WALL_X1 + 0.1, sg * (gz + pier + 0.45), sg * (gz + pier + 4.75), QUAY_Y + 4.05, 0.7);
    // each pier's hanging has its rod, on two pegs
    for (const sg of [-1, 1]) { const za = sg * (gz + 0.5), zb = sg * (gz + 1.7), y = QUAY_Y + GATE_H + 0.97; B.beam([WALL_X1 + 0.62, y, za], [WALL_X1 + 0.62, y, zb], 0.07, peg, SF.BRONZE); for (const z of [za, zb]) B.beam([WALL_X1 + 0.3, y, z], [WALL_X1 + 0.66, y, z], 0.07, peg, SF.BRONZE); } }
  // the two leaves, timber clad in sheets of bronze with rows of bosses, standing open against the passage walls
  for (const sg of [-1, 1]) {
    const zl = sg * (GATE_W / 2 - 0.1), lc = lin('#8e6c40'), xa = WALL_X0 + 0.6, xb = WALL_X0 + 0.6 + GATE_W / 2, zi = zl - sg * 0.07;
    B.box(xa, QUAY_Y + 0.1, zl - 0.07, xb, QUAY_Y + GATE_H - 0.3, zl + 0.07, lc, SF.BRONZE, 'xXYzZ');
    for (const y of [0.9, 3.4, 5.9]) B.box(xa + 0.05, QUAY_Y + y, Math.min(zi, zi - sg * 0.06), xb - 0.05, QUAY_Y + y + 0.24, Math.max(zi, zi - sg * 0.06), mul(lc, 0.62), SF.BRONZE, 'xXyY' + (sg > 0 ? 'z' : 'Z'));
    for (let k = 1; k < 4; k++) { const x = lerp(xa, xb, k / 4); B.box(x - 0.025, QUAY_Y + 0.1, Math.min(zi, zi - sg * 0.02), x + 0.025, QUAY_Y + GATE_H - 0.3, Math.max(zi, zi - sg * 0.02), mul(lc, 0.5), SF.BRONZE, 'xX' + (sg > 0 ? 'z' : 'Z')); }
    for (const y of [2.15, 4.65]) for (let k = 0; k < 5; k++) { const x = lerp(xa + 0.3, xb - 0.3, k / 4); B.box(x - 0.07, QUAY_Y + y - 0.07, Math.min(zi, zi - sg * 0.07), x + 0.07, QUAY_Y + y + 0.07, Math.max(zi, zi - sg * 0.07), mul(lc, 1.25), SF.BRONZE, 'xXyY' + (sg > 0 ? 'z' : 'Z')); }
  }
  // the mole: 12 m wide, its end 150 m from the city wall, a wall on its seaward side, three towers on its outer 100 m
  const mx1 = WALL_X1 + 150, my = 2.2;
  B.box(QUAY_X1 - 2, -5, zA, mx1, my, zA + MOLE_W, COL.rock, SF.ROCK, 'XYzZ', COL.paving, SF.PAVING);
  B.box(QUAY_X1 - 2, my, zA, mx1, my + 5.2, zA + 2.2, st, SF.ASHLAR, 'XYzZ');
  merlons(B, QUAY_X1, zA + 0.3, mx1, zA + 0.3, my + 5.2, st);
  for (const xc of [mx1 - 95.5, mx1 - 50, mx1 - 4.5]) tower(B, xc - 4.5, zA - 0.8, xc + 4.5, zA + 8.2, -2, my + 14, mul(st, 0.97));
  tower(B, WALL_X0 - 0.6, zA - 0.5, WALL_X1 + 2.5, zA + 8.6, -2, ty + 1, mul(st, 0.97));
}

// ---------------------------------------------------------------- houses (invented: plain Greek town houses of the third century BC)
// Local frame: the street front is the plane z = 0 looking toward +z, the house lies behind it (z from -d to 0), x from -w/2 to w/2,
// y 0 is the threshold. o: { w, d, h, roof: 'flat' | 'ridgeX' | 'ridgeZ', wall, dado, tile, level 0..2, open: [...] }
// An opening is [x0, x1, y0, y1, depth, fill]: a true recess in the front with reveals (jambs, head, sill) and, by its fill,
// 0 the shade of a room, 1 a shut door of two timber leaves, 2 a door with one leaf standing open, 3 a lit back wall,
// 4 a shop: a dim room with shelves of jars on its back wall, 5 shutters shut in the reveal.
const ROOM = [0.085, 0.07, 0.058], SHADE = [0.3, 0.25, 0.2];
function frontWall(B, x0, x1, fy, h, dd, wall, dado, sf, open, wall2 = wall, storey = 1e3, eave = 0) {
  const xs = [x0, x1]; for (const o of open) xs.push(o[0], o[1]);
  xs.sort((p, q) => p - q);
  // the colour at a height: the dado below, the wall stained darker and warmer over its lowest 2.4 m, another limewash
  // upstairs; eave: the top `eave` metres under the roof's edge weathered darker and greyer toward the top (the avenue's fronts)
  const stain = mix3(mul(wall, 0.8), mul(dado, 1.25), 0.3), knee = dd + 2.4, cuts = [dd, knee, storey], top = h < storey ? wall : wall2, damp = mix3(mul(top, 0.72), [0.42, 0.4, 0.4], 0.18);
  if (eave) cuts.push(h - eave);
  const tone = (y, up) => (y < dd - 0.005 || (y < dd + 0.005 && !up) ? dado : eave && y > h - 0.005 ? damp : y >= storey - (up ? 0.005 : -0.005) ? wall2 : mix3(stain, wall, clamp((y - dd) / 2.4, 0, 1)));
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1]; if (b - a < 0.01) continue;
    const m = (a + b) / 2, holes = open.filter((o) => o[0] < m && o[1] > m).sort((p, q) => p[2] - q[2]);
    const band = (ya, yb) => {
      const ys = [ya, ...cuts.filter((c) => c > ya + 0.01 && c < yb - 0.01), yb];
      for (let k = 0; k < ys.length - 1; k++) if (ys[k + 1] - ys[k] > 0.01) B.quad([a, ys[k], 0], [b, ys[k], 0], [b, ys[k + 1], 0], [a, ys[k + 1], 0], tone(ys[k], true), sf, tone(ys[k + 1], false));
    };
    let y = fy; for (const o of holes) { band(y, o[2]); y = o[3]; } band(y, h);
  }
}
function recess(B, o, wall, sf, door) {
  const [a, b, y0, y1, depth, fill] = o, rz = -depth, jam = mul(wall, 0.82), m = (a + b) / 2;
  B.quad([a, y0, 0], [a, y0, rz], [a, y1, rz], [a, y1, 0], jam, sf); B.quad([b, y0, rz], [b, y0, 0], [b, y1, 0], [b, y1, rz], jam, sf);
  B.quad([a, y1, rz], [b, y1, rz], [b, y1, 0], [a, y1, 0], mul(wall, 0.6), sf);
  B.quad([a, y0, 0], [b, y0, 0], [b, y0, rz], [a, y0, rz], y0 < 0.1 ? mul(COL.paving, fill === 3 ? 0.9 : 0.7) : mul(wall, 1.02), y0 < 0.1 ? SF.PAVING : sf);
  if (fill === 1 || fill === 2) {
    B.quad([a, y0, rz], [m - 0.015, y0, rz], [m - 0.015, y1, rz], [a, y1, rz], door, SF.TIMBER);
    if (fill === 1) B.quad([m + 0.015, y0, rz], [b, y0, rz], [b, y1, rz], [m + 0.015, y1, rz], door, SF.TIMBER);
    else { B.quad([m, y0, rz], [b, y0, rz], [b, y1, rz], [m, y1, rz], ROOM, sf); B.box(b - 0.07, y0 + 0.03, rz - 0.02, b - 0.02, y1 - 0.03, rz + Math.min((b - a) * 0.46, depth - 0.06), door, SF.TIMBER, 'xZ'); }
    B.quad([m - 0.015, y0, rz + 0.005], [m + 0.015, y0, rz + 0.005], [m + 0.015, y1, rz + 0.005], [m - 0.015, y1, rz + 0.005], ROOM, sf);
    for (const yy of [y0 + 0.35, y1 - 0.45]) B.box(a + 0.04, yy, rz, (fill === 1 ? b : m) - 0.04, yy + 0.09, rz + 0.03, mul(door, 0.75), SF.TIMBER, 'yYZ');
  } else if (fill === 5) {
    for (const [p, q] of [[a, m - 0.01], [m + 0.01, b]]) B.quad([p, y0, -0.07], [q, y0, -0.07], [q, y1, -0.07], [p, y1, -0.07], door, SF.TIMBER);
    B.quad([m - 0.01, y0, -0.075], [m + 0.01, y0, -0.075], [m + 0.01, y1, -0.075], [m - 0.01, y1, -0.075], ROOM, sf);
  } else {
    // the room's shade: a dim back wall, dimmer toward the top, so that the opening reads as a depth and not as a dark patch
    B.quad([a, y0, rz], [b, y0, rz], [b, y1, rz], [a, y1, rz], fill === 3 ? mul(wall, 0.8) : fill === 4 ? SHADE : mix3(ROOM, SHADE, 0.45), sf, fill === 3 ? mul(wall, 0.62) : fill === 4 ? mix3(ROOM, SHADE, 0.55) : ROOM);
    if (fill === 4) for (const yy of [y0 + 1.15, y0 + 1.75]) {
      B.box(a + 0.15, yy, rz, b - 0.15, yy + 0.05, rz + 0.3, mul(COL.timber, 1.3), SF.TIMBER, 'yYZ');
      for (let x = a + 0.4; x < b - 0.3; x += 0.66) B.cyl(x, rz + 0.16, 0.07, 0.12, yy + 0.05, yy + 0.36, 4, mul(CLAY, 0.75 + 0.3 * ((x * 7.3) % 1)), SF.BRONZE, false);
    }
  }
}
// sills, lintels and, where a window stands open, its two shutters folded back on the wall
function windowTrim(B, wins, wall, tc) {
  for (const [a, b, y0, y1, , fill] of wins) {
    B.box(a - 0.1, y0 - 0.08, 0, b + 0.1, y0, 0.08, mul(wall, 1.04), SF.PLASTER, 'xXyYZ');
    B.box(a - 0.16, y1, 0, b + 0.16, y1 + 0.11, 0.05, tc, SF.TIMBER, 'xXyYZ');
    if (fill === 0) for (const xm of [a - 0.19, b + 0.19]) B.box(xm - 0.17, y0, 0, xm + 0.17, y1, 0.045, tc, SF.TIMBER, 'xXyYZ');
  }
}
// a plain house off the avenue shows small shuttered windows on its four walls: a row under the eaves and, on a house of
// two floors, a second row below; and a door on its front. Each is one pane (cityPane: the material draws the stone
// surround, the sill, the slatted leaves or the open leaf's dark, the door's rails); the leaves' paint is the house's own,
// four windows in nine stand with one leaf open.
// pane: from (px, py, pz) wd metres along (ux, uz) and ht metres up, lit from the side to which (ux, uz) turns right
const pane = (B, px, py, pz, ux, uz, wd, ht, code) => B.grid(1, 1, (u, v) => [px + ux * wd * u, py + ht * v, pz + uz * wd * u], (u, v) => [u, v, code], SF.PANE);
function plainWindows(B, o) {
  const { w, d, h } = o, e = 0.012, rows = o.two ? [[h - 2.2, h - 1.35], [1.9, 2.6]] : [[h - 1.5, h - 0.95]];
  const own = 0.06 + 0.88 * hash2(o.x * 1.3, o.z * 0.7), codeOf = (i, j) => ((hash2(o.x + i * 3.7, o.z + j * 5.1) < 0.56 ? 0 : 1) + own) / 4;
  rows.forEach(([y0, y1], j) => {
    const nx = Math.max(1, Math.round(w / 3.1)), nz = Math.max(1, Math.round(d / 3.4)), yb = y0 - 0.12, ht = y1 - y0 + 0.24;
    for (let i = 0; i < nx; i++) {
      const c = -w / 2 + (i + 0.5) * w / nx + 0.3 * Math.sin(o.x * 3.1 + i * 2.3);
      pane(B, c - 0.42, yb, e, 1, 0, 0.84, ht, codeOf(i, j)); pane(B, c + 0.42, yb, -d - e, -1, 0, 0.84, ht, codeOf(i + 9, j));
    }
    for (let i = 0; i < nz; i++) {
      const c = -d + (i + 0.5) * d / nz + 0.3 * Math.sin(o.z * 2.7 + i * 1.9);
      pane(B, w / 2 + e, yb, c + 0.42, 0, -1, 0.84, ht, codeOf(i + 17, j)); pane(B, -w / 2 - e, yb, c - 0.42, 0, 1, 0.84, ht, codeOf(i + 29, j));
    }
  });
  const dx = 0.3 * w * Math.sin(o.x * 1.7 + o.z);
  pane(B, dx - 0.69, -1, e, 1, 0, 1.38, 3.36, (2 + own) / 4);
}
function house(B, o, D = B) {
  const { w, d, h } = o, x0 = -w / 2, x1 = w / 2, dd = o.level > 0 ? (o.dadoH ?? 1.0) : 0, wall = o.wall, sf = o.level > 0 ? (o.stone ? SF.ASHLAR : wallSurf(o.y, h)) : farWall(o.y, o.two), fy = -3;
  // side and back walls, with the darker dado below
  const faces = o.side ? (o.side.sg > 0 ? 'xz' : 'Xz') : 'xXz', wall2 = o.wall2 || wall, storey = o.two ? 3.375 : 1e3, tc = o.door || COL.timber;
  if (dd) { B.box(x0, fy, -d, x1, dd, 0, o.dado, sf, faces); B.box(x0, dd, -d, x1, h, 0, wall, sf, faces); } else B.box(x0, fy, -d, x1, h, 0, wall, sf, faces);
  const open = o.open || [];
  frontWall(B, x0, x1, fy, h, dd, wall, o.dado || wall, sf, open, wall2, storey, o.level > 1 ? 0.9 : 0);
  for (const op of open) recess(D, op, op[2] > storey ? wall2 : wall, sf, tc);
  if (o.wins) windowTrim(D, o.wins, wall2, tc);
  if (!o.open && o.level > 0) plainWindows(D, o);
  if (o.side) {
    // a side wall that stands on a lane is a front of its own, with its own small windows (the frame turned a quarter)
    const sg = o.side.sg, c = Math.cos(o.turn), sn = Math.sin(o.turn), lx = sg * w / 2, lz = -d / 2;
    for (const q of D === B ? [B] : [B, D]) q.at(o.x + lx * c + lz * sn, o.y, o.z - lx * sn + lz * c, o.turn + sg * Math.PI / 2);
    frontWall(B, -d / 2, d / 2, fy, h, dd, wall, o.dado || wall, sf, o.side.open, wall2, storey, o.level > 1 ? 0.9 : 0);
    for (const op of o.side.open) recess(D, op, op[2] > storey ? wall2 : wall, sf, tc);
    windowTrim(D, o.side.open, wall2, tc);
    if (o.two) D.box(-d / 2, 3.3, 0, d / 2, 3.45, 0.07, mul(wall, 0.9), SF.PLASTER, 'yYZ');
    for (const q of D === B ? [B] : [B, D]) q.at(o.x, o.y, o.z, o.turn);
  }
  // the roof: flat with a low parapet, or pitched tile with eaves that stand out over the walls
  if (o.roof === 'flat') {
    if (o.level > 0) {
      const p = 0.3, t = h - 0.45, pc = mul(wall, 0.96);
      B.quad([x0 + p, t, -p], [x1 - p, t, -p], [x1 - p, t, -d + p], [x0 + p, t, -d + p], COL.flat, TERRACE);
      B.box(x0, t, -p, x1, h, 0, pc, sf, 'zY'); B.box(x0, t, -d, x1, h, -d + p, pc, sf, 'ZY'); B.box(x0, t, -d, x0 + p, h, 0, pc, sf, 'XY'); B.box(x1 - p, t, -d, x1, h, 0, pc, sf, 'xY');
      if (o.level > 1) D.box(x0 - 0.06, h, -0.36, x1 + 0.06, h + 0.09, 0.1, mul(wall, 1.04), sf, 'xXyYZz');
    } else {
      // a far house's flat roof: every roof its own shade of beaten earth, from pale new clay to old and dark (by its place)
      B.quad([x0, h, 0], [x1, h, 0], [x1, h, -d], [x0, h, -d], mul(mix3(COL.flat, [0.3, 0.22, 0.13], 0.85 * hash2(o.x, o.z)), 0.86 + 0.3 * hash2(o.z + 7, o.x)), TERRACE + 0.07);
    }
  } else {
    // the eaves: on the avenue 0.7 m out over the street (0.4 m where a gable looks on it) and 0.3 m at the sides, where a
    // neighbour stands; elsewhere 0.45 m all round. Under the street's eaves a timber soffit and a fascia board; up a street
    // gable's two rakes a limewashed cornice from the wall out to the tiles' edge; along every ridge a roll of cover tiles.
    const av = o.level > 1, tile = o.tile, alongX = o.roof === 'ridgeX', ovF = av ? (alongX ? 0.7 : 0.4) : 0.45, ovS = av ? 0.3 : 0.45, ovB = 0.45, rise = (alongX ? d : w) * 0.17 + 0.2, e = h - 0.1;
    // the ridge runs along local x (ridgeX) or local z; the kind of tile pattern follows the ridge's WORLD direction
    const worldX = (Math.abs(o.turnCos) > 0.5) === alongX, ts = tileSurf(worldX ? SF.TILE_X : SF.TILE_Z, o.y + e), under = mul(COL.timber, 1.25), roll = mul(tile, 1.12), yr = e + rise + 0.03;
    if (alongX) {
      const zm = -d / 2;
      B.quad([x0 - ovS, e, ovF], [x1 + ovS, e, ovF], [x1 + ovS, e + rise, zm], [x0 - ovS, e + rise, zm], tile, ts);
      B.quad([x1 + ovS, e, -d - ovB], [x0 - ovS, e, -d - ovB], [x0 - ovS, e + rise, zm], [x1 + ovS, e + rise, zm], tile, ts);
      B.tri([x1, h, 0], [x1, h, -d], [x1, h + rise - 0.1, zm], wall, sf); B.tri([x0, h, -d], [x0, h, 0], [x0, h + rise - 0.1, zm], wall, sf);
      if (av) { B.quad([x0 - ovS, e - 0.02, 0], [x1 + ovS, e - 0.02, 0], [x1 + ovS, e - 0.02, ovF], [x0 - ovS, e - 0.02, ovF], under, SF.TIMBER); B.box(x0 - ovS, e - 0.17, ovF - 0.05, x1 + ovS, e + 0.02, ovF + 0.02, mul(under, 0.8), SF.TIMBER, 'xXyZ'); }
      if (o.level > 0) D.beam([x0 - ovS, yr, zm], [x1 + ovS, yr, zm], 0.26, roll, SF.PLASTER, 0.15);
    } else {
      B.quad([x1 + ovS, e, ovF], [x1 + ovS, e, -d - ovB], [0, e + rise, -d - ovB], [0, e + rise, ovF], tile, ts);
      B.quad([x0 - ovS, e, -d - ovB], [x0 - ovS, e, ovF], [0, e + rise, ovF], [0, e + rise, -d - ovB], tile, ts);
      B.tri([x0, h, 0], [x1, h, 0], [0, h + rise - 0.1, 0], wall, sf); B.tri([x1, h, -d], [x0, h, -d], [0, h + rise - 0.1, -d], wall, sf);
      if (av) for (const sg of [-1, 1]) B.beam([sg * (w / 2 + ovS), e - 0.13, ovF / 2], [0, e + rise - 0.13, ovF / 2], ovF, mul(wall, 0.9), SF.PLASTER, 0.22);
      if (o.level > 0) D.beam([0, yr, ovF], [0, yr, -d - ovB], 0.26, roll, SF.PLASTER, 0.15);
    }
  }
}

// a walled yard behind a house, open to the sky (a light well between the rows): three walls 0.25 m thick and 2.7 m high from
// the house's back wall, a floor of beaten earth
function yardWalls(B, w, z0, z1, wall) {
  const x0 = -w / 2, x1 = w / 2, t = 0.25, y1 = 2.7, yf = 0.5, c = mul(wall, 0.95), ci = mul(wall, 0.8);
  B.box(x0, -3, z0, x1, y1, z1, c, SF.PLASTER, 'xXz');
  B.quad([x0 + t, yf, z1], [x1 - t, yf, z1], [x1 - t, yf, z0 + t], [x0 + t, yf, z0 + t], COL.flat, SF.EARTH);
  B.quad([x0 + t, yf, z0 + t], [x1 - t, yf, z0 + t], [x1 - t, y1, z0 + t], [x0 + t, y1, z0 + t], ci, SF.PLASTER);
  B.quad([x0 + t, yf, z1], [x0 + t, yf, z0 + t], [x0 + t, y1, z0 + t], [x0 + t, y1, z1], ci, SF.PLASTER);
  B.quad([x1 - t, yf, z0 + t], [x1 - t, yf, z1], [x1 - t, y1, z1], [x1 - t, y1, z0 + t], ci, SF.PLASTER);
  B.box(x0, y1 - 0.01, z0, x1, y1, z0 + t, c, SF.PLASTER, 'Y'); B.box(x0, y1 - 0.01, z0 + t, x0 + t, y1, z1, c, SF.PLASTER, 'Y'); B.box(x1 - t, y1 - 0.01, z0 + t, x1, y1, z1, c, SF.PLASTER, 'Y');
}
// THE ROOFS IN USE (all invented; the avenue's rows, the rows behind them and the next street's). A flat roof is a terrace:
// the stair's head (a small hut with a door) in a back corner, jars along the parapet, a pergola of poles with a vine out of a
// tub, washing on a line, a cloth spread to dry or a mat with a bolster, bedding aired over the parapet that looks toward
// the avenue, pot herbs in a row, somebody up there, doves on the parapet. A tiled roof
// has its smoke hole under a clay hood, a patch of newer tiles, doves on the ridge. A store of the low zone or a house of a
// back row may have a walled yard behind it with a tree. Every house takes the same fourteen numbers (o.rk) from its row's
// roof stream, used or not. rich: the avenue's rows and the rows behind them; the next street's rows keep to the stair's
// head and the hood.
function roofThings(B, D, Bcl, o, perch, rich) {
  const { w, d, h } = o, k = o.rk, sg = k[0] < 0.5 ? -1 : 1, tim = mul(COL.timber, 1.5), c = Math.cos(o.turn), sn = Math.sin(o.turn);
  if (o.court !== undefined) storeCourt(B, D, o, perch);
  const dove = (x, y, z, i) => { D.box(x - 0.11, y, z - 0.055, x + 0.11, y + 0.12, z + 0.055, i % 3 ? [0.6, 0.6, 0.65] : [0.86, 0.85, 0.82], SF.PLASTER, 'xXYzZ'); D.box(x + 0.07, y + 0.1, z - 0.035, x + 0.15, y + 0.19, z + 0.035, [0.5, 0.5, 0.56], SF.PLASTER, 'xXYzZ'); };
  if (o.yard2) {
    const z0 = -d - 3.4, yx = (k[13] - 0.5) * (w - 3.6);
    yardWalls(B, w, z0, -d, o.wall);
    if (k[13] < 0.3) cypress(B, yx, 0.4, z0 + 1.7, 7 + 3 * k[12] / 0.3, k[13]); else leafTree(B, yx, 0.4, z0 + 1.7, 5.2 + 2.4 * k[13], k[13], 2, true);
  }
  if (o.roof === 'flat') {
    const t = o.level > 0 ? h - 0.45 : h, xa = -w / 2 + 0.3, xb = w / 2 - 0.3, zb = -d + 0.3;
    if (k[1] < (o.low ? 0.45 : 0.75)) {
      const hx0 = sg > 0 ? xb - 1.5 : xa, hz1 = zb + 2.0;
      B.box(hx0, t, zb, hx0 + 1.5, t + 1.9, hz1, mul(o.wall, 0.97), SF.PLASTER, 'xXzZ'); B.box(hx0 - 0.08, t + 1.9, zb, hx0 + 1.58, t + 1.98, hz1 + 0.08, COL.flat, SF.EARTH, 'xXzZY');
      D.box(hx0 + 0.4, t, hz1, hx0 + 1.15, t + 1.6, hz1 + 0.02, mul(COL.timber, 0.9), SF.TIMBER, 'xXYZ');
    }
    for (let i = 0, n = rich ? Math.floor(k[2] * 4) : 0; i < n; i++) amphora(D, -sg * (w / 2 - 0.8 - 0.48 * i), t, zb + 0.4 + 0.1 * (i % 2), 1.0 + 0.25 * ((i * 7 + 3) % 4) / 3, mul(CLAY, 0.82 + 0.06 * (i % 3)), 5);
    if (rich && k[3] < (o.low ? 0.25 : 0.42) && w > 6.4 && d > 9.2) {
      const px = -sg * w * 0.14, pz = -d * 0.52, pw = 1.45, pd = 1.7, py = t + 2.15, g = [0.2, 0.3, 0.1];
      for (const sx of [-1, 1]) { for (const sz of [-1, 1]) B.beam([px + sx * pw, t, pz + sz * pd], [px + sx * pw, py, pz + sz * pd], 0.1, tim, SF.TIMBER, 0.1, false); B.beam([px + sx * pw, py + 0.05, pz - pd - 0.3], [px + sx * pw, py + 0.05, pz + pd + 0.3], 0.09, tim, SF.TIMBER); }
      for (let i = 0; i < 5; i++) { const z = pz - pd + i * pd / 2; D.beam([px - pw - 0.3, py + 0.13, z], [px + pw + 0.3, py + 0.13, z], 0.06, tim, SF.TIMBER, 0.06, false); }
      D.cyl(px - pw + 0.35, pz - pd + 0.1, 0.24, 0.3, t, t + 0.45, 7, mul(CLAY, 0.8), SF.BRONZE, true); D.beam([px - pw + 0.3, t + 0.4, pz - pd + 0.1], [px - pw + 0.05, py + 0.1, pz - pd + 0.2], 0.06, [0.25, 0.2, 0.13], SF.TIMBER, 0.06, false);
      leafLump(B, px - 0.3, py + 0.2, pz - 0.5, pw * 0.95, 0.24, pd * 0.75, mul(g, 0.9 + 0.3 * k[4]), k[4] * 9, 6, 3); leafLump(B, px + 0.45, py + 0.22, pz + 0.7, pw * 0.8, 0.22, pd * 0.62, mul(g, 1.05), k[4] * 5 + 2, 6, 3);
    }
    if (rich && !o.wash && k[5] < 0.5) {
      const lz = -d * 0.24, la = -w * 0.3, lb = w * 0.3, ly = t + 1.95;
      for (const x of [la, lb]) B.beam([x, t, lz], [x, ly + 0.08, lz], 0.07, COL.timber, SF.TIMBER, 0.07, false);
      for (let x = la + 0.3, i = 0; x < lb - 1.0; i++) { const cw = 0.7 + 0.6 * hash2(o.x + i, 3), ch = 0.7 + 0.5 * hash2(o.x, i + 5), xs = x, ii = i; Bcl.grid(1, 2, (u, v) => [xs + cw * u, ly - ch * v, lz], CLOTHS[Math.floor(hash2(o.x + 2 * i, 9) * 5.99)], SF.CLOTH, false, (u, v) => [0.02 + 0.1 * v, o.x * 0.7 + ii * 1.3 + v * 2]); x += cw + 0.15 + 0.35 * hash2(o.x - i, 7); }
    }
    if (rich && k[6] < 0.5 && o.court === undefined) {
      const mw = 0.9 + 0.8 * k[7], md = 1.3 + 0.9 * k[8], mx = sg * (w / 2 - 1.0 - mw), mz = -0.9, col = k[6] < 0.25 ? [0.74, 0.7, 0.6] : CLOTHS[Math.floor(k[8] * 5.99)];
      D.quad([mx - mw, t + 0.03, mz], [mx + mw, t + 0.03, mz], [mx + mw, t + 0.03, mz - 2 * md], [mx - mw, t + 0.03, mz - 2 * md], col, SF.CLOTH, mul(col, 0.88));
      if (k[6] > 0.25) D.box(mx - mw + 0.15, t + 0.03, mz - 0.55, mx + mw - 0.15, t + 0.2, mz - 0.2, mul(col, 1.15), SF.CLOTH, 'xXYzZ');
    }
    if (rich && (o.low || o.level < 2) && k[9] < 0.42) perch.push({ x: o.x - sg * w * 0.2 * c - d * 0.3 * sn, y: o.y + t, z: o.z + sg * w * 0.2 * sn - d * 0.3 * c, face: k[10] * 6.2832 });
    if (rich && k[11] < 0.3) for (let i = 0, n = 2 + Math.floor(k[10] * 3); i < n; i++) dove(-sg * (0.6 + 0.37 * i + 0.3 * (i % 2)), h, zb - 0.15, i);
    if (rich) {
      // bedding aired over the parapet that looks toward the avenue, on half of these roofs: one to three covers, dyed or
      // pale, laid over the wall's top and hanging most of a metre down its face; and on three roofs in ten pot herbs in a
      // row inside the side parapet (each roof by its own place)
      const kb = hash2(o.x * 0.37, o.z + 4.1), out = o.level > 1 ? 1 : -1, zw = o.level > 1 ? 0 : -d, zi = zw - out * 0.34, zo = zw + out * (o.level > 1 ? 0.14 : 0.05), yt = h + (o.level > 1 ? 0.11 : 0.02);
      if (kb < 0.5) for (let i = 0, n = 1 + Math.floor(kb * 6), x = sg * (w / 2 - 1.2); i < n; i++) {
        const bw = 0.95 + 0.5 * hash2(o.x + i, 13), drop = 0.7 + 0.3 * hash2(o.z, i + 2), xa = x - sg * bw, xb = x, col = hash2(o.x - i, 5) < 0.4 ? [0.78, 0.74, 0.64] : CLOTHS[2 + Math.floor(hash2(o.x + 3 * i, 8) * 2.99)], ph = o.x * 0.9 + i * 2.1;
        Bcl.grid(1, 2, (u, v) => [lerp(xa, xb, u), v < 0.75 ? yt : yt - drop, v < 0.25 ? zi : v < 0.75 ? zo : zo + out * 0.05], col, SF.CLOTH, out * sg > 0, (u, v) => [v > 0.75 ? 0.045 : 0, ph + u * 2]);
        x -= sg * (bw + 0.25 + 0.5 * hash2(o.x, i + 7));
      }
      if (hash2(o.z * 0.61, o.x + 2.3) < 0.3) for (let i = 0, n = 3 + Math.floor(hash2(o.x, o.z) * 3.99), xs = -sg * (w / 2 - 0.55); i < n && -1.1 - 0.8 * i > -d + 1; i++) {
        const z = -1.1 - 0.8 * i - 0.2 * hash2(o.x, i);
        D.cyl(xs, z, 0.11, 0.16, t, t + 0.27, 4, mul(CLAY, 0.8 + 0.1 * (i % 3)), SF.BRONZE, false); D.cyl(xs, z, 0.21, 0.04, t + 0.27, t + 0.62 + 0.16 * (i % 2), 4, [0.14 + 0.05 * (i % 2), 0.25, 0.1], SF.LEAF, true);
      }
    }
  } else {
    const alongX = o.roof === 'ridgeX', av = o.level > 1, ovF = av ? (alongX ? 0.7 : 0.4) : 0.45, ovS = av ? 0.3 : 0.45, rise = (alongX ? d : w) * 0.17 + 0.2, e = h - 0.1, zm = -d / 2;
    const worldX = (Math.abs(o.turnCos) > 0.5) === alongX, ts = worldX ? SF.TILE_X : SF.TILE_Z;
    // the roof's own surface at a place of the house
    const yAt = (lx, lz) => alongX ? e + rise * (lz > zm ? (ovF - lz) / (ovF - zm) : (lz + d + 0.45) / (d / 2 + 0.45)) : e + rise * (1 - Math.abs(lx) / (w / 2 + ovS));
    if (k[1] < 0.6) {
      const hx = alongX ? sg * w * 0.22 : sg * w * 0.24, hz = alongX ? -d * 0.72 : -d * 0.62, hy = yAt(hx, hz);
      D.cyl(hx, hz, 0.21, 0.19, hy - 0.12, hy + 0.3, 7, mul(CLAY, 0.8), SF.BRONZE, false); D.cyl(hx, hz, 0.32, 0.05, hy + 0.3, hy + 0.5, 7, mul(CLAY, 0.92), SF.BRONZE, false);
      // (the hoods of the avenue's rows and of the rows behind them are noted for the hearths' smoke: build())
      if (rich) (perch.hoods || (perch.hoods = [])).push([o.x + hx * c + hz * sn, o.y + hy + 0.5, o.z - hx * sn + hz * c]);
    }
    if (rich && k[5] < 0.45) {
      const col = mul(o.tile, 1.16 + 0.2 * k[6]), lift = 0.035;
      if (alongX) { const xA = (k[7] - 0.5) * (w - 3.2) - 1.1, xB = xA + 1.5 + 1.2 * k[8], zA = -0.6 - 1.5 * k[6], zB = zA - 1.5 - 1.2 * k[7]; D.quad([xA, yAt(0, zA) + lift, zA], [xB, yAt(0, zA) + lift, zA], [xB, yAt(0, zB) + lift, zB], [xA, yAt(0, zB) + lift, zB], col, ts); }
      else { const xo = sg * (w / 2 - 0.5 - 0.8 * k[7]), xi = xo - sg * (1.1 + 0.8 * k[8]), zF = -1.2 - (d - 6) * k[6], zK = zF - 1.6 - 1.4 * k[7], yo = yAt(xo, 0) + lift, yi = yAt(xi, 0) + lift; if (sg > 0) D.quad([xo, yo, zF], [xo, yo, zK], [xi, yi, zK], [xi, yi, zF], col, ts); else D.quad([xo, yo, zK], [xo, yo, zF], [xi, yi, zF], [xi, yi, zK], col, ts); }
    }
    if (rich && k[11] < 0.3) for (let i = 0, n = 2 + Math.floor(k[10] * 3); i < n; i++) { const q = -sg * (0.5 + 0.37 * i + 0.3 * (i % 2)); if (alongX) dove(q, e + rise + 0.1, zm, i); else dove(0, e + rise + 0.1, zm + q, i); }
  }
}

// A STORE'S COURT (ours; which store and which kind: lifeOf). Behind the store's front range, within three walls: a door
// from the range, and
// 0 THE GARDEN: a fig tree; against the back wall a well (a round kerb of stone, two posts and a beam for the rope), jars;
// 1 THE POTTER'S YARD: his kiln (a round dome of daubed clay, its fire mouth toward the yard, smoke from its top: build()),
//   a lean-to of tiles on posts along one wall, a pile of wood, and on the range's flat roof pots set out to dry in rows;
// 2 THE SHRINE: at the back a little house of the god on a podium (two columns, a gabled roof of tiles, a garland), an
//   altar before it, a tall cypress beside it and a lesser one;
// 3 THE DOVECOTE: a square tower 1.6 m broad and 3.6 m high with two ranks of holes and ledges under a tiled cap,
// doves on it; an olive.
function roofDove(D, x, y, z, i) { D.box(x - 0.11, y, z - 0.055, x + 0.11, y + 0.12, z + 0.055, i % 3 ? [0.6, 0.6, 0.65] : [0.86, 0.85, 0.82], SF.PLASTER, 'xXYzZ'); D.box(x + 0.07, y + 0.1, z - 0.035, x + 0.15, y + 0.19, z + 0.035, [0.5, 0.5, 0.56], SF.PLASTER, 'xXYzZ'); }
function storeCourt(B, D, o, perch) {
  const { w, d } = o, k = o.rk, sg = k[0] < 0.5 ? -1 : 1, z1 = -d, z0 = -o.dFull, zb = z0 + 0.25, yf = 0.5, st = mul(COL.stone, 0.95), tim = mul(COL.timber, 1.5), c = Math.cos(o.turn), sn = Math.sin(o.turn);
  yardWalls(B, w, z0, z1, o.wall);
  pane(D, sg * w * 0.22 + 0.6, yf, z1 - 0.012, -1, 0, 1.2, 2.25, (2 + 0.06 + 0.88 * k[2]) / 4);
  if (o.court === 0) {
    leafTree(B, sg * w * 0.13, yf, lerp(z1, z0, 0.42), 5.8 + 1.4 * k[4], k[13], 2, true);
    const wx = -sg * (w / 2 - 1.5), wz = zb + 1.15;
    D.cyl(wx, wz, 0.62, 0.62, yf, yf + 0.75, 8, st, SF.ASHLAR, false); D.cyl(wx, wz, 0.62, 0.42, yf + 0.75, yf + 0.76, 8, mul(st, 1.06), SF.ASHLAR, false);
    D.quad([wx - 0.43, yf + 0.55, wz + 0.43], [wx + 0.43, yf + 0.55, wz + 0.43], [wx + 0.43, yf + 0.55, wz - 0.43], [wx - 0.43, yf + 0.55, wz - 0.43], [0.05, 0.09, 0.1], SF.BRONZE);
    for (const sx of [-1, 1]) D.beam([wx + sx * 0.8, yf, wz], [wx + sx * 0.8, yf + 2.25, wz], 0.1, tim, SF.TIMBER, 0.1, false);
    D.beam([wx - 0.95, yf + 2.25, wz], [wx + 0.95, yf + 2.25, wz], 0.1, tim, SF.TIMBER);
    for (let i = 0; i < 3; i++) amphora(D, wx + sg * (1.3 + 0.45 * i), yf, wz - 0.2 + 0.15 * (i % 2), 1.05 + 0.1 * (i % 2), mul(CLAY, 0.82 + 0.08 * i), 5);
  } else if (o.court === 1) {
    const kx = sg * (w / 2 - 1.9), kz = zb + 1.75, daub = [0.5, 0.37, 0.26];
    B.cyl(kx, kz, 1.3, 1.25, yf, yf + 1.3, 8, daub, SF.EARTH, false); B.cyl(kx, kz, 1.25, 0.85, yf + 1.3, yf + 2.1, 8, mul(daub, 0.92), SF.EARTH, false); B.cyl(kx, kz, 0.85, 0.3, yf + 2.1, yf + 2.6, 8, mul(daub, 0.6), SF.EARTH, true);
    D.box(kx - sg * 1.55, yf, kz - 0.36, kx - sg * 1.2, yf + 0.75, kz + 0.36, [0.06, 0.05, 0.05], SF.BRONZE, 'xXYzZ');
    D.quad([kx - sg * 1.56, yf + 0.05, kz - sg * 0.24], [kx - sg * 1.56, yf + 0.05, kz + sg * 0.24], [kx - sg * 1.56, yf + 0.4, kz + sg * 0.24], [kx - sg * 1.56, yf + 0.4, kz - sg * 0.24], [2.4, 0.7, 0.15], SF.BRONZE);
    (perch.kilns || (perch.kilns = [])).push([o.x + kx * c + kz * sn, o.y + yf + 2.7, o.z - kx * sn + kz * c]);
    // the lean-to: three posts, a plate, tiles from the wall's top down to it
    const xw = -sg * (w / 2 - 0.25), xp = xw + sg * 2.3, za = zb + 0.4, zc = Math.min(za + 5.2, z1 - 1.2), ts = tileSurf(SF.TILE_Z, o.y + 2.55), tile = mul(o.tile, 1.05);
    for (let i = 0; i < 3; i++) B.beam([xp, yf, lerp(za, zc, i / 2)], [xp, 2.55, lerp(za, zc, i / 2)], 0.12, tim, SF.TIMBER, 0.12, false);
    B.beam([xp, 2.58, za - 0.2], [xp, 2.58, zc + 0.2], 0.12, tim, SF.TIMBER);
    if (sg > 0) B.quad([xp + 0.3, 2.55, za - 0.3], [xp + 0.3, 2.55, zc + 0.3], [xw, 3.2, zc + 0.3], [xw, 3.2, za - 0.3], tile, ts); else B.quad([xp - 0.3, 2.55, zc + 0.3], [xp - 0.3, 2.55, za - 0.3], [xw, 3.2, za - 0.3], [xw, 3.2, zc + 0.3], tile, ts);
    D.box(xw + sg * 0.1, yf, zc - 1.9, xw + sg * 0.75, yf + 0.9, zc, [0.4, 0.29, 0.17], SF.TIMBER, 'xXYzZ');
    for (let i = 0, t = o.h - 0.45; i < 10; i++) { const px = -sg * (w / 2 - 1.0 - 0.5 * (i % 5)), pz = -d + 0.75 + 0.5 * Math.floor(i / 5); D.cyl(px, pz, 0.1, 0.17, t, t + 0.28, 5, mul(CLAY, 0.72 + 0.26 * hash2(o.x + i, 3)), SF.BRONZE, false); D.cyl(px, pz, 0.17, 0.09, t + 0.28, t + 0.4, 5, mul(CLAY, 0.8), SF.BRONZE, false); }
  } else if (o.court === 2) {
    const white = [0.86, 0.83, 0.76], zf = zb + 1.3, zc = zb + 1.9, tile = mul(o.tile, 0.95), ts = tileSurf(SF.TILE_Z, o.y + yf + 2.5);
    B.box(-1.2, yf, zb + 0.05, 1.2, yf + 0.6, zc + 0.1, st, SF.ASHLAR, 'xXZY'); B.box(-0.85, yf + 0.6, zb + 0.15, 0.85, yf + 2.3, zf, white, SF.MARBLE, 'xXZ');
    D.quad([-0.45, yf + 0.62, zf + 0.012], [0.45, yf + 0.62, zf + 0.012], [0.45, yf + 2.0, zf + 0.012], [-0.45, yf + 2.0, zf + 0.012], ROOM, SF.PLASTER, mul(ROOM, 0.7));
    for (const sx of [-1, 1]) D.cyl(sx * 0.72, zc - 0.15, 0.11, 0.09, yf + 0.6, yf + 2.3, 6, white, SF.MARBLE, false);
    B.box(-0.95, yf + 2.3, zb + 0.1, 0.95, yf + 2.5, zc + 0.05, white, SF.MARBLE, 'xXZy');
    B.quad([1.08, yf + 2.5, zc + 0.15], [1.08, yf + 2.5, zb + 0.05], [0, yf + 3.08, zb + 0.05], [0, yf + 3.08, zc + 0.15], tile, ts); B.quad([-1.08, yf + 2.5, zb + 0.05], [-1.08, yf + 2.5, zc + 0.15], [0, yf + 3.08, zc + 0.15], [0, yf + 3.08, zb + 0.05], tile, ts);
    B.tri([-0.95, yf + 2.5, zc + 0.05], [0.95, yf + 2.5, zc + 0.05], [0, yf + 3.0, zc + 0.05], white, SF.MARBLE);
    leafSwag(D, [-0.8, yf + 2.28, zc + 0.03], [0.8, yf + 2.28, zc + 0.03], 0.3, 5, 0);
    D.box(-0.45, yf, zc + 1.1, 0.45, yf + 0.8, zc + 1.7, st, SF.ASHLAR, 'xXzZ'); D.box(-0.5, yf + 0.8, zc + 1.05, 0.5, yf + 0.88, zc + 1.75, mul(st, 0.7), SF.ASHLAR, 'xXzZY');
    cypress(B, sg * (w / 2 - 1.3), yf, zb + 1.3, 8 + 2 * k[4], k[13]); if (w > 7.6) cypress(B, -sg * (w / 2 - 1.3), yf, zb + 1.6, 6 + k[13], k[4]);
  } else {
    const cx = sg * (w / 2 - 1.7), cz = zb + 1.6, y1 = yf + 3.6, lime = mul(o.wall, 1.04), tile = mul(o.tile, 1.0);
    B.box(cx - 0.8, yf, cz - 0.8, cx + 0.8, y1, cz + 0.8, lime, wallSurf(o.y + yf, 3.6), 'xXzZ');
    for (let j = 0; j < 2; j++) {
      const y = yf + 2.25 + 0.62 * j;
      D.box(cx - 0.93, y - 0.06, cz - 0.93, cx + 0.93, y, cz + 0.93, tim, SF.TIMBER, 'xXzZYy');
      for (const sx of [-1, 1]) { const a = sx * 0.38 - 0.1, b = sx * 0.38 + 0.1;
        D.quad([cx + a, y + 0.05, cz + 0.812], [cx + b, y + 0.05, cz + 0.812], [cx + b, y + 0.3, cz + 0.812], [cx + a, y + 0.3, cz + 0.812], ROOM, SF.PLASTER); D.quad([cx + b, y + 0.05, cz - 0.812], [cx + a, y + 0.05, cz - 0.812], [cx + a, y + 0.3, cz - 0.812], [cx + b, y + 0.3, cz - 0.812], ROOM, SF.PLASTER);
        D.quad([cx + 0.812, y + 0.05, cz + b], [cx + 0.812, y + 0.05, cz + a], [cx + 0.812, y + 0.3, cz + a], [cx + 0.812, y + 0.3, cz + b], ROOM, SF.PLASTER); D.quad([cx - 0.812, y + 0.05, cz + a], [cx - 0.812, y + 0.05, cz + b], [cx - 0.812, y + 0.3, cz + b], [cx - 0.812, y + 0.3, cz + a], ROOM, SF.PLASTER); }
    }
    const top = [cx, y1 + 0.75, cz], p = [[cx - 0.98, y1, cz + 0.98], [cx + 0.98, y1, cz + 0.98], [cx + 0.98, y1, cz - 0.98], [cx - 0.98, y1, cz - 0.98]];
    B.tri(p[0], p[1], top, tile, SF.TILE_X); B.tri(p[1], p[2], top, tile, SF.TILE_Z); B.tri(p[2], p[3], top, tile, SF.TILE_X); B.tri(p[3], p[0], top, tile, SF.TILE_Z);
    for (let i = 0; i < 6; i++) { const a = i % 4, e = 0.86, s = (i * 0.37 + k[10]) % 1 * 1.4 - 0.7, y = yf + 2.25 + 0.62 * (i % 2); if (a === 0) roofDove(D, cx + s, y, cz + e, i); else if (a === 1) roofDove(D, cx + e, y, cz + s, i); else if (a === 2) roofDove(D, cx + s, y, cz - e, i); else roofDove(D, cx - e, y, cz + s, i); }
    leafTree(B, -sg * w * 0.17, yf, lerp(z1, z0, 0.45), 4.8 + k[4], k[13], 1, true);
  }
}

// one row of houses along a street: from a to b along x (dir 'x') or z, fronts on the line `line`, facing `face` (+1 or -1 along the other axis)
// THE LOW ZONE (a rule of the plan): within 60 m behind the harbour wall nothing is built but stores and sheds of one low storey
// with flat roofs, 3.4 to 4.2 m high: lower than the wall's walk is high (6.5 m).
const LOW_ZONE_X = WALL_X0 - 60;
// THE AVENUE'S THREE STREETS (the square is the fourth stretch), each with its own walls (all invented): the low zone's stores
// in weathered creams and bare stone with dark dados; the lower street's shops limewashed white, cream and pale blue grey over
// red and ochre dados; the upper street's taller houses in white, rose, ochre and cream over painted dados of deep red, ochre
// and blue green. two: the share of houses with an upper floor; h: its height.
const STRETCH = {
  low: { tag: 'low', two: 0, h: [3.4, 4.2], stone: 0.3, walls: ['#ddd2ba', '#d2c4a4', '#cdb892', '#e2d8c2', '#c9bca4'].map(lin), dados: ['#70483a', '#6a4634', '#5c5148'].map(lin), dadoH: [0.5, 0.9], dadoMix: [0.25, 0.5] },
  lower: { tag: 'lower', two: 0.6, h: [6.0, 7.4], stone: 0.05, walls: ['#f1ece0', '#ebdfc6', '#d3dadb', '#f1ece0', '#e6d2b0'].map(lin), dados: ['#8c3b2c', '#b8842f', '#84503c'].map(lin), dadoH: [0.7, 1.1], dadoMix: [0.1, 0.3] },
  upper: { tag: 'upper', two: 1, h: [7.2, 9.2], stone: 0, walls: ['#f2ede2', '#e3bca6', '#e0bd7c', '#ecdfc4', '#f2ede2', '#d9c0a8'].map(lin), dados: ['#8f2f25', '#b9862c', '#3d7c79', '#8f2f25'].map(lin), dadoH: [1.0, 1.4], dadoMix: [0.03, 0.14] },
};
// o.D: a second buffer for a house's small things, which cast no shadow (sills, shutters, doors in their recesses, wares)
function houseRow(B, r, o) {
  const { a, b, line, face, dir, level } = o, turn = dir === 'x' ? (face > 0 ? 0 : Math.PI) : (face > 0 ? Math.PI / 2 : -Math.PI / 2);
  const list = [];
  let s = a;
  while (s < b - 3.5) {
    let w = r.range(o.wMin || 6, o.wMax || 10.5); if (b - (s + w) < 4.5) w = b - s;
    const c = s + w / 2, d = r.range(o.dMin || 9, o.dMax || 12.5), x = dir === 'x' ? c : line, z = dir === 'x' ? line : c;
    if (o.not && o.not(x, z)) { s += w; continue; }
    const low = x + (dir === 'x' ? w / 2 : 0) > LOW_ZONE_X, st = o.style ? STRETCH[low ? 'low' : x > SQ.x1 ? 'lower' : 'upper'] : null;
    const two = !low && r.chance(st ? st.two : o.two ?? 0.45), y = o.yAt(x, z), roofPick = r();
    const h = low ? r.range(3.4, 4.2) : two ? (st ? r.range(st.h[0], st.h[1]) : r.range(6.0, 9)) : r.range(4, 5.4), mixR = o.roofMix || [0.42, 0.8], roof = low || roofPick < mixR[0] ? 'flat' : roofPick < mixR[1] ? 'ridgeX' : 'ridgeZ';
    const wall = mul(r.pick(st ? st.walls : COL.plaster), r.range(0.93, 1.0)), stone = r.chance(st ? st.stone : low ? 0.3 : 0.08);
    const dadoH = st ? r.range(st.dadoH[0], st.dadoH[1]) : r.chance(0.2) ? 0.02 : r.range(0.45, 0.9), dadoMix = st ? r.range(st.dadoMix[0], st.dadoMix[1]) : r.range(0.2, 0.55);
    const spec = { w: w - 0.04, d, h, roof, wall: stone ? mul(COL.stone, r.range(0.92, 1)) : wall, stone, dadoH, dado: stone ? mul(COL.stoneDark, 0.9) : mix3(r.pick(st ? st.dados : COL.dado), wall, dadoMix), last: s + w >= b - 0.01, first: s <= a + 0.01, tile: mul(r.pick(COL.tile), r.range(0.9, 1.05)), level, turnCos: Math.cos(turn), x, y, z, turn, two, low, stretch: st ? st.tag : null };
    s += w;
    // the roofs' stream deals every house of the row its fourteen numbers, built or not
    const ro = o.roofs; if (ro) { spec.rk = []; for (let i = 0; i < 14; i++) spec.rk.push(ro.r()); }
    if (r.chance(o.skip || 0)) { list.push({ ...spec, gap: true }); continue; }
    if (ro && ro.rich && (low || !o.front) && spec.rk[12] < 0.3) { spec.yard2 = true; spec.d -= 3.4; }
    // (a store with a court keeps a front range of 3.4 m; the rest of its plot is the court: storeCourt)
    const ct = o.courts && low ? o.courts.find((q) => q.x >= x - w / 2 && q.x < x + w / 2) : null;
    if (ct) { spec.court = ct.kind; spec.dFull = spec.d + (spec.yard2 ? 3.4 : 0); spec.yard2 = false; spec.d = 3.4; }
    if (o.front) o.front(spec, r);
    const D = o.D || B; B.at(x, y, z, turn); if (D !== B) D.at(x, y, z, turn); house(B, spec, D); if (o.after) o.after(spec, r);
    if (ro) { ro.Bcl.at(x, y, z, turn); roofThings(B, D, ro.Bcl, spec, ro.perch, ro.rich); ro.Bcl.at(); }
    B.at(); if (D !== B) D.at();
    list.push(spec);
  }
  // A GABLE OVER A LOWER NEIGHBOUR (the avenue's rows): where a house stands 2.1 m and more above the roof of the house
  // next down the slope, its bare side wall carries a band at that roof's line and one or two shuttered windows under
  // its own eaves
  if (o.front) for (let i = 0; i + 1 < list.length; i++) {
    const p = list[i], n = list[i + 1], D = o.D || B; if (p.gap || n.gap) continue;
    const hn = n.y + n.h - p.y; if (p.h - hn < 2.1) continue;
    const sg = p.turnCos > 0 ? 1 : -1, c = Math.cos(p.turn), sn = Math.sin(p.turn), lx = sg * p.w / 2, lz = -p.d / 2, tim = p.door || COL.timber, two = p.d > 9;
    D.at(p.x + lx * c + lz * sn, p.y, p.z - lx * sn + lz * c, p.turn + sg * Math.PI / 2);
    D.box(-p.d / 2, hn + 0.08, 0, p.d / 2, hn + 0.24, 0.06, mul(p.wall, 0.86), SF.PLASTER, 'yYZ');
    for (let k = 0; k < (two ? 2 : 1); k++) {
      const wx = two ? (k ? 1 : -1) * p.d * 0.22 : 0, y0 = p.h - 1.75, y1 = p.h - 0.75;
      D.box(wx - 0.4, y0, 0, wx + 0.4, y1, 0.05, mul(tim, 0.9), SF.TIMBER, 'xXyYZ'); D.box(wx - 0.02, y0, 0.05, wx + 0.02, y1, 0.065, mul(tim, 0.5), SF.TIMBER, 'Z');
      D.box(wx - 0.52, y0 - 0.12, 0, wx + 0.52, y0, 0.1, mul(p.wall, 1.06), SF.PLASTER, 'xXyYZ'); D.box(wx - 0.5, y1, 0, wx + 0.5, y1 + 0.1, 0.07, mul(p.wall, 0.9), SF.PLASTER, 'xXyYZ');
    }
    D.at();
  }
  return list;
}

// a Doric column: tapered shaft with no base, a flared echinus and a square abacus; h is the whole height
function doric(B, x, z, y, h, r0, col, seg = 14) {
  const r1 = r0 * 0.78, hs = h - r0 * 0.9;
  B.cyl(x, z, r0, r1, y, y + hs, seg, col, SF.MARBLE, false);
  B.cyl(x, z, r1, r0 * 1.22, y + hs, y + hs + r0 * 0.42, seg, col, SF.MARBLE, false);
  B.box(x - r0 * 1.3, y + hs + r0 * 0.42, z - r0 * 1.3, x + r0 * 1.3, y + h, z + r0 * 1.3, col, SF.MARBLE, 'xXzZyY');
}

// Trees that read as trees: a trunk that shows, two or three limbs, and a crown of several uneven lumps of leaf with sky between
// them. The unevenness is a rule of the tree's own place (no stream): the same tree stands the same wherever it is seen from.
const hash2 = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
function leafLump(B, cx, cy, cz, rx, ry, rz, col, k, nu = 6, nv = 4) {
  B.grid(nu, nv, (u, v) => {
    const a = u * 6.2832, bb = (v - 0.5) * 3.0, r = 1 + 0.2 * Math.sin(3 * a + k * 7) * Math.cos(2 * bb + k * 3) + 0.1 * Math.sin(5 * a + k * 11);
    return [cx + rx * r * Math.cos(bb) * Math.cos(a), cy + ry * r * Math.sin(bb) * (bb < 0 ? 0.7 : 1), cz + rz * r * Math.cos(bb) * Math.sin(a)];
  }, (u, v) => mul(col, 0.62 + 0.62 * v), SF.LEAF, true);
}
// kind 0 a plane (tall pale trunk, broad crown), 1 a fig or an olive (short trunk, low spreading crown, grey green for the olive),
// 2 a fig; far: the same tree in fewer faces (three lumps of leaf, no limbs), for the hill and for the yards between the rows
function leafTree(B, x, y, z, h, tone, kind = 1, far = false) {
  const k0 = hash2(x, z), olive = kind === 1 && k0 > 0.5;
  const g = olive ? mix3([0.2, 0.25, 0.17], [0.27, 0.31, 0.22], tone) : mix3([0.11, 0.2, 0.06], [0.2, 0.27, 0.1], tone);
  const bark = kind === 0 ? [0.5, 0.46, 0.38] : [0.24, 0.19, 0.14], th = h * (kind === 0 ? 0.46 : 0.36), tr = kind === 0 ? h * 0.028 : h * 0.03;
  B.cyl(x, z, tr * 1.25, tr * 0.85, y - 0.4, y + th, 6, bark, SF.TIMBER, false);
  const n = kind === 0 ? 6 : far ? 3 : 4, R = h * (kind === 0 ? 0.3 : 0.34);
  for (let i = 0; i < n; i++) {
    const a = k0 * 6.28 + i / (n - 1) * 6.2832, top = i === n - 1, rad = top ? 0 : R * (0.55 + 0.3 * hash2(x + i, z)), lr = R * (top ? 0.8 : 0.52 + 0.22 * hash2(x, z + i));
    const cx = x + Math.cos(a) * rad, cz = z + Math.sin(a) * rad, cy = y + h - lr * (top ? 0.8 : 1.05 + 0.9 * hash2(x - i, z + 2 * i));
    if (!top && !far) B.beam([x, y + th * 0.92, z], [cx, cy - lr * 0.25, cz], tr * 0.9, bark, SF.TIMBER);
    if (far) leafLump(B, cx, cy, cz, lr * 1.3, lr * 0.9, lr * 1.3, mul(g, 0.92 + 0.2 * hash2(x + 3 * i, z - i)), k0 + i, 5, 3); else leafLump(B, cx, cy, cz, lr * 1.12, lr * 0.8, lr * 1.12, mul(g, 0.92 + 0.2 * hash2(x + 3 * i, z - i)), k0 + i);
  }
}
// a tree seen far: a cypress is one dark spindle, any other tree one round head of leaf down to the ground (an olive's
// grey green or a fig's, by its place)
function farTree(B, x, y, z, h, tone, cyp) {
  if (cyp) { const g = mul([0.085, 0.15, 0.07], 0.8 + 0.4 * tone), r = 0.075 * h + 0.25; B.cyl(x, z, r * 0.5, r, y, y + h * 0.3, 4, g, SF.LEAF, false); B.cyl(x, z, r, 0.03, y + h * 0.3, y + h, 4, mul(g, 1.08), SF.LEAF, false); return; }
  const k0 = hash2(x, z), g = k0 > 0.7 ? mix3([0.16, 0.21, 0.13], [0.21, 0.26, 0.17], tone) : mix3([0.08, 0.15, 0.05], [0.15, 0.22, 0.09], tone);
  const r = h * 0.44, a = k0 * 6.28;
  B.at(x, 0, z, a); B.cyl(0, 0, r * 0.55, r, y + h * 0.1, y + h * 0.5, 5, mul(g, 0.8), SF.LEAF, false); B.cyl(0, 0, r, r * 0.42, y + h * 0.5, y + h * 0.95, 5, mul(g, 1.12), SF.LEAF, true); B.at();
}
const CLOTHS = ['#d8cfb4', '#c4b890', '#b4543a', '#c99a3a', '#6b7f9c', '#cfc6ae'].map(lin);
// The avenue's fronts (all invented). front: before a house is built its openings are dealt: a strong door, a shop open to the
// street (about four houses in ten), small windows high up (shut, or open with the shutters folded back on the wall), on some
// upper floors a door onto a timber balcony, a yard behind (one in three). after: sills, lintels and shutters, the threshold
// stone, the string course, the shop's counter with its wares and its awning of plain cloth, the balcony, the yard's wall and
// tree, washing on a flat roof; and the places where somebody stands on a balcony or at a roof's parapet (perch).
function avenueFront(spec, r) {
  const w = spec.w, h = spec.h, open = [], wins = [], xa = -w / 2 + 0.75, xb = w / 2 - 0.75;
  spec.door = mul(COL.timber, r.range(1.3, 2.3));
  const dw = spec.low ? r.range(1.7, 2.3) : r.range(1.15, 1.5), dh = r.range(2.25, 2.6), fill = r.chance(0.3) ? 2 : 1;
  let dx = r.range(xa + dw / 2, xb - dw / 2), door = true;
  const st = spec.stretch, shopChance = st === 'lower' ? 1 : st === 'upper' ? 0.3 : 0.45;
  if (spec.low) {
    // a store of the low zone stands open to the street: one wide mouth, or two with the door between them; its goods inside
    // and before it (laid in avenueAfter); so no stretch of blank wall is longer than 6 m
    const mouths = [], top = r.range(2.55, 2.95);
    if (w >= 8.6) { dx = r.range(-0.5, 0.5); for (const sg of [-1, 1]) { const m0 = dx + sg * (dw / 2 + 0.6), m1 = sg * (w / 2 - 0.7); mouths.push([Math.min(m0, m1), Math.max(m0, m1)]); } }
    else { const mw = Math.min(w - 1.8, 4.6), left = r.chance(0.5), m0 = left ? -w / 2 + 0.7 : w / 2 - 0.7 - mw; mouths.push([m0, m0 + mw]); door = w - mw - 1.4 >= dw + 0.9; dx = left ? w / 2 - 0.6 - dw / 2 : -w / 2 + 0.6 + dw / 2; }
    spec.store = { mouths, top, goods: r.int(0, 3), cloth: r.chance(0.45) ? r.int(0, 5) : -1 };
    // THE SMITH'S SHADE (invented): the store at the corner of the first cross lane, on the south side
    if (spec.first && spec.z > 0 && spec.x > LANES[0]) { spec.store.smith = true; if (spec.store.cloth < 0) spec.store.cloth = 1; }
    for (const [m0, m1] of mouths) open.push([m0, m1, 0, top, 2.6, 4]);
  }
  if (!spec.low && w > (st === 'lower' ? 5.6 : 7.2) && r.chance(shopChance)) {
    const sw = r.range(2.6, Math.min(4.2, w - 3.7)), left = r.chance(0.5), sx = left ? -w / 2 + 0.7 + sw / 2 : w / 2 - 0.7 - sw / 2;
    dx = left ? w / 2 - 0.95 - dw / 2 : -w / 2 + 0.95 + dw / 2;
    spec.shop = { x: sx, w: sw, top: r.range(2.5, 2.8), tint: r.int(0, 5), goods: r.int(0, 2), gap: left ? 1 : -1 };
    open.push([sx - sw / 2, sx + sw / 2, 0, spec.shop.top, 2.3, 4]);
  }
  if (door) open.push([dx - dw / 2, dx + dw / 2, 0, dh, 0.4, fill]);
  if (spec.two) {
    // upstairs: a window every 2.2 to 3 m; on four houses in ten one of them is a door onto a balcony, or onto a gallery that
    // runs the house's whole width
    const n = clamp(Math.round(w / 2.6), 2, 4), bal = r.chance(st === 'upper' ? 0.8 : 0.4) ? r.int(0, n - 1) : -1, gallery = r.chance(st === 'upper' ? 0.5 : 0.35);
    for (let i = 0; i < n; i++) {
      const wx = clamp(-w / 2 + (i + 0.5) * w / n + r.range(-0.25, 0.25), xa + 0.5, xb - 0.5), shut = r.chance(0.4), ajar = r.chance(0.5), dye = r.chance(0.5) ? r.int(0, 5) : -1, bw = r.range(2.3, 3.1);
      if (i === bal) { spec.balcony = gallery ? { x: 0, w: w - 1.1, cloth: dye, door: wx } : { x: wx, w: bw, cloth: dye, door: wx }; open.push([wx - 0.5, wx + 0.5, 3.52, 5.5, 0.4, ajar ? 2 : 0]); }
      else wins.push([wx - 0.36, wx + 0.36, h - 2.45, h - 1.45, 0.3, shut ? 5 : 0]);
    }
    if (!spec.stone && r.chance(0.5)) spec.wall2 = mul(r.pick(COL.plaster), r.range(0.92, 1.0));
  } else if (!spec.low) {
    // a house of one floor: small windows high under the eaves, one to every 3 m of the front (the stream deals the first
    // one or two; the others take their small shifts from the house's own place)
    const n0 = r.chance(0.7) ? r.int(1, 2) : 0, n = Math.max(n0, clamp(Math.round(w / 3), 2, 3));
    for (let i = 0; i < n; i++) {
      const own = i < n0, wx = clamp(-w / 2 + (i + 0.5) * w / n + (own ? r.range(-0.4, 0.4) : 0.8 * hash2(spec.x, i + 3) - 0.4), xa + 0.4, xb - 0.4), shut = own ? r.chance(0.45) : hash2(spec.x + 7, i) < 0.45;
      if (open.some((o) => wx + 0.75 > o[0] && wx - 0.75 < o[1] && o[3] > h - 1.9)) continue;
      wins.push([wx - 0.3, wx + 0.3, h - 1.5, h - 0.92, 0.3, shut ? 5 : 0]);
    }
  }
  spec.wins = wins; spec.open = open.concat(wins); spec.plinth = r.range(0.3, 0.5);
  // a store in the low zone: half of them have a pent roof of tiles on timber posts along the front
  if (spec.low && r.chance(0.5) && !spec.store.smith) spec.pent = { out: r.range(1.6, 2.0), y: Math.min(h - 0.4, r.range(3.05, 3.35)) };
  // the plaster's own marks: one to three patches of newer or older limewash, and stone quoins at a block's end
  spec.patches = []; for (let i = 0, n = spec.stone ? 0 : r.int(1, 3); i < n; i++) { const pw = r.range(0.9, 2.4), ph = r.range(0.7, 1.8), px = r.range(-w / 2 + 0.3, w / 2 - 0.3 - pw), py = r.range(spec.dadoH + 0.2, Math.max(spec.dadoH + 0.3, h - ph - 0.6)); spec.patches.push([px, py, pw, ph, r.range(0.86, 1.07)]); }
  if (!spec.low && r.chance(0.34)) { spec.yard = { x: r.range(-w / 2 + 1.8, w / 2 - 1.8), cyp: r.chance(0.4), h: r.range(0, 1) }; spec.d -= 3.4; }
  // the house at a block's east end shows its side to the lane: small windows high up, as on the front
  if (spec.last) {
    const d = spec.d, so = [], n = spec.two ? Math.max(2, Math.round(d / 3.2)) : r.int(1, 2), turnE = Math.cos(spec.turn) > 0 ? 1 : -1;
    for (let i = 0; i < n; i++) { const wx = -d / 2 + (i + 0.5) * d / n + r.range(-0.4, 0.4), shut = r.chance(0.4); so.push(spec.two ? [wx - 0.36, wx + 0.36, h - 2.45, h - 1.45, 0.3, shut ? 5 : 0] : [wx - 0.3, wx + 0.3, h - 1.5, h - 0.92, 0.3, shut ? 5 : 0]); }
    if (spec.two) { const dx = r.range(-d / 2 + 2, d / 2 - 2), dw2 = r.range(1.1, 1.4); so.push([dx - dw2 / 2, dx + dw2 / 2, 0, r.range(2.2, 2.5), 0.4, r.chance(0.3) ? 2 : 1]); for (const sg of [-1, 1]) { const wx = dx + sg * r.range(2.4, 3.4); if (Math.abs(wx) < d / 2 - 1) so.push([wx - 0.3, wx + 0.3, 1.9, 2.5, 0.3, r.chance(0.5) ? 5 : 0]); } }
    spec.side = { sg: turnE, open: so };
    // (the upper street's other corner house, at the lane further up, has the lesser things on its side: the door's jambs,
    // steps and garland, the painted band, the garlands from window to window)
    if (spec.stretch === 'upper') { if (spec.x > LANES[2] - 14) squareSide(spec); else spec.side.sq = { door: so.find((o) => o[2] === 0), lesser: true }; }
  }
}
// THE SQUARE'S WEST FRONTS (ours): the corner house at the head of the upper street, on each hand, shows its whole side to
// the square, and that side is a front of its own. Its door (dealt with the side's windows) has stone jambs, two steps
// down to the square's paving and a garland; one upstairs window is a door onto a timber balcony with two people at
// its rail (the upstairs window nearest the avenue's corner); in the free stretch of wall nearest that corner (2.3 m
// and more) a shop opens, under an awning or under the balcony, its goods on the counter and before it; garlands hang
// from window to window, and a painted band runs along the wall over the dado. No stream is drawn on: the places follow
// from what the side was dealt (squareSide), the rest is built in squareSideAfter.
function squareSide(spec) {
  const d = spec.d, so = spec.side.open, door = so.find((o) => o[2] === 0), ups = so.filter((o) => o[2] > 3), fc = -spec.side.sg * d / 2, mid = (o) => (o[0] + o[1]) / 2;
  if (!door || !ups.length) return;
  // (fc: the wall's end at the avenue's corner; the balcony and the shop keep to that end, which the way passes close by)
  const up = ups.reduce((p, q) => Math.abs(mid(q) - fc) < Math.abs(mid(p) - fc) ? q : p), wx = mid(up), bx = clamp(wx, -d / 2 + 1.75, d / 2 - 1.75);
  up[0] = wx - 0.5; up[1] = wx + 0.5; up[2] = 3.52; up[3] = 5.5; up[4] = 0.4; up[5] = 2;
  const sq = spec.side.sq = { door, bx, bw: 2.6 };
  const S = [[-d / 2 + 0.8, door[0] - 0.7], [door[1] + 0.7, d / 2 - 0.8]].filter((q) => q[1] - q[0] >= 2.3).sort((p, q) => Math.abs(mid(p) - fc) - Math.abs(mid(q) - fc));
  if (S.length) {
    const F = S[0], sw = Math.min(3.4, F[1] - F[0]), a = fc < 0 ? F[0] : F[1] - sw, b = a + sw;
    for (let i = so.length - 1; i >= 0; i--) if (so[i][2] > 0.1 && so[i][2] < 3 && so[i][1] > a - 0.5 && so[i][0] < b + 0.5) so.splice(i, 1);
    so.push([a, b, 0, 2.6, 2.3, 4]); sq.shop = [a, b, 2.6]; sq.awning = !(b + 0.4 > bx - 1.3 && a - 0.4 < bx + 1.3);
  }
}
function squareSideAfter(B, D, Bcl, spec, perch) {
  const { w, d } = spec, sd = spec.side, sq = sd.sq, sg = sd.sg, tc = spec.door, wall = spec.wall, st = mul(COL.stone, 0.96), c = Math.cos(spec.turn), sn = Math.sin(spec.turn);
  const lx = sg * w / 2, lz = -d / 2, Ox = spec.x + lx * c + lz * sn, Oz = spec.z - lx * sn + lz * c, th = spec.turn + sg * Math.PI / 2, cs = Math.cos(th), ss = Math.sin(th);
  const world = (x, y, z) => [Ox + x * cs + z * ss, spec.y + y, Oz - x * ss + z * cs], gy = (x, z) => avenueY(Ox + x * cs + z * ss) - spec.y, ph = spec.x * 0.7 + 2, hk = (i) => hash2(spec.x + i * 1.7, spec.z + 3.3);
  for (const q of [B, D, Bcl]) q.at(Ox, spec.y, Oz, th);
  // the door: jambs, two steps, a garland with its tails
  { const [a, b, , top] = sq.door, g0 = gy(0, 0.2), ya = top + 0.44;
    for (const [ja, jb] of [[a - 0.17, a], [b, b + 0.17]]) D.box(ja, g0 - 0.2, 0, jb, top, 0.045, st, SF.ASHLAR, 'xXZ');
    D.box(a - 0.25, g0 - 0.3, 0, b + 0.25, -0.01, 0.4, st, SF.ASHLAR, 'xXYZ'); D.box(a - 0.45, g0 - 0.3, 0.4, b + 0.45, g0 * 0.5, 0.8, mul(st, 0.95), SF.ASHLAR, 'xXYZ');
    leafSwag(D, [a - 0.2, ya, 0.13], [b + 0.2, ya, 0.13], 0.2, 5, 1);
    for (const x of [a - 0.2, b + 0.2]) D.beam([x, ya + 0.04, 0.12], [x, top - 0.34, 0.12], 0.16, mul(GARLAND, 0.9), SF.LEAF, 0.13); }
  // the shop: its counter and what lies on it, the awning on its struts, baskets and jars before it
  if (sq.shop) {
    const [a, b, top] = sq.shop, left = (a + b) / 2 < (sq.door[0] + sq.door[1]) / 2, ca = left ? a + 0.05 : a + 0.85, cb = left ? b - 0.85 : b - 0.05, goods = Math.floor(hk(1) * 2.99), tint = Math.floor(hk(2) * 5.99), g0 = gy(0, 0.5);
    for (const [ja, jb] of [[a - 0.17, a], [b, b + 0.17]]) D.box(ja, g0 - 0.2, 0, jb, top, 0.045, st, SF.ASHLAR, 'xXZ');
    D.box(ca, -0.6, -0.5, cb, 0.92, -0.06, mul(wall, 0.86), SF.PLASTER, 'xXzZ'); D.box(ca - 0.04, 0.92, -0.56, cb + 0.04, 1.0, -0.02, tc, SF.TIMBER, 'xXzZY');
    for (let x = ca + 0.3, i = 0; x < cb - 0.2; x += 0.4 + 0.2 * hk(i + 5), i++) {
      if (goods === 0) { D.cyl(x, -0.28, 0.07, 0.15, 1.0, 1.2, 6, CLAY, SF.BRONZE, false); D.cyl(x, -0.28, 0.15, 0.07, 1.2, 1.42, 6, CLAY, SF.BRONZE); }
      else if (goods === 1) D.cyl(x, -0.28, 0.15, 0.2, 1.0, 1.16, 7, i % 2 ? STRAW : mul(STRAW, 0.8), SF.BRONZE, true);
      else D.box(x - 0.16, 1.0, -0.46, x + 0.16, 1.1 + 0.06 * (i % 3), -0.1, CLOTHS[(i + tint) % CLOTHS.length], SF.CLOTH, 'xXzZY');
    }
    const col = CLOTHS[tint], y0 = top + 0.95, y1 = top + 0.2, out = 1.9, ax = a - 0.3, bx = b + 0.3;
    // (the awning where the balcony does not stand over the shop: there the balcony is its roof)
    if (sq.awning) {
      Bcl.grid(4, 2, (u, v) => [lerp(ax, bx, u), lerp(y0, y1, v) - 0.1 * Math.sin(u * Math.PI) * v, 0.03 + out * v], col, SF.CLOTH, false, (u, v) => [0.03 + 0.11 * v, ph + u * 3 + v]);
      for (const x of [ax + 0.05, bx - 0.05]) B.beam([x, top - 0.35, 0.04], [x, y1 + 0.02, out], 0.07, tc, SF.TIMBER);
      B.beam([ax, y1 + 0.03, out], [bx, y1 + 0.03, out], 0.06, tc, SF.TIMBER);
    }
    const ex = left ? a - 0.75 : b + 0.75;
    for (let i = 0; i < 3; i++) D.cyl(ex + (i - 1) * 0.5 * (left ? -1 : 1) * 0.9, 0.42 + 0.1 * (i % 2), 0.2, 0.27, gy(0, 0.45) - 0.03, gy(0, 0.45) + 0.34, 7, i % 2 ? STRAW : mul(STRAW, 0.78), SF.BRONZE, true);
    for (let i = 0; i < 2; i++) amphora(D, (left ? b - 0.3 : a + 0.3) + (left ? -1 : 1) * 0.0 + (i ? 0.42 : 0) * (left ? -1 : 1), gy(0, 0.4) - 0.03, 0.36, 1.0 + 0.1 * i, mul(CLAY, 0.85 + 0.1 * i));
  }
  // the balcony: a floor of planks on three braces, posts, a rail and a middle bar, a cloth over the rail, pots of green,
  // and two at the rail looking down into the square
  if (!sq.lesser) { const bx = sq.bx, a = bx - sq.bw / 2, b = bx + sq.bw / 2, fy = 3.4, out = 1.05, rail = fy + 1.07, tim = mul(tc, 1.1);
    B.box(a, fy, 0, b, fy + 0.12, out, tim, SF.TIMBER, 'xXyYZ');
    for (let i = 0; i < 3; i++) { const x = a + 0.12 + i * (sq.bw - 0.24) / 2; B.beam([x, fy - 0.8, 0.03], [x, fy - 0.03, out - 0.14], 0.09, tim, SF.TIMBER); }
    for (const x of [a + 0.05, b - 0.05]) { B.beam([x, fy + 0.12, out - 0.05], [x, rail, out - 0.05], 0.08, tim, SF.TIMBER); B.beam([x, rail, 0.02], [x, rail, out - 0.05], 0.07, tim, SF.TIMBER); }
    B.beam([a, rail, out - 0.05], [b, rail, out - 0.05], 0.08, tim, SF.TIMBER); B.beam([a, fy + 0.62, out - 0.05], [b, fy + 0.62, out - 0.05], 0.05, tim, SF.TIMBER);
    Bcl.grid(2, 2, (u, v) => [lerp(a + 0.2, a + 1.2, u), rail + 0.05 - 0.9 * v, out + 0.01], CLOTHS[2 + Math.floor(hk(3) * 2.99)], SF.CLOTH, false, (u, v) => [0.02 + 0.06 * v, ph + u * 2 + v]);
    for (let i = 0; i < 2; i++) { const x = b - 0.3 - 0.5 * i; D.cyl(x, out - 0.3, 0.1, 0.15, fy + 0.12, fy + 0.36, 6, mul(CLAY, 0.9), SF.BRONZE, false); D.cyl(x, out - 0.3, 0.2, 0.05, fy + 0.36, fy + 0.72 + 0.1 * i, 5, [0.13, 0.24, 0.09], SF.LEAF, true); }
    for (let i = 0; i < 2; i++) { const p = world(bx - 0.35 + 0.8 * i, fy + 0.12, 0.6); perch.push({ x: p[0], y: p[1], z: p[2], face: Math.atan2(cs, ss) + (i ? -0.35 : 0.3) }); } }
  // the painted band over the dado, between the door and the shop, with a pale line over it
  { const dd = spec.dadoH, band = sg > 0 ? lin('#3d7c79') : lin('#b9862c'), gr = sd.open.filter((o) => o[2] < 0.1).sort((p, q) => p[0] - q[0]), edges = [-d / 2, ...gr.flatMap((o) => [o[0] - 0.17, o[1] + 0.17]), d / 2];
    for (let i = 0; i < edges.length; i += 2) { const ga = edges[i], gb = edges[i + 1]; if (gb - ga < 0.2) continue;
      D.quad([ga, dd + 0.04, 0.012], [gb, dd + 0.04, 0.012], [gb, dd + 0.36, 0.012], [ga, dd + 0.36, 0.012], band, SF.PLASTER, mul(band, 1.08));
      D.quad([ga, dd + 0.36, 0.012], [gb, dd + 0.36, 0.012], [gb, dd + 0.42, 0.012], [ga, dd + 0.42, 0.012], mul(wall, 1.1), SF.PLASTER); } }
  // garlands from window to window upstairs, where the balcony does not stand between
  { const ws = sd.open.filter((o) => o[2] > 3 && o[5] !== 2).sort((p, q) => p[0] - q[0]);
    for (let i = 0; i + 1 < ws.length; i++) {
      const xa = ws[i][1] + 0.1, xb = ws[i + 1][0] - 0.1, ys = ws[i][2] - 0.16, sag = clamp(0.17 * (xb - xa), 0.22, 0.6);
      if (xb - xa < 0.9 || xb - xa > 5.5 || (!sq.lesser && sq.bx + sq.bw / 2 + 0.2 > xa && sq.bx - sq.bw / 2 - 0.2 < xb)) continue;
      leafSwag(D, [xa, ys, 0.13], [xb, ys, 0.13], sag, clamp(Math.round((xb - xa) / 0.36), 4, 9), i);
    } }
  for (const q of [B, D, Bcl]) q.at(spec.x, spec.y, spec.z, spec.turn);
}
// A GARLAND'S SWAG (invented): from a to b, hanging `sag` m at its middle, of n leaf tufts: short bunches, thick and thin,
// light and dark by turns, each tilted a little across the swag's line and lapping over its neighbours, with a sprig
// hanging at every other joint
const GARLAND = [0.12, 0.23, 0.08];
function leafSwag(D, a, b, sag, n, k = 0) {
  const at = (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - 4 * sag * t * (1 - t), lerp(a[2], b[2], t)];
  for (let i = 0; i < n; i++) {
    const fat = (i + k) % 2 === 0, p = at(Math.max(0, (i - 0.15) / n)), q = at(Math.min(1, (i + 1.15) / n)), tilt = fat ? 0.03 : -0.03;
    p[1] += tilt; q[1] -= tilt;
    D.beam(p, q, fat ? 0.23 : 0.17, mul(GARLAND, fat ? 1.15 : 0.82), SF.LEAF, fat ? 0.21 : 0.15, false);
    if (i > 0 && !fat) { const j = at(i / n); D.beam([j[0], j[1] - 0.03, j[2]], [j[0], j[1] - 0.27, j[2]], 0.11, mul(GARLAND, 0.7), SF.LEAF, 0.1, false); }
  }
}
function avenueAfter(B, D, Bcl, spec, r, rp, perch) {
  const w = spec.w, h = spec.h, tc = spec.door, phase = spec.x * 0.7, wall = spec.wall, tc_ = Math.cos(spec.turn), ts_ = Math.sin(spec.turn), fall = -0.0885 * tc_;
  const world = (lx, ly, lz) => [spec.x + lx * tc_ + lz * ts_, spec.y + ly, spec.z - lx * ts_ + lz * tc_];
  const stand = (lx, ly, lz, turn, kind) => { const q = world(lx, ly, lz); perch.push({ x: q[0], y: q[1], z: q[2], face: Math.atan2(tc_, ts_) + turn, kind }); };
  if (spec.two) D.box(-w / 2, 3.3, 0, w / 2, 3.45, 0.07, mul(wall, 0.9), SF.PLASTER, 'yYZ');
  // patches of other limewash where no opening is; stone quoins up the corner of a block's end
  for (const [px, py, pw, ph, k] of spec.patches) {
    if (spec.open.some((o) => px < o[1] + 0.25 && px + pw > o[0] - 0.25 && py < o[3] + 0.25 && py + ph > o[2] - 0.25) || (spec.two && py < 3.5 && py + ph > 3.25)) continue;
    const c = mul(py > 3.4 && spec.wall2 ? spec.wall2 : wall, k); D.quad([px, py, 0.012], [px + pw, py, 0.012], [px + pw, py + ph, 0.012], [px, py + ph, 0.012], c, SF.PLASTER, mul(c, 0.97));
  }
  if (!spec.stone && (spec.first || spec.last)) {
    const sg = (spec.first ? -1 : 1) * (tc_ > 0 ? 1 : -1), q = mul(COL.stone, 0.97);
    for (let y = -0.6, i = 0; y < h - 0.5; y += 0.44, i++) { const len = i % 2 ? 0.62 : 0.36, a = sg > 0 ? w / 2 - len : -w / 2, b = sg > 0 ? w / 2 : -w / 2 + len; D.box(a, y, 0, b, y + 0.4, 0.035, i % 2 ? q : mul(q, 0.93), SF.ASHLAR, sg > 0 ? 'XZ' : 'xZ'); }
  }
  if (spec.store) {
    // the store's goods before its mouths: jars, baulks of timber, coils of rope with bales of sail cloth, or sacks; and on
    // some an awning of plain cloth on two poles
    const so = spec.store, tim = mul(COL.timber, 1.5), HEMP = [0.5, 0.41, 0.24], SAIL = [0.74, 0.7, 0.6], BAULK = [0.44, 0.32, 0.19];
    so.mouths.forEach(([m0, m1], mi) => {
      const kind = (so.goods + mi) % 4, side = mi % 2 ? m1 - 0.2 : m0 + 0.2, sg = mi % 2 ? -1 : 1, gy = (x) => fall * x - 0.05;
      if (so.smith && mi === 0) {
        // the hearth before the mouth's east end, its coals bright; the anvil on its stump under the cloth; a quenching
        // trough; tongs and hammers on the wall; the smith at the anvil and his man at the hearth
        const hx = m0 + 0.75, ax = Math.min(m1 - 0.8, m0 + 2.9), st = mul(COL.stone, 0.82), iron = [0.07, 0.07, 0.08];
        D.box(hx - 0.55, gy(hx) - 0.2, 0.15, hx + 0.55, gy(hx) + 0.8, 1.0, st, SF.ASHLAR, 'xXzZ'); D.box(hx - 0.55, gy(hx) + 0.8, 0.15, hx + 0.55, gy(hx) + 0.86, 1.0, mul(st, 0.7), SF.ASHLAR, 'xXzZY');
        D.box(hx - 0.36, gy(hx) + 0.86, 0.32, hx + 0.36, gy(hx) + 0.93, 0.84, [2.6, 0.75, 0.16], SF.BRONZE, 'xXzZY');
        D.cyl(ax, 0.72, 0.24, 0.21, gy(ax), gy(ax) + 0.55, 7, mul(COL.timber, 1.5), SF.TIMBER); D.box(ax - 0.3, gy(ax) + 0.55, 0.62, ax + 0.3, gy(ax) + 0.75, 0.82, iron, SF.BRONZE, 'xXzZY');
        D.box(ax + 0.75, gy(ax) - 0.1, 0.3, ax + 1.45, gy(ax) + 0.42, 0.75, st, SF.ASHLAR, 'xXzZ'); D.box(ax + 0.83, gy(ax) + 0.36, 0.37, ax + 1.37, gy(ax) + 0.38, 0.68, [0.1, 0.2, 0.24], SF.BRONZE, 'Y');
        for (let k = 0; k < 4; k++) { const x = m0 - 0.5 + 0.11 * k; D.box(x, 1.25 + 0.07 * (k % 2), 0.005, x + 0.045, 1.95, 0.05, iron, SF.BRONZE, 'xXyYZ'); }
        stand(ax - 0.62, fall * (ax - 0.62), 0.74, -Math.PI / 2, 1); stand(hx + 1.0, fall * (hx + 1.0), 0.3, Math.PI / 2, 1);
        perch.smith = world(hx, gy(hx) + 1.0, 0.58);
      } else if (kind === 0) for (let k = 0; k < 6; k++) { const x = side + sg * (0.3 + 0.44 * (k % 3)), z = 0.35 + 0.46 * Math.floor(k / 3); amphora(D, x, gy(x), z, 1.05 + 0.1 * (k % 2), mul(CLAY, 0.82 + 0.1 * (k % 3))); }
      else if (kind === 1) for (let k = 0; k < 5; k++) { const z = 0.3 + 0.27 * (k % 3) + (k > 2 ? 0.13 : 0), y = gy(side) + (k > 2 ? 0.25 : 0); D.box(Math.min(side, side + sg * 2.9), y, z, Math.max(side, side + sg * 2.9), y + 0.24, z + 0.24, mul(BAULK, 0.9 + 0.06 * k), SF.TIMBER, 'xXYzZ'); }
      else if (kind === 2) {
        for (let k = 0; k < 3; k++) { const x = side + sg * 0.5, y = gy(x) + 0.17 * k; D.cyl(x, 0.6, 0.42 - 0.03 * k, 0.42 - 0.03 * k, y, y + 0.16, 9, mul(HEMP, 0.9 + 0.08 * k), SF.CLOTH, k === 2); }
        for (let k = 0; k < 3; k++) { const x = side + sg * (1.35 + 0.05 * k), y = gy(x) + 0.3 * k; D.box(x - 0.45, y, 0.25, x + 0.45, y + 0.29, 1.0 - 0.06 * k, mul(SAIL, 0.94 + 0.05 * k), SF.CLOTH, 'xXYzZ'); }
      } else for (let k = 0; k < 5; k++) { const x = side + sg * (0.35 + 0.62 * (k % 3)) + (k > 2 ? sg * 0.3 : 0), y = gy(x) + (k > 2 ? 0.3 : 0); D.box(x - 0.29, y, 0.2, x + 0.29, y + 0.31, 0.78, mul(SACK, 0.88 + 0.07 * k), SF.CLOTH, 'xXzZY'); }
      if (so.cloth >= 0 && !spec.pent) {
        const out = 1.9, y0 = so.top + 0.5, y1 = so.top - 0.15, col = CLOTHS[(so.cloth + mi) % CLOTHS.length], c0 = so.smith && mi === 0 ? m0 + 1.7 : m0 - 0.2;
        Bcl.grid(3, 2, (u, v) => [lerp(c0, m1 + 0.2, u), lerp(y0, y1, v) - 0.1 * Math.sin(u * Math.PI) * v, 0.03 + out * v], col, SF.CLOTH, false, (u, v) => [0.03 + 0.1 * v, phase + mi + u * 3 + v]);
        for (const x of [c0 + 0.05, m1 + 0.15]) B.beam([x, fall * x - 0.3, out], [x, y1 + 0.02, out], 0.08, tim, SF.TIMBER);
      }
    });
  }
  // every door and every shop's mouth has its frame: a timber lintel, two jambs of dressed stone under it; a door has its
  // threshold stone
  for (const [a, b, y0, top] of spec.open) if (y0 < 0.1) {
    D.box(a - 0.25, top, 0, b + 0.25, top + 0.2, 0.06, tc, SF.TIMBER, 'xXyYZ');
    for (const [ja, jb] of [[a - 0.17, a], [b, b + 0.17]]) D.box(ja, -0.6, 0, jb, top, 0.045, mul(COL.stone, 0.96), SF.ASHLAR, 'xXZ');
    if (b - a < 2.4) D.box(a - 0.12, -0.6, 0, b + 0.12, 0.07, 0.34, mul(COL.stone, 0.93), SF.ASHLAR, 'xXYZ');
  }
  // THE FESTIVAL'S GARLANDS ON THE FRONTS (invented; none on the stores of the low zone): a swag from window to window,
  // hung under the sills' near ends, wherever no door or balcony stands between the two; and over every house door a swag
  // from corner to corner of its frame, with a tail of leaves down each jamb
  if (!spec.low) {
    const ws = spec.wins.slice().sort((p, q) => p[0] - q[0]), others = spec.open.filter((o) => !spec.wins.includes(o));
    for (let i = 0; i + 1 < ws.length; i++) {
      const xa = ws[i][1] + 0.1, xb = ws[i + 1][0] - 0.1, ys = ws[i][2] - 0.16, sag = clamp(0.17 * (xb - xa), 0.22, 0.6);
      if (xb - xa < 0.9 || xb - xa > 5 || others.some((o) => o[0] < xb + 0.2 && o[1] > xa - 0.2 && o[3] > ys - sag - 0.3)) continue;
      leafSwag(D, [xa, ys, 0.13], [xb, ys, 0.13], sag, clamp(Math.round((xb - xa) / 0.36), 4, 9), i);
    }
    for (const [a, b, y0, top, , fill] of spec.open) if (y0 < 0.1 && fill !== 4) {
      const ya = top + 0.44; leafSwag(D, [a - 0.2, ya, 0.13], [b + 0.2, ya, 0.13], 0.2, 5, 1);
      for (const x of [a - 0.2, b + 0.2]) D.beam([x, ya + 0.04, 0.12], [x, top - 0.34, 0.12], 0.16, mul(GARLAND, 0.9), SF.LEAF, 0.13);
    }
  }
  // the plinth course between the doors; and against some free stretches of wall, on the paving (which falls 0.0885 a metre to
  // the east): jars, baskets, sacks or a bench
  // (the stretches of wall are the older deal's: an opening of the upper street's fuller hand, marked by its seventh
  // number, does not count as an edge; the plinth and the band stop at such a mouth)
  const gr = spec.open.filter((o) => o[2] < 0.1 && !o[6]).sort((p, q) => p[0] - q[0]), edges = [-w / 2, ...gr.flatMap((o) => [o[0] - 0.14, o[1] + 0.14]), w / 2];
  const mouths = spec.open.filter((o) => o[2] < 0.1 && o[6]);
  for (let i = 0; i < edges.length; i += 2) {
    const ga = edges[i], gb = edges[i + 1]; if (gb - ga < 0.2) continue;
    const pieces = mouths.reduce((list, o) => list.flatMap(([pa, pb]) => (o[1] + 0.14 <= pa || o[0] - 0.14 >= pb ? [[pa, pb]] : [[pa, o[0] - 0.14], [o[1] + 0.14, pb]].filter((q) => q[1] - q[0] > 0.2))), [[ga, gb]]);
    for (const [pa, pb] of pieces) {
      D.box(pa, -1.2, 0, pb, spec.plinth, 0.07, mul(spec.dado, 0.9), spec.stone ? SF.ASHLAR : SF.PLASTER, 'xXYZ');
      // (the upper street: on half of its fronts a painted band runs over the dado, blue green, ochre or red by the house's place)
      if (spec.stretch === 'upper' && !spec.stone && hash2(spec.x * 0.53, 7.7) < 0.5) { const bc = [lin('#3d7c79'), lin('#b9862c'), lin('#8f2f25')][Math.floor(hash2(spec.x, 1.9) * 2.99)], y0 = spec.dadoH + 0.04; D.quad([pa, y0, 0.016], [pb, y0, 0.016], [pb, y0 + 0.24, 0.016], [pa, y0 + 0.24, 0.016], bc, SF.PLASTER, mul(bc, 1.08)); }
    }
    const kind = r.int(0, 3), cx = r.range(ga + 0.9, Math.max(ga + 0.9, gb - 0.9)), gy = fall * cx, m = r.int(2, 4);
    if (gb - ga < 2.2 || spec.pent || !r.chance(0.5) || spec.stretch === 'lower') continue;
    (spec.foot || (spec.foot = [])).push(cx);
    if (kind === 0) for (let k = 0; k < m; k++) amphora(D, cx + (k - (m - 1) / 2) * 0.43, gy - 0.05, 0.3 + 0.08 * (k % 2), 0.95 + 0.1 * (k % 3), mul(CLAY, 0.85 + 0.12 * (k % 3)));
    else if (kind === 1) for (let k = 0; k < m; k++) D.cyl(cx + (k - (m - 1) / 2) * 0.56, 0.36, 0.2, 0.26, gy - 0.05, gy + 0.32, 7, k % 2 ? STRAW : mul(STRAW, 0.78), SF.BRONZE, true);
    else if (kind === 2) for (let k = 0; k < m; k++) D.box(cx + (k - (m - 1) / 2) * 0.62 - 0.29, gy - 0.05 + (k === 1 ? 0.3 : 0), 0.1, cx + (k - (m - 1) / 2) * 0.62 + 0.29 - (k === 1 ? 0.62 : 0), gy + 0.31 + (k === 1 ? 0.3 : 0), 0.62, mul(SACK, 0.9 + 0.1 * k), SF.CLOTH, 'xXzZY');
    else { D.box(cx - 0.8, gy + 0.36, 0.1, cx + 0.8, gy + 0.45, 0.52, mul(tc, 1.3), SF.TIMBER, 'xXyYzZ'); for (const bx of [cx - 0.68, cx + 0.68]) D.box(bx - 0.06, gy - 0.3, 0.12, bx + 0.06, gy + 0.36, 0.5, mul(COL.stone, 0.9), SF.ASHLAR, 'xXzZ'); }
  }
  if (spec.pent) {
    const out = spec.pent.out, py = spec.pent.y, tim = mul(COL.timber, 1.4);
    for (let x = -w / 2 + 0.4; x <= w / 2 - 0.39; x += (w - 0.8) / Math.max(2, Math.round(w / 2.8))) B.beam([x, -0.6, out - 0.15], [x, py - 0.5, out - 0.15], 0.12, tim, SF.TIMBER);
    B.beam([-w / 2 + 0.2, py - 0.44, out - 0.15], [w / 2 - 0.2, py - 0.44, out - 0.15], 0.12, tim, SF.TIMBER);
    B.quad([-w / 2 + 0.1, py - 0.4, out + 0.2], [w / 2 - 0.1, py - 0.4, out + 0.2], [w / 2 - 0.1, py + 0.1, 0.02], [-w / 2 + 0.1, py + 0.1, 0.02], spec.tile, SF.TILE_X);
    B.quad([w / 2 - 0.1, py - 0.46, out + 0.2], [-w / 2 + 0.1, py - 0.46, out + 0.2], [-w / 2 + 0.1, py + 0.04, 0.02], [w / 2 - 0.1, py + 0.04, 0.02], [0.42, 0.33, 0.22], SF.TIMBER);
    for (let x = -w / 2 + 1.2, k = 0; x < w / 2 - 1; x += r.range(0.9, 2.2), k++) { if (gr.some((o) => x > o[0] - 0.5 && x < o[1] + 0.5)) continue; if (k % 3 === 0) amphora(D, x, fall * x - 0.05, 0.4, 1.05, mul(CLAY, 0.9)); else if (k % 3 === 1) D.box(x - 0.3, fall * x - 0.05, 0.15, x + 0.3, fall * x + 0.3, 0.75, SACK, SF.CLOTH, 'xXzZY'); else D.cyl(x, 0.45, 0.24, 0.3, fall * x - 0.05, fall * x + 0.38, 7, STRAW, SF.BRONZE, true); }
  }
  if (spec.shop) {
    const sp = spec.shop, a = sp.x - sp.w / 2, b = sp.x + sp.w / 2, ca = sp.gap > 0 ? a + 0.05 : a + 0.85, cb = sp.gap > 0 ? b - 0.85 : b - 0.05;
    D.box(ca, -0.6, -0.5, cb, 0.92, -0.06, mul(wall, 0.86), SF.PLASTER, 'xXzZ'); D.box(ca - 0.04, 0.92, -0.56, cb + 0.04, 1.0, -0.02, tc, SF.TIMBER, 'xXzZY');
    for (let x = ca + 0.3, i = 0; x < cb - 0.2; x += r.range(0.38, 0.6), i++) {
      if (sp.goods === 0) { D.cyl(x, -0.28, 0.07, 0.15, 1.0, 1.2, 6, CLAY, SF.BRONZE, false); D.cyl(x, -0.28, 0.15, 0.07, 1.2, 1.42, 6, CLAY, SF.BRONZE); }
      else if (sp.goods === 1) D.cyl(x, -0.28, 0.15, 0.2, 1.0, 1.16, 7, i % 2 ? STRAW : mul(STRAW, 0.8), SF.BRONZE, true);
      else D.box(x - 0.16, 1.0, -0.46, x + 0.16, 1.1 + 0.06 * (i % 3), -0.1, CLOTHS[(i + sp.tint) % CLOTHS.length], SF.CLOTH, 'xXzZY');
    }
    const col = CLOTHS[sp.tint], y0 = sp.top + 0.95, y1 = sp.top + 0.12, out = spec.stretch === 'lower' ? 2.9 : 2.45, ax = a - 0.3, bx = b + 0.3;
    // THE AWNING AND THE BALCONY (r8; ONE RULE FOR BOTH STREETS, the lower as the upper). The shop and the balcony
    // are dealt apart and neither asked where the other stands: until r8 the cloth ran from the wall (3.45 to 3.75 m
    // up) through the balcony's floor (planks 3.40 to 3.52 m up, 1.05 m out) wherever the two spans met along the
    // wall. Now the cloth is cut round the floor, by the floor's place alone (no stream is asked, nothing dealt after
    // moves), always as ONE sheet of four columns as ever (16 triangles, never more):
    //   where the awning's span comes no nearer than 0.15 m to a floor's end: the one sheet from the wall, to the
    //     letter as it was (0.15 m: the clear air the new shops' rule keeps between an awning and a balcony);
    //   before the floor: the cloth hangs from the floor's front edge as the upper street's new shops have it (1.07 m
    //     out and 3.38 m up: 2 cm before the planks' face and 2 cm under them; the 3 cm stir of a cloth's top edge
    //     goes along the sheet's own normal, up and outward or down and inward, never up and inward into the
    //     planks; up there no wider than the floor less 5 cm at each end) out to the old outer edge;
    //   beside the floor: the cloth climbs to the wall as before, 0.15 m clear of the floor's end, where 0.6 m and
    //     more of the awning is left there; less would be a rag on the wall, and the hung cloth widens to the
    //     awning's end instead. The two are one cloth, slit beside the floor's end from the wall out to the floor's
    //     front (see ONE SHEET below): no open air stands between them and the stir cannot part them;
    //   where the floor stands over so little of the awning that the hung cloth's top would be under 0.3 m (at 5 cm
    //     of floor it would close to a point: a sheet with no slope to take its light from), or stands only within
    //     0.15 m of the awning's end, nothing hangs: the sheet from the wall is drawn back 0.15 m clear of the
    //     floor's end, and the bar's end stands bare there.
    // The outer edge with its sag, the bar, the struts, the dye and the stir stay where they were.
    const bl = spec.balcony, fa = bl ? bl.x - bl.w / 2 : 0, fb = bl ? bl.x + bl.w / 2 : 0, la = fa - 0.15, lb = fb + 0.15;
    if (!bl || !(ax < lb && bx > la)) Bcl.grid(4, 2, (u, v) => [lerp(ax, bx, u), lerp(y0, y1, v) - 0.12 * Math.sin(u * Math.PI) * v, 0.03 + out * v], col, SF.CLOTH, false, (u, v) => [0.03 + 0.11 * v, phase + u * 3 + v]);
    else {
      // a leaf: its outer edge p..q lies on the old outer edge (U: how far along the old sheet, for the sag and the
      // stir's phase); its top edge s..t on the wall, or (hung) on the floor's front edge
      const leaf = (p, q, s, t, hung) => Bcl.grid(4, 2, (u, v) => { const xo = lerp(p, q, u), U = (xo - ax) / (bx - ax); return [lerp(lerp(s, t, u), xo, v), lerp(hung ? 3.38 : y0, y1, v) - 0.12 * Math.sin(U * Math.PI) * v, lerp(hung ? 1.07 : 0.03, 0.03 + out, v)]; },
        col, SF.CLOTH, false, (u, v) => [0.03 + 0.11 * v, phase + (lerp(p, q, u) - ax) / (bx - ax) * 3 + v]);
      const ta = Math.max(ax, fa + 0.05), tb = Math.min(bx, fb - 0.05);
      // (a floor that leaves no 0.3 m for a hung leaf stands over one end of the awning only: a balcony is 2.3 m wide and more)
      if (tb - ta < 0.3) { if (fa + 0.05 > ax) leaf(ax, la, ax, la, false); else leaf(lb, bx, lb, bx, false); }
      else {
        // (the cloth climbs to the wall at one end only, the end where more of the awning is left: four columns
        // cannot pay for a slit at both; no awning had 0.6 m at both ends on seeds 1 to 1000)
        const L = la - ax >= 0.6 && la - ax >= bx - lb, R = !L && bx - lb >= 0.6;
        if (!L && !R) leaf(ax, bx, ta, tb, true);
        else {
          // ONE SHEET, SLIT BESIDE THE FLOOR. (Two leaves that shared only the bar's corner stood open between: a
          // wedge 0.2 m wide and up to 0.33 m high at the floor's front, closing to nought at the bar; and the stir
          // parted them at that corner too, each going along its own normal.) Five lines run from the top to the
          // bar, in order along the wall from the wall's end of the awning (end) to the other (far): two on the
          // wall, at the awning's end and 0.15 m clear of the floor's end (inn); the slit's end, which is the
          // point of that second line's own place 1.07 m out, as far out as the floor's front edge (the cloth is
          // slit from the wall to there, the clear air beside the floor's end; from there to the bar it is whole);
          // and two on the floor's front edge, at the hung cloth's corners. Between the slit's end and the floor's
          // corner the cloth rises as a gusset: all of it lies 1.07 m out and more, before the planks' face. The
          // bar is met at its two ends, under the slit, and midway between (/ 2), so that the sag keeps five points.
          // (The lines are counted from the end where the cloth climbs to the wall, on either hand, so that one
          // awning is the other's mirror to the triangle: counted from the far end, the cut of the grid's cells in
          // two would leave one triangle beside the slit without area.)
          // A line: [where its top stands along the wall, hung or on the wall, how far down its run it begins, where it meets the bar]
          const end = L ? ax : bx, inn = L ? la : lb, far = L ? bx : ax, slit = (1.07 - 0.03) / out;
          const K = [[end, false, 0, end], [inn, false, 0, (end + inn) / 2], [inn, false, slit, inn], [L ? ta : tb, true, 0, (inn + far) / 2], [L ? tb : ta, true, 0, far]];
          // a point of line k, v of the way from its top to the bar: [x, y, z, V: how far down the line's whole run, U: how far along the old sheet]
          const pt = (k, v) => { const [xt, hung, t, xo] = K[k], V = lerp(t, 1, v), U = (xo - ax) / (bx - ax); return [lerp(xt, xo, V), lerp(hung ? 3.38 : y0, y1, V) - 0.12 * Math.sin(U * Math.PI) * V, lerp(hung ? 1.07 : 0.03, 0.03 + out, V), V, U]; };
          // (the sheet between the lines: the grid's four columns are the four spaces between the five, so 4 and its last column 3)
          const sheet = (u, v) => { const k = Math.min(3, Math.floor(u * 4)), f = u * 4 - k, p = pt(k, v), q = pt(k + 1, v); return p.map((c, i) => lerp(c, q[i], f)); };
          Bcl.grid(4, 2, sheet, col, SF.CLOTH, false, (u, v) => { const p = sheet(u, v); return [0.03 + 0.11 * p[3], phase + p[4] * 3 + p[3]]; });
        }
      }
    }
    for (const x of [ax + 0.05, bx - 0.05]) B.beam([x, sp.top - 0.35, 0.04], [x, y1 + 0.02, out], 0.07, tc, SF.TIMBER);
    B.beam([ax, y1 + 0.03, out], [bx, y1 + 0.03, out], 0.06, tc, SF.TIMBER);
  }
  if (spec.balcony) {
    // a timber balcony on braces: a floor of planks, two posts, a rail and a middle bar; sometimes a cloth over the rail
    const bx = spec.balcony.x, bw = spec.balcony.w, a = bx - bw / 2, b = bx + bw / 2, fy = 3.4, out = 1.05, rail = fy + 1.07, tim = mul(tc, 1.1);
    B.box(a, fy, 0, b, fy + 0.12, out, tim, SF.TIMBER, 'xXyYZ');
    for (let x = a + 0.12; x <= b - 0.11; x += (bw - 0.24) / Math.max(2, Math.round(bw / 1.6))) B.beam([x, fy - 0.8, 0.03], [x, fy - 0.03, out - 0.14], 0.09, tim, SF.TIMBER);
    for (const x of [a + 0.05, b - 0.05]) { B.beam([x, fy + 0.12, out - 0.05], [x, rail, out - 0.05], 0.08, tim, SF.TIMBER); B.beam([x, rail, 0.02], [x, rail, out - 0.05], 0.07, tim, SF.TIMBER); }
    B.beam([a, rail, out - 0.05], [b, rail, out - 0.05], 0.08, tim, SF.TIMBER); B.beam([a, fy + 0.62, out - 0.05], [b, fy + 0.62, out - 0.05], 0.05, tim, SF.TIMBER);
    for (let x = a + 2.6; x < b - 2; x += 2.6) B.beam([x, fy + 0.12, out - 0.05], [x, rail, out - 0.05], 0.07, tim, SF.TIMBER);
    if (spec.balcony.cloth >= 0) Bcl.grid(2, 2, (u, v) => [lerp(bx - 0.75, bx + 0.35, u), rail + 0.05 - 0.9 * v, out + 0.01], CLOTHS[spec.balcony.cloth], SF.CLOTH, false, (u, v) => [0.02 + 0.06 * v, phase + u * 2 + v]);
    // pots of green on the balcony's floor in the upper street
    if (spec.stretch === 'upper') for (let x = a + 0.3, i = 0; x < b - 0.25; x += 0.75 + 0.5 * ((i * 7) % 3), i++) { if (Math.abs(x - spec.balcony.door) < 0.6) continue; D.cyl(x, out - 0.3, 0.1, 0.15, fy + 0.12, fy + 0.36, 6, mul(CLAY, 0.9), SF.BRONZE, false); D.cyl(x, out - 0.3, 0.2, 0.05, fy + 0.36, fy + 0.72 + 0.1 * (i % 2), 5, [0.13, 0.24, 0.09], SF.LEAF, true); }
    if (rp.chance(0.75)) stand(bx + rp.range(0.3, bw / 2 - 0.45), fy + 0.12, 0.6, rp.range(-0.5, 0.5));
  }
  if (spec.yard) {
    const z0 = -spec.d - 3.4, z1 = -spec.d;
    yardWalls(B, w, z0, z1, wall);
    if (spec.yard.cyp) cypress(B, spec.yard.x, 0.4, (z0 + z1) / 2, 8 + 3.5 * spec.yard.h, spec.yard.h); else leafTree(B, spec.yard.x, 0.4, (z0 + z1) / 2, 5.6 + 2.6 * spec.yard.h, spec.yard.h, 1);
  }
  if (spec.side && spec.side.sq && spec.side.sq.door) squareSideAfter(B, D, Bcl, spec, perch);
  if (spec.roof === 'flat' && !spec.low) {
    // a roof used as a terrace: washing on a line, somebody at the parapet looking down into the street
    const t = h - 0.45;
    if (r.chance(0.34)) {
      const xa = -w * 0.3, xb = w * 0.3, y = t + 2.0, z = -2.6; spec.wash = true;
      for (const x of [xa, xb]) B.beam([x, t, z], [x, y + 0.08, z], 0.07, COL.timber, SF.TIMBER);
      for (let x = xa + 0.3, i = 0; x < xb - 0.9; i++) { const cw = r.range(0.7, 1.3), ch = r.range(0.7, 1.2), col = CLOTHS[r.int(0, 5)], xs = x; Bcl.grid(1, 2, (u, v) => [xs + cw * u, y - ch * v, z], col, SF.CLOTH, false, (u, v) => [0.02 + 0.1 * v, phase + i * 1.3 + v * 2]); x += cw + r.range(0.1, 0.5); }
    }
    if (rp.chance(0.4)) { const x = rp.range(-w / 2 + 1, w / 2 - 1.6), n = rp.int(1, 2); for (let i = 0; i < n; i++) stand(x + 0.75 * i, t, -0.62, rp.range(-0.45, 0.45)); }
  }
}

// THE UPPER STREET'S FULLER HAND (r7; ours, all invented; the kinds are the avenue's own from lower down: a shop's mouth
// with its counter, wares and awning, small shuttered windows, cloth, jars, baskets, sacks, a bench). Every front of the
// upper street (the avenue's two blocks above the square, on both hands) takes sixteen numbers from its row's own NEW
// stream ('upper-street:' and the row's name; no older stream is drawn on, so every older thing stands as it stood),
// used or not, and by them and by the front's own place, side and storey:
//   GROUND STOREY. A front that was dealt no shop opens one where a free stretch of wall is 2.6 m and more (free:
//   0.7 m in from the front's ends and 0.7 m off every dealt opening), in eight fronts of ten: in the longest such
//   stretch that is clear of the front's balcony, else in the longest: there, under a balcony or gallery that covers
//   the whole mouth, the awning hangs from the floor's front edge on two poles; under one that covers a part of it,
//   no awning but a valance of the shop's cloth from the floor's edge. A mouth of up to
//   3.8 m in that stretch's middle, its counter and wares as the lower street's, its awning on two poles 1.9 m out (the
//   low zone's kind: the poles stand between the foot way's standers, 4.75 m from the axis, and the walkers' third
//   line, 3.55 m) or on struts 2.0 m out (its edge 4.0 m from the axis: outside that line), by turns of the deal. Every other free stretch of 1.7 m and more has a small
//   window high in its middle (1.9 to 2.5 m up, as the lane sides have), shut or open.
//   UPPER STOREY. From an open window a long dyed cloth hangs under the sill (five in ten), or a drying pole stands
//   out 1.55 m over the foot way with two cloths on it (three in ten), or a pot of green stands on the sill; under a
//   shut window a cloth hangs in five of ten. A cloth ends above whatever stands under it (a balcony's rail, an
//   awning, the storey's course); where less than 0.7 m is left there is none; no pole stands out over a balcony.
// upperAfter builds these and, by the front's place alone (no stream): a course of plaster along the upper windows'
// sills; one painted line more to every front (a frieze under the storey's course on the fronts that carry no band
// over the dado, a band under the sills' course on those that do); a painted frame round every house door; and at
// the wall's foot in each stretch the older deal left bare a set of jars, baskets, sacks or a bench (nothing of it
// further than 0.8 m from the wall: the standers' line is 1.25 m out).
function upperFront(spec, r) {
  const k = []; for (let i = 0; i < 16; i++) k.push(r());
  const w = spec.w, more = spec.more = { k, wins: [], cloths: [], poles: [], pots: [], shop: null };
  const gr = spec.open.filter((o) => o[2] < 0.1).sort((p, q) => p[0] - q[0]), free = [], len = (q) => q[1] - q[0];
  let a = -w / 2 + 0.7;
  for (const o of gr) { if (o[0] - 0.7 > a) free.push([a, o[0] - 0.7]); a = Math.max(a, o[1] + 0.7); }
  if (w / 2 - 0.7 > a) free.push([a, w / 2 - 0.7]);
  const door = gr.find((o) => o[5] !== 4), bal = spec.balcony;
  // (a stretch is under the balcony when the awning of a mouth in its middle would meet the balcony's floor)
  const underBal = (F) => { if (!bal) return false; const hw = Math.min(3.8, len(F)) / 2 + 0.3, sx = (F[0] + F[1]) / 2; return sx - hw < bal.x + bal.w / 2 + 0.15 && sx + hw > bal.x - bal.w / 2 - 0.15; };
  if (!spec.shop && free.length && k[0] < 0.8) {
    const wide = free.filter((q) => len(q) >= 2.6), clear = wide.filter((q) => !underBal(q)), longest = (list) => list.reduce((p, q) => (len(q) > len(p) ? q : p));
    if (wide.length) {
      const F = longest(clear.length ? clear : wide), sw = Math.min(3.8, len(F)), sx = (F[0] + F[1]) / 2, top = 2.5 + 0.3 * k[1];
      // (awn 1: on the wall; 2: from the front edge of a balcony that covers the whole mouth, always on poles; 0: none)
      const awn = clear.length ? 1 : bal.x - bal.w / 2 <= sx - sw / 2 && bal.x + bal.w / 2 >= sx + sw / 2 ? 2 : 0;
      more.shop = { x: sx, w: sw, top, tint: Math.floor(k[2] * 5.99), goods: Math.floor(k[3] * 2.99), gap: door && (door[0] + door[1]) / 2 < sx ? -1 : 1, poles: k[4] < 0.5 || awn === 2, awn };
      // (the seventh number marks an opening of the fuller hand: the older deal's stretches of wall do not count it)
      spec.open.push([sx - sw / 2, sx + sw / 2, 0, top, 2.3, 4, 1]);
      free.splice(free.indexOf(F), 1);
    }
  }
  free.forEach((F, i) => {
    if (len(F) < 1.7 || i > 2) return;
    const wx = (F[0] + F[1]) / 2, win = [wx - 0.3, wx + 0.3, 1.9, 2.5, 0.3, k[5 + i] < 0.5 ? 5 : 0, 1];
    more.wins.push(win); spec.open.push(win);
  });
  // upstairs: what hangs from each dealt window (floor: the height its cloth must end above)
  const shops = [spec.shop, more.shop].filter(Boolean);
  spec.wins.forEach((win, j) => {
    if (j > 3) return;
    const wx = (win[0] + win[1]) / 2, sill = win[2], u = k[8 + j], open = win[5] === 0, tint = Math.floor(k[12 + j] * 4.99);
    const overBal = bal && wx > bal.x - bal.w / 2 - 0.5 && wx < bal.x + bal.w / 2 + 0.5, overShop = shops.find((s) => wx > s.x - s.w / 2 - 0.7 && wx < s.x + s.w / 2 + 0.7);
    const floor = overBal ? 4.72 : overShop ? overShop.top + 1.2 : 3.7, room = sill - 0.09 - floor;
    if (u < 0.5) { if (room >= 0.7) more.cloths.push({ x: wx, y: sill - 0.09, len: Math.min(room, 1.5 + 0.9 * k[12 + j]), tint, ph: j }); }
    else if (open && u < 0.8) { if (!overBal && room >= 0.5) more.poles.push({ x: wx, y: sill + 0.12, len: Math.min(room + 0.2, 1.3), tint, ph: j }); }
    else if (open) more.pots.push({ x: wx, y: sill });
  });
}
function upperAfter(B, D, Bcl, spec) {
  const more = spec.more, k = more.k, w = spec.w, tc = spec.door, wall = spec.wall, phase = spec.x * 0.7 + 1.3, fall = -0.0885 * Math.cos(spec.turn), tim = mul(COL.timber, 1.5);
  const hk = (i) => hash2(spec.x + i * 1.7, spec.z + 5.9);
  if (more.shop) {
    // the new shop: its counter across the mouth but for the way in, what it sells on the counter, two baskets or jars
    // set out at the jamb away from the way in, and its awning
    const sp = more.shop, a = sp.x - sp.w / 2, b = sp.x + sp.w / 2, ca = sp.gap > 0 ? a + 0.05 : a + 0.85, cb = sp.gap > 0 ? b - 0.85 : b - 0.05;
    D.box(ca, -0.6, -0.5, cb, 0.92, -0.06, mul(wall, 0.86), SF.PLASTER, 'xXzZ'); D.box(ca - 0.04, 0.92, -0.56, cb + 0.04, 1.0, -0.02, tc, SF.TIMBER, 'xXzZY');
    for (let x = ca + 0.3, i = 0; x < cb - 0.2; x += 0.4 + 0.2 * hk(i + 5), i++) {
      if (sp.goods === 0) { D.cyl(x, -0.28, 0.07, 0.15, 1.0, 1.2, 6, CLAY, SF.BRONZE, false); D.cyl(x, -0.28, 0.15, 0.07, 1.2, 1.42, 6, CLAY, SF.BRONZE); }
      else if (sp.goods === 1) { D.cyl(x, -0.28, 0.15, 0.2, 1.0, 1.16, 7, i % 2 ? STRAW : mul(STRAW, 0.8), SF.BRONZE, false); D.cyl(x, -0.28, 0.19, 0.05, 1.14, 1.27, 6, FRUIT[(i + sp.tint) % 4], SF.BRONZE); }
      else D.box(x - 0.16, 1.0, -0.46, x + 0.16, 1.1 + 0.06 * (i % 3), -0.1, STALL_DYES[(i + sp.tint) % 5], SF.CLOTH, 'xXzZY');
    }
    // (none where the older deal set its own jars, sacks or bench at the wall's foot within 1.8 m of their place)
    const ex = sp.gap > 0 ? a + 0.45 : b - 0.45, gy = fall * ex - 0.04, setOut = !(spec.foot || []).some((q) => Math.abs(q - (ex + 0.26 * sp.gap)) < 1.8);
    for (let i = 0; i < 2 && setOut; i++) {
      const x = ex + (i ? 0.52 : 0) * sp.gap;
      if (sp.goods === 0) amphora(D, x, gy, 0.34 + 0.1 * i, 1.0 + 0.1 * i, mul(CLAY, 0.85 + 0.12 * i));
      else { D.cyl(x, 0.4 + 0.1 * i, 0.2, 0.27, gy, gy + 0.34, 7, i ? STRAW : mul(STRAW, 0.78), SF.BRONZE, false); D.cyl(x, 0.4 + 0.1 * i, 0.26, 0.06, gy + 0.32, gy + 0.47, 6, sp.goods === 1 ? FRUIT[(i + sp.tint + 1) % 4] : STALL_DYES[(i + sp.tint + 2) % 5], SF.BRONZE); }
    }
    const col = CLOTHS[sp.tint], y0 = sp.top + 0.95, ax = a - 0.3, bx = b + 0.3, out = sp.poles ? 1.9 : 2.0, y1 = sp.top + (sp.poles ? 0.3 : 0.2);
    if (sp.awn) {
      // (under a balcony or gallery that covers the whole mouth the awning hangs from the floor's front edge, 1.07 m
      // out and 3.38 m up, no wider than the floor)
      const fl = sp.awn === 2, bl = spec.balcony, va = fl ? Math.max(ax, bl.x - bl.w / 2 + 0.05) : ax, vb = fl ? Math.min(bx, bl.x + bl.w / 2 - 0.05) : bx, z0 = fl ? 1.07 : 0.03, ya = fl ? 3.38 : y0;
      Bcl.grid(4, 2, (u, v) => [lerp(va, vb, u), lerp(ya, y1, v) - 0.11 * Math.sin(u * Math.PI) * v, lerp(z0, out + 0.03, v)], col, SF.CLOTH, false, (u, v) => [0.03 + 0.1 * v, phase + u * 3 + v]);
      if (sp.poles) for (const x of [va + 0.05, vb - 0.05]) B.beam([x, fall * x - 0.3, out], [x, y1 + 0.02, out], 0.08, tim, SF.TIMBER);
      else for (const x of [va + 0.05, vb - 0.05]) B.beam([x, sp.top - 0.35, 0.04], [x, y1 + 0.02, out], 0.07, tc, SF.TIMBER);
      B.beam([va, y1 + 0.03, out], [vb, y1 + 0.03, out], 0.06, sp.poles ? tim : tc, SF.TIMBER);
    } else {
      // under a balcony that covers a part of the mouth only, the mouth takes no awning: a valance of the shop's
      // cloth, cut in points, hangs from the floor's front edge where the floor is over the mouth
      const bl = spec.balcony, va = Math.max(ax, bl.x - bl.w / 2 + 0.1), vb = Math.min(bx, bl.x + bl.w / 2 - 0.1);
      if (vb - va > 1) Bcl.grid(6, 1, (u, v) => [lerp(va, vb, u), 3.4 - (0.4 + 0.07 * Math.cos(u * 6 * Math.PI)) * v, 1.07], col, SF.CLOTH, false, (u, v) => [0.02 + 0.06 * v, phase + u * 3 + v]);
    }
  }
  windowTrim(D, more.wins, wall, tc);
  // upstairs: the long cloths under the sills (each on a rod), the drying poles with their two cloths, the pots
  for (const c of more.cloths) {
    const col = STALL_DYES[c.tint];
    D.beam([c.x - 0.38, c.y, 0.1], [c.x + 0.38, c.y, 0.1], 0.04, tim, SF.TIMBER);
    Bcl.grid(1, 4, (u, v) => [c.x - 0.31 + 0.62 * u, c.y - 0.02 - c.len * v, 0.12], (u, v) => (v > 0.99 ? mul(col, 0.6) : mul(col, 0.92 + 0.16 * (Math.round(v * 4) % 2))), SF.CLOTH, false, (u, v) => [0.01 + 0.07 * v * v, phase + c.ph * 1.7 + v * 2.2 + u]);
  }
  for (const p of more.poles) {
    D.beam([p.x, p.y, -0.05], [p.x, p.y + 0.18, 1.55], 0.05, tim, SF.TIMBER);
    for (let i = 0; i < 2; i++) {
      const z0 = 0.28 + 0.66 * i, ln = p.len * (i ? 0.78 : 1), col = STALL_DYES[(p.tint + i * 2) % 5], yr = (z) => p.y + 0.18 * (z + 0.05) / 1.6 - 0.03;
      Bcl.grid(2, 3, (u, v) => [p.x, yr(z0 + 0.56 * u) - ln * v, z0 + 0.56 * u], (u, v) => (v > 0.99 ? mul(col, 0.6) : mul(col, 0.92 + 0.16 * (Math.round(v * 3) % 2))), SF.CLOTH, false, (u, v) => [0.015 + 0.1 * v * v, phase + p.ph * 2.1 + i * 1.3 + v * 2 + u]);
    }
  }
  for (const p of more.pots) { D.cyl(p.x, 0.02, 0.09, 0.13, p.y, p.y + 0.2, 6, mul(CLAY, 0.9), SF.BRONZE, false); D.cyl(p.x, 0.02, 0.18, 0.05, p.y + 0.2, p.y + 0.52, 5, [0.13, 0.24, 0.09], SF.LEAF, true); }
  // by the front's own place: the frieze under the storey's course where no band runs over the dado; a painted frame
  // round every house door (the frieze's or the band's colour)
  if (!spec.stone) {
    const bc = [lin('#3d7c79'), lin('#b9862c'), lin('#8f2f25')][Math.floor(hash2(spec.x, 1.9) * 2.99)], z = 0.014;
    const dadoBand = hash2(spec.x * 0.53, 7.7) < 0.5, ys = spec.wins.length ? spec.wins[0][2] - 0.08 : 0, wall2 = spec.wall2 || wall;
    if (!dadoBand) { D.quad([-w / 2, 3.04, z], [w / 2, 3.04, z], [w / 2, 3.3, z], [-w / 2, 3.3, z], bc, SF.PLASTER, mul(bc, 1.08)); D.quad([-w / 2, 2.98, z], [w / 2, 2.98, z], [w / 2, 3.04, z], [-w / 2, 3.04, z], mul(wall, 1.1), SF.PLASTER); }
    // (the sills' course stops at an opening that stands across its height: a balcony's door)
    if (ys) {
      const cross = spec.open.filter((o) => o[2] < ys + 0.08 && o[3] > ys - 0.3).sort((p, q) => p[0] - q[0]), xs = [-w / 2, ...cross.flatMap((o) => [o[0] - 0.18, o[1] + 0.18]), w / 2];
      for (let i = 0; i < xs.length; i += 2) {
        const pa = xs[i], pb = xs[i + 1]; if (pb - pa < 0.2) continue;
        D.box(pa, ys, 0, pb, ys + 0.075, 0.05, mul(wall2, 1.06), SF.PLASTER, 'xXyYZ');
        if (dadoBand) D.quad([pa, ys - 0.28, z], [pb, ys - 0.28, z], [pb, ys, z], [pa, ys, z], bc, SF.PLASTER, mul(bc, 1.08));
      }
    }
    for (const [a, b, y0, top, , fill, added] of spec.open) if (y0 < 0.1 && fill !== 4 && !added) {
      const ya = spec.dadoH + 0.3;
      for (const [fa, fb] of [[a - 0.33, a - 0.17], [b + 0.17, b + 0.33]]) D.quad([fa, ya, z], [fb, ya, z], [fb, top + 0.2, z], [fa, top + 0.2, z], bc, SF.PLASTER);
      D.quad([a - 0.33, top + 0.2, z], [b + 0.33, top + 0.2, z], [b + 0.33, top + 0.36, z], [a - 0.33, top + 0.36, z], bc, SF.PLASTER);
    }
  }
  // the wall's foot: in each stretch between the ground storey's openings that the older deal left bare (spec.foot: the
  // places it filled), jars, baskets, sacks or a bench in the stretch's middle; a long stretch has two sets
  const gr = spec.open.filter((o) => o[2] < 0.1).sort((p, q) => p[0] - q[0]), edges = [-w / 2 + 0.3, ...gr.flatMap((o) => [o[0] - 0.45, o[1] + 0.45]), w / 2 - 0.3], old = spec.foot || [];
  for (let i = 0, n = 0; i < edges.length; i += 2) {
    const ga = edges[i], gb = edges[i + 1]; if (gb - ga < 1.3) continue;
    for (const cx of gb - ga > 4 ? [lerp(ga, gb, 0.27), lerp(ga, gb, 0.73)] : [(ga + gb) / 2]) {
      if (old.some((q) => Math.abs(q - cx) < 2.1)) continue;
      const dealt = Math.floor(k[14 + (n % 2)] * 3.99 + n) % 4, kind = dealt === 2 && gb - ga < 3 ? 1 : dealt, gy = fall * cx - 0.04; n++;
      if (kind === 0) for (let j = 0; j < 3; j++) amphora(D, cx + (j - 1) * 0.43, gy, 0.3 + 0.08 * (j % 2), 0.95 + 0.1 * (j % 3), mul(CLAY, 0.85 + 0.12 * (j % 3)));
      else if (kind === 1) for (let j = 0; j < 3; j++) { const x = cx + (j < 2 ? (j - 0.5) * 0.58 : 0.05), y = gy + (j < 2 ? 0 : 0.36); D.cyl(x, 0.38, 0.2, 0.26, y, y + 0.36, 7, j % 2 ? STRAW : mul(STRAW, 0.78), SF.BRONZE, true); }
      else if (kind === 2) { D.box(cx - 0.8, gy + 0.4, 0.1, cx + 0.8, gy + 0.49, 0.52, mul(tc, 1.3), SF.TIMBER, 'xXyYzZ'); for (const bx of [cx - 0.68, cx + 0.68]) D.box(bx - 0.06, gy - 0.3, 0.12, bx + 0.06, gy + 0.4, 0.5, mul(COL.stone, 0.9), SF.ASHLAR, 'xXzZ'); amphora(D, cx + 1.08, gy, 0.3, 0.9, mul(CLAY, 0.9)); }
      else for (let j = 0; j < 3; j++) { const x = cx + (j < 2 ? (j - 0.5) * 0.64 : 0), y = gy + (j < 2 ? 0 : 0.31); D.box(x - 0.29, y, 0.1, x + 0.29, y + 0.32, 0.64, mul(SACK, 0.9 + 0.08 * j), SF.CLOTH, 'xXzZY'); }
    }
  }
  if (spec.side && spec.side.sq && spec.side.sq.lesser) laneSideMore(D, Bcl, spec);
}

// THE LAST CROSS LANE'S WEST WALLS (r7; ours): the lane sides of the two corner houses above the lane at x 100 are the
// walls the way looks at as it comes up to that lane. By the side's own place (no stream is drawn on): the sills'
// course and a painted band under it; under six upper windows in ten a long dyed cloth, on an open one's sill else a
// pot of green; a painted frame round the side's door; a bench against the wall beyond the door (where 2.6 m of wall
// are free and the fountain does not stand) and jars and a basket toward the avenue's corner (where the door's steps
// are 2.6 m and more from it and the fountain does not stand there). Nothing stands further than 0.6 m from the
// wall: the lane's walkers' nearest line is 1.4 m out.
function laneSideMore(D, Bcl, spec) {
  const sd = spec.side, { w, d } = spec, sg = sd.sg, wall = spec.wall, wall2 = spec.wall2 || wall, tc = spec.door, c = Math.cos(spec.turn), sn = Math.sin(spec.turn);
  const lx = sg * w / 2, lz = -d / 2, Ox = spec.x + lx * c + lz * sn, Oz = spec.z - lx * sn + lz * c, th = spec.turn + sg * Math.PI / 2, cs = Math.cos(th), ss = Math.sin(th);
  const gy = (x) => avenueY(Ox + x * cs + 0.3 * ss) - spec.y, hk = (i) => hash2(spec.x + i * 2.3, spec.z + 8.1), ph = spec.x * 0.7 + 4, z = 0.014, tim = mul(COL.timber, 1.5);
  const bc = [lin('#3d7c79'), lin('#b9862c'), lin('#8f2f25')][Math.floor(hash2(spec.x, 1.9) * 2.99)], ups = sd.open.filter((o) => o[2] > 3).sort((p, q) => p[0] - q[0]);
  for (const q of [D, Bcl]) q.at(Ox, spec.y, Oz, th);
  if (ups.length) {
    const ys = ups[0][2] - 0.08;
    D.box(-d / 2, ys, 0, d / 2, ys + 0.075, 0.05, mul(wall2, 1.06), SF.PLASTER, 'yYZ');
    if (!spec.stone) D.quad([-d / 2, ys - 0.28, z], [d / 2, ys - 0.28, z], [d / 2, ys, z], [-d / 2, ys, z], bc, SF.PLASTER, mul(bc, 1.08));
    ups.forEach((o, i) => {
      const wx = (o[0] + o[1]) / 2, y = o[2] - 0.09;
      if (hk(i) < 0.6) {
        const col = STALL_DYES[Math.floor(hk(i + 4) * 4.99)], len = Math.min(y - 3.7, 1.3 + 0.8 * hk(i + 9));
        D.beam([wx - 0.38, y, 0.1], [wx + 0.38, y, 0.1], 0.04, tim, SF.TIMBER);
        Bcl.grid(1, 4, (u, v) => [wx - 0.31 + 0.62 * u, y - 0.02 - len * v, 0.12], (u, v) => (v > 0.99 ? mul(col, 0.6) : mul(col, 0.92 + 0.16 * (Math.round(v * 4) % 2))), SF.CLOTH, false, (u, v) => [0.01 + 0.07 * v * v, ph + i * 1.7 + v * 2.2 + u]);
      } else if (o[5] === 0) { D.cyl(wx, 0.02, 0.09, 0.13, o[2], o[2] + 0.2, 6, mul(CLAY, 0.9), SF.BRONZE, false); D.cyl(wx, 0.02, 0.18, 0.05, o[2] + 0.2, o[2] + 0.52, 5, [0.13, 0.24, 0.09], SF.LEAF, true); }
    });
  }
  const door = sd.sq.door, F = laneFountainAt(spec), north = spec.z < 0, fx = F.fc + sg * F.t;
  if (door && !spec.stone) {
    const [a, b, , top] = door, ya = spec.dadoH + 0.44;
    for (const [fa, fb] of [[a - 0.33, a - 0.17], [b + 0.17, b + 0.33]]) D.quad([fa, ya, z], [fb, ya, z], [fb, top + 0.2, z], [fa, top + 0.2, z], bc, SF.PLASTER);
    D.box(a - 0.33, top, 0, b + 0.33, top + 0.2, 0.06, tc, SF.TIMBER, 'xXyYZ');
    D.quad([a - 0.33, top + 0.2, z], [b + 0.33, top + 0.2, z], [b + 0.33, top + 0.36, z], [a - 0.33, top + 0.36, z], bc, SF.PLASTER);
  }
  if (door) {
    // (along the wall from the avenue's corner: the far end is d metres on)
    const far = d - 0.5 - F.tb, xb = F.fc + sg * (F.tb + 1.75), xj = F.fc + sg * 1.3;
    if (far >= 2.6 && !(north && Math.abs(fx - xb) < 2)) {
      const g = gy(xb); D.box(xb - 0.8, g + 0.4, 0.1, xb + 0.8, g + 0.49, 0.52, mul(tc, 1.3), SF.TIMBER, 'xXyYzZ');
      for (const bx of [xb - 0.68, xb + 0.68]) D.box(bx - 0.06, g - 0.3, 0.12, bx + 0.06, g + 0.4, 0.5, mul(COL.stone, 0.9), SF.ASHLAR, 'xXzZ');
    }
    if (F.ta >= 2.6 + 0.65 && !(north && Math.abs(fx - xj) < 1.8)) {
      const g = gy(xj) - 0.03;
      for (let i = 0; i < 2; i++) amphora(D, xj + sg * (i * 0.44 - 0.5), g, 0.3 + 0.08 * i, 1.0 + 0.1 * i, mul(CLAY, 0.85 + 0.12 * i));
      D.cyl(xj + sg * 0.5, 0.36, 0.2, 0.27, g, g + 0.36, 7, STRAW, SF.BRONZE, true);
    }
  }
  for (const q of [D, Bcl]) q.at(spec.x, spec.y, spec.z, spec.turn);
}
// THE UPPER STREET'S WALL FOUNTAIN (r7; ours, invented; the lower street's corner fountain stands 1.6 m into its lane, and
// so does this): on the lane side of the corner house west of the last cross lane, north of the avenue, a stone basin
// against the wall under a spout stone with a bronze spout, 1.6 m from the avenue's corner where the side's door (its
// jambs and steps, 0.65 m to each hand) leaves the wall free, else before the door's near step where that is 1.5 m and
// more from the corner, else beyond the door. The basin stands 0.56 m out from the wall; the lane's walkers' nearest line is 1.4 m out.
// (where on a lane side the fountain stands: t metres from the avenue's corner; ta, tb: the door's near and far edge)
function laneFountainAt(spec) {
  const sd = spec.side, sg = sd.sg, fc = -sg * spec.d / 2, door = sd.open.find((o) => o[2] === 0), ta = door ? Math.min(Math.abs(door[0] - fc), Math.abs(door[1] - fc)) : 1e3, tb = door ? Math.max(Math.abs(door[0] - fc), Math.abs(door[1] - fc)) : 0;
  return { fc, ta, tb, t: ta >= 2.85 ? 1.6 : ta - 1.25 >= 1.5 ? ta - 1.25 : tb + 1.25 };
}
function laneFountain(B, D, spec) {
  const sd = spec.side; if (!sd || !sd.open) return;
  const { w, d } = spec, sg = sd.sg, c = Math.cos(spec.turn), sn = Math.sin(spec.turn), lx = sg * w / 2, lz = -d / 2, Ox = spec.x + lx * c + lz * sn, Oz = spec.z - lx * sn + lz * c, th = spec.turn + sg * Math.PI / 2, cs = Math.cos(th), ss = Math.sin(th);
  const { fc, ta, t } = laneFountainAt(spec);
  const away = t < ta ? -sg : sg, xf = fc + sg * t, g = avenueY(Ox + xf * cs + 0.3 * ss) - spec.y, st = mul(COL.stone, 0.95);
  for (const q of [B, D]) q.at(Ox, spec.y, Oz, th);
  B.box(xf - 0.6, g - 0.3, 0, xf + 0.6, g + 0.62, 0.56, st, SF.ASHLAR, 'xXZ');
  for (const [a, b2, e, f] of [[-0.6, 0, 0.6, 0.12], [-0.6, 0.44, 0.6, 0.56], [-0.6, 0.12, -0.48, 0.44], [0.48, 0.12, 0.6, 0.44]]) B.box(xf + a, g + 0.5, b2, xf + e, g + 0.62, f, mul(st, 1.03), SF.ASHLAR, 'Y');
  B.box(xf - 0.48, g + 0.5, 0.12, xf + 0.48, g + 0.52, 0.44, [0.1, 0.22, 0.26], SF.BRONZE, 'Y');
  B.box(xf - 0.32, g + 0.62, 0, xf + 0.32, g + 1.6, 0.1, st, SF.ASHLAR, 'xXZ'); B.box(xf - 0.38, g + 1.6, 0, xf + 0.38, g + 1.72, 0.15, mul(st, 1.05), SF.ASHLAR, 'xXyYZ');
  D.box(xf - 0.05, g + 1.02, 0.1, xf + 0.05, g + 1.12, 0.3, [0.4, 0.27, 0.12], SF.BRONZE, 'xXyYZ');
  D.box(xf - 0.02, g + 0.52, 0.26, xf + 0.02, g + 1.04, 0.3, [0.55, 0.7, 0.75], SF.BRONZE, 'xXzZ');
  // (two jars set down by the basin, on the side away from the door and its steps)
  for (let i = 0; i < 2; i++) amphora(D, xf + away * (0.85 + 0.35 * i), g - 0.03, 0.26 + 0.12 * i, 0.95 + 0.1 * i, mul(CLAY, 0.85 + 0.12 * i));
  for (const q of [B, D]) q.at();
}

// ---------------------------------------------------------------- the market square's buildings (all invented)
// One stoa: on the side `side` (+1 south, -1 north) of the square: a stylobate with three steps down to the square, a row of
// Doric columns 3.4 m high, a back wall on the street behind, a tiled roof with its ridge east to west. It stands level in three
// lengths, each a step (1.25 m) above the next down the hill, with four steps between them inside.
function buildStoa(B, side) {
  const w = (SQ.x1 - SQ.x0) / SQ.n, mb = lin('#e6ddc8'), wall = COL.plaster[0], st = COL.stone, tim = mul(COL.timber, 1.4);
  const zf = side * SQ.edge, zc = side * (SQ.edge + 0.55), zb = side * (SQ.back - 0.4), zo = side * (SQ.back + 0.1), zr = side * 27.35, zE = side * 23.0, zB = side * (SQ.back + 0.5);
  const zbox = (x0, y0, za, x1, y1, zq, col, sf, f, top, topS) => B.box(x0, y0, Math.min(za, zq), x1, y1, Math.max(za, zq), col, sf, f, top, topS);
  const slope = (xa, xb, e, r, ze, zq, col, sf, under) => { if ((ze > zq) !== under) B.quad([xa, e, ze], [xb, e, ze], [xb, r, zq], [xa, r, zq], col, sf); else B.quad([xb, e, ze], [xa, e, ze], [xa, r, zq], [xb, r, zq], col, sf); };
  for (let i = 0; i < SQ.n; i++) {
    const xa = SQ.x0 + i * w, xb = xa + w, Y = avenueY(xa) + 0.12, eave = Y + 3.95, ridge = Y + 5.3;
    zbox(xa, Y - 3, zf, xb, Y, zo, st, SF.ASHLAR, 'xXzZY', COL.paving, SF.PAVING);
    for (let k = 1; k <= 3; k++) zbox(xa, Y - 3, zf - side * 0.35 * k, xb, Y - 0.33 * k, zf - side * 0.35 * (k - 1), st, SF.ASHLAR, 'xXY' + (side > 0 ? 'z' : 'Z'));
    for (let j = 0; j < 6; j++) doric(B, xa + (j + 0.5) * w / 6, zc, Y, 3.4, 0.27, mb, 9);
    zbox(xa, Y + 3.4, zc - 0.33, xb, eave, zc + 0.33, mb, SF.MARBLE, 'xXzZy');
    zbox(xa, Y - 3, zb, xb, eave, zo, wall, SF.PLASTER, 'xXzZ');
    zbox(xa, Y, zb, xb, Y + 1.1, zb - side * 0.04, mul(COL.dado[2], 1.1), SF.PLASTER, side > 0 ? 'zY' : 'ZY');
    slope(xa - 0.3, xb + 0.3, eave - 0.05, ridge, zE, zr, COL.tile[i % 4], SF.TILE_X, false); slope(xa - 0.3, xb + 0.3, eave - 0.05, ridge, zB, zr, COL.tile[i % 4], SF.TILE_X, false);
    slope(xa, xb, eave - 0.12, ridge - 0.07, zE, zr, tim, SF.TIMBER, true); slope(xa, xb, eave - 0.12, ridge - 0.07, zB, zr, tim, SF.TIMBER, true);
    // the ends: the two outer ends are walled; between two lengths the upper part is closed over a wide opening, with steps
    for (const [x, sg, outer] of [[xa, -1, i === 0], [xb, 1, i === SQ.n - 1]]) {
      const f = sg > 0 ? 'X' : 'x', x0 = Math.min(x, x - sg * 0.45), x1 = Math.max(x, x - sg * 0.45);
      if (outer) zbox(x0, Y - 3, zc - side * 0.3, x1, eave, zo, wall, SF.PLASTER, 'xXzZ'); else if (sg > 0) zbox(x0, Y + 2.3, zc - side * 0.3, x1, eave, zo, wall, SF.PLASTER, 'xXy');
      if (outer || sg > 0) { const pa = [x, eave, zE + side * 0.4], pb = [x, eave, zB - side * 0.4], pc = [x, ridge - 0.1, zr]; if ((sg > 0) === (side > 0)) B.tri(pb, pa, pc, wall, SF.PLASTER); else B.tri(pa, pb, pc, wall, SF.PLASTER); }
      if (!outer && sg < 0) for (let k = 1; k <= 3; k++) zbox(xa, Y, zf + side * 0.9, xa + 0.34 * (4 - k), Y + 0.3125 * k, zb, st, SF.ASHLAR, 'XY');
    }
  }
}
// the fountain house: a small stone house with two columns in its open front, a basin along the back wall and two bronze spouts
// with running water; the front looks north to the roadway. Local frame as a house's: the front on z 0 toward +z.
function fountainHouse(B, Bcl, x, z) {
  const st = COL.stone, mb = lin('#e6ddc8'), water = [0.22, 0.42, 0.46], hw = 2.8, d = 4.4, Y = avenueY(x - hw) + 0.3;
  B.at(x, Y, z, Math.PI);
  B.box(-hw - 0.5, -3, -d - 0.3, hw + 0.5, -0.16, 0.9, st, SF.ASHLAR, 'xXzZY'); B.box(-hw, -3, -d, hw, 0, 0.45, st, SF.ASHLAR, 'xXzZY', COL.paving, SF.PAVING);
  B.box(-hw, 0, -d, hw, 3.5, -d + 0.4, st, SF.ASHLAR, 'xXzZ');
  for (const sg of [-1, 1]) { B.box(Math.min(sg * hw, sg * (hw - 0.4)), 0, -d, Math.max(sg * hw, sg * (hw - 0.4)), 3.5, 0, st, SF.ASHLAR, 'xXZ'); doric(B, sg * 0.95, -0.3, 0, 3.05, 0.22, mb, 9); }
  B.box(-hw - 0.1, 3.05, -0.6, hw + 0.1, 3.5, 0.05, mb, SF.MARBLE, 'xXzZy');
  B.quad([hw + 0.4, 3.45, 0.45], [hw + 0.4, 3.45, -d - 0.4], [0, 4.7, -d - 0.4], [0, 4.7, 0.45], COL.tile[1], SF.TILE_Z);
  B.quad([-hw - 0.4, 3.45, -d - 0.4], [-hw - 0.4, 3.45, 0.45], [0, 4.7, 0.45], [0, 4.7, -d - 0.4], COL.tile[1], SF.TILE_Z);
  B.tri([-hw, 3.5, 0.05], [hw, 3.5, 0.05], [0, 4.6, 0.05], mb, SF.MARBLE); B.tri([hw, 3.5, -d], [-hw, 3.5, -d], [0, 4.6, -d], st, SF.ASHLAR);
  B.box(-hw + 0.4, 0, -d + 0.4, hw - 0.4, 0.8, -d + 1.5, st, SF.ASHLAR, 'xXZ'); B.box(-hw + 0.4, 0.8, -d + 0.4, hw - 0.4, 0.82, -d + 1.5, mul(st, 1.05), SF.ASHLAR, 'Y');
  B.quad([-hw + 0.55, 0.83, -d + 1.38], [hw - 0.55, 0.83, -d + 1.38], [hw - 0.55, 0.83, -d + 0.42], [-hw + 0.55, 0.83, -d + 0.42], water, SF.BRONZE);
  for (const sx of [-1.1, 1.1]) {
    B.box(sx - 0.09, 1.6, -d + 0.4, sx + 0.09, 1.76, -d + 0.7, [0.3, 0.22, 0.1], SF.BRONZE, 'xXyYZ');
    Bcl.grid(1, 3, (u, v) => [sx - 0.045 + 0.09 * u, 1.6 - 0.76 * v * v, -d + 0.69 + 0.2 * v], [0.78, 0.88, 0.92], SF.CLOTH, false, (u, v) => [0.012 + 0.02 * v, sx * 5 + v * 9]);
  }
  B.at();
}
// a market stall: a trestle table with its wares under an awning of plain cloth on four poles; st.face turns it (the seller's
// side is local -z, the buyers' side +z)
// A market stall: a trestle table under a cloth on four poles. The market's cloths are dyed stronger than the street's awnings
// (madder red, saffron, indigo, sea green, white, and red and white in stripes); the wares are jars, baskets heaped with fruit
// and greens, or folded cloth with lengths of it hung from a rail behind.
const STALL_DYES = ['#b23a2a', '#d9a02c', '#3f6690', '#4f8a78', '#ece4cf', '#b23a2a'].map(lin), FRUIT = [[0.55, 0.1, 0.07], [0.6, 0.47, 0.1], [0.22, 0.38, 0.11], [0.36, 0.12, 0.3]];
function stall(B, Bcl, st, D = B) {
  const tim = mul(COL.timber, 1.5), dye = STALL_DYES[st.tint], white = STALL_DYES[4], col = st.tint === 5 ? (u) => (Math.round(u * 6) % 2 ? white : dye) : dye;
  B.at(st.x, avenueY(st.x), st.z, st.turn); Bcl.at(st.x, avenueY(st.x), st.z, st.turn); if (D !== B) D.at(st.x, avenueY(st.x), st.z, st.turn);
  B.box(-1.25, 0.78, -0.45, 1.25, 0.86, 0.45, tim, SF.TIMBER, 'xXyYzZ');
  for (const sx of [-1.05, 1.05]) for (const sz of [-0.32, 0.32]) B.beam([sx, -0.5, sz], [sx, 0.78, sz], 0.08, tim, SF.TIMBER);
  for (let x = -1.0, k = 0; x < 1.05; x += 0.42, k++) for (const z of [-0.2, 0.2]) {
    if (st.goods === 0) amphora(D, x, 0.86, z, 0.42 + 0.1 * ((k * 3) % 2), mul(CLAY, 0.8 + 0.3 * ((k * 0.37) % 1))); else if (st.goods === 1) { const top = 1.0 + 0.04 * (k % 2); D.cyl(x, z, 0.14, 0.18, 0.86, top, 6, k % 2 ? STRAW : mul(STRAW, 0.75), SF.BRONZE, false); D.cyl(x, z, 0.17, 0.04, top - 0.02, top + 0.11, 5, FRUIT[(k + (z > 0 ? 2 : 0) + st.tint) % 4], SF.BRONZE); }
    else D.box(x - 0.17, 0.86, z - 0.17, x + 0.17, 0.95 + 0.05 * ((k + (z > 0 ? 1 : 0)) % 3), z + 0.17, STALL_DYES[(k + st.tint + 1 + (z > 0 ? 2 : 0)) % 5], SF.CLOTH, 'xXzZY');
  }
  if (st.goods === 2) { B.beam([-1.6, 2.05, -1.25], [1.6, 2.05, -1.25], 0.06, tim, SF.TIMBER); for (let i = 0; i < 4; i++) { const x0 = -1.35 + 0.72 * i; Bcl.grid(1, 2, (u, v) => [x0 + 0.55 * u, 2.03 - (0.85 + 0.2 * (i % 2)) * v, -1.25], STALL_DYES[(i + st.tint + 2) % 5], SF.CLOTH, false, (u, v) => [0.02 + 0.07 * v, st.x + i + v * 2]); } }
  for (const sx of [-1.6, 1.6]) { B.beam([sx, -0.5, 1.25], [sx, 2.72, 1.25], 0.08, tim, SF.TIMBER); B.beam([sx, -0.5, -1.25], [sx, 2.3, -1.25], 0.08, tim, SF.TIMBER); }
  Bcl.grid(st.tint === 5 ? 6 : 3, 3, (u, v) => [lerp(-1.75, 1.75, u), lerp(2.3, 2.72, v) - 0.14 * Math.sin(u * Math.PI) - 0.1 * Math.sin(v * Math.PI), lerp(-1.45, 1.5, v)], col, SF.CLOTH, false, (u, v) => [0.03 + 0.06 * Math.sin(u * Math.PI), st.x + u * 3 + v * 2]);
  B.at(); Bcl.at(); if (D !== B) D.at();
}
// the bronze founder's yard off the lane at x 100 on the south side: a walled yard open to the sky with its gate on the lane, a
// clay shaft furnace (5 m inside the yard's east wall, 5.5 m from its street wall), a tiled shed on posts along the south
// wall, a heap of charcoal (its smoke is laid in build())
const FOUNDRY = { x0: LANES[3] + LANE_W / 2, x1: 122, z0: GRID_HALF + ROW_PITCH, z1: GRID_HALF + ROW_PITCH + 11.5, fx: 122 - 5, fz: GRID_HALF + ROW_PITCH + 5.5 };
function buildFoundry(B) {
  const F = FOUNDRY, Y = groundY(F.x0, F.z0 + 6), wall = mul(COL.plaster[2], 0.95), clay = [0.42, 0.29, 0.2], tim = mul(COL.timber, 1.4);
  for (const [x0, z0, x1, z1] of [[F.x0, F.z0, F.x1, F.z0 + 0.5], [F.x0, F.z1 - 0.5, F.x1, F.z1], [F.x1 - 0.5, F.z0, F.x1, F.z1], [F.x0, F.z0, F.x0 + 0.5, F.z0 + 4], [F.x0, F.z0 + 6.4, F.x0 + 0.5, F.z1]]) B.box(x0, Y - 3, z0, x1, Y + 2.9, z1, wall, SF.PLASTER, 'xXzZY');
  B.box(F.x0 - 0.05, Y + 2.5, F.z0 + 3.8, F.x0 + 0.55, Y + 2.75, F.z0 + 6.6, tim, SF.TIMBER, 'xXyYzZ');
  B.cyl(F.fx, F.fz, 0.95, 0.75, Y - 0.3, Y + 1.9, 9, clay, SF.EARTH, false); B.cyl(F.fx, F.fz, 0.75, 0.38, Y + 1.9, Y + 2.5, 9, clay, SF.EARTH, false); B.cyl(F.fx, F.fz, 0.38, 0.34, Y + 2.5, Y + 3.3, 9, mul(clay, 0.8), SF.EARTH, true);
  for (const x of [F.x0 + 3, F.x0 + 8, F.x0 + 13]) B.beam([x, Y - 0.3, F.z1 - 4], [x, Y + 2.5, F.z1 - 4], 0.14, tim, SF.TIMBER);
  B.quad([F.x0 + 2, Y + 2.45, F.z1 - 4.4], [F.x0 + 14, Y + 2.45, F.z1 - 4.4], [F.x0 + 14, Y + 3.2, F.z1 - 0.4], [F.x0 + 2, Y + 3.2, F.z1 - 0.4], COL.tile[3], SF.TILE_X);
  B.cyl(F.x0 + 6, F.z0 + 3.2, 1.3, 0.15, Y - 0.2, Y + 0.75, 8, [0.06, 0.055, 0.05], SF.EARTH, true);
}

// the avenue's paving, the market square and every row of houses of the town. perch collects the places where somebody stands
// on a balcony or at a roof's parapet (rp is their own stream).
async function buildTown(B, BF, BD, Bcl, mk, noiseOf, lay, perch, pause) {
  // the roadway: a worn paler middle, down each side a covered drain (a line of long cover slabs between two slots), a dustier
  // strip at the walls' foot
  const pv = COL.paving, dr = mul(COL.stoneDark, 0.82), slot = [0.09, 0.08, 0.07];
  const W = WAY_HALF, D0 = 4.6, D1 = 5.05, E = AV_HALF + 0.6;
  const bands = [[-E, -D1, mul(pv, 0.82), mul(pv, 0.95)], [-D1, -D0, dr, dr], [-D0, -W, mul(pv, 0.94), mul(pv, 0.98)], [-W, W, mul(pv, 1.12), mul(pv, 1.12)], [W, D0, mul(pv, 0.98), mul(pv, 0.94)], [D0, D1, dr, dr], [D1, E, mul(pv, 0.95), mul(pv, 0.82)]];
  const strip = (xa, xb, z0, z1, c0, c1, sf = SF.PAVING, lift = 0) => B.quad([xa, avenueY(xa) + lift, z1], [xb, avenueY(xb) + lift, z1], [xb, avenueY(xb) + lift, z0], [xa, avenueY(xa) + lift, z0], c1, sf, c0);
  for (let x = AV_X0; x > AV_X1 + 0.01; x -= 15) {
    const xa = Math.max(x - 15, AV_X1);
    for (const [z0, z1, c0, c1] of bands) strip(xa, x, z0, z1, c0, c1);
    for (const z of [-D1, -D0, D0, D1]) strip(xa, x, z - 0.025, z + 0.025, slot, slot, SF.BRONZE, 0.012);
  }
  // THE FESTIVAL'S MIDDLE WAY (invented): along each edge of the way a thick garland of leaves hangs in swags between
  // posts 3.5 m apart, a metre high, with a pair of ribbons at every post; open at every cross lane and at the gate; leaves
  // strewn on the way. No garland crosses the avenue: the others hang along the house fronts (avenueAfter) and across the
  // mouths of the side lanes
  const leaf = GARLAND, post = mul(COL.timber, 1.6), rfl = mk('festival-leaves'), SPAN = 3.5;
  const lanesAt = [...LANES, WALL_STREET_X - 3.5];
  for (const sg of [-1, 1]) for (let x = 284, k = 0; x > WALL_STREET_X + 1; x -= SPAN, k++) {
    const xb = x - SPAN, open = (q) => lanesAt.some((l) => Math.abs(q - l) < LANE_W / 2 + 0.6), z = sg * WAY_HALF, y = avenueY(x);
    if (!open(x)) {
      B.box(x - 0.07, y - 0.2, z - 0.07, x + 0.07, y + 1.14, z + 0.07, post, SF.TIMBER, 'xXzZY');
      for (const e of [-1, 1]) Bcl.grid(1, 1, (u, v) => [x - 0.09, y + 1.06 - (0.5 + 0.1 * e) * v, z + e * 0.1 + (u - 0.5) * 0.11], CLOTHS[(k + (e > 0 ? 1 : 4) + (sg > 0 ? 2 : 0)) % CLOTHS.length], SF.CLOTH, false, (u, v) => [0.04 * v, x + v + e]);
    }
    if (open(x) || open(xb) || open((x + xb) / 2)) continue;
    for (let i = 0; i < 3; i++) { const t0 = i / 3, t1 = (i + 1) / 3, sag = (t) => 1.02 - 1.0 * t * (1 - t), xa = lerp(x, xb, t0), xc = lerp(x, xb, t1); B.beam([xa, avenueY(xa) + sag(t0), z], [xc, avenueY(xc) + sag(t1), z], i === 1 ? 0.24 : 0.19, mul(leaf, 0.85 + 0.35 * ((i + k) % 2)), SF.LEAF, i === 1 ? 0.24 : 0.19, false); }
  }
  for (let i = 0; i < 260; i++) { const x = rfl.range(WALL_STREET_X, 286), z = rfl.range(-WAY_HALF + 0.1, WAY_HALF - 0.1), a = rfl.range(0, 3.14), l = rfl.range(0.1, 0.24), c = Math.cos(a) * l, sn = Math.sin(a) * l, y = avenueY(x) + 0.012, g = mul(leaf, rfl.range(0.8, 1.5));
    B.quad([x - c, y + 0.0885 * c, z - sn], [x + sn * 0.4, y - 0.0885 * sn * 0.4, z - c * 0.4], [x + c, y - 0.0885 * c, z + sn], [x - sn * 0.4, y + 0.0885 * sn * 0.4, z + c * 0.4], g, SF.LEAF); }
  // across the mouth of each side lane that has a house on both its corners (the first and the last cross lane), on both
  // hands of the avenue: one long swag from corner to corner, hung 3 m up the corner houses' fronts
  for (const lx of [LANES[0], LANES[3]]) for (const sg of [-1, 1]) {
    const xa = lx + LANE_W / 2 + 0.25, xb = lx - LANE_W / 2 - 0.25, z = sg * (AV_HALF - 0.14);
    leafSwag(BD, [xa, avenueY(xa) + 3.0, z], [xb, avenueY(xb) + 3.0, z], 0.55, 16, sg > 0 ? 1 : 0);
  }
  // THE LAST CROSS LANE'S CLOTH LINES (r7; ours): over each long swag, across each mouth of the lane at x 100, a line
  // from corner house to corner house 4.9 m up and half a metre inside the lane, with five lengths of dyed cloth
  // hung on it to dry (each 0.8 m wide, 1.1 to 1.5 m long: their feet 3.4 m and more over the lane's walkers)
  for (const sg of [-1, 1]) {
    const xa = LANES[3] + LANE_W / 2, xb = LANES[3] - LANE_W / 2, z = sg * (AV_HALF + 0.5), yl = (x) => avenueY(x) + 4.9 - 0.22 * Math.sin((xa - x) / LANE_W * Math.PI);
    for (let i = 0; i < 4; i++) { const x0 = lerp(xa, xb, i / 4), x1 = lerp(xa, xb, (i + 1) / 4); BD.beam([x0, yl(x0), z], [x1, yl(x1), z], 0.035, [0.5, 0.42, 0.28], SF.TIMBER, 0.035, false); }
    for (let i = 0; i < 5; i++) {
      const x0 = xa - 0.45 - i * 0.98, len = 1.1 + 0.4 * hash2(i * 3.3, sg * 7.1), col = STALL_DYES[(i * 2 + (sg > 0 ? 1 : 0)) % 5];
      Bcl.grid(2, 3, (u, v) => [x0 - 0.8 * u, yl(x0 - 0.8 * u) - 0.02 - len * v, z], (u, v) => (v > 0.99 ? mul(col, 0.6) : mul(col, 0.92 + 0.16 * (Math.round(v * 3) % 2))), SF.CLOTH, false, (u, v) => [0.02 + 0.1 * v * v, x0 + sg + v * 2 + u]);
    }
  }
  // the corner fountain of the lower street (invented): a stone trough under a spout post at the corner of the lane that
  // bounds the square on the east, north of the avenue
  { const fx = CORNER_FOUNTAIN[0], fz = CORNER_FOUNTAIN[1], fy = avenueY(fx), st = mul(COL.stone, 0.95);
    B.box(fx - 0.45, fy - 0.3, fz - 0.9, fx + 0.45, fy + 0.62, fz + 0.9, st, SF.ASHLAR, 'xXzZ'); B.box(fx - 0.33, fy + 0.5, fz - 0.78, fx + 0.33, fy + 0.52, fz + 0.78, [0.1, 0.22, 0.26], SF.BRONZE, 'Y');
    for (const [a, b, c, d] of [[-0.45, -0.9, 0.45, -0.78], [-0.45, 0.78, 0.45, 0.9], [-0.45, -0.78, -0.33, 0.78], [0.33, -0.78, 0.45, 0.78]]) B.box(fx + a, fy + 0.5, fz + b, fx + c, fy + 0.62, fz + d, mul(st, 1.03), SF.ASHLAR, 'Y');
    B.box(fx + 0.45, fy - 0.3, fz - 0.25, fx + 0.8, fy + 1.5, fz + 0.25, st, SF.ASHLAR, 'xXzZY'); B.box(fx + 0.3, fy + 1.0, fz - 0.05, fx + 0.47, fy + 1.1, fz + 0.05, [0.4, 0.27, 0.12], SF.BRONZE, 'xyYzZ');
    B.box(fx + 0.27, fy + 0.52, fz - 0.02, fx + 0.31, fy + 1.02, fz + 0.02, [0.55, 0.7, 0.75], SF.BRONZE, 'xXzZ'); }
  // the square's paving on both hands of the roadway, over the two lanes' mouths too, with a step down into each lane; the two
  // stoas, the fountain house, the plane trees, the bronzes on their bases, the stalls (the layout's)
  await pause();
  const qa = SQ.x0 - LANE_W, qb = SQ.x1 + LANE_W;
  for (const side of [-1, 1]) {
    strip(qa, qb, side > 0 ? E : -16, side > 0 ? 16 : -E, mul(pv, side > 0 ? 0.95 : 0.9), mul(pv, side > 0 ? 0.9 : 0.95));
    strip(qa, qb, side > 0 ? 16 : -SQ.edge, side > 0 ? SQ.edge : -16, mul(pv, side > 0 ? 0.9 : 0.86), mul(pv, side > 0 ? 0.86 : 0.9));
    for (const [xa, xb] of [[qa, SQ.x0], [SQ.x1, qb]]) { const z = side * SQ.edge, pa = [xa, avenueY(xa), z], pb = [xb, avenueY(xb), z], pc = [xb, avenueY(xb) - 0.7, z], pd = [xa, avenueY(xa) - 0.7, z]; if (side > 0) B.quad(pb, pa, pd, pc, mul(pv, 0.8), SF.ASHLAR); else B.quad(pa, pb, pc, pd, mul(pv, 0.8), SF.ASHLAR); }
    buildStoa(BF, side);
  }
  const sq = lay.square;
  fountainHouse(BF, Bcl, sq.fountain[0], sq.fountain[1]);
  for (const t of sq.trees) leafTree(BF, t.x, avenueY(t.x), t.z, t.h, t.tone, 0);
  for (const d of sq.bronzes) dedication(BF, d);
  for (const st of sq.stalls) stall(BF, Bcl, st, BD);
  buildFoundry(B);
  await pause();
  const lanes = [];
  perch.far = [];
  for (let x = LANES[0]; x > -200; x -= 48) lanes.push(x);
  const blocks = [[LANES[0] + LANE_W / 2, 286]];
  for (let i = 0; i < lanes.length - 1; i++) blocks.push([lanes[i + 1] + LANE_W / 2, lanes[i] - LANE_W / 2]);
  // row lines by insula: two rows back to back (23 m), then a street of 5.5 m
  for (const side of [1, -1]) {
    for (let k = 0; k < (side > 0 ? 16 : 12); k++) {
      if (k > 0) await pause();
      for (const half of [0, 1]) {
        const zl = side * (k === 0 && half === 0 ? AV_HALF : GRID_HALF + ROW_PITCH * k + (half ? ROW_BACK : 0)), face = half ? side : -side, depth = Math.abs(zl);
        if (side < 0 && depth > 300) continue;
        // every row is dealt from a stream of its own, named by its side, its insula and its half
        const rowName = (side > 0 ? 'south' : 'north') + ':' + k + ':' + half, rRow = mk('row:' + rowName), rPerch = k === 0 && half === 0 ? mk('perch:' + rowName) : null;
        // (r7: the upper street's fuller hand draws on a stream of its own, one to each of the avenue's two rows)
        const rUp = k === 0 && half === 0 ? mk('upper-street:' + rowName) : null;
        for (const [bx0, bx1] of blocks) {
          let a = bx0, b = bx1;
          if (k === 0 && Math.abs(bx0 - SQ.x0) < 0.01) continue;
          if (side > 0 && k === 1 && half === 0 && Math.abs(bx0 - FOUNDRY.x0) < 0.01) a = FOUNDRY.x1;
          if (k === 0 && half === 0) { if (b < AV_X1) continue; a = Math.max(a, WALL_STREET_X); }
          else if (side > 0) { if (depth < COURT.z1 + 12) { if (b < COURT.x1 + 4) continue; a = Math.max(a, COURT.x1 + 3); } }
          else if (k === 0) { if (b < WALL_STREET_X + 4) continue; a = Math.max(a, WALL_STREET_X); }
          else if (depth < 80) { if (b < WALL_STREET_X + 4) continue; a = Math.max(a, WALL_STREET_X); if (depth > 60 && half === 0) continue; }
          else { if (b < BASIN_X1 + 12) continue; a = Math.max(a, BASIN_X1 + 9); if (depth > -SPUR_Z - 14) continue; }
          if (b - a < 6) continue;
          const av = k === 0 && half === 0, level = av ? 2 : k < 2 ? 1 : 0;
          const row = houseRow(av || k === 0 ? BF : B, rRow, { a, b, line: zl, face, dir: 'x', level, dMin: av ? 11 : 9.5, dMax: av ? 13.4 : 11.4, skip: av ? 0 : level ? 0.08 : 0.22 + 0.2 * noiseOf(a, zl),
            two: av ? 0.85 : 0.42, roofMix: av ? [0.25, 0.62] : null, courts: av ? lay.courts.filter((q) => q.side === side) : null, roofs: level ? { r: mk('roofs:' + rowName), Bcl, perch, rich: k === 0 } : null, not: side > 0 && k > 3 ? (x, z) => acroK(x, z) > 0.55 : null, style: av,
            front: av ? (spec, rr) => { avenueFront(spec, rr); if (spec.stretch === 'upper') upperFront(spec, rUp); } : null, D: av || k === 0 ? BD : null,
            after: av ? (spec, rr) => { Bcl.at(spec.x, spec.y, spec.z, spec.turn); avenueAfter(BF, BD, Bcl, spec, rr, rPerch, perch); if (spec.more) upperAfter(BF, BD, Bcl, spec); Bcl.at(); } : null, yAt: av ? (x) => avenueY(x) : (x, z) => groundY(x, z - face * 5) });
          // (r7) the corner house at the upper (west) side of the last cross lane, on the north hand, carries the upper
          // street's wall fountain on its lane side
          if (av && side < 0 && Math.abs(bx1 - (LANES[3] - LANE_W / 2)) < 0.01 && row.length) laneFountain(BF, BD, row[row.length - 1]);
          // THE FAR ROWS' EMPTY PLOTS (ours): where a row behind the first back street has no house, a tree stands in six
          // plots of ten: a cypress, an olive or a fig, its kind, height and spot from the plot's own place. The rows'
          // houses are noted for the hearths' smoke (build()).
          if (!level) for (const g of row) {
            const zc = zl - face * g.d / 2;
            if (!g.gap) { perch.far.push([g.x, g.y + g.h, zc]); continue; }
            const kq = hash2(g.x, zc), tx = g.x + (kq - 0.5) * g.w * 0.5, tz = zc + (hash2(zc, g.x) - 0.5) * 4;
            if (hash2(zc + 3, g.x) < 0.62) farTree(B, tx, groundY(tx, tz) - 0.3, tz, kq > 0.5 ? 7 + 8 * (kq - 0.5) : 4.6 + 5 * kq, hash2(g.x + 1, zc), kq > 0.5);
          }
        }
        if (k === 0 && half === 0) await pause();
      }
    }
  }
}

// THE UPPER TOWN WEST OF THE COURT AND THE LAND WALL (the design's backdrop: "the upper town climbs on, park-like with
// trees"; what stands in it is ours, plain, and seen far: from the climb, over the court's walls). On two grounds: the
// level ground between the court's west wall and the land wall with the hill's foot west of the rows, and the low land
// north west of the court between the lower road and the north coast. On each: houses apart, each with a tiled roof in
// a walled garden with its trees, and between them groves of cypress or of olive and fig; the ground between is garden
// plots (the ground's own material draws them). Each house and grove is dealt a place; a place within the rows' ground,
// on the acropolis's flank or too near another is passed over.
// THE LAND WALL (ours: its line is invented) closes the town 372 m west of the court: from the north coast due south
// over the low land, up the slope, over the level ground to the acropolis's foot, 7 m high, a tower of 11 m every 62 m;
// only its east face and its walk are built (nothing of the flown line lies west of it). Outside it lie the fields
// (the ground's material again).
const UPPER = { grounds: [{ x0: -424, x1: -84, z0: -22, z1: 215, houses: 12, groves: 8 }, { x0: -424, x1: -162, z0: -396, z1: -96, houses: 6, groves: 7 }], rows: [-212, 82], apart: 34,
  wallX: -436, wallZ: [-410, 238], wallH: 7, wallPiece: 31, towerH: 11, towerEvery: 62 };
function buildUpperTown(B, r) {
  const U = UPPER, taken = [], houses = [];
  const free = (x, z) => !(z > U.rows[1] && x > U.rows[0]) && acroK(x, z) < 0.45 && !taken.some((t) => Math.hypot(t[0] - x, t[1] - z) < U.apart);
  for (const G of U.grounds) for (let i = 0, tries = 0; i < G.houses && tries < 400; tries++) {
    const x = r.range(G.x0, G.x1), z = r.range(G.z0, G.z1), w = r.range(9, 14), d = r.range(7.5, 10.5), h = r.range(4.2, 7), wallC = mul(r.pick(COL.plaster), r.range(0.9, 1)), tile = mul(r.pick(COL.tile), r.range(0.9, 1.05)), nT = r.int(2, 4);
    if (!free(x, z)) continue;
    taken.push([x, z]); i++;
    const y = groundY(x, z), x0 = x - d / 2, x1 = x + d / 2, z0 = z - w / 2, z1 = z + w / 2, e = y + h, rise = d * 0.17 + 0.2, sf = farWall(y, h > 6);
    B.box(x0, y - 2, z0, x1, e, z1, wallC, sf, 'XzZ');
    // the ridge runs north and south: the roof's east slope takes the first sun
    B.quad([x1 + 0.45, e - 0.1, z1 + 0.45], [x1 + 0.45, e - 0.1, z0 - 0.45], [x, e + rise, z0 - 0.45], [x, e + rise, z1 + 0.45], tile, SF.TILE_Z);
    B.quad([x0 - 0.45, e - 0.1, z0 - 0.45], [x0 - 0.45, e - 0.1, z1 + 0.45], [x, e + rise, z1 + 0.45], [x, e + rise, z0 - 0.45], tile, SF.TILE_Z);
    B.tri([x1, e, z0], [x0, e, z0], [x, e + rise - 0.1, z0], wallC, sf); B.tri([x0, e, z1], [x1, e, z1], [x, e + rise - 0.1, z1], wallC, sf);
    // the garden's wall, 2 m high: the faces that look east and toward the avenue's line (its outer and its inner ones)
    const gx0 = x - 15, gx1 = x + 13, gz0 = z - 13, gz1 = z + 13, gc = mul(wallC, 0.86), gy = y + 2, f = z > -6 ? 'z' : 'Z';
    B.box(gx1 - 0.4, y - 2, gz0, gx1, gy, gz1, gc, SF.PLASTER, 'X'); B.box(gx0 - 0.4, y - 2, gz0, gx0, gy, gz1, gc, SF.PLASTER, 'X');
    B.box(gx0, y - 2, gz0 - 0.4, gx1, gy, gz0, gc, SF.PLASTER, f); B.box(gx0, y - 2, gz1, gx1, gy, gz1 + 0.4, gc, SF.PLASTER, f);
    for (let k = 0; k < nT; k++) { const tx = lerp(gx0 + 2, gx1 - 2, hash2(x + k, z)), tz = (hash2(z, x + k) < 0.5 ? gz0 + 3.5 : gz1 - 3.5) + 2 * hash2(x - k, z + k), cyp = hash2(tx + 2, tz) > 0.5; farTree(B, tx, groundY(tx, tz) - 0.3, tz, (cyp ? 8 : 5) + 3 * hash2(tx, tz), hash2(tz, tx), cyp); }
    houses.push([x, e + rise, z]);
  }
  for (const G of U.grounds) for (let i = 0, tries = 0; i < G.groves && tries < 400; tries++) {
    const x = r.range(G.x0, G.x1), z = r.range(G.z0, G.z1), n = r.int(5, 8), cyp = r.chance(0.4), rad = r.range(8, 15), tone = r.range(0, 1), hh = cyp ? r.range(8, 11.5) : r.range(4.6, 7);
    if (!free(x, z)) continue;
    taken.push([x, z]); i++;
    for (let k = 0; k < n; k++) { const a = k * 2.399963 + tone * 6.28, q = rad * Math.sqrt((k + 0.5) / n), tx = x + Math.cos(a) * q, tz = z + Math.sin(a) * q; farTree(B, tx, groundY(tx, tz) - 0.3, tz, hh * (0.8 + 0.4 * hash2(tx, tz)), hash2(tz, tx), cyp); }
  }
  const X = U.wallX, wc = mul(COL.stone, 0.96), wy = (z) => groundY(X, z);
  for (let z = U.wallZ[0]; z < U.wallZ[1] - 0.01; z += U.wallPiece) {
    const za = z, zb = Math.min(z + U.wallPiece, U.wallZ[1]), ya = wy(za), yb = wy(zb);
    B.quad([X, yb - 3, zb], [X, ya - 3, za], [X, ya + U.wallH, za], [X, yb + U.wallH, zb], mul(wc, 0.9), SF.ASHLAR, wc);
    B.quad([X - 3, yb + U.wallH, zb], [X, yb + U.wallH, zb], [X, ya + U.wallH, za], [X - 3, ya + U.wallH, za], mul(wc, 1.04), SF.ASHLAR);
  }
  for (let z = U.wallZ[0]; z < U.wallZ[1] + 0.01; z += U.towerEvery) B.box(X - 5, wy(z) - 3, z - 4, X + 2.5, wy(z) + U.towerH, z + 4, wc, SF.ASHLAR, 'XzZY');
  return houses;
}

// the acropolis plateau to the south west carries two small temples, seen far off over the roofs: plain shapes (a platform, a
// cella, a row of columns on the east front, a tiled roof)
function farTemple(B, x, z, w, d, h) {
  const y = groundY(x, z) - 0.5, c = lin('#e9e2d0');
  B.box(x - d / 2 - 1.2, y - 4, z - w / 2 - 1.2, x + d / 2 + 1.2, y + 1.2, z + w / 2 + 1.2, c, SF.MARBLE);
  B.box(x - d / 2, y + 1.2, z - w / 2 + 0.8, x + d / 2 - 3.2, y + 1.2 + h, z + w / 2 - 0.8, c, SF.PLASTER, 'xXzZ');
  const nc = Math.max(4, Math.round(w / 2.6));
  for (let i = 0; i < nc; i++) { const zz = z - w / 2 + 0.6 + i * (w - 1.2) / (nc - 1); B.box(x + d / 2 - 1.1, y + 1.2, zz - 0.42, x + d / 2 - 0.3, y + 1.2 + h, zz + 0.42, c, SF.MARBLE, 'xXzZ'); }
  const e = y + 1.2 + h, r = e + 1.2 + w * 0.16;
  B.box(x - d / 2 - 0.2, e, z - w / 2, x + d / 2 + 0.2, e + 1.2, z + w / 2, c, SF.MARBLE, 'xXzZy');
  B.quad([x - d / 2 - 0.5, e + 1.2, z + w / 2 + 0.4], [x + d / 2 + 0.5, e + 1.2, z + w / 2 + 0.4], [x + d / 2 + 0.5, r, z], [x - d / 2 - 0.5, r, z], COL.tile[1], SF.TILE_X);
  B.quad([x + d / 2 + 0.5, e + 1.2, z - w / 2 - 0.4], [x - d / 2 - 0.5, e + 1.2, z - w / 2 - 0.4], [x - d / 2 - 0.5, r, z], [x + d / 2 + 0.5, r, z], COL.tile[1], SF.TILE_X);
  B.tri([x + d / 2 + 0.2, e + 1.2, z + w / 2], [x + d / 2 + 0.2, e + 1.2, z - w / 2], [x + d / 2 + 0.2, r - 0.1, z], c, SF.MARBLE); B.tri([x - d / 2 - 0.2, e + 1.2, z - w / 2], [x - d / 2 - 0.2, e + 1.2, z + w / 2], [x - d / 2 - 0.2, r - 0.1, z], c, SF.MARBLE);
}

// the court of Helios: terrace, walls, parapets, the porch, the ways, the altar, the small temple
function buildCourt(B) {
  const Y = COURT_Y, st = COL.stone, C = COURT, deep = Y - 9;
  // the court's own paving: large quiet slabs (2.2 by 1.45 m) of the pale local stone
  B.quad([C.x0, Y, C.z1], [C.x1, Y, C.z1], [C.x1, Y, C.z0], [C.x0, Y, C.z0], COL.court, SF.COURT);
  // THE WAYS: white slabs between borders of darker stone, each a finger above the last so that where two meet one lies over
  // the other: the aprons lowest, then the round, the terrace walk, the processional way with its cross bands
  { const slab = lin('#ebe5d6'), dark = lin('#96887a'), EDGE = 0.4;
    const flat = (a, b, c, d, lift, col, col2 = col) => { const q = [a, b, c, d].map((v) => [v[0], Y + lift, v[1]]), ny = (q[1][2] - q[0][2]) * (q[3][0] - q[0][0]) - (q[1][0] - q[0][0]) * (q[3][2] - q[0][2]); if (ny > 0) B.quad(q[0], q[1], q[2], q[3], col, SF.PAVING, col2); else B.quad(q[3], q[2], q[1], q[0], col2, SF.PAVING, col); };
    const rect = (x0, z0, x1, z1, lift, col) => flat([x0, z0], [x1, z0], [x1, z1], [x0, z1], lift, col);
    const framed = (x0, z0, x1, z1, lift) => { rect(x0 - EDGE, z0 - EDGE, x1 + EDGE, z1 + EDGE, lift - 0.004, dark); rect(x0, z0, x1, z1, lift, slab); };
    // a band along a line of points: the slabs, and a border on each side
    const band = (pts, half, lift) => {
      const n = pts.length, off = (i, d) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [pts[i][0] - (b[1] - a[1]) / l * d, pts[i][1] + (b[0] - a[0]) / l * d]; };
      for (let i = 0; i < n - 1; i++) {
        flat(off(i, -half), off(i + 1, -half), off(i + 1, half), off(i, half), lift, slab);
        for (const sg of [-1, 1]) flat(off(i, sg * half), off(i + 1, sg * half), off(i + 1, sg * (half + EDGE)), off(i, sg * (half + EDGE)), lift, dark);
      }
    };
    framed(APRON.x0, -APRON.half, APRON.x1, APRON.half, 0.016); framed(-10.5, -11.5, 10.5, 11.5, 0.016);
    framed(ALTAR[0] - 4.5, ALTAR[1] - 5.5, ALTAR[0] + 4.5, ALTAR[1] + 5.5, 0.016); framed(ALTAR[0] - 1.5, 3.5, ALTAR[0] + 1.5, ALTAR[1] - 5.5, 0.02);
    { const pts = [], N = 132; for (let i = 0; i <= N; i++) { const a = (-ROUND_END + 2 * ROUND_END * i / N) * Math.PI / 180; pts.push([Math.cos(a) * ROUND_R, Math.sin(a) * ROUND_R]); } band(pts, ROUND_HALF, 0.026); }
    band(WAYS.walk.pts, WAYS.walk.half, 0.03);
    // the processional way: a border, the slabs paler along the worn middle, a band of the darker stone across it every 8 m
    rect(7.5, -3.5 - 0.5, C.x1, 3.5 + 0.5, 0.042, dark);
    flat([7.5, -3.5], [C.x1, -3.5], [C.x1, 0], [7.5, 0], 0.046, mul(slab, 0.94), mul(slab, 1.04)); flat([7.5, 0], [C.x1, 0], [C.x1, 3.5], [7.5, 3.5], 0.046, mul(slab, 1.04), mul(slab, 0.94));
    for (let x = 12; x < C.x1 - 2; x += 8) rect(x - 0.37, -3.5, x + 0.37, 3.5, 0.052, dark);
  }
  // south and west walls, 4.5 m with a coping
  B.box(C.x0 - 1.2, deep, C.z1, C.x1 + 1, Y + 4.5, C.z1 + 1.2, st, SF.ASHLAR, 'xXzZ'); B.box(C.x0 - 1.4, Y + 4.5, C.z1 - 0.2, C.x1 + 1.2, Y + 4.8, C.z1 + 1.4, mul(st, 1.04), SF.ASHLAR, 'xXzZyY');
  B.box(C.x0 - 1.2, deep, C.z0, C.x0, Y + 4.5, C.z1, st, SF.ASHLAR, 'xXzZ'); B.box(C.x0 - 1.4, Y + 4.5, C.z0, C.x0 + 0.2, Y + 4.8, C.z1, mul(st, 1.04), SF.ASHLAR, 'xXzZyY');
  // east retaining wall with its parapet of 1.1 m, in two runs beside the porch
  for (const [z0, z1] of [[C.z0, -PORCH.wing], [PORCH.wing, C.z1]]) {
    B.box(C.x1, deep, z0, C.x1 + 1, Y + 1.1, z1, st, SF.ASHLAR, 'xXzZ'); B.box(C.x1 - 0.12, Y + 1.1, z0, C.x1 + 1.12, Y + 1.3, z1, mul(st, 1.04), SF.ASHLAR, 'xXzZyY');
  }
  // north parapet (0.9 m) along the terrace edge; the battered wall below falls to the lower road
  const par = (x0, z0, x1, z1) => { B.box(x0, Y, z0, x1, Y + 0.75, z1, st, SF.ASHLAR, 'xXzZ'); B.box(x0 - 0.08, Y + 0.75, z0 - 0.08, x1 + 0.08, Y + 0.9, z1 + 0.08, mul(st, 1.04), SF.ASHLAR, 'xXzZyY'); };
  par(C.x0, C.z0 - 0.6, C.x1 + 1, C.z0);
  B.quad([C.x0 - 1.2, ROAD_Y - 2, -74.6], [C.x1 + 1, ROAD_Y - 2, -74.6], [C.x1 + 1, Y, C.z0 - 0.6], [C.x0 - 1.2, Y, C.z0 - 0.6], mul(st, 0.95), SF.ASHLAR);
  // THE PORCH at the head of the avenue: four square pillars of marble (the west pair on the court's floor, the east pair
  // at the steps' foot), a beam on each front and along each side, a timber ceiling on the beams, a cornice and a low
  // tiled roof with a gable to the avenue and one to the court. From each west pillar a short wall runs back to the court
  // wall's line; between that and the east pillar the side stands open (the street below the wall passes through). The
  // wall's ends beside it stand 5.2 m high (their east faces carry the hangings, laid in build()); the avenue's last 6 m
  // come up to the court in four broad low steps under the roof; a tall bronze tripod on a low garlanded marble base stands before each east pillar.
  { const G = PORCH, mb = COL.marble, half = G.clear / 2, pw = G.pillar, zo = half + pw, ys = Y + G.soffit, yc = ys + G.beam, ye = yc + 0.25, yr = ye + G.rise, tim = mul(COL.timber, 1.25);
    for (const sg of [-1, 1]) {
      const z0 = sg > 0 ? half : -zo, z1 = sg > 0 ? zo : -half;
      for (const xa of [G.x0, G.x1 - pw]) {
        const yb = xa > C.x1 ? avenueY(xa + pw) : Y;
        B.box(xa - 0.2, yb - 0.5, z0 - 0.2, xa + pw + 0.2, yb + 0.5, z1 + 0.2, mul(st, 0.98), SF.ASHLAR, 'xXzZY');
        B.box(xa, yb + 0.5, z0, xa + pw, ys - 0.4, z1, mb, SF.MARBLE, 'xXzZ');
        B.box(xa - 0.1, ys - 0.4, z0 - 0.1, xa + pw + 0.1, ys - 0.18, z1 + 0.1, mul(mb, 1.03), SF.MARBLE, 'xXzZyY'); B.box(xa - 0.2, ys - 0.18, z0 - 0.2, xa + pw + 0.2, ys, z1 + 0.2, mul(mb, 1.05), SF.MARBLE, 'xXzZy');
      }
      // the short wall from the west pillar back to the court wall's line, and the beam along the side
      B.box(G.x0 + pw, Y, sg > 0 ? zo - 0.7 : -zo, C.x1 + 1, ys, sg > 0 ? zo : -zo + 0.7, mul(mb, 0.97), SF.MARBLE, 'XzZ');
      B.box(G.x0 + pw, ys, sg > 0 ? zo - 0.9 : -zo, G.x1 - pw, yc, sg > 0 ? zo : -zo + 0.9, mb, SF.MARBLE, 'zZy');
      // the court wall's end beside the porch, with a coping, stepping down to the parapet
      const a = sg > 0 ? zo : -G.wing, b = sg > 0 ? G.wing : -zo;
      B.box(C.x1, deep, a, C.x1 + 1, Y + G.wall, b, st, SF.ASHLAR, 'xXzZ'); B.box(C.x1 - 0.12, Y + G.wall, a - 0.12, C.x1 + 1.12, Y + G.wall + 0.3, b + 0.12, mul(st, 1.04), SF.ASHLAR, 'xXzZyY');
      dedication(B, { x: G.x1 + 1.5, y: avenueY(G.x1 + 1.5), z: sg * (half + pw / 2 + 0.55), face: 0, kind: 2, size: 1.5, baseH: 0.8, tone: 0.25, stone: mul(mb, 0.96), garland: true });
    }
    // the two front beams (a plain band along each: the frieze), the ceiling, the cornice, the roof and its two gables
    for (const xa of [G.x0, G.x1 - pw]) { B.box(xa, ys, -zo, xa + pw, yc, zo, mb, SF.MARBLE, 'xXy'); B.box(xa - 0.04, ys + 0.62, -zo - 0.04, xa + pw + 0.04, ys + 0.74, zo + 0.04, mul(mb, 0.9), SF.MARBLE, 'xXzZ'); }
    // (the ceiling's boards are painted blue, its joists ochre with a red band along each: a painted coffered ceiling)
    B.box(G.x0 + pw, yc - 0.12, -zo + 0.9, G.x1 - pw, yc, zo - 0.9, lin('#6f8fc0'), SF.PLASTER, 'y');
    for (let x = G.x0 + pw + 0.8; x < G.x1 - pw - 0.3; x += 1.3) { B.box(x - 0.13, yc - 0.36, -zo + 0.9, x + 0.13, yc - 0.12, zo - 0.9, lin('#d9b878'), SF.TIMBER, 'xXy'); B.box(x - 0.17, yc - 0.4, -zo + 0.9, x + 0.17, yc - 0.36, zo - 0.9, lin('#b5543c'), SF.TIMBER, 'xXy'); }
    for (const zz of [-1.75, 1.75]) B.box(G.x0 + pw, yc - 0.3, zz - 0.11, G.x1 - pw, yc - 0.12, zz + 0.11, lin('#d9b878'), SF.TIMBER, 'zZy');
    // each front beam: a frieze of blue upright blocks over the band, blue panels edged red on its underside, and on the avenue's
    // side a garland of leaves hung in five swags with a ribbon at each fixing; each pillar painted red to 1.3 m under a blue
    // band; in the avenue's gable a gilded sun disc with short rays
    const blue = lin('#3f5f96'), red = lin('#8f3226'), gold = [0.95, 0.66, 0.2], leafc = [0.13, 0.25, 0.09];
    for (const [xf, fc] of [[G.x1, 'X'], [G.x0, 'x']]) {
      const x0 = fc === 'X' ? xf : xf - 0.05, x1 = fc === 'X' ? xf + 0.05 : xf;
      for (let z = -zo + 0.45; z < zo - 0.3; z += 0.9) B.box(x0, ys + 0.76, z - 0.2, x1, yc - 0.04, z + 0.2, blue, SF.MARBLE, fc + 'zZ');
      const xs0 = fc === 'X' ? xf - pw + 0.3 : xf + 0.3, xs1 = fc === 'X' ? xf - 0.3 : xf + pw - 0.3;
      for (let z = -half + 0.55; z < half - 0.5; z += 1.5) { B.box(xs0 + 0.1, ys - 0.03, z - 0.44, xs1 - 0.1, ys - 0.02, z + 0.44, lin('#b5543c'), SF.PLASTER, 'y'); B.box(xs0 + 0.2, ys - 0.04, z - 0.36, xs1 - 0.2, ys - 0.03, z + 0.36, lin('#7d9ccc'), SF.PLASTER, 'y'); }
    }
    // the court beam's inner face (seen from under the roof): the same blue blocks over a red line
    for (let z = -zo + 1.35; z < zo - 1.2; z += 0.9) B.box(G.x0 + pw, ys + 0.5, z - 0.2, G.x0 + pw + 0.05, ys + 0.86, z + 0.2, blue, SF.MARBLE, 'XzZ');
    B.box(G.x0 + pw, ys + 0.3, -zo + 0.9, G.x0 + pw + 0.03, ys + 0.42, zo - 0.9, red, SF.PLASTER, 'X');
    for (let k = 0; k < 5; k++) {
      const za = -zo + 0.3 + k * (2 * zo - 0.6) / 5, zb = za + (2 * zo - 0.6) / 5, at = (t) => [G.x1 + 0.12, ys + 0.56 - 1.5 * t * (1 - t), lerp(za, zb, t)];
      for (let i = 0; i < 3; i++) B.beam(at(i / 3), at((i + 1) / 3), i === 1 ? 0.2 : 0.16, mul(leafc, 0.85 + 0.35 * ((i + k) % 2)), SF.LEAF, i === 1 ? 0.2 : 0.16, false);
      B.box(G.x1, ys + 0.2, za - 0.06, G.x1 + 0.03, ys + 0.6, za + 0.06, k % 2 ? red : gold, SF.CLOTH, 'XzZ');
    }
    for (const sg of [-1, 1]) for (const xa of [G.x0, G.x1 - pw]) {
      const z0 = sg > 0 ? half : -zo, yb = (xa > C.x1 ? avenueY(xa + pw) : Y) + 0.5;
      B.box(xa - 0.015, yb, z0 - 0.015, xa + pw + 0.015, yb + 1.3, z0 + pw + 0.015, red, SF.PLASTER, 'xXzZ'); B.box(xa - 0.02, yb + 1.3, z0 - 0.02, xa + pw + 0.02, yb + 1.42, z0 + pw + 0.02, blue, SF.PLASTER, 'xXzZ');
    }
    { const gx = G.x1 + G.eave - 0.04, gy = yc + 0.25 + 0.55, r = 0.42;
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * 6.2832, a1 = (i + 1) / 8 * 6.2832, am = (a0 + a1) / 2;
        B.tri([gx, gy, 0], [gx, gy + Math.sin(a1) * r, Math.cos(a1) * r], [gx, gy + Math.sin(a0) * r, Math.cos(a0) * r], gold, SF.BRONZE);
        if (Math.sin(am) > -0.5) B.tri([gx, gy + Math.sin(am + 0.14) * r * 1.15, Math.cos(am + 0.14) * r * 1.15], [gx, gy + Math.sin(am) * r * 1.75, Math.cos(am) * r * 1.75], [gx, gy + Math.sin(am - 0.14) * r * 1.15, Math.cos(am - 0.14) * r * 1.15], gold, SF.BRONZE); } }
    const e = G.eave;
    B.box(G.x0 - e, yc, -zo - e, G.x1 + e, ye, zo + e, mul(mb, 1.04), SF.MARBLE, 'xXzZy');
    B.quad([G.x0 - e, ye, zo + e], [G.x1 + e, ye, zo + e], [G.x1 + e, yr, 0], [G.x0 - e, yr, 0], COL.tile[1], SF.TILE_X);
    B.quad([G.x1 + e, ye, -zo - e], [G.x0 - e, ye, -zo - e], [G.x0 - e, yr, 0], [G.x1 + e, yr, 0], COL.tile[1], SF.TILE_X);
    B.tri([G.x1 + e - 0.1, ye, zo + e - 0.2], [G.x1 + e - 0.1, ye, -zo - e + 0.2], [G.x1 + e - 0.1, yr - 0.12, 0], mul(mb, 0.97), SF.MARBLE);
    B.tri([G.x0 - e + 0.1, ye, -zo - e + 0.2], [G.x0 - e + 0.1, ye, zo + e - 0.2], [G.x0 - e + 0.1, yr - 0.12, 0], mul(mb, 0.97), SF.MARBLE);
    const y0 = avenueY(C.x1 + G.steps * G.tread);
    for (let i = 0; i < G.steps; i++) B.box(C.x1, y0 - 0.4, -AV_HALF - 0.6, C.x1 + (G.steps - i) * G.tread, y0 + (i + 1) * (Y - y0) / G.steps, AV_HALF + 0.6, mul(mb, 0.97 + 0.02 * (i % 2)), SF.MARBLE, 'XYzZ');
  }
  // the altar south east of the base, off the axis (centre x 20, z 15): 6 m north to south by 2.4 m, 1.5 m high, on two low
  // steps; a bed of ash on its top and a low fire of a few billets (its thin smoke is laid in build())
  { const ax = ALTAR[0], az = ALTAR[1];
    B.box(ax - 2, Y, az - 3.8, ax + 2, Y + 0.2, az + 3.8, st, SF.ASHLAR); B.box(ax - 1.6, Y + 0.2, az - 3.4, ax + 1.6, Y + 0.4, az + 3.4, st, SF.ASHLAR);
    B.box(ax - 1.2, Y + 0.4, az - 3, ax + 1.2, Y + 1.9, az + 3, mul(st, 1.04), SF.ASHLAR); B.box(ax - 1.3, Y + 1.75, az - 3.1, ax + 1.3, Y + 1.9, az + 3.1, mul(st, 1.06), SF.ASHLAR, 'xXzZyY');
    B.box(ax - 0.55, Y + 1.9, az - 0.8, ax + 0.55, Y + 1.96, az + 0.8, lin('#8f887e'), SF.EARTH, 'xXzZY');
    for (let i = 0; i < 3; i++) B.box(ax - 0.38 + i * 0.26, Y + 1.96, az - 0.55 + i * 0.1, ax - 0.24 + i * 0.26, Y + 2.07, az + 0.5 - i * 0.12, lin('#352f2a'), SF.TIMBER, 'xXzZY');
    for (let i = 0; i < 4; i++) { const fx = ax - 0.3 + i * 0.2, fz = az - 0.3 + ((i * 7) % 4) * 0.2, fh = 0.2 + 0.09 * ((i * 3) % 4); B.tri([fx - 0.09, Y + 2.05, fz], [fx + 0.09, Y + 2.05, fz], [fx, Y + 2.05 + fh, fz + 0.03], [2.4, 0.95, 0.22], SF.CLOTH); B.tri([fx, Y + 2.05, fz + 0.09], [fx, Y + 2.05, fz - 0.09], [fx + 0.03, Y + 2.05 + fh, fz], [2.4, 0.95, 0.22], SF.CLOTH); } }
  buildTemple(B);
}

// THE TEMPLE on the axis behind the statue (invented): plain Doric, facing east, 15 m wide and 26 m deep (x -58 to -32) on three
// steps, six columns of 8.4 m across the front and a second row of two between the side walls' ends, the pediment's point
// 13 m above the court; pale stuccoed stone, a dark doorway, a tiled roof. No figures, nothing lettered.
const TEMPLE = { x0: -58, x1: -32, half: 7.5, step: 0.3, col: 8.4, top: 13, cols: 6 };
function buildTemple(B) {
  const T = TEMPLE, Y = COURT_Y, tc = lin('#eae2cf'), plat = 3 * T.step, yb = Y + plat, hw = T.half;
  for (let i = 0; i < 3; i++) { const o = (2 - i) * 0.45; B.box(T.x0 - o, Y + i * T.step, -hw - o, T.x1 + o, Y + (i + 1) * T.step, hw + o, mul(tc, 0.96 + 0.02 * i), SF.MARBLE, 'xXzZY'); }
  // the cella: walls from the back to 7 m behind the front columns; its door wall 9.5 m behind them
  const wx = T.x1 - 7.2, dx = T.x1 - 9.6, ch = T.col, hc = hw - 0.9;
  B.box(T.x0 + 0.8, yb, -hc, wx, yb + ch, hc, tc, SF.PLASTER, 'xzZ');
  B.box(dx - 0.5, yb, -hc, dx, yb + ch, -1.5, tc, SF.PLASTER, 'X'); B.box(dx - 0.5, yb, 1.5, dx, yb + ch, hc, tc, SF.PLASTER, 'X'); B.box(dx - 0.5, yb + 5.2, -1.5, dx, yb + ch, 1.5, tc, SF.PLASTER, 'Xy');
  B.box(dx - 0.6, yb, -1.5, dx - 0.5, yb + 5.2, 1.5, COL.dark, SF.PLASTER, 'X');
  B.box(dx, yb, -hc, wx, yb + ch, -hc + 0.7, tc, SF.PLASTER, 'XZ'); B.box(dx, yb, hc - 0.7, wx, yb + ch, hc, tc, SF.PLASTER, 'Xz');
  // a dado band round the cella and its ends
  B.box(T.x0 + 0.78, yb, -hc - 0.02, wx + 0.02, yb + 1.1, hc + 0.02, mul(tc, 0.9), SF.PLASTER, 'xzZX');
  const r0 = 0.62, pitch = (2 * hw - 2 * 0.95) / (T.cols - 1);
  for (let i = 0; i < T.cols; i++) doric(B, T.x1 - 0.95, -hw + 0.95 + i * pitch, yb, ch, r0, tc);
  for (const sg of [-1, 1]) doric(B, T.x1 - 5.0, sg * pitch / 2, yb, ch, r0, tc, 12);
  // architrave and frieze as two plain bands, a cornice, the pediment and the roof
  const ey = yb + ch, eh = 1.5, cy = ey + eh, rp = Y + T.top, ov = 0.45;
  B.box(T.x0 + 0.5, ey, -hw + 0.3, T.x1 - 0.3, ey + 0.75, hw - 0.3, tc, SF.MARBLE, 'xXzZy'); B.box(T.x0 + 0.45, ey + 0.75, -hw + 0.25, T.x1 - 0.25, cy, hw - 0.25, mul(tc, 0.95), SF.MARBLE, 'xXzZ');
  B.box(T.x0 + 0.1, cy, -hw - ov + 0.3, T.x1 + 0.1, cy + 0.22, hw + ov - 0.3, mul(tc, 1.03), SF.MARBLE, 'xXzZy');
  const ry = cy + 0.22;
  B.quad([T.x0 - 0.1, ry, hw + ov], [T.x1 + 0.3, ry, hw + ov], [T.x1 + 0.3, rp, 0], [T.x0 - 0.1, rp, 0], COL.tile[1], SF.TILE_X);
  B.quad([T.x1 + 0.3, ry, -hw - ov], [T.x0 - 0.1, ry, -hw - ov], [T.x0 - 0.1, rp, 0], [T.x1 + 0.3, rp, 0], COL.tile[1], SF.TILE_X);
  B.tri([T.x1 - 0.05, ry, hw - 0.1], [T.x1 - 0.05, ry, -hw + 0.1], [T.x1 - 0.05, rp - 0.25, 0], mul(tc, 0.97), SF.MARBLE); B.tri([T.x0 + 0.3, ry, -hw + 0.1], [T.x0 + 0.3, ry, hw - 0.1], [T.x0 + 0.3, rp - 0.25, 0], mul(tc, 0.97), SF.MARBLE);
  // the raking cornice of the front, two plain slabs
  for (const sg of [-1, 1]) B.beam([T.x1 + 0.12, ry + 0.1, sg * (hw + ov - 0.15)], [T.x1 + 0.12, rp + 0.05, 0], 0.3, mul(tc, 1.04), SF.MARBLE);
}

// a smaller bronze on its base (of grey Lartos stone unless a stone is given). Plain standing figures and tripods, life size to 2.6 m (invented:
// no known work is copied and none has a face). kind 0 a standing youth, 1 a draped figure, 2 a tripod with its cauldron.
function dedication(B, d) {
  const lartos = d.stone ?? mul(COL.lartos, 0.92 + 0.16 * d.tone), s = d.size, w = 0.42 + 0.26 * s, h = d.baseH;
  const br = mix3([0.5, 0.31, 0.11], [0.2, 0.15, 0.085], d.tone * d.tone), M = SF.BRONZE;
  B.at(d.x, d.y ?? COURT_Y, d.z, -d.face);
  B.box(-w - 0.18, 0, -w - 0.18, w + 0.18, 0.24, w + 0.18, lartos, SF.MARBLE); B.box(-w, 0.24, -w, w, h - 0.2, w, lartos, SF.MARBLE, 'xXzZ'); B.box(-w - 0.1, h - 0.2, -w - 0.1, w + 0.1, h, w + 0.1, mul(lartos, 1.06), SF.MARBLE, 'xXzZyY');
  if (d.garland) for (let i = 0; i < 4; i++) { const a = [[-w, w], [w, w], [w, -w], [-w, -w]][i], b = [[w, w], [w, -w], [-w, -w], [-w, w]][i], o = 0.04; B.beam([a[0] * (1 + o), h - 0.3, a[1] * (1 + o)], [(a[0] + b[0]) / 2 * (1 + o), h - 0.62, (a[1] + b[1]) / 2 * (1 + o)], 0.09, [0.1, 0.2, 0.07], SF.LEAF); B.beam([(a[0] + b[0]) / 2 * (1 + o), h - 0.62, (a[1] + b[1]) / 2 * (1 + o)], [b[0] * (1 + o), h - 0.3, b[1] * (1 + o)], 0.09, [0.1, 0.2, 0.07], SF.LEAF); }
  if (d.kind === 2) {
    const r = 0.42 * s, top = 1.25 * s;
    for (let i = 0; i < 3; i++) { const a = i / 3 * 6.2832 + 0.5; B.beam([Math.cos(a) * r * 1.25, h, Math.sin(a) * r * 1.25], [Math.cos(a) * r * 0.95, h + top, Math.sin(a) * r * 0.95], 0.07 * s, br, M); B.beam([Math.cos(a) * r * 0.95, h + top + 0.02, Math.sin(a) * r * 0.95], [Math.cos(a) * r * 0.95, h + top + 0.34 * s, Math.sin(a) * r * 0.95], 0.05 * s, br, M, 0.24 * s); }
    B.cyl(0, 0, r * 0.45, r, h + top - 0.4 * s, h + top - 0.08 * s, 9, br, M, false); B.cyl(0, 0, r, r * 1.04, h + top - 0.08 * s, h + top, 9, mul(br, 0.55), M);
  } else {
    // a standing figure 1.745 m high at size 1, so life size to 2.6 m (the plan): lofted rings (depth, half width) for the body
    // and the head, round limbs
    const y = h, loft = (rings, seg) => B.grid(seg, rings.length - 1, (u, v) => {
      const f = Math.min(rings.length - 1.0001, v * (rings.length - 1)), i = Math.floor(f), t = f - i, p = rings[i], q = rings[i + 1], a = u * 6.2832;
      return [(lerp(p[0], q[0], t) + lerp(p[2], q[2], t) * Math.cos(a)) * s, y + lerp(p[1], q[1], t) * s, lerp(p[3], q[3], t) * Math.sin(a) * s];
    }, br, M, true);
    const limb = (p, q, r0, r1) => {
      let dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      let ux = 1, uy = 0, uz = 0; if (Math.abs(dx) > 0.8) { ux = 0; uz = 1; }
      let rx = dy * uz - dz * uy, ry = dz * ux - dx * uz, rz = dx * uy - dy * ux; const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
      ux = ry * dz - rz * dy; uy = rz * dx - rx * dz; uz = rx * dy - ry * dx;
      B.grid(6, 1, (u, v) => { const a = u * 6.2832, r = lerp(r0, r1, v) * s, c = Math.cos(a) * r, d = Math.sin(a) * r; return [lerp(p[0], q[0], v) * s + rx * c + ux * d, y + lerp(p[1], q[1], v) * s + ry * c + uy * d, lerp(p[2], q[2], v) * s + rz * c + uz * d]; }, br, M, true);
    };
    const head = [[0.005, 1.455, 0.05, 0.055], [0.01, 1.5, 0.046, 0.048], [0.015, 1.535, 0.075, 0.068], [0.02, 1.6, 0.1, 0.084], [0.015, 1.67, 0.096, 0.082], [0.005, 1.725, 0.06, 0.055], [0, 1.745, 0.012, 0.012]];
    const lift = d.pose > 0.5;
    if (d.kind === 0) {
      // the weight on one leg, the other set a little forward
      for (const sg of [1, -1]) {
        const fx = sg > 0 ? 0.07 : -0.02, kx = sg > 0 ? 0.06 : 0;
        limb([fx, 0.05, sg * 0.105], [kx, 0.5, sg * 0.1], 0.04, 0.062); limb([kx, 0.48, sg * 0.1], [0, 0.93, sg * 0.092], 0.062, 0.094);
        B.box((fx - 0.07) * s, y, (sg * 0.105 - 0.05) * s, (fx + 0.16) * s, y + 0.065 * s, (sg * 0.105 + 0.05) * s, br, M, 'xXYzZ');
      }
      loft([[0, 0.84, 0.02, 0.03], [0, 0.88, 0.105, 0.165], [0, 0.98, 0.11, 0.17], [0.005, 1.1, 0.09, 0.14], [0.01, 1.28, 0.118, 0.185], [0.005, 1.4, 0.105, 0.2], [0.005, 1.445, 0.06, 0.1], ...head], 8);
      limb([0, 1.4, 0.215], lift ? [0.2, 1.43, 0.3] : [0.01, 1.12, 0.265], 0.052, 0.042); limb(lift ? [0.2, 1.43, 0.3] : [0.01, 1.12, 0.265], lift ? [0.3, 1.72, 0.25] : [0.09, 0.86, 0.245], 0.042, 0.03);
      limb([0, 1.4, -0.215], [-0.01, 1.12, -0.265], 0.052, 0.042); limb([-0.01, 1.12, -0.265], [0.05, 0.86, -0.25], 0.042, 0.03);
    } else {
      // draped to the feet, the cloak over the left shoulder and arm, the right forearm held out
      loft([[0, 0, 0.17, 0.2], [0, 0.04, 0.165, 0.2], [0.01, 0.5, 0.14, 0.175], [0.01, 0.92, 0.135, 0.18], [0.01, 1.1, 0.115, 0.155], [0.01, 1.28, 0.13, 0.195], [0.005, 1.4, 0.115, 0.215], [0.005, 1.445, 0.062, 0.1], ...head], 8);
      limb([0.02, 1.36, 0.215], [0.06, 1.1, 0.25], 0.056, 0.046); limb([0.06, 1.1, 0.25], lift ? [0.3, 1.2, 0.22] : [0.27, 1.02, 0.2], 0.044, 0.03);
      limb([0, 1.38, -0.2], [0.02, 0.98, -0.235], 0.07, 0.075);
    }
  }
  B.at();
}
// a cypress: a dark flame on a short trunk
function cypress(B, x, y, z, h, tone, seg = 7) {
  const g = mul([0.085, 0.15, 0.07], 0.8 + 0.4 * tone), r = 0.075 * h + 0.25;
  B.cyl(x, z, 0.16, 0.13, y - 0.4, y + 1.3, seg < 7 ? 4 : 5, [0.2, 0.15, 0.1], SF.TIMBER, false);
  B.cyl(x, z, r * 0.4, r, y + 0.9, y + h * 0.26, seg, g, SF.LEAF, false); B.cyl(x, z, r, r * 0.8, y + h * 0.26, y + h * 0.64, seg, g, SF.LEAF, false);
  B.cyl(x, z, r * 0.8, 0.03, y + h * 0.64, y + h, seg, mul(g, 1.08), SF.LEAF, false);
}
// the court's furnishing: the bronzes, the cypresses, and a plain stoa against the south wall (invented): Doric columns of 3.5 m
// four metres apart on the line z 52.6, a tiled roof leaning on the wall, open at both ends
function buildCourtThings(B, lay) {
  for (const d of lay.dedications) dedication(B, d);
  lay.cypresses.forEach((c, i) => cypress(B, c.x, c.out ? groundY(c.x, c.z) : COURT_Y, c.z, c.h, (i * 0.37) % 1));
  const Y = COURT_Y, zc = 52.6, x0 = -48, x1 = 48, mb = lin('#e6ddc8'), st = COL.stone, leaf = [0.11, 0.21, 0.07];
  // a quad wound so that it faces the way (nx, ny, nz) points
  const facing = (a, b, c, d, nx, ny, nz, col, sf) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    if ((uy * vz - uz * vy) * nx + (uz * vx - ux * vz) * ny + (ux * vy - uy * vx) * nz >= 0) B.quad(a, b, c, d, col, sf); else B.quad(d, c, b, a, col, sf);
  };
  // the round's small altars: a square stone on a step, a moulded top, a bronze bowl; in three the coals glow (their thin
  // smoke is laid in build()); on some a garland
  for (const a of lay.court.altars) {
    B.at(a.x, Y, a.z, -a.face);
    B.box(-0.55, 0, -0.55, 0.55, 0.14, 0.55, mul(st, 0.95), SF.ASHLAR, 'xXzZY'); B.box(-0.38, 0.14, -0.38, 0.38, a.h - 0.12, 0.38, mul(COL.marble, 0.93), SF.MARBLE, 'xXzZ');
    B.box(-0.45, a.h - 0.12, -0.45, 0.45, a.h, 0.45, mul(COL.marble, 0.98), SF.MARBLE, 'xXzZyY');
    B.cyl(0, 0, 0.12, 0.27, a.h, a.h + 0.16, 7, [0.42, 0.27, 0.1], SF.BRONZE, false); B.cyl(0, 0, 0.25, 0.05, a.h + 0.14, a.h + 0.2, 7, a.burns ? [2.3, 0.7, 0.16] : [0.16, 0.14, 0.13], SF.BRONZE);
    if (a.garland) for (let i = 0; i < 4; i++) { const c = [[-1, 1], [1, 1], [1, -1], [-1, -1]], p = c[i], q = c[(i + 1) % 4], w = 0.4; B.beam([p[0] * w, a.h - 0.2, p[1] * w], [(p[0] + q[0]) / 2 * w, a.h - 0.42, (p[1] + q[1]) / 2 * w], 0.07, leaf, SF.LEAF, 0.07, false); B.beam([(p[0] + q[0]) / 2 * w, a.h - 0.42, (p[1] + q[1]) / 2 * w], [q[0] * w, a.h - 0.2, q[1] * w], 0.07, leaf, SF.LEAF, 0.07, false); }
    B.at();
  }
  // the half round benches: a seat and a back in a half circle of 2.4 m, open toward the statue; a pier in the back's middle
  // carries the bench's bronze (one of the dedications)
  for (const e of lay.court.exedrae) {
    const N = 8, P = (i, r, y) => { const a = e.face + Math.PI / 2 + Math.PI * i / N; return [e.x + Math.cos(a) * r, Y + y, e.z + Math.sin(a) * r]; }, mbl = mul(COL.marble, 0.95);
    for (let i = 0; i < N; i++) {
      const am = e.face + Math.PI / 2 + Math.PI * (i + 0.5) / N, cx = Math.cos(am), cz = Math.sin(am);
      facing(P(i, 2.0, 0.45), P(i + 1, 2.0, 0.45), P(i + 1, 2.0, 1.05), P(i, 2.0, 1.05), -cx, 0, -cz, mbl, SF.MARBLE);
      facing(P(i, 2.4, 0), P(i + 1, 2.4, 0), P(i + 1, 2.4, 1.05), P(i, 2.4, 1.05), cx, 0, cz, mul(mbl, 0.94), SF.MARBLE);
      facing(P(i, 2.0, 1.05), P(i + 1, 2.0, 1.05), P(i + 1, 2.4, 1.05), P(i, 2.4, 1.05), 0, 1, 0, mul(mbl, 1.03), SF.MARBLE);
      facing(P(i, 1.5, 0.45), P(i + 1, 1.5, 0.45), P(i + 1, 2.0, 0.45), P(i, 2.0, 0.45), 0, 1, 0, mul(mbl, 1.02), SF.MARBLE);
      facing(P(i, 1.5, 0), P(i + 1, 1.5, 0), P(i + 1, 1.5, 0.45), P(i, 1.5, 0.45), -cx, 0, -cz, mul(mbl, 0.9), SF.MARBLE);
    }
    for (const i of [0, N]) { const fx = Math.cos(e.face), fz = Math.sin(e.face); facing(P(i, 1.5, 0), P(i, 2.4, 0), P(i, 2.4, 1.05), P(i, 1.5, 1.05), fx, 0, fz, mbl, SF.MARBLE); }
  }
  // the grove's trees and its two benches
  for (const t of lay.court.grove.trees) { if (t.cyp) cypress(B, t.x, Y, t.z, t.h, t.tone); else leafTree(B, t.x, Y, t.z, t.h, t.tone, 0); }
  for (const b of [...lay.court.grove.benches, ...lay.court.benches]) { B.at(b.x, Y, b.z, b.turn); B.box(-1.1, 0.38, -0.25, 1.1, 0.48, 0.25, mul(COL.marble, 0.95), SF.MARBLE, 'xXyYzZ'); for (const sx of [-0.85, 0.85]) B.box(sx - 0.1, 0, -0.22, sx + 0.1, 0.38, 0.22, mul(st, 0.95), SF.ASHLAR, 'xXzZ'); B.at(); }
  // the garland sellers' tables: wreaths laid out on a trestle table, garlands hung in swags from a rail on two posts behind it
  for (const g of lay.court.sellers) {
    const tim = mul(COL.timber, 1.5), zb = g.z + g.sg * 0.5;
    B.box(g.x - 1.2, Y + 0.76, g.z - 0.4, g.x + 1.2, Y + 0.83, g.z + 0.4, tim, SF.TIMBER, 'xXyYzZ');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.beam([g.x + sx * 1.05, Y, g.z + sz * 0.3], [g.x + sx * 1.05, Y + 0.76, g.z + sz * 0.3], 0.07, tim, SF.TIMBER, 0.07, false);
    for (let i = 0; i < 6; i++) { const wx = g.x - 0.95 + 0.38 * i, wz = g.z + 0.12 * (i % 2 ? 1 : -1); B.cyl(wx, wz, 0.17, 0.15, Y + 0.83, Y + 0.9, 6, mul(leaf, 0.9 + 0.35 * ((i + g.tint) % 3)), SF.LEAF); }
    for (const sx of [-1, 1]) B.beam([g.x + sx * 1.3, Y, zb], [g.x + sx * 1.3, Y + 2.25, zb], 0.08, tim, SF.TIMBER, 0.08, false);
    B.beam([g.x - 1.4, Y + 2.2, zb], [g.x + 1.4, Y + 2.2, zb], 0.07, tim, SF.TIMBER);
    for (let i = 0; i < 4; i++) { const xa = g.x - 1.2 + 0.6 * i, xm = xa + 0.3, xb = xa + 0.6, dip = 0.5 + 0.12 * (i % 2), c = mul(leaf, 0.95 + 0.3 * ((i + g.tint) % 2)); B.beam([xa, Y + 2.14, zb], [xm, Y + 2.14 - dip, zb], 0.1, c, SF.LEAF, 0.1, false); B.beam([xm, Y + 2.14 - dip, zb], [xb, Y + 2.14, zb], 0.1, c, SF.LEAF, 0.1, false); }
  }
  for (let x = x0; x <= x1 + 0.01; x += 4) doric(B, x, zc, Y, 3.5, 0.3, mb, 9);
  B.box(x0 - 0.6, Y + 3.5, zc - 0.4, x1 + 0.6, Y + 4.05, zc + 0.4, mb, SF.MARBLE, 'xXzZy');
  B.quad([x0 - 1, Y + 3.95, zc - 0.9], [x1 + 1, Y + 3.95, zc - 0.9], [x1 + 1, Y + 5.35, COURT.z1 + 0.3], [x0 - 1, Y + 5.35, COURT.z1 + 0.3], COL.tile[2], SF.TILE_X);
  B.quad([x1 + 1, Y + 3.9, zc - 0.9], [x0 - 1, Y + 3.9, zc - 0.9], [x0 - 1, Y + 5.3, COURT.z1 + 0.3], [x1 + 1, Y + 5.3, COURT.z1 + 0.3], mul(COL.timber, 1.3), SF.TIMBER);
  B.box(x0 - 1, Y + 4.8, COURT.z1 + 0.3, x1 + 1, Y + 5.35, COURT.z1 + 0.7, COL.stone, SF.ASHLAR, 'xXZY');
  for (const sg of [-1, 1]) { const x = sg > 0 ? x1 + 0.6 : x0 - 0.6; B.tri(sg > 0 ? [x, Y + 4.05, zc + 0.4] : [x, Y + 4.05, COURT.z1], sg > 0 ? [x, Y + 4.05, COURT.z1] : [x, Y + 4.05, zc + 0.4], [x, Y + 5.3, COURT.z1], mb, SF.PLASTER); B.box(Math.min(x, x - sg * 0.35), Y + 3.5, zc + 0.4, Math.max(x, x - sg * 0.35), Y + 4.05, COURT.z1, mb, SF.MARBLE, 'xXy'); }
}

// a transport jar standing: two drums of clay
function amphora(B, x, y, z, s, col, seg = 6) { B.cyl(x, z, 0.07 * s, 0.21 * s, y, y + 0.5 * s, seg, col, SF.BRONZE, false); B.cyl(x, z, 0.21 * s, 0.07 * s, y + 0.5 * s, y + 0.98 * s, seg, col, SF.BRONZE); }
// A JAR OF THE QUAY (r9), s its size: from a foot of 0.05 s out to the belly, 0.2 s at 0.58 s, in to the neck, 0.07 s at
// 0.76 s, and out to the lip, 0.095 s at 0.98 s: three drums of clay, none capped, the lip's drum paler; the mouth a dark
// fan in the lip's own ring
function jarQ(B, x, y, z, s, col, seg = 6) {
  const yb = y + 0.58 * s, yn = y + 0.76 * s, yl = y + 0.98 * s, rl = 0.095 * s, rim = (i) => { const a = i / seg * Math.PI * 2; return [x + Math.cos(a) * rl, yl, z + Math.sin(a) * rl]; };
  B.cyl(x, z, 0.05 * s, 0.2 * s, y, yb, seg, col, SF.BRONZE, false); B.cyl(x, z, 0.2 * s, 0.07 * s, yb, yn, seg, col, SF.BRONZE, false); B.cyl(x, z, 0.07 * s, rl, yn, yl, seg, mul(col, 1.45), SF.BRONZE, false);
  for (let i = 1; i < seg - 1; i++) B.tri(rim(0), rim(i + 1), rim(i), [0.09, 0.06, 0.05], SF.BRONZE);
}
// A BOUND BALE OF THE QUAY (r9): a block 2 hl long, 2 hw broad and h high on (x, y, z), turned about the vertical, in its
// wrapper's cloth col: its four upright faces darker at the foot (0.86) than at the top, its top face lighter (1.14).
// With a dye the two ends are the cloth inside under the wrapper's dust (0.55 of the dye) and the wrapper itself takes
// a share of it (0.3): every side has the same foot. cords 2: two tarred girths at the quarters of the length, 8 cm wide
// and 2 cm proud; 3: one more the long way, 6 mm over the girths where they cross; 0: none, a plain sack.
function bale(B, x, y, z, hl, hw, h, turn, col, cords, dye = null) {
  const c = Math.cos(turn), s = Math.sin(turn), rope = [0.3, 0.24, 0.15], body = dye ? mix3(col, dye, 0.3) : col, fold = dye ? mix3(col, dye, 0.55) : col, p = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
  const part = (ox, ax, az, top, f, lo, hi, lid, sf) => {
    if (f.includes('X')) B.quad(p(ox + ax, 0, az), p(ox + ax, 0, -az), p(ox + ax, top, -az), p(ox + ax, top, az), lo, sf, hi);
    if (f.includes('x')) B.quad(p(ox - ax, 0, -az), p(ox - ax, 0, az), p(ox - ax, top, az), p(ox - ax, top, -az), lo, sf, hi);
    if (f.includes('Z')) B.quad(p(ox - ax, 0, az), p(ox + ax, 0, az), p(ox + ax, top, az), p(ox - ax, top, az), lo, sf, hi);
    if (f.includes('z')) B.quad(p(ox + ax, 0, -az), p(ox - ax, 0, -az), p(ox - ax, top, -az), p(ox + ax, top, -az), lo, sf, hi);
    if (f.includes('Y')) B.quad(p(ox - ax, top, az), p(ox + ax, top, az), p(ox + ax, top, -az), p(ox - ax, top, -az), lid, sf);
  };
  part(0, hl, hw, h, 'zZY', mul(body, 0.86), body, mul(body, 1.14), SF.CLOTH); part(0, hl, hw, h, 'xX', mul(fold, 0.86), fold, null, SF.CLOTH);
  if (cords > 1) for (const ox of [-hl / 2, hl / 2]) part(ox, 0.04, hw + 0.02, h + 0.02, 'zZY', rope, null, rope, SF.TIMBER);
  if (cords > 2) part(0, hl + 0.02, 0.04, h + 0.026, 'xXY', rope, null, rope, SF.TIMBER);
}
// the quay's furnishing: cargo by the moored ships (jars, sacks, timber), two stalls under awnings by the gate, mooring stones
// along the edge with the moored ships' lines, nets hung to dry south of the gate
function buildQuayThings(B, Bcl, lay, r) {
  const Y = QUAY_Y;
  for (const c of lay.cargo) {
    const along = c.x < 305;
    if (c.kind === 0) {
      // (r9) jars by threes: at the kerb's two small lots the quay's jar; in every other lot of the cargo list (by
      // the ships, at the wall's foot, in the north heap and the plots beside the way) the plain one; either takes
      // the same two draws of the quay's stream, size and then tone
      for (let i = 0; i < c.n * 3; i++) { const row = i % 3, k = Math.floor(i / 3), jx = c.x + (along ? row * 0.42 - 0.2 : k * 0.44), jz = c.z + (along ? (k - c.n / 2) * 0.46 : row * 0.42), s = r.range(0.9, 1.1), col = mul(CLAY, r.range(0.85, 1.15));
        if (c.edge) jarQ(B, jx, Y, jz, 0.95 * s, col, 5); else amphora(B, jx, Y, jz, s, col, 5); }
    } else if (c.kind === 1) {
      // (r9) the cargo list's sacks, two high, wherever the list sets them down: each a block in a warm cloth, half
      // sacking and half jute, darker at its foot
      for (let i = 0, lay2 = 0; i < c.n * 2; i++) { const lv = i < c.n ? 0 : 1, k = i % c.n; if (lv && k >= c.n - 1) continue; const x = c.x + (along ? 0.1 : 0) + (lv ? 0.15 : 0), z = c.z + (k - c.n / 2 + (lv ? 0.5 : 0)) * 0.62; bale(B, x + 0.04, Y + lv * 0.34, z, 0.46, 0.29, 0.36, 0, mul(mix3(SACK, JUTE, 0.5), r.range(0.85, 1.2)), 0); }
    } else if (c.kind === 3) {
      // corded bales, two high
      // (r9) each a bound bale in its jute wrapper, 0.98 by 0.66 by 0.51 m under two girths, the dye of its cloth at its
      // two ends: khaki on half the bales, ochre and red on a quarter each, by the bale's own place; the lower turned by
      // 3 degrees at most, the upper by 6 and 3 cm along its length at most
      for (let i = 0; i < c.n * 2; i++) { const lv = i < c.n ? 0 : 1, k = i % c.n, col = mul(JUTE, r.range(0.7, 0.95)); if (lv && k >= c.n - 1) continue; const x = c.x + (lv ? 0.1 : 0), z = c.z + (k - (c.n - 1) / 2 + (lv ? 0.5 : 0)) * 0.78, y = Y + lv * 0.54;
        bale(B, x + (lv ? 0.06 * (hash2(z, x + i) - 0.5) : 0), y, z, 0.49, 0.33, 0.51, (hash2(x, z + i) - 0.5) * (lv ? 0.2 : 0.1), col, 2, CLOTHS[[1, 3, 1, 2][Math.floor(hash2(x + i, z) * 3.99)]]); }
    } else if (c.kind === 4) {
      // coils of rope laid flat, each three turns high
      for (let i = 0; i < c.n; i++) { const x = c.x + (i % 2) * 0.25, z = c.z + (i - (c.n - 1) / 2) * 1.05, rr = r.range(0.4, 0.48), col = mul([0.5, 0.42, 0.28], r.range(0.85, 1.1));
        for (let t = 0; t < 3; t++) B.cyl(x, z, rr - 0.03 * t, rr - 0.03 * t - 0.02, Y + t * 0.1, Y + t * 0.1 + 0.1, 8, mul(col, 1 - 0.1 * (t % 2)), SF.TIMBER, t === 2);
        B.cyl(x, z, rr * 0.45, rr * 0.45, Y + 0.3, Y + 0.31, 8, [0.12, 0.1, 0.08], SF.TIMBER, true); }
    } else {
      // (r9) the cargo list's stacks of timber (by the ships, at the wall's foot, in the south heap beside the way):
      // in the quay's wood, their long faces without the plank's joints
      for (let i = 0; i < c.n + 2; i++) { const lv = i < 3 ? 0 : i < 5 ? 1 : 2, k = lv === 0 ? i : lv === 1 ? i - 3 + 0.5 : i - 5 + 1, len = r.range(3.6, 5.8); B.beam([c.x - 0.3 + k * 0.36, Y + 0.16 + lv * 0.31, c.z - len / 2], [c.x - 0.3 + k * 0.36, Y + 0.16 + lv * 0.31, c.z + len / 2 + r.range(-0.4, 0.4)], 0.3, mul(QWOOD, r.range(0.75, 1.15)), SF.BRONZE); }
    }
  }
  for (const st of lay.stalls) {
    const x = st.x, z = st.z, hw = st.w / 2, col = CLOTHS[st.tint];
    B.box(x + 1.3, Y, z - hw + 0.3, x + 2.2, Y + 0.85, z + hw - 0.3, mul(COL.timber, 1.5), SF.TIMBER, 'xXzZY');
    for (let k = 0, zz = z - hw + 0.6; zz < z + hw - 0.5; zz += 0.5, k++) { if (st.goods === 0) amphora(B, x + 1.75, Y + 0.85, zz, 0.42, CLAY); else if (st.goods === 1) B.cyl(x + 1.75, zz, 0.16, 0.2, Y + 0.85, Y + 1.0, 7, k % 2 ? STRAW : mul(STRAW, 0.8), SF.BRONZE); else B.box(x + 1.5, Y + 0.85, zz - 0.17, x + 2.05, Y + 0.95 + 0.05 * (k % 3), zz + 0.17, CLOTHS[(k + st.tint + 1) % CLOTHS.length], SF.CLOTH, 'xXzZY'); }
    for (const sg of [-1, 1]) B.beam([x + 2.75, Y, z + sg * hw], [x + 2.75, Y + 2.55, z + sg * hw], 0.09, COL.timber, SF.TIMBER);
    Bcl.grid(2, 4, (u, v) => [x + 0.05 + 2.75 * u, Y + 3.3 - 0.75 * u - 0.1 * Math.sin(u * Math.PI), z - hw + st.w * v], col, SF.CLOTH, false, (u, v) => [0.02 + 0.05 * Math.sin(u * Math.PI), z + v * 4 + u * 2]);
  }
  // the gate's guard: each man's spear upright by him, his round bronze shield leaning on the pier behind him
  for (const q of lay.people) if (q.guard) {
    const sg = Math.sign(q.z), br = lin('#8e6c40'), sx = q.x + 0.12, sz = q.z + sg * 0.36, cx = WALL_X1 + 0.5, cy = Y + 0.5, cz = q.z - sg * 0.2;
    B.beam([sx, Y, sz], [sx, Y + 2.4, sz], 0.045, SPAR, SF.TIMBER); B.beam([sx, Y + 2.4, sz], [sx, Y + 2.7, sz], 0.07, br, SF.BRONZE, 0.012);
    const rim = (i) => { const a = i / 10 * 6.2832; return [cx + 0.3 - 0.26 * (0.5 + 0.5 * Math.sin(a)), cy + 0.47 * Math.sin(a), cz + 0.47 * Math.cos(a)]; };
    for (let i = 0; i < 10; i++) B.tri([cx + 0.24, cy, cz], rim(i + 1), rim(i), mul(br, i % 2 ? 1.25 : 1.05), SF.BRONZE);
  }
  // THE WAY'S LOTS AND THE LANDING'S (r7; the plan and the deal stand in lifeOf): each lot's goods by its kind; the
  // small differences of tone and size go by the lot's own place (no stream is drawn on here)
  for (const L of lay.wayLots) {
    if (L.taken) continue;
    const x = L.x, z = L.z, t = L.tone, hx = (i) => hash2(x * 1.3 + i * 2.1, z + 0.7), rope = [0.5, 0.42, 0.28];
    if (L.kind === 0) {
      // jars standing in two rows of five (r9: the quay's jar, the rows 0.4 m apart: no two touch)
      for (let i = 0; i < 10; i++) jarQ(B, x - 0.88 + 0.44 * (i % 5), Y, z + (i < 5 ? -0.2 : 0.2), 0.86 + 0.1 * hx(i), mul(CLAY, t * (0.85 + 0.25 * hx(i + 11))), 6);
    } else if (L.kind === 1) {
      // sacks: three, two on them and one on top (r9: the same blocks in the warm cloth, each darker at its foot)
      for (let i = 0; i < 6; i++) { const lv = i < 3 ? 0 : i < 5 ? 1 : 2, k = lv === 0 ? i - 1 : lv === 1 ? i - 3.5 : 0, sx = x + k * 0.72; bale(B, sx, Y + lv * 0.33, z, 0.34, 0.3 - 0.03 * lv, 0.35, 0, mul(mix3(SACK, JUTE, 0.5), t * (0.88 + 0.25 * hx(i))), 0); }
    } else if (L.kind === 2) {
      // corded bales: two and one on them
      // (r9) bound bales as the cargo list's, with 0.35 of the sacking's colour in the wrapper and a third cord the
      // long way; the two turned by 0.07 radians at most (4.0 degrees), the one on them by 0.1 (5.7 degrees) and
      // 2 cm across at most
      for (let i = 0; i < 3; i++) { const lv = i < 2 ? 0 : 1, sx = x + (lv ? 0.1 : (i - 0.5) * 1.1), y = Y + lv * 0.54, col = mul(mix3(JUTE, SACK, 0.35), t * (0.7 + 0.25 * hx(i)));
        bale(B, sx, y, z + (lv ? 0.04 * (hx(i + 13) - 0.5) : 0), 0.49, 0.33, 0.51, (hx(i + 7) - 0.5) * (lv ? 0.2 : 0.14), col, 3, CLOTHS[[1, 3, 1, 2][Math.floor(hx(i + 19) * 3.99)]]); }
    } else if (L.kind === 3) {
      // coils of rope, each four turns high, and a third leaning on them
      for (let i = 0; i < 2; i++) { const cx = x + (i - 0.5) * 1.1, col = mul(rope, t * (0.85 + 0.2 * hx(i)));
        for (let k = 0; k < 4; k++) B.cyl(cx, z, 0.34 - 0.02 * k, 0.325 - 0.02 * k, Y + k * 0.1, Y + k * 0.1 + 0.1, 8, mul(col, 1 - 0.1 * (k % 2)), SF.TIMBER, k === 3);
        B.cyl(cx, z, 0.15, 0.15, Y + 0.4, Y + 0.41, 8, [0.12, 0.1, 0.08], SF.TIMBER, true); }
    } else if (L.kind === 4) {
      // baskets: four, and two set on them, heaped
      for (let i = 0; i < 6; i++) { const lv = i < 4 ? 0 : 1, bx = x + (lv ? (i - 4.5) * 1.12 : (i - 1.5) * 0.56), y = Y + lv * 0.36; B.cyl(bx, z, 0.2, 0.27, y, y + 0.36, 7, mul(STRAW, t * (i % 2 ? 1 : 0.78)), SF.BRONZE, false); B.cyl(bx, z, 0.26, 0.06, y + 0.34, y + 0.48, 6, FRUIT[(i + L.turn) % 4], SF.BRONZE); }
    } else if (L.kind === 5) {
      // jars stacked in two tiers (r9: a stand of two floors of planks on four posts): twelve of the quay's jars on the
      // lower floor, 0.14 m over the paving, 0.21 m of air and more from their mouths to the upper floor, six more on
      // that; the posts stand from the paving to the upper floor's underside and pass through the lower floor, which
      // is typed whole (no end shows; it reads as laid round them)
      const tim = mul(QWOOD, 0.7 * t), plank = mul(QWOOD, t);
      for (let i = 0; i < 12; i++) jarQ(B, x - 0.66 + 0.44 * (i % 4), Y + 0.14, z - 0.44 + 0.44 * Math.floor(i / 4), 0.84 + 0.06 * hx(i), mul(CLAY, t * (0.85 + 0.25 * hx(i + 11))), 6);
      for (const sx of [-1.0, 1.0]) for (const sz of [-0.75, 0.75]) B.beam([x + sx, Y, z + sz], [x + sx, Y + 1.24, z + sz], 0.09, tim, SF.TIMBER, 0.09, false);
      B.box(x - 1.08, Y + 0.08, z - 0.83, x + 1.08, Y + 0.14, z + 0.83, plank, SF.TIMBER, 'xXyYzZ');
      B.box(x - 1.08, Y + 1.24, z - 0.83, x + 1.08, Y + 1.3, z + 0.83, plank, SF.TIMBER, 'xXyYzZ');
      for (let i = 0; i < 6; i++) jarQ(B, x - 0.5 + 0.5 * (i % 3), Y + 1.3, z - 0.25 + 0.5 * Math.floor(i / 3), 0.81 + 0.07 * hx(i + 20), mul(CLAY, t * (0.85 + 0.25 * hx(i + 31))), 6);
    } else if (L.kind === 6) {
      // baulks of timber on two bearers: four, three and two (r9: each a squared baulk whose four long faces run
      // unbroken from end to end, its two sawn ends a step lighter)
      for (const sx of [-0.8, 0.8]) B.box(x + sx - 0.08, Y, z - 0.75, x + sx + 0.08, Y + 0.12, z + 0.75, mul(COL.timber, 1.2), SF.TIMBER, 'xXzZY');
      for (let i = 0; i < 9; i++) { const lv = i < 4 ? 0 : i < 7 ? 1 : 2, k = lv === 0 ? i - 1.5 : lv === 1 ? i - 5 : i - 7.5, len = 2.0 + 0.4 * hx(i), y = Y + 0.12 + 0.15 + lv * 0.3, off = 0.25 * (hx(i + 5) - 0.5);
        const zc = z + k * 0.33; B.beam([x - len / 2 + off, y, zc], [x + len / 2 + off, y, zc], 0.3, mul(QWOOD, t * (0.82 + 0.36 * hx(i + 9))), SF.BRONZE, 0.3, false);
        B.box(x - len / 2 + off, y - 0.15, zc - 0.15, x + len / 2 + off, y + 0.15, zc + 0.15, mul(QWOOD, t * (1.2 + 0.25 * hx(i + 13))), SF.TIMBER, 'xX'); }
    } else if (L.kind === 7) {
      // a loaded hand cart, its shafts down toward the kerb (never across the round's turn, which passes west of the lot)
      handCart(B, x - 0.35, Y, z, 1, t, L.turn % 2);
    } else {
      // bales three high: four, two and one
      // (r9) bound bales as in the lot of three; the four turned by 2 degrees at most, the two on them by 5, the one on
      // top by 10.3 (0.18 radians)
      for (let i = 0; i < 7; i++) { const lv = i < 4 ? 0 : i < 6 ? 1 : 2, sx = x + (lv === 0 ? (i % 2 - 0.5) * 1.06 : lv === 1 ? (i - 4.5) * 1.06 : 0.1), sz = z + (lv === 0 ? (Math.floor(i / 2) - 0.5) * 0.74 : 0.05 * (i % 2)), y = Y + lv * 0.54, col = mul(mix3(JUTE, SACK, 0.35), t * (0.7 + 0.25 * hx(i)));
        bale(B, sx, y, sz, 0.49, 0.33, 0.51, (hx(i + 7) - 0.5) * (lv === 2 ? 0.36 : lv ? 0.16 : 0.06), col, 3, CLOTHS[[1, 3, 1, 2][Math.floor(hx(i + 19) * 3.99)]]); }
    }
  }
  // the stall's frame behind the north crowd: four posts, the awning's bars, its awning in two dyes, a board on trestles
  // with its wares; and the hand cart beside it, its shafts down toward the landing
  { const s = lay.wayStall, x = s.x, z = s.z, tim = mul(QWOOD, 0.8), dye = STALL_DYES[s.tint], white = STALL_DYES[4];
    for (const sx of [-1.5, 1.5]) { B.beam([x + sx, Y, z + 0.95], [x + sx, Y + 2.3, z + 0.95], 0.08, tim, SF.TIMBER); B.beam([x + sx, Y, z - 0.95], [x + sx, Y + 2.75, z - 0.95], 0.08, tim, SF.TIMBER); B.beam([x + sx, Y + 2.75, z - 0.95], [x + sx, Y + 2.3, z + 0.95], 0.06, tim, SF.TIMBER); }
    for (const [sz, y] of [[0.95, 2.3], [-0.95, 2.75]]) B.beam([x - 1.5, Y + y, z + sz], [x + 1.5, Y + y, z + sz], 0.06, tim, SF.TIMBER);
    Bcl.grid(6, 3, (u, v) => [x - 1.65 + 3.3 * u, Y + lerp(2.81, 2.3, v) + 0.03 - 0.1 * Math.sin(u * Math.PI) * Math.sin(v * Math.PI), z - 1.1 + 2.2 * v], (u) => (Math.round(u * 6) % 2 ? white : dye), SF.CLOTH, false, (u, v) => [0.03 + 0.06 * Math.sin(u * Math.PI), x + u * 3 + v * 2]);
    B.box(x - 1.2, Y + 0.78, z - 0.35, x + 1.2, Y + 0.86, z + 0.35, tim, SF.TIMBER, 'xXyYzZ');
    for (const sx of [-1.0, 1.0]) for (const sz of [-0.25, 0.25]) B.beam([x + sx, Y, z + sz], [x + sx, Y + 0.78, z + sz], 0.07, tim, SF.TIMBER);
    for (let k = 0, xx = x - 0.95; xx < x + 1.0; xx += 0.42, k++) {
      if (s.goods === 0) amphora(B, xx, Y + 0.86, z, 0.45, mul(CLAY, 0.85 + 0.2 * (k % 2)));
      else if (s.goods === 1) { B.cyl(xx, z, 0.14, 0.18, Y + 0.86, Y + 1.0, 6, k % 2 ? STRAW : mul(STRAW, 0.75), SF.BRONZE, false); B.cyl(xx, z, 0.17, 0.04, Y + 0.98, Y + 1.11, 5, FRUIT[(k + s.tint) % 4], SF.BRONZE); }
      else B.box(xx - 0.17, Y + 0.86, z - 0.2, xx + 0.17, Y + 0.95 + 0.05 * (k % 3), z + 0.2, STALL_DYES[(k + s.tint + 1) % 5], SF.CLOTH, 'xXzZY');
    }
    handCart(B, s.cart[0], Y, s.cart[1], 1, 1, s.load); }
  // (r9) the stall's frame and the landing's two mooring posts stand in the quay's wood
  // the landing's two mooring posts: timber, a turn of rope round each; 2.2 m to each hand of the fairway's end. (The
  // south one stays typed: the fairway's end and 2.2 m more comes out 1.2000000000000002, a last bit off r7's 1.2.)
  for (const z of [FAIRWAY.pts[4][1] - 2.2, 1.2]) { const x = QUAY_X1 - 0.6; B.cyl(x, z, 0.13, 0.11, Y, Y + 0.92, 7, mul(QWOOD, 0.9), SF.TIMBER); B.cyl(x, z, 0.16, 0.16, Y + 0.5, Y + 0.64, 7, [0.5, 0.42, 0.28], SF.TIMBER, false); }
  // (r9) the kerb's mooring stones stand at five sides
  const stone = mul(COL.stoneDark, 0.9);
  for (let z = -129; z <= 292; z += 10.5) for (const dz of [-2.6, 2.6]) if (Math.abs(z + dz - SLIP.z) > SLIP.half + 0.5 && fairGap(QUAY_X1, z + dz) > 0) B.cyl(QUAY_X1 - 0.75, z + dz, 0.2, 0.24, Y, Y + 0.62, 5, stone, SF.MARBLE);
  // the two hauling ropes: from the quarters of the hull on the slip to the first man's hands, and on through the gang's hands
  { const h = lay.merchants.find((m) => m.kind === 'hauled'), gang = lay.people.filter((q) => q.habit === 2), rope = [0.5, 0.42, 0.28], c = Math.cos(h.tilt), sn = Math.sin(h.tilt);
    const xe = gang.reduce((m, q) => Math.min(m, q.x), SLIP.x0) - 0.5, lx = -h.len * 0.42, ly = 2.3;
    for (const sg of [-1, 1]) { const hand = [SLIP.x0 - 0.3, Y + 1.05, SLIP.z + sg * 0.85]; B.beam([h.x + lx * c + ly * sn, h.lift - lx * sn + ly * c, SLIP.z + sg * 0.9], hand, 0.06, rope, SF.TIMBER); B.beam(hand, [xe, Y + 1.02, SLIP.z + sg * 0.85], 0.06, rope, SF.TIMBER); } }
  for (const m of lay.merchants) if (m.kind === 'moored' && !m.broadside) for (const dz of [-2.6, 2.6]) { const k = Math.round((m.z + 129) / 10.5), zb = -129 + k * 10.5 + dz; B.beam([QUAY_X1 - 0.75, Y + 0.5, zb], [m.x - m.len / 2 + 0.5, 2.25, m.z + dz * 0.25], 0.05, [0.5, 0.42, 0.28], SF.TIMBER); }
  // the ship at the gate's berth: a line from her bow and one from her stern to the quay's posts, and the gangplank (two
  // planks on bearers, 1.3 m wide) from the quay over the kerb to her cargo
  { const g = lay.gateShip, rope = [0.5, 0.42, 0.28], post = (z) => -129 + Math.round((z + 129) / 10.5) * 10.5, pl = mul(COL.timber, 1.9);
    B.beam([QUAY_X1 - 0.75, Y + 0.5, post(g.z - 10) - 2.6], [g.x - 1.2, 2.5, g.z - g.len / 2 + 1.0], 0.05, rope, SF.TIMBER);
    B.beam([QUAY_X1 - 0.75, Y + 0.5, post(g.z + 10) + 2.6], [g.x - 1.4, 2.9, g.z + g.len / 2 - 1.0], 0.05, rope, SF.TIMBER);
    const ya = Y + PLANK.rise;
    for (const dz of [-0.33, 0.33]) {
      B.quad([PLANK.x0, Y + 0.02, PLANK.z + dz + 0.31], [PLANK.x1, ya, PLANK.z + dz + 0.31], [PLANK.x1, ya, PLANK.z + dz - 0.31], [PLANK.x0, Y + 0.02, PLANK.z + dz - 0.31], pl, SF.TIMBER, mul(pl, 0.5));
      B.box(PLANK.x1, ya - 0.07, PLANK.z + dz - 0.31, PLANK.x2, ya, PLANK.z + dz + 0.31, pl, SF.TIMBER, 'XYzZy');
    }
    for (const x of [PLANK.x1 + 0.2, (PLANK.x1 + PLANK.x2) / 2, PLANK.x2 - 0.2]) B.box(x - 0.06, ya - 0.14, PLANK.z - 0.7, x + 0.06, ya - 0.07, PLANK.z + 0.7, COL.timber, SF.TIMBER, 'xXzZy'); }
  for (const n of lay.nets) {
    for (const dz of [-n.len / 2, n.len / 2]) { B.beam([n.x - 0.3, Y, n.z + dz], [n.x, Y + 2.0, n.z + dz], 0.07, COL.timber, SF.TIMBER); B.beam([n.x + 0.3, Y, n.z + dz], [n.x, Y + 2.0, n.z + dz], 0.07, COL.timber, SF.TIMBER); }
    B.beam([n.x, Y + 1.98, n.z - n.len / 2 - 0.2], [n.x, Y + 1.98, n.z + n.len / 2 + 0.2], 0.06, COL.timber, SF.TIMBER);
    for (const sg of [-1, 1]) Bcl.grid(1, 5, (u, v) => [n.x + sg * (0.03 + 0.42 * u), Y + 1.96 - 1.5 * u, n.z + (v - 0.5) * n.len], (u, v) => mul([0.3, 0.26, 0.19], 0.8 + 0.4 * ((Math.round(v * 5) + (sg > 0 ? 1 : 0)) % 2)), SF.CLOTH, sg < 0, (u, v) => [0.015 + 0.07 * u, n.ph + v * 6]);
  }
}
// A HAND CART (r7; ours): a bed of planks 1.7 by 0.95 m with two side boards on two wheels of half a metre, its two
// shafts down on the paving toward dir (+1: toward +X); load 0: three sacks, 1: jars standing in the bed
// (r9) it stands in the quay's wood: bed, boards and shafts QWOOD times its tone, tread and axle 0.55 of QWOOD; its
// three sacks are plain blocks in the sacks' warm cloth, half sacking and half jute
function handCart(B, x, y, z, dir, tone, load) {
  const tim = mul(QWOOD, tone), dark = mul(QWOOD, 0.55);
  B.box(x - 0.85, y + 0.62, z - 0.47, x + 0.85, y + 0.7, z + 0.47, tim, SF.TIMBER, 'xXyYzZ');
  for (const sz of [-0.47, 0.41]) B.box(x - 0.85, y + 0.7, z + sz, x + 0.85, y + 0.98, z + sz + 0.06, tim, SF.TIMBER, 'xXYzZ');
  B.box(x - dir * 0.85 - 0.03, y + 0.7, z - 0.41, x - dir * 0.85 + 0.03, y + 0.98, z + 0.41, tim, SF.TIMBER, 'xXY');
  // (r9) each wheel a pale disc of planks in its dark tread; the axle's dark end is its hub
  for (const sz of [-1, 1]) {
    const cz = z + sz * 0.56, cx = x - dir * 0.1, cy = y + 0.5;
    for (let i = 0; i < 8; i++) {
      const a0 = i / 8 * 6.2832, a1 = (i + 1) / 8 * 6.2832, p0 = [cx + Math.cos(a0) * 0.5, cy + Math.sin(a0) * 0.5], p1 = [cx + Math.cos(a1) * 0.5, cy + Math.sin(a1) * 0.5];
      B.tri([cx, cy, cz + 0.035], [p0[0], p0[1], cz + 0.035], [p1[0], p1[1], cz + 0.035], mul(tim, 1.5), SF.TIMBER);
      B.tri([cx, cy, cz - 0.035], [p1[0], p1[1], cz - 0.035], [p0[0], p0[1], cz - 0.035], mul(tim, 1.5), SF.TIMBER);
      B.quad([p0[0], p0[1], cz - 0.035], [p1[0], p1[1], cz - 0.035], [p1[0], p1[1], cz + 0.035], [p0[0], p0[1], cz + 0.035], dark, SF.TIMBER);
    }
    B.beam([x + dir * 0.85, y + 0.66, z + sz * 0.4], [x + dir * 2.4, y + 0.05, z + sz * 0.4], 0.07, tim, SF.TIMBER);
  }
  B.beam([x - dir * 0.1, y + 0.5, z - 0.6], [x - dir * 0.1, y + 0.5, z + 0.6], 0.08, dark, SF.TIMBER);
  // (r9) a loaded cart's six jars are the quay's jar
  if (load) for (let i = 0; i < 6; i++) jarQ(B, x - 0.55 + 0.55 * (i % 3), y + 0.7, z - 0.2 + 0.4 * Math.floor(i / 3), 0.8, mul(CLAY, tone * (0.85 + 0.1 * (i % 3))), 5);
  else for (let i = 0; i < 3; i++) B.box(x - 0.75 + 0.5 * i, y + 0.7 + (i === 1 ? 0.3 : 0), z - 0.36, x - 0.2 + 0.5 * i - (i === 1 ? 0.05 : 0), y + 1.02 + (i === 1 ? 0.3 : 0), z + 0.36, mul(mix3(SACK, JUTE, 0.5), tone * (0.9 + 0.1 * i)), SF.CLOTH, 'xXzZY');
}
// a harbour rowing boat with two men at the oars (bow toward +X, waterline y 0)
function rowingBoat(B) {
  const L = 5.2, half = (t) => 0.78 * Math.pow(Math.max(1 - Math.pow(Math.abs(2 * t - 1), 2.4), 0), 0.5), sheer = (t) => 0.42 + 0.3 * Math.pow(Math.abs(2 * t - 1), 2.4);
  for (const sg of [1, -1]) B.grid(6, 2, (u, v) => [(u - 0.5) * L, lerp(-0.3 * (1 - Math.pow(Math.abs(2 * u - 1), 3)), sheer(u), v), sg * half(u) * Math.pow(v, 0.5)], (u, v) => (v > 0.75 ? WHITE : PITCH), PF.PAINT, sg < 0);
  B.grid(4, 1, (u, v) => [(0.08 + u * 0.84 - 0.5) * L, 0.12, (v * 2 - 1) * half(0.08 + u * 0.84) * 0.8], DECK, SF.TIMBER, true);
  for (const x of [-0.7, 0.6]) {
    B.box(x - 0.12, 0.32, -0.7, x + 0.12, 0.38, 0.7, DECK, SF.TIMBER, 'xXY'); seatFigure(B, x, 0.38, 0, LINEN, SKIN[x > 0 ? 0 : 1]);
    for (const sg of [-1, 1]) B.beam([x - 0.42, 0.72, sg * 0.3], [x + 0.3, 0.02, sg * 2.5], 0.06, SPAR, SF.TIMBER);
  }
}
// a man of true size seated on a thwart whose top is at y, facing -X (a rower faces aft): thighs level, shins down, the body
// leaning a little to the oars, both arms out to the looms
function seatFigure(B, x, y, z, tunic, skin) {
  B.box(x - 0.46, y, z - 0.19, x + 0.1, y + 0.15, z + 0.19, tunic, 0, 'xXzZY');
  for (const sg of [-1, 1]) B.box(x - 0.52, y - 0.36, z + sg * 0.11 - 0.06, x - 0.4, y + 0.02, z + sg * 0.11 + 0.06, skin, 0, 'xXzZ');
  B.beam([x, y + 0.12, z], [x - 0.1, y + 0.62, z], 0.36, tunic, 0, 0.22);
  B.box(x - 0.21, y + 0.66, z - 0.09, x - 0.03, y + 0.89, z + 0.09, skin, 0, 'xXzZY');
  for (const sg of [-1, 1]) B.beam([x - 0.1, y + 0.56, z + sg * 0.2], [x - 0.42, y + 0.36, z + sg * 0.28], 0.08, skin, 0);
}

// far land as strips on the horizon in the dawn's colours: the mainland's long mountains to the north and north west, dusky
// under the rose band (no higher than 3.3 degrees); the island's own hills south west, taking the first sun
function farLand(noise) {
  const pos = [], col = [], idx = [];
  const strip = (b0, b1, R, hLo, hHi, top, base, seedK) => {
    const n = Math.round((b1 - b0) / 1.1), start = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const bearing = (b0 + (b1 - b0) * i / n) * Math.PI / 180, x = Math.sin(bearing) * R, z = -Math.cos(bearing) * R, e = Math.min(i, n - i) / 9;
      const hh = (hLo + (hHi - hLo) * (0.5 + 0.5 * noise.fbm2(i * 0.045 + seedK, seedK * 3.1, 4))) * smoothstep(0, 1, e);
      pos.push(x, -12, z, x, hh, z); col.push(base[0], base[1], base[2], top[0], top[1], top[2]);
      if (i < n) { const a = start + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
  };
  strip(-76, 44, 3550, 70, 205, [0.3, 0.31, 0.5], [0.62, 0.5, 0.56], 1.7);
  strip(-70, 38, 3350, 30, 105, [0.26, 0.28, 0.45], [0.58, 0.47, 0.54], 9.3);
  strip(168, 292, 3300, 50, 185, [0.5, 0.4, 0.42], [0.66, 0.52, 0.55], 5.1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- things that move or are drawn many times: one lit program
// Kinds: SF.TIMBER draws strakes along the piece; kinds 20 and over take the instance's own colour (paint, cloth).
// The `wave` attribute (amplitude in metres, phase) stirs cloth along its normal in the one wind, and the folds' light and
// shade travel over it with the stir (the slope of the same wave: up to three parts in ten lighter and darker where it stirs most).
const PF = { PAINT: 20, CLOTH: 21 };
// Cloth (sails, awnings, washing, hangings) lets the low sun through and scatters it: its far side takes six parts in ten of
// the sun as well, and three parts in ten of that reach it whichever way it is turned. (uSunW is the unit direction to the
// sun; the view matrix only turns it, so it needs no normalize.)
function propMaterial(tU, sunC, U) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  // (BROUGHT IN, see the head: pHash, in the fragment program's text below. This comment stands outside that text
  // and outside onBeforeCompile.)
  m.onBeforeCompile = (sh) => {
    dawnInto(sh, U); sh.uniforms.uTime = tU; sh.uniforms.uSunC = { value: sunC };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float surf; attribute vec2 wave; uniform float uTime; varying float vSurf; varying vec3 vOp; varying vec3 vWp; varying float vFold;\n#ifdef USE_INSTANCING\nattribute vec3 iTint;\n#endif')
      .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 wp4 = vec4(transformed, 1.);\n#ifdef USE_INSTANCING\n wp4 = instanceMatrix * wp4;\n#endif\n vWp = (modelMatrix * wp4).xyz; }')
      .replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_INSTANCING\nvColor.rgb *= mix(vec3(1.), iTint, step(19.5, surf) * (surf > 20.5 ? 0.3 : 1.));\n#endif')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurf = surf; vOp = position;\ntransformed += objectNormal * wave.x * (0.6 * sin(uTime * 1.6 + wave.y) + 0.4 * sin(uTime * 3.7 + wave.y * 1.7 + position.y * 1.3 + position.z * 0.9));\nvFold = clamp(wave.x * 8., 0., 0.32) * (0.6 * cos(uTime * 1.6 + wave.y) + 0.4 * cos(uTime * 3.7 + wave.y * 1.7 + position.y * 1.3 + position.z * 0.9));');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nif ((vSurf > 8.5 && vSurf < 9.5) || vSurf > 20.5) reflectedLight.directDiffuse += diffuseColor.rgb * uSunC * (0.6 * RECIPROCAL_PI * (0.3 + 0.7 * max(dot(-normal, (viewMatrix * vec4(uSunW, 0.)).xyz), 0.)));\nreflectedLight.directDiffuse *= dawnSun(vWp.y); reflectedLight.indirectDiffuse *= 1. + FIRST_STREET_FILL * dawnFill(vWp);')
      .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uHazeCol, dawnHaze(vWp, cameraPosition));')
      .replace('#include <common>', '#include <common>\n' + DAWN_GLSL + '\nuniform vec3 uSunC;\nvarying float vSurf; varying vec3 vOp; varying vec3 vWp; varying float vFold;\nfloat pHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }\nfloat pNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(pHash(i), pHash(i + vec2(1., 0.)), f.x), mix(pHash(i + vec2(0., 1.)), pHash(i + vec2(1., 1.)), f.x), f.y); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ float k = 0.9 + 0.2 * pNoise(vOp.xy * 1.7 + vOp.z);\n if (vSurf > 4.5 && vSurf < 5.5) { float fw = fwidth(vOp.y); float seam = smoothstep(0.02, 0.1 + fw * 2., abs(fract(vOp.y / 0.26) - 0.5) * 2.); k *= mix(1., 0.72 + 0.28 * seam, clamp(1. - fw * 6., 0., 1.)); }\n diffuseColor.rgb *= k * (1. + vFold); }');
  };
  m.customProgramCacheKey = () => 'colossus-prop-9';
  return m;
}

// a course on the ground or the water: a polyline, closed or open, walked by arc length
function makeCourse(pts, closed = true, turn = 0) {
  const n = pts.length, seg = closed ? n : n - 1, cum = [0];
  for (let i = 0; i < seg; i++) { const a = pts[i], b = pts[(i + 1) % n]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const length = cum[seg];
  const dirOf = (i) => { const a = pts[((i % n) + n) % n], b = pts[(((i + 1) % n) + n) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  return {
    pts, length, closed,
    // out: [x, z, hx, hz] at s metres along (wrapped on a closed course, held at the ends of an open one)
    at(s, out) {
      s = closed ? ((s % length) + length) % length : clamp(s, 0, length);
      let i = 0; while (i < seg - 1 && cum[i + 1] < s) i++;
      const a = pts[i], b = pts[(i + 1) % n], t = (s - cum[i]) / Math.max(1e-6, cum[i + 1] - cum[i]);
      out[0] = lerp(a[0], b[0], t); out[1] = lerp(a[1], b[1], t);
      // the heading turns evenly through each corner
      const d0 = dirOf(i), dp = closed || i > 0 ? dirOf(i - 1) : d0, dn = closed || i < seg - 1 ? dirOf(i + 1) : d0;
      // (over half of each piece, or within `turn` metres of a corner where the course gives one: walkers turn on the spot they turn on)
      const sl = cum[i + 1] - cum[i], ta = turn ? clamp((s - cum[i]) / turn, 0, 1) : Math.min(1, t * 2), tb = turn ? clamp((cum[i + 1] - s) / turn, 0, 1) : Math.min(1, 2 - t * 2);
      let hx, hz; if (t < 0.5 && (!turn || sl > 2 * turn || ta < tb)) { hx = lerp((dp[0] + d0[0]) / 2, d0[0], ta); hz = lerp((dp[1] + d0[1]) / 2, d0[1], ta); } else { hx = lerp((dn[0] + d0[0]) / 2, d0[0], tb); hz = lerp((dn[1] + d0[1]) / 2, d0[1], tb); }
      const hl = Math.hypot(hx, hz) || 1; out[2] = hx / hl; out[3] = hz / hl;
      return out;
    },
  };
}
// a closed walk round a rectangle with its corners rounded (r metres); dir +1 or -1
const rectPts = (x0, z0, x1, z1, dir = 1, r = 0.8) => {
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1), p = [];
  const corner = (cx, cz, a0) => { for (let i = 0; i <= 3; i++) { const a = a0 + i / 3 * Math.PI / 2; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  corner(xb - r, zb - r, 0); corner(xa + r, zb - r, Math.PI / 2); corner(xa + r, za + r, Math.PI); corner(xb - r, za + r, Math.PI * 1.5);
  return dir > 0 ? p : p.reverse();
};
// a round of two straight reaches (each 2 * half long, along the unit (ux, uz)) joined by two half circles of radius R (n pieces to each)
const stadiumPts = (cx, cz, ux, uz, half, R, n, dir = 1) => {
  const p = [];
  for (const e of [1, -1]) for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI, c = e * (half + Math.cos(a) * R), sn = e * Math.sin(a) * R; p.push([cx + ux * c - uz * sn, cz + uz * c + ux * sn]); }
  return dir > 0 ? p : p.reverse();
};
const ovalPts = (cx, cz, ax, az, n, dir = 1) => { const p = []; for (let i = 0; i < n; i++) { const a = dir * i / n * Math.PI * 2; p.push([cx + Math.cos(a) * ax, cz + Math.sin(a) * az]); } return p; };

// ---------------------------------------------------------------- the mirror on the harbour's water (ours)
// The kit's ocean mirrors the sky alone. So each hull, the great quay's face and the harbour wall with its towers have a
// PLAIN BODY of a few faces (mirrorMerchant, mirrorGalley, mirrorBoat, mirrorFront), coloured as the thing stands in the
// morning's light, and the mirror's material lays each body's image on the water: every point is turned down under the
// sea's level and laid where the straight line from the eye to that mirrored point meets the water, which is where a
// mirror's image lies from every place of the eye (a law that goes by the eye's place: section 153, named at the head
// as (b)). The image is as strong as water mirrors at the slant from the water to the eye (strong at a grazing slant,
// faint from straight above), wavers sideways (square to the eye's bearing) with the swell and is broken by a moving
// ripple at every height, the more the higher the mirrored point stands over the water, and fades to half with that
// height (r7: a tall thing's image never passes whole); the ripple's bands go by the pixel's own
// depth on the water (a filter by a pixel's footprint: (f) at the head). `lift` is the height over the sea's level at
// which an image is laid
// (a hand over it, and drawn a pixel's depth nearer, so that the swell's crests do not cut it): the nearer things' images
// lie two fingers higher and are drawn first, so that a hull's image hides the quay's and the quay's hides the wall's,
// as the things themselves do. The wakes and the foam lie over the images.
const MIRROR = { ships: 0.1, quay: 0.08, wall: 0.06 };
function mirrorMaterial(tU, U, lift) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  // (BROUGHT IN, see the head: mHash, in the fragment program's text below. This comment stands outside that text
  // and outside onBeforeCompile.)
  m.onBeforeCompile = (sh) => {
    dawnInto(sh, U); sh.uniforms.uTime = tU; sh.uniforms.uLift = { value: lift }; sh.uniforms.uSeaBody = { value: new THREE.Vector3(0.02, 0.05, 0.14) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uLift; varying vec3 vMp; varying vec3 vMw;')
      .replace('#include <project_vertex>', `vec4 mw = vec4(transformed, 1.);
#ifdef USE_INSTANCING
      mw = instanceMatrix * mw;
#endif
      mw = modelMatrix * mw; mw.y = max(mw.y, 0.);
      // (the waver's hand, square to the eye's bearing; the bearing is nought for a mirrored point plumb under the eye,
      // and such a point keeps its place: no normalize of nought)
      vec3 mm = vec3(mw.x, -mw.y, mw.z), ms = vec3(mm.z - cameraPosition.z, 0., cameraPosition.x - mm.x);
      vec3 mside = dot(ms, ms) > 0. ? normalize(ms) : vec3(0.);
      mm += mside * (0.03 * mw.y * sin(mw.y * 1.3 + uTime * 1.7 + (mw.x + mw.z) * 0.21));
      vec3 mp = cameraPosition + (mm - cameraPosition) * ((cameraPosition.y - uLift) / max(cameraPosition.y - mm.y, 0.001));
      vMp = mp; vMw = mw.xyz;
      vec4 mvPosition = viewMatrix * vec4(mm, 1.);
      gl_Position = projectionMatrix * (viewMatrix * vec4(mp, 1.));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + DAWN_GLSL + `
uniform float uTime; uniform vec3 uSeaBody; varying vec3 vMp; varying vec3 vMw;
float mHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float mNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(mHash(i), mHash(i + vec2(1., 0.)), f.x), mix(mHash(i + vec2(0., 1.)), mHash(i + vec2(1., 1.)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { vec3 me = cameraPosition - vMp;
        // (the slant from the water to the eye; nought only for an eye that lies in the image's own plane at this very
        // point, which then counts as straight above: no normalize of nought)
        vec3 mv = dot(me, me) > 0. ? normalize(me) : vec3(0., 1., 0.);
        float fres = 0.02 + 0.98 * pow(1. - clamp(mv.y, 0., 1.), 5.);
        // the ripple that breaks the image: bands across the look, a few pixels deep at every distance (the band's depth
        // goes by the pixel's own depth on the water, in steps of two, each step fading into the next)
        float foot = length(dFdy(vMp.xz)) + 0.3 * length(dFdx(vMp.xz)), lv = log2(max(foot * 4.5, 1.)), l0 = floor(lv);
        vec2 q0 = vMp.xz * vec2(1.5, 0.4) / exp2(l0), dr = vec2(uTime * 0.4, -uTime * 0.16);
        float n = mix(0.6 * mNoise(q0 + dr) + 0.4 * mNoise(q0 * 2.6 - dr * 1.7), 0.6 * mNoise(q0 * 0.5 + dr) + 0.4 * mNoise(q0 * 1.3 - dr * 1.7), lv - l0);
        // THE BREAK GOES BY THE MIRRORED POINT'S HEIGHT ALONE (r7; the thing's own rule, by place and height, nothing of
        // the eye's distance or the metres flown): the ripple's noise is stretched to its whole range before the cut, so
        // that it breaks an image at every height; from 0 to 4 m over the water finer flecks (the same bands, 2.4 times as
        // fine, faded from step to step as the bands are) come in across it; the cut rises from 0.3 at the water to 0.72 at
        // 12 m and the image fades to half over the same 12 m: no part of a tall thing's image passes whole.
        float hgt = smoothstep(0., 12., vMw.y);
        vec2 qf = vMp.xz * 2.4 / exp2(l0);
        float fleck = smoothstep(0.35, 0.6, mix(mNoise(qf + dr * 1.3), mNoise(qf * 0.5 + dr * 1.3), lv - l0));
        float nn = smoothstep(0.3, 0.7, n) * mix(1., fleck, smoothstep(0., 4., vMw.y));
        float thr = mix(0.3, 0.72, hgt);
        diffuseColor.rgb = mix(uSeaBody, diffuseColor.rgb, clamp(fres * 1.3, 0., 1.));
        // (the swash at the great quay's foot breaks the image: it fades out over the last 3.5 m before the quay's face)
        diffuseColor.a *= 0.78 * mix(1., 0.5, hgt) * smoothstep(thr - 0.15, thr + 0.15, nn) * smoothstep(0.02, 0.2, fres) * smoothstep(0.3, 3.5, vMp.x - ${QUAY_X1.toFixed(1)}); }`)
      .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uHazeCol, dawnHaze(vMw, cameraPosition));');
  };
  m.customProgramCacheKey = () => 'colossus-mirror-6';
  return m;
}
// the plain bodies (a ship's own frame: bow toward +X, waterline y 0; the same measures as the ships' own builders)
function mirrorMerchant(B, L, set, part, lit) {
  const c = (a) => [a[0] * lit[0], a[1] * lit[1], a[2] * lit[2]];
  const xm = L * 0.05, H = L * 0.6 + 2, yY = H - 0.9, Ly = L * 0.56, px = part === 2 ? 0.2 : xm + 0.2, fb = 1.3 + L * 0.02;
  if (part !== 1) {
    const hs = set ? yY - (fb + 1.5) : 0.6, n = set ? 6 : 1, x = px + (set ? 0.6 : 0);
    for (let i = 0; i < n; i++) B.quad([x, yY - hs * (i + 1) / n, -Ly * 0.47], [x, yY - hs * (i + 1) / n, Ly * 0.47], [x, yY - hs * i / n, Ly * 0.47], [x, yY - hs * i / n, -Ly * 0.47], c(LINEN));
    if (part === 2) return;
  }
  const Bm = L * 0.29, a = (t) => Math.abs(2 * t - 1), half = (t) => Bm / 2 * Math.pow(Math.max(1 - Math.pow(a(t), 2.3), 0), 0.55), sheer = (t) => fb + (t < 0.5 ? 1.5 : 1.0) * Math.pow(a(t), 2.6);
  const us = [0.01, 0.2, 0.5, 0.8, 0.99], hull = c(mul(PITCH, 1.15)), spar = c(SPAR);
  for (const sg of [1, -1]) for (let i = 0; i < 4; i++) { const u0 = us[i], u1 = us[i + 1]; B.quad([(u0 - 0.5) * L, 0, sg * half(u0)], [(u1 - 0.5) * L, 0, sg * half(u1)], [(u1 - 0.5) * L, sheer(u1), sg * half(u1)], [(u0 - 0.5) * L, sheer(u0), sg * half(u0)], hull); }
  for (let i = 0; i < 4; i++) { const y0 = lerp(fb, H, i / 4), y1 = lerp(fb, H, (i + 1) / 4); B.quad([xm - 0.17, y0, 0], [xm + 0.17, y0, 0], [xm + 0.17, y1, 0], [xm - 0.17, y1, 0], spar); B.quad([xm, y0, -0.17], [xm, y0, 0.17], [xm, y1, 0.17], [xm, y1, -0.17], spar); }
}
function mirrorGalley(B, lit) {
  const c = (a) => [a[0] * lit[0], a[1] * lit[1], a[2] * lit[2]], L = WAR.L, a = (t) => Math.abs(2 * t - 1);
  const half = (t) => 2.0 * Math.pow(Math.max(1 - Math.pow(a(t), 4), 0), 0.6), sheer = (t) => 2.15 + (t < 0.5 ? 2.3 * Math.pow(a(t), 3.4) : 0.95 * Math.pow(a(t), 3));
  const us = [0.01, 0.12, 0.3, 0.5, 0.75, 0.92, 0.99], hull = c(mul(PITCH, 1.15)), spar = c(SPAR), sx = -L / 2, sy = sheer(0);
  for (const sg of [1, -1]) {
    for (let i = 0; i < 6; i++) { const u0 = us[i], u1 = us[i + 1]; B.quad([(u0 - 0.5) * L, 0, sg * half(u0)], [(u1 - 0.5) * L, 0, sg * half(u1)], [(u1 - 0.5) * L, sheer(u1), sg * half(u1)], [(u0 - 0.5) * L, sheer(u0), sg * half(u0)], hull); }
    B.quad([-L * 0.33, 1.98, sg * 2.62], [L * 0.31, 1.98, sg * 2.62], [L * 0.31, 2.85, sg * 2.62], [-L * 0.33, 2.85, sg * 2.62], c([0.8, 0.8, 0.8]));
  }
  B.quad([L / 2 - 0.7, 2.4, 0], [L / 2 + 0.3, 2.4, 0], [L / 2 + 0.3, 5, 0], [L / 2 - 0.7, 5, 0], spar);
  B.quad([sx - 0.7, sy - 0.5, 0], [sx + 0.5, sy - 0.5, 0], [sx + 0.5, sy + 2.4, 0], [sx - 0.7, sy + 2.4, 0], spar);
}
function mirrorBoat(B, lit) {
  const c = (a) => [a[0] * lit[0], a[1] * lit[1], a[2] * lit[2]], L = 5.2, a = (t) => Math.abs(2 * t - 1);
  const half = (t) => 0.78 * Math.pow(Math.max(1 - Math.pow(a(t), 2.4), 0), 0.5), sheer = (t) => 0.42 + 0.3 * Math.pow(a(t), 2.4), us = [0.02, 0.5, 0.98], hull = c(mul(PITCH, 1.15));
  for (const sg of [1, -1]) for (let i = 0; i < 2; i++) { const u0 = us[i], u1 = us[i + 1]; B.quad([(u0 - 0.5) * L, 0, sg * half(u0)], [(u1 - 0.5) * L, 0, sg * half(u1)], [(u1 - 0.5) * L, sheer(u1), sg * half(u1)], [(u0 - 0.5) * L, sheer(u0), sg * half(u0)], hull); }
  B.quad([-0.9, 0.4, 0], [0.8, 0.4, 0], [0.8, 1.25, 0], [-0.9, 1.25, 0], c(mul(LINEN, 0.8)));
}
// the harbour front's plain bodies: part 0 the great quay's face (with the slip's cut), part 1 the wall's two runs, the gate's
// block with its dark opening, and the towers with their roofs (laid in that order: what is laid later lies over the earlier)
function mirrorFront(B, lit, part) {
  const c = (a) => [a[0] * lit[0], a[1] * lit[1], a[2] * lit[2]], zA = MOLE_Z - MOLE_W / 2, zB = 300, st = COL.stone;
  const face = (x, z0, z1, y0, y1, col, rows = 1) => { for (let i = 0; i < rows; i++) { const ya = lerp(y0, y1, i / rows), yb = lerp(y0, y1, (i + 1) / rows); B.quad([x, ya, z1], [x, ya, z0], [x, yb, z0], [x, yb, z1], col); } };
  if (part === 0) { face(QUAY_X1, zA, SLIP.z - SLIP.half, 0, QUAY_Y + 0.35, c(mul(st, 0.9))); face(QUAY_X1, SLIP.z + SLIP.half, zB, 0, QUAY_Y + 0.35, c(mul(st, 0.9))); return; }
  const gz = GATE_W / 2, top = QUAY_Y + WALL_H, gTop = QUAY_Y + GATE_H + 1.7;
  face(WALL_X1, zA, -gz - GATE_PIER, QUAY_Y, top, c(st), 4); face(WALL_X1, gz + GATE_PIER, zB, QUAY_Y, top, c(st), 4);
  face(WALL_X1 + 0.3, -gz - GATE_PIER, gz + GATE_PIER, QUAY_Y, gTop, c(mul(st, 1.02)), 3); face(WALL_X1 + 0.32, -gz, gz, QUAY_Y, QUAY_Y + GATE_H, c(mul(st, 0.42)), 2);
  for (let k = -3; k <= 4; k++) for (const sg of k === 0 ? [-1, 1] : [Math.sign(k)]) {
    const zc = sg * (GATE_TOWER_Z + TOWER_W / 2) + (k === 0 ? 0 : k * 60), ty = QUAY_Y + TOWER_H;
    if (zc - TOWER_W / 2 < zA || zc + TOWER_W / 2 > zB) continue;
    face(WALL_X1 + 2, zc - TOWER_W / 2, zc + TOWER_W / 2, QUAY_Y, ty, c(mul(st, 0.97)), 5);
    B.tri([WALL_X1 + 2.7, ty, zc + TOWER_W / 2 + 0.7], [WALL_X1 + 2.7, ty, zc - TOWER_W / 2 - 0.7], [WALL_X1 - 1, ty + 1.3, zc], c(COL.tile[0]));
  }
}

// THE FOAM ROUND THE HULLS (ours): a ring of foam lies on the water along each floating hull's waterline, a short wake
// astern of what is under way (the boats and the ships under sail; a galley's wake is laid along her course), and a patch
// where each of a boat's oars takes the water, coming and going with her stroke. One material: the foam's lace drifts
// along the ring on the world's clock. foam = (metres along, 0..1 across, kind: 0 ring, 1 oar's splash, 2 wake); a ship's
// own iFoam = (her stroke's phase, 1 if she floats, 1 if she is under way).
const FOAM_Y = 0.14;
function foamMaterial(tU) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2.5, polygonOffsetUnits: -2 });
  // (BROUGHT IN, see the head: fHash, in the fragment program's text below. This comment stands outside that text
  // and outside onBeforeCompile.)
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = tU;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 foam; attribute vec3 iFoam; varying vec3 vFoam; varying vec3 vIFoam;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFoam = foam; vIFoam = iFoam;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uTime; varying vec3 vFoam; varying vec3 vIFoam;
float fHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float fNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(fHash(i), fHash(i + vec2(1., 0.)), f.x), mix(fHash(i + vec2(0., 1.)), fHash(i + vec2(1., 1.)), f.x), f.y); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float lace = 0.45 + 0.55 * smoothstep(0.25, 0.75, fNoise(vec2(vFoam.x * 0.8 - uTime * 0.5, vFoam.y * 2.5 + uTime * 0.2)));
        diffuseColor.a *= vFoam.z < 0.5 ? lace * vIFoam.y : vFoam.z < 1.5 ? smoothstep(0.1, 0.9, sin(uTime * 2.1 + vIFoam.x)) * vIFoam.y : lace * vIFoam.z; }`);
  };
  m.customProgramCacheKey = () => 'colossus-foam-2';
  return m;
}
// the foam's geometry for one hull (her own frame): zw(u) is her half breadth at the waterline, u 0 at the stern, 1 at the
// bow; wake: metres of wake astern (0: none); splash: the places where oars take the water ([x, z] each)
function foamGeometry(L, zw, segs, wide, wake = 0, splash = []) {
  const pos = [], col = [], fo = [], idx = [], W = [0.86, 0.93, 0.95];
  const v = (x, z, a, f0, f1, k) => { pos.push(x, FOAM_Y, z); col.push(W[0], W[1], W[2], a); fo.push(f0, f1, k); return pos.length / 3 - 1; };
  for (const sg of [1, -1]) for (let i = 0; i <= segs; i++) {
    const u = i / segs, x = (u - 0.5) * L, z = zw(u), e = Math.abs(2 * u - 1), a = v(x * (1 - 0.3 / L), sg * z * 0.9, 0.7, x * sg, 0, 0), b = v(x * (1 + 2 * wide * e / L), sg * (z + wide), 0, x * sg, 1, 0);
    if (i > 0) idx.push(a - 2, b - 2, a, a, b - 2, b);
  }
  if (wake > 0) for (let i = 0; i <= 4; i++) {
    const t = i / 4, x = -L / 2 + 0.2 - t * wake, hw = lerp(zw(0.12) + 0.1, zw(0.5) * 1.5 + 0.6, t), al = 0.5 * (1 - t) * Math.min(1, t * 6 + 0.4), a = v(x, -hw, al * 0.5, -x, 0, 2), b = v(x, hw, al * 0.5, -x, 1, 2);
    if (i > 0) idx.push(a - 2, b - 2, a, a, b - 2, b);
  }
  for (const [x, z] of splash) { const a = v(x - 0.5, z - 0.32, 0.6, x, 0, 1), b = v(x + 0.5, z - 0.32, 0.6, x, 0, 1), c = v(x + 0.5, z + 0.32, 0.6, x, 1, 1), d = v(x - 0.5, z + 0.32, 0.6, x, 1, 1); idx.push(a, b, c, a, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setAttribute('foam', new THREE.Float32BufferAttribute(fo, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- ships (invented in their details; true to size)
const SKIN = [[0.42, 0.26, 0.17], [0.36, 0.22, 0.14], [0.47, 0.3, 0.2]];
const PITCH = [0.2, 0.125, 0.075], DECK = [0.3, 0.23, 0.16], SPAR = [0.26, 0.18, 0.12], WHITE = [1, 1, 1], LINEN = [0.8, 0.74, 0.6];
// a plain standing figure baked into a ship: legs, tunic, arms, head; h is its height in metres
function standFigure(B, x, y, z, h, tunic, skin) {
  B.box(x - 0.14, y, z - 0.09, x + 0.14, y + 0.5 * h, z + 0.09, skin, 0, 'xXzZ');
  B.box(x - 0.2, y + 0.42 * h, z - 0.12, x + 0.2, y + 0.84 * h, z + 0.12, tunic, 0, 'xXzZY');
  B.box(x - 0.27, y + 0.48 * h, z - 0.06, x - 0.2, y + 0.82 * h, z + 0.06, skin, 0, 'xzZ'); B.box(x + 0.2, y + 0.48 * h, z - 0.06, x + 0.27, y + 0.82 * h, z + 0.06, skin, 0, 'XzZ');
  B.box(x - 0.09, y + 0.86 * h, z - 0.1, x + 0.09, y + h, z + 0.1, skin, 0, 'xXzZY');
}
// a round merchant ship, bow toward +X, waterline y 0: one mast, one square sail (set, or brailed up to the yard), two steering oars.
// part 0: the whole ship; 1: the ship without her yard and sail; 2: the yard, its lifts and the sail alone, about the mast
// as origin (a ship under a set sail is drawn in these two parts, so that the yard can be braced to the wind)
function merchantShip(B, L, set, part = 0) {
  const xm = L * 0.05, H = L * 0.6 + 2, yY = H - 0.9, Ly = L * 0.56, px = part === 2 ? 0.2 : xm + 0.2, fbd = 1.3 + L * 0.02;
  const yd = (z, off = 0) => [px + off, yY, z];
  if (part !== 1) {
    B.beam(yd(-Ly / 2), yd(Ly / 2), 0.16, SPAR, SF.TIMBER);
    if (set) {
      const hs = yY - (fbd + 1.5);
      B.grid(6, 5, (u, v) => { const q = yd((u - 0.5) * Ly * 0.95, 0.12 + 1.1 * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 0.72 + 0.1))); return [q[0], yY - 0.1 - v * hs, q[2]]; },
        LINEN, PF.CLOTH, false, (u, v) => [0.16 * Math.sin(Math.PI * u) * v, u * 2.1 + v * 1.3]);
    } else {
      B.grid(8, 5, (u, v) => { const an = v * Math.PI * 2, lump = 0.75 + 0.3 * Math.sin(u * 29) * Math.sin(u * 13 + 1); return [px + 0.27 * lump * Math.cos(an), yY - 0.32 + 0.3 * lump * Math.sin(an), (u - 0.5) * Ly * 0.92]; },
        LINEN, PF.CLOTH, true, (u, v) => [0.02, u * 5]);
    }
    for (const sg of [1, -1]) B.beam([px - 0.2, H, 0], yd(sg * Ly / 2), 0.05, [0.2, 0.16, 0.11]);
    if (part === 2) return { L, mast: H, yard: Ly, pivot: xm };
  }
  const Bm = L * 0.29, fb = 1.3 + L * 0.02, dr = 1.25, a = (t) => Math.abs(2 * t - 1);
  const half = (t) => Bm / 2 * Math.pow(Math.max(1 - Math.pow(a(t), 2.3), 0), 0.55);
  const sheer = (t) => fb + (t < 0.5 ? 1.5 : 1.0) * Math.pow(a(t), 2.6), keel = (t) => -dr * (1 - Math.pow(a(t), 4));
  for (const sg of [1, -1]) {
    B.grid(14, 4, (u, v) => { const w = v * 0.8; return [(u - 0.5) * L, lerp(keel(u), sheer(u), w), sg * half(u) * Math.pow(w, 0.45)]; }, PITCH, SF.TIMBER, sg < 0);
    B.grid(14, 1, (u, v) => { const w = 0.8 + v * 0.2; return [(u - 0.5) * L, lerp(keel(u), sheer(u), w), sg * half(u) * Math.pow(w, 0.45)]; }, WHITE, PF.PAINT, sg < 0);
  }
  const dk = (u) => sheer(0.03 + u * 0.94) - 0.55;
  B.grid(10, 1, (u, v) => [(0.03 + u * 0.94 - 0.5) * L, dk(u), (v * 2 - 1) * half(0.03 + u * 0.94) * 0.92], DECK, SF.TIMBER, true);
  // an eye painted on each bow, on the top strake
  for (const sg of [1, -1]) {
    const P = (u, w, o) => [(u - 0.5) * L, lerp(keel(u), sheer(u), w), sg * (half(u) * Math.pow(w, 0.45) + o)];
    const eye = (u0, u1, w0, w1, o, c) => { const q = [P(u0, w0, o), P(u1, w0, o), P(u1, w1, o), P(u0, w1, o)]; if (sg < 0) q.reverse(); B.quad(q[0], q[1], q[2], q[3], c, 0); };
    eye(0.865, 0.93, 0.83, 0.97, 0.03, [0.86, 0.84, 0.76]); eye(0.888, 0.912, 0.86, 0.95, 0.05, [0.05, 0.05, 0.06]);
  }
  // stem and stern posts
  const ys = sheer(0), yb = sheer(1);
  B.beam([-L / 2 + 0.35, ys - 0.5, 0], [-L / 2 - 0.45, ys + 1.5, 0], 0.26, SPAR, SF.TIMBER); B.beam([-L / 2 - 0.45, ys + 1.5, 0], [-L / 2 + 0.35, ys + 2.4, 0], 0.22, SPAR, SF.TIMBER);
  B.beam([L / 2 - 0.35, yb - 0.5, 0], [L / 2 + 0.4, yb + 1.1, 0], 0.26, SPAR, SF.TIMBER);
  // the mast and the standing rigging (ropes as thin timbers); a brailed ship's braces run from the yard's arms to the quarters
  B.cyl(xm, 0, 0.2, 0.12, dk(0.55), H, 6, SPAR, SF.TIMBER);
  const rope = [0.2, 0.16, 0.11];
  B.beam([xm, H, 0], [L / 2 + 0.3, yb + 0.9, 0], 0.06, rope); B.beam([xm, H, 0], [-L / 2 - 0.3, ys + 1.4, 0], 0.06, rope);
  for (const sg of [1, -1]) {
    B.beam([xm, H - 0.6, 0], [xm - 0.9, sheer(0.5), sg * half(0.5) * 0.97], 0.06, rope);
    if (part === 0) B.beam(yd(sg * Ly / 2), [-L * 0.36, sheer(0.14), sg * half(0.14) * 0.9], 0.05, rope);
    // steering oar at the stern quarter
    const q0 = [-L * 0.36, sheer(0.14) + 1.0, sg * (half(0.14) + 0.12)], q1 = [-L * 0.455, -1.4, sg * (half(0.14) + 0.55)];
    B.beam(q0, q1, 0.12, SPAR, SF.TIMBER); B.beam([lerp(q0[0], q1[0], 0.6), lerp(q0[1], q1[1], 0.6), lerp(q0[2], q1[2], 0.6)], q1, 0.07, SPAR, SF.TIMBER, 0.5);
  }
  // a low shelter aft, covered cargo amidships, two of the crew
  B.box(-L * 0.33, dk(0.18), -Bm * 0.2, -L * 0.22, dk(0.18) + 1.3, Bm * 0.2, DECK, SF.TIMBER, 'xXzZY');
  B.box(-L * 0.14, dk(0.4), -Bm * 0.26, L * 0.02, dk(0.4) + 0.7, Bm * 0.26, LINEN, PF.CLOTH, 'xXzZY');
  B.box(L * 0.12, dk(0.6), -Bm * 0.24, L * 0.3, dk(0.6) + 0.55, Bm * 0.24, [0.45, 0.25, 0.16], 0, 'xXzZY');
  standFigure(B, -L * 0.39, dk(0.1) + 0.05, 0.3, 1.68, [0.6, 0.5, 0.36], SKIN[0]); standFigure(B, L * 0.36, dk(0.86) + 0.05, -0.4, 1.62, [0.5, 0.42, 0.34], SKIN[1]);
  return { L, beam: Bm, mast: H, yard: Ly, pivot: xm };
}
// a merchantman under sail seen far (20 m, bow toward +X, waterline y 0): the hull's two sides, the mast, the yard and the
// set sail, in few faces
function farShip(B) {
  const L = 20, Bm = L * 0.29, H = L * 0.6 + 2, yY = H - 0.9, Ly = L * 0.56, a = (t) => Math.abs(2 * t - 1);
  const half = (t) => Bm / 2 * Math.pow(Math.max(1 - Math.pow(a(t), 2.3), 0), 0.55), sheer = (t) => 1.7 + (t < 0.5 ? 1.5 : 1.0) * Math.pow(a(t), 2.6);
  for (const sg of [1, -1]) B.grid(5, 1, (u, v) => [(u - 0.5) * L, lerp(-0.3, sheer(u), v), sg * half(u) * (0.55 + 0.45 * v)], (u, v) => (v > 0.5 ? mul(PITCH, 1.6) : PITCH), SF.TIMBER, sg < 0);
  B.cyl(1, 0, 0.2, 0.12, 1.2, H, 3, SPAR, SF.TIMBER, false);
  B.beam([1.2, yY, -Ly / 2], [1.2, yY, Ly / 2], 0.16, SPAR, SF.TIMBER, 0.16, false);
  B.grid(2, 2, (u, v) => [1.32 + 1.1 * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 0.72 + 0.1)), yY - 0.1 - v * (yY - 3.2), (u - 0.5) * Ly * 0.95], LINEN, PF.CLOTH, false, (u, v) => [0.16 * Math.sin(Math.PI * u) * v, u * 2.1 + v * 1.3]);
}
// how the yard of a ship under sail is braced, by her heading and the one wind (blowing toward (wx, wz)): square when the
// wind is dead aft or ahead, half a radian either way when it is abeam, the windward arm forward
const brace = (hx, hz) => -0.5 * (hx * 0.69 - hz * 0.72) / Math.hypot(0.72, 0.69);

// a warship of three banks, 36 m by 5.4 m over the outriggers, bow and ram toward +X, waterline y 0; no sail set
const WAR = { L: 36, beam: 5.4, oarReach: 6.3, stern: 7.0 };
function warshipHull(B) {
  const L = WAR.L, a = (t) => Math.abs(2 * t - 1);
  const half = (t) => 2.0 * Math.pow(Math.max(1 - Math.pow(a(t), 4), 0), 0.6);
  const sheer = (t) => 2.15 + (t < 0.5 ? 2.3 * Math.pow(a(t), 3.4) : 0.95 * Math.pow(a(t), 3)), keel = (t) => -1.0 * (1 - Math.pow(a(t), 5));
  for (const sg of [1, -1]) {
    B.grid(20, 4, (u, v) => { const w = v * 0.74; return [(u - 0.5) * L, lerp(keel(u), sheer(u), w), sg * half(u) * Math.pow(w, 0.4)]; }, PITCH, SF.TIMBER, sg < 0);
    B.grid(20, 1, (u, v) => { const w = 0.74 + v * 0.26; return [(u - 0.5) * L, lerp(keel(u), sheer(u), w), sg * half(u) * Math.pow(w, 0.4)]; }, WHITE, PF.PAINT, sg < 0);
    // an eye painted on the bow
    { const P = (u, w, o) => [(u - 0.5) * L, lerp(keel(u), sheer(u), w), sg * (half(u) * Math.pow(w, 0.4) + o)];
      const eye = (u0, u1, w0, w1, o, c) => { const q = [P(u0, w0, o), P(u1, w0, o), P(u1, w1, o), P(u0, w1, o)]; if (sg < 0) q.reverse(); B.quad(q[0], q[1], q[2], q[3], c, 0); };
      eye(0.9, 0.95, 0.5, 0.8, 0.03, [0.86, 0.84, 0.76]); eye(0.917, 0.935, 0.57, 0.74, 0.05, [0.05, 0.05, 0.06]); }
    // the outrigger for the upper bank and the screen above it
    B.box(-L * 0.33, 1.7, sg > 0 ? 1.9 : -2.7, L * 0.31, 1.98, sg > 0 ? 2.7 : -1.9, SPAR, SF.TIMBER, 'xXzZyY');
    B.box(-L * 0.33, 1.98, sg * 2.62 - 0.04, L * 0.31, 2.85, sg * 2.62 + 0.04, WHITE, PF.PAINT, 'xXzZY');
  }
  B.grid(12, 1, (u, v) => [(0.04 + u * 0.92 - 0.5) * L, sheer(0.04 + u * 0.92) - 0.1, (v * 2 - 1) * Math.max(half(0.04 + u * 0.92) * 0.96, 0.2)], DECK, SF.TIMBER, true);
  // the ram at the waterline, sheathed in bronze, and the stem above it
  B.beam([L / 2 - 2.2, -0.25, 0], [L / 2 + 1.7, -0.12, 0], 0.62, [0.5, 0.33, 0.14], 0, 0.5);
  B.beam([L / 2 - 0.5, 2.4, 0], [L / 2 + 0.25, 4.3, 0], 0.3, SPAR, SF.TIMBER); B.beam([L / 2 + 0.25, 4.3, 0], [L / 2 - 0.7, 5.0, 0], 0.24, SPAR, SF.TIMBER);
  // the curved stern
  const sx = -L / 2, sy = sheer(0);
  B.beam([sx + 0.5, sy - 0.5, 0], [sx - 0.6, sy + 1.2, 0], 0.34, SPAR, SF.TIMBER); B.beam([sx - 0.6, sy + 1.2, 0], [sx + 0.2, sy + 2.2, 0], 0.28, SPAR, SF.TIMBER);
  B.beam([sx + 0.2, sy + 2.2, 0], [sx + 1.7, sy + 2.55, 0], 0.22, SPAR, SF.TIMBER);
  // steering oars, the helmsman and a few of the deck crew
  for (const sg of [1, -1]) {
    const q0 = [sx + 4.2, sheer(0.12) + 0.7, sg * 2.0], q1 = [sx + 1.6, -1.5, sg * 2.5];
    B.beam(q0, q1, 0.13, SPAR, SF.TIMBER); B.beam([lerp(q0[0], q1[0], 0.62), lerp(q0[1], q1[1], 0.62), lerp(q0[2], q1[2], 0.62)], q1, 0.07, SPAR, SF.TIMBER, 0.55);
  }
  const dy = (t) => sheer(t) - 0.08;
  standFigure(B, sx + 4.4, dy(0.12), 0, 1.72, [0.62, 0.2, 0.14], SKIN[0]); standFigure(B, sx + 6.2, dy(0.17), 0.6, 1.66, [0.6, 0.55, 0.42], SKIN[1]);
  standFigure(B, 2, dy(0.55), -0.5, 1.7, [0.55, 0.5, 0.4], SKIN[2]); standFigure(B, 11.5, dy(0.82), 0.4, 1.64, [0.58, 0.52, 0.4], SKIN[0]); standFigure(B, -7, dy(0.3), 0.3, 1.68, [0.5, 0.45, 0.38], SKIN[1]);
}
// the three banks of oars of both sides as one geometry: each oar turns about its own pivot in the vertex shader
function warshipOars() {
  const B = makeBuf(8192), piv = [], shaft = [0.42, 0.32, 0.2], L = WAR.L;
  const banks = [{ y: 1.9, z: 2.6, len: 4.35, off: 0 }, { y: 1.35, z: 2.05, len: 4.2, off: 0.25 }, { y: 0.8, z: 1.95, len: 4.1, off: 0.5 }];
  for (const sg of [1, -1]) for (const bk of banks) for (let i = 0; i < 27; i++) {
    const x = -L * 0.3 + bk.off + i * 0.75, drop = bk.y + 0.3, out = Math.sqrt(bk.len * bk.len - drop * drop), n0 = B.triangles;
    const p0 = [x, bk.y, sg * bk.z], p1 = [x, -0.3, sg * (bk.z + out)], pm = [x, lerp(bk.y, -0.3, 0.78), sg * (bk.z + out * 0.78)];
    // a three-sided loom and a flat blade (ten triangles an oar)
    const dl = Math.hypot(pm[1] - p0[1], pm[2] - p0[2]), ny = -(pm[2] - p0[2]) / dl, nz = (pm[1] - p0[1]) / dl, w = 0.045;
    const ring = (q) => [[q[0] + w, q[1], q[2]], [q[0] - w * 0.5, q[1] + ny * w * 0.87, q[2] + nz * w * 0.87], [q[0] - w * 0.5, q[1] - ny * w * 0.87, q[2] - nz * w * 0.87]];
    const ra = ring(p0), rb = ring(pm);
    for (let k = 0; k < 3; k++) { const j = (k + 1) % 3; B.quad(ra[j], ra[k], rb[k], rb[j], shaft); }
    const bl = [[x - 0.1, pm[1], pm[2]], [x + 0.1, pm[1], pm[2]], [x + 0.1, p1[1], p1[2]], [x - 0.1, p1[1], p1[2]]];
    B.quad(bl[0], bl[1], bl[2], bl[3], shaft); B.quad(bl[1], bl[0], bl[3], bl[2], shaft);
    for (let k = (B.triangles - n0) * 2; k > 0; k--) piv.push(p0[0], p0[1], p0[2]);
  }
  const g = B.geometry();
  g.setAttribute('pivot', new THREE.Float32BufferAttribute(piv, 3));
  return g;
}
// oars: a true stroke. Phase 0 is the catch (blades forward); they pull aft in the water for half the cycle, lift and swing forward in the air.
function oarMaterial(tU) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = tU;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 pivot; attribute vec2 iRow; uniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      { float sg = sign(pivot.z); vec3 v = transformed - pivot; float o = sg * v.z;
        float ph = uTime * 2.5133 + iRow.y, sn = sin(ph);
        float th = 0.52 * cos(ph) * iRow.x, ps = (sn > 0. ? -0.05 * sn : -0.2 * sn) * iRow.x;
        float x1 = v.x * cos(th) + o * sin(th), o1 = o * cos(th) - v.x * sin(th);
        float y2 = v.y * cos(ps) + o1 * sin(ps), o2 = o1 * cos(ps) - v.y * sin(ps);
        transformed = pivot + vec3(x1, y2, sg * o2) * step(0.5, iRow.x); }`);
  };
  m.customProgramCacheKey = () => 'colossus-oar-1';
  return m;
}

// ---------------------------------------------------------------- people and animals (our own: no kit has them)
// One lit program for all of them. In a figure's geometry `surf` names the part and `wave` carries (colour class, joint height):
// class 0 keeps the vertex colour (skin, hair, clay), 1 takes the instance's garment colour, 2 its mantle colour. The parts:
// 0 trunk and head; 1, 2 the thighs (the joint is the hip); 3, 4 the shins and feet (the knee; the hip lies 1.875 knee heights
// up); 5, 6 the upper arms (the shoulder); 7, 8 the forearms and hands (the elbow; the shoulder lies 1.2727 elbow heights up);
// 9 a garment's skirt, which gives with the legs; 10 a hat, 11 a jar on the head or a garland across the chest, 12 a sack on
// the shoulder, 13 a branch in the hand of arm 8 (these four are folded away in those who have none); 14, 15 a beast's legs.
// Odd parts lie on the +Z side. A walker's legs and arms swing by the clock from hip, knee, shoulder and elbow; one who stands
// keeps a stance (iAnim.w: 0 at ease, 1 an arm raised in greeting, 2 both arms raised in prayer, 3 a hand shading the eyes and
// one on the hip, 4 the hands held before the body, 5 an arm up to the jar, 6 an arm up to the sack, 7 the branch held up)
// and stirs a little.
const FIG_VERT = /* glsl */`
  { float ph = iAnim.x + uTime * iAnim.y, amp = max(iAnim.z, 0.), idle = max(-iAnim.z, 0.), part = surf, sw = sin(ph), cw = cos(ph), st = iAnim.w, py = wave.y;
    vec3 p = transformed; float side = fract(part * 0.5) > 0.25 ? 1. : -1.;
    if (part > 9.5 && part < 13.5) p = mix(vec3(0., py, 0.), p, part < 10.5 ? iFlag.x : (part < 11.5 ? iFlag.y : (part < 12.5 ? iFlag.z : iFlag.x)));
    if (part > 0.5 && part < 4.5) {
      float hip = part < 2.5 ? py : py * 1.875;
      if (part > 2.5) { float a = -(0.07 + 0.95 * amp * max(cw * side, 0.)), dy = p.y - py, c = cos(a), s = sin(a); p = vec3(p.x * c - dy * s, py + p.x * s + dy * c, p.z); }
      float a = 0.42 * amp * sw * side + 0.05 * side * (1. - amp), dy = p.y - hip, c = cos(a), s = sin(a); p = vec3(p.x * c - dy * s, hip + p.x * s + dy * c, p.z);
    } else if ((part > 4.5 && part < 8.5) || (part > 12.5 && part < 13.5)) {
      if (part > 12.5) side = -1.;
      float sho = part > 6.5 ? py * 1.2727 : py, sa = 0.06, ea = 0.22, free = 1.;
      if (st > 0.5 && st < 1.5) { if (side < 0.) { sa = 2.4; ea = 0.3; free = 0.; } }
      else if (st > 1.5 && st < 2.5) { sa = 2.15; ea = 0.65; free = 0.; }
      else if (st > 2.5 && st < 3.5) { free = 0.; if (side < 0.) { sa = 1.3; ea = 1.9; } else { sa = -0.3; ea = 0.9; } }
      else if (st > 3.5 && st < 4.5) { sa = 0.4; ea = 1.25; free = 0.; }
      else if (st > 4.5 && st < 5.5) { if (side > 0.) { sa = 2.7; ea = 0.6; free = 0.; } }
      else if (st > 5.5 && st < 6.5) { if (side > 0.) { sa = 1.25; ea = 2.0; free = 0.; } }
      else if (st > 6.5) { if (side < 0.) { sa = 0.3; ea = 1.3; free = 0.; } }
      sa += free * (-0.5 * amp * sw * side) + 0.07 * idle * sw; ea += free * 0.3 * amp * (0.5 - 0.5 * sw * side);
      if (part > 6.5) { float dy = p.y - py, c = cos(ea), s = sin(ea); p = vec3(p.x * c - dy * s, py + p.x * s + dy * c, p.z); }
      float dy = p.y - sho, c = cos(sa), s = sin(sa); p = vec3(p.x * c - dy * s, sho + p.x * s + dy * c, p.z);
    } else if (part > 8.5 && part < 9.5) {
      p.x += 0.27 * amp * sw * sign(p.z) * clamp((py - p.y) / max(py, 0.01), 0., 1.);
    } else if (part > 13.5) {
      float a = 0.5 * amp * sw * (part < 14.5 ? 1. : -1.), dy = p.y - py, c = cos(a), s = sin(a); p = vec3(p.x * c - dy * s, py + p.x * s + dy * c, p.z);
    }
    p.y += 0.03 * amp * abs(cw); p.x += 0.012 * idle * sw * p.y;
    transformed = p; }`;
function figureMaterials(tU, U) {
  const pars = '#include <common>\nattribute float surf; attribute vec2 wave; attribute vec4 iAnim; attribute vec3 iTint; attribute vec3 iTint2; attribute vec3 iFlag; uniform float uTime;';
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    dawnInto(sh, U); sh.uniforms.uTime = tU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', pars + ' varying vec3 vWp;')
      .replace('#include <color_vertex>', '#include <color_vertex>\nvColor.rgb *= wave.x < 0.5 ? vec3(1.) : (wave.x < 1.5 ? iTint : iTint2);')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FIG_VERT)
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * instanceMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + DAWN_GLSL + '\nvarying vec3 vWp;')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n{ float ds = dawnSun(vWp.y); reflectedLight.directDiffuse *= ds; reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(0.13, 0.1, 0.07) * ds; reflectedLight.indirectDiffuse *= 1. + FIRST_STREET_FILL * dawnFill(vWp); }')
      .replace('#include <fog_fragment>', '#include <fog_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uHazeCol, dawnHaze(vWp, cameraPosition));');
  };
  m.customProgramCacheKey = () => 'colossus-figure-4';
  const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  d.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = tU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', pars).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + FIG_VERT);
  };
  d.customProgramCacheKey = () => 'colossus-figure-depth-2';
  const shade = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  return { lit: m, depth: d, shade };
}
// (r9) JUTE: by itself, the wrapper of the cargo list's bales; mixed with 0.35 of SACK, the wrapper of the bales of the way's lots and of the landing, which are not in the cargo list;
// and, half and half with SACK, the cloth of the quay's sacks (the cargo list's, the way's lots', a hand
// cart's). QWOOD: the wood of the cargo list's stacks of timber and the landing's baulks, of the jar stand, the hand
// carts, the stall's frame beside the way and the kerb's two mooring posts; the other timber of buildQuayThings
// (the gate's two stalls, the net racks, the gangplank, the baulks' bearers) keeps COL.timber, the guards' spears
// SPAR. Both are the crew's own numbers.
const HAIR = [0.05, 0.04, 0.03], CLAY = [0.5, 0.27, 0.17], FELT = [0.4, 0.33, 0.25], STRAW = [0.62, 0.52, 0.3], SACK = [0.5, 0.42, 0.28], JUTE = [0.7, 0.53, 0.25], QWOOD = [0.4, 0.29, 0.17], BRANCH = [0.3, 0.24, 0.15], LEAF_C = [0.16, 0.3, 0.1];
// a smooth tube through rings [x, y, z, rx, rz] from the lowest up, n sides; col and cls may be functions of (u, v): u round the
// tube from the front (+X) by the +Z side, v up it; cls gives a vertex its colour class and joint height
function figTube(B, rings, n, col, part, cls) {
  const m = rings.length - 1;
  B.grid(n, m, (u, v) => {
    const t = Math.min(m - 1e-4, v * m), i = Math.floor(t), f = t - i, a = rings[i], b = rings[i + 1], c = Math.cos(u * 6.2832), s = Math.sin(u * 6.2832);
    return [a[0] + (b[0] - a[0]) * f + (a[3] + (b[3] - a[3]) * f) * c, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f + (a[4] + (b[4] - a[4]) * f) * s];
  }, col, part, true, typeof cls === 'function' ? cls : () => cls);
}
// kind 0: a long robe to the ankles with a mantle over one shoulder and a coloured border, some with a water jar on the head or a
// leafy branch in the hand; 1: the short belted tunic that leaves one shoulder bare, some with a broad felt hat, a sack on the
// shoulder or a garland across the chest; 2: a child in a short tunic with a branch. Facing +X, 1.71 m at scale 1 (the child
// 1.2 m): two legs from hip and knee, two arms from shoulder and elbow, a neck and a head with hair.
// far: the same body in fewer faces, for those who stand or walk far from the flown line with no load and nothing in the
// hand: each leg and each arm one straight limb, the body and the head four sided, no feet; the felt hat stays.
function figureGeometry(kind, level = 0) {
  const far = level > 0, speck = level > 1;
  const B = makeBuf(512), skin = SKIN[kind % 3], k = kind === 2 ? 0.66 : 1, W = WHITE, dark = mul(W, 0.6), ns = speck ? 3 : far ? 4 : 5;
  const KNEE = 0.48 * k, HIP = KNEE * 1.875, ELB = 1.1 * k, SHO = ELB * 1.2727, WAIST = 0.98 * k;
  for (const sg of [1, -1]) {
    const leg = sg > 0 ? 1 : 2, z = sg * 0.088 * k, az = sg * 0.235 * k;
    if (far) {
      if (kind !== 0) figTube(B, [[0, 0.03 * k, z, 0.045 * k, 0.042 * k], [0, HIP, z, 0.085 * k, 0.08 * k]], 3, skin, leg, [0, HIP]);
      if (!speck) figTube(B, [[0.012 * k, 0.76 * k, az * 1.08, 0.034 * k, 0.04 * k], [0, SHO - 0.02 * k, az * 0.96, 0.054 * k, 0.05 * k]], 3, (u, v) => kind === 0 && v > 0.45 ? W : skin, leg + 4, (u, v) => [kind === 0 && v > 0.45 ? 1 : 0, SHO]);
      continue;
    }
    if (kind !== 0) {
      figTube(B, [[0, KNEE, z, 0.056 * k, 0.052 * k], [0, HIP, z, 0.085 * k, 0.08 * k]], 3, skin, leg, [0, HIP]);
      figTube(B, [[0, 0.06 * k, z, 0.038 * k, 0.036 * k], [0, KNEE, z, 0.06 * k, 0.056 * k]], 3, skin, leg + 2, [0, KNEE]);
    }
    B.wave(0, KNEE); B.box(-0.05 * k, 0, z - 0.045 * k, 0.16 * k, 0.075 * k, z + 0.045 * k, mul(skin, kind === 0 ? 1 : 0.75), leg + 2, 'XY' + (sg > 0 ? 'Z' : 'z'));
    figTube(B, [[0, ELB, az * 1.05, 0.04 * k, 0.04 * k], [0, SHO - 0.02 * k, az * 0.96, 0.054 * k, 0.05 * k]], 3, kind === 0 ? W : skin, leg + 4, [kind === 0 ? 1 : 0, SHO]);
    figTube(B, [[0.012 * k, 0.76 * k, az * 1.08, 0.03 * k, 0.038 * k], [0, ELB, az * 1.05, 0.044 * k, 0.042 * k]], 3, skin, leg + 6, [0, ELB]);
  }
  const chest = [0.012 * k, 1.27 * k, 0, 0.13 * k, 0.19 * k], shoulders = [0, SHO, 0, 0.085 * k, 0.185 * k], neck = [0, 1.44 * k, 0, 0.05 * k, 0.05 * k];
  if (kind === 0) {
    // the robe: its lower border and the mantle over the +Z shoulder take the mantle's colour
    figTube(B, [[0, 0.06, 0, 0.19, 0.2], [0, 0.5, 0, 0.16, 0.185], [0, HIP + 0.03, 0, 0.145, 0.18]], ns, W, 9, (u, v) => [v < 0.25 ? 2 : 1, HIP + 0.03]);
    figTube(B, speck ? [[0, HIP + 0.03, 0, 0.145, 0.18], [0, SHO, 0, 0.1, 0.24], neck] : [[0, HIP + 0.03, 0, 0.145, 0.18], chest, shoulders, neck], ns, (u, v) => v > 0.9 ? skin : W, 0, (u, v) => [v > 0.9 ? 0 : (v > 0.2 && ((u > 0.1 && u < 0.5) || (u > 0.5 && u < 0.7 && v < 0.5)) ? 2 : 1), 0]);
  } else {
    // the tunic: a skirt to mid thigh, a dark belt; the workman's leaves the -Z shoulder bare
    const bare = (u, v) => kind === 1 && v > 0.5 && u > 0.5 && u < 0.9;
    figTube(B, [[0, 0.6 * k, 0, 0.165 * k, 0.2 * k], [0, WAIST, 0, 0.118 * k, 0.155 * k]], ns, (u, v) => v > 0.9 ? dark : W, 9, [1, WAIST]);
    figTube(B, speck ? [[0, WAIST, 0, 0.118 * k, 0.155 * k], [0, SHO, 0, 0.1 * k, 0.24 * k], neck] : [[0, WAIST, 0, 0.118 * k, 0.155 * k], chest, shoulders, neck], ns, (u, v) => v > 0.9 || bare(u, v) ? skin : (v < 0.1 ? dark : W), 0, (u, v) => [v > 0.9 || bare(u, v) ? 0 : 1, 0]);
  }
  // the head: a child's is large for its body; the hair covers the crown and the back down to the nape
  const hs = kind === 2 ? 0.86 : 1, hy = 1.41 * k, top = hy + 0.3 * hs;
  figTube(B, [[0, hy, 0, 0.052 * hs, 0.052 * hs], [0.012 * hs, hy + 0.17 * hs, 0, 0.1 * hs, 0.088 * hs], [-0.012 * hs, top, 0, 0.03 * hs, 0.03 * hs]], ns, (u, v) => v > 0.75 || (v > 0.25 && u > 0.3 && u < 0.7) ? HAIR : skin, 0, [0, 0]);
  if (far) { if (kind === 1) figTube(B, speck ? [[0, top - 0.07, 0, 0.27, 0.27], [0, top + 0.07, 0, 0.07, 0.07]] : [[0, top - 0.07, 0, 0.27, 0.27], [0, top - 0.05, 0, 0.11, 0.11], [0, top + 0.07, 0, 0.07, 0.07]], ns, FELT, 10, [0, top - 0.08]); return B.geometry(); }
  if (kind === 0) {
    B.wave(0, top - 0.05); B.cyl(0, 0, 0.05, 0.115, top - 0.02, top + 0.13, 4, CLAY, 11, false); B.cyl(0, 0, 0.115, 0.05, top + 0.13, top + 0.31, 4, CLAY, 11);
  } else if (kind === 1) {
    // a broad felt hat: a wide flat brim round a low crown with a rounded top
    figTube(B, [[0, top - 0.07, 0, 0.27, 0.27], [0, top - 0.05, 0, 0.11, 0.11], [0, top + 0.045, 0, 0.098, 0.098], [0, top + 0.085, 0, 0.012, 0.012]], 6, FELT, 10, [0, top - 0.08]);
    B.wave(0, SHO); B.box(-0.22, SHO + 0.03, 0.02, 0.26, SHO + 0.27, 0.31, SACK, 12, 'xXzZY');
    B.wave(0, SHO); B.beam([0.15, SHO - 0.5, -0.19], [0.03, SHO + 0.07, 0.13], 0.1, LEAF_C, 11, 0.1, false);
  }
  if (kind !== 1) {
    // a leafy branch in the hand of the -Z arm: it lies along the forearm's line and stands up when that arm is bent
    const hx = 0.012 * k, hz = -0.254 * k, hyd = 0.76 * k;
    B.wave(0, ELB); B.beam([hx - 0.05 * k, hyd, hz], [hx + 0.62 * k, hyd + 0.02, hz], 0.03, BRANCH, 13, 0.03, false);
    B.wave(0, ELB); B.beam([hx + 0.4 * k, hyd + 0.01, hz], [hx + 0.95 * k, hyd + 0.03, hz], 0.2 * k, LEAF_C, 13, 0.13 * k);
  }
  return B.geometry();
}
// What a figure's shadow is cast from: a plain body to the shoulders and a head (the sun's depth map needs no more); far
// from the flown line the body alone, drawn up to the head's height.
function figureShade(kind, far = false) {
  const B = makeBuf(64), k = kind === 2 ? 0.68 : 1, sh = 1.4 * k, W = WHITE;
  B.wave(0, 0); B.box(-0.13 * k, 0, (kind === 0 ? -0.24 : -0.22) * k, 0.13 * k, far ? sh + 0.3 * k : sh + 0.03 * k, (kind === 0 ? 0.24 : 0.22) * k, W, 0, 'xXzZY');
  if (!far) B.box(-0.1 * k, sh, -0.1 * k, 0.1 * k, sh + 0.33 * k, 0.1 * k, W, 0, 'xXzZY');
  return B.geometry();
}
// kind 0: a donkey with panniers; 1: a goat or a dog (the instance's scale and colour decide); 2: a pair of oxen yoked to the pole of a two-wheeled cart
function animalGeometry(kind) {
  const B = makeBuf(1024), W = WHITE;
  const beast = (len, hgt, wid, leg, x0, neck, headL, z0 = 0) => {
    for (const [fx, sg, part] of [[x0 + len * 0.42, 1, 14], [x0 + len * 0.42, -1, 15], [x0 - len * 0.42, 1, 15], [x0 - len * 0.42, -1, 14]]) { B.wave(1, hgt); B.box(fx - leg, 0, z0 + sg * wid * 0.32 - leg, fx + leg, hgt + 0.05, z0 + sg * wid * 0.32 + leg, W, part, 'xXzZ'); }
    B.wave(1, 0); B.box(x0 - len / 2, hgt, z0 - wid / 2, x0 + len / 2, hgt + wid * 1.05, z0 + wid / 2, W, 0, 'xXzZYy');
    B.beam([x0 + len * 0.45, hgt + wid * 0.8, z0], [x0 + len * 0.45 + neck, hgt + wid * 0.8 + neck * 0.9, z0], wid * 0.55, W, 0);
    B.beam([x0 + len * 0.45 + neck * 0.8, hgt + wid * 0.8 + neck * 0.95, z0], [x0 + len * 0.45 + neck + headL, hgt + wid * 0.8 + neck * 0.6, z0], wid * 0.42, W, 0);
    B.beam([x0 - len / 2, hgt + wid * 0.9, z0], [x0 - len / 2 - 0.12, hgt + wid * 0.2, z0], 0.05, W, 0);
  };
  if (kind === 0) {
    beast(1.25, 0.72, 0.36, 0.05, 0, 0.3, 0.34);
    B.wave(0, 0); for (const sg of [1, -1]) { B.box(-0.3, 0.62, sg * 0.3 - 0.13, 0.3, 1.08, sg * 0.3 + 0.13, STRAW, 0, 'xXzZYy'); B.beam([0.8, 1.42, sg * 0.07], [0.75, 1.58, sg * 0.1], 0.045, [0.2, 0.16, 0.12], 0); }
    B.box(-0.28, 1.1, -0.3, 0.28, 1.32, 0.3, SACK, 0, 'xXzZY');
  } else if (kind === 1) {
    beast(0.72, 0.4, 0.24, 0.035, 0, 0.16, 0.2);
  } else {
    // a two-wheeled cart drawn by a PAIR of oxen: one pole from the cart's bed runs forward between them to the yoke that lies
    // across their two necks (no shafts, no single beast)
    beast(2.0, 0.82, 0.5, 0.07, 2.75, 0.28, 0.48, 0.44); beast(2.0, 0.82, 0.5, 0.07, 2.75, 0.28, 0.48, -0.44);
    B.wave(0, 0);
    const pl = [0.36, 0.27, 0.18];
    B.box(-1.7, 0.78, -0.62, 0.95, 0.9, 0.62, pl, 0, 'xXzZYy'); B.box(-1.7, 0.9, -0.62, 0.95, 1.2, -0.55, pl, 0, 'xXzZY'); B.box(-1.7, 0.9, 0.55, 0.95, 1.2, 0.62, pl, 0, 'xXzZY');
    for (const sg of [1, -1]) { B.at(-0.4, 0.62, sg * 0.71, 0); for (let i = 0; i < 10; i++) { const a0 = i / 10 * 6.2832, a1 = (i + 1) / 10 * 6.2832; B.tri([0, 0, sg * 0.05], sg > 0 ? [Math.cos(a0) * 0.62, Math.sin(a0) * 0.62, 0.05] : [Math.cos(a1) * 0.62, Math.sin(a1) * 0.62, -0.05], sg > 0 ? [Math.cos(a1) * 0.62, Math.sin(a1) * 0.62, 0.05] : [Math.cos(a0) * 0.62, Math.sin(a0) * 0.62, -0.05], pl, 0); B.quad([Math.cos(a0) * 0.62, Math.sin(a0) * 0.62, -0.05], [Math.cos(a1) * 0.62, Math.sin(a1) * 0.62, -0.05], [Math.cos(a1) * 0.62, Math.sin(a1) * 0.62, 0.05], [Math.cos(a0) * 0.62, Math.sin(a0) * 0.62, 0.05], mul(pl, 0.7), 0); } B.at(); }
    B.beam([0.95, 0.84, 0], [3.62, 1.43, 0], 0.1, pl, 0); B.beam([3.62, 1.5, -0.74], [3.62, 1.5, 0.74], 0.11, pl, 0);
    for (const z of [-0.68, -0.2, 0.2, 0.68]) B.beam([3.62, 1.48, z], [3.62, 1.1, z], 0.05, pl, 0);
    B.box(-1.5, 0.9, -0.52, 0.7, 1.55, 0.52, SACK, 0, 'xXzZY'); B.cyl(-0.9, 0, 0.3, 0.2, 1.55, 2.0, 7, CLAY, 0); B.cyl(-0.1, 0.2, 0.26, 0.18, 1.55, 1.95, 7, CLAY, 0);
  }
  return B.geometry();
}

// THE MORNING'S CLOUD IN THE WEST: the night's cloud has drawn off inland and stands over the land west of the court; the
// rising sun takes its eastern faces. The stream 'cloud-fields' deals its heaps into THREE FIELDS typed in metres: how
// far west of the statue's axis a heap's middle stands, and how far to each hand of THE AVENUE'S LINE (the axis running
// due west through him) the heap may reach. A heap lies whole between its field's two edges to the line's hand (its
// middle is dealt so that its own reach, 1.18 of its breadth, stays inside them): no dealt place is ever refused, and
// the stream 'cloud-bank' deals the heaps' forms. The cloud does not drift.
//   THE NORTH FIELD: middles 1,450 to 2,150 m west, the heaps between 250 m and 2,100 m north of the line. Six TALL
//     heaps (340 to 680 m broad, their feet 265 to 395 m up): the bank's body, over the low ground and the bay. No
//     place of the flown line lies south of the avenue's line, so his head never stands before this field.
//   THE SOUTH FIELD: middles 1,450 to 2,150 m west, the heaps between 250 m and 1,700 m south of the line. Six LOW
//     heaps (220 to 320 m broad, their feet 90 to 130 m up, their tops under 405 m): the bank's tail over the
//     island's hills. On the climb the lens leaves the line northward and rises to his chest, and his head then stands
//     before the south western sky, lower with every metre: this field's cloud stays under it.
//   THE STRIP, 250 m to either hand of the line, is kept for LOW FAR CLOUD ONLY: three small heaps whose middles stand
//     3,200 to 3,800 m west, between 600 m north and 600 m south of the line (200 to 300 m broad, their feet 60 to
//     110 m up, their tops under 385 m): the lowest and the farthest cloud of the three fields. From the harbour's
//     entry (384 m east of his axis, 2.6 m over the water) their tops stand 6.1 degrees up at most: the height of his
//     waist from there, under his chest, his head and his rays.
// So from the whole avenue, the porch and the climb his head and rays stand against open sky on every visit.
const BANK = { height: 0.56, puffs: 52, towers: 0.2, spread: 1.18, strip: 250, reach: [700, 3800], middle: [-1800, 0, -200],
  fields: [{ field: 'north', n: 6, west: [1450, 2150], hand: -1, off: [250, 2100], size: [340, 680], foot: [265, 395] },
    { field: 'south', n: 6, west: [1450, 2150], hand: 1, off: [250, 1700], size: [220, 320], foot: [90, 130] },
    { field: 'far', n: 3, west: [3200, 3800], hand: 1, off: [-600, 600], size: [200, 300], foot: [60, 110] }] };
// the heaps as the kit takes them, [x, foot, z, breadth]: four draws a heap, field by field
function bankHeaps(rng) {
  const at = [];
  for (const f of BANK.fields) for (let i = 0; i < f.n; i++) {
    const w = lerp(f.size[0], f.size[1], Math.pow(rng(), 1.6)), west = rng.range(f.west[0], f.west[1]), foot = rng.range(f.foot[0], f.foot[1]), off = rng.range(f.off[0] + BANK.spread * w, f.off[1] - BANK.spread * w);
    at.push([-west, foot, f.hand * off, w]);
  }
  return at;
}

export default {
  id: 'colossus-of-rhodes', name: 'The Colossus of Rhodes', category: 'wonders', placeKind: 'city', wonder: 'The Seven Wonders', place: 'Rhodes', year: 'about 275 BC', media: ['air'], weirdness: 0.1,
  layout: layoutOf, rules: { shipAt, haulAt, bodyAt, walkY, WAR, SLIP, HAUL, flightOf, PORCH, RING, RING_R, CLIMB, lensY, FLOCKS, FLOCK_STAND, flockReach, flockOf, BANK, bankHeaps, HEAD },
  async build(ctx) {
    const core = ctx.core, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene();
    // every stream of draws, each made from the world's seed and its own name (none draws from another)
    const mk = (name) => makeRng(hashSeed(name + ':' + ctx.seed));
    const R = { visit: mk('visit'), sky: mk('sky'), sea: mk('sea') };
    const noise = ctx.noise;

    // ------------------------------------------------------------ the visit: sunrise. The sun's height and bearing, the haze
    // The sun stands 6.4 to 8.2 degrees up (a shadow seven to nine times as long as its thing is high) at bearing 64 to 66
    // degrees, behind the right shoulder of whoever comes in from the sea and up the avenue; at the dawn hour 5 to 6 degrees
    // up and redder.
    const dawn = vary.hour === 'dawn', mood = vary.mood ?? 0.5;
    const sunEl = dawn ? R.visit.range(5, 6) : R.visit.range(6.4, 8.2), sunAz = R.visit.range(64, 66);
    const haze = R.visit.range(0.85, 1.15) * (0.85 + 0.3 * mood);
    const azr = sunAz * Math.PI / 180, elr = sunEl * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(azr) * Math.cos(elr), Math.sin(elr), -Math.cos(azr) * Math.cos(elr));
    // the sun's light is a deep warm gold; the shade is the sky's: cool blue violet
    const sunColor = new THREE.Color(dawn ? '#ffad62' : '#ffbe76').lerp(new THREE.Color('#ffb068'), 0.25 * mood), SUN_POWER = dawn ? 3.5 : 3.8;

    // THE SKY OF THE SUNRISE, seen with the sun behind: deep blue overhead, a dusky blue violet under it, a rose band low
    // over the hills (the last of the night); toward the sun, behind the lens, a gold glow. The dome itself carries no
    // cloud: the morning's cloud is the bank in the west (below), rose gold where the sun takes it, slate away from it.
    const sky = makeSky({
      rng: R.sky, preset: 'day', sunElevation: sunEl, sunAzimuth: sunAz, zenith: dawn ? '#1b3474' : '#1f3d85', mid: dawn ? '#6b6499' : '#6f72aa', horizon: dawn ? '#eaa392' : '#e9ad9c', ground: '#8b8296',
      horizonPow: 10, midPow: 2.5, scatterColor: dawn ? '#ffa658' : '#ffb768', scatter: 0.55, scatterPow: 7, scatterHigh: 0.2, sunColor: dawn ? '#ffc88e' : '#ffd9a0', sunSize: 1.4, sunIntensity: 9, sunGlow: 0.8, sunGlowTight: 0.6,
      clouds: false, clouds2: false,
    });
    scene.add(sky.object);
    await ctx.yield();
    // the morning's cloud in the west, dealt by the visit into its three fields
    const bank = makeCloudField({ rng: mk('cloud-bank'), mode: 'cumulus', at: bankHeaps(mk('cloud-fields')), center: BANK.middle, extent: BANK.reach, height: BANK.height, puffs: BANK.puffs, towers: BANK.towers,
      wind: [0, 0, 0], wrap: false, opacity: 0.9, softness: 0.44, farFade: [4200, 5000], fogFade: 0.35, sunDirection: [sunDir.x, sunDir.y, sunDir.z], sunColor: dawn ? '#ffb07a' : '#ffbe86', litColor: dawn ? '#ee9f84' : '#f3ad8a', shadeColor: '#6a6392', bottomColor: '#59557f',
      hazeColor: dawn ? '#d9a39c' : '#dba9a0' });
    bank.object.name = 'cloud bank'; scene.add(bank.object);
    await ctx.yield();
    // the haze has the colour of the low sky it stands against (the rose band), a little greyer
    const hazeCol = sky.horizonColor.clone().lerp(new THREE.Color('#b9a3ad'), 0.35);
    scene.fog = new THREE.FogExp2(hazeCol, 0.00045 * haze);
    const dawnU = { uSunW: { value: sunDir.clone() }, uHaze: { value: new THREE.Vector3(2.1 * haze, 7, 0.0026 * haze) }, uHazeCol: { value: new THREE.Vector3(hazeCol.r, hazeCol.g, hazeCol.b) } };
    const sun = new THREE.DirectionalLight(sunColor, SUN_POWER);
    const hemi = new THREE.HemisphereLight(new THREE.Color('#8c9eea'), new THREE.Color('#ad9488'), 0.8);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const SH = { halfW: 100, lo: -45, hi: 95, back: 600, ahead: 60 };
    { const c = sun.shadow.camera; c.left = -SH.halfW; c.right = SH.halfW; c.bottom = SH.lo; c.top = SH.hi; c.near = 20; c.far = SH.back * 2 + 200; c.updateProjectionMatrix(); }
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.16;
    scene.add(sun, sun.target, hemi);
    await ctx.yield();

    // ------------------------------------------------------------ the route (the same on every seed)
    const layR = layoutRoute(), path = layR.path, L = layR.L, M = layR.M;
    await ctx.yield();
    const layA = layoutShips(layR, ctx.seed, vary);
    await ctx.yield();
    const lay = { ...layA, ...lifeOf(layA) };
    await ctx.yield();

    // ------------------------------------------------------------ the sea
    // (the kit's ocean by its options: a long low swell of 26 m with the kit's smaller waves and ripples over it, so that no one
    // wavelength rules; its depth map, 4 m to the cell, is made ahead in slices so that it is no one build step)
    const depthRect = [-300, -520, 724, 440], depthRes = 256;
    const depthData = await Water.oceanDepthAsync({ depthAt: seaDepth, depthRect, depthRes }, () => ctx.yield(), 16);
    await ctx.yield();
    const ocean = Water.makeOcean({ rng: R.sea, light: sky, preset: 'calm', height: 0.16, wavelength: 26, steepness: 0.3, spread: 0.9, detail: 0.4, speed: 0.8, foam: 0, contrast: 0.12, windAngle: Math.atan2(0.7, 0.72), level: SEA,
      radius: 3600, rings: 48, segments: 80, deep: '#46607c', scatter: '#7f9aa8', shallowColor: '#3f9c84', glitter: 1, roughness: 0.09, reflectivity: 1, horizonColor: hazeCol, fadeStart: 0.1, fadeEnd: 0.8,
      depthAt: seaDepth, depthData, depthRect, depthRes, shoalDepth: SHOAL.depth, shoalWidth: SHOAL.width, shoreDamp: 0.7 });
    scene.add(ocean.object);
    await ctx.yield();

    // ------------------------------------------------------------ the built place
    const tU = { value: 0 }, cityMat = cityMaterial(dawnU, tU);
    const addMesh = (geo, opts = {}) => { const m = new THREE.Mesh(geo, opts.mat || cityMat); m.castShadow = opts.cast !== false; m.receiveShadow = opts.receive !== false; m.matrixAutoUpdate = false; m.name = opts.name || ''; scene.add(m); return m; };
    addMesh(await buildTerrain(ctx, noise), { cast: false, name: 'ground' });
    await ctx.yield();
    const Bcl = makeBuf(4096);
    const Bh = makeBuf(8192); buildHarbourFront(Bh);
    await ctx.yield();
    buildQuayThings(Bh, Bcl, lay, mk('quay-things'));
    await ctx.yield();
    // NOT IN THE PICTURE, NOT DRAWN ((d) at the head; the renderer's own rule, kept here for what the renderer cannot judge): the harbour
    // front is one long mesh (456 m of quay and wall, and the mole), and the ships move under matrices of their own, so
    // the renderer draws them wherever the lens looks. update() says by the lens's own frustum whether any of the
    // front's ten boxes, or any ship's own sphere (hull, mast and mirror image; a warship's with her shadow's reach),
    // is in the picture; what is not, is not drawn into it. The front still casts its shadow (its place in the sun's
    // depth map is kept): the wall's long morning shadow lies in the first street when the wall itself is behind us.
    const frontMesh = addMesh(Bh.geometry(), { name: 'harbour front' }), frontBoxes = [], seenNow = { on: false, front: true };
    for (let i = 0; i < 8; i++) frontBoxes.push(new THREE.Box3(new THREE.Vector3(WALL_X0 - 1.5, -5, MOLE_Z - MOLE_W / 2 - 1 + i * 57.2), new THREE.Vector3(QUAY_X1 + 1, QUAY_Y + TOWER_H + 3, MOLE_Z - MOLE_W / 2 - 1 + (i + 1) * 57.2)));
    for (let i = 0; i < 2; i++) frontBoxes.push(new THREE.Box3(new THREE.Vector3(QUAY_X1 - 2 + i * 66, -6, MOLE_Z - MOLE_W / 2 - 1.5), new THREE.Vector3(QUAY_X1 - 2 + (i + 1) * 66, 18, MOLE_Z + MOLE_W / 2 + 3)));
    frontMesh.onBeforeRender = () => { frontMesh.geometry.setDrawRange(0, seenNow.front ? Infinity : 0); }; frontMesh.onBeforeShadow = () => { frontMesh.geometry.setDrawRange(0, Infinity); };
    const _fr = new THREE.Frustum(), _pv = new THREE.Matrix4(), _sph = new THREE.Sphere();
    const inPicture = (x, y, z, r) => { if (!seenNow.on) return true; _sph.center.set(x, y, z); _sph.radius = r; return _fr.intersectsSphere(_sph); };
    const show = (mesh, on) => { mesh.visible = on; const w = mesh.userData.with; if (w) for (const m of w) m.visible = on; };
    await ctx.yield();
    const Bt = makeBuf(32768), Bf = makeBuf(16384), Bd = makeBuf(16384);
    const perch = [];
    await buildTown(Bt, Bf, Bd, Bcl, mk, (x, z) => 0.5 + 0.5 * noise.n2(x * 0.01, z * 0.01), lay, perch, () => ctx.yield());
    await ctx.yield();
    farTemple(Bt, -50, 292, 16, 32, 9); farTemple(Bt, -118, 318, 11, 22, 7);
    { const rh = mk('hill-trees'); for (let i = 0, tries = 0; i < 90 && tries < 2000; tries++) {
      const x = rh.range(-340, 90), z = rh.range(150, 560), h = rh.range(8, 13), tone = rh.range(0, 1), cyp = rh.chance(0.6), k = acroK(x, z);
      if (k < 0.6 || (Math.abs(x + 50) < 24 && Math.abs(z - 292) < 16) || (Math.abs(x + 118) < 18 && Math.abs(z - 318) < 12)) continue;
      if (cyp) cypress(Bt, x, groundY(x, z), z, h, tone, 5); else leafTree(Bt, x, groundY(x, z), z, h * 0.8, tone, 1, true); i++;
    } }
    const upperHouses = buildUpperTown(Bt, mk('upper-town'));
    await ctx.yield();
    addMesh(Bt.geometry(), { cast: false, name: 'town' });
    await ctx.yield();
    addMesh(Bf.geometry(), { name: 'avenue' }); addMesh(Bd.geometry(), { cast: false, name: 'avenue small things' });
    await ctx.yield();
    const Bc = makeBuf(8192); buildCourt(Bc);
    await ctx.yield();
    buildCourtThings(Bc, lay); addMesh(Bc.geometry(), { name: 'court' });
    await ctx.yield();
    const far = new THREE.Mesh(farLand(noise), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
    far.matrixAutoUpdate = false; scene.add(far);
    await ctx.yield();

    // ------------------------------------------------------------ ships: merchantmen moored and under sail; warships under oars
    const propMat = propMaterial(tU, new THREE.Vector3(sunColor.r, sunColor.g, sunColor.b).multiplyScalar(SUN_POWER), dawnU), oarMat = oarMaterial(tU);
    const TINTS = ['#9c3b25', '#2f5d7c', '#c9a046', '#d9cdb0', '#6b7a3a', '#7a2f2a'].map(lin);
    const inst = (geo, mat, n, tintOf, cast = false) => {
      const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = cast; m.receiveShadow = cast; m.name = 'ships';
      if (tintOf) { const t = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const c = tintOf(i); t[i * 3] = c[0]; t[i * 3 + 1] = c[1]; t[i * 3 + 2] = c[2]; } geo.setAttribute('iTint', new THREE.InstancedBufferAttribute(t, 3)); }
      scene.add(m); return m;
    };
    const fleets = [];
    for (const key of [15, 19, 23, 'set']) {
      const list = lay.merchants.filter((q) => (q.kind === 'sailing' || q.dry ? 'set' : q.len) === key);
      if (!list.length) continue;
      const B = makeBuf(4096), set = key === 'set', info = merchantShip(B, set ? 20 : key, set, set ? 1 : 0), fleet = { key, list, mesh: inst(B.geometry(), propMat, list.length, (i) => TINTS[list[i].tint % TINTS.length]) };
      if (set) { const Br = makeBuf(512); merchantShip(Br, 20, true, 2); fleet.rig = inst(Br.geometry(), propMat, list.length, (i) => TINTS[list[i].tint % TINTS.length]); fleet.pivot = info.pivot; }
      fleets.push(fleet);
      await ctx.yield();
    }
    // A PENNANT AT EVERY MERCHANTMAN'S MASTHEAD: a tapering strip of cloth in the ship's own colour, 1.9 m long, on a
    // short staff; it streams down the one wind whichever way the ship heads, and flutters most at its tail
    const Bpn = makeBuf(64), masts = [];
    Bpn.grid(6, 1, (u, v) => [0.06 + 1.9 * u, 0.42 + (v - 0.5) * 0.32 * (1 - 0.75 * u) - 0.22 * u * u, 0], WHITE, PF.PAINT, false, (u, v) => [0.02 + 0.3 * u, u * 6]);
    Bpn.beam([0, -0.05, 0], [0, 0.62, 0], 0.05, SPAR, SF.TIMBER);
    for (const f of fleets) { const Ls = f.key === 'set' ? 20 : f.key; f.mast = [Ls * 0.05, Ls * 0.6 + 2]; f.penn = masts.length; for (const q of f.list) masts.push(q); }
    const pennMesh = inst(Bpn.geometry(), propMat, masts.length, (i) => TINTS[(masts[i].tint + 2) % TINTS.length]), pennYaw = new THREE.Matrix4().makeRotationY(-Math.atan2(0.69, 0.72)), _mp = new THREE.Matrix4();
    const Bfs = makeBuf(256); farShip(Bfs);
    const farMesh = inst(Bfs.geometry(), propMat, lay.farSails.length, (i) => TINTS[lay.farSails[i].tint % TINTS.length]);
    const Bb = makeBuf(1024); rowingBoat(Bb);
    const boatMesh = lay.boats.length ? inst(Bb.geometry(), propMat, lay.boats.length, (i) => TINTS[(i * 2 + 1) % TINTS.length]) : null;
    const Bw = makeBuf(4096); warshipHull(Bw);
    const warMesh = inst(Bw.geometry(), propMat, lay.war.length, (i) => TINTS[lay.war[i].tint % 3 === 0 ? 0 : lay.war[i].tint % 3 === 1 ? 5 : 1], true);
    await ctx.yield();
    const rowers = lay.war.filter((q) => q.kind === 'row'), oarGeo = warshipOars();
    { const a = new Float32Array(rowers.length * 2); rowers.forEach((q, i) => { a[i * 2] = 1; a[i * 2 + 1] = q.phase; }); oarGeo.setAttribute('iRow', new THREE.InstancedBufferAttribute(a, 2)); }
    const oarMesh = inst(oarGeo, oarMat, rowers.length, null);
    await ctx.yield();
    const _m4 = new THREE.Matrix4(), _mr = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e3 = new THREE.Euler(0, 0, 0, 'YZX'), _p3 = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1), _s4 = [0, 0, 0, 0];
    const setShip = (mesh, i, x, y, z, hx, hz, roll, pitch) => {
      _e3.set(roll, Math.atan2(-hz, hx), pitch); _m4.compose(_p3.set(x, y, z), _q4.setFromEuler(_e3), _one); mesh.setMatrixAt(i, _m4);
    };
    const placeShips = (t) => {
      let anyFleet = false;
      for (const f of fleets) {
        let seen = false;
        for (let i = 0; i < f.list.length; i++) {
          const q = f.list[i], c = shipAt(q, t, _s4);
          if (inPicture(c[0], 3, c[1], q.len * 0.9 + 6)) seen = true;
          if (q.kind === 'hauled') setShip(f.mesh, i, c[0], q.lift + haulAt(t, q) * Math.sin(q.tilt), c[1], 1, 0, 0, -q.tilt);
          else setShip(f.mesh, i, c[0], 0.05 * Math.sin(t * 0.9 + q.ph), c[1], c[2], c[3], 0.025 * Math.sin(t * 0.7 + q.ph * 2), 0.012 * Math.sin(t * 0.8 + q.ph * 3));
          if (f.rig) { _mr.makeRotationY(q.kind === 'sailing' ? brace(c[2], c[3]) : 0.5).setPosition(f.pivot, 0, 0); f.rig.setMatrixAt(i, _mr.premultiply(_m4)); }
          pennMesh.setMatrixAt(f.penn + i, _mp.copy(pennYaw).setPosition(_p3.set(f.mast[0], f.mast[1], 0).applyMatrix4(_m4)));
        }
        f.mesh.instanceMatrix.needsUpdate = true; if (f.rig) f.rig.instanceMatrix.needsUpdate = true;
        show(f.mesh, seen); if (f.rig) show(f.rig, seen); if (seen) anyFleet = true;
      }
      pennMesh.instanceMatrix.needsUpdate = true; pennMesh.visible = anyFleet;
      let r = 0, warSeen = false;
      for (let i = 0; i < lay.war.length; i++) {
        const q = lay.war[i];
        const c = shipAt(q, t, _s4), row = q.kind === 'row';
        if (inPicture(c[0], 3, c[1], 90)) warSeen = true;
        setShip(warMesh, i, c[0], 0.03 * Math.sin(t * 0.8 + q.phase), c[1], c[2], c[3], 0.012 * Math.sin(t * 0.6 + 2 * q.phase), row ? 0.006 * Math.sin(t * 2.5133 + q.phase) : 0.008 * Math.sin(t * 0.7 + q.phase));
        if (row) { oarMesh.setMatrixAt(r++, _m4); }
      }
      warMesh.instanceMatrix.needsUpdate = true; oarMesh.instanceMatrix.needsUpdate = true; show(warMesh, warSeen); oarMesh.visible = warSeen; seenNow.war = warSeen;
      for (let i = 0; i < lay.farSails.length; i++) { const q = lay.farSails[i], c = shipAt(q, t, _s4); setShip(farMesh, i, c[0], 0.05 * Math.sin(t * 0.9 + q.ph), c[1], c[2], c[3], 0.025 * Math.sin(t * 0.7 + q.ph * 2), 0.012 * Math.sin(t * 0.8 + q.ph * 3)); }
      farMesh.instanceMatrix.needsUpdate = true;
      if (boatMesh) { let seen = false; for (let i = 0; i < lay.boats.length; i++) { const q = lay.boats[i], c = shipAt(q, t, _s4); if (inPicture(c[0], 1, c[1], 12)) seen = true; setShip(boatMesh, i, c[0], 0.04 * Math.sin(t * 1.1 + q.phase), c[1], c[2], c[3], 0.03 * Math.sin(t * 0.9 + q.phase * 2), 0.03 * Math.sin(t * 2.1 + q.phase)); } boatMesh.instanceMatrix.needsUpdate = true; show(boatMesh, seen); }
    };
    placeShips(0);

    // wakes: behind each ship under oars a spreading pale ribbon on the water along the way it has come, and a line of foam on
    // each hand where the blades work (laid along the ship's own course every frame; nothing is created after the build)
    const WAKE = { n: 13, step: 3.6 }, wakeVerts = rowers.length * 3 * WAKE.n * 2, wakePos = new Float32Array(wakeVerts * 3), wakeCol = new Float32Array(wakeVerts * 4), wakeIdx = [];
    for (let r = 0, v = 0; r < rowers.length * 3; r++) for (let k = 0; k < WAKE.n; k++, v += 2) {
      const side = r % 3 !== 0, a = (side ? 0.3 : 0.42) * Math.pow(1 - k / (WAKE.n - 1), 1.3) * smoothstep(0, 2, k);
      for (const j of [0, 1]) wakeCol.set([0.86, 0.93, 0.95, a], (v + j) * 4);
      if (k < WAKE.n - 1) wakeIdx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
    }
    const wakeGeo = new THREE.BufferGeometry();
    wakeGeo.setAttribute('position', new THREE.BufferAttribute(wakePos, 3).setUsage(THREE.DynamicDrawUsage)); wakeGeo.setAttribute('color', new THREE.BufferAttribute(wakeCol, 4)); wakeGeo.setIndex(wakeIdx);
    const wakeMesh = new THREE.Mesh(wakeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2.5, polygonOffsetUnits: -2 }));
    wakeMesh.frustumCulled = false; wakeMesh.renderOrder = 5; wakeMesh.matrixAutoUpdate = false; scene.add(wakeMesh);
    const placeWakes = (t) => {
      let v = 0;
      for (const q of rowers) for (let r = 0; r < 3; r++) for (let k = 0; k < WAKE.n; k++, v += 2) {
        const c = q.course.at(q.s0 + q.v * t - (r === 0 ? 16 : -6) - k * WAKE.step, _s4), lat = r === 0 ? 0 : (r === 1 ? 1 : -1) * 6.0, hw = r === 0 ? 1.2 + 0.42 * k : 0.5 + 0.12 * k;
        const cx = c[0] - c[3] * lat, cz = c[1] + c[2] * lat;
        wakePos[v * 3] = cx - c[3] * hw; wakePos[v * 3 + 1] = 0.17; wakePos[v * 3 + 2] = cz + c[2] * hw;
        wakePos[v * 3 + 3] = cx + c[3] * hw; wakePos[v * 3 + 4] = 0.17; wakePos[v * 3 + 5] = cz - c[2] * hw;
      }
      wakeGeo.attributes.position.needsUpdate = true;
    };
    placeWakes(0);

    // ------------------------------------------------------------ the mirror on the harbour's water (ours: mirrorMaterial).
    // The plain bodies ride on the ships' own matrices; their colours are the things' own under the morning's light on an
    // upright face turned to the sun (the sun through the haze at 5 m, and half the sky's and half the ground's light).
    { const ds = Math.exp(-2.1 * haze * Math.exp(-5 / 7)), hs = hemi.color, hg = hemi.groundColor, lit = [(sunColor.r * SUN_POWER * ds + 0.4 * (hs.r + hg.r)) * 0.48, (sunColor.g * SUN_POWER * ds + 0.4 * (hs.g + hg.g)) * 0.48, (sunColor.b * SUN_POWER * ds + 0.4 * (hs.b + hg.b)) * 0.48];
      const mats = { ships: mirrorMaterial(tU, dawnU, MIRROR.ships), quay: mirrorMaterial(tU, dawnU, MIRROR.quay), wall: mirrorMaterial(tU, dawnU, MIRROR.wall) };
      const lay1 = (geo, mat, order, of = null) => {
        const m = of ? new THREE.InstancedMesh(geo, mat, of.count) : new THREE.Mesh(geo, mat);
        if (of) { m.instanceMatrix = of.instanceMatrix; (of.userData.with || (of.userData.with = [])).push(m); }
        m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false; m.name = 'mirror'; scene.add(m);
      };
      for (const f of fleets) {
        const set = !!f.rig, B = makeBuf(256); mirrorMerchant(B, set ? 20 : f.key, set, set ? 1 : 0, lit); lay1(B.geometry(), mats.ships, 2, f.mesh);
        if (set) { const Br = makeBuf(64); mirrorMerchant(Br, 20, true, 2, lit); lay1(Br.geometry(), mats.ships, 2, f.rig); }
      }
      { const B = makeBuf(256); mirrorGalley(B, lit); lay1(B.geometry(), mats.ships, 2, warMesh); }
      if (boatMesh) { const B = makeBuf(64); mirrorBoat(B, lit); lay1(B.geometry(), mats.ships, 2, boatMesh); }
      { const B = makeBuf(64); mirrorFront(B, lit, 0); lay1(B.geometry(), mats.quay, 3); }
      { const B = makeBuf(512); mirrorFront(B, lit, 1); lay1(B.geometry(), mats.wall, 4); }
    }
    await ctx.yield();
    // the foam round the hulls (ours: foamMaterial): a ring for every floating hull, on the ship's own matrix
    { const foamMat = foamMaterial(tU), a2 = (t) => Math.abs(2 * t - 1);
      const lay1 = (geo, of, iOf) => {
        const m = new THREE.InstancedMesh(geo, foamMat, of.count), f = new Float32Array(of.count * 3);
        for (let i = 0; i < of.count; i++) f.set(iOf(i), i * 3);
        geo.setAttribute('iFoam', new THREE.InstancedBufferAttribute(f, 3)); m.instanceMatrix = of.instanceMatrix;
        m.frustumCulled = false; m.renderOrder = 5; m.matrixAutoUpdate = false; m.name = 'foam'; scene.add(m); (of.userData.with || (of.userData.with = [])).push(m);
      };
      for (const f of fleets) {
        const L = f.rig ? 20 : f.key, Bm = L * 0.29, fb = 1.3 + L * 0.02;
        const zw = (u) => { const half = Bm / 2 * Math.pow(Math.max(1 - Math.pow(a2(u), 2.3), 0), 0.55), keel = -1.25 * (1 - Math.pow(a2(u), 4)), sheer = fb + (u < 0.5 ? 1.5 : 1.0) * Math.pow(a2(u), 2.6); return half * Math.pow(clamp(-keel / (sheer - keel) / 0.8, 0, 1), 0.45); };
        lay1(foamGeometry(L, zw, 8, 0.4, 12), f.mesh, (i) => [0, f.list[i].kind === 'hauled' ? 0 : 1, f.list[i].kind === 'sailing' ? 1 : 0]);
      }
      lay1(foamGeometry(WAR.L, (u) => 2.0 * Math.pow(Math.max(1 - Math.pow(a2(u), 4), 0), 0.6) * 0.8, 10, 0.5), warMesh, () => [0, 1, 0]);
      if (boatMesh) lay1(foamGeometry(5.2, (u) => 0.78 * Math.pow(Math.max(1 - Math.pow(a2(u), 2.4), 0), 0.5) * 0.85, 6, 0.22, 5, [[-0.4, 2.5], [-0.4, -2.5], [0.9, 2.5], [0.9, -2.5]]), boatMesh, (i) => [lay.boats[i].phase, 1, lay.boats[i].course ? 1 : 0]);
    }
    await ctx.yield();

    // ------------------------------------------------------------ people and animals: instanced by kind and by quarter, placed by habit
    const figMats = figureMaterials(tU, dawnU);
    const GARB = ['#d8cfb4', '#e4e0d2', '#a8793a', '#8a3324', '#3c4f6e', '#666a3c', '#c8963a', '#75645a'].map(lin), WRAP = ['#ded8c6', '#93392c', '#48587a', '#a88c5a', '#5a6646', '#b4aea2'].map(lin);
    const COAT = ['#6e6258', '#8c7a66', '#4a4038', '#d9d2c2', '#7a5a3c'].map(lin);
    // the people are drawn by quarter (the quay's north half and its south half, the gate and the low zone, the square, the
    // upper street, the court's east part and its inner part), each mesh bounded by its own people's places and walks
    // THE COURT'S INNER PEOPLE (a law that goes by the eye's place: section 153, named at the head as (c)): the court's
    // floor lies 21.5 m above the water and 20 m above the quay, and east of the harbour wall's inner face (x 290) the
    // way keeps low: the lens is 5.2 m up at most there (over the water, on the quay, in the gate). From those places
    // the straight line from the eye over the east lip of the porch's floor (x 64) passes 2.3 m and more over the
    // paving at x 24, 40 m inside the court's east edge, and higher further west: over a person who stands there. So
    // those of the court who keep west of x 24 (a walker: on her whole round) are a quarter of their own, drawn only
    // while the eye is west of the wall's inner face or above the court's floor (update()). The typed bound is plainer
    // and wider than that line: an eye east of the wall and close under the court's floor would find them not drawn;
    // no place of the way lies there.
    const QUARTERS = ['quay north', 'quay south', 'low zone', 'square', 'upper street', 'court', 'court, inner'], _o6 = [0, 0, 0, 0, 0, 0], INNER_X = 24, innerMeshes = [];
    const innerOf = (q) => { if (!q.course) return q.x < INNER_X; for (let s = 0; s < q.course.length; s += 0.5) { q.course.at(s, _o6); if (_o6[0] >= INNER_X) return false; } return true; };
    const quarterOf = (q) => {
      if (q.zone === 'C') return innerOf(q) ? 6 : 5;
      let x = q.x, z = q.z;
      if (q.course) { x = 0; z = 0; for (let i = 0; i < 8; i++) { q.course.at(i / 8 * q.course.length, _o6); x += _o6[0] / 8; z += _o6[1] / 8; } }
      return x > WALL_X1 ? (z < 0 ? 0 : 1) : x > SQ.x1 ? 2 : x > SQ.x0 ? 3 : 4;
    };
    const boundsOf = (list) => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      const take = (x, z, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 2.4); };
      for (const q of list) {
        if (q.course) for (let i = 0; i < 16; i++) { q.course.at(i / 16 * q.course.length, _o6); take(_o6[0], _o6[1], q.y ?? walkY(_o6[0], _o6[1])); }
        else take(q.x, q.z, q.y ?? walkY(q.x, q.z));
      }
      return new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 1.5);
    };
    const crowd = [];
    // what the arms do: a load decides it; of those who stand, a priest prays, those turned to the statue greet it, pray, hold
    // their hands before them or stand at ease, the others stand at ease, hold their hands before them or rest a hand on the hip (a share
    // of each from the body's own phase)
    const AT_GAZE = [1, 2, 2, 0, 0, 4, 1, 2], AT_EASE = [0, 0, 4, 3, 0, 0, 4, 3];
    const stanceOf = (q) => {
      if (q.kind === 1 ? q.sack : q.jar) return q.kind === 1 ? 6 : 5;
      if (q.kind !== 1 && q.branch) return 7;
      if (q.habit !== 0) return 0;
      return q.priest ? 2 : (q.gaze ? AT_GAZE : AT_EASE)[Math.floor(q.ph * 97.3) % 8];
    };
    // FROM FAR, A QUARTER'S PLAIN PEOPLE ARE DRAWN IN FEWER FACES ((a) at the head: a rule of the eye's distance, never of
    // where it looks; the same at every place and on every visit): the grown people of a quarter who carry nothing and hold nothing stand in meshes of their own; while
    // the lens is more than 60 m from such a mesh's bounds the same people, at the same places, in the same garb and at
    // the same step, are drawn as the plainer figure, and beyond 120 m as the plainest (a body, a head, the legs, the
    // felt hat; no arms). Beyond 120 m the grown people who carry or hold something are drawn as the plainest figure
    // too (a jar on a head is a pixel and a half there). Every mesh is made in build(); update() only says which one of
    // a group is drawn.
    const LOD = [60, 120], lods = [], isPlain = (q) => !(q.kind === 2 || q.jar || q.sack || q.branch || q.priest || q.habit === 2 || q.habit === 3);
    const makeCrowd = (baseGeo, list, zone, isAnimal, shadeGeo = null, tiers = null) => {
      if (!list.length) return null;
      const n = list.length, geo = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'color', 'surf', 'wave']) geo.setAttribute(k, baseGeo.attributes[k]);
      geo.setIndex(baseGeo.index);
      const anim = new Float32Array(n * 4), t1 = new Float32Array(n * 3), t2 = new Float32Array(n * 3), flag = new Float32Array(n * 3);
      list.forEach((q, i) => {
        const moving = q.habit !== 0, gait = moving ? 6.2832 * (q.v || 0.62) / (isAnimal ? 1.0 : 1.45 * q.sc * (q.kind === 2 ? 0.7 : 1)) : 0.5 + 0.9 * ((i * 0.37) % 1);
        anim[i * 4] = q.ph; anim[i * 4 + 1] = gait; anim[i * 4 + 2] = moving ? 1 : -(0.1 + 0.25 * ((i * 0.61) % 1)) * (q.gaze ? 0.4 : 1); anim[i * 4 + 3] = isAnimal ? 0 : stanceOf(q);
        const g = isAnimal ? COAT[q.tint % COAT.length] : q.priest ? [0.9, 0.88, 0.82] : GARB[q.g], w = isAnimal ? g : q.priest ? [0.92, 0.9, 0.85] : WRAP[q.w];
        t1.set(g, i * 3); t2.set(w, i * 3); flag[i * 3] = q.hat || q.branch || 0; flag[i * 3 + 1] = q.jar || 0; flag[i * 3 + 2] = q.sack || 0;
      });
      geo.setAttribute('iAnim', new THREE.InstancedBufferAttribute(anim, 4)); geo.setAttribute('iTint', new THREE.InstancedBufferAttribute(t1, 3));
      geo.setAttribute('iTint2', new THREE.InstancedBufferAttribute(t2, 3)); geo.setAttribute('iFlag', new THREE.InstancedBufferAttribute(flag, 3));
      const m = new THREE.InstancedMesh(geo, figMats.lit, n); m.customDepthMaterial = figMats.depth; m.castShadow = isAnimal; m.receiveShadow = true; m.name = (isAnimal ? 'animals ' : 'people ') + zone;
      m.boundingSphere = boundsOf(list); m.boundingBox = new THREE.Box3().setFromCenterAndSize(m.boundingSphere.center, new THREE.Vector3(1, 1, 1).multiplyScalar(m.boundingSphere.radius * 2));
      scene.add(m); const inner = zone.indexOf('court, inner') === 0; if (inner) innerMeshes.push(m);
      // a person's shadow is cast by a plain body of twenty triangles that stands where the figure stands (the same instance
      // matrices) and draws no colour: the figure itself is not drawn again into the sun's depth map
      if (shadeGeo) {
        const sm = new THREE.InstancedMesh(shadeGeo, figMats.shade, n); sm.instanceMatrix = m.instanceMatrix; sm.castShadow = true; sm.receiveShadow = false; sm.name = 'shade of people ' + zone;
        sm.boundingSphere = m.boundingSphere; sm.boundingBox = m.boundingBox; scene.add(sm); if (inner) innerMeshes.push(sm);
        // (for the sun's depth map only: none of them is drawn into the picture)
        sm.onBeforeShadow = () => { sm.count = n; }; sm.onBeforeRender = () => { sm.count = 0; };
      }
      if (tiers) {
        // (tiers: the figure drawn beyond LOD[0] and the one beyond LOD[1]; null where the mesh's own figure stays)
        const meshes = tiers.map((tg) => {
          if (!tg) return m;
          const pg = new THREE.BufferGeometry();
          for (const k of ['position', 'normal', 'color', 'surf', 'wave']) pg.setAttribute(k, tg.attributes[k]);
          for (const k of ['iAnim', 'iTint', 'iTint2', 'iFlag']) pg.setAttribute(k, geo.attributes[k]);
          pg.setIndex(tg.index);
          const pm = new THREE.InstancedMesh(pg, figMats.lit, n); pm.instanceMatrix = m.instanceMatrix; pm.customDepthMaterial = figMats.depth; pm.castShadow = false; pm.receiveShadow = true; pm.name = m.name + ', seen far'; pm.userData.tier = true;
          pm.boundingSphere = m.boundingSphere; pm.boundingBox = m.boundingBox; pm.visible = false; scene.add(pm); if (inner) innerMeshes.push(pm);
          return pm;
        });
        lods.push({ meshes: [m, ...meshes], sphere: m.boundingSphere }); m.userData.tiered = true;
      }
      const c = { mesh: m, list, anim, flag, dyn: list.some((q) => q.habit === 3), still: list.every((q) => q.habit === 0) };
      crowd.push(c); return c;
    };
    const figGeos = [figureGeometry(0), figureGeometry(1), figureGeometry(2)], shadeGeos = [figureShade(0), figureShade(1), figureShade(2)];
    await ctx.yield();
    // somebody on a balcony or at a roof's parapet (the town's own places); a lower detail draws fewer of the same people
    const rpp = mk('perch-people'), share = clamp(detail, 0.5, 1);
    const perched = perch.map((q, i) => ({ zone: 'A', kind: q.kind ?? (rpp.chance(0.5) ? 0 : 1), habit: 0, x: q.x, z: q.z, y: q.y, face: q.face, sc: rpp.range(0.92, 1.02), ph: rpp.range(0, 6.28), hat: 0, jar: 0, sack: 0, g: rpp.int(0, 7), w: rpp.int(0, 5), cut: (i * 0.618034) % 1 }));
    const drawn = lay.people.concat(perched).filter((q) => q.keep || q.habit === 3 || q.cut < share);
    for (const q of drawn) q.quarter = quarterOf(q);
    // FAR FROM THE FLOWN LINE (18 m and more from every place of it, by the person's own place or whole walk), a grown person
    // with no load and nothing in the hand is drawn as the plainer figure (it keeps the felt hat)
    { const FAR = 18, way = [], _p = new THREE.Vector3();
      for (let i = 0, n = Math.ceil(L / 3); i <= n; i++) { path.pointAt(i / n, _p); way.push(_p.x, _p.y, _p.z); }
      const gap = (x, y, z) => { let d = 1e9; for (let i = 0; i < way.length; i += 3) d = Math.min(d, (way[i] - x) ** 2 + (way[i + 1] - y - 1) ** 2 + (way[i + 2] - z) ** 2); return Math.sqrt(d); };
      for (const q of drawn) {
        q.far = false;
        if (q.kind === 2 || q.jar || q.sack || q.branch || q.priest || q.habit === 2) continue;
        let d = 1e9;
        if (q.course) for (let i = 0, n = Math.ceil(q.course.length / 3); i < n; i++) { q.course.at(i / n * q.course.length, _o6); d = Math.min(d, gap(_o6[0], q.y ?? walkY(_o6[0], _o6[1]), _o6[1])); }
        else d = gap(q.x, q.y ?? walkY(q.x, q.z), q.z);
        q.far = d >= FAR;
      } }
    await ctx.yield();
    const farGeos = [figureGeometry(0, 1), figureGeometry(1, 1)], speckGeos = [figureGeometry(0, 2), figureGeometry(1, 2)], farShades = [figureShade(0, true), figureShade(1, true)];
    // (a quarter with fewer than twelve such of one kind keeps them as full figures: a mesh of its own is not worth it)
    for (let k = 0; k < QUARTERS.length; k++) for (const kind of [0, 1]) { const few = drawn.filter((q) => q.quarter === k && q.kind === kind && q.far); if (few.length < 12) for (const q of few) q.far = false; }
    for (let k = 0; k < QUARTERS.length; k++) for (const kind of [0, 1, 2]) {
      const near = drawn.filter((q) => q.quarter === k && q.kind === kind && !q.far), plain = kind < 2 ? near.filter(isPlain) : [];
      // (a quarter with fewer than twelve plain people of one kind keeps them with the others)
      // (those who carry or hold something keep their own figure to 120 m and are the plainest figure beyond it)
      const own = kind < 2 ? [null, speckGeos[kind]] : null;
      if (plain.length >= 12) { makeCrowd(figGeos[kind], near.filter((q) => !isPlain(q)), QUARTERS[k], false, shadeGeos[kind], own); makeCrowd(figGeos[kind], plain, QUARTERS[k] + ', plain', false, shadeGeos[kind], [farGeos[kind], speckGeos[kind]]); }
      else makeCrowd(figGeos[kind], near, QUARTERS[k], false, shadeGeos[kind], own);
      if (kind < 2) makeCrowd(farGeos[kind], drawn.filter((q) => q.quarter === k && q.kind === kind && q.far), QUARTERS[k] + ', far', false, farShades[kind], [null, speckGeos[kind]]);
      if (kind === 2 && k % 2 === 1) await ctx.yield();
    }
    for (const kind of [0, 1, 2]) makeCrowd(animalGeometry(kind), lay.animals.filter((q) => q.kind === kind), 'of the town', true);
    await ctx.yield();
    const _b = [0, 0, 0, 0, 0, 0];
    const placeCrowd = (t, first) => {
      for (const c of crowd) {
        if (c.still && !first) continue;
        const a = c.mesh.instanceMatrix.array, list = c.list;
        for (let i = 0; i < list.length; i++) {
          const q = list[i];
          if (q.habit === 0 && !first) continue;
          const o = bodyAt(q, t, _b), k = i * 16, sc = q.sc, y = q.y ?? walkY(o[0], o[1]);
          a[k] = o[2] * sc; a[k + 1] = 0; a[k + 2] = o[3] * sc; a[k + 3] = 0; a[k + 4] = 0; a[k + 5] = sc; a[k + 6] = 0; a[k + 7] = 0;
          a[k + 8] = -o[3] * sc; a[k + 9] = 0; a[k + 10] = o[2] * sc; a[k + 11] = 0; a[k + 12] = o[0]; a[k + 13] = y; a[k + 14] = o[1]; a[k + 15] = 1;
          if (c.dyn && q.habit === 3) c.flag[i * 3 + 2] = o[4];
        }
        c.mesh.instanceMatrix.needsUpdate = true;
        if (c.dyn) c.mesh.geometry.attributes.iFlag.needsUpdate = true;
      }
    };
    placeCrowd(0, true);

    // ------------------------------------------------------------ smoke (a medium), gulls, cloth
    // The one wind blows from the north west: every column leans south east, away from the statue. All are pale, thin and low:
    // the altar's (x 20, z 15) and those of the lesser altars that burn, the founder's over his furnace south of the avenue,
    // the smith's, the potter's kiln's, two or three kitchen smokes over the roofs further south (60 m and more from the
    // avenue), and the hearths' of the avenue's houses and of the far town (below). Each has its own stream.
    const WIND = [0.72, 0, 0.69], smokes = [];
    const smoke = (name, o) => { const c = fx.makeSmokeColumn({ rng: mk(name), time: 0, sunDir, sunColor, wind: WIND, fog: true, ...o }); scene.add(c.object); smokes.push(c); };
    // smoke is many small soft puffs that thin as they rise and lean with the wind: gold where the sun takes them, blue grey
    // in their own shade
    const PUFFS = { color: '#efc98a', colorTop: '#f4dfba', shadowColor: '#8a8696', ambient: '#1c1c22', ragged: 1.35, softness: 0.5, frequency: 2.3, rate: 0.06, cluster: 0.35, variation: 0.3 };
    smoke('smoke-altar', { ...PUFFS, position: [ALTAR[0], COURT_Y + 2.1, ALTAR[1]], height: 12, radius: [0.1, 1.5], size: [0.35, 2.3], count: 84, opacity: 0.5, bend: 0.75 });
    smoke('smoke-founder', { ...PUFFS, position: [FOUNDRY.fx, groundY(FOUNDRY.x0, FOUNDRY.z0 + 6) + 3.3, FOUNDRY.fz], height: 10, radius: [0.12, 1.3], size: [0.4, 2.2], count: 64, color: '#b8a78e', colorTop: '#dccdb6', opacity: 0.5, bend: 0.6 });
    lay.court.altars.filter((a) => a.burns).forEach((a, i) => smoke('smoke-round' + i, { ...PUFFS, position: [a.x, COURT_Y + a.h + 0.3, a.z], height: 5.5, radius: [0.05, 0.6], size: [0.2, 1.1], count: 30, opacity: 0.42, bend: 0.7 }));
    if (perch.smith) smoke('smoke-smith', { ...PUFFS, position: perch.smith, height: 7, radius: [0.08, 0.8], size: [0.3, 1.5], count: 36, color: '#b3a48e', colorTop: '#d9cbb6', opacity: 0.44, bend: 0.6 });
    (perch.kilns || []).forEach((p, i) => smoke('smoke-kiln' + i, { ...PUFFS, position: p, height: 9, radius: [0.1, 1.2], size: [0.4, 2.0], count: 44, color: '#b3a48e', colorTop: '#d9cbb6', opacity: 0.5, bend: 0.6 }));
    { const Rk = mk('smoke-kitchens'); for (let i = 0, n = Rk.int(2, 3); i < n; i++) { const x = Rk.range(130, 270), z = Rk.range(62, 140); smoke('smoke-kitchen' + i, { ...PUFFS, position: [x, groundY(x, z) + 6, z], height: 9, radius: [0.1, 1.1], size: [0.4, 2.0], count: 40, color: '#bcad96', colorTop: '#dccfba', opacity: 0.44, bend: 0.6 }); } }
    // THE HEARTHS OF THE AVENUE'S HOUSES (ours): from the smoke hoods on the tiled roofs of the avenue's rows and of the
    // rows behind them the morning's smoke rises, thin and low: from up to three hoods of each of the avenue's three
    // blocks of tiled houses (the lower street's and the upper street's two); which hoods, the stream deals: three
    // picks to a block, and a pick that falls on a hood already taken lights no second column (every hood stands
    // 12 m and more from the avenue's middle, and no column leans more than 5 m)
    { const Ra = mk('smoke-avenue'), hoods = perch.hoods || [], picks = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => Ra());
      [LANES[1], LANES[3], LANES[3] - 48].forEach((x1, b) => { const list = hoods.filter((p) => p[0] > x1 && p[0] < x1 + 48), taken = [];
        for (let i = 0; i < 3 && list.length; i++) { const k = Math.floor(picks[b * 3 + i] * list.length) % list.length, p = list[k]; if (taken.includes(k)) continue; taken.push(k);
          smoke('smoke-hood' + (b * 3 + i), { ...PUFFS, position: [p[0], p[1], p[2]], height: 6.5, radius: [0.08, 0.9], size: [0.3, 1.7], count: 30, color: '#bcad96', colorTop: '#dccfba', opacity: 0.46, bend: 0.6 }); } }); }
    // THE HEARTHS OF THE FAR TOWN (ours): from three roofs of the hill's rows south and south west of the court and from two
    // houses of the upper town west of it the morning's smoke rises, the same thin smoke, taller, seen far; which roofs,
    // the stream deals
    { const Rh = mk('smoke-hearths'), hill = perch.far.filter((p) => p[2] > 90 && p[0] < 90), picks = [0, 1, 2, 3, 4].map(() => Rh());
      picks.forEach((v, i) => { const list = i < 3 ? hill : upperHouses; if (!list.length) return; const p = list[Math.floor(v * list.length) % list.length];
        smoke('smoke-hearth' + i, { ...PUFFS, position: [p[0], p[1] + 0.3, p[2]], height: 17, radius: [0.15, 2.3], size: [0.6, 3.8], count: 44, color: '#bcad96', colorTop: '#dccfba', opacity: 0.46, bend: 0.6 }); }); }
    await ctx.yield();
    // gulls, swifts and doves: the kit's loose flocks, each on a ring of its own (the layout's); what the kit is handed
    // is flockOf's: the count, the course, the wander, and no spread but the lag along the course
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    for (let i = 0; i < lay.gulls.length; i++) { const g = lay.gulls[i]; if (g.n >= 1) fauna.add(F.makeFlock({ rng: mk('gulls' + i), ...flockOf(g, i, path) }), { always: true }); await ctx.yield(); }
    // cloth that stirs in the one wind: plain coloured hangings in the gate porch (and, with the town, awnings and washing)
    const DYES = ['#a8563f', '#b39656'].map(lin);
    const BORDER = lin('#d8c79a');
    const hanging = (x, z0, z1, y0, y1, col, ph) => Bcl.grid(2, 6, (u, v) => [x, lerp(y1, y0, v), lerp(z0, z1, u)], (u, v) => (v < 0.01 || v > 0.99 ? BORDER : mul(col, (Math.abs(u - 0.5) < 0.01 ? 1.25 : 0.95) * (0.92 + 0.16 * ((Math.round(v * 6) % 2))))), SF.CLOTH, false, (u, v) => [0.03 + 0.11 * v * v, ph + v * 2.2 + u]);
    { const zo = PORCH.clear / 2 + PORCH.pillar, z0 = zo + 0.7, dye0 = mk('cloth').int(0, 1), ys = COURT_Y + PORCH.soffit; let k = 0;
      for (const sg of [-1, 1]) for (const i of [0, 1]) hanging(COURT.x1 + 1.24, sg * (z0 + i * 2.6), sg * (z0 + i * 2.6 + 2.0), COURT_Y + 1.5, COURT_Y + PORCH.wall - 0.35, DYES[(k++ + dye0) % 2], k * 1.7);
      // in the porch's open sides a short hanging under each side beam, over the heads of those who pass
      for (const sg of [-1, 1]) for (const i of [0, 1]) { const xa = COURT.x1 + 1.5 + i * 2.3, col = DYES[(k++ + dye0) % 2], ph = k * 1.7;
        Bcl.grid(1, 4, (u, v) => [lerp(xa, xa + 1.9, u), lerp(ys - 0.02, ys - 1.5, v), sg * (zo - 0.45)], (u, v) => mul(col, 0.92 + 0.16 * ((Math.round(v * 4) % 2))), SF.CLOTH, false, (u, v) => [0.02 + 0.08 * v * v, ph + v * 2.2 + u]); } }
    // at the harbour gate: a long hanging on each pier beside the opening, and on the front of each of the gate's two
    // towers a festival hanging of 1.8 m by 4.3 m from a rod under the string course, over the tower's door
    for (const sg of [-1, 1]) { const zc = sg * (GATE_TOWER_Z + TOWER_W / 2); hanging(WALL_X1 + 2.14, zc - 0.9, zc + 0.9, QUAY_Y + 3.75, QUAY_Y + TOWER_H - 3.4 - 0.52, DYES[1], 3.1 + sg); }
    { const dye0 = mk('gate-cloth').int(0, 1), gz = GATE_W / 2; let k = 0;
      for (const sg of [-1, 1]) {
        const za = sg * (gz + 0.6), zb = sg * (gz + 1.6), deep = lin(dye0 ? '#7e2f25' : '#863a22'), band = lin('#b08a48'); k++;
        Bcl.grid(1, 9, (u, v) => [WALL_X1 + 0.62, lerp(QUAY_Y + GATE_H + 0.93, QUAY_Y + 3.7, v), lerp(za, zb, u)], (u, v) => (v > 0.78 && v < 0.9) || v < 0.06 ? band : deep, SF.CLOTH, sg < 0, (u, v) => [0.02 + 0.09 * v * v, k * 1.3 + v * 2.2 + u]);
      } }
    { const rc2 = mk('parapet-cloths'); for (let x = 4 + rc2.range(0, 6); x < 60; x += rc2.range(9, 16)) { const w = rc2.range(1.1, 1.8), col = CLOTHS[rc2.int(0, 5)], drop = rc2.range(0.5, 0.75), x0 = x;
      Bcl.grid(2, 3, (u, v) => [x0 + w * u, COURT_Y + 0.93 - (v > 0.34 ? (v - 0.34) / 0.66 * drop : 0), TERRACE_Z - 0.3 + Math.min(v, 0.34) / 0.34 * 0.4 + (v > 0.34 ? 0.03 : 0)], col, SF.CLOTH, false, (u, v) => [v > 0.4 ? 0.03 * v : 0, x0 + u * 2]); } }
    // THE FESTIVAL'S CLOTH IN THE COURT: along the south stoa a swag of dyed cloth hangs in every bay between two columns,
    // from under the architrave, red and saffron by turns
    for (let x = -48, k = 0; x < 47.9; x += 4, k++) { const xa = x + 0.45, col = DYES[k % 2];
      Bcl.grid(3, 2, (u, v) => [lerp(xa, xa + 3.1, u), COURT_Y + 3.38 - (0.25 + 0.75 * v) * (0.35 + 1.5 * Math.sin(u * Math.PI)) * 0.62, 52.6 - 0.34], (u, v) => (v > 0.99 ? BORDER : mul(col, 0.92 + 0.14 * (Math.round(u * 3) % 2))), SF.CLOTH, false, (u, v) => [0.02 + 0.07 * v, k * 1.9 + u * 2 + v]); }
    const clothMesh = new THREE.Mesh(Bcl.geometry(), propMat); clothMesh.castShadow = true; clothMesh.receiveShadow = true; clothMesh.matrixAutoUpdate = false; clothMesh.frustumCulled = false; clothMesh.name = 'cloth';
    scene.add(clothMesh);
    await ctx.yield();

    // ------------------------------------------------------------ the statue on its base (the part), at the head of the avenue
    const hero = await buildHero(ctx, { sunDir: sunDir.clone(), sunColor: sunColor.clone(), envMap: null, detail, skyZenith: dawn ? '#1b3474' : '#1f3d85', skyHorizon: sky.horizonColor.clone(), groundColor: '#b89a80' });
    hero.object.position.set(0, COURT_Y, 0); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();

    // ------------------------------------------------------------ the pace and the one look (flightOf above: rules of the route's place)
    // (the place where the jaw's look is whole goes by the part's own height of his waist's middle; r8: his middle and
    // the line of his jaw are read from the part as his chest and feet are, and where a part hands out neither the
    // typed ones at flightOf stand in)
    const wm = hero.info.heights && hero.info.heights.waistMiddle, Mh = wm ? { ...M, waist: layR.lensAt(wm.overBaseFoot) } : M;
    const ch = hero.info.looks.chest, ft = hero.info.looks.feet, md = hero.info.looks.middle, jw = hero.info.looks.jaw;
    const flight = flightOf(path, L, Mh, [ch[0], COURT_Y + ch[1], ch[2]], [ft[0], COURT_Y + ft[1], ft[2]], md && [md[0], COURT_Y + md[1], md[2]], jw && [jw[0], COURT_Y + jw[1], jw[2]]);

    const _at = new THREE.Vector3(), _f = new THREE.Vector3();
    const sRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), sunDir).normalize(), sUp = new THREE.Vector3().crossVectors(sunDir, sRight).normalize();
    // (r8) THE STATUE'S SHADE IS CAST ONLY WHILE HIS BOX MEETS THE SUN'S BOX. The part's shade of him is a skin for the sun's
    // depth map alone. The renderer asks by a ball about him, 18 m round, whether to send it there, and so from far down
    // the route it sent the whole skin to the map while every triangle of it still lay outside the map's edge and was cut
    // away again. Now two boxes are asked, by place: his own (the box the part declares for the skin, widened by any
    // corner of the skin that lay outside it: none does), measured once along the two sides of the sun's box, for he
    // does not move; and the sun's box where placeShadow has just set it down. THE MARGIN is one whole texel of the map
    // on every side: the box is set down in whole texels, so a texel is the measure in which its place is true, and it is
    // many times what the card's single floats can be off at these distances (under a millimetre). Depth is not asked.
    // Where the two boxes meet he is cast as before, so no shadow of his is lost and none moves.
    const shade = hero.object.getObjectByName('shade'), shadeBox = [Infinity, -Infinity, Infinity, -Infinity];   // least and greatest along sRight, then along sUp
    if (shade) {
      const bb = new THREE.Box3().setFromBufferAttribute(shade.geometry.attributes.position).union(shade.geometry.boundingBox);
      for (let i = 0; i < 8; i++) {
        _at.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(shade.matrixWorld);
        const r = _at.dot(sRight), s = _at.dot(sUp);
        shadeBox[0] = Math.min(shadeBox[0], r); shadeBox[1] = Math.max(shadeBox[1], r); shadeBox[2] = Math.min(shadeBox[2], s); shadeBox[3] = Math.max(shadeBox[3], s);
      }
    }
    // the shadow box stands by the ROUTE: its middle at the path's point 60 m on from the metres flown, moved in whole texels of the map
    // so that shadow edges do not swim.
    const placeShadow = (u) => {
      path.posAtDist(Math.min(L, clamp(u, 0, 1) * L + SH.ahead), _at);
      const tx = 2 * SH.halfW / sun.shadow.mapSize.x, ty = (SH.hi - SH.lo) / sun.shadow.mapSize.y;
      const a = Math.round(_at.dot(sRight) / tx) * tx, b = Math.round(_at.dot(sUp) / ty) * ty, c = _at.dot(sunDir);
      _f.set(0, 0, 0).addScaledVector(sRight, a).addScaledVector(sUp, b).addScaledVector(sunDir, c);
      sun.target.position.copy(_f); sun.position.copy(_f).addScaledVector(sunDir, SH.back);
      sun.target.updateMatrixWorld(); sun.updateMatrixWorld();
      // (the sun's box reaches SH.halfW to either hand of its middle along sRight, and from SH.lo to SH.hi along sUp)
      if (shade) shade.castShadow = shadeBox[1] > a - SH.halfW - tx && shadeBox[0] < a + SH.halfW + tx && shadeBox[3] > b + SH.lo - ty && shadeBox[2] < b + SH.hi + ty;
    };
    placeShadow(0);

    return {
      scene, path, duration: DURATION, pace: flight.pace, ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 60, near: 0.3, far: 5200, lookAhead: LOOK_AHEAD, sway: 0.8, bank: 0, nearThrough: 0.3 },
      pois: flight.pois,
      // THE RING is first drawn where the lens is at the porch's middle: drawWithin is the route's length left at that
      // place (61.3 m), and from there the engine opens the ring about its own middle over the next 14 m of route (its
      // own rule; portal.drawIn is not set). At its first drawing the porch's west beam (its soffit 1.5 m over the lens)
      // stands between the lens and the ring; the straight line from the lens to the ring's middle passes under the
      // beam's west edge from about 3 m short of the porch's west edge on, and from there the ring stands in the open
      // sky on his north side. The next world begins to show in it from the porch's middle too (revealDistance)
      portal: { shape: 'circle', radius: RING_R, tilt: true, color: '#7cc4e6', glow: 0.45, revealDistance: Math.floor((L - M.mid) * 10) / 10, drawWithin: Math.round((L - M.mid) * 10) / 10 },
      post: { exposure: 1.0, bloom: { strength: 0.12, radius: 0.5, threshold: 1.6 }, grade: { saturation: 1.1, contrast: 1.03, tint: '#fff3e4', shadowTint: '#0c1436', vignette: 0.24, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera); ocean.update(dt, time, camera); bank.update(dt, time, camera);
        _fr.setFromProjectionMatrix(_pv.copy(camera.matrixWorld).invert().premultiply(camera.projectionMatrix)); seenNow.on = true;
        seenNow.front = false; for (let i = 0; i < frontBoxes.length; i++) if (_fr.intersectsBox(frontBoxes[i])) { seenNow.front = true; break; }
        placeShips(time); placeWakes(time); placeCrowd(time, false); wakeMesh.visible = seenNow.war;
        _at.setFromMatrixPosition(camera.matrixWorld);
        for (const l of lods) { const d = _at.distanceTo(l.sphere.center) - l.sphere.radius, pick = l.meshes[d > LOD[1] ? 2 : d > LOD[0] ? 1 : 0]; for (const mm of l.meshes) mm.visible = mm === pick; }
        { const east = _at.x > WALL_X0 && _at.y < COURT_Y; for (let i = 0; i < innerMeshes.length; i++) { const mm = innerMeshes[i]; if (east) mm.visible = false; else if (!mm.userData.tiered && !mm.userData.tier) mm.visible = true; } }
        for (const c of smokes) c.update(dt, time);
        fauna.update(dt, time, camera, u);
        placeShadow(u);
        hero.update(dt, time, camera);
      },
      dispose() { if (hero.dispose) hero.dispose(); if (sky.dispose) sky.dispose(); if (bank.noiseTexture) bank.noiseTexture.dispose(); },
    };
  },
};
