// The Written Range: hero set piece. "The Now, and the quake it writes."
// A drum recorder's chart 1.9 km wide streams downstream (+Z) at 20 m/s under a rail of 140 pens at z = 0. Every pen writes the
// top edge of its own paper curtain (a plane of constant x, 14 m apart). At flight second 19 the twelve long arms of the valley
// are flung up together and write a range 300 m tall, every fin leaning on the arc its arm swung, which the paper carries off.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera), dispose(), ground: false,
//   uniforms, rows, variation, setFlightSeconds(s), setProgress(u, duration), setFlankCap(y, on, xa, xb), setBoxCap(x0, x1, z0, z1, h) }
// Origin: on the sheet under the pen rail, at the valley's centre line. +Y up, +Z downstream ("front": the range is seen from +Z).
// Size: pens x -973..+973; curtains z 0..1536; long beam at y 153, z -158; massif to 320 m. radius/height are viewer hints only.
// opts: palette (7 hex: chart, straw, print, earth ink, aged ink, tide ink, red; used for the cream stock), detail 0.6..1,
//   stock 'cream'|'buff'|'ledger', record 'calm'|'storm'|'spring', shock 'sharp'|'swarm'|'giant', hour 'day'|'golden'|'night',
//   density (blots), rows 'all'|'valley' (valley = the 18 valley rows only), floor (false: the world lays its own sheet).
//   stock, record, shock and density are drawn from ctx.rng when not given.
// Progress: the stream runs on world time. The quake and the ink car run on flight seconds: call setFlightSeconds(s) (or
//   setProgress(u)) every frame; s = 19 starts the quake, the car fills the pen at x -49 at s 0..1.6. Never called = a 40 s demo loop.
// Caps: setFlankCap(pathY + 25) holds the two curtains beside the path (x 35 and 49) just over eye height; setBoxCap for the turn.
// anchors (local): portalSeat {position, facing, radius 10, eyelet 10.6} in the sheet where it climbs the drum (anchors.drum);
//   flyThrough: the brief's line, 7 m from each curtain plane; viewpoints {entry, nibClose, broadside, valleyHead, insideRange,
//   nibPass}: eye/look pairs for the brief's frames; gapWest/gapEast (x -42, +42), redRow, entryNib, shortBeam, longBeam, carRail.
// Cost: about 175k triangles, 13 draw calls, 5 programs, one 4096 x 140 half-float texture, no lights; build about 280 ms.
// Expects around it: the sheet (floor, drum, vault) in sheetMaterial, the eyelet and chads in instrumentMaterial; post flat: 1.
//
// THE STYLE, and what to shade the rest of the world with (all take the one uniforms object: hero.uniforms):
//   STYLE_GLSL            uniforms + wrHeight (the record: height of a row's trace at world z), wrLean/wrArc (the arm's arc),
//                         wrPaper/wrPaperAge (distance is age), wrRule (printed ruling, fwidth-filtered, flat average when fine).
//   makeStyleUniforms()   the shared uniforms (palette, uScroll, uS, quake, caps, uFoot, uOldRamp, uFox ...).
//   curtainMaterial(u), curtainGeometry(sections, levels), curtainMesh(geo, mat, rowIndices, hero.rows): more paper curtains.
//   sheetMaterial(u)      floor, drum, vault: geometry needs attribute aS (metres along the paper; on the floor aS = z).
//   instrumentMaterial(u, 'static')   blued steel and brass in flat tints; geometry needs normal and aTone
//                         (0 steel, 1 brass, 2 glass holding ink, 3 riveted girder, 4 ink).
//   WR, WR_PALETTE, LEVELS            the numbers.
// Colour is exact: every material writes the palette's linear values and nothing else (no light, no fog, no tone curve).
// Added by the world builder: uShade + uFoot (vec4) tone each sheet down its whole height so paper, not line, separates the ridges;
//   uHole (the punched hole and its dimple in sheetMaterial); uDry (the dry pen: row v, z where the ink ran out, z of the refill,
//   strength); setFlankCap's `on` above 1 presses the two flanking pens against the cap (a clipped line just under it); the sheet's
//   cross-rulings are arcs lane by lane; gains step up away from opts.gapX (42) so the range is seen rank behind rank from inside;
//   hero.tideMax; exports inkCarGeometry, toned, M4.
// Second pass: uRank (while the flank cap holds, the n-th row from the gap crests n steps over the cap, keeping its fins and saddles:
//   the massif is an amphitheatre round the gap, both sides); uFin (the red flank's fins; w = how far under the cap the west flank runs);
//   the ink of a steep flank seen edge-on is drawn whole across the pixel's footprint and blots are filtered from smooth quantities
//   (no lattice, no stipple); sheets tone 40 percent toward the shade in their top 20 m (uFoot) so ridges part by tone at a distance;
//   the punch's dimple is drawn rings of tone out to 54 m; the long beam is a 9 m riveted girder with splice plates at each saddle;
//   long arms are 10-sided with three more brass collars toward the pivot; the metal's highlight is a paler tint of its own pigment.
// Third pass: the exit moved to x 168 (a 20 m portal in a 21 m eyelet) so the route can run along the long beam first; uQuake3 (an
//   aftershock, written while the instrument is seen from the pivots' side); uDrop (the flanking pens come off their stops once the
//   eye has passed them); uRankFloor (the ranks' saddles filled part way); five ranks each side hold whatever a row's own gain;
//   the two flanking arms stay stout to near the nib; the girder's flanges are riveted too; the flanking wet lines are a hand's
//   breadth with a thread that holds two pixels and feathered tongues; a starving line narrows and breaks into dashes (never a
//   paler tint); the dry pen's blot is 6 m, feathered, with the grain showing at its rim; the dimple's rings reach 90 m and step
//   darker toward the hole.
// Fourth pass: distance is age across the rows too (uTone, uDeep: a sheet n rows from the eye is a visible step older, so a stack of
//   ridges is a stack of tones; cameraPosition is read in the curtain's fragment shader); near ink lines hold three pixels; a shock
//   builds over five seconds (foothills first) and each row has great summits 300 m apart, a third of a swing from its neighbour's
//   (wrHeight: slow), east rows writing first, so the massif is peaks side by side from the south-west; the last shock steps up row by
//   row from 8 m at x -35; ranks stand only where the shock stands and only while the cap is down (uRankBase: up among them the near
//   ranks crest under the eye); the red flank throws a tooth every 27 m; the punch's dimple is the chart pulled toward the hole (print
//   bent and crowded at the lip) with four hard-edged steps of tone; the long girder has flanged lightening holes; a counterweight is a
//   turned brass weight (rod, lock nut, paler shoulder bands tone 5, knurled blued clamp ring tone 6 with its screw, pivot pin); long
//   arms are 16-sided and never thinner than about two pixels far off.
// Fifth pass: nothing written is rewritten in view. The ranks are a fixed landscape the record streams through (uRankE: their line
//   along the gap, setRankLine; uRank at the gap's mouth, uRankB / uRankZ up among them), each rank's fins the swing itself, pointed,
//   building over the shock's first 50 m; the flank cap holds only where this shock stands; the red row's fins are settled when
//   written (uFin: height, the quake seconds over which they stop; uFinT: the shock's first great red peaks). Sheets age downstream
//   and the old ranges more (uAge) so old paper is a deeper stock than the fresh sheet; aged ledger stock is a foxed grey-buff and
//   its green as dark as the violet. Every valley row carries its line as a ribbon too (ribbonMesh, uPx), so a trace looked down on
//   along its own sheet stays one line. Near sheets print the chart's finest graduations; the tide's line keeps its thread 140 m;
//   long arms hold four pixels far off and close into a flat band beyond 700 m; long arms are 32-sided (round counterweights), the
//   flanking arms fine again at the nib, the bulb a 28-sided sphere.
// Sixth pass: the ranks' line climbs with the route up the gap (setRankLine with a slope: only the summits climb, the saddles stay, so
//   ranks stand over the eye to within 40 m of the pens); the red row's first peaks are blades (a sixth power of the swing); sheets
//   tone over their top 10 m and the fine rulings print heavier to about 60 m; a ribboned sheet seen along its own plane, or slantwise
//   and far enough that a pixel covers a metre of record, leaves its line to the ribbon (no dotted ink); the aftershock is half body
//   with slower swings; the flanking arms are slimmer (1.7 times the others); tide blots and the flanking lines' blots are smaller.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WR_PALETTE = ['#F1E7CC', '#E3CC96', '#A9CDB0', '#5B2A8C', '#7A5230', '#1F2C44', '#C8281E'];
export const WR = {
  rows: 140, pitch: 14, x0: -973, speed: 20, recLen: 4096, margin: 2.6,
  shortArm: { py: 34, pz: -84 }, longArm: { py: 150, pz: -158 }, bulbLift: 1.6,
  bridge: 36,          // the recorder's bridge: metres of solid riveted plate standing on the long girder's top flange, under its cap flange
  sheetHalf: 2700,     // half the width of the sheet, the drum and the vault: the world's two paper side walls stand at x -sheetHalf and +sheetHalf
};
// The long girder and its bridge run out through both paper side walls and end 6 m behind them, so that no end of them stands
// inside the world (the short beam is laid as it always was, to 30 m past the outermost rows).
const GIRDER_HALF = WR.sheetHalf + 6;
// The recorder's bridge (bridgeGeometry, INSTR_FRAG) stands on the long girder, so its levels are worked out from that girder's own
// numbers by beamGeometry's rule (buildHero lays it with a web 9 m deep and 4.6 m thick): the plate's foot is the top of the girder's
// top flange, its courses are the web's depth, its cap flange is the girder's flanges' size.
const BRIDGE = (() => {
  const web = 9, wid = 4.6, flange = web * 0.16, foot = WR.longArm.py + WR.bulbLift + 1.2 + web * 0.5 + web * 0.58 + flange * 0.5;
  return { web, wid, flange, foot, top: foot + WR.bridge };
})();
// The long girder's steel with its bridge and cap as one box, in the hero's metres (the world's, where the hero stands at the
// origin): x over the length buildHero lays the long girder (GIRDER_HALF either side), y from the underside of the girder's lower
// flange (by beamGeometry's rule the flanges' middles lie 0.58 of the web's depth either side of the web's middle) to the top of
// the cap flange, z over the flanges' width (half as wide again as the web). steelGap(x, y, z) is the metres from a point to
// that box, 0 inside it: for whatever must keep clear of the steel.
const STEEL = (() => {
  const B = BRIDGE, half = GIRDER_HALF, under = B.foot - B.flange - 2 * B.web * 0.58, fw = B.wid * 1.5 * 0.5;
  return { lo: [-half, under, WR.longArm.pz - fw], hi: [half, B.top + B.flange, WR.longArm.pz + fw] };
})();
export const steelGap = (x, y, z) => Math.hypot(
  Math.max(STEEL.lo[0] - x, x - STEEL.hi[0], 0), Math.max(STEEL.lo[1] - y, y - STEEL.hi[1], 0), Math.max(STEEL.lo[2] - z, z - STEEL.hi[2], 0));
const lin = (hex) => new THREE.Color(hex);

