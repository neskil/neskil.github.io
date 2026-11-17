// Towers Over the Old City: the hero set piece, a great old church of dark weathered stone, built in the WORLD's
// own axes (+x east along the nave, +z south, y up, metres): the west front's face at x 0, the two towers 14 m
// square to y 69 with a 13 m gap between them, the lead roof's ridge at y 43, an open bell steeple over the
// crossing at (78, 0) to y 78, flying buttresses along both flanks and round the apse, the south transept's gable
// front at z 31 with the door that holds the world's portal, the square's worn posts and the court's walls.
// Fourteen bells swing on oak frames by the world's clock, each on its own period, from the first second, each with
// its headstock and its rope's wheel; in each tower one of them hangs whole behind an opening of the west face
// whose boards are gone (see LOUVRE_OPEN).
// Nothing here is moved or timed by the route, the lens, a seed's number or a clock value, and nothing is placed by
// them but for the two things named next; what the shader reads of the eye and of the picture's grain is listed
// under them. The only moving state is the bells' swing and the height of the edge of the sunlight (one uniform the
// world sets from its clock).
// PLACED WITH THE WAY IN MIND, both typed and the same on every seed and at every clock:
// (1) the south door's seat, handed in by the world: its route's last point, where the ring stands (DOOR_SEAT);
// the door's oak leaf stands behind the ring's plane by a sum from that seat;
// (2) THE TWO BELLS BEHIND THE OPEN OPENINGS (BELLS: the second and the third) hang at typed places so that each
// is seen through its opening on the climb before the gap between the towers, which the design's journey names,
// and no part of bell, headstock or wheel comes nearer the line than 10.7 m.
// Each shell of the church is an InstancedMesh of ONE instance: so the shadow map needs one depth program only,
// compiled before the flight and never in it. No other reason; nothing here is instanced twice but bells and figures.
// Also here, shared with the world: the one surface shader (stone, lead, tile, plaster, timber, cobbles, glass)
// and the small geometry builder both files use.
// WHAT READS THE PICTURE'S GRAIN OR THE EYE in this file (all of it in the one surface shader's fragment).
// Each is a law of drawing only: no thing's place, form, clock or number is taken from it.
// A FILTER BY A PIXEL'S FOOTPRINT (fwidth):
//  - fwc (fwidth of a wall's own coordinates): the wear at edges, the stone's courses and joints, the rime in
//    the joints and the glass's leaded cells fade into their mean where finer than the grain;
//  - the lead roof's seams (fwidth of vQ.x by 0.75 m) and its sheets' laps (fwidth of vQ.y by 2.4 m), with each
//    sheet's own tone, the drip line at the eaves and the broken snow against the rolls; a house roof of lead
//    sheets has the same seams;
//  - the tiles' courses (fwidth of vQ.y by 0.32 m), and by the same measure what shows of a roof under its snow
//    (the courses' print, the ridge's line of shade, a slipped slab's crack, the small bare places); the party
//    walls of a far row and a far row's chimney feet (fwidth of vQ.x by 6.5 m);
//  - the timber of a framed wall, its posts, rails and braces, the casements, their bars, a lamp's lit glass and
//    the doors (fwidth of vQ.x by the bay, of vQ.y by the storey);
//  - the cobbles and the paving (fwidth of the ground's x and z by 0.3 m);
//  - the arris (aw, fwidth of vQ.x and vQ.y): a worn edge's line of light is drawn as broad as the grain at the
//    least and so much the fainter.
// A SLOPE TAKEN ACROSS NEIGHBOURING PIXELS (dFdx, dFdy):
//  - of vW and of vQ.x, vQ.y: the directions in the world along a face's own two measures, for the second scale
//    of form at an arris (the edge's own direction, with no tangent stored in the mesh);
//  - of the sun's shadow coordinate: the standing shadow is asked half a metre beyond the edge, at the place the
//    neighbouring pixels' slope gives (the shadow's footprint).
// A SHADING BY THE DIRECTION FROM A THING TO THE EYE (V = cameraPosition less the thing's place, and dist):
//  - a sheet seen from its back has its normal turned to the eye;
//  - the rim against the light (graze): a sunlit face the eye sees edge-on, looking toward the sun;
//  - the shine of lead, dark glass and bell metal (reflect:
//    the sun's glint, the sky at a glancing look by the fresnel share, the bright east mirrored);
//  - the air: the fog by distance, the haze warmer toward the sun, the low haze by distance and height.
// NOTHING here is turned or centred by the eye's place.
import * as THREE from 'three';

// ---------------------------------------------------------------- the surface shader (one for the whole world)
// material kinds, per vertex (aM.x): 0 stone, 1 lead, 2 roof tile or slate, 3 plaster and timber wall,
// 4 ground (cobbles and snow), 5 timber, 6 dark jewel glass, 7 plain (snow, ice, cloth, tar: no shine),
// 8 a warm window, 9 bell metal (the only kind of metal; nothing else is told as metal)
// 10 old stone with rime on it (kind 0 in all else)
const VERT = /* glsl */`
#include <common>
#include <shadowmap_pars_vertex>
attribute vec3 aC; attribute vec3 aM; attribute vec4 aQ;
#ifdef TOWN
attribute vec4 iA; attribute vec4 iB; attribute vec4 iC;
varying vec4 vI; varying float vJ;
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vM; varying vec3 vL; varying vec3 vNl;
varying vec4 vQ; varying vec4 vE; varying float vShade;
#ifdef SWAY
uniform float uTime;
#endif
void main() {
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #ifdef SWAY
    // bare twigs tremble and pennons stir by the clock: aM.z says how free a vertex is to move
    transformed += vec3(sin(uTime * 2.3 + position.x * .9 + position.y * .5), 0., cos(uTime * 1.9 + position.z * .9 + position.y * .3)) * aM.z * .06;
  #endif
  #include <project_vertex>
  #include <worldpos_vertex>
  #include <shadowmap_vertex>
  vec4 wp = vec4(transformed, 1.); vec3 wn = normal;
  #ifdef USE_INSTANCING
    mat3 im3 = mat3(instanceMatrix);
    wn /= vec3(max(dot(im3[0], im3[0]), 1e-6), max(dot(im3[1], im3[1]), 1e-6), max(dot(im3[2], im3[2]), 1e-6));
    wn = im3 * wn; wp = instanceMatrix * wp;
  #endif
  wp = modelMatrix * wp; vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * wn + vec3(0., 1e-6, 0.));
  vL = position; vNl = normal; vM = aM; vQ = aQ;
  float f = aM.y;
  vE = vec4(mod(f, 2.), mod(floor(f / 2.), 2.), mod(floor(f / 4.), 2.), mod(floor(f / 8.), 2.));
  vec3 c = aC; vShade = -1000.;
  #ifdef TOWN
    if (aM.x > 1.5 && aM.x < 2.5) c *= iA.rgb; else if (aM.x > 2.5 && aM.x < 3.5) c *= iB.rgb;
    vShade = iA.w; vI = vec4(iB.w, iC.x, iC.y, iC.z); vJ = iC.w;
  #endif
  #ifdef SHADEQ
    vShade = aQ.w;
  #endif
  vC = c;
}`;

const FRAG_HEAD = /* glsl */`
#include <common>
#include <packing>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform float uEdge; uniform float uTime; uniform float uFogDen; uniform float uSnow; uniform float uHoar;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uGndCol;
uniform vec3 uFogCol; uniform vec3 uFogWarm; uniform vec3 uPortalPos; uniform vec3 uPortalCol;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vM; varying vec3 vL; varying vec3 vNl;
varying vec4 vQ; varying vec4 vE; varying float vShade;
#ifdef TOWN
varying vec4 vI; varying float vJ;
#endif
float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// a ruled line every 'step' of x, 'w' wide, kept soft and faded where it would be thinner than a pixel
float ruled(float x, float w, float fw) { float d = abs(fract(x) - .5); float a = .5 - w; return smoothstep(a - fw, a + fw, d) * clamp(1.2 - fw * 3., 0., 1.); }
`;
export const SURFACE_VERT = VERT, SURFACE_FRAG_HEAD = FRAG_HEAD;

