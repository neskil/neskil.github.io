// THE ISLAND BEING BORN: at wave height on a road of pumice toward an island three weeks old that is
// still blasting itself out of the sea; in through its breach, under a surge cloud, up the slot.
//
// MAP OF THIS FILE (in order)
//   1. constants (the brief's seconds T_SURGE_IN / T_SURGE_OUT / T_SPLASH / T_VOLLEY / T_HELD / T_APPROACH, MIST_TOP, the MIST
//      table: the cloud's density at the eye against its depth behind the surge front, RHO_PEAK, RHO_BODY), MOODS (seeded hour: morning / noon / afternoon /
//      night: sun height and colour, sky, haze, exposure, grade, sea colours).
//   2. GLSL: WS_NOISE, SEA_GLSL (a copy of the kit ocean's vertex waves, fed by the ocean's own uniforms,
//      so stones, raft and streamers float exactly on its surface on the GPU), RAFT_GLSL (where the pumice lies).
//   3. builders: buildStones (smooth pitted stones in a box that wraps round the camera, + a foam ring
//      round each + steam wisps off the hot ones; dealWisps keeps every wisp 2.0 m of clear air from the route's line, by place:
//      one too near stands on another hot stone already standing), buildRaft (a sheet along the run-in that draws the
//      far raft per pixel: the real stones' own kinds, numbers and standing rule, each a lump standing proud of the water, lit
//      as they are, going to its mean where a pixel is wider than a lump; its stones grow in over the ring 17.5 to 22.5 m from
//      the lens where the real stones shrink away), buildOchre (12 ochre
//      streamers on the stained sea), MIST_LAW (the part's fog law for the surge's mist, as this file's sky veil and sea read it), LAW_FOG (the sea's fog, the look's haze and
//      the mist by that law, as this world's own things on the sea lay it),
//      buildVeil (the surge's mist: the sky veil, which is that law for the sky, and the cloud itself, placed in the world), buildShip (trawler), buildSplash (the one bomb that comes down to port on the run-in),
//      buildSkyBombs (the bomb every volley throws high over the back of the island, with its steam).
//   4. build(): seeded picks -> sky, light rig, fog -> HERO (placed at C, no rotation) -> PATH (the
//      hero's flyThrough anchor + C), pace, uAtSecond / secondAtU (the one map between the brief's seconds and places) ->
//      depth map and kit ocean (in its fragment text the kit's fog statement gives way to the surge's one fog law) -> stones, raft,
//      streamers, ship, birds, ash, rainbow, rare waterspout, splash, veils + ash flecks, more terns, sky bombs -> GAZE of the climb ->
//      update -> return (POIS, PORTAL, POST; pace).
//   5. update(): the eruption clock (keyed to u; runs on by itself while u stands still, as in the portal
//      preview) -> hero.setClock -> SURGE (see below) -> kit updates -> ship pose.
//
// Scripted moments and what drives them
//   THE BRIEF'S SECONDS ARE PLACES: second S of the 50 is the u the flight has reached after S / 50 of its time at this pace
//     (uAtSecond; secondAtU is the same table read the other way, and there is no other map). The bomb to port strikes at
//     u(15 s); the surge front rolls over the camera at SURGE_U = u(32.5 s); we leave the surge at U_OUT = u(37 s), where the look down's own
//     poi takes the eye (the ring is out of the frame from 40.7 to 44.1 s of the flight); U_APPROACH = u(46 s) is read by no line that is live.
//   volleys / bombs / surge ring: hero.setClock(clockAtU(u) + surgeOff + drift), clockAtU(u) = the hero's clock at the
//     journey's second secondAtU(u). surgeOff makes the surge front reach the camera at SURGE_U. Only that one ring ever
//     exists (the wall's strength is zero before its clock time S0 and after it has died).
//   THE SURGE, in update(): front = the radius the surge's front has reached round the vent, gap = how far it is behind the camera (m,
//     negative = still coming; the front runs on at the ring's speed after the wall has died). THE MIST IS A BODY IN THE WORLD: the
//     cylinder round the vent that the front has reached, under MIST_TOP. NO MIST LEADS THE WALL: the air before the front is clear to
//     the last metre, and until the front is at the eye the frame holds the wall itself over the sea. Behind the front the mist stays
//     with us for the brief's 4.5 s and thins with the distance the front has run on (190 to 330 m) and with the eye's height. AT THE
//     SURGE'S BIRTH NOTHING POPS IN: the body's haze and the cloud's strength thicken as the surge grows (grown: nothing where its
//     front is born, all of it when the front has run 180 m from there, which is 6 s on and 2 s before it reaches the eye).
//     ONE FOG LAW ON A SIGHT LINE through that body (the part's ibFogV: the stretch of the line inside the cylinder and under the
//     layer's two tops, one density, 1 - exp(-L*L), one flat tone, the body's side soft seen from outside): the hero's own bodies take
//     it from the hero (hero.setMist(density, MIST_TOP, colour, front)); THE SKY BEHIND THEM AND THE SEA UNDER THEM TAKE THE SAME LAW
//     from this file's copy of it (MIST_LAW, mistShare: the part's lines letter for letter with the part's own uniforms): the sky veil
//     (buildVeil, cover 0) for a point 3,000 m off, the sea for the water's own point (the one statement of the kit ocean's fragment
//     text that lays the kit's fog on the water is replaced in this world's own copy of that text; the kit is not touched). So the sky
//     behind a body far off, and the water at a body's foot, carry the mist that body carries. WHAT LIES ON THE SEA OR STANDS IN IT
//     TAKES THE SEA'S FOG: this world's own eight materials (the stones, their foam and their wisps, the far raft's sheet, the ochre
//     streamers, the ship, the splash, the sky bombs) lay the look's haze and then the mist by the same mistShare for their own
//     point, each in its own text (LAW_FOG, at MIST_LAW): a streamer and the sea under it take one share of mist, before the front,
//     inside and after. WHAT THE LAW DOES NOT LEVEL: where a body
//     stands in the mist with more mist behind it, the sky over its outline carries that mist too. That is so along the cone's rim,
//     which stands before the crater's own mist. By a count on the cone's skyline (the rim's own share against the sky's just over
//     it, four seeds): in the last seconds of the approach 0.39 to 0.54 at the worst point, over three tenths on 7 to 15 of some 600
//     points a seed, 0.02 to 0.03 on the mean; in the stay 0.34 to 0.51 at the worst, over three tenths on 1 to 8 of some 1,500,
//     0.01 to 0.02 on the mean; AND MOST IN THE LEAVING, when the eye has climbed over the layer and looks across the rim onto the
//     mist beyond: 0.59 to 0.68 at the worst point, over three tenths on 29 to 61 of 1,400 to 2,200 points, 0.01 to 0.03 on the
//     mean. (The live version: all against nothing at the worst in the approach and 0.3 to 0.4 on the mean; 0.36 to 0.53 in the
//     stay; 0.60 to 0.76 in the leaving, 0.05 to 0.12 on the mean.) LEFT ON THE SCENE'S FOG, which carries the surge's mist by the
//     cloud at the eye's place (q; nothing before the front) and not by the thing's own place, are the kit's own things, whose
//     materials are the kit's. By a count of what each takes against what the law gives at its place, every quarter second the
//     mist is out: the ash flakes and the flecks (round the eye, within 26 m) never differ by more than 0.09; the lens terns, the
//     shearwaters and the escort frigatebirds are never there while the mist is out. FOUR STAND IN OR BEHIND THE MIST AND DIFFER BY
//     MORE: the far line of gulls (280 to 370 m off: fogged out for the first second and a half inside where the law would leave
//     them part seen, and clear for a second and a half of the leaving while the sea at their place is misted through); the six
//     frigatebirds high in the slot (fogged out all through the stay, where the law gives 0.02 to 0.23); the ship's two lamps (as
//     the gulls: clear for a second and a half of the leaving over a ship misted through); and the rare waterspout, which takes
//     none while it stands in the crater's mist over the last three and a half seconds before the front (it fades from the
//     crossing on). The kit hides a flock that lies beyond its own fog's reach, so its birds go by that fog. The kit's rainbow
//     takes no fog at all, here as in the live version.
//     THE MIST'S ONE TONE IS OF THE LOOK'S OWN LIGHT (no table of looks): the surge's own colour with the design's warm lean under the
//     look's sun and sky (see build). The sea's own body colours ease to ash grey (sg) while the front covers the last 110 to 30 m to
//     the eye. ORDER 4, THE WHITENED SEA UNDER THE LENS: where the cloud stands at the eye, the face of the water under the mist is
//     whitened with its own light and shade kept (build, SEA_ASH: hue toward the mist's, lifted by a quarter, spread about a middle
//     tone, a little ash laid on; the mist is not thinned for it). By count on patches 5, 10, 20 and 40 m from the eye (the engine's
//     grade; lightest against darkest twentieth, a morning seed): 0.29, 0.30, 0.34 and 0.34 of display value (eval9g 0.27, 0.28, 0.32
//     and 0.31), the middle tone 0.39 to 0.57 (eval9g 0.30 to 0.45); no lookup more.
//     THE CLOUD ITSELF is the cover veil (buildVeil, cover 1; MU uniforms: uCloud layer top / time / strength of the cloud by the
//     surge's life and growth and the eye's height under the cloud's own top, uGlowA the lightning's soft glow, uGlowB the one dull
//     bomb overhead, uLightV the light's side; order 4: uIn the cloud at the eye's place, uGlowP and uGlowQ the two glows inside): three slabs of billows in world space, standing 13, 32 and 78 m along the sight line
//     from where it enters the body, only inside the cylinder and only where the surge is in plan (the crater and the tongue through
//     the breach). Seen from outside they are the wall where it is near (they come in within 125 to 85 m, where the part's own lobes
//     begin to melt away from the lens), lit as the wall is, their gaps half filled over the body's first 46 m of depth so that the
//     face is a wall (a face only for an eye that stands outside the body: all of it from 40 m outside, less as the eye comes up to
//     the front, none inside; by where the eye stands, one number for the frame); as the front crosses the eye the same slabs become the cloud round us (a sight line turned away takes it as the
//     front runs on over its slabs' places, not at once); inside, the cloud hangs over the water and under the ragged top: heaps with
//     a lit side and a shaded side (form from the light's side), in tones taken from the look's own light (the shaded side lifted to
//     about half the mist's own tone, the lit side some three and a half times the shaded: ash in its own haze, no dark blot),
//     with gaps through which the trunks show. THE CLOUD'S OWN TOP LIES LOWER THAN THE HAZE'S: its strength runs out while the eye climbs from 5 to 29 m (the
//     live version's from 16 to 41 m), so that at the surge's far end the trunks stand clear no later than live's.
//     ORDER 4, THE INSIDE HAS A BODY (the design's 32.5 to 37 s). WHY THE INSIDE READ FLAT, by count (eval9g, a morning, a noon, an evening
//     and a night seed, eye places every 2.5 m of route, the engine's own grade): not for want of tone (the lightest twentieth of a
//     frame against the darkest 0.15 to 0.18 of display value at the least by day; the cloud's own lit against shaded 2.2 to 2.6
//     to 1 on the mean) but because the tone lay in ramps tens of degrees wide: the steepest tenth of a frame's runs of tone began at
//     0.010 to 0.014 of display value a degree at the least and 0.012 to 0.018 on the middle frame. THE MEND IS IN THE TONE ALONE:
//     where the cloud stands at the eye (uIn, update's inS) the light on a billow is taken from the light's side across ROLLS as
//     well: each slab's two smaller sizes of noise are read with their slopes (vnS: the same lookups, the slope from the same eight
//     corners), each folded softly into lobes (crest and hollow both bulge) and lit along the light's side across the sight line.
//     So rolls 4 to 13 m and 2 to 3 m across ride on the great billows (10 to 31 m), each with a lit and a shaded side, some 5 to
//     17 degrees wide to the eye, and pass the lens with the slabs' own drift on the world's clock (11 m/s away from the vent,
//     1.3 m/s upward). THE DENSITY IS eval9g's TO THE LETTER (no alpha line is touched: the share of mist on sight lines to the
//     trunks' upper lobes and at the far end is equal to the last digit); the tones' two ends are order 3's (lit to shaded at most
//     three and a half to one by day; in a frame the cloud's very lightest against its very darkest 3.1 to 3.6 to 1). THE BOUND
//     BELOW: in the middle of the stay the steepest tenth of a frame's runs of tone begins at 0.014 of display value a degree or
//     more (eval9g's began at 0.010 to 0.014; counted on fine scan lines of script frames, glows off); the range across a frame is eval9g's or a little more (0.16
//     to 0.21 at the least by day). NOTHING NEW READS THE LENS: the new terms read where the eye stands (the cloud at the eye's
//     place), the direction from a thing to the eye (the glows' and the pool's lobes about the sight line; the light's side across
//     the sight line, as eval9g's great billows had it) and the air between (the one fog law, untouched); none fades, hides or
//     thins a thing by its distance from the lens. EVERYTHING NEW IS EXACTLY NOTHING WHERE THE MIST AT THE EYE'S PLACE IS NOTHING,
//     by one line of update: inS = min(1, 2 q) x lay (q the cloud at the eye, nothing before the front; lay nothing from 41 m up,
//     where the haze at the eye ends, the design's 37.78 s: nothing differs from eval9g before 32.5 s or after 37.8 s): uIn, uSeaIn, the inside glows and the bomb's pool are multiples of
//     it (the glows never over it times the cloud's own strength by the eye's height), and the approach's glow and the mist tone's lift go
//     by 1 - inS, so before the front and above the layer all is eval9g's.
//     ASH BLOWN PAST (kit particles, drawn after the cloud): soft strokes of the cloud's own tones (0.13 to 0.3 m wide, about
//     1.5 m long, drawn out along their flight, from deep shade to lit), of the cloud at the eye: none before the front, none where
//     the eye's sky is opening, never more than 0.6 opaque, a medium: no part of one within 2.0 m of the lens.
//     THE GLOW AND THE BOMB RUN ON THE WORLD'S CLOCK, as the flecks do. The lightning's glow in the cloud: one possible glow in every
//     0.75 s of that clock (its slots hashed with a number of its own, their start on the clock its own too), starting up to 0.3 s
//     into its slot, so two starts lie 0.45 to 1.05 s apart and no second holds more than two: AT the design's two a second, never
//     over it (1.15 a second on the mean). BEFORE THE FRONT, ON THE WALL'S FACE (eval9g's law, kept): 0.3 s up and then to 1/e in
//     every 0.3 s more; it multiplies the tone it falls on by at most 1.26 in red, 1.15 in green and 1.24 in blue, on lit and
//     shaded billows alike (and the mist's one tone by 1.05). INSIDE (order 4; that law goes out by 1 - inS and this one comes in
//     by inS) each glow is a soft lit region of the cloud at a place of its own (hashes of its slot: a box 300 m square between
//     the two vents, 10 to 100 m up), a lobe about its direction from the eye that draws the billows' tone toward a lightning
//     white of the look's own light and keeps their forms in it. THE GLOWS' FIGURES (orders 5 and 6; all in the visitor's real seconds,
//     for the glows run on the world's clock): RISE 0.6 s, FALL 0.6 s, a ramp with eased ends (GLOW_UP, GLOW_LIFE, glowIn); the
//     strength changes by 0.036 of the whole in a sixtieth of a second at the most (0.06 where a hurry begins or the Pace is moved). THE LIGHT AS SEEN (the lift in display value,
//     which saturates) takes 0.34 s and more from a tenth to nine tenths of its most, and as long back, by day and evening and
//     on all but the faintest lines by night; the floor is 0.28 s, on a night's faint line 12 degrees off a glow's middle
//     (counted on every line a full glow lifts by over 0.02, 8 seeds). AT MOST TWO BEGIN IN ANY ONE SECOND (two starts never under 0.45 s apart). A GLOW IS SEEN BY ITS OWN
//     RISE AND FALL AT EVERY PACE: its strength is its own shape times ONE number that stands for its whole life, the lesser
//     of the cloud at the eye's place where the flight stood when the glow began and where it will stand when the glow ends,
//     at the flight's present speed along the route (update reads the design's seconds the route covers in a real second; the
//     cloud along the route from a table of build, cloudAtSecond). So a glow that the eye would leave behind in the cloud's
//     going, or that was alight before the front crossed the eye, does not begin: at a great pace few begin, hurrying at four
//     times the usual and more none in the counts. COUNTED on the strength handed to the shader, sixtieths of a real second, 8 seeds, 8 clock starts, glows
//     that reach a tenth of full strength: at pace 0.4, 1, 1.5, 2 and 2.5 every rise 0.60 s and every fall 0.60 s, at most two
//     begin in a second, at 2.5 too (two can there; my own 64 runs show one); none was cut in these counts. Hurrying at Pace 0.8 and more (4 times the usual
//     and more) none begins in the counts; hurrying at Pace 0.4 to 0.7 (2 to 3.5 times) glows do begin, each by its own 0.6 s
//     rise and fall (the strongest 0.90 of full at 0.4, 0.26 at 0.7). ORDER 6, THE CONTROLS MOVED WHILE A GLOW IS ALIGHT (a
//     hurry begun or let go, the Pace moved, both close together): the glow's number eases down over 0.6 s or more for the
//     whole of it; and a glow the flight will no longer carry (the cloud at the eye's place, or for three frames running the
//     cloud foreseen at its end, falls under what the glow holds) is LET GO ONCE FOR ALL BY ITS OWN TIME: straight down to
//     nothing in 0.36 s, or by 0.72 s after its own start if that is later, and the cloud at the eye's place bounds it no
//     more. SO ON THAT RARE PATH A VISITOR CAN SEE A GLOW FADING AFTER THE EYE HAS LEFT THE CLOUD, on the white trunk's side
//     too: for 0.40 s at the most as counted, at 0.16 of full strength at the most then, also past the design's 37.8 s. At a
//     steady pace no glow is let go so: the strengths equal order 5's bit for bit (counted: pace 1 on 8 seeds, five more paces on 4).
//     COUNTED (Pace 0.4 to 2.5, 1 to 2.5, 0.7 to 1.5; a hurry begun, let go, or of 0.4 s; in the same frame and 0.3 and 0.6 s
//     before and after; 25 moments inside; 8 seeds; the engine's own easing of the speed): at 60 frames a second rise 0.38 s
//     or more and fall 0.33 s or more (peak to nothing; nine tenths to a tenth of the peak in 0.20 s at the least), at 20
//     frames a second 0.35 and 0.30 s; at most two begin in a second. THE GREATEST SHARE OF THE PICTURE one glow lights (lifted by
//     more than 0.02 of display value; every dealt place forced to the most a glow can be there): 21 in 100 at 16 to 9, 21 at
//     21 to 9, 22 at 9 to 16, 23 at 9 to 20 (the night's; by day 21 at the most; 13 in 100 by half its own lift and more). TWO
//     CAN BE ALIGHT TOGETHER (two starts 0.45 s apart: the lesser then up to two thirds of its strength): together up to 35 in
//     100 of the picture (every pair of dealt places, the night's), so some 40 at the most, while one alone stays under a
//     quarter. THE GREATEST STEP above the frame's own grey, at a glow's very middle stood anywhere in the picture: 0.33 of
//     display value by night (2.9 to 1 in light), 0.31 by evening, 0.30 by day (2.6 to 1); a finer count may read a hundredth
//     more. The glows go out with the cloud's own strength as the eye climbs through the cloud's top (5 to 29 m), so none lies
//     over the trunks in the leaving (after 37.05 s a lift of 0.012 at the most). Inside, the mist's one tone no longer lifts with a glow. The one
//     dull bomb overhead: one swing of 3 s in every 4.5 s, its start from a stream of its own; it is seen from deep inside the
//     cloud only (the eye below 8 to 18 m). ORDER 4, IT CARRIES ITS LIGHT: a warm pool on the billows round it (a lobe about the
//     bomb's direction, half its strength 9 degrees off it, a dull orange of the look's own light), by the cloud at the eye. THE
//     POOL'S OWN LIFT (this frame against the same without the pool, the bomb stood anywhere in the picture above the sea's line
//     at the most it can be at that eye place): at most 0.13 of display value by day and evening (1.55 to 1 in light) and 0.17
//     by night (1.7 to 1); bomb and pool together against no bomb, 8 degrees and more off the bomb, 0.13 and 0.20 (a finer count
//     reads 0.16 and 0.23); over 0.02 out to 15 to 21 degrees off the bomb, on at most 16 in 100 of a picture by day and 24 by
//     night. Its own point, place and swing are eval9g's.
//     WHAT CHANGES HANDS IN THE SURGE GOES BY THE CLOUD AT THE EYE'S PLACE (rho = mistAt(gap): nothing before the front, half its peak
//     14 m behind it, the peak 40 m behind it; from the front's real position) AND BY THE EYE'S HEIGHT IN THE LAYER, never by u:
//       the stones round the lens shrink away while the cloud over them thickens from 1/2 of its peak density to the peak, which is
//       while the eye goes from 14 to 40 m deep behind the front (uStoneK + instanceCount; their triangles pay for the fine lobes),
//       and are not drawn from 12 m above the layer (as the raft sheet is not);
//       the wall's own mesh, once its front has passed the eye, melts as the share of its light that still reaches the eye
//       through the cloud between them (exp(-(density x distance)^2), the mist's own law) falls from 1/4 to 1/50, which is while the
//       eye goes from 31 to 44 m deep behind the front, and is not drawn below that (hero.setSurgeShown). Before the front it is
//       hidden by nothing of the world's: the part melts each lobe within 82 to 42 m and 1.5 radii of the lens, so no lobe's face
//       is ever within 42 m of the lens and none is cut by it, and the cover veil's billows stand in the wall's place there;
//       at that moment (44 m behind the front) hero.setNear swaps the slot's lobes for their fine meshes (never both: the wall's
//       triangles pay for them), and their extra relief and climb-only turrets grow out (hero.setNearGrow) by the share of the
//       layer's depth that lies below the eye: none at the sea, all at MIST_TOP.
//     COST OF A PIXEL beside live's, by a count of scalar operations (the shader's own text worked in script; no veil here looks up
//     a texture): the cloud's dearest pixel 3,946 operations (3,971 for an eye inside the body) with 11 value-noise lookups (5 of
//     them now worked with their slope, from the same eight corners), 15 square roots (5 of them inverse), 6 exponentials and 53
//     divisions; eval9g's 3,424 (3,413), 11, 10, 3 and 47: a sixth more arithmetic and no lookup more (the version before eval9g:
//     3,806 with 15 lookups). None of it on a sight line that meets no body within 125 m. The sky veil 115 operations and no
//     lookup, as eval9g's. The sea's pixel works the fog law too while a surge is out (some 105 operations), and under the cloud
//     at the eye its whitening (some 65 more, one square root, one power, no lookup); and so does a pixel of each of this world's
//     own eight things on the sea work the fog law, in place of the scene's fog. No geometry and no draw more. (More at buildVeil.)
//   THE CLIMB: the route is the straight line up the slot with the ring on it. THE EYE IS THE OLD VERSION'S OWN LOOK (eval4), put back
//     letter for letter by the designers' ruling of 7 Oct 14:03 (the look down); live eval8 had none of these lines: the GAZE keys and gazeAt (one function poi,
//     u 0.615-0.95, weight 0.94, fade 0.1): up the slot -> down across the crater lake, the cone's wall and the sea beyond, panned from the
//     steam pit's side to the vent's -> up along the white wall with the portal to starboard -> the portal. Route, pace, duration and lens
//     are eval4's too, so lens place and gaze are eval4's bit for bit over the whole flight (replayed headless on seeds 7, 3, 11 with the
//     engine's frame, pose and turn rules, both cameras). eval8's two pulls (the ring from U_OUT, the lake's centre at GAZE_TIP)
//     are out; the lines that only they read (GAZE_TIP, rimH, uRim, lakeW) are left standing unread.
//     THE LOOK'S STRETCH, by place: FROM 686.7 m FLOWN TO THE END of the route's 1216.8 m. That is everywhere the eye is not eval8's:
//     686.7 to 748 m, where eval8's ring pull eased in and is gone; 748.4 to 1156.0 m, the look down itself (u 0.615 to 0.95, its own poi
//     line); and the last 61 m, where eval8's ring pull was fading out (weight 0.66 at 1156 m, nothing from 1196 m: from there the gaze is
//     eval8's again and only the camera, still easing out of the look, differs to the end). Before 686.7 m lens place, gaze and camera are
//     eval8's bit for bit. THE FASTER TURN IS INSIDE THE STRETCH AND IS eval4's OWN (the owner's ruling of 7 Oct 23:20): the fastest turn of
//     the camera inside it, degrees a second over 0.1 s, replayed on seeds 7, 3, 11: default camera 65.0 at 887 m flown (eval4) against
//     19.3 (eval8, near 930 m); steady camera 16.2 at 892 m (eval4) against 7.4 (eval8, at 722 m; 5.1 inside 748.4 to 1156 m).
//     Before 686.7 m the fastest turn is eval8's own: 16.6 default at 159 m, 11.3 steady at 540 m. THE LIGHT is the sky's key from start to
//     end (square behind the eye in the breach and on the climb); by moonlight the hero's fill rises once the eye is above
//     the mist.
//   The opening: level over the raft at the entry; a poi then lifts the gaze to the columns' whole height (u 0.045-0.14).
//   THE BRIEF'S THREE BEATS OF THE RUN-IN, each where its journey puts it: the trawler stands 35 m to starboard at z = -212
//     (passed at about 8 s); the jade line and the terns at 13 s; and THE BOMB TO PORT (buildSplash) strikes the sea at a
//     place: 45 m to port of the point the route reaches at the brief's 15 s. It falls for 3.4 s down a line from the vent's
//     side and lands as the eye comes abeam of it (its clock is secondAtU(u) - 15): a ragged 12 m crown of fine white fingers
//     on a mist foot, then steam leaning away downwind. The eye does not turn to it: the bomb is seen falling across the
//     upper port side of the view, and the strike itself is abeam; where the frame cuts it, it cuts it.
//   POIS: the opening, the jets' mid-height (u 0.17-0.56, weight 0.6), and the climb's one (the look down).
//   BOMBS ARCING ACROSS FAR OVERHEAD: every volley of the vent throws one bomb high over the back of the island (true
//     ballistics from K on the eruption clock): out of the black trunk's far flank, across the middle of the slot's far end
//     at the top of its arc (once to twice the ring-to-roof distance beyond the ring, at the ring's height or up to half the
//     roof's height above the ring under it), down behind the white trunk. A small orange clast and the steam of its last 3.2 s. They are in the sky all
//     the time, from the sea as from the climb; the trunks and the surge's mist are all that hides them.
//   Through the previous portal: camera.nearThrough draws the sea and raft in front of the entry; the entry axis
//     (hero flyThrough) passes between the trunks, so jets, bombs and both columns stand in the opening.
//   terns at the lens u 0.14-0.43 (kit flock, along the path, 6 m ahead to port), a second six closer in to starboard (7 m
//   ahead, u 0.19-0.42); three black frigatebirds (long narrow gliding wings, lit by the scene like every bird) escort the
//   climb 24 m ahead, below the line, until their station comes to the brief's last 120 m before the ring; six more wheel at
//   290 m; lightning is switched off after u 0.9 (hero.setLightningGain).
//   rare (ctx.vary.rare): a waterspout uncoils from the steam pit while the 22 s volley collapses, stands and walks the lagoon
//     through the held breath (the brief's 25 s to 32.5 s) and goes in the first third of our stay inside the surge.
// RANDOM STREAMS: the world's forks, in order: sea, stones, ochre, lamps, terns, shear, line, frig, frig2, ash, spout, streaks,
//   terns2, skybombs (one draw: the seed the volleys' sky bombs are hashed with). And one stream of its own, made from the seed and a name and
//   drawing from no other: 'ember:' + seed (three draws: when on the world's clock the one dull bomb over the surge starts its swing; the
//   number the cloud's glows are hashed with; where on the clock their slots start).
// Variations: mood (ctx.vary.hour or seed), wind (column lean 12 / 25 / 40, rainbow), age of the cone,
//   cast (terns and shearwaters or boobies and tropicbirds; trawler, research vessel or none + thick raft).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/island-being-born.js';