// ------------------------------------------------------------------ the style, in GLSL
// One routine states the record: wrHeight() is the height in metres of the trace of a row at world z.
// Curtains, arms and nibs all call it, so a nib always sits on the line it writes.
export const STYLE_GLSL = /* glsl */`
uniform sampler2D uRec;      // 4096 x 140 half float: R quiet trace (m), G spare, B blot radius (m)
uniform float uScroll;       // metres of paper gone by, wrapped to 4096
uniform float uS;            // flight seconds (the quake's clock)
uniform vec4 uQuake;         // t0 (s), height (m), sustain (s), decay rate
uniform vec4 uQuakeF;        // three swing rates (Hz) and the sharpness mix
uniform vec4 uQuake2;        // the last shock: t0, height, sustain, decay
uniform vec4 uQuake3;        // the aftershock: t0, height, sustain, decay (height 0 = none)
uniform vec3 uQuake2F;       // the last shock: swing rate scale, body 0..1, how much of the fast swings
uniform vec4 uFoot;          // paper tones this far toward the shade (x) over this many metres below its line (y), and z more over w metres
uniform vec4 uCap;           // rows at x = uCap.x and uCap.y are held under uCap.z (uCap.w: 0 off, 1 on, up to 2 = pressed against the cap)
uniform vec4 uRank;          // the ranks beside the gap: row n (1, 2, 3 ...) from the gap crests at uCap.z + x n + y n^2 + z n^3; w = fullness of the crest
uniform vec4 uFin;           // the east flank's fins over its pressed line: height (m), they stand from z = y to z = z; w = the west flank's cap, metres from uCap.z
uniform vec4 uCapBox;        // x0, x1, z0, z1: every row inside is held under uCapBoxH
uniform float uCapBoxH;
uniform float uEyeCap;       // the height the ranks are counted from (the eye); the flank cap uCap.z comes down to it
uniform float uRankBase;     // metres over the cap at which the ranks begin (negative once the eye is up among them: the near ranks crest under it)
uniform float uRankFloor;    // how far the ranks' saddles are filled (0 = they dip to the sheet, 1 = level crests)
uniform float uDrop;         // the two flanking pens' cap sinks by this much (m) once the eye has passed their nibs
uniform vec2 uOldRamp;       // the old ranges stand up between these two z
uniform vec4 uStarveA;       // row v, z where starving began, z of the refill, strength
uniform vec4 uStarveB;
uniform vec4 uDry;           // the dry pen: row v, z where the ink ran out, z of the refill, strength
uniform vec4 uHole;          // the punched hole in the sheet: centre, radius (0 = none)
uniform vec3 uShade;         // what paper tones toward down a sheet: straw, a little browned
uniform vec3 uPaper, uStraw, uPrint, uInkV, uInkT, uInkR, uSepia, uPlum, uThread, uSteel, uBrass;
uniform float uFox, uTime;
uniform vec4 uTone;          // row behind row: a sheet n rows from the eye is aged x * ((1 - exp(-y n)) + (1 - exp(-n / 10))) toward uDeep; z = the same for the floor's lanes; w = least half width of an ink line in pixels, near
uniform vec3 uDeep;          // the oldest paper: straw well browned
uniform vec2 uAge;           // sheets age this far toward uDeep by 520 m downstream (x); the old ranges this much more (y)
uniform vec4 uRankB;         // the ranks' steps up among them (as uRank), where z is below uRankZ.y
uniform vec4 uRankZ;         // the ranks stand as at the gap's mouth above z = x and as up among them below z = y; z = their base there (m over the eye's line), w = saddle fill there
uniform vec4 uRankE;         // the height the ranks are counted from, a fixed line up the gap: x at z >= y, rising w per metre upstream of y, never over z
uniform vec4 uFinT;          // the red row's first peaks: height (m), and the quake seconds y..z over which they end

float wrHash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
float wrHash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wrVNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wrHash2(i), wrHash2(i + vec2(1., 0.)), f.x), mix(wrHash2(i + vec2(0., 1.)), wrHash2(i + vec2(1., 1.)), f.x), f.y);
}
// a pen on an arm of length L pivoted at height py: how far downstream the nib stands when it is at height y
float wrArc(float y, float L, float py) {
  float a = clamp(y - py, -L, L);
  return sqrt(max(L * L - a * a, 0.)) - sqrt(max(L * L - py * py, 0.));
}
// the lean a sheet takes from its arm: wrArc made piecewise linear through fixed heights lev (the last slope runs on),
// the same for every column of a row, so paper never folds over its neighbour
float wrLean(float y, vec4 lev, float L, float py) {
  float a1 = wrArc(lev.x, L, py), a2 = wrArc(lev.y, L, py), a3 = wrArc(lev.z, L, py), a4 = wrArc(lev.w, L, py);
  float z = a1 / max(lev.x, 1e-3) * clamp(y, 0., lev.x);
  z += (a2 - a1) / max(lev.y - lev.x, 1e-3) * clamp(y - lev.x, 0., lev.y - lev.x);
  z += (a3 - a2) / max(lev.z - lev.y, 1e-3) * clamp(y - lev.y, 0., lev.z - lev.y);
  z += (a4 - a3) / max(lev.w - lev.z, 1e-3) * max(y - lev.z, 0.);
  return z;
}
vec4 wrRec(float v, float rec) { return textureLod(uRec, vec2((rec + .5) / 4096., v), 0.); }
float wrSpike(float x) { float t = 1. - abs(fract(x) * 2. - 1.); return t * t * (1.6 - .6 * t); }
float wrEnv(float w, float sustain, float decay) {
  return smoothstep(0., .45, w) * exp(-max(w - sustain, 0.) * decay);
}
// one shock: w is seconds since this row's pen began to thrash, ph the row's phase, returns 0..1
float wrShock(float w, float ph, vec4 q, vec3 fb) {
  // a shock builds: its first fins are a third of the height, the full range stands after five seconds (100 m of paper),
  // so from downstream the range is foothills first, rank behind rank, summits inside the frame
  float e = wrEnv(w, q.z, q.w) * (.3 + .7 * smoothstep(0., 5., w));
  float a = uQuakeF.w * fb.z;
  float ws = w * fb.x;
  float s = (1. - .42 * a) * wrSpike(uQuakeF.x * ws + ph) + .30 * a * wrSpike(uQuakeF.y * ws + ph * 2.7) + .10 * a * wrSpike(uQuakeF.z * ws + ph * 5.3);
  return e * (fb.y + (1. - fb.y) * s);
}
float wrSoftCap(float h, float cap, float over) {      // over: how far the tallest peaks still stand above the cap (m)
  float k = 6.;
  float o = max(h - (cap - k), 0.);
  return min(h, cap - k) + k * (1. - exp(-o / k)) + over * (1. - exp(-o / 140.));
}
// row = (x, v in the record texture, class 0 tide 1 now 2 old range 3 barograph, phase)
// row2 = (quake delay in s or -1, quake gain, arm length, pivot height)
float wrHeight(vec4 row, vec4 row2, float z) {
  float rec = z - uScroll;
  float h = wrRec(row.y, rec).r;
  float old = step(1.5, row.z) * step(row.z, 2.5);
  float ramp = clamp((z - uOldRamp.x) / max(uOldRamp.y - uOldRamp.x, 1e-3), 0., 1.);
  h *= mix(1., .04 + .96 * ramp * ramp * (3. - 2. * ramp), old);
  float on = step(0., row2.x);
  float w = uS - z / 20. - row2.x;
  // each row's range has its own great summits, 300 m of paper apart and a third of a swing from its neighbour's: seen slantwise,
  // down the rows, the massif is broad peaks side by side, not a comb of slabs
  float slow = .34 + .66 * wrSpike(.07 * (w - uQuake.x) + row.x * .0236);
  float q = uQuake.y * slow * wrShock(w - uQuake.x, row.w, uQuake, vec3(1., .16, 1.))
    + uQuake3.y * wrShock(w - uQuake3.x, row.w + .9, uQuake3, vec3(.7, .5, .6));
  // the last shock is seen from the west gap: its rows step up away from it (x -35 a third of the height, x 49 and beyond the whole),
  // so it stands ridge behind ridge, each sheet over the one in front
  float g2 = min(1., .031 * exp((row.x + 35.) * .03)) * (.9 + .2 * fract(row.w * 7.31));   // 8 m at x -35, half as high again each row east
  float hq = on * (row2.y * q + g2 * uQuake2.y * wrShock(w - uQuake2.x, row.w + 1.7, uQuake2, uQuake2F));
  // rank behind rank: while the flank cap holds, the n-th row from the gap is written lower, cresting n steps over the eye,
  // so the massif is an amphitheatre round the gap. The trace keeps its fins and saddles (a fuller curve of the same swing).
  float rn = (abs(row.x - .5 * (uCap.x + uCap.y)) - 7.) / 14.;
  float kz = 1. - smoothstep(uRankZ.y, uRankZ.x, z);           // 0 at the gap's mouth, 1 up among the ranks
  vec4 rk = mix(uRank, uRankB, kz);
  float rbase = uRankZ.z * kz, eyeZ = clamp(uRankE.x + uRankE.w * (uRankE.y - z), uRankE.x, uRankE.z);
  float off = rbase + rn * (rk.x + rn * (rk.y + rn * rk.z)), offLo = rbase - 5. - (eyeZ - uRankE.x);
  float pk = max(uQuake.y * row2.y, 1.);
  float rb = on * min(uCap.w, 1.) * step(.5, rn) * (1. - smoothstep(5.2, 6.4, rn));      // five ranks each side, whatever the row's own gain
  float rr = clamp(hq / pk, 0., 1.);
  float full = (1. - exp(-rk.w * rr)) / max(1. - exp(-rk.w), 1e-3);
  // the swing shapes only what stands over the eye: a rank's saddles dip toward the cap, never under it, on both sides of the gap
  // (only where this shock stands, and only while the cap is down at the eye: before that the rows stand free)
  float envQ = wrEnv(w - uQuake.x, uQuake.z, uQuake.w);
  // the ranks are a fixed landscape the record streams through: their line climbs with the gap (eyeZ), so nothing written is
  // ever rewritten in view; a rank stands wherever this shock stands, from the first moment it is seen
  float gate = smoothstep(.03, .3, envQ);
  rb *= gate;
  // a rank's fins are the swing itself, pointed (uRank.w mixes in the fuller curve), some summits greater than others; the
  // range builds over its first 50 m of paper, foothills first
  float wr0 = w - uQuake.x;
  float fin = (.68 * wrSpike(uQuakeF.x * wr0 + row.w) + .32 * wrSpike(uQuakeF.y * wr0 + row.w * 2.7)) * (.6 + .4 * slow);
  fin = mix(fin, full, clamp(rk.w - 1., 0., 1.));
  float hr = eyeZ + offLo + (off - offLo) * mix(fin, 1., mix(uRankFloor, uRankZ.w, kz));
  h += mix(hq, max(hr * mix(.1, 1., smoothstep(0., 2.5, wr0)), 4.), rb);
  float isFlank = max(1. - step(.5, abs(row.x - uCap.x)), 1. - step(.5, abs(row.x - uCap.y)));
  float flank = isFlank * min(uCap.w, 1.) * gate;      // (only where this shock stands: the last shock's rows stand free)
  // uCap.w above 1: the two flanking pens are driven against their stops while the quake lasts, and write a clipped line just under the cap
  float press = max(uCap.w - 1., 0.) * on * smoothstep(.2, .6, wrEnv(w - uQuake.x, uQuake.z, uQuake.w));
  float capF = max(uCap.z - uDrop, 8.);
  float hf = max(h, (capF + 4. + 3. * sin(w * 7. + row.w * 6.)) * press);
  float capW = capF + uFin.w * (1. - step(.5, abs(row.x - uCap.x)));     // the west flank is held lower: its line runs under the eye
  h = mix(h, wrSoftCap(hf + uFin.w * (1. - step(.5, abs(row.x - uCap.x))), capW, 1.5), flank);
  // the red row's fins: over its pressed line the east pen still throws a fin at each swing (they stand a little way downstream)
  // (how tall is settled when a fin is written, never afterwards: the shock's first red peaks are great ones, then a tooth
  // every 27 m of paper until the quake second uFin.z, after which the pen runs level as we come abreast of it)
  float wq = w - uQuake.x;
  float fs = wrSpike(.75 * wq + row.w);
  float fs2 = wrSpike(.3 * wq + row.w * .37 + .25);
  float finA = uFin.x * (1. - smoothstep(uFin.y, uFin.z, wq)) * fs * sqrt(max(fs, 0.))
    + uFinT.x * smoothstep(.2, 1.2, wq) * (1. - smoothstep(uFinT.y, uFinT.z, wq)) * fs2 * fs2 * fs2 * fs2 * fs2 * fs2;
  h += (1. - step(.5, abs(row.x - uCap.y))) * press * finA;
  float inBox = step(uCapBox.x, row.x) * step(row.x, uCapBox.y) * smoothstep(uCapBox.z - 40., uCapBox.z, z) * (1. - smoothstep(uCapBox.w, uCapBox.w + 40., z));
  h = mix(h, wrSoftCap(h, uCapBoxH, 5.), inBox * step(.5, uCapBoxH));
  return max(h, 0.) * (1. - smoothstep(1400., 1530., z));
}
// distance is age: 0 new, 1 old. Paper yellows, ink browns.
float wrPaperAge(float z, float x) { return clamp((z + .5 * abs(x)) / 1400., 0., 1.); }
vec3 wrPaper(float age) { return mix(uPaper, uStraw, age); }
// printed rulings: coordinate c in metres, period p, line width lw; finer than 3 px it becomes its flat average
float wrRule(float c, float p, float lw, float fw) {
  fw = max(fw, 1e-4);
  float d = abs(fract(c / p + .5) - .5) * p;
  float w = max(lw, 1.5 * fw);
  float line = (1. - smoothstep(w * .5 - fw * .5, w * .5 + fw * .5, d)) * min(1., lw / max(w, 1e-4) + .25);
  float flatAvg = lw / p;
  return mix(line, flatAvg, smoothstep(p / 6., p / 3., fw));
}
`;

