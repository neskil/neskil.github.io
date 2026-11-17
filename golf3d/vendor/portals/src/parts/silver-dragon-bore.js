// THE SILVER DRAGON: hero set piece of "silver-dragon-bore" (Song-dynasty Hangzhou, the Qiantang tidal bore).
//
// One wall of water across the whole river: a glassy jade face 4 m high and 5 m deep with foam streaks running up
// it, a curling white lip (1 m more), a roll of white water tumbling in billows at its foot with lace running out
// from it over the dark river, a white edge along the crest with lace on jade behind it (close-meshed rafts that
// open into wider cells down the back), and five jade swells behind. It runs upstream along a curved fish-scale stone seawall crowded with parasols, banners and pavilions.
// Where the bore meets the wall it rears into a travelling plume 18 m tall: ropes of water thrown up, a sharp
// leading sheet, falling curtains, and soft spray only as a thin veil (the parasols duck as it passes).
// Seen from near or along the wall the plume is thrown water, not a bank: its soft spray and broad leading sheets are for the far
// view and thin away within a hundred metres (and once its head has passed the eye), leaving ropes with hard bright cores, falling
// strands that each wander and break, and drops, with the seawall and the sky between them. The crest's feather is not drawn where
// its window falls behind the seawall.
// The lip is torn (it stands higher and lower along the front, boreExtra), pitches forward over the face (the top rows
// of the crest are thrown ahead in the vertex shader, except round an eye that rides the face) and is feathered: a second
// draw of the spray material keeps spindrift (in gusts), ragged crowns of torn water and thrown drops along 240 m of the
// crest round the eye. By day these scatter the sun forward and glow against the sky.
// The lip itself is a thin sheet that droops at its edge, with its underside drawn down and lit through (the light of the
// moon or the sun in the jade); hero.uniforms.uReach (0..1, set by the world) throws it its furthest in front of an eye
// that waits for the wall. Against the seawall the wave is white water: heaped, chopped, with a ragged apron running on
// ahead along the foot of the stone and jade in the troughs, not a smooth wedge (the vertex heaps are not in heightAt:
// they lie within a few metres of the wall, where nothing floats).
// The foam fingers on the face never repeat (their lookups slide on a slow warp along the front), the river is drawn down
// in a dark trough just ahead of the toe, and for an eye still ahead of the toe the wall's own image (dark glass, a broken
// white line under the lip) lies on the calm water in front of it. Under a low sun (golden, dawn: uLow) the face is dark
// glass that glows only under the lip. Water runs down the wet masonry in thin runnels after the surge.
// By day (uDim 0) the foam on the face is given form (shaded under the lip, billows, streaks that end mid-face), the lip's
// spindrift is a veil in the wave's own shade that takes the light as it rises, and within a few boat lengths of the eye the
// foam opens into streaks with jade between them. As the bore piles into the gate the masonry is drenched to a ragged tide line.
// The face has a body in every light: dark glass at its foot, milky jade where the wave thins toward the lip, a broken band
// of moon or sun in its hollow, a white roll at the lip with fingers of unequal length under it (the noise is given the same
// statistics for every seed, so no seed's face is a white sheet), and fine bands in the glass beside the boat. Close to the
// eye the mirror of the light and the glitter are sparks, never a sheet of glare.
// A stair zig-zags up the river face of the bluff from a tide landing to the gate deck, another from the deck to
// the pagoda terrace; the cliff is bedded rock with wet dark stone below the tide line and plants on its benches.
// The wall ends at a headland: a 40 m bluff of gold ginkgo with the city's water gate (a 14.6 m arch in a
// crenellated masonry bastion with a gate hall) at its foot and an octagonal thirteen-eaved pagoda, 60 m, on top.
//
// LOCAL SPACE  origin = centre of the water gate's threshold at calm river level (y = 0). +Y up. The gate
//   faces +Z (downriver). The bore travels toward -Z. The seawall leaves the gate at x = -22 and arcs away
//   downriver for 1.5 km, drifting to +X (wallX(z)); the city is on its -X side, the river on its +X side.
//   The headland runs from x = -24 to about x = 190 behind z = 0; the river carries on upstream east of it.
// SIZE   radius 140 / height 60 / center (22, 40, 30) are VIEWING hints for the set-piece viewer (bluff, gate,
//   pagoda, the nearest wall and the bore). True extents: pagoda tip y = 101; seawall z = 0..1385 (x to +510);
//   the river sheet reaches 6 km across and from z = -1800 to 4200 (it is the world's river: add no other
//   water in that rectangle; a far sea under y = -0.5 is fine).
// COST   about 185k triangles (190k at the densest crowd), 13 draw calls (12 with land:false), no lights, 1 texture
//        (256 px noise), build about 350 ms in slices under 30 ms. Everything animates in shaders; update() only
//        sets uniforms. One of the draws, 'lip-throw', is about 23k triangles at full detail: veils and crowns of
//        water torn off the lip, each at its own metres along the front from the stream 'lip-throw:' + seed.
//
// opts
//   palette  [jadeDeep, jadeLight, foam, silt, stone, ginkgoGold, vermilion, roofTile, haze] hex strings (missing
//            entries fall back to the defaults)
//   look     'jade' | 'silt' | 'festival'   (default: chosen by ctx.rng). jade: clear celadon water, mixed
//            parasols; silt: the turbid golden tide, cream foam, amber trees; festival: red silk everywhere,
//            more banners, teal water.
//   hour     'day' | 'golden' | 'night' | 'dawn' (default from ctx.vary.hour, else 'day'): lantern glow in
//            pagoda, gate hall and pavilions (0 by day, 0.6 golden/dawn, 1 night). hero.setLamp(v) overrides.
//   season   0..1 how far the ginkgo has turned (default by rng 0.75..1; 0 = green-gold, 1 = full gold, more
//            leaves in the air).
//   wet      0..1 standing wetness of stone (default 0.25).
//   sprayNear [a, b]: spray sprites nearer the eye than b metres thin out (soft spray to 7% at a, ropes of water
//            to 40%), so a plume beside the camera is a veil and not a fog bank (default: off).
//   rare     true (default ctx.vary.rare): the "crossing tide": a second, oblique ridge 3 m high (a clean jade front,
//            a white crest, a back of lace) runs ahead of the bore on the river side and crosses it in a V, with a burst
//            of spray where the two meet, and the plume is half as tall again. It sweeps past faster than the bore: a
//            world that floats its camera on heightAt must sample finely for it.
//   crossAt  the bore z at which that ridge reaches the seawall (default 400); it sweeps in from the river before.
//   density  crowd multiplier (default ctx.vary.density or 1).
//   boreZ    where the bore front stands until the world drives it (default 150).
//   boreFrom, boreTo   the z range setProgress(u) sweeps (defaults 1500 and -14).
//   land     true: a plain preview bank with a band of grey roofs behind the dyke. Pass false when the world's
//            own terrain and city cover x < wallX(z) - 44 (the dyke, promenade and its back slope stay).
//   light    { sunDir, sunColor, sunIntensity, sky, ground, zenith, horizon }: see LIGHTING.
//
// anchors (local space)
//   portalSeat   { position (0, 7.3, -3), facing (0,0,1), shape 'arch', width 14, height 14.6, radius 7 }: the
//                portal fills the gate arch; the tunnel behind it is dark for 34 m. Water rises to about y = 4
//                in the arch as the bore arrives, so foam pours through the lower third of the portal.
//   flyThrough   ordered points: mid-river opening -> onto the face -> 20 m off the seawall -> 70 m straight
//                into the gate. y is the eye height over the LIFTED water (ride at heightAt + 2.5). Nothing
//                solid within 6.5 m (wall foot 16 m to the left, arch jambs 7.3 m either side at the end).
//   opening      { position, lookAt }: low and still, facing downriver at the white thread.
//   pagodaBase, pagodaTip, gateCrown, bluffTop, wallEnd
//   viewpoints   a few good outside views { position, lookAt }
//   wall         { xAt(z), pointAt(z, off, y), zEnd, top: 9.1 } the seawall line (off > 0 is toward the river)
//   bore         { speed: 11, height: 4, swells: 5, wavelength: 42, lead }
//
// HOOKS
//   hero.setProgress(u)   bore front z = lerp(boreFrom, boreTo, u). Call every frame with the path progress.
//   hero.setBore(z)       the raw control: z of the far-field front. Near the wall the front leads by up to
//                         `lead` m (hero.frontZ(x, z) gives the local front; the camera surfs about 6 m ahead
//                         of it). The plume stands where the front meets the wall: hero.plumeAt(out).
//   hero.heightAt(x, z, time)   river surface height (bore, swells, wall run-up, backwash; no ripples): float
//                         the sampan, junks and the camera on it. hero.wallX(z) is the wall line.
//   hero.setLight({...})  relight the custom-shaded parts (water, spray, parasols, banners, ginkgo, leaves).
//   hero.setLamp(v), hero.uniforms
//   hero.uniforms.uBurst (Vector4: a hull's centre x, z and half its length along its heading as x, z) with uBurstK = 1:
//                         white water bursts along that hull while the lip goes under it (off by default).
//   BORE_GLSL (named export)   the GLSL of the surface (uniform declarations, boreProf, boreExtra, boreH(s, d),
//                         frontZ) for a world shader that floats its own things on the bore; give that material
//                         hero.uniforms' uTime, uBoreZ, uLead, uPlume, uSeed, uRare and uCrossD.
//
// LIGHTING  Stone, timber, tile and rock are MeshStandardMaterial (vertex colour + procedural detail): light
//   them with the world's sun and hemisphere (sun about 3, hemisphere about 1). Water, spray, crowd, cloth and
//   trees are custom shaders that write linear HDR, honour scene fog and are lit by `light` (defaults match a
//   clear afternoon with the sun high in the south-west: sunDir (-0.6, 0.7, 0.4), so the gate is side-lit).
//   Pass the same sun to both. Wants a little bloom: sun glitter on the water reaches about 5, lanterns 3-4.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEG = Math.PI / 180;
const XG = -22, PSI0 = 6 * DEG, RW = 2865, SIN0 = Math.sin(PSI0), COS0 = Math.cos(PSI0), TAN0 = Math.tan(PSI0);
const ZE = RW * (Math.sin(36 * DEG) - SIN0), TE = Math.tan(36 * DEG);
const WALL_TOP = 9.1, LEAD = 46, LDEC = 26, LF = 5, HB = 4, LIP = 1, LAM = 42, ZMIN = -1800, ZMAX = 4200;
const HULL_CAP = 520;      // how many sprites of white water the hulls of a world can be given (hero.setHulls)
const SP = 26, AHEAD = 19;      // the bore strikes the seawall at a point every SP metres; the tongue that runs ahead of it along the foot of the stone is AHEAD metres long
const RK = 0.7, RH = 3.0, RF = 5, TR = 0.42;      // the rare crossing ridge: how obliquely it runs, its height, how steep its front is (e-fold, m2); the drawdown ahead of the toe
const PAG = { x: 34, y: 40, z: -86 }, BLUFF = { x: 48, z: -104, a: 142, b: 100 };
const GL = (v) => (Number.isInteger(v) ? v + '.' : String(v));

function wallX(z) {
  const zc = clamp(z, 0, ZE), sn = SIN0 + zc / RW;
  let x = XG + RW * (COS0 - Math.sqrt(Math.max(1 - sn * sn, 1e-4)));
  const o = Math.max(z - ZE, 0); x += Math.max(TE * o - o * o / 900, -1400);
  return x + Math.min(z, 0) * TAN0;
}
// a point `off` metres toward the river from the wall line at z (wall normal), at height y
function wallPoint(z, off, y, out = new THREE.Vector3()) {
  const zc = clamp(z, 0, ZE), sn = SIN0 + zc / RW, cs = Math.sqrt(Math.max(1 - sn * sn, 1e-4));
  return out.set(wallX(zc) + cs * off, y, zc - sn * off);
}

const WATER_COMMON = /* glsl */`
uniform float uTime, uBoreZ, uLead, uPlume, uSeed, uRare, uCrossD;
float wallX(float z){
  float zc = clamp(z, 0., ${GL(ZE)}), sn = ${GL(SIN0)} + zc / ${GL(RW)};
  float x = ${GL(XG)} + ${GL(RW)} * (${GL(COS0)} - sqrt(max(1. - sn * sn, 1e-4)));
  float o = max(z - ${GL(ZE)}, 0.); x += max(${GL(TE)} * o - o * o / 900., -1400.);
  return x + min(z, 0.) * ${GL(TAN0)};
}
float wallDx(float z){
  float zc = clamp(z, 0., ${GL(ZE)}), sn = ${GL(SIN0)} + zc / ${GL(RW)};
  float o = z - ${GL(ZE)};
  if (o > 0.) return (o < 1700.) ? ${GL(TE)} - o / 450. : 0.;
  return sn / sqrt(max(1. - sn * sn, 1e-4));
}
float zFront(float d){
  return uBoreZ - uLead * exp(-max(d, 0.) / ${GL(LDEC)}) + 4.5 * sin(d * 0.0021 + uSeed) + 2. * sin(d * 0.0113 + 2.1 * uSeed);
}
float dzFront(float d){
  return (d > 0. ? uLead / ${GL(LDEC)} * exp(-d / ${GL(LDEC)}) : 0.) + 0.00945 * cos(d * 0.0021 + uSeed) + 0.0226 * cos(d * 0.0113 + 2.1 * uSeed);
}
// river height: s metres behind the front crest (negative = ahead), d metres from the wall line.
// boreProf is the bore's own section (face, lip, swells) and boreDs its slope, exact, so a fragment can shade the
// face and the lip without the mesh showing; boreExtra is everything that also depends on the wall or the rare tide.
float boreProf(float s){
  float t = clamp(1. + s / ${GL(LF)}, 0., 1.), sb = max(s, 0.);
  float env = exp(-sb / 150.) * (1. - smoothstep(${GL(5.2 * LAM)}, ${GL(6.0 * LAM)}, sb));
  float h = s < 0. ? ${GL(HB)} * t * t * (1.6 - 0.6 * t) : 2.4 + 0.4 * (1. - exp(-sb / 400.)) + 1.6 * env * cos(sb * ${GL(2 * Math.PI / LAM)});
  float tr = s + ${GL(LF + 2.6)}; h -= ${GL(TR)} * exp(-tr * tr / 7.);                                           // the river is drawn down just ahead of the toe
  return h + ${GL(LIP)} * exp(-s * s / (s < 0. ? 2.2 : 6.5));                                                    // the lip overshoots the crest
}
float boreDs(float s){
  float t = clamp(1. + s / ${GL(LF)}, 0., 1.), sb = max(s, 0.), k = ${GL(2 * Math.PI / LAM)};
  float env = exp(-sb / 150.) * (1. - smoothstep(${GL(5.2 * LAM)}, ${GL(6.0 * LAM)}, sb));
  float f = s < 0. ? ${GL(HB / LF)} * t * (3.2 - 1.8 * t) * step(${GL(-LF)}, s) : 0.001 * exp(-sb / 400.) - 1.6 * env * (k * sin(sb * k) + cos(sb * k) / 150.);
  float tr = s + ${GL(LF + 2.6)}; f += ${GL(TR)} * exp(-tr * tr / 7.) * 2. * tr / 7.;
  return f - ${GL(LIP)} * exp(-s * s / (s < 0. ? 2.2 : 6.5)) * 2. * s / (s < 0. ? 2.2 : 6.5);
}
float crossS(float d){ return ${GL(RK)} * (d - uCrossD) + 1.5 * sin(d * 0.09 + uSeed) + 0.8 * sin(d * 0.23); }      // the rare ridge: how far its crest lies ahead of the bore's, d metres off the wall (it is not a ruler line)
float boreExtra(float s, float d){
  float sb = max(s, 0.), dw = max(d - 2.5, 0.);
  float h = uPlume * 5.5 * exp(-dw / 6.) * exp(-(s - 4.) * (s - 4.) / 260.) * smoothstep(-12., -2., s);          // run-up under the plume
  h += uPlume * 0.75 * exp(-dw / 70.) * sin(dw * 0.21 - uTime * 1.9) * smoothstep(8., 40., s) * exp(-sb / 420.);   // backwash off the wall
  // the rare crossing tide: a second, oblique ridge that meets the bore uCrossD metres off the wall
  // (a steep jade front 3 m high and a long back; it reaches far out on the river side, where it runs ahead of the bore)
  float s2 = s + crossS(d), win = (d - uCrossD) / (d > uCrossD ? 130. : 45.);
  h += uRare * ${GL(RH)} * smoothstep(-25., 5., uCrossD) * exp(-win * win) * exp(-s2 * s2 / (s2 < 0. ? ${GL(RF)} : 90.));
  // the lip is torn: it stands higher here and lower there along the front, and the lumps travel along it
  float lw = 0.48 * sin(d * 0.21 + uTime * 0.9 + uSeed) + 0.34 * sin(d * 0.345 - uTime * 0.63 + 2.1 * uSeed) + 0.14 * sin(d * 0.52 + uTime * 1.31 + 4.2);
  h += lw * exp(-s * s / (s < 0. ? 3. : 9.)) * smoothstep(8., 30., d);
  return h;
}
float boreH(float s, float d){ return boreProf(s) + boreExtra(s, d); }
`;

// the bore's shape in GLSL (wallX, zFront, boreH and their uniforms: hero.uniforms), for a world's own floating things
export const BORE_GLSL = WATER_COMMON;
// Where a tide-rider rides close under the seawall the lip does not break over him: he keeps to the pocket of the wave that has
// not yet come down (uRid: two riders, each as (metres off the wall, how much of a pocket he is given); the world sets it).
const RID_GLSL = /* glsl */`
uniform vec4 uRid;
float ridGap(float d){
  return 1. - max(uRid.y * (1. - smoothstep(2.5, 7., abs(d - uRid.x))), uRid.w * (1. - smoothstep(2.5, 7., abs(d - uRid.z))));
}`;

// THE BROKEN WATER OF THE FRONT. The three functions here (footLobe, footH, crestRag) are functions of the front's own
// geometry (s metres behind the crest, x metres along the front) and of the water's own clock, and of nothing else: the
// river's mesh is shaped by them and the fragment reads them again. What the fragment then cuts from them is by the same
// metres and the same clock: the lace at the foot and the net on the back of the wave from the two nets of NET_GLSL, the
// pile's billows from its own tumbling fields (only their crowns and creases from the foot's net). Three more things are
// read there, each named where it stands: the footprint on the water of the pixel that draws a net (netW), which decides
// only how fine a cell is still drawn as a cell; the riders' stations (thin threads and no pile in a rider's pocket); and,
// behind the crest, the distance to the eye, by which the foam the net is cut from is drawn with finer fields, a sharper
// edge and holes near the eye (nearB, nearC, nearP).
//   the foot   where the face comes down to the calm river the wave pushes a tumbling roll of white water ahead of its
//              toe: footLobe(x) says how far it runs out here (lobes a boat length wide, here and there a long tongue;
//              they swell and are drawn back) and how high it is piled, footH its section. The river mesh is heaped by
//              it and the fragment cuts its ragged edge, the dark wet line ahead of it and the lace that slides out.
//              Only the pile is whole white, and it stands in billows. Out from it the white water is a net (foamNet in
//              NET_GLSL): white veins round holes of dark water, then threads, then flecks, each pixel foam or water, so
//              the moon's glitter and the lamps' glints stand in the holes. A net of the same kind, knotted, bent and
//              opening into wider cells with metres down the back (foamCell), cuts all the foam behind the crest, the
//              whole front long.
//   the crest  crestRag(x): the crest line stands in teeth and notches a stride to a boat length wide (the mesh is
//              raised by it for 2 m either side of the crest), so the crest is never a ruled edge.
const FOOT_GLSL = /* glsl */`
vec2 footLobe(float x){
  // (both fields are read at a coarse level of the texture, the same in the vertex and in the fragment: nothing in them is
  // narrower than two columns of the river's mesh, which stand 1.5 to 2 m apart within 200 m of the seawall)
  float a = textureLod(uNoise, vec2(x * 0.0125 + 0.17, 0.62 + uTime * 0.017), 3.).r;
  float b = textureLod(uNoise, vec2(x * 0.041 + 0.43, 0.21 - uTime * 0.043), 4.4).a;
  float c = textureLod(uNoise, vec2(x * 0.027 + 0.83, 0.39 + uTime * 0.03), 3.8).r;
  float lobe = smoothstep(0.3, 0.7, a), tongue = clamp((b - 0.48) * 4., 0., 1.);
  float e = textureLod(uNoise, vec2(x * 0.055 + 0.37, 0.91 - uTime * 0.045), 4.8).a;
  return vec2(0.7 + 2.9 * lobe + 3.6 * tongue * tongue, max(0.06 + 0.5 * smoothstep(0.34, 0.68, c) + 0.7 * (e - 0.5), 0.03));      // (heaped knee high here, a flat sheet there)
}
float footH(float s, vec2 lb){
  float c = s + ${GL(LF)}, f0 = -clamp(lb.x - 1.2, 0.8, 2.8);      // (the heap begins well behind the white water's leading edge: no bare water is ever heaped)
  float body = smoothstep(f0, f0 + 1.7, c) * (1. - smoothstep(-0.6, 1., c));      // (a low wedge with a long front slope, never a kerb at the foot of the wave)
  float sheet = smoothstep(-lb.x, -lb.x + 2.2, c) * (1. - smoothstep(-1.5, 0.1, c));
  return lb.y * body + 0.15 * sheet;
}
float crestRag(float x){
  float a = textureLod(uNoise, vec2(x * 0.033 + 0.71, 0.13 + uTime * 0.05), 4.2).a - 0.5;
  float b = textureLod(uNoise, vec2(x * 0.05 + 0.29, 0.77 - uTime * 0.11), 4.6).r - 0.5;
  return 2.4 * a + 1.8 * b;
}`;

// THE LACE. Where white water lies flat on the river it is a net: white veins round holes of dark water, the holes a hand
// to a stride across. Both nets are cut from the cells of scattered points (p in cells; the points breathe on the water's
// clock) and are worked out, not looked up, so an edge is an edge at any distance and at any angle (a lookup of the noise
// texture seen along the water falls to a coarse level and is a soft smear).
//   foamNet(p)   the foot's net: 0 on the line between two cells, rising toward a cell's middle, so "under w" is a vein
//                of even width.
//   foamCell(p)  the net behind the crest: the same, but it rises less steeply where three cells meet, so a vein swells
//                at its knots and leaves the holes round. netWarp(p) bends this net's own coordinates (p in metres: two
//                sizes of slow swirl that drift on the water's clock), so a vein wanders and no hole has a straight side.
// netW cuts either net: a pixel is foam or water, and where a cell is smaller than the pixel that sees it (px: the pixel's
// footprint on the water, in cells) the net's mean cover is drawn, as a texture's own levels do, so nothing shimmers and
// nothing pops.
const NET_GLSL = /* glsl */`
float foamNet(vec2 p){
  vec2 ip = floor(p), fp = p - ip; float f1 = 9., f2 = 9.;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), c = ip + g;
      vec3 q = fract(vec3(c.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33);
      vec2 o = 0.5 + 0.4 * sin(uTime * 0.9 + 6.2832 * fract((q.xx + q.yz) * q.zy));
      vec2 r = g + o - fp; float dd = dot(r, r);
      if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) { f2 = dd; }
    }
  }
  return sqrt(f2) - sqrt(f1);
}
float foamCell(vec2 p){
  vec2 ip = floor(p), fp = p - ip; float f1 = 9., f2 = 9., f3 = 9.;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), c = ip + g;
      vec3 q = fract(vec3(c.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33);
      vec2 o = 0.5 + 0.4 * sin(uTime * 0.9 + 6.2832 * fract((q.xx + q.yz) * q.zy));
      vec2 r = g + o - fp; float dd = dot(r, r);
      if (dd < f1) { f3 = f2; f2 = f1; f1 = dd; } else if (dd < f2) { f3 = f2; f2 = dd; } else if (dd < f3) { f3 = dd; }
    }
  }
  float d1 = sqrt(f1), d2 = sqrt(f2), d3 = sqrt(f3);
  // (the share of the water under a width w is the same with the knots as without: 1.25 makes up for what they add)
  return 1.25 * (d2 - d1) * mix(0.5, 1., smoothstep(0.04, 0.5, d3 - d1));
}
vec2 netWarp(vec2 p){
  vec2 a = vec2(sin(p.y * 3.1 + 1.7 * sin(p.x * 1.9 + uTime * 0.31)), sin(p.x * 3.7 + 1.7 * sin(p.y * 2.3 - uTime * 0.23) + 2.));
  vec2 b = vec2(sin(p.y * 9.7 + 1.3 * a.y + p.x * 2.9), sin(p.x * 11.3 + 1.3 * a.x - p.y * 3.3));
  return 0.1 * a + 0.04 * b;
}
float netW(float F, float w, float aa, float px){
  return mix(1. - smoothstep(w - aa, w + aa, F), 1. - exp(-2.8 * max(w, 0.)), smoothstep(0.4, 1.1, px));
}`;

// tileable fbm in a small RGBA texture: R height, GB its slope (0.5 = flat), A an independent field for foam lace
async function makeNoiseTexture(rng, ctx) {
  const N = 256, lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = rng(); return a; };
  const field = async () => {
    const f = new Float32Array(N * N); let amp = 0.5, tot = 0;
    for (let o = 0; o < 5; o++) {
      const n = 4 << o, L = lat(n), k = n / N; tot += amp;
      for (let y = 0; y < N; y++) {
        const fy = y * k, y0 = Math.floor(fy), ty = fy - y0, wy = ty * ty * (3 - 2 * ty), r0 = (y0 % n) * n, r1 = ((y0 + 1) % n) * n;
        for (let x = 0; x < N; x++) {
          const fx = x * k, x0 = Math.floor(fx), tx = fx - x0, wx = tx * tx * (3 - 2 * tx), c0 = x0 % n, c1 = (x0 + 1) % n;
          const a = L[r0 + c0] + (L[r0 + c1] - L[r0 + c0]) * wx, b = L[r1 + c0] + (L[r1 + c1] - L[r1 + c0]) * wx;
          f[y * N + x] += amp * (a + (b - a) * wy);
        }
        if ((y & 7) === 7) await ctx.yield();
      }
      amp *= 0.5; await ctx.yield();
    }
    // (each of these passes over the field is cut into slices of 4096 texels: cold, one whole pass has read 20 ms and more)
    let lo = 1e9, hi = -1e9; for (let i = 0; i < f.length; i++) { const v = f[i]; if (v < lo) lo = v; if (v > hi) hi = v; if ((i & 2047) === 2047) await ctx.yield(); }
    for (let i = 0; i < f.length; i++) { f[i] = (f[i] - lo) / (hi - lo); if ((i & 2047) === 2047) await ctx.yield(); }
    await ctx.yield();
    // every seed is given the same statistics (mean 0.5, deviation 0.18): the stretch above leaves the mean anywhere from 0.42
    // to 0.58, and the foam thresholds then turn one seed's face to clean glass and another's to a white sheet
    let m = 0, q = 0; for (let i = 0; i < f.length; i++) { m += f[i]; if ((i & 2047) === 2047) await ctx.yield(); } m /= f.length;
    for (let i = 0; i < f.length; i++) { q += (f[i] - m) * (f[i] - m); if ((i & 2047) === 2047) await ctx.yield(); }
    const g = 0.18 / Math.max(Math.sqrt(q / f.length), 0.05);
    for (let i = 0; i < f.length; i++) { const v = 0.5 + (f[i] - m) * g; f[i] = v < 0 ? 0 : v > 1 ? 1 : v; if ((i & 2047) === 2047) await ctx.yield(); }
    await ctx.yield();
    return f;
  };
  const A = await field(); await ctx.yield();
  const Bf = await field(); await ctx.yield();
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = y * N + x, xr = y * N + ((x + 1) % N), xl = y * N + ((x + N - 1) % N), yu = ((y + 1) % N) * N + x, yd = ((y + N - 1) % N) * N + x;
      data[i * 4] = A[i] * 255;
      data[i * 4 + 1] = clamp(0.5 + (A[xr] - A[xl]) * 3.2, 0, 1) * 255;
      data[i * 4 + 2] = clamp(0.5 + (A[yu] - A[yd]) * 3.2, 0, 1) * 255;
      data[i * 4 + 3] = Bf[i] * 255;
    }
    if ((y & 3) === 3) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// The same normals and the same bounding sphere as BufferGeometry.computeVertexNormals() and computeBoundingSphere() give
// (the same arithmetic on the same numbers in the same order), worked out in slices with a yield between them: on a big
// merged geometry each of the two calls is one step of 15 to 30 ms.
async function normalsSteps(g, ctx) {
  const pos = g.attributes.position, idx = g.index, nor = new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), pC = new THREE.Vector3(), nA = new THREE.Vector3(), nB = new THREE.Vector3(), nC = new THREE.Vector3(), cb = new THREE.Vector3(), ab = new THREE.Vector3();
  g.setAttribute('normal', nor);
  if (idx) {
    for (let i = 0, n = idx.count; i < n; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      pA.fromBufferAttribute(pos, a); pB.fromBufferAttribute(pos, b); pC.fromBufferAttribute(pos, c);
      cb.subVectors(pC, pB); ab.subVectors(pA, pB); cb.cross(ab);
      nA.fromBufferAttribute(nor, a); nB.fromBufferAttribute(nor, b); nC.fromBufferAttribute(nor, c);
      nA.add(cb); nB.add(cb); nC.add(cb);
      nor.setXYZ(a, nA.x, nA.y, nA.z); nor.setXYZ(b, nB.x, nB.y, nB.z); nor.setXYZ(c, nC.x, nC.y, nC.z);
      if (i % 900 === 897) await ctx.yield();
    }
  } else {
    for (let i = 0, n = pos.count; i < n; i += 3) {
      pA.fromBufferAttribute(pos, i); pB.fromBufferAttribute(pos, i + 1); pC.fromBufferAttribute(pos, i + 2);
      cb.subVectors(pC, pB); ab.subVectors(pA, pB); cb.cross(ab);
      nor.setXYZ(i, cb.x, cb.y, cb.z); nor.setXYZ(i + 1, cb.x, cb.y, cb.z); nor.setXYZ(i + 2, cb.x, cb.y, cb.z);
      if (i % 1800 === 1797) await ctx.yield();
    }
  }
  await ctx.yield();
  for (let i = 0, n = nor.count; i < n; i++) { pA.fromBufferAttribute(nor, i); pA.normalize(); nor.setXYZ(i, pA.x, pA.y, pA.z); if (i % 2000 === 1999) await ctx.yield(); }
  nor.needsUpdate = true;
}
async function sphereSteps(g, ctx) {
  const pos = g.attributes.position, n = pos.count, box = new THREE.Box3(), v = new THREE.Vector3(), sph = new THREE.Sphere();
  for (let i = 0; i < n; i++) { box.expandByPoint(v.fromBufferAttribute(pos, i)); if (i % 4000 === 3999) await ctx.yield(); }
  box.getCenter(sph.center);
  let r2 = 0;
  for (let i = 0; i < n; i++) { v.fromBufferAttribute(pos, i); r2 = Math.max(r2, sph.center.distanceToSquared(v)); if (i % 4000 === 3999) await ctx.yield(); }
  sph.radius = Math.sqrt(r2); g.boundingSphere = sph;
}