const CX = 120, CZ = -800;                       // the island's centre C (hero origin)
const SUN_AZ = -132.2 * Math.PI / 180;           // behind the left shoulder at entry, square behind in the breach
const T_SURGE_IN = 32.5, T_SURGE_OUT = 37;      // the brief's journey: inside the surge from 32.5 s to 37 s of the 50 (taken by u: see uAtSecond in build)
const MIST_TOP = 38;                             // top of the surge's mist layer (m)
// the cloud's density at the eye against the gap to the front (m, negative = still coming; positive = how deep the eye stands inside the
// surge's body): NO MIST LEADS THE WALL. There is none before the front; behind it the cloud thickens to half its peak 14 m in and to
// the peak 40 m in
const MIST = [0, 0, 14, 0.0225, 40, 0.045];
function mistAt(g) {
  if (g <= MIST[0]) return MIST[1];
  for (let i = 2; i < MIST.length; i += 2) if (g <= MIST[i]) return lerp(MIST[i - 1], MIST[i + 1], (g - MIST[i - 2]) / (MIST[i] - MIST[i - 2]));
  return 0.045;
}
const RHO_PEAK = MIST[MIST.length - 1];           // the mist's peak density: what is said below in shares of the mist is a share of this
const RHO_BODY = 0.26 * RHO_PEAK;                // the density of the haze that fills the surge's whole body, from its front inward: what the one fog law fogs bodies, sky and sea with (the cloud itself is the cover veil's billows)
const EMBER_EVERY = 4.5, EMBER_SWING = 3;        // the one dull bomb overhead, on the world's clock: one crosses every 4.5 s (the design's stay in the surge has one) and takes 3 s over it
const GLOW_UP = 0.6, GLOW_LIFE = 1.2;            // an inside glow's rise and its whole life (s of the world's clock): see glowIn in build and the head
const T_SPLASH = 15, SPLASH_PORT = 45;           // the brief's journey: the bomb to port comes down 15 s into the 50, 45 m to port
const T_VOLLEY = 22, T_HELD = 25;                // the brief's journey: the full volley whose collapse starts the surge; the held breath begins
const T_APPROACH = 46, APPROACH_M = 120;         // the brief's journey: from 46 s the last straight to the ring, the last 120 m
const GAZE_TIP = 0.28;                           // weight of the climb's one pull toward the crater lake (see GAZE in build)
const DURATION = 50, FOV = 62;
const BOX = 46;                                  // side of the box of real stones round the camera

const MOODS = {
  morning: { el: 28, preset: 'day', sun: '#FFF4E0', sunI: 1.0, amb: '#B9C0C8', ambI: 1.0, zenith: '#1E57B8', horizon: '#BFD6EC', haze: 0.00012, exposure: 1.0, tint: '#ffffff', shadow: '#080c18', deep: '#193D78', shallow: '#3FA98C', night: false, surge: 0.8 },
  noon: { el: 54, preset: 'day', sun: '#FFFBF0', sunI: 1.08, amb: '#BEC6D0', ambI: 1.05, zenith: '#1A52B8', horizon: '#C4DAEE', haze: 0.0001, exposure: 0.96, tint: '#ffffff', shadow: '#070b16', deep: '#1A417E', shallow: '#3EB282', night: false, surge: 0.85 },
  afternoon: { el: 16, preset: 'day', heroSun: '#FFE2C2', sun: '#FFE2C2', sunI: 1.06, amb: '#A9A6D8', ambI: 0.98, zenith: '#2052AC', horizon: '#D6D2DC', haze: 0.00013, exposure: 1.0, tint: '#fff8f0', shadow: '#120c2a', deep: '#1A3B74', shallow: '#3AA27A', night: false, surge: 0.78 },
  night: { el: 36, preset: 'night', sun: '#B4C6F0', sunI: 0.7, amb: '#8090B8', ambI: 0.3, zenith: null, horizon: null, haze: 0.00012, exposure: 1.5, tint: '#e6eeff', shadow: '#04081a', deep: '#123676', shallow: '#3FA98C', night: true, surge: 0.22 },
};

// ---------------------------------------------------------------- GLSL
const WS_NOISE = /* glsl */`
float wsH12(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
vec2 wsH22(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
float wsVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(wsH12(i), wsH12(i + vec2(1.0, 0.0)), f.x), mix(wsH12(i + vec2(0.0, 1.0)), wsH12(i + vec2(1.0, 1.0)), f.x), f.y); }
float wsH13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float wsVN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(wsH13(i), wsH13(i + vec3(1,0,0)), f.x), mix(wsH13(i + vec3(0,1,0)), wsH13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wsH13(i + vec3(0,0,1)), wsH13(i + vec3(1,0,1)), f.x), mix(wsH13(i + vec3(0,1,1)), wsH13(i + vec3(1,1,1)), f.x), f.y), f.z); }
`;
// the kit ocean's vertex displacement, copied (8 Gerstner waves, grid level of detail, far flattening, shoal damping)
const SEA_GLSL = /* glsl */`
uniform vec4 uWA[18]; uniform vec4 uWB[18];
uniform float uSeaT, uSpacing, uR0, uRadius, uShoreDamp; uniform vec2 uSeaCam;
uniform sampler2D uDepthTex; uniform vec4 uDepthRect; uniform vec2 uShoal;
vec3 seaDisp(vec2 xz, out vec3 nrm){
  float r = length(xz - uSeaCam), sp = (r + uR0)*uSpacing;
  vec3 d = vec3(0.0); vec2 sl = vec2(0.0); float q = 0.0;
  for (int i = 0; i < 8; i++) { vec4 a = uWA[i], b = uWB[i];
    float f = smoothstep(2.0, 4.5, b.w/sp);
    float th = a.z*dot(a.xy, xz) - a.w*uSeaT + b.z; float c = cos(th), s = sin(th);
    d.xz += a.xy*(b.y*b.x*c*f); d.y += b.x*s*f; sl += a.xy*(a.z*b.x*c*f); q += b.y*a.z*b.x*s*f; }
  float k = 1.0 - smoothstep(0.3*uRadius, 0.8*uRadius, r);
  vec2 uv = (xz - uDepthRect.xy)*uDepthRect.zw; vec2 e = min(uv, 1.0 - uv); float sd = 1000.0;
  if (min(e.x, e.y) > 0.0) sd = mix(1000.0, texture2D(uDepthTex, uv).r/uShoal.x, smoothstep(0.0, 0.05, min(e.x, e.y)));
  k *= mix(uShoreDamp, 1.0, smoothstep(0.0, 1.0, sd));
  d *= k; nrm = normalize(vec3(-sl.x*k, 1.0 - q*k, -sl.y*k));
  return d;
}
`;
// where the pumice lies: a band along the run-in, broken into wind rows with leads of open water
const RAFT_GLSL = /* glsl */`
uniform float uRaftT, uStoneK;
float raftPathX(float z){ return 11.0*clamp(-z/80.0, 0.0, 1.0) - 26.0*clamp((-80.0 - z)/170.0, 0.0, 1.0) - 45.0*clamp((-250.0 - z)/150.0, 0.0, 1.0) - 50.0*clamp((-400.0 - z)/100.0, 0.0, 1.0) - 16.0*clamp((-500.0 - z)/77.0, 0.0, 1.0); }
float raftMask(vec2 xz){
  float ax = xz.x - raftPathX(xz.y) + 7.0*sin(xz.y*0.013);
  float band = (1.0 - smoothstep(20.0, 35.0, abs(ax)))*smoothstep(-650.0, -570.0, xz.y)*(1.0 - smoothstep(25.0, 60.0, xz.y));
  float rows = wsVN(vec2(ax*0.055 + 3.7, xz.y*0.007))*0.62 + wsVN(vec2(ax*0.17, xz.y*0.023 + 9.0))*0.38;
  return band*smoothstep(uRaftT, uRaftT + 0.1, rows);
}
`;
const LIGHT_GLSL = /* glsl */`uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uSkyCol;
`;
function seaUniforms(ocean, seaCam) {
  const o = ocean.uniforms;
  return { uWA: o.uWA, uWB: o.uWB, uSeaT: o.uTime, uSpacing: o.uSpacing, uR0: o.uR0, uRadius: o.uRadius, uShoreDamp: o.uShoreDamp, uSeaCam: { value: seaCam }, uDepthTex: o.uDepthTex, uDepthRect: o.uDepthRect, uShoal: o.uShoal,
    uStoneK: { value: 1.04 } };      // stones whose random number is above uStoneK are gone: the world eases it down as the surge closes over the lens
}
const raftPathX = (z) => 11 * clamp(-z / 80, 0, 1) - 26 * clamp((-80 - z) / 170, 0, 1) - 45 * clamp((-250 - z) / 150, 0, 1) - 50 * clamp((-400 - z) / 100, 0, 1) - 16 * clamp((-500 - z) / 77, 0, 1);

// ---------------------------------------------------------------- real stones (smooth pitted lumps, instanced, floated on the GPU)
// where instance aP (x, z in the box, size, random) floats: its sea point c, the sea's displacement d and normal there; returns its scale
// (dealWisps copies this law in script to know where a stone stands and when the surge takes it: the mask's step, the box's edge and the 0.04 of uStoneK.
// Whoever retunes one of them here retunes it there, in dealWisps and in its stays table)
// (buildRaft's sheet copies this law too, in its fragment text: the standing rule's 0.12 and 0.75 (in rfKind and in main) and the ring's two numbers, 0.38
// and 0.49 of BOX (in rfKind and in main), with the stones' bob and rock (in rfKind). Whoever retunes one of them here retunes it there as well)
const STONE_GLSL = /* glsl */`
float stoneAt(vec4 aP, out vec2 c, out vec3 d, out vec3 nrm){
  c = mod(aP.xy - uSeaCam + ${(BOX / 2).toFixed(1)}, ${BOX.toFixed(1)}) - ${(BOX / 2).toFixed(1)} + uSeaCam;
  d = seaDisp(c, nrm);
  return aP.z*step(aP.w*0.75 + 0.12, raftMask(c))*(1.0 - smoothstep(uStoneK, uStoneK + 0.04, aP.w))*(1.0 - smoothstep(${(BOX * 0.38).toFixed(1)}, ${(BOX * 0.49).toFixed(1)}, length(c - uSeaCam)));
}
`;
async function buildStones(ctx, rng, count, SU, LU, raftT, path) {
  const group = new THREE.Group(); group.name = 'pumice';
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: { ...SU, ...LU, uRaftT: raftT },
    vertexShader: /* glsl */`
      attribute vec4 aP; attribute float aPit;
      varying vec3 vN; varying vec4 vC; varying vec3 vL;
      ${LAW_FOG_PARS_V}
      ${WS_NOISE}
      ${SEA_GLSL}
      ${RAFT_GLSL}
      ${STONE_GLSL}
      void main(){
        vec2 c; vec3 d, nrm; float sc = stoneAt(aP, c, d, nrm);
        float ph = aP.w*61.0;
        // each stone rocks and bobs on its own as well as riding the swell
        vec3 up = normalize(nrm + vec3(sin(uSeaT*1.7 + ph), 0.0, cos(uSeaT*1.3 + ph*1.7))*0.16);
        vec3 fw = normalize(cross(vec3(cos(ph), 0.0, sin(ph)), up)); vec3 rt = cross(up, fw);
        vec3 q = position*sc;
        vec3 w = vec3(c.x + d.x, d.y + sc*(0.16 + 0.07*sin(uSeaT*2.3 + ph*3.0)), c.y + d.z) + rt*q.x + up*q.y + fw*q.z;
        vN = normalize(rt*normal.x + up*normal.y + fw*normal.z);
        vL = position*(1.0 + 2.0*aP.z) + ph;                       // bigger stones show more, finer pits
        vC = vec4(vec3(0.335, 0.34, 0.345)*(0.72 + 0.36*aPit)*(0.8 + 0.4*fract(aP.w*7.3)), position.y);
        vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec3 vN; varying vec4 vC; varying vec3 vL;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        float fwL = fwidth(vL.x) + fwidth(vL.y) + fwidth(vL.z);
        float k1 = 1.0 - smoothstep(0.08, 0.3, fwL), k2 = 1.0 - smoothstep(0.03, 0.12, fwL);
        float p1 = wsVN3(vL*5.5), p2 = wsVN3(vL*13.0 + 7.0);
        // vesicles: dark pits, coarse and fine, melting into an average tone with distance
        float pit = 1.0 - k1*0.5*smoothstep(0.52, 0.74, p1) - k2*0.3*smoothstep(0.5, 0.72, p2);
        vec3 N = normalize(vN + (vec3(p1, p2, wsVN3(vL*5.5 + 31.0)) - 0.5)*(0.5*k1));
        float ndl = dot(N, uSun);
        // the wet waterline: dark below, a thin bright lick of water right at it
        float wl = vC.w + (p1 - 0.5)*0.14;
        float wet = 1.0 - smoothstep(-0.2, -0.02, wl);
        vec3 alb = vC.rgb*pit*mix(1.0, 0.34, wet);
        vec3 col = alb*(uSunCol*smoothstep(-0.1, 0.55, ndl)*0.98 + uSkyCol*(0.34 + 0.24*N.y));
        col += uSkyCol*0.1*wet*pow(max(1.0 - abs(N.y), 0.0), 2.0);
        gl_FragColor = vec4(col, 1.0);
        ${LAW_FOG_F}
      }`,
  });
  const all = [];
  // two small shapes (80 triangles), a pebble (20: six stones in ten, 7 to 17 cm) and two big ones (180), all with smooth normals
  for (let s = 0; s < 5; s++) {
    const bigS = s >= 3, peb = s === 2;
    let g0 = new THREE.IcosahedronGeometry(1, bigS ? 2 : peb ? 0 : 1); g0.deleteAttribute('uv'); g0.deleteAttribute('normal'); g0 = mergeVertices(g0, 1e-4);
    const p = g0.attributes.position, n = p.count;
    const sx = rng.range(0.8, 1.25), sy = rng.range(0.5, 0.75), sz = rng.range(0.8, 1.2), o = rng.range(0, 50), pit = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const h = Math.sin(x * 3.1 + o) * Math.sin(y * 2.7 + o * 1.3) * Math.sin(z * 3.4 - o), h2 = Math.sin(x * 7.3 - o) * Math.sin(z * 6.1 + y * 5.0 + o);
      const k = 0.78 + 0.2 * h + (bigS ? 0.09 : 0.06) * h2;
      p.setXYZ(i, x * k * sx, y * k * sy, z * k * sz); pit[i] = 0.5 + 0.5 * h2 + 0.3 * h;
    }
    g0.computeVertexNormals();
    const m = Math.floor(bigS ? count * 0.05 : peb ? count * 0.6 : count * 0.15), a = new Float32Array(m * 4);
    for (let i = 0; i < m; i++) {
      a[i * 4] = rng.range(0, BOX); a[i * 4 + 1] = rng.range(0, BOX); a[i * 4 + 2] = bigS ? rng.range(0.45, 0.8) : peb ? rng.range(0.07, 0.17) : rng.range(0.14, 0.36); a[i * 4 + 3] = rng();
    }
    // (kept in order of their random number, so that drawing the first share of each shape is drawing the stones below uStoneK)
    { const ord = Array.from({ length: m }, (_, i) => i).sort((p, q) => a[p * 4 + 3] - a[q * 4 + 3]), b = a.slice();
      for (let i = 0; i < m; i++) { const o = ord[i] * 4; a[i * 4] = b[o]; a[i * 4 + 1] = b[o + 1]; a[i * 4 + 2] = b[o + 2]; a[i * 4 + 3] = b[o + 3]; all.push(b[o], b[o + 1], b[o + 2], b[o + 3]); } }
    const g = new THREE.InstancedBufferGeometry(); g.index = g0.index; g.setAttribute('position', g0.attributes.position); g.setAttribute('normal', g0.attributes.normal);
    g.setAttribute('aPit', new THREE.BufferAttribute(pit, 1)); g.setAttribute('aP', new THREE.InstancedBufferAttribute(a, 4));
    g.instanceCount = m; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.userData.full = m; group.add(mesh);
    await ctx.yield();
  }
  // a ring of foam lace on the water round every stone (one draw)
  const quad = new THREE.PlaneGeometry(2, 2); quad.deleteAttribute('normal'); quad.deleteAttribute('uv');
  const fg = new THREE.InstancedBufferGeometry(); fg.index = quad.index; fg.setAttribute('position', quad.attributes.position);
  fg.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(all), 4)); fg.instanceCount = all.length / 4; fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const foam = new THREE.Mesh(fg, new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3,
    uniforms: { ...SU, ...LU, uRaftT: raftT },
    vertexShader: /* glsl */`
      attribute vec4 aP; varying vec3 vQ;
      ${LAW_FOG_PARS_V}
      ${WS_NOISE}
      ${SEA_GLSL}
      ${RAFT_GLSL}
      ${STONE_GLSL}
      void main(){
        vec2 c; vec3 d, nrm; float sc = stoneAt(aP, c, d, nrm);
        vec3 fw = normalize(cross(vec3(1.0, 0.0, 0.0), nrm)); vec3 rt = cross(nrm, fw);
        float R = sc*2.3;
        vec3 w = vec3(c.x + d.x, d.y + 0.045, c.y + d.z) + (rt*position.x + fw*position.y)*R;
        vQ = vec3(position.xy, aP.w*53.0);
        vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uSeaT;
      varying vec3 vQ;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        float r = length(vQ.xy);
        float n = wsVN(vQ.xy*4.2 + vQ.z + vec2(uSeaT*0.15, 0.0))*0.6 + wsVN(vQ.xy*10.0 - vQ.z)*0.4;
        float ring = smoothstep(0.26, 0.4, r)*(1.0 - smoothstep(0.42, 0.98, r + (n - 0.5)*0.5));
        float lace = smoothstep(0.3, 0.62, n + 0.5*(1.0 - smoothstep(0.38, 0.6, r)));
        float a = ring*lace*(0.8 + 0.2*sin(uSeaT*1.9 + vQ.z))*0.85;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.82, 0.86, 0.88)*(uSunCol*0.62 + uSkyCol*0.42), a);
        ${LAW_FOG_F}
      }`,
  }));
  foam.name = 'stoneFoam'; foam.frustumCulled = false; foam.renderOrder = 2; group.add(foam);
  // steam off the hottest stones: soft wisps leaning downwind (one draw)
  // EVERY WISP KEEPS 2.0 m OF CLEAR AIR FROM THE ROUTE'S LINE, BY PLACE (the owner's ruling of 8 Oct: "by place, not the near law", "stands further off,
  // nothing removed"; the designers: "the stone stays", "dealt to a stone already standing there"). THE LAW, worked once at build by dealWisps (below this
  // function, where its margin is told): at each repeat of the box, a wisp whose whole course there (its quad turned any way about the vertical, its lean,
  // its stone's greatest slide on the sea) comes within 2.05 m of the route's track in plan stands, for that repeat, on the nearest hot stone without a wisp
  // that stands there by the raft's mask, that the surge never takes out of the draw while it still shows, and from which its whole course clears the track
  // by as much; no stone holds two wisps. The stones are not touched.
  // The answer is a small table (uDeal: a column a wisp, a row a repeat of the box; each entry the second stone's offset from the wisp's own, its size and
  // its number, or nothing): the wisp's vertex reads it by the repeat its own stone stands in (c, as live's wisp works it from uSeaCam) and reads nothing
  // else that live's wisp did not read (uSeaCam for the box, cameraPosition to turn its face). A wisp that is far enough is live's in every bit.
  await ctx.yield();
  const hot = []; for (let i = 0; i < all.length / 4 && hot.length < 52 * 4; i++) if (all[i * 4 + 2] > 0.24) hot.push(all[i * 4], all[i * 4 + 1], all[i * 4 + 2], all[i * 4 + 3]);
  const deal = await dealWisps(ctx, all, hot, path, SU, raftT, group.children.filter((c) => c.userData.full > 0).map((c) => c.userData.full));      // (the shapes' counts: all holds the stones shape after shape)
  const sg = new THREE.InstancedBufferGeometry(); sg.index = quad.index; sg.setAttribute('position', quad.attributes.position);
  sg.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(hot), 4)); sg.instanceCount = hot.length / 4; sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  sg.setAttribute('aW', new THREE.InstancedBufferAttribute(Float32Array.from({ length: hot.length / 4 }, (_, i) => i), 1));      // the wisp's own number: its column in the table
  const steam = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false,
    uniforms: { ...SU, ...LU, uRaftT: raftT, uDeal: { value: deal.table }, uDealK: { value: deal.cells } },
    vertexShader: /* glsl */`
      attribute vec4 aP; attribute float aW; varying vec3 vQ;
      uniform highp sampler2D uDeal; uniform vec4 uDealK;      // the wisps' deal; uDealK: the table's first repeat of the box (x, z) and how many it holds each way
      ${LAW_FOG_PARS_V}
      ${WS_NOISE}
      ${SEA_GLSL}
      ${RAFT_GLSL}
      ${STONE_GLSL}
      void main(){
        vec2 c; vec3 d, nrm; float sc = stoneAt(aP, c, d, nrm);
        // THE DEAL, read by place. k0: which repeat of the box the wisp's own stone stands in at c. A wisp dealt to a second stone can stand up to half a box
        // from its own, so the eight repeats round that one are read too: of the wisps of this number that are dealt (and whose own stone stands in its
        // repeat by the raft's mask, as live asks), the one whose second stone is nearest the box's middle is drawn, there, by that stone's own scale (the
        // stones' law of STONE_GLSL at that place: the raft's mask, the surge's hiding, the box's edge), so it comes and goes with its stone as live's do.
        // A wisp that is not dealt and is drawn by live (sc at least 1e-4) is left as the line above made it: nothing below touches it.
        vec2 k0 = floor((c - aP.xy)/${BOX.toFixed(1)} + 0.5) - uDealK.xy, cb = c; vec4 t0 = vec4(0.0), tb = vec4(0.0); float rb = 1e9;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j)), kk = k0 + g, p = c + g*${BOX.toFixed(1)};
          if (kk.x < 0.0 || kk.y < 0.0 || kk.x >= uDealK.z || kk.y >= uDealK.w) continue;
          vec4 t = texelFetch(uDeal, ivec2(int(aW + 0.5), int(kk.y*uDealK.z + kk.x + 0.5)), 0);
          if (t.z == 0.0 || raftMask(p) < aP.w*0.75 + 0.12) continue;      // not dealt there, or its own stone does not stand there: no wisp of that repeat is moved
          if (i == 0 && j == 0) t0 = t;
          if (t.z < 0.0) continue;                                          // (dealt to no stone: see dealWisps)
          float r = length(p + t.xy - uSeaCam);
          if (r < rb) { rb = r; tb = t; cb = p + t.xy; }
        }
        if (tb.z > 0.0 && (t0.z != 0.0 || sc < 1e-4)) {
          c = cb; d = seaDisp(c, nrm);
          sc = tb.z*step(tb.w*0.75 + 0.12, raftMask(c))*(1.0 - smoothstep(uStoneK, uStoneK + 0.04, tb.w))*(1.0 - smoothstep(${(BOX * 0.38).toFixed(1)}, ${(BOX * 0.49).toFixed(1)}, rb));
        } else if (t0.z != 0.0) sc = 0.0;
        float on = step(1e-4, sc), h = 0.8 + 1.4*fract(aP.w*13.7);
        vec3 base = vec3(c.x + d.x, d.y + sc*0.5, c.y + d.z);
        vec3 toCam = cameraPosition - base; vec3 right = cross(vec3(0.0, 1.0, 0.0), toCam); right = right/max(length(right), 1e-3);
        float yy = position.y*0.5 + 0.5;
        vec3 w = base + right*(position.x*h*0.6*on) + vec3(0.8, 0.0, -0.6)*(yy*yy*h*0.7) + vec3(0.0, yy*h*on, 0.0);
        vQ = vec3(position.xy, aP.w*91.0);
        vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uSeaT;
      varying vec3 vQ;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        float yy = vQ.y*0.5 + 0.5, sd = vQ.z;
        float sway = (wsVN(vec2(yy*2.6 - uSeaT*0.7 + sd, sd)) - 0.5)*1.5*yy;
        float wd = mix(0.24, 0.92, yy);
        float body = 1.0 - smoothstep(wd*0.12, wd, abs(vQ.x - sway));
        float tex = wsVN(vec2((vQ.x - sway)*3.0 + sd, yy*4.0 - uSeaT*1.3 + sd));
        float a = body*smoothstep(0.3, 0.8, tex + 0.3*(1.0 - yy))*smoothstep(0.0, 0.15, yy)*(1.0 - smoothstep(0.3, 1.0, yy))*0.5;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.84, 0.85, 0.86)*(uSunCol*0.6 + uSkyCol*0.45), a);
        ${LAW_FOG_F}
      }`,
  }));
  steam.name = 'stoneSteam'; steam.frustumCulled = false; steam.renderOrder = 3; group.add(steam);
  return group;
}
// ---------------------------------------------------------------- the wisps' deal: every wisp kept off the route's line by place
// THE POINT (the owner's ruling of 8 Oct): every wisp, at every repeat of the box, keeps 2.0 m of clear air between its whole quad and the route's line.
// A WISP'S WHOLE COURSE at a stone's place, in plan: the stone slides on the sea (each of the sea's eight waves carries it to and fro along that wave's own
//   heading by its steepness times its height, uWB.y*uWB.x, less where the shoal damps the sea as SEA_GLSL has it: all eight at their furthest at once is
//   the furthest any clock can bring it), the quad leans downwind by 0.7 of its height h at its top, and its half width, 0.6 h, turns any way about the
//   vertical. Its clear air from the track is taken toward 64 headings (the least over the track of: the greatest, over the headings, of the track point's
//   distance along the heading less the slide's and the lean's reach along it), less the half width.
// THE TRACK is the route itself in plan (path.posAtDist every half metre), from 96 m behind the entry (the straight line the engine flies up to the entry
//   when the world is come into by a portal; the raft's mask stands no stone more than 60 m behind it) to the ring. It is the same line on every seed (the
//   hero's flyThrough is one fixed list). In plan, because the eye flies the raft at the wisps' own height (from under 2 m to some 4 m over the mean sea,
//   where a tall wisp lifted on a crest tops 4 m), so height gives no clear air to count on; the clear air in three dimensions is never less than in plan.
//   Only metres from this track are read: no eye, no clock, no place of the flight, no seed.
// THE MARGIN: the owner's 2.0 m and 0.05 m for this build's own arithmetic (the track every half metre, 64 headings, places in single precision).
// THE DEAL, at each repeat of the box (the wisp's own stone at its place + a whole number of boxes each way), wisps in the order of their numbers: a wisp
//   whose course keeps the margin stays (nothing is written: it is live's). One whose course does not is dealt, for that repeat, to THE NEAREST STONE TO ITS
//   OWN, among the hot stones that carry no wisp (size over 0.24: live's own rule of what steams) and that the surge never takes out of the draw while they
//   still show (stays, below), THAT STANDS THERE BY THE RAFT'S MASK (with 0.02 of the mask to spare, for the arithmetic) AND FROM WHICH ITS COURSE KEEPS THE
//   MARGIN, and that no other wisp has been dealt there (were no hot stone to serve, the nearest other stone would; were none at all, the wisp would not be
//   drawn at that repeat). The wisp keeps its own height, lean and pattern; the stone it stands on gives its place, its lift and slide and its coming and
//   going. No stream is drawn on and nothing is dealt by chance.
// Returns the table (see the wisps' block of buildStones) and its first repeat and size. A new map, because the pick needs the whole field of stones and the
// whole track, which a wisp's vertex cannot search: 52 columns by one row for each repeat of the box in the rectangle of repeats that hold a dealt wisp.
async function dealWisps(ctx, all, hot, path, SU, raftT, shapes) {
  const f = Math.fround, NH = hot.length / 4, NA = all.length / 4, CLEAR = 2.0 + 0.05, TOL = 0.02;
  // the raft's mask as the shader works it (WS_NOISE's wsH12 and wsVN and RAFT_GLSL's raftPathX and raftMask line by line, in single precision)
  const fr = (x) => f(x - Math.floor(x)), c01 = (x) => Math.min(1, Math.max(0, x)), K1 = f(0.1031), K2 = f(33.33), T = f(raftT.value);
  const sst = (a, b, x) => { const t = f(c01(f(f(x - a) / f(b - a)))); return f(f(t * t) * f(3 - f(2 * t))); };
  const mixf = (a, b, t) => f(f(a * f(1 - t)) + f(b * t));
  const h12 = (x, y) => { let qx = fr(f(x * K1)), qy = fr(f(y * K1)), qz = qx; const d = f(f(f(qx * f(qy + K2)) + f(qy * f(qz + K2))) + f(qz * f(qx + K2))); qx = f(qx + d); qy = f(qy + d); qz = f(qz + d); return fr(f(f(qx + qy) * qz)); };
  const vn = (x, y) => { x = f(x); y = f(y); const ix = Math.floor(x), iy = Math.floor(y); let u = fr(x), v = fr(y); u = f(f(u * u) * f(3 - f(2 * u))); v = f(f(v * v) * f(3 - f(2 * v)));
    return mixf(mixf(h12(ix, iy), h12(ix + 1, iy), u), mixf(h12(ix, iy + 1), h12(ix + 1, iy + 1), u), v); };
  const pathX = (z) => f(f(f(f(f(11 * f(c01(f(-z / 80)))) - f(26 * f(c01(f(f(-80 - z) / 170))))) - f(45 * f(c01(f(f(-250 - z) / 150))))) - f(50 * f(c01(f(f(-400 - z) / 100))))) - f(16 * f(c01(f(f(-500 - z) / 77)))));
  const M = { band: 0, mask: 0 };      // at a place: the band alone (the most the mask can be there) and the mask
  const maskAt = (x, z) => { x = f(x); z = f(z); const ax = f(f(x - pathX(z)) + f(7 * f(Math.sin(f(z * f(0.013))))));
    M.band = f(f(f(1 - sst(20, 35, Math.abs(ax))) * sst(-650, -570, z)) * f(1 - sst(25, 60, z)));
    const rows = f(f(vn(f(f(ax * f(0.055)) + f(3.7)), f(z * f(0.007))) * f(0.62)) + f(vn(f(ax * f(0.17)), f(f(z * f(0.023)) + 9)) * f(0.38)));
    M.mask = f(M.band * sst(T, f(T + f(0.1)), rows)); return M; };
  const stand = (w) => f(f(w * f(0.75)) + f(0.12));      // a stone of number w stands where the mask is at least this (STONE_GLSL)
  // the sea's greatest slide toward each of 64 headings (its eight waves that move things: uWA.xy the heading, uWB.y*uWB.x the reach), and the lean's reach
  const ND = 64, nx = new Float64Array(ND), nz = new Float64Array(ND), slide = new Float64Array(ND), lean = new Float64Array(ND); let far = 0;
  for (let m = 0; m < ND; m++) {
    const a = m * 2 * Math.PI / ND, x = Math.cos(a), z = Math.sin(a); let s = 0;
    for (let i = 0; i < 8; i++) s += Math.abs(SU.uWB.value[i].y * SU.uWB.value[i].x * (SU.uWA.value[i].x * x + SU.uWA.value[i].y * z));
    nx[m] = x; nz[m] = z; slide[m] = s; lean[m] = Math.max(0, 0.7 * (0.8 * x - 0.6 * z)); far = Math.max(far, s);
  }
  // how much of that slide the shoal leaves at a place: SEA_GLSL's damping, with the deepest of the four depths round the place (never less than the sea's own)
  const dT = SU.uDepthTex.value.image, dR = SU.uDepthRect.value, dN = dT.width, half = THREE.DataUtils.fromHalfFloat;
  const damp = (x, z) => { const u = (x - dR.x) * dR.z, v = (z - dR.y) * dR.w; if (Math.min(u, 1 - u, v, 1 - v) < 0.05) return 1;
    const o = Math.floor(v * dN - 0.5) * dN + Math.floor(u * dN - 0.5), m = Math.max(half(dT.data[o]), half(dT.data[o + 1]), half(dT.data[o + dN]), half(dT.data[o + dN + 1]));
    return lerp(SU.uShoreDamp.value, 1, smoothstep(0, 1, m / SU.uShoal.value.x)); };
  // the track in plan, every half metre, kept in bins of 8 m of z; R: beyond this no wisp's course can come within the margin; cells: the repeats of the box
  // (kx, kz: whole boxes from the stones' own places) that hold a place within R of the track
  const NT = Math.floor((path.length + 96) / 0.5) + 1, tx = new Float64Array(NT), tz = new Float64Array(NT), bins = new Map(), BIN = 8, R = far + (0.7 + 0.6) * 2.2 + CLEAR, NB = Math.ceil(R / BIN), tv = new THREE.Vector3(), cells = new Map();
  for (let i = 0; i < NT; i++) {
    path.posAtDist(i * 0.5 - 96, tv); tx[i] = tv.x; tz[i] = tv.z; const b = Math.floor(tv.z / BIN); if (!bins.has(b)) bins.set(b, []); bins.get(b).push(i);
    for (let kz = Math.floor((tv.z - R) / BOX); kz <= Math.floor((tv.z + R) / BOX); kz++) for (let kx = Math.floor((tv.x - R) / BOX); kx <= Math.floor((tv.x + R) / BOX); kx++) cells.set(kz * 4096 + kx, [kx, kz]);
  }
  // does the whole course of a wisp of height h whose stone is at (x, z) keep the margin from the track, in plan? (the track's bins from the stone's own outward;
  // a track point nearer the stone itself than the margin and the half width fails at once, one beyond the slide's and the lean's whole reach passes at once)
  const keeps = (x, z, h) => { const need = CLEAR + 0.6 * h, b0 = Math.floor(z / BIN); let k = -1, sure = need + far + 0.7 * h;
    for (let e = 0; e <= 2 * NB; e++) { const bin = bins.get(b0 + (e & 1 ? (e + 1) >> 1 : -(e >> 1))); if (!bin) continue;
      for (let s = 0; s < bin.length; s++) {
        const i = bin[s], dx = tx[i] - x, dz = tz[i] - z, d2 = dx * dx + dz * dz; if (d2 >= sure * sure) continue; if (d2 < need * need) return false;
        if (k < 0) { k = damp(x, z); sure = need + k * far + 0.7 * h; if (d2 >= sure * sure) continue; }
        let m = -1e9; for (let q = 0; q < ND; q++) { const v = dx * nx[q] + dz * nz[q] - k * slide[q] - h * lean[q]; if (v > m) m = v; }
        if (m < need) return false;
      } }
    return true; };
  await ctx.yield();
  // the stones that carry a wisp (live's own pick, counted again); the others, hot ones first then the rest, and for a wisp its list of either kind in the
  // order of their distance from its own stone (the nearest image in the box; of two as near, the earlier in the list)
  const own = new Uint8Array(NA); for (let i = 0, n = 0; i < NA && n < NH; i++) if (all[i * 4 + 2] > 0.24) { own[i] = 1; n++; }
  // stays: the surge hides a stone two ways as uStoneK falls: its scale goes to nothing once uStoneK is under its number less 0.04 (STONE_GLSL), and the
  // world's update draws of each shape only its first ceil(count*(uStoneK + 0.12)) stones (a shape's stones lie in the order of their numbers). A stone whose
  // rank in its shape runs ahead of its number by 0.12 - 0.04 of the shape's count would leave the draw while it still shows, and a wisp dealt to it would
  // stand for that while over bare water: such a stone takes no wisp (with one stone to spare, for the arithmetic)
  const stays = new Uint8Array(NA); for (let s = 0, j = 0; s < shapes.length; s++) for (let r = 0; r < shapes[s] && j < NA; r++, j++) stays[j] = r + 1 < shapes[s] * (f(all[j * 4 + 3]) + 0.12 - 0.04) ? 1 : 0;
  const pool = [[], []]; for (let j = 0; j < NA; j++) if (!own[j] && stays[j]) pool[all[j * 4 + 2] > 0.24 ? 0 : 1].push(j);
  const lists = new Map(), off = (a, b) => { const o = f(all[a]) - f(hot[b]); return o - BOX * Math.round(o / BOX); };
  const others = (i, kind) => { let L = lists.get(i * 2 + kind); if (L) return L; const P = pool[kind], d2 = new Float64Array(P.length);
    for (let n = 0; n < P.length; n++) { const ox = off(P[n] * 4, i * 4), oz = off(P[n] * 4 + 1, i * 4 + 1); d2[n] = ox * ox + oz * oz; }
    L = Uint16Array.from(P.keys()).sort((a, b) => d2[a] - d2[b] || a - b).map((n) => P[n]); lists.set(i * 2 + kind, L); return L; };
  // the deal, repeat by repeat of the box (in the order of kz, then kx), wisps in the order of their numbers
  const taken = new Set(), dealt = []; let ux0 = 1e9, ux1 = -1e9, uz0 = 1e9, uz1 = -1e9, row = 1e9;
  for (const [kx, kz] of [...cells.keys()].sort((a, b) => a - b).map((c) => cells.get(c))) {
    if (kz !== row) { row = kz; await ctx.yield(); }
    for (let i = 0; i < NH; i++) {
      const px = f(hot[i * 4]) + BOX * kx, pz = f(hot[i * 4 + 1]) + BOX * kz, w = f(hot[i * 4 + 3]), h = f(f(0.8) + f(f(1.4) * fr(f(w * f(13.7)))));
      if (keeps(px, pz, h)) continue;                                        // far enough: live's wisp
      if (maskAt(px, pz).band < stand(w) - TOL) continue;                    // no stone of its number stands there: no wisp there
      let ox = 0, oz = 0, size = -1, num = 0;                                // (size -1, no wisp drawn for that repeat: where its own stone does not stand by the mask, as live draws none, and were no stone to serve)
      if (M.mask >= stand(w) - TOL) for (let kind = 0; kind < 2 && size < 0; kind++) for (const j of others(i, kind)) {
        const jx = off(j * 4, i * 4), jz = off(j * 4 + 1, i * 4 + 1), qx = px + jx, qz = pz + jz;
        const key = (j * 64 + Math.round((qx - f(all[j * 4])) / BOX) + 32) * 64 + Math.round((qz - f(all[j * 4 + 1])) / BOX) + 32;      // that stone at that repeat
        if (taken.has(key) || maskAt(qx, qz).mask < stand(f(all[j * 4 + 3])) + TOL || !keeps(qx, qz, h)) continue;
        taken.add(key); ox = jx; oz = jz; size = all[j * 4 + 2]; num = all[j * 4 + 3]; break;
      }
      dealt.push(kx, kz, i, ox, oz, size, num);
      ux0 = Math.min(ux0, kx); ux1 = Math.max(ux1, kx); uz0 = Math.min(uz0, kz); uz1 = Math.max(uz1, kz);
    }
  }
  const nxC = dealt.length ? ux1 - ux0 + 1 : 0, nzC = dealt.length ? uz1 - uz0 + 1 : 0, data = new Float32Array(Math.max(1, NH) * Math.max(1, nxC * nzC) * 4);
  for (let e = 0; e < dealt.length; e += 7) for (let n = 0; n < 4; n++) data[(((dealt[e + 1] - uz0) * nxC + dealt[e] - ux0) * NH + dealt[e + 2]) * 4 + n] = dealt[e + 3 + n];
  const table = new THREE.DataTexture(data, Math.max(1, NH), Math.max(1, nxC * nzC), THREE.RGBAFormat, THREE.FloatType); table.needsUpdate = true;
  return { table, cells: new THREE.Vector4(nxC ? ux0 : 0, nzC ? uz0 : 0, nxC, nzC) };
}