// ------------------------------------------------------------------ rows and the record
const rowX = (i) => WR.x0 + i * WR.pitch;
// class: 0 tide, 1 the Now (seismograph, takes the quake), 2 old range, 3 barograph
function rowClass(i) {
  const x = rowX(i), ax = Math.abs(x);
  if (x >= -119 && x <= -49) return 0;
  if (x >= -35 && x <= 119) return 1;
  if (ax >= 133 && ax <= 245) return 2;
  return 3;
}
const SIN = new Float32Array(4096);
for (let i = 0; i < 4096; i++) SIN[i] = Math.sin((i / 4096) * Math.PI * 2);
const spikeJS = (x) => { const t = 1 - Math.abs((x - Math.floor(x)) * 2 - 1); return t * t * (1.6 - 0.6 * t); };

// Fills the 4096 x 140 record. Returns { texture, data (Float32 heights of the tide rows for the ink car), tideMax }.
async function makeRecord(ctx, rng, v) {
  const N = 4096, R = WR.rows, toHalf = THREE.DataUtils.toHalfFloat;
  const px = new Uint16Array(N * R * 4), row = new Float32Array(N), tide = {};
  let tideMax = 0;
  const notch = []; for (let k = 0; k < 40; k++) notch.push(Math.round(k * 102.4));
  for (let r = 0; r < R; r++) {
    const cls = rowClass(r), x = rowX(r), rr = rng.fork('row' + r);
    const terms = [];
    const add = (k, amp) => terms.push([Math.max(1, Math.round(k)), amp, rr.int(0, 4095)]);
    let base = 0, old = null, env = null;
    if (cls === 1) {
      base = v.storm ? 8 : 3.6;
      const a = v.storm ? 1.3 : 1;     // storm surf 3..13 m: it must stay under the eye in the gaps
      add(rr.range(90, 140), 0.9 * a); add(rr.range(190, 260), 0.7 * a); add(rr.range(380, 520), 0.5 * a);
      add(rr.range(900, 1300), 0.28 * a); add(rr.range(1500, 1900), 0.2);
      env = [Math.round(rr.range(9, 17)), rr.int(0, 4095)];
    } else if (cls === 0) {
      const sp = v.spring ? 2.0 : 1;
      base = 5.4 * sp;
      const k = (v.spring ? 22 : 36) + (r - 61) * 0.0;
      add(k, 2.1 * sp); add(k * 2 + 1, 0.45 * sp); add(rr.range(230, 300), 0.22); add(rr.range(700, 900), 0.1);
      terms[0][2] = (1200 + (r - 61) * 190) & 4095; terms[1][2] = (700 + (r - 61) * 310) & 4095;
    } else if (cls === 2) {
      const d = (Math.abs(x) - 133) / 112, prof = 0.45 + 0.55 * Math.sin(Math.PI * (0.12 + 0.8 * d));
      old = { H: Math.min(280, (x > 0 ? 240 : 190) * prof * v.oldGain), k1: rr.range(9, 13), k2: rr.range(25, 37), p1: rr.range(0, 1) + d * 0.6, p2: rr(), ke: rr.int(3, 6), pe: rr.int(0, 4095) };
      add(rr.range(400, 600), 0.5); add(rr.range(1200, 1600), 0.25);
    } else {
      const edge = Math.min(r, R - 1 - r);
      if (edge < 12) {
        base = 46 * (v.storm ? 0.8 : 1);
        add(rr.int(3, 5), 9); add(rr.int(7, 11), 5); add(rr.int(17, 26), 1.2);
        terms[0][2] = (rr.int(0, 500) + edge * 260) & 4095;
      } else {
        const g = 1 - (edge - 12) / 40; base = 4 + 7 * g;
        add(rr.int(6, 11), 1.6 + 3 * g); add(rr.int(15, 28), 0.8 + g); add(rr.range(300, 500), 0.2);
      }
    }
    for (let i = 0; i < N; i++) {
      let h = base;
      for (let t = 0; t < terms.length; t++) { const T = terms[t]; h += T[1] * SIN[(T[0] * i + T[2]) & 4095]; }
      if (env) h = base + (h - base) * (0.55 + 0.45 * SIN[(env[0] * i + env[1]) & 4095]) * 1.5;
      if (old) {
        const u = i / N, e = 0.62 + 0.38 * SIN[(old.ke * i + old.pe) & 4095];
        h += old.H * e * (0.26 + 0.50 * spikeJS(old.k1 * u + old.p1) + 0.24 * spikeJS(old.k2 * u + old.p2));
      }
      row[i] = Math.max(0.6, h);
    }
    const nh = cls === 3 ? 2.2 : 1.4;
    for (const n of notch) { row[n & 4095] += nh; row[(n + 1) & 4095] += nh; }
    // blots: where the pen reversed hard at a crest
    const o = r * N * 4, blotP = (cls === 3 ? 0.2 : cls === 2 ? 0.8 : 0.3) * v.blots;
    for (let i = 0; i < N; i++) {
      const h = row[i], a = row[(i + N - 1) & 4095], b = row[(i + 1) & 4095];
      let blot = 0;
      if (h > a && h >= b && (2 * h - a - b) > (cls === 2 ? 0.5 : cls === 1 ? 0.3 : 0.1) && rr() < blotP) blot = rr.range(0.3, 0.6) * (cls === 2 ? 1.5 : 1);
      px[o + i * 4] = toHalf(h); px[o + i * 4 + 1] = 0; px[o + i * 4 + 2] = toHalf(blot); px[o + i * 4 + 3] = toHalf(1);
    }
    if (cls === 0) { tide[r] = Float32Array.from(row); for (let i = 0; i < N; i++) tideMax = Math.max(tideMax, row[i]); }
    await ctx.yield();
  }
  const tex = new THREE.DataTexture(px, N, R, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return { texture: tex, tide, tideMax };
}

// Shared uniforms: every material of the world takes this one object, so one update moves everything.
export function makeStyleUniforms(palette = WR_PALETTE) {
  const p = palette.map(lin);
  return {
    uRec: { value: null }, uScroll: { value: 0 }, uS: { value: 0 }, uTime: { value: 0 },
    uQuake: { value: new THREE.Vector4(19, 300, 10, 0.45) }, uQuakeF: { value: new THREE.Vector4(0.3, 0.8, 1.7, 1) },
    uQuake2: { value: new THREE.Vector4(-47, 260, 11, 0.5) }, uQuake3: { value: new THREE.Vector4(1e4, 0, 5, 0.5) }, uQuake2F: { value: new THREE.Vector3(0.22, 0.4, 0.3) }, uFoot: { value: new THREE.Vector4(0.40, 10, 0.5, 110) }, uShade: { value: p[1].clone().lerp(p[4], 0.32) },
    uCap: { value: new THREE.Vector4(35, 49, 40, 0) }, uCapBox: { value: new THREE.Vector4(-42, 42, 200, 400) }, uCapBoxH: { value: 0 }, uDrop: { value: 0 }, uRankFloor: { value: 0 }, uRankBase: { value: 0 }, uEyeCap: { value: 40 },
    uRank: { value: new THREE.Vector4(1.2, 2.2, 0.35, 1.5) }, uFin: { value: new THREE.Vector4(0, 55, 95, 0) },
    uRankB: { value: new THREE.Vector4(1.2, 2.2, 0.35, 1.5) }, uRankZ: { value: new THREE.Vector4(1e4, 9e3, 0, 0) }, uRankE: { value: new THREE.Vector4(40, 0, 40, 0) }, uFinT: { value: new THREE.Vector4(0, 4, 7, 0) }, uAge: { value: new THREE.Vector2(0.3, 0.25) }, uPx: { value: new THREE.Vector2(1.1, 0.0027) },
    uOldRamp: { value: new THREE.Vector2(50, 210) },
    uStarveA: { value: new THREE.Vector4(-1, 0, 0, 0) }, uStarveB: { value: new THREE.Vector4(-1, 0, 0, 0) }, uDry: { value: new THREE.Vector4(-1, 0, 0, 0) }, uHole: { value: new THREE.Vector4(0, 0, 0, 0) },
    uPaper: { value: p[0] }, uStraw: { value: p[1] }, uPrint: { value: p[2] }, uInkV: { value: p[3] }, uSepia: { value: p[4] },
    uInkT: { value: p[5] }, uInkR: { value: p[6] }, uPlum: { value: p[3].clone().lerp(p[4], 0.5) },
    uThread: { value: p[3].clone().lerp(lin('#ffffff'), 0.62) }, uSteel: { value: lin('#2E3F5C') }, uBrass: { value: lin('#B8923A') },
    uFox: { value: 0 }, uTone: { value: new THREE.Vector4(0.45, 0.45, 0.3, 1.45) }, uDeep: { value: p[1].clone().lerp(p[4], 0.5) },
  };
}

const STARVE_CEIL = 0.4;   // a pen the ink car serves starves to this strength at its worst: its line thins and breaks into dashes, ink on about three fifths of its length; only the dry pen (uDry) starves to nothing
// ------------------------------------------------------------------ curtains: paper standing on the sheet, inked along its top
const CURTAIN_VERT = /* glsl */`
attribute vec4 aRow; attribute vec4 aRow2; attribute vec4 aLev; attribute float aInk;
varying vec4 vA; varying vec4 vB; varying vec4 vRow;
${STYLE_GLSL}
void main() {
  float sp = position.z;
  float zc = position.x + sp * fract(uScroll / max(sp, 1e-3));
  float e = max(.5, .5 * sp);
  float h = wrHeight(aRow, aRow2, zc);
  float sl = (wrHeight(aRow, aRow2, zc + e) - wrHeight(aRow, aRow2, zc - e)) / (2. * e);
  float y = mix(min(position.y, h), h + ${WR.margin.toFixed(1)}, step(5000., position.y));   // fixed levels, so every column shears alike
  float z = zc + wrLean(y, aLev, aRow2.z, aRow2.w);
  vA = vec4(y, h, sl, z);
  vB = vec4(zc, uS - zc / 20. - aRow2.x, step(0., aRow2.x) * aRow2.y, aRow.w);
  vRow = vec4(aRow.x, aRow.y, aInk, aRow.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(aRow.x, y, z, 1.);
}`;
const CURTAIN_FRAG = /* glsl */`
varying vec4 vA; varying vec4 vB; varying vec4 vRow;
${STYLE_GLSL}
// a disc of ink standing on a crest: a = metres along the record from the crest, up = metres above the local trace
// returns metres inside the disc's edge (negative outside; -4 where there is no blot), so the edge can be filtered by its own derivative
float wrBlot(float a, float up, float sl, float r) {
  float b = up - abs(sl * a) - .55 * r;
  return mix(-4., r - length(vec2(a, b)), step(.05, r));
}
float wrStarve(vec4 s, float v, float z) {
  float m = 1. - step(.003, abs(v - s.x));
  return ${STARVE_CEIL.toFixed(2)} * m * s.w * clamp((s.y - z) / 150., 0., 1.) * step(s.z, z);
}
void main() {
  float y = vA.x, h = vA.y, sl = vA.z, z = vA.w, zc = vB.x;
  float inv = inversesqrt(1. + sl * sl);
  float dv = h - y;
  float d = dv * inv;
  float px = max(max(fwidth(y), fwidth(z)), 1e-4);       // metres per pixel on the paper
  // d is a distance on the paper, so it cannot change faster than the paper's metres per pixel: where columns are finer than
  // a pixel (a fin seen edge-on) the raw derivative jumps from column to column and would draw the ink as a lattice
  float fw = clamp(length(vec2(dFdx(dv), dFdy(dv))) * inv, 1e-4, 1.5 * px);
  float near = 1. - smoothstep(.02, .09, px);
  float recC = zc - uScroll;                                // where on the chart this point of paper lies
  float recU = recC;
  // the ink: the top 0.3 m, feathered below when seen close, never thinner than 1.5 px
  float w = vB.y - uQuake.x;
  float heavy = clamp(3. * vB.z * wrEnv(w, uQuake.z, uQuake.w * .5) * (1. - smoothstep(uQuake.z + 4., uQuake.z + 12., w)), 0., 1.);   // the quake is written with a loaded pen
  float flk = max(1. - step(.5, abs(vRow.x - uCap.x)), 1. - step(.5, abs(vRow.x - uCap.y)));   // the two lines beside the route
  float fea = (wrVNoise(vec2(recU * 5., d * 2.5)) - .5) * mix(.11, .2, flk) * near;   // tongues of ink bleeding down the fibre, not specks
  float half0 = .15 + .22 * heavy * (1. - .82 * flk);
  // a starving line narrows and skips: broken dashes of full-strength ink getting thinner, never a paler tint
  float isDry = (1. - step(.003, abs(vRow.y - uDry.x))) * uDry.w;
  float dry = isDry * step(uDry.z, zc) * (1. - smoothstep(uDry.y - 36., uDry.y, zc));   // the line starves to nothing
  float st = max(max(wrStarve(uStarveA, vRow.y, zc), wrStarve(uStarveB, vRow.y, zc)), dry);
  float present = smoothstep(st * 1.2 - .12, st * 1.2, wrVNoise(vec2(recC * .9, 3.7 + vRow.x)));
  // a steep flank on columns finer than a pixel (the sheet seen edge-on): the trace sweeps the whole height the pixel's footprint
  // covers, so the stroke is drawn whole across it, never as a lattice of dots
  float pz = fwidth(zc);
  float minPx = mix(uTone.w, 1.2, smoothstep(250., 700., 1. / max(gl_FragCoord.w, 1e-4)));   // near lines hold three pixels, far ones two and a half
  float th = max(half0 * (1. - .7 * st), minPx * fw) + .5 * abs(sl) * inv * pz * smoothstep(.25, .8, pz);
  float dd = d - half0;
  float ink = (1. - smoothstep(th - .5 * fw, th + .5 * fw, abs(dd + fea * step(0., dd)))) * present;
  vec3 toEye = cameraPosition - vec3(vRow.x, y, z);
  float eyeD = max(length(toEye), 1e-3), graze = abs(toEye.x) / eyeD;
  // (and where a pixel covers more than a metre of the record on a sheet seen slantwise within 400 m, as from the beam: its own ink
  // would break into dots beside the ribbon)
  float coarse = smoothstep(.7, 1.6, pz) * (1. - smoothstep(.3, .5, graze)) * (1. - smoothstep(350., 500., eyeD));
  ink *= mix(1., smoothstep(.03, .09, graze) * (1. - coarse), 1. - step(1.5, vRow.w));
  float paperCov = smoothstep(-.5 * fw, .5 * fw, dd);
  // blots thrown where the pen reversed
  float up = -dv, bf = -4.;
  float i0 = floor(recC + .5);
  float bsz = 1. - .45 * flk;                                // (the two lines beside the route are seen from 5 m: their blots are smaller)
  bf = max(bf, wrBlot(recC - (i0 - 1.), up, sl, wrRec(vRow.y, i0 - 1.).b * bsz));
  bf = max(bf, wrBlot(recC - i0, up, sl, wrRec(vRow.y, i0).b * bsz));
  bf = max(bf, wrBlot(recC - (i0 + 1.), up, sl, wrRec(vRow.y, i0 + 1.).b * bsz));
  float qe = wrEnv(w, uQuake.z, uQuake.w) * vB.z;
  float qa = (fract(uQuakeF.x * w + vB.w) - .5) / max(uQuakeF.x, 1e-3) * 20.;
  bf = max(bf, wrBlot(qa, up, sl, min(.8, 2.6 * qe) * (1. - .6 * flk)));
  float qb = (fract(uQuakeF.y * w + vB.w * 2.7) - .5) / max(uQuakeF.y, 1e-3) * 20.;   // and smaller ones at the quicker swing
  bf = max(bf, wrBlot(qb, up, sl, min(.5, 1.5 * qe) * step(.35, wrHash(floor(uQuakeF.y * w + vB.w * 2.7) + 3. * floor(vRow.x / 14. + .25)))));
  bf = max(bf, wrBlot(zc - uStarveA.z, up, sl, .42 * uStarveA.w * (1. - step(.003, abs(vRow.y - uStarveA.x))) * step(1., uStarveA.z)));
  // the disc's edge is one pixel of its own field wide: where the sheet is seen edge-on a wider edge would be a stipple above the paper
  float ab = clamp(.75 * (fwidth(recC) * (1. + 2. * abs(sl)) + fwidth(y)), .004, .5);   // from smooth quantities: fwidth(bf) jumps where two discs meet
  float blot = smoothstep(-ab, ab, bf) * (1. - smoothstep(.35, .8, sqrt(fwidth(y) * fwidth(zc))));
  blot *= 1. - dry;
  // the dry pen's line comes back with one great blot: it hangs below the line, soaked into the sheet, its rim feathered along the fibre
  // and the paper's grain showing through its edge
  float bq = length(vec2(zc - uDry.z, up - abs(sl * (zc - uDry.z)) + 1.8));
  float bd = 2.5 + .8 * (wrVNoise(vec2(recC * .8, y * .8)) - .5) + .28 * (wrVNoise(vec2(recC * 3.1, y * 3.1)) - .5) - bq;
  bd += (wrVNoise(vec2(recC * 9., y * 31.)) - .72) * .5 * (1. - smoothstep(0., .7, bd)) * near;
  bd = mix(-4., bd, isDry * step(1., uDry.z));
  blot = max(blot, smoothstep(-ab, ab, bd) * (1. - smoothstep(1.5, 4., px)));
  // paper: palest under its line, toned toward straw below; yellowing with distance; print in metres
  float age = wrPaperAge(zc, vRow.x);
  // distance is age across the rows too: the sheet beside the eye is the newest and palest, each one behind it a visible step older,
  // so a stack of ridges is a stack of tones (and every sheet still tones toward its foot, darker than the top of the one behind)
  float rn = abs(vRow.x - cameraPosition.x) / 14.;
  float rm = max(rn - .7, 0.);
  float rowAge = uTone.x * ((1. - exp(-uTone.y * rm)) + (1. - exp(-.1 * rm)));     // quick steps over the first five rows, slow ones beyond
  // and down the stream: paper that has stood a while is a deeper stock than the fresh sheet at the pens, the old ranges deepest of all
  rowAge = min(rowAge + uAge.x * smoothstep(100., 520., zc) + uAge.y * step(1.5, vRow.w) * step(vRow.w, 2.5), 1.);
  vec3 paper = mix(mix(wrPaper(age), uDeep, rowAge), mix(uShade, uDeep * .86, rowAge), uFoot.x * clamp(dv / max(uFoot.y, 1.), 0., 1.) + uFoot.z * clamp(dv / max(uFoot.w, 1.), 0., 1.));
  float fru = fwidth(recU);
  float pr = max(wrRule(y, 10., .2, fwidth(y)), wrRule(recU, 20., .34, fru));
  // at reading distance a sheet is unmistakably a strip of chart: the fine rulings print at full strength and the fibre shows
  float near2 = 1. - smoothstep(.03, .14, px);
  float near3 = 1. - smoothstep(.12, .34, px);                 // to about 60 m the fine rulings are heavy enough to read
  pr = max(pr, max(wrRule(y, 50., .3, fwidth(y)), wrRule(recU, 4., mix(.07, .13, near3), fru) * mix(.7, 1., near3)));   // the fine arcs ride the paper too
  pr = max(pr, wrRule(y, 2.5, mix(.06, .12, near3), fwidth(y)) * mix(.7, 1., near3));                                 // and the fine level rulings
  pr = max(pr, max(wrRule(y, .5, .03, fwidth(y)), wrRule(recU, 1., .034, fru)) * .75 * near2);      // and the chart's finest graduations, to about 30 m
  paper = mix(paper, mix(uPrint, uStraw, age * .75) * mix(1., .8, rowAge) * (1. - .1 * near2), pr * .9);
  float fib = wrVNoise(vec2(recU * 1.3, y * 34.)) + wrVNoise(vec2(recU * 21., y * 2.5)) - 1.;
  paper *= 1. - mix(.05, .1, near2) * fib * max(near, .6 * near2);
  float fox = smoothstep(.80, .87, wrVNoise(vec2(recU, y) * 2.3 + vRow.x)) * smoothstep(.45, .75, wrVNoise(vec2(recU, y) * .13 + vRow.x)) * uFox;
  paper = mix(paper, uSepia, .3 * fox * (1. - smoothstep(.06, .25, px)));
  // ink colour: its own pigment, darker and threaded while wet, browning with age
  float za = (zc + 16. * rn) * (1. - .8 * heavy);              // and its ink a step browner
  float isT = step(.5, vRow.z) * (1. - step(1.5, vRow.z));
  float wet = max(1. - smoothstep(mix(18., 70., isT), mix(42., 140., isT), zc), heavy);   // (the tide's heavy line keeps its thread longer)
  vec3 cv = mix(mix(uInkV, uPlum, smoothstep(40., 150., za)), uSepia, smoothstep(140., 300., za));
  vec3 ct = mix(uInkT, uSepia, .45 * smoothstep(200., 700., za));
  vec3 cr = mix(uInkR, uSepia, .5 * smoothstep(250., 800., za));
  vec3 ic = mix(cv, ct, step(.5, vRow.z) * (1. - step(1.5, vRow.z)));
  ic = mix(ic, cr, step(1.5, vRow.z));
  vec3 thread = mix(uThread, ic + (1. - ic) * .38, step(.5, vRow.z));
  ic *= mix(1., .7, wet);
  float tw = max(.02, 1.2 * fw);                             // the thread holds two to three pixels out to about 30 m
  float tl = (1. - smoothstep(tw - .5 * fw, tw + .5 * fw, abs(dd))) * wet * (1. - smoothstep(.05, .12, fw)) * step(tw * 2.5, th);
  ic = mix(ic, thread, max(tl, .08 * wet * smoothstep(.03, .12, fw)));
  ic = mix(ic, uStraw, smoothstep(1300., 1520., zc));
  float inkS = ink;
  float inkA = max(ink, blot);
  vec3 col = mix(paper, ic, inkA);
  float alpha = max(max(inkS, paperCov), step(.5, blot));   // the silhouette is whole: a faded blot or a thinned line is a paler tint, never a stipple
  if (alpha < .35) discard;
  gl_FragColor = vec4(col, alpha);
}`;

// The ink seen from above. A sheet looked down along its own plane is a sliver no line can be drawn on, so every valley row also
// carries its line as a ribbon lying across the top of the sheet, uPx.x pixels wide wherever it is seen from: from the side it is
// edge-on and adds nothing, from above (the beam run, the turn) the trace stays one whole line, never dashes.
const RIBBON_VERT = /* glsl */`
attribute vec4 aRow; attribute vec4 aRow2; attribute vec4 aLev; attribute float aInk;
varying vec4 vB; varying vec4 vRow;
${STYLE_GLSL}
uniform vec2 uPx;            // half width of the ribbon in pixels; the size of a pixel at 1 m
void main() {
  float sp = position.z;
  float zc = position.x + sp * fract(uScroll / max(sp, 1e-3));
  float h = wrHeight(aRow, aRow2, zc);
  vec3 c = vec3(aRow.x, h, zc + wrLean(h, aLev, aRow2.z, aRow2.w));
  float vd = length((modelViewMatrix * vec4(c, 1.)).xyz);
  c.x += position.y * vd * uPx.x * uPx.y;
  vB = vec4(zc, uS - zc / 20. - aRow2.x, step(0., aRow2.x) * aRow2.y, h);
  vRow = vec4(aRow.x, aRow.y, aInk, aRow.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(c, 1.);
}`;
const RIBBON_FRAG = /* glsl */`
varying vec4 vB; varying vec4 vRow;
${STYLE_GLSL}
float wrStarve(vec4 s, float v, float z) {
  float m = 1. - step(.003, abs(v - s.x));
  return ${STARVE_CEIL.toFixed(2)} * m * s.w * clamp((s.y - z) / 150., 0., 1.) * step(s.z, z);
}
void main() {
  float zc = vB.x, w = vB.y - uQuake.x;
  if (vB.w < .05) discard;
  // the same pigment the sheet's own edge is drawn in (see CURTAIN_FRAG): wet, heavy, browning with age, starving in dashes
  float heavy = clamp(3. * vB.z * wrEnv(w, uQuake.z, uQuake.w * .5) * (1. - smoothstep(uQuake.z + 4., uQuake.z + 12., w)), 0., 1.);
  float isDry = (1. - step(.003, abs(vRow.y - uDry.x))) * uDry.w;
  float dry = isDry * step(uDry.z, zc) * (1. - smoothstep(uDry.y - 36., uDry.y, zc));
  float st = max(max(wrStarve(uStarveA, vRow.y, zc), wrStarve(uStarveB, vRow.y, zc)), dry);
  if (wrVNoise(vec2((zc - uScroll) * .9, 3.7 + vRow.x)) < st * 1.2 - .06) discard;
  float rn = abs(vRow.x - cameraPosition.x) / 14.;
  float za = (zc + 16. * rn) * (1. - .8 * heavy);
  float isT = step(.5, vRow.z) * (1. - step(1.5, vRow.z));
  float wet = max(1. - smoothstep(mix(18., 70., isT), mix(42., 140., isT), zc), heavy);
  vec3 cv = mix(mix(uInkV, uPlum, smoothstep(40., 150., za)), uSepia, smoothstep(140., 300., za));
  vec3 ct = mix(uInkT, uSepia, .45 * smoothstep(200., 700., za));
  vec3 cr = mix(uInkR, uSepia, .5 * smoothstep(250., 800., za));
  vec3 ic = mix(mix(cv, ct, isT), cr, step(1.5, vRow.z));
  ic *= mix(1., .7, wet);
  ic = mix(ic, uStraw, smoothstep(1300., 1520., zc));
  gl_FragColor = vec4(ic, 1.);
}`;
// sections as for curtainGeometry; rows as for curtainMesh
export function ribbonMesh(uniforms, sections, rows, rowData) {
  const cols = [];
  let z = 0;
  for (const [n, sp] of sections) { for (let k = 0; k < n; k++) cols.push([z + k * sp, sp]); z += n * sp; }
  const pos = new Float32Array(cols.length * 6), idx = [];
  cols.forEach((c, i) => { pos.set([c[0], -1, c[1], c[0], 1, c[1]], i * 6); });
  for (let i = 0; i < cols.length - 1; i++) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  instanceRows(g, rows, rowData);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// The material every curtain wears. uniforms: the object from makeStyleUniforms (shared, not cloned).
export function curtainMaterial(uniforms) {
  return new THREE.ShaderMaterial({ uniforms, vertexShader: CURTAIN_VERT, fragmentShader: CURTAIN_FRAG, side: THREE.DoubleSide, alphaToCoverage: true });
}
// One strip: sections = [[columns, spacing m], ...] (spacings powers of two so columns ride the paper); levels = heights (m) of the
// rows of vertices between foot and trace (needed where a sheet is tall enough for the arm's arc to show).
export function curtainGeometry(sections, levels = []) {
  const lv = [0, ...levels, 1e4], segs = lv.length - 1;
  const cols = [[0, 0]];
  let z = 0;
  for (const [n, sp] of sections) { for (let k = 0; k < n; k++) cols.push([z + k * sp, sp]); z += n * sp; }
  const pos = new Float32Array(cols.length * (segs + 1) * 3), idx = [];
  cols.forEach((c, i) => { for (let s = 0; s <= segs; s++) pos.set([c[0], lv[s], c[1]], (i * (segs + 1) + s) * 3); });
  for (let i = 0; i < cols.length - 1; i++) for (let s = 0; s < segs; s++) {
    const a = i * (segs + 1) + s, b = a + segs + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
// rows: array of row indices 0..139. Returns a Mesh drawing those rows with the given strip.
export function curtainMesh(geometry, material, rows, rowData) {
  const n = rows.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n), l = new Float32Array(n * 4);
  rows.forEach((r, i) => { a.set(rowData[r].row, i * 4); b.set(rowData[r].row2, i * 4); c[i] = rowData[r].ink; l.set(rowData[r].lev, i * 4); });
  geometry.setAttribute('aLev', new THREE.InstancedBufferAttribute(l, 4));
  geometry.setAttribute('aRow', new THREE.InstancedBufferAttribute(a, 4));
  geometry.setAttribute('aRow2', new THREE.InstancedBufferAttribute(b, 4));
  geometry.setAttribute('aInk', new THREE.InstancedBufferAttribute(c, 1));
  geometry.instanceCount = n;
  const m = new THREE.Mesh(geometry, material);
  m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------ the sheet: floor, drum and vault are one chart
// Geometry needs an attribute aS: metres along the paper, growing downstream (on the floor aS = z).
// Its rulings ride the paper; lines along the stream stand at every row foot and every gap centre.
export function sheetMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute float aS; varying vec3 vW; varying float vS;
void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vS = aS; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
varying vec3 vW; varying float vS;
${STYLE_GLSL}
void main() {
  float hd = length(vW - uHole.xyz);
  if (hd < uHole.w) discard;
  // the punch drew the paper in: within 60 m of the hole the chart is pulled toward it, so its rulings bend in and crowd at the lip
  float hon = step(.5, uHole.w);
  float holeS = -100. - 300. * asin(clamp((-100. - uHole.z) / 300., -1., 1.));      // where the hole lies along the paper (the drum: z -100, radius 300)
  vec2 hv = vec2(vW.x - uHole.x, vS - holeS);
  float hl = max(length(hv), 1e-3), hr = max(hl - uHole.w, 0.);
  float pull = hon * 26. * (1. - exp(-hr / 9.)) * exp(-hr / 45.);
  vec2 pc = vec2(uHole.x, holeS) + hv * (1. + pull / hl);                             // where this point of paper lay on the chart before the punch
  float px = mix(vW.x, pc.x, hon), ps = mix(vS, pc.y, hon);
  float rec = ps - uScroll;
  float fx = max(fwidth(px), 1e-4), fs = max(fwidth(ps), 1e-4);
  float near = 1. - smoothstep(.02, .09, max(fx, fs));
  float hy = clamp(vW.y / 600., 0., 1.), ageZ = wrPaperAge(max(vW.z, 0.), 0.);      // height as a share of the vault's 600 m; the age the floor has this far downstream
  float age = ageZ * (1. - hy);      // yellowing belongs to the floor, which carries the record away: full on the floor, none at the vault, the unwritten supply, which keeps the sheet's colour all the way; the walls that close the world grade from the floor's straw at their feet up to the vault
  vec3 paper = wrPaper(age);
  // the cross-rulings are arcs, lane by lane, because a pen swings on an arm (a lane is the 14 m between two rows' feet)
  float lx = (fract(px / 14.) - .5) * 14.;
  float arcC = rec - (12.5 - sqrt(max(156.25 - lx * lx, 0.)));
  float fa = max(fwidth(arcC), 1e-4);
  fa = mix(fa, fs, step(4. * fs + .5, fa));     // the seam between two lanes: no derivative spike
  float pr = max(wrRule(px, 7., .12, fx), wrRule(arcC, 20., .2, fa));
  pr = max(pr, max(wrRule(rec, 102.4, .34, fs), wrRule(px, 1.75, .05, fx) * .7));
  pr = max(pr, wrRule(arcC, 4., .05, fa) * .7);
  pr = max(pr, max(wrRule(px, 56., .5, fx), wrRule(rec + 30., 51.2, .5, fs)) * .8);   // the heavy rulings: they carry the print to the vault and up the drum
  paper = mix(paper, mix(uPrint, mix(wrPaper(age), uStraw, 1. - hy), ageZ * .75), pr * .9);      // the print pales downstream toward its own paper: the straw on the floor, the fresh sheet on the vault
  float fib = wrVNoise(vec2(rec * 1.3, vW.x * 34.)) + wrVNoise(vec2(rec * 21., vW.x * 2.5)) - 1.;
  paper *= 1. - .05 * fib * near;
  float fox = smoothstep(.80, .87, wrVNoise(vec2(rec, vW.x) * 2.3)) * smoothstep(.45, .75, wrVNoise(vec2(rec, vW.x) * .13)) * uFox;
  paper = mix(paper, uSepia, .3 * fox * (1. - smoothstep(.06, .25, max(fx, fs))));
  // the punch's dimple: three flat steps of tone, each darker toward the bruised lip, each with a drawn edge a pixel or two wide
  // (never a soft band); their edges wander round the hole and breathe as the sheet passes over the drum
  float ang = atan(hv.x + 1e-3, hv.y);
  float fh = max(fwidth(hl), 1e-4) * .75;
  float w1 = 2.2 * sin(ang * 5. + 1.) + 1.1 * sin(ang * 9. - uTime * .35);
  float w2 = 3.6 * sin(ang * 4. + 2.7) + 1.6 * sin(ang * 7. + uTime * .3);
  float w3 = 5.5 * sin(ang * 3. + 4.1) + 2.4 * sin(ang * 6. - uTime * .25);
  float e1 = 8. * (1. + .09 * sin(uTime * .9)) + w1, e2 = 22. * (1. + .07 * sin(uTime * .9 - 1.1)) + w2, e3 = 46. * (1. + .05 * sin(uTime * .9 - 2.2)) + w3;
  float e4 = 78. + 1.5 * w3 + 3. * sin(uTime * .9 - 3.3);
  float lvl = (1. - smoothstep(e1 - fh, e1 + fh, hr)) + (1. - smoothstep(e2 - fh, e2 + fh, hr)) + (1. - smoothstep(e3 - fh, e3 + fh, hr)) + .7 * (1. - smoothstep(e4 - fh, e4 + fh, hr));
  paper = mix(paper, mix(uShade, uSepia, .22), hon * .27 * lvl);
  paper = mix(paper, mix(uShade, uSepia, .3), (1. - smoothstep(1.4 - fh, 1.4 + fh, hr)) * hon);   // the bruised lip of the hole
  gl_FragColor = vec4(paper, 1.);
}`,
  });
}

// ------------------------------------------------------------------ the instrument: blued steel and brass, flat tints
// mode 'arm' bends an instanced tube from its pivot to the nib height; 'nib' carries an instanced nib to the trace;
// 'static' is for beams, the ink car, the eyelet. Geometry attributes: position, normal, aTone
// (0 steel, 1 brass, 2 glass holding ink, 3 riveted girder steel, 4 ink).
const INSTR_COMMON_V = /* glsl */`
attribute float aTone;
varying vec3 vN; varying vec3 vO; varying vec4 vT;   // vT: tone, ink index, ink level, bulb y
${STYLE_GLSL}
`;
const INSTR_FRAG = /* glsl */`
varying vec3 vN; varying vec3 vO; varying vec4 vT;
${STYLE_GLSL}
void main() {
  vec3 n = vN / max(length(vN), 1e-4);
  float tone = vT.x;
  float t5 = step(4.5, tone) * (1. - step(5.5, tone)), t6 = step(5.5, tone);      // a paler turned band of brass; a knurled blued ring
  vec3 metal = mix(uSteel, uBrass, max(step(.5, tone) * (1. - step(1.5, tone)), t5));
  // a drawn highlight and a drawn underside: two flat tints of the same pigment, fixed to the object, not light
  float hi = step(.72, n.y), lo = step(n.y, -.6);
  float isBr = max(step(.5, tone) * (1. - step(1.5, tone)), t5);
  vec3 col = mix(metal, min(metal * mix(1.75, 1.22, isBr) + mix(.03, 0., isBr), vec3(1.)), hi) * (1. - .2 * lo);
  // girder: brass rivets every 2 m, drawn in metres
  float fx = max(fwidth(vO.x), 1e-4);
  float side = step(abs(n.y), .5);                          // the web's faces; the flanges are riveted too, seen from below
  vec2 rp = vec2(fract(vO.x / 2.) * 2. - 1., (fract(mix(vO.z, vO.y, side) / 1.5 + .5) - .5) * 1.5);
  float riv = 1. - smoothstep(.27 - fx, .27 + fx, length(rp));
  riv = mix(riv, .1, smoothstep(.35, 1., fx));
  // splice plates at every saddle (14 m): a paler blued strap with its own rivets
  float sx = abs(fract(vO.x / 14. + .5) - .5) * 14.;
  float strap = 1. - smoothstep(1.1 - fx, 1.1 + fx, sx);
  strap = mix(strap, .16, smoothstep(1., 3., fx));
  float girder = step(2.5, tone) * (1. - step(3.5, tone));
  // the long girder is a box of plate with lightening holes, two to a bay, flanged in brass: the ruled vault shows through them
  float gh = girder * step(100., vO.y), horiz = step(.5, abs(n.y));
  // the bridge (up): every fragment of the girder's steel that lies over the top of the girder's top flange, which is the bridge
  // plate's two faces and two ends, in courses the web's depth, and all six faces of the cap flange on it. The holes, their rims and
  // their far-off paling stay on the girder's own course (lc: its holed web and its two flanges). The bridge's upright faces carry
  // rows of the same rivets .75 m either side of each course joint and none between: a double seam at each joint within the bridge
  // plate, one row over its foot, one under the cap and one along the cap's edge. A seam's band is the 1.5 m either side of its joint,
  // taken as the share of it under the pixel (sb: metres of band below each end of the pixel's reach), so far off a seam is its flat average
  float up = gh * step(${(BRIDGE.foot + 0.001).toFixed(3)}, vO.y), lc = gh - up;
  // the bridge is one flat pigment on every face: it takes neither the paler tint of faces that look up nor the darker tint of
  // undersides, so the cap's top and its underside are the bridge plate's steel; its straps and rivets are drawn on that below
  col = mix(col, metal, up);
  float cj = (fract((vO.y - ${BRIDGE.foot.toFixed(2)}) / ${BRIDGE.web.toFixed(1)} + .5) - .5) * ${BRIDGE.web.toFixed(1)}, fy = max(fwidth(vO.y), 1e-3);
  vec2 sb = vO.y - ${(BRIDGE.foot - 1.5).toFixed(2)} + vec2(-.5, .5) * fy, sk = floor(sb / ${BRIDGE.web.toFixed(1)});
  sb = 3. * sk + min(sb - ${BRIDGE.web.toFixed(1)} * sk, 3.);
  float seam = 1. - smoothstep(.27 - fx, .27 + fx, length(vec2(rp.x, abs(cj) - .75)));
  seam = mix(seam, .1, smoothstep(.35, 1., fx)) * clamp((sb.y - sb.x) / fy, 0., 1.);
  vec2 hq = vec2((fract(vO.x / 7.) - .5) * 7., mix(vO.y - ${(WR.longArm.py + WR.bulbLift + 5.7).toFixed(1)}, vO.z - ${WR.longArm.pz.toFixed(1)}, horiz));
  float hdist = length(max(abs(hq) - mix(vec2(1.5, 1.7), vec2(1.5, .55), horiz), 0.)) - .7;
  if (lc > .5 && hdist < 0. && fx < .45) discard;
  riv *= mix(1., mix(step(3.3, abs(hq.y)), step(1.95, abs(hq.y)), horiz), gh);      // the girder's own rivets: on upright faces only above and below its holed web's holes (its flanges' edges, the web's two edges), on flat faces only outside the slots
  riv = mix(riv, seam, up * (1. - horiz));                  // the bridge's upright faces take the seams in their place; the cap's flat faces keep the flanges' rule
  col = mix(col, min(uSteel * 1.55 + .02, vec3(1.)), strap * girder * .9);
  col = mix(col, uBrass, riv * girder);
  col = mix(col, uBrass, lc * (1. - smoothstep(.15 - fx, .15 + fx, abs(hdist - .14))) * (1. - smoothstep(.3, .7, fx)));      // the holes' rolled rims
  col = mix(col, uPaper * .94, lc * .85 * mix(step(hdist, 0.), .22, smoothstep(.8, 2., fx)) * smoothstep(.3, .45, fx));     // far off: pale ovals, then their flat average
  col = mix(col, min(uBrass * 1.3, vec3(1.)), t5);
  float kn = step(.5, fract(atan(vO.z, vO.y + 1e-4) * 5.1 + vO.x * 1.3));
  col = mix(col, mix(uSteel * .78, min(uSteel * 1.6 + .02, vec3(1.)), mix(kn, .45, smoothstep(.12, .4, fx))), t6);
  // an arm is a riveted tube: four seams of brass rivets every 1.2 m along it, drawn in metres
  float seamD = length(vec2((fract(vO.x / 1.2) - .5) * 1.2, min(abs(vO.y), abs(vO.z))));
  float srv = 1. - smoothstep(.1 - fx, .1 + fx, seamD);
  srv = mix(srv, .03, smoothstep(.08, .3, fx));
  col = mix(col, uBrass, srv * step(6.5, vT.z) * step(tone, .5));
  // glass bulb: its own ink below the level, pale glass above, a cream glint
  vec3 ink = mix(mix(uInkV, uInkT, step(.5, vT.y) * (1. - step(1.5, vT.y))), uInkR, step(1.5, vT.y));
  vec3 glass = mix(uPaper, uSteel, .2);
  float lvl = vT.z + .04 * sin(vO.z * 5. + uTime * 3.) ;
  vec3 bulb = mix(glass, ink, step(vT.w, lvl));
  bulb = mix(bulb, uPaper, step(.55, n.y) * step(n.x, -.25) * step(-.75, n.x) * .85);
  col = mix(col, bulb, step(1.5, tone) * (1. - step(2.5, tone)));
  col = mix(col, ink, step(3.5, tone) * (1. - step(4.5, tone)));
  gl_FragColor = vec4(col, 1.);
}`;
const ARM_VERT = INSTR_COMMON_V + /* glsl */`
attribute vec4 aRow; attribute vec4 aRow2; attribute vec4 aLev; attribute float aInk;
void main() {
  float L = aRow2.z, py = aRow2.w;
  float h = wrHeight(aRow, aRow2, 0.);
  float vel = (h - wrHeight(aRow, aRow2, 3.)) / .15;
  float lift = ${WR.bulbLift.toFixed(1)};
  vec3 P = vec3(0., py + lift, -sqrt(max(L * L - py * py, 0.)));
  vec3 T = vec3(0., h + lift, wrLean(h, aLev, L, py));
  vec3 dir = (T - P) / max(length(T - P), 1e-3);
  vec3 n2 = vec3(0., dir.z, -dir.y);
  float t = position.z, tc = clamp(t, 0., 1.);
  float fat = mix(1., mix(2.2, 1., smoothstep(0., .9, tc)), step(150., L));
  // the two arms beside the route are the heaviest of the instrument: they stay stout to within a few metres of the nib
  float isF = max(1. - step(.5, abs(aRow.x - uCap.x)), 1. - step(.5, abs(aRow.x - uCap.y)));
  fat *= 1. + isF * .7 * smoothstep(.08, .45, tc) * (1. - .93 * smoothstep(.8, .965, tc));   // (and fine again at the nib: the bulb is not hidden by its own arm)
  float flex = clamp(vel * .012, -1., 1.) * L * .014 * sin(3.14159 * tc);
  // far off a long arm never thins below four pixels (a short one three), and beyond 700 m the arms close up into one flat
  // blued band: never stripes and dots
  vec3 ctr = P + dir * (t * L) + vec3(aRow.x, 0., 0.);
  float vd = length((modelViewMatrix * vec4(ctr, 1.)).xyz);
  float rmin = vd * mix(.0036, .0056, step(150., L)) + 7. * smoothstep(650., 1100., vd);
  fat *= clamp(rmin / max(length(position.xy) * fat, 1e-3), 1., 60.);
  vec3 p = P + dir * (t * L) + vec3(position.x * fat, 0., 0.) + n2 * (position.y * fat - flex);
  vN = vec3(normal.x, normal.y * dir.z, -normal.y * dir.y);
  vO = vec3(t * L, position.y * fat, position.x * fat); vT = vec4(aTone, aInk, 7., 0.);   // vT.z 7 marks an arm (it holds no ink)
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p.x + aRow.x, p.y, p.z, 1.);
}`;
const NIB_VERT = INSTR_COMMON_V + /* glsl */`
attribute vec4 aRow; attribute vec4 aRow2; attribute vec4 aLev; attribute float aInk;
void main() {
  float h = wrHeight(aRow, aRow2, 0.);
  vec3 T = vec3(aRow.x, h, wrLean(h, aLev, aRow2.z, aRow2.w));
  vN = normal; vO = position;
  float lvl = mix(-.75, .8, fract(aRow.w * 7.31 - uTime * .011));
  vT = vec4(aTone, aInk, lvl, (position.y - ${WR.bulbLift.toFixed(1)}) / .6);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + T, 1.);
}`;
const STATIC_VERT = INSTR_COMMON_V + /* glsl */`
uniform vec4 uInstr;   // ink index, ink level, 0, 0 for this object
void main() {
  vN = normal; vO = position; vT = vec4(aTone, uInstr.x, uInstr.y, position.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;
export function instrumentMaterial(uniforms, mode = 'static') {
  const u = mode === 'static' ? { ...uniforms, uInstr: { value: new THREE.Vector4(1, 0.2, 0, 0) } } : uniforms;
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: mode === 'arm' ? ARM_VERT : mode === 'nib' ? NIB_VERT : STATIC_VERT, fragmentShader: INSTR_FRAG });
}

// ------------------------------------------------------------------ geometry of the instrument
export const toned = (g, t, m) => {
  if (m) g.applyMatrix4(m);
  g.deleteAttribute('uv');
  g.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(t), 1));
  return g;
};
export const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

