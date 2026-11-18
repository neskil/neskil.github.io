// SKY WITH A SEAM: THE WEATHER MACHINES, second file: the rain rig and its rain (a soft-rimmed patch of falling
// rain: a medium), the piece of rainbow that stands in it, the soft-edged patch of pocked sea under it, the paddles
// with their foam and first crests, the mobile of low boards over the bay with its shade on the water (a shadow on
// a mirror, the hero's law: LOWSHADE), and the high boards' shadows on the wall.
// FILTERING (the owner's law): every mark here that a pixel can outgrow is let go TO ITS OWN MEAN, the number
// written beside it and how it is worked (rings, seams, rust, runs, lace, chop); a line drawn wider than it is
// carries its true cover. THE RAIN IS A BODY IN THE WORLD'S OWN METRES AND SECONDS (RAINFALL: a drop's width, its
// one pace of fall, a streak's length, the lanes, the drops to a cubic metre): each streak carries its true cover
// and the lanes are let go by the pixel's footprint to the streaks' own mean, so that far off a layer of rain is a
// veil of that mean and near it is streaks; nothing of the rain is made, sized or timed by the eye.
// SAID PLAINLY: the streaks stand in upright LAYERS WITH NO THICKNESS (RAIN_SHEETS each way), each layer standing
// for the rain of its share of the patch's depth. A ray that crosses the patch square to one set of layers meets
// twelve of them and one that crosses it cornerwise meets seventeen for the same length of rain, so the veil the
// streaks make is by the layers crossed and not by the length of rain crossed: 0.79 to 1.11 of the true, the true
// on the average of all bearings (RAINFALL's lane). The honest mend: the veil of
// the big drops gathered, like the mist, by the length of the eye's ray through the patch, the layers keeping only
// the streaks that a pixel still tells apart.
// THE RAIN'S BODY IS THE PLACE'S AT EVERY DETAIL, NOT THE MACHINE'S: a lighter build stands eight layers each way
// for the twelve, and each of the eight carries its SHARE, one and a half times a full build's layer (the drops of
// one and a half times the depth, in lanes closer by as much; its foot's spray thicker by as much), so the layers
// of a set carry between them the same rain at every detail (THE SHARE, at RAINFALL; the proof holds it).
// Everything here is made with the tools of sky-with-a-seam-machines.js (handed in as T: no import cycle) and
// is called from its makeMachines; the laws (RAIN, PADDLE and their functions) are that file's and are handed in too.
// THE RAIN'S NEAR EDGE STANDS 25 m, LEVEL, FROM THE FLOWN LINE AT EVERY PHASE (that file's RAIN.edge: 25.5 m to
// port of the line at the rig's station; the proof counts 25.0 m least from the line as flown); its rim is feathered
// inward from there. WHAT DETAIL THINS here (a lighter build is any detail under 0.9): four of the rain's twelve
// streak layers each way (the eight left carry the whole rain between them, each its share) and the finest rings
// on the sea; the rig's rack, 5 rows of spray bars with 10 nozzles each
// for 8 rows of 14; the paddles' foam layer, 96 columns along the bank for 160. No law or place changes with it.
import * as THREE from 'three';
import { SHELL, SWELL, LAMP_LIGHT, PAINTS, GLSL_SHADOW, SHADOW, SEA_BODY } from './sky-with-a-seam.js';