const FRAG_MAIN = /* glsl */`
void main() {
  vec3 N = normalize(vN);
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  #ifdef DOUBLE_SIDED
    if (dot(N, V) < 0.) N = -N;
  #endif
  float mat = vM.x; vec3 alb = vC; vec3 emis = vec3(0.); float gloss = 0.; float ao = 1.;
  // kind 10 is kind 0, old stone, with rime on it
  float rime = step(9.5, mat); mat *= 1. - rime;
  #ifdef TOWN
    vec2 wc = abs(vNl.x) > abs(vNl.z) ? vec2(vL.z, vL.y) : vec2(vL.x, vL.y);
    vec4 I = vI; float lampShare = vJ;
  #else
    vec2 wc = abs(N.x) > abs(N.z) ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
    // what is no instanced house draws its own share of slid snow by the plot it stands on
    vec4 I = vec4(0., h21(floor(vW.xz / 13.)), .04, 0.); float lampShare = 0.;
  #endif
  float hs = I.x;
  float fwc = max(fwidth(wc.x), fwidth(wc.y));
  float nBig = vn(wc * .09 + hs * 31.);
  float nPatch = vn(vW.xz * .23);
  float up = N.y; float snow = 0., oakQ = 0.; vec3 spill = vec3(0.);
  vec4 dd = vec4(vQ.x, vQ.z - vQ.x, vQ.y, vQ.w - vQ.y) + (1. - vE) * 100.;
  float wear = (1. - smoothstep(.03, .2, min(min(dd.x, dd.y), min(dd.z, dd.w)))) * clamp(1.4 - fwc * 4., .35, 1.);
  if (mat < .5) {
    // old dark ashlar: courses, weathering in patches, pale rain-washed streaks, dark runs, pale worn arrises
    float row = wc.y / .46, ri = floor(row), fr = fwc / .46;
    float cx = wc.x / .92 + mod(ri, 2.) * .5 + h21(vec2(ri, 3.)) * .3;
    float near = clamp(1.2 - fr * 3., 0., 1.);
    // the courses are fine lines of shade in the joints: no block is of another tone than its neighbour; a course
    // is a little its own (four in a hundred), so that one course tells from the next
    alb *= mix(1., .985 + .03 * h21(vec2(floor(cx), ri)), near);
    alb *= .96 + .08 * h21(vec2(ri, 11.));
    alb *= 1. - .4 * max(ruled(row, .034, fr), .75 * ruled(cx, .011, fr * .5)) * (.45 + .55 * vn(wc * 1.3 + 5.));
    alb *= .74 + .52 * nBig;
    float nStreak = vn(vec2(wc.x * 1.1, wc.y * .07));
    alb = mix(alb, alb * 1.55 + .02, smoothstep(.55, .9, nStreak) * .6);
    alb *= 1. - .38 * smoothstep(.62, .95, vn(vec2(wc.x * 2.3 + 9., wc.y * .11)));
    alb = mix(alb, alb * 2.1 + .05, wear * .85);
    // (no snow falls on what stands under a roof: a face whose extra says so, a pier's top under its bridge)
    snow = smoothstep(.5, .85, up) * (.6 + .4 * nPatch) * (1. - smoothstep(.85, .95, vM.z));
    // rime: frost grown on cold courses, most in the joints and in patches, never a coat
    snow = max(snow, rime * (.07 + .2 * smoothstep(.3, .9, vn(wc * .5 + 3.)) + .28 * ruled(row, .05, fr)));
    ao = 1. - .36 * vM.z;
  } else if (mat < 1.5) {
    // lead in sheets with rolled seams; snow on the slopes that look north and west and along the crest
    // every 0.75 m a rolled seam: a line of shade at each foot of the roll, a pale crown on it; the sheets are 2.4 m
    // long and lap (a fine line of shade across each strip, strip by strip at its own height), each sheet a little
    // its own tone; a line of shade under the eaves' drip
    float sfr = fwidth(vQ.x) / .75, sf = abs(fract(vQ.x / .75) - .5), nearS = clamp(1.2 - sfr * 3., 0., 1.);
    float strip = floor(vQ.x / .75), lapY = vQ.y / 2.4 + h21(vec2(strip, 7.)), lfr = fwidth(vQ.y) / 2.4;
    alb *= .86 + .24 * nBig; alb *= 1. - .3 * ruled(vQ.x / .75, .07, sfr);
    alb *= 1. - .42 * (smoothstep(.3, .4, sf) - smoothstep(.43, .47, sf)) * nearS;
    alb *= 1. + .4 * smoothstep(.465, .5, sf) * nearS;
    alb *= mix(1., .9 + .2 * h21(vec2(strip, floor(lapY))), nearS) * (1. - .3 * ruled(lapY, .02, lfr) * nearS);
    alb *= 1. - .3 * (1. - smoothstep(.04, .2, vQ.y)) * vE.z * nearS;
    // snow on the slopes that look north and west (not on a face too steep to hold it): it has slid from the
    // smooth lead and lies in the seams, against every roll, and deeper toward the slope's foot. ON THE SUNWARD
    // SLOPES WHAT IS LEFT OF IT lies in broken lengths against the rolls and in a ragged band at the slope's foot
    float lee = smoothstep(.05, .35, dot(N, vec3(-.38, 0., -.92))) * smoothstep(.22, .45, up);
    float foot = 1. - smoothstep(.1, .62, vQ.y / max(vQ.w, 1.) + (nPatch - .5) * .3);
    float inSeam = smoothstep(.2, .36, sf + (vn(vec2(vQ.x * .9, vQ.y * .35)) - .5) * .22) * mix(.55, 1., nearS);
    snow = max(lee * max(inSeam * (.72 + .28 * nPatch), foot * .9), (1. - smoothstep(.2, .9, vQ.w - vQ.y)) * vE.w);
    float left = smoothstep(.34, .44, sf + (vn(vec2(vQ.x * .9, vQ.y * .35)) - .5) * .2) * smoothstep(.42, .62, vn(vec2(strip * .37 + 3., vQ.y * .21)));
    float band = (1. - smoothstep(.02, .3, vQ.y / max(vQ.w, 1.) + (vn(vec2(vQ.x * .45, 9.)) - .5) * .22)) * smoothstep(.3, .55, vn(vec2(vQ.x * .23 + 5., 3.)));
    snow = max(snow, (1. - lee) * smoothstep(.22, .45, up) * max(left * mix(.4, .9, nearS), band * .85));
    snow = max(snow, smoothstep(.75, .95, up));
    gloss = 1.; ao = 1. - .5 * vM.z;
  } else if (mat < 2.5) {
    // tile or slate in courses; snow by the slope's facing and the house's own draw, the ridge white, thawed at the chimney
    float tr = vQ.y / .32, tfr = fwidth(vQ.y) / .32, near = clamp(1.2 - tfr * 3., 0., 1.);
    float tx = vQ.x / .25 + mod(floor(tr), 2.) * .5;
    // aM.z: 1 a bare patch at a chimney, 2 one long roof over a row of houses (the far town), 3 a landmark's great
    // roof or coping (it holds its snow as one roof, not house by house: only a narrow ragged band has slid from its
    // eaves), 4 a tower's cone (see below)
    float patchQ = step(.5, vM.z) * step(vM.z, 1.5), greatQ = step(2.5, vM.z), coneQ = step(3.5, vM.z), rowQ = step(1.5, vM.z) * (1. - greatQ);
    // A HOUSE'S ROOF HAS ITS OWN STATE (I.w, the world's: 0 on every roof but the southern bank's houses'): 1 the
    // snow lies thick on it to the eaves; 2 it has half slid (see below: it keeps its snow in broken patches, and
    // what is bared is a red-brown tile or a grey slate, weathered in streaks); 3 a roof of lead-grey sheets with
    // rolled seams, from which the snow slides to lie in a broken band at the slope's foot; 4 an old roof with a
    // faint green cast of moss on its dark tile or slate, a little more toward the eaves, with no pattern of its own
    float thickQ = step(.5, I.w) * step(I.w, 1.5), halfQ = step(1.5, I.w) * step(I.w, 2.5), leadQ = step(2.5, I.w) * step(I.w, 3.5), mossQ = step(3.5, I.w);
    float pl = vQ.x / 6.5 + h21(floor(vW.xz / 60.)) * 5., pfr = fwidth(vQ.x) / 6.5, party = ruled(pl, .025, pfr) * rowQ;
    float keep = mix(mix(I.y, h21(vec2(floor(pl), floor(vW.z / 9.))), rowQ), .72, greatQ);
    keep = mix(keep, .92 + .08 * I.y, thickQ); keep = mix(keep, .35 * I.y, max(halfQ, leadQ)); keep = mix(keep, .25 + .4 * I.y, mossQ);
    float sfr = fwidth(vQ.x) / .75, sf = abs(fract(vQ.x / .75) - .5), nearS = clamp(1.2 - sfr * 3., 0., 1.);
    float sheet = (1. - .3 * ruled(vQ.x / .75, .07, sfr)) * (1. - .36 * (smoothstep(.3, .4, sf) - smoothstep(.43, .47, sf)) * nearS) * (1. + .35 * smoothstep(.465, .5, sf) * nearS);
    alb *= mix(mix(1., .78 + .44 * h21(vec2(floor(tx), floor(tr)) + hs * 91.), near) * (1. - .32 * ruled(tr, .1, tfr)), sheet, leadQ);
    alb *= (.8 + .4 * nBig) * mix(1., .75 + .5 * h21(vec2(floor(pl), 5.)), rowQ);
    alb = mix(alb, alb * vec3(.86, .98, .78) + vec3(.0, .008, .0), mossQ * (1. - patchQ) * (.35 + .2 * (1. - vQ.y / max(vQ.w, 1.))));
    // WHAT A HALF-SLID ROOF BARES goes by the roof's own colour at the place: a red-brown tile where it is redder
    // than it is blue (whole tile from 0.05 redder on; its blue taken down, so that the sky's light in the shade
    // never turns it plum), a grey slate where it is not. So a tiled roof bares tile and a blue slate roof slate;
    // a slate roof whose own hue is on the brown side bares a slate that has the tile's tone in it, the more the
    // browner the roof. WEATHERED IN STREAKS down the slope by the house's own draw (0.78 to 1.22 of its tone, a
    // metre broad and some three long), its courses showing as on every roof
    float tileQ = smoothstep(0., .05, alb.r - alb.b);
    alb = mix(alb, mix(vec3(dot(alb, vec3(.3, .5, .2))) * vec3(1.03, 1., .96), alb * vec3(1.02, .88, .68), tileQ) * (.78 + .44 * vn(vec2(vQ.x * 1.1 + hs * 13., vQ.y * .3))), halfQ * (1. - patchQ));
    float lee = smoothstep(-.15, .3, dot(N, vec3(-.38, 0., -.92)));
    // thick on the slopes that look north and west, thinner and patchy on the sunward ones; and by each house's own
    // draw the snow has slid from the eaves, a ragged band of bare roof below it (broader on the sunward slopes)
    // (and the steeper a house's slope, the less it holds; a cone's skirt keeps its snow)
    float slid = (1. - keep) * 3.1 - lee * 1.1 + (nPatch - .5) * 1.7 + (vn(vW.xz * .9) - .5) * .5 + (1. - smoothstep(.5, .76, up)) * 1.8 * (1. - greatQ) * (1. - thickQ) - coneQ * 4.;
    slid += halfQ * (.9 + (1. - lee) * (1.6 + 2.4 * fract(hs * 9.3))) + leadQ * (2.2 + 2. * fract(hs * 9.3)) - thickQ * 1.5;
    snow = smoothstep(.38, .6, lee * .4 + keep * .3 + nPatch * .35 + .2) * smoothstep(slid - .2, slid + .2, vQ.y);
    // A HALF-SLID ROOF KEEPS ITS SNOW IN BROKEN PATCHES over a third to a half of each slope, by the house's own
    // numbers: A BAND UNDER THE RIDGE, ragged at its lower edge (0.24 to 0.32 of the slope on the sunward side,
    // 0.27 to 0.37 on the side that looks north and west), A RAGGED BROKEN LINE AT THE EAVES (0.05 to 0.15 of the
    // slope, four lengths in five of the eaves) and A FEW LONG PATCHES ACROSS THE SLOPE between them where the slab
    // has held (about a twelfth of the slope between). Counted on 4000 roofs by this law: the middle roof keeps its
    // snow on 0.44 of a sunward slope and 0.48 of the other, eight roofs in ten on 0.36 to 0.56. A LEAD ROOF keeps
    // a broken band at each slope's foot (0.1 to 0.26 of the slope, two lengths in three of the eaves), where what
    // slid from the sheets lies. No roof is wholly bare
    float hnR = vQ.y / max(vQ.w, 1.), ragA = vn(vec2(vQ.x * .55, hs * 23. + 1.)), ragB = vn(vec2(vQ.x * 1.7, hs * 41. + 3.));
    float ridgeS = smoothstep(-.03, .03, hnR - 1. + mix(.24 + .08 * I.y, .27 + .1 * I.y, lee) + (ragA - .5) * .16 + (ragB - .5) * .06);
    float eavesS = (1. - smoothstep(-.02, .03, hnR - .05 - .1 * ragB)) * smoothstep(.2, .4, vn(vec2(vQ.x * .35 + 7., hs * 17.)));
    float midS = smoothstep(.76, .84, vn(vQ.xy * vec2(.24, 1.4) + hs * 40. + I.y * 9.));
    snow = mix(snow, max(max(ridgeS, eavesS), midS), halfQ * (1. - patchQ) * (1. - coneQ));
    snow = max(snow, leadQ * (1. - patchQ) * (1. - smoothstep(-.03, .03, hnR - .1 - .16 * ragA)) * smoothstep(.25, .45, vn(vec2(vQ.x * .3 + 3., hs * 29.))));
    // A TOWER'S CONE: its slates are dark and steep, and the snow does not lie on them as on a roof. It lies on the
    // WEATHER SIDE (the faces that look north and west) from the skirt to a little over half way up, ragged at its
    // upper edge; on the other faces only in STREAKS down the slates (narrow tongues some 0.6 m apart, thinning
    // upward) and in a thin line along the skirt; the steep upper cone is bare slate all round
    if (coneQ > .5) {
      float hn = vQ.y / max(vQ.w, 1.), wth = smoothstep(.05, .5, dot(N, vec3(-.38, 0., -.92)));
      float streak = smoothstep(.56, .74, vn(vec2((vW.x * .8 + vW.z * .6) * 1.7, vW.y * .16))) * (1. - smoothstep(.3, .78, hn + (nPatch - .5) * .2));
      snow = max(max(wth * (1. - smoothstep(.46, .66, hn + (nPatch - .5) * .32)), streak * (.55 + .4 * wth)), 1. - smoothstep(.03, .075, hn));
    }
    snow = max(snow, (1. - smoothstep(.25, .8, vQ.w - vQ.y)) * vE.w);
    // UNDER THE SNOW A ROOF IS STILL A ROOF (each of these only where it is broader than the grain): the courses
    // print through it; under the ridge's cap runs the ridge's own line of shade; on two roofs in three the slab has
    // slipped a hand and left a dark crack across the slope (at the roof's own height); here and there a small bare
    // place where it has broken away
    snow *= 1. - .22 * ruled(tr, .1, tfr) * near;
    float housey = (1. - greatQ) * (1. - rowQ) * (1. - patchQ), rd = vQ.w - vQ.y;
    snow *= 1. - .6 * smoothstep(.2, .27, rd) * (1. - smoothstep(.33, .42, rd)) * vE.w * near * housey;
    float crackY = vQ.w * (.3 + .38 * fract(hs * 7.7 + I.y * 3.1)) + .4 * (vn(vec2(vQ.x * .7, hs * 31. + I.y * 17.)) - .5);
    snow *= 1. - .8 * (1. - smoothstep(.03, .09 + tfr * .32, abs(vQ.y - crackY))) * step(.34, fract(hs * 3.3 + I.y * 5.7)) * near * housey;
    snow *= 1. - .9 * smoothstep(.79, .86, vn(vQ.xy * vec2(1.3, .8) + hs * 40. + I.y * 9.)) * near * housey;
    // the roof's own edge shows dark under the snow's lip at the eaves and the verges (a cone has eaves and no verge)
    snow *= mix(smoothstep(.1, .26, min(vQ.y, mix(min(vQ.x, vQ.z - vQ.x), 1., coneQ))), 1., patchQ);
    // a bare patch where a chimney warms the tiles (a small quad of its own, soft at its rim)
    snow *= 1. - patchQ * smoothstep(0., .45, min(min(vQ.x, vQ.z - vQ.x), min(vQ.y, vQ.w - vQ.y)) + (nPatch - .5) * .3);
    // a row's party walls stand a hand over its roof, a dark line through the snow; a chimney's dark foot by each
    float chim = (1. - smoothstep(.05, .08 + pfr, abs(fract(pl) - .3))) * (1. - smoothstep(.45, .6, abs(vQ.w - vQ.y - 1.1))) * rowQ;
    snow *= 1. - max(party * .75, chim);
    alb *= 1. - .5 * max(party, chim);
  } else if (mat < 3.5) {
    // plaster between oak posts, rails and braces; casements, a few of them warm
    // a wall quad holds vM.y storeys (one where each storey is its own quad); the bays divide its breadth evenly
    float sth = vQ.w / max(vM.y, 1.), st = vQ.y / max(sth, .5), si = floor(st), sf = fract(st);
    float nb = max(floor(vQ.z / 1.45 + .5), 1.), bw = max(vQ.z, .5) / nb;
    float bx = vQ.x / bw, bi = floor(bx), bf = fract(bx), fr = fwidth(vQ.x) / bw;
    float near = clamp(1.2 - fr * 3., 0., 1.);
    float hb = h21(vec2(bi, si) + hs * 57.);
    float brace = step(.72, hb) * (1. - smoothstep(.05, .06 + fr * 2., abs(bf - (hb > .86 ? sf : 1. - sf)))) * near;
    float timber = max(max(ruled(bx, .07, fr), ruled(st, .045, fwidth(vQ.y) / max(sth, .5))), brace) * vM.z;
    // casements by each house's own draw: their breadth, their height, how many bays have one; a door at the foot
    float hw2 = h21(vec2(hs * 41., 7.)), wwid = .15 + .1 * hw2, whgt = .13 + .08 * h21(vec2(hs * 23., 3.));
    vec2 wq = vec2(bf - .5, sf - .5);
    float win = step(hb, .26 + .3 * hw2) * (1. - smoothstep(wwid, wwid + .01 + fr, abs(wq.x))) * (1. - smoothstep(whgt, whgt + .01 + fr, abs(wq.y + .04)));
    float door = step(si, .5) * step(.8, h21(vec2(bi, 9.) + hs * 17.)) * (1. - smoothstep(.27, .28 + fr, abs(wq.x))) * (1. - smoothstep(.68, .7, sf));
    float bars = max(1. - smoothstep(.02, .03 + fr, abs(wq.x)), 1. - smoothstep(.015, .025 + fr, abs(wq.y))) * near;
    // plaster: each panel a little its own, damp and dark toward the foot, in the eaves' shade at the top, and a
    // band of shade under every jettied storey
    alb *= mix(1., .88 + .24 * h21(vec2(bi + 11., si) + hs * 3.), near * vM.z);
    alb *= .82 + .36 * nBig;
    alb *= 1. - .3 * smoothstep(.55, .9, vn(vec2(wc.x * 1.7 + hs * 5., wc.y * .12)));
    alb *= mix(.6, 1., smoothstep(0., 6.5, vQ.y)) * mix(.74, 1., smoothstep(0., .9, vQ.w - vQ.y));
    alb *= 1. - .3 * smoothstep(.7, 1., sf) * step(si + 1.5, max(vM.y, 1.)) * vM.z;
    alb = mix(alb, vec3(.125, .118, .11) * (.75 + .5 * nBig), timber * .93);
    float warm = step(1. - I.z, h21(vec2(bi + 3., si) + hs * 7.3));
    win *= 1. - door;
    alb = mix(alb, mix(vec3(.028, .031, .042), vec3(.09, .08, .072), bars), win);
    alb = mix(alb, vec3(.075, .06, .05) * (.7 + .6 * vn(vec2(vQ.x * 9., vQ.y * .8))), door * vM.z);
    emis = vec3(1., .46, .13) * 3. * win * warm * (1. - .7 * bars);
    // A LAMP BEHIND A CASEMENT (lampShare, the world's: how many of this house's casements have one; steady, by the
    // casement's own place on its wall and the house's draw): its glass is the brighter, and its light lies on the
    // sill and on the wall under it, a hand to either side
    float lamp = step(1. - lampShare, h21(vec2(bi + 17., si + 5.) + hs * 13.1)) * step(hb, .26 + .3 * hw2) * (1. - door);
    if (lamp > .5) {
      emis = max(emis, vec3(1.2, .62, .2) * 3.4 * win * (1. - .6 * bars));
      float sx = max(abs(wq.x) - wwid, 0.) / .2, sy = (-(wq.y + .04) - whgt) / .3;
      spill = vec3(2.6, 1.25, .4) * (1. - win) * exp(-sx * sx * 4.) * smoothstep(-.12, 0., sy) * exp(-max(sy, 0.) * 2.6) * (1. - smoothstep(.36, .5, abs(wq.x)));
    }
    snow = smoothstep(.5, .85, up) * .85;
  } else if (mat < 4.5) {
    // cobbles with trodden snow; vM.z says how much snow lies (lanes little, yards and the square more)
    vec2 g = vW.xz / .3; float gfr = max(fwidth(g.x), fwidth(g.y)), near = clamp(1.2 - gfr * 2., 0., 1.);
    g.x += mod(floor(g.y), 2.) * .5;
    vec2 gf = abs(fract(g) - .5);
    alb *= mix(1., .7 + .6 * h21(floor(g)), near);
    alb *= 1. - .4 * smoothstep(.3, .48, max(gf.x, gf.y)) * near;
    alb *= .75 + .5 * nPatch;
    snow = smoothstep(.42, .7, vn(vW.xz * .11) * .65 + nPatch * .35 + vM.z * .55 - .1);
  } else if (mat < 5.5) {
    alb *= .65 + .7 * vn(vec2(wc.x * 9., wc.y * .7));
    snow = smoothstep(.55, .85, up) * .9;
    #ifdef SWAY
      // a hoar-frost morning whitens every twig and pole
      snow = max(snow, uHoar * (.55 + .4 * nPatch));
    #else
      // (its extra: how deep in a hollow it stands; 2: the bell frames' old oak in the towers' hollow: dark brown,
      // under a roof, so that no snow lies on it; its upper faces are worn and dusted paler)
      oakQ = step(1.5, vM.z);
      ao = 1. - .4 * mix(vM.z, .25, oakQ); snow *= 1. - oakQ;
      alb *= 1. + .9 * oakQ * smoothstep(.3, .9, up);
    #endif
  } else if (mat < 6.5) {
    // dark jewel glass in a web of lead: cells of deep colour that make no picture
    vec2 q = vec2(wc.x + wc.y * .5, wc.y) / .21; vec2 qi = floor(q); float hc = h21(qi), fr = fwc / .21, near = clamp(1.2 - fr * 2., 0., 1.);
    vec3 jewel = hc < .42 ? vec3(.02, .045, .17) : hc < .7 ? vec3(.15, .02, .03) : hc < .86 ? vec3(.02, .09, .07) : vec3(.17, .12, .03);
    jewel = mix(vec3(.03, .031, .042), jewel * (.3 + .5 * h21(qi + 7.)), near);
    alb = mix(jewel, vec3(.012), max(ruled(q.x, .09, fr), ruled(q.y, .09, fr)));
    gloss = 2.5;
  } else if (mat < 7.5) {
    // plain, without gloss; its extra is read by nothing here (a pennon's cloth carries in it how free it is to stir)
    alb *= .92 + .12 * nPatch;
  } else if (mat < 8.5) {
    emis = vC * 3.; alb = vec3(.02);
  } else {
    // bell metal: it takes a broad dull shine and mirrors the bright east
    alb *= .92 + .12 * nPatch;
    gloss = 1.3;
  }
  // snow: a pale grey-white, drifted in long soft shades
  float sn = clamp(snow, 0., 1.) * uSnow, drift = vn(vW.xz * .6 + vW.y * .8);
  alb = mix(alb, vec3(.8, .83, .88) * (.9 + .14 * drift), sn);
  // the light: the sun above the edge and outside every standing shadow, the sky's fill everywhere
  float lit = smoothstep(uEdge - 1.25, uEdge + 1.25, vW.y) * smoothstep(vShade - .7, vShade + .7, vW.y) * getShadowMask();
  float nds = dot(N, uSunDir), ndl = max(nds, 0.);
  // snow is no smooth face: its drifts turn small slopes to a sun that only grazes it, so that sunlit snow is rose
  // where a smooth face would hardly be lit (and never where the face looks away from the sun)
  ndl = mix(ndl, min(ndl + (.24 + .24 * drift) * smoothstep(-.12, .06, nds), 1.), sn);
  vec3 sunH = normalize(vec3(uSunDir.x, 0., uSunDir.z) + vec3(1e-5, 0., 0.));
  float east = dot(N, sunH);
  vec3 amb = mix(uGndCol, uSkyCol, up * .5 + .5) * (.9 + .1 * east) + vec3(.07, .035, .01) * max(east, 0.);
  // LIGHT IN THE SHADE ON OLD STONE, by the height of the place alone (no eye, no clock): the snow that lies under
  // a wall throws its pale light up it, warm beside the sky's blue, strongest in the courses next to the snow and
  // gone a few storeys up: the town's snow (its ground's and its roofs', to y 12) for every wall, and the snow of
  // the great church's platform (y 46, over the west block's own plan) for the towers that stand on it; higher
  // up the sky's own fill is a deeper blue. A face the sun strikes keeps its own law (ONE STONE, below)
  float towerQ = step(-3., vW.x) * step(vW.x, 16.) * step(abs(vW.z), 23.5) * smoothstep(42.5, 47., vW.y);
  float nearSnow = max(exp(-max(vW.y - 12., 0.) / 13.), towerQ * exp(-max(vW.y - 46., 0.) / 6.5));
  // (the same light for what hangs and stands within the towers: the bell frames' oak and the bell metal)
  float shadeQ = max(1. - step(.5, mat), max(oakQ, step(8.5, mat))) * (1. - sn) * (1. - lit * smoothstep(0., .2, ndl));
  amb = mix(amb, amb * mix(vec3(.8, .87, 1.03), vec3(1.), nearSnow) + vec3(.2, .155, .115) * nearSnow * clamp(1. - up, 0., 1.), shadeQ);
  // THE TWO TOWERS' STONE IN THE SHADE (a law of the place: over the west block's own plan, coming in up the front
  // from y 30 and whole from y 50, so that no line shows where it begins) is the church's own stone in the sky's
  // cold fill, of one hue with every other shaded stone of the church; only ITS RELIEF IS DEEPER there: what stands
  // in a hollow is the darker by the hollows' own measure, so that a course, a shaft and a moulding tell.
  // WHERE THE LOW SUN TAKES A FACE OR AN EDGE (below, at the sum) the same stone is a warm cream turning to gold
  float towerStone = step(-3., vW.x) * step(vW.x, 16.) * step(abs(vW.z), 23.5) * smoothstep(30., 50., vW.y) * (1. - step(.5, mat)) * (1. - sn);
  amb = mix(amb, amb * (1. - .22 * vM.z), towerStone * (1. - lit * smoothstep(0., .2, ndl)));
  // BELL METAL hangs in the towers' shade and mirrors the warm east that looks in at the openings: a soft warm
  // light lies on it, most on its shoulder
  amb = mix(amb, amb * .5 + vec3(.62, .45, .25) * (.55 + .7 * clamp(up + .3, 0., 1.)), step(8.5, mat));
  // ONE STONE: where the sun strikes old dark stone it is the same dark stone turned rose gold, not a pale one: on
  // the struck face the sky's cold fill counts for half (the eye, full of the sun's gold, no longer sees the blue)
  float stoneLit = (1. - step(.5, mat)) * (1. - sn) * lit * smoothstep(0., .2, ndl);
  // (WITHIN A TOWER'S HOLLOW AND BEHIND ITS BOARDED OPENINGS, a place: inside the three walls that wear slate boards,
  // not the wall toward the gap, which wears none. The sun comes there only between the boards, broken: stone and
  // oak take half of it and their edges' glints a quarter, so that in a boarded opening the bell metal is the
  // brightest thing)
  float hollowQ = step(-.2, vW.x) * step(vW.x, 14.2) * step(8.1, abs(vW.z)) * step(abs(vW.z), 20.7) * step(46.9, vW.y) * step(vW.y, 66.2);
  vec3 col = alb * (uSunCol * ndl * lit * (1. - .1 * stoneLit) * (1. - .5 * hollowQ * step(mat, 5.5)) + amb * ao * (1. - .5 * stoneLit));
  col = mix(col, col * vec3(1.26, 1.27, 1.16) + vec3(.02, .016, .008), stoneLit * towerStone);
  // against the light: a sunlit face that the eye sees edge-on, looking toward the sun, glares in a thin gold rim
  // (a ridge, a ledge, a shaft, a crown's snow), by the same edge and the same standing shadows as all sunlight
  float sunward = clamp(dot(-V, uSunDir), 0., 1.);
  float graze = pow(clamp(1. - abs(dot(N, V)), 0., 1.), 4.) * smoothstep(-.12, .1, nds) * sunward * sunward;
  col += uSunCol * (alb * 1.2 + .04) * graze * lit * (1. + 1.5 * sn) * (1. - .8 * hollowQ);
  // the sun-grazed arris: a worn edge is round, and where the face beyond it stands in the sun the edge's own turn
  // catches the light as a thin gold line (a ledge's snow lip the more). The standing shadows are asked at the place
  // half a metre beyond the edge, so that no arris glows whose neighbour face is itself in shade
  #if defined(USE_SHADOWMAP) && NUM_DIR_LIGHT_SHADOWS > 0
  {
    // (an arris is a hand's breadth of light, 0.16 m: where the eye is too far to see so thin a line, the line it is
    // drawn as is broader and so much the fainter, and a far front full of edges keeps its own tone)
    vec4 aw = max(vec4(.16), vec4(fwidth(vQ.xx), fwidth(vQ.yy)) * 1.6);
    vec4 ar = 1. - smoothstep(vec4(0.), aw, dd), ae = ar * (.16 / aw);
    float arris = max(max(ae.x, ae.y), max(ae.z, ae.w));
    if (arris > .02) {
      vec3 dWx = dFdx(vW), dWy = dFdy(vW);
      vec3 Ts = dWx * dFdx(vQ.x) + dWy * dFdy(vQ.x), Tt = dWx * dFdx(vQ.y) + dWy * dFdy(vQ.y);
      vec3 D = Ts * inversesqrt(max(dot(Ts, Ts), 1e-12)) * (ar.y - ar.x) + Tt * inversesqrt(max(dot(Tt, Tt), 1e-12)) * (ar.w - ar.z);
      D *= inversesqrt(max(dot(D, D), 1e-8));
      float nd2 = dot(D, uSunDir) + (.24 + .24 * drift) * uSnow * smoothstep(.6, .9, D.y);
      if (nd2 > 0.) {
        float gxx = dot(dWx, dWx), gxy = dot(dWx, dWy), gyy = dot(dWy, dWy), det = max(gxx * gyy - gxy * gxy, 1e-12);
        float rx = dot(dWx, D) * .5, ry = dot(dWy, D) * .5;
        vec2 st = clamp(vec2(gyy * rx - gxy * ry, gxx * ry - gxy * rx) / det, -24., 24.);
        vec4 sc = vDirectionalShadowCoord[0] + dFdx(vDirectionalShadowCoord[0]) * st.x + dFdy(vDirectionalShadowCoord[0]) * st.y;
        float sh2 = getShadow(directionalShadowMap[0], directionalLightShadows[0].shadowMapSize, directionalLightShadows[0].shadowIntensity,
          directionalLightShadows[0].shadowBias, directionalLightShadows[0].shadowRadius, sc);
        float edgeLit = smoothstep(uEdge - 1.25, uEdge + 1.25, vW.y) * smoothstep(vShade - .7, vShade + .7, vW.y);
        col += uSunCol * (alb * 1.4 + .12) * min(nd2, 1.) * arris * edgeLit * sh2 * 1.9 * (1. - .75 * hollowQ);
      }
    }
  }
  #endif
  // NOTHING THE SUN STRIKES IS DRAWN AS WHITE: the lit sum lies under a soft shoulder (from .5 up, .9 at the most),
  // each channel alike, so that sunlit snow, plaster and rimed twigs keep their drifts and their form
  col = mix(col, .5 + .4 * (1. - exp(-(col - .5) / .4)), step(.5, col));
  if (gloss > 0.) {
    vec3 R = reflect(-V, N);
    // lead shines broad and dull; dark glass takes the sun as one small glint that runs from pane to pane as the
    // eye goes by; both mirror the sky at a glancing look, and the bright east where they look toward it
    float glassQ = step(2., gloss), rs = clamp(dot(R, uSunDir), 0., 1.);
    float s = mix(pow(rs, 14.) * .22 * gloss, pow(rs, 90.) * 2.2, glassQ);
    float fres = pow(clamp(1. - dot(N, V), 0., 1.), 3.);
    float eastR = pow(clamp(dot(normalize(R.xz + vec2(1e-5, 0.)), sunH.xz), 0., 1.), 3.) * (1. - clamp(R.y, 0., 1.));
    col += uSunCol * lit * (s + .1 * ndl * (1. - glassQ)) + (uSkyCol * .12 + vec3(.5, .34, .2) * eastR) * fres * ao;
  }
  vec3 pd = uPortalPos - vW; float pl = dot(pd, pd);
  col += alb * uPortalCol * max(dot(N, pd * inversesqrt(max(pl, 1e-4))), 0.) / (1. + pl * .035);
  col += emis + alb * spill;
  float fog = 1. - exp(-uFogDen * uFogDen * dist * dist);
  float toSun = pow(clamp(dot(-V, sunH), 0., 1.), 4.), toSunWide = pow(clamp(dot(-V, sunH), 0., 1.), 1.5);
  // a cold haze lies low in the lanes and over the water: what is nearer and higher stands out of it. Toward the sun
  // the air itself shows the light: the haze low over the roofs is warm and brighter there, cold blue away from it
  float low = (1. - exp(-dist * .003)) * (1. - smoothstep(-5., 17., vW.y)) * .5;
  col = mix(col, mix(vec3(.3, .4, .66), vec3(1.05, .74, .46), toSunWide * .8), low);
  low = (1. - exp(-dist * .0016)) * (1. - smoothstep(10., 46., vW.y)) * toSunWide * .42;
  col = mix(col, vec3(1.1, .78, .5), low);
  gl_FragColor = vec4(mix(col, mix(uFogCol, uFogWarm, toSun), fog), 1.);
}`;

