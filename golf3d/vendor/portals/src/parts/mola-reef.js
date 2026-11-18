// THE BRAIN CORAL: hero set piece for the world "mola-reef" (The Reef Sewn in Layers).
//
// What it is
//   A brain-coral dome 36 m across and 14 m high (spherical cap, radius 18.6 m) sewn as a Guna mola:
//   a red quilted hill cut by one labyrinth of grooves, every groove cut down through stacked cloth
//   (red ridge, orange step, turquoise step, black floor). The grooves wind ROUND the hill (their phase is the distance
//   from the crown, warped, with a few forks), so from any side they read as level winding ridges and none runs
//   downhill. Winding round it is the MASTER GROOVE: an UPRIGHT
//   trench on a rampart, a level bench cut into the hill. Behind the uphill shoulder stands THE BANK: three level cloth
//   steps (floor cloth, then the two step cloths, a lozenge row and a hem on each riser) that are part of the slot's
//   own swept strip and climb to the natural hill, whose first metre is a plain hem of top cloth; the steps rise
//   VERTICALLY from the bench plane (not along the lane's leaning up), and the dome's grid, which can only move
//   vertically, is cut to a ramp 0.35 m under them, so no displaced, smeared maze shows, even under the 6 m bank of the
//   mouth (where the dome does show round the bank's ends, attribute aBK, it is the hill's hem, below). On the downhill side the rampart's own stepped, banded outer
//   wall stands on the flank or the apron, or, where the drop is small, the dome is filled up to the bench over 4 m
//   (never within the first 20 m of the slot: at the mouth the stepped wall goes down to the apron). Wherever the
//   dome's own grid is cut or filled for the bench (attribute aDF), and within 4.5 m of the lane where the maze is
//   held off, the hill is its own RIDGE CLOTH, red, sewn with level rows of lozenge cuts 0.8 m apart (THE HILL'S HEM in
//   domeFrag): no level band of another cloth is laid on the dome, so nothing crosses the maze's lines; the maze's
//   coarse lobe cut is dropped where it would be wider than a quarter metre a pixel.
//   THE MOUTH is a round forecourt at bench level: the whole profile is revolved a quarter turn about the lane's first
//   point (APSE in the sweep), so the bank ends as a stepped half-bowl and the rampart as a round bastion (a plate in
//   the back plane closes the slit between the two halves' different outlines). The slot is
//   3.2 m wide at the lip, 2 m at the floor and 2.4 m deep, built as real geometry: three risers of 0.8 m with
//   0.3 m setbacks, a fat rolled hem on each lip, violet shadow beneath, and on every riser two staggered rows of
//   cuts, a piping line and stitch dashes; the main row is a different mola panel every 14 m (slits, a zigzag,
//   stepped crosses, a row of small fish: motif() in slotFrag, the two cut colours swapping by panel, a seam bar
//   between panels); the black floor has slit rows and a dashed centre seam. It starts as
//   a ramp at the front of the foot (the mouth, 4.2 m wide, at about (-1.5, 3.6, 17.3) heading -X for winding +1;
//   mirrored in X for winding -1), runs three quarters of a lap round the lower flank, hooks back over the front
//   flank on an 8 m radius and crosses the crown heading -Z, where the floor ramps up and the walls fall away.
//   About 110 m long. Its up vector is vertical but for a lean into the bend of at most 12.6 degrees, the same
//   lean the engine's camera takes (see buildLane), so the camera sits square in the trench: floor at bottom
//   centre, both walls 1.5 m above the eye (the eye line lifts 1.3 m through each window, from 8 m before it to 8 m after,
//   so the ride looks out and down over the lowered wall). It climbs at up to 24.5 degrees; tightest bend 7.5 m.
//   An echo groove runs parallel on both sides of the rampart, and a scalloped four-band apron lies
//   round the foot on the sand.
//   THE APRON OF TIERS (an amendment of the brief, by the designers' ruling: tiers only at the mouth, as the groove's
//   own apron at the dome's foot): beside the mouth (lane azimuth 24 to about 83 degrees) the foot of the hill, from the
//   sand up to the bench the mouth stands on, is TIERS = 2 LEVEL tiers of about 2 m, real geometry in the slot's own mesh
//   (q from 30 on): each tier one cloth, a tall riser with a main row of big lozenges or stepped crosses (tierCloth,
//   tierKind), a small foot row, a straight rolled hem and a tread. Above the bench the hill is maze and ridge cloth.
//   A wall that stands on the tiers (aSQ.w = 2, flagged per station in L.tz), the bowl's rim wall and the back seam's
//   plate (aSQ.z = 2) are painted with the same tiers by world height (terWall, uniform uTer). ABOVE THE LAST REAL TIER
//   (the bench's own level) the rim wall and the plate are the hill behind the bowl: the ridge cloth of the look's
//   stack with the hill's hem rows carried on by world height and the wall's own metres (hillWall; by the designers' word of 11 Oct:
//   black is the floor of a cut and never the face of a hill). On the rampart's base wall beside the terrace the tiers
//   go on up the wall past the last real one, level, to the floor-cloth band at the foot of the wall's own three
//   risers, as the old cloth had them (polish 2, order 4; the hill's cloth laid there earlier in polish 2 is taken off
//   again). Above the last real tier, where no tier stands beside the wall to carry a row on, each row is fitted to the
//   wall itself (wallTier, uniform uTw): a whole number of cells between the wall's two ends, and under the band's
//   slanting edge each figure made smaller until it stands whole, or left out where there is no room for it.
//   Riser motifs are laid out in TRUE metres (aSQ.w = metres of cloth per q unit): where a wall is lower than a full
//   step (the windows, the mouth, the crown, the bank) a motif is drawn at its own size or left out, never squashed. A
//   panel is 14 m = 20 cells of 0.7 m with a diamond medallion on each joint, so no motif is cut by a panel's end.
//   WINDOWS: at a window the OUTER wall keeps its first riser, lowered to half a metre (one lozenge row and its hem),
//   and the two risers above close up, leaving the treads and the shoulder flat behind it. The first window is 16 m long
//   (29 to 30.5% along the slot), the second 9 m (80 to 81%), after the octopus gate (72%).
//   THE OUTER CREST: a crescent of the same colony across a moat from the first window (68 m along an arc of radius
//   32 m, 18 m across; its ridge stands 2.6 m above the eye line at the window; a tent in section, tapering to nothing
//   at both ends). Its ridge and outer flank wear the raw maze (texture channel B, no lane cut) laid round its own ridge
//   line in true metres (crestUV); its INNER flank, the one the window looks down on, is cut in level tiers of 0.8 m
//   on contour rows and sewn with the tier cloth (aDF = 1 on the crest), so every hem there is a level line. The maze band
//   under the ridge ends on the top tread's inner edge in a CUT, a level line: its own hem along it and its cut shadow on
//   the tread below (aBK.z = metres of cloth from the cut). The light's lozenges lie on the treads there, on no riser.
//
// STYLE (the hero is tuned for the engine's exact-colour switch: the world must return
//   post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }
//   and style: 'none'; judge it in the viewer with flat=1&bloom=0)
//   Every surface is one cloth shader family. Shared GLSL is exported as MOLA_GLSL and the shared
//   uniform objects as hero.shared; styleMaterial(opts) makes a cloth material for anything else in the
//   world (nested shells with an "aE" attribute = metres to the panel outline). In order, a cloth
//   fragment does: (1) flat fill from a four-entry stack, hard bands antialiased with fwidth;
//   (2) violet multiply shadow on a lower layer beside an upper edge; (3) rolled hem: light line and
//   dark line before each cut edge with a pucker ripple (by night, when the look's top cloth is black and a multiply
//   shows nothing on it, the light line is laid as a thin line of the look's magenta, held under the look's dimmest cut cloth,
//   on the hems and under the lower edges of the cuts named at THE NIGHT'S HEM, and on no others); (4) weave, two thread sets 2.5 cm apart, faded
//   by fwidth; (5) stitches near the camera; (6) puff shading, a half-lambert 0.78..1.05 from uKey;
//   (7) light diamonds (an amendment of the brief): hard lozenges, 80% toward the palette yellow, with a thin darker rim, sliding, stretching and pinching over cloth that lies near level (none on
//   slopes steeper than about 40 degrees; in the slot only on the black floor, at a finer scale, and on the ridge
//   shoulders, never on risers, hems or treads; on the crest's steps on the treads only); (8) echo bands from uEchoA/B/C: three broad hard bands
//   per 2.4 m with clean cloth between; a group narrows toward the edge of its reach and is then dropped whole, never
//   drawn half-transparent (the slot takes a set of 1.6 m period from source 1 only). uEchoDome (shared, default 1)
//   scales source 0 on the dome alone: the world eases it to 0 for the drop so the turtle's bands stay on sand and apron;
//   (9) depth: 0..35% toward navy by distance (no fog look; three.js fog is still honoured if set).
//   FILTERED BY A PIXEL'S FOOTPRINT (polish 2, g): every line of the cloth is drawn through the footprint of the pixel
//   that shows it, measured on the line's own measure (molaAA and molaLine on fwidth of that measure): the bands, cuts
//   and shadows as before, and now also the lines that were a yes or no: on the outer crest's tiers the tier change, the
//   hem's dark and light and the tread's light; in the slot, on the bank, the terrace, the rampart's outer face and the
//   painted walls the hems, the treads' edges, the ledges, the bands and the change of cloth at a step's corner (slotFrag:
//   eC, eW). A line narrower than a pixel is the share of the pixel it fills. And the row of lozenges on the slot's
//   shoulder (polish 2, h): where a lozenge would be under one and a half pixels, long or high, the row is drawn as its
//   own mean, a band of the cut cloth's share of the row at that height (slotFrag: farZ). Nothing of it reads the lens's place or
//   distance: the same line at the same size on screen is filtered alike wherever it is seen from.
//
// Local space
//   Origin at the centre of the dome's foot on the sand (y = 0), +Y up, front +Z (the channel mouth is
//   at about z = +68). Key light direction default (0.11, 0.93, 0.35): 68 degrees up, from behind the
//   entry camera and a little right; the exit heading is away from it.
//
// anchors (local space)
//   mouth        { position, heading, up }: top of the entry ramp; the camera slides down into the slot here
//   fanSeats     [2 x { position, uphill }]: either side of the mouth notch, for the two sea fans (the uphill one stands
//                on the hill just above the bank's top step, the downhill one on the sand in front of the bastion)
//   flyThrough   ordered eye points: three on a quarter turn of 11 m radius that arrives on the mouth's heading
//                (the first is 29 m out toward the channel), then the slot (eye 0.9 m above the floor),
//                the crown, a pull-up on a 30 m radius to 50 degrees and the straight to the portal.
//                Inside the slot the clearance is 1.0 m to the lower step and 1.6 m to the lip by design
//                (that is the ride); everywhere else it is more than 6 m.
//   slotUp       matching up vectors for the slot part of flyThrough (bank reference), slotRange [i0, i1]
//   portalSeat   { position, normal, radius 7, tilt 50 deg }: 14 m ring centre about 69 m up; normal faces the camera
//   windows      [2 x { s0, s1, position, outward }]: where the outer wall dips to 0.5 m
//   terrace      { levels, radii, azimuthEnd, winding }: the apron tiers' tread heights and ring radii
//   crest        { radius, halfWidth, halfLength, height, point(a, rho, out), heightAt(a, rho), edge(x, z) }: the outer crest;
//                a = metres along its ridge line from its middle, rho = metres outward of the ridge line
//   wormSeats    [up to 60 x { position, up }]: pairs on the lips of the slot for the Christmas tree worms (every 2.8 m on
//                alternate lips; none where the outer wall is cut down for a window)
//   octopusGate  { position, up, across, outer, s }: lane centre at 72% of the slot; outer = +1 when +across is downhill
//   paceJoin     { position }: slot centre at 40%, where the pace fish joins
//   crown, viewpoints { channelMouth, bowl, turtlePass }, exitHeading
//   hero.lane    { length, lip, shoulder, depth, at(s, out?) -> { floor, eye, top, tangent, up, right, depth, outer, wide } }
//                (s in metres along the slot; pass a previous result as out to reuse it without allocating)
//   hero.heightAt(x, z) dome surface height (sphere + rampart, without groove relief), for creatures (by L.near: beside
//                the line between two stretches of the lane it can stand some 0.8 m off the grid, which asks L.least)
//
// Driving it
//   hero.setEcho(i, position, heading, size, [c0, c1, c2], strength, reach = 14)   i < opts.echoes; colours are
//       palette indices (PAL below). Bands spread from the swimmer to reach metres and stream 3x longer behind it;
//       strength under about 0.5 draws nothing. Source 1 is the one the master groove's walls show (the pace fish).
//       Until the first call, update() runs two demo echoes so the viewer shows the effect.
//   hero.setLivery('noon' | 'dawn' | 'night') swaps the stack colours (uniforms only) and the dome's far colour (uFar:
//       what the maze becomes when its bands are under a pixel; at night 60% of the brightest cut, not a grey mean).
//   No progress hook: nothing in the hero is timed to the camera. update(dt, time, camera) only
//   advances uTime (diamonds, pucker, echo clock); pass opts.demo = false to switch the demo echoes off.
//   Exports: buildHero, styleMaterial(opts), makeShared(opts), molaGLSL(nEcho, opts), MOLA_GLSL, PAL.
//
// opts
//   palette   brief palette [red, orange, turquoise, black, yellow, magenta, cobalt]
//   livery    'noon' (default) | 'dawn' | 'night'      demo  false: no demo echoes
//   pitch     groove pitch in metres (default by seed: 2.0 tight or 3.2 wide-lobed)
//   winding   +1 counter-clockwise seen from above (mouth front-left, bank left) or -1 (mirrored); default by seed
//   echoes    number of echo sources the shaders loop over (default 8, max 24)
//   keyDir    Vector3 toward the key light (default as above)
//   apron     false to leave out the scalloped apron on the sand
//   shared    reuse another module's shared uniform set
//
// Size: radius 21.5 (apron), dome radius 18, height 14 (rampart lips up to ~14.7).
// Size with the outer crest: it reaches 41 m from the axis on the side away from the channel.
// Cost: about 150k triangles, 4 draw calls (dome ~89k on a 288 grid, crest ~26k, slot with the terrace ~30k, apron
//   ~5.8k), one 768x768 RGBA8 data texture (texel 6.7 cm; R maze with the lane cut in, G the lane distance about the
//   lane margin's line, a centimetre a level, B the raw maze for the crest), no lights. Build about 0.7 s in small steps
//   (await ctx.yield(), a row of the texture at a time; the lane's lookup grid is stamped 40 stations at a time, L.stamp).
// Lighting: none needed; all materials are unlit ShaderMaterials writing linear colour.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#C8202C', '#F07A1C', '#14A6A0', '#141012', '#F4C62A', '#C4247C', '#1B4FA8'];
// palette indices for uPal: 0 red 1 orange 2 turquoise 3 black 4 yellow 5 magenta 6 cobalt 7 green 8 navy
export const PAL = { red: 0, orange: 1, turquoise: 2, black: 3, yellow: 4, magenta: 5, cobalt: 6, green: 7, navy: 8 };
const LIVERY = { noon: [0, 1, 2, 3], dawn: [5, 1, 4, 3], night: [3, 2, 5, 6] };
const SPHERE_R = 18.6, CAP_H = 14, SPHERE_CY = CAP_H - SPHERE_R, DISC_E = 25.6, TEX_N = 768;
const D_MAX = 1.275, DM_MAX = 10.2;
// The texture's lane channel (G) holds the lane distance between LANE_G0 and LANE_G0 + LANE_GS metres only, a centimetre a
// level, with the lane margin's line (4.55 m) in the middle: the cloth reads it against that one line and nothing else
// (polish 2: the line stands at 4.55 plan metres; about it the channel counts metres of CLOTH, see IN CLOTH METRES).
const LANE_G0 = 3.275, LANE_GS = 2.55;
const TIERS = 2, EYE_RISE = 1.3, SLOT_DEPTH = 2.4, RISER = 0.8, FLOOR_H = 1.0, HALF_LIP = 1.6, SHOULDER = 0.7, BANK_W = 2.0, BANK_T = 0.55, LIFT = 0.6, ECHO_AT = 3.1, XE = 24;

// ------------------------------------------------------------------ shared style GLSL (fragment)
// o.period: metres between echo band groups (default 2.4); o.frac: share of the period the three bands fill at the
// source (default 0.5: three bands of 0.4 m); o.reach scales every source's reach; o.only: draw one source only.
// The master groove, seen from a metre away, takes a finer, shorter set from the pace fish alone (source 1).
export function molaGLSL(nEcho, o = {}) {
  return /* glsl */`
#define MOLA_ECHOES ${nEcho}
#define MOLA_ECHO_P ${(o.period ?? 2.4).toFixed(3)}
#define MOLA_ECHO_F ${(o.frac ?? 0.5).toFixed(3)}
#define MOLA_ECHO_R ${(o.reach ?? 1).toFixed(3)}
#define MOLA_ECHO_ONLY ${o.only ?? -1}
#define MOLA_ECHO_TAIL ${(o.tail ?? 3).toFixed(3)}
#define MOLA_ECHO_DOME ${o.dome ? 1 : 0}
#define MOLA_ROAD ${o.road ? 1 : 0}
uniform float uTime;
uniform vec3 uKey;            // toward the key light, world space
uniform vec3 uPal[9];
uniform vec3 uShadowTint;     // violet multiply
uniform vec3 uDepthCol;
uniform vec3 uDepth;          // near, far, max mix
uniform vec3 uLight;          // diamond mix, slide speed, cell size
uniform vec3 uLightCol;       // diamond colour (yellow by day, cobalt for the night livery)
uniform vec4 uEchoA[MOLA_ECHOES];   // xyz position, w size (capsule radius)
uniform vec4 uEchoB[MOLA_ECHOES];   // xyz heading (unit), w strength 0..1
uniform vec4 uEchoC[MOLA_ECHOES];   // three palette indices, w reach in metres
uniform float uEchoDome;      // strength of source 0 on the dome itself (the world eases it out for the drop)
float molaRoadK = 0.0;        // 1 on the road's own cloth (MOLA_ROAD materials set it in main from the cloth's own attribute aRoad); 0 everywhere else
float molaAA(float x, float w){ return clamp(x / max(w, 1e-5) + 0.5, 0.0, 1.0); }
float molaHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
// two crossed thread sets 2.5 cm apart; uv in metres, fw = metres per pixel
float molaWeave(vec2 uv, float fw){
  float a = sin(uv.x * 251.3) * 0.5 + 0.5, b = sin(uv.y * 251.3) * 0.5 + 0.5;
  float coarse = sin((uv.x + uv.y) * 31.4) * sin((uv.x - uv.y) * 31.4);
  float k = 1.0 - smoothstep(0.004, 0.012, fw), k2 = 1.0 - smoothstep(0.03, 0.09, fw);
  return 1.0 + 0.06 * k * (a * b * 2.0 - 0.5) + 0.02 * k2 * coarse;
}
// puff shading: half-lambert kept between 0.78 and 1.05
float molaPuff(vec3 n){ return mix(0.78, 1.05, clamp(dot(n, uKey) * 0.5 + 0.5, 0.0, 1.0)); }
// violet multiply; on the warm cloths (orange, yellow, red) the tint turns toward red so the shadow stays in the palette
vec3 molaShadow(vec3 c, float a){
  vec3 t = mix(uShadowTint, vec3(0.55, 0.26, 0.9), smoothstep(0.25, 0.6, c.r - c.b));
  return c * mix(vec3(1.0), t, clamp(a, 0.0, 1.0));
}
// hard-edged light diamonds, 1.5 to 4 m long, sliding and pinching
vec2 molaDiamondLayer(vec2 p, float fw, float seed){
  float c = uLight.z;
  vec2 g = p / c, id = floor(g), f = fract(g) - 0.5;
  float h1 = molaHash(id + seed), h2 = molaHash(id * 1.7 + seed + 9.1);
  f += (vec2(h1, h2) - 0.5) * 0.3;
  float a = 0.15 + 0.2 * h1;
  float b = a * (0.42 + 0.26 * sin(uTime * (0.5 + 0.5 * h2) + h2 * 6.283));
  float d = 1.0 - (abs(f.x) / a + abs(f.y) / max(b, 0.02));
  float dd = d * b * c;                              // metres inside the diamond; its own screen-space change keeps the edge hard on ground seen at a grazing angle
  float w = clamp(fwidth(dd), 1e-5, fw * 1.2), on = step(0.45, h2);
  return vec2(molaAA(dd, w), molaAA(dd - 0.09 - w, w)) * on;      // the lozenge, and the lozenge inside its 9 cm rim
}
// x: the lozenges of light, y: the same without their rim. s scales the lattice (1 on open ground, larger on the slot's floor)
vec2 molaDiamonds(vec3 wp, float fw, float s){
  vec2 p = vec2(wp.x * 0.8 - wp.z * 0.6, wp.x * 0.6 + wp.z * 0.8);
  p.x += uTime * uLight.y; p.y += sin(uTime * 0.21 + p.x * 0.05) * 0.8;
  vec2 m = molaDiamondLayer(p * s, fw * s, 0.0);
  m = max(m, molaDiamondLayer(p * s * 1.31 + vec2(17.3, uTime * 0.11 + 4.1), fw * s * 1.31, 5.0));
  return m * (1.0 - smoothstep(0.5, 1.4, fw * s));
}
// a lozenge of light is a hard cut (an amendment of the brief): a thin rim one shade down, then the light's colour laid
// in at 2.4 times uLight.x, at most 0.8 (a shade under the ring's rim and the turtle's shell, which are the full yellow)
vec3 molaLightOn(vec3 c, vec3 wp, float fw, float up, float s){
  vec2 m = molaDiamonds(wp, fw, s) * up;
  return mix(mix(c, c * 0.62, m.x), uLightCol, min(uLight.x * 2.4, 0.8) * m.y);
}
vec3 molaLight(vec3 c, vec3 wp, vec3 n, float fw){
  float up = smoothstep(0.76, 0.9, n.y) * smoothstep(0.015, 0.08, dot(c, vec3(0.3, 0.5, 0.2)));   // only on cloth that lies near level (on a slope the diamonds would stretch downhill); black cloth stays black
  return molaLightOn(c, wp, fw, up, 1.0);
}
// echo bands: three broad flat bands per period spreading from each swimmer and streaming 3x longer behind it, with
// clean cloth between the groups. The group narrows with distance and is then dropped whole, never blurred: once it
// is under half its full width, or a band would be under about two pixels, it is not drawn. Edges are antialiased
// with the screen-space change of the band distance itself (worked out from dFdx/dFdy taken before the loop), so
// they stay hard on ground seen at a grazing angle.
vec3 molaEcho(vec3 c, vec3 wp, float fw){
  vec3 dWx = dFdx(wp), dWy = dFdy(wp);
  for (int i = 0; i < MOLA_ECHOES; i++) {
    vec4 A = uEchoA[i], B = uEchoB[i];
    if (B.w <= 0.001 || (MOLA_ECHO_ONLY >= 0 && i != MOLA_ECHO_ONLY)) continue;
    vec4 C = uEchoC[i];
    float reach = max(C.w, 1.0) * MOLA_ECHO_R;
    vec3 rel = wp - A.xyz;
    float al0 = dot(rel, B.xyz), k = al0 < 0.0 ? 1.0 / MOLA_ECHO_TAIL : 1.0, al = al0 * k;
    vec3 perp = rel - B.xyz * al0;
    float dl = sqrt(dot(perp, perp) + al * al), d = dl - A.w;
    if (d <= -0.5 || d >= reach) continue;
    float sw = min(B.w, 1.0);
#if MOLA_ECHO_DOME == 1
    if (i == 0) sw *= uEchoDome;
#endif
    float t = sw * (1.0 - 0.6 * smoothstep(0.3 * reach, reach, d));
    vec3 g = (perp + B.xyz * (al * k)) / max(dl, 1e-3);
    float fd = max(abs(dot(g, dWx)) + abs(dot(g, dWy)), 1e-5), aw = fd / MOLA_ECHO_P;
    float f = MOLA_ECHO_F * t * smoothstep(0.4, 0.56, t);       // the group narrows to nothing: a band is there or it is not
    if (f < aw * 7.0) continue;                                 // under about two pixels a band: dropped whole
    float x = fract((d - 2.2 * uTime) / MOLA_ECHO_P);
    float m = molaAA(x, aw) * molaAA(f - x, aw) * molaAA(d, fd);
    vec3 P = clamp(C.xyz, 0.0, 8.0);
#if MOLA_ROAD == 1
    // THE ROAD'S RULE (the designers' ruling of 7 October 14:03; an amendment of the brief): on the road's own cloth an
    // echo's BLACK band is not drawn and the road's cloth lies whole between the bands on either side. It is a rule of
    // the cloth for every swimmer (the loop's every source) whose triple carries the black cloth (palette index 3), and
    // it reads the cloth under the band and nothing else: molaRoadK, the cloth's own attribute. The three bands' own
    // weights (the same edges as below), the black ones taken out where the cloth is the road; elsewhere all three stay.
    float a1 = molaAA(x - f / 3.0, aw), a2 = molaAA(x - f * 2.0 / 3.0, aw);
    vec3 wk = vec3((1.0 - a1) * (1.0 - a2), a1 * (1.0 - a2), a2) * (vec3(1.0) - molaRoadK * (vec3(1.0) - step(0.5, abs(P - 3.0))));
    float ws = wk.x + wk.y + wk.z;
    vec3 e = (uPal[int(P.x + 0.5)] * wk.x + uPal[int(P.y + 0.5)] * wk.y + uPal[int(P.z + 0.5)] * wk.z) / max(ws, 1e-4);
    c = mix(c, e, m * ws);
#else
    vec3 e = uPal[int(P.x + 0.5)];
    e = mix(e, uPal[int(P.y + 0.5)], molaAA(x - f / 3.0, aw));
    e = mix(e, uPal[int(P.z + 0.5)], molaAA(x - f * 2.0 / 3.0, aw));
    c = mix(c, e, m);
#endif
  }
  return c;
}
vec3 molaDepth(vec3 c, float dist){ return mix(c, uDepthCol, uDepth.z * smoothstep(uDepth.x, uDepth.y, dist)); }
// steps (5) to (9) for any cloth: weave, puff, diamonds, echoes, depth
vec3 molaFinish(vec3 c, vec3 wp, vec3 n, vec2 clothUV, float fw, float dist){
  c *= molaWeave(clothUV, fw) * molaPuff(n);
  c = molaLight(c, wp, n, fw);
  c = molaEcho(c, wp, fw);
  return molaDepth(c, dist);
}
`;
}
export const MOLA_GLSL = molaGLSL(8);

