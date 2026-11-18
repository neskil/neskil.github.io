// MEGA MENDUNG (batik-monsoon). A monsoon front arrives over a tropical sea as living wax-resist batik. Nothing is
// lit and nothing is naturalistic: every surface is a flat dye fill with cream resist lines, crackle veins and weave,
// shaded by this file's own ShaderMaterials on top of the style chunk exported by the hero (src/parts/batik-monsoon.js:
// BATIK_GLSL, BATIK_FADE_GLSL, hero.uniforms). The world returns style: 'none'.
//
// THE THREE COLOURS THAT RUN THE WHOLE FLIGHT (beside indigo and cream): soga brown (the sea, in every colourway),
// madder (the sails' stripe, the offerings' petals, the frigatebirds' pouches: the lead birds are in the flight from the
// first frame to the funnel) and the gold wax line (the lozenge zigzag on the sea, two lines on each sail, and in the hero the outer lip
// of every curl, the first lip of each staircase plate and every lip of the great curl).
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the four colourways (day / golden / night / dawn) with their soga sea ground, grade and portal
//                       colour, and pickMood() (ctx.vary.hour, else the first ctx.rng draw).
//   2. GLSL             FOG_V (fog varying), the SEA shaders (bands in pattern space, sawtooth swells; from low down the
//                       swell is rounded and eased flat where the lens looks along the bands: search "NO SEAM"; the
//                       bands are one cream stripe with soga dots, soga flanks with cream dots and ONE gold wax zigzag
//                       in the trough, drawn in row coordinates that are continuous across the row and easing to a
//                       straight gold thread toward the horizon (search "THE TROUGH ROW": the old row took its phase
//                       from floor(q), which changes on the row's own centre line: that was the sea seam); small dark
//                       diamonds nest in its teeth and the parang S-blades are drawn only when the camera is well
//                       above the motif's own size: search "GRAZING FADE". Every band edge is one pixel wide at any angle: the stripe is
//                       box-filtered over the pixel's own span of the band coordinate and so settles to the mean of
//                       the two flat tones at the horizon by itself: search "CRISP BANDS"; overdye wash in three
//                       stages in near-black brown, dot foam, hull rings and slicks, offering rings), BOAT, BIRD, SHEET
//                       (udan-liris rain sheets: the canyon's are short strokes, never over 3 px wide; the rule that thins rain over the great curl's approach is written here and in DASH), DASH.
//   3. makeBuf          a small flat-shaded triangle builder (position, aDat = id,u,v,edge, aAni) with tube and loft.
//   4. jukungGeometry / offeringGeometry / birdGeometry / seaGeometry.
//   5. build(ctx)       a) mood and seeded weather (band width, swell, rain density, sail motif)   search "SEEDED"
//                       b) the hero at the origin; PATH = hero.anchors.flyThrough                 search "PATH"
//                       c) sea and its floor, boats, offerings, birds (loopShape, coneFrame, prep, birdAt, flockAt, hornHold, placeBirds), rain sheets, loose dashes, sparks, lamps
//                       d) POIS, PORTAL, POST (exposure, fog, bloom, grade)                       search "POST"
//                       e) update(): everything scripted is keyed to u, ambient loops to time.
//
// SCRIPTED MOMENTS AND THE UNIFORMS THAT DRIVE THEM
//   hero.setProgress(u)        the arrival at the lip (u 0.335-0.383 + 5 s), five sky curls, the stain on the dome,
//                              the hero bolt at u 0.69 and (rare) kain prada: hero.uniforms.uU / uFlash / uPrada
//   boats (A, B, C)            three jukung lying HOVE-TO, bows to the front, cream sails with a madder stripe. Their
//                              places are a rule of the route (search "A RULE OF THE ROUTE"): the design's own beats,
//                              52, 72 and 131 m along the route from the entry (A lies 20 m beyond the birds' wheel),
//                              alternately to port and starboard, 7.5, 9 and 9.5 m off the route. They hold their
//                              place, yaw, rock and pitch on the swell (placeBoat, on time); sea.uBoat[4] carries the
//                              hulls so the sea draws a breathing ring of dots round each and the slick of dots it
//                              leaves down-swell. No fleet, nothing under way. Between them six floating offerings
//                              (offeringGeometry, sea.uOff[6]: each in two rings of dots) ride the swell, one in each
//                              sixth of the route's 40-230 m, 3-7 m off it, drawn from the 'canang' stream.
//                              NOTE the three stations are the design's shares of the route (0.04, 0.055, 0.10 of 1,310 m), so the look-up beat that rises round boat C (loopShape: from 5 m short of her to 30 m past) now falls 45 m earlier on the route (0.034 of it).
//                              NOTE the third and fourth offerings (2 and 3 of 0-5) lie to starboard on every seed (the fourth because boat C lies to port within 14 m of it).
//                              NOTE the sails' lifts (sailClear: each bird lifting over the sail it passes) moved with the stations.
//   overdye band               sea.uShelf / boat.uShelf (world z where the wash's first veins reach), wicks south with u
//                              from z 70 to 115: a band about 60 m deep of cells in three stages (veined, half-washed,
//                              near-black brown) that lies ahead under the staircase's tip at u 0.14-0.22
//   lead frigatebirds          seven instances, CPU matrices (placeBirds). THEY FLY THE ROUTE, NOT THE FRAME (search
//                              "THE LEAD GROUP"): the flock has a station on the route that leads the lens by metres
//                              flown (the one declared pacing of this world); every formation is a shape round that
//                              station in the frame of the path there or of the world, and each bird's attitude comes
//                              from its own motion (heading where it flies, banking by its own turn). Nothing reads
//                              the gaze or the lens. To the lip they fly ONE LOOP that turns on world time, evenly
//                              spaced by arc length, its near side riding higher than its far side: a kettle wheeling
//                              in the air that carries it. The loop's shape is the formation (loopShape): a wheel
//                              stationed 32 m from the entry between the two near sails, which breaks as the lens
//                              comes on (from 30 m short of it); a kettle travelling 23 m ahead up the row of sails,
//                              each bird lifting over the sail it passes (sailClear); opened wider and higher from
//                              boat C abeam for the first look up; 18 m across, 13 m ahead and 4.5 m over the route
//                              on the climb, tipping, its near birds peeling toward each curl of the arrival while it
//                              is drawn; banking away right from 180 m short of the lip. From 95 to 45 m short of
//                              the lip the loop OPENS into an arch round the route's own heading (in the plane
//                              across the route's tangent at the station, 22 m beyond it; 14.0 m in radius: two
//                              wingspans from each bird to the next), which keeps turning on world time at the
//                              loop's own rate; at the mouth the arch closes into a wheel round the funnel's axis
//                              (the line from the station to the portal's seat), tipped toward us at its top,
//                              evenly spaced again, held inside the lips (hornHold); over the last 62 m it opens
//                              and the lens flies through it. THE LIP'S LIFT is a field of the place: rising air
//                              from 60 m short of the lip's line to 40 m past it, which noses down each bird that
//                              is in it. While the hero bolt's channel is hot and cooling, in seconds of the
//                              bolt's age (2.83 s from its first stroke; the rule comes on over the second before
//                              and lets go over the second after), no bird flies within 12 m of it. The cooled
//                              trace stays in the air after that (soga; gilded on a rare visit, kain prada): the
//                              rule has let go of it and birds may cross it.
//                              Attitude: each bird heads where it flies through the air that carries the flock
//                              and banks by its own turn.
//   gaze                       four pulls, each alone on its point and each under 1 (search "POIS"): flockAt (the
//                              loop's own centre up the face; over the lip a point 22 m from the station toward
//                              the great curl's mouth; then the ring's centre) from the wheel to 40 m past the
//                              great curl's mouth; the arrival curls while they are drawn; the crown of the
//                              whorl's rim from where the loop opens to the bolt;
//                              and one point carried along the route ahead of the lens by the great curl's own
//                              length, which runs round the arc ahead of us and comes to rest on the portal's seat.
//                              Turn of the lens with the engine's own easing, 30 samples a second over the whole
//                              flight on two seeds: sweeping at most 11.4 deg/s, steady at most 6.8.
//   rain                       three sheets ACROSS the route at u 0.605, 0.633, 0.661 (static quads 104 m square, under
//                              half of each period drawn, cut into short cream strokes never over 3 px wide) and
//                              dash.uRain for the loose dashes round the lens (0.9-1.35 m long): a window on u,
//                              rising over 0.57-0.6 and falling over 0.655-0.69. THE RAIN THINS OVER THE GREAT
//                              CURL'S APPROACH: rain is drawn at a quarter strength by its own distance in metres
//                              from the line that runs from the canyon's end to the great curl's mouth (uTubeA,
//                              uTubeB: a tube of the rim's radius round that line; search "THE RAIN THINS"), the
//                              same from every eye. No sheet has a stroke inside that tube, so no sheet is thinned:
//                              only the loose dashes thin there, as they fall.
//   under the sea              'sea-floor': the sea's own shaders on a coarse flat grid 2.4 m under the swell (uAmp 0,
//                              uYOff), so where a trough dips out of a low view (the bottom of the portal disc seen
//                              from the world before) the bands carry on and no bare cloth shows.
// HERO PLACEMENT   hero.object sits at the world origin unrotated, so hero-local == world. Exit portal = portalSeat.
//                  The hero shifts its notch, canyon and great curl along the lip by seed (anchors.shift); the kettles
//                  and the arrival poi follow it. ctx.vary.mood thickens the rain and quickens the tower bolts.
// EXPOSURE / FOG / GRADE   all in the POST block near the end of build(); fog is FogExp2(cloth, 0.00022) and every
//                  shader fades to the cloth with bkFade (depth is dye strength: 14% at 760 m, 43% at 1.5 km).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeGlows } from '../kit/fx.js';
import { buildHero, shiftAt, BATIK_GLSL, BATIK_FADE_GLSL } from '../parts/batik-monsoon.js';

const TAU = Math.PI * 2;
const DUR = 36;                                    // seconds; the brief's clock is u * 36
const NX = Math.SQRT1_2, NZ = Math.SQRT1_2;        // the way the parang bands march (x, z)
const TX = Math.SQRT1_2, TZ = -Math.SQRT1_2;       // the way they run
const MARCH = 6;                                   // m/s

// =====================================================================================================================
// 1. MOODS: one per batik colourway. ground = the sea's dye: soga brown in every colourway (deep soga on the night cloth).
// The values are chosen for what reaches the screen after the 0.86 dye scale, the tone map and the grade (which crush
// blue and green in a dark brown and turned the first values oxblood): day lands near soga #6E4425.
// =====================================================================================================================
const MOODS = {
  day: { title: 'Mega Mendung', ground: '#7A5A48', outline: 0, portal: '#F4E3B0', lamps: 0,
    post: { exposure: 1.0, sat: 1.07, con: 1.05, tint: '#ffffff', shadow: '#05040a', vig: 0.2 } },
  golden: { title: 'Mega Mendung: Bang-Bangan', ground: '#78603E', outline: 0, portal: '#FFE9B8', lamps: 0,
    post: { exposure: 0.98, sat: 0.8, con: 1.04, tint: '#fff6ee', shadow: '#0a0204', vig: 0.24 } },
  night: { title: 'Mega Mendung: Wedelan', ground: '#674B31', outline: 1, portal: '#F4E3B0', lamps: 1,
    post: { exposure: 1.12, sat: 1.1, con: 1.04, tint: '#f2f4ff', shadow: '#02030a', vig: 0.3 } },
  dawn: { title: 'Mega Mendung: Pesisir', ground: '#7A5A48', outline: 0, portal: '#FFF0C8', lamps: 0,
    post: { exposure: 1.0, sat: 1.08, con: 1.04, tint: '#fff1ec', shadow: '#0a0610', vig: 0.2 } },
};
function pickMood(hour, roll) {
  if (MOODS[hour]) return hour;
  return roll < 0.2 ? 'night' : roll < 0.42 ? 'dawn' : roll < 0.62 ? 'golden' : 'day';
}

// =====================================================================================================================
// 2. GLSL
// =====================================================================================================================
const FOG_V = /* glsl */`
#ifdef USE_FOG
varying float vFogDepth;
#endif
`;

const SEA_VERT = /* glsl */`
uniform vec2 uOrigin; uniform float uMarch, uW, uAmp, uFadeR, uYOff; uniform vec3 uCamW;
varying vec3 vPp; varying vec3 vW;
${FOG_V}
void main(){
  vec2 pp = position.xz + uOrigin;                    // pattern space: x along the band, y across it
  float c = pp.y + uMarch;
  vec3 w = vec3(pp.x*${TX.toFixed(6)} + c*${NX.toFixed(6)}, 0., pp.x*(${TZ.toFixed(6)}) + c*${NZ.toFixed(6)});
  // THE SWELL: a rounded crest on the dot-foam row (v = 8/9) with a smooth leading face three cells long. (It was a
  // sawtooth whose two-metre cliff, looked along end-on where the bands run straight away from the lens, cut the
  // pattern like a seam: there is now no slope over about 17 degrees and no crease.)
  float f = fract(pp.y/uW - .2222222);
  // (its short face, which carries the gold zigzag, is one straight ramp: no fold lies under the zigzag)
  float tooth = f < .6666667 ? .5 - .5*cos(f*4.712389) : 3. - 3.*f;
  float k = 1. - smoothstep(uFadeR*.5, uFadeR*.9, distance(w.xz, uCamW.xz));
  // NO SEAM: where the lens looks straight along the bands a swell is seen end-on, in profile, and its face reads as a
  // fold that offsets the stripes. In that narrow wedge (3 to 19 degrees either side of the band line through the
  // camera) the swell is eased flat; the pattern itself has no wrap, tile or snap to show (the grid re-snaps by whole
  // cells of pattern space).
  vec2 sv = w.xz - uCamW.xz;
  k *= smoothstep(.06, .32, abs(sv.x + sv.y)*.7071068/max(length(sv), 1e-3));
  w.y = uAmp*tooth*k + uYOff;      // (uYOff: the flat floor under the sea is this same shader with no swell, 2.4 m down)
  vPp = vec3(pp.x, 0., pp.y); vW = w;
  vec4 mv = viewMatrix*vec4(w, 1.);
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix*mv;
}`;

