// The Island That Shades the Fields: a perfectly round island afloat over a sea and a coast of farms, its shadow lying
// on the surf, a village and the fields. Its underside is one plate of adamant, a mirror with the sea, the boats and the
// land in it; its rim is a cliff of rock in beds under turf, ringed with five galleries where people live, fish with long
// lines and let down threads for petitions; its top is a bowl of lawns with a town of leaning houses (no right angle in
// one of them), gardens cut in circles and triangles, rivulets, four basins with fountains, and people who walk lost in
// thought with a servant behind carrying a blown bladder on a stick. The one landmark is the king's palace, beyond a
// great round well at the bowl's middle; the well goes down through the rock to the astronomers' cave, where a
// lodestone as long as a house plays on its axle in a hoop of adamant (hero set piece, src/parts/<this id>.js).
//
// LAYOUT (metres; the sea is y = 0, the island's axis and the well are x = z = 0). The route is laid by geometry in the
// part (layRoute: straight lines and arcs that touch, every radius from the pace flown there): in from out over the coast
// along the surf, a short pass in under the plate's edge, the climb round the cliff a tier's height out from the
// galleries, over the rim, down the bowl's street at the eaves to the palace by the well, down through the well into the
// cave's flank, one wide curve round the stone and the straight to the ring. The shore runs along z; the land is on the
// -x side, the sea on the +x side. A visit's hand (which way round) mirrors the whole place in x.
//
// BY PLACE (pure functions of u, through metres flown): the pacing (metres a second between places: 32, 28, 24, 13) and
// three pulls of the gaze, one at a time: the plate while we are under it, the cliff along the climb (the line runs a
// tier's height out and along the cliff, so the pull turns the look onto its face), the stone from the well to the last
// straight. On the rare visit nothing more (the waterfall and the changed rivulets are there from the beginning).
// BY THE CLOCK (right at any phase): sea, surf and the mirror's image, boats, lines, papers and fish, clouds, birds,
// kites, people walking the galleries, the cliff's stairs, the street and the well's terrace, rivulets and basins, roof
// instruments and the palace's armillary sphere, the stone's play with everything that leans with it, lamps.
// THE LENS: one thing reads the camera's projection, and only for its width on screen: the threads (lines, strings)
// are a width in metres, never drawn under 1.2 pixels, and where the floor widens one its light is paid back (alpha).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import { GLSL_NOISE } from '../kit/fx.js';
import { buildHero, makeGeo, makeFlight, ISLE, CAVE, lawnY, domeH, lin, mulc, mixc } from '../parts/island-that-shades-the-fields.js';

const TAU = Math.PI * 2;
// the measures of the place (the part holds them; shots/island-that-shades-the-fields/r2-progress.txt has their reasons)
const { R, Y0, FLOOR, ADAM, TOP, RIM, SHAFT, TIERS, GAL_W, ROD, TERRACE, COURT } = ISLE;
const SUN_EL = 40;
const f1 = (v) => v.toFixed(1);