// shared uniform objects: put the same objects into every cloth material of the world
export function makeShared(opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice(0, 7).concat(['#1E8C4A', '#10245E']);
  const nEcho = Math.max(1, Math.min(24, Math.round(opts.echoes ?? 8)));
  const vec4s = () => { const a = []; for (let i = 0; i < nEcho; i++) a.push(new THREE.Vector4(0, 0, 0, 0)); return a; };
  const key = (opts.keyDir ? new THREE.Vector3().copy(opts.keyDir) : new THREE.Vector3(0.11, 0.93, 0.35)).normalize();
  return {
    nEcho,
    uniforms: {
      uTime: { value: 0 }, uKey: { value: key },
      uPal: { value: hex.map((h) => new THREE.Color(h)) },
      uShadowTint: { value: new THREE.Color('#9088CC') },
      uDepthCol: { value: new THREE.Color('#10245E') }, uDepth: { value: new THREE.Vector3(30, 260, 0.35) },
      uLight: { value: new THREE.Vector3(0.35, 0.8, 5.5) }, uLightCol: { value: new THREE.Color(hex[4]) },
      uEchoA: { value: vec4s() }, uEchoB: { value: vec4s() }, uEchoC: { value: vec4s() }, uEchoDome: { value: 1 },
    },
  };
}

const VERT_COMMON = /* glsl */`
#include <common>
#include <fog_pars_vertex>
varying vec3 vW; varying vec3 vN; varying float vDist;
`;
const FRAG_COMMON = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vW; varying vec3 vN; varying float vDist;
`;

// Cloth material for the rest of the world: a puffed panel with attribute aE (metres to the panel
// outline or seam) and uv in metres. One shell shows bands floor(aE / bandW) from the stack (top cloth
// at the outline); a nested shell passes cut > 0 and is discarded beyond its own cut line. o.echoOnly: draw the echo
// bands of that one source only (a swimmer passes an index no source uses, so its own bands are never drawn on itself).
// o.road: the geometry carries the attribute aRoad (1 on the vertices of the road's own cloth, 0 elsewhere) and the
// cloth takes THE ROAD'S RULE of molaEcho: where aRoad is over a half an echo's black band is not drawn.
export function styleMaterial(o = {}) {
  const shared = o.shared || makeShared(o);
  const stack = (o.stack || [0, 1, 2, 3]).map((i) => i);
  return new THREE.ShaderMaterial({
    fog: true, side: o.side ?? THREE.DoubleSide,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared.uniforms,
      uStackI: { value: new THREE.Vector4(stack[0], stack[1], stack[2], stack[3]) },
      uBand: { value: new THREE.Vector4(o.bandW ?? 0.6, o.cut ?? 0, o.hem ?? 0.06, o.bands ?? 4) },
    },
    vertexShader: VERT_COMMON + /* glsl */`
attribute float aE; varying float vE; varying vec2 vUv;${o.road ? ' attribute float aRoad; varying float vRoad;' : ''}
void main(){
  vE = aE; vUv = uv;${o.road ? ' vRoad = aRoad;' : ''}
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp; vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: FRAG_COMMON + molaGLSL(shared.nEcho, { ...(o.echoOnly != null ? { only: o.echoOnly } : {}), road: !!o.road }) + /* glsl */`
uniform vec4 uStackI; uniform vec4 uBand; varying float vE; varying vec2 vUv;${o.road ? ' varying float vRoad;' : ''}
vec3 stackCol(float i){ return uPal[int((i < 0.5 ? uStackI.x : i < 1.5 ? uStackI.y : i < 2.5 ? uStackI.z : uStackI.w) + 0.5)]; }
void main(){
  float fw = max(length(fwidth(vW)), 1e-4);
  float fe = max(fwidth(vE), 1e-4);
  if (uBand.y > 0.0 && vE > uBand.y) discard;
  float w = uBand.x, top = uBand.w - 1.0;
  float bi = min(floor(vE / w), top), into = vE - bi * w;
  float edge = bi < top ? w - into : 1e3;                 // metres to the next cut edge inward
  if (uBand.y > 0.0) edge = min(edge, uBand.y - vE);
  vec3 c = stackCol(bi);
  c = mix(stackCol(max(bi - 1.0, 0.0)), c, molaAA(into, fe));
  float pk = 1.0 + 0.5 * sin(vUv.x * 12.566 + sin(vUv.y * 3.0 + uTime * 0.7));
  float hem = (1.0 - smoothstep(0.0, uBand.z, edge)) * step(edge, 1e2);
  c *= 1.0 + hem * 0.16 * pk * (1.0 - smoothstep(0.02, 0.2, fe));
  float sh = (1.0 - molaAA(into - uBand.z * 1.6, fe)) * step(0.5, bi);
  c = molaShadow(c, sh * 0.85);
  vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);${o.road ? '\n  molaRoadK = molaAA(vRoad - 0.5, max(fwidth(vRoad), 1e-4));   // the road\'s own cloth (attribute aRoad: 1 on its vertices): see THE ROAD\'S RULE in molaEcho' : ''}
  c = molaFinish(c, vW, n, vUv, fw, vDist);
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`,
  });
}

// THE NIGHT'S HEM (polish 2; the designers' word of 11 Oct: by night "a hem shows by its light line", the reef "a dark
// quilt drawn in thin cuts"). A hem is a multiply of the cloth it lies on (a light line, a dark line), and on black cloth
// a multiply shows nothing: by night, when black is the look's TOP cloth, every ridge and face of it stood without a hem
// and read as a hole. On such cloth the hem's LIGHT line is laid as a thin line of one colour: on a hem 4 to 8 cm of its
// light part (the side toward the key on the maze), and at a cut in that cloth the cut's own hem, 5 cm under its lower
// edges (the side its cut shadow does not lie on).
// WHICH LINES GET IT, and no others. Hems: the maze's (those round the ridge's slits among them); the maze band's
// along the cut under the outer crest's ridge; the rolled edge of the outer crest's risers; the rolled hems of the
// slot's steps and of the terrace's tiers; the hems of the outer face's risers; the rim wall's; a tier's painted on a
// wall; the 7 cm lit top of the top cloth under the floor band at the outer face's base. Cuts: the lozenges of the
// hill's hem rows (on the hill and painted on a wall) and of the outer crest's tiers; a tall riser's main row
// (lozenges, zigzag or crosses); a slot riser's main motif; the shoulder's lozenges; the lozenges of the outer face's
// risers and of its base rows. NO line at a riser's foot row, at the lozenges in a zigzag's bays, at a medallion, at
// the piping, at a tread's slits, at the ridge's lobe cuts or at the floor's cuts.
// NO TWIN (polish 2, order 4). The line is one of the look's own cut cloths made dim, and beside a figure of that
// cloth it stood as the figure's dimmer double. So a cut's line is left out where a cloth of the line's own colour,
// or of one near it, is sewn within three widths of the line (0.15 m) of the cut's edge and runs along it: the cut's
// own cloth; the second cloth of a figure cut two cloths deep (its edge 0.105 m inside the cut's); on a slot riser
// the riser's other cut cloth too (the foot row, the medallions and the piping, which the motif's lower edges come
// down to). hemFar tells it from the cloths alone, the same at every place and footprint: both colours are brought
// to one luminance by the cloth's measure, and the line is left out while they stand within 0.5 of each other and
// is whole from 1.0 on (by night the turquoise stands 2.9 from the magenta and the cobalt 3.4). By night, when the
// line's cloth is the magenta, that leaves the cuts' lines at the turquoise and cobalt lozenges of the hill's hem
// rows, at the outer crest's tiers, at the shoulder and on the outer face; a tall riser's row and a slot riser's
// motif on black cloth have none (the magenta is the second cloth of the one and a cut cloth of the other). A hem's
// line is left out likewise where a figure of the line's cloth runs along it within three widths: on the dome within
// 0.26 m, by the maze's measure, of a lobe cut of the ridge (lobeN: the hem of a slit on its side toward a lobe, whose
// edge lies 0.2 m from the slit's by that measure, which is 0.15 m of cloth at the hill's foot, and the maze band's
// hem under the crest where a lobe comes down to it), and on the bowl's rim wall along the last of the bank, where
// the bank's middle step comes within 0.2 m of the wall's top (uRim). The other hems keep theirs: the maze's band of
// the line's cloth lies 0.19 m and more by the maze's measure from the top cloth's edge (0.14 m of cloth at the
// hill's foot, 0.19 m high on it), and a piping 0.2 m and more under the line of the hem above it.
// ITS COLOUR AND ITS BOUND. The colour is the DIMMER of the look's two upper cut cloths (uStack[1], uStack[2]: by night
// the magenta), mixed up from the top cloth only as far as 0.97 of the luminance of the DIMMEST of the look's three cut
// cloths (uStack[1..3]: by night the cobalt), by the cloth's own measure (0.3, 0.5, 0.2) and by Rec. 709's, whichever
// gives the less. By night the cobalt is the dimmest COLOURED cloth an echo's triple carries (the world's triples by
// night are of yellow, orange, turquoise, magenta, cobalt and black; black is no light and is left out of the bound), so
// the line stands under every coloured echo band.
// HOW IT IS LAID. hemNight only GATHERS the line's strength at a pixel (nightK, 0 to 1): the line's own strength there,
// times "is the look's top cloth black, and the cloth under the line?" by the thresholds molaLight uses, read on the
// cloth before any multiply that reads the clock or the eye. A cloth laid over the place afterwards takes its share of
// nightK away. hemNightLay lays the line ONCE, after every shade, shadow and stitch, after the weave, the puff and the
// light, as a mix toward the line's colour: only the echoes and the water's depth, which are mixes laid alike over
// every cloth, come after it. So nothing multiplies the line and its brightest pixel is its own colour. By day, where
// the top cloth is red or magenta, nothing is gathered and the cloth is returned as it is. No new colour: a mix of two
// of the look's own cloths.
const HEM_NIGHT = /* glsl */`
float nightK = 0.0;
float hemDark(vec3 cloth){ vec3 lw = vec3(0.3, 0.5, 0.2); return (1.0 - smoothstep(0.015, 0.08, dot(uStack[0], lw))) * (1.0 - smoothstep(0.015, 0.08, dot(cloth, lw))); }
void hemNight(vec3 cloth, float k){ nightK = max(nightK, clamp(k, 0.0, 1.0) * hemDark(cloth)); }
float hemFar(vec3 fig){ vec3 lw = vec3(0.3, 0.5, 0.2), lc = dot(uStack[1], lw) < dot(uStack[2], lw) ? uStack[1] : uStack[2]; return smoothstep(0.5, 1.0, length(fig / max(dot(fig, lw), 1e-4) - lc / max(dot(lc, lw), 1e-4))); }   // (NO TWIN: 0 for a cloth of the line's colour or near it, 1 for any other)
vec3 hemNightLay(vec3 c){
  if (nightK <= 0.0) return c;
  vec3 lw = vec3(0.3, 0.5, 0.2), l7 = vec3(0.2126, 0.7152, 0.0722), top = uStack[0];
  vec3 lc = dot(uStack[1], lw) < dot(uStack[2], lw) ? uStack[1] : uStack[2];
  float bw = min(dot(lc, lw), dot(uStack[3], lw)), b7 = min(min(dot(uStack[1], l7), dot(uStack[2], l7)), dot(uStack[3], l7));
  float a = min((0.97 * bw - dot(top, lw)) / max(dot(lc - top, lw), 1e-4), (0.97 * b7 - dot(top, l7)) / max(dot(lc - top, l7), 1e-4));
  return mix(c, mix(top, lc, clamp(a, 0.0, 1.0)), nightK);
}
// a thin line from a to b on the measure x, seen by a pixel that is w of that measure wide: the share of the pixel it fills
float molaLine(float x, float a, float b, float w){ w = max(w, 1e-5); return clamp((min(x + 0.5 * w, b) - max(x - 0.5 * w, a)) / w, 0.0, 1.0); }
vec3 stackAt(float i){ return i < 0.5 ? uStack[0] : i < 1.5 ? uStack[1] : i < 2.5 ? uStack[2] : uStack[3]; }
`;
// ------------------------------------------------------------------ the dome's cloth shader
const DOME_VERT = VERT_COMMON + /* glsl */`
attribute vec2 aUV; attribute vec3 aBK; attribute float aDF; varying vec2 vUV; varying vec3 vBK; varying vec2 vKeyUV; varying vec2 vDF; uniform vec3 uKey;
void main(){
  vUV = aUV; vBK = aBK; vDF = vec2(aDF, position.y);
  float rho = length(aUV);
  vec2 dir = rho > 1e-3 ? aUV / rho : vec2(1.0, 0.0);
  float th = rho / ${SPHERE_R.toFixed(2)};
  mat3 m3 = mat3(modelMatrix);
  vec3 tr = normalize(m3 * vec3(cos(th) * dir.x, -sin(th), cos(th) * dir.y));
  vec3 tp = normalize(m3 * vec3(-dir.y, 0.0, dir.x));
  vKeyUV = dir * dot(uKey, tr) + vec2(-dir.y, dir.x) * dot(uKey, tp);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(m3 * normal);
  vec4 mvPosition = viewMatrix * wp; vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const domeFrag = (nEcho) => FRAG_COMMON + molaGLSL(nEcho, { dome: 1 }) + /* glsl */`