// The uniforms every shader of the world shares (one object each, by reference): the world sets uEdge and uTime.
export function makeShared(o = {}) {
  const c = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
  return {
    uEdge: { value: o.edge ?? 30 }, uTime: { value: 0 }, uFogDen: { value: o.fog ?? 0.00075 }, uSnow: { value: o.snow ?? 1 }, uHoar: { value: o.hoar ?? 0 },
    uSunDir: { value: (o.sunDir ? o.sunDir.clone() : new THREE.Vector3(0.920, 0.087, 0.382)).normalize() },
    // the sun a winter gold, the sky's fill a deep cold blue from above, a blue bounce off the shaded snow from below
    // (linear values: a fill this much darker and bluer than the sun's light is what makes shade blue and the sunlit
    // rose and gold; the grey-lilac fill of before, nearly as bright as the sun, made the whole town one lilac)
    uSunCol: { value: new THREE.Color().setRGB(2.5, 1.3, 0.56) }, uSkyCol: { value: new THREE.Color().setRGB(0.33, 0.46, 0.86) }, uGndCol: { value: new THREE.Color().setRGB(0.3, 0.36, 0.58) },
    uFogCol: { value: c('#a9b7d9') }, uFogWarm: { value: c('#f6cfa2') },
    uPortalPos: { value: new THREE.Vector3(0, -900, 0) }, uPortalCol: { value: c('#ffb45e', 0) },
  };
}
// One material of the surface shader. o.town: per-house instance attributes; o.shadeQ: a standing shade height per vertex.
export function makeSurface(shared, o = {}) {
  const defines = {}; if (o.town) defines.TOWN = 1; if (o.shadeQ) defines.SHADEQ = 1; if (o.sway) defines.SWAY = 1;
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights), ...shared },
    vertexShader: VERT, fragmentShader: FRAG_HEAD + FRAG_MAIN, lights: true, defines, side: o.side ?? THREE.FrontSide,
  });
}

// ---------------------------------------------------------------- a small geometry builder
// Quads carry their own metres (aQ: s, t, breadth, height) and a mask of which of their sides are worn arrises
// (aM.y: 1 the s = 0 side, 2 the far s side, 4 the t = 0 side, 8 the far t side); aM.x is the material kind and
// aM.z a per-kind extra (stone and timber: how deep in a hollow, and on timber 2 the bell frames' old oak; tile:
// 1 a chimney's bare patch, 2 a far row's one roof, 3 a landmark's great roof or coping, 4 a tower's cone; wall: timber framed; ground: how much
// snow lies).
// (The numbers are written as they come into arrays of the kind the mesh keeps, piece after piece: a piece holds
// 'room' corners from corner 'base' on (the first 512, each later one twice the last up to 16384), and build() lays
// the pieces end to end; the index numbers in one array that doubles; ni: how many of them are written)
export function makeGB() {
  let room = 512, base = 0, P = new Float32Array(room * 3), Nn = new Float32Array(room * 3), C = new Float32Array(room * 3), M = new Float32Array(room * 3), Q = new Float32Array(room * 4), I = new Uint32Array(1024), ni = 0;
  let cr = 0.5, cg = 0.5, cb = 0.5, mat = 0, ex = 0, n = 0;
  let ox = 0, oy = 0, oz = 0, cs = 1, sn = 0, shY = null, wts = null;
  const full = [];
  const grow = () => {
    full.push([P, Nn, C, M, Q, n - base]); base = n; room = Math.min(room * 2, 16384);
    P = new Float32Array(room * 3); Nn = new Float32Array(room * 3); C = new Float32Array(room * 3); M = new Float32Array(room * 3); Q = new Float32Array(room * 4);
  };
  const index = () => { const b = new Uint32Array(I.length * 2); b.set(I); I = b; };
  const g = {
    col(c, k = 1) { cr = c[0] * k; cg = c[1] * k; cb = c[2] * k; return g; },
    mat(m, e = 0) { mat = m; ex = e; return g; },
    // every later point is turned by yaw about the vertical and moved to (x, y, z)
    // from here on every quad carries this standing shade height in place of its own height (null: its height again)
    shade(y) { shY = y; return g; },
    // the next quad's four corners each carry their own extra (in place of the one set by mat)
    weights(a, b, c, d) { wts = [a, b, c, d]; return g; },
    at(x = 0, y = 0, z = 0, yaw = 0) { ox = x; oy = y; oz = z; cs = Math.cos(yaw); sn = Math.sin(yaw); return g; },
    get tris() { return ni / 3; },
    // (how many corners are written so far)
    get corners() { return n; },
    matState() { return [mat, ex]; },
    quad(a0, b0, c0, d0, fl = 0) {
      const ax = ox + a0[0] * cs + a0[2] * sn, ay = oy + a0[1], az = oz - a0[0] * sn + a0[2] * cs, bx = ox + b0[0] * cs + b0[2] * sn, by = oy + b0[1], bz = oz - b0[0] * sn + b0[2] * cs;
      const cx = ox + c0[0] * cs + c0[2] * sn, cy = oy + c0[1], cz = oz - c0[0] * sn + c0[2] * cs, dx = ox + d0[0] * cs + d0[2] * sn, dy = oy + d0[1], dz = oz - d0[0] * sn + d0[2] * cs;
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = dx - ax, vy = dy - ay, vz = dz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const w = Math.hypot(ux, uy, uz), h = Math.hypot(vx, vy, vz), qh = shY === null ? h : shY;
      if (n - base + 4 > room) grow();
      if (ni + 6 > I.length) index();
      let i = (n - base) * 3;
      P[i] = ax; P[i + 1] = ay; P[i + 2] = az; P[i + 3] = bx; P[i + 4] = by; P[i + 5] = bz; P[i + 6] = cx; P[i + 7] = cy; P[i + 8] = cz; P[i + 9] = dx; P[i + 10] = dy; P[i + 11] = dz;
      for (let k = 0; k < 4; k++, i += 3) { Nn[i] = nx; Nn[i + 1] = ny; Nn[i + 2] = nz; C[i] = cr; C[i + 1] = cg; C[i + 2] = cb; M[i] = mat; M[i + 1] = fl; M[i + 2] = wts ? wts[k] : ex; }
      wts = null;
      i = (n - base) * 4;
      Q[i + 2] = w; Q[i + 3] = qh; Q[i + 4] = w; Q[i + 6] = w; Q[i + 7] = qh; Q[i + 8] = w; Q[i + 9] = h; Q[i + 10] = w; Q[i + 11] = qh; Q[i + 13] = h; Q[i + 14] = w; Q[i + 15] = qh;
      I[ni] = n; I[ni + 1] = n + 1; I[ni + 2] = n + 2; I[ni + 3] = n; I[ni + 4] = n + 2; I[ni + 5] = n + 3; ni += 6; n += 4; return g;
    },
    tri(a0, b0, c0) {
      const ax = ox + a0[0] * cs + a0[2] * sn, ay = oy + a0[1], az = oz - a0[0] * sn + a0[2] * cs, bx = ox + b0[0] * cs + b0[2] * sn, by = oy + b0[1], bz = oz - b0[0] * sn + b0[2] * cs;
      const cx = ox + c0[0] * cs + c0[2] * sn, cy = oy + c0[1], cz = oz - c0[0] * sn + c0[2] * cs;
      const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const w = Math.hypot(ux, uy, uz), h = Math.hypot(vx, vy, vz), qh = shY === null ? h : shY;
      if (n - base + 4 > room) grow();
      if (ni + 6 > I.length) index();
      let i = (n - base) * 3;
      P[i] = ax; P[i + 1] = ay; P[i + 2] = az; P[i + 3] = bx; P[i + 4] = by; P[i + 5] = bz; P[i + 6] = cx; P[i + 7] = cy; P[i + 8] = cz;
      for (let k = 0; k < 3; k++, i += 3) { Nn[i] = nx; Nn[i + 1] = ny; Nn[i + 2] = nz; C[i] = cr; C[i + 1] = cg; C[i + 2] = cb; M[i] = mat; M[i + 2] = ex; }
      i = (n - base) * 4;
      Q[i + 2] = w; Q[i + 3] = qh; Q[i + 4] = w; Q[i + 6] = w; Q[i + 7] = qh; Q[i + 8] = w * 0.5; Q[i + 9] = h; Q[i + 10] = w; Q[i + 11] = qh;
      I[ni] = n; I[ni + 1] = n + 1; I[ni + 2] = n + 2; ni += 3; n += 3; return g;
    },
    // faces: 1 -x, 2 +x, 4 -y, 8 +y, 16 -z, 32 +z
    box(x0, y0, z0, x1, y1, z1, fl = 15, faces = 63) {
      if (faces & 1) g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], fl);
      if (faces & 2) g.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], fl);
      if (faces & 4) g.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], fl);
      if (faces & 8) g.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], fl);
      if (faces & 16) g.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], fl);
      if (faces & 32) g.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], fl);
      return g;
    },
    // a tapered block about (cx, cz): half sizes (ax, az) at y0 and (bx, bz) at y1; top: close it
    taper(cx, cz, y0, y1, ax, az, bx, bz, fl = 3, top = true) {
      const p = (sx, sz, t) => [cx + sx * (t ? bx : ax), t ? y1 : y0, cz + sz * (t ? bz : az)];
      g.quad(p(-1, -1, 0), p(-1, 1, 0), p(-1, 1, 1), p(-1, -1, 1), fl);
      g.quad(p(1, 1, 0), p(1, -1, 0), p(1, -1, 1), p(1, 1, 1), fl);
      g.quad(p(1, -1, 0), p(-1, -1, 0), p(-1, -1, 1), p(1, -1, 1), fl);
      g.quad(p(-1, 1, 0), p(1, 1, 0), p(1, 1, 1), p(-1, 1, 1), fl);
      if (top && bx > 0.01 && bz > 0.01) g.quad(p(-1, 1, 1), p(1, 1, 1), p(1, -1, 1), p(-1, -1, 1), 15);
      return g;
    },
    // a round or many-sided shaft about (cx, cz); o.a0, o.a1: part of the round; o.cap: close the top
    cyl(cx, cz, y0, y1, r0, r1, sides = 8, o = {}) {
      const a0 = o.a0 ?? 0, a1 = o.a1 ?? Math.PI * 2, ph = o.phase ?? 0;
      for (let i = 0; i < sides; i++) {
        const a = ph + a0 + (a1 - a0) * i / sides, b = ph + a0 + (a1 - a0) * (i + 1) / sides;
        const ca = Math.cos(a), sa = Math.sin(a), cb2 = Math.cos(b), sb = Math.sin(b);
        if (r1 > 0.005) g.quad([cx + cb2 * r0, y0, cz + sb * r0], [cx + ca * r0, y0, cz + sa * r0], [cx + ca * r1, y1, cz + sa * r1], [cx + cb2 * r1, y1, cz + sb * r1], o.fl ?? 0);
        else g.tri([cx + cb2 * r0, y0, cz + sb * r0], [cx + ca * r0, y0, cz + sa * r0], [cx, y1, cz]);
        if (o.cap && r1 > 0.005) g.tri([cx, y1, cz], [cx + cb2 * r1, y1, cz + sb * r1], [cx + ca * r1, y1, cz + sa * r1]);
      }
      return g;
    },
    // a square beam from p to q, w broad and t thick; ends: close both ends
    beam(p, q, w, t, fl = 15, ends = false, upHint = [0, 1, 0]) {
      let dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
      let hx = upHint[0], hy = upHint[1], hz = upHint[2];
      if (Math.abs(dx * hx + dy * hy + dz * hz) > 0.96) { hx = 1; hy = 0; hz = 0; }
      let sx = dy * hz - dz * hy, sy = dz * hx - dx * hz, sz = dx * hy - dy * hx; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      const tx = sy * dz - sz * dy, ty = sz * dx - sx * dz, tz = sx * dy - sy * dx;
      const c = (e, a, b) => [e[0] + sx * a * w / 2 + tx * b * t / 2, e[1] + sy * a * w / 2 + ty * b * t / 2, e[2] + sz * a * w / 2 + tz * b * t / 2];
      g.quad(c(p, -1, 1), c(p, 1, 1), c(q, 1, 1), c(q, -1, 1), fl & 3);
      g.quad(c(p, 1, -1), c(p, -1, -1), c(q, -1, -1), c(q, 1, -1), fl & 3);
      g.quad(c(p, 1, 1), c(p, 1, -1), c(q, 1, -1), c(q, 1, 1), fl & 3);
      g.quad(c(p, -1, -1), c(p, -1, 1), c(q, -1, 1), c(q, -1, -1), fl & 3);
      if (ends) { g.quad(c(p, -1, -1), c(p, 1, -1), c(p, 1, 1), c(p, -1, 1), 15); g.quad(c(q, -1, 1), c(q, 1, 1), c(q, 1, -1), c(q, -1, -1), 15); }
      return g;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      // (the pieces end to end, each attribute in one array of its own length)
      const pieces = [...full, [P, Nn, C, M, Q, n - base]];
      const whole = (k, size) => { const out = new Float32Array(n * size); let at = 0; for (const piece of pieces) { out.set(piece[k].subarray(0, piece[5] * size), at); at += piece[5] * size; } return out; };
      geo.setAttribute('position', new THREE.BufferAttribute(whole(0, 3), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(whole(1, 3), 3));
      geo.setAttribute('aC', new THREE.BufferAttribute(whole(2, 3), 3));
      geo.setAttribute('aM', new THREE.BufferAttribute(whole(3, 3), 3));
      geo.setAttribute('aQ', new THREE.BufferAttribute(whole(4, 4), 4));
      geo.setIndex(n > 65535 ? new THREE.BufferAttribute(I.slice(0, ni), 1) : new THREE.BufferAttribute(new Uint16Array(I.subarray(0, ni)), 1));
      geo.computeBoundingSphere(); geo.computeBoundingBox();
      return geo;
    },
  };
  return g;
}