// ---------------------------------------------------------------- the far raft: one sheet riding the sea, the raft's stones drawn per pixel
// THE SHEET CARRIES THE SAME RAFT AS THE REAL STONES ON THE SAME SEA. It is handed the five real stone meshes (read, never changed) and takes from them
// the real stones' three kinds (pebbles, small, big: 6, 3 and 1 in 10), each kind's number, its sum of sizes squared and the build of its shapes. A kind
// lies one stone to a cell of the side BOX / root of its number (at 1,800 stones: 1.40 m, 1.98 m, 3.43 m: the real stones' 0.85 to the square metre),
// sized as buildStones sizes it (0.07 to 0.17, 0.14 to 0.36, 0.45 to 0.8). A stone stands where the real stones' own rule lets a stone of its number
// stand: raftMask AT THE STONE'S OWN PLACE at least 0.12 + 0.75 of its number (STONE_GLSL's line). So the wind rows, the leads of open water and the
// band's frayed edge of loose stones are the mask's own: the same law as round the eye, over the whole band, on every seed. A stone is a lump with its
// real shape's plan area and its side area over the waterline (see shape below; the shapes differ from seed to seed, so the lumps do), its middle 0.16
// of its size over the water, bobbing and rocking by the real stones' own lines, lit by the real stones' own light with their mottle and their dark wet
// waterline. Between the stones the sheet draws nothing: the water there is the sea's own. Live's foam lace and shadow crescents are gone: the real
// stones cast no shadow on the water and their foam ring is not seen from above (its quads face the water).
// THE SWELL IS THE SEA'S OWN (no second wave field): the sheet rides seaDisp, the sea's own height and tilt (vertex); the mean of the stones reads the sea's
// own slope at the pixel as the sea's own shader works it for its light (seaNrm: a copy of the kit ocean's fragment for THE EIGHT WAVES THAT MOVE THE
// SURFACE, each with the kit's own fade by the pixel's footprint, its bend and its grouping: the same waves, phase and clock. It LEAVES the kit's ripple
// trains, its micro ripples and its gloss: they move no stone and are finer than a mean of stones) and the sea's own shade of its troughs (vH and
// uContrast, the sea's own measure and number). THE FOOTPRINT HANDED TO seaNrm IS THE KIT'S OWN CAPPED MEASURE (kit/water.js, the first line of its
// fragment's main: the pixel's width at that distance over the sight line's fall, the fall never taken under 0.03; the sheet's short axis is that width),
// so the far mean keeps the same share of the swell as the water beside it. Counted from an eye 2.8 m up (1280 x 720, fov 62), the share of the eight
// waves' slope kept (the sum of slope x fade over the sum of slope), kit / sheet in 100, at 50, 100, 150, 200, 300, 450 and 600 m: seed 7: 100 / 100,
// 69 / 72, 55 / 57, 46 / 48, 34 / 38, 24 / 27, 17 / 21; seed 21: 100 / 100, 70 / 74, 53 / 56, 45 / 47, 34 / 37, 23 / 27, 16 / 19. The sheet keeps 0 to
// 4 more because the kit takes the pixel's width at the picture's middle and the sheet has its true width on the sea, narrower off the middle. (The
// sheet's true long axis, capped or not, does not agree: on the swell's faces turned to the eye it is far shorter than the kit's level measure.)
// WHAT READS THE EYE IS ITS PLACE AND THE PIXEL'S FOOTPRINT, nothing else (no gaze, no lens, no clock or share of the flight, no seed). OPTICS: four laws
// and three lesser readings (5 to 7), which with the footprint handed to seaNrm (above) are all that reads the eye:
//  1. A STONE STANDS PROUD OF THE WATER, so along a low sight line it hides the water behind it. A pixel of the sheet shows the lump its sight line passes
//     through on the way to the eye's place: the line rises tn metres a metre over the sea's surface there (tn: the tangent of the angle between the sight
//     line and the sea's tilted surface). The lump it meets first is sought in the four cells round the pixel's sea point and round each step of 1.1 cells
//     toward the eye: 1 step for pebbles, 2 for small stones, 3 for big ones (8 + 12 + 16 = 36 cell lookups). Those steps reach every stone whose top the
//     line still passes through down to a rise tmin of 0.057 to 0.068 at 1,800 stones (by the kind and the seed's shapes; seeds 7, 21, 3, 40): an eye
//     2.8 m up sees that 41 to 49 m off on a level sea. At the lower tiers the cells are wider and the steps reach further: 0.050 to 0.063 at 1,440
//     stones, 0.042 to 0.051 at 1,080 (the same seeds; 44 to 66 m off). Flatter than that the lumps are drawn at that rise (squatter than they are, never cut by a cell) and the stones beyond the steps' reach
//     are their mean (law 3's own term for the rest of the line).
//  2. THE MELT (a pattern goes to its mean where a pixel is wider than its marks). A kind is drawn stone by stone where its mean lump stands 2.5 pixels
//     high and is its mean from 1 pixel down. The pixel is measured by the SHORT axis of its footprint on the sea: the long axis is only the low sight line,
//     and a lump that stands proud is as tall on screen as it stands, so nothing is filtered, stretched or smeared along the long axis.
//  3. THE MEAN IS THE SAME STONES' MEAN, by law 1: the share of a pixel hidden by a kind is 1 - exp(-(its sizes squared to the square metre) x (the share
//     standing by the mask) x (its plan area + its side area / tn)): a body standing on a plane hides its plan area and its side area over the tangent of
//     the sight line's rise. Seen steeply and with every stone standing that is the real stones' 11 in 100 of the sea (by the mask fewer stand: over the
//     whole band 6.6 to 8.7 in 100, counted from above on seeds 7, 21, 3, 40); on the swell's faces turned to the eye the water shows between
//     the stones, on its backs and crests the stones close up; far off the rows close to a road. Its tone: the lumps' albedo under the real stones' light
//     on the mean of the faces a low eye sees, x 0.76 (counted against the sheet's own lumps from eyes 2 to 5 m up, morning, afternoon and night), the sun's share by
//     the sea's own slope (Lambert, 0.4 to 1.6 of the level sea's) and the sea's trough shade.
//  4. THE HANDOVER (a level of detail by where the eye is). The real stones shrink away between 17.5 and 22.5 m from the eye (STONE_GLSL: 0.38 to 0.49 of
//     BOX). The sheet's stones grow over the SAME ring, each by its own place as the real ones do, to the size that keeps the area of stone the same (root
//     of 1 less the real stone's scale squared). LIVE MELTED THE SHEET AWAY INSIDE 9 TO 16 m; moved, because the sheet now holds the real stones' own cover
//     and from 9 to 22.5 m would lay it twice.
//  5. BULGE (reads the sight line's rise). A real stone is lobed: along a low sight line it shows its bulges, which are its pale parts, in front of its
//     pits and hollows. A lump is smooth, so its albedo is raised to match: by up to 23 in 100 at the lump's waist along a level sight line, less toward
//     its top and as the line steepens (BULGE x (1 - the hit's height squared) / (1 + 3 x the rise): a quarter of it at a rise of 1). Set by count: with
//     it the lumps' mean tone is the real stones' from eyes 2 to 30 m up (within 1 in 100).
//  6. THE PITS' MELT (reads the footprint's short axis). A real stone's coarse pits darken it by 14 in 100 in the mean while a pixel is finer than they
//     are, and melt into its mean tone as the pixel grows (the real stones' own fragment: between 0.08 and 0.3 of its measure of the pixel against the
//     stone). A lump has no pits: it carries that darkening and melts it by the same two numbers (pitM), so a lump pales with distance as its stone does.
//  7. THE SHEET'S LIFT, LIVE'S OWN AND UNCHANGED (the vertex; live wrote no reason for it): the sheet lies 0.05 m over the sea and 0.0016 m more for each
//     metre from the eye's place. The sight line of laws 1 and 3 and the fall handed to seaNrm are taken to the sheet's own point, so they read that
//     lift: at 100 m the eye stands 0.21 m lower over the sheet than over the sea, and the lumps there are seen a little flatter than the real stones
//     would be.
// THE HARD BLUE BAND AT THE HORIZON (the owner's term d): it is THE SEA'S OWN FAR TONE, not the raft's edge. The kit's ocean (kit/water.js, OCEAN_FRAG) keeps
//     its deep body colour and its mirror of the sky out to 1,800 m and only then melts into the sky's horizon colour (uFadeA, uFadeB: half and 0.97 of its
//     3,600 m); from 2.8 m up all of that is a sliver, so cobalt meets the pale sky in a line. It is the kit's; named and left. What this round changes of it:
//     live's pale sheet ended against that cobalt in a line, the stones now thin out into it. The kit's fade could be handed other numbers from this
//     world's own call to the ocean (Water.makeOcean in build: fadeStart, fadeEnd) and is not in this round, because that changes the sea of the whole
//     flight and every picture of it: a round of its own, for the owner to rule.
// THROUGH THE PREVIOUS PORTAL the raft before the entry (the band reaches 52.4 m behind it: there the mask falls to 0.12, the least a stone stands by) is drawn by the same laws from the eye's place there: stones
//     on the sea as everywhere, where live had its pale sheet cut off square at 50 m behind the entry.
// COST: one draw, live's grid of 220 x 22 cells = 9,680 triangles, laid on the band's own middle line (the mask's ax = 0) 84 m wide from 60 m behind the
//     entry to 642 m beyond it, so no stone and no lump over the band's edge is cut by the sheet's edge (live's 78 m lay up to 3 m inside the band's edge).
//     As built on seeds 7, 21, 3, 40 the scene is 39, 39, 40, 39 draws and 617,330 / 614,116 / 616,605 / 623,750 triangles, live's and this file's alike.
//     A pixel near the eye: 36 cell lookups (live 20), 5 noise lookups and the sea's 8 waves (live 7 noise), 2 noise more for each stone the sight line
//     meets (the mask at its place); a pixel where every kind is its mean: no cell lookup at all.
function buildRaft(SU, LU, raftT, swell, real) {
  const NZ = 220, NX = 22, pos = new Float32Array((NZ + 1) * (NX + 1) * 3), idx = [];
  for (let j = 0, k = 0; j <= NZ; j++) {
    const z = 60 - j * (702 / NZ), cx = raftPathX(z) - 7 * Math.sin(z * 0.013);
    for (let i = 0; i <= NX; i++, k++) { pos[k * 3] = cx + (i / NX - 0.5) * 84; pos[k * 3 + 1] = 0; pos[k * 3 + 2] = z; }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(-60, 0, -300), 420);
  // THE REAL STONES' OWN BUILD, read from the five shapes buildStones made (real: its five stone meshes; nothing of them is changed). Of a shape, in sizes
  // of its stone: its plan area (the outline of its points seen from above), its side area over the water (the outline seen level, above the waterline
  // 0.16 under its middle, the mean of 8 headings) and its reach along x and z; the lump that stands for it has that plan area (half widths in the
  // shape's own proportion) and the half height that gives that side area.
  const hull = (pts) => { pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const h = [];
    for (let pass = 0, base = 0; pass < 2; pass++, base = h.length, pts.reverse()) { for (const q of pts) { while (h.length - base >= 2) { const a = h[h.length - 2], b = h[h.length - 1]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) <= 0) h.pop(); else break; } h.push(q); } h.pop(); }
    return h; };
  const area = (h) => { let s = 0; for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  const above = (h, y0) => { const o = []; for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length], ia = a[1] >= y0, ib = b[1] >= y0; if (ia) o.push(a); if (ia !== ib) { const t = (y0 - a[1]) / (b[1] - a[1]); o.push([a[0] + (b[0] - a[0]) * t, y0]); } } return o; };
  const WL = -0.16, shape = real.map((m) => { const p = m.geometry.attributes.position, n = p.count, P = Array.from({ length: n }, (_, i) => [p.getX(i), p.getY(i), p.getZ(i)]);
    let rx = 0, rz = 0, side = 0; for (const q of P) { rx = Math.max(rx, Math.abs(q[0])); rz = Math.max(rz, Math.abs(q[2])); }
    const plan = area(hull(P.map((q) => [q[0], q[2]])));
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 8, c = Math.cos(a), s = Math.sin(a); side += area(above(hull(P.map((q) => [q[0] * c + q[2] * s, q[1]])), WL)) / 8; }
    // the lump: half widths a, b (plan area pi a b, a : b as the shape's reach), half height c by halving (its side area: the part of the ellipse w by c over the waterline)
    const w = Math.sqrt(plan / Math.PI), ax = w * Math.sqrt(rx / rz), az = w * Math.sqrt(rz / rx), sideOf = (c) => { const u = Math.min(1, -WL / c); return w * c * (Math.PI - Math.acos(u) + u * Math.sqrt(1 - u * u)); };
    let lo = 0.05, hi = 3; for (let i = 0; i < 40; i++) { const c = (lo + hi) / 2; if (sideOf(c) < side) lo = c; else hi = c; }
    const a4 = m.geometry.attributes.aP.array, full = m.userData.full; let e2 = 0; for (let i = 0; i < full; i++) e2 += a4[i * 4 + 2] * a4[i * 4 + 2];
    return { plan, side, ax, ay: (lo + hi) / 2, az, n: full, e2 }; });
  // the three kinds, as buildStones deals them: [its shapes, least size, greatest size, steps along the sight line, turn of its cells]
  const KIND = [[[2, 2], 0.07, 0.17, 1, 0.6], [[0, 1], 0.14, 0.36, 2, 1.9], [[3, 4], 0.45, 0.8, 3, 2.9]].map(([sh, s0, s1, steps, turn]) => {
    const A = shape[sh[0]], B = shape[sh[1]], n = sh[0] === sh[1] ? A.n : A.n + B.n, e2 = sh[0] === sh[1] ? A.e2 : A.e2 + B.e2;
    const C = BOX / Math.sqrt(Math.max(n, 1)), sm = (s0 + s1) / 2, wide = Math.max(A.ax, A.az, B.ax, B.az), top = 0.16 + Math.max(A.ay, B.ay);
    // tmin: the least rise of the sight line at which the steps still reach every stone whose top it passes through (law 1). The top of the tallest: its
    // middle's 0.16 + 0.07 of bob + its half height + 0.2 for its rocking; the steps' reach: 1.1 cells each and 0.64 of a cell round the last, less its half width
    const tmin = (top + 0.27) * s1 / ((steps * 1.1 + 0.64) * C - wide * s1);
    // tau: the kind's sizes squared to the square metre (the real stones' own sum); planM, sideM: its mean plan and side area in sizes squared (law 3)
    return { C, s0, s1, steps, turn, tau: e2 / (BOX * BOX), sm, tmin, A, B, wide, top, planM: (A.plan + B.plan) / 2, sideM: (A.side + B.side) / 2, deep: A.ax + A.az + B.ax + B.az };
  });
  const fl = (x) => { const s = String(+x.toFixed(5)); return s.includes('.') ? s : s + '.0'; };
  const v3 = (S) => `vec3(${fl(S.ax)}, ${fl(S.ay)}, ${fl(S.az)})`;
  const kindCall = (K, i) => `
        { float kk = smoothstep(1.0, 2.5, ${fl(K.sm)}*(${fl(K.deep / 2)}*tn + ${fl(K.top)}*min(1.0, tn/${fl(K.tmin)}))/fShort)*grow, tau = S*G2*${fl(K.tau)};
          float cov = 1.0 - exp(-tau*(${fl(K.planM)} + ${fl(K.sideM)}/tnM)); vec4 L = vec4(0.0);
          if (kk > 0.003) L = rfKind(vXZ, e, max(tn, ${fl(K.tmin)}), ${fl(K.C)}, ${fl(K.s0)}, ${fl(K.s1)}, ${v3(K.A)}, ${v3(K.B)}, ${fl(K.wide)}, ${fl(17 + 24 * i)}, ${K.steps}, vec2(${fl(Math.cos(K.turn))}, ${fl(Math.sin(K.turn))}), fShort, Ns);
          // (the stones further along the sight line than the steps reach, whose tops it still passes through: their mean, behind the lumps)
          float rest = (1.0 - L.a)*(1.0 - exp(-tau*${fl(K.sideM)}*max(1.0/tn - ${fl(1 / K.tmin)}, 0.0)));
          stone = stone + mix(meanCol*cov, L.rgb*L.a + meanCol*rest, kk)*(1.0 - A); A = A + mix(cov, L.a + rest, kk)*(1.0 - A); }`;
  const mat = new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    uniforms: { ...SU, ...LU, uRaftT: raftT, uAmp: swell.uAmp, uContrast: swell.uContrast },
    vertexShader: /* glsl */`
      uniform float uAmp;
      varying vec2 vXZ; varying vec3 vNs; varying vec3 vW; varying float vH;
      ${LAW_FOG_PARS_V}
      ${SEA_GLSL}
      void main(){
        vec3 nrm; vec3 d = seaDisp(position.xz, nrm);
        float dist = length(position.xz - uSeaCam);
        vec3 w = vec3(position.x + d.x, d.y + 0.05 + dist*0.0016, position.z + d.z);
        vXZ = position.xz; vNs = nrm; vW = w; vH = d.y/uAmp;      // (vH: the sea's own measure of crest and trough, as its shader has it)
        vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uSeaT, uContrast; uniform vec2 uSeaCam; uniform vec4 uWA[18]; uniform vec4 uWB[18];
      varying vec2 vXZ; varying vec3 vNs; varying vec3 vW; varying float vH;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      ${RAFT_GLSL}
      // LOBE: how far a lump's faces turn from a smooth lump's (the real stones are lobed). BULGE: along a low sight line the real stones show their bulges,
      // which are their pale parts (it reads the sight line's rise: the head's 5). Both set by count so that the lumps' mean tone is the real stones' from eyes 2 to 30 m up (within 1 in 100)
      const float LOBE = 0.45, BULGE = 0.23;
      const float TOP = ${fl(KIND[2].planM)}, SIDE = ${fl(KIND[2].sideM)};      // the big stones' mean plan area and side area over the water, in sizes squared: they weigh the mean of the faces a low eye sees (law 3)
      // THE SEA'S OWN SLOPE AT A PIXEL, as the sea's own shader works it for its light (kit/water.js, OCEAN_FRAG: its eight waves that move the surface,
      // each fading as the pixel's footprint nears its length, the shorter ones bent and grouped by the sea's own two noises): the same waves, phase and
      // clock as the water beside the stones, so the mean of the stones is lit and hidden by the swell the eye sees there. Left out: the kit's ripple
      // trains (its waves 9 to 18), its micro ripples and its gloss (the roughness it gathers from what it fades). foot: the kit's own capped measure of
      // the footprint, handed by main (see the head)
      const mat2 RF1 = mat2(0.7986, 0.6018, -0.6018, 0.7986), RF2 = mat2(-0.3256, 0.9455, -0.9455, -0.3256);
      vec3 seaNrm(vec2 xz, float foot){
        vec2 wq = vec2(wsVN(RF2*xz*0.05 + uSeaT*0.03), wsVN(RF1*xz*0.14 - uSeaT*0.05)) - 0.5;
        float gust = 0.5 + wsVN(xz*0.0065 + uSeaT*0.012) + 0.4*(wq.x + 0.5);
        vec2 slope = vec2(0.0); float q = 0.0;
        for (int i = 0; i < 8; i++) { vec4 a = uWA[i], b = uWB[i];
          float ka = a.z*b.x, f0 = smoothstep(1.2, 4.0, b.w/foot), g = 1.0;
          if (f0 <= 0.0) continue;
          float th = a.z*dot(a.xy, xz) - a.w*uSeaT + b.z;
          int m3 = i - (i/3)*3; float e = m3 == 0 ? wq.x : m3 == 1 ? wq.y : -wq.x - wq.y;
          if (i >= 3) { float sm = smoothstep(16.0, 6.0, b.w);
            th += ((i & 1) == 0 ? wq.x : wq.y)*mix(1.2, 5.0, sm); g *= clamp(1.0 + mix(1.9, 3.4, sm)*e, mix(0.3, 0.08, sm), 2.0)*mix(1.0, smoothstep(0.55, 1.5, gust)*1.5, sm); }
          float c = cos(th), s = sin(th), f = f0*g;
          slope += a.xy*(ka*c*f); q += b.y*ka*f*s; }
        return normalize(vec3(-slope.x, 1.0 - q, -slope.y));
      }
      // four numbers of a cell: xy where its stone lies in it, z the stone's number (what it stands by, turns by, is toned by), w its size
      vec4 rfH(vec2 p){ vec4 q = fract(p.xyxy*vec4(0.1031, 0.1030, 0.0973, 0.1099)); q += dot(q, q.wzxy + 33.33); return fract((q.xxyz + q.yzzw)*q.zywx); }
      // ONE KIND OF STONE: the lump the sight line from p meets first (law 1), lit; rgb its colour, a its cover of the pixel.
      // p: the pixel's sea point; e: the sight line's heading in plan, away from the eye; tn: its rise a metre; C: the kind's cell; s0, s1: its sizes;
      // salt: the kind's own cells; rot: the turn of its cells (each kind's grid lies its own way); pix: the footprint's short axis; upv: the sea's normal
      vec4 rfKind(vec2 p, vec2 e, float tn, float C, float s0, float s1, vec3 axA, vec3 axB, float wide, float salt, int steps, vec2 rot, float pix, vec3 upv){
        vec2 pr = vec2(rot.x*p.x + rot.y*p.y, rot.x*p.y - rot.y*p.x), er = vec2(rot.x*e.x + rot.y*e.y, rot.x*e.y - rot.y*e.x);
        float bt = -1.0, bc = 0.0, bw = 0.0, bsc = 1.0; vec3 bh = vec3(0.0, 1.0, 0.0), bax = vec3(1.0); vec2 bcs = vec2(1.0, 0.0);
        for (int j = 0; j <= steps; j++) {
          vec2 i0 = floor((pr - er*(float(j)*1.1*C))/C - 0.5);
          for (int n = 0; n < 4; n++) {
            vec2 g = i0 + vec2(float(n & 1), float(n >> 1)); vec4 h = rfH(g + salt);
            vec2 cr = (g + 0.5 + (h.xy - 0.5)*0.72)*C, c = vec2(rot.x*cr.x - rot.y*cr.y, rot.x*cr.y + rot.y*cr.x);
            // law 4: the real stone's own scale at that place, and the sheet's stone grown to the rest of the area
            float q0 = 1.0 - smoothstep(${(BOX * 0.38).toFixed(1)}, ${(BOX * 0.49).toFixed(1)}, length(c - uSeaCam));
            float sc = mix(s0, s1, h.w)*sqrt(max(1.0 - q0*q0, 0.0));
            if (sc < 0.002) continue;
            vec2 d = p - c;
            if (abs(d.x*e.y - d.y*e.x) > wide*sc + pix) continue;      // (wide: the kind's greatest half width: the sight line passes it by)
            float ph = h.z*61.0, cs = cos(ph), sn = sin(ph);
            vec2 rk = vec2(sin(uSeaT*1.7 + ph), cos(uSeaT*1.3 + ph*1.7))*0.16;      // rocking, by the real stone's own line
            // the lump: one of the kind's two shapes by its number (half of each, as the real stones are dealt), turned by its number, its middle 0.16 of its size over the water and bobbing
            vec3 ax = (fract(h.z*17.3) < 0.5 ? axA : axB)*sc;
            vec3 o = vec3(cs*d.x + sn*d.y, dot(rk, d) - sc*(0.16 + 0.07*sin(uSeaT*2.3 + ph*3.0)), cs*d.y - sn*d.x)/ax, dir = vec3(-(cs*e.x + sn*e.y), tn - dot(rk, e), -(cs*e.y - sn*e.x))/ax;
            float a = dot(dir, dir), b = dot(o, dir), oo = dot(o, o), dm = sqrt(max(oo - b*b/a, 0.0));
            float t = (-b + sqrt(max(b*b - a*(oo - 1.0), 0.0)))/a;
            float edge = (1.0 - dm)*min(ax.x, ax.z)/max(pix, 1e-4) + 0.5;      // the lump's rim, one pixel soft
            if (edge <= 0.0 || t < 0.0 || t <= bt) continue;
            if (raftMask(c) < h.z*0.75 + 0.12) continue;      // the real stones' rule, at the stone's own place
            bt = t; bc = min(edge, 1.0); bh = o + dir*t; bax = ax; bw = h.z; bsc = sc; bcs = vec2(cs, sn);
          }
        }
        if (bt < 0.0) return vec4(0.0);
        // lit as the real stone is: its normal (turned back, on the rocking sea), its mottle, its wet waterline
        float ph = bw*61.0, o1 = bw*50.0;
        vec3 nl = (bh + LOBE*sin(bh.yzx*4.1 + o1)*cos(bh.zxy*3.3 - o1))/bax;      // (the real stone is lobed: its faces turn more ways than a smooth lump's)
        vec3 up = normalize(upv + vec3(sin(uSeaT*1.7 + ph), 0.0, cos(uSeaT*1.3 + ph*1.7))*0.16);
        vec3 N = normalize(vec3(bcs.x*nl.x - bcs.y*nl.z, 0.0, bcs.y*nl.x + bcs.x*nl.z) + up*nl.y);
        float h1 = sin(bh.x*3.1 + o1)*sin(bh.y*2.7 + o1*1.3)*sin(bh.z*3.4 - o1), h2 = sin(bh.x*7.3 - o1)*sin(bh.z*6.1 + bh.y*5.0 + o1);
        float wet = 1.0 - smoothstep(-0.2, -0.02, bh.y*bax.y/bsc), ndl = dot(N, uSun);
        float pitM = 1.0 - 0.14*(1.0 - smoothstep(0.08, 0.3, 2.0*pix*(1.0 + 2.0*bsc)/bsc));      // the real stone's coarse pits, in the mean, melting by the footprint as its own do (the head's 6)
        vec3 alb = vec3(0.335, 0.34, 0.345)*(0.9 + 0.18*h2 + 0.108*h1)*(0.8 + 0.4*fract(bw*7.3))*mix(1.0, 0.34, wet)*pitM*(1.0 + BULGE*(1.0 - bh.y*bh.y)/(1.0 + 3.0*tn));
        vec3 col = alb*(uSunCol*smoothstep(-0.1, 0.55, ndl)*0.98 + uSkyCol*(0.34 + 0.24*N.y)) + uSkyCol*0.1*wet*pow(max(1.0 - abs(N.y), 0.0), 2.0);
        return vec4(col, bc);
      }
      void main(){
        vec3 Ns = normalize(vNs), toE = cameraPosition - vW; float dist = length(toE); vec3 V = toE/max(dist, 1e-3);
        // law 1: the sight line's rise over the sea's own surface here (never under 0.004: a face turned from the eye is all stone)
        float sn = clamp(dot(V, Ns), 0.004, 0.999), tn = sn/sqrt(1.0 - sn*sn);
        vec2 e = vW.xz - cameraPosition.xz; e = e/max(length(e), 1e-3);
        // law 2: the pixel's footprint on the sea, its long and its short axis
        vec2 dx = dFdx(vXZ), dy = dFdy(vXZ); float fa = dot(dx, dx), fb = dot(dy, dy), fc = dot(dx, dy);
        float fLong = sqrt(max(0.5*(fa + fb + sqrt((fa - fb)*(fa - fb) + 4.0*fc*fc)), 1e-10)), fShort = abs(dx.x*dy.y - dx.y*dy.x)/fLong;
        float m = raftMask(vXZ), S = clamp((m - 0.12)/0.75, 0.0, 1.0);      // the share of the stones that stands here, by the real stones' rule
        // law 4, for the mean: the area the sheet's stones have here
        float q0 = 1.0 - smoothstep(${(BOX * 0.38).toFixed(1)}, ${(BOX * 0.49).toFixed(1)}, length(vXZ - uSeaCam)), G2 = 1.0 - q0*q0, grow = step(0.0005, G2);
        // law 3: the sight line's rise over the sea's own slope at the pixel; the mean tone (see the head). The footprint handed to seaNrm is the kit
        // ocean's own line: the pixel's width at that distance (the short axis) over the sight line's fall, the fall never taken under 0.03
        vec3 Nf = seaNrm(vXZ, fShort/max(abs(V.y), 0.03)); float snM = clamp(dot(V, Nf), 0.004, 0.999), tnM = snM/sqrt(1.0 - snM*snM);
        vec3 side = normalize(vec3(V.x, 0.0, V.z)*0.67 + Nf*0.42), Nm = normalize(Nf*(TOP*snM) + side*SIDE);
        float sunM = smoothstep(-0.1, 0.55, dot(Nm, uSun))*0.98*clamp(dot(Nf, uSun)/max(uSun.y, 0.2), 0.4, 1.6);
        vec3 meanCol = vec3(0.335, 0.34, 0.345)*0.76*(uSunCol*sunM + uSkyCol*(0.34 + 0.24*Nm.y))*mix(1.0, 0.5 + 0.5*smoothstep(-1.0, 0.25, vH), uContrast);
        vec3 stone = vec3(0.0); float A = 0.0;
        ${kindCall(KIND[2], 2)}${kindCall(KIND[1], 1)}${kindCall(KIND[0], 0)}
        if (A < 0.004) discard;
        gl_FragColor = vec4(stone/A, A);
        ${LAW_FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'raft'; mesh.renderOrder = 2; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- ochre streamers: 12 long soft ribbons lying on the stained sea, drawn downwind
function buildOchre(rng, SU, LU) {
  const pos = [], dat = [], idx = [], SEG = 48, wx = 0.8, wz = -0.6;
  for (let r = 0; r < 12; r++) {
    const az = -338 - r * 21 + rng.range(-6, 6), ax = raftPathX(az) + rng.range(-8, 8);
    const len = rng.range(230, 420), f0 = rng.range(0.3, 0.6), wid = rng.range(4.5, 10), amp = rng.range(6, 16), fr = rng.range(0.012, 0.022), ph = rng.range(0, 6.28), sd = rng.range(0, 40);
    const base = pos.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG, sl = (t - f0) * len, off = amp * (Math.sin(sl * fr + ph) - Math.sin(ph)), w = wid * (0.35 + 0.65 * Math.sin(Math.PI * t));
      for (let s = -1; s <= 1; s += 2) { pos.push(ax + wx * sl - wz * (off + s * w), 0, az + wz * sl + wx * (off + s * w)); dat.push(s, t, sd, len / wid); }
      if (i > 0) { const v = base + i * 2; idx.push(v - 2, v - 1, v, v, v - 1, v + 1); }
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aR', new THREE.Float32BufferAttribute(dat, 4)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(-40, 0, -450), 700);
  const mat = new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
    uniforms: { ...SU, ...LU },
    vertexShader: /* glsl */`
      attribute vec4 aR; varying vec4 vR; varying vec3 vNs;
      ${LAW_FOG_PARS_V}
      ${SEA_GLSL}
      void main(){
        vec3 nrm; vec3 d = seaDisp(position.xz, nrm);
        float dist = length(position.xz - uSeaCam);
        vec3 w = vec3(position.x + d.x, d.y + 0.05 + dist*0.0016, position.z + d.z);
        vR = aR; vNs = nrm;
        vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uSeaT;
      varying vec4 vR; varying vec3 vNs;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        float al = vR.y*vR.w - uSeaT*0.05;                       // the stain slides slowly down its own length
        float n = wsVN(vec2(al*0.55 + vR.z, vR.x*1.3 + vR.z))*0.6 + wsVN(vec2(al*1.9, vR.x*3.1 - vR.z))*0.4;
        float edge = abs(vR.x) + (n - 0.5)*0.7;
        float a = (1.0 - smoothstep(0.25, 0.95, edge))*smoothstep(0.0, 0.12, vR.y)*(1.0 - smoothstep(0.85, 1.0, vR.y))*(0.45 + 0.55*n)*0.5;
        if (a < 0.01) discard;
        vec3 col = vec3(0.34, 0.2, 0.05)*(0.8 + 0.5*n)*(uSunCol*(0.35 + 0.5*clamp(dot(vNs, uSun), 0.0, 1.0)) + uSkyCol*0.4);
        gl_FragColor = vec4(col, a);
        ${LAW_FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'ochre'; mesh.renderOrder = 2; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the surge's mist as the eye sees it
// THE PART'S FOG LAW FOR THE SURGE'S MIST, as this file's own shaders read it: the mist's half of the part's ibFogV (in the part file, under
// "The piece's own atmosphere") letter for letter, for a point at d from the eye, with the part's own uniforms (uMist: density, top;
// uMistCyl: the vent's x and z, the front's radius; uMistCol: the mist's one tone). It is read by the sky veil (for a point 3,000 m off on
// the sight line) and by the sea (for the water's own point): so the part's bodies, the sky behind them and the sea under them are fogged by
// ONE LAW ON A SIGHT LINE. Whoever retunes it there retunes it here.
const MIST_LAW = /* glsl */`
uniform vec4 uMist, uMistCyl; uniform vec3 uMistCol;
float mistShare(vec3 d){
  float dist = length(d), cy = cameraPosition.y;
  float top = uMist.y;
  float ta = top*0.62, tb = top*1.38, dyq = abs(d.y) < 1e-3 ? 1e-3 : d.y;
  float ha = cy < ta ? (d.y > 0.0 ? clamp((ta - cy)/dyq, 0.0, 1.0) : 1.0) : (d.y < 0.0 ? 1.0 - clamp((ta - cy)/dyq, 0.0, 1.0) : 0.0);
  float hb = cy < tb ? (d.y > 0.0 ? clamp((tb - cy)/dyq, 0.0, 1.0) : 1.0) : (d.y < 0.0 ? 1.0 - clamp((tb - cy)/dyq, 0.0, 1.0) : 0.0);
  vec2 a = cameraPosition.xz - uMistCyl.xy;
  float A = dot(d.xz, d.xz), B = dot(a, d.xz), C = dot(a, a) - uMistCyl.z*uMistCyl.z, disc = B*B - A*C, t0 = 0.0, t1 = 0.0;
  if (A < 1e-6) { t1 = C < 0.0 ? 1.0 : 0.0; }
  else if (disc > 0.0) { float sq = sqrt(disc); t0 = clamp((-B - sq)/A, 0.0, 1.0); t1 = clamp((-B + sq)/A, 0.0, 1.0); }
  float fa = cy < ta ? max(min(t1, ha) - t0, 0.0) : max(t1 - max(t0, 1.0 - ha), 0.0);
  float fb = cy < tb ? max(min(t1, hb) - t0, 0.0) : max(t1 - max(t0, 1.0 - hb), 0.0);
  float side = smoothstep(0.0, 80.0, uMistCyl.z - sqrt(max(dot(a, a) - B*B/max(A, 1e-6), 0.0))*clamp((length(a) - uMistCyl.z)/30.0 + 1.0, 0.0, 1.0));
  float L = dist*0.5*(fa + fb)*uMist.x*side;
  return 1.0 - exp(-L*L);
}
`;
// THE SAME FOG FOR WHAT LIES ON THE SEA OR STANDS IN IT (LAW_FOG): the sea takes the look's distance haze and then, while a surge is
// out, the mist by mistShare for the water's own point (see build). Every material of THIS WORLD'S OWN takes the same two, the same way
// (but for the haze's tone beyond 1,800 m, where the sea's leans to the kit's horizon tone and none of these lies),
// for its own point, in its own shader text, in place of the scene's fog (which goes by where the eye stands): the stones, their foam and
// their wisps, the far raft's sheet, the ochre streamers, the ship, the splash and the sky bombs. So at one place the sea and what lies
// on it take one share of mist, before the front, inside and after. The four pieces stand where three's own fog chunks stood: the
// vertex hands on the view depth (for the haze, as the chunk did) and the vector from the eye to the point in world space (for the
// law); the fragment lays the haze toward the look's haze tone (uSeaHaze: rgb, density: what scene.fog is while no surge is out) and
// then the mist's one tone by the law's share. The uniforms are the hero's own objects (uMist, uMistCyl, uMistCol), handed over with
// the light (LU, in build). LEFT ON THE SCENE'S FOG, which carries the surge's mist by the cloud at the eye's place (rl, in update):
// the kit's own things, whose materials are the kit's: the birds, the ash flakes and the flecks, the ship's two lamps and the rare
// waterspout (see the head for where each stands against the law; the kit's rainbow takes no fog at all).
const LAW_FOG_PARS_V = /* glsl */`varying float vLawDepth; varying vec3 vLawD;`;
const LAW_FOG_V = /* glsl */`vLawDepth = -mvPosition.z; vLawD = transpose(mat3(viewMatrix))*mvPosition.xyz;`;
const LAW_FOG_PARS_F = /* glsl */`uniform vec4 uSeaHaze; varying float vLawDepth; varying vec3 vLawD;${MIST_LAW}`;
const LAW_FOG_F = /* glsl */`{ float lawHz = uSeaHaze.w*vLawDepth; gl_FragColor.rgb = mix(gl_FragColor.rgb, uSeaHaze.rgb, 1.0 - exp(-lawHz*lawHz)); if (uMist.x > 1e-5) gl_FragColor.rgb = mix(gl_FragColor.rgb, uMistCol, mistShare(vLawD)); }`;
// Two camera-centred spheres drawn by one shader, both placed IN THE WORLD: the mist is a body, the cylinder round the vent that the surge's
// front has reached (uMistCyl, the hero's own uniform) under the layer's top.
// cover 0 (far, depth-tested): THE MIST OVER THE SKY, BY THE PART'S OWN FOG LAW (mistShare above, for a point 3,000 m off on the sight line):
//   the sky behind a body carries exactly the mist the part gives a body far off on that line, in the mist's one tone, with no glow.
// cover 1 (drawn last, over everything): THE CLOUD ITSELF, the surge's body drawn in the ramp. Three slabs of billows, looked up in world
//   space (so they pass with true parallax and stream away from the vent), laid front to back over a thin haze of the mist's own tone.
//   They stand 13, 32 and 78 m along the sight line FROM WHERE IT ENTERS THE BODY (t0: nothing where the eye is inside), and only where
//   that point is inside the cylinder, where the surge is in plan (the wall's own law: the crater and the tongue through the breach, see
//   held) and under the ragged top:
//   SEEN FROM OUTSIDE they are the wall itself where it is near: they come in while the sight line's way to the body shortens from 125 to
//     85 m, which is where the wall's own lobes start to give way (the part melts each of its lobes within 82 to 42 m and 1.5 radii of the
//     eye and none of them ever comes nearer), so the wall stays a wall of rolling lobes until its face is at the eye. The air before the
//     body's face is clear. THE FACE IS RAGGED INWARD ONLY: a slab's billows come in over 16 m of depth behind the front, the thin ash up
//     to 10 m deeper than the thick (RAG), and nothing of the cloud stands before the front. The body's skin is denser than its inside
//     and wears the wall's own lit tone, but only as a face seen from outside (kf: BY WHERE THE EYE ITSELF STANDS, how far it is outside
//     the body in plan, one number for the frame: all of it from 40 m outside, none of it for an eye inside. Not by the sight line's
//     way to the body, which made the face's fill and light a matter of its distance from the lens): an eye inside sees no face,
//     only the inside's billows;
//   AS THE FRONT CROSSES THE EYE t0 goes to nothing and the same three slabs are the cloud round us. A SIGHT LINE TURNED AWAY FROM THE VENT
//     DOES NOT TAKE THE CLOUD AT ONCE: its slabs' places lie before the front, where there is none, and it takes the cloud only as the
//     front runs on over those places (which is why the face is ragged inward only: ragged outward too, such a line took its nearest
//     billows in the one frame of the crossing). Counted frame by frame (1/60 s) on lines all round, four seeds: the most a line turned
//     away changes in one frame is 0.13 to 0.15 of alpha, and a line within 40 degrees of the vent and up to 38 degrees up 0.14 to
//     0.17: the billows' own drift (the live version's cloud, which has no front, changes by 0.12 to 0.18 a frame at the most).
//     WHAT DOES COME FAST IS THE WALL ITSELF, AT ITS EDGES: on a line 50 degrees and more off the vent, or 60 degrees up, the body's
//     limb or its top sweeps across in a few frames as the front arrives (0.27 to 0.33 of alpha in one frame at the most, in the last
//     half second before the crossing): the edge of a wall arriving at 30 m/s. A line that only grazes the body shows none of the
//     cloud (it comes in over the first 30 m by which the line's nearest pass of the vent's axis lies inside the front);
//   INSIDE the cloud hangs over the water (a slab's point never goes under the sea: on a sight line that meets the water the slab stands
//     at 0.85 of the way to it; the body's face stands on the water, but deeper in than 46 m, and for any eye inside, the cloud thins
//     toward the water over its lowest 5 m, so the water's own ripples show under it) and under the ragged top, so it opens overhead as
//     we climb out. IT IS A MEDIUM NEAR THE LENS: a billow thins as its place comes within 12 m of the lens's place (only a line that
//     meets the sea that near brings one so close), to about a tenth at the nearest: no slab's place is ever nearer than 4 m.
//   THE BILLOWS ARE HEAPS WITH FORM, NOT PATCHES. A slab is three sizes of value noise summed (the large heaps carry the smaller ones;
//     the farthest slab, seen through the two before it, is of the two larger sizes), each read on a lattice turned its own way (no gap
//     or billow has upright or level sides: no pane). THE LIGHT ON A BILLOW IS FORM FROM THE LIGHT'S SIDE: the largest size is read a
//     second time, two fifths of a cell toward the light across the sight line, and the heap is lit where the ash thins that way and
//     shaded where it thickens, in one wide run across the whole heap (no crease: a difference over two fifths of a cell; no steepened
//     step: the run is smoothed over 1.6 of its own range). The smaller sizes ride on it: their crests take more light, their hollows
//     less. And a billow's edge is soft: the ash thickens over a wide run of the density (0.38 to 0.64). No tone is laid down as a patch
//     with a border. (The light's side is uLightV: half way between the sun and straight up, so that with the sun square behind the eye,
//     as it is in the breach, the heaps are still lit from above and not flat.) ORDER 4, INSIDE THE BODY (by uIn, the cloud at the
//     eye's place; nothing of it for an eye before the front): that one wide run alone left the inside flat, so the light is taken from
//     the light's side across the two smaller sizes too. Each is read with its slope (vnS), folded softly into lobes (c/sqrt(c c +
//     FE), c = 2 v - 1: the crest and the hollow of the noise both bulge, with a soft seam between: cauliflower, not a rumpled
//     sheet), and the fold's slope toward the light (the same part of the light's direction that lies across the sight line, turned
//     into each size's own lattice: lb2, lb3) lights the roll's near side and shades its far side (B2, B3; BG the great billows'
//     share). The run is smoothed over 1.55 of its range and leans to the light (smoothstep(-0.45, 1.1): a shaded side is never a
//     blot). The density does not move: s.x and the alphas are eval9g's lines, and v2, v3 are the same numbers from the same lookups.
//   THE CLOUD TAKES ITS LIGHT FROM THE LOOK'S OWN LIGHT, by one law for every look: tone = the surge's own colour (uSurgeCol, the wall's)
//     with the design's warm lean (1.02, 1, 0.97) x (the hero's sun x a share + the hero's sky x a share). With the light l on the
//     billow (0 shaded to 1 lit) the sun's share runs 0.15 + 0.47 l l inside the body and from 0.62 to 0.95 on its face seen from outside
//     (the wall's own lit tone, as the wall's lobes wear it), the sky's share 0.4 x (0.45 + 0.75 l). INSIDE, THE SHADED SIDE IS LIFTED
//     TOWARD THE MIST'S OWN TONE (ash hanging in its own haze is not much darker than that haze): fully shaded it is about half the
//     mist's tone (0.47 to 0.49 of it; 0.15 to 0.23 with the sun's share from 0.02), and fully lit to fully shaded runs 3.5 to 1 by
//     day, 3.6 in the evening and 3.8 by moonlight (7.3, 8.1 and 12.4 with 0.02); on the thick billows as sight lines meet them, the
//     lightest fiftieth against the darkest, 2.6 to 3.1 to 1. The form from the light's side is as it was. So by day it is warm grey;
//     in the evening the lit side is warm (the low sun's) and the shaded side and the mist's one tone are a mauve grey (the evening
//     sky's violet with a share of the sun's red); by moonlight dark with the night's own blue. Without the lightning's glow it is
//     never brighter than the look's light (sun and sky together) on the surge's own colour: 0.89 of it at the most, the lit face by
//     moonlight. With the glow at its peak the lit face seen from outside is a little over it: by 2 to 6 in 100 in red by day and
//     in the evening, by 12 in red and 4 in blue by moonlight; inside, the lit side stays under it (0.77 at the most).
//   THE LIGHTNING IS A SOFT SWELL OF THE CLOUD'S OWN TONE (uGlowA: its direction and strength, see update): each billow's tone times
//     (1 + (0.26, 0.15, 0.24) x the glow there): at most 0.26 of the tone it falls on in red, 0.15 in green, 0.24 in blue, on lit and
//     shaded billows alike. The one bomb overhead (uGlowB) is a dull ember that shows only where a billow stands on its line.
//     ORDER 4, INSIDE: uGlowA is nothing there (update) and two glows of their own (uGlowP, uGlowQ: direction from the eye to the
//     glow's place, strength) each lay A SOFT LIT REGION: about its direction a lobe exp(-(1 - cos) GK) (half its strength 8 degrees
//     off, a tenth 15), which draws each slab's tone toward the glow's tone glT (the look's own sun and sky on the surge's colour,
//     1.3 and 2.6 of them, leaning violet white), the farther slabs more (1.2, 1.9, 2.6: a light inside the cloud), by g/(1 + g): a
//     bounded lift that cannot burn out; the glow's tone still carries the billow's light l (0.7 + 0.3 l), so the billows' forms
//     stand in the lit region. THE BOMB'S POOL the same way about the bomb's direction (PK: half 9 degrees off), toward a dull
//     orange poT of the look's own light (2.2, 0.85, 0.25 of the lit cloud's brightness, and 0.04, 0.013, 0.003 of its own), times
//     uIn. Both are exactly nothing where their strengths are nothing (mix(c, x, 0) = c). Their figures stand at the head.
// COST OF A PIXEL, by a count of scalar operations (the shader's own text worked in script: every add, multiply, compare and built-in
//   counted as one; value-noise lookups, square roots and divisions also given apart). The cloud's dearest pixel: 3,946 operations,
//   11 lookups (5 with their slope), 15 square roots (5 inverse), 6 exponentials, 53 divisions; 3,971, 14 and 55 for an eye inside the
//   body (eval9g's: 3,424 and 3,413 operations, 11 lookups, 10 and 9 square roots, 3 exponentials, 47 and 46 divisions; the version
//   before it 3,806 with 15 lookups); and none of it on a sight line that meets no body within 125 m. The sky veil: 115 operations, no
//   lookup, 5 square roots, 7 divisions (it leaves main before any of the cloud's lines). The sea's pixel works mistShare too while a
//   surge is out: some 105 operations, 4 square roots, 6 divisions more than the kit's own fog, and under the cloud at the eye its
//   whitening, some 65 more with one square root and one power; and so does a pixel of each of this world's own eight things on the
//   sea work mistShare (LAW_FOG), more than the scene's fog that it laid before.
function buildVeil(MU, cover) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: !cover, side: THREE.BackSide, fog: false,
    uniforms: { uCloud: MU.uCloud, uFlow: MU.uFlow, uGlowA: MU.uGlowA, uGlowB: MU.uGlowB, uGlowP: MU.uGlowP, uGlowQ: MU.uGlowQ, uIn: MU.uIn, uSeedV: MU.uSeedV, uLightV: MU.uLightV, uCover: { value: cover ? 1 : 0 }, uRad: { value: cover ? 40 : 3000 },
      uMist: MU.uMist, uMistCyl: MU.uMistCyl, uMistCol: MU.uMistCol, uSunCol: MU.uSunCol, uSkyCol: MU.uSkyCol, uSurgeCol: MU.uSurgeCol },
    vertexShader: /* glsl */`
      uniform float uRad; varying vec3 vDir;
      void main(){ vDir = position; gl_Position = projectionMatrix*viewMatrix*vec4(cameraPosition + position*uRad, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec4 uGlowA, uGlowB; uniform vec3 uCloud, uFlow, uSeedV, uLightV; uniform float uCover;   // uCloud: the layer's top, the world's clock, the cloud's strength (by the surge's life and growth and the eye's height under the cloud's top)
      uniform vec3 uSunCol, uSkyCol, uSurgeCol;                                                        // the hero's own light and the surge's own colour
      uniform vec4 uGlowP, uGlowQ; uniform float uIn;
      varying vec3 vDir;
      ${MIST_LAW}
      ${WS_NOISE}
      const float RAG = 10.0, LG = 4.5, C2 = 0.45, C3 = 0.5, BG = 1.0, B2 = 1.2, B3 = 1.6, FE = 0.25, GK = 70.0, PK = 60.0;
      vec4 vnS(vec3 p){
        vec3 i = floor(p), w = fract(p), f = w*w*(3.0 - 2.0*w), du = 6.0*w*(1.0 - w);
        float a = wsH13(i), b = wsH13(i + vec3(1,0,0)), c = wsH13(i + vec3(0,1,0)), e = wsH13(i + vec3(1,1,0)), g = wsH13(i + vec3(0,0,1)), h = wsH13(i + vec3(1,0,1)), j = wsH13(i + vec3(0,1,1)), k = wsH13(i + vec3(1,1,1));
        return vec4(du*vec3(mix(mix(b - a, e - c, f.y), mix(h - g, k - j, f.y), f.z), mix(mix(c - a, e - b, f.x), mix(j - g, k - h, f.x), f.z), mix(mix(g - a, h - b, f.x), mix(j - c, k - e, f.x), f.y)),
                    mix(mix(mix(a, b, f.x), mix(c, e, f.x), f.y), mix(mix(g, h, f.x), mix(j, k, f.x), f.y), f.z));
      }
      // one slab of billows at world point p (f = 1 / billow size): x = the ash's density there (0..1), y = the light on it (about 0..1),
      // z = the light on it for an eye inside the body (order 4: the great billows' form and the rolls' folds lit from the light's side, see the block above; lb2, lb3 = the light's side in the two smaller sizes' own lattices).
      // THREE SIZES SUMMED, EACH ON A LATTICE TURNED ITS OWN WAY by a fixed turn (value noise on an unturned lattice makes billows and gaps
      // with upright and level sides, a cell wide: a faint hard-edged pane 13 m from the lens; turned, no side of a cell is upright or level
      // and no two sizes' cells line up). THE LIGHT IS FORM FROM THE LIGHT'S SIDE: the largest size is read a second time, up to 0.42 of a
      // cell toward the light across the sight line (o1, see main: the part of the light's direction that lies across the line; nothing
      // on a line turned straight at the light or away from it), and the billow is lit where the ash thins that way and shaded where it
      // thickens: one wide run across the whole heap, a difference over two fifths of a cell and so without a crease. The smaller sizes
      // ride on it: their crests take more light and their hollows less (LG, C2, C3: the shares of the three sizes in the light)
      const mat3 R1 = mat3(0.808, 0.571, -0.145, -0.342, 0.655, 0.674, 0.479, -0.496, 0.724);
      const mat3 R2 = mat3(0.282, 0.422, -0.862, -0.355, 0.88, 0.315, 0.891, 0.217, 0.398);
      const mat3 R3 = mat3(0.731, -0.358, 0.581, -0.226, 0.676, 0.701, -0.644, -0.644, 0.413);
      vec3 slab(vec3 p, float f, vec3 o1, vec3 lb2, vec3 lb3){
        vec3 q = p*f + uSeedV, q1 = R1*q;
        vec4 n2 = vnS(R2*q*2.3 + 7.1), n3 = vnS(R3*q*5.3 + 19.0);
        float v1 = wsVN3(q1), v2 = n2.w, v3 = n3.w, big = (v1 - wsVN3(q1 + o1))*LG, c2 = 2.0*v2 - 1.0, c3 = 2.0*v3 - 1.0;
        return vec3(v1*0.58 + v2*0.28 + v3*0.14, 0.5 + big + (v2 - 0.5)*C2 + (v3 - 0.5)*C3,
                    0.5 + big*BG - B2*c2*inversesqrt(c2*c2 + FE)*dot(n2.xyz, lb2) - B3*c3*inversesqrt(c3*c3 + FE)*dot(n3.xyz, lb3));
      }
      // (the farthest slab, seen through the two before it and the haze, is of the two larger sizes only: the density's shares 0.58 and 0.28 over their sum)
      vec3 slabFar(vec3 p, float f, vec3 o1, vec3 lb2){
        vec3 q = p*f + uSeedV, q1 = R1*q;
        vec4 n2 = vnS(R2*q*2.3 + 7.1);
        float v1 = wsVN3(q1), v2 = n2.w, big = (v1 - wsVN3(q1 + o1))*LG, c2 = 2.0*v2 - 1.0;
        return vec3(v1*0.674 + v2*0.326, 0.5 + big + (v2 - 0.5)*C2, 0.5 + big*BG - B2*c2*inversesqrt(c2*c2 + FE)*dot(n2.xyz, lb2));
      }
      // where the surge is, in plan (the wall's own law, copied from the part's SURGE_VERT with its numbers: whoever retunes it there retunes it
      // here): it is held in by the crater and pours out through the breach, a tongue that widens seaward
      float held(vec2 xz){
        vec2 c = xz - vec2(${CX.toFixed(1)}, ${CZ.toFixed(1)}); float al = dot(c, vec2(-0.741, 0.671)), pe = abs(dot(c, vec2(0.671, 0.741)));
        return max(1.0 - smoothstep(168.0, 204.0, length(c)), smoothstep(-30.0, 50.0, al)*(1.0 - smoothstep(66.0, 104.0 + max(al - 150.0, 0.0)*0.3, pe)));
      }
      void main(){
        vec3 d = normalize(vDir);
        if (uCover < 0.5) {
          if (uMist.x < 1e-5) discard;
          float fogA = mistShare(d*3000.0);
          if (fogA <= 0.0) discard;      // (no cut-off above nothing: the sky carries the law's share to the last thousandth, as a body does)
          gl_FragColor = vec4(uMistCol, fogA);
          return;
        }
        float inL = uCloud.z;
        if (inL < 1e-4) discard;
        float cy = cameraPosition.y, t = uCloud.y, top = uCloud.x;
        // where the sight line enters the body (t0, metres; nothing where the eye stands inside it). A line that meets no body within 125 m shows none of it
        vec2 a = cameraPosition.xz - uMistCyl.xy;
        float A = dot(d.xz, d.xz), B = dot(a, d.xz), aa = dot(a, a), C = aa - uMistCyl.z*uMistCyl.z, t0 = 0.0;
        if (C > 0.0) {
          float disc = B*B - A*C;
          if (A < 1e-6 || B >= 0.0 || disc <= 0.0) discard;
          t0 = (-B - sqrt(disc))/A;
          if (t0 >= 125.0) discard;
        }
        float wO = inL*(1.0 - smoothstep(85.0, 125.0, t0));
        // (a line that only grazes the body shows none of it: the cloud comes in over the first 30 m by which the line's nearest pass of the vent's
        // axis lies inside the front. Seen from outside this is the body's soft side; it eases out over the first 30 m the eye stands inside, as the part's does)
        float eo = sqrt(aa) - uMistCyl.z;      // how far the eye itself stands outside the body, in plan (m; negative inside): one number for the frame
        wO *= smoothstep(0.0, 30.0, uMistCyl.z - sqrt(max(aa - B*B/max(A, 1e-6), 0.0))*clamp(eo/30.0 + 1.0, 0.0, 1.0));
        // the three slabs' places on the sight line: 13, 32 and 78 m inside the body, never under the sea, never within 4 m of the eye
        float sea = d.y < -1e-3 ? 0.85*cy/(-d.y) : 1e6;
        float e1 = max(min(t0 + 13.0, sea), 4.0), e2 = max(min(t0 + 32.0, sea), 4.0), e3 = max(min(t0 + 78.0, sea), 4.0);
        // everything streams away from where the surge comes from, and rolls slowly upward
        vec3 drift = uFlow*(t*11.0) - vec3(0.0, t*1.3, 0.0);
        vec3 la = uLightV - d*dot(uLightV, d), o1 = R1*(la*0.42), lb2 = R2*la, lb3 = R3*la;
        vec3 s1 = slab(cameraPosition + d*e1 + drift, 1.0/10.0, o1, lb2, lb3), s2 = slab(cameraPosition + d*e2 + drift*0.8 + 31.0, 1.0/17.0, o1, lb2, lb3), s3 = slabFar(cameraPosition + d*e3 + drift*0.6 + 77.0, 1.0/31.0, o1, lb2);
        // how thick the ash is at each place: a wide soft run of the density, so a billow's edge is soft
        float h1 = smoothstep(0.38, 0.64, s1.x), h2 = smoothstep(0.38, 0.64, s2.x), h3 = smoothstep(0.38, 0.64, s3.x);
        // how deep each place lies inside the body (m, from the front inward): the cloud is only inside, and its face is in the sun
        float d1 = uMistCyl.z - length(a + d.xz*e1), d2 = uMistCyl.z - length(a + d.xz*e2), d3 = uMistCyl.z - length(a + d.xz*e3);
        // (and only where the surge is: in the crater and in the tongue through the breach, as the wall's own lobes are)
        // (THE FACE IS RAGGED INWARD ONLY: it comes in over 16 m of depth, the thin ash up to RAG (10 m) deeper than the thick. Nothing stands before the front)
        float i1 = smoothstep(0.0, 16.0, d1 - (1.0 - h1)*RAG)*held(cameraPosition.xz + d.xz*e1), i2 = smoothstep(0.0, 16.0, d2 - (1.0 - h2)*RAG)*held(cameraPosition.xz + d.xz*e2), i3 = smoothstep(0.0, 16.0, d3 - (1.0 - h3)*RAG)*held(cameraPosition.xz + d.xz*e3);
        // the cloud lies between the sea and the top of the layer (ragged), so it opens overhead as we climb out
        float y1 = cy + d.y*e1, y2 = cy + d.y*e2, y3 = cy + d.y*e3, tw = top*(0.8 + 0.5*h3), twa = tw*0.75, twb = tw*1.3;
        // (THE BODY'S SKIN, SEEN FROM OUTSIDE, IS DENSER THAN ITS INSIDE: over its first 46 m of depth, k, the gaps between a slab's billows are half
        // filled, so that the face is a wall of billows and not scattered puffs with dark gaps, and it wears the wall's lit tone (see the tones). It is
        // a FACE only for an eye that stands outside the body: kf, by eo, how far the eye itself is outside the body in plan (one number for the frame, not
        // the sight line's way to the body): all of it from 40 m outside, none for an eye inside. An eye inside sees the inside's billows from the first metre: open gaps, through which the trunks show, in the
        // inside's own light. Without kf the first seconds inside were one pale filled screen)
        // (and where k is 1 the body stands on the water; elsewhere the cloud thins toward the water over its lowest 5 m, so that from inside the
        // water's own ripples show under it)
        // (THE CLOUD IS A MEDIUM NEAR THE LENS: a billow thins to nothing as its place comes within 12 to 3 m of the lens's place)
        float kf = smoothstep(0.0, 40.0, eo), k1 = kf*clamp((46.0 - d1)/42.0, 0.0, 1.0), k2 = kf*clamp((46.0 - d2)/42.0, 0.0, 1.0), k3 = kf*clamp((46.0 - d3)/42.0, 0.0, 1.0);
        float a1 = (h1 + (1.0 - h1)*0.5*k1)*0.56*wO*i1*smoothstep(-0.6*k1, 5.0 - 4.2*k1, y1)*(1.0 - smoothstep(twa, twb, y1))*clamp((e1 - 3.0)/9.0, 0.0, 1.0);
        float a2 = (h2 + (1.0 - h2)*0.5*k2)*0.62*wO*i2*smoothstep(-0.6*k2, 5.0 - 4.2*k2, y2)*(1.0 - smoothstep(twa, twb, y2))*clamp((e2 - 3.0)/9.0, 0.0, 1.0);
        float a3 = (h3 + (1.0 - h3)*0.5*k3)*0.8*wO*i3*smoothstep(-0.6*k3, 5.0 - 4.2*k3, y3)*(1.0 - smoothstep(twa, twb, y3))*clamp((e3 - 3.0)/9.0, 0.0, 1.0);
        float hz = 0.15*wO*i2*(1.0 - smoothstep(top*0.7, top*1.4, y2));
        // THE LIGHT ON A BILLOW (0 shaded .. 1 lit): the slab's own light (form from the light's side and the crests of the smaller sizes, see
        // slab) smoothed over 1.6 of its own range: one wide soft run from the lit side to the shaded, never a steepened step
        // (ORDER 4: for an eye inside the body, by uIn, the light is the slab's z: the rolls lit from the light's side, smoothed over 1.55 of its range)
        float l1 = smoothstep(-0.3, 1.3, s1.y), l2 = smoothstep(-0.3, 1.3, s2.y), l3 = smoothstep(-0.3, 1.3, s3.y);
        if (uIn > 0.0) { l1 = mix(l1, smoothstep(-0.45, 1.1, s1.z), uIn); l2 = mix(l2, smoothstep(-0.45, 1.1, s2.z), uIn); l3 = mix(l3, smoothstep(-0.45, 1.1, s3.z), uIn); }
        // THE TONES, FROM THE LOOK'S OWN LIGHT (one law for every look): the surge's own colour with the design's warm lean, under the hero's
        // sun (its share by the light l on the billow: 0.15 + 0.47 l l inside, the shaded side lifted toward the mist's tone; 0.62 to 0.95 on the body's face seen from outside, as the wall's
        // lobes) and sky (0.4 of it, times 0.45 + 0.75 l)
        vec3 sunT = uSurgeCol*vec3(1.02, 1.0, 0.97)*uSunCol, skyT = uSurgeCol*vec3(1.02, 1.0, 0.97)*uSkyCol*0.4;
        // the lightning's glow soaks into the thick parts: a swell of each billow's own tone, at most 0.26 of it in any colour (before the front; inside uGlowA is nothing)
        vec3 glow = vec3(0.26, 0.15, 0.24)*(uGlowA.w*(0.9*exp(-(1.0 - dot(d, uGlowA.xyz))*5.0) + 0.1));
        vec3 c1 = (sunT*mix(0.15 + 0.47*l1*l1, 0.62 + 0.33*l1, k1) + skyT*(0.45 + 0.75*l1))*(1.0 + glow*(0.4 + 0.6*h1));
        vec3 c2 = (sunT*mix(0.15 + 0.47*l2*l2, 0.62 + 0.33*l2, k2) + skyT*(0.45 + 0.75*l2))*(1.0 + glow*(0.4 + 0.6*h2));
        vec3 c3 = (sunT*mix(0.15 + 0.47*l3*l3, 0.62 + 0.33*l3, k3) + skyT*(0.45 + 0.75*l3))*(1.0 + glow*(0.4 + 0.6*h3));
        // ORDER 4, INSIDE: the two glows' lobes (gk) and the bomb's pool (pk), each a bounded lift of the slab's tone toward the light's own tone, the billow's light kept in it
        float db = 1.0 - dot(d, uGlowB.xyz);
        vec3 gk = (uGlowP.w*exp(-(1.0 - dot(d, uGlowP.xyz))*GK) + uGlowQ.w*exp(-(1.0 - dot(d, uGlowQ.xyz))*GK))*vec3(1.2, 1.9, 2.6), pk = (uGlowB.w*uIn*exp(-db*PK))*vec3(1.5, 2.5, 2.0);
        gk = gk/(1.0 + gk); pk = pk/(1.0 + pk);
        vec3 glT = (sunT*1.3 + skyT*2.6)*vec3(0.97, 0.9, 1.0), poT = dot(sunT*0.62 + skyT*1.2, vec3(0.3333))*vec3(2.2, 0.85, 0.25) + vec3(0.04, 0.013, 0.003);
        c1 = mix(mix(c1, glT*(0.7 + 0.3*l1), gk.x), poT*(0.7 + 0.3*l1), pk.x); c2 = mix(mix(c2, glT*(0.7 + 0.3*l2), gk.y), poT*(0.7 + 0.3*l2), pk.y); c3 = mix(mix(c3, glT*(0.7 + 0.3*l3), gk.z), poT*(0.7 + 0.3*l3), pk.z);
        vec3 acc = c1*a1; float tr = 1.0 - a1;
        acc += tr*hz*uMistCol; tr *= 1.0 - hz;
        acc += tr*a2*c2; tr *= 1.0 - a2;
        // (the ember is a dull point inside grey cloud: it shows only where a billow really stands on that sight line, below the layer's
        // ragged top. Through a gap, or above the layer as we rise out of it, it lay over the white trunk and the sky as a pink stain)
        float gB = uGlowB.w*(exp(-db*420.0) + 0.1*exp(-db*45.0));
        gB *= smoothstep(0.25, 0.8, max(a2/max(0.62*wO, 1e-3), a3/max(0.8*wO, 1e-3)));
        acc += vec3(1.0, 0.33, 0.1)*gB*tr*wO; float ab = clamp(gB*0.7*wO, 0.0, 0.8); tr *= 1.0 - ab;
        acc += tr*a3*c3; tr *= 1.0 - a3;
        float Al = 1.0 - tr;
        if (Al < 0.003) discard;
        gl_FragColor = vec4(acc/Al, Al);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), mat); mesh.name = cover ? 'mistOver' : 'mistSky'; mesh.frustumCulled = false; mesh.renderOrder = cover ? 30 : 0;
  return mesh;
}

// ---------------------------------------------------------------- the trawler (26 m, merged boxes and a lofted hull, shaded flat)
function buildShip(LU, hullHex, houseHex) {
  const pos = [], colr = [];
  const quad = (a, b, c, d, col) => { for (const v of [a, b, c, a, c, d]) { pos.push(v[0], v[1], v[2]); colr.push(col[0], col[1], col[2], col[3]); } };
  const C = (hex, flag) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b, flag]; };
  const box = (cx, cy, cz, w, h, d, col, rz = 0) => {
    const cs = Math.cos(rz), sn = Math.sin(rz), P = [];
    for (let i = 0; i < 8; i++) { const x = (i & 1 ? 0.5 : -0.5) * w, y = (i & 2 ? 1 : 0) * h, z = (i & 4 ? 0.5 : -0.5) * d; P.push([cx + x * cs - y * sn, cy + x * sn + y * cs, cz + z]); }
    quad(P[0], P[1], P[3], P[2], col); quad(P[4], P[5], P[7], P[6], col); quad(P[0], P[1], P[5], P[4], col);
    quad(P[2], P[3], P[7], P[6], col); quad(P[0], P[2], P[6], P[4], col); quad(P[1], P[3], P[7], P[5], col);
  };
  const hull = C(hullHex, 1), deck = C('#6E7072', 2), white = C(houseHex, 0), dark = C('#1b1d20', 0), steel = C('#4a4f52', 1), lamp = C('#FF5A1F', 3), red = C('#5a1c14', 1);
  const NS = 14, beam = (t) => 3.5 * (t < 0.12 ? 0.82 + 0.18 * t / 0.12 : 1 - Math.pow((t - 0.12) / 0.88, 2.3)) + 0.06, sheer = (t) => 1.7 + 1.9 * t * t + 0.35 * (1 - t) * (1 - t);
  const sec = (t) => { const b = beam(t), s = sheer(t), z = lerp(-13, 13, t); return [[0, -1.7, z], [b * 0.7, -1.2, z], [b, 0.25, z], [b * 1.03, s, z], [b * 1.03, s + 0.75, z]]; };
  for (let i = 0; i < NS; i++) {
    const A = sec(i / NS), B = sec((i + 1) / NS);
    for (const sgn of [-1, 1]) {
      const f = (p) => [p[0] * sgn, p[1], p[2]];
      quad(f(A[0]), f(B[0]), f(B[1]), f(A[1]), red); quad(f(A[1]), f(B[1]), f(B[2]), f(A[2]), red);
      quad(f(A[2]), f(B[2]), f(B[3]), f(A[3]), hull); quad(f(A[3]), f(B[3]), f(B[4]), f(A[4]), hull);
    }
    quad([-A[3][0], A[3][1] + 0.12, A[3][2]], [A[3][0], A[3][1] + 0.12, A[3][2]], [B[3][0], B[3][1] + 0.12, B[3][2]], [-B[3][0], B[3][1] + 0.12, B[3][2]], deck);
  }
  const T = sec(0); quad([-T[4][0], T[4][1], -13], [T[4][0], T[4][1], -13], [T[1][0], T[1][1], -13], [-T[1][0], T[1][1], -13], hull);
  const d0 = sheer(0.25) + 0.1;
  box(0, d0, -6.2, 5.2, 2.5, 6.4, white); box(0, d0 + 2.5, -5.4, 4.3, 2.3, 4.2, white); box(0, d0 + 4.8, -5.4, 4.7, 0.18, 4.8, steel);
  box(0, d0 + 3.25, -3.27, 3.9, 0.85, 0.1, dark); box(2.17, d0 + 3.25, -5.2, 0.1, 0.85, 3.2, dark); box(-2.17, d0 + 3.25, -5.2, 0.1, 0.85, 3.2, dark);
  box(0, d0 + 0.9, -2.97, 0.9, 1.2, 0.08, dark); box(1.2, d0 + 4.9, -7.2, 0.9, 2.2, 0.9, dark); box(1.2, d0 + 7.1, -7.2, 1.0, 0.25, 1.0, steel);
  const m0 = sheer(0.55) + 0.1;
  box(0, m0, 1.5, 0.34, 11, 0.34, steel); box(0, m0 + 8.2, 1.5, 3.6, 0.16, 0.16, steel); box(0, m0 + 10.2, 1.5, 0.5, 0.5, 0.5, lamp);
  box(0.25, m0 + 0.8, 1.5, 0.22, 9.5, 0.22, steel, -0.95); box(-0.25, m0 + 0.8, 1.5, 0.22, 9.5, 0.22, steel, 0.95);
  box(0, m0 + 4.0, 1.5, 0.2, 6.0, 0.2, steel, 0); box(0, m0, 4.6, 2.4, 1.1, 1.6, steel); box(0, m0, -0.6, 1.8, 0.9, 1.3, dark);
  box(-2.6, sheer(0.12) + 0.1, -10.4, 0.25, 4.6, 0.25, steel); box(2.6, sheer(0.12) + 0.1, -10.4, 0.25, 4.6, 0.25, steel); box(0, sheer(0.12) + 4.6, -10.4, 5.5, 0.25, 0.25, steel);
  box(0, d0 + 5.0, -4.4, 0.45, 0.45, 0.45, lamp); box(0, sheer(0.93) + 0.2, 11.2, 0.25, 1.4, 0.25, steel);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aCol', new THREE.Float32BufferAttribute(colr, 4));
  geo.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    fog: false, side: THREE.DoubleSide,
    uniforms: { ...LU },
    vertexShader: /* glsl */`
      attribute vec4 aCol; varying vec4 vC; varying vec3 vL; varying vec3 vW;
      ${LAW_FOG_PARS_V}
      void main(){ vC = aCol; vL = position; vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      varying vec4 vC; varying vec3 vL; varying vec3 vW;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        vec3 dx = dFdx(vW), dy = dFdy(vW); vec3 N = cross(dx, dy); N = N/max(length(N), 1e-6);
        vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.0) N = -N;
        vec3 alb = vC.rgb; float flag = vC.a;
        float streak = smoothstep(0.5, 0.85, wsVN(vec2(vL.z*1.9 + vL.x*0.7, vL.y*0.28)))*smoothstep(0.3, 0.7, wsVN(vL.zy*vec2(0.4, 0.9) + 3.0));
        float isHull = step(0.5, flag)*step(flag, 1.5), isDeck = step(1.5, flag)*step(flag, 2.5);
        alb = mix(alb, vec3(0.19, 0.075, 0.03), streak*0.8*isHull);
        alb *= 1.0 - 0.3*isHull*(1.0 - smoothstep(0.2, 1.2, vL.y));                            // wet, dark boot-topping
        alb = mix(alb, vec3(0.2, 0.2, 0.205)*(0.7 + 0.6*wsVN(vL.xz*2.3)), isDeck*0.9);          // deck dusted with ash
        alb = mix(alb, vec3(0.19, 0.19, 0.195), (1.0 - isDeck)*smoothstep(0.6, 1.0, N.y)*0.5);  // ash settles on every top
        float ndl = dot(N, uSun);
        vec3 col = alb*(uSunCol*smoothstep(-0.02, 0.25, ndl)*(0.55 + 0.45*clamp(ndl, 0.0, 1.0)) + uSkyCol*(0.32 + 0.2*N.y));
        if (flag > 2.5) col = vec3(1.0, 0.354, 0.122)*4.2;
        gl_FragColor = vec4(col, 1.0);
        ${LAW_FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'trawler';
  return mesh;
}

// ---------------------------------------------------------------- the bomb that comes down to port on the run-in
// One draw, six quads, all a function of uEv.x (seconds since it struck, worked out from u): the ember falling down its
// line with a thread of steam behind it, the 12 m crown of white water it throws up, and three billows of steam that
// lean away downwind and thin out. Nothing of it exists before or after.
function buildSplash(LU) {
  const quad = new THREE.PlaneGeometry(2, 2); quad.deleteAttribute('normal'); quad.deleteAttribute('uv');
  const g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array([0, 0.3, 1, 0.7, 2, 0.1, 3, 0, 3, 0.5, 3, 1]), 2)); g.instanceCount = 6;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const mat = new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false,
    uniforms: { ...LU, uEv: { value: new THREE.Vector4(-99, 0, 0, 0) }, uAt: { value: new THREE.Vector3() }, uFrom: { value: new THREE.Vector3(0, 1, 0) }, uSeaT: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec2 aK; uniform vec4 uEv; uniform vec3 uAt, uFrom, uSun;
      varying vec4 vQ; varying vec3 vK;      // vQ: quad xy, kind, seed.  vK: alpha, phase, sun across
      ${LAW_FOG_PARS_V}
      void main(){
        float kind = aK.x, t = uEv.x, alpha = 0.0, ph = 0.0; vec3 c = uAt, axis = vec3(0.0, 1.0, 0.0); vec2 sz = vec2(0.001);
        if (kind < 0.5) {              // the bomb, 75 m/s down its line
          c = uAt + uFrom*(max(-t, 0.0)*75.0); sz = vec2(2.6); alpha = step(t, 0.0)*step(-3.4, t);
        } else if (kind < 1.5) {       // the thread of steam behind it: it hangs a second after the bomb has struck
          c = uAt + uFrom*(max(-t, 0.0)*75.0 + 27.0); sz = vec2(1.7, 27.0); axis = uFrom;
          alpha = step(-3.4, t)*(1.0 - smoothstep(0.0, 1.3, t))*0.5;
        } else if (kind < 2.5) {       // the crown of white water
          ph = clamp(t/2.8, 0.0, 1.0); float up = sin(min(ph*1.3, 1.0)*3.1416);
          sz = vec2(4.4 + 3.6*ph, 0.6 + 5.6*sqrt(max(up, 0.0))); c.y += sz.y*0.9;      // (its tallest fingers stand 12 m)
          alpha = step(0.0, t)*(1.0 - smoothstep(0.72, 1.0, ph));
        } else {                       // steam leaning away downwind
          ph = clamp((t - 1.5 - aK.y*1.3)/10.0, 0.0, 1.0); float rr = 3.5 + 12.0*sqrt(ph);      // (it rises out of the crown as the water falls back: sooner, it hid the crown)
          sz = vec2(rr, rr*1.1); c += vec3(0.8, 0.0, -0.6)*(ph*34.0 + aK.y*5.0) + vec3(0.0, 2.0 + rr*0.8 + ph*13.0, 0.0);
          alpha = smoothstep(0.0, 0.12, ph)*(1.0 - smoothstep(0.3, 1.0, ph))*0.55;
        }
        vec3 toCam = cameraPosition - c; float dist = length(toCam);
        vec3 right = cross(axis, toCam); right = right/max(length(right), 1e-3);
        if (kind > 0.5) alpha *= kind > 2.5 ? smoothstep(sz.x*1.2 + 10.0, sz.x*1.2 + 45.0, dist) : smoothstep(9.0, 24.0, dist);          // never a card at the lens: a billow of steam thins out as it nears, by its own size
        if (alpha < 0.002) sz = vec2(0.0);
        vec3 w = c + right*(position.x*sz.x) + axis*(position.y*sz.y);
        vQ = vec4(position.xy, kind, aK.y*31.0 + 3.0); vK = vec3(alpha, ph, dot(right, uSun));
        vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uSeaT;
      varying vec4 vQ; varying vec3 vK;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        vec2 q = vQ.xy; float kind = vQ.z, sd = vQ.w, a, yy = q.y*0.5 + 0.5;
        float lit = clamp(0.62 + 0.3*q.x*vK.z + 0.25*q.y, 0.0, 1.0);
        vec3 col = mix(vec3(0.2, 0.28, 0.42)*uSkyCol*1.35, vec3(0.9, 0.89, 0.85)*uSunCol, kind > 1.5 && kind < 2.5 ? smoothstep(0.25, 0.7, lit) : lit);
        if (kind < 0.5) {              // a glowing clast with a dark crust and a small soft halo
          float d = length(q), crust = smoothstep(0.45, 0.7, wsVN(q*3.1 + sd + uSeaT*2.0));
          a = 1.0 - smoothstep(0.42, 0.5, d);
          col = vec3(1.0, 0.354, 0.122)*mix(4.4, 0.6, crust*0.8);
          float halo = exp(-d*d*5.0)*0.5*(1.0 - smoothstep(0.7, 1.0, d));
          col = mix(vec3(1.0, 0.354, 0.122)*2.2, col, a); a = max(a, halo);
        } else if (kind < 1.5) {
          float n = wsVN(vec2(q.x*2.0 + sd, yy*9.0 - uSeaT*0.4));
          a = (1.0 - smoothstep(0.15, 0.95, abs(q.x) + (n - 0.5)*0.7))*smoothstep(0.0, 0.1, yy)*(1.0 - smoothstep(0.3, 1.0, yy))*(0.5 + 0.5*n);
        } else if (kind < 2.5) {       // a ragged crown: many fine fingers of spray that break into drops, over a low wide lobe of mist
          // (the water fans outward as it rises; each finger is solid at its root, torn into shreds toward its tip and drops beyond it)
          float xs = q.x/(0.5 + 0.8*yy);
          float f1 = wsVN(vec2(xs*4.0 + sd, 1.0 + sd)), f2 = wsVN(vec2(xs*10.0 - sd*3.0, 5.0 + sd)), f3 = wsVN(vec2(xs*23.0 + sd*7.0, 9.0 - sd));
          float top = max(mix(0.3, 1.0, smoothstep(0.2, 0.8, f1*0.5 + f2*0.32 + f3*0.18))*(1.0 - 0.6*min(xs*xs, 1.0)), 0.05), tt = yy/top;
          float tear = wsVN(vec2(xs*31.0 + sd, yy*15.0 - vK.y*9.0))*0.6 + wsVN(vec2(xs*67.0 - sd, yy*36.0 - vK.y*15.0))*0.4;
          float thr = mix(0.08, 0.7, smoothstep(0.3, 1.2, tt));
          float spray = smoothstep(thr, thr + 0.2, tear)*(1.0 - smoothstep(0.95, 1.4, tt))*(1.0 - smoothstep(0.55, 1.0, abs(xs)));
          float mist = (1.0 - smoothstep(0.0, 0.36, yy + (f2 - 0.5)*0.14))*(1.0 - smoothstep(0.35, 1.0, abs(q.x)))*0.5*(0.7 + 0.3*tear);
          a = min(max(spray*0.86, mist), 0.86);
        } else {                       // a round billow with an eroded rim
          float d = length(q) + (wsVN(q*2.3 + sd + vec2(0.0, -uSeaT*0.06)) - 0.5)*0.55 + (wsVN(q*5.5 - sd) - 0.5)*0.2;
          float body = wsVN(q*3.4 - sd*2.0 + vec2(0.0, -uSeaT*0.1));      // (thicker and thinner inside, with shaded hollows: a billow, not a disc)
          a = (1.0 - smoothstep(0.3, 0.85, d))*(0.6 + 0.4*smoothstep(0.2, 0.7, body));
          col *= 0.84 + 0.2*body;
        }
        a *= vK.x; if (kind > 0.5) a *= 1.0 - smoothstep(0.8, 1.0, max(abs(q.x), abs(q.y)));
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
        ${LAW_FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'portSplash'; mesh.frustumCulled = false; mesh.renderOrder = 5;      // (always in the scene: before and after its moment every quad is shrunk to nothing)
  return mesh;
}

// ---------------------------------------------------------------- bombs arcing across far overhead
// One draw. EVERY VOLLEY OF THE VENT THROWS ONE BOMB HIGH OVER THE BACK OF THE ISLAND (volley N of the eruption clock, one each
// `period` seconds; eight are in flight or just down at any time). It leaves the vent K, climbs inside the black trunk, comes out
// of its far flank, crosses the middle of the slot's far end at the top of its arc (uZone is the ring's centre: between uSpan.x
// and uSpan.y metres beyond it along the slot, once to twice the way from the ring to the roof braid, and between the ring's
// height and 2 uSpan.z metres under it, half the roof's height above the ring; the top of the arc falls there, give or take an
// eighth of the rise time), and comes down behind the white trunk into the sea beyond the cone. So a bomb is 8 degrees and
// more off the ring's bearing from anywhere on the climb, and 19 and more over the last 180 m of route (where the brief wants
// nothing within 10 degrees of the ring). True ballistics from K, its three numbers
// hashed from the volley's number and the world's own seed (fork 'skybombs'). Each is a glowing clast and the steam it has
// shed over its last 3.2 s, hanging where it was shed (a curved ribbon of ten segments). Nothing shows or hides them but the
// world: the trunks stand in front of the first third of each flight, and the look's haze and the surge's mist cut them BY THE ONE
// FOG LAW FOR THEIR OWN PLACE (LAW_FOG): the haze and the mist are cut out of a bomb's alpha AND painted on its colour, as the live
// version did with the scene's fog. The mist is a low layer and a bomb flies high over it: from the sea inside the surge the mist's
// share on the line up is a third to a half (cut and painted both, that leaves a quarter to four tenths of a bomb's own light over
// the sky behind; nearly none of one low over the layer), a tenth from 24 m up and nothing from the layer's top; the cloud's billows
// stand before them. SO FROM INSIDE THE SURGE THREE TO FIVE BOMBS CAN SHOW THROUGH THE BILLOWS' GAPS. (While the scene's fog cut
// them, by the cloud at the eye's place, there were none from inside the mist.)
function buildSkyBombs(LU, rng, period) {
  const NB = 8, rib = new THREE.PlaneGeometry(2, 1, 1, 10); rib.translate(0, 0.5, 0); rib.deleteAttribute('normal'); rib.deleteAttribute('uv');
  const g = new THREE.InstancedBufferGeometry(); g.index = rib.index; g.setAttribute('position', rib.attributes.position);
  const a = new Float32Array(NB * 2 * 2);
  for (let i = 0; i < NB; i++) for (let k = 0; k < 2; k++) { a[(i * 2 + k) * 2] = i; a[(i * 2 + k) * 2 + 1] = k; }
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(a, 2)); g.instanceCount = NB * 2; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const mat = new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...LU, uClockB: { value: 0 }, uPeriod: { value: period }, uSeedB: { value: rng.range(0, 100) }, uZone: { value: new THREE.Vector3() }, uSpan: { value: new THREE.Vector3(100, 200, 40) },
      uVentB: { value: new THREE.Vector3() }, uAlo: { value: new THREE.Vector3(0.741, 0, -0.671) }, uSeaT: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec2 aB; uniform float uClockB, uPeriod, uSeedB; uniform vec3 uZone, uSpan, uVentB, uAlo, uSun;      // aB: the volley slot it flies in, kind (0 clast, 1 steam)
      varying vec4 vQ; varying vec2 vK;      // vQ: quad xy, kind, seed.  vK: alpha, sun across
      ${LAW_FOG_PARS_V}
      ${WS_NOISE}
      // where the bomb thrown by volley N is s seconds after the volley (uAlo: along the slot, away from the breach)
      vec3 flight(float N, float s){
        vec2 k = vec2(N*1.371 + uSeedB*1.73, 3.7);
        float h1 = wsH12(k), h2 = wsH12(k + 19.19), h3 = wsH12(k + 41.7);
        vec3 z0 = uZone + uAlo*mix(uSpan.x, uSpan.y, h2) - vec3(0.0, 2.0*uSpan.z*h1, 0.0);
        float rise = max(z0.y - uVentB.y, 1.0), sc = sqrt(2.0*rise/9.81)*mix(0.88, 1.12, h3);
        vec3 v0 = vec3((z0.x - uVentB.x)/sc, rise/sc + 4.905*sc, (z0.z - uVentB.z)/sc);
        return uVentB + vec3(v0.x*s, v0.y*s - 4.905*s*s, v0.z*s);
      }
      void main(){
        float kind = aB.y, n = floor(uClockB/uPeriod), N = n - mod(n - aB.x, ${NB}.0), age = uClockB - N*uPeriod;
        float tau = clamp(position.y, 0.0, 1.0), alpha = smoothstep(0.4, 1.4, age);
        vec3 c = flight(N, age), wpos; vec2 q;
        if (kind < 0.5) {              // the clast: the same strip, squared up and turned to the eye
          vec3 toCam = cameraPosition - c; float dist = length(toCam);
          vec3 right = cross(vec3(0.0, 1.0, 0.0), toCam); right = right/max(length(right), 1e-3); vec3 up = cross(toCam, right); up = up/max(length(up), 1e-3);
          float sz = max(2.6, dist*0.0095); q = vec2(position.x, tau*2.0 - 1.0);
          alpha *= smoothstep(0.0, 12.0, c.y);
          if (alpha < 0.002) sz = 0.0;
          wpos = c + (right*q.x + up*q.y)*sz; vK = vec2(alpha, 0.0);
        } else {                       // the steam it has shed over the last 3.2 s: each point hangs where the bomb was, rising a little
          float ts = max(age - tau*3.2, 0.0), sa = age - ts;
          vec3 p = flight(N, ts) + vec3(0.0, 1.1*sa, 0.0), p0 = flight(N, max(ts - 0.12, 0.0)) + vec3(0.0, 1.1*(sa + 0.12), 0.0);
          vec3 T = p - p0; float tl = length(T); T = tl > 1e-3 ? T/tl : vec3(0.0, 1.0, 0.0);
          vec3 toCam = cameraPosition - p; float dist = length(toCam);
          vec3 side = cross(T, toCam); side = side/max(length(side), 1e-3);
          // (far off it is drawn wider than it is, and thinner in the same measure: a soft wisp, never a hairline)
          float wt = 1.4 + 3.6*(1.0 - exp(-sa/1.3)), w = max(wt, dist*0.008);
          alpha *= 0.62*mix(0.5, 1.0, wt/w)*smoothstep(0.0, 30.0, p.y)*(1.0 - smoothstep(0.9, 0.99, abs(dot(T, toCam/max(dist, 1e-3)))));      // (seen end-on it fades instead of folding to a sliver)
          if (alpha < 0.002) w = 0.0;
          q = vec2(position.x, 1.0 - 2.0*tau);
          wpos = p + side*(position.x*w); vK = vec2(alpha, dot(side, uSun));
        }
        vQ = vec4(q, kind, fract(N*0.618)*31.0 + 3.0);
        vec4 mvPosition = viewMatrix*vec4(wpos, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${LAW_FOG_V}
      }`,
    fragmentShader: /* glsl */`
      ${LIGHT_GLSL}
      uniform float uSeaT;
      varying vec4 vQ; varying vec2 vK;
      ${LAW_FOG_PARS_F}
      ${WS_NOISE}
      void main(){
        // (the across and along coordinates are clamped to their own range before anything is worked out from them)
        vec2 q = clamp(vQ.xy, -1.0, 1.0); float kind = vQ.z, sd = vQ.w, a; vec3 col;
        if (kind < 0.5) {              // a glowing clast with a dark crust and a small soft halo
          float d = length(q), crust = smoothstep(0.45, 0.7, wsVN(q*3.1 + sd + uSeaT*2.0));
          a = 1.0 - smoothstep(0.34, 0.44, d);
          col = vec3(1.0, 0.354, 0.122)*mix(4.6, 0.7, crust*0.8);
          float halo = exp(-d*d*5.0)*0.55*(1.0 - smoothstep(0.7, 1.0, d));
          col = mix(vec3(1.0, 0.354, 0.122)*2.4, col, a); a = max(a, halo);
        } else {                       // steam: a thread at the bomb, widening, torn and thinning behind it
          float yy = q.y*0.5 + 0.5, w = mix(0.95, 0.2, yy*yy);
          float n = wsVN(vec2(q.x*2.2 + sd, yy*11.0 + uSeaT*0.25))*0.6 + wsVN(vec2(q.x*5.0 - sd, yy*27.0 - uSeaT*0.4))*0.4;
          a = (1.0 - smoothstep(w*0.25, w, abs(q.x) + (n - 0.5)*0.6))*smoothstep(0.0, 0.3, yy)*(1.0 - smoothstep(0.93, 1.0, yy))*(0.45 + 0.55*n);
          float lit = clamp(0.6 + 0.35*q.x*vK.y, 0.0, 1.0);
          col = mix(vec3(0.2, 0.28, 0.42)*uSkyCol*1.35, vec3(0.9, 0.89, 0.85)*uSunCol, lit);
        }
        a *= vK.x;
        // the haze and the mist cut it: what they would have painted grey is taken out of the bomb instead (by the one fog law, as they paint it)
        { float cutHz = uSeaHaze.w*vLawDepth; a *= exp(-cutHz*cutHz)*(uMist.x > 1e-5 ? 1.0 - mistShare(vLawD) : 1.0); }
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
        ${LAW_FOG_F}
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'skyBombs'; mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'island-being-born',
  name: 'The Island Being Born',
  category: 'ocean',
  weirdness: 0.3,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1;
    // ---------------- seeded picks (every draw up front, so nothing later can reorder them)
    const r0 = rng(), r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng();
    const hour = vary.hour || 'any';
    const moodId = hour === 'night' ? 'night' : hour === 'golden' ? 'afternoon' : hour === 'dawn' ? 'morning' : hour === 'day' ? (r0 < 0.6 ? 'morning' : 'noon')
      : (r0 < 0.4 ? 'morning' : r0 < 0.6 ? 'noon' : r0 < 0.85 ? 'afternoon' : 'night');
    const M = MOODS[moodId];
    const wind = r1 < 0.25 ? 'light' : r1 < 0.5 ? 'strong' : r1 < 0.75 ? 'rainbow' : 'trade';
    const lean = wind === 'light' ? 12 : wind === 'strong' ? 40 : 25;
    const age = r2 < 0.3 ? 0.2 : 0.9;
    const tropic = r3 < 0.5;
    const shipKind = r4 < 0.45 ? 'trawler' : r4 < 0.75 ? 'research' : 'none';
    const rare = !!vary.rare;
    const el = M.el * Math.PI / 180;
    const keyDir = new THREE.Vector3(Math.sin(SUN_AZ) * Math.cos(el), Math.sin(el), -Math.cos(SUN_AZ) * Math.cos(el)).normalize();

    // ---------------- sky, light, haze
    const scene = new THREE.Scene();
    const skyOpts = { rng, preset: M.preset, clouds: false, clouds2: false };
    if (M.night) Object.assign(skyOpts, { bodyOverrides: { 0: { elevation: M.el, azimuth: -132.2, size: 2.3, phase: 1 } }, bake: true, renderer: ctx.renderer });
    else Object.assign(skyOpts, { zenith: M.zenith, horizon: M.horizon, sunElevation: M.el, sunAzimuth: -132.2, lightColor: M.sun });
    if (moodId === 'afternoon') Object.assign(skyOpts, { scatterColor: '#FFE6CC', scatter: 0.1, scatterHigh: 0.03 });
    await ctx.yield();
    const sky = makeSky(skyOpts); scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.4 }); scene.add(rig.object);
    const fogBase = sky.colorAt(new THREE.Vector3(0.5, 0.03, -0.85).normalize()).clone();
    const fog = new THREE.FogExp2(fogBase.clone(), M.haze); scene.fog = fog;
    await ctx.yield();

    // ---------------- HERO: the island, placed at C with no rotation (local = world - C)
    const heroSun = M.heroSun || M.sun;
    const hero = await buildHero(ctx, { sunDir: keyDir.clone(), sunColor: heroSun, skyColor: M.amb, sunIntensity: M.sunI, skyIntensity: M.ambI, night: M.night, lean, age, washY: 0.9 });
    hero.setLight({ sunDir: keyDir, sunColor: heroSun, skyColor: M.amb, sunIntensity: M.sunI, skyIntensity: M.ambI });
    hero.setHaze(fogBase, M.haze);
    // THE MIST'S ONE TONE, FROM THE LOOK'S OWN LIGHT (one law for every look; the live version took a grey times a number from the table
    // of looks): the surge's own colour (the hero's uSurgeCol, the wall's) with the design's warm lean, under the look's sun (0.3 of it)
    // and sky (0.4 of it): about what a billow of the cover veil wears at two thirds of its light (see buildVeil, the tones). The light is the
    // look's own as the hero has it here at the start (the night's lift of the sky above the layer, in update, is not in it). So the
    // mist is warm grey by day, a mauve grey in the evening (the evening sky's violet with a share of the low sun's red: only a billow's
    // lit side is warm then), and dark with the night's own blue by moonlight
    const surgeCol = hero.uniforms.uSurgeCol.value.clone().multiply(new THREE.Color(1.02, 1, 0.97)).multiply(hero.uniforms.uSunCol.value.clone().multiplyScalar(0.3).add(hero.uniforms.uSkyCol.value.clone().multiplyScalar(0.4)));
    hero.object.position.set(CX, 0, CZ); scene.add(hero.object); hero.object.updateMatrixWorld(true);
    await ctx.yield();

    // ---------------- PATH: the hero's fly-through line (run-in, round the left horn, the breach, the 58 degree climb)
    const pts = hero.anchors.flyThrough.map((p) => new THREE.Vector3(p.x + CX, p.y + (p.y < 10 ? 0.4 : 0), p.z + CZ));
    const path = makePath(pts);
    // run-in a little brisk, the held breath in the breach at a third of the speed, the climb fast, the approach calm
    const pace = (u) => 1.05 - 0.68 * smoothstep(0.38, 0.47, u) * (1 - smoothstep(0.55, 0.64, u)) + 0.55 * smoothstep(0.58, 0.68, u) * (1 - smoothstep(0.84, 0.92, u));
    const Kw = hero.anchors.ventK.clone().add(new THREE.Vector3(CX, 0, CZ)), Ww = hero.anchors.ventW.clone().add(new THREE.Vector3(CX, 0, CZ));
    const jets = hero.anchors.jetsMid.clone().add(new THREE.Vector3(CX, 0, CZ));
    // THE DESIGN'S SECONDS, taken by u: second S of the journey is the place the flight has reached after the share S / DURATION of
    // its time at this pace (the engine clamps the pace to 0.35..2.5 and scales it to the duration)
    const paceAcc = new Float32Array(2001); for (let i = 0; i < 2000; i++) paceAcc[i + 1] = paceAcc[i] + 1 / clamp(pace((i + 0.5) / 2000), 0.35, 2.5);
    const uAtSecond = (S) => { const want = S / DURATION * paceAcc[2000]; let i = 0; while (i < 2000 && paceAcc[i + 1] < want) i++; return (i + (want - paceAcc[i]) / (paceAcc[i + 1] - paceAcc[i])) / 2000; };
    // (the same table read the other way: the second of the journey at which the flight is at u. THE ONE MAP between the brief's
    // seconds and places; the eruption's clock is the hero's clockAtBriefTime of it)
    const secondAtU = (u) => { const x = clamp(u, 0, 1) * 2000, i = Math.min(1999, Math.floor(x)); return DURATION * (paceAcc[i] + (paceAcc[i + 1] - paceAcc[i]) * (x - i)) / paceAcc[2000]; };
    const clockAtU = (u) => hero.timeline.clockAtBriefTime(secondAtU(u));
    const SURGE_U = uAtSecond(T_SURGE_IN), U_OUT = uAtSecond(T_SURGE_OUT), U_APPROACH = uAtSecond(T_APPROACH);
    // the surge front must reach the camera at SURGE_U: shift the eruption clock by a second or two
    const pa = path.pointAt(SURGE_U), needTs = (Math.hypot(pa.x - Kw.x, pa.z - Kw.z) - hero.timeline.surgeR0) / hero.timeline.surgeSpeed;
    let surgeOff = (hero.timeline.surgeDelay + needTs - clockAtU(SURGE_U)) % 12; surgeOff = ((surgeOff + 18) % 12) - 6;
    const S0 = clockAtU(SURGE_U) + surgeOff - needTs;      // when the scripted surge starts (script clock)
    // ORDER 5, THE CLOUD ALONG THE ROUTE, for the inside glows (see update): cloudIn = the cloud as the glows read it at an eye's place
    // (update's inS times the cloud's own top: gap = the eye's depth behind the front, ts = the surge's age, y = the eye's height);
    // GS = that at the route's own point for every fiftieth of a second of the design's journey, the front standing where it stands
    // when the flight is there; cloudAtSecond reads it. A table of the route and the scripted surge alone: no eye, no clock, no seed.
    const cloudIn = (gap, ts, y) => Math.min(1, 2 * mistAt(gap) * Math.sqrt((ts >= -0.05 ? 1 : 0) * smoothstep(0, 0.9, ts) * (1 - smoothstep(190, 330, gap))) / RHO_PEAK) * (1 - smoothstep(MIST_TOP - 22, MIST_TOP + 3, y)) * (1 - smoothstep(MIST_TOP - 33, MIST_TOP - 9, y));
    const GS_FROM = T_SURGE_IN - 1, GS = new Float32Array((T_SURGE_OUT + 3 - GS_FROM) * 50 + 1);
    { const gp = new THREE.Vector3(); let i = 0;
      for (let j = 0; j < GS.length; j++) { const want = (GS_FROM + j / 50) / DURATION * paceAcc[2000]; while (i < 1999 && paceAcc[i + 1] < want) i++;
        const uu = clamp((i + (want - paceAcc[i]) / (paceAcc[i + 1] - paceAcc[i])) / 2000, 0, 1), ts = clockAtU(uu) + surgeOff - S0; path.pointAt(uu, gp);
        GS[j] = cloudIn(hero.timeline.surgeR0 + hero.timeline.surgeSpeed * Math.max(ts, 0) - Math.hypot(gp.x - Kw.x, gp.z - Kw.z), ts, gp.y); } }
    const cloudAtSecond = (sec) => { const x = (sec - GS_FROM) * 50, j = Math.floor(x); return x > 0 && j < GS.length - 1 ? GS[j] + (GS[j + 1] - GS[j]) * (x - j) : 0; };

    // ---------------- the sea: a faked depth map gives the jade stain its ragged edge and the cone its swash
    const DN = 224, DSPAN = 1120, DX0 = CX - DSPAN / 2, DZ0 = CZ - DSPAN / 2, DS = DSPAN / DN, depth = new Float32Array(DN * DN), noise = ctx.noise;
    for (let j = 0; j < DN; j++) {
      for (let i = 0; i < DN; i++) {
        const lx = DX0 + (i + 0.5) * DS - CX, lz = DZ0 + (j + 0.5) * DS - CZ, r = Math.hypot(lx, lz);
        const al = lx * 0.8 - lz * 0.6, ac = lx * 0.6 + lz * 0.8;                 // along and across the wind
        // the stain's edge: ragged, drawn out downwind in streaks, and feathered (the water deepens from 2.8 m to 7.5 m, where
        // the jade has gone, over 90 m, then on down: no step for the map's 5 m cells to show as stairs)
        const edge = 468 + 62 * noise.fbm2(ac * 0.012 + 5, al * 0.003, 3) + 13 * noise.n2(ac * 0.05, al * 0.012) + 7.5 * noise.n2(ac * 0.085 + 40, al * 0.0055) + Math.max(0, al) * 0.1;
        // (the jade melts into the cobalt through 90 m of soft streaks: seen from the climb a sharper margin was a spiky cut-out)
        let d = 2.8 + 4.7 * smoothstep(edge - 60, edge + 30, r) + 52 * smoothstep(edge + 26, edge + 70, r);
        if (r < 430) d = Math.min(d, -hero.heightAt(lx, lz) * 0.9);
        depth[j * DN + i] = d;
      }
      await ctx.yield();
    }
    // (the kit bakes its depth texture by asking for the centre of each of these same cells, so the cell's own value is the
    // answer: 50,000 calls inside one kit step, kept as cheap as a lookup can be)
    const depthAt = (x, z) => {
      const i = Math.floor((x - DX0) / DS), j = Math.floor((z - DZ0) / DS);
      return depth[(j < 0 ? 0 : j >= DN ? DN - 1 : j) * DN + (i < 0 ? 0 : i >= DN ? DN - 1 : i)];
    };
    const shipX = 30, shipZ = -212, bowDX = -0.8, bowDZ = 0.6;
    await ctx.yield();
    const ocean = Water.makeOcean({
      rng: rng.fork('sea'), sky, preset: 'swell', height: 1.3, wavelength: 70, contrast: 0.42, foam: wind === 'strong' ? 0.42 : 0.18, deep: M.deep, shallowColor: M.shallow, windAngle: Math.atan2(-0.6, 0.8),
      depthAt,
      depthRect: [DX0, DZ0, DX0 + DSPAN, DZ0 + DSPAN], depthRes: DN, shoalDepth: 7, shoalWidth: 30,
      shallows: shipKind === 'none' ? [] : [{ x: shipX + bowDX * 11, z: shipZ + bowDZ * 11, radius: 2, falloff: 10 }],
      scatter: '#479C6E',
      ...(M.night ? {} : { zenith: '#33588F' }),            // the sea mirrors a calmer blue than the sky shows: cobalt with navy troughs, not electric
    });
    scene.add(ocean.object);
    // under the surge the sea itself turns ash grey (its three body colours are eased toward these in update)
    const seaU = ocean.uniforms, seaBase = [seaU.uDeep.value.clone(), seaU.uShallowColor.value.clone(), seaU.uScatter.value.clone()];
    const seaAsh = [new THREE.Color('#3b3d3e').multiplyScalar(M.surge), new THREE.Color('#77797a').multiplyScalar(M.surge), new THREE.Color('#8a8b8a').multiplyScalar(M.surge)];
    // THE SEA TAKES THE SURGE'S MIST BY THE ONE LAW OF A SIGHT LINE, as the hero's bodies and the sky do (mistShare, per pixel, for the
    // water's own point), and no longer from scene.fog, which goes by where the eye stands. It is done in the world's own sea and the kit
    // is not touched: the one statement of the kit ocean's fragment text that lays the kit's fog on the water is replaced, in this
    // world's own copy of that text, by one that lays the same distance haze (the look's own: fogBase and M.haze, which is all that
    // scene.fog is while no surge is out) and then, while a surge is out, the mist by the law. If the kit's text ever lacks that
    // statement, nothing is replaced (seaLaw) and the sea keeps the kit's fog, which still carries the surge's share by the eye's place
    // for the kit's other things (see update)
    const SEA_FOG = 'gl_FragColor.rgb = mix(col, mix(fogColor, hz, hf), kitFog());', seaLaw = ocean.material.fragmentShader.includes(SEA_FOG);
    const seaHaze = { value: new THREE.Vector4(fogBase.r, fogBase.g, fogBase.b, M.haze) };
    // ORDER 4, THE WHITENED SEA UNDER THE LENS. Live's face is not flat by count (lightest against darkest twentieth of a patch 5 to 40 m
    // from the eye: 0.27 to 0.32 of display value), but it is dark and blue where the eye looks down on it (middle tone 0.30 at 5 m) under
    // a warm grey cloud. So, where the cloud stands at the eye (uSeaIn = inS of update: exactly nothing outside the stay, and the branch is
    // then not entered) and the water lies under the mist's own place (24 m in from the rim of the mist's round, uMistCyl),
    // the face's own light and shade are KEPT and whitened: its hue drawn 0.6 of the way to the mist's own, its
    // light lifted by a quarter off the foam, its light and shade spread about a middle tone (0.4 of the mist's brightness) by the power
    // 1.2, and 0.04 of the mist's tone laid on as ash. The kit's ripples and foam lace stay as they are and read the plainer for it; the
    // mist is not thinned for it (the one law follows in the next statement, untouched). No lookup more; nothing reads the lens.
    const seaIn = { value: 0 };
    const seaAshed = seaLaw && ocean.material.fragmentShader.includes('float fa = ');
    const SEA_ASH = !seaAshed ? '' : /* glsl */`if (uSeaIn > 0.0) {
      float sIn = uSeaIn*smoothstep(0.0, 24.0, uMistCyl.z - length(vXZ - uMistCyl.xy));
      float sL = dot(col, vec3(0.2126, 0.7152, 0.0722)), sM = max(dot(uMistCol, vec3(0.2126, 0.7152, 0.0722)), 0.02);
      col = mix(col, uMistCol*(sL/sM), 0.6*sIn)*((1.0 + 0.25*(1.0 - fa)*sIn)*pow(clamp(sL/(sM*0.4), 0.25, 4.0), 0.2*sIn)) + uMistCol*(0.04*(1.0 - fa)*sIn);
    }
    `;
    if (seaLaw) {
      ocean.material.fragmentShader = 'uniform vec4 uSeaHaze; uniform float uSeaIn;' + MIST_LAW + ocean.material.fragmentShader.replace(SEA_FOG, SEA_ASH + 'float seaHz = uSeaHaze.w*vFogDepth; gl_FragColor.rgb = mix(col, mix(uSeaHaze.rgb, hz, hf), 1.0 - exp(-seaHz*seaHz)); if (uMist.x > 1e-5) gl_FragColor.rgb = mix(gl_FragColor.rgb, uMistCol, mistShare(vWorld - cameraPosition));');
      Object.assign(ocean.material.uniforms, { uMist: hero.uniforms.uMist, uMistCyl: hero.uniforms.uMistCyl, uMistCol: hero.uniforms.uMistCol, uSeaHaze: seaHaze, uSeaIn: seaIn });
    }
    await ctx.yield();

    // ---------------- pumice: real stones round the lens, the raft sheet beyond
    const seaCam = new THREE.Vector2();
    const SU = seaUniforms(ocean, seaCam);
    const LU = { uSun: { value: keyDir }, uSunCol: { value: new THREE.Color(M.sun).multiplyScalar(M.sunI) }, uSkyCol: { value: new THREE.Color(M.amb).multiplyScalar(M.ambI) } };
    // WHAT LIES ON THE SEA OR STANDS IN IT TAKES THE SEA'S FOG (LAW_FOG, at MIST_LAW): every material of this world's own is handed, with its
    // light, the look's distance haze and the hero's own mist uniforms, the very objects the sea's text reads. (Should the kit's sea ever
    // keep the kit's fog, seaLaw false, they keep it too: no mist by the law, and the haze follows scene.fog in update)
    Object.assign(LU, { uSeaHaze: seaHaze, uMist: seaLaw ? hero.uniforms.uMist : { value: new THREE.Vector4(0, MIST_TOP, 0, 0) }, uMistCyl: hero.uniforms.uMistCyl, uMistCol: hero.uniforms.uMistCol });
    const raftT = { value: (shipKind === 'none' ? 0.36 : 0.4) - (density - 1) * 0.15 };
    const stones = await buildStones(ctx, rng.fork('stones'), Math.round(1800 * detail), SU, LU, raftT, path); scene.add(stones);
    await ctx.yield();
    const raft = buildRaft(SU, LU, raftT, { uAmp: seaU.uAmp, uContrast: seaU.uContrast }, stones.children.slice(0, 5)); scene.add(raft);      // (handed the sea's own measure of its swell and the five real stone meshes, to read their build and numbers: the sheet deals the same raft on the same sea)
    await ctx.yield();
    scene.add(buildOchre(rng.fork('ochre'), SU, LU));
    await ctx.yield();

    // ---------------- the ship standing off (trawler or research vessel), hove-to, bow to the swell
    let ship = null, lamps = null;
    const lampL = [new THREE.Vector3(0, 12.9, 1.5), new THREE.Vector3(0, 7.35, -4.4)], lampW = new THREE.Vector3();
    if (shipKind !== 'none') {
      ship = buildShip(LU, shipKind === 'trawler' ? '#1f4a36' : '#c8ccd0', shipKind === 'trawler' ? '#e6e4dc' : '#d8742a');
      ship.rotation.order = 'YXZ'; ship.rotation.y = Math.atan2(bowDX, bowDZ); ship.position.set(shipX, 0, shipZ); scene.add(ship);
      lamps = fx.makeGlows({ rng: rng.fork('lamps'), positions: [[shipX, 13, shipZ], [shipX, 7.4, shipZ]], color: '#FF5A1F', size: 2.4, intensity: 2.2 });
      scene.add(lamps.object);
    }
    await ctx.yield();

    // ---------------- birds
    await ctx.yield();
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    const ternCol = tropic ? { body: '#f4f1e8', belly: '#ffffff', wingC: '#4a3c2c', trail: '#32281e', tip: '#16130f', beak: '#9fc0d8', head: '#f1e9d0' }
      : { body: '#f1f2f0', belly: '#ffffff', wingC: '#c2c8d0', trail: '#dfe3e8', tip: '#30333a', beak: '#e4572a', head: '#15161a' };
    await ctx.yield();
    // the lens terns: 6 m ahead and a little to port (the jets stand to starboard), hovering and dipping at 11-16% of frame height
    fauna.add(F.makeFlock({ rng: rng.fork('terns'), species: 'gulls', count: 14, size: tropic ? 1.1 : 0.92, speed: 20, flap: 4.2, glide: 0.25, spread: [8, 2.2, 2.6], wander: [1.8, 1.5, 1.2, 0.6], ...ternCol,
      along: { path, side: -2.5, up: 1.1, lead: 5.8, from: 0.14, to: 0.43, drift: 1.2 } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: rng.fork('shear'), species: 'gulls', count: 16, size: 0.85, glide: 0.92, flap: 3, spread: [16, 0.7, 22], wander: [3, 0.5, 3, 0.3],
      body: '#3a3028', belly: '#f2f0ea', wingC: '#40362c', trail: '#2e261f', tip: '#1c1814', beak: '#3a3a3a', head: '#3a3028', along: { path, side: -13, up: -1.2, lead: 30, from: 0, to: 0.46, drift: 6 } }));
    await ctx.yield();
    // the far line of gulls wheels on the world's clock, 55 m round [-45, 13, -350]; in every world the route passes within its reach.
    // It keeps off the lens by place: its roam written out (the preset's: 7.5 m along world x, 2.5 m up and down, 4 m along world z),
    // its dealt places held at 3 scatters (maxSigma) and keepClear with the route, which lays its course so that no body, anywhere
    // its roam can take it, comes within 2.5 m of the flown line (2.0 m of clear air and 0.5 m over: the lens stands 0.45 m off the
    // line's first point at the crossing). The loop is lifted bodily, never lowered (up: it flies 13 m over the sea): by 14.7 m in
    // the median world, 2.7 m at least, 24.5 m at most
    fauna.add(F.makeFlock({ rng: rng.fork('line'), species: 'gulls', count: Math.round(20 * density), size: 0.8, ...ternCol, center: [-45, 13, -350], radius: 55,
      wander: [5, 2.5, 4, 0.35], maxSigma: 3, keepClear: { path, dist: 2.5, up: true, step: 2 } }));
    await ctx.yield();
    let fu = 0.7; for (let i = 0; i <= 100; i++) { const uu = 0.55 + i * 0.004; if (path.pointAt(uu).y >= 235) { fu = uu; break; } }
    const fc = path.pointAt(fu);
    // frigatebirds: black, lit by the scene's own light like every other bird; six wheel in the slot's updraft
    const frig = { body: '#17171c', belly: '#1e1e24', wingC: '#15151a', trail: '#101014', tip: '#0c0c10', beak: '#8a8a90', head: '#17171c', tailC: '#121216' };
    fauna.add(F.makeFlock({ rng: rng.fork('frig'), species: 'eagles', count: 6, size: 1.2, soarRadius: 9, soarLift: 4, spread: [12, 16, 12], center: [fc.x - 0.671 * 26, 290, fc.z - 0.741 * 26], radius: 5, height: 0, ...frig }));
    await ctx.yield();
    // the three that escort the climb: long narrow wings, gliding, 24 m ahead and below the line, so they are seen against the
    // blue of the slot, 16 degrees under the line to the portal. They leave the line where their station, 24 m ahead of the eye,
    // comes to the brief's last 120 m before the ring (the eye is then APPROACH_M + 24 = 144 m of route from the ring)
    fauna.add(F.makeFlock({ rng: rng.fork('frig2'), species: 'gulls', count: 3, size: 2.5, glide: 0.97, flap: 1.3, spread: [3, 3, 7], wander: [1.2, 1.2, 1.6, 0.35], ...frig,
      along: { path, side: 1.5, up: -9, lead: 24, from: 0.655, to: 1 - (APPROACH_M + 24) / path.length, drift: 2 } }));
    await ctx.yield();

    // ---------------- ash in the air, the rainbow in the fallout, the rare waterspout, the surge veil
    const ash = fx.makeParticles({ rng: rng.fork('ash'), preset: 'ash', count: Math.round(1500 * detail) }); scene.add(ash.object);
    await ctx.yield();
    let rainbow = null;
    if (wind === 'rainbow' && !M.night) { rainbow = fx.makeRainbow({ sunDir: keyDir, intensity: 0.26 }); scene.add(rainbow.object); }
    let spout = null;
    if (rare) {
      spout = fx.makeDustDevil({ rng: rng.fork('spout'), position: [Ww.x, 0, Ww.z], height: 300, radius: [7, 42], size: [40, 110], color: '#d8d5cc', colorTop: '#f1eee6', shadowColor: '#7F93AD', opacity: 0.5, debrisSize: 1.2, sunDir: keyDir });
      spout.object.visible = false; scene.add(spout.object);
    }
    // THE BOMB TO PORT. Its strike is a PLACE: 45 m to port of the point the route has reached at the brief's 15 s (uSplash),
    // square off the route's heading there. It comes from the vent's side, 50 degrees up, and falls so that it lands as the eye
    // comes abeam of it: its clock is the journey's own second at u, less 15 (secondAtU). Where the frame cuts it, it cuts it.
    const splash = buildSplash(LU); scene.add(splash);
    const uSplash = uAtSecond(T_SPLASH), splashAt = splash.material.uniforms.uAt.value, splashFrom = splash.material.uniforms.uFrom.value;
    { const sp = path.pointAt(uSplash), dS = uSplash * path.length, ha = path.posAtDist(dS - 2), hb = path.posAtDist(dS + 2), hx = hb.x - ha.x, hz = hb.z - ha.z, hl = Math.hypot(hx, hz) || 1;
      splashAt.set(sp.x + hz / hl * SPLASH_PORT, 0, sp.z - hx / hl * SPLASH_PORT);
      const kx = Kw.x - splashAt.x, kz = Kw.z - splashAt.z, kl = Math.hypot(kx, kz) || 1;
      splashFrom.set(kx / kl * 0.64, 0.77, kz / kl * 0.64).normalize(); }
    const SPLASH_FALL = 3.4;      // seconds the bomb is in the air before it strikes (see buildSplash: 75 m/s down its line)
    // the surge's mist: the mist over the sky (the hero's own fog law and its own uniforms), the cloud itself, and ash blown past by the blast
    const flow = new THREE.Vector3(Kw.x - pa.x, 0, Kw.z - pa.z).normalize();          // toward where the surge comes from
    const MU = { uCloud: { value: new THREE.Vector3(MIST_TOP, 0, 0) }, uFlow: { value: flow }, uGlowA: { value: new THREE.Vector4(0, 1, 0, 0) }, uGlowB: { value: new THREE.Vector4(0, 1, 0, 0) }, uGlowP: { value: new THREE.Vector4(0, 1, 0, 0) }, uGlowQ: { value: new THREE.Vector4(0, 1, 0, 0) }, uIn: { value: 0 },
      uSeedV: { value: new THREE.Vector3(r1 * 97, r2 * 61, r3 * 83) }, uLightV: { value: keyDir.clone().add(new THREE.Vector3(0, 1, 0)).normalize() },      // (the cloud is different on every visit)
      uMist: hero.uniforms.uMist, uMistCyl: hero.uniforms.uMistCyl, uMistCol: hero.uniforms.uMistCol, uSunCol: hero.uniforms.uSunCol, uSkyCol: hero.uniforms.uSkyCol, uSurgeCol: hero.uniforms.uSurgeCol };
    scene.add(buildVeil(MU, false), buildVeil(MU, true));
    await ctx.yield();
    // ASH BLOWN PAST (the design's "ash streaks past"): some 280 soft strokes of the cloud's own tones, each a soft-edged oval 0.13 to
    // 0.3 m wide and about 1.5 m long (1.8 m at the fastest), drawn out along its own flight (the surge's own 30 m/s away from the vent; 0.05 s of it), drawn
    // after the cloud so that they pass in front of its billows. ORDER 4: THEY MUST READ AS STROKES: eval9g's were about 1 m
    // long, of three tones close to the cloud's own and never more than 0.3 opaque, and they read as specks; these are half as long
    // again, up to 0.6 opaque (update), and their three tones run from the cloud's deep shade to its lit side (the surge's colour with
    // the warm lean, under the look's sky and 0.04, 0.16 and 0.72 of its sun), so most stand dark against the lit billows and some
    // light against the shaded: the look's own light by day, evening and night. NOT HAIRLINES (the version before eval9g: 0.04 to
    // 0.13 m wide, 3.3 m long, scratches). A MEDIUM, NO PART OF ONE SHOWS WITHIN 2 M OF THE LENS: the kit fades each to nothing as its
    // CENTRE comes from 8 m to 3 m of the lens (near), and no part of a stroke is farther from its centre than 0.92 m (half of the
    // longest, 1.8 m at the fastest flight of 36 m/s, with half of the widest across it), so nothing of one is drawn nearer than 2.08 m
    const fleck = (sun) => hero.uniforms.uSurgeCol.value.clone().multiply(new THREE.Color(1.02, 1, 0.97)).multiply(hero.uniforms.uSunCol.value.clone().multiplyScalar(sun).add(hero.uniforms.uSkyCol.value.clone().multiplyScalar(0.4)));
    const streaks = fx.makeParticles({ rng: rng.fork('streaks'), preset: 'ash', mode: 'streak', shape: 'disc', count: Math.round(280 * detail), box: [44, 26, 44],
      velocity: [-flow.x * 30, -0.6, -flow.z * 30], velocityRandom: [9, 3, 9], turbulence: [0.6, 0.3, 0.8], size: [0.13, 0.3], stretch: 0.05, core: 0,
      colors: [fleck(0.04), fleck(0.16), fleck(0.72)], intensity: 1, opacity: 1, additive: 0, near: [3, 8], renderOrder: 31 });
    streaks.setOpacity(0); scene.add(streaks.object);
    // six more terns work the water where the eye rests from the jade line on (the jets pull the gaze to starboard): white wings at 7 m against the black jets
    fauna.add(F.makeFlock({ rng: rng.fork('terns2'), species: 'gulls', count: 6, size: tropic ? 1.1 : 0.92, speed: 20, flap: 4.2, glide: 0.25, spread: [5, 1.8, 2.4], wander: [1.6, 1.3, 1.2, 0.6], ...ternCol,
      along: { path, side: 3.2, up: 0.8, lead: 7.4, from: 0.19, to: 0.42, drift: 1 } }));
    await ctx.yield();
    // BOMBS ARCING ACROSS FAR OVERHEAD (see buildSkyBombs): thrown by the vent's volleys; where they cross comes from the ring, the roof braid and the vent
    const portalW = hero.anchors.portalSeat.position.clone().add(new THREE.Vector3(CX, 0, CZ)), roofW = hero.anchors.roof.clone().add(new THREE.Vector3(CX, 0, CZ));
    const skyBombs = buildSkyBombs(LU, rng.fork('skybombs'), hero.timeline.period); scene.add(skyBombs);
    { const bu = skyBombs.material.uniforms, run = Math.hypot(roofW.x - portalW.x, roofW.z - portalW.z);
      bu.uZone.value.copy(portalW); bu.uSpan.value.set(run, 2 * run, (roofW.y - portalW.y) / 4);
      bu.uVentB.value.copy(Kw); bu.uAlo.value.set(roofW.x - portalW.x, 0, roofW.z - portalW.z).normalize(); }
    await ctx.yield();
    // the one dull orange bomb that crosses overhead while we are inside: from the vent's side (right, ahead) to behind our left shoulder
    const bombA = new THREE.Vector3(0.74 * 0.8 + 0.67 * 0.45, 0.5, -0.67 * 0.8 + 0.74 * 0.45).normalize(), bombB = new THREE.Vector3(0.74 * 0.25 - 0.67 * 0.55, 0.8, -0.67 * 0.25 - 0.74 * 0.55).normalize();
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // ---------------- GAZE on the climb. The route is the straight 58 degree line up the slot, and the ring hangs on that line.
    // (eval8's text of its two pulls, kept as the record of what GAZE_TIP, rimH, uRim and lakeW were for: BOTH PULLS ARE OUT of pois since
    // the look down was put back, see below.) Two pulls, each on a PLACE:
    //   THE RING (the portal's centre), at its full weight from U_OUT, the brief's 37 s ("the portal is in view from 37 s"), to
    //     the end (the pull eases in over the tenth of its span that ends at U_OUT, while we pitch up inside the surge);
    //   THE CRATER LAKE (the island's centre at sea level), weight GAZE_TIP: one slow tip toward it from uRim, where the route
    //     rises past the crest of the cone's far rim (the highest ground under the route's own bearing from the centre), and one
    //     slow lift back to the ring, complete at U_APPROACH, the brief's 46 s, from where the last straight is flown onto the ring.
    // The ring and the lake stand 105 to 145 degrees apart as seen from the climb, so at weight 0.28 the eye leans 19 to 23
    // degrees off the ring toward the lake, never 25. Where the frame cuts the ring, it cuts it.
    let rimH = 0; for (let r = 150; r <= 330; r += 5) rimH = Math.max(rimH, hero.heightAt(0.741 * r, -0.671 * r));
    let uRim = U_OUT; for (let d = U_OUT * path.length; d < U_APPROACH * path.length; d += 2.5) if (path.posAtDist(d).y >= rimH) { uRim = d / path.length; break; }
    const lakeW = new THREE.Vector3(CX, 0, CZ);
    // THE LOOK DOWN (the designers' ruling of 7 Oct 14:03, way (c)): THE OLD VERSION'S OWN LOOK DOWN, put back as its text.
    // The fifteen lines below (comment, GAZE, gazeP / gazeV, gazeAt) are eval4's W:754-768 letter for letter (eval8 had none of them): its
    // typed keys of u and its typed heading are that old live version's own, new against eval8, and are named at the head of the hand-in. Everything they read exists here with the same
    // meaning (path, smoothstep, lerp: the route is eval4's bit for bit). The two pulls above (the ring, the lake) are no longer in pois.
    // THE LOOK'S STRETCH IN METRES FLOWN along the route (its 1216.8 m): FROM 686.7 m TO THE END. The poi line in pois below has weight from
    // 748.4 m to 1156.0 m (u 0.615 and 0.95, its from and to: the engine's bell gives it none outside them); but with eval8's ring pull out
    // the eye also differs from eval8's over 686.7 to 748 m (where that pull eased in) and over 1156 to 1196 m (where it was fading out), and
    // the camera goes on easing out of the look to the end. Before 686.7 m lens place, gaze and camera are eval8's bit for bit.
    // ---------------- GAZE on the climb. The route is the straight 58 degree line up the slot; what turns is the eye:
    // up the slot as we burst out of the surge -> down and across the island far below (the flooded crater between the
    // two trunks' feet, the cone's black wall, its surf and the stained sea beyond, panned from the steam pit's side to
    // the black vent's) -> up along the white wall with the portal high to starboard -> square onto the portal.
    // Keys: [u, yaw in degrees from the heading (+ = toward the black trunk), pitch in degrees].
    const GAZE = [[0.6, 0, 40], [0.685, 0, 57], [0.748, -17, -35], [0.795, 13, -27], [0.843, -19, 42], [0.925, 0, 58], [1, 0, 58]];
    const gazeP = new THREE.Vector3(), gazeV = new THREE.Vector3();
    function gazeAt(time, u) {
      let i = 1; while (i < GAZE.length - 1 && u > GAZE[i][0]) i++;
      const A = GAZE[i - 1], B = GAZE[i], k = smoothstep(A[0], B[0], u);
      const yaw = lerp(A[1], B[1], k) * Math.PI / 180, pit = lerp(A[2], B[2], k) * Math.PI / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
      // heading (0.741, -0.671) in xz; its right-hand side is (0.671, 0.741), the black trunk's
      gazeV.set((0.741 * cy + 0.671 * sy) * Math.cos(pit), Math.sin(pit), (-0.671 * cy + 0.741 * sy) * Math.cos(pit));
      return path.pointAt(u, gazeP).addScaledVector(gazeV, 300);
    }
    // the rare waterspout stands through the held breath (the brief's 25 s to 32.5 s): it uncoils while the full volley of 22 s
    // collapses, and goes in the first third of our stay inside the surge (all by the one map of seconds to places)
    const uSpoutA = uAtSecond(T_VOLLEY), uSpoutB = uAtSecond(T_HELD), uSpoutD = uAtSecond(T_SURGE_IN + (T_SURGE_OUT - T_SURGE_IN) / 3);
    // THE ONE DULL BOMB OVERHEAD RUNS ON THE WORLD'S CLOCK: one crosses every EMBER_EVERY seconds, from a start of its own (a stream made of the
    // seed and its name, which draws from no other), so any stay of 4.5 s in the surge holds one crossing, or the end of one and the start of the next
    const lights = ctx.core.makeRng(ctx.core.hashSeed('ember:' + ctx.seed)), emberAt = lights() * EMBER_EVERY;
    // THE LIGHTNING'S GLOW IN THE CLOUD RUNS ON THE WORLD'S CLOCK (time), not on the eruption's: one possible glow in every 0.75 s of it, 86 in
    // 100 of them lit, starting up to 0.3 s into its slot, 0.6 to 1 strong (the shape of the part's lightning slots, but hashed with a number
    // of its own and with the slots' own start on the clock, the second and third draws of the bomb's stream above; it is not in step with
    // the part's bolts, which the cloud hides), each at a place of its own in the black trunk over the vent (60 to 300 m up, up to 40 m to either side). SOFT: each
    // swells in 0.3 s and then falls to 1/e in every 0.3 s more (a twentieth after 0.9 s; a glow is let go three slots on, under a hundredth
    // of its strength), where a bolt flashes up in 0.1 s. TWO STARTS LIE 0.45 TO 1.05 s APART (one slot's latest start, 0.3 s in, and the
    // next slot's earliest), so no second of the clock holds more than two: AT the design's two a second, never over it; 1.15 a second on
    // the mean. In the cloud a glow multiplies the tone it falls on (see buildVeil): the step is small against that tone in every colour
    const glowSeed = lights() * 1000, glowOff = lights() * 0.75, glowH = (n, k) => { const x = Math.sin(n * 127.1 + k * 311.7 + glowSeed) * 43758.5453; return x - Math.floor(x); };
    const glowOf = (t0, fi) => { const t = t0 - (fi * 0.75 + glowH(fi, 2) * 0.3); return glowH(fi, 1) < 0.86 && t > 0 ? (t < 0.3 ? smoothstep(0, 0.3, t) : Math.exp(-(t - 0.3) / 0.3)) * (0.6 + 0.4 * glowH(fi, 4)) : 0; };
    // ORDER 4, THE GLOWS INSIDE THE CLOUD (the same slots, hashes and clock): glowIn = a slot's strength there: GLOW_UP = 0.6 s up, then 0.6 s down
    // TO NOTHING, a ramp with eased ends (order 5: the light as seen saturates, and by this shape it takes over a quarter second from a tenth
    // to nine tenths of its most; a finite life of 1.2 s, so two uniforms carry them all: a slot's glow is out before the next but one
    // begins), 0.6 to 1 strong; glowAtIn = its place, its own: a box 300 m square about the point half way between the two vents, 10 to 100 m up (hashes
    // 7, 8, 9 of the slot), so that from the eye's places in the stay a glow stands in the cloud about us and not in the far trunk
    const glowIn = (t0, fi) => { const t = t0 - (fi * 0.75 + glowH(fi, 2) * 0.3); if (!(glowH(fi, 1) < 0.86 && t > 0 && t < GLOW_LIFE)) return 0; const x = t < GLOW_UP ? t / GLOW_UP : (GLOW_LIFE - t) / (GLOW_LIFE - GLOW_UP); return (x - 0.3 * Math.sin(2 * Math.PI * x) / (2 * Math.PI)) * (0.6 + 0.4 * glowH(fi, 4)); };
    const glowAtIn = (fi, out) => out.set((Kw.x + Ww.x) * 0.5 + (glowH(fi, 7) - 0.5) * 300, 10 + 90 * glowH(fi, 8), (Kw.z + Ww.z) * 0.5 + (glowH(fi, 9) - 0.5) * 300);
    const glowAt = (fi, out) => out.set(Kw.x + (glowH(fi, 5) - 0.5) * 80, 60 + 240 * glowH(fi, 3), Kw.z + (glowH(fi, 6) - 0.5) * 80);

    // ---------------- update
    const cp = new THREE.Vector3(), fd = new THREE.Vector3(), bd = new THREE.Vector3(), col = new THREE.Color();
    const TL = hero.timeline;
    let lastU = -1, lastT = 0, hold = 0;
    let lastS = 0, lastR = 1, contN = 0; const gSlot = [-1e9, -1e9], gS0 = [0, 0], gA = [0, 0], gM = [1, 1], gCut = [0, 0], gBad = [0, 0];      // orders 5 and 6: the flight's rate and the two inside glows' own notes (see update)
    function update(dt, time, camera, u) {
      camera.getWorldPosition(cp);
      // the eruption clock: scripted by u; while u stands still (portal preview, a held frame) it runs on with time
      const du = lastU < 0 ? 1 : Math.abs(u - lastU), dT = clamp(time - lastT, 0, 30);
      if (du > 0.02) hold = 0;
      else if (du < 1e-7) hold += dT;
      else { const tg = Math.round(hold / 12) * 12; hold += clamp(tg - hold, -0.35 * dT, 0.35 * dT); }
      lastU = u; lastT = time;
      const base = clockAtU(u) + surgeOff, clock = base + hold;
      hero.setClock(clock); hero.setLightningGain(1 - smoothstep(0.9, 0.93, u));       // (the bolts stand inside the black trunk below 420 m, far off the portal's line)
      // THE SURGE, all of it from the place of its front. tsS = seconds since the one scripted surge was born (from u alone); its
      // front runs on at the ring's speed after the wall itself has died; front = its radius round the vent; gap = how far the front is
      // behind the eye (m, negative = still coming). rho = the cloud's density at the eye (none before the front: mistAt), q = its share of the peak.
      const s = hero.surge(clock), tsS = base - S0, born = tsS >= -0.05 ? 1 : 0, front = TL.surgeR0 + TL.surgeSpeed * Math.max(tsS, 0);
      const gap = front - Math.hypot(cp.x - Kw.x, cp.z - Kw.z);
      const str = born * smoothstep(0, 0.9, tsS) * (1 - smoothstep(190, 330, gap));
      const rho = mistAt(gap) * Math.sqrt(str), q = rho / RHO_PEAK;
      // WHAT CHANGES HANDS IN THE SURGE goes by the cloud at the eye's place (rho, q) and by the eye's height in its layer:
      // the stones round the lens go, a few at a time (each shrinks away), while the mist over them thickens from half its peak
      // density to the peak, which is while the eye goes from 14 to 40 m deep behind the front (their triangles pay for the fine
      // lobes, which come 44 m in), and they are of the sea: not drawn from above the layer
      // (the 0.12 of the drawn count below is copied by dealWisps' stays table, with the 0.04 of STONE_GLSL: a stone the count drops while it still
      // shows takes no dealt wisp. Whoever retunes it here retunes it there)
      const sk = 1.04 * (1 - smoothstep(0.5, 1, q));
      SU.uStoneK.value = sk; stones.visible = sk > 0.001 && cp.y < MIST_TOP + 12;
      for (let i = 0; i < 5; i++) { const sm = stones.children[i]; sm.geometry.instanceCount = Math.min(sm.userData.full, Math.ceil(sm.userData.full * Math.max(0, sk + 0.12))); }
      raft.visible = cp.y < MIST_TOP + 12;      // (above the mist layer the far raft lies behind and below the eye: its sheet is not drawn)
      { const bu = skyBombs.material.uniforms; bu.uClockB.value = clock; bu.uSeaT.value = time; }      // (nothing shows or hides the bombs overhead but the mist: see buildSkyBombs)
      hero.update(dt, time, camera);
      // THE LIGHT is the sky's own key all the way (square behind the eye in the breach and on the climb). By moonlight the walls
      // get more fill once the eye is above the mist layer (a rule of the eye's height), so the black wall reads beside the lit white one.
      const knH = M.night && !ctx.through ? smoothstep(MIST_TOP, MIST_TOP + 50, cp.y) : 0;
      hero.setLight({ skyIntensity: M.ambI * (1 + 1.2 * knH) });
      // the wall itself (the ring's lobes and wash) lives the ring's own 12 s. BEFORE ITS FRONT REACHES THE EYE nothing of the world's hides
      // it: no mist leads it, and where it comes near (the part melts each lobe within 82 to 42 m and 1.5 radii of the eye, by distance from
      // the lens's place whatever its turn, so no lobe's face is ever within 42 m and none is cut by the lens) the cover veil's billows stand
      // in its place (see buildVeil). Once its front has passed the eye it is seen through the cloud that lies between them: seen = the
      // share of its light that still reaches the eye (the mist's own law with the cloud's density at the eye and the distance to the
      // front). It melts as that share falls from a quarter to a fiftieth, which is while the eye goes from 31 to 44 m deep behind the
      // front, and its mesh is not drawn below that; AT THAT MOMENT, in the thick of the cloud, the slot's fine lobes replace their coarse
      // twins (never both: the wall's triangles pay for them), and their extra relief and the climb-only turrets grow out as the eye rises
      // through the layer: none at the sea, all of it at the layer's top
      const seen = gap > 0 ? Math.exp(-rho * rho * gap * gap) : 1;
      const wall = s.strength * (born && base < S0 + TL.surgeLife - 0.02 ? 1 : 0) * smoothstep(1 / 50, 1 / 4, seen), wallShown = wall > 0.002;
      hero.uniforms.uSurge.value.y = wall; hero.setSurgeShown(wallShown);
      hero.setNear(born > 0 && gap > 0 && !wallShown && !ctx.through); hero.setNearGrow(smoothstep(0, MIST_TOP, cp.y));
      // THE MIST IS A BODY IN THE WORLD: the cylinder round the vent that the front has reached, under MIST_TOP. It leads the wall by
      // nothing, stays with us behind the front and thins with the distance the front has run on past the eye (190 to 330 m). ONE LAW
      // fogs a sight line through it: the stretch of the line inside the body, at the body's one density (rhoH), 1 - exp(-L*L), to the
      // mist's one tone (col). The hero's bodies take it from the hero (setMist); the sky behind them (the sky veil) and the sea (its own
      // patched fragment text, see build) take it from this file's copy of the hero's law with the hero's uniforms (MIST_LAW), and so do
      // this world's own things on the sea (stones, foam, wisps, raft sheet, streamers, ship, splash, sky bombs: LAW_FOG, each in its own
      // text). Only the kit's own things (the birds, the ash flakes and flecks, the ship's lamps, the rare waterspout) take the surge's
      // mist from scene.fog, by the cloud at the eye's place: rl, which comes with the cloud at the eye (q) and is nothing before the
      // front (the head says where each of them stands against the law).
      // The cloud itself, the billows, is the cover veil's (cover 1): placed in the body, so it too is nothing before the front.
      // lay: the eye's own height in the layer (the kit's fog thins out as it climbs through the top)
      const lay = 1 - smoothstep(MIST_TOP - 22, MIST_TOP + 3, cp.y), inK = q;
      // the body's haze is thin, so the trunks and the cone show through the cloud's gaps, and it thins as the eye climbs: from 12 m up on,
      // to a twelfth of itself from 108 m (the live version's from 43 m to 148 m: by a count on the sight lines to the trunks, the haze
      // this law lays on them over the surge's last second and a half and after is never more than live's)
      // (AT THE SURGE'S BIRTH NOTHING POPS IN: the body's haze, and the cloud's strength with it, thicken as the surge grows, from nothing
      // where its front is born to all of it when the front has run 180 m from there (6 s on; it has run 246 m when it reaches the eye
      // at the design's 32.5 s). A law of the front's own place, the same for any eye)
      const grown = smoothstep(0, 180, front - TL.surgeR0);
      const rhoH = RHO_BODY * Math.sqrt(str) * grown * (1 - 0.92 * smoothstep(MIST_TOP - 26, MIST_TOP + 70, cp.y));
      const rl = Math.min(rhoH, 0.014) * lay * q;
      // the lightning's soft glow, on the world's clock (see glowOf): the slot's and the two before it, each from its own place; their
      // directions are blended by their strengths, so the glow's place never jumps. The mist's own tone lifts with it by 5 in 100 at most.
      // ORDER 4: THAT IS THE APPROACH'S LAW AND GOES OUT INSIDE, by inS = THE MIST AT THE EYE'S PLACE AS ORDER 4 READS IT: the cloud at
      // the eye (all of it from half its peak density, 14 m behind the front) times the eye's height in the layer (lay). inS is exactly
      // nothing before the front and from 41 m up, and every new thing of order 4 is a multiple of it (uIn, uSeaIn; the bomb's pool by uIn
      // in the shader) or never over a multiple of it (the inside glows: glowTop below), while the wide glow and the mist tone's lift go by 1 - inS: where inS is nothing the
      // frame is eval9g's. (Inside, a glow lifting the whole mist's tone lit the whole picture; now it lights its own region)
      const tg = time + glowOff, fslot = Math.floor(tg / 0.75); let glowS = 0; fd.set(0, 0, 0);
      for (let i = 0; i < 3; i++) { const g = glowOf(tg, fslot - i); if (g > 0) { glowS = Math.max(glowS, g); fd.addScaledVector(glowAt(fslot - i, bd).sub(cp).normalize(), g); } }
      const inS = Math.min(1, 2 * q) * lay;
      col.copy(surgeCol).multiplyScalar(1 + 0.05 * glowS * (1 - inS));
      hero.setMist(rhoH, MIST_TOP, col, front);
      // the sea's own body colours ease to ash grey while the front covers the last 110 to 30 m to the eye (the wall's foot is then the
      // cloud's own billows, and the sea under them is the surge's), so the water is ash-grey when it arrives
      const sg = smoothstep(-110, -30, gap) * Math.min(1, str * 2) * (1 - 0.9 * smoothstep(60, 180, cp.y));
      seaU.uDeep.value.copy(seaBase[0]).lerp(seaAsh[0], sg); seaU.uShallowColor.value.copy(seaBase[1]).lerp(seaAsh[1], sg * 0.92); seaU.uScatter.value.copy(seaBase[2]).lerp(seaAsh[2], sg);
      fog.density = Math.hypot(M.haze, rl); fog.color.copy(fogBase).lerp(col, rl * rl / (rl * rl + M.haze * M.haze));
      if (!seaLaw) seaHaze.value.set(fog.color.r, fog.color.g, fog.color.b, fog.density);
      // the cloud's strength: all of it while the surge lives and is grown, less as the surge dies behind the front, and less as the eye climbs
      // through THE CLOUD'S OWN TOP, which lies lower than the haze's: it runs out while the eye climbs from 5 to 29 m (live's ran out with lay,
      // from 16 to 41 m). By a count on the sight lines to the trunks (to the vent's axis, and to the trunks' own lobes in three bands of
      // height), ON THE MEAN OF FIVE SEEDS: from the design's 36.5 s on the cloud and the haze together let more of the trunks through than
      // live's at every quarter second in every band, and lay no more pale on the black trunk but in its lowest 40 m at 36.75 s (some six
      // thousandths more by day and seven by night, by a second count); from 35.5 to 36.25 s neither is steadily the clearer (the black
      // trunk's middle band lets up to 0.035 less through at 36.0 s; the pale laid on the black trunk is up to 0.03 over live's by day
      // and 0.02 by night, and the white trunk's middle band takes some 0.04 more pale at 35.5 and 35.75 s, the billows' shaded side
      // being lifted toward the mist's tone). IN A SINGLE SEED the billows stand where they stand: before 36.5 s one band or another
      // can let up to 0.22 less through than live's in that seed, or lay up to 0.12 more pale; at 36.5 and 36.75 s up to a tenth less
      // through, or up to 0.05 more pale; from 37 s on none lets less through (but for three thousandths of haze at 38.5 s)
      MU.uCloud.value.set(MIST_TOP, time, Math.min(1, Math.sqrt(str) * 2.2) * grown * (1 - smoothstep(MIST_TOP - 33, MIST_TOP - 9, cp.y)));
      if (fd.lengthSq() < 1e-8) fd.set(0, 1, 0); fd.normalize();
      MU.uGlowA.value.set(fd.x, fd.y, fd.z, glowS * (1 - inS));
      MU.uIn.value = inS; seaIn.value = inS;
      // the two inside glows (the slot's and the one before it; even slots in uGlowP, odd in uGlowQ). ORDER 5, A GLOW IS SEEN BY ITS OWN
      // RISE AND FALL AT EVERY PACE: strength = the slot's own shape (glowIn) x ONE number for its whole life (gA): the lesser of the
      // cloud where the flight stood on the route when the glow began (gS0, noted once) and where it will stand when the glow ends, at
      // the flight's present speed: rate = the design's seconds the route covers in a real second (1 at the usual pace; the viewer's
      // pace, five times that while hurrying; taken as 1 where there is no last frame to reckon from: a frame drawn alone, or a jump
      // of more than a twentieth of the route in one frame, which no flight makes),
      // and rateTo = that plus 0.7 s of its own present rise (where a hurry's easing is taking it). The cloud there: cloudAtSecond
      // (build). So a glow alight on the wall's face when the front crosses the eye is not taken over into the cloud, one that the
      // eye would leave behind in the cloud's going does not begin, and at a steady pace none is cut by the eye's passage (counted). If
      // the speed changes while a glow is alight, its number is let down (or up again) by gM, over GLOW_UP seconds or more for the
      // whole of it. AND THE HARD BOUND IS THE CLOUD AT THE EYE'S PLACE NOW (glowTop = inS x the cloud's own top, 5 to 29 m: the
      // very term of uCloud's strength above): no glow but one let go (below) is ever stronger than it, so each is exactly nothing
      // where the mist at the eye's place is nothing, and none lies over the white trunk in the leaving. ORDER 6, A GLOW LET GO
      // (gCut): where that bound would cut under what a glow holds (glowTop under 0.98 of gA x gM, less 0.005), or the cloud
      // foreseen at its end stays under that for three frames running (gBad: one frame's slip of the measured speed opens nothing),
      // the glow is let go once for all: gM runs straight to nothing in 0.36 s, or by 0.72 s after the glow's start if that is
      // later (gCut = that rate, set once), and the bound is not laid on it again: only the viewer's moving the Pace or the hurry
      // inside opens it (never a steady pace: counted equal to order 5 bit for bit), and such a glow can be alight for up to
      // 0.40 s after the mist at the eye's place is nothing (counted), on the white trunk's side too. In a held frame (u standing, the clock
      // running) rate is nothing and the glows come and go by the cloud where the eye stands.
      const glowTop = inS * (1 - smoothstep(MIST_TOP - 33, MIST_TOP - 9, cp.y));
      const sNow = secondAtU(u), cont = dT > 1e-4 && dT <= 0.25 && du <= 0.05, rate = cont ? clamp((sNow - lastS) / dT, 0, 40) : 1; lastS = sNow; contN = cont ? contN + 1 : 0;
      const rateTo = rate + (contN > 1 ? 0.7 * Math.max(0, (rate - lastR) / dT - 0.3) : 0); lastR = rate;
      if (!cont) gSlot[0] = gSlot[1] = -1e9;
      for (let i = 0; i < 2; i++) { const fi = fslot - i, k = fi & 1, age = tg - fi * 0.75 - glowH(fi, 2) * 0.3, gu = k ? MU.uGlowQ.value : MU.uGlowP.value; let g = 0;
        if (age > 0 && age < GLOW_LIFE && (glowTop > 0 || gSlot[k] === fi)) { const fresh = gSlot[k] !== fi; if (fresh) { gSlot[k] = fi; gS0[k] = sNow - rate * age; }
          const want = Math.min(cloudAtSecond(gS0[k]), cloudAtSecond(sNow + rateTo * (GLOW_LIFE - age)));
          if (fresh) { gA[k] = want; gM[k] = 1; gCut[k] = 0; gBad[k] = 0; }
          else if (gCut[k] === 0) { const lvl = 0.98 * gA[k] * gM[k] - 0.005; gBad[k] = want < lvl ? gBad[k] + 1 : 0;
            if (glowTop < lvl || gBad[k] > 2) gCut[k] = gM[k] / Math.max(0.36, 0.72 - age);
            else gM[k] += clamp((gA[k] > 1e-6 ? Math.min(1, want / gA[k]) : 0) - gM[k], -dT / GLOW_UP, dT / GLOW_UP); }
          if (gCut[k] > 0) gM[k] = Math.max(0, gM[k] - dT * gCut[k]);
          g = glowIn(tg, fi) * (gCut[k] > 0 ? gA[k] * gM[k] : Math.min(gA[k] * gM[k], glowTop)); }
        if (g > 0) { glowAtIn(fi, bd).sub(cp).normalize(); gu.set(bd.x, bd.y, bd.z, g); } else gu.w = 0; }
      // the one dull bomb overhead, on the world's clock: its swing takes EMBER_SWING seconds of every EMBER_EVERY, from the vent's side to behind our left
      // shoulder. It is seen from deep inside the cloud only: by the cloud at the eye (q), and not from where the eye's own sky is opening (the eye 8 to 18 m up:
      // higher, its glow lay over the white trunk as a pink stain). Its warm pool on the billows (order 4) is this strength times uIn, in the veil
      const emberK = q * (1 - smoothstep(MIST_TOP - 30, MIST_TOP - 20, cp.y));
      const kb = clamp((((time + emberAt) % EMBER_EVERY + EMBER_EVERY) % EMBER_EVERY) / EMBER_SWING, 0, 1); bd.copy(bombA).lerp(bombB, kb).normalize();
      MU.uGlowB.value.set(bd.x, bd.y, bd.z, Math.pow(Math.sin(Math.PI * kb), 0.7) * 0.7 * emberK);
      ash.setOpacity(clamp(0.2 + 0.45 * smoothstep(0.2, 0.5, u) + inK, 0, 1) * (M.night ? 0.45 : 1));
      // the ash flecks are of the cloud at the eye: none before the front, and none above its layer (their box reaches 13 m over the eye:
      // they thin out while the eye climbs the 17 m below the height from which that would stand over MIST_TOP). Never more than 0.6 opaque (eval9g 0.3)
      const stk = q * (1 - smoothstep(MIST_TOP - 30, MIST_TOP - 13, cp.y));
      streaks.setOpacity(stk > 0.02 ? Math.min(0.6, stk) : 0); streaks.update(dt, time, camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera);
      ocean.update(dt, time, camera); seaCam.set(ocean.surface.position.x, ocean.surface.position.z);
      ash.update(dt, time, camera);
      { const te = secondAtU(u) - T_SPLASH, su = splash.material.uniforms, on = !ctx.through && te > -SPLASH_FALL - 0.1 && te < 13;
        su.uEv.value.x = on ? te : -99;
        if (on) { su.uSeaT.value = time; su.uAt.value.y = ocean.heightAt(su.uAt.value.x, su.uAt.value.z, time); } }
      if (rainbow) rainbow.update(dt, time, camera);
      fauna.update(dt, time, camera, u);
      if (ship) {
        const hb = ocean.heightAt(shipX + bowDX * 10, shipZ + bowDZ * 10, time), hs = ocean.heightAt(shipX - bowDX * 10, shipZ - bowDZ * 10, time), hm = ocean.heightAt(shipX, shipZ, time);
        ship.position.y = (hb + hs + hm) / 3 * 0.7 - 0.1;
        ship.rotation.x = -Math.atan2(hb - hs, 20) * 1.5; ship.rotation.z = 0.035 * Math.sin(time * 0.8);
        ship.updateMatrixWorld();
        for (let i = 0; i < 2; i++) { lampW.copy(lampL[i]).applyMatrix4(ship.matrixWorld); lamps.setPosition(i, lampW.x, lampW.y, lampW.z); }
        lamps.update(dt, time, camera);
      }
      if (spout) {
        const k = smoothstep(uSpoutA, uSpoutB, u) * (1 - smoothstep(SURGE_U, uSpoutD, u)), w = smoothstep(uSpoutA, SURGE_U, u);
        spout.object.visible = k > 0.01;
        spout.uniforms.uBase.value.set(lerp(Ww.x, CX - 30, w), -300 * (1 - k), lerp(Ww.z, CZ + 70, w));
        spout.update(dt, time, camera);
      }
    }

    return {
      scene, path, duration: DURATION,
      pace,
      camera: { fov: FOV, near: 0.3, far: 9000, lookAhead: 30, nearThrough: 0.3 },
      pois: [
        // the opening: level over the raft at first, then the gaze lifts to take in the columns' whole height, and comes down for the terns
        { at: [(Kw.x + Ww.x) / 2, 600, (Kw.z + Ww.z) / 2], from: 0.045, to: 0.14, weight: 0.4, fade: 0.33 },
        // the jets' mid-height
        { at: [jets.x, jets.y, jets.z], from: 0.17, to: 0.56, weight: 0.6 },
        // THE LOOK DOWN: the next line is eval4's own poi entry (eval8 had two entries here instead). To take it out: delete it
        // and the fifteen eval4 lines of GAZE above, and put back eval8's two entries, which were:
        //   { at: [portalW.x, portalW.y, portalW.z], from: (U_OUT - 0.1) / 0.9, to: 1, weight: 0.94, fade: 0.1 },
        //   { at: [lakeW.x, lakeW.y, lakeW.z], from: uRim, to: U_APPROACH, weight: GAZE_TIP, fade: 0.3 },
        // the climb: see GAZE above
        { at: gazeAt, from: 0.615, to: 0.95, weight: 0.94, fade: 0.1 },
      ],
      portal: { shape: 'circle', radius: 9, color: '#FFE2C0', glow: 1, revealDistance: 420, tilt: true },
      post: {
        exposure: M.exposure, bloom: { strength: 0.34, radius: 0.6, threshold: 0.93 },
        grade: { saturation: 0.97, contrast: 1.05, tint: M.tint, shadowTint: M.shadow, vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      ride: 'none',
      update,
      dispose() { sky.dispose(); },
    };
  },
};