// triangle soup builder for architecture: position, colour, uv (metres) and a surface kind per vertex
//   kinds: 0 plain  1 roof tile  2 ashlar  3 fish-scale wall  4 timber  5 paving  6 rock  7 earth/grass  8 lamp-lit opening
function makeBuilder() {
  const P = [], C = [], U = [], K = [];
  let cr = 1, cg = 1, cb = 1, kind = 0;
  const b = {
    col(c, j = 0, rng) { const k = rng ? 1 + (rng() - 0.5) * 2 * j : 1; cr = c.r * k; cg = c.g * k; cb = c.b * k; return b; },
    kind(k) { kind = k; return b; },
    v(x, y, z, u, w) { P.push(x, y, z); C.push(cr, cg, cb); U.push(u, w); K.push(kind); },
    tri(a, c, d, ua = 0, va = 0, uc = 1, vc = 0, ud = 0, vd = 1) { b.v(a[0], a[1], a[2], ua, va); b.v(c[0], c[1], c[2], uc, vc); b.v(d[0], d[1], d[2], ud, vd); },
    // a, c, d, e in order round the quad; uv (u0,v0) at a, (u1,v0) at c, (u1,v1) at d, (u0,v1) at e
    quad(a, c, d, e, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
      b.v(a[0], a[1], a[2], u0, v0); b.v(c[0], c[1], c[2], u1, v0); b.v(d[0], d[1], d[2], u1, v1);
      b.v(a[0], a[1], a[2], u0, v0); b.v(d[0], d[1], d[2], u1, v1); b.v(e[0], e[1], e[2], u0, v1);
    },
    // box centred at (cx, cz), from y0 to y1, half sizes hx, hz at the base, scaled by `taper` at the top, turned by ry
    box(cx, y0, cz, hx, y1, hz, ry = 0, taper = 1, top = true) {
      const c = Math.cos(ry), s = Math.sin(ry), q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      const pt = (i, t, y) => { const x = q[i][0] * hx * t, z = q[i][1] * hz * t; return [cx + x * c + z * s, y, cz - x * s + z * c]; };
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4, w = (i % 2 ? hz : hx) * 2;
        b.quad(pt(i, 1, y0), pt(j, 1, y0), pt(j, taper, y1), pt(i, taper, y1), 0, y0, w, y1);
      }
      if (top) b.quad(pt(0, taper, y1), pt(1, taper, y1), pt(2, taper, y1), pt(3, taper, y1), 0, 0, hx * 2, hz * 2);
    },
    get count() { return P.length / 9; },
    toGeometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1));
      g.computeVertexNormals(); g.computeBoundingSphere();
      return g;
    },
    // the same geometry as toGeometry(), made in steps with a yield between them
    async toGeometrySteps(ctx) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); await ctx.yield();
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); await ctx.yield();
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1)); await ctx.yield();
      await normalsSteps(g, ctx); await ctx.yield();
      await sphereSteps(g, ctx);
      return g;
    },
  };
  return b;
}

// ---------- roofs and buildings ----------
// A swept Chinese eave round a polygon. Corner k at extent e is C[k] + D[k] * e (octagon: C = centre, D radial;
// rectangle: C = the ends of the ridge, D = diagonals), so the same code makes pagoda eaves, pavilion and hip roofs.
function eaveRing(b, o) {
  const { C, D, eIn, eOut, yIn, drop, lift = 0.8, segs = 6, rad = 3, thick = 0.26, tile, edge, soffit, soffitE, soffitY, ridge } = o;
  const n = C.length, cx = o.cx || 0, cz = o.cz || 0;
  const pt = (k, w, t, dy = 0) => {
    const k1 = (k + 1) % n, e = eIn + (eOut - eIn) * t, c = Math.abs(2 * w - 1);
    const x0 = C[k][0] + D[k][0] * e, z0 = C[k][1] + D[k][1] * e, x1 = C[k1][0] + D[k1][0] * e, z1 = C[k1][1] + D[k1][1] * e;
    const sw = 1 + 0.06 * c * c * c * t * t;   // corners sweep out a little as they rise
    return [cx + (x0 + (x1 - x0) * w) * sw, yIn - drop * (1 - (1 - t) * (1 - t)) + lift * c * c * c * t * t + dy, cz + (z0 + (z1 - z0) * w) * sw];
  };
  for (let k = 0; k < n; k++) {
    const k1 = (k + 1) % n, len = Math.hypot(C[k1][0] + D[k1][0] * eOut - C[k][0] - D[k][0] * eOut, C[k1][1] + D[k1][1] * eOut - C[k][1] - D[k][1] * eOut);
    for (let j = 0; j < segs; j++) {
      const w0 = j / segs, w1 = (j + 1) / segs;
      b.kind(1).col(tile);
      for (let r = 0; r < rad; r++) {
        const t0 = r / rad, t1 = (r + 1) / rad;
        b.quad(pt(k, w0, t0), pt(k, w1, t0), pt(k, w1, t1), pt(k, w0, t1), w0 * len, t0 * (eOut - eIn), w1 * len, t1 * (eOut - eIn));
      }
      b.kind(0).col(edge);
      b.quad(pt(k, w0, 1), pt(k, w1, 1), pt(k, w1, 1, -thick), pt(k, w0, 1, -thick), w0 * len, 0, w1 * len, thick);
      if (soffit) {
        const s0 = [cx + C[k][0] + D[k][0] * soffitE, soffitY, cz + C[k][1] + D[k][1] * soffitE], s1 = [cx + C[k1][0] + D[k1][0] * soffitE, soffitY, cz + C[k1][1] + D[k1][1] * soffitE];
        const a = [lerp(s0[0], s1[0], w0), soffitY, lerp(s0[2], s1[2], w0)], c = [lerp(s0[0], s1[0], w1), soffitY, lerp(s0[2], s1[2], w1)];
        b.kind(4).col(soffit);
        b.quad(pt(k, w0, 1, -thick), pt(k, w1, 1, -thick), c, a, w0 * len * 3, 0, w1 * len * 3, 1);
      }
    }
    // hip ridge along the corner
    if (ridge) {
      b.kind(0).col(ridge);
      const k0 = (k + n - 1) % n;
      for (let r = 0; r < rad; r++) {
        const t0 = r / rad, t1 = (r + 1) / rad, g = 0.5 / segs;
        const a0 = pt(k0, 1 - g * 0.5, t0), a1 = pt(k0, 1 - g * 0.5, t1), c0 = pt(k, g * 0.5, t0), c1 = pt(k, g * 0.5, t1), m0 = pt(k, 0, t0, 0.32), m1 = pt(k, 0, t1, 0.32 + (r === rad - 1 ? 0.25 : 0));
        b.quad(a0, m0, m1, a1, 0, 0, 1, 1); b.quad(m0, c0, c1, m1, 0, 0, 1, 1);
      }
    }
  }
}
const ngon = (n, rot = 0) => { const C = [], D = []; for (let k = 0; k < n; k++) { const a = rot + (k / n) * Math.PI * 2; C.push([0, 0]); D.push([Math.cos(a), Math.sin(a)]); } return { C, D }; };
const hipRect = (L, ry = 0) => {   // ridge half-length L along local x, turned by ry
  const c = Math.cos(ry), s = Math.sin(ry), q = [[1, 1], [-1, 1], [-1, -1], [1, -1]], R2 = (x, z) => [x * c + z * s, -x * s + z * c];
  return { C: q.map(([x]) => R2(x * L, 0)), D: q.map(([x, z]) => R2(x, z)) };
};
function lathe(b, cx, cz, prof, n = 10, rot = 0) {
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    for (let k = 0; k < n; k++) {
      const a0 = rot + (k / n) * Math.PI * 2, a1 = rot + ((k + 1) / n) * Math.PI * 2;
      const p = (r, y, a) => [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r];
      if (r0 < 1e-3) b.tri(p(r0, y0, a0), p(r1, y1, a1), p(r1, y1, a0), 0, 0, 1, 1, 0, 1);
      else if (r1 < 1e-3) b.tri(p(r0, y0, a0), p(r0, y0, a1), p(r1, y1, a0), 0, 0, 1, 0, 0, 1);
      else b.quad(p(r0, y0, a0), p(r0, y0, a1), p(r1, y1, a1), p(r1, y1, a0), a0 * r0, y0, a1 * r0, y1);
    }
  }
}

async function buildPagoda(b, pal, rng, ctx) {
  const { x: cx, y: by, z: cz } = PAG, oct = ngon(8, Math.PI / 8), N = 13;
  // two-tier stone terrace with a moulded lip
  b.kind(2).col(pal.stoneLight);
  lathe(b, cx, cz, [[21.5, by - 6], [20.5, by + 0.9], [20.9, by + 1.2], [18.6, by + 1.2], [18.2, by + 2.2], [18.6, by + 2.5], [0, by + 2.5]], 8, Math.PI / 8);
  let y = by + 2.5;
  const rAt = (i) => lerp(10.6, 5.6, Math.pow(i / (N - 1), 0.92));
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1), hs = lerp(4.6, 2.95, f), r = rAt(i), rN = i < N - 1 ? rAt(i + 1) : 0.5, wallH = hs * 0.64;
    const P8 = (k, rr, yy) => { const a = Math.PI / 8 + (k / 8) * Math.PI * 2; return [cx + Math.cos(a) * rr, yy, cz + Math.sin(a) * rr]; };
    for (let k = 0; k < 8; k++) {
      const k1 = k + 1, side = 2 * r * Math.sin(Math.PI / 8);
      const L = (w, yy, rr = r) => { const a = P8(k, rr, yy), c = P8(k1, rr, yy); return [lerp(a[0], c[0], w), yy, lerp(a[2], c[2], w)]; };
      // balcony rail standing on the eave below
      b.kind(4).col(pal.timberDark);
      b.quad(L(0, y, r + 1.0), L(1, y, r + 1.0), L(1, y + 0.62, r + 1.0), L(0, y + 0.62, r + 1.0), 0, 0, side * 2.2, 1);
      // wall: plaster, an opening, plaster, a lintel over all three
      const o0 = 0.33, o1 = 0.67, oh = wallH * (k % 2 === i % 2 ? 0.72 : 0.5), ob = k % 2 === i % 2 ? 0 : wallH * 0.22;
      b.kind(0).col(pal.plaster, 0.05, rng);
      b.quad(L(0, y), L(o0, y), L(o0, y + wallH), L(0, y + wallH), 0, y, side * o0, y + wallH);
      b.quad(L(o1, y), L(1, y), L(1, y + wallH), L(o1, y + wallH), side * o1, y, side, y + wallH);
      b.kind(4).col(pal.timber);
      b.quad(L(o0, y + ob + oh), L(o1, y + ob + oh), L(o1, y + wallH), L(o0, y + wallH), 0, 0, 1, 1);
      if (ob > 0) b.quad(L(o0, y), L(o1, y), L(o1, y + ob), L(o0, y + ob), 0, 0, 1, 1);
      b.kind(8).col(pal.opening);
      b.quad(L(o0, y + ob, r - 0.25), L(o1, y + ob, r - 0.25), L(o1, y + ob + oh, r - 0.25), L(o0, y + ob + oh, r - 0.25), 0, 0, 1, 1);
      // bracket band flaring out under the eave
      b.kind(4).col(pal.bracket);
      b.quad(L(0, y + wallH), L(1, y + wallH), L(1, y + hs * 0.8, r + 0.85), L(0, y + hs * 0.8, r + 0.85), 0, 0, side * 2.5, 1);
      // corner column
      const cp = P8(k, r + 0.05, y); b.kind(4).col(pal.timber);
      b.box(cp[0], y, cp[2], 0.3, y + wallH, 0.3, -Math.PI / 8 - (k / 8) * Math.PI * 2, 1, false);
    }
    const last = i === N - 1, ov = lerp(3.7, 2.5, f);
    eaveRing(b, { cx, cz, C: oct.C, D: oct.D, eIn: last ? 0.45 : rN * 0.97, eOut: r + ov, yIn: y + hs + (last ? 3.4 : 0.4), drop: (last ? 3.4 : 0.4) + hs * 0.2 + 0.05,
      lift: lerp(1.25, 0.7, f), segs: i < 6 ? 6 : 4, rad: last ? 4 : 3, tile: pal.tile, edge: pal.tileEdge, soffit: pal.timber, soffitE: r + 0.85, soffitY: y + hs * 0.8, ridge: pal.tileEdge });
    // gilded wind bells under the eave corners
    b.kind(0).col(pal.gold);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k / 8) * Math.PI * 2, rr = (r + ov) * 1.05, px = cx + Math.cos(a) * rr, pz = cz + Math.sin(a) * rr, py = y + hs * 0.8 - 0.26 + lerp(1.25, 0.7, f) - (0.2 * hs + 0.05) + 0.2;
      b.tri([px - 0.2, py, pz], [px + 0.2, py, pz], [px, py - 0.55, pz]); b.tri([px, py, pz - 0.2], [px, py, pz + 0.2], [px, py - 0.55, pz]);
    }
    y += hs;
    await ctx.yield();      // a storey at a time (the whole tower in one go is a build step of 16 to 29 ms)
  }
  // spire: lotus base, mast with nine diminishing rings, gilded orb and point
  y += 3.3;
  const sp = [[0.9, y - 0.4], [1.5, y + 0.2], [0.7, y + 0.8], [0.45, y + 1.0]];
  for (let k = 0; k < 6; k++) { const yy = y + 1.2 + k * 0.72, rr = 1.25 - k * 0.15; sp.push([0.3, yy - 0.12], [rr, yy], [rr, yy + 0.16], [0.3, yy + 0.3]); }
  sp.push([0.25, y + 5.6], [0.62, y + 6.0], [0.62, y + 6.5], [0.2, y + 6.9], [0.08, y + 8.4], [0, y + 8.6]);
  b.kind(0).col(pal.gold); lathe(b, cx, cz, sp, 8);
  return y + 8.6;
}

function buildPavilion(b, pal, rng, x, y, z, rot, n, r, twoTier) {
  const g = ngon(n, rot + Math.PI / n), tile = rng.chance(0.5) ? pal.tile : pal.tileGreen;
  b.kind(2).col(pal.stoneLight, 0.06, rng); lathe(b, x, z, [[r + 1.5, y - 0.2], [r + 1.3, y + 0.5], [0, y + 0.5]], n, rot + Math.PI / n);
  const h = 3.6 + r * 0.22;
  for (let k = 0; k < n; k++) {
    const px = x + g.D[k][0] * r, pz = z + g.D[k][1] * r;
    b.kind(4).col(pal.timber); b.box(px, y + 0.5, pz, 0.2, y + 0.5 + h, 0.2, rot, 1, false);
    const k1 = (k + 1) % n, qx = x + g.D[k1][0] * r, qz = z + g.D[k1][1] * r;
    b.col(pal.bracket); b.quad([px, y + h - 0.25, pz], [qx, y + h - 0.25, qz], [qx, y + h + 0.5, qz], [px, y + h + 0.5, pz], 0, 0, 3, 1);          // lintel frieze
    b.col(pal.timberDark); b.quad([px, y + 0.5, pz], [qx, y + 0.5, qz], [qx, y + 1.2, qz], [px, y + 1.2, pz], 0, 0, 4, 1);                          // bench rail
  }
  let top = y + 0.5 + h;
  if (twoTier) {
    eaveRing(b, { cx: x, cz: z, C: g.C, D: g.D, eIn: r * 0.55, eOut: r + 1.7, yIn: top + 1.25, drop: 1.25, lift: 0.95, segs: 4, rad: 3, tile, edge: pal.tileEdge, soffit: pal.timber, soffitE: r, soffitY: top, ridge: pal.tileEdge });
    b.kind(8).col(pal.opening); lathe(b, x, z, [[r * 0.56, top + 1.0], [r * 0.56, top + 2.2]], n, rot + Math.PI / n);
    top += 1.9; r *= 0.56;
  }
  eaveRing(b, { cx: x, cz: z, C: g.C, D: g.D, eIn: 0.25, eOut: r + 1.8, yIn: top + 2.5, drop: 2.5, lift: 1.1, segs: 4, rad: 4, tile, edge: pal.tileEdge, soffit: pal.timber, soffitE: r, soffitY: top, ridge: pal.tileEdge });
  b.kind(0).col(pal.gold); lathe(b, x, z, [[0.3, top + 2.4], [0.5, top + 2.8], [0.18, top + 3.2], [0.34, top + 3.5], [0, top + 4.1]], 6);
}

// the water gate: a battered, crenellated bastion with a 14.6 m arch, a dark tunnel and a two-eaved gate hall
const GATE = { X0: -24, X1: 28, YT: 20, SP: 7.3, A: 7.3, RO: 8.9, ZB: -34, PR: 0.4 };
async function buildGate(b, pal, rng, ctx) {
  const { X0, X1, YT, SP, A, RO, ZB, PR } = GATE, zf = (y) => -0.08 * clamp(y, 0, YT), F = (x, y, pr = 0) => [x, y, zf(y) + pr];
  b.kind(2).col(pal.stone);
  b.quad(F(X0, -3), F(-RO, -3), F(-RO, SP), F(X0, SP), X0, -3, -RO, SP);
  b.quad(F(RO, -3), F(X1, -3), F(X1, SP), F(RO, SP), RO, -3, X1, SP);
  b.col(pal.stoneLight);
  b.quad(F(-RO, -3, PR), F(-A, -3, PR), F(-A, SP, PR), F(-RO, SP, PR), -RO, -3, -A, SP);
  b.quad(F(A, -3, PR), F(RO, -3, PR), F(RO, SP, PR), F(A, SP, PR), A, -3, RO, SP);
  const NS = 18, th = []; for (let k = 0; k <= NS; k++) th.push((k / NS) * Math.PI);
  th.push(Math.atan2(YT - SP, X1), Math.atan2(YT - SP, X0)); th.sort((a, c) => a - c);
  const edge = (t) => { const c = Math.cos(t), s = Math.sin(t), tx = c > 1e-6 ? X1 / c : c < -1e-6 ? X0 / c : 1e9, ty = s > 1e-6 ? (YT - SP) / s : 1e9, m = Math.min(tx, ty); return F(c * m, SP + s * m); };
  const ring = (r, t, pr) => F(Math.cos(t) * r, SP + Math.sin(t) * r, pr);
  for (let k = 0; k < th.length - 1; k++) {
    const t0 = th[k], t1 = th[k + 1]; if (t1 - t0 < 1e-5) continue;
    b.col(k % 2 ? pal.stoneLight : pal.stonePale);
    b.quad(ring(A, t0, PR), ring(A, t1, PR), ring(RO, t1, PR), ring(RO, t0, PR), t0 * 8, 0, t1 * 8, 1.6);
    b.col(pal.stone);
    const a = ring(RO, t0, 0), c = ring(RO, t1, 0), d = edge(t1), e = edge(t0);
    b.v(a[0], a[1], a[2], a[0], a[1]); b.v(c[0], c[1], c[2], c[0], c[1]); b.v(d[0], d[1], d[2], d[0], d[1]);
    b.v(a[0], a[1], a[2], a[0], a[1]); b.v(d[0], d[1], d[2], d[0], d[1]); b.v(e[0], e[1], e[2], e[0], e[1]);
  }
  await ctx.yield();
  // tunnel: three bands that fall into darkness, and a black end
  const zs = [PR, -4, -13, ZB], sh = [0.62, 0.2, 0.05];
  for (let s = 0; s < 3; s++) {
    b.col(pal.stone.clone().multiplyScalar(sh[s]));
    for (let k = 0; k < NS; k++) {
      const t0 = (k / NS) * Math.PI, t1 = ((k + 1) / NS) * Math.PI, p = (t, z) => [Math.cos(t) * A, SP + Math.sin(t) * A, z + (z > 0 ? zf(SP + Math.sin(t) * A) : 0)];
      b.quad(p(t0, zs[s]), p(t1, zs[s]), p(t1, zs[s + 1]), p(t0, zs[s + 1]), t0 * 7, zs[s], t1 * 7, zs[s + 1]);
    }
    for (const sx of [-1, 1]) b.quad([sx * A, -3, zs[s]], [sx * A, -3, zs[s + 1]], [sx * A, SP, zs[s + 1]], [sx * A, SP, zs[s]], zs[s], -3, zs[s + 1], SP);
  }
  b.kind(0).col(new THREE.Color(0.004, 0.006, 0.008)); b.quad([-A, -3, ZB], [A, -3, ZB], [A, SP + A, ZB], [-A, SP + A, ZB]);
  await ctx.yield();
  // flanks, deck, string course, parapet and merlons
  b.kind(2).col(pal.stone);
  b.quad([X0, -3, 0], [X0, -3, ZB], [X0, YT, ZB], [X0, YT, zf(YT)], 0, -3, -ZB, YT);
  b.quad([X1, -3, 0], [X1, -3, ZB], [X1, YT, ZB], [X1, YT, zf(YT)], 0, -3, -ZB, YT);
  b.quad([X0, -3, ZB - 0.7], [X1, -3, ZB - 0.7], [X1, YT, ZB - 0.7], [X0, YT, ZB - 0.7], X0, -3, X1, YT);
  b.kind(5).col(pal.stoneLight); b.quad([X0, YT, zf(YT)], [X1, YT, zf(YT)], [X1, YT, ZB], [X0, YT, ZB], X0, 0, X1, -ZB);
  const mx = (X0 + X1) / 2, hw = (X1 - X0) / 2;
  b.kind(2).col(pal.stoneLight); b.box(mx, 15.5, zf(16) - 0.2, hw + 0.3, 16.2, 0.6);
  b.col(pal.stone); b.box(mx, YT, zf(YT) - 0.45, hw + 0.2, YT + 1.0, 0.55);
  for (let x = X0 + 1; x < X1; x += 2.7) { b.col(pal.stone, 0.07, rng); b.box(x, YT + 1.0, zf(YT) - 0.45, 0.8, YT + 2.35, 0.55, 0, 0.92); }
  // buttress piers either side of the arch and corner towers
  for (const sx of [-1, 1]) {
    b.col(pal.stoneLight); b.box(sx * 12.7, -3, 1.5, 2.0, 12.6, 2.3, 0, 0.7);
    b.col(pal.stonePale); b.box(sx * 12.7, 12.6, 1.5, 1.6, 13.3, 1.8, 0, 0.6);
  }
  for (const x of [X0 + 1.2, X1 - 1.2]) { b.col(pal.stone); b.box(x, -3, 0.2, 2.9, YT + 1.2, 2.6, 0, 0.84); b.col(pal.stoneLight); b.box(x, YT + 1.2, 0.2, 2.75, YT + 1.9, 2.5, 0, 1); }
  await ctx.yield();
  // gate hall
  const hx = 2, hz = -13, y0 = YT;
  b.kind(0).col(pal.plaster); b.box(hx, y0, hz, 9, y0 + 4.2, 4, 0, 1, false);
  for (let i = 0; i <= 6; i++) {
    const x = hx - 9 + i * 3;
    b.kind(4).col(pal.timber); b.box(x, y0, hz + 4.05, 0.3, y0 + 4.2, 0.3, 0, 1, false);
    if (i < 6) { b.kind(8).col(pal.opening); b.quad([x + 0.55, y0 + 0.5, hz + 4.03], [x + 2.45, y0 + 0.5, hz + 4.03], [x + 2.45, y0 + 3.3, hz + 4.03], [x + 0.55, y0 + 3.3, hz + 4.03]); }
  }
  const h1 = hipRect(5);
  eaveRing(b, { cx: hx, cz: hz, C: h1.C, D: h1.D, eIn: 3.3, eOut: 7.0, yIn: y0 + 5.5, drop: 1.6, lift: 1.1, segs: 6, rad: 3, tile: pal.tile, edge: pal.tileEdge, soffit: pal.timber, soffitE: 4.1, soffitY: y0 + 4.2, ridge: pal.tileEdge });
  await ctx.yield();
  b.kind(0).col(pal.plaster); b.box(hx, y0 + 4.6, hz, 6.7, y0 + 7.5, 2.6, 0, 1, false);
  for (let i = 0; i < 5; i++) { const x = hx - 6 + i * 2.5; b.kind(8).col(pal.opening); b.quad([x + 0.4, y0 + 5.6, hz + 2.63], [x + 1.6, y0 + 5.6, hz + 2.63], [x + 1.6, y0 + 7.0, hz + 2.63], [x + 0.4, y0 + 7.0, hz + 2.63]); }
  const h2 = hipRect(4.4);
  eaveRing(b, { cx: hx, cz: hz, C: h2.C, D: h2.D, eIn: 0.3, eOut: 5.3, yIn: y0 + 10.6, drop: 3.5, lift: 1.3, segs: 6, rad: 4, tile: pal.tile, edge: pal.tileEdge, soffit: pal.timber, soffitE: 2.7, soffitY: y0 + 7.5, ridge: pal.tileEdge });
  b.kind(0).col(pal.tileEdge); b.box(hx, y0 + 10.45, hz, 4.9, y0 + 11.0, 0.32);
  for (const sx of [-1, 1]) { b.col(pal.gold); b.box(hx + sx * 4.8, y0 + 10.9, hz, 0.4, y0 + 12.1, 0.3, 0, 0.35); }
}

// the fish-scale seawall, promenade and dyke: a profile swept along the arc
const WALL_PROFILE = [   // [off toward the river, y, kind, colour key]; a segment runs from each row to the next
  [7.5, -3.2, 6, 'rubble'], [3.4, -0.3, 6, 'rubble'], [3.1, 0.5, 3, 'stone'], [2.45, 3.2, 2, 'stoneLight'], [2.0, 3.3, 3, 'stone'], [1.35, 6.2, 2, 'stoneLight'],
  [0.95, 6.3, 3, 'stone'], [0.35, 8.65, 2, 'stoneLight'], [0.72, 8.78, 2, 'stonePale'], [0.72, 9.16, 2, 'stoneLight'], [0.1, 9.16, 2, 'stonePale'], [0.1, 9.78, 2, 'stoneLight'],
  [-0.45, 9.78, 2, 'stone'], [-0.45, 9.12, 5, 'paving'], [-24, 9.0, 7, 'grass'], [-27.5, 8.5, 7, 'grass'], [-44, 4.2, 7, 'grass'],
];
async function buildWallGeometry(pal, noise, ctx) {
  const NA = 240, S = WALL_PROFILE.length - 1, nv = S * 2 * (NA + 1);
  const P = new Float32Array(nv * 3), Nn = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), U = new Float32Array(nv * 2), K = new Float32Array(nv), I = [];
  const tmp = new THREE.Vector3(); let arc = 0, pz = 0, px = wallX(0);
  for (let i = 0; i <= NA; i++) {
    const z = (i / NA) * ZE, sn = SIN0 + z / RW, cs = Math.sqrt(1 - sn * sn), x = wallX(z);
    arc += Math.hypot(x - px, z - pz); px = x; pz = z;
    let v = 0;
    for (let s = 0; s < S; s++) {
      const a = WALL_PROFILE[s], c = WALL_PROFILE[s + 1], dl = Math.hypot(c[0] - a[0], c[1] - a[1]), no = (c[1] - a[1]) / dl, ny = -(c[0] - a[0]) / dl;
      const col = pal[a[3]], stain = 1 + 0.1 * noise.n2(arc * 0.012, s * 0.3) + 0.05 * noise.n2(arc * 0.06, s * 0.4);
      for (let e = 0; e < 2; e++) {
        const q = e ? c : a, o = (i * S + s) * 2 + e;
        wallPoint(z, q[0], q[1], tmp); P[o * 3] = tmp.x; P[o * 3 + 1] = tmp.y; P[o * 3 + 2] = tmp.z;
        Nn[o * 3] = cs * no; Nn[o * 3 + 1] = ny; Nn[o * 3 + 2] = -sn * no;
        Cc[o * 3] = col.r * stain; Cc[o * 3 + 1] = col.g * stain; Cc[o * 3 + 2] = col.b * stain;
        U[o * 2] = arc; U[o * 2 + 1] = v + (e ? dl : 0); K[o] = a[2];
      }
      v += dl;
      if (i < NA) { const o = (i * S + s) * 2, n = o + S * 2; I.push(o, o + 1, n, o + 1, n + 1, n); }
    }
    if (i % 12 === 11) await ctx.yield();
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setAttribute('aK', new THREE.BufferAttribute(K, 1));
  g.setIndex(I); g.computeBoundingSphere();
  return g;
}

// the headland: a superellipse plateau with river cliffs, terraced like strata
function makeBluff(noise) {
  const { x: bx, z: bz, a, b } = BLUFF, p = 2.7;
  const rho = (x, z) => { const dx = x - bx, dz = z - bz, th = Math.atan2(dz, dx); return Math.pow(Math.pow(Math.abs(dx) / a, p) + Math.pow(Math.abs(dz) / b, p), 1 / p) / (1 + 0.09 * noise.n2(Math.cos(th) * 1.6 + 4, Math.sin(th) * 1.6)); };
  const heightAt = (x, z) => {
    const r = rho(x, z); if (r >= 1) return -4;
    const south = smoothstep(-0.3, 0.5, (z - bz) / b) * 0.5 + smoothstep(0.0, 0.8, (x - bx) / a) * 0.5;   // river sides are cliffs
    const c0 = lerp(0.42, 0.87, clamp(south * 1.4, 0, 1)), e = smoothstep(c0, 1, r);
    let h = (14.5 + 27 * Math.exp(-((x - PAG.x) ** 2 + (z - PAG.z) ** 2) / 6800) + 3 * noise.fbm2(x * 0.02, z * 0.02, 3)) * (1 - Math.pow(e, 1.5));
    const st = 3.7, q = h / st + 0.4 * noise.n2(x * 0.021 + 3, z * 0.021), fl = Math.floor(q), fr = q - fl;
    h = lerp(h, (fl + smoothstep(0.36, 0.64, fr) - 0.4 * noise.n2(x * 0.021 + 3, z * 0.021)) * st, 0.88 * smoothstep(0.06, 0.4, e));   // strata: benches and risers on the cliffs
    h += (1.5 * noise.n2(x * 0.07, z * 0.07) + 0.8 * noise.n2(x * 0.19, z * 0.19)) * smoothstep(0, 0.4, e);
    h = lerp(-4, h, smoothstep(1, 0.955, r));
    const dp = Math.hypot(x - PAG.x, z - PAG.z); if (dp < 26) h = lerp(PAG.y - 0.5, h, smoothstep(17, 26, dp));   // level the pagoda court
    return h;
  };
  return { rho, heightAt };
}
async function buildBluffGeometry(bluff, pal, noise, ctx) {
  const { x: bx, z: bz, a, b } = BLUFF, NR = 38, NS = 128, nv = (NR + 1) * NS + 1;
  const P = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), U = new Float32Array(nv * 2), K = new Float32Array(nv).fill(6), I = new Uint32Array(NS * NR * 6 + NS * 3); let ni = 0;
  for (let s = 0; s < NS; s++) {
    const th = (s / NS) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    let lo = 0, hi = (a + b) * 1.3; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (bluff.rho(bx + c * m, bz + sn * m) < 1) lo = m; else hi = m; }
    for (let r = 0; r <= NR; r++) {
      const t = (r + 1) / (NR + 1), rr = hi * 1.02 * (1 - Math.pow(1 - t, 2.1)), o = 1 + r * NS + s, x = bx + c * rr, z = bz + sn * rr;
      P[o * 3] = x; P[o * 3 + 1] = bluff.heightAt(x, z); P[o * 3 + 2] = z;
      if (r < NR) { const s1 = (s + 1) % NS, n = o + NS, o1 = 1 + r * NS + s1, n1 = o1 + NS; I[ni++] = o; I[ni++] = o1; I[ni++] = n; I[ni++] = o1; I[ni++] = n1; I[ni++] = n; }
      else if (r === NR) P[o * 3 + 1] = -4;
    }
    I[ni++] = 0; I[ni++] = 1 + ((s + 1) % NS); I[ni++] = 1 + s;
    if (s % 4 === 3) await ctx.yield();
  }
  P[0] = bx; P[1] = bluff.heightAt(bx, bz); P[2] = bz;
  const g = new THREE.BufferGeometry();
  await ctx.yield();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(new THREE.BufferAttribute(I, 1));
  await ctx.yield();
  await normalsSteps(g, ctx);
  await ctx.yield();
  const Nn = g.attributes.normal.array, col = new THREE.Color();
  for (let o = 0; o < nv; o++) {
    const x = P[o * 3], y = P[o * 3 + 1], z = P[o * 3 + 2], flat = smoothstep(0.62, 0.9, Nn[o * 3 + 1]), n = noise.fbm2(x * 0.05 + 9, z * 0.05, 3);
    const band = noise.n2(x * 0.012 + z * 0.009, y * 0.34), steep = 1 - flat;
    col.copy(pal.rock).lerp(pal.rockWarm, clamp(0.42 + 0.8 * band, 0, 1)).multiplyScalar((0.74 + 0.3 * n) * (1 - 0.3 * steep * smoothstep(0.1, 0.6, noise.n2(x * 0.05, y * 0.9 + z * 0.05))));
    col.lerp(pal.moss, steep * 0.45 * smoothstep(-0.1, 0.5, noise.n2(x * 0.045 + 7, z * 0.045)));
    col.lerp(pal.litter, flat * (0.75 + 0.25 * n));
    if (y < 7.5) { const w = 1 - smoothstep(4.2, 7.5, y + 1.2 * n); col.lerp(pal.wetRock, 0.82 * w); }                // dark wet rock where the tide reaches
    Cc[o * 3] = col.r; Cc[o * 3 + 1] = col.g; Cc[o * 3 + 2] = col.b; U[o * 2] = x; U[o * 2 + 1] = z;
    if (o % 100 === 99) await ctx.yield();
  }
  g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setAttribute('aK', new THREE.BufferAttribute(K, 1));
  g.computeBoundingSphere();
  return g;
}

