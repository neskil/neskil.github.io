// THE NIGHT-SHINING CLOUDS: set piece for the world "night-shining" (sky law, balloon envelope, burst, frost).
//
// BALLOON SPACE: +Y up, gondola's middle at the origin, the balloon's axis the Y axis, +Z SOUTH, +X EAST (north is -Z).
//   The sun is under the northern horizon, the moon in the south-east. 1 unit = 1 m; the sky law works in km at infinity.
// WHAT IS WHERE
//   SKY_GLSL        one GLSL text: vec3 nsSky(vec3 d), the colour of everything at infinity along unit direction d:
//                   space, stars, Milky Way, aurora, moon, limb (dip 6.24 deg), twilight arc, airglow line, THE SHEET
//                   (ray met with a shell 45 km overhead) and, below the limb, THE EARTH (ray met with the globe 38 km down).
//                   It declares its own uniforms (all named uNs...; spread skyUniforms into the material) and is for
//                   FRAGMENT shaders: nsSky takes the pixel's footprint from fwidth(d). nsSkyF(d, fw) is the same law
//                   with the footprint (radians) handed in, for a surface that bends d; nsSkyS(d, fw, soft) also widens
//                   the thin airglow line by soft degrees (the film and ribbons use it). Never call any of them in a loop.
//   sky             one box drawn at the far plane, centred on the eye every update (1 call, 12 triangles).
//   film            lathe 320 x 64 (40,960 triangles), drawn twice: back faces, then front faces (2 calls, 81,920).
//                   THE LOAD TAPES, frost patches, tear and frayed edge are drawn IN the film's fragment shader
//                   (no tape mesh: a line in the shader follows every crease and is never thinner than 1.5 pixels).
//   crown           crown fitting (valve, plate with tape lugs, bolted clamp ring) and apex fitting (1 call, about 950). The apex fitting is the small dark cap on the
//                   cone's point, y 60 to 62.2: nothing of this piece lies below y 60.
//   ribbons         14 strips 8 x 90 (1 call, 20,160), shaded as the envelope's own film.
//   flakes          3,000 instanced frost flakes (1 call, 6,000).   dust   3,000 instanced grains of ice dust (1 call, 6,000).
//   COST: 5 calls and about 88,900 triangles while whole; 7 calls and about 115,000 from setBurst > 0 (ribbons and dust are hidden
//   until then). No lights, no textures. Build about 80 ms here, in 7 steps. Flake and dust counts follow quality.detail.
//   SIZES: envelope y 60 to 190, radius 45 at y 145; ribbons 54 to 72 m by 7 to 11 m; the moon's disc is 0.9 degrees in
//   radius (three times life, to read on a still). Nothing shaded here is brighter than about 2: film and ribbons are
//   capped at 1.5 (the film's far wall at 0.55, its near wall also by the sky seen behind it: the stack stays about 2, but where the gaze runs up along the gathered lower cone, 21 to 23 s, several folds of film lie behind one another and stack to 2.2 to 2.3), flakes at 0.9, dust at 0.55, a glint of the moon on water at 1.4, the Earth at 1.8, the moon at 1.9.
//   RANDOM: nothing is drawn from ctx.rng but one named fork ('ns-hero'); look, sky and craft are named forks of that.
// THE BURST, a pure law of setBurst's s (and of time for flutter only): the front runs 16 m/s down 14 seams from the
//   crown plate (which drops into the bag); a ragged hole 8 to 19 m across tears open round it in 1.8 s; seam 0, the
//   south meridian, runs on to 150 m of arc, the others to the ribbons' roots, each up to 1.2 s late and at .65 to 1.3
//   of that rate (a slit that gapes later), so their lengths are unequal; each ribbon has its own moment too (up to .6 s
//   late), its strip is cut from the film as its front passes. FROM THE TEARING a freed strip lifts at once: within two
//   seconds it stands up along the last line's direction and its outer part is drawn round that line, so the ribbons
//   stand large round the way out as the seam passes and rise with the lens.
//   THE FLOWER: a freed ribbon's root rises 63 to 100 m (each its own height, pace, lean and curl) and the ring of roots
//   stands 16.5 to 24.5 m round the last straight line, leaning with it; the inner half of a petal stands 1 to 10
//   degrees out, the outer half curls over from 5 s on. LATE (3.5 to 9.5 s after a ribbon lets go) the roots
//   climb on to stand 15 to 20 m round the way out, just under its plane (160 m along the line), and the petals open
//   outward beyond it along the cone that is kept clear: so the flower rings the way out to the end, wider open.
//   THE PIECES (order 7): 5 to 7.2 s after it began to tear, each ribbon parts into three at ragged necks. A piece keeps
//   its shape, tumbles end over end about its own middle, bends, and drifts: two in five fall behind along the last
//   line (the lens overtakes them), the rest stay ahead as the wheel and drift 2 to 24 m outward; some middle pieces
//   curl up tight and come to 17 m from the line (the law of place then holds them outside the clear air): large
//   curls that pass close by at the last. So the wheel changes: long ribbons, then tumbling pieces, then near curls.
// LOOK (opts.look, each field dealt from a fork of ctx.rng when left out; returned as look)
//   (every look: the arc is a glow that grades, no band has an edge: ember on the limb, rose, gold, turquoise to about
//   6 degrees, then deep blue night, brightest due north; THE SHEET AT ITS OWN SCALE (order 4): soft rolls 8 km apart
//   (10 degrees wide overhead) with a grain along them, bands 40 km apart across them, knots, whirls as loose open
//   spirals, veil and clear night between; toward the limb the cover closes into a luminous band.
//   ORDER 5: it is polar midnight on every look (deep ground, stars in the gaps, the cloud electric blue overhead and
//   silver-blue lower); on the 9 and 6 degree looks a roll is ribbed across its length (2.8 km) and a band's crest carries
//   rolls, so cloud reads as rippled; a train passes into its mean before it is finer than five
//   pixels (no fine level line), and toward the limb only broad unequal bands are left; the film and the petals carry a
//   plain rim of the arc's ember and gold; leads and polynya have shores (a lit rim of rafted ice, a shaded one, brash).
//   ORDER 6: the arc is ONE glow (five tones blended by height, no band, no edge; the airglow one faint hair above the
//   limb); the sheet's lower border in the north is ragged; on the darkest look the lower sky keeps its form in deep
//   violet-blue and the aurora stands as crisp curtains (sharp lower border, fine upright rays, ends); the coast's shore
//   follows the land's own relief (headlands, bays, a wide foot of smooth snow); a freed petal is a leaf, cupped and turned.
//   ORDER 7: NIGHT ON THE GROUND: indigo ice lit by the moon, the sheet's colour and, on the darkest look, the
//   curtains' green as a tint (the twilight's own light on it: THE ICE, below); black water that carries the sky's
//   colours as broken glints. No fog and no far cloud deck: one law of ice to the limb. The coast
//   look: massifs with a lit and a shaded flank, rock, shadows on the ice field, glaciers with tongues
//   ending in fjords with brash, fast ice with cracks, a flaw lead, and the sea's edge to the east-south-east. A
//   curtain is a folded ribbon: its lower border wanders and folds, brightest where it runs along the sight line.
//   The film seen square on is nearly clear; its light is in the tapes (pale), the scallops beside them and the rim)
//   ORDER 8: THE ICE DUST IS SEEN FOR THE FIRST TIME (three numbers of each grain stood inside a remark): 3,000 grains
//   born on the seams as the tear's front passes, in wisps; each is dull till its face meets the moon's mirror, and
//   takes the arc's rose when its face is turned north. THE GROUND: a lead's lit and
//   shaded rims stand on its ice, never on its water; the sky's colour shows on the water between its glints (the
//   floes, the leads and the ridges as they are now: THE ICE, below). A flake grows in by the route (no hard step).
//   sunDepth 6 | 9 | 13   6: silver-white over the whole sky, gold toward the north. 9: electric blue, the sheet ends
//                         in the Earth's shadow about 40 deg up in the south. 13: the lattice confined to the north in
//                         deep violet-blue, many more stars, THE MILKY WAY through the top of the sky with its dust
//                         lane, and green AURORA RAYS with violet tops standing in the north above the sheet.
//   display 'bands' | 'billows' | 'whirls'   which form leads: the 40 km swell, fields of rolls, wider and tighter spirals.
//   moon 'gibbous' | 'crescent' | 'none'     the disc, its phase and the strength of the silver key light.
//   below 'pack' | 'edge' | 'coast'          pack at three scales of floe; the ice edge on a black sea with brash drawn into
//                         eddies; a glaciated coast (massifs, glaciers, fjords, fast ice, a flaw lead) with the sea's edge beyond.
//   film 'clear' | 'gold'                    tint of the film.
// HOOKS: setBurst(s) the burst's clock in seconds (0 or less: whole; the tear's front has run 16 m/s x s);
//   setShed(k) 0..1; setFlash(k, color) 0..1; radiusAt(y); flight(t) the brief's keyed pose at t seconds (test aid);
//   update(dt, time, camera); dispose() frees every geometry and material; the same handles are on object.userData.nightShining.
// EVERY TERM THAT READS THE EYE (all are light or filtering, none clears a picture)
//   the sky box follows the eye (infinity); footprint filtering by fwidth of the direction (stars never under a pixel
//   and a half, billows, floes and leads fade where they fall under two pixels); the film bends the sight line by its
//   normal, mirrors moon and arc by fresnel and is milkier where the sight line grazes it (seen square on it is clear:
//   the true sky comes through, the far wall fainter than the near in everything); where it grazes the film
//   glows warm with the arc's light (most on the north-facing skin and along sight lines toward the arc: a thin film
//   scatters forward) and has a cool bright rim; moon glints run along the tapes by the mirror angle; tape lines are
//   never thinner than a pixel and a half; flakes and dust glint by the mirror angle and are never smaller than a pixel
//   and a half. (order 8b, named here) A PLATE'S FACE: how squarely a flake's or a grain's tumbling plate is turned to
//   the sight line from the eye to it (uEye): a quarter when it is seen edge on, whole when seen square on. It narrows
//   a flake and a grain seen edge on (one axis of the plate is scaled by it), and it weights the dust's rose (by 0.5 + 1.5 x face: a grain
//   turned north takes 0.875 of it seen edge on, twice it seen square on). A plate widened to the pixel floor is dimmed: its
//   light is divided by the square of the widening, which takes back all that the widening adds, and is then raised
//   by the widening itself, threefold at the most, so that a far grain is still seen. All of it is lawful: the face
//   is a shading by the direction from a thing to the eye, the dimming a filtering by the pixel's footprint; neither
//   hides, fades or thins a thing by its distance from the lens to clear a picture. On the Earth the moon's glitter lies along the leads by the mirror angle, as glints a pixel or two across
//   at every range (two scales chosen by the footprint, each fading into the next: never a disc); the far field's forms
//   are filtered by the mean of the footprint's two axes; a shore's rim and shadow are never thinner than a pixel.
//   A petal's shading (its cupped normal, its north-facing edge) is of its own surface, taken from its own derivatives.
//   (order 8: three terms named here that were not)
//   THE EARTH'S AIR thickens with the length of the sight line to the ground (1 - exp(-km / 650), toward the limb's
//   blue): light, as air does it, the same in every picture. That length is a function of the DIRECTION alone: the
//   law's eye stands 38 km over the ground whatever the lens does (the sky box follows the eye), so it is as much a
//   law of place on the ground, and nothing is cleared by it.
//   THE WEIGHT OF THE FAR TONES was written by that same length; it is now written BY PLACE (see below).
//   THE CROWN FITTING reads the eye four ways, all of them light or filtering: its sight line (from uEye) gives the
//   moon's mirror on the plate and on the polished ring and bolts; its normal is turned to face the viewer (one
//   material shades both faces of a thin plate); and under the pixel's footprint (fwidth of the bearing) the forty
//   lugs and twenty-four bolts fade to their mean, so they never shimmer. None hides, fades or thins the fitting.
//   A PIXEL'S SIZE: every floor here is taken from fwidth and holds in any buffer, EXCEPT the flakes' and the dust's
//   floor of a pixel and a half, which takes the pixel from the full drawing buffer (uPx, read in update): a world
//   drawn into a buffer of half the size (seen through an opening) gets that one floor half as wide, three quarters
//   of its own pixel. Not mended: update cannot know the buffer of the draw.
//   BY DIRECTION IN BALLOON SPACE, not by the eye: within 13 deg of the portal's direction (soft to 31) the sheet's
//   structure gives way to a calm, smooth, luminous veil of about its own mean brightness (not dimmed: order 2); the
//   cover closes toward the limb (below 32 degrees, 27 on the lighter looks) and the band there is about half as bright (a third on the darkest look, whose gain is highest);
//   in the north the sheet's lower border is ragged, between 2 and 20 degrees up by the bearing (tongues and gaps); the
//   aurora's rays stand in the north and none within 20 degrees of the last line's direction; the Milky Way's bulge
//   lies 36 degrees from it.
//   BY PLACE: every freed point of a ribbon keeps 14.5 m and a ragged margin from the last straight line (pushed east or west); past the way
//   out's plane that clear space widens as a cone (10.5 m + 1.4 m per metre past it), so that from the line, up to 5 m
//   before the plane, no freed point is ever seen inside the ring or before it; frost flakes keep 2.6 m (their middles) from the flown half plane (x = 0, z >= 0);
//   ice dust (order 8b: THE LAW'S OWN FIGURES, which are the promise): a grain has NO light within 2.6 m of the last
//   straight line below the crown (to 48 m along the line), a width that grows to 9 m by the crown (64 m along it) and
//   stays 9 m to the plane; from about a metre before the plane it is the ribbons' cone (10.5 m + 1.4 m per metre
//   past it). A grain has its full light only 7 m further out than that. So no lit grain is ever nearer than 2.6 m
//   to the lens on the line, and from the line, UP TO 5 m BEFORE THE PLANE, no lit grain is seen inside the ring or
//   before it. In the last half second lit grains past the plane do stand inside its outline; only the portal's own
//   opaque picture hides them. (A SAMPLE, not the promise: 20,000 grains with numbers of my own drawing, run through
//   the law after the mend, came no nearer than 3.2 m to the line below the crown, 9.6 m from the crown upward, 0.6 m
//   outside the cone and 3.4 m from the lens, and none stood inside the ring up to 5 m before the plane.) Flakes never
//   rise above y 169, so none comes into that tube; the last line is taken from lineFrom and the portal (68.06 deg); on
//   the Earth the twilight's cold light on the ice grows toward the north (from 40 km south of the point under the balloon to 140 km
//   north of it), and the broad far tones of the pack are faint within 32 km of that point and full by 196 km (no soft
//   blots on the ice below). Nothing is timed or lit for a seed or a picture.
// THE ICE (orders 13 to 15: the Earth's law below the limb, GLSL_EARTH; what stands above about the ground holds
//   where this section does not say otherwise). A law of PLACE on the ground (km east and south of the point under
//   the balloon, shifted by the ground's own number), of the sight line's DIRECTION and of the world's clock
//   (uNsTime). Nothing in it reads the route, the flight's fraction, the burst, the lens' place, the buffer's size
//   or a look's number; the law's eye stands 38 km over the point under the balloon whatever the lens does.
//   THREE SIZES OF FLOE. GREAT FLOES in cells of 20 km and FLOES in cells of 4 km, both lattices bent by smooth
//   fields; the SMALLEST in cells of 0.8 km on a straight lattice, only in belts about a km broad along the shore
//   of wide water, grey brash and water between them.
//   LEADS. A great floe's joint is open only where the country is open (a smooth field 43 km broad): there a black
//   lead 0.5 to 1.6 km broad at rest, with a strip of lit ice 120 m broad on the shore that faces the moon and of
//   shaded ice on the other. Every great lead breathes by a tenth of its width, and those of under half of the
//   great floes by more than half of it, in 12.6 s of the world's clock. Narrow leads 0.1 to 0.4 km broad part the
//   4 km floes only where the pack is loose; more than half of them are grey, refrozen. Two shear leads (level
//   bands of smooth fields 70 and 170 km broad, some 2 to 3 and 4 to 7 km wide where the field has its mean slope,
//   unequal along them, breathing by three tenths) and a polynya are wide water whose shores are read twice.
//   A GREAT FLOE'S FACE. In each 4 km cell one OLD FLOE, pale, in its own tone, its outline rounded and bent by a
//   1.3 km field: none in about one cell in six, a floe 1 to 4 km across in most, one that fills its cell in a
//   quarter; YOUNGER ICE between them, greyer, 0.16 to 0.26 of albedo under them (1.4 times that on the dark
//   looks); a thin dark SEAM where an old floe reaches its cell's joint. HEALED LEADS: grey smooth bands 0.3 to 1
//   km broad (0.70 of the floe's tone, 0.64 on the dark looks), level lines of two smooth 13 km fields, every
//   great floe its own, that fork and end. THE SNOW'S DRIFT: on the older half of the old floes a faint banding,
//   crests 3 km apart across the wind. Thin young ice (turquoise) is a fifth of the 4 km floes in loose pack. The
//   coast's fast ice carries the old floes, the seams and the healed leads at half their tone.
//   RIDGES, few: a pale line on the side of a joint that faces the moon and a thin shadow on the other. Long ones
//   (about 0.3 km) on the great joints where the country is shut and no lead lies. Short ones (0.2 km) on the 4 km
//   joints only where the pack is pressed AND a smooth 13 km field stands over .66 to .70 (about one joint in
//   seven): there every joint carries one, in crooked chains of every bearing. None on water, in a shore's belt
//   or on a healed lead; none under a footprint of 1.25 km. On the coast's ice cap, short ones on the 4 km joints
//   that lie within 33 degrees of the pressure's bearing.
//   CLOUD STREETS, where they may lie: rows 26 km apart that run toward 56 degrees east of north, across the
//   moon's bearing, each row wandering some 6 km with the country and standing in runs over about two thirds of
//   its length with clear gaps between; a run is up to 3.8 km broad, of small clouds about a km across that slide
//   0.6 km a second of the world's clock along their row. They stand 1.6 km over the ice; a street's shadow lies
//   2.6 km from under it on the side away from the moon and takes 0.30 (no moon) to 0.64 (gibbous) of the light
//   there. Over ice and water alike, never over land. A cloud passes into its row's mean under a footprint of
//   0.6 km and a row into nothing by 4.5 km.
//   LIGHT ON THE ICE, all cold: the moon's key (by the moon's height over the ground there; 0.45 of it on the
//   aurora look), the night's indigo, the sheet's colour, the curtains' green as a tint (the aurora look) and THE
//   TWILIGHT'S LIGHT, a blue-white by the arc's gain that grows toward the north (4 below). No rose and no ember
//   on the ice, near or far. Relief (a lead's two shores, the ridges) takes the key on its lit side and is left
//   with the fill on the other.
//   WATER is black with a faint blue of the sheet. THE MOON'S GLITTER lies on water only (whole from 0.95 of water
//   in the pixel, nothing under 0.6): glints of two scales chosen by the footprint, drifting 0.6 km a second of
//   the world's clock; a glint's light is the moon's strength times (0.2 + 2.2 env), never over 1.4, where env is
//   a skirt (the fourth power of the cosine between the mirrored sight line and the moon, times 0.2), a core (its
//   26th power, times 0.5) and A PATH along the moon's bearing (1.5 degrees across, 8 along, times 0.9): never a
//   disc. THE SKY'S COLOURS lie on water as other facets of the same scales (the curtains' green, the sheet's
//   blue). THE ARC'S SPARKS lie on the open sea alone, where the pixel is open sea AND water (whole from 0.95 of
//   both, nothing under 0.7): never on a floe, on land or on fast ice.
//   THE SPARKS' BOUND: the greatest light they add to what the Earth's law returns is 0.25 (their cap is 0.25
//   divided by the far tone that is laid on after it).
//   THE EARTH'S CAP: nothing the law returns is over 1.8 before the air's haze, whatever tone lies on a glint.
//   THE TERMS THAT READ THE EYE, each named; every one is light or filtering by the sight line's direction, and
//   none hides, fades, thins or moves a thing by its distance from the lens:
//   1. THE FOOTPRINT: a pixel's size on the ground (from fwidth of the direction) filters every form into its own
//      mean before it falls under two pixels; a strip of water, a rim, a ridge, a seam and a healed lead keep a
//      pixel's breadth and thin instead; the far field's forms are filtered by the mean of the footprint's two
//      axes; the glints' two scales are chosen by it; wide water is read a second time, and the smallest cells
//      and the water's light are worked out, only where they can show.
//   2. THE MIRRORED SIGHT LINE (the sight line turned in the ground's own up): the moon's glitter by its angle to
//      the moon; the sky's colours on water by its height and its bearing from north; the arc's sparks by the
//      same; THE ICE'S SHEEN by the same (the sheet's blue, a third of the curtains' green and the arc's
//      brightness as a blue-white: 0.035 of them, up to 0.335 where the mirror grazes). Light that reads the
//      eye's bearing, as a mirror does.
//   3. THE STREET'S CLOUD ALONG THE SIGHT LINE: a cloud is drawn where the sight line passes 1.6 km over the ice,
//      so a row is seen a little beyond the ground it stands over, as a thing above the ice must be; its shadow
//      is by place alone.
//   4. THE TONES KEYED BY PLACE ABOUT THE POINT UNDER THE BALLOON: the twilight's light on the ice is 0.15 of its
//      strength 40 km south of that point and whole by 140 km north of it (up to a quarter more, everywhere, on
//      the dark looks); the far field's broad tones (three fields 110, 43 and 23 km broad, up to 0.72 either way)
//      are 0.3 of themselves within 32 km of that point and whole by 196 km; the sea's edge lies some 22 km to
//      the east-south-east of it and the coast some 24 km to the east-north-east.
//   5. THE AIR (named above): the haze by the length of the sight line to the ground, toward a limb blue that the
//      arc lifts in the north as a pale blue-white.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const D2R = Math.PI / 180;
const PORTAL = [0, 278.5, 0], LINE_FROM = [0, 130.3, 59.7];
const LINE_LEN = Math.hypot(PORTAL[1] - LINE_FROM[1], PORTAL[2] - LINE_FROM[2]);        // 159.77 m
const LINE_DIR = [0, (PORTAL[1] - LINE_FROM[1]) / LINE_LEN, (PORTAL[2] - LINE_FROM[2]) / LINE_LEN];   // the line that is flown: 68.06 degrees up, north
// the envelope's taut profile (height, radius), from the brief
const PROFILE = [[60, 0.7], [80, 14], [100, 27], [120, 37], [135, 43.5], [145, 45], [162, 41.7], [177, 32], [186, 18], [190, 2.6]];
// the brief's eight camera poses: t seconds, z south, y up, gaze pitch and heading (degrees; heading 0 north, 90 east)
const POSES = [[0, 5, 0.5, -62, 90], [8, 11, 2, -58, 90], [11, 16, 12, -10, 45], [14, 24, 30, 20, 0], [19, 48, 58, 22, 0], [24, 62, 86, 34, 0], [28, 62, 113, 52, 0], [30, 59.7, 130.3, 68, 0]];