// ---------------------------------------------------------------- walls with pointed openings
// A wall's frame: origin o, outward normal n (level); u runs to the right as seen from outside. p(a, y, d) is the
// point a metres along, y metres up and d metres INTO the wall.
export function wallFrame(o, n) {
  const u = [n[2], 0, -n[0]];
  return { o, n, u, p: (a, y, d = 0) => [o[0] + u[0] * a - n[0] * d, o[1] + y, o[2] + u[2] * a - n[2] * d] };
}
// a pointed arch: half breadth w, springing at ys, point at ya (a round arch where the rise is not over w)
export function archPts(w, ys, ya, n = 5) {
  const h = Math.max(ya - ys, w), c = (h * h - w * w) / (2 * w), R = w + c, a1 = Math.atan2(h, c), k = (ya - ys) / h, out = [];
  for (let i = 0; i <= n; i++) { const a = a1 * i / n; out.push([c - R * Math.cos(a), ys + R * Math.sin(a) * k]); }
  for (let i = n - 1; i >= 0; i--) { const a = a1 * i / n; out.push([-(c - R * Math.cos(a)), ys + R * Math.sin(a) * k]); }
  return out;
}
// The face of a wall from u0 to u1 and y0 to y1 with pointed openings side by side, and their reveals.
// holes: [{ c, w, yb, ys, ya, d (depth of the reveal), n }], sorted by c. The face takes no arris wear (it is made of
// several pieces); each reveal wears along its front arris. revealEx: how deep in a hollow the reveals count.
export function archWall(g, F, u0, u1, y0, y1, holes, revealEx = 0.5) {
  let prev = u0;
  for (const h of holes) {
    const pts = archPts(h.w, h.ys, h.ya, h.n ?? 5), L = h.c - h.w, R = h.c + h.w, d = h.d ?? 1;
    if (L > prev + 1e-3) g.quad(F.p(prev, y0), F.p(L, y0), F.p(L, y1), F.p(prev, y1));
    if (h.yb > y0 + 1e-3) g.quad(F.p(L, y0), F.p(R, y0), F.p(R, h.yb), F.p(L, h.yb));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      g.quad(F.p(h.c + a[0], a[1]), F.p(h.c + b[0], b[1]), F.p(h.c + b[0], y1), F.p(h.c + a[0], y1));
    }
    if (d > 0) {
      const m0 = g.matState();
      g.mat(m0[0], revealEx);
      g.quad(F.p(L, h.yb, 0), F.p(L, h.yb, d), F.p(L, h.ys, d), F.p(L, h.ys, 0), 1);
      g.quad(F.p(R, h.yb, d), F.p(R, h.yb, 0), F.p(R, h.ys, 0), F.p(R, h.ys, d), 2);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        g.quad(F.p(h.c + b[0], b[1], 0), F.p(h.c + a[0], a[1], 0), F.p(h.c + a[0], a[1], d), F.p(h.c + b[0], b[1], d), 4);
      }
      if (h.sill !== false) g.quad(F.p(L, h.yb, 0), F.p(R, h.yb, 0), F.p(R, h.yb, d), F.p(L, h.yb, d), 4);
      g.mat(m0[0], m0[1]);
    }
    prev = R;
  }
  if (u1 > prev + 1e-3) g.quad(F.p(prev, y0), F.p(u1, y0), F.p(u1, y1), F.p(prev, y1));
  return g;
}
// a panel that fills an opening at depth d (glass, a dark hollow, a door leaf), in the builder's present colour and kind
export function archFill(g, F, h, d) {
  const pts = archPts(h.w, h.ys, h.ya, h.n ?? 5);
  g.quad(F.p(h.c - h.w, h.yb, d), F.p(h.c + h.w, h.yb, d), F.p(h.c + h.w, h.ys, d), F.p(h.c - h.w, h.ys, d));
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    g.quad(F.p(h.c + a[0], h.ys, d), F.p(h.c + b[0], h.ys, d), F.p(h.c + b[0], b[1], d), F.p(h.c + a[0], a[1], d));
  }
  return g;
}
// a round opening (a rose) of radius r about (c, cy) in a wall piece from u0 to u1, y0 to y1, with its reveal
export function roundWall(g, F, u0, u1, y0, y1, c, cy, r, d, sides = 24) {
  const sq = (a) => { const ca = Math.cos(a), sa = Math.sin(a), k = 1 / Math.max(Math.abs(ca), Math.abs(sa)); return [ca * k, sa * k]; };
  const hu = Math.min(c - u0, u1 - c), hv = Math.min(cy - y0, y1 - cy), R = Math.min(hu, hv);
  for (let i = 0; i < sides; i++) {
    const a = Math.PI * 2 * i / sides, b = Math.PI * 2 * (i + 1) / sides, sa = sq(a), sb = sq(b);
    const pa = [c + Math.cos(a) * r, cy + Math.sin(a) * r], pb = [c + Math.cos(b) * r, cy + Math.sin(b) * r];
    g.quad(F.p(pa[0], pa[1]), F.p(c + sa[0] * R, cy + sa[1] * R), F.p(c + sb[0] * R, cy + sb[1] * R), F.p(pb[0], pb[1]));
    const m0 = g.matState(); g.mat(m0[0], 0.5);
    g.quad(F.p(pa[0], pa[1], 0), F.p(pb[0], pb[1], 0), F.p(pb[0], pb[1], d), F.p(pa[0], pa[1], d), 4);
    g.mat(m0[0], m0[1]);
  }
  if (c - R > u0 + 1e-3) g.quad(F.p(u0, y0), F.p(c - R, y0), F.p(c - R, y1), F.p(u0, y1));
  if (u1 > c + R + 1e-3) g.quad(F.p(c + R, y0), F.p(u1, y0), F.p(u1, y1), F.p(c + R, y1));
  if (cy - R > y0 + 1e-3) g.quad(F.p(c - R, y0), F.p(c + R, y0), F.p(c + R, cy - R), F.p(c - R, cy - R));
  if (y1 > cy + R + 1e-3) g.quad(F.p(c - R, cy + R), F.p(c + R, cy + R), F.p(c + R, y1), F.p(c - R, y1));
  return g;
}

// ---------------------------------------------------------------- the second scale of form: bars, webs, rakes
// A stone bar on a wall's frame from a to b ([along, up]), w broad, its face at depth d0 and its sides back to d1.
export function bar(g, F, a, b, w, d0, d1) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, sx = -(b[1] - a[1]) / L * w / 2, sy = (b[0] - a[0]) / L * w / 2;
  g.quad(F.p(a[0] - sx, a[1] - sy, d0), F.p(b[0] - sx, b[1] - sy, d0), F.p(b[0] + sx, b[1] + sy, d0), F.p(a[0] + sx, a[1] + sy, d0));
  g.quad(F.p(a[0] - sx, a[1] - sy, d1), F.p(b[0] - sx, b[1] - sy, d1), F.p(b[0] - sx, b[1] - sy, d0), F.p(a[0] - sx, a[1] - sy, d0));
  g.quad(F.p(a[0] + sx, a[1] + sy, d0), F.p(b[0] + sx, b[1] + sy, d0), F.p(b[0] + sx, b[1] + sy, d1), F.p(a[0] + sx, a[1] + sy, d1));
  return g;
}
// bars along a line of points
export function bars(g, F, pts, w, d0, d1) { for (let i = 0; i < pts.length - 1; i++) bar(g, F, pts[i], pts[i + 1], w, d0, d1); return g; }
// n bars round an arc of radius r about (c, cy) from angle a0 to a1
export function arcBars(g, F, c, cy, r, a0, a1, n, w, d0, d1) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([c + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return bars(g, F, pts, w, d0, d1);
}
// A rose's web of stone about (c, cy), radius R: a hub, n slender spokes to a ring of round heads at half the
// radius, twice as many beyond it, each pair closed by a round head against the rim.
export function roseWeb(g, F, c, cy, R, n, d0, d1) {
  const r0 = R * 0.14, r1 = R * 0.5, h1 = r1 * Math.sin(Math.PI / n), r2 = R * 0.87, h2 = r2 * Math.sin(Math.PI / (2 * n)), w = Math.max(0.1, R * 0.028);
  arcBars(g, F, c, cy, r0, 0, Math.PI * 2, n, w * 1.2, d0, d1);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n, b = a + Math.PI * 2 / n, m = (a + b) / 2, ca = Math.cos(a), sa = Math.sin(a);
    bar(g, F, [c + ca * r0, cy + sa * r0], [c + ca * r1, cy + sa * r1], w, d0, d1);
    arcBars(g, F, c + Math.cos(m) * r1 * Math.cos(Math.PI / n), cy + Math.sin(m) * r1 * Math.cos(Math.PI / n), h1, m - Math.PI / 2, m + Math.PI / 2, 4, w, d0, d1);
  }
  for (let i = 0; i < 2 * n; i++) {
    const a = Math.PI * i / n, b = a + Math.PI / n, m = (a + b) / 2, ca = Math.cos(a), sa = Math.sin(a), k = Math.cos(Math.PI / (2 * n));
    bar(g, F, [c + ca * (r1 + h1 * (i % 2 ? 1 : 0.05)), cy + sa * (r1 + h1 * (i % 2 ? 1 : 0.05))], [c + ca * r2, cy + sa * r2], w * 0.85, d0, d1);
    arcBars(g, F, c + Math.cos(m) * r2 * k, cy + Math.sin(m) * r2 * k, h2, m - Math.PI / 2, m + Math.PI / 2, 4, w * 0.85, d0, d1);
  }
  return g;
}
// A gable's two rakes over an opening: copings from (c - hw, yb) and (c + hw, yb) to the point (c, yt), standing
// 'out' proud of the wall, a leaf every 'step' along both, a finial on the point.
export function rakes(g, F, c, hw, yb, yt, out, o = {}) {
  const w = o.w ?? 0.3, step = o.step ?? 0.9, k = o.leaf ?? 0.2;
  for (const s of [-1, 1]) {
    const a = [c + s * hw, yb], b = [c, yt], L = Math.hypot(hw, yt - yb), tx = -s * hw / L, ty = (yt - yb) / L, nx = s * ty, ny = -s * tx;
    bar(g, F, s < 0 ? a : b, s < 0 ? b : a, w, -out, 0);
    for (let q = step * 0.6; q < L - step * 0.4; q += step) {
      const x = a[0] + tx * q + nx * w * 0.5, y = a[1] + ty * q + ny * w * 0.5;
      const p0 = F.p(x - tx * k, y - ty * k, -out * 0.5), p1 = F.p(x + tx * k, y + ty * k, -out * 0.5), p2 = F.p(x + nx * k * 1.5 + tx * k * 0.6, y + ny * k * 1.5 + ty * k * 0.6, -out * 0.5);
      if (s < 0) { g.tri(p1, p0, p2); g.tri(p0, p1, p2); } else { g.tri(p0, p1, p2); g.tri(p1, p0, p2); }
    }
  }
  const t = F.p(c, yt + 0.1, -out * 0.5), fs = o.finial ?? 0.16;
  g.taper(t[0], t[2], t[1], t[1] + fs * 4, fs, fs, fs * 0.45, fs * 0.45, 0, false);
  g.taper(t[0], t[2], t[1] + fs * 4, t[1] + fs * 5.4, fs * 1.5, fs * 1.5, fs * 0.2, fs * 0.2, 0, true);
  return g;
}
// a roll moulding round a pointed opening h (see archWall), w broad, standing 'out' proud of the wall
export function moulding(g, F, h, w, out, n = 5) {
  const pts = archPts(h.w + w * 0.5, h.ys, h.ya + w * 0.5, n).map((p) => [h.c + p[0], p[1]]);
  if (h.yb < h.ys - 0.01) { bar(g, F, [h.c + h.w + w * 0.5, h.yb], [h.c + h.w + w * 0.5, h.ys], w, -out, 0); bar(g, F, [h.c - h.w - w * 0.5, h.ys], [h.c - h.w - w * 0.5, h.yb], w, -out, 0); }
  return bars(g, F, pts, w, -out, 0);
}
// a window's tracery in the opening h, its face at depth d0: a mullion, two pointed lights, a ring in the head
export function tracery(g, F, h, d0, d1, w = 0.14) {
  const hw = h.w / 2, H = h.ya - h.ys, rise = H * 0.62, r = Math.min(h.w * 0.32, H * 0.24);
  bar(g, F, [h.c, h.yb], [h.c, h.ys + rise * 0.5], w, d0, d1);
  for (const s of [-1, 1]) bars(g, F, archPts(hw, h.ys, h.ys + rise, 3).map((p) => [h.c + s * hw + p[0], p[1]]), w, d0, d1);
  return arcBars(g, F, h.c, h.ya - r - H * 0.14, r, 0, Math.PI * 2, 8, w * 0.85, d0, d1);
}

// An openwork balustrade from a to b ([x, z]) standing on y0, h high: a plinth, slender balusters, a rail.
function balustrade(g, a, b, y0, h, step, three) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, n = Math.max(2, Math.round(L / step));
  g.beam([a[0], y0 + 0.07, a[1]], [b[0], y0 + 0.07, b[1]], 0.32, 0.14, 3); g.beam([a[0], y0 + h - 0.09, a[1]], [b[0], y0 + h - 0.09, b[1]], 0.36, 0.18, 3);
  for (let i = 0; i <= n; i++) {
    const x = a[0] + dx * i / n, z = a[1] + dz * i / n, w = i % 6 === 0 ? 0.13 : 0.06;
    if (three && i % 6) { g.tri([x - ux * w, y0 + 0.14, z - uz * w], [x + ux * w, y0 + 0.14, z + uz * w], [x, y0 + h - 0.18, z]); g.tri([x + ux * w, y0 + 0.14, z + uz * w], [x - ux * w, y0 + 0.14, z - uz * w], [x, y0 + h - 0.18, z]); }
    else g.taper(x, z, y0 + 0.14, y0 + h - 0.18, w, w, w, w, 0, false);
  }
}

// ---------------------------------------------------------------- the church's measures (metres, the world's axes)
const STONE = [0.255, 0.232, 0.213], TOWER = [0.2, 0.183, 0.171], LEAD = [0.25, 0.265, 0.295], OAK = [0.12, 0.1, 0.086];
const SLATE = [0.11, 0.115, 0.13], GLASS = [1, 1, 1], BRONZE = [0.275, 0.218, 0.132], BELL_LIP = [1.25, 1.02, 0.64];
const CH = {
  towerTop: 69, towerSide: 14, gapHalf: 6.5, platform: 46, ridge: 43, eaves: 32, halfNave: 7, halfAisle: 17, halfBreadth: 24,
  crossing: [78, 0], steepleTip: 78, apseX: 104, transeptW: 71, transeptE: 85, southFace: 31, length: 128,
  navePiers: [20, 29, 38, 47, 56, 65], choirPiers: [96], apsePiers: 14,
};
export const CHURCH = CH;
// THE SOUTH DOOR'S SEAT: the place between the door's jambs where the world's route ends and its ring stands (the
// world hands in its route's last point as opts.doorSeat; this is that place, typed for the part alone).
// WHAT STANDS ACROSS THE WAY BEHIND THE RING'S PLANE (the oak leaf) keeps 2.0 m of clear air and a margin of 0.6 m
// from the seat, which is the flown line's end: BEHIND_RING, a sum from the seat and no typed depth.
const DOOR_SEAT = [78, 6.5, 28.5], BEHIND_RING = 2.0 + 0.6;