// An arm in its own frame: position = (offset along x, offset along the arm's normal, t along the arm 0 pivot .. 1 nib).
function armGeometry(sides, lod, L) {
  // [t0, r0, t1, r1, tone, subdivisions]; m = metres along the arm
  const m = (d) => d / L, fatk = L > 150 ? 2.2 : 1;
  const S = lod ? [
    [m(-3.2), 1.2, m(-1.2), 1.2, 1, 1], [m(-1.2), 0.75, 0.5, 0.5, 0, 1], [0.5, 0.5, 0.985, 0.25, 0, 1],
  ] : [
    // the counterweight, made as the nib is made: a steel rod and brass lock nut through the back, a turned brass weight with a paler
    // band at each shoulder (tone 5) and a knurled blued clamp ring round its middle (tone 6), then the neck and the brass saddle collar
    ...(L > 150 ? [[m(-4.75 * fatk), 0.2, m(-4.4 * fatk), 0.2, 0, 1], [m(-4.4 * fatk), 0.46, m(-4.15 * fatk), 0.46, 1, 1], [m(-4.15 * fatk), 0.2, m(-3.5 * fatk), 0.2, 0, 1],
      [m(-3.5 * fatk), 0.95, m(-3.25 * fatk), 1.25, 5, 1], [m(-3.25 * fatk), 1.25, m(-2.62 * fatk), 1.25, 1, 1], [m(-2.62 * fatk), 1.37, m(-2.2 * fatk), 1.37, 6, 1],
      [m(-2.2 * fatk), 1.25, m(-1.55 * fatk), 1.25, 1, 1], [m(-1.55 * fatk), 1.25, m(-1.3 * fatk), 0.95, 5, 1]] : [[m(-3.4 * fatk), 1.25, m(-1.3 * fatk), 1.25, 1, 1]]),
    [m(-1.3 * fatk), 0.7, m(-0.9), 0.7, 0, 1], [m(-0.9), 1.5, m(0.9), 1.5, 1, 1],
    ...(L > 150 ? [[m(0.9), 0.8, 0.07, 0.76, 0, 1], [0.07, 0.95, 0.07 + m(1.6), 0.95, 1, 1], [0.07 + m(1.6), 0.75, 0.14, 0.72, 0, 1], [0.14, 0.9, 0.14 + m(1.4), 0.9, 1, 1],
      [0.14 + m(1.4), 0.71, 0.22, 0.67, 0, 1], [0.22, 0.86, 0.22 + m(1.2), 0.86, 1, 1], [0.22 + m(1.2), 0.66, 0.3, 0.62, 0, 1]] : [[m(0.9), 0.8, 0.3, 0.62, 0, 2]]),
    [0.3, 0.84, 0.3 + m(0.7), 0.84, 1, 1], [0.3 + m(0.7), 0.6, 0.64, 0.42, 0, 2],
    [0.64, 0.62, 0.64 + m(0.6), 0.62, 1, 1], [0.64 + m(0.6), 0.41, 1 - m(2.6), 0.25, 0, 2], [1 - m(2.6), 0.36, 1 - m(1.7), 0.31, 1, 1], [1 - m(1.7), 0.22, 1 - m(1.05), 0.2, 0, 1],
  ];
  const pos = [], nor = [], tone = [], idx = [];
  const ring = (t, r, tn) => { for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2; pos.push(Math.cos(a) * r, Math.sin(a) * r, t); nor.push(Math.cos(a), Math.sin(a), 0); tone.push(tn); } return pos.length / 3 - sides; };
  const band = (a, b) => { for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; idx.push(a + k, b + k, a + k1, a + k1, b + k, b + k1); } };
  let last = null;
  for (const [t0, r0, t1, r1, tn, sub] of S) {
    if (last && !lod) { const wt = last[1] > r0 ? last[2] : tn; band(ring(last[0], last[1], wt), ring(t0, r0, wt)); }   // washer between two diameters
    last = [t1, r1, tn];
    let prev = ring(t0, r0, tn);
    for (let s = 1; s <= sub; s++) { const f = s / sub; const cur = ring(t0 + (t1 - t0) * f, r0 + (r1 - r0) * f, tn); band(prev, cur); prev = cur; }
  }
  // end caps of the counterweight and collars read as discs: close the weight's back
  const c = ring(S[0][0], 0.001, S[0][4]), w0 = 0; band(c, w0);
  if (!lod && L > 150) {
    // the pivot pin through the saddle collar (a steel pin with brass heads, across the arm) and the clamp ring's screw: small cylinders
    // in the arm's own frame (x across, y along its normal, z = t along it)
    const cyl = (axis, c0, c1, r, tn, at) => {      // axis 0: along x from c0 to c1 at (y 0, t at); axis 1: along y from c0 to c1 at (x 0, t at)
      const n = 8, base = pos.length / 3;
      for (let e = 0; e < 2; e++) for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a), cc = e ? c1 : c0;
        if (axis === 0) { pos.push(cc, cs * r, at + sn * r * fatk / L); nor.push(0, cs, 0); } else { pos.push(cs * r, cc, at + sn * r * fatk / L); nor.push(cs, 0.3, 0); }
        tone.push(tn);
      }
      for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; idx.push(base + k, base + n + k, base + k1, base + k1, base + n + k, base + n + k1); }
      const cap = pos.length / 3; pos.push(axis === 0 ? c1 : 0, axis === 0 ? 0 : c1, at); nor.push(axis === 0 ? 0.6 : 0, 1, 0); tone.push(tn);
      for (let k = 0; k < n; k++) idx.push(base + n + k, cap, base + n + (k + 1) % n);
    };
    cyl(0, -1.95, 1.95, 0.24, 0, 0); cyl(0, 1.5, 1.95, 0.4, 1, 0); cyl(0, -1.5, -1.95, 0.4, 1, 0);
    cyl(1, 1.3, 1.85, 0.2, 0, m(-2.41 * fatk)); cyl(1, 1.78, 1.98, 0.34, 1, m(-2.41 * fatk));
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 1));
  g.setIndex(idx);
  return g;
}

