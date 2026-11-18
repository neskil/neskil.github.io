// The world fields-of-gazing-grain. The ride is the driver's seat of an empty open carriage drawn by two grey horses
// along ONE ROAD that bends and rolls (468.3 m at one constant pace of 9.4 m a second, 49.8 s) through six places,
// each an hour of one day laid along the road:
//   (1) s 0 to 106, afternoon: THE SCHOOL AS A PLACE. Ahead from the first metre the worn ring (9 m from the line) and
//       the schoolhouse (porch 16 m from the line) with pump, woodpile, cupola and bell, its gable toward the road a
//       face (a tall shuttered window on each hand of the panelled door, the door's hood on two posts, a vent in the
//       peak); four maples with their trunks, their shade on the mown yard (clover and dandelions in drifts, worn
//       bare on the path from the gate to the porch, under the swings and at the pump); two rope swings swaying; the
//       yard's white picket fence 3.5 m left with its gate; a dry stone wall 4 m right with the white house and its
//       washing in the wind behind it; hens running and hopping on the right verge; the village in two layers down
//       the first bend. (No maple's shade can fall on the schoolhouse: the sun stands on the road's right, the maples
//       beside and behind the house.)
//   (2) s 106 to 214, the gold hour: THE WHEAT on its swells from the stone gateposts to the crest; the red barn with
//       silo and the lane's six elms where the second bend points the road; the pasture wall, the hay wagon out in
//       the pasture on its cart track (23 m from the line), five cattle lying; the reaped strip with its shocks on the right; swallows low beside the road.
//   (3) s 214 to 290, sunset: THE REACH on the right from the crest (no water in sight until 15 m before its top), reeds and their
//       gaps, the leaning alder on its low point, herons, geese low over the water; left of the road the flank goes
//       down to the wet meadow as turf in hummocks and hollows with sedge and a few pools (no rows, no shocks there).
//   (4) s 290 to 366, dusk: THE WET MEADOW on one even rough ground under its dew. Thistles, sedge, tall flowers, the rail
//       fence, the plank culvert, twelve great webs and hundreds of small, the mist in a few clear heaps by place (soft tops,
//       no level sheet, clear air between them), fireflies, bats, two deer grazing.
//   (5) s 322 to 378, the moon: THE LAST BEND ROUND THE LOW RISE (its crest under the eye), the old roof's ridge along
//       it, the pale cornice at its near end, the old oak; white flowers thick about it.
//   (6) s 378 to 468 and on, night toward first light: THE LAST ROAD on its grassy bank between two floods that hold the
//       stars, a post and rail fence on both shoulders, nine great elms singly and in twos and threes well back from
//       the line (no avenue), low mist on the flood and the bank's foot, low dark hills, the line of first light along the horizon.
//       THE ROAD RUNS ON TO THE VANISHING POINT: road, ruts, bank, both fences, the flood's edge and the elms' islands are
//       built ground for 1500 m past the ring (the fences for 300 m of it, as far as the ground lies in fine strips), to the
//       far hills black against the first light.
//       THE WAY OUT is the engine's plain ring on that road. THE WORLD SETS portal.drawWithin: the ring and its window are left
//       undrawn while more than that of the route is left to fly. The figure is a sum of the place: the ring's crown stands its
//       radius (7 m) over the eye's line, the band of first light thins out to nothing 13 degrees up (FIRST.top), so the crown
//       stands in the night blue above that band within 7 / tan(13 degrees) = 30.3 m; revealDistance is the same figure.
//       THE WORLD SETS NO LIGHT AND NO IMAGE OF THE RING ANYWHERE: nothing glows, shines on the road, the flood, the fences or
//       the pair, or is mirrored for it; no glow, no halo, no rim is asked of the engine; its veil is one flat colour, the
//       night sky's own at the ring's crown.
//
// DECLARED HERE (and at the head of the part, src/parts/fields-of-gazing-grain.js):
// (1) THE OWNER'S EXCEPTION, term c, the owner's YES of 23:05 on 10-12: THE HOURS ARE PLACES AND ONE HOUR IS IN THE PICTURE
//     AT A TIME. The sky, the sun's height, the day's veil, the dusk band, the key, the fill, the shade and the air of the
//     whole picture are ONE ROW of one table: the row at the eye's place on the road. EXACTLY THIS READS THE EYE'S PLACE,
//     all of it in update(): (a) the one row (the road point nearest the camera's own position, road.locate, then
//     hours.setEye: eight lines of the table into uRow), which every surface, both waters, the wheat, the pair, the mist and
//     every flock take; (b) the scene's fog, set to that row's air; (c) the sky's dome, centred on the camera as a sky is;
//     (d) the pair and the carriage, which stand on the eye (3); (e) the kit's own update of the flocks, which is handed the
//     camera and the route parameter as the kit asks (the kit rests a flock that is beyond its own reach of the camera;
//     the world sets nothing by either). Nothing else reads it; nothing reads metres flown, the route parameter, the
//     clock or the seed for the hour.
//     THE JOINS, each smooth between two places read from makePlaces (the part's HOURPLACES; a point of the land is
//     taken abeam of the road by sum): the yard's gate to the stone gateposts (s 62 to 106); the hay wagon's gateway to
//     the crest (164 to 214.0); the alder's point abeam to the wet meadow's first fence post (243.6 to 290); the plank
//     culvert to the old oak abeam (306 to 344.9); the flood's head on the right to the further right-hand elm abeam
//     (366 to 410). The rows' colours, the air, the dew and the standing mist change in the joins only.
//     WHAT CHANGES OUTSIDE THE JOINS, by stretch: THE SUN'S HEIGHT falls the whole way from the entry to the culvert
//     (48 degrees up at s 0 and behind it, 34 at the gate 62, 20 at the gateposts 106, 10 at the wagon's gateway 164,
//     3 at the crest 214.0, its centre on the rim with the alder's point abeam 243.6, the last of its disc under where
//     the shore leaves the road 282, 6 under from the culvert 306 on); THE DAY'S VEIL is whole to the crest (214.0) and
//     thins from there to nothing at the culvert (306), so the stars, the moon and the first light come out over the
//     shore and the meadow's first fence; THE AFTERGLOW rises from the alder's point abeam (243.6), is full where the
//     shore leaves the road (282) and is gone at the flood's head (366).
//     ctx.vary.hour is therefore not honoured as an hour: every visit holds all six.
//     CONSTANTS BY DIRECTION, in no row: the sun's one bearing (80) for the whole road, its height the row's; the
//     star field (one piece turning about its pole, 42 up at bearing 145, one degree in ten seconds of the world
//     clock); the one moon (6 degrees across, 9 up at bearing 2); the line of first light (centred on bearing -58,
//     full to 55 degrees either side, nothing beyond 70, thinning out by 13 degrees up) and the one bright star (16 up
//     at bearing -80: 22 degrees left of the last straight's heading, never over the road's end).
//     Only the day's veil outshines them. Lamps, fireflies and the far lights keep their own strength always.
//     WHAT STANDS (mist, dew, webs, flowers) stands by its own place and is only lit by the eye's row.
// (2) THE WHEAT FACES THE ROAD: a rule of each stalk's own place, fixed at build; it never reads the eye. No ear comes
//     nearer the road's line than 2.0 m, lean, wind and all; every block of standing wheat ends in a ragged edge (the part).
// (3) THE PAIR AND THE CARRIAGE ARE WHAT THE RIDE WEARS. THE PAIR'S STATION, ONE AND CONSTANT ON THE EYE at every metre: the
//     dash rail 2.2 m ahead of the eye and 1.05 m below it, a lamp 0.8 m to each hand; the croups 3.2 m ahead, the withers
//     4.5 m ahead, the polls 5.7 m ahead and 0.35 m below the eye; each horse 0.5 m to its own hand of the line; the hooves
//     on the road 2.6 m below the eye. ITS ONE STATE: the same walk, head carriage and rhythm at every place, on the world
//     clock; it begins, turns and ends nothing; it is hidden only while the world is seen through a portal (ctx.through).
//     IT STANDS ON THE EYE'S OWN PLACE (the camera's position of the frame); it is given no metres flown, no route
//     parameter and no clock for its place or its light. IN BENDS AND ON SLOPES the group lies along the road's own line and
//     slope at that place, and the necks turn into the bend by 0.35 of the road's own turning over the 12 m about the
//     withers, never more than that share of the road's least bend (4.0 degrees): the same in every bend.
//     WHAT DRIVES THE COAT'S DARK, THE BREATH AND THE MOTHS: THE TABLE'S ROW AT THE PAIR'S OWN PLACE (the withers' metre of
//     road, 4.5 m ahead of the eye's road point) and nothing else. THE COAT'S DARK is the row's SUN there: nought while its
//     centre stands on the rim or over it (the alder's point abeam, 243.6), whole when the last of its disc is under, 3
//     degrees down (the shore's end, 282): so the pair goes pale to dark while the eye passes s 239.1 to 277.5, as the sun
//     itself goes down (its disc is in the picture about s 182 to 272). THE BREATH AND THE MOTHS are the row's DEW there:
//     nought to 243.6, whole from 265.0 where the dew figure passes a half (the eye's s 239.1 to 260.5). The stars and the
//     first light over the pair come out with the row's VEIL, like every far light.
//     FROM THE SHORE'S END TO THE RING THE PAIR IS THE SAME TWO PALE HORSES IN THE DARK: the coat a dark shade of the hour's
//     colour that keeps its form (its light bent under one ceiling, a tenth of its afternoon value and never over the row's
//     low band), the thin rims no brighter. THE LAMPS' LIGHT ON THE PAIR IS ONE CONSTANT from the first metre: a warm
//     edge on the faces turned outward to each lamp's own side, never over half the coat's afternoon value, gone 2.3 m from
//     the flame (before the withers); it only shows as the row's light sinks.
// (4) PACE: one constant pace from the first metre to the last; nothing of the pair, its gait or the pace differs at
//     any place. THE GAZE is one look for the whole road, found from built places (the worn ring, the barn, the far
//     rim of the reach under the sun's bearing, the cornice, the road's far end). Each look leans toward its place by
//     the bearing to it, HELD AT ITS LIMIT of 15 degrees (12 in a bend), times a smooth weight; the sum with the
//     look-ahead stays within 24 degrees of the road's heading. THE LOOK HAS HELD TOPS: three weights stand whole
//     between their ramps (the barn from the yard's gate 62 to the second bend's end 148.9; the water's far rim from
//     the barn's far end abeam 190.1 to the fourth bend's start 259.0; the cornice from the fourth bend's end 290.4
//     to the cornice abeam 324.5) and the last from the last bend's end 378.3 on; the worn ring's is whole at one
//     point (maple A abeam, 38.0). Every end of every window is a place read from makePlaces.
// (5) THE LAYING OF THE LINE. The last bend lies before the ring, and the alder carr with its reed and underwood, the
//     thicket at the flood's edge inside that bend, the ridge wood and the old oak stand so that from every metre of
//     road up to 25 m before the last bend's end every line from the eye to the ring's centre, top and sides is
//     crossed by something that stands (the part's dealStanding). No law of the world hides or
//     dims the ring. Nothing of the world is shown or hidden by where the eye is: what lies beyond the crest (the
//     shore's and the meadow's plants, the images in the waters, the reeds at the flood's edge, the last road's
//     ground past the ring) stands in the world always, like everything else.
// (6) MEDIA AND BODIES. Media (thin matter the ride passes through): the mist, chaff, smoke, falling leaves, moths,
//     breath. Bodies keep 2 m and more of clear air from the flown line by place. Three small instance buffers are
//     written each frame: the hens', the cattle's ears and the cattle's tails.
// The seed deals (each thing from a stream of its own by name and seed; the visit's density only shows or hides a flower
// that is dealt on every visit, and deals no standing thing anew; a denser visit's further flowers come from streams of
// their own (named whitemore and flowersmore); the flank's sedge has the stream flanksedge): the wind and the wheat's tone, the ruling
// wild flower, the reed belt's gaps, the bank's broad places, the swells' shapes away from the road, every tree's form,
// the playthings, washing, hens, cattle, shocks, webs, deer's beats, hills' outlines, clouds, and the falling stars.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import { EYE, makeRoad, makeHours, bakeSmap, hourUniforms, GLSL_HOURS, GLSL_ROW, GLSL_CAST, makeGeo, litMaterial, buildPair, STATION, wheatColours, wheatUniforms, makeWheat, WHEAT,
  groundUniforms, groundMaterial, groundGrid, linear, bearingDir, SUN_BEARING, MOON, POLE, FIRST, AFTERGLOW, NCAST, REACH_Y, FLOOD_Y, BANK_Y, bankEdge, bankRun,
  streamOf, dealLand, dealElms, dealStanding, shockGeometry, shoreEdge, hollowAt, HOLLOW } from '../parts/fields-of-gazing-grain.js';

const RAD = Math.PI / 180;
// THE WAY OUT IS LEFT UNDRAWN UNTIL ITS CROWN STANDS IN THE NIGHT BLUE (portal.drawWithin, metres of route left). The figure is a sum of
// the place and of nothing else: the ring's crown stands its radius over the eye's line; the band of first light thins out to nothing at
// FIRST.top degrees up (the sky's own figure, the part); the crown stands higher than that top from radius / tan(top) metres on.
const RING_RADIUS = 7, DRAW_WITHIN = RING_RADIUS / Math.tan(FIRST.top * RAD);
// EVERY STREAM OF THIS WORLD, each by its own name and the seed (streamOf), all taken in this order at the head of
// build() before anything is built; every name is drawn from. STREAMS THAT SERVE SEVERAL THINGS, IN BUILD ORDER (a
// change to an earlier one deals the later ones anew; they are not split, which would deal the world anew): 'walls':
// the two stone gateposts, the split rails beside the wheat, the pasture's wall and its gateway, then the school's
// wall; 'fence': the last road's two fences, the wet meadow's fence, the culvert's planks, the yard's pickets and
// gate. (Within one loop each: 'stones' the bank's reeds, stones and white flowers; 'thistles' thistles, sedge and
// tall flowers; 'webs' the great webs, their stalks and the small webs; 'village' its houses, washing and trees.) Each of these for one thing:
// 'shoreline' (reeds and sedge along the shore left of the road), 'oakfoot' (the old tree's flared foot and roots),
// 'henflap' (the beat on which each hen hops). The land and what stands on it by rule are dealt in the
// part from streams of their own by the same rule ('reach', 'bank', 'swells', 'ground' in dealLand; 'elms' in dealElms;
// 'carr', 'thicket', 'ridgewood' in dealStanding): one deal of the land and its trees, beside the land's law.
const STREAMS = ['deal', 'pair', 'rows', 'puddles', 'school', 'ring', 'swings', 'washing', 'village', 'maples', 'verge', 'flowers', 'walls', 'hens', 'clouds', 'smoke', 'leaves', 'chaff',
  'swallows', 'lane', 'cattle', 'wagon', 'shocks', 'woodform', 'reeds', 'herons', 'geese', 'dragonflies', 'alder', 'rings', 'thistles', 'webs', 'mist', 'fireflies', 'bats', 'deer',
  'carrtone', 'rise', 'oak', 'elmtone', 'fence', 'stones', 'hills', 'fall', 'shoreline', 'oakfoot', 'henflap', 'whitemore', 'flowersmore', 'flanksedge', 'fencefar'];
const v3 = (c) => `vec3(${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)})`;
const MOON_DIR = bearingDir(MOON.bearing, MOON.up), POLE_DIR = bearingDir(POLE.bearing, POLE.up), STAR_DIR = bearingDir(FIRST.starBearing, FIRST.star);

// GLSL: THE SKY BY DIRECTION, in the one row of the eye's place (uRow). The same function paints the dome and, along
// the mirrored ray, the waters. The far lights are constants by direction in no row: the stars (one field, turning as
// one piece about its pole on the world clock), the one moon, the line of first light with its one star. Only the
// day's veil (uRow[1].a) outshines them; nothing moves, sizes or strengthens them.
const GLSL_SKY = /* glsl */`
uniform vec4 uCloud, uFallT, uFallPh; uniform vec3 uFall; uniform float uStarK;
float skyFbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * hNoise(p); p = p * 2.03 + 17.3; a *= .5; } return s; }
vec3 skyStars(vec3 d, float px){
  vec3 ax = ${v3(POLE_DIR)}; float an = -uTime * ${(RAD / 10).toFixed(6)}, c = cos(an), s = sin(an);
  vec3 r = d * c + cross(ax, d) * s + ax * dot(ax, d) * (1. - c);
  vec3 p = r * 46., cell = floor(p);
  vec3 h = fract(sin(vec3(dot(cell, vec3(127.1, 311.7, 74.7)), dot(cell, vec3(269.5, 183.3, 246.1)), dot(cell, vec3(113.5, 271.9, 124.6)))) * 43758.5453);
  vec3 sp = normalize(cell + .2 + .6 * h); float e = fract(h.x * 91.7 + h.y * 37.3);
  float size = mix(.0011, .0026, e * e * e), rr = max(size, px * .9), dist = length(sp - r);
  float star = (1. - smoothstep(rr * .35, rr, dist)) * (size * size) / (rr * rr) * step(h.z, .34 * uStarK);
  float tw = .8 + .2 * sin(uTime * (1.5 + 4. * h.x) + h.y * 40.);
  return mix(vec3(.75, .84, 1.), vec3(1., .9, .76), h.y) * (star * tw * (.5 + 2.2 * e * e));
}
// the line of first light: gold lowest, then rose, then pearl thinning into the night by ${FIRST.top} degrees up; full to
// ${FIRST.full} degrees either side of its bearing, nothing beyond ${FIRST.none}; no edge anywhere
vec3 skyFirst(float bd, float eD){
  float rel = abs(mod(bd - (${FIRST.bearing}.) + 540., 360.) - 180.), w = 1. - smoothstep(${FIRST.full}., ${FIRST.none}., rel);
  float up = clamp(eD / ${FIRST.top}., 0., 1.), k = (1. - up) * sqrt(1. - up) * (.45 + .55 * (1. - smoothstep(0., 11., eD)));
  vec3 dc = mix(mix(vec3(.98, .74, .34), vec3(.92, .56, .56), smoothstep(2.6, 6., eD)), vec3(.94, .84, .76), smoothstep(5.5, 10.5, eD));
  return dc * (w * k * smoothstep(-1., .3, eD) * .88);
}
vec3 skyColor(vec3 d, float px, float full, float st){
  vec4 top = uRow[5], low = uRow[6], disc = uRow[7], key = uRow[0];
  float veil = uRow[1].a, dusk = uRow[2].a, sunH = key.a, el = asin(clamp(d.y, -1., 1.)), bz = atan(d.x, -d.z + 1e-7), hy = clamp(d.y, 1e-4, 1.), bd = degrees(bz), eD = degrees(el);
  vec3 c = mix(low.rgb, top.rgb, pow(hy, .42));
  // the sun: one bearing for ever, its height the row's
  vec3 sd = vec3(${Math.sin(SUN_BEARING * RAD).toFixed(5)} * cos(sunH), sin(sunH), ${(-Math.cos(SUN_BEARING * RAD)).toFixed(5)} * cos(sunH));
  float cs = clamp(dot(d, sd), 0., 1.), cs2 = cs * cs, cs8 = cs2 * cs2 * cs2 * cs2, glow = cs8 * cs8 * cs8;
  c += disc.rgb * (.05 * glow * glow + .02 * cs8) * veil;
  c = mix(c, disc.rgb, smoothstep(.99855, .99875, cs));
  // the afterglow where the sun went down: bearings ${AFTERGLOW.from} to ${AFTERGLOW.to} only, brightest at ${AFTERGLOW.peak}
  float band = smoothstep(${AFTERGLOW.from}., ${AFTERGLOW.peak}., bd) * (1. - smoothstep(${AFTERGLOW.peak + 1}., ${AFTERGLOW.to}., bd)) * exp(-max(el, 0.) * 9.) * dusk;
  c += vec3(.5, .62, .26) * band * .9;
  if (full > .5) {
    // small white clouds of the afternoon; long clouds of the gold hour and the sunset, lit from under (bellies gold and rose, tops violet)
    vec2 cp = d.xz / (hy + .11) * .55 + uCloud.xy + uTime * vec2(.004, .0015);
    float cf = skyFbm(cp * 2.1) + .1 * skyFbm(cp * 7.3), cum = smoothstep(.57, .7, cf) * smoothstep(.03, .16, d.y) * low.a;
    float cl = smoothstep(.57, .88, skyFbm(cp * 2.1 + sd.xz * .07) + .1 * skyFbm(cp * 7.3 + sd.xz * .07));
    c = mix(c, mix(vec3(.62, .68, .8) * (low.rgb + .3), vec3(1.05, 1.02, .98) * (.6 + .5 * key.rgb), 1. - cl), cum * .92);
    vec2 bq = vec2(bz * 2.2 + uCloud.z + uTime * .003, el * 26. + uCloud.w);
    float bn = skyFbm(bq), bu = skyFbm(bq + vec2(0., .5)), bands = smoothstep(.46, .7, bn) * smoothstep(.015, .07, el) * (1. - smoothstep(.3, .6, el)) * disc.a;
    float belly = clamp((bu - bn) * 6. + .7, 0., 1.), nearSun = cs2 * cs2 * cs2;
    vec3 bc = mix(vec3(.3, .17, .44), mix(vec3(1.25, .78, .34), vec3(1.15, .36, .36), clamp(1. - sunH * 4. + .3 * (1. - nearSun), 0., 1.)), belly * (.55 + .45 * nearSun));
    c = mix(c, bc * (.5 + .8 * low.rgb), bands * .85);
  }
  // the far lights behind the day's veil
  float night = 1. - veil;
  if (st > .5) c += skyStars(d, px) * (night * night * night) * smoothstep(-.01, .06, d.y);
  float cm = dot(d, ${v3(MOON_DIR)});
  vec3 mcol = vec3(.9, .94, 1.) * (1.15 + .5 * hNoise(d.xy * 60.) * hNoise(d.zy * 31.)) * (.75 + .25 * smoothstep(.99863, .9997, cm));
  float cmc = clamp(cm, 0., 1.), cm4 = cmc * cmc; cm4 *= cm4; cm4 *= cm4; cm4 *= cm4; cm4 *= cm4;
  c += vec3(.5, .6, .8) * (.1 * cm4 * cm4 * cm4 * cm4 + .1 * cm4 + .05 * cmc * cmc * cmc) * night;
  c = mix(c, mcol * .78, smoothstep(.99863, .99883, cm) * night);
  // falling stars: each stream lets one fall in every beat of its own length, from its own seeded start
  for (int j = 0; j < 4; j++) {
    float fj = float(j), on = step(fj + .5, uFall.z), T = uFallT[j], tt = uTime + uFallPh[j] * T, nb = floor(tt / T), h1 = hHash(vec2(nb * 1.31 + uFall.x, fj * 7.7 + uFall.y)), h2 = hHash(vec2(nb * 2.17 + uFall.y, fj * 3.1 + uFall.x)), h3 = hHash(vec2(nb * .73 + 5.1, uFall.x + fj));
    float tl = tt - nb * T - h3 * 2., life = .55 + .4 * h1, ba = radians(mix(-133., 17., h1)), ea = radians(mix(14., 52., h2)), k = clamp(tl / life, 0., 1.);
    vec3 a0 = vec3(sin(ba) * cos(ea), sin(ea), -cos(ba) * cos(ea)), side = normalize(cross(a0, vec3(0., 1., 0.))), dn = normalize(cross(side, a0));
    vec3 v = normalize(side * (h3 - .5) * 1.6 - dn), hd = normalize(a0 + v * (.3 * k)), w = d - hd; float al = dot(w, v), pe = length(w - v * al), wd = max(.0012, px * 1.1);
    c += vec3(.9, .95, 1.) * (on * night * night * step(0., tl) * step(tl, life) * sin(3.1416 * k) * (1. - smoothstep(wd * .4, wd, pe)) * smoothstep(-.09, 0., al) * step(al, 0.) * 2.2 * (.0012 / wd));
  }
  c += skyFirst(bd, eD) * night * (.97 + .03 * sin(uTime * .7 + bz * 37.));
  float ms = length(d - ${v3(STAR_DIR)}), mr = max(.0028, px * 1.2);
  c += vec3(1., .96, .88) * 4. * night * (1. - smoothstep(mr * .4, mr, ms)) * (.0028 * .0028) / (mr * mr) * (.85 + .15 * sin(uTime * 3.1));
  c += vec3(1., .95, .85) * night * .25 * exp(-min(ms, 1.) * 110.);
  return c;
}`;