// the west front below the towers: three deep doors, the kings' gallery, the rose between two paired windows, the open arcade
async function westFront(g, bosses, kings, ctx) {
  const F = wallFrame([0, 0, 0], [-1, 0, 0]);
  const bays = [[-19, -8, -13.5], [-5, 5, 0], [8, 19, 13.5]];
  // the four great buttress strips, stepping back twice; each stage carries a niche under a small gable with a
  // worn standing figure in it, and a weathered offset below it
  for (const c of [-20.5, -6.5, 6.5, 20.5]) {
    for (const [x, y0, y1, yn] of [[-2.2, 0, 18, 9.3], [-1.6, 24.1, 37.4, 28.2]]) {
      const Fb = wallFrame([x, 0, c], [-1, 0, 0]), h = { c: 0, w: 0.72, yb: yn, ys: yn + 3.5, ya: yn + 4.7, d: 0.55, n: 4 };
      g.col(TOWER, 1.08).mat(0, 0).box(x, y0, c - 1.5, 0, y1, c + 1.5, 3, 16 | 32);
      archWall(g, Fb, -1.5, 1.5, y0, y1, [h], 0.5);
      g.col(TOWER, 0.8).mat(0, 0.6); archFill(g, Fb, h, 0.55);
      g.col(TOWER, 1.3).mat(0, 0); rakes(g, Fb, 0, 1.1, yn + 3.6, yn + 6.3, 0.22, { w: 0.2, step: 0.6, leaf: 0.13, finial: 0.09 });
      g.box(x - 0.16, yn - 1.0, c - 1.62, 0, yn - 0.62, c + 1.62, 15, 1 | 4 | 16 | 32);
      g.quad([x - 0.16, yn - 0.62, c - 1.62], [x - 0.16, yn - 0.62, c + 1.62], [x, yn - 0.2, c + 1.5], [x, yn - 0.2, c - 1.5], 4);
      kings.push([x + 0.3, yn, c, 0.92]);
    }
  }
  for (const [u0, u1, c] of bays) {
    await ctx.yield();
    const mid = c === 0, w = mid ? 4.2 : 3.9, ys = mid ? 7.5 : 6.5, ya = mid ? 14 : 12.6;
    // the door: seven orders stepping in, each a hollow deeper than the last, a row of small worn figures in each;
    // over it a gable's two rakes with their leaves and a small dark round in the gable's field
    for (let k = 0; k < 7; k++) {
      const Fk = wallFrame([-0 + k * 0.5, 0, 0], [-1, 0, 0]);
      const a0 = k === 0 ? u0 : c - (w - (k - 1) * 0.3), a1 = k === 0 ? u1 : c + (w - (k - 1) * 0.3), top = k === 0 ? 18.4 : ya - (k - 1) * 0.36;
      g.col(STONE, 0.98 - k * 0.022).mat(0, k === 0 ? 0 : 0.2 + k * 0.08);
      const hk = { c, w: w - k * 0.3, yb: 0, ys: ys - k * 0.09, ya: ya - k * 0.36, d: 0.5, sill: false, n: 6 };
      archWall(g, Fk, a0, a1, 0, top, [hk], 0.25 + k * 0.09);
      bossRow(bosses, Fk, hk, 0.25, 0.78);
    }
    g.col(STONE, 1.25).mat(0, 0); rakes(g, F, c, w + 0.9, ys + 1.6, ya + 3.7, 0.3, { w: 0.34, step: 0.85, leaf: 0.2 });
    g.col(STONE, 0.5).mat(0, 0.7);
    for (let i = 0; i < 10; i++) { const a = Math.PI * 2 * i / 10, b = Math.PI * 2 * (i + 1) / 10; g.tri(F.p(c, ya + 1.75, -0.02), F.p(c + Math.cos(a) * 0.5, ya + 1.75 + Math.sin(a) * 0.5, -0.02), F.p(c + Math.cos(b) * 0.5, ya + 1.75 + Math.sin(b) * 0.5, -0.02)); }
    g.col(STONE, 1.25).mat(0, 0); arcBars(g, F, c, ya + 1.75, 0.56, 0, Math.PI * 2, 10, 0.12, -0.12, 0);
    const hd = { c, w: w - 6 * 0.3, yb: 0, ys: ys - 0.54, ya: ya - 2.16, n: 6 };
    const Fd = wallFrame([3.5, 0, 0], [-1, 0, 0]);
    g.col(OAK, 1.5).mat(5, 0.5); archFill(g, Fd, { ...hd, ys: ys - 1.4, ya: ys - 1.4 + 0.01 }, 0);
    g.col(STONE, 0.9).mat(0, 0.7); archFill(g, Fd, { ...hd, yb: ys - 1.4 }, -0.12);
    g.col(STONE, 1.05).mat(0, 0.3).box(3.1, 0, c - 0.28, 3.5, ys - 1.4, c + 0.28, 3, 1 | 16 | 32);
    g.box(3.22, ys - 1.4, c - hd.w, 3.5, ys - 0.9, c + hd.w, 12, 1 | 4 | 8);
    // the storey of the rose (the middle bay) or of two paired windows under the towers
    g.col(mid ? STONE : TOWER, mid ? 1 : 1.12).mat(0, 0);
    if (mid) {
      roundWall(g, F, u0, u1, 23.6, 38, 0, 31, 4.8, 0.9, 28);
      g.col(GLASS).mat(6, 0);
      for (let i = 0; i < 28; i++) {
        const a = Math.PI * 2 * i / 28, b = Math.PI * 2 * (i + 1) / 28;
        g.tri(F.p(0, 31, 0.9), F.p(Math.cos(a) * 4.8, 31 + Math.sin(a) * 4.8, 0.9), F.p(Math.cos(b) * 4.8, 31 + Math.sin(b) * 4.8, 0.9));
      }
      // the rose's web of stone over the dark glass, a moulded ring round it
      g.col(STONE, 1.25).mat(0, 0.1); roseWeb(g, F, 0, 31, 4.8, 12, 0.45, 0.88);
      g.col(STONE, 1.25).mat(0, 0); arcBars(g, F, 0, 31, 5.0, 0, Math.PI * 2, 28, 0.3, -0.2, 0);
    } else {
      const hs = [-2.1, 2.1].map((o) => ({ c: c + o, w: 1.5, yb: 25.2, ys: 32, ya: 35.4, d: 0.8 }));
      archWall(g, F, u0, u1, 23.6, 38, hs, 0.5);
      for (const h of hs) { g.col(GLASS).mat(6, 0); archFill(g, F, h, 0.8); g.col(TOWER, 1.3).mat(0, 0.2).box(0.5, 25.2, h.c - 0.1, 0.8, 33.6, h.c + 0.1, 3, 1 | 16 | 32); }
      // the pair stands under one relieving arch, a small dark round in its head
      g.col(TOWER, 1.3).mat(0, 0); moulding(g, F, { c, w: 3.95, yb: 32.3, ys: 32.3, ya: 37.2 }, 0.3, 0.2, 6);
      for (const h of hs) moulding(g, F, h, 0.18, 0.1);
      arcBars(g, F, c, 35.3, 0.62, 0, Math.PI * 2, 10, 0.14, -0.1, 0);
      g.col(TOWER, 0.45).mat(0, 0.7);
      for (let i = 0; i < 10; i++) { const a = Math.PI * 2 * i / 10, b = Math.PI * 2 * (i + 1) / 10; g.tri(F.p(c, 35.3, -0.02), F.p(c + Math.cos(a) * 0.56, 35.3 + Math.sin(a) * 0.56, -0.02), F.p(c + Math.cos(b) * 0.56, 35.3 + Math.sin(b) * 0.56, -0.02)); }
    }
  }
  // string courses across the whole front
  g.col(STONE, 1.2).mat(0, 0);
  for (const [y, t, p] of [[18, 0.4, 2.45], [23.6, 0.5, 2.5], [37.4, 0.6, 1.9]]) g.box(-p, y, -22.2, 0, y + t, 22.2, 15, 1 | 4 | 8 | 16 | 32);
}

// the kings' gallery, the open arcade and its platform between the towers, and the plain faces of the two tower feet
async function westFrontUpper(g, kings, ctx) {
  // the gallery: twenty-eight niches across the whole front, a dark hollow behind them
  const FG = wallFrame([-2.3, 0, 0], [-1, 0, 0]), pitch = 44 / 28, holes = [];
  for (let i = 0; i < 28; i++) { const c = -22 + pitch * (i + 0.5); holes.push({ c, w: 0.56, yb: 18.4, ys: 21.9, ya: 22.8, d: 0.3, sill: false, n: 3 }); kings.push([-1.75, 18.4, c]); }
  g.col(STONE, 1.12).mat(0, 0); archWall(g, FG, -22.2, 22.2, 18.4, 23.6, holes, 0.2);
  // over every niche a small canopy (two rakes and a knob), between the niches a slender shaft
  g.col(STONE, 1.3).mat(0, 0);
  for (const h of holes) {
    bar(g, FG, [h.c - 0.74, 22.15], [h.c, 23.45], 0.13, -0.3, 0); bar(g, FG, [h.c, 23.45], [h.c + 0.74, 22.15], 0.13, -0.3, 0);
    g.cyl(-2.42, h.c - pitch / 2, 18.4, 22.1, 0.085, 0.085, 5);
  }
  g.cyl(-2.42, 22, 18.4, 22.1, 0.085, 0.085, 5);
  g.col(STONE, 0.8).mat(0, 0.75).quad([-1.0, 18.4, -22.2], [-1.0, 18.4, 22.2], [-1.0, 23.6, 22.2], [-1.0, 23.6, -22.2]);
  for (const sz of [-22.2, 22.2]) g.col(STONE, 1.05).mat(0, 0).box(-2.3, 18.4, Math.min(sz, sz * 0.99), 0, 23.6, Math.max(sz, sz * 0.99), 0, sz < 0 ? 16 : 32);
  await ctx.yield();
  // the arcade: slender piers with pointed heads, the sky between them in the middle bay
  const FA = wallFrame([-1.35, 0, 0], [-1, 0, 0]), FB = wallFrame([-1.0, 0, 0], [1, 0, 0]), ah = [], bh = [], ap = 44 / 34;
  for (let i = 0; i < 34; i++) { const c = -22 + ap * (i + 0.5); ah.push({ c, w: 0.46, yb: 38, ys: 43.5, ya: 44.9, d: 0.35, sill: false, n: 4 }); bh.push({ c: -c, w: 0.46, yb: 38, ys: 43.5, ya: 44.9, d: 0, n: 4 }); }
  bh.sort((p, q) => p.c - q.c);
  g.col(STONE, 1.2).mat(0, 0); archWall(g, FA, -22.2, 22.2, 38, 45.4, ah, 0.15);
  g.col(STONE, 0.95).mat(0, 0.3); archWall(g, FB, -22.2, 22.2, 38, 45.4, bh, 0.15);
  // the arcade's slender columns stand in pairs, one before each pier and one behind it, and every head is a
  // trefoil: two small cusps in the arch
  g.col(STONE, 1.3).mat(0, 0);
  for (let i = 0; i <= 34; i++) {
    const c = -22 + ap * i;
    g.cyl(-1.47, c, 38.25, 43.4, 0.1, 0.1, 5); g.cyl(-0.86, c, 38.25, 43.4, 0.1, 0.1, 5);
    g.box(-1.6, 43.4, c - 0.16, -0.74, 43.62, c + 0.16, 0, 1 | 2 | 4 | 16 | 32); g.box(-1.6, 38, c - 0.16, -0.74, 38.25, c + 0.16, 0, 1 | 2 | 8 | 16 | 32);
  }
  for (const h of ah) for (const sgn of [-1, 1]) {
    const a = FA.p(h.c + sgn * 0.41, 43.85, 0.12), b = FA.p(h.c + sgn * 0.27, 44.4, 0.12), t = FA.p(h.c + sgn * 0.17, 43.95, 0.12);
    g.tri(a, b, t); g.tri(a, t, b);
  }
  await ctx.yield();
  // the platform the arcade carries, from tower to tower and across both tower fronts, with its parapet
  g.col(STONE, 1.15).mat(0, 0).box(-1.9, 45.4, -22.4, 1.6, 46, 22.4, 15, 1 | 2 | 4 | 8 | 16 | 32);
  g.col(STONE, 1.3).mat(0, 0);
  balustrade(g, [-1.75, -22.2], [-1.75, 22.2], 46, 1, 0.42, false); balustrade(g, [1.45, -6.3], [1.45, 6.3], 46, 1, 0.42, false);
  // the towers' feet behind the arcade and beside the gap, the gap's floor of lead, the nave's west gable over it
  g.col(TOWER, 0.95).mat(0, 0.45);
  for (const s of [-1, 1]) g.quad(...(s < 0 ? [[0, 37.4, -20.5], [0, 37.4, -6.5], [0, 46, -6.5], [0, 46, -20.5]] : [[0, 37.4, 6.5], [0, 37.4, 20.5], [0, 46, 20.5], [0, 46, 6.5]]));
  g.col(TOWER, 1).mat(0, 0);
  g.quad([0, 38, -6.5], [14, 38, -6.5], [14, 46.2, -6.5], [0, 46.2, -6.5]);
  g.quad([14, 38, 6.5], [0, 38, 6.5], [0, 46.2, 6.5], [14, 46.2, 6.5]);
  g.quad([14, 0, -20.5], [0, 0, -20.5], [0, 46.2, -20.5], [14, 46.2, -20.5]);
  g.quad([0, 0, 20.5], [14, 0, 20.5], [14, 46.2, 20.5], [0, 46.2, 20.5]);
  g.quad([14, 13, -6.5], [14, 13, -20.5], [14, 46.2, -20.5], [14, 46.2, -6.5]);
  g.quad([14, 13, 20.5], [14, 13, 6.5], [14, 46.2, 6.5], [14, 46.2, 20.5]);
  g.col(STONE, 1).mat(0, 0);
  for (const s of [-1, 1]) g.quad(...(s < 0 ? [[0, 0, -24], [0, 0, -22], [0, 13.6, -22], [0, 13.6, -24]] : [[0, 0, 22], [0, 0, 24], [0, 13.6, 24], [0, 13.6, 22]]));
  g.col(LEAD).mat(1, 0).quad([0, 38, 6.5], [14, 38, 6.5], [14, 38, -6.5], [0, 38, -6.5]);
  g.col(STONE, 0.95).mat(0, 0.2);
  g.tri([14, 38, -3.18], [14, 38, 3.18], [14, 43, 0]);
}

// the two towers above the platform: four faces each with two tall belfry openings, hollow, the darkest stone
// louvres: [x, y, z, yaw, length] of each slate board; the faces toward the gap wear none. EVERY BOARD STANDS DEEP
// IN ITS OPENING, BETWEEN STONE AND STONE: its middle LOUVRE_IN metres inside the wall's face, at the back of the
// 1.5 m of the jambs' stone and well behind the mullion and the tracery, and it runs from the one jamb to the other
// and no farther; over the springing it is as much shorter as the arch is narrower at its upper edge (LOUVRE_GAP
// short of the arch's stone at each end). A board every 1.2 m (LOUVRE_STEP) from 49.2 m up (LOUVRE_Y0), thirteen to
// an opening (ten under the springing, three in the head), each LOUVRE_BROAD broad and sloping LOUVRE_SLOPE down to
// the outside: between two boards 0.91 m of the 1.2 m stand open to a level sight, and more than half to any sight
// from 20 degrees down to 60 degrees up.
// IN EACH TOWER ONE OPENING STANDS OPEN BEFORE A BELL (LOUVRE_OPEN): in the west face, the opening next to the gap
// between the towers (its middle on z -10.5 in the northern tower, on z 10.5 in the southern), the three boards
// at 54.0, 55.2 and 56.4 m are GONE (broken away, not swung back): from the board at 52.8 m to the one at 57.6 m
// the opening is clear, 4.3 m high and from jamb to jamb, and behind it a bell hangs whole with its headstock and
// its wheel (BELLS: the second, in the southern tower, and the third, in the northern)
const LOUVRE_STEP = 1.2, LOUVRE_Y0 = 49.2, LOUVRES = 13, LOUVRE_BROAD = 0.5, LOUVRE_SLOPE = 35 * Math.PI / 180, LOUVRE_IN = 1.2, LOUVRE_GAP = 0.03;
const LOUVRE_OPEN = [53.5, 57];
async function towers(g, louvres, ctx) {
  for (const cz of [-13.5, 13.5]) {
    await ctx.yield();
    const faces = [
      { o: [0, 0, cz], n: [-1, 0, 0], gap: false }, { o: [14, 0, cz], n: [1, 0, 0], gap: false },
      { o: [7, 0, cz - 7], n: [0, 0, -1], gap: cz > 0 }, { o: [7, 0, cz + 7], n: [0, 0, 1], gap: cz < 0 },
    ];
    for (const f of faces) {
      const F = wallFrame(f.o, f.n), hs = [-3, 3].map((c) => ({ c, w: 1.6, yb: 48, ys: 61, ya: 65, d: 1.5, n: 6 }));
      g.col(TOWER, 1).mat(0, 0); archWall(g, F, -7, 7, 46, 67, hs, 0.45);
      const Fi = wallFrame([f.o[0] - f.n[0] * 1.5, 0, f.o[2] - f.n[2] * 1.5], [-f.n[0], 0, -f.n[2]]);
      g.col(TOWER, 0.8).mat(0, 0.7); archWall(g, Fi, -5.5, 5.5, 47, 66, hs.map((h) => ({ ...h, d: 0 })), 0.7);
      // a slender shaft up the middle pier and a string course at the openings' springing
      g.col(TOWER, 1.25).mat(0, 0);
      g.beam(F.p(0, 47.2, -0.22), F.p(0, 66.4, -0.22), 0.5, 0.44, 3);
      g.beam(F.p(-7.3, 61, -0.18), F.p(-4.6, 61, -0.18), 0.4, 0.36, 3); g.beam(F.p(4.6, 61, -0.18), F.p(7.3, 61, -0.18), 0.4, 0.36, 3);
      g.beam(F.p(-1.4, 61, -0.18), F.p(1.4, 61, -0.18), 0.4, 0.36, 3);
      for (const c of [-4.85, -1.15, 1.15, 4.85]) g.beam(F.p(c, 48, -0.12), F.p(c, 61, -0.12), 0.2, 0.24, 3);
      g.beam(F.p(-7.3, 54.5, -0.1), F.p(-4.95, 54.5, -0.1), 0.26, 0.2, 3); g.beam(F.p(4.95, 54.5, -0.1), F.p(7.3, 54.5, -0.1), 0.26, 0.2, 3);
      // each tall lancet in a moulded frame, a mullion and a traceried head set before its louvres (the same on
      // the faces toward the gap as on the outer ones)
      for (const h of hs) { moulding(g, F, h, 0.34, 0.22, 6); tracery(g, F, h, 0.14, 0.44, 0.2); }
      if (!f.gap) for (const h of hs) {
        // (the arch over the springing is struck from a centre ac beyond the opening's middle, on the springing line)
        const rise = h.ya - h.ys, ac = (rise * rise - h.w * h.w) / (2 * h.w), up = LOUVRE_BROAD / 2 * Math.sin(LOUVRE_SLOPE);
        for (let i = 0; i < LOUVRES; i++) {
          const y = LOUVRE_Y0 + i * LOUVRE_STEP, dy = y + up - h.ys;
          const half = dy <= 0 ? h.w : Math.sqrt(Math.max((h.w + ac) * (h.w + ac) - dy * dy, 0)) - ac - LOUVRE_GAP;
          if (half < 0.4) continue;
          const p = F.p(h.c, y, LOUVRE_IN);
          if (f.n[0] < 0 && Math.abs(p[2]) < 12.2 && y > LOUVRE_OPEN[0] && y < LOUVRE_OPEN[1]) continue;
          louvres.push([p[0], p[1], p[2], Math.atan2(f.n[0], f.n[2]), half * 2]);
        }
      }
    }
    // corner piers a little proud of both faces, the cornice, the parapet, the lead flat inside it
    g.col(TOWER, 1.1).mat(0, 0);
    for (const sx of [0, 1]) for (const sz of [-1, 1]) {
      const x = sx ? 14 : 0, z = cz + sz * 7;
      g.box(x - (sx ? 1.9 : 0.45), 46, z - (sz > 0 ? 1.9 : 0.45), x + (sx ? 0.45 : 1.9), 67, z + (sz > 0 ? 0.45 : 1.9), 3, 1 | 2 | 16 | 32);
    }
    // three slender shafts clustered at every corner, ringed twice; a small pinnacle on the parapet over each
    for (const ox of [-1, 1]) for (const oz of [-1, 1]) {
      const px = (ox < 0 ? 0 : 14) + ox * 0.45, pz = cz + oz * 7.45;
      g.col(TOWER, 1.22).mat(0, 0);
      for (const [dx, dz] of [[ox * 0.12, oz * 0.12], [ox * 0.14, -oz * 0.8], [-ox * 0.8, oz * 0.14]]) {
        g.cyl(px + dx, pz + dz, 46.5, 66.9, 0.27, 0.27, 6);
        for (const y of [53.2, 60.4]) g.cyl(px + dx, pz + dz, y, y + 0.22, 0.36, 0.36, 6);
      }
      g.at(px - ox * 0.5, 67.7, pz - oz * 0.5); pinnacle(g, 0.85, TOWER); g.at();
    }
    g.col(TOWER, 1.3).mat(0, 0).box(-0.7, 67, cz - 7.7, 14.7, 67.7, cz + 7.7, 15, 1 | 2 | 4 | 16 | 32);
    g.col(TOWER, 1.3).box(-0.6, 46, cz - 7.6, 14.6, 46.5, cz + 7.6, 15, 1 | 2 | 8 | 16 | 32);
    g.col(LEAD).mat(1, 0).quad([-0.7, 67.7, cz + 7.7], [14.7, 67.7, cz + 7.7], [14.7, 67.7, cz - 7.7], [-0.7, 67.7, cz - 7.7]);
    g.col(TOWER, 1.2).mat(0, 0);
    balustrade(g, [-0.3, cz - 7.3], [14.3, cz - 7.3], 67.7, 1.3, 0.5, true); balustrade(g, [14.3, cz + 7.3], [-0.3, cz + 7.3], 67.7, 1.3, 0.5, true);
    balustrade(g, [-0.3, cz + 7.3], [-0.3, cz - 7.3], 67.7, 1.3, 0.5, true); balustrade(g, [14.3, cz - 7.3], [14.3, cz + 7.3], 67.7, 1.3, 0.5, true);
    // inside: an oak floor, a dark ceiling
    g.col(OAK, 1.6).mat(5, 0.5).quad([1.5, 47, cz + 5.5], [12.5, 47, cz + 5.5], [12.5, 47, cz - 5.5], [1.5, 47, cz - 5.5]);
    g.col(TOWER, 0.6).mat(0, 0.8).quad([1.5, 66, cz - 5.5], [12.5, 66, cz - 5.5], [12.5, 66, cz + 5.5], [1.5, 66, cz + 5.5]);
  }
}