// A nib: origin at the writing point, upright. Glass bulb 1.2 m across at y 1.6, brass band, cap and filler neck, yoke to the arm, siphon down to the point.
function nibGeometry(lod) {
  const L = WR.bulbLift, parts = [];
  parts.push(toned(new THREE.SphereGeometry(0.6, lod ? 6 : 28, lod ? 4 : 18), 2, M4(0, L, 0)));
  if (!lod) {
    parts.push(toned(new THREE.CylinderGeometry(0.64, 0.64, 0.13, 28, 1, true), 1, M4(0, L, 0)));                 // equator band
    parts.push(toned(new THREE.CylinderGeometry(0.17, 0.33, 0.26, 20, 1, false), 1, M4(0, L + 0.64, 0)));          // cap
    parts.push(toned(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8, 1, false), 0, M4(0, L + 0.84, 0)));               // filler neck
    parts.push(toned(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 16, 1, false), 1, M4(0, L + 0.96, 0)));             // stopper
    parts.push(toned(new THREE.CylinderGeometry(0.36, 0.3, 0.5, 20, 1, false), 1, M4(0, L, -0.84, Math.PI / 2)));  // yoke to the arm
    parts.push(toned(new THREE.CylinderGeometry(0.12, 0.22, 0.26, 8, 1, true), 1, M4(0, L - 0.68, 0)));            // gland under the bulb
    const blade = new THREE.ConeGeometry(0.13, 0.4, 4, 1, false); blade.scale(1.5, 1, 0.4);
    parts.push(toned(blade, 1, M4(0, 0.2, 0.05, Math.PI)));                                                         // the nib itself, a brass blade
    parts.push(toned(new THREE.SphereGeometry(0.1, 6, 4), 4, M4(0, 0.06, 0.03)));                                    // the drop of ink on it
  }
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, L - 0.62, 0), new THREE.Vector3(0, L - 1.0, 0.16), new THREE.Vector3(0, 0.34, 0.2), new THREE.Vector3(0, 0.1, 0.07), new THREE.Vector3(0, 0, 0)]);
  const tube = new THREE.TubeGeometry(curve, lod ? 3 : 8, 0.085, lod ? 3 : 6, false);
  // taper the siphon to a point
  const p = tube.attributes.position, n = tube.attributes.normal;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) + n.getY(i) * -0.085, f = 0.25 + 0.75 * Math.min(1, Math.max(0, y / (L - 0.62))); p.setXYZ(i, p.getX(i) - n.getX(i) * 0.085 * (1 - f), p.getY(i) - n.getY(i) * 0.085 * (1 - f), p.getZ(i) - n.getZ(i) * 0.085 * (1 - f)); }
  parts.push(toned(tube, 1));
  const m = mergeGeometries(parts);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', m.attributes.position); g.setAttribute('normal', m.attributes.normal); g.setAttribute('aTone', m.attributes.aTone);
  g.setIndex(m.index);
  return g;
}