const GLSL_BASE = /* glsl */`
uniform float uNsTime;
uniform vec3 uNsMoonDir;
uniform vec4 uNsMoon;      // x key light 0..1, y phase (0 gibbous .. 1 crescent), z disc 0|1, w lift of dark looks
uniform vec4 uNsTwi;       // x arc gain, y arc height scale, z ember gain, w red shift of the ember
uniform vec4 uNsSheet;     // x gain, y shadow edge (km south of the zenith), z softness of the edge (km), w light left in the shadow
uniform vec4 uNsDisp;      // x bands, y billows, z whirl twist, w veil
uniform vec4 uNsDark;      // x star gain, y Milky Way, z aurora, w seed
uniform vec4 uNsBelow;     // x ice edge 0|1, y coast 0|1, z ice light, w seed
uniform vec4 uNsWhirl[4];  // xy centre (km east, km south), z radius km, w turn
uniform vec3 uNsColA;      // the sheet overhead
uniform vec3 uNsColB;      // the sheet lower down
const vec3 NS_PORTAL = vec3(0., .927568, -.373656);
const float NS_LIMB = -.10873;   // sine of the horizon's dip from 38 km
float nsH1(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
vec2 nsH2(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float nsH3(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float nsVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(nsH1(i), nsH1(i + vec2(1., 0.)), f.x), mix(nsH1(i + vec2(0., 1.)), nsH1(i + vec2(1., 1.)), f.x), f.y); }
float nsFbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * nsVn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= .5; } return s; }
float nsFbm2(vec2 p){ return .65 * nsVn(p) + .35 * nsVn(p * 2.1 + vec2(5.3, 1.7)); }
// cells: x distance to the nearest site, y distance to the edge between the two nearest (cell units), z the cell's own number
vec3 nsVor(vec2 p){ vec2 i = floor(p), f = fract(p), gw = vec2(0.); float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 r = g + nsH2(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; gw = g; } else if (d < d2) { d2 = d; } }
  return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), nsH1(i + gw + 7.7)); }
float nsG(float a, float c, float s){ float x = (a - c) / s; return exp(-x * x); }
// stars: one hashed cell of a cube's face per sample; a soft disc never under a pixel and a half (fw: footprint, radians)
float nsStarLayer(vec3 d, float n, float fw, float dens, out float tint){
  vec3 ad = abs(d); vec3 q = d / max(max(ad.x, ad.y), ad.z) * .9995; vec3 c = floor(q * n);
  float h = nsH3(c + 3.7); tint = nsH3(c + 11.3);
  vec3 sp = normalize((c + .5 + .72 * (vec3(nsH3(c + 1.1), nsH3(c + 5.9), nsH3(c + 8.3)) - .5)) / n);
  float mag = pow(max(nsH3(c + 23.1), 0.), 6.) * .93 + .07;
  float r0 = (.05 + .09 * mag) / n, r = max(r0, fw * 1.25), ang = length(d - sp);
  float tw = .7 + .3 * sin(uNsTime * (1.5 + 5. * tint) + h * 50.);
  return step(h, dens) * (1. - smoothstep(r * .3, r, ang)) * mag * tw * clamp((r0 * r0) / (r * r) * 6., .25, 1.); }
// value noise in four octaves, each faded where it falls under two pixels (fk: the footprint in p's own units)
float nsFbmF(vec2 p, float fk){ float s = 0., a = .5, f = 1.;
  for (int i = 0; i < 4; i++) { s += a * mix(.5, nsVn(p), 1. - smoothstep(.2, .55, fk * f)); p = p * 2.03 + vec2(17.1, 9.2); a *= .5; f *= 2.03; } return s; }
// gradient noise with a quintic fade, about 0..1: no lattice crease, so a patch cut from it has no straight edge or corner
float nsGn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6. - 15.) + 10.);
  float a = dot(nsH2(i) - .5, f), b = dot(nsH2(i + vec2(1., 0.)) - .5, f - vec2(1., 0.));
  float c = dot(nsH2(i + vec2(0., 1.)) - .5, f - vec2(0., 1.)), e = dot(nsH2(i + vec2(1., 1.)) - .5, f - vec2(1., 1.));
  return clamp(.5 + 1.9 * mix(mix(a, b, u.x), mix(c, e, u.x), u.y), 0., 1.); }
// the same in three octaves, each turned, each faded to its mean where it falls under two pixels (fk: footprint in p's units)
float nsGf(vec2 p, float fk){ float s = 0., a = .57, f = 1.;
  for (int i = 0; i < 3; i++) { s += a * mix(.5, nsGn(p), 1. - smoothstep(.2, .55, fk * f)); p = mat2(1.62, 1.22, -1.22, 1.62) * p + vec2(17.1, 9.2); a *= .5; f *= 2.03; } return s; }
// a crisp train of ripples: crests L km apart across n (unit). Smooth noise bends the phase (wob cycles), so the crests
// wander, fork and end. Where L falls under two pixels (fk) the train passes into its own mean, in every direction alike:
// it is never drawn out along one direction.
float nsRip(vec2 p, vec2 n, float L, float wob, float sd, float ph, float fk){
  float w = (nsGn(p / (L * 4.5) + sd) - .5) * wob + (nsGn(p / (L * 17.) + sd * 1.7) - .5) * wob * 5.;
  float s = .5 + .5 * sin((dot(p, n) / L + w) * 6.2832 + ph);
  return mix(.5, mix(s, s * s * (3. - 2. * s), .35), 1. - smoothstep(.2, .5, fk / L)); }
`;

const GLSL_SHEET = /* glsl */`
// the twilight arc. a: degrees above the limb, cn: cosine of the bearing from the sun's (north, drifting east)
vec3 nsArc(float a, float cn){
  // ONE GLOW (order 6): no layer, no band, no edge anywhere. Five tones stand at five heights; every height takes a
  // smooth blend of all five (weights that never rest, so no tone holds flat) under one falling brightness: the ember
  // hot and thin on the limb, rose-gold within a degree or two, pale gold, turquoise from 3 to 6 degrees, thinning
  // upward into the deep blue of the night. Brightest due north, dying east and west.
  float h = .6 + .35 * uNsTwi.y, am = max(a, 0.), x = am / h, w = smoothstep(-.55, 1., cn); w = w * w * (.3 + .7 * w);
  float w0 = exp(-x * x * 1.2), w1 = nsG(x, 1.3, 1.05), w2 = nsG(x, 2.8, 1.35), w3 = nsG(x, 4.7, 1.9), w4 = nsG(x, 8.4, 2.9);
  vec3 em = mix(vec3(1., .19, .03), vec3(1., .08, .02), uNsTwi.w) * uNsTwi.z;
  vec3 c = (em * w0 + vec3(1., .30, .16) * .78 * w1 + vec3(1., .68, .34) * .55 * w2 + vec3(.05, .60, .56) * .56 * w3 + vec3(.004, .05, .20) * .12 * w4)
    / (w0 + w1 + w2 + w3 + w4 + 1e-4) * exp(-x * x / ((x + 6.) * 9.));
  vec3 blue = vec3(.016, .06, .34) * .44 * exp(-am / (10. * h));
  return (c * w + blue * (.14 + .86 * w)) * uNsTwi.x;
}
// the moon: a disc 0.9 degrees in radius (art's licence), its phase, earthshine and a small halo
vec3 nsMoonDisc(vec3 d, float fw){
  float ca = dot(d, uNsMoonDir), ang = sqrt(max(2. - 2. * ca, 0.)), R = .0157;
  float disc = 1. - smoothstep(R - fw, R + fw, ang);
  vec3 ex = normalize(cross(vec3(0., 1., 0.), uNsMoonDir)), ey = cross(uNsMoonDir, ex);
  vec3 rel = d - uNsMoonDir * ca; vec2 uv = vec2(dot(rel, ex), dot(rel, ey)) / R;
  vec3 n = vec3(uv, sqrt(max(1. - dot(uv, uv), 0.)));
  vec3 sl = normalize(mix(vec3(-.55, -.35, .76), vec3(-.62, -.42, -.66), uNsMoon.y));
  float lit = smoothstep(-.02, .12, dot(n, sl)), mare = .74 + .26 * nsFbm2(uv * 2.3 + 4.);
  vec3 c = vec3(.95, .97, 1.) * (1.7 * lit * mare) + vec3(.05, .07, .11) * (.25 + uNsMoon.y);
  float halo = exp(-ang * 24.) * .09 + exp(-ang * 95.) * .28;
  return (c * disc + vec3(.5, .62, .9) * halo * (1. - disc) * (1. - .7 * uNsMoon.y)) * uNsMoon.z;
}
// THE SHEET's density (about 1 in a luminous field, 0 in clear night). p: km east and km south on the shell 45 km
// overhead, fk: a pixel's footprint there in km, calm 0..1: the structure gives way to a smooth glowing veil; low 0..1 (by
// direction, toward the limb): the cover closes, so the bright band over the limb has no hole.
// SCALE BY THE SHEET'S OWN PLANE (order 4): billows are soft rolls 8 km apart (10 degrees overhead) with a wispy grain
// along them and a darker trough beside each; bands 40 km apart cross them at 70 degrees; knots where crests cross;
// whirls 30 to 38 km wide wind the rolls into loose open spirals; between the fields featureless veil, then clear night.
// On the lighter looks each roll carries short ribs 2.8 km apart across its length (order 5); nothing finer is drawn.
// Where a train's wave falls under fourteen pixels it fades, and by five it has passed into its own mean, a smooth
// bright veil: no fine, evenly spaced line is drawn anywhere, and toward the limb only broad unequal bands are left.
float nsF(float fk, float L){ return 1. - smoothstep(.2, .5, fk / L); }
// the sheet's own trains go sooner (order 5): whole while a wave spans fourteen pixels, gone at five, so that no fine,
// evenly spaced line is ever drawn; what is left is the train's mean, a smooth veil
float nsFs(float fk, float L){ return 1. - smoothstep(.07, .2, fk / L); }
float nsSheet(vec2 p, float fk, float calm, float low){
  float t = uNsTime, sd = uNsDark.w, core = 0.;
  p.x -= t * (.45 + .002 * p.y);                                    // the whole pattern shears east
  for (int k = 0; k < 4; k++) {                                     // the whirls: the domain wound round four centres
    vec4 w = uNsWhirl[k]; vec2 r = p - w.xy; float s = max(1. - length(r) / w.z, 0.);
    float a = w.w * uNsDisp.z * s * s * (1.2 + .01 * t), ca = cos(a), sa = sin(a);
    p = w.xy + vec2(ca * r.x - sa * r.y, sa * r.x + ca * r.y); core = max(core, s); }
  // the cover: cloud, a thin veil round it, clear night beyond; every bound soft and irregular
  float big = nsGf(p / 120. + sd, fk / 120.) - .04 - .03 * smoothstep(.6, 1.15, uNsTwi.y);   // (order 5: on the lighter looks more of the sky is clear night)
  float wh = .75 * smoothstep(0., .9, core);                         // a whirl carries cloud, with veil in it
  float body = max(mix(smoothstep(.32, .56, big), 1., low), wh), veil = max(mix(smoothstep(.20, .42, big), 1., low), wh);
  float tone = mix(1., .68 + .64 * nsGn(p / 53. + 2. + sd), nsFs(fk, 53.));
  vec2 wq = p + (vec2(nsGn(p / 85. + 3.1), nsGn(p / 85. + 7.7)) - .5) * 44. * nsFs(fk, 85.);
  // the bands: crests 40 km apart, a slow swell of light (the faster train)
  float sbn = .5 + .5 * sin(dot(wq, vec2(.574, .819)) * (6.2832 / 40.) - t * .17), band = mix(.5, sbn, nsFs(fk, 40.));
  // the billows: rolls 8 km apart at 70 degrees to the bands (the slower train), gently bent, forking, ending. Both trains
  // lie 35 degrees off east-west, one either way: toward the northern limb perspective squeezes them into herringbone
  vec2 nb = vec2(-.574, .819);
  float wb = (nsGn(p / 30. + 21.) - .5) * 1.3 + (nsGn(p / 104. + 35.7) - .5) * 3.2;
  float cyc = dot(p, nb) / 8. + wb + t * .0557, sr = .5 + .5 * sin(cyc * 6.2832), al = dot(p, vec2(.819, .574));
  float bead = smoothstep(.30, .62, nsGn(vec2(floor(cyc + .25) * 3.7, al / 15.) + 13.));          // each roll waxes and wanes along its own length
  float fib = (nsGn(vec2(cyc * 7.3, al / 5.) + 9.) - .5) * nsF(fk, 1.1);   // the grain runs along the roll
  // (order 5, the lighter looks) A ROLL IS RIPPLED CLOUD: short ribs 2.8 km apart stand across its length, on its crest,
  // in patches, each roll's out of step with the next; like every train they go into their mean before five pixels
  float rp = .5 + .5 * sin((al / 2.8 + 1.9 * nsGn(vec2(cyc * .9, al / 19.) + 4.)) * 6.2832);
  float ribs = mix(1., .5 + rp, smoothstep(.24, .50, nsGn(p / 17. + 23. + sd)) * nsFs(fk, 2.8) * smoothstep(.6, 1.15, uNsTwi.y));
  float roll = mix(.39, clamp(sr * sr * (1.4 - .4 * sr) * (1. + 1.2 * fib) * ribs + .22 * fib, 0., 1.3), .25 + .75 * bead);
  // where the rolls are too fine to draw, the same train's longer swell (20 km) still ribs the cloud; then its mean
  float sw = .5 + .5 * sin(cyc * 2.5133 + 1.3);
  roll = mix(mix(.39, .14 + .66 * sw * sw, nsFs(fk, 20.)), roll, nsFs(fk, 8.));
  // the fields: where billows stand, where bands run; elsewhere bare veil. No two quarters of the sky alike.
  float gb = max(smoothstep(.33, .55, mix(.5, nsGn(p / 33. + vec2(31., 7.) + sd), nsFs(fk, 33.)) + (uNsDisp.y - 1.) * .12 + .3 * low), wh) * (1. - .6 * core * core);
  float gn = smoothstep(.36, .60, mix(.5, nsGn(p / 71. + 11. + sd), nsFs(fk, 71.)) + (uNsDisp.x - .8) * .15 + .3 * low);
  float kb = clamp(.62 + .28 * uNsDisp.y, 0., 1.), kn = clamp(.2 + .55 * uNsDisp.x, 0., .9);
  // a band is rippled cloud (order 5): on its crest the rolls stand across its length, whether a billow field is there or not
  float rib = max(gb, .85 * gn * smoothstep(.35, .8, band));
  float B = mix(1., .45 + 1.1 * band, gn * kn), R = mix(1., .44 + 1.42 * roll, rib * kb);
  float knot = 1. + .45 * gb * gn * roll * band;                    // knots where crests cross
  float thin = mix(1., .55, smoothstep(.6, 1.15, uNsTwi.y));        // the lighter looks: less veil, so the gaps are night
  float den = .26 * veil * (.6 + .4 * uNsDisp.w) * thin + body * tone * .86 * B * R * knot;
  // toward the limb, where every train has gone into its mean: only broad, soft, unequal bands (two great slow fields)
  den *= mix(1., (.74 + .52 * nsGn(p / vec2(560., 300.) + sd + 5.)) * (.90 + .20 * nsGn(p / vec2(170., 950.) + 9.)), low);
  return mix(den, .58 + .10 * nsGn(p / 170.), calm);
}
`;