// ---------------------------------------------------------------- what every shader of the place shares: sun, shade, haze, the
// shore, the island's shadow, and the land's colour seen from above (the land's own mesh and the mirror both use it)
const SHARED = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol, uFogCol; uniform float uFogK, uTime, uNight, uHand; uniform vec4 uShore;
const float ISLE_R = ${f1(R)}, ISLE_Y0 = ${f1(Y0)}, ISLE_RIM = ${f1(RIM)};
float shoreX(float z){ return uShore.x + uShore.y * sin(z / 170. + uShore.z) + 12. * sin(z / 61. + uShore.w); }
// 1 in the sun, 0 in the island's shadow (for anything below the underside): the sun's ray is followed through the
// island's thickness and its nearest pass to the axis is measured against the island's radius
float isleSun(vec3 p){
  if (uSunDir.y < .03) return 1.;
  float t0 = max((ISLE_Y0 - p.y) / uSunDir.y, 0.), t1 = (ISLE_RIM - p.y) / uSunDir.y;
  if (t1 <= 0.) return 1.;
  vec2 a = p.xz + uSunDir.xz * t0, ab = uSunDir.xz * (t1 - t0);
  float h = clamp(-dot(a, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
  return smoothstep(ISLE_R - 4., ISLE_R + 8., length(a + ab * h));
}
vec3 hazed(vec3 col, float dist){ return mix(col, uFogCol, 1. - exp(-dist * uFogK)); }
// sun and sky on a matte surface: lit 1, shade about half and blue
vec3 daylight(vec3 N, float sun){
  float k = clamp(dot(N, uSunDir), 0., 1.) * sun;
  return uSunCol * k + uSkyCol * (.55 + .45 * N.y) + uGroundCol * (.5 - .5 * N.y);
}`;
// the shadows of passing clouds on the fields, the lawns and the sea (needs the noise chunk): 1 in the sun, about 0.6
// under a cloud; they go with the wind at 7.5 m/s, so a field darkens and clears again in a few seconds
const CLOUDSHADE = /* glsl */`
float cloudSun(vec2 p){
  vec2 q = (p - vec2(uHand * 7., 2.7) * uTime) * .0021;
  float n = vnoise(q) * .65 + vnoise(q * 2.3 + 4.) * .35;
  return 1. - .42 * smoothstep(.5, .66, n);
}`;
// the land from above: sand, then fields in a patchwork with hedges, lanes and furrows (px = metres a pixel covers);
// the land's own mesh and the mirror both use it (needs the noise chunk)
const LANDCOL = /* glsl */`
vec3 landColor(vec2 p, float px){
  float di = shoreX(p.y) - uHand * p.x;
  float n1 = vnoise(p * .05), n2 = vnoise(p * .9);
  vec3 sand = mix(vec3(.62, .52, .34), vec3(.78, .68, .46), n1) * (.9 + .2 * n2 * (1. - smoothstep(.3, 2., px)));
  sand = mix(sand * .62, sand, smoothstep(0., 7., di + 2. * sin(uTime * .5 + p.y * .05)));
  vec2 q = p + vec2(fbm(p * .006) * 60., fbm(p * .006 + 7.) * 60.);
  vec3 vo = voronoi(q / 78.);
  float id = vo.z, kindf = fract(id * 7.31);
  vec3 crop = kindf < .3 ? vec3(.16, .36, .1) : kindf < .5 ? vec3(.3, .46, .12) : kindf < .7 ? vec3(.62, .5, .2) : kindf < .85 ? vec3(.34, .24, .14) : vec3(.5, .52, .22);
  float ang = fract(id * 3.7) * 3.14159;
  float fur = sin(dot(p, vec2(cos(ang), sin(ang))) * 1.6);
  crop *= .86 + .14 * fur * (1. - smoothstep(.5, 2.5, px)) + .12 * (n1 - .5);
  float hedge = 1. - smoothstep(.012, .03 + px * .01, vo.y);
  float tuft = vnoise(q * .35);
  crop = mix(crop, vec3(.05, .15, .05) * (.7 + .6 * tuft), hedge * (.55 + .45 * step(.35, tuft)));
  float lane = (1. - smoothstep(.0, .012 + px * .006, abs(vo.y - .05))) * step(.55, fract(id * 5.3));
  crop = mix(crop, vec3(.6, .54, .42), lane * .8);
  return mix(sand, crop, smoothstep(14., 26., di + (n1 - .5) * 10.));
}`;

// ---------------------------------------------------------------- the adamant underside: a level mirror with the world below in it
// (the sea with its swell, surf and glitter, the shore and the fields, the boats, the island's own shadow), upside down
const SEA_GLSL = /* glsl */`
uniform vec3 uSeaCol, uSeaDeep, uSeaShallow, uSkyHi, uSkyLo; uniform vec4 uBoats[24]; uniform sampler2D uLandMap; uniform vec4 uMapBox;
#define WTRAIN(dir, k, sp, amp) { float keep = 1. - smoothstep(.25, .8, px * k); float ph = dot(p, dir) * k + uTime * sp; h += sin(ph) * amp * keep; g += dir * cos(ph) * amp * k * keep; }
float swell(vec2 p, float px, out vec2 g){
  float h = 0.; g = vec2(0.);
  WTRAIN(vec2(.8, .6), .09, .9, 1.)
  WTRAIN(vec2(.3, .954), .17, 1.2, .55)
  WTRAIN(vec2(-.5, .866), .31, 1.7, .3)
  WTRAIN(vec2(.954, -.3), .62, 2.3, .16)
  WTRAIN(vec2(.1, .995), 1.3, 3.1, .08)
  return h / 2.1;
}
// the sea and the land as the eye would see them looking down along d from high over the point P (y = 0)
vec3 worldBelow(vec3 P, vec3 d, float px){
  float di = shoreX(P.z) - uHand * P.x, out_ = -di;
  float sun = isleSun(vec3(P.x, 0., P.z)) * cloudSun(P.xz);
  // where the mirrored ray runs shallow the swell is drawn out along it: there it is given by its mean, not in streaks
  float shallow = 1. - smoothstep(.12, .4, -d.y);
  vec2 g; float h = swell(P.xz, px, g);
  h *= 1. - .8 * shallow; g *= 1. - shallow;
  vec3 n = normalize(vec3(-g.x * .6, 1., -g.y * .6));
  float fres = pow(1. - clamp(dot(-d, n), 0., 1.), 4.);
  vec3 rr = reflect(d, n);
  vec3 skyRef = mix(uSkyLo, uSkyHi, clamp(rr.y, 0., 1.));
  vec3 lightK = uSkyCol * .7 + uSunCol * (.5 * sun * clamp(uSunDir.y + .2, 0., 1.));
  vec3 body = mix(uSeaDeep, uSeaCol, clamp(.5 + .5 * h, 0., 1.)) * lightK;
  body = mix(uSeaShallow * lightK, body, smoothstep(0., 46., out_ + 8. * vnoise(P.xz * .04)));
  vec3 sea = mix(body, skyRef, .06 + .55 * fres);
  // the sun's glitter: sparks where a pixel is smaller than a ripple, their mean light where it is larger (no streaks)
  float far = max(smoothstep(1.5, 6., px), shallow);
  // (the long swell alone would make the glitter great blots: the sparks are small, moving, and many)
  float spark = smoothstep(.7, .9, vnoise(P.xz * 2.3 + uTime * vec2(.9, .6))) * 3.5;
  sea += uSunCol * sun * pow(clamp(dot(reflect(d, vec3(0., 1., 0.)), uSunDir), 0., 1.), 40.) * mix(spark, .55, far) * 1.2;
  // white where it breaks: lines of surf walking in to the shore, the swash at the edge, a few caps outside
  float brk = vnoise(vec2(P.z * .05, out_ * .2 - uTime * .3));
  float line = smoothstep(.72, .93, fract(out_ / 13. + uTime * .11 + .25 * vnoise(vec2(P.z * .02, 3.)))) * (1. - smoothstep(6., 44., out_)) * smoothstep(.25, .6, brk) * (1. - smoothstep(3., 9., px));
  float swash = (1. - smoothstep(0., 3.5 + 2. * sin(uTime * .5 + P.z * .05), out_)) * (.5 + .5 * brk);
  // (a cap is a short broken crest, a metre or two long, where the swell stands high inside a windier patch: never a blot)
  float caps = smoothstep(.74, .9, vnoise(P.xz * .045 + vec2(uTime * .12, 0.))) * smoothstep(.45, .8, h * .5 + .5) * (1. - smoothstep(1., 6., px));
  caps *= smoothstep(.62, .8, vnoise(P.xz * vec2(.4, 1.3) + vec2(uTime * .35, 0.)));
  sea = mix(sea, vec3(.93, .96, .97) * (lightK + .15), clamp(line + swash + caps * .6, 0., 1.) * .9);
  // the boats at anchor, each as the mirror shows it: the hull and deck from over it, and the mast and sails standing
  // away from the hull along the ray's own lie (a point h metres up shows where the ray is h metres over the sea),
  // rocking as the boat rocks. s is how far the ray runs over the ground for each metre of height.
  vec2 s = d.xz / max(-d.y, 2e-3); float sl = min(length(s), 12.);
  float crisp = 1. - smoothstep(1.2, 4., px);
  for (int i = 0; i < 24; i++) {
    vec4 b = uBoats[i];
    if (b.w < .5) continue;
    vec2 rel = P.xz - b.xy; float reach = 7. + 10. * sl;
    if (dot(rel, rel) > reach * reach) continue;
    float cs = cos(b.z), sn = sin(b.z);
    vec2 q = vec2(rel.x * cs + rel.y * sn, -rel.x * sn + rel.y * cs);
    vec2 sq = vec2(s.x * cs + s.y * sn, -s.x * sn + s.y * cs);
    sq.y += .07 * sin(uTime * .9 + b.w - 1.);
    float sqn = max(length(sq), 1e-3); if (sqn > 12.) sq *= 12. / sqn;
    // hull: pointed at the bow, square at the stern; a pale deck inside the dark gunwale
    float hw = q.x < .6 ? mix(1.3, 1.65, smoothstep(-4., .6, q.x)) : 1.65 * sqrt(max(1. - (q.x - .6) * (q.x - .6) / 16.8, 0.));
    float edge = mix(-9., hw - abs(q.y), step(-4., q.x) * step(q.x, 4.7));
    float hull = smoothstep(-.5 * px, .5 * px + .05, edge), deck = smoothstep(.3, .45 + .5 * px, edge);
    vec3 bc = mix(vec3(.13, .08, .05), vec3(.55, .43, .27), deck) * lightK;
    // a ring of broken water round the hull
    float foam = (1. - smoothstep(0., 1.4, abs(edge + .5))) * step(-4.6, q.x) * step(q.x, 5.3) * (.5 + .5 * brk) * crisp;
    sea = mix(sea, vec3(.9, .94, .96) * (lightK + .15), foam * .7 * (1. - hull));
    sea = mix(sea, bc, hull);
    // the mainsail (between the mast at x 0.3 and the boom's end at x -3.5, from 2 m up to the gaff) and the jib
    float sy = abs(sq.y) < .03 ? .03 : sq.y, h = q.y / sy, xs = q.x - sq.x * h;
    float sail = step(2., h) * step(h, 8.4 - (.3 - xs) * .5) * step(-3.5, xs) * step(xs, .3);
    sail = max(sail, step(1.8, h) * step(h, 7.4 - (xs - .45) * 1.4) * step(.45, xs) * step(xs, 4.6));
    sea = mix(sea, vec3(.78, .74, .62) * (lightK + .1), sail * crisp);
    // the mast: from its foot to its top, 9 m up
    vec2 m0 = vec2(.3, 0.), mv = sq * 9., pm = q - m0;
    float tm = clamp(dot(pm, mv) / max(dot(mv, mv), 1e-3), 0., 1.);
    float dm = length(pm - mv * tm);
    sea = mix(sea, vec3(.2, .13, .08) * lightK, (1. - smoothstep(.12, .22 + px, dm)) * crisp);
  }
  vec3 land = landColor(P.xz, px);
  // the village's roofs and the trees, from the map drawn of them (canonical x across, z up the map)
  vec2 muv = (vec2(uHand * P.x, P.z) - uMapBox.xy) / uMapBox.zw;
  if (muv.x > 0. && muv.x < 1. && muv.y > 0. && muv.y < 1.) { vec4 mp = texture2D(uLandMap, muv); land = mix(land, mp.rgb, mp.a); }
  land *= uSunCol * (sun * clamp(uSunDir.y, 0., 1.)) + uSkyCol * .8;
  return mix(sea, land, smoothstep(-1., 1., di));
}`;
const MIRROR_VERT = /* glsl */`
varying vec3 vWorld;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const MIRROR_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
${CLOUDSHADE}
${LANDCOL}
${SEA_GLSL}
uniform vec3 uAdam;
varying vec3 vWorld;
void main(){
  vec3 toP = vWorld - cameraPosition; float dEye = length(toP);
  vec3 V = toP / max(dEye, 1e-3);
  // the plate is a made thing: great facets (rings 44 m wide, cut into sectors about as wide), each a hair out of
  // level, so the picture breaks a little at every seam; and a bevel round the edge, 6 m wide, turned 25 degrees out
  float r = length(vWorld.xz), ring = floor(r / 44.), nSec = 6. * (ring + 1.);
  float an = atan(vWorld.z, vWorld.x) / 6.2831853 + .5, sec = floor(an * nSec);
  float dr = (.5 - abs(fract(r / 44.) - .5)) * 44., da = (.5 - abs(fract(an * nSec) - .5)) * 6.2831853 / nSec * r;
  float fid = ring * 37. + sec;
  vec2 tilt = (vec2(hash11(fid * 1.31 + 2.), hash11(fid * 2.17 + 9.)) - .5) * .014;
  vec2 out2 = vWorld.xz / max(r, 1e-3);
  float bev = smoothstep(ISLE_R - 6., ISLE_R - 5.4, r);
  vec3 n = normalize(vec3(tilt.x, -1., tilt.y) + vec3(out2.x, 0., out2.y) * bev * .47);
  vec3 d = reflect(V, n);
  d.y = -max(-d.y, 2e-3); d = normalize(d);
  float t = min(vWorld.y / -d.y, 9000.);
  vec3 P = vWorld + d * t;
  vec2 fw = fwidth(P.xz); float px = clamp(max(fw.x, fw.y), 1e-2, 1e3);
  vec3 below = worldBelow(P, d, px);
  below = hazed(below, t * .5);
  float ndv = clamp(dot(-V, n), 0., 1.);
  // light from the sea running up over the plate, where the sea straight below lies in the sun
  float a = vnoise(vWorld.xz * .11 + vec2(uTime * .22, 0.)), b = vnoise(vWorld.xz * .19 - vec2(0., uTime * .17) + 5.);
  float ripple = pow(clamp(1. - abs(a - b) * 2.4, 0., 1.), 6.) * (.3 + .7 * isleSun(vec3(vWorld.x, 0., vWorld.z)));
  vec3 col = uAdam * (.5 + .5 * uSkyCol) + below * mix(.6, .97, pow(clamp(1. - ndv, 0., 1.), 3.)) * vec3(.74, .85, 1.) + uSunCol * ripple * .05 * (1. - uNight);
  // each facet a shade of its own, and the seams: a dark line with a bright hair beside it
  float fwp = max(length(fwidth(vWorld.xz)), 1e-3), seamD = min(dr, da);
  col *= .96 + .08 * hash11(fid * 3.7 + 1.);
  col *= 1. - .35 * (1. - smoothstep(.08, .12 + fwp, seamD)) * (1. - smoothstep(.5, 2., fwp));
  col += (uSkyCol * .12 + uSunCol * .02) * (1. - smoothstep(.0, .08 + fwp, abs(seamD - .28))) * (1. - smoothstep(.4, 1.5, fwp));
  col = mix(col, col * .8 + uAdam * .3, bev * .5);
  gl_FragColor = vec4(hazed(col, dEye), 1.);
}`;

// ---------------------------------------------------------------- the land below (its own mesh), lit by the sun and shaded by the island
const WORLD_VERT = /* glsl */`
varying vec3 vWorld, vN;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const LAND_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
${CLOUDSHADE}
${LANDCOL}
varying vec3 vWorld, vN;
void main(){
  vec2 fw = fwidth(vWorld.xz); float px = clamp(max(fw.x, fw.y), 1e-2, 1e3);
  vec3 N = normalize(vN);
  vec3 col = landColor(vWorld.xz, px) * daylight(N, isleSun(vWorld) * cloudSun(vWorld.xz));
  col = mix(vec3(.2, .3, .3) * uSkyCol, col, smoothstep(-2.5, 0., vWorld.y));
  gl_FragColor = vec4(hazed(col, length(vWorld - cameraPosition)), 1.);
}`;

// ---------------------------------------------------------------- the rim: polished adamant below, the ores in their order above it
// (ore red, ochre, slate, chalk), turf over all; each gallery throws its shadow down the cliff
const STRATA = /* glsl */`
// rock, not paint: a bed's colour dulled toward the rock's own grey, mottled at two sizes, and crossed by veins of a
// paler mineral that wander over the beds (thin, a little lighter than the bed; they fade as a pixel grows past them)
vec3 rock(vec3 ore, float arc, float yy, float px){
  float g = dot(ore, vec3(.3, .5, .2)), keep = 1. - smoothstep(.3, 1.6, px);
  vec3 c = mix(ore, vec3(g) * vec3(1.05, 1., .92), .4);
  c *= .78 + .44 * fbm(vec2(arc * .09, yy * .22));
  c *= 1. - .2 * keep * (vnoise(vec2(arc * 1.3, yy * 2.1)) - .5) * 2.;
  float v = abs(fbm(vec2(arc * .035 + 7., yy * .12)) - .5), v2 = abs(fbm(vec2(arc * .05 - 3., yy * .3 + 9.)) - .5);
  float vein = max(1. - smoothstep(0., .006 + px * .012, v), .6 * (1. - smoothstep(0., .004 + px * .012, v2)));
  return mix(c, c * 1.35 + .05, vein * .5 * keep);
}
// bedded rock: courses of uneven height, each broken into blocks by joints, each block with a tone of its own; the
// fine lines fade as a pixel grows past them. Returns a tone about 1 for the place (arc and height in metres).
float strata(float arc, float yy, float px){
  float w = yy * .55 + .9 * vnoise(vec2(arc * .018, yy * .11));
  float bid = floor(w), bf = fract(w);
  float bw = 2.2 + 3.4 * hash11(bid * 1.93);
  float c = arc / bw + hash11(bid * 4.7) * 9.;
  float cid = floor(c), cf = fract(c);
  float keep = 1. - smoothstep(.25, 1.3, px);
  float tone = mix(1., .9 + .2 * hash11(bid * 7.1 + cid * 3.3), .3 + .7 * keep);
  // a bed's seam is strong or faint by the bed; only some blocks are parted from their neighbour by a joint
  float bedLine = (1. - smoothstep(0., .07 + px * .4, min(bf, 1. - bf))) * (.35 + .65 * hash11(bid * 2.9));
  float joint = (1. - smoothstep(0., .03 + px * .25 / bw, min(cf, 1. - cf))) * step(.68, hash11(bid * 5.3 + cid * 1.7));
  tone *= 1. - .34 * max(bedLine, joint * .5) * (.35 + .65 * keep);
  // relief: each bed stands out from the face by its own measure; a bed that stands out past the one over it has a
  // lit ledge along its top, a bed under one that stands out lies in its shadow near the top; blocks differ a little
  float s0 = hash11(bid * 3.37), s1 = hash11((bid + 1.) * 3.37), far = 1. - smoothstep(1.5, 6., px);
  float ledge = max(s0 - s1, 0.) * smoothstep(.78, .97, bf), shade = max(s1 - s0, 0.) * smoothstep(.35, .95, bf);
  tone *= 1. + (.55 * ledge - .6 * shade) * far;
  tone *= 1. + .12 * (hash11(bid * 1.3 + cid * 6.1) - .5) * far;
  // weather: dark stains run down the face
  tone *= .84 + .3 * vnoise(vec2(arc * .3, yy * .035 + 3.));
  return tone;
}`;
const RIM_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
${STRATA}
uniform vec3 uAdam, uSeaCol, uSkyHi, uSkyLo, uLie; uniform float uTiers[5];
varying vec3 vWorld, vN;
void main(){
  vec3 toP = vWorld - cameraPosition; float dEye = length(toP); vec3 V = toP / max(dEye, 1e-3);
  vec3 N = normalize(vec3(vWorld.x, 0., vWorld.z));
  float y = vWorld.y, arc = atan(vWorld.z, vWorld.x) * ISLE_R;
  vec2 fw = vec2(length(fwidth(vWorld)), 0.); float px = clamp(fw.x, 1e-2, 1e3);
  // the beds' lie: they dip across the island by the visit's draw (the same plane in the well's wall) and roll a little
  float warp = (vnoise(vec2(arc * .012, y * .04)) - .5) * 7. + sin(arc * .0045 + uLie.z) * 3.5;
  float yy = y + warp + dot(vWorld.xz, uLie.xy);
  // the galleries' shadows: each slab shades the cliff under it for as far as the sun's height carries
  float cosA = dot(N, normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-4, 0., 0.)));
  float drop = ${f1(GAL_W)} * uSunDir.y / max(length(uSunDir.xz) * max(cosA, .22), 1e-3);
  float sunK = 1.;
  for (int i = 0; i < 5; i++) { float top = uTiers[i] - .7; sunK *= 1. - .88 * smoothstep(top - drop - .6, top - drop + .6, y) * (1. - smoothstep(top - .2, top + .4, y)); }
  // under the turf's overhang
  sunK *= 1. - .6 * smoothstep(ISLE_RIM - 5.5, ISLE_RIM - 4., y);
  vec3 col;
  if (yy < ${f1(ADAM)}) {
    // adamant: tall facets, each turned a little, mirror the sky above the horizon and the sea below it
    float cell = arc / 9. + .35 * vnoise(vec2(floor(y / 37.) * 3.1, arc * .02));
    float fid = floor(cell), ff = fract(cell);
    float turn = (hash11(fid * 1.37 + floor(y / 37.) * 5.1) - .5) * .7;
    vec3 T = vec3(-N.z, 0., N.x);
    vec3 Nf = normalize(N + T * turn + vec3(0., (hash11(fid * 2.11) - .5) * .25, 0.));
    vec3 Rr = reflect(V, Nf);
    vec3 env = Rr.y > 0. ? mix(uSkyLo, uSkyHi, clamp(Rr.y * 1.4, 0., 1.)) : mix(uSkyLo * .8, uSeaCol * (uSkyCol * .8 + uSunCol * .45), clamp(-Rr.y * 3., 0., 1.));
    float ndv = clamp(dot(-V, Nf), 0., 1.);
    float seam = (1. - smoothstep(.0, .035 + px * .06, min(ff, 1. - ff))) * .5 + (1. - smoothstep(0., .4 + px, abs(fract(y / 37. + .2) - .5) * 37.)) * .35;
    env = mix(env, vec3(dot(env, vec3(.3, .4, .3))), .45) * vec3(.6, .72, .95);
    col = uAdam * daylight(Nf, sunK) * .9 + env * (.03 + .26 * pow(clamp(1. - ndv, 0., 1.), 4.));
    col += uSunCol * pow(clamp(dot(Rr, uSunDir), 0., 1.), 60.) * sunK * 1.4;
    col *= 1. - seam * .55;
    // light from the sea plays up the adamant (strongest low on the cliff, where the sea outside lies in the sun)
    // broad soft patches of light that climb the face as the swell passes below
    float ra = vnoise(vec2(arc * .045 + uTime * .1, y * .06 - uTime * .32)), rb = vnoise(vec2(arc * .09 + 5., y * .11 - uTime * .5));
    vec3 out2 = vWorld + N * 40.;
    col += uSunCol * vec3(.55, .8, 1.) * smoothstep(.42, .8, ra * .65 + rb * .35) * .1 * exp(-(y - ISLE_Y0) / 70.) * isleSun(vec3(out2.x, 0., out2.z)) * (1. - uNight);
    col = mix(col, vec3(.3, .2, .16) * daylight(N, sunK), smoothstep(${f1(ADAM - 2)}, ${f1(ADAM)}, yy) * .7);
  } else {
    float b = (yy - ${f1(ADAM)}) / ${f1((RIM - 4 - ADAM) / 4)};
    float bi = floor(b), bf = fract(b);
    vec3 ore = bi < 1. ? vec3(.5, .13, .09) : bi < 2. ? vec3(.68, .42, .1) : bi < 3. ? vec3(.24, .29, .36) : vec3(.86, .83, .74);
    vec3 next = bi < 1. ? vec3(.68, .42, .1) : bi < 2. ? vec3(.24, .29, .36) : vec3(.86, .83, .74);
    ore = mix(ore, next, smoothstep(.86, 1., bf) * .5);
    ore = rock(ore, arc, yy, px) * strata(arc, yy, px);
    float turf = smoothstep(ISLE_RIM - 4.6, ISLE_RIM - 3.4, y + (vnoise(vec2(arc * .3, 2.)) - .5) * 1.5);
    ore = mix(ore, vec3(.1, .34, .08) * (.8 + .5 * vnoise(vec2(arc * .7, y * 2.))), turf);
    col = ore * daylight(N, sunK);
  }
  gl_FragColor = vec4(hazed(col, dEye), 1.);
}`;

// ---------------------------------------------------------------- the bowl of lawns: turf, gravel walks round the basins and the shaft
// and along the four ways from the shaft to the basins, daisies near the eye
const LAWN_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
${CLOUDSHADE}
uniform vec4 uBasins[4];
uniform vec2 uStreet[10]; uniform vec2 uStreetDir;
varying vec3 vWorld, vN;
float segDist(vec2 p, vec2 a, vec2 b){ vec2 ab = b - a; float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0., 1.); return length(p - a - ab * h); }
void main(){
  vec2 p = vWorld.xz; float r = length(p);
  vec2 fw = fwidth(p); float px = clamp(max(fw.x, fw.y), 1e-2, 1e3);
  vec3 N = normalize(vN);
  float n1 = fbm(p * .035), n2 = vnoise(p * .7), n3 = vnoise(p * 4.);
  vec3 turf = mix(vec3(.04, .17, .04), vec3(.18, .38, .095), smoothstep(.25, .75, n1)) * (.82 + .28 * n2 * (1. - smoothstep(.4, 3., px)) + .2 * n3 * (1. - smoothstep(.05, .5, px)));
  // mown rings about the axis, a darker and a lighter swathe by turns (each 3.5 m wide)
  turf *= .9 + .1 * smoothstep(-.3, .3, sin(r * .9 + n1 * 2.)) * (1. - smoothstep(1., 5., px));
  // clover and dry patches
  turf = mix(turf, vec3(.3, .36, .1), .5 * smoothstep(.62, .8, vnoise(p * .021 + 11.)));
  vec3 vo = voronoi(p * 1.4);
  float daisy = smoothstep(.16, .06, vo.x) * step(.72, fract(vo.z * 9.1)) * smoothstep(.45, .7, vnoise(p * .09 + 3.)) * (1. - smoothstep(.08, .35, px));
  turf = mix(turf, vec3(.9, .9, .82), daisy);
  // the walks
  float walk = (1. - smoothstep(1.1, 1.8, abs(mod(r - 56., 26.) - 13.))) * step(60., r) * step(r, 205.);
  for (int i = 0; i < 4; i++) {
    vec4 b = uBasins[i];
    walk = max(walk, 1. - smoothstep(1.2, 2., abs(length(p - b.xy) - b.z - 4.5)));
    vec2 dir = b.xy / max(length(b.xy), 1e-3);
    walk = max(walk, (1. - smoothstep(1., 1.8, segDist(p, dir * ${f1(SHAFT + 5.5)}, b.xy - dir * (b.z + 4.5)))));
    walk = max(walk, (1. - smoothstep(1., 1.8, segDist(p, b.xy + dir * (b.z + 4.5), dir * ${f1(R - 9)}))) * step(length(p - b.xy), 400.));
    // the basin's stone kerb
    float kd = length(p - b.xy) - b.z;
    turf = mix(turf, vec3(.8, .77, .68) * (.85 + .3 * n3), (1. - smoothstep(.0, .5, abs(kd - .9) - .9)));
  }
  vec3 gravel = vec3(.74, .68, .54) * (.82 + .3 * vnoise(p * 6.) * (1. - smoothstep(.05, .4, px)));
  vec3 col = mix(turf, gravel, walk * .92);
  // the paved street under the bowl's line (8 m wide, from the rim's gate to the well) and the well's terrace: stone
  // slabs in courses, each its own shade, a darker kerb stone along the street's edge, and round the well a band of
  // three-cornered inlays (their pattern, cut in dark stone)
  float sd = 1e3;
  for (int i = 0; i < 9; i++) sd = min(sd, segDist(p, uStreet[i], uStreet[i + 1]));
  float court = 1. - smoothstep(${f1(SHAFT + TERRACE + 1.6)}, ${f1(SHAFT + TERRACE + 2.0)}, r), street = 1. - smoothstep(3.8, 4.1, sd);
  vec2 q = court > .5 ? vec2(atan(p.y, p.x) * 16.870424, r / 1.5) : vec2(dot(p, uStreetDir) / 1.9, dot(p, vec2(-uStreetDir.y, uStreetDir.x)) / 1.15);
  q.x += .5 * mod(floor(q.y), 2.);
  vec2 fq = fract(q), cell = floor(q);
  float fine = 1. - smoothstep(.04, .3, px), joint = (1. - smoothstep(.0, .05, min(min(fq.x, 1. - fq.x) * 1.9, min(fq.y, 1. - fq.y) * 1.15))) * fine;
  vec3 slab = vec3(.8, .77, .68) * (.86 + .2 * hash12(cell) * fine + .1 * n2) * (1. - .45 * joint);
  slab *= 1. - .3 * (1. - court) * smoothstep(3.1, 3.3, sd);
  float th = atan(p.y, p.x) * 7.639437, band = (r - ${f1(SHAFT + 4.5)}) / 3.2, tw = abs(fract(th) - .5) * 2.;
  float inlay = step(0., band) * step(band, 1.) * smoothstep(-.03, .03, (1. - band) - tw) * court;
  slab = mix(slab, vec3(.2, .22, .27), inlay * .85);
  col = mix(col, slab, max(court, street));
  // the rim's parapet strip and the shaft's lip are stone
  col = mix(col, vec3(.78, .75, .66), smoothstep(${f1(R - 2.2)}, ${f1(R - 1.6)}, r));
  col *= daylight(N, cloudSun(p));
  gl_FragColor = vec4(hazed(col, length(vWorld - cameraPosition)), 1.);
}`;

// ---------------------------------------------------------------- built things: vertex colours and a kind
// kind 0 matte, 1 metal (copper), 2 lamp, 5 window (dark by day, lit at night), 6 and over cloth (matte; the part over
// 6 is how far that corner flaps in the wind). Instanced or not; lit by the sun, shaded blue; below the underside the
// island's own shadow falls on them
const SOLID_VERT = /* glsl */`
attribute float kind;
uniform float uTime;
varying vec3 vWorld, vN, vCol; varying float vKind;
void main(){
  vec4 wp = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  wp = instanceMatrix * wp; n = mat3(instanceMatrix) * n;
  #endif
  wp = modelMatrix * wp; n = mat3(modelMatrix) * n;
  if (kind > 5.5) wp.xyz += normalize(n) * (kind - 6.) * .55 * sin(uTime * 5. + wp.x * 1.3 + wp.z * 1.7 - wp.y * 2.);
  vWorld = wp.xyz; vN = n; vCol = color; vKind = kind;
  #ifdef USE_INSTANCING_COLOR
  vCol *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SOLID_FRAG = /* glsl */`
${SHARED}
uniform vec3 uSkyHi, uSkyLo, uLampCol;
varying vec3 vWorld, vN, vCol; varying float vKind;
void main(){
  vec3 toP = vWorld - cameraPosition; float dEye = length(toP); vec3 V = toP / max(dEye, 1e-3);
  vec3 N = normalize(vN);
  if (dot(N, V) > 0.) N = -N;
  float sun = vWorld.y < ISLE_Y0 + 1. ? isleSun(vWorld) : 1.;
  vec3 col;
  if (vKind < .5 || vKind > 5.5) col = vCol * daylight(N, sun);
  else if (vKind < 1.5) {
    vec3 Rr = reflect(V, N);
    vec3 env = mix(uSkyLo, uSkyHi, clamp(Rr.y * .5 + .5, 0., 1.));
    col = vCol * daylight(N, sun) * .55 + vCol * env * .5 + uSunCol * vCol * pow(clamp(dot(Rr, uSunDir), 0., 1.), 40.) * sun * 2.2;
  }
  else if (vKind < 2.5) col = vCol * (1.5 + 1.8 * uNight);
  else {
    // a window: lit from inside at night, and by day where the island's shadow lies on the house
    float lit = max(uNight, 1. - sun);
    col = vCol * daylight(N, sun) * (1. - .8 * lit) + uLampCol * lit * 1.7 * step(.35, fract(vWorld.x * .37 + vWorld.z * .23 + vWorld.y * .11));
  }
  gl_FragColor = vec4(hazed(col, dEye), 1.);
}`;

// ---------------------------------------------------------------- threads and what hangs on them: fishing lines with fish and floats,
// petition threads with their papers, kite strings with kites. A thread runs from A (position) to B and sways most at A.
// It has its width in metres; where that is under 1.2 pixels it is drawn 1.2 pixels wide and so much fainter (its
// light is paid back: alpha = true width / drawn width). The pixel's size comes from the lens in use
// (projectionMatrix) and the drawing buffer's height. A bead (fish, float, kite, paper) is a small sheet that faces
// the eye at its own place on its thread.
const THREAD_VERT = /* glsl */`
attribute vec3 aB; attribute vec4 aP, aQ;
uniform float uPixH;
varying vec3 vCol, vWorld; varying vec2 vUv; varying float vMode, vFlash, vAlpha;
${SHARED}
vec3 along(float a){
  float k = pow(clamp(1. - a, 0., 1.), 1.5) * aQ.x, ph = aP.w;
  return mix(position, aB, a) + vec3(sin(uTime * .7 + ph) + .4 * sin(uTime * 1.9 + ph * 2.3), .25 * sin(uTime * .9 + ph * 1.3) * step(2.5, aQ.x), cos(uTime * .53 + ph * 1.7)) * k;
}
void main(){
  vMode = aP.z; vCol = color; vFlash = 1.; vAlpha = 1.;
  vec4 mv;
  if (aP.z < .5) {
    vec3 p = along(aP.y), p2 = along(aP.y + .03);
    mv = viewMatrix * modelMatrix * vec4(p, 1.);
    vec4 mv2 = viewMatrix * modelMatrix * vec4(p2, 1.);
    vec2 dir = mv2.xy - mv.xy; float dl = length(dir); dir = dl > 1e-5 ? dir / dl : vec2(0., 1.);
    float halfTrue = aQ.z * .5, halfW = max(halfTrue, .6 * max(-mv.z, 0.) * uPixH / projectionMatrix[1][1]);
    vAlpha = halfTrue / max(halfW, 1e-5);
    mv.xy += vec2(-dir.y, dir.x) * aP.x * halfW;
    vUv = vec2(aP.x, aP.y); vWorld = (modelMatrix * vec4(p, 1.)).xyz;
  } else {
    float a = aQ.y > 0. ? fract(uTime * aQ.y + aP.w) : aQ.w;
    vec3 c = along(a);
    float sz = aQ.z * (aQ.y > 0. ? smoothstep(0., .06, a) * smoothstep(1., .9, a) : 1.);
    mv = viewMatrix * modelMatrix * vec4(c, 1.);
    float tw = aQ.y > 0. ? sin(uTime * 7. + aP.w * 5.) : aP.z > 2.5 ? .9 * sin(uTime * 4.3 + aP.w * 3.) : .25 * sin(uTime * 1.3 + aP.w);
    vec2 cr = vec2(aP.x, aP.y);
    // a paper turns on its thread: now broad, now edge on
    if (aP.z > 2.5) cr.x *= .3 + .7 * abs(cos(uTime * 3.1 + aP.w * 2.));
    cr = vec2(cr.x * cos(tw * .5) - cr.y * sin(tw * .5), cr.x * sin(tw * .5) + cr.y * cos(tw * .5));
    mv.xy += cr * sz;
    vUv = vec2(aP.x, aP.y); vWorld = (modelMatrix * vec4(c, 1.)).xyz;
    vFlash = aQ.y > 0. ? .55 + 1.6 * pow(abs(tw), 6.) : 1.;
  }
  gl_Position = projectionMatrix * mv;
}`;
const THREAD_FRAG = /* glsl */`
${SHARED}
varying vec3 vCol, vWorld; varying vec2 vUv; varying float vMode, vFlash, vAlpha;
void main(){
  float sun = vWorld.y < ISLE_Y0 ? isleSun(vWorld) : 1.;
  vec3 light = uSunCol * (.55 * sun) + uSkyCol * .8;
  if (vMode > .5 && vMode < 2.5) {
    vec2 q = clamp(vUv, -1., 1.);
    float d = vMode < 1.5 ? length(q / vec2(1., .42)) : abs(q.x) + abs(q.y) * .8;
    if (d > 1.) discard;
  }
  gl_FragColor = vec4(hazed(vCol * light * vFlash, length(vWorld - cameraPosition)), clamp(vAlpha, 0., 1.));
}`;

// ---------------------------------------------------------------- water on the island: rivulets (mode 0), basins (1), the fall off the
// rim (2). Ripples keep their size in metres; the sky lies in it; white where it breaks at its little steps.
const WATER_VERT = /* glsl */`
attribute vec3 aFlow;
varying vec3 vWorld, vFlow;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vFlow = aFlow; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WATER_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
uniform float uMode, uFlowK; uniform vec3 uSkyHi, uSkyLo, uWaterCol; uniform vec4 uDrops[6];
varying vec3 vWorld, vFlow;
void main(){
  float ac = clamp(vFlow.y, -1., 1.), hw = max(vFlow.z, .05);
  vec3 toP = vWorld - cameraPosition; float dEye = length(toP); vec3 V = toP / max(dEye, 1e-3);
  vec2 g = vec2(0.); float alpha = 1., white = 0.;
  if (uMode < .5) {
    vec2 q = vec2(ac * hw, vFlow.x - uTime * 2.4 * uFlowK);
    g += vec2(.3, .95) * cos(dot(q, vec2(.3, .95)) * 2.3) * .22 + vec2(-.5, .87) * cos(dot(q, vec2(-.5, .87)) * 3.9 + 1.) * .15 + vec2(.9, .44) * cos(dot(q, vec2(.9, .44)) * 6.3) * .08;
    g += (vec2(vnoise(q * 1.3), vnoise(q * 1.3 + 7.)) - .5) * .5;
    white = smoothstep(.7, .9, vnoise(vec2(vFlow.x * .09, 3.))) * smoothstep(.45, .8, vnoise(q * vec2(2.5, 1.2))) * .7;
    alpha = 1. - smoothstep(.7, 1., abs(ac));
  } else if (uMode < 1.5) {
    vec2 q = vWorld.xz;
    for (int i = 0; i < 6; i++) {
      vec4 s = uDrops[i]; vec2 dv = q - s.xy; float dl = length(dv) + 1e-3;
      float ph = dl * 1.15 - uTime * s.w + s.z;
      g += dv / dl * cos(ph) * .3 * exp(-dl / 16.) * smoothstep(0., 2., dl);
    }
    g += (vec2(vnoise(q * .9 + uTime * .2), vnoise(q * .9 - uTime * .17 + 5.)) - .5) * .12;
  } else {
    vec2 q = vec2(ac * hw, vFlow.x - uTime * 14.);
    float st = vnoise(vec2(q.x * 1.6, q.y * .07)) * .6 + vnoise(vec2(q.x * 4., q.y * .21)) * .4;
    alpha = smoothstep(.3, .62, st) * (1. - ac * ac) * .9;
    white = 1.;
  }
  vec3 n = normalize(vec3(-g.x, 1., -g.y));
  float fres = pow(1. - clamp(dot(-V, n), 0., 1.), 3.);
  vec3 rr = reflect(V, n);
  vec3 lightK = uSkyCol * .85 + uSunCol * .45;
  vec3 col = mix(uWaterCol * lightK, mix(uSkyLo, uSkyHi, clamp(rr.y, 0., 1.)), .18 + .72 * fres);
  col += uSunCol * pow(clamp(dot(rr, uSunDir), 0., 1.), 140.) * 4.;
  col = mix(col, vec3(.93, .96, .97) * (lightK + .1), white * .8);
  gl_FragColor = vec4(hazed(col, dEye), alpha);
}`;

// ---------------------------------------------------------------- the shaft's wall: turf, mould, the ores in their order, black adamant;
// daylight from above fails with depth, lamplight from below grows
const SHAFT_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
${STRATA}
uniform vec3 uAdam, uWarm, uLie; uniform vec2 uStone; uniform vec4 uStair; uniform float uHandS;
varying vec3 vWorld, vN;
void main(){
  // how far over the cave's dome this point of the wall is (under it: the cave's own space, not drawn)
  vec2 sc = (vWorld.xz - uStone) / ${f1(CAVE.R)};
  float over = vWorld.y - ${f1(FLOOR)} - ${f1(CAVE.H)} * sqrt(max(1. - dot(sc, sc), 0.));
  if (over < 0.) discard;
  vec3 toP = vWorld - cameraPosition; float dEye = length(toP); vec3 V = toP / max(dEye, 1e-3);
  vec3 N = -normalize(vec3(vWorld.x, 0., vWorld.z) + vec3(1e-4, 0., 0.));
  float y = vWorld.y, arc = atan(vWorld.z, vWorld.x) * ${f1(SHAFT)}, depth = ${f1(TOP)} - y;
  float skyK = exp(-max(depth, 0.) / 15.), warmK = exp(-over / 11.);
  vec3 sh = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-4, 0., 0.));
  float chord = ${f1(2 * SHAFT)} * max(dot(N, sh), 0.);
  float lit = 1. - smoothstep(-1.5, 1.5, depth - chord * uSunDir.y / max(length(uSunDir.xz), 1e-3));
  // the stair's lamps: one over every twelfth step of the 132 (uStair: the landing's angle, the winding, the top
  // step's height, the landing's), each a pool of warm light on the wall round it
  float fs = (uStair.z - y) / max(uStair.z - uStair.w, 1.) * 132., k0 = clamp(floor((fs - 6.) / 12. + .5), 0., 10.), lampK = 0.;
  for (int i = -1; i <= 1; i++) {
    float fk = (6. + 12. * clamp(k0 + float(i), 0., 10.)) / 132., ak = uStair.x + uStair.y * (1. - fk), yk = mix(uStair.z, uStair.w, fk) + 2.;
    float da = mod(atan(vWorld.z, uHandS * vWorld.x) - ak + 3.14159265, 6.2831853) - 3.14159265;
    lampK += exp(-(da * da * ${f1(SHAFT * SHAFT)} + (y - yk) * (y - yk)) / 12.);
  }
  vec3 light = uSunCol * max(dot(N, uSunDir), 0.) * lit + uSkyCol * (.2 + .8 * skyK) + uWarm * (warmK * .8 + lampK * 1.1);
  float yy = y + (vnoise(vec2(arc * .05, y * .1)) - .5) * 3. + dot(vWorld.xz, uLie.xy) * 6. + 2.5 * sin(arc * .04 + uLie.z);
  vec3 col;
  if (yy < ${f1(ADAM)}) {
    float cell = arc / 5.5, fid = floor(cell), ff = fract(cell);
    vec3 T = vec3(-N.z, 0., N.x);
    vec3 Nf = normalize(N + T * (hash11(fid * 1.7) - .5) * .6 + vec3(0., (hash11(fid * 3.3) - .5) * .3, 0.));
    vec3 Rr = reflect(V, Nf);
    vec3 env = Rr.y > 0. ? uSkyCol * 1.6 * smoothstep(.2, .9, Rr.y) * skyK : uWarm * 1.5 * smoothstep(.0, .8, -Rr.y) * (.35 + .65 * warmK);
    float ndv = clamp(dot(-V, Nf), 0., 1.);
    // the lamps below, mirrored again and again in the facets: small flames, each in a cell of its own, sliding as the eye moves
    vec2 gc = vec2(arc * .55 + Rr.x * 2., y * .55 + Rr.y * 2.), gi = floor(gc), gf = fract(gc) - .5;
    vec2 go = (vec2(hash11(gi.x * 7.3 + gi.y * 13.1), hash11(gi.x * 3.7 + gi.y * 5.9)) - .5) * .6;
    float glint = exp(-dot(gf - go, gf - go) * mix(45., 150., hash11(gi.x * 5.1 + gi.y * 2.3))) * step(.64, hash11(gi.x * 1.9 + gi.y * 9.7)) * 2.6;
    col = uAdam * (light * 1.5 + .35) + env * (.25 + .6 * pow(clamp(1. - ndv, 0., 1.), 2.)) + uWarm * (glint * warmK + lampK * .22);
    col *= 1. - .5 * (1. - smoothstep(0., .05, min(ff, 1. - ff)));
  } else {
    float b = (yy - ${f1(ADAM)}) / ${f1((TOP - 5 - ADAM) / 4)}, bi = floor(b);
    vec3 ore = bi < 1. ? vec3(.5, .13, .09) : bi < 2. ? vec3(.68, .42, .1) : bi < 3. ? vec3(.24, .29, .36) : bi < 4. ? vec3(.86, .83, .74) : vec3(.2, .13, .08);
    float pxw = length(fwidth(vWorld));
    ore = rock(ore, arc, yy, pxw) * strata(arc, yy, pxw);
    ore = mix(ore, vec3(.1, .32, .08), smoothstep(${f1(TOP - 1.6)}, ${f1(TOP - .8)}, y));
    col = ore * light;
  }
  gl_FragColor = vec4(col, 1.);
}`;
// a shadow laid on the lawn: darkens and blues what is under it
const SHADE_VERT = /* glsl */`
attribute float aK; varying float vK;
void main(){ vK = aK; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`;
const SHADE_FRAG = /* glsl */`
uniform vec3 uShadeCol; varying float vK;
void main(){ gl_FragColor = vec4(mix(vec3(1.), uShadeCol, clamp(vK, 0., 1.)), 1.); }`;

// the island's shadow and the clouds' shadows laid on the sea (multiplied in): only over the water, soft at the shore
const SEASHADE_FRAG = /* glsl */`
${GLSL_NOISE}
${SHARED}
${CLOUDSHADE}
uniform vec3 uShadeCol;
varying vec3 vWorld, vN;
void main(){
  float k = 1. - isleSun(vec3(vWorld.x, 0., vWorld.z)) * cloudSun(vWorld.xz);
  float sea = smoothstep(-1., 7., uHand * vWorld.x - shoreX(vWorld.z));
  // (it fails with distance as the haze takes the sea)
  k *= exp(-length(vWorld - cameraPosition) * uFogK * 2.);
  gl_FragColor = vec4(mix(vec3(1.), uShadeCol, k * sea), 1.);
}`;

export default {
  id: 'island-that-shades-the-fields',
  name: 'The Island That Shades the Fields',
  category: 'books',
  placeKind: 'sky',
  book: "Gulliver's Travels",
  author: 'Jonathan Swift, 1667 to 1745',
  media: ['air', 'open'],
  weirdness: 0.7,
  async build(ctx) {
    // every stream of draws this world uses, made here, once, from the world's seed and a name of its own
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('island/' + name + ':' + ctx.seed));
    const S = {};
    for (const n of ['vary', 'ore', 'sky', 'clouds', 'ocean', 'bays', 'stairs', 'galleryfolk', 'walkers', 'anglers', 'petitions', 'figures', 'palace', 'houses', 'topiary', 'bowltrees', 'townfolk', 'townwalk', 'wellfolk', 'stones', 'rivulets', 'kites', 'boats', 'anchorage', 'scatter', 'village', 'trees', 'gulls', 'gulls2', 'gulls3', 'gulls4', 'drops', 'fall', 'pennants']) S[n] = stream(n);
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // the visit's density (0.7 to 1.3) scales houses, figures, birds, lines, kites and boats between 0.75 and 1.1 of the full count
    const dens = lerp(0.75, 1.1, clamp(((vary.density ?? 1) - 0.7) / 0.6, 0, 1)) * (detail < 1 ? 0.8 : 1);
    const rare = !!vary.rare;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------ what this visit is like: one stream, one plain order of draws
    const rv = S.vary;
    // which way round: the whole place is mirrored in x
    const hand = rv.chance(0.5) ? 1 : -1;
    // the hour, where the visit does not name one: of eight visits five come by day (the island's shadow on the fields
    // with a plain edge is the place's subject, and the mirror is sharpest under a high sun), two under a low sun (the
    // shadow drawn long over the village, lit windows in it, the island's edge against the sun), one at night (the
    // lamps of the galleries and the cave's light up the well; no shadow to see, so the rarest)
    const hourDraw = rv();
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'golden' || vary.hour === 'dawn' ? 'golden' : vary.hour === 'day' ? 'day' : hourDraw < 5 / 8 ? 'day' : hourDraw < 7 / 8 ? 'golden' : 'night';
    // how deep the pass under the plate goes (26 to 34 m in from the edge: 30 m, the part's rule, times this draw)
    const deepK = rv.range(0.86, 1.14);
    // where the sun stands round the island (0 = out to sea, abeam the shore; 90 = along the shore, ahead of the entry):
    // ahead and to seaward, so that the island's shadow falls back along the coast onto the surf, the village and the
    // fields before the entry, and the island's edge stands against the sun as we come in under it
    const sunAng = (60 + rv.range(-8, 8)) * Math.PI / 180;
    const shore = [40 + rv.range(-6, 6), rv.range(22, 34), rv.range(0, TAU), rv.range(0, TAU)];
    const cloudCover = rv.range(0.3, 0.48), cloudSeed = rv.int(1, 99);
    const basinTurn = rv.range(-0.12, 0.12), mood = vary.mood ?? rv();
    // the lie of the rock's beds (a stream of its own): which way they dip, how steeply (1 to 2 m in 100), their roll's phase
    const lieA = S.ore.range(0, TAU), lieK = S.ore.range(0.01, 0.02), lieU = { value: new THREE.Vector3(lieK * Math.cos(lieA), lieK * Math.sin(lieA), S.ore.range(0, TAU)) };
    const night = hour === 'night' ? 1 : 0, golden = hour === 'golden';
    // canonical (x, z) to the world's: a visit's hand mirrors x
    const wx = (x) => hand * x;
    const pol = (r, a) => [hand * r * Math.cos(a), r * Math.sin(a)];

    // ------------------------------------------------------------ sky and light (no scene lights: every surface has its own shader)
    const el = (night ? 34 : golden ? 15 : SUN_EL) * Math.PI / 180;
    const sunV = new THREE.Vector3(hand * Math.cos(sunAng) * Math.cos(el), Math.sin(el), Math.sin(sunAng) * Math.cos(el)).normalize();
    const az = Math.atan2(sunV.x, -sunV.z) * 180 / Math.PI, elD = el * 180 / Math.PI;
    const skyOpts = night
      ? { preset: 'night', bodyOverrides: { 0: { elevation: elD, azimuth: az, size: 2.6 } }, key: 0, bake: true, renderer: ctx.renderer, clouds: { coverage: cloudCover * 0.7, seed: cloudSeed } }
      : golden
        ? { preset: 'goldenHour', sunElevation: elD, sunAzimuth: az, clouds: { coverage: cloudCover, seed: cloudSeed } }
        : { preset: 'day', zenith: '#3f86d8', horizon: '#bfe2ff', sunElevation: elD, sunAzimuth: az, clouds: { coverage: cloudCover, seed: cloudSeed, lit: '#ffffff', shade: '#8ea2c4' } };
    const sky = makeSky({ rng: S.sky, ...skyOpts });
    await ctx.yield();
    scene.add(sky.object);
    const sunDir = sky.lightDirection.clone().normalize();
    const fogCol = sky.horizonColor.clone().lerp(sky.zenithColor, 0.25);
    scene.fog = new THREE.FogExp2(fogCol, 0.00032);
    const v3 = (r, g, b) => new THREE.Vector3(r, g, b);
    const LIGHT = night
      ? { sun: v3(0.1, 0.14, 0.25), sky: v3(0.028, 0.04, 0.085), ground: v3(0.012, 0.018, 0.03), lamp: v3(1.0, 0.62, 0.24) }
      : golden
        ? { sun: v3(1.3, 0.74, 0.36), sky: v3(0.3, 0.33, 0.52), ground: v3(0.22, 0.15, 0.11), lamp: v3(1.0, 0.62, 0.24) }
        : { sun: v3(1.02, 0.96, 0.84), sky: v3(0.3, 0.4, 0.62), ground: v3(0.17, 0.17, 0.13), lamp: v3(1.0, 0.62, 0.24) };
    const cv = (c) => v3(c.r, c.g, c.b);
    const skyHi = cv(sky.zenithColor), skyLo = cv(sky.horizonColor);
    const seaCol = golden ? v3(0.3, 0.22, 0.16) : night ? v3(0.02, 0.05, 0.1) : cv(new THREE.Color('#2a7fb8')).multiplyScalar(0.8);
    const seaDeep = golden ? v3(0.1, 0.08, 0.09) : night ? v3(0.006, 0.014, 0.035) : v3(0.02, 0.12, 0.26);
    // the uniforms every shader of the place shares (one object each, so one write reaches all)
    const SH = {
      uSunDir: { value: sunDir }, uSunCol: { value: LIGHT.sun }, uSkyCol: { value: LIGHT.sky }, uGroundCol: { value: LIGHT.ground },
      uFogCol: { value: cv(fogCol) }, uFogK: { value: 0.0003 }, uTime: { value: 0 }, uNight: { value: night },
      uShore: { value: new THREE.Vector4(shore[0], shore[1], shore[2], shore[3]) }, uHand: { value: hand },
    };
    const EX = {
      uSkyHi: { value: skyHi }, uSkyLo: { value: skyLo }, uSeaCol: { value: seaCol }, uSeaDeep: { value: seaDeep },
      uSeaShallow: { value: golden ? v3(0.42, 0.34, 0.22) : night ? v3(0.03, 0.08, 0.12) : v3(0.2, 0.62, 0.62) },
      uAdam: { value: cv(new THREE.Color('#0c1a2e')).multiplyScalar(1.6) }, uLampCol: { value: LIGHT.lamp },
    };
    // the shore in canonical x (land where x < shoreX(z))
    const shoreX = (z) => shore[0] + shore[1] * Math.sin(z / 170 + shore[2]) + 12 * Math.sin(z / 61 + shore[3]);
    await ctx.yield();

    // ------------------------------------------------------------ THE ROUTE (the part lays it by geometry: makeFlight)
    // (the rules, with the reason of every number, are in shots/island-that-shades-the-fields/r2-progress.txt)
    const FL = makeFlight({ hand, deepK }), RT = FL.route, path = FL.path, routeLen = FL.L, M = FL.M;
    await ctx.yield();
    // (asked of the renderer here, in a stretch that does little else: the question waits on the graphics process)
    const ANISO = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy());
    // the route in steps of 2.5 m (for every clearance test)
    const route = FL.line, nR = route.length - 1;
    // the bowl's line (canonical): its heading, its left normal, where it crosses the well's kerb; the climb's circle
    const hd = RT.dir, nl = RT.nl, KERB = RT.K, Rc = RT.Rc;
    // a canonical point of the bowl's line, s metres before the kerb and lat metres to its left
    const bowlAt = (s, lat = 0) => [KERB[0] - hd[0] * s + nl[0] * lat, KERB[1] - hd[1] * s + nl[1] * lat];
    const bowlLen = RT.H.kerb - RT.H.bowl;
    // distance from a point to the route's line (3D), on the 2.5 m steps
    const lineDist = (x, y, z) => { let best = 1e9; for (let i = 0; i <= nR; i++) { const q = route[i], d = (q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2; if (d < best) best = d; } return Math.sqrt(best); };
    await ctx.yield();

    // ------------------------------------------------------------ the island's body: underside, rim, bowl, shaft
    const shaderMat = (vert, frag, extra, opts = {}) => new THREE.ShaderMaterial({ uniforms: { ...SH, ...extra }, vertexShader: vert, fragmentShader: frag, ...opts });
    const boatsU = { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, 0, 0, 0)) };
    // the map of the land's things for the mirror (drawn on a canvas once the village and the trees are placed):
    // canonical x from -1220 to 200, z from -780 to 640
    const MAPBOX = [-1220, -780, 1420, 1420], landMapU = { value: null };
    const mirrorMat = shaderMat(MIRROR_VERT, MIRROR_FRAG, { uSeaCol: EX.uSeaCol, uSeaDeep: EX.uSeaDeep, uSeaShallow: EX.uSeaShallow, uSkyHi: EX.uSkyHi, uSkyLo: EX.uSkyLo, uAdam: EX.uAdam, uBoats: boatsU, uLandMap: landMapU, uMapBox: { value: new THREE.Vector4(MAPBOX[0], MAPBOX[1], MAPBOX[2], MAPBOX[3]) } }, { side: THREE.DoubleSide });
    const mirror = new THREE.Mesh(new THREE.CircleGeometry(R, 120).rotateX(Math.PI / 2), mirrorMat);
    mirror.position.y = Y0;
    scene.add(mirror);
    const rimMat = shaderMat(WORLD_VERT, RIM_FRAG, { uAdam: EX.uAdam, uSeaCol: EX.uSeaCol, uSkyHi: EX.uSkyHi, uSkyLo: EX.uSkyLo, uTiers: { value: TIERS.slice() }, uLie: lieU });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R, R, RIM - Y0, 180, 1, true), rimMat);
    rim.position.y = (RIM + Y0) / 2;
    scene.add(rim);
    // the four basins: the first lies beside the middle of the bowl's street (half-way between the line's beginning and
    // the palace's forecourt), its edge 12 m from the line (the street's paving and the basin's walk between); the
    // others stand a quarter turn on each (a little off, by the visit's draw)
    const BASIN_R = 22;
    const b0 = bowlAt((bowlLen + COURT) / 2, -(BASIN_R + 12));
    const basins = [];
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + (k ? basinTurn * (k === 2 ? -1 : 1) : 0), ca = Math.cos(a), sa = Math.sin(a);
      const x = b0[0] * ca - b0[1] * sa, z = b0[0] * sa + b0[1] * ca;
      basins.push({ x: wx(x), z, r: BASIN_R, level: lawnY(Math.hypot(x, z)) - 1.2 });
    }
    // the lawn's height (world x, z): the bowl, a slow roll, level round each basin and hollowed inside it
    const lawnH = (x, z) => {
      const r = Math.hypot(x, z);
      let y = lawnY(r) + 1.1 * ctx.noise.fbm2(x * 0.012, z * 0.012, 3) * smoothstep(SHAFT + 4, SHAFT + 30, r) * (1 - smoothstep(R - 30, R - 6, r));
      for (const b of basins) {
        const d = Math.hypot(x - b.x, z - b.z);
        if (d < b.r + 14) { y = lerp(b.level, y, smoothstep(b.r + 2, b.r + 14, d)); y -= 2.6 * (1 - smoothstep(b.r - 5, b.r, d)); }
      }
      return y;
    };
    {
      const nRg = 44, nSg = 132, pos = [], idx = [];
      for (let i = 0; i <= nRg; i++) {
        const r = lerp(SHAFT, R, Math.pow(i / nRg, 0.9));
        for (let j = 0; j <= nSg; j++) { const a = j / nSg * TAU, x = r * Math.cos(a), z = r * Math.sin(a); pos.push(x, i === 0 ? TOP : i === nRg ? RIM : lawnH(x, z), z); }
        if (i % 11 === 10) await ctx.yield();
      }
      for (let i = 0; i < nRg; i++) for (let j = 0; j < nSg; j++) { const a = i * (nSg + 1) + j, b = a + nSg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      // the street's middle line: ten places of the route's plan from the rim's gate to the well's kerb
      const streetPts = []; for (let i = 0; i < 10; i++) { const q = route[Math.round(lerp(M.rim - 4, M.kerb, i / 9) / 2.5)]; streetPts.push(new THREE.Vector2(q.x, q.z)); }
      const lawnMat = shaderMat(WORLD_VERT, LAWN_FRAG, { uBasins: { value: basins.map((b) => new THREE.Vector4(b.x, b.z, b.r, b.level)) }, uStreet: { value: streetPts }, uStreetDir: { value: new THREE.Vector2(wx(hd[0]), hd[1]) } });
      scene.add(new THREE.Mesh(g, lawnMat));
    }
    // the well's wall goes down to the cave's floor; where it lies under the dome's surface it is not drawn (the well
    // comes down through the dome's flank, and the dome is not drawn inside the well)
    const stoneXZ = new THREE.Vector2(wx(RT.stone[0]), RT.stone[1]);
    const shaftMat = shaderMat(WORLD_VERT, SHAFT_FRAG, { uAdam: EX.uAdam, uWarm: { value: v3(1.0, 0.66, 0.3) }, uStone: { value: stoneXZ }, uLie: lieU, uStair: { value: new THREE.Vector4() }, uHandS: { value: hand } }, { side: THREE.BackSide });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(SHAFT, SHAFT, TOP - FLOOR, 96, 1, true), shaftMat);
    shaft.position.y = (TOP + FLOOR) / 2;
    scene.add(shaft);
    await ctx.yield();

    // ------------------------------------------------------------ the sea (kit) and the land below
    const seaDepth = (x, z) => clamp((hand * x - shoreX(z)) * 0.09, -3, 30);
    const ocean = Water.makeOcean({ rng: S.ocean, light: sky, preset: 'breeze', radius: 3600, depthAt: seaDepth, depthRect: [-1300, -1300, 1300, 1300], depthRes: 128,
      deep: night ? '#04182c' : golden ? '#3a2c2a' : '#0b4f86', shallowColor: golden ? '#c89a5a' : '#49cfc0' });
    scene.add(ocean.object);
    await ctx.yield();
    const landH = (xc, z) => {
      const di = shoreX(z) - xc;
      if (di < 0) return Math.max(di * 0.09, -8);
      const n = ctx.noise.fbm2(xc * 0.004, z * 0.004, 3);
      return 1.6 * smoothstep(0, 22, di) + smoothstep(20, 320, di) * (7 + 14 * n) + smoothstep(320, 1500, di) * (30 + 70 * (0.5 + 0.5 * n));
    };
    {
      const offs = [-40, -15, -4, 0, 4, 9, 15, 22, 32, 46, 64, 90, 125, 175, 250, 350, 500, 700, 1000, 1500, 2300, 3300], zs = [];
      for (let z = 0; z < 3400; z += Math.abs(z) < 500 ? 16 : 16 + (Math.abs(z) - 500) * 0.14) { zs.push(z); if (z > 0) zs.unshift(-z); }
      const pos = [], idx = [], nO = offs.length;
      for (const z of zs) for (const o of offs) { const xc = shoreX(z) - o; pos.push(wx(xc), landH(xc, z), z); }
      for (let i = 0; i < zs.length - 1; i++) for (let j = 0; j < nO - 1; j++) {
        const a = i * nO + j, b = a + nO;
        if (hand > 0) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, shaderMat(WORLD_VERT, LAND_FRAG, {}, { side: THREE.DoubleSide })));
    }
    await ctx.yield();

    // ------------------------------------------------------------ built things share one material (and one for instanced bays)
    const solidU = { uSkyHi: EX.uSkyHi, uSkyLo: EX.uSkyLo, uLampCol: EX.uLampCol };
    const solidMat = shaderMat(SOLID_VERT, SOLID_FRAG, solidU, { vertexColors: true, side: THREE.DoubleSide });
    const C = {
      stone: mulc(lin('#f1ead6'), 0.84), chalk: mulc(lin('#efe9dc'), 0.8), slate: lin('#5d6b78'), ochre: lin('#d6a54a'), ore: lin('#b5483a'), copper: lin('#c9773a'),
      turf: lin('#4f9a4a'), wood: lin('#4a3524'), dark: [0.03, 0.035, 0.05], lamp: [1.0, 0.62, 0.22], sail: lin('#d8c8a0'),
      robes: ['#27408b', '#7a2633', '#1f5f5a', '#5a3a7a', '#c9a23a', '#e8e2d0'].map(lin),
      cloth: ['#b5483a', '#d6a54a', '#3d6a9a', '#efe9dc'].map(lin),
    };

    // ------------------------------------------------------------ the galleries: five tiers of bays round the whole rim (72 bays to a
    // tier, each 5 degrees of the island: 19 m), four kinds of bay dealt by draw with a shade of its own, lamps and doors
    // a four-cornered sheet of cloth: corners counter-clockwise, each with how far it flaps (0 held, 0.9 free)
    // the yaw that turns local +z to the canonical direction (dx, dz)
    const yawTo = (dx, dz) => Math.atan2(hand * dx, dz), yawToC = yawTo;
    const cloth = (G, p, w, n, c) => { for (const i of [0, 1, 2, 0, 2, 3]) { G.kind(6 + w[i]); G.v(p[i], n, c); } };
    // (each kind is built twice, so there are eight bays; a bay also names the places where people may stand in it:
    // [x, z, pose, which way he faces (0 out to sea, 1 along the gallery, 2 in to the cliff)])
    const bayGeo = (kind, rng) => {
      const G = makeGeo(), hw = 9.75, zf = GAL_W, spots = [];
      G.kind(0).col(C.stone, 0.92);
      G.box(-hw, -0.8, -0.5, hw, 0, zf, mulc(C.stone, 1.0));
      for (const sx of [-7, 0, 7]) G.hexa([[sx - 0.45, -4, 0.5], [sx + 0.45, -4, 0.5], [sx + 0.45, -4, -0.2], [sx - 0.45, -4, -0.2], [sx - 0.45, -0.8, zf - 0.7], [sx + 0.45, -0.8, zf - 0.7], [sx + 0.45, -0.8, -0.2], [sx - 0.45, -0.8, -0.2]], C.stone, mulc(C.stone, 0.8), true);
      G.col(C.stone, 1);
      for (let x = -9; x <= 9.01; x += 2.25) G.box(x - 0.13, 0, zf - 0.38, x + 0.13, 1.05, zf - 0.12);
      G.box(-hw, 1.05, zf - 0.45, hw, 1.22, zf - 0.05); G.box(-hw, 0.45, zf - 0.32, hw, 0.56, zf - 0.18);
      if (kind < 0) return { geo: G.build(), spots };
      const doors = kind === 2 ? [-6, 0, 6] : [rng.range(-7, -3), rng.range(3, 7)];
      for (const x of doors) {
        const w = rng.range(0.9, 1.3), h = rng.range(2.6, 3.3);
        G.kind(0).col(C.chalk, 1); G.box(x - w - 0.3, 0, -0.3, x + w + 0.3, h + 0.4, 0.22);
        G.kind(5).col(C.dark, 1); G.quad([x - w, 0.02, 0.24], [x + w, 0.02, 0.24], [x + w, h, 0.24], [x - w, h, 0.24]);
        G.kind(2).col(C.lamp, 1); G.box(x + w + 0.5, h - 0.3, 0.2, x + w + 0.8, h + 0.15, 0.5);
      }
      if (kind === 1) {
        // an awning of striped cloth on two poles
        const x0 = rng.range(-8, -2), x1 = x0 + rng.range(6, 9), ca = rng.pick(C.cloth), cb = rng.pick(C.cloth), n = 8;
        for (let i = 0; i < n; i++) { const a = lerp(x0, x1, i / n), b = lerp(x0, x1, (i + 1) / n), wa = 0.5 * Math.sin(Math.PI * i / n), wb = 0.5 * Math.sin(Math.PI * (i + 1) / n); cloth(G, [[a, 2.5, 3.9], [b, 2.5, 3.9], [b, 3.6, 0.15], [a, 3.6, 0.15]], [wa, wb, 0, 0], [0, 0.96, 0.27], mulc(i % 2 ? ca : cb, 0.9)); }
        G.kind(0).col(C.wood, 1); G.bar([x0, 0, 3.8], [x0, 2.5, 3.8], 0.07, 0.07, 4); G.bar([x1, 0, 3.8], [x1, 2.5, 3.8], 0.07, 0.07, 4);
        // a trestle table under it, and people at it
        const xt = (x0 + x1) / 2;
        G.col(C.wood, 1.3); G.box(xt - 1.3, 0.78, 1.0, xt + 1.3, 0.86, 1.9); G.bar([xt - 1.1, 0, 1.45], [xt - 1.1, 0.78, 1.45], 0.05, 0.05, 4); G.bar([xt + 1.1, 0, 1.45], [xt + 1.1, 0.78, 1.45], 0.05, 0.05, 4);
        spots.push([xt - 0.6, 2.25, 0, 2], [xt + 0.7, 0.62, 0, 0], [x1 + 1.2, zf - 0.75, 3, 0]);
      } else if (kind === 0) {
        // a pole at the rail with a long pennant
        const x = rng.range(-8, 4), c = rng.pick(C.cloth), len = rng.range(3.2, 4.6), n = 5;
        G.kind(0).col(C.wood, 1.6); G.bar([x, 0, zf - 0.3], [x, 5.2, zf - 0.3], 0.07, 0.05, 4);
        // washing hung over the rail to dry, on the far half of the bay
        let xw = x + 5 + rng.range(0, 1);
        for (let k = 0; k < 5 && xw < hw - 1.5; k++) {
          const w = rng.range(0.7, 1.4), drop = rng.range(0.6, 1.3), cw = mulc(rng.pick(C.cloth), rng.range(0.8, 1.15));
          cloth(G, [[xw, 1.24 - drop, zf + 0.06], [xw + w, 1.24 - drop, zf + 0.06], [xw + w, 1.24, zf + 0.02], [xw, 1.24, zf + 0.02]], [0.5, 0.5, 0, 0], [0, 0, 1], cw);
          xw += w + rng.range(0.15, 0.6);
        }
        spots.push([x + 1.5, zf - 0.75, 3, 0], [x - 2.5, 1.2, 0, 1]);
        for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n; cloth(G, [[x + a * len, 5.1 - a * 0.25, zf - 0.3], [x + a * len, 4.2 + a * 0.25, zf - 0.3], [x + b * len, 4.2 + b * 0.25, zf - 0.3], [x + b * len, 5.1 - b * 0.25, zf - 0.3]], [a * 0.9, a * 0.9, b * 0.9, b * 0.9], [0, 0, 1], c); }
      } else if (kind === 2) {
        // an arcade: columns to a roof slab
        G.kind(0).col(C.chalk, 1);
        for (let x = -9; x <= 9.01; x += 4.5) G.bar([x, 0, zf - 0.7], [x, 4.3, zf - 0.7], 0.3, 0.24, 6);
        G.box(-hw, 4.3, -0.4, hw, 4.75, zf - 0.1, mulc(C.slate, 0.9));
        // a lamp hung in every other arch
        for (let x = -6.75; x <= 7; x += 9) { G.kind(1).col(C.copper, 1); G.bar([x, 4.3, zf - 0.7], [x, 3.5, zf - 0.7], 0.03, 0.03, 4); G.kind(2).col(C.lamp, 1); G.ball([x, 3.3, zf - 0.7], 0.22, 6); }
        spots.push([rng.range(-8, -5), zf - 0.75, 3, 0], [rng.range(-1, 1), 1.0, 0, 1], [rng.range(4, 8), 0.7, 0, 0]);
      } else if (kind === 3) {
        // a copper telescope on a post at the rail, turned to the sea and the sky, and an astronomer's place behind it
        const x = rng.range(-6, 6), el2 = rng.range(0.15, 0.6), zt = zf - 0.25;
        G.kind(0).col(C.wood, 1); G.bar([x, 0, zt], [x, 1.55, zt], 0.09, 0.07, 5);
        G.kind(1).col(C.copper, 1); G.bar([x, 1.6 - 1.0 * Math.sin(el2), zt - 1.0 * Math.cos(el2)], [x, 1.6 + 2.2 * Math.sin(el2), zt + 2.2 * Math.cos(el2)], 0.11, 0.2, 8, true);
        // a quadrant on a stand beside it: a quarter circle of brass with its plumb line
        const xq = x + rng.range(2.2, 3.4) * (rng.chance(0.5) ? 1 : -1);
        G.kind(0).col(C.wood, 1); G.bar([xq, 0, zt - 0.5], [xq, 1.2, zt - 0.5], 0.07, 0.06, 5);
        G.kind(1).col(C.ochre, 1);
        const qc = [xq, 2.1, zt - 0.5], qp = (k) => [xq, 2.1 - 0.9 * Math.cos(k * Math.PI / 8), zt - 0.5 + 0.9 * Math.sin(k * Math.PI / 8)];
        for (let k = 0; k < 4; k++) G.bar(qp(k), qp(k + 1), 0.035, 0.035, 4);
        G.bar(qc, qp(0), 0.03, 0.03, 4); G.bar(qc, qp(4), 0.03, 0.03, 4);
        spots.push([x, zt - 1.3, 1, 0], [xq - 0.2, zt - 1.25, 0, 0]);
      }
      // gulls' nests on a ledge under the slab (on some bays)
      if (rng.chance(0.6)) {
        const xn = rng.range(-8, 8), nN = rng.int(1, 3);
        G.kind(0).col(C.stone, 0.8); G.box(xn - 1.6, -2.3, -0.2, xn + 1.6, -2.05, 0.75);
        for (let k = 0; k < nN; k++) {
          const xb = xn - 1.1 + k * 1.1 + rng.range(-0.2, 0.2);
          G.col([0.3, 0.22, 0.13], 1); G.lathe(xb, 0.3, [[0.3, -2.05], [0.36, -1.9], [0.2, -1.92]], 6);
          G.col([0.92, 0.93, 0.95], 1); G.ball([xb, -1.78, 0.3], 0.17, 6, 0.8); G.ball([xb + 0.13, -1.66, 0.36], 0.08, 5);
        }
      }
      return { geo: G.build(), spots };
    };
    // where the galleries' people will stand (filled when the bays are dealt, built once the islander is defined)
    const bayFolk = [];
    {
      const NB = 72, B = S.bays, kinds = [];
      for (let kd = 0; kd < 4; kd++) for (let v = 0; v < 2; v++) { kinds.push({ ...bayGeo(kd, B), list: [] }); if (v) await ctx.yield(); }
      // a bay that no place of the route can see (the island's own round hides it from every point of the line outside
      // the rim, and from within the bowl the rim does) is its ledge and rail alone; two bays past the last one seen are
      // still built whole, for what stands out from the cliff
      const plain = { ...bayGeo(-1, B), list: [] }, seen = new Uint8Array(NB), Rg = R + GAL_W;
      for (let j = 0; j < NB; j++) {
        const a = (j + 0.5) / NB * TAU, nx = wx(Math.cos(a)), nz = Math.sin(a);
        for (let i = 0; i <= nR && !seen[j]; i++) { const p = route[i]; if (p.y < RIM + 30 && p.x * nx + p.z * nz > Rg + 1) seen[j] = 1; }
      }
      const whole = (j) => { for (let k = -2; k <= 2; k++) if (seen[(j + k + NB) % NB]) return true; return false; };
      kinds.push(plain);
      for (const yt of TIERS) for (let j = 0; j < NB; j++) {
        const kd = B.chance(0.4) ? 0 : B.int(1, 3), v = B.int(0, 1), a = (j + 0.5) / NB * TAU, bay = { a, yt, tint: B.range(0.88, 1.08), warm: B.range(-0.03, 0.03) };
        if (!whole(j)) { plain.list.push(bay); continue; }
        kinds[kd * 2 + v].list.push(bay);
        for (const sp of kinds[kd * 2 + v].spots) bayFolk.push({ a, yt, sp });
      }
      const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _c = new THREE.Color();
      for (const kn of kinds) {
        if (!kn.list.length) continue;
        const mesh = new THREE.InstancedMesh(kn.geo, solidMat, kn.list.length);
        kn.list.forEach((b, i) => {
          _m.compose(_p.set(wx(R * Math.cos(b.a)), b.yt, R * Math.sin(b.a)), _q.setFromEuler(_e.set(0, yawToC(Math.cos(b.a), Math.sin(b.a)), 0)), _s);
          mesh.setMatrixAt(i, _m); mesh.setColorAt(i, _c.setRGB(b.tint + b.warm, b.tint, b.tint - b.warm));
        });
        mesh.frustumCulled = false;
        scene.add(mesh);
        await ctx.yield();
      }
    }

    // ------------------------------------------------------------ threads (lines, strings) and their beads (fish, floats, kites): one mesh
    const TH = { pos: [], b: [], p: [], q: [], col: [], idx: [] };
    const thPush = (A, B, p, q, c) => { TH.pos.push(A[0], A[1], A[2]); TH.b.push(B[0], B[1], B[2]); TH.p.push(p[0], p[1], p[2], p[3]); TH.q.push(q[0], q[1], q[2], q[3]); TH.col.push(c[0], c[1], c[2]); };
    const addThread = (A, B, sway, width, phase, c, segs = 8) => {
      const base = TH.pos.length / 3;
      for (let i = 0; i <= segs; i++) for (const sd of [-1, 1]) thPush(A, B, [sd, i / segs, 0, phase], [sway, 0, width, 0], c);
      for (let i = 0; i < segs; i++) { const a = base + i * 2; TH.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    const addBead = (A, B, sway, phase, mode, speed, size, at, c) => {
      const base = TH.pos.length / 3;
      for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) thPush(A, B, [cx, cy, mode, phase], [sway, speed, size, at], c);
      TH.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    // ------------------------------------------------------------ stairs between the tiers, the anglers' rods and lines on the lowest
    // gallery (over the sea only), and the islanders as specks: a robe and a head, never nearer than 25 m to the line
    // (the accumulator is emptied into a mesh of its own after each group, so that no step of the build is long and
    // each group is culled by its own bounds)
    let GS = makeGeo();
    const flushGS = async () => {
      if (GS.triangles) { scene.add(new THREE.Mesh(GS.build(), solidMat)); GS = makeGeo(); }
      await ctx.yield();
    };
    // between the things of one group: a pause always, a mesh only once 9000 triangles have gathered (few meshes)
    const rest = async () => { if (GS.triangles > 9000) await flushGS(); else await ctx.yield(); };
    // an islander: a robe to the shoulders, a head that leans to one side (theirs all do), two arms in one of four
    // poses (0 at the sides, 1 holding a rod out, 2 one arm reaching up, 3 both hands on a rail). He faces local +z.
    // who() draws his numbers (before any test of the place where he is to stand); person() builds him from them.
    const who = (rng) => ({ h: rng.range(0.92, 1.08), c: rng.pick(C.robes), tone: rng.range(0.7, 1), tilt: rng.range(0.07, 0.14) * (rng.chance(0.5) ? 1 : -1), skin: rng.range(0.8, 1.1) });
    const person = (G, x, y, z, yaw, w, pose = 0) => {
      const { h, c, tone, tilt, skin } = w;
      G.tr(x, y, z, yaw, h);
      G.kind(0).col(c, tone);
      G.lathe(0, 0, [[0.36, 0], [0.3, 0.55], [0.2, 1.0], [0.25, 1.32], [0.1, 1.5]], 6);
      G.col([0.5, 0.36, 0.27], skin); G.ball([tilt, 1.66, 0.02], 0.15, 6);
      G.col(c, tone * 0.8);
      const sh = 1.36, arm = (sx, to) => G.bar([sx * 0.23, sh, 0], to, 0.065, 0.05, 4);
      if (pose === 1) { arm(-1, [-0.08, 1.18, 0.5]); arm(1, [0.08, 1.24, 0.42]); }
      else if (pose === 2) { arm(1, [0.34, 2.04, 0.14]); arm(-1, [-0.3, 0.9, 0.05]); }
      else if (pose === 3) { arm(-1, [-0.26, 1.1, 0.42]); arm(1, [0.26, 1.1, 0.42]); }
      else if (pose === 4) { arm(1, [0.3, 1.62, 0.5]); arm(-1, [-0.3, 0.85, 0.04]); }
      else if (pose === 5) { arm(-1, [-0.02, 1.56, 0.3]); arm(1, [0.42, 1.58, 0.2]); }
      else if (pose === 6) { arm(-1, [-0.34, 1.5, 0.34]); arm(1, [0.02, 1.36, 0.42]); }
      else if (pose === 7) { arm(-1, [-0.62, 1.42, 0]); arm(1, [0.62, 1.42, 0]); }
      else { arm(-1, [-0.3, 0.85, 0.04]); arm(1, [0.3, 0.85, 0.04]); }
      // what he carries (poses 4 to 6): 1 the flapper's bladder, blown up, hung from the end of a short stick; 2 a
      // fiddle and its bow; 3 a flute; 4 a quadrant held up to measure by; 5 a pair of compasses
      const prop = w.prop || 0;
      if (prop === 1) { G.col(C.wood, 1.5); G.bar([0.3, 1.6, 0.48], [0.3, 2.05, 1.0], 0.03, 0.03, 4); G.col([0.86, 0.8, 0.62], 1); G.ball([0.3, 1.86, 1.06], 0.19, 6, 1.15); }
      else if (prop === 2) { G.col([0.45, 0.2, 0.08], 1.2); G.box(-0.44, 1.46, 0.26, -0.18, 1.54, 0.5); G.bar([-0.36, 1.5, 0.48], [-0.52, 1.56, 0.86], 0.03, 0.025, 4); G.col(C.chalk, 1); G.bar([0.02, 1.36, 0.42], [-0.5, 1.62, 0.5], 0.012, 0.012, 3); }
      else if (prop === 3) { G.col(C.wood, 2); G.bar([-0.1, 1.6, 0.26], [0.6, 1.6, 0.2], 0.028, 0.028, 4); }
      else if (prop === 4) { G.kind(1).col(C.copper, 1.1); const cq = [0.3, 1.62, 0.52]; G.bar(cq, [0.3, 2.22, 0.52], 0.022, 0.022, 4); G.bar(cq, [0.9, 1.62, 0.52], 0.022, 0.022, 4); for (let k = 0; k < 4; k++) { const a0 = k / 4 * Math.PI / 2, a1 = (k + 1) / 4 * Math.PI / 2; G.bar([0.3 + 0.6 * Math.cos(a0), 1.62 + 0.6 * Math.sin(a0), 0.52], [0.3 + 0.6 * Math.cos(a1), 1.62 + 0.6 * Math.sin(a1), 0.52], 0.022, 0.022, 4); } }
      else if (prop === 5) { G.kind(1).col(C.copper, 1.1); G.bar([0.3, 1.62, 0.5], [0.12, 1.02, 0.62], 0.02, 0.012, 4); G.bar([0.3, 1.62, 0.5], [0.5, 1.02, 0.62], 0.02, 0.012, 4); }
      // a gentleman of the island: a cap, and on his robe the figures they wear (suns, moons and stars, fiddles and
      // harps, here gilded three- and four-cornered patches)
      if (w.rich) {
        G.kind(0).col(c, tone * 0.6); G.lathe(tilt, 0.02, [[0.19, 1.74], [0.17, 1.86], [0.02, 1.9]], 6);
        G.kind(1).col(C.ochre, 1.25);
        for (let k = 0; k < 5; k++) { const a = w.rich + k * 1.26, rr = 0.345 - 0.06 * (k % 2), y = 0.3 + 0.36 * (k % 2) + 0.05 * k, ca = Math.cos(a), sa = Math.sin(a), e = 0.09; if (k % 2) G.tri([rr * ca - e * sa, y, rr * sa + e * ca], [rr * ca + e * sa, y, rr * sa - e * ca], [rr * ca, y + 2 * e, rr * sa]); else G.quad([rr * ca - e * sa, y, rr * sa + e * ca], [rr * ca, y - e, rr * sa], [rr * ca + e * sa, y, rr * sa - e * ca], [rr * ca, y + e, rr * sa]); }
      }
      G.pop();
    };
    const stairs = [];
    {
      const B = S.stairs;
      for (let k = 0; k < TIERS.length - 1; k++) {
        const y0 = TIERS[k], rise = TIERS[k + 1] - y0, nSt = 40, da = 0.75 / R, off = B.range(0, TAU);
        for (let s = 0; s < 8; s++) {
          const aS = off + s / 8 * TAU + B.range(-0.1, 0.1), dir = s % 2 ? 1 : -1;
          stairs.push({ aS, dir, y0, rise, sweep: da * nSt });
          for (let i = 0; i < nSt; i++) {
            const a = aS + dir * da * i, y = y0 + rise * (i + 1) / nSt;
            GS.tr(R * Math.cos(a), y, R * Math.sin(a), Math.PI / 2 - a);
            GS.kind(0).col(C.stone, i % 2 ? 0.86 : 0.98); GS.box(-0.42, -1.3, 0.2, 0.42, 0, 2.5);
            if (i % 4 === 0) { GS.col(C.stone, 1); GS.box(-0.08, 0, 2.3, 0.08, 1.0, 2.5); }
            GS.pop();
          }
          if (s % 3 === 2) await ctx.yield();
        }
        await flushGS();
      }
    }
    // THE GALLERIES' PEOPLE. Standing: at about half of the bays' places (at the tables, the rails, the telescopes and
    // quadrants), each his own. Walking: along every gallery, both ways, in two lanes clear of the stairs and of those
    // who stand at the rail (2.8 and 3.15 m out from the cliff), and up and down every stair; they go on the clock,
    // round and round, so any moment shows them somewhere.
    const folk = [];
    let folkMesh = null;
    {
      const Gf = S.galleryfolk;
      let n = 0;
      for (const q of bayFolk) {
        const keep = Gf.chance(0.5), me = who(Gf), turn = Gf.chance(0.5) ? 1 : -1;
        if (!keep) continue;
        const ca = Math.cos(q.a), sa = Math.sin(q.a), r = R + q.sp[1], xc = r * ca + q.sp[0] * sa * hand, zc = r * sa - q.sp[0] * ca * hand;
        const face = q.sp[3] === 0 ? [ca, sa] : q.sp[3] === 2 ? [-ca, -sa] : [-sa * turn, ca * turn];
        if (lineDist(wx(xc), q.yt + 1, zc) > 2.5) person(GS, wx(xc), q.yt, zc, yawTo(face[0], face[1]), me, q.sp[2]);
        if (++n % 30 === 0) await flushGS();
      }
      await flushGS();
      const Wk = S.walkers, nW = Math.round(30 * dens);
      for (const yt of TIERS) for (let i = 0; i < nW; i++) {
        const dir = Wk.chance(0.5) ? 1 : -1;
        folk.push({ y: yt, r: R + (dir > 0 ? 2.8 : 3.15), a0: Wk.range(0, TAU), w: dir * Wk.range(1.0, 1.5) / R, ph: Wk.range(0, TAU), h: Wk.range(0.92, 1.08), c: Wk.pick(C.robes), tone: Wk.range(0.7, 1) });
      }
      for (const st of stairs) for (let i = 0; i < 2; i++) {
        folk.push({ stair: st, v: Wk.range(0.018, 0.03), ph: Wk.range(0, 1), h: Wk.range(0.92, 1.08), c: Wk.pick(C.robes), tone: Wk.range(0.7, 1) });
      }
      const Gw = makeGeo();
      person(Gw, 0, 0, 0, 0, { h: 1, c: [1, 1, 1], tone: 1, tilt: 0.1, skin: 1.6 });
      folkMesh = new THREE.InstancedMesh(Gw.build(), solidMat, folk.length);
      const _c = new THREE.Color();
      folk.forEach((q, i) => folkMesh.setColorAt(i, _c.setRGB(q.c[0] * q.tone, q.c[1] * q.tone, q.c[2] * q.tone)));
      folkMesh.frustumCulled = false;
      scene.add(folkMesh);
      await ctx.yield();
    }
    const _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fp = new THREE.Vector3(), _fs = new THREE.Vector3(), _fe = new THREE.Euler();
    const moveFolk = (time) => {
      for (let i = 0; i < folk.length; i++) {
        const q = folk[i];
        let a, y, r, fwd;
        if (q.stair) {
          // up one stair and down again: s goes 0 to 1 and back
          const t = (time * q.v + q.ph) % 1, s = t < 0.5 ? t * 2 : 2 - t * 2, st = q.stair;
          a = st.aS + st.dir * st.sweep * s; y = st.y0 + st.rise * s; r = R + 1.35; fwd = st.dir * (t < 0.5 ? 1 : -1);
        } else { a = q.a0 + q.w * time; y = q.y; r = q.r; fwd = Math.sign(q.w); }
        y += 0.035 * Math.abs(Math.sin(time * 5.2 + i * 1.7));
        const ca = Math.cos(a), sa = Math.sin(a);
        _fm.compose(_fp.set(r * ca, y, r * sa), _fq.setFromEuler(_fe.set(0, Math.atan2(-sa * fwd, ca * fwd), 0)), _fs.set(q.h, q.h, q.h));
        folkMesh.setMatrixAt(i, _fm);
      }
      folkMesh.instanceMatrix.needsUpdate = true;
    };
    moveFolk(0);

    // THE THREADS OF THE LOWEST GALLERY. Over the sea: anglers, each standing at the rail with his rod in his hands, the
    // line down to a float, now and then a fish coming up it. Over the land and the shallows: petition threads let down
    // with a small weight, strung with papers that flutter like a kite's tail, a man at the rail above and people at the
    // foot reaching for it (on the shore; in a boat where the foot is over water). A thread keeps 6 m and its own sway
    // from the route's line over its whole length; near the line they stand wider apart and are thicker (the nearer
    // the route's line passes, up to 90 m, the wider the step to the next and the thicker the thread).
    const petitionBoats = [];
    {
      const yt = TIERS[0], silver = [0.75, 0.8, 0.86], lineC = [0.3, 0.3, 0.27], cane = lin('#c9a45a'), rail = R + GAL_W - 0.75;
      const near = (x, y, z) => 1 - smoothstep(30, 90, lineDist(x, y, z));
      const clearOf = (base, tip, foot, sway) => {
        for (let y = tip[1]; y > foot[1]; y -= 2.5) if (lineDist(tip[0], y, tip[2]) < 6 + sway * clamp((tip[1] - y) / (tip[1] - foot[1]), 0, 1)) return false;
        for (let k = 0; k <= 5; k++) if (lineDist(lerp(base[0], tip[0], k / 5), lerp(base[1], tip[1], k / 5), lerp(base[2], tip[2], k / 5)) < 6) return false;
        return true;
      };
      const Rr = S.anglers;
      let a = Rr.range(0, 0.05), n = 0;
      while (a < TAU) {
        if (++n % 10 === 0) await ctx.yield();
        const gap = Rr.range(9, 15) / (0.75 + 0.5 * (dens - 0.75) / 0.35), yaw = Rr.range(-0.12, 0.12), elv = Rr.range(0.12, 0.34), len = ROD * Rr.range(0.85, 1.1);
        const ph = Rr.range(0, TAU), hasFish = Rr.chance(0.45), spd = Rr.range(0.03, 0.06), fsz = Rr.range(0.55, 0.9), fpos = Rr(), sway = Rr.range(1.1, 1.7), me = who(Rr);
        const ca = Math.cos(a), sa = Math.sin(a), co = Math.cos(a + yaw), so = Math.sin(a + yaw);
        const hands = [rail * ca + 0.45 * co, yt + 1.2, rail * sa + 0.45 * so], tipC = [hands[0] + len * Math.cos(elv) * co, yt + 1.2 + len * Math.sin(elv), hands[2] + len * Math.cos(elv) * so];
        const base = [wx(hands[0]), hands[1], hands[2]], tip = [wx(tipC[0]), tipC[1], tipC[2]], foot = [tip[0], 0.2, tip[2]];
        const nr = near(tip[0], 30, tip[2]);
        a += gap * (1 + 1.2 * nr) / R;
        // an angler fishes only where his float falls in the sea, 8 m or more off the shore
        if (tipC[0] < shoreX(tipC[2]) + 8 || !clearOf(base, tip, foot, sway)) continue;
        person(GS, wx(rail * ca), yt, rail * sa, yawTo(co, so), me, 1);
        const mid = [lerp(base[0], tip[0], 0.55), lerp(base[1], tip[1], 0.55) + 0.5, lerp(base[2], tip[2], 0.55)];
        GS.kind(0).col(cane, 1); GS.bar(base, mid, 0.13, 0.09, 5); GS.bar(mid, tip, 0.09, 0.045, 5);
        addThread(foot, tip, sway, 0.1 + 0.06 * nr, ph, lineC, 10);
        addBead(foot, tip, sway, ph, 1, 0, 0.32, 0.012, [0.85, 0.2, 0.12]);
        if (hasFish) addBead(foot, tip, sway, ph + fpos, 1, spd, fsz, 0, silver);
      }
      await flushGS();
      const Pt = S.petitions, paperC = ['#f4efe2', '#f1d9c9', '#dfe6ee', '#f3e7b8'].map(lin);
      a = Pt.range(0, 0.05); n = 0;
      while (a < TAU) {
        if (++n % 6 === 0) await ctx.yield();
        const gap = Pt.range(16, 26) / (0.75 + 0.5 * (dens - 0.75) / 0.35), ph = Pt.range(0, TAU), sway = Pt.range(0.8, 1.3), nPap = Pt.int(7, 12), nFolk = Pt.int(2, 4);
        const papers = [], folk = [];
        for (let k = 0; k < 12; k++) papers.push([Pt.range(0.025, 0.05), Pt.range(0.5, 0.75), Pt.pick(paperC), Pt.range(0, TAU)]);
        for (let k = 0; k < 4; k++) folk.push([Pt.range(0, TAU), Pt.range(1.1, 2.6), who(Pt)]);
        const me = who(Pt);
        const ca = Math.cos(a), sa = Math.sin(a), xc = (rail + 0.9) * ca, z = (rail + 0.9) * sa, di = shoreX(z) - xc;
        const top = [wx(xc), yt + 1.15, z], ground = di > 0 ? landH(xc, z) : 0.6, foot = [top[0], ground + 2.1, z];
        const nr = near(top[0], 30, z);
        a += gap * (1 + 1.2 * nr) / R;
        // a petition comes up only from the land or from the shallows within 25 m of the shore
        if (di < -25 || !clearOf(top, top, foot, sway)) continue;
        person(GS, wx(rail * ca), yt, rail * sa, yawTo(ca, sa), me, 3);
        addThread(foot, top, sway, 0.14 + 0.06 * nr, ph, [0.75, 0.72, 0.62], 10);
        addBead(foot, top, sway, ph, 1, 0, 0.3, 0.004, [0.25, 0.2, 0.16]);
        let at = 0.03;
        for (let k = 0; k < nPap; k++) { at += papers[k][0]; addBead(foot, top, sway, ph + papers[k][3], 3, 0, papers[k][1], at, papers[k][2]); }
        if (di > 3) {
          for (let k = 0; k < nFolk; k++) {
            const fa = folk[k][0], fx = xc + folk[k][1] * Math.cos(fa), fz = z + folk[k][1] * Math.sin(fa);
            if (shoreX(fz) - fx > 1 && lineDist(wx(fx), landH(fx, fz) + 1, fz) > 2.5) person(GS, wx(fx), landH(fx, fz), fz, yawTo(-Math.cos(fa), -Math.sin(fa)), folk[k][2], 2);
          }
        } else petitionBoats.push([xc + 2.6, z]);
      }
      await flushGS();
    }

    // ------------------------------------------------------------ water on the island: rivulets running in to the basins, the basins
    // themselves (slow rings where the music falls). The first rivulet runs beside the bowl's line, 7 m to the basin's side, and bends into the basin.
    const waterU = { uSkyHi: EX.uSkyHi, uSkyLo: EX.uSkyLo, uWaterCol: { value: night ? v3(0.02, 0.05, 0.09) : v3(0.1, 0.3, 0.36) } };
    const noDrops = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4());
    // each: [[x, z], ...] in world x, z (the houses keep off them)
    const rivulets = [];
    {
      const Rv = S.rivulets, pos = [], flow = [], idx = [];
      const ribbon = (line, w0, w1) => {
        const base = pos.length / 3; let along = 0;
        for (let i = 0; i < line.length; i++) {
          const p = line[i], q = line[Math.min(i + 1, line.length - 1)], o = line[Math.max(i - 1, 0)];
          let tx = q[0] - o[0], tz = q[1] - o[1]; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
          if (i) along += Math.hypot(p[0] - o[0], p[1] - o[1]);
          const hw = lerp(w0, w1, i / (line.length - 1)) * 0.5 * (1 + 0.5 / 0.7);
          for (const sd of [-1, 1]) { const x = p[0] - tz * hw * sd, z = p[1] + tx * hw * sd; pos.push(x, lawnH(x, z) + 0.14, z); flow.push(along, sd * (1 / 0.7), hw * 0.7); }
        }
        for (let i = 0; i < line.length - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        rivulets.push(line);
      };
      // beside the bowl's line, into the first basin
      {
        const line = [];
        const sB = (bowlLen + COURT) / 2;
        for (let s = bowlLen - 6; s > sB + 13; s -= 3) { const q = bowlAt(s, -7 - 9.5 * smoothstep(sB + 40, sB + 14, s)); line.push([wx(q[0]), q[1]]); }
        ribbon(line, 1.3, 2.3);
      }
      for (let k = 0; k < 4; k++) {
        const b = basins[k], ab = Math.atan2(b.z, b.x), nRiv = k === 0 ? 4 : 5;
        for (let j = 0; j < nRiv; j++) {
          const a = ab + (j - (nRiv - 1) / 2) * 0.36 + Rv.range(-0.07, 0.07), r1 = R - Rv.range(8, 34), amp = Rv.range(3, 8), wl = Rv.range(1.2, 2.4), ph = Rv.range(0, TAU);
          const w0 = Rv.range(1.0, 1.5), w1 = Rv.range(1.8, 2.6);
          const sx = r1 * Math.cos(a), sz = r1 * Math.sin(a), dx = b.x - sx, dz = b.z - sz, dl = Math.hypot(dx, dz), ex = b.x - dx / dl * (b.r - 3), ez = b.z - dz / dl * (b.r - 3);
          const n = Math.max(6, Math.round(dl / 4)), line = [];
          let clear = true;
          for (let i = 0; i <= n; i++) {
            const t = i / n, m = amp * Math.sin(t * Math.PI) * Math.sin(t * wl * TAU + ph), x = lerp(sx, ex, t) - dz / dl * m, z = lerp(sz, ez, t) + dx / dl * m;
            if (k === 0 && Math.abs((x - wx(KERB[0])) * hand * -nl[0] + (z - KERB[1]) * -nl[1] - 7) < 5) clear = false;
            line.push([x, z]);
          }
          if (clear) ribbon(line, w0, w1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 3)); g.setIndex(idx);
      // on the rare visit every rivulet runs the other way, out to the rim
      const m = new THREE.Mesh(g, shaderMat(WATER_VERT, WATER_FRAG, { ...waterU, uMode: { value: 0 }, uFlowK: { value: rare ? -1 : 1 }, uDrops: { value: noDrops } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      m.renderOrder = 2;
      scene.add(m);
      const Dr = S.drops;
      for (const b of basins) {
        const drops = [0, 1, 2, 3, 4, 5].map(() => { const a = Dr.range(0, TAU), r = Dr.range(2, b.r - 5); return new THREE.Vector4(b.x + r * Math.cos(a), b.z + r * Math.sin(a), Dr.range(0, TAU), Dr.range(0.9, 1.7)); });
        const disc = new THREE.Mesh(new THREE.CircleGeometry(b.r - 0.3, 48).rotateX(-Math.PI / 2), shaderMat(WATER_VERT.replace('vFlow = aFlow;', 'vFlow = vec3(0.);').replace('attribute vec3 aFlow;', ''), WATER_FRAG, { ...waterU, uMode: { value: 1 }, uFlowK: { value: 1 }, uDrops: { value: drops } }));
        disc.position.set(b.x, b.level - 0.45, b.z);
        scene.add(disc);
      }
      await ctx.yield();
    }
    // THE WELL: a stone kerb with a balustrade round it, and the astronomers' stair winding three quarters of a turn
    // down the wall (28 degrees) to a landing over the cave's gallery, at the side of the well away from the stone,
    // where the wall goes lowest. It winds the way that keeps it farther from the route (tested on its own steps).
    const STAIR = { r: SHAFT - 1.6, w: 3.0, n: 132, turn: 0.75 * TAU };
    {
      GS.kind(0).col(C.stone, 0.95);
      GS.lathe(0, 0, [[SHAFT - 0.05, TOP - 0.3], [SHAFT - 0.05, TOP + 0.35], [SHAFT + 1.0, TOP + 0.35], [SHAFT + 1.0, TOP]], 96);
      GS.kind(0).col(C.chalk, 1);
      for (let k = 0; k < 108; k++) { const a = k / 108 * TAU, x = (SHAFT + 0.5) * Math.cos(a), z = (SHAFT + 0.5) * Math.sin(a); GS.bar([x, TOP + 0.35, z], [x, TOP + 1.12, z], 0.16, 0.1, 5); }
      GS.hoop([0, TOP + 1.2, 0], [0, 1, 0], SHAFT + 0.5, 0.17, 96, 5);
      await ctx.yield();
      // the landing: where the wall goes lowest (straight away from the stone), a metre over the dome's surface there
      const aFar = Math.atan2(-RT.stone[1], -RT.stone[0]), dFar = Math.hypot(RT.stone[0], RT.stone[1]) + STAIR.r;
      STAIR.yEnd = FLOOR + domeH(dFar) + 1; STAIR.aFar = aFar;
      const stepAt = (i, sg) => { const a = aFar + sg * STAIR.turn * (1 - i / STAIR.n); return [wx(STAIR.r * Math.cos(a)), lerp(TOP - 0.4, STAIR.yEnd, i / STAIR.n), STAIR.r * Math.sin(a)]; };
      const least = (sg) => { let m = 1e9; for (let i = 0; i <= STAIR.n; i += 2) { const p = stepAt(i, sg); m = Math.min(m, lineDist(p[0], p[1] + 1, p[2])); } return m; };
      STAIR.sg = least(1) >= least(-1) ? 1 : -1; STAIR.clear = least(STAIR.sg);
      shaftMat.uniforms.uStair.value.set(aFar, STAIR.sg * STAIR.turn, TOP - 0.4, STAIR.yEnd);
      for (let i = 0; i <= STAIR.n; i++) {
        const p = stepAt(i, STAIR.sg), a = Math.atan2(p[2], p[0]);
        GS.tr(p[0], p[1], p[2], Math.PI / 2 - a);
        GS.kind(0).col(C.stone, i % 2 ? 0.8 : 0.95); GS.box(-0.62, -0.5, -STAIR.w / 2, 0.62, 0, STAIR.w / 2);
        // the rail's posts on the open side, every third step
        if (i % 3 === 0) { GS.kind(1).col(C.copper, 1); GS.bar([0, 0, -STAIR.w / 2 + 0.1], [0, 1.1, -STAIR.w / 2 + 0.1], 0.05, 0.05, 4); }
        GS.pop();
        if (i % 44 === 43) await ctx.yield();
      }
      // a lamp on the wall over every twelfth step (the wall's shader lays its light round each), and people on the
      // stair going down and coming up (none within 5 m of the line, top of the head counted)
      const Wf = S.wellfolk;
      for (let i = 6; i <= STAIR.n; i += 12) {
        const p = stepAt(i, STAIR.sg), a = Math.atan2(p[2], p[0]), r = SHAFT - 0.4, x = r * Math.cos(a), z = r * Math.sin(a);
        GS.kind(1).col(C.copper, 1); GS.bar([SHAFT * Math.cos(a), p[1] + 2.5, SHAFT * Math.sin(a)], [x, p[1] + 2.4, z], 0.05, 0.05, 4); GS.bar([x, p[1] + 2.4, z], [x, p[1] + 2.15, z], 0.03, 0.03, 4);
        GS.kind(2).col(C.lamp, 1); GS.ball([x, p[1] + 2.0, z], 0.2, 6, 1.2);
      }
      for (let i = 9; i < STAIR.n; i += 8) {
        const w = { ...who(Wf), rich: Wf.range(0.1, 6) }, keep = Wf.chance(0.55), up = Wf.chance(0.5), look = Wf.chance(0.3), p = stepAt(i, STAIR.sg), a = Math.atan2(p[2], p[0]);
        if (!keep || lineDist(p[0], p[1] + 2.3, p[2]) < 5) continue;
        person(GS, p[0], p[1], p[2], look ? Math.atan2(-p[0], -p[2]) : Math.atan2(-Math.sin(a), Math.cos(a)) + (up ? 0 : Math.PI), w, look ? 3 : 0);
      }
      await ctx.yield();
    }

    // ------------------------------------------------------------ THE KING'S PALACE, the one landmark: beyond the well on the bowl's
    // line, square to it, its middle on the line through the well's middle (the line itself enters the well to one side
    // of it). A plinth as high as the lawn stands at its back (so the bowl's slope ends against it), a stair down to the
    // well's terrace, a round hall with a great dome and a turning armillary sphere over it, two wings with a colonnade,
    // and a leaning observatory tower at each end. Local: x along the front, z toward the well, y from the plinth's top.
    const PAL = { D: SHAFT + TERRACE + 28, y: TOP + 5.4, half: 62, back: -24, front: 20, drum: 16, towers: [] };
    const spinners = [[], []];
    {
      const P = S.palace;
      PAL.x = wx(hd[0] * PAL.D); PAL.z = hd[1] * PAL.D; PAL.yaw = yawTo(-hd[0], -hd[1]);
      const cy = Math.cos(PAL.yaw), sy = Math.sin(PAL.yaw);
      PAL.toW = (u, w) => [PAL.x + u * cy + w * sy, PAL.z - u * sy + w * cy];
      PAL.loc = (x, z) => [(x - PAL.x) * cy - (z - PAL.z) * sy, (x - PAL.x) * sy + (z - PAL.z) * cy];
      GS.tr(PAL.x, PAL.y, PAL.z, PAL.yaw);
      GS.kind(0).col(C.stone, 0.86);
      GS.box(-PAL.half, -7, PAL.back, PAL.half, 0, PAL.front, mulc(C.chalk, 1.04));
      GS.col(C.stone, 0.8); GS.box(-PAL.half - 0.5, -7, PAL.back - 0.5, PAL.half + 0.5, -4.6, PAL.front + 0.5, mulc(C.stone, 0.9));
      // the stair: 13 steps of 0.4 m down to the terrace, 34 m wide, between two blocks with a stone ball on each
      for (let i = 0; i < 13; i++) { GS.col(C.chalk, i % 2 ? 0.93 : 1.02); GS.box(-17, -7, PAL.front + 0.5 * i, 17, -0.4 * (i + 1), PAL.front + 0.5 * (i + 1)); }
      for (const sd of [-1, 1]) {
        GS.col(C.stone, 0.9); GS.box(sd * 17, -7, PAL.front, sd * 19.4, 0.5, PAL.front + 7.2, mulc(C.chalk, 1));
        GS.col(C.chalk, 1); GS.ball([sd * 18.2, 1.5, PAL.front + 6], 1.0, 10);
        // the balustrade along the plinth's front
        for (let u = 20.4; u < PAL.half; u += 1.6) GS.bar([sd * u, 0, PAL.front - 0.5], [sd * u, 1.0, PAL.front - 0.5], 0.2, 0.13, 5);
        GS.box(sd > 0 ? 19.4 : -PAL.half, 1.0, PAL.front - 0.8, sd > 0 ? PAL.half : -19.4, 1.25, PAL.front - 0.2);
      }
      await ctx.yield();
      // the round hall: a drum with sixteen pilasters, tall pointed windows between them, a door to the stair
      const DR = PAL.drum, DH = 24;
      GS.col(C.stone, 0.95);
      GS.lathe(0, 0, [[DR + 1.2, 0], [DR + 1.2, 1.4], [DR, 1.6], [DR, DH - 2.4], [DR + 0.9, DH - 1.8], [DR + 0.9, DH], [DR - 0.8, DH + 0.3]], 48);
      for (let k = 0; k < 16; k++) {
        const a = (k + 0.5) / 16 * TAU, am = k / 16 * TAU, door = k === 4;
        GS.kind(0).col(C.chalk, 1.03); GS.bar([(DR + 0.25) * Math.cos(a), 1.6, (DR + 0.25) * Math.sin(a)], [(DR + 0.25) * Math.cos(a), DH - 2.4, (DR + 0.25) * Math.sin(a)], 0.75, 0.62, 6);
        const hw = (door ? 2.7 : 1.5) / DR, r = DR + 0.06, at = (da, y) => [r * Math.cos(am + da), y, r * Math.sin(am + da)], y0 = door ? 0.05 : 5.5, y1 = door ? 9 : 15.5;
        GS.kind(door ? 0 : 5).col(door ? C.wood : C.dark, door ? 1.5 : 1);
        GS.quad(at(-hw, y0), at(hw, y0), at(hw, y1), at(-hw, y1)); GS.tri(at(-hw, y1), at(hw, y1), at(0, y1 + (door ? 3.2 : 2.6)));
        // a round window over each (six-sided, none true)
        GS.kind(5).col(C.dark, 1);
        const cyw = DH - 5.2, q = [0, 1, 2, 3, 4, 5].map((j) => at(Math.cos(j / 6 * TAU + 0.3) * 1.1 / DR, cyw + Math.sin(j / 6 * TAU + 0.3) * 1.15));
        for (let j = 1; j < 5; j++) GS.tri(q[0], q[j], q[j + 1]);
      }
      // the dome: lead-blue, sixteen gilded ribs, a lantern, a post, and the great armillary sphere turning on it
      const prof = [], RD = DR - 0.8, HD = 17;
      for (let i = 0; i <= 9; i++) { const tt = i / 9 * Math.PI / 2; prof.push([Math.max(3.3, RD * Math.pow(Math.max(Math.cos(tt), 0), 0.85)), DH + 0.3 + HD * Math.sin(tt)]); }
      GS.kind(0).col(C.slate, 1.25); GS.lathe(0, 0, prof, 48);
      GS.kind(1).col(C.ochre, 1.15);
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, ca = Math.cos(a), sa = Math.sin(a); for (let i = 0; i < 9; i++) GS.bar([(prof[i][0] + 0.1) * ca, prof[i][1], (prof[i][0] + 0.1) * sa], [(prof[i + 1][0] + 0.1) * ca, prof[i + 1][1], (prof[i + 1][0] + 0.1) * sa], 0.3, 0.26, 4); }
      const LY = DH + 0.3 + HD;
      GS.kind(0).col(C.chalk, 1); GS.lathe(0, 0, [[3.5, LY - 0.6], [3.5, LY + 4.6], [4.2, LY + 5], [0.4, LY + 8.4]], 12);
      GS.kind(5).col(C.dark, 1); for (let k = 0; k < 6; k++) { const a = (k + 0.5) / 6 * TAU, da = 0.22, r = 3.56; GS.quad([r * Math.cos(a - da), LY + 0.6, r * Math.sin(a - da)], [r * Math.cos(a + da), LY + 0.6, r * Math.sin(a + da)], [r * Math.cos(a + da), LY + 3.8, r * Math.sin(a + da)], [r * Math.cos(a - da), LY + 3.8, r * Math.sin(a - da)]); }
      GS.kind(1).col(C.copper, 1); GS.bar([0, LY + 8, 0], [0, LY + 12.4, 0], 0.35, 0.25, 6);
      PAL.top = LY + 12.4 + 8.6;
      spinners[0].push({ x: PAL.x, y: PAL.y + PAL.top, z: PAL.z, s: 7.5, tilt: P.range(0.34, 0.5), yaw: P.range(0, TAU), speed: P.range(0.22, 0.32) * (P.chance(0.5) ? 1 : -1), ph: P.range(0, TAU) });
      await ctx.yield();
      // a gilded sun over the door, and a flat five-pointed star (gilded) where one is wanted
      const flat = (cx, cyy, z, r0, r1, n, ph) => { for (let j = 0; j < n; j++) { const a0 = ph + j / n * TAU, a1 = ph + (j + 0.5) / n * TAU, a2 = ph + (j + 1) / n * TAU; GS.tri([cx, cyy, z], [cx + r0 * Math.cos(a0), cyy + r0 * Math.sin(a0), z], [cx + r1 * Math.cos(a1), cyy + r1 * Math.sin(a1), z]); GS.tri([cx, cyy, z], [cx + r1 * Math.cos(a1), cyy + r1 * Math.sin(a1), z], [cx + r0 * Math.cos(a2), cyy + r0 * Math.sin(a2), z]); } };
      GS.kind(1).col(C.ochre, 1.2); flat(0, 16.6, DR + 0.35, 1.5, 3.1, 12, 0.13);
      // the wings: no end wall square to the front, the ridge off the middle; windows in rows (tall leaning ones below,
      // by turns a round, a three-cornered and a lozenge one above), a colonnade before each with stars on its beam
      for (const sd of [-1, 1]) {
        const uE = 50 + P.range(-1.5, 1.5), uB = uE - P.range(3, 5.5), hF = 15 + P.range(-0.4, 0.4), hB = hF + P.range(0.8, 1.8);
        const xs = sd > 0 ? [15, uE, uB, 15] : [-uE, -15, -15, -uB], zs = [9, 9, -9, -9], hsW = [hF, hF, hB, hB];
        const Bw = xs.map((x, i) => [x, 0, zs[i]]), Tw = xs.map((x, i) => [x, hsW[i], zs[i]]);
        GS.kind(0).col(C.stone, 0.97); GS.hexa([...Bw, ...Tw], C.slate, mulc(C.stone, 0.97));
        GS.col(C.chalk, 1.02); GS.box(Math.min(xs[0], xs[1]), hF - 0.9, 9, Math.max(xs[0], xs[1]), hF + 0.3, 9.5);
        const r0 = [sd * (20 + P.range(-2, 2)), hB + 5 + P.range(-0.5, 0.5), P.range(-1.5, 0.5)], r1 = [sd * (43 + P.range(-2, 2)), hB + 4 + P.range(-0.5, 0.5), P.range(-1.5, 0.5)], E = Tw.map((p) => [p[0] + Math.sign(p[0] - sd * 32) * 0.7, p[1] + 0.3, p[2] * 1.1]);
        const near = (p) => (Math.abs(p[0] - r0[0]) < Math.abs(p[0] - r1[0]) ? r0 : r1), roofC = mulc(C.slate, 1.0);
        GS.col(roofC, 1);
        for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, a = near(E[i]), b = near(E[j]); if (a === b) GS.tri(E[i], E[j], a, roofC, roofC, mulc(roofC, 1.2)); else GS.quad(E[i], E[j], b, a, roofC, mulc(roofC, 1.2)); }
        for (let k = 0; k < 8; k++) {
          const u = sd * (17.6 + 4.25 * k), z = 9.07, sk = P.range(-0.35, 0.35), kd = (k + (sd > 0 ? 0 : 1)) % 3, y = 11.6 + P.range(-0.2, 0.2);
          GS.kind(5).col(C.dark, 1);
          GS.quad([u - 0.9, 2.2, z], [u + 0.9, 2.2 + sk * 0.3, z], [u + 0.9 + sk, 7.2, z], [u - 0.9 + sk, 7.2 - sk * 0.3, z]);
          if (kd === 0) { const q = [0, 1, 2, 3, 4, 5, 6].map((j) => [u + 1.25 * Math.cos(j / 7 * TAU + sk), y + 1.3 * Math.sin(j / 7 * TAU + sk), z]); for (let j = 1; j < 6; j++) GS.tri(q[0], q[j], q[j + 1]); }
          else if (kd === 1) GS.tri([u - 1.4, y - 1.2, z], [u + 1.4, y - 1.2 + sk, z], [u + sk * 2, y + 1.7, z]);
          else GS.quad([u - 1.1, y + sk, z], [u, y - 1.7, z], [u + 1.1, y, z], [u + sk, y + 1.7, z]);
        }
        GS.kind(0);
        for (let k = 0; k < 8; k++) { const u = sd * (16.6 + 4.64 * k); GS.col(C.chalk, 1.02); GS.bar([u, 0, 14], [u, 9, 14], 0.62, 0.5, 8); GS.box(u - 0.8, 0, 13.2, u + 0.8, 0.5, 14.8); }
        GS.col(C.stone, 0.95); GS.box(sd > 0 ? 15 : -50.6, 9, 13.1, sd > 0 ? 50.6 : -15, 10.3, 14.9); GS.box(sd > 0 ? 15 : -50.6, 10.3, 9, sd > 0 ? 50.6 : -15, 10.6, 15.2, mulc(C.slate, 1.1));
        GS.kind(1).col(C.ochre, 1.2);
        for (let k = 0; k < 7; k++) flat(sd * (18.9 + 4.64 * k), 9.65, 14.96, 0.24, 0.6, 5, Math.PI / 2 + P.range(-0.3, 0.3));
        await ctx.yield();
        // the observatory tower at the wing's end: leaning and turned, a round cap with a telescope out of its slit, and
        // an orrery turning over it
        const tu = sd * 56.5, q = 5.5, H = 32 + P.range(-2, 2), lx = P.range(-1.8, 1.8), lz = P.range(-1.8, 1.8), tw = P.range(-0.3, 0.3), sc = P.range(0.78, 0.88);
        const Bt = [[-q, q], [q, q], [q, -q], [-q, -q]].map(([a, b]) => [tu + a * P.range(0.9, 1.08), 0, b * P.range(0.9, 1.08)]);
        const Tt = [[-q, q], [q, q], [q, -q], [-q, -q]].map(([a, b]) => [tu + lx + (a * Math.cos(tw) + b * Math.sin(tw)) * sc, H, lz + (-a * Math.sin(tw) + b * Math.cos(tw)) * sc]);
        GS.kind(0).col(C.stone, 0.92); GS.hexa([...Bt, ...Tt], C.slate, mulc(C.stone, 0.92));
        for (let k = 0; k < 4; k++) {
          const v = 0.2 + 0.2 * k, at = (uu, vv) => [0, 1, 2].map((c) => lerp(lerp(Bt[0][c], Bt[1][c], uu), lerp(Tt[0][c], Tt[1][c], uu), vv) + (c === 2 ? 0.09 : 0)), s2 = P.range(-0.05, 0.05);
          GS.kind(5).col(C.dark, 1); GS.quad(at(0.5 + s2, v - 0.045), at(0.62 + s2, v), at(0.5 - s2, v + 0.045), at(0.38 + s2, v));
        }
        const cx = tu + lx, cz = lz;
        GS.kind(0).col(C.chalk, 1); GS.lathe(cx, cz, [[q * sc + 0.9, H - 0.4], [q * sc + 0.9, H + 0.8], [5.0, H + 1], [4.4, H + 3.4], [2.6, H + 5.3], [0.05, H + 6.1]], 14);
        const ta = P.range(0, TAU), te = P.range(0.6, 1.0), tdx = Math.cos(ta) * Math.cos(te), tdz = Math.sin(ta) * Math.cos(te), tdy = Math.sin(te);
        GS.kind(1).col(C.copper, 1); GS.bar([cx + tdx * 1.5, H + 2 + tdy * 1.5, cz + tdz * 1.5], [cx + tdx * 8, H + 2 + tdy * 8, cz + tdz * 8], 0.5, 0.75, 8, true);
        GS.bar([cx, H + 6, cz], [cx, H + 9.2, cz], 0.2, 0.14, 5);
        const tw2 = PAL.toW(cx, cz);
        spinners[1].push({ x: tw2[0], y: PAL.y + H + 10.3, z: tw2[1], s: 3.4, tilt: P.range(0.2, 0.5), yaw: P.range(0, TAU), speed: P.range(0.3, 0.55) * (P.chance(0.5) ? 1 : -1), ph: P.range(0, TAU) });
        PAL.towers.push({ u: tu, q: q + 0.5, h: H + 4 });
        await ctx.yield();
      }
      GS.pop();
      await flushGS();
    }

    // ------------------------------------------------------------ the town: houses of pale stone with not one right angle (every corner
    // drawn off the square, every wall leaning, every roof skewed), a copper instrument on every roof, and their shadows on the lawn
    const SHD = { pos: [], k: [], idx: [] };
    // what a point h metres up throws on the lawn: (x, z) moved by h times this
    const sunLow = Math.max(sunDir.y, 0.36), sv = [-sunDir.x / sunLow, -sunDir.z / sunLow];
    const hull = (pts) => {
      const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
      lo.pop(); up.pop();
      return lo.concat(up);
    };
    // pts: [[x, z, h], ...] in the world: the shadow is the hull of the feet and of the tops thrown along the sun
    const castShadow = (pts) => {
      const all = [];
      for (const [x, z, h] of pts) { all.push([x, z]); if (h > 0) all.push([x + sv[0] * h, z + sv[1] * h]); }
      const hl = hull(all), base = SHD.pos.length / 3;
      for (const [x, z] of hl) { SHD.pos.push(x, lawnH(x, z) + 0.16, z); SHD.k.push(1); }
      for (let i = 1; i < hl.length - 1; i++) SHD.idx.push(base, base + i + 1, base + i);
    };
    // the palace's shadow: too large for one flat piece on the bowl's slope, so it is laid as a grid of 2 m (in the
    // palace's own axes, so the plinth's edges fall on grid lines): each corner asks whether the palace stands between
    // it and the sun (its masses as plain solids, tried every 1.5 m of height), on the lawn or on the plinth's top
    {
      const cy = Math.cos(PAL.yaw), sy = Math.sin(PAL.yaw), su = sv[0] * cy - sv[1] * sy, sw = sv[0] * sy + sv[1] * cy, DR = PAL.drum, G2 = 2;
      const onPlinth = (u, w) => Math.abs(u) < PAL.half && w > PAL.back && w < PAL.front;
      const inside = (u, w, h) => {
        if (h < 0) return onPlinth(u, w);
        const rr = u * u + w * w, au = Math.abs(u);
        if (rr < DR * DR && h < 24.3) return true;
        if (h >= 24.3 && rr + (h - 24.3) * (h - 24.3) * 0.8 < 15.2 * 15.2) return true;
        if (au > 15 && au < 50 && w > -9 && w < 9 && h < 17) return true;
        if (au > 15 && au < 50.6 && w >= 9 && w < 15 && h > 9 && h < 10.6) return true;
        for (const tw of PAL.towers) if (Math.abs(u - tw.u) < tw.q && Math.abs(w) < tw.q && h < tw.h) return true;
        return false;
      };
      const body = (u, w) => inside(u, w, 0.5);
      const memo = new Map();
      const shade = (iu, iw, top) => {
        const key = (iu + 500) * 2000 + (iw + 500) * 2 + (top ? 1 : 0);
        if (memo.has(key)) return memo.get(key);
        const u = iu * G2, w = iw * G2, wp = PAL.toW(u, w), h0 = top ? 0.05 : lawnH(wp[0], wp[1]) - PAL.y;
        let k = 0;
        for (let dh = 0.75; dh < 62 && !k; dh += 1.5) if (inside(u - su * dh, w - sw * dh, h0 + dh)) k = 1;
        const v = { k, x: wp[0], y: PAL.y + h0 + (top ? 0.03 : 0.16), z: wp[1] };
        memo.set(key, v);
        return v;
      };
      const reach = Math.ceil(64 * Math.hypot(su, sw) / G2) + 2, nu = Math.ceil((PAL.half + 6) / G2) + reach, nw0 = Math.floor((PAL.back - 6) / G2) - reach, nw1 = Math.ceil((PAL.front + 8) / G2) + reach;
      for (let iu = -nu; iu < nu; iu++) {
        for (let iw = nw0; iw < nw1; iw++) {
          const uc = (iu + 0.5) * G2, wc = (iw + 0.5) * G2, top = onPlinth(uc, wc);
          if (top && body(uc, wc)) continue;
          if (!top && Math.abs(uc) < 19.4 && wc > PAL.front && wc < PAL.front + 7.2) continue;
          const wpc = PAL.toW(uc, wc), rc = Math.hypot(wpc[0], wpc[1]);
          if (rc > R - 4 || rc < SHAFT + 2.5) continue;
          const q = [shade(iu, iw, top), shade(iu + 1, iw, top), shade(iu + 1, iw + 1, top), shade(iu, iw + 1, top)];
          if (!(q[0].k + q[1].k + q[2].k + q[3].k)) continue;
          const base = SHD.pos.length / 3;
          for (const c of q) { SHD.pos.push(c.x, c.y, c.z); SHD.k.push(c.k); }
          SHD.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
        }
        if ((iu + nu) % 3 === 2) await ctx.yield();
      }
    }
    // A HOUSE OF THE ISLAND: no right angle in it. Its plan has three corners, four (none square) or seven to nine; its
    // walls lean one way all together (a shear of the whole house) and the top is turned and drawn in; the roof's point
    // or ridge is off the middle; a hall may have a round turret leaning another way. Windows are leaning four-sided,
    // three-cornered or lozenges, in pale frames; a door with a step and a lamp; a brass instrument on the roof.
    // drawHouse() draws what a house is (before its place is tried); its details are dealt from a stream of its own,
    // seeded by a number drawn there, so a house that finds no place shifts no other house's draws.
    const drawHouse = (rng, k = 1) => {
      const kd = rng.pick([0, 0, 0, 1, 2, 2, 3, 4]), s = rng.range(0.75, 1.45) * k, a = rng.range(0, 1), b = rng.range(0, 1), c = rng.range(0, 1);
      const tall = kd === 1, w = (tall ? lerp(2.2, 3, a) : lerp(3.2, 5.2, a)) * s, d = (tall ? lerp(2.2, 3, b) : kd === 4 ? w / s : lerp(2.8, 4.2, b)) * s, h = tall ? lerp(11, 15, c) * Math.sqrt(s) : lerp(5, 7.5, c) * s;
      return { kd, w, d, h, s, seed: rng.int(0, 999999) };
    };
    // the points of a house that its place is tried by (a little outside the real walls): the walls' top corners and
    // edge middles with the lean added, and the roof's point with its instrument
    const housePts = (x, z, yaw, o) => {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), y = lawnH(x, z), ew = o.w * 1.14 + 0.12 * o.h, ed = o.d * 1.14 + 0.12 * o.h, pts = [];
      for (const [a, b] of [[-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]]) pts.push([x + a * ew * cy + b * ed * sy, y + o.h * 1.1, z - a * ew * sy + b * ed * cy]);
      pts.push([x, y + o.h * (o.kd === 1 ? 1.7 : 1.6) + 2 + 2.4 * o.s, z]);
      return pts;
    };
    const _shear = new THREE.Matrix4();
    const house = (x, z, yaw, o) => {
      const r = ctx.core.makeRng(ctx.core.hashSeed('island/house:' + o.seed)), { kd, w, d, h, s } = o, y0 = lawnH(x, z) - 0.7, cy = Math.cos(yaw), sy = Math.sin(yaw);
      const lx = r.range(-0.12, 0.12), lz = r.range(-0.12, 0.12), tw = r.range(-0.13, 0.13), sc = r.range(0.84, 0.98);
      const toW = (p) => { const a = p[0] + lx * p[1], b = p[2] + lz * p[1]; return [x + a * cy + b * sy, z - a * sy + b * cy, p[1] - 0.7]; };
      const n = kd === 3 ? 3 : kd === 4 ? r.int(7, 9) : 4;
      const plan = n === 3 ? [[-w, d], [w, d * 0.5], [w * 0.1, -d * 1.2]] : n === 4 ? [[-w, d], [w, d], [w, -d], [-w, -d]] : Array.from({ length: n }, (_, i) => { const a = Math.PI / 2 + Math.PI / n - i / n * TAU; return [w * 0.95 * Math.cos(a), w * 0.95 * Math.sin(a)]; });
      const jit = n > 4 ? 0.04 : 0.15, hv = n > 4 ? 0.03 : 0.1;
      const B = plan.map(([a, b]) => [a * (1 + r.range(-jit, jit)), 0, b * (1 + r.range(-jit, jit))]);
      const T = B.map((p) => [(p[0] * Math.cos(tw) + p[2] * Math.sin(tw)) * sc, (h + 0.7) * (1 + r.range(-hv, hv)), (-p[0] * Math.sin(tw) + p[2] * Math.cos(tw)) * sc]);
      const wash = r.range(0, 1), wallC = mulc(wash < 0.6 ? C.stone : wash < 0.75 ? mixc(C.stone, C.ochre, 0.3) : wash < 0.9 ? mixc(C.stone, C.ore, 0.2) : mixc(C.stone, C.slate, 0.3), r.range(0.86, 1.04));
      const roofC = r.chance(0.55) ? mulc(C.slate, r.range(0.8, 1.1)) : r.chance(0.6) ? mulc(C.ochre, r.range(0.55, 0.75)) : mulc(C.ore, r.range(0.6, 0.85));
      GS.tr(x, y0, z, yaw); GS.push(_shear.set(1, lx, 0, 0, 0, 1, 0, 0, 0, lz, 1, 0, 0, 0, 0, 1));
      GS.kind(0).col(wallC, 1);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; GS.quad(B[i], B[j], T[j], T[i], mulc(wallC, 0.93), wallC); }
      // the roof: eaves outside the walls; a point well off the middle, or (a wide house) a ridge that is not level
      const hTop = Math.max(...T.map((p) => p[1])), rh = h * (kd === 1 ? r.range(0.4, 0.6) : r.range(0.3, 0.5)), ridge = n === 4 && kd !== 1 && w > 4.4;
      const E = T.map((p) => [p[0] * 1.13, p[1] - 0.25, p[2] * 1.13]);
      const ax = r.range(-0.4, 0.4) * w, az = r.range(-0.4, 0.4) * d, aps = ridge ? [[-w * 0.55 + ax * 0.3, hTop + rh * r.range(0.8, 1.1), az], [w * 0.55 + ax * 0.3, hTop + rh * r.range(0.8, 1.1), az]] : [[ax, hTop + rh, az]];
      const apOf = (p) => (aps.length > 1 && p[0] > 0 ? aps[1] : aps[0]);
      GS.col(roofC, 1);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, a = apOf(E[i]), b = apOf(E[j]);
        if (a === b) GS.tri(E[i], E[j], a, roofC, roofC, mulc(roofC, 1.25)); else GS.quad(E[i], E[j], b, a, roofC, mulc(roofC, 1.25));
        GS.quad(E[i], T[i], T[j], E[j], mulc(roofC, 0.6));
      }
      if (kd !== 1 && n <= 4) {
        const cx = r.range(-0.5, 0.5) * w * sc, cz = r.range(-0.5, 0.5) * d * sc, cb = hTop - 0.6, ch = rh * r.range(0.9, 1.3) + 0.8, q = r.range(0.35, 0.5) * Math.sqrt(s), kx = r.range(-0.3, 0.3), kz = r.range(-0.3, 0.3);
        GS.kind(0).col(wallC, 0.9);
        GS.hexa([[cx - q, cb, cz + q], [cx + q, cb, cz + q * 0.8], [cx + q, cb, cz - q], [cx - q, cb, cz - q * 0.8], [cx - q + kx, cb + ch, cz + q + kz], [cx + q + kx, cb + ch, cz + q * 0.8 + kz], [cx + q + kx, cb + ch, cz - q + kz], [cx - q + kx, cb + ch, cz - q * 0.8 + kz]], C.dark, mulc(wallC, 0.9));
      }
      // windows and a door: every opening a pale frame with a dark pane in it; none square
      const floors = clamp(Math.round(h / 3.3), 1, 4), rs = Math.sqrt(s);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, ex = B[j][0] - B[i][0], ez = B[j][2] - B[i][2], wide = Math.hypot(ex, ez) || 1, ox = -ez / wide, oz = ex / wide;
        const at = (u, v, o) => [lerp(lerp(B[i][0], B[j][0], u), lerp(T[i][0], T[j][0], u), v) + ox * o, lerp(lerp(B[i][1], B[j][1], u), lerp(T[i][1], T[j][1], u), v), lerp(lerp(B[i][2], B[j][2], u), lerp(T[i][2], T[j][2], u), v) + oz * o];
        const nW = n > 4 ? (i % 2 ? 0 : 1) : Math.max(1, Math.round(wide / 3.2)), hgt = h + 0.7;
        for (let fl = 0; fl < floors; fl++) for (let k = 0; k < nW; k++) {
          const door = i === 0 && fl === 0 && k === 0, u0 = (k + 0.5) / nW + r.range(-0.06, 0.06), hw = Math.min(0.4 / nW, (door ? 0.62 : r.range(0.42, 0.58)) * rs / wide), sk = r.range(-0.05, 0.05), sh = door || fl === 0 ? 0 : r.int(0, 3);
          const v0 = door ? 0.72 / hgt : (fl + 0.4) / floors, v1 = door ? v0 + 2.3 * rs / hgt : (fl + 0.8) / floors, fu = 0.14 / wide, fv = 0.14 / hgt, vm = (v0 + v1) / 2;
          const shape = (g, o) => (sh === 2 ? [at(u0 - hw - g, v0 - g * 0.6, o), at(u0 + hw + g, v0 - g * 0.6 + sk, o), at(u0 + sk * 2, v1 + g, o)] : sh === 3 ? [at(u0 - hw - g, vm + sk, o), at(u0, v0 - g, o), at(u0 + hw + g, vm, o), at(u0 + sk, v1 + g, o)] : [at(u0 - hw - g, v0 - g, o), at(u0 + hw + g, v0 - g + sk, o), at(u0 + hw + sk + g, v1 + g + sk * 0.6, o), at(u0 - hw + sk - g, v1 + g - sk, o)]);
          const fr = shape(fu > fv ? fv : fu, 0.05), pn = shape(0, 0.09);
          GS.kind(0).col(C.chalk, 1.04); if (fr.length === 3) GS.tri(fr[0], fr[1], fr[2]); else GS.quad(fr[0], fr[1], fr[2], fr[3]);
          GS.kind(door ? 0 : 5).col(door ? C.wood : C.dark, door ? 1.4 : 1); if (pn.length === 3) GS.tri(pn[0], pn[1], pn[2]); else GS.quad(pn[0], pn[1], pn[2], pn[3]);
          if (door) {
            const p = at(u0, v0, 0.5), q = at(u0 + hw + 0.45 / wide, v1 - 0.2 / hgt, 0.3);
            GS.kind(0).col(C.chalk, 0.95); GS.box(p[0] - 1.0 * rs, 0.3, p[2] - 0.5, p[0] + 1.0 * rs, 0.74, p[2] + 0.5);
            GS.kind(2).col(C.lamp, 1); GS.ball(q, 0.17, 6);
          }
        }
      }
      // a hall's round turret at a back corner, leaning its own way, with a pointed cap
      const tops = [];
      if (kd === 2) {
        const c = B[2], tr = r.range(1.3, 1.9) * rs, th = (h + 0.7) * r.range(1.25, 1.6), l2x = r.range(-0.14, 0.14), l2z = r.range(-0.14, 0.14);
        GS.pop(); GS.push(_shear.set(1, l2x, 0, 0, 0, 1, 0, 0, 0, l2z, 1, 0, 0, 0, 0, 1));
        GS.kind(0).col(wallC, 0.96); GS.lathe(c[0] * 0.92, c[2] * 0.92, [[tr, 0], [tr * 0.88, th]], 7);
        GS.col(roofC, 1); GS.lathe(c[0] * 0.92, c[2] * 0.92, [[tr * 0.88 + 0.4, th - 0.2], [0.04, th + tr * 2.3]], 7);
        GS.kind(5).col(C.dark, 1);
        for (let k = 0; k < 2; k++) { const a = r.range(0, TAU), rr = tr * 0.93, y = th * (0.45 + 0.3 * k), da = 0.28; GS.quad([c[0] * 0.92 + rr * Math.cos(a - da), y, c[2] * 0.92 + rr * Math.sin(a - da)], [c[0] * 0.92 + rr * Math.cos(a + da), y + 0.2, c[2] * 0.92 + rr * Math.sin(a + da)], [c[0] * 0.92 + rr * Math.cos(a + da), y + 1.5, c[2] * 0.92 + rr * Math.sin(a + da)], [c[0] * 0.92 + rr * Math.cos(a - da), y + 1.3, c[2] * 0.92 + rr * Math.sin(a - da)]); }
        const tt = th + tr * 2.3, aa = c[0] * 0.92 + l2x * tt, bb = c[2] * 0.92 + l2z * tt;
        tops.push([x + aa * cy + bb * sy, z - aa * sy + bb * cy, tt - 0.7]);
        GS.pop(); GS.push(_shear.set(1, lx, 0, 0, 0, 1, 0, 0, 0, lz, 1, 0, 0, 0, 0, 1));
      }
      // the instrument on the roof: a brass post at the roof's point and one of four things on it
      const ap = aps[0], kindI = r.int(0, 3), post = 1.2 + 0.6 * rs, top2 = [ap[0], ap[1] + post, ap[2]], sp = r.range(1.2, 1.9) * rs, tpW = toW([ap[0], ap[1] + post + 1.15 * sp, ap[2]]);
      GS.kind(1).col(C.copper, 1); GS.bar([ap[0], ap[1] - 0.4, ap[2]], top2, 0.09 * rs, 0.07 * rs, 5);
      if (kindI < 2) spinners[kindI].push({ x: tpW[0], y: y0 + ap[1] + post + 1.15 * sp, z: tpW[1], s: sp, tilt: r.range(0.2, 0.6), yaw: r.range(0, TAU), speed: r.range(0.25, 0.7) * (r.chance(0.5) ? 1 : -1), ph: r.range(0, TAU) });
      else if (kindI === 2) {
        const e2 = r.range(0.3, 0.9), az2 = r.range(0, TAU), dx = Math.cos(az2) * Math.cos(e2), dz = Math.sin(az2) * Math.cos(e2), dy = Math.sin(e2);
        GS.bar([top2[0] - dx * 1.1 * sp, top2[1] - dy * 1.1 * sp, top2[2] - dz * 1.1 * sp], [top2[0] + dx * 2.0 * sp, top2[1] + dy * 2.0 * sp, top2[2] + dz * 2.0 * sp], 0.14 * sp, 0.22 * sp, 7, true);
      } else {
        const az2 = r.range(0, TAU), axs = [Math.cos(az2), 0, Math.sin(az2)];
        GS.hoop([top2[0], top2[1] + sp, top2[2]], axs, sp, 0.06 * sp, 14, 4);
        GS.bar([top2[0], top2[1], top2[2]], [top2[0] - axs[2] * sp, top2[1] + sp + r.range(-0.6, 0.6) * sp, top2[2] + axs[0] * sp], 0.04 * sp, 0.04 * sp, 4);
      }
      GS.pop(); GS.pop();
      castShadow([...B.map(toW).map((p) => [p[0], p[1], 0]), ...T.map(toW), ...aps.map(toW), ...tops]);
      return { x, z, r: (n === 4 ? Math.hypot(w, d) : Math.max(w, d) * 1.25) * 1.1, h: ap[1] + post + 2.3 * sp };
    };

    // WHERE THE TOWN STANDS. Two rows beside the street the flight follows (from the rim's gate to the palace's forecourt,
    // along the route's own plan): each house's front to the street, its nearest wall between one and a half and two of
    // its wall's heights from the route's line. The rest stand on six ring streets about the well. A house keeps off the
    // basins, the walks, the rivulets, the palace and its neighbours, and every point of it (walls' top corners and edge
    // middles with the lean, the roof's point with its instrument) keeps one and a half wall heights from the line.
    const placed = [];
    {
      const Hs = S.houses, rivPts = rivulets.flat();
      const free = (x, z, rad, gap) => {
        const r = Math.hypot(x, z);
        if (r < SHAFT + TERRACE + 4 + rad || r > R - 12 - rad) return false;
        { const pl = PAL.loc(x, z); if (Math.abs(pl[0]) < PAL.half + 8 + rad && pl[1] > PAL.back - 8 - rad && pl[1] < PAL.front + 22 + rad) return false; }
        for (const b of basins) {
          if (Math.hypot(x - b.x, z - b.z) < b.r + 8 + rad) return false;
          const bl = Math.hypot(b.x, b.z);
          if (x * b.x + z * b.z > 0 && Math.abs(x * b.z - z * b.x) / bl < rad + 2.6) return false;
        }
        for (const q of rivPts) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < (rad + gap) ** 2) return false;
        for (const q of placed) if ((q.x - x) ** 2 + (q.z - z) ** 2 < (q.r + rad + 1.5) ** 2) return false;
        return true;
      };
      // the ring streets (gravel walks about the well, every 26 m): a house stands between two of them
      const RINGS = [56, 82, 108, 134, 160, 186], offWalk = (x, z, rad) => { const r = Math.hypot(x, z); return r < 60 || r > 205 || Math.abs(((r - 56) % 26) - 13) > Math.min(rad, 9) + 1.2; };
      const KEEP = 1.5;
      const tryHouse = (x, z, yaw, o) => {
        const rad = (o.kd === 3 || o.kd === 4 ? Math.max(o.w, o.d) * 1.25 : Math.hypot(o.w, o.d)) * 1.1;
        if (!free(x, z, rad, 3) || !offWalk(x, z, rad * 0.8)) return false;
        for (const p of housePts(x, z, yaw, o)) if (lineDist(p[0], p[1], p[2]) < KEEP * o.h) return false;
        placed.push(house(x, z, yaw, o));
        return true;
      };
      for (const sd of [-1, 1]) {
        let m = M.rim + 10 + Hs.range(0, 6), nS = 0;
        while (m < M.court) {
          const o = drawHouse(Hs, 1.05), far = Hs.range(1.55, 2.0), gap = Hs.range(2.5, 6), turn = Hs.range(-0.25, 0.25), ext = o.w * 1.14 + 0.12 * o.h;
          const i = Math.round((m + ext) / 2.5), q = route[i], q2 = route[i + 2], tl = Math.hypot(q2.x - q.x, q2.z - q.z) || 1, tx = (q2.x - q.x) / tl, tz = (q2.z - q.z) / tl;
          // the house is set where its nearest point (as its place is tried) stands far * h from the line
          const yaw = Math.atan2(tz * sd, -tx * sd) + turn, lat0 = far * o.h + o.d * 1.14 + 0.12 * o.h;
          let least = 1e9; for (const p of housePts(q.x - tz * lat0 * sd, q.z + tx * lat0 * sd, yaw, o)) least = Math.min(least, lineDist(p[0], p[1], p[2]));
          const lat = lat0 + Math.max(0, far * o.h - least) + 0.1;
          tryHouse(q.x - tz * lat * sd, q.z + tx * lat * sd, yaw, o);
          m += 2 * ext + gap;
          nS++; await rest();
        }
      }
      await flushGS();
      const want = Math.round(120 * dens);
      let nTry = 0;
      for (const rs of RINGS) {
        let a = Hs.range(0, 1);
        while (a < TAU) {
          const o = drawHouse(Hs, 1), rr = rs + Hs.range(-5, 5), turn = Hs.range(-0.35, 0.35), keep = Hs.chance(0.5 + 0.45 * (dens - 0.75) / 0.35);
          a += Hs.range(17, 27) / rs;
          if (keep && placed.length < want) tryHouse(wx(rr * Math.cos(a)), rr * Math.sin(a), yawTo(-Math.cos(a), -Math.sin(a)) + turn, o);
          if (++nTry % 3 === 0) await rest();
        }
      }
      await flushGS();
      // GARDENS CUT IN CIRCLES AND TRIANGLES (their two figures), clipped trees between, and round trees. A garden is a
      // low clipped hedge round a bed of flowers with a clipped tree at its middle (a circle) or at its corners (a
      // triangle); it lies on the lawn's slope. Along the street they lie between the paving and the houses' fronts
      // (their hedge 5.5 m from the street's middle); the rest are scattered. Every number is drawn before the place is
      // tried. A clipped tree keeps its own height and radius, and 5 m more, from the route's line; a round tree its
      // crown's radius and 8 m.
      const Tp = S.topiary, green = [0.035, 0.16, 0.05], flowers = ['#d94f3d', '#e8c23a', '#e9e4f2', '#7a4fb8', '#e07aa8'].map(lin);
      const clip = (lx2, ly, lz2, kd, h, r, sh) => {
        GS.kind(0).col(green, sh);
        if (kd === 0) GS.lathe(lx2, lz2, [[r, ly], [0.05, ly + h]], 9);
        else if (kd === 1) GS.lathe(lx2, lz2, [[r * 0.8, ly], [r * 0.8, ly + h * 0.8], [0.02, ly + h * 0.8]], 10);
        else if (kd === 2) { GS.lathe(lx2, lz2, [[r * 0.3, ly], [r * 0.3, ly + h * 0.4]], 6); GS.ball([lx2, ly + h * 0.4 + r * 0.8, lz2], r, 8); }
        else { GS.lathe(lx2, lz2, [[r, ly], [r * 0.5, ly + h * 0.36], [r * 0.85, ly + h * 0.37], [r * 0.4, ly + h * 0.7], [r * 0.6, ly + h * 0.71], [0.04, ly + h]], 8); }
      };
      const drawGarden = (k = 1) => ({ kd: Tp.int(0, 1), r: Tp.range(4, 8) * k, turn: Tp.range(0, TAU), fc: Tp.pick(flowers), fc2: Tp.pick(flowers), ck: Tp.int(0, 3), ch: Tp.range(2.6, 4.2), cr: Tp.range(0.9, 1.4), sh: Tp.range(0.8, 1.2) });
      const garden = (x, z, o) => {
        if (!free(x, z, o.r + 0.5, 1.5) || lineDist(x, lawnH(x, z) + o.ch, z) < o.ch + o.cr + 5) return false;
        const y = lawnH(x, z), gx = (lawnH(x + 2, z) - lawnH(x - 2, z)) / 4, gz = (lawnH(x, z + 2) - lawnH(x, z - 2)) / 4;
        GS.tr(x, y, z, 0); GS.push(_shear.set(1, 0, 0, 0, gx, 1, gz, 0, 0, 0, 1, 0, 0, 0, 0, 1));
        if (o.kd === 0) {
          GS.kind(0).col(green, o.sh * 1.15); GS.lathe(0, 0, [[o.r, -0.3], [o.r, 0.9], [o.r - 0.8, 0.9], [o.r - 0.8, -0.3]], 22);
          GS.col(o.fc, 0.9); GS.lathe(0, 0, [[o.r - 1.5, 0.1], [o.r * 0.55, 0.1]], 22); GS.col(o.fc2, 0.9); GS.lathe(0, 0, [[o.r * 0.45, 0.1], [o.cr + 0.3, 0.1]], 16);
          clip(0, 0, 0, o.ck, o.ch, o.cr, o.sh);
        } else {
          const P3 = [0, 1, 2].map((k) => [o.r * Math.cos(o.turn + k / 3 * TAU), o.r * Math.sin(o.turn + k / 3 * TAU)]);
          for (let k = 0; k < 3; k++) {
            const a = P3[k], b = P3[(k + 1) % 3], dl = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / dl * 0.4, nz = (b[0] - a[0]) / dl * 0.4;
            GS.kind(0).col(green, o.sh * 1.15);
            GS.hexa([[a[0] - nx, -0.3, a[1] - nz], [b[0] - nx, -0.3, b[1] - nz], [b[0] + nx, -0.3, b[1] + nz], [a[0] + nx, -0.3, a[1] + nz], [a[0] - nx, 0.9, a[1] - nz], [b[0] - nx, 0.9, b[1] - nz], [b[0] + nx, 0.9, b[1] + nz], [a[0] + nx, 0.9, a[1] + nz]]);
            clip(a[0] * 0.72, 0, a[1] * 0.72, (o.ck + k) % 2 ? 0 : 2, o.ch * 0.7, o.cr * 0.75, o.sh);
          }
          GS.col(o.fc, 0.9); GS.tri([P3[0][0] * 0.55, 0.1, P3[0][1] * 0.55], [P3[1][0] * 0.55, 0.1, P3[1][1] * 0.55], [P3[2][0] * 0.55, 0.1, P3[2][1] * 0.55]);
          GS.col(o.fc2, 0.9); GS.lathe(0, 0, [[o.r * 0.16, 0.14], [0.02, 0.14]], 9);
        }
        GS.pop(); GS.pop();
        castShadow([[x - 0.8, z - 0.8, 0], [x + 0.8, z - 0.8, 0], [x + 0.8, z + 0.8, 0], [x - 0.8, z + 0.8, 0], [x, z, o.ch * 0.85]]);
        placed.push({ x, z, r: o.r, h: o.ch });
        return true;
      };
      for (const sd of [-1, 1]) for (let m = M.rim + 18; m < M.court - 6; m += Tp.range(9, 14)) {
        const o = drawGarden(0.5), i = Math.round(m / 2.5), q = route[i], q2 = route[i + 2], tl = Math.hypot(q2.x - q.x, q2.z - q.z) || 1, lat = (5.5 + o.r) * sd;
        garden(q.x - (q2.z - q.z) / tl * lat, q.z + (q2.x - q.x) / tl * lat, o);
      }
      await flushGS();
      const nG = Math.round(64 * dens);
      for (let i = 0; i < nG; i++) {
        const o = drawGarden(1), a = Tp.range(0, TAU), rr = Math.sqrt(Tp.range(0.04, 0.88)) * R;
        garden(wx(rr * Math.cos(a)), rr * Math.sin(a), o);
        if (i % 4 === 3) await rest();
      }
      // the palace's forecourt, the same on both sides of the avenue: a round garden and a three-cornered one, their
      // hedges 6.5 m from the street's middle, and a row of clipped trees 10.5 m from it (the line is 7 m over the
      // paving there: a tree's top stays its own height and radius and 5 m from it)
      for (const sd of [-1, 1]) {
        const o1 = drawGarden(1), o2 = drawGarden(1);
        o1.kd = 0; o1.r = 8; o2.kd = 1; o2.r = 7.5; o2.turn = Math.atan2(hd[1], wx(hd[0])) + (sd > 0 ? 0 : Math.PI / 3);
        const q1 = bowlAt(27, sd * 14.5), q2 = bowlAt(47, sd * 14);
        garden(wx(q1[0]), q1[1], o1); garden(wx(q2[0]), q2[1], o2);
      }
      await rest();
      // clipped trees along the walks and round the basins, as before
      const bush = (x, z) => {
        const h = Tp.range(2.4, 4.4), r = Tp.range(0.9, 1.5), kd = Tp.int(0, 3), sh = Tp.range(0.8, 1.2), y = lawnH(x, z) - 0.2;
        if (lineDist(x, y + h, z) < h + r + 5 || !free(x, z, r, 1.2)) return;
        clip(x, y, z, kd, h, r, sh);
        castShadow([[x - r * 0.7, z - r * 0.7, 0], [x + r * 0.7, z - r * 0.7, 0], [x + r * 0.7, z + r * 0.7, 0], [x - r * 0.7, z + r * 0.7, 0], [x, z, h * 0.85]]);
        placed.push({ x, z, r, h });
      };
      for (const b of basins) {
        const bl = Math.hypot(b.x, b.z), ux = b.x / bl, uz = b.z / bl;
        for (let tt = SHAFT + TERRACE + 6; tt < R - 14; tt += 9) for (const sd of [-1, 1]) bush(ux * tt - uz * 4.5 * sd, uz * tt + ux * 4.5 * sd);
        for (let k = 0; k < 22; k++) { const a = (k + 0.5) / 22 * TAU; bush(b.x + (b.r + 9.8) * Math.cos(a), b.z + (b.r + 9.8) * Math.sin(a)); }
        await rest();
      }
      for (let s = 13; s < COURT + 6; s += 6.5) for (const sd of [-1, 1]) { const q = bowlAt(s, sd * 10.5); bush(wx(q[0]), q[1]); }
      await rest();
      // round trees on the lawn: a trunk and a crown of two masses; the crown keeps its radius and 8 m from the line
      const Bt2 = S.bowltrees, nT = Math.round(54 * dens);
      for (let i = 0; i < nT; i++) {
        const a = Bt2.range(0, TAU), rr = Math.sqrt(Bt2.range(0.05, 0.9)) * R, h = Bt2.range(6, 9.5), cr = Bt2.range(2.2, 3.4), sh = Bt2.range(0.85, 1.25), ox = Bt2.range(-0.8, 0.8), oz = Bt2.range(-0.8, 0.8), warm = Bt2.range(0, 1);
        const x = wx(rr * Math.cos(a)), z = rr * Math.sin(a), y = lawnH(x, z) - 0.2;
        if (!free(x, z, 1.6, 2) || !offWalk(x, z, 1.5) || lineDist(x, y + h - cr, z) < cr + 8) continue;
        const leaf = mulc(mixc([0.05, 0.2, 0.05], [0.16, 0.24, 0.04], warm), sh);
        GS.kind(0).col(C.wood, 1.3); GS.bar([x, y, z], [x + ox * 0.3, y + h - cr, z + oz * 0.3], 0.34, 0.22, 6);
        GS.col(leaf, 1); GS.ball([x + ox * 0.3, y + h - cr * 0.9, z + oz * 0.3], cr, 8, 0.85); GS.col(leaf, 1.18); GS.ball([x + ox, y + h - cr * 0.3, z + oz], cr * 0.66, 7, 0.85);
        castShadow([[x, z, 0], [x - cr * 0.75, z - cr * 0.75, h - cr], [x + cr * 0.75, z - cr * 0.75, h - cr], [x + cr * 0.75, z + cr * 0.75, h - cr], [x - cr * 0.75, z + cr * 0.75, h - cr], [x + ox, z + oz, h]]);
        placed.push({ x, z, r: 1.6, h });
        if (i % 6 === 5) await rest();
      }
      await flushGS();
    }

    // THE WATER'S THINGS (stream 'stones'): stones along the rivulets' banks (close set along the street's rivulet, wider
    // on the rest), a little arched bridge of stone where a ring street crosses a rivulet, and in each basin a fountain:
    // a stem with two bowls and eight jets falling in arcs (it stands at the basin's middle, 34 m from the line).
    {
      const St = S.stones, grey = [0.5, 0.5, 0.47];
      for (let k = 0; k < rivulets.length; k++) {
        const line = rivulets[k], every = k === 0 ? 1 : 3;
        for (let i = 1; i < line.length - 1; i++) {
          const p = line[i], o = line[i - 1], q = line[i + 1], tl = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1, nx = -(q[1] - o[1]) / tl, nz = (q[0] - o[0]) / tl;
          const sd = St.chance(0.5) ? 1 : -1, off = St.range(1.5, 2.3), rr = St.range(0.28, 0.6), sq = St.range(0.5, 0.8), shd = St.range(0.75, 1.15);
          if (i % every === 0) { const x = p[0] + nx * off * sd, z = p[1] + nz * off * sd; GS.kind(0).col(grey, shd); GS.ball([x, lawnH(x, z) + rr * sq * 0.3, z], rr, 5, sq); }
          // a bridge where the rivulet passes a ring street's radius
          const r0 = Math.hypot(p[0], p[1]), r1 = Math.hypot(q[0], q[1]), ring = 69 + 26 * Math.round((r0 - 69) / 26);
          if ((r0 - ring) * (r1 - ring) <= 0 && r0 !== r1 && ring >= 69 && ring <= 199) {
            const f2 = (ring - r0) / (r1 - r0), bx = lerp(p[0], q[0], f2), bz = lerp(p[1], q[1], f2), y = lawnH(bx, bz), a = Math.atan2(bz, bx);
            if (lineDist(bx, y + 2, bz) > 6) {
              GS.tr(bx, y, bz, Math.PI - a);
              for (let s = 0; s < 6; s++) { const z0 = -3 + s, hgt = (zz) => 0.15 + 0.75 * (1 - (zz / 3) * (zz / 3)); GS.kind(0).col(C.stone, s % 2 ? 0.86 : 0.95); GS.hexa([[-1.1, -0.3, z0], [1.1, -0.3, z0], [1.1, -0.3, z0 + 1], [-1.1, -0.3, z0 + 1], [-1.1, hgt(z0), z0], [1.1, hgt(z0), z0], [1.1, hgt(z0 + 1), z0 + 1], [-1.1, hgt(z0 + 1), z0 + 1]]); }
              for (const sx of [-1.1, 1.1]) { GS.col(C.chalk, 1); GS.bar([sx, 0.5, -3], [sx, 1.3, 0], 0.09, 0.09, 4); GS.bar([sx, 1.3, 0], [sx, 0.5, 3], 0.09, 0.09, 4); }
              GS.pop();
            }
          }
        }
        if (k % 3 === 2) await rest();
      }
      for (const b of basins) {
        const y = b.level - 0.45, n = 8, ph = St.range(0, TAU);
        GS.kind(0).col(C.stone, 0.95);
        GS.lathe(b.x, b.z, [[2.2, y - 2.4], [1.6, y + 0.5], [0.5, y + 0.7], [0.4, y + 1.9], [2.6, y + 2.5], [2.7, y + 2.7], [0.5, y + 2.6], [0.35, y + 3.8], [1.4, y + 4.3], [1.45, y + 4.45], [0.2, y + 4.4], [0.14, y + 5.3]], 12);
        GS.kind(1).col(C.copper, 1); GS.ball([b.x, y + 5.5, b.z], 0.26, 6);
        GS.kind(0).col([0.78, 0.9, 0.97], 1);
        for (let k = 0; k < n; k++) {
          const a = ph + k / n * TAU, ca = Math.cos(a), sa = Math.sin(a);
          for (let s = 0; s < 5; s++) { const u0 = s / 5, u1 = (s + 1) / 5, pt = (u) => [b.x + ca * (1.4 + 4.6 * u), y + 4.4 + 2.6 * u - 7 * u * u, b.z + sa * (1.4 + 4.6 * u)]; GS.bar(pt(u0), pt(u1), 0.05 + 0.03 * u0, 0.05 + 0.03 * u1, 4); }
        }
      }
      await flushGS();
    }

    // THE TOWN'S PEOPLE NEAR OUR LINE (stream 'townfolk'): groups on the street and beside it, on the well's terrace, at
    // its balustrade looking down, and before the palace's door. A gentleman walks lost in thought with his head to
    // one side, and his servant a step behind carries a blown bladder on a short stick to rouse him (the flapper); two
    // gentlemen talk, each with his flapper; musicians play (a fiddle, a flute, a harp); a tailor takes a man's measure
    // with a quadrant, his boy with compasses; a man stares at the sky with one arm up. Every figure throws a shadow.
    // A group's numbers are all drawn before its place is tried; no figure's top (2.3 m with a raised arm or stick)
    // comes within 5 m of the route's line, and none stands in a garden, a house, a basin or a rivulet.
    {
      const Tf = S.townfolk, plain = [0.3, 0.27, 0.22];
      const drawGroup = () => ({ kd: Tf.pick([0, 0, 0, 1, 2, 3, 4]), ws: [0, 1, 2, 3].map(() => ({ ...who(Tf), rich: Tf.range(0.1, 6) })), turn: Tf.range(-0.6, 0.6), back: Tf.chance(0.6) });
      const okSpot = (x, y, z) => {
        if (lineDist(x, y + 2.3, z) < 5 || Math.hypot(x, z) < SHAFT + 2.2) return false;
        for (const q of placed) if ((q.x - x) ** 2 + (q.z - z) ** 2 < (q.r + 1.2) ** 2) return false;
        for (const b of basins) if (Math.hypot(x - b.x, z - b.z) < b.r + 1) return false;
        for (const rv2 of rivulets) for (const q of rv2) if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < 4) return false;
        return true;
      };
      // members of each kind of group: [x, z, yaw added, pose, what he carries, a gentleman or a servant]
      const KINDS = [
        [[0, 0, 0, 0, 0, 1], [-0.55, -0.8, 0.25, 4, 1, 0]],
        [[-0.75, 0, Math.PI / 2, 0, 0, 1], [0.75, 0, -Math.PI / 2, 2, 0, 1], [-1.5, -0.75, 0.9, 4, 1, 0], [1.5, -0.75, -1.5, 4, 1, 0]],
        [[-1.15, 0, 0.2, 6, 2, 1], [0, 0.35, 0, 5, 3, 1], [1.15, 0, -0.5, 3, 0, 1]],
        [[0, 0, 0, 7, 0, 1], [0.35, 1.25, Math.PI, 4, 4, 0], [-0.95, 0.85, 2.3, 4, 5, 0]],
        [[0, 0, 0, 2, 0, 1], [-0.6, -0.8, 0.3, 4, 1, 0]],
      ];
      const group = (x, z, face, g, yOf) => {
        const cf = Math.cos(face), sf = Math.sin(face), mem = KINDS[g.kd].map((m, i) => { const px = x + m[0] * cf + m[1] * sf, pz = z - m[0] * sf + m[1] * cf; return { m, px, pz, py: yOf(px, pz), w: g.ws[i] }; });
        for (const p of mem) if (!okSpot(p.px, p.py, p.pz)) return false;
        for (const p of mem) {
          const w = { ...p.w, prop: p.m[4], rich: p.m[5] ? p.w.rich : 0, c: p.m[5] ? p.w.c : plain };
          person(GS, p.px, p.py, p.pz, face + p.m[2], w, p.m[3]);
          if (yOf === onLawn) castShadow([[p.px - 0.3, p.pz - 0.3, 0], [p.px + 0.3, p.pz - 0.3, 0], [p.px + 0.3, p.pz + 0.3, 0], [p.px - 0.3, p.pz + 0.3, 0], [p.px, p.pz, 1.7 * w.h]]);
        }
        if (g.kd === 2) {
          // the harp, standing before the third player
          const hx = x + 1.3 * cf + 0.55 * sf, hz = z - 1.3 * sf + 0.55 * cf, hy = yOf(hx, hz);
          GS.tr(hx, hy, hz, face - 0.5); GS.kind(1).col(C.ochre, 1.2);
          GS.bar([0, 0, 0], [0, 1.5, 0.1], 0.04, 0.03, 4); GS.bar([0, 1.5, 0.1], [0.75, 1.2, 0], 0.035, 0.03, 4); GS.bar([0.75, 1.2, 0], [0.06, 0.08, 0], 0.03, 0.03, 4);
          GS.kind(0).col(C.chalk, 1); for (let k = 1; k < 5; k++) GS.bar([0.15 * k, 1.5 - 0.07 * k, 0.06], [0.15 * k, 0.1 + 0.26 * k, 0], 0.008, 0.008, 3);
          GS.pop();
        }
        return true;
      };
      const onLawn = (x, z) => lawnH(x, z);
      let nG = 0;
      for (let m = M.rim + 16; m < M.kerb - 12; m += Tf.range(6, 10)) {
        const g = drawGroup(), sd = Tf.chance(0.5) ? 1 : -1, lat = Tf.range(4.0, 7.2) * sd, i = Math.round(m / 2.5), q = route[i], q2 = route[i + 2], tl = Math.hypot(q2.x - q.x, q2.z - q.z) || 1, tx = (q2.x - q.x) / tl, tz = (q2.z - q.z) / tl;
        if (group(q.x - tz * lat, q.z + tx * lat, Math.atan2(tx, tz) + (g.back ? 0 : Math.PI) + g.turn, g, onLawn)) nG++;
        if (nG % 4 === 3) await rest();
      }
      for (let k = 0; k < Math.round(12 * dens); k++) {
        const g = drawGroup(), a = Tf.range(0, TAU), rr = SHAFT + Tf.range(4.5, 9.5);
        group(wx(rr * Math.cos(a)), rr * Math.sin(a), yawTo(-Math.cos(a), -Math.sin(a)) + g.turn * 2, g, onLawn);
      }
      await rest();
      for (let k = 0; k < 4; k++) { const g = drawGroup(), u = Tf.range(-15, 15), w2 = Tf.range(15, 18.5), p = PAL.toW(u, w2); group(p[0], p[1], PAL.yaw + g.turn, g, () => PAL.y); }
      // at the balustrade, looking down the well (hands on the rail, or one arm pointing)
      for (let k = 0; k < Math.round(26 * dens); k++) {
        const a = Tf.range(0, TAU), w = { ...who(Tf), rich: Tf.range(0.1, 6) }, pose = Tf.chance(0.75) ? 3 : 2, x = wx((SHAFT + 1.75) * Math.cos(a)), z = (SHAFT + 1.75) * Math.sin(a);
        if (lineDist(x, TOP + 2.6, z) < 5) continue;
        person(GS, x, TOP + 0.35, z, yawTo(-Math.cos(a), -Math.sin(a)), w, pose);
      }
      await flushGS();
    }

    // PEOPLE WALKING (stream 'townwalk'; one instanced mesh, moved on the clock): up and down the street on its paving,
    // 0.8 to 2.4 m to either side of its middle (the line is 7 m over the paving: a head stays 5 m under it; the standing
    // groups keep 4 m and more from the middle, so nobody walks through them), and round
    // the well's terrace, back and forth on the arc that leaves out 30 degrees to each side of where the line crosses
    // the kerb. Their ground's height is read once, along the street and round each one's circle.
    const town = [], streetTab = [];
    let townMesh = null;
    {
      const Tw = S.townwalk, i0 = Math.round((M.rim + 12) / 2.5), i1 = Math.round((M.kerb - 14) / 2.5);
      for (let i = i0; i <= i1; i++) { const q = route[i], q2 = route[i + 1], tl = Math.hypot(q2.x - q.x, q2.z - q.z) || 1; streetTab.push([q.x, lawnH(q.x, q.z), q.z, (q2.x - q.x) / tl, (q2.z - q.z) / tl]); }
      for (let k = 0; k < Math.round(30 * dens); k++) town.push({ lat: Tw.range(0.8, 2.4) * (Tw.chance(0.5) ? 1 : -1), v: Tw.range(1.0, 1.5) / 2.5, ph: Tw.range(0, 2 * (i1 - i0)), h: Tw.range(0.92, 1.08), c: Tw.pick(C.robes), tone: Tw.range(0.7, 1) });
      const aK = Math.atan2(KERB[1], wx(KERB[0]));
      for (let k = 0; k < Math.round(24 * dens); k++) {
        const r = SHAFT + Tw.range(3.5, 9), q = { ring: r, v: Tw.range(1.0, 1.5) / r, ph: Tw.range(0, 2), h: Tw.range(0.92, 1.08), c: Tw.pick(C.robes), tone: Tw.range(0.7, 1), ys: [] };
        for (let j = 0; j <= 20; j++) { const a = aK + Math.PI / 6 + j / 20 * (TAU - Math.PI / 3); q.ys.push(lawnH(r * Math.cos(a), r * Math.sin(a))); }
        town.push(q);
      }
      const Gw = makeGeo();
      person(Gw, 0, 0, 0, 0, { h: 1, c: [1, 1, 1], tone: 1, tilt: 0.1, skin: 1.6, rich: 1 });
      townMesh = new THREE.InstancedMesh(Gw.build(), solidMat, town.length);
      const _c = new THREE.Color();
      town.forEach((q, i) => townMesh.setColorAt(i, _c.setRGB(q.c[0] * q.tone, q.c[1] * q.tone, q.c[2] * q.tone)));
      townMesh.frustumCulled = false;
      scene.add(townMesh);
      town.aK = aK;
      await ctx.yield();
    }
    const moveTown = (time) => {
      const nS = streetTab.length - 1, arc = TAU - Math.PI / 3;
      for (let i = 0; i < town.length; i++) {
        const q = town[i];
        let x, y, z, yaw;
        if (q.ring) {
          const t = (time * q.v / arc + q.ph) % 2, s = t < 1 ? t : 2 - t, a = town.aK + Math.PI / 6 + s * arc, f = s * 20, j = Math.min(19, Math.floor(f)), fw = t < 1 ? 1 : -1;
          x = q.ring * Math.cos(a); z = q.ring * Math.sin(a); y = lerp(q.ys[j], q.ys[j + 1], f - j); yaw = Math.atan2(-Math.sin(a) * fw, Math.cos(a) * fw);
        } else {
          const t = (time * q.v + q.ph) % (2 * nS), s = t < nS ? t : 2 * nS - t, j = Math.min(nS - 1, Math.floor(s)), f = s - j, A = streetTab[j], B = streetTab[j + 1], fw = t < nS ? 1 : -1;
          x = lerp(A[0], B[0], f) - A[4] * q.lat; z = lerp(A[2], B[2], f) + A[3] * q.lat; y = lerp(A[1], B[1], f); yaw = Math.atan2(A[3] * fw, A[4] * fw);
        }
        y += 0.035 * Math.abs(Math.sin(time * 5.2 + i * 1.7));
        _fm.compose(_fp.set(x, y, z), _fq.setFromEuler(_fe.set(0, yaw, 0)), _fs.set(q.h, q.h, q.h));
        townMesh.setMatrixAt(i, _fm);
      }
      townMesh.instanceMatrix.needsUpdate = true;
    };
    moveTown(0);

    // islanders on the walks (far ones: 25 m from the route; a flapper goes with each pair), kites on their strings (the
    // string keeps 8 m from the route's line, and its own sway and the kite's size more toward the kite: 4 m of sway
    // and the kite at the top, none at the hand), the rim's parapet
    {
      const Fg = S.figures, nW = Math.round(70 * dens);
      for (let i = 0; i < nW; i++) {
        const b = Fg.pick(basins), bl = Math.hypot(b.x, b.z), t = Fg.range(SHAFT + 8, R - 12), off = Fg.range(-1.1, 1.1), ring = Fg.chance(0.3), ar = Fg.range(0, TAU), pair = Fg.chance(0.45);
        const x = ring ? b.x + (b.r + 4.5 + off) * Math.cos(ar) : b.x / bl * t - b.z / bl * off, z = ring ? b.z + (b.r + 4.5 + off) * Math.sin(ar) : b.z / bl * t + b.x / bl * off;
        const w1 = who(Fg), w2 = who(Fg), yw = Fg.range(0, TAU);
        if (Math.hypot(x - b.x, z - b.z) < b.r + 2.5 || lineDist(x, lawnH(x, z) + 1, z) < 25) continue;
        person(GS, x, lawnH(x, z), z, yw, w1);
        if (pair) person(GS, x + 0.7, lawnH(x + 0.7, z + 0.6), z + 0.6, yw + 0.4, { ...w2, prop: 1, c: [0.3, 0.27, 0.22] }, 4);
        if (i % 24 === 23) await ctx.yield();
      }
      await ctx.yield();
      const Kt = S.kites, nK = Math.round(11 * dens), wa = Kt.range(0, TAU), wind = [Math.cos(wa), Math.sin(wa)];
      for (let i = 0; i < nK; i++) {
        const a = Kt.range(0, TAU), r = Kt.range(45, R - 25), up = Kt.range(26, 56), lee = up * Kt.range(0.4, 0.8), ph = Kt.range(0, TAU), c = Kt.pick(C.cloth), size = Kt.range(1.3, 2.0);
        const x = r * Math.cos(a), z = r * Math.sin(a), y = lawnH(x, z) + 1.2, K = [x + wind[0] * lee, y + up, z + wind[1] * lee];
        let ok = Math.hypot(K[0], K[2]) < R - 10;
        for (let t = 0; ok && t <= 1; t += 0.1) if (lineDist(lerp(K[0], x, t), lerp(K[1], y, t), lerp(K[2], z, t)) < 8 + (size + 4) * (1 - t)) ok = false;
        if (!ok) continue;
        addThread(K, [x, y, z], 4, 0.03, ph, [0.62, 0.6, 0.55], 10);
        addBead(K, [x, y, z], 4, ph, 2, 0, size, 0, c);
        addBead(K, [x, y, z], 4, ph, 2, 0, size * 0.3, 0.035, [0.9, 0.86, 0.7]);
      }
      await ctx.yield();
      GS.kind(0).col(C.stone, 0.95);
      GS.lathe(0, 0, [[R - 0.8, RIM - 0.2], [R - 0.8, RIM + 1.0], [R - 0.1, RIM + 1.0], [R - 0.1, RIM - 0.4]], 144);
      // poles with long pennants in two colours by turns: on the parapet, one every 10 m or so round the whole rim,
      // and a row of taller ones down each side of the palace's forecourt (15.5 m from the street's middle, every 9 m). A pole keeps
      // 7 m and its pennant's length from the route's line at its top, and 7 m at its middle.
      const Pn = S.pennants, nP = Math.round(TAU * R / 10);
      const pole = (x, y, z, yaw, hp, len, c, c2) => {
        if (lineDist(x, y + hp, z) < 7 + len || lineDist(x, y + hp * 0.5, z) < 7) return;
        GS.tr(x, y, z, yaw);
        GS.kind(0).col(C.wood, 1.6); GS.bar([0, 0, 0], [0, hp, 0], 0.09, 0.06, 5);
        for (let k = 0; k < 6; k++) { const u0 = k / 6, u1 = (k + 1) / 6; cloth(GS, [[u0 * len, hp - 0.1 - u0 * 0.35, 0], [u0 * len, hp - 1.4 + u0 * 0.35, 0], [u1 * len, hp - 1.4 + u1 * 0.35, 0], [u1 * len, hp - 0.1 - u1 * 0.35, 0]], [u0 * 0.9, u0 * 0.9, u1 * 0.9, u1 * 0.9], [0, 0, 1], k % 2 ? c2 : c); }
        GS.pop();
      };
      for (let i = 0; i < nP; i++) {
        const a = (i + Pn.range(0.2, 0.8)) / nP * TAU, hp = Pn.range(6, 8.5), len = Pn.range(4, 6.5), c = Pn.pick(C.cloth), c2 = Pn.pick(C.cloth), r = R - 0.45;
        pole(r * Math.cos(a), RIM + 1, r * Math.sin(a), Math.PI / 2 - a, hp, len, c, c2);
        if (i % 20 === 19) await rest();
      }
      for (let s = 16; s < COURT + 12; s += 9) for (const sd of [-1, 1]) {
        const hp = Pn.range(9, 10.5), len = Pn.range(6, 7.5), c = Pn.pick(C.cloth), c2 = Pn.pick(C.cloth), q = bowlAt(s, sd * 15.5), x = wx(q[0]);
        pole(x, lawnH(x, q[1]) - 0.2, q[1], yawTo(hd[0], hd[1]) + Math.PI / 2, hp, len, c, c2);
      }
      await ctx.yield();
    }
    // the instruments that turn on the roofs (two shapes, instanced; turned by the clock in update)
    const spinMeshes = [];
    {
      const unit = [makeGeo(), makeGeo()];
      unit[0].kind(1).col(C.copper, 1);
      unit[0].hoop([0, 0, 0], [0, 0, 1], 1.0, 0.05, 16, 4).hoop([0, 0, 0], [1, 0, 0], 0.92, 0.05, 16, 4).hoop([0, 0, 0], [0, 1, 0], 0.84, 0.05, 16, 4);
      unit[0].bar([0, -1.15, 0], [0, 1.15, 0], 0.035, 0.035, 4).ball([0, 0, 0], 0.2, 6);
      unit[1].kind(1).col(C.copper, 1);
      unit[1].ball([0, 0, 0], 0.3, 8).bar([-1.25, 0, 0], [0.95, 0, 0], 0.035, 0.035, 4).bar([0, 0, -0.7], [0, 0, 1.05], 0.035, 0.035, 4);
      unit[1].ball([-1.25, 0, 0], 0.17, 6).ball([0.95, 0, 0], 0.12, 6).ball([0, 0, 1.05], 0.14, 6).ball([0, 0, -0.7], 0.09, 6);
      const _e = new THREE.Euler();
      for (let k = 0; k < 2; k++) {
        const list = spinners[k];
        if (!list.length) continue;
        const mesh = new THREE.InstancedMesh(unit[k].build(), solidMat, list.length);
        for (const sp of list) sp.q = new THREE.Quaternion().setFromEuler(_e.set(sp.tilt * (k ? 0.3 : 1), sp.yaw, 0, 'YXZ'));
        mesh.frustumCulled = false;
        scene.add(mesh);
        spinMeshes.push({ mesh, list });
      }
    }
    const _sm = new THREE.Matrix4(), _sq = new THREE.Quaternion(), _sq2 = new THREE.Quaternion(), _sp = new THREE.Vector3(), _ss = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    const turnSpinners = (time) => {
      for (const { mesh, list } of spinMeshes) {
        for (let i = 0; i < list.length; i++) {
          const sp = list[i];
          _sq.copy(sp.q).multiply(_sq2.setFromAxisAngle(_up, time * sp.speed + sp.ph));
          mesh.setMatrixAt(i, _sm.compose(_sp.set(sp.x, sp.y, sp.z), _sq, _ss.set(sp.s, sp.s, sp.s)));
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    };
    turnSpinners(0);
    // the shadows of the houses and the topiary, laid on the lawn (multiplied in)
    if (SHD.idx.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(SHD.pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(SHD.k, 1)); g.setIndex(SHD.idx);
      const shadeCol = night ? v3(0.72, 0.76, 0.86) : golden ? v3(0.42, 0.42, 0.62) : v3(0.4, 0.5, 0.66);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uShadeCol: { value: shadeCol } }, vertexShader: SHADE_VERT, fragmentShader: SHADE_FRAG, transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.renderOrder = 1;
      scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the sea's things: fishing boats at anchor (two or three beside the
    // opening's line, one and a half to two mast heights from it; the rest scattered; all 14 m or more from the route), the
    // island's shadow on the sea
    const boats = [];
    let boatMesh = null;
    {
      const Bt = S.boats, G = makeGeo(), MAST = 9;
      const side = (sd) => {
        const gs = [-4, 0.9, 1.3 * sd], gm = [0.6, 0.85, 1.65 * sd], ks = [-3.6, -0.5, 0.5 * sd], km = [0.6, -0.6, 0.7 * sd], bow = [4.7, 1.25, 0], kb = [3.9, -0.4, 0];
        G.kind(0).col([0.2, 0.12, 0.07], 1); G.quad(ks, km, gm, gs); G.tri(km, kb, bow); G.tri(km, bow, gm);
        return [gs, gm, ks, bow];
      };
      const L = side(-1), Rr = side(1);
      G.quad(L[2], Rr[2], Rr[0], L[0]);
      G.col([0.55, 0.43, 0.27], 1); G.quad([L[0][0], 0.6, L[0][2]], [Rr[0][0], 0.6, Rr[0][2]], [Rr[1][0], 0.6, Rr[1][2]], [L[1][0], 0.6, L[1][2]]); G.tri([L[1][0], 0.6, L[1][2]], [Rr[1][0], 0.6, Rr[1][2]], [4.2, 0.9, 0]);
      G.col([0.3, 0.2, 0.12], 1); G.bar([0.3, 0.5, 0], [0.3, MAST, 0], 0.1, 0.05, 5); G.bar([0.3, 8.5, 0], [-3.6, 6.6, 0.5], 0.05, 0.04, 4);
      G.col(C.sail, 1); G.quad([0.3, 8.4, 0.06], [0.3, 1.9, 0.06], [-3.5, 2.1, 0.7], [-3.5, 6.5, 0.5]); G.tri([0.45, 7.4, 0], [4.6, 1.6, 0], [0.5, 2.0, 0]);
      // a boat keeps 30 m off the shore, 30 m from the next boat, and from the route its own half length (4.7) and two
      // and a half of its beam (3.3) more; every number of a boat is drawn before it is tested
      const HALF = 4.7, BEAM = 3.3;
      const tryBoat = (xc, z, Bs) => {
        const x = wx(xc), b = { x, z, head: Bs.range(0, TAU), ph: Bs.range(0, TAU), tint: Bs.range(0.75, 1.15) };
        if (xc - shoreX(z) < 30 || lineDist(x, 5, z) < HALF + 2.5 * BEAM) return;
        for (const o of boats) if ((o.x - x) ** 2 + (o.z - z) ** 2 < 30 * 30) return;
        boats.push(b);
      };
      // under each petition thread that comes down over the shallows a boat lies with two people in it, one reaching up
      // for the thread (they are a mesh of their own that rides the boat); these boats alone keep the boats' stream:
      // the anchorage and the scatter below have a stream each, so how many threads come down deals no other boat anew
      for (const [xc, z] of petitionBoats) {
        const x = wx(xc), b = { x, z, head: Bt.range(0, TAU), ph: Bt.range(0, TAU), tint: Bt.range(0.75, 1.15), crew: [who(Bt), who(Bt)] };
        if (lineDist(x, 5, z) < HALF + 2.5 * BEAM || boats.some((o) => (o.x - x) ** 2 + (o.z - z) ** 2 < 30 * 30)) continue;
        const Gc = makeGeo();
        person(Gc, -1.2, 0.6, 0, -Math.PI / 2, b.crew[0], 2); person(Gc, -2.9, 0.6, 0.2, Math.PI / 2, b.crew[1], 0);
        b.mesh = new THREE.Mesh(Gc.build(), solidMat); b.mesh.matrixAutoUpdate = false; b.mesh.frustumCulled = false;
        scene.add(b.mesh);
        boats.push(b);
      }
      // the anchorage along the surf: over the whole approach (from the entry to the plate's edge) a boat lies every
      // 40 to 55 m of the route, to one side or the other by its draw, one and a half to two mast heights from the line
      const Ba = S.anchorage, Bc = S.scatter;
      for (let m = Ba.range(15, 40); m < M.edgeIn; m += Ba.range(40, 55)) {
        const q = route[Math.round(m / 2.5)], lat = (HALF + MAST * Ba.range(1.5, 2.0)) * (Ba.chance(0.5) ? 1 : -1), dz = Ba.range(-6, 6);
        tryBoat(hand * q.x + lat, q.z + dz, Ba);
      }
      // the rest lie about the bay, out to 560 m from the axis on the seaward side
      const nBoat = Math.min(24, boats.length + Math.round(13 * dens));
      for (let i = 0; i < 60 && boats.length < nBoat; i++) { const a = Bc.range(-1.9, 1.9), r = Bc.range(60, 560); tryBoat(r * Math.cos(a), r * Math.sin(a), Bc); }
      if (boats.length) {
        boatMesh = new THREE.InstancedMesh(G.build(), solidMat, boats.length);
        const _c = new THREE.Color();
        boats.forEach((b, i) => { boatMesh.setColorAt(i, _c.setRGB(b.tint, b.tint, b.tint)); if (i < 24) boatsU.value[i].set(b.x, b.z, -b.head, 1 + b.ph); });
        boatMesh.frustumCulled = false;
        scene.add(boatMesh);
      }
      // the shadow on the sea: one sheet just over the swell, darkening and blueing the water where the island or a
      // cloud stands between it and the sun (the land's own shader does the same for the fields)
      if (sunDir.y > 0.05) {
        const g = new THREE.PlaneGeometry(6400, 6400).rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, shaderMat(WORLD_VERT, SEASHADE_FRAG, { uShadeCol: { value: night ? v3(0.7, 0.74, 0.84) : golden ? v3(0.5, 0.46, 0.6) : v3(0.42, 0.52, 0.7) } }, { transparent: true, depthWrite: false, blending: THREE.MultiplyBlending }));
        m.position.set(0, 1.3, 0);
        m.renderOrder = 3;
        scene.add(m);
      }
      await ctx.yield();
    }
    const _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion(), _be = new THREE.Euler(), _bp = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
    const bobBoats = (time) => {
      if (!boatMesh) return;
      for (let i = 0; i < boats.length; i++) {
        const b = boats[i];
        _be.set(0.07 * Math.sin(time * 0.9 + b.ph), b.head, 0.05 * Math.sin(time * 0.7 + b.ph * 1.7), 'YXZ');
        boatMesh.setMatrixAt(i, _bm.compose(_bp.set(b.x, ocean.heightAt(b.x, b.z, time) - 0.15, b.z), _bq.setFromEuler(_be), _one));
        if (b.mesh) b.mesh.matrix.copy(_bm);
      }
      boatMesh.instanceMatrix.needsUpdate = true;
    };
    bobBoats(0);

    // ------------------------------------------------------------ the land's things: a village by the shore where the shadow's edge
    // lies at the opening (square houses with pitched roofs: the people below build with right angles), and trees by the hedges
    {
      const Vg = S.village, zc = -190 + Vg.range(-25, 25), xc0 = shoreX(zc) - 80;
      const cottage = (xc, z, yaw, w, d, h, roofC, wallC) => {
        const x = wx(xc), y = landH(xc, z) - 0.3;
        GS.tr(x, y, z, hand > 0 ? yaw : Math.PI - yaw);
        GS.kind(0).col(wallC, 1); GS.box(-w, 0, -d, w, h, d);
        const rh = d * 0.95;
        GS.col(roofC, 1); GS.quad([-w - 0.3, h - 0.2, d + 0.35], [w + 0.3, h - 0.2, d + 0.35], [w + 0.3, h + rh, 0], [-w - 0.3, h + rh, 0]); GS.quad([w + 0.3, h - 0.2, -d - 0.35], [-w - 0.3, h - 0.2, -d - 0.35], [-w - 0.3, h + rh, 0], [w + 0.3, h + rh, 0]);
        GS.col(wallC, 0.92); GS.tri([-w, h, d], [-w, h, -d], [-w, h + rh, 0]); GS.tri([w, h, -d], [w, h, d], [w, h + rh, 0]);
        GS.kind(5).col(C.dark, 1); GS.quad([-w * 0.5, h * 0.35, d + 0.05], [-w * 0.2, h * 0.35, d + 0.05], [-w * 0.2, h * 0.7, d + 0.05], [-w * 0.5, h * 0.7, d + 0.05]); GS.quad([w * 0.2, h * 0.35, d + 0.05], [w * 0.5, h * 0.35, d + 0.05], [w * 0.5, h * 0.7, d + 0.05], [w * 0.2, h * 0.7, d + 0.05]);
        GS.pop();
      };
      const nV = Math.round(38 * dens), took = [], roofs = [], heads = [];
      for (let i = 0; i < nV * 3 && took.length < nV; i++) {
        const a = Vg.range(0, TAU), r = 70 * Math.sqrt(Vg()), xc = xc0 + r * Math.cos(a) * 0.8, z = zc + r * Math.sin(a) * 1.3;
        const w = Vg.range(3, 4.6), d = Vg.range(2.2, 3), h = Vg.range(2.6, 3.8), yaw = Vg.pick([0, Math.PI / 2]) + Vg.range(-0.25, 0.25), red = Vg.chance(0.6);
        const rk = Vg.range(0, 1), wk = Vg.range(0.8, 1.05), roofC = red ? mulc(C.ore, lerp(0.7, 1, rk)) : mulc(C.ochre, lerp(0.5, 0.75, rk));
        if (shoreX(z) - xc < 26 || took.some((q) => (q[0] - xc) ** 2 + (q[1] - z) ** 2 < 11 * 11)) continue;
        took.push([xc, z]);
        roofs.push({ xc, z, yaw, w: w + 0.3, d: d + 0.35, c: roofC });
        cottage(xc, z, yaw, w, d, h, roofC, mulc(C.chalk, wk));
      }
      // the church: a nave and a square tower with a slate spire
      {
        const x = wx(xc0), y = landH(xc0, zc) - 0.3;
        took.push([xc0, zc]);
        GS.tr(x, y, zc, 0.3);
        GS.kind(0).col(C.chalk, 0.95); GS.box(-7, 0, -3, 5, 6, 3, mulc(C.slate, 0.9)); GS.box(5, 0, -2.6, 10, 15, 2.6);
        GS.col(C.slate, 0.9); GS.lathe(7.5, 0, [[3.6, 15], [0.05, 26]], 4, Math.PI / 4, Math.PI / 4 + TAU);
        GS.quad([-7, 6, 3], [5, 6, 3], [5, 9.5, 0], [-7, 9.5, 0]); GS.quad([5, 6, -3], [-7, 6, -3], [-7, 9.5, 0], [5, 9.5, 0]);
        GS.pop();
      }
      await ctx.yield();
      // trees over the fields (none on the sand): a stem and a head of three masses, each tree its own height, lean and
      // green; a tree keeps its own head's radius and two and a half of its head's widths from the route
      const Tr = S.trees, nT = Math.round(170 * dens);
      for (let i = 0; i < nT; i++) {
        const z = Tr.range(-760, 620), xc = shoreX(z) - Tr.range(34, 620), s = Tr.range(4.5, 10), sh = Tr.range(0.7, 1.15);
        const lean = [Tr.range(-0.12, 0.12) * s, Tr.range(-0.12, 0.12) * s], lobes = [0, 1].map(() => [Tr.range(0, TAU), Tr.range(0.3, 0.45), Tr.range(0.36, 0.48), Tr.range(0.55, 0.8)]);
        const x = wx(xc), y = landH(xc, z), rH = s * 0.5;
        if (took.some((q) => (q[0] - xc) ** 2 + (q[1] - z) ** 2 < 7 * 7) || lineDist(x, y + s, z) < rH * 6) continue;
        const top = [x + lean[0], y + s * 0.62, z + lean[1]];
        GS.kind(0).col([0.16, 0.1, 0.06], 1); GS.bar([x, y - 0.3, z], top, s * 0.06, s * 0.035, 5);
        GS.col([0.045, 0.19, 0.05], sh); GS.ball([top[0], top[1] + s * 0.22, top[2]], rH, 7, 0.8);
        for (const [a, off, rr, hh] of lobes) { GS.col([0.06, 0.24, 0.06], sh * 0.9); GS.ball([top[0] + Math.cos(a) * s * off, top[1] + s * (hh - 0.62) * 0.6, top[2] + Math.sin(a) * s * off], s * rr, 6, 0.75); }
        heads.push({ xc: xc + hand * lean[0], z: z + lean[1], r: rH, s, sh, lobes });
        if (i % 12 === 11) await rest();
      }
      await flushGS();
      // the map of these things for the mirror (the plate shows them from over them): roofs with their two slopes lit
      // by the sun's side, the church, the trees' heads and their shadows; drawn once, in canonical metres
      {
        const N = detail < 1 ? 1024 : 2048, cv = document.createElement('canvas');
        cv.width = cv.height = N;
        const g2 = cv.getContext('2d'), k = N / MAPBOX[2];
        g2.setTransform(k, 0, 0, -k, -MAPBOX[0] * k, N + MAPBOX[1] * k);
        const css = (c, m = 1) => 'rgb(' + c.map((v) => Math.round(255 * Math.pow(clamp(v * m, 0, 1), 1 / 2.2))).join(',') + ')';
        const sunC = [Math.cos(sunAng), Math.sin(sunAng)], shLen = 1 / Math.tan(el);
        g2.fillStyle = 'rgba(8,16,14,0.5)';
        for (const q of heads) { g2.beginPath(); g2.ellipse(q.xc - sunC[0] * q.s * shLen * 0.8, q.z - sunC[1] * q.s * shLen * 0.8, q.r * 1.2, q.r * 1.2, 0, 0, TAU); g2.fill(); }
        for (const q of roofs) {
          g2.save(); g2.translate(q.xc, q.z); g2.rotate(-q.yaw);
          const side = Math.sin(q.yaw) * sunC[0] + Math.cos(q.yaw) * sunC[1];
          g2.fillStyle = css(q.c, 0.8 + 0.3 * side); g2.fillRect(-q.w, 0, 2 * q.w, q.d);
          g2.fillStyle = css(q.c, 0.8 - 0.3 * side); g2.fillRect(-q.w, -q.d, 2 * q.w, q.d);
          g2.restore();
        }
        g2.save(); g2.translate(xc0, zc); g2.rotate(-0.3);
        g2.fillStyle = css(C.slate, 0.95); g2.fillRect(-7, 0, 12, 3); g2.fillStyle = css(C.slate, 0.7); g2.fillRect(-7, -3, 12, 3);
        g2.fillStyle = css(C.chalk, 0.9); g2.fillRect(5, -2.6, 5, 5.2);
        g2.fillStyle = css(C.slate, 0.85); g2.beginPath(); g2.moveTo(7.5, -3.4); g2.lineTo(10.9, 0); g2.lineTo(7.5, 3.4); g2.lineTo(4.1, 0); g2.fill();
        g2.restore();
        await ctx.yield();
        for (let i = 0; i < heads.length; i++) {
          const q = heads[i];
          if (i % 60 === 59) await ctx.yield();
          g2.fillStyle = css([0.045, 0.19, 0.05], q.sh * 0.8); g2.beginPath(); g2.arc(q.xc, q.z, q.r, 0, TAU); g2.fill();
          for (const [a, off, rr] of q.lobes) { g2.fillStyle = css([0.06, 0.24, 0.06], q.sh * 0.95); g2.beginPath(); g2.arc(q.xc + hand * Math.cos(a) * q.s * off, q.z + Math.sin(a) * q.s * off, q.s * rr, 0, TAU); g2.fill(); }
          g2.fillStyle = css([0.1, 0.34, 0.09], q.sh); g2.beginPath(); g2.arc(q.xc + sunC[0] * q.r * 0.3, q.z + sunC[1] * q.r * 0.3, q.r * 0.55, 0, TAU); g2.fill();
        }
        await ctx.yield();
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = ANISO;
        landMapU.value = tex;
      }
      await ctx.yield();
    }

    // ------------------------------------------------------------ clouds round the island (the kit's; they drift, and are kept out of an
    // upright drum 85 m wider than the island, from under the sea to 80 m over the rim: the whole route lies inside it or
    // under the lowest cloud base) and four flocks of white birds, each on a loop of its own beside a stretch of the route
    const clouds = makeCloudField({ rng: S.clouds, sky, count: 12, altitude: 150, altitudeJitter: 110, center: [0, 0, 0], extent: [2000, 2000], size: [150, 280],
      avoid: [[0, RIM + 80, 0, R + 85, -20, R + 85]], wind: [hand * 1.3, 0, 0.5] });
    scene.add(clouds.object);
    await ctx.yield();
    const col3 = (v) => new THREE.Color(v.x, v.y, v.z);
    const fauna = F.makeFauna(scene, { light: { sunDir: sunDir.clone(), sunColor: col3(LIGHT.sun), sunIntensity: night ? 1 : 1.6, sky: col3(LIGHT.sky), skyIntensity: 1.5, ground: col3(LIGHT.ground), groundIntensity: 1.5 } });
    {
      const loop = (cx, cy, cz, r, lift) => { const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; pts.push([wx(cx + r * Math.cos(a)), cy + lift * Math.sin(2 * a), cz + r * Math.sin(a)]); } return pts; };
      // a flock flies only if every point of its loop keeps the flock's own spread and 17 m more from the route
      const flock = (rng, count, spread, pts) => {
        for (const p of pts) if (lineDist(p[0], p[1], p[2]) < spread[0] + 17) return;
        fauna.add(F.makeFlock({ rng, species: 'gulls', count, spread, route: pts, closed: true }));
      };
      // beside the climb: off the middle of the climb's circle (half-way round it), 95 m out, at the middle tier's
      // height, a loop of 40 m (the nearest bird 30 m from the line)
      const nG = Math.round(24 * dens), aM = RT.a2 + RT.sweepC * 0.5;
      flock(S.gulls, nG, [20, 8, 30], loop((Rc + 95) * Math.cos(aM), 112, (Rc + 95) * Math.sin(aM), 40, 14));
      await ctx.yield();
      // over the bowl: 60 m over the shaft's lip (the route is 26 m or more under the lowest bird)
      flock(S.gulls2, nG, [24, 8, 30], loop(0, TOP + 62, 0, 72, 6));
      await ctx.yield();
      // over the anchorage: 75 m to seaward of the approach's middle (half-way from the entry to the plate's edge)
      const q0 = route[Math.round(M.edgeIn / 2 / 2.5)];
      flock(S.gulls3, Math.round(nG * 0.7), [16, 6, 20], loop(hand * q0.x + 75, 36, q0.z, 28, 5));
      // off the rim beyond the climb's top (15 degrees further round than where the climb's circle ends, 60 m outside
      // the rim, 14 m over it): in the look along the rim as we come up to it
      { const aT = RT.aF0 + Math.PI / 12; flock(S.gulls4, Math.round(nG * 0.8), [12, 5, 16], loop((R + 60) * Math.cos(aT), RIM + 14, (R + 60) * Math.sin(aT), 18, 4)); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the rare visit: the stone is turned hard over, the rivulets run out
    // to the rim instead of in, and on the low side one of them pours off the rim into the sea: a thin fall beside the climb
    // (it leaps clear of the galleries; no nearer than 12 m to the route, tested on its own points)
    if (rare) {
      const Fl = S.fall, aF = RT.a2 + RT.sweepC * Fl.range(0.35, 0.65), ca = Math.cos(aF), sa = Math.sin(aF), hw = Fl.range(3.2, 4.6);
      const pos = [], flow = [], idx = [], n = 28;
      let ok = true;
      for (let i = 0; i <= n; i++) {
        const t = i / n, d = t * (RIM + 1), y = RIM + 1.2 - d, r = R - 0.4 + 9 * Math.sqrt(Math.min(1, d / 26)) + 0.012 * d, w = hw * (1 + 0.7 * t);
        if (lineDist(wx(r * ca), y, r * sa) < 12 + w) ok = false;
        for (const sd of [-1, 1]) { pos.push(wx(r * ca - sa * w * sd), y, r * sa + ca * w * sd); flow.push(d, sd, w); }
      }
      // its feeder: from 34 m inside the rim, over the parapet
      const feed = [];
      for (let i = 0; i <= 9; i++) { const r = R - 34 + i * 3.75, x = wx(r * ca), z = r * sa; feed.push([x, Math.max(lawnH(x, z) + 0.16, r > R - 2 ? RIM + 1.15 : 0), z]); }
      if (ok) {
        for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const base = pos.length / 3;
        feed.forEach((p, i) => { for (const sd of [-1, 1]) { pos.push(p[0] - hand * sa * hw * 0.8 * sd, p[1], p[2] + ca * hw * 0.8 * sd); flow.push(i * 3.75, sd, hw * 0.8); } });
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 3));
        const gFall = g.clone(), gFeed = g;
        gFall.setIndex(idx);
        const idx2 = []; for (let i = 0; i < 9; i++) { const a = base + i * 2; idx2.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        gFeed.setIndex(idx2);
        const fall = new THREE.Mesh(gFall, shaderMat(WATER_VERT, WATER_FRAG, { ...waterU, uMode: { value: 2 }, uFlowK: { value: 1 }, uDrops: { value: noDrops } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        const feeder = new THREE.Mesh(gFeed, shaderMat(WATER_VERT, WATER_FRAG, { ...waterU, uMode: { value: 0 }, uFlowK: { value: 1 }, uDrops: { value: noDrops } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        fall.renderOrder = 4; feeder.renderOrder = 2;
        scene.add(fall, feeder);
      }
      await ctx.yield();
    }

    // ------------------------------------------------------------ the meshes of all the built things and of the threads
    await flushGS();
    const pixU = { value: 2 / 720 };
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(TH.pos, 3));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(TH.b, 3));
      g.setAttribute('aP', new THREE.Float32BufferAttribute(TH.p, 4));
      g.setAttribute('aQ', new THREE.Float32BufferAttribute(TH.q, 4));
      g.setAttribute('color', new THREE.Float32BufferAttribute(TH.col, 3));
      g.setIndex(TH.idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 100, 0), R + 120);
      const m = new THREE.Mesh(g, shaderMat(THREAD_VERT, THREAD_FRAG, { uPixH: pixU }, { vertexColors: true, side: THREE.DoubleSide, transparent: true }));
      m.renderOrder = 3;
      scene.add(m);
    }
    const _size = new THREE.Vector2();
    await ctx.yield();

    // ------------------------------------------------------------ the cave with the lodestone (the part): it stands to one side
    // under the island, turned so that its last straight is the route's; the well comes down through its flank
    // the well's stair ends at a landing over the cave's gallery: the cave carries it on down the dome's wall
    const landC = RT.toCave([STAIR.r * Math.cos(STAIR.aFar), STAIR.yEnd, STAIR.r * Math.sin(STAIR.aFar)]);
    const hero = await buildHero(ctx, { hand, plan: FL.cave, density: vary.density, rare, landing: [hand * landC[0], landC[1], landC[2]] });
    hero.object.position.set(wx(RT.stone[0]), FLOOR, RT.stone[1]);
    hero.object.rotation.y = -hand * RT.psi;
    scene.add(hero.object);
    hero.setPortalLight('#ffe2b0', 1.1);
    // what comes down the well: daylight, the low sun's, or the moon's
    hero.setLight(null, night ? v3(0.07, 0.1, 0.2) : golden ? v3(0.5, 0.4, 0.42) : v3(0.3, 0.46, 0.8));
    await ctx.yield();

    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: FL.duration,
      // what this visit drew and where the route's places fall (metres flown), for the builder's report
      info: { hand, hour, rare, dip: Math.round(RT.dip), places: Object.fromEntries(Object.entries(M).map(([k, v]) => [k, Math.round(v)])) },
      // ONE DECLARED PACING, by metres between places (the part: PACE and makeFlight)
      pace: FL.pace,
      camera: FL.camera,
      pois: FL.pois,
      // the ring shows from where the line comes out through the dome: the cave's first sight
      portal: { shape: 'circle', radius: 7, color: '#ffe2b0', glow: 1.1, revealDistance: M.end - M.dome },
      post: {
        exposure: night ? 1.25 : 1, bloom: { strength: 0.32, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#fffdf8', shadowTint: '#141a30', vignette: 0.24, grain: 0.015, aberration: 0 },
      },
      update(dt, time, camera, u) {
        SH.uTime.value = time;
        // the drawing buffer's height, for the threads' least width (the lens is read in their shader)
        ctx.renderer.getDrawingBufferSize(_size);
        pixU.value = 2 / Math.max(_size.y, 1);
        sky.update(dt, time, camera);
        ocean.update(dt, time, camera);
        hero.update(dt, time, camera);
        turnSpinners(time);
        bobBoats(time);
        moveFolk(time);
        moveTown(time);
        clouds.update(dt, time, camera);
        fauna.update(dt, time, camera, u);
      },
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