function instanceRows(g, rows, rowData) {
  const n = rows.length, a = new Float32Array(n * 4), b = new Float32Array(n * 4), c = new Float32Array(n), l = new Float32Array(n * 4);
  rows.forEach((r, i) => { a.set(rowData[r].row, i * 4); b.set(rowData[r].row2, i * 4); c[i] = rowData[r].ink; l.set(rowData[r].lev, i * 4); });
  g.setAttribute('aLev', new THREE.InstancedBufferAttribute(l, 4));
  g.setAttribute('aRow', new THREE.InstancedBufferAttribute(a, 4));
  g.setAttribute('aRow2', new THREE.InstancedBufferAttribute(b, 4));
  g.setAttribute('aInk', new THREE.InstancedBufferAttribute(c, 1));
  g.instanceCount = n;
  return g;
}

// A beam: a riveted box girder along x with brass pivot saddles every 14 m, from xa to xb at (y, z).
function beamGeometry(xa, xb, y, z, hgt, wid, lift) {
  const len = xb - xa, cx = (xa + xb) / 2, parts = [];
  const yy = y + lift + hgt * 0.5 + 1.2;
  parts.push(toned(new THREE.BoxGeometry(len, hgt, wid), 3, M4(cx, yy, z)));
  parts.push(toned(new THREE.BoxGeometry(len, hgt * 0.16, wid * 1.5), 3, M4(cx, yy + hgt * 0.58, z)));
  parts.push(toned(new THREE.BoxGeometry(len, hgt * 0.16, wid * 1.5), 3, M4(cx, yy - hgt * 0.58, z)));
  return mergeGeometries(parts);
}