const GLSL_EARTH = /* glsl */`
// a strip of water |s| < w0 with a crisp shore (a: a pixel, in s's units); under a pixel it keeps a pixel's width and thins
float nsCut(float s, float w0, float a){ float w = max(w0, a); return (1. - smoothstep(w - .6 * a, w + .6 * a, s)) * min(w0 / w, 1.); }
// WIDE WATER cut by smooth fields (order 5): two long shear leads that wind across the whole view (bent at 11 km, so
// none runs straight; wk: their width, unequal along them) and a polynya. j: a fine noise that makes every shore
// irregular. x: the water, crisp to the pixel; y: its middle, clear of the shore; z: the polynya's own field
vec3 nsWide(vec2 q, float j, float wk, float fk, float fm, float off, out vec2 zn){
  float kn = nsGn(q / 11. + 1.) - .5, pn = nsGn(q / 36. + 17.) + .22 * kn + .010 * j;
  float s1 = abs(nsGn(q / 70. + 5.) - .5 + .07 * kn + .0035 * j), s2 = abs(nsGn(q / 170. + 9.) - .47 + .04 * kn + .0018 * j);
  float a1 = fk * .017, a2 = fm * .007, ap = fk * .02 + 1e-4, k1 = nsF(fk, 1.4), k2 = nsF(fm, 3.5), kp = nsF(fk, 12.);
  float m = max(max(nsCut(s1, wk, a1) * k1, nsCut(s2, wk, a2) * k2), smoothstep(.72 - ap, .72 + ap, pn) * kp);
  float mid = max(max(nsCut(s1, wk * .5, a1) * k1, nsCut(s2, wk * .5, a2) * k2), smoothstep(.735 - ap, .735 + ap, pn) * kp);
  // (order 13) zn.x: the shore's belt, about a km of broken pack along a shear lead. (order 14) zn.y: over 0 wherever
  // any of this water can lie within off km of q (bounds by the three fields' steepest slopes), so the Earth reads
  // the water a second time only there
  zn = vec2(max(1. - smoothstep(wk + .004, wk + .013, s1), 1. - smoothstep(wk + .002, wk + .0055, s2)),
    max(max(wk + .027 * fk + .0454 * off + .006 - s1, wk + .0112 * fk + .021 * off + .003 - s2), pn - .704 + ap + .105 * off));
  return vec3(m, mid, pn);
}
// (order 13) cells as nsVor, and n: the unit direction from the cell's own site toward its nearest neighbour's, across
// the joint between them (so the Earth knows which shore of a lead, which side of a ridge, faces the moon)
vec3 nsVorE(vec2 p, out vec2 n){ vec2 i = floor(p), f = fract(p), gw = vec2(0.), r1 = vec2(0.), r2 = vec2(0.); float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 r = g + nsH2(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; r2 = r1; d1 = d; r1 = r; gw = g; } else if (d < d2) { d2 = d; r2 = r; } }
  n = normalize(r2 - r1 + 1e-5);
  return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), nsH1(i + gw + 7.7)); }
// (order 13) A GREAT LEAD'S WIDTH, in the great lattice's cell units (z: the great floe's own number, og: the country's
// openness there, a smooth field by place, t: the world's clock). Where the country is pressed shut the joint has no
// water (it may carry a ridge); where it is open the lead is 0.5 to 1.6 km wide. EVERY great lead breathes by a
// tenth by the clock, and the leads of under half of the great floes OPEN AND CLOSE by more than half their width,
// in 12.6 s of the world's clock.
float nsLw(float z, float og, float t){
  return .080 * smoothstep(.45, .59, og + .16 * (z - .5)) * (.3 + .7 * fract(z * 9.1)) * (1. + (.10 + .45 * step(.55, fract(z * 5.3))) * sin(t * .5 + z * 40.)); }
// (order 13) CLOUD STREETS over the pack, by place: rows of small low cloud 26 km apart that run east-north-east,
// across the moon's bearing, and wander with the country (w: a smooth field by place, handed in); each row stands in
// runs with clear gaps between (hw: the row's half width there, km, handed in); in a run small crisp clouds about a
// km across lie along the row's line, a row one to three clouds wide. The clouds slide along their rows at 0.6 km a
// second of the world's clock. x: km on the Earth, fk: the footprint. Under three pixels a cloud passes into its
// row's mean (a faint pale line), and that into nothing before a row is a few pixels wide.
float nsStreet(vec2 x, float w, float t, float fk){
  float a = dot(x, vec2(.83, -.56)) - t * .6, c = dot(x, vec2(.56, .83)), cw = c / 26. + w, row = floor(cw), r = abs(fract(cw) - .5) * 26.;
  float hw = 1.9 * smoothstep(.42, .56, nsGn(vec2(a / 30. + row * 3.7, row * 7.3) + 5.)) + 1e-3;
  float e = fk * .25 + .012, k = nsGn(vec2(a / 1.7 + row * 1.3, c / 1.3) + 71.) - .53 - .34 * (r / hw) * (r / hw);
  return mix(.25 * (1. - smoothstep(.4 * hw, hw, r)), smoothstep(-e, e, k), nsF(fk, 1.2)) * nsF(fk, 9.) * step(.05, hw);
}
// THE RANGE (order 7): separate massifs standing out of an ice field, each a long ridge lying ACROSS the coast (one in
// each cell 7 km by 17, bent by w), of very unequal size (some fill their cell and join their neighbours into a range,
// some are small nunataks; mass 0..1 sinks them away into ice cap). The height 0..1, falling evenly from the crest
// line to the foot.
float nsRange(vec2 q, vec2 w, float mass){
  vec3 v = nsVor((vec2(q.x * .6 + q.y * .8, q.x * .8 - q.y * .6) + w) / vec2(7., 17.) + 41.);
  return clamp(1. - v.x / ((.17 + .66 * v.z * v.z) * mass + .02), 0., 1.);
}
// THE EARTH. p: km east and km south on the ground, fk: a pixel's footprint there (km), dist: km along the sight line,
// d: the sight line, up: the ground's own up, cn: cosine of the bearing from north
vec3 nsEarth(vec2 p, float fk, float dist, vec3 d, vec3 up, float cn){
  float t = uNsTime; vec2 q = p + uNsBelow.w * 37.;
  // the far field's forms are filtered by the mean of the footprint's two axes, so they keep their shape toward the limb
  float fm = fk * sqrt(max(-dot(up, d), .03));
  float f1 = nsF(fm, 20.), f2 = nsF(fk, 4.), f3 = nsF(fk, 2.2), f4 = nsF(fk, .7), f5 = nsF(fk, .8);
  vec2 md = uNsMoonDir.xz / max(length(uNsMoonDir.xz), 1e-3);                            // toward the moon, along the ground
  // the country differs across the view: ground to brash (belt), or pressed tight (rz: there the leads are hairlines)
  float bn = nsGn(q / 19. + 21.);
  float rzn = nsGn(q / 23. + 9.), belt = smoothstep(.52, .64, bn), rz = smoothstep(.40, .62, rzn);
  // (ORDER 13) THREE SIZES OF FLOE, each with its own kind of lead.
  // GREAT FLOES about 20 km across (v1, bent by a smooth noise). Their joints are OPEN only where the country is open
  // (og, a smooth field 43 km broad): there a WIDE BLACK LEAD 0.5 to 1.6 km broad that winds with the joint, narrows
  // and ends where the country closes (never a net of equal meshes), a lit rim on its shore that faces the moon and a
  // shaded one on the other; where the country is shut a joint may carry a ridge.
  // Within the great floes, FLOES about 4 km across (v2) parted by NARROW, FLAT leads 0.1 to 0.4 km broad, more than
  // half of them grey refrozen: only in the loose parts of the pack (om: where the country is not pressed, and by the
  // great floe's own number); elsewhere the great floe's face is QUIET. The SMALLEST, about 0.8 km (v3), only where
  // the pack is broken: a belt about a km broad along the shore of a great lead or a shear lead; grey brash and
  // water lie between them.
  vec2 g13 = vec2(nsGn(q / 13.), nsGn(q / 13. + 7.3)), wp1 = (g13 - .5) * 8. * f2, nA, nB;
  vec3 v1 = nsVorE((q + wp1) / 20., nA);
  vec2 wp2 = (vec2(nsGn(q / 5.3 + 3.), nsGn(q / 5.3 + 11.)) - .5) * 1.8 * f3;
  vec3 v2 = nsVorE((q + wp2) / 4. + 13., nB);
  float a1 = fm / 20. + .003, a2 = fk / 4. + .006;                 // every edge is soft at the pixel
  float og = nsGn(q / 43. + 31.), w1 = nsLw(v1.z, og, t);                                // the great leads' width breathes
  float om = 1. - smoothstep(.37, .50, rzn + .30 * (fract(v1.z * 3.3) - .5));
  float w2 = .10 * om * (.45 + .55 * fract(v2.z * 7.7)) * (.8 + .2 * sin(t * .31 + v2.z * 40.));
  float l1 = nsCut(v1.y, w1, a1) * f1, l2 = nsCut(v2.y, w2, a2) * f2;
  // WATER IN ICE (order 5): the shear leads and the polynya are cut crisp, their shores irregular. Every shore of this
  // wide water is read a second time a step AWAY from the moon (e km, never under a pixel): water here with ice behind
  // it is the shore that faces the moon, a thin bright rim of rafted ice; ice here with water behind it is the shore
  // that faces away, in its own shadow. Brash lies along both shores; the middle of the water is open and black.
  float jn = nsGn(q / 1.3 + 2.), jf = nsGn(q / .45 + 6.), jj = jn - .5 + .6 * (jf - .5) * f4, wk = (.005 + .011 * bn) * (1. + .3 * sin(t * .45 + rzn * 12.)), off = max(.13, fk * 1.1); vec2 zn, znl;   // (order 13: the shear leads breathe too, stretch by stretch)
  vec2 ql = q - md * off;
  vec3 W0 = nsWide(q, jj, wk, fk, fm, off, zn), Wl = vec3(0.);
  if (fk < 1.25 && zn.y > 0.) Wl = nsWide(ql, jj, wk, fk, fm, off, znl);   // (order 14: read a second time only where a rim can be; a rim is gone by a footprint of 1.25 km)
  float pn = W0.z, pol = smoothstep(.71, .73, pn) * nsF(fk, 12.), polcore = smoothstep(.745, .80, pn);
  float wide = max(l1, W0.x);                                                            // wide water: it carries new ice and brash
  // (order 8) THE RIMS OF A LEAD STAND ON ITS ICE, NEVER ON ITS WATER. (order 13) A great lead's rims are a strip of
  // its ice 120 m broad: lit where the water lies toward the moon (s1: the joint's own bearing against the moon's),
  // shaded where it lies away. A narrow lead has no rim.
  float s1 = dot(nA, md), s2 = dot(nB, md), has = smoothstep(.004, .012, w1);
  float band = (nsCut(v1.y, w1 + .012, a1) * f1 - l1) * has;
  float shore = max(wide, l2), fsh = nsF(fk, 2.5), rimW = clamp(W0.x - Wl.x, 0., 1.) * fsh;
  float rimL = max(rimW, band * smoothstep(.1, .5, s1) * (1. - shore) * fsh), rimS = max(band * smoothstep(.1, .5, -s1), Wl.x) * (1. - shore) * fsh;
  float mid = max(nsCut(v1.y, w1 * .5, a1) * f1, W0.y);                                  // the middle of wide water
  // THE SMALLEST FLOES: the belt along a great lead's shore and along a shear lead
  float brk = clamp(max((1. - smoothstep(w1 + .05, w1 + .12, v1.y)) * has * f1, zn.x), 0., 1.) * (1. - wide);
  vec3 v3 = vec3(0.); if (brk > 0.) v3 = nsVor(q / .8 + 5.); float a3 = fk * .75 + .01;   // (order 14: read only in their belts)
  float sm = mix(.66, smoothstep(.15 - a3, .15 + a3, v3.y), f5), smz = mix(.5, v3.z, f5);
  float gap = brk * (1. - sm);                                                           // brash and water between the smallest floes
  float lead = max(max(wide, l2), gap) * (1. - rimW);
  float newi = smoothstep(.57, .62 + fk * .2, nsGn(q / 2.3 + 4.) + .03 * jj);                                // (order 5: new ice lies in plates with an edge, not in soft blots)
  float refr = max(max(wide * newi * f3 * .55, pol * smoothstep(.52, .57 + fk * .1, nsGn(q / 6.1 + 4.) + .03 * jj) * (1. - .5 * polcore)), l2 * (1. - wide) * step(.45, fract(v2.z * 5.1)));   // grey new ice; (order 13) more than half of the narrow leads are grey, refrozen; the great leads are open and black
  // brash: graded grey rubble adrift in wide water (a smooth field, never single cells), and thick along every shore
  float rub = smoothstep(.40, .60, bn + .15 * (belt - .5)) * (.62 + .38 * jn) * f3;
  float brash = max((wide - mid) * mix(.45, smoothstep(.40, .58, jf), f4) * fsh, gap * .6);
  // (ORDER 14) A GREAT FLOE'S FACE HAS A LIFE OF ITS OWN AT A MIDDLE SIZE, all of it by place on the Earth.
  // PIECES: a great floe is many OLD FLOES FROZEN TOGETHER. In each 4 km cell lies one old floe, pale with snow, each
  // in its own tone (tf), with a rounded, irregular outline of its own: by the cell's number and by the country (r0)
  // none at all in one cell of six, a floe 1 to 4 km across in most, and in a quarter one that fills its cell and
  // has grown into its neighbours (few and scattered where bn is low, crowded where it is high). Between the old
  // floes lies YOUNGER ICE, greyer and smooth. Where an old floe reaches its cell's joint, a SEAM (a thin dark healed
  // crack) lies along it. So the pieces are of unlike size and outline, and never a net of equal meshes.
  float tf = fract(v2.z * 3.3), jr = .25 * (jn - .5) * f3, eo = a2 * 1.2, fp = nsF(fk, 5.);
  float r0 = -.05 + .95 * fract(v2.z * 5.7) + .30 * (bn - .35);
  float fo = max(1. - smoothstep(r0 - eo, r0 + eo, v2.x + jr), om);   // (in loose pack a cell is one whole floe)
  float dk = max(uNsDark.z, 1. - uNsMoon.x);
  // HEALED LEADS: bands 0.3 to 1 km broad of younger, greyer, smooth ice that cross a great floe from edge to edge,
  // every great floe its own (level lines of the two smooth 13 km fields, at a level by the floe's own number, so
  // they wind and stop at the floe's edge). The second leaves the first on one side only (a fork); the first thins
  // to a point and ends where the country is pressed. Under a pixel a band keeps a pixel's breadth and thins.
  float lv = .38 + .24 * fract(v1.z * 11.3), ah = fk * .048 + .002, hwd = .008 + .018 * fract(v1.z * 17.9);
  float hsa = abs(g13.x - lv + .008 * jj), hsb = abs(g13.y - 1. + lv + .008 * jj), fh = nsF(fk, 6.);
  float heal = max(nsCut(hsa, hwd * smoothstep(.28, .40, rzn + .2 * (fract(v1.z * 7.1) - .5)), ah), nsCut(hsb, hwd * .7, ah) * smoothstep(lv - .01, lv + .02, g13.x)) * fh * (1. - brk);
  // RIDGE LINES, FEW AND OF EVERY BEARING: a fine pale line on the side of a joint that faces the moon and a thin
  // shadow on the other. LONG ones on the great joints where the country is shut. Within a great floe a ridge stands
  // only in the few places where the pieces were pressed together (the smooth 13 km field stands high there: about
  // one joint in seven): there every joint carries one, so the ridges stand in crooked chains 5 to 10 km long that
  // bear as the pieces' joints bear, each way. Never on water or on a healed lead.
  float shut = (1. - smoothstep(.45, .59, og + .16 * (v1.z - .5))) * f1 * fsh;
  float rs0 = smoothstep(.80, .90, abs(dot(nB, normalize(md + .45 * vec2(-md.y, md.x))))) * f2 * fsh, rsel = smoothstep(.66, .70, g13.y) * (1. - om) * f2 * fsh;   // (rs0: the joints that lie across the pressure; read by the coast's ice cap alone)
  float rd2 = nsCut(v2.y, .05, a2) * (1. - smoothstep(-.3, .2, s2)), rh2 = nsCut(v2.y, .07, a2) * smoothstep(0., .5, s2);
  float rdg = max(nsCut(v1.y, .014, a1) * shut * (1. - smoothstep(-.3, .2, s1)), rd2 * rsel);
  float rsh = max(nsCut(v1.y, .020, a1) * shut * smoothstep(0., .5, s1), rh2 * rsel);
  rdg *= (1. - shore) * (1. - brk) * (1. - heal); rsh *= (1. - shore) * (1. - brk) * (1. - heal);
  float seam = nsCut(v2.y, .022, a2) * fo * f2 * (1. - rsel) * (1. - heal);
  // RELIEF: the two shores of wide water and the ridge lines (a floe's face is quiet)
  float sunk = clamp(.5 * rimL - .6 * rimS + .55 * rdg - .5 * rsh, -1., 1.);
  // thin young ice (turquoise): whole floes of it, a fifth of the 4 km floes where the pack is loose (order 7: by the
  // floe, so it has the floe's own crisp edge and is no soft patch)
  float thinI = step(.80, fract(v2.z * 9.7)) * om * (1. - rz) * f2;
  // (ORDER 14) THE TONES OF A FACE: the great floe's own (gt); an old floe paler by its own number, the younger ice
  // between darker (wider apart on the dark looks, dk, so that the sizes read by the sky's light alone); THE SNOW'S
  // DRIFT on the older half of the old floes (dr: faint bands 1.6 km broad that lie along the wind, the streets'
  // own bearing, and wander a little with the country); the seam; the healed lead (greyer than the younger ice, and smooth). Each
  // passes into its own mean under its footprint.
  float dr = .5 + .5 * sin(dot(q, vec2(.56, .83)) * 2. + 6. * g13.x + 4. * g13.y);   // crests 3 km apart across the wind, bent by the two smooth 13 km fields
  float gt = (.60 + .20 * (fract(v1.z * 7.3) - .5) * f1) * (1. - .02 * (1. - fh));
  float alb = gt + (mix(-.12, .04 + .10 * tf, fo) * (1. + .4 * dk) + .10 * (dr - .5) * fo * smoothstep(.45, .65, tf) * nsF(fk, 1.6)) * (1. - thinI) * fp
    - .12 * thinI + .16 * (smz - .5) * brk;
  alb = mix(alb * (1. - .4 * seam), gt * (.70 - .06 * dk), heal * (1. - thinI));
  // THE ICE EDGE (below 'edge'): a black sea to the east-south-east; the pack breaks into floes toward it and its brash
  // is drawn out in streamers and wound into spiral eddies (the domain turned round one centre in each 30 km cell)
  float sea = 0.;
  if (uNsBelow.x > .5) {
    vec2 ce = floor(q / 30.), cc = (ce + .5 + (nsH2(ce + 3.) - .5) * .24) * 30., r = q - cc;
    float s = max(1. - length(r) / 11., 0.), ang = (nsH1(ce + 9.) > .5 ? 1. : -1.) * 5.5 * s * s, ca = cos(ang), sa = sin(ang);
    vec2 qe = cc + vec2(ca * r.x - sa * r.y, sa * r.x + ca * r.y) + (vec2(nsGn(q / 37. + 3.), nsGn(q / 37. + 8.)) - .5) * 34.;
    vec2 qs = vec2(dot(qe, vec2(.6, -.8)), dot(qe, vec2(.8, .6)));
    float sv = (p.x * .8 + p.y * .6) - 22. + (nsFbm(q / 70.) - .47) * 64. + (nsGn(qe / 12.) - .5) * 20.;   // km out to sea
    float conc = 1. - smoothstep(-8., 36., sv), loose = smoothstep(-16., 0., sv);          // how much of the sea still carries ice
    float stream = mix(.5, nsGn(qs / vec2(17., 1.5) + 4.), nsF(fk, 1.5)) * .62 + nsGn(qs / vec2(5., .9) + 8.) * .38 * f4;
    float icy = smoothstep(.98 - 1.0 * conc, 1.20 - 1.0 * conc, stream) * mix(1., .25 + .75 * smoothstep(.36, .60, jn), .85 * f3);   // streamers of brash: grains, not drawn lines
    float floe = smoothstep(.05, .09 + a2, v2.y) * step(fract(v2.z * 13.7), conc * 1.25) * f2;   // floes broken from the pack
    sea = loose * (1. - max(icy, floe)); alb = mix(alb, .46, loose * (1. - floe) * .7); }
  float water = clamp(max(lead * (1. - refr), sea), 0., 1.);
  float mu = max(dot(up, uNsMoonDir), 0.);
  // (order 7) NIGHT ON THE GROUND. The ice is lit only by what stands over it: the moon (less than half of it on the
  // darkest look, where the sky's own light leads), the night's indigo, the sheet's colour from overhead, the
  // curtains' green as a faint tint (the darkest look) and the twilight's cold light. (ORDER 13: NO WARM COLOUR ON
  // THE ICE: the arc's rose and ember do not light it, near or far.)
  vec3 key = vec3(.78, .87, 1.) * (.42 * uNsMoon.x * (.22 + mu)) * (1. - .55 * uNsDark.z);
  // (ORDER 14) THE TWILIGHT'S LIGHT ON THE ICE IS COLD: the arc lights the ice by the world's own arc gain and BY
  // PLACE (growing toward the north: nk is 0 some 40 km south of the point under the balloon, 1 by 140 km north of
  // it), as the sum of the twilight sky, a blue-white: never rose. On the dark looks there is more of it, near and
  // far alike (uNsMoon.w).
  float nk = smoothstep(-40., 140., -p.y);
  vec3 fill = vec3(.075, .09, .30) * .20 + uNsColA * .07 * uNsSheet.x + vec3(.08, .95, .40) * .030 * uNsDark.z + vec3(.82, .90, 1.) * .075 * uNsTwi.x * (.15 + .25 * uNsMoon.w + .85 * nk);   // (more of it near at hand on the dark looks: the lift of dark looks)
  vec3 tintI = mix(mix(vec3(.72, .78, 1.), vec3(.28, .78, .86), thinI * .42), vec3(.80, .84, .94), heal * .7);   // pale indigo and ice-blue; turquoise where the ice is thin; (order 14) a healed lead is greyer
  // relief takes the key on its moonlit side and is left with the indigo fill on its shadow side
  vec3 ice = alb * tintI * (key * clamp(1. + 1.5 * sunk, .12, 2.4) + fill * (1. + .5 * sunk)) * 1.25;
  ice = mix(ice, ice * vec3(.26, .34, .50), refr * (1. - rimL));                    // new ice: dark, smooth nilas
  float rubw = wide, nolnd = 1.;                                                         // where rubble may lie: all wide water; nolnd: 0 on land
  // A GLACIATED COAST (below 'coast') to the east-north-east: massifs with bare rock crests and snow, a moonlit and a
  // shadowed face and long shadows; glaciers in the valleys running down into fjords; a tongue of fast ice, a flaw lead
  if (uNsBelow.y > .5) {
    float cv = (p.x * .8 - p.y * .6) - 24. + (nsFbm(q / 55. + 11.) - .47) * 44.;           // km inland
    // (order 7) A MOUNTAIN RANGE FROM A GREAT HEIGHT. The massifs are read three times: here, a step toward the moon
    // (the slope: a lit flank and a shaded flank that meet in a crisp crest line) and a longer step toward the moon
    // (a massif there throws its shadow here, on its own flank or out on the ice field). Ribs gully the flanks.
    vec2 wr2 = (g13 - .5) * 12. * nsF(fm, 13.);
    float mass = .30 + .70 * rz;
    float R0 = nsRange(q, wr2, mass), R1 = nsRange(q + md * .5, wr2, mass), R2 = nsRange(q + md * 2.6, wr2, mass);
    float fl = nsF(fm, 7.), fr2 = nsF(fk, 2.2);
    float rib0 = 1. - abs(2. * nsGn(q / 2.2 + 31.) - 1.), rib1 = 1. - abs(2. * nsGn((q + md * .5) / 2.2 + 31.) - 1.);
    float m0 = R0, up0 = smoothstep(0., .12, R0);
    // (order 6) NO STRAIGHT SHORE: the massifs reach out as headlands, the ice between them draws the shore in as bays
    // (cs: km inland by the land's own relief), and the land rises out of the fast ice over a foot of smooth snow
    float cs = cv + (m0 - .35) * 9. + 5. * (bn - .5), foot = smoothstep(-2., 5., cs);
    float land = smoothstep(-2.5, 3.5, cs), rise = smoothstep(-1., 12., cs);
    float slope = ((R0 - R1) * fl + (rib0 - rib1) * .28 * up0 * fr2) * foot;
    float shdw = smoothstep(.06, .22, R2 - R0) * fl * foot;
    float flank = smoothstep(-.035, .035, slope), litk = mix(.22, 1.5, flank) * (1. - .7 * shdw * flank);
    // bare rock on the shaded flanks and along the crests; snow on the lit flanks and on the ice field
    float rock = max(smoothstep(.10, .40, m0 + .12 * (jn - .5) * f3) * (1. - flank) * .9, smoothstep(.80, .95, m0) * .6) * rise * fl;
    // GLACIERS: the ice between the massifs, smooth, with a crisp margin at their feet (order 8: no flow lines on it:
    // from this height they read as fine stripes, like banding). A tongue ENDS in a crisp ice
    // front 4 to 8 km inland of the shore; below the front the drowned valley is a fjord of dark water, brash thick
    // under the front. A massif's shadow lies on the ice beside it.
    float av = fm * .05 + .012, valley = (1. - smoothstep(.03 - av, .03 + av, m0 + .015 * jj * f3)) * fl;
    float tcs = 6. + 4. * (bn - .5) + 1.2 * jj, aw = max(.2, fk * .7), tk = 1. - smoothstep(-aw, aw, cs - tcs);
    float fj = valley * tk * land, front = valley * land * (1. - tk) * (1. - smoothstep(.3, .3 + 2. * aw, cs - tcs));
    brash = max(brash, fj * smoothstep(-3.5, 0., cs - tcs) * mix(.5, smoothstep(.36, .56, jf), f4));
    vec3 snow = (key * litk + fill * (.75 + .45 * flank)) * vec3(.78, .86, 1.) * (.80 + .25 * m0);
    vec3 rockc = vec3(.006, .008, .018) + key * .07 * litk + fill * .07;
    vec3 glac = (key * .80 * (1. - .7 * shdw) + fill * .9) * vec3(.66, .82, 1.) * (.80 + .9 * front);
    vec3 lc = mix(mix(snow, rockc, rock), glac, valley * .95);
    lc *= 1. + (.6 * rd2 - .5 * rh2) * rs0 * (1. - up0);                                  // (order 13: the ice cap between the massifs is no smooth sheet: short ridge lines cross it, on those 4 km joints that lie within 33 degrees of the pressure's bearing)
    float fn = nsGn(q / 9. + 2.), co = 3. * (fn - .5) + 9. * (bn - .5);                     // (the fast ice's outer edge winds too, with its flaw lead)
    float fast = smoothstep(-13., -8., cv + co) * (1. - land);                             // fast ice: smooth, pale, unbroken
    // the flaw lead (order 5): cut crisp like every wide water, its shore irregular, its width unequal; read a second time
    // a step away from the moon for its lit rim and its shaded shore; brash along both
    float fwv = abs(cv + 13.5 + co + .3 * jj), fww = .8 + 1.7 * bn, kf = nsF(fk, 5.) * (1. - land);
    float fwl = abs(cv + 13.5 + dot(ql - q, vec2(.8, -.6)) + 3. * (nsGn(ql / 9. + 2.) - .5) + 9. * (bn - .5) + .3 * jj);
    float flaw = nsCut(fwv, fww, fk) * kf, flawl = nsCut(fwl, fww, fk) * kf;
    float rl = clamp(flaw - flawl, 0., 1.) * fsh, rs = clamp(flawl - flaw, 0., 1.) * fsh;
    brash = max(brash, (flaw - nsCut(fwv, fww * .5, fk) * kf) * mix(.45, smoothstep(.40, .58, jf), f4) * fsh);
    flaw *= 1. - rl;
    ice = mix(ice, (key * (1. + .5 * sunk) + fill) * tintI * 1.2 * (.84 + .5 * (alb - gt)), fast);   // (order 14: the fast ice is no blank sheet: the old floes frozen into it, their seams and the healed leads show at half their tone)
    ice = mix(ice, (key * 2.2 + fill) * tintI, rl) * (1. - .6 * rs);
    ice = mix(ice, lc, land * (1. - fj));
    water = max(max(water * (1. - .35 * fast), flaw) * (1. - land), fj);                    // (order 7: the fast ice keeps its leads, as thin dark cracks)
    rubw = max(rubw * (1. - fast), max(flaw, fj)); nolnd = 1. - land * smoothstep(.05, .2, m0); }
  if (uNsBelow.x > .5) rubw = max(rubw, sea * .5);
  // open water: black, a faint blue mirror of the sheet. THE MOON'S GLITTER lies ONLY ON WATER, by the mirror angle.
  // (order 5) NEVER A DISC: glints a pixel or two across at every range (two scales chosen by the footprint, each
  // fading into the next: a term of filtering by eye), black water between them; the facets drift 0.6 km a second
  // of the world's clock. (orders 13 and 14) ITS STRENGTH (env) has three parts: a broad skirt (the fourth power of
  // the cosine between the mirrored sight line and the moon, times 0.2: water ruffled by wind, so a lead anywhere on
  // the moon's side carries a few faint glints), a core (the 26th power, times 0.5) and A PATH drawn out along the
  // moon's bearing (times 0.9; gc: the mirrored sight line's part across that bearing, ga: its part along it; 1.5
  // degrees across and 8 along). A glint's light is 0.2 + 2.2 env, never over 1.4, and more of the facets are lit
  // where env is high (the bar falls from .86 to .78 of the facets' field): small points in the heart too, never
  // flakes. It lies only where the pixel is water (whole from 0.95 of water, nothing under 0.6): never on a floe's
  // face, never on ice that stands in water.
  vec3 rm = reflect(d, up); float rd = max(dot(rm, uNsMoonDir), 0.), rq = rd * rd, gc = dot(rm, vec3(-md.y, 0., md.x)), ga = max(2. - 2. * rd - gc * gc, 0.);
  float env = rq * rq * .2 + pow(rd, 26.) * .5 + exp(-gc * gc / .0007 - ga / .02) * .9;
  // (order 7) THE SKY'S COLOURS ON BLACK WATER, broken as the moon's glitter is (other facets of the same two scales):
  // the curtains' green where the mirrored sight line looks north (the darkest look), the sheet's own blue where it
  // looks steeply up; the arc's colours on the open sea alone (below). The ice takes a faint sheen of its own
  // (skyC).
  float rh = max(rm.y, 0.), cnR = -rm.z / max(length(rm.xz), 1e-4);
  float eG = uNsDark.z * smoothstep(-.1, .9, cnR) * (1. - smoothstep(.45, .97, rh)), eA = 1. - smoothstep(.1, .92, rh);
  vec3 arcR = nsArc(2.2, cnR) * 1.5 * eA, skyI = vec3(.08, .95, .40) * .55 * eG + uNsColA * .16 * uNsSheet.x * smoothstep(.45, .95, rh);
  // (order 14, addition 1) THE ICE'S OWN SHEEN: the curtains' green as a tint only (a third of the water's), the
  // sheet's blue, and the arc's brightness where the mirror grazes toward it, in the same cold blue-white
  vec3 skyC = vec3(.08, .95, .40) * .20 * eG + uNsColA * .16 * uNsSheet.x * smoothstep(.45, .95, rh) + dot(arcR, vec3(.5)) * vec3(.82, .90, 1.);
  // THE FAR FIELD: broad tones of the pack, laid on after the water (ft; three fields 110, 43 and 23 km broad, the
  // two finer the country's own og and rzn, each faded to its mean under its footprint). BY PLACE: faint (0.3 of
  // it) within 32 km of the point under the balloon, whole by 196 km: no soft blots on the ice below. (order 15)
  // It is worked out here, before the water, because the sparks' bound is set against it.
  float bt = .57 * mix(.5, nsGn(q / 110. + 7.), nsF(fm, 110.)) + .285 * mix(.5, og, nsF(fm, 43.)) + .1425 * mix(.5, rzn, nsF(fm, 23.));
  float ft = 1. + (bt - .5) * 1.44 * mix(.3, 1., smoothstep(32., 196., length(p)));
  // (order 14) the water's own light is worked out only where there is water
  vec3 wat = vec3(0.);
  if (water > 0.) {
  float lg = log2(max(fk, .02) * 2.), l0 = floor(lg), fl = lg - l0, s0 = exp2(-l0); vec2 qg = q + vec2(t * .5, -t * .33);
  float thr = mix(.86, .78, clamp(env * 1.4, 0., 1.));
  float n0 = nsGn(qg * s0 + l0 * 7.3), n1 = nsGn(qg * s0 * .5 + (l0 + 1.) * 7.3);
  float glt = mix(smoothstep(thr, thr + .05, n0), smoothstep(thr, thr + .05, n1), fl);
  wat = vec3(.0012, .002, .007) + vec3(.0025, .008, .032) * uNsSheet.x * (.6 + .5 * uNsMoon.w)
    + vec3(.9, .95, 1.) * uNsMoon.x * min(glt * (.2 + 2.2 * env) + env * .025, 1.4) * smoothstep(.6, .95, water);
  float thS = mix(.76, .54, clamp(dot(skyI, vec3(.9)), 0., 1.));
  float gs = mix(smoothstep(thS, thS + .05, 1. - n0), smoothstep(thS, thS + .05, 1. - n1), fl);
  wat += skyI * (gs * 1.25 + .10);                                                         // (order 8: the sky's colour shows on the water between its glints too)
  // (order 13) the arc is mirrored by the OPEN SEA only, never by the ice or by a lead in it. (orders 14 and 15) It
  // lies there as its own colour on the water, faint, with a few small sparks: fewer than the moon's glints (a
  // higher bar on the same facets, .90 falling to .84) and dimmer. It does not read the moon. THE GATE (order 15):
  // the sparks lie where the pixel is open sea AND water, whole from 0.95 of both and nothing under 0.7 (fast ice
  // leaves 0.65 of the sea's field as water): on a floe's face, on land and on fast ice they are nothing. THE BOUND
  // (order 15): the cap is 0.25 divided by the far tone (ft) that is laid on after it, so the greatest light the
  // sparks add to what this law returns is 0.25.
  float thA = mix(.90, .84, clamp(dot(arcR, vec3(.9)), 0., 1.));
  wat += min(arcR * (.08 + .20 * mix(smoothstep(thA, thA + .05, n0), smoothstep(thA, thA + .05, n1), fl)), vec3(.25 / ft)) * smoothstep(.7, .95, min(sea, water));
  wat = mix(wat, (key + fill) * vec3(.42, .50, .62) * (.55 + .5 * rub), rub * rubw * .3);    // brash: graded grey rubble on it
  wat = mix(wat, (key + fill) * vec3(.52, .60, .72), clamp(brash, 0., 1.) * .85);            // and along every shore
  }
  vec3 col = mix(ice + skyC * (.035 + .30 * eA * eA) * alb, wat, water);
  // (ORDER 13) THE STREETS OF CLOUD AND THEIR SHADOWS. The clouds stand 1.6 km over the ice: a cloud is seen where the
  // sight line passes that height (the law's eye stands 38 km over the origin: a term of direction), and its SHADOW
  // lies on the ice 2.6 km from under it, on the side away from the moon (the moon is 32 degrees up), so that a gap
  // of ice shows between a row and its shadow. The shadow takes most of the moon's light and a third of the sky's
  // (with no moon it is the sky's alone, and faint). No street over land. Crisp small clouds, lit by the moon
  // and the sky like the ice, a little paler than snow.
  float sw = (og - .5) * .9, cl = nsStreet(q - p * (1.6 / 38.), sw, t, fk), shd = nsStreet(q + md * (1.6 * length(uNsMoonDir.xz) / max(uNsMoonDir.y, .2)), sw, t, fk);
  col *= ft;                                                                       // the far field's broad tones (ft, above)
  col *= 1. - shd * nolnd * mix(.30, .64, uNsMoon.x);
  col = mix(col, (key * 1.15 + fill * 1.4) * vec3(.80, .88, 1.), cl * nolnd * .92);   // the streets' clouds
  // (order 7: no cloud deck lies on the far ground: one law of ice holds to the limb, its forms growing fine, then smooth)
  col = min(col, vec3(1.8));                                                       // (nothing on the Earth over 1.8, whatever tone lies on a glint)
  // the air's own blue haze deepens with distance; the far ice keeps its form to the limb
  float air = 1. - exp(-dist / 650.);
  vec3 limb = vec3(.010, .034, .15) * (1. + .5 * uNsMoon.w) + dot(nsArc(.9, cn), vec3(.3)) * vec3(.085, .10, .13);   // (order 13: the far air is lifted toward the north: no rose on the ice; order 14: in a pale blue-white, not a deep blue)
  return mix(col, limb, air * .9);
}
`;