uniform sampler2D uMaze; uniform vec3 uStack[4]; uniform vec4 uFar;
varying vec2 vUV; varying vec3 vBK; varying vec2 vKeyUV; varying vec2 vDF;${HEM_NIGHT}vec3 mazeAt(vec2 uv){ vec4 t = texture2D(uMaze, uv / ${(2 * DISC_E).toFixed(1)} + 0.5); return vec3(t.r * ${D_MAX.toFixed(3)}, t.g * ${LANE_GS.toFixed(2)} + ${LANE_G0.toFixed(3)}, t.b * ${D_MAX.toFixed(3)}); }
void main(){
  float fw = max(length(fwidth(vW)), 1e-4);
  // THE LOBE (aBK.y = -1) reads the maze as it is before the lane is cut into it (B), has no lane, and steps down
  // through the cloths to a black rim (aBK.x = 0.4 x metres to its outline)
  vec3 mz = mazeAt(vUV);
  float lobeK = step(vBK.y, -0.5);
  float D = mix(mz.x, min(mz.z, max(vBK.x, 0.0)), lobeK), lane = mix(mz.y, ${DM_MAX.toFixed(1)}, lobeK);
  float ex = 0.1;
  vec3 mxp = mazeAt(vUV + vec2(ex, 0.0)), mxm = mazeAt(vUV - vec2(ex, 0.0)), myp = mazeAt(vUV + vec2(0.0, ex)), mym = mazeAt(vUV - vec2(0.0, ex));
  vec3 gxa = mxp - mxm, gya = myp - mym;
  vec2 gr = mix(vec2(gxa.x, gya.x), vec2(gxa.z, gya.z), lobeK);
  float gl = length(gr);
  vec2 g = gl > 1e-4 ? gr / gl : vec2(0.0);
  float kd = dot(g, vKeyUV);                       // > 0: the ridge beside us is on the key side
  // THE CUTS IN TRUE METRES (polish 1). D is metres to a groove's centre only where the maze's lines lie at their own
  // pitch; where they spread (a fork, the hill's steep foot, the ramp that ends a groove 4.5 m from the lane, which is
  // laid in plan metres) D rises more slowly than a metre a metre, and a hem of 0.05, a shadow of 0.035 to 0.11 or a
  // slit of 0.13 measured in D stood too wide (at the rare worst two to eight times): bands lay in shadow and a hem was a smear.
  // gS = D's own rise in a metre of cloth, from the four reads already made 0.1 m to each side (the STEEPER side of
  // each pair, so a crest or a groove's centre between two reads does not read as flat), kept between 0.12 and 1:
  // every distance to a cut's edge below is a difference of D over gS. Where the lines lie at their pitch gS is 1 and
  // nothing changes.
  float D0 = mix(mz.x, mz.z, lobeK);
  vec4 dn = abs(mix(vec4(mxp.x, mxm.x, myp.x, mym.x), vec4(mxp.z, mxm.z, myp.z, mym.z), lobeK) - D0);
  float gS = clamp(length(vec2(max(dn.x, dn.y), max(dn.z, dn.w))) / ex, 0.12, 1.0);
  if (lobeK > 0.5 && max(vBK.x, 0.0) < mz.z) gS = 1.0;   // (the crest's stepped rim is keyed to its outline, not to the maze: it keeps its own measure)
  float fwD = clamp(fwidth(D), fw * 0.25, fw * 3.0);   // the band value's own screen-space change: edges stay hard on a flank seen at a grazing angle
  float lod = smoothstep(0.07, 0.16, fw), fine = 1.0 - smoothstep(0.045, 0.13, fw);
  float t3 = 0.5, t2 = mix(0.31, 0.25, lod), t1 = mix(0.15, 0.25, lod);
  float a3 = molaAA(D - t3, fwD), a2 = molaAA(D - t2, fwD), a1 = molaAA(D - t1, fwD);
  vec3 c = mix(mix(mix(uStack[3], uStack[2], a1), uStack[1], a2), uStack[0], a3);
  // distance into this layer from its own cut edge, and up to the edge of the layer above
  float eUp = (D > t3 ? D - t3 : D > t2 ? D - t2 : D > t1 ? D - t1 : 1.0) / gS;
  float eDn = (D > t3 ? 1.0 : D > t2 ? t3 - D : D > t1 ? t2 - D : t1 - D) / gS;
  // crest slits and lobe cuts on the ridge cloth (no empty ground)
  float br = sin(vUV.x * 2.3 + 1.7 * sin(vUV.y * 0.9)) * sin(vUV.y * 2.3 + 1.7 * sin(vUV.x * 0.8));
  // (cuts are there or not, never faded: the lane margin is a hard line, slits are dropped whole when thin, lobes stay)
  float openL = molaAA(lane - 4.55, clamp(fwidth(lane), 1e-4, 0.5)), open = openL * step(fw, 0.19);
  // THE SLIT stands where it stood, on the line D = 0.87, and is 0.13 m of cloth wide at the most: its far edge is the
  // line D = 1.0 or the line 0.13 m from its near edge, whichever comes first (the same line where gS is 1). Where a
  // ridge's crest is no higher than D = 1.0 the slits of its two flanks meet over it, as they did: 0.26 m at the most.
  float sLo = (D - 0.87) / gS, sHi = min((1.0 - D) / gS, 0.13 - sLo);
  float slit = molaAA(sLo, fw) * molaAA(sHi, fw) * molaAA(br + 0.12, fw * 2.3) * open;
  float gD = clamp(gl / (2.0 * ex), mix(0.08, 0.22, smoothstep(0.1, 0.16, fw)), 1.0);     // D changes slowly on the wide lobes: turn it into metres so the cut edge stays hard
  float eL = min((D - 1.2) / gD, (br - 0.25) / 2.3);
  float lobe = molaAA(eL, clamp(fwidth(eL), fw * 0.2, fw * 2.0)) * openL * step(fw, 0.25);     // dropped whole where its footprint is coarse
  float sEdge = min(min(sLo, sHi), (br + 0.12) / 2.3);     // metres inside the slit from its nearest edge; outside it, minus the metres to it
  c = mix(c, uStack[1], slit); c = mix(c, uStack[2], lobe);
  // (the ridge cloth beside a slit has its hem on EVERY side of the slit: past the far edge too, where live's distance
  // went negative and the whole ridge between two slits was shaded as one hem)
  if (lobe > 0.5) { eUp = 1.0; eDn = eL; } else if (slit > 0.5) { eUp = 1.0; eDn = sEdge; } else if (open > 0.5) eUp = min(eUp, -sEdge);
  // cut shadow, then rolled hem with pucker
  float sw = 0.035 + 0.075 * clamp(kd * 0.8 + 0.45, 0.0, 1.0);
  float sh = (1.0 - molaAA(eDn - sw, fw)) * (0.55 + 0.45 * clamp(kd + 0.5, 0.0, 1.0));
  c = molaShadow(c, sh * mix(0.45, 1.0, fine));
  float pk = 1.0 + 0.45 * sin((vUV.x + vUV.y) * 12.566 + 2.0 * sin(vUV.x * 1.9 - vUV.y * 1.3 + uTime * 0.6));
  float hem = (1.0 - molaAA(eUp - 0.05, clamp(fwidth(D) / gS, fw * 0.25, fw * 3.0))) * fine;   // a hard line: light toward the key, dark away
  vec3 cN = c;                                       // (the cloth as it stands without the pucker and the stitches below, which read the clock and the eye's distance: what the night line's gate reads on the dome)
  float lobeN = (1.0 - hemFar(uStack[2])) * molaAA(eL + 0.26, clamp(fwidth(eL), fw * 0.2, fw * 2.0)) * openL;   // (NO TWIN: 1 within 0.26 m of a lobe cut, when the lobes' cloth is the line's colour)
  hemNight(cN, hem * (0.5 - 1.4 * kd) * (1.0 - lobeN));              // (on black top cloth: full toward the key, none away from it, as the multiply's light and dark)
  c *= 1.0 + hem * (0.03 - 0.24 * kd) * pk;
  // stitches 2 cm inside the hem, near only
  float st = (1.0 - smoothstep(0.0, 0.012, abs(eUp - 0.1))) * step(0.0, sin((vUV.x - vUV.y) * 104.7)) * (1.0 - smoothstep(4.0, 7.0, vDist));
  c *= 1.0 + 0.2 * st * (1.0 - smoothstep(0.004, 0.012, fw));
  // far: every band below a pixel goes to the mean, so the maze never shimmers
  c = mix(c, uFar.rgb, smoothstep(0.3, 0.75, fw) * uFar.a);
  cN = mix(cN, uFar.rgb, smoothstep(0.3, 0.75, fw) * uFar.a);
  // where the hill is cut for the bench round the ends of the bank strip the grid is displaced and a maze
  // or a band keyed to the bank's coordinate would smear over its coarse triangles: that ground is the hill's hem too
  // The line of that ground is where the cut is 0.12 m deep. The grid gives two even measures a vertex (aBK.y: metres
  // the bank's ramp lies under the hill before the gutter's taper; aBK.x: the place on the taper, 0 to 1 on the taper itself and running on beyond both ends) and the depth
  // is worked out of them here, a pixel at a time (polish 1: a yes or no a vertex drew that line as a zigzag of the
  // grid's 0.18 m, 0 to 0.2 m outside the lane margin's line, against the maze's bands and cuts).
  float bkD = vBK.y * (1.0 - smoothstep(0.0, 1.0, vBK.x)), bkW = molaAA(bkD - 0.12, clamp(fwidth(bkD), 1e-4, fw * 3.0));   // (the edge no softer than three pixels of cloth: a grid triangle seen edge on gives a wild fwidth)
  // THE OUTER CREST'S INNER FLANK (aDF = 1 on its contour rows; lobeK): LEVEL tiers keyed to height (vDF.y), 0.8 m bands of
  // the four cloths, each with a lozenge row in true metres, a hem and the shadow of the tier above.
  float moved = molaAA(vDF.x - 0.5, max(fwidth(vDF.x), 1e-4));
  float tq = moved * lobeK;
  // THE CUT UNDER THE RIDGE (the crest only): the maze band ends on the top tread's inner edge, a level contour where aDF
  // steps from 1 to 0 between two rows that lie in the same place. aBK.z = metres of cloth from that cut (9 far from it).
  float cutE = vBK.z, cutF = clamp(fwidth(cutE), 1e-5, fw * 1.2), trd = 0.0;
  if (tq > 0.002) {
    float t = vDF.y / 0.8, kt = floor(t), r = t - kt, ft = max(fwidth(t), 1e-4), m4 = mod(kt, 4.0);
    trd = molaAA(r - 0.95, ft) * step(0.0, t);       // the row's own height key: a riser is the first 0.76 m of its band, the tread the rest (none under the first step); by a pixel's footprint, as every line of the tiers below
    vec3 own = m4 < 0.5 ? uStack[3] : m4 < 1.5 ? uStack[2] : m4 < 2.5 ? uStack[1] : uStack[0];
    vec3 cut = m4 < 0.5 ? uStack[1] : m4 < 1.5 ? uStack[3] : m4 < 2.5 ? uStack[0] : uStack[1];
    float ph = atan(vUV.y, abs(vUV.x) < 1e-4 ? 1e-4 : vUV.x) * 13.05071 + kt * 0.37, x = (fract(ph) - 0.5) * 1.3;
    float lz = 1.0 - (abs(x) / 0.42 + abs(r - 0.42) * 0.8 / 0.17);
    float wl = max(ft * 0.8, fw * 0.4), mg = step(0.15, molaHash(vec2(floor(ph), kt + 70.0))), m = molaAA(lz * 0.17, wl) * mg;
    vec3 cb = mix(own, cut, m);
    cb *= mix(mix(1.0, 0.74, molaAA(r - 0.82, ft)), 1.16, molaAA(r - 0.9, ft));
    float nkT = hemDark(cb) * max(molaLine(r, 0.9, 0.95, ft), (1.0 - molaAA(lz * 0.17, wl)) * molaAA(lz * 0.17 + 0.05, wl) * mg * step(r, 0.42) * hemFar(cut));  // (the night line on a tier: the riser's rolled edge, 4 cm, not the tread; and a cut's own hem under its lower edges)
    float sht = max((1.0 - molaAA(r - 0.1, ft)), m * (1.0 - molaAA(lz * 0.17 - 0.035, ft * 0.8)) * step(0.42, r));
    sht = max(sht, 1.0 - molaAA(cutE - 0.08, cutF));  // the cut shadow of the maze band on the top tread: 0.08 m, as at a riser's foot
    // (the tier change, by a pixel's footprint: half a pixel of the tier below's lit top at this tier's foot, half a pixel of the next tier's shadowed foot at its top)
    vec3 ct = molaShadow(cb, sht * 0.8);
    ct = mix(ct, stackAt(3.0 - mod(kt + 3.0, 4.0)) * 1.16, (1.0 - molaAA(r, ft)) * step(1.0, t));
    ct = mix(ct, molaShadow(stackAt(3.0 - mod(kt + 1.0, 4.0)), 0.8), molaAA(r - 1.0, ft));
    c = mix(c, ct, tq); cN = mix(cN, ct, tq);
    nightK = mix(nightK, nkT * (1.0 - (1.0 - molaAA(r, ft)) * step(1.0, t)) * (1.0 - molaAA(r - 1.0, ft)), tq);   // (the tiers lie over the maze cloth and its line; the tier change lies over the tier's own)
  }
  // the maze band's hem along the cut, the risers' own (a dark line of 0.064 m under a light one of 0.08 m): no fade, no blend
  c *= 1.0 + lobeK * (1.0 - moved) * (0.16 * molaAA(cutE - 0.064, cutF) * molaAA(0.144 - cutE, cutF) - 0.26 * molaAA(0.064 - cutE, cutF));
  hemNight(cN, lobeK * (1.0 - moved) * molaAA(cutE - 0.064, cutF) * molaAA(0.144 - cutE, cutF) * (1.0 - lobeN));
  // THE HILL'S HEM (the dome itself): where its grid is cut or filled for the bench (moved) a maze would smear, and
  // within 4.5 m of the master groove the maze is held off the lane. No level band is laid there (a band would cross
  // the maze's lines): that ground is the RIDGE CLOTH itself, red, sewn with level rows of lozenge cuts 0.8 m apart,
  // a whole number of 1.3 m lozenges round the hill in each row, so the red line of the hill runs on unbroken.
  float mv = max(moved, bkW) * (1.0 - lobeK), hemK = max(mv, (1.0 - openL) * (1.0 - lobeK));
  if (hemK > 0.002) {
    c = mix(c, uStack[0], mv); cN = mix(cN, uStack[0], mv); nightK *= 1.0 - mv;
    float t = vDF.y / 0.8, kt = floor(t), r = t - kt, ft = max(fwidth(t), 1e-4), m4 = mod(kt, 3.0);
    float yr = (kt + 0.42) * 0.8 + ${(-SPHERE_CY).toFixed(2)}, rr = sqrt(max(${(SPHERE_R * SPHERE_R).toFixed(2)} - yr * yr, 1.0)), cnt = max(floor(6.2832 * rr / 1.3 + 0.5), 4.0);
    float ph = atan(vUV.y, abs(vUV.x) < 1e-4 ? 1e-4 : vUV.x) / 6.2832 * cnt + kt * 0.37, x = (fract(ph) - 0.5) * 1.3;
    float lz = 1.0 - (abs(x) / 0.42 + abs(r - 0.42) * 0.8 / 0.17);
    float onRidge = max(mv, a3);                  // on the ridge cloth only: the echo groove beside the lane keeps its own cuts
    // (a lozenge is whole or absent: decided once for each when the grid is made, see THE HILL'S HEM ROWS, WHOLE OR ABSENT; its
    // answer is one texel of a table in the texture's corner, fetched whole from the base level: the same at every footprint)
    float wl = max(ft * 0.8, fw * 0.4), mg = step(0.15, molaHash(vec2(floor(ph), kt + 70.0))) * onRidge * hemK * (1.0 - smoothstep(0.3, 0.7, fw)) * step(0.5, texelFetch(uMaze, ivec2(int(clamp(floor(ph), -64.0, 63.0)) + 64, int(clamp(kt, -8.0, 23.0)) + 8), 0).a);
    float m = molaAA(lz * 0.17, wl) * mg;
    vec3 cut = m4 < 0.5 ? uStack[1] : m4 < 1.5 ? uStack[3] : uStack[2];
    c = mix(c, cut, m); cN = mix(cN, cut, m); nightK *= 1.0 - m;
    c = molaShadow(c, m * (1.0 - molaAA(lz * 0.17 - 0.035, ft * 0.8)) * step(0.42, r) * 0.8);
    hemNight(cN, (1.0 - molaAA(lz * 0.17, wl)) * molaAA(lz * 0.17 + 0.05, wl) * mg * step(r, 0.42) * hemFar(cut));   // (the cut's own hem on black top cloth: 5 cm under its lower edges, the side the cut's shadow does not lie on)
  }
  vec3 n = normalize(vN); if (dot(n, vW - cameraPosition) > 0.0) n = -n;
  // the light on the crest's steps: on treads only (trd, the row's own key) and by the face's own flat normal, so a tread
  // takes the light's full law and a riser none (the mesh's smoothed normal is the mean of riser and tread)
  vec3 nf = cross(dFdx(vW), dFdy(vW)), nL = n;
  if (tq > 0.5) nL = (dot(nf, nf) > 1e-16 ? normalize(nf) * sign(dot(nf, n)) : n) * trd;
  c *= molaWeave(vUV, fw) * molaPuff(n);           // (molaFinish, with the light's normal chosen above)
  c = molaLight(c, vW, nL, fw);
  c = hemNightLay(c);                                // (the night's line, after every shade and multiply and after the light: THE NIGHT'S HEM)
  c = molaDepth(molaEcho(c, vW, fw), vDist);
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ the master groove's cloth shader
const SLOT_VERT = VERT_COMMON + /* glsl */`
attribute vec4 aSQ; attribute float aSF; varying vec4 vSQ; varying float vSF;
void main(){
  vSQ = aSQ; vSF = aSF;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = vec3(0.0, 1.0, 0.0);
  vec4 mvPosition = viewMatrix * wp; vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const slotFrag = (nEcho) => FRAG_COMMON + molaGLSL(nEcho, { period: 1.6, frac: 0.5, reach: 0.6, only: 1, tail: 1.3 }) + /* glsl */`
uniform vec3 uStack[4]; uniform vec4 uTer; varying vec4 vSQ; varying float vSF;${HEM_NIGHT}// uTer: the terrace's lowest level, its tier rise, the winding. vSQ: s along the slot (m), q across the profile (m, signed), bend 0..1, w = true metres per q unit on a riser. vSF: the face's own metres along the sweep (aSF)
// q: 0..0.7 floor; then three steps of 1.1 (riser 0.71, hem 0.15, tread 0.24; the third tread is the ridge
// shoulder, to 4.75); beyond 4.75 the outer face of the rampart: three risers of 0.8 with 0.15 ledges, then base cloth
// q from 20 on: the BANK on the uphill side, three cloth steps up to the dome (20 + step k + 0..0.8 riser, 0.8..1 tread)
float lozenge(float x, float y, float hx, float hy){ return 1.0 - (abs(x) / hx + abs(y) / hy); }
// the main row of a riser is a different mola panel every 14 m: slits, a zigzag, stepped crosses, a row of small fish.
// Returns metres inside the cut (x along the slot within a 0.95 m cell, y up the riser from the row's centre line).
float motif(float kind, float x, float y){
  if (kind < 0.5) return 0.115 * lozenge(x, y, 0.26, 0.115);
  if (kind < 1.5) return 0.045 - abs(y + 0.13 - abs(x) * 0.8) * 0.78;
  if (kind < 2.5) return max(max(min(0.27 - abs(x), 0.045 - abs(y)), min(0.085 - abs(x), 0.17 - abs(y))), min(0.18 - abs(x), 0.105 - abs(y)));
  x /= 0.84; y /= 0.84;
  return 0.84 * max(0.1 * lozenge(x + 0.07, y, 0.27, 0.1), min(min(x - 0.15, 0.37 - x), (x - 0.15) * 0.75 - abs(y)));
}
// which main row a terrace tier carries: big lozenges, or stepped crosses on every third (no zigzag on the hill: beside
// the level hems it read as a sawtooth seam)
float tierKind(float k){ return mod(k + 2.0, 3.0) > 1.5 ? 2.0 : 0.0; }
// A TALL RISER'S CLOTH (the bank's steps and the terrace's tiers), laid out in TRUE metres: one main row (kind 0 big
// lozenges cut three cloths deep, 1 a zigzag band with lozenges in its bays, 2 stepped crosses), a small staggered row
// at the foot and a piping line under the hem when the riser is tall enough. x: metres along, ym: metres up from the
// foot, Ht: the riser's height here. On a riser under about a metre it is the old single lozenge row.
vec3 tierCloth(vec3 own, vec3 cA, vec3 cB, vec3 cC, float kind, float s, float ym, float Ht, float fy, float fs, float fwm, float seed, out float sh){
  float P = 1.3, x = (fract(s / P) - 0.5) * P, w = max(fy, fs * 0.5);
  float tall = step(1.05, Ht), some = step(0.3, Ht), hy = min(0.36, Ht * 0.27), hx = hy * 1.55, yc = Ht * 0.47 + 0.05 * tall, y = ym - yc, dT = Ht - ym;
  float d = hy * (1.0 - (abs(x) / hx + abs(y) / hy)), d2 = -1.0;
  if (kind > 0.5 && kind < 1.5) {
    float q2 = s / (2.0 * P), tz = 4.0 * abs(fract(q2) - 0.5) - 1.0;
    d = 0.14 - abs(y - hy * 0.72 * tz) * 0.76;
    float bx = (fract(q2 + 0.5 * step(0.0, y)) - 0.5) * 2.0 * P;
    d2 = 0.1 * (1.0 - (abs(bx) / 0.27 + abs(abs(y) - hy * 0.8) / 0.1));
  } else if (kind > 1.5) {
    float ax = abs(x) / 1.7, ay = abs(y) / 1.7;
    d = 1.7 * max(max(min(0.27 - ax, 0.05 - ay), min(0.09 - ax, 0.17 - ay)), min(0.18 - ax, 0.11 - ay));
    float bx = (fract(s / P + 0.5) - 0.5) * P;
    d2 = 0.1 * (1.0 - (abs(bx) / 0.17 + abs(y) / 0.1));
  }
  float gap = kind < 0.5 ? step(0.12 * (1.0 - tall), molaHash(vec2(floor(s / P), seed))) : 1.0;
  float m1 = molaAA(d, w) * some * gap, m2 = molaAA(d - 0.105, w) * step(0.26, hy) * gap, m3 = molaAA(d - 0.2, w) * step(0.3, hy) * gap * step(kind, 0.5);
  vec3 c = mix(own, cA, m1); c = mix(c, cB, m2); c = mix(c, cC, m3);
  hemNight(c, (1.0 - molaAA(d, w)) * molaAA(d + 0.05, w) * some * gap * step(y, 0.0) * hemFar(cA) * mix(1.0, hemFar(cB), step(0.26, hy)));   // (a cut's own hem on black top cloth: 5 cm under its lower edges; NO TWIN: the cut's cloth, and its second cloth where it has one)
  float mb = molaAA(d2, w) * tall;
  c = mix(c, cB, mb);
  float x2 = (fract(s / 0.65 + 0.25) - 0.5) * 0.65, l2 = 0.055 * (1.0 - (abs(x2) / 0.16 + abs(ym - 0.2) / 0.055));
  float mf = molaAA(l2, max(fy, fs * 0.4)) * tall * (1.0 - smoothstep(0.08, 0.2, fwm));
  c = mix(c, cB, mf);
  float pp = molaAA(0.026 - abs(dT - 0.15), fy) * (1.0 - smoothstep(0.08, 0.2, fwm)) * step(0.55, Ht);
  c = mix(c, cA, pp); nightK *= (1.0 - mb) * (1.0 - mf) * (1.0 - pp);   // (the bays' lozenges, the foot row and the piping lie over the night's line)
  float into = d < 0.105 ? d : (d < 0.2 ? d - 0.105 : d - 0.2);
  sh = max(max(m1 * (1.0 - molaAA(into - 0.04, fy)) * step(0.0, y), mb * (1.0 - molaAA(d2 - 0.03, fy))), mf * (1.0 - molaAA(l2 - 0.02, fy)));
  return c;
}
// THE HILL BEHIND THE BOWL (polish 1, order 2; the designers' YES of 11 Oct). Above the terrace's last real tier the
// tier law ran past its end (ci = mod(5 - kt, 4) gives the FLOOR cloth for tier 2) and the bowl's rim wall stood as a
// flat face of the floor cloth (black by noon and dawn, cobalt by night), which reads as a hole. There the rim wall and the back seam's plate are the hill
// itself: the RIDGE CLOTH of the look's own stack, sewn with THE HILL'S HEM of domeFrag carried on: the same rows by
// world height (0.8 m apart, the same cut cloth by row, the same gaps' law), so a row of the hill runs on over the wall
// at its own level. Along the wall the lozenges are laid by THE WALL'S OWN METRES (wm: aSF, 1.3 m each as on the hill;
// polish 2, f: keyed to the azimuth about the dome's axis they stood pulled 1.5 to 2 times where a wall runs in toward
// that axis). No light on it, as on no wall. A row is whole or absent: none whose lozenges would stand within
// 0.15 m of the join (yJ, the last tier's top, where the tier's own hem line lies under it); the cloth's foot lies in
// the join's violet shadow, 0.1 m, as every riser's foot does. No fade at the join (the lozenges keep the hill's own footprint filter).
float terHl;                                        // the night's light line on a painted wall (hemNight): 6 cm of a tier's hem, a hill row's cuts
vec3 hillWall(float wm, float yJ, float fy, float fwm, out float sh){
  float t = vW.y / 0.8, kt = floor(t), r = t - kt, ft = max(fy / 0.8, 1e-4), m4 = mod(kt, 3.0);
  float ph = wm / 1.3 + kt * 0.37, x = (fract(ph) - 0.5) * 1.3;     // (polish 2, f: the lozenges by the wall's own metres, 1.3 m each as on the hill)
  float lz = 1.0 - (abs(x) / 0.42 + abs(r - 0.42) * 0.8 / 0.17);
  float wl = max(ft * 0.8, fwm * 0.4), mg = step(0.15, molaHash(vec2(floor(ph), kt + 70.0))) * step(yJ + 0.32, (kt + 0.42) * 0.8) * (1.0 - smoothstep(0.3, 0.7, fwm));
  float m = molaAA(lz * 0.17, wl) * mg;
  terHl = (1.0 - molaAA(lz * 0.17, wl)) * molaAA(lz * 0.17 + 0.05, wl) * mg * step(r, 0.42);   // (the night's line: a cut's own hem under its lower edges, as on the hill)
  vec3 cut = m4 < 0.5 ? uStack[1] : m4 < 1.5 ? uStack[3] : uStack[2];
  terHl *= hemFar(cut);                               // (NO TWIN)
  sh = max(m * (1.0 - molaAA(lz * 0.17 - 0.035, ft * 0.8)) * step(0.42, r) * 0.889, (1.0 - molaAA(vW.y - yJ - 0.1, fy)) * 0.8);   // (0.889 x the 0.9 of main = the hill's own 0.8)
  return mix(uStack[0], cut, m);
}
// THE RAMPART'S BASE WALL BESIDE THE TERRACE, ABOVE THE LAST REAL TIER (polish 2, order 4). The terrace's tiers go on up
// this wall, level, to the floor band at the foot of the wall's own three risers. Above the last real tier no tier
// stands beside the wall to carry a row on, and a row laid as it comes is cut by the wall's two ends and by the band's
// edge, which slants across the level tiers. There each row is FITTED TO THE WALL (uTw, from the wall's own triangles:
// its two ends as lines ws = e0 + e1 y, the band's edge as a parabola of ws, each laid a little inside the true line)
// and drawn here, figure by figure, by the tall riser's own measures (tierCloth's: the lozenge three cloths deep, the
// stepped cross, the bay lozenge, the foot row, the piping):
// THE MAIN ROW: whole cells from end to end of the wall, as many as go without the cell falling under 0.87 of the
// cloth's 1.3 m. In a narrower cell the figure is that much SHORTER ALONG THE ROW and keeps its height (so a row holds
// as much figure cloth over its length as the row laid as it comes); in a wider one it keeps its size. Where the
// band stands lower over a figure than the figure is high, the figure is made smaller, both ways alike, until it
// stands whole between the foot row and the band over its own length (twFit; none under a quarter of its size).
// THE FOOT ROW is fitted the same way to the wall's ends at its own height, at the main row's measure: whole cells,
// as many as go without the cell falling under the main row's share of its own 0.65 m (the lozenge as much shorter
// along the row as the cell), each small lozenge made smaller, both ways alike, where the band stands low over it
// (none under a quarter). Between two crosses that both stand, A BAY LOZENGE on the line midway between their two
// centres' heights, made smaller where the band stands low over it. THE PIPING runs as on every tier, where the band
// leaves it in sight.
// Nothing is cut by an end or by the band; where there is no room there is no figure.
uniform vec4 uTw[2];
uniform float uRim;                                 // the rim wall's own metres (vSF) where the bank's middle step comes within 0.2 m of the wall's top (the night's hem, NO TWIN)
// the largest size at which a figure stands whole under the band (0.05 m clear of it): the figure centred at cx on the
// row's metres, e long to each side at its full size, rising at its full size by rise above the height base over the
// tier's foot yF (the band's edge by its height and slope at cx; its bend over the figure's length taken off whole)
float twFit(float cx, float e, float yF, float base, float rise){
  float a = cx - uTw[1].x, q = uTw[1].w;
  return (uTw[1].y + a * (uTw[1].z + a * q) - yF - 0.05 - abs(q) * e * e - base) / (rise + abs(uTw[1].z + 2.0 * q * a) * e);
}
float twCell(float lo, float pit, float n, float k, float e, float yF, float rise){     // how large cell k's main figure stands under the band: 1 the row's size, 0 none
  if (k < 0.0 || k > n - 0.5) return 0.0;
  float z = twFit(lo + (k + 0.5) * pit, e, yF, 0.3, rise);
  return z < 0.25 ? 0.0 : min(z, 1.0);
}
float twOff(float v){ return abs(v) < 1e-4 ? 1e-4 : v; }                                     // a pitch is a divisor below: held off zero (the wall's two fitted ends could meet at a tier's level)
vec3 wallTier(vec3 own, vec3 cA, vec3 cB, vec3 cC, float kt, float ws, float ym, float Ht, float fy, float fs, float fwm, out float sh){
  float yF = uTer.x + kt * uTer.y, kd = tierKind(kt), nk = 1.0 - smoothstep(0.08, 0.2, fwm);
  // the main row (the wall's ends where they stand nearest over the figures' heights, 0.3 to 1.4 m up)
  float hi = uTw[0].x + uTw[0].y * (uTw[0].y < 0.0 ? yF + 1.4 : yF + 0.3), lo = uTw[0].z + uTw[0].w * (uTw[0].w > 0.0 ? yF + 1.4 : yF + 0.3);
  float n = floor((hi - lo) / 1.131 + 0.001), pit = twOff((hi - lo) / max(n, 1.0)), sc = min(pit / 1.3, 1.0);
  float u = (ws - lo) / pit, ck = floor(u), yc = Ht * 0.47 + 0.05, rise = yc - 0.3 + (kd > 1.5 ? 0.289 : 0.36), e = (kd > 1.5 ? 0.46 : 0.56) * sc;
  float z = twCell(lo, pit, n, ck, e, yF, rise), Z = max(z, 0.25), xa = (ws - lo - (ck + 0.5) * pit) / (sc * Z), y = (ym - 0.3) / Z + 0.3 - yc, wA = max(fy, fs * 0.5 / sc) / Z, d;
  if (kd > 1.5) { float ax = abs(xa) / 1.7, ay = abs(y) / 1.7; d = 1.7 * max(max(min(0.27 - ax, 0.05 - ay), min(0.09 - ax, 0.17 - ay)), min(0.18 - ax, 0.11 - ay)); }
  else d = 0.36 * (1.0 - (abs(xa) / 0.558 + abs(y) / 0.36));
  float on = step(0.001, z), m1 = molaAA(d, wA) * on;
  vec3 c = mix(own, cA, m1); c = mix(c, cB, molaAA(d - 0.105, wA) * on); c = mix(c, cC, molaAA(d - 0.2, wA) * on * step(kd, 0.5));
  hemNight(c, (1.0 - molaAA(d, wA)) * molaAA(d + 0.05, wA) * on * step(y, 0.0) * hemFar(cA) * hemFar(cB));     // (a cut's own hem on black top cloth, as on every tall riser)
  float into = d < 0.105 ? d : (d < 0.2 ? d - 0.105 : d - 0.2);
  sh = m1 * (1.0 - molaAA(into - 0.04, fy / Z)) * step(0.0, y);
  float mb = 0.0, d2 = -1.0, zb = 0.0;
  if (kd > 1.5) {                                      // the bay between two crosses
    float kb = floor(u + 0.5), za = twCell(lo, pit, n, kb - 1.0, e, yF, rise), zc = twCell(lo, pit, n, kb, e, yF, rise), wb = lo + kb * pit, cy = 0.3 + (yc - 0.3) * 0.5 * (za + zc);
    if (min(za, zc) > 0.0) zb = min(twFit(wb, 0.18 * sc, yF, cy, 0.1), 1.0);
    if (zb >= 0.25) { d2 = 0.1 * zb * (1.0 - (abs(ws - wb) / (0.17 * zb * sc) + abs(ym - cy) / (0.1 * zb))); mb = molaAA(d2, max(fy, fs * 0.5 / sc)); }
  }
  // the foot row (the wall's ends over its own heights, up to 0.3 m)
  float h2 = uTw[0].x + uTw[0].y * (uTw[0].y < 0.0 ? yF + 0.3 : yF), l0 = uTw[0].z + uTw[0].w * (uTw[0].w > 0.0 ? yF + 0.3 : yF);
  float n2 = floor((h2 - l0) / (0.65 * sc) + 0.001), p2 = twOff((h2 - l0) / max(n2, 1.0)), s2 = min(p2 / 0.65, 1.0);
  float j = floor((ws - l0) / p2), wj = l0 + (j + 0.5) * p2, l2 = -1.0, mf = 0.0;
  float zf = j < 0.0 || j > n2 - 0.5 ? 0.0 : min(twFit(wj, 0.17 * s2, yF, 0.0, 0.26), 1.0);
  if (zf >= 0.25) { l2 = 0.055 * zf * (1.0 - (abs(ws - wj) / (0.16 * zf * s2) + abs(ym - 0.2 * zf) / (0.055 * zf))); mf = molaAA(l2, max(fy, fs * 0.4 / s2)) * nk; }
  float pp = molaAA(0.026 - abs(Ht - ym - 0.15), fy) * nk * step(0.55, Ht);
  c = mix(c, cB, max(mb, mf)); c = mix(c, cA, pp); nightK *= (1.0 - mb) * (1.0 - mf) * (1.0 - pp);
  sh = max(sh, max(mb * (1.0 - molaAA(d2 - 0.03 * zb, fy)), mf * (1.0 - molaAA(l2 - 0.02 * zf, fy))));
  return c;
}
// THE TERRACE'S TIERS PAINTED ON A WALL that stands beside them (the rampart's foot, the bowl's rim wall): the same
// cloths, level by world height, their rows running on along the lane azimuth (ws), so wall and tier read as one hill.
// hill = 1 (the rim wall and the plate, above the last real tier): not a tier but the hill, see hillWall.
// hill = -1 (the rampart's base wall): the tiers go on past the last real one, their rows there fitted to the wall (wallTier).
vec3 terWall(float ws, float wm, float fy, float fs, float fwm, float hill, out float shade, out float sh){
  terHl = 0.0;
  float ty = max(vW.y - uTer.x, 0.0) / uTer.y, kt = min(floor(ty), 9.0), ym = (ty - kt) * uTer.y, Ht = uTer.y - 0.2, ci = mod(5.0 - kt, 4.0), shT;
  if (hill > 0.5) {                                 // (the join, by a pixel's footprint: half a pixel of the last tier's lit hem at the hill cloth's foot)
    float yJ = uTer.x + ${TIERS.toFixed(1)} * uTer.y, wP = 1.0 - molaAA(vW.y - yJ, fy);
    vec3 ch = hillWall(wm, yJ, fy, fwm, sh); shade = mix(1.0, 1.17, wP); sh *= 1.0 - wP; return ch;
  }
  vec3 ownT = ci < 0.5 ? uStack[0] : ci < 1.5 ? uStack[1] : ci < 2.5 ? uStack[2] : uStack[3];
  vec3 tA = ci < 0.5 ? uStack[1] : ci < 1.5 ? uStack[3] : ci < 2.5 ? uStack[3] : uStack[1];
  vec3 tB = ci < 0.5 ? uStack[2] : ci < 1.5 ? uStack[2] : ci < 2.5 ? uStack[1] : uStack[0];
  vec3 tC = ci < 0.5 ? uStack[3] : ci < 1.5 ? uStack[0] : ci < 2.5 ? uStack[0] : uStack[2];
  vec3 c = ownT; shade = 1.0; sh = 0.0;
  if (ym < Ht) {
    if (hill < -0.5 && kt > ${(TIERS - 0.5).toFixed(1)}) c = wallTier(ownT, tA, tB, tC, kt, ws, ym, Ht, fy, fs, fwm, shT); else
    c = tierCloth(ownT, tA, tB, tC, tierKind(kt), ws + kt * 0.37, ym, Ht, fy, fs, fwm, kt + 60.0, shT);
    sh = max(shT, max(1.0 - molaAA(Ht - ym - 0.07, fy), (1.0 - molaAA(ym - 0.1, fy)) * 0.8));
    // (its lines by a pixel's footprint: toward the hem's dark line above, and at its foot half a pixel of the tier below's lit hem)
    float wT = molaAA(ym - Ht, fy), wP = (1.0 - molaAA(ym, fy)) * step(0.5, kt);
    shade = mix(mix(1.0, 0.74, wT), 1.17, wP); sh *= (1.0 - wT) * (1.0 - wP); c = mix(c, stackAt(mod(ci + 1.0, 4.0)), wP); nightK *= 1.0 - wP;
  } else {                                            // its hem: a dark line, a light line; then the next tier's shadowed foot (above the last tier the hill's, but on the rampart's base wall, where the tiers go on)
    float wB = 1.0 - molaAA(ym - Ht, fy), wN = molaAA(ym - uTer.y, fy);
    shade = mix(mix(mix(0.74, 1.17, molaAA(ym - Ht - 0.09, fy)), 1.0, wB), 1.0, wN); sh = max(wB, 0.8 * wN);
    c = mix(c, kt > ${(TIERS - 1.5).toFixed(1)} && hill > -0.5 ? uStack[0] : stackAt(mod(ci + 3.0, 4.0)), wN);
    terHl = molaLine(ym, Ht + 0.09, Ht + 0.15, fy);
  }
  return c;
}
void main(){
  float fw = max(length(fwidth(vW)), 1e-4);
  float s = vSQ.x, a = abs(vSQ.y), side = vSQ.y < 0.0 ? 1.0 : 0.0;
  float tierF = a > 29.0 ? mod(a - 30.0, 4.0) : 0.0;
  // the rampart's base wall beside the terrace carries the terrace's own LEVEL tiers (world height, lane azimuth)
  float wx = uTer.z * vW.x, wAz = atan(vW.z, abs(wx) < 1e-4 ? 1e-4 : wx), wS = (1.75 - wAz) * length(vW.xz);
  float wFy = max(fwidth(vW.y), 1e-4), wFs = max(fwidth(wS), 1e-4);
  float hillK = step(${(TIERS - 0.5).toFixed(1)}, floor(max(vW.y - uTer.x, 0.0) / uTer.y));     // above the terrace's last real tier (the tier index terWall itself counts)
  float fq = max(fwidth(vSQ.y), 1e-4), fs = max(fwidth(s), 1e-4), fF = max(fwidth(vSF), 1e-4);
  vec3 nn = cross(dFdx(vW), dFdy(vW));
  vec3 n = dot(nn, nn) > 1e-16 ? normalize(nn) : vec3(0.0, 1.0, 0.0);
  if (dot(n, vW - cameraPosition) > 0.0) n = -n;
  float k = clamp(floor((a - 0.7) / 1.1), 0.0, 2.0);
  float rq = a - (0.7 + 1.1 * k);
  vec3 c; float shade = 1.0, sh = 0.0, hl = 0.0;       // hl: 1 on a hem's LIGHT line (hemNight gathers it on black top cloth)
  // BY A PIXEL'S FOOTPRINT (polish 2, g): a line of this cloth that was a yes or no (a hem's dark and light, a tread's
  // edge, a ledge, a band, the change of cloth at a step's corner) is softened over one pixel of its own measure (fq, fy:
  // q's and a riser's metres to a pixel). Where the cloth changes at such a line, eC is the cloth on the far side of it
  // and eW that cloth's share of the pixel (a half on the line itself, nothing a pixel away).
  vec3 eC = vec3(0.0); float eW = 0.0;
  float fine = 1.0 - smoothstep(0.03, 0.1, fw), nearK = 1.0 - smoothstep(5.0, 9.0, vDist);
  float bend = min(vSQ.z, 1.0), dash = step(0.0, sin(s * 104.7));
  if (vSQ.z > 1.5) {                                  // the back seam's plate at the mouth: the apron's tiers, level by world height; above them the hill
    c = terWall(wS, vSF, wFy, wFs, fw, hillK, shade, sh); hl = terHl;
  } else if (a < 0.7) {                               // the black floor: two rows of slits and a dashed centre seam
    c = uStack[3];
    float cell = floor(s / 0.8 + side * 0.5), x = fract(s / 0.8 + side * 0.5) - 0.5;
    float h = molaHash(vec2(cell, side + 3.0));
    float lz = lozenge(x * 0.8, a - 0.4, 0.27, 0.12);
    float m = molaAA(lz * 0.12, max(fq, fs * 0.33)) * step(0.2, h);
    c = mix(c, h > 0.6 ? uStack[1] : uStack[2], m);
    float lc = lozenge((fract(s / 1.2) - 0.5) * 1.2, a, 0.4, 0.085);
    float mc = molaAA(lc * 0.085, max(fq, fs * 0.2));
    c = mix(c, uStack[0], mc);
    sh = max(1.0 - molaAA(0.7 - a - 0.14, fq), max(m * (1.0 - molaAA(lz * 0.12 - 0.035, fq)) * step(a, 0.4), mc * (1.0 - molaAA(lc * 0.085 - 0.025, fq)) * side));
    eC = uStack[2]; eW = molaAA(a - 0.7, fq);          // (the first riser's foot)
  } else if (a < 4.75) {
    vec3 own = k < 0.5 ? uStack[2] : k < 1.5 ? uStack[1] : uStack[0];
    vec3 under = k < 0.5 ? uStack[3] : k < 1.5 ? uStack[2] : uStack[1];
    vec3 pipe = k < 0.5 ? uStack[1] : k < 1.5 ? uStack[3] : uStack[2];
    c = own;
    if (rq < 0.71) {                                  // riser: a small mola of its own, laid out in TRUE metres
      // hm = metres of cloth per q unit on this riser (1 on a full 0.8 m step; less where the wall is lowered at a window,
      // at the mouth and on the crown), so ym is metres up from the riser's foot and Ht its real height: a motif is
      // either drawn at its own size or left out, never squashed
      float hm = max(vSQ.w, 0.0), Ht = 0.71 * hm, ym = rq * hm, dT = Ht - ym, fy = max(fq * hm, 1e-4);
      { float wF = 1.0 - molaAA(ym, fy), wT = molaAA(-dT, fy); if (wF > wT) { eC = molaShadow(under, 0.9); eW = wF; } else { eC = own * 0.74; eW = wT; } }   // (its foot: the floor or the tread below, in the wall's shadow; its top: the hem's dark line)
      float seg = floor(s / 14.0), xs = s - seg * 14.0;
      float ci = floor(xs / 0.7), x = (fract(xs / 0.7) - 0.5) * 0.7;        // 20 cells to a panel: no motif is cut by a panel's end
      // where the wall is lowering, "tall enough for the motif" is decided ONCE PER 0.7 m CELL (the riser's height carried
      // back to the cell's centre along s, less its fall across half the cell), so a zigzag or a cross is whole or absent
      vec2 gS = vec2(dFdx(s), dFdy(s)), gH = vec2(dFdx(hm), dFdy(hm));
      float gs = clamp(dot(gH, gS) / max(dot(gS, gS), 1e-8), -1.0, 1.0);
      float HtC = 0.71 * (hm - gs * x - abs(gs) * 0.34);
      float full = step(0.56, HtC), some = step(0.24, HtC), kind = mod(seg + k + side * 2.0, 4.0) * full;
      float h = molaHash(vec2(seg * 20.0 + ci, k * 7.0 + side));
      if (molaHash(vec2(seg, 23.0 + side)) > 0.5) { vec3 sw = under; under = pipe; pipe = sw; }   // the two cut colours swap by panel
      float yc = mix(Ht * 0.5 - 0.01, Ht - 0.36, full), ys = mix(min(1.0, Ht * 0.3 / 0.115), 1.0, full);
      float dm = motif(kind, x, (ym - yc) / max(ys, 0.05)) * ys;               // main row: this panel's motif
      float inner = step(0.5, ci) * step(ci, 18.5);
      float m = molaAA(dm, max(fy, fs * 0.45)) * (kind > 0.5 && kind < 1.5 ? 1.0 : step(0.12, h)) * inner * some;
      float xm = xs - 14.0 * step(7.0, xs), dj = 0.17 * lozenge(xm, ym - yc, 0.2, 0.17);   // a diamond medallion on the joint of two panels
      float mj = molaAA(dj, max(fy, fs * 0.8)) * step(0.56, 0.71 * (hm - gs * xm - abs(gs) * 0.2));
      float x2 = (fract(xs / 0.35) - 0.5) * 0.35;
      float h2 = molaHash(vec2(seg * 40.0 + floor(xs / 0.35), k * 3.0 + side + 40.0));
      float l2 = lozenge(x2, ym - 0.1, 0.12, 0.05);                                // second, staggered row at the foot
      float m2 = molaAA(l2 * 0.05, max(fy, fs * 0.4)) * step(0.3, h2) * (1.0 - smoothstep(0.05, 0.14, fw)) * step(0.62, Ht);
      c = mix(c, under, m);
      c = mix(c, pipe, max(m2, mj));
      hemNight(c, (1.0 - molaAA(dm, max(fy, fs * 0.45))) * molaAA(dm + 0.05, max(fy, fs * 0.45)) * (kind > 0.5 && kind < 1.5 ? 1.0 : step(0.12, h)) * inner * some * step(ym, yc) * (1.0 - max(m2, mj)) * hemFar(under) * hemFar(pipe));   // (a cut's own hem on black top cloth; NO TWIN: neither of the riser's two cut cloths)
      float pp = molaAA(0.026 - abs(dT - 0.165), fy) * (1.0 - smoothstep(0.06, 0.16, fw)) * full;   // piping under the hem
      c = mix(c, pipe, pp); nightK *= 1.0 - pp;
      float st = (1.0 - smoothstep(0.0, 0.011, abs(dT - 0.225))) * dash * full + (1.0 - smoothstep(0.0, 0.011, abs(dm + 0.035))) * dash * step(0.12, h) * inner * some;
      shade = 1.0 + 0.3 * min(st, 1.0) * nearK * (1.0 - smoothstep(0.004, 0.014, fw));
      sh = max((1.0 - molaAA(dT - 0.11, fy)) * some, max(m * (1.0 - molaAA(dm - 0.03, fy)) * step(yc, ym), mj * (1.0 - molaAA(dj - 0.03, fy)) * step(yc, ym)));
    } else if (rq < 0.86) {                           // rolled hem: dark below, light above, puckered
      float pk = sin(s * 12.566 + 2.0 * sin(s * 1.3 + uTime * 0.8)) * (0.3 + 0.7 * bend);
      shade = mix(mix(0.74 - 0.08 * pk, 1.16 + 0.08 * pk, molaAA(rq - 0.8, fq)), 1.0, molaAA(rq - 0.86, fq)); hl = molaLine(rq, 0.815, 0.835, fq);   // (the night's line: 6 cm of the 18 cm the light half is wide)
      eC = molaShadow(own, 0.9); eW = 1.0 - molaAA(rq - 0.71, fq);
    } else {                                          // tread (or the ridge shoulder when k = 2)
      float st = (1.0 - smoothstep(0.0, 0.012, abs(rq - 0.93))) * step(0.0, sin(s * 52.4)) * nearK * fine;
      shade = mix(1.16, 1.0 + 0.24 * st, molaAA(rq - 0.86, fq));
      if (k < 1.5) { sh = 1.0 - molaAA(1.1 - rq - 0.11, fq); eC = k < 0.5 ? uStack[1] : uStack[0]; eW = molaAA(rq - 1.1, fq); }   // (the next riser's foot)
      else {
        // THE SHOULDER'S LOZENGES (polish 2, h; the designers' word of 11 Oct: "they may be shorter"). 0.5 m long by 0.22 m
        // high, one to every 0.95 m of THE CLOTH'S OWN METRES along the row (vSF: the shoulder's own length, the shorter of
        // its two lines', so no lozenge is squeezed under half a metre on the inside of a bend), seven in ten of them cut.
        // Before: 1.0 m long, one to 1.9 m of the lane's s, seven in ten. So they are twice as many and half as long, and
        // the share of the row that is cut is the same (0.7 x 0.5 / 0.95 = 0.7 x 1.0 / 1.9 = 0.37). By a pixel's footprint: a
        // dash is drawn while it is two pixels and more, long and high; under one and a half the row is its own mean (the
        // cut cloth's share of the row at this height, as a band), so no dash is ever drawn narrower than that and the
        // fill holds far off.
        float ph = vSF / 0.95 + side * 0.5, h = molaHash(vec2(floor(ph), side + 11.0)), wz = max(fq, fF * 0.44);
        float lz = lozenge((fract(ph) - 0.5) * 0.95, rq - 1.42, 0.25, 0.11);
        float farZ = smoothstep(0.5, 0.667, max(fF / 0.5, fq / 0.22)), hyF = max(0.11, 0.75 * fq);
        float m = mix(molaAA(lz * 0.11, wz) * step(0.3, h), 0.3684 * max(1.0 - abs(rq - 1.42) / hyF, 0.0) * 0.11 / hyF, farZ);
        c = mix(c, under, m);
        sh = m * (1.0 - molaAA(lz * 0.11 - 0.03, fq)) * (1.0 - farZ);
        hl = (1.0 - molaAA(lz * 0.11, wz)) * molaAA(lz * 0.11 + 0.05, wz) * step(0.3, h) * step(rq, 1.42) * (1.0 - farZ) * hemFar(under);   // (the night's line: the cut's hem on its side toward the slot)
        shade = mix(mix(shade, 0.76, molaAA(rq - 1.78, fq)), 1.0, molaAA(a - 4.75, fq));   // the hem where the top cloth rolls over the rampart's edge
      }
    }
  } else if (a > 29.0) {                              // THE TERRACE: level tiers on the front flank beside the mouth
    // q = 30 + 4 x tier + f: f 0..1 the riser (vSQ.w = its height in metres), 1..1.4 its rolled hem, 1.4..2.4 the tread
    // above it (vSQ.w = its width in metres). A tier is one cloth: its cut edge is the riser, its top the tread.
    float kk = clamp(floor((a - 30.0) / 4.0), 0.0, 7.0), f = tierF, ci = mod(5.0 - kk, 4.0), hm = max(vSQ.w, 0.0);
    vec3 own = ci < 0.5 ? uStack[0] : ci < 1.5 ? uStack[1] : ci < 2.5 ? uStack[2] : uStack[3];
    vec3 cA = ci < 0.5 ? uStack[1] : ci < 1.5 ? uStack[3] : ci < 2.5 ? uStack[3] : uStack[1];
    vec3 cB = ci < 0.5 ? uStack[2] : ci < 1.5 ? uStack[2] : ci < 2.5 ? uStack[1] : uStack[0];
    vec3 cC = ci < 0.5 ? uStack[3] : ci < 1.5 ? uStack[0] : ci < 2.5 ? uStack[0] : uStack[2];
    c = own;
    if (f < 1.0) {
      float ym = f * hm, fy = max(fq * hm, 1e-4), shT;
      c = tierCloth(own, cA, cB, cC, tierKind(kk), s + kk * 0.37, ym, hm, fy, fs, fw, kk + 60.0, shT);
      float st = (1.0 - smoothstep(0.0, 0.012, abs(hm - ym - 0.24))) * dash * step(1.0, hm);
      shade = 1.0 + 0.3 * st * nearK * (1.0 - smoothstep(0.004, 0.014, fw));
      sh = max(shT, max(1.0 - molaAA(hm - ym - 0.07, fy), (1.0 - molaAA(ym - 0.1, fy)) * 0.8));
      { float wF = (1.0 - molaAA(ym, fy)) * step(0.5, kk), wT = molaAA(ym - hm, fy); if (wF > wT) { eC = molaShadow(stackAt(mod(ci + 1.0, 4.0)), 0.9); eW = wF; } else { eC = own * 0.74; eW = wT; } }
    } else if (f < 1.4) {                             // the rolled hem: dark underneath, lit on top, puckered
      float pk = sin(s * 8.4 + 2.0 * sin(s * 0.9 + uTime * 0.8));
      shade = mix(mix(mix(0.74 - 0.05 * pk, 1.17 + 0.05 * pk, molaAA(f - 1.15, fq)), 1.08, molaAA(f - 1.3, fq)), 1.06, molaAA(f - 1.4, fq)); hl = molaLine(f, 1.2, 1.25, fq);   // (6 cm of the light part's 19)
      eC = molaShadow(own, 0.9); eW = 1.0 - molaAA(f - 1.0, fq);
    } else {                                          // the tread: the tier's own cloth, lit, a slit row down it, the next riser's shadow
      float ac = (f - 1.4) * hm, fa = max(fq * hm, 1e-4);
      float ph = s / 1.9 + kk * 0.31, lz = 0.1 * lozenge((fract(ph) - 0.5) * 1.9, ac - hm * 0.48, 0.5, 0.1);
      float m = molaAA(lz, max(fa, fs * 0.3)) * step(0.62, hm) * step(0.25, molaHash(vec2(floor(ph), kk + 80.0)));
      c = mix(c, cA, m);
      float st = (1.0 - smoothstep(0.0, 0.012, abs(ac - 0.1))) * step(0.0, sin(s * 52.4)) * nearK * fine;
      shade = 1.06 + 0.24 * st;
      sh = max(1.0 - molaAA(hm - ac - 0.16, fa), m * (1.0 - molaAA(lz - 0.03, fa)));
      if (kk < ${(TIERS - 1.5).toFixed(1)}) { eC = molaShadow(stackAt(mod(ci + 3.0, 4.0)), 0.72); eW = molaAA(f - 2.4, fq); }   // (the next tier's foot)
    }
  } else if (a > 19.0) {                              // the bank behind the uphill shoulder: three level cloth steps
    float t = max(a - 20.0, 0.0), kb = min(floor(t), 3.0), r = t - kb;
    vec3 own = kb < 0.5 ? uStack[3] : kb < 1.5 ? uStack[2] : kb < 2.5 ? uStack[1] : uStack[0];
    vec3 cut = kb < 0.5 ? uStack[1] : kb < 1.5 ? uStack[3] : uStack[0];
    c = own;
    if (kb > 2.5) {                                   // the tuck behind the top tread; round the mouth's bowl (vSQ.w > 1.5: metres of wall) it is the bowl's outer rim wall above the terrace
      shade = 0.78;
      if (vSQ.w > 1.5) {                              // the bowl's rim wall: the terrace's tiers run on round it, and above them the hill; its own hem on top
        float dm = r / 0.6 * vSQ.w, shW, sW;
        c = terWall(vSF, vSF, wFy, fF, fw, hillK, shW, sW);   // (the tiers' rows and the hill's by the wall's own metres, aSF: the wall turns in round the mouth, where s stands still and the azimuth hardly moves)
        float fd = max(fq / 0.6 * vSQ.w, 1e-4), w1 = molaAA(dm - 0.1, fd), w2 = molaAA(dm - 0.17, fd);
        if (hillK > 0.5) c = mix(uStack[0], c, w2);    // (the rim's hem is the ridge cloth's own: a lozenge ends under it)
        shade = mix(mix(1.14, 0.74, w1), shW, w2); sh = sW * w2; hl = max(molaLine(dm, -1.0, 0.06, fd) * mix(molaAA(vSF - uRim, fF), 1.0, hemFar(uStack[2])), terHl * w2);   // (NO TWIN: no line on the rim's hem along the last of the bank, whose middle step's cloth runs beside it there)
      }
    }
    if (kb < 2.5) {
      if (r < 0.8) {                                  // riser: the tall-riser cloth in true metres, the rolled hem on top
        float hm = max(vSQ.w, 0.0), Hb = 0.8 * hm, ym = r * hm, fy = max(fq * hm, 1e-4), shT;
        vec3 cB = kb < 0.5 ? uStack[0] : kb < 1.5 ? uStack[1] : uStack[3], cC = kb < 0.5 ? uStack[2] : kb < 1.5 ? uStack[0] : uStack[2];
        c = tierCloth(own, cut, cB, cC, 0.0, s + kb * 0.53, ym, Hb, fy, fs, fw, kb + 50.0, shT);
        shade = mix(0.76, 1.0, molaAA(Hb - ym - 0.07, fy));
        sh = max(shT, (1.0 - molaAA(ym - 0.07, fy)) * step(0.5, kb));
        { float wF = 1.0 - molaAA(ym, fy), wT = molaAA(ym - Hb, fy); if (wF > wT) { eC = kb < 0.5 ? uStack[0] : molaShadow(kb < 1.5 ? uStack[3] : uStack[2], 0.9); eW = wF; } else { eC = own * 1.16; eW = wT; } }   // (its foot: the shoulder, or the tread below in shadow; its top: the tread's lit edge)
      } else {                                        // tread
        shade = mix(0.76, mix(1.16, 1.0, molaAA(r - 0.86, fq)), molaAA(r - 0.8, fq));
        sh = 1.0 - molaAA(0.955 - r, fq);
        if (kb < 1.5) { eC = molaShadow(kb < 0.5 ? uStack[2] : uStack[1], 0.9); eW = molaAA(r - 1.0, fq); }   // (the next riser's foot)
      }
    }
  } else {                                            // outer face of the rampart: the same four cloths seen edge-on
    float d = a - 4.75, kb = min(floor(d / 0.95), 3.0), rb = d - kb * 0.95;
    vec3 own = kb < 0.5 ? uStack[0] : kb < 1.5 ? uStack[1] : kb < 2.5 ? uStack[2] : uStack[3];
    vec3 nxt = kb < 0.5 ? uStack[1] : kb < 1.5 ? uStack[2] : kb < 2.5 ? uStack[3] : uStack[2];
    c = own;
    float hemK = 1.0 - smoothstep(0.08, 0.3, fw);
    if (kb > 2.5) {                                   // a floor-cloth band, then the top cloth again down to the ground
      if (rb < 0.45) { c = uStack[3]; sh = 1.0 - molaAA(rb - 0.1, fq); if (vSQ.w < 1.5) { eC = uStack[0] * 1.16; eW = molaAA(rb - 0.45, fq); } }
      else if (vSQ.w > 1.5) {
        // beside the terrace its tiers go on up the wall, level, to the floor band above it (the foot of the wall's own
        // three risers), past the last real tier too, as the old cloth had them (polish 2, order 4); above that tier the
        // rows are fitted to the wall, see wallTier. The band's edge by a pixel's footprint from the wall's side alone:
        // the band's side cannot know which tier's cloth lies under it.
        c = terWall(wS, vSF, wFy, wFs, fw, -1.0, shade, sh); hl = terHl;
        eC = uStack[3]; eW = clamp(1.0 - (rb - 0.45) / fq, 0.0, 1.0);
      }
      else {
        float rr = rb - 0.45, row = floor(rr / 0.8), y = fract(rr / 0.8) * 0.8 - 0.4, ph = vSF / 1.3 + row * 0.5;     // (polish 2, e: the rows by the face's own metres)
        float h = molaHash(vec2(floor(ph), row + 20.0));
        float lz = lozenge((fract(ph) - 0.5) * 1.3, y, 0.42, 0.15);
        float m = molaAA(lz * 0.15, max(fq, fF * 0.3)) * step(0.22, h);
        c = mix(uStack[0], h > 0.62 ? uStack[3] : uStack[1], m);
        sh = m * (1.0 - molaAA(lz * 0.15 - 0.035, fq)) * step(0.0, -y);
        hl = (1.0 - molaAA(lz * 0.15, max(fq, fF * 0.3))) * molaAA(lz * 0.15 + 0.05, max(fq, fF * 0.3)) * step(0.22, h) * step(0.0, y) * hemFar(h > 0.62 ? uStack[3] : uStack[1]);   // (the night's line: a cut's own hem under its lower edges)
        { float wj = 1.0 - molaAA(rr - 0.07, fq); shade = mix(shade, 1.16, wj); hl = mix(hl, 1.0, wj); eC = uStack[3]; eW = 1.0 - molaAA(rr, fq); }
      }
    } else if (rb < 0.8) {
      float hm = max(vSQ.w, 0.0), Hb = 0.8 * hm, fy = max(fq * hm, 1e-4), hy = min(0.14, Hb * 0.2);
      float ph = s / 1.15 + kb * 0.41;
      float h = molaHash(vec2(floor(ph), kb + 30.0));
      float lz = lozenge((fract(ph) - 0.5) * 1.15, (rb - 0.36) * hm, 0.38 * hy / 0.14, hy) * hy / 0.14;
      float m = molaAA(lz * 0.14, max(fy, fs * 0.3)) * step(0.15, h) * step(0.3, Hb);
      c = mix(c, nxt, m);
      hl = (1.0 - molaAA(lz * 0.14, max(fy, fs * 0.3))) * molaAA(lz * 0.14 + 0.05, max(fy, fs * 0.3)) * step(0.15, h) * step(0.3, Hb) * step(0.36, rb) * hemFar(nxt);   // (the night's line: a cut's own hem under its lower edges)
      { float hw = molaAA(rb - 0.68, fq) * hemK, hd = molaAA(rb - 0.74, fq); shade = mix(1.0, mix(1.16, 0.74, hd), hw); hl = mix(hl, 1.0 - hd, hw); }
      if (kb < 0.5) shade = mix(0.76, shade, molaAA(d, fq));   // (the roll-over's dark hem above it)
      sh = max(m * (1.0 - molaAA(lz * 0.14 - 0.03, fq)) * step(rb, 0.36), (1.0 - molaAA(rb - 0.1, fq)) * step(0.5, kb));
      { float wT = molaAA(rb - 0.8, fq), wF = (1.0 - molaAA(rb, fq)) * step(0.5, kb); if (wF > wT) { eC = own; eW = wF; } else { eC = nxt; eW = wT; } }   // (its foot: the ledge below, the same cloth out of the shadow; its top: the ledge)
    } else {                                          // the ledge
      c = nxt;
      float wB = 1.0 - molaAA(rb - 0.8, fq), wN = molaAA(rb - 0.95, fq);
      if (wB > wN) { eC = own * mix(1.0, 0.74, hemK); eW = wB; } else { eC = molaShadow(nxt, 0.9); eW = wN; }
    }
  }
  hemNight(c, hl); nightK *= 1.0 - eW;               // (gathered on the cloth itself, before its shade; the cloth across a step's corner lies over it)
  c = mix(molaShadow(c * shade, sh * 0.9), eC, eW);
  c *= molaWeave(vec2(s, a > 29.0 ? vW.y + 0.3 * vW.x : vSQ.y), fw) * molaPuff(n);
  // light: hard yellow lozenges on the black floor (a finer lattice, kept off its hem shadow), on the ridge shoulders
  // and on the terrace's treads; risers, hems, the slot's treads and the bank stay clean cloth
  if (a < 0.7) c = molaLightOn(c, vW, fw, step(a, 0.52) * smoothstep(0.7, 0.9, n.y), 2.6);
  else if ((a > 4.25 && a < 4.75) || tierF > 1.45) c = molaLight(c, vW, n, fw);
  c = hemNightLay(c);                                // (the night's line, after every shade and multiply and after the light: THE NIGHT'S HEM)
  c = molaDepth(molaEcho(c, vW, fw), vDist);
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ helpers
const sphereY = (rho) => SPHERE_R * Math.cos(rho / SPHERE_R) + SPHERE_CY;
// disc (azimuthal equidistant) -> point and normal on the cap
function discToSphere(u, v, out) {
  const rho = Math.hypot(u, v), th = rho / SPHERE_R, st = Math.sin(th), ct = Math.cos(th);
  const cu = rho > 1e-6 ? u / rho : 1, sv = rho > 1e-6 ? v / rho : 0;
  out[0] = SPHERE_R * st * cu; out[1] = SPHERE_R * ct + SPHERE_CY; out[2] = SPHERE_R * st * sv;
  out[3] = st * cu; out[4] = ct; out[5] = st * sv;
  return out;
}

// The master lane: a dense polyline in disc coordinates, resampled to even 3D spacing, with frames.
function buildLane(P) {
  const { mir, phase, wig } = P;
  const raw = [];
  const push = (rho, az) => raw.push([mir * rho * Math.cos(az), rho * Math.sin(az)]);
  const az0 = 95 * Math.PI / 180, az1 = 375 * Math.PI / 180, R0 = 21.0, R1 = 16.0;
  const n1 = 420;
  for (let i = 0; i <= n1; i++) {
    const t = i / n1, e = t * t * (3 - 2 * t);
    const env = smoothstep(0.06, 0.2, t) * (1 - smoothstep(0.82, 0.97, t));
    push(lerp(R0, R1, e) + wig * env * Math.sin(t * 16.5 + phase), lerp(az0, az1, t));
  }
  const n2 = 150;                                    // the hook: a circle of radius R1/2 through the crown
  for (let i = 1; i <= n2; i++) {
    const b = Math.PI * i / n2, r = R1 / 2;
    const x = r * Math.cos(az1) + r * Math.cos(az1 + b), y = r * Math.sin(az1) + r * Math.sin(az1 + b);
    raw.push([mir * x, y]);
  }
  const hx = Math.cos(az1 + 1.5 * Math.PI), hy = Math.sin(az1 + 1.5 * Math.PI);
  for (let i = 1; i <= 40; i++) raw.push([mir * hx * i * 0.25, hy * i * 0.25]);   // 10 m straight past the crown
  // 3D positions on the sphere, cumulative length, resample every STEP metres
  const tmp = new Float64Array(6), pts = raw.map(([u, v]) => { discToSphere(u, v, tmp); return [u, v, tmp[0], tmp[1], tmp[2]]; });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][2] - pts[i - 1][2], pts[i][3] - pts[i - 1][3], pts[i][4] - pts[i - 1][4]));
  const length = cum[cum.length - 1], STEP = 0.4, M = Math.floor(length / STEP);
  P.windows = [[(0.29 + (P.winFrac[0] - 0.24) * 0.25) * length, 0], [(0.8 + (P.winFrac[1] - 0.74) * 0.2) * length, 0]];
  P.windows[0][1] = P.windows[0][0] + 16; P.windows[1][1] = P.windows[1][0] + 9;
  const L = { M, STEP, length: M * STEP, u: new Float32Array(M + 1), v: new Float32Array(M + 1), C: new Float32Array((M + 1) * 3), T: new Float32Array((M + 1) * 3), U: new Float32Array((M + 1) * 3), B: new Float32Array((M + 1) * 3), depth: new Float32Array(M + 1), wide: new Float32Array(M + 1), win: new Float32Array(M + 1), outer: new Float32Array(M + 1), bend: new Float32Array(M + 1), fill: new Float32Array(M + 1), skirt: new Float32Array(M + 1), tz: new Float32Array(M + 1), rise: new Float32Array(M + 1), w3: new Float32Array(M + 1), foot: new Float32Array(M + 1), windows: P.windows };
  let j = 0;
  for (let i = 0; i <= M; i++) {
    const s = i * STEP; while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const f = clamp((s - cum[j]) / Math.max(cum[j + 1] - cum[j], 1e-6), 0, 1);
    const u = lerp(pts[j][0], pts[j + 1][0], f), v = lerp(pts[j][1], pts[j + 1][1], f);
    L.u[i] = u; L.v[i] = v; discToSphere(u, v, tmp);
    L.C[i * 3] = tmp[0] + tmp[3] * LIFT; L.C[i * 3 + 1] = tmp[1] + tmp[4] * LIFT; L.C[i * 3 + 2] = tmp[2] + tmp[5] * LIFT;
    const sEnd = L.length - s;
    L.depth[i] = smoothstep(0.3, 6.5, s) * smoothstep(0.3, 13, sEnd);          // over the crown the walls fall away through the last 13 m
    L.wide[i] = (1 + 0.3 * (1 - smoothstep(3, 12, s))) * (0.25 + 0.75 * smoothstep(0, 1.6, sEnd));   // full width from the mouth (a round forecourt, see APSE); pinched to a point past the crown
    let w = 0; for (const [a, b] of P.windows) w = Math.max(w, smoothstep(a - 3, a, s) * (1 - smoothstep(b, b + 3, s)));
    L.win[i] = w;
  }
  // smooth the bench height a little so the climb is even, then frames
  for (let pass = 0; pass < 6; pass++) for (let i = 1; i < M; i++) L.C[i * 3 + 1] = (L.C[i * 3 - 2] + 2 * L.C[i * 3 + 1] + L.C[i * 3 + 4]) / 4;
  let maxClimb = 0, minRad = 1e9;
  for (let i = 0; i <= M; i++) {
    const a = Math.max(0, i - 1), b = Math.min(M, i + 1);
    let tx = L.C[b * 3] - L.C[a * 3], ty = L.C[b * 3 + 1] - L.C[a * 3 + 1], tz = L.C[b * 3 + 2] - L.C[a * 3 + 2];
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    L.T[i * 3] = tx; L.T[i * 3 + 1] = ty; L.T[i * 3 + 2] = tz;
    maxClimb = Math.max(maxClimb, Math.asin(clamp(ty, -1, 1)));
  }
  // up: UPRIGHT, leaning into the bend exactly as the engine's camera banks (it compares the heading now with the
  // heading 10 m ahead and leans at most 0.28), at 0.8 of that: at most about 12.6 degrees. The trench is a level
  // bench cut into the hill, so both walls stand above the eye and the floor sits at the bottom centre of the frame.
  const AH = Math.round(10 / STEP), bk = new Float32Array(M + 1);
  for (let i = 0; i <= M; i++) {
    const k = Math.min(M, i + AH), turn = L.T[i * 3 + 2] * L.T[k * 3] - L.T[i * 3] * L.T[k * 3 + 2];
    bk[i] = clamp(-turn * 0.55, -0.28, 0.28) * 0.8;
  }
  for (let pass = 0; pass < 8; pass++) for (let i = 1; i < M; i++) bk[i] = (bk[i - 1] + 2 * bk[i] + bk[i + 1]) / 4;
  for (let i = 0; i <= M; i++) {
    const tx = L.T[i * 3], ty = L.T[i * 3 + 1], tz = L.T[i * 3 + 2], hl = Math.hypot(tx, tz) || 1;
    let ux = (-tz / hl) * bk[i], uy = 1, uz = (tx / hl) * bk[i];
    // right = T x U, then make U square to T
    let bx = ty * uz - tz * uy, by = tz * ux - tx * uz, bz = tx * uy - ty * ux;
    const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
    L.B[i * 3] = bx; L.B[i * 3 + 1] = by; L.B[i * 3 + 2] = bz;
    L.U[i * 3] = by * tz - bz * ty; L.U[i * 3 + 1] = bz * tx - bx * tz; L.U[i * 3 + 2] = bx * ty - by * tx;
    // which side is downhill (outer): +1 when B points away from the dome's axis
    L.outer[i] = (bx * L.C[i * 3] + bz * L.C[i * 3 + 2]) >= 0 ? 1 : -1;
  }
  for (let i = 0; i <= M; i++) {
    const a = Math.max(0, i - 5), b = Math.min(M, i + 5);
    const d = Math.hypot(L.T[b * 3] - L.T[a * 3], L.T[b * 3 + 1] - L.T[a * 3 + 1], L.T[b * 3 + 2] - L.T[a * 3 + 2]);
    const rad = ((b - a) * STEP) / Math.max(d, 1e-4); minRad = Math.min(minRad, rad);
    L.bend[i] = clamp(12 / rad, 0, 1);
    // downhill side: how far the bench edge stands above the natural dome (or the sand). Where that is little the
    // dome is filled up to the bench as a bank; where it is much the rampart's own outer wall (the skirt) shows.
    const o = L.outer[i], e = HALF_LIP * L.wide[i] + SHOULDER, ex = L.C[i * 3] + L.B[i * 3] * o * e, ey = L.C[i * 3 + 1] + L.B[i * 3 + 1] * o * e, ez = L.C[i * 3 + 2] + L.B[i * 3 + 2] * o * e;
    const r2 = ex * ex + ez * ez, nat = r2 < 17.9 * 17.9 ? Math.sqrt(SPHERE_R * SPHERE_R - r2) + SPHERE_CY : 0, raise = ey - nat;
    L.fill[i] = r2 < 17.6 * 17.6 ? (1 - smoothstep(1.2, 2.6, raise)) * smoothstep(20, 27, i * STEP) : 0;   // none over the first 20 m: the rampart's own stepped outer wall stands down to the apron there
    L.skirt[i] = Math.min(clamp(raise + 2.9, 0.8, 12), ey + 0.5);   // 2.9 m into the hill: the terrace beside the mouth is cut up to 2.2 m below the natural surface
    // uphill side: how far the natural dome stands above the bench at the far edge of the BANK (three steps of
    // BANK_T beyond the shoulder). The bank's risers share that rise; the dome under it is pushed just below.
    const eu = e + 3 * BANK_T, ux = L.C[i * 3] - L.B[i * 3] * o * eu, uy = L.C[i * 3 + 1] - L.B[i * 3 + 1] * o * eu, uz = L.C[i * 3 + 2] - L.B[i * 3 + 2] * o * eu;
    const ru = ux * ux + uz * uz;
    L.rise[i] = (ru < 17.9 * 17.9 ? Math.sqrt(SPHERE_R * SPHERE_R - ru) + SPHERE_CY : 0) - uy;
  }
  for (let pass = 0; pass < 10; pass++) for (let i = 1; i < M; i++) { L.fill[i] = (L.fill[i - 1] + 2 * L.fill[i] + L.fill[i + 1]) / 4; L.skirt[i] = (L.skirt[i - 1] + 2 * L.skirt[i] + L.skirt[i + 1]) / 4; L.rise[i] = (L.rise[i - 1] + 2 * L.rise[i] + L.rise[i + 1]) / 4; }
  for (let i = 0; i <= M; i++) L.w3[i] = 3 * (0.05 + (BANK_T - 0.05) * smoothstep(-0.3, 0.5, L.rise[i]));   // the bank folds away where there is no hill to hold
  // (polish 2) L.foot: plan metres from the lip out to the foot of the rampart's base wall, by the outer face's own measures
  // (sideProfile: three risers that step out 0.15 m each, then the base wall): where the slot's own mesh ends downhill
  for (let i = 0; i <= M; i++) {
    const d = L.depth[i], w = L.win[i], Hs = Math.max(L.skirt[i] - (SLOT_DEPTH * d - RISER * d * (3 - w * (3 - 0.5 / RISER))), 0.6), ss = clamp((Hs - 0.5) / 2.4, 0.1, 1);
    L.foot[i] = SHOULDER + 0.1 + 0.45 * ss + 0.05 * Math.max(Hs - 0.1 - 2.4 * ss, 0.05);
  }
  L.maxClimb = maxClimb; L.minRadius = minRad;
  // lookup grid over the ground plan (world x, z): nearest station per cell
  const GN = 160, cell = (2 * XE) / GN, grid = new Int16Array(GN * GN).fill(-1), gd = new Float32Array(GN * GN).fill(1e9), reach = 7;
  // (stamped in slices by the caller, L.stamp(i0, i1), with a yield between: run cold in one go it is a 40 ms step)
  L.stamp = (i0, i1) => {
    for (let i = i0; i <= Math.min(i1, M); i++) {
      const cu = L.C[i * 3], cv = L.C[i * 3 + 2];
      const x0 = Math.max(0, Math.floor((cu - reach + XE) / cell)), x1 = Math.min(GN - 1, Math.floor((cu + reach + XE) / cell));
      const y0 = Math.max(0, Math.floor((cv - reach + XE) / cell)), y1 = Math.min(GN - 1, Math.floor((cv + reach + XE) / cell));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const du = (x + 0.5) * cell - XE - cu, dv = (y + 0.5) * cell - XE - cv, d = du * du + dv * dv;
        if (d < gd[y * GN + x]) { gd[y * GN + x] = d; grid[y * GN + x] = i; }
      }
    }
  };
  // nearest point on the lane in plan: out = [distance, fractional station]
  L.near = (x, z, out) => {
    const gx = Math.floor((x + XE) / cell), gy = Math.floor((z + XE) / cell);
    const i0 = gx >= 0 && gy >= 0 && gx < GN && gy < GN ? grid[gy * GN + gx] : -1;
    if (i0 < 0) { out[0] = 99; out[1] = 0; return out; }
    let best = 1e9, bi = i0, bf = 0;
    for (let i = Math.max(0, i0 - 4); i < Math.min(M, i0 + 4); i++) {
      const ax = L.C[i * 3], ay = L.C[i * 3 + 2], ex = L.C[i * 3 + 3] - ax, ey = L.C[i * 3 + 5] - ay;
      const f = clamp(((x - ax) * ex + (z - ay) * ey) / Math.max(ex * ex + ey * ey, 1e-9), 0, 1);
      const px = x - ax - ex * f, py = z - ay - ey * f, d = px * px + py * py;
      if (d < best) { best = d; bi = i; bf = f; }
    }
    out[0] = Math.sqrt(best); out[1] = bi + bf; return out;
  };
  // The lookup names, for a cell of 0.3 m, the station nearest to the cell's CENTRE: beside the line that lies as far
  // from one stretch of the lane as from another (the front flank between the mouth's stretch and the hook's, 7 to 10 m
  // apart in plan) L.near therefore answers, on one side of a zigzag of cells, with the farther stretch (up to 0.7 m too
  // far): the maze texture's lane distance and the bench cut into the dome's grid both tore along that zigzag (polish 1:
  // the torn patches beside the bowl on the drop). Every anchor, hero.heightAt and the terrace keep L.near as it is. The
  // maze texture and the dome grid's bench (benchOffset, from the grid alone) ask further, both by the one measure:
  // THE LEAST LANE DISTANCE (L.least): L.near's answer, or that of another stretch of the lane where one of the eight
  // cells round the place's own names a station whose search does not overlap L.near's (8 stations or more away) and
  // that stretch is nearer, measured as the texture and the bench measure (the plan distance less the forecourt's
  // widening at that station: the distance beyond the lip). Never against the lane's last 13 m, where the walls fall
  // away past the crown: there the answer is L.near's, as it was. out = [distance, fractional station], as L.near. The
  // cells that have such a neighbour are marked once, at the first call (the grid is whole by then: the caller stamps
  // it before the texture is built).
  const about = (x, z, i0, out) => {                 // L.near's own search, about a given station
    let best = 1e9, bi = i0, bf = 0;
    for (let i = Math.max(0, i0 - 4); i < Math.min(M, i0 + 4); i++) {
      const ax = L.C[i * 3], ay = L.C[i * 3 + 2], ex = L.C[i * 3 + 3] - ax, ey = L.C[i * 3 + 5] - ay;
      const f = clamp(((x - ax) * ex + (z - ay) * ey) / Math.max(ex * ex + ey * ey, 1e-9), 0, 1);
      const px = x - ax - ex * f, py = z - ay - ey * f, d = px * px + py * py;
      if (d < best) { best = d; bi = i; bf = f; }
    }
    out[0] = Math.sqrt(best); out[1] = bi + bf; return out;
  };
  // (the forecourt's widening at a FRACTIONAL station: between two stations it runs evenly, it does not step)
  L.wideAt = (st) => { const i = Math.max(0, Math.min(M - 1, Math.floor(st))); return lerp(L.wide[i], L.wide[i + 1], clamp(st - i, 0, 1)); };
  const wideOff = (st) => HALF_LIP * (L.wideAt(st) - 1), alt = [0, 0];
  let seam = null;
  const endN = M - Math.round(13 / STEP);         // the first station of the lane's last 13 m
  L.least = (x, z, out) => {
    L.near(x, z, out);
    if (out[0] > 90) return out;
    if (!seam) {
      seam = new Uint8Array(GN * GN);
      for (let y = 1; y < GN - 1; y++) for (let xx = 1; xx < GN - 1; xx++) {
        const c = grid[y * GN + xx]; if (c < 0) continue;
        for (let k = 0; k < 9; k++) { const n = grid[(y + Math.floor(k / 3) - 1) * GN + xx + k % 3 - 1]; if (n >= 0 && Math.abs(n - c) >= 8 && Math.max(n, c) < endN) { seam[y * GN + xx] = 1; break; } }
      }
    }
    const gx = Math.floor((x + XE) / cell), gy = Math.floor((z + XE) / cell), o = gy * GN + gx;
    if (!seam[o]) return out;
    const i0 = grid[o];
    for (let k = 0; k < 9; k++) {
      const j0 = grid[o + (Math.floor(k / 3) - 1) * GN + k % 3 - 1];
      if (j0 < 0 || Math.abs(j0 - i0) < 8 || Math.max(j0, i0) >= endN) continue;
      about(x, z, j0, alt);
      if (alt[0] - wideOff(alt[1]) < out[0] - wideOff(out[1])) { out[0] = alt[0]; out[1] = alt[1]; }
    }
    return out;
  };
  return L;
}