// a stair that zig-zags from the back of the gate deck up the bluff to the pagoda terrace: level treads laid on the rock,
// retaining skirts either side, a landing and a lantern post at every turn. Returns its treads (for the crowd and the trees).
function buildStair(b, pal, bluff) {
  const way = [[5, -25.5], [-8, -37], [13, -49], [21.7, -68.6]], W = 1.7, pts = [];
  for (let k = 0; k < way.length - 1; k++) {
    const [x0, z0] = way[k], [x1, z1] = way[k + 1], L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.62);
    for (let i = k ? 1 : 0; i <= n; i++) pts.push({ x: lerp(x0, x1, i / n), z: lerp(z0, z1, i / n), dx: (x1 - x0) / L, dz: (z1 - z0) / L, turn: i === n || (k === 0 && i === 0), y: 0 });
  }
  const N = pts.length, top = PAG.y + 1.2;
  for (let i = 0; i < N; i++) { const q = pts[i]; q.y = Math.max(bluff.heightAt(q.x, q.z), bluff.heightAt(q.x - q.dz * W, q.z + q.dx * W), bluff.heightAt(q.x + q.dz * W, q.z - q.dx * W)) + 0.25; }
  for (let i = 0; i < N; i++) { const q = pts[i]; q.y = Math.min(Math.max(q.y, GATE.YT + 0.05, top - (N - 1 - i) * 0.62 * 0.6, i ? pts[i - 1].y : 0), top); }
  layStair(b, pal, pts, W);
  return pts;
}

// lays the masonry of a stair along its points: treads, risers, retaining skirts, landings and lantern posts at the turns
function layStair(b, pal, pts, W) {
  const N = pts.length, lamp = new THREE.Color('#c8382a');
  const corner = (q, sd, y) => [q.x - q.dz * W * sd, y, q.z + q.dx * W * sd];
  let run = 0;
  for (let i = 0; i < N - 1; i++) {
    const a = pts[i], c = pts[i + 1], y = c.y, y0 = a.y;
    if (a.turn && i > 0) {                                  // a landing where the stair turns
      b.kind(5).col(pal.paving); b.box(a.x, y0 - 3.2, a.z, 2.5, y0, 2.5, Math.atan2(a.dx, a.dz), 1);
    }
    const q0 = { x: a.x, z: a.z, dx: c.dx, dz: c.dz };
    b.kind(5).col(pal.paving, 0, null); b.quad(corner(q0, 1, y), corner(q0, -1, y), corner(c, -1, y), corner(c, 1, y), 0, run, W * 2, run + 0.62);
    if (y > y0 + 0.01) { b.kind(2).col(pal.stone); b.quad(corner(q0, 1, y0), corner(q0, -1, y0), corner(q0, -1, y), corner(q0, 1, y), 0, y0, W * 2, y); }
    for (const sd of [-1, 1]) { b.kind(2).col(sd > 0 ? pal.stoneLight : pal.stone); b.quad(corner(q0, sd, y - 3.4), corner(c, sd, y - 3.4), corner(c, sd, y + 0.38), corner(q0, sd, y + 0.38), run, y - 3.4, run + 0.62, y + 0.38); }
    run += 0.62;
  }
  for (let i = 0; i < N; i += 1) {
    const q = pts[i]; if (!(q.turn || i % 16 === 8)) continue;
    for (const sd of q.turn ? [-1, 1] : [1]) {
      const [x, , z] = corner(q, sd * 1.12, 0), y = q.y;
      b.kind(4).col(pal.timber); b.box(x, y - 0.2, z, 0.11, y + 2.3, 0.11, 0, 1, false);
      b.kind(8).col(lamp); b.box(x, y + 2.3, z, 0.3, y + 3.0, 0.3, 0, 0.82);
      b.kind(0).col(pal.tileEdge); b.box(x, y + 3.0, z, 0.46, y + 3.3, 0.46, 0, 0.15);
    }
  }
}

// the river stair: from a tide landing at the foot of the cliff it zig-zags up the river face of the bluff to the level
// of the gate deck. Every tread is found on the rock itself (the outermost point of the cliff at that height), so the
// stair hugs the strata; the lowest flight is under water once the bore has passed.
async function buildFaceStair(b, pal, bluff, ctx) {
  const XA = 37, XB = 56, LEGS = 4, W = 1.5, Y0 = 2.6, Y1 = GATE.YT + 0.6, per = Math.round((XB - XA) / 0.62), N = LEGS * per + 1, pts = [];
  let zp = 5;
  for (let i = 0; i < N; i++) {
    const k = Math.min(LEGS - 1, Math.floor(i / per)), f = (i - k * per) / per, dir = k % 2 ? -1 : 1;
    const x = dir > 0 ? lerp(XA, XB, f) : lerp(XB, XA, f), y = lerp(Y0, Y1, i / (N - 1));
    let z = Math.min(5, zp + 2); for (let it = 0; it < 60 && bluff.heightAt(x, z) < y - 0.35; it++) z -= 0.45;
    zp = z;
    pts.push({ x, z, dx: dir, dz: 0, turn: i === 0 || (i % per === 0), y });
    if (i % 24 === 23) await ctx.yield();
  }
  for (let pass = 0; pass < 2; pass++) for (let k = 0; k < LEGS; k++) {                       // straighten each flight a little
    const i0 = k * per, i1 = Math.min(N - 1, i0 + per), zs = [];
    for (let i = i0; i <= i1; i++) { let a = 0, n = 0; for (let j = Math.max(i0, i - 3); j <= Math.min(i1, i + 3); j++) { a += pts[j].z; n++; } zs.push(a / n); }
    for (let i = i0; i <= i1; i++) pts[i].z = zs[i - i0];
  }
  for (const q of pts) q.z += 0.9;                                                            // stand proud of the rock
  const q0 = pts[0];
  b.kind(2).col(pal.stone); b.box(q0.x - 1.5, -4, q0.z + 1.2, 4.2, Y0 - 0.05, 3.4, 0, 1);    // the tide landing
  b.kind(5).col(pal.paving); b.box(q0.x - 1.5, Y0 - 0.05, q0.z + 1.2, 4.2, Y0 + 0.02, 3.4, 0, 1);
  layStair(b, pal, pts, W);
  return pts;
}


// ---------- lit material for stone, tile, timber and rock: vertex colour x procedural surface by kind ----------
const ARCH_PARS = /* glsl */`
uniform sampler2D uNoise; uniform float uBoreZ, uLead, uTime, uLamp, uWet, uPlume; uniform vec3 uLampCol, uSunCol, uHorizon;
varying float vK; varying vec2 vSu; varying vec3 vWp;
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
`;
const ARCH_COLOR = /* glsl */`
float archRough = 1., archSheen = 0.; vec3 archGlow = vec3(0.);
{
  float k = floor(vK + 0.5); vec2 su = vSu;
  if (k == 6.) su += vWp.y * vec2(0.62, 0.78);            // rock: shear the map with height so cliffs do not smear
  vec4 nz = texture2D(uNoise, su * 0.11), nz2 = texture2D(uNoise, su * 0.017 + 0.37);
  vec3 c = diffuseColor.rgb * (0.86 + 0.28 * nz2.r);
  float st = texture2D(uNoise, vec2(vWp.y * 0.085 + nz2.r * 0.3, (su.x + su.y) * 0.004)).r;
  vec4 bg = texture2D(uNoise, vec2((su.x - su.y) * 0.045, vWp.y * 0.11));
  float streak = smoothstep(0.62, 0.76, texture2D(uNoise, vec2(su.x * 0.83 + nz.r * 0.5, su.y * 0.02 + uTime * 0.3)).a)
    * smoothstep(0.38, 0.62, texture2D(uNoise, vec2(su.x * 0.19 + 0.4, su.y * 0.12 + uTime * 0.85)).r);        // runnels that wander and come in pulses
  if (k == 1.) {            // glazed roof tile: ribs run down the slope, courses across it
    float rib = abs(fract(su.x * 2.4) - 0.5) * 2., course = fract(su.y * 1.8);
    c *= mix(0.5, 1.15, smoothstep(0.05, 0.8, rib)) * mix(0.8, 1.06, course) * (0.85 + 0.3 * nz.a);
    archRough = 0.55;
  } else if (k == 2.) {     // ashlar
    vec2 q = vec2(su.x / 1.3, su.y / 0.55); q.x += 0.5 * mod(floor(q.y), 2.);
    vec2 f = fract(q); float hh = h21(floor(q));
    float m = smoothstep(0., 0.05, f.x) * (1. - smoothstep(0.95, 1., f.x)) * smoothstep(0., 0.1, f.y) * (1. - smoothstep(0.9, 1., f.y));
    c *= mix(0.52, 1., m) * (0.82 + 0.34 * hh);
  } else if (k == 3.) {     // fish-scale wall: rounded stones in staggered courses, each lapping the one below, dark joints
    vec2 q = vec2(su.x / 1.9, su.y / 0.98); q.x += 0.5 * mod(floor(q.y), 2.);
    vec2 f = fract(q), id = floor(q); float px = abs(f.x - 0.5) * 2., px2 = 1. - px;
    float own = f.y - 0.5 * (1. - sqrt(max(1. - px * px, 0.)));                 // height above this stone's rounded lower edge
    float v = own, hh = h21(id);
    if (own < 0.) { v = f.y + 1. - 0.5 * (1. - sqrt(max(1. - px2 * px2, 0.))); hh = h21(id + vec2(f.x > 0.5 ? 0.5 : -0.5, -1.)); }
    float joint = smoothstep(0.012, 0.085, abs(own));
    c *= mix(0.3, 1., joint) * mix(1.16, 0.6, smoothstep(0.08, 1.05, v)) * (0.76 + 0.44 * hh);
    c = mix(c, c * vec3(0.7, 0.88, 0.62), smoothstep(0.55, 0.8, nz2.a) * 0.6);
  } else if (k == 4.) {     // lacquered timber
    float bd = abs(fract(su.x * 1.4) - 0.5) * 2.;
    c *= mix(0.68, 1.05, smoothstep(0.04, 0.3, bd)) * (0.88 + 0.24 * nz.r); archRough = 0.62;
  } else if (k == 5.) {     // paving
    vec2 q = su / vec2(1.4, 1.1); q.x += 0.5 * mod(floor(q.y), 2.); vec2 f = fract(q);
    c *= mix(0.6, 1., smoothstep(0., 0.05, f.x) * smoothstep(0., 0.06, f.y)) * (0.84 + 0.32 * nz.a);
  } else if (k == 6.) {     // rock: strata, fractures, a fake relief from the noise slope; cut away inside the gate tunnel
    if (abs(vWp.x) < 7.7 && vWp.y < 15.3 && vWp.z > -34.4 && vWp.z < 1.) discard;
    c *= (0.5 + 0.9 * st) * (0.84 + 0.32 * nz.r) * (0.62 + 1.5 * (bg.g - 0.5) + 0.76 * bg.r);
    float bed = abs(fract(vWp.y * 0.54 + nz2.r * 1.6 + nz.r * 0.25) - 0.5);                       // bedding planes
    c *= mix(0.5, 1., smoothstep(0.02, 0.1, bed)) * mix(1., 0.78, smoothstep(0.3, 0.5, bed));
  } else if (k == 7.) {
    c *= 0.72 + 0.56 * nz.a;
  } else if (k == 8.) {     // openings: dark by day, lantern-lit when uLamp rises
    archGlow = uLampCol * uLamp * (0.5 + 0.5 * nz.r); c *= 0.55;
  }
  if (k == 2. || k == 3. || k == 5. || k == 6.) {
    float zp = uBoreZ - uLead, wl = 1.2 + 1.3 * nz2.r;
    float tide = 1. - smoothstep(wl - 0.6, wl + 0.5, vWp.y);
    float past = smoothstep(-8., 8., vWp.z - zp) * uPlume * (1. - smoothstep(10., 16., vWp.y));
    float drench = past * exp(-max(vWp.z - zp, 0.) / 300.);
    float wet = clamp(max(tide * 0.95, drench * (0.5 + 0.5 * nz2.a)) + uWet * 0.35 * nz2.a, 0., 1.);
    // as the bore piles into the gate the masonry round it is drenched to a ragged tide line: dark wet stone below it, so the
    // pale arch and the dry wall above stand out
    float surge = (1. - smoothstep(25., 75., uBoreZ)) * (1. - smoothstep(30., 60., abs(vWp.x))) * step(-6., vWp.z)
      * (1. - smoothstep(9.2 + 3.6 * nz2.r, 10.2 + 3.6 * nz2.r, vWp.y + 1.5 * (nz.r - 0.5)));
    wet = max(wet, surge);
    // (under a low sun or the moon the wall is dark already)
    c *= mix(1., 0.6, wet) * mix(1., mix(0.62, 0.84, clamp(uLamp * 1.7, 0., 1.)), surge); c = mix(c, c * vec3(0.74, 0.95, 0.8), max(tide, surge * 0.6) * 0.55); archRough *= mix(1., 0.28, wet);
    c = mix(c, c * 1.6 + vec3(0.06, 0.08, 0.09), streak * past * exp(-max(vWp.z - zp, 0.) / 55.) * 0.6 * step(k, 3.5) * (1. - smoothstep(5., 11., vWp.y)) * smoothstep(0.6, 2.2, vWp.y));
    archSheen = clamp(max(max(drench * 1.4, tide * 0.7), surge), 0., 1.);
  }
  if (k == 2. || k == 3. || k == 6.) archGlow += c * uSunCol * 0.2 * clamp(1. - vWp.y / 15., 0., 1.);   // light thrown back by the water
  diffuseColor.rgb = c;
}
`;
function makeArchMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    for (const k of ['uNoise', 'uBoreZ', 'uLead', 'uTime', 'uLamp', 'uWet', 'uPlume', 'uLampCol', 'uSunCol', 'uHorizon']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aK;\nvarying float vK; varying vec2 vSu; varying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvK = aK; vSu = uv; vWp = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + ARCH_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + ARCH_COLOR)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * archRough, 0.08, 1.);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += archGlow + uHorizon * archSheen * 0.5 * pow(clamp(1. - abs(dot(normal, normalize(vViewPosition))), 0., 1.), 3.);');
  };
  m.customProgramCacheKey = () => 'silver-dragon-arch-4';
  return m;
}