// the fourteen bells: [x of the axle's middle, y of the axle, z, breadth at the lip, period in seconds], and their oak frames
// (THE SECOND AND THE THIRD ARE PLACED WITH THE WAY IN MIND, at typed places, the same on every seed: each hangs
// close behind the west face's opening next to the gap, in its own tower, where the boards are gone (see
// LOUVRE_OPEN), so that it is seen through its opening on the climb before the gap between the towers, which the
// design's journey names; the second hangs 2.6 m and the third 1.3 m beyond its opening's middle, away from the
// gap, and at no place of its swing does any part of bell, headstock or wheel come nearer the line than 10.7 m)
const BELLS = [
  [9.5, 58.2, 14.6, 2.6, 4.6], [4.0, 56.6, 13.1, 1.5, 3.1],
  [3.6, 56.5, -11.8, 1.7, 3.3], [7.0, 54.0, -14.6, 1.5, 3.0], [10.4, 54.0, -16.8, 1.4, 2.8],
  [3.6, 59.6, -16.8, 1.2, 2.5], [7.0, 59.6, -12.4, 1.1, 2.2], [10.4, 59.6, -14.6, 1.0, 2.0],
  [77.2, 49.6, -1.25, 0.9, 1.9], [78.8, 49.6, 0, 0.8, 1.75], [77.2, 49.6, 1.25, 0.75, 1.6],
  [78.8, 52.8, -1.25, 0.65, 1.45], [77.2, 52.8, 0, 0.55, 1.3], [78.8, 52.8, 1.25, 0.5, 1.2],
];
// THE FRAMES ARE HEAVY CARPENTRY OF OLD DARK OAK: every post, collar, head and sill 0.4 to 0.46 m thick (FRAME_T). A bell
// hangs between two trestles that stand across its axle's two ends; each trestle keeps, toward its bell, the face it
// had when its timbers were slight (FRAME_IN from the bell's middle plane: the lip's half breadth and 0.35 m, less
// half the slight timber), so that no bell's swing is nearer any timber than it was (counted: each bell's swept
// body and headstock from the nearest timber of any frame): the timber has grown outward.
// The towers' seven lesser bells hang at the heads of two raking posts with a collar between them; THE GREAT BELL
// (the first) hangs in the middle of a head beam between two upright posts that stand wider apart than its swing
// reaches at its lip, with a knee brace in each corner: the bell hangs whole between them.
// EVERY BELL CARRIES ITS WHEEL (bellGeometry: BELL_WHEEL of the lip's breadth in radius, half that breadth along the
// axle from the bell's middle): it turns between the bell and its trestle, a hand's breadth and more clear of the
// trestle's face (0.11 m at the great bell, more at the others), and reaches no other bell's frame or swing. THE
// TWO BELLS BEHIND THE OPEN OPENINGS (the second and the third) stand 1 m and more clear of every neighbour's
// posts and 0.4 m and more of its sills at their widest swing, and 0.29 m and more inside the west wall's inner
// face.
const BELL_WHEEL = 0.72;
const FRAME_T = (d) => 0.36 + d * 0.04, FRAME_IN = (d) => d * 0.5 + 0.35 - (0.12 + d * 0.07) / 2, FRAME_OAK = [0.15, 0.1, 0.065];
function bellFrames(g) {
  g.col(FRAME_OAK, 1).mat(5, 2);
  BELLS.slice(0, 8).forEach(([x, y, z, d], i) => {
    const t = FRAME_T(d), hw = FRAME_IN(d) + t / 2, wide = i === 0 ? d * 0.98 : d * 0.8;
    for (const s of [-1, 1]) {
      const zz = z + s * hw;
      if (i === 0) {
        g.beam([x - wide, 47, zz], [x - wide, y + t / 2, zz], t, t, 3).beam([x + wide, 47, zz], [x + wide, y + t / 2, zz], t, t, 3);
        g.beam([x - wide - t / 2, y, zz], [x + wide + t / 2, y, zz], t, t, 3, true);
        for (const k of [-1, 1]) g.beam([x + k * (wide - t * 0.4), y - 1.7, zz], [x + k * (wide - 1.7), y - t * 0.4, zz], t, t * 0.88, 3);
      } else {
        g.beam([x - d * 0.75, 47, zz], [x, y, zz], t, t, 3).beam([x + d * 0.75, 47, zz], [x, y, zz], t, t, 3);
        g.beam([x - d * 0.45, 47 + (y - 47) * 0.4, zz], [x + d * 0.45, 47 + (y - 47) * 0.4, zz], t, t, 3);
      }
    }
    g.beam([x - wide, 47.15, z - hw - 0.3], [x - wide, 47.15, z + hw + 0.3], t, t, 3, true);
    g.beam([x + wide, 47.15, z - hw - 0.3], [x + wide, 47.15, z + hw + 0.3], t, t, 3, true);
  });
}
// one bell, its lip one metre across, hung from the origin (the axle lies along z), with its oak headstock
function bellGeometry() {
  const g = makeGB(), prof = [[0.5, -0.95], [0.455, -0.88], [0.37, -0.74], [0.31, -0.52], [0.285, -0.34], [0.24, -0.2], [0.13, -0.15]];
  // bell metal: a pale golden bronze that shines dully (a kind of its own, 9: in the towers' shade it takes the
  // warm east's light, most on its shoulder), the sound bow at the lip worn to a bright pale gold all round
  for (let i = 0; i < prof.length - 1; i++) g.col(i === 0 ? BELL_LIP : BRONZE, i === 0 ? 1 : i === 1 ? 2.5 : 2.0).mat(9, 0).cyl(0, 0, prof[i][1], prof[i + 1][1], prof[i][0], prof[i + 1][0], 12);
  g.cyl(0, 0, -0.15, -0.15, 0.13, 0, 12);
  // a bell is hollow: its inside is seen from below and whenever it swings (no lid across its mouth: the hollow
  // itself is dark, the bronze unworn and in its own shade), and a clapper of pale iron hangs in it
  g.col(BRONZE, 0.32).cyl(0, 0, -0.3, -0.94, 0.2, 0.47, 12);
  g.col(BRONZE, 0.2); for (let i = 0; i < 12; i++) { const a = Math.PI * 2 * i / 12, b = Math.PI * 2 * (i + 1) / 12; g.tri([0, -0.3, 0], [Math.cos(a) * 0.2, -0.3, Math.sin(a) * 0.2], [Math.cos(b) * 0.2, -0.3, Math.sin(b) * 0.2]); }
  g.col([0.3, 0.3, 0.33]).cyl(0, 0, -0.9, -0.3, 0.035, 0.03, 5).cyl(0, 0, -1.03, -0.95, 0.03, 0.09, 6).cyl(0, 0, -0.95, -0.87, 0.09, 0.03, 6);
  g.col(OAK, 1.4).mat(5, 0).box(-0.16, -0.16, -0.62, 0.16, 0.14, 0.62, 15);
  // its WHEEL of pale oak at the headstock's one end, in the plane of the swing (the rope's wheel: a rim of ten
  // straight felloes BELL_WHEEL of the lip's breadth in radius, four spokes), turning with the bell about the axle
  g.col(OAK, 1.6);
  for (let i = 0; i < 10; i++) { const a = Math.PI * 2 * i / 10, b = Math.PI * 2 * (i + 1) / 10; g.beam([Math.cos(a) * BELL_WHEEL, Math.sin(a) * BELL_WHEEL, 0.5], [Math.cos(b) * BELL_WHEEL, Math.sin(b) * BELL_WHEEL, 0.5], 0.07, 0.07, 3, false, [0, 0, 1]); }
  g.beam([-BELL_WHEEL, 0, 0.5], [BELL_WHEEL, 0, 0.5], 0.06, 0.06, 3, false, [0, 0, 1]).beam([0, -BELL_WHEEL, 0.5], [0, BELL_WHEEL, 0.5], 0.06, 0.06, 3, false, [0, 0, 1]);
  return g.build();
}

// one tier of a flank's wall: spans [[x0, x1]...] on the plane z = sz * zAbs, windows at the given x
function flankWall(g, sz, zAbs, spans, y0, y1, win, wins, col, k) {
  const F = wallFrame([0, 0, sz * zAbs], [0, 0, sz]);
  for (const [x0, x1] of spans) {
    const hs = wins.filter((x) => x > x0 + win.w && x < x1 - win.w).map((x) => ({ ...win, c: sz * x })).sort((p, q) => p.c - q.c);
    g.col(col, k).mat(0, 0); archWall(g, F, sz > 0 ? x0 : -x1, sz > 0 ? x1 : -x0, y0, y1, hs, 0.5);
    for (const h of hs) { g.col(GLASS).mat(6, 0); archFill(g, F, h, h.d); if (win.tr) { g.col(col, k * 1.25).mat(0, 0.1); tracery(g, F, h, h.d - 0.32, h.d - 0.02, win.tr); } }
  }
}
// a lead slope between two level lines: the low one at (zLo, yLo), the high one at (zHi, yHi), from x0 to x1
function slope(g, x0, x1, zLo, yLo, zHi, yHi, fl = 0) {
  if (zLo > zHi) g.quad([x0, yLo, zLo], [x1, yLo, zLo], [x1, yHi, zHi], [x0, yHi, zHi], fl);
  else g.quad([x1, yLo, zLo], [x0, yLo, zLo], [x0, yHi, zHi], [x1, yHi, zHi], fl);
}
// nave, aisles and choir in three tiers on each flank, the long lead roof, the transept's walls and roof
async function naveBody(g, ctx) {
  const lowSpans = [[14, 67.5], [88.5, 104]], highSpans = [[14, 71], [85, 104]];
  const bays = [24.5, 33.5, 42.5, 51.5, 60.5, 92.2, 100], bays2 = [];
  for (const b of bays) bays2.push(b - 1.3, b + 1.3);
  for (const sz of [-1, 1]) {
    await ctx.yield();
    flankWall(g, sz, 24, lowSpans, 0, 11.6, { w: 1.7, yb: 3.4, ys: 7.4, ya: 9.9, d: 0.7, tr: 0.15 }, bays.concat([16.8]), STONE, 1);
    flankWall(g, sz, 17, highSpans, 13.2, 21.2, { w: 0.85, yb: 15, ys: 18, ya: 19.7, d: 0.5 }, bays2, STONE, 0.96);
    flankWall(g, sz, 7, highSpans, 24.2, 32, { w: 2.3, yb: 25.6, ys: 28.8, ya: 31.2, d: 0.6, tr: 0.17 }, bays.concat([16.8, 66.2]), STONE, 1.02);
    g.col(LEAD).mat(1, 0);
    for (const [x0, x1] of lowSpans) slope(g, x0, x1, sz * 24.2, 11.6, sz * 17, 13.4);
    for (const [x0, x1] of highSpans) slope(g, x0, x1, sz * 17.2, 21.2, sz * 7, 24.4);
    slope(g, 14, 104, sz * 7.6, 32, 0, 43, 8);
    // cornices under each roof's foot
    g.col(STONE, 1.22).mat(0, 0);
    for (const [x0, x1] of lowSpans) g.box(x0, 11, Math.min(sz * 24, sz * 24.35), x1, 11.75, Math.max(sz * 24, sz * 24.35), 12, (sz > 0 ? 32 : 16) | 4 | 8);
    for (const [x0, x1] of highSpans) {
      g.box(x0, 20.7, Math.min(sz * 17, sz * 17.3), x1, 21.35, Math.max(sz * 17, sz * 17.3), 12, (sz > 0 ? 32 : 16) | 4 | 8);
      g.box(x0, 31.4, Math.min(sz * 7, sz * 7.7), x1, 32.15, Math.max(sz * 7, sz * 7.7), 12, (sz > 0 ? 32 : 16) | 4 | 8);
    }
    // a pierced parapet at the foot of the high roof and of the aisle's; on the gallery's wall head a small pinnacle
    // over every bay, between the flying arches
    g.col(STONE, 1.25).mat(0, 0);
    for (const [x0, x1] of highSpans) balustrade(g, sz > 0 ? [x1, 7.55] : [x0, -7.55], sz > 0 ? [x0, 7.55] : [x1, -7.55], 32.15, 0.95, 0.5, true);
    for (const [x0, x1] of lowSpans) balustrade(g, sz > 0 ? [x1, 24.2] : [x0, -24.2], sz > 0 ? [x0, 24.2] : [x1, -24.2], 11.75, 0.9, 0.5, true);
    for (const x of bays) { g.at(x, 21.35, sz * 17.05); pinnacle(g, 0.62, STONE, 2); g.at(); }
    // the transept's arm: its two side walls, plain, with a string course
    g.col(STONE, 1).mat(0, 0);
    const z0 = Math.min(sz * 7, sz * 31), z1 = Math.max(sz * 7, sz * 31);
    g.quad([71, 0, z0], [71, 0, z1], [71, 32, z1], [71, 32, z0]);
    g.quad([85, 0, z1], [85, 0, z0], [85, 32, z0], [85, 32, z1]);
    g.col(STONE, 1.2);
    g.box(70.7, 31.4, z0, 71, 32.15, z1, 12, 1 | 4 | 8); g.box(85, 31.4, z0, 85.3, 32.15, z1, 12, 2 | 4 | 8);
  }
  await ctx.yield();
  g.col(LEAD).mat(1, 0);
  g.quad([70.4, 32, -31], [70.4, 32, 31], [78, 43, 31], [78, 43, -31], 8);
  g.quad([85.6, 32, 31], [85.6, 32, -31], [78, 43, -31], [78, 43, 31], 8);
  // the roof's crest: a lead roll along both ridges
  g.col(LEAD, 1.1).mat(1, 0);
  g.beam([14, 43.1, 0], [104, 43.1, 0], 0.5, 0.45, 0); g.beam([78, 43.1, -31], [78, 43.1, 31], 0.5, 0.45, 0);
  // a cresting of small lead leaves stands along both ridges
  g.col(LEAD, 0.8).mat(7, 0);
  for (let x = 14.5; x < 103.8; x += 0.62) { if (Math.abs(x - 78) < 3.2) continue; const a = [x - 0.2, 43.3, 0], b = [x + 0.2, 43.3, 0], t = [x, 43.95, 0]; g.tri(a, b, t); g.tri(b, a, t); }
  for (let z = -30.6; z < 30.8; z += 0.62) { if (Math.abs(z) < 3.2) continue; const a = [78, 43.3, z - 0.2], b = [78, 43.3, z + 0.2], t = [78, 43.95, z]; g.tri(a, b, t); g.tri(b, a, t); }
}
// the round east end about (104, 0): thirteen facets in three tiers, lead roofs in rings, a half cone over the choir's head
async function apse(g, ctx) {
  const cx = CH.apseX, tiers = [[24, 0, 11.6, { w: 1.5, yb: 3.4, ys: 7.4, ya: 9.9, d: 0.7 }, 1], [17, 13.2, 21.2, { w: 0.8, yb: 15, ys: 18, ya: 19.7, d: 0.5 }, 0.96], [7, 24.2, 32, { w: 0.62, yb: 25.6, ys: 29.2, ya: 31, d: 0.4 }, 1.02]];
  for (const [r, y0, y1, win, k] of tiers) for (let i = 0; i < 13; i++) {
    if (i === 0) await ctx.yield();
    const fa = -Math.PI / 2 + Math.PI * i / 13, fb = fa + Math.PI / 13, fm = (fa + fb) / 2, hw = r * Math.sin(Math.PI / 26), rm = r * Math.cos(Math.PI / 26);
    const F = wallFrame([cx + Math.cos(fm) * rm, 0, Math.sin(fm) * rm], [Math.cos(fm), 0, Math.sin(fm)]), h = { ...win, c: 0 };
    g.col(STONE, k).mat(0, 0); archWall(g, F, -hw, hw, y0, y1, [h], 0.5);
    g.col(GLASS).mat(6, 0); archFill(g, F, h, h.d);
    if (r > 20) { g.col(STONE, 1.25).mat(0, 0.1); tracery(g, F, h, h.d - 0.32, h.d - 0.02, 0.15); }
    g.col(STONE, 1.22).mat(0, 0).beam(F.p(-hw, y1 - 0.25, -0.15), F.p(hw, y1 - 0.25, -0.15), 0.7, 0.4, 3);
    // the stone forest of the round end: a pierced parapet on every wall head, a pinnacle over every bay of the
    // gallery (between the flying arches) and over every joint of the high wall
    g.col(STONE, 1.25);
    const pa = F.p(-hw, 0, 0.15), pb = F.p(hw, 0, 0.15); balustrade(g, [pb[0], pb[2]], [pa[0], pa[2]], y1 + 0.15, 0.9, 0.5, true);
    if (r < 20) { const pj = F.p(r > 10 ? 0 : -hw, 0, 0.1); g.at(pj[0], y1 + 0.15, pj[2], -fm); pinnacle(g, r > 10 ? 0.62 : 0.5, STONE, 2); g.at(); }
  }
  const o = { a0: -Math.PI / 2, a1: Math.PI / 2 };
  g.col(LEAD).mat(1, 0);
  g.cyl(cx, 0, 11.6, 13.4, 24.2, 17, 13, o); g.cyl(cx, 0, 21.2, 24.4, 17.2, 7, 13, o); g.cyl(cx, 0, 32, 43, 7.6, 0, 13, o);
}