// The recorder's bridge, along x from xa to xb over the long girder at z: an upper web of solid plate WR.bridge metres tall, as
// thick as the girder's web, standing on its top flange, and on it a cap flange of the girder's flanges' own size; the girder's own
// steel (tone 3). The plate is its two faces and its two ends: it stands open on the flange and under its cap, so that no face of
// it lies in the plane of another (a box's faces come in the order +x, -x, +y, -y, +z, -z: the third and fourth are left out).
function bridgeGeometry(xa, xb, z) {
  const len = xb - xa, cx = (xa + xb) / 2, B = BRIDGE, plate = new THREE.BoxGeometry(len, WR.bridge, B.wid);
  plate.setIndex(plate.groups.filter((f) => f.materialIndex !== 2 && f.materialIndex !== 3).flatMap((f) => Array.from(plate.index.array.slice(f.start, f.start + f.count))));
  const cap = new THREE.BoxGeometry(len, B.flange, B.wid * 1.5);
  return mergeGeometries([toned(plate, 3, M4(cx, B.foot + WR.bridge * 0.5, z)), toned(cap, 3, M4(cx, B.top + B.flange * 0.5, z))]);
}

// The ink car: a brass tank 3 m long slung under its rail, glass gauge, four wheels, filler dome. Origin at the rail, x along the rail.
export function inkCarGeometry() {
  const parts = [], H = Math.PI / 2;
  parts.push(toned(new THREE.CylinderGeometry(0.72, 0.72, 2.3, 12, 1, true), 1, M4(0, -1.55, 0, 0, 0, H)));
  parts.push(toned(new THREE.SphereGeometry(0.72, 12, 5, 0, Math.PI * 2, 0, H), 1, M4(1.15, -1.55, 0, 0, 0, -H)));
  parts.push(toned(new THREE.SphereGeometry(0.72, 12, 5, 0, Math.PI * 2, 0, H), 1, M4(-1.15, -1.55, 0, 0, 0, H)));
  for (const sx of [-0.8, 0, 0.8]) parts.push(toned(new THREE.CylinderGeometry(0.76, 0.76, 0.1, 12, 1, true), 0, M4(sx, -1.55, 0, 0, 0, H)));
  parts.push(toned(new THREE.CylinderGeometry(0.22, 0.3, 0.3, 8), 1, M4(0.55, -0.72, 0)));
  parts.push(toned(new THREE.CylinderGeometry(0.11, 0.11, 1.15, 6), 2, M4(-0.35, -1.5, 0.78)));          // glass gauge
  for (const sy of [-0.9, -2.1]) parts.push(toned(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 6), 1, M4(-0.35, sy, 0.78)));
  for (const sx of [-0.95, 0.95]) {
    parts.push(toned(new THREE.BoxGeometry(0.14, 1.0, 0.5), 0, M4(sx, -0.42, 0)));                        // hangers
    for (const sz of [-0.32, 0.32]) parts.push(toned(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10), 1, M4(sx, 0.12, sz, H)));
  }
  parts.push(toned(new THREE.BoxGeometry(0.5, 0.3, 0.9), 0, M4(0, -2.35, 0.25)));                         // spout knuckle
  return mergeGeometries(parts);
}