const GLSL_MAIN = /* glsl */`
// THE SKY LAW with the footprint given: fw is a pixel's size in radians along d (a film that bends d hands in its own sight
// line's); soft (degrees) widens and dims the thin bright airglow line, for a surface whose bending would draw it as a zigzag
vec3 nsSkyS(vec3 d, float fw, float soft){
  float sy = clamp(d.y, -1., 1.), hl = max(length(d.xz), 1e-4), t = uNsTime;
  float az = t * .0012, cn = (-d.z * cos(az) + d.x * sin(az)) / hl;  // the arc drifts east along the limb
  float a = (asin(sy) + .10895) * 57.2958;                           // degrees above the limb
  float b = 6409. * sy;
  float under = 1. - smoothstep(-.8, .8, (sy - NS_LIMB) / fw);
  vec3 earth = vec3(0.), sky = vec3(0.);
  if (under > .002) {
    float te = -b - sqrt(max(b * b - 485640., 0.)); vec3 P = vec3(te * d.x, 6409. + te * sy, te * d.z);
    vec3 up = P / max(length(P), 1.); float ci = max(-dot(up, d), .03);
    earth = nsEarth(P.xz, te * fw / ci, te, d, up, cn); }
  if (under < .998) {
    vec3 arc = nsArc(a, cn);
    // the sheet: the ray met with the shell 45 km overhead
    float ts = -b + sqrt(b * b + 578835.); vec3 P = vec3(ts * d.x, 6409. + ts * sy, ts * d.z);
    float ci = clamp(dot(P, d) / 6454., .05, 1.), slant = min(1. / ci, 4.);  // seen aslant it is up to four times brighter
    float pd = dot(d, NS_PORTAL), calm = smoothstep(.86, .975, pd);         // a law of direction: calm sky behind the way out (whole within 13 degrees, gone by 31)
    float lk = smoothstep(.6, 1.15, uNsTwi.y), phi = atan(d.x + 1e-5, -d.z);              // (lk: 0 on the darkest look, 1 on the lighter)
    float low = (1. - smoothstep(12., mix(32., 27., lk), a)) * mix(.25, 1., lk);   // a law of direction: toward the limb the cover closes (no hole in the bright band)
    float fkS = ts * fw / ci, den = nsSheet(P.xz, fkS, calm, low);
    float zs = uNsSheet.z + .30 * length(P.xz);                             // the Earth's shadow: a long soft falling-off, wider with distance
    float lit = 1. - smoothstep(uNsSheet.y - zs, uNsSheet.y + zs, P.z + P.x * P.x * .0004 + (nsGn(P.xz / 60.) - .5) * 30. * (1. - smoothstep(.2, .55, fkS / 60.)));
    lit = mix(uNsSheet.w, 1., lit);                                         // the dark looks are lifted: the shadowed sheet never falls to black
    float x = .215 * slant * den * uNsSheet.x * lit;
    x *= mix(1., mix(.2, min(.52, .73 / uNsSheet.x), lk), 1. - smoothstep(10., mix(50., 36., lk), a));   // (order 6: on the darkest look the lower sky stays deep)                         // the band over the limb is no white wall: its broad bands keep their tone
    // (order 6) BY DIRECTION: the sheet's lower border in the north is ragged and patchy, between 2 and 20 degrees up
    // by the bearing: tongues of cloud reach down toward the arc and gaps of night reach up, no level band of night
    float rb = 4. + 14. * smoothstep(.24, .76, nsGn(vec2(phi * 4.2 + uNsDark.w, a * .11 + 2.))) + 5. * (nsGn(vec2(phi * 15., a * .3 + 5.3)) - .5);
    x *= mix(1., mix(.03, 1., smoothstep(rb, rb + 3.5 + .45 * rb, a)), smoothstep(-.5, .5, cn)) * (1. - .7 * clamp(dot(arc, vec3(.6)), 0., 1.));   // in the north, below 13 degrees, the sheet is lost in the arc's own glow: the arc keeps its colours
    float sb = .87 * (1. - exp(-1.25 * x / .87));                           // never over 0.87: the rolls keep their blue
    float cw = smoothstep(-.2, .9, cn);
    vec3 sc = mix(uNsColA, uNsColB, max((1. - smoothstep(8., 40., a)) * mix(.12, 1., lk), .75 * mix(mix(.4, 1., smoothstep(25., 55., a)), 1., lk) * smoothstep(.22, .62, sb)));   // silver toward the limb and on the crests, the look's blue in the troughs
    sc = mix(sc, vec3(1., .88, .66), (1. - smoothstep(1.5, 4. + 5. * uNsTwi.y, a)) * (.35 + .65 * cw) * min(.75 * uNsTwi.x, .85));   // palest gold in the last degrees
    // THE MILKY WAY (the dark looks): a band through the sky's top, 14 degrees off the zenith, with star clouds, a bulge
    // 36 degrees from the last line's direction and a dark rift of dust wandering along it
    float mw = 0.; vec3 milky = vec3(0.);
    if (uNsDark.y > .01) {
      float mb = dot(d, vec3(.6, .25, -.76)), lam = atan(dot(d, vec3(.785, 0., .62)), dot(d, vec3(-.155, .969, .196))), dl = lam + .61;
      float bulge = exp(-dl * dl * 3.), wid = .12 + .10 * bulge, e0 = mb / wid;
      float clouds = nsGf(vec2(lam * 2.6, mb * 8.) + 2., 0.);
      float rc = mb - .035 * sin(lam * 4. + 1.) - .07 * (nsGn(vec2(lam * 1.9, 3.)) - .5), rw = .020 + .035 * nsGn(vec2(lam * 3.7, 7.));
      float rift = exp(-rc * rc / (rw * rw)) * (.55 + .45 * bulge) + .3 * smoothstep(.50, .78, nsGn(vec2(lam * 2.2, mb * 27.) + 5.));
      mw = exp(-e0 * e0) * uNsDark.y;
      milky = mix(vec3(.050, .066, .125), vec3(.105, .095, .105), bulge) * mw * (.35 + 1.5 * clouds * clouds) * (1. + 1.2 * bulge) * clamp(1. - .85 * rift, 0., 1.);
      mw *= clamp(1. - .7 * rift, 0., 1.); }
    float tA, tB;
    float s1 = nsStarLayer(d, 46., fw, .05 * uNsDark.x + .05 * mw, tA), s2 = nsStarLayer(d, 120., fw, .035 * uNsDark.x + .09 * mw, tB);
    vec3 stars = mix(vec3(1., .82, .64), vec3(.72, .84, 1.), tA) * s1 * .95 + mix(vec3(1., .9, .8), vec3(.8, .88, 1.), tB) * s2 * .6;
    float veilk = clamp(1. - sb * 1.3 - dot(arc, vec3(.5)), 0., 1.);
    stars *= veilk; milky *= veilk;
    // THE AURORA (the darkest look), by direction: curtains standing in the north above the sheet, slowly rippling;
    // green at the foot, violet-red at the top; none within 20 degrees of the last line's direction
    vec3 aur = vec3(0.);
    if (uNsDark.z > .01) {
      // (order 6) CURTAINS, crisp: two thin sheets seen from the side. Each has a sharp lower border that winds with the
      // bearing (its folds), fine upright rays of unequal height standing on it (under two pixels they pass into their
      // mean), and ends; between and above them the night is dark and starry.
      float ff = 1. - smoothstep(.25, .6, fw * 75.);
      float r1 = mix(.45, nsGn(vec2(phi * 75. + t * .05, 1.5 + t * .03)), ff), r2 = mix(.45, nsGn(vec2(phi * 52. - t * .04, 7.5 + t * .02)), ff);
      float m1 = nsGn(vec2(phi * 1.9 + uNsDark.w, 3. + t * .008)), m2 = nsGn(vec2(phi * 2.6 - uNsDark.w, 11. - t * .006));
      float e1 = smoothstep(.40, .55, m1), e2 = smoothstep(.44, .59, m2);
      // (order 7) A CURTAIN IS ONE FOLDED RIBBON seen nearly edge on: its lower border wanders with the bearing and
      // folds (g: the fold's phase, bent forward and back by the slow field, so folds bunch, open and double back);
      // where the border runs steeply the ribbon lies along the sight line and is brightest; behind each fold its far
      // side shows again, higher and fainter. No part of a border is level; the two curtains have different laws.
      float g1 = phi * 23. + 13. * m1 + uNsDark.w + t * .02, g2 = phi * 29. - 12. * m2 + 2. + t * .016;
      float f1 = 13. + 12. * (m1 - .5) + 2.3 * sin(g1) + 1.3 * sin(2.3 * g1 + 1.7) + .7 * sin(5.1 * g1 + .5), f2 = 23. + 14. * (m2 - .5) + 2.1 * sin(g2) + 1.4 * sin(1.9 * g2 + .6) + .7 * sin(4.3 * g2 + 2.);
      float k1 = .55 + .9 * pow(abs(cos(g1)), 4.), k2 = .55 + .9 * pow(abs(cos(g2)), 4.);
      float h1 = a - f1, h2 = a - f2, bw = .10 + fw * 57.3;                    // the border: sharp, never under a pixel
      float h1b = h1 - 3.5 - 2.5 * sin(g1 + 2.2), h2b = h2 - 3. - 2.5 * sin(g2 + 4.);
      float d1 = 2.5 + 21. * r1 * r1, d2 = 2.5 + 17. * r2 * r2;
      float c1 = (smoothstep(-bw, bw, h1) * exp(-max(h1, 0.) / d1) * k1 + .4 * smoothstep(-bw, bw, h1b) * exp(-max(h1b, 0.) / (d1 * .7))) * (.25 + .75 * r1) * e1;
      float c2 = (smoothstep(-bw, bw, h2) * exp(-max(h2, 0.) / d2) * k2 + .4 * smoothstep(-bw, bw, h2b) * exp(-max(h2b, 0.) / (d2 * .7))) * (.25 + .75 * r2) * e2;
      vec3 col1 = mix(vec3(.08, .95, .40), vec3(.55, .10, .50), smoothstep(3., 22., h1)), col2 = mix(vec3(.08, .95, .40), vec3(.55, .10, .50), smoothstep(3., 20., h2));
      aur = (col1 * c1 + col2 * c2 * .8) * smoothstep(-.15, .5, cn) * (1. - smoothstep(.88, .94, pd)) * uNsDark.z * .62; }
    // the airglow line: hair-thin, breathing, never under a pixel and a half; a hair above the ember
    float fwd = fw * 57.3, wl = max(.11 + soft, fwd * .9);
    vec3 glow = vec3(.14, .9, .36) * nsG(a, .5, wl) * min(1., .22 / wl) * .09 * (.75 + .25 * sin(t * .5 + phi * 3.));   // (order 6: one hair above the limb, faint)
    vec3 deep = vec3(.0006, .0009, .003) + vec3(.002, .0065, .032) * max(uNsTwi.y - .6, 0.) * (.55 + .45 * cw);   // space black; the higher sun leaves it deep blue
    sky = deep + stars + milky + aur + arc + glow + sc * sb + nsMoonDisc(d, fw); }
  return mix(sky, earth, under);
}
// THE SKY LAW: linear colour of everything at infinity along the unit direction d (balloon space: +Y up, +Z south, +X east)
vec3 nsSkyF(vec3 d, float fw){ return nsSkyS(d, fw, 0.); }
vec3 nsSky(vec3 d){ return nsSkyS(d, clamp(length(fwidth(d)), 1e-5, .05), 0.); }
`;