// a row of small worn forms along one order of a door: up both jambs and over the arch. Each: [point, along, out]
function bossRow(out, F, h, depth, step) {
  const pts = archPts(h.w, h.ys, h.ya, 10), push = (a, y, ta, ty, na, ny) => out.push({ p: F.p(h.c + a, y, depth), t: [F.u[0] * ta, ty, F.u[2] * ta], n: [F.u[0] * na, ny, F.u[2] * na] });
  for (let y = 1.3; y < h.ys - 0.3; y += step) { push(-h.w, y, 0, 1, 1, 0); push(h.w, y, 0, 1, -1, 0); }
  let acc = step * 0.5;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ta = (b[0] - a[0]) / L, ty = (b[1] - a[1]) / L;
    while (acc < L) { push(a[0] + ta * acc, a[1] + ty * acc, ta, ty, ty, -ta); acc += step; }
    acc -= L;
  }
}
// the south transept's gable front: the deep door that holds the portal, a gallery of glass, a great rose, a pointed gable
function southFront(g, bosses, pinnacles, seatZ) {
  const F = wallFrame([78, 0, CH.southFace], [0, 0, 1]);
  for (const s of [-1, 1]) {
    // the corner buttresses: three stages of blind pointed panels on the face toward the court, a weathered
    // set-off under each stage
    const bx = 78 + s * 9.3, Fb = wallFrame([bx, 0, 32.2], [0, 0, 1]);
    g.col(STONE, 1.06).mat(0, 0);
    g.box(bx - 1.2, 0, 28.5, bx + 1.2, 41.5, 32.2, 3, 1 | 2 | 16);
    g.quad(Fb.p(-1.2, 0), Fb.p(1.2, 0), Fb.p(1.2, 1.6), Fb.p(-1.2, 1.6), 3);
    for (const [yb, yt] of [[1.6, 13.4], [14.2, 26.4], [27.2, 40.7]]) {
      const h = { c: 0, w: 0.72, yb: yb + 0.7, ys: yt - 2.6, ya: yt - 0.9, d: 0.34, n: 4 };
      g.col(STONE, 1.06).mat(0, 0); archWall(g, Fb, -1.2, 1.2, yb, yt, [h], 0.5);
      g.col(STONE, 0.86).mat(0, 0.6); archFill(g, Fb, h, 0.34);
      g.col(STONE, 1.2).mat(0, 0).box(bx - 1.32, yt, 28.5, bx + 1.32, yt + 0.8, 32.36, 15, 1 | 2 | 8 | 32);
      rakes(g, Fb, 0, 0.95, yt - 2.4, yt - 0.25, 0.16, { w: 0.14, step: 0.55, leaf: 0.11, finial: 0.06 });
    }
    g.col(STONE, 1.06).mat(0, 0);
    g.box(Math.min(78 + s * 8.1, 78 + s * 7), 0, 28.5, Math.max(78 + s * 8.1, 78 + s * 7), 32, 30.98, 0, 16);
    pinnacles.push([bx, 41.5, 30.35, 2.2]);
  }
  for (let k = 0; k < 5; k++) {
    const Fk = wallFrame([78, 0, CH.southFace - k * 0.7], [0, 0, 1]), h = { c: 0, w: 8 - k * 0.8, yb: 0, ys: 5.5 + k * 0.5, ya: 14.6 - k * 0.3, d: 0.7, sill: false, n: 8 };
    g.col(STONE, 1 - k * 0.025).mat(0, k === 0 ? 0 : 0.2 + k * 0.1);
    archWall(g, Fk, k === 0 ? -8.1 : -(8 - (k - 1) * 0.8), k === 0 ? 8.1 : 8 - (k - 1) * 0.8, 0, k === 0 ? 16.4 : 14.6 - (k - 1) * 0.3, [h], 0.3 + k * 0.1);
    bossRow(bosses, Fk, h, 0.35, 0.78);
  }
  const hd = { c: 0, w: 4.8, yb: 0, ys: 7.5, ya: 13.4, n: 8 };
  // THE OAK LEAF STANDS BEHIND THE RING (see DOOR_SEAT): its plane BEHIND_RING metres behind the seat's, and never
  // before the innermost order's back (zBack). From that back to the leaf the door's reveal is carried on as plain
  // coursed stone, as broad and as high as the innermost order's opening: two jambs, the pointed soffit, the
  // threshold (no worn arris, no small form: nothing new stands nearer the way than the innermost jambs do)
  const zBack = CH.southFace - 3.5, zLeaf = Math.min(zBack, seatZ - BEHIND_RING), deep = zBack - zLeaf, Fr = wallFrame([78, 0, zBack], [0, 0, 1]);
  g.col(OAK, 1.2).mat(5, 0.6); archFill(g, wallFrame([78, 0, zLeaf], [0, 0, 1]), hd, 0);
  if (deep > 1e-3) {
    const pts = archPts(hd.w, hd.ys, hd.ya, hd.n);
    g.col(STONE, 0.9).mat(0, 0.7);
    g.quad(Fr.p(-hd.w, 0.5, 0), Fr.p(-hd.w, 0.5, deep), Fr.p(-hd.w, hd.ys, deep), Fr.p(-hd.w, hd.ys, 0));
    g.quad(Fr.p(hd.w, 0.5, deep), Fr.p(hd.w, 0.5, 0), Fr.p(hd.w, hd.ys, 0), Fr.p(hd.w, hd.ys, deep));
    for (let i = 0; i < pts.length - 1; i++) g.quad(Fr.p(pts[i + 1][0], pts[i + 1][1], 0), Fr.p(pts[i][0], pts[i][1], 0), Fr.p(pts[i][0], pts[i][1], deep), Fr.p(pts[i + 1][0], pts[i + 1][1], deep));
    g.col(STONE, 1.1).mat(0, 0.2).quad(Fr.p(-hd.w, 0.5, 0), Fr.p(hd.w, 0.5, 0), Fr.p(hd.w, 0.5, deep), Fr.p(-hd.w, 0.5, deep));
  }
  g.col(STONE, 1.1).mat(0, 0.2).box(69.9, 0, 27.5, 86.1, 0.5, 31.6, 15, 8 | 32);
  g.box(69.3, 0, 31.6, 86.7, 0.25, 32.4, 15, 8 | 32 | 1 | 2);
  // the gallery of glass and the great rose
  const gl = []; for (let i = 0; i < 7; i++) gl.push({ c: -5.7 + i * 1.9, w: 0.72, yb: 17.4, ys: 22.3, ya: 23.9, d: 0.5 });
  g.col(STONE, 1).mat(0, 0); archWall(g, F, -8.1, 8.1, 16.4, 25, gl, 0.4);
  for (const h of gl) { g.col(GLASS).mat(6, 0); archFill(g, F, h, 0.5); }
  g.col(STONE, 1).mat(0, 0); roundWall(g, F, -8.1, 8.1, 25, 41.5, 0, 33, 6.5, 0.9, 32);
  g.col(GLASS).mat(6, 0);
  for (let i = 0; i < 32; i++) {
    const a = Math.PI * 2 * i / 32, b = Math.PI * 2 * (i + 1) / 32;
    g.tri(F.p(0, 33, 0.9), F.p(Math.cos(a) * 6.5, 33 + Math.sin(a) * 6.5, 0.9), F.p(Math.cos(b) * 6.5, 33 + Math.sin(b) * 6.5, 0.9));
  }
  // the great rose's web of stone over the dark glass, a moulded ring round it; small rounds in the four corners
  g.col(STONE, 1.25).mat(0, 0.1); roseWeb(g, F, 0, 33, 6.5, 16, 0.45, 0.88);
  g.col(STONE, 1.25).mat(0, 0); arcBars(g, F, 0, 33, 6.72, 0, Math.PI * 2, 32, 0.34, -0.22, 0);
  for (const [cu, cy] of [[-6.6, 26.6], [6.6, 26.6], [-6.6, 39.6], [6.6, 39.6]]) {
    g.col(STONE, 1.25).mat(0, 0); arcBars(g, F, cu, cy, 0.9, 0, Math.PI * 2, 10, 0.16, -0.12, 0);
    g.col(STONE, 0.5).mat(0, 0.7);
    for (let i = 0; i < 10; i++) { const a = Math.PI * 2 * i / 10, b = Math.PI * 2 * (i + 1) / 10; g.tri(F.p(cu, cy, -0.02), F.p(cu + Math.cos(a) * 0.82, cy + Math.sin(a) * 0.82, -0.02), F.p(cu + Math.cos(b) * 0.82, cy + Math.sin(b) * 0.82, -0.02)); }
  }
  // the door's own pointed gable stands free before the glazed gallery: two rakes with leaves, a ring in its field
  g.col(STONE, 1.25).mat(0, 0); rakes(g, F, 0, 8.7, 9.6, 21.8, 0.45, { w: 0.42, step: 1.0, leaf: 0.24, finial: 0.2 });
  arcBars(g, F, 0, 17.4, 1.05, 0, Math.PI * 2, 12, 0.2, -0.45, -0.1);
  for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + Math.PI * 2 * i / 3; arcBars(g, F, Math.cos(a) * 0.5, 17.4 + Math.sin(a) * 0.5, 0.45, a - 2.0, a + 2.0, 5, 0.1, -0.42, -0.14); }
  // string courses, the gable with its copings, the front's back above the transept's roof
  g.col(STONE, 1.22).mat(0, 0);
  for (const y of [16.4, 24.9, 41.2]) g.box(69.7, y, 31, 86.3, y + 0.45, 31.3, 12, 4 | 8 | 32);
  g.col(STONE, 1).mat(0, 0).tri(F.p(-8.1, 41.5), F.p(8.1, 41.5), F.p(0, 50.3));
  g.col(GLASS).mat(6, 0); for (let i = 0; i < 12; i++) { const a = Math.PI * 2 * i / 12, b = Math.PI * 2 * (i + 1) / 12; g.tri(F.p(0, 44.4, -0.03), F.p(Math.cos(a) * 1.3, 44.4 + Math.sin(a) * 1.3, -0.03), F.p(Math.cos(b) * 1.3, 44.4 + Math.sin(b) * 1.3, -0.03)); }
  g.col(STONE, 1.25).mat(0, 0.1); roseWeb(g, F, 0, 44.4, 1.3, 6, 0.0, 0.2);
  g.col(STONE, 1.25).mat(0, 0); arcBars(g, F, 0, 44.4, 1.42, 0, Math.PI * 2, 12, 0.2, -0.16, 0);
  g.beam(F.p(-8.4, 41.3, 0.15), F.p(0, 50.5, 0.15), 0.5, 0.6, 3); g.beam(F.p(0, 50.5, 0.15), F.p(8.4, 41.3, 0.15), 0.5, 0.6, 3);
  // leaves up both rakes of the gable
  rakes(g, F, 0, 8.4, 41.5, 50.7, 0.2, { w: 0.2, step: 1.0, leaf: 0.24, finial: 0.01 });
  g.col(STONE, 0.9).mat(0, 0.2);
  g.quad([86.1, 32, 30.7], [69.9, 32, 30.7], [69.9, 41.5, 30.7], [86.1, 41.5, 30.7]); g.tri([86.1, 41.5, 30.7], [69.9, 41.5, 30.7], [78, 50.3, 30.7]);
  pinnacles.push([78, 50.2, 30.85, 1.5]);
}
// the north transept's front, plain: a round window and a gable
function northFront(g, pinnacles) {
  const F = wallFrame([78, 0, -CH.southFace], [0, 0, -1]);
  for (const s of [-1, 1]) { g.col(STONE, 1.04).mat(0, 0).box(78 + s * 9.3 - 1.2, 0, -32.2, 78 + s * 9.3 + 1.2, 41.5, -28.5, 3, 1 | 2 | 16 | 32); pinnacles.push([78 + s * 9.3, 41.5, -30.35, 2.2]); }
  g.col(STONE, 1).mat(0, 0); archWall(g, F, -8.1, 8.1, 0, 25, [{ c: 0, w: 3.2, yb: 0, ys: 6, ya: 10.5, d: 1.6, sill: false }], 0.6);
  g.col(OAK, 1.2).mat(5, 0.6); archFill(g, F, { c: 0, w: 3.2, yb: 0, ys: 6, ya: 10.5 }, 1.6);
  g.col(STONE, 1).mat(0, 0); roundWall(g, F, -8.1, 8.1, 25, 41.5, 0, 33, 6, 0.9, 24);
  g.col(GLASS).mat(6, 0);
  for (let i = 0; i < 24; i++) { const a = Math.PI * 2 * i / 24, b = Math.PI * 2 * (i + 1) / 24; g.tri(F.p(0, 33, 0.9), F.p(Math.cos(a) * 6, 33 + Math.sin(a) * 6, 0.9), F.p(Math.cos(b) * 6, 33 + Math.sin(b) * 6, 0.9)); }
  g.col(STONE, 1).mat(0, 0).tri(F.p(-8.1, 41.5), F.p(8.1, 41.5), F.p(0, 50.3));
  g.col(STONE, 0.9).mat(0, 0.2);
  g.quad([69.9, 32, -30.7], [86.1, 32, -30.7], [86.1, 41.5, -30.7], [69.9, 41.5, -30.7]); g.tri([69.9, 41.5, -30.7], [86.1, 41.5, -30.7], [78, 50.3, -30.7]);
}