// The sea is painted in band space so that crackle and motif ride the swells: soga ground, cream bands (interlocked
// parang blades when seen from above), a trough row of dark soga lozenges in gold wax outline, white dot foam on the
// crest, all fwidth-edged and faded to flat tones. Soga and cream in every colourway: no indigo in the sea.
const SEA_FRAG = /* glsl */`
${BATIK_GLSL}
${BATIK_FADE_GLSL}
uniform float uW, uShelf, uOutline, uDotT; uniform vec3 uGround, uCamW; uniform vec4 uBoat[4]; uniform vec3 uOff[6];
varying vec3 vPp; varying vec3 vW;
// the area of a stripe of half-width hw (centred on .5 of every band) to the left of x: its difference over one
// pixel's span of the band coordinate is that pixel's exact share of the stripe (a box filter)
float seaStripe(float x, float hw){ return floor(x)*2.*hw + clamp(fract(x) - (.5 - hw), 0., 2.*hw); }
void main(){
  float px = max(max(length(dFdx(vW.xz)), length(dFdy(vW.xz))), 1e-4);
  float pw = px/uW;
  float q = vPp.z/uW, band = floor(q), v = fract(q), a = vPp.x/uW;
  // THE BAND EDGE: how far the band coordinate itself moves across one pixel (not the pixel's longest footprint, which
  // at a grazing angle is metres long ALONG the line of sight): edges are measured with these two, so a band's edge
  // is one pixel wide on screen at any angle and any distance
  float fq = max(fwidth(vPp.z)/uW, 1e-5), fa = max(fwidth(vPp.x)/uW, 1e-5);
  // crackle, and the overdye that wicks south from under the shelf as a band about 60 m deep in which cells stand in
  // three stages at once: veins run ahead as ink lines (vs), then a cell takes a half-wash from its veins inward
  // (hwash), then the ink wash follows the same way (od). r runs 0 -> 1.6 over 80 m, offset +-20 m by the cell.
  float vd, ch; float vein = bkVeins(vPp, px, 14., vd, ch);
  float r = (uShelf - vW.z)/50. + (ch - .5)*.8;
  float vs = smoothstep(-.5, 0., r)*vein;
  float hwash = smoothstep(vd - .12, vd + .02, r*1.6);
  float od = smoothstep(vd - .12, vd + .02, r - .6);
  float kf = mix(1., .85, od);
  // GRAZING FADE: motif drawn on a plane seen at a low angle smears into long streaks, so the blades, lozenges and
  // filler are kept only where the sea is seen from more than about 10 degrees above it (within 3-6 camera heights);
  // further out the bands calm to their two flat tones, which is all a squashed motif can honestly show
  float sinEl = (uCamW.y - vW.y)/max(distance(uCamW, vW), 1.);
  float graze = smoothstep(.075, .19, sinEl);
  // the S-blades themselves only where the sea is looked down on from well above the motif's own size (the climb and
  // after); from the low opening the sea is drawn as plain bands with round filler, which a low angle cannot smear
  float kb = (1. - smoothstep(.085*kf, .24*kf, pw))*smoothstep(.2, .4, sinEl)*smoothstep(1.2, 2.5, uCamW.y/uW);   // (later than it was: on a tall screen the wider lens saw them half-drawn from 0.7 band widths up)
  // THE TROUGH ROW: ONE gold wax zigzag, a triangle wave about the row's centre line, drawn in row coordinates that
  // are continuous right across the row. (The row straddles the line between two bands; it used to take its phase
  // from floor(q), which changes on that very line, so its two halves were drawn half a period apart: half-lozenges
  // cut flat along the centre, and seen end-on a dark sliver with a zigzag on each side that did not meet. THAT was
  // the sea seam. The row now has its own index, floor(q + .5), which is constant across it.)
  // Its amplitude eases to nothing where a pixel spans too much of the band to hold a tooth (far off, or looking
  // along the bands), so the zigzag runs out to the horizon as one straight gold thread; the line is box-filtered
  // over the pixel like the stripes. The dark soga lozenges are small diamonds nested in the teeth, alternately
  // either side, with their edges parallel to the line; they are drawn only where the sea is looked down on (the climb).
  float rowB = floor(q + .5), nb = q - rowB;
  float ph = a*2. + .5*mod(rowB, 2.);
  float m = fract(ph) - .5, m2 = fract(ph + .5) - .5;
  float zA = .06*(1. - smoothstep(.035, .11, fa))*(1. - smoothstep(.03, .075, fq));
  float zd = abs(nb - zA*(4.*abs(m) - 1.)), zp = fq + 8.*zA*fa + 1e-4;
  float zig = clamp((.016 - zd)/zp + .5, 0., min(1., .032/zp));
  float zpool = clamp((.034 - zd)/zp + .5, 0., 1.)*(1. - smoothstep(.02, .05, zp)) - zig;
  float lzE = (.48*fa + fq)*.6 + .002;
  float lozIn = 1. - smoothstep(.054 - lzE, .054 + lzE, min(abs(m2)*.24 + abs(nb + .034), abs(m)*.24 + abs(nb - .034)));
  float lozGate = smoothstep(.2, .4, sinEl)*smoothstep(1.2, 2.5, uCamW.y/uW)*(1. - smoothstep(.3, .7, lzE/.054))*smoothstep(.045, .059, zA);
  // the blades: slanted S-curved cream knives with a soga spine
  float w = (v - .5)/.36;
  float zone = 1. - smoothstep(1. - pw*3., 1. + pw*3., abs(w));
  float s = a*1.25 - .5*w + .31*band;
  float f = fract(s) - .5, c0 = .17*sin(w*2.3), hw = .3*(1. - .5*w*w);
  float d = abs(f - c0) - hw;
  float e2 = pw*1.6 + .004;
  // metre-scale filler for the widest sea (parang barong, 30 m bands): rows of resist dots 1.2 m apart tracing every
  // blade (four rows on the ground side, one inside), so there is fine work near the lens whatever the band width
  float dm = min(d, min(abs(f - c0 - 1.), abs(f - c0 + 1.)) - hw)*uW*.8, rr = abs(dm);
  float rowI = floor((rr - .4)/1.2), rowF = (fract((rr - .4)/1.2) - .5)*1.2;
  float gz = (fract(vPp.z/1.2 + .5*mod(rowI, 2.)) - .5)*1.2;
  float fil = (1. - smoothstep(.2 - min(px, .2), .2 + px, length(vec2(gz, rowF))))*smoothstep(21., 28., uW)*(1. - smoothstep(.1, .28, px))*graze
    *step(.4, rr)*step(rr, dm > 0. ? 5.8 : 1.7);
  float blade = 1. - smoothstep(-e2, e2, d);
  blade *= mix(1., smoothstep(-.085 - e2, -.085 + e2, d), uOutline);
  float sp = (1. - smoothstep(.024, .024 + e2, abs(f - c0)))*(1. - smoothstep(.45, .7, abs(w)))*(1. - uOutline);
  float eye = 1. - smoothstep(.05, .05 + e2, length(vec2(f - c0 - .11, (w - .62)*.36)));
  float inner = (1. - smoothstep(.011, .011 + e2, abs(d + .085)))*(1. - uOutline);
  float cream = mix(blade*(1. - max(max(sp, eye), inner)), step(0., dm), fil*.9)*zone;
  // THE BANDS AS SEEN FROM LOW DOWN: one cream stripe a quarter of the width with a row of soga dots down its middle,
  // soga flanks each with a row of cream dots, the lozenge row (gold wax zigzag) in the trough, dot foam on the crest:
  // a brown sea with cream drawn on it
  // CRISP BANDS: each cream stripe is box-filtered over the pixel's own span of the band coordinate, so it has a hard
  // one-pixel edge near and far, stays a distinct stripe as it recedes, and settles by itself to the mean of the two
  // flat tones (a fifth cream) where several bands share a pixel at the horizon. Beside each edge the soga is drawn
  // one step darker in a band half a metre wide (dye pooled against the wax), so the stripe reads as drawn, not washed.
  float x0 = v - .5*fq, x1 = v + .5*fq, pw2 = max(.5/uW, .022);
  float bandC = clamp((seaStripe(x1, .125) - seaStripe(x0, .125))/fq, 0., 1.);
  float poolC = clamp((seaStripe(x1, .125 + pw2) - seaStripe(x0, .125 + pw2))/fq - bandC, 0., 1.);
  float tone = bandC*.8;
  float ir = .024*uW, dotK = 1. - smoothstep(.5, 1.6, px/ir);
  float dS = length(vec2((fract(a*6. + .25*band) - .5)*uW/6., (v - .5)*uW));
  float dC = length(vec2((fract(a*6. + .5 + .25*band) - .5)*uW/6., min(abs(v - .27), abs(v - .73))*uW));
  float sogaDot = (1. - smoothstep(ir - min(px, ir), ir + px, dS))*dotK;
  float creamDot = (1. - smoothstep(ir*.8 - min(px, ir*.8), ir*.8 + px, dC))*dotK;
  float flatP = max(tone*(1. - .85*sogaDot), creamDot*.9);
  float creamAmt = mix(flatP, cream, kb);
  float indAmt = lozIn*lozGate;
  // white dot foam streaming along the crest row
  float am = vPp.x*.7 + uDotT*(1. + .3*sin(band*2.1)) + band*.37;
  vec2 dg = vec2((fract(am) - .5)/.7, (v - .885)*uW);
  float keep = step(.28, bkHash3(vec3(floor(am), band, 1.)).x);
  float dr = .016*uW + .1;
  float dots = (1. - smoothstep(dr - px, dr + px, length(dg)))*keep*(1. - smoothstep(.25, .8, px));
  // hulls: a ring of white dots breathing round each boat (they lie hove-to: no wake)
  float foam = 0.;
  for(int i = 0; i < 4; i++){
    vec4 b = uBoat[i]; vec2 dl = vW.xz - b.xy; float cs = cos(b.z), sn = sin(b.z);
    vec2 l = vec2(dl.x*cs - dl.y*sn, dl.x*sn + dl.y*cs);
    float rl = length(l/vec2(3.5, 5.7)), rw = .5 + .5*sin(uTime*.9 + b.z*7.);
    float ring = max(1. - smoothstep(.1, .2, abs(rl - 1.)), (1. - smoothstep(.06, .13, abs(rl - 1.32 - .1*rw)))*(.9 - .5*rw));
    vec2 g = fract(l/.95) - .5;
    float rd = 1. - smoothstep(.27 - px, .27 + px, length(g)*.95);
    // the slick each hove-to hull leaves down-swell: two spreading rows of dots that thin out over 16 m
    float dt = (dl.x + dl.y)*.7071068, ds = (dl.x - dl.y)*.7071068, kt = clamp((dt - 8.)/16., 0., 1.);
    vec2 sg = vec2(abs(ds) - (.7 + .09*(dt - 8.)), (fract(dt/1.5 - uTime*.35) - .5)*1.5);
    float sr = .3*(1. - .75*kt);
    foam = max(foam, (1. - smoothstep(sr - min(px, sr), sr + px, length(sg)))*step(8., dt)*step(dt, 24.)*b.w*.9);
    foam = max(foam, ring*rd*b.w);
  }
  // floating offerings (uOff = x, z, phase): each rides in two breathing rings of small dots
  for(int i = 0; i < 6; i++){
    vec2 dl = vW.xz - uOff[i].xy; float rl = length(dl), rw = .5 + .5*sin(uTime*1.1 + uOff[i].z);
    float ring = max(1. - smoothstep(.16, .3, abs(rl - 1.7)), (1. - smoothstep(.12, .24, abs(rl - 2.7 - .35*rw)))*(.9 - .5*rw));
    vec2 g = fract(dl/.6) - .5;
    foam = max(foam, ring*(1. - smoothstep(.2 - min(px, .2), .2 + px, length(g)*.6)));
  }
  foam *= 1. - smoothstep(.2, .6, px);
  // SOGA AND CREAM, never navy: the overdye over soga is a near-black brown, the cream under it a washed tan, and the
  // trough row is dark soga lozenges outlined in the gold wax line
  creamAmt *= 1. - od*.28; dots *= 1. - .35*od;
  vec3 deep = mix(uOverdye, uGround, .2);
  vec3 ground = mix(mix(uGround, uGround*.72, hwash), deep, od);
  vec3 col = ground*(1. - .16*(1. - smoothstep(0., .07, d))*zone*step(0., d)*kb)*(1. - .42*poolC*(1. - kb));
  col = mix(col, ground*.55, vein*.8);
  col = mix(col, uOverdye, vs*.85*(1. - od));
  col = mix(col, mix(uGround*.36, uOverdye*.7, od), indAmt);
  vec3 cr = mix(mix(uLine, mix(uLine, uGround, .22), hwash), mix(uLine, uGround, .4), od); cr = mix(cr, mix(cr, uGround, .4), vein*.7);
  cr *= mix(vec3(1.), vec3(.94, .78, .56), uOutline);       // on the night cloth the bands are tan, never grey
  col = mix(col, cr, creamAmt);
  col *= 1. - .3*max(zpool, 0.);
  col = mix(col, bkGild(uGold*.85, vW), zig*(1. - .35*od));
  col = mix(col, mix(uLine*1.05, mix(uLine, uGround, .3), .6*od), max(dots, foam));
  col *= bkCloth(vPp, px);
  #ifdef USE_FOG
  col = bkFade(col, vFogDepth);
  col = mix(col, uCloth, smoothstep(3300., 4600., vFogDepth));
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// Boats: flat fills by part id (aDat.x): 0 hull, 1 cream reserve with dot filler, 2 sail, 3 wood, 4 pennant, 5 hat,
// 6 lamp, 7 gold. aDat.yz = pattern coordinates, aDat.w = metres to the sail's edge. aAni = (sail pump weight, pennant weight).
const BOAT_VERT = /* glsl */`
attribute vec4 aDat; attribute vec2 aAni; attribute vec2 aBoat;
uniform float uTime;
varying vec4 vC; varying vec3 vP; varying vec3 vW;
${FOG_V}
void main(){
  vec3 p = position; float ph = aBoat.x;
  vP = p + vec3(ph*37., ph*11., ph*23.);
  p.z += aAni.x*(.22*sin(uTime*1.7 + ph) + .09*sin(uTime*4.3 + p.y*1.3 + ph));
  p.x += aAni.y*sin(uTime*8. - aAni.y*5. + ph)*.3; p.y += aAni.y*sin(uTime*6.3 - aAni.y*4. + ph)*.12;
  vec4 w = instanceMatrix*vec4(p, 1.);
  vC = aDat; vW = w.xyz;
  vec4 mv = viewMatrix*w;
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix*mv;
}`;
const BOAT_FRAG = /* glsl */`
${BATIK_GLSL}
${BATIK_FADE_GLSL}
uniform vec3 uMadder, uSail, uSailLine; uniform float uShelf, uMotif, uLamp;   // (uSail cream, uSailLine madder: the stripe, the dots and the rim)
varying vec4 vC; varying vec3 vP; varying vec3 vW;
void main(){
  float px = max(max(length(dFdx(vP)), length(dFdy(vP))), 1e-4);
  float fu = fwidth(vC.y), fv = fwidth(vC.z), fe = fwidth(vC.w);
  float id = floor(vC.x + .5), u = vC.y, v = vC.z, e = vC.w;
  vec3 col = uRamp[0], lineCol = uLine; float line = 0., keepCream = 0.;
  if(id < .5){
    col = mix(uRamp[0], uMadder, smoothstep(.8 - fv, .8 + fv, v));
    line = 1. - smoothstep(.05, .05 + fv, abs(v - .72));
    float kd = length(vec2((fract(u*1.5) - .5)/1.5, (v - .42)*.8));
    line = max(line, (1. - smoothstep(.1 - px, .1 + px, kd))*(1. - smoothstep(.05, .12, px)));
  } else if(id < 1.5){
    col = uLine; keepCream = 1.; lineCol = uSoga;
    vec2 g = fract(vec2(u, v)*3.2) - .5;
    line = (1. - smoothstep(.065 - px, .065 + px, length(g)/3.2))*(1. - smoothstep(.03, .08, px));
  } else if(id < 2.5){
    col = uSail; lineCol = uSailLine;
    float aa = max(fu*5., fv*8.);
    vec2 g = fract(vec2(u*5., v*8. + .5*floor(u*5.))) - .5;
    float fil = (1. - smoothstep(.15 - aa, .15 + aa, length(g)))*(1. - smoothstep(.12, .3, aa));
    float sb = 1. - smoothstep(.075 - fv, .075 + fv, abs(v - .55));
    float mo = uMotif < .5 ? step(.5, fract(u*7. + v*11.)) : (uMotif < 1.5 ? step(.3, length(fract(vec2(u*9., v*14.)) - .5)) : step(.03, abs(v - .55)));
    mo = mix(1., mo, 1. - smoothstep(.1, .25, aa));
    float rim = 1. - smoothstep(.13, .13 + max(fe, .02), e);
    line = max(max(fil*.9*(1. - sb), sb*mo), rim);
    float gl = (1. - smoothstep(.014, .014 + fv, abs(abs(v - .55) - .112)))*(1. - smoothstep(.02, .06, fv));
    col = mix(col, uGold*.9, gl); line *= 1. - gl;
  } else if(id < 3.5){ col = uSoga*.45;
  } else if(id < 4.5){ col = uMadder;
  } else if(id < 5.5){ col = uLine; keepCream = 1.; lineCol = uSoga; line = 1. - smoothstep(.07, .07 + fv, abs(fract(v*2.5) - .5));
  } else if(id < 6.5){ col = mix(uSoga, uGold*3., uLamp); keepCream = uLamp;
  } else { col = uGold*.9; keepCream = 1.; }
  float vd, ch; float vein = bkVeins(vP, px, 14., vd, ch);
  col = mix(col, col*.6, vein*.7);
  col = mix(col, lineCol, line);
  float od = smoothstep(0., 36., uShelf - vW.z)*.8*(1. - .7*keepCream);
  col = mix(col, uOverdye + col*.3, od);
  col *= bkCloth(vP, px);
  #ifdef USE_FOG
  col = bkFade(col, vFogDepth);
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// Frigatebirds: aAni = (span coordinate, side). Two flaps, a long glide; a cranked W.  aBird = (phase, unused).
const BIRD_VERT = /* glsl */`
attribute vec4 aDat; attribute vec2 aAni; attribute vec2 aBird;
uniform float uTime;
varying float vId;
${FOG_V}
void main(){
  vec3 p = position;
  float ph = fract(uTime*.31 + aBird.x);
  float fl = ph < .4 ? sin(ph*31.416)*sin(ph*7.854) : 0.;
  float s = aAni.x, sd = aAni.y;
  if(abs(sd) > .5){
    float t1 = .3 + .7*fl + .05*sin(uTime*1.3 + aBird.x*40.), t2 = t1 - .6 - .55*fl;
    float s1 = min(s, .48), s2 = max(s - .48, 0.);
    p.x = sd*(cos(t1)*s1 + cos(t2)*s2); p.y += sin(t1)*s1 + sin(t2)*s2;
  }
  vId = aDat.x;
  vec4 mv = viewMatrix*(instanceMatrix*vec4(p, 1.));
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix*mv;
}`;
const BIRD_FRAG = /* glsl */`
${BATIK_GLSL}
${BATIK_FADE_GLSL}
uniform vec3 uBody, uRim, uBelly, uThroat;
varying float vId;
void main(){
  float id = floor(vId + .5);
  vec3 col = id < .5 ? uBody : (id < 1.5 ? uRim : (id < 2.5 ? uBelly : uThroat));
  #ifdef USE_FOG
  col = bkFade(col, vFogDepth);
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// Rain sheets: slanted udan-liris bands, each with its own scrolling filler (dashes or dots), cream on a pale indigo
// halo, alpha = coverage. aS = (width m, height m, band width m, seed). They fade out between 40 and 10 m from the lens.
const SHEET_VERT = /* glsl */`
attribute vec4 aS;
varying vec2 vQ; varying vec4 vS; varying float vDist; varying vec3 vWp;
${FOG_V}
void main(){
  vQ = vec2((uv.x - .5)*aS.x, uv.y*aS.y); vS = aS;
  vec4 wp = instanceMatrix*vec4(position, 1.);
  vWp = wp.xyz;                                                     // where the stroke stands in the world
  vec4 mv = viewMatrix*wp;
  vDist = length(mv.xyz);
  #ifdef USE_FOG
  vFogDepth = -mv.z;
  #endif
  gl_Position = projectionMatrix*mv;
}`;
const SHEET_FRAG = /* glsl */`
${BATIK_GLSL}
${BATIK_FADE_GLSL}
uniform float uSheetA; uniform vec4 uTubeA; uniform vec3 uTubeB;
varying vec2 vQ; varying vec4 vS; varying float vDist; varying vec3 vWp;
void main(){
  float px = max(max(length(dFdx(vQ)), length(dFdy(vQ))), 1e-4);
  float bw = vS.z, lw = bw*.5;
  float q = (vQ.x + vQ.y*.364)/bw, band = floor(q), bf = fract(q);
  vec3 hh = bkHash3(vec3(band, vS.w*17., 3.));
  float lane = floor(bf*2.), lf = (fract(bf*2.) - .5)*lw;
  float lng = step(vS.y, 80.);                          // the sheets under the shelf (seen from afar) carry longer strokes
  float per = mix(24. + 14.*hh.x, 62. + 40.*hh.x, lng);  // canyon sheets: 11-17 m of each 24-38 m period drawn (in five lengths); under the shelf 53-87 m
  float sy = (vQ.y + uTime*25.*(.7 + .5*hh.y))/per + lane*.37 + hh.z;
  float res = 1. - smoothstep(.05, .16, px/lw);            // far sheets are one flat pale wash, never a barcode
  float bare = step(.34, hh.z);                         // a third of the bands are left bare
  // strokes are never wider than 3 px on screen, and the canyon sheets (the ones we fly through) draw under half of
  // each period, cut again into short lengths: thin broken dashes near the lens, never a bar across the frame
  float wd = min(max(.09, px*.8), px*1.5), on = step(mix(.55, .15, lng), fract(sy))*mix(step(.24, fract(sy*5.)), 1., lng)*bare;   // canyon sheets: under half of each period, cut again into short lengths
  float core = (1. - smoothstep(wd, wd + px, abs(lf)))*on;
  float halo = (1. - smoothstep(wd*2.4, wd*2.4 + px, abs(lf)))*on;
  if(hh.x > .75){
    float dd = length(vec2(lf, (fract(sy*10.) - .5)*per/10.)), rr = max(.2, px*.9);
    core = (1. - smoothstep(rr, rr + px, dd))*bare; halo = (1. - smoothstep(rr*1.8, rr*1.8 + px, dd))*bare;
  }
  float wash = 0.;
  float ink = core;
  float a = mix(.1, max(max(ink, halo*.45), wash), res)*(1. - .45*smoothstep(120., 420., vDist));
  vec3 col = mix(uRamp[4], uLine, ink*res);
  // THE RAIN THINS OVER THE GREAT CURL'S APPROACH, in the world: a stroke is drawn at a quarter strength by its own
  // distance in metres from the line that runs from the canyon's end (uTubeA.xyz) to the great curl's mouth (uTubeB),
  // inside a tube of the rim's radius (uTubeA.w) round that line, easing back to full just outside it. The same
  // stroke is thinned alike from every eye.
  vec3 tb = uTubeB - uTubeA.xyz;
  float clearW = mix(.25, 1., smoothstep(uTubeA.w*.8, uTubeA.w*1.25, distance(vWp, uTubeA.xyz + tb*clamp(dot(vWp - uTubeA.xyz, tb)/dot(tb, tb), 0., 1.))));
  float ex = min(vQ.x + vS.x*.5, vS.x*.5 - vQ.x), ey = min(vQ.y, vS.y - vQ.y);
  a *= smoothstep(0., vS.x*.22, ex)*smoothstep(0., vS.y*.2, ey)*smoothstep(10., 40., vDist)*uSheetA*clearW;
  #ifdef USE_FOG
  col = bkFade(col, vFogDepth);
  #endif
  gl_FragColor = vec4(col, a);
}`;

// Loose dashes wrapped round the lens: cream with indigo edges, about 1 m long, never under 1.5 px wide.
const DASH_VERT = /* glsl */`
attribute vec3 aOff; attribute float aR;
uniform float uTime, uPix, uRain; uniform vec3 uCamW; uniform vec4 uTubeA; uniform vec3 uTubeB;
varying vec2 vUv; varying float vA;
void main(){
  vec3 box = vec3(46., 38., 46.), dir = vec3(.342, -.94, 0.);
  vec3 c = aOff*box + dir*(uTime*25.*(.8 + .4*aR));
  c = uCamW + mod(c - uCamW, box) - box*.5;
  vec4 mc = viewMatrix*vec4(c, 1.);
  vec3 dv = mat3(viewMatrix)*dir;
  vec2 d2 = dv.xy; float l = length(d2); d2 = l > 1e-4 ? d2/l : vec2(0., 1.);
  float dist = max(-mc.z, .1);
  float hw = max(.03, dist*uPix*.75);
  vec3 pv = mc.xyz + dv*(position.y*.9*(1. + .5*aR)) + vec3(-d2.y, d2.x, 0.)*(position.x*hw*3.);     // 0.9-1.35 m long
  vUv = position.xy*2.;
  vA = .9*uRain*smoothstep(3., 6., dist)*(1. - smoothstep(15., 22., dist))*clamp(.05/hw, .4, 1.);
  // thinned to a quarter by the dash's own distance in metres from the line from the canyon's end to the great
  // curl's mouth (see the sheets: THE RAIN THINS)
  vec3 tb = uTubeB - uTubeA.xyz;
  vA *= mix(.25, 1., smoothstep(uTubeA.w*.8, uTubeA.w*1.25, distance(c, uTubeA.xyz + tb*clamp(dot(c - uTubeA.xyz, tb)/dot(tb, tb), 0., 1.))));
  gl_Position = projectionMatrix*vec4(pv, 1.);
}`;
const DASH_FRAG = /* glsl */`
uniform vec3 uCream, uEdge;
varying vec2 vUv; varying float vA;
void main(){
  vec3 col = mix(uCream, uEdge, smoothstep(.5, .7, abs(vUv.x)));
  gl_FragColor = vec4(col, vA*(1. - smoothstep(.8, 1., abs(vUv.y))));
}`;

// =====================================================================================================================
// 3. makeBuf: flat triangles with a part id. A vertex is [x, y, z, u, v, edge, ani0, ani1].
// =====================================================================================================================
function makeBuf() {
  const pos = [], dat = [], ani = [];
  const push = (q, id) => { pos.push(q[0], q[1], q[2]); dat.push(id, q[3] || 0, q[4] || 0, q[5] === undefined ? 9 : q[5]); ani.push(q[6] || 0, q[7] || 0); };
  const tri = (a, b, c, id) => { push(a, id); push(b, id); push(c, id); };
  const quad = (a, b, c, d, id) => { tri(a, b, c, id); tri(a, c, d, id); };
  const loft = (rings, id, closed = true) => {
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1], n = A.length;
      for (let j = 0; j < (closed ? n : n - 1); j++) { const k = (j + 1) % n; quad(A[j], A[k], B[k], B[j], typeof id === 'function' ? id(i, j) : id); }
    }
  };
  const T = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), up = new THREE.Vector3();
  // a tube through pts ([x,y,z]); rad a number or fn(t); pen(t) = pennant weight along it
  const tube = (pts, rad, sides, id, pen = null) => {
    const rings = []; let len = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, pts.length - 1)], p = pts[i], t = i / (pts.length - 1);
      if (i) len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      T.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(T.y) > 0.9) up.set(1, 0, 0);
      X.crossVectors(up, T).normalize(); Y.crossVectors(T, X);
      const r = typeof rad === 'function' ? rad(t) : rad, ring = [];
      for (let j = 0; j < sides; j++) {
        const an = (j / sides) * TAU + 0.5, cx = Math.cos(an) * r, cy = Math.sin(an) * r;
        ring.push([p[0] + X.x * cx + Y.x * cy, p[1] + X.y * cx + Y.y * cy, p[2] + X.z * cx + Y.z * cy, len, j / sides, 9, 0, pen ? pen(t) : 0]);
      }
      rings.push(ring);
    }
    loft(rings, id, true);
  };
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aDat', new THREE.Float32BufferAttribute(dat, 4));
    g.setAttribute('aAni', new THREE.Float32BufferAttribute(ani, 2));
    return g;
  };
  return { tri, quad, loft, tube, build, tris: () => pos.length / 9 };
}

// =====================================================================================================================
// 4. geometry
// =====================================================================================================================
const bez = (A, C, B) => (s) => { const k = 1 - s; return [k * k * A[0] + 2 * s * k * C[0] + s * s * B[0], k * k * A[1] + 2 * s * k * C[1] + s * s * B[1], k * k * A[2] + 2 * s * k * C[2] + s * s * B[2]]; };
const sample = (fn, n) => { const o = []; for (let i = 0; i <= n; i++) o.push(fn(i / n)); return o; };

// canoe hull with upswept ends: v = 0 keel .. 1 gunwale, u = metres along
function hullInto(b, half, beam, depth, riseK, riseG) {
  const rings = [], deck = [];
  for (const t of [-1, -0.86, -0.62, -0.32, 0, 0.32, 0.62, 0.86, 1]) {
    const z = t * half, k = Math.abs(t), bb = beam * Math.pow(Math.max(1 - k * k * 0.94, 0.01), 0.6);
    const yk = -depth * 0.4 + riseK * k * k * k, yg = depth * 0.6 + riseG * Math.pow(k, 2.6), ym = lerp(yk, yg, 0.42);
    rings.push([[-bb, yg, z, z, 1], [-bb * 0.84, ym, z, z, 0.5], [0, yk, z, z, 0], [bb * 0.84, ym, z, z, 0.5], [bb, yg, z, z, 1]]);
    deck.push([[-bb, yg - 0.07, z], [bb, yg - 0.07, z]]);
  }
  b.loft(rings, 0, false); b.loft(deck, 3, false);
}

// a sail between two spars S1(s), S2(s) (s = 0 at the tack): bellied along bd, pumping in the shader
function sailInto(b, S1, S2, ns, nt, claw, belly, bd, H) {
  const P = (s, t) => {
    const se = s * (1 - claw * Math.sin(Math.PI * t)), a = S1(se), c = S2(se), w = Math.sin(Math.PI * t) * Math.pow(s, 0.8), bl = belly * w;
    const width = Math.hypot(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
    return [lerp(a[0], c[0], t) + bd[0] * bl, lerp(a[1], c[1], t) + bd[1] * bl, lerp(a[2], c[2], t) + bd[2] * bl, t, s, Math.min(Math.min(t, 1 - t) * width, (1 - s) * H), w, 0];
  };
  for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) b.quad(P(i / ns, j / nt), P((i + 1) / ns, j / nt), P((i + 1) / ns, (j + 1) / nt), P(i / ns, (j + 1) / nt), 2);
}

// a seated figure reserved in cream under a conical hat
function crewInto(b, x, y, z, k) {
  const ring = (yy, rx, rz, v) => { const o = []; for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; o.push([x + Math.cos(a) * rx * k, y + yy * k, z + Math.sin(a) * rz * k, j / 6 * 1.2, v]); } return o; };
  b.loft([ring(0, 0.24, 0.22, 0), ring(0.35, 0.22, 0.16, 0.35), ring(0.72, 0.27, 0.15, 0.72), ring(0.9, 0.1, 0.09, 0.9), ring(1.0, 0.13, 0.13, 1.0), ring(1.16, 0.11, 0.11, 1.16)], 1, true);
  const apex = [x, y + 1.42 * k, z, 0, 0];
  for (let j = 0; j < 8; j++) { const a0 = (j / 8) * TAU, a1 = ((j + 1) / 8) * TAU; b.tri(apex, [x + Math.cos(a0) * 0.42 * k, y + 1.14 * k, z + Math.sin(a0) * 0.42 * k, 0, 1], [x + Math.cos(a1) * 0.42 * k, y + 1.14 * k, z + Math.sin(a1) * 0.42 * k, 0, 1], 5); }
  // arms: one tube to the paddle / sheet
  b.tube([[x - 0.25 * k, y + 0.68 * k, z], [x - 0.42 * k, y + 0.45 * k, z + 0.18 * k], [x - 0.36 * k, y + 0.3 * k, z + 0.42 * k]], 0.055 * k, 4, 1);
  b.tube([[x + 0.25 * k, y + 0.68 * k, z], [x + 0.42 * k, y + 0.45 * k, z + 0.18 * k], [x + 0.36 * k, y + 0.3 * k, z + 0.42 * k]], 0.055 * k, 4, 1);
}

// JUKUNG: 8 m double-outrigger canoe, bow +z, under a 5.6 m crab-claw sail squared across (hove-to it luffs and pumps).
// Built to read as ONE boat in clear layers from astern, which is how the flight meets it: a dark hull with one
// upswept horn at each end, two cream floats on two arched booms, a bare mast, and the sail carried clear above the
// hull with nothing in front of it (its tack is at the masthead's foot, 2.3 m up, so sea shows between hull and sail);
// the helmsman sits low in the stern and the second man forward of the mast, hidden in line behind him.
function jukungGeometry() {
  const b = makeBuf();
  hullInto(b, 4, 0.42, 0.7, 0.85, 1.0);
  for (const s of [-1, 1]) {
    b.tube([[0, 1.15, s * 3.75], [0, 1.6, s * 4.3], [0, 2.35, s * 4.6]], (t) => 0.11 * (1 - t) + 0.02, 5, 0);   // one upswept horn
    // floats: bamboo with upturned tips
    b.tube(sample((t) => { const z = lerp(-3.3, 3.5, t), k = Math.abs(t * 2 - 1); return [s * 2.45, 0.1 + 0.4 * k * k * k, z]; }, 8), (t) => 0.16 * (1 - 0.6 * Math.pow(Math.abs(t * 2 - 1), 3)), 5, 1);
    // booms: two arched outrigger booms
    b.tube(sample((t) => { const x = lerp(-2.45, 2.45, t), k = Math.abs(x / 2.45); return [x, 0.18 + 0.8 * (1 - k * k * k * k), s > 0 ? 1.5 : -1.2]; }, 8), 0.06, 4, 3);
  }
  b.tube([[0, 0.3, 0.6], [0, 2.6, 0.62], [0, 5.1, 0.65]], 0.085, 5, 3);                                  // mast
  const tack = [0, 2.3, 0.75], S1 = bez(tack, [-2.5, 3.9, 0.9], [-2.9, 7.9, 0.5]), S2 = bez(tack, [2.3, 3.6, 1.0], [2.7, 6.6, 0.8]);
  b.tube(sample(S1, 6), 0.06, 4, 3); b.tube(sample(S2, 6), 0.06, 4, 3);
  sailInto(b, S1, S2, 7, 6, 0.26, 0.7, [0, -0.1, 1], 5.6);
  const tip = S1(1);                                                                                     // pennant
  for (let i = 0; i < 5; i++) {
    const t0 = i / 5, t1 = (i + 1) / 5, w0 = 0.2 * (1 - t0) + 0.02, w1 = 0.2 * (1 - t1) + 0.02;
    b.quad([tip[0], tip[1] + w0, tip[2] + t0 * 1.9, 0, 0, 9, 0, t0], [tip[0], tip[1] - w0, tip[2] + t0 * 1.9, 0, 0, 9, 0, t0], [tip[0], tip[1] - w1, tip[2] + t1 * 1.9, 0, 0, 9, 0, t1], [tip[0], tip[1] + w1, tip[2] + t1 * 1.9, 0, 0, 9, 0, t1], 4);
  }
  crewInto(b, 0, 0.36, -2.3, 1); crewInto(b, 0, 0.34, 2.1, 0.85);
  b.tube([[0, 2.35, 4.6], [0, 2.57, 4.62]], (t) => 0.13 - 0.1 * Math.abs(t - 0.5), 5, 6);                // lamp at the prow
  return b.build();
}

// A FLOATING OFFERING (canang): a square palm-leaf tray 1.5 m across, woven cream and soga, heaped with madder petals
// round a short stick of incense. Set adrift between the boats; the sea draws its rings.
function offeringGeometry() {
  const b = makeBuf(), h = 0.75, y0 = 0.12, y1 = 0.3;
  const c = [[-h, y0, -h, 0, 0], [h, y0, -h, 1, 0], [h, y0, h, 1, 1], [-h, y0, h, 0, 1]], t = [[-h * 1.12, y1, -h * 1.12, 0, 0], [h * 1.12, y1, -h * 1.12, 1, 0], [h * 1.12, y1, h * 1.12, 1, 1], [-h * 1.12, y1, h * 1.12, 0, 1]];
  b.quad(c[0], c[1], c[2], c[3], 5);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; b.quad([c[i][0], c[i][1], c[i][2], i, 0.3], [c[j][0], c[j][1], c[j][2], i + 1, 0.3], [t[j][0], t[j][1], t[j][2], i + 1, 0.7], [t[i][0], t[i][1], t[i][2], i, 0.7], 5); }
  const apex = [0, 0.7, 0];
  for (let j = 0; j < 8; j++) { const a0 = (j / 8) * TAU, a1 = ((j + 1) / 8) * TAU; b.tri(apex, [Math.cos(a0) * 0.5, y0 + 0.03, Math.sin(a0) * 0.5], [Math.cos(a1) * 0.5, y0 + 0.03, Math.sin(a1) * 0.5], 4); }
  b.tube([[0.1, 0.5, 0.05], [0.14, 1.25, 0.08]], 0.035, 4, 3);
  for (const [x, z] of [[-h, -h], [h, -h], [h, h], [-h, h]]) b.tube([[x * 1.12, y1, z * 1.12], [x * 1.3, y1 + 0.32, z * 1.3]], (q) => 0.07 * (1 - q) + 0.015, 4, 7);   // four gold corner tips
  return b.build();
}

// FRIGATEBIRD: 2.2 m span, cranked wings (aAni = span coordinate, side), forked tail. Parts: 0 ink, 1 the cream
// resist rim (a 0.12 m ring round the planform and a skirt under the trailing edge so it reads edge-on), 2 belly, 3 the
// madder throat and its inflated pouch (a lobe 0.4 m long and 0.33 m across hung under the bill: the red that rides with the camera).
// The belly (2) is a white patch 0.42 m wide under the body with a spur along each inner underwing, so that from below the W
// has a white heart behind its red pouch and reads on ink cloud as well as on cream sky.
function birdGeometry() {
  const b = makeBuf();
  const zs = [0.5, 0.36, 0.22, 0.0, -0.22, -0.42], rs = [0.006, 0.03, 0.075, 0.1, 0.07, 0.02], ys = [-0.035, -0.01, 0.01, 0, 0, 0.01];
  const rings = zs.map((z, i) => { const o = []; for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; o.push([Math.cos(a) * rs[i], ys[i] + Math.sin(a) * rs[i] * 0.85, z]); } return o; });
  b.loft(rings, (i, j) => ((j === 3 || j === 4) ? (i === 1 ? 3 : (i === 2 || i === 3) ? 2 : 0) : 0), true);
  { const pr = [[0.44, 0.012, -0.03], [0.38, 0.1, -0.11], [0.3, 0.16, -0.175], [0.2, 0.165, -0.18], [0.11, 0.115, -0.135], [0.05, 0.02, -0.06]];
    b.loft(pr.map(([z, r, y]) => { const o = []; for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; o.push([Math.cos(a) * r * 0.85, y + Math.sin(a) * r, z]); } return o; }), 3, true); }
  for (const sd of [-1, 1]) {
    const W = (q, y = 0) => [sd * q[0], y, q[1], 0, 0, 9, q[0], sd];
    const L0 = [0.04, 0.2], L1 = [0.48, 0.36], TP = [1.1, -0.1], T0 = [0.04, -0.16], T1 = [0.48, 0.05];
    b.quad(W(L0, 0.045), W(L1, 0.045), W(T1), W(T0), 0); b.tri(W(L1, 0.045), W(TP, 0.01), W(T1), 0);
    b.quad(W(L0, -0.025), W(L1, -0.025), W(T1), W(T0), 0); b.tri(W(L1, -0.025), W(TP, -0.01), W(T1), 0);
    b.quad(W(L0, 0.045), W(L1, 0.045), W(L1, -0.025), W(L0, -0.025), 0); b.quad(W(L1, 0.045), W(TP, 0.01), W(TP, -0.01), W(L1, -0.025), 0);
    const L0r = [0.04, 0.32], L1r = [0.5, 0.49], TPr = [1.26, -0.13], T0r = [0.04, -0.28], T1r = [0.46, -0.08];
    b.quad(W(L0), W(L1), W(L1r), W(L0r), 1); b.quad(W(L1), W(TP), W(TPr), W(L1r), 1);
    b.quad(W(T0), W(T1), W(T1r), W(T0r), 1); b.quad(W(T1), W(TP), W(TPr), W(T1r), 1);
    b.quad(W(T0r), W(T1r), W(T1r, -0.1), W(T0r, -0.1), 1); b.quad(W(T1r), W(TPr), W(TPr, -0.1), W(T1r, -0.1), 1);
    const F = (x, z) => [sd * x, 0, z];
    b.tri(F(0.0, -0.36), F(0.1, -0.38), F(0.22, -1.02), 0);
    b.quad(F(0.1, -0.38), F(0.22, -1.02), F(0.32, -1.1), F(0.2, -0.36), 1);
    b.quad(F(0.0, -0.44), F(0.22, -1.02), F(0.2, -1.15), F(0.0, -0.56), 1);
    // the white belly: a patch under the body between the wing roots, behind the pouch, with a spur out along the
    // underside of each inner wing (the Christmas frigatebird's white axillary spurs; it flaps with the wing)
    const bc = [0, -0.11, -0.04], br = [[0, -0.095, 0.16], [0.13, -0.09, 0.09], [0.21, -0.06, -0.03], [0.14, -0.075, -0.22], [0, -0.07, -0.4]];
    for (let k = 0; k < 4; k++) b.tri(bc, [sd * br[k][0], br[k][1], br[k][2]], [sd * br[k + 1][0], br[k + 1][1], br[k + 1][2]], 2);
    b.quad(W([0.04, 0.17], -0.034), W([0.42, 0.29], -0.034), W([0.42, 0.14], -0.034), W([0.04, -0.13], -0.034), 2);
  }
  return b.build();
}

// SEA: one grid in band space: `inner` uniform cells each way (lifted into swells in the vertex shader; snapped to the
// camera by whole cells so vertices never slide through the pattern), then `outer` stretched cells out to `reach`.
function seaGeometry(cellA, cellB, inner, outer, reach) {
  const n = inner + outer, g = 1.8;
  const coord = (i, cell) => { const k = Math.abs(i); if (k <= inner) return i * cell; const d0 = inner * cell; return Math.sign(i) * (d0 + (reach - d0) * (Math.pow(g, k - inner) - 1) / (Math.pow(g, outer) - 1)); };
  const side = 2 * n + 1, pos = new Float32Array(side * side * 3);
  const ca = new Float32Array(side), cb = new Float32Array(side); for (let i = 0; i < side; i++) { ca[i] = coord(i - n, cellA); cb[i] = coord(i - n, cellB); }
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) { const o = (j * side + i) * 3; pos[o] = ca[i]; pos[o + 2] = cb[j]; }
  const idx = new Uint32Array((side - 1) * (side - 1) * 6); let q = 0;
  for (let j = 0; j < side - 1; j++) for (let i = 0; i < side - 1; i++) { const a = j * side + i; idx[q++] = a; idx[q++] = a + side; idx[q++] = a + 1; idx[q++] = a + 1; idx[q++] = a + side; idx[q++] = a + side + 1; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

const lin3 = (hex, k = 0.86) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };

// =====================================================================================================================
// 5. the world
// =====================================================================================================================
export default {
  id: 'batik-monsoon',
  name: 'Mega Mendung',
  category: 'sky',
  weirdness: 0.4,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = clamp(vary.density ?? 1, 0.7, 1.3);

    // ---- SEEDED: colourway, sea scale, rain density, cast ----------------------------------------------------------
    const moodId = pickMood(vary.hour, rng()), mood = MOODS[moodId];
    const seaKind = rng.pick([{ W: 10, amp: 0.6 }, { W: 18, amp: 1.2 }, { W: 18, amp: 1.2 }, { W: 30, amp: 2.0 }]);   // klitik .. barong
    const rainK = clamp(rng() * 0.55 + (vary.mood ?? 0.5) * 0.45, 0, 1);   // 0: three thin sheets .. 1: a dense curtain (seed and ctx.vary.mood)
    const motif = rng.fork('motif').int(0, 2);                // the sail stripe's motif (a stream of its own)
    const wr = rng.fork('world');

    // ---- the hero, at the origin (hero-local == world) --------------------------------------------------------------
    const hero = await buildHero(ctx, { colourway: moodId, prada: !!vary.rare, farSea: false, boltEvery: (moodId === 'night' ? 2 : 4) * lerp(1.3, 0.7, vary.mood ?? 0.5) });
    await ctx.yield();
    const pal = hero.palette, U = hero.uniforms, A = hero.anchors;
    const scene = new THREE.Scene();
    const clothCol = new THREE.Color().setRGB(pal.cloth.x, pal.cloth.y, pal.cloth.z);
    scene.background = clothCol;
    scene.fog = new THREE.FogExp2(clothCol.clone(), 0.00022);
    scene.add(hero.object);

    // ---- PATH: the hero's own fly-through line, entry over the sea, exit at the great curl's throat -------------------
    const path = makePath(A.flyThrough);
    const seat = A.portalSeat;
    await ctx.yield();

    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const mat = (vs, fs, own, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, ...own }, vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, ...o });
    const uCamW = { value: new THREE.Vector3(0, 5, 420) };

    // ---- sea ----------------------------------------------------------------------------------------------------------
    const W = seaKind.W, cellB = W / 9, cellA = cellB * 1.5, inner = 60, fadeR = inner * cellB;
    const seaU = {
      uOrigin: { value: new THREE.Vector2() }, uMarch: { value: 0 }, uW: { value: W }, uAmp: { value: seaKind.amp }, uFadeR: { value: fadeR }, uYOff: { value: 0 }, uCamW,
      uShelf: { value: 70 }, uOutline: { value: mood.outline }, uDotT: { value: 0 }, uGround: { value: lin3(mood.ground) },
      uBoat: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
      uOff: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3(0, -9999, 0)) },
    };
    const seaGeo = seaGeometry(cellA, cellB, inner, 11, 5200);
    await ctx.yield();
    const sea = new THREE.Mesh(seaGeo, mat(SEA_VERT, SEA_FRAG, seaU));
    sea.frustumCulled = false; sea.name = 'parang-sea'; scene.add(sea);
    // THE FLOOR UNDER THE SEA: seen through the previous world's portal, the lowest 2 m of the opening lie under the sea
    // plane (the entry is 5 m up, the disc 7 m in radius), and sight lines through them used to reach the bare cloth
    // dome. A coarse grid of the same shader (the same program: only uAmp and uYOff differ; 2.3k triangles, small
    // near the lens because huge triangles behind the camera get a wrong depth in the software renderer) lies 2.4 m
    // down, without swell, so the soga and cream bands run to the bottom rim of the opening. From above it is never
    // seen: the swell is never negative and the sea is opaque.
    { const floor = new THREE.Mesh(seaGeometry(40, 40, 8, 9, 5000), mat(SEA_VERT, SEA_FRAG, { ...seaU, uAmp: { value: 0 }, uYOff: { value: -2.4 } }));
      floor.frustumCulled = false; floor.name = 'sea-floor'; scene.add(floor); }
    const fr = (x) => x - Math.floor(x);
    const swellAt = (x, z, time, cx, cz) => {
      const f = fr((x * NX + z * NZ - MARCH * time) / W - 2 / 9), tooth = f < 2 / 3 ? 0.5 - 0.5 * Math.cos(f * 1.5 * Math.PI) : 3 - 3 * f;
      const dl = Math.max(Math.hypot(x - cx, z - cz), 1e-3);
      return seaKind.amp * tooth * (1 - smoothstep(fadeR * 0.5, fadeR * 0.9, dl)) * smoothstep(0.06, 0.32, Math.abs(x - cx + z - cz) * Math.SQRT1_2 / dl);
    };
    await ctx.yield();

    // ---- boats: three jukung lying hove-to, bows to the front, under cream sails with one madder stripe ---------------
    // THEIR PLACES ARE A RULE OF THE ROUTE, not typed coordinates: each lies where the design's journey passes it,
    // 52, 72 and 131 m along the route from the entry (the design's beats: A at u 0.04, B at u 0.055 and C at u 0.10 of
    // its 1,310 m; boat A so lies 20 m beyond the station of the birds' wheel, WHEEL_D, and the wheel turns short of
    // its sail), alternately to port and to starboard, 7.5, 9 and 9.5 m off the route (the brief's offsets: near
    // enough for each stripe and crew to be read). Nothing runs for harbour. Between them the sea is alive: six
    // floating offerings in rings of dots, the slick of dots each hull leaves down-swell, and the lead birds low
    // over the water.
    const boatU = { uMadder: { value: pal.madder }, uSail: { value: pal.line }, uSailLine: { value: pal.madder },
      uShelf: seaU.uShelf, uMotif: { value: motif }, uLamp: { value: mood.lamps } };
    const boatMat = mat(BOAT_VERT, BOAT_FRAG, boatU);
    const sFoot = path.nearestXZ(0, 120).u * path.length;       // the foot of the staircase, metres along the route
    const rtP = new THREE.Vector3(), rtT = new THREE.Vector3();
    // a place `d` metres along the route and `off` metres to its right (negative: to port), on the sea
    const beside = (d, off) => { path.posAtDist(d, rtP); path.tangentAtDist(d, rtT); const l = Math.hypot(rtT.x, rtT.z) || 1; return { x: rtP.x - rtT.z / l * off, z: rtP.z + rtT.x / l * off }; };
    const WHEEL_D = 32, SAIL_TOP = 7.9;                         // the wheel's station (the brief: 32 m ahead of the entry); the sail's peak above the keel at scale 1
    // (d: metres along the route from the entry, the design's beats; off: metres to starboard of it)
    const boats = [{ scale: 1.3, yaw: Math.PI + 0.1, off: -7.5, d: 52 }, { scale: 1.45, yaw: Math.PI - 0.14, off: 9, d: 72 }, { scale: 1.7, yaw: Math.PI + 0.08, off: -9.5, d: 131 }];
    boats.forEach((bt) => { bt.side = Math.sign(bt.off); Object.assign(bt, beside(bt.d, bt.off)); });
    boats.forEach((bt) => { bt.ph = wr.range(0, TAU); bt.pos = new THREE.Vector3(); bt.yawNow = bt.yaw; });
    const mkFleet = (geo, n) => {
      const m = new THREE.InstancedMesh(geo, boatMat, n), ph = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) ph[i * 2] = wr.range(0, TAU);
      geo.setAttribute('aBoat', new THREE.InstancedBufferAttribute(ph, 2));
      m.frustumCulled = false; scene.add(m); return m;
    };
    const fleet = mkFleet(jukungGeometry(), boats.length); fleet.name = 'jukung';
    await ctx.yield();
    // the offerings (their own little random stream, so no later draw moves)
    const wo = ctx.core.makeRng((ctx.core.hashSeed('canang:' + ctx.seed)) >>> 0);
    // THE OFFERINGS' PLACES ARE A RULE TOO: one in each sixth of the route between 40 and 230 m from the entry, never
    // less than 22 m after the one before, 3 to 7 m off the route on alternate sides; where a boat lies on that side
    // within 14 m along the route, the offering takes the other side (so its rings never run into the hull's).
    const offCell = (230 - 40) / 6;
    const offs = [0, 1, 2, 3, 4, 5].map((i) => {
      const d = 40 + offCell * i + wo.range(0, offCell - 22), lat = wo.range(3, 7); let side = i % 2 ? -1 : 1;
      if (boats.some((bt) => bt.side === side && Math.abs(bt.d - d) < 14)) side = -side;
      return { ...beside(d, side * lat), ph: wo.range(0, TAU), sc: wo.range(0.9, 1.15) };
    });
    const offGeo = offeringGeometry();
    const offMesh = new THREE.InstancedMesh(offGeo, boatMat, offs.length);
    { const ph = new Float32Array(offs.length * 2); offs.forEach((o, i) => { ph[i * 2] = o.ph; }); offGeo.setAttribute('aBoat', new THREE.InstancedBufferAttribute(ph, 2)); }
    offMesh.frustumCulled = false; offMesh.name = 'offerings'; scene.add(offMesh);
    offs.forEach((o, i) => seaU.uOff.value[i].set(o.x, o.z, o.ph));
    await ctx.yield();
    const eul = new THREE.Euler(0, 0, 0, 'YXZ'), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), m4 = new THREE.Matrix4();
    // hove-to: the hull holds its place, yaws a few degrees either way, rocks, and pitches over each marching swell
    const placeBoat = (bt, mesh, i, time, cx, cz, len) => {
      const yaw = bt.yaw + 0.07 * Math.sin(time * 0.31 + bt.ph), x = bt.x + 0.5 * Math.sin(time * 0.23 + bt.ph * 2), z = bt.z + 0.6 * Math.sin(time * 0.19 + bt.ph);
      const sx = Math.sin(yaw) * len, sz = Math.cos(yaw) * len;
      const h0 = swellAt(x, z, time, cx, cz), h1 = swellAt(x + sx, z + sz, time, cx, cz), h2 = swellAt(x - sx, z - sz, time, cx, cz);
      bt.pos.set(x, (h0 + h1 + h2) / 3 * 0.8 + 0.05, z); bt.yawNow = yaw;
      eul.set(-Math.atan2(h1 - h2, 2 * len) * 0.8, yaw, 0.09 * Math.sin(time * 0.9 + bt.ph) + 0.04 * Math.sin(time * 1.7 + bt.ph * 3));
      m4.compose(bt.pos, qt.setFromEuler(eul), sc.setScalar(bt.scale));
      mesh.setMatrixAt(i, m4);
    };
    await ctx.yield();

    // ---- birds: seven lead frigatebirds (ink, cream rim, madder pouch) that are with the camera from the first frame
    // to the funnel, the rest in two kettles off the face ----------------------------------------------------------------
    const nLead = 7, nKettle = Math.round(33 * density), nBirds = nLead + nKettle;
    const birdU = { uBody: { value: pal.ramp[0] }, uRim: { value: moodId === 'night' ? pal.line.clone().multiplyScalar(1.15) : pal.line }, uBelly: { value: new THREE.Vector3(0.8, 0.78, 0.72) }, uThroat: { value: pal.madder.clone().multiplyScalar(1.12) } };
    await ctx.yield();
    const birdGeo = birdGeometry();
    const birdMesh = new THREE.InstancedMesh(birdGeo, mat(BIRD_VERT, BIRD_FRAG, birdU), nBirds);
    { const ph = new Float32Array(nBirds * 2); for (let i = 0; i < nBirds; i++) ph[i * 2] = wr(); birdGeo.setAttribute('aBird', new THREE.InstancedBufferAttribute(ph, 2)); }
    birdMesh.frustumCulled = false; birdMesh.name = 'frigatebirds'; scene.add(birdMesh);
    await ctx.yield();
    // THE LEAD GROUP: seven frigatebirds that FLY THE ROUTE AHEAD OF US, in the world and not in the frame. The flock has
    // a STATION on the route that leads the lens by metres flown (THE ONE DECLARED PACING OF THIS WORLD: the flock's
    // station and its changes of formation follow metres flown; everything else of the birds runs on world time).
    // Every formation is a shape round that station in the frame of the PATH there (metres along the route, to its
    // right, above it; across its own heading) or of the world (the line from the station to the portal's seat), never of the gaze or the lens:
    // the gaze swings over the flock, birds are seen from behind while they fly ahead of us and one may leave the
    // frame. ONE POI (flockAt) lets the gaze go with them up the face (the loop's own centre) and in the funnel (the
    // ring's centre). OVER THE LIP THE GAZE DOES NOT GO WITH THEM: there flockAt holds a point 22 m from the station
    // toward the great curl's mouth, and the arch turns beside it.
    //   THE LOOP   the seven fly ONE LOOP the whole way to the lip, evenly spaced by arc length, turning on WORLD TIME
    //              (TURN = 1.1 rad/s: a frigatebird's 10 m/s round a 9 m wheel; the way and the start phase from the
    //              flock's own stream), so they never close on each other and the loop reads alike at every phase:
    //              a kettle that wheels in the air that carries it. Its near side always rides higher than its far
    //              side, so from behind and below the loop stands open. The loop's SHAPE is the formation (loopShape):
    //     the wheel   stationed WHEEL_D = 32 m from the entry between the two near sails, a circle 9 m in radius,
    //                 its near side 3 m up and its far side 3 m down (about 5 to 10 m over the sea); it BREAKS as the
    //                 lens comes on, from 30 m short of its station to 6 m past it: the station runs ahead and
    //     the kettle  travels 23 m ahead of us up the row of sails, 13 m across and 5 m over the route, each bird
    //                 lifting over the sail it passes (sailClear)
    //     the look up from boat C abeam it opens to 17 m across, comes back to 17 m ahead and rises to 7.5 m over the route
    //     the climb   from the staircase's foot: 18 m across, 13 m ahead and 4.5 m over the route (the brief's station
    //                 is 9 to 14 m ahead), so we look up at the birds' bellies; it tips its long axis on world time
    //                 and its near birds peel toward each curl of THE ARRIVAL while that curl is drawn (on the
    //                 hero's own timeline)
    //     the peel    from 180 m short of the lip the loop widens to 20 m and BANKS AWAY RIGHT (the brief) by 6.5 m
    //   THE ARCH   from 95 to 45 m short of the lip the loop OPENS (openAt): its spacing closes about its middle bird
    //              from a seventh of a turn to the arch's step (ARCH_STEP), each bird keeping its angle's order
    //              (none crosses another), onto an arch ROUND THE ROUTE'S OWN HEADING: a circle in the plane across
    //              the route's tangent at the station, centred 22 m beyond the station along that heading, ARCH_R
    //              = 2 SPAN / ARCH_STEP = 14.0 m in radius (two wingspans from each bird to the next along it), the
    //              seven spanning half of it. It keeps turning on world time at the loop's own rate and phase
    //              (TURN, PH0): it reads alike at every phase and holds no pose. Nothing of it reads the great
    //              curl, the gaze or the lens.
    //   THE LIFT   the inflow that runs up the face turns up over the lip: rising air, 5.2 m/s at the lip's own line,
    //              from 60 m short of that line to 40 m past it (liftAt). It is a field of the place: it acts on
    //              each bird by that bird's own distance from the lip's line, whatever formation it flies.
    //   THE RING   at the great curl's mouth (ringAt) the arch closes the same way (axis, angle and radii, never a
    //              place straight across) into a wheel round THE FUNNEL'S AXIS (the line from the station to the
    //              portal's seat), tipped toward us at its top (RING_TIP), turning on world time as before, evenly
    //              spaced again, held inside the lips and off the route's line (hornHold); over the last 62 m it
    //              opens and the lens flies through it.
    // ATTITUDE comes from each bird's own flight and reads nothing of the lens (placeBirds): it heads where it flies
    // through the air that carries the flock (body nearly level: a frigatebird soars) and banks by its own turn (the
    // lift its turn asks for, up to 65 degrees, rolling at most 140 degrees a second).
    const fr1 = (x) => x - Math.floor(x), PL = path.length;
    const fk = ctx.core.makeRng((ctx.core.hashSeed('flock:' + ctx.seed)) >>> 0);        // the flock's own stream
    const PH0 = fk.range(0, TAU), PH1 = fk.range(0, TAU), TURN = 1.1 * (fk.chance(0.5) ? 1 : -1);
    const SLOT = fk.shuffle([0, 1, 2, 3, 4, 5, 6]), BPH = [], BRT = [];
    for (let i = 0; i < nLead; i++) { BPH.push(fk.range(0, TAU)); BRT.push(fk.range(0.85, 1.15)); }
    const GC = A.greatCurl, hornS = GC.arcStart, hornR = (q) => GC.radii[q] * (1 - lerp(0.105, 0.045, q / 7)) - 5;
    await ctx.yield();
    // the beats, in metres flown, from the world's own places
    const sBoatC = boats[2].d, sLip = path.nearestXZ(A.lipNotch.x, A.lipNotch.z).u * PL, sMouth = GC.arcStart, sPass = PL - 62;
    const lipT = new THREE.Vector3(); { path.tangentAtDist(sLip, lipT); lipT.y = 0; lipT.normalize(); }   // the route's level heading at the lip: the lip's line lies across it through the notch
    const uBolt = A.heroBolt.u, boltLife = A.heroBolt.life, boltCh = A.heroBolt.channel, BOLT_CLEAR = 12;   // the hero bolt: its birth, the seconds it is hot and cooling, its drawn channel; the metres a bird keeps from it meanwhile
    await ctx.yield();
    const GSC = 1.65, SPAN = 2.2 * GSC, AO = 9, ARCH_STEP = 0.52, ARCH_R = 2 * SPAN / ARCH_STEP, RING_A = 8.4, RING_B = 5.9, RING_TIP = Math.sqrt(RING_A * RING_A - RING_B * RING_B) / RING_B;   // (the ring is a wheel of radius RING_A tipped toward us at its top: across the line of flight it shows RING_A by RING_B)
    const upY = new THREE.Vector3(0, 1, 0);
    const bP = new THREE.Vector3(), bT = new THREE.Vector3(), bR = new THREE.Vector3(), bU = new THREE.Vector3(), bF = new THREE.Vector3();
    const bQ = new THREE.Vector3(), bE1 = new THREE.Vector3(), bE2 = new THREE.Vector3(), bC = new THREE.Vector3(), bW = new THREE.Vector3(), bX = new THREE.Vector3(), bY = new THREE.Vector3(), bO = new THREE.Vector3(), bL = new THREE.Vector3(), bV = new THREE.Vector3();
    await ctx.yield();
    // an ellipse walked at even steps of ARC LENGTH: arc fraction (turns) -> parametric angle, for semi-axes a and b
    const mkArc = () => { const N = 256, acc = new Float32Array(N + 1); let L = 1;
      return { set(a, b) { L = 0; for (let k = 1; k <= N; k++) { const th = (k - 0.5) / N * TAU; L += Math.hypot(a * Math.sin(th), b * Math.cos(th)); acc[k] = L; } },
        at(q) { const x = fr1(q) * L; let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] <= x) lo = m; else hi = m; } return (Math.floor(q) + (lo + (x - acc[lo]) / Math.max(acc[hi] - acc[lo], 1e-6)) / N) * TAU; } }; };
    const arcL = mkArc(), arcRg = mkArc(); arcRg.set(RING_A, RING_B);
    // THE LOOP'S SHAPE at s metres flown (time for its slow breathing): centre a0 metres ahead of the lens's place on
    // the route, r0 to its right, h0 above it; half-lengths La along the route, Lr across it, Lh in height (the far
    // side rides higher); tip: how far its long axis is tipped.
    const LS = { a0: 0, r0: 0, h0: 0, La: 0, Lr: 0, Lh: 0, tip: 0, kS: 0 };
    const loopShape = (s, time, o) => {
      const kS = smoothstep(WHEEL_D - 30, WHEEL_D + 6, s), kE = smoothstep(sBoatC - 5, sBoatC + 30, s), kC = smoothstep(sFoot - 25, sFoot + 25, s), kL = smoothstep(sLip - 180, sLip - 130, s);
      const up = smoothstep(sBoatC, sFoot, s);
      let a0 = lerp(WHEEL_D - s, 23, kS), r0 = 0, h0 = lerp(2.5, 5, kS), La = lerp(8, 5, kS), Lr = lerp(9, 6.5, kS), Lh = lerp(3, 3.5, kS);
      a0 = lerp(a0, 17, kE); h0 = lerp(h0, 5.5 + 2 * up, kE); La = lerp(La, 4.5, kE); Lr = lerp(Lr, 8.5, kE); Lh = lerp(Lh, 3.5, kE);
      a0 = lerp(a0, 13, kC); h0 = lerp(h0, 4.5, kC); La = lerp(La, 4.2, kC); Lr = lerp(Lr, 9, kC); Lh = lerp(Lh, 2.5, kC);
      a0 = lerp(a0, 14, kL); h0 = lerp(h0, 4.5, kL); La = lerp(La, 4.2, kL); Lr = lerp(Lr, 10, kL); Lh = lerp(Lh, 2.5, kL);
      r0 = 6.5 * kL * smoothstep(sLip - 180, sLip - 100, s);                    // banking away right short of the lip
      const br = 1 + 0.08 * Math.sin(time * 0.31 + PH1) * kS;                // it breathes
      o.a0 = a0; o.r0 = r0 + 1.2 * Math.sin(time * 0.19 + PH1) * kE; o.h0 = h0 + 0.4 * Math.sin(time * 0.23 + PH1 + 1) * kS; o.La = La; o.Lr = Lr * br; o.Lh = Lh * br;
      o.kS = kS; o.tip = 0.42 * Math.sin(time * 0.23 + PH1 + 2) * kC * (1 - kL);        // the climb: the long axis tips up to 24 degrees and back
      return o;
    };
    // a place d metres along the route, r to its right, h above it
    const routeAt = (d, r, h, out) => { d = clamp(d, 0.5, PL - 0.5); path.posAtDist(d, out); path.tangentAtDist(d, bT); const l = Math.hypot(bT.x, bT.z) || 1; out.x += -bT.z / l * r; out.z += bT.x / l * r; out.y += h; return out; };
    await ctx.yield();
    // EACH BIRD LIFTS OVER THE SAIL IT PASSES: from 34 m short of a jukung to 34 m past it (in full within 6 m: about
    // a second each way at the flight's speed) a bird whose course lies over that boat's sail (the sail's half-width
    // is 2.9 m x the boat's scale, and half a wingspan and 0.8 m more: it pumps and the hull drifts half a metre) is
    // raised (from 2.5 m short of the sail's edge) to pass 1.2 m over the sail's top, so the far, low side of the loop rises over each sail in turn.
    // `k` is how far the wheel has broken: a bird still in the wheel is short of the sails.
    const sailClear = (d, r, h, k) => {
      for (let b = 0; b < boats.length; b++) {
        const bt = boats[b], w = (1 - smoothstep(6, 34, Math.abs(d - bt.d))) * k; if (w <= 0) continue;
        const over = r * bt.side - (Math.abs(bt.off) - 2.9 * bt.scale - SPAN * 0.5 - 0.8), low = SAIL_TOP * bt.scale + 1.2 - (path.posAtDist(clamp(d, 0.5, PL - 0.5), bE2).y + h);
        if (over > -2.5 && low > 0) h += w * smoothstep(-2.5, 1.5, over) * low;
      }
      return h;
    };
    // THE ARRIVAL'S PEEL: while a curl of the arrival is being drawn (its own clock on the hero's timeline: from its
    // birth for five seconds) the birds on its side of the loop fly up to 5 m toward it and fall back
    const arrivals = A.arrivals.filter((a) => a.kind === 'arrival' || a.kind === 'herald').map((a) => ({ p: a.position, u: a.u }));   // (the two heralds and the three lip curls; the sky curls on the crest are kilometres off)
    const mouthR = new THREE.Vector3(); { path.tangentAtDist(Math.min(hornS + GC.lipDist[0], PL - 1), bT); mouthR.set(-bT.z, 0, bT.x).normalize(); }
    const rimCrown = GC.mouth.clone(); rimCrown.y += GC.radii[0];             // the crown of the whorl's rim (a named point: the reveal's aim)
    const hv = { r: 0, h: 0 };
    // hold (r, h) at `sr` metres past the arc's start inside the great curl's lips (5 m clear of their cusps) and
    // `ko` metres clear of the route
    const hornHold = (sr, ko) => {
      let k = 0; while (k < 5 && sr > GC.lipDist[k + 1]) k++;
      const tt = clamp((sr - GC.lipDist[k]) / (GC.lipDist[k + 1] - GC.lipDist[k]), 0, 1);
      const Ra = (k < 5 ? lerp(hornR(k + 1), hornR(k + 2), tt) : hornR(6)) + 200 * (1 - smoothstep(60, 95, sr));
      const cx = -lerp(GC.lipOff[k], GC.lipOff[k + 1], tt), cy = -lerp(GC.lipDrop[k], GC.lipDrop[k + 1], tt);
      let vx = hv.r - cx, vy = hv.h - cy, l = Math.hypot(vx, vy);
      if (l > Ra) { vx *= Ra / l; vy *= Ra / l; hv.r = cx + vx; hv.h = cy + vy; }
      l = Math.hypot(hv.r, hv.h);
      if (l < ko) {
        if (l > 0.01) { hv.r *= ko / l; hv.h *= ko / l; } else hv.h = ko;
        const cl = Math.hypot(cx, cy);
        if (Math.hypot(hv.r - cx, hv.h - cy) > Ra && cl > 0.5) { hv.r = ko * cx / cl; hv.h = ko * cy / cl; }
      }
    };
    const dMax = hornS + GC.lipDist[6] - 4;
    // THE STATE OF THE FLOCK at (u, time), worked out once and then read by each bird (prep): the loop's shape and
    // centre, the cone's frame, how far the loop has opened into the arch, and the route's frame where the lens is.
    const ST = { s0: 0, kA: 0, kOpen: 0, common: 0, rho: 0, RA: 0, RB: 0, kR: 0, wB: 0, np: 0, pr: new Float32Array(arrivals.length), ph: new Float32Array(arrivals.length) };
    const sO = new THREE.Vector3(), sW = new THREE.Vector3(), sX = new THREE.Vector3(), sY = new THREE.Vector3(), sG = new THREE.Vector3(), sT0 = new THREE.Vector3(), sR0 = new THREE.Vector3(), sLC = new THREE.Vector3();
    const openAt = (s) => smoothstep(sLip - 95, sLip - 45, s), ringAt = (s) => smoothstep(sMouth - 33, sMouth + 33, s);
    const coneFrame = (s) => {
      const kR = ringAt(s), kP = smoothstep(sPass, PL, s);
      routeAt(s + AO, 0, 0, sO); const tx = bT.x, ty = bT.y, tz = bT.z;
      sW.set(tx, ty, tz);                                                  // the arch's axis: the route's own heading at the station
      bC.subVectors(GC.core, sO); const Dc = bC.length(); if (Dc > 1e-3) bC.multiplyScalar(1 / Dc); else bC.set(tx, ty, tz);
      const kT = 1 - smoothstep(20, 60, Dc);                               // close to the seat the axis is the route's own heading
      bC.x = lerp(bC.x, tx, kT); bC.y = lerp(bC.y, ty, kT); bC.z = lerp(bC.z, tz, kT);
      sG.subVectors(GC.mouth, sO).normalize().lerp(bC, kR).normalize();    // the gaze's line (flockAt only): from the station to the great curl's mouth, then the funnel's axis
      sW.lerp(bC, kR).normalize(); sX.crossVectors(sW, upY).normalize(); sY.crossVectors(sX, sW);
      // (THE PASS: the ring flies on ahead of the station until it nears the last lip, where it hangs on the wind 6 m
      // short of it (a soft limit over about 40 m), and the lens flies through it)
      const xr = s + AO + lerp(22, 14, kR), dHold = dMax - 6;
      ST.rho = dHold - 12 * Math.log(1 + Math.exp(Math.min((dHold - xr) / 12, 60))) - s - AO; ST.RA = lerp(ARCH_R, RING_A * (1 + 0.5 * kP), kR); ST.RB = lerp(ARCH_R, RING_B * (1 + 0.5 * kP), kR); ST.kR = kR;
    };
    await ctx.yield();
    const prep = (u, time) => {
      const s0 = clamp(u, 0, 1) * PL; ST.s0 = s0;
      loopShape(s0, time, LS); arcL.set(LS.Lr, Math.hypot(LS.La, LS.Lh));
      ST.kA = openAt(s0); ST.kOpen = ST.kA * (1 - ringAt(s0));
      ST.common = PH0 + TURN * time;                                       // the loop's own phase on world time, the whole way: the arch and the ring turn with it
      path.tangentAtDist(clamp(s0, 0.5, PL - 0.5), sT0); sR0.set(-sT0.z, 0, sT0.x).normalize();
      if (ST.kA > 0) coneFrame(s0);
      // the arrival's peel: for each curl being drawn, its weight and its direction (right, up) from the loop's centre
      ST.np = 0;
      if (ST.kA < 1) {
        routeAt(s0 + LS.a0, LS.r0, LS.h0, sLC); const rx = -bT.z, rz = bT.x, rl = Math.hypot(rx, rz) || 1;
        for (let k = 0; k < arrivals.length; k++) {
          const age = (u - arrivals[k].u) * DUR; if (age <= 0 || age >= 5) continue; const w = 0.5 - 0.5 * Math.cos(age * TAU / 5);
          const ex = arrivals[k].p.x - sLC.x, ey = arrivals[k].p.y - sLC.y, ez = arrivals[k].p.z - sLC.z, er = (ex * rx + ez * rz) / rl, l = Math.hypot(er, ey) || 1;
          ST.pr[ST.np] = w * er / l; ST.ph[ST.np] = w * ey / l; ST.np++;
        }
      }
      // the formation's own centre (the loop's, the arch's or the ring's): the air that carries the flock moves with it
      if (ST.kA <= 0) sCen.copy(sLC); else { sCen.copy(sO).addScaledVector(sW, ST.rho); if (ST.kA < 1) sCen.lerpVectors(sLC, sCen, ST.kA); }
      // THE BOLT'S CHANNEL: while the hero bolt is hot and cooling, in seconds of its age on the hero's timeline
      // (boltLife: from its first stroke until its last stretch has cooled; the rule comes on over the second before
      // and lets go over the second after), no bird flies within BOLT_CLEAR metres of the drawn channel itself (see
      // birdAt): ST.wB is how far that holds. The cooled trace stays in the air after that (soga; gilded on a rare
      // visit, kain prada): the rule has let go of it and birds may cross it.
      { const age = (u - uBolt) * DUR; ST.wB = smoothstep(-1, 0, age) * (1 - smoothstep(boltLife, boltLife + 1, age)); }
    };
    // where lead bird i is in the world, in the state prep() left
    const birdAt = (i, time, out) => {
      const s0 = ST.s0, q = (ST.common + 3 * TAU / 7 + (SLOT[i] - 3) * lerp(TAU / 7, ARCH_STEP, ST.kOpen)) / TAU;   // (a seventh of a turn apart in the loop and the ring; in the arch the spacing closes about the middle bird of the seven)
      const w1 = Math.sin(time * 0.5 * BRT[i] + BPH[i]), w2 = Math.sin(time * 0.37 * BRT[i] + BPH[i] * 2), w3 = Math.sin(time * 0.33 + BPH[i] * 3);   // its own course: drifts under a wingspan
      if (ST.kA < 1) {
        const th = arcL.at(q), cs = Math.cos(th), sn = Math.sin(th);
        let a = LS.a0 - LS.La * sn + 0.8 * w3, r = LS.r0 + LS.Lr * cs * Math.cos(LS.tip) + 0.5 * w1, h = LS.h0 + LS.Lh * sn + LS.Lr * cs * Math.sin(LS.tip) + 0.45 * w2;
        for (let k = 0; k < ST.np; k++) { const al = Math.max(0, cs * ST.pr[k] + sn * ST.ph[k]), e = 5 * al * al / Math.max(Math.hypot(ST.pr[k], ST.ph[k]), 1e-3); r += e * ST.pr[k]; h += e * ST.ph[k]; }
        h = sailClear(s0 + a, r, h, LS.kS);
        routeAt(s0 + a, r, h, out);
      }
      if (ST.kA > 0) {
        const be = lerp(TAU * q, arcRg.at(q), ST.kR), wv = 1 + 0.05 * Math.sin(time * 0.41 + i * TAU * 3 / 7) * ST.kR;
        bQ.copy(sO).addScaledVector(sW, ST.rho + 1.2 * w3 * (1 - ST.kR) + (i % 2 ? 1.5 : -1.5) * (1 - ST.kR) - RING_TIP * ST.RB * wv * Math.sin(be) * ST.kR).addScaledVector(sX, ST.RA * wv * Math.cos(be) + 0.5 * w1).addScaledVector(sY, ST.RB * wv * Math.sin(be) + 0.45 * w2);
        const dg = s0 + AO + ST.rho;
        if (dg > hornS + 40) {
          // inside the great curl: the place is re-read against the route (metres along it, right of it, above it)
          // and held inside the lips and off the route's own line
          let d = clamp(dg, 1, dMax); path.posAtDist(d, bC); path.tangentAtDist(d, bT);
          d = clamp(d + (bQ.x - bC.x) * bT.x + (bQ.y - bC.y) * bT.y + (bQ.z - bC.z) * bT.z, 1, dMax);
          path.posAtDist(d, bC); path.tangentAtDist(d, bT); bR.set(-bT.z, 0, bT.x).normalize();
          hv.r = (bQ.x - bC.x) * bR.x + (bQ.z - bC.z) * bR.z; hv.h = bQ.y - bC.y;
          hornHold(Math.max(d - hornS, 0), (d > s0 ? 9 * (d - s0) / Math.max(PL - s0, 20) + 2.5 : 0) * smoothstep(60, 95, d - hornS));
          bC.addScaledVector(bR, hv.r); bC.y += hv.h; bQ.lerp(bC, smoothstep(40, 70, dg - hornS));   // (the hold comes on over 30 m)
        }
        if (ST.kA < 1) out.lerp(bQ, ST.kA); else out.copy(bQ);
      }
      if (ST.wB > 0) {
        // the nearest point of the drawn channel (the polyline from its top to its foot) to this bird: within
        // BOLT_CLEAR metres of it the bird is moved straight away from that point (on the channel itself: to the
        // route's left, the side the route passes it on)
        let best = 1e12;
        for (let k = 0; k < boltCh.length - 1; k++) {
          bE1.subVectors(boltCh[k + 1], boltCh[k]); bE2.subVectors(out, boltCh[k]);
          const d2 = bE2.addScaledVector(bE1, -clamp(bE2.dot(bE1) / Math.max(bE1.lengthSq(), 1e-6), 0, 1)).lengthSq();
          if (d2 < best) { best = d2; bC.copy(bE2); }
        }
        const l = Math.sqrt(best);
        if (l < BOLT_CLEAR) { if (l > 0.01) bC.multiplyScalar(1 / l); else bC.copy(sR0).multiplyScalar(-1); out.addScaledVector(bC, (BOLT_CLEAR - l) * ST.wB); }
      }
      return out;
    };
    // THE GAZE'S POINT WITH THE FLOCK (flockAt, one poi): the loop's own centre on the route's line (the birds bank
    // away right of it short of the lip and the gaze lets them go); then, over the lip, a point 22 m from the station
    // on the line to the great curl's mouth (sG), so the gaze begins to level before the crest and comes over the lip
    // onto the whorl without a lurch (the arch turns round the route's heading beside that line: it does not follow
    // the gaze and the gaze does not follow it); then the middle of the ring's plane on the funnel's axis. It passes
    // from the loop's centre to that point between 190 and 20 m short of the lip. A pure function of (u, time).
    const fcA = new THREE.Vector3(), fcB = new THREE.Vector3();
    await ctx.yield();
    const flockAt = (time, u) => {
      const s0 = clamp(u, 0, 1) * PL, kG = smoothstep(sLip - 190, sLip - 20, s0);
      loopShape(s0, time, LS); routeAt(s0 + LS.a0, 0, LS.h0, fcA);
      if (kG > 0) { coneFrame(s0); fcB.copy(sO).addScaledVector(sG, Math.max(ST.rho, 6)); fcA.lerp(fcB, kG); }
      return fcA;
    };
    await ctx.yield();
    const KC = [new THREE.Vector3(66 + shiftAt(-22, A.shift), 96, -22), new THREE.Vector3(-74 + shiftAt(-168, A.shift), 198, -168)];
    const kettle = [];
    for (let i = 0; i < nKettle; i++) { const rad = wr.range(14, 44); kettle.push({ k: i % 2, rad, h: wr.range(-14, 44), a0: wr.range(0, TAU), w: (11 / rad) * (i % 2 ? 1 : -1) * wr.range(0.85, 1.15), sc: wr.range(1.0, 1.35), ph: wr.range(0, TAU) }); }
    // forward f (unit), bank b (radians, negative = right wing down), scale s -> instance matrix
    const setBird = (i, p, f, bank, s) => {
      bR.crossVectors(upY, f); if (bR.lengthSq() < 1e-6) bR.set(1, 0, 0); bR.normalize(); bU.crossVectors(f, bR);
      const cb = Math.cos(bank), sb = Math.sin(bank);
      bR.multiplyScalar(cb).addScaledVector(bU, sb); bU.crossVectors(f, bR);
      m4.makeBasis(bR, bU, f).scale(sc.setScalar(s)).setPosition(p);
      birdMesh.setMatrixAt(i, m4);
    };
    await ctx.yield();
    const sCen = new THREE.Vector3();
    const BDT = 0.09, AIR = 9, PA = [], PB = [], PM = [], HD = [], bankNow = new Float32Array(nLead), pitchNow = new Float32Array(nLead); let bankU = -1;
    const bSa = new THREE.Vector3(), bSb = new THREE.Vector3(), bTh = new THREE.Vector3();
    // THE LIP'S LIFT, a field of the place: the inflow that runs up the face turns up over the lip. The air rises at
    // 5.2 m/s on the lip's own line (the line through the notch across the route's heading there), comes on from
    // 60 m short of that line and is spent 40 m past it. `p` is a place in the world: the lift there depends on
    // nothing but how far p lies from the lip's line.
    const liftAt = (p) => { const d = (p.x - A.lipNotch.x) * lipT.x + (p.z - A.lipNotch.z) * lipT.z; return 5.2 * smoothstep(-60, 0, d) * (1 - smoothstep(0, 40, d)); };
    for (let i = 0; i < nLead; i++) { PA.push(new THREE.Vector3()); PB.push(new THREE.Vector3()); PM.push(new THREE.Vector3()); HD.push(new THREE.Vector3(0, 0, -1)); }
    const placeBirds = (u, time, dt) => {
      // (seen through the previous world's portal u stays 0 while time runs: only the wheel's own turning counts there)
      // (the bank eases toward what the turn asks for over about a fifth of a second; it is set outright on the first
      // frame and after any jump of the flight)
      const cont = bankU >= 0 && Math.abs(u - bankU) < 0.002, ease = dt > 0 && dt < 0.2 && cont ? 1 - Math.exp(-dt * 5) : 1; bankU = u;
      const du = (BDT / DUR) * smoothstep(0, 0.004, u);
      prep(u - du, time - BDT); for (let i = 0; i < nLead; i++) birdAt(i, time - BDT, PA[i]); bSa.copy(sCen);
      prep(u + du, time + BDT); for (let i = 0; i < nLead; i++) birdAt(i, time + BDT, PB[i]); bSb.copy(sCen);
      prep(u, time); for (let i = 0; i < nLead; i++) birdAt(i, time, PM[i]);
      // THE AIR THE FLOCK RIDES is the inflow: it moves with the formation's own centre (still while the wheel stands
      // at its station, up the route once it has broken; bSb - bSa is how far the centre went) and over the lip it
      // turns up (liftAt, read where each bird is). Each bird's attitude is its flight THROUGH THAT AIR:
      bTh.set(sT0.x, 0, sT0.z).normalize();
      for (let i = 0; i < nLead; i++) {
        const p = PM[i], a = PA[i], b = PB[i];
        // heading: where it flies through the air (a frigatebird soars: it keeps its body nearly level, a third of
        // its path's climb); one that hangs in its place in the formation still flies AIR m/s up the route to stay
        // up; and in rising air it flies nose down (it sinks through the lift as fast as the lift carries it up)
        bF.subVectors(b, a).sub(bSb).add(bSa).multiplyScalar(1 / (2 * BDT)); bF.y *= 0.35;
        const sp = bF.length();
        bF.addScaledVector(bTh, AIR * (1 - smoothstep(0.2 * AIR, 0.7 * AIR, sp)));
        { const hm = Math.hypot(bF.x, bF.z); if (hm < 3) bF.addScaledVector(bTh, 3 - hm); }
        const hm = Math.hypot(bF.x, bF.z) || 1; let pitch = clamp((bF.y - liftAt(p)) / hm, -0.84, 0.84);   // (never steeper than 40 degrees)
        let hx = bF.x / hm, hz = bF.z / hm;
        if (cont && dt > 0 && dt < 0.2) {                                       // (it comes about at most 200 degrees a second)
          const h0 = HD[i], ang = Math.atan2(h0.x * hz - h0.z * hx, h0.x * hx + h0.z * hz), mx = 3.5 * dt;
          pitch = pitchNow[i] + clamp(pitch - pitchNow[i], -1.2 * dt, 1.2 * dt);   // (and noses up or down at most 60 degrees a second)
          if (Math.abs(ang) > mx) { const a = (Math.abs(ang) > 3.1 ? Math.sign(TURN) : Math.sign(ang)) * mx, c = Math.cos(a), sn = Math.sin(a); hx = h0.x * c - h0.z * sn; hz = h0.x * sn + h0.z * c; }
        }
        HD[i].set(hx, 0, hz); pitchNow[i] = pitch; bF.set(hx, pitch, hz).normalize();
        // bank: the lift it needs for its own turn (the level part of its acceleration across its heading)
        bC.copy(a).add(b).addScaledVector(p, -2).multiplyScalar(1 / (BDT * BDT)); bC.y = 0; bC.addScaledVector(bF, -bC.dot(bF));
        bL.crossVectors(upY, bF); if (bL.lengthSq() < 1e-6) bL.set(1, 0, 0); bL.normalize();
        { const want = (clamp(-Math.atan2(bC.dot(bL), 9.8), -1.13, 1.13) - bankNow[i]) * ease;
          bankNow[i] += ease < 1 ? clamp(want, -2.4 * dt, 2.4 * dt) : want; }                   // (it rolls at most 140 degrees a second)
        const bank = bankNow[i] + 0.11 * Math.cos(time * 0.5 + BPH[i]);
        bV.crossVectors(bF, bL);
        bR.copy(bL).multiplyScalar(Math.cos(bank)).addScaledVector(bV, Math.sin(bank)); bU.crossVectors(bF, bR);
        birdMesh.setMatrixAt(i, m4.makeBasis(bR, bU, bF).scale(sc.setScalar(GSC)).setPosition(p));
      }
      for (let i = 0; i < nKettle; i++) {
        const q = kettle[i], a = q.a0 + q.w * time, c = KC[q.k], dir = Math.sign(q.w);
        bP.set(c.x + Math.cos(a) * q.rad, c.y + q.h + 2.5 * Math.sin(time * 0.3 + q.ph), c.z + Math.sin(a) * q.rad * 0.8);
        bF.set(-Math.sin(a) * dir, 0.04 * Math.cos(time * 0.3 + q.ph), Math.cos(a) * 0.8 * dir).normalize();
        setBird(nLead + i, bP, bF, dir * 0.55, q.sc);
      }
      birdMesh.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();

    // ---- rain: slanted sheets under the shelf (count by seed) and three across the canyon that we fly through ----------
    const sheets = [];
    const nUnder = Math.round(lerp(4, 30, rainK) * density);
    for (let i = 0; i < nUnder; i++) {
      const x = wr.range(-1500, 1500) * (i < 6 ? 0.25 : 1), t = wr.range(0.1, 0.92), z = -(x / 3000) * (x / 3000) * 520 - t * 380, H = 36 + 30 * t;
      sheets.push({ x, y: H * 0.5 - 2, z, yaw: wr.range(-0.3, 0.3), w: wr.range(110, 200), h: H, bw: wr.range(14, 20) });
    }
    const tn = new THREE.Vector3();
    for (const us of [0.605, 0.633, 0.661]) {
      const p = path.pointAt(us); path.tangentAt(us, tn);
      sheets.push({ x: p.x, y: p.y - 6, z: p.z, yaw: Math.atan2(tn.x, tn.z), w: 104, h: 104, bw: wr.range(8, 10.5) });      // square across the route: we fly through them
    }
    await ctx.yield();
    const sheetGeo = new THREE.PlaneGeometry(1, 1);
    // (THE RAIN THINS, see SHEET_FRAG: the line from the canyon's end to the great curl's mouth, and the rim's own radius)
    const tubeA = { value: new THREE.Vector4(A.canyon.to.x, A.canyon.to.y, A.canyon.to.z, A.greatCurl.radii[0]) }, tubeB = { value: A.greatCurl.mouth.clone() };
    const sheetU = { uSheetA: { value: 0.85 }, uTubeA: tubeA, uTubeB: tubeB };
    const sheetMesh = new THREE.InstancedMesh(sheetGeo, mat(SHEET_VERT, SHEET_FRAG, sheetU, { transparent: true, depthWrite: false }), sheets.length);
    { const aS = new Float32Array(sheets.length * 4);
      sheets.forEach((s, i) => {
        eul.set(0, s.yaw, 0); m4.compose(bP.set(s.x, s.y, s.z), qt.setFromEuler(eul), sc.set(s.w, s.h, 1)); sheetMesh.setMatrixAt(i, m4);
        aS[i * 4] = s.w; aS[i * 4 + 1] = s.h; aS[i * 4 + 2] = s.bw; aS[i * 4 + 3] = wr();
      });
      sheetGeo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); }
    sheetMesh.frustumCulled = false; sheetMesh.renderOrder = 3; sheetMesh.name = 'udan-liris'; scene.add(sheetMesh);

    await ctx.yield();
    // loose dashes round the lens, only behind the lip (window on u)
    const nDash = Math.round(1200 * detail);
    const dashGeo = new THREE.InstancedBufferGeometry();
    { const q = new THREE.PlaneGeometry(1, 1); dashGeo.setIndex(q.getIndex()); dashGeo.setAttribute('position', q.getAttribute('position'));
      const off = new Float32Array(nDash * 3), ar = new Float32Array(nDash);
      for (let i = 0; i < nDash; i++) { off[i * 3] = wr(); off[i * 3 + 1] = wr(); off[i * 3 + 2] = wr(); ar[i] = wr(); }
      dashGeo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3)); dashGeo.setAttribute('aR', new THREE.InstancedBufferAttribute(ar, 1));
      dashGeo.instanceCount = nDash; }
    const dashU = { uTime: U.uTime, uPix: { value: 0.0027 }, uRain: { value: 0 }, uCamW, uTubeA: tubeA, uTubeB: tubeB, uCream: { value: pal.line }, uEdge: { value: pal.ramp[3] } };
    const dashMesh = new THREE.Mesh(dashGeo, new THREE.ShaderMaterial({ uniforms: dashU, vertexShader: DASH_VERT, fragmentShader: DASH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    dashMesh.frustumCulled = false; dashMesh.renderOrder = 5; dashMesh.name = 'rain-dashes'; scene.add(dashMesh);
    await ctx.yield();

    // ---- gold: sparks turning round the portal's rim, and (night cloth) one lamp dot per boat ---------------------------
    const nSpark = 9, sparkPos = []; for (let i = 0; i < nSpark; i++) sparkPos.push([seat.position.x, seat.position.y, seat.position.z]);
    const sparks = makeGlows({ positions: sparkPos, color: '#E3A72A', size: 1.5, intensity: 2.0, halo: 0.35, core: 1, fogAmount: 0, sizeJitter: 0.3, rng: wr });
    scene.add(sparks.object);
    const e1 = new THREE.Vector3().crossVectors(upY, seat.normal).normalize(), e2 = new THREE.Vector3().crossVectors(seat.normal, e1).normalize();
    let lamps = null;
    if (mood.lamps) {
      const lp = []; for (let i = 0; i < boats.length; i++) lp.push([0, -50, 0]);
      lamps = makeGlows({ positions: lp, color: '#FFC25A', size: 2.4, intensity: 1.8, halo: 0.5, core: 1, fogAmount: 0.3, rng: wr });
      scene.add(lamps.object);
    }
    const lampOff = new THREE.Vector3();

    // ---- POIS: where the gaze goes -------------------------------------------------------------------------------------
    // Four pulls, each alone on its point and each under 1:
    //   the flock    flockAt. THE GAZE GOES WITH THE BIRDS up the face (the loop's own centre, from the wheel's break)
    //                and in the funnel (the ring's centre, to 40 m past the great curl's mouth). OVER THE LIP IT DOES
    //                NOT: there it holds a point 22 m from the station toward the great curl's mouth, while the arch
    //                turns beside it round the route's heading
    //   the arrival  the point between the two arrival curls that flank the notch, while they are drawn
    //   the reveal   the crown of the whorl's rim (rimCrown), from 95 m short of the lip (where the loop opens into
    //                the arch) to the bolt: the gaze comes down from the climb's pitch onto the rim
    //   the funnel   a point carried along the route ahead of the lens by the great curl's own length (from the arc's
    //                start to its last lip), so the aim runs round the arc ahead of us and comes to rest on the
    //                portal's seat: one pull that spreads the sweep, from where the arch stands to the last straight
    const arrivalC = new THREE.Vector3(A.shift + 30, 285, -346);            // between the two arrival curls that flank the notch
    const aim = new THREE.Vector3(), aimLead = GC.lipDist[6];
    const uOpen = (sLip - 95) / PL, uArch = (sLip - 45) / PL;
    const pois = [
      { at: flockAt, from: WHEEL_D / PL, to: (sMouth + 40) / PL, weight: 0.45, fade: 0.12 },
      { at: arrivalC, from: 0.33, to: 0.46, weight: 0.35 },
      { at: rimCrown, from: uOpen, to: uBolt, weight: 0.25, fade: 0.4 },
      { at: (t, u) => path.posAtDist(Math.min(u * PL + aimLead, PL), aim), from: uArch, to: 0.96, weight: 0.9, fade: 0.4 },
    ];

    // ---- POST: exposure, bloom, grade (fog is the cloth, set above) ---------------------------------------------------
    const P = mood.post;
    const post = {
      exposure: P.exposure,
      bloom: { strength: 0.3, radius: 0.5, threshold: 1.1 },
      grade: { saturation: P.sat, contrast: P.con, tint: P.tint, shadowTint: P.shadow, vignette: P.vig, grain: 0.035, aberration: 0 },
    };

    const camW = uCamW.value, size = new THREE.Vector2();
    return {
      scene, path, duration: DUR, title: mood.title,
      camera: { fov: 62, near: 0.5, far: 5200, lookAhead: 30, sway: 0.5, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 7, color: mood.portal, glow: 1, revealDistance: 450 },
      post, ride: 'none', style: 'none',
      update(dt, time, camera, u) {
        u = clamp(u || 0, 0, 1);
        const sec = u * DUR;
        hero.setProgress(u); hero.update(dt, time, camera);
        camW.setFromMatrixPosition(camera.matrixWorld);
        // sea: the grid rides the marching bands and re-snaps by whole cells
        const march = MARCH * time, ca = camW.x * TX + camW.z * TZ, cb = camW.x * NX + camW.z * NZ - march;
        seaU.uMarch.value = march; seaU.uOrigin.value.set(Math.round(ca / cellA) * cellA, Math.round(cb / cellB) * cellB);
        seaU.uDotT.value = time * 2.2;
        seaU.uShelf.value = 70 + 45 * smoothstep(0.05, 0.3, u);                 // the overdye band wicks south to meet us: it lies 20-110 m ahead at 8 s and passes under at 8.5-9.5 s
        // boats (hove-to) and the dot rings the sea draws round their hulls
        for (let i = 0; i < boats.length; i++) { const bt = boats[i]; placeBoat(bt, fleet, i, time, camW.x, camW.z, 2.4); seaU.uBoat.value[i].set(bt.pos.x, bt.pos.z, bt.yawNow, 1); }
        fleet.instanceMatrix.needsUpdate = true;
        // the offerings ride the swell, turning slowly
        for (let i = 0; i < offs.length; i++) {
          const o = offs[i], ox = o.x + 0.4 * Math.sin(time * 0.17 + o.ph), oz = o.z + 0.5 * Math.sin(time * 0.13 + o.ph * 2);
          const h0 = swellAt(ox, oz, time, camW.x, camW.z), h1 = swellAt(ox + 0.5, oz + 0.5, time, camW.x, camW.z);
          eul.set((h1 - h0) * 0.9, o.ph + time * 0.12, (h0 - h1) * 0.9 + 0.05 * Math.sin(time * 1.3 + o.ph));
          m4.compose(bP.set(ox, h0 * 0.92 + 0.02, oz), qt.setFromEuler(eul), sc.setScalar(o.sc)); offMesh.setMatrixAt(i, m4);
          seaU.uOff.value[i].set(ox, oz, o.ph);
        }
        offMesh.instanceMatrix.needsUpdate = true;
        if (lamps) {
          for (let i = 0; i < boats.length; i++) { const bt = boats[i]; lamps.setPosition(i, bt.pos.x + Math.sin(bt.yawNow) * 4.6 * bt.scale, bt.pos.y + 2.46 * bt.scale, bt.pos.z + Math.cos(bt.yawNow) * 4.6 * bt.scale); }
          lamps.update(dt, time);
        }
        // birds
        placeBirds(u, time, dt);
        // rain round the lens: only behind the lip, and gone before the great curl comes into line
        const rain = smoothstep(0.57, 0.6, u) * (1 - smoothstep(0.655, 0.69, u));
        dashU.uRain.value = rain; dashMesh.visible = rain > 0.01;
        ctx.renderer.getDrawingBufferSize(size);
        dashU.uPix.value = (2 * Math.tan((camera.fov || 62) * Math.PI / 360)) / Math.max(size.y, 1);
        // sparks turning round the rim
        for (let i = 0; i < nSpark; i++) {
          const a = (i / nSpark) * TAU - time * 0.22, r = 8.9 + 0.35 * Math.sin(time * 1.3 + i * 2.1);
          lampOff.copy(seat.position).addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r).addScaledVector(seat.normal, 0.8);
          sparks.setPosition(i, lampOff);
        }
        sparks.update(dt, time);
      },
      dispose() {},
    };
  },
};