// THE SEEDED VARIATIONS, dealt from the stream 'deal' and the engine's hints. Road, places, table and pace are the
// same on every seed.
function deal(v, vary) {
  const mood = vary.mood ?? 0.5, density = vary.density ?? 1, rare = !!vary.rare;
  const windSide = v() < 0.5 ? -1 : 1, windB = (windSide * v.range(40, 75)) * RAD;
  return { mood, density, rare, windB, windK: lerp(0.7, 1.3, mood), flower: v.pick(['chicory', 'daisy', 'susan', 'clover']) };
}

export default {
  id: 'fields-of-gazing-grain',
  name: 'The Fields of Gazing Grain',
  category: 'books',
  placeKind: 'wilderness',
  book: 'Because I could not stop for Death',
  author: 'Emily Dickinson, 1830 to 1886',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const S = {}; for (const n of STREAMS) S[n] = streamOf(ctx.seed, n);
    const V = deal(S.deal, ctx.vary || {}), detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene();
    // ------------------------------------------------------------ the road, the route, the table, the land
    const { road, PL, gaps, bankPh, land } = dealLand(ctx.seed), L = road.L, q3 = [0, 0, 0];
    await ctx.yield();
    // the path's knots lie every 3 m from the entry, 2.6 m over the road, and at its end
    const pts = []; for (let s = 0; s < L - 1; s += 3) { road.at(s, 0, q3); pts.push([q3[0], road.yAt(s) + EYE, q3[1]]); }
    road.at(L, 0, q3); pts.push([q3[0], road.yAt(L) + EYE, q3[1]]);
    const path = makePath(pts);
    await ctx.yield();
    const hours = makeHours(road);
    await ctx.yield();
    const smap = await bakeSmap(road, ctx.yield);
    const U = hourUniforms(hours, smap), cols = wheatColours(V.mood), WU = wheatUniforms(U, cols), GU = groundUniforms(WU, road, { puddleSeed: S.puddles(), shoreS: PL.shore[1] });
    const fallT = [0, 1, 2, 3].map(() => S.fall.range(3, 7)), fallPh = [0, 1, 2, 3].map(() => S.fall());
    const SKYU = { ...U, uStarK: { value: V.density }, uFall: { value: new THREE.Vector3(S.fall.range(0, 50), S.fall.range(0, 50), V.rare ? 4 : 1) },
      uFallT: { value: new THREE.Vector4(...fallT) }, uFallPh: { value: new THREE.Vector4(...fallPh) },
      uCloud: { value: new THREE.Vector4(S.clouds.range(0, 40), S.clouds.range(0, 40), S.clouds.range(0, 20), S.clouds.range(0, 20)) } };
    U.uMistSeed.value.set(S.mist.range(0, 100), S.mist.range(0, 100));
    U.uWind.value.set(Math.sin(V.windB), -Math.cos(V.windB), lerp(1.25, 0.75, V.mood), 6 * lerp(0.85, 1.15, V.mood));
    // the last road as places handed to the shaders: where the flood begins, the bank's height, the two water levels
    U.uLast.value.set(PL.floodHead, BANK_Y, FLOOD_Y, REACH_Y); U.uBankPh.value.set(bankPh[0], bankPh[1], bankPh[2], bankPh[3]);
    const P = (s, d = 0) => { const a = road.at(s, d); return [a[0], a[1]]; };
    const zo = {}, zv = {}, heightAt = (x, z) => land.heightAt(x, z, zo, true), earthAt = (x, z) => land.heightAt(x, z, zv, false);
    await ctx.yield();

    // ------------------------------------------------------------ the ground: one mesh, fine round the road and coarse far out
    const groundMat = groundMaterial(GU, road), PAST = { from: 24, to: 1500, wide: 112, fine: 300 }; let pastGround = null;
    {
      const lines = (lo, hi, step, far) => { const a = []; for (let x = lo; x <= hi + 1e-6; x += step) a.push(x); let w = step, x = hi; while (x < far) { w *= 1.3; x += w; a.push(x); } w = step; x = lo; while (x > -far) { w *= 1.3; x -= w; a.unshift(x); } return a; };
      const xs = lines(-64, 88, 2, 2600), zs = lines(-424, 22, 2, 2600);
      // (zo: heightAt has just left it for this very point)
      // (past the ring the great mesh lies 3.5 m under the last road's own strip, built below when its group exists: PAST)
      const under = (x, z) => { const h = heightAt(x, z); return zo.s > L + PAST.from && zo.ad < PAST.wide - 2 ? h - 3.5 * smoothstep(L + PAST.from, L + PAST.from + 3, zo.s) * (1 - smoothstep(PAST.wide - 5, PAST.wide - 2, zo.ad)) * (1 - smoothstep(L + PAST.to - 30, L + PAST.to, zo.s)) : h; };
      const zoneAt = (x, z, o) => { o[0] = zo.wheat; o[1] = zo.paintStub; o[2] = zo.paintRough; o[3] = zo.side + (zo.water > -4 ? 0 : 4); };
      const geo = await groundGrid(xs, zs, under, zoneAt, ctx.yield);
      const ground = new THREE.Mesh(geo, groundMat); ground.frustumCulled = false; scene.add(ground);
      await ctx.yield();
      // THE LAST ROAD RUNS ON PAST THE RING: road, ruts, bank, the flood's uneven edge and the elms' islands by the same law of the land, as one
      // strip of ground laid along the road's own line from 24 m past the ring to 1500 m past it (where the far hills stand), 112 m to either
      // hand; its rows 6 m apart to 300 m, 24 m to 636 m and 48 m beyond. It stands always (it hangs in the flood's group).
      const us = [], vs = [], halfs = [0, 3, 6, 8, 9.5, 11, 12.5, 14, 16, 19, 23, 28, 34, 41, 49, 58, 68, 79, 90, 101, PAST.wide];
      for (let u = PAST.from; u < PAST.fine; u += 6) us.push(u); for (let u = PAST.fine; u < 636; u += 24) us.push(u); for (let u = 636; u <= PAST.to; u += 48) us.push(u);
      for (let i = halfs.length - 1; i > 0; i--) vs.push(-halfs[i]); for (const h of halfs) vs.push(h);
      const e0 = road.at(L, 0).slice(), eu = road.at(L + 1, 0).slice(), ev = road.at(L, 1).slice(), ux = eu[0] - e0[0], uz = eu[1] - e0[1], hand = ux * (ev[1] - e0[1]) - (ev[0] - e0[0]) * uz < 0 ? -1 : 1, vx = (ev[0] - e0[0]) * hand, vz = (ev[1] - e0[1]) * hand;
      const pg = await groundGrid(us, vs, (u, v) => heightAt(e0[0] + ux * u + vx * v, e0[1] + uz * u + vz * v), zoneAt, ctx.yield);
      pg.applyMatrix4(new THREE.Matrix4().set(ux, 0, vx, e0[0], 0, 1, 0, 0, uz, 0, vz, e0[1], 0, 0, 0, 1));
      pastGround = new THREE.Mesh(pg, groundMat);
      GU.uRing.value.set(PL.ringC[0], PL.ringC[1], PL.ringR, 0);
      // the yard: behind the picket fence between its ends, as deep as the schoolhouse and its far maple stand; its path from the gate to the porch
      { const a = P(PL.gate, -3.5), deep = Math.max(-road.locate(PL.mapleC[0], PL.mapleC[1]).d, -road.locate(PL.schoolBack[0], PL.schoolBack[1]).d) + 12;
        GU.uYard.value.set(PL.picketL[0], PL.picketL[1], 3.5, deep); GU.uPath.value.set(a[0], a[1], PL.porch[0], PL.porch[1]);
        GU.uWorn.value[2].set(PL.pump[0], PL.pump[1], 1.5, 0.9); GU.uWorn.value[3].set(PL.porch[0], PL.porch[1], 2.2, 1); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the sky's dome (painted by direction, in the eye's row)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5200, 48, 24), new THREE.ShaderMaterial({
      uniforms: SKYU, side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`varying vec3 vDir;
        ${GLSL_HOURS}
        ${GLSL_SKY}
        void main(){ vec3 d = normalize(vDir); float px = length(fwidth(d)); vec3 c = skyColor(d, px, 1., 1.);
          c = mix(c, uRow[4].rgb, 1. - smoothstep(-.06, 0., d.y)); gl_FragColor = vec4(hourMist(c, cameraPosition + d * 4000., 0.), 1.); }`,
    }));
    dome.renderOrder = -20; dome.frustumCulled = false; scene.add(dome);

    // ------------------------------------------------------------ THE WATERS: the reach  and the flood (a little lower), one shader
    // (drawn first and without depth, the ground cut away below their levels, so that mirror images can lie under them).
    // Ripples of one size in metres and ONE strength; each ring is born at a seeded place of the water on a seeded
    // beat and spreads and dies by its own age; what is too fine for a pixel is thinned by the pixel's own footprint
    // on the water. Stars stand in the water as POINTS (read along the unrippled mirror ray, the ripple only makes them
    // tremble); the moon and the first light are read along the rippled ray, so they lie as broken glints.
    const waterMat = (which) => new THREE.ShaderMaterial({
      uniforms: { ...SKYU, uWhich: { value: which }, uDivide: { value: new THREE.Vector4(land.dv[0], land.dv[1], land.dn[0], land.dn[1]) }, uRingSeed: { value: new THREE.Vector2(S.rings.range(0, 60), S.rings.range(0, 60)) } }, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`varying vec3 vW; uniform float uWhich; uniform vec4 uDivide; uniform vec2 uRingSeed;
        ${GLSL_HOURS}
        ${GLSL_SKY}
        void main(){
          // the reach lies on its own side of the line between the two waters
          if (uWhich < .5 && dot(vW.xz - uDivide.xy, uDivide.zw) < 0.) discard;
          vec3 V = normalize(cameraPosition - vW);
          vec2 p = vW.xz; float t = uTime * .35, fw = length(fwidth(p)), kA = 1. - smoothstep(.12, .5, fw), kB = 1. - smoothstep(.45, 1.9, fw);
          vec2 g = kA * vec2(hNoise(p * 2.3 + vec2(t, 0.)) - hNoise(p * 2.3 + vec2(t + .35, .1)), hNoise(p * 2.3 + vec2(0., t * .8)) - hNoise(p * 2.3 + vec2(.1, t * .8 + .35)));
          g += kB * .6 * vec2(hNoise(p * .6 - vec2(t * .5, 0.)) - hNoise(p * .6 - vec2(t * .5 + .4, 0.)), hNoise(p * .6 + vec2(3., t * .4)) - hNoise(p * .6 + vec2(3., t * .4 + .4)));
          vec2 cell = floor(p / 11.), hc = cell + uRingSeed, cp = (cell + .25 + .5 * vec2(hHash(hc), hHash(hc + 7.7))) * 11. - p; float ph = fract(uTime / (6. + 5. * hHash(hc + 3.1)) + hHash(hc + 1.3)), rr = length(cp);
          float ring = sin((rr - ph * 3.2) * 9.) * (1. - smoothstep(0., .25, abs(rr - ph * 3.2))) * (1. - ph) * step(.45, hHash(hc + 5.5)) * (1. - smoothstep(.1, .45, fw));
          g += cp / max(rr, .05) * ring * 2.2;
          vec3 N = normalize(vec3(g.x * .16, 1., g.y * .16)), R = reflect(-V, N), R0 = reflect(-V, vec3(0., 1., 0.)); R.y = abs(R.y) + .002; R = normalize(R); R0.y = abs(R0.y) + .002; R0 = normalize(R0);
          float px = length(fwidth(R0)), fr = 1. - clamp(dot(V, N), 0., 1.), f2 = fr * fr, fres = .05 + .95 * f2 * f2 * fr, night = 1. - uRow[1].a;
          vec3 sky = mix(skyColor(R, px, 1., 0.), skyColor(normalize(vec3(R.x, R.y * .22, R.z)), px, 0., 0.), .32), body = uRow[3].rgb * .35 + uRow[2].rgb * .05;
          sky += skyStars(R0, px) * (night * night * night) * (.75 + .5 * (g.x + g.y));
          vec3 c = mix(body, sky, clamp(fres * 1.3 + .5, 0., 1.)) + lampLight(vW, N) * .03;
          gl_FragColor = vec4(hourFog(c, vW), 1.);
        }`,
    });
    const flood = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000, 1, 1).rotateX(-Math.PI / 2), waterMat(1));
    flood.position.set(0, FLOOD_Y, -200); flood.renderOrder = -11; flood.frustumCulled = false; scene.add(flood);
    const reach = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000, 1, 1).rotateX(-Math.PI / 2), waterMat(0));
    reach.position.set(0, REACH_Y, -200); reach.renderOrder = -10; reach.frustumCulled = false; scene.add(reach);
    scene.fog = new THREE.FogExp2(0x9fb8d0, 0.0007);
    await ctx.yield();

    // ------------------------------------------------------------ materials of the place: leaves, wood and stone in the eye's row
    await flora.prepareLeafTexture({}, ctx.yield);
    const leafMap = flora.makeLeafTexture({});
    const leafMat = litMaterial(U, { leaf: true, map: leafMap }), lowMat = litMaterial(U, { leaf: true, map: leafMap, low: true }), solidMat = litMaterial(U);
    // mirror images under the two waters, each at its own level
    const leafMirror = [litMaterial(U, { leaf: true, map: leafMap, mirror: true, level: REACH_Y }), litMaterial(U, { leaf: true, map: leafMap, mirror: true, level: FLOOD_Y })];
    const solidMirror = [litMaterial(U, { mirror: true, level: REACH_Y }), litMaterial(U, { mirror: true, level: FLOOD_Y })];
    // THE GREAT CASTERS OF SHADE (upright bodies: x, z, radius, from y, to y, strength, contact strength at the foot)
    const casters = [], cast = (x, z, r, y0, y1, k = 0.75, foot = 0.45, rank = 3) => casters.push([x, z, r, y0, y1, k, foot, rank]);
    // list: [{ x, y, z, rot, s, sy?, sw?, tx?, tz?, col? }]
    const inst = (geo, mat, list) => {
      const m = new THREE.InstancedMesh(geo, mat, list.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pv = new THREE.Vector3(), Sv = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color();
      list.forEach((p, i) => { E.set(p.tx || 0, p.rot || 0, p.tz || 0, 'YXZ'); M.compose(Pv.set(p.x, p.y || 0, p.z), Q.setFromEuler(E), Sv.set((p.s || 1) * (p.sw || 1), (p.s || 1) * (p.sy || 1), (p.s || 1) * (p.sw || 1))); m.setMatrixAt(i, M); if (p.col) m.setColorAt(i, C.setRGB(p.col[0], p.col[1], p.col[2])); });
      m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); return m;
    };
    // A LIGHTER BODY OF THE SAME FORM: a leaf mass keeps its cores and every second of its leaf cards and drops its stems (the pieces of the
    // geometry's own index, in their own order). For every image in rippled water, and for every tree drawn as one mass INSIDE a wood behind
    // its outer rows, wherever it lies. everyCard = 1 keeps all the cards and drops the stems only (STEMLESS: for a leaf mass whose thin stems
    // stand inside its own leaves: the underwood, an elm's crown clumps).
    const lighter = (geo, everyCard = 2) => {
      const ix = geo.index.array, par = new Int32Array(geo.attributes.position.count).map((v, i) => i), find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      for (let i = 0; i < ix.length; i += 3) { par[find(ix[i])] = find(ix[i + 1]); par[find(ix[i + 1])] = find(ix[i + 2]); }
      const size = new Map(); for (let i = 0; i < ix.length; i += 3) { const r = find(ix[i]); size.set(r, (size.get(r) || 0) + 1); }
      const keep = new Map(), out = []; let cards = 0; for (const [r, n] of size) keep.set(r, n >= 16 || (n <= 4 && cards++ % everyCard === 0));
      for (let i = 0; i < ix.length; i += 3) if (keep.get(find(ix[i]))) out.push(ix[i], ix[i + 1], ix[i + 2]);
      const g = geo.clone(); g.setIndex(out); return g;
    };
    const nm = (m, name) => { m.name = name; return m; };
    // the made things of wood and stone, one mesh to each stretch of the road (GM), and those that stand by a water and have their image in it (gW: [reach, flood])
    const GM = { school: makeGeo(), farm: makeGeo(), meadow: makeGeo(), rise: makeGeo(), last: makeGeo(), far: makeGeo() }, gW = [makeGeo(), makeGeo()], gWimage = [null, null];
    // TWO GROUPS OF THE PLACE, both standing in the world ALWAYS, like everything else (nothing is shown or hidden by where the eye is): the low
    // things of the shore and the wet meadow with the images in the reach (beyondG); the low things at the flood's edge with the images in the
    // flood and the last road's ground past the ring (floodG)
    const beyondG = new THREE.Group(), floodG = new THREE.Group(); scene.add(beyondG); scene.add(floodG); floodG.add(pastGround);
    const WOOD = linear('#6b5a48'), OLDWOOD = linear('#8a8274'), STONE = linear('#c2bcae'), GREYWOOD = linear('#9a978e');
    // a post and rail fence through points on the ground: posts with thickness, split rails, none quite like the next; some rails down
    const fence = (g, pts, r, o = {}) => {
      g.kind(4); const H = o.h || 1.2, col = o.col || OLDWOOD, nr = o.rails || 2;
      for (let i = 0; i < pts.length; i++) {
        const [x, z] = pts[i], h = H * r.range(0.9, 1.08), lx = r.range(-0.05, 0.05), lz = r.range(-0.05, 0.05), y0 = earthAt(x, z);
        g.col(col, r.range(0.75, 1.1)).tube([[x, y0 - 0.2, z], [x + lx, y0 + h, z + lz]], [0.075, 0.065], 5);
        if (i < pts.length - 1) { const [x1, z1] = pts[i + 1], y1 = earthAt(x1, z1);
          for (let k = 0; k < nr; k++) { const yy = H * (0.42 + 0.4 * k / Math.max(1, nr - 1)), down = o.down && r() < o.down;
            // (each rail draws its tone first, then its two end heights)
            const tone = r.range(0.7, 1.15), ya = y0 + yy + r.range(-0.05, 0.05), yb = y1 + (down ? 0.06 : yy + r.range(-0.05, 0.05));
            // (o.sag: a split rail hangs a little between its posts, the lower rails more)
            if (o.sag) g.col(col, tone).tube([[x, ya, z], [(x + x1) / 2, (ya + yb) / 2 - o.sag * (1.4 - 0.35 * k), (z + z1) / 2], [x1, yb, z1]], [0.045, 0.06], 4, { cap: false });
            else g.col(col, tone).tube([[x, ya, z], [x1, yb, z1]], [0.04, 0.055], 4, { cap: false }); } }
      }
    };
    const line = (s0, s1, d, step = 3) => { const a = []; for (let s = s0; s <= s1 + 1e-6; s += step) a.push(P(s, d)); return a; };
    const cross = (s, d0, d1, step = 3) => { const a = []; for (let d = d0; Math.abs(d) <= Math.abs(d1) + 1e-6; d += Math.sign(d1 - d0) * step) a.push(P(s, d)); return a; };
    // what the clock moves each frame (each thing adds its own step)
    const frame = [];
    await ctx.yield();
    // ------------------------------------------------------------ HOUR 6: THE LAST ROAD. NINE GREAT ELMS at their fixed places (no avenue), each from its own draws
    // (the part's dealElms: the same draws the sums of the three rules are counted on), their images in the flood under them
    {
      const elms = dealElms(ctx.seed, PL), BARKC = linear('#6e6456'), ELM = { leaf: '#3b5f33', leafLight: '#86a04e', leafDark: '#182f1e' }, er = S.elmtone, gE = gW[1], gI = gWimage[1] = makeGeo();
      const near = [], far = [];
      for (const e of elms) {
        const y0 = earthAt(e.x, e.z) - 0.25, G = e.girth, T = e.top, k = er.range(0.85, 1.1);
        // the trunk: flared at the foot, bare to its fork
        gE.kind(4).col(BARKC, k).tube([[e.x, y0, e.z], [e.x, y0 + 0.5, e.z], [e.x + T[0] * 0.12, y0 + 1.6, e.z + T[2] * 0.12], [e.x + T[0] * 0.5, y0 + e.fork * 0.55, e.z + T[2] * 0.5], [e.x + T[0], y0 + e.fork, e.z + T[2]]], [G * 1.75, G * 1.25, G, G * 0.9, G * 0.82], e.near ? 9 : 6);
        // (the image of a trunk and its boughs in the flood: the same lines and girths with fewer sides, and without the roots under the turf)
        gI.kind(4).col(BARKC, k).tube([[e.x, y0, e.z], [e.x + T[0] * 0.12, y0 + 1.6, e.z + T[2] * 0.12], [e.x + T[0] * 0.5, y0 + e.fork * 0.55, e.z + T[2] * 0.5], [e.x + T[0], y0 + e.fork, e.z + T[2]]], [G * 1.5, G, G * 0.9, G * 0.82], e.near ? 5 : 4);
        for (let i = 0; i < 5; i++) { const a = er() * 6.283, l = G * er.range(2, 3.2); gE.tube([[e.x + Math.cos(a) * l, y0 - 0.05, e.z + Math.sin(a) * l], [e.x + Math.cos(a) * G * 1.2, y0 + 0.35, e.z + Math.sin(a) * G * 1.2], [e.x + Math.cos(a) * G * 0.7, y0 + 1.3, e.z + Math.sin(a) * G * 0.7]], [0.06, G * 0.34, G * 0.2], 5); }
        for (const b of e.boughs) { const m = b.pts.length, kb = k * er.range(0.85, 1.05), bp = b.pts.map((p) => [e.x + p[0], y0 + p[1], e.z + p[2]]), br = b.pts.map((p, i) => lerp(b.r0, 0.07, Math.pow(i / (m - 1), 0.8)));
          gE.col(BARKC, kb).tube(bp, br, e.near ? 6 : 4); gI.col(BARKC, kb).tube(bp, br, 3, { cap: false }); }
        for (const c of e.clumps) { const g = er.range(0.8, 1.08); (e.near ? near : far).push({ x: e.x + c.x, y: y0 + c.y, z: e.z + c.z, s: c.s, sy: c.sy, rot: c.rot, col: [g, g, g] }); }
        // the moon lays the trunk's shade as a bar; the crown's shade is thinner and falls far off
        cast(e.x, e.z, G * 0.95, y0, y0 + e.fork + 2, 0.8, 0.4); cast(e.x, e.z, 6.5, y0 + e.fork + 3, y0 + e.H, 0.45, 0);
      }
      await ctx.yield();
      // (the four of the straight in full leaf; the five beyond, and every image in the flood, in a lighter mass of the same form)
      const lite = flora.bushGeometry({ rng: er.fork('far'), size: 3, detail: 0, ...ELM });
      // (a crown clump's thin stems stand inside its own leaves: not built, on near elms and far alike)
      scene.add(nm(inst(lighter(flora.bushGeometry({ rng: er.fork('near'), size: 3, detail: 1, ...ELM }), 1), leafMat, near), 'elm-crowns')); scene.add(nm(inst(lighter(lite, 1), leafMat, far), 'elm-crowns-far'));
      // (their images in the rippled flood are thinner than the crowns: two leaf masses in three of the near four, every second of the five beyond)
      { const b = inst(lighter(lite), leafMirror[1], near.filter((m, i) => i % 3 !== 2).concat(far.filter((m, i) => i % 2 === 0))); b.renderOrder = -9; b.frustumCulled = false; floodG.add(b); }
    }
    await ctx.yield();
    // a low post and rail fence on BOTH shoulders, 3 m from the line, from the last bend's end to the ring and in under its opening: weathered grey, some rails down
    fence(GM.last, line(PL.bendEnd, L + 9, -3), S.fence, { h: 1.05, col: GREYWOOD, down: 0.16 }); fence(GM.last, line(PL.bendEnd + 1.5, L + 9, 3), S.fence, { h: 1.05, col: GREYWOOD, down: 0.16 });
    // BOTH FENCES RUN ON PAST THE RING with the road, as far as the last road's ground is laid in its fine strips (PAST.fine metres past the
    // ring): the same grey posts at the same 3 m, each fence taken up at its own last post, in a lighter form (three-sided posts and rails, none
    // down; the road is straight there and no eye comes nearer than the ring, so a rail is one long pole laid over POLE posts), a mesh of its
    // own (GM.far) and a stream of its own (the name fencefar).
    {
      const fr = S.fencefar, g = GM.far, H = 1.05, POLE = 6; g.kind(4);
      for (const [s0, d] of [[PL.bendEnd, -3], [PL.bendEnd + 1.5, 3]]) {
        const pts = line(s0 + 3 * Math.floor((L + 9 - s0 + 1e-6) / 3), L + PAST.fine, d);
        for (let i = 1; i < pts.length; i++) {
          const [x, z] = pts[i], y = earthAt(x, z), h = H * fr.range(0.9, 1.08);
          g.col(GREYWOOD, fr.range(0.75, 1.1)).tube([[x, y - 0.2, z], [x + fr.range(-0.05, 0.05), y + h, z + fr.range(-0.05, 0.05)]], [0.075, 0.065], 3, { cap: false });
        }
        for (let i = 0; i + 1 < pts.length; i += POLE) {
          const [x0, z0] = pts[i], [x, z] = pts[Math.min(i + POLE, pts.length - 1)], ya = earthAt(x0, z0), y = earthAt(x, z);
          for (let k = 0; k < 2; k++) { const yy = H * (0.42 + 0.4 * k); g.col(GREYWOOD, fr.range(0.7, 1.15)).tube([[x0, ya + yy + fr.range(-0.05, 0.05), z0], [x, y + yy + fr.range(-0.05, 0.05), z]], [0.04, 0.055], 3, { cap: false }); }
        }
      }
    }
    // the bank's foot at the water's uneven edge: reeds, stones, white flowers
    {
      const sr = S.stones, reeds = [], white = [];
      for (let s = PL.floodHead + 2; s < L + 70; s += 0.55) for (const side of [-1, 1]) {
        if (side < 0 && s < PL.bendEnd + 1) continue;
        const e = bankEdge(s, side, bankPh), patch = Math.sin(s * 0.21 + side * 1.9 + bankPh[2]) + 0.6 * Math.sin(s * 0.057 + side + bankPh[3]);
        if (patch > 0.15 && sr() < 0.7) { const [x, z] = P(s + sr.range(-0.3, 0.3), side * (e + sr.range(-1.1, 0.9))), g = sr.range(0.7, 1); reeds.push({ x, y: Math.max(earthAt(x, z), FLOOD_Y - 0.3) - 0.05, z, rot: sr() * 6.283, s: sr.range(0.7, 1.05), tx: sr.range(-0.06, 0.06), tz: sr.range(-0.06, 0.06), col: [g, g, g] }); }
        if (sr() < 0.22) { const [x, z] = P(s, side * (e + sr.range(-1.6, 0.3))), y = Math.max(earthAt(x, z), FLOOD_Y - 0.1), w = sr.range(0.16, 0.42), h = w * sr.range(0.45, 0.8); GM.last.kind(2).col(STONE, sr.range(0.55, 0.85)).tube([[x, y - 0.05, z], [x + sr.range(-0.05, 0.05), y + h * 0.5, z], [x, y + h, z]], [[w, w * sr.range(0.6, 0.9)], [w * 0.8, w * 0.6], 0.03], 6); }
        // A WHITE FLOWER: its gate is drawn at every such place on every visit, and so are its figures: from this stream where the gate is under
        // 0.8 (the planting of the usual density), from the stream 'whitemore' where it is over (the further planting of a denser visit). The
        // visit's density only decides which of the dealt flowers are SHOWN (gate under 0.8 times the density); it deals nothing anew.
        { const gate = sr(), fr = gate < 0.8 ? sr : S.whitemore, [x, z] = P(s + fr.range(-0.3, 0.3), side * fr.range(3.6, e - 0.6)), b = fr.range(0.8, 1.05);
          const it = { x, y: earthAt(x, z) - 0.02, z, rot: fr() * 6.283, s: fr.range(0.5, 0.85), tx: fr.range(-0.15, 0.15), tz: fr.range(-0.15, 0.15), col: [b, b, b] };
          if (gate < 0.8 * V.density) white.push(it); }
      }
      // (every second clump is of five blades without a head: one clump in two carries its cattail. The forks 'reed' and 'white' are taken
      // first, the fork of the headless clump after them: the stream's last draw)
      const BR = { height: 1.7, leaf: '#4a7a34', tip: '#b8b060', root: '#243e20', head: '#4a3020' }, fReed = sr.fork('reed'), fWhite = sr.fork('white'), fBlade = sr.fork('blade');
      { const m = inst(flora.reedGeometry({ rng: fReed, blades: 4, cattails: 1, ...BR }), leafMat, reeds.filter((m, i) => i % 2 === 0)); m.name = 'bank-reeds-0'; floodG.add(m); }
      { const m = inst(flora.reedGeometry({ rng: fBlade, blades: 5, cattails: 0, ...BR }), leafMat, reeds.filter((m, i) => i % 2 === 1)); m.name = 'bank-reeds-1'; floodG.add(m); }
      const wm = inst(flora.flowerGeometry({ rng: fWhite, root: '#3d6122', color: '#ffffff', height: 0.6, width: 0.6, cards: 2 }), lowMat, white); wm.name = 'bank-white'; floodG.add(wm);
    }
    await ctx.yield();
    // FAR: low dark hills in three layers with air between, 1 to 3 degrees high as seen from the last road, uneven, centred on the ring's place and
    // running round on every hand (real ground with spurs and hollows; their outlines the seed's), with their dark images in the waters
    {
      const hr = S.hills, hn = ctx.core.makeNoise(ctx.core.hashSeed('fields-of-gazing-grain:hillsnoise:' + ctx.seed)), c0 = P(L), Pn = [], Cn = [], Un = [], Wn = [], In = [], Im = [];
      for (const [R, col, k] of [[1500, '#3d5a40', 3.1], [2500, '#3f5c48', 2.6], [4000, '#415e50', 2.3]]) {
        const ox = hr.range(0, 50), oz = hr.range(0, 50), n = 200, rows = [0, 0.05, 0.1, 0.16, 0.23, 0.31, 0.4], prof = [0, 0.4, 0.78, 1, 0.9, 0.66, 0.4], c = linear(col), base = Pn.length / 3, hLo = R * Math.tan(1 * RAD) * 1.16, hHi = R * Math.tan(3 * RAD) * 1.16;
        for (let i = 0; i <= n; i++) {
          const a = i / n * 6.2832, sa = Math.sin(a), ca = Math.cos(a);
          for (let r = 0; r < rows.length; r++) {
            const rad = R * (1 + rows[r]), x = c0[0] + sa * rad, z = c0[1] - ca * rad;
            const f = 0.5 + 0.5 * hn.n2(sa * k + ox, ca * k + oz) + 0.25 * hn.n2(sa * k * 3.1 + oz, ca * k * 3.1 + ox), spur = 0.75 + 0.35 * hn.n2(x / (R * 0.11) + ox, z / (R * 0.11) + oz);
            const h = lerp(hLo, hHi, clamp(f, 0, 1)) * prof[r] * spur, g = 0.85 + 0.3 * hn.n2(x / (R * 0.05), z / (R * 0.05));
            Pn.push(x, h - 3, z); Cn.push(c[0] * g, c[1] * g, c[2] * g); Un.push(10, 0); Wn.push(0, 0, 0, 0);
          }
        }
        const m = rows.length; for (let i = 0; i < n; i++) for (let r = 0; r < m - 1; r++) { const a = base + i * m + r, b = a + m; In.push(a, b, b + 1, a, b + 1, a + 1); if (i % 2 === 0) Im.push(a, b + m, b + m + 1, a, b + m + 1, a + 1); }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(Pn, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cn, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(Un, 2)); geo.setAttribute('wind', new THREE.Float32BufferAttribute(Wn, 4)); geo.setIndex(In); geo.computeVertexNormals();
      // (their image in the waters is the same ground from every second column: half the triangles, the same outline to a pixel's breadth at that distance)
      const gim = geo.clone(); gim.setIndex(Im);
      for (const [mat, ro] of [[solidMat, 0], [solidMirror[1], -9]]) { const hm = new THREE.Mesh(ro ? gim : geo, mat); hm.renderOrder = ro; hm.frustumCulled = false; (ro ? beyondG : scene).add(hm); }
    }
    await ctx.yield();
    // ------------------------------------------------------------ WHAT STANDS BETWEEN THE EARLIER ROAD AND THE LAST ROAD (the laying of the line, said at the head):
    // the alder carr with its reed and underwood, the thicket at the flood's edge inside the last bend, the ridge wood with its underwood
    // (the part's dealStanding: the same trees the sum is counted on)
    const KD = detail >= 1 ? 2 : 1;
    {
      const St = dealStanding(ctx.seed, { road, PL, land }), ALDER = { leaf: '#35592f', leafLight: '#7f9c4c', leafDark: '#162c1c', bark: '#4a4238', barkDark: '#2a2622', barkLight: '#6a5e50' };
      const al = [[], [], []], rd = [], un = [], unF = [], unW = [], wd = [[], [], []], cr = S.carrtone;
      // (a tree inside the belt or the wood, behind its outer rows on every side, is drawn as one tall leaf mass of the underwood's form: the same body in the sum)
      const fill = (t, g, to = unF) => { const y = earthAt(t.x, t.z), s = 0.77 * t.h / 2.9; to.push({ x: t.x, y: y + 0.2 * t.h, z: t.z, rot: t.rot, s, sw: clamp(t.r * 1.1 / (2.4 * s), 0.3, 1.1), col: [g * 0.8, g * 0.92, g * 0.8] }); };
      for (const t of St.carr) { const sc = t.h / 12, g = cr.range(0.8, 1.08); if (t.inner) { fill(t, g); continue; } al[t.kind].push({ x: t.x, y: earthAt(t.x, t.z) - 0.1, z: t.z, rot: t.rot, s: sc, sw: clamp(t.r / (3.2 * sc), 0.7, 1.25), tx: t.lean[0], tz: t.lean[1], col: [g, g, g] }); }
      for (const t of St.reed) { const g = cr.range(0.65, 0.95); rd.push({ x: t.x, y: earthAt(t.x, t.z) - 0.05, z: t.z, rot: cr() * 6.283, s: t.h / 3, tx: cr.range(-0.05, 0.05), tz: cr.range(-0.05, 0.05), col: [g, g, g] }); }
      for (const t of St.under) { const sc = t.h / 2.9, g = cr.range(0.75, 1.05); un.push({ x: t.x, y: earthAt(t.x, t.z) - 0.1, z: t.z, rot: t.rot, s: sc, sw: clamp(t.r / (2.4 * sc), 0.6, 1.1), col: [g * 0.9, g, g * 0.85] }); }
      for (const t of St.wood) { const sc = t.h / 16, g = cr.range(0.82, 1.08); if (t.inner) { fill(t, g, unW); continue; } wd[t.kind].push({ x: t.x, y: earthAt(t.x, t.z) - 0.15, z: t.z, rot: t.rot, s: sc, sw: 0.8, col: [g, g, g] }); cast(t.x, t.z, t.r, earthAt(t.x, t.z) + 3, earthAt(t.x, t.z) + t.h * 0.9, 0.5, 0.35, 9); }
      for (let i = 0; i < 3; i++) { if (al[i].length) { const m = inst(flora.birchGeometry({ rng: cr.fork('alder' + i), height: 12, detail: 0, ...ALDER }), leafMat, al[i]); scene.add(m); } }
      await ctx.yield();
      // (the carr's reed: a clump of four blades and a cattail, 64 triangles for 70)
      { const m = inst(flora.reedGeometry({ rng: cr.fork('reed'), height: 3, blades: 4, cattails: 1, leaf: '#4a7a34', tip: '#b8b060', root: '#243e20', head: '#4a3020' }), leafMat, rd); m.name = 'carr-reeds'; scene.add(m); }
      // (the ridge wood's inner masses are a mesh of their own: out of the picture from the reach on). The underwood is the kit's bush without its
      // three thin stems (114 triangles for 150); an inner mass of the carr or of the wood is the lighter body of it (88)
      { const bg = flora.bushGeometry({ rng: cr.fork('under'), size: 2.2, detail: 0, leaf: '#3f6a30', leafLight: '#8fae50', leafDark: '#1c3a22' }), mass = lighter(bg);
        scene.add(nm(inst(lighter(bg, 1), leafMat, un), 'carr-underwood')); if (unF.length) scene.add(nm(inst(mass, leafMat, unF), 'carr-inner')); if (unW.length) scene.add(nm(inst(mass, leafMat, unW), 'wood-inner')); }
      const MAPLE2 = { leaf: '#3f7030', leafLight: '#98b850', leafDark: '#1f4526', gold: '#5f8a36', crimson: '#3a6a2c', bark: '#6a5a4a', barkDark: '#3a3028' };
      for (let i = 0; i < 3; i++) { if (wd[i].length) { const m = inst(flora.mapleGeometry({ rng: S.woodform.fork('g' + i), height: 16, detail: 0, ...MAPLE2 }), leafMat, wd[i]); scene.add(m); } }
    }
    await ctx.yield();

    // ------------------------------------------------------------ HOUR 5: THE LOW RISE (the ground's own height), the old roof's ridge along its crest, the plain cornice, the old oak
    {
      const rr = S.rise, RIDGE = linear('#3a3632'), PALE = linear('#cfd2cc'), ax = PL.riseAxis, sx = [-ax[1], ax[0]];
      // the ridge: 18 m of it along the crest, a quarter of a metre out of the grass, sagging a little with age; a few courses of mossed shingle to either side
      GM.rise.kind(3);
      for (let u = -9; u < 9 - 1e-6; u += 1) {
        const e = (q) => { const x = PL.rise[0] + ax[0] * q, z = PL.rise[1] + ax[1] * q, k = smoothstep(0, 1.5, 9 - Math.abs(q)); return [x, z, earthAt(x, z) - 0.06 + (0.31 + 0.05 * Math.sin(q * 0.9 + 1.3)) * k]; };
        const a = e(u), b = e(u + 1), w = 0.36, lo = 0.3, k = rr.range(0.8, 1.15);
        for (const sg of [-1, 1]) GM.rise.col(RIDGE, k * (sg < 0 ? 1 : 0.9)).quad([a[0] + sx[0] * w * sg, a[2] - lo, a[1] + sx[1] * w * sg], [a[0], a[2], a[1]], [b[0], b[2], b[1]], [b[0] + sx[0] * w * sg, b[2] - lo, b[1] + sx[1] * w * sg]);
      }
      // the cornice: pale stone 7 m long across the near end, set in the end's slope, its top level with the turf behind it; a fillet, a cove and a bead under a lip, nothing else
      const c0 = [PL.cornice[0] - ax[0] * 3, PL.cornice[1] - ax[1] * 3], yaw = Math.atan2(-ax[0], -ax[1]), yb = earthAt(c0[0] - ax[0] * 0.3, c0[1] - ax[1] * 0.3) - 0.04;
      const prof = [[0, -0.08], [0, 0.06], [0.03, 0.08], [0.045, 0.1], [0.03, 0.12], [0.02, 0.14], [0.035, 0.2], [0.07, 0.26], [0.12, 0.3], [0.18, 0.32], [0.2, 0.32], [0.2, 0.42], [-0.45, 0.42]];
      GM.rise.tr(c0[0], yb, c0[1], yaw).kind(0).col(PALE);
      for (let i = 0; i < prof.length - 1; i++) { const a = prof[i], b = prof[i + 1]; GM.rise.col(PALE, i === 10 ? 1.05 : i === 11 ? 1.1 : 0.92 + 0.02 * i).quad([-3.5, a[1], a[0]], [3.5, a[1], a[0]], [3.5, b[1], b[0]], [-3.5, b[1], b[0]]); }
      for (const e of [-3.5, 3.5]) for (let i = 1; i < prof.length - 1; i++) GM.rise.col(PALE, 0.9).tri([e, 0.2, -0.1], [e, prof[i][1], prof[i][0]], [e, prof[i + 1][1], prof[i + 1][0]]);
      GM.rise.pop();
      // turf brought level to the cornice's top behind it, running back into the slope (a patch of the same ground)
      const xs = [], zs = []; for (let k = -13; k <= 13; k++) { xs.push(c0[0] + k * 0.5); zs.push(c0[1] + k * 0.5); }
      const fillAt = (x, z) => { const ex = x - c0[0], ez = z - c0[1], back = ex * ax[0] + ez * ax[1], along = Math.abs(ex * sx[0] + ez * sx[1]);
        return Math.max(earthAt(x, z) + 0.015, (yb + 0.415) * 1 - 4 * smoothstep(3.5, 4.6, along) - 4 * (1 - smoothstep(0.1, 0.44, back)) - 4 * smoothstep(3.5, 6, back)); };
      scene.add(new THREE.Mesh(await groundGrid(xs, zs, fillAt, (x, z, o) => { o[0] = 0; o[1] = 0; o[2] = 1; o[3] = 4; }), groundMat));
      // THE OLD OAK on the rise's road-side skirt: crown 20 m across and clear of the road, boughs from 5 m up
      const og = flora.oakGeometry({ rng: S.oak.fork('g'), height: 24, detail: KD, fullness: 1.25, leaf: '#3a6630', leafLight: '#93b24c', leafDark: '#1f4526', bark: '#8a7660', barkDark: '#55463a' });
      const om = new THREE.Mesh(og, leafMat), ok = Math.min(1, 10 / og.userData.radius); om.position.set(PL.oak[0], earthAt(PL.oak[0], PL.oak[1]) - 0.2, PL.oak[1]); om.rotation.y = S.oak() * 6.283; om.scale.set(ok, 1, ok); om.updateMatrixWorld(true); scene.add(om);
      cast(PL.oak[0], PL.oak[1], 0.9, 0, 7, 0.8, 0.5, 2); cast(PL.oak[0], PL.oak[1], 8.5, 6, 23, 0.55, 0.25, 2);
      // THE OAK STANDS ON THE GROUND: a flared foot round the trunk as it is built (its own girth at a metre up) with seven roots running into the
      // turf, dark bark (from the stream 'oakfoot')
      { const of = S.oakfoot, pos = og.attributes.position, [ox, oz] = PL.oak, oy = earthAt(ox, oz) - 0.2, DARKBARK = linear('#4a3c30'); let r0 = 0;
        for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > 0.9 && y < 1.5) r0 = Math.max(r0, Math.hypot(pos.getX(i), pos.getZ(i)) * ok); }
        r0 = clamp(r0, 0.45, 1.2);
        GM.rise.kind(4).col(DARKBARK, 0.9).tube([[ox, oy - 0.15, oz], [ox, oy + 0.3, oz], [ox, oy + 0.8, oz], [ox, oy + 1.5, oz]], [r0 * 1.8, r0 * 1.4, r0 * 1.14, r0 * 1.02], 9, { cap: false });
        for (let i = 0; i < 7; i++) { const a = (i + of.range(0.15, 0.85)) / 7 * 6.283, l = r0 * of.range(2.6, 3.8), k = of.range(0.75, 1);
          const tx = ox + Math.cos(a) * l, tz = oz + Math.sin(a) * l, mx = ox + Math.cos(a) * r0 * 1.9, mz = oz + Math.sin(a) * r0 * 1.9;
          GM.rise.col(DARKBARK, k).tube([[tx, earthAt(tx, tz) - 0.04, tz], [mx, earthAt(mx, mz) + 0.16, mz], [ox + Math.cos(a) * r0 * 1.05, oy + 0.95, oz + Math.sin(a) * r0 * 1.05]], [0.05, r0 * 0.36, r0 * 0.2], 5); } }
    }
    await ctx.yield();
    // ------------------------------------------------------------ THE LIFE OF THE KIT: every flock takes THE ONE ROW of the eye's place each frame (no typed metre of road in any flock's light)
    const flockLight = { sunDir: [0, 1, 0], sunColor: new THREE.Color(), sunIntensity: 3, sky: new THREE.Color(), skyIntensity: 3, ground: new THREE.Color(), groundIntensity: 3 };
    const setFlockLight = () => { const R = U.uRow.value; flockLight.sunDir[0] = R[1].x; flockLight.sunDir[1] = R[1].y; flockLight.sunDir[2] = R[1].z; flockLight.sunColor.setRGB(R[0].x, R[0].y, R[0].z); flockLight.sky.setRGB(R[2].x, R[2].y, R[2].z); flockLight.ground.setRGB(R[3].x, R[3].y, R[3].z); };
    hours.setEye(U, 0); setFlockLight();
    const fauna = F.makeFauna(scene, { light: flockLight });
    frame.push((time, dt, camera, u) => { setFlockLight(); fauna.setLight(flockLight); fauna.update(dt, time, camera, u); });

    // ------------------------------------------------------------ HOUR 4: THE WET MEADOW. Plants with full outlines: thistles with heads, sedges in sheaves, tall meadow flowers
    const thistleAt = [];
    {
      const wr = S.thistles, th = [], sedge = [], tall = [], g = makeGeo(), GREY = linear('#6f7a5c'), HEAD = linear('#7c5a92');
      // one thistle: a ribbed stem, three branches each with a head and its tuft, spined leaves
      const stem = (pts, r) => g.kind(0).col(GREY).tube(pts, r, 3, { cap: false });
      stem([[0, -0.05, 0], [0.02, 0.5, 0.01], [-0.02, 1.0, -0.01], [0, 1.4, 0]], [0.026, 0.021, 0.016, 0.012]);
      for (const [a, y0, len] of [[0.4, 0.75, 0.42], [2.6, 0.95, 0.36], [4.6, 0.55, 0.4]]) stem([[0, y0, 0], [Math.cos(a) * len * 0.5, y0 + len * 0.6, Math.sin(a) * len * 0.5], [Math.cos(a) * len * 0.62, y0 + len, Math.sin(a) * len * 0.62]], [0.014, 0.012, 0.01]);
      for (const [x, y, z] of [[0, 1.4, 0], [Math.cos(0.4) * 0.26, 1.17, Math.sin(0.4) * 0.26], [Math.cos(2.6) * 0.223, 1.31, Math.sin(2.6) * 0.223], [Math.cos(4.6) * 0.248, 0.95, Math.sin(4.6) * 0.248]]) {
        g.col(GREY, 0.8).tube([[x, y - 0.02, z], [x, y + 0.03, z], [x, y + 0.08, z], [x, y + 0.13, z], [x, y + 0.16, z]], [0.024, 0.055, 0.036, 0.062, 0.04], 4, { colors: [GREY.map((v) => v * 0.8), GREY.map((v) => v * 0.8), GREY.map((v) => v * 0.8), HEAD, HEAD] }); }
      for (let i = 0; i < 11; i++) { const a = i * 2.4, y = 0.1 + i * 0.105, l = 0.3 - i * 0.015, cx = Math.cos(a), cz = Math.sin(a); g.col(GREY, 1.1).tri([0, y, 0], [cx * l * 0.5 - cz * 0.045, y + 0.09, cz * l * 0.5 + cx * 0.045], [cx * l, y + 0.03, cz * l]).tri([0, y, 0], [cx * l, y + 0.03, cz * l], [cx * l * 0.5 + cz * 0.045, y + 0.05, cz * l * 0.5 - cx * 0.045]); }
      // the meadow's own stretch: from where the shore leaves the road to where the last bend begins (and a little about both)
      for (let s = PL.shore[1] - 6; s < PL.bend5 + 6; s += 0.5) for (const side of [-1, 1]) {
        const q = wr(), d = side * (2.7 + 12 * q * q), [x, z] = P(s + wr.range(-0.25, 0.25), d); land.zone(x, z, zv); if (zv.water > -0.8) continue;
        const y = earthAt(x, z) - 0.03, pick = wr();
        if (pick < 0.42) { const k = wr.range(0.9, 1.18); th.push({ x, y, z, rot: wr() * 6.283, s: k, tx: wr.range(-0.08, 0.08), tz: wr.range(-0.08, 0.08), col: [wr.range(0.85, 1.1), wr.range(0.9, 1.1), wr.range(0.85, 1.1)] }); thistleAt.push([x, z, k, s, d]); }
        else if (pick < 0.8) { const gk = wr.range(0.75, 1.05); sedge.push({ x, y, z, rot: wr() * 6.283, s: wr.range(0.8, 1.2), tx: wr.range(-0.1, 0.1), tz: wr.range(-0.1, 0.1), col: [gk, gk, gk] }); }
        // (a tall flower: its gate and its figures are drawn on every visit; the visit's density only decides whether it is SHOWN)
        else { const gate = wr(), b = wr.range(0.85, 1.1), it = { x, y, z, rot: wr() * 6.283, s: wr.range(0.9, 1.3), tx: wr.range(-0.1, 0.1), tz: wr.range(-0.1, 0.1), col: [b, b, b] }; if (gate < V.density) tall.push(it); }
      }
      // THE SHORE OF THE WET MEADOW AGAINST THE WORKED FLANK, left of the road (the part's shoreEdge: the very line the ground's skin cuts): a reed
      // or a sedge clump every 2.6 m of it from the verge out, each within 2.5 m of the line; and sedge about the flank's wet hollows (at their
      // rims, never in the water). From the stream 'shoreline'; the sedge joins the meadow's own sedge (one mesh for all).
      const sl = S.shoreline, shoreReeds = [];
      for (let ad = 5.5; ad < 66; ad += 2.6) {
        const [x, z] = P(shoreEdge(PL, ad, bankPh) + sl.range(-2.5, 2.5), -(ad + sl.range(-1, 1))), y = earthAt(x, z) - 0.04, gk = sl.range(0.7, 1), reed = sl() < 0.6;
        (reed ? shoreReeds : sedge).push({ x, y, z, rot: sl() * 6.283, s: reed ? sl.range(0.75, 1.1) : sl.range(0.9, 1.3), tx: sl.range(-0.08, 0.08), tz: sl.range(-0.08, 0.08), col: [gk, gk, gk] });
      }
      for (let i = 0, n = 0; i < 500 && n < 20; i++) {
        const [x, z] = P(sl.range(PL.crest + 8, PL.shore[1] + 8), -sl.range(8, 60)), h = hollowAt(x, z, bankPh), gk = sl.range(0.75, 1.05), k = sl.range(0.85, 1.25), rot = sl() * 6.283;
        if (h < HOLLOW.at - 0.3 || h > HOLLOW.at - 0.03 || land.zone(x, z, zv).paintStub < 0.5) continue;
        sedge.push({ x, y: earthAt(x, z) - 0.04, z, rot, s: k, col: [gk, gk, gk] }); n++;
      }
      // THE FLANK'S TURF carries sedge in 26 tufts of one to four, from a stream of its own ('flanksedge'): on the turf between the wheat's end and
      // the shore's line, 6 m and more from the road's line, never in a hollow's water. The draws are the same whatever is kept.
      { const fs = S.flanksedge;
        for (let i = 0; i < 26; i++) {
          const s0 = fs.range(PL.crest + 3, PL.shore[1] + 10), d0 = -fs.range(6, 58), n = 1 + Math.floor(fs() * 4);
          for (let k = 0; k < 4; k++) {
            const [x, z] = P(s0 + fs.range(-1.6, 1.6), d0 + fs.range(-1.6, 1.6)), gk = fs.range(0.7, 1.05), sc = fs.range(0.8, 1.3), rot = fs() * 6.283;
            if (k >= n) continue;
            land.zone(x, z, zv); if (zv.paintStub < 0.5 || zv.s > shoreEdge(PL, zv.ad, bankPh) - 1 || hollowAt(x, z, bankPh) > HOLLOW.at - 0.05) continue;
            sedge.push({ x, y: earthAt(x, z) - 0.04, z, rot, s: sc, col: [gk, gk, gk] });
          }
        }
      }
      { const m = inst(flora.reedGeometry({ rng: sl.fork('reed'), height: 1.9, blades: 5, cattails: 1, leaf: '#4a7a34', tip: '#b8b060', root: '#243e20', head: '#4a3020' }), leafMat, shoreReeds); m.name = 'shore-reeds'; beyondG.add(m); }
      // (each mesh carries its name)
      const named = (m, name) => { m.name = name; beyondG.add(m); };
      named(inst(g.toGeometry(), solidMat, th), 'meadow-thistles');
      named(inst(flora.reedGeometry({ rng: wr.fork('sedge'), height: 1.25, blades: 7, cattails: 0, leaf: '#4f7a3a', tip: '#a8a868', root: '#2a4424' }), leafMat, sedge), 'meadow-sedge');
      named(inst(flora.flowerGeometry({ rng: wr.fork('tall'), root: '#3d6122', color: '#f4f2e6', height: 1.1, width: 0.7, cards: 3 }), lowMat, tall), 'meadow-tall');
    }
    // the rail fence 3 m left of the line from the meadow's first post to its last: posts and rails with thickness; the plank culvert in the hollow
    const fence4 = line(PL.fence4[0], PL.fence4[1], -3, 2.8); fence(GM.meadow, fence4, S.fence, { h: 1.15, rails: 2 });
    { const a = road.at(PL.culvert), y = road.yAt(PL.culvert); GM.meadow.tr(a[0], y, a[1], -a[2]).kind(4);
      for (let i = -4; i <= 4; i++) GM.meadow.col(OLDWOOD, S.fence.range(0.75, 1.1)).box(-2.25, -0.05, i * 0.27 - 0.125, 2.25, 0.035, i * 0.27 + 0.125);
      for (const e of [-2.3, 2.3]) GM.meadow.col(OLDWOOD, 0.8).box(e - 0.09, -0.05, -1.5, e + 0.09, 0.2, 1.5);
      GM.meadow.pop(); }
    await ctx.yield();
    // TWO DEER grazing in the mist left of the road: dark, with the hour's rim; each lowers and raises its head on beats of its own (they read no eye and never look up at us)
    {
      const dr = S.deer, DEER = linear('#6a5340'), body = makeGeo(), neck = makeGeo();
      body.kind(0).col(DEER).tube([[0, 0.98, -0.62], [0, 1.02, -0.45], [0, 1.0, 0], [0, 1.03, 0.42], [0, 1.08, 0.6]], [[0.07, 0.1], [0.2, 0.25], [0.21, 0.26], [0.19, 0.25], [0.1, 0.14]], 8);
      for (const [x, z] of [[-0.12, -0.42], [0.12, -0.46], [-0.11, 0.4], [0.11, 0.44]]) body.col(DEER, 0.75).tube([[x, 0.9, z], [x, 0.5, z + 0.03], [x, 0, z]], [0.07, 0.04, 0.03], 5);
      body.col([0.8, 0.78, 0.7]).tube([[0, 1.02, -0.6], [0, 0.9, -0.7]], [0.05, 0.02], 4);
      neck.kind(0).col(DEER).tube([[0, 0, -0.05], [0, 0.02, 0.3], [0, 0.02, 0.56]], [[0.1, 0.14], [0.08, 0.1], [0.065, 0.08]], 7).tube([[0, 0.03, 0.52], [0, 0.0, 0.7], [0, -0.05, 0.86]], [[0.07, 0.08], [0.055, 0.06], 0.03], 7);
      for (const e of [-1, 1]) neck.col(DEER, 0.85).tri([e * 0.04, 0.08, 0.5], [e * 0.13, 0.2, 0.46], [e * 0.07, 0.07, 0.58]);
      const bg = body.toGeometry(), ng = neck.toGeometry();
      PL.deer.forEach(([x, z], i) => {
        const grp = new THREE.Group(), b = new THREE.Mesh(bg, solidMat), n = new THREE.Mesh(ng, solidMat), k = dr.range(0.95, 1.1);
        n.position.set(0, 1.08, 0.55); grp.add(b); grp.add(n); grp.position.set(x, earthAt(x, z), z); grp.rotation.y = dr() * 6.283; grp.scale.setScalar(k); beyondG.add(grp);
        const T = dr.range(7.5, 11.5), ph = dr(), up = dr.range(0.22, 0.34), w2 = dr.range(1.7, 2.3), p2 = dr() * 6.283;
        frame.push((time) => { const c = (time / T + ph) % 1, lift = smoothstep(0, 0.08, c) * (1 - smoothstep(up, up + 0.1, c)); n.rotation.x = lerp(1.05 + 0.05 * Math.sin(time * w2 + p2), -0.5, lift); });
      });
    }
    await ctx.yield();
    // THE WEBS. TWELVE GREAT ONES, 0.8 to 1.4 m across, each a wheel hung between two supports that are plainly there (a fence post and a
    // stalk, or two stalks), its nearest edge 2.6 m or more from the line, one in each twelfth of the stretch from the shore's last reeds to
    // a little into the last bend; about three hundred small ones strung from the thistles beyond. Each catches the lamps by its own
    // distance from the flames; the dew on it is the table's standing figure at its own place; its light is the eye's row.
    {
      const wr = S.webs, Pw = [], Uw = [], Aw = [], Iw = [], STALK = linear('#7a7a58');
      const quad = (cx, cy, cz, hx, hz, size, seed) => { const b = Pw.length / 3; Pw.push(cx - hx, cy - size * 0.5, cz - hz, cx + hx, cy - size * 0.5, cz + hz, cx + hx, cy + size * 0.5, cz + hz, cx - hx, cy + size * 0.5, cz - hz);
        Uw.push(-1, -1, 1, -1, 1, 1, -1, 1); for (let k = 0; k < 4; k++) Aw.push(seed, size); Iw.push(b, b + 1, b + 2, b, b + 2, b + 3); };
      // a tall dry stalk with a seed head: a support
      const stalk = (x, z, h) => { const y = earthAt(x, z), lx = wr.range(-0.04, 0.04), lz = wr.range(-0.04, 0.04); GM.meadow.kind(0).col(STALK, wr.range(0.8, 1.1)).tube([[x, y - 0.05, z], [x + lx * 0.5, y + h * 0.5, z + lz * 0.5], [x + lx, y + h, z + lz]], [0.022, 0.017, 0.012], 5, { cap: false }).tube([[x + lx, y + h - 0.02, z + lz], [x + lx, y + h + 0.1, z + lz], [x + lx, y + h + 0.2, z + lz]], [0.02, 0.05, 0.012], 5); };
      const W0 = PL.shore[1] + 4, W1 = PL.bend5 + 4, slot = (W1 - W0) / 12;
      for (let i = 0; i < 12; i++) {
        const size = wr.range(0.8, 1.4), s0 = W0 + (i + wr.range(0.2, 0.8)) * slot, left = wr() < 0.5, post = left && s0 > PL.fence4[0] && s0 < PL.fence4[1];
        // with a post: at the nearest post of the meadow's fence, the web outside it; otherwise between two stalks
        const s = post ? PL.fence4[0] + Math.round((s0 - PL.fence4[0]) / 2.8) * 2.8 : s0, dIn = post ? 3.12 : wr.range(2.7, 6 - size - 0.2), side = left ? -1 : 1;
        const a = road.at(s, side * dIn), b = road.at(s, side * (dIn + size + 0.12)), cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, cy = earthAt(cx, cz) + (post ? 0.62 : wr.range(0.2, 0.34)) + size * 0.5;
        if (!post) stalk(a[0], a[1], cy - earthAt(a[0], a[1]) + size * 0.5 + 0.08); stalk(b[0], b[1], cy - earthAt(b[0], b[1]) + size * 0.5 + 0.08);
        quad(cx, cy, cz, (b[0] - a[0]) / 2, (b[1] - a[1]) / 2, size, wr());
      }
      const n = Math.round(300 * V.density);
      for (let i = 0; i < n && thistleAt.length > 1; i++) {
        const a = thistleAt[wr.int(0, thistleAt.length - 1)], size = wr.range(0.3, 0.9), yaw = wr() * 3.1416, far = Math.abs(a[4]) > 4.6;
        if (!far) continue;
        quad(a[0] + Math.cos(yaw) * size * 0.55, earthAt(a[0], a[1]) + wr.range(0.45, 1.25) * a[2], a[1] + Math.sin(yaw) * size * 0.55, Math.cos(yaw) * size * 0.5, Math.sin(yaw) * size * 0.5, size, wr());
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(Pw, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(Uw, 2)); wg.setAttribute('aWeb', new THREE.Float32BufferAttribute(Aw, 2)); wg.setIndex(Iw);
      const wm = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`attribute vec2 aWeb; varying vec2 vUv, vWeb; varying vec3 vW;
          ${GLSL_ROW}
          void main(){ vUv = uv; vWeb = aWeb; vec3 p = position; p.xz += uWind.xy * (.03 * aWeb.y * (.3 + hourGust(p.xz)) * sin(uTime * 1.7 + aWeb.x * 40.) * (1. - dot(uv, uv) * .5));
            vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`varying vec2 vUv, vWeb; varying vec3 vW;
          ${GLSL_HOURS}
          void main(){
            float r = length(vUv), px = fwidth(r) + 1e-4, n = 11. + floor(vWeb.x * 8.);
            if (r > 1.) discard;
            // (the angle is not defined at the web's very centre: there it is taken as nought)
            float a = r > 1e-3 ? atan(vUv.y, vUv.x) : 0.;
            // spokes and the spiral's turns, as fine as a pixel; beads of dew as separate drops along both
            float sp = abs(fract(a / 6.2832 * n + .5) - .5) * 6.2832 / n * r, spoke = 1. - smoothstep(0., px * 1.2, sp);
            float turns = (9. + floor(vWeb.x * 57.) * .1) * (.7 + .5 * vWeb.y), tr = r * turns - a / 6.2832, ring = (1. - smoothstep(0., px * turns * 1.2, abs(fract(tr) - .5))) * step(.12, r);
            float thread = max(spoke, ring * .8) * (1. - smoothstep(.9, 1., r));
            vec2 bc = vec2(a * n * 1.5, r * turns * 2.), bf = fract(bc) - .5; float bead = step(.8, hHash(floor(bc) + vWeb.x * 91.)) * (1. - smoothstep(.12, .3, length(bf))) * step(.1, thread + ring + spoke);
            float dew = standDew(hourS(vW.xz)), lod = clamp(.004 / px, .15, 1.);
            vec3 V = normalize(cameraPosition - vW); vec4 key = uRow[0], kd = uRow[1], fill = uRow[2];
            float back = clamp(dot(-V, normalize(kd.xyz + vec3(0., 1e-3, 0.))), 0., 1.); back *= back * back;
            vec3 c = (fill.rgb * .5 + key.rgb * (.15 + 1.2 * back)) * thread * (.35 + .65 * dew) + (fill.rgb * 1.6 + key.rgb * (.8 + 4. * back) + firstLight(V) * 3.) * bead * dew;
            c += lampLight(vW, V) * (thread * 1.2 + bead * 6.);
            gl_FragColor = vec4(c * lod * exp(-distance(vW, cameraPosition) * uRow[4].a), 1.);
          }` }));
      wm.frustumCulled = false; wm.renderOrder = 2; beyondG.add(wm);
    }
    // fireflies low over the wet meadow (four times as many on the rare visit) and within 12 m of the line along the last road's bank; a dozen bats high over the meadow (their round 11.5 to 12.5 m over the road's own height)
    fauna.add(F.makeFireflies({ rng: S.fireflies.fork('meadow'), path, uFrom: (PL.shore[1] - 6) / L, uTo: (PL.bend5 + 8) / L, count: Math.round(400 * V.density * (V.rare ? 4 : 1)), spread: 34, clear: 2.6, lift: [-2.4, V.rare ? 3.5 : -0.4], size: 0.075, halo: 0.9, nearFade: [0.8, 2.5], color: '#d8ff7a', color2: '#ffc860' }));
    fauna.add(F.makeFireflies({ rng: S.fireflies.fork('bank'), path, uFrom: PL.bendEnd / L, uTo: 0.999, count: Math.round(130 * V.density), spread: 12, clear: 2.6, lift: [-2.6, -0.9], size: 0.075, halo: 0.9, nearFade: [0.8, 2.5], color: '#d8ff7a', color2: '#ffc860' }));
    { const br = [], m0 = PL.shore[1], m1 = PL.bend5; for (const [f, d, y] of [[0.1, -16, 11.5], [0.4, -20, 12.5], [0.8, -14, 11.5], [1, 0, 12], [0.8, 13, 12.5], [0.5, 8, 11.5], [0.2, 6, 12.5], [0, 0, 12]]) { const s = lerp(m0, m1, f), p = P(s, d); br.push([p[0], road.yAt(s) + y, p[1]]); }
      fauna.add(F.makeFlock({ rng: S.bats.fork('g'), species: 'bats', count: 12, route: br, closed: true, start: S.bats(), spread: [3, 1, 40], wander: [1.2, 0.8, 1.2, 0.8], maxSigma: 3, size: 1.3 })); }
    await ctx.yield();
    // ------------------------------------------------------------ SHADE CARDS: the long shade a small standing thing (a shock, the wagon, a lying cow, a gatepost) lays on the ground,
    // away from the sun's one bearing; its length is the thing's height over the tangent of the sun's height in the eye's row, cut in the shader (nothing at night)
    const shadeCards = [], shadeDir = bearingDir(SUN_BEARING + 180);
    const shadeOf = (x, z, r, h) => shadeCards.push([x, z, r, h]);

    // ------------------------------------------------------------ HOUR 3: THE SUN ON THE WATER (as made, re-laid on the new road): reeds and their gaps, the leaning alder on its point,
    // herons, geese, dragonflies; shocks of sheaves on the reaped strip
    {
      const rr = S.reeds, list = [[], []];
      for (let s = PL.shore[0] - 2; s < PL.shore[1] + 2; s += 0.4) {
        if (land.gapAt(s) > 0.3) continue;
        const d = 4 + 5 * Math.pow(rr(), 0.8), [x, z] = P(s + rr.range(-0.2, 0.2), d); land.zone(x, z, zv);
        if (zv.reach < -3.2) continue;
        const g = rr.range(0.7, 1.05); list[rr() < 0.5 ? 0 : 1].push({ x, y: Math.max(earthAt(x, z), REACH_Y - 0.35), z, rot: rr() * 6.283, s: rr.range(0.85, 1.12), tx: rr.range(-0.06, 0.06), tz: rr.range(-0.06, 0.06), col: [g, g, g] });
      }
      // (their images in the reach are of a lighter clump of the same reed: four blades and one head)
      const REED = { height: 2.2, leaf: '#4a7a34', tip: '#b8b060', root: '#243e20', head: '#4a3020' };
      // (the two clumps' forms first, from the forks g0 and g1; the forks of the two images are taken after them, the stream's last draws)
      list.forEach((l, i) => { const m = inst(flora.reedGeometry({ rng: rr.fork('g' + i), blades: 5, cattails: 2, ...REED }), leafMat, l); m.name = 'reach-reeds-' + i; beyondG.add(m); });
      list.forEach((l, i) => { const b = inst(flora.reedGeometry({ rng: rr.fork('i' + i), blades: 4, cattails: 1, ...REED }), leafMirror[0], l); b.renderOrder = -9; b.frustumCulled = false; beyondG.add(b); });
      // ONE LEANING ALDER, 14 m, on its low grassy point: its foot in the turf with roots, shade at its foot, its image under it
      const ar = S.alder, [ax, az] = PL.alder, ay = earthAt(ax, az) - 0.12, ag = flora.birchGeometry({ rng: ar.fork('g'), height: 14, detail: KD, leaf: '#3c6532', leafLight: '#8aa850', leafDark: '#182f1e', bark: '#4a4238', barkDark: '#2a2622', barkLight: '#6a5e50' });
      const yawA = Math.atan2(PL.dirSun[0], PL.dirSun[1]) + ar.range(-0.3, 0.3);
      for (const [mat, ro] of [[leafMat, 0], [leafMirror[0], -9]]) { const m = new THREE.Mesh(ag, mat); m.position.set(ax, ay, az); m.rotation.set(0.17, yawA, 0, 'YXZ'); m.scale.set(1.5, 1, 1.5); m.renderOrder = ro; m.frustumCulled = false; (ro ? beyondG : scene).add(m); }
      gW[0].kind(4); for (let i = 0; i < 6; i++) { const a = ar() * 6.283, l = ar.range(0.9, 1.7); gW[0].col(linear('#4a4238'), ar.range(0.8, 1.1)).tube([[ax + Math.cos(a) * l, ay + 0.02, az + Math.sin(a) * l], [ax + Math.cos(a) * 0.45, ay + 0.2, az + Math.sin(a) * 0.45], [ax + Math.cos(a) * 0.2, ay + 0.75, az + Math.sin(a) * 0.2]], [0.04, 0.13, 0.12], 5); }
      cast(ax, az, 0.4, ay, ay + 6, 0.75, 0.55, 2); cast(ax + PL.dirSun[0] * 1.5, az + PL.dirSun[1] * 1.5, 4.5, ay + 5, ay + 13, 0.45, 0.2, 2);
    }
    await ctx.yield();
    {
      // three herons in the shallows 12 to 20 m off, their stands drawn over the shore's own length; forty geese on one long round written from the
      // reach's own places (its head, its length toward the sun's bearing); dragonflies over the water at the reed gaps
      const hr = S.herons, hp = [];
      for (let tries = 0; hp.length < 3 && tries < 600; tries++) { const s = hr.range(PL.shore[0], PL.shore[1]), d = hr.range(12, 20), [x, z] = P(s, d); land.zone(x, z, zv); if (zv.reach > 2.5 && !hp.some((p) => Math.hypot(p[0] - x, p[2] - z) < 11)) hp.push([x, REACH_Y, z]); }
      if (hp.length) fauna.add(F.makeWaders({ rng: hr.fork('w'), species: 'heron', count: hp.length, positions: hp, level: REACH_Y, depth: 0.3, size: 1.15, active: 0.6, body: '#5a6470', wing: '#3e4854' }), { always: true });
      const gr = S.geese, loop = [], LONG = 150, WIDE = 42, px = -PL.dirSun[1], pz = PL.dirSun[0];
      // (the round lies along the reach's own length and begins 140 m down it from its head, where the water is wide enough for the skein's
      // 36 m arms: by sum every point of it is over the reach, 119 m and more from the road's line)
      const cx = PL.head[0] + PL.dirSun[0] * (LONG + 140), cz = PL.head[1] + PL.dirSun[1] * (LONG + 140);
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, u1 = Math.cos(a) * LONG, v1 = Math.sin(a) * WIDE; loop.push([cx + PL.dirSun[0] * u1 + px * v1, REACH_Y + 5.5 + 1.5 * Math.sin(a * 2 + gr() * 0.5), cz + PL.dirSun[1] * u1 + pz * v1]); }
      const gStart = gr();
      fauna.add(F.makeFlock({ rng: gr.fork('g'), species: 'geese', count: 40, spacing: 1.7, wander: [0.35, 0.3, 0.3, 0.5], route: loop, closed: true, start: gStart, speed: 15, body: '#3a3630', belly: '#5a5248', wingC: '#2e2a26' }), { always: true });
      const dr = S.dragonflies, anchors = [];
      for (const [a, w] of gaps) for (let k = 0; k < Math.round(4 * V.density); k++) { const [x, z] = P(a + dr.range(0, w), dr.range(5.6, 9.5)); anchors.push([x, REACH_Y + dr.range(0.5, 1.6), z]); }
      if (anchors.length) fauna.add(F.makeDragonflies({ rng: dr.fork('g'), count: anchors.length, positions: anchors, roam: [1.6, 0.5, 0.75, 0], size: 2 }));
    }
    // SHOCKS OF SHEAVES (upright bundles leaned together, 1.4 m tall; never a round heap): about forty in files on the reaped strip to the right of the wheat
    {
      const sr = S.shocks, shocks = [];
      const put = (s, d) => { const [x, z] = P(s, d); land.zone(x, z, zv); if (zv.reaped < 0.6 || zv.water > -2) return; const k = sr.range(0.92, 1.1); shocks.push({ x, y: earthAt(x, z), z, rot: sr() * 6.283, s: k, tx: sr.range(-0.05, 0.05), tz: sr.range(-0.05, 0.05), col: [sr.range(0.9, 1.1), sr.range(0.9, 1.05), sr.range(0.85, 1)] }); shadeOf(x, z, 0.5 * k, 1.4 * k); };
      for (const d of [9.5, 17, 24.5, 32, 38]) for (let s = PL.reapedR[0] + 2.5; s < PL.reapedR[1] - 1; s += 6.6) put(s + sr.range(-0.7, 0.7), d + sr.range(-0.6, 0.6));
      scene.add(inst(shockGeometry(), solidMat, shocks));
    }
    await ctx.yield();
    // ------------------------------------------------------------ BUILDINGS: a plain gabled building in its own frame (x across, z along, the front gable at +z),
    // set down at (x, z) turned by yaw, on a stone footing that goes into the ground: clapboard or boards, paned windows with trim (and shutters),
    // a door, a roof with an overhang and a dark edge under it
    const WHITE = linear('#f1eee4'), ROOF = linear('#5d5a58'), GLASS = linear('#4a6278'), BARNRED = linear('#74443a'), TRIM = linear('#e4e0d4'), SHUTTER = linear('#3f6a52'), FOOT = linear('#8f897c');
    const house = (g, x, z, yaw, w, l, wall, ridge, o = {}) => {
      const hw = w / 2, hl = l / 2, ov = o.over ?? 0.35, wc = o.col || WHITE, y0 = o.y ?? earthAt(x, z), ft = o.foot ?? 0.45;
      g.tr(x, y0, z, yaw).kind(2).col(FOOT, 0.8).box(-hw - 0.06, -1.2, -hl - 0.06, hw + 0.06, ft, hl + 0.06);
      g.kind(o.kind ?? 1).col(wc).box(-hw, ft, -hl, hw, wall, hl, { top: false });
      for (const e of [-1, 1]) g.tri([-hw * e, wall, hl * e], [hw * e, wall, hl * e], [0, ridge, hl * e]);
      const run = hw + ov, drop = (ridge - wall) * ov / hw, rc = o.roof || ROOF;
      g.kind(3).col(rc);
      for (const e of [-1, 1]) { g.quad([0, ridge + 0.06, (hl + ov) * e], [run * e, wall - drop + 0.06, (hl + ov) * e], [run * e, wall - drop + 0.06, -(hl + ov) * e], [0, ridge + 0.06, -(hl + ov) * e]);
        g.col(rc, 0.6).quad([0, ridge - 0.02, (hl + ov) * e], [run * e, wall - drop - 0.02, (hl + ov) * e], [run * e, wall - drop - 0.02, -(hl + ov) * e], [0, ridge - 0.02, -(hl + ov) * e]).col(rc); }
      const win = (px, pz, nx, nz, ww, wh, yb) => { const tx = -nz, tz = nx, a = ww / 2, e = 0.04;
        const q = (u0, v0, u1, v1, off) => g.quad([px + tx * u0 + nx * off, v0, pz + tz * u0 + nz * off], [px + tx * u1 + nx * off, v0, pz + tz * u1 + nz * off], [px + tx * u1 + nx * off, v1, pz + tz * u1 + nz * off], [px + tx * u0 + nx * off, v1, pz + tz * u0 + nz * off]);
        g.kind(0).col(TRIM); q(-a - 0.09, yb - 0.09, a + 0.09, yb + wh + 0.09, e); g.col(GLASS, o.glassK ?? 1); q(-a, yb, a, yb + wh, e + 0.02);
        g.col(TRIM); q(-0.025, yb, 0.025, yb + wh, e + 0.04); for (const f of [1 / 3, 2 / 3]) q(-a, yb + wh * f - 0.02, a, yb + wh * f + 0.02, e + 0.04);
        if (o.shutters) { g.col(SHUTTER); q(-a - 0.09 - ww * 0.5, yb, -a - 0.11, yb + wh, e + 0.03); q(a + 0.11, yb, a + 0.09 + ww * 0.5, yb + wh, e + 0.03); } };
      const nw = o.windows ?? 0; for (let i = 0; i < nw; i++) { const pz = lerp(-hl, hl, (i + 0.5) / nw) * 0.86; for (const e of [-1, 1]) win(hw * e, pz, e, 0, o.winW ?? 1.1, o.winH ?? 2.1, ft + (o.winY ?? 0.9)); }
      if (o.front) for (const [fx, fw, fh, fy] of o.front) win(fx, hl, 0, 1, fw, fh, fy);   // (windows in the front gable: [x, width, height, sill])
      if (o.door) { const dw = o.door / 2, dh = o.doorH ?? 2.2; g.kind(4).col(o.doorCol || linear('#5c6a5a')).quad([-dw, ft, hl + 0.05], [dw, ft, hl + 0.05], [dw, ft + dh, hl + 0.05], [-dw, ft + dh, hl + 0.05]);
        g.kind(0).col(TRIM); for (const [a, b, c, d] of [[-dw - 0.12, ft + dh, dw + 0.12, ft + dh + 0.2], [-dw - 0.12, ft, -dw, ft + dh], [dw, ft, dw + 0.12, ft + dh]]) g.quad([a, b, hl + 0.04], [c, b, hl + 0.04], [c, d, hl + 0.04], [a, d, hl + 0.04]); }
      if (o.chimney) { const c = o.chimney; g.kind(2).col(linear('#8a6a5a')).box(c[0] - 0.35, wall, c[1] - 0.35, c[0] + 0.35, ridge + 0.9, c[1] + 0.35); }
      return g;   // (left in the building's frame: the caller adds its own parts and pops)
    };
    // a dry stone wall 1 m high through two points, following the ground; stones of differing height and tone
    const stoneWall = (g, a, b, r) => { const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), n = Math.max(1, Math.round(len / 1.6)), yaw = Math.atan2(dx, dz);
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), h = r.range(0.88, 1.08), th = r.range(0.24, 0.3); g.tr(x, earthAt(x, z), z, yaw).kind(2).col(STONE, r.range(0.85, 1.1)).box(-th, -0.4, -len / n / 2 - 0.02, th, h, len / n / 2 + 0.02); }
      g.pop(); };

    // ------------------------------------------------------------ HOUR 2: THE WHEAT (the hero) from the stone gateposts to the crest, on its swells; the split rails on the right
    const wheat = await makeWheat(road, WU, { from: PL.posts + 1, to: PL.crest + 8, rng: S.rows, heightAt: earthAt, valid: (x, z) => land.zone(x, z, zv).wheat > 0.5, yield: ctx.yield });
    scene.add(wheat.object);
    await ctx.yield();
    for (const d of [-2.7, 2.7]) { const [x, z] = P(PL.posts, d), y = earthAt(x, z); GM.farm.tr(x, y, z, road.at(PL.posts)[2] * -1).kind(2).col(STONE, S.walls.range(0.85, 1)).box(-0.24, -0.3, -0.24, 0.24, 1.45, 0.24).col(STONE, 1.08).box(-0.3, 1.45, -0.3, 0.3, 1.57, 0.3).pop(); shadeOf(x, z, 0.3, 1.55); }
    // THE SPLIT RAILS on the right, 3 m from the line, from 14 m before the gateposts on into the grain: weathered grey posts 1.55 m tall that stand
    // over the ears, three sagging rails, the top one over the heads of the wheat (from the stream 'walls')
    fence(GM.farm, line(PL.railR[0], PL.railR[1], 3), S.walls, { rails: 3, h: 1.55, col: GREYWOOD, sag: 0.07 });
    await ctx.yield();
    // THE GREAT RED BARN with its silo and the lane's six elms, where the second bend points the road: ahead and growing, then passing on the left
    {
      const [bx, bz] = PL.barn, to = P(PL.bend2End), yaw = Math.atan2(to[0] - bx, to[1] - bz), by = earthAt(bx, bz) - 0.15, hw = PL.barnWide, hl = PL.barnHalf, g = GM.farm, DARK = linear('#3a2a24');
      house(g, bx, bz, yaw, hw * 2, hl * 2, 7.6, 13, { col: BARNRED, kind: 4, roof: linear('#4a4644'), over: 0.6, y: by, foot: 0.7 });
      // the great doors in the front gable with white battens, the hay door over them, small paned lights along both sides
      const pane = (a, b, c, d, zz, col, k = 1) => g.col(col, k).quad([a, b, zz], [c, b, zz], [c, d, zz], [a, d, zz]);
      g.kind(4); pane(-2.3, 0.7, 2.3, 5.2, hl + 0.05, BARNRED, 0.72); pane(-0.9, 7.9, 0.9, 10, hl + 0.05, BARNRED, 0.7);
      g.kind(0); for (const [a, b, c, d] of [[-2.42, 0.7, -2.3, 5.32], [2.3, 0.7, 2.42, 5.32], [-2.42, 5.2, 2.42, 5.32], [-0.05, 0.7, 0.05, 5.2], [-1, 7.8, 1, 7.9], [-1, 10, 1, 10.1], [-1, 7.8, -0.9, 10.1], [0.9, 7.8, 1, 10.1]]) pane(a, b, c, d, hl + 0.07, TRIM);
      for (const [u0, u1] of [[-2.3, -0.05], [2.3, 0.05]]) g.col(TRIM).quad([u0, 0.8, hl + 0.07], [u0 + 0.14 * Math.sign(u1 - u0), 0.8, hl + 0.07], [u1, 5.1, hl + 0.07], [u1 - 0.14 * Math.sign(u1 - u0), 5.1, hl + 0.07]);
      for (let i = 0; i < 5; i++) for (const e of [-1, 1]) { const pz = lerp(-hl, hl, (i + 0.5) / 5) * 0.88, xx = (hw + 0.04) * e;
        g.col(TRIM).quad([xx, 3.0, pz - 0.55], [xx, 3.0, pz + 0.55], [xx, 4.1, pz + 0.55], [xx, 4.1, pz - 0.55]).col(GLASS).quad([xx + 0.02 * e, 3.1, pz - 0.45], [xx + 0.02 * e, 3.1, pz + 0.45], [xx + 0.02 * e, 4.0, pz + 0.45], [xx + 0.02 * e, 4.0, pz - 0.45]); }
      g.kind(6).col(linear('#b08a3a')).tube([[0, 13.05, 0], [0, 14.3, 0]], 0.035, 4).tube([[-0.5, 14.1, 0], [0.5, 14.1, 0]], 0.028, 4).tri([0.5, 14.26, 0], [0.5, 13.94, 0], [0.8, 14.1, 0]).pop();
      const ax = [Math.sin(yaw), Math.cos(yaw)]; for (const k of [-0.5, 0.5]) cast(bx + ax[0] * hl * k, bz + ax[1] * hl * k, hw * 1.05, by, by + 10.5, 0.8, 0.5, 1);
      // the silo: staves bound with hoops, a low cone on top
      const [sx, sz] = PL.silo, sy = earthAt(sx, sz) - 0.2, SIL = linear('#a9a294');
      g.kind(4).col(SIL).tube([[sx, sy, sz], [sx, sy + 15.2, sz]], 2.6, 14, { cap: false }).kind(3).col(linear('#56524e')).tube([[sx, sy + 15.1, sz], [sx, sy + 15.3, sz], [sx, sy + 17, sz]], [2.85, 2.75, 0.1], 14);
      for (let y = 1.2; y < 15; y += 1.7) g.kind(6).col(DARK).tube([[sx, sy + y, sz], [sx, sy + y + 0.09, sz]], 2.64, 14, { cap: false });
      cast(sx, sz, 2.6, sy, sy + 16, 0.8, 0.5, 1);
      // THE LANE'S SIX ELMS, 22 to 26 m, three to a side of the lane
      const el = [], [l0, l1] = PL.lane, lx = l1[0] - l0[0], lz = l1[1] - l0[1], ll = Math.hypot(lx, lz), eg = S.lane;
      for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6 + eg.range(-0.03, 0.03), side = i % 2 ? 1 : -1, x = l0[0] + lx * t - lz / ll * side * 6.5, z = l0[1] + lz * t + lx / ll * side * 6.5, k = eg.range(22, 26) / 24, y = earthAt(x, z) - 0.2, c = eg.range(0.85, 1.05);
        el.push({ x, y, z, rot: eg() * 6.283, s: k, col: [c, c, c] }); cast(x, z, 5.5 * k, y + 2, y + 23 * k, 0.55, 0.35, 2); }
      scene.add(inst(flora.mapleGeometry({ rng: eg.fork('g'), height: 24, detail: 1, leaf: '#3f6f30', leafLight: '#8aa848', leafDark: '#1f4526', gold: '#557f36', crimson: '#356a2c', bark: '#5a4a3c' }), leafMat, el));
    }
    await ctx.yield();
    // THE PASTURE'S DRY STONE WALL, 1 m high, 4 m left of the line from wall's first metre to its last, with a gateway (the hay wagon stands in the
    // pasture beyond it); it turns square away at both ends and closes the pasture behind
    {
      const wr = S.walls, [w0, w1] = PL.wallL, gate = [PL.wagon - 3.2, PL.wagon + 1.2], far = -36;
      stoneWall(GM.farm, P(w0, -4), P(gate[0], -4), wr); stoneWall(GM.farm, P(gate[1], -4), P(w1, -4), wr);
      stoneWall(GM.farm, P(w0, -4), P(w0, far), wr); stoneWall(GM.farm, P(w1, -4), P(w1, far), wr);
      for (let s = w0; s < w1 - 1; s += 8) stoneWall(GM.farm, P(s, far), P(Math.min(w1, s + 8), far), wr);
      // (the wall ends at the gateway in a GATE PIER on either hand: a square pier of stone, stouter than the wall, with a cap stone, as the yard's gateposts are)
      for (const s of gate) { const [x, z] = P(s, -4), y = earthAt(x, z); GM.farm.tr(x, y, z, -road.at(s)[2]).kind(2).col(STONE, 0.95).box(-0.32, -0.3, -0.32, 0.32, 1.45, 0.32).col(STONE, 1.08).box(-0.38, 1.45, -0.38, 0.38, 1.57, 0.38).pop(); shadeOf(x, z, 0.38, 1.57); }
      // THE LOADED HAY WAGON stands ON THE PASTURE'S CART TRACK: the straight way in from the gateway's middle toward the end of the elm lane
      // at the barn. It stands WAGON_ON_TRACK of that track's length inside the pasture (from the gateway to the pasture's far wall), turned
      // along the track's own heading there with its shafts toward the gateway (and by the seed's small turn, as it was left standing): its
      // bed on four spoked wheels, the load roped down, its shafts down on the grass; no team and no one by it
      const WAGON_ON_TRACK = 0.6, gr = S.wagon, g = GM.farm, HAY = linear('#c8a850'), IRON = linear('#3a3632');
      const g0 = P((gate[0] + gate[1]) / 2, -4), tl = Math.hypot(PL.lane[1][0] - g0[0], PL.lane[1][1] - g0[1]), tdx = (PL.lane[1][0] - g0[0]) / tl, tdz = (PL.lane[1][1] - g0[1]) / tl;
      // (the track's length inside the pasture: to where it meets the far wall's line, found by halving)
      let tIn = 0; for (let lo = 0, hi = tl, i = 0; i < 30; i++) { tIn = (lo + hi) / 2; if (road.locate(g0[0] + tdx * tIn, g0[1] + tdz * tIn).d > far) lo = tIn; else hi = tIn; }
      const a = [g0[0] + tdx * tIn * WAGON_ON_TRACK, g0[1] + tdz * tIn * WAGON_ON_TRACK], wb = Math.atan2(tdx, -tdz);
      g.tr(a[0], earthAt(a[0], a[1]), a[1], -wb + gr.range(-0.2, 0.2));
      g.kind(4).col(OLDWOOD).box(-0.95, 0.95, -2.1, 0.95, 1.08, 2.1, { bottom: true });
      for (const z of [-2.05, 2.05]) for (const x of [-0.9, 0.9]) g.col(OLDWOOD, 0.85).tube([[x, 1.05, z], [x * 1.25, 2.5, z * 1.08]], 0.045, 4);
      for (const [z, R] of [[-1.35, 0.66], [1.4, 0.55]]) for (const e of [-1, 1]) {
        const cx = e * 1.08, pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * 6.2832; pts.push([cx, R + Math.cos(t) * R, z + Math.sin(t) * R]); }
        g.kind(6).col(IRON).tube(pts, 0.035, 4, { cap: false }).kind(4).col(WOOD);
        for (let k = 0; k < 6; k++) { const t = k / 6 * 3.1416; g.tube([[cx, R - Math.cos(t) * R * 0.97, z - Math.sin(t) * R * 0.97], [cx, R + Math.cos(t) * R * 0.97, z + Math.sin(t) * R * 0.97]], 0.022, 3, { cap: false }); }
        g.tube([[cx - 0.1 * e, R, z], [cx + 0.06 * e, R, z]], 0.09, 6);
      }
      for (const z of [-1.35, 1.4]) g.kind(4).col(WOOD).tube([[-1.05, z < 0 ? 0.66 : 0.55, z], [1.05, z < 0 ? 0.66 : 0.55, z]], 0.05, 5);
      // the load: a broad rounded heap, combed down its sides, a rope over it
      g.kind(9).col(HAY).tube([[0, 1.05, -2.45], [0, 1.6, -2.3], [0, 2.25, -1.3], [0, 2.5, 0], [0, 2.3, 1.3], [0, 1.65, 2.3], [0, 1.05, 2.5]], [[0.5, 0.2], [1.25, 0.75], [1.5, 1.15], [1.55, 1.25], [1.5, 1.1], [1.25, 0.7], [0.5, 0.2]], 10,
        { colors: [HAY.map((v) => v * 0.7), HAY.map((v) => v * 0.85), HAY, HAY.map((v) => v * 1.08), HAY, HAY.map((v) => v * 0.85), HAY.map((v) => v * 0.7)] });
      for (let i = 0; i < 26; i++) { const t = gr.range(-2.2, 2.2), e = gr() < 0.5 ? -1 : 1, x = e * gr.range(1.1, 1.45), y = gr.range(1.0, 1.9); g.col(HAY, gr.range(0.75, 1.1)).tri([x * 0.9, y + 0.3, t], [x * 0.9, y + 0.25, t + 0.35], [x * 1.12, y - gr.range(0.3, 0.6), t + 0.15]); }
      g.kind(0).col(linear('#b8ab8a')).tube([[-1.0, 1.0, 0.3], [-1.45, 1.9, 0.25], [0, 3.72, 0.2], [1.45, 1.9, 0.25], [1.0, 1.0, 0.3]], 0.018, 4);
      // the shafts lie forward on the ground
      for (const e of [-0.45, 0.45]) g.kind(4).col(OLDWOOD).tube([[e, 0.8, 2.05], [e * 1.05, 0.3, 3.3], [e * 1.1, 0.06, 4.9]], 0.04, 5);
      g.tube([[-0.5, 0.07, 4.75], [0.5, 0.07, 4.75]], 0.035, 5).pop();
      shadeOf(a[0], a[1], 1.7, 3.4);
    }
    await ctx.yield();
    // FIVE CATTLE LYING in the pasture's corner, 18 to 28 m left of the line: each at rest, its ears and tail moving on beats of its own (the world clock)
    const cattle = [];
    let cowEars, cowTails;
    {
      const cr = S.cattle, g = makeGeo(), ear = makeGeo(), tail = makeGeo(), W1 = [1, 1, 1], list = [];
      g.kind(0).col(W1).tube([[0, 0.32, -1.05], [0, 0.42, -0.8], [0, 0.48, -0.2], [0, 0.5, 0.4], [0, 0.5, 0.75], [0, 0.55, 0.95]], [[0.12, 0.14], [0.4, 0.36], [0.46, 0.42], [0.42, 0.4], [0.3, 0.32], [0.17, 0.2]], 9);
      g.tube([[0, 0.6, 0.85], [0, 0.82, 1.15], [0, 0.88, 1.38], [0, 0.78, 1.62], [0, 0.7, 1.74]], [[0.17, 0.2], [0.15, 0.17], [0.14, 0.15], [0.1, 0.11], [0.07, 0.06]], 8);
      for (const [x, z0, z1] of [[-0.4, 0.55, 1.0], [0.42, 0.5, 0.95], [-0.44, -0.75, -0.25], [0.44, -0.7, -0.2]]) g.col(W1, 0.8).tube([[x, 0.12, z0], [x * 1.1, 0.14, (z0 + z1) / 2], [x * 0.9, 0.1, z1]], [0.09, 0.085, 0.06], 5);
      for (const e of [-1, 1]) g.col([0.82, 0.78, 0.7]).tube([[e * 0.09, 0.95, 1.36], [e * 0.2, 1.02, 1.36], [e * 0.26, 1.12, 1.4]], [0.03, 0.025, 0.008], 4);
      ear.kind(0).col(W1, 0.9).tri([0, 0, 0], [0.2, 0.04, -0.04], [0.11, 0.09, 0.05]).tri([0, 0, 0], [0.11, -0.05, 0.05], [0.2, 0.04, -0.04]);
      tail.kind(0).col(W1, 0.85).tube([[0, 0, 0], [0, -0.12, -0.3], [0, -0.3, -0.55]], [0.035, 0.025, 0.018], 4).col(W1, 0.5).tube([[0, -0.3, -0.55], [0, -0.36, -0.7]], [0.03, 0.045], 4);
      for (let i = 0; i < 5; i++) { let x, z; for (let k = 0; k < 40; k++) { [x, z] = P(cr.range(PL.wallL[0] + 6, PL.wagon - 4), -cr.range(18, 28)); if (!list.some((c) => Math.hypot(c.x - x, c.z - z) < 4.2)) break; }
        const c = linear(cr.pick(['#7a3a22', '#8a4a2a', '#d8ccb4', '#5a3222', '#9a5a34'])), rot = cr() * 6.283, sc = cr.range(0.95, 1.12), it = { x, y: earthAt(x, z) - 0.04, z, rot, s: sc, col: c }; list.push(it);
        cattle.push({ ...it, T: [cr.range(3.5, 7), cr.range(4, 8), cr.range(5, 9)], ph: [cr(), cr(), cr()] }); cast(x, z, 0.9, it.y, it.y + 0.9, 0.5, 0.6, 4); }
      scene.add(inst(g.toGeometry(), solidMat, list));
      cowEars = new THREE.InstancedMesh(ear.toGeometry(), solidMat, 10); cowTails = new THREE.InstancedMesh(tail.toGeometry(), solidMat, 5); const C = new THREE.Color();
      cattle.forEach((c, i) => { C.setRGB(c.col[0], c.col[1], c.col[2]); cowEars.setColorAt(i * 2, C); cowEars.setColorAt(i * 2 + 1, C); cowTails.setColorAt(i, C); });
      scene.add(cowEars); scene.add(cowTails);
    }
    {
      const cowM = new THREE.Matrix4(), cowB = new THREE.Matrix4(), cowQ = new THREE.Quaternion(), cowE = new THREE.Euler(0, 0, 0, 'YXZ'), cowP = new THREE.Vector3(), cowS = new THREE.Vector3();
      // one flick: up in a twentieth of the beat, down in a tenth, still for the rest
      const flick = (time, T, ph) => { const c = (time / T + ph) % 1; return smoothstep(0, 0.04, c) * (1 - smoothstep(0.06, 0.16, c)); };
      const moveCattle = (time) => {
        cattle.forEach((c, i) => {
          cowB.compose(cowP.set(c.x, c.y, c.z), cowQ.setFromEuler(cowE.set(0, c.rot, 0)), cowS.set(c.s, c.s, c.s));
          for (const e of [0, 1]) { const f = flick(time, c.T[e], c.ph[e]), sg = e ? 1 : -1;
            cowM.compose(cowP.set(sg * 0.13, 0.9, 1.34), cowQ.setFromEuler(cowE.set(0, -sg * (0.3 + 0.9 * f), 0)), cowS.set(sg, 1, 1)).premultiply(cowB); cowEars.setMatrixAt(i * 2 + e, cowM); }
          const f = flick(time, c.T[2], c.ph[2]);
          cowM.compose(cowP.set(0, 0.45, -1.02), cowQ.setFromEuler(cowE.set(0, 0.8 * f * Math.sin(time * 6 + c.ph[2] * 6.283), 0)), cowS.set(1, 1, 1)).premultiply(cowB); cowTails.setMatrixAt(i, cowM);
        });
        cowEars.instanceMatrix.needsUpdate = true; cowTails.instanceMatrix.needsUpdate = true;
      };
      moveCattle(0); cowEars.computeBoundingSphere(); cowTails.computeBoundingSphere(); frame.push(moveCattle);
    }
    // SWALLOWS hunting low over the grain beside the road: two rounds, one on each hand, written from the wheat's own places; every body 5 m or
    // more from the line by place (wander and all); none crosses the road, none flies high
    {
      const sr = S.swallows, sf = [sr.fork('r0'), sr.fork('r1')], nAll = Math.max(6, Math.round(26 * V.density)), a = PL.posts + 6, b = PL.wallL[0] - 4, c = PL.railR[1] + 8;
      const ring = (pts) => pts.map(([s, d, y]) => { const p = P(s, d); return [p[0], y + heightAt(p[0], p[1]), p[1]]; });
      const round = (s0, s1, sg, near, far) => { const pts = []; for (let i = 0; i < 5; i++) pts.push([lerp(s0, s1, i / 4), sg * (near + (i % 2) * 0.6), 2.3 + (i % 2) * 0.5 + 0.3 * sr()]); for (let i = 3; i >= 1; i--) pts.push([lerp(s0, s1, i / 4), sg * (far + (i % 2) * 1.5), 2.9 + 0.5 * sr()]); return ring(pts); };
      [round(a, b, -1, 8.5, 22), round(a, c, 1, 9, 21)].forEach((r, i) => fauna.add(F.makeFlock({ rng: sf[i], species: 'swifts', count: Math.round(nAll * [0.5, 0.5][i]), route: r, closed: true, start: sr(), spread: [1.4, 0.4, 36], wander: [0.7, 0.35, 0.8, 0.9], maxSigma: 3, size: 1.25, body: '#1c2436', belly: '#e8e2d6' })));
    }
    await ctx.yield();
    // ------------------------------------------------------------ HOUR 1: THE SCHOOL AS A PLACE. The yard stands where the entry's straight points and the first bend
    // turns past it: the worn ring and the schoolhouse ahead from the first metre, then passing on the left along the yard's picket fence
    const MAPLE = { leaf: '#4f8f34', leafLight: '#b0cf5c', leafDark: '#244f2a', gold: '#86b040', crimson: '#3f7a30', bark: '#857565', barkDark: '#54463a', barkLight: '#a39280' };
    const maples = [], mapleRng = [0, 1, 2, 3].map((i) => S.maples.fork('m' + i));
    for (const [i, [p, h, d]] of [[PL.mapleA, 20, KD], [PL.mapleB, 18, KD], [PL.mapleC, 22, 1], [PL.mapleD, 19, 1]].entries()) {
      const mr = mapleRng[i], geo = flora.mapleGeometry({ rng: mr, height: h * mr.range(0.95, 1.05), detail: d, ...MAPLE }), m = new THREE.Mesh(geo, leafMat), y = earthAt(p[0], p[1]) - 0.15;
      m.position.set(p[0], y, p[1]); m.rotation.y = mr() * 6.283; m.updateMatrixWorld(true); scene.add(m);
      cast(p[0], p[1], 0.55, y, y + 6, 0.8, 0.5, 2); cast(p[0], p[1], geo.userData.radius * 0.8, y + 5, y + h * 0.95, 0.55, 0.2, 2);
      maples.push({ x: p[0], y, z: p[1], h, r: geo.userData.radius });
      await ctx.yield();
    }
    {
      const sc = S.school, g = GM.school, dx = PL.porch[0] - PL.schoolBack[0], dz = PL.porch[1] - PL.schoolBack[1], dl = Math.hypot(dx, dz), yaw = Math.atan2(dx, dz), HL = 7, STEP = dl - 2 * HL;
      const cx = PL.schoolBack[0] + dx / dl * HL, cz = PL.schoolBack[1] + dz / dl * HL, y0 = earthAt(cx, cz) - 0.05;
      // (its front gable, the face toward the road: a tall shuttered window on each hand of the door)
      house(g, cx, cz, yaw, 9, 2 * HL, 4.6, 7.6, { windows: 4, door: 1.3, shutters: true, y: y0, front: [[-2.95, 1.1, 2.1, 1.35], [2.95, 1.1, 2.1, 1.35]] });
      // the door's porch: a small gabled hood on two posts over the steps, its pediment white; four panels on the door; a louvred vent in the gable's peak
      { const z0 = HL, z1 = HL + 1.6, zp = HL + 1.2, ev = 3.0, rg = 3.85, hx = 1.85, th = 0.13;
        // (an open gable: its roof stands 0.4 m out over the posts, so that its dark underside and its verge are seen from the road; a tie beam and a king post)
        for (const e of [-1, 1]) { g.kind(1).col(WHITE, 0.94).box(e * 1.4 - 0.07, -0.1, zp - 0.07, e * 1.4 + 0.07, ev - 0.1, zp + 0.07).box(e * 1.4 - 0.05, ev - 0.24, z0, e * 1.4 + 0.05, ev - 0.1, zp);
          g.kind(3).col(ROOF).quad([0, rg, z0], [e * hx, ev - 0.08, z0], [e * hx, ev - 0.08, z1], [0, rg, z1]).col(ROOF, 0.55).quad([0, rg - th, z0], [e * hx, ev - 0.08 - th, z0], [e * hx, ev - 0.08 - th, z1], [0, rg - th, z1])
            .quad([0, rg, z1], [e * hx, ev - 0.08, z1], [e * hx, ev - 0.08 - th, z1], [0, rg - th, z1]); }
        g.kind(1).col(WHITE, 0.94).box(-1.47, ev - 0.24, zp - 0.06, 1.47, ev - 0.1, zp + 0.06).box(-0.05, ev - 0.1, zp - 0.05, 0.05, rg - th - 0.02, zp + 0.05);
        g.kind(0).col(TRIM); for (const [a, b, c, d] of [[-0.5, 0.75, -0.1, 1.5], [0.1, 0.75, 0.5, 1.5], [-0.5, 1.7, -0.1, 2.5], [0.1, 1.7, 0.5, 2.5]]) for (const [u0, v0, u1, v1] of [[a, b, c, b + 0.035], [a, d - 0.035, c, d], [a, b, a + 0.035, d], [c - 0.035, b, c, d]])
          g.quad([u0, v0, HL + 0.07], [u1, v0, HL + 0.07], [u1, v1, HL + 0.07], [u0, v1, HL + 0.07]);
        g.col(TRIM).quad([-0.47, 5.35, HL + 0.04], [0.47, 5.35, HL + 0.04], [0.47, 6.45, HL + 0.04], [-0.47, 6.45, HL + 0.04]).col(SHUTTER).quad([-0.38, 5.44, HL + 0.06], [0.38, 5.44, HL + 0.06], [0.38, 6.36, HL + 0.06], [-0.38, 6.36, HL + 0.06]); }
      // the three steps before the door; the open cupola with its bell over the front gable; the bell's rope
      for (let i = 0; i < 3; i++) g.kind(4).col(OLDWOOD, 1.15).box(-1.5, -0.3, HL + i * STEP / 3, 1.5, 0.45 - i * 0.15, HL + (i + 1) * STEP / 3);
      g.kind(1).col(WHITE).box(-0.85, 7.1, 3.6, 0.85, 8.3, 5.3);
      for (const [a, b] of [[-0.75, 3.7], [0.75, 3.7], [-0.75, 5.2], [0.75, 5.2]]) g.kind(0).col(WHITE).box(a - 0.07, 8.3, b - 0.07, a + 0.07, 9.8, b + 0.07);
      g.kind(3).col(ROOF); for (const [a, b, c, d] of [[-1.05, 3.4, 1.05, 3.4], [1.05, 3.4, 1.05, 5.5], [1.05, 5.5, -1.05, 5.5], [-1.05, 5.5, -1.05, 3.4]]) g.tri([a, 9.8, b], [c, 9.8, d], [0, 11.1, 4.45]);
      g.kind(0).col(WHITE, 0.8).quad([-1.05, 9.79, 3.4], [-1.05, 9.79, 5.5], [1.05, 9.79, 5.5], [1.05, 9.79, 3.4]);
      g.kind(6).col(linear('#b08a3a')).tube([[0, 9.55, 4.45], [0, 9.45, 4.45], [0, 9.2, 4.45], [0, 8.95, 4.45], [0, 8.82, 4.45]], [0.05, 0.16, 0.2, 0.27, 0.34], 10, { cap: false });
      g.kind(4).col(OLDWOOD).tube([[-0.75, 9.6, 4.45], [0.75, 9.6, 4.45]], 0.05, 5);
      g.kind(0).col(linear('#b8ab8a')).wind(0.04, 0.3).tube([[0.3, 9.55, 4.45], [0.32, 8.3, 4.6], [0.3, 7.7, 4.7]], 0.015, 4).wind();
      // a woodpile against the back gable
      for (let j = 0; j < 4; j++) for (let i = 0; i < 9 - j; i++) { const k = sc.range(0.8, 1.15), xx = -3.6 + (i + j * 0.5) * 0.36 + sc.range(-0.03, 0.03), yy = 0.13 + j * 0.3;
        g.kind(4).col(linear('#9a7a56'), k).tube([[xx, yy, -HL - 0.1], [xx, yy, -HL - 0.1 - sc.range(0.75, 0.9)]], sc.range(0.13, 0.17), 6); }
      g.pop();
      const ax = [Math.sin(yaw), Math.cos(yaw)]; for (const k of [-0.5, 0.5]) cast(cx + ax[0] * HL * k, cz + ax[1] * HL * k, 5, y0, y0 + 6.5, 0.8, 0.55, 1);
      // the pump on its plank in the yard
      const [px, pz] = PL.pump, py = earthAt(px, pz);
      g.tr(px, py, pz, yaw).kind(4).col(OLDWOOD).box(-0.6, -0.05, -0.6, 0.6, 0.08, 0.6).kind(0).col(linear('#3c4440')).tube([[0, 0.05, 0], [0, 1.25, 0]], [0.09, 0.07], 7)
        .tube([[0, 0.95, 0], [0.32, 0.9, 0], [0.36, 0.8, 0]], 0.035, 5).tube([[0, 1.25, 0], [-0.08, 1.42, 0], [-0.5, 1.05, 0]], 0.022, 5).pop();
      shadeOf(px, pz, 0.25, 1.3);
    }
    // the ring's playthings, lying where they fell (which, and where, the seed's): three hoops, a ball, a skipping rope, a small cart
    {
      const rr = S.ring, c = PL.ringC, g = GM.school, at = (rad) => { const a = rr() * 6.283, q = rad * Math.sqrt(rr()); return [c[0] + Math.cos(a) * q, c[1] + Math.sin(a) * q]; };
      const loop = (x, y, z, R, tilt, yaw, col) => { const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * 6.283, lx = Math.cos(a) * R, ly = Math.sin(a) * R * Math.sin(tilt), lz = Math.sin(a) * R * Math.cos(tilt); pts.push([x + lx * Math.cos(yaw) + lz * Math.sin(yaw), y + ly, z - lx * Math.sin(yaw) + lz * Math.cos(yaw)]); } g.kind(4).col(col).tube(pts, 0.014, 5, { cap: false }); };
      for (let i = 0; i < 3; i++) { const p = at(i === 0 ? 5.2 : 3.6), lean = i === 1 ? rr.range(0.25, 0.5) : rr.range(0, 0.06); loop(p[0], earthAt(p[0], p[1]) + 0.02 + 0.42 * Math.sin(lean), p[1], 0.42, lean, rr() * 6.283, linear(rr.pick(['#c9a66a', '#b98c52', '#d8c090']))); }
      { const p = at(3.2), y = earthAt(p[0], p[1]); g.kind(0).col(linear(rr.pick(['#a8442e', '#b88a3a', '#7a5a3a']))).tube([[p[0], y, p[1]], [p[0], y + 0.03, p[1]], [p[0], y + 0.11, p[1]], [p[0], y + 0.19, p[1]], [p[0], y + 0.22, p[1]]], [0.02, 0.075, 0.11, 0.075, 0.02], 10); }
      { const p = at(3.4), a = rr() * 6.283, y = earthAt(p[0], p[1]) + 0.025, pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14 - 0.5, w = 0.35 * Math.sin(t * 9 + a); pts.push([p[0] + Math.cos(a) * t * 2.3 - Math.sin(a) * w, y, p[1] + Math.sin(a) * t * 2.3 + Math.cos(a) * w]); }
        g.kind(0).col(linear('#b8ab8a')).tube(pts, 0.012, 4); for (const e of [0, 14]) g.kind(4).col(linear('#8a3a2a')).tube([pts[e], [pts[e][0] + (pts[e][0] - pts[e ? 13 : 1][0]) * 0.9, y, pts[e][2] + (pts[e][2] - pts[e ? 13 : 1][2]) * 0.9]], 0.02, 5); }
      { const p = at(4.8), yaw = rr() * 6.283; g.tr(p[0], earthAt(p[0], p[1]), p[1], yaw).kind(4).col(linear(rr.pick(['#3f6a8a', '#8a3a2a', '#5a7a4a']))).box(-0.26, 0.2, -0.45, 0.26, 0.42, 0.45, { bottom: true, top: false }).col(OLDWOOD).box(-0.24, 0.2, -0.43, 0.24, 0.23, 0.43);
        for (const [a, b] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) g.kind(4).col(WOOD).tube([[a - 0.02 * Math.sign(a), 0.14, b], [a + 0.02 * Math.sign(a), 0.14, b]], 0.14, 10);
        g.col(OLDWOOD).tube([[0, 0.22, 0.45], [0, 0.3, 0.95], [0, 0.12, 1.3]], 0.016, 4).tube([[-0.14, 0.12, 1.3], [0.14, 0.12, 1.3]], 0.016, 4).pop(); }
    }
    await ctx.yield();
    // maple A's long bough toward the ring with its two rope swings (each a body of its own, swaying on the world clock with a period and a phase of its own
    // stream); the tail of a kite caught in maple C
    const swings = [];
    {
      const sr = S.swings, A = maples[0], C = maples[2], g = GM.school, dx = PL.ringC[0] - A.x, dz = PL.ringC[1] - A.z, dl = Math.hypot(dx, dz), reach = dl - PL.ringR - 0.6;
      const from = [A.x, A.y + 6.5, A.z], to = [A.x + dx / dl * reach, A.y + 6.2, A.z + dz / dl * reach], pts = [], rad = [];
      for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([lerp(from[0], to[0], t) + (i > 0 && i < 6 ? sr.range(-0.3, 0.3) : 0), lerp(from[1], to[1], t) + 0.5 * Math.sin(Math.PI * t), lerp(from[2], to[2], t) + (i > 0 && i < 6 ? sr.range(-0.3, 0.3) : 0)]); rad.push(lerp(0.3, 0.06, Math.pow(t, 0.8))); }
      g.kind(4).col(linear('#857565')).tube(pts, rad, 6);
      for (const t of [0.72, 0.92]) {
        const x = lerp(from[0], to[0], t), z = lerp(from[2], to[2], t), y = lerp(from[1], to[1], t) + 0.5 * Math.sin(Math.PI * t), len = y - earthAt(x, z) - 0.5, sg = makeGeo();   // (the seat hangs 0.5 m over the ground at its own place)
        // (ropes of an inch and a half and a broad plank, the further one painted: seen from the road 11 m off)
        sg.kind(0).col(linear('#c9bc98')).tube([[-0.27, 0, 0], [-0.27, -len, 0]], 0.02, 4).tube([[0.27, 0, 0], [0.27, -len, 0]], 0.02, 4).kind(4).col(swings.length ? linear('#a8442e') : OLDWOOD, 1.15).box(-0.36, -len - 0.03, -0.13, 0.36, -len + 0.03, 0.13, { bottom: true });
        const m = new THREE.Mesh(sg.toGeometry(), solidMat); m.position.set(x, y, z); m.rotation.order = 'YXZ'; m.rotation.y = Math.atan2(dx, dz) + Math.PI / 2; scene.add(m);
        swings.push({ m, amp: 2.2 * sr.range(0.05, 0.12), ph: sr() * 6.283, w: Math.sqrt(9.81 / len) * sr.range(0.97, 1.03) });   // (a sway of 6 to 15 degrees: the seat goes a metre and more)
        GU.uWorn.value[swings.length - 1].set(x, z, 1.25, 1);   // (the grass is worn bare under each seat)
      }
      frame.push((time) => { for (const s of swings) s.m.rotation.x = s.amp * Math.sin(time * s.w + s.ph); });
      const kp = [], ws = []; for (let i = 0; i <= 12; i++) { const t = i / 12; kp.push([C.x + 4.5 + t * 0.5, C.y + 16.5 - t * 3.6, C.z + 3 + 0.3 * Math.sin(t * 7)]); ws.push([0.6 * t, 2.5 * t, 0, 0]); }
      g.kind(0).col(linear('#e8e2d2')).tube(kp, 0.012, 3, { winds: ws });
      for (let i = 2; i <= 12; i += 2) { const p = kp[i], c = linear(sr.pick(['#c8442e', '#e8c040', '#3f6a9a', '#f1eee4'])), w = ws[i]; const i0 = g.vert([p[0] - 0.22, p[1] + 0.1, p[2]], c, w); g.vert([p[0] + 0.22, p[1] - 0.1, p[2]], c, w); g.vert([p[0] + 0.22, p[1] + 0.1, p[2]], c, w); g.vert([p[0] - 0.22, p[1] - 0.1, p[2]], c, w); g.face(i0); }
    }
    // THE YARD'S PICKET FENCE, 3.5 m left of the line from its first post to its last, white, with the gate standing open where the yard's path meets the road
    {
      const fr = S.fence, g = GM.school, D = -3.5, s0 = PL.picketL[0], s1 = PL.picketL[1], gate = [PL.gate - 0.9, PL.gate + 0.9];
      for (const [a, b] of [[s0, gate[0]], [gate[1], s1]]) {
        const n = Math.round((b - a) / 2.4), step = (b - a) / n;
        for (let i = 0; i <= n; i++) { const [x, z] = P(a + i * step, D), y = earthAt(x, z); g.kind(1).col(WHITE, fr.range(0.9, 1)).tr(x, y, z, -road.at(a + i * step)[2]).box(-0.06, -0.2, -0.06, 0.06, 1.12, 0.06).pop(); }
        for (const yy of [0.32, 0.82]) { const pts = []; for (let i = 0; i <= n; i++) { const [x, z] = P(a + i * step, D - 0.07); pts.push([x, earthAt(x, z) + yy, z]); } g.kind(1).col(WHITE, 0.92).tube(pts, [0.02, 0.045], 4, { cap: false }); }
        for (let s = a + 0.12; s < b - 0.05; s += 0.16) { const p = P(s - 0.045, D + 0.05), q = P(s + 0.045, D + 0.05), y = earthAt(p[0], p[1]), h = 1.0 + fr.range(-0.02, 0.02), k = fr.range(0.88, 1.02);
          g.kind(0).col(WHITE, k).quad([p[0], y + 0.08, p[1]], [q[0], y + 0.08, q[1]], [q[0], y + h, q[1]], [p[0], y + h, p[1]]).tri([p[0], y + h, p[1]], [q[0], y + h, q[1]], [(p[0] + q[0]) / 2, y + h + 0.09, (p[1] + q[1]) / 2]); }
      }
      // the gate: a picket panel swung in toward the yard on its post
      { const [x, z] = P(gate[0], D), y = earthAt(x, z); g.tr(x, y, z, -road.at(gate[0])[2] - 1.95);
        for (const yy of [0.32, 0.82]) g.kind(1).col(WHITE, 0.92).box(-0.02, yy - 0.045, 0, 0.02, yy + 0.045, 1.7);
        for (let u = 0.1; u < 1.7; u += 0.16) g.kind(0).col(WHITE, fr.range(0.88, 1.02)).quad([0.03, 0.08, u - 0.045], [0.03, 0.08, u + 0.045], [0.03, 1.0, u + 0.045], [0.03, 1.0, u - 0.045]);
        g.pop(); }
    }
    await ctx.yield();
    // the dry stone wall on the right: 4 m from the line along the verge, square away at its near end to a corner 16 m off, then back beside the road 16 m off
    // behind the entry; the white house behind it with its chimney; the washing 26 m from the line
    const chimneys = [];
    {
      const wr = S.walls, g = GM.school;
      stoneWall(g, P(PL.wallR[1], 4), P(PL.wallR[0], 4), wr); stoneWall(g, P(PL.wallR[0], 4), P(PL.wallR[0], PL.wallBack), wr); stoneWall(g, P(PL.wallR[0], PL.wallBack), P(-60, PL.wallBack), wr);
      const [hx, hz] = PL.whiteHouse, hy = earthAt(hx, hz) - 0.05;
      house(g, hx, hz, -Math.PI / 2, 7, 10, 4.3, 6.7, { windows: 3, door: 1.1, chimney: [0.6, -2], winH: 1.6, shutters: true, y: hy }).pop(); cast(hx, hz, 5.5, hy, hy + 6, 0.8, 0.55, 1);
      chimneys.push([hx + 2, hy + 7.7, hz + 0.6]);
      const ws = S.washing, a = P(PL.washing[1], PL.washing[2]), b = P(PL.washing[0], PL.washing[2]), cols = ['#f4f1ea', '#f4f1ea', '#e8e2d2', '#c6d4e6', '#f4f1ea', '#e6c8c2', '#f4f1ea', '#d8dcc0', '#f4f1ea'], ya = earthAt(a[0], a[1]), yb = earthAt(b[0], b[1]);
      g.kind(4).col(OLDWOOD).tube([[a[0], ya - 0.1, a[1]], [a[0], ya + 2.05, a[1]]], 0.06, 5).tube([[b[0], yb - 0.1, b[1]], [b[0], yb + 2.05, b[1]]], 0.06, 5);
      g.kind(0).col(linear('#c9c2b0')).tube([[a[0], ya + 2, a[1]], [(a[0] + b[0]) / 2, (ya + yb) / 2 + 1.86, (a[1] + b[1]) / 2], [b[0], yb + 2, b[1]]], 0.012, 4);
      const ll = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = (b[0] - a[0]) / ll, ez = (b[1] - a[1]) / ll;
      for (let i = 0; i < 9; i++) { const t = (i + 0.6) / 9.6, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), y = lerp(ya, yb, t) + 2 - 0.14 * Math.sin(Math.PI * t), w = ws.range(0.7, 1.15), h = ws.range(0.7, 1.4), c = linear(cols[ws.int(0, 8)]);
        g.kind(5); for (let j = 0; j < 4; j++) { const y0 = y - h * j / 4, y1 = y - h * (j + 1) / 4, w0 = [0.85 * h * j / 4, 2 * h * j / 4, 0, 0], w1 = [0.85 * h * (j + 1) / 4, 2 * h * (j + 1) / 4, 0, 0];   // (the wind takes each piece by its own length)
          const i0 = g.vert([x - ex * w / 2, y0, z - ez * w / 2], c, w0); g.vert([x + ex * w / 2, y0, z + ez * w / 2], c, w0); g.vert([x + ex * w / 2, y1, z + ez * w / 2], c, w1); g.vert([x - ex * w / 2, y1, z - ez * w / 2], c, w1); g.face(i0); } }
    }
    await ctx.yield();
    // THE VILLAGE DOWN THE BEND, in two layers with trees between: white houses and a red barn about the green, then the plain meetinghouse with its
    // spire and vane, more houses and a barn behind; a washing line, smoke from two chimneys. No building within 30 m of the line.
    {
      const vr = S.village, g = GM.school, V0 = PL.village, V1 = PL.meeting, ul = Math.hypot(V1[0] - V0[0], V1[1] - V0[1]), u = [(V1[0] - V0[0]) / ul, (V1[1] - V0[1]) / ul], n = [-u[1], u[0]], trees = [], vl = {};
      const spot = (c, a, b) => { let x = c[0] + u[0] * a + n[0] * b, z = c[1] + u[1] * a + n[1] * b; road.locate(x, z, vl); if (Math.abs(vl.d) < 32) { const k = 32 - Math.abs(vl.d), q = road.at(vl.s, 0); x += (x - q[0]) / Math.abs(vl.d) * k; z += (z - q[1]) / Math.abs(vl.d) * k; } return [x, z]; };
      const facing = (x, z) => { road.locate(x, z, vl); const q = road.at(vl.s, 0); return Math.atan2(q[0] - x, q[1] - z) + vr.range(-0.5, 0.5); };
      [[-16, 15], [4, -17], [24, 13]].forEach(([a, b], i) => { const [x, z] = spot(V0, a + vr.range(-3, 3), b + vr.range(-3, 3)), y = earthAt(x, z) - 0.05;
        house(g, x, z, facing(x, z), vr.range(6, 8), vr.range(9, 12), vr.range(3.9, 5), vr.range(6.3, 7.8), { windows: 3, door: 1.1, chimney: [0.5, 1], winH: 1.5, shutters: i !== 1, y }).pop(); if (i === 0) chimneys.push([x, y + 8.4, z]); });
      { const [x, z] = spot(V0, 12, -30); house(g, x, z, facing(x, z), 9.5, 15, 5.8, 9.6, { col: BARNRED, kind: 4, roof: linear('#4a4644'), over: 0.5, door: 3, doorH: 3.4, doorCol: linear('#6e2a1e') }).pop(); }
      // the meetinghouse: a plain white hall, a square tower over its front gable, a spire, a vane (no cross)
      { const [x, z] = V1, y = earthAt(x, z) - 0.05, yaw = Math.atan2(V0[0] - x, V0[1] - z);
        house(g, x, z, yaw, 10, 16, 6.2, 9.6, { windows: 4, door: 1.6, winH: 2.7, doorH: 2.6, y });
        g.kind(1).col(WHITE).box(-1.6, 8.2, 4.6, 1.6, 12.4, 7.8).kind(3).col(ROOF); for (const [a, b, c, d] of [[-1.8, 4.4, 1.8, 4.4], [1.8, 4.4, 1.8, 8], [1.8, 8, -1.8, 8], [-1.8, 8, -1.8, 4.4]]) g.tri([a, 12.4, b], [c, 12.4, d], [0, 19.5, 6.2]);
        g.kind(6).col(linear('#b08a3a')).tube([[0, 19.4, 6.2], [0, 20.8, 6.2]], 0.03, 4).tube([[-0.5, 20.6, 6.2], [0.5, 20.6, 6.2]], 0.025, 4).tri([0.5, 20.75, 6.2], [0.5, 20.45, 6.2], [0.78, 20.6, 6.2]).pop(); }
      [[-22, 22], [-18, -24]].forEach(([a, b], i) => { const [x, z] = spot(V1, a + vr.range(-3, 3), b + vr.range(-3, 3)), y = earthAt(x, z) - 0.05;
        house(g, x, z, facing(x, z), vr.range(6, 8), vr.range(9, 12), vr.range(3.9, 5), vr.range(6.3, 7.8), { windows: 3, door: 1.1, chimney: [0.5, 1], winH: 1.5, y }).pop(); if (i === 0) chimneys.push([x, y + 8.4, z]); });
      { const [x, z] = spot(V1, 16, 26); house(g, x, z, facing(x, z), 10, 16, 6, 10, { col: BARNRED, kind: 4, roof: linear('#4a4644'), over: 0.5, door: 3, doorH: 3.4, doorCol: linear('#6e2a1e') }).pop(); }
      // a washing line of five pieces by the green's first house
      { const a = spot(V0, -8, 24), b = [a[0] + u[0] * 7, a[1] + u[1] * 7], ya = earthAt(a[0], a[1]), yb = earthAt(b[0], b[1]);
        g.kind(4).col(OLDWOOD).tube([[a[0], ya - 0.1, a[1]], [a[0], ya + 2.05, a[1]]], 0.06, 5).tube([[b[0], yb - 0.1, b[1]], [b[0], yb + 2.05, b[1]]], 0.06, 5);
        for (let i = 0; i < 5; i++) { const t = (i + 0.6) / 5.6, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t), y = lerp(ya, yb, t) + 1.95, w = vr.range(0.8, 1.2), h = vr.range(0.8, 1.4), c = linear(vr.pick(['#f4f1ea', '#e8e2d2', '#c6d4e6', '#e6c8c2']));
          g.kind(5).wind(0.3, 0.8).quad([x - u[0] * w / 2, y, z - u[1] * w / 2], [x + u[0] * w / 2, y, z + u[1] * w / 2], [x + u[0] * w / 2, y - h, z + u[1] * w / 2], [x - u[0] * w / 2, y - h, z - u[1] * w / 2]).wind(); } }
      // trees between the two layers and behind the second
      for (let i = 0; i < 9; i++) { const [x, z] = spot(i < 5 ? V0 : V1, i < 5 ? vr.range(26, 46) : vr.range(8, 40), vr.range(-34, 34)), c = vr.range(0.82, 1.05); trees.push({ x, y: earthAt(x, z) - 0.2, z, rot: vr() * 6.283, s: vr.range(0.7, 1.05), col: [c, c, c] }); }
      scene.add(inst(flora.mapleGeometry({ rng: vr.fork('elm'), height: 22, detail: 0, leaf: '#3f6f30', leafLight: '#8aa848', leafDark: '#1f4526', gold: '#557f36', crimson: '#356a2c' }), leafMat, trees));
    }
    await ctx.yield();
    // EIGHT HENS on the verge on the road side of the wall (bodies 2.25 to 3.45 m right of the line by place, wander and all), each wandering and pecking
    // on beats of its own; their one instance buffer is written each frame
    {
      const hr = S.hens, g = makeGeo(), W1 = [1, 1, 1], hens = [], henM = new THREE.Matrix4(), henQ = new THREE.Quaternion(), henE = new THREE.Euler(0, 0, 0, 'YXZ'), henP = new THREE.Vector3(), henS = new THREE.Vector3(), N = 8;
      g.kind(0).col(W1).tube([[0, 0.25, -0.17], [0, 0.27, -0.1], [0, 0.26, 0], [0, 0.27, 0.09], [0, 0.31, 0.15]], [[0.03, 0.04], [0.09, 0.09], [0.11, 0.12], [0.1, 0.1], [0.05, 0.06]], 8);
      g.tube([[0, 0.3, 0.13], [0, 0.39, 0.17], [0, 0.44, 0.19]], [0.05, 0.04, 0.035], 6);
      g.col([1.6, 0.25, 0.15]).tri([0, 0.47, 0.16], [0, 0.5, 0.2], [0, 0.46, 0.23]).tri([0, 0.42, 0.2], [0, 0.38, 0.21], [0, 0.41, 0.23]).col([1.5, 0.9, 0.2]).tube([[0, 0.43, 0.21], [0, 0.42, 0.26]], [0.014, 0.002], 4);
      g.col([0.75, 0.75, 0.75]); for (const a of [-0.35, 0, 0.35]) g.tri([0, 0.27, -0.14], [Math.sin(a) * 0.1, 0.46, -0.24], [Math.sin(a) * 0.1 + 0.03, 0.4, -0.3]);
      g.col([1.3, 0.9, 0.3]); for (const e of [-0.045, 0.045]) g.tube([[e, 0.17, 0], [e, 0.0, 0.01], [e, 0.0, 0.06]], 0.008, 3);
      const span = (PL.hens[1] - PL.hens[0]) / N;
      for (let i = 0; i < N; i++) hens.push({ s: PL.hens[0] + (i + hr.range(0.2, 0.8)) * span, d: hr.range(2.55, 3.15), a: hr.range(0.3, 0.7), b: hr.range(0.12, 0.3), w1: hr.range(0.25, 0.5), w2: hr.range(0.35, 0.7), p1: hr() * 6.283, p2: hr() * 6.283, wp: hr.range(1.6, 2.6), pp: hr() * 6.283, size: hr.range(1.05, 1.3) });
      const henMesh = new THREE.InstancedMesh(g.toGeometry(), solidMat, N), C = new THREE.Color();
      hens.forEach((h, i) => { const c = linear(hr.pick(['#9a5a34', '#e8e2d6', '#7a4a2e', '#b8a890', '#5a4a44'])); henMesh.setColorAt(i, C.setRGB(c[0], c[1], c[2])); });
      // (seen to move from the road: each runs along the verge on two beats of its own, twice as far as it used to wander and never nearer the line; it
      // bobs as it steps, and now and then, on a beat of its own (the stream named henflap), it hops and beats its wings)
      { const hf = S.henflap; for (const h of hens) { h.wf = hf.range(0.45, 0.9); h.pf = hf() * 6.283; } }
      const RUN = 2, moveHens = (time) => {
        for (let i = 0; i < N; i++) { const h = hens[i], w3 = h.w1 * 3.1, ds = RUN * h.a * (Math.sin(time * h.w1 + h.p1) + 0.3 * Math.sin(time * w3 + h.p2)), dd = h.b * Math.sin(time * h.w2 + h.p2);
          const vs = RUN * h.a * (h.w1 * Math.cos(time * h.w1 + h.p1) + 0.3 * w3 * Math.cos(time * w3 + h.p2)), vd = h.b * h.w2 * Math.cos(time * h.w2 + h.p2), go = Math.min(1, Math.hypot(vs, vd) / 0.4);
          road.at(h.s + ds, h.d + dd, q3); const pk = Math.max(0, Math.sin(time * h.wp + h.pp)), peck = pk * pk * pk * pk * 0.85 * (1 - 0.7 * go);
          const fl0 = Math.max(0, Math.sin(time * h.wf + h.pf)), fl = Math.pow(fl0, 30), step = Math.sin(time * 11 + h.pp);
          henE.set(peck + 0.13 * go * step - 0.3 * fl, -q3[2] + Math.atan2(-vd, -vs) + Math.PI, 0.75 * fl * Math.sin(time * 34));
          henM.compose(henP.set(q3[0], road.yAt(h.s + ds) + 0.02 * go * Math.abs(step) + 0.28 * fl * h.size, q3[1]), henQ.setFromEuler(henE), henS.set(h.size, h.size, h.size)); henMesh.setMatrixAt(i, henM); }
        henMesh.instanceMatrix.needsUpdate = true;
      };
      moveHens(0); henMesh.computeBoundingSphere(); scene.add(henMesh); frame.push(moveHens);
    }
    await ctx.yield();
    // ------------------------------------------------------------ THE VERGE AND THE MEADOWS, the whole way: tufts and wild flowers in pieces of 80 m of road
    // (each piece a mesh of its own). The ruling flower is the seed's; the wet meadow grows tall seed heads; white flowers stand thick for
    // 25 m round the low rise, where the lamps find them.
    {
      const r = S.verge, rf = S.flowers, zt = {}, PIECE = 80, pieces = new Map(), others = ['chicory', 'daisy', 'susan', 'clover'].filter((k) => k !== V.flower);
      const piece = (s) => { const k = Math.floor((s + 8) / PIECE); if (!pieces.has(k)) pieces.set(k, { tufts: [[], [], []], flowers: {} }); return pieces.get(k); };
      const put = (s, d, meadow) => {
        const [x, z] = P(s, d); land.zone(x, z, zt);
        if (zt.water > -0.6) return;
        const ad = Math.abs(d), inWheat = zt.wheat > 0.3;
        if (inWheat && ad > WHEAT.first + 0.05) return;
        if (zt.reaped > 0.5 && ad > 3.4 && r() < 0.85) return;
        if (Math.hypot(x - PL.ringC[0], z - PL.ringC[1]) < PL.ringR + 0.4) return;
        const y = earthAt(x, z), wet = zt.rough, dry = inWheat ? 0.5 : 0, g = r.range(0.75, 1.15) * (1 - 0.3 * wet), A = piece(s);
        const kind = meadow && wet > 0.5 && r() < 0.16 ? 2 : r() < (meadow ? 0.1 : 0.3) ? 1 : 0;
        A.tufts[kind].push({ x, y: y - 0.03, z, rot: r() * 6.283, s: (kind === 2 ? r.range(0.7, 1.1) : r.range(0.45, 0.85)) * (meadow && kind < 2 ? 0.7 : 1), sy: kind === 2 ? r.range(1.1, 1.5) : r.range(0.8, 1.3), tx: r.range(-0.12, 0.12), tz: r.range(-0.12, 0.12),
          col: [g * (1 + 0.5 * dry), g * (1 + 0.25 * dry), g * (1 - 0.1 * dry)] });
        const nearRise = 1 - smoothstep(18, 27, Math.hypot(x - PL.rise[0], z - PL.rise[1]));
        // A FLOWER OF THE VERGE: its gate is drawn at every tuft on every visit, and so are its figures: from the stream 'flowers' where the gate
        // is under the place's own share (the planting of the usual density), from the stream flowersmore where it is over (the further planting of a
        // denser visit). The visit's density only decides which of the dealt flowers are SHOWN; it deals nothing anew.
        { const share = meadow ? 0.03 + 0.5 * nearRise : 0.16 + 0.4 * nearRise, gate = rf(), fr = gate < share ? rf : S.flowersmore;
          const k = nearRise > 0.3 && fr() < 0.85 ? (fr() < 0.5 ? 'daisy' : 'carrot') : fr() < 0.66 ? V.flower : (V.flower === 'daisy' && fr() < 0.5 ? 'carrot' : fr.pick(others));
          const b = fr.range(0.85, 1.1), a = fr() * 6.283, o = fr.range(0.1, 0.4);
          const it = { x: x + Math.cos(a) * o, y: y - 0.02, z: z + Math.sin(a) * o, rot: fr() * 6.283, s: fr.range(0.55, 0.9), tx: fr.range(-0.15, 0.15), tz: fr.range(-0.15, 0.15), col: [b * 0.8, b * 0.8, b * 0.8] };
          if (gate < share * V.density) (A.flowers[k] ||= []).push(it);
        }
      };
      for (let s = -8, i = 0; s < L + 60; s += 0.4, i++) {
        for (const side of [-1, 1]) {
          put(s + r.range(-0.2, 0.2), side * r.range(1.9, s > PL.bendEnd ? 2.6 : 3.3), false);
          if (r() < 0.6) put(s + r.range(-0.2, 0.2), side * r.range(1.9, 2.5), false);
          for (let k = 0; k < 2; k++) { const q = r(); put(s + r.range(-0.2, 0.2), side * (3.3 + 24 * q * q), true); }
        }
        if (i % 250 === 249) await ctx.yield();
      }
      const tg = [flora.grassTuftGeometry({ rng: r.fork('a'), cards: 2, width: 1.0, height: 0.7, root: '#3d6122' }), flora.grassTuftGeometry({ rng: r.fork('b'), cards: 3, width: 0.9, height: 0.95, root: '#4a6a26', tip: '#b8b470' }),
        flora.grassTuftGeometry({ rng: r.fork('c'), cards: 3, width: 0.8, height: 1.1, root: '#4a5c30', tip: '#cfc8a0' })];
      const FL = { chicory: { color: '#7fa0ff', height: 0.9, width: 0.7, cards: 2 }, daisy: { color: '#ffffff', height: 0.55, width: 0.6, cards: 3 }, susan: { color: '#ffc928', height: 0.7, width: 0.65, cards: 3 },
        clover: { color: '#d8507a', height: 0.38, width: 0.6, cards: 3 }, carrot: { color: '#f4f2e6', height: 1.0, width: 0.75, cards: 2 } }, fg = {};
      for (const k in FL) fg[k] = flora.flowerGeometry({ rng: rf.fork(k), root: '#3d6122', ...FL[k] });
      for (const A of pieces.values()) { A.tufts.forEach((list, i) => { if (list.length) { const m = inst(tg[i], lowMat, list); m.name = 'verge-tuft'; scene.add(m); } }); for (const k in A.flowers) { const m = inst(fg[k], lowMat, A.flowers[k]); m.name = 'verge-flower'; scene.add(m); } }
    }
    await ctx.yield();
    // ------------------------------------------------------------ SMALL LIFE OF THE AIR (media: thin sprites of their own size, on the world clock, every phase from
    // its own stream): chimney smoke leaning with the wind, maple leaves let fall now and then, bright chaff over the grain. Lit by the eye's row.
    {
      const A = [], Cn = [], add = (kind, ph, x, y, z, sp, size) => { A.push(kind, ph, sp, size); Cn.push(x, y, z); };
      for (const ch of chimneys) for (let i = 0; i < 9; i++) add(0, S.smoke(), ch[0], ch[1], ch[2], 1, 1);
      // (leaves fall within 4 m of a trunk that stands 10 m or more from the line, and drift under 3 m: none comes within 3 m of the line)
      const lr = S.leaves; for (let i = 0; i < Math.round(16 * (0.6 + 0.8 * V.mood)); i++) { const m = maples[lr.int(0, 3)], a = lr() * 6.283, q = lr.range(1, 4); add(1, lr(), m.x + Math.cos(a) * q, m.y + lr.range(8, 14), m.z + Math.sin(a) * q, lr.range(0.07, 0.12), lr.range(0.06, 0.1)); }
      const cr = S.chaff; for (let i = 0; i < Math.round(170 * V.density); i++) { const s = cr.range(PL.posts + 2, PL.crest - 2), d = cr.range(2.2, 16) * (cr() < 0.5 ? -1 : 1), [x, z] = P(s, d); add(2, cr(), x, earthAt(x, z) + cr.range(1.3, 3.6), z, cr.range(0.5, 1.5), cr.range(0.012, 0.028)); }
      const g = new THREE.InstancedBufferGeometry(), quad = new THREE.PlaneGeometry(2, 2); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
      g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(Cn), 3)); g.instanceCount = A.length / 4;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec4 aK; attribute vec3 aC; varying vec2 vUv; varying vec4 vK; varying vec3 vW;
          ${GLSL_ROW}
          void main(){
            vUv = position.xy; vec3 p = aC; float sz, al = 1., kd = aK.x, t;
            if (kd < .5) { t = fract(uTime * .09 + aK.y); p += vec3(uWind.x * 7. * t * t, 7.5 * t, uWind.y * 7. * t * t) + .5 * t * vec3(sin(aK.y * 40. + uTime * .7), 0., cos(aK.y * 31. + uTime * .6)); sz = mix(.35, 2.6, t); al = (1. - t) * smoothstep(0., .1, t) * .5; }
            else if (kd < 1.5) { t = fract(uTime * aK.z + aK.y); float fall = t * t * (aC.y + .2); p += vec3(uWind.x * 2.2 * t + .5 * sin(uTime * 1.9 + aK.y * 50.) * t, -min(fall, 13.), uWind.y * 2.2 * t + .5 * cos(uTime * 1.6 + aK.y * 43.) * t); sz = aK.w; al = smoothstep(0., .04, t) * (1. - smoothstep(.8, .95, t)); }
            else { t = uTime * .2 * aK.z + aK.y * 9.; p += vec3(uWind.x * 2.4 * sin(t * .7) + .5 * sin(t * 1.3 + aK.y * 30.), .35 * sin(t * 1.1 + aK.y * 17.), uWind.y * 2.4 * sin(t * .7) + .5 * cos(t * 1.7 + aK.y * 21.)); sz = aK.w; al = .5 + .5 * sin(t * 6. + aK.y * 80.); }
            vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vec4 mv = viewMatrix * wp;
            float rot = kd > .5 && kd < 1.5 ? uTime * 4. + aK.y * 60. : 0.; vec2 q = vec2(position.x * cos(rot) - position.y * sin(rot), (position.x * sin(rot) + position.y * cos(rot)) * (kd > .5 && kd < 1.5 ? .5 + .5 * sin(uTime * 5.3 + aK.y * 33.) : 1.));
            // (chaff is fine matter we drive through: within 2.5 m of the lens it thins by its true distance, as a medium does)
            if (kd > 1.5) al *= smoothstep(.6, 2.5, length(mv.xyz));
            mv.xy += q * sz; vK = vec4(kd, al, aK.y, 0.); gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`varying vec2 vUv; varying vec4 vK; varying vec3 vW;
          ${GLSL_HOURS}
          void main(){
            float r = length(vUv); if (r > 1.) discard;
            vec4 key = uRow[0], fill = uRow[2]; vec3 c; float a, day = uRow[1].a;
            if (vK.x < .5) { c = vec3(.62, .62, .64) * (key.rgb * .55 + fill.rgb * .9); a = (1. - smoothstep(.15, 1., r)) * vK.y; }
            else if (vK.x < 1.5) { c = mix(vec3(.5, .62, .12), vec3(.8, .6, .1), vK.z) * (key.rgb * .8 + fill.rgb * .5); a = vK.y; }
            else { c = vec3(1., .92, .6) * key.rgb * 1.5; a = (1. - smoothstep(.3, 1., r)) * vK.y * .8 * day; }
            gl_FragColor = vec4(hourFog(c, vW), a);
          }` }));
      m.frustumCulled = false; m.renderOrder = 5; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------ MADE THINGS INTO THE SCENE (one mesh of wood and stone; those by a water with their images); the casters
    for (const [name, g] of Object.entries(GM)) if (g.count) { const m = new THREE.Mesh(g.toGeometry(), solidMat); m.name = 'made-' + name; scene.add(m); await ctx.yield(); }
    gW.forEach((g, i) => { if (!g.count) return; const geo = g.toGeometry(), gim = gWimage[i] ? gWimage[i].toGeometry() : geo; for (const [mat, ro] of [[solidMat, 0], [solidMirror[i], -9]]) { const m = new THREE.Mesh(ro ? gim : geo, mat); m.renderOrder = ro; m.frustumCulled = false; (ro ? (i ? floodG : beyondG) : scene).add(m); } });
    if (shadeCards.length) {
      // each card: a strip on the ground from the thing's foot along the shade's bearing, in four pieces that follow the ground; uv = (metres from the foot, across -1..1), aH = the thing's height
      const Pn = [], Uv = [], Ah = [], I = [], REACH = 7;
      for (const [x, z, r, h] of shadeCards) { const len = h * REACH, px = -shadeDir[2] * r, pz = shadeDir[0] * r;
        for (let k = 0; k <= 4; k++) { const t = -r + (len + r) * k / 4, cx = x + shadeDir[0] * t, cz = z + shadeDir[2] * t, b = Pn.length / 3;
          Pn.push(cx - px, earthAt(cx - px, cz - pz) + 0.05, cz - pz, cx + px, earthAt(cx + px, cz + pz) + 0.05, cz + pz); Uv.push(t, -1, t, 1); Ah.push(h, r, h, r);
          if (k < 4) I.push(b, b + 1, b + 3, b, b + 3, b + 2); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(Pn, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(Uv, 2)); geo.setAttribute('aH', new THREE.Float32BufferAttribute(Ah, 2)); geo.setIndex(I);
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: /* glsl */`attribute vec2 aH; varying vec2 vUv, vH; varying vec3 vW; void main(){ vUv = uv; vH = aH; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`varying vec2 vUv, vH; varying vec3 vW;
          ${GLSL_HOURS}
          void main(){ float sunH = uRow[0].a, len = vH.x / max(tan(clamp(sunH, .001, 1.4)), 1. / 7.), up = smoothstep(0., .06, sunH);
            float a = (1. - smoothstep(len * .7, len, vUv.x)) * smoothstep(-vH.y, 0., vUv.x) * (1. - smoothstep(.45, 1., abs(vUv.y))) * .62 * up * exp(-distance(vW, cameraPosition) * uRow[4].a);
            gl_FragColor = vec4(uRow[3].rgb * .14, a); }` }));
      m.frustumCulled = false; m.renderOrder = 1; scene.add(m);
    }
    // (the table of casters holds NCAST: those of the buildings first, then the great trees by the road, the far wood last)
    casters.sort((a, b) => a[7] - b[7]);
    casters.slice(0, NCAST).forEach((c, i) => { U.uCastA.value[i].set(c[0], c[1], c[2], 0); U.uCastB.value[i].set(c[3], c[4], c[5], c[6]); });
    await ctx.yield();

    // ------------------------------------------------------------ THE PAIR AND THE CARRIAGE (declared at the head)
    const pair = buildPair(ctx, U, S.pair); scene.add(pair.object);
    await ctx.yield();
    const eye = new THREE.Vector3(), camP = new THREE.Vector3(), lampW = new THREE.Vector3(), loc = { s: 0, d: 0 }, fogC = new THREE.Color(), rowE = [0, 0, 0, 0], rowP = [0, 0, 0, 0];
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    // the necks' turn into a bend: this share of the road's own turning over the 12 m about the withers, and never more than that share of the
    // road's LEAST bend (the gentlest radius of the road's own list: 4.0 degrees). So the necks turn by the road's bend alone and alike in
    // every bend; at the low rise, the tightest, no more than anywhere else.
    const NECK = 0.35, NECK_SPAN = 12, NECK_MOST = NECK * NECK_SPAN * Math.min(...road.segs.filter((g) => g.kap !== 0).map((g) => Math.abs(g.kap)));
    // (THE PAIR STANDS ON THE EYE'S OWN PLACE IN THE WORLD: the camera's position as the engine has set it for this frame. It is given no
    // metres flown, no route parameter and no clock; what it reads of the table it reads at the road point nearest that place.)
    const placePair = (at) => {
      eye.copy(at); road.locate(eye.x, eye.z, loc); const s = loc.s;
      // along the road's own line and slope from the eye's road point on; heading by the road's bearing at the withers' place
      const b = road.at(s + STATION.withers)[2], hx = Math.sin(b), hz = -Math.cos(b);
      pair.object.position.set(eye.x, eye.y - EYE, eye.z); pair.object.rotation.set(Math.atan(road.slopeAt(s + STATION.withers * 0.5)), Math.atan2(-hx, -hz), 0, 'YXZ'); pair.object.updateMatrixWorld(true);
      const on = ctx.through ? 0 : 1;
      lampW.copy(pair.lamps[0]).applyMatrix4(pair.object.matrixWorld); U.uLamp0.value.set(lampW.x, lampW.y, lampW.z, on);
      lampW.copy(pair.lamps[1]).applyMatrix4(pair.object.matrixWorld); U.uLamp1.value.set(lampW.x, lampW.y, lampW.z, on);
      if (on) U.uPair.value.set(eye.x, eye.z, hx, hz); else U.uPair.value.set(1e5, 1e5, hx, hz);
      // THE COAT'S DARK, THE BREATH AND THE MOTHS READ THE TABLE at the pair's own place (the withers' metre of road), as everything else does:
      // the dark by the row's sun there (nought while its centre stands on the rim or over it: to the alder's point abeam; whole when the last of
      // its disc is under, 3 degrees down: from the shore's end on), the breath and the moths by the row's dew figure there (nought at the
      // sunset's tenth, whole from a half)
      const sp = s + STATION.withers, sunP = hours.row(0, sp, rowP)[3] / RAD, dewP = hours.row(3, sp, rowP)[3];
      U.uPairK.value.set(1 - smoothstep(-3, 0, sunP), clamp(NECK * wrap(road.at(sp + NECK_SPAN / 2)[2] - road.at(sp - NECK_SPAN / 2)[2]), -NECK_MOST, NECK_MOST), 0, 0);
      pair.uDew.value = smoothstep(0.1, 0.5, dewP);
      pair.object.visible = !ctx.through;
    };
    placePair(path.pointAt(0, camP));

    // ------------------------------------------------------------ THE GAZE: ONE LOOK for the whole road, found from built places
    // At every metre the lean is the bearing from the eye's road point to the place looked at, less the road's heading, HELD WITHIN ITS LIMIT
    // (15 degrees; 12 while the road bends), times a smooth weight; the sum with the look-ahead stays within 24 degrees of the road's
    // heading (under 25 of the flown line's). A place far to one side holds the lean AT THE LIMIT, and three of the weights stand WHOLE
    // between their ramps: so the look has HELD TOPS, and they are meant (the look rests on the barn, the water and the cornice while they pass).
    // EVERY END OF EVERY WINDOW IS A PLACE read from makePlaces (a point of the land taken abeam of the road by road.locate):
    //   the worn ring: rises from the entry (s 0) to maple A abeam (38.0), falls from there to the ring's far rim abeam (54.5): whole at one point only;
    //   the barn: rises from maple A abeam to the yard's gate (62), WHOLE from the gate to the second bend's end (148.9), falls to the barn's far end abeam (190.1);
    //   the water's far rim under the sun: rises from the hay wagon's gateway (164) to the barn's far end abeam, WHOLE to the fourth bend's start (259.0), falls to the meadow's first post (290);
    //   the cornice: rises over the fourth bend (259.0 to 290.4), WHOLE to the cornice abeam (324.5), falls to the low rise's middle abeam (350.3);
    //   the road's far end: rises from the low rise's middle abeam to the last bend's end (378.3), WHOLE from there to the ring.
    const AHEAD = 20, pa = new THREE.Vector3(), pb = new THREE.Vector3(), out = new THREE.Vector3();
    const abeam = (p) => road.locate(p[0], p[1]).s, ringFar = abeam(PL.ringC) + PL.ringR, barnFar = abeam(PL.barn) + PL.barnHalf, riseMid = abeam(PL.rise), mapleS = abeam(PL.mapleA), corniceS = abeam(PL.cornice);
    const farRim = [PL.C[0] + PL.dirSun[0] * 700, PL.C[1] + PL.dirSun[1] * 700], farEnd = P(L + 600);
    const GAZE = [
      [PL.ringC, (s) => smoothstep(0, mapleS, s) * (1 - smoothstep(mapleS, ringFar, s))],
      [PL.barn, (s) => smoothstep(mapleS, PL.gate, s) * (1 - smoothstep(PL.bend2End, barnFar, s))],
      [farRim, (s) => smoothstep(PL.wagon, barnFar, s) * (1 - smoothstep(PL.bend4, PL.fence4[0], s))],
      [PL.cornice, (s) => smoothstep(PL.bend4, PL.bend4End, s) * (1 - smoothstep(corniceS, riseMid, s))],
      [farEnd, (s) => smoothstep(riseMid, PL.bendEnd, s)],
    ];
    const bendAt = (s) => { let k = 0; for (let i = -6; i <= 6; i += 2) k += road.kapAt(s + i) !== 0 ? 1 : 0; return k / 7; };
    const leanAt = (s) => {
      road.at(s, 0, q3); const lim = (15 - 3 * bendAt(s)) * RAD; let lean = 0;
      for (const [pl, w] of GAZE) { const wk = w(s); if (wk > 0) lean += wk * clamp(wrap(Math.atan2(pl[0] - q3[0], -(pl[1] - q3[1])) - q3[2]), -lim, lim); }
      return lean;
    };
    const look = (time, u) => {
      const s = u * path.length; path.posAtDist(s, pa); path.posAtDist(s + AHEAD, pb); pb.sub(pa);
      const hd = road.at(s)[2], dev = clamp(wrap(Math.atan2(pb.x, -pb.z) + leanAt(s) - hd), -24 * RAD, 24 * RAD), b = hd + dev;
      // over a rise the look is level with what opens beyond it: the far looks (the water's rim, the road's far end) hold the pitch near the horizon
      const far = GAZE[2][1](s) + GAZE[4][1](s), pitch = lerp(pb.y / AHEAD, -0.012, clamp(far, 0, 1));
      return out.set(pa.x + Math.sin(b) * 40, pa.y + pitch * 40, pa.z - Math.cos(b) * 40);
    };
    const pois = [{ at: look, from: 0, to: 1, weight: 1, fade: 0.0001 }];

    return {
      scene, path, duration: 49.8, pace: () => 1, ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: AHEAD, sway: 0, bank: 0, nearThrough: 0.3 },
      pois,
      portal: { shape: 'circle', radius: RING_RADIUS, style: 'ring', halo: false, glow: 0, veil: '#19245c', color: '#8f8a86', drawWithin: DRAW_WITHIN, revealDistance: DRAW_WITHIN, blendDistance: 25 },
      post: { exposure: 1, bloom: { strength: 0.45, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.04, tint: '#ffffff', shadowTint: '#000000', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        U.uTime.value = time;
        camP.setFromMatrixPosition(camera.matrixWorld); dome.position.copy(camP);
        // THE ONE ROW: the table's row at the eye's place on the road (the road point nearest the eye's own place in the world)
        road.locate(camP.x, camP.z, loc); hours.setEye(U, loc.s);
        hours.row(4, loc.s, rowE); fogC.setRGB(rowE[0], rowE[1], rowE[2]); scene.fog.color.copy(fogC); scene.fog.density = rowE[3] * 0.8;
        placePair(camP);
        for (const f of frame) f(time, dt, camera, u);
      },
      dispose() { hours.tHours.dispose(); smap.dispose(); leafMap.dispose(); },
    };
  },
};
