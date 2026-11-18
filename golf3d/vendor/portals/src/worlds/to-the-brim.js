// TO THE BRIM: midnight in a vast banqueting hall laid for a feast nobody has come to yet. 5,108 wine glasses and the
// one stand on linen tables, on a tiered pyramid and on shelved walls, every one poured exactly half
// full; at the far end THE GREAT GLASS, eight times their size (7.04 m tall), stands alone on a plinth under the
// canopy and is being filled from a great decanter, past the line, past the rim, into a dome that holds.
//
// SPACE (the brief's): x east, y up, z SOUTH; floor y 0; we fly north (-z). Built 4 times life.
//   nave x -34..34, z 240..10 | crossing + transepts x -62..62, z 10..-72 | choir x -34..34, z -72..-246.
// OUTLINE OF THIS FILE
//   1 constants and the route          2 GLSL: the candle-lit hall material, the night, halos, smoke
//   3 small geometry helpers           4 buildShell (floor, walls, piers, crossing arches, windows, roof, doorway, terrace)
//   5 buildTables / buildPyramid / buildDais / buildCanopy / buildDoorway / buildDressers (linen, chairs, sticks, garlands)
//   6 placeGlasses (four weights and the one, dealt once by plan distance from the flown line) and flames
//   7 round tables, chandeliers, corona, dust, smoke     8 build(): looks, hero, post, update
// LIGHT  candlelight, and the night's cold light through three great windows. Every surface works its light out from where
//   the candles stand (five table lines, the chandelier rows, the pyramid, the round tables, the choir's side tables, the
//   dais ranks, the sconces, the candle trees, the orange trees' lanterns, the cups along the carpet, the massed candles
//   on the dais steps, the sconces and the ring of cups of the north wall) by arithmetic on the place. THE LINEN takes
//   little of the hall's general light (uBase) and a sharp pool under each flame (uPool): the tops ivory, nearly white under
//   a flame; the hanging cloth cooler and darker, in real pleats, so the tables read as lit roads with rhythm. The long
//   tables and the ranks are laid in ivory damask with an embroidered runner, gilt plates and a feast down the middle;
//   the ranks' hanging cloth is a crimson and old-gold brocade of pomegranates and roses under a short white lace-edged linen
//   cloth, and their tops stay a warm ivory in every look (the look's cool light catches only their rim); every hanging
//   cloth is shaded as smooth round pleats. STONE AND OAK:
//   quiet ashlar over an oak wainscot of raised panels, a carved vine frieze and fluted pilasters, its relief shaded from
//   where the candles stand (cut deeper in the nave and the transepts; the nave's stone over it is painted with a diaper in
//   dull red and gold that fades into the cornice, the transepts' is left warm and plain, and verdures hang in every bay of
//   the nave and on the transepts' walls between and beside their windows); each wall takes a warm
//   pool round every sconce, tree and dresser that
//   falls off upward to deep umber at the wall head (a floor of warm underlight, never black). THE ROOF is painted and
//   gilt (boarded panels of deep blue-green with gilt stars and rosettes between ribs of dull gold and red, moulded
//   trusses with gilt bosses, a carved gilt cornice at the wall head) and takes its own light (roofLight): a warm pool
//   above every row of chandeliers and above the corona, a deep blue-green between, the timbers' gilt undersides
//   catching it. In THE CROSSING the pyramid, corona and ring of trees act as one great soft lamp (uCross) that picks
//   out the four crossing arches, the transept walls with their dressers and the ceiling, which is painted as the roof
//   is, its gilt beams and four diagonal ribs meeting in one great gilt boss; the wall over each crossing arch is a
//   painted field of the same blue-green and gilt stars with two gilt roundels in wreaths of bay and fruit. THE PYRAMID is a tiered
//   buffet of dark walnut and gilt, hung with garlands; its risers are plates of old mirror, painted by the law of a
//   mirror, that give back the candles and the wine of the tier before them. THE TRANSEPTS take the
//   night in: each end wall is one great window with the night luminous behind it, and from it a cold
//   blue-silver light lies along the floor toward the pyramid with the mullions' shadows in it (faint at midnight, plain
//   before dawn in the east and under the moon in the west) and lays a cool edge on whatever faces the glass; ten round
//   tables a side stand close together in it as one company, warm islands, orange trees in the outer bays. THE MARBLE: every floor
//   north of z 10 (the crossing, the transepts, the choir) is a polished chequer of cream and green-black marble on the
//   diagonal, bordered in dull red, with a great star of sixteen points inlaid under the pyramid's foot and 8 m beyond
//   it; it carries each
//   flame as a long soft streak toward the eye's side and a row of flames as one road of light (rowStreak). THE CHOIR has
//   its own light, the hall's second colour (uChoir): north of the crossing's north arch (from z -72, whole by z -92)
//   the night's cool light from its windows lies on the marble, the walls, the roof, the trees and the hangings
//   (silver under the moon, deep blue at midnight, pale blue at the blue hour), the candles' far wash is held back
//   and their pools stand in it as warm islands; under the canopy only a quarter of it, so that the dais is the warm
//   heart. A long table
//   runs down each wall from the crossing to the north door, laid as the nave's are; an avenue flanks the carpet from the
//   pyramid to the dais steps and before the north door: two rows a side of orange trees in panelled tubs, each head a
//   mass of leaves with oranges and blossom and a ring of lanterns hung inside it (9 and 16 m from the axis, every 9 m), candle trees on garlanded feet between the rows (12.5 m out), and
//   a low candle in a glass cup every 1.5 m along the carpet; a company of the same round tables stands on the free
//   floor either side of the carpet and under the flown line where the avenue leaves its gap; dressers of plate and
//   glasses with sconces stand in seven bays a side and a verdure hangs in every bay, lit from the sconces below; the carpet is a dusky crimson, lit only near
//   candles, wine-brown between. The dais (ranks from z -128 to -171 laid for the feast, four candle trees on its corners,
//   steps all round with clusters of pillar candles on gilt trays on every tread and urns of white flowers, one great
//   carpet, a gilt balustrade hung with a garland) stands under a crimson canopy lined with a painted night sky (deep blue,
//   gilt stars, eight gilt ribs from a gilt boss, a border of gilt leaves), lit from below by its own candles.
//   THE DARK END, the west side of the choir from z -172 to the door wall's own lights (z -236): the west side table
//   carries no lit candle north of z -172, the two bays abreast of the great glass no sconce (on either wall) and the
//   darkest verdure, the west wall's dressers at z -208 and -224 no lit sconce, the dais's north-west quarter no candle
//   (low bowls of dark leaves and white flowers stand there; the candle tree on that corner stands unlit), and the
//   west candle trees and orange trees before the north door stand unlit: the six candle stands of the great glass are
//   the only flames there, so that the brim stands against dark as seen from the line's east pass. THE WAY OUT: curtains, a pelmet, a wheel window and walls shelved
//   with plate and glasses round the north doorway; under the shelves tall arched niches lined in deep blue with gilt
//   stars between gilt pilasters with a sconce of three candles on each, a tiered gilt stand of ten half-full glasses
//   or a gilt urn of flowers in each by turns, candles on every sill; two ranks of small candles in glass cups round
//   the arch inside a thick garland that runs over it and down its jambs, an urn either side; in the arch's throat A
//   PORCH of three receding gilt arches with small lamps, and at its back, 3.6 m behind the wall's face, the portal: a
//   clear pale blue (#8fc4ff, glow 1.4, radius 5.5), the hall's one cold light on its axis. PETALS of white and shell
//   pink roses, pale and a little translucent, fall slowly through the whole hall (900 of them), thickest over the
//   crossing and the dais, and a few lie on the carpets, the dais steps and the cloths.
// DEPARTURES FROM THE BRIEF  The route does not open level down the middle table: it opens LOW on the diagonal, at
//   y 8.3 by the west wall of the nave's south end (4.8 m from it), under the chandeliers' hoops, heading 47 to 57
//   degrees east of north for its first 20 m, and swings north to the centre table by 88 m (five opening points of
//   our own; from there to z -112 the route is the brief's). THE ONE GLASS is not a glass of the hall's size on a
//   stand beside the line: it is THE GREAT GLASS, 7.04 m tall, on the axis at z -179 on a plinth of three steps, with a
//   great decanter hung over it from a gilt crane on its west side; the line flies up the axis at it and passes it
//   on the east (abreast at 408.2 m, x 4.6, y 11.8, 0.86 m above its rim), and the route is 479.6 m long, ending 3.6 m
//   inside the north arch's throat at the back of a porch. The level begins to rise at 300 m, not 330. There are no
//   moths. The transepts' end walls are great windows, not dressers (their dressers stand either side of each window and
//   on the side walls by the crossing), and twenty round tables stand in the transepts, orange trees in their outer
//   bays; eight more of the same tables stand on the choir's floor. Rose petals fall through the hall. Four stone arches close the crossing. The
//   choir is furnished to the door: a long table down each wall where candle trees stood, the dais on steps all round
//   with a balustrade and a canopy, its middle chandelier hung from the canopy, and the north wall dressed and shelved.
//   The flight takes 50 s, not 47. The moon stands low in the west, not the north-west. The portal is a clear pale blue
//   (#8fc4ff, glow 1.4), 5.5 m in radius.
//   THE BREATH is not one wave that crosses in two seconds: its front comes down the hall between 150 and 214 m flown
//   and the flames it has passed stay laid over until its strength is taken off between 204 and 214 m (about 5.6 s at
//   the nave's pace); its dust streaks are shown only from 164 to 200 m. MIRRORS (the brief says the hall has none):
//   the pyramid's risers are plates of old mirror and four sconces with mirror backs hang in the transepts' outer
//   bays; nothing else mirrors. The chandeliers are drawn in three weights dealt by place. Exposure is 1.08 (1.1
//   under the moon), not 1.05. Where the dealt garland is none only the long tables and the choir's side tables go
//   without: the wreaths, swags and garlands elsewhere are then of bay. The side windows are glazed in diamond panes. The great glass's
//   set piece (glass, wine, decanter, thread, plinth, stands, crane) is about 26,000 triangles, not 5,000.
//   A far glass is 32 triangles (the brief: at most 24; near 160, middle 70, a speck 18). The dome stands 0.25 m over the
//   great glass's rim (the brief: 0.06 m over a glass of the hall's size, which at eight times the size would be 0.48 m). The gaze's pulls are of weight
//   0.6 and 0.6, from 140 to 372 m and from 330 m (the brief: 0.45 from 150 to 300 m, 0.5 from 372 to 414 m). The
//   closest pass of the great glass is 3.4 m of clear air at 409 m (the brief: 2.7 m at 410 m). The dressers' gilt and
//   silver plate is painted at 2.4 to 3 times the gilt's and silver's own colour, above the brief's albedo of 0.8.
//   THE PYRAMID carries 820 glasses shoulder to shoulder (0.81 to 0.91 m apart, not 1.3 m), its candles in silver sticks of
//   two heights, and on its top tier a silver epergne of seven candles, not one tall candle; it is a buffet of walnut,
//   gilt and old mirror hung with garlands, not a cone of linen. The chairs have high
//   upholstered backs with a crest (4 m to the finials), not plain ones, in three upholsteries dealt by table; about one
//   in seven stands drawn back and turned, and a napkin or a wreath lies on some seats. The long tables carry a feast
//   down their middles, gilt plates, and an embroidered runner on every visit (old gold where the dealt runner is
//   none). The chandeliers are all gilt, each candle over a
//   drip pan, on a chain; there are 28 of them, not 25. THE COUNTS: the dais ranks carry 104 glasses, not 80; 44
//   dressers stand along the walls, each with glasses on two of its five shelves (20 a dresser; the west transept's
//   four, 58 m and more from the line, on one shelf: 840 in all, about 1,200 in the brief) and gilt and silver plate
//   on the other three; four niches of the north wall hold ten glasses each on a tiered stand; the shelved north wall
//   keeps 80 glasses on two of its shelves and carries plate on the rest; every round table (twenty in the transepts,
//   eight in the choir) has eight places and eight glasses. 5,108 glasses in all, and the one. The glasses are drawn in
//   four weights dealt at 2, 5.4 and 17 m from the flown line in plan (and the one), not three. The brim is flown at about
//   4 m/s, not 6. The look is dealt from the world's random stream unless the visit's hour names one. There is no light
//   object in the scene: every surface works its light out by place. The page draws up to about 495,500 triangles (its
//   heaviest visits, the fullest air with garlands, draw about 494,400; the rare breath's streaks add 1,120;
//   the brief asks 420,000). The side windows stand in frames 1 m deep with mullions, a transom and a sill; the walls below
//   them are wainscot, frieze and pilasters; the transepts' outer bays carry a verdure and a mirror sconce.
//   THE ROOF is painted and gilt, not bare oak. The floors of the crossing, the transepts and the choir are marble,
//   not oak, with a great star inlaid under the pyramid. The nave's walls are painted with a diaper
//   over the wainscot, verdures hang in every bay of the nave and on the transepts' walls, and their dressers carry gilt
//   and silver plate under a gilt shell. The crossing's ceiling and the walls over its four arches are painted and gilt.
//   The north wall carries arched niches of blue and gilt stars between gilt pilasters with sconces, two ranks of candle
//   cups ring its arch and a porch of three gilt arches stands in its throat. The avenue is of orange trees with lanterns as well as candle trees, and the candle trees stand 12.5 m from
//   the axis, every 9 m. Low candles in cups line the carpet: at its edges (3.1 m out) before the dais; 5.2 m out before
//   the north door, where the line flies the axis and nothing of the avenue stands within 5 m of it in plan. The dais
//   steps carry clusters of pillar candles on gilt trays on every tread (glass cups and gilt prickets under them; bowls
//   of flowers and no candle on the north-west quarter), carved gilt risers and urns of flowers; the dais
//   floor one great carpet; the ranks a feast down their middles, ivory damask tops with a runner on every visit over a
//   hanging cloth of crimson and gold brocade with a short lace-edged linen cloth above it; the balustrade and the canopy's four gathered corner curtains (it has no posts) a thick garland. A
//   verdure hangs in every bay of the choir's walls from a gilt rod under the roof trusses' corbels (y 21.95: each truss's
//   wall shaft and brace stand at a bay's middle, so nothing hangs from the cornice): to the wainscot's rail in the four
//   bays beside the dais, to the dresser's head elsewhere. The chandelier before the north door hangs 3.5 m higher than
//   the choir's first (its hoop at y 20.5).
// THE FILL of the great glass is a pure law of the metres flown: metres = u * path.length, handed to the hero's
//   setMetres (parts/to-the-brim.js, fillLaw): half until 300 m (the thread's head leaves the decanter's lip at 291 m
//   and lands at 300), to the rim at 396 m, the dome by 406 m (its last drop lands at 406), then it stands. Through the previous portal u is 0, so it stands at half. THE HALF of every other glass is the
//   part's constant HALF: never dealt, never varied; the count of glasses (5,108 and the one) is the same on every
//   seed, look and setting.
// GAZE  two pois, refining only; the opening has none: the eye looks where it flies, over the tables, under the rings of
//   candles, to the far wall's windows and hangings. The first (0.6, 140 to 372 m) slides its aim: the pyramid's waist
//   from the slant to the pass, then (262 to 318 m) over to the great glass's bowl. The second (0.6, from 330 m) aims
//   at the middle of the great glass's rim: the line itself flies at the glass until 25 m before it, then passes it
//   on the east; abreast is 408.2 m. The aim stays on the rim and the pull itself is let go: whole until 404 m,
//   nothing by 422 m, so that the glass leaves by the left edge and the gaze is on the doorway again within 12 m
//   after we are abreast. As flown the shown gaze turns under 35 degrees a second with either camera (the usual one
//   29 at most, between 400 and 420 m, and 20 at most over the opening; the steady one 6 at most).
// PACE  the flight takes 50 s (lengthened so that the brim can be passed slowly without hurrying the nave). The
//   route's slowest stretch is the brim: about 4.1 m/s from 400 to 416 m as flown (4.5 at 394 m).
// LOOKS (dealt from the seed's random stream by a fork named 'look')  midnight (deep blue panes, stars) | blue hour (the east windows and the doorway luminous, the east
//   great window brightest and paler low down, a cold edge on the east side of linen and bowls, candles burned to stubs)
//   | full moon (the moon low in the west, in the head of the west great window as seen from the pass; long silver bars
//   across linen and floor; every second low candle of the nave unlit). ctx.vary.hour: 'dawn' gives the blue hour,
//   'night' never does. Seeded swaps: wine, runner, garlands.
// RARE (ctx.vary.rare)  THE BREATH, keyed to metres: its front leaves the north doorway at 150 m, is at the pyramid
//   by 156 m, comes down the tables from 161 m, passes the eye at 164 m and is gone by 214 m. Flames
//   gutter at the front and behind it lie over on ONE bearing (south, 18 degrees east of it), drawn out long, their
//   halos and pools with them, recovering slowly; smoke bends flat on the same bearing; fine dust is drawn into short
//   pale streaks that lie and drift on it, lit only by the candles they pass and kept clear of the whole flown line by
//   place; the rings on every wine surface surge. Nothing goes dark.
// HALOS  every flame carries its glare, as the eye has it: never drawn under 2.4 pixels across, and dimmed by the square of
//   how much it was widened, so that it gives the light it had.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeGlassKit, GLSL_GUST } from '../parts/to-the-brim.js';

const PI = Math.PI, TAU = PI * 2;
const PALETTE = ['#F3E3BF', '#7A0F1E', '#E8A23A', '#1A120C', '#3A2416', '#C9A24A', '#16233F'];
// THE ROUTE (479.6 m). It opens LOW ON THE DIAGONAL, under the chandeliers: at y 8.3 by the west wall of the nave's
// south end (4.8 m from the wall), heading 47 to 57 degrees east of north for its first 20 m, across the western
// tables under the hoops (never above y 8.63: 5.4 m and more under every hoop's foot at y 14.05); it swings to the
// north and is over the centre table, on the old line, at 88 m, 88.08 m from its start as the old opening was. From
// [5.5, 7.9, -112] it comes to the axis between the ranks, flies at THE GREAT GLASS (x 0, z -179) rising, swings out
// over the east rank from 25 m before the glass and passes the glass on the east: abreast (408.2 m) at x 4.6, y 11.8,
// 0.86 m above the rim; then back to the axis, down to y 7.2 (never steeper than 13.1 degrees), through the porch and
// into the portal at z -249.6. (Every measure to a chandelier is taken with nothing off for its sway of 0.25 m.)
const ROUTE = [[-29.2, 8.3, 207.548], [-12.93, 8.6, 195.96], [-3.88, 8.6, 185.33], [-0.22, 8.35, 171.86], [-1.32, 7.43, 147.6], [0, 7.4, 132], [10, 9.4, 90], [20, 11.6, 44], [26, 13, 4], [27.5, 13.4, -30],
  [24, 12.2, -62], [15, 9.8, -90], [5.5, 7.9, -112],
  [0.3, 7.35, -127], [-1.0, 7.6, -138], [-0.9, 8.3, -147], [0.6, 9.4, -154.5], [2.9, 10.5, -161], [5.0, 11.1, -167], [5.9, 11.5, -173], [4.6, 11.8, -179], [3.3, 11.4, -185],
  [1.8, 10.3, -192], [0.6, 8.75, -199], [0.05, 7.6, -206], [0, 7.2, -218], [0, 7.2, -231], [0, 7.2, -240], [0, 7.2, -249.6]];
const TABLE_X = [-22, -11, 0, 11, 22], CAND_Z0 = 21.6, GLASS_Z0 = 20.8, LAT = 3.2;
const CH_Z = [196, 164, 132, 100, 68];
const PYR = { x: 0, z: -30, tiers: 10 };
const tierTop = (k) => 3.0 + 1.8 * k, tierR = (k) => 20 - 1.9 * k;
const tierPlaces = (k) => 5 * Math.max(2, Math.round(TAU * (tierR(k) - 0.5) / 6.5));
const WIN_NAVE = (k) => 32 + 16 * k, WIN_CHOIR = (k) => -88 - 16 * k;      // 13 and 10 windows a side
// material kinds carried in surf.x (surf.yzw: parameters of the kind)
const K_STONE = 0, K_WOOD = 1, K_FLOOR = 2, K_LINEN = 3, K_TIER = 4, K_METAL = 5, K_PLAIN = 6, K_PANE = 7;
const S = (k, a = 0, b = 0, c = 0) => [k, a, b, c];

// ---------------------------------------------------------------- 2. GLSL
const G_COMMON = /* glsl */`
float h11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x), f.y), f.z); }
float breath(vec3 fp, float t){ float k = h31(floor(fp*7.0)+3.0);
  return 1.0 + 0.045*sin(t*(3.1+3.0*k)+k*40.0) + 0.025*sin(t*(5.3+2.6*k)+k*17.0); }
`;
// THE BREATH'S ONE BEARING: everything the breath lays over (flames, their halos and pools, smoke, the dust streaks) leans
// and drifts toward the south, 18 degrees east of it: GB = (east, south) = (sin 18, cos 18). The part file's flames carry the same.
const G_BEAR = /* glsl */`
const vec2 GB = vec2(0.309, 0.951);
`;
// the night outside: one law for the dome and for every window pane
const G_SKY = /* glsl */`
uniform vec3 uMoonDir; uniform float uMoonI, uDawn, uSkyGain;
vec3 nightSkyH(vec3 d, float t, float hk){                                   // (hk: how much of the moon's wide halo is shown; the disc is always whole)
  float up = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(vec3(0.030,0.052,0.125), vec3(0.006,0.011,0.034), smoothstep(-0.05,0.7,up));
  col += uDawn*vec3(0.05,0.16,0.52)*(0.25+0.75*smoothstep(-0.5,0.9,d.x))*exp(-max(up,0.0)*1.3);
  col += uDawn*vec3(0.30,0.20,0.16)*smoothstep(0.2,1.0,d.x)*exp(-max(up,0.0)*9.0);
  vec3 q = d*70.0; vec3 g = floor(q), f = fract(q)-0.5; float h = h31(g);
  float star = step(0.90,h)*(1.0-smoothstep(0.0,0.30,length(f)))*(0.6+0.4*sin(t*(1.0+3.0*h)+h*90.0));
  vec2 cp = d.xz/(abs(d.y)+0.35); float cl = vnoise(vec3(cp*1.6+vec2(t*0.012,0.0), 3.0))*0.6+vnoise(vec3(cp*4.1+vec2(t*0.02,1.7), 7.0))*0.4;
  float band = smoothstep(0.52,0.78,cl)*smoothstep(0.02,0.2,up)*(1.0-smoothstep(0.45,0.8,up));
  float md = max(dot(d,uMoonDir),0.0); float m2 = md*md; float m8 = m2*m2*m2*m2;
  float disc = smoothstep(0.99905,0.99940,md);
  col += (1.0-band)*(1.0-uDawn*0.7)*star*vec3(1.5,1.6,2.0)*(0.7+h*1.3);
  col = mix(col, vec3(0.085,0.105,0.17)+uMoonI*vec3(0.10,0.12,0.16)*m8+uDawn*vec3(0.06,0.10,0.22), band*0.75);
  col += uMoonI*((vec3(0.16,0.19,0.26)*m8*m8*m8 + vec3(0.07,0.09,0.15)*m2)*hk + disc*vec3(2.3,2.2,1.9)*(1.0-band*0.5)*(0.82+0.18*vnoise(d*38.0)));
  return col*uSkyGain;
}
vec3 nightSky(vec3 d, float t){ return nightSkyH(d, t, 1.0); }`;
const HALL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 color; attribute vec4 surf;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec4 vS;
void main(){
  vec3 p = position; vec3 n = normal;
  #ifdef USE_INSTANCING
    p = (instanceMatrix*vec4(p,1.0)).xyz; n = mat3(instanceMatrix)*n;
  #endif
  vec4 wp = modelMatrix*vec4(p,1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*n + vec3(0.0,1e-6,0.0)); vC = color; vS = surf;
  #ifdef USE_INSTANCING_COLOR
    if (surf.x > 5.5) vC *= instanceColor;                                  // (an instance's colour dyes its cloth, wax and leaf; its metal and wood keep their own)
  #endif
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const HALL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime, uLat, uTabI, uChI, uPyI, uTrI, uStub, uGain, uPool, uBase, uIsle, uPaneGain, uGustAmp, uGustTail, uBlueE, uWall, uCross, uTierFill, uSheen, uPairE, uRivE, uPix, uGwPaneW;
uniform vec3 uFlameCol, uAmb, uFill, uFillDir, uTierDir, uMoonCol, uRunCol, uChSway, uChSway2, uGwE, uGwW, uWineC, uChoir, uGwGlassW; uniform vec4 uGapE;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec4 vS;
// the sway of the chandelier that hangs at z (the rows hang in two sets that sway apart: the nave's rows of z 196, 132
// and 68 and the choir's first and last in one, the rows of z 164 and 100 and the choir's middle one in the other)
vec3 chSw(float z){ bool two = z > 0.0 ? mod(floor((196.0-z)/32.0+0.5), 2.0) > 0.5 : abs(z+155.0) < 1.0; return two ? uChSway2 : uChSway; }
` + G_COMMON + G_BEAR + GLSL_GUST + G_SKY + /* glsl */`
float wrapL(vec3 N, vec3 L, float d){ return max(dot(N,L)/max(d,1e-3)*0.78+0.22, 0.0); }
// the transepts' round tables stand as one company either side, in three lines along z 8.1 m apart (x 38.4 and 54.6: three
// each, z -21.6, -31, -40.4; x 46.5: four, z -16.9 to -45.1), 9.4 m apart in a line: the table nearest p (x, z)
vec2 roundAt(vec2 p){ float c = clamp(floor((abs(p.x)-38.4)/8.1+0.5), 0.0, 2.0), mid = 1.0-abs(c-1.0), z0 = mix(-21.6, -16.9, mid);
  return vec2((p.x > 0.0 ? 1.0 : -1.0)*(38.4+8.1*c), z0-9.4*clamp(floor((z0-p.y)/9.4+0.5), 0.0, 2.0+mid)); }
void pointL(vec3 P, vec3 N, vec3 q, float I, float k, inout float E, inout vec3 Ld){
  vec3 L = q-P; float d2 = dot(L,L); float d = sqrt(max(d2,1e-4));
  float e = I*wrapL(N,L,d)/(1.0+d2*k); E += e; Ld += L/d*e; }
void lineZ(vec3 P, vec3 N, vec3 q0, float z1, float I, float k, inout float E, inout vec3 Ld){
  vec3 q = vec3(q0.x, q0.y, clamp(P.z, q0.z, z1)); vec3 L = q-P; float d = sqrt(max(dot(L,L),1e-4));
  float e = I*wrapL(N,L,d)/(1.0+d*k); E += e; Ld += L/d*e; }
// every candle the hall holds, found by arithmetic on the place. The nave's and the pyramid's candles (En) do not
// reach round the crossing into the choir: there the dais is the one lit island, the avenue's trees make pools along
// the carpet, the two side tables run as lit roads down the walls (the west one unlit north of z -172: the dark end).
void hallLight(vec3 P, vec3 N, float kind, out float E, out vec3 Ld){
  E = 0.0; Ld = vec3(0.0,1e-4,0.0);
  float En = 0.0; vec3 Ln = vec3(0.0);
  float fy = 4.3-uStub; float isLinen = step(2.5,kind)*step(kind,3.5);
  for (int i = 0; i < 5; i++) {
    float x = float(i-2)*11.0; float dx = abs(P.x-x);
    float hgt = P.y + (fy-P.y)*clamp((dx-2.4)/max(dx,1e-3), 0.0, 1.0);      // the table hides its own candles from below
    float vis = P.y > 2.95 ? 1.0 : smoothstep(2.7,3.5,hgt);
    float own = 1.0-isLinen*step(dx,2.6)*step(2.9,P.y);
    lineZ(P,N, vec3(x,fy,20.0), 200.0, uTabI*vis*own, 0.55, En, Ln);
    lineZ(P,N, vec3(x,15.2,60.0), 204.0, uChI*0.6, 0.16, En, Ln);
  }
  float cx = clamp(floor(P.x/11.0+0.5), -2.0, 2.0)*11.0, cz = 68.0+32.0*clamp(floor((P.z-68.0)/32.0+0.5), 0.0, 4.0);
  pointL(P,N, vec3(cx,14.8,cz)+chSw(cz), uChI*4.4, 0.022, En, Ln);          // the nearest chandelier: its pool sways with it
  if (kind < 3.5 || kind > 4.5) {                                          // THE CROSSING: the pyramid's three hundred flames, the corona and
    vec3 q = vec3(0.0, clamp(P.y,6.0,30.0), -30.0); vec3 L = q-P;         // the ring of trees are together one great soft lamp, which picks the
    float d2 = dot(L,L); float d = sqrt(max(d2,1e-4));                    // transept walls, the piers and the beamed ceiling out of the dark
    float e = uPyI*uCross*wrapL(N,L,d)/(1.0+d2*0.00042); En += e; Ln += L/d*e; }
  if (kind < 1.5) {                                                       // the five linen roads glow upward on the nave's walls and roof
    float e = uTabI*0.26*(0.62-0.38*N.y)*smoothstep(-6.0,34.0,P.z)*(1.0-0.5*smoothstep(204.0,236.0,P.z))/(1.0+max(P.y-4.0,0.0)*0.016);
    En += e; Ln += vec3(-P.x*0.03,-1.0,0.0)*e; }
  pointL(P,N, vec3(0.0,34.0,-30.0), uPyI*4.5, 0.008, En, Ln);              // the corona
  float sx = P.x > 0.0 ? 32.3 : -32.3;
  pointL(P,N, vec3(sx,10.5, clamp(24.0+16.0*floor((P.z-24.0)/16.0+0.5), 24.0, 216.0)), 1.9, 0.05, En, Ln);
  { vec2 r = P.xz-vec2(0.0,-30.0); float ta = (floor(atan(r.y, r.x+1e-5)/0.5235988)+0.5)*0.5235988;   // the ring of twelve trees round the pyramid
    pointL(P,N, vec3(24.0*cos(ta),8.6,-30.0+24.0*sin(ta)), uTrI*2.6, 0.06, En, Ln);
    float rl = max(length(r),1e-3); vec3 q = vec3(r.x/rl*24.0, 8.6, -30.0+r.y/rl*24.0); vec3 L = q-P; float d = sqrt(max(dot(L,L),1e-4));
    float e = uTrI*1.0*wrapL(N,L,d)/(1.0+d*0.3); En += e; Ln += L/d*e; }
  pointL(P,N, vec3(P.x > 0.0 ? 60.3 : -60.3, 10.5, P.z > -31.0 ? -5.0 : -57.0), 2.6, 0.03, En, Ln);          // the sconces of the transepts' dressers: by each great window,
  pointL(P,N, vec3(P.x > 0.0 ? 41.0 : -41.0, 10.5, P.z > -31.0 ? 8.3 : -70.3), 2.2, 0.04, En, Ln);          // and on the side walls by the crossing
  pointL(P,N, vec3(P.x > 0.0 ? 56.0 : -56.0, 10.8, P.z > -31.0 ? 8.7 : -70.7), 2.2*step(36.0,abs(P.x)), 0.07, En, Ln);   // the mirror sconces under the verdures of the transepts' outer bays
  { float ax = abs(P.x), sx = P.x > 0.0 ? 1.0 : -1.0;                       // the transepts' round tables: the candelabrum of the nearest and of the nearest in the next line
    vec2 r1 = roundAt(P.xz), r2 = roundAt(vec2(P.x+(ax > abs(r1.x) ? 8.1 : -8.1)*sx, P.z));
    pointL(P,N, vec3(r1.x, 7.7, r1.y), uTrI*2.0*step(30.0,ax), 0.07, En, Ln);
    pointL(P,N, vec3(r2.x, 7.7, r2.y), uTrI*2.0*step(30.0,ax)*step(0.5,abs(r2.x-r1.x)), 0.07, En, Ln); }
  float nave = mix(0.08, 1.0, smoothstep(-106.0,-60.0,P.z));
  E += En*nave; Ld += Ln*nave;
  // THE CHOIR: three chandeliers that light little but themselves, the dais ranks, the side tables along the walls
  { float kc = clamp(floor((-92.0-P.z)/63.0+0.5),0.0,2.0);                    // (the one before the north door hangs 3.5 m higher)
    pointL(P,N, vec3(0.0, kc > 1.5 ? 21.3 : 17.8, -92.0-63.0*kc)+chSw(-92.0-63.0*kc), uChI*2.6, 0.03, E, Ld); }
  for (int i = 0; i < 2; i++) {
    float x = float(i)*10.0-5.0; float dx = abs(P.x-x);
    float own = 1.0-isLinen*step(dx,1.7)*step(5.9,P.y);
    float vis = P.y > 5.95 ? 1.0 : smoothstep(1.5,3.4,dx);
    lineZ(P,N, vec3(x,7.3-uStub,-168.4), -130.0, uTabI*uIsle*own*vis, 0.42, E, Ld); }
  pointL(P,N, vec3(-2.9,7.6,-178.4), 4.2, 0.05, E, Ld);                    // the six candle stands of the great glass (on the west half of its plinth), felt from their middle
  { float tx = P.x > 0.0 ? 17.2 : -17.2;                      // the four trees on the dais's corners
    pointL(P,N, vec3(tx,11.6, P.z > -158.0 ? -126.0 : -190.0), uTrI*3.0*(P.x < 0.0 && P.z <= -158.0 ? 0.0 : 1.0), 0.07, E, Ld); }   // (the north-west one stands unlit: THE DARK END)
  // THE CHOIR'S SIDE TABLES (x 26.5 and -26.5, a low candle every 3.2 m from z -81.6 to -228.8): two more lit roads past the
  // dais to the north door. THE DARK END (the west side north of z -172): the west one carries no lit candle from z -172
  // to its north end, so that the great glass's brim stands against dark as seen from the line's east pass
  { float tx = P.x > 0.0 ? 26.5 : -26.5; float dx = abs(P.x-tx); float fyc = 4.3-uStub;
    float hgt = P.y + (fyc-P.y)*clamp((dx-2.4)/max(dx,1e-3), 0.0, 1.0);
    float vis = P.y > 2.95 ? 1.0 : smoothstep(2.7,3.5,hgt);
    float own = 1.0-isLinen*step(dx,2.6)*step(2.9,P.y);
    float I = uTabI*vis*own*0.8;
    if (P.x > 0.0) lineZ(P,N, vec3(tx,fyc,-228.8), -81.6, I, 0.55, E, Ld);
    else lineZ(P,N, vec3(tx,fyc,-171.2), -81.6, I, 0.55, E, Ld); }
  // THE AVENUE. Its candle trees (x 12.5 and -12.5): every 9 m from z -62.5 to z -107.5 before the dais steps (the east row
  // stops where the flown line crosses it: uPairE = its last station) and from z -210.5 to -228.5 before the north door
  // (the two trees of the row that a place stands between, so that the light's way does not jump abreast of a tree's neighbour)
  { float z0 = P.z > -160.0 ? -62.5 : -210.5, kn = P.z > -160.0 ? (P.x > 0.0 ? uPairE : 5.0) : 2.0, k0 = clamp(floor((z0-P.z)/9.0), 0.0, max(kn-1.0, 0.0));
    for (int i = 0; i < 2; i++) { float kk = k0+float(i);
      pointL(P,N, vec3(P.x > 0.0 ? 12.5 : -12.5, 9.4, z0-9.0*kk), uTrI*3.0*step(kk, kn+0.5)*(P.x < 0.0 && P.z <= -160.0 ? 0.0 : 1.0), 0.07, E, Ld); } }   // (the west row before the door: THE DARK END, unlit)
  // its orange trees' lanterns (rows at x 9 and 16 either side, a ring of five 8.6 m up): the nearest tree of the nearer row,
  // every 9 m from z -58 to -112 and from z -206 to -233 (the east rows have their gaps where the line crosses: uGapE; the
  // west rows before the north door are of THE DARK END: unlit)
  { float xr = abs(P.x) < 12.5 ? 9.0 : 16.0, kk = P.z > -160.0 ? clamp(floor((-58.0-P.z)/9.0+0.5), 0.0, 6.0) : clamp(floor((-206.0-P.z)/9.0+0.5), 0.0, 3.0);
    vec2 gp = xr < 12.0 ? uGapE.xy : uGapE.zw; float on = (P.x > 0.0 && P.z > -160.0 && kk >= gp.x && kk <= gp.y) || (P.x < 0.0 && P.z < -160.0) ? 0.0 : 1.0;
    pointL(P,N, vec3(P.x > 0.0 ? xr : -xr, 8.6, (P.z > -160.0 ? -58.0 : -206.0)-9.0*kk), 1.5*on, 0.09, E, Ld); }
  // THE RIVER OF LIGHT: low candles in cups along the carpet (x 3.1 and -3.1 from z -58 to -115, the east row to uRivE; 5.2 m
  // either side of the axis from z -201 to -237): two lit lines on the floor
  { float sx = P.x > 0.0 ? 1.0 : -1.0;
    if (P.z > -160.0) lineZ(P,N, vec3(sx*3.1,0.4, P.x > 0.0 ? uRivE : -115.0), -58.0, uTabI*0.8, 1.5, E, Ld);
    else lineZ(P,N, vec3(sx*5.2,0.4,-237.0), -201.0, uTabI*0.8, 1.5, E, Ld); }
  { vec2 c = vec2(P.x, P.z+158.0), hb = vec2(21.4, 40.0), qd = clamp(c, -hb, hb);      // the massed candles on the dais steps: a band of light all
    vec2 de = hb-abs(c);                                                               // round the dais (x 21.4 and -21.4, z -118 and -198, 3.2 m up),
    if (de.x > 0.0 && de.y > 0.0) { if (de.x < de.y) qd.x = c.x > 0.0 ? hb.x : -hb.x; else qd.y = c.y > 0.0 ? hb.y : -hb.y; }   // felt from its nearest place
    vec3 L = vec3(qd.x, 3.2, qd.y-158.0)-P; float d = sqrt(max(dot(L,L),1e-4));
    float dkE = qd.x < 0.0 && qd.y < -12.0 && (qd.x < -21.0 || qd.y < -39.5) ? 0.0 : 1.0;   // (THE DARK END: the north-west quarter carries no candle)
    float e = dkE*uTabI*1.5*wrapL(N,L,d)/(1.0+d*0.5); E += e; Ld += L/d*e; }
  // and each cluster's own pool, on its tread and on the riser behind it: the nearest cluster of this place's tread (tread
  // t, 0 to 2, lies at y t + 1; the riser from y t + 1 to t + 2 stands behind it) on the south or north flight (every 2.5 m
  // from 4.4 + 0.8 t m either side of the axis) and on the side flight (every 2.5 m from z -118.6 - t), felt 0.8 m up
  if (P.y > 0.6 && P.y < 4.4 && P.z < -114.0 && P.z > -202.0 && abs(P.x) < 24.0) {
    float ti = clamp(floor(P.y+0.02), 1.0, 3.0)-1.0, sx = P.x > 0.0 ? 1.0 : -1.0, x0 = 4.4+0.8*ti, z0 = -118.6-ti;
    float xj = x0+2.5*clamp(floor((abs(P.x)-x0)/2.5+0.5), 0.0, floor((20.7-0.7*ti-x0)/2.5+0.001)), zf = P.z > -158.0 ? -117.5-ti : -198.5+ti;
    float zj = z0-2.5*clamp(floor((z0-P.z)/2.5+0.5), 0.0, floor((z0+197.4-ti)/2.5+0.001));
    pointL(P,N, vec3(sx*xj, ti+1.8, zf), uTabI*(sx < 0.0 && zf < -170.0 ? 0.0 : 1.7), 1.5, E, Ld);
    pointL(P,N, vec3(sx*(21.75-0.7*ti), ti+1.8, zj), uTabI*(sx < 0.0 && zj < -170.0 ? 0.0 : 1.7), 1.5, E, Ld); }
  float wz = clamp(-96.0-16.0*floor((-96.0-P.z)/16.0+0.5), -240.0, -80.0);                  // the sconces of every bay (dressers and verdures)
  pointL(P,N, vec3(P.x > 0.0 ? 32.7 : -32.7, 10.8, wz), (wz < -168.0 && (wz > -200.0 || (P.x < 0.0 && wz > -232.0))) ? 0.0 : 2.4, 0.09, E, Ld);   // (none abreast of the great glass, z -176 and -192; none on the west wall at z -208 and -224: THE DARK END)
  pointL(P,N, vec3(P.x > 0.0 ? 12.5 : -12.5, 8.6, -238.0), uTrI*3.2, 0.08, E, Ld);           // the two trees at the doorway
  pointL(P,N, vec3((P.x > 0.0 ? 1.0 : -1.0)*(14.5+8.25*clamp(floor((abs(P.x)-14.5)/8.25+0.5),0.0,2.0)), 16.6, -243.8), 2.4*step(P.z,-200.0), 0.1, E, Ld);   // the sconces of the shelved north wall
  pointL(P,N, vec3((P.x > 0.0 ? 1.0 : -1.0)*(14.5+8.25*clamp(floor((abs(P.x)-14.5)/8.25+0.5),0.0,2.0)), 8.1, -244.4), 3.0*step(P.z,-200.0), 0.12, E, Ld);    // and the three-candle sconces of the gilt pilasters under them
  if (P.z < -222.0) {                                                           // the ring of cups round the north arch (up both jambs at x 9.4 and -9.4, round the head 9.4 m from (0, 11)): felt from its nearest place
    vec2 a2 = vec2(P.x, max(P.y-11.0, 0.0)); float al = max(length(a2),1e-3);
    vec3 q = P.y > 11.0 ? vec3(a2.x/al*9.4, 11.0+a2.y/al*9.4, -244.6) : vec3(P.x > 0.0 ? 9.4 : -9.4, max(P.y,1.2), -244.6);
    pointL(P,N, q, uTabI*2.0, 0.45, E, Ld); }
  E *= 1.0 + 0.065*sin(uTime*2.3+P.z*0.21+P.x*0.13) + 0.045*sin(uTime*3.7-P.z*0.33+P.y*0.4);  // the flames breathe together in slow waves
}
// 1 between a and b, 0 outside, its edges fa wide
float bnd(float a, float b, float x, float fa){ return smoothstep(a-fa,a+fa,x)*(1.0-smoothstep(b-fa,b+fa,x)); }
// A ROW OF FLAMES in the polished floor: flames every lat metres along z at x0 (the lattice through z0, lit from za to zb),
// each a streak wl wide and wa long toward the eye (vd: the eye's bearing in plan; h: where the mirrored ray meets the flames'
// height). The whole row is summed, not its nearest few: where the streaks overlap they run into one unbroken road of
// light (the lattice's sum taken as its mean and first harmonic), where they stand apart each is its own (the nearest
// three); a lone streak's peak is 1 and a full road's level is 1
float rowStreak(vec2 h, float x0, float z0, float lat, float za, float zb, vec2 vd, float wl, float wa){
  float dx = h.x-x0, iw = 1.0/(wl*wl), ia = 1.0/(wa*wa);
  float A = vd.x*vd.x*iw + vd.y*vd.y*ia, B = dx*vd.x*vd.y*(ia-iw);
  float zc = h.y + B/A;                                                       // the place on the row whose streak passes through here
  float core = exp(-dx*dx*iw*ia/A), dens = sqrt(3.14159/A)/lat, g = exp(-9.8696/(A*lat*lat));
  float k0 = floor((zc-z0)/lat+0.5), nr = 0.0;
  for (int j = -1; j <= 1; j++) { float t = zc-(z0+lat*(k0+float(j))); nr += exp(-A*t*t); }
  float s = mix(dens*(1.0+2.0*g*cos(6.2831853*(zc-z0)/lat)), nr, smoothstep(0.3,0.45,g));
  return s*core/sqrt(1.0+dens*dens)*smoothstep(za-0.5*lat, za, zc)*(1.0-smoothstep(zb, zb+0.5*lat, zc)); }
// the rare breath: its front travels south (gustD, the part file's: the front's measure as a flame at z feels it, the same
// metres flown to come and to go wherever the front is). Where it passes, flames gutter low in a band and lean on the
// breath's one bearing behind it, recovering over uGustTail of that measure; their pools slide and dip with them
float gustLean(float z){ float dz = gustD(z); return uGustAmp*(dz > 0.0 ? exp(-dz*dz/60.0) : exp(dz/max(uGustTail,1.0))); }
float gustGut(float z){ float dz = gustD(z)+7.0; return uGustAmp*exp(-dz*dz/260.0); }
float flameE(vec3 P, vec3 N, vec3 fp, inout vec3 Ld){
  float gu = min(gustLean(fp.z),1.2), gt = min(gustGut(fp.z),1.0); float sk = h31(floor(fp*7.0)+3.0);
  vec3 L = fp+vec3(1.58*GB.x*gu+0.17*sin(uTime*(1.3+1.2*sk)+sk*50.0),-0.2*gu,1.58*GB.y*gu+0.17*cos(uTime*(1.1+1.0*sk)+sk*23.0))-P; float d2 = dot(L,L); float d = sqrt(max(d2,1e-4));
  float e = (1.0-0.5*gt)*breath(fp,uTime)*max(dot(N,L)/d*0.8+0.2,0.0)/(1.0+d2*0.55)*exp(-(L.x*L.x+L.z*L.z)*0.42); Ld += L/d*e; return e; }
// a flame's image in the polished floor: a soft streak stretched toward the eye (h = where the mirrored ray meets the
// flame's height, f = the flame in plan, vd = the eye's bearing in plan)
float streak(vec2 h, vec2 f, vec2 vd, float wl, float wa){
  vec2 d = h-f; float a = dot(d,vd), l = dot(d,vec2(-vd.y,vd.x)); return exp(-l*l/(wl*wl)-a*a/(wa*wa)); }
float latticePool(vec3 P, vec3 N, float cx, float z0, float z1, float fy, float lat, inout vec3 Ld){
  float k0 = floor((P.z-z0)/lat+0.5); float s = 0.0;
  for (int j = -1; j <= 1; j++) { float zf = z0+lat*(k0+float(j));
    s += step(z0-0.1,zf)*step(zf,z1+0.1)*flameE(P,N,vec3(cx,fy,zf),Ld); }
  return s; }
float tierPool(vec3 P, vec3 N, float R, float n, float fy, inout vec3 Ld){
  vec2 r = P.xz-vec2(0.0,-30.0); float ang = atan(r.y, r.x+1e-5); float st = 6.2831853/max(n,1.0); float k0 = floor(ang/st+0.5); float s = 0.0;
  for (int j = -1; j <= 1; j++) { float a = st*(k0+float(j)); s += flameE(P,N,vec3(R*cos(a),fy,-30.0+R*sin(a)),Ld); }
  return s*step(0.5,n); }
// THE GREAT WINDOWS of the transepts' end walls (x 62 and -62, centred on z -31): the opening with its bars as light sees
// it (dz: metres from the window's middle, hy: height; soft: how blurred). Four mullions, two transoms, three lesser
// mullions in the head: the same measures as greatWindow() builds
float gwShape(float dz, float hy, float soft){
  float az = abs(dz); float r = hy > 27.0 ? length(vec2(dz, hy-27.0)) : az;
  float inside = smoothstep(0.0,soft,11.0-r)*smoothstep(7.0,7.0+soft,hy);
  float mull = smoothstep(0.35,0.35+soft, min(abs(az-2.2), abs(az-6.6)));
  float tr = smoothstep(0.3,0.3+soft, min(abs(hy-17.0), abs(hy-27.0)));
  float sub = mix(1.0, smoothstep(0.2,0.2+soft, min(az, abs(az-4.4))), step(27.0,hy));
  return inside*mull*tr*sub; }
// THE COLD LIGHT of a great window, in every look: the night's own light falls steeply through it (down 0.72, inward 0.69)
// and lies on the transept's floor and table tops as one long blue-silver patch with the bars' shadows in it, reaching
// toward the pyramid and dying before it (gone 36 m from the wall); whatever faces the window takes a cool edge that
// falls off with the distance from the glass. gwc: its colour and strength on this side (uGwE east, uGwW west)
float gwLight(vec3 P, vec3 N, out vec3 gwc){
  float sd = P.x > 0.0 ? 1.0 : -1.0; gwc = P.x > 0.0 ? uGwE : uGwW;
  float d = 62.0-abs(P.x); float inT = step(-71.8,P.z)*step(P.z,9.8)*step(0.4,d);
  float pat = gwShape(P.z+31.0, P.y+0.72*d/0.69, 0.25+0.035*d)*(1.0-smoothstep(20.0,36.0,d))*smoothstep(0.3,0.8,N.y);
  float nf = max(dot(N, vec3(sd*0.94,0.34,0.0)), 0.0);
  float edge = nf*nf*exp(-d*0.045)*0.55*(1.0-smoothstep(27.0,34.0,d));
  return inT*(pat+edge); }
// the moon through the west windows: long silver bars
float winShape(float du, float hy){ float dy = max(hy-25.4,0.0); float hw = sqrt(max(6.76-dy*dy,0.0)); float au = abs(du);     // a side window as light sees it: 5.2 m wide, two mullions, a transom
  return smoothstep(0.0,0.6,hw-au)*smoothstep(12.0,12.6,hy)*smoothstep(0.12,0.4,abs(au-0.87))*smoothstep(0.1,0.35,abs(hy-20.3)); }
float moonBar(vec3 P, vec3 N){
  float nd = max(dot(N,uMoonDir),0.0); nd = nd*(0.3+0.7*nd)+0.5*max(N.y,0.0);
  float mx = min(uMoonDir.x,-1e-3);
  float t = (-34.0-P.x)/mx; vec3 h = P+uMoonDir*max(t,0.0);
  float inRange = step(24.0,h.z)*step(h.z,232.0) + step(-240.0,h.z)*step(h.z,-80.0); inRange *= step(0.5,t);
  float hzw = h.z + (h.z < -72.0 ? 8.0 : 0.0);                               // (the choir's windows stand 8 m off the nave's lattice of 16 m)
  float bar = winShape(hzw-16.0*floor(hzw/16.0+0.5), h.y)*inRange*step(-33.8,P.x);
  // THE CROSSING: the moon stands in the west great window (x -62) and lays its tracery in silver over the crossing floor,
  // the pyramid's west flank and on into the east transept
  float t3 = (-62.0-P.x)/mx; vec3 h3 = P+uMoonDir*max(t3,0.0);
  bar += gwShape(h3.z+31.0, h3.y, 0.3+0.006*t3)*step(0.5,t3)*step(-71.8,P.z)*step(P.z,9.8);
  return nd*min(bar,1.0)*uMoonI; }
float damask(vec2 p){ float f = sin(p.x*3.0+sin(p.y*2.0)*1.2)*sin(p.y*3.0+cos(p.x*2.0)*1.2); return smoothstep(0.05,0.35,f); }   // (its mean: 0.34)
// A PATTERN IS FILTERED BY A PIXEL'S FOOTPRINT, never by distance. foot = how many metres of the surface one pixel covers
// (the screen derivative of the world position: the pattern's own coordinate). lineCov: how much of a pixel w wide a line of
// half-width h covers at d from its middle (its average over d is 2h for every w, so a line keeps its tone as it thins);
// toMean: 1 where the pixel is finer than a quarter of the pattern's period T, 0 where it is as wide as the period, and
// every pattern is mixed toward ITS OWN MEAN by it, as a texture is: no lighter and no darker with distance
float lineCov(float d, float h, float w){ float ww = max(w,1e-4); return clamp((h+0.5*ww-d)/ww, 0.0, min(1.0, 2.0*h/ww)); }
float toMean(float foot, float T){ return 1.0-smoothstep(0.25*T, T, foot); }
// figCov: a small figure cut with a soft edge fa wide either side of its outline, d = its radius here less its outline's
// radius (0 on the outline), A = its true area in the coordinates d is measured in. The soft edge alone would add
// 0.6283 fa fa to that area (two pi times the edge's first moment, 0.1 fa fa), so the cut is dimmed by A/(A+0.6283 fa fa):
// the figure gives the light of its true area at every footprint, while fa stays about under the figure's own radius
float figCov(float d, float fa, float A){ return (1.0-smoothstep(-fa,fa,d))*A/(A+0.6283*fa*fa); }
// PETALS THAT LIE WHERE THEY FELL (on the carpets, the treads of the dais steps and the tops of the cloths): sparse, by
// place: one cell in three of a lattice 0.9 m square holds one, 0.26 m long and 0.2 m wide, lying as dealt; under a
// pixel wider than 0.14 m they are at their mean: 0.0166 of the surface in their colour, at their mean pink (0.53, whose
// square is the mean of theirs). Returns (how much of the pixel it covers, how pink it is: 0 white to 1)
vec2 lyingPetal(vec2 p, float foot){ vec2 ci = floor(p/0.9); float h = h11(ci.x*12.7+ci.y*31.3), h2 = h11(ci.x*5.1+ci.y*17.9+3.0);
  vec2 q = (fract(p/0.9)-0.5)*0.9 - 0.5*(vec2(h2, fract(h*17.0))-0.5); float an = h*39.0, ca = cos(an), sa = sin(an); q = vec2(ca*q.x+sa*q.y, ca*q.y-sa*q.x);
  float fa = clamp(foot*6.0, 0.03, 0.8), r = length(q/vec2(0.13,0.10+0.03*q.x/0.13));
  float pm = 1.0-smoothstep(0.06,0.14,foot);
  return vec2(mix(0.0166, step(h, 0.33)*figCov(r-1.0, fa, 3.14), pm), mix(0.53, fract(h*7.3), pm)); }
// the linen's woven damask: a leaf in a diaper 0.25 m apart, 1 on the leaf (0.4 at its heart), 0 off it; its mean 0.31
float diaper(vec2 p, float foot){ vec2 q = vec2(p.x+p.y, p.x-p.y)*17.77; float m = sin(q.x)*sin(q.y); float w = clamp(foot*14.0,0.02,1.0);
  return mix(0.31, smoothstep(0.18-w,0.18+w,m)-0.6*smoothstep(0.82-w,0.82+w,m), toMean(foot,0.25)); }
// A VINE FRIEZE's relief (0 ground, 1 highest): q = the place along the frieze and above its middle line, in the frieze's own
// unit (1.3 m on the wainscot, 1.6 m on the doorway's pelmet). A stem that waves once every 2 units (0.26 up and down); in
// the hollow of each wave by turns a five-lobed vine leaf and a bunch of grapes
// THE BROCADE's figure (p: metres along the cloth and the height in the hall; f a pixel's footprint): a repeat 3 m wide,
// in columns 1.5 m wide that hold by turns A POMEGRANATE (a round body 0.5 m across with a crown of points, split down
// its middle to show its seeds, two pointed leaves with their midribs under it) and A ROSE of eight petals 0.72 m
// across with a ringed heart, a bud above and below it; each stands in a pointed oval of two lines 1.3 m high (its
// middle at y 4.9, 1.1 m under a rank's top); where two ovals meet, a small flower of four petals and a bead above
// and below it. 1 on the woven figure, 0 on the ground; its mean over what shows of it, between the border band and the linen, is 0.209. Every figure is cut with figCov, so it gives the gold of its true area at every footprint
float brocade(vec2 p, float f){
  float cl = floor(p.x/1.5), odd = mod(cl, 2.0), w = clamp(f, 0.004, 0.1);
  vec2 q = vec2(p.x-(cl+0.5)*1.5, p.y-4.9);
  float ov = 0.69*sqrt(max(1.0-q.y*q.y/0.4225, 0.0));                          // the oval's half width at this height (0.69 at its middle; it closes 0.65 m above and below)
  float frame = mix(0.0731, min(lineCov(abs(abs(q.x)-ov), 0.016, f)+lineCov(abs(abs(q.x)-ov+0.07), 0.008, f), 1.0), toMean(f,0.4))*step(abs(q.y), 0.65);     // (under a pixel 0.4 m wide the oval's two lines are at their mean: 0.0731 of what the figures leave open)
  float fig;
  if (odd < 0.5) {
    vec2 b0 = q-vec2(0.0,-0.06); float body = figCov(length(b0)-0.25, w, 0.196);
    float crown = figCov(max(abs(q.x)-0.14, q.y-0.3-0.13*abs(cos(q.x*33.6))), w, 0.070)*step(0.12,q.y);       // (what shows of the crown over the body is 0.058; its soft edge adds 0.52 w w, and 0.070 is the area that dims it by just that)
    float split = figCov((length(b0/vec2(0.08,0.17))-1.0)*0.08, w, 0.0201);       // (an oval cut across its short axis: its soft edge adds long/short times a disc's, so its area, 0.0427, is given times short/long)
    vec2 sd = (fract(b0/0.06)-0.5)*0.06; float seeds = mix(0.349, figCov(length(sd)-0.02, min(w,0.01), 0.00126), toMean(f,0.06));       // (seeds 0.04 m across every 0.06 m: mean 0.349)
    fig = max(body*(1.0-split*(1.0-seeds)), crown);
    vec2 lq = vec2(abs(q.x)-0.3, q.y+0.38); lq = vec2(lq.x*0.766+lq.y*0.643, -lq.x*0.643+lq.y*0.766);
    float leaf = figCov(length(lq/vec2(0.2,0.08))*0.08-0.08*(1.0-0.5*abs(lq.x)/0.2), w, 0.0201)*mix(0.859, 1.0-lineCov(abs(lq.y), 0.008, f), toMean(f,0.16));       // (a leaf's area is 0.0303; its soft edge adds 1.5 times a disc's, so it is given as 0.0201; its midrib takes 0.141 of it)
    fig = max(fig, leaf);
  } else {
    float rl = length(q), th = atan(q.y, q.x+1e-5);
    float rose = figCov(rl-0.36*(0.7+0.3*cos(8.0*th)), w, 0.218)*(0.45+0.55*smoothstep(0.1,0.16,rl))*mix(0.915, 1.0-0.8*lineCov(abs(rl-0.2), 0.012, f), toMean(f,0.2));       // (the ring takes 0.085 of the rose's tone)
    vec2 bq = vec2(abs(q.x), abs(q.y)-0.5); float bud = figCov(length(bq/vec2(0.06,0.1))*0.06-0.06, w, 0.0113);       // (its area, 0.0188, times short/long)
    fig = max(rose, bud);
  }
  vec2 jq = vec2(0.75-abs(q.x), q.y); float jl = length(jq), ja = atan(jq.y, jq.x+1e-5);
  float joint = figCov(jl-0.1*(0.6+0.4*cos(4.0*ja)), w, 0.0138);
  vec2 jb = vec2(jq.x, abs(q.y)-0.42); joint = max(joint, figCov(length(jb)-0.045, min(w,0.0675), 0.00636));
  return clamp(1.0-(1.0-max(fig, joint))*(1.0-frame), 0.0, 1.0); }       // (the frame's lines cover their share of what the figures leave)
float vineH(vec2 q){
  float kx = floor(q.x), xl = q.x-kx-0.5, sgn = mod(kx,2.0) < 0.5 ? 1.0 : -1.0;
  float stem = 1.0-smoothstep(0.025,0.07,abs(q.y-0.26*sgn*cos(xl*3.14159))*0.8);
  vec2 lp = vec2(xl, q.y+0.1*sgn); float th = atan(lp.y, lp.x+1e-5), ll = length(lp);
  float leaf = (1.0-smoothstep(-0.05,0.0,ll-0.21*(0.72+0.28*cos(5.0*th+1.57))))*(0.7+0.3*abs(cos(th*2.5+0.78)))*(0.6+0.4*smoothstep(0.0,0.12,ll));
  float v = (q.y+0.1*sgn+0.17)/0.34; vec2 gp = vec2(xl, q.y)/0.085; gp.x += 0.5*mod(floor(gp.y),2.0); vec2 gc = fract(gp)-0.5;
  float grape = sqrt(max(1.0-5.2*dot(gc,gc),0.0))*step(abs(xl),0.17*v+0.03)*step(0.0,v)*step(v,1.0);
  return max(stem*0.55, sgn > 0.0 ? leaf*0.85 : grape); }
// the frieze lit as relief: x = its height at q, y = how far its slope there turns toward the light L (along the frieze, upward)
vec2 vineLit(vec2 q, vec2 L){ float e = 0.02, h0 = vineH(q);
  return vec2(h0, clamp(((vineH(q+vec2(e,0.0))-h0)*L.x + (vineH(q+vec2(0.0,e))-h0)*L.y)*1.2, -0.5, 0.5)); }
// THE ROOF'S LIGHT, from where the lights hang: a warm pool above every row of chandeliers of the nave (five hoops across at
// y 14.8, rows at z 68 to 196 every 32 m), above the choir's two free chandeliers (z -92 and -218; the middle one hangs under
// the canopy), above the pyramid and its corona (the crossing's ceiling) and above each transept's middle round table; a
// pool is as wide as the light hangs deep below the boards; between the pools the low glow of the tables, dimmer toward the ridge
float roofLight(vec3 P){
  float e = uTabI*0.2*(1.0-0.4*smoothstep(30.0,46.0,P.y)), cI = 0.12+uChI;
  float zr = 68.0+32.0*clamp(floor((P.z-68.0)/32.0+0.5), 0.0, 4.0);
  for (int j = -1; j <= 1; j++) { float zz = zr+32.0*float(j); vec3 L = vec3(clamp(P.x,-22.0,22.0), 14.8, zz)+chSw(zz)-P; float h2 = L.y*L.y;
    e += step(60.0,zz)*step(zz,200.0)*step(10.0,P.z)*cI*36.0/(1.0+h2*0.03)*exp(-(L.x*L.x+L.z*L.z)/(0.3*h2)); }
  { vec3 L = (P.z > -155.0 ? vec3(0.0, 17.8, -92.0) : vec3(0.0, 21.3, -218.0))+uChSway-P; float h2 = L.y*L.y;
    e += step(P.z,-72.0)*cI*44.0/(1.0+h2*0.03)*exp(-(L.x*L.x+L.z*L.z)/(0.3*h2+60.0)); }
  { vec3 L = vec3(0.0, 34.0, -30.0)-P; float h2 = L.y*L.y;
    e += step(abs(P.x),34.5)*step(-72.5,P.z)*step(P.z,10.5)*uPyI*12.0/(1.0+h2*0.03)*exp(-(L.x*L.x+L.z*L.z)/(0.3*h2+900.0)); }
  { vec3 L = vec3(P.x > 0.0 ? 46.0 : -46.0, 7.7, -31.0)-P; float h2 = L.y*L.y;
    e += step(34.5,abs(P.x))*uTrI*30.0/(1.0+h2*0.03)*exp(-(L.x*L.x+L.z*L.z)/(0.3*h2)); }
  return e; }
void main(){
  float kind = floor(vS.x+0.5); bool leafy = kind > 5.5 && vS.z > 11.5;       // (a leaf mass carries its own round normal on both faces of every card)
  vec3 N = normalize(vN); if (!gl_FrontFacing && !leafy) N = -N;
  vec3 P = vW; vec3 Vv = cameraPosition-P; float vd = length(Vv); vec3 V = Vv/max(vd,1e-3);
  vec2 dSu = fwidth(vS.yw); float leafF = dSu.x+dSu.y;                         // a pixel's footprint in a card's own coordinates
  vec3 dP = fwidth(P); float foot = max(dP.x, max(dP.y, dP.z));             // a pixel's footprint on this surface, in metres
  vec3 col;
  if (kind > 6.5) {                                                        // window glass in small leaded squares (the great windows) or diamonds (the side windows)
    float u = abs(N.x) > 0.5 ? P.z : P.x; vec2 g = vec2(u, P.y)/0.9; vec2 gf = (0.5-abs(fract(g)-0.5))*0.9;      // metres from the nearest lead
    float lead = 1.0-(1.0-lineCov(gf.x,0.03,foot))*(1.0-lineCov(gf.y,0.03,foot)); lead = mix(0.13, lead, toMean(foot,0.9));       // (leads 0.06 m wide every 0.9 m: mean 0.13; two crossed families of lines cover 1-(1-a)(1-b) of a pixel)
    float rip = 0.8+0.4*vnoise(vec3(floor(g)*1.7, 2.0));
    float east = P.x > 30.0 ? 1.0 : (P.x < -30.0 ? uBlueE : 0.6);                                // the east walls' panes, the west walls', the rest
    vec3 glow = vec3(0.0), stain = vec3(1.0);
    if (vS.y < 0.5) {
      // A SIDE WINDOW: diamond panes 0.62 m wide and 1.0 m tall in leads 0.05 m wide, each pane's tone its own (0.7 to 1.3);
      // the night behind it a luminous deep blue, paler toward the sill, plainly blue on every look; in the head (above the
      // springing, y 25.4) a roundel of deep red in a ring of gold, and the panes round it red, blue, gold or clear by their own number
      float du = u-vS.z, hy = P.y; vec2 dg = vec2(du/0.62+hy, du/0.62-hy); vec2 df = (0.5-abs(fract(dg)-0.5))*0.527;        // (0.527: a diamond's lattice step, across its leads)
      lead = 1.0-(1.0-lineCov(df.x,0.025,foot))*(1.0-lineCov(df.y,0.025,foot)); lead = mix(0.18, lead, toMean(foot,0.6));           // (mean 0.18)
      float id = h11(floor(dg.x)*7.31+floor(dg.y)*3.17+vS.z*0.37);
      rip = mix(1.0, 0.7+0.6*id, toMean(foot,0.6));
      float low = 1.0-smoothstep(12.0,27.0,hy);
      glow = (vec3(0.022,0.050,0.165) + vec3(0.050,0.085,0.17)*low*low)*(0.75+0.5*east);
      float rl2 = length(vec2(du, hy-26.3)); float inHead = smoothstep(25.4,25.6,hy);
      float pick = h11(id*91.7+3.3);
      vec3 pc = pick < 0.3 ? vec3(0.75,0.05,0.04) : (pick < 0.55 ? vec3(0.08,0.2,1.0) : (pick < 0.75 ? vec3(1.0,0.62,0.1) : vec3(1.0)));
      stain = mix(vec3(1.0), mix(vec3(1.11,0.702,0.851), pc*1.6, toMean(foot,0.6)), inHead);          // (the panes' mean colour: 1.11, 0.702, 0.851)
      stain = mix(stain, vec3(1.3,0.8,0.12), inHead*(1.0-smoothstep(0.78,0.82,rl2)));
      stain = mix(stain, vec3(0.9,0.05,0.04), inHead*(1.0-smoothstep(0.56,0.60,rl2)));
      lead = max(lead, inHead*lineCov(abs(rl2-0.8),0.03,foot));
    }
    // (the west great window: its glass shows uGwPaneW of the moon's wide halo and its own colour uGwGlassW: under the
    // full moon 0.22 and a deep blue, so that the glass is as deep as the others and the moon stands in it as a clear
    // disc in a soft halo; in the other looks the whole sky and the window's own cold light)
    vec3 sky = nightSkyH(-V, uTime, vS.y > 0.5 && vS.y < 1.5 && P.x < 0.0 ? uGwPaneW : 1.0);
    col = (sky*uPaneGain*east + glow)*stain*rip*(1.0-0.85*lead) + uAmb*0.03 + uFlameCol*0.011*(1.0-lead)*rip;   // (and the candle-lit hall, faint in the glass)
    if (vS.y > 0.5) {                                                      // a great window: the night luminous behind it, plainly blue, paler low down
      vec3 gwc = vS.y > 1.5 ? 0.5*(uGwE+uGwW) : (P.x > 0.0 ? uGwE : uGwGlassW); float lowd = 1.0-smoothstep(7.0,30.0,P.y);   // (2: the wheel window over the north door)
      col += (gwc*(0.9+1.1*lowd) + dot(gwc,vec3(0.3333))*vec3(0.5,0.55,0.6)*lowd*lowd)*rip*(1.0-0.85*lead);
    }
  } else {
    if (kind > 5.5 && !leafy && dot(N,V) < 0.0) N = -N;                     // leaves and cloth are lit on the side the eye sees
    // A HANGING CLOTH (a table's linen below its top) is lit as the smooth pleat it hangs in, never as the facet it is
    // drawn by: its normal is worked from the pleats' own law, the geometry's (the cloth stands out from the table's
    // edge by 0.05 m + amp (0.5 - 0.5 cos) along each pleat, times how far down it hangs: a long table's pleats 1.6 m
    // apart, amp 0.21; a rank's 0.8 m apart, each of its own depth; a round table's skirt by 0.24 cos(12 a))
    if (kind > 2.5 && kind < 3.5 && N.y < 0.5) {
      float rnd3 = step(abs(vS.w-vS.z), 0.01), rk3 = step(abs(vS.y),8.0)*step(P.z,-100.0), vy3 = clamp(((rk3 > 0.5 ? 6.0 : 3.0)-P.y)/(rnd3 > 0.5 ? 2.96 : 2.4), 0.0, 1.0);
      if (rnd3 > 0.5) { vec2 rr = P.xz-vec2(vS.y,vS.z); float rl = max(length(rr),1e-3), sl = 12.0*0.24*vy3*sin(12.0*atan(rr.y, rr.x+1e-5))/rl; vec2 rh = rr/rl;
        N = normalize(vec3(rh.x-rh.y*sl, 0.1, rh.y+rh.x*sl)); }
      else { bool az = abs(N.x) > abs(N.z); float c3 = az ? P.z : P.x, pt = rk3 > 0.5 ? 0.8 : 1.6, am = rk3 > 0.5 ? 0.3*(0.45+0.9*h11(floor(c3/0.8))) : 0.21;
        float fs = am*3.14159/pt*sin(6.2831853*c3/pt)*vy3, so = az ? sign(N.x) : sign(N.z);
        N = normalize(az ? vec3(so, 0.1, -fs) : vec3(-fs, 0.1, so)); } }
    float E; vec3 Ld; hallLight(P,N,kind,E,Ld);
    vec3 alb = vC; vec3 extra = vec3(0.0), linWarm = vec3(1.0); float spec = 0.0, bar = moonBar(P,N), amb = 0.7+0.3*abs(N.y), linLit = -1.0, roofK = 0.0, fillK = 1.0, tierMix = 0.0, damK = 0.0, boardK = 0.0, paintK = 0.0; vec3 ambT = vec3(1.0), tierImg = vec3(0.0); vec4 tierPaint = vec4(0.0);
    if (kind < 1.5) amb *= mix(4.4, kind < 0.5 ? 4.2 : 3.2, smoothstep(27.0,33.0,P.y));     // stone and oak keep a floor of warm underlight: umber, never black; the roof timbers dimmer than the walls
    float fw = max(dot(N,uTierDir)*0.5+0.5, 0.0); fw = fw*fw*fw;          // the pyramid's cool flank: what faces east in the blue hour, west under the moon
    if (kind < 0.5) {                                                      // stone: coursed blocks
      // large quiet ashlar: blocks 3.2 m by 1.6 m in joints 0.04 m wide (their mean 0.0372), each block's tone a little its own
      float u = P.x+P.z; float row = floor(P.y/1.6); vec2 b = vec2(u/3.2+row*0.5, P.y/1.6); vec2 bf = 0.5-abs(fract(b)-0.5);
      float joint = mix(0.0372, 1.0-(1.0-lineCov(bf.x*3.2,0.02,foot))*(1.0-lineCov(bf.y*1.6,0.02,foot)), toMean(foot,1.6));
      float tone = mix(0.5, h11(floor(b.x)*7.13+row*3.7), toMean(foot,3.2));
      alb *= (0.95+0.10*tone)*(1.0-0.3*joint)*(0.86+0.28*vnoise(P*vec3(0.7,1.1,0.7)));          // the courses are texture, not pattern
      // THE PAINTED FIELDS over the four crossing arches (surf.y = 1; surf.z = the wall's half width; surf.w = 1 where it
      // runs along z): each wall from its arch to the ceiling is painted as the roof is, a deep blue-green sown with
      // small gilt stars 0.75 m apart under a gilt and red line at the wall's head (y 45.0); in each of its two upper
      // corners (0.76 of the half width out, y 40.2) a gilt roundel 2.5 m in radius, embossed with a rose of eight
      // petals, in a great wreath of bay 1.6 m wide (2.85 to 4.45 m out) with fruit in it, red and gold, every 30 degrees,
      // and a gilt line round the wreath 4.95 m out
      if (vS.y > 0.5) {
        float la = vS.w < 0.5 ? P.x : P.z+31.0, fa = clamp(foot,0.006,0.3);
        vec2 wc = vec2(abs(la)-0.76*vS.z, P.y-40.2); float wr = length(wc), wa = atan(wc.y, wc.x+1e-5);
        vec2 gc = fract(vec2(la+P.y, la-P.y)/1.06)-0.5; float gl = length(gc)*0.75, th = atan(gc.y, gc.x+1e-5);
        float star = figCov(gl-0.2*(0.55+0.45*cos(5.0*th)), min(fa,0.15), 0.0507)*smoothstep(5.0,5.4,wr);
        vec3 pa = vec3(0.022,0.082,0.098)*(0.82+0.36*vnoise(vec3(la,P.y,3.0)*0.55));
        pa = mix(pa, vec3(0.62,0.42,0.13), mix(0.0902*smoothstep(5.0,5.4,wr), star, toMean(foot,0.75)));
        pa = mix(pa, vec3(0.36,0.06,0.045), lineCov(abs(P.y-44.5),0.07,foot));
        pa = mix(pa, vec3(0.5,0.34,0.1), max(lineCov(abs(P.y-45.0),0.2,foot), lineCov(abs(wr-4.95),0.07,foot)));
        // the wreath: pairs of leaves 1 m long lying outward and inward of its stem, 24 pairs round; a fruit at every second
        float sa = wa*3.8197186, ci = floor(sa+0.5), su = (sa-ci)*0.9556, tt = wr-3.65, sg = tt < 0.0 ? -1.0 : 1.0;
        vec2 lq = vec2(su*0.82+(abs(tt)-0.42)*0.57, -su*0.57+(abs(tt)-0.42)*0.82);
        float leaf = figCov(length(lq/vec2(0.5,0.19))-1.0, fa, 3.14);
        float stem = 1.0-smoothstep(-fa,fa, abs(tt)-0.2), lh = h11(mod(ci+12.0, 24.0)*3.7+sg*1.3);
        vec3 lc = mix(vec3(0.07,0.17,0.05), vec3(0.20,0.33,0.09), lh)*(1.0-0.5*lineCov(lq.y,0.012,foot));
        pa = mix(pa, vec3(0.04,0.10,0.035), stem*step(abs(tt),0.9)); pa = mix(pa, lc, leaf*step(abs(tt),0.95));
        float fo = mod(ci+12.0, 2.0) < 0.5 ? 1.0 : 0.0; vec2 fq = vec2(su, tt-0.12*(lh-0.5)); float fr = length(fq);
        float fruit = fo*figCov(fr-0.33, fa, 0.342);
        pa = mix(pa, mix(vec3(0.42,0.05,0.035), vec3(0.66,0.4,0.08), step(0.5,lh))*(0.55+0.75*(1.0-smoothstep(0.0,0.3,length(fq-vec2(-0.08,0.1))))), fruit);
        // the roundel: gilt, a rose of eight petals raised on it, a red line and a dark groove within its rim
        float ros = figCov(wr-1.9*(0.6+0.4*abs(cos(4.0*wa))), fa, 8.46)*(0.55+0.45*smoothstep(0.2,0.5,wr));
        vec3 rd = vec3(0.52,0.35,0.10)*(0.62+0.38*ros+0.25*(1.0-smoothstep(0.0,0.45,wr)));
        rd = mix(rd, vec3(0.34,0.06,0.045), lineCov(abs(wr-2.18),0.05,foot)); rd *= 1.0-0.5*lineCov(abs(wr-2.36),0.03,foot);
        pa = mix(pa, rd, figCov(wr-2.5, fa, 19.6));
        alb = pa; paintK = 1.0; spec = 0.3+1.0*max(figCov(wr-2.5, fa, 19.6), star);
      }
      // THE PAINTED WALLS of the nave (the wall planes at x -34 and 34 south of z 10 and the south wall, over the wainscot): on the stone, warmed,
      // a diaper in dull red and gold: a lattice of red lines 0.12 m wide in lozenges 2 m wide and 3 m high, a gold knot
      // where two lines cross, a gold flower of four petals in every lozenge. It is whole over the wainscot and fades
      // upward from y 22 into the cornice (gone by 28.8); under a pixel as wide as the lattice's step (1.664 m) the lines go to their mean (0.134: laid under the gold's mean it shows the red's true share; the lines' own cover is 0.139), under one 2 m wide the gold to its (0.123).
      // The transepts' walls (x -62 and 62, and z 10 and -72 beyond x 34) carry no diaper: their stone is warmed alike and no more
      float onW = step(abs(N.y),0.5)*max(step(abs(abs(P.x)-34.0),0.05)*step(10.0,P.z), step(abs(P.z-240.0),0.05));
      float onT = step(abs(N.y),0.5)*max(step(abs(abs(P.x)-62.0),0.05), step(34.0,abs(P.x))*max(step(abs(P.z-10.0),0.05), step(abs(P.z+72.0),0.05)));
      if (onT > 0.5 && P.y > 10.0) alb *= mix(vec3(1.0), vec3(1.12,1.0,0.84), (1.0-smoothstep(22.0,28.8,P.y))*smoothstep(10.2,10.5,P.y));
      if (onW > 0.5 && P.y > 10.0) {
        float fade = (1.0-smoothstep(22.0,28.8,P.y))*smoothstep(10.2,10.5,P.y), fa = clamp(foot,0.006,0.3);
        vec2 dq = vec2(u/2.0+P.y/3.0, u/2.0-P.y/3.0), fq = fract(dq)-0.5, df = (0.5-abs(fq))*1.664;
        float ln = 1.0-(1.0-lineCov(df.x,0.06,foot))*(1.0-lineCov(df.y,0.06,foot));
        vec2 cq = vec2(fq.x+fq.y, (fq.x-fq.y)*1.5); float fl4 = figCov(length(cq)-0.36*(0.5+0.5*abs(cos(2.0*atan(cq.y, cq.x+1e-5)))), fa, 0.282);
        float knot = figCov(length(df)-0.16, fa, 0.0804);
        alb *= mix(vec3(1.0), vec3(1.10,1.0,0.86), fade);
        float gm = fade*0.9*mix(0.123, max(fl4,knot), toMean(foot,2.0)); ln = mix(ln, clamp((ln-0.678*fade*knot)/max(1.0-gm,0.1), 0.0, 1.0), smoothstep(0.006,0.03,fa)); alb = mix(alb, vec3(0.34,0.10,0.07), fade*0.7*mix(0.134, ln, toMean(foot,1.664)));     // (past a 0.03 m footprint the red as its share of what the gold over it leaves; 0.678: the gold's 0.9 of the 0.753 of a knot that lies on the lines)
        alb = mix(alb, vec3(0.66,0.47,0.15), fade*0.9*mix(0.123, max(fl4,knot), toMean(foot,2.0))); }
    } else if (kind < 1.5) {                                               // oak; surf.y = 1: linenfold panelling, 2: the wainscot, 3: a fluted pilaster
      float u = P.x+P.z; float g = abs(N.y) > 0.5 ? vnoise(vec3(P.x*9.0,P.y,P.z*0.8)) : vnoise(vec3(u*1.6,P.y*0.55,u*9.0)*vec3(1.0,1.0,0.12)+vec3(0.0,0.0,P.y*7.0));
      alb *= vS.y > 3.5 && vS.y < 4.5 ? 1.0 : 0.84+0.32*g;
      if (vS.y > 3.5) {
        // THE PAINTED ROOF. surf.y = 4: the boarded field between the timbers (surf.z = 0: a slope of the nave or the choir, 1: of
        // a transept, 2: the crossing's flat ceiling), painted a deep blue-green and divided by ribs into panels about 4 m
        // square: each rib dull gold, 0.32 m wide, with a red line 0.12 m wide beside it; in every panel a gilt rosette
        // (1.2 m across) and round it small gilt stars on a diaper 0.75 m apart. surf.y = 5: a timber, in its own paint.
        // Ribs and red lines keep their cover as they thin (the ribs as two crossed families, the red lines as their share of what the ribs leave) and go to their means under a pixel as wide as a panel; stars and rosettes go to their means under a wide pixel (each its mean cover of
        // the part of a panel that rib and red line leave open, by the kind of panel, since the ribs are painted over them)
        roofK = 1.0;
        if (vS.y < 4.5) {
          vec2 pm = vS.z < 0.5 ? vec2(P.z, (P.y-30.0)*2.349) : (vS.z < 1.5 ? vec2(P.x, (P.y-30.0)*2.751) : vec2(P.z+31.0, P.x));
          vec2 ps = vS.z < 0.5 ? vec2(4.0, 4.176) : (vS.z < 1.5 ? vec2(4.0, 4.001) : vec2(3.9, 4.85));
          vec2 cu = pm/ps, cf = (0.5-abs(fract(cu)-0.5))*ps; float dr = min(cf.x, cf.y), fa = clamp(foot, 0.004, 0.2);
          vec2 kr = 1.0-vec2(lineCov(cf.x,0.16,foot), lineCov(cf.y,0.16,foot)), ka = 1.0-vec2(lineCov(cf.x,0.28,foot), lineCov(cf.y,0.28,foot)), kb = 1.0-vec2(lineCov(cf.x,0.40,foot), lineCov(cf.y,0.40,foot)); float tpn = toMean(foot,4.0), rib = mix(1.0-(1.0-0.32/ps.x)*(1.0-0.32/ps.y), 1.0-kr.x*kr.y, tpn), red = min(mix((1.0-0.56/ps.x)*(1.0-0.56/ps.y)-(1.0-0.8/ps.x)*(1.0-0.8/ps.y), ka.x*ka.y-kb.x*kb.y, tpn)/max(1.0-rib,1e-3), 1.0);
          vec2 gc = fract(vec2(pm.x+pm.y, pm.x-pm.y)/1.06)-0.5; float gl = length(gc)*0.75, th = atan(gc.y, gc.x+1e-5);
          vec2 pc = (fract(cu)-0.5)*ps; float pl = length(pc), pt = atan(pc.y, pc.x+1e-5);
          float star = figCov(gl-0.2*(0.55+0.45*cos(5.0*th)), min(fa,0.15), 0.0507)*smoothstep(0.5,0.62,dr)*smoothstep(0.9,1.0,pl);
          float ros = figCov(pl-0.6*(0.62+0.38*abs(cos(4.0*pt))), fa, 0.856)*(0.45+0.55*smoothstep(0.1,0.2,pl));
          float gold = min(mix(vS.z < 0.5 ? 0.0429 : (vS.z < 1.5 ? 0.0412 : 0.0471), star, toMean(foot,0.75)) + mix(vS.z < 0.5 ? 0.0650 : (vS.z < 1.5 ? 0.0683 : 0.0565), ros, toMean(foot,4.0)), 1.0);
          float bj = (0.5-abs(fract(pm.x/0.4)-0.5))*0.4;                              // the boards: a joint every 0.4 m (its mean 0.06)
          alb = vC*vec3(0.024,0.092,0.108)*(0.82+0.36*vnoise(vec3(pm*0.55, 3.0)))*(1.0-0.3*mix(0.06, lineCov(bj,0.012,foot), toMean(foot,0.4)));
          alb = mix(alb, vec3(0.62,0.42,0.13), gold); alb = mix(alb, vec3(0.36,0.06,0.045), red); alb = mix(alb, vec3(0.5,0.34,0.1), rib);
          spec = 0.3+1.2*max(gold, rib);
        } else spec = 0.5;
      } else if (vS.y > 1.5) {
        // THE WAINSCOT (surf.y = 2) and its PILASTERS (3). The relief is lit as relief: every slope is shaded by where the
        // candles stand (Lt, Ly: the light's bearing along the wall and upward), so it holds at a grazing eye; it goes to
        // its mean where a pixel is wider than a panel's mouldings
        // (surf.w = 0: the wall runs along z; 1: along x. ua = metres along it)
        vec3 Lq = normalize(Ld); float ua = vS.w < 0.5 ? P.z : P.x, Lt = vS.w < 0.5 ? Lq.z : Lq.x, Ly = Lq.y, rel = toMean(foot,0.8), sh = 1.0;
        float rk = P.z > -71.99 ? 1.9 : 1.0;                                   // (the nave's and the transepts' wainscot is cut deeper: its relief nearly twice as strong)
        if (vS.y > 2.5) {                                                    // a pilaster (surf.z = its middle along the wall): four flutes 0.2 m apart between y 1.6 and y 9.0
          float lo = ua-vS.z, fl = fract(lo/0.2), on = smoothstep(1.5,1.7,P.y)*(1.0-smoothstep(8.9,9.1,P.y))*step(abs(lo),0.4);
          sh = 1.0 + on*mix(-0.125, 0.55*sin(fl*6.2831853)*Lt - 0.25*(0.5-0.5*cos(fl*6.2831853)), toMean(foot,0.2));      // (a flute's mean shade: -0.125)
        } else if (P.y < 8.5) {
          // raised-and-fielded panels 1.6 m wide (ten to a bay) in two tiers (y 0.8 to 5.4, 5.4 to 8.5): a frame 0.16 m wide, a
          // bevel 0.2 m wide rising to the field, a dark line at the bevel's foot
          float a = fract(ua/1.6+0.5)*1.6, y0 = P.y < 5.4 ? 0.8 : 5.4, H = P.y < 5.4 ? 4.6 : 3.1, c = P.y-y0;
          float ex = min(a, 1.6-a), ey = min(c, H-c), d = min(ex,ey)-0.16, aa = clamp(foot,0.008,0.1);
          float bev = smoothstep(-aa,aa,d)*(1.0-smoothstep(0.2-aa,0.2+aa,d));
          float tu = ex < ey ? (a < 0.8 ? -1.0 : 1.0) : 0.0, ty = ex < ey ? 0.0 : (c < H*0.5 ? -1.0 : 1.0);
          sh = 1.0 + rk*mix(P.y < 5.4 ? 0.0172-0.0136*rk : 0.0126-0.0147*rk, 0.8*bev*(tu*Lt+ty*Ly) - 0.3*lineCov(abs(d),0.015*rk,foot) + 0.07*smoothstep(0.2-aa,0.2+aa,d) - 0.06*(1.0-smoothstep(-aa,aa,d)), rel);     // (far off, the panel's mean shade: its field's lift less its frame's shade and its line's, by tier and by the depth of the cut)
        } else {
          // THE FRIEZE (y 8.5 to 10.2): a vine and its grapes carved in relief between two mouldings
          vec2 vl = vineLit(vec2(ua, P.y-9.35)/1.3, vec2(Lt,Ly));
          float band = smoothstep(8.62,8.68,P.y)*(1.0-smoothstep(10.02,10.08,P.y));
          float mould = lineCov(abs(P.y-8.62),0.05,foot)+lineCov(abs(P.y-10.08),0.05,foot);
          float rf = toMean(foot,0.25);
          sh = 1.0 + rk*band*mix(-0.0901, 0.32*vl.x - 1.4*vl.y - 0.12, rf) + 0.22*mould*Ly*rel + 0.1*mould;      // (the relief's mean over the band: -0.0901)
        }
        alb *= clamp(sh, rk > 1.5 ? 0.25 : 0.4, rk > 1.5 ? 2.0 : 1.7);
      } else if (vS.y < -0.5) {
        // THE BACK BOARD of a dresser (surf.y = -1: honey-coloured oak that stands in its sconces' light, boardK, the nave's
        // and the transepts'; -2: the choir's dark oak, in the hall's own light) or of the shelved north wall (-3);
        // surf.w = its middle along its wall. A soft shadow under each shelf. PLATE: gilt and silver chargers stand on edge
        // against it on every shelf that carries no glasses (a dresser's base, third and top shelves: y 4, 9, 14; the north
        // wall's shelves at y 11, 16, 18.5 and 23.5), painted: a round dish 1.24 m (gilt) or 1.0 m (silver) across, a
        // raised rim, a dished well; gilt and silver by turns along a shelf and from shelf to shelf; three to a dresser's
        // shelf, six to a bay of the wall's. surf.z = 1: on all those shelves; 2: on a dresser's third shelf alone (real
        // plate stands on its base and its top shelf); 3: none painted
        float lo = (abs(N.x) > 0.5 ? P.z : P.x)-vS.w, fa = clamp(foot,0.004,0.15), nw = step(vS.y,-2.5); boardK = step(-1.5,vS.y);
        float jb = mix(4.0,11.0,nw), jn = mix(4.0,5.0,nw), js = clamp(floor((P.y-jb)/2.5), 0.0, jn), y0 = jb+2.5*js;
        float sy = js > jn-0.5 ? mix(15.65,26.0,nw) : y0+2.28;
        alb *= 0.62+0.38*smoothstep(0.0,0.7,sy-P.y);
        float has = nw > 0.5 ? step(0.5,abs(js-1.0))*step(0.5,abs(js-4.0)) : (1.0-step(0.5,mod(js,2.0)))*(vS.z > 1.5 ? step(abs(js-2.0),0.5) : 1.0);
        if (vS.z > 2.5) {                                                    // (3: a dresser near the flown line: the board painted a dark blue-green in panels 1.3 m wide between the shelves, a gilt line 0.12 m inside each; all its plate is real)
          float px = (0.5-abs(fract(lo/1.3)-0.5))*1.3, py = min(P.y-y0, sy-P.y), dpn = min(px-0.12, py-0.14);
          float gln = mix((1.0-0.212/1.3)*(1.0-0.252/(sy-y0))-(1.0-0.268/1.3)*(1.0-0.308/(sy-y0)), (1.0-lineCov(px,0.106,foot))*(1.0-lineCov(py,0.126,foot))-(1.0-lineCov(px,0.134,foot))*(1.0-lineCov(py,0.154,foot)), toMean(foot,1.3)); alb *= 0.85+0.3*smoothstep(0.0,0.06,dpn); alb = mix(alb, vec3(0.62,0.44,0.14), 0.85*gln); spec = max(spec, 0.8*gln);     // (the gilt line: the panel within its outer edge less the panel within its inner edge; under a pixel as wide as a panel, its mean cover of the bay)
        } else if (vS.z > 0.5 && has > 0.5) {
          float ci = nw > 0.5 ? floor(lo/2.6)+0.5 : floor(lo/2.6+0.5), xc = ci*2.6, sv = mod(floor(ci+4.0)+floor(js*0.5+0.25)+nw*js, 2.0);
          float rc = sv < 0.5 ? 0.5 : 0.62, inb = step(abs(xc), mix(2.7,6.6,nw)); vec2 cq = vec2(lo-xc, P.y-y0-rc-0.02); float cr = length(cq);
          float disc = figCov(cr-rc, fa, 3.1416*rc*rc)*inb;
          vec3 metal = sv < 0.5 ? vec3(0.62,0.62,0.60) : vec3(0.66,0.48,0.17);
          float shadeC = 0.55+0.5*smoothstep(0.55,0.95,cr/rc) - 0.25*lineCov(abs(cr-rc*0.62),0.012,foot) + 0.5*exp(-dot(cq-vec2(-0.3,0.3)*rc, cq-vec2(-0.3,0.3)*rc)/(0.05*rc*rc));
          alb = mix(alb*(1.0-0.4*inb*exp(-max(cr-rc,0.0)/0.08)), metal*mix(0.8, shadeC, toMean(foot,0.3)), disc); spec = max(spec, disc*1.5); }
      } else if (vS.y > 0.5) {
        float f = fract(u/2.0), gy = fract(P.y/4.7);
        float inP = smoothstep(0.08,0.11,f)*(1.0-smoothstep(0.89,0.92,f))*smoothstep(0.07,0.10,gy)*(1.0-smoothstep(0.90,0.93,gy));
        float fold = abs(sin((f-0.1)/0.8*12.566)); float ends = smoothstep(0.10,0.16,gy)*(1.0-smoothstep(0.84,0.90,gy));
        alb *= mix(1.08, 0.72+0.4*mix(1.0-fold, fold, ends), inP);
        alb *= 1.0-0.5*(1.0-inP)*(1.0-smoothstep(0.0,0.02,min(min(f,1.0-f),min(gy,1.0-gy))));
      }
      if (roofK < 0.5) spec = max(spec, 0.25);
    } else if (kind < 2.5) {                                               // the polished floors: oak boards (the nave) and marble (the crossing, the transepts, the choir, the dais)
      // THE MARBLE: every floor north of z 10 (the crossing, the transepts, the choir), the dais floor and its treads. A
      // chequer of two marbles laid on the diagonal, squares 2 m (a warm cream and a deep green-black; the treads cream
      // alone), veined; a border band of dull red where it meets the carpet, the steps, the walls and the nave's boards
      // (0.7 m wide; 1.1 m along the transepts' walls). The chequer goes to its mean (the two marbles half and half) where a pixel is as wide as two squares
      float aX = abs(P.x), fa = clamp(foot, 0.004, 0.5), tone = 0.5, joint = 0.0;
      float mar = P.y > 0.5 ? 1.0 : step(P.z,10.0);
      float chr = (1.0-smoothstep(-76.0,-58.0,P.z))*step(P.y,0.5);            // (the choir takes little of the nave's light)
      if (mar > 0.5) {
        vec2 q = vec2(P.x+P.z, P.x-P.z)/2.8284; vec2 tq = abs(fract(q*0.5)*2.0-1.0)-0.5; float w = max(foot/2.0, 0.002);
        float chk = mix(0.5, 0.5+0.5*clamp(tq.x/w,-1.0,1.0)*clamp(tq.y/w,-1.0,1.0), toMean(foot,4.0));
        if (P.y > 0.5 && P.y < 2.5) chk = 1.0;
        vec2 cid = floor(q); float v1 = vnoise(vec3(P.xz*0.8+cid*3.7, 5.0)), v2 = vnoise(vec3(P.xz*0.33+cid.yx*1.9, 9.0));
        float vein = mix(0.0836, 1.0-smoothstep(0.0,0.05,abs(v2-0.5)), toMean(foot,0.6));                    // (the veins' mean: 0.0836)
        vec3 cream = vec3(0.50,0.41,0.29)*(0.86+0.28*v1)*(1.0-0.3*vein), dark = vec3(0.030,0.052,0.044)*(0.7+0.6*v1) + vec3(0.10,0.12,0.10)*vein;
        alb = mix(dark, cream, chk);
        float dR = max(aX-22.1, max(P.z+117.0, -199.0-P.z));                   // metres outside the foot of the dais steps
        float bd = bnd(2.75,3.45,aX,fa)*step(-238.7,P.z)*step(P.z,-57.0) + bnd(0.0,0.7,dR,fa) + smoothstep(32.9-fa,32.9+fa,aX)*step(aX,34.0)*step(P.z,-57.0) + smoothstep(9.3-fa,9.3+fa,P.z)
          + (1.0-smoothstep(-245.2-fa,-245.2+fa,P.z)) + bnd(-239.4,-238.7,P.z,fa)*step(aX,3.45)
          + step(34.0,aX)*max(smoothstep(60.9-fa,60.9+fa,aX), max(smoothstep(8.9-fa,8.9+fa,P.z), 1.0-smoothstep(-70.9-fa,-70.9+fa,P.z)));
        if (P.y < 0.5) alb = mix(alb, vec3(0.30,0.075,0.055)*(0.8+0.4*v1), clamp(bd,0.0,1.0));
        // THE GREAT STAR inlaid under the pyramid's foot (its middle the pyramid's, x 0, z -30), reaching 8 m beyond it: on a
        // round field of the green-black marble (to 28.6 m), sixteen points that widen inward under the pyramid: eight long
        // ones to 28 m (6.6 m wide at the pyramid's foot), each half cream and half dull red about its own axis, and
        // between them eight short ones to 24.5 m, half cream and half a grey-green; a brass line round the pyramid's foot
        // (20.1 to 20.6 m) and a brass band (28.6 to 29.1 m) inside a red one (to 29.8 m) round the whole
        if (P.y < 0.5) { vec2 pc = P.xz-vec2(0.0,-30.0); float pr = length(pc);
          if (pr < 29.8) { float sa = atan(pc.y, pc.x+1e-5)/0.7853982, d8 = fract(sa)-0.5, d8s = fract(sa+0.5)-0.5;
            float eL = 5.8*(28.0-pr)/14.0-abs(d8)*0.7853982*pr, eS = 5.8*(24.5-pr)/10.5-abs(d8s)*0.7853982*pr;
            vec3 field = dark*0.55, mk = (0.86+0.28*v1)*(1.0-0.3*vein)*vec3(1.0);
            vec3 cL = (d8 > 0.0 ? vec3(0.52,0.43,0.30) : vec3(0.30,0.075,0.055))*mk, cS = (d8s > 0.0 ? vec3(0.50,0.41,0.29) : vec3(0.16,0.20,0.17))*mk;
            vec3 star = mix(mix(field, cS, smoothstep(-fa,fa,eS)), cL, smoothstep(-fa,fa,eL));
            star = mix(star, vec3(0.34,0.23,0.08), bnd(20.1,20.6,pr,fa)+bnd(28.6,29.1,pr,fa));
            star = mix(star, vec3(0.30,0.075,0.055)*(0.8+0.4*v1), bnd(29.1,29.8,pr,fa));
            alb = star; } }
        tone = v1;
      } else {                                                               // oak boards in a herringbone
        float w = 2.2; float t = P.x/w; float tri = abs(fract(t*0.5)*2.0-1.0)*w; float c = (P.z+tri)/0.56;
        tone = h11((floor(c)+floor(t)*17.0)*1.37+3.1);
        joint = 1.0-(1.0-lineCov((0.5-abs(fract(c)-0.5))*0.56, 0.02, foot))*(1.0-lineCov((0.5-abs(fract(t)-0.5))*w, 0.012, foot));
        joint = mix(0.08, joint, toMean(foot,0.56)); tone = mix(0.5, tone, toMean(foot,1.1));      // (joints 0.04 m wide every 0.56 m and 0.024 every 2.2 m: mean 0.08)
        alb *= (0.88+0.2*tone)*(1.0-0.5*joint)*(0.85+0.3*vnoise(vec3(P.x*0.8,c*5.0,P.z*0.8)));
      }
      // THE FLAMES IN THE FLOOR: no noise, each a long soft streak toward the eye, wavering a little by the clock. A row of
      // flames (the low candles of a table, of a rank) is summed whole (rowStreak): one unbroken road of light where the eye
      // looks along it, a comb of streaks where it looks across
      vec3 R = vec3(-V.x, max(V.y,0.03), -V.z); float ry = R.y; float nv = 1.0-max(V.y,0.0); nv *= nv;
      float fr = (0.035+0.03*chr+0.05*mar+0.9*nv*nv)*(0.9+0.2*tone)*(1.0-0.5*joint);
      vec2 vp = V.xz/max(length(V.xz),1e-3); float wav = 0.92+0.16*vnoise(vec3(P.xz*0.12, uTime*0.85));
      float low = step(P.y,2.0);
      float lng = 5.0/max(V.y,0.1);                                            // a streak stands about five times taller than wide on the screen
      float t1 = max(4.3-uStub-P.y,0.0)/ry; vec3 H = P+R*t1; float sw = (0.4+0.04*t1)*wav; float st = 0.0;
      for (int i = 0; i < 5; i++) st += rowStreak(H.xz, float(i-2)*11.0, 21.6, uLat, 21.6, 197.6, vp, sw, sw*lng);
      { float cs = H.x > 0.0 ? rowStreak(H.xz, 26.5, -228.8, 3.2, -228.8, -81.6, vp, sw, sw*lng)                                    // the choir's side tables: two more
          : rowStreak(H.xz, -26.5, -228.8, 3.2, -171.2, -81.6, vp, sw, sw*lng);                                                    // rows (the west one dark north of z -172)
        st = (st+cs)*low*uTabI/(1.0+t1*0.025); }
      float t2 = (14.8-P.y)/ry; vec3 H2 = P+R*t2;
      vec2 cc = vec2(clamp(floor(H2.x/11.0+0.5),-2.0,2.0)*11.0, 68.0+32.0*clamp(floor((H2.z-68.0)/32.0+0.5),0.0,4.0));
      float dd = (length(H2.xz-cc-chSw(cc.y).xz)-4.0)/(0.6+0.03*t2); float st2 = exp(-dd*dd)*uChI*1.4/(1.0+t2*0.012);
      vec3 H5 = P+R*((17.8-P.y)/ry); vec2 c5 = vec2(0.0, -92.0-63.0*clamp(floor((-92.0-H5.z)/63.0+0.5),0.0,1.0));
      float dd5 = (length(H5.xz-c5-chSw(c5.y).xz)-4.0)/(0.7+0.03*t2); st2 += exp(-dd5*dd5)*uChI*1.6/(1.0+t2*0.012);
      vec3 H5n = P+R*((21.3-P.y)/ry); float dd5n = (length(H5n.xz-vec2(0.0,-218.0)-uChSway.xz)-4.0)/(0.7+0.03*t2); st2 += exp(-dd5n*dd5n)*uChI*1.6/(1.0+t2*0.012);
      vec3 H3 = P+R*((20.0-P.y)/ry); float d3 = length(H3.xz-vec2(0.0,-30.0)); float st3 = exp(-d3*d3/90.0)*uPyI*0.9*low;
      // candle trees: the avenue of pairs, the ring of twelve, the two at the doorway, four on the dais
      float t4 = (8.4-P.y)/ry; vec3 H4 = P+R*t4; float w4 = (0.45+0.006*t4)*wav, a4l = w4*lng;
      vec2 r4 = H4.xz-vec2(0.0,-30.0); float ac4 = floor(atan(r4.y, r4.x+1e-5)/0.5235988);
      float px4 = H4.x > 0.0 ? 12.5 : -12.5;
      float st4 = streak(H4.xz,vec2(px4,-238.0),vp,w4,a4l) + rowStreak(H4.xz, px4, -62.5, 9.0, -62.5-9.0*(H4.x > 0.0 ? uPairE : 5.0), -62.5, vp, w4, a4l)
        + step(0.0,H4.x)*rowStreak(H4.xz, px4, -210.5, 9.0, -228.5, -210.5, vp, w4, a4l);   // (the west row before the door stands unlit)
      for (int j = -2; j <= 2; j++) { float aj = (ac4+float(j)+0.5)*0.5235988; st4 += streak(r4,24.0*vec2(cos(aj),sin(aj)),vp,w4,a4l); }
      // the orange trees' lanterns (the nearer row on the eye's side: every 9 m, the east rows with their gaps) and the river's cups
      { float xr = abs(H4.x) < 12.5 ? 9.0 : 16.0, sg = H4.x > 0.0 ? 1.0 : -1.0; vec2 gp = xr < 12.0 ? uGapE.xy : uGapE.zw; float wo = w4*0.8;
        float so = sg > 0.0 ? rowStreak(H4.xz, xr, -58.0, 9.0, -58.0-9.0*(gp.x-1.0), -58.0, vp, wo, wo*lng)*step(0.5,gp.x) + rowStreak(H4.xz, xr, -58.0, 9.0, -112.0, -58.0-9.0*(gp.y+1.0), vp, wo, wo*lng)*step(gp.y,5.5)*step(gp.x,50.0)
          : rowStreak(H4.xz, -xr, -58.0, 9.0, -112.0, -58.0, vp, wo, wo*lng);
        st4 += 0.5*(so + (sg > 0.0 ? rowStreak(H4.xz, xr, -206.0, 9.0, -233.0, -206.0, vp, wo, wo*lng) : 0.0));
        float tr = max(0.4-P.y,0.0)/ry; vec3 Hr = P+R*tr; float wr = 0.16*wav, sr = Hr.x > 0.0 ? 1.0 : -1.0;
        st4 += 0.7*uTabI*(rowStreak(Hr.xz, sr*3.1, -58.0, 1.5, sr > 0.0 ? uRivE : -115.0, -58.0, vp, wr, wr*lng) + rowStreak(Hr.xz, sr*5.2, -201.0, 1.5, -237.0, -201.0, vp, wr, wr*lng)); }
      st4 *= low*uTrI*2.4/(1.0+t4*0.008);
      float t7 = max(11.4-P.y,0.0)/ry; vec3 H7 = P+R*t7; float w7 = (0.45+0.006*t7)*wav;
      float s7 = streak(H7.xz,vec2(H7.x > 0.0 ? 17.2 : -17.2,-126.0),vp,w7,w7*lng) + step(0.0,H7.x)*streak(H7.xz,vec2(17.2,-190.0),vp,w7,w7*lng);
      st4 += s7*uTrI*2.4*(0.4*step(-120.5,P.z)*low + 0.6*step(2.5,P.y));
      // the transepts' round tables (the candelabra of the nearest, of the nearest in the next line and of the next in its own line)
      // and the three sconces of the shelved north wall on the eye's side of the door
      float t9 = max(7.7-P.y,0.0)/ry; vec3 H9 = P+R*t9; float w9 = (0.4+0.006*t9)*wav, sx9 = H9.x > 0.0 ? 1.0 : -1.0;
      vec2 q1 = roundAt(H9.xz), q2 = roundAt(vec2(H9.x+(abs(H9.x) > abs(q1.x) ? 8.1 : -8.1)*sx9, H9.z)), q3 = roundAt(vec2(q1.x, q1.y+(H9.z > q1.y ? 9.4 : -9.4)));
      float s9 = streak(H9.xz,q1,vp,w9,w9*lng) + step(0.5,abs(q2.x-q1.x))*streak(H9.xz,q2,vp,w9,w9*lng) + step(0.5,abs(q3.y-q1.y))*streak(H9.xz,q3,vp,w9,w9*lng);
      float t10 = max(16.6-P.y,0.0)/ry; vec3 H10 = P+R*t10; float w10 = (0.4+0.006*t10)*wav, sx10 = H10.x > 0.0 ? 1.0 : -1.0;
      float s10 = streak(H10.xz,vec2(sx10*14.5,-243.8),vp,w10,w10*lng) + streak(H10.xz,vec2(sx10*22.75,-243.8),vp,w10,w10*lng) + streak(H10.xz,vec2(sx10*31.0,-243.8),vp,w10,w10*lng);
      st4 += s9*uTrI*2.0*low*step(30.0,abs(P.x))/(1.0+t9*0.008) + s10*1.5*low*step(P.z,-196.0)/(1.0+t10*0.008);
      // the dais ranks: every low flame, on the dais floor and in the floor before the steps
      float t6 = max(7.3-uStub-P.y,0.0)/ry; vec3 H6 = P+R*t6; float w6 = (0.3+0.005*t6)*wav;
      float st6 = rowStreak(H6.xz, H6.x > 0.0 ? 5.0 : -5.0, -130.0, 3.2, -168.4, -130.0, vp, w6, w6*lng);
      float tsh = P.y > 2.5 ? 0.3+0.7*smoothstep(1.5,3.0,abs(abs(P.x)-5.0)) : 1.0;      // the dais floor lies in shadow close under the ranks' cloths
      st6 *= uTabI*(step(2.5,P.y)*tsh + 0.25*low*step(-120.5,P.z));
      // the massed candles of the dais steps, in the floor round the dais: a row along each flight (clusters 2.5 m apart)
      { float t8 = max(3.2-P.y,0.0)/ry; vec3 H8 = P+R*t8; float w8 = (0.5+0.006*t8)*wav, sg8 = H8.x > 0.0 ? 1.0 : -1.0;
        float s8 = rowStreak(H8.zx, P.z > -158.0 ? -118.5 : -197.5, sg8*4.4, 2.5, sg8 > 0.0 ? 4.4 : -20.6, sg8 > 0.0 ? 20.6 : -4.4, vp.yx, w8, w8*lng)*(P.z > -158.0 || sg8 > 0.0 ? 1.0 : 0.0)
          + rowStreak(H8.xz, sg8*21.4, -119.0, 2.5, sg8 > 0.0 ? -197.0 : -169.0, -119.0, vp, w8, w8*lng);       // (the north-west quarter carries none)
        st4 += s8*uTabI*0.9*low/(1.0+t8*0.01); }
      float shim = 0.84+0.32*vnoise(vec3(P.xz*0.06+vec2(uTime*0.05,uTime*0.11), uTime*0.9));      // the streaks shiver as the flames do, softly: no blotches
      float room = mix(0.85, 1.0, smoothstep(-106.0,-60.0,P.z));                                   // the dim room, mirrored at a grazing eye
      extra = uFlameCol*fr*(st*1.6+st2+st3+(st4+st6*2.4)*shim + uSheen*room*vec3(1.0,0.72,0.5));
      E *= P.y > 0.5 ? (P.y > 2.5 ? 0.5*tsh : 1.5) : mix(1.0, 0.5, chr);    // the choir floor falls to deep umber; the steps and the dais take their candles' pools
      E = E*1.05/(1.0+0.22*E);
      amb = mar > 0.5 ? 1.7 : mix(3.6, 2.8, chr);
      spec = 0.5;
    } else if (kind < 4.5) {                                               // LINEN: a table's cloth (3); a tier of the pyramid (4: walnut, gilt, mirror, and a strip of the same linen)
      // THE LINEN'S RANGE: the tops ivory, nearly white under each flame (linLit 1); the hanging cloth cooler and darker, in
      // real pleats (phi: 0 in a valley, 1 on a ridge, the same smooth law the geometry was built by), with a soft shadow
      // in each fold, under the table's edge and at the hem, an embroidered gold band above the hem, a lace edge where
      // the top overhangs. THE RANKS' hanging cloth is a crimson and old-gold brocade under a short white linen cloth
      float top = step(0.5,N.y); float pool, yT, yH, phi, hco, edgeIn, sideL, rankK = 0.0, roundK = 0.0; vec2 dp = P.xz;
      if (kind < 3.5) {
        float isRound = step(abs(vS.w-vS.z), 0.01), isRank = step(abs(vS.y),8.0)*step(P.z,-100.0);   // a round table (one place); the dais ranks (tops at y 6)
        float lat = vS.z < 0.0 ? 3.2 : uLat, hw = isRank > 0.5 ? 1.5 : 2.4; rankK = isRank; roundK = isRound;
        vec2 rr = P.xz-vec2(vS.y,vS.z); float ra = atan(rr.y, rr.x+1e-5), rx = abs(P.x-vS.y);
        yT = isRank > 0.5 ? 6.0 : 3.0; yH = isRound > 0.5 ? 0.04 : yT-2.4;
        pool = top*latticePool(P,N,vS.y,vS.z,vS.w,P.y+1.3-uStub,lat,Ld);
        if (isRound > 0.5) pool = top*(0.42+0.7*exp(-dot(rr,rr)*0.1))*breath(vec3(vS.y,7.0,vS.z),uTime);   // its candelabrum stands high: the pool is broad, ivory-white to the edge in every look
        if (vS.y < -25.0 && vS.z < -100.0) pool *= 1.0-step(P.z,-172.8);                       // THE DARK END: the west side table's unlit stretch
        hco = isRound > 0.5 ? ra*3.3 : (abs(N.x) > 0.5 ? P.z : P.x);
        phi = isRound > 0.5 ? 0.5+0.5*cos(12.0*ra) : 0.5-0.5*cos(6.2831853*hco/(isRank > 0.5 ? 0.8 : 1.6));
        edgeIn = isRound > 0.5 ? 3.2-length(rr) : hw-rx;
        float run = top*(1.0-smoothstep(0.74,0.78,rx))*(1.0-isRound); damK = 1.0-isRound;
        float weave = 0.8+0.2*sin(P.z*31.0)*sin(P.x*31.0)*toMean(foot,0.2);       // (its mean: 0.8)
        vec3 runC = uRunCol*weave;
        if (isRound < 0.5) {
          // THE RUNNER of every long table and of the ranks, on every visit: 1.5 m wide, in the visit's runner colour (old gold
          // on a visit whose dealt runner is none), embroidered in the other (crimson on gold, gold on crimson): a six-petalled flower every 0.8 m, a waving stem either
          // side of it and a border line; the embroidery goes to its mean (0.180) under a wide pixel
          float zl = (fract(P.z/0.8)-0.5)*0.8, fl2 = length(vec2(rx, zl)), ft = atan(zl, rx+1e-5), f2 = clamp(foot,0.003,0.2);
          float fig = figCov(fl2-0.2*(0.62+0.38*cos(6.0*ft)), f2, 0.0574)*(0.5+0.5*smoothstep(0.04,0.08,fl2))
            + lineCov(abs(rx-0.46-0.07*sin(P.z*7.854)), 0.022, foot) + lineCov(abs(rx-0.66), 0.03, foot) + lineCov(abs(rx-0.86), 0.03, foot);     // (the border line and the same line mirrored in the runner's edge, 0.76: what its soft edge throws past the edge comes back)
          runC = mix(uRunCol*weave*0.8, uRunCol.g > 0.2 ? vec3(0.34,0.05,0.06) : vec3(0.66,0.47,0.15), mix(0.180, min(fig,1.0), toMean(foot,0.8))); }
        alb = mix(alb, runC, run); spec = run*0.9;
        { float zl2 = P.z-vS.z-3.2*floor((P.z-vS.z)/3.2+0.5), on2 = top*(1.0-isRound)*step(vS.z-1.7,P.z)*step(P.z,vS.w+1.7);
          // (a soft shadow under every low candle's foot and, midway between each two, under the dish that stands there)
          alb *= 1.0-on2*(0.26*exp(-max(length(vec2(rx, abs(zl2)-1.6))-0.42,0.0)/0.22)+0.3*exp(-max(length(vec2(rx, zl2))-0.2,0.0)/0.12)); }
        float sz = (fract(P.z/4.8+0.5)-0.5)*4.8, sx = abs(rx-1.5);                  // creases where the cloth was folded
        alb *= 1.0+top*(1.0-run)*(1.0-isRound)*(0.10*exp(-(sz-0.03)*(sz-0.03)*900.0)-0.14*exp(-(sz+0.03)*(sz+0.03)*900.0)-0.10*exp(-sx*sx*700.0));
        // A LAID TABLE: at every chair (every 3.2 m; both sides of a long table, the outer side of a rank) a gilt plate, a
        // silver knife and fork 0.6 m long laid either side of it, and a folded napkin in a gilt ring, each with its soft
        // contact shadow; edges as wide as a pixel's footprint
        { float zc = vS.z+3.2*floor((P.z-vS.z)/3.2+0.5); float on = top*(1.0-isRound)*step(vS.z-0.1,zc)*step(zc,vS.w+0.1);
          if (isRank > 0.5) on *= step(0.0,(P.x-vS.y)*vS.y);
          float rp = isRank > 0.5 ? 0.36 : 0.42; vec2 q = vec2(rx-(isRank > 0.5 ? 1.05 : 1.55), P.z-zc); float ql = length(q), fa = clamp(foot,0.004,0.2);
          float disc = figCov(ql-rp, fa, 3.1416*rp*rp);
          float rim = lineCov(abs(ql-rp*0.9),rp*0.085,foot), well = lineCov(abs(ql-rp*0.6),0.012,foot);
          vec2 nq = abs(q)-vec2(0.105,0.25); float nap = figCov(max(nq.x,nq.y), fa, 0.0825);       // (a box's soft edge adds 0.8 fa fa: its area 0.105 is given as 0.105 pi/4)
          float ring = nap*lineCov(abs(q.y),0.035,foot), creaseN = nap*lineCov(abs(abs(q.x)-0.035),0.006,foot);
          float shd = on*(1.0-disc)*0.34*exp(-max(ql-rp,0.0)/0.07);
          vec3 plate = mix(vec3(0.60,0.43,0.14)*(1.0-0.3*well), vec3(0.78,0.58,0.2), rim);
          plate = mix(plate*(1.0-0.25*exp(-max(max(nq.x,nq.y),0.0)/0.03)), vec3(0.80,0.78,0.72)*(1.0-0.3*creaseN), nap);       // (the napkin's own shadow on the plate)
          plate = mix(plate, vec3(0.62,0.44,0.13), ring);
          alb = mix(alb*(1.0-shd), plate, on*disc); spec = max(spec, on*disc*(rim*1.4+ring*1.2+0.8)*(1.0-nap*(1.0-ring)));
          float kn = on*lineCov(abs(abs(q.y)-0.52),0.02,foot)*(1.0-smoothstep(0.28,0.32,abs(q.x)));
          alb = mix(alb, vec3(0.70,0.71,0.74), kn); spec = max(spec, kn*1.3); }
        if (isRound > 0.5) {                                                 // a round table's eight places (the first 22.5 degrees round from +x): a gilt plate before each chair, 2.6 m out
          float ak = (floor(ra/0.7853982)+0.5)*0.7853982, rl6 = length(rr); vec2 q = vec2(rl6*cos(ra-ak)-2.6, rl6*sin(ra-ak)); float ql = length(q), fa = clamp(foot,0.004,0.2);
          float disc = top*figCov(ql-0.42, fa, 0.554), rim = lineCov(abs(ql-0.378),0.036,foot), well = lineCov(abs(ql-0.252),0.012,foot);
          alb = mix(alb*(1.0-top*(1.0-disc)*0.34*exp(-max(ql-0.42,0.0)/0.07)), mix(vec3(0.60,0.43,0.14)*(1.0-0.3*well), vec3(0.78,0.58,0.2), rim), disc); spec = max(spec, disc*(rim*1.4+0.8)); }
        float isR = isRank;
        sideL = mix(0.1+0.9*smoothstep(yT-2.4,yT,P.y), 0.4+0.6*smoothstep(yT-2.4,yT,P.y), isR)*(0.62+0.38*cos((P.z-vS.z)/lat*6.2831853))*uTabI*(isR > 0.5 ? 0.95 : 0.36);   // (a rank's cloth keeps its candles' warmth to the hem)
        // (a rank's cloth stays its candles' warm ivory in every look: the look's cool light catches only a thin rim of it, the
        // top 0.07 m of the hanging cloth and the outer 0.07 m of the top, and it gives the hall's underlight back warm)
        if (isRank > 0.5) { fillK = 0.05+0.95*mix(smoothstep(yT-0.09,yT-0.02,P.y), smoothstep(hw-0.07,hw-0.01,rx), top); ambT = vec3(1.16,1.0,0.74); }
        if (isRound > 0.5) sideL = (0.95+0.75*smoothstep(0.0,3.0,P.y))*uTabI*0.5;     // a round table's skirt hangs in its own candelabrum's light to the floor
        float pl2 = pool*uPool; if (isRank > 0.5) pl2 = 1.25*pl2/(1.0+1.1*pl2); if (isRound > 0.5) pl2 = 1.2*pl2/(1.0+0.7*pl2);     // (the ranks are passed at arm's length: their tops stay a warm ivory under the flames, never a clipped white)
        E = (E*uBase*mix(1.0,0.6,top) + pl2)*mix(1.0, 0.62, isRank*top) + (1.0-top)*sideL;
      } else {
        vec2 r = P.xz-vec2(0.0,-30.0); float rl = length(r), ang = atan(r.y, r.x+1e-5);
        float fp = max(dot(r/max(rl,1e-3), uTierDir.xz/max(length(uTierDir.xz),1e-3)), 0.0); fw = mix(fw, 0.8*fp*fp, top);    // the tier tops of the cool flank take a wash of it
        float nB = floor(vS.z+0.25);                                        // (the ring's candles; a fraction of one half says that its first candle is a tall one)
        pool = tierPool(P,N,vS.y,nB,vS.w+1.3-uStub,Ld);
        // a tier's own radius and top, from what it carries (a tread carries its own ring; a riser the ring of the tier below
        // and the height 1.8 m under its own top)
        float rT = top > 0.5 ? vS.y+0.5 : (vS.y > 0.5 ? vS.y-1.4 : 20.0);
        yT = top > 0.5 ? P.y : vS.w+1.8; yH = vS.w;
        phi = 0.5; hco = ang*rT;
        edgeIn = rT-rl;
        float under = 0.5+0.5*smoothstep(0.2,1.0,rl-(rT-1.9));               // the top lies in soft shadow close under the tier above
        float vy0 = clamp((P.y-vS.w)/1.8, 0.0, 1.0); float has = step(0.5,nB);
        float ringv = mix(0.8, 0.74+0.26*cos(ang*nB), has);
        float soft = uPool*mix(0.26, 0.34, has)*ringv*(0.5+0.5*exp(-(vy0-0.55)*(vy0-0.55)*5.0))*(1.0+0.07*sin(uTime*2.1+r.x*0.9+r.y*0.7+P.y));
        float cool = fw*min(uTierFill*0.2,1.0); soft *= 1.0-0.6*cool; pool *= (1.0-0.35*cool)*mix(1.0,under,top);
        E = E*uBase*0.55*mix(1.0,under,top) + mix(soft + 0.12*pool*uPool, pool*uPool, top);
        // THE PYRAMID IS A TIERED BUFFET of dark polished walnut. A TREAD: walnut, and under the ring of glasses a strip of
        // ivory damask 0.72 m wide with its lace edges (the linen's own law below). A RISER, 1.8 m high under the gilt
        // rim (hh = height over its foot): a base rail of walnut to 0.14; plates of old mirror from 0.14 to 1.30, each
        // in a gilt fillet 0.035 m wide, between walnut stiles 0.26 m wide that stand midway between the candles of the
        // ring before it; a walnut rail; from 1.40 to 1.70 a gilt band carved with the vine in relief between two beads.
        // The lowest tier stands on a plinth of walnut 1.2 m high (hh under 0) in sunk panels.
        vec3 walnut = vec3(0.20,0.105,0.055)*(0.6+0.8*vnoise(vec3(ang*rl*(top > 0.5 ? 0.8 : 7.0), top > 0.5 ? rl*9.0 : P.y*0.9, 3.0)));
        float fa0 = clamp(foot,0.004,0.12);
        if (top > 0.5) { float sd = abs(rl-(rT-0.5))-0.36; tierMix = smoothstep(-fa0,fa0,sd); edgeIn = -sd; tierPaint = vec4(walnut, 1.6); damK = 1.0; }
        else {
          float hh = P.y-vS.w, stl = 6.2831853/max(nB > 0.5 ? nB : floor(rl/1.035+0.5), 1.0), su = abs(fract(ang/stl)-0.5)*stl*rl;
          float pe = min(su-0.13, min(hh-0.14, 1.30-hh));
          float plate = smoothstep(-fa0,fa0,pe), mirK = smoothstep(-fa0,fa0,pe-0.035);
          float bandK = smoothstep(-fa0,fa0,hh-1.40), bead = lineCov(abs(hh-1.42),0.02,foot)+lineCov(abs(hh-1.68),0.02,foot)+lineCov(abs(hh),0.025,foot);
          vec3 Lq = normalize(Ld); vec2 vl = vineLit(vec2(ang*rl, hh-1.55)/0.42, vec2(dot(Lq.xz, vec2(-sin(ang),cos(ang))), Lq.y));
          vec3 gilt = vec3(0.50,0.36,0.13)*mix(1.0, clamp(1.0 + mix(-0.133, 0.5*vl.x - 1.6*vl.y - 0.22, toMean(foot,0.3)), 0.35, 1.8), bandK*(1.0-min(bead,1.0)));     // (the relief's mean between the beads: -0.133)
          float gk = max(max(bandK, min(bead,1.0)), plate-mirK);
          float groove = mix(0.0667+0.0133/(stl*rl), lineCov(abs(min(su-0.34, min(-0.16-hh, hh+1.04))),0.02,foot), toMean(foot,stl*rl))*step(hh,0.0);     // (a sunk panel's outline; under a pixel as wide as a panel, its mean cover of the plinth)
          tierPaint = vec4(mix(walnut*(1.0-0.55*groove), gilt, gk), mix(1.3, 3.2, gk)); tierMix = 1.0;
          // THE OLD MIRROR gives back what stands before it, painted by the law of a mirror: the sight line is turned on the
          // drum's own round and followed out to the ring of the tier before it: there each candle's flame (its glow, and
          // its wax below it), each glass's wine in the visit's own colour (uWineC), and, where the line comes down on the tread, the ivory of the
          // strip; the silvering is foxed in blotches and gives back half. Under a wide pixel the plate shows its mean
          vec3 Nc = vec3(r.x,0.0,r.y)/max(rl,1e-3), Rm = reflect(-V,Nc); vec2 dm = Rm.xz; float aa = max(dot(dm,dm),1e-4), bb = dot(r,dm), cc = rl*rl-vS.y*vS.y;
          float tt = (-bb+sqrt(max(bb*bb-aa*cc,0.0)))/aa; vec3 H = vec3(r.x,P.y,r.y)+Rm*tt; float ha = atan(H.z, H.x+1e-5);
          float ci = floor(ha/stl+0.5), tall = mod(ci+step(0.25,fract(vS.z))+64.0, 2.0), du = (ha-ci*stl)*vS.y, hy = H.y-vS.w, dy = hy-(1.18-uStub+0.6*tall);
          float flm = 2.2*exp(-du*du/0.012-dy*dy/0.05) + 0.3*exp(-(du*du+dy*dy)/0.5);
          float wax = exp(-du*du/0.008)*step(0.5+0.6*tall,hy)*step(dy,-0.16)*0.4;
          float sg = stl/max(floor(stl*vS.y/0.85+0.5),1.0), dg = (fract(ha/sg)-0.5)*sg*vS.y;
          float ruby = exp(-dg*dg/0.02)*smoothstep(0.36,0.46,hy)*(1.0-smoothstep(0.64,0.74,hy));
          float tp = (vS.w-P.y)/min(Rm.y,-1e-3), strip = step(hy,0.0)*step(abs(length(r+dm*tp)-vS.y),0.36);
          vec3 img = (vec3(1.0,0.70,0.36)*flm + vec3(1.0,0.88,0.66)*wax + uWineC*1.3*ruby + vec3(0.5,0.42,0.3)*strip)*has*uPyI
            + vec3(0.05,0.035,0.022)*(1.0+smoothstep(-0.2,0.6,Rm.y));
          float fox = vnoise(vec3(ang*rl*1.7, P.y*1.7, 5.0)), fox2 = vnoise(vec3(ang*rl*9.0, P.y*9.0, 9.0));
          img *= (0.34+0.3*fox)*(0.7+0.3*smoothstep(0.25,0.5,fox2+0.5*smoothstep(0.0,0.3,pe)));
          tierImg = mirK*mix(vec3(0.085,0.058,0.034)*(0.4+0.6*has*uPyI), img, toMean(foot,0.3));
          tierPaint = vec4(mix(tierPaint.rgb, vec3(0.03,0.028,0.025), mirK), mix(tierPaint.a, 0.0, mirK));
        }
      }
      linLit = top*smoothstep(0.1,1.0,pool*uPool); alb *= mix(vec3(1.0), rankK > 0.5 ? vec3(1.04,1.04,1.02) : (damK > 0.5 ? vec3(1.08,1.09,1.10) : vec3(1.10,1.16,1.30)), linLit);
      if (rankK > 0.5) alb *= vec3(1.0,0.94,0.82);                             // (the ranks' cloth is ivory;
      else if (damK > 0.5) alb *= vec3(1.0,0.965,0.89);                       // the long tables' a paler ivory)
      linWarm = mix(mix(rankK > 0.5 ? vec3(1.0,0.86,0.66) : vec3(0.80,0.72,0.64), vec3(1.0,0.80,0.56), top), rankK > 0.5 ? vec3(1.0,0.90,0.72) : vec3(1.0,0.95,0.87), linLit);     // the light the linen gives back: a cool hw shadow on the hanging cloth, warm ivory on the top, nearly white under a flame
      // the top: a fine woven damask (leaves in a diaper 0.25 m apart) and, on the outer 0.24 m, a lace edge: a row of eyelets,
      // a row of smaller ones, a scalloped line. Each crisp near and at its own mean where a pixel is wider than it
      { float dmk = diaper(dp, foot);
        float c1 = (fract(hco/0.16)-0.5)*0.16, c2 = (fract(hco/0.16+0.5)-0.5)*0.16, fa = clamp(foot,0.003,0.05);
        float holes = figCov(length(vec2(c1,edgeIn-0.09))-0.034, fa, 0.00363) + figCov(length(vec2(c2,edgeIn-0.18))-0.018, min(fa,0.027), 0.00102)
          + lineCov(abs(edgeIn-0.215-0.018*cos(hco*39.27)),0.006,foot);
        float lc = mix(0.17*(1.0-smoothstep(0.24-fa,0.24+fa,edgeIn)), min(holes,1.0), toMean(foot,0.16));       // (the lace lies within the outer 0.24 m; its mean, 0.17 of that strip, is laid on the strip's true width)
        float dm2 = mix(0.34, damask(dp*2.4), toMean(foot,0.9));                  // the damask of the ranks and of every long table: a larger woven figure over the diaper
        alb *= mix(1.0, (1.0+0.07*(dmk-0.31)+max(rankK*0.42, damK*0.34)*(dm2-0.34))*(1.0-0.36*lc), top); }
      // the hanging cloth
      { float vy = clamp((yT-P.y)/max(yT-yH,0.1), 0.0, 1.0), hh = P.y-yH;
        float dk = rankK > 0.5 ? 0.45+0.9*h11(floor(hco/0.8)) : 1.0;              // (a rank's pleats are of unequal depth, each its own: the geometry's law)
        float ridge = mix(1.0, mix(1.0-0.6*min(dk,1.1),1.0+0.14*dk,phi), smoothstep(0.02,0.3,vy));      // a soft shadow in each fold
        float shd = (0.7+0.3*smoothstep(0.0,0.18,yT-P.y))*(0.6+0.4*smoothstep(0.0,0.4,hh));
        float bl = lineCov(abs(hh-0.32),0.014,foot)+lineCov(abs(hh-0.60),0.014,foot)+lineCov(abs(hh-0.46-0.075*sin(hco*15.708))*0.7,0.014,foot);
        vec2 bq = vec2((fract(hco/0.2)-0.5)*0.2, hh-0.46+0.05*sign(sin(hco*15.708))); float bf = clamp(foot*0.5,0.003,0.03);
        bl += figCov(length(bq)-0.022, bf, 0.00152);
        float bm = smoothstep(0.29-0.5*foot,0.30+0.5*foot,hh)-smoothstep(0.62-0.5*foot,0.63+0.5*foot,hh);       // (the band's extent, 0.295 to 0.625: each soft edge centred on its true edge)
        float bandC = mix(0.314*bm, min(bl,1.0), toMean(foot,0.4));                // (the lines and dots lie within the band; their mean, 0.314 of it, is laid on its true extent)
        float sdm = 1.0+0.05*(diaper(vec2(hco,P.y), foot)-0.31);
        vec3 sideA = alb*ridge*shd*sdm;
        if (rankK > 0.5) {
          // A RANK'S HANGING CLOTH: a brocade of deep crimson figured in old gold (a repeat 3 m wide: a pomegranate and a
          // rose of eight petals by turns, each in a pointed oval; its mean far off), its border a band 0.56 m high above
          // the hem embroidered in gold (a vine between two lines), a gold fringe 0.12 m long at the hem. Over it, from the table's edge, the white linen top cloth hangs
          // 0.42 to 0.5 m down: its edge in scallops 0.4 m wide, a row of eyelets and a line along it, its shadow on the brocade
          float dn = yT-P.y, sc = 0.42+0.08*sqrt(max(1.0-(fract(hco/0.4)*2.0-1.0)*(fract(hco/0.4)*2.0-1.0), 0.0)), fa = clamp(foot,0.003,0.05);
          float lin = 1.0-smoothstep(sc-fa, sc+fa, dn);
          float fg = mix(0.209, brocade(vec2(hco, P.y), foot), toMean(foot,1.5)), th = 0.85+0.3*sin(P.y*190.0)*toMean(foot,0.03);
          vec3 broc = mix(vec3(0.15,0.015,0.024), vec3(0.62,0.43,0.14)*th, fg)*ridge*shd;
          float vn = vineH(vec2(hco, hh-0.4)/0.5); bm = smoothstep(0.12,0.13,hh)*(1.0-smoothstep(0.68-0.5*foot,0.69+0.5*foot,hh));
          bandC = bm*mix(0.286, max(smoothstep(0.25,0.4,vn), min(lineCov(abs(abs(hh-0.4)-0.25),0.02,foot)+lineCov(abs(hh-0.10),0.02,foot)+lineCov(abs(hh-0.72),0.02,foot), 1.0)), toMean(foot,0.6));      // (the band's mean: 0.286. Its upper edge is soft about its true height, 0.685; its lower edge, under the fringe, stays; each line with the same line mirrored in the band's nearer edge)
          broc = mix(broc, mix(vec3(0.34,0.035,0.045), vec3(0.72,0.50,0.15), bandC/max(bm,1e-3))*(0.55+0.6*phi)*shd, bm);
          float fr = 1.0-smoothstep(0.11,0.13,hh), thr = mix(0.773, 0.35+0.65*smoothstep(0.2,0.5,abs(fract(hco/0.035)-0.5)*2.0), toMean(foot,0.035));       // (the threads' mean: 0.773)
          broc = mix(broc, vec3(0.66,0.47,0.14)*thr*(0.6+0.5*phi)*(0.5+0.5*smoothstep(0.0,0.12,hh)), fr);
          broc *= 1.0-0.5*(1.0-lin)*(1.0-smoothstep(0.0,0.07,dn-sc));
          float c1 = (fract(hco/0.1)-0.5)*0.1, eye = figCov(length(vec2(c1, dn-sc+0.09))-0.02, min(fa,0.03), 0.00126);
          float lace = mix(0.0923, min(eye+lineCov(abs(dn-sc+0.16),0.008,foot)+lineCov(abs(dn-sc+0.025),0.008,foot)+lineCov(abs(dn-sc-0.025),0.008,foot),1.0), toMean(foot,0.1));     // (the lace's mean over the hanging linen: 0.0923; its hem line with the same line mirrored in the linen's edge)
          sideA = mix(broc, sideA*(1.0-0.3*lace)*1.06, lin);
          spec = mix(spec, mix(0.25+0.7*max(fg, bandC), 0.0, lin), 1.0-top);
        } else if (roundK > 0.5) {
          // A ROUND TABLE'S HANGING CLOTH: a damask to the floor in the table's own dye (deep crimson, old gold or dark
          // green by turns: the cloth's own colour), its woven figure a tone lighter (1.1 m to a repeat; its mean far
          // off), the gold band above the hem; over it, from the table's edge, the white top cloth hangs 0.5 to 0.62 m
          // down, its edge in lace: scallops 0.42 m wide, a row of eyelets and two lines along it, its shadow on the damask
          float dn = yT-P.y, sc = 0.5+0.12*sqrt(max(1.0-(fract(hco/0.42)*2.0-1.0)*(fract(hco/0.42)*2.0-1.0), 0.0)), fa = clamp(foot,0.003,0.05);
          float lin = 1.0-smoothstep(sc-fa, sc+fa, dn);
          float dmf = mix(0.339, damask(vec2(hco, P.y)*1.6), toMean(foot,0.9));
          vec3 dyed = sideA*(0.72+0.95*dmf);
          dyed = mix(dyed, vec3(0.60,0.42,0.12)*(0.55+0.6*phi)*shd, bandC*0.92);
          dyed *= 1.0-0.5*(1.0-lin)*(1.0-smoothstep(0.0,0.09,dn-sc));
          float c1 = (fract(hco/0.105)-0.5)*0.105, eye = figCov(length(vec2(c1, dn-sc+0.1))-0.022, min(fa,0.03), 0.00152);
          float lace = mix(0.0849, min(eye+lineCov(abs(dn-sc+0.18),0.009,foot)+lineCov(abs(dn-sc+0.03),0.009,foot)+lineCov(abs(dn-sc-0.03),0.009,foot),1.0), toMean(foot,0.1));     // (the lace's mean over the hanging linen: 0.0849; its hem line with the same line mirrored in the linen's edge)
          sideA = mix(dyed, vec3(0.81,0.78,0.73)*ridge*shd*sdm*(1.0-0.3*lace)*1.06, lin);
          spec = mix(spec, mix(0.2+0.5*max(dmf-0.3, bandC), 0.0, lin), 1.0-top);
        } else {
          sideA = mix(sideA, vec3(0.60,0.42,0.12)*(0.55+0.6*phi)*shd, bandC*0.92);
          spec = mix(spec, bandC*0.5, 1.0-top); }
        alb = mix(sideA, alb, top); }
      if (kind > 3.5) { alb = mix(alb, tierPaint.rgb, tierMix); spec = mix(spec, tierPaint.a, tierMix); if (tierMix > 0.5) linLit = -1.0; }
      // where a moon bar crosses a rank the glasses throw pale stars on the cloth
      vec2 sg = vec2((P.x-vS.y)/0.8, (P.z-20.8)/1.6); vec2 sf = fract(sg+uMoonDir.xz*-0.6)-0.5;
      extra = uMoonCol*bar*top*step(kind,3.5)*exp(-dot(sf,sf)*38.0)*1.2 + tierImg;
    } else if (kind < 5.5) { spec = 1.0+2.5*vS.y; amb = 0.5;                // gilt, silver, iron
      if (vS.z > 2.5) {
        // AN ARCH OF THE PORCH (surf.z = 3; surf.w = its opening's half width: 8.3, 7.3 or 6.3 m; its head springs at
        // y 10, 8.6 or 7.2; its band 0.9 or 1.2 m wide and 1.5 m deep). dn: metres out from the opening's edge;
        // along: metres along the band from its east springing. ITS FACE: a roll at each edge, a groove inside each
        // roll, and between them the vine carved in relief, lit from where the candles stand. ITS SOFFIT: lined in
        // deep blue with small gilt stars (as the niches are; they go to their mean under a wide pixel), a gilt line
        // 0.15 m in from each edge; it takes the candles' light and, toward the back, the portal's pale blue
        float ar = vS.w, ay = 10.0-1.4*(8.3-ar), aw = ar > 8.0 ? 0.9 : 1.2; bool head = P.y > ay;
        float rr = head ? length(vec2(P.x, P.y-ay)) : abs(P.x), dn = rr-ar, Rm = ar+0.5*aw;
        float along = head ? atan(P.y-ay, P.x)*Rm : (P.x > 0.0 ? P.y-ay : 3.14159*Rm+ay-P.y);
        if (N.z > 0.5) {
          vec2 outw = head ? vec2(P.x, P.y-ay)/max(rr,1e-3) : vec2(P.x > 0.0 ? 1.0 : -1.0, 0.0), tang = vec2(-outw.y, outw.x);
          vec3 Lq = normalize(Ld); vec2 vl = vineLit(vec2(along, dn-0.5*aw)/0.9, vec2(dot(Lq.xy,tang), dot(Lq.xy,outw)));
          float groove = mix(0.12/aw, min(lineCov(abs(dn-0.16),0.03,foot)+lineCov(abs(dn+0.16),0.03,foot)+lineCov(abs(dn-aw+0.16),0.03,foot)+lineCov(abs(dn-aw-0.16),0.03,foot), 1.0), toMean(foot,aw));     // (each groove and the same groove mirrored in the band's nearer edge; under a pixel as wide as the band, their mean cover of it)
          float roll = max(1.0-smoothstep(0.10,0.13,dn), smoothstep(aw-0.13,aw-0.10,dn));
          alb *= clamp(1.0 + mix(ar > 8.0 ? -0.152 : -0.173, 0.5*vl.x - 1.6*vl.y - 0.22, toMean(foot,0.3))*(1.0-roll), 0.35, 1.8)*(1.0+0.22*roll)*(1.0-0.65*groove);    // (the relief's mean between the rolls: -0.152 on a band 0.9 m wide, -0.173 on one 1.2 m wide)
        } else if (abs(N.z) < 0.5 && dn < 0.05) {
          float fa = clamp(foot, 0.004, 0.2), ze = fract((P.z+245.45)/1.5)*1.5; vec3 gold = alb;
          vec2 gc = fract(vec2(along+P.z, along-P.z)/0.78)-0.5; float gl = length(gc)*0.78, th = atan(gc.y, gc.x+1e-5);
          float star = figCov(gl-0.11*(0.55+0.45*cos(5.0*th)), min(fa,0.085), 0.0153);
          alb = vec3(0.022,0.04,0.12)*(0.85+0.3*vnoise(vec3(along*1.3, P.z*1.3, 5.0)));
          alb = mix(alb, gold, mix(0.0252, star, toMean(foot,0.55)));
          float zq = ze-1.5*step(0.75,ze); alb = mix(alb, gold, mix(0.08, min(lineCov(abs(zq-0.15),0.03,foot)+lineCov(abs(zq+0.15),0.03,foot), 1.0), toMean(foot,1.5)));     // (each line and the same line mirrored in the soffit's nearer edge; under a pixel as wide as the soffit, their mean cover of it, 0.08)
          spec = 0.4; extra = alb*(uFlameCol*uTabI*1.2 + vec3(0.56,0.77,1.0)*(1.0-smoothstep(-250.0,-245.4,P.z))); }
      } else if (vS.z > 1.5) {                                                    // surf.z = 2: a carved band (the cornice at the wall head, a riser of the dais steps): the vine
        if (abs(N.y) < 0.5) {                                              // frieze in relief on its upright face, 0.9 m to a wave; surf.w = the band's middle height
          vec3 Lq = normalize(Ld); bool az = abs(N.x) > abs(N.z); vec2 vl = vineLit(vec2(az ? P.z : P.x, P.y-vS.w)/0.9, vec2(az ? Lq.z : Lq.x, Lq.y));
          alb *= clamp(1.0 + mix(-0.166, 0.5*vl.x - 1.6*vl.y - 0.22, toMean(foot,0.3)), 0.35, 1.8); }     // (the relief's mean over the face: -0.165 on the cornice, -0.167 on a riser; the typed -0.166 stands between the two)
      } else if (vS.z > 0.5 && N.z > 0.5) {                                // surf.z = 1: the doorway's pelmet board, a vine frieze carved in relief on its face
        vec3 Lq = normalize(Ld); vec2 vl = vineLit(vec2(P.x, P.y-24.2)/1.6, Lq.xy);
        alb *= clamp(1.0 + mix(-0.176, 0.5*vl.x - 1.6*vl.y - 0.22, toMean(foot,0.4)), 0.35, 1.8); }       // (the relief's mean over the board's face: -0.176)
    } else {                                                               // plain: wax (surf.y = its glow), cloth, leaf
      extra = vC*uFlameCol*vS.y*0.9;                                        // (glowing wax glows as it glows, at every distance)
      if (vS.z < -1.5) {
        // A NICHE of the north wall (surf.z = -2; surf.w = its middle along the wall; 3 m wide, from y 1.2 to a round head
        // at y 9.4): lined in deep blue with small gilt five-pointed stars on a diaper 0.55 m apart (they go to their mean
        // under a wide pixel) and a gilt line 0.14 m inside its edge. It is painted as a hollow: darker toward its sides
        // and its head, and warm low down where the candles of its sill and its stand light it
        float nu = (P.x-vS.w)/1.5, hy = max(P.y-7.9, 0.0), pe = 1.5-length(vec2(P.x-vS.w, hy)), fa = clamp(foot, 0.004, 0.2);
        vec2 gc = fract(vec2(P.x+P.y, P.x-P.y)/0.78)-0.5; float gl = length(gc)*0.78, th = atan(gc.y, gc.x+1e-5);
        float star = figCov(gl-0.11*(0.55+0.45*cos(5.0*th)), min(fa,0.085), 0.0153);
        float hollow = sqrt(max(1.0-nu*nu, 0.0))*(1.0-0.45*smoothstep(7.0,9.4,P.y));
        alb = vec3(0.022,0.04,0.12)*(0.85+0.3*vnoise(vec3(P.x*1.3, P.y*1.3, 5.0)));
        alb = mix(alb, vec3(0.62,0.43,0.13), mix(0.0252, star, toMean(foot,0.55)));
        alb = mix(alb, vec3(0.62,0.43,0.13), lineCov(abs(pe-0.14),0.03,foot));
        alb *= 0.35+0.65*hollow; spec = 0.4; amb = 0.5;
        extra = alb*uFlameCol*uTabI*1.6*exp(-(P.y-3.6)*(P.y-3.6)/9.0)*hollow;
      } else if (vS.z < -0.5) {
        // PILLAR WAX (surf.z = -1; surf.w = how far this place lies below the candle's top, in metres; surf.y = its glow): warm
        // and translucent. The flame shines down into it: the glow is whole at the top and gone 0.4 m down; a darker melted
        // rim round the top's edge; runs of wax down the side, each from the rim to its own length (0.1 to 0.6 m), a
        // little paler than the wax with a shadow beside it. The runs go to their mean under a wide pixel
        float dw = vS.w, sharp = toMean(foot,0.03);
        float st = vnoise(vec3(P.x*42.0, 3.7, P.z*42.0)), ln = 0.1+0.5*vnoise(vec3(P.x*42.0+11.0, 9.1, P.z*42.0));
        float run = smoothstep(0.56,0.66,st)*(1.0-smoothstep(ln-0.04,ln,dw));
        float edge = smoothstep(0.46,0.56,st)*(1.0-smoothstep(0.56,0.66,st))*(1.0-smoothstep(ln-0.04,ln,dw));
        alb *= 1.0 + sharp*(0.22*run - 0.25*edge);
        alb *= 1.0-0.42*(1.0-smoothstep(0.0,0.035,dw))*step(0.004,dw);
        extra *= (0.12+0.88*exp(-dw*dw/0.05))*(1.0+0.3*mix(0.29*(1.0-smoothstep(0.12,0.55,dw)), run, sharp));      // (the runs' mean at this depth: 0.29 at the top, none 0.55 m down)
        alb = mix(alb, alb*vec3(1.0,0.8,0.56), 0.5*exp(-dw/0.25)); spec = 0.35; amb = 0.6;
      } else if (vS.z > 11.5) {
        // A LEAF MASS (an orange tree's head, an urn's flowers, the north arch's swag, the pyramid's garlands): a dark lumpy
        // core (surf.z = 12) under many small cards, each cut to its own outline (surf.y, surf.w: the card's own
        // coordinates, -1 to 1): 13 a spray of five pointed leaves with their midribs, 14 a round fruit, 15 a cluster of
        // four small five-petalled blossoms, 16 a full rose. The fraction of surf.z (over 0.9) is how much the mass's
        // own lanterns light this part from within. The normal a card carries is the mass's own round, so the whole is
        // lit as one body: warm on the side where candles stand, deep green on the far side; no moon bar is laid on it.
        // Under a wide pixel the cut goes to a plain round (four rounds for the blossom) OF THE SAME AREA as the true cut,
        // and the markings to their means over it: a card far off is no larger and no brighter than near
        // (a card's kind is a whole number carried to the pixel: 0.02 is added before it is read, so that a card with no
        // light from within, whose number is exactly whole, is never read as the kind below it)
        float zk = vS.z+0.02, ty = floor(zk), lit = max(fract(zk)-0.02, 0.0)/0.9; vec2 cu = vec2(vS.y, vS.w); float cr = length(cu), ca = atan(cu.y, cu.x+1e-5), det = 1.0-smoothstep(0.25,0.7,leafF);
        extra = vec3(0.0); spec = 0.0;
        if (ty < 12.5) { alb *= 0.5+0.7*vnoise(P*3.1); }
        else if (ty < 13.5) {
          float k5 = floor(ca/1.2566+0.5), ph = ca-k5*1.2566, la = cr*cos(ph), lb = cr*sin(ph);
          float wl = 0.30*pow(max(sin(3.14159*clamp(la,0.0,1.0)),0.0),0.7);
          if (mix(cr-0.785, abs(lb)-wl, det) > 0.0) discard;
          alb *= mix(0.868, (lb > 0.0 ? 1.2 : 0.78)*(1.0-0.4*(1.0-smoothstep(0.0,0.04,abs(lb))))*(0.8+0.4*fract(k5*0.37+0.2))*(0.72+0.3*la), det);
          spec = 0.6*det;
        } else if (ty < 14.5) {
          if (cr > 1.0) discard;
          vec2 hq = cu-vec2(-0.3,0.35); alb = alb*(0.42+0.72*sqrt(max(1.0-cr*cr,0.0))) + vec3(0.5,0.42,0.3)*exp(-dot(hq,hq)*9.0)*0.35;
        } else if (ty < 15.5) {
          vec2 fq = abs(cu)-0.46; float fr5 = length(fq), fa5 = atan(fq.y, fq.x+1e-5);
          if (mix(fr5-0.2703, fr5-0.40*(0.62+0.38*cos(5.0*fa5)), det) > 0.0) discard;
          alb = mix(alb*0.787+vec3(0.62,0.42,0.10)*0.084, mix(vec3(0.62,0.42,0.10), alb, smoothstep(0.06,0.12,fr5))*(0.75+0.3*smoothstep(0.1,0.4,fr5)), det);
        } else {
          if (cr-mix(0.9411, 0.94*(1.0+0.07*cos(7.0*ca)), det) > 0.0) discard;
          alb *= mix(0.762, (0.62+0.38*smoothstep(-0.2,0.6,sin(cr*11.0+ca*2.0)))*(0.75+0.35*cr), det);
        }
        E = E*1.3/(1.0+0.9*E) + lit*uTrI*1.5; amb = 0.6; bar = 0.0;
      } else if (vS.z > 5.5 && vS.z < 6.5) {
        // FOLIAGE in the mass (surf.z = 6): the dais's garlands (surf.w = 1). Dark glossy leaves in clumps, lit on the edge
        // that turns from the eye; in it, in cells 0.55 m apart, round things 0.26 m across: white flowers, dusky red
        // and purple fruit in six cells of ten. Leaves and flowers go to their means under a wide pixel
        // (a mass is a round thing drawn in few faces: a pixel's footprint on it is worked from the round's own normal, ff)
        float ff = vd*uPix/max(dot(N,V),0.2);
        float lf = vnoise(P*5.0), lf2 = vnoise(P*13.0+7.0), frac = 0.6;
        float cs6 = 0.55, r6 = 0.13, f3 = clamp(ff,0.004,0.1);
        vec3 cq = P/cs6, ci = floor(cq); float ch = h31(ci+11.0), kf = h31(ci+17.0);
        float cd = length(fract(cq)-0.5-0.2*(vec3(h31(ci+3.0),h31(ci+5.0),kf)-0.5))*cs6;
        float spot = mix(4.19*r6*r6*r6/(cs6*cs6*cs6)*frac, figCov(cd-r6, f3, 1.047*r6*r6)*step(ch,frac), toMean(ff,cs6));     // (a ball's soft edge adds 0.6 f f/(r r) of its volume: 1.047 r r given as the area dims it by just that)
        vec3 fc = kf < 0.55 ? vec3(0.80,0.78,0.70) : (kf < 0.8 ? vec3(0.45,0.07,0.06) : vec3(0.20,0.07,0.18));
        float rim = 1.0-abs(dot(N,V));
        alb *= mix(0.72, (0.22+1.0*lf)*(0.75+0.5*lf2), toMean(ff,0.25))*(1.0+1.3*rim*rim);
        alb = mix(alb, fc*(0.75+0.5*lf2), spot); spec = 0.9*(1.0-spot)*lf; amb = 0.6; E = E*1.3/(1.0+0.9*E);
      } else if (vS.z > 7.5) {
        // A VERDURE (surf.z = 8 to 11: its design; surf.w: its middle along the wall, which runs along z, or along x where the
        // cloth faces north or south; surf.y: its foot; it hangs to y 21.8, 7.6 m wide; it stirs). Woven foliage and nothing else: two layers of pointed leaves in three greens, each with its midrib;
        // flowers of six petals in ivory, rose and old gold; in designs 0 and 1 three fruiting trees across (a waving trunk, a
        // round crown, oranges in it on design 0, pomegranates on design 1); a flowered border 0.7 m wide (a waving stem, a
        // rosette every 0.7 m, a gold line either side) and a gold fringe at the foot. Grounds: 0 a deep blue-green, 1 wine,
        // 2 a deep green, 3 the darkest blue-green, its leaves dim (THE DARK END's). Under a wide pixel it goes to its mean
        float d = floor(vS.z-7.5), hu = (abs(N.z) > 0.7 ? P.x : P.z)-vS.w, hv = P.y, yb = vS.y, f8 = clamp(foot,0.004,0.4), lb = d > 2.5 ? 0.4 : 1.0; extra = vec3(0.0);
        float stir = sin(hu*2.3+sin(uTime*0.7+P.z*0.1)*1.6+hv*0.25) + 0.5*sin(hv*1.1-uTime*1.1+hu*0.6);
        vec3 ground = d < 0.5 ? vec3(0.030,0.085,0.090) : (d < 1.5 ? vec3(0.150,0.030,0.040) : (d < 2.5 ? vec3(0.045,0.095,0.050) : vec3(0.012,0.032,0.038)));
        vec3 cc = ground;
        for (int i = 0; i < 2; i++) { float sc = i == 0 ? 1.5 : 0.85; vec2 q = vec2(hu, hv)/sc + float(i)*7.3 + d*3.1, ci = floor(q);
          float h1 = h11(ci.x*7.13+ci.y*3.71+d), h2 = h11(ci.x*3.17+ci.y*9.2+1.7), an = h1*6.2832, ca = cos(an), sa = sin(an);
          vec2 l0 = fract(q)-0.5-0.22*(vec2(h1,h2)-0.5), lp = vec2(ca*l0.x+sa*l0.y, ca*l0.y-sa*l0.x)*sc; float la = 0.62*sc, lx = lp.x/la;
          float lf = figCov(abs(lp.y)-0.2*sc*(1.0-lx*lx), f8, 0.858*sc*sc)*step(abs(lx),1.0);     // (a pointed leaf's soft edge adds area only at its two points: 0.858 sc sc is the area that dims it rightly, by measure; its own area is 0.331 sc sc)
          cc = mix(cc, mix(vec3(0.10,0.17,0.07), vec3(0.24,0.27,0.11), h2)*(lp.y > 0.0 ? 1.15 : 0.8)*(1.0-0.5*lineCov(abs(lp.y),0.012,foot))*lb, lf); }
        { float xt = floor(hu/2.6+0.5)*2.6, th = h11(xt*1.7+vS.w*0.13+d), cy = 16.6+2.4*th, tw = d < 1.5 ? 1.0 : 0.0; vec2 cp = vec2(hu-xt, hv-cy);
          float trunk = lineCov(abs(hu-xt-0.14*sin(hv*0.9+th*6.0)), 0.09, foot)*step(hv,cy)*tw;
          float crown = (1.0-smoothstep(-f8,f8, length(cp)-1.25*(1.0+0.12*sin(atan(cp.y,cp.x+1e-5)*7.0+th*9.0))))*tw;
          vec2 fq = cp/0.42, fi = floor(fq); float fh = h11(fi.x*5.3+fi.y*8.7+xt), fruit = figCov(length(fract(fq)-0.5)*0.42-0.11, min(f8,0.12), 0.038)*step(0.45,fh)*crown;
          cc = mix(cc, vec3(0.16,0.09,0.04), trunk); cc = mix(cc, vec3(0.07,0.13,0.06)*(0.8+0.4*fh), crown*0.85);
          cc = mix(cc, d < 0.5 ? vec3(0.62,0.30,0.05) : vec3(0.50,0.09,0.07), fruit); }
        { vec2 q = vec2(hu, hv)/1.05 + 3.3 + d, ci = floor(q); float h1 = h11(ci.x*4.7+ci.y*6.1+d*2.0), h2 = h11(ci.x*8.3+ci.y*2.9);
          vec2 fp = (fract(q)-0.5-0.25*(vec2(h1,h2)-0.5))*1.05; float fr8 = length(fp);
          float flw = figCov(fr8-0.2*(0.62+0.38*cos(6.0*atan(fp.y, fp.x+1e-5)+h1*6.0)), min(f8,0.2), 0.0574)*step(h2, d > 2.5 ? 0.25 : (d > 1.5 ? 0.8 : 0.45));
          cc = mix(cc, (h1 < 0.4 ? vec3(0.62,0.56,0.42) : (h1 < 0.7 ? vec3(0.50,0.16,0.14) : vec3(0.55,0.40,0.12)))*lb, flw);
          cc = mix(cc, vec3(0.45,0.30,0.08)*lb, mix((1.0-smoothstep(-min(f8,0.05),min(f8,0.05), fr8-0.05))*flw, figCov(fr8-0.05, min(f8,0.075), 0.00785)*step(h2, d > 2.5 ? 0.25 : (d > 1.5 ? 0.8 : 0.45)), smoothstep(0.004,0.02,f8))); }     // (the eye: under a pixel wider than 0.02 m it is its own disc at its true area, for the flower's soft edge over it would dim it)
        // (the field's mean colour, by design: ground, leaves, trees and flowers together)
        vec3 mc = d < 0.5 ? vec3(0.125,0.155,0.0811) : (d < 1.5 ? vec3(0.157,0.125,0.0651) : (d < 2.5 ? vec3(0.125,0.163,0.0746) : vec3(0.0421,0.0604,0.0368)));
        float dx8 = 3.8-abs(hu), dy8 = min(21.8-hv, hv-yb), de = min(dx8, dy8);
        if (de < 0.7) {                                                      // the border
          float t = dx8 < dy8 ? hv : hu; vec2 bq = vec2((fract(t/0.7)-0.5)*0.7, de-0.38); float br = length(bq), par = mod(floor(t/0.7),2.0);
          float ros = figCov(br-0.19*(0.62+0.38*cos(6.0*atan(bq.y, bq.x+1e-5))), min(f8,0.19), 0.0518);
          vec3 bg = d > 0.5 && d < 1.5 ? vec3(0.02,0.04,0.10) : vec3(0.11,0.022,0.03);
          cc = mix(bg, vec3(0.12,0.18,0.07), lineCov(abs(de-0.38-0.13*sin(t*8.976)), 0.025, foot));
          cc = mix(cc, par < 0.5 ? vec3(0.62,0.56,0.42) : vec3(0.52,0.17,0.15), ros)*lb;
          cc = mix(cc, vec3(0.50,0.34,0.10), min(lineCov(abs(de-0.05),0.03,foot)+lineCov(abs(de+0.05),0.03,foot)+lineCov(abs(de-0.6775),0.0225,foot)+lineCov(abs(de-0.7225),0.0225,foot), 1.0));     // (each gold line and the same line mirrored in the border's nearer edge, 0 and 0.7 m: what a soft edge throws past the border comes back, and the lines keep their 0.15 of it)
          mc = d < 0.5 ? vec3(0.219,0.116,0.0721) : (d < 1.5 ? vec3(0.157,0.129,0.120) : (d < 2.5 ? vec3(0.219,0.116,0.0721) : vec3(0.130,0.0753,0.0373))); }      // (the border's mean colour, by design)
        if (hv-yb < 0.3) { cc = vec3(0.50,0.34,0.10)*(0.5+0.7*step(0.5,fract(hu/0.06))); mc = vec3(0.50,0.34,0.10)*0.85; }
        alb = mix(mc, cc, toMean(foot,1.5))*(0.92+0.08*sin(hv*70.0)*toMean(foot,0.09))*(0.8+0.18*stir);
        alb = mix(alb*0.22, alb, smoothstep(0.03,0.6,E)); amb = 0.6;
      } else if (vS.z > 6.5 && vS.z < 7.5) {
        // THE GREAT CARPET of the dais (x -18.5 to 18.5, z -121.5 to -194.5; a fringe 0.45 m long at its two ends). A deep crimson
        // field under an all-over arabesque 2.4 m to a repeat (a gold stem in rounded lozenges, an ivory flower of eight petals
        // in each, a dark blue four-leaved form between); a lobed centre medallion 17 m by 24 m in dark blue, edged in gold,
        // with a ring of sixteen ivory petals and a crimson heart, a lesser one north and south of it and a quarter of one in
        // each corner; a border 3.4 m wide: a guard of ivory beads on blue, a blue band with a waving gold vine and ivory
        // flowers, an inner guard of blue beads on ivory. Under a wide pixel every part goes to its own mean
        vec2 c = vec2(P.x, P.z+158.0), hc = vec2(18.5, 36.5), ac = abs(c); float f7 = clamp(foot,0.004,0.5), rel = toMean(foot,2.4);
        float pile = 0.88+0.12*sin(P.x*43.0)*sin(P.z*43.0)*toMean(foot,0.15);
        vec3 crim = vec3(0.26,0.028,0.035), gold = vec3(0.52,0.36,0.11), blue = vec3(0.022,0.045,0.14), ivory = vec3(0.62,0.56,0.44), cc, mc;
        float de = min(hc.x-ac.x, hc.y-ac.y);
        if (de < 0.0) {                                                      // the fringe
          cc = ivory*(0.45+0.75*step(0.5,fract(P.x/0.07))); mc = ivory*0.82; rel = toMean(foot,0.07);
        } else if (de < 3.4) {
          float t = hc.x-ac.x < hc.y-ac.y ? c.y : c.x, v = de-1.7, j = floor(t/1.1), sg = mod(j,2.0) < 0.5 ? 1.0 : -1.0, tl = (fract(t/1.1)-0.5)*1.1;
          float vine = lineCov(abs(v-0.75*sin(t*2.856))*0.6, 0.05, foot);
          vec2 fp = vec2(tl, v+0.35*sg); float fr7 = length(fp), fa7 = atan(fp.y, fp.x+1e-5);
          float fl7 = figCov(fr7-0.42*(0.62+0.38*cos(6.0*fa7)), min(f7,0.3), 0.253), ey = figCov(fr7-0.12, min(f7,0.25), 0.0452);
          float bead = figCov(length(vec2((fract(t/0.45)-0.5)*0.45, abs(v)-1.47))-0.13, min(f7,0.13), 0.0531);
          cc = mix(mix(mix(blue, gold, vine), ivory, fl7), gold, ey);
          cc = mix(cc, gold, bnd(1.1,1.25,abs(v),f7));
          cc = mix(cc, v < 0.0 ? mix(blue, ivory, bead) : mix(ivory, blue, bead), smoothstep(1.25-f7,1.25+f7,abs(v)));
          mc = mix(vec3(0.168,0.148,0.158), v < 0.0 ? vec3(0.181,0.182,0.220) : vec3(0.461,0.423,0.360), step(1.25,abs(v)));     // (the means of the band and of either guard)
        } else {
          vec2 fq = c/2.4, f1 = fract(fq)-0.5, f2 = fract(fq+0.5)-0.5; float r1 = length(f1)*2.4, a1 = atan(f1.y, f1.x+1e-5), r2 = length(f2)*2.4, a2 = atan(f2.y, f2.x+1e-5);
          float g = cos(fq.x*6.2832)+cos(fq.y*6.2832), gg = 2.618*length(vec2(sin(fq.x*6.2832), sin(fq.y*6.2832)));
          float stem = lineCov(abs(g-0.6)/max(gg,0.6), 0.04, foot);
          float flo = figCov(r1-0.44*(0.6+0.4*cos(8.0*a1)), min(f7,0.44), 0.268), eye = figCov(r1-0.13, min(f7,0.26), 0.0531);
          float lea = figCov(r2-0.52*(0.3+0.7*abs(cos(2.0*a2+0.785))), f7, 0.512);
          cc = mix(mix(mix(mix(crim, gold, stem), blue, lea), ivory, flo), gold, eye);
          mc = vec3(0.270,0.0731,0.0649);                                    // (the field's mean colour)
          // the medallions: the great one in the middle, a lesser one at 15.6 m north and south of it, a quarter one in each corner
          vec2 mq = vec2(c.x, c.y*0.708); float mr = length(mq), ma = atan(mq.y, mq.x+1e-5), ed = 8.6*(1.0+0.05*cos(16.0*ma))-mr;
          vec2 lq = vec2(c.x, ac.y-15.6), kq = ac-(hc-3.4);
          float l2 = 2.3*(1.0+0.1*cos(8.0*atan(lq.y, lq.x+1e-5)))-length(lq), k2 = 5.6*(1.0+0.06*cos(12.0*atan(kq.y, kq.x+1e-5)))-length(kq);
          float em = max(ed, max(l2, k2));
          if (em > 0.0) {
            float pet = 1.0-smoothstep(-f7,f7, abs(mr-5.2)-0.95*abs(cos(8.0*ma)));
            float ray = lineCov(abs(sin(8.0*ma+1.5708))*mr*0.12, 0.05, foot)*step(2.4,mr)*step(mr,7.6);
            cc = mix(mix(mix(blue, gold, ray), ivory, pet*step(0.0,ed)), gold, 1.0-smoothstep(0.3-f7,0.3+f7,em));
            cc = mix(cc, mix(crim, ivory, figCov(mr-1.25*(0.6+0.4*cos(8.0*ma)), f7, 2.16)), (1.0-smoothstep(2.3-f7,2.3+f7,mr))*step(0.0,ed));
            mc = ed > 0.0 ? vec3(0.196,0.169,0.184) : l2 > 0.0 ? vec3(0.143,0.122,0.133) : vec3(0.074,0.078,0.137);     // (each medallion's own mean colour: the great one, a lesser one, a corner quarter)
          }
        }
        alb = mix(mc, cc, rel)*pile*(0.9+0.2*vnoise(P*1.1));
        alb = mix(alb*0.3, alb, smoothstep(0.03,0.6,E)); E = E*0.9/(1.0+0.5*E); amb = 0.6;
      } else if (vS.z > 0.5 && vS.z < 1.5) {                               // carpet: a dusky crimson, duller than the wine, a woven border
        float pile = 0.86+0.14*sin(P.x*41.0)*sin(P.z*41.0)*toMean(foot,0.15) + 0.1*(vnoise(P*1.3)-0.5);      // (its mean: 0.86)
        float ax = abs(P.x)/1.41; float bord = smoothstep(1.28,1.34,ax)*(1.0-smoothstep(1.52,1.58,ax));
        float leaf = smoothstep(0.3,0.5,sin(P.z*5.2)*sin(ax*10.4+1.57))*(1.0-smoothstep(1.05,1.2,ax));
        alb = mix(alb*pile*(1.0-0.14*leaf), vec3(0.42,0.27,0.07)*pile, bord);
        alb = mix(vec3(0.085,0.03,0.022)*pile, alb, smoothstep(0.04,0.7,E)); E = E*0.7/(1.0+0.6*E); amb = 0.55;   // lit only near candles; dark wine-brown between
      } else if (vS.z > 4.5) {                                             // velvet (the canopy's valance and curtains, the doorway's): deep folds that stir, a soft sheen at the turn of a fold
        float hu = abs(N.x) > 0.7 ? P.z : P.x;
        // (a deep crimson: the folds' hollows dark, the nap lit at the turn of a fold only near a flame; the folds, 1.43 m
        // apart, go to their mean under a wide pixel)
        float fo = mix(0.5, 0.5+0.5*sin(hu*4.4+sin(P.y*0.6)*0.9+0.3*sin(uTime*0.6+hu*0.27+P.y*0.2)), toMean(foot,1.4));
        float nv = 1.0-abs(dot(N,V)), nearF = smoothstep(0.12,0.9,E);
        alb *= (0.2+0.8*fo*fo + 0.1*(1.0-toMean(foot,1.4)*toMean(foot,1.4)))*(0.75+1.5*nv*nv*nearF);          // (the folds' tone keeps its mean, 0.5, as they go)
        alb = mix(vec3(0.034,0.010,0.011)*(0.35+0.65*fo), alb, smoothstep(0.03,0.6,E)); amb = 0.32; spec = 0.2*nearF;
      } else if (vS.z > 3.5) {                                             // the canopy's lining: a painted night sky
        // THE TESTER'S LINING: a painted night sky, as the roof's panels are: a deep blue field with gilt stars of three
        // sizes, one to a cell 1.9 m wide and each in its own place there (five-pointed, 0.2 to 0.62 m across; one cell in
        // nine holds a great one with a ring round it); EIGHT BROAD GILT RIBS 0.7 m wide with a red line either side, from
        // the gilt boss the chandelier hangs from (x 0, z -155) to the four corners and to the four sides; a gold
        // galloon round the boss, 2.3 m out; a border of gilt leaf work 1.5 m wide along the four edges (a running stem
        // with a leaf either side every 0.75 m) inside a red line. It is lit warm from the candles under it: brightest
        // over the two ranks (x 5 and -5, z -130 to -168.4, 19 m below), darker toward its edges. Stars and leaves go
        // to their means under a wide pixel; ribs keep their tone as they thin
        vec2 rr = vec2(P.x, P.z+155.0); float rl = max(length(rr),1e-3), fa = clamp(foot, 0.004, 0.3), ax = abs(rr.x);
        vec3 gold = vec3(0.62,0.43,0.13), red = vec3(0.36,0.06,0.045);
        float xr = P.x > 0.0 ? 5.0 : -5.0, zr = clamp(P.z,-168.4,-130.0); vec2 toR = vec2(xr-P.x, zr-P.z);
        float lit = 1.0/(1.0+dot(toR,toR)/70.0);
        vec2 ci = floor(P.xz/1.9); float h1 = h11(ci.x*12.7+ci.y*31.3+5.0), h2 = h11(ci.x*5.1+ci.y*17.9+1.0), h3 = h11(ci.x*3.3+ci.y*7.7+9.0);
        float sr = h3 > 0.89 ? 0.31 : (h3 > 0.55 ? 0.18 : 0.10);
        vec2 sq = (fract(P.xz/1.9)-0.5)*1.9-(vec2(h1,h2)-0.5)*(1.9-2.0*sr-0.5); float sl = length(sq), sa = atan(sq.y, sq.x+1e-5)+h1*6.28;
        float star = figCov(sl-sr*(0.5+0.5*pow(abs(cos(2.5*sa)),0.7)), min(fa,1.5*sr), 2.34*sr*sr);
        star = min(star + step(0.89,h3)*lineCov(abs(sl-sr*1.45), 0.025, foot), 1.0);
        float gs = mix(0.0246, star, toMean(foot,1.2));                           // (the mean cover of the stars and rings dealt to this lining: 0.0246)
        float dc = rr.y > 0.0 ? abs(ax*27.0-rr.y*17.0)/31.906 : abs(ax*33.0+rr.y*17.0)/37.121, dRib = min(min(ax, abs(rr.y)), dc);
        alb = vec3(0.020,0.040,0.125)*(0.8+0.4*vnoise(vec3(P.xz*0.45, 7.0)))*(1.0+0.6*exp(-rl*rl/160.0));
        alb = mix(alb, gold*(0.85+0.3*h2), gs);
        alb = mix(alb, red, min((lineCov(abs(dRib-0.5), 0.07, foot)+lineCov(dRib+0.5, 0.07, foot))/max(1.0-lineCov(dRib, 0.35, foot), 1e-3), 1.0)*smoothstep(2.3,2.6,rl));     // (a rib's two red lines, as their share of what the rib painted over them leaves: it hides none of their cover)
        alb = mix(alb, gold*(0.8+0.3*vnoise(P*5.0)), lineCov(dRib, 0.35, foot)*smoothstep(1.8,2.1,rl));
        alb = mix(alb, gold*1.15, 0.9*lineCov(abs(rl-2.3),0.13,foot));
        float eb = min(17.0-abs(P.x), min(P.z+188.0, -128.0-P.z));
        if (eb < 1.75) { float eu = (17.0-abs(P.x) < min(P.z+188.0, -128.0-P.z) ? P.z : P.x)/0.75, ev = (eb-0.75)/0.75;
          float lu = fract(eu)-0.5, stem = lineCov(abs(ev-0.16*sin(eu*6.2832)), 0.06, foot*1.33);
          vec2 lq = vec2(lu, abs(ev)-0.42); float leaf = figCov(length(lq*vec2(1.0,1.7))-0.26, min(fa*1.33,0.26), 0.212);
          float gl = mix(0.185, min(stem+leaf,1.0), toMean(foot,0.75));
          vec3 bd = mix(vec3(0.05,0.035,0.03), gold*(0.9+0.3*mix(0.675, mix(leaf, leaf/max(stem+leaf,1e-3), smoothstep(0.004,0.02,fa)), toMean(foot,0.75))), gl);     // (the leaves are 0.675 of the gold; its tone is the leaf's share of it once the edge is soft)
          alb = mix(alb, bd, 1.0-smoothstep(1.5,1.56,eb)); alb = mix(alb, red, lineCov(abs(eb-1.62),0.06,foot)); }
        E = E*0.35 + uTabI*uIsle*1.5*lit; spec = 0.3+0.9*max(gs, lineCov(dRib, 0.35, foot)); amb = 0.3;
      } else if (vS.z > 2.5) {                                             // a wall hanging: crimson damask, a gold leaf border, a fringe; it stirs
        // (surf.w = its middle along a wall that runs along z, or that middle + 1000 on a wall along x; it hangs from y 21.8 to y 11.4, 5.2 m wide.
        // The border is 0.6 m wide at the sides, 0.8 m at the head and 0.9 m at the foot, the lowest 0.35 m of it a fringe)
        float hax = step(500.0,vS.w), hu = (hax < 0.5 ? P.z : P.x)-(vS.w-1000.0*hax), hv = P.y, hz = P.z+P.x;
        float stir = sin(hu*4.6+sin(uTime*0.8+hz*0.1)*2.1+hv*0.25) + 0.5*sin(hv*1.3-uTime*1.4+hu*0.8+hz*0.2);
        float inb = smoothstep(2.0,2.08,abs(hu)) + smoothstep(21.0,21.08,hv) + (1.0-smoothstep(12.3,12.38,hv));
        float sc = mix(0.3, smoothstep(0.1,0.45,sin(hv*3.1+sin(hu*6.0)*1.3)*sin(hu*5.2+0.7)), toMean(foot,0.5));
        float fringe = (1.0-smoothstep(11.75,11.8,hv))*mix(0.5, step(0.0,sin(hu*38.0)), toMean(foot,0.08));
        alb = mix(alb*(0.75+0.5*mix(0.34, damask(vec2(hu,hv)*1.15), toMean(foot,1.0))), vec3(0.50,0.33,0.09)*(0.45+0.9*sc), clamp(inb,0.0,1.0));
        alb = mix(alb, vec3(0.55,0.36,0.1), fringe);
        alb *= 0.78+0.2*stir; alb = mix(vec3(0.07,0.026,0.02), alb, smoothstep(0.03,0.6,E)); amb = 0.55;
      } else if (vS.z > 1.5) { spec = 0.55; alb *= 0.85+0.3*vnoise(P*6.0); }
    }
    // (the petals that lie: on a cloth's top, a carpet, a tread of the dais steps)
    if (N.y > 0.9 && ((kind > 2.5 && kind < 3.5) || (kind > 5.5 && kind < 6.5 && (abs(vS.z-1.0) < 0.5 || abs(vS.z-7.0) < 0.5))
        || (kind > 1.5 && kind < 2.5 && P.y > 0.5 && P.y < 2.5 && P.z < -116.0 && P.z > -200.0))) {
      vec2 lp = lyingPetal(P.xz, foot); alb = mix(alb, mix(vec3(0.84,0.80,0.74), vec3(0.84,0.60,0.60), lp.y*lp.y), lp.x*0.9); }
    if (kind < 1.5) {                                                      // walls: a warm pool round each flame, falling off upward to deep umber at the wall head; the roof dimmer still
      E *= (1.0-mix(0.5, 0.68, smoothstep(-112.0,-66.0,P.z))*smoothstep(7.0,30.0,P.y))*(1.0-0.4*smoothstep(29.0,35.0,P.y))*mix(1.1, 1.0, smoothstep(-112.0,-66.0,P.z));
      E = E*sqrt(E)*uWall/(1.0+0.14*E);
      if (boardK > 0.5) E = 1.1*E+0.1;                                        // (a dresser's back board stands in its own sconces' light)
      // the roof takes its own light (roofLight); a timber catches it on its underside and, less, on its flanks
      if (roofK > 0.5) { float fl = 1.0 + 0.065*sin(uTime*2.3+P.z*0.21+P.x*0.13) + 0.045*sin(uTime*3.7-P.z*0.33+P.y*0.4);
        E = roofLight(P)*fl*(vS.y < 4.5 ? 1.0 : 0.3+0.9*smoothstep(-0.3,0.8,-N.y)); bar = 0.0; amb = vS.y < 4.5 ? 2.4 : 1.5; }
      else if (kind < 0.5) { vec3 Lc = vec3(0.0,34.0,-30.0)-P;                  // the gables stand in the roof's light; the walls over the four crossing arches in the corona's
        float cor = step(abs(P.x),34.5)*step(-72.5,P.z)*step(P.z,10.5)*uPyI*3.2*max(dot(N,normalize(Lc))*0.7+0.3,0.0)/(1.0+dot(Lc,Lc)*0.004);
        E += smoothstep(24.0,32.0,P.y)*(0.45*roofLight(P) + cor);
        // (a painted field stands in the roof's light and the corona's, brightest low down where the light comes from)
        if (paintK > 0.5) { E = (0.4*roofLight(P)+0.7*cor)*(1.3-0.5*smoothstep(30.0,46.0,P.y)); bar = 0.0; amb = 2.0; } } }
    vec3 Ln = normalize(Ld); vec3 Rv = reflect(-V,N); float rl = max(dot(Rv,Ln),0.0); float r2 = rl*rl; float r8 = r2*r2*r2*r2;
    // (silver and gilt are small things: the sharp highlight is whole where a piece 0.36 m wide is 12 pixels across and at
    // its mean where it is 3, as on the glasses)
    float sp = spec*(kind > 4.5 ? mix(0.15, r8*r2*2.2, 1.0-smoothstep(0.03,0.12,vd*uPix))+r2*0.35 : r8*r8*0.6);
    vec3 warm = mix(uFlameCol*mix(vec3(1.0,0.84,0.62), vec3(1.0), smoothstep(0.03,0.45,E)), vec3(1.0,0.92,0.78), smoothstep(0.4,1.3,E)*0.7);
    if (linLit > -0.5) warm = linWarm;
    float dif = kind > 4.5 && kind < 5.5 ? 0.45 : 1.0;
    float fl = max(dot(N,uFillDir),0.0); fl = fl*fl*(0.4+0.6*fl) + 0.03;                       // the look's cool light: an edge on what faces it, not a wash
    vec3 albA = kind < 2.5 && roofK < 0.5 ? mix(alb, vec3(dot(alb,vec3(0.3333))), 0.3) : alb;       // stone and oak in the underlight alone: umber, not maroon
    vec3 gwc; float gw = gwLight(P,N,gwc);                                                       // the great windows' cold light
    // THE CHOIR'S OWN LIGHT, the hall's second colour (uChoir: silver under the moon, deep blue at midnight, pale blue
    // at the blue hour): north of the crossing's north arch (it comes on from z -72 to z -92) the night's light from
    // the choir's windows lies on everything, most on what faces up or across the hall, least on an underside; under
    // the canopy (x -17 to 17, z -128 to -188) a quarter of it, so that the dais stays the warm heart; in THE DARK END
    // (west of x -6, z -172 to -236) half of it. It shows a thing in its own colour, paled. Where it lies, the candles'
    // far wash is held back (to 0.35 of itself where E is under 0.15, whole from E 1) so that their pools stand as warm
    // islands in it, and the hall's underlight goes over to its colour
    float chK = 1.0-smoothstep(-92.0,-72.0,P.z);
    float canK = (1.0-smoothstep(14.0,20.0,abs(P.x)))*smoothstep(-191.0,-185.0,P.z)*(1.0-smoothstep(-131.0,-125.0,P.z))*step(P.y,26.2);
    float dkK = (1.0-smoothstep(-9.0,-3.0,P.x))*(1.0-smoothstep(-175.0,-169.0,P.z))*smoothstep(-239.0,-233.0,P.z);
    float chL = chK*(1.0-0.75*canK);
    float Ew = E*mix(1.0, 0.35+0.65*smoothstep(0.15,1.0,E), chL);
    vec3 ambC = mix(uAmb, uChoir*(dot(uAmb,vec3(0.3333))/max(dot(uChoir,vec3(0.3333)),1e-3)), chL);
    col = alb*(warm*Ew*uGain*(dif+sp) + uFill*(kind > 3.5 && kind < 4.5 ? uTierFill*fw : fl*fillK) + uMoonCol*bar + gwc*gw*(kind > 1.5 && kind < 2.5 ? 4.0 : 2.4)) + albA*ambC*ambT*amb + extra
      + (kind > 1.5 && kind < 2.5 ? gwc*gw*0.25 : vec3(0.0));                                  // (the polished floor gives the cold light back as its own colour)
    col += (alb*0.7+vec3(0.05))*uChoir*(chL*(1.0-0.5*dkK)*(0.5+0.3*N.y+0.25*abs(N.x)));
  }
  gl_FragColor = vec4(col,1.0);
  #include <fog_fragment>
}`;
const FOG_ADD = /* glsl */`
  #ifdef USE_FOG
    col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #endif`;
const DOME_VS = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix*viewMatrix*vec4(position+cameraPosition,1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const DOME_FS = /* glsl */`
uniform float uTime; varying vec3 vDir;
` + G_COMMON + G_SKY + /* glsl */`
void main(){ vec3 d = normalize(vDir+vec3(0.0,1e-5,0.0)); gl_FragColor = vec4(nightSky(d,uTime),1.0); }`;
// halos: the glare of a flame as the eye has it. A small soft light at every flame, never drawn smaller than 2.4 pixels
// across (uPix: one pixel's angle, the one number for the whole frame) and then dimmed by the square of how much it was
// widened, so that a widened halo gives exactly the light it had: the far tables, the tiers and the chandeliers read as
// fields of small steady lights and not as noise
const HALO_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime, uPix, uGustAmp, uGustTail; varying vec2 vUv; varying float vI;
` + G_COMMON + G_BEAR + GLSL_GUST + /* glsl */`
void main(){
  vec3 c = instanceMatrix[3].xyz; float base = length(instanceMatrix[0].xyz);
  vec4 wc = modelMatrix*vec4(c,1.0); vec4 mv = viewMatrix*wc; float dist = max(-mv.z,0.1);
  float size = max(base, dist*uPix*2.4); float k = base/size;
  float dz = gustD(wc.z); float lean = uGustAmp*(dz > 0.0 ? exp(-dz*dz/60.0) : exp(dz/max(uGustTail,1.0)));
  float dg = dz+7.0; float gut = min(uGustAmp*exp(-dg*dg/260.0),1.0);
  // the breath lays every flame's light over on its one bearing: the halo is drawn out along that lean
  vec3 lv = (viewMatrix*vec4(vec3(1.28*GB.x,-0.16,1.28*GB.y)*lean*base*3.6, 0.0)).xyz;
  float ll = length(lv.xy); float bl = clamp(lean*2.5, 0.0, 1.0);
  vec2 along = normalize(vec2(0.0,1.0-bl) + lv.xy/max(ll,1e-4)*bl + vec2(1e-4,0.0)); vec2 perp = vec2(along.y,-along.x);
  float str = 1.0 + bl*ll/size;
  float hk = h31(floor(c*5.0)+7.0);
  vI = breath(c,uTime)*(1.0+0.09*sin(uTime*(2.0+2.6*hk)+hk*60.0))*k*k*(1.0-0.5*gut)*(1.0+0.5*lean)/sqrt(str);
  vec2 q = (uv-0.5)*2.0;
  mv.xy += lv.xy*0.5*bl + (perp*q.x + along*q.y*str*(1.0-0.25*gut))*size; vUv = uv;
  vec4 mvPosition = mv; gl_Position = projectionMatrix*mv;
  #include <fog_vertex>
}`;
const HALO_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uFlameCol; uniform float uHalo; varying vec2 vUv; varying float vI;
void main(){ vec2 q = (vUv-0.5)*2.0; float r2 = dot(q,q); float g = exp(-r2*5.5)*0.55+exp(-r2*30.0)*0.75;
  vec3 col = uFlameCol*vec3(1.0,0.78,0.5)*g*vI*uHalo*(1.0-smoothstep(0.7,1.0,r2));
  ` + FOG_ADD + /* glsl */`
  gl_FragColor = vec4(col,1.0); }`;
// smoke threads: thin ribbons standing over some flames
const SMOKE_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime, uGustAmp, uGustTail; varying vec2 vUv; varying float vK;
` + G_COMMON + G_BEAR + GLSL_GUST + /* glsl */`
void main(){
  vec3 c = instanceMatrix[3].xyz; float h = length(instanceMatrix[1].xyz); float k = h31(floor(c*3.0)+1.0);
  vec4 wc = modelMatrix*vec4(c,1.0); float y = uv.y; float dz = gustD(wc.z); float gust = uGustAmp*(dz > 0.0 ? exp(-dz*dz/60.0) : exp(dz/max(uGustTail,1.0)));
  vec3 toC = cameraPosition-wc.xyz; vec2 f = toC.xz/max(length(toC.xz),1e-3); vec3 right = vec3(f.y,0.0,-f.x);
  float t = uTime*(0.5+0.4*k); float w = 0.16+1.25*y*y;
  vec3 p = wc.xyz + vec3(0.0,y*h,0.0) + right*(uv.x-0.5)*w
    + vec3(sin(y*5.0-t*1.9+k*20.0), 0.0, cos(y*4.1-t*1.6+k*11.0))*0.16*y*y*h*0.4 + vec3(1.06*GB.x,-0.5*y,1.06*GB.y)*gust*1.7*y*h;      // the breath bends it flat on its one bearing
  vUv = uv; vK = k;
  vec4 mvPosition = viewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime; uniform vec3 uFlameCol; varying vec2 vUv; varying float vK;
void main(){ float x = abs(vUv.x-0.5)*2.0; float a = exp(-x*x*3.2)*(1.0-x*x)*smoothstep(0.0,0.14,vUv.y)*(1.0-smoothstep(0.25,1.0,vUv.y));
  a *= 0.65+0.35*sin(vUv.y*9.0-uTime*(1.6+vK)+vK*30.0+x*2.0);
  vec3 col = (uFlameCol*0.055+vec3(0.034,0.035,0.04))*a;
  ` + FOG_ADD + /* glsl */`
  gl_FragColor = vec4(col,1.0); }`;

// the rare breath made visible: fine dust caught in the candlelight, drawn out into short pale-gold streaks that drift south
// just behind the front (aS: x, y, metres behind the front, length; aK: its own number). Nothing when uGustAmp is 0.
// A streak is lit only by the candles it passes (how far it is from the nearest row of low flames, or from the pyramid's
// flames) and by nothing else. It is drawn at its true size (0.044 m wide) at every distance and may only go out by pixel
// width: whole where it is 0.6 of a pixel wide, nothing at 0.4 (uPix). It lies and drifts on the breath's one bearing.
// The streaks ride the breath's front (uGustZ) and are shown (uGustS) only while it comes down the tables at a wind's
// pace, twice our own, from 164 to 200 m flown: they come in from 164 to 168 m and go out from 195 to 200 m, so that
// none is carried at the front's speed through the choir or out through the south wall.
// CLEAR AIR by place: no streak's middle is drawn within 3.5 m of the chords of the WHOLE flown line, start to end
// (uLine: sixty places on it, evenly from its start to its end, about 8 m apart; a streak reaches 0.5 m from its middle; build() measures how far the
// line, sampled every 0.25 m, lies from those chords, and warns if a streak could come within 2.2 m of it).
// The mesh is always drawn: with no streaks shown (uGustS 0) every card is collapsed to one point outside the view.
const GUST_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aS; attribute float aK; uniform float uTime, uGustZ, uGustS, uPix; uniform vec3 uLine[60]; varying vec2 vUv; varying float vA;
` + G_BEAR + /* glsl */`
void main(){
  vec3 dir = normalize(vec3(GB.x,-0.05,GB.y));
  float dz = mod(aS.z + uTime*(5.0+5.0*aK) + 52.0, 60.0) - 52.0;            // streaming through the band behind the front
  vec3 c = vec3(aS.x + dz*GB.x/GB.y, aS.y + 0.4*sin(uTime*1.7+aK*40.0) + 0.02*dz, uGustZ + dz);
  vec3 toC = cameraPosition-c; float dist = max(length(toC),0.1);
  float env = (1.0-smoothstep(0.0,6.0,dz))*smoothstep(-52.0,-22.0,dz);
  float dl = 1e3;                                                            // distance to the flown line, by place
  for (int i = 0; i < 59; i++) { vec3 a = uLine[i], ab = uLine[i+1]-a; vec3 q = c-a-ab*clamp(dot(c-a,ab)/max(dot(ab,ab),1e-4), 0.0, 1.0); dl = min(dl, dot(q,q)); }
  env *= smoothstep(12.25,17.64,dl);                                         // (squares of 3.5 m and 4.2 m)
  vec3 side = normalize(cross(dir,toC)+vec3(0.0,1e-5,0.0));
  float w0 = 0.022;
  vec3 p = c + dir*(uv.x-0.5)*aS.w + side*(uv.y-0.5)*w0*2.0;
  float dxl = c.x-11.0*clamp(floor(c.x/11.0+0.5),-2.0,2.0), hy = c.y-4.4;      // from the nearest row of low flames (the nave, z 20 to 200)
  float lit = step(20.0,c.z)*step(c.z,200.0)*1.5/(1.0+0.16*(dxl*dxl+hy*hy));
  vec3 pv = c-vec3(0.0,12.0,-30.0); lit = max(lit, 1.1/(1.0+0.004*dot(pv,pv)));  // or from the pyramid's flames
  vA = uGustS*env*lit*smoothstep(0.4, 0.6, 2.0*w0/max(dist*uPix, 1e-7))*(0.5+0.5*aK); vUv = uv;
  vec4 mvPosition = viewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mvPosition;
  if (uGustS < 0.002) gl_Position = vec4(0.0,0.0,2.0,1.0);                   // no streaks: nothing is drawn
  #include <fog_vertex>
}`;
const GUST_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uFlameCol; varying vec2 vUv; varying float vA;
void main(){ float y = abs(vUv.y-0.5)*2.0; float x = vUv.x;
  float a = (1.0-y*y)*smoothstep(0.0,0.5,x)*(1.0-smoothstep(0.82,1.0,x));       // a bright head to the south, a tail behind it
  vec3 col = vec3(1.0,0.88,0.66)*a*vA*0.6;
  ` + FOG_ADD + /* glsl */`
  gl_FragColor = vec4(col,1.0); }`;

// THE PETALS: white and pale pink rose petals that fall slowly from under the roof through the whole hall. One mesh,
// two triangles a petal; all the motion is the vertex shader's, from the world's clock. Each petal keeps its own
// column of air (aS: the column's x, the height it falls from, its z, its sway's reach in x and in z) and loops on its
// own period (aK: period in seconds, phase, half size, tint): it falls from the top to its column's own floor (aF: 0.12 m
// over the hall's floor, the dais's floor, a rank's top, a long or a side table's top or the pyramid's tier under it), swaying within its
// reach and turning over as it goes, comes in over the first 4 hundredths of its fall and goes out over the last 3.
// It is lit by place, by the candles it passes: the tables' candles below it, the nave's chandeliers at y 15, the
// pyramid and its corona, the dais's candles. It goes out by pixel width: whole where it is 0.6 of a pixel across,
// nothing at 0.4 of a pixel (uPix), and it is never made larger. The columns stand, by a rule of place, clear of the flown line (see build()).
const PETAL_VS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aS; attribute vec4 aK; attribute float aF; uniform float uTime, uPix, uTabI, uChI, uPyI, uGain; uniform vec3 uFlameCol, uChoir; varying vec2 vUv; varying vec3 vCol; varying float vA;
void main(){
  float f = fract(uTime/aK.x + aK.y), ph = aK.y*40.0, y = mix(aS.y, aF, f);
  vec3 c = vec3(aS.x + aS.w*(0.7*sin(uTime*0.43+ph) + 0.3*sin(uTime*1.1+ph*1.7)), y, aS.z + aS.w*(0.7*cos(uTime*0.37+ph*1.3) + 0.3*sin(uTime*0.9+ph*2.3)));
  float a1 = uTime*(1.1+0.9*aK.w)+ph, a2 = uTime*(0.7+0.5*aK.w)+ph*0.6;
  vec3 n = normalize(vec3(sin(a1)*cos(a2), 0.35+0.8*cos(a1), sin(a1)*sin(a2)) + vec3(0.0,0.001,0.0));
  vec3 U = normalize(cross(n, vec3(cos(a2*1.3), 0.21, sin(a2*1.3))) + vec3(0.0,0.002,0.0)), W = cross(n, U);
  vec3 wp = c + (U*(uv.x*2.0-1.0) + W*(uv.y*2.0-1.0))*aK.z;
  float dist = max(length(cameraPosition-c), 0.1);
  float q1 = (y-15.0)/7.0, q2 = (y-26.0)/16.0, q3 = (y-8.0)/9.0;
  float E = 0.38*uTabI*exp(-y/7.0) + 0.5*(0.12+uChI)*step(10.0,c.z)*exp(-q1*q1)
    + 0.75*uPyI*exp(-(c.x*c.x+(c.z+30.0)*(c.z+30.0))/1400.0)*exp(-q2*q2) + 0.6*uTabI*step(c.z,-112.0)*step(-204.0,c.z)*exp(-q3*q3)*exp(-c.x*c.x/500.0);
  // (a petal is pale and a little translucent: white to shell pink; it gathers the hall's light from all round, so its
  // darkest is about half of white linen there; the candles stand below it and above it, so it takes most of their
  // light where it lies flat and most of the light that comes through it where it stands on edge: its shade follows
  // its own turning, not the eye; in the choir it takes the choir's own cool light as well)
  float fc = abs(n.y), face = 0.8+0.2*fc;
  vec3 thru = (uFlameCol*0.34*uGain + vec3(0.05,0.055,0.07) + uChoir*0.22*(1.0-smoothstep(-92.0,-72.0,c.z)))*(1.25-0.35*fc);
  vCol = mix(vec3(0.97,0.95,0.92), vec3(0.98,0.84,0.82), aK.w)*(uFlameCol*E*uGain*1.5*face + thru);
  vA = smoothstep(0.4, 0.6, 2.0*aK.z/(dist*uPix))*smoothstep(0.0,0.04,f)*(1.0-smoothstep(0.97,1.0,f)); vUv = uv*2.0-1.0;
  vec4 mvPosition = viewMatrix*vec4(wp,1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PETAL_FS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec2 vUv; varying vec3 vCol; varying float vA;
void main(){
  float r = length(vec2(vUv.x*1.12, vUv.y+0.3*vUv.x*vUv.x-0.12));            // a petal: broad, its far edge a little hollowed
  float a = (1.0-smoothstep(0.74,0.9,r))*vA; if (a < 0.02) discard;
  gl_FragColor = vec4(vCol*(0.86+0.14*vUv.y), a*0.88);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- 3. geometry helpers
const V2 = (x, y) => new THREE.Vector2(Math.max(x, 1e-4), y);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 8, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
// a box drawn only where it can be seen: skip = the faces left out (E east +x, W west, U up, D down, S south +z, N north, in its
// own frame); cols = a colour for a face, by its letter (the others white)
const BOX_F = { E: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1], [1, 0, 0]], W: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, 0, 0]],
  U: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1], [0, 1, 0]], D: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, -1, 0]],
  S: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], [0, 0, 1]], N: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1], [0, 0, -1]] };
function openBox(w, h, d, skip = '', cols = null) {
  const pos = [], nor = [], col = [], idx = []; let n = 0;
  for (const k of 'EWUDSN') { if (skip.includes(k)) continue; const f = BOX_F[k], c = cols && cols[k];
    for (let i = 0; i < 4; i++) { pos.push(f[i][0] * w / 2, f[i][1] * h / 2, f[i][2] * d / 2); nor.push(f[4][0], f[4][1], f[4][2]); col.push(c ? c.r : 1, c ? c.g : 1, c ? c.b : 1); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (cols) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); return g;
}
const lathe = (pts, seg = 10) => new THREE.LatheGeometry(pts.map((p) => V2(p[0], p[1])), seg);
// a box with its long edges chamfered (octagonal section along `axis`): no bare boxes near the eye
function bevelBox(w, h, d, bev = 0.12, axis = 'y') {
  const sh = new THREE.Shape(); const a = axis === 'y' ? w / 2 : axis === 'z' ? w / 2 : d / 2, b = axis === 'y' ? d / 2 : axis === 'z' ? h / 2 : h / 2;
  const c = Math.min(bev, a * 0.45, b * 0.45);
  sh.moveTo(-a + c, -b); sh.lineTo(a - c, -b); sh.lineTo(a, -b + c); sh.lineTo(a, b - c); sh.lineTo(a - c, b); sh.lineTo(-a + c, b); sh.lineTo(-a, b - c); sh.lineTo(-a, -b + c);
  const len = axis === 'y' ? h : axis === 'z' ? d : w;
  const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false, steps: 1 }); g.translate(0, 0, -len / 2);
  if (axis === 'y') g.rotateX(-PI / 2); else if (axis === 'x') g.rotateY(PI / 2);
  return g;
}
// a round-headed arch band (a frame round a window or door) in the plane x = 0, opening width w, total height h
function archBand(w, h, t, depth, seg = 8) {
  const sh = new THREE.Shape(); const r = w / 2, y0 = h - r;
  sh.moveTo(-r - t, 0); sh.lineTo(-r - t, y0);
  for (let i = 0; i <= seg; i++) { const a = PI - (i / seg) * PI; sh.lineTo(Math.cos(a) * (r + t), y0 + Math.sin(a) * (r + t)); }
  sh.lineTo(r + t, 0); sh.lineTo(r, 0); sh.lineTo(r, y0);
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * PI; sh.lineTo(Math.cos(a) * r, y0 + Math.sin(a) * r); }
  sh.lineTo(-r, 0); sh.lineTo(-r - t, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, steps: 1, curveSegments: 1 }); g.translate(0, 0, -depth / 2);
  return g;
}
// a round-headed pane (the glass itself) in the xy plane
function archPane(w, h, seg = 8) {
  const sh = new THREE.Shape(); const r = w / 2, y0 = h - r;
  sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, y0);
  for (let i = 1; i <= seg; i++) { const a = (i / seg) * PI; sh.lineTo(Math.cos(a) * r, y0 + Math.sin(a) * r); }
  sh.lineTo(-r, 0);
  return new THREE.ShapeGeometry(sh, 1);
}
const hex = (h) => new THREE.Color(h);
const shade = (h, k) => { const c = new THREE.Color(h); return c.multiplyScalar(k); };
// quad whose flat normal faces the point t
function quadTo(b, p0, p1, p2, p3, t, c, sf) {
  const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * (t[0] - p0[0]) + ny * (t[1] - p0[1]) + nz * (t[2] - p0[2]) >= 0) b.quad(p0, p1, p2, p3, c, sf); else b.quad(p0, p3, p2, p1, c, sf);
}
const C = { stone: '#5d5247', stoneD: '#453c34', oak: '#6a523a', oakD: '#4a3828', roof: '#6c5a4a', floor: '#66503a', linen: '#e8dfcc', linenD: '#cfc8bb', gilt: '#b8923f',
  seat: '#521019', silver: '#cfcac0', iron: '#2c2520', wax: '#efe2c4', pom: '#7a2a22', grape: '#3a1a30' };

// ---------------------------------------------------------------- 4. the shell
// a straight wall from (x0,z0) to (x1,z1), facing the point `inside`: large quiet ashlar to y 30; below y 10.2 an oak wainscot
// 0.35 m proud of it (raised-and-fielded panels and a carved frieze: the shader's) between a skirting and a moulded rail; at the
// wall head a carved gilt cornice 1.5 m high (y 28.9 to 30.4), 0.75 m proud of the wall
function wallRun(b, x0, z0, x1, z1, inside, h = 30) {
  const len = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / len, nz = (x1 - x0) / len;
  const s = (nx * (inside[0] - x0) + nz * (inside[2] - z0)) >= 0 ? 1 : -1, ox = nx * s * 0.35, oz = nz * s * 0.35;
  quadTo(b, [x0, 0, z0], [x1, 0, z1], [x1, h, z1], [x0, h, z0], inside, C.stone, S(K_STONE));
  quadTo(b, [x0 + ox, 0, z0 + oz], [x1 + ox, 0, z1 + oz], [x1 + ox, 10.2, z1 + oz], [x0 + ox, 10.2, z0 + oz], inside, C.oak, S(K_WOOD, 2, 0, Math.abs(x1 - x0) > Math.abs(z1 - z0) ? 1 : 0));
  const ry = Math.atan2(-(z1 - z0), x1 - x0);
  b.add(bevelBox(len, 0.5, 0.9, 0.16, 'x'), { p: [(x0 + x1) / 2 + ox, 10.35, (z0 + z1) / 2 + oz], r: [0, ry, 0], c: C.oak, surf: S(K_WOOD) });
  b.add(bevelBox(len, 0.8, 0.7, 0.2, 'x'), { p: [(x0 + x1) / 2 + ox * 0.6, 0.4, (z0 + z1) / 2 + oz * 0.6], r: [0, ry, 0], c: C.oakD, surf: S(K_WOOD) });
  b.add(bevelBox(len, 1.5, 1.5, 0.36, 'x'), { p: [(x0 + x1) / 2, h - 0.35, (z0 + z1) / 2], r: [0, ry, 0], c: C.gilt, surf: S(K_METAL, 0.6, 2, h - 0.35) });   // the cornice at the wall head: gilt, carved (the shader's)
}
// A PILASTER of the wainscot: (x, z) = its middle on the wainscot's face, (nx, nz) = into the hall. A fluted oak shaft 1.2 m
// wide and 0.12 m proud from y 0.8 to y 9.2 (the flutes are the shader's), on a plinth 1.5 m wide, under a capital block
function pilasterAt(b, x, z, nx, nz) {
  const along = Math.abs(nx) > 0.5, sf = S(K_WOOD, 3, along ? z : x, along ? 0 : 1), ry = Math.atan2(nx, nz);
  b.add(openBox(1.2, 8.4, 0.12, 'NUD'), { p: [x + nx * 0.06, 5.0, z + nz * 0.06], r: [0, ry, 0], c: C.oak, surf: sf });        // (no face that lies against the wall, the floor or another piece)
  b.add(openBox(1.5, 1.3, 0.24, 'ND'), { p: [x + nx * 0.12, 0.65, z + nz * 0.12], r: [0, ry, 0], c: C.oakD, surf: S(K_WOOD) });
  b.add(openBox(1.5, 0.9, 0.26, 'NU'), { p: [x + nx * 0.13, 9.65, z + nz * 0.13], r: [0, ry, 0], c: shade(C.oak, 1.12), surf: S(K_WOOD) });
}
// A SIDE WINDOW (nave, choir, the transepts' side walls): cx, cz = its foot centre on the wall plane, (nx, nz) = into the
// hall. Real depth: a stone frame stands 1.0 m into the hall round a round-headed opening (the glass 5.2 m wide, from y 12
// to y 28, springing y 25.4, 0.1 m from the wall), its reveal splayed from 2.6 m either side of the middle at the glass to
// 3.1 m at the frame's face, the face 0.4 m wide (3.5 m: clear of the dressers beside it); two mullions 0.87 m either
// side of the middle and a transom at y 20.3, each 0.3 m thick and 0.4 m deep; a sill 7 m long and 1.5 m deep on two corbels.
// The glass is the shader's: leaded diamond panes, coloured glass in the head.
const WIN_W = 5.2, WIN_H = 16, WIN_Y = 12;
function windowGeometry() {
  const b = INT.makeBuilder(), ST = S(K_STONE), N = 8, yc = WIN_H - WIN_W / 2;
  const prof = (r) => { const v = [[-r, 0], [-r, yc]]; for (let i = 1; i < N; i++) { const a = PI - (i / N) * PI; v.push([Math.cos(a) * r, yc + Math.sin(a) * r]); } v.push([r, yc], [r, 0]); return v; };
  const strip = (r0, d0, r1, d1, c, sign) => { const A = prof(r0), B = prof(r1);
    for (let i = 0; i < A.length - 1; i++) { const mx = (A[i][0] + A[i + 1][0]) / 2, my = (A[i][1] + A[i + 1][1]) / 2;       // (sign: which way the strip faces)
      quadTo(b, [A[i][0], A[i][1], d0], [A[i + 1][0], A[i + 1][1], d0], [B[i + 1][0], B[i + 1][1], d1], [B[i][0], B[i][1], d1],
        sign === 0 ? [mx, my, 99] : sign < 0 ? [0, Math.min(my, yc), 3] : [mx * 10, my < yc ? my : yc + (my - yc) * 10, 0.5], c, ST); } };
  strip(2.6, 0.1, 3.1, 1.0, C.stone, -1);                                      // the splayed reveal: it faces the middle and the hall
  strip(3.1, 1.0, 3.5, 1.0, C.stoneD, 0);                                      // the frame's face
  strip(3.5, 1.0, 3.5, 0.0, C.stoneD, 1);                                      // its outer side, back to the wall
  for (const x of [-0.87, 0.87]) b.add(openBox(0.3, 15.85, 0.4, 'NUD'), { p: [x, 15.85 / 2, 0.32], c: C.stoneD, surf: ST });      // (no face toward the glass, none inside the stone)
  b.add(openBox(WIN_W, 0.3, 0.4, 'NEW'), { p: [0, 8.3, 0.32], c: C.stoneD, surf: ST });
  b.add(bevelBox(7.0, 0.5, 1.5, 0.16, 'x'), { p: [0, -0.25, 0.75], c: C.stone, surf: ST });
  for (const x of [-2.6, 2.6]) b.add(box(0.5, 0.9, 0.9), { p: [x, -0.95, 0.45], c: C.stoneD, surf: ST, tint: (X, Y, Z, c, lx, ly, lz) => { if (ly < 0 && lz > 0) c.multiplyScalar(0.7); } });
  return b.build();
}
function windowAt(b, geo, cx, cz, nx, nz) {
  const ry = Math.atan2(nx, nz);
  b.add(geo, { p: [cx, WIN_Y, cz], r: [0, ry, 0] });
  b.add(archPane(WIN_W, WIN_H), { p: [cx + nx * 0.1, WIN_Y, cz + nz * 0.1], r: [0, ry, 0], c: '#ffffff', surf: S(K_PANE, 0, Math.abs(nx) > 0.5 ? cz : cx) });
}
// THE GREAT WINDOW of a transept's end wall (x = s * 62, centred on z -31): a round-headed opening 22 m wide from y 7 to
// y 38 (springing y 27) in a stone frame that stands 2.6 m into the hall, the leaded glass 2.1 m back in its reveal; four
// mullions (2.2 and 6.6 m either side of the middle) run from the sill to the arch, transoms cross at y 17 and y 27 with a
// round head under each in every light, and three lesser mullions divide the head. The hall shader's cold light on the
// transept floor (gwPatch) is cut by the same bars.
function greatWindow(b, s) {
  const ST = S(K_STONE), x = (d) => s * (62 - d), ry = -s * PI / 2, top = (dz) => 27 + Math.sqrt(Math.max(121 - dz * dz, 0));
  b.add(archBand(22, 31, 1.8, 2.6, 16), { p: [x(1.3), 7, -31], r: [0, ry, 0], c: C.stone, surf: ST });
  b.add(archBand(20.6, 30.3, 0.7, 0.9, 16), { p: [x(1.0), 7, -31], r: [0, ry, 0], c: C.stoneD, surf: ST });   // an inner order
  b.add(archPane(22, 31, 16), { p: [x(0.5), 7, -31], r: [0, ry, 0], c: '#ffffff', surf: S(K_PANE, 1) });
  b.add(bevelBox(3.4, 1.0, 27.2, 0.3, 'z'), { p: [x(1.6), 6.5, -31], c: C.stone, surf: ST });                // the sill
  for (const dz of [-6.6, -2.2, 2.2, 6.6]) { const h = top(dz) - 7 + 0.3;
    b.add(bevelBox(1.3, h, 0.7, 0.2, 'y'), { p: [x(1.1), 7 + h / 2, -31 + dz], c: C.stone, surf: ST }); }
  for (const dz of [-4.4, 0, 4.4]) { const h = top(dz) - 27 + 0.3;
    b.add(bevelBox(0.9, h, 0.4, 0.12, 'y'), { p: [x(1.0), 27 + h / 2, -31 + dz], c: C.stone, surf: ST }); }
  for (const y of [17, 27]) {
    b.add(bevelBox(1.1, 0.6, 22, 0.16, 'z'), { p: [x(1.0), y, -31], c: C.stone, surf: ST });
    for (let i = -2; i <= 2; i++) b.add(new THREE.TorusGeometry(1.6, 0.22, 4, 6, PI), { p: [x(1.0), y - 1.9, -31 + i * 4.4], r: [0, ry, 0], c: C.stoneD, surf: ST });
  }
}
// a 9 m door in a side wall (scale cue): round-headed oak leaves with iron straps
function doorAt(b, cx, cz, nx, nz) {
  const ry = Math.atan2(nx, nz);
  b.add(archBand(5.6, 9, 0.9, 1.3), { p: [cx + nx * 0.6, 0, cz + nz * 0.6], r: [0, ry, 0], c: C.stone, surf: S(K_STONE) });
  b.add(archPane(5.6, 9), { p: [cx + nx * 0.5, 0, cz + nz * 0.5], r: [0, ry, 0], c: C.oakD, surf: S(K_WOOD), tint: (x, y, z, c) => { const u = Math.floor((x + z) / 0.7); c.multiplyScalar(0.75 + 0.5 * ((u * 7919) % 5) / 5); } });
  for (const y of [1.6, 4.4, 6.4]) b.add(box(5.2, 0.28, 0.12), { p: [cx + nx * 0.58, y, cz + nz * 0.58], r: [0, ry, 0], c: C.iron, surf: S(K_METAL, 0.2) });
  b.add(new THREE.TorusGeometry(0.34, 0.07, 5, 10), { p: [cx + nx * 0.7 - nz * 0.5, 4.0, cz + nz * 0.7 + nx * 0.5], r: [0, ry, 0], c: C.gilt, surf: S(K_METAL, 0.7) });
}
// one hammerbeam truss across a 68 m span at z (eaves y 30, ridge y 46). Every timber is painted: its flanks a dull red,
// its underside dull gold (the roof's own light picks the undersides out from below); gilt pendants hang under the
// hammer beams' ends and gilt bosses sit where the arch braces meet under the collar and where the collar meets the rafters
const ROOF_T = [K_WOOD, 5, 0, 0], ROOF_RED = new THREE.Color('#4e2218'), ROOF_GOLD = new THREE.Color('#94702c');
function trussAt(b, z) {
  // (a timber is drawn without its ends, which lie in other timbers, and without the face that lies against the boards; of its
  // two long faces the one that looks down is the gilt one; an upright keeps all four, red)
  const piece = (x0, y0, x1, y1, t = 0.85) => {
    const len = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), ca = Math.cos(a), up = Math.abs(ca) < 0.05;
    const cols = { S: ROOF_RED, N: ROOF_RED, U: up || ca >= 0 ? ROOF_RED : ROOF_GOLD, D: up || ca < 0 ? ROOF_RED : ROOF_GOLD };
    b.add(openBox(len, t, t * 0.8, up ? 'EW' : ca >= 0 ? 'EWU' : 'EWD', cols), { p: [(x0 + x1) / 2, (y0 + y1) / 2, z], r: [0, 0, a], surf: ROOF_T });
  };
  const G = S(K_METAL, 0.7), boss = (x, y, k) => b.add(lathe([[0, -0.8 * k], [0.65 * k, -0.1 * k], [0, 0.35 * k]], 4), { p: [x, y, z], r: [0, PI / 4, 0], c: C.gilt, surf: G });
  for (const s of [-1, 1]) {
    piece(s * 34, 30, s * 0.2, 45.9, 1.3);                                    // principal rafter
    piece(s * 34, 30.2, s * 25.5, 30.2, 1.4);                                 // hammer beam
    piece(s * 25.8, 30.6, s * 25.8, 33.6, 1.1);                               // hammer post
    let px = s * 33.6, py = 23.5;                                             // wall brace under the hammer beam
    for (let i = 1; i <= 3; i++) { const a = (i / 3) * PI / 2, x = s * (33.6 - 7.6 * Math.sin(a)), y = 23.5 + 6.2 * (1 - Math.cos(a)); piece(px, py, x, y, 0.9); px = x; py = y; }
    px = s * 25.8; py = 31.0;                                                 // the great arch brace to the collar
    for (let i = 1; i <= 5; i++) { const a = (i / 5) * PI / 2, x = s * (25.8 - 25.8 * Math.sin(a)), y = 31.0 + 8.6 * Math.sin(a) * (0.55 + 0.45 * Math.sin(a)); piece(px, py, x, y, 1.0); px = x; py = y; }
    b.add(lathe([[0, -1.4], [0.42, -0.9], [0.22, -0.5], [0.62, 0], [0, 0.15]], 4), { p: [s * 25.5, 29.5, z], r: [0, PI / 4, 0], c: C.gilt, surf: G });   // the pendant
    boss(s * 12.8, 39.4, 0.8);
    // the wall shaft (y 23.5 to 29.9) on its corbel (y 22.2 to 23.5): both above the hangings' rods (y 21.95) and the dressers' heads
    b.add(bevelBox(1.2, 6.4, 0.7, 0.2, 'y'), { p: [s * 33.6, 26.7, z], c: C.stone, surf: S(K_STONE) });
    b.add(lathe([[0, 0], [0.5, 0.2], [0.95, 0.9], [1.1, 1.3], [0, 1.3]], 4), { p: [s * 33.5, 22.2, z], c: C.stoneD, surf: S(K_STONE) });
  }
  piece(-12.8, 40, 12.8, 40, 1.2);                                            // collar
  piece(0, 40.6, 0, 45.6, 1.0);                                               // king post
  boss(0, 39.1, 1.25);
}
// the boarded slopes (the paint is the shader's: surf.y = 4), a ridge piece and two purlins a side along z
function roofRun(b, z0, z1) {
  const mid = [0, 20, (z0 + z1) / 2], len = Math.abs(z1 - z0);
  for (const s of [-1, 1]) {
    quadTo(b, [s * 34, 30, z0], [s * 34, 30, z1], [0, 46, z1], [0, 46, z0], mid, '#ffffff', S(K_WOOD, 4, 0));
    for (const f of [0.33, 0.66]) b.add(bevelBox(0.9, 0.9, len, 0.18, 'z'), { p: [s * 34 * (1 - f), 30 + 16 * f - 0.6, (z0 + z1) / 2], c: ROOF_GOLD, surf: ROOF_T });
  }
  b.add(bevelBox(1.1, 1.1, len, 0.22, 'z'), { p: [0, 45.4, (z0 + z1) / 2], c: ROOF_GOLD, surf: ROOF_T });
}
// A GREAT CROSSING ARCH in the plane z = 0 of its own frame, centred on x = 0: a stone wall 2.4 m thick from pier centre to
// pier centre (half-width H) and up to the crossing's ceiling (y 46), pierced by a depressed pointed arch whose soffit
// (y 43 at the crown, 25.6 at the jambs, 1.6 m inside H) lies everywhere under the roof slope that ends against it
// (46 - 16 |x| / H); a ring of darker voussoirs 1.3 m deep and 3.0 m thick round the opening, and a keystone.
const archY = (t) => 43 - 15.2 * Math.pow(Math.abs(t), 1.5) - 2.2 * (1 - Math.sqrt(Math.max(1 - Math.pow(t, 8), 0)));
function crossArch(b, H, o) {
  const h = H - 1.6, N = 14, pts = [];
  for (let i = -N; i <= N; i++) { const t = Math.sin((i / N) * PI / 2); pts.push([t * h, archY(t)]); }
  const wall = new THREE.Shape(); wall.moveTo(-H, 25.6); wall.lineTo(-H, 46); wall.lineTo(H, 46); wall.lineTo(H, 25.6);
  for (let i = pts.length - 1; i >= 0; i--) wall.lineTo(pts[i][0], pts[i][1]);
  wall.lineTo(-H, 25.6);
  const ring = new THREE.Shape(), outer = [];
  for (let i = 0; i < pts.length; i++) {                                     // the voussoirs: the soffit line pushed 1.3 m outward along its own normal
    const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, pts.length - 1)], l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
    outer.push([pts[i][0] - (c[1] - a[1]) / l * 1.3, pts[i][1] + (c[0] - a[0]) / l * 1.3]); }
  ring.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ring.lineTo(pts[i][0], pts[i][1]);
  for (let i = outer.length - 1; i >= 0; i--) ring.lineTo(outer[i][0], outer[i][1]);
  ring.lineTo(pts[0][0], pts[0][1]);
  const ex = (sh, d) => { const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, steps: 1, curveSegments: 1 }); g.translate(0, 0, -d / 2); return g; };
  b.add(ex(wall, 2.4), { ...o, c: C.stone, surf: S(K_STONE, 1, H, o.r ? 1 : 0) });       // (surf.y = 1: painted; surf.z = its half width; surf.w = 1 where it runs along z)
  b.add(ex(ring, 3.0), { ...o, c: C.stoneD, surf: S(K_STONE) });
  b.add(bevelBox(2.2, 3.4, 3.5, 0.3, 'z'), { ...o, p: [o.p[0], 43.6, o.p[2]], c: C.stone, surf: S(K_STONE) });   // the keystone
}
async function buildShell(ctx, bN, bX, bC) {
  const F = S(K_FLOOR), ST = S(K_STONE), up = [0, 100, 0];
  // floors
  quadTo(bN, [-34, 0, 10], [34, 0, 10], [34, 0, 246], [-34, 0, 246], up, C.floor, F);
  quadTo(bX, [-62, 0, -72], [62, 0, -72], [62, 0, 10], [-62, 0, 10], up, C.floor, F);
  quadTo(bC, [-34, 0, -246], [34, 0, -246], [34, 0, -72], [-34, 0, -72], up, C.floor, F);
  // nave
  for (const s of [-1, 1]) wallRun(bN, s * 34, 10, s * 34, 240, [0, 0, 100]);
  wallRun(bN, -34, 240, 34, 240, [0, 0, 100], 30);
  quadTo(bN, [-34, 30, 240], [34, 30, 240], [0, 46, 240], [0, 46, 240], [0, 0, 100], C.stoneD, ST);
  roofRun(bN, 10, 240);
  const wGeo = windowGeometry();
  for (let k = 0; k < 13; k++) {
    for (const s of [-1, 1]) windowAt(bN, wGeo, s * 34, WIN_NAVE(k), -s, 0);
    trussAt(bN, 24 + 16 * k);
    await ctx.yield();
  }
  for (const s of [-1, 1]) for (const z of [88, 168]) doorAt(bN, s * 34, z, -s, 0);
  await ctx.yield();
  // crossing and transepts: a flat beamed ceiling over the crossing, the transept roofs ridge east-west
  for (const s of [-1, 1]) {
    wallRun(bX, s * 34, 10, s * 62, 10, [s * 48, 0, -30]);
    wallRun(bX, s * 34, -72, s * 62, -72, [s * 48, 0, -30]);
    wallRun(bX, s * 62, 10, s * 62, -72, [0, 0, -30]);
    quadTo(bX, [s * 62, 30, 10], [s * 62, 30, -72], [s * 62, 46, -31], [s * 62, 46, -31], [0, 0, -30], C.stoneD, ST);
    for (const zz of [10, -72]) quadTo(bX, [s * 34, 30, zz], [s * 62, 30, zz], [s * 62, 46, -31], [s * 34, 46, -31], [s * 48, 20, -31], '#ffffff', S(K_WOOD, 4, 1));
    for (const zz of [10, -72]) {                                             // spandrels above the transept, nave and choir roofs
      quadTo(bX, [s * 34, 30, zz], [s * 34, 46, zz], [s * 34, 46, -31], [s * 34, 46, -31], [0, 30, -31], C.stoneD, ST);
      quadTo(bX, [s * 34, 30, zz], [s * 34, 46, zz], [0, 46, zz], [0, 46, zz], [0, 30, -31], C.stoneD, ST);
    }
    greatWindow(bX, s);
    for (const z of [10, -72]) windowAt(bX, wGeo, s * 48, z, 0, z > 0 ? -1 : 1);
    for (const x of [41, 48, 55]) bX.add(bevelBox(0.8, 0.8, 44, 0.16, 'z'), { p: [s * x, 37.4, -31], c: ROOF_RED, surf: ROOF_T });
    bX.add(bevelBox(28, 0.9, 0.9, 0.18, 'x'), { p: [s * 48, 45.5, -31], c: ROOF_GOLD, surf: ROOF_T });
    await ctx.yield();
  }
  quadTo(bX, [-34, 46, -72], [34, 46, -72], [34, 46, 10], [-34, 46, 10], [0, 0, -30], '#ffffff', S(K_WOOD, 4, 2));
  for (let i = -3; i <= 3; i++) {                                              // its beams: gilt, a gilt boss under every second crossing of two (none at the middle, where the great boss hangs)
    bX.add(bevelBox(1.3, 1.6, 82, 0.25, 'z'), { p: [i * 9.7, 45.2, -31], c: ROOF_GOLD, surf: ROOF_T });
    bX.add(bevelBox(68, 1.3, 1.2, 0.22, 'x'), { p: [0, 45.0, -31 + i * 11.7], c: ROOF_GOLD, surf: ROOF_T });
    for (let j = -3; j <= 3; j++) if ((i + j) % 2 === 0 && (i || j)) bX.add(lathe([[0, -0.9], [0.7, -0.1], [0, 0.3]], 4), { p: [i * 9.7, 44.4, -31 + j * 11.7], r: [0, PI / 4, 0], c: C.gilt, surf: S(K_METAL, 0.7) });
  }
  // four gilt ribs run from the corners to the middle, where they and the two middle beams meet in one great gilt boss
  // (3.8 m in radius, hanging 3.0 m below the boards, in eight lobes); the corona's six rods hang round it, 5.4 m out
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bX.add(bevelBox(1.1, 1.5, 49, 0.22, 'z'), { p: [sx * 16.6, 45.05, -31 + sz * 20], r: [0, sx * sz * Math.atan2(34, 41), 0], c: ROOF_GOLD, surf: ROOF_T });
  { const g = lathe([[0.02, -3.0], [0.9, -2.75], [1.3, -2.2], [1.1, -1.7], [2.6, -1.2], [3.8, -0.5], [3.5, 0.1], [0.02, 0.2]], 16), q = g.attributes.position;
    for (let i = 0; i < q.count; i++) { const r = Math.hypot(q.getX(i), q.getZ(i)), k = 1 + 0.07 * Math.cos(8 * Math.atan2(q.getZ(i), q.getX(i))) * smoothstep(1.2, 3.0, r); q.setXYZ(i, q.getX(i) * k, q.getY(i), q.getZ(i) * k); }
    g.computeVertexNormals(); bX.add(g, { p: [0, 46, -31], c: C.gilt, surf: S(K_METAL, 0.7) }); }
  await ctx.yield();
  for (const zz of [10, -72]) for (const s of [-1, 1]) {                       // great corner piers of the crossing
    bX.add(bevelBox(3.2, 30, 3.2, 0.7, 'y'), { p: [s * 34, 15, zz], c: C.stone, surf: ST });
    bX.add(bevelBox(4.0, 1.2, 4.0, 0.5, 'y'), { p: [s * 34, 10.6, zz], c: C.stoneD, surf: ST });
    bX.add(bevelBox(4.2, 1.6, 4.2, 0.6, 'y'), { p: [s * 34, 0.8, zz], c: C.stoneD, surf: ST });
    bX.add(bevelBox(4.2, 1.4, 4.2, 0.6, 'y'), { p: [s * 34, 29.6, zz], c: C.stoneD, surf: ST });
    bX.add(bevelBox(4.6, 1.2, 4.6, 0.5, 'y'), { p: [s * 34, 25.0, zz], c: C.stoneD, surf: ST });      // the impost the arches spring from
  }
  // THE FOUR CROSSING ARCHES: the nave's, the choir's and both transepts' roofs end against solid masonry, each wall
  // standing from its arch to the crossing's ceiling
  for (const zz of [10, -72]) crossArch(bX, 34, { p: [0, 0, zz] });
  for (const s of [-1, 1]) crossArch(bX, 41, { p: [s * 34, 0, -31], r: [0, PI / 2, 0] });
  await ctx.yield();
  // choir
  for (const s of [-1, 1]) wallRun(bC, s * 34, -72, s * 34, -246, [0, 0, -160]);
  roofRun(bC, -72, -246);
  for (let k = 0; k < 10; k++) {
    for (const s of [-1, 1]) windowAt(bC, wGeo, s * 34, WIN_CHOIR(k), -s, 0);
    trussAt(bC, -80 - 16 * k);
    if ((k & 3) === 3) await ctx.yield();
  }
  // the north wall and its great doorway: an arch 18 wide and 20 tall, open on the terrace and the night
  for (const s of [-1, 1]) wallRun(bC, s * 34, -246, s * 9.6, -246, [0, 0, -160]);
  { const sh = new THREE.Shape(); sh.moveTo(-9.6, 11); sh.lineTo(-9.6, 30); sh.lineTo(0, 46); sh.lineTo(9.6, 30); sh.lineTo(9.6, 11);
    for (let i = 1; i <= 16; i++) { const a = (i / 16) * PI; sh.lineTo(Math.cos(a) * 9, 11 + Math.sin(a) * 9); }
    sh.lineTo(-9.6, 11);
    bC.add(new THREE.ShapeGeometry(sh, 1), { p: [0, 0, -246], c: C.stone, surf: ST }); }
  for (const s of [-1, 1]) quadTo(bC, [s * 9.6, 30, -246], [s * 34, 30, -246], [0, 46, -246], [0, 46, -246], [0, 0, -160], C.stoneD, ST);
  bC.add(archBand(18, 20, 1.5, 4.4, 20), { p: [0, 0, -247.6], c: C.stone, surf: ST });
  bC.add(archBand(18.9, 20.45, 0.9, 1.0, 20), { p: [0, 0, -245.2], c: C.stoneD, surf: ST });
  for (const s of [-1, 1]) {
    bC.add(bevelBox(2.6, 1.6, 5.2, 0.4, 'z'), { p: [s * 10.0, 0.8, -247.4], c: C.stoneD, surf: ST });
    bC.add(bevelBox(2.4, 1.0, 5.0, 0.3, 'z'), { p: [s * 9.9, 11.2, -247.4], c: C.stoneD, surf: ST });
  }
  // the terrace beyond: flags, a balustrade and two urns against the stars
  quadTo(bC, [-40, -0.02, -330], [40, -0.02, -330], [40, -0.02, -246], [-40, -0.02, -246], up, C.stoneD, ST);
  wGeo.dispose();
  bC.add(bevelBox(60, 0.5, 1.0, 0.16, 'x'), { p: [0, 4.2, -292], c: C.stone, surf: ST });
  bC.add(bevelBox(60, 0.6, 1.2, 0.2, 'x'), { p: [0, 0.3, -292], c: C.stoneD, surf: ST });
  for (let i = -13; i <= 13; i++) bC.add(lathe([[0.4, 0], [0.56, 0.5], [0.26, 1.3], [0.58, 2.4], [0.26, 3.3], [0.4, 3.6]], 4), { p: [i * 2.2, 0.5, -292], c: C.stone, surf: ST });
  for (const s of [-1, 1]) bC.add(lathe([[0.9, 0], [1.0, 0.5], [0.4, 1.2], [1.3, 2.6], [1.7, 4.2], [1.3, 4.5], [0, 4.5]], 10), { p: [s * 14.5, 4.4, -292], c: C.stone, surf: ST });
  await ctx.yield();
}

// ---------------------------------------------------------------- 5. linen, chairs, sticks, garlands
// a linen-draped table: top at yTop, the cloth hanging to yHem in real pleats, a dark trestle underneath. THE PLEATS' LAW
// (the shader shades by the same): along the cloth, in the world's own z (or x on the end faces), a ridge every `pitch`
// metres (1.6; 0.8 on the dais ranks): the hem swings out by 0.05 m in each valley and 0.05 + amp on each ridge
// (amp 0.21; at the finer pitch each pleat has its own, 0.135 to 0.405 m, by the shader's h11 of the pleat's number), by a
// triangle wave, so a table's ends need not fall on a fold
function linenTable(b, cx, z0, z1, half, yTop, yHem, surf, yFloor, pitch = 1.6) {
  const L = C.linen, Ld = C.linenD, up = [cx, 100, 0], h = pitch > 1 ? pitch / 2 : pitch / 4, fr1 = (x) => ((x % 1) + 1) % 1;   // (a rank's pleat is drawn in four pieces, a long table's in two)
  const h11 = (p) => { p = fr1(p * 0.1031); p *= p + 33.33; p *= p + p; return fr1(p); };       // (the shader's h11)
  const amp = (c) => pitch > 1 ? 0.21 : 0.3 * (0.45 + 0.9 * h11(Math.floor(c / pitch)));
  const off = (c) => 0.05 + amp(c - 1e-4) * (0.5 - 0.5 * Math.cos(TAU * fr1(c / pitch)));       // (the smooth pleat: the shader's law)
  const run = (a0, a1) => { const v = [a0]; for (let i = Math.ceil(a0 / h + 1e-6); i <= Math.floor(a1 / h - 1e-6); i++) v.push(i * h); v.push(a1); return v; };
  quadTo(b, [cx - half, yTop, z0], [cx + half, yTop, z0], [cx + half, yTop, z1], [cx - half, yTop, z1], up, L, surf);
  const zs = run(z0, z1), xs = run(cx - half, cx + half);
  for (const s of [-1, 1]) for (let i = 0; i < zs.length - 1; i++) { const a = zs[i], c = zs[i + 1], x = cx + s * half;
    quadTo(b, [x, yTop, a], [x, yTop, c], [x + s * off(c), yHem, c], [x + s * off(a), yHem, a], [cx + s * 50, yTop, a], Ld, surf); }
  for (const [z, s] of [[z0, -1], [z1, 1]]) for (let i = 0; i < xs.length - 1; i++) { const a = xs[i], c = xs[i + 1];
    quadTo(b, [a, yTop, z], [c, yTop, z], [c, yHem, z + s * off(c)], [a, yHem, z + s * off(a)], [a, yTop, z + s * 50], Ld, surf); }
  b.add(box(half * 2 - 0.9, yHem - yFloor + 0.3, z1 - z0 - 0.9), { p: [cx, (yHem + yFloor + 0.3) / 2, (z0 + z1) / 2], c: '#1c120b', surf: S(K_WOOD) });
}
// THE CHAIR, of our own pattern: origin on the floor, front toward +z, 4 m to the tips of its finials. A high upholstered
// back: an upholstered panel in a gilt frame (two posts, a rail below, a rail above), a carved crest that rises 0.36 m to a
// point between two scrolls, a finial on each post; an upholstered seat (darker under its edge; the shaped chair's on a gilt
// rail); four tapered legs. The cloth is crimson in the piece and is dyed by its instance's colour (build() deals three
// upholsteries by table). Three weights, dealt
// by place: this plain one is the same silhouette in 43 triangles (the legs four flat strips, the crest one flat piece).
function crestGeometry(pts, depth) {                                         // a flat carved piece standing on y = 0 in the xy plane, `depth` thick
  const pos = [], h = depth / 2;
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], c = pts[i + 1];
    pos.push(0, 0, h, a[0], a[1], h, c[0], c[1], h, 0, 0, -h, c[0], c[1], -h, a[0], a[1], -h);
    if (depth > 0.02) pos.push(a[0], a[1], h, a[0], a[1], -h, c[0], c[1], -h, a[0], a[1], h, c[0], c[1], -h, c[0], c[1], h); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
function chairGeometry() {
  const b = INT.makeBuilder(), G = S(K_METAL, 0.6), R = S(K_PLAIN, 0, 2), gilt = '#a8853c', crim = '#641622';
  for (const s of [-1, 1]) for (const z of [-0.8, 0.76]) b.quad([s * 0.8 - 0.08, 0, z - s * 0.08], [s * 0.8 + 0.08, 0, z + s * 0.08], [s * 0.8 + 0.08, 1.72, z + s * 0.08], [s * 0.8 - 0.08, 1.72, z - s * 0.08], gilt, G);
  b.add(box(1.84, 0.4, 1.78), { p: [0, 1.9, 0], c: crim, surf: R, tint: (x, y, z, c, lx, ly) => { if (ly < 0) c.multiplyScalar(0.5); } });   // the upholstered seat, darker under its edge
  b.add(box(1.84, 1.3, 0.14), { p: [0, 2.96, -0.86], c: gilt, surf: G });                                              // the back's frame
  b.quad([-0.7, 2.5, -0.78], [0.7, 2.5, -0.78], [0.7, 3.42, -0.78], [-0.7, 3.42, -0.78], crim, R);                       // its crimson panel
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.8, 3.6, -0.86, 0.8, 3.6, -0.86, 0, 3.97, -0.86, -0.8, 3.6, -0.86, -0.5, 3.6, -0.86, -0.62, 3.84, -0.86, 0.8, 3.6, -0.86, 0.62, 3.84, -0.86, 0.5, 3.6, -0.86], 3));
    g.computeVertexNormals(); b.add(g, { c: gilt, surf: G }); }                                                          // the crest: a point between two scrolls
  for (const s of [-1, 1]) b.add(new THREE.ConeGeometry(0.11, 0.4, 3, 1, true), { p: [s * 0.86, 3.8, -0.86], c: gilt, surf: G });
  return b.build();
}
// the same chair for a seat that nobody passes within 13 m and that stands in to its table, in its fewest faces (19
// triangles): the two back legs (the front ones stand under the cloth's edge), the seat without its underside and without
// the face under the table's edge, the back as its two faces with the upholstered panel, a crest of one point
function chairGeometryFar() {
  const b = INT.makeBuilder(), G = S(K_METAL, 0.6), R = S(K_PLAIN, 0, 2), gilt = '#a8853c', crim = '#641622';
  for (const s of [-1, 1]) for (const z of [-0.8]) b.quad([s * 0.8 - 0.08, 0, z - s * 0.08], [s * 0.8 + 0.08, 0, z + s * 0.08], [s * 0.8 + 0.08, 1.72, z + s * 0.08], [s * 0.8 - 0.08, 1.72, z - s * 0.08], gilt, G);
  b.add(openBox(1.84, 0.4, 1.78, 'DS'), { p: [0, 1.9, 0], c: crim, surf: R, tint: (x, y, z, c, lx, ly) => { if (ly < 0) c.multiplyScalar(0.5); } });
  b.add(openBox(1.84, 1.3, 0.14, 'EWUD'), { p: [0, 2.96, -0.86], c: gilt, surf: G });
  b.quad([-0.7, 2.5, -0.78], [0.7, 2.5, -0.78], [0.7, 3.42, -0.78], [-0.7, 3.42, -0.78], crim, R);
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.8, 3.6, -0.86, 0.8, 3.6, -0.86, 0, 3.97, -0.86], 3));
    g.computeVertexNormals(); b.add(g, { c: gilt, surf: G }); }
  return b.build();
}
// the same chair for the rows nearest the route (a seat within 8.6 m of the flown line, and the dais ranks): square tapered
// legs and posts, turned finials, a padded seat that is lighter on its crown, the panel padded, the crest carved in
// the round (0.1 m thick). 156 triangles.
function chairGeometryNear() {
  const b = INT.makeBuilder(), G = S(K_METAL, 0.95), R = S(K_PLAIN, 0, 2), gilt = '#c29a46', giltD = '#8a6c30', crim = '#6e1824';
  for (const s of [-1, 1]) {
    b.add(cyl(0.085, 0.11, 3.62, 4, true), { p: [s * 0.86, 1.81, -0.86], r: [0, PI / 4, 0], c: gilt, surf: G,
      tint: (x, y, z, c, lx, ly) => { if (ly < 0) c.set(giltD); } });                                                // back leg and post in one
    b.add(cyl(0.1, 0.055, 1.7, 4, true), { p: [s * 0.8, 0.85, 0.76], r: [0, PI / 4, 0], c: giltD, surf: G });
    b.add(new THREE.OctahedronGeometry(1, 0), { p: [s * 0.86, 3.8, -0.86], s: [0.12, 0.2, 0.12], c: gilt, surf: G });  // a finial
  }
  b.add(box(1.86, 0.18, 1.8), { p: [0, 1.76, 0], c: giltD, surf: G });                                                // the seat rail
  b.add(bevelBox(1.9, 0.46, 1.84, 0.18, 'x'), { p: [0, 2.06, 0.02], c: crim, surf: R,
    tint: (x, y, z, c, lx, ly, lz) => { c.multiplyScalar(ly > 0.1 ? 1.25 - 0.3 * Math.abs(lz) : 0.7); } });           // the crimson pad: lighter on its crown
  for (const y of [2.42, 3.5]) b.add(box(1.62, 0.16, 0.1), { p: [0, y, -0.86], c: gilt, surf: G });                    // the frame's rails
  b.add(box(1.6, 0.96, 0.15), { p: [0, 2.96, -0.86], c: crim, surf: R,
    tint: (x, y, z, c, lx, ly, lz) => { if (lz < 0) c.multiplyScalar(0.55); } });                                    // the panel: upholstered, darker behind
  b.add(crestGeometry([[-0.78, 0], [-0.72, 0.2], [-0.5, 0.12], [-0.25, 0.2], [0, 0.39], [0.25, 0.2], [0.5, 0.12], [0.72, 0.2], [0.78, 0]], 0.1), { p: [0, 3.58, -0.86], c: gilt, surf: G });
  return b.build();
}
// a rope of leaves swagged round a drum of radius r whose top is at y = top: a continuous dark band along the swag
// with pointed leaves laid over it, overlapping, turned alternately up and down, and a pomegranate where every
// third swag is pinned up
function ropeGarland(b, rng, cx, cz, r, top, leafHex, detail) {
  const swags = Math.max(4, Math.round(r * 1.1)), base = hex(leafHex), c = new THREE.Color(), R0 = r + 0.2;
  const yAt = (t) => top - 0.2 - 0.5 * Math.abs(Math.sin(t * swags * PI));
  const steps = swags * 6, band = shade(leafHex, 0.42), P0 = S(K_PLAIN);
  for (let i = 0; i < steps; i++) {
    const t0 = i / steps, t1 = (i + 1) / steps, a0 = t0 * TAU, a1 = t1 * TAU, y0 = yAt(t0), y1 = yAt(t1);
    quadTo(b, [cx + Math.cos(a0) * R0, y0 - 0.13, cz + Math.sin(a0) * R0], [cx + Math.cos(a1) * R0, y1 - 0.13, cz + Math.sin(a1) * R0],
      [cx + Math.cos(a1) * R0, y1 + 0.13, cz + Math.sin(a1) * R0], [cx + Math.cos(a0) * R0, y0 + 0.13, cz + Math.sin(a0) * R0], [cx + Math.cos(a0) * 99, y0, cz + Math.sin(a0) * 99], band, P0);
  }
  const leaf = new THREE.BufferGeometry();
  leaf.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0, -0.2, 0.05, 0.5, 0, 0, 0, 0.2, 0.05], 3));
  leaf.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  leaf.setIndex([0, 1, 2, 0, 2, 3]);
  const n = Math.max(swags * 4, Math.round(r * TAU / 0.4 * detail));
  for (let i = 0; i < n; i++) {
    const t = (i + rng.range(-0.25, 0.25)) / n, a = t * TAU, ca = Math.cos(a), sa = Math.sin(a), rr = R0 + 0.05 + (i % 3) * 0.02;
    const slope = -0.5 * swags * PI * Math.cos(t * swags * PI) * Math.sign(Math.sin(t * swags * PI) || 1) / (r * TAU);     // the swag's own slope
    c.copy(base).multiplyScalar(rng.range(0.7, 1.35)); c.g *= rng.range(0.92, 1.15);
    b.add(leaf, { p: [cx + ca * rr, yAt(t) + ((i & 1) ? 0.07 : -0.07), cz + sa * rr], r: [rng.range(-0.25, 0.25), Math.atan2(ca, sa), -Math.atan(slope) + ((i & 1) ? 0.55 : -0.55) + rng.range(-0.2, 0.2)],
      s: rng.range(0.6, 0.8), c, surf: P0 });
  }
  for (let j = 0; j < swags; j += 3) {
    const a = (j / swags) * TAU, q = [cx + Math.cos(a) * (R0 + 0.16), top - 0.24, cz + Math.sin(a) * (R0 + 0.16)], pr = rng.range(0.19, 0.24);
    b.add(new THREE.SphereGeometry(pr, 6, 4), { p: q, c: shade(C.pom, rng.range(0.9, 1.4)), surf: S(K_METAL, 0.15) });
    b.add(cyl(pr * 0.34, pr * 0.2, pr * 0.3, 5, true), { p: [q[0], q[1] - pr * 0.95, q[2]], r: [PI, 0, 0], c: shade(C.pom, 0.7), surf: P0 });
  }
  leaf.dispose();
}
// a candle in a turned silver stick with a drip pan; stub = how far it has burned down, rise = how much taller the stick
// is (0, or 0.6 for a tall one; slim: how much narrower it is drawn, 1 or the pyramid's 0.78). Flame base at y 0.98 - stub + rise. Three weights, dealt by place: the fine one (a foot
// within 9 m of the flown line; 103 triangles) is turned in five sides with a knop and a moulded pan and carries a dark
// wick end, a cupped pool of wax that glows (the wax is lit from within over its top 0.15 m) and two runs of wax down its
// sides; the plain one (27 triangles) is the same silhouette in three sides; the far one (a foot 16 m or more from the
// line; 18 triangles) the same again with its foot, stem and pan in two rings.
function stickGeometry(stub, rise = 0, fine = false, far = false) {
  const b = INT.makeBuilder(), top = 0.94 - stub + rise, SV = S(K_METAL, 0.9), WAX = S(K_PLAIN, 0.55);
  if (far) {                                                                 // (beyond 16 m of the flown line: foot, stem and pan in two rings, the candle open)
    b.add(lathe([[0.29, 0], [0.07, 0.3 + rise * 0.8], [0.21, 0.5 + rise]], 3), { c: C.silver, surf: SV });
    b.add(cyl(0.07, 0.078, top - 0.5 - rise, 3, true), { p: [0, (top + 0.5 + rise) / 2, 0], c: C.wax, surf: WAX, grad: [top - 0.15, top, 0.5, 1.5] });
    return b.build();
  }
  if (!fine) {
    b.add(lathe([[0.29, 0], [0.08, 0.14], [0.065, 0.36 + rise], [0.21, 0.5 + rise]], 3), { c: C.silver, surf: SV });
    b.add(cyl(0.07, 0.078, top - 0.5 - rise, 3, true), { p: [0, (top + 0.5 + rise) / 2, 0], c: C.wax, surf: WAX, grad: [top - 0.15, top, 0.5, 1.5] });
    b.add(new THREE.ConeGeometry(0.07, 0.02, 3, 1, true), { p: [0, top, 0], c: C.wax, surf: S(K_PLAIN, 1.0) });
    return b.build();
  }
  b.add(lathe([[0.30, 0], [0.2, 0.06], [0.08, 0.14], [0.06, 0.24 + rise * 0.5], [0.11, 0.3 + rise * 0.5], [0.06, 0.36 + rise], [0.245, 0.48 + rise], [0.09, 0.5 + rise]], 5),
    { c: C.silver, surf: SV });
  b.add(cyl(0.07, 0.078, top - 0.52 - rise, 5, true), { p: [0, (top + 0.52 + rise) / 2, 0], c: C.wax, surf: WAX, grad: [top - 0.15, top, 0.5, 1.5] });
  b.add(new THREE.ConeGeometry(0.07, 0.03, 5, 1, true), { p: [0, top - 0.015, 0], r: [PI, 0, 0], c: shade(C.wax, 1.2), surf: S(K_PLAIN, 1.0) });      // the pool: a shallow cup, bright
  b.add(cyl(0.007, 0.011, 0.075, 3, true), { p: [0.004, top + 0.015, 0], r: [0.2, 0, 0.12], c: '#140e0a', surf: S(K_PLAIN) });                 // the wick end
  const runs = stub > 0.1 ? [[0.6, 0.2], [2.9, 0.26], [4.6, 0.16]] : [[0.6, 0.3], [3.4, 0.17]];                                            // the runs of wax: where round the candle, how long
  for (const [a, len] of runs.slice(0, 2)) b.add(cyl(0.015, 0.024, Math.min(len, top - 0.56 - rise), 3, true), { p: [Math.cos(a) * 0.078, top - 0.02 - Math.min(len, top - 0.56 - rise) / 2, Math.sin(a) * 0.078], c: shade(C.wax, 1.08), surf: S(K_PLAIN, 0.4) });
  return b.build();
}
// the head of a candle that stands near the flown line: a dark wick end, a cupped pool of bright wax, two runs down its side
// ((x, y, z) = the middle of its top, r = its radius)
function candleTop(b, x, y, z, r) {
  b.add(new THREE.ConeGeometry(r, 0.03, 5, 1, true), { p: [x, y - 0.015, z], r: [PI, 0, 0], c: shade(C.wax, 1.2), surf: S(K_PLAIN, 1.0) });
  b.add(new THREE.ConeGeometry(0.011, 0.08, 3, 1, true), { p: [x + 0.004, y + 0.02, z], r: [0.2, 0, 0.12], c: '#140e0a', surf: S(K_PLAIN) });
  for (const [a, len] of [[0.6, 0.3], [3.4, 0.17]]) b.add(cyl(0.015, 0.026, len, 3, true), { p: [x + Math.cos(a) * r, y - 0.02 - len / 2, z + Math.sin(a) * r], c: shade(C.wax, 1.08), surf: S(K_PLAIN, 0.4) });
}
// leaves strewn along a line on a surface (instanced folded leaves, a little lifted and turned), with fruit now and then
function garland(b, rng, at, n, leaves, o = {}) {
  const size = (o.size || 0.42) * 1.15;
  const p = [0, 0, 0], nrm = [0, 1, 0];
  for (let i = 0; i < n; i++) {
    at(i / n, p, nrm);
    const yaw = rng.range(0, TAU), lift = rng.range(0.1, 0.5), up = nrm[1] > 0.5, cy = Math.cos(yaw), sy = Math.sin(yaw);
    const q = [p[0] + rng.range(-0.16, 0.16), p[1] + (up ? 0.02 : 0), p[2] + rng.range(-0.16, 0.16)];
    if (up) leaves.push(q[0], q[1], q[2], cy, lift, sy, 0, 1, 0, size * rng.range(0.7, 1.3), i % 3);                     // lying on the cloth, its tip a little lifted
    else leaves.push(q[0], q[1], q[2] + 0.04, cy, sy, lift * 0.6, nrm[0], nrm[1], nrm[2], size * rng.range(0.7, 1.3), i % 3);   // on a wall: turned in its plane
    if (o.fruit && rng.chance(o.fruit)) {
      if (rng.chance(0.5)) {                                                                                         // a pomegranate with its crown
        const r = rng.range(0.16, 0.21), q = [p[0] + rng.range(-0.3, 0.3), p[1] + r * 0.92, p[2] + rng.range(-0.3, 0.3)];
        b.add(new THREE.SphereGeometry(r, 6, 4), { p: q, c: shade(C.pom, rng.range(0.8, 1.3)), surf: S(K_METAL, 0.15) });
        b.add(cyl(r * 0.34, r * 0.2, r * 0.3, 5, true), { p: [q[0] + r * 0.5, q[1] + r * 0.75, q[2]], r: [0, 0, -0.6], c: shade(C.pom, 0.7), surf: S(K_PLAIN) });
      } else {                                                                                                       // a few grapes
        for (let j = 0; j < 5; j++) b.add(new THREE.SphereGeometry(0.075, 4, 3), { p: [p[0] + rng.range(-0.16, 0.16), p[1] + 0.07 + (j > 2 ? 0.1 : 0), p[2] + rng.range(-0.16, 0.16)], c: shade(C.grape, rng.range(0.8, 1.5)), surf: S(K_METAL, 0.5) });
      }
    }
  }
}
// REAL SILVER on a laid table, standing on the cloth at (x, y, z): kind 0 a covered dish (a platter and a domed cover with a
// knob, 0.84 m high; dome = true, on the dais ranks: a round dome turned in fourteen sides on a moulded rim, 0.83 m), 1 a tureen (oval, lidded, on a foot, a handle at either end, 0.98 m), 2 a footed stand piled with
// fruit (1.25 m to the top of the pile). All stand lower than a low flame's tip (1.4 m over the cloth). fine: the weight
// for a piece within 8 m of the flown line (twelve sides, turned mouldings, fruit with stalk and leaf); else five sides
// and plain fruit, a few dozen triangles.
function silverPiece(b, rng, x, y, z, kind, fine, leaves, dome = false) {
  const SV = S(K_METAL, 0.95), seg = fine ? 12 : 5, o = (yy = 0) => ({ p: [x, y + yy, z], c: C.silver, surf: SV });
  if (kind === 0 && dome) {                                                  // the ranks' covered dish: a round dome on a moulded rim, a knob on a neck
    const pr = [[0.62, 0], [0.68, 0.025], [0.66, 0.05], [0.6, 0.06], [0.56, 0.05], [0.52, 0.07], [0.52, 0.1]];
    for (let i = 1; i <= 5; i++) { const a = i * PI / 12; pr.push([0.5 * Math.cos(a), 0.1 + 0.52 * Math.sin(a)]); }
    pr.push([0.04, 0.63], [0.035, 0.68], [0.09, 0.73], [0.1, 0.77], [0.06, 0.81], [0, 0.83]);
    b.add(lathe(pr, 14), o());
  } else if (kind === 0) {
    b.add(lathe(fine ? [[0.6, 0], [0.66, 0.03], [0.64, 0.06], [0.52, 0.05], [0.5, 0.09], [0.49, 0.3], [0.38, 0.52], [0.2, 0.64], [0.05, 0.68], [0.035, 0.74], [0.08, 0.8], [0, 0.84]]
      : [[0.64, 0], [0.5, 0.06], [0.45, 0.38], [0.2, 0.63], [0, 0.72]], seg), o());
  } else if (kind === 1) {
    const g = lathe(fine ? [[0.3, 0], [0.32, 0.03], [0.2, 0.1], [0.24, 0.14], [0.56, 0.3], [0.63, 0.48], [0.64, 0.55], [0.6, 0.57], [0.5, 0.7], [0.26, 0.82], [0.06, 0.86], [0.09, 0.93], [0, 0.98]]
      : [[0.3, 0], [0.2, 0.1], [0.6, 0.4], [0.6, 0.57], [0.26, 0.82], [0, 0.92]], seg);
    b.add(g, { ...o(), s: [1, 1, 0.72], r: [0, PI / 2, 0] });
    if (fine) for (const e of [-1, 1]) b.add(new THREE.TorusGeometry(0.13, 0.03, 4, 6, PI), { p: [x, y + 0.46, z + e * 0.63], r: [0, PI / 2, e > 0 ? -PI / 2 : PI / 2], c: C.silver, surf: SV });
  } else {
    b.add(lathe(fine ? [[0.36, 0], [0.38, 0.03], [0.3, 0.07], [0.08, 0.15], [0.06, 0.4], [0.12, 0.5], [0.6, 0.6], [0.66, 0.65], [0.6, 0.64], [0.3, 0.6]] : [[0.36, 0], [0.08, 0.15], [0.08, 0.45], [0.64, 0.63], [0.3, 0.6]], seg), o());
    const n = fine ? 7 : 4;
    for (let i = 0; i < n; i++) { const up = i >= n - (fine ? 2 : 1), a = i * 2.4 + rng.range(-0.2, 0.2), rad = up ? 0.12 : 0.36, r = rng.range(0.15, 0.185), q = [x + Math.cos(a) * rad, y + (up ? 0.86 : 0.63), z + Math.sin(a) * rad];
      if (fine) fruitAt(b, rng, q, r, rng.int(0, 3), i % 2 ? leaves : null);
      else b.add(new THREE.OctahedronGeometry(r * 1.15, 0), { p: [q[0], q[1] + r, q[2]], c: shade(FRUIT[rng.int(0, 3)][0], 1.1), surf: S(K_METAL, 0.25) }); }
  }
}
// THE FEAST on the dais ranks, standing on the cloth at (x, y, z). kind 0: a tiered silver stand of fruit (pomegranates, pears,
// oranges, grapes; 1.5 m), 1: a silver bowl of white roses (0.95 m), 2: a raised pie on a dish (0.56 m), 3: three round loaves
// on a board (0.4 m), 4: a sugared cake on a silver foot (0.9 m), 5: a ham or a roast bird on a dish (0.6 m). None is wider
// than 0.75 m from its middle. FEAST_H: their heights, for the count of clear air
const FEAST_H = [1.5, 0.95, 0.56, 0.4, 0.9, 0.6], FEAST_FRUIT = [['#8a2a22', 1.0], ['#9a7a2a', 1.25], ['#c06a1c', 1.0]];
function feastPiece(b, rng, x, y, z, kind, leaves) {
  const SV = S(K_METAL, 0.95), P0 = S(K_PLAIN), yaw = rng.range(0, TAU), o = (c, surf) => ({ p: [x, y, z], c, surf });
  const ball = (r, px, py, pz, c, gloss, sy = 1, seg = 5) => b.add(new THREE.SphereGeometry(r, seg, seg > 4 ? 3 : 2), { p: [px, py, pz], r: [0, rng.range(0, TAU), 0], s: [1, sy, 1], c, surf: S(K_METAL, gloss) });
  if (kind === 0) {
    b.add(lathe([[0.34, 0], [0.1, 0.13], [0.07, 0.5], [0.6, 0.6], [0.62, 0.64], [0.07, 0.66], [0.06, 1.06], [0.38, 1.13], [0.4, 1.17], [0, 1.15]], 7), o(C.silver, SV));
    for (let i = 0; i < 9; i++) { const up = i > 5, a = yaw + i * (up ? TAU / 3 : TAU / 6), rad = up ? 0.2 : 0.42, yy = y + (up ? 1.17 : 0.64), k = rng.int(0, 3), r = rng.range(0.13, 0.16);
      const px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad;
      if (k === 3) for (let g = 0; g < 4; g++) ball(0.07, px + rng.range(-0.08, 0.08), yy + 0.06 + (g > 1 ? 0.09 : 0), pz + rng.range(-0.08, 0.08), shade(C.grape, rng.range(0.9, 1.6)), 0.5, 1, 4);
      else ball(r, px, yy + r * FEAST_FRUIT[k][1] * 0.95, pz, shade(FEAST_FRUIT[k][0], rng.range(0.85, 1.2)), 0.3, FEAST_FRUIT[k][1]); }
    ball(0.15, x, y + 1.32, z, shade(FEAST_FRUIT[0][0], 1.1), 0.25);
  } else if (kind === 1) {
    b.add(lathe([[0.2, 0], [0.22, 0.04], [0.1, 0.1], [0.12, 0.2], [0.5, 0.44], [0.56, 0.52], [0.48, 0.5]], 8), o(C.silver, SV));
    for (let i = 0; i < 8; i++) { const mid = i > 5, a = yaw + i * 1.05, rad = mid ? 0.14 : 0.36, r = rng.range(0.17, 0.21);
      b.add(new THREE.IcosahedronGeometry(1, 0), { p: [x + Math.cos(a) * rad, y + 0.58 + (mid ? 0.2 : 0.02 * (i % 3)), z + Math.sin(a) * rad], r: [rng.range(-0.4, 0.4), rng.range(0, TAU), rng.range(-0.4, 0.4)], s: [r, r * 0.8, r], c: '#e9e2d0', surf: P0,
        tint: (X, Y, Z, c, lx, ly, lz) => { c.multiplyScalar(0.62 + 0.5 * Math.abs(Math.sin(Math.atan2(lz, lx) * 2.5 + ly * 3))); } });
      if (!mid) leaves.push(x + Math.cos(a + 0.5) * 0.46, y + 0.5, z + Math.sin(a + 0.5) * 0.46, Math.cos(a + 0.5), 0.15, Math.sin(a + 0.5), 0, 1, 0, 0.44, i); }
  } else if (kind === 2) {
    b.add(lathe([[0.72, 0], [0.74, 0.03], [0.5, 0.02]], 10), o(shade(C.silver, 0.85), SV));
    b.add(lathe([[0.5, 0.02], [0.47, 0.34], [0.55, 0.38], [0.54, 0.44], [0.46, 0.42], [0.3, 0.52], [0.05, 0.56], [0.05, 0.5]], 10), { ...o('#a8743a', S(K_METAL, 0.12)),
      tint: (X, Y, Z, c, lx, ly, lz) => { c.multiplyScalar(ly > 0.36 && ly < 0.46 ? 0.7 + 0.55 * Math.abs(Math.sin(Math.atan2(lz, lx) * 5)) : ly > 0.46 ? 1.12 : 0.85); } });
  } else if (kind === 3) {
    b.add(box(0.86, 0.07, 1.3), { p: [x, y + 0.035, z], r: [0, rng.range(-0.15, 0.15), 0], c: '#5a4026', surf: S(K_WOOD) });
    for (let i = 0; i < 3; i++) { const r = rng.range(0.23, 0.27);
      b.add(new THREE.SphereGeometry(r, 6, 3), { p: [x + (i === 1 ? 0.12 : -0.1), y + 0.07 + r * 0.5, z + (i - 1) * 0.42], r: [0, rng.range(0, TAU), 0], s: [1, 0.62, 1], c: '#a67238', surf: P0,
        tint: (X, Y, Z, c, lx, ly) => { c.multiplyScalar(ly > r * 0.4 ? (Math.abs(lx) < r * 0.35 ? 1.45 : 1.0) : 0.72); } }); }
  } else if (kind === 4) {
    b.add(lathe([[0.26, 0], [0.28, 0.03], [0.07, 0.12], [0.07, 0.3], [0.5, 0.38], [0.52, 0.42]], 8), o(C.silver, SV));
    b.add(lathe([[0.44, 0.42], [0.45, 0.5], [0.45, 0.74], [0.4, 0.82], [0, 0.84]], 8), { ...o('#efe9da', P0),
      tint: (X, Y, Z, c, lx, ly, lz) => { if (ly > 0.56 && ly < 0.78) c.multiplyScalar(0.78 + 0.3 * Math.abs(Math.sin(Math.atan2(lz, lx) * 4))); } });
    for (let i = 0; i < 7; i++) { const a = yaw + i * TAU / 6, rad = i < 6 ? 0.3 : 0;
      ball(i < 6 ? 0.07 : 0.1, x + Math.cos(a) * rad, y + 0.87 + (i < 6 ? 0 : 0.04), z + Math.sin(a) * rad, i % 2 ? '#8a1420' : '#c06a1c', 0.5, 1, 4); }
  } else {
    b.add(lathe([[0, 0.02], [0.52, 0.02], [0.72, 0.07], [0.74, 0.07]], 10), { ...o(C.silver, SV), s: [0.74, 1, 1] });
    const ham = rng.chance(0.5), brown = ham ? '#7a3a2a' : '#8a5222', G5 = S(K_METAL, 0.45);
    b.add(new THREE.SphereGeometry(0.33, 6, 4), { p: [x, y + 0.3, z], s: ham ? [0.85, 0.8, 1.2] : [0.95, 0.82, 1.25], c: brown, surf: G5,
      tint: (X, Y, Z, c, lx, ly) => { c.multiplyScalar(0.72 + 0.5 * Math.max(ly / 0.33, 0)); } });
    if (ham) { b.add(cyl(0.03, 0.045, 0.34, 4, true), { p: [x, y + 0.36, z + 0.5], r: [1.25, 0, 0], c: '#e6dcc6', surf: P0 });
      b.add(new THREE.ConeGeometry(0.09, 0.12, 5, 1, true), { p: [x, y + 0.34, z + 0.4], r: [-1.9, 0, 0], c: '#efe9da', surf: P0 }); }
    else for (const e of [-1, 1]) b.add(new THREE.ConeGeometry(0.1, 0.36, 4), { p: [x + e * 0.2, y + 0.32, z + 0.34], r: [1.1, e * 0.4, 0], c: brown, surf: G5 });
    for (let i = 0; i < 4; i++) { const a = 0.6 + i * 1.3 + (i > 1 ? 0.6 : 0); ball(0.085, x + Math.cos(a) * 0.4, y + 0.14, z + Math.sin(a) * 0.62, i % 2 ? '#c06a1c' : '#6a7a2c', 0.3, 1, 4); }
  }
}
// THE LARDER of the long tables, a thing standing on the cloth at (x, y, z). kind 0: a tiered silver stand of fruit, 1: a
// footed silver stand piled with fruit (the two TALL ones), 2: a silver bowl of white roses, 3: a sugared cake on a silver
// foot, 4: an oval tureen, 5: a covered dish (the four of MIDDLE height), 6: a raised pie, 7: three loaves on a board, 8: a
// ham or a roast fowl on a dish (the three LOW ones). LARDER_H: their heights; none is wider than 0.75 m from its middle.
// full: the weight for a table within 12 m of the flown line in plan (63 to 116 triangles); else the same outline turned in
// three or four sides (12 to 27 triangles), its colours laid by height
const LARDER_H = [1.6, 1.25, 0.92, 0.86, 0.92, 0.84, 0.56, 0.4, 0.62], LARDER_CLASS = [[0, 1], [2, 3, 4, 5], [6, 7, 8]];
function larderPiece(b, rng, x, y, z, kind, full) {
  const SV = S(K_METAL, 0.95), FD = S(K_METAL, 0.2), P0 = S(K_PLAIN), yaw = rng.range(0, TAU), o = (c, surf, tint) => ({ p: [x, y, z], r: [0, yaw, 0], c, surf, tint });
  const fruitC = () => shade(FEAST_FRUIT[rng.int(0, 2)][0], rng.range(0.9, 1.25)), over = (yc, hex2) => (X, Y, Z, c, lx, ly) => { if (ly > yc) c.set(hex2); };
  const ball = (r, px, py, pz, c, sc = [1, 1, 1], surf = S(K_METAL, 0.3)) => { const g = new THREE.OctahedronGeometry(r, 0); g.setAttribute('normal', g.attributes.position.clone());
    b.add(g, { p: [x + px, y + py, z + pz], r: [0, rng.range(0, TAU), 0], s: sc, c, surf }); };
  if (!full) {
    if (kind === 0) b.add(lathe([[0.34, 0], [0.07, 0.3], [0.6, 0.64], [0.25, 0.9], [0.42, 1.18], [0, 1.42]], 3), o(C.silver, S(K_METAL, 0.6), (X, Y, Z, c, lx, ly) => { if (ly > 0.7) c.set(ly > 1.2 ? '#9a7a2a' : '#8a2a22'); }));
    else if (kind === 1) b.add(lathe([[0.36, 0], [0.08, 0.3], [0.62, 0.63], [0.3, 0.98], [0, 1.25]], 3), o(C.silver, S(K_METAL, 0.6), (X, Y, Z, c, lx, ly) => { if (ly > 0.7) c.set(ly > 1.1 ? '#c06a1c' : '#8a2a22'); }));
    else if (kind === 2) b.add(lathe([[0.2, 0], [0.1, 0.1], [0.55, 0.5], [0.36, 0.8], [0, 0.9]], 3), o(C.silver, S(K_METAL, 0.5), over(0.6, '#d8d1bd')));
    else if (kind === 3) b.add(lathe([[0.26, 0], [0.07, 0.2], [0.5, 0.42], [0.44, 0.8], [0, 0.84]], 3), o(C.silver, S(K_METAL, 0.5), over(0.6, '#efe9da')));
    else if (kind === 4) b.add(lathe([[0.3, 0], [0.2, 0.1], [0.62, 0.5], [0, 0.92]], 3), { ...o(C.silver, SV), s: [1, 1, 0.72] });
    else if (kind === 5) b.add(lathe([[0.64, 0], [0.46, 0.4], [0, 0.8]], 4), o(C.silver, SV));
    else if (kind === 6) b.add(lathe([[0.74, 0.02], [0.5, 0.04], [0.5, 0.4], [0, 0.56]], 4), o('#a8743a', FD));
    else if (kind === 7) { b.add(box(0.86, 0.07, 1.3), { p: [x, y + 0.035, z], c: '#5a4026', surf: S(K_WOOD) }); ball(0.26, 0, 0.2, 0, '#a67238', [1, 0.62, 2.2], P0); }
    else { b.add(lathe([[0, 0.02], [0.72, 0.05]], 4), o(C.silver, SV)); ball(0.33, 0, 0.3, 0, '#7f4526', [0.9, 0.8, 1.2], S(K_METAL, 0.45)); }
    return;
  }
  if (kind === 0) {
    b.add(lathe([[0.34, 0], [0.08, 0.14], [0.07, 0.5], [0.58, 0.62], [0.07, 0.68], [0.06, 1.06], [0.4, 1.15]], 5), o(C.silver, SV));
    for (let i = 0; i < 7; i++) { const up = i > 3, a = yaw + i * (up ? TAU / 2 : TAU / 4), rad = i === 6 ? 0 : up ? 0.2 : 0.4, r = up ? 0.13 : 0.15; ball(r, Math.cos(a) * rad, (i === 6 ? 1.34 : up ? 1.15 : 0.62) + r, Math.sin(a) * rad, fruitC()); }
  } else if (kind === 1) {
    b.add(lathe([[0.36, 0], [0.08, 0.15], [0.08, 0.45], [0.64, 0.63]], 5), o(C.silver, SV));
    b.add(lathe([[0.56, 0.63], [0.44, 0.86], [0.2, 1.1], [0, 1.25]], 5), o('#8a2a22', S(K_METAL, 0.3), (X, Y, Z, c, lx, ly, lz) => { c.set(FEAST_FRUIT[Math.floor(Math.abs(Math.sin(lx * 9 + lz * 7 + ly * 5)) * 2.99)][0]); }));
    for (let i = 0; i < 3; i++) { const a = yaw + i * 2.1; ball(0.16, Math.cos(a) * 0.36, 0.78 + 0.1 * i, Math.sin(a) * 0.36, fruitC()); }
  } else if (kind === 2) {
    b.add(lathe([[0.2, 0], [0.1, 0.1], [0.5, 0.44], [0.56, 0.52]], 6), o(C.silver, SV));
    const LM = makeLeafMass(() => rng.range(0, 1));
    LM.core(lathe([[0.5, 0.52], [0.4, 0.72], [0, 0.84]], 5), () => 1, '#141f12', null);
    for (let i = 0; i < 9; i++) { const a = yaw + i * 2.4, el = i < 6 ? 0.55 : 1.25, d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], c = [d[0] * 0.44, 0.5 + d[1] * 0.42, d[2] * 0.44];
      if (i % 2) LM.card(c, d, 0.2, 13, LEAF_GREENS[i % 4], 0.95, 0.8); else LM.card(c, d, 0.15, 16, '#e6dfcc', 1.0, 0.3); }
    b.add(LM.geo(), { p: [x, y, z] });
  } else if (kind === 3) {
    b.add(lathe([[0.26, 0], [0.07, 0.12], [0.07, 0.3], [0.5, 0.38], [0.52, 0.42]], 6), o(C.silver, SV));
    b.add(lathe([[0.44, 0.42], [0.45, 0.74], [0.4, 0.82], [0, 0.84]], 7), o('#efe9da', P0, (X, Y, Z, c, lx, ly, lz) => { if (ly > 0.5 && ly < 0.78) c.multiplyScalar(0.78 + 0.3 * Math.abs(Math.sin(Math.atan2(lz, lx) * 3.5))); }));
    ball(0.09, 0, 0.9, 0, '#8a1420');
  } else if (kind === 4) b.add(lathe([[0.3, 0], [0.2, 0.1], [0.56, 0.3], [0.64, 0.52], [0.5, 0.7], [0.26, 0.82], [0.06, 0.86], [0, 0.92]], 6), { ...o(C.silver, SV), s: [1, 1, 0.72] });
  else if (kind === 5) b.add(lathe([[0.64, 0], [0.5, 0.06], [0.49, 0.3], [0.38, 0.52], [0.2, 0.64], [0.05, 0.68], [0.08, 0.8], [0, 0.84]], 6), o(C.silver, SV));
  else if (kind === 6) b.add(lathe([[0.74, 0.02], [0.5, 0.02], [0.48, 0.34], [0.55, 0.4], [0.3, 0.52], [0, 0.56]], 7), o(shade(C.silver, 0.85), FD,
    (X, Y, Z, c, lx, ly, lz) => { if (ly > 0.03) c.set('#a8743a').multiplyScalar(ly > 0.36 && ly < 0.46 ? 0.7 + 0.55 * Math.abs(Math.sin(Math.atan2(lz, lx) * 3.5)) : ly > 0.46 ? 1.12 : 0.85); }));
  else if (kind === 7) { b.add(box(0.86, 0.07, 1.3), { p: [x, y + 0.035, z], c: '#5a4026', surf: S(K_WOOD) });
    for (let i = 0; i < 3; i++) { const r = rng.range(0.23, 0.27); b.add(new THREE.SphereGeometry(r, 5, 3), { p: [x + (i === 1 ? 0.12 : -0.1), y + 0.07 + r * 0.5, z + (i - 1) * 0.42], r: [0, rng.range(0, TAU), 0], s: [1, 0.62, 1], c: '#a67238', surf: P0,
      tint: (X, Y, Z, c, lx, ly) => { c.multiplyScalar(ly > r * 0.4 ? (Math.abs(lx) < r * 0.35 ? 1.45 : 1.0) : 0.72); } }); }
  } else {
    const ham = rng.chance(0.5), brown = ham ? '#7a3a2a' : '#8a5222', G5 = S(K_METAL, 0.45);
    b.add(lathe([[0, 0.02], [0.52, 0.02], [0.74, 0.07]], 7), { p: [x, y, z], s: [0.74, 1, 1], c: C.silver, surf: SV });
    b.add(new THREE.SphereGeometry(0.33, 6, 3), { p: [x, y + 0.3, z], s: ham ? [0.85, 0.8, 1.2] : [0.95, 0.82, 1.25], c: brown, surf: G5, tint: (X, Y, Z, c, lx, ly) => { c.multiplyScalar(0.72 + 0.5 * Math.max(ly / 0.33, 0)); } });
    if (ham) b.add(cyl(0.03, 0.045, 0.34, 3, true), { p: [x, y + 0.36, z + 0.5], r: [1.25, 0, 0], c: '#e6dcc6', surf: P0 });
    else for (const e of [-1, 1]) b.add(new THREE.ConeGeometry(0.1, 0.36, 3), { p: [x + e * 0.2, y + 0.32, z + 0.34], r: [1.1, e * 0.4, 0], c: brown, surf: G5 });
    for (let i = 0; i < 3; i++) { const a = 0.6 + i * 2.0; ball(0.085, Math.cos(a) * 0.4, 0.14, Math.sin(a) * 0.62, i % 2 ? '#c06a1c' : '#6a7a2c'); }
  }
}
// a tall silver candelabrum of five on a rank: a turned stem 2.3 m high, four arms 0.46 m out at 1.95 m, a candle on each and
// one on the stem's head; flames at c5Flames(burn)
const c5Flames = (burn) => [[0, 2.3 + 0.5 * burn, 0], ...[0, 1, 2, 3].map((i) => [Math.cos(i * PI / 2 + PI / 4) * 0.46, 1.95 + 0.45 * burn, Math.sin(i * PI / 2 + PI / 4) * 0.46])];
function cand5Geometry(burn = 1) {
  const b = INT.makeBuilder(), SV = S(K_METAL, 0.95), fl = c5Flames(burn);
  b.add(lathe([[0.32, 0], [0.34, 0.04], [0.12, 0.14], [0.05, 0.4], [0.11, 0.55], [0.045, 0.7], [0.045, 1.5], [0.13, 1.62], [0.05, 1.74], [0.05, 2.2], [0.15, 2.28], [0.05, 2.3]], 6), { c: C.silver, surf: SV });
  for (let i = 0; i < 4; i++) { const arm = new THREE.TorusGeometry(0.23, 0.028, 3, 4, PI); arm.rotateZ(PI); arm.translate(0.23, 1.78, 0);
    b.add(arm, { r: [0, -(i * PI / 2 + PI / 4), 0], c: C.silver, surf: SV }); }
  for (let i = 0; i < 5; i++) { const f = fl[i], y0 = i ? 1.95 : 2.3;
    if (i) b.add(cyl(0.028, 0.028, 0.16, 3, true), { p: [f[0], 1.85, f[2]], c: C.silver, surf: SV });
    b.add(new THREE.ConeGeometry(0.13, 0.07, 5, 1, true), { p: [f[0], y0 - 0.03, f[2]], r: [PI, 0, 0], c: C.silver, surf: SV });
    b.add(cyl(0.04, 0.04, f[1] - y0, 4, true), { p: [f[0], (f[1] + y0) / 2, f[2]], c: C.wax, surf: S(K_PLAIN, 0.55), grad: [f[1] - 0.15, f[1], 0.5, 1.5] });
    b.add(new THREE.ConeGeometry(0.009, 0.06, 3, 1, true), { p: [f[0], f[1] + 0.02, f[2]], c: '#140e0a', surf: S(K_PLAIN) }); }
  return b.build();
}
// the registry every builder writes its glasses, sticks and flames into (R.fy = how far above a low stick's foot its flame's
// base burns; a tall stick, tall = 1, carries its candle 0.6 m higher). bares: the flames of the massed candles (the dais
// steps, the river of cups), each a flame like every other; glows: one glare for each cluster of them
function makeRegistry(stub) {
  const R = { glasses: [], sticks: [], flames: [], smoke: [], bares: [], glows: [], fy: 0.98 - stub,
    bare(x, y, z, h = 0.4, w = 0.15) { R.bares.push(x, y, z, h, w); },         // a flame of a massed cluster: the cluster carries one glare for all (glow)
    glow(x, y, z, size) { R.glows.push(x, y, z, size); },
    glass(x, y, z, fx, fy, fz, k = 1, caustic = 1) { R.glasses.push(x, y, z, fx, fy, fz, k, caustic); },
    stick(x, y, z, lit = true, h = 0.36, w = 0.13, tall = 0, slim = 1) { R.sticks.push(x, y, z, tall, slim); if (lit) R.flames.push(x, y + R.fy + tall * 0.6, z, h, w); },
    flame(x, y, z, h = 0.36, w = 0.13) { R.flames.push(x, y, z, h, w); } };
  return R;
}
// THE PYRAMID (axis x 0, z -30): a great tiered buffet of walnut, gilt, old mirror, glass and green. Ten tiers; tier k: a
// drum of dark polished walnut (it stands on the tier below, the lowest on the floor on a plinth 1.2 m high) with a gilt
// moulded rim (a cove and a fillet, 0.1 m high, 0.08 m proud). Its riser (the shader's): plates of old mirror between
// walnut stiles, behind the glasses of the tier before it, giving back their candles and their wine; over them a gilt
// band carved with the vine. Its tread: polished walnut, and under the ring of glasses a strip of ivory damask 0.72 m
// wide. On every tier one ring 0.5 m in from the edge: its candles (tierCandles: one every 6.5 m, in silver sticks of two
// heights, low and 0.6 m taller, by turns, drawn at 0.78 of a table stick's width so that no foot stands in a glass's foot:
// build() says how much is left between them) and between each two candles its glasses shoulder to shoulder (tierGlasses:
// 0.81 to 0.91 m apart, 820 on the pyramid, every one half full). Thick garlands hang on every riser from head to head
// (one swag every 4.3 m of the edge, dipping 0.8 m): leaf masses of sprays of leaves, roses (white and crimson by
// tiers), fruit and blossom, a full rose at each head. On top a tall silver epergne: a dish of fruit, six branches, seven candles.
const tierCandles = (k) => tierPlaces(k) / 5, PYR_SLIM = 0.78;
const tierGlasses = (k) => tierCandles(k) * Math.round(TAU * (tierR(k) - 0.5) / (0.85 * tierCandles(k)));
// one fruit that reads as fruit: a body that takes a highlight, a dark stalk, and (leaf = true) one folded leaf beside it
const FRUIT = [['#8a2a22', 1.0, 0.25], ['#9a7a2a', 1.2, 0.2], ['#3c1c34', 0.9, 0.5], ['#6a7a2c', 1.1, 0.2]];     // pomegranate, pear, plum, green apple: colour, height, gloss
function fruitAt(b, rng, p, r, kind, leaves, leafHex) {
  const f = FRUIT[kind % FRUIT.length], yaw = rng.range(0, TAU);
  b.add(new THREE.SphereGeometry(r, 6, 4), { p: [p[0], p[1] + r * f[1] * 0.92, p[2]], s: [1, f[1], 1], c: shade(f[0], rng.range(0.85, 1.25)), surf: S(K_METAL, f[2]),
    tint: (x, y, z, c, lx, ly) => { c.multiplyScalar(0.72 + 0.4 * (ly / r * 0.5 + 0.5)); } });
  b.add(cyl(r * 0.05, r * 0.09, r * 0.5, 3, true), { p: [p[0] + Math.cos(yaw) * r * 0.1, p[1] + r * f[1] * 1.9 + r * 0.15, p[2] + Math.sin(yaw) * r * 0.1], r: [0.3, yaw, 0], c: '#2a1c10', surf: S(K_PLAIN) });
  if (leaves) leaves.push(p[0] + Math.cos(yaw) * r * 0.5, p[1] + r * f[1] * 1.9, p[2] + Math.sin(yaw) * r * 0.5, Math.cos(yaw), 0.35, Math.sin(yaw), 0, 1, 0, r * 2.2, 2);
}
async function buildPyramid(ctx, b, R, rng, look, detail, leaves, sw, dist) {
  const cx = PYR.x, cz = PYR.z, burn = look === 'blue' ? 0.4 : 1, WAL = '#33190e', GR = S(K_METAL, 0.85), out = { garland: 1e9, gap: 1e9 };
  const at = (a, rad, y) => [cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad];
  const LM = makeLeafMass(() => sw.range(0, 1)), dens = Math.min(1, Math.max(detail, 0.6)), fruitHex = ['#8a2a22', '#b08a2c', '#c06a1c'];
  for (let k = 0; k < PYR.tiers; k++) {
    const r = tierR(k), top = tierTop(k), base = k === 0 ? 0 : tierTop(k - 1), rin = k < 9 ? tierR(k + 1) - 0.1 : 0;
    const nC = tierCandles(k), nG = tierGlasses(k), per = nG / nC, SEG = Math.max(20, Math.round(r * 3.2));
    const sTop = S(K_TIER, r - 0.5, nC, top), sSide = k === 0 ? S(K_TIER, 0, 0, top - 1.8) : S(K_TIER, tierR(k - 1) - 0.5, tierCandles(k - 1) + (k & 1 ? 0 : 0.5), top - 1.8);
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * TAU, a1 = ((i + 1) / SEG) * TAU, am = (a0 + a1) / 2;
      quadTo(b, at(a0, rin, top), at(a1, rin, top), at(a1, r + 0.08, top), at(a0, r + 0.08, top), [cx, 100, cz], C.linen, sTop);              // the tread
      quadTo(b, at(a0, r, base), at(a1, r, base), at(a1, r, top - 0.1), at(a0, r, top - 0.1), at(am, 99, top), WAL, sSide);                    // the riser
      quadTo(b, at(a0, r, top - 0.1), at(a1, r, top - 0.1), at(a1, r + 0.08, top - 0.045), at(a0, r + 0.08, top - 0.045), at(am, 99, top - 60), C.gilt, GR);   // the gilt rim: a cove
      quadTo(b, at(a0, r + 0.08, top - 0.045), at(a1, r + 0.08, top - 0.045), at(a1, r + 0.08, top), at(a0, r + 0.08, top), at(am, 99, top), shade(C.gilt, 1.15), GR);   // and a fillet
    }
    // the ring: candles in sticks of two heights, glasses shoulder to shoulder between them
    const rg = r - 0.5;
    out.gap = Math.min(out.gap, 2 * rg * Math.sin(PI / (2 * nG)) - 0.15 - 0.30 * PYR_SLIM);
    for (let c = 0; c < nC; c++) { const q = at(TAU * c / nC, rg, top), tall = (c + k) & 1;
      R.stick(q[0], top, q[2], true, 0.52, 0.17, tall, PYR_SLIM);
      if ((c + k * 2) % 5 === 0) R.smoke.push(q[0], top + R.fy + 0.55 + tall * 0.6, q[2], 2.6 + (c % 3) * 0.5); }
    for (let g = 0; g < nG; g++) { const c = Math.round((g + 0.5) / per) % nC, tall = (c + k) & 1;
      const q = at(TAU * (g + 0.5) / nG, rg, top), f = at(TAU * c / nC, rg, top + R.fy + 0.16 + tall * 0.6);
      R.glass(q[0], top, q[2], f[0], f[1], f[2], 1); }
    // the garlands: on every riser, swags from head to head (one every 4.3 m of the edge), each dipping 0.8 m from 0.34 m
    // under the tread, fullest in its belly; at each head a full rose between two sprays of leaves
    const ns = Math.max(3, Math.round(TAU * r / 4.3)), R0 = r + 0.22, roseHex = k & 1 ? '#8a1a26' : '#e6dfcc';
    for (let j = 0; j < ns; j++) { const pts = [], am = TAU * (j + 0.5) / ns;
      for (let i = 0; i <= 6; i++) { const u = i / 6, q = at(TAU * (j + u) / ns, R0, top - 0.34 - 3.2 * u * (1 - u)); pts.push([q[0], q[1], q[2], 0.75 + 1.8 * u * (1 - u)]); }
      LM.rope(pts, 0.22, 2, [Math.cos(am), 0, Math.sin(am)], { leaf: 3.6 * dens, rose: 0.45 * dens, fruit: 0.6 * dens, bloom: 0.25 * dens, fruitHex, roseHex });
      const ah = TAU * j / ns, d = [Math.cos(ah), 0, Math.sin(ah)], h = at(ah, R0 + 0.16, top - 0.4);
      LM.card(h, d, 0.2, 16, roseHex, 1.05, 0.2);
      for (const e of [-1, 1]) LM.card([h[0] - Math.sin(ah) * e * 0.2, h[1] - 0.16, h[2] + Math.cos(ah) * e * 0.2], d, 0.24, 13, LEAF_GREENS[(j + (e > 0 ? 1 : 0)) % 4], 0.9, 0.5);
    }
    await ctx.yield();
  }
  out.garland = await LM.leastBy(dist, ctx); b.add(LM.geo(), {});
  await ctx.yield();
  // the epergne on the top tier: a silver foot and stem, a dish of fruit at 2.1 m, six branches at 3.2 m, a candle on each and one on the stem's head
  const ty = tierTop(9), SVg = S(K_METAL, 0.95);
  b.add(lathe([[1.0, 0], [1.05, 0.1], [0.5, 0.3], [0.2, 0.6], [0.3, 0.9], [0.14, 1.2], [0.14, 1.75], [0.25, 1.85], [1.2, 2.04], [1.3, 2.14], [1.22, 2.12], [0.3, 2.06], [0.12, 2.3], [0.12, 3.0], [0.34, 3.2],
    [0.12, 3.42], [0.1, 3.9], [0.3, 4.05], [0.11, 4.15]], 8), { p: [cx, ty, cz], c: C.silver, surf: SVg });
  for (let i = 0; i < 9; i++) { const a = i * TAU / 6 + (i > 5 ? 0.5 : 0), rad = i > 5 ? 0.3 : 0.78;
    fruitAt(b, rng, [cx + Math.cos(a) * rad, ty + (i > 5 ? 2.45 : 2.1), cz + Math.sin(a) * rad], i > 5 ? 0.3 : 0.33, i, i % 2 ? leaves : null); }
  const eFl = [[0, 4.15 + 0.9 * burn, 0]];
  for (let i = 0; i < 6; i++) { const a = (i + 0.5) * TAU / 6;
    const arm = new THREE.TorusGeometry(0.75, 0.05, 3, 5, PI); arm.rotateZ(PI); arm.scale(1, 0.45, 1); arm.translate(0.75 + 0.2, 3.25, 0);
    b.add(arm, { p: [cx, ty, cz], r: [0, -a, 0], c: C.silver, surf: SVg });
    b.add(new THREE.ConeGeometry(0.26, 0.14, 6, 1, true), { p: [cx + Math.cos(a) * 1.7, ty + 3.3, cz + Math.sin(a) * 1.7], r: [PI, 0, 0], c: C.silver, surf: SVg });
    eFl.push([Math.cos(a) * 1.7, 3.36 + 0.7 * burn, Math.sin(a) * 1.7]); }
  for (let i = 0; i < 7; i++) { const f = eFl[i], y0 = i ? 3.34 : 4.13;
    b.add(cyl(0.075, 0.08, f[1] - y0, 5, true), { p: [cx + f[0], ty + (f[1] + y0) / 2, cz + f[2]], c: C.wax, surf: S(K_PLAIN, 0.6), grad: [ty + f[1] - 0.25, ty + f[1], 0.75, 1.3] });
    R.flame(cx + f[0], ty + f[1] + 0.04, cz + f[2], i ? 0.46 : 0.6, i ? 0.16 : 0.2); }
  R.smoke.push(cx, ty + eFl[0][1] + 0.6, cz, 3.2);
  // the corona of sixty candles at y 34, on six chains from the crossing ceiling
  const I = S(K_METAL, 0.3), G = S(K_METAL, 0.6);
  b.add(new THREE.TorusGeometry(9, 0.2, 5, 60), { p: [cx, 34, cz], r: [PI / 2, 0, 0], c: C.gilt, surf: G });
  b.add(new THREE.TorusGeometry(5.4, 0.14, 4, 40), { p: [cx, 36.4, cz], r: [PI / 2, 0, 0], c: C.iron, surf: I });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU;
    b.add(bevelBox(4.4, 0.16, 0.16, 0.05, 'x'), { p: [cx + Math.cos(a) * 7.2, 35.2, cz + Math.sin(a) * 7.2], r: [0, -a, 0.58], c: C.iron, surf: I });
    if (i % 2 === 0) b.add(bevelBox(0.14, 9.8, 0.14, 0.04, 'y'), { p: [cx + Math.cos(a) * 5.4, 41.2, cz + Math.sin(a) * 5.4], c: C.iron, surf: I }); }
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, x = cx + Math.cos(a) * 9, z = cz + Math.sin(a) * 9;
    b.add(cyl(0.085, 0.085, 0.7 * burn, 5, true), { p: [x, 34.2 + 0.35 * burn, z], c: C.wax, surf: S(K_PLAIN, 0.6) });
    b.add(new THREE.ConeGeometry(0.24, 0.12, 6, 1, true), { p: [x, 34.2, z], r: [PI, 0, 0], c: C.gilt, surf: G });
    R.flame(x, 34.22 + 0.7 * burn, z, 0.44, 0.16); }
  return out;
}
// THE DAIS: a stage. An island platform (floor y 3.0, x -20 to 20, z -120 to -196) on three broad steps all round
// (risers of 1 m, each a gilt band carved in relief under a gilt nosing; treads of cream marble, 1 m deep on the south and
// north flights, 0.7 m along the sides, every one carrying massed candles: buildStepCandles); a dusky crimson carpet up
// its axis and over both flights; a low gilt balustrade along its east and west edges between four corner posts, a
// garlanded urn of fruit on each; two ranks.
// The ranks run from z -127.8 to -170.6 (candles every 3.2 m from RANK_Z0), so that they stand as a bright
// linen road from the turn onward; the flown line keeps 2.9 m and more from their nearest glass.
const RANK_Z0 = -130.0, RANK_N = 13;
async function buildDais(ctx, b, R, rng, leafHex, detail, burn) {
  const up = [0, 100, -160], F = S(K_FLOOR), W = S(K_WOOD), CARPET = S(K_PLAIN, 0, 1), crimson = '#521a22', G = S(K_METAL, 0.6);
  const RISER = (y) => S(K_METAL, 0.6, 2, y - 0.5);                           // a riser: a gilt band carved in relief (the shader's vine)
  quadTo(b, [-20, 3, -196], [20, 3, -196], [20, 3, -120], [-20, 3, -120], up, C.floor, F);
  for (let i = 0; i < 3; i++) {                                              // ring i: its tread at y i + 1, its riser below it
    const y = i + 1, xo = 22.1 - 0.7 * i, xi = xo - 0.7, zs = -117 - i, zn = -199 + i;
    for (const [za, zb, d] of [[zs, zs - 1, -1], [zn, zn + 1, 1]]) {
      quadTo(b, [-xo, y, za], [xo, y, za], [xo, y, zb], [-xo, y, zb], up, C.floor, F);
      quadTo(b, [-xo, y - 1, za], [xo, y - 1, za], [xo, y, za], [-xo, y, za], [0, y, za - d * 50], C.gilt, RISER(y));
      b.add(bevelBox(xo * 2 + 0.3, 0.2, 0.34, 0.07, 'x'), { p: [0, y - 0.05, za - d * 0.08], c: shade(C.gilt, 1.15), surf: G });  // the nosing: a gilt moulding
      quadTo(b, [-2.4, y - 1, za - d * 0.03], [2.4, y - 1, za - d * 0.03], [2.4, y - 0.12, za - d * 0.03], [-2.4, y - 0.12, za - d * 0.03], [0, y, za - d * 50], crimson, CARPET);   // the carpet turns down each riser
    }
    for (const s of [-1, 1]) {
      quadTo(b, [s * xi, y, zs - 1], [s * xo, y, zs - 1], [s * xo, y, zn + 1], [s * xi, y, zn + 1], up, C.floor, F);
      quadTo(b, [s * xo, y - 1, zs], [s * xo, y - 1, zn], [s * xo, y, zn], [s * xo, y, zs], [s * 60, y, -158], C.gilt, RISER(y));
      b.add(bevelBox(0.34, 0.2, zs - zn + 0.3, 0.07, 'z'), { p: [s * (xo + 0.08), y - 0.05, -158], c: shade(C.gilt, 1.15), surf: G });
    }
    await ctx.yield();
  }
  // the balustrade along the east and west edges: turned gilt balusters every 2 m between a foot rail and a hand rail
  // (y 4.6), and four corner posts 2.3 m high, each with a gilt urn of pomegranates and a swag of leaves
  const bal = [[0.17, 0], [0.21, 0.14], [0.09, 0.42], [0.21, 0.82], [0.09, 1.12], [0.17, 1.3]];
  for (const s of [-1, 1]) {
    for (let k = 1; k < 38; k++) b.add(lathe(bal, 3), { p: [s * 19.6, 3.15, -120 - 2 * k], c: C.gilt, surf: G });
    b.add(bevelBox(0.5, 0.26, 74.6, 0.08, 'z'), { p: [s * 19.6, 4.58, -158], c: C.gilt, surf: S(K_METAL, 0.75) });
    b.add(bevelBox(0.5, 0.16, 74.6, 0.05, 'z'), { p: [s * 19.6, 3.08, -158], c: C.gilt, surf: G });
    for (const z of [-120.6, -195.4]) {
      b.add(bevelBox(1.3, 2.3, 1.3, 0.22, 'y'), { p: [s * 19.4, 4.15, z], c: C.oak, surf: S(K_WOOD, 1) });
      b.add(bevelBox(1.6, 0.24, 1.6, 0.1, 'y'), { p: [s * 19.4, 5.3, z], c: C.gilt, surf: G });
      b.add(lathe([[0.42, 0], [0.48, 0.15], [0.18, 0.36], [0.25, 0.54], [0.69, 1.08], [0.78, 1.5], [0.66, 1.65], [0.72, 1.74], [0, 1.74]], 8), { p: [s * 19.4, 5.42, z], c: C.gilt, surf: G });
      for (let j = 0; j < 5; j++) b.add(new THREE.SphereGeometry(0.27, 6, 4), { p: [s * 19.4 + Math.cos(j * 1.257) * (j < 4 ? 0.34 : 0), 7.3 + (j < 4 ? 0 : 0.3), z + Math.sin(j * 1.257) * (j < 4 ? 0.34 : 0)], c: shade(C.pom, 1.0 + 0.12 * j), surf: S(K_METAL, 0.15) });
      ropeGarland(b, rng, s * 19.4, z, 0.72, 5.3, leafHex, detail);
      await ctx.yield();
    }
  }
  // the carpet: one dusky crimson with a woven gold border (the pattern is the shader's), up the axis from the crossing to the doorway
  const band = (z0, z1, y) => {
    quadTo(b, [-2.4, y + 0.03, z0], [2.4, y + 0.03, z0], [2.4, y + 0.03, z1], [-2.4, y + 0.03, z1], [0, 100, z0], crimson, CARPET);
    for (const s of [-1, 1]) quadTo(b, [s * 2.4, y + 0.035, z0], [s * 2.75, y + 0.035, z0], [s * 2.75, y + 0.035, z1], [s * 2.4, y + 0.035, z1], [0, 100, z0], C.gilt, S(K_METAL, 0.3));
  };
  { const GC = S(K_PLAIN, 0, 7);                                             // the great carpet (its pattern and fringe: the shader's)
    quadTo(b, [-18.5, 3.04, -194.95], [18.5, 3.04, -194.95], [18.5, 3.04, -121.05], [-18.5, 3.04, -121.05], up, '#ffffff', GC); }
  for (const [z0, z1] of [[-120, -121.05], [-194.95, -196]]) band(z0, z1, 3);
  for (let i = 0; i < 3; i++) { band(-117 - i, -118 - i, i + 1); band(-199 + i, -198 + i, i + 1); }
  band(-199, -238, 0); band(-54, -117, 0);
  await ctx.yield();
  // the two ranks: tables 3.0 wide, tops y 6.0, glasses 0.9 either side, a low candle every 3.2 m
  const zN = RANK_Z0 - 3.2 * (RANK_N - 1);
  for (const cx of [-5, 5]) {
    linenTable(b, cx, zN - 2.2, RANK_Z0 + 2.2, 1.5, 6.0, 3.6, S(K_LINEN, cx, zN, RANK_Z0), 3.0, 0.8);
    await ctx.yield();
    for (let k = 0; k < RANK_N; k++) { const z = RANK_Z0 - 3.2 * k; R.stick(cx, 6.0, z, true, 0.46, 0.16); if (k % 2 === 0) R.smoke.push(cx, 6.0 + R.fy + 0.42, z, 3.0); }
    for (let j = 0; j < RANK_N * 2; j++) { const z = RANK_Z0 + 0.8 - 1.6 * j, fz = RANK_Z0 - 3.2 * Math.floor(j / 2);
      for (const s of [-1, 1]) R.glass(cx + s * 0.9, 6.0, z, cx, 6.0 + R.fy + 0.16, fz, 1, 1); }
  }
}
// THE CANDLES ON THE DAIS STEPS, all round, by a rule of place: on every tread a cluster every 2.5 m (the south and north
// flights: from 4.4 m either side of the axis, each tread 0.8 m further out than the one below; the side flights: along
// the tread's whole length). A cluster stands on a low oval gilt tray (1.36 m long, 0.84 m deep, a raised rim): three to
// five candles of three kinds, always one of each: a THICK low pillar (0.4 m through, 0.46 m of wax) in an amber glass
// cup, a MIDDLE one (0.26 m through, 0.78 m) and a SLENDER tall one (0.16 m through, 0.94 m, in a gilt pricket 0.14 m
// high: its top 1.08 m over the tread, the tallest thing of the cluster); the wax six tenths as tall in the blue hour.
// The wax is the shader's pillar wax (surf.z = -1): warm, translucent under the flame, a darker melted rim, runs down
// its side. Three weights, dealt once by the cluster's distance from the flown line in plan: within 7 m six sides, a
// sunk top, a wick end, the cup and the pricket turned; within 13 m four sides; beyond, three sides and a flat tray.
// Every candle carries its flame; within 13 m every flame its own glare too; a cluster carries one glare for all.
// THE DARK END: on the dais's north-west quarter (the west flight north of z -170 and the west half of the north
// flight), which lies behind the great glass as seen from the line, no candle stands, lit or unlit: at every second place
// of the rule a low bronze bowl of dark leaves and white flowers (0.56 m to its rim's edge, 0.75 m high with its
// flowers), and nothing that glows
const STEP_WAX = [[0.2, 0.46, 0, 0.5, 0.19], [0.13, 0.78, 0, 0.42, 0.15], [0.08, 0.94, 0.14, 0.36, 0.12]];   // radius, wax, foot under it, its flame's height and width
const STEP_AT = [[0.02, 0.13, 2], [-0.36, -0.05, 0], [0.33, -0.03, 1], [0.56, 0.12, 1], [-0.57, 0.13, 2]];      // along the tread, toward the riser behind, which kind
function stepCandleGeos(k, w) {
  const sides = [6, 4, 3][w], G = S(K_METAL, 0.7);
  const wax = (g, top, glow, c) => { const pa = g.attributes.position, sf = new Float32Array(pa.count * 4), col = new Float32Array(pa.count * 3), cc = hex(c);
    for (let i = 0; i < pa.count; i++) { sf.set([K_PLAIN, glow, -1, Math.max(top - pa.getY(i), 0)], i * 4); const t = clamp(1 - (top - pa.getY(i)) / 0.3, 0, 1); col.set([cc.r * (0.8 + 0.45 * t), cc.g * (0.8 + 0.4 * t), cc.b * (0.8 + 0.3 * t)], i * 3); }
    g.setAttribute('surf', new THREE.BufferAttribute(sf, 4)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; };
  const candles = STEP_WAX.map(([r, h0, ft]) => { const h = h0 * k, top = ft + h, b = INT.makeBuilder();
    b.add(wax(lathe(w === 2 ? [[r, ft], [r * 0.96, top]] : [[r, ft], [r, ft + h * 0.6], [r * 0.96, top]], sides), top, 0.5, C.wax), {});
    if (w === 2) b.add(wax(new THREE.CircleGeometry(r * 0.96, 3).rotateX(-PI / 2).translate(0, top, 0), top + 0.2, 0.8, C.wax), {});
    else { const cap = new THREE.ConeGeometry(r * 0.96, 0.035, sides, 1, true).rotateX(PI).translate(0, top - 0.0175, 0); wax(cap, top, 0.9, C.wax);
      const ca = cap.attributes.color, cp = cap.attributes.position; for (let i = 0; i < cp.count; i++) if (Math.hypot(cp.getX(i), cp.getZ(i)) > r * 0.5) ca.setXYZ(i, ca.getX(i) * 0.5, ca.getY(i) * 0.42, ca.getZ(i) * 0.32);
      b.add(cap, {}); }
    if (!w) b.add(new THREE.ConeGeometry(0.012, 0.09, 3, 1, true), { p: [0.005, top + 0.02, 0], r: [0.2, 0, 0.12], c: '#140e0a', surf: S(K_PLAIN) });
    if (ft > 0 && w < 2) b.add(lathe([[0.17, 0.02], [0.06, 0.06], [0.045, 0.1], [0.13, ft]], sides), { c: C.gilt, surf: G });                       // the pricket
    if (ft === 0 && r > 0.15 && w < 2) b.add(cyl(r + 0.08, r + 0.04, 0.3, sides, true), { p: [0, 0.19, 0], c: '#e0a860', surf: S(K_PLAIN, 0.45) });   // the glass cup
    return b.build(); });
  const tb = INT.makeBuilder();
  if (w === 2) tb.add(new THREE.CircleGeometry(0.68, 6).rotateX(-PI / 2), { p: [0, 0.07, 0], s: [1, 1, 0.62], c: shade(C.gilt, 0.9), surf: G });
  else tb.add(lathe([[0, 0.05], [0.58, 0.05], [0.66, 0.11], [0.69, 0.1], [0.66, 0.0]], w ? 6 : 10), { s: [1, 1, 0.62], c: C.gilt, surf: G });
  return { candles, tray: tb.build() };
}
// the flowers of a step bowl, unit size: a dark low core under twelve sprays of leaves and five full white roses
function bowlHeadGeometry(rnd) {
  const LM = makeLeafMass(rnd), lump = (x, y, z) => 0.8 + 0.1 * Math.sin(3.4 * x + 1.0) * Math.cos(2.9 * z + 2.0);
  LM.core(new THREE.IcosahedronGeometry(0.8, 0), lump, '#141f12', null);
  const dir = (i, n) => { const y = 1 - 1.1 * (i + 0.5) / n, r = Math.sqrt(Math.max(1 - y * y, 0)), a = i * 2.39996 + rnd() * 0.5; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let i = 0; i < 12; i++) { const d = dir(i, 12), k = 0.95 + 0.14 * rnd(); LM.card([d[0] * k, d[1] * k * 0.8, d[2] * k], d, 0.34 + 0.08 * rnd(), 13, LEAF_GREENS[i % 4], (0.6 + 0.25 * rnd()) * (0.8 + 0.2 * d[1]), 0.9); }
  for (let i = 0; i < 5; i++) { const d = dir(i, 5); LM.card([d[0] * 1.02, d[1] * 0.86, d[2] * 1.02], d, 0.22 + 0.05 * rnd(), 16, '#e6dfcc', 0.8 + 0.2 * rnd(), 0.35); }
  LM.scale(1 / LM.reach());
  return LM.geo();
}
async function buildStepCandles(ctx, b, R, rng, path, burn) {
  const k = burn < 1 ? 0.6 : 1, geos = [0, 1, 2].map((w) => stepCandleGeos(k, w)), br = rng.fork('bowls'), heads = [0, 1].map(() => bowlHeadGeometry(() => br.range(0, 1)));
  let least = 1e9, count = 0, bowls = 0, bowlLeast = 1e9, nDark = 0;
  const cluster = (cx, y, cz, alongX, ox, oz) => {                            // (ox, oz): the way out from the dais
    const d = path.nearestXZ(cx, cz).dist, w = d < 7 ? 0 : d < 13 ? 1 : 2, n = rng.int(3, 5), yaw = alongX ? 0 : PI / 2;
    if (cx < 0 && cz < -170) {                                                   // THE DARK END: a bowl of leaves and white flowers at every second place
      if ((nDark++ & 1) === 0) { b.add(lathe([[0.2, 0], [0.27, 0.04], [0.2, 0.1], [0.5, 0.32], [0.56, 0.34]], 5), { p: [cx, y, cz], c: '#4a3a22', surf: S(K_METAL, 0.35) });
        b.add(heads[bowls & 1], { p: [cx, y + 0.36, cz], r: [0, br.range(0, TAU), 0], s: [0.6, 0.5, 0.6] }); bowls++;
        bowlLeast = Math.min(bowlLeast, path.distanceTo(cx, y + 0.5, cz) - 0.62); }
      return; }
    b.add(geos[w].tray, { p: [cx, y, cz], r: [0, yaw, 0] });
    for (let i = 0; i < n; i++) { const [al, ac, kind] = STEP_AT[i], [r, h0, ft, fh, fw] = STEP_WAX[kind], top = ft + h0 * k;
      const x = cx + (alongX ? al : -ox * ac), z = cz + (alongX ? -oz * ac : al);
      b.add(geos[w].candles[kind], { p: [x, y + 0.05, z], r: [0, rng.range(0, TAU), 0] });
      R.bare(x, y + 0.05 + top + 0.02, z, fh, fw); if (w < 2) R.glow(x, y + 0.05 + top + 0.2, z, 0.75);
      least = Math.min(least, path.distanceTo(x, y + 0.05 + top + fh + 0.04, z) - 0.15); }
    R.glow(cx, y + 0.3 + 0.7 * k, cz, 2.0); count++; };
  for (let i = 0; i < 3; i++) { const y = i + 1, xo = 22.1 - 0.7 * i;
    for (const [z, oz] of [[-117.5 - i, 1], [-198.5 + i, -1]]) for (const s of [-1, 1]) for (let x = 4.4 + 0.8 * i; x <= xo - 1.4; x += 2.5) cluster(s * x, y, z, true, 0, oz);
    await ctx.yield();
    for (const s of [-1, 1]) { for (let z = -118.6 - i; z >= -197.4 + i; z -= 2.5) cluster(s * (xo - 0.35), y, z, false, s, 0); await ctx.yield(); }
  }
  for (const g of geos) { g.tray.dispose(); for (const q of g.candles) q.dispose(); } for (const g of heads) g.dispose();
  return { least, count, bowls, bowlLeast };
}
// A GREAT GILT URN of white flowers and greenery on an oak pedestal (foot at (x, y, z); the flowers' middle 2.95 m up, their
// farthest leaf 1.15 m from it): a LEAF MASS (`head`, urnHeadGeometry) standing out of the urn's mouth
function urnAt(b, rng, x, y, z, head) {
  b.add(bevelBox(1.5, 1.0, 1.5, 0.2, 'y'), { p: [x, y + 0.5, z], c: C.oakD, surf: S(K_WOOD, 1) });
  b.add(lathe([[0.45, 0], [0.5, 0.1], [0.2, 0.3], [0.28, 0.5], [0.8, 1.0], [0.9, 1.45], [0.74, 1.6], [0.82, 1.7]], 8), { p: [x, y + 1.0, z], c: C.gilt, surf: S(K_METAL, 0.7) });
  b.add(head, { p: [x, y + 2.95, z], r: [0, rng.range(0, TAU), 0], s: [1.15, 1.15, 1.15], c: shade('#ffffff', rng.range(0.92, 1.08)) });
}
// a gathered curtain as one closed, pleated tube about a vertical line: rows = [y, radius]; n points round, `pl` pleats
function curtainGeometry(rows, n = 10, pl = 5) {
  const pos = [], idx = [];
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < n; i++) { const a = (i / n) * TAU, r = rows[j][1] * (1 + 0.28 * Math.cos(pl * a + j * 0.9));
    pos.push(Math.cos(a) * r, rows[j][0], Math.sin(a) * r); }
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * n + i, c = j * n + (i + 1) % n; idx.push(a, c, a + n, c, c + n, a + n); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// THE CANOPY over the dais: a tester of deep crimson cloth 34 m by 60 m (x -17 to 17, z -128 to -188; underside y 26,
// lined with a painted night sky: the shader's), hung by gilt chains from the four trusses over it and from the fifth beyond
// its north edge; a scalloped crimson valance all round (cusps y 23.9, tips y 22.6) with a gold fringe (lowest edge
// y 22.2); four long curtains gathered at its corners, each drawn into a gilt tie-back at y 9 and falling to the dais.
// (the gathered corner curtain of the canopy: [y, radius], top to foot)
const CANOPY_CUR = [[26.3, 1.5], [22, 1.25], [17, 0.95], [12, 0.62], [9.6, 0.46], [9.0, 0.4], [8.3, 0.5], [6, 0.7], [3.1, 0.85]];
function buildCanopy(b) {
  const VEL = S(K_PLAIN, 0, 5), LIN = S(K_PLAIN, 0, 4), FR = S(K_PLAIN, 0, 2), G = S(K_METAL, 0.7), crim = '#6a1420', gold = '#9a7430';
  const X = 17, Z0 = -128, Z1 = -188;
  b.quad([-X, 26, Z1], [X, 26, Z1], [X, 26, Z0], [-X, 26, Z0], '#8a6a2c', LIN);                        // the lining, seen from below (a painted night sky: the shader's)
  quadTo(b, [-X, 26.5, Z1], [X, 26.5, Z1], [X, 26.5, Z0], [-X, 26.5, Z0], [0, 99, -158], crim, VEL);
  const edge = (p0, p1, n, out) => {                                          // one side of the valance: n scallops from p0 to p1
    for (let k = 0; k < n * 4; k++) {
      const u0 = k / (n * 4), u1 = (k + 1) / (n * 4), q = (u) => [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u];
      const a = q(u0), c = q(u1), ya = 23.9 - 1.3 * Math.abs(Math.sin(u0 * n * PI)), yc = 23.9 - 1.3 * Math.abs(Math.sin(u1 * n * PI));
      quadTo(b, [a[0], 26.5, a[1]], [c[0], 26.5, c[1]], [c[0], yc, c[1]], [a[0], ya, a[1]], out, crim, VEL);
      quadTo(b, [a[0], ya, a[1]], [c[0], yc, c[1]], [c[0], yc - 0.4, c[1]], [a[0], ya - 0.4, a[1]], out, gold, FR);
    }
  };
  edge([-X, Z0], [X, Z0], 10, [0, 24, 99]); edge([-X, Z1], [X, Z1], 10, [0, 24, -999]);
  for (const s of [-1, 1]) edge([s * X, Z0], [s * X, Z1], 18, [s * 999, 24, -158]);
  // THE INNER VALANCE, all round under the lining, 0.7 m in from the outer one: old-gold silk in scallops 3.26 to 3.38 m
  // wide that hang from y 26 to y 24.9 at their joins and y 24.2 at their bellies, a crimson tassel 0.9 m long, paler at
  // its head, under every belly (to y 23.3)
  { const xi = X - 0.7, za = Z0 - 0.7, zb = Z1 + 0.7, tas = lathe([[0.02, -0.9], [0.17, -0.8], [0.09, -0.16], [0.02, 0]], 3);
    const inner = (p0, p1, n, out) => { for (let k = 0; k < n * 4; k++) { const q = (u) => [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u], u0 = k / (n * 4), u1 = (k + 1) / (n * 4), a = q(u0), c = q(u1);
        quadTo(b, [a[0], 26, a[1]], [c[0], 26, c[1]], [c[0], 24.9 - 0.7 * Math.abs(Math.sin(u1 * n * PI)), c[1]], [a[0], 24.9 - 0.7 * Math.abs(Math.sin(u0 * n * PI)), a[1]], out, '#b08a3a', FR); }
      for (let k = 0; k < n; k++) { const t = q2(p0, p1, (k + 0.5) / n); b.add(tas, { p: [t[0], 24.2, t[1]], c: crim, surf: VEL, grad: [24.0, 24.2, 1, 3.2] }); } };
    const q2 = (p0, p1, u) => [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u];
    inner([-xi, za], [xi, za], 10, [0, 25, -158]); inner([-xi, zb], [xi, zb], 10, [0, 25, -158]);
    for (const s of [-1, 1]) inner([s * xi, za], [s * xi, zb], 18, [0, 25, -158]);
    tas.dispose();
    // THE BOSS in the lining's middle, over the chandelier (x 0, z -155): a gilt rose 4 m across in twelve lobes, 0.95 m deep
    b.add(lathe([[2.0, 0], [1.92, -0.14], [1.5, -0.22], [1.25, -0.5], [0.72, -0.62], [0.5, -0.86], [0.18, -0.95]], 12), { p: [0, 26, -155], c: shade(C.gilt, 1.25), surf: S(K_METAL, 0.8),
      tint: (x, y, z, c, lx, ly, lz) => { c.multiplyScalar(0.62 + 0.55 * Math.abs(Math.sin(Math.atan2(lz, lx) * 6))); } }); }
  for (const s of [-1, 1]) for (const z of [Z0 - 0.6, Z1 + 0.6]) {
    b.add(curtainGeometry(CANOPY_CUR), { p: [s * (X - 0.6), 0, z], c: crim, surf: VEL });
    b.add(new THREE.TorusGeometry(0.52, 0.1, 4, 10), { p: [s * (X - 0.6), 9.0, z], r: [PI / 2, 0, 0], c: C.gilt, surf: G });
    b.add(lathe([[0.02, -1.1], [0.2, -0.9], [0.12, -0.3], [0.2, -0.1], [0.02, 0]], 5), { p: [s * (X - 0.6 + 0.6), 8.9, z], c: gold, surf: FR });   // its tassel
  }
  for (const z of [-128, -144, -160, -176, -192]) for (const x of [-X, 0, X]) {                          // the chains: up to each truss's arch brace
    const yT = x ? 33.0 : 39.5, zb = Math.max(z, Z1 + 0.5), len = Math.hypot(yT - 26.5, z - zb);
    b.add(bevelBox(0.22, len, 0.22, 0.06, 'y'), { p: [x, (yT + 26.5) / 2, (z + zb) / 2], r: [Math.atan2(z - zb, yT - 26.5), 0, 0], c: C.gilt, surf: G });
  }
}
// THE GREAT DOORWAY's dressing on the north wall (z -246): crimson velvet curtains drawn back to either side from a carved
// gilt pelmet (x -13.6 to 13.6, y 23 to 25.4, a vine frieze on its face, a moulded cornice over it to y 25.97) over the arch, each falling in deep folds from y 24 to the floor between x 9.5
// and 13.4 and caught by a gilt tie-back at y 9.5, a gold fringe down its inner edge; over the pelmet a wheel window of
// stone tracery (radius 5.5 about y 33: a rim, a hub, eight spokes) with the night behind it; a thick garland swagged over
// the arch; and either side, from the wainscot to y 26, six shelves in two bays between three pilasters (x 14.5, 22.75,
// 31), a sconce on each pilaster: the second and the fifth shelf (y 13.5 and 21) carry half-full glasses, ten to a bay
// (80 in all); the other four carry gilt and silver plate, painted on the board behind (the shader's).
const NWALL_X = [14.5, 22.75, 31], NWALL_Y = [11, 13.5, 16, 18.5, 21, 23.5];
async function buildDoorway(ctx, b, R, rng, burn, dist) {
  const VEL = S(K_PLAIN, 0, 5), FR = S(K_PLAIN, 0, 2), G = S(K_METAL, 0.7), W = S(K_WOOD), ST = S(K_STONE), crim = '#6a1420', gold = '#9a7430', Z = -244.3;
  // the pelmet: a gilt board with a moulded cornice, a carved shell at its middle, a turned finial at either end
  // (the board's face carries a vine frieze in relief: the shader's; the cornice steps out in three mouldings, a bead runs under the board)
  b.add(bevelBox(27.2, 2.4, 0.9, 0.3, 'x'), { p: [0, 24.2, Z], c: C.gilt, surf: S(K_METAL, 0.7, 1) });
  b.add(bevelBox(27.6, 0.3, 1.1, 0.1, 'x'), { p: [0, 25.2, Z], c: shade(C.gilt, 0.8), surf: G });
  b.add(bevelBox(28.2, 0.5, 1.4, 0.16, 'x'), { p: [0, 25.5, Z], c: C.gilt, surf: S(K_METAL, 0.85) });
  b.add(bevelBox(28.8, 0.22, 1.7, 0.08, 'x'), { p: [0, 25.86, Z], c: shade(C.gilt, 1.1), surf: S(K_METAL, 0.85) });
  b.add(bevelBox(27.5, 0.24, 1.05, 0.1, 'x'), { p: [0, 23.05, Z], c: shade(C.gilt, 0.85), surf: G });
  b.add(new THREE.SphereGeometry(1, 9, 3, 0, PI, 0, PI / 2), { p: [0, 25.7, Z - 0.3], s: [3.0, 2.0, 1.0], c: C.gilt, surf: G,
    tint: (x, y, z, c, lx, ly, lz) => { c.multiplyScalar(0.55 + 0.6 * Math.abs(Math.sin(Math.atan2(lz, -lx) * 4.5))); } });
  for (const s of [-1, 1]) b.add(lathe([[0.3, 0], [0.45, 0.4], [0.15, 0.8], [0.34, 1.3], [0.0, 1.9]], 6), { p: [s * 13.4, 25.7, Z], c: C.gilt, surf: G });
  for (const s of [-1, 1]) {                                                 // the curtains: a sheet in deep folds, swept back to its tie
    const rows = [[24, 9.5, 13.4], [20, 9.9, 13.4], [15, 10.7, 13.4], [11, 11.6, 13.3], [9.5, 11.9, 13.1], [8.6, 11.7, 13.2], [5, 11.2, 13.4], [0.05, 10.9, 13.5]];
    const n = 12, pos = [], idx = [];
    for (let j = 0; j < rows.length; j++) for (let i = 0; i <= n; i++) { const u = i / n;
      pos.push(s * (rows[j][1] + (rows[j][2] - rows[j][1]) * u), rows[j][0], Z + 0.1 + 0.34 * Math.sin(u * 6 * PI + j * 0.5)); }
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, c = a + n + 1; idx.push(a, a + 1, c, a + 1, c + 1, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, { c: crim, surf: VEL });
    for (let j = 0; j < rows.length - 1; j++) quadTo(b, [s * rows[j][1], rows[j][0], Z + 0.47], [s * (rows[j][1] + 0.3), rows[j][0], Z + 0.47], [s * (rows[j + 1][1] + 0.3), rows[j + 1][0], Z + 0.47], [s * rows[j + 1][1], rows[j + 1][0], Z + 0.47], [0, 10, 0], gold, FR);
    b.add(bevelBox(1.5, 0.3, 0.9, 0.1, 'x'), { p: [s * 12.5, 9.5, Z + 0.1], c: C.gilt, surf: G });                         // the tie-back
    b.add(lathe([[0.02, -1.2], [0.22, -1.0], [0.13, -0.3], [0.22, -0.1], [0.02, 0]], 5), { p: [s * 13.5, 9.3, Z + 0.5], c: gold, surf: FR });
  }
  await ctx.yield();
  // the wheel window over the pelmet
  { const pane = new THREE.CircleGeometry(5.5, 24); b.add(pane, { p: [0, 33, -245.7], c: '#ffffff', surf: S(K_PANE, 2) });
    b.add(new THREE.TorusGeometry(5.7, 0.6, 4, 24), { p: [0, 33, -245.5], c: C.stone, surf: ST });
    b.add(new THREE.TorusGeometry(1.5, 0.4, 4, 12), { p: [0, 33, -245.5], c: C.stone, surf: ST });
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * PI / 4; b.add(bevelBox(0.5, 3.9, 0.7, 0.12, 'y'), { p: [Math.cos(a) * 3.55, 33 + Math.sin(a) * 3.55, -245.5], r: [0, 0, a - PI / 2], c: C.stone, surf: ST }); } }
  // THE GARLAND OVER THE ARCH: a thick swag of leaves, white roses, blossom and fruit (a LEAF MASS, as the orange trees'
  // heads are), in five swags from one impost to the other: its middle line 11.3 m from the arch's middle at the ties and
  // 10.55 m in the belly of each swag, the leaves' middles 0.5 m from that line at a tie and 0.75 m in a belly, so that
  // the mass is as wide as the arch's moulding (1.5 m) where it is fullest. Over the arch's head it lies against the
  // moulding's face; toward the imposts it comes 0.85 m forward to pass before the curtains' inner edges. A tail of it
  // hangs down either jamb from the impost to y 3.4, thinning. Returns the mass's least distance to the flown line.
  let garlandLeast = 1e9;
  { const lr = rng.fork('archswag'), LM = makeLeafMass(() => lr.range(0, 1)), pts = [], fruitHex = ['#8a2a22', '#b08a2c', '#c06a1c'];
    for (let i = 0; i <= 60; i++) { const u = i / 60, a = u * PI, sw = Math.abs(Math.sin(u * 5 * PI)), r = 11.3 - 0.75 * sw, x = Math.cos(a) * r;
      pts.push([x, 11 + Math.sin(a) * r, -243.9 + 0.85 * smoothstep(8.2, 10.2, Math.abs(x)), (0.5 + 0.25 * sw) / 0.75]); }
    LM.rope(pts, 0.75, 5, [0, 0, 1], { leaf: 4.2, rose: 0.8, fruit: 0.7, bloom: 0.45, fruitHex });
    for (const sx of [-1, 1]) LM.rope([[sx * 11.3, 11.2, -243.05, 0.7], [sx * 11.25, 9.8, -243.05, 0.74], [sx * 11.1, 8.2, -243.05, 0.68], [sx * 11.1, 6.4, -243.05, 0.56], [sx * 11.1, 4.8, -243.05, 0.42], [sx * 11.1, 3.4, -243.05, 0.24]],
      0.75, 4, [0, 0, 1], { leaf: 5.5, rose: 0.9, fruit: 0.7, bloom: 0.5, fruitHex });
    garlandLeast = LM.least(dist); b.add(LM.geo(), {}); }
  // the shelved wall
  for (const s of [-1, 1]) {
    await ctx.yield();
    quadTo(b, [s * 14.5, 10.4, -245.6], [s * 31, 10.4, -245.6], [s * 31, 26, -245.6], [s * 14.5, 26, -245.6], [0, 15, 0], shade(C.oakD, 0.8), S(K_WOOD, -3, 1, s * 22.75));
    for (const y of NWALL_Y) b.add(openBox(16.5, 0.22, 1.4, 'NEW'), { p: [s * 22.75, y - 0.11, -245.2], c: C.oak, surf: W });
    b.add(bevelBox(18.2, 0.7, 1.9, 0.2, 'x'), { p: [s * 22.75, 26.3, -245.1], c: C.oak, surf: W });
    for (const x of NWALL_X) {
      b.add(bevelBox(1.0, 15.8, 1.1, 0.16, 'y'), { p: [s * x, 18.2, -245.0], c: C.oak, surf: S(K_WOOD, 1) });
      b.add(bevelBox(0.14, 0.14, 0.9, 0.04, 'z'), { p: [s * x, 16.0, -244.2], c: C.iron, surf: S(K_METAL, 0.3) });         // its sconce
      b.add(new THREE.ConeGeometry(0.3, 0.16, 7, 1, true), { p: [s * x, 16.1, -243.8], r: [PI, 0, 0], c: C.gilt, surf: G });
      b.add(cyl(0.08, 0.08, 0.62 * burn, 5, true), { p: [s * x, 16.14 + 0.31 * burn, -243.8], c: C.wax, surf: S(K_PLAIN, 0.6) });
      R.flame(s * x, 16.16 + 0.62 * burn, -243.8, 0.4, 0.15);
    }
    for (let bay = 0; bay < 2; bay++) for (const y of [NWALL_Y[1], NWALL_Y[4]]) for (let i = 0; i < 10; i++) {
      const x = s * (NWALL_X[bay] + 0.975 + 0.7 * i), fx = s * NWALL_X[i < 5 ? bay : bay + 1];
      R.glass(x, y, -245.2, fx, 16.33 + 0.62 * burn, -243.8, 3.2, 0);
    }
  }
  await ctx.yield();
  // UNDER THE SHELVES, from the floor to y 10.3: a gilt pilaster under each oak one (x 14.5, 22.75, 31), and in each bay
  // between them two TALL ARCHED NICHES (3 m wide, from a stone sill at y 1.2 to a round head at y 9.4, in a gilt frame
  // 0.24 m wide and 0.5 m deep; lined in deep blue with gilt stars: the shader's), a candle at either end of every
  // sill. By turns along the wall a niche holds a tiered gilt stand (a dish 1.08 m in radius at y 2.5 with six of the
  // hall's half-full glasses round its front, a dish 0.65 m in radius at y 4.2 with four, a candle on its head: ten
  // glasses a stand, forty in all, taken off the west transept's four dressers) or a great gilt urn of flowers (set by
  // build(): the places come back in `urns`). On every pilaster, 7.2 m up, a gilt sconce of three candles
  let sconceLeast = 1e9, cupLeast = 1e9, nCups = 0, nicheLeast = 1e9, nicheGlasses = 0; const urns = [];
  const nicheFrame = archBand(3.0, 8.2, 0.24, 0.5, 10), nichePane = archPane(3.0, 8.2, 10);
  const standGeo = lathe([[0.5, 0], [0.55, 0.08], [0.2, 0.2], [0.12, 0.6], [0.2, 1.0], [0.12, 1.2], [1.05, 1.26], [1.08, 1.3], [0.15, 1.3], [0.1, 1.7], [0.18, 2.3], [0.1, 2.9],
    [0.62, 2.96], [0.65, 3.0], [0.12, 3.0], [0.08, 3.5], [0.2, 4.0], [0.26, 4.3], [0.0, 4.32]], 8);
  for (const s of [-1, 1]) {
    for (let bay = 0; bay < 2; bay++) for (const m of [-1, 1]) { const xm = s * ((NWALL_X[bay] + NWALL_X[bay + 1]) / 2 + m * 1.85), stand = m * (bay ? 1 : -1) > 0;
      b.add(nicheFrame, { p: [xm, 1.2, -245.2], c: shade(C.gilt, 1.1), surf: G });
      b.add(nichePane, { p: [xm, 1.2, -245.44], c: '#ffffff', surf: S(K_PLAIN, 0, -2, xm) });
      b.add(openBox(3.5, 1.2, 1.4, 'ND'), { p: [xm, 0.6, -245.2], c: C.stoneD, surf: ST });                             // its sill
      for (const e of [-1, 1]) { const cx = xm + e * 1.3, cz = -244.8;                                                 // a candle at either end of the sill
        b.add(new THREE.ConeGeometry(0.2, 0.12, 5, 1, true), { p: [cx, 1.26, cz], r: [PI, 0, 0], c: C.gilt, surf: G });
        b.add(cyl(0.075, 0.075, 0.6 * burn, 4, true), { p: [cx, 1.3 + 0.3 * burn, cz], c: C.wax, surf: S(K_PLAIN, 0.6) });
        R.flame(cx, 1.32 + 0.6 * burn, cz, 0.38, 0.14); nicheLeast = Math.min(nicheLeast, dist(cx, 1.8 + 0.6 * burn, cz) - 0.15); }
      if (stand) { const sz = -245.0, fy = 1.2 + 4.34 + 0.7 * burn;
        b.add(standGeo, { p: [xm, 1.2, sz], c: shade(C.gilt, 1.15), surf: G });
        b.add(cyl(0.09, 0.09, 0.7 * burn, 5, true), { p: [xm, 5.52 + 0.35 * burn, sz], c: C.wax, surf: S(K_PLAIN, 0.6) });
        R.flame(xm, fy, sz, 0.42, 0.15);
        for (let i = 0; i < 6; i++) { const a = (-75 + 30 * i) * PI / 180; R.glass(xm + Math.sin(a) * 0.86, 2.5, sz + Math.cos(a) * 0.86, xm, fy, sz, 3.2, 0); }
        for (let i = 0; i < 4; i++) { const a = (-66 + 44 * i) * PI / 180; R.glass(xm + Math.sin(a) * 0.44, 4.2, sz + Math.cos(a) * 0.44, xm, fy, sz, 3.2, 0); }
        nicheLeast = Math.min(nicheLeast, dist(xm, 4.0, sz) - 2.6); nicheGlasses += 10; }
      else urns.push([xm, 1.2, -245.0]); }
    for (const x0 of NWALL_X) { const x = s * x0;
      b.add(openBox(1.0, 10.3, 0.5, 'ND'), { p: [x, 5.15, -245.35], c: C.gilt, surf: S(K_METAL, 0.6) });
      b.add(openBox(1.3, 0.45, 0.7, 'N'), { p: [x, 10.1, -245.3], c: shade(C.gilt, 1.15), surf: G });
      b.add(lathe([[0.02, -0.7], [0.4, -0.3], [0.5, 0.4], [0.02, 1.1]], 4), { p: [x, 7.2, -245.08], s: [1, 1, 0.25], c: shade(C.gilt, 1.2), surf: G });
      for (const e of [-1, 0, 1]) { const cx = x + e * 0.5, cz = -244.45 + 0.12 * Math.abs(e), cy = 7.3 + (e ? 0 : 0.35);
        b.add(openBox(0.09, 0.09, 0.62, 'SN'), { p: [cx, cy - 0.12, cz - 0.3], c: C.gilt, surf: G });
        b.add(new THREE.ConeGeometry(0.24, 0.14, 5, 1, true), { p: [cx, cy, cz], r: [PI, 0, 0], c: C.gilt, surf: G });
        b.add(cyl(0.075, 0.075, 0.6 * burn, 4, true), { p: [cx, cy + 0.04 + 0.3 * burn, cz], c: C.wax, surf: S(K_PLAIN, 0.6) });
        R.flame(cx, cy + 0.06 + 0.6 * burn, cz, 0.38, 0.14);
        sconceLeast = Math.min(sconceLeast, dist(cx, cy + 0.5 + 0.6 * burn, cz) - 0.15); } }
  }
  await ctx.yield();
  // THE RING OF FLAME round the arch: small candles in amber glass cups on gilt brackets, in two ranks that follow the
  // arch up both jambs from y 1.2 and round its head: one on the outer moulding's face 9.2 m from the arch's middle
  // line (z -245.2), one on the inner order's face 9.62 m from it (z -244.5), a cup every 1.05 m, the two ranks out of
  // step; the garland hangs outside them (its leaves no nearer the middle than 9.8 m)
  { const cup = new THREE.CylinderGeometry(0.16, 0.1, 0.24, 4, 1, true), CUP = S(K_PLAIN, 0.75);
    const at = (x, y, z) => { b.add(cup, { p: [x, y + 0.12, z], r: [0, PI / 4, 0], c: '#e0a860', surf: CUP });
      b.add(new THREE.ConeGeometry(0.2, 0.3, 3, 1, true), { p: [x, y - 0.15, z - 0.05], r: [PI, 0, 0], c: C.gilt, surf: G });
      R.bare(x, y + 0.2, z, 0.28, 0.1); if ((nCups++ & 1) === 0) R.glow(x, y + 0.34, z, 1.0);
      cupLeast = Math.min(cupLeast, dist(x, y + 0.5, z) - 0.2); };
    for (const [r, z, ph] of [[9.2, -245.2, 0], [9.62, -244.5, 0.5]]) { const nJ = 10, nH = Math.round(PI * r / 1.05);
      for (const s of [-1, 1]) for (let j = 0; j < nJ; j++) at(s * r, 1.2 + (j + ph) * 0.98, z);
      for (let j = 0; j < nH; j++) { const a = (j + 0.5) * PI / nH; at(Math.cos(a) * r, 11 + Math.sin(a) * r, z); } }
    cup.dispose(); }
  // THE PORCH: three receding gilt arches in the throat of the stone arch, each smaller than the one before it and 1.5 m
  // behind it (openings 16.6 m wide and 18.3 high, 14.6 by 15.9, 12.6 by 13.5; fronts at z -245.45, -246.95, -248.45;
  // each 1.5 m deep, so that they step in like the orders of a great door), the portal at the back of the last. The
  // garland and the two ranks of candle cups are on the stone arch before them; the two inner arches carry small
  // lamps on their faces (a flame in an amber cup every 1.6 m up the jambs and round the head). Over each arch's
  // head, under the one before it, a sickle of the night is seen (1.2 m at the crown). The flown line passes through
  // them on the axis at y 7.2: 6.3 m from the nearest jamb
  let porchLeast = 1e9, nLamps = 0;
  { const lamp = new THREE.CylinderGeometry(0.13, 0.08, 0.2, 4, 1, true), CUP = S(K_PLAIN, 0.75);
    for (const [k, w, h, t] of [[0, 16.6, 18.3, 0.9], [1, 14.6, 15.9, 1.2], [2, 12.6, 13.5, 1.2]]) { const zf = -245.45 - 1.5 * k, r = w / 2, y0 = h - r;
      b.add(archBand(w, h, t, 1.5, 16), { p: [0, 0, zf - 0.75], c: shade(C.gilt, 0.8 - 0.09 * k), surf: S(K_METAL, 0.75, 3, r) });      // (the shader carves its face and lines its soffit)
      for (let i = 0; i <= 16; i++) { const a = (i / 16) * PI; porchLeast = Math.min(porchLeast, dist(Math.cos(a) * r, y0 + Math.sin(a) * r, zf), dist(Math.cos(a) * r, y0 + Math.sin(a) * r, zf - 1.5)); }
      for (let y = 0; y <= y0; y += 1.2) porchLeast = Math.min(porchLeast, dist(r, y, zf), dist(-r, y, zf), dist(r, y, zf - 1.5), dist(-r, y, zf - 1.5));
      if (!k) continue;
      const rl = r + t * 0.5, nJ = Math.floor((y0 - 1.6) / 1.6) + 1, nH = Math.round(PI * rl / 1.6);
      const at = (x, y) => { b.add(lamp, { p: [x, y + 0.1, zf + 0.12], r: [0, PI / 4, 0], c: '#e0a860', surf: CUP }); R.bare(x, y + 0.17, zf + 0.12, 0.24, 0.09); if ((nLamps++ & 1) === 0) R.glow(x, y + 0.3, zf + 0.12, 0.8); };
      for (const s of [-1, 1]) for (let j = 0; j < nJ; j++) at(s * rl, 1.6 + 1.6 * j);
      for (let j = 0; j < nH; j++) { const a = (j + 0.5) * PI / nH; at(Math.cos(a) * rl, y0 + Math.sin(a) * rl); } }
    lamp.dispose(); }
  nicheFrame.dispose(); nichePane.dispose(); standGeo.dispose();
  return { garland: garlandLeast, sconce: sconceLeast, cups: cupLeast, nCups, niche: nicheLeast, nicheGlasses, urns, porch: porchLeast };
}
const TV_Z = [4.9, -5, -13.6, -48.4, -57, -66.9];                          // the verdures of a transept's end wall: their middles along z
// A VERDURE between two choir windows, on a wall that runs along z: a woven hanging 7.6 m wide on a gilt rod, from y 21.8 (under
// the roof trusses' corbels) down to yb (the wainscot's rail, or the head of the dresser that stands before it); design 0 to 3
// (the shader's). (x = the wainscot's face, s = which wall: it hangs 0.5 m off that face)
// (lite, the nave's: the rod in four sides, its finials in three)
function verdureAt(b, x, z, s, design, yb, lite = false) {
  const xo = x - s * 0.5, G = S(K_METAL, 0.7);
  quadTo(b, [xo, yb, z - 3.8], [xo, yb, z + 3.8], [xo, 21.8, z + 3.8], [xo, 21.8, z - 3.8], [0, 15, z], '#ffffff', S(K_PLAIN, yb, 8 + design, z));
  b.add(cyl(0.13, 0.13, 8.4, lite ? 4 : 5, true), { p: [xo, 21.95, z], r: [PI / 2, 0, 0], c: C.gilt, surf: G });
  for (const e of [-1, 1]) b.add(lathe([[0.02, -0.3], [0.28, 0], [0.02, 0.3]], lite ? 3 : 4), { p: [xo, 21.95, z + e * 4.35], r: [PI / 2, 0, 0], c: C.gilt, surf: G });
}
// the same on a transept's side wall, which runs along x: (x = its middle, z = the wainscot's face, o = into the hall
// along z: it hangs 0.5 m off that face); its rod 7.9 m long, so that it stands between a pier and a window's frame
function verdureX(b, x, z, o, design, yb) {
  const zo = z + o * 0.5, G = S(K_METAL, 0.7);
  quadTo(b, [x - 3.8, yb, zo], [x + 3.8, yb, zo], [x + 3.8, 21.8, zo], [x - 3.8, 21.8, zo], [x, 15, zo + o * 9], '#ffffff', S(K_PLAIN, yb, 8 + design, x));
  b.add(cyl(0.13, 0.13, 7.9, 4, true), { p: [x, 21.95, zo], r: [0, 0, PI / 2], c: C.gilt, surf: G });
  for (const e of [-1, 1]) b.add(lathe([[0.02, -0.3], [0.28, 0], [0.02, 0.3]], 3), { p: [x + e * 4.1, 21.95, zo], r: [0, 0, PI / 2], c: C.gilt, surf: G });
}
// a tall oak dresser, 8 m wide, five shelves, turned posts, a sconce either side: local frame, wall at z = 0, front toward +z.
// Its back board is laid where it is placed (placeDresser: the shader's board, with the plate painted on it).
// rich (the nave's and the transepts'): its pediment is a gilt scallop shell carved in seven lobes (5.4 m wide, 1.9 m
// high) in place of the choir's oak one
const SHELF_Y = [4, 6.5, 9, 11.5, 14];
function dresserGeometry(burn = 1, rich = false) {
  const b = INT.makeBuilder(), W = S(K_WOOD), G = S(K_METAL, 0.55);
  b.add(openBox(8.2, 3.7, 1.9, 'ND'), { p: [0, 1.85, 0.95], c: C.oak, surf: S(K_WOOD, 1) });         // (the carcass and its boards: no face against the wall, none on the floor)
  b.add(openBox(8.6, 0.3, 2.2, 'ND'), { p: [0, 3.85, 1.05], c: C.oakD, surf: W });
  for (let i = 1; i < 5; i++) b.add(openBox(8.0, 0.22, 1.5, 'NEW'), { p: [0, SHELF_Y[i] - 0.11, 0.85], c: C.oak, surf: W });   // (a shelf's back and ends lie in the carcass)
  const post = []; for (let i = 0; i <= 4; i++) post.push([i % 2 === 1 ? 0.25 : 0.13, 4 + (i / 4) * 11.7]);
  for (const s of [-1, 1]) { b.add(lathe(post, 5), { p: [s * 3.98, 0, 1.5], c: C.oak, surf: W }); b.add(openBox(0.3, 11.7, 1.4, 'NUD'), { p: [s * 4.0, 9.85, 0.8], c: C.oakD, surf: W }); }
  b.add(openBox(8.9, 0.6, 2.2, 'N'), { p: [0, 15.95, 1.0], c: C.oak, surf: W });
  // the pediment: a low solid shell of carved oak (a quarter dome 5.4 wide and 1.7 high with nine ribs), a gilt boss at its foot
  if (rich) {                                                                // (the shell: each lobe a ridge between two valleys 0.14 of the radius deeper, fanned from the boss)
    const pos = [], idx = [], NL = 14, rings = [[0.16, 0.0], [0.6, 0.3], [1.0, 0.16]];
    for (let j = 0; j < 3; j++) for (let i = 0; i <= NL; i++) { const a = PI * i / NL, k = rings[j][0] * (i & 1 ? 1 : 0.86), bulge = rings[j][1] + (i & 1 ? 0.1 * rings[j][0] : 0);
      pos.push(-Math.cos(a) * k * 2.7, Math.sin(a) * k * 1.9, bulge); }
    for (let j = 0; j < 2; j++) for (let i = 0; i < NL; i++) { const a = j * (NL + 1) + i, c = a + NL + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    b.add(g, { p: [0, 16.25, 0.5], c: C.gilt, surf: S(K_METAL, 0.7) });
  } else b.add(new THREE.SphereGeometry(1, 9, 3, 0, PI, 0, PI / 2), { p: [0, 16.25, 0.2], s: [2.7, 1.7, 1.3], c: C.oak, surf: W,
    tint: (x, y, z, c, lx, ly, lz) => { c.multiplyScalar(0.6 + 0.62 * Math.abs(Math.sin(Math.atan2(lz, -lx) * 4.5))); } });
  b.add(new THREE.SphereGeometry(0.42, 5, 2, 0, PI, 0, PI / 2), { p: [0, 16.25, 1.45], c: C.gilt, surf: G });
  for (const s of [-1, 1]) {
    b.add(lathe([[0.2, 0], [0.3, 0.3], [0.1, 0.6], [0.22, 0.9], [0.0, 1.3]], 4), { p: [s * 3.9, 16.25, 1.3], c: C.gilt, surf: G });
    b.add(openBox(0.16, 0.16, 0.9, 'SN'), { p: [s * 4.9, 10.0, 0.55], c: C.iron, surf: S(K_METAL, 0.3) });       // the sconce: arm, back plate, pan, candle
    b.add(lathe([[0.02, -0.5], [0.34, -0.1], [0.42, 0.3], [0.02, 0.9]], 5), { p: [s * 4.9, 10.0, 0.16], s: [1, 1, 0.25], c: C.gilt, surf: G });
    b.add(new THREE.ConeGeometry(0.3, 0.16, 7, 1, true), { p: [s * 4.9, 10.1, 0.95], r: [PI, 0, 0], c: C.gilt, surf: G });
    b.add(cyl(0.08, 0.08, 0.62 * burn, 5, true), { p: [s * 4.9, 10.14 + 0.31 * burn, 0.95], c: C.wax, surf: S(K_PLAIN, 0.55), grad: [10.14 + 0.62 * burn - 0.15, 10.14 + 0.62 * burn, 0.5, 1.5] });
    b.add(new THREE.ConeGeometry(0.011, 0.08, 3, 1, true), { p: [s * 4.9, 10.16 + 0.62 * burn, 0.95], c: '#140e0a', surf: S(K_PLAIN) });       // its wick end
  }
  return b.build();
}
// GLASSES AND PLATE: two of a dresser's five shelves carry glasses (the second and the fourth, y 6.5 and 11.5: ten each, 20
// to a dresser); the base, the third shelf and the top shelf carry gilt and silver plate.
// rich 0: a dresser as the choir's are: a dark oak board, its chargers painted on it. 1: the lit back board with its
// chargers painted on it. 2 (a dresser within 30 m of the flown line in plan): the lit board, its third shelf's chargers
// painted, and real plate on the top shelf and on the base: three chargers on edge (gilt, silver, gilt: 1.24, 1.0 and
// 1.24 m across, leaning on the board), on the top shelf two gilt ewers 1.25 m high, on the base two silver covered
// cups 1.1 m high
function placeDresser(b, geo, R, x, z, nx, nz, burn = 1, rich = 0, far = false) {
  const ry = Math.atan2(nx, nz), tx = nz, tz = -nx, w = (lx, lz) => [x + nx * lz + tx * lx, z + nz * lz + tz * lx];
  b.add(geo, { p: [x, 0, z], r: [0, ry, 0] });
  { const q0 = w(-4, 0.14), q1 = w(4, 0.14), along = Math.abs(nx) > 0.5;
    quadTo(b, [q0[0], 0, q0[1]], [q1[0], 0, q1[1]], [q1[0], 15.7, q1[1]], [q0[0], 15.7, q0[1]], [x + nx * 9, 8, z + nz * 9], rich === 3 ? '#0d2b29' : rich ? '#6e4f2a' : shade(C.oakD, 0.8), S(K_WOOD, rich ? -1 : -2, rich === 3 ? 3 : rich === 2 ? 2 : 1, along ? z : x)); }
  if (rich >= 2) { const GP = S(K_METAL, 0.75), SP = S(K_METAL, 0.95);
    for (const y of rich === 3 ? [4, 9, 14] : [4, 14]) {
      for (let i = -1; i <= 1; i++) { const rc = i ? 0.62 : 0.5, q = w(i * 2.6, 0.2 + 0.12 * rc), g = new THREE.CircleGeometry(rc, 8);
        b.add(g, { p: [q[0], y + rc + 0.02, q[1]], r: [-0.12, ry, 0], c: i ? shade(C.gilt, 3.0) : shade(C.silver, 2.4), surf: i ? GP : SP,
          tint: (X, Y, Z, c, lx, ly) => { const rr = Math.hypot(lx, ly) / rc; c.multiplyScalar(rr < 0.1 ? 0.7 : 1.1); } }); }
      for (const e of [-1, 1]) { const q = w(e * 1.3, 0.42);
        if (y > 10) b.add(lathe([[0.2, 0], [0.1, 0.15], [0.33, 0.55], [0.1, 1.0], [0.17, 1.25]], 4), { p: [q[0], y, q[1]], r: [0, ry + 0.6 * e, 0], c: shade(C.gilt, 3.0), surf: GP });
        else if (y > 6) b.add(lathe([[0.25, 0], [0.42, 0.2], [0.45, 0.42], [0.3, 0.5], [0.34, 0.56], [0.2, 0.72], [0.06, 0.8], [0.09, 0.9], [0.0, 0.94]], 5), { p: [q[0], y, q[1]], r: [0, ry + 0.6 * e, 0], c: shade(e > 0 ? C.silver : C.gilt, e > 0 ? 2.4 : 3.0), surf: e > 0 ? SP : GP });   // (the third shelf's tureens)
        else b.add(lathe([[0.2, 0], [0.06, 0.25], [0.27, 0.6], [0.27, 0.85], [0, 1.1]], 4), { p: [q[0], y, q[1]], r: [0, ry + 0.6 * e, 0], c: shade(C.silver, 2.4), surf: SP }); } } }
  // (3, a dresser within 16 m of the flown line in plan: a pair of lit candlesticks on its base, 3.45 m either side of its middle)
  if (rich === 3) for (const e of [-1, 1]) { const q = w(e * 3.45, 1.35);
    b.add(lathe([[0.2, 0], [0.07, 0.15], [0.11, 0.5], [0.06, 0.8], [0.16, 1.0], [0.09, 1.05]], 5), { p: [q[0], 4, q[1]], c: shade(C.gilt, 2.6), surf: S(K_METAL, 0.75) });
    b.add(cyl(0.07, 0.07, 0.6 * burn, 4, true), { p: [q[0], 5.05 + 0.3 * burn, q[1]], c: C.wax, surf: S(K_PLAIN, 0.6) });
    R.flame(q[0], 5.07 + 0.6 * burn, q[1], 0.38, 0.14); }
  const fl = [-1, 1].map((s) => { const q = w(s * 4.9, 0.95); if (!(x < -6 && z < -172 && z > -236)) R.flame(q[0], 10.16 + 0.62 * burn, q[1], 0.4, 0.15); return q; });   // (THE DARK END: the west wall's dressers at z -208 and -224 stand unlit)
  for (const j of far ? [3] : [1, 3]) for (let i = 0; i < 10; i++) {            // (far: a dresser 58 m or more from the flown line in plan carries glasses on its upper glass shelf only)
    const q = w(-3.15 + 0.7 * i, 0.85), f = fl[i < 5 ? 0 : 1];
    R.glass(q[0], SHELF_Y[j], q[1], f[0], 10.33 + 0.62 * burn, f[1], 3.2, 0);
  }
}
// AN ORANGE TREE in a tub: a square panelled tub of dark green painted oak, 1.7 m wide and 1.25 m high, on four gilt ball
// feet, a gilt moulding round its head and its foot, a raised panel on each side inside a gilt line; a straight stem; a
// head about 5 m across (4.7 to 5.3; its top 11.5 to 12.4 m up): a LEAF MASS (treeHeadGeometry) of dark glossy leaves
// with small oranges and white blossom, and a ring of five small candle lanterns hung inside it, 0.3 of its radius under
// its middle and 0.66 of it out, each with its flame (THE DARK END's trees, west of the carpet before the north door,
// hang theirs unlit). Returns its least distance to the flown line (head and tub counted; the lanterns hang inside the head)
function orangeTubGeometry() {
  const b = INT.makeBuilder(), G = S(K_METAL, 0.65), W = S(K_WOOD), green = '#1c2a1e', greenL = '#2c4030';
  b.add(openBox(1.7, 1.25, 1.7, 'D'), { p: [0, 0.875, 0], c: green, surf: W });
  for (let i = 0; i < 4; i++) { const ry = i * PI / 2;                          // each side: a gilt line and, 0.05 m proud of it, the raised panel
    b.add(openBox(1.3, 0.85, 0.02, 'NEWUD'), { p: [Math.sin(ry) * 0.86, 0.875, Math.cos(ry) * 0.86], r: [0, ry, 0], c: shade(C.gilt, 0.9), surf: G });
    b.add(openBox(1.18, 0.73, 0.05, 'NEWUD'), { p: [Math.sin(ry) * 0.885, 0.875, Math.cos(ry) * 0.885], r: [0, ry, 0], c: greenL, surf: W }); }
  b.add(openBox(1.86, 0.14, 1.86, 'D'), { p: [0, 1.5, 0], c: C.gilt, surf: G });
  b.add(openBox(1.8, 0.1, 1.8, 'UD'), { p: [0, 0.3, 0], c: shade(C.gilt, 0.85), surf: G });
  for (const e of [-1, 1]) for (const f of [-1, 1]) { const g = new THREE.OctahedronGeometry(0.17, 0); g.setAttribute('normal', g.attributes.position.clone()); b.add(g, { p: [e * 0.66, 0.15, f * 0.66], c: shade(C.gilt, 1.1), surf: G }); }
  return b.build();
}
// A THICK GARLAND: a rope of leaves, flowers and fruit in the mass (the shader's foliage, surf.z 6, its surf.w the variant given) along the points
// given ([x, y, z, k]: k times the radius there), `sides` faces round, its normals the rope's own round
function garlandRope(b, pts, rad, sides, hexCol, variant = 1) {
  const pos = [], nor = [], idx = [], n = pts.length, T = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n - 1)], q = pts[i], r = rad * (q[3] === undefined ? 1 : q[3]);
    T.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
    if (Math.abs(T.y) > 0.9) V.set(1, 0, 0); else V.set(0, 1, 0);
    U.crossVectors(T, V).normalize(); V.crossVectors(T, U);
    for (let j = 0; j < sides; j++) { const an = (j / sides) * TAU, ca = Math.cos(an), sa = Math.sin(an), nx = U.x * ca + V.x * sa, ny = U.y * ca + V.y * sa, nz = U.z * ca + V.z * sa;
      pos.push(q[0] + nx * r, q[1] + ny * r, q[2] + nz * r); nor.push(nx, ny, nz); } }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) { const a = i * sides + j, c = i * sides + (j + 1) % sides; idx.push(a, c, c + sides, a, c + sides, a + sides); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  b.add(g, { c: hexCol, surf: S(K_PLAIN, 0, 6, variant) });
}
// A LEAF MASS (the shader's kinds 12 to 16): a dark lumpy core under many small cards, each cut by the shader to a spray
// of leaves, a round fruit, a cluster of blossom or a rose. LM.card lays one card (a square, half-side hs, about the place
// c, tilted by `tilt` from the way d that the mass faces there and turned in its plane by a dealt angle); every corner
// carries the mass's own round as its normal (nm) and the card's own coordinates in surf.y, surf.w. glow: how much the
// mass's lanterns light it from within (0 to 1). LM.geo() gives the geometry and frees nothing else.
const LEAF_GREENS = ['#31502a', '#263f22', '#3f5a2a', '#1f3a22'];
function makeLeafMass(rnd) {
  const pos = [], nor = [], col = [], srf = [], idx = [], c0 = new THREE.Color(), U = new THREE.Vector3(), W = new THREE.Vector3(), Nc = new THREE.Vector3(), D = new THREE.Vector3();
  const LM = {
    card(c, d, hs, type, hexCol, shade = 1, tilt = 0.8, glow = 0, nm = d) {
      D.set(d[0], d[1], d[2]).normalize(); U.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5); U.addScaledVector(D, -U.dot(D)).normalize();
      Nc.copy(D).addScaledVector(U, tilt * rnd()).normalize();
      U.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5); U.addScaledVector(Nc, -U.dot(Nc)).normalize(); W.crossVectors(Nc, U);
      c0.set(hexCol).multiplyScalar(shade); const n = pos.length / 3, sz = type + 0.9 * clamp(glow, 0, 0.99);
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(c[0] + (U.x * u + W.x * v) * hs, c[1] + (U.y * u + W.y * v) * hs, c[2] + (U.z * u + W.z * v) * hs);
        nor.push(nm[0], nm[1], nm[2]); col.push(c0.r, c0.g, c0.b); srf.push(K_PLAIN, u, sz, v); }
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3); },
    // a core: `g` (a geometry, used up) with its points pushed to lump(x, y, z) times their length; its normals its own round
    core(g, lump, hexCol, glowAt) { const p = g.attributes.position, ix = g.index, n = pos.length / 3; c0.set(hexCol);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = Math.hypot(x, y, z) || 1, k = lump(x / l, y / l, z / l);
        pos.push(x * k, y * k, z * k); nor.push(x / l, y / l, z / l); col.push(c0.r, c0.g, c0.b); srf.push(K_PLAIN, 0, 12 + 0.9 * clamp(glowAt ? glowAt(x * k, y * k, z * k) : 0, 0, 0.99), 0); }
      if (ix) for (let i = 0; i < ix.count; i++) idx.push(n + ix.getX(i)); else for (let i = 0; i < p.count; i++) idx.push(n + i);
      g.dispose(); },
    // a rope of the mass along pts ([x, y, z, k]: k times `rad` there; rad = about how far the leaves' middles stand from
    // its middle line): a dark core 0.62 of that through, `sides` round (2: a flat band that faces `front`; 0: none), and over the side that faces `front` (and a
    // little way round the back) the cards: o.leaf sprays of leaves to the metre (half-side 0.5 to 0.7 of the radius there,
    // every fourth deeper and darker), o.rose roses, o.fruit fruit (colours o.fruitHex) and o.bloom clusters of blossom
    rope(pts, rad, sides, front, o) {
      const n = pts.length, T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), F = new THREE.Vector3(front[0], front[1], front[2]).normalize(), fr = [], n0 = pos.length / 3;
      c0.set('#141f12');
      for (let i = 0; i < n; i++) { const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n - 1)], q = pts[i], r = 0.62 * rad * (q[3] === undefined ? 1 : q[3]);
        T.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
        A.copy(F).addScaledVector(T, -F.dot(T)); if (A.lengthSq() < 1e-4) A.set(T.y, -T.x, 0); A.normalize(); B.crossVectors(T, A);
        fr.push([A.x, A.y, A.z, B.x, B.y, B.z]);
        for (let j = 0; j < sides; j++) { const an = ((j + (sides === 2 ? 0.5 : 0)) / sides) * TAU, ca = Math.cos(an), sa = Math.sin(an), nx = A.x * ca + B.x * sa, ny = A.y * ca + B.y * sa, nz = A.z * ca + B.z * sa;
          pos.push(q[0] + nx * r, q[1] + ny * r, q[2] + nz * r); if (sides === 2) nor.push(A.x, A.y, A.z); else nor.push(nx, ny, nz); col.push(c0.r, c0.g, c0.b); srf.push(K_PLAIN, 0, 12, 0); } }
      for (let i = 0; i < n - 1; i++) for (let j = 0; j < (sides === 2 ? 1 : sides); j++) { const a = n0 + i * sides + j, c = n0 + i * sides + (j + 1) % sides; idx.push(a, c, c + sides, a, c + sides, a + sides); }
      const kinds = [[13, o.leaf || 0], [16, o.rose || 0], [14, o.fruit || 0], [15, o.bloom || 0]], acc = [0.5, 0.3, 0.6, 0.8], fh = o.fruitHex || ['#d0661a']; let m = 0;
      for (let i = 0; i < n - 1; i++) { const a = pts[i], c = pts[i + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]), f = fr[i];
        for (let t = 0; t < 4; t++) { acc[t] += L * kinds[t][1];
          while (acc[t] >= 1) { acc[t] -= 1; m++;
            const u = rnd(), an = (rnd() - 0.5) * (t ? 2.4 : 3.6), ca = Math.cos(an), sa = Math.sin(an), d = [f[0] * ca + f[3] * sa, f[1] * ca + f[4] * sa, f[2] * ca + f[5] * sa];
            const r = rad * lerp(a[3] === undefined ? 1 : a[3], c[3] === undefined ? 1 : c[3], u), deep = t === 0 && m % 4 === 3, k = r * (t ? 1.08 : deep ? 0.72 : 0.9 + 0.2 * rnd());
            const q = [lerp(a[0], c[0], u) + d[0] * k, lerp(a[1], c[1], u) + d[1] * k, lerp(a[2], c[2], u) + d[2] * k], lit = 0.78 + 0.22 * d[1];
            if (t === 0) LM.card(q, d, r * (0.5 + 0.2 * rnd()), 13, LEAF_GREENS[m % 4], (deep ? 0.55 : 0.85 + 0.3 * rnd()) * lit, deep ? 0.5 : 0.9);
            else if (t === 1) LM.card(q, d, r * (0.3 + 0.08 * rnd()), 16, o.roseHex || '#e6dfcc', (0.85 + 0.25 * rnd()) * lit, 0.35);
            else if (t === 2) LM.card(q, d, r * (0.2 + 0.05 * rnd()), 14, fh[m % fh.length], (0.9 + 0.3 * rnd()) * lit, 0.25);
            else LM.card(q, d, r * (0.3 + 0.06 * rnd()), 15, '#d9d2bd', (0.85 + 0.25 * rnd()) * lit, 0.4); } } } },
    // the least distance from any point of the mass (as it lies, or moved by `off`) to the line that `dist` measures
    least(dist, off = [0, 0, 0]) { let m = 1e9; for (let i = 0; i < pos.length; i += 3) m = Math.min(m, dist(pos[i] + off[0], pos[i + 1] + off[1], pos[i + 2] + off[2])); return m; },
    // (the same for a great mass: it yields after every `per` points measured)
    async leastBy(dist, ctx, per = 900) { let m = 1e9; for (let i = 0, k = 0; i < pos.length; i += 3) { m = Math.min(m, dist(pos[i], pos[i + 1], pos[i + 2])); if (++k % per === 0) await ctx.yield(); } return m; },
    reach() { let m = 0; for (let i = 0; i < pos.length; i += 3) m = Math.max(m, Math.hypot(pos[i], pos[i + 1], pos[i + 2])); return m; },
    scale(k) { for (let i = 0; i < pos.length; i++) pos[i] *= k; },
    geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('surf', new THREE.Float32BufferAttribute(srf, 4)); g.setIndex(idx); return g; },
  };
  return LM;
}
// THE HEAD OF AN ORANGE TREE, unit size (its farthest leaf exactly 1 from its middle): a dark lumpy core that reaches about
// two thirds of the way out, under `cards` sprays of leaves that stand out of it to the full reach, every fourth of them
// deeper in and darker; `fruit` small round oranges and `bloom` clusters of white blossom among the outer leaves. lit: its
// five lanterns, hung inside the leaves below the middle, light the leaves round them from within. An irregular outline
// from every side: no facet, no straight edge. (hs: a spray's half side, 0.2 to 0.27 as dealt; the finer heads' 0.14 to 0.19)
function treeHeadGeometry(rnd, cards, fruit, bloom, lit, detail, hs = 0.2) {
  const LM = makeLeafMass(rnd), ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  const lump = (x, y, z) => 0.86 + 0.08 * Math.sin(3.1 * x + ph[0]) * Math.cos(2.7 * z + ph[1]) + 0.06 * Math.sin(4.3 * y + 2.2 * x + ph[2]);
  const glowAt = (x, y, z) => lit ? 1.15 * Math.exp(-(Math.pow(Math.hypot(x, z) - 0.6, 2) + Math.pow(y + 0.3, 2)) / 0.1) : 0;
  LM.core(new THREE.IcosahedronGeometry(0.78, detail), lump, '#141f12', glowAt);
  const dir = (i, n) => { const y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(Math.max(1 - y * y, 0)), a = i * 2.39996 + rnd() * 0.5; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let i = 0; i < cards; i++) { const d = dir(i, cards), deep = i % 4 === 3, k = lump(d[0], d[1], d[2]) * (deep ? 0.84 : 0.97 + 0.11 * rnd()), c = [d[0] * k, d[1] * k, d[2] * k];
    LM.card(c, d, hs * (1 + 0.35 * rnd()), 13, LEAF_GREENS[i % 4], (deep ? 0.55 : 0.85 + 0.3 * rnd()) * (0.8 + 0.2 * d[1]), deep ? 0.5 : 0.9, glowAt(c[0], c[1], c[2])); }
  for (let i = 0; i < fruit + bloom; i++) { const d = dir(i, fruit + bloom), k = lump(d[0], d[1], d[2]) * 1.04, c = [d[0] * k, d[1] * k, d[2] * k];
    if (((i * 7) % 10) * (fruit + bloom) < 10 * fruit) LM.card(c, d, 0.058 + 0.012 * rnd(), 14, '#d0661a', 0.9 + 0.3 * rnd(), 0.25, glowAt(c[0], c[1], c[2]) * 0.5);
    else LM.card(c, d, 0.11 + 0.03 * rnd(), 15, '#d9d2bd', 0.85 + 0.25 * rnd(), 0.4, glowAt(c[0], c[1], c[2]) * 0.5); }
  LM.scale(1 / LM.reach());
  return LM.geo();
}
// THE FLOWERS OF A GREAT URN, unit size (the farthest leaf exactly 1 from the middle): a dark lumpy core under 34 sprays
// of leaves, nine full white roses and five clusters of small white blossom, all in the upper three quarters of the round
// (the rest is inside the urn). fine (an urn within 25 m of the flown line in plan): 68 sprays, each 0.71 as large, over a
// core of 20 faces in place of 80
function urnHeadGeometry(rnd, fine = false) {
  const LM = makeLeafMass(rnd), ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  const lump = (x, y, z) => 0.8 + 0.1 * Math.sin(3.4 * x + ph[0]) * Math.cos(2.9 * z + ph[1]) + 0.07 * Math.sin(4.1 * y + 2.6 * z + ph[2]);
  LM.core(new THREE.IcosahedronGeometry(0.8, fine ? 0 : 1), lump, '#141f12', null);
  const nS = fine ? 68 : 34;
  const dir = (i, n) => { const y = 1 - 1.5 * (i + 0.5) / n, r = Math.sqrt(Math.max(1 - y * y, 0)), a = i * 2.39996 + rnd() * 0.5; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let i = 0; i < nS; i++) { const d = dir(i, nS), deep = i % 4 === 3, k = lump(d[0], d[1], d[2]) * (deep ? 0.86 : 0.98 + 0.14 * rnd()), c = [d[0] * k, d[1] * k, d[2] * k];
    LM.card(c, d, (fine ? 0.185 : 0.26) + (fine ? 0.055 : 0.08) * rnd(), 13, LEAF_GREENS[i % 4], (deep ? 0.55 : 0.85 + 0.3 * rnd()) * (0.8 + 0.2 * d[1]), deep ? 0.5 : 0.9); }
  for (let i = 0; i < 14; i++) { const d = dir(i, 14), k = lump(d[0], d[1], d[2]) * 1.06, c = [d[0] * k, d[1] * k, d[2] * k];
    if (i % 3 !== 2) LM.card(c, d, 0.17 + 0.05 * rnd(), 16, '#e6dfcc', 0.85 + 0.25 * rnd(), 0.35);
    else LM.card(c, d, 0.2 + 0.04 * rnd(), 15, '#d9d2bd', 0.85 + 0.25 * rnd(), 0.4); }
  LM.scale(1 / LM.reach());
  return LM.geo();
}
function orangeTreeAt(b, R, rng, x, z, tub, heads, path, dark) {
  const k = rng.range(0.94, 1.06), hy = 9.3 + rng.range(0, 0.5), r = 2.5 * k, a0 = rng.range(0, TAU), turn = rng.range(0, TAU) + rng.range(0, TAU);
  b.add(tub, { p: [x, 0, z] });
  b.add(cyl(0.13, 0.19, hy - 1.5 - r * 0.6, 4, true), { p: [x, (hy - r * 0.6 + 1.5) / 2, z], c: '#3a2a1c', surf: S(K_WOOD) });
  b.add(heads[dark ? 1 : 0], { p: [x, hy, z], r: [0, turn, 0], s: [r, r * 0.96, r], c: shade('#ffffff', rng.range(0.9, 1.1)) });
  const least = Math.min(path.distanceTo(x, hy, z) - r, path.distanceTo(x, 1.0, z) - 1.35);
  for (let i = 0; i < 5; i++) { const a = a0 + i * TAU / 5, lx = x + Math.sin(a) * r * 0.66, lz = z + Math.cos(a) * r * 0.66, ly = hy - 0.3 * r * 0.96;
    b.add(new THREE.OctahedronGeometry(1, 0), { p: [lx, ly, lz], s: [0.12, 0.2, 0.12], c: dark ? '#4a3a22' : '#f0c070', surf: S(K_PLAIN, dark ? 0 : 0.9) });
    if (!dark) R.flame(lx, ly - 0.06, lz, 0.24, 0.1); }
  return least;
}
// a candle tree: a tall gilt stand with a crown of six candles and one taller in the middle; flames at treeFlames(burn)
// (burn: how much of every tall candle is left: 1, or 0.4 in the blue hour, when they have burned to stubs)
const treeFlames = (burn) => [[0, 7.4 + 1.16 * burn, 0], ...[0, 1, 2, 3, 4, 5].map((i) => [Math.cos(i * PI / 3) * 1.0, 7.4 + 0.62 * burn, Math.sin(i * PI / 3) * 1.0])];
function treeGeometry(burn = 1) {
  const b = INT.makeBuilder(), G = S(K_METAL, 0.6);
  b.add(lathe([[1.0, 0], [0.85, 0.3], [0.2, 0.6], [0.34, 1.7], [0.13, 2.1], [0.13, 4.5], [0.3, 4.9], [0.12, 5.3], [0.12, 6.9], [0.45, 7.3], [0.1, 7.45]], 5), { c: C.gilt, surf: G });
  b.add(new THREE.TorusGeometry(1.0, 0.07, 3, 12), { p: [0, 7.35, 0], r: [PI / 2, 0, 0], c: C.gilt, surf: G });
  for (let i = 0; i < 3; i++) b.add(openBox(2.0, 0.08, 0.08, 'EW'), { p: [0, 7.35, 0], r: [0, i * PI / 3, 0], c: C.gilt, surf: G });
  for (const f of treeFlames(burn)) {                                        // (each candle: the wax glows over its top 0.15 m, a dark wick end stands in it)
    b.add(cyl(0.08, 0.08, f[1] - 7.4, 5, true), { p: [f[0], (f[1] + 7.36) / 2 - 0.02, f[2]], c: C.wax, surf: S(K_PLAIN, 0.55), grad: [f[1] - 0.19, f[1] - 0.04, 0.5, 1.5] });
    b.add(new THREE.ConeGeometry(0.011, 0.08, 3, 1, true), { p: [f[0], f[1] - 0.01, f[2]], c: '#140e0a', surf: S(K_PLAIN) }); }
  return b.build();
}
// THE ROUND TABLES. In each transept ten stand close together as one company in the great window's light: three lines
// along z, 8.1 m apart (x 38.4 and 54.6: three tables each, z -21.6, -31 and -40.4; x 46.5: four, z -16.9 to -45.1),
// the tables of a line 9.4 m apart. Each: a round top 6.4 m across at y 3.0 in ivory linen that hangs to the floor in
// twelve smooth pleats; in the middle a tall branched silver candelabrum (five branches round the stem's own candle,
// the highest tip under y 8.5) wound with leaves and white roses, in a wreath of leaves, roses and fruit (a leaf
// mass); eight places, each a gilt plate (the shader's) and a half-full glass, and eight chairs.
// THE CHOIR'S COMPANY (CHOIR_ROUND, by a rule of place): the same tables on a lattice of equal triangles 9.4 m a side
// (seven rows 8.2 m apart from z -62.7 north; x 17.9, 27.3 either side in the first row and every second after it, 13.2, 22.6 in the others), the same
// either side of the carpet: a table stands at each place of it where the floor is free, that is where its chairs
// (4.6 m from its middle) clear every tub and foot of the avenue's trees, the pyramid and its ring of candle trees,
// the crossing's piers, the transepts' tables, the carpet's cups, the dais steps, the side tables and the dressers. Where a table's
// middle lies within 7 m of the flown line in plan its candelabrum is the low one (the same, 0.3 as high, no flowers wound on it: its highest
// flame tip under y 5.0), so that nothing taller than 5 m stands within 5 m of the line in plan.
const ROUND = []; for (const s of [-1, 1]) for (const [x, z0, n] of [[38.4, -21.6, 3], [46.5, -16.9, 4], [54.6, -21.6, 3]]) for (let k = 0; k < n; k++) ROUND.push([s * x, z0 - 9.4 * k]);
const candFlames = (burn) => [[0, 4.25 + 0.7 * burn, 0], ...[0, 1, 2, 3, 4].map((i) => [Math.cos(i * TAU / 5) * 1.15, 3.55 + 0.6 * burn, Math.sin(i * TAU / 5) * 1.15])];
// (lite: the weight for a table 16 m or more from the flown line in plan, and for the low one: the stem in four sides, each branch a bent strip)
function candelabrumGeometry(burn = 1, lite = false) {
  const b = INT.makeBuilder(), SV = S(K_METAL, 0.9), fl = candFlames(burn);
  if (lite) b.add(lathe([[0.75, 0], [0.3, 0.3], [0.12, 0.6], [0.2, 1.1], [0.09, 1.4], [0.09, 2.5], [0.26, 2.8], [0.1, 3.1], [0.1, 4.25]], 4), { c: C.silver, surf: SV });
  else b.add(lathe([[0.75, 0], [0.8, 0.08], [0.3, 0.3], [0.12, 0.6], [0.2, 1.1], [0.09, 1.4], [0.09, 2.5], [0.26, 2.8], [0.1, 3.1], [0.1, 3.9], [0.3, 4.15], [0.1, 4.25]], 6), { c: C.silver, surf: SV });
  for (let i = 0; i < 5; i++) {                                             // five branches: each dips from the stem and rises to its pan
    const arm = new THREE.TorusGeometry(0.575, 0.05, 3, lite ? 3 : 5, PI); arm.rotateZ(PI); arm.translate(0.575, 3.0, 0);
    b.add(arm, { r: [0, -i * TAU / 5, 0], c: C.silver, surf: SV });
  }
  for (let i = 0; i < 6; i++) { const f = fl[i], y0 = i ? 3.55 : 4.25;
    if (i) { if (!lite) b.add(cyl(0.05, 0.05, 0.5, 3, true), { p: [f[0], 3.25, f[2]], c: C.silver, surf: SV }); b.add(new THREE.ConeGeometry(0.24, lite ? 0.5 : 0.12, lite ? 4 : 6, 1, true), { p: [f[0], lite ? 3.3 : 3.5, f[2]], r: [PI, 0, 0], c: C.silver, surf: SV }); }
    b.add(cyl(0.07, 0.07, f[1] - y0, lite ? 3 : 4, true), { p: [f[0], (f[1] + y0) / 2, f[2]], c: C.wax, surf: S(K_PLAIN, 0.55), grad: [f[1] - 0.15, f[1], 0.5, 1.5] });
    if (!lite) b.add(new THREE.ConeGeometry(0.011, 0.08, 3, 1, true), { p: [f[0], f[1] + 0.03, f[2]], c: '#140e0a', surf: S(K_PLAIN) }); }       // (its wick end)
  return b.build();
}
// (tables: [cx, cz, low]; fr: a fork for the flowers wound on the stems. Returns the least distances to the flown line of
// the wreaths and wound flowers (every leaf) and of the tables' other bodies: the top's edge, every flame tip)
const ROUND_DYE = ['#73161f', '#a67c2c', '#1d4a2c'];                         // a round table's cloth: deep crimson, old gold, dark green, by turns
async function buildRoundTables(ctx, b, R, rng, fr, cGeos, burn, path, tables, dr) {
  const L = C.linen, Ld = C.linenD, GP = S(K_METAL, 0.75), plate = new THREE.CircleGeometry(0.42, 6), napkin = new THREE.ConeGeometry(0.17, 0.36, 3, 1, true), fruitCol = ['#d0661a', '#a02a22', '#c9a030', '#7a1a30'], fl = candFlames(burn), fruitHex = ['#8a2a22', '#b08a2c', '#c06a1c']; let wreath = 1e9, body = 1e9, n = 0;
  for (const [cx, cz, low] of tables) {
    const plan = path.nearestXZ(cx, cz).dist, N = plan < 16 ? 60 : plan < 60 ? 48 : 36, ky = low ? 0.3 : 1;      // (the skirt's sides round: five, four or three to a pleat)
    const surf = S(K_LINEN, cx, cz, cz), top = new THREE.CircleGeometry(3.2, 24); top.rotateX(-PI / 2);
    b.add(top, { p: [cx, 3.0, cz], c: L, surf });
    // the skirt: a smooth round edge at the top, twelve pleats that deepen to the floor (the shader rounds their shading)
    const ring = (a, y) => { const k = (3.0 - y) / 2.96, r = 3.2 + 0.22 * k + 0.24 * k * Math.cos(12 * a); return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]; };
    for (let i = 0; i < N; i++) { const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU;
      quadTo(b, ring(a0, 3.0), ring(a1, 3.0), ring(a1, 0.04), ring(a0, 0.04), [cx + Math.cos(a0) * 99, 3.0, cz + Math.sin(a0) * 99], ROUND_DYE[n % 3], surf); }
    b.add(cGeos[plan < 16 && !low ? 0 : 1], { p: [cx, 3.0, cz], s: [1, ky, 1] });
    for (const f of fl) { R.flame(cx + f[0], 3.0 + f[1] * ky, cz + f[2], 0.46, 0.16); body = Math.min(body, path.distanceTo(cx + f[0], 3.0 + f[1] * ky + 0.46, cz + f[2])); }
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; body = Math.min(body, path.distanceTo(cx + Math.cos(a) * 3.2, 3.0, cz + Math.sin(a) * 3.2)); }
    if (low && 3.0 + fl[0][1] * ky + 0.46 > 5.0) console.warn('to-the-brim: a low candelabrum stands taller than 5 m', cx, cz);
    R.smoke.push(cx, 3.0 + fl[0][1] * ky + 0.5, cz, 3.0);
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * TAU / 8 + 0.2; R.glass(cx + Math.cos(a) * 2.35, 3.0, cz + Math.sin(a) * 2.35, cx, 3.0 + fl[0][1] * ky + 0.16, cz, 1, 1); }
    // the wreath round the candelabrum's foot (a ring 1.05 m out, 0.5 m through) and the flowers wound up its stem: twelve
    // sprays of leaves and six white roses on a spiral of two and a half turns
    { const LM = makeLeafMass(() => rng.range(0, 1)), pts = [];
      for (let i = 0; i <= 12; i++) { const a = i * TAU / 12; pts.push([cx + Math.cos(a) * 1.05, 3.12, cz + Math.sin(a) * 1.05, 1]); }
      LM.rope(pts, 0.25, 2, [0, 1, 0], { leaf: 3.2, rose: 0.6, fruit: 0.8, bloom: 0.3, fruitHex });
      wreath = Math.min(wreath, LM.least(path.distanceTo)); b.add(LM.geo(), {}); }
    if (!low) { const LM = makeLeafMass(() => fr.range(0, 1));           // (the low candelabrum stands in its wreath alone)
      for (let i = 0; i < 18; i++) { const a = i * TAU * 2.5 / 18 + fr.range(-0.2, 0.2), y = 3.0 + (0.55 + 2.2 * i / 17) * ky, d = [Math.cos(a), 0.35, Math.sin(a)], c = [cx + d[0] * 0.24, y, cz + d[2] * 0.24];
        if (i % 3 === 1) LM.card(c, d, 0.13, 16, '#e6dfcc', 0.9 + 0.2 * fr.range(0, 1), 0.35);
        else LM.card(c, d, 0.2 + 0.05 * fr.range(0, 1), 13, LEAF_GREENS[i % 4], 0.85 + 0.3 * fr.range(0, 1), 0.9); }
      wreath = Math.min(wreath, LM.least(path.distanceTo)); b.add(LM.geo(), {}); }
    // the places: eight gilt plates 0.84 m across, one between every two glasses, a white napkin folded to a point on each
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2, px = cx + Math.cos(a) * 2.6, pz = cz + Math.sin(a) * 2.6;
      b.add(plate, { p: [px, 3.02, pz], r: [-PI / 2, 0, 0], c: shade(C.gilt, 1.5), surf: GP });
      b.add(napkin, { p: [px, 3.2, pz], r: [0, dr.range(0, TAU), 0], c: '#efe9dc', surf: S(K_PLAIN, 0.2) }); }
    // the centrepiece of every second table: A PYRAMID OF FRUIT heaped round the candelabrum's stem inside the wreath (a
    // cone 0.8 m in radius and 1.5 m high: oranges, red apples, golden pears and plums, with sprays of leaves between);
    // the others carry the flowers wound up the stem
    if (n % 2 === 0) { const LM = makeLeafMass(() => dr.range(0, 1)), hgt = 1.5 * (low ? 0.6 : 1);
      for (let i = 0; i < 40; i++) { const t = (i + 0.5) / 40, a = i * 2.39996, r = 0.8 * (1 - t) + 0.06, y = 3.05 + hgt * t, d = [Math.cos(a), 0.5, Math.sin(a)], c = [cx + d[0] * r, y, cz + d[2] * r];
        if (i % 5 === 4) LM.card(c, d, 0.2, 13, LEAF_GREENS[i % 4], 0.9 + 0.3 * dr.range(0, 1), 0.9);
        else LM.card(c, d, 0.15 + 0.03 * dr.range(0, 1), 14, fruitCol[i % 4], 0.9 + 0.3 * dr.range(0, 1), 0.25); }
      wreath = Math.min(wreath, LM.least(path.distanceTo)); b.add(LM.geo(), {}); }
    if ((++n & 3) === 0) await ctx.yield();
  }
  plate.dispose(); napkin.dispose();
  return { wreath, body };
}
// CLEAR AIR for the bodies of the crossing, the choir and the doorway: for each class the places on it that lie nearest the
// flown line, and the least distance it must keep (build() counts each against path.distanceTo and warns). Flames and
// glasses are counted where they are dealt; a round table where it is built.
function newBodies() {
  const L = [], add = (name, least, pts) => L.push([name, least, pts]), pts = [];
  for (let i = -20; i <= 20; i++) { const t = i / 20;
    for (const zz of [10, -72]) pts.push([t * 32.4, archY(t), zz]);
    for (const s of [-1, 1]) pts.push([s * 34, archY(t), -31 + t * 39.4]); }
  for (let y = 0; y <= 25; y += 2.5) for (const s of [-1, 1]) { for (const zz of [10, -72]) pts.push([s * 32.4, y, zz]); for (const e of [-1, 1]) pts.push([s * 34, y, -31 + e * 39.4]); }
  add('a crossing arch', 6, pts);
  const win = [], dr = [], ch = [], bal = [], can = [], cur = [], pel = [], sh = [];
  for (const s of [-1, 1]) {
    for (let y = 7; y <= 38; y += 3) for (const e of [-1, 1]) win.push([s * 59.4, y, -31 + e * 11]);
    for (const zz of [7.45, -69.45]) for (let y = 0; y <= 17; y += 4.25) dr.push([s * 36.55, y, zz]);
    for (const z of [-5, -57]) dr.push([s * 59.45, 16, z + 4.45], [s * 59.45, 16, z - 4.45]);
    for (let z = -80; z >= -232; z -= 1.6) for (const t of [-1, 1]) ch.push([s * 26.5 + t * 4.1, 4.2, z]);
    for (let z = -120; z >= -196; z -= 2) bal.push([s * 19.35, 4.72, z]);
    for (const z of [-120.6, -195.4]) bal.push([s * 18.7, 7.9, z]);
    for (let z = -128; z >= -188; z -= 2) can.push([s * 17, 22.2, z]);
    for (const z of [-128.6, -187.4]) for (const [y, r] of [[26.3, 1.92], [17, 1.22], [9, 0.52], [6, 0.9], [3.1, 1.09]]) can.push([s * (16.4 - r), y, z + (z > -158 ? -r : r)], [s * (16.4 - r), y, z]);
    for (const [y, x] of [[24, 9.5], [20, 9.9], [15, 10.7], [11, 11.6], [9.5, 11.9], [8.6, 11.7], [5, 11.2], [0.05, 10.9]]) cur.push([s * x, y, -243.86]);
    for (let y = 10.4; y <= 26; y += 2.6) sh.push([s * 14, y, -244.5]);
  }
  for (let x = -17; x <= 17; x += 1) can.push([x, 22.2, -128], [x, 22.2, -188]);
  for (let x = -13.6; x <= 13.6; x += 0.8) pel.push([x, 23, -243.85]);
  pel.push([0, 26.7, -244.9]);
  add('a great window', 6, win); add('a transept dresser', 6, dr); add('a chair of the choir\'s side tables', 2, ch);
  // (also: the canopy's inner valance with its tassels (their tips y 23.3, 0.7 m in from the edge) and the lining's
  // boss; the crossing ceiling's great boss and its four diagonal ribs; the north wall's gilt pilasters and niche frames)
  { const inn = [[0, 24.4, -155]], vb = [[0, 43, -31]], nw = [];
    for (let x = -16.3; x <= 16.3; x += 1.63) inn.push([x, 23.3, -128.7], [x, 23.3, -187.3]);
    for (let z = -128.7; z >= -187.3; z -= 1.628) inn.push([-16.3, 23.3, z], [16.3, 23.3, z]);
    for (let t = 0.1; t <= 1; t += 0.1) for (const sx of [-1, 1]) for (const sz of [-1, 1]) vb.push([sx * 34 * t, 44.3, -31 + sz * 41 * t]);
    for (const s of [-1, 1]) for (const x of [...NWALL_X, 18.6, 26.9]) for (let y = 0; y <= 10; y += 2.5) nw.push([s * x, y, -245]);
    add('the canopy\'s inner valance, tassels and boss', 6, inn); add('the crossing ceiling\'s great boss and ribs', 6, vb); add('a gilt pilaster or a niche frame of the north wall', 6, nw); }
  add('the dais balustrade', 6, bal); add('the canopy', 6, can); add('a curtain of the doorway', 2.5, cur);
  add('the pelmet or the wheel window', 2.5, pel); add('the shelved north wall', 6, sh);
  // the bodies of the walls: every side window's frame (its face 1.0 m into the hall) and sill (1.5 m), every pilaster, every
  // hanging on its rod, the transepts' mirror sconces
  const fr = [], pil = [], hang = [], mir = [], tv = [];
  const frame = (x, z, nx, nz) => { const tx = nz, tz = -nx;
    for (const e of [-3.5, 0, 3.5]) { fr.push([x + nx * 1.5 + tx * e, 11.75, z + nz * 1.5 + tz * e]);
      for (let y = 12; y <= 28; y += 4) fr.push([x + nx + tx * e, y + (e ? 0 : 0.4), z + nz + tz * e]); } };
  for (const s of [-1, 1]) {
    for (let k = 0; k < 13; k++) { frame(s * 34, WIN_NAVE(k), -s, 0); for (const e of [-4.95, 4.95]) for (let y = 0; y <= 10; y += 2.5) pil.push([s * 33.39, y, 24 + 16 * k + e]); }
    for (let k = 0; k < 10; k++) frame(s * 34, WIN_CHOIR(k), -s, 0);
    for (let k = 0; k < 11; k++) for (const e of [-4.95, 4.95]) for (let y = 0; y <= 10; y += 2.5) pil.push([s * 33.39, y, -80 - 16 * k + e]);
    frame(s * 48, 10, 0, -1); frame(s * 48, -72, 0, 1);
    for (const z of [-0.05, -9.95, -52.05, -61.95]) pil.push([s * 61.39, 5, z]);
    for (const z of TV_Z) for (const e of [-4.5, 0, 4.5]) for (const y of [10.7, 16.6, 22.1]) tv.push([s * 61.0, y, z + e]);
    for (const x of [45.95, 50.05]) pil.push([s * x, 5, 9.39], [s * x, 5, -71.39]);
    for (let k = 0; k < 11; k++) for (const e of [-4.5, 0, 4.5]) for (const y of [10.7, 16.6, 22.1]) hang.push([s * 33.0, y, -80 - 16 * k + e]);
    for (const z of [9.0, -71.0]) { for (const x of [40.1, 56]) for (const e of [-4.3, 0, 4.3]) for (const y of [11.4, 16.6, 22.1]) tv.push([s * x + e, y, z]);
      for (const e of [-0.76, 0.76]) mir.push([s * 56 + e, 10.9, z > 0 ? 8.6 : -70.6]); }
  }
  const nv = []; for (const s of [-1, 1]) for (let k = 0; k < 13; k++) for (const e of [-4.5, 0, 4.5]) for (const y of [10.7, 16.6, 22.1]) nv.push([s * 33.0, y, 24 + 16 * k + e]);
  add('a verdure of the nave', 4, nv);
  add('a side window\'s frame or sill', 3, fr); add('a pilaster of the wainscot', 6, pil); add('a wall hanging', 6, hang); add('a mirror sconce of the transepts', 6, mir); add('a verdure of the transepts', 6, tv);
  // the pyramid's tiers (every gilt rim, 0.08 m beyond the tier's edge; the garlands are counted where they are built), and the epergne
  const py = [], ep = [];
  for (let k = 0; k < PYR.tiers; k++) for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU, r = tierR(k) + 0.08;
    for (const y of [tierTop(k), tierTop(k) - 0.1]) py.push([PYR.x + Math.cos(a) * r, y, PYR.z + Math.sin(a) * r]); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; for (const y of [2.1, 3.3, 5.2]) ep.push([PYR.x + Math.cos(a) * 1.96, tierTop(9) + y, PYR.z + Math.sin(a) * 1.96]); }
  ep.push([PYR.x, tierTop(9) + 5.2, PYR.z]);
  add('a tier of the pyramid, at its gilt rim', 2, py); add('the epergne', 2, ep);
  return L;
}
// ONE CHANDELIER, all gilt: origin at the hoop's centre, lowest part y 0.055. A hoop of radius 4 (a moulded bar of eight
// faces, 0.29 m across, that reaches radius 4.145 at y 0.2), 24 candles on a ring of radius 3.85, each in a cup over a drip
// pan (nothing above the hoop reaches beyond radius 4.07); six rods with two beads each rise from the hoop to a ring of radius 2.1 at y 2.6, six more gather
// from it under a small crown with a ball beneath it (y 5.6 to 6.9); above the crown the long hanger is a chain of links
// 0.5 m long, turned by turns (hang: its length, 26 m to the roof; 2.2 m for the one that hangs from the canopy).
// Three weights, dealt by place: fine where the hoop's centre is within 11 m of the flown line (ten of the 28, with the
// one under the canopy); else the same piece in fewer sides (the rods flat strips, the links 1 m long); and NEAR, for
// a chandelier whose crown or chain stands within 8 m of the flown line: the fine piece with its crown turned in
// sixteen sides and the lowest 8 m of its chain as sixteen real links, oval rings 0.6 m long turned by turns (above
// them the chain is the fine weight's). On this route no crown or chain stands so near (the nearest is 9.95 m off),
// so the near weight is dealt to none.
const CH_R = 3.85;
function chandelierGeometry(burn = 1, hang = 26, fine = false, near = false) {
  const b = INT.makeBuilder(), G = S(K_METAL, 0.8), gilt = '#c8a04a', giltD = '#9a7a34';
  const strip = (p0, p1, w, c) => { const dx = p1[0] - p0[0], dz = p1[2] - p0[2], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w, nz = dx / l * w;
    b.quad([p0[0] - nx, p0[1], p0[2] - nz], [p0[0] + nx, p0[1], p0[2] + nz], [p1[0] + nx, p1[1], p1[2] + nz], [p1[0] - nx, p1[1], p1[2] - nz], c, G); };
  const rod = (p0, p1, r) => { const d = new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]), len = d.length(), g = cyl(r, r, len, 3, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); b.add(g, { p: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], c: gilt, surf: G }); };
  if (fine) b.add(lathe([[4.0, 0.055], [4.1, 0.12], [4.145, 0.2], [4.1, 0.28], [4.0, 0.345], [3.9, 0.28], [3.86, 0.2], [3.9, 0.12], [4.0, 0.055]], 28), { c: gilt, surf: G });
  else b.add(lathe([[4.0, 0.055], [4.145, 0.2], [4.0, 0.345], [3.86, 0.2], [4.0, 0.055]], 16), { c: gilt, surf: G });
  if (fine) b.add(new THREE.TorusGeometry(2.1, 0.09, 3, 16), { p: [0, 2.6, 0], r: [PI / 2, 0, 0], c: gilt, surf: G });
  else b.add(new THREE.TorusGeometry(2.1, 0.11, 2, 10), { p: [0, 2.6, 0], r: [PI / 2, 0, 0], s: [1, 1, 0.3], c: gilt, surf: G });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.26, ca = Math.cos(a), sa = Math.sin(a), p0 = [ca * 3.95, 0.3, sa * 3.95], p1 = [ca * 2.1, 2.6, sa * 2.1], p2 = [ca * 0.3, 5.9, sa * 0.3];
    if (fine) { rod(p0, p1, 0.05); rod(p1, p2, 0.04);
      for (const t of [0.33, 0.66]) b.add(new THREE.OctahedronGeometry(0.12, 0), { p: [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(p0[2], p1[2], t)], s: [1, 1.5, 1], c: gilt, surf: G }); }
    else { strip(p0, p1, 0.07, gilt); strip(p1, p2, 0.06, gilt); } }
  b.add(lathe(fine ? [[0.02, 5.6], [0.2, 5.7], [0.2, 5.9], [0.06, 6.0], [0.44, 6.1], [0.52, 6.3], [0.36, 6.4], [0.5, 6.7], [0.2, 6.8], [0.05, 6.9]] : [[0.02, 5.6], [0.22, 5.8], [0.06, 6.0], [0.5, 6.2], [0.4, 6.6], [0.05, 6.9]], near ? 16 : fine ? 6 : 4), { c: gilt, surf: G });
  const link = fine ? 0.5 : 1.0, nL = Math.round(hang / link);
  for (let i = 0; i < nL; i++) { const y0 = 6.85 + i * hang / nL, y1 = y0 + hang / nL + 0.06, ym = (y0 + y1) / 2, w = 0.12, e = i & 1;
    if (near && i < 16) b.add(new THREE.TorusGeometry(0.2, 0.034, 3, 8), { p: [0, ym, 0], r: [0, e ? PI / 2 : 0, 0], s: [0.6, 1.3, 1], c: i % 2 ? gilt : giltD, surf: G });
    else b.quad([0, y0, 0], [e ? 0 : w, ym, e ? w : 0], [0, y1, 0], [e ? 0 : -w, ym, e ? -w : 0], i % 2 ? gilt : giltD, G); }
  for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, x = Math.cos(a) * CH_R, z = Math.sin(a) * CH_R;
    b.add(new THREE.ConeGeometry(0.22, 0.1, fine ? 5 : 3, 1, true), { p: [x, 0.42, z], r: [PI, 0, 0], c: gilt, surf: G });                // the drip pan
    if (fine) b.add(cyl(0.1, 0.08, 0.14, 4, true), { p: [x, 0.5, z], c: giltD, surf: G });                                                // the cup
    b.add(cyl(0.065, 0.07, 0.6 * burn, fine ? 4 : 3, true), { p: [x, 0.46 + 0.3 * burn, z], c: C.wax, surf: S(K_PLAIN, 0.6), grad: [0.46 + 0.6 * burn - 0.15, 0.46 + 0.6 * burn, 0.6, 1.4] });
    if (fine) b.add(new THREE.ConeGeometry(0.011, 0.08, 3, 1, true), { p: [x, 0.48 + 0.6 * burn, z], c: '#140e0a', surf: S(K_PLAIN) });       // its wick end
  }
  return b.build();
}

// ---------------------------------------------------------------- 8. the world
// (shadow: a trace the grade adds into the darks. The grade's contrast is 1: a steeper one cuts the green and blue out of every
// deep shadow and turns umber to maroon and black. tint: near white in every look, so that white linen and silver stay white:
// the warmth is the candles' own)
// tab / ch / py: the low candles, the chandeliers, the pyramid; base: how much of the hall's general light the linen
// takes (the rest is each flame's own pool); isle: the dais ranks; pane / paneW: window glass, and its west side;
// gwE / gwW: the cold light of the east and the west great window (its glass, its patch on the floor, the edge it lays)
const LOOKS = {
  midnight: { tab: 1.0, ch: 0.42, py: 0.8, base: 0.36, pool: 2.3, isle: 1.7, stub: 0, lat: LAT, dawn: 0, moon: 0, sky: 1.0, pane: 0.95, paneW: 1, gwE: [0.03, 0.055, 0.15], gwW: [0.03, 0.055, 0.15], fill: [0, 0, 0], fillDir: [1, 0.3, 0], kitFill: null, kitAmt: 0, wall: 1.2, cross: 1.0, tierFill: 0, tierDir: [1, 0.3, 0], sheen: 0.05,
    amb: [0.08, 0.068, 0.056], choir: [0.30, 0.52, 1.45], moonCol: 0, fog: '#170e08', tint: '#f9f5ee', shadow: '#0b0705', exposure: 1.08, title: 'To the Brim' },
  blue: { tab: 0.8, ch: 0.34, py: 0.7, base: 0.3, pool: 2.2, isle: 1.6, stub: 0.34, lat: LAT, dawn: 1, moon: 0, sky: 1.0, pane: 0.8, paneW: 0.5, gwE: [0.075, 0.17, 0.46], gwW: [0.035, 0.07, 0.19], fill: [0.07, 0.17, 0.56], fillDir: [1, 0.3, -0.12], kitFill: '#3f6fd0', kitAmt: 1.6, wall: 1.35, cross: 1.15, tierFill: 1.0, tierDir: [1, 0.3, -0.12], sheen: 0.05,
    amb: [0.07, 0.068, 0.082], choir: [0.62, 1.02, 2.0], moonCol: 0, fog: '#0d0e18', tint: '#f1eff6', shadow: '#07080c', exposure: 1.08, title: 'To the Brim, Before Dawn' },
  moon: { tab: 0.62, ch: 0.16, py: 0.6, base: 0.26, pool: 2.3, isle: 1.5, stub: 0, lat: LAT * 2, dawn: 0, moon: 1, sky: 1.3, pane: 1.0, paneW: 1.25, gwE: [0.04, 0.075, 0.19], gwW: [0.17, 0.21, 0.31], fill: [0.05, 0.062, 0.095], fillDir: [-0.97, 0.3, 0.05], kitFill: '#aebfe0', kitAmt: 0.9, wall: 1.5, cross: 1.25, tierFill: 26.0, tierDir: [-1, 0.25, -0.15], sheen: 0.055,
    amb: [0.068, 0.067, 0.08], choir: [1.05, 1.3, 1.75], moonCol: 2.6, fog: '#100e10', tint: '#f3f1f0', shadow: '#08080b', exposure: 1.1, title: 'To the Brim, Full Moon' },
};
// the speed asked for, in m/s before the engine scales the whole flight to its 50 s (it comes out about 8 per cent quicker):
// 11 down the nave, 9.5 round the pyramid, 9 on the turn, 7 between the ranks (by 380 m), 3.8 at the brim (390 to 416 m), 10 on the way out (from 436 m)
const SPEED = (m) => 11 - 1.5 * smoothstep(203, 262, m) - 0.5 * smoothstep(296, 332, m) - 2 * smoothstep(350, 380, m) - 3.2 * smoothstep(378, 390, m) + 6.2 * smoothstep(416, 436, m);

export default {
  id: 'to-the-brim', name: 'To the Brim', category: 'interior', weirdness: 0.15,
  media: ['interior', 'air'],
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    // ---------------- what this visit is like
    // THE LOOK is dealt from the world's own random stream by a fork of its own (a fork takes one draw from its parent: this
    // one is the first, and every later draw follows it in one fixed order)
    let lookName = rng.fork('look').pick(['blue', 'moon', 'midnight', 'midnight', 'moon']);
    if (vary.hour === 'dawn') lookName = 'blue'; else if (vary.hour === 'night' && lookName === 'blue') lookName = 'midnight';
    const look = LOOKS[lookName];
    const vr = rng.fork('swaps');
    const wine = vr.pick(['ruby', 'ruby', 'gold', 'rose', 'ruby']);
    const runner = vr.pick(['gold', 'crimson', 'gold', 'none']);
    const garlandKind = vr.pick(['bay', 'ivy', 'bay', 'none']);
    const garlandHex = garlandKind === 'bay' ? '#66763a' : garlandKind === 'ivy' ? '#33603a' : null;
    const rare = !!vary.rare;

    const scene = new THREE.Scene();
    const fogC = new THREE.Color(look.fog);
    scene.background = fogC.clone().multiplyScalar(0.6);
    scene.fog = new THREE.FogExp2(fogC, 0.0021);
    const path0 = makePath(ROUTE), LEN = path0.length;
    await ctx.yield();
    // THE FLOWN LINE, FINE: the route sampled every 0.25 m, start to end. Every clear-air test of this file is taken to
    // the chords between those samples (a chord of 0.25 m lies within a millimetre of this curve), not to the nearest of the path's 320
    // samples: `path` below is the route with that measure as its distanceTo (the engine is handed the route itself)
    const FN = Math.ceil(LEN / 0.25), FL = new Float32Array((FN + 1) * 3);
    { const v = new THREE.Vector3(); for (let i = 0; i <= FN; i++) { path0.posAtDist(LEN * i / FN, v); FL[i * 3] = v.x; FL[i * 3 + 1] = v.y; FL[i * 3 + 2] = v.z; if ((i & 255) === 255) await ctx.yield(); } }
    const fineDist = (x, y, z) => {
      let bc = 1e18;                                                         // the nearest of every eighth sample (2 m apart), then the chords within 2 m of every one that is nearly as near
      for (let i = 0; i <= FN; i += 8) { const o = i * 3, dx = FL[o] - x, dy = FL[o + 1] - y, dz = FL[o + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < bc) bc = d; }
      const lim = Math.sqrt(bc) + 1.05, lim2 = lim * lim; let best = bc;
      for (let i = 0; i <= FN; i += 8) { const o = i * 3, dx = FL[o] - x, dy = FL[o + 1] - y, dz = FL[o + 2] - z; if (dx * dx + dy * dy + dz * dz > lim2) continue;
        for (let j = Math.max(i - 8, 0); j < Math.min(i + 8, FN); j++) { const a = j * 3, ax = FL[a], ay = FL[a + 1], az = FL[a + 2], ex = FL[a + 3] - ax, ey = FL[a + 4] - ay, ez = FL[a + 5] - az;
          const t = clamp(((x - ax) * ex + (y - ay) * ey + (z - az) * ez) / (ex * ex + ey * ey + ez * ez), 0, 1), qx = ax + ex * t - x, qy = ay + ey * t - y, qz = az + ez * t - z, d = qx * qx + qy * qy + qz * qz;
          if (d < best) best = d; } }
      return Math.sqrt(best); };
    const path = { ...path0, distanceTo: fineDist };

    // ---------------- the glass kit and the shared uniforms
    const kit = makeGlassKit(ctx, { palette: PALETTE, wine });
    const KU = kit.uniforms;
    const moonDir = new THREE.Vector3(-0.969, 0.245, 0.051).normalize();   // low in the west: from the pass it stands in the head of the west great window, beside the pyramid's summit
    const SKYU = { uMoonDir: { value: moonDir }, uMoonI: { value: look.moon }, uDawn: { value: look.dawn }, uSkyGain: { value: look.sky } };
    const HU = {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...SKYU,
      uTime: KU.uTime, uFlameCol: KU.uFlameCol, uGustZ: KU.uGustZ, uGustM: KU.uGustM, uGustAmp: KU.uGustAmp, uGustTail: KU.uGustTail, uPix: KU.uPix,
      uBase: { value: look.base }, uIsle: { value: look.isle }, uBlueE: { value: look.paneW }, uGwPaneW: { value: look.moon ? 0.22 : 1 }, uGwGlassW: { value: new THREE.Color().fromArray(look.moon ? [0.05, 0.085, 0.2] : look.gwW) },
      uWall: { value: look.wall }, uCross: { value: look.cross }, uTierFill: { value: look.tierFill }, uSheen: { value: look.sheen }, uPairE: { value: 1 }, uGapE: { value: new THREE.Vector4(99, -1, 99, -1) }, uRivE: { value: -58 },
      uLat: { value: look.lat }, uTabI: { value: look.tab }, uChI: { value: look.ch }, uPyI: { value: look.py }, uTrI: { value: 1.0 }, uStub: { value: look.stub },
      uRunCol: { value: hex(runner === 'crimson' ? '#7A0F1E' : '#C9A24A').multiplyScalar(runner === 'crimson' ? 0.9 : 0.8) }, uWineC: { value: KU.uWineBody.value },
      uGain: { value: 1.0 }, uPool: { value: look.pool }, uPaneGain: { value: look.pane },
      uAmb: { value: new THREE.Color().fromArray(look.amb) }, uChoir: { value: new THREE.Color().fromArray(look.choir) }, uFill: { value: new THREE.Color().fromArray(look.fill) },
      uFillDir: { value: new THREE.Vector3().fromArray(look.fillDir).normalize() }, uTierDir: { value: new THREE.Vector3().fromArray(look.tierDir).normalize() },
      uMoonCol: { value: new THREE.Color(0.40, 0.48, 0.66).multiplyScalar(look.moonCol) }, uChSway: { value: new THREE.Vector3() }, uChSway2: { value: new THREE.Vector3() },
      uGwE: KU.uGwE, uGwW: KU.uGwW,                                       // (shared with the glasses: set below)
    };
    KU.uGwE.value.fromArray(look.gwE); KU.uGwW.value.fromArray(look.gwW);
    const hallMat = new THREE.ShaderMaterial({ uniforms: HU, vertexShader: HALL_VS, fragmentShader: HALL_FS, fog: true, side: THREE.DoubleSide });
    const addU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: KU.uTime, uFlameCol: KU.uFlameCol, uGustZ: KU.uGustZ, uGustM: KU.uGustM, uGustAmp: KU.uGustAmp, uGustTail: KU.uGustTail, uPix: KU.uPix, uHalo: { value: 0.34 } };
    const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true };
    const haloMat = new THREE.ShaderMaterial({ uniforms: addU, vertexShader: HALO_VS, fragmentShader: HALO_FS, ...additive });
    const smokeMat = new THREE.ShaderMaterial({ uniforms: addU, vertexShader: SMOKE_VS, fragmentShader: SMOKE_FS, ...additive, side: THREE.DoubleSide });
    await ctx.yield();

    // ---------------- the hall
    const R = makeRegistry(look.stub);
    const bN = INT.makeBuilder(), bX = INT.makeBuilder(), bC = INT.makeBuilder(), bT = INT.makeBuilder(), bG = INT.makeBuilder();
    await buildShell(ctx, bN, bX, bC);
    // the five long tables: linen, a low candle every 3.2 m, four rows of glasses, garlands
    const gr = rng.fork('garlands'), sr = rng.fork('silver');
    const leaves = [];                                                    // every instanced leaf: place, the way it points, the way it faces, length, which green
    // REAL SILVER on the dais ranks, by a rule of place: every 12.8 m along a rank's centre line, midway between two candles, a
    // covered dish, a tureen or a footed stand of fruit (the kind dealt by the rank's own stream); the fine weight within 8 m of the flown line
    let silverLeast = 1e9;
    const clearNew = {};                                                  // least clear air of the bodies placed below, by class
    // (the things placed below are dealt from a stream of their own, seeded by the visit's seed)
    const rx = makeRng(hashSeed('to-the-brim:company:' + (ctx.seed ?? 1)));
    const CHOIR_ROUND = [];                                               // the choir's company of round tables, as its rule places it: [x, z, low]
    { let least = 1e9; const zs = [];                                       // the roof trusses (pendants, braces, bosses, collar): nothing of the roof within 5 m of the line
      for (let k = 0; k < 13; k++) zs.push(24 + 16 * k); for (let k = 0; k < 10; k++) zs.push(-80 - 16 * k);
      for (const z of zs) for (const s of [-1, 1]) for (const q of [[s * 25.5, 28.1], [s * 30.9, 25.2], [s * 25.8, 30.5], [s * 20.5, 33.2], [s * 12.8, 38.7], [s * 6, 39.4], [0, 38.1]]) least = Math.min(least, path.distanceTo(q[0], q[1], z) - 0.7);
      if (least < 5) console.warn('to-the-brim: a roof truss comes within 5 m of the flown line', least);
      clearNew['a roof truss (pendants, braces, bosses, collar)'] = least; }
    const silverRow = (b, name, cx, y, z0, n, dome = false) => { const tr = sr.fork(name);
      for (let j = 0; j < n; j++) { const z = z0 + 12.8 * j, kind = tr.int(0, 2), d = path.distanceTo(cx, y + 0.7, z);
        silverLeast = Math.min(silverLeast, d - 0.9);
        silverPiece(b, tr, cx, y, z, kind, d < 8, leaves, dome); } };
    // THE LONG TABLES' FEAST, by a rule of place and the table's own stream: midway between every two candles of a long
    // table (every 3.2 m down its middle) stands one thing of the larder (larderPiece). Its height is by rule, so that the
    // outline changes all the way down (of every five in a row: one tall, two of middle height, two low, the row begun at a
    // different place on each table); which thing of that height is dealt by the stream, never the one that stood last
    // in that height's place on this table. A thing whose top would come within 2.75 m of the flown line gives way to a
    // lower one. Full weight on a table's stretch within 12 m of the flown line in plan; beyond it the light outline.
    let larderLeast = 1e9; const larderN = [0, 0];
    const feastRow = async (name, cx, z0, n, t) => { const fr = rng.fork('larder' + name), last = [-1, -1, -1];
      for (let g = 0; g < n; g++) { const z = z0 + LAT * g + LAT / 2; let cls = [0, 2, 1, 2, 1][(g + 2 * t) % 5], kind = -1, d = 0;
        for (; cls < 3; cls++) { const ks = LARDER_CLASS[cls].filter((k) => k !== last[cls]); kind = ks[fr.int(0, ks.length - 1)];
          d = Math.min(path.distanceTo(cx, 3.0 + LARDER_H[kind], z), path.distanceTo(cx, 3.0 + LARDER_H[kind] * 0.5, z)) - 0.75;
          if (d >= 2.0) break; kind = -1; }
        if (kind < 0) continue;
        last[cls] = kind; larderLeast = Math.min(larderLeast, d); const full = path.nearestXZ(cx, z).dist < 12; larderN[full ? 0 : 1]++;
        larderPiece(bT, fr, cx, 3.0, z, kind, full);
        if ((g & 15) === 15) await ctx.yield(); } };
    for (let t = 0; t < 5; t++) {
      const cx = TABLE_X[t];
      linenTable(bT, cx, 20, 200, 2.4, 3.0, 0.6, S(K_LINEN, cx, CAND_Z0, CAND_Z0 + LAT * 55), 0);
      await feastRow('nave' + t, cx, CAND_Z0, 55, t);
      await ctx.yield();
      for (let c = 0; c < 56; c++) {
        const z = CAND_Z0 + LAT * c, lit = lookName !== 'moon' || (c & 1) === 0;
        R.stick(cx, 3.0, z, lit);
        if (lit && ((c * 7 + t * 3) % 4) === 0) R.smoke.push(cx, 3.0 + R.fy + 0.42, z, 2.2 + ((c * 13) % 5) * 0.2);
      }
      await ctx.yield();
      for (let j = 0; j < 112; j++) {
        let c = j >> 1;
        if (lookName === 'moon' && (c & 1)) c = clamp(c + ((j & 1) ? 1 : -1), 0, 54);
        const z = GLASS_Z0 + 1.6 * j, fz = CAND_Z0 + LAT * c;
        for (const dx of [-1.9, -1.1, 1.1, 1.9]) R.glass(cx + dx, 3.0, z, cx, 3.0 + R.fy + 0.16, fz, 1, 1);
      }
      await ctx.yield();
      if (garlandHex) {
        const n = Math.round(200 * detail * density);
        for (let part = 0; part < 4; part++) {
          garland(bG, gr, (u, p, nrm) => { const z = 20.6 + 44.7 * (part + u); p[0] = cx + 0.52 * Math.sin(PI * (z - CAND_Z0) / LAT + PI / 2) * (0.75 + 0.25 * Math.sin(z * 0.7)); p[1] = 3.0; p[2] = z; nrm[0] = 0; nrm[1] = 1; nrm[2] = 0; },
            Math.round(n / 4), leaves, { fruit: 0.03, size: 0.46 });
          await ctx.yield();
        }
      }
    }
    // THE CHOIR'S SIDE TABLES: one along each wall (centre lines x 26.5 and -26.5, z -80 to -232), laid as the nave's are:
    // linen, a low candle every 3.2 m (47 to a table, lit in every look), four rows of half-full glasses (95 to a row, 760
    // in all), garlands, chairs. THE DARK END: the west table's eighteen candles north of z -172 stand unlit
    for (const s of [-1, 1]) {
      const cx = s * 26.5, zc = (c) => -228.8 + LAT * c, dark = (z) => s < 0 && z < -172;
      linenTable(bT, cx, -232, -80, 2.4, 3.0, 0.6, S(K_LINEN, cx, zc(0), zc(46)), 0);
      await feastRow('choir' + s, cx, zc(0), 46, s > 0 ? 1 : 3);
      await ctx.yield();
      for (let c = 0; c < 47; c++) { const z = zc(c), lit = !dark(z);
        R.stick(cx, 3.0, z, lit);
        if (lit && (c % 6) === 2) R.smoke.push(cx, 3.0 + R.fy + 0.42, z, 2.4); }
      for (let j = 0; j < 95; j++) {
        const z = -231.2 + 1.6 * j; let c = clamp(Math.floor((z - zc(0)) / LAT + 0.5), 0, 46);
        if (dark(zc(c))) c = z < -182 ? 11 : 18;                               // (told the nearest flame that burns)
        for (const dx of [-1.9, -1.1, 1.1, 1.9]) R.glass(cx + dx, 3.0, z, cx, 3.0 + R.fy + 0.16, zc(c), 1, 1);
      }
      await ctx.yield();
      if (garlandHex) {
        const n = Math.round(170 * detail * density);
        for (let part = 0; part < 4; part++) {
          garland(bG, gr, (u, p, nrm) => { const z = -231.4 + 37.7 * (part + u); p[0] = cx + 0.52 * Math.sin(PI * (z - zc(0)) / LAT + PI / 2) * (0.75 + 0.25 * Math.sin(z * 0.7)); p[1] = 3.0; p[2] = z; nrm[0] = 0; nrm[1] = 1; nrm[2] = 0; },
            Math.round(n / 4), leaves, { fruit: 0.03, size: 0.46 });
          await ctx.yield();
        }
      }
    }
    if (larderLeast < 2.0) console.warn('to-the-brim: a thing of the long tables\' feast stands within 2 m of the flown line', larderLeast);
    clearNew['a thing of the long tables\' feast'] = larderLeast; clearNew.feastFullAndLight = larderN;
    const burn = look.stub > 0 ? 0.4 : 1;                                 // the blue hour: every tall candle has burned to a stub
    const leafHex = garlandHex || '#66763a';                              // (wreaths, swags and the feet's garlands are of bay on a visit that has no garlands elsewhere)
    { const py = await buildPyramid(ctx, bX, R, gr, lookName, detail, leaves, rng.fork('tierswags'), path.distanceTo);
      if (py.garland < 2.0) console.warn('to-the-brim: a garland of the pyramid comes within 2 m of the flown line', py.garland);
      if (py.gap < 0.005) console.warn('to-the-brim: a stick of the pyramid stands in a glass\'s foot', py.gap);
      clearNew['a garland of the pyramid (every leaf of it)'] = py.garland; clearNew.stickToGlassFoot = py.gap; }
    await ctx.yield();
    const triShell = bC.triangles;
    const triBy = {}; let triLast = bC.triangles; const mark = (name) => { triBy[name] = bC.triangles - triLast; triLast = bC.triangles; };   // the choir's triangles, by what was built
    await buildDais(ctx, bC, R, gr, leafHex, detail, burn);
    mark('dais');
    { const sc = await buildStepCandles(ctx, bC, R, rng.fork('steps'), path, burn);
      if (sc.least < 2.0) console.warn('to-the-brim: a candle of the dais steps stands within 2 m of the flown line', sc.least);
      if (sc.bowlLeast < 2.0) console.warn('to-the-brim: a bowl of flowers on the dais steps stands within 2 m of the flown line', sc.bowlLeast);
      clearNew['a candle of the dais steps, at its flame'] = sc.least; clearNew['a bowl of flowers on the dais steps'] = sc.bowlLeast; clearNew.stepClusters = sc.count; clearNew.stepBowls = sc.bowls; }
    // THE GREAT URNS: one at each corner of the steps' foot, one either side of the carpet at the foot of each flight, one
    // either side of the north door
    { const ur = rng.fork('urns'), uh = [0, 1].map(() => urnHeadGeometry(() => ur.range(0, 1))), uf = rx.fork('fineurns'); let least = 1e9, n = 0;
      for (let i = 0; i < 2; i++) uh.push(urnHeadGeometry(() => uf.range(0, 1), true));       // (the finer flowers, for an urn within 25 m of the flown line in plan)
      for (const s of [-1, 1]) for (const [x, z] of [[4.6, -115.4], [4.6, -200.6], [23.6, -115.4], [23.6, -200.6], [10.8, -241.2]]) { urnAt(bC, ur, s * x, 0, z, uh[(n++ % 2) + (path.nearestXZ(s * x, z).dist < 25 ? 2 : 0)]);
        least = Math.min(least, path.distanceTo(s * x, 2.95, z) - 1.15, path.distanceTo(s * x, 2.0, z) - 0.95); }
      for (const g of uh) g.dispose();
      if (least < 2.0) console.warn('to-the-brim: a great urn stands within 2 m of the flown line', least);
      clearNew['a great urn of flowers'] = least; }
    mark('steps');
    await ctx.yield();
    for (const cx of [-5, 5]) silverRow(bC, 'rank' + cx, cx, 6.0, RANK_Z0 - 3.2 * (RANK_N - 1) + 1.6 + 3.2, 3, true);   // each rank: z -163.6, -150.8, -138
    if (silverLeast < 2.0) console.warn('to-the-brim: a silver dish stands within 2 m of the flown line', silverLeast);
    // THE FEAST on the two ranks, by a rule of place: midway between every two low candles (twelve places a rank, 3.2 m apart)
    // stands one thing. Counting from the south end: the first of every four a tall silver candelabrum of five (0.3 m toward
    // the table's far side), the third a piece of silver (silverRow's), the second and fourth a dish of the feast, its kind
    // dealt by the feast's own stream, never the kind before it on that rank
    let feastLeast = 1e9;
    { const fe = rng.fork('feast'), c5 = cand5Geometry(burn), c5f = c5Flames(burn);
      for (const cx of [-5, 5]) { let last = -1;
        for (let g = 0; g < RANK_N - 1; g++) { const z = RANK_Z0 - 1.6 - 3.2 * g;
          if (g % 4 === 2) continue;
          if (g % 4 === 0) { const x = cx + Math.sign(cx) * 0.3; bC.add(c5, { p: [x, 6.0, z] });
            for (const f of c5f) { R.flame(x + f[0], 6.0 + f[1] + 0.02, z + f[2], 0.34, 0.12); feastLeast = Math.min(feastLeast, path.distanceTo(x + f[0], 6.0 + f[1] + 0.36, z + f[2]) - 0.15); }
            feastLeast = Math.min(feastLeast, path.distanceTo(x, 7.0, z) - 0.6);
          } else { let k = fe.int(0, 5); while (k === last) k = fe.int(0, 5); last = k;
            feastPiece(bC, fe, cx, 6.0, z, k, leaves);
            feastLeast = Math.min(feastLeast, path.distanceTo(cx, 6.0 + FEAST_H[k], z) - 0.75, path.distanceTo(cx, 6.2, z) - 0.75); } } }
      c5.dispose(); }
    if (feastLeast < 2.0) console.warn('to-the-brim: a dish or a candelabrum of the feast stands within 2 m of the flown line', feastLeast);
    clearNew['a dish or a candelabrum of the feast'] = feastLeast;
    mark('feast');
    await ctx.yield();
    buildCanopy(bC);
    await ctx.yield();
    // THE DAIS'S GARLANDS: a thick rope of leaves, white flowers and fruit (0.72 m through at its fullest) swagged along both
    // hand rails, laid on the rail every 4.04 m and hanging 0.9 m between; and a garland of real leaves (sprays of leaves, white roses and blossom
    // over a dark core, about 1.4 m through) wound four and two thirds times up each of the canopy's four gathered corner
    // curtains, from y 3.6 to y 21.6
    { let least = 1e9; const lh = shade(leafHex, 0.9);
      const count = (pts, r) => { for (const q of pts) least = Math.min(least, path.distanceTo(q[0], q[1], q[2]) - r); };
      for (const s of [-1, 1]) { const pts = [];
        for (let i = 0; i <= 72; i++) { const f = Math.sin(((i % 4) / 4) * PI); pts.push([s * 19.6, 4.98 - 0.9 * f, -121.6 - 72.8 * i / 72, 0.75 + 0.25 * f]); }
        garlandRope(bC, pts, 0.36, 3, lh, 1); count(pts, 0.36); }
      const curR = (y) => { const c = CANOPY_CUR; for (let i = 0; i < c.length - 1; i++) if (y <= c[i][0] && y >= c[i + 1][0]) return lerp(c[i + 1][1], c[i][1], (y - c[i + 1][0]) / (c[i][0] - c[i + 1][0])); return 1; };
      for (const s of [-1, 1]) for (const z of [-128.6, -187.4]) { const pts = [];
        for (let i = 0; i <= 28; i++) { const y = 3.6 + 18 * i / 28, a = i * TAU / 6 + (s > 0 ? 0 : PI), r = curR(y) * 1.2 + 0.25;
          pts.push([s * 16.4 + Math.cos(a) * r, y, z + Math.sin(a) * r, i === 0 || i === 28 ? 0.5 : 1]); }
        // (a wound garland of real leaves: a leaf mass in seven lengths, each facing out from the curtain where it lies:
        // a dark core, five sprays of leaves to the metre, white roses and small blossom among them)
        const cg = rx.fork('cornersprays' + s + z), LM = makeLeafMass(() => cg.range(0, 1));
        for (let k = 0; k < 7; k++) { const a = (k * 4 + 2) * TAU / 6 + (s > 0 ? 0 : PI);
          LM.rope(pts.slice(k * 4, k * 4 + 5), 0.42, 3, [Math.cos(a), 0.15, Math.sin(a)], { leaf: 5, rose: 0.7, bloom: 0.5, roseHex: '#e6dfcc' }); }
        bC.add(LM.geo(), {}); count(pts, 0.42 * 1.75); }
      if (least < 2.0) console.warn('to-the-brim: a garland of the dais comes within 2 m of the flown line', least);
      clearNew['a garland of the dais (rails, canopy corners)'] = least; }
    mark('canopy');
    await ctx.yield();
    { const dw = await buildDoorway(ctx, bC, R, gr, burn, path.distanceTo);
      if (dw.garland < 2.0) console.warn('to-the-brim: the garland over the north arch comes within 2 m of the flown line', dw.garland);
      if (dw.sconce < 2.0) console.warn('to-the-brim: a sconce of the north wall\'s gilt pilasters comes within 2 m of the flown line', dw.sconce);
      if (dw.cups < 2.0) console.warn('to-the-brim: a candle cup of the north arch comes within 2 m of the flown line', dw.cups);
      clearNew['the garland over the north arch (every leaf of it)'] = dw.garland; clearNew['a sconce of the north wall\'s gilt pilasters'] = dw.sconce;
      clearNew['a candle cup round the north arch'] = dw.cups; clearNew.archCups = dw.nCups;
      if (dw.porch < 2.2) console.warn('to-the-brim: an arch of the porch comes within 2.2 m of the flown line', dw.porch);
      clearNew['an arch of the porch'] = dw.porch;
      // THE NICHES' URNS: a great gilt urn of flowers in every second niche of the north wall, on its sill
      { const nu = rx.fork('nicheurns'), nh = [0, 1].map(() => urnHeadGeometry(() => nu.range(0, 1))); let k = 0, least = dw.niche;
        for (const [x, y, z] of dw.urns) { urnAt(bC, nu, x, y, z, nh[k++ % 2]); least = Math.min(least, path.distanceTo(x, y + 2.95, z) - 1.15, path.distanceTo(x, y + 2.0, z) - 0.95); }
        for (const g of nh) g.dispose();
        if (least < 2.0) console.warn('to-the-brim: a niche of the north wall (its stand, its urn, its candles) comes within 2 m of the flown line', least);
        clearNew['a niche of the north wall (its stand, its urn, its sill candles)'] = least; clearNew.nicheGlasses = dw.nicheGlasses; } }
    mark('doorway');
    await ctx.yield();
    const cGeos = [candelabrumGeometry(burn), candelabrumGeometry(burn, true)];
    { const w = await buildRoundTables(ctx, bX, R, rng.fork('wreaths'), rx.fork('woundflowers'), cGeos, burn, path, ROUND.map(([x, z]) => [x, z, false]), rx.fork('rounddress'));
      // CLEAR AIR: no round table of the transepts stands within 6 m of the flown line in plan
      for (const [x, z] of ROUND) if (path.nearestXZ(x, z).dist < 6 + 3.2) console.warn('to-the-brim: a round table stands too near the flown line', x, z);
      if (w.wreath < 2.0 || w.body < 2.0) console.warn('to-the-brim: a round table of the transepts comes within 2 m of the flown line', w.wreath, w.body);
      clearNew['a wreath of a round table (every leaf of it, and the flowers wound on its candelabrum)'] = w.wreath; clearNew['a round table of the transepts (cloth, flame tips)'] = w.body; }
    await ctx.yield();
    const dGeo = dresserGeometry(burn);
    await ctx.yield();
    // (the nave's and the transepts' dressers are the rich ones: a lit back board, a gilt shell; on every dresser gilt and
    // silver plate on the base, the third shelf and the top shelf: real on the top shelf and the base within 30 m of the
    // flown line in plan, painted on the board elsewhere. A DRESSER WITHIN 16 m OF THE FLOWN LINE IN PLAN, in the nave,
    // the transepts or the choir, is the richest: the gilt shell for its crest, its back board panelled in dark
    // blue-green with gilt lines, real plate on edge on all three shelves, ewers on the top shelf, tureens on the
    // third, vases on the base, a pair of lit candlesticks on the base. Glasses on the second and the fourth shelf; a dresser 58 m or
    // more from the flown line in plan (the west transept's four) on the fourth only: their forty stand in the niches
    // of the north wall.)
    const dGeoR = dresserGeometry(burn, true), richAt = (x, z) => { const d = path.nearestXZ(x, z).dist; return d < 16 ? 3 : d < 30 ? 2 : 1; }, farAt = (x, z) => path.nearestXZ(x, z).dist >= 58;
    await ctx.yield();
    for (let k = 0; k < 13; k++) { const z = 24 + 16 * k;
      // THE NAVE'S VERDURES: one in every bay of both walls (thirteen a side), as the choir's are: over a dresser's head (y
      // 16.7), or down to the wainscot's rail (y 10.7) in the two bays where a door stands; designs 0, 1, 2 by turns
      for (const s of [-1, 1]) verdureAt(bN, s * 33.65, z, s, (k + (s > 0 ? 1 : 0)) % 3, z === 88 || z === 168 ? 10.7 : 16.7, true);
      if (z === 88 || z === 168) continue; for (const s of [-1, 1]) placeDresser(bN, dGeoR, R, s * 33.65, z, -s, 0, burn, richAt(s * 33.65, z), farAt(s * 33.65, z)); if ((k & 3) === 3) await ctx.yield(); }
    // the transepts: a dresser either side of each great window (z -5 and -57), and one on each side wall by the crossing (x 41)
    for (const s of [-1, 1]) {
      for (const z of [-5, -57]) placeDresser(bX, dGeoR, R, s * 61.65, z, -s, 0, burn, richAt(s * 61.65, z), farAt(s * 61.65, z));
      // THE TRANSEPTS' VERDURES: on each end wall six (one over each dresser, one between each dresser and the great
      // window's frame, one in each corner), on each side wall two (one over the dresser, one in the outer bay)
      TV_Z.forEach((z, k) => verdureAt(bX, s * 61.65, z, s, (k + (s > 0 ? 1 : 0)) % 3, z === -5 || z === -57 ? 16.7 : 10.7, true));
      verdureX(bX, s * 40.1, 9.65, -1, s > 0 ? 1 : 2, 16.7); verdureX(bX, s * 40.1, -71.65, 1, s > 0 ? 2 : 0, 16.7);
      placeDresser(bX, dGeoR, R, s * 41, 9.65, 0, -1, burn, richAt(s * 41, 9.65), farAt(s * 41, 9.65)); placeDresser(bX, dGeoR, R, s * 41, -71.65, 0, 1, burn, richAt(s * 41, -71.65), farAt(s * 41, -71.65));
    }
    await ctx.yield();
    // THE CHOIR's bays between the windows (z -80 - 16 k). Dressers: every bay south of the dais steps and north of the
    // dais, and the bay at the dais's middle; the four bays beside the dais on each wall have none
    for (const z of [-79.3, -96, -112, -160, -208, -224, -240.3]) for (const s of [-1, 1]) { const r3 = richAt(s * 33.65, z) === 3; placeDresser(bC, r3 ? dGeoR : dGeo, R, s * 33.65, z, -s, 0, burn, r3 ? 3 : 0, farAt(s * 33.65, z)); }
    dGeoR.dispose();
    await ctx.yield();
    mark('dressers');
    // THE VERDURES: one in every bay of both choir walls (eleven a side). Before the four bays beside the dais it hangs to the
    // wainscot's rail (y 10.7); where a dresser stands, above its head (y 16.7). The designs are dealt by rule: 0, 1, 2 by
    // turns down each wall (the east wall one step ahead of the west), and in the two bays abreast of the great glass (z -176
    // and -192), on both walls, design 3, the darkest
    for (let k = 0; k < 11; k++) for (const s of [-1, 1]) { const zb = -80 - 16 * k, free = zb === -128 || zb === -144 || zb === -176 || zb === -192;
      verdureAt(bC, s * 33.65, k === 0 ? -79.3 : k === 10 ? -240.3 : zb, s, zb === -176 || zb === -192 ? 3 : (k + (s > 0 ? 1 : 0)) % 3, free ? 10.7 : 16.7); }
    // THE PILASTERS: one 4.95 m either side of the middle of every bay between two windows (under the window frames' jambs;
    // where a dresser stands, clear of its side, its sconce on the pilaster), nave and choir; none where a crossing pier or
    // the north wall stands in its place. The transepts: one either side of each side window (x 45.95 and 50.05) and
    // beside the dressers of the end walls
    for (const s of [-1, 1]) {
      for (let k = 0; k < 13; k++) for (const e of [-4.95, 4.95]) pilasterAt(bN, s * 33.65, 24 + 16 * k + e, -s, 0);
      for (let k = 0; k < 11; k++) for (const e of [-4.95, 4.95]) { const z = -80 - 16 * k + e; if (z < -76 && z > -244) pilasterAt(bC, s * 33.65, z, -s, 0); }
      for (const z of [-0.05, -9.95, -52.05, -61.95]) pilasterAt(bX, s * 61.65, z, -s, 0);
      for (const x of [45.95, 50.05]) { pilasterAt(bX, s * x, 9.65, 0, -1); pilasterAt(bX, s * x, -71.65, 0, 1); }
    }
    await ctx.yield();
    mark('pilasters');
    // THE TRANSEPTS' OUTER BAYS (x 56 on each side wall, no dresser, no door): a verdure and under it a silver sconce
    // with a mirror back: a round mirror 0.8 m across in a silver frame, two arms, two candles (the hall light's law knows them)
    { const SV = S(K_METAL, 0.85);
      for (const s of [-1, 1]) for (const d of [-1, 1]) { const x = s * 56, z = d > 0 ? 9.65 : -71.65, o = -d;       // (o: into the hall along z)
        verdureX(bX, x, z, o, (s * d > 0 ? 0 : 2), 11.4);
        bX.add(cyl(0.4, 0.4, 0.04, 12), { p: [x, 10.4, z + o * 0.03], r: [PI / 2, 0, 0], c: '#e9eef2', surf: S(K_METAL, 1) });
        bX.add(new THREE.TorusGeometry(0.44, 0.07, 4, 12), { p: [x, 10.4, z + o * 0.04], c: C.silver, surf: SV });
        for (const e of [-1, 1]) {
          bX.add(box(0.1, 0.1, 0.8), { p: [x + e * 0.5, 9.9, z + o * 0.4], c: C.silver, surf: SV });
          bX.add(new THREE.ConeGeometry(0.26, 0.14, 7, 1, true), { p: [x + e * 0.5, 10.0, z + o * 0.8], r: [PI, 0, 0], c: C.silver, surf: SV });
          bX.add(cyl(0.08, 0.08, 0.62 * burn, 5, true), { p: [x + e * 0.5, 10.04 + 0.31 * burn, z + o * 0.8], c: C.wax, surf: S(K_PLAIN, 0.6) });
          R.flame(x + e * 0.5, 10.06 + 0.62 * burn, z + o * 0.8, 0.4, 0.15);
        }
      } }
    dGeo.dispose();
    { const tGeo = treeGeometry(burn), tFl = treeFlames(burn), tree = (b, x, z, y = 0) => { b.add(tGeo, { p: [x, y, z] });
        if (x < -6 && z < -172 && z > -236) return;                          // THE DARK END: a tree of the west side between z -172 and the doorway's own stands unlit
        for (const f of tFl) R.flame(x + f[0], y + f[1], z + f[2], 0.5, 0.17);
        R.smoke.push(x, y + 7.89 + 1.16 * burn, z, 3.4);
        if (path.distanceTo(x, 8.6, z) < 6) console.warn('to-the-brim: a candle tree stands within 6 m of the flown line', x, z); };
      // THE AVENUE, by rules of place. ORANGE TREES in gilt tubs stand in two rows a side, 9 m and 16 m out from the carpet's
      // middle, every 9 m: seven stations before the dais (z -58 to -112) and four before the north door (z -206 to -233).
      // Between the rows (x 12.5 and -12.5), midway between the stations, the CANDLE TREES on garlanded oak feet 0.9 m high
      // (radius 1.62): six before the dais (z -62.5 to -107.5), three before the door (z -210.5 to -228.5). A tree stands only
      // where the flown line leaves 5 m of clear floor in plan to its widest part (an orange tree's head and lanterns: 2.8 m
      // from its middle; a candle tree's foot): where the line crosses a row, the row has its gap (uGapE: the first and
      // last missing station of each east row of orange trees; the east row of candle trees stops there: uPairE = its last)
      const floorObs = [];                                                   // (what stands on the choir's floor: [x, z, radius]; the choir's company of tables keeps clear of it)
      { const fr = rng.fork('avenue'), footP = [[1.55, 0], [1.62, 0.12], [1.5, 0.2], [1.5, 0.8], [1.6, 0.86], [1.5, 0.9], [0, 0.9]];
        let lastE = -1, open = true;
        const pair = (x, z) => { const d = path.nearestXZ(x, z).dist - 1.62; if (d < 5) return false;
          floorObs.push([x, z, 1.62]);
          bC.add(lathe(footP, 10), { p: [x, 0, z], c: C.oakD, surf: S(K_WOOD) });
          ropeGarland(bC, fr, x, z, 1.5, 1.0, leafHex, detail);                 // every foot has its garland, on every visit
          tree(bC, x, z, 0.9); return true; };
        for (let k = 0; k < 6; k++) { const z = -62.5 - 9 * k; pair(-12.5, z); if (open && pair(12.5, z)) lastE = k; else open = false; }
        for (let k = 0; k < 3; k++) for (const s of [-1, 1]) pair(s * 12.5, -210.5 - 9 * k);
        HU.uPairE.value = lastE;
        if (lastE < 0) console.warn('to-the-brim: no candle tree of the avenue stands east of the carpet');
        // (a head within 25 m of the line in plan: 168 small sprays of leaves (half side 0.14 to 0.19 of the head's reach), 14
        // oranges, 8 clusters of blossom over a core of 20 faces, 400 triangles; beyond: 44 sprays (0.2 to 0.27), 8 and 4 over
        // a core of 20, 132 triangles. THE DARK END's heads are not lit from within. The finer heads are dealt from their own
        // fork; the 'leafmass' fork deals first two heads of 84 sprays that are not used (they are let go at once: their
        // draws stand in that stream's order before the far heads' own))
        const or = rng.fork('orange'), lmf = rng.fork('leafmass'), lmr = () => lmf.range(0, 1), fhf = rx.fork('fineheads'), fhr = () => fhf.range(0, 1), tub = orangeTubGeometry(); let least = 1e9, nT = 0;
        for (const lit of [true, false]) treeHeadGeometry(lmr, 84, 14, 8, lit, 1).dispose();
        const headF = [treeHeadGeometry(fhr, 168, 14, 8, true, 0, 0.14), treeHeadGeometry(fhr, 168, 14, 8, false, 0, 0.14)], headL = [treeHeadGeometry(lmr, 44, 8, 4, true, 0), treeHeadGeometry(lmr, 44, 8, 4, false, 0)];
        await ctx.yield();
        const orange = (x, z) => { const d = path.nearestXZ(x, z).dist; if (d - 2.8 < 5) return false;
          floorObs.push([x, z, 1.35]);
          least = Math.min(least, orangeTreeAt(bC, R, or, x, z, tub, d < 25 ? headF : headL, path, x < 0 && z < -197)); nT++; return true; };
        for (const [ri, x] of [[0, 9], [1, 16]]) { let g0 = 99, g1 = -1;
          for (let k = 0; k < 7; k++) { const z = -58 - 9 * k; orange(-x, z); if (!orange(x, z)) { g0 = Math.min(g0, k); g1 = Math.max(g1, k); } }
          for (let k = g0; k <= g1; k++) if (path.nearestXZ(x, -58 - 9 * k).dist - 2.8 >= 5) console.warn('to-the-brim: an east row of orange trees has two gaps', x);
          HU.uGapE.value.setComponent(ri * 2, g0); HU.uGapE.value.setComponent(ri * 2 + 1, g1);
          for (let k = 0; k < 4; k++) for (const s of [-1, 1]) if (!orange(s * x, -206 - 9 * k)) console.warn('to-the-brim: an orange tree before the north door stands too near the flown line', s * x);
          await ctx.yield(); }
        // THE TRANSEPTS' ORANGE TREES: four in each transept's outer bays, by the end wall: one in each corner (z 4.5 and
        // -66.5) and one either side of the great window (z -15 and -47), x 58.5; the lighter heads, their lanterns lit
        { const tt = rng.fork('transepttrees'); let lt = 1e9;
          for (const s of [-1, 1]) for (const z of [4.5, -15, -47, -66.5]) lt = Math.min(lt, orangeTreeAt(bX, R, tt, s * 58.5, z, tub, headL, path, false));
          if (lt < 2.0) console.warn('to-the-brim: an orange tree of the transepts comes within 2 m of the flown line', lt);
          clearNew['an orange tree of the transepts (head, lanterns, tub)'] = lt; }
        tub.dispose(); for (const g of [...headF, ...headL]) g.dispose();
        if (least < 2.0) console.warn('to-the-brim: an orange tree comes within 2 m of the flown line', least);
        clearNew['an orange tree (head, lanterns, tub)'] = least; clearNew.orangeTrees = nT; }
      await ctx.yield();
      // THE RIVER OF LIGHT: a low candle in a small glass cup every 1.5 m along both edges of the carpet (x 3.1 and -3.1) from
      // the pyramid's foot to the dais steps (z -58 to -115), and from the dais to the north door (z -201 to -237) 5.2 m either
      // side of the axis, because the flown line lies on the axis there: no cup stands within 5 m of the line in plan (the
      // east row before the dais ends where the line comes in over it: uRivE = its last cup's z)
      { const cup = new THREE.CylinderGeometry(0.17, 0.11, 0.26, 4, 1, true), CUP = S(K_PLAIN, 0.75); let least = 1e9, nC = 0, rivE = -58;
        const at = (x, z) => { if (path.nearestXZ(x, z).dist < 5) return false;
          bC.add(cup, { p: [x, 0.13, z], r: [0, PI / 4, 0], c: '#e0a860', surf: CUP }); R.bare(x, 0.2, z, 0.3, 0.11); R.glow(x, 0.34, z, 0.95);
          least = Math.min(least, path.distanceTo(x, 0.5, z) - 0.2); nC++; return true; };
        let openE = true;
        for (let k = 0; k < 39; k++) { const z = -58 - 1.5 * k; at(-3.1, z); if (openE && at(3.1, z)) rivE = z; else openE = false; }
        for (let k = 0; k < 25; k++) for (const s of [-1, 1]) at(s * 5.2, -201 - 1.5 * k);
        cup.dispose(); HU.uRivE.value = rivE;
        if (least < 2.0) console.warn('to-the-brim: a cup of the river of light stands within 2 m of the flown line', least);
        clearNew['a candle cup of the river of light'] = least; clearNew.riverCups = nC; }
      await ctx.yield();
      // THE CHOIR'S COMPANY of round tables, by its rule of place (see ROUND): free(x, z) = the clear floor about a place
      { const obs = [...floorObs, [0, -30, 20.3]]; for (let i = 0; i < 12; i++) obs.push([24 * Math.cos((i + 0.5) * PI / 6), -30 + 24 * Math.sin((i + 0.5) * PI / 6), 1.2]);
        for (const s of [-1, 1]) obs.push([s * 34, -72, 2.4]); for (const [x, z] of ROUND) obs.push([x, z, 4.6]);
        const free = (x, z) => { const ax = Math.abs(x); let m = Math.min(ax - 3.4, z + 116.8);
          for (const o of obs) m = Math.min(m, Math.hypot(x - o[0], z - o[1]) - o[2]);
          if (z < -72) { m = Math.min(m, 33.3 - ax, Math.hypot(Math.max(22.6 - ax, 0), Math.max(z + 79, 0)));
            for (const zd of [-79.3, -96, -112]) m = Math.min(m, Math.hypot(Math.max(31.3 - ax, 0), Math.max(Math.abs(z - zd) - 4.6, 0))); }
          return m; };
        for (let j = 1; j < 8; j++) for (const x0 of j & 1 ? [17.9, 27.3] : [13.2, 22.6]) for (const s of [-1, 1]) { const x = s * x0, z = -54.5 - 8.2 * j;
          if (free(x, z) >= 4.6) CHOIR_ROUND.push([x, z, path.nearestXZ(x, z).dist < 7]); }
        const w = await buildRoundTables(ctx, bC, R, rx.fork('companywreaths'), rx.fork('companyflowers'), cGeos, burn, path, CHOIR_ROUND, rx.fork('companydress'));
        for (const [x, z, low] of CHOIR_ROUND) if (!low && path.nearestXZ(x, z).dist < 5 + 1.4) console.warn('to-the-brim: a tall candelabrum stands within 5 m of the flown line in plan', x, z);
        if (w.wreath < 2.0 || w.body < 2.0) console.warn('to-the-brim: a round table of the choir comes within 2 m of the flown line', w.wreath, w.body);
        clearNew['a round table of the choir (cloth, flame tips)'] = w.body; clearNew['a wreath or the wound flowers of a round table of the choir'] = w.wreath; clearNew.choirRoundTables = CHOIR_ROUND.length; }
      for (const g of cGeos) g.dispose();
      await ctx.yield();
      for (const s of [-1, 1]) tree(bC, s * 12.5, -238);
      for (const s of [-1, 1]) for (const z of [-126, -190]) tree(bC, s * 17.2, z, 3);
      for (let i = 0; i < 12; i++) tree(bX, 24 * Math.cos((i + 0.5) * PI / 6), -30 + 24 * Math.sin((i + 0.5) * PI / 6));
      tGeo.dispose(); }
    mark('avenue');
    await ctx.yield();
    const meshes = [], info = { glasses: 0, weights: {}, clear: {}, tris: { nave: bN.triangles, crossing: bX.triangles, choir: bC.triangles, tables: bT.triangles, garlands: bG.triangles, choirShell: triShell, choirBy: triBy } };
    for (const b of [bN, bX, bC, bT, bG]) { if (!b.triangles) continue; const m = new THREE.Mesh(b.build(), hallMat); scene.add(m); meshes.push(m); await ctx.yield(); }
    // sconces on the choir walls under the two southern hangings of each side (z -128, -144)
    { const bS = INT.makeBuilder(), G = S(K_METAL, 0.55);
      for (const z of [-128, -144]) for (const s of [-1, 1]) {                            // (the hangings of THE DARK END, z -176 and -192, carry none)
        const x = s * 33.5;
        bS.add(lathe([[0.02, -0.7], [0.4, -0.3], [0.56, 0.4], [0.26, 1.0], [0.02, 1.2]], 6), { p: [x, 10.0, z], s: [0.25, 1, 1], c: C.gilt, surf: G });
        for (const dz of [-0.7, 0.7]) {
          bS.add(bevelBox(0.9, 0.14, 0.14, 0.04, 'x'), { p: [x - s * 0.5, 10.0, z + dz], c: C.iron, surf: S(K_METAL, 0.3) });
          bS.add(new THREE.ConeGeometry(0.3, 0.16, 7, 1, true), { p: [x - s * 0.95, 10.1, z + dz], r: [PI, 0, 0], c: C.gilt, surf: G });
          bS.add(cyl(0.08, 0.08, 0.62 * burn, 5, true), { p: [x - s * 0.95, 10.14 + 0.31 * burn, z + dz], c: C.wax, surf: S(K_PLAIN, 0.6) });
          R.flame(x - s * 0.95, 10.16 + 0.62 * burn, z + dz, 0.4, 0.15);
        }
      }
      const m = new THREE.Mesh(bS.build(), hallMat); scene.add(m); meshes.push(m); }
    await ctx.yield();

    // ---------------- chairs and candlesticks (instanced; chairs thin on slower machines, never the glasses)
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(1, 1, 1), yAxis = new THREE.Vector3(0, 1, 0);
    // (every instanced mesh of the hall material carries a colour for each instance, white where it has none of its own to
    // tell: so the hall's material is compiled once for all of them, the leaves included)
    const WHITE = new THREE.Color(1, 1, 1);
    const instanced = (geo, list, stride, fill) => {
      const n = list.length / stride; if (!n) return null;
      const mesh = new THREE.InstancedMesh(geo, hallMat, n);
      for (let i = 0; i < n; i++) { fill(i * stride, i); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, WHITE); }
      mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); scene.add(mesh); return mesh;
    };
    // (lists 0, 1: the plain chair, south and north; 2, 3: the shaped chair where a seat is within 8.6 m of the flown line, and the dais
    // ranks; a list 4 is made of them below: the plain seats beyond 13 m of the line that stand in to their tables, in the fewest faces)
    // THE SEATS of the nave's tables and of the round tables. UPHOLSTERY, dealt by table from three: crimson, a deep
    // blue-green, old gold (the nave's five tables take the three by turns from a dealt beginning, so that no two
    // neighbours match; each round table is dealt its own); the choir's and the ranks' stay crimson. About one chair in
    // seven stands DRAWN BACK from its table (0.5 to 0.9 m) and turned (0.25 to 0.7 of a radian, either way). On about one
    // seat in nine lies a folded napkin, or (one in three of those) a small wreath of leaves and roses. No person.
    const cr = rng.fork('chairs'), se = rng.fork('seats'), seN = se, chairs = [[], [], [], []], bSeat = INT.makeBuilder(); let drawnLeast = 1e9, nDrawn = 0, nSeat = 0;
    const UPH = [WHITE, new THREE.Color(0.035, 5.45, 2.64), new THREE.Color(1.35, 11.0, 0.75)];     // (what the crimson cloth is dyed by: itself, to blue-green, to old gold)
    const seat = (li, x, y, z, yaw, jit, uph, near, se = seN) => {         // (se: the fork that deals this seat)
      // (uph + 4: a chair drawn back; it keeps all four legs at every distance)
      if (se.chance(1 / 7)) { uph += 4; const back = se.range(0.5, 0.9), turn = se.range(0.25, 0.7) * (se.chance(0.5) ? 1 : -1);
        x -= Math.sin(yaw) * back; z -= Math.cos(yaw) * back; yaw += turn; nDrawn++; drawnLeast = Math.min(drawnLeast, path.distanceTo(x, y + 3.97, z) - 1.3, path.distanceTo(x, y + 2, z) - 1.3); }
      if (se.chance(1 / 9)) { const sy = y + (near ? 2.29 : 2.1); nSeat++;
        if (se.chance(1 / 3)) { const LM = makeLeafMass(() => se.range(0, 1)), pts = [];
          for (let i = 0; i <= 6; i++) { const a = i * TAU / 6; pts.push([x + Math.cos(a) * 0.3, sy + 0.07, z + Math.sin(a) * 0.3, 1]); }
          LM.rope(pts, 0.13, 0, [0, 1, 0], { leaf: 4.5, rose: 1.4, roseHex: '#e6dfcc' }); bSeat.add(LM.geo(), {}); }
        else bSeat.add(openBox(0.62, 0.07, 0.62, 'D'), { p: [x, sy + 0.035, z], r: [0, yaw + se.range(-0.5, 0.5), 0], c: '#e4dccb', surf: S(K_PLAIN) }); }
      chairs[li].push(x, y, z, yaw, jit, uph); };
    const chairStep = detail < 0.7 ? 2 : 1, uph0 = se.int(0, 2);
    for (let t = 0; t < 5; t++) for (let c = 0; c < 56; c += chairStep) for (const s of [-1, 1]) {
      const z0 = CAND_Z0 + LAT * c, x = TABLE_X[t] + s * (3.2 + cr.range(-0.05, 0.05)), z = z0 + cr.range(-0.08, 0.08), li = path.distanceTo(x, 2, z) < 8.6 ? 2 : z0 > 110 ? 0 : 1;
      seat(li, x, 0, z, s > 0 ? -PI / 2 : PI / 2, cr.range(-0.03, 0.03), (t + uph0) % 3, li === 2);
    }
    await ctx.yield();
    for (const t of [-1, 1]) for (let c = 0; c < 47; c += chairStep) for (const s of [-1, 1]) {      // the choir's side tables
      const x = t * 26.5 + s * (3.2 + cr.range(-0.05, 0.05)), z = -228.8 + LAT * c + cr.range(-0.08, 0.08);
      chairs[path.distanceTo(x, 2, z) < 8.6 ? 2 : 1].push(x, 0, z, s > 0 ? -PI / 2 : PI / 2, cr.range(-0.03, 0.03), 0);
    }
    for (const cx of [-5, 5]) for (let c = 0; c < RANK_N; c++) chairs[3].push(cx + Math.sign(cx) * 2.35, 3, RANK_Z0 - LAT * c, cx > 0 ? -PI / 2 : PI / 2, cr.range(-0.03, 0.03), 0);
    await ctx.yield();
    for (const [cx, cz] of ROUND) { const uph = se.int(0, 2);                                 // eight chairs to a round table, facing its middle (none on a line to a neighbour): the plain chair
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) * TAU / 8; seat(1, cx + Math.cos(a) * 4.0, 0, cz + Math.sin(a) * 4.0, Math.atan2(-Math.cos(a), -Math.sin(a)), cr.range(-0.05, 0.05), uph, false); } }
    { const cc = rx.fork('companychairs'), cs = rx.fork('companyseats'); let least = 1e9;   // the choir's company: the same, dealt from its own forks
      for (const [cx, cz] of CHOIR_ROUND) { const uph = cs.int(0, 2);
        for (let i = 0; i < 8; i++) { const a = (i + 0.5) * TAU / 8, x = cx + Math.cos(a) * 4.0, z = cz + Math.sin(a) * 4.0;
          least = Math.min(least, path.distanceTo(x, 3.97, z) - 0.6, path.distanceTo(x, 2, z) - 0.6);
          seat(1, x, 0, z, Math.atan2(-Math.cos(a), -Math.sin(a)), cc.range(-0.05, 0.05), uph, false, cs); } }
      if (least < 2.0) console.warn('to-the-brim: a chair of the choir\'s round tables comes within 2 m of the flown line', least);
      info.clear['a chair of the choir\'s round tables'] = least; }
    if (drawnLeast < 2.0) console.warn('to-the-brim: a chair drawn back from its table comes within 2 m of the flown line', drawnLeast);
    info.clear['a chair drawn back from its table'] = drawnLeast; info.seats = { drawnBack: nDrawn, napkinsAndWreaths: nSeat };
    if (bSeat.triangles) { info.tris.seats = bSeat.triangles; const m = new THREE.Mesh(bSeat.build(), hallMat); scene.add(m); meshes.push(m); }
    await ctx.yield();
    const chairGeo = chairGeometry(), chairGeoNear = chairGeometryNear(), chairGeoFar = chairGeometryFar();
    { const far = [];                                                          // list 4: a plain seat that nobody passes within 13 m
      for (let ci = 0; ci < 2; ci++) { const l = chairs[ci], keep = [];
        for (let o = 0; o < l.length; o += 6) { const t = l[o + 5] > 3 || path.distanceTo(l[o], l[o + 1] + 2, l[o + 2]) < 13 ? keep : far; t.push(l[o], l[o + 1], l[o + 2], l[o + 3], l[o + 4], l[o + 5]); }
        chairs[ci] = keep; }
      chairs.push(far); info.chairs = chairs.map((l) => l.length / 6); }
    for (let ci = 0; ci < 5; ci++) {
      const list = chairs[ci];
      const cm = instanced(ci === 4 ? chairGeoFar : ci < 2 ? chairGeo : chairGeoNear, list, 6, (o) => { m4.compose(p3.set(list[o], list[o + 1], list[o + 2]), q4.setFromAxisAngle(yAxis, list[o + 3] + list[o + 4]), s3); });
      if (cm) { for (let i = 0; i < list.length / 6; i++) cm.setColorAt(i, UPH[list[i * 6 + 5] & 3]); cm.instanceColor.needsUpdate = true; }
      await ctx.yield();
    }
    // THE STICKS, dealt once by place: low or tall, and the fine weight (a wick end, a pool of wax, runs, a drip pan) where
    // the foot stands within 9 m of the flown line, the lightest (lists 5, 6) where it stands 16 m or more from it
    const stickGeos = [stickGeometry(look.stub, 0, false), stickGeometry(look.stub, 0.6, false), stickGeometry(look.stub, 0, true), stickGeometry(look.stub, 0.6, true),
      stickGeometry(look.stub, 0, false, true), stickGeometry(look.stub, 0.6, false, true)];
    const sticks = [[], [], [], [], [], [], []];
    for (let i = 0; i < R.sticks.length; i += 5) { const x = R.sticks[i], y = R.sticks[i + 1], z = R.sticks[i + 2], tall = R.sticks[i + 3];
      const d = path.distanceTo(x, y + 1, z), near = d < 9;
      sticks[near ? 2 + tall : d >= 16 ? 5 + tall : tall ? 1 : z > 10 ? 0 : 4].push(x, y, z, R.sticks[i + 4]);
      if ((i & 1023) === 0) await ctx.yield(); }
    info.sticks = sticks.map((l) => l.length / 4);
    for (let si = 0; si < 7; si++) { const list = sticks[si];
      instanced(stickGeos[si === 4 ? 0 : si > 4 ? si - 1 : si], list, 4, (o, i) => { m4.compose(p3.set(list[o], list[o + 1], list[o + 2]), q4.setFromAxisAngle(yAxis, i * 2.399), s3.set(list[o + 3], 1, list[o + 3])); });
      s3.set(1, 1, 1);
      await ctx.yield();
    }
    // THE LEAVES: one folded leaf (two facets about its midrib, 1 m long from stem to tip, darker at the stem), instanced
    // wherever a builder asked for one: placed with its stem at the place given, pointing and facing as given, in one of three greens
    { const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0.45, 0.2, 0.09, 0, 0, 0, 0.45, -0.2, 0.09, 1, 0, 0], 3));
      lg.setAttribute('color', new THREE.Float32BufferAttribute([0.45, 0.45, 0.45, 1.1, 1.1, 1.1, 0.85, 0.85, 0.85, 0.45, 0.45, 0.45, 0.8, 0.8, 0.8, 1.1, 1.1, 1.1], 3));
      lg.setAttribute('surf', new THREE.Float32BufferAttribute([6, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0], 4));
      lg.computeVertexNormals();
      const n = leaves.length / 11, lm = new THREE.InstancedMesh(lg, hallMat, Math.max(n, 1)), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), col = new THREE.Color();
      const greens = [hex(leafHex), shade(leafHex, 0.62), hex(leafHex).lerp(hex('#9aa04a'), 0.45)];
      for (let i = 0; i < n; i++) { const o = i * 11, sz = leaves[o + 9];
        X.set(leaves[o + 3], leaves[o + 4], leaves[o + 5]).normalize(); Z.set(leaves[o + 6], leaves[o + 7], leaves[o + 8]);
        Y.crossVectors(Z, X); if (Y.lengthSq() < 1e-6) Y.set(0, 1, 0); Y.normalize(); Z.crossVectors(X, Y);
        m4.makeBasis(X, Y, Z).scale(s3.set(sz, sz, sz)).setPosition(leaves[o], leaves[o + 1], leaves[o + 2]);
        lm.setMatrixAt(i, m4); lm.setColorAt(i, col.copy(greens[leaves[o + 10] % 3]).multiplyScalar(0.8 + 0.4 * ((i * 0.618) % 1)));
        if ((i & 1023) === 1023) await ctx.yield(); }
      s3.set(1, 1, 1); lm.count = n; lm.instanceMatrix.needsUpdate = true; if (lm.instanceColor) lm.instanceColor.needsUpdate = true;
      lm.computeBoundingSphere(); scene.add(lm); info.leaves = n; }
    await ctx.yield();

    // ---------------- THE GLASSES: four weights (near, mid, far, speck) and the one, dealt once by distance from the flown
    // line (never by the eye; the near weight where the line passes within 2 m in plan and 4.3 m in the air, and on the
    // dais ranks; the mid within 5.4 m in plan, the far within 17 m, the speck beyond);
    // every glass is told its nearest flame; THE HALF is the kit's constant. No glass is ever left out.
    const NEAR_R = 2.0, FAR_R = 5.4, SPECK_R = 17;
    const G = R.glasses, nG = G.length / 8, buckets = new Map();
    let clearMin = 1e9;
    for (let i = 0; i < nG; i++) {
      const o = i * 8, x = G[o], y = G[o + 1], z = G[o + 2];
      const d = path.nearestXZ(x, z).dist, onDais = z < -126 && z > -175 && Math.abs(x) < 8;
      const w = ((d <= NEAR_R && path.distanceTo(x, y + 0.88, z) < 4.3) || onDais) ? 'near' : d > SPECK_R ? 'speck' : d > FAR_R ? 'far' : 'mid';
      const far = w === 'far' || w === 'speck';
      const region = far ? (z > 10 ? 0 : 1) : (z > 110 ? 0 : z > 10 ? 1 : 2);
      const key = w + ':' + region + ':' + (far ? 0 : G[o + 7]);
      let bkt = buckets.get(key); if (!bkt) { bkt = { w, caustic: !far && G[o + 7] > 0, list: [] }; buckets.set(key, bkt); }
      bkt.list.push(i); info.weights[w] = (info.weights[w] || 0) + 1;
      if (d < 6) clearMin = Math.min(clearMin, path.distanceTo(x, y + 0.88, z));
      if ((i & 511) === 0) await ctx.yield();
    }
    const glassSets = [];
    for (const bkt of buckets.values()) {
      if (bkt.w === 'far' || bkt.w === 'speck') bkt.list.sort((a, b) => G[b * 8 + 2] - G[a * 8 + 2]);     // (south to north: the near side first as we fly, so that the depth test spares the hidden ones their shading)
      const set = kit.makeGlasses(bkt.w, bkt.list.length, { caustic: bkt.caustic });
      for (let j = 0; j < bkt.list.length; j++) {
        const o = bkt.list[j] * 8;
        set.set(j, G[o], G[o + 1], G[o + 2], G[o + 3], G[o + 4], G[o + 5], G[o + 6], (bkt.list[j] * 2.399) % TAU);
        if ((j & 255) === 255) await ctx.yield();
      }
      set.commit(); if (set.caustic) set.caustic.frustumCulled = true;
      scene.add(set.group); glassSets.push(set);
      await ctx.yield();
    }

    // ---------------- flames and their halos
    const Fl = R.flames, nF = Fl.length / 5;
    const flames = kit.makeFlames(nF), halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, nF);
    const fh = look.stub > 0 ? 0.84 : 1;
    for (let i = 0; i < nF; i++) {
      const o = i * 5; flames.set(i, Fl[o], Fl[o + 1], Fl[o + 2], Fl[o + 3] * fh, Fl[o + 4]);
      const isle = Fl[o + 2] < -126 && Fl[o + 2] > -172 && Math.abs(Fl[o]) < 8 ? 1.6 : 1;         // the dais ranks blaze
      m4.compose(p3.set(Fl[o], Fl[o + 1] + Fl[o + 3] * 0.42, Fl[o + 2]), q4.identity(), s3.setScalar(Fl[o + 3] * 1.5 * isle)); halos.setMatrixAt(i, m4);
      if (Fl[o + 1] < 9 && path.distanceTo(Fl[o], Fl[o + 1] + Fl[o + 3], Fl[o + 2]) < 2.0) console.warn('to-the-brim: a flame stands within 2 m of the flown line', Fl[o], Fl[o + 1], Fl[o + 2]);
      if ((i & 511) === 511) await ctx.yield();
    }
    s3.set(1, 1, 1);
    flames.commit(); halos.instanceMatrix.needsUpdate = true; halos.frustumCulled = false; halos.renderOrder = 4;
    scene.add(flames.mesh, halos);
    // the massed candles' flames (each a flame like every other) and one glare to a cluster
    { const B = R.bares, nB = B.length / 5, bf = kit.makeFlames(Math.max(nB, 1));
      for (let i = 0; i < nB; i++) { const o = i * 5; bf.set(i, B[o], B[o + 1], B[o + 2], B[o + 3] * fh, B[o + 4]); if ((i & 511) === 511) await ctx.yield(); }
      bf.commit(); bf.mesh.count = nB; scene.add(bf.mesh);
      const Gl = R.glows, nGl = Gl.length / 4, gm = new THREE.InstancedMesh(halos.geometry, haloMat, Math.max(nGl, 1));
      for (let i = 0; i < nGl; i++) { m4.compose(p3.set(Gl[i * 4], Gl[i * 4 + 1], Gl[i * 4 + 2]), q4.identity(), s3.setScalar(Gl[i * 4 + 3])); gm.setMatrixAt(i, m4); }
      s3.set(1, 1, 1); gm.count = nGl; gm.instanceMatrix.needsUpdate = true; gm.frustumCulled = false; gm.renderOrder = 4; scene.add(gm); info.bares = nB; }
    if (clearMin < 2.0) console.warn('to-the-brim: a glass stands within 2 m of the flown line', clearMin);
    info.glasses = nG; info.clear.glass = clearMin; info.look = lookName; info.rare = !!rare; info.clear['a silver piece on a table'] = silverLeast; Object.assign(info.clear, clearNew);
    { const tc = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;                 // (triangles a glass, by weight)
      info.glassTris = {}; for (const w of ['near', 'mid', 'far', 'speck']) info.glassTris[w] = tc(kit.geometry[w].shell) + tc(kit.geometry[w].wine); }
    await ctx.yield();

    // ---------------- chandeliers: 28 hoops of 24 candles (25 over the nave's tables, 3 down the choir) in two swaying sets
    // (each set: the near weight where the crown or the chain stands within 8 m of the flown line, the fine weight where the
    // hoop's centre is within 11 m of it, the plain one elsewhere, and the one under the canopy; CLEAR AIR, 3 m of it, is counted at every candle, 0.6 m over the hoop's foot, at the hoop's outer
    // rim, and for every chandelier within 16 m of the line in plan at its rods, crown and chain)
    const chGeo = chandelierGeometry(burn), chGeoF = chandelierGeometry(burn, 26, true), chGeoN = chandelierGeometry(burn, 26, true, true), chGeoC = chandelierGeometry(burn, 2.2, true), chSets = [];
    let chLeast = 1e9, chRim = 1e9, chRod = 1e9, chChain = 1e9; info.chandeliersFine = 0; info.chandeliersNear = 0;
    for (let par = 0; par < 2; par++) {
      const group = new THREE.Group(), spots = [];
      for (let j = par; j < 5; j += 2) for (let t = 0; t < 5; t++) spots.push(TABLE_X[t], 14.0, CH_Z[j]);
      for (let j = par; j < 3; j += 2) spots.push(0, j === 2 ? 20.5 : 17.0, -92 - 63 * j);  // three more down the choir axis (the one before the north door 3.5 m higher: its hoop over the pelmet's head as the dais and the way out see it)
      const n = spots.length / 3, mesh = new THREE.InstancedMesh(chGeo, hallMat, n), meshF = new THREE.InstancedMesh(chGeoF, hallMat, n), meshN = new THREE.InstancedMesh(chGeoN, hallMat, n);
      const under = new THREE.InstancedMesh(chGeoC, hallMat, 1); let mi = 0, fi = 0, ui = 0, ni = 0;      // the choir's middle chandelier hangs from the tester's underside (y 26)
      const cf = kit.makeFlames(n * 24), ch = new THREE.InstancedMesh(halos.geometry, haloMat, n * 24);
      for (let i = 0; i < n; i++) {
        const x = spots[i * 3], y = spots[i * 3 + 1], z = spots[i * 3 + 2];
        m4.compose(p3.set(x, y, z), q4.setFromAxisAngle(yAxis, i * 0.7), s3);
        let hung = 1e9; for (let h = 5.6; h < 32.9; h += 0.75) hung = Math.min(hung, path.distanceTo(x, y + h, z));   // the line's least distance from the crown and the chain's axis
        if (x === 0 && z === -155) { under.setColorAt(ui, WHITE); under.setMatrixAt(ui++, m4); }
        else if (hung < 8) { meshN.setColorAt(ni, WHITE); meshN.setMatrixAt(ni++, m4); }
        else if (path.distanceTo(x, y, z) < 11) { meshF.setColorAt(fi, WHITE); meshF.setMatrixAt(fi++, m4); } else { mesh.setColorAt(mi, WHITE); mesh.setMatrixAt(mi++, m4); }
        for (let c = 0; c < 24; c++) {
          const a = (c / 24) * TAU - i * 0.7, fx = x + Math.cos(a) * CH_R, fz = z + Math.sin(a) * CH_R, k = i * 24 + c;
          cf.set(k, fx, y + 0.48 + 0.6 * burn, fz, 0.38 * fh, 0.14);
          chLeast = Math.min(chLeast, path.distanceTo(fx, y + 0.6, fz)); chRim = Math.min(chRim, path.distanceTo(x + Math.cos(a) * 4.145, y + 0.2, z + Math.sin(a) * 4.145));
          m4.compose(p3.set(fx, y + 0.64 + 0.6 * burn, fz), q4.identity(), s3.setScalar(0.55)); ch.setMatrixAt(k, m4); s3.set(1, 1, 1);
        }
        // (its rods, as the cone they stand on: 24 bearings, at the hoop, at a third and two thirds of the lower rod, at the upper
        // ring and at the middle of the upper rod; its crown; its chain every 0.75 m up to the roof)
        if (path.nearestXZ(x, z).dist < 16) {
          for (let c = 0; c < 24; c++) { const a = c * TAU / 24; for (const [r, h] of [[3.95, 0.3], [3.33, 1.07], [2.72, 1.83], [2.1, 2.6], [1.2, 4.25]]) chRod = Math.min(chRod, path.distanceTo(x + Math.cos(a) * r, y + h, z + Math.sin(a) * r)); }
          for (let h = 5.6; h < 32.9; h += 0.75) chChain = Math.min(chChain, path.distanceTo(x, y + h, z) - (h < 6.9 ? 0.52 : 0.12)); }
      }
      info.chandeliersFine += fi + ui; info.chandeliersNear += ni;
      for (const [m, c] of [[mesh, mi], [meshF, fi], [meshN, ni]]) { m.count = c; m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.frustumCulled = false; if (c) group.add(m); else m.dispose(); }
      if (ui) { under.instanceMatrix.needsUpdate = true; under.frustumCulled = false; group.add(under); } else under.dispose();
      cf.commit(); ch.instanceMatrix.needsUpdate = true; ch.frustumCulled = false; ch.renderOrder = 4;
      group.add(cf.mesh, ch); scene.add(group); chSets.push(group);
      await ctx.yield();
    }
    info.clear['a chandelier, at its candles'] = chLeast; info.clear['a chandelier, at its hoop\'s outer rim'] = chRim;
    info.clear['a chandelier, at its rods'] = chRod; info.clear['a chandelier, at its crown and chain'] = chChain;
    if (Math.min(chLeast, chRim, chRod, chChain) < 3.0) console.warn('to-the-brim: a chandelier hangs within 3 m of the flown line', chLeast, chRim, chRod, chChain);

    // CLEAR AIR: the bodies of the crossing, the choir and the doorway, each class counted against the flown line
    for (const [name, least, pts] of newBodies()) {
      let m = 1e9; for (const q of pts) m = Math.min(m, path.distanceTo(q[0], q[1], q[2]));
      if (m < least) console.warn('to-the-brim: ' + name + ' comes within ' + least + ' m of the flown line', m);
      info.clear[name] = m; if (pts.length > 40) await ctx.yield();
    }
    await ctx.yield();

    // ---------------- the great glass that fills
    const hero = await buildHero(ctx, { palette: PALETTE, wine, look: lookName, routeLength: LEN, kit, light: false });
    hero.object.position.set(0, 3.0, -179);                                // THE GREAT GLASS: on the axis at the dais's north end, its plinth on the dais floor
    scene.add(hero.object);
    hero.setLight(1, look.kitFill, look.kitFill ? new THREE.Vector3().fromArray(look.fillDir) : null, look.kitAmt);
    hero.setMetres(0);
    hero.great.uCool.value.setRGB(0.05, 0.085, 0.16);                      // the cold light of the doorway and the choir on the great glass
    // the great glass's six candles carry a halo each like every other flame
    { const fl = hero.anchors.flames, spark = new THREE.InstancedMesh(halos.geometry, haloMat, fl.length), hp = hero.object.position;
      fl.forEach((f, i) => { m4.compose(p3.set(hp.x + f.x, hp.y + f.y + 0.05, hp.z + f.z), q4.identity(), s3.setScalar(1.25)); spark.setMatrixAt(i, m4); }); s3.set(1, 1, 1);
      spark.instanceMatrix.needsUpdate = true; spark.frustumCulled = false; spark.renderOrder = 4; scene.add(spark); }
    // CLEAR AIR: the great glass, its decanter, the crane and yoke, the candle stands and the plinth, each counted against the flown line
    { const hp = hero.object.position;
      for (const [name, least, pts] of hero.bodies) { let m = 1e9; for (const q of pts) m = Math.min(m, path.distanceTo(hp.x + q[0], hp.y + q[1], hp.z + q[2]) - q[3]);
        if (m < least) console.warn('to-the-brim: ' + name + ' comes within ' + least + ' m of the flown line', m);
        info.clear[name] = m; await ctx.yield(); }
      info.hero = hero.info; }
    await ctx.yield();
    // the breath's streaks (rare visits only; always drawn: with no breath their strength is nought and every card is
    // collapsed). CLEAR AIR: the shader draws no streak whose middle is within 3.5 m of the sixty-place chords of the flown
    // line; here the line itself, every 0.25 m, is measured against those chords (dev), so the nearest a streak's end can
    // come to it is 3.5 - 0.5 - dev
    const gustLine = []; for (let i = 0; i < 60; i++) gustLine.push(path0.posAtDist(LEN * i / 59, new THREE.Vector3()));
    { let dev = 0; const a = new THREE.Vector3(), q = new THREE.Vector3(), l3 = new THREE.Line3();
      for (let i = 0; i <= FN; i++) { a.set(FL[i * 3], FL[i * 3 + 1], FL[i * 3 + 2]); const s = Math.min(Math.floor(i * 59 / FN), 58); let d = 1e9;
        for (let j = Math.max(s - 1, 0); j <= Math.min(s + 1, 58); j++) { l3.set(gustLine[j], gustLine[j + 1]).closestPointToPoint(a, true, q); d = Math.min(d, q.distanceTo(a)); }
        dev = Math.max(dev, d); }
      info.clear['a dust streak of the breath (by its rule of place)'] = 3.5 - 0.5 - dev;
      if (3.5 - 0.5 - dev < 2.2) console.warn('to-the-brim: a dust streak of the breath could come within 2.2 m of the flown line', 3.5 - 0.5 - dev); }
    await ctx.yield();
    let gustMesh = null; const gustS = { value: 0 };                     // (gustS: how much of the dust streaks is shown)
    if (rare) {
      KU.uGustTail.value = 120;                                             // the flames stay laid over for a long breath behind the front
      const n = Math.round(560 * Math.max(detail, 0.7)), gr2 = rng.fork('gust'), aS = new Float32Array(n * 4), aK = new Float32Array(n);
      for (let i = 0; i < n; i++) { aS.set([gr2.range(-33, 33), gr2.range(3.6, 14), gr2.range(-52, 8), gr2.range(0.35, 0.95)], i * 4); aK[i] = gr2(); }
      const g = new THREE.InstancedBufferGeometry(); const pl = new THREE.PlaneGeometry(1, 1);
      g.setIndex(pl.index); g.setAttribute('position', pl.attributes.position); g.setAttribute('uv', pl.attributes.uv);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(aK, 1)); g.instanceCount = n;
      gustMesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...addU, uLine: { value: gustLine }, uGustS: gustS }, vertexShader: GUST_VS, fragmentShader: GUST_FS, ...additive, side: THREE.DoubleSide }));
      gustMesh.frustumCulled = false; gustMesh.renderOrder = 6; scene.add(gustMesh);
    }
    await ctx.yield();
    // THE PETALS (PETAL_VS), by rules of place: 900 columns of air, the same on every setting, dealt over four fields:
    // 384 over the crossing (x -33 to 33, z 9 to -71; they fall from y 44.5), 192 under the canopy over the dais (x -16
    // to 16, z -129 to -187; from y 25.4; none within 5.6 m in plan of the place 2.4 m west of the great glass's axis,
    // so that no petal falls through the glass, the thread or the decanter), 156 over the rest of the choir and 168
    // over the nave (x -32 to 32; from just under the roof's boards,
    // y 29 at the walls to y 42 at the ridge), so that they fall thickest over the crossing and the dais and thin over
    // the nave. CLEAR AIR: a column stands only where the flown line, sampled every 0.25 m, lies 2.3 m or more beyond
    // its sway's whole reach and the petal's own corner in plan, at every height; and no column of the choir stands within 1.5 m of the canopy's edge.
    // NO COLUMN stands where a chandelier's hoop hangs in plan (4.4 m about each of the twenty-eight, the hoop's rim and
    // its sway, and the column's own reach), nor within 9.4 m of the pyramid's axis (the corona's hoop of candles, its
    // spokes and chains, and the epergne), nor over the dais's edge, its balustrade and its steps (between 19.2 m and
    // 23 m from the axis, and between z -117 and -120, -196 and -199). ITS FLOOR, by place: 0.12 m over a rank's top
    // (y 6) on the dais, over the dais's floor (y 3), over a long table's top (y 3) in the nave or along the choir's
    // walls, over the highest tier of the pyramid that its sway reaches, over the hall's floor elsewhere: where its
    // sway reaches past a table's or a tier's edge it ends in the air beside it. (A petal still falls through what
    // stands on a table, a round table, a tree's head and a dresser: it goes out over the last 3 hundredths of its fall.)
    { const pr = rx.fork('petals'), N = 900, aS = new Float32Array(N * 16), aK = new Float32Array(N * 16), aF = new Float32Array(N * 4), hoops = [0, -92, 0, -155, 0, -218], pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), idx = [], line = [];
      { const v = new THREE.Vector3(); for (let d = 0; d <= LEN; d += 0.25) { path0.posAtDist(d, v); line.push(v.x, v.z); } }
      const plan = (x, z) => { let m = 1e9; for (let i = 0; i < line.length; i += 2) { const dx = line[i] - x, dz = line[i + 1] - z, d2 = dx * dx + dz * dz; if (d2 < m) m = d2; } return Math.sqrt(m); };
      for (const zc of CH_Z) for (const xc of TABLE_X) hoops.push(xc, zc);
      const inHoop = (x, z, r) => { for (let i = 0; i < hoops.length; i += 2) if (Math.hypot(x - hoops[i], z - hoops[i + 1]) < 4.4 + r) return true; return false; };
      const fields = [[384, 33, 9, -71, 0], [192, 16, -129, -187, 1], [156, 32, -73, -245, 2], [168, 32, 238, 11, 2]]; let n = 0, least = 1e9, tries = 0;
      for (const [count, X, za, zb, kind] of fields) for (let k = 0; k < count && tries < 20000; tries++) {
        const x = pr.range(-X, X), z = pr.range(zb, za), w = pr.range(0.2, 0.45), reach = w * 1.4143, size = pr.range(0.13, 0.2), tint = pr.range(0, 1) * pr.range(0, 1), speed = pr.range(1.0, 1.6), phase = pr.range(0, 1);
        if (kind === 2 && Math.abs(x) < 18.5 + reach && z < -126.5 + reach && z > -189.5 - reach) continue;
        if (kind === 1 && Math.hypot(x + 2.4, z + 179) < 5.6 + reach) continue;
        const d = plan(x, z) - reach - size * 1.4143; if (d < 2.3) continue;
        const own = reach + size * 1.4143, rp = Math.hypot(x - PYR.x, z - PYR.z);
        if (inHoop(x, z, own) || rp < 9.4 + own) continue;
        const ax = Math.abs(x), onDais = ax < 19.2 - own && z < -120 - own && z > -196 + own;
        if (!onDais && ax < 23 + own && z < -117 + own && z > -199 - own) continue;
        const onRank = onDais && Math.abs(ax - 5) < 1.5 + own && z < RANK_Z0 + 2.2 + own && z > RANK_Z0 - 3.2 * (RANK_N - 1) - 2.2 - own;
        const top = kind === 0 ? 44.5 : kind === 1 ? 25.4 : 29 + 13 * (1 - Math.abs(x) / 34);
        const onTable = (Math.abs(x - 11 * clamp(Math.round(x / 11), -2, 2)) < 2.4 + own && z > 20 - own && z < 200 + own) || (Math.abs(ax - 26.5) < 2.4 + own && z > -232 - own && z < -80 + own);       // (the nave's long tables and the choir's side tables: tops at y 3)
        const floor = 0.12 + (onRank ? 6.0 : onDais || onTable ? 3.0 : rp - own < tierR(0) ? tierTop(clamp(Math.floor((tierR(0) - (rp - own)) / 1.9), 0, PYR.tiers - 1)) : 0);
        for (let c = 0; c < 4; c++) { aF[n * 4 + c] = floor; aS.set([x, top, z, w], n * 16 + c * 4); aK.set([(top - floor) / speed, phase, size, tint], n * 16 + c * 4); pos.set([x, top * 0.5, z], n * 12 + c * 3); uv.set([c === 1 || c === 2 ? 1 : 0, c > 1 ? 1 : 0], n * 8 + c * 2); }
        idx.push(n * 4, n * 4 + 1, n * 4 + 2, n * 4, n * 4 + 2, n * 4 + 3); least = Math.min(least, d); n++; k++; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 4)); g.setAttribute('aF', new THREE.BufferAttribute(aF, 1)); g.setIndex(idx);
      const petals = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: KU.uTime, uPix: KU.uPix, uFlameCol: KU.uFlameCol, uTabI: HU.uTabI, uChI: HU.uChI, uPyI: HU.uPyI, uGain: HU.uGain, uChoir: HU.uChoir },
        vertexShader: PETAL_VS, fragmentShader: PETAL_FS, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide }));
      petals.frustumCulled = false; petals.renderOrder = 5; scene.add(petals);
      if (n < N || least < 2.3) console.warn('to-the-brim: the petals: fewer columns than dealt for, or one within 2.3 m of the flown line', n, least);
      info.clear['a falling petal (its column, less its sway\'s whole reach and its own corner, in plan)'] = least; info.petals = n; }
    await ctx.yield();

    // ---------------- the night outside
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 14), new THREE.ShaderMaterial({ uniforms: { ...SKYU, uTime: KU.uTime }, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthWrite: false }));
    dome.frustumCulled = false; dome.renderOrder = -1; scene.add(dome);
    await ctx.yield();

    // ---------------- smoke threads over some flames, dust in the light over the tables (fixed boxes)
    // CLEAR AIR by place: no ribbon comes within 2.3 m of the flown line, standing or laid over by the breath, in any look.
    // Each is tried at its height and at 0.75, 0.55 and 0.4 of it, and left out if none clears (its reach: the ribbon's
    // own half-width, 0.08 + 0.63 t t at t of its height, and its sway, 0.064 t t of its height, about its middle line as
    // SMOKE_VS bends it). The surface it sweeps is measured at 17 strengths of the breath and 16 heights (places under
    // 0.6 m apart on it: within 0.07 m of its true least), so a ribbon is kept only if every place clears 2.37 m
    { const sm0 = R.smoke, sm = []; let least = 1e9;
      const reach = (x, y, z, h) => { let m = 1e9;
        for (let g = 0; g <= 16; g++) { const gu = 1.3 * (g / 16) * 1.7;
          for (let i = 1; i <= 16; i++) { const t = i / 16, d = gu * t * h;
            m = Math.min(m, path.distanceTo(x + 1.06 * 0.309 * d, y + t * h - 0.5 * t * d, z + 1.06 * 0.951 * d) - (0.08 + 0.63 * t * t) - 0.064 * t * t * h); } }
        return m; };
      for (let i = 0; i < sm0.length; i += 4) { const x = sm0[i], y = sm0[i + 1], z = sm0[i + 2];
        if (path0.distanceTo(x, y, z) > 14) { sm.push(x, y, z, sm0[i + 3]); continue; }
        for (const k of [1, 0.75, 0.55, 0.4]) { const h = sm0[i + 3] * k, m = reach(x, y, z, h); if (m >= 2.37) { sm.push(x, y, z, h); least = Math.min(least, m - 0.07); break; } }
        await ctx.yield(); }
      if (least < 2.3) console.warn('to-the-brim: a smoke ribbon comes within 2.3 m of the flown line', least);
      info.clear['a smoke ribbon'] = least;
      const n = Math.max(1, Math.floor(sm.length / 4 * (detail < 0.7 ? 0.5 : 1)));
      const g = new THREE.PlaneGeometry(1, 1, 1, 6); g.translate(0, 0.5, 0);
      const smoke = new THREE.InstancedMesh(g, smokeMat, n);
      for (let i = 0; i < n; i++) { m4.compose(p3.set(sm[i * 4], sm[i * 4 + 1], sm[i * 4 + 2]), q4.identity(), s3.set(1, sm[i * 4 + 3], 1)); smoke.setMatrixAt(i, m4); }
      s3.set(1, 1, 1); smoke.instanceMatrix.needsUpdate = true; smoke.frustumCulled = false; smoke.renderOrder = 6; scene.add(smoke); }
    await ctx.yield();
    const dustBoxes = [[[0, 8.5, 110], [58, 11, 200], 950], [[16, 12, -34], [46, 16, 100], 850], [[0, 8.5, -160], [40, 10, 96], 900], [[0, 9, -224], [30, 15, 44], 500], [[0, 9.5, -179], [15, 9, 15], 420], [[14, 11, -30], [40, 16, 58], 1100]];
    const dust = [];
    for (const [center, bx, count] of dustBoxes) {
      const d = fx.makeParticles({ rng: rng.fork('dust' + count), preset: 'dust', follow: false, center, box: bx, count: Math.round(count * detail * density),
        size: count === 420 ? [0.028, 0.06] : [0.045, 0.1], colors: ['#ffd9a0', '#e8a23a', '#fff0d0'], intensity: 0.95, velocity: [0.05, 0.03, 0.12], turbulence: [0.5, 0.25, 0.25] });
      scene.add(d.object); dust.push(d);
      await ctx.yield();
    }

    // ---------------- the flight
    const AVG = LEN / 50, bs = new THREE.Vector2();
    // (the opening has no pull: the eye looks where the line flies, low across the tables under the rings of flame)
    const pyrPoi = new THREE.Vector3(0, 12, -30), bowlPoi = hero.anchors.bowl.clone().add(hero.object.position), gazeAt = new THREE.Vector3(), glassPoi = hero.anchors.rim.clone().add(hero.object.position);
    // one gaze for the middle of the flight: the pyramid's waist on the slant and the pass, sliding to the great glass's bowl on the turn
    const gaze = (time, u) => gazeAt.lerpVectors(pyrPoi, bowlPoi, smoothstep(262, 318, u * LEN));
    // the great glass's rim draws the gaze from 330 m. The aim stays on the rim; the pull itself is let go as we come
    // abreast (408.2 m): whole until 404 m, nothing by 422 m (the poi's fade: 18 m of its 92), so the glass leaves by
    // the left edge and the gaze is on the doorway again within 12 m after abreast
    const sat = (x) => clamp(x, 0, 1);
    return {
      scene, path: path0, duration: 50, title: look.title, info,                  // info: the counts build() made (glasses, weights, least clear air by class)
      pace: (u) => SPEED(u * LEN) / AVG,
      camera: { fov: 50, near: 0.3, far: 1400, lookAhead: 22, sway: 0.35, bank: 0.3 },
      pois: [{ at: gaze, from: 140 / LEN, to: 372 / LEN, weight: 0.6, fade: 0.2 }, { at: glassPoi, from: 330 / LEN, to: 422 / LEN, weight: 0.6, fade: 18 / 92 }],
      portal: { shape: 'circle', radius: 5.5, color: '#8fc4ff', glow: 1.4, revealDistance: 240, blendDistance: 40 },   // a clear luminous moon blue with a strong bright rim: a glowing doorway, the hall's one cold light on its axis
      post: { exposure: look.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.1, contrast: 1.0, tint: look.tint, shadowTint: look.shadow, vignette: 0.34, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update(dt, time, camera, u = 0) {
        const m = u * LEN;                                                    // THE FILL reads the metres flown and nothing else
        hero.setMetres(m);
        hero.update(dt, time, camera);                                        // also sets the shared clock (uTime)
        // THE RARE BREATH, keyed to the metres flown: its front leaves the north doorway at 150 m, is through the choir
        // and at the pyramid by 156 m, reaches the tables' north ends at 161 m, passes the eye at 164 m (so that the low
        // flames under the eye lie over as plainly as the far ones for the rest of the tables), drifts on south and
        // reaches the south wall by 214 m; the rings on every wine surface surge behind it. Nothing goes dark.
        if (rare) {
          const zf = m < 156 ? lerp(-262, -40, sat((m - 150) / 6)) : m < 164 ? lerp(-40, 58, (m - 156) / 8) : m < 200 ? lerp(58, 130, (m - 164) / 36) : lerp(130, 320, sat((m - 200) / 14));
          // (its strength rises from 143 to 150 m and falls from 204 to 214 m: 0.6 s and more each way. What a flame feels
          // of the front is gustD's law of uGustM, the metres flown: no flame's dip or lean comes or goes in under 0.5 s,
          // however fast the front itself travels; uGustZ, the front's place, carries the dust streaks alone, and they
          // are shown only while it travels slowly: gustS)
          const amp = 1.3 * smoothstep(143, 150, m) * (1 - smoothstep(204, 214, m));
          KU.uGustZ.value = zf; KU.uGustM.value = m; KU.uGustAmp.value = amp; gustS.value = amp * smoothstep(164, 168, m) * (1 - smoothstep(195, 200, m));
          KU.uSurge.value = smoothstep(158, 172, m) * (1 - smoothstep(192, 215, m));
        }
        const sx = 0.2 * Math.sin(time * 0.52), sz = 0.14 * Math.sin(time * 0.37 + 1.0);
        const sx2 = 0.2 * Math.sin(time * 0.47 + 2.1), sz2 = 0.14 * Math.sin(time * 0.41 + 0.4);
        chSets[0].position.set(sx, 0, sz); chSets[1].position.set(sx2, 0, sz2);
        HU.uChSway.value.set(sx, 0, sz); HU.uChSway2.value.set(sx2, 0, sz2);              // (each set's pools sway with it)
        ctx.renderer.getDrawingBufferSize(bs);
        KU.uPix.value = 2 * Math.tan((camera.fov || 50) * PI / 360) / Math.max(bs.y, 1);     // one pixel's angle: what reads it: a glass's highlights and its stem, the caustic, the pouring thread, the halos, the petals, the dust streaks, metal's highlight and the dais's garlands; the hall's painted patterns and the trees' leaf cards are filtered by each pixel's own footprint on its surface
        for (let i = 0; i < dust.length; i++) dust[i].update(dt, time, camera);
      },
      dispose() { scene.traverse((o) => { if (o.isInstancedMesh) o.dispose(); }); hero.dispose(); chairGeo.dispose(); chairGeoNear.dispose(); chairGeoFar.dispose(); for (const g of stickGeos) g.dispose(); chGeo.dispose(); chGeoF.dispose(); chGeoN.dispose(); chGeoC.dispose(); },
    };
  },
};