// The bench (rampart): VERTICAL displacement of a dome point q = [x,y,z,...] near the lane, so that the hill is cut
// level on the uphill side (and ramped 0.35 m under the strip's bank) and, where L.fill allows, banked up on the
// downhill side. Under the slot the dome is pushed below the floor.
// info = [lateral distance, lip half-width, place on the gutter's taper behind the bank's top tread (0 .. 1; 9 where
// there is no bank), metres the bank's ramp lies under the hill there before the taper, s, plan metres BEYOND THE FOOT
// OF THE SLOT'S OWN MESH (polish 2: downhill the rampart's base wall, L.foot; uphill the back of the bank's top tread;
// negative under the mesh, 99 far from the lane)].
function benchOffset(L, q, nr, info, near = L.near) {
  near(q[0], q[2], nr);
  info[0] = 99; info[1] = 1; info[2] = 9; info[3] = 0; info[4] = 0; info[5] = 99;
  if (nr[0] > 7.5) return 0;
  const M = L.M, i = Math.min(M - 1, Math.floor(nr[1])), f = nr[1] - i, i3 = i * 3;
  const mix3 = (A, k) => A[i3 + k] + (A[i3 + 3 + k] - A[i3 + k]) * f;
  const ux = mix3(L.U, 0), uy = Math.max(mix3(L.U, 1), 0.5), uz = mix3(L.U, 2);
  const bx = mix3(L.B, 0), by = mix3(L.B, 1), bz = mix3(L.B, 2);
  const tx = mix3(L.T, 0), ty = mix3(L.T, 1), tz = mix3(L.T, 2);
  const depth = lerp(L.depth[i], L.depth[i + 1], f), wide = lerp(L.wide[i], L.wide[i + 1], f), win = lerp(L.win[i], L.win[i + 1], f), fill = lerp(L.fill[i], L.fill[i + 1], f);
  const dx = q[0] - mix3(L.C, 0), dy = q[1] - mix3(L.C, 1), dz = q[2] - mix3(L.C, 2);
  const h0 = -(dx * ux + dy * uy + dz * uz) / uy;                 // lift that puts the point on the bench plane
  const lat = dx * bx + (dy + h0) * by + dz * bz, al = dx * tx + (dy + h0) * ty + dz * tz;
  const ends = nr[1] <= 0.001 || nr[1] >= M - 0.001, a = ends ? Math.hypot(lat, al) : Math.abs(lat);
  const side = (lat >= 0 ? 1 : -1) * L.outer[i];
  const lip = HALF_LIP * wide, benchW = lip + SHOULDER;
  const drop = smoothstep(0.0, 0.6, Math.abs(lat)) * (side > 0 ? 1 : 0) * SLOT_DEPTH * depth * win * (1 - 0.5 / SLOT_DEPTH);
  let g = 0;
  if (a < lip + 0.25) g = -(SLOT_DEPTH * depth + 0.5);
  else if (a < benchW - 0.1) g = lerp(-(SLOT_DEPTH * depth + 0.5), -0.3, (a - lip - 0.25) / Math.max(benchW - 0.35 - lip, 0.05));
  else g = -0.3 * (1 - smoothstep(benchW - 0.05, benchW + 0.15, a));
  let h = h0 + (g - drop) / uy;
  info[0] = a; info[1] = lip;
  info[5] = a - lip - (side > 0 ? lerp(L.foot[i], L.foot[i + 1], f) : SHOULDER + 0.04 + lerp(L.w3[i], L.w3[i + 1], f) * (ends ? 1 - 0.9 * smoothstep(1.05, 1.5708, Math.acos(clamp(Math.abs(lat) / Math.max(a, 1e-6), 0, 1))) : 1));
  // uphill: the dome follows a ramp 0.35 m under the bank's three steps, from the shoulder up to where the bank meets
  // the natural hill (it is hidden by the bank strip; round the strip's two ends it shows, as the hill's hem: info[2..3])
  const rise = lerp(L.rise[i], L.rise[i + 1], f), w3 = lerp(L.w3[i], L.w3[i + 1], f);
  if (side < 0 && rise > 0.05 && a >= benchW - 0.1) {
    // round the strip's end the bank is revolved (see APSE below): its rise falls as cos(phi) and its treads close up
    // (The lane's frame leans, its up is not the vertical, and this grid can only move vertically: so the bank's steps
    // are built rising VERTICALLY from the bench plane, see the slot's rows. A bank point's plan position is then that
    // of its foot on the bench plane and the ramp below is the bank's own, 0.35 m under every step. When the steps
    // rose along the lane's leaning up, the 6 m bank at the mouth stood 1.3 m further into the hill than this ramp:
    // the grid lay in front of the bowl's steps as a smeared slope.)
    const cph = ends ? Math.abs(lat) / Math.max(a, 1e-6) : 1, w3e = ends ? w3 * (1 - 0.9 * smoothstep(1.05, 1.5708, Math.acos(clamp(cph, 0, 1)))) : w3;
    const tb = (a - benchW) / w3e, hb = h0 + rise * cph * clamp(tb, 0, 1) - 0.35;
    // (for the cloth, two EVEN measures a vertex: where the place lies on the gutter's taper, 0 to 1, and how deep the
    // ramp lies under the hill there before the taper, metres; the cloth works the cut's depth out of them a pixel at a time)
    info[2] = (a - benchW - w3e - 0.3) / 0.55; info[3] = Math.max(0, -hb);
    if (hb < 0) {
      const d = hb * (1 - smoothstep(benchW + w3e + 0.3, benchW + w3e + 0.85, a));   // a 0.3 m gutter behind the top tread, so no grid triangle pokes through it
      info[4] = nr[1] * L.STEP + (ends ? al : 0);
      return d;
    }
  }
  if (h > 0) { if (a < lip + 0.25) return 0; return (1 - smoothstep(benchW, benchW + 2 * BANK_W, a)) * h * fill; }   // the fill bank is twice as wide: no face steeper than about 45 degrees
  return (1 - smoothstep(benchW, benchW + BANK_W, a)) * h;
}