export const SKY_GLSL = GLSL_BASE + GLSL_SHEET + GLSL_EARTH + GLSL_MAIN;

// ---------- the taut profile: a monotone cubic through PROFILE ----------
const PX = PROFILE.map((p) => p[0]), PY = PROFILE.map((p) => p[1]), PM = (() => {
  const n = PX.length, dl = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) dl.push((PY[i + 1] - PY[i]) / (PX[i + 1] - PX[i]));
  m[0] = dl[0]; m[n - 1] = dl[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : 2 * dl[i - 1] * dl[i] / (dl[i - 1] + dl[i]);
  return m;
})();
function profile(y, out) {   // out[0] radius, out[1] its slope, at height y
  const n = PX.length; y = clamp(y, PX[0], PX[n - 1]); let i = 0; while (i < n - 2 && y > PX[i + 1]) i++;
  const h = PX[i + 1] - PX[i], s = (y - PX[i]) / h, s2 = s * s, s3 = s2 * s;
  out[0] = (2 * s3 - 3 * s2 + 1) * PY[i] + (s3 - 2 * s2 + s) * h * PM[i] + (-2 * s3 + 3 * s2) * PY[i + 1] + (s3 - s2) * h * PM[i + 1];
  out[1] = ((6 * s2 - 6 * s) * PY[i] + (3 * s2 - 4 * s + 1) * h * PM[i] + (-6 * s2 + 6 * s) * PY[i + 1] + (3 * s2 - 2 * s) * h * PM[i + 1]) / h;
  return out;
}
const _pr = [0, 0];
export function radiusAt(y) { return y < PX[0] || y > PX[PX.length - 1] ? 0 : profile(y, _pr)[0]; }
// the meridian from the crown down: arc length (m) to height and back, in 1 m steps of height
const ARC = (() => { const N = 520, ys = new Float32Array(N + 1), as = new Float32Array(N + 1); let a = 2.6, r0 = 2.6;
  for (let i = 0; i <= N; i++) { const y = 190 - (130 * i) / N, r = profile(y, _pr)[0]; if (i > 0) a += Math.hypot(r - r0, 130 / N); r0 = r; ys[i] = y; as[i] = a; }
  return { N, ys, as, total: a }; })();
function arcOfY(y) { const f = clamp((190 - y) / 130, 0, 1) * ARC.N, i = Math.min(ARC.N - 1, Math.floor(f)); return lerp(ARC.as[i], ARC.as[i + 1], f - i); }
function yOfArc(a) { let lo = 0, hi = ARC.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ARC.as[m] > a) hi = m; else lo = m; }
  return lerp(ARC.ys[lo], ARC.ys[hi], clamp((a - ARC.as[lo]) / Math.max(1e-6, ARC.as[hi] - ARC.as[lo]), 0, 1)); }

// ---------- the brief's flight: the keyed pose at t seconds, in balloon space (test aid; the world flies its own) ----------
const _col = new THREE.Color(), _m4 = new THREE.Matrix4(), _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function flightAt(t, pos, quat) {
  let z, y, pitch, head;
  if (t >= 30) { const s = (t - 30) * 10; z = LINE_FROM[2] + LINE_DIR[2] * s; y = LINE_FROM[1] + LINE_DIR[1] * s; pitch = Math.asin(LINE_DIR[1]) / D2R; head = 0; }
  else {
    t = Math.max(0, t); let i = 0; while (i < POSES.length - 2 && t > POSES[i + 1][0]) i++;
    const A = POSES[Math.max(0, i - 1)], B = POSES[i], C = POSES[i + 1], D = POSES[Math.min(POSES.length - 1, i + 2)], f = (t - B[0]) / (C[0] - B[0]);
    const cr = (k) => { const m1 = (C[k] - A[k]) / Math.max(1e-3, C[0] - A[0]) * (C[0] - B[0]), m2 = (D[k] - B[k]) / Math.max(1e-3, D[0] - B[0]) * (C[0] - B[0]), f2 = f * f, f3 = f2 * f;
      return (2 * f3 - 3 * f2 + 1) * B[k] + (f3 - 2 * f2 + f) * m1 + (-2 * f3 + 3 * f2) * C[k] + (f3 - f2) * m2; };
    z = cr(1); y = cr(2); pitch = cr(3); head = cr(4);
  }
  const p = pitch * D2R, h = head * D2R; pos.set(0, y, z);
  _va.set(Math.sin(h) * Math.cos(p), Math.sin(p), -Math.cos(h) * Math.cos(p)).add(pos);
  if (quat) quat.setFromRotationMatrix(_m4.lookAt(pos, _va, _up));
  return pos;
}

// ---------- the look: each field dealt from the rng when the caller leaves it out (five draws, always) ----------
function dealLook(rng, o = {}) {
  const r = [rng(), rng(), rng(), rng(), rng()];
  const sd = o.sunDepth != null ? (o.sunDepth < 7.5 ? 6 : o.sunDepth < 11 ? 9 : 13) : (r[0] < 0.5 ? 9 : r[0] < 0.76 ? 6 : 13);
  const one = (v, list, d) => (list.includes(v) ? v : d);
  return {
    sunDepth: sd,
    display: one(o.display, ['bands', 'billows', 'whirls'], r[1] < 0.34 ? 'bands' : r[1] < 0.67 ? 'billows' : 'whirls'),
    moon: one(o.moon, ['gibbous', 'crescent', 'none'], r[2] < 0.55 ? 'gibbous' : r[2] < 0.8 ? 'crescent' : 'none'),
    below: one(o.below, ['pack', 'edge', 'coast'], r[3] < 0.4 ? 'pack' : r[3] < 0.7 ? 'edge' : 'coast'),
    film: one(o.film, ['clear', 'gold'], r[4] < 0.7 ? 'clear' : 'gold'),
  };
}
const MOON_DIR = new THREE.Vector3(Math.sin(135 * D2R) * Math.cos(32 * D2R), Math.sin(32 * D2R), -Math.cos(135 * D2R) * Math.cos(32 * D2R));
function skyUniformsFor(look, rng) {
  const sd = look.sunDepth, mo = look.moon, seed = rng() * 40, seedB = rng() * 40;
  const dark = (sd === 13 ? 0.6 : 0) + (mo === 'none' ? 0.6 : mo === 'crescent' ? 0.25 : 0);   // how much the dark looks are lifted
  const whirl = []; const big = look.display === 'whirls';
  // four whirls 30 to 38 km wide, standing round the calm veil (which lies 18 km north of the zenith on the sheet)
  const WC = [[-44, -30], [40, -6], [8, -66], [-24, 30]];
  for (let k = 0; k < 4; k++) whirl.push(new THREE.Vector4(WC[k][0] + rng.range(-8, 8), WC[k][1] + rng.range(-8, 8), big ? 19 : 15, (k % 2 ? -1 : 1) * rng.range(0.8, 1.2)));
  return {
    uNsTime: { value: 0 },
    uNsMoonDir: { value: MOON_DIR.clone() },
    uNsMoon: { value: new THREE.Vector4(mo === 'gibbous' ? 1 : mo === 'crescent' ? 0.36 : 0, mo === 'crescent' ? 1 : 0, mo === 'none' ? 0 : 1, Math.min(1, dark)) },
    uNsTwi: { value: sd === 6 ? new THREE.Vector4(0.95, 1.7, 1.5, 0) : sd === 9 ? new THREE.Vector4(1, 1.15, 1.7, 0.15) : new THREE.Vector4(0.85, 0.6, 1.7, 0.8) },
    uNsSheet: { value: (sd === 6 ? new THREE.Vector4(1.0, 900, 60, 0) : sd === 9 ? new THREE.Vector4(1 + 0.2 * dark, 54, 28, 0.12) : new THREE.Vector4(1.5 + 0.2 * dark, -4, 30, 0.06))
      .multiply(new THREE.Vector4(1.3, 1, 1, 1)) },
    uNsDisp: { value: look.display === 'bands' ? new THREE.Vector4(1.15, 0.55, 0.6, 0.8) : look.display === 'billows' ? new THREE.Vector4(0.6, 1.35, 0.6, 0.7) : new THREE.Vector4(0.85, 0.7, 1.15, 1.0) },
    uNsDark: { value: new THREE.Vector4(sd === 6 ? 1.1 : sd === 9 ? 1.6 : 2.6, sd === 13 ? 1 : sd === 9 ? 0.12 : 0, sd === 13 ? 1 : 0, seed) },   // (13 degrees: many more stars, the Milky Way, the aurora)
    uNsBelow: { value: new THREE.Vector4(look.below === 'pack' ? 0 : 1, look.below === 'coast' ? 1 : 0, 1 + dark, seedB) },   // (order 7: the coast look has the sea's edge too, to the east-south-east)
    uNsWhirl: { value: whirl },
    uNsColA: { value: sd === 6 ? new THREE.Vector3(0.15, 0.42, 1.0) : sd === 9 ? new THREE.Vector3(0.08, 0.30, 1.0) : new THREE.Vector3(0.13, 0.17, 0.92) },   // (6: silver-white; 9: electric blue; 13: deep violet-blue)
    uNsColB: { value: sd === 6 ? new THREE.Vector3(0.50, 0.73, 1.0) : sd === 9 ? new THREE.Vector3(0.40, 0.64, 1.0) : new THREE.Vector3(0.40, 0.50, 1.0) },
  };
}

// ---------- the sky: one box at the far plane; the direction is the box's own corner, in balloon space ----------
function makeSky(skyU) {
  const mat = new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position * 60., 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: SKY_GLSL + /* glsl */`
      varying vec3 vDir;
      void main(){ gl_FragColor = vec4(nsSky(normalize(vDir)), 1.); }`,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), mat);
  mesh.renderOrder = -1; mesh.frustumCulled = false;
  return mesh;
}