// ---------- the river and the bore ----------
function axis(spans) { const a = [spans[0][0]]; for (const [from, to, step] of spans) { const n = Math.max(1, Math.round((to - from) / step)); for (let i = 1; i <= n; i++) a.push(from + ((to - from) * i) / n); } return a; }
function buildWaterGeometry() {
  const D = axis([[-4, 20, 1.5], [20, 60, 1.5], [60, 200, 2], [200, 300, 3.5], [300, 400, 5], [400, 480, 20], [480, 1280, 50], [1280, 2600, 165], [2600, 3400, 800], [3400, 4500, 1100], [4500, 6000, 1500]]);
  const S = axis([[-6000, -3000, 1500], [-3000, -1800, 600], [-1800, -1000, 400], [-1000, -600, 200], [-600, -120, 60], [-120, -30, 3.6], [-30, -8, 2.2], [-8, 4, 0.5], [4, 25, 1.25], [25, 235, 4], [235, 475, 12],
    [475, 800, 110], [800, 1500, 350], [1500, 3300, 600], [3300, 6000, 1350]]);
  const nd = D.length, ns = S.length, P = new Float32Array(nd * ns * 3), I = new Uint32Array((nd - 1) * (ns - 1) * 6);
  for (let j = 0; j < ns; j++) for (let i = 0; i < nd; i++) { const o = (j * nd + i) * 3; P[o] = D[i]; P[o + 2] = S[j]; }
  let q = 0;
  for (let j = 0; j < ns - 1; j++) for (let i = 0; i < nd - 1; i++) { const a = j * nd + i, c = a + 1, d = a + nd, e = d + 1; I[q++] = a; I[q++] = d; I[q++] = c; I[q++] = c; I[q++] = d; I[q++] = e; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(new THREE.BufferAttribute(I, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
  return g;
}
const WATER_VERT = /* glsl */`
uniform sampler2D uNoise; uniform vec3 uCamL; uniform float uReach;
varying vec3 vL; varying vec4 vG; varying vec4 vI;
#include <common>
#include <fog_pars_vertex>
${WATER_COMMON}
${RID_GLSL}
${FOOT_GLSL}
void main(){
  float d = position.x, zf = zFront(d);
  float z = clamp(zf + position.z, ${GL(ZMIN)}, ${GL(ZMAX)}), s = z - zf, x = wallX(z) + d;
  float h = boreH(s, d), e = 0.4;
  // the slope of the surface goes to the fragment in parts: (d-slope, front slope, wall slope, the s-slope of the extras);
  // the fragment adds the bore's own exact s-slope
  vG = vec4((boreExtra(s, d + e) - boreExtra(s, d - e)) / (2. * e), dzFront(d), wallDx(z), (boreExtra(s + e, d) - boreExtra(s - e, d)) / (2. * e));
  float behind = smoothstep(-2., 12., s);
  vec2 xz = vec2(x, z);
  float n1 = textureLod(uNoise, xz * 0.021 + uTime * vec2(0.008, -0.012), 0.).r - 0.5;
  float n2 = textureLod(uNoise, xz * 0.06 + uTime * vec2(-0.02, -0.03), 0.).r - 0.5;
  float faceM = smoothstep(${GL(-LF - 1)}, ${GL(-LF + 2)}, s) * (1. - smoothstep(0., 7., s));
  // (in the gate basin, the last 70 m before the threshold, the crest's lumps are broader, so that the mesh there carries them without facets)
  float lump = textureLod(uNoise, vec2(x * 0.09, s * 0.11 + uTime * 0.55), mix(5.7, 4.5, smoothstep(22., 70., zf))).a - 0.5;
  h += (n1 * 0.9 + n2 * 0.4) * mix(0.1, 0.8, behind) + lump * faceM * mix(0.14, 0.95, smoothstep(-1.6, 0.6, s));
  // where the bore runs up the seawall it is white water, heaped and thrown about, not a smooth wedge with a front like
  // the cut end of a slab against the masonry
  float runM = uPlume * exp(-max(d - 2.5, 0.) / 4.5) * smoothstep(-13., -4., s) * (1. - smoothstep(6., 22., s));
  // (heaps a few metres across: finer ones would fall between the vertices)
  float chop = (textureLod(uNoise, vec2(x * 0.07 + uTime * 0.04, z * 0.07 - uTime * 0.085), 4.6).r - 0.5) * 1.7;
  float chop2 = (textureLod(uNoise, vec2(x * 0.085 + 0.3, s * 0.08 + uTime * 0.2), 4.4).a - 0.5) * 1.5;
  h += (chop * 2.4 + chop2 * 1.1) * runM;
  // and a tongue of it runs on ahead along the foot of the wall, so the end of the wave against the stone is a heap with a
  // ragged apron and not a straight ramp
  // (a narrow one, hard against the stone: the wave beside it keeps its trough, its face and its lip right up to the wall)
  h += uPlume * exp(-max(d, 0.) / 2.4) * smoothstep(-19., -6., s) * (1. - smoothstep(-6., 0., s)) * max(1.8 + 2.2 * chop2 + 1.7 * chop, 0.3);
  // the foot of the face is a roll of white water pushed out ahead of the toe, piled unevenly along the front, and
  // the crest stands in teeth and notches (see FOOT_GLSL; neither is in heightAt: the roll is knee high and the teeth are a
  // stride deep, within 2 m of the crest line)
  vec2 lb = footLobe(x); float ridK = ridGap(d);      // (no roll is piled round a rider in his pocket under the wall: his hull stays clear of it)
  h += footH(s, lb) * ridK;
  vG.w += (footH(s + 0.25, lb) - footH(s - 0.25, lb)) * 2. * ridK;
  h += crestRag(x) * exp(-(s + 0.2) * (s + 0.2) / 1.6) * smoothstep(3., 9., d);
  vI = vec4(s, d, h, 0.);
  // the lip pitches forward over the face: the top rows of the crest are thrown ahead and tipped down, more here and less
  // there along the front. Not round the eye once it rides the face (the camera and the riders sit under where it would be)
  float dC = uCamL.x - wallX(uCamL.z), sC = uCamL.z - zFront(dC);
  float atEye = smoothstep(-7.5, -4., sC) * (1. - smoothstep(6., 17., abs(d - dC)));
  float tear = textureLod(uNoise, vec2(x * 0.043 + 0.21, uTime * 0.045 + 0.33), 4.).r;
  float nearW = 1. - smoothstep(40., 70., abs(d - dC));
  float reach = mix(mix(1.9, 2.7, nearW * (1. - smoothstep(-12., -8., sC))), 3.3, nearW * uReach);      // (thrown further in front of an eye that waits for it; uReach: the world asks for the whole of it as the wall arrives)
  float toW = mix(0.72 * smoothstep(2.5, 7., d), 1., smoothstep(9., 26., d));      // (the lip is carried to the seawall, at 0.72 of its throw within a few metres of the stone)
  float cAmt = reach * toW * (0.5 + 0.85 * tear) * (1. - atEye) * ridGap(d);
  // The lip is a thin sheet, not a rounded bank: the crest row is thrown furthest and droops at its edge, the rows under it follow
  // less and are drawn down under the sheet (its underside, where the light comes through), the rows behind it make its top.
  float sa = abs(s + 0.15), curl = cAmt * exp(-sa * sqrt(sa) / 0.55);
  h -= cAmt * (0.19 * exp(-s * s / 0.1) + 0.1 * exp(-(s + 0.5) * (s + 0.5) / 0.08));
  vI.w = curl;      // (how far the lip overhangs here: the fragment shades its underside)
  vL = vec3(x, h, z - curl);
  vec4 mvPosition = modelViewMatrix * vec4(vL, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform vec3 uDeep, uJade, uFoam, uSilt, uSunDir, uSunCol, uSkyAmb, uZenith, uHorizon, uCamL;
uniform float uTurbid, uRefl, uFresP, uLow, uDim;
uniform vec4 uLampR[8]; uniform vec3 uLampC;      // lamps on the water ahead of the face (x, z, strength), and their colour
varying vec3 vL; varying vec4 vG; varying vec4 vI;
#include <common>
#include <fog_pars_fragment>
${WATER_COMMON}
${RID_GLSL}
${FOOT_GLSL}
${NET_GLSL}
void main(){
  float s = vI.x, d = vI.y, h = vI.z; vec2 xz = vL.xz;
  vec2 lb = footLobe(xz.x); float cF = s + ${GL(LF)};      // the white water at the foot: how far it runs out here, and metres up the face from the toe
  vec3 toCam = uCamL - vL; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  float behind = smoothstep(-2., 12., s), sb = max(s, 0.);
  float Fs = vG.w + boreDs(s);
  vec3 vN = normalize(vec3(Fs * vG.y - vG.x, 1., vG.x * vG.z - Fs * (1. + vG.y * vG.z)));     // the big shape's normal, exact across the lip
  float hp = boreProf(s);
  float ft = clamp(1. + s / ${GL(LF)}, 0., 1.);                                            // 0 at the toe, 1 at the crest
  float onFace = smoothstep(${GL(-LF - 0.6)}, ${GL(-LF + 1.2)}, s) * (1. - smoothstep(-0.4, 1.6, s));
  float lowSun = 1. - smoothstep(0.15, 0.6, uSunDir.y), low = uLow;       // low: golden hour and dawn, when the face is surfed into the light
  vec4 g1T = texture2D(uNoise, xz * 0.031 + uTime * vec2(0.011, -0.017)); vec2 g1 = g1T.gb - 0.5;
  vec4 t2 = texture2D(uNoise, xz * 0.113 + uTime * vec2(-0.031, -0.043)); vec2 g2 = t2.gb - 0.5;
  vec4 n3 = texture2D(uNoise, xz * 0.0068 + uTime * vec2(0.003, -0.004)); vec2 g3 = n3.gb - 0.5;
  // open water ahead of the bore: slicks and cat's paws, a long low swell
  float paw = smoothstep(0.38, 0.66, texture2D(uNoise, xz * 0.0125 + uTime * vec2(0.002, -0.006)).a);
  float swl = sin(xz.y * 0.19 + xz.x * 0.035 + uTime * 0.8 + n3.r * 5.);
  float calm = (1. - behind) * (1. - onFace);
  float rough = mix(0.3, 1.5, behind) * (1. - 0.65 * onFace) * mix(1., mix(0.3, 2.2, paw), calm), nearK = 1. / (1. + dist * 0.004);
  vec2 g4 = (texture2D(uNoise, xz * 0.47 + uTime * vec2(0.06, -0.09)).gb - 0.5) * (1. - smoothstep(4., 26., dist));      // fine ripples that only show close by
  vec3 N = normalize(vN + vec3(g1.x + g2.x * 0.6 * nearK + g3.x * 1.4 + g4.x * 0.5, 0., g1.y + g2.y * 0.6 * nearK + g3.y * 1.4 + g4.y * 0.5) * rough + vec3(0., 0., swl * 0.05 * calm));
  float nv = max(dot(N, V), 0.), fres = 0.025 + 0.975 * pow(max(1. - nv, 0.), uFresP);
  vec3 R = reflect(-V, N);
  float upR = smoothstep(-0.06, 0.12, R.y);                 // a steep face throws the view down into the river: no sun can be mirrored there
  R.y = abs(R.y) + 0.02; R = normalize(R);
  vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y, 0., 1.), 0.45));
  float sr = max(dot(R, uSunDir), 0.), sr2 = sr * sr, sr4 = sr2 * sr2;
  sky += uSunCol * (sr4 * sr * 0.2 + sr4 * sr4 * sr4 * sr4 * sr4 * sr4 * mix(0.5, 0.3, low)) * (0.25 + 0.75 * lowSun) * (1. - mix(0.7, 0.95, low) * onFace) * upR;      // the bright sky round a low sun (or the moon) lies on the water
  sky += uSunCol * 0.25 * low * calm * (0.55 + 0.9 * smoothstep(0.3, 0.7, n3.r)) * (1. - 0.5 * paw) * mix(0.6 + 0.8 * t2.a, 1., smoothstep(15., 40., dist));                    // and a low sun leaves a warm sheen on the whole calm river
  // (close to the eye the mirror and the glitter are sparks, not a sheet: a patch of glare under the bow blooms into one white blob)
  float nearG = mix(0.22, 1., smoothstep(5., 42., dist)), moonK = uDim * (1. - low);
  vec3 spec = uSunCol * (pow(sr, 380.) * 9. * nearG * mix(1., 0.7, moonK) * (1. - 0.92 * onFace) + pow(sr, 28.) * 0.3 * (1. - 0.8 * low * onFace)) * upR;
  // the wall's own image lies on the calm water in front of it (for an eye that is still ahead of the toe): the dark glass
  // of the face and a broken white line under the lip, cut up by the cat's paws. hImg is the height on the wall that is mirrored here
  float dCe = uCamL.x - wallX(uCamL.z), sCe = uCamL.z - zFront(dCe);
  float rW = max(-s - 1.5, 0.), dEye = s - sCe;
  float hImg = max(uCamL.y, 0.5) * rW / max(dEye, 0.5) + (N.z / max(N.y, 0.3)) * rW * 1.6;
  float inImg = (1. - smoothstep(4.8, 5.6, hImg)) * step(0.5, dEye) * (1. - smoothstep(${GL(-LF - 1.4)}, ${GL(-LF - 0.2)}, s)) * (1. - smoothstep(60., 130., rW)) * (1. - 0.45 * paw) * (0.75 + 0.25 * smoothstep(0.3, 0.7, n3.r));
  inImg *= smoothstep(8., 22., -sCe - 1.5);      // (only for an eye that still waits well ahead of the toe: an eye that runs along the foot of the wall is too near and too low to see the lip's image as more than one ruled line)
  float imgLip = smoothstep(3.6, 4.4, hImg + (t2.a - 0.5) * 1.5);
  float ndlF = max(0.78 * uSunDir.y - 0.62 * uSunDir.z, 0.);
  vec3 imgCol = mix(mix(uDeep, uSilt, uTurbid * 0.22) * 0.6 * (uSkyAmb * 2.4 + uSunCol * (0.4 + 0.5 * ndlF)), uFoam * (uSkyAmb * 2.2 + uSunCol * (0.35 + 0.5 * ndlF)), imgLip);
  sky = mix(sky, imgCol, inImg); spec *= 1. - inImg;
  // the sun's road: a column of glitter under the light, all the way out to the bore
  vec2 hv = -V.xz; float hl = max(length(hv), 1e-3), sl = max(length(uSunDir.xz), 1e-3);
  float road = pow(max(dot(hv, uSunDir.xz) / (hl * sl), 0.), 48.) * smoothstep(0.02, 0.3, uSunDir.y);
  // (the lookups are turned off the river's axes by two different angles and bent by the low swell, so no row of glints
  // can be followed; far away two coarser layers take over, and slicks break the road into patches)
  vec2 q1 = vec2(0.80 * xz.x - 0.60 * xz.y, 0.60 * xz.x + 0.80 * xz.y), q2 = vec2(0.53 * xz.x + 0.85 * xz.y, -0.85 * xz.x + 0.53 * xz.y);
  vec2 wq = g3 * 9. + g1 * 2.2;
  float tw = texture2D(uNoise, (q1 + wq) * 0.37 + uTime * vec2(0.05, -0.21)).a, tw2 = texture2D(uNoise, (q2 - wq.yx) * 0.83 - uTime * vec2(0.13, 0.07)).r;
  float twF = texture2D(uNoise, (q2 + wq * 2.) * 0.113 + uTime * vec2(0.031, -0.09)).a, tw2F = texture2D(uNoise, (q1 - wq.yx * 2.) * 0.27 - uTime * vec2(0.06, 0.04)).r;
  float farK = smoothstep(40., 320., dist), farK2 = smoothstep(25., 150., dist);
  float glitN = smoothstep(0.6, 0.8, tw) * smoothstep(0.5, 0.7, tw2);
  float glitF = smoothstep(mix(0.56, 0.46, farK), mix(0.72, 0.6, farK), twF) * smoothstep(mix(0.48, 0.4, farK), 0.68, tw2F);
  float patchy = mix(0.3, 1.3, smoothstep(0.3, 0.7, n3.r * 0.55 + paw * 0.45)) * mix(1., 0.55 + 0.9 * t2.a, 1. - farK2);
  float glit = mix(glitN, glitF * 1.4, farK2) * patchy;
  spec += uSunCol * road * glit * mix(5.5, 2.6, farK) * nearG * mix(1., 0.72, moonK) * (1. - mix(0.7, 0.95, low) * onFace) * (1. - inImg);
  // body: jade, milkier and siltier behind the bore; the face is deep glass, lit through near the top
  vec3 water = mix(uDeep, uSilt, clamp(uTurbid * (0.22 + 0.6 * behind), 0., 1.)) * (0.82 + 0.36 * n3.r) * (1. + 0.1 * swl * calm) * mix(1., mix(1.25, 0.75, paw), calm);
  vec3 jadeT = uJade * mix(vec3(1.), vec3(0.62, 1.28, 0.86), moonK);                              // under the moon the wave is lit through green, not blue
  water = mix(water, uDeep * 0.46 * mix(vec3(1.), vec3(0.7, 1.2, 0.92), moonK), onFace * (1. - smoothstep(0.45, 0.95, ft)) * 0.88);
  float trg = cF + 1.1 + min(lb.x, 3.); water *= 1. - (0.4 + 0.25 * uPlume * exp(-max(d - 2.5, 0.) / 14.)) * exp(-trg * trg / 10.) * (1. - behind);            // the drawn-down trough ahead of the toe is darker
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 body = water * (uSkyAmb * 2.4 + uSunCol * (0.42 + 0.5 * ndl));
  // where the light falls on the face, the pitching lip shades the glass just under it
  body *= 1. - 0.3 * onFace * smoothstep(0.45, 0.72, ft) * (1. - smoothstep(0.84, 0.97, ft)) * smoothstep(0.05, 0.4, ndlF + 0.25 * low);
  // the lip overhangs (vI.w: how far it is thrown ahead here): the glass under it is in its shadow, and right under the white
  // edge, where the curl is thin, the light comes through it
  float ov = smoothstep(0.5, 2.2, vI.w) * onFace;
  body *= 1. - 0.32 * ov * smoothstep(0.34, 0.5, ft) * (1. - smoothstep(0.58, 0.72, ft));
  float crest = s < 2. ? smoothstep(2., 4.6, hp) : smoothstep(0.25, 1., (h - 2.5) / 1.5);
  crest *= 1. - 0.75 * uPlume * exp(-max(d - 2.5, 0.) / 7.) * smoothstep(1., 4., s);      // (the mound the seawall throws up is deep water, not a thin lit crest)
  float back = max(dot(-V, uSunDir), 0.), thru = smoothstep(0.4, 1., ft) * onFace, back2 = back * back * (1. - 0.45 * back * back);     // (looking straight into the light along the face it must not white out)
  body += jadeT * uSunCol * (crest * (0.22 + 0.78 * (1. - nv) * (1. - nv)) * 0.8 + thru * (0.14 + mix(1.6, 0.7, low) * back2 * mix(0.35, 1., smoothstep(mix(0.6, 0.7, low), mix(0.95, 0.97, low), ft))));
  // The face has a body whatever the angle of the light: dark glass at its foot, and toward the lip, where the wave is thin, the
  // light comes through it (milky jade under the white). Not under a low sun, where the glass glows only under the lip.
  body *= 1. - mix(0.22, 0.5, moonK) * onFace * (1. - smoothstep(0.26, 0.7, ft));      // (the foot of the face is deep, dark water, so the wall has a body from toe to lip)
  float thin = smoothstep(mix(0.3, 0.46, moonK), 0.98, ft) * onFace * (1. - low); thin *= thin;
  body += jadeT * (uSkyAmb * mix(1.5, 2.7, moonK) + uSunCol * mix(0.26, 0.5, moonK)) * thin;
  body += jadeT * (uSkyAmb * 2.2 + uSunCol * mix(0.3, 0.45, moonK)) * ov * smoothstep(0.6, 0.8, ft) * mix(0.6, 0.3, low);
  // and it is wet: the hollow of the face throws the moon (or the sun) back as a broken band of light that runs along the wave
  vec2 rp = (g1 + g2 * 0.8) * 0.55;
  vec3 Rf = reflect(-V, normalize(vN + vec3(rp.x, 0., rp.y)));
  float sf = max(dot(Rf, uSunDir), 0.), sf2 = sf * sf, sf8 = sf2 * sf2 * sf2 * sf2, sf32 = sf8 * sf8 * sf8 * sf8;
  vec3 faceSheen = uSunCol * onFace * (1. - low) * (sf8 * sf8 * 0.3 + sf32 * sf32 * (0.5 + 1.6 * smoothstep(0.45, 0.7, t2.a))) * smoothstep(3., 12., dist) * mix(0.5, 1., uDim);
  vec3 col = mix(body, sky, fres * uRefl * (1. - mix(0.6, 0.9, low) * onFace) * (1. - ov * smoothstep(0.5, 0.68, ft))) + faceSheen;  // the face is glass to look into, not a mirror (least of all against a low sun)
  // lamp light on the wet face: every lamp on the calm water ahead of the wall (junk cabins, lamps set adrift) lies on the dark
  // glass as a broken upright streak, between the lamp and the eye
  float lampA = 0., lampGl = 0.;
  for (int i = 0; i < 8; i++) {
    vec4 Lq = uLampR[i];
    vec2 dL = xz - Lq.xy; lampGl += Lq.z / (1. + dot(dL, dL) * 0.06);      // the same lamps light the white water round them
    float ahead = xz.y - Lq.y, camA = max(xz.y - uCamL.z, 1.);
    float xr = Lq.x + (uCamL.x - Lq.x) * clamp(ahead / max(ahead + camA, 1.), 0., 0.6);
    float wd = 0.5 + 0.025 * max(ahead, 0.);
    float dxl = xz.x - xr + (g1.x + g2.x * 0.7) * (0.5 + 0.045 * max(ahead, 0.));
    lampA += Lq.z * exp(-dxl * dxl / (wd * wd)) * smoothstep(-4., 2., ahead) * (1. - smoothstep(18., 52., ahead));
  }
  // (flecks, not a wash: the streak is cut up by the ripples, and close to the eye, where a streak a stride wide would fill the frame, it is only sparks)
  float dash = texture2D(uNoise, vec2(xz.x * 0.36 + 0.4, s * 1.1 - uTime * 0.7)).a;      // (short bars across the streak, as on the calm water)
  float lampG = (0.22 + 1.1 * smoothstep(0.46, 0.6, dash + 0.1 * (tw2 - 0.5))) * mix(0.06, 1., smoothstep(7., 17., dist));
  col += uLampC * min(lampA, 1.) * lampG * onFace * smoothstep(0.02, 0.2, ft) * (1. - 0.8 * smoothstep(0.45, 0.9, ft));
  // foam. On the face: a white roll at the lip, claws of foam that hang from it to unequal depths and come apart into strands
  // at their tips, and under those a net of thin veins on the glass. Nothing is drawn out into ribs, and every edge is cut from
  // the noise at a level, so it stays an edge however close the eye comes.
  float l1 = texture2D(uNoise, xz * vec2(0.05, 0.02)).a, l2 = texture2D(uNoise, xz * vec2(0.2, 0.075) + uTime * vec2(0.004, 0.012)).a;      // drawn out along the flow
  float l3 = texture2D(uNoise, xz * vec2(1.7, 0.9) + uTime * vec2(0.02, 0.06)).a;                 // a fine layer that only shows close by
  float nearC = smoothstep(6., 30., dist), nearE = 1. - smoothstep(3., 14., dist);
  float lace = l1 * 0.6 + l2 * 0.4; lace = mix(lace, lace * 0.72 + l3 * 0.28, nearE);
  float fr = texture2D(uNoise, vec2(xz.x * 0.09, s * 0.11 + uTime * 0.55)).a;
  // along the front nothing repeats: the lookups slide on a slow warp, and broad claws, thin ones and clean glass take turns
  float wv = texture2D(uNoise, vec2(xz.x * 0.0173 + 0.11, 0.37)).r, wv2 = texture2D(uNoise, vec2(xz.x * 0.0057 + 0.5, 0.81)).a;
  float xw = xz.x + 7. * (wv - 0.5) + 18. * (wv2 - 0.5);
  float fsA = texture2D(uNoise, vec2(xw * 0.34, s * 0.085 + uTime * 0.75)).a;
  float fs = fsA * 0.2 + texture2D(uNoise, vec2(xw * 0.113 + 0.4, s * 0.06 + uTime * 0.5)).a * 0.62 + texture2D(uNoise, vec2(xw * 0.9, s * 0.2 + uTime * 1.3)).r * 0.18;
  float sec = texture2D(uNoise, vec2(xz.x * 0.031 + 0.3, uTime * 0.012)).r;                      // some stretches of the face run clean, some heavy
  float fine = texture2D(uNoise, vec2(xw * 1.3, s * 0.85 + uTime * 1.6)).a;                         // a fine grain (as wide as it is long: drawn out, it striped the foam like a curtain)
  float dayK = 1. - uDim;
  // the foam leans as it falls (one way here, the other way there) and wanders
  float xs = xw + (1. - ft) * 9. * (wv2 - 0.5) + 0.6 * (l2 - 0.5) + 0.14 * (fine - 0.5);
  float fA = texture2D(uNoise, vec2(xs * 0.047, uTime * 0.008 + 0.13)).a, fB = texture2D(uNoise, vec2(xs * 0.19 + 0.4, uTime * 0.011 + 0.57)).r;
  float fC = texture2D(uNoise, vec2(xs * 0.61 + 0.2, s * 0.05 + uTime * 0.3)).a;
  float claw = mix(fA, fB, 0.25 + 0.5 * smoothstep(0.4, 0.6, wv));
  // how far below the roll the foam hangs, as a share of the face: mostly a scalloped fringe, here and there a long tongue
  // (pointed: the depth follows the peaks of the field with no level at which it rests, so no patch of the fringe has a
  // flat bottom; under a low sun the far face keeps to two tones, dark glass and a cream roll)
  float pk = clamp((claw + 0.4 * min(sec - 0.5, 0.1) - 0.36) / 0.46, 0., 1.); pk = pk * pk * (0.35 + 0.65 * pk);
  float hang = (0.025 + 0.5 * pk + 0.07 * smoothstep(0.5, 0.75, fC) * smoothstep(0.05, 0.3, pk)) * mix(1., 0.35, smoothstep(50., 110., dist) * low);
  float roll = 0.87 - 0.1 * (fr - 0.5) - 0.07 * ov, soft = mix(0.025, 0.07, nearC);
  float tip = clamp((ft - (roll - hang)) / max(hang, 0.04), 0., 1.);                              // 0 at a claw's tip, 1 where it leaves the roll
  float holes = texture2D(uNoise, vec2(xs * 0.33, s * 0.21 + uTime * 0.7)).r;                     // its edge is scalloped, and a long tongue is torn open toward its tip
  float cap = smoothstep(roll - 0.6 * soft, roll + 0.6 * soft, ft);
  float fing = smoothstep(-soft, soft, ft - (roll - hang) + mix(0.16, 0.09, nearC) * (holes - 0.5)) * mix(1., smoothstep(0.34, 0.48, holes + 0.6 * (tip - 0.25)), smoothstep(0.12, 0.26, hang));
  fing *= mix(0.5, 1., smoothstep(0.02, 0.55, tip));      // (a finger thins to a wash at its tip)
  // and the face carries rafts of foam that follow its slope: thick under the lip, a few as far down as the foot, each torn
  // open into lace (twice as long as wide: nothing is drawn out into a smear)
  float pfA = texture2D(uNoise, vec2(xs * 0.23, s * 0.12 + uTime * 0.5)).r, pfB = texture2D(uNoise, vec2(xs * 0.62 + 0.3, s * 0.31 + uTime * 0.9)).a;
  float pf = pfA * 0.6 + pfB * 0.4 + 0.1 * (fine - 0.5), thrP = mix(0.71, 0.53, smoothstep(0.2, 0.9, ft)) - 0.12 * (sec - 0.5);
  float raft = smoothstep(thrP, thrP + mix(0.025, 0.055, nearC), pf) * onFace * smoothstep(0.06, 0.22, ft) * mix(1., smoothstep(0.3, 0.46, holes), 0.7) * (1. - smoothstep(70., 150., dist));
  // veins: the level lines of a slow field (two levels, both off its mean: far away, where the field blurs to its mean, none show)
  float vn = texture2D(uNoise, vec2(xs * 0.17, s * 0.12 + uTime * 0.55)).a + 0.1 * (fine - 0.5);
  float vd = min(abs(vn - 0.62), abs(vn - 0.37)), vw = mix(0.014, 0.028, nearC) * (1. + 0.5 * smoothstep(0.4, 0.85, ft));      // (a little thicker toward the roll, where they run together)
  float vein = (1. - smoothstep(vw, vw * 2.4, vd)) * smoothstep(0.1, 0.7, ft + 0.9 * (sec - 0.5) + 0.4 * (wv - 0.5)) * (1. - smoothstep(55., 120., dist)) * onFace;
  // (the glass itself is never one flat expanse: faint bands run along the wave, as its curve does, and fine ripples take the light close by)
  float band = texture2D(uNoise, vec2(xw * 0.14, s * 0.36 - uTime * 0.21)).r;
  col *= mix(1., 0.91 + 0.18 * band, onFace);
  // close to the eye the glass has a skin: wind ripples in fine bands along the wave, strings of bubbles drawn up the face and
  // a second, finer net of veins (so within a few boat lengths the face is never a flat slab of one colour)
  float nearSk = onFace * (1. - smoothstep(10., 40., dist));
  // (none of these fields is drawn out more than three to one: a lookup drawn out further falls to a coarse level of the
  // texture where the face is seen along its length, and each texel becomes a bar)
  float rip = texture2D(uNoise, vec2(xw * 0.17 + 0.6, s * 0.46 - uTime * 0.2)).a, rip2 = texture2D(uNoise, vec2(xw * 0.52, s * 1.3 - uTime * 0.5)).r;
  col *= mix(1., 0.74 + 0.36 * rip + 0.16 * rip2, nearSk);
  float bub = texture2D(uNoise, vec2(xs * 1.15 + 0.2, s * 0.55 + uTime * 1.0)).a * 0.62 + rip2 * 0.38;
  float vn2 = texture2D(uNoise, vec2(xs * 0.52 + 0.4, s * 0.34 + uTime * 0.8)).r + 0.08 * (rip - 0.5);
  float nearFoam = nearSk * max(smoothstep(0.6, 0.67, bub) * 0.6 * smoothstep(0.08, 0.5, ft), (1. - smoothstep(0.012, 0.032, abs(vn2 - 0.5))) * 0.5 * smoothstep(0.05, 0.4, ft));
  // ahead of the toe: a lick of foam pushed out over the calm water (web: a net of veins for the toe line and the back; of the
  // lick itself only the solid patches seen from afar are left: close by, the lace ahead of the toe is the foot's own net)
  float wn = texture2D(uNoise, xz * vec2(0.31, 0.19) + uTime * vec2(0.01, -0.05)).a + 0.08 * (l3 - 0.5);
  float web = 1. - smoothstep(0.014, 0.04, min(abs(wn - 0.62), abs(wn - 0.38)));
  float toeL = exp(-(s + ${GL(LF - 0.4)}) * (s + ${GL(LF - 0.4)}) * 3.) * smoothstep(0.3, 0.55, fr) * 0.75 * mix(0.15 + 0.85 * web, 1., nearC);      // (close by the toe's foam is a net too, not a smear)
  float lick = smoothstep(${GL(-LF - 7)}, ${GL(-LF)}, s) * (1. - smoothstep(${GL(-LF + 0.2)}, ${GL(-LF + 1.4)}, s));
  float lickP = l2 * 0.55 + fr * 0.45;
  float faceFoam = max(max(max(cap, fing), raft * 0.86), max(vein * 0.6, max(toeL, lick * smoothstep(0.6, 0.67, lickP) * 0.85 * nearC)));      // (close by, the lace ahead of the toe is the foot's own net, below)
  faceFoam = max(faceFoam, nearFoam);
  // THE FOOT. The face does not come down to the river in a ruled line: a roll of white water tumbles at its toe
  // and is pushed out ahead of it in lobes and tongues (footLobe: by the place along the front), ragged at its leading edge,
  // torn into lace toward the tip of a tongue and piled up the first of the face, where it frays into the glass; a dark wet
  // line lies just ahead of it, and a wash of thin lace slides out over the calm water and is drawn back under.
  float ragA = texture2D(uNoise, vec2(xz.x * 0.17 + 0.3, uTime * 0.05 + 0.7)).a, ragB = texture2D(uNoise, vec2(xz.x * 0.61 + 0.2, s * 0.27 + uTime * 0.45)).r;
  float sF = s + 1.4 * footH(s, lb);      // (measured over the heap, not in plan, so nothing on its front slope is drawn out into stripes)
  float tum = texture2D(uNoise, vec2(xz.x * 0.29 + 0.6, sF * 0.36 + uTime * 0.66)).a, tumU = texture2D(uNoise, vec2(xz.x * 0.29 + 0.6, (sF + 0.45) * 0.36 + uTime * 0.66)).a;
  float edgeF = cF + lb.x + 1.7 * (ragA - 0.5) + 1.3 * (ragB - 0.5) + 0.9 * (tum - 0.5);                 // metres behind the white water's leading edge
  vec4 tum2T = texture2D(uNoise, vec2(xz.x * 0.83, sF * 0.95 + uTime * 1.4)); float tum2 = tum2T.r;
  float topF = -0.5 + 3.4 * smoothstep(0.3, 0.74, fA * 0.6 + ragA * 0.4) + 1.3 * (fr - 0.5) + 1.2 * (tum - 0.5);      // how far up the face it is piled: a tongue of it climbs here, the glass comes down to the foot there
  topF = max(topF, mix(-1., 1.2, smoothstep(0.1, 0.3, lb.y)));                       // (wherever it is piled, the whole pile is white)
  float surge = 0.5 + 0.5 * sin(uTime * 1.2 + xz.x * 0.09 + 6.283 * ragA), reachW = 1.3 + 3.8 * surge;
  // WHITE AND WHOLE ONLY ON THE PILE. The roll is whole white water where the river is heaped under it (and up the
  // face as far as it is piled). With metres from the pile (mF: out over the river, or up the face above it) it comes apart
  // fast: within a stride into a net of white veins round holes of dark water (two nets, cells an arm and a hand across, the
  // fine one only hard by the pile), then single threads, then flecks, and at the wash's own reach nothing. Every pixel of it
  // is foam or water: no film lies over the river, and the moon's glitter and the lamps' glints stand in the holes.
  float peF = cF + clamp(lb.x - 1.2, 0.8, 2.8) + 0.5 * (tum - 0.5) + 0.35 * (ragB - 0.5);      // metres behind the pile's front (it is ragged)
  float upF = max(cF - topF, 0.), mF = max(max(-peF, 0.), 1.6 * upF);
  float cutF = max(max(-edgeF, 0.) / reachW, upF / 1.3), flk = tum * 0.5 + tum2 * 0.5 - 0.5;
  // the ropes on the back of the wave: their fields are read here, since the net behind the crest is cut by them
  float boA = texture2D(uNoise, vec2(xz.x * 0.19 + 0.35, s * 0.075 - uTime * 0.3), -1.).a, boB = texture2D(uNoise, vec2(xz.x * 0.53 + 0.1, s * 0.21 - uTime * 0.62), -1.).r;
  vec2 gp = xz - vec2(0., -8.); float gr = length(gp);      // (the way to the water gate's arch and metres from it: the streaks that run in under it converge there)
  // the net's own place: metres along the front and metres out from the foot (over the heap), carried out ahead with the
  // water; behind the crest, metres along the front and metres behind the crest, sliding down the back. Bent a little by
  // the foam's own fields, so no two cells are alike; behind the crest also by the net's own swirls (netWarp; the widest
  // cells by wider swirls), so no vein is straight there.
  vec2 pn = s < -0.2 ? vec2(xz.x + 0.8 * (ragB - 0.5), sF + uTime * 0.3 + 0.9 * (tum - 0.5)) + (tum2T.gb - 0.5) * 0.05
                     : vec2(xz.x + 0.9 * (boB - 0.5), s - uTime * 0.45 + 0.9 * (boA - 0.5));
  bool backN = s >= -0.2; vec2 pnB = pn;
  if (backN) { pnB = pn + 2.2 * netWarp(pn / 2.2 + 5.); pn += netWarp(pn); }
  // The net is cut by the pixel that sees it (netW): pxN is how many metres of the net lie under this pixel; behind the
  // crest a size of cell that is smaller than its pixel is not worked out at all (its mean cover is drawn). (What else this
  // white water reads besides the wave's own geometry and clock is named at the head of FOOT_GLSL.)
  vec2 pnX = dFdx(pn), pnY = dFdy(pn); float pxN = sqrt(abs(pnX.x * pnY.y - pnX.y * pnY.x));
  vec3 pxK = pxN / vec3(1.3, 0.55, 0.2); float netB = 1., netC = 1., netF = 1.;      // three sizes of cell: 1.3 m (behind the crest only), 0.55 m and 0.2 m across
  if (backN) {      // where white water can lie: the whole back of the wave
    if (pxK.x < 1.1) netB = foamCell(pnB / 1.3 + 3.7);
    if (pxK.y < 1.1) netC = foamCell(pn / 0.55);
    if (pxK.z < 1.1) netF = foamCell(pn / 0.2 + 7.3);
  } else if (cF > -(lb.x + reachW + 2.4) && cF < 4.8) { netC = foamNet(pn / 0.55); netF = foamNet(pn / 0.2 + 7.3); }      // and ahead of the crest from the wash's furthest reach to the top of the pile
  float pxB = pxK.x, pxC = pxK.y, pxF = pxK.z;
  float aaB = clamp(fwidth(netB), 0.012, 0.3), aaC = clamp(fwidth(netC), 0.012, 0.3), aaF = clamp(fwidth(netF), 0.012, 0.3);
  float pileF = (1. - smoothstep(0., 0.07, mF)) * smoothstep(0., 0.1, edgeF) * ridGap(d);      // (round a rider in his pocket under the wall there is no pile: lace on dark water, and his hull reads against it)
  float patchN = smoothstep(0.36, 0.64, g1T.a);      // (a field some metres across: the lace lies thick here and thin there, never an even mesh)
  float wC = 0.085 * mix(0.5, 1.4, patchN) + 0.32 * exp(-mF / 0.6) + 0.45 * flk * smoothstep(0.2, 1.4, mF) - 0.26 * cutF - smoothstep(0.85, 1., cutF);
  float wF = 0.5 * exp(-mF / 0.4) - 0.07 - 0.5 * cutF;
  wC = min(wC, mix(1., 0.1, smoothstep(0., 0.5, cutF)));      // (out in the wash only thin threads and flecks: none is wider than a hand)
  wC = min(wC, mix(0.13, 1., ridGap(d))); wF = min(wF, mix(0., 1., ridGap(d)));      // (thin threads only in a rider's pocket)
  float laceF = max(netW(netC, wC, aaC, pxC), netW(netF, wF, aaF, pxF)) * (1. - smoothstep(4.4, 4.8, cF));
  float footF = max(pileF, laceF);
  col *= 1. - 0.32 * smoothstep(-2.6, -0.2, edgeF) * (1. - smoothstep(0., 1.6, edgeF));      // the wet line
  // and thin streaks of foam are drawn up the face with the water, from the roll toward the lip (the level lines of a field
  // three times as long up the face as along it, off its mean: far away, where the field blurs, none show)
  float stv = texture2D(uNoise, vec2(xw * 0.41 + 0.15, s * 0.13 + uTime * 0.85), -1.).a * 0.7 + texture2D(uNoise, vec2(xw * 1.1 + 0.5, s * 0.3 + uTime * 1.5), -1.).r * 0.3;
  float streak = (1. - smoothstep(0.01, 0.028, abs(stv - 0.58))) * onFace * smoothstep(0.15, 0.45, ft) * (1. - smoothstep(0.9, 1., ft));
  faceFoam = max(faceFoam, streak * 0.6);
  // and lines of foam lie along the wave and are lifted up its face (the level lines of a field nine times as long along the
  // front as up it, in stretches): beside the boat, where the face is looked along, they run away down the wave
  float hlF = texture2D(uNoise, vec2(xw * 0.045 + 0.7, s * 0.2 + uTime * 0.33)).a + 0.05 * (fine - 0.5);
  float hline = (1. - smoothstep(0.011, 0.028, min(abs(hlF - 0.61), abs(hlF - 0.41)))) * onFace * smoothstep(0.12, 0.3, ft) * (1. - smoothstep(0.8, 0.94, ft)) * smoothstep(0.35, 0.6, wv2 * 0.5 + sec * 0.5 + 0.1);
  faceFoam = max(faceFoam, hline * 0.72);
  col *= mix(1., 0.84 + 0.3 * smoothstep(0.43, 0.55, stv), onFace);      // (and the glass between them is marbled, lighter and darker, with the same motion: no smooth sheet of one tone beside the boat)
  // (and close to the eye the foam on the face is lace: crisp holes of glass eaten into it)
  faceFoam = mix(faceFoam, faceFoam * (0.2 + 0.8 * smoothstep(0.4, 0.5, bub * 0.6 + rip * 0.4 + 0.5 * (faceFoam - 0.55))), nearSk * 0.9);
  faceFoam = max(faceFoam, onFace * smoothstep(0.2, 0.55, ft) * smoothstep(110., 300., dist) * 0.9);      // (far away the whole upper face is the white thread)
  faceFoam *= mix(0.62 + 0.38 * smoothstep(0.35, 0.6, fine), 1., nearC);
  faceFoam = max(faceFoam, footF);      // (the foot's white water is cut by its own net alone and takes none of the face's close-up grain)
  // behind the crest: how much foam lies where (the most in the first six metres, then less, caps on the swells, churn at
  // the wall); the net of the back is cut by it, below
  float env = exp(-sb / 150.) * (1. - smoothstep(${GL(5.2 * LAM)}, ${GL(6.0 * LAM)}, sb));
  float dw = max(d - 2.5, 0.);
  float cv = 1. * exp(-sb / 2.6) + 0.35 * exp(-sb / 30.) + 0.2 * exp(-sb / 380.) + 0.4 * pow(max(cos(sb * ${GL(2 * Math.PI / LAM)}), 0.), 8.) * env
    + uPlume * (0.4 * exp(-dw / 14.) * exp(-sb / 380.) + 0.7 * exp(-dw / 6.) * exp(-(s - 4.) * (s - 4.) / 500.));
  float lk = smoothstep(3., 16., sb);
  // Beside and ahead of the boat the foam behind the crest is rafts and patches with jade between them, cut from layers that
  // are as wide as they are long (drawn-out layers, looked along from a few metres up, run together into parallel streaks).
  vec4 gfT = texture2D(uNoise, xz * 0.21 + vec2(0., uTime * 0.02));
  float nearB = (1. - smoothstep(14., 62., dist)) * smoothstep(-0.5, 0.5, s);
  float laceN = 0.5 + ((g1T.a - 0.5) * 0.36 + (t2.r - 0.5) * 0.3 + (gfT.r - 0.5) * 0.2 + (l3 - 0.5) * 0.14) * 1.55;
  lace = mix(lace, laceN, nearB);
  float th = max(1. - cv * 1.1, mix(0.42, 0.5, nearB) * smoothstep(mix(1.5, 0.4, nearB), mix(5., 2.6, nearB), sb));      // past the crest there is always jade between the foam
  float backFoam = smoothstep(th, th + mix(0.3, 0.13, lk) * mix(0.45, 1., nearC), lace);      // (a sharper edge near the eye)
  backFoam = max(backFoam, web * 0.66 * smoothstep(th - 0.3, th - 0.02, lace) * lk);          // the lace is a net: veins of foam run on from every patch
  // behind the crest the water is broken: ropes and rafts of thick white water are left by the lip and slide down the
  // back of the wave, close together at the crest and torn apart further back, with deep jade channels between them (by
  // metres on the wave, the whole front long)
  float boU = texture2D(uNoise, vec2(xz.x * 0.19 + 0.35, (s + 0.7) * 0.075 - uTime * 0.3), -1.).a;
  float bo = boA * 0.64 + boB * 0.36, boThr = mix(0.4, 0.62, smoothstep(0.5, 13., sb));
  float boZone = smoothstep(-0.2, 0.7, s) * (1. - smoothstep(9., 21., sb));
  // the rafts are cut from the net: thick-veined cells where a raft lies, threads between the rafts, jade in every hole
  float wBc = (0.07 + 0.5 * smoothstep(boThr - 0.1, boThr + 0.05, bo)) * boZone - 0.02, wBf = 0.55 * smoothstep(boThr - 0.02, boThr + 0.1, bo) * boZone - 0.06;
  float boil = max(netW(netC, wBc, aaC, pxC), netW(netF, wBf, aaF, pxF));
  backFoam = max(backFoam, boil);
  col = mix(col, col * vec3(0.5, 0.76, 0.76), boZone * 0.45 * (1. - boil));
  float foam = mix(faceFoam, backFoam, smoothstep(-0.3, 0.3, s));
  // the rare crossing tide: a clean jade front, a white crest, a short back of lace
  float s2 = s + crossS(d), win = (d - uCrossD) / (d > uCrossD ? 130. : 45.);
  float rk = uRare * smoothstep(-25., 5., uCrossD) * exp(-win * win);
  // (far away its crest is drawn wider than it is, like the bore's own thread: a second white line that runs at an angle to the
  // first and closes on it)
  float farR = smoothstep(60., 300., dist), rkC = smoothstep(0.04, 0.3, rk);
  foam = max(foam, rkC * max(exp(-s2 * s2 / mix(2.4, 16., farR)) * mix(0.72 + 0.28 * smoothstep(0.3, 0.5, fr), 1., farR), smoothstep(-1., 0.3, s2) * exp(-max(s2, 0.) / 2.4) * smoothstep(0.3, 0.6, lace + 0.2)));      // (its back is clean jade: seen from behind it is a smooth swell with a white mane)
  foam = max(foam, rkC * smoothstep(-3., -0.6, s2) * (1. - smoothstep(-0.2, 0.4, s2)) * smoothstep(0.46, 0.6, fs + 0.1 + 0.12 * (s2 + 1.5)) * 0.9 * (1. - behind));      // fingers down its front
  col = mix(col, col * 0.62, rkC * exp(-(s2 + 3.2) * (s2 + 3.2) / 3.) * (1. - behind) * (1. - farR));                                 // dark glass at its foot
  foam = max(foam, rkC * farR * smoothstep(-4.5, -2., s2) * (1. - smoothstep(0., 4., s2)) * (1. - behind));                          // far off its whole front is white, like the thread
  col += uJade * uSunCol * rk * exp(-(s2 + 1.4) * (s2 + 1.4) / 2.) * 0.42 * (1. - behind);
  foam = max(foam, (1. - smoothstep(3.3, 4.4 + 1.8 * l2, d)) * smoothstep(0.3, 0.55, l2 + 0.18 * sin(uTime * 1.3 + xz.y * 0.45)) * 0.8);   // lapping at the wall foot
  // at the gate the water runs in: streaks that converge on the arch
  float gk = 1. - smoothstep(-10., 85., uBoreZ);
  float ga = atan(gp.x, abs(gp.y) + 1e-3);
  ga += 0.22 * (l2 - 0.5) + 0.12 * sin(gr * 0.13 - uTime * 0.6);      // (the streaks bend and wander: they are not straight spokes)
  float gs = texture2D(uNoise, vec2(ga * 5., gr * 0.07 + uTime * 0.55)).a * 0.52 + texture2D(uNoise, vec2(ga * 12. + 0.3, gr * 0.09 + uTime * 0.8)).a * 0.38 + texture2D(uNoise, vec2(ga * 27. + 0.7, gr * 0.16 + uTime * 1.2)).r * 0.1;
  float gz = gk * (1. - smoothstep(30., 95., gr)) * smoothstep(0.34, 0.6, mix(l1, g1T.a, nearB) + 0.3 * l3);      // (and they are torn into patches with jade between)
  float gh = texture2D(uNoise, vec2(ga * 23. + 0.2, gr * 0.3 + uTime * 1.9)).a;                                                    // fine threads that race in
  foam = max(foam * (1. - 0.8 * gz * smoothstep(4., 10., sb)), gz * smoothstep(0.47, 0.56, gs * 0.6 + l2 * 0.2 + gh * 0.2) * mix(0.9, 0.78, dayK));      // (by day jade channels run between the streaks)
  // where the bore runs up the wall the water is white: churned foam over the whole mound, torn at its edges
  // (white from the crest back, and along the foot of the stone; a few metres off the wall the wave keeps its dark foot, its glass
  // face with claws of foam and its lip, so the end of the wave is not one pale mound)
  float runK = uPlume * exp(-dw / 6.) * mix(smoothstep(-2.2, 0.6, s), smoothstep(-19., -6., s), 1. - smoothstep(1.5, 4.5, d)) * (1. - smoothstep(4., 26., s));
  vec4 cgT = texture2D(uNoise, vec2(xz.x * 0.07 + uTime * 0.04, xz.y * 0.07 - uTime * 0.085));      // (the heaps the vertex shader throws up there: jade shows in the troughs between them, and they are lit by their own slope)
  foam = max(foam, smoothstep(0.34, 0.62, runK * 1.15 + (t2.r * 0.45 + gfT.r * 0.35 + l3 * 0.2 - 0.5) * 0.9));
  foam *= 1. - 0.35 * smoothstep(0.15, 0.5, runK) * (1. - smoothstep(0.26, 0.5, cgT.r + 0.3 * (l3 - 0.5)));
  // Seen from the crest, the heap against the stone is a torrent, not a pale bank: the water thrown up the wall pours back off
  // it in white ropes that run down its flank, away from the masonry, with dark jade between them, and a white seam boils where
  // it meets the stone
  float heapK = uPlume * exp(-dw / 5.5) * smoothstep(0.5, 3.5, s) * (1. - smoothstep(12., 30., s));
  // (read a level finer than the texture would choose and cut with a narrow edge, so each rope keeps its edge along its length)
  float cs1 = texture2D(uNoise, vec2(xz.y * 0.24 + 0.4 * (l2 - 0.5), d * 0.08 - uTime * 0.5), -1.2).a, cs2 = texture2D(uNoise, vec2(xz.y * 0.6 + 0.3, d * 0.2 - uTime * 0.8), -1.2).r;
  float casc = smoothstep(0.48, 0.53, cs1 * 0.66 + cs2 * 0.34 + 0.1 * (l3 - 0.5));
  float seam = 1. - smoothstep(0.5, 2.2 + 1.2 * l2, d);
  foam = mix(foam, max(foam * casc, seam * 0.95), heapK * 0.9);
  col = mix(col, col * vec3(0.34, 0.6, 0.58), heapK * 0.85);
  // THE SHOULDER AGAINST THE STONE. Where the wave ends at the seawall it comes apart: the mound the wall throws up
  // collapses outward, and white water pours off it in ropes that run down its flank and its back (crisp ropes with deep
  // green between them, by metres along the wall and off it; the mound itself is deep water, not a lit pale bank)
  float shK = uPlume * exp(-dw / 7.) * smoothstep(-0.5, 2.5, s) * (1. - smoothstep(14., 32., s));
  float rp1 = texture2D(uNoise, vec2(xz.y * 0.2 + 0.25 * (boB - 0.5), d * 0.065 - uTime * 0.42), -1.2).a, rp2 = texture2D(uNoise, vec2(xz.y * 0.57 + 0.6, d * 0.19 - uTime * 0.7), -1.2).r;
  float rope = smoothstep(0.5, 0.535, rp1 * 0.62 + rp2 * 0.38 + 0.12 * (shK - 0.5)) * smoothstep(0.08, 0.3, shK);
  foam = max(foam, rope * 0.96);
  col = mix(col, col * vec3(0.42, 0.68, 0.66), smoothstep(0.08, 0.4, shK) * 0.6);
  // lines of foam drift on the calm river ahead of the bore, near the eye (the tide's own scum lines)
  float fl1 = texture2D(uNoise, xz * vec2(0.17, 0.06) + vec2(0.3, uTime * 0.004)).a, fl2 = texture2D(uNoise, xz * vec2(0.6, 0.11) + vec2(0., uTime * 0.01)).r;
  float lineF = (1. - smoothstep(0.012, 0.036, abs(fl1 * 0.7 + fl2 * 0.3 - 0.56))) * smoothstep(0.42, 0.6, n3.r * 0.5 + paw * 0.5) * calm * (1. - smoothstep(60., 170., dist)) * smoothstep(3., 9., dist);
  foam = max(foam, lineF * 0.4);
  foam = clamp(foam, 0., 1.);
  // close to the eye the foam behind the crest has a grain of its own: holes of jade a hand to a stride across with crisp
  // edges (the coarse layers alone have no edge at a boat length), and it is lit and shaded by its own slope
  vec4 fnT = texture2D(uNoise, xz * 0.61 + vec2(0.37, 0.11) + uTime * vec2(0.01, -0.03));
  float nearP = (1. - smoothstep(9., 28., dist)) * smoothstep(0.3, 2.5, s);
  float runM = smoothstep(0.15, 0.5, runK), runH = 1. - smoothstep(0.37, 0.45, fnT.a * 0.55 + t2.r * 0.45 + 0.25 * (cgT.r - 0.5));
  foam *= 1. - 0.62 * runM * runH * (1. - nearP);
  col = mix(col, col * vec3(0.5, 0.74, 0.72), runM * 0.7 * (1. - nearP));
  foam *= mix(1., smoothstep(0.4, 0.46, fnT.a * 0.62 + l3 * 0.38 + 0.1 * (foam - 0.5)), nearP * 0.9);
  col = mix(col, col * vec3(0.5, 0.74, 0.72), nearP * 0.75);      // (and the water in the holes is deep, so the white stands against it)
  // foam has relief: lit and shaded by the slope of the lace toward the sun, cool in its hollows, sparkling on top
  vec2 gf = gfT.gb - 0.5;
  float l2s = texture2D(uNoise, (xz + uSunDir.xz * 0.5) * vec2(0.2, 0.075) + uTime * vec2(0.004, 0.012)).a;
  float facing = smoothstep(-0.35, 0.45, dot(normalize(vN), uSunDir));
  // (under a low sun or the moon the relief keeps its strength on slopes that face away: back-lit foam is all sparkle and shadow)
  float rel = ((l2 - l2s) * 3.4 * (1. - 0.8 * nearB) - (gf.x * uSunDir.x + gf.y * uSunDir.z) * (1.3 + 1.2 * nearB)) * smoothstep(2.5, 12., dist) + (l3 - 0.5) * 0.9 * nearE - ((fnT.g - 0.5) * uSunDir.x + (fnT.b - 0.5) * uSunDir.z) * 2.2 * nearP - ((cgT.g - 0.5) * uSunDir.x + (cgT.b - 0.5) * uSunDir.z) * 3.2 * runK - ((fnT.g - 0.5) * uSunDir.x + (fnT.b - 0.5) * uSunDir.z) * 1.8 * runM * (1. - nearP), fk = 0.25 + 0.75 * facing;      // (close by the relief comes from the fine layer: the coarse ones would show their texels)
  float fl = clamp(0.55 * fk + rel * mix(fk, 1.5, lowSun) * (1. - 0.5 * low * onFace), 0., 1.);
  // (on the face the relief is the foam's own billows, lit from above: the flat-water lookups are drawn out along the river and
  // would stripe the roll like a pleated curtain)
  float relF = (texture2D(uNoise, vec2(xw * 0.23, (s + 0.35) * 0.33 + uTime * 0.7)).a - texture2D(uNoise, vec2(xw * 0.23, s * 0.33 + uTime * 0.7)).a) * 4.5;
  float lipM = smoothstep(0.4, 1.6, vI.w), lipU = lipM * (1. - smoothstep(-0.45, 0.05, s));      // on the thrown sheet of the lip; on its underside
  fl = mix(fl, clamp(0.55 * fk + relF * mix(fk, 1.5, lowSun) * (1. - 0.5 * low), 0., 1.), max(onFace, lipM));
  // (on the overhanging lip the face's own coordinate is drawn out, and the relief cut from it would be upright blocks: it is eased there)
  // (and on the thrown sheet the flat-water lookups are magnified many times over, to patches with the edges of texels: eased there too)
  fl = mix(fl, 0.74 + 0.26 * fl, max(max(ov, lipM), 0.5 * onFace * moonK));
  // The white water that is cut from the net takes none of this relief (the foot's, and all that lies behind the crest): the
  // lookups are drawn out along the river and coarse, and they shade a net of thin veins in soft grey patches metres long.
  // The lace is evenly lit, as white in a thread as in a raft or on the pile, and counts as piled foam; the pile has its
  // own billows (below).
  float footS = footF * (1. - smoothstep(-0.3, 0.3, s)), backS = smoothstep(-0.2, 0.3, s);
  fl = mix(fl, 0.82, max(footS, backS));
  float thick = max(mix(smoothstep(th, th + 0.75, lace), 0.8, onFace), max(max(footS, backS), rope));       // (on the face thin lace is greyer; piled foam and the lace of the net are white)
  float flr = mix(0.74, fl, mix(0.3, mix(0.8, 0.6, uDim), gz) + mix(0.7, mix(0.2, 0.4, uDim), gz) * thick);            // only piled foam has relief; lace is evenly lit (at the gate it is all piled)
  vec3 foamLit = uFoam * mix(mix(vec3(1.), mix(uJade, uSkyAmb * 3.2, 0.5), 0.5), vec3(1.), flr) * mix(0.62, 1., flr) * (uSkyAmb * 2.4 + uSunCol * (0.22 + 0.78 * flr)) * (0.75 + 0.25 * thick);
  // By day the wall comes with the sun behind it and its foam is lit by the sky alone: it is given its form here. The roll of
  // the lip is shaded (dark under the overhang, bright along the top), the foam falls in billows (lit from above, blue in their
  // hollows), and close to the eye the streaks stay streaks
  float dayF = dayK * onFace;
  float bil = clamp(0.5 + relF * 1.3, 0., 1.);
  foamLit *= mix(1., mix(0.7, 1.08, smoothstep(0.6, 1., ft)) * (0.78 + 0.4 * bil) * mix(0.84 + 0.3 * holes, 1., nearC), dayF);
  foamLit = mix(foamLit, foamLit * vec3(0.7, 0.8, 1.) + uJade * uSkyAmb * 0.5, dayF * (1. - bil) * 0.55 * (1. - smoothstep(0.85, 1., ft)));
  foamLit *= mix(1., 0.8 + 0.28 * smoothstep(0.86, 0.975, ft), ov * uDim);      // (under the moon and a low sun too the roll is round: shaded under the overhang, bright along its edge)
  // the thrown lip has a lit top and a belly in its own shade, and where the sheet is thin the light comes through it green
  foamLit *= 1. - 0.3 * lipU * dayK;
  foamLit = mix(foamLit, jadeT * (uSkyAmb * 3. + uSunCol * mix(0.55, 0.9, moonK)), lipU * mix(0.28, 0.42, moonK) * (1. - low));
  foamLit += uJade * uSunCol * thru * (0.25 + 0.9 * back2) * 0.5 * mix(1., 0.4, low);  // sun through the lip
  foamLit += uFoam * uSunCol * thru * (0.12 + back2) * 0.8 * mix(1., 0.4, low);                 // and the lip itself rim-lit
  // (under a low sun the piled foam is cream, not grey: it takes a little of the sun's colour and its shaded side is lifted)
  foamLit = mix(foamLit, mix(foamLit, uFoam * uSunCol * 0.5, 0.2) + uFoam * (uSkyAmb * 2.4 + uSunCol * 0.22) * 0.15 * (1. - flr), low * (1. - onFace));
  // the ropes that pour off the shoulder at the seawall are lit by their own field
  foamLit = mix(foamLit, foamLit * mix(0.72, 1.2, smoothstep(0.35, 0.65, rp2)), rope);
  float boK = boil * smoothstep(-0.3, 0.3, s);
  foamLit = mix(foamLit, foamLit * mix(mix(0.6, 0.8, low), 1.22, clamp(0.5 + (boA - boU) * 5. + (boB - 0.5) * 1.1, 0., 1.)), boK * 0.4);      // (the rafts on the back are lit a little by their own slope)
  // (and the solid white just behind the crest is the same ropes run together: thinner and greener between them, never one flat sheet)
  foamLit = mix(foamLit, foamLit * mix(vec3(0.74, 0.9, 0.86), vec3(1.), max(low, smoothstep(boThr - 0.1, boThr + 0.05, bo))), boZone * smoothstep(-0.3, 0.3, s) * (1. - boil) * 0.9);
  float footK = footS * exp(-mF / 0.5);      // (the billows are the pile's: half a metre out from it the lace is flat)
  // the roll at the foot is tumbling water: billows lit from above, its leading edge in its own shade
  float footB = smoothstep(0.4, 0.6, tum * 0.7 + tum2 * 0.3), footR = clamp(0.5 + (tum - tumU) * 5.5 + (tum2 - 0.5) * 0.8, 0., 1.);
  foamLit = mix(foamLit, foamLit * mix(mix(0.8, 0.9, low), mix(1.2, 1.12, low), footR) * mix(mix(0.9, 0.95, low), 1.06, footB) * mix(0.9, 1.05, smoothstep(0., 0.9, peF)), footK);
  foamLit = mix(foamLit, foamLit * vec3(0.74, 0.86, 1.) + jadeT * uSkyAmb * 0.5, footK * (1. - footB) * 0.4 * (1. - low));      // (blue-green in its hollows)
  // and the pile has edges at arm's length: where it churns (in patches, by its own tumbling field) every cell of
  // the net is a billow of it, bright on its crown and in its own shade in the crease round it, with bubbles a hand across
  // between; elsewhere it is smooth white water (far off the creases blur into the white)
  float churn = smoothstep(0.46, 0.62, tum * 0.6 + tum2 * 0.4), domeF = mix(smoothstep(0.02, 0.5, netC), 0.4, smoothstep(0.4, 1.1, pxC));
  float crC = netW(netC, 0.05 + 0.06 * churn, aaC, pxC) * mix(0.25, 1., churn), crF = netW(netF, 0.1, aaF, pxF) * churn;
  foamLit = mix(foamLit, foamLit * mix(1., mix(0.84, 1.12, domeF), churn) * mix(vec3(1.), mix(vec3(0.42, 0.6, 0.82), vec3(0.72, 0.68, 0.62), low), max(crC * 0.62, crF * 0.4)), footK);
  foamLit += uFoam * uLampC * min(lampGl, 1.) * 0.45;      // and lamp light lies on all the white water near a lamp
  float sp1 = texture2D(uNoise, xz * 1.9 + vec2(h * 1.3, -h * 0.9) + uTime * vec2(0.21, -0.15)).a, sp2 = texture2D(uNoise, vec2(xz.x * 0.8 - xz.y * 0.6, xz.x * 0.6 + xz.y * 0.8) * 3.1 - uTime * vec2(0.17, 0.11)).r;
  foamLit += uSunCol * smoothstep(0.6, 0.76, sp1) * smoothstep(0.55, 0.72, sp2) * fl * smoothstep(0.55, 0.95, foam) * 0.9 * smoothstep(5., 16., dist);      // glints (two skewed layers, so no lattice shows; none within a boat length of the lens, where they would be flakes)
  foamLit = mix(foamLit, uFoam * (uSkyAmb * 2.0 + uSunCol * 0.9), smoothstep(110., 380., dist) * 0.85);   // far away the thread is simply bright
  // THE BACK OF THE WAVE. Behind the crest, the whole front long, all the foam that lies on the jade is cut from the net:
  // where it is thin it is the same white in thin threads round holes of jade, where it is thick the veins are thick, and the
  // back is jade with white lace on it, never a pale sheet. The lace gathers in rafts with lanes of open jade between them
  // (patchG: a field some metres across); hard behind the crest it is close-meshed (cells an arm across, froth a hand across
  // in the thickest of it), and with metres down the back the mesh opens: the widest cells take over and the close mesh is
  // left only in rafts (raftG). The foam stays whole along the crest, the wave's white edge, and in the seam where the water
  // runs up the stone of the seawall (the first metres off its foot).
  float patchG = smoothstep(0.38, 0.62, boA * 0.45 + g1T.a * 0.55), raftG = smoothstep(0.45, 0.6, t2.a), openB = smoothstep(2.5, 11., sb);
  float raftM = foam * mix(0.5, 1.25, patchG), wG = 0.26 * raftM * raftM - 0.03 + 0.1 * foam * exp(-sb / 2.5), keepG = max(1. - smoothstep(0.4, 1.4, s), 1. - smoothstep(1.5, 3.5, d));
  float wGc = wG - 0.22 * openB * (1. - raftG), wGb = 0.75 * wG * mix(0.5, 1., openB);
  // (a vein thinner than a finger is not drawn as a hair: it fades out, so the lace ends in the open jade and no mesh of hairlines lies over it)
  float laceB = max(max(netW(netC, wGc, aaC, pxC) * smoothstep(0., 0.05, wGc), netW(netB, wGb, aaB, pxB) * smoothstep(0., 0.035, wGb)), netW(netF, 1.2 * (foam * mix(0.7, 1., patchG) - 0.88), aaF, pxF));
  foam = mix(foam, max(laceB, foam * keepG), backS);
  col = mix(col + spec * (1. - foam), foamLit, foam);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// ---------- the roll of the lip ----------
// The river's own lip is a thin thrown sheet. Over it, round the eye, lies the body of the breaker: a thick roll of water that
// rises behind the crest, arches over the thrown sheet and curls down in front of the face, torn at its falling edge into
// tongues and teeth, torn open above the edge, white on top and jade where the sheet is thin, with the light of the moon (or
// the sun) coming through its rim and through its hollow underside. One draw: a strip 208 m long that keeps to the eye
// (its columns stand on a 1 m lattice along the front, so nothing swims as it follows), gone where the river's own lip is
// gone (round an eye that rides the face, against the seawall, in the gate basin).
const LIP_VERT = /* glsl */`
uniform sampler2D uNoise; uniform vec3 uCamL; uniform float uReach;
varying vec3 vW; varying vec3 vNl; varying vec4 vP;
#include <common>
#include <fog_pars_vertex>
${WATER_COMMON}
${RID_GLSL}
${FOOT_GLSL}
// the section of the roll at one place along the front: (metres behind the crest, height) for a = 0 (its root) .. 1 (its edge)
// q: height at the root, height of the crest, how far the river's own sheet is thrown, the radius of the curl; k: how much of it there is
vec2 lipSec(float a, vec4 q, float k){
  float t = clamp(a / 0.55, 0., 1.), w = clamp((a - 0.55) / 0.45, 0., 1.);
  vec2 P0 = vec2(1., q.x - 0.06), P1 = vec2(0.1, q.y + 0.2 + 0.55 * k), P2 = vec2(-(0.3 + 0.95 * q.z), q.y - 0.17 * q.z + 0.26 * k);
  vec2 p = (1. - t) * (1. - t) * P0 + 2. * t * (1. - t) * P1 + t * t * P2;
  float th = w * 2.25;
  return p + vec2(-q.w * sin(th), -1.25 * q.w * (1. - cos(th)));
}
void main(){
  float dC = uCamL.x - wallX(uCamL.z), sC = uCamL.z - zFront(dC);
  float d = floor(dC) + position.x, zf = zFront(d), x0 = wallX(zf) + d, a = position.y;
  // (the same numbers as the river's own lip: see WATER_VERT)
  float atEye = smoothstep(-7.5, -4., sC) * (1. - smoothstep(6., 17., abs(d - dC)));
  float tear = textureLod(uNoise, vec2(x0 * 0.043 + 0.21, uTime * 0.045 + 0.33), 4.).r;
  float nearW = 1. - smoothstep(40., 70., abs(d - dC));
  float reach = mix(mix(1.9, 2.7, nearW * (1. - smoothstep(-12., -8., sC))), 3.3, nearW * uReach);
  float toW = mix(0.72 * smoothstep(2.5, 7., d), 1., smoothstep(9., 26., d));      // (carried to the seawall, as the river's own lip is)
  float gapR = ridGap(d);
  float cAmt = reach * toW * (0.5 + 0.85 * tear) * (1. - atEye) * gapR;
  float amt = toW * (1. - atEye) * gapR * (1. - smoothstep(72., 103., abs(d - dC))) * smoothstep(22., 70., zf);
  float lodL = mix(5.7, 4.5, smoothstep(22., 70., zf));
  float lumpC = textureLod(uNoise, vec2(x0 * 0.09, -0.0165 + uTime * 0.55), lodL).a - 0.5, lumpR = textureLod(uNoise, vec2(x0 * 0.09, 0.11 + uTime * 0.55), lodL).a - 0.5;
  float rag = textureLod(uNoise, vec2(x0 * 0.13 + 0.7, uTime * 0.07 + 0.11), 3.).a;
  // (against the wall the river is heaped and chopped by its own vertex shader: the roll stands on the same heaps)
  float runM = uPlume * exp(-max(d - 2.5, 0.) / 4.5);
  float chop = (textureLod(uNoise, vec2(x0 * 0.07 + uTime * 0.04, zf * 0.07 - uTime * 0.085), 4.6).r - 0.5) * 1.7;
  float chop2 = (textureLod(uNoise, vec2(x0 * 0.085 + 0.3, 0.03 + uTime * 0.2), 4.4).a - 0.5) * 1.5;
  float heap = (chop * 2.4 + chop2 * 1.1) * runM;
  float crg = crestRag(x0) * smoothstep(3., 9., d);      // (the roll stands on the crest's teeth, as the river's mesh does)
  vec4 q = vec4(boreH(1., d) + lumpR * 0.9 + heap + 0.41 * crg, boreH(-0.15, d) + lumpC * 0.73 + heap + crg, cAmt, (0.4 + 0.7 * rag) * amt);
  vec2 p = lipSec(a, q, amt), pa = lipSec(a + 0.03, q, amt), pb = lipSec(a - 0.03, q, amt);
  float z = zf + p.x;
  vec3 wp = vec3(wallX(z) + d, p.y - 4. * (1. - smoothstep(0.02, 0.07, amt)), z);
  vNl = normalize(cross(vec3(1., 0., dzFront(d)), vec3(0., pa.y - pb.y, pa.x - pb.x)) + vec3(0., 1e-4, 0.));
  vP = vec4(x0, a * (1.3 + 0.95 * cAmt + 2.3 * q.w), a, amt);
  vW = wp;
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LIP_FRAG = /* glsl */`
uniform sampler2D uNoise; uniform vec3 uDeep, uJade, uFoam, uSunDir, uSunCol, uSkyAmb, uCamL; uniform float uTime, uDim, uLow;
varying vec3 vW; varying vec3 vNl; varying vec4 vP;
#include <common>
#include <fog_pars_fragment>
void main(){
  float a = vP.z, amt = clamp(vP.w, 0., 1.); vec2 uv = vP.xy;
  // (every lookup is taken here, before anything is thrown away)
  float e1 = texture2D(uNoise, vec2(uv.x * 0.083, uTime * 0.04 + 0.3)).a, e2 = texture2D(uNoise, vec2(uv.x * 0.31 + 0.5, uTime * 0.09)).r;
  float e3 = texture2D(uNoise, vec2(uv.x * 0.9, uv.y * 0.7 + uTime * 0.55)).a;
  float f1 = texture2D(uNoise, vec2(uv.x * 0.47, uv.y * 0.3 + uTime * 0.4)).a, f2 = texture2D(uNoise, vec2(uv.x * 1.5 + 0.3, uv.y * 1.05 + uTime * 0.8)).r;
  float hl = texture2D(uNoise, vec2(uv.x * 0.36 + 0.2, uv.y * 0.42 + uTime * 0.5)).r;
  // the falling edge: long tongues, short teeth and a fine fray; above it the sheet is torn open
  float edge = 0.6 + 0.4 * clamp((e1 - 0.3) * 2.4, 0., 1.) * (0.5 + 0.5 * e2);
  float fray = edge - a + 0.09 * (e3 - 0.5);
  float torn = smoothstep(0.72, 1., a / max(edge, 0.3)) * (1. - smoothstep(0.36, 0.42, hl + 0.2 * (e3 - 0.5)));
  if (amt < 0.05 || fray < 0. || torn > 0.5) discard;
  vec3 V = normalize(uCamL - vW), N = normalize(vNl);
  float nv = dot(N, V), under = 1. - step(0., nv);          // 1: the hollow underside of the curl
  N *= 1. - 2. * under;
  float low = uLow, moonK = uDim * (1. - low);
  vec3 jadeT = uJade * mix(vec3(1.), vec3(0.62, 1.28, 0.86), moonK);
  float wrap = clamp(dot(N, uSunDir) * 0.6 + 0.4, 0., 1.);
  float back = max(dot(-V, uSunDir), 0.), back2 = back * back * (1. - 0.4 * back * back);
  float rimE = 1. - smoothstep(0., 0.16, fray);              // the last hand's breadth before the torn edge: thin water
  // foam: the top of the roll is white, its falling front is streaked with jade between the streaks, its underside is glass
  float fo = f1 * 0.62 + f2 * 0.38, thr = mix(0.17, 0.55, smoothstep(0.2, 0.95, a)) + 0.22 * under;      // (the top of the roll is white: where it opened, dull violet-grey patches lay on it like stains)
  float foamK = smoothstep(thr - 0.05, thr + 0.05, fo);
  float relief = clamp(0.5 + (f2 - 0.5) * 1.6 + (f1 - 0.5) * 0.8, 0., 1.);
  vec3 glass = mix(uDeep, jadeT, mix(0.6, 0.85, rimE)) * (uSkyAmb * 2.6 + uSunCol * (0.24 + 0.36 * wrap))
    + jadeT * (uSkyAmb * mix(1.2, 2.2, moonK) + uSunCol * (mix(0.22, 0.4, moonK) + mix(1.5, 0.7, low) * back2)) * mix(0.4, 1., max(rimE, under * smoothstep(0.3, 0.95, a))) * (1. - 0.5 * low) * (0.74 + 0.5 * hl);
  glass = max(glass * mix(1., 1. + 0.6 * back2, 1. - smoothstep(0.2, 0.4, a)), jadeT * (uSkyAmb * 1.5 + uSunCol * 0.1) * (1. - under));
  vec3 foam = uFoam * (uSkyAmb * 2.4 + uSunCol * (0.2 + 0.8 * wrap * (0.55 + 0.45 * relief))) * mix(0.72, 1., relief);
  foam = mix(foam, foam * vec3(0.72, 0.84, 1.) + jadeT * uSkyAmb * 0.6, 0.55 * (1. - relief) * (1. - uDim * 0.5));      // cool in its hollows
  foam += uFoam * uSunCol * back2 * 0.5 * mix(1., 0.4, low);                                                             // and lit through against the light
  foam *= 1. - 0.3 * under;
  vec3 col = mix(glass, foam, foamK);
  col += (uFoam * 0.5 + jadeT) * uSunCol * rimE * (0.16 + 0.9 * back2) * mix(1., 0.45, low);      // the thin edge takes the light
  col *= mix(1., 1. - 0.2 * smoothstep(0.3, 0.55, a), 1. - under);                              // the front of the roll is in its own shade lower down
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
function buildLipGeometry() {
  const HALF = 104, NA = 16, nd = HALF * 2 + 1, P = new Float32Array(nd * (NA + 1) * 3), I = new Uint16Array((nd - 1) * NA * 6);
  for (let j = 0; j <= NA; j++) for (let i = 0; i < nd; i++) { const o = (j * nd + i) * 3; P[o] = i - HALF; P[o + 1] = j / NA; }
  let q = 0;
  for (let j = 0; j < NA; j++) for (let i = 0; i < nd - 1; i++) { const a = j * nd + i, c = a + 1, d = a + nd, e = d + 1; I[q++] = a; I[q++] = c; I[q++] = d; I[q++] = c; I[q++] = e; I[q++] = d; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(new THREE.BufferAttribute(I, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
  return g;
}
// JS mirror of the big shape (no ripples), for boats and the camera
function makeHeightAt(st) {
  const zFront = (d) => st.boreZ - st.lead * Math.exp(-Math.max(d, 0) / LDEC) + 4.5 * Math.sin(d * 0.0021 + st.seed) + 2 * Math.sin(d * 0.0113 + 2.1 * st.seed);
  const heightAt = (x, z, time = 0) => {
    const d = x - wallX(z), s = z - zFront(d), t = clamp(1 + s / LF, 0, 1), sb = Math.max(s, 0);
    const env = Math.exp(-sb / 150) * (1 - smoothstep(5.2 * LAM, 6.0 * LAM, sb));
    let h = s < 0 ? HB * t * t * (1.6 - 0.6 * t) : 2.4 + 0.4 * (1 - Math.exp(-sb / 400)) + 1.6 * env * Math.cos((sb * 2 * Math.PI) / LAM);
    const tr = s + LF + 2.6; h -= TR * Math.exp((-tr * tr) / 7);
    h += LIP * Math.exp((-s * s) / (s < 0 ? 2.2 : 6.5));
    const dw = Math.max(d - 2.5, 0);
    h += st.plume * 5.5 * Math.exp(-dw / 6) * Math.exp(-((s - 4) * (s - 4)) / 260) * smoothstep(-12, -2, s);
    h += st.plume * 0.75 * Math.exp(-dw / 70) * Math.sin(dw * 0.21 - time * 1.9) * smoothstep(8, 40, s) * Math.exp(-sb / 420);
    if (st.rare) { const s2 = s + RK * (d - st.crossD) + 1.5 * Math.sin(d * 0.09 + st.seed) + 0.8 * Math.sin(d * 0.23), win = (d - st.crossD) / (d > st.crossD ? 130 : 45); h += RH * smoothstep(-25, 5, st.crossD) * Math.exp(-win * win) * Math.exp((-s2 * s2) / (s2 < 0 ? RF : 90)); }
    if (s > -6 && s < 10 && d > 8) {      // the torn lip (as in boreExtra)
      const lw = 0.48 * Math.sin(d * 0.21 + time * 0.9 + st.seed) + 0.34 * Math.sin(d * 0.345 - time * 0.63 + 2.1 * st.seed) + 0.14 * Math.sin(d * 0.52 + time * 1.31 + 4.2);
      h += lw * Math.exp((-s * s) / (s < 0 ? 3 : 9)) * smoothstep(8, 30, d);
    }
    return h;
  };
  return { zFront, heightAt };
}

// ---------- custom-lit things: spray, crowd, cloth, trees, leaves ----------
const LIGHT_PARS = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyAmb, uGroundAmb;
vec3 lit(vec3 alb, vec3 n, float wrap, float ao){
  float ndl = clamp((dot(n, uSunDir) + wrap) / (1. + wrap), 0., 1.);
  return alb * (uSunCol * ndl + mix(uGroundAmb, uSkyAmb, n.y * 0.5 + 0.5) * ao * 1.6);
}`;
const SPRAY_VERT = /* glsl */`
attribute vec4 aS;
uniform sampler2D uNoise;
uniform float uTrail, uPlumeH, uDim, uBurstK, uLow, uHeavy;
uniform vec2 uNearFade; uniform vec4 uBurst;
uniform vec3 uSunDir, uCamL;
varying vec2 vUv; varying vec4 vA; varying vec3 vSunV; varying float vP;
#include <common>
#include <fog_pars_vertex>
${WATER_COMMON}
${RID_GLSL}
${FOOT_GLSL}
void main(){
  vP = 0.;
  float kind = aS.w, size = 1., alpha = 0., cls = 0., grow = 0., feather = 0., ride = 1., lean = 0., softP = 0., inW = 1.; vec3 p = vec3(0.); vec2 asp = vec2(1.);
  float zp = max(uBoreZ - uLead, 3.);
  // once the plume's head has gone by the eye, what trails behind it stands between us and the gate, and we look along it:
  // its soft spray thins to a veil (by day most of all, when it is white on a pale sky), so that what is left is
  // thrown water (ropes, falling strands, drops) with the seawall and the sky between
  float passed = smoothstep(15., 40., uCamL.z - zp), thinP = 1. - mix(0.78, 0.6, uDim) * passed;
  float own = 0., farTall = 0.;
  if (kind >= 3.) {                  // white water at a hull the front is passing (aS.xy: a point on her waterline): tongues that leap
    // along the whole hull while the lip is under it, drawn larger far away so that a junk the far line takes is seen to be taken
    float d = aS.x - wallX(aS.y), sl = aS.y - zFront(d);
    float T = 0.7 + 0.6 * aS.z, ph = fract(aS.z * 17.3 + uTime / T), up = sin(ph * 3.14159), big = fract(aS.z * 7.7);
    float amp = exp(-sl * sl / 46.);
    float H = (2.4 + 3.8 * big * big) * (0.35 + 0.65 * up), wide = 2.1 + 2.7 * big;
    p = vec3(aS.x, boreH(sl, d) - 0.5 + 0.5 * H, aS.y);
    cls = 0.3; asp = vec2(wide, H) * step(0.02, amp); grow = 0.6; own = 1.;
    alpha = amp * smoothstep(0., 0.15, ph) * (1. - smoothstep(0.75, 1., ph)) * mix(0.92, 0.72, uDim);
  } else if (kind >= 2.) {           // the bore strikes the seawall: a column of water at every strike point (every ${SP} m of wall). It
    // leaps from the foot of the stone as the tongue that runs ahead of the wave along the wall reaches the point, stands at its
    // height as the front itself goes by, and comes down over the parapet and the promenade behind it; each is thrown higher than
    // the last toward the gate. Everything about a column is a function of how far the front has run since its tongue struck
    // there: so along the wall one is rising ahead of the wave, one stands at its height beside it and one is coming down,
    // whatever the pace.
    float rr = kind - 2., slot = floor(aS.y * 4.), zq = zp - ${GL(AHEAD)}, k0 = floor(zq / ${GL(SP)}) + 1.;
    float zk = (k0 + mod(slot - k0, 4.)) * ${GL(SP)}, tt = (zk - zq) / 16.;
    float gateK = 1. - smoothstep(60., 430., zk), Hk = mix(11., 18., gateK) * uPlumeH;
    float r1 = fract(aS.x * 7.13), r2 = fract(aS.x * 13.7 + aS.z * 3.1), r3 = aS.z;
    float v0 = sqrt(19.6 * Hk) * (0.45 + 0.55 * sqrt(r1)), a = max(tt - 0.35 * fract(aS.x * 3.3), 0.), Tf = v0 / 4.9 + 0.25;
    float y = 1. + v0 * a - 4.9 * a * a, vy = v0 - 9.8 * a;
    float dOut = 1.2 + 2.6 * r2 + (r2 - 0.44) * 4.2 * a;
    if (y < 9.9) dOut = max(dOut, 0.8);                     // (only water that has cleared the parapet comes down on the promenade)
    float zz = zk + (r3 - 0.5) * 9. - (1.5 + 4.5 * fract(aS.z * 5.7)) * a;
    float here = uPlume * step(20., zk) * (1. - step(${GL(ZE)}, zk)) * smoothstep(0., 0.08, a);
    float alive = here * (1. - smoothstep(0.8, 1., a / Tf)) * smoothstep(-0.5, 1.5, y);
    if (dOut < 0.8) alive *= smoothstep(9.2, 10.4, y);
    own = 1.; grow = 0.35;
    if (rr < 0.36) {                 // the column itself: jets that stand on the foot of the wall and reach to their own height, each with
      // a torn crown, the tallest in the middle of the strike (thinner by day, when side by side they closed into a white bank)
      float top = max(y, 0.5) * (0.5 + 0.5 * (1. - abs(r3 - 0.5) * 1.3));
      cls = 0.3; asp = vec2((2.4 + 3.2 * r2) * (1. + 0.35 * min(a, 2.)), top + 2.5);
      dOut = 0.9 + 1.5 * r2 + 0.5 * a; zz = zk + (r3 - 0.5) * (6. + 2.5 * min(a, 2.)) - 1.5 * a;
      y = 0.5 * (top + 2.5) - 0.8;
      alpha = here * (1. - smoothstep(0.72, 1., a / Tf)) * mix(0.5, 0.92, uDim);
    } else if (rr < 0.7) {           // drops: clusters of beads with air between them
      cls = 0.05; size = 1.7 + 2.3 * r1 + 0.9 * a; alpha = alive * 0.95;
    } else if (rr < 0.9) {           // gouts: short bright lengths of water
      cls = 1.; size = 0.4 + 0.55 * r1 * r1; asp = vec2(1., 1.15 + 0.7 * abs(vy) / 9.); alpha = alive * 0.9;
    } else {                         // and a little smoke that drifts inland over the parasols
      cls = 0.15; size = 4.5 + 5. * r1 + 3. * a; dOut -= 2.2 * a; alpha = alive * mix(0.1, 0.3, uDim) * smoothstep(0.3, 1.2, a);
    }
    p = vec3(wallX(zz) + dOut, y, zz);
  } else if (kind >= 1.) {                  // the crest's feather, kept round the eye: a window of the front 240 m wide that wraps as we move along it
    float WN = mix(240., 120., uHeavy);      // (uHeavy: the third draw, water thrown off the roll of the lip close round the eye: a narrower window, bigger pieces)
    float dC = uCamL.x - wallX(uCamL.z), dRaw = dC + (fract(aS.y - dC / WN) - 0.5) * WN, d = max(dRaw, 9.);
    // (the part of the window that falls behind the seawall is not drawn. It is not gathered at the wall's foot
    // either, where nearly half of the feather would stand on one spot as a white bank)
    inW = smoothstep(4., 9., dRaw) * ridGap(dRaw);      // (and none of it is thrown onto a rider in his pocket under the wall)
    float lipY = boreH(-0.25, d) + crestRag(wallX(zFront(d)) + d) * smoothstep(3., 9., d);      // (on the crest's teeth)
    float sC = uCamL.z - zFront(dC);
    ride = 1. - 0.6 * smoothstep(-7., -4., sC) * (1. - smoothstep(4., 14., sC));      // (thinned only for an eye that rides the face)
    ride *= 1. - 0.75 * smoothstep(4., 12., sC);      // (and for an eye the wave has outrun: seen from behind, the lip's smoke is thinned so that it is no bank before the gate)
    feather = smoothstep(2., 22., zFront(d));          // (none where the front piles into the gate)
    float featherT = smoothstep(26., 60., zFront(d));  // (the tongues stop sooner: none stand in a row once the front is in the gate basin)
    if (kind < 1.45) {               // spindrift smoking off the lip and falling behind it
      float T = 1.5 + aS.z, ph = fract(aS.x + uTime / T), a = ph * T;
      float sg = -0.4 + (3.2 + 3.4 * aS.z) * a + (fract(aS.x * 7.3) - 0.5) * 1.3, z = zFront(d) + sg, y0 = lipY, amp = 1.;
      if (uRare > 0.5 && fract(aS.x * 13.7 + aS.y * 5.3) < 0.24) {      // the crossing tide: the ridge's crest smokes too
        float sr = -crossS(d), win = (d - uCrossD) / 130.;
        z += sr; y0 = boreH(sr, d) - 0.1;
        amp = 0.6 * step(uCrossD + 3., d) * exp(-win * win) * smoothstep(-25., 5., uCrossD);
      }
      p = vec3(wallX(z) + d, y0 + 0.2 + mix(3. + 3.2 * fract(aS.z * 5.1), 2. + 2.3 * fract(aS.z * 5.1), uDim) * a - 0.75 * a * a, z);      // (by day it stands 5 or 6 m over the lip before it thins)
      float open = smoothstep(70., 170., zFront(d));      // (the day's heavier smoke is for the open river: over the gate basin it would bank up and hide the gate)
      size = mix(0.7, 2.9, ph) * (0.6 + 0.8 * aS.z) * mix(mix(1.15, 1.5, open), 1.35, uDim) * (1. + 0.45 * uHeavy); asp = mix(vec2(3.4, 0.7), vec2(2.3, 0.85), uDim); cls = 0.25; vP = ph;      // (by day wind-drawn sheets, not puffs)
      alpha = amp * smoothstep(0., 0.12, ph) * (1. - smoothstep(0.35, 1., ph)) * mix(mix(0.8, 1.5, open), 0.95, uDim) * mix(0.3, 1.25, smoothstep(0.3, 0.8, 0.5 + 0.5 * sin(d * 0.11 + uTime * 0.7 + 2. * sin(d * 0.037 - uTime * 0.3))));      // in gusts along the front
      alpha *= smoothstep(14., 60., zFront(d));      // (none of it across the gate: it lay over the arch and the portal as a pale band)
      alpha *= mix(0.46, 0.68, uDim);                // (a veil: the lip's own torn edge reads through it)
      if (uDim < 0.5) alpha = min(alpha, 0.3);       // (by day it is never opaque, so a sail behind the crest shows through it)
    } else if (kind < 1.7) {         // tongues of water torn up along the lip itself: they leap, lean and fall back, and break its line against the sky
      float T = 0.6 + 0.6 * aS.z, ph = fract(aS.x + uTime / T), up = sin(ph * 3.14159);
      float sg = -0.9 + 1.2 * ph + (fract(aS.x * 7.3) - 0.5), z = zFront(d) + sg;
      float big = aS.z * aS.z * aS.z, H = (0.9 + 1.3 * big) * (0.35 + 0.65 * up) * (1. + mix(0.5, 0.9, uDim) * uHeavy), wide = (1.6 + 2.6 * big) * (1. + 0.25 * uHeavy);
      float sel = fract(aS.x * 13.7 + aS.y * 5.3), foot = lipY - 0.3, amp = mix(0.95, 0.7, uDim);
      if (uRare > 0.5 && sel < 0.26) {            // the crossing tide: a quarter of them stand on the ridge's own crest
        float sr = -crossS(d), win = (d - uCrossD) / 130.;
        float rdg = step(uCrossD + 3., d) * exp(-win * win) * smoothstep(-25., 5., uCrossD);
        z = zFront(d) + sr + 0.5 * sg; foot = boreH(sr, d) - 0.35;
        amp *= 0.5 * smoothstep(0.25, 0.6, rdg); H *= 0.18 + 0.2 * rdg; wide *= 2.8;      // (a low torn fringe, not a row of peaks)
      } else if (uBurstK > 0.5 && sel > 0.9) {    // white water bursting along a hull as the lip goes under it
        float t = fract(aS.y * 9.7) * 2. - 1., sd = fract(aS.x * 3.1) < 0.5 ? -1. : 1.;
        vec2 hv = uBurst.zw, hn = normalize(vec2(-hv.y, hv.x) + vec2(1e-4, 0.));
        vec2 q = uBurst.xy + hv * t + hn * (sd * 2.3 * (1. - 0.6 * t * t));
        d = q.x - wallX(q.y); z = q.y;
        float sl = z - zFront(d);
        foot = boreH(sl, d) - 0.4; H *= 1.7; wide *= 1.2;
        amp = mix(0.8, 0.6, uDim) * exp(-sl * sl / 30.);
      }
      p = vec3(wallX(z) + d, foot + 0.5 * H, z);
      asp = vec2(wide, H); cls = 0.3;
      alpha = smoothstep(0., 0.15, ph) * (1. - smoothstep(0.75, 1., ph)) * amp * featherT / max(feather, 0.02);
    } else {                         // gouts and ropes of water thrown forward off the lip, falling down the face
      float T = 0.9 + 0.5 * aS.z, ph = fract(aS.x + uTime / T), a = ph * T;
      float sg = -0.5 - 1.7 * uHeavy - (2.2 + 4.2 * fract(aS.x * 3.7)) * a, z = zFront(d) + sg, vy = 1.2 + 3.6 * aS.z - 9.8 * a;
      p = vec3(wallX(z) + d, max(lipY + (1.2 + 3.6 * aS.z) * a - 4.9 * a * a, boreH(sg, d) + 0.1), z);
      cls = 1.; size = (0.1 + 0.27 * aS.z * aS.z) * (1. + 0.7 * uHeavy); asp = vec2(1., 1.1 + 0.6 * fract(aS.y * 9.3) + 0.8 * abs(vy) / 9.);
      alpha = smoothstep(0., 0.1, ph) * (1. - smoothstep(0.7, 1., ph)) * (0.5 + 0.5 * fract(aS.x * 5.1));
    }
  } else if (kind < 0.58) {                 // the plume: ballistic jets thrown up where the front meets the wall, trailing behind it
    float T = 3.7, ph = fract(aS.x + uTime / T), a = ph * T;
    cls = step(mix(0.24, 0.3, uDim), kind);      // half of them are bright ropes of water, the rest soft spray (by day there is less of that: it veils the gate)
    float up = (8. + 10.5 * aS.y) * uPlumeH;
    float ze = zp + uTrail * a * 0.8 + (aS.z - 0.5) * 10.;
    float side = (fract(aS.z * 7.31) - 0.6) * 6.5;
    float y = 2.2 + 3.2 * fract(aS.y * 5.7) + up * a - 4.9 * a * a;
    p = vec3(wallX(ze) + 3.4 + side * a, y, ze - (1.5 + 4. * fract(aS.x * 3.3)) * a);
    float alive = smoothstep(-0.5, 2., y) * uPlume, vy = up - 9.8 * a;
    if (uRare > 0.5 && fract(aS.x * 13.7) < 0.36) {     // the crossing tide: a burst where the two fronts meet
      float dx = max(uCrossD, 0.) + uTrail * a * 0.7, zc = zFront(dx) + uTrail * a * 0.8;
      float u2 = (5.5 + 8. * aS.y) * uPlumeH; y = 3.2 + u2 * a - 4.9 * a * a; vy = u2 - 9.8 * a;
      p = vec3(wallX(zc) + dx + (aS.z - 0.5) * 12. + side * a, y, zc + (fract(aS.z * 3.1) - 0.3) * 7.);
      alive = smoothstep(1.5, 3.5, y) * smoothstep(-20., 8., uCrossD) * (1. - smoothstep(0.5, 0.75, ph));
    }
    float born = smoothstep(0., 0.06, ph);
    if (cls > 0.5 && fract(aS.x * 9.1) < 0.5) { cls = 0.05; size = 1.6 + 2.4 * aS.z; alpha = born * (1. - smoothstep(0.6, 0.95, ph)) * alive * 0.9 * (1. - 0.25 * passed); own = 1.; }      // (drops)
    else if (cls > 0.5) { size = 0.42 + 0.7 * aS.z * aS.z; asp = vec2(1., 1.1 + 0.6 * fract(aS.y * 9.3) + 0.8 * abs(vy) / 9.); lean = clamp(side / (abs(vy) + 2.5), -0.7, 0.7) * sign(vy) * (mat3(modelViewMatrix) * vec3(1., 0., 0.)).x; alpha = born * (1. - smoothstep(0.6, 0.95, ph)) * alive * (0.55 + 0.45 * fract(aS.x * 5.1)) * (1. - 0.25 * passed); }
    else { size = mix(2., 5.5, ph) * (0.7 + 0.6 * aS.y) * mix(0.8, 1., uDim); asp = vec2(1., mix(2., 1., smoothstep(0., 0.6, ph))); alpha = born * (1. - smoothstep(0.5, 1., ph)) * alive * 0.5 * mix(0.2, 1., smoothstep(10., 70., zp)) * thinP; vP = passed; softP = 1.; }      // (thinner where the plume piles into the gate)
  } else if (kind < 0.63) {          // the leading sheet: a hard-edged crown of water at the very front of the plume
    float T = 2.7, ph = fract(aS.x + uTime / T), a = ph * T;
    float up = (11. + 6.5 * aS.y) * uPlumeH, y = max(up * a - 4.9 * a * a, 0.);
    float ze = zp - 2. + uTrail * a * 0.8 + (aS.z - 0.5) * 6.;
    p = vec3(wallX(ze) + 3. + 3. * fract(aS.z * 5.3), y * 0.5 + 2., ze);
    asp = vec2(5. + 6. * aS.y, y + 4.);
    alpha = smoothstep(0., 0.07, ph) * (1. - smoothstep(0.6, 1., ph)) * uPlume * 0.6 * (1. - 0.8 * passed); cls = 2.;
    lean = 0.27 * (mat3(modelViewMatrix) * vec3(0., 0., -1.)).x;      // it leans the way the wave runs
  } else if (kind < 0.68) {          // curtains of water falling back behind it
    float T = 4.3, ph = fract(aS.x + uTime / T), back = 5. + 34. * aS.y + ph * 9., z = zp + back;
    float top = (16. - 9. * aS.y) * uPlumeH;
    p = vec3(wallX(z) + 2.4 + 5. * fract(aS.z * 3.7), top * 0.5 + 1., z);
    asp = vec2(1.5 + 1.7 * aS.z, top);      // (a few strands each, never a broad sheet)
    alpha = sin(ph * 3.14159) * uPlume * 0.62 * mix(0.14, 1., smoothstep(10., 60., zp)) * exp(-back / 45.) * mix(step(0.5, fract(aS.z * 7.9)), 1., smoothstep(30., 70., z)); cls = 3.;      // (half as many across the gate's bastion)
    lean = 0.12 * (mat3(modelViewMatrix) * vec3(0., 0., -1.)).x;
  } else if (kind < 0.88) {          // spindrift torn off the crest, right across the river (far away it is the white thread's halo)
    float T = 1.9, ph = fract(aS.x + uTime / T), a = ph * T;
    float d = 5. + aS.y * aS.y * 2500.;
    float sg = -0.8 + 6.5 * a + (aS.z - 0.5) * 3., z = zFront(d) + sg;
    p = vec3(wallX(z) + d, boreH(sg, d) + 0.6 + 3.2 * a - 1.5 * a * a, z);
    float farK = smoothstep(200., 500., distance(p.xz, uCamL.xz));
    // by the place along the front the far line's smoke stands high here and low there and leans one way or the other
    vec4 un = textureLod(uNoise, vec2(d * 0.0037 + 0.31, 0.57 + uTime * 0.004), 1.);
    float tallP = 0.2 + 1.6 * smoothstep(0.3, 0.7, un.r);
    p.y += farK * (2.2 + 6.5 * aS.z) * a * tallP;      // (far off it is thrown higher: a lit crest of spray along the whole line)
    size = mix(1.5, 4.4, ph) * (0.6 + 0.8 * aS.z); grow = 1.; farTall = tallP; lean = farK * (un.a - 0.5) * 2.4;
    alpha = smoothstep(0., 0.1, ph) * (1. - smoothstep(0.4, 1., ph)) * 0.55 * (1. + 0.7 * farK);
    // (as the front comes into the gate basin it thins away, so no pale band lies across the arch; and beside
    // the wall it thins for an eye the plume has passed)
    alpha *= mix(0.1, 1., smoothstep(25., 110., zFront(d))) * (1. - 0.7 * passed * (1. - smoothstep(30., 90., d)));
  } else {                           // spray hanging along the wall after the plume has gone by
    float T = 9., ph = fract(aS.x + uTime / T), back = 8. + aS.y * 200., z = zp + back;
    p = vec3(wallX(z) + 2. + (aS.z - 0.6) * 15., 2. + 20. * fract(aS.z * 9.1) * fract(aS.z * 9.1) + 2.5 * ph, z + ph * 4.);      // (spread in height: no level band of it across the bastion)
    // (drops still in the air and thin torn wisps, not a hanging fog: seen along the wall the big soft sprites added up to a
    // white bank that hid the seawall, its parasols and the sky)
    p.y -= 2.2 * ph + 1.5 * ph * ph;
    size = 2.2 + 2.6 * aS.y; cls = 0.05;
    alpha = sin(ph * 3.14159) * mix(0.75, 0.6, uDim) * smoothstep(0., 60., zp) * exp(-back / 110.) * uPlume * (1. - 0.5 * passed);
  }
  vUv = position.xy; vA = vec4(alpha, aS.x * 7.7, aS.z * 5.3, cls);
  vSunV = normalize(mat3(modelViewMatrix) * uSunDir);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  float fd = -mvPosition.z;
  size *= mix(1., clamp(fd / 95., 1., 3.8), grow);
  asp.y *= 1. + 2.1 * farTall * smoothstep(200., 500., fd);      // (the far thread's smoke stands tall over it: from the first second the line on the horizon is a wall that is coming)
  if (kind >= 1.7 && kind < 2.) { vA.x *= mix(1.7, 1., smoothstep(20., 60., fd)); size *= mix(1.2, 1., smoothstep(25., 45., fd)); }      // (water thrown off the lip close by: a fringe that breaks its white line against the sky)
  // spray close to the eye thins to a veil (the ropes less than the mist, so the plume beside us is thrown water, not fog)
  float nearF = mix(abs(cls - 1.) < 0.5 ? 0.62 : 0.07, 1., smoothstep(uNearFade.x, uNearFade.y, fd)) * mix(1., 1. + 0.9 * smoothstep(120., 400., fd), grow);
  // (the feather keeps its strength to within a few boat lengths, so the wall that comes at us smokes along its whole lip)
  // (the lip's veil thins with distance: far off it would lie milky over the sails behind the crest)
  if (own > 0.5) vA.x *= smoothstep(5., 14., fd);
  else vA.x *= kind >= 1. ? inW * feather * (cls > 0.5 ? smoothstep(3.5, 12., fd) : cls > 0.28 ? smoothstep(3., 9., fd) : smoothstep(3., 10., fd) * ride * (1. - mix(0.8, 0.6, uDim) * smoothstep(mix(35., 45., uDim), mix(90., 110., uDim), fd))) * (1. - smoothstep(150., 260., fd)) : nearF * (cls > 2.5 ? 0.45 * smoothstep(60., 140., fd) : 1.) * (abs(cls - 1.) < 0.5 ? smoothstep(7., 30., fd) : 1.) * (abs(cls - 2.) < 0.5 ? smoothstep(25., 90., fd) : 1.);      // (and the leading sheets, each as broad as a house, close into a white veil when seen from near and along the wall: they are for the far view too)      // (falling strands and ropes right beside the eye are blurred streaks: they are for the middle distance)
  // (the plume's soft spray is for the far view, where it gives the column its body. Within a hundred metres its hundreds of
  // sprites, seen one behind the other, closed into a white bank: there the column is its ropes of water)
  vA.x *= 1. - softP * mix(mix(0.66, 0.54, uDim), 0.16, uLow) * (1. - smoothstep(45., 150., fd));      // (the column keeps some body beside the eye, and more of it under a low sun, where it stands against the bright sky)
  vec2 quad = position.xy * size * asp; quad.x += lean * quad.y;
  mvPosition.xy += quad;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPRAY_FRAG = /* glsl */`
uniform sampler2D uNoise; uniform vec3 uFoam, uSunCol, uSkyAmb; uniform float uTime, uDim, uLow;
varying vec2 vUv; varying vec4 vA; varying vec3 vSunV; varying float vP;
#include <common>
#include <fog_pars_fragment>
void main(){
  float r = length(vUv) * 2., a, lum, cls = vA.w;
  vec3 nn = normalize(vec3(vUv * 2., 0.75));
  float sh = clamp(dot(nn, vSunV) * 0.5 + 0.5, 0., 1.);
  float fw = clamp(-vSunV.z, 0., 1.); fw = fw * fw * fw;                // the sun behind the water: it lights up
  float n = texture2D(uNoise, vUv * vec2(0.8, 0.3) + vA.yz + vec2(0., uTime * 0.03)).a * 0.65 + texture2D(uNoise, vUv * vec2(2.4, 0.9) + vA.zy).a * 0.35;
  float ax = abs(vUv.x), rim = 0., core = 0.;
  float px = clamp(max(fwidth(vUv.x), fwidth(vUv.y)), 1e-4, 1.);      // how much of the sprite one pixel is (taken here, before any branch)
  if (cls > 2.5) {                   // water falling back behind the plume: four or five separate strands, each begun at its own
    // height and broken into lengths that fall, with air between them. Each strand is drawn from its own centre line and is
    // never thinner than a pixel (it fades instead), so from any distance it is strands or nothing, never a pale box.
    float bx = vUv.x + 0.05 * sin(vUv.y * 5. + vA.y * 6.283) + 0.1 * (n - 0.5);
    float cell = bx * 3. + vA.y * 3.1, id = floor(cell), fx = fract(cell) - 0.5;
    vec4 hr = textureLod(uNoise, vec2(id * 0.137 + vA.z, vA.y * 0.71), 0.);
    float h1 = clamp((hr.r - 0.25) * 2., 0., 1.), h2 = clamp((hr.a - 0.25) * 2., 0., 1.);
    float wn = mix(0.06, 0.16, h2), hw = max(wn, px * 3.3);
    float strand = (1. - smoothstep(hw * 0.5, hw, abs(fx - (h1 - 0.5) * 0.6 - 0.28 * sin(vUv.y * (6. + 7. * h2) + hr.g * 25.)))) * min(wn / hw, 1.);      // (each strand wanders on its own, so they are never pin-stripes)
    float bead = textureLod(uNoise, vec2(id * 0.31 + vA.z, vUv.y * 0.9 + uTime * 0.55 + vA.y), log2(max(px * 230., 1.))).a;
    float top = 0.5 - 0.42 * h2;
    a = vA.x * strand * smoothstep(0.47, 0.57, bead + 0.12 * (h1 - 0.5)) * (1. - smoothstep(0.32, 0.5, ax)) * smoothstep(-0.5, -0.38, vUv.y) * (1. - smoothstep(top - 0.14, top, vUv.y));
    lum = mix(0.85, 1.35, smoothstep(0.45, 0.7, bead));
  } else if (cls > 1.5) {            // the leading sheet: a sharp, sun-rimmed crown; torn open lower down
    float fine = textureLod(uNoise, vec2(vUv.x * 5.3 + vA.z, vUv.y * 1.1 + vA.y - uTime * 0.3), log2(max(px * 1350., 1.))).r;
    float crown = 0.5 - 0.4 * (textureLod(uNoise, vec2(vUv.x * 0.8 + vA.y, vA.z), 0.).a * 0.62 + textureLod(uNoise, vec2(vUv.x * 2.4 + vA.z, vA.y), log2(max(px * 610., 1.))).r * 0.38) - 0.9 * vUv.x * vUv.x;
    float below = crown - vUv.y + 0.07 * (fine - 0.5);
    rim = 1. - smoothstep(0., 0.09, below);
    a = vA.x * smoothstep(0., 0.05, below) * smoothstep(0.38, 0.58, n * 0.7 + fine * 0.3 + 0.26 * (1. - smoothstep(0., 0.4, below))) * (1. - smoothstep(0.3, 0.5, ax)) * smoothstep(-0.5, -0.3, vUv.y);
    lum = 0.9 + 0.3 * n + 0.8 * rim;
  } else if (cls > 0.5) {            // a rope of water: bright core, soft ends
    // (large in the frame it is a hard bright core that tapers to both ends and is broken here and there, in a faint halo of
    // drops, never a soft ellipse)
    // (the core is a thin thread and the halo a faint mist)
    float halo = (1. - smoothstep(0.15, 1., length(vec2(vUv.x * 3.1, vUv.y * 2.)))) * smoothstep(-0.5, -0.12, vUv.y);
    float ty = 1. - smoothstep(0.05, 0.5, abs(vUv.y)), hw = max((0.02 + 0.07 * ty) * (0.35 + 0.65 * ty), px * 1.2);
    float bend = (fract(vA.y * 3.7) - 0.5) * 1.1 * (vUv.y * vUv.y - 0.08) + 0.07 * (n - 0.5);                      // (bent, each its own way, and broken into lengths: straight and whole they crossed like straws)
    float bead = textureLod(uNoise, vec2(vA.y * 0.61, vUv.y * 1.5 + vA.z), log2(max(px * 380., 1.))).a;
    float coreR = (1. - smoothstep(hw * 0.15, hw * 1.3, abs(vUv.x - bend))) * smoothstep(0.36, 0.62, bead + 0.14 * ty) * ty;
    a = vA.x * mix(halo, max(coreR, 0.16 * halo), 1. - smoothstep(0.07, 0.2, px)); lum = mix(1.5, 1.9, uLow);
  } else if (cls > 0.28) {           // water torn up off the lip: a ragged, many-peaked crown, streaky inside, bright along its torn edge
    float yy = vUv.y + 0.5;
    float pk = textureLod(uNoise, vec2(vUv.x * 0.9 + vA.y, vA.z), 0.).a * 0.62 + textureLod(uNoise, vec2(vUv.x * 3.3 + vA.z, vA.y), log2(max(px * 840., 1.))).r * 0.3 + textureLod(uNoise, vec2(vUv.x * 9. + vA.y * 3., vA.z * 2.), log2(max(px * 2300., 1.))).a * 0.08;
    float fine = textureLod(uNoise, vec2(vUv.x * 6.1 + vA.z, vUv.y * 1.3 + vA.y - uTime * 0.35), log2(max(px * 1560., 1.))).r;
    float below = (0.12 + 0.88 * smoothstep(0.2, 0.8, pk)) * (1. - 4. * vUv.x * vUv.x) - yy + 0.1 * (fine - 0.5);
    float strand = textureLod(uNoise, vec2(vUv.x * 2.3 + vA.y, vUv.y * 0.5 + vA.z - uTime * 0.2), log2(max(px * 590., 1.))).a;
    // (thrown water, not a sheet: strands with air between them, thinning to nothing at the foot)
    a = vA.x * smoothstep(0., 0.34, below) * smoothstep(0.38, 0.6, strand * 0.5 + fine * 0.2 + n * 0.3 + 0.13 * smoothstep(0., 0.4, below)) * smoothstep(-0.5, -0.2, vUv.y);
    rim = (1. - smoothstep(0.05, 0.3, below)) * smoothstep(0., 0.12, below);
    lum = (0.85 + 0.3 * strand + 0.4 * rim) * mix(1.4, 1., uDim); core = smoothstep(0., 0.4, below);
  } else if (cls > 0.02 && cls < 0.1) {      // drops still in the air where the plume has been: short falling streaks and beads with air between them
    // (every drop is drawn as a drop, a bead drawn out by its fall, large ones and a finer rain between them, each in a cell
    // of its own)
    // (no two sprites share a lattice: each has its own shear and is bent by the noise, and every drop sits off-centre in its cell)
    vec2 uvd = vUv + vec2(vUv.y * (fract(vA.y * 1.7) - 0.5) * 0.8 + 0.1 * (n - 0.5), 0.07 * (n - 0.5));
    vec2 g1 = vec2(uvd.x * 6. + vA.y * 13., uvd.y * 3.5 + vA.z * 7. + uTime * 0.55), i1 = floor(g1), f1 = fract(g1) - 0.5;
    vec4 h1 = textureLod(uNoise, i1 * vec2(0.137, 0.291) + vA.zy, 0.);
    float r1 = 0.05 + 0.13 * clamp((h1.b - 0.3) * 2., 0., 1.);
    float dA = step(0.58, h1.a) * (1. - smoothstep(r1 * 0.5, r1, length((f1 - clamp((h1.rg - 0.5) * 1.6, -0.3, 0.3) * vec2(1., 0.6)) * vec2(1., 0.55))));
    vec2 g2 = vec2(uvd.x * 15. + vA.z * 9., uvd.y * 8. + vA.y * 5. + uTime * 1.0), i2 = floor(g2), f2 = fract(g2) - 0.5;
    vec4 h2 = textureLod(uNoise, i2 * vec2(0.173, 0.319) + vA.yz, 0.);
    float r2 = 0.05 + 0.08 * clamp((h2.b - 0.3) * 2., 0., 1.);
    float dB = step(0.6, h2.a) * (1. - smoothstep(r2 * 0.5, r2, length((f2 - clamp((h2.rg - 0.5) * 1.6, -0.3, 0.3) * vec2(1., 0.6)) * vec2(1., 0.55))));
    float fA = smoothstep(0.012, 0.035, px), fB = smoothstep(0.004, 0.012, px);      // (far off, where a drop is less than a pixel, it goes out: a faint even haze is all that is left)
    float pat = max(max(dA * (1. - fA), 0.75 * dB * (1. - fB)), 0.05 * fA);
    a = vA.x * (1. - smoothstep(0.45, 1., r)) * pat; lum = 1.3; core = 1.;
  } else {                           // torn spray: streaky erosion, thicker parts brighter
    // (the plume's soft spray is more torn by day, and most of all for an eye it has passed: vP)
    float vq = cls < 0.02 ? vP : 0., tq = cls < 0.02 ? 0.07 * (1. - uDim) : 0.;
    float e = smoothstep(0.3 + tq + 0.14 * vq, 0.6 + tq + 0.08 * vq, n + (1. - r) * 0.36 * (1. - 0.45 * vq));
    a = vA.x * (1. - smoothstep(0.35, 1., r)) * e; lum = (0.72 + 0.4 * e * n) * (cls > 0.1 ? 1.45 : 1.);
    core = clamp(1.4 * (1. - r), 0., 1.) * e;
    a *= 1. - 0.6 * fw * uDim * (1. - 0.5 * uLow);                      // soft spray against a low sun or the moon: a thin bright veil, not a bank
    if (cls > 0.2) a *= mix(smoothstep(0.35, 0.65, n), 1., uDim);        // (by day the lip's veil is torn wisps, and a sail behind the crest shows through it)
  }
  if (a < 0.004) discard;
  a = min(a, 1.);
  // (by day the sun stands behind the wall as it comes: its spindrift and tongues scatter the light forward and glow brighter than
  // the sky behind them, or white on white they would be lost)
  // The lip's spindrift by day is a veil, not a row of lit puffs: where it leaves the lip it is in the wave's own shade
  // (blue-grey, so it shows against a pale sky and white cumulus), and it takes the light as it rises and thins. Water thrown
  // up in tongues is glass at its heart and white along its torn edge.
  float day = 1. - uDim, fwd = 0.55 + 0.6 * rim, shd = sh; vec3 under = vec3(0.68, 0.79, 0.93);
  if (cls < 0.2) fwd = 0.4 + 0.5 * day * (0.5 + 0.5 * core);
  else if (cls < 0.28) { fwd = 0.4 + day * mix(1.4, 0.9, core); under = mix(mix(under, vec3(0.26, 0.42, 0.56), day), vec3(0.5, 0.42, 0.4), uLow);      // (the veil has a shade of its own in every light, so it shows against the sky and does not lie milky on a sail)
    shd = mix(sh, smoothstep(0.04, 0.42, vP + 0.3 * (n - 0.5)), 0.8 * day); }
  else if (cls < 0.5) { fwd = 0.4 + 1.35 * day * (0.5 + 0.5 * core) + 0.3 * rim; under = mix(under, vec3(0.7, 0.85, 0.92), day * 0.8); shd = mix(sh, 1. - 0.5 * core * (1. - rim), 0.7 * day); }      // (thrown water against a bright sky is brighter than it: the tongues have no dark heart)
  gl_FragColor = vec4(uFoam * lum * mix(under, vec3(1.), shd) * (uSkyAmb * 1.9 + uSunCol * (0.12 + 0.86 * sh * sh + fwd * fw)), a);
  #include <fog_fragment>
}`;
// ---------- water thrown off the crest, the whole front long ----------
// Sheets of water that leave the lip and are carried back over the crest (veils that rise a metre and slide away behind the
// wave) and crowns of thrown water that stand up along the crest line and fall back onto it. Each has its own place along
// the front (aT.x: metres from the wall line, from a stream of its own) and repeats there on the water's clock; each is two
// crossed ribbons laid along its own path through the air in the wave's frame (one across the front, one upright), so it
// has the same shape from every side and nothing in it turns to an eye. Where it stands, how high and how far it goes are
// functions of the front alone (zFront, boreH, crestRag); the lip throws harder along some stretches than others (a slow
// field along the front). Lit by the sky, the moon or the sun (through it, when the light is behind) and by the lamps the
// front is about to take (uLampR). Low enough that an eye riding the lip looks over them.
const THROW_VERT = /* glsl */`
attribute vec4 aT;
uniform sampler2D uNoise; uniform vec4 uLampR[8];
varying vec3 vUv; varying vec4 vA; varying vec3 vW;
#include <common>
#include <fog_pars_vertex>
${WATER_COMMON}
${RID_GLSL}
${FOOT_GLSL}
void main(){
  float d = aT.x, r1 = aT.y, r2 = aT.z, kind = step(0.45, aT.w);            // 0: a veil carried back, 1: a crown
  float zf0 = zFront(d), x0 = wallX(zf0) + d;
  float y0 = boreH(-0.25, d) + crestRag(x0) * smoothstep(3., 9., d);
  float gust = smoothstep(0.38, 0.56, textureLod(uNoise, vec2(x0 * 0.013 + 0.9, uTime * 0.02 + 0.4), 2.).r);
  float H = 0.35 + 0.6 * r2 + 0.25 * gust;
  float s0 = mix(0.1 + 0.6 * r2, -0.5 + 0.9 * r1, kind), vs = mix(3.4 + 3. * r1, 0.3 + 1.1 * r2, kind);
  float vy = mix(0.9 + 1.2 * r2, sqrt(19.6 * H), kind), g = mix(1.8, 9.8, kind);
  float T = mix(1.3 + 0.8 * r1, 2. * vy / 9.8 + 0.08, kind), Tc = T + 0.25 + 0.9 * fract(r1 * 7.7 + r2 * 3.1);
  float a = fract(r1 * 7.31 + r2 * 3.7 + aT.w * 5.3 + uTime / Tc) * Tc;
  float aw = max(a - mix(0.55, 0.3, kind) * (1. - position.y), 0.);
  float wide = mix(1.6 + 2.2 * r2, 0.5 + 1.1 * r1, kind) * (0.45 + 0.55 * smoothstep(0., 0.3, aw));
  float sP = s0 + vs * aw, yP = y0 + mix(0.15, -0.1, kind) + vy * aw - 0.5 * g * aw * aw;
  vec2 t2 = normalize(vec2(vs, vy - g * aw) + vec2(1e-4, 0.)), n2 = vec2(-t2.y, t2.x);
  float dd = d, across = position.x;
  if (position.z < 0.5) dd += across * wide; else { sP += n2.x * across * mix(0.5, 0.42, kind); yP += n2.y * across * mix(0.5, 0.42, kind); }
  float z = zFront(dd) + sP;
  vec3 wp = vec3(wallX(z) + dd, yP, z);
  float alpha = step(a, T) * smoothstep(0., 0.1, a) * (1. - smoothstep(0.7 * T, T, a)) * mix(0.3, 1., gust) * smoothstep(6., 13., d) * ridGap(d);
  alpha *= mix(0.42 * smoothstep(14., 60., zf0), 0.9, kind);      // (no veil drifts across the gate arch once the front is in the basin)
  float lamp = 0.;
  for (int i = 0; i < 8; i++) { vec2 dL = wp.xz - uLampR[i].xy; lamp += uLampR[i].z / (1. + dot(dL, dL) * 0.02); }
  vUv = vec3(position.x, position.y, kind); vA = vec4(alpha, r1 * 9.1 + aT.w, r2 * 7.3, min(lamp, 1.2)); vW = wp;
  if (alpha < 0.004) wp.y = -40.;
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const THROW_FRAG = /* glsl */`
uniform sampler2D uNoise; uniform vec3 uFoam, uJade, uSunDir, uSunCol, uSkyAmb, uCamL, uLampC; uniform float uTime, uDim, uLow;
varying vec3 vUv; varying vec4 vA; varying vec3 vW;
#include <common>
#include <fog_pars_fragment>
void main(){
  float x = vUv.x, y = vUv.y, kind = vUv.z;
  float n1 = texture2D(uNoise, vec2(x * 0.9 + vA.y, y * 0.32 + vA.z - uTime * 0.15)).a, n2 = texture2D(uNoise, vec2(x * 2.6 + vA.z, y * 0.9 + vA.y - uTime * 0.3)).r;
  float n = n1 * 0.62 + n2 * 0.38;
  float edge = (1. - smoothstep(0.2, 0.5, abs(x))) * smoothstep(0., 0.12, y) * (1. - smoothstep(0.82, 1., y));
  float core = (1. - smoothstep(0.02, 0.3, abs(x))) * smoothstep(0.1, 0.5, y);
  // a veil is torn spray, thin everywhere; a crown is streaks of water that come apart into beads toward its head
  float thr = mix(0.5, mix(0.4, 0.56, smoothstep(0.45, 0.95, y)), kind) - 0.12 * core;
  float body = smoothstep(thr, thr + mix(0.16, 0.06, kind), n) * edge;
  float al = vA.x * body;
  if (al < 0.004) discard;
  vec3 V = normalize(uCamL - vW);
  float back = max(dot(-V, uSunDir), 0.), fw = back * back * back;
  float day = 1. - uDim, thick = smoothstep(thr + 0.03, thr + 0.22, n) * (0.5 + 0.5 * core);
  vec3 shade = mix(vec3(0.72, 0.82, 0.95), mix(vec3(0.42, 0.56, 0.7), vec3(0.6, 0.5, 0.46), uLow), day);      // (by day it has a shade of its own against a pale sky)
  vec3 col = uFoam * mix(shade, vec3(1.), mix(thick, 0.35 + 0.65 * thick, kind)) * (uSkyAmb * 2.1 + uSunCol * (0.2 + 0.5 * thick + mix(0.9, 0.5, uLow) * fw));
  col += uJade * uSunCol * (1. - thick) * kind * 0.22 * (1. - uLow);      // thin water is green
  col += uFoam * uLampC * vA.w * 0.7;
  gl_FragColor = vec4(col, min(al, 1.));
  #include <fog_fragment>
}`;
function buildThrowGeometry(n, rng) {
  const NS = 3, pos = [], idx = [];
  for (let pl = 0; pl < 2; pl++) {
    const b = pos.length / 3;
    for (let j = 0; j <= NS; j++) pos.push(-0.5, j / NS, pl, 0.5, j / NS, pl);
    for (let j = 0; j < NS; j++) { const a = b + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const aT = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { aT[i * 4] = 6 + 2494 * rng(); aT[i * 4 + 1] = rng(); aT[i * 4 + 2] = rng(); aT[i * 4 + 3] = rng(); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
const CROWD_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aRnd; attribute vec3 aCol; attribute float aPart;
uniform float uTime, uBoreZ, uLead, uPlume;
varying vec3 vCol; varying vec3 vNl; varying vec3 vLoc; varying float vPart;
#include <common>
#include <fog_pars_vertex>
void main(){
  float sc = 0.82 + 0.36 * aRnd.z, dz = aPos.z - (uBoreZ - uLead);
  float duck = uPlume * exp(-dz * dz / (dz > 0. ? 3000. : 420.));
  // (and harder still round each point where the bore strikes the wall, from the moment its column comes over the parapet until
  // the front has run 80 m on: the same strike points, every ${SP} m of wall, as the columns themselves. Dk: how far the tongue
  // that runs ahead of the wave has passed the point)
  float zk = floor(aPos.z / ${GL(SP)} + 0.5) * ${GL(SP)}, Dk = zk - (uBoreZ - uLead) + ${GL(AHEAD)};
  float hit = uPlume * step(20., zk) * smoothstep(6., 16., Dk) * (1. - smoothstep(50., 100., Dk)) * exp(-(aPos.z - zk) * (aPos.z - zk) / 150.);
  duck = max(duck * 0.7, hit * (0.9 + 0.4 * aRnd.x));
  float look = sin(uTime * (0.6 + aRnd.y) + aRnd.y * 40.) + 2.2 * hit * sin(uTime * 7. + aRnd.y * 60.) * 0.3;
  vec3 p = position, n = normal;
  if (aPart < 0.5) {                 // the parasol tips toward the river when the spray comes
    float tilt = duck * (0.75 + 0.4 * aRnd.x) + 0.1 * look + 0.12 * (aRnd.w - 0.3), c = cos(tilt), s = sin(tilt);
    p.y -= 1.2; p = vec3(p.x * c + p.y * s, p.y * c - p.x * s, p.z); p.y += 1.2 - 0.25 * duck;
    n = vec3(n.x * c + n.y * s, n.y * c - n.x * s, n.z);
    vCol = aCol;
  } else {
    p.y *= 1. - 0.16 * duck; p.x += 0.05 * look * p.y;
    vCol = aPart > 1.5 ? vec3(0.02, 0.016, 0.014) : aRnd.w < 0.4 ? vec3(0.04, 0.06, 0.13) : aRnd.w < 0.72 ? vec3(0.46, 0.44, 0.38) : aRnd.w < 0.88 ? vec3(0.2, 0.1, 0.06) : vec3(0.12, 0.2, 0.17);
  }
  float yaw = aRnd.y * 6.283, cy = cos(yaw), sy = sin(yaw);
  if (aPart > 0.5) { p.xz = vec2(p.x * cy + p.z * sy, p.z * cy - p.x * sy); n.xz = vec2(n.x * cy + n.z * sy, n.z * cy - n.x * sy); }
  vLoc = position; vNl = n; vPart = aPart;
  vec4 mvPosition = modelViewMatrix * vec4(aPos + p * sc, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CROWD_FRAG = /* glsl */`
uniform vec3 uLampP;
varying vec3 vCol; varying vec3 vNl; varying vec3 vLoc; varying float vPart;
#include <common>
#include <fog_pars_fragment>
${LIGHT_PARS}
void main(){
  vec3 n = normalize(vNl), alb = vCol;
  vec3 col;
  if (vPart < 0.5) {                 // oiled paper: ribs, a dark rim and a cap; glows a little whichever side the sun is on
    float rr = length(vLoc.xz), ang = atan(vLoc.z, vLoc.x + 1e-4);
    float rib = abs(fract(ang * 1.9099) - 0.5) * 2.;
    alb *= mix(0.62, 1., smoothstep(0.08, 0.3, rib)) * (1. - 0.4 * smoothstep(0.86, 0.97, rr)) * (1. - 0.5 * (1. - smoothstep(0.08, 0.16, rr)));
    col = lit(alb, n, 0.6, 1.) + alb * uSunCol * 0.2 + alb * uLampP * (0.55 + 0.45 * smoothstep(0.2, 0.9, rr));      // (and by lantern light the oiled paper glows from below)
  } else col = lit(alb, n, 0.4, 0.8);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const FLAG_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aRnd; attribute vec3 aCol; attribute float aPart;
uniform float uTime, uBoreZ, uLead, uPlume; uniform vec2 uWind;
varying vec3 vCol; varying vec3 vNl; varying vec3 vUvP;
#include <common>
#include <fog_pars_vertex>
void main(){
  float H = aRnd.x, dz = aPos.z - (uBoreZ - uLead);
  float zk = floor(aPos.z / ${GL(SP)} + 0.5) * ${GL(SP)}, Dk = zk - (uBoreZ - uLead) + ${GL(AHEAD)};      // (the strike point nearest this pole: its column whips the silk)
  float hit = uPlume * step(20., zk) * smoothstep(4., 14., Dk) * (1. - smoothstep(46., 96., Dk)) * exp(-(aPos.z - zk) * (aPos.z - zk) / 200.);
  float gust = 1. + 1.6 * uPlume * exp(-dz * dz / 1800.) + 1.3 * hit + 0.3 * sin(uTime * 0.8 + aRnd.y * 20.);
  vec3 p, n;
  if (aPart < 0.5) { p = vec3(position.x, position.y * H, position.z); n = normal; vCol = vec3(0.1, 0.055, 0.035); vUvP = vec3(0., 0., 0.); }
  else {
    float u = position.x, v = position.y, ph = aRnd.y * 30.;
    float len = aRnd.z, hoist = aRnd.w;
    float w = sin(u * 5.2 - uTime * 6.4 + ph + v * 1.3) * 0.3 * u + sin(u * 11. - uTime * 9.5 + ph * 1.7 + v * 3.) * 0.09 * u;
    float dw = cos(u * 5.2 - uTime * 6.4 + ph + v * 1.3) * 1.56 * u + sin(u * 5.2 - uTime * 6.4 + ph + v * 1.3) * 0.3;
    w *= gust; dw *= gust;
    float wa = (aRnd.y - 0.5) * 0.7 + 0.12 * sin(uTime * 0.5 + ph), wc = cos(wa), ws = sin(wa);
    vec2 dir = vec2(uWind.x * wc - uWind.y * ws, uWind.x * ws + uWind.y * wc), perp = vec2(-dir.y, dir.x);
    vec2 xz = dir * (0.12 + u * len * (1. - 0.12 * abs(w))) + perp * w * len * 0.62;
    p = vec3(xz.x, H - 0.25 - v * hoist * (1. - 0.6 * u) - u * u * 0.5 * (1.3 - 0.3 * gust) + sin(u * 7. - uTime * 7.3 + ph) * 0.14 * u, xz.y);
    n = normalize(vec3(perp.x, 0., perp.y) - vec3(dir.x, 0., dir.y) * dw * 0.62);
    vCol = aCol; vUvP = vec3(u, v, 1.);
  }
  vNl = n;
  vec4 mvPosition = modelViewMatrix * vec4(aPos + p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FLAG_FRAG = /* glsl */`
uniform vec3 uGold;
varying vec3 vCol; varying vec3 vNl; varying vec3 vUvP;
#include <common>
#include <fog_pars_fragment>
${LIGHT_PARS}
void main(){
  vec3 n = normalize(vNl), alb = vCol, col;
  if (vUvP.z > 0.5) {                // silk: a gold border and tail band, lit from both sides, a little light coming through
    float bd = max(smoothstep(0.9, 0.94, abs(vUvP.y * 2. - 1.)), 1. - smoothstep(0.015, 0.035, vUvP.x));
    bd = max(bd, smoothstep(0.83, 0.86, vUvP.x) * (1. - smoothstep(0.9, 0.93, vUvP.x)));
    alb = mix(alb, uGold, bd * 0.85);
    float ndl = abs(dot(n, uSunDir));
    col = alb * (uSunCol * (0.22 + 0.78 * ndl * ndl) + uSkyAmb * 1.6);
  } else col = lit(alb, n, 0.3, 1.);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const TREE_VERT = /* glsl */`
attribute vec3 aPos; attribute vec3 aScl; attribute vec3 aCol;
uniform sampler2D uNoise; uniform float uTime;
varying vec3 vCol; varying vec3 vNl; varying vec3 vObj; varying vec3 vLp;
#include <common>
#include <fog_pars_vertex>
void main(){
  float c = cos(aScl.z), s = sin(aScl.z);
  float lump = textureLod(uNoise, position.xz * 0.37 + position.y * 0.21 + aScl.z, 0.).r;
  vec3 q = position * (0.74 + 0.52 * lump); q.y = max(q.y, -0.55);
  vec3 p = vec3(q.x * c + q.z * s, q.y, q.z * c - q.x * s) * vec3(aScl.x, aScl.y, aScl.x);
  float sway = sin(uTime * 1.3 + aPos.x * 0.21 + aPos.z * 0.17 + p.y * 0.6) + 0.5 * sin(uTime * 2.9 + aPos.z * 0.4 + p.x);
  p.xz += vec2(0.16, 0.1) * sway * (0.4 + 0.3 * q.y);
  vNl = normalize(vec3(position.x * c + position.z * s, position.y * 1.15 + 0.2, position.z * c - position.x * s));
  vObj = q * aScl.x + aScl.z * 3.; vCol = aCol; vLp = aPos + p;
  vec4 mvPosition = modelViewMatrix * vec4(vLp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TREE_FRAG = /* glsl */`
uniform sampler2D uNoise; uniform vec3 uCamL;
varying vec3 vCol; varying vec3 vNl; varying vec3 vObj; varying vec3 vLp;
#include <common>
#include <fog_pars_fragment>
${LIGHT_PARS}
void main(){
  vec2 gr = texture2D(uNoise, vObj.xy * 0.13 + vObj.z * 0.09).gb - 0.5;
  vec3 n = normalize(vNl + vec3(gr.x, gr.y * 0.6, gr.y) * 2.2), V = normalize(uCamL - vLp);
  float l1 = texture2D(uNoise, vObj.xy * 0.33 + vObj.z * 0.21).a, l2 = texture2D(uNoise, vObj.zy * 1.25 + vObj.x * 0.7).r;
  float leaf = l1 * 0.55 + l2 * 0.45, fac = dot(normalize(vNl), V);
  if (fac < 0.44 && texture2D(uNoise, vObj.xy * 0.8 + vObj.z * 0.55).r > 0.27 + fac * 1.25) discard;   // ragged, leafy outline
  vec3 alb = vCol * (0.74 + 0.5 * leaf) * mix(vec3(0.66, 0.5, 0.3), vec3(1.), smoothstep(0.26, 0.5, leaf));   // gaps between sprays of leaves
  float ao = 0.3 + 0.7 * smoothstep(-0.8, 0.7, n.y);
  vec3 col = lit(alb, n, 0.55, ao);
  float back = clamp(dot(V, -uSunDir) * 0.5 + 0.5, 0., 1.);
  col += alb * uSunCol * 0.5 * back * back * (0.4 + 0.6 * leaf);                  // sun through the fans
  col += vCol * uSunCol * 0.14 * smoothstep(0.62, 0.8, l2) * max(dot(n, uSunDir), 0.);   // glints
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
const LEAF_VERT = /* glsl */`
attribute vec4 aS;
uniform float uTime; uniform vec2 uWind; uniform vec3 uCamL, uSunDir, uSunCol, uSkyAmb, uLeaf;
varying vec3 vCol;
#include <common>
#include <fog_pars_vertex>
void main(){
  float ph = fract(aS.y + uTime / 44.), a = uTime * (1.6 + 2.6 * aS.w) + aS.w * 50.;
  vec3 c = vec3(aS.x + sin(uTime * 0.6 + aS.w * 31.) * 2.2, 66. * (1. - ph) + 0.6, aS.z + cos(uTime * 0.47 + aS.w * 17.) * 1.8);
  c.xz += uWind * ph * vec2(60., 60.) * (0.5 + aS.w);
  vec3 r = normalize(vec3(cos(a), 0.4 * sin(1.3 * a), sin(a))), up = normalize(cross(r, vec3(sin(0.7 * a), cos(0.7 * a), 0.3)) + vec3(0., 1e-3, 0.));
  float size = max(0.24, length(uCamL - c) * 0.0024);
  vec3 p = c + (r * position.x + up * position.y) * size;
  vec3 n = cross(r, up);
  vCol = uLeaf * (0.8 + 0.4 * aS.w) * (uSunCol * (0.35 + 0.65 * abs(dot(n, uSunDir))) + uSkyAmb * 1.6) * smoothstep(0., 0.04, ph) * 1.;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LEAF_FRAG = /* glsl */`
varying vec3 vCol;
#include <common>
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(vCol, 1.);
  #include <fog_fragment>
}`;
function fogMaterial(o) {
  o.uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...o.uniforms };
  o.fog = true;
  return new THREE.ShaderMaterial(o);
}

const DEFAULT_PALETTE = ['#2a7f6e', '#8ad8b6', '#f3f0e4', '#b59a63', '#8d897c', '#e6b422', '#b52e25', '#3c4a4b', '#cfe0ea'];
const LIGHTS = {
  day: { sunDir: [-0.6, 0.7, 0.4], sunColor: '#fff1d6', sunIntensity: 3.0, sky: [0.52, 0.59, 0.79], ground: [0.156, 0.175, 0.133], zenith: '#3f78c9', horizon: '#cfe2f2' },
  golden: { sunDir: [-0.74, 0.34, 0.45], sunColor: '#ffb070', sunIntensity: 2.6, sky: [0.31, 0.3, 0.42], ground: [0.04, 0.033, 0.05], zenith: '#2b2a5e', horizon: '#f0a070' },
  night: { sunDir: [-0.6, 0.7, 0.4], sunColor: '#8fa8ff', sunIntensity: 0.5, sky: [0.1, 0.1, 0.11], ground: [0.003, 0.005, 0.009], zenith: '#03050d', horizon: '#101a33' },
};
LIGHTS.dawn = LIGHTS.golden;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
  // every seeded choice is drawn here, in a fixed order, whatever the options say
  const lookDraw = rng.pick(['silt', 'jade', 'festival']), seasonDraw = rng.range(0.75, 1), seed = rng.range(0, 6.283);
  const look = ['jade', 'silt', 'festival'].includes(opts.look) ? opts.look : lookDraw;
  const season = clamp(opts.season ?? seasonDraw, 0, 1), density = clamp(opts.density ?? vary.density ?? 1, 0.6, 1.4);
  const hourIn = opts.hour ?? vary.hour, hour = LIGHTS[hourIn] ? hourIn : 'day';
  const rare = opts.rare ?? !!vary.rare, detail = ctx.quality?.detail ?? 1;
  const P = DEFAULT_PALETTE.map((h, i) => new THREE.Color((opts.palette && opts.palette[i]) || h));
  const C = (h) => new THREE.Color(h);
  const deep = P[0].clone(), foam = P[2].clone(), gold = P[5].clone(), jade = P[1].clone();
  let turbid = 0.35;
  if (look === 'silt') { turbid = 0.55; deep.lerp(P[3], 0.12); foam.lerp(P[3], 0.1); gold.lerp(C('#d98a1c'), 0.45); jade.lerp(C('#e2b45c'), 0.3).multiplyScalar(0.62); }      // the silt tide is lit through amber, not green
  if (look === 'festival') { turbid = 0.2; deep.lerp(C('#1d6f86'), 0.5); }
  const pal = {
    stone: P[4].clone(), stoneLight: P[4].clone().multiplyScalar(1.2), stonePale: P[4].clone().lerp(C('#ffffff'), 0.32), rubble: P[4].clone().multiplyScalar(0.55),
    paving: P[4].clone().lerp(P[3], 0.3).multiplyScalar(1.1), grass: C('#58703d').lerp(gold, 0.08), tile: P[7].clone().multiplyScalar(1.25), tileEdge: P[7].clone().lerp(C('#b9c4bb'), 0.6),
    tileGreen: C('#2f5f52'), timber: P[6].clone().multiplyScalar(0.95), timberDark: C('#5a2419'), plaster: C('#e3d4b2'), bracket: C('#2c5953'), opening: C('#1c1310'),
    gold: C('#e3b341').multiplyScalar(1.3), rock: C('#6f6c66'), rockWarm: C('#9a8566'), moss: C('#5d6a3a'), wetRock: C('#2c3430'), litter: gold.clone().multiplyScalar(0.62).lerp(C('#7a6a2c'), 0.25),
  };
  const Lp = { ...LIGHTS[hour], ...(opts.light || {}) };
  const st = { boreZ: opts.boreZ ?? 150, lead: LEAD, plume: 1, seed, rare, crossD: -100 };
  const U = {
    uTime: { value: 0 }, uBoreZ: { value: st.boreZ }, uLead: { value: LEAD }, uPlume: { value: 1 }, uSeed: { value: seed }, uRare: { value: rare ? 1 : 0 }, uCrossD: { value: -100 },
    uNoise: { value: null }, uSunDir: { value: new THREE.Vector3() }, uSunCol: { value: new THREE.Color() }, uSkyAmb: { value: new THREE.Color() }, uGroundAmb: { value: new THREE.Color() },
    uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uCamL: { value: new THREE.Vector3(0, 50, 300) },
    uLamp: { value: hour === 'night' ? 1 : hour === 'day' ? 0 : 0.6 }, uLampCol: { value: C('#ffb45e').multiplyScalar(3.4) }, uWet: { value: opts.wet ?? 0.25 },
    uWind: { value: new THREE.Vector2(-0.24, -0.97) }, uTrail: { value: 11 }, uPlumeH: { value: rare ? 1.22 : 1 }, uNearFade: { value: new THREE.Vector2(opts.sprayNear ? opts.sprayNear[0] : -2, opts.sprayNear ? opts.sprayNear[1] : -1) }, uTurbid: { value: turbid }, uRefl: { value: hour === 'night' ? 0.95 : 0.86 }, uFresP: { value: hour === 'golden' || hour === 'dawn' ? 3.3 : 5 }, uLow: { value: hour === 'golden' || hour === 'dawn' ? 1 : 0 }, uDim: { value: hour === 'day' ? 0 : 1 },
    uBurst: { value: new THREE.Vector4(0, 0, 1, 0) }, uBurstK: { value: 0 }, uReach: { value: 0 }, uRid: { value: new THREE.Vector4(1e5, 0, 1e5, 0) },
    uLampR: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, -1e5, 0, 0)) }, uLampC: { value: new THREE.Color(0, 0, 0) }, uLampP: { value: new THREE.Color(0, 0, 0) },      // lamps whose light lies on the face (x, z, strength: a world sets them), its colour; lantern light on the parasols      // a hull the lip bursts against (its centre x, z and half its length along its heading); off until a world sets it
    uDeep: { value: deep }, uJade: { value: jade }, uFoam: { value: foam.clone().multiplyScalar(0.92) }, uSilt: { value: P[3].clone().lerp(P[1], 0.3) }, uGold: { value: C('#e3b341') }, uLeaf: { value: gold.clone() },
  };
  const setLight = (l = {}) => {
    Object.assign(Lp, l);
    const col = (v, t) => (Array.isArray(v) ? t.setRGB(v[0], v[1], v[2]) : v && v.isColor ? t.copy(v) : t.set(v));
    const d = Lp.sunDir; U.uSunDir.value.set(d.x ?? d[0], d.y ?? d[1], d.z ?? d[2]).normalize();
    col(Lp.sunColor, U.uSunCol.value).multiplyScalar((Lp.sunIntensity ?? 3) / Math.PI);
    col(Lp.sky, U.uSkyAmb.value).multiplyScalar(1 / Math.PI); col(Lp.ground, U.uGroundAmb.value).multiplyScalar(1 / Math.PI);
    col(Lp.zenith, U.uZenith.value); col(Lp.horizon, U.uHorizon.value);
  };
  setLight();
  const group = new THREE.Group(); group.name = 'silver-dragon-bore';
  await ctx.yield();
  U.uNoise.value = await makeNoiseTexture(rng.fork('noise'), ctx);
  await ctx.yield();

  // ----- stone, tile and timber -----
  const archMat = makeArchMaterial(U);
  const addMesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; group.add(m); return m; };
  const rA = rng.fork('arch');
  let b = makeBuilder();
  await buildGate(b, pal, rA, ctx); await ctx.yield();
  const pagodaTip = await buildPagoda(b, pal, rA, ctx); await ctx.yield();
  addMesh(await b.toGeometrySteps(ctx), archMat, 'gate-and-pagoda'); await ctx.yield();
  // pavilions on the promenade (a large viewing hall near the gate, smaller ones down the wall)
  b = makeBuilder();
  const pavs = [], rP = rng.fork('pavilions'), tmp = new THREE.Vector3();
  const pavZ = [96, 205, 330, 470, 640, 820, 1020, 1240];
  for (let i = 0; i < pavZ.length; i++) {
    const z = pavZ[i] + rP.range(-22, 22), off = -rP.range(8, 13), r = i === 0 ? 4.6 : rP.range(2.9, 3.9), n = rP.chance(0.5) ? 6 : 4, two = i === 0 || rP.chance(0.35);
    wallPoint(z, off, 9.05, tmp);
    buildPavilion(b, pal, rP, tmp.x, tmp.y, tmp.z, -Math.asin(SIN0 + z / RW), i === 0 ? 6 : n, r, two);
    pavs.push({ x: tmp.x, z: tmp.z, r: r + 2.4 });
    await ctx.yield();
  }
  await ctx.yield();
  addMesh(await b.toGeometrySteps(ctx), archMat, 'pavilions'); await ctx.yield();
  addMesh(await buildWallGeometry(pal, noise, ctx), archMat, 'seawall'); await ctx.yield();
  const bluff = makeBluff(noise);
  addMesh(await buildBluffGeometry(bluff, pal, noise, ctx), archMat, 'bluff'); await ctx.yield();
  b = makeBuilder();
  const stair = buildStair(b, pal, bluff); await ctx.yield();
  const stair2 = await buildFaceStair(b, pal, bluff, ctx); await ctx.yield();
  addMesh(await b.toGeometrySteps(ctx), archMat, 'bluff-stair'); await ctx.yield();
  const nearStair = (x, z, r) => {
    const L = x > 30 && x < 63 && z > -34 ? stair2 : x < -14 || x > 28 || z > -19 || z < -75 ? null : stair; if (!L) return false;
    for (let i = 0; i < L.length; i += 2) { const q = L[i]; if ((x - q.x) ** 2 + (z - q.z) ** 2 < r * r) return true; } return false;
  };
  if (opts.land !== false) {
    // preview bank: fields beyond the dyke and a band of grey roofs
    b = makeBuilder();
    const rL = rng.fork('land'), offs = [3, 0, -12, -44, -70, -300, -1200, -3400];
    const row = (z) => offs.map((o, i) => {
      const inWall = z >= 0 && z <= ZE, y = inWall ? [4.2, 4.2, 4.2, 4.2, 3.6, 3.5, 4, 7][i] : z < 0 ? [-3, 5, 8.6, 6, 4, 3.5, 4, 7][i] : [-3, 0.8, 2.5, 3.5, 3.5, 3.5, 4, 7][i];
      const oo = inWall ? Math.min(o, -44) : o;
      return inWall ? wallPoint(z, oo, y).toArray() : [wallX(z) + oo, y, z];
    });
    const zs = axis([[-1800, -40, 220], [-40, 0, 40], [0, ZE, ZE / 26], [ZE, ZE + 60, 60], [ZE + 60, 4200, 280]]);
    let prev = row(zs[0]);
    for (let j = 1; j < zs.length; j++) {
      const cur = row(zs[j]);
      for (let i = 0; i < offs.length - 1; i++) {
        b.kind(7).col(pal.grass.clone().lerp(i > 3 ? C('#7f8f58') : pal.grass, 0.6), 0.03, rL);
        b.quad(prev[i], cur[i], cur[i + 1], prev[i + 1], prev[i][2], offs[i], cur[i][2], offs[i + 1]);
      }
      prev = cur;
    }
    await ctx.yield();
    const nH = 220;
    for (let i = 0; i < nH; i++) {
      const z = 12 + Math.pow(rL(), 1.5) * 1150, off = -52 - Math.pow(rL(), 1.3) * 230, w = rL.range(3.2, 6), l = rL.range(5, 10), h = rL.range(2.6, 4.2), ry = -Math.asin(SIN0 + z / RW) + (rL.chance(0.5) ? Math.PI / 2 : 0) + rL.range(-0.12, 0.12);
      wallPoint(z, off, 3.6, tmp);
      const c = Math.cos(ry), s = Math.sin(ry), q = (x, y, zz) => [tmp.x + x * c + zz * s, tmp.y + y, tmp.z - x * s + zz * c];
      b.kind(0).col(pal.plaster, 0.12, rL); b.box(tmp.x, tmp.y, tmp.z, w, tmp.y + h, l, ry, 1, false);
      b.kind(1).col(pal.tileEdge, 0.15, rL);
      b.quad(q(-w - 0.5, h - 0.2, -l - 0.5), q(-w - 0.5, h - 0.2, l + 0.5), q(0, h + w * 0.55, l + 0.5), q(0, h + w * 0.55, -l - 0.5), 0, 0, 2 * l, w);
      b.quad(q(w + 0.5, h - 0.2, l + 0.5), q(w + 0.5, h - 0.2, -l - 0.5), q(0, h + w * 0.55, -l - 0.5), q(0, h + w * 0.55, l + 0.5), 0, 0, 2 * l, w);
      b.kind(0).col(pal.plaster, 0.1, rL);
      b.tri(q(-w, h, l), q(w, h, l), q(0, h + w * 0.55, l)); b.tri(q(w, h, -l), q(-w, h, -l), q(0, h + w * 0.55, -l));
      if (i % 140 === 139) await ctx.yield();
    }
    addMesh(b.toGeometry(), archMat, 'land-preview'); await ctx.yield();
  }

  // ----- the river and the bore -----
  let sprayGeo = null, sprayBase = 0;
  const lightU = { uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyAmb: U.uSkyAmb, uGroundAmb: U.uGroundAmb };
  const boreU = { uTime: U.uTime, uBoreZ: U.uBoreZ, uLead: U.uLead, uPlume: U.uPlume, uSeed: U.uSeed, uRare: U.uRare, uCrossD: U.uCrossD };
  const waterGeo = buildWaterGeometry(); await ctx.yield();
  const water = addMesh(waterGeo, fogMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
    uniforms: { ...boreU, ...lightU, uNoise: U.uNoise, uDeep: U.uDeep, uJade: U.uJade, uFoam: U.uFoam, uSilt: U.uSilt, uZenith: U.uZenith, uHorizon: U.uHorizon, uCamL: U.uCamL, uTurbid: U.uTurbid, uRefl: U.uRefl, uFresP: U.uFresP, uLow: U.uLow, uDim: U.uDim, uReach: U.uReach, uRid: U.uRid, uLampR: U.uLampR, uLampC: U.uLampC } }), 'river');
  water.frustumCulled = false; await ctx.yield();
  const inst = (base, count, attrs) => {
    const g = new THREE.InstancedBufferGeometry();
    for (const k in base) g.setAttribute(k, new THREE.Float32BufferAttribute(base[k][0], base[k][1]));
    for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
    g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    return g;
  };
  {
    // (after the plume's own sprites, in the same draw: the strikes of the bore on the seawall, from a random stream of their own,
    // and room for white water along every hull a world names with hero.setHulls)
    const n = Math.round(2700 * (0.6 + 0.4 * detail)), rS = rng.fork('spray'), nK = Math.round(450 * (0.6 + 0.4 * detail)), a = new Float32Array((n + nK + HULL_CAP) * 4);
    for (let i = 0; i < n * 4; i++) a[i] = rS();
    { const rK = makeRng(((ctx.seed ?? 1) ^ 0x3b9d17) >>> 0); for (let i = n; i < n + nK; i++) { a[i * 4] = rK(); a[i * 4 + 1] = rK(); a[i * 4 + 2] = rK(); a[i * 4 + 3] = 2 + 0.999 * rK(); } }
    const g = inst({ position: [[-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3] }, n + nK, { aS: [a, 4] });
    sprayGeo = g; sprayBase = n + nK;
    const sprayU = { ...boreU, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyAmb: U.uSkyAmb, uNoise: U.uNoise, uFoam: U.uFoam, uTrail: U.uTrail, uPlumeH: U.uPlumeH, uNearFade: U.uNearFade, uCamL: U.uCamL, uDim: U.uDim, uLow: U.uLow, uBurst: U.uBurst, uBurstK: U.uBurstK, uRid: U.uRid };
    const m = addMesh(g, fogMaterial({ vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, uniforms: { ...sprayU, uHeavy: { value: 0 } } }), 'spray');
    m.frustumCulled = false; m.renderOrder = 3;
    // the crest's feather (same material, a second draw): spindrift and thrown water along the lip near the eye
    const nf = Math.round((hour === 'night' ? 1500 : 1800) * (0.6 + 0.4 * detail)), a2 = new Float32Array(nf * 4);      // (by day it takes more of it to show against the sky)
    for (let i = 0; i < nf * 4; i++) a2[i] = rS();
    for (let i = 0; i < nf; i++) a2[i * 4 + 3] = 1 + a2[i * 4 + 3];
    const g2 = inst({ position: [[-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3] }, nf, { aS: [a2, 4] });
    const m2 = addMesh(g2, m.material, 'crest-feather');
    m2.frustumCulled = false; m2.renderOrder = 3;
    await ctx.yield();
    // water thrown off the roll of the lip, close round the eye (the same program with uHeavy 1; its own random stream, so nothing
    // else moves): torn crowns twice as tall, gouts and ropes that start out at the roll's edge, a little smoke
    const rH = makeRng(((ctx.seed ?? 1) ^ 0x51a7e3) >>> 0), nh = Math.round(820 * (0.6 + 0.4 * detail)), a3 = new Float32Array(nh * 4);
    for (let i = 0; i < nh; i++) { const r = rH(); a3[i * 4] = rH(); a3[i * 4 + 1] = rH(); a3[i * 4 + 2] = rH(); a3[i * 4 + 3] = 1 + (r < 0.22 ? r * 2 : r < 0.6 ? 0.46 + (r - 0.22) * 0.6 : 0.71 + (r - 0.6) * 0.7); }
    const g3 = inst({ position: [[-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3] }, nh, { aS: [a3, 4] });
    const m3 = addMesh(g3, fogMaterial({ vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, uniforms: { ...sprayU, uHeavy: { value: 1 } } }), 'lip-spray');
    m3.frustumCulled = false; m3.renderOrder = 3;
    await ctx.yield();
    // the roll of the lip (see LIP_VERT)
    const lip = addMesh(buildLipGeometry(), fogMaterial({ vertexShader: LIP_VERT, fragmentShader: LIP_FRAG, side: THREE.DoubleSide,
      uniforms: { ...boreU, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyAmb: U.uSkyAmb, uNoise: U.uNoise, uDeep: U.uDeep, uJade: U.uJade, uFoam: U.uFoam, uCamL: U.uCamL, uDim: U.uDim, uLow: U.uLow, uReach: U.uReach, uRid: U.uRid } }), 'lip-roll');
    lip.frustumCulled = false;
    await ctx.yield();
    // water thrown off the crest along the whole front (see THROW_VERT): its places from a stream of its own, made
    // from the seed and a name
    const nT = Math.round(1900 * (0.6 + 0.4 * detail));
    const thr = addMesh(buildThrowGeometry(nT, makeRng(hashSeed('lip-throw:' + ctx.seed))), fogMaterial({ vertexShader: THROW_VERT, fragmentShader: THROW_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { ...boreU, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyAmb: U.uSkyAmb, uNoise: U.uNoise, uFoam: U.uFoam, uJade: U.uJade, uCamL: U.uCamL, uDim: U.uDim, uLow: U.uLow, uRid: U.uRid, uLampR: U.uLampR, uLampC: U.uLampC } }), 'lip-throw');
    thr.frustumCulled = false; thr.renderOrder = 3;
  }
  await ctx.yield();

  // ----- the crowd under parasols -----
  {
    const pos = [], nor = [], part = [], R = 0.95, NSEG = 6;
    const v = (x, y, z, nx, ny, nz, pt) => { pos.push(x, y, z); nor.push(nx, ny, nz); part.push(pt); };
    for (let k = 0; k < NSEG; k++) {
      const a0 = (k / NSEG) * Math.PI * 2, a1 = ((k + 1) / NSEG) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      v(0, 2.5, 0, 0, 1, 0, 0); v(c1 * R, 2.05, s1 * R, c1 * 0.45, 0.89, s1 * 0.45, 0); v(c0 * R, 2.05, s0 * R, c0 * 0.45, 0.89, s0 * 0.45, 0);
    }
    for (let k = 0; k < 3; k++) {
      const a0 = (k / 3) * Math.PI * 2, a1 = ((k + 1) / 3) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), am = (a0 + a1) / 2, nx = Math.cos(am), nz = Math.sin(am);
      v(c0 * 0.33, 0, s0 * 0.33, nx, 0.15, nz, 1); v(c1 * 0.17, 1.38, s1 * 0.17, nx, 0.15, nz, 1); v(c1 * 0.33, 0, s1 * 0.33, nx, 0.15, nz, 1);
      v(c0 * 0.33, 0, s0 * 0.33, nx, 0.15, nz, 1); v(c0 * 0.17, 1.38, s0 * 0.17, nx, 0.15, nz, 1); v(c1 * 0.17, 1.38, s1 * 0.17, nx, 0.15, nz, 1);
      v(c0 * 0.14, 1.4, s0 * 0.14, nx, 0.4, nz, 2); v(0, 1.76, 0, nx, 0.4, nz, 2); v(c1 * 0.14, 1.4, s1 * 0.14, nx, 0.4, nz, 2);
    }
    const rC = rng.fork('crowd'), n = Math.min(2800, Math.round(2450 * density * (0.55 + 0.45 * detail))), extra = 176, stairHi = stair2.filter((q) => q.y > 7);
    const aPos = new Float32Array((n + extra) * 3), aRnd = new Float32Array((n + extra) * 4), aCol = new Float32Array((n + extra) * 3);
    const cols = [P[6], C('#8f1f2a'), C('#d9a441'), C('#e9dfc4'), C('#5fae8f'), C('#2f4a7a'), C('#e0702c')];
    const wts = look === 'festival' ? [7, 3, 1.5, 1.5, 0.5, 0.3, 1.5] : look === 'silt' ? [2, 1, 3, 3, 1, 1.5, 2] : [3, 1.5, 2.5, 2.5, 1.5, 1, 1.5], wsum = wts.reduce((s, w) => s + w, 0);
    for (let i = 0; i < n + extra; i++) {
      const u1 = rC(), u2 = rC(), u3 = rC(), u4 = rC(), u5 = rC(), u6 = rC(), u7 = rC();
      if (i < n) {
        const z = 5 + (ZE - 12) * Math.pow(u1, 1.55); let off = -0.95 - Math.pow(u2, 2.3) * 21.5;
        wallPoint(z, off, 0, tmp);
        for (const p of pavs) if ((tmp.x - p.x) ** 2 + (tmp.z - p.z) ** 2 < p.r * p.r) { off = -0.95 - u2 * 3.2; wallPoint(z, off, 0, tmp); break; }
        aPos[i * 3] = tmp.x; aPos[i * 3 + 1] = lerp(9.12, 9.0, clamp(-off / 24, 0, 1)); aPos[i * 3 + 2] = tmp.z;
      } else if (i < n + 62) { aPos[i * 3] = lerp(GATE.X0 + 4.5, GATE.X1 - 4.5, u1); aPos[i * 3 + 1] = GATE.YT; aPos[i * 3 + 2] = -3 - u2 * 4.6; }
      else if (i < n + 120) { const a = u1 * Math.PI * 2, r = 12.6 + u2 * 4.8; aPos[i * 3] = PAG.x + Math.cos(a) * r; aPos[i * 3 + 1] = PAG.y + 2.5; aPos[i * 3 + 2] = PAG.z + Math.sin(a) * r; }
      else { const L = i < n + 148 ? stair : stairHi, q = L[Math.min(L.length - 1, Math.floor(u1 * L.length))], o = (u2 * 2 - 1) * 1.1; aPos[i * 3] = q.x - q.dz * o; aPos[i * 3 + 1] = q.y; aPos[i * 3 + 2] = q.z + q.dx * o; }      // climbing the stair
      let w = u3 * wsum, k = 0; while (k < wts.length - 1 && w > wts[k]) { w -= wts[k]; k++; }
      const sh = 0.72 + 0.4 * u4;
      aCol[i * 3] = cols[k].r * sh; aCol[i * 3 + 1] = cols[k].g * sh; aCol[i * 3 + 2] = cols[k].b * sh;
      aRnd[i * 4] = u4; aRnd[i * 4 + 1] = u5; aRnd[i * 4 + 2] = u6; aRnd[i * 4 + 3] = u7;
      if (i % 800 === 799) await ctx.yield();
    }
    const g = inst({ position: [pos, 3], normal: [nor, 3], aPart: [part, 1] }, n + extra, { aPos: [aPos, 3], aRnd: [aRnd, 4], aCol: [aCol, 3] });
    const m = addMesh(g, fogMaterial({ vertexShader: CROWD_VERT, fragmentShader: CROWD_FRAG, side: THREE.DoubleSide,
      uniforms: { ...lightU, uTime: U.uTime, uBoreZ: U.uBoreZ, uLead: U.uLead, uPlume: U.uPlume, uLampP: U.uLampP } }), 'parasols');
    m.frustumCulled = false;
    await ctx.yield();
    // The rest of the ten thousand: a second draw of lighter parasols (the same canopy over a three-sided figure, 9 triangles),
    // thickest along the 600 m of wall nearest the gate, where the eye runs. They are drawn from the crowd's own random stream
    // after everything above, so nothing that was there has moved.
    {
      const pos2 = [], nor2 = [], part2 = [], v2 = (x, y, z, nx, ny, nz, pt) => { pos2.push(x, y, z); nor2.push(nx, ny, nz); part2.push(pt); };
      for (let k = 0; k < NSEG; k++) {
        const a0 = (k / NSEG) * Math.PI * 2, a1 = ((k + 1) / NSEG) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        v2(0, 2.5, 0, 0, 1, 0, 0); v2(c1 * R, 2.05, s1 * R, c1 * 0.45, 0.89, s1 * 0.45, 0); v2(c0 * R, 2.05, s0 * R, c0 * 0.45, 0.89, s0 * 0.45, 0);
      }
      for (let k = 0; k < 3; k++) {
        const a0 = (k / 3) * Math.PI * 2, a1 = ((k + 1) / 3) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), am = (a0 + a1) / 2, nx = Math.cos(am), nz = Math.sin(am);
        v2(c0 * 0.33, 0, s0 * 0.33, nx, 0.2, nz, 1); v2(0, 1.74, 0, nx, 0.2, nz, 1); v2(c1 * 0.33, 0, s1 * 0.33, nx, 0.2, nz, 1);
      }
      const n2 = Math.min(6600, Math.round(5600 * density * (0.5 + 0.5 * detail)));
      const bPos = new Float32Array(n2 * 3), bRnd = new Float32Array(n2 * 4), bCol = new Float32Array(n2 * 3);
      for (let i = 0; i < n2; i++) {
        const u1 = rC(), u2 = rC(), u3 = rC(), u4 = rC(), u5 = rC(), u6 = rC(), u7 = rC();
        const z = 6 + 640 * Math.pow(u1, 1.2); let off = -0.95 - Math.pow(u2, 1.7) * 22;
        wallPoint(z, off, 0, tmp);
        for (const p of pavs) if ((tmp.x - p.x) ** 2 + (tmp.z - p.z) ** 2 < p.r * p.r) { off = -0.95 - u2 * 3.2; wallPoint(z, off, 0, tmp); break; }
        bPos[i * 3] = tmp.x; bPos[i * 3 + 1] = lerp(9.12, 9.0, clamp(-off / 24, 0, 1)); bPos[i * 3 + 2] = tmp.z;
        let w = u3 * wsum, k = 0; while (k < wts.length - 1 && w > wts[k]) { w -= wts[k]; k++; }
        const sh = 0.72 + 0.4 * u4;
        bCol[i * 3] = cols[k].r * sh; bCol[i * 3 + 1] = cols[k].g * sh; bCol[i * 3 + 2] = cols[k].b * sh;
        bRnd[i * 4] = u4; bRnd[i * 4 + 1] = u5; bRnd[i * 4 + 2] = u6; bRnd[i * 4 + 3] = u7;
        if (i % 700 === 699) await ctx.yield();
      }
      const gB = inst({ position: [pos2, 3], normal: [nor2, 3], aPart: [part2, 1] }, n2, { aPos: [bPos, 3], aRnd: [bRnd, 4], aCol: [bCol, 3] });
      const mB = addMesh(gB, m.material, 'parasols-more');
      mB.frustumCulled = false;
    }
  }
  await ctx.yield();

  // ----- banner poles with red silk -----
  {
    const pos = [], nor = [], part = [], FU = 6, FV = 4;
    const v = (x, y, z, nx, ny, nz, pt) => { pos.push(x, y, z); nor.push(nx, ny, nz); part.push(pt); };
    for (let k = 0; k < 5; k++) {
      const a0 = (k / 5) * Math.PI * 2, a1 = ((k + 1) / 5) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      v(c0 * 0.11, 0, s0 * 0.11, c0, 0, s0, 0); v(c1 * 0.055, 1, s1 * 0.055, c1, 0, s1, 0); v(c1 * 0.11, 0, s1 * 0.11, c1, 0, s1, 0);
      v(c0 * 0.11, 0, s0 * 0.11, c0, 0, s0, 0); v(c0 * 0.055, 1, s0 * 0.055, c0, 0, s0, 0); v(c1 * 0.055, 1, s1 * 0.055, c1, 0, s1, 0);
    }
    for (let i = 0; i < FU; i++) for (let j = 0; j < FV; j++) {
      const u0 = i / FU, u1 = (i + 1) / FU, v0 = j / FV, v1 = (j + 1) / FV;
      v(u0, v0, 0, 0, 0, 1, 1); v(u1, v0, 0, 0, 0, 1, 1); v(u1, v1, 0, 0, 0, 1, 1); v(u0, v0, 0, 0, 0, 1, 1); v(u1, v1, 0, 0, 0, 1, 1); v(u0, v1, 0, 0, 0, 1, 1);
    }
    const rF = rng.fork('flags'), n = Math.round((look === 'festival' ? 84 : 56) * Math.sqrt(density)), extra = 6;
    const aPos = new Float32Array((n + extra) * 3), aRnd = new Float32Array((n + extra) * 4), aCol = new Float32Array((n + extra) * 3);
    const fc = [P[6], P[6], P[6].clone().lerp(C('#ff5a2a'), 0.3), C('#d9a441'), C('#e9dfc4').multiplyScalar(hour === 'night' ? 0.45 : 1), C('#2f4a7a')];      // (under the moon cream silk would be the brightest thing on the wall)
    for (let i = 0; i < n + extra; i++) {
      const u1 = rF(), u2 = rF(), u3 = rF(), u4 = rF(), u5 = rF();
      let low = 1;      // (along the last 200 m before the gate the poles are shorter: the eye passes 20 m off them there, and at full height their flags were cut off by the top of the frame)
      if (i < n) { const z = 8 + (ZE - 20) * Math.pow((i + u1 * 0.8) / n, 1.5); wallPoint(z, -1.7 - u2 * 1.2, 9.1, tmp); low = lerp(0.6, 1, smoothstep(60, 210, z)); }
      else if (i < n + 2) tmp.set(i === n ? GATE.X0 + 1.2 : GATE.X1 - 1.2, GATE.YT + 1.9, 0.2);
      else { const a = Math.PI / 8 + ((i - n - 2) / 4) * Math.PI * 2 + Math.PI / 4; tmp.set(PAG.x + Math.cos(a) * 19.6, PAG.y + 1.2, PAG.z + Math.sin(a) * 19.6); }
      aPos[i * 3] = tmp.x; aPos[i * 3 + 1] = tmp.y; aPos[i * 3 + 2] = tmp.z;
      const big = i >= n ? 1.25 : 1;
      aRnd[i * 4] = (8.5 + 3.5 * u3) * big * low; aRnd[i * 4 + 1] = u4; aRnd[i * 4 + 2] = (3.2 + 1.8 * u5) * big * (0.5 + 0.5 * low); aRnd[i * 4 + 3] = (2.1 + 1.0 * u2) * big * (0.5 + 0.5 * low);
      const c = i >= n ? fc[0] : fc[Math.floor(Math.pow(u1, look === 'festival' ? 2.2 : 1.5) * fc.length)];
      aCol[i * 3] = c.r; aCol[i * 3 + 1] = c.g; aCol[i * 3 + 2] = c.b;
    }
    const g = inst({ position: [pos, 3], normal: [nor, 3], aPart: [part, 1] }, n + extra, { aPos: [aPos, 3], aRnd: [aRnd, 4], aCol: [aCol, 3] });
    const m = addMesh(g, fogMaterial({ vertexShader: FLAG_VERT, fragmentShader: FLAG_FRAG, side: THREE.DoubleSide,
      uniforms: { ...lightU, uTime: U.uTime, uBoreZ: U.uBoreZ, uLead: U.uLead, uPlume: U.uPlume, uWind: U.uWind, uGold: U.uGold } }), 'banners');
    m.frustumCulled = false;
  }
  await ctx.yield();

  // ----- gold ginkgo on the bluff, and leaves coming down -----
  {
    const rT = rng.fork('trees'), want = Math.round(840 * (0.8 + 0.2 * Math.min(density, 1))), aPos = [], aScl = [], aCol = [];
    const amber = C('#d98a1c'), green = C('#a9b13a'), pine = C('#3f5a34'), col = new THREE.Color();
    for (let i = 0; i < 3000 && aPos.length / 3 < want; i++) {
      const u1 = rT(), u2 = rT(), u3 = rT(), u4 = rT(), u5 = rT(), u6 = rT();
      let x, z, y;
      if (i % 12 === 11) { wallPoint(8 + u1 * u1 * 620, -29 - u2 * 13, 0, tmp); x = tmp.x; z = tmp.z; y = lerp(8.4, 4.4, clamp((-29 - u2 * 13 + 27.5) / -16.5, 0, 1)); }
      else {
        x = BLUFF.x + (u1 * 2 - 1) * BLUFF.a; z = BLUFF.z + (u2 * 2 - 1) * BLUFF.b; y = bluff.heightAt(x, z);
        if (y < 9 || bluff.rho(x, z) > 0.925 || Math.hypot(x - PAG.x, z - PAG.z) < 22.5 || (x > GATE.X0 - 3 && x < GATE.X1 + 3 && z > GATE.ZB - 2) || nearStair(x, z, 6.2)) continue;
      }
      const sx = 3.4 + 2.6 * u3 + 1.0 * u4, sy = sx * (0.62 + 0.3 * u4);
      col.copy(gold).lerp(amber, 0.22 + u5 * 0.55).lerp(green, (1 - season) * (0.4 + 0.6 * u6) + (u6 > 0.9 ? 0.35 : 0)).multiplyScalar(0.74 + 0.4 * u4);
      if (u5 > 0.94) col.copy(pine).multiplyScalar(0.8 + 0.4 * u4);
      aPos.push(x, y + sy * 0.5 + 2.6 + 3.4 * u5 * u3, z); aScl.push(sx, sy, u6 * 6.283); aCol.push(col.r, col.g, col.b);
      if (i % 40 === 39) await ctx.yield();
    }
    await ctx.yield();
    const rG = rng.fork('ledges'), scrub = C('#6c7a34');
    for (let i = 0, got = 0; i < 3000 && got < 230; i++) {
      const u1 = rG(), u2 = rG(), u3 = rG(), u4 = rG(), u5 = rG();
      if (i % 40 === 39) await ctx.yield();
      const x = BLUFF.x + (u1 * 2 - 1) * BLUFF.a * 1.03, z = BLUFF.z + (u2 * 2 - 1) * BLUFF.b * 1.03, r = bluff.rho(x, z);
      if (r < 0.85 || r > 0.987 || (x > GATE.X0 - 3 && x < GATE.X1 + 3 && z > GATE.ZB - 2) || nearStair(x, z, 4)) continue;
      const y = bluff.heightAt(x, z);
      if (y < 6.8 || Math.abs(bluff.heightAt(x + 1.5, z) - y) > 1.5 || Math.abs(bluff.heightAt(x, z + 1.5) - y) > 1.5) continue;     // only on the benches, above the tide
      const kindT = u5 < 0.4 ? 0 : u5 < 0.72 ? 1 : 2, sx = kindT === 2 ? 1.5 + 1.5 * u3 : 1.5 + 2.4 * u3 * u3, sy = sx * (kindT === 2 ? 1.5 : 0.62 + 0.3 * u4);
      if (kindT === 0) col.copy(gold).lerp(amber, 0.2 + u4 * 0.5); else if (kindT === 1) col.copy(scrub).lerp(gold, 0.25 * u4); else col.copy(pine);
      col.multiplyScalar(0.72 + 0.4 * u4);
      aPos.push(x, y + sy * 0.45, z); aScl.push(sx, sy, u3 * 6.283); aCol.push(col.r, col.g, col.b); got++;
    }
    await ctx.yield();
    const base = new THREE.OctahedronGeometry(1, 1);
    const g = inst({ position: [base.attributes.position.array, 3] }, aPos.length / 3, { aPos: [new Float32Array(aPos), 3], aScl: [new Float32Array(aScl), 3], aCol: [new Float32Array(aCol), 3] });
    base.dispose(); await ctx.yield();
    const m = addMesh(g, fogMaterial({ vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, uniforms: { ...lightU, uTime: U.uTime, uNoise: U.uNoise, uCamL: U.uCamL } }), 'ginkgo');
    m.frustumCulled = false; await ctx.yield();
    const rL2 = rng.fork('leaves'), nl = Math.round(760 * (0.45 + 0.55 * season) * (0.6 + 0.4 * detail)), aS = new Float32Array(nl * 4);
    for (let i = 0; i < nl; i++) { aS[i * 4] = -70 + rL2() * 250; aS[i * 4 + 1] = rL2(); aS[i * 4 + 2] = -175 + rL2() * 300; aS[i * 4 + 3] = rL2(); }
    const gl = inst({ position: [[-0.5, 0, 0, 0, -0.36, 0, 0.5, 0, 0, -0.5, 0, 0, 0.5, 0, 0, 0, 0.36, 0], 3] }, nl, { aS: [aS, 4] });
    const ml = addMesh(gl, fogMaterial({ vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uWind: U.uWind, uCamL: U.uCamL, uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyAmb: U.uSkyAmb, uLeaf: U.uLeaf } }), 'leaves');
    ml.frustumCulled = false;
  }
  await ctx.yield();

  // ----- controls -----
  const H = makeHeightAt(st), boreFrom = opts.boreFrom ?? 1500, boreTo = opts.boreTo ?? -14;
  const setBore = (z) => {
    st.boreZ = z; st.plume = smoothstep(ZE + 80, ZE - 150, z); st.lead = LEAD * st.plume;
    st.crossD = rare ? 0.9 * (z - (opts.crossAt ?? 400)) : -100;     // where the crossing tide meets the bore: it runs in to the wall as the bore comes up the river
    U.uBoreZ.value = z; U.uPlume.value = st.plume; U.uLead.value = st.lead; U.uCrossD.value = st.crossD;
  };
  setBore(st.boreZ);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const fly = [V3(wallX(1150) + 420, 3.2, 1150), V3(wallX(900) + 190, 4.2, 900)];
  for (const z of [700, 520, 380, 260]) fly.push(wallPoint(z, 23, 4.2));
  fly.push(wallPoint(175, 21, 4.4), wallPoint(115, 16, 4.8), V3(0, 5.4, 72), V3(0, 6.6, 30), V3(0, 7.3, -3));
  const anchors = {
    portalSeat: { position: V3(0, 7.3, -3), facing: V3(0, 0, 1), shape: 'arch', width: 14, height: 14.6, radius: 7 },
    flyThrough: fly,
    opening: { position: V3(wallX(1000) + 260, 2.2, 1000), lookAt: V3(wallX(1000) + 420, 3, 2600) },
    pagodaBase: V3(PAG.x, PAG.y, PAG.z), pagodaTip: V3(PAG.x, pagodaTip, PAG.z), gateCrown: V3(0, GATE.SP + GATE.A, 0), bluffTop: V3(PAG.x, PAG.y, PAG.z), wallEnd: wallPoint(ZE, 0, WALL_TOP),
    viewpoints: [
      { position: V3(6, 9, 190), lookAt: V3(20, 34, -40) },
      { position: wallPoint(300, 60, 8), lookAt: wallPoint(270, 3, 10) },
      { position: V3(260, 120, 330), lookAt: V3(20, 30, 0) },
    ],
    wall: { xAt: wallX, pointAt: wallPoint, zEnd: ZE, top: WALL_TOP },
    bore: { speed: 11, height: HB, swells: 5, wavelength: LAM, lead: LEAD },
  };
  const inv = new THREE.Matrix4(), camW = new THREE.Vector3();
  const hero = {
    object: group, radius: 140, height: 60, center: V3(22, 40, 30), anchors, ground: false, groundY: 0,
    look, hour, season, rare, uniforms: U, wallX,
    setBore, setProgress(u) { setBore(lerp(boreFrom, boreTo, clamp(u, 0, 1))); },
    setLight, setLamp(v) { U.uLamp.value = v; },
    heightAt: H.heightAt,
    frontZ(x, z) { return H.zFront(x - wallX(z)); },
    // white water along hulls at anchor while the lip is under them: list of [x, z, heading (0 = bow toward +X), half length]
    setHulls(list) {
      const at = sprayGeo.attributes.aS, arr = at.array, per = Math.max(4, Math.min(14, Math.floor(HULL_CAP / Math.max(list.length, 1)))), hr = makeRng(90731);
      let q = sprayBase;
      for (const [x, z, h, half] of list) for (let j = 0; j < per && q < sprayBase + HULL_CAP; j++, q++) {
        const t = ((j + hr()) / per) * 2 - 1, sd = j % 2 ? 1 : -1, c = Math.cos(h), sn = Math.sin(h), off = sd * 2.2 * (1 - 0.6 * t * t);
        arr[q * 4] = x + c * half * t - sn * off; arr[q * 4 + 1] = z + sn * half * t + c * off; arr[q * 4 + 2] = hr(); arr[q * 4 + 3] = 3.5;
      }
      sprayGeo.instanceCount = q; at.needsUpdate = true;
    },
    plumeAt(out = new THREE.Vector3()) { const z = Math.max(st.boreZ - st.lead, 3); return out.set(wallX(z) + 3.4, 9, z); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) {
        camW.setFromMatrixPosition(camera.matrixWorld);
        U.uCamL.value.copy(camW).applyMatrix4(inv.copy(group.matrixWorld).invert());
      }
    },
    dispose() {},
  };
  return hero;
}