const RAD = Math.PI / 180;
const fl = (v) => { const s = String(Math.round(v * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };
// ---- RIDING THE SEA: the hero's one swell (SWELL), exactly as the hero's own sheet draws it. THAT SHEET EASES THE
// SWELL FLAT FROM 150 TO 360 m OF THE EYE'S PLACE (the hero's swellEase about its uCentre, which the sea's update
// sets to the eye's x and z), and so does everything of ours that rides the sea: the rain's patch of sea, the
// paddles' foam and first crests, the wet line and the foam on the paddles' faces, the low boards' shade. BY THIS
// ONE TERM A THING OF OURS IS MOVED BY WHERE THE EYE IS: up or down by as much as the swell's half height
// (SWELL.height / 2: 0.2 m), so as to lie on the sea as the sea is drawn: it is the sea sheet's own level of
// detail (a swell 0.4 m from trough to crest, eased flat far from the eye), followed here and not made here.
// Nothing else of this part is moved, placed or sized by the eye. A layer of ours takes the sea's own two uniform objects (its clock,
// its middle) under these names.
const SWD = [Math.sin((SWELL.from + 180) * RAD), -Math.cos((SWELL.from + 180) * RAD)], SWK = (2 * Math.PI) / SWELL.length, SWW = Math.sqrt(9.81 * SWK);
const GLSL_RIDE = /* glsl */`
uniform float uSeaTime; uniform vec2 uSeaCentre;
float seaEase(vec2 xz){ return 1. - smoothstep(150., 360., length(xz - uSeaCentre)); }
float seaY(vec2 xz){ return ${fl(SWELL.height / 2)} * sin(${fl(SWK)} * dot(xz, vec2(${fl(SWD[0])}, ${fl(SWD[1])})) - ${fl(SWW)} * uSeaTime) * seaEase(xz); }
`;
const seaRide = (sea) => ({ uSeaTime: (sea && sea.uniforms && sea.uniforms.uTime) || { value: 0 }, uSeaCentre: (sea && sea.uniforms && sea.uniforms.uCentre) || { value: new THREE.Vector2() } });
const LAYER_FOG = /* glsl */`
#include <fog_pars_fragment>
float layerFog(){
  #ifdef USE_FOG
    return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return 0.;
  #endif
}
vec3 layerFogColor(){
  #ifdef USE_FOG
    return fogColor;
  #else
    return vec3(0.);
  #endif
}`;
// ---- THE RAIN: a patch of falling rain RAIN.side across, from the nozzles down to the sea. IT IS RAIN, NOT A BOX:
//   ITS RIM      nothing of it stands at the square's own straight sides: its edge is a square with corners rounded
//                RAIN_RIM.round m, drawn in further by a slow noise, and from that edge inward the rain comes on
//                over RAIN_RIM.feather m (GLSL_RIM: streaks fall out one by one toward the edge, mist and spray thin
//                to none); so too under the nozzles, over RAIN_RIM.top m down from the cloud's foot.
//   THE STREAKS  upright layers stand inside the patch, RAIN_SHEETS along the rig's heading and as many across it, through
//                its whole depth (the eye looks through many: they slide on one another as the way passes). In each,
//                SHORT streaks fall (RAINFALL, below: a drop 4 mm wide drawn out 0.4 m by its fall), every one in
//                its own lane with its own light, all at the rain's one pace, head down and tail thinning upward,
//                ALL A LITTLE ASLANT (RAIN_LEAN: one wind); the rain falls in SHAFTS of thick and thin (1.7 to
//                5 m across, tens of metres long) that drift down every layer at that pace. No streak runs the
//                whole fall. Where a pixel is wider than the lanes a layer shows the
//                streaks' own mean: far off the rain is a veil with its thick and thin shafts; near, streaks.
//   THE SPRAY    fine spray stands over the water at every layer's foot, a few metres up, thinning to the rim.
//   THE MIST     the patch's inner part carries a thin mist by the eye's ray THROUGH it, and THE RAINBOW, which
//                stands in the rain 42 degrees from the line that runs from the lamp-sun's OWN PLACE through the eye
//                (the faint second bow at 51 to 53), as a bow must; the streaks that fall through it take its colours.
//   THE SEA      under it the sea keeps its own colour: a dulled mirror, roughened, with rings opening and dying on
//                it (three sizes, by distance), soft-edged by the same rim; no straight line on it, no flat field.
// uRain: the patch's middle x, z; uAxis: the unit (x, z) of the rig's own heading (the flown line's at its station); locals are (along, up, to port).
const RAIN_SHEETS = 12, RAIN_THIN = [1, 4, 7, 10], RAIN_RIM = { round: 18, feather: 14, wobble: 6, top: 10, mist: 6 }, RAIN_LEAN = [0.085, 0.05];
// THE RAIN'S BODY (RAINFALL), typed in the world's own metres and seconds. Nothing of it is made, sized or timed by
// the eye, by the pixel or by a distance:
//   wide   a big drop, the kind seen as a streak, is 4 mm across;
//   pace   every drop falls 8 m a second (a drop of that size falls 7 to 9): the rain has ONE pace;
//   hold   an eye holds what it sees a twentieth of a second, and a streak is as long as its drop falls in that:
//          pace * hold = 0.4 m, whole from its head up to 0.4 of its length, then thinning evenly to none;
//   drops  twelve big drops to a cubic metre where the rain is thickest (a cloudburst); the finer rain is the mist.
//          THIS IS WHAT MAKES THE RAIN READ: the veil of its streaks' own mean, and more rain is more of it;
//   lane   in a layer the streaks stand in lanes 4 cm wide, drop after drop down each. A layer stands for the rain
//          of side * pi / (4 RAIN_SHEETS) = 4.19 m of depth: two sets of layers cross the patch, a level ray meets
//          (|sin| + |cos|) / spacing of them to a metre, and that is 4 / pi on the average of all bearings, so on
//          that average a ray gathers the big drops of the rain it passes. Down a lane a drop then follows the
//          last 1 / (drops * lane * that depth) = 0.497 m behind: the lane's gap;
//   head   the softness of the streak's head, 2 cm;
//   dim    the faintest lane's light against the brightest (each lane has its own, evenly between the two).
// THE STREAKS' OWN MEAN (rainBody().mean), which a layer shows where the pixel has outgrown its lanes: across a
// layer a streak's line covers wide / lane of it; down its lane a streak's light fills (0.7 len - head / 2) / gap
// (0.4 of its length whole and the even thinning of the rest make 0.7; the head's softness takes half of itself);
// the lanes' lights average (1 + dim) / 2. The product: 0.0353 of a layer where the rain is thickest.
// THE SHARE (typed here once): the numbers above are a FULL build's, RAIN_SHEETS layers each way. A lighter build
// stands fewer (rainStanding: RAIN_THIN's four are left out, eight stand) and the rain is no less for it: each
// layer that stands, stands for RAIN_SHEETS / standing times a full layer's depth (1.5: 6.28 m) and carries that
// depth's drops. They cannot follow closer down a lane (the gap would fall under a streak's length), so the LANES
// stand closer by the share (2.67 cm) and the gap stays 0.497 m: every streak keeps its own width, length, pace
// and true cover, and there are the share times as many of them. A layer's mean is then the share times the full
// build's (0.0529) and the layers of a set carry between them RAIN_SHEETS times the full mean, 0.4234, at every detail.
// The spray at a layer's foot (0.3 of a layer at its thickest on a full build) is thicker by the same share.
// SAID PLAINLY: the eight stand one and two twelfths of the side apart by turns and the share is their average;
// and layer on layer is not a sum: at the very thickest twelve lay 0.350 between them and eight 0.353.
export const RAINFALL = { wide: 0.004, pace: 8, hold: 0.05, drops: 12, lane: 0.04, head: 0.02, dim: 0.3 };
export const rainStanding = (detail) => RAIN_SHEETS - ((detail || 1) < 0.9 ? RAIN_THIN.length : 0);   // layers standing each way
export const rainBody = (side, standing = RAIN_SHEETS) => { const F = RAINFALL, share = RAIN_SHEETS / standing, lane = F.lane / share, len = F.pace * F.hold, depth = side * Math.PI / (4 * standing), gap = 1 / (F.drops * lane * depth), fill = (0.7 * len - F.head / 2) / gap;
  return { share, lane, len, depth, gap, fill, spray: 0.3 * share, mean: (F.wide / lane) * fill * (1 + F.dim) / 2 }; };
const f6 = (v) => { const s = String(Math.round(v * 1e6) / 1e6); return /[.e]/.test(s) ? s : s + '.'; };
// THE STREAKS' LAW IN JS, the shader's twin, for the proof to count with (sheetFrag's streak and its main say the
// same in the same order; the hash is the same one, worked here in double floats, so a lane's own numbers differ
// from the shader's while every mean is the same). rainStreak: one lane's streak; rainLayer: what a layer shows at
// a place: { mean: the streaks' own mean at this rim, res: how far the streaks are still drawn, streaks: their sum }
const _fr = (v) => v - Math.floor(v), _cl = (v) => Math.min(Math.max(v, 0), 1), _sm = (a, b, x) => { const t = _cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const _mh = (x, y) => { let a = _fr(x * 0.1031), b = _fr(y * 0.1031), c = a; const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return _fr((a + b) * c); };
export function rainStreak(c, s, y, id, fw, V, time, side, B = rainBody(side)) {
  const F = RAINFALL, h1 = _mh(c, id * 7.3 + 3), h2 = _mh(c + 31, id * 3.1 + 5), half = F.wide / 2, hd = Math.max(half, 0.5 * fw);
  const u = _fr((y + time * F.pace) / B.gap + h2) * B.gap;
  return _cl((hd - Math.abs(s - (c + 0.2 + 0.6 * h1) * B.lane)) / fw + 0.5) * (half / hd) * _sm(0, F.head, u) * (1 - _sm(0.4 * B.len, B.len, u))
    * (F.dim + (1 - F.dim) * _fr(h1 * 61)) * _cl((V - _fr(h2 * 47)) / 0.24 + 0.5);
}
export function rainLayer(s, y, id, fw, fy, V, time, side, B = rainBody(side)) {
  const ramped = (t) => { const q = Math.max(t, 0); return q < 1 ? 0.5 * q * q : q - 0.5; }, c0 = Math.floor(s / B.lane);
  const mean = B.mean * 0.24 * (ramped(V / 0.24 + 0.5) - ramped((V - 1) / 0.24 + 0.5)), res = (1 - _sm(0.4 * B.lane, 1.2 * B.lane, fw)) * (1 - _sm(0.5 * B.len, 1.5 * B.len, fy));
  return { mean, res, streaks: rainStreak(c0 - 1, s, y, id, fw, V, time, side, B) + rainStreak(c0, s, y, id, fw, V, time, side, B) + rainStreak(c0 + 1, s, y, id, fw, V, time, side, B) };
}
// metres inside the patch's edge at a place (along, to port) of the square, and how much of the rain stands there (0..1)
const GLSL_RIM = (T) => /* glsl */`
float rainIn(vec2 p){ vec2 q = abs(p) - ${fl(T.RAIN.side / 2 - RAIN_RIM.round)};
  return ${fl(RAIN_RIM.round)} - length(max(q, 0.)) - min(max(q.x, q.y), 0.) - ${fl(RAIN_RIM.wobble)} * mvn(p / 9. + 3.); }
float rainRim(vec2 p){ return smoothstep(0., ${fl(RAIN_RIM.feather)}, rainIn(p)); }`;
const RAIN_VERT = /* glsl */`
uniform vec2 uRain, uAxis; attribute vec3 aFace; varying vec3 vL, vFace, vW;
#include <fog_pars_vertex>
void main(){
  vL = position; vFace = aFace;
  vec3 wp = vec3(uRain.x + uAxis.x * position.x + uAxis.y * position.z, position.y, uRain.y + uAxis.y * position.x - uAxis.x * position.z); vW = wp;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLSL_BOW = /* glsl */`
vec3 bowBand(float t){ t = clamp(t, 0., 1.);                                        // 0 violet (inside) to 1 red (outside)
  return vec3(smoothstep(.38, .78, t) + .35 * (1. - smoothstep(.0, .22, t)), 1. - abs(t - .52) * 2.6, 1. - smoothstep(.12, .5, t)) * smoothstep(0., .12, t) * (1. - smoothstep(.9, 1., t)); }
// the bow's colour on the eye's ray to a place (the part's BOW law)
vec3 bowAt(vec3 w, vec3 lamp){
  float ang = degrees(acos(clamp(dot(normalize(w - cameraPosition), normalize(cameraPosition - lamp)), -1., 1.)));
  return bowBand((ang - 40.1) / 2.5) + .3 * bowBand((53.4 - ang) / 3.4) + vec3(.06) * (1. - smoothstep(38., 40.6, ang)); }
`;
const rainFrag = (T) => /* glsl */`
uniform vec2 uRain, uAxis; uniform vec3 uLamp, uVeil, uBowCol, uFoam; uniform float uTime, uBow;
varying vec3 vL, vFace, vW;
const float HS = ${fl(T.RAIN.side / 2)}, HT = ${fl(T.RAIN.height - 0.6)};
${T.GLSL_VN}
${LAYER_FOG}
${GLSL_BOW}
${GLSL_RIM(T)}
void main(){
  vec3 C = cameraPosition - vec3(uRain.x, 0., uRain.y), ro = vec3(dot(C.xz, uAxis), C.y, dot(C.xz, vec2(uAxis.y, -uAxis.x)));
  vec3 rd = vL - ro; float t0 = max(length(rd), 1e-3); rd /= t0;
  vec3 rs = rd + (1. - step(1e-5, abs(rd))) * 1e-5;                                // (no division by zero)
  // the eye's way THROUGH the patch's inner part (the square drawn in by RAIN_RIM.mist m: at the rim the mist is none)
  vec3 hi = vec3(HS - ${fl(RAIN_RIM.mist)}, HT, HS - ${fl(RAIN_RIM.mist)}), lo = vec3(-hi.x, 0., -hi.z), ta = (hi - ro) / rs, tb = (lo - ro) / rs, tf = max(ta, tb), tn = min(ta, tb);
  float len = max(min(tf.x, min(tf.y, tf.z)) - max(max(tn.x, max(tn.y, tn.z)), 0.), 0.), front = step(dot(vFace, rd), 0.);
  float h = vL.x + vL.z * 1.37;
  float drift = mvn(vec2(h / 9., (vL.y + uTime * ${f6(RAINFALL.pace)}) / 26.)) * .6 + mvn(vec2(h / 3.1 + 5., (vL.y + uTime * ${f6(RAINFALL.pace)}) / 11.)) * .4;      // thick and thin rain, falling at the rain's one pace
  float topFade = 1. - smoothstep(HT - ${fl(RAIN_RIM.top)}, HT - 1., vL.y);                // (none at the cloud's foot: the sprays have not yet joined)
  float a = (1. - exp(-.0045 * len)) * .42 * (.45 + 1.1 * drift) * topFade;            // THE MIST: thin, never a face
  float dep = 1. - exp(-len / 15.), fg = layerFog();
  vec3 col = mix(uVeil, layerFogColor(), fg) * a + uBowCol * bowAt(vW, uLamp) * uBow * dep * (.6 + .5 * drift) * (1. - fg);
  gl_FragColor = vec4(col, a) * front;
}`;
// THE STREAKS' SHEETS. aSheet: metres along the sheet, the sheet's number. A lane is RAINFALL.lane m wide; down it
// drop follows drop, each a streak: its line stands at the lane's own place across it, and every lane's drops fall
// at the rain's one pace, a gap apart
const SHEET_VERT = /* glsl */`
uniform vec2 uRain, uAxis; attribute vec2 aSheet; varying vec3 vW; varying vec3 vS; varying vec3 vL;
#include <fog_pars_vertex>
void main(){
  vec3 wp = vec3(uRain.x + uAxis.x * position.x + uAxis.y * position.z, position.y, uRain.y + uAxis.y * position.x - uAxis.x * position.z); vW = wp; vL = position;
  vS = vec3(aSheet.x, position.y, aSheet.y);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const sheetFrag = (T, standing) => { const F = RAINFALL, B = rainBody(T.RAIN.side, standing); return /* glsl */`
uniform vec3 uLamp, uDrop, uBowCol, uFoam; uniform float uTime, uBow;
varying vec3 vW; varying vec3 vS; varying vec3 vL;
const float HT = ${fl(T.RAIN.height - 0.6)};
// THE RAIN'S BODY (RAINFALL and rainBody, above): metres and seconds of the world, the same for every eye. LANE,
// MEAN and SPRAY are this build's layer's (THE SHARE, at RAINFALL: a layer of a lighter build carries more rain)
const float LANE = ${f6(B.lane)}, HALF = ${f6(F.wide / 2)}, LEN = ${f6(B.len)}, GAP = ${f6(B.gap)}, PACE = ${f6(F.pace)}, HEAD = ${f6(F.head)}, DIM = ${f6(F.dim)}, MEAN = ${f6(B.mean)}, SPRAY = ${f6(B.spray)};
${T.GLSL_VN}
${LAYER_FOG}
${GLSL_BOW}
${GLSL_RIM(T)}
// ONE LANE'S STREAK at a place of a layer (s m across it, y m up), under a pixel fw m wide across the layer. c: the
// lane's number. The lane has its own place across (.2 to .8 of its width), its own turn in the gap, its own light
// (DIM to 1) and its own number between 0 and 1 by which it falls out toward the rim (it stands where V passes
// that number, softened over .24). The streak's line is HALF m in half width: where the pixel is wider it is drawn
// a pixel wide and carries ITS TRUE COVER, its width over the width drawn, whole
float streak(float c, float s, float y, float id, float fw, float V){
  float h1 = mh21(vec2(c, id * 7.3 + 3.)), h2 = mh21(vec2(c + 31., id * 3.1 + 5.));
  float hd = max(HALF, .5 * fw), u = fract((y + uTime * PACE) / GAP + h2) * GAP;                 // u: metres above the streak's head (its low end)
  return clamp((hd - abs(s - (c + .2 + .6 * h1) * LANE)) / fw + .5, 0., 1.) * (HALF / hd)
    * smoothstep(0., HEAD, u) * (1. - smoothstep(.4 * LEN, LEN, u))                              // the head whole, the tail thinning upward
    * (DIM + (1. - DIM) * fract(h1 * 61.)) * clamp((V - fract(h2 * 47.)) / .24 + .5, 0., 1.); }
float ramped(float t){ t = max(t, 0.); return t < 1. ? .5 * t * t : t - .5; }                    // (the sum of a ramp that rises from 0 to 1 over one step)
void main(){
  float id = vS.z, y = vS.y, rim = rainRim(vL.xz) * (1. - smoothstep(HT - ${fl(RAIN_RIM.top)}, HT - 1., y));
  // (the rain falls aslant: every layer's lanes lean one way, by the wind's part along that layer)
  float s = vS.x + y * ((id < ${fl(RAIN_SHEETS - 0.5)} ? ${fl(RAIN_LEAN[0])} : ${fl(RAIN_LEAN[1])}) + .018 * sin(id * 1.7));
  float fw = max(length(vec2(dFdx(s), dFdy(s))), 1e-4), fy = length(vec2(dFdx(y), dFdy(y)));     // the pixel's footprint across the lanes and up them
  // THE LANES ARE FILTERED BY THE PIXEL'S FOOTPRINT TO THEIR OWN MEAN, and nothing of them is made by it. Where the
  // pixel is narrower than .4 of a lane the streaks are drawn as they stand: this lane's and its two neighbours',
  // which are all that a footprint up to 1.2 lanes wide can touch (a streak stands .2 of a lane clear of its
  // lane's sides), so the sum lays every streak's true cover whole. From there to 1.2 lanes (and where the pixel
  // grows taller than a streak is long) the rows are let go to THE STREAKS' OWN MEAN: MEAN times the share of
  // lanes that stand at this rim (the lanes' numbers lie evenly between 0 and 1, so that share is the ramp's own
  // sum between V - 1 and V). Far off a layer is a veil of that mean; near, it is streaks.
  float V = 1.25 * rim, c0 = floor(s / LANE);
  float st = MEAN * .24 * (ramped(V / .24 + .5) - ramped((V - 1.) / .24 + .5));
  float res = (1. - smoothstep(.4 * LANE, 1.2 * LANE, fw)) * (1. - smoothstep(.5 * LEN, 1.5 * LEN, fy));
  if (res > 0.) st = mix(st, streak(c0 - 1., s, y, id, fw, V) + streak(c0, s, y, id, fw, V) + streak(c0 + 1., s, y, id, fw, V), res);
  // THICK AND THIN RAIN: the rain falls in SHAFTS (more drops, fewer drops), 1.7 to 5 m across and tens of metres
  // long, drifting down every layer at the rain's one pace: .15 to 1 of the rain at its thickest, .575 on the
  // average (each noise is as often over a half as under it, and so is the step between .3 and .7). The finer
  // shafts are let go to their own mean, a half, as a pixel grows as wide as they are
  float yy = y + uTime * PACE, fine = mix(.5, mvn(vec2(s / 1.7 + id, yy / 22.)), 1. - smoothstep(.45, 1.7, fw));
  float thick = smoothstep(.3, .7, mvn(vec2(s / 5. + id * 3.7, yy / 45.)) * .5 + fine * .5);
  float a = min(st * (.15 + .85 * thick) * (.35 + .65 * rim), 1.);
  // the fine spray standing over the water at the layer's foot
  float top = .8 + 4.6 * mvn(vec2(vS.x / 2.4 + id * 5., uTime * .8 + id)), sk = (1. - smoothstep(.1, top, y)) * (.35 + .65 * mvn(vec2(vS.x / .9 + uTime * 1.3, y / .7 - uTime * 2.)));
  float fg = layerFog(), ask = sk * SPRAY * rainRim(vL.xz);
  vec3 col = uDrop * a + uBowCol * bowAt(vW, uLamp) * uBow * a * 1.4 + uFoam * ask;
  float aa = 1. - (1. - a) * (1. - ask);
  gl_FragColor = vec4(mix(col, layerFogColor() * aa, fg), aa);
}`; };
// the soft-edged patch of pocked sea under the rain (the sea's own colour, dulled; rings opening and dying on it): a
// layer riding the swell a finger over the water, feathered by the rain's own rim
const PATCH_VERT = /* glsl */`
${GLSL_RIDE}
uniform vec2 uRain, uAxis; varying vec2 vQ;
#include <fog_pars_vertex>
void main(){
  vec2 xz = vec2(uRain.x + uAxis.x * position.x + uAxis.y * position.z, uRain.y + uAxis.y * position.x - uAxis.x * position.z); vQ = position.xz;
  vec4 mvPosition = viewMatrix * vec4(xz.x, seaY(xz) + .05, xz.y, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const patchFrag = (T, thin) => /* glsl */`
uniform float uTime; uniform vec3 uSea, uGlint; varying vec2 vQ;
${T.GLSL_VN}
${LAYER_FOG}
${GLSL_RIM(T)}
// (a line of half width w under a pixel fw wide: drawn a pixel wide at the least, it carries its width over the width drawn: its true cover, whole, at every footprint)
float mln(float d, float w, float fw){ float ww = max(w, .5 * fw); return clamp((ww - d) / fw + .5, 0., 1.) * (w / ww); }
// rings in cells cs m wide: every cell holds a ring that opens and dies, again and again. A ring's line is .09 cs
// wide; where a pixel is wider it is drawn 1.1 px wide and carries THE COVER IT TRULY HAS (its width over the width drawn)
float rings(vec2 q, float cs, float fw){
  vec2 p = q / cs, ip = floor(p), fp = fract(p) - .5; float hs = mh21(ip + cs), ph = fract(uTime * (.9 + hs) * min(1., 1.4 / cs + .35) + hs * 7.);
  float w0 = .045 * cs, w = max(w0, .55 * fw);
  return mln(abs(length(fp + (vec2(mh21(ip + 3.1), mh21(ip + 8.7)) - .5) * .3) - ph * .42) * cs, w, fw) * (w0 / w) * (1. - ph); }
// THE RINGS END AT THEIR OWN MEAN, not at none: over its cell and its whole life a ring of radius .42 ph cs, its line
// .09 cs wide, at strength 1 - ph, covers 2 pi * .42 * .09 * (the mean of ph (1 - ph): 1/6) = .0396 of the cell,
// whatever the cell's size (counted over a field of cells: 0.0397). Each size is let go to that as the pixel
// outgrows its cells (the ramps are the cells' own: from about a fifth of a cell to about seven tenths of it)
const float RING = .0396;
void main(){
  float fw = max(length(fwidth(vQ)), 1e-3), rim = rainRim(vQ);
  float ring = ${thin ? '0.' : 'mix(RING, rings(vQ, .6, fw), 1. - smoothstep(.1, .4, fw))'} + .9 * mix(RING, rings(vQ + 3.3, 2.6, fw), 1. - smoothstep(.5, 1.7, fw)) + .8 * mix(RING, rings(vQ + 7.1, 9., fw), 1. - smoothstep(2., 7., fw));
  float mott = mvn(vQ / 2.6 + vec2(uTime * .25, 0.)) * .6 + mvn(vQ / .8 - vec2(0., uTime * .6)) * .4;
  // A DULLED MIRROR: the sea's own colour laid thin and uneven over its mirror (roughened water), the rings a little
  // lighter on it; all of it comes on with the rain's rim (no straight edge, no flat field)
  float a = rim * clamp(.14 + .3 * mott + .45 * ring, 0., .6) * (1. - layerFog());
  gl_FragColor = vec4(mix(uSea, uGlint, clamp(.75 * ring + .25 * (mott - .5), 0., 1.)) * a, a);
}`;
function makeRainMedium(ctx, T, o) {
  const R = T.RAIN, h = R.side / 2, top = R.height - 0.6, look = o.look, P = PAINTS[look], LL = LAMP_LIGHT[look], F = T.rigAxes(o.route);
  const fill = new THREE.Color(P.fill).multiplyScalar(LL.fill), lamp = new THREE.Color().setRGB(LL.color[0], LL.color[1], LL.color[2]);
  const lit = (k, tint) => new THREE.Color(fill.r + lamp.r * LL.key * k, fill.g + lamp.g * LL.key * k, fill.b + lamp.b * LL.key * k).multiply(new THREE.Color().setRGB(tint[0], tint[1], tint[2]));
  const U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...seaRide(o.sea), uRain: { value: new THREE.Vector2(o.route.rain.x, o.route.rain.z) }, uAxis: { value: new THREE.Vector2(F.dir.x, F.dir.z) },
    uTime: { value: 0 }, uLamp: o.sky.shadow.uLamp, uVeil: { value: lit(0.7, [0.74, 0.79, 0.86]) }, uBowCol: { value: lamp.clone() }, uBow: { value: 0.8 },
    uDrop: { value: lit(1.0, [0.97, 0.98, 1.0]) }, uFoam: { value: lit(0.95, [0.88, 0.92, 0.96]) },
    // the sea's own colour under the rain: the tank's deep (the hero's sea's own), a part of the sky's haze in it; the rings' light
    uSea: { value: new THREE.Color(((o.sea.uniforms.uDeep || {}).value) || (look ? '#1c3048' : '#0a3550')).lerp(new THREE.Color(P.haze), 0.34).multiply(lit(0.55, [1, 1, 1])) },
    uGlint: { value: new THREE.Color(P.haze).lerp(new THREE.Color('#ffffff'), 0.3).multiply(lit(0.8, [1, 1, 1])) } };
  const layer = (vs, fs, extra = {}) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, fog: true, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, ...extra });
  const F32 = (a, n) => new THREE.Float32BufferAttribute(a, n), ball = new THREE.Sphere(new THREE.Vector3(o.route.rain.x, 40, o.route.rain.z), 120);
  // the column's four upright faces (the mist and the bow)
  const cp = [], cf = [], ci = [];
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = cp.length / 3, c = (t, y) => { cp.push(nx * h + nz * t * h, y, nz * h + nx * t * h); cf.push(nx, 0, nz); };
    c(-1, 0); c(1, 0); c(1, top); c(-1, top); ci.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', F32(cp, 3)); cg.setAttribute('aFace', F32(cf, 3)); cg.setIndex(ci); cg.boundingSphere = ball;
  const column = new THREE.Mesh(cg, layer(RAIN_VERT, rainFrag(T))); column.renderOrder = 3; column.name = 'rain-mist-and-bow';
  // the streaks' sheets: RAIN_SHEETS along the rig's heading, as many across it, each a little off the even place (by its number)
  // (A LIGHTER BUILD, detail under 0.9, leaves out four layers in twelve of each set, RAIN_THIN, and the finest rings
  // on the sea: every layer and ring that stays keeps its own place; each layer that stays carries its SHARE of the
  // rain, RAINFALL's remark, so the rain is the same body at every detail)
  const sp = [], ss = [], si = [], n = RAIN_SHEETS, standing = rainStanding(o.detail), thin = standing < n;
  for (let set = 0; set < 2; set++) for (let i = 0; i < n; i++) { if (thin && RAIN_THIN.includes(i)) continue; const id = set * n + i, off = -h + (i + 0.5 + 0.3 * Math.sin(id * 2.4)) * R.side / n, k = sp.length / 3;
    for (const [t, y] of [[-1, 0], [1, 0], [1, top], [-1, top]]) { if (set) sp.push(off, y, t * h); else sp.push(t * h, y, off); ss.push(t * h + id * 17.3, id); }
    si.push(k, k + 1, k + 2, k, k + 2, k + 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', F32(sp, 3)); sg.setAttribute('aSheet', F32(ss, 2)); sg.setIndex(si); sg.boundingSphere = ball;
  const sheets = new THREE.Mesh(sg, layer(SHEET_VERT, sheetFrag(T, standing))); sheets.renderOrder = 4; sheets.name = 'rain-streaks';
  // the sea's square
  const pp = [], pi = [], N = 24;
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) pp.push((i / N * 2 - 1) * (h + 1), 0, (j / N * 2 - 1) * (h + 1));
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const k = i * (N + 1) + j; pi.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', F32(pp, 3)); pg.setIndex(pi); pg.boundingSphere = ball;
  const patch = new THREE.Mesh(pg, layer(PATCH_VERT, patchFrag(T, thin), { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); patch.renderOrder = 2; patch.name = 'rain-patch';
  for (const m of [column, sheets, patch]) m.frustumCulled = false;
  const c = new THREE.Vector3();
  return { objects: [patch, column, sheets], uniforms: U, triangles: 8 + si.length / 3 + N * N * 2,
    update(dt, time) { T.rainCentre(o.route, time, c); U.uRain.value.set(c.x, c.z); U.uTime.value = time; } };
}
// the rack's own measures, metres: rim [deep, thick, its middle over the pipes' level]; girder [deep, wide, its middle
// over the pipes]; walk [wide, its plate over the pipes, the cross walkway's place before the tank]; gusset: half a
// corner plate; rail: the handrail over the plate; posts: spans of it a side; valve: half a chest; wheel: a
// handwheel's radius; bar: a row's spray bar [deep, wide, its middle over the pipes]; head: a nozzle head's [radius, length]; hose: [radius, how far apart on the cloud's back, how
// high over the pipes they end, their sag]; rod: [radius, how far apart along the rim, how high over the pipes they
// end]; buckle: a turnbuckle's [radius, half length]
export const RACK = { rim: [2.4, 0.3, -0.1], girder: [0.9, 0.6, 0.85], walk: [2.4, 1.35, 6.4], gusset: 3, rail: 1.1, posts: 5, valve: 0.55, wheel: 0.75, bar: [0.5, 1.6, 0.35],
  head: [0.6, 0.7], hose: [0.28, 9, 9, 2.5], rod: [0.11, 14, 16], buckle: [0.32, 0.9] };
// ---- THE RAIN RIG: A MADE MACHINE. A square rack at RAIN.height: a deep rim plate round it, girders, a plated
// walkway with a handrail, corner plates; under them the rows of plated spray bars with their pipes and brass
// nozzle heads, a valve
// chest with a red handwheel where each row meets the header, a header tank on its middle. It hangs by its four
// corners on four four-part falls of stout dark rope that run plumb up to the dome; the rain cloud (the grey cloud
// board) on four more, on the town side; hoses and four stay rods with turnbuckles tie the rack to the cloud's back. Rack, tank,
// ropes and the grey board ride together along the rig's own heading (the grey board's slot). Its bodies (plates,
// girders, troughs, chests, tank) stand solid at every distance; its thin members (pipes, rail, hoses, rods, ropes)
// are drawn by the part's one thin-member law: never narrower than 1.5 px, each carrying its true cover, no floor.
// o: { route, grey, G, look, sky, sea, detail }. Returns { objects, update, triangles }.
export async function makeRain(ctx, T, o) {
  const { RAIN, V3 } = T, G = o.G, route = o.route, grey = o.grey, F = T.rigAxes(route), dir = F.dir, port = F.port, up = V3(0, 1, 0), h = RAIN.side / 2;
  const mark = [o.G.I.length, o.G.thin.I.length];                              // (where the rig's own vertices begin)
  // the dome's least height over a place of the rig, over the whole of its creep, less a metre: where a stout rope ends
  const roof = (x, z) => Math.min(...[-1, 0, 1].map((k) => T.shellTop(x + dir.x * k * RAIN.travel, z + dir.z * k * RAIN.travel))) - 1;
  T.buildBoard(G, null, grey, { detail: o.detail, roof });
  await ctx.yield();
  // the pipes, in the grey board's slot: places are metres from the grey board's middle
  const off = V3(route.rain.x - grey.x, -grey.y, route.rain.z - grey.z), at = (a, l, y) => off.clone().addScaledVector(dir, a).addScaledVector(port, l).setY(y - grey.y);
  const Y = RAIN.height, rows = o.detail < 0.9 ? 5 : 8, per = o.detail < 0.9 ? 10 : 14;
  G.slot = grey.slot; G.kind = 0;
  G.color('#59616b'); for (const sd of [-1, 1]) { G.tube(at(-h, sd * h, Y), at(h, sd * h, Y), 0.5, 6, true); G.tube(at(sd * h, -h, Y), at(sd * h, h, Y), 0.5, 6, true); }
  for (let i = 0; i < rows; i++) { const l = -h + (i + 0.5) * RAIN.side / rows;
    G.color('#6a727c'); G.tube(at(-h, l, Y), at(h, l, Y), 0.3, 5, true);
    G.color('#e2bf63'); for (let k = 0; k < per; k++) { const a = -h + (k + 0.5) * RAIN.side / per; G.tube(at(a, l, Y - 0.2), at(a, l, Y - 1.7), 0.34, 4, true); }      // the nozzles, brass
    if (i % 2) await ctx.yield(); }
  G.color('#59616b'); G.tube(at(0, -h, Y + 0.3), at(0, h, Y + 0.3), 0.42, 6, true);                                   // the header across the rows
  // the header tank on the rack's middle (the rain's water), on two saddles
  G.kind = 7; G.color('#8d99a6'); G.tube(at(-4, 0, Y + 2.9), at(4, 0, Y + 2.9), 2.1, 10); G.disc(at(-4, 0, Y + 2.9), dir.clone().negate(), 2.1, 10); G.disc(at(4, 0, Y + 2.9), dir, 2.1, 10);
  G.color('#3b4048'); for (const k of [-2.4, 2.4]) G.box(at(k, 0, Y + 1.0), dir, up, port, 0.3, 0.75, 1.7);
  await ctx.yield();
  // THE RACK IS A MADE MACHINE, plates and solids (RACK, in metres): a deep rim plate round the square; two girders
  // each way over the pipes; a plated walkway inside the rim and one across by the tank, with a handrail; a gusset
  // plate in each corner; over each row of nozzles its spray bar, a plated trough; a valve chest with a red
  // handwheel where each row meets the header; a brass head on every nozzle
  const K = RACK, down = V3(0, -1, 0);
  G.kind = 7; G.color('#454d57');
  for (const sd of [-1, 1]) { G.box(at(0, sd * (h + K.rim[1]), Y + K.rim[2]), dir, up, port, h + 2 * K.rim[1], K.rim[0] / 2, K.rim[1]); G.box(at(sd * (h + K.rim[1]), 0, Y + K.rim[2]), port, up, dir, h, K.rim[0] / 2, K.rim[1]); }
  G.color('#525a64'); for (const sd of [-1, 1]) { G.box(at(0, sd * h / 3, Y + K.girder[2]), dir, up, port, h, K.girder[0] / 2, K.girder[1] / 2); G.box(at(sd * h / 3, 0, Y + K.girder[2]), port, up, dir, h, K.girder[0] / 2, K.girder[1] / 2); }
  G.color('#77808a'); { const w = K.walk[0] / 2, y = Y + K.walk[1], in0 = h - w - 0.4;
    for (const sd of [-1, 1]) { G.box(at(0, sd * in0, y), dir, up, port, h, 0.08, w); G.box(at(sd * in0, 0, y), port, up, dir, in0 - w, 0.08, w); }
    G.box(at(-K.walk[2], 0, y), port, up, dir, in0 - w, 0.08, w);                                                      // the walkway across, beside the tank
    for (const sa of [-1, 1]) for (const sl of [-1, 1]) G.box(at(sa * (in0 - w - K.gusset), sl * (in0 - w - K.gusset), y - 0.05), dir, up, port, K.gusset, 0.1, K.gusset);
    // the handrail along the walkways' inner edges (a line: the thin-member law), on posts
    G.kind = 0; G.color('#c9ced4'); const r0 = in0 - w, yr = y + K.rail;
    for (const sd of [-1, 1]) { G.tube(at(-r0, sd * r0, yr), at(r0, sd * r0, yr), 0.07, 4, true); G.tube(at(sd * r0, -r0, yr), at(sd * r0, r0, yr), 0.07, 4, true);
      for (let q = 0; q <= K.posts; q++) { const a = -r0 + 2 * r0 * q / K.posts; G.tube(at(a, sd * r0, y), at(a, sd * r0, yr), 0.07, 4, true); G.tube(at(sd * r0, a, y), at(sd * r0, a, yr), 0.07, 4, true); } } }
  await ctx.yield();
  for (let i = 0; i < rows; i++) { const l = -h + (i + 0.5) * RAIN.side / rows;
    G.kind = 7; G.color('#5f6872'); G.box(at(0, l, Y + K.bar[2]), dir, up, port, h, K.bar[0] / 2, K.bar[1] / 2);                      // the row's spray bar: a plated trough over its pipe
    G.color('#353a41'); G.box(at(0, l, Y + 0.3), dir, up, port, K.valve, K.valve, K.valve);
    G.color('#b5483a'); G.disc(at(0, l, Y + 0.3 + K.valve + 0.5), up, K.wheel, 8); G.disc(at(0, l, Y + 0.3 + K.valve + 0.5), down, K.wheel, 8);
    G.color('#d9b455'); for (let k = 0; k < per; k++) { const a = -h + (k + 0.5) * RAIN.side / per; G.tube(at(a, l, Y - 1.6), at(a, l, Y - 1.6 - K.head[1]), K.head[0], 5); G.disc(at(a, l, Y - 1.6 - K.head[1]), down, K.head[0], 5); }
    if (i % 2) await ctx.yield(); }
  // THE RACK AND ITS CLOUD ARE ONE MACHINE: at the rack's corner nearest the rain cloud's back a valve chest, from
  // which three HOSES rise in bights to the cloud board's back; from the rim either way of that corner four STAY
  // RODS, each with a turnbuckle, run up to the cloud board's back. All of it ends under the cloud's own outline
  // there (its top at that place across the board, less 2 m), so nothing of it shows over the cloud from the town.
  { const f = grey.face * Math.PI / 180, n = V3(Math.sin(f), 0, -Math.cos(f)), ex = V3(grey.ex[0], 0, grey.ex[1]), O = grey.o;
    const topAt = (u) => { const q = u / grey.hw; let t = O.vMin; for (let i = 0; i < O.n; i++) if (q >= O.u[i] && q <= O.u[i + 1]) t = Math.min(O.top[i], O.top[i + 1]); return t * grey.hh; };      // (metres over the board's middle)
    const onBack = (u, over) => ex.clone().multiplyScalar(u).addScaledVector(n, -0.9).setY(Math.max(Math.min(topAt(u) - 2, Y + over - grey.y), O.vMin * grey.hh + 2));
    let sa = 1, sl = 1, best = -1e9; for (const a of [-1, 1]) for (const l of [-1, 1]) { const d = at(a * h, l * h, Y).dot(n); if (d > best) { best = d; sa = a; sl = l; } }
    const chest = at(sa * (h - 2.6), sl * (h - 2.6), Y + K.walk[1] + 0.9), u0 = chest.dot(ex);
    G.kind = 7; G.color('#353a41'); G.box(chest, dir, up, port, 1.2, 0.8, 1.2);
    for (const j of [-1, 0, 1]) { const E = onBack(u0 + j * K.hose[1], K.hose[2] + Math.abs(j) * 2), S0 = chest.clone().addScaledVector(up, 0.8), pts = [];
      for (let q = 0; q <= 6; q++) { const t = q / 6; pts.push(S0.clone().lerp(E, t).addScaledVector(up, -K.hose[3] * 4 * t * (1 - t))); }
      G.kind = 0; G.color('#26282c'); for (let q = 0; q < 6; q++) G.tube(pts[q], pts[q + 1], K.hose[0], 5, true);
      G.kind = 7; G.color('#8d99a6'); G.box(E, ex, up, n, 0.5, 0.5, 0.45); }
    for (const k of [1, 2]) for (const edge of [0, 1]) { const R0 = edge ? at(sa * h, sl * (h - k * K.rod[1]), Y + 1.1) : at(sa * (h - k * K.rod[1]), sl * h, Y + 1.1), E = onBack(R0.dot(ex), K.rod[2]);
      const d = E.clone().sub(R0), len = d.length(); d.divideScalar(len); const m = R0.clone().addScaledVector(d, len * 0.42);
      G.kind = 0; G.color('#2c2f35'); G.tube(R0, E, K.rod[0], 5, true);
      G.kind = 7; G.color('#8d99a6'); G.tube(m.clone().addScaledVector(d, -K.buckle[1]), m.clone().addScaledVector(d, K.buckle[1]), K.buckle[0], 6);
      G.color('#353a41'); G.box(R0, dir, up, port, 0.4, 0.4, 0.4); G.box(E, ex, up, n, 0.4, 0.4, 0.4); } }
  await ctx.yield();
  // THE RIG'S OWN HANGERS: at each of the four corners a lug, on it a double block, and A FOUR-PART FALL of the stout
  // dark rope (GEAR.stout m thick; the part's GEAR.fall and fallParts: the purchase a rig of that weight carries),
  // each part plumb up to the dome over its own place; like the rain cloud's four falls, ropes under the
  // thin-member law (their true cover: faint far off, where the four parts together still make a line)
  for (const sa of [-1, 1]) for (const sl of [-1, 1]) { G.kind = 7; G.color('#2c2f35'); G.box(at(sa * h, sl * h, Y + 0.9), dir, up, port, 0.7, 0.9, 0.7);
    G.box(at(sa * h, sl * h, Y + 2.45), dir, up, port, T.GEAR.fall.sheave / 2 + 0.25, 0.65, T.GEAR.fall.pin / 2 + 0.3);
    G.kind = 4; G.color(T.TAR);
    for (const [da, dl] of T.fallParts()) { const w = at(sa * h + da, sl * h + dl, 0);
      G.tube(at(sa * h + da, sl * h + dl, Y + 3.1), at(sa * h + da, sl * h + dl, roof(grey.x + w.x, grey.z + w.z)), T.GEAR.stout / 2, 6, true); } }
  G.kind = 0;
  // THE RIG'S HARDWARE IS ONE KIND: all of it (pipes, nozzles, tank, lugs, the rain cloud's irons) is kind 8, plain
  // colour, laid with the gear; its ropes stay ropes (kind 4). No kind has a pixel law of its own.
  [G, G.thin].forEach((g, j) => { for (let i = mark[j] + 1; i < g.I.length; i += 2) if (g.I[i] === 0 || g.I[i] === 6 || g.I[i] === 7) g.I[i] = 8; });
  await ctx.yield();
  const medium = makeRainMedium(ctx, T, o);
  await ctx.yield();
  return medium;
}
// ---- THE PADDLES. A flap is drawn in its own axes (x along its hinge, y up the flap from the hinge, z off its
// middle plane toward the bay) and leans in the vertex shader by THE PADDLES' LAW (the same the proof counts):
// lean = mean + swing sin(phase - w t + lead), phase = the swell's at the flap's own hinge. aFlap: the flap's
// bearing (rad), its phase, and what the vertex is (0 the flap, 1 a ram's rod: its z is then 0 at the sill's
// pivot and 1 at the flap's lug, and the rod stretches between them).
const paddleLeanGLSL = (T) => /* glsl */`
const float PR = ${fl(SHELL.R - T.PADDLE.inset)}, PHY = ${fl(T.PADDLE.hingeY)};
float flapLean(float phase, float time){ return ${fl(T.PADDLE.mean)} + ${fl(T.PADDLE.swing)} * sin(phase - ${fl(T.PADDLE.w)} * time + ${fl(T.PADDLE.lead)}); }
`;
const paddleVert = (T) => /* glsl */`
attribute vec3 aCol, aFlap; uniform float uTime;
varying vec3 vCol, vN, vW, vF; varying float vLean;
${paddleLeanGLSL(T)}
#include <fog_pars_vertex>
void main(){
  float b = aFlap.x, a = flapLean(aFlap.y, uTime), ca = cos(a), sa = sin(a);
  vec3 rad = vec3(sin(b), 0., -cos(b)), tng = vec3(cos(b), 0., sin(b));
  float x = position.x, upw = position.y * ca - position.z * sa, inw = position.y * sa + position.z * ca;
  vec3 n = vec3(normal.x, normal.y * ca - normal.z * sa, normal.y * sa + normal.z * ca);        // across, up, toward the bay
  if (aFlap.z > .5) { vec2 A = vec2(${fl(-(T.PADDLE.inset - 1.25))}, ${fl(2.5 - T.PADDLE.hingeY)}), B = vec2(${fl(T.PADDLE.tall - 0.45)} * sa - .5 * ca, ${fl(T.PADDLE.tall - 0.45)} * ca + .5 * sa);
    vec2 P = mix(A, B, position.z); inw = P.x; upw = P.y + position.y; n = normal; }
  vec3 wp = rad * (PR - inw) + tng * x + vec3(0., PHY + upw, 0.);
  vW = wp; vN = tng * n.x + vec3(0., n.y, 0.) - rad * n.z; vCol = aCol; vF = position; vLean = a;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const paddleFrag = (T) => /* glsl */`
uniform vec3 uLampCol, uFillCol, uBounce, uFoam; uniform float uKey, uFill, uTime;
varying vec3 vCol, vN, vW, vF; varying float vLean;
${T.GLSL_VN}
${GLSL_RIDE}
${GLSL_SHADOW}
#include <fog_pars_fragment>
// (a line of half width w under a pixel fw wide: drawn a pixel wide at the least, it carries its width over the width drawn: its true cover, whole, at every footprint)
float mln(float d, float w, float fw){ float ww = max(w, .5 * fw); return clamp((ww - d) / fw + .5, 0., 1.) * (w / ww); }
void main(){
  vec3 n = normalize(vN + 1e-5), L = uLamp - vW; float ld = max(length(L), 1.); L /= ld;
  float fw = max(length(fwidth(vW)), 1e-3), ndl = max(dot(n, L), 0.);
  vec3 col = vCol;
  // the plates: a dark seam every 2.7 m, each plate its own shade, rust running down from seams and rail
  float px = vF.x / 2.7, pd = min(fract(px), 1. - fract(px)) * 2.7, near = 1. - smoothstep(.08, .6, fw);
  col *= 1. + (mh21(vec2(floor(px), 3.)) - .5) * .16 * near;                      // (each plate's shade: as often light as dark, its mean is the plate)
  // THE SEAM ENDS AT ITS OWN MEAN, not at bare plate: a dark line .05 m wide every 2.7 m covers .05 / 2.7 = .0185
  // of the plate (so .0093 darker at its strength .5)
  col *= 1. - .5 * mix(.0185, mln(pd, .025, fw), near);
  // THE RUST ENDS AT ITS OWN MEAN, not at clean plate: its two noises' steps average .247 and .461 and stand apart,
  // so their product averages .114 (counted over the noise's own field, two million places)
  float rust = smoothstep(.45, .9, mvn(vec2(vF.x / .35, vF.y / 2.6))) * smoothstep(.3, .75, mvn(vF.xy / 1.9 + 4.));
  col = mix(col, vec3(.3, .16, .08), .45 * mix(.114, rust, 1. - smoothstep(.2, 1.4, fw)));
  // wet: dark below the water's reach, and water sheeting off the face in falling runs
  float h = vW.y - seaY(vW.xz), wet = 1. - smoothstep(.5, 1.5, h);
  col *= mix(1., .62, wet);
  float runs = smoothstep(.5, .85, mvn(vec2(vF.x / .16, (vF.y + uTime * 2.6) / 1.1))) * smoothstep(.3, .7, mvn(vec2(vF.x / 1.3 + uTime * .1, vF.y / 2.)));
  // THE RUNS END AT THEIR OWN MEAN, not at none: their two noises' steps average .242 and .5, the product .121
  // (counted the same way); they stand only in the water's reach over the sea (a law of the place: h)
  float sheet = mix(.121, runs, 1. - smoothstep(.04, .3, fw)) * (1. - smoothstep(.6, 2.2, h));
  float key = uKey * ndl * (1. - boatShade(vW, min(fw, 2.)));
  vec3 lit = uFillCol * uFill * (.72 + .28 * n.y) + uBounce * (.5 - .5 * dot(n, L)) + uLampCol * key;
  vec3 V = normalize(cameraPosition - vW), Hh = normalize(L + V);
  float spec = pow(max(dot(n, Hh), 1e-4), 40.) * (.25 + .6 * wet) * key;                    // the wet steel's sheen
  col = col * lit + uLampCol * spec + uFoam * sheet * .55;
  // the foam where the water stands against the flap
  float foam = (1. - smoothstep(.0, .22 + .12 * mvn(vec2(vF.x / .6, uTime * 1.3)), abs(h))) * (.6 + .4 * mvn(vec2(vF.x / .25 + uTime, uTime * 2.)));
  col = mix(col, uFoam, clamp(foam, 0., 1.) * .8);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// the foam at the flaps' foot and THE FIRST CRESTS: a layer on the sea along the bank. The crests are the swell's
// OWN crests (the sea's law at the place), laced with foam as they leave the flaps and thinning out to sea.
// aBank: the place's bearing (rad) and its metres toward the bay from the hinge line.
const CREST_VERT = /* glsl */`
${GLSL_RIDE}
attribute vec2 aBank; varying vec2 vB; varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vB = aBank; vW = vec3(position.x, seaY(position.xz) + .05, position.z);
  vec4 mvPosition = viewMatrix * vec4(vW, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const crestFrag = (T) => /* glsl */`
uniform float uTime; uniform vec3 uFoam; varying vec2 vB; varying vec3 vW;
${T.GLSL_VN}
${GLSL_RIDE}
${LAYER_FOG}
${paddleLeanGLSL(T)}
void main(){
  float fw = max(length(fwidth(vW.xz)), 1e-3), fi = (degrees(vB.x) - ${fl(T.PADDLE.from)}) / ${fl(T.PADDLE.pitch)}, i = floor(fi), fx = fract(fi);
  float on = step(0., fi) * step(fi, ${fl(T.PADDLE.count)}) * smoothstep(0., .03, fx) * (1. - smoothstep(.97, 1., fx));
  float bc = radians(${fl(T.PADDLE.from)} + (i + .5) * ${fl(T.PADDLE.pitch)}), lean = flapLean(${fl(-T.PADDLE.k * (SHELL.R - T.PADDLE.inset))} * cos(bc - ${fl(SWELL.from * RAD)}), uTime);
  float s = vB.y + PHY * tan(lean);                                                  // metres toward the bay from the flap's wet face
  float n1 = mvn(vW.xz / .45 + vec2(uTime * .7, -uTime * .4)), n2 = mvn(vW.xz / 1.6 - vec2(uTime * .3, uTime * .2));
  // THE LACE of the foam, and what a crest keeps of it, each END AT THEIR OWN MEAN where the pixel outgrows the
  // lace: .449 and .423 (counted over the two noises' own field, two million places)
  float lr = smoothstep(.3, .75, n1 * .6 + n2 * .4), res = 1. - smoothstep(.2, 1.1, fw), lace = mix(.449, lr, res), laced = mix(.423, smoothstep(.35, .7, lr), res);
  float churn = on * (step(0., s) * (1. - smoothstep(.3, 3.6, s)) + step(s, 0.) * .6 * (1. - smoothstep(0., 3., -s)));
  // the short broken chop the flap throws off. IT ENDS AT ITS OWN MEAN, not at none: over one turn of its wave
  // (4.2 m) the step from .72 to 1 of a sine averages .166 (counted over the turn)
  float chop = on * step(0., s) * exp(-s / 5.) * mix(.166, smoothstep(.72, 1., sin(s * 1.5 - uTime * 3.6 + i * 1.7 + 5. * n2)), 1. - smoothstep(1.5, 5., fw));
  float th = ${fl(SWK)} * dot(vW.xz, vec2(${fl(SWD[0])}, ${fl(SWD[1])})) - ${fl(SWW)} * uSeaTime;
  float crest = smoothstep(.9, 1., sin(th + 1.2 * (n2 - .5))) * exp(-max(s - .5, 0.) / 12.) * step(0., s) * step(0., fi) * step(fi, ${fl(T.PADDLE.count)});
  float a = clamp(churn * (.35 + .6 * lace) + chop * lace * .7 + crest * laced * .8, 0., 1.) * (1. - layerFog());
  gl_FragColor = vec4(uFoam * a, a);
}`;
// o: { S (the still geometry: the sill's ledge goes into it), look, sky, sea, detail }
export async function makePaddles(ctx, T, o) {
  const Pd = T.PADDLE, V3 = T.V3, P = [], N = [], C = [], Fl = [], X = [], col = new THREE.Color(); let flap = [0, 0, 0];
  const vert = (p, n) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(col.r, col.g, col.b); Fl.push(flap[0], flap[1], flap[2]); return P.length / 3 - 1; };
  const quad = (a, b, c, d, n) => { const i = vert(a, n); vert(b, n); vert(c, n); vert(d, n); X.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  const box = (x0, x1, y0, y1, z0, z1, skip = '') => {                               // in the flap's own axes, the faces asked for
    if (!skip.includes('+z')) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    if (!skip.includes('-z')) quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [0, 0, -1]);
    if (!skip.includes('+y')) quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
    if (!skip.includes('-y')) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
    if (!skip.includes('+x')) quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]);
    if (!skip.includes('-x')) quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [-1, 0, 0]);
  };
  const w = Pd.wide / 2, t = Pd.thick / 2, low = 1.6, top = Pd.tall, S = o.S, up = V3(0, 1, 0);
  for (let i = 0; i < Pd.count; i++) {
    const bd = T.paddleBearing(i), b = bd * RAD; flap = [b, T.paddlePhase(i), 0];
    col.set('#51666a'); box(-w, w, low, top, -t, t, '-y');                           // the plate (its hinge and foot are under the water)
    col.set('#b08f2e'); box(-w, w, top - 0.1, top + 0.24, -t - 0.15, t + 0.15);      // its top rail
    col.set('#3d4c50'); box(-w, w, 4.0, 4.3, -t - 0.3, -t, '+z-x+x');                // the back's stiffeners
    for (let k = 0; k <= 6; k++) { const x = -w + 0.2 + k * (Pd.wide - 0.4) / 6; box(x - 0.12, x + 0.12, low, top - 0.1, -t - 0.34, -t, '+z-y+y'); }
    for (const sd of [-1, 1]) { const x = sd * w * 0.5; flap = [b, T.paddlePhase(i), 0]; col.set('#2c3336'); box(x - 0.32, x + 0.32, top - 0.75, top - 0.15, -t - 0.62, -t, '+z');
      flap = [b, T.paddlePhase(i), 1];                                                // the ram: a dark sleeve from the sill, a bright rod to the lug
      for (const [h, z0, z1, hex] of [[0.2, 0, 0.56, '#2f3538'], [0.09, 0.5, 1, '#b9bfc2']]) { col.set(hex);
        quad([x - h, h, z0], [x + h, h, z0], [x + h, h, z1], [x - h, h, z1], [0, 1, 0]); quad([x - h, -h, z0], [x + h, -h, z0], [x + h, -h, z1], [x - h, -h, z1], [0, -1, 0]);
        quad([x + h, -h, z0], [x + h, h, z0], [x + h, h, z1], [x + h, -h, z1], [1, 0, 0]); quad([x - h, -h, z0], [x - h, h, z0], [x - h, h, z1], [x - h, -h, z1], [-1, 0, 0]); } }
    // still, in the machines' own material: the sill's ledge along the wall's foot and the rams' pivot brackets
    const rad = V3(Math.sin(b), 0, -Math.cos(b)), tng = V3(Math.cos(b), 0, Math.sin(b)), at = (r, y, x) => rad.clone().multiplyScalar(SHELL.R - r).addScaledVector(tng, x).setY(y);
    S.slot = -1; S.kind = 0; S.color('#5c6166'); S.box(at(0.95, -0.2, 0), tng, up, rad, (Pd.wide + Pd.gap) / 2 + 0.05, 1.1, 0.8, '-y+z');
    S.color('#b08f2e', 0.8); S.box(at(1.72, 0.84, 0), tng, up, rad, (Pd.wide + Pd.gap) / 2 + 0.05, 0.07, 0.06, '-y+z');
    S.color('#2c3336'); for (const sd of [-1, 1]) { S.box(at(1.25, 1.75, sd * w * 0.5), tng, up, rad, 0.22, 0.85, 0.22, '-y'); S.color('#4a5257'); S.box(at(1.25, 2.5, sd * w * 0.5), tng, up, rad, 0.3, 0.22, 0.34); S.color('#2c3336'); }
    if (i % 4 === 3) await ctx.yield();
  }
  await ctx.yield();
  const F32 = (a, n) => new THREE.Float32BufferAttribute(a, n), g = new THREE.BufferGeometry();
  g.setAttribute('position', F32(P, 3)); g.setAttribute('normal', F32(N, 3)); g.setAttribute('aCol', F32(C, 3)); g.setAttribute('aFlap', F32(Fl, 3)); g.setIndex(X);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 20);
  const look = o.look, PT = PAINTS[look], LL = LAMP_LIGHT[look], c = (hx, m = 1) => ({ value: new THREE.Color(hx).multiplyScalar(m) });
  const U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...seaRide(o.sea), uLamp: o.sky.shadow.uLamp, uBoat: o.sky.shadow.uBoat, uTime: { value: 0 },
    uLampCol: { value: new THREE.Color().setRGB((1 + LL.color[0]) / 2, (1 + LL.color[1]) / 2, (1 + LL.color[2]) / 2) }, uFillCol: c(PT.fill), uBounce: c(PT.haze, 0.16),
    uFoam: c(look ? '#f6dfc4' : '#eef4f6', 0.86), uKey: { value: LL.key }, uFill: { value: LL.fill } };
  const flaps = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: paddleVert(T), fragmentShader: paddleFrag(T), fog: true, side: THREE.DoubleSide }));
  flaps.frustumCulled = false; flaps.name = 'paddles';
  // the foam and first crests' layer: from the ledge's foot out to 26 m toward the bay, along the whole bank
  const cp = [], cb = [], ci = [], NA = Math.round(160 * (o.detail < 0.9 ? 0.6 : 1)), rows = [-(Pd.inset - 1.75), -1.6, -0.7, 0, 0.7, 1.5, 2.6, 4.5, 7.5, 12, 18, 26], nr = rows.length;
  for (let i = 0; i <= NA; i++) { const b = (Pd.from - 0.3 + (Pd.count * Pd.pitch + 0.6) * i / NA) * RAD;
    for (const d of rows) { const r = SHELL.R - Pd.inset - d; cp.push(Math.sin(b) * r, 0, -Math.cos(b) * r); cb.push(b, d); } }
  for (let i = 0; i < NA; i++) for (let j = 0; j < nr - 1; j++) { const k = i * nr + j; ci.push(k, k + 1, k + nr, k + 1, k + nr + 1, k + nr); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', F32(cp, 3)); cg.setAttribute('aBank', F32(cb, 2)); cg.setIndex(ci); cg.boundingSphere = g.boundingSphere;
  const crests = new THREE.Mesh(cg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: CREST_VERT, fragmentShader: crestFrag(T), fog: true, transparent: true, premultipliedAlpha: true,
    depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  crests.frustumCulled = false; crests.renderOrder = 2; crests.name = 'paddle-foam-and-crests';
  return { objects: [flaps, crests], uniforms: U, triangles: X.length / 3 + ci.length / 3, update(dt, time) { U.uTime.value = time; } };
}

// ---- THE MOBILE OVER THE BAY: the low cloud boards (the part's dealLow: farthest along first), each on its two
// ropes from its travelling beam (hair wires on up to the dome over those near the line); their IMAGES in the glass
// sea (the same triangles drawn once more by the part's image material, laid in the order of the deal: the
// farthest first); and THE SHADE THEY LAY ON THE WATER (next). The boards go back to makeMachines unbuilt (G: it
// draws them from the part's one pool, joined with the high boards' by coat); the shade's layer is built here.
// o: { low, mats (the part's materials), look, detail, sky, sea, lamp (the lamp's place at the middle of its creep) }
//
// THE LOW BOARDS' SHADE ON THE WATER IS A SHADOW ON A MIRROR, by the hero's own law (its SHADOW, SEA_BODY and
// WATER_SHADE): where a board stands between the lamp-sun and the water, the lamp's part goes off THE WATER'S BODY
// LIGHT and off nothing else. The mirrored painting, the images laid on the sea and the lamp's own image keep
// their whole light; nothing is multiplied over the sea and no dark coat lies on it.
// THE LAW (lowShade: the one function the build bakes with and the proof counts with): from a place of the water
// the lamp's round is as wide as the hero's half-shade rates make it (SHADOW.core across the light, drawn out by
// the light's slant; SHADOW.drum in height where the light grazes); the shade there is the share of that round
// which the board's own outline hides (its heaps and its flat base, as the board stands across the light at its
// throw); a board narrower or lower than its half-shade throws only a share.
// WHERE IT FALLS: the lamp stands 21 to 24 m over the water and a board's base 8 to 30 m: the light passes UNDER
// a board, so its shade begins far behind it (a hundred metres and more) and only the lowest boards' reaches the
// water inside the wall at all: a faint broad half-shade toward the wall's foot (the proof prints how many
// boards of a seed shade the water, the most of the lamp any hides and what the water then shows). NO SHADE LIES
// UNDER A BOARD: what seats a board on the water is its image.
// IT IS BAKED ONCE, at the build, into one map (LOWSHADE.texel m to a texel; at each place the most of the boards'
// shares; a share under LOWSHADE.least is nothing and is taken off every share, so no edge is left where a shade
// ends), for the lamp and the boards at the middle of their creeps (a creep moves a shade by a small part of its
// own half-shade), and laid by one layer of cells of the water's own face (they ride its swell), drawn straight
// after the sea and before every image. A fragment TAKES OFF what the sea's own paint gave the body there of the
// lamp's part (the sea's uDeep * uLampCol * uKey * SEA_BODY.key, less where our boat's own shade has taken it
// already), thinned by the mirror's own law (looked along, the water is all mirror: SEA_BODY.straight): the one
// place where this layer reads the eye, and it reads it as light does.
// NOT JOINED (said plainly): the bay's own shades are another map and another layer; where a bay thing's shade and
// a board's lie over one another each takes its own share, so the two together can take more of the lamp's part
// than the body has (the honest mend: one map for both parts). And the painted wall and our boat on the wall leg
// do not take this half-shade: their light is the hero's.
export const LOWSHADE = { texel: 3, least: 0.02, pad: 24 };
// the share of the lamp's round that the low board b hides from the place (x, z) of the still water. lamp: the
// lamp's place; thick: a board's thickness (the part's BOARD.thick)
export function lowShade(b, lamp, x, z, thick) {
  const dx = lamp.x - x, dz = lamp.z - z, hd = Math.hypot(dx, dz) || 1e-6, T = Math.hypot(hd, lamp.y), f = b.face * RAD, nx = Math.sin(f), nz = -Math.cos(f);
  const den = (dx * nx + dz * nz) / T; if (Math.abs(den) < 1e-4) return 0;                    // (the light runs along the board's plane)
  const sc = ((b.x - x) * nx + (b.z - z) * nz) / den; if (sc <= 0 || sc >= T) return 0;      // the throw: metres from the board to the place, along the light
  // where the light to this place passes the board's plane: metres across the board from its middle, metres up from it
  const u = (x + dx / T * sc - b.x) * b.ex[0] + (z + dz / T * sc - b.z) * b.ex[1], v = lamp.y / T * sc - b.y;
  // the hero's half-shade there (pa across the light, pv in height: its rates times the throw); how squarely the
  // board stands across the light (cu) and how upright the light's own cross-section is (cv)
  const nd = lamp.y / T, pa = SHADOW.core / T / Math.max(nd, SHADOW.slantFloor) * sc + 0.004, pv = (SHADOW.core + (SHADOW.drum - SHADOW.core) * (1 - nd) * (1 - nd)) / T * sc + 0.004;
  const cu = Math.abs(b.ex[0] * dz - b.ex[1] * dx) / hd, cv = hd / T, o = b.o, base = o.vMin * b.hh;
  const half = (o.uR - o.uL) / 2 * b.hw, tall = (o.vMax - o.vMin) / 2 * b.hh;
  if ((base - v) * cv > pv) return 0;                                 // (the light passes under the base by more than its half-shade: no shade, as below)
  // THE FLAT BASE: how far over it the light passes, soft by the half-shade in height (where the light passes
  // under the base, the part of the lamp's round that still stands over it). THE HEAPS: how far inside each heap's
  // round, soft by the half-shade the way that round's nearest edge faces (a round seen aslant is cu wide and cv
  // tall), read no lower than the base (the part of the lamp's round that the base lets through lies over it); the
  // most of the heaps. The outline is the heaps over the base: the two together
  let heaps = 0; const vq = Math.max(v, base);
  for (const h of o.heaps) { const qx = u - h[0] * b.hw, qy = vq - h[1] * b.hw, l = Math.hypot(qx, qy) || 1e-6, a = qx / l * cu, w = qy / l * cv, n = Math.hypot(a, w) || 1e-6, ca = a / n, pen = Math.sqrt(pv * pv + (pa * pa - pv * pv) * ca * ca);
    heaps = Math.max(heaps, 1 - ease01(((l - h[2] * b.hw) * n + pen) / (2 * pen))); }
  const over = 1 - ease01(((base - v) * cv + pv) / (2 * pv));
  // (a board narrower or lower than its half-shade throws only a share: its half width and half height over the half-shade's)
  return heaps * over * Math.min(1, (half * cu + thick / 2) / pa) * Math.min(1, tall * cv / pv);
}
const ease01 = (t) => { const q = Math.min(Math.max(t, 0), 1); return q * q * (3 - 2 * q); };
const LOW_SHADE_VERT = /* glsl */`
${GLSL_RIDE}
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vW = vec3(position.x, seaY(position.xz) + .04, position.z);
  vec4 mvPosition = viewMatrix * vec4(vW, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LOW_SHADE_FRAG = /* glsl */`
${GLSL_SHADOW}
${GLSL_RIDE}
uniform sampler2D uShadeMap; uniform vec4 uShadeBox; uniform vec3 uDeep, uLampCol; uniform float uKey;
varying vec3 vW;
#include <fog_pars_fragment>
void main(){
  vec2 xz = vW.xz; float fw = max(length(fwidth(xz)), 1e-3);
  float m = texture2D(uShadeMap, (xz - uShadeBox.xy) * uShadeBox.zw).r;
  // how much of the body the eye has there (the sea's own law): the water's facing is the swell's own slope, as
  // the sea's paint takes it (filtered by the pixel's footprint); the mirror takes the rest
  float sk = ${fl(SWK)} * dot(xz, vec2(${fl(SWD[0])}, ${fl(SWD[1])})), sl = ${fl(SWELL.height / 2 * SWK)} * cos(sk - ${fl(SWW)} * uSeaTime) * seaEase(xz) * (1. - smoothstep(.9, 2.6, fwidth(sk)));
  vec3 N = normalize(vec3(-sl * ${fl(SWD[0])}, 1., -sl * ${fl(SWD[1])})), V = normalize(cameraPosition - vW);
  float cv = clamp(dot(N, V), 0., 1.), fr = ${fl(SEA_BODY.straight)} + ${fl(1 - SEA_BODY.straight)} * pow(max(1. - cv, 1e-4), 3.);
  float ours = boatShadeOn(vec3(xz.x, 0., xz.y), vec3(0., 1., 0.), min(fw, 2.));
  vec3 take = uDeep * uLampCol * (uKey * ${fl(SEA_BODY.key)} * m * (1. - ours) * (1. - fr));
  #ifdef USE_FOG
    take *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(take, 0.);                                       // (laid by taking away: what the sea drew there stays, less this)
}`;
export async function makeMobile(ctx, T, o) {
  const { Geo, V3 } = T, G = new Geo(); G.thin = new Geo();
  const S = LOWSHADE, lamp = o.lamp, R1 = SHELL.R - 1, boxes = [];
  for (const b of o.low) {
    T.buildBoard(G, null, b, { detail: o.detail, low: true, part: 1 }); await ctx.yield();
    T.buildBoard(G, null, b, { detail: o.detail, low: true, part: 2 }); await ctx.yield();
    T.buildBoard(G, null, b, { detail: o.detail, low: true, part: 3 });
    // the stretch of water its shade can reach: from its line's two ends on along the light to the wall's foot
    const xs = [], zs = [];
    for (const q of [b.o.uL, b.o.uR]) { const ex = b.x + b.ex[0] * q * b.hw, ez = b.z + b.ex[1] * q * b.hw, dx = ex - lamp.x, dz = ez - lamp.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
      const bq = ex * ux + ez * uz, t = -bq + Math.sqrt(Math.max(bq * bq - (ex * ex + ez * ez) + R1 * R1, 0)); xs.push(ex, ex + ux * t); zs.push(ez, ez + uz * t); }
    boxes.push([Math.min(...xs) - S.pad, Math.min(...zs) - S.pad, Math.max(...xs) + S.pad, Math.max(...zs) + S.pad]);
    await ctx.yield();
  }
  // THE SHADE'S MAP (LOWSHADE): a lattice S.texel m apart over the boards' stretches; at each place of the water
  // inside the wall the most of the boards' shares, less S.least. A board is counted over its own stretch, one
  // board to a step of the build
  const x0 = Math.floor(Math.min(...boxes.map((q) => q[0])) / S.texel) * S.texel, z0 = Math.floor(Math.min(...boxes.map((q) => q[1])) / S.texel) * S.texel;
  const NX = Math.max(1, Math.ceil((Math.max(...boxes.map((q) => q[2])) - x0) / (2 * S.texel))), NZ = Math.max(1, Math.ceil((Math.max(...boxes.map((q) => q[3])) - z0) / (2 * S.texel))), W = 2 * NX + 1, Hh = 2 * NZ + 1, data = new Uint8Array(W * Hh);
  for (let k = 0; k < o.low.length; k++) { const b = o.low[k], q = boxes[k], i0 = Math.max(0, Math.floor((q[0] - x0) / S.texel)), i1 = Math.min(W - 1, Math.ceil((q[2] - x0) / S.texel)), j0 = Math.max(0, Math.floor((q[1] - z0) / S.texel)), j1 = Math.min(Hh - 1, Math.ceil((q[3] - z0) / S.texel));
    for (let j = j0; j <= j1; j++) { const z = z0 + j * S.texel;
      for (let i = i0; i <= i1; i++) { const x = x0 + i * S.texel; if (x * x + z * z > R1 * R1) continue;
        const s = Math.round(Math.min(Math.max(lowShade(b, lamp, x, z, T.BOARD.thick) - S.least, 0), 1) * 255); if (s > data[j * W + i]) data[j * W + i] = s; } }
    await ctx.yield(); }
  // the layer's cells, two texels on a side: every cell that holds any shade at all (so no edge is left: a cell
  // left out has none at any of its places)
  const sp = [], si = [], seen = new Map(), vert = (i, j) => { const key = j * W + i; let n = seen.get(key); if (n === undefined) { n = sp.length / 3; sp.push(x0 + i * S.texel, 0, z0 + j * S.texel); seen.set(key, n); } return n; };
  for (let cj = 0; cj < NZ; cj++) for (let ci = 0; ci < NX; ci++) { let on = false;
    for (let j = 2 * cj; j <= 2 * cj + 2 && !on; j++) for (let i = 2 * ci; i <= 2 * ci + 2; i++) if (data[j * W + i]) { on = true; break; }
    if (on) { const a = vert(2 * ci, 2 * cj), b = vert(2 * ci + 2, 2 * cj), c = vert(2 * ci + 2, 2 * cj + 2), d = vert(2 * ci, 2 * cj + 2); si.push(a, b, c, a, c, d); } }
  await ctx.yield();
  // (the low boards' bodies, thin members and images are drawn from the part's one pool: G goes back to makeMachines,
  // which joins it with the high boards' and the rails' by coat; only the shade's layer is this function's own mesh)
  const F32 = (a, n) => new THREE.Float32BufferAttribute(a, n), mats = o.mats;
  const objects = [], map = { data, W, H: Hh, x0, z0, texel: S.texel, cells: si.length / 6, mesh: null };
  if (si.length) {                                                     // (a deal none of whose boards shades the water lays no layer)
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', F32(sp, 3)); sg.setIndex(si); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 40);
    const tex = new THREE.DataTexture(data, W, Hh, THREE.RedFormat, THREE.UnsignedByteType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.unpackAlignment = 1; tex.needsUpdate = true;
    // THE SEA'S OWN LIGHT, by reference (its deep, its lamp's colour and part), so that what the layer takes off is what the sea gave
    const ou = (o.sea && o.sea.uniforms) || {}, MU = mats.uniforms;
    const U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...seaRide(o.sea), uLamp: o.sky.shadow.uLamp, uBoat: o.sky.shadow.uBoat, uShadeMap: { value: tex },
      uShadeBox: { value: new THREE.Vector4(x0 - S.texel / 2, z0 - S.texel / 2, 1 / (W * S.texel), 1 / (Hh * S.texel)) }, uDeep: ou.uDeep || MU.uDeep, uLampCol: ou.uLampCol || MU.uLampCol, uKey: ou.uKey || MU.uKey };
    const shade = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: LOW_SHADE_VERT, fragmentShader: LOW_SHADE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, blending: THREE.CustomBlending, blendEquation: THREE.ReverseSubtractEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }));
    shade.renderOrder = 1.2; shade.name = 'low-boards-shade-on-water'; objects.push(shade); map.mesh = shade; }
  for (const m of objects) m.frustumCulled = false;
  return { objects, G, shade: map, triangles: 2 * (G.triangles + G.thin.triangles) + si.length / 3 };
}

// ---- THE HIGH BOARDS' SHADOWS ON THE PAINTED SKY: a thin layer a hand inside the shell. Every board throws the
// lamp-sun's shadow OF ITS OWN SHAPE (its heaps and its flat base, read from the boards' own texture: the outline
// that is cut is the outline that is thrown), from the lamp's own place at every draw, the board at its creep.
// It is a soft shadow and a light one: its edge spreads with the way from board to wall, it takes a quarter to a
// third of the paint's light at its heart (a warm grey: the paint is multiplied by SHADE.tint), and a board whose shadow
// would fall more than SHADE.far m behind it throws none (it fades out over the last fifth of that way).
// THAT LIMIT AND THIS SOFTNESS ARE TYPED, NOT LIGHT'S (said plainly): a real lamp's shadow stands at every throw,
// only softer by the lamp's own round; here the edge spreads 3 m and 3.5 in a hundred of the throw, and past
// SHADE.far m of throw there is no shadow. Both are rules of the place (the throw's metres from board to wall, the
// same from every eye), kept as a choice of this world's look: a board's shadow is seen only where the wall
// stands close behind it. THE HONEST MEND would be to throw every board's shadow at every throw,
// its edge spreading by the hero's own half-shade rates (SHADOW), with no limit.
export const SHADE = { far: 140, tint: [0.775, 0.72, 0.675], inset: 0.8, edge: 14, cols: 12, rows: 7 };
const WALL_SHADE_VERT = (T) => /* glsl */`
attribute vec3 aBoard;                                       // metres across the board, metres up it, its slot
uniform vec3 uSlot[${T.NSLOT}], uLamp; varying vec2 vQ; varying float vSlot, vFar;
#include <fog_pars_vertex>
void main(){
  vec3 pb = uSlot[int(aBoard.z + .5)] + position, d = pb - uLamp; float l = max(length(d), 1e-3); d /= l;
  float bq = dot(uLamp, d), t = -bq + sqrt(max(bq * bq - dot(uLamp, uLamp) + ${fl((SHELL.R - SHADE.inset) * (SHELL.R - SHADE.inset))}, 0.));      // where the lamp's ray through the board meets the shell
  vQ = aBoard.xy; vSlot = aBoard.z; vFar = t - l;
  vec4 mvPosition = viewMatrix * vec4(uLamp + d * t, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALL_SHADE_FRAG = (T) => /* glsl */`
uniform sampler2D uHeaps; uniform vec3 uTint; varying vec2 vQ; varying float vSlot, vFar;
${T.GLSL_HEAP}
${LAYER_FOG}
void main(){
  int row = int(vSlot + .5); vec4 m = heapAt(0, row); int n = int(m.x + .5); float d = 1e9;
  for (int j = 0; j < ${T.BOARD.heaps}; j++){ if (j >= n) break; vec4 h = heapAt(j + 2, row); d = min(d, length(vQ - h.xy) - h.z); }
  d = max(d, m.z - vQ.y);                                                               // the flat base
  float soft = 3. + .035 * vFar, sh = (1. - smoothstep(-soft, soft, d)) * (1. - smoothstep(${fl(SHADE.far * 0.8)}, ${fl(SHADE.far)}, vFar)) * (1. - layerFog());
  gl_FragColor = vec4(mix(vec3(1.), uTint, sh), 1.);                                    // (the paint behind is multiplied by this)
}`;
// o: { boards (the high ones), mats }. Returns { objects, triangles }.
export function makeShades(ctx, T, o) {
  const P = [], Q = [], I = [], nu = SHADE.cols, nv = SHADE.rows;
  for (const b of o.boards) { const k0 = P.length / 3, x0 = b.o.uL * b.hw - SHADE.edge, x1 = b.o.uR * b.hw + SHADE.edge, y0 = b.o.vMin * b.hh - SHADE.edge, y1 = b.o.vMax * b.hh + SHADE.edge;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const x = x0 + (x1 - x0) * i / nu, y = y0 + (y1 - y0) * j / nv; P.push(b.ex[0] * x, y, b.ex[1] * x); Q.push(x, y, b.slot); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = k0 + j * (nu + 1) + i; I.push(k, k + 1, k + nu + 2, k, k + nu + 2, k + nu + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aBoard', new THREE.Float32BufferAttribute(Q, 3)); g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 40);
  const MU = o.mats.uniforms, U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSlot: MU.uSlot, uLamp: MU.uLamp, uHeaps: MU.uHeaps, uTint: { value: new THREE.Vector3(SHADE.tint[0], SHADE.tint[1], SHADE.tint[2]) } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: WALL_SHADE_VERT(T), fragmentShader: WALL_SHADE_FRAG(T), fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
  m.frustumCulled = false; m.renderOrder = 0.5; m.name = 'cloud-boards-shadows-on-the-sky';
  return { objects: [m], triangles: I.length / 3 };
}