// ------------------------------------------------------------------ the hero
const STOCKS = {
  cream: null,
  buff: ['#E9D9B4', '#D2B67C', '#C99A7E', '#2B2A33', '#8A4B2A', '#1F2C44', '#C8281E'],
  ledger: ['#DCE3E6', '#BEB698', '#93A3AD', '#0F4A32', '#5F5D27', '#1F2C44', '#C8281E'],   // aged ledger stock is a foxed grey-buff; the green ink as dark as the violet
};
const SHOCKS = {
  sharp: { q: [19, 300, 10, 0.45], f: [0.3, 0.8, 1.7, 1] },        // one range, 300 m, fins about 67 m apart
  swarm: { q: [19, 190, 12, 0.5], f: [0.1, 0.5, 1.3, 1.2] },        // three ranges in quick succession
  giant: { q: [19, 300, 10, 0.42], f: [0.2, 0.45, 1.0, 0.7] },      // fewer, broader fins
};
// heights (m) at which each class of sheet has a row of vertices, and the knots of its lean (see wrLean)
export const LEVELS = [
  { levels: [], knots: [70, 71, 72, 73] }, { levels: [45, 105, 190], knots: [45, 105, 190, 330] },
  { levels: [120], knots: [120, 300, 301, 302] }, { levels: [], knots: [110, 111, 112, 113] },
];
const CAR_ROWS = [66, 63, 65, 61, 64, 62], CAR_PERIOD = 9, CAR_FILL = 1.6;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('written-range-hero') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  // seeded variations (each can be forced through opts)
  const stock = opts.stock ?? rng.pick(['cream', 'cream', 'buff', 'ledger']);
  const record = opts.record ?? rng.pick(['calm', 'calm', 'storm', 'spring']);
  const shock = opts.shock ?? rng.pick(['sharp', 'sharp', 'swarm', 'giant']);
  const hour = opts.hour ?? 'day';
  const density = opts.density ?? rng.range(0.7, 1.3);
  const palette = STOCKS[stock] || opts.palette || WR_PALETTE;
  const U = makeStyleUniforms(palette);
  if (!STOCKS[stock] && palette[3].toUpperCase() === '#5B2A8C') U.uThread.value = lin('#B79BE0');
  U.uFox.value = hour === 'night' ? 1 : 0;
  if (hour === 'golden' || hour === 'night') U.uPaper.value = U.uPaper.value.clone().lerp(U.uStraw.value, hour === 'night' ? 0.36 : 0.26);   // the world browns the straw behind it, so the step stays
  U.uQuake.value.fromArray(SHOCKS[shock].q); U.uQuakeF.value.fromArray(SHOCKS[shock].f);
  rng.chance(0.5);   // (the draw is kept so every later one is as it was)
  // east rows write their peaks first: the ridge then stands slantwise across the valley, broadside to the eye coming up from the south-west
  const lead = -1;

  // rows
  const Ls = Math.hypot(WR.shortArm.py, WR.shortArm.pz), Ll = Math.hypot(WR.longArm.py, WR.longArm.pz);
  const rowData = [], phase0 = rng(), q12 = (i) => (lead > 0 ? i - 67 : 78 - i);
  for (let i = 0; i < WR.rows; i++) {
    const cls = rowClass(i), x = rowX(i), long = cls === 1 || cls === 2;
    let delay = -1, gain = 0;
    if (cls === 1) {
      const q = q12(i);
      delay = rng.range(0, 0.25);                                   // all twelve go up together
      gain = (0.72 + 0.28 * Math.sin((q + 0.5) / 12 * Math.PI)) * rng.range(0.9, 1.06);
      // the range steps up away from the gap we fly (x 42): rank behind rank, so the stack is seen from inside it
      const dg = Math.abs(x - (opts.gapX ?? 42));
      gain *= dg < 10 ? 1 : dg < 24 ? 0.4 : dg < 38 ? 0.62 : dg < 52 ? 0.84 : 1;
    }
    rowData.push({
      x, cls, row: [x, (i + 0.5) / WR.rows, cls, cls === 1 ? phase0 - q12(i) * 1.2 * SHOCKS[shock].f[0] + rng.range(-0.05, 0.05) : rng()],   // each row's peaks 24 m behind its neighbour's
      row2: [delay, gain, long ? Ll : Ls, long ? WR.longArm.py : WR.shortArm.py],
      ink: cls === 0 || cls === 3 ? 1 : x === 49 ? 2 : 0, lev: LEVELS[cls].knots,
    });
  }
  await ctx.yield();
  const rec = await makeRecord(ctx, rng.fork ? rng.fork('record') : rng, {
    storm: record === 'storm', spring: record === 'spring', oldGain: 0.85 + 0.3 * rng(), blots: density,
  });
  U.uRec.value = rec.texture;
  await ctx.yield();

  const object = new THREE.Group();
  object.name = 'written-range-hero';
  const byClass = (c) => rowData.map((r, i) => (r.cls === c ? i : -1)).filter((i) => i >= 0);
  const which = opts.rows ?? 'all';

  // curtains
  const cm = curtainMaterial(U);
  const nNear = Math.round(384 * (detail < 0.8 ? 0.5 : 1)), spNear = detail < 0.8 ? 2 : 1;
  const curtains = [];
  curtains.push(curtainMesh(curtainGeometry([[nNear, spNear], [96, 4], [96, 8]], LEVELS[1].levels), cm, byClass(1), rowData));
  await ctx.yield();
  curtains.push(curtainMesh(curtainGeometry([[nNear, spNear], [96, 4], [96, 8]]), cm, byClass(0), rowData));
  if (which === 'all') {
    curtains.push(curtainMesh(curtainGeometry([[128, 4], [128, 8]], LEVELS[2].levels), cm, byClass(2), rowData));
    await ctx.yield();
    curtains.push(curtainMesh(curtainGeometry(detail < 0.8 ? [[48, 32]] : [[96, 16]]), cm, byClass(3), rowData));
  }
  for (const c of curtains) object.add(c);
  await ctx.yield();
  // the valley rows' lines as ribbons, so a trace seen from above is still one line
  object.add(ribbonMesh(U, [[nNear, spNear], [96, 4], [96, 8]], byClass(1).concat(byClass(0)), rowData));
  await ctx.yield();

  // arms and nibs: the valley and the old ranges in full, the barograph rows lighter
  const near = byClass(0).concat(byClass(1), which === 'all' ? byClass(2) : []), far = which === 'all' ? byClass(3) : [];
  const armMat = instrumentMaterial(U, 'arm'), nibMat = instrumentMaterial(U, 'nib'), statMat = instrumentMaterial(U, 'static');
  for (const m of [armMat, nibMat, statMat]) m.side = THREE.DoubleSide;
  const add = (g, m) => { const o = new THREE.Mesh(g, m); o.frustumCulled = false; object.add(o); return o; };
  const nearS = near.filter((r) => rowData[r].cls === 0), nearL = near.filter((r) => rowData[r].cls !== 0);
  add(instanceRows(armGeometry(6, false, Ls), nearS, rowData), armMat);
  await ctx.yield();
  if (nearL.length) add(instanceRows(armGeometry(32, false, Ll), nearL, rowData), armMat);
  await ctx.yield();
  add(instanceRows(nibGeometry(false), near, rowData), nibMat);
  await ctx.yield();
  if (far.length) { add(instanceRows(armGeometry(4, true, Ls), far, rowData), armMat); add(instanceRows(nibGeometry(true), far, rowData), nibMat); }
  await ctx.yield();

  // beams, the feed rail over the tide pens, the ink car
  const half = WR.x0 - 30, railY = rec.tideMax + 7.2, railZ = 2.4;
  const statics = [
    beamGeometry(half, -half, WR.shortArm.py, WR.shortArm.pz, 2.2, 1.6, WR.bulbLift),
    beamGeometry(half, -half, WR.longArm.py, WR.longArm.pz, 9, 4.6, WR.bulbLift),
    bridgeGeometry(half, -half, WR.longArm.pz),
    // the long girder and its bridge go on, as pieces of their own, from where the beams were always laid out through both
    // side walls (the piece over the ranks keeps its own corners, so it is drawn as it always was)
    beamGeometry(-GIRDER_HALF, half, WR.longArm.py, WR.longArm.pz, 9, 4.6, WR.bulbLift),
    beamGeometry(-half, GIRDER_HALF, WR.longArm.py, WR.longArm.pz, 9, 4.6, WR.bulbLift),
    bridgeGeometry(-GIRDER_HALF, half, WR.longArm.pz),
    bridgeGeometry(-half, GIRDER_HALF, WR.longArm.pz),
    toned(new THREE.BoxGeometry(82.5, 0.22, 0.16), 0, M4(-85.25, railY + 0.02, railZ - 0.32)),
    toned(new THREE.BoxGeometry(82.5, 0.22, 0.16), 0, M4(-85.25, railY + 0.02, railZ + 0.32)),
  ];
  await ctx.yield();
  for (const hx of [-126, -106, -86, -65, -44.5]) {   // hangers from the short beam down to the rail
    const top = new THREE.Vector3(hx, WR.shortArm.py + WR.bulbLift + 1.4, WR.shortArm.pz), bot = new THREE.Vector3(hx, railY, railZ);
    const len = top.distanceTo(bot), g = new THREE.CylinderGeometry(0.11, 0.11, len, 5, 1, true);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bot).normalize()));
    g.translate((top.x + bot.x) / 2, (top.y + bot.y) / 2, (top.z + bot.z) / 2);
    statics.push(toned(g, 0));
    statics.push(toned(new THREE.BoxGeometry(0.3, 0.3, 0.95), 1, M4(hx, railY + 0.1, railZ)));
  }
  await ctx.yield();
  add(mergeGeometries(statics), statMat);
  await ctx.yield();
  const carMat = instrumentMaterial(U, 'static'); carMat.side = THREE.DoubleSide;
  const car = add(inkCarGeometry(), carMat);
  const spout = add(mergeGeometries([toned(new THREE.CylinderGeometry(0.075, 0.075, 1, 6, 1, true), 1, M4(0, -0.5, 0)), toned(new THREE.CylinderGeometry(0.13, 0.05, 0.12, 6, 1, false), 1, M4(0, -1, 0))]), carMat);
  car.position.set(rowData[CAR_ROWS[0]].x, railY, railZ);
  await ctx.yield();

  // the sheet under it (the world replaces this with floor + drum + vault in sheetMaterial)
  if (opts.floor !== false) {
    const g = new THREE.PlaneGeometry(2200, 1700, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0, 750);
    const p = g.attributes.position, s = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) s[i] = p.getZ(i);
    g.setAttribute('aS', new THREE.BufferAttribute(s, 1));
    add(g, sheetMaterial(U));
  }

  // ------------------------------------------------------------ motion
  let flightS = null, rankLine = false;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const arcJS = (y, L, py) => { const a = Math.min(L, Math.max(-L, y - py)); return Math.sqrt(Math.max(L * L - a * a, 0)) - Math.sqrt(Math.max(L * L - py * py, 0)); };
  const tideAt = (r, scroll) => {           // height of a tide nib right now, from the same record the shader reads
    const d = rec.tide[r]; if (!d) return 5;
    const f = ((-scroll % 4096) + 4096) % 4096, i = Math.floor(f), t = f - i;
    return d[i & 4095] * (1 - t) + d[(i + 1) & 4095] * t;
  };
  const carRow = (k) => CAR_ROWS[((k % CAR_ROWS.length) + CAR_ROWS.length) % CAR_ROWS.length];
  const starve = (target, k, c) => {        // visit k: starving begins 6 s before the car arrives, refill 1.6 s after
    const T = k * CAR_PERIOD, zs = 20 * (c - (T - 6)), zr = c > T + CAR_FILL ? 20 * (c - T - CAR_FILL) : 0;
    const live = c > T - 6 && c < T + 12;
    target.set(rowData[carRow(k)].row[1], Math.max(zs, 0), zr, live ? 1 - sm(T + 9, T + 12, c) : 0);
  };
  function update(dt, time, camera) {
    const scroll = (time * WR.speed) % WR.recLen;
    U.uTime.value = time; U.uScroll.value = scroll;
    const s = flightS ?? (12 + (time % 40));
    U.uS.value = s;
    // the ink car: on the flight clock, so it is filling the pen beside the entry at s = 0..1.6
    const c = flightS ?? time, k = Math.floor(c / CAR_PERIOD), ph = c - k * CAR_PERIOD;
    const even = ((k % 2) + 2) % 2 === 0;
    starve(even ? U.uStarveA.value : U.uStarveB.value, k, c);
    starve(even ? U.uStarveB.value : U.uStarveA.value, ph < 3 ? k - 1 : k + 1, c);
    const xa = rowData[carRow(k)].x, xb = rowData[carRow(k + 1)].x;
    car.position.x = xa + (xb - xa) * sm(3, 7.6, ph);
    const dip = ph < 2.2 ? 1 : ph < 3 ? 1 - sm(2.2, 3, ph) : ph > 7.8 ? sm(7.8, 9, ph) : 0;
    const r = ph > 5 ? carRow(k + 1) : carRow(k), h = tideAt(r, scroll);
    const Kx = car.position.x, Ky = railY - 2.45, Kz = railZ + 0.25;
    const Ty = h + WR.bulbLift + 0.92, Tz = arcJS(70, Ls, WR.shortArm.py) * h / 70;
    const dy = Ty - Ky, dz = Tz - Kz, len = Math.hypot(dy, dz);
    spout.position.set(Kx, Ky, Kz);
    spout.rotation.x = Math.atan2(-dz, -dy) * dip;
    spout.scale.set(1, 0.35 + (len - 0.35) * dip, 1);
    carMat.uniforms.uInstr.value.set(1, -1.0 - 0.95 * (((c / (CAR_PERIOD * 6)) % 1 + 1) % 1), 0, 0);
  }
  update(0, 0, null);

  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    // exit: a 20 m portal in the sheet where it climbs the 300 m drum (centre of curvature z -100, y 300); facing = direction of travel into it
    portalSeat: { position: P(168, 88, -312), facing: P(0, -Math.SQRT1_2, -Math.SQRT1_2), radius: 10, eyelet: 10.6 },
    drum: { z: -100, radius: 300, centre: P(0, 300, -100) },
    // the brief's line: in beside the tide nib, down the west gap, the turn, back up the east gap, up through the range, between the long arms, under their beam, into the eyelet
    flyThrough: [P(-45.5, 8.5, -16), P(-44, 8.5, 0), P(-42, 10, 60), P(-42, 14, 300), P(0, 20, 342), P(42, 18, 300), P(42, 16, 140), P(45.4, 80, 25), P(45.4, 86, 0), P(45, 115, -84), P(42, 139, -160), P(77, 145, -191), P(118, 146, -178), P(168, 139, -248), P(168, 130, -270), P(168, 88, -312)],
    viewpoints: {
      entry: { eye: P(-45.5, 8.5, -16), look: P(-20, 40, 600) },
      nibClose: { eye: P(-47.2, 8.5, -6), look: P(-49, 6.5, 1) },
      broadside: { eye: P(20, 20, 335), look: P(190, 90, 330) },
      valleyHead: { eye: P(42, 16, 250), look: P(42, 110, 0) },
      insideRange: { eye: P(42, 40, 90), look: P(60, 120, 0) },
      nibPass: { eye: P(42, 80, 12), look: P(49, 82, 0) },
    },
    gapWest: P(-42, 0, 0), gapEast: P(42, 0, 0), redRow: P(49, 0, 0), entryNib: P(-49, tideAt(66, 0), 0),
    shortBeam: P(0, WR.shortArm.py + WR.bulbLift + 1.2, WR.shortArm.pz), longBeam: P(0, WR.longArm.py + WR.bulbLift + 1.2, WR.longArm.pz),
    carRail: P(-85.25, railY, railZ),
  };
  return {
    object, radius: opts.viewRadius ?? 150, height: opts.viewHeight ?? 200, center: opts.viewCenter ?? P(42, 70, 60), anchors,
    ground: false, groundY: 0,
    uniforms: U, rows: rowData, variation: { stock, record, shock, hour, density }, tideMax: rec.tideMax,
    // flight seconds (0..44) from the world's u and pace: drives the quake (at 19 s) and the ink car. null = free-running demo.
    setFlightSeconds(s) { flightS = s; },
    setProgress(u, duration = 44) { flightS = u * duration; },
    // hold the two curtains beside the path under y (m); on = 0 lets them stand
    setFlankCap(y, on = 1, xa = 35, xb = 49) { U.uCap.value.set(xa, xb, y, on); U.uEyeCap.value = y; if (!rankLine) { U.uRankE.value.x = y; U.uRankE.value.z = y; } },
    // the ranks' line as a fixed landscape: y0 at z >= z0, rising `slope` m per metre upstream of z0, never over yMax (setFlankCap then leaves it alone)
    setRankLine(y0, z0, yMax, slope) { rankLine = true; U.uRankE.value.set(y0, z0, yMax, slope); },
    // hold every row between x0 and x1 under h (m) for z0..z1 (the turn); h = 0 switches it off
    setBoxCap(x0, x1, z0, z1, h) { U.uCapBox.value.set(x0, x1, z0, z1); U.uCapBoxH.value = h; },
    update,
    dispose() { rec.texture.dispose(); },
  };
}