// ---------- THE FILM ----------
// One law for the film's form, used by the vertex and the fragment shader: the radial displacement (m) of the film at
// bearing th (0 south, growing east), height y, taut radius R. Scallops between the 160 tapes where it is taut; in the
// lower cone inward creases (22, 38 and 62 round) that travel up and breathe; ripples that cross the film.
const GLSL_FILM = /* glsl */`
uniform float uTime; uniform float uBurst;
float nsFilmDisp(float th, float y, float R){
  float t = uTime, sl = clamp(1. - smoothstep(98., 140., y) + .45 * smoothstep(0., 9., uBurst), 0., 1.);
  float gw = 6.2832 * R / 160., sc = .5 - .5 * cos(th * 160.);
  float d = gw * (.11 * (1. - sl) - .30 * sl * (.55 + .45 * sin(th * 23. + y * .07))) * sc;      // scallop out, pleat in
  float br = .8 + .2 * sin(t * .45 + th * 3.);
  float f1 = 1. - abs(sin(th * 11. + .05 * y + .7 * sin(.07 * y - .33 * t)));
  float f2 = 1. - abs(sin(th * 19. - .08 * y + .6 * sin(.11 * y - .45 * t + 1.7)));
  float f3 = 1. - abs(sin(th * 31. + .13 * y + .5 * sin(.16 * y - .6 * t + 4.)));
  d -= sl * R * br * (.060 * f1 * f1 + .036 * f2 * f2 + .016 * f3);
  float rp = (.5 + .5 * smoothstep(120., 150., y)) * smoothstep(0., 14., R);   // ripples shrink with the cone toward its tip
  d += rp * (.15 * sin(th * 46. + y * .55 - t * 1.9) * sin(th * 9. - y * .21 + t * .4) + .06 * sin(th * 71. - y * .9 + t * 2.6) + .018 * sin(th * 113. + y * 1.7 - t * 3.3));
  return d;
}
`;
// the tear (fragment shaders only, after SKY_GLSL): metres by which the film at (th, arc a, radius R) lies inside the
// torn opening (positive: gone). Fourteen seams; seam 0 is the south meridian and runs on down the flank.
const GLSL_HOLE = /* glsl */`
// the torn hole in the crown: its lip (metres of arc from the crown) by bearing: irregular, 8 to 19 m, open within 1.8 s
float nsHole(float th){
  vec2 c = vec2(cos(th), sin(th));
  return (5. + 13. * nsGn(c * 1.7 + 3.) + 3. * nsGn(c * 6. + 11.)) * smoothstep(0., 1.8, uBurst);
}
`;
const GLSL_TEAR = /* glsl */`
uniform float uSeamEnd[14]; uniform float uRibL[14]; uniform float uRibW[14];   // uRibW: half widths
float nsTear(float th, float a, float R, out float tip){
  float pitch = 6.2832 / 14., k = floor(th / pitch + .5), Fg = 16. * uBurst;
  int ki = int(mod(k + 14., 14.));
  // film splitting, not a pie: each seam parts at its own moment (the south one first, the others up to .4 s late) and
  // at its own rate; its line wanders a metre; it is a slit beside the front and gapes as the gas takes the film
  // (order 3: moments up to 1.2 s apart and rates from .65 to 1.3 of the south seam's, so the lengths are unequal)
  float km = float(ki), hk = nsH1(vec2(km, 3.7)), hq = nsH1(vec2(km, 9.1));
  float sk = uBurst - (ki == 0 ? 0. : .05 + 1.15 * hk * hk), F = 16. * (ki == 0 ? 1. : .65 + .65 * hq) * max(sk, 0.);
  float ds = abs((th - k * pitch) * R - (nsGn(vec2(a * .17, km * 7.3)) - .5) * 3. * smoothstep(2., 9., a));
  float E = uSeamEnd[ki], g = ki == 0 ? .12 : .6;
  float w = min((F - a) * (.09 + .70 * smoothstep(.4, 3.6, sk)) * (.7 + .6 * hq), (E - a) * g);
  float fray = (nsVn(vec2(th * 60., a * .9)) - .5) * 1.5 + (nsVn(vec2(th * 220., a * 3.)) - .5) * .5;
  tip = (1. - smoothstep(0., 4., abs(F - a))) * (1. - smoothstep(0., 3., ds)) * step(a, E) * step(0., uBurst);
  // each ribbon's own strip is cut out of the film as the front passes it (the ribbon mesh takes it over there)
  float ri = clamp(floor(th / pitch), 0., 13.); int rj = int(ri);
  float dc = abs(th - (ri + .5) * pitch) * R, hwid = min(uRibW[rj], .42 * pitch * R);
  float Fr = 16. * max(uBurst - .6 * fract(ri * .471 + .23), 0.);                       // the ribbon's own moment (as in its vertex law)
  float strip = min(hwid - dc, min(Fr, uRibL[rj]) - a + fray * .5);
  float hole = uBurst > 0. ? nsHole(th) - a + fray * .7 : -1000.;                        // the torn hole in the crown
  return max(max(w - ds + fray * smoothstep(0., 2.5, w), strip), hole);
}
`;
const FILM_VERT = GLSL_FILM + /* glsl */`
attribute vec4 aFilm;      // bearing, height, taut radius, its slope
attribute float aArc;      // metres from the crown along the meridian
varying vec4 vFilm; varying float vArc; varying vec3 vPos;
void main(){
  float th = aFilm.x, R = aFilm.z + nsFilmDisp(aFilm.x, aFilm.y, aFilm.z);
  vec3 p = vec3(sin(th) * R, aFilm.y, cos(th) * R);
  vFilm = aFilm; vArc = aArc; vPos = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

const FILM_FRAG = SKY_GLSL + GLSL_FILM + GLSL_HOLE + GLSL_TEAR + /* glsl */`
uniform vec3 uEye; uniform vec4 uFlash; uniform vec3 uTint;
uniform vec4 uFilmK;       // x which wall (+1 the near, -1.3 the far: the two bend the sight line apart), y frost gain
varying vec4 vFilm; varying float vArc; varying vec3 vPos;
void main(){
  float th = vFilm.x, y = vFilm.y, R = max(vFilm.z, .3), dR = vFilm.w;
  float gore = th * (160. / 6.2832), fg = fwidth(gore);
  float fs = clamp(length(fwidth(vPos)), 1e-4, 50.);                 // metres a pixel on the film
  float tip, tr = nsTear(th, vArc, R, tip);
  // the film's normal from its own law (creases and ripples are per pixel), and the taut normal
  float D = nsFilmDisp(th, y, R), h = .0016, kk = .25;
  float Dt = (nsFilmDisp(th + h, y, R) - D) / h, Dy = (nsFilmDisp(th, y + kk, R + dR * kk) - D) / kk;
  vec3 er = vec3(sin(th), 0., cos(th)), et = vec3(cos(th), 0., -sin(th)), upv = vec3(0., 1., 0.);
  vec3 N = normalize(cross(et * (R + D) + er * Dt, er * (dR + Dy) + upv));
  vec3 Ns = normalize(cross(et, er * dR + upv));
  vec3 V = normalize(vPos - uEye);
  // what the film shows: the sky law along the sight line bent by the film's normal (70 parts; 30 parts true, by the blend)
  // (order 5: the folds bend it less, the far wall least, so that what is seen through the envelope is plainly the sky)
  vec3 seen = nsSkyS(normalize(V + uFilmK.x * (Ns * .05 + (N - Ns) * (uFilmK.x > 0. ? .075 : .03))), clamp(length(fwidth(V)) * 1.6, 1e-5, .05), .7);
  vec3 sky0 = min(seen, vec3(1.9));                                  // (about what stands behind this pixel of the film)
  float nv = dot(N, V), cosv = abs(nv), graze = max(1. - cosv, 0.), fres = .05 + .95 * pow(graze, 5.);
  vec3 Rf = reflect(V, nv > 0. ? -N : N);
  float rm = max(dot(Rf, uNsMoonDir), 0.);
  float aR = (asin(clamp(Rf.y, -1., 1.)) + .10895) * 57.2958, cnR = -Rf.z / max(length(Rf.xz), 1e-4);
  vec3 env = aR > 0. ? nsArc(aR, cnR) + mix(uNsColB, uNsColA, clamp(Rf.y, 0., 1.)) * .13 * uNsSheet.x : vec3(.02, .03, .06) * (.4 + uNsMoon.x);
  float tipk = smoothstep(.6, 9., R); env *= .2 + .8 * tipk;          // no mirror of the arc in the last metres of the cone
  vec3 glint = vec3(.92, .96, 1.) * uNsMoon.x * min(pow(rm, 700.) * 16. + pow(rm, 50.) * .5, 1.6);
  // milk: the film's own scatter of moon, sheet and twilight, more where the sight line grazes it
  float lm = uNsMoon.x * (.35 + .65 * abs(dot(N, uNsMoonDir)));
  vec3 milk = uTint * (vec3(.80, .87, 1.) * lm * .011 + uNsColA * (.005 + .016 * uNsMoon.w) + vec3(1., .5, .22) * .016 * uNsTwi.x * max(-N.z, 0.) * tipk) / max(cosv, .16);
  // THE ARC'S LIGHT ON THE FILM (the look's own light, from the north): a warm glow where the sight line grazes the skin,
  // most on the north-facing skin and along sight lines toward the arc (a thin film scatters forward); and a cool bright rim
  // (order 5) a PLAIN RIM of ember and gold: nothing where the film is seen square on (the inside stays clean), strong at
  // grazing sight; ember within, gold at the very edge; it follows the scallops (the film's own normal) and the tapes
  float g3 = graze * graze * graze, nf = smoothstep(-.5, .7, -mix(Ns.z, N.z, .6)), fwdk = .4 + .6 * smoothstep(-.2, .9, -V.z);
  vec3 wc = mix(vec3(1., .33, .10), vec3(1., .22, .07), uNsTwi.w) * mix(vec3(1.), vec3(1., 1.45, 1.5), smoothstep(.62, .95, graze));
  // (order 6: the rim is of the envelope's own outline; a fold in the middle of the picture takes little of it, so the inside stays clean)
  float gz = mix(max(1. - abs(dot(Ns, V)), 0.), graze, .3), gz3 = gz * gz * gz;
  float wk = (.04 * gz * gz + .5 * gz3 + 1.5 * gz3 * gz) * (.45 + .55 * nf) * fwdk * tipk, cool = 1. - .9 * min(wk, 1.);
  vec3 warm = wc * uNsTwi.x * uNsTwi.z * min(wk, .95);
  env *= cool; milk *= cool; seen *= .5 + .5 * cool;
  vec3 rim = (uNsColB * .22 * uNsSheet.x + vec3(.8, .87, 1.) * lm * .28) * mix(g3, gz3, .75) * cool * cool
    + vec3(.02, .60, .55) * .30 * uNsTwi.x * graze * graze * (1. - graze) * 4. * nf * tipk;      // turquoise inside the ember rim, on the north-facing skin
  // frost: feathered patches, most on the film the moon does not reach; sparkle by the mirror angle
  float shade = 1. - smoothstep(-.35, .35, dot(Ns, uNsMoonDir));
  float fr = smoothstep(.48, .68, nsFbm(vPos.xz / 9. + y * .11 + 3.)) * (.3 + .7 * shade);
  fr *= .5 + .5 * nsVn(vPos.xz * 1.9 + y * 2.3);
  vec2 cu = vec2(th * 110., vArc * 2.4), sc = floor(cu); float hs = nsH1(sc), dotk = 1. - smoothstep(.06, .24, length(fract(cu) - .5));
  float tw = pow(max(.5 + .5 * sin(uTime * (2. + 5. * hs) + hs * 80. + dot(Rf, vec3(31., 17., 23.))), 0.), 8.);
  float spark = mix(.14, step(.80, hs) * tw * 5. * dotk, 1. - smoothstep(.14, .42, fs));
  float sq = smoothstep(.25, .8, cosv), back = step(uFilmK.x, 0.), dim = 1. - .6 * back;   // (sq: the film seen square on)
  // (order 7: seen square on, the frost's pale body is a quarter of itself: its sparkle stays, nothing milky lies across the middle)
  vec3 frost = uFilmK.y * (1. + .3 * smoothstep(135., 165., y)) * max(fr, .03) * (vec3(.62, .72, .95) * (lm * .22 + .04 + .10 * uNsMoon.w) * mix(1., .25, sq) + vec3(.9, .95, 1.) * spark * (.35 + uNsMoon.x + 1.2 * uNsMoon.w));
  // (order 6) CLEAN AND CALM INSIDE: seen square on, the film is clear and the true sky comes through it (its own bent
  // image of the sky weighs a third on the near wall, a seventh on the far one); toward grazing sight it takes body.
  // The far wall is fainter in everything (image, mirror, milk, frost, tapes) than the near wall's gores and frost.
  // (order 7) A GREAT BALLOON OF CLEAR FILM: seen square on the film is nearly clear (its own bent image of the sky
  // weighs a sixth on the near wall, a sixteenth on the far one: stars, whirls and curtains come through unchanged,
  // only tinted); its light is gathered into the tapes, the scallops beside them, the rim and the warm north flank
  float alpha = mix(mix(.7, .16, sq), mix(.42, .06, sq), back);
  vec3 col = seen * uTint * alpha + (env * fres + milk * mix(1., .5, sq) + frost) * dim + glint * (.08 + fres) + warm + rim;
  alpha = clamp(alpha + .18 * fres + .12 * fr * mix(1., .3, sq), 0., .95);
  // THE SCALLOPS: every gore bulges between its two tapes; its skin turns away to either side, so beside each tape lies
  // a soft band of the moon's and the sheet's light (the gore's middle stays clear), the moonward half brighter
  float gw = 6.2832 * R / 160., dg = abs(fract(gore + .5) - .5), gc = fract(gore) - .5, sc3 = abs(gc) * 2.; sc3 = sc3 * sc3 * sc3;
  vec3 Ng = normalize(Ns + et * gc * .9); float mg = abs(dot(Ng, uNsMoonDir));
  col += (uNsColB * .07 * uNsSheet.x + vec3(.8, .87, 1.) * uNsMoon.x * .30 * mg * mg) * sc3 * (1. - smoothstep(.12, .35, fg)) * dim * tipk * uFilmK.z;
  // the load tapes: crisp pale meridians that carry the light, never thinner than a pixel and a half
  float hw0 = min(.035 / max(gw, .02), .3), hw = max(hw0, .75 * fg);
  float line = (1. - smoothstep(hw - fg * .5, hw + fg * .5, dg)) * clamp(hw0 / hw, .6, 1.);
  line = mix(line, min(.6, 2. * hw0), smoothstep(.25, .5, fg)) * uFilmK.z * dim;
  // moon glints run along the tapes (a broad mirror lobe, in dashes that travel)
  float tg = pow(rm, 6.) * pow(max(.5 + .5 * sin(vArc * .9 - uTime * 1.6 + gore * 2.4), 0.), 3.) * (uNsMoon.x + .4 * uNsMoon.w);
  col = mix(col, uNsColB * .10 * uNsSheet.x + vec3(.8, .87, 1.) * lm * .20 + glint * .15 + vec3(.85, .92, 1.) * tg * 1.1 + warm * 1.3 + wc * .10 * uNsTwi.x * nf * fwdk * tipk * graze * graze, line); alpha = mix(alpha, .9, line);
  // the tear's frayed edge and its running tip
  float edge = (1. - smoothstep(0., .5 + 2. * fs, -tr)) * step(0., uBurst);
  col += vec3(.72, .86, 1.) * (edge * .85 + tip * .7) * (.55 + .45 * uNsMoon.x);
  col += uFlash.rgb * uFlash.w * (.10 / max(cosv, .2) + fr * .5 + .04);
  // nothing clips to white. The film is clearer now (order 7), so the near wall's own light is held to what the sky
  // behind it leaves under 1.9 (and to 1.5), the far wall's to 0.55: the two and the sky behind stack to about 2
  col = min(col, mix(max(vec3(1.9) - (1. - alpha) * (sky0 + .15), vec3(.3)), vec3(.55), back));
  col = min(col, vec3(1.5));
  if (tr > 0.) discard;
  gl_FragColor = vec4(col, alpha);
}`;

function makeFilm(skyU, U, look, tearU) {
  const COLS = 320, ROWS = 64, nv = (COLS + 1) * (ROWS + 1);
  const aFilm = new Float32Array(nv * 4), aArc = new Float32Array(nv), pos = new Float32Array(nv * 3), idx = new Uint16Array(COLS * ROWS * 6);
  for (let r = 0, v = 0; r <= ROWS; r++) {
    const a = 2.6 + ((ARC.total - 2.6) * r) / ROWS, y = yOfArc(a); profile(y, _pr);
    for (let c = 0; c <= COLS; c++, v++) {
      const th = (c / COLS) * Math.PI * 2;
      aFilm[v * 4] = th; aFilm[v * 4 + 1] = y; aFilm[v * 4 + 2] = _pr[0]; aFilm[v * 4 + 3] = _pr[1]; aArc[v] = a;
      pos[v * 3] = Math.sin(th) * _pr[0]; pos[v * 3 + 1] = y; pos[v * 3 + 2] = Math.cos(th) * _pr[0];
    }
  }
  // rows run from the crown DOWN, bearings run east: (v00, v01, v11) is counter-clockwise seen from outside
  for (let r = 0, k = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const v00 = r * (COLS + 1) + c, v10 = v00 + 1, v01 = v00 + COLS + 1, v11 = v01 + 1;
    idx[k++] = v00; idx[k++] = v01; idx[k++] = v11; idx[k++] = v00; idx[k++] = v11; idx[k++] = v10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aFilm', new THREE.BufferAttribute(aFilm, 4));
  geo.setAttribute('aArc', new THREE.BufferAttribute(aArc, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const tint = look.film === 'gold' ? new THREE.Vector3(1.0, 0.93, 0.80) : new THREE.Vector3(0.90, 0.95, 1.0);
  const mk = (side, k, order) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...skyU, uEye: U.uEye, uTime: U.uTime, uBurst: U.uBurst, uFlash: U.uFlash, uTint: { value: tint }, uFilmK: { value: new THREE.Vector4(k, 1, k > 0 ? 0.75 : 0.35, 0) }, ...tearU },
      vertexShader: FILM_VERT, fragmentShader: FILM_FRAG, side, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = order; mesh.frustumCulled = false; return mesh;
  };
  return { back: mk(THREE.BackSide, -1.3, 1), front: mk(THREE.FrontSide, 1, 3), geo };
}

// ---------- crown plate with its valve, and the apex fitting (one mesh; the plate falls inside the bag when the crown tears) ----------
function makeCrown(skyU, U) {
  const lathe = (pts, part) => { const g = new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 28);
    g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1)); return g; };
  // the crown fitting where the 160 tapes meet: valve cap and body, the plate with its tape lugs, a raised clamp ring with bolts, a skirt
  const a = lathe([[0.001, 190.98], [0.44, 190.98], [0.52, 190.86], [0.52, 190.32], [0.98, 190.25], [2.4, 190.12], [2.5, 190.3], [3.0, 190.3], [3.12, 190.12], [3.12, 189.8], [0.001, 189.8]], 1);
  const b = lathe([[0.001, 62.2], [0.55, 62.2], [0.75, 61.6], [0.8, 60.3], [0.7, 60.0], [0.001, 60.0]], 0);
  const na = a.attributes.position.count, nb = b.attributes.position.count, geo = new THREE.BufferGeometry();
  const cat = (name, n) => { const out = new Float32Array((na + nb) * n); out.set(a.attributes[name].array, 0); out.set(b.attributes[name].array, na * n); return new THREE.BufferAttribute(out, n); };
  geo.setAttribute('position', cat('position', 3)); geo.setAttribute('normal', cat('normal', 3)); geo.setAttribute('aPart', cat('aPart', 1));
  const ia = a.index.array, ib = b.index.array, idx = new Uint16Array(ia.length + ib.length);
  idx.set(ia, 0); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + na;
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); a.dispose(); b.dispose();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uNsMoonDir: skyU.uNsMoonDir, uNsMoon: skyU.uNsMoon, uNsColA: skyU.uNsColA, uNsTwi: skyU.uNsTwi, uBurst: U.uBurst, uFlash: U.uFlash, uEye: U.uEye },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute float aPart; uniform float uBurst; varying vec3 vN; varying vec3 vP; varying float vPart;
      void main(){ float s = max(uBurst, 0.); vec3 p = position; p.y -= aPart * min(2.4 * s * s, 123.); vN = normal; vP = p; vPart = aPart;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uNsMoonDir; uniform vec4 uNsMoon; uniform vec3 uNsColA; uniform vec4 uNsTwi; uniform vec4 uFlash; uniform vec3 uEye;
      varying vec3 vN; varying vec3 vP; varying float vPart;
      void main(){ vec3 V = normalize(vP - uEye); vec3 N = normalize(vN); if (dot(N, V) > 0.) N = -N;
        float rm = max(dot(reflect(V, N), uNsMoonDir), 0.);
        // the fitting's own detail: forty tape lugs on the plate, twenty-four bolts on the clamp ring, the ring polished
        float ang = atan(vP.x, vP.z), rr = length(vP.xz), fa = clamp(fwidth(ang) * 40., 0., 3.);
        float lug = mix(.5, smoothstep(-.3, .3, cos(ang * 40.)), 1. - smoothstep(.6, 1.8, fa)) * smoothstep(1., 1.2, rr) * (1. - smoothstep(2.3, 2.45, rr));
        float ring = smoothstep(2.42, 2.5, rr) * (1. - smoothstep(3., 3.1, rr));
        float bolt = smoothstep(.72, .92, cos(ang * 24.)) * (1. - smoothstep(.07, .16, abs(rr - 2.75))) * (1. - smoothstep(.5, 1.5, fa));
        float metal = vPart * (ring * .55 + bolt * .9 - lug * .30);
        vec3 c = vec3(.36, .39, .45) * (1. + metal) * (vec3(.8, .87, 1.) * uNsMoon.x * (.08 + .7 * max(dot(N, uNsMoonDir), 0.)) + uNsColA * (.07 + .12 * uNsMoon.w) * (.6 + .4 * N.y)
          + vec3(1., .45, .2) * .22 * uNsTwi.x * max(-N.z, 0.)) + vec3(.9, .95, 1.) * uNsMoon.x * (pow(rm, 90.) * 1.6 + vPart * (ring + bolt) * pow(rm, 12.) * .7) + uFlash.rgb * uFlash.w * .25;
        gl_FragColor = vec4(c + vec3(.004, .006, .016), 1.); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---------- THE RIBBONS: fourteen strips of the film, a pure law of the burst's clock (uBurst) and, for flutter, of time ----------
// A point at arc a (m from the crown) is freed when the tear's front passes it (tau = s - a / 16). The freed part leaves the
// film at the hinge (the front, later the ribbon's root) as a circular arc in its meridian plane: straight at first (the bud),
// then curling outward at its outer end as the curvature grows. When the front passes the root (s = L / 16) the ribbon lets
// go: its root rises on the gas (100 m at most, 45 m/s at first, so it overtakes the lens and stands ahead of it) and draws in
// to a throat 18.5 to 30.5 m in radius round the last line; the petal stands nearly along the line and its outer half curls over.
// BY PLACE: every freed point keeps 14.5 m from the last straight line of the flight (pushed sideways, east or west).
const RIB_VERT = GLSL_FILM + /* glsl */`
attribute vec4 aRib;       // bearing of the strip's middle, arc a, u across (-1..1), half width (m)
attribute vec4 aRest;      // length L, ribbon number, phase, stagger 0..1
uniform vec3 uProf[25];    // the taut meridian every 4 m of arc from the crown: radius, height, lean of its tangent
varying vec3 vPos; varying vec3 vN; varying vec4 vRib; varying float vFree; varying float vL; varying vec2 vPc;
vec3 nsProf(float a){ float x = clamp(a / 4., 0., 23.99); int i = int(x); return mix(uProf[i], uProf[i + 1], x - float(i)); }
vec3 ribPose(float a, float u, out float free){
  // each ribbon tears at its own moment (up to .6 s late): s is its own clock
  float L = aRest.x, thc = aRib.x, s = uBurst - .6 * fract(aRest.y * .471 + .23), F = 16. * max(s, 0.);
  float tau = s - a / 16., trp = max(s - L / 16., 0.);
  vec3 pr = nsProf(a); float hwid = min(aRib.w, .42 * (6.2832 / 14.) * pr.x);
  float th = thc + u * hwid / max(pr.x, 1.), Rr = pr.x + nsFilmDisp(th, pr.y, pr.x);
  vec3 rest = vec3(sin(th) * Rr, pr.y, cos(th) * Rr);
  float ah = max(min(F, L), a); vec3 ph = nsProf(ah);
  // each ribbon has its own rise, throat, lean and curl (g, h2, k2), so the flower has depth and some petal is always beside the lens
  float g = aRest.w, h2 = fract(aRest.y * .618 + .3), k2 = fract(aRest.y * .377 + .1);
  float climb = (63. + 37. * g) * (1. - exp(-trp / (.9 + .4 * h2)));
  // FROM THE TEARING (order 4) a freed strip lifts on the gas at once: within two seconds it stands up from its hinge
  // along the last line's direction and its outer part (from 2 to 26 m off the hinge) is drawn round that line, so the
  // ribbons rise with us and stand large round the way out well before they let go
  float q = ah - a, pre = smoothstep(.5, 2.8, s) * smoothstep(2., 26., q);
  float bl = max(smoothstep(0., 5., trp), pre), hr = mix(ph.x, 16.5 + 8. * k2, bl), hy = ph.y + climb;
  float psi0 = mix(ph.z, .02 + .16 * h2, smoothstep(.3, 2.4, s));
  // LATE (3.5 to 9.5 s after it lets go) the flower climbs past the lens again: its roots come to stand close round the way
  // out, just under its plane, and the petals open outward along the cone kept clear beyond it
  float sm = smoothstep(3.5, 9.5, trp);
  hr = mix(hr, 15.2 + 5. * k2, sm); hy = mix(hy, 266. + 11. * g, sm); psi0 = mix(psi0, .10 + .22 * h2, sm);
  float uncurl = 1. - .22 * sm;                                                          // (the curled tips open out a little; order 6: they stay curled)
  // the inner half of the freed length stands straight; the outer half curls slowly (1.25 to 2 radians when full blown)
  float q0 = .5 * L, q1 = min(q, q0), q2 = max(q - q0, 0.);
  float kap = ((1.25 + .75 * k2) / (.5 * L)) * smoothstep(5.5, 13., s) * uncurl + 1e-4, psi = psi0 + kap * q2;
  float dr = sin(psi0) * q1 + (cos(psi0) - cos(psi)) / kap, dh = cos(psi0) * q1 + (sin(psi) - sin(psi0)) / kap;
  float lift = smoothstep(0., 2., tau), amp = min(q * .05, 1.6) * lift;
  float fl = sin(q * .12 - uTime * 1.3 + aRest.z) * .6 + sin(q * .25 - uTime * 1.9 + aRest.z * 1.7 + u * 1.1) * .25;
  // the freed flower stands round the way out: its middle slides from the balloon's axis to the last straight line, its up leans with it
  vec3 upv = normalize(mix(vec3(0., 1., 0.), vec3(0., .927568, -.373656), bl));
  vec3 er = normalize(mix(vec3(sin(thc), 0., cos(thc)), vec3(sin(thc), .373656 * cos(thc), .927568 * cos(thc)), bl)), et = normalize(cross(upv, er));
  vec3 mid = vec3(0., hy, bl * (59.7 - (hy - 130.3) * .402834));
  vec3 nr = er * cos(psi) - upv * sin(psi);                                            // the ribbon's own normal, in its meridian plane
  // a slow twist along its length, and (order 6) each petal's own steady turn, an eighth to a third of a turn at its tip
  float tw = (.45 * sin(q * .04 + aRest.z + uTime * .22) + (.8 + 1.3 * h2) * (q / L) * (sin(aRest.z * 3.) > 0. ? 1. : -1.)) * lift;
  float fold = (sin(u * 3.9 + q * .05 + aRest.z * 2.) * .5 + sin(u * 8.5 - q * .09 + aRest.z) * .16) * min(q * .1, 1.) * lift;   // long folds
  // (order 6: it is cupped across its width like a trough, deeper toward its tip)
  vec3 pose = mid + er * (hr + dr) + upv * dh + (et * cos(tw) + nr * sin(tw)) * (u * hwid)
    + et * sin(q * .08 - uTime * .8 + aRest.z * 2.) * .8 * amp + nr * (fl * amp + fold) + (nr * cos(tw) - et * sin(tw)) * (u * u - .33) * hwid * (.25 + .5 * q / L) * lift;
  free = smoothstep(0., 1.1, tau);
  return mix(rest, pose, free);
}
// THE PIECES (order 7): 5 to 7.2 s after it began to tear a ribbon parts into three. Each piece keeps its own shape and
// from then on turns end over end about its own middle (gAng, about the axis across it), bends (gKap) and drifts
// (gDr), so the wheel has depth and the lens goes THROUGH it. Some middle pieces (the widest) curl up tight, turn
// slowly and come near: large curls that pass close by at the last. The frame (gC middle, gT along, gA across, gN normal) is set once for a vertex's piece in main.
vec3 gC, gT, gA, gN, gDr; float gBr, gKap, gAng;
vec3 ribPiece(vec3 p){
  vec3 r = p - gC; float rx = dot(r, gT), ry = dot(r, gA), rz = dot(r, gN);
  float ph = gKap * rx, sx = sin(ph), cx = cos(ph), x1 = sx / gKap - rz * sx, z1 = (1. - cx) / gKap + rz * cx;
  float ca = cos(gAng), sa = sin(gAng);
  return gC + gDr + gT * (x1 * ca - z1 * sa) + gN * (x1 * sa + z1 * ca) + gA * ry;
}
vec3 ribPos(float a, float u, out float free){
  vec3 p = ribPose(a, u, free); if (gBr > 0.) p = ribPiece(p);
  float thc = aRib.x, tau = uBurst - .6 * fract(aRest.y * .471 + .23) - a / 16.;
  // the way out keeps its air: 14.5 m round the last straight line, for every freed point (a piece's too: this law is the last)
  const vec3 LF = vec3(0., 130.3, 59.7), LD = vec3(0., .927568, -.373656);
  // (past the way out's plane, 160 m along the line, the clear space widens as a cone, so no freed point seen from the line
  // more than 5 m before the plane is ever seen inside the ring or before it: 14.5 m, or 10.5 + 1.4 m for each metre past the plane)
  float tl = dot(p - LF, LD); vec3 c = LF + LD * tl, r = p - c; float rag = 2.5 * fract(aRest.y * .37 + .2) + 2.5 + 2.5 * sin(a * .33 + aRest.z);   // (a ragged margin over the 14.5 m, so no round window is cut)
  float d = length(r), keep = max(14.5 + rag, 10.5 + 1.4 * (tl - 160.)) * smoothstep(0., 1.4, tau);
  float k = clamp(1. - d / max(keep, 1e-3), 0., 1.);
  vec3 n = normalize(r + vec3(sign(sin(thc)) * (k * keep * 1.2 + 1e-4), 0., 0.));
  // (a point that would lie inside is laid outward past the margin, the deeper the further, so the film folds back
  // there and no round rim is drawn on the tube)
  return c + n * max(d, keep + (keep - d) * .5);
}
void main(){
  float f0, f1, f2, fq;
  // this vertex's piece (0 the tip third, 2 the root third) and its ribbon's parting clock
  float L = aRest.x, h2 = fract(aRest.y * .618 + .3), sb = uBurst - .6 * fract(aRest.y * .471 + .23) - (5. + 2.2 * h2);
  float kf = min(floor((aRib.y - 2.6) / (L - 2.6) * 3. + 1e-3), 2.);
  gBr = 0.; gKap = 1e-4; gAng = 0.; gC = vec3(0.); gDr = vec3(0.); gT = vec3(0., 1., 0.); gA = vec3(1., 0., 0.); gN = vec3(0., 0., 1.);
  if (sb > 0.) {
    float ac = 2.6 + (L - 2.6) * (kf + .5) / 3.;
    gC = ribPose(ac, 0., fq); vec3 c2 = ribPose(ac - 1., 0., fq), c3 = ribPose(ac, 1., fq) - gC;
    gT = normalize(c2 - gC + vec3(0., 1e-5, 0.)); gA = normalize(c3 - gT * dot(c3, gT) + vec3(1e-5, 0., 0.)); gN = cross(gT, gA);
    float hk = fract(aRest.y * .733 + kf * .37 + .11), hk2 = fract(hk * 7.13 + .3), hk3 = fract(hk * 13.7 + .6);
    float curl = step(.5, kf) * step(kf, 1.5) * step(hk2, .3), sg = hk > .5 ? 1. : -1., g = sb * sb / (sb + 1.5);   // (a close curl is a middle piece, the widest)
    gKap = mix(.012 + .03 * hk3, .11 + .05 * hk3, curl) * smoothstep(0., 3., sb) + 1e-4;
    gAng = mix(.5 + .7 * hk3, .18, curl) * sg * g;
    const vec3 LF = vec3(0., 130.3, 59.7), LD = vec3(0., .927568, -.373656);
    vec3 rr = gC - LF; rr -= LD * dot(rr, LD); float rl = max(length(rr), 1e-3); rr /= rl;
    // two pieces in five fall behind (2 to 7 m/s, so the lens overtakes them one after another); the rest stay ahead as
    // the wheel round the way out and drift 2 to 24 m outward (far ones small); a close curl is drawn in to 17 m from
    // the line (the law of place below then holds it outside the clear air) and falls behind only a little: the lens
    // comes up to it and passes it in the last two seconds
    float vt = hk > .62 ? 2. + 5. * (hk - .62) / .38 : .3;
    gDr = -LD * mix(vt, .5 + 1.5 * hk3, curl) * g + rr * mix(2. + 22. * hk2 * hk2, 17. - rl, curl) * (1. - exp(-sb / 3.5));
    gBr = smoothstep(0., .8, sb);
  }
  vec3 p = ribPos(aRib.y, aRib.z, f0), pa = ribPos(aRib.y + .35, aRib.z, f1), pu = ribPos(aRib.y, aRib.z + .08, f2);
  vec3 nn = cross(pa - p, pu - p); float nl = length(nn);
  vN = nl > 1e-6 ? nn / nl : vec3(0., 1., 0.); vPos = p; vRib = aRib; vFree = f0; vL = aRest.x; vPc = vec2(kf, gBr);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

const RIB_FRAG = SKY_GLSL + /* glsl */`
uniform vec3 uEye; uniform vec4 uFlash; uniform vec3 uTint; uniform float uBurst; uniform float uTime;
varying vec3 vPos; varying vec3 vN; varying vec4 vRib; varying float vFree; varying float vL; varying vec2 vPc;` + GLSL_HOLE + /* glsl */`
void main(){
  float a = vRib.y, u = vRib.z;
  float gore = vRib.x * (160. / 6.2832) + u * vRib.w * .57, fg = fwidth(gore);        // the tapes ride the ribbon, 1.77 m apart
  float fs = clamp(length(fwidth(vPos)), 1e-4, 50.);
  vec3 N = normalize(vN), V = normalize(vPos - uEye);
  // (order 5) A PETAL CURLS IN DEPTH: across its width it is cupped like a trough (the normal leans out toward either
  // edge, more as it comes free), so one side takes the light and the other lies in shade. Tu: the direction across it.
  vec3 px = dFdx(vPos), py = dFdy(vPos); float ax = dFdx(a), ay = dFdy(a), ux = dFdx(u), uy = dFdy(u);
  vec3 Tu = (px * ay - py * ax) * (ux * ay - uy * ax); Tu = Tu / max(length(Tu), 1e-9);
  N = normalize(N + Tu * u * .75 * vFree);
  float nv = dot(N, V), cosv = abs(nv), graze = max(1. - cosv, 0.), fres = .05 + .95 * pow(graze, 5.);
  vec3 Nv = N * sign(-nv);                                                              // the face turned to the eye
  float wm = .22 + .78 * smoothstep(-.35, .75, dot(Nv, uNsMoonDir)), wu = .3 + .7 * smoothstep(-.5, .8, Nv.y), wn = .25 + .75 * smoothstep(-.4, .7, -Nv.z);
  float lit = mix(wu, wm, .65 * min(uNsMoon.x, 1.));
  // the envelope's own clear film: the sky bent through it by its folds, the mirror at grazing angles, glints, frost, tape lines
  vec3 seen = nsSkyS(normalize(V + N * sign(-nv) * .13), clamp(length(fwidth(V)) * 2., 1e-5, .05), .7);
  vec3 Rf = reflect(V, nv > 0. ? -N : N); float rm = max(dot(Rf, uNsMoonDir), 0.);
  float aR = (asin(clamp(Rf.y, -1., 1.)) + .10895) * 57.2958, cnR = -Rf.z / max(length(Rf.xz), 1e-4);
  vec3 env = aR > 0. ? nsArc(aR, cnR) + mix(uNsColB, uNsColA, clamp(Rf.y, 0., 1.)) * .10 * uNsSheet.x : vec3(.02, .03, .06) * (.4 + uNsMoon.x);
  vec3 glint = vec3(.92, .96, 1.) * uNsMoon.x * min(pow(rm, 500.) * 12. + pow(rm, 40.) * .5, 1.6);
  float lm = uNsMoon.x * (.35 + .65 * abs(dot(N, uNsMoonDir)));
  vec3 milk = uTint * (vec3(.80, .87, 1.) * lm * .020 + uNsColA * (.012 + .07 * uNsMoon.w) + vec3(1., .36, .14) * .06 * uNsTwi.x * max(-N.z * sign(-nv), 0.)) / max(cosv, .16);
  float fr = smoothstep(.45, .68, nsFbm(vec2(a * .16, u * 1.3 + vRib.x * 7.)));
  vec2 cu = vec2(u * vRib.w * 3., a * 3.); float hs = nsH1(floor(cu) + vRib.x * 31.), dotk = 1. - smoothstep(.07, .26, length(fract(cu) - .5));
  float tw = pow(max(.5 + .5 * sin(uTime * (2. + 5. * hs) + hs * 80. + dot(Rf, vec3(31., 17., 23.))), 0.), 8.);
  float spark = mix(.05, step(.84, hs) * tw * 5. * dotk, 1. - smoothstep(.08, .24, fs));
  vec3 frost = .5 * max(fr, .05) * (vec3(.62, .72, .95) * (lm * .22 + .04 + .10 * uNsMoon.w) + vec3(.9, .95, 1.) * spark * (.35 + uNsMoon.x + 1.2 * uNsMoon.w));
  // its own body: the moon's light on the lit side, the sheet's blue from above, the arc's ember and gold from the north;
  // the sky is seen dimly through it, dimmer through the shaded side
  vec3 wc = mix(vec3(1., .33, .10), vec3(1., .22, .07), uNsTwi.w) * mix(vec3(1.), vec3(1., 1.45, 1.5), smoothstep(.62, .95, graze));
  float fwdk = .4 + .6 * smoothstep(-.2, .9, -V.z);
  vec3 body = uTint * (vec3(.80, .87, 1.) * uNsMoon.x * wm * .05 + uNsColA * .025 * uNsSheet.x * wu) * vFree + wc * uNsTwi.x * uNsTwi.z * (.8 + 1. * vPc.y) * graze * graze * graze * graze * (.3 + .7 * wn) * fwdk;
  float alpha = .7;
  vec3 col = (seen * uTint * alpha + env * fres + milk + frost) * mix(1., .42 + .58 * lit, vFree) + glint * (.08 + fres) + body;
  alpha = clamp(alpha + .18 * fres + .05 * fr, 0., .95);
  float dg = abs(fract(gore + .5) - .5), hw = max(.02, .75 * fg);
  float line = (1. - smoothstep(hw - fg * .5, hw + fg * .5, dg)) * clamp(.02 / hw, .35, 1.) * .7;
  col = mix(col, vec3(.010, .014, .034) + glint * .15, line); alpha = mix(alpha, .96, line);
  // frayed edges, brighter; the cut end where the tear's front is
  // while it still lies in the film a strip fills its place whole (no dark slice beside it); it narrows to its torn root
  // and its edges fray only as it comes free
  // (order 6) NO PETAL IS A RECTANGLE: freed, it is a leaf, a tenth of its width at its tip, full 30 m from the tip,
  // and it narrows again over its last 26 m to the torn root
  float wf = mix(1., pow(clamp((vL - a) / 26., 0., 1.), .75) * (.10 + .90 * pow(smoothstep(0., 30., a - nsHole(vRib.x)), .8)), vFree);
  // (order 7) where the ribbon parts into three it necks and tears: each piece narrows to a ragged point at its torn ends
  float dc = min(abs(a - 2.6 - (vL - 2.6) * .32778), abs(a - 2.6 - (vL - 2.6) * .66111)) + 3. * (nsVn(vec2(a * .37 + vRib.x * 5., 9.)) - .5);
  wf *= mix(1., .10 + .90 * smoothstep(-.5, 8., dc), vPc.y);
  float e = 1. - abs(u) / max(wf, .02) - vFree * (.30 * nsVn(vec2(a * .31, sign(u) * 3. + vRib.x * 9.)) + .07 * nsVn(vec2(a * 2.3, u * 5.)) + .04);
  float sdl = uBurst - .6 * fract(floor(vRib.x / .448799) * .471 + .23);                // this ribbon's own clock
  float cut = 16. * sdl - a + (nsVn(vec2(vRib.x * 60., a * .9)) - .5) * .75;
  // its tip ends at the torn hole's ragged lip (near the crown the radius is about the arc, so the bearing is known)
  float hl = a - nsHole(vRib.x + u * min(vRib.w / max(a, 1.), .1885)) - (nsVn(vec2(vRib.x * 60. + u * 9., a * .9)) - .5) * 1.1;
  cut = min(cut, hl);
  cut = min(cut, vL - a - .4 - 5. * nsVn(vec2(u * 1.7 + vRib.x * 5., 3.)) * nsVn(vec2(u * 6., vRib.x * 3.)));   // the torn root
  // the torn edge: a thin bright fray, a pixel and a half at the least; no drawn outline
  float fray = 1. - smoothstep(0., .02 + 1.5 * fs / max(vRib.w, .5), e);
  // the edge that faces north takes the arc's ember and gold (the same rim as the film's)
  float en = max(-Tu.z * sign(u), 0.), eb = 1. - smoothstep(0., .07 + 2. * fs / max(vRib.w, .5), e);
  col += wc * uNsTwi.x * uNsTwi.z * eb * vFree * (.9 + 1. * vPc.y) * en;
  col += vec3(.72, .86, 1.) * (fray * vFree * (.14 + .22 * uNsMoon.x) * (1. - .7 * en) + (1. - smoothstep(0., .5 + 2. * fs, hl)) * (.45 + .4 * uNsMoon.x)) + uFlash.rgb * uFlash.w * (.10 / max(cosv, .2) + fr * .5 + .04);
  col = min(col, vec3(1.5));
  if (e < 0. || cut < 0.) discard;
  if (vPc.y > 0. && abs(vPc.x - floor(vPc.x + .5)) > .02) discard;                        // (the one row of cells that spanned two pieces)
  // a frayed edge, not a cut one: the film thins out toward it over an unequal width (a twentieth to a fifth of the petal)
  float thr = nsVn(vec2(a * .9 + vRib.x * 13., 2.)) * nsVn(vec2(a * 4.1, vRib.x * 7. + sign(u))), fz = mix(1., smoothstep(0., .05 + .17 * thr, e), vFree);
  gl_FragColor = vec4(col * fz, alpha * fz);
}`;

function makeRibbons(skyU, U, look, ribL, ribW, rng) {
  const NR = 14, NU = 8, NA = 90, per = (NU + 1) * (NA + 1), nv = NR * per;
  const aRib = new Float32Array(nv * 4), aRest = new Float32Array(nv * 4), pos = new Float32Array(nv * 3), idx = new Uint16Array(NR * NU * NA * 6);
  let k = 0;
  for (let i = 0; i < NR; i++) {
    const thc = ((i + 0.5) / NR) * Math.PI * 2, L = ribL[i], hw = ribW[i] / 2, phase = rng() * 6.283, stag = rng(), base = i * per;
    for (let j = 0; j <= NA; j++) for (let c = 0; c <= NU; c++) {
      const v = base + j * (NU + 1) + c, a = 2.6 + ((L - 2.6) * j) / NA;
      aRib[v * 4] = thc; aRib[v * 4 + 1] = a; aRib[v * 4 + 2] = -1 + (2 * c) / NU; aRib[v * 4 + 3] = hw;
      aRest[v * 4] = L; aRest[v * 4 + 1] = i; aRest[v * 4 + 2] = phase; aRest[v * 4 + 3] = stag;
      pos[v * 3 + 1] = 150;
    }
    for (let j = 0; j < NA; j++) for (let c = 0; c < NU; c++) {
      const v00 = base + j * (NU + 1) + c, v10 = v00 + 1, v01 = v00 + NU + 1, v11 = v01 + 1;
      idx[k++] = v00; idx[k++] = v01; idx[k++] = v11; idx[k++] = v00; idx[k++] = v11; idx[k++] = v10;
    }
  }
  const prof = [];
  for (let n = 0; n < 25; n++) { const a = n * 4, y = a <= 2.6 ? 190 : yOfArc(a); profile(y, _pr); prof.push(new THREE.Vector3(a <= 2.6 ? a : _pr[0], y, Math.atan(_pr[1]))); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRib', new THREE.BufferAttribute(aRib, 4));
  geo.setAttribute('aRest', new THREE.BufferAttribute(aRest, 4));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const tint = look.film === 'gold' ? new THREE.Vector3(1.0, 0.93, 0.80) : new THREE.Vector3(0.90, 0.95, 1.0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...skyU, uEye: U.uEye, uTime: U.uTime, uBurst: U.uBurst, uFlash: U.uFlash, uTint: { value: tint }, uProf: { value: prof } },
    vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 4; mesh.frustumCulled = false; mesh.visible = false;
  return mesh;
}

// ---------- frost flakes and ice dust: instanced quads, a medium (no state: each is a law of time, or of the burst's clock) ----------
const PART_TAIL = /* glsl */`
uniform vec3 uEye; uniform vec2 uPx; uniform vec3 uNsMoonDir; uniform vec4 uNsMoon; uniform vec3 uNsColA; uniform vec4 uNsTwi; uniform vec4 uFlash;
varying vec2 vUv; varying vec3 vCol;
// a tumbling plate at c (balloon space): its corner, never under a pixel and a half; its glint by the mirror angle of the moon
// (dull: its light when it shows no glint; rose: how much of the arc's rose a face turned north takes; cap: its most)
void nsPlate(vec3 c, float size, float spin, float vis, float dull, float rose, float cap){
  vec3 V = normalize(c - uEye);
  vec3 n = normalize(vec3(sin(spin), cos(spin * .73 + 1.), sin(spin * 1.31 + 2.)));
  vec3 H = normalize(uNsMoonDir - V);
  float spec = pow(abs(dot(n, H)), 24.), face = .25 + .75 * abs(dot(n, V));
  vec4 mv = modelViewMatrix * vec4(c, 1.);
  float px = size * projectionMatrix[1][1] * uPx.y * .5 / max(-mv.z, .05), grow = max(1., 1.5 / max(px, 1e-3));
  float ang = spin * .37; vec2 q = vec2(position.x * cos(ang) - position.y * sin(ang), position.x * sin(ang) + position.y * cos(ang));
  mv.xy += q * vec2(1., face) * size * grow;
  vUv = position.xy;
  vCol = min((vec3(.80, .87, 1.) * uNsMoon.x * (dull + 9. * spec) + uNsColA * (.3 + .6 * uNsMoon.w) * (2.5 * dull + 5. * spec * (.3 + uNsMoon.w))
    + vec3(1., .40, .20) * (rose * uNsTwi.x * pow(abs(n.z), 6.) * (.5 + 1.5 * face)) + uFlash.rgb * uFlash.w * .8) * vis / (grow * grow) * min(grow, 3.), vec3(cap));
  gl_Position = projectionMatrix * mv;
}`;
const FLAKE_VERT = /* glsl */`
attribute vec4 aA;         // bearing, birth height, radius at birth (film + offset), phase
attribute vec4 aB;         // period s, fall m/s, size m, number 0..1
uniform float uTime; uniform float uShed;` + PART_TAIL + /* glsl */`
void main(){
  // shed from the widest film, a flake falls free beside the lower cone and drifts outward at its own speed
  float ph = fract(uTime / aB.x + aA.w), age = ph * aB.x, vr = .3 + 2.4 * pow(fract(aA.w * 7.31), 1.5);
  float th = aA.x + .6 * sin(age * .21 + aA.w * 30.) / aA.z, r = aA.z + vr * age + .5 * sin(age * .5 + aA.w * 50.);
  vec3 c = vec3(sin(th) * r, aA.y - aB.y * age + .3 * sin(age * .9 + aA.w * 70.), cos(th) * r);
  // BY PLACE (order 5, the house term): no flake's middle within 2.6 m of the flown half plane (x = 0, z >= 0), so
  // that with its own size (0.34 m at the most) every flake leaves 2 m and more of clear air round the flown line
  float zk = min(c.z, 0.), kx = sqrt(max(6.76 - zk * zk, 0.));
  c.x += sign(c.x + 1e-4) * kx * exp(-abs(c.x) / max(kx, 1e-3));
  // (order 8) NO FLAKE POPS: each grows in by the route, in light, over a fifth of the shedding's measure (two thirds
  // of a second of route and more: a metre and a half to two of its fall), where it had come by a hard step
  float vis = smoothstep(aB.w * .8, aB.w * .8 + .2, uShed) * smoothstep(0., .04, ph) * (1. - smoothstep(.9, 1., ph));
  nsPlate(c, aB.z, uTime * (1.5 + 4. * aB.w) + aA.w * 90., vis, .4, 0., .9);
}`;
const DUST_VERT = /* glsl */`
attribute vec4 aA;         // bearing, arc a, taut radius, height
attribute vec4 aB;         // speed outward, speed upward, size m, number 0..1
uniform float uTime; uniform float uBurst;` + PART_TAIL + /* glsl */`
void main(){
  float tau = uBurst - aA.y / 16. - aB.w * .7, tp = max(tau, 0.), life = 15. + 6. * fract(aB.w * 7.3);
  float r = aA.z + aB.x * 2.5 * (1. - exp(-tp / 2.5)) + .6 * sin(uTime * .9 + aB.w * 40.);
  float th = aA.x + .5 * sin(uTime * .6 + aB.w * 60.) / max(aA.z, 4.);
  vec3 c = vec3(sin(th) * r, aA.w + aB.y * 2.2 * (1. - exp(-tp / 2.2)) + (7.5 + 7. * fract(aB.w * 3.7)) * tp, cos(th) * r);   // carried up on the gas, with the flower
  const vec3 LF = vec3(0., 130.3, 59.7), LD = vec3(0., .927568, -.373656);
  // BY PLACE: nothing stands before the way out (its ring is 7 m in radius). From the crown upward (64 m along the last
  // line) no speck within 9 m of that line, thinning softly over 7 m more; past the way out's plane the tube opens as the
  // same cone the ribbons keep (10.5 + 1.4 m per metre), so no speck is seen inside the ring; below the crown 2.6 m of
  // air to a speck's middle (order 5: the house term of 2 m of clear air).
  float tc = dot(c - LF, LD), dl = length(c - LF - LD * tc);
  float tube = max(mix(2.6, 9., smoothstep(48., 64., tc)), 10.5 + 1.4 * (tc - 160.));
  float vis = step(0., tau) * smoothstep(0., .4, tp) * (1. - smoothstep(life * .65, life, tp)) * smoothstep(tube, tube + 7., dl);
  // (order 8) GLITTER, NOT SNOW: a grain is dull till it turns its face to the moon's mirror, and takes the arc's rose
  // when its face is turned north
  // (a grain is capped at 0.55, so its glint over a bright piece of film stays at about 2)
  nsPlate(c, aB.z, uTime * (2. + 5. * aB.w) + aB.w * 90., vis, .14, .5, .55);
}`;
const PART_FRAG = /* glsl */`varying vec2 vUv; varying vec3 vCol;
void main(){ float d = length(vUv); gl_FragColor = vec4(vCol * (1. - smoothstep(.55, 1., d)), 0.); }`;

function makeParticles(skyU, U, vert, aA, aB, extra) {
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
  geo.instanceCount = aA.length / 4;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uEye: U.uEye, uPx: U.uPx, uTime: U.uTime, uFlash: U.uFlash, uNsMoonDir: skyU.uNsMoonDir, uNsMoon: skyU.uNsMoon, uNsColA: skyU.uNsColA, uNsTwi: skyU.uNsTwi, ...extra },
    vertexShader: vert, fragmentShader: PART_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

export async function buildHero(ctx, opts = {}) {
  // nothing is drawn from ctx.rng itself but one named fork; every stream below is a named fork of that one
  const base = ctx.rng.fork('ns-hero'), detail = (ctx.quality && ctx.quality.detail) || 1;
  const look = dealLook(base.fork('look'), opts.look || {});
  const skyUniforms = skyUniformsFor(look, base.fork('sky'));
  const rng = base.fork('craft');
  const object = new THREE.Group(), craft = new THREE.Group(), sky = new THREE.Group();
  object.add(sky); object.add(craft);
  sky.add(makeSky(skyUniforms));
  await ctx.yield();
  // what every piece of the craft shares: the eye in balloon space, the clocks, the flash, the size of a pixel
  const U = {
    uEye: { value: new THREE.Vector3(0, 0, 100) }, uTime: skyUniforms.uNsTime, uBurst: { value: -1 }, uShed: { value: 0.5 },
    uFlash: { value: new THREE.Vector4(1, 1, 1, 0) }, uPx: { value: new THREE.Vector2(1280, 720) },
  };
  const parts = [];   // each: { update?(dt, time) }
  // fourteen ribbons (ribbon i lies between seam i and seam i + 1; seam 0 is the south meridian) and where each seam's tear ends
  const ribL = [], ribW = [];
  for (let i = 0; i < 14; i++) { ribL.push(rng.range(54, 72)); ribW.push(rng.range(7, 11)); }
  const seamEnd = []; for (let k = 0; k < 14; k++) seamEnd.push(k === 0 ? 150 : Math.max(ribL[(k + 13) % 14], ribL[k]) + 2);
  const tearU = { uSeamEnd: { value: seamEnd }, uRibL: { value: ribL }, uRibW: { value: ribW.map((w) => w / 2) } };
  const film = makeFilm(skyUniforms, U, look, tearU); craft.add(film.back, film.front);
  await ctx.yield();
  craft.add(makeCrown(skyUniforms, U));
  await ctx.yield();
  const ribbons = makeRibbons(skyUniforms, U, look, ribL, ribW, rng); craft.add(ribbons);
  await ctx.yield();
  // frost flakes: shed from the lower film (where a flake falls free of it), more from the film the moon does not reach
  const NF = Math.max(200, Math.round(3000 * detail)), fA = new Float32Array(NF * 4), fB = new Float32Array(NF * 4);
  for (let i = 0; i < NF; i++) {
    let th = 0, y0 = 0;
    for (let tries = 0; tries < 6; tries++) {
      th = rng() * Math.PI * 2; y0 = rng.range(118, 168); profile(y0, _pr);
      const nl = Math.hypot(1, _pr[1]), nd = (Math.sin(th) * MOON_DIR.x + Math.cos(th) * MOON_DIR.z - _pr[1] * MOON_DIR.y) / nl;
      if (rng() < 0.5 + 0.5 * (1 - smoothstep(-0.35, 0.35, nd))) break;
    }
    fA[i * 4] = th; fA[i * 4 + 1] = y0; fA[i * 4 + 2] = radiusAt(y0) + 0.3 + 1.5 * rng(); fA[i * 4 + 3] = rng();
    fB[i * 4] = rng.range(24, 38); fB[i * 4 + 1] = rng.range(2.0, 3.2); fB[i * 4 + 2] = rng() < 0.1 ? rng.range(0.16, 0.34) : rng.range(0.05, 0.1); fB[i * 4 + 3] = rng();
  }
  const flakes = makeParticles(skyUniforms, U, FLAKE_VERT, fA, fB, { uShed: U.uShed }); craft.add(flakes);
  await ctx.yield();
  // ice dust of the burst: born on the seams as the tear's front passes them
  const ND = Math.max(300, Math.round(3000 * detail)), dA = new Float32Array(ND * 4), dB = new Float32Array(ND * 4);
  for (let i = 0; i < ND; i++) {
    // (order 8) IN WISPS, NOT EVENLY: births gather in puffs along each seam (some 33 m apart, each seam's out of
    // step with the next), and a puff's grains share their number, so they rise and drift together as one wisp
    let k = 0, a = 3, pw = 0;
    for (let g = 0; g < 5; g++) {
      k = rng() < 0.1 ? 0 : rng.int(0, 13); a = rng.range(3, seamEnd[k] - 2); pw = 0.5 + 0.5 * Math.sin(a * 0.19 + k * 2.4);
      if (rng() < 0.1 + 0.9 * pw * pw * pw) break;
    }
    const y = yOfArc(a), R = profile(y, _pr)[0], puff = Math.floor((a * 0.19 + k * 2.4) / (Math.PI * 2) - 0.25);
    const pn = Math.sin(puff * 12.9898 + k * 78.233) * 43758.5453, wisp = pn - Math.floor(pn);
    dA[i * 4] = (k / 14) * Math.PI * 2 + (rng.gauss() * (k === 0 ? 3 : 0.8)) / Math.max(R, 3);   // (the south seam's dust is spread: no column in the flown plane)
    dA[i * 4 + 1] = a; dA[i * 4 + 2] = R; dA[i * 4 + 3] = y;                                // (order 8: these three stood inside the remark above)
    dB[i * 4] = rng.range(1.5, 9); dB[i * 4 + 1] = rng.range(5, 16); dB[i * 4 + 2] = rng.range(0.06, 0.2); dB[i * 4 + 3] = clamp(wisp * 0.94 + 0.03 + rng.range(-0.025, 0.025), 0, 1);
  }
  const dust = makeParticles(skyUniforms, U, DUST_VERT, dA, dB, { uBurst: U.uBurst }); dust.visible = false; craft.add(dust);
  await ctx.yield();
  parts.push({ update() { const on = U.uBurst.value > 0; ribbons.visible = on; dust.visible = on; } });

  const poses = POSES.map((p) => ({ t: p[0], position: [0, p[2], p[1]], pitch: p[3], heading: p[4] }));
  const anchors = {
    apex: [0, 60, 0], crown: [0, 190, 0], portal: PORTAL.slice(), lineFrom: LINE_FROM.slice(), lineDir: LINE_DIR.slice(),
    moonDir: [MOON_DIR.x, MOON_DIR.y, MOON_DIR.z], poses, burstAt: 30.8, tearSpeed: 16,
  };
  const _inv = new THREE.Matrix4(), _eye = new THREE.Vector3(), _size = new THREE.Vector2();
  function update(dt, time, camera) {
    object.updateWorldMatrix(true, false);
    _inv.copy(object.matrixWorld).invert();
    _eye.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_inv);   // the eye in balloon space, from the camera passed in
    sky.position.copy(_eye); U.uEye.value.copy(_eye);
    skyUniforms.uNsTime.value = time;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_size); U.uPx.value.copy(_size); }
    for (const p of parts) if (p.update) p.update(dt, time);
  }
  const api = {
    object, craft, sky, skyUniforms, look, anchors, radiusAt,
    setBurst(s) { U.uBurst.value = +s || 0; },
    setShed(k) { U.uShed.value = clamp(+k || 0, 0, 1); },
    setFlash(k, color) { U.uFlash.value.w = clamp(+k || 0, 0, 1); if (color != null) { const c = color.isColor ? color : _col.set(color); U.uFlash.value.x = c.r; U.uFlash.value.y = c.g; U.uFlash.value.z = c.b; } },
    flight: (t, pos = new THREE.Vector3(), quat = new THREE.Quaternion()) => { flightAt(t, pos, quat); return { position: pos, quaternion: quat }; },
    update,
    dispose() {   // every geometry and material of the part (it makes no texture of its own; any found in a uniform is freed too)
      const seen = new Set();
      object.traverse((o) => { for (const r of [o.geometry, o.material]) if (r && !seen.has(r)) { seen.add(r);
        if (r.uniforms) for (const k in r.uniforms) { const v = r.uniforms[k] && r.uniforms[k].value; if (v && v.isTexture) v.dispose(); }
        r.dispose(); } });
    },
    radius: 70, height: 130, center: new THREE.Vector3(0, 125, 0), ground: false, groundY: 0,
  };
  object.userData.nightShining = api;
  return api;
}