// ------------------------------------------------------------------ the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
  // every random draw first, in a fixed order (no yields in between)
  const P = {
    mir: opts.winding ? (opts.winding > 0 ? 1 : -1) : (rng.chance(0.5) ? 1 : -1),
    pitch: opts.pitch ?? (rng.chance(0.55) ? 2.0 : 3.2),
    dir: rng.range(0, Math.PI), nx: rng.range(-50, 50), ny: rng.range(-50, 50),
    phase: rng.range(0, 6.283), wig: rng.range(0.6, 0.95),
    winFrac: [rng.range(0.24, 0.3), rng.range(0.74, 0.8)],
    warp: rng.range(5.4, 7.4), lam: rng.range(13, 18), dis: [],
  };
  for (let i = 0; i < 7; i++) { const r = 21 * Math.sqrt(rng()), a = rng.range(0, 6.283); P.dis.push([r * Math.cos(a), r * Math.sin(a), rng.sign()]); }
  const shared = opts.shared || makeShared(opts);
  const U = shared.uniforms, pal = U.uPal.value;
  const stackU = { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] };
  const apronStack = new THREE.Vector4(3, 2, 1, 0), farU = { value: new THREE.Vector4(0, 0, 0, 1) }, farC = new THREE.Color();
  const setLivery = (name) => {
    const ix = LIVERY[name] || LIVERY.noon; for (let i = 0; i < 4; i++) stackU.value[i].copy(pal[ix[i]]);
    apronStack.set(ix[3], ix[2], ix[1], ix[0]); U.uLightCol.value.copy(pal[name === 'night' ? 6 : 4]);
    // far colour of the maze (bands under a pixel): top cloth mixed 42% toward the mean of the cuts; at night, where
    // the top cloth is black, 60% of the brightest cut so the far dome is a lit shape and not a grey blob
    const s = stackU.value;
    if (name === 'night') farC.copy(s[0]).lerp(s[1], 0.6); else farC.setRGB((s[1].r + s[2].r + s[3].r) / 3, (s[1].g + s[2].g + s[3].g) / 3, (s[1].b + s[2].b + s[3].b) / 3).lerp(s[0], 0.58);
    farU.value.set(farC.r, farC.g, farC.b, 1);
  };
  setLivery(opts.livery || 'noon');
  const root = new THREE.Group(); root.name = 'mola-reef-hero';
  await ctx.yield();

  const L = buildLane(P);
  await ctx.yield();
  for (let i = 0; i <= L.M; i += 40) { L.stamp(i, i + 39); await ctx.yield(); }

  // ---- the maze: distance to groove centre-lines on the unwrapped disc (R), lane distance (G: LANE_G0 .. LANE_G0 + LANE_GS)
  const N = TEX_N, texel = (2 * DISC_E) / N, pitch = P.pitch;
  const ph = new Float32Array(N * N), ca = Math.cos(P.dir), sa = Math.sin(P.dir), TAU = Math.PI * 2;
  for (let y = 0; y < N; y++) {
    const v = (y + 0.5) * texel - DISC_E;
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) * texel - DISC_E;
      if (u * u + v * v > 680) continue;
      // the grooves wind ROUND the hill (phase = distance from the crown, warped a little, so a ridge wanders a few metres
      // up and down as it goes round but never runs downhill), with seeded dislocations of exactly one period (a fork, no seam)
      let p = Math.hypot(u, v) + 0.42 * P.warp * noise.n2(u / P.lam + P.nx, v / P.lam + P.ny) + P.warp * 0.1 * noise.n2(u / (P.lam * 0.45) - P.ny, v / (P.lam * 0.45) + P.nx) + 0.6 * (u * ca + v * sa) * Math.exp(-(u * u + v * v) / 60);
      // the dislocations: the sum of their signed angles is the angle of one complex product (equal up to whole turns,
      // and only the fraction of the phase is ever read), so one atan2 does for all seven
      let zr = 1, zi = 0;
      for (let k = 0; k < P.dis.length; k++) { const d = P.dis[k], a = u - d[0] + 1e-9, b = (v - d[1]) * d[2], t = zr * a - zi * b; zi = zr * b + zi * a; zr = t; }
      ph[y * N + x] = p / (pitch * 1.2) + Math.atan2(zi, zr) / TAU;
    }
    await ctx.yield();
  }
  const data = new Uint8Array(N * N * 4), nr = [0, 0, 0], t6 = new Float64Array(6);
  const wrap = (d) => d - Math.round(d);
  for (let y = 0; y < N; y++) {
    const v = (y + 0.5) * texel - DISC_E, ym = Math.max(0, y - 1), yp = Math.min(N - 1, y + 1);
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) * texel - DISC_E, xm = Math.max(0, x - 1), xp = Math.min(N - 1, x + 1), o = y * N + x;
      if (u * u + v * v > 670) { data[o * 4] = 255; data[o * 4 + 1] = 255; data[o * 4 + 2] = 255; data[o * 4 + 3] = 255; continue; }
      const gx = wrap(ph[y * N + xp] - ph[y * N + xm]) / ((xp - xm) * texel), gy = wrap(ph[yp * N + x] - ph[ym * N + x]) / ((yp - ym) * texel);
      const grad = Math.max(Math.hypot(gx, gy) * pitch, 0.4);
      const f = ph[o] - Math.floor(ph[o]);
      let D = Math.min(Math.abs(f - 0.5) * Math.max(pitch / grad, 2.0), D_MAX);
      data[o * 4 + 2] = Math.round(clamp(D / D_MAX, 0, 1) * 255);
      discToSphere(u, v, t6); L.least(t6[0], t6[2], nr);         // lane distance in plan (the bench is level), the least over the lane's stretches
      let dmN = DM_MAX, kc = 1;
      if (nr[0] < 12) {
        dmN = Math.max(0, nr[0] - HALF_LIP * (L.wideAt(nr[1]) - 1));
        // IN CLOTH METRES (polish 2, d). The lane distance is a plan distance (the bench is level), and the ramp that ends
        // a groove at the lane margin, the echo groove's own bands and the margin's measure were laid in it: on the steep
        // flank a plan metre is 1.1 to 1.9 m of cloth, so those bands lay pulled long across the face. kc = metres of
        // cloth to a plan metre here, along the lane distance's own rise (g: away from the nearest point of the lane's
        // line), on the sphere the cloth lies on. The lines stay where they stand in plan (3.1 m the echo groove, 4.5 m the
        // ramp's foot, 4.55 m the margin); what is measured FROM them is measured in cloth metres.
        const ib = Math.min(L.M - 1, Math.floor(nr[1])), fb = nr[1] - ib, gx = t6[0] - (L.C[ib * 3] + (L.C[ib * 3 + 3] - L.C[ib * 3]) * fb), gz = t6[2] - (L.C[ib * 3 + 2] + (L.C[ib * 3 + 5] - L.C[ib * 3 + 2]) * fb), gl = Math.hypot(gx, gz);
        const sl = gl > 1e-6 ? (t6[3] * gx + t6[5] * gz) / (gl * Math.max(t6[4], 0.05)) : 0;
        kc = Math.sqrt(1 + sl * sl);
        D = 0.5 - Math.min(0.5 - D, (dmN - (ECHO_AT + 1.4)) * kc * 0.7);   // a plain ridge band to 4.5 m: the hill's hem behind the bank's top step
        D = Math.min(D, Math.abs(dmN - ECHO_AT) * kc, D_MAX);
      }
      data[o * 4] = Math.round(clamp(D / D_MAX, 0, 1) * 255);
      data[o * 4 + 1] = Math.round(clamp((4.55 + (dmN - 4.55) * kc - LANE_G0) / LANE_GS, 0, 1) * 255);   // (the margin's measure: cloth metres about its line)
      data[o * 4 + 3] = 255;                               // A: nothing here (the cloth read nothing of it before); a corner of it holds the hem rows' table (THE HILL'S HEM ROWS, WHOLE OR ABSENT, below)
    }
    await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
  const mazeD = (u, v) => {                          // bilinear read of R, metres
    const fx = clamp((u + DISC_E) / texel - 0.5, 0, N - 1.001), fy = clamp((v + DISC_E) / texel - 0.5, 0, N - 1.001);
    const x = Math.floor(fx), y = Math.floor(fy), ax = fx - x, ay = fy - y, o = (y * N + x) * 4;
    return ((data[o] * (1 - ax) + data[o + 4] * ax) * (1 - ay) + (data[o + N * 4] * (1 - ax) + data[o + N * 4 + 4] * ax) * ay) * (D_MAX / 255);
  };
  const relief = (D) => -0.46 * (1 - smoothstep(0.06, 0.54, D)) + 0.16 * smoothstep(0.5, 0.95, D);
  await ctx.yield();

  // ---- THE TERRACE (plan): on the front flank beside the mouth, on the side the camera drops in from (lane azimuth
  // 24 to about 95 degrees, between the mouth's bowl and the wall of the hook), the hill is not a maze on a 65 degree
  // slope but five LEVEL TIERS: real steps cut into the sphere on circles about the dome's axis, at the heights of the
  // bowl's own bank steps (two more below the bench), each a riser with the tall-riser cloth and a rolled hem and a level
  // tread with a slit row and the light on it. The tiers start on the rim of the mouth's bowl and on its bastion (the
  // curve G below, so the bowl's rim wall and the bastion's face close them) and run round until they pass behind the
  // rampart's outer wall. The dome's own grid is pushed 2.7 m under them (terracePush) and its maze begins again
  // above the top tread. Built as part of the slot's geometry (aSQ.y from 30 on), see "the terrace" below.
  const TRC = (() => {
    const mir = P.mir, o0 = L.outer[0], D2R = Math.PI / 180;
    const p0x = L.C[0] * mir, p0z = L.C[2], Yb = L.C[1];
    let bx = -o0 * L.B[0] * mir, bz = -o0 * L.B[2], tx = -L.T[0] * mir, tz = -L.T[2];          // uphill and back (plan, lane frame)
    const bl = Math.hypot(bx, bz) || 1, tl = Math.hypot(tx, tz) || 1; bx /= bl; bz /= bl; tx /= tl; tz /= tl;
    const Rr = L.rise[0], rr = Math.max(Rr, 0) * smoothstep(-0.3, 0.5, Rr) / 3, lip0 = HALF_LIP * L.wide[0], tw0 = L.w3[0] / 3;
    const Rn = (y) => Math.sqrt(Math.max(SPHERE_R * SPHERE_R - (y - SPHERE_CY) * (y - SPHERE_CY), 0));   // plan radius at which the sphere stands y high
    // THE APRON OF TIERS (the designers' ruling: tiers stay only at the mouth, as the groove's own apron at the dome's
    // foot): TIERS = 2 steps from the sand up to the bench the mouth stands on. Above the bench the hill is the maze.
    const Y = []; for (let k = -2; k <= 3; k++) Y.push(Yb + rr * k - 0.03);
    const rho = []; for (let k = 0; k < TIERS; k++) rho.push(k < TIERS - 1 ? Rn(Y[k + 1]) - 0.12 : Rn(Y[TIERS] - 0.4));
    rho.push(Rn(Y[TIERS] + 0.55));                                                             // the top tread runs on into the hill
    const gamR = (th) => { const ts = 1 - 0.9 * smoothstep(1.05, 1.5708, Math.min(th, 1.5708)), rim = lip0 + SHOULDER + 3 * tw0 * ts + 0.01; return lerp(rim, lip0 + SHOULDER - 0.2, smoothstep(1.5708, 2.1, th)); };
    const gam = (th, out) => {                         // the start curve G: the bowl's rim (th 0 uphill .. 90 degrees back), then a circle inside the bastion
      const r = gamR(th), c = Math.cos(th), s = Math.sin(th);
      out[0] = p0x + r * (bx * c + tx * s); out[1] = p0z + r * (bz * c + tz * s); return out;
    };
    // metres OUTSIDE the start curve G, measured from the bowl's centre (negative inside the bowl or the bastion); 99 on the
    // front side of the bowl (th < 0), where G does not run
    const outG = (x, z) => { const dx = x * mir - p0x, dz = z - p0z, cb = dx * bx + dz * bz, ct = dx * tx + dz * tz; return ct < 0 ? 99 : Math.hypot(cb, ct) - gamR(Math.atan2(ct, cb)); };
    const g2 = [0, 0], R0 = 11.5, DR = 0.05, NT = Math.ceil((19.5 - R0) / DR) + 1, azTab = new Float32Array(NT);
    for (let i = 0; i < NT; i++) {
      const r = R0 + i * DR; let lo = 0, hi = Math.PI;
      if (Math.hypot(gam(0, g2)[0], g2[1]) >= r) hi = 0; else for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; gam(m, g2); if (Math.hypot(g2[0], g2[1]) < r) lo = m; else hi = m; }
      gam(hi, g2); azTab[i] = Math.atan2(g2[1], g2[0]);
    }
    const az0 = (r) => { const f = clamp((r - R0) / DR, 0, NT - 1.001), i = Math.floor(f); return azTab[i] + (azTab[i + 1] - azTab[i]) * (f - i); };
    // metres on the downhill side of the lane's centre-line (99 when the lane is not near): the tiers and the push stop under the rampart's shoulder
    const sideDown = (x, z, nr) => {
      if (nr[0] > 7.2) return 99;
      const i = Math.min(L.M - 1, Math.floor(nr[1])), i3 = i * 3;
      if (nr[1] <= 0.001) return 99;                   // beside the mouth the start curve decides
      return ((x - L.C[i3]) * L.B[i3] + (z - L.C[i3 + 2]) * L.B[i3 + 2]) * L.outer[i];
    };
    const azE = 24 * D2R, YT = Y[TIERS];
    // how far the dome's own grid is pushed under the terrace at a point of the natural surface (0..1); nr = the lane lookup's answer there (L.least's since polish 1)
    const push = (x, z, yNat, nr) => {
      if (yNat > YT - 0.08) return 0;
      const r = Math.hypot(x, z), az = Math.atan2(z, x * mir);
      if (az < azE - 0.02 || az > 1.9 || r < R0) return 0;
      // (the push runs on 0.7 m INSIDE the curve G and is over by 1.3 m inside it, so the cliff it leaves in the grid stands
      // behind the bowl's rim wall and inside the bastion, under their treads, and none of it shows from outside)
      const og = outG(x, z), inG = og < 50 ? smoothstep(-1.3, -0.7, og) : 0;
      const m = (1 - smoothstep(YT - 0.38, YT - 0.08, yNat)) * smoothstep(0.2, 0.9, (az - azE) * r) * Math.max(smoothstep(-0.5, -0.05, (az0(r) - az) * r), inG);
      return m > 0 ? m * smoothstep(2.15, 2.6, sideDown(x, z, nr)) : 0;
    };
    // stations whose outer wall stands over the terrace (its foot inside the terrace's sector): L.tz = 1
    for (let i = 0; i <= L.M; i++) {
      const o = L.outer[i], e = 2.9, x = L.C[i * 3] + L.B[i * 3] * o * e, z = L.C[i * 3 + 2] + L.B[i * 3 + 2] * o * e, r = Math.hypot(x, z), az = Math.atan2(z, x * mir);
      L.tz[i] = i * L.STEP > 40 && az > azE - 0.12 && az < 1.85 && r > Rn(YT) - 0.6 && r < 18.6 ? 1 : 0;   // (only a wall whose foot is on the apron's tiers)
    }
    // (polish 2) the terrace's own place in plan, 0 to 1: push without its gate of height. Above the top tread the dome
    // comes out of the tread on the level line where the sphere stands YT high: rhoT, that line's metres from the crown.
    const sector = (x, z, nr) => {
      const r = Math.hypot(x, z), az = Math.atan2(z, x * mir);
      if (az < azE - 0.02 || az > 1.9 || r < R0) return 0;
      const og = outG(x, z), inG = og < 50 ? smoothstep(-1.3, -0.7, og) : 0;
      const m = smoothstep(0.2, 0.9, (az - azE) * r) * Math.max(smoothstep(-0.5, -0.05, (az0(r) - az) * r), inG);
      return m > 0 ? m * smoothstep(2.15, 2.6, sideDown(x, z, nr)) : 0;
    };
    return { mir, Yb, rr, Y, rho, az0, azE, YT, push, sideDown, Rn, sector, rhoT: SPHERE_R * Math.acos(clamp((YT - SPHERE_CY) / SPHERE_R, -1, 1)) };
  })();
  // THE RELIEF STANDS LEVEL AT THE SLOT'S FOOT (polish 2, b). The dome's grid ran into the slot's own mesh with its groove
  // relief on (0.46 m down, 0.16 m up), so the foot of a wall and the inner edge of the terrace's top tread went in and
  // out with every groove. The relief now fades out toward that mesh: none at its foot, whole half a metre from it (plan
  // metres beyond the walls' feet, info[5] of benchOffset; cloth metres above the line where the dome comes out of the
  // terrace's top tread). Vertices of the dome move along the sphere's normal, by 0.46 m at the most; no triangle more.
  // i5: info[5] at the place; x, z: its plan place; rho: its metres from the crown; nr: the lane lookup's answer there.
  const levelK = (i5, x, z, rho, nr) => smoothstep(0, 0.5, i5) * (1 - TRC.sector(x, z, nr) * (1 - smoothstep(0, 0.5, TRC.rhoT - rho)));

  // ---- the dome: a grid on the unwrapped disc, displaced along the sphere normal
  const GN = 288, GE = 25.4, gs = (2 * GE) / GN, GV = GN + 1, RIM = 25.3;
  const gpos = new Float32Array(GV * GV * 3), guv = new Float32Array(GV * GV * 2), gin = new Uint8Array(GV * GV);
  const q6 = new Float64Array(6), info = [0, 0, 9, 0, 0, 99], gbk = new Float32Array(GV * GV * 3), gdf = new Float32Array(GV * GV);
  for (let j = 0; j < GV; j++) {
    const v = j * gs - GE;
    for (let i = 0; i < GV; i++) {
      const u = i * gs - GE, o = j * GV + i, rho = Math.hypot(u, v);
      discToSphere(u, v, q6);
      let h = 0, dyB = 0;
      if (rho < RIM + 1) {
        dyB = benchOffset(L, q6, nr, info, L.least); gdf[o] = clamp(Math.abs(dyB) / 0.5, 0, 1); h = relief(mazeD(u, v)) * (1 - smoothstep(0.2, 0.9, gdf[o])) * levelK(info[5], q6[0], q6[2], rho, nr);   // no groove relief where the ground is moved: it is sewn as level tiers; none at the foot of the slot's own mesh (levelK)
        gin[o] = (rho > RIM ? 1 : 0) | (info[0] < info[1] - 0.3 ? 2 : 0);
        const pm = TRC.push(q6[0], q6[2], q6[1], nr);
        if (pm > 0) { h *= 1 - pm; dyB = Math.min(dyB, dyB * (1 - pm) - 2.7 * pm); }      // under the terrace (never raised: inside the bowl the bench cut is deeper still)
      } else gin[o] = 1;
      gpos[o * 3] = q6[0] + q6[3] * h; gpos[o * 3 + 1] = q6[1] + q6[4] * h + dyB; gpos[o * 3 + 2] = q6[2] + q6[5] * h;
      guv[o * 2] = u; guv[o * 2 + 1] = v;
      if (rho < RIM + 1) { gbk[o * 3] = info[2]; gbk[o * 3 + 1] = info[3]; gbk[o * 3 + 2] = info[4]; } else gbk[o * 3] = 9;
    }
    await ctx.yield();
  }
  const gnor = new Float32Array(GV * GV * 3);
  for (let j = 0; j < GV; j++) {
    const jm = Math.max(0, j - 1), jp = Math.min(GN, j + 1);
    for (let i = 0; i < GV; i++) {
      const im = Math.max(0, i - 1), ip = Math.min(GN, i + 1), a = (j * GV + im) * 3, b = (j * GV + ip) * 3, c = (jm * GV + i) * 3, d = (jp * GV + i) * 3;
      const ex = gpos[b] - gpos[a], ey = gpos[b + 1] - gpos[a + 1], ez = gpos[b + 2] - gpos[a + 2];
      const fx = gpos[d] - gpos[c], fy = gpos[d + 1] - gpos[c + 1], fz = gpos[d + 2] - gpos[c + 2];
      let nx = fy * ez - fz * ey, ny = fz * ex - fx * ez, nz = fx * ey - fy * ex;
      const nl = Math.hypot(nx, ny, nz) || 1, o = (j * GV + i) * 3;
      gnor[o] = nx / nl; gnor[o + 1] = ny / nl; gnor[o + 2] = nz / nl;
    }
    if ((j & 3) === 3) await ctx.yield();
  }
  // ---- THE HILL'S HEM ROWS, WHOLE OR ABSENT (polish 2, a). The hill's hem (domeFrag) sews level rows of lozenges on
  // the ridge cloth wherever the hem cloth lies: on ground moved for the bench and within the lane margin, off the echo
  // groove's own bands. Those lines paid no heed to the lozenges and sliced a third of them. Here each lozenge is
  // decided ONCE, by its own place on the hill (its row by height, its cell by azimuth: the cloth's own keys), from THE
  // GRID'S OWN TRIANGLES: the heights and the measures are the ones the dome is drawn with. The cloth's own test (moved
  // ground, or inside the lane margin's line and on the ridge cloth) is put to every vertex; the squares where its
  // answer changes, and the squares that touch them, are read at sixteen places each (4.4 cm apart; more where a square
  // stands steep, never over 6 cm of height from one to the next), each place in the triangle it lies in. A lozenge
  // with such a place off the hem cloth, in its shape or in the margin round it (a third of its size: its shadow, its
  // hem and the night's line lie in it), is left out whole; every other is drawn whole. Where a lozenge runs on under a
  // wall's foot it counts by the dome's cloth there (the wall stands on it). The answers lie in a table of 128 by 32
  // texels in a corner of the texture that no cloth reaches (A: 0 = left out; column = the lozenge's cell + 64, row =
  // its row + 8), which the cloth fetches from the base level, a texel whole.
  {
    const cutL = new Uint8Array(32 * 128), cntL = new Int32Array(32), covL = new Uint8Array(GV * GV), nearL = new Uint8Array(GV * GV);
    for (let k = 0; k < 32; k++) { const yr = (k - 8 + 0.42) * 0.8 - SPHERE_CY; cntL[k] = Math.max(Math.floor(6.2832 * Math.sqrt(Math.max(SPHERE_R * SPHERE_R - yr * yr, 1)) / 1.3 + 0.5), 4); }
    const mazeG = (u, v) => {                          // bilinear read of G, as it lies in the texture (127.5 = the margin's line)
      const fx = clamp((u + DISC_E) / texel - 0.5, 0, N - 1.001), fy = clamp((v + DISC_E) / texel - 0.5, 0, N - 1.001);
      const x = Math.floor(fx), y = Math.floor(fy), ax = fx - x, ay = fy - y, o = (y * N + x) * 4 + 1;
      return (data[o] * (1 - ax) + data[o + 4] * ax) * (1 - ay) + (data[o + N * 4] * (1 - ax) + data[o + N * 4 + 4] * ax) * ay;
    };
    const onHem = (df, bx, by, u, v) => df > 0.5 || by * (1 - smoothstep(0, 1, bx)) > 0.12 || (mazeG(u, v) < 127.5 && mazeD(u, v) >= 0.5);   // the cloth's own test (domeFrag: mv, or inside the margin's line and on the ridge cloth)
    const vertL = (o0, o1) => { for (let o = o0; o < o1; o++) covL[o] = onHem(gdf[o], gbk[o * 3], gbk[o * 3 + 1], guv[o * 2], guv[o * 2 + 1]) ? 1 : 0; };
    const edgeL = (j) => { for (let i = 0; i < GN; i++) { const a = j * GV + i, b = a + 1, c = a + GV, d = c + 1; if ((covL[a] + covL[b] + covL[c] + covL[d]) & 3) nearL[a] = nearL[b] = nearL[c] = nearL[d] = 1; } };
    const rowL = (j) => {                              // (a function of its own: one row of squares)
      for (let i = 0; i < GN; i++) {
        const a = j * GV + i, b = a + 1, c = a + GV, d = c + 1;
        if (!(nearL[a] | nearL[b] | nearL[c] | nearL[d]) || ((gin[a] | gin[b] | gin[c] | gin[d]) & 1) || (gin[a] & gin[b] & gin[c] & gin[d] & 2)) continue;   // (of the squares the dome draws, as below)
        const ya = gpos[a * 3 + 1] / 0.8, yb = gpos[b * 3 + 1] / 0.8, yc = gpos[c * 3 + 1] / 0.8, yd = gpos[d * 3 + 1] / 0.8;
        const lo = Math.min(ya, yb, yc, yd), hi = Math.max(ya, yb, yc, yd), kl = Math.floor(lo);
        if (kl === Math.floor(hi) && (hi - kl < 0.133 || lo - kl > 0.707)) continue;      // (no lozenge's shape or margin at these heights)
        const u0 = guv[a * 2], v0 = guv[a * 2 + 1], ta = Math.atan2(v0, u0), tb = Math.atan2(v0, u0 + gs), tc = Math.atan2(v0 + gs, u0), td = Math.atan2(v0 + gs, u0 + gs);
        const turn = u0 * u0 + v0 * v0 < 16 || Math.max(ta, tb, tc, td) - Math.min(ta, tb, tc, td) > 1;   // (near the crown, or across the azimuth's own seam: the azimuth is worked out a place at a time; elsewhere from the corners', a millimetre true)
        const mi = Math.max(4, Math.min(64, Math.ceil(Math.max(Math.abs(yb - ya), Math.abs(yd - yc)) / 0.075))), mj = Math.max(4, Math.min(64, Math.ceil(Math.max(Math.abs(yc - ya), Math.abs(yd - yb)) / 0.075)));
        for (let qj = 0; qj < mj; qj++) for (let qi = 0; qi < mi; qi++) {
          const fi = (qi + 0.5) / mi, fj = (qj + 0.5) / mj, up = fi + fj > 1, e = up ? d : a;
          const w0 = up ? fi + fj - 1 : 1 - fi - fj, wb = up ? 1 - fj : fi, wc = up ? 1 - fi : fj;     // the place's weights in its own triangle: (a, c, b), or (b, c, d) beyond the diagonal
          const y = w0 * (up ? yd : ya) + wb * yb + wc * yc, kt = Math.floor(y), er = Math.abs(y - kt - 0.42) * 0.8 / 0.17;
          if (er > 1.35 || kt < -8 || kt > 23) continue;
          const u = u0 + fi * gs, v = v0 + fj * gs, n = cntL[kt + 8];
          const ph = (turn ? Math.atan2(v, Math.abs(u) < 1e-4 ? 1e-4 : u) : w0 * (up ? td : ta) + wb * tb + wc * tc) / 6.2832 * n + kt * 0.37, ce = Math.floor(ph);
          if (Math.abs((ph - ce - 0.5) * 1.3) / 0.42 + er > 1.35) continue;
          const key = (kt + 8) * 128 + ((ce % n) + n) % n;                                // (a row's cells are counted round the hill: one lozenge, one answer)
          if (!cutL[key] && !onHem(w0 * gdf[e] + wb * gdf[b] + wc * gdf[c], w0 * gbk[e * 3] + wb * gbk[b * 3] + wc * gbk[c * 3], w0 * gbk[e * 3 + 1] + wb * gbk[b * 3 + 1] + wc * gbk[c * 3 + 1], u, v)) cutL[key] = 1;
        }
      }
    };
    for (let o = 0; o < GV * GV; o += 4096) { vertL(o, Math.min(o + 4096, GV * GV)); await ctx.yield(); }
    for (let j = 0; j < GN; j++) { edgeL(j); if ((j & 63) === 63) await ctx.yield(); }
    for (let j = 0; j < GN; j++) { rowL(j); if ((j & 3) === 3) await ctx.yield(); }
    for (let k = 0; k < 32; k++) for (let x = 0, n = cntL[k]; x < 128; x++) if (cutL[k * 128 + (((x - 64) % n) + n) % n]) data[(k * N + x) * 4 + 3] = 0;   // (the texture has not gone to the card yet: it reads these bytes when it does)
  }
  const idx = new Uint32Array(GN * GN * 6); let ni = 0;
  for (let j = 0; j < GN; j++) {
    for (let i = 0; i < GN; i++) {
      const a = j * GV + i, b = a + 1, c = a + GV, d = c + 1, m = gin[a] | gin[b] | gin[c] | gin[d];
      if (m & 1) continue;
      if (gin[a] & gin[b] & gin[c] & gin[d] & 2) continue;
      idx[ni++] = a; idx[ni++] = c; idx[ni++] = b; idx[ni++] = b; idx[ni++] = c; idx[ni++] = d;
    }
    if ((j & 7) === 7) await ctx.yield();
  }
  const domeGeo = new THREE.BufferGeometry();
  domeGeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3));
  domeGeo.setAttribute('normal', new THREE.BufferAttribute(gnor, 3));
  domeGeo.setAttribute('aUV', new THREE.BufferAttribute(guv, 2));
  domeGeo.setAttribute('aBK', new THREE.BufferAttribute(gbk, 3));
  domeGeo.setAttribute('aDF', new THREE.BufferAttribute(gdf, 1));
  domeGeo.setIndex(new THREE.BufferAttribute(idx.slice(0, ni), 1));
  domeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 0), 24);
  const domeMat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uMaze: { value: tex }, uStack: stackU, uFar: farU },
    vertexShader: DOME_VERT, fragmentShader: domeFrag(shared.nEcho),
  });
  const dome = new THREE.Mesh(domeGeo, domeMat); dome.name = 'dome'; root.add(dome);
  await ctx.yield();

  // ---- THE OUTER CREST: a crescent of the same colony lying round the far side of the dome, across a moat from the
  // first window, so the lowered wall looks out over the colony and open water: its inner flank is one even slope, cut
  // in level tiers (see below), that faces the slot 8 to 14 m beyond the lip, and its ridge stands 2.6 m above the eye there (low enough that the level
  // gaze clears it). A ridge 68 m long on an arc of radius 32 m about the dome's axis, 18 m across, tapering to nothing
  // at both ends. Same cloth shader as the dome with the raw maze (aBK = [0.4 x metres to the outline, -1, metres of cloth from the cut under the ridge or 9]).
  // It is centred 5 m of lane beyond the window's middle and reaches 60 degrees round the dome either way.
  const wA = (L.windows[0][0] + L.windows[0][1]) / 2, wi = Math.min(L.M, Math.round(wA / L.STEP)), wj = Math.min(L.M, Math.round((wA + 5) / L.STEP)), CR = 32, CW = 9, CA = 34, CUV = 0.74, CUW = 0.74 * 1.23, CR0 = 14;
  // the crest wears the raw maze laid round ITS ridge: disc radius CR0 on the ridge line, growing down the inner flank (the
  // one the window sees, so its ridges run long and level there) and shrinking down the outer one; the rings of the maze
  // become ridges that run the length of the crest
  const crestUV = (a, rho, out) => { const r = CR0 - rho * CUW, ph = P.dir + a * CUV / CR0; out[0] = r * Math.cos(ph); out[1] = r * Math.sin(ph); return out; };
  const mazeB = (u, v) => {                          // bilinear read of B (the raw maze), metres
    const fx = clamp((u + DISC_E) / texel - 0.5, 0, N - 1.001), fy = clamp((v + DISC_E) / texel - 0.5, 0, N - 1.001);
    const x = Math.floor(fx), y = Math.floor(fy), ax = fx - x, ay = fy - y, o = (y * N + x) * 4 + 2;
    return ((data[o] * (1 - ax) + data[o + 4] * ax) * (1 - ay) + (data[o + N * 4] * (1 - ax) + data[o + N * 4 + 4] * ax) * ay) * (D_MAX / 255);
  };
  const wox = L.C[wj * 3], woz = L.C[wj * 3 + 2], wol = Math.hypot(wox, woz) || 1, cox = wox / wol, coz = woz / wol;
  const crestH = L.C[wi * 3 + 1] - SLOT_DEPTH + 0.9 + 2.6, CE = 0.16, CEN = Math.sqrt(1 + CE * CE) - CE;
  const crestD = (a, rho) => { const aa = Math.abs(a) / CA, rr = rho / CW; return Math.sqrt(aa * aa * aa * aa + rr * rr); };   // 0 on the ridge line, 1 on the outline
  const crestY = (a, rho) => { const d = crestD(a, rho); return d < 1 ? crestH * Math.pow(Math.max(1 - (Math.sqrt(d * d + CE * CE) - CE) / CEN, 0), 1.2) : 0; };   // a tent: one even slope from the outline to a rounded ridge, so the flank faces the window
  const crestP = (a, rho, out) => { const th = a / CR, c = Math.cos(th), sn = Math.sin(th), r = CR + rho; out.set(r * (cox * c - coz * sn), 0, r * (coz * c + cox * sn)); return out; };
  {
    // The INNER flank (the one the first window looks down on) is not maze: on a slope seen at a grazing angle the maze
    // smeared into ribbons. It is cut as LEVEL TIERS of 0.8 m, real steps: its rows of vertices are contours of the tent
    // (crestD = const), two to a step (riser top, tread end), so every hem is a level line however the crest tapers, and
    // the dome shader's tier cloth (aDF = 1: bands keyed to world height, a lozenge row on each riser, a hem, the lit
    // tread) is sewn on them. The top 0.7 to 1.5 m, the ridge and the outer flank keep the raw maze as before.
    const dOfY = (y) => { const s = 1 - Math.pow(clamp(y / crestH, 0, 1), 1 / 1.2), q = s * CEN + CE; return Math.sqrt(Math.max(q * q - CE * CE, 0)); };
    const rowsIn = [[1.035, -0.3, 1], [1.0, 0.02, 1]];                      // [contour d, height, aDF]
    // (a riser's top row stands 0.52 m above its own contour of the tent: its 4th number is that contour's height)
    let yTop = 0; for (let k = 0; 0.8 * (k + 1) <= crestH - 0.7; k++) { rowsIn.push([dOfY(0.8 * k + 0.24), 0.8 * k + 0.76, 1, 0.8 * k + 0.24], [dOfY(0.8 * (k + 1)), 0.8 * (k + 1), 1]); yTop = 0.8 * (k + 1); }
    // THE CUT: the maze band's own edge row lies on the top tread's inner edge (the same contour at the same height, aDF 0),
    // so the tier cloth ends there on a level line and no strip is half one cloth and half the other
    const dTop = dOfY(yTop); rowsIn.push([dTop, yTop, 0], [dTop * 0.66, -1, 0], [dTop * 0.33, -1, 0]);     // then two rows of natural slope under the ridge (height -1: the tent's own)
    const NA2 = 200, NRI = rowsIn.length, NRO = 28, NR = NRI + NRO, VA = NA2 + 1, VR = NR + 1, lp = new Float32Array(VA * VR * 3), luv = new Float32Array(VA * VR * 2), lbk = new Float32Array(VA * VR * 3), ldf = new Float32Array(VA * VR), lin = new Uint8Array(VA * VR), lfl = new Uint8Array(VA * VR), v3 = new THREE.Vector3(), c2 = [0, 0];
    for (let j = 0; j < VR; j++) {
      const row = j < NRI ? rowsIn[j] : null, rhoO = j < NRI ? 0 : (j - NRI) / NRO * (CW + 0.3);
      for (let i = 0; i < VA; i++) {
        const a = (i / NA2 * 2 - 1) * (CA + 0.3), m = (a / CA) * (a / CA), o = j * VA + i;
        const onRow = row && m < row[0], rho = onRow ? -CW * Math.sqrt(row[0] * row[0] - m * m) : rhoO, d = crestD(a, rho), rim = Math.max(1 - d, 0) * CW * 0.4;
        crestP(a, rho, v3);
        crestUV(a, rho, c2);
        const tier = onRow && row[1] > -0.5;
        lp[o * 3] = v3.x; lp[o * 3 + 1] = tier ? row[1] : Math.max(crestY(a, rho) + relief(Math.min(mazeB(c2[0], c2[1]), rim)), -0.3); lp[o * 3 + 2] = v3.z;
        luv[o * 2] = c2[0]; luv[o * 2 + 1] = c2[1]; lbk[o * 3] = rim; lbk[o * 3 + 1] = -1; lbk[o * 3 + 2] = 9; ldf[o] = onRow ? row[2] : 0; lin[o] = d > 1.03 ? 1 : 0;
      }
      if ((j & 7) === 7) await ctx.yield();
    }
    // A TIER ENDS SQUARE (polish 2, c). A riser's top row runs level on its contour until the contour meets the ridge
    // line; its next vertex lay on the ridge at the tent's own height, lower (some 0.4 to 1.1 m, by the deal) and some
    // 0.4 to 1.4 m on in plan, so every tier ended in a sloping fan with its bands squeezed across it. That one vertex now stands
    // straight under the row's last one, on the tent (the height of the row's own contour), with the tier's cloth: the
    // riser keeps its height to its end and closes with an upright face. Two quads at each end turn their diagonal
    // (lfl) so that the upright edge is a triangle's own. Vertices move; no vertex and no triangle more.
    for (let j = 1; j < NRI; j++) {
      const row = rowsIn[j]; if (row[3] === undefined) continue;
      let i0 = -1, i1 = -1;
      for (let i = 0; i < VA; i++) { const a = (i / NA2 * 2 - 1) * (CA + 0.3), m = (a / CA) * (a / CA); if (m < row[0]) { if (i0 < 0) i0 = i; i1 = i; } }
      if (i0 < 1 || i1 > NA2 - 1) continue;
      for (const [ie, n] of [[i0, i0 - 1], [i1, i1 + 1]]) {
        const o = j * VA + n, e = j * VA + ie;
        lp[o * 3] = lp[e * 3]; lp[o * 3 + 1] = row[3]; lp[o * 3 + 2] = lp[e * 3 + 2];
        luv[o * 2] = luv[e * 2]; luv[o * 2 + 1] = luv[e * 2 + 1]; lbk[o * 3] = lbk[e * 3]; ldf[o] = 1;
      }
      lfl[(j - 1) * VA + i1] = 1; lfl[j * VA + i0 - 1] = 1;     // (the riser's quad at the far end, the tread's at the near end)
    }
    // metres of cloth from the cut (aBK.z) on the two rows either side of it (the top tread's, the maze band's first two):
    // the distance to the cut's own line; every other vertex of the crest is far from it (9, above)
    const jc = NRI - 3;
    for (let j = jc - 2; j <= jc + 1; j++) for (let i = 0; i < VA; i++) {
      const o = (j * VA + i) * 3; let best = 81;
      for (let k = 0; k < NA2; k++) {
        if (ldf[(jc - 1) * VA + k] < 0.5 || ldf[(jc - 1) * VA + k + 1] < 0.5) continue;      // (the cut runs where the top tread's end row is on its contour)
        const p = (jc * VA + k) * 3, ex = lp[p + 3] - lp[p], ey = lp[p + 4] - lp[p + 1], ez = lp[p + 5] - lp[p + 2], dx = lp[o] - lp[p], dy = lp[o + 1] - lp[p + 1], dz = lp[o + 2] - lp[p + 2];
        const t = clamp((dx * ex + dy * ey + dz * ez) / Math.max(ex * ex + ey * ey + ez * ez, 1e-9), 0, 1), qx = dx - ex * t, qy = dy - ey * t, qz = dz - ez * t;
        best = Math.min(best, qx * qx + qy * qy + qz * qz);
      }
      lbk[o + 2] = Math.sqrt(best);
    }
    await ctx.yield();
    const lidx = new Uint32Array(NA2 * NR * 6); let li = 0;
    for (let j = 0; j < NR; j++) for (let i = 0; i < NA2; i++) {
      const a = j * VA + i, b = a + 1, c = a + VA, d = c + 1; if (lin[a] & lin[b] & lin[c] & lin[d]) continue;
      if (lfl[a]) { lidx[li++] = a; lidx[li++] = c; lidx[li++] = d; lidx[li++] = a; lidx[li++] = d; lidx[li++] = b; continue; }
      lidx[li++] = a; lidx[li++] = c; lidx[li++] = b; lidx[li++] = b; lidx[li++] = c; lidx[li++] = d;
    }
    await ctx.yield();
    const lobeGeo = new THREE.BufferGeometry();
    lobeGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    lobeGeo.setAttribute('aUV', new THREE.BufferAttribute(luv, 2));
    lobeGeo.setAttribute('aBK', new THREE.BufferAttribute(lbk, 3));
    lobeGeo.setAttribute('aDF', new THREE.BufferAttribute(ldf, 1));
    lobeGeo.setIndex(new THREE.BufferAttribute(lidx.slice(0, li), 1));
    lobeGeo.computeVertexNormals();
    await ctx.yield();
    const lobe = new THREE.Mesh(lobeGeo, domeMat); lobe.name = 'crest'; root.add(lobe);
  }
  await ctx.yield();

  // ---- the master groove: a stepped profile swept along the lane
  // Per side 25 vertices: three stepped walls (5 each), the ridge shoulder (2), then on the downhill side the rampart's
  // OUTER FACE (the roll-over, three risers of 0.8 m stepping out 0.15 m each and a base wall down into the dome or
  // the sand, L.skirt) and on the uphill side THE BANK (three risers and level treads sharing L.rise, q from 20 on,
  // then a tuck straight down behind the top tread). The last ring closes to a point; the first is the apse.
  const M = L.M, SIDE = 25, ROW = 2 * SIDE + 1, NA = 10, RW = M + 1 + NA, sp = new Float32Array(RW * ROW * 3), sq = new Float32Array(RW * ROW * 4), sf = new Float32Array(RW * ROW);   // (sf: THE FACE'S OWN METRES, below)
  const prof = new Float32Array(ROW * 4);            // x (signed lateral), y (along up), q (signed), metres per q unit on a riser
  // riser heights (metres) of one wall: at a window the OUTER wall keeps its first riser, lowered to half a metre, and
  // the two above it close up to nothing, so what is left is one clean step (its motifs are laid out in true metres:
  // aSQ.w), with the two treads and the shoulder lying flat behind its hem
  const rh = [0, 0, 0];
  const risers = (i, out) => { const d = L.depth[i], w = out ? L.win[i] : 0; rh[0] = RISER * d * (1 - w * (1 - 0.5 / RISER)); rh[1] = rh[2] = RISER * d * (1 - w); return rh; };
  const hOutOf = (i) => { risers(i, true); return (rh[0] + rh[1] + rh[2]) / Math.max(SLOT_DEPTH * L.depth[i], 1e-4); };
  const sideProfile = (i, sgn, write, bs, ts, deep) => {
    const depth = L.depth[i], wide = L.wide[i], out = sgn * L.outer[i] > 0, yF = -SLOT_DEPTH * depth;
    risers(i, out);
    let n = 0, y0 = yF;
    for (let k = 0; k < 3; k++) {
      const x = (FLOOR_H + 0.3 * k) * wide, bd = Math.min(1, rh[k] * 2.5), y1 = y0 + rh[k], q0 = 0.7 + 1.1 * k, hm = Math.max(rh[k] - 0.14 * bd, 0) / 0.71;
      write(n++, x, y0, q0, hm); write(n++, x, y1 - 0.14 * bd, q0 + 0.71, hm); write(n++, x - 0.1 * bd, y1 - 0.1 * bd, q0 + 0.74, hm);
      write(n++, x - 0.08 * bd, y1 + 0.06 * bd, q0 + 0.8, hm); write(n++, x + 0.09 * bd, y1, q0 + 0.86, hm);
      y0 = y1;
    }
    const lip = HALF_LIP * wide, y3 = y0;
    write(n++, lip + 0.35, y3 + 0.11 * Math.min(1, depth * 2.5 + 0.3), 4.25, 1); write(n++, lip + SHOULDER, y3, 4.6, 1); write(n++, lip + SHOULDER + 0.1, y3 - 0.1, 4.75, 1);
    if (!out) {                                        // uphill: the BANK, three steps (riser, then a level tread) up to the dome
      const Rr = L.rise[i], R = Math.max(Rr, 0) * smoothstep(-0.3, 0.5, Rr) * bs, tw = L.w3[i] / 3 * ts, rr = R / 3;
      let x = lip + SHOULDER, y = y3;
      n = 16; write(n++, x, y, 4.6, 1); write(n++, x, y, 20, rr / 0.8);
      for (let k = 0; k < 3; k++) { write(n++, x + 0.05, y + rr, 20.8 + k, rr / 0.8); x += tw; y += rr; write(n++, x, y, 21 + k, k < 2 ? rr / 0.8 : deep); }
      write(n++, x + 0.04, y - Math.max(deep, 0.5 - Rr), 23.6, deep);     // straight down behind the top tread: the dome meets it out of sight (deep = 1 m; 3.4 m round the mouth's bowl, where it is the rim wall that stands above the terrace)
      return;
    }
    const Hs = Math.max(L.skirt[i] - (SLOT_DEPTH * depth - (y3 - yF)), 0.6), ss = clamp((Hs - 0.5) / 2.4, 0.1, 1);   // the outer face hangs from the lowered lip at a window
    let x = lip + SHOULDER + 0.1, y = y3 - 0.1;
    for (let k = 0; k < 3; k++) { y -= 0.8 * ss; write(n++, x, y, 4.75 + 0.95 * k + 0.8, ss); x += 0.15 * ss; write(n++, x, y, 4.75 + 0.95 * (k + 1), ss); }
    const rem = Math.max(Hs - 0.1 - 2.4 * ss, 0.05), zf = 1 + L.tz[i];   // w = 2 on the base wall beside the terrace: it is painted with the terrace's level tiers
    if (L.tz[i] > 0.5) prof[(sgn > 0 ? SIDE + n : SIDE - n) * 4 + 3] = zf;   // (the vertex above it too: only the wall reads it)
    write(n++, x + 0.05 * rem, y - rem, 7.6 + rem, zf);
  };
  // APSE: NA extra rows before station 0 revolve the whole profile a quarter turn about the lane's first point, each
  // side toward the back, so the mouth is a round forecourt at bench level (black floor disc ringed by the two treads
  // and the shoulder) on a round bastion, with the bank as a stepped half-bowl behind it (its rise falls as cos(phi)
  // to nothing where it points back along the contour). The floor then sinks away from it into the slot.
  const capP = [], capS = [], capF = [];
  for (let r = 0; r < RW; r++) {
    const i = Math.max(0, r - NA), phi = r < NA ? ((NA - r) / NA) * Math.PI / 2 : 0, cph = Math.cos(phi), sph = Math.sin(phi), ts = 1 - 0.9 * smoothstep(1.05, 1.5708, phi);
    const deep = r <= NA ? 3.4 : 1;
    sideProfile(i, -1, (n, x, y, q, hm) => { const o = (SIDE - 1 - n) * 4; prof[o] = -x; prof[o + 1] = y; prof[o + 2] = -q; prof[o + 3] = hm; }, cph, ts, deep);
    prof[SIDE * 4] = 0; prof[SIDE * 4 + 1] = -SLOT_DEPTH * L.depth[i]; prof[SIDE * 4 + 2] = 0; prof[SIDE * 4 + 3] = 1;
    sideProfile(i, 1, (n, x, y, q, hm) => { const o = (SIDE + 1 + n) * 4; prof[o] = x; prof[o + 1] = y; prof[o + 2] = q; prof[o + 3] = hm; }, cph, ts, deep);
    const i3 = i * 3, cap = i === M;
    const px = L.C[i3], py = L.C[i3 + 1] - 1, pz = L.C[i3 + 2];
    for (let k = 0; k < ROW; k++) {
      const o = (r * ROW + k) * 3, o4 = (r * ROW + k) * 4, x = prof[k * 4], y = prof[k * 4 + 1];
      if (cap) { sp[o] = px; sp[o + 1] = py; sp[o + 2] = pz; }
      else {
        // (the BANK, q from 20 on, rises VERTICALLY from the bench plane, not along the lane's leaning up: its top then
        // stands where L.rise was measured, on the natural hill, and over the ramp benchOffset cuts under it)
        const xl = x * cph, xa = -Math.abs(x) * sph, yv = Math.abs(prof[k * 4 + 2]) >= 19.9 ? y : 0, yu = y - yv;
        sp[o] = L.C[i3] + L.B[i3] * xl + L.T[i3] * xa + L.U[i3] * yu; sp[o + 1] = L.C[i3 + 1] + L.B[i3 + 1] * xl + L.T[i3 + 1] * xa + L.U[i3 + 1] * yu + yv; sp[o + 2] = L.C[i3 + 2] + L.B[i3 + 2] * xl + L.T[i3 + 2] * xa + L.U[i3 + 2] * yu;
      }
      sq[o4] = r < NA ? -phi * Math.abs(x) : i * L.STEP; sq[o4 + 1] = prof[k * 4 + 2]; sq[o4 + 2] = L.bend[i]; sq[o4 + 3] = prof[k * 4 + 3];
      // THE FACE'S OWN METRES (polish 2, e and f; attribute aSF): the length of this vertex's own line along the sweep, ring
      // to ring, as a row on the face runs. The slot's s is the lane's centre-line metres; a face that stands off that line
      // outside a bend, or the bowl's rim wall as it turns in round the mouth, is longer or shorter than s says, and rows
      // keyed to s lay pulled on it (1.5 times on the rampart's base round the hook; forty times on the rim wall's end).
      // Round the mouth and on a wall painted by world height (L.tz) the rows are level: the line's PLAN length; elsewhere
      // they run with the lip: its length square to the lane's up (the foot of a wall rises and falls with the skirt, which
      // is no length along a row).
      if (r > 0) {
        const dx = sp[o] - sp[o - ROW * 3], dy = sp[o + 1] - sp[o - ROW * 3 + 1], dz = sp[o + 2] - sp[o - ROW * 3 + 2], du = dx * L.U[i3] + dy * L.U[i3 + 1] + dz * L.U[i3 + 2];
        sf[r * ROW + k] = sf[(r - 1) * ROW + k] + (r <= NA || L.tz[i] > 0.5 ? Math.hypot(dx, dz) : Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz - du * du, 0)));
      }
    }
    // THE BACK SEAM: at the back of the apse (row 0) the uphill half ends on the rim wall and the downhill half on the
    // bastion's stepped face; the two outlines lie in one vertical plane but are not the same line, and the slit between
    // them showed the inside of the bastion. A plate in that plane closes it: each outline's vertices again, and for
    // each a twin 0.35 m inside the shoulder (same cloth coordinates, so the plate's proud edge carries its wall's bands).
    if (r === 0) for (const sd of [-1, 1]) for (let n = 16; n < SIDE; n++) {
      const k = SIDE + sd * (1 + n), o = k * 3, o4 = k * 4, ax = Math.abs(prof[k * 4]) - (HALF_LIP * L.wide[0] + SHOULDER - 0.35);
      capP.push(sp[o], sp[o + 1], sp[o + 2], sp[o] + L.T[0] * ax, sp[o + 1] + L.T[1] * ax, sp[o + 2] + L.T[2] * ax);
      capF.push(-Math.abs(prof[k * 4]), ax - Math.abs(prof[k * 4]));     // (the plate's own metres: along the back plane from the lane's first point)
      for (let e = 0; e < 2; e++) capS.push(sq[o4], sq[o4 + 1], 2, sq[o4 + 3]);     // (aSQ.z = 2: the plate is painted with the apron's level tiers by world height, and above them with the hill's cloth, not with its walls' own coordinates)
    }
    if (r % 10 === 9) await ctx.yield();
  }
  for (let k = 0; k < ROW; k++) { const f0 = sf[NA * ROW + k]; for (let r = 0; r < RW; r++) sf[r * ROW + k] -= f0; }     // (0 at the lane's first station, as s)
  // (polish 2, h) THE SHOULDER'S ROW has one measure too, given to the tread's three lines: ring to ring the SHORTER of the
  // true lengths of the two lines the row lies between (q 4.25 and 4.6), so a lozenge of half a metre of this measure is
  // half a metre of cloth on the shorter line and a little more on the longer, never less.
  for (const sg of [-1, 1]) {
    const ka = SIDE + sg * 16, kb = SIDE + sg * 17, run = new Float32Array(RW);
    for (let r = 1; r < RW; r++) { const a = (r * ROW + ka) * 3, b = (r * ROW + kb) * 3, pa = a - ROW * 3, pb = b - ROW * 3;
      run[r] = run[r - 1] + Math.min(Math.hypot(sp[a] - sp[pa], sp[a + 1] - sp[pa + 1], sp[a + 2] - sp[pa + 2]), Math.hypot(sp[b] - sp[pb], sp[b + 1] - sp[pb + 1], sp[b + 2] - sp[pb + 2])); }
    for (let r = 0; r < RW; r++) sf[r * ROW + SIDE + sg * 15] = sf[r * ROW + ka] = sf[r * ROW + kb] = run[r] - run[NA];
  }
  for (let r = 0; r < RW; r++) { sf[r * ROW] = sf[r * ROW + 1]; sf[r * ROW + ROW - 1] = sf[r * ROW + ROW - 2]; }     // (a wall's foot takes the measure of its top line: one measure to a face, so a lozenge stands upright on it; two lines of unlike length would shear it more with every metre)
  const sidx = new Uint32Array((RW - 1) * (ROW - 1) * 6); let si = 0;
  for (let i = 0; i < RW - 1; i++) for (let k = 0; k < ROW - 1; k++) {
    const a = i * ROW + k, b = a + 1, c = a + ROW, d = c + 1;
    sidx[si++] = a; sidx[si++] = c; sidx[si++] = b; sidx[si++] = b; sidx[si++] = c; sidx[si++] = d;
  }
  await ctx.yield();
  // ---- the terrace (see TRC above): five tiers, each its own block of six rings (riser foot, riser top, hem bulge, hem
  // top, tread, tread end) by NAZ columns. A ring starts on the curve G at the mouth and ends at lane azimuth 24 degrees;
  // column 0 is a copy of the first column 3.2 m lower (a cheek along G). Vertices under the rampart or uphill of it sink
  // 8 m (the wall's face closes the tier there). aSQ = (metres along, 30 + 4 x tier + f, 0.5, riser height or tread width).
  const TN = TIERS, NAZ = 100, TRG = 6, TCOL = NAZ + 2, tvn = TN * TRG * TCOL, tpos = new Float32Array(tvn * 3), tsq = new Float32Array(tvn * 4), tidx = new Uint32Array(TN * (TRG - 1) * (TCOL - 1) * 6);
  let tix = 0;
  for (let kk = 0; kk < TN; kk++) {
    const Y0 = TRC.Y[kk], Y1 = TRC.Y[kk + 1], rk = TRC.rho[kk], rn = TRC.rho[kk + 1], H = Y1 - 0.2 - Y0, Wt = rk - 0.1 - rn;
    const rings = [[rk, Y0, 0, H], [rk, Y1 - 0.2, 1, H], [rk + 0.13, Y1 - 0.12, 1.15, H], [rk + 0.1, Y1 + 0.07, 1.3, H], [rk - 0.1, Y1, 1.4, Wt], [rn, Y1, 2.4, Wt]];
    for (let j = 0; j < TRG; j++) {
      const [r, y, f, hm] = rings[j], a0 = TRC.az0(r), base = (kk * TRG + j) * TCOL, WALL = 2.6;
      const azAt = (c) => a0 + (TRC.azE - a0) * Math.max(c - 1, 0) / NAZ;
      const sdAt = (az) => { const x = TRC.mir * r * Math.cos(az), z = r * Math.sin(az); L.near(x, z, nr); return TRC.sideDown(x, z, nr); };
      // the ring runs from its first column clear of the walls to where it meets the rampart's outer wall (0.3 m inside
      // its face, found by bisection): the columns before and after are gathered onto those two points, so a tier ends
      // square against the wall and no sunk triangle saws across it
      let c0 = 1; while (c0 < TCOL - 1 && sdAt(azAt(c0)) < WALL) c0++;
      let c1 = c0; while (c1 < TCOL - 1 && sdAt(azAt(c1 + 1)) >= WALL) c1++;
      let azEnd = azAt(c1);
      if (c1 < TCOL - 1) { let lo = azAt(c1), hi = azAt(c1 + 1); for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (sdAt(m) >= WALL) lo = m; else hi = m; } azEnd = lo; }
      for (let c = 0; c < TCOL; c++) {
        const az = c <= c0 ? azAt(c0) : c > c1 ? azEnd : azAt(c), x = TRC.mir * r * Math.cos(az), z = r * Math.sin(az), o = base + c;
        tpos[o * 3] = x; tpos[o * 3 + 1] = y - (c === 0 ? 3.2 : 0); tpos[o * 3 + 2] = z;
        tsq[o * 4] = (1.75 - az) * rk; tsq[o * 4 + 1] = 30 + 4 * kk + f; tsq[o * 4 + 2] = 0.5; tsq[o * 4 + 3] = hm;
      }
    }
    for (let j = 0; j < TRG - 1; j++) for (let c = 0; c < TCOL - 1; c++) {
      const a = (kk * TRG + j) * TCOL + c + RW * ROW, b = a + 1, cc = a + TCOL, d = cc + 1;
      tidx[tix++] = a; tidx[tix++] = cc; tidx[tix++] = b; tidx[tix++] = b; tidx[tix++] = cc; tidx[tix++] = d;
    }
    await ctx.yield();
  }
  const CN = SIDE - 16, capI = [], cb = RW * ROW + tvn;                       // the back seam's plate: two outlines of CN vertex pairs
  for (let s = 0; s < 2; s++) for (let j = 0; j < CN - 1; j++) { const a = cb + (s * CN + j) * 2; capI.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  const sp2 = new Float32Array(sp.length + tpos.length + capP.length), sq2 = new Float32Array(sq.length + tsq.length + capS.length), sidx2 = new Uint32Array(sidx.length + tidx.length + capI.length);
  sp2.set(sp); sp2.set(tpos, sp.length); sp2.set(capP, sp.length + tpos.length); sq2.set(sq); sq2.set(tsq, sq.length); sq2.set(capS, sq.length + tsq.length);
  sidx2.set(sidx); sidx2.set(tidx, sidx.length); sidx2.set(capI, sidx.length + tidx.length);
  const sf2 = new Float32Array(sp2.length / 3); sf2.set(sf); for (let o = 0; o < tvn; o++) sf2[sf.length + o] = tsq[o * 4]; sf2.set(capF, sf.length + tvn);
  // (polish 2, order 4) THE RAMPART'S BASE WALL BESIDE THE TERRACE BY ITS CLOTH'S OWN MEASURE (uniform uTw; see wallTier).
  // Above the last real tier the wall's rows are fitted to the wall itself, so the cloth must know where the wall ends
  // and where its floor band's edge stands, in the two measures a tier's row is laid by: ws (the lane azimuth times
  // the radius) and the world height. Both are read off the wall's own triangles: the two ENDS (where aSQ.w crosses
  // 1.5) each as a straight line ws = e0 + e1 y, and the BAND'S EDGE (q = 8.05) as y = b0 + b1 (ws - m) + b2 (ws - m)^2.
  // Each fit is moved toward the wall's inside by the most it misses a point of the true line (the ends 0.04 m more),
  // so nothing fitted to them stands over the true ones. No such wall, or more than one: no fit (the ends crossed),
  // and the cloth lays no figure above the last real tier.
  const twU = [new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, -99, 0, 0)];
  {
    const ends = [[], []], edge = [], seen = [0, 0];
    const wsy = (p) => { const wx = TRC.mir * p[0]; return [(1.75 - Math.atan2(p[2], Math.abs(wx) < 1e-4 ? 1e-4 : wx)) * Math.hypot(p[0], p[2]), p[1]]; };
    const vtx = (v) => [sp[v * 3], sp[v * 3 + 1], sp[v * 3 + 2], Math.abs(sq[v * 4 + 1]), sq[v * 4 + 3]];
    const iso = (T, ch, lv, out) => {                  // where channel ch crosses lv in a triangle: 5 points (ws, y) along that line
      const pts = [];
      for (let e = 0; e < 3; e++) { const A = T[e], B = T[(e + 1) % 3]; if ((A[ch] - lv) * (B[ch] - lv) < 0) { const t = (lv - A[ch]) / (B[ch] - A[ch]); pts.push(A.map((x, i) => x + (B[i] - x) * t)); } }
      if (pts.length === 2) for (let j = 0; j <= 4; j++) out.push(wsy(pts[0].map((x, i) => x + (pts[1][i] - x) * j / 4)));
    };
    for (let r = 0; r < RW - 1; r++) for (const sg of [-1, 1]) {
      const k = SIDE + sg * 24 + Math.min(sg, 0), a = vtx(r * ROW + k), b = vtx(r * ROW + k + 1), c = vtx((r + 1) * ROW + k), d = vtx((r + 1) * ROW + k + 1);
      const w0 = Math.max(a[4], b[4]), w1 = Math.max(c[4], d[4]);
      if (Math.min(a[3], b[3], c[3], d[3]) < 7.55 || Math.max(a[3], b[3], c[3], d[3]) > 19 || Math.max(w0, w1) < 1.5) continue;
      const e = w0 > 1.5 && w1 > 1.5 ? -1 : w1 > 1.5 ? 0 : 1;
      if (e >= 0) seen[e]++;
      for (const T of [[a, c, b], [b, c, d]]) { if (e >= 0) iso(T, 4, 1.5, ends[e]); iso(T, 3, 8.05, edge); }
    }
    const line = (P) => {                              // ws = e0 + e1 y by least squares, and the most a point lies above and below it
      let sy = 0, sw = 0, syy = 0, syw = 0, up = 0, dn = 0; const n = P.length;
      for (const [w, y] of P) { sy += y; sw += w; syy += y * y; syw += y * w; }
      const e1 = (n * syw - sy * sw) / Math.max(n * syy - sy * sy, 1e-9), e0 = (sw - e1 * sy) / n;
      for (const [w, y] of P) { const m = w - (e0 + e1 * y); up = Math.max(up, m); dn = Math.min(dn, m); }
      return [e0, e1, up, dn, sw / n];
    };
    if (seen[0] === 1 && seen[1] === 1 && ends[0].length > 1 && ends[1].length > 1 && edge.length > 2) {
      const A = line(ends[0]), B = line(ends[1]), H = A[4] > B[4] ? A : B, Lo = A[4] > B[4] ? B : A;
      let m = 0; for (const p of edge) m += p[0]; m /= edge.length;
      const S = [0, 0, 0, 0, 0], T = [0, 0, 0];
      for (const [w, y] of edge) { let xp = 1; for (let i = 0; i < 5; i++) { S[i] += xp; if (i < 3) T[i] += y * xp; xp *= w - m; } }
      const det = (a, b, c, d, e, f, g, h, i) => a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      const D = det(S[0], S[1], S[2], S[1], S[2], S[3], S[2], S[3], S[4]);
      if (Math.abs(D) > 1e-9) {
        const b0 = det(T[0], S[1], S[2], T[1], S[2], S[3], T[2], S[3], S[4]) / D, b1 = det(S[0], T[0], S[2], S[1], T[1], S[3], S[2], T[2], S[4]) / D, b2 = det(S[0], S[1], T[0], S[1], S[2], T[1], S[2], S[3], T[2]) / D;
        let over = 0; for (const [w, y] of edge) over = Math.max(over, b0 + (w - m) * (b1 + (w - m) * b2) - y);
        twU[0].set(H[0] + H[3] - 0.04, H[1], Lo[0] + Lo[2] + 0.04, Lo[1]); twU[1].set(m, b0 - over, b1, b2);
      }
    }
  }
  // (polish 2, order 4) THE BOWL'S RIM WALL ALONG THE LAST OF THE BANK (uniform uRim; the night's hem, NO TWIN). Round the
  // mouth the bank's three steps close to nothing toward the back seam, and its middle step comes to lie beside the rim
  // wall's top. Measured on the mesh, ring by ring from the back seam: the bank's top step from corner to corner (its
  // lines q 22 and 23); uRim is the rim wall's own metres (aSF of its top line) where that reaches 0.2 m. From the
  // back seam to there the rim's hem has no night line when the middle step's cloth is the line's colour.
  let rimU = -1e9;
  for (const sg of [-1, 1]) {
    const kT = SIDE + sg * 24, kM = SIDE + sg * 22; if (Math.abs(Math.abs(sq[kT * 4 + 1]) - 23) > 0.01) continue;     // (the uphill side: the bank)
    const gap = (r) => { const a = (r * ROW + kT) * 3, b = (r * ROW + kM) * 3; return Math.hypot(sp[a] - sp[b], sp[a + 1] - sp[b + 1], sp[a + 2] - sp[b + 2]); };
    for (let r = 0; r < NA && gap(r) < 0.2; r++) { const g0 = gap(r), g1 = gap(r + 1); rimU = g1 < 0.2 ? sf[(r + 1) * ROW + kT] : lerp(sf[r * ROW + kT], sf[(r + 1) * ROW + kT], (0.2 - g0) / (g1 - g0)); }
  }
  const slotGeo = new THREE.BufferGeometry();
  slotGeo.setAttribute('position', new THREE.BufferAttribute(sp2, 3));
  slotGeo.setAttribute('aSQ', new THREE.BufferAttribute(sq2, 4));
  slotGeo.setAttribute('aSF', new THREE.BufferAttribute(sf2, 1));
  slotGeo.setIndex(new THREE.BufferAttribute(sidx2, 1));
  slotGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, 0), 26);
  const slotMat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uStack: stackU, uTer: { value: new THREE.Vector4(TRC.Y[0], TRC.rr, TRC.mir, 0) }, uTw: { value: twU }, uRim: { value: rimU } },
    vertexShader: SLOT_VERT, fragmentShader: slotFrag(shared.nEcho),
  });
  const slot = new THREE.Mesh(slotGeo, slotMat); slot.name = 'master-groove'; root.add(slot);
  await ctx.yield();

  // ---- the apron: four scalloped bands stepped up from the sand to the dome's foot
  if (opts.apron !== false) {
    const SEG = Math.max(96, Math.round(240 * detail)), lobes = 22;
    const rows = [[0, 0], [0.03, 0.2], [0.33, 0.27], [0.6, 0.2], [0.63, 0.4], [0.93, 0.47], [1.2, 0.4], [1.23, 0.6], [1.53, 0.67], [1.8, 0.6], [1.83, 0.8], [2.4, 0.88], [-1, 0.8]];
    const RN = rows.length, ap = new Float32Array((SEG + 1) * RN * 3), ae = new Float32Array((SEG + 1) * RN), auv = new Float32Array((SEG + 1) * RN * 2);
    for (let i = 0; i <= SEG; i++) {
      const az = (i / SEG) * TAU, rOut = 19.9 + 1.5 * Math.pow(Math.abs(Math.sin(az * lobes / 2)), 0.6), c = Math.cos(az), s = Math.sin(az);
      for (let k = 0; k < RN; k++) {
        const e = rows[k][0] < 0 ? rOut - 16.6 : rows[k][0], r = rOut - e, o = i * RN + k;
        ap[o * 3] = r * c; ap[o * 3 + 1] = rows[k][1]; ap[o * 3 + 2] = r * s; ae[o] = e; auv[o * 2] = az * 19; auv[o * 2 + 1] = e;
      }
    }
    const aidx = new Uint32Array(SEG * (RN - 1) * 6); let ai = 0;
    for (let i = 0; i < SEG; i++) for (let k = 0; k < RN - 1; k++) {
      const a = i * RN + k, b = a + 1, c = a + RN, d = c + 1;
      aidx[ai++] = a; aidx[ai++] = b; aidx[ai++] = c; aidx[ai++] = b; aidx[ai++] = d; aidx[ai++] = c;
    }
    const apGeo = new THREE.BufferGeometry();
    apGeo.setAttribute('position', new THREE.BufferAttribute(ap, 3));
    apGeo.setAttribute('aE', new THREE.BufferAttribute(ae, 1));
    apGeo.setAttribute('uv', new THREE.BufferAttribute(auv, 2));
    apGeo.setIndex(new THREE.BufferAttribute(aidx, 1));
    apGeo.computeVertexNormals();
    const apronMat = styleMaterial({ shared, stack: [3, 2, 1, 0], bandW: 0.6, hem: 0.07 }); apronMat.uniforms.uStackI.value = apronStack;
    const apron = new THREE.Mesh(apGeo, apronMat);
    apron.name = 'apron'; root.add(apron);
    await ctx.yield();
  }

  // ---- lane queries and anchors
  // laneAt(s, out): pass the object a previous call returned as "out" to reuse it (no allocation per frame)
  const mkLane = () => ({ floor: new THREE.Vector3(), eye: new THREE.Vector3(), top: new THREE.Vector3(), tangent: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3(), depth: 0, outer: 1, wide: 1 });
  const laneAt = (s, o = mkLane()) => {
    const fi = clamp(s / L.STEP, 0, M - 0.001), i = Math.floor(fi), f = fi - i, a = i * 3, b = a + 3;
    const set = (v, A) => v.set(A[a] + (A[b] - A[a]) * f, A[a + 1] + (A[b + 1] - A[a + 1]) * f, A[a + 2] + (A[b + 2] - A[a + 2]) * f);
    set(o.top, L.C); set(o.up, L.U).normalize(); set(o.tangent, L.T).normalize(); set(o.right, L.B).normalize();
    o.depth = lerp(L.depth[i], L.depth[i + 1], f); o.outer = L.outer[i]; o.wide = lerp(L.wide[i], L.wide[i + 1], f);
    let rise = 0; for (const wn of L.windows) rise = Math.max(rise, smoothstep(wn[0] - 8, wn[0] + 1, s) * (1 - smoothstep(wn[1] - 1, wn[1] + 8, s)));
    o.floor.copy(o.top).addScaledVector(o.up, -SLOT_DEPTH * o.depth); o.eye.copy(o.floor).addScaledVector(o.up, 0.9 + EYE_RISE * rise);   // the eye line lifts through each window, to look out and down over the lowered wall
    return o;
  };
  const heightAt = (x, z) => {
    const r = Math.hypot(x, z); if (r > 17.95) return 0;
    const rho = SPHERE_R * Math.asin(r / SPHERE_R), k = r > 1e-6 ? rho / r : 0;
    discToSphere(x * k, z * k, q6);
    return q6[1] + benchOffset(L, q6, nr, info);
  };
  // approach: a quarter turn of 11 m radius that arrives on the mouth's heading, coming from the channel side
  const m0 = laneAt(0), e0 = laneAt(1.5), flyThrough = [], slotUp = [];
  const h0 = new THREE.Vector3(m0.tangent.x, 0, m0.tangent.z).normalize(), out0 = new THREE.Vector3(m0.top.x, 0, m0.top.z).normalize(), RA = 11;
  for (const [deg, up] of [[90, 4.0], [60, 3.6], [32, 2.5]]) {
    const th = deg * Math.PI / 180;
    flyThrough.push(new THREE.Vector3(e0.eye.x, m0.top.y + up, e0.eye.z).addScaledVector(h0, -RA * Math.sin(th)).addScaledVector(out0, RA * (1 - Math.cos(th))));
  }
  const i0 = flyThrough.length;
  for (let s = 1.5; s <= L.length - 1; s += 3) { const a = laneAt(s); flyThrough.push(a.eye); slotUp.push(a.up); }
  const i1 = flyThrough.length - 1, mEnd = laneAt(L.length - 1);
  const hE = new THREE.Vector3(mEnd.tangent.x, 0, mEnd.tangent.z).normalize();
  // THE EXIT: a pull-up on a 30 m radius through 50 degrees on the crown heading, then 60 m dead straight to the ring
  let endP = mEnd.eye.clone();
  for (let k = 1; k <= 4; k++) { const a = (50 * Math.PI / 180) * k / 4; flyThrough.push(endP.clone().addScaledVector(hE, 30 * Math.sin(a)).add(new THREE.Vector3(0, 30 * (1 - Math.cos(a)), 0))); }
  const exitDir = hE.clone().multiplyScalar(Math.cos(50 * Math.PI / 180)).add(new THREE.Vector3(0, Math.sin(50 * Math.PI / 180), 0));
  const portalPos = flyThrough[flyThrough.length - 1].clone().addScaledVector(exitDir, 60);
  flyThrough.push(portalPos.clone());
  const wormSeats = [];
  for (let k = 0; k < 30; k++) {
    const sgn = k % 2 ? 1 : -1, s0 = 12 + (L.length - 28) * (k / 29);
    if (sgn * laneAt(s0).outer > 0 && hOutOf(Math.round(s0 / L.STEP)) < 0.999) continue;   // worms live on the LIP: where the outer wall is cut down for a window there is no lip and no pair
    for (let j = 0; j < 2; j++) {
      const a = laneAt(s0 + j * 0.9);
      wormSeats.push({ position: a.top.clone().addScaledVector(a.right, sgn * (HALF_LIP * a.wide + 0.36)).addScaledVector(a.up, 0.08), up: a.up });
    }
  }
  const og = laneAt(L.length * 0.72), pj = laneAt(L.length * 0.4), f1 = laneAt(5.5), f2 = laneAt(6.5);
  const fan = (sgn) => { const up = sgn * f1.outer < 0, fl = up ? f2 : f1, p = fl.top.clone().addScaledVector(fl.right, sgn * (up ? HALF_LIP * fl.wide + SHOULDER + 3 * BANK_T + 0.5 : 4.6)); p.y = heightAt(p.x, p.z) - (up ? 0.2 : 0); return { position: p, uphill: up }; };   // uphill: on the hill just above the bank's top step
  const anchors = {
    mouth: { position: m0.top.clone(), heading: m0.tangent.clone(), up: m0.up.clone() },
    fanSeats: [fan(-1), fan(1)],
    terrace: { levels: TRC.Y.slice(), radii: TRC.rho.slice(), azimuthEnd: TRC.azE, winding: TRC.mir },
    flyThrough, slotUp, slotRange: [i0, i1],
    portalSeat: { position: portalPos, normal: exitDir.clone().negate(), radius: 7, tilt: 50 * Math.PI / 180 },
    windows: L.windows.map(([a, b]) => { const w = laneAt((a + b) / 2); return { s0: a, s1: b, position: w.eye, outward: w.right.clone().multiplyScalar(w.outer) }; }),
    wormSeats, octopusGate: { position: og.top, up: og.up, across: og.right, outer: og.outer, s: L.length * 0.72 }, paceJoin: { position: pj.eye },
    crown: new THREE.Vector3(0, CAP_H, 0), exitHeading: exitDir.clone(), crest: { radius: CR, halfWidth: CW, halfLength: CA, height: crestH, point: crestP, heightAt: crestY, edge: (x, z) => { const r = Math.hypot(x, z), a = Math.atan2(z * cox - x * coz, x * cox + z * coz) * CR; return (1 - crestD(a, r - CR)) * CW; } },
    viewpoints: { channelMouth: new THREE.Vector3(0, 2.5, 68), bowl: new THREE.Vector3(2, 6, 42), turtlePass: new THREE.Vector3(-3, 6.5, 30) },
  };

  // ---- driving
  let driven = false;
  const setEcho = (i, position, heading, size = 1.5, cols = [4, 1, 3], strength = 1, reach = 14) => {
    if (i < 0 || i >= shared.nEcho) return;
    if (!driven) { driven = true; for (let k = 0; k < shared.nEcho; k++) U.uEchoB.value[k].w = 0; }
    U.uEchoA.value[i].set(position.x, position.y, position.z, size);
    const hl = Math.hypot(heading.x, heading.y, heading.z) || 1;
    U.uEchoB.value[i].set(heading.x / hl, heading.y / hl, heading.z / hl, strength);
    U.uEchoC.value[i].set(cols[0], cols[1], cols[2], reach);
  };
  const demo = (i, p, h, size, c) => { U.uEchoA.value[i].set(p.x, p.y, p.z, size); U.uEchoB.value[i].set(h.x, h.y, h.z, 1); U.uEchoC.value[i].set(c[0], c[1], c[2], 14); };
  const dp = new THREE.Vector3(), dh = new THREE.Vector3();
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (!driven && opts.demo !== false) {
      const a = time * 0.16 + 0.6;
      dp.set(Math.sin(a) * 10, 0, Math.cos(a) * 10); dp.y = heightAt(dp.x, dp.z) + 3.2; dh.set(Math.cos(a), 0, -Math.sin(a));
      demo(0, dp, dh, 2.6, [4, 1, 3]);
      if (shared.nEcho > 1) { const b = laneAt((time * 5 + 20) % (L.length - 10)); dp.copy(b.eye).addScaledVector(b.up, 0.8); demo(1, dp, b.tangent, 1.2, [2, 5, 4]); }
    }
  }
  update(0, 0, null);

  return {
    object: root, radius: 21.5, height: CAP_H, center: new THREE.Vector3(0, 6.5, 0), anchors,
    update, dispose() {}, ground: true, groundY: 0,
    shared, setEcho, setLivery, heightAt,
    lane: { length: L.length, at: laneAt, maxClimb: L.maxClimb, minRadius: L.minRadius, windows: L.windows, lip: HALF_LIP, shoulder: SHOULDER, depth: SLOT_DEPTH },
    params: { winding: P.mir, pitch: P.pitch },
  };
}