// a pinnacle at the builder's present place: a square shaft s broad, four small gables, a spire with crockets
function pinnacle(g, s, col = STONE, rows = 4) {
  g.col(col, 1.12).mat(0, 0);
  g.taper(0, 0, 0, s * 1.5, s * 0.5, s * 0.5, s * 0.5, s * 0.5, 3, false);
  g.taper(0, 0, s * 1.5, s * 1.72, s * 0.62, s * 0.62, s * 0.62, s * 0.62, 15, true);
  g.taper(0, 0, s * 1.72, s * 4.4, s * 0.46, s * 0.46, 0.03, 0.03, 3, false);
  g.col(col, 1.3);
  for (let i = 1; i <= rows; i++) {
    const t = i / (rows + 1.2), y = s * (1.72 + 2.68 * t), r = s * 0.46 * (1 - t) + 0.02, k = s * 0.12 * (rows < 4 ? 1.3 : 1);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.taper(dx * r, dz * r, y, y + k * 1.6, k, k, k * 0.3, k * 0.3, 0, true);
  }
  g.taper(0, 0, s * 4.4, s * 4.75, s * 0.13, s * 0.13, s * 0.05, s * 0.05, 0, true);
}
// one flying buttress in its own frame (z outward from the aisle's wall, x along it): the pier standing 2.6 m proud,
// its upper stage and pinnacle (tip at y 27), a plain spout, and the arch that leaps 17 m to the high wall
function buttressGeometry() {
  const g = makeGB();
  g.col(STONE, 1.04).mat(0, 0);
  g.box(-0.95, 0, 0, 0.95, 11.2, 2.6, 3, 1 | 2 | 32);
  g.box(-0.85, 11.2, -0.2, 0.85, 16.5, 2.5, 3, 1 | 2 | 16);
  g.quad([-0.95, 11.2, 2.6], [0.95, 11.2, 2.6], [0.85, 11.9, 2.5], [-0.85, 11.9, 2.5], 4);
  // the pier's outer face: a niche under a small gable with leaves
  const Fn = wallFrame([0, 0, 2.5], [0, 0, 1]), hn = { c: 0, w: 0.42, yb: 12.5, ys: 14.3, ya: 15.2, d: 0.4, n: 3 };
  archWall(g, Fn, -0.85, 0.85, 11.2, 16.5, [hn], 0.5);
  g.col(STONE, 0.8).mat(0, 0.6); archFill(g, Fn, hn, 0.4);
  g.col(STONE, 1.25).mat(0, 0); rakes(g, Fn, 0, 0.7, 14.5, 16.2, 0.16, { w: 0.14, step: 0.5, leaf: 0.1, finial: 0.06 });
  g.col(STONE, 1.04);
  g.box(-0.75, 16.5, -0.2, 0.75, 21.4, 2.3, 3, 1 | 2 | 16 | 32);
  g.quad([-0.85, 16.5, 2.5], [0.85, 16.5, 2.5], [0.75, 17.2, 2.3], [-0.75, 17.2, 2.3], 4);
  // the gabled head
  g.quad([-0.75, 21.4, 2.3], [0.75, 21.4, 2.3], [0.75, 22.6, 1.05], [-0.75, 22.6, 1.05], 8);
  g.quad([0.75, 21.4, -0.2], [-0.75, 21.4, -0.2], [-0.75, 22.6, 1.05], [0.75, 22.6, 1.05], 8);
  g.tri([-0.75, 21.4, -0.2], [-0.75, 21.4, 2.3], [-0.75, 22.6, 1.05]); g.tri([0.75, 21.4, 2.3], [0.75, 21.4, -0.2], [0.75, 22.6, 1.05]);
  g.col(STONE, 1.25).box(-0.2, 20.6, 2.3, 0.2, 20.95, 3.7, 15, 1 | 2 | 4 | 8 | 32);
  g.at(0, 22.3, 1.05); pinnacle(g, 1.0); g.at();
  // the arch: a straight coping above, a quadrant below, from the pier's inner face to the high wall 17 m in
  const N = 9, top = (t) => 22.0 + 8.3 * t, low = (t) => 13.6 + 15.6 * Math.sin(t * Math.PI / 2), hw = 0.42;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, z0 = -0.2 - 16.8 * t0, z1 = -0.2 - 16.8 * t1;
    g.col(STONE, 1).mat(0, 0);
    g.quad([-hw, low(t0), z0], [-hw, top(t0), z0], [-hw, top(t1), z1], [-hw, low(t1), z1], 3);
    g.quad([hw, low(t1), z1], [hw, top(t1), z1], [hw, top(t0), z0], [hw, low(t0), z0], 3);
    g.col(STONE, 0.9).mat(0, 0.35).quad([-hw, low(t0), z0], [-hw, low(t1), z1], [hw, low(t1), z1], [hw, low(t0), z0], 12);
    // the arch's back: a channel between two kerbs, that carries the high roof's water to the pier's spout
    const kw = 0.13, dp = 0.14;
    g.col(STONE, 1.2).mat(0, 0);
    g.quad([-hw, top(t1), z1], [-hw, top(t0), z0], [-hw + kw, top(t0), z0], [-hw + kw, top(t1), z1], 0);
    g.quad([hw - kw, top(t1), z1], [hw - kw, top(t0), z0], [hw, top(t0), z0], [hw, top(t1), z1], 0);
    g.col(STONE, 0.7).mat(0, 0.5);
    g.quad([-hw + kw, top(t1) - dp, z1], [-hw + kw, top(t0) - dp, z0], [hw - kw, top(t0) - dp, z0], [hw - kw, top(t1) - dp, z1], 0);
    g.quad([-hw + kw, top(t1), z1], [-hw + kw, top(t0), z0], [-hw + kw, top(t0) - dp, z0], [-hw + kw, top(t1) - dp, z1], 0);
    g.quad([hw - kw, top(t1) - dp, z1], [hw - kw, top(t0) - dp, z0], [hw - kw, top(t0), z0], [hw - kw, top(t1), z1], 0);
  }
  return g.build();
}
// the open bell steeple over the crossing: an eight-sided lead foot, an open stage of eight posts with pointed heads,
// a needle to y 78 cut through by two rings of open lights; no statues
function steeple(g) {
  const [cx, cz] = CH.crossing, R = 2.6, oct = (r, i) => { const a = Math.PI / 8 + Math.PI * i / 4; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; };
  g.col(LEAD, 0.95).mat(1, 0).cyl(cx, cz, 38.5, 47, R + 0.15, R + 0.15, 8, { phase: Math.PI / 8 });
  g.col(LEAD, 1.15).cyl(cx, cz, 46.6, 47.1, R + 0.4, R + 0.4, 8, { phase: Math.PI / 8, cap: true });
  for (let i = 0; i < 8; i++) {
    const a = oct(R, i), b = oct(R, i + 1), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nl = Math.hypot(mx - cx, mz - cz), n = [(mx - cx) / nl, 0, (mz - cz) / nl];
    const hw = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2, h = { c: 0, w: hw - 0.3, yb: 47.1, ys: 53.4, ya: 55.3, d: 0.3, sill: false, n: 4 };
    g.col(LEAD, 1.05).mat(1, 0); archWall(g, wallFrame([mx, 0, mz], n), -hw, hw, 47.1, 56, [h], 0.2);
    g.col(LEAD, 0.8).mat(1, 0.4); archWall(g, wallFrame([mx - n[0] * 0.3, 0, mz - n[2] * 0.3], [-n[0], 0, -n[2]]), -hw + 0.12, hw - 0.12, 47.1, 56, [{ ...h, d: 0 }], 0.2);
  }
  // the bells' oak beams in the open stage
  g.col(OAK, 1.3).mat(5, 0.2);
  for (const y of [49.6, 52.8]) for (const x of [77.2, 78.8]) g.beam([x, y + 0.05, cz - 2.3], [x, y + 0.05, cz + 2.3], 0.16, 0.2, 3);
  // the needle in five stages: solid, open, solid, open, solid to the tip
  const rAt = (y) => (R + 0.25) * (78 - y) / 22, stages = [[56, 59.4, 1], [59.4, 61.4, 0], [61.4, 65, 1], [65, 66.6, 0], [66.6, 78, 1]];
  g.col(LEAD, 1.15).mat(1, 0).cyl(cx, cz, 55.9, 56.3, R + 0.45, R + 0.45, 8, { phase: Math.PI / 8 });
  for (const [y0, y1, solid] of stages) {
    if (solid) { g.col(LEAD, 1).mat(1, 0).cyl(cx, cz, y0, y1, rAt(y0), rAt(y1), 8, { phase: Math.PI / 8 }); continue; }
    g.col(LEAD, 1.1).mat(1, 0);
    for (let i = 0; i < 8; i++) { const a = oct(rAt(y0), i), b = oct(rAt(y1), i); g.beam([a[0], y0 - 0.05, a[1]], [b[0], y1 + 0.05, b[1]], 0.22, 0.22, 3); }
    g.col(LEAD, 0.7).mat(1, 0.5).cyl(cx, cz, y0, y0, rAt(y0), 0, 8, { phase: Math.PI / 8 });
  }
  g.col(LEAD, 1.2).mat(1, 0).cyl(cx, cz, 78, 78.9, 0.07, 0.07, 6).cyl(cx, cz, 78.9, 79.4, 0.22, 0.03, 6).cyl(cx, cz, 78.6, 78.9, 0.03, 0.22, 6);
  // rolled ribs up the needle's eight arrises with small worn crockets, a slim pinnacle on each corner of the open
  // stage, a little gable over each of its openings, ribs down the foot
  for (let i = 0; i < 8; i++) {
    const dir = oct(1, i), ux = dir[0] - cx, uz = dir[1] - cz;
    g.col(LEAD, 1.3).mat(1, 0);
    for (const [y0, y1, solid] of stages) if (solid) { const a = oct(rAt(y0) + 0.04, i), b = oct(rAt(Math.min(y1, 77.6)) + 0.04, i); g.beam([a[0], y0, a[1]], [b[0], Math.min(y1, 77.6), b[1]], 0.16, 0.16, 3); }
    { const a = oct(R + 0.2, i); g.beam([a[0], 38.6, a[1]], [a[0], 46.6, a[1]], 0.2, 0.2, 3); }
    for (let y = 57.2; y < 75; y += 1.5) {
      if ((y > 59.2 && y < 61.6) || (y > 64.8 && y < 66.8)) continue;
      const r = rAt(y) + 0.1, x = cx + ux * r, z = cz + uz * r, k = 0.1 + 0.12 * (78 - y) / 22;
      g.tri([x - uz * k, y, z + ux * k], [x + uz * k, y, z - ux * k], [x + ux * k * 2.6, y + k * 2.2, z + uz * k * 2.6]);
      g.tri([x + uz * k, y, z - ux * k], [x - uz * k, y, z + ux * k], [x + ux * k * 2.6, y + k * 2.2, z + uz * k * 2.6]);
    }
    const c = oct(R + 0.42, i); g.col(LEAD, 1.2).taper(c[0], c[1], 55.6, 58.9, 0.17, 0.17, 0.02, 0.02, 3, false);
    const a = oct(R + 0.06, i), b2 = oct(R + 0.06, i + 1), m = [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2], q = 0.7;
    const ga = [m[0] + (a[0] - m[0]) * q, 56.2, m[1] + (a[1] - m[1]) * q], gb = [m[0] + (b2[0] - m[0]) * q, 56.2, m[1] + (b2[1] - m[1]) * q], gt = [m[0], 57.9, m[1]];
    g.col(LEAD, 1.1).tri(gb, ga, gt); g.tri(ga, gb, gt);
  }
}

// a worn stone king, 3.3 m, facing +z: a long robe in folds, crossed forearms, a small globe in one hand, a crown; no face
function kingGeometry() {
  const g = makeGB();
  g.col(STONE, 1.12).mat(0, 0);
  g.taper(0, 0, 0, 0.16, 0.46, 0.3, 0.44, 0.28, 3, true);
  g.taper(0, 0, 0.16, 2.3, 0.4, 0.26, 0.33, 0.22, 3, false);
  g.taper(0, 0, 2.3, 2.62, 0.33, 0.22, 0.43, 0.24, 3, true);
  // the shoulders slope a little and hold the snow
  g.quad([-0.47, 2.56, 0.26], [0.47, 2.56, 0.26], [0.4, 2.7, 0], [-0.4, 2.7, 0], 0); g.quad([0.47, 2.56, -0.26], [-0.47, 2.56, -0.26], [-0.4, 2.7, 0], [0.4, 2.7, 0], 0);
  g.col(STONE, 1.3);
  for (const x of [-0.24, -0.08, 0.1, 0.25]) g.taper(x, 0.25, 0.2, 1.75, 0.035, 0.03, 0.03, 0.03, 3, false);
  g.beam([-0.42, 2.25, 0.14], [-0.02, 2.0, 0.29], 0.13, 0.13, 3, true); g.beam([0.42, 2.25, 0.14], [0.16, 1.8, 0.3], 0.13, 0.13, 3, true);
  g.cyl(0.17, 0.34, 1.62, 1.74, 0.02, 0.1, 6).cyl(0.17, 0.34, 1.74, 1.86, 0.1, 0.02, 6);
  g.col(STONE, 1.18);
  g.cyl(0, 0.02, 2.62, 2.74, 0.1, 0.17, 8).cyl(0, 0.02, 2.74, 3.0, 0.17, 0.15, 8);
  g.col(STONE, 1.35).cyl(0, 0.02, 3.0, 3.2, 0.16, 0.22, 8, { cap: true });
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.taper(Math.cos(a) * 0.19, 0.02 + Math.sin(a) * 0.19, 3.2, 3.36, 0.035, 0.035, 0.01, 0.01, 0, false); }
  return g.build();
}
// one small worn form of a door's bands, half a metre: a fold, a leaf, a crown's stump; it stands along +y, proud toward +z
function bossGeometry() {
  const g = makeGB();
  g.col(STONE, 1.2).mat(0, 0.15);
  g.taper(0, 0.08, 0, 0.32, 0.13, 0.1, 0.1, 0.07, 3, true);
  g.col(STONE, 1.4);
  g.taper(0, 0.1, 0.34, 0.5, 0.075, 0.07, 0.1, 0.085, 3, true);
  return g.build();
}
// one slate louvre board, a metre long along x, LOUVRE_BROAD broad, sloping LOUVRE_SLOPE down toward +z (outward);
// its edges are the slate's own tone (no worn arris: none of its sides is marked as one), its ends stand in stone
function louvreGeometry() {
  const g = makeGB(), a = LOUVRE_BROAD / 2 * Math.sin(LOUVRE_SLOPE), b = LOUVRE_BROAD / 2 * Math.cos(LOUVRE_SLOPE);
  g.col([0.15, 0.14, 0.13], 1).mat(7, 0).beam([0, a, -b], [0, -a, b], 1, 0.06, 0, false, [0, 0, 1]);
  return g.build();
}
// the square's nine worn posts (nothing else stands on the square: its snow lies from the houses to the doors),
// and the court's walls south of the transept
function closeThings(g) {
  g.col(STONE, 1.15).mat(0, 0);
  for (let i = 0; i < 9; i++) { const z = -24 + i * 6; g.taper(-8, z, 0, 1.05, 0.2, 0.2, 0.15, 0.15, 3, false); g.taper(-8, z, 1.05, 1.22, 0.15, 0.15, 0.05, 0.05, 0, true); }
  // the court: low walls 2.2 m high with a coping that holds the snow, open to the river for 32 m about x 78
  const wall = (x0, z0, x1, z1) => { g.col(STONE, 0.95).mat(0, 0).box(x0, 0, z0, x1, 2.0, z1, 3, 1 | 2 | 16 | 32); g.col(STONE, 1.25).box(x0 - 0.08, 2.0, z0 - 0.08, x1 + 0.08, 2.2, z1 + 0.08, 12, 63); };
  // (the western side is the world's long range; the eastern side a range from z 62 to the water, this wall north of it)
  wall(107.7, 31, 108.3, 62); wall(53.4, 84.7, 62, 85.3); wall(94, 84.7, 102.6, 85.3);
  for (const x of [62, 94]) { g.col(STONE, 1.05).mat(0, 0).box(x - 0.55, 0, 84.45, x + 0.55, 2.7, 85.55, 3, 1 | 2 | 16 | 32); g.taper(x, 85, 2.7, 3.3, 0.6, 0.6, 0.1, 0.1, 0, true); }
}

// THE WORLD'S ONE ROUND: the edge of the sunlight, metres over the square, by the world's clock alone. Long bars of
// cloud drift before the low sun; as a gap between two of them passes it the edge comes down from above the
// steeple's tip (clock 0) past the towers' crowns (6 s), the high roof's ridge (20 s) and the house ridges (35 s)
// to under the water (60 s); it stands lit for 6 s; as the next bar crosses the sun the light is taken off the town
// upward by the same curve mirrored (60 s); then it comes down again. One period of EDGE_PERIOD seconds; the curve
// is a monotone cubic through the typed heights with level ends, so nothing jumps where the round turns. The
// world's cloud bars are drawn from this same function and phase (the world's buildBars).
export const EDGE_PERIOD = 126, EDGE_DOWN = 60, EDGE_TOP = 82, EDGE_LOW = -7.5;
const EDGE_KNOTS = [[0, EDGE_TOP], [6, 69], [20, 43], [35, 18], [EDGE_DOWN, EDGE_LOW]];
const EDGE_SLOPES = (() => {
  const K = EDGE_KNOTS, d = [], m = [0];
  for (let i = 0; i < K.length - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  for (let i = 1; i < K.length - 1; i++) m.push(2 * d[i - 1] * d[i] / (d[i - 1] + d[i]));
  m.push(0);
  return m;
})();
export function edgeAt(clock) {
  // the phase of the round, folded: 0 to EDGE_DOWN is the coming down, the same seconds back are the going off
  let p = clock % EDGE_PERIOD; if (p < 0) p += EDGE_PERIOD;
  if (p > EDGE_PERIOD - EDGE_DOWN) p = EDGE_PERIOD - p;
  if (p >= EDGE_DOWN) return EDGE_LOW;
  const K = EDGE_KNOTS; let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++;
  const h = K[i + 1][0] - K[i][0], t = (p - K[i][0]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * EDGE_SLOPES[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * EDGE_SLOPES[i + 1];
}

export async function buildHero(ctx, opts = {}) {
  const own = !opts.shared, shared = opts.shared || makeShared({ edge: 40 });
  const mat = makeSurface(shared), inner = new THREE.Group(), object = new THREE.Group();
  inner.rotation.y = Math.PI / 2; inner.position.z = CH.length / 2; object.add(inner);
  // the church's own draws, a stream to each thing, each made from the seed and a name: the bells' start phases,
  // the kings' small turns and sizes, the doors' small worn forms (no stream's draws follow another thing's count)
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('towers-' + name + ':' + ctx.seed));
  const rb = stream('bells'), rk = stream('kings'), rf = stream('forms');
  // the ring's seat in the south door: the world's route's last point, or the part's own typed place of it
  const seat = opts.doorSeat || DOOR_SEAT;
  // every shadow caster is an instanced mesh (the walls one instance each): one depth program serves the whole map
  const add = (geo, cast = true) => { const m = new THREE.InstancedMesh(geo, mat, 1); m.castShadow = cast; m.receiveShadow = true; inner.add(m); return m; };
  const kings = [], bosses = [], louvres = [], pinn = [];
  // (the page is given back between the big pieces, and before each mesh is made of what was laid)
  let g = makeGB(); await westFront(g, bosses, kings, ctx); await ctx.yield(); await westFrontUpper(g, kings, ctx); await ctx.yield(); add(g.build()); await ctx.yield();
  g = makeGB(); await towers(g, louvres, ctx); bellFrames(g); await ctx.yield(); add(g.build()); await ctx.yield();
  g = makeGB(); await naveBody(g, ctx); await ctx.yield(); await apse(g, ctx); await ctx.yield(); add(g.build()); await ctx.yield();
  g = makeGB(); southFront(g, bosses, pinn, seat[2]); await ctx.yield(); northFront(g, pinn); steeple(g); await ctx.yield();
  for (const [x, y, z, s] of pinn) { g.at(x, y, z); pinnacle(g, s); }
  g.at(); closeThings(g); await ctx.yield(); add(g.build()); await ctx.yield();

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3(), YAX = new THREE.Vector3(0, 1, 0), ZAX = new THREE.Vector3(0, 0, 1);
  const inst = (geo, n, cast) => { const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = cast; m.receiveShadow = true; inner.add(m); return m; };
  // flying buttresses: both flanks and the fourteen joints of the apse
  const places = [];
  for (const x of CH.navePiers.concat(CH.choirPiers)) places.push([x, 24, 0], [x, -24, Math.PI]);
  for (let i = 0; i < CH.apsePiers; i++) { const f = -Math.PI / 2 + Math.PI * i / 13; places.push([CH.apseX + Math.cos(f) * 24, Math.sin(f) * 24, Math.PI / 2 - f]); }
  const butt = inst(buttressGeometry(), places.length, true);
  places.forEach(([x, z, yaw], i) => { m4.compose(pv.set(x, 0, z), q.setFromAxisAngle(YAX, yaw), sv.set(1, 1, 1)); butt.setMatrixAt(i, m4); });
  butt.computeBoundingSphere(); await ctx.yield();
  // the kings in their niches, no two quite alike
  const king = inst(kingGeometry(), kings.length, false);
  kings.forEach(([x, y, z, s = 1], i) => { m4.compose(pv.set(x, y, z), q.setFromAxisAngle(YAX, -Math.PI / 2 + rk.range(-0.07, 0.07)), sv.set(rk.range(0.94, 1.06) * s, rk.range(0.93, 1.03) * s, s)); king.setMatrixAt(i, m4); });
  king.computeBoundingSphere();
  // the doors' bands of small worn forms
  const boss = inst(bossGeometry(), bosses.length, false), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3();
  bosses.forEach((b, i) => {
    by.set(b.t[0], b.t[1], b.t[2]).normalize(); bz.set(b.n[0], b.n[1], b.n[2]).normalize(); bx.crossVectors(by, bz);
    const s = rf.range(0.95, 1.35), sy = s * rf.range(0.9, 1.3);
    m4.makeBasis(bx.multiplyScalar(s), by.multiplyScalar(sy), bz.multiplyScalar(s)).setPosition(b.p[0], b.p[1], b.p[2]); boss.setMatrixAt(i, m4);
  });
  boss.computeBoundingSphere(); await ctx.yield();
  const louv = inst(louvreGeometry(), louvres.length, false);
  louvres.forEach(([x, y, z, yaw, len], i) => { m4.compose(pv.set(x, y, z), q.setFromAxisAngle(YAX, yaw), sv.set(len, 1, 1)); louv.setMatrixAt(i, m4); });
  louv.computeBoundingSphere();
  // the bells: every one swings at full swing from the first second, each on its own period, its start phase drawn
  const bell = inst(bellGeometry(), BELLS.length, false); bell.frustumCulled = false;
  const phase = BELLS.map(() => rb.range(0, Math.PI * 2));
  const swingAt = (i, time) => (i === 0 ? 0.82 : 0.95) * Math.sin(Math.PI * 2 * time / BELLS[i][4] + phase[i]);
  const swing = (time) => {
    for (let i = 0; i < BELLS.length; i++) {
      const b = BELLS[i]; m4.compose(pv.set(b[0], b[1], b[2]), q.setFromAxisAngle(ZAX, swingAt(i, time)), sv.set(b[3], b[3], b[3])); bell.setMatrixAt(i, m4);
    }
    bell.instanceMatrix.needsUpdate = true;
  };
  swing(0);
  const toObj = (p) => new THREE.Vector3(p[2], p[1], CH.length / 2 - p[0]);
  return {
    object, inner, shared, radius: 70, height: 79, center: new THREE.Vector3(0, 30, 0), ground: true, groundY: 0,
    anchors: { gapLine: [toObj([0, 57, 0]), toObj([14, 57, 0])], spireFoot: toObj([78, 47, 0]), southDoorSeat: toObj(seat), belfries: [toObj([7, 57, -13.5]), toObj([7, 57, 13.5])] },
    bells: BELLS, swingAt, triangles: () => { let t = 0; inner.traverse((o) => { if (o.isMesh) t += (o.geometry.index.count / 3) * (o.isInstancedMesh ? o.count : 1); }); return t; },
    update(dt, time) { swing(time); if (own) { shared.uEdge.value = edgeAt(time); shared.uTime.value = time; } },
    dispose() {},
  };
}
