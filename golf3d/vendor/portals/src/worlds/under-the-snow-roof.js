// UNDER THE SNOW ROOF (wilderness): late winter in Lapland seen from three centimetres tall. Everything is built
// 100 times life size. The flight follows a vole through the rooms under the snow of a sedge fen, each its own place:
// the thatch-ribbed runway, a lingonberry thicket, the root cellar under a birch with a cache of berries, an ice
// gallery, the hoar hall under a snow-bent willow where an ermine hunts, the room a fox digs into, the meltwater with
// a water shrew, a moss grotto, the tall hollow in the lee of a boulder with a shaft of light, the lichen garden, a ptarmigan's snow burrow,
// and the strike gallery where a great grey owl comes through the roof (the hero set piece,
// src/parts/under-the-snow-roof.js). The camera climbs out by the hole it leaves.
//
// World space is the hero's local space: the strike point is the origin, the camera arrives along -Z, the sun is
// on the left (-X). Galleries, rooms and branches are one height field G(s, t) over path coordinates (s = metres
// along the path, t = metres to the right of it); the roof underside, the floor and every scatter read it.
// All light comes from one GLSL roof field (snow thickness -> colour and brightness) shared by every material.
// The shell is zoned along the flight (attribute aZ): the walls and the low roof beside them are drifted pillows of snow with
// a bank slumped onto the floor at their foot (everywhere but the ice gallery, the hall and the fox's room); the roof of the
// runway, the thicket and the lichen garden's porch is ribbed wind crust; a lattice of buried willow twigs holds the vault
// over the meltwater, the grotto and the room before the boulder; chains of cup crystals hang along the whole way wherever the roof is high enough.
// Wall thatch stands in front of the pillows all the way; a blade is cut off where it would come too near the eye's line (path.isClear
// with 2.5 m asked: it measures to the path's sampled points, so more than 2.0 m of the line itself holds). The snow roof, the sedge
// and the floor are the thread through the whole way; each stretch of wall the eye passes between the runway and the last straight,
// the hall apart, carries an accent of the room it lies by (in metres along the way):
//  118-170 the ice gallery    ice lenses in the walls, lit where the roof is thin; the thatch rimed
//  254-354 the fox's room and the meltwater    wet walls that keep their pillows under the glaze, with ice lenses by the meltwater
//             (296-354); runnels on the floor; the stream's bank a soaked dark margin with a lace of ice at the water's edge; the thatch
//             wet: deeper in colour, toward amber, as light as the plain blade, with a sheen and beads of water
//  354-446 the grotto and the boulder    moss up the walls in cushions; stones with a bush of lichen at the wall's foot; the thatch mossed at the foot
//  446-560 the lichen garden and the ptarmigan    bushes of reindeer lichen and clumps of cup lichen; wind crust bare on the walls; the thatch bleached to a pale warm straw, lighter than the plain blade, broken short;
//             the bird's down lies caught on the floor from 500 m to 566 m of the way and round its burrow
//  560-640 the last straight  the lichen thins out and ends at 566 m; the down blown along the way thins from there and ends at 606 m (round the burrow it lies to
//             27 m from the bird); small tufts of hoar and low drifts of blown snow stand on the floor either side of the way; plain sedge
// The thatch itself is the full deal everywhere, every blade and rib. Two things make it: the deal (every blade's place, the draws
// and the counts: one deal for the whole way, which nothing laid on by place alters) and what is laid over the deal by place: the
// states (rimed; wet with beads; mossed at the foot; bleached and broken short, so that a broken blade ends early and carries no
// feather past its break) and the lift of the lee's blades with the lee's roof. It takes the state of the room it lies by (stateAt): rimed from
// 122 to 166 m, wet from 258 to 350 m, mossed at the foot from 358 to 442 m, bleached and broken short from 450 to 552 m, each eased
// over 4 to 8 m at its ends; from 560 m, as before 114 m and in the hall, the state is nought and the sedge is plain. No state is
// darker than the plain sedge.
// THE HOLLOW IN THE BOULDER'S LEE (414 to 440 m of the way) is the one tall chamber on the eye's line. It is a thing snow does:
// where the wind turns round the rock the pack is scooped out against its face, a vault that climbs from the roof of the boulder's
// room (17 m) to 26 m at the rock, where the boulder has held the snow off and a gap stands open at its shoulder. The vault lifts the
// roof only where the room already stands 8 m high and more, eased in slowly from there (whole where the room stands 15.5 m: it
// grows out of the room's own roof with no step), so the foot of every wall, the floor and the animal's run are the
// room's own; the thatch is dealt on the roof as the room alone leaves it (every blade of the whole way as without the hollow) and
// the blades of the lee ride up with its roof. The light that comes down the gap is by place and by the hour the deal gives (LEE):
// at noon a shaft of warm daylight through the air with snow dust sifting down it on the world's clock, and a warm pool where it
// lands, on the floor the animal we follow crosses and on the lichen of the boulder's foot; in a thaw the same through wet air,
// softer; in a ground blizzard a veiled grey-white sun, weak; at twilight the cold peach of the sky, low; by night moonlight, cold
// and thin, and no warm light at all. The pool is a soft round of light on the floor and fades up the walls; the hour's own light
// and the exposure are as everywhere else, so nothing of the whole brightens or darkens on the way in or out. The shaft has no
// line anywhere: its edge is ragged and thins into the air, and it goes out before the snow of the roof and the walls it enters
// (each point of it knows the air over it: makeShaft, aOpen).
// Each kind of the way's dressing is dealt from a stream of its own, metre by metre along the way,
// and keeps more than 2.0 m from the eye's line (path.isClear with 2.5 m asked, which measures to the path's sampled points); none of
// it hangs over the line: a moss cushion ends 2.5 m and its own reach short of the line's middle by place. The moss cushions, the
// lichen of the way (bushes, cups, and the stones that bear a bush), the hoar tufts and the drifts keep off the middle of the followed
// animal's run by half its width as it runs (3.48 m, from its own make: VOLE_HALF) and their own reach. A lingonberry sprig keeps
// its whole body (stem, leaves, berries) more than 2.0 m from the eye's line by place: one that would reach nearer is made smaller
// where it stands (sprigFit).
// What reads the eye, and for what: every material takes the direction to where the eye IS for its facing and sheen, the distance to it
// for fading fine grain, and the pixel's footprint (the change of a surface coordinate across one pixel, fwidth) so that nothing drawn
// is finer than a pixel: the ice lenses, moss grain and crust ledges of the walls (ROOF_FS), every layer of the floor's grain, by the
// long side of the pixel's footprint on the slanting floor, and the runnels (FLOOR_FS), the rime,
// glitter, moss and broken ends of the thatch by the rooms (SEDGE_FS), the beads of water on the wet thatch (FROST_FS), the barbs of
// the down (LEAF_FS), the locks of the followed animal's
// coat and the tufts of its outline (CRIT_FS), the crystals, hair cracks, lichen rosettes and every bump of the stone (ROCK_FS: the
// length of the change of the world position across one pixel, and the change of each line's own field across one pixel).
// Two things in the lee are light in the air and not bodies, and thin out near where the eye IS (the eye's line passes within
// 1.6 m of the shaft's foot): the skin of a light shaft thins within 7 m of the eye and is gone at 2 m (SHAFT_FS, every shaft);
// the lee's dust thins within 4 m and is gone at 1.5 m (by the mote's distance from the eye's place).
// The other clouds of points (crystals, powder, snow dust) fade near the eye by the depth along the look (the springtails on
// the floor also far off: they go out between 60 and 90 m of that depth), and every cloud of
// points takes its points' size from that depth; the haze of the air thickens by the same depth, as the engine's fog does in
// every world. Nothing else reads where the eye looks.
// The animal we follow moves on its own stride (the distance it has run over its stride): feet, thighs, the rock of its haunches and
// the lift and bob of its tail take their phase from that and from nothing else; the tail's swing from side to side runs on the
// stride and on the world's clock together. Its head is its body's: the fur of the head is the body's colour (a lemming's a shade
// deeper, its black the stripe that runs on over the crown, and its ears), its muzzle, cheeks and throat a warm cream, and the
// roof's light that fills and rims the head carries a quarter of the roof's hue, on the back a little over half (CRIT_FS), in
// every look.
//
// Scripted beats (u): 0 the vole sits upright in the sedge arch, 24 m ahead on the axis, side on, a stem at its mouth; it has dropped
// and gone by 0.012 and then runs the whole way without a stop, along one wall and across to the other, its middle 21.6 m ahead of the
// eye (twice it bolts further, across the ermine's line before the ermine is), to its side hole (it turns in at 0.752 and is gone
// by 0.766); 0.06-0.10 the berry thicket; 0.16-0.20 the ice gallery;
// 0.19-0.34 the hall: at 0.27 the ermine bounds out of the gallery on the left at the hall's far end and across the floor 34 m
// ahead; the feeding voles bolt for their burrow as it comes within 34 m of each (rare: a ptarmigan's foot punches the hall roof
// open at 0.232); the fox digs through the roof as its room comes into view (the hole opens 58 m ahead of the eye, the head is
// down from 48 m, the paw from 40 m, both are gone as we pass under; a torn collar of pushed snow, slabs at the sides and crumbs over
// the nape, hangs round its neck under the roof, its neck goes into shadow inside the hole, and crumbs fall from the rim on the
// world's clock; the head comes out of a dark mouth of broken snow, wider than the neck, whose torn lip hangs down behind it, a
// mound of fallen snow lies under it, and its whiskers are single hairs); the hall's willow stems are rimed in streaks and take the hall's light; the water shrew, slate above
// and silver below, sits on the bank of the meltwater (337 m of the way) from when the eye is 68.5 m short of it until the eye is
// 16 m off, then runs down the bank keeping that lead for 7 m and turns into the wall, 12.3 m ahead of the eye as it goes in at
// 356 m (its keys are reckoned from those metres over the way's length); 0.465-0.60 the look goes to the boulder's lee, lifts up its shaft as we come and
// rests on the lit hollow while it is ahead of the eye, going back down the tunnel as we come alongside, 0.553-0.577 (a
// function of the flight's progress alone), the animal we follow crossing the pool of light at the shaft's foot at about 0.54; hoof-falls at 0.392 0.486 0.582 0.651; the ermine crosses the lichen garden at 0.6175; 0.60-0.65 the
// ptarmigan wakes and watches us pass; the owl's shadow crosses the snow above twice, the bird's own shape seen from below (two
// wings with fingered tips, the head a blunt bump between them, a short fanned tail), a blue-grey shade of the lit snow: under
// the whole shade the snow has the lesser of its own light there and one even tone (0.484 of middling snow's light where the
// snow is as bright as that, a little more where it is brighter), so the bright and the middling come out nearly alike and
// snow already dimmer than the tone is untouched; never more than its own light (the part's owlShaded), on the roof, the walls and the floor: small and soft 0.718-0.743, tilting from wing to wing; larger
// 0.745-0.793, when it comes over from behind, hangs on beating wings where the gallery's roof grows broad (0.756-0.780),
// its edge growing crisp, the look lifting to it (0.748-0.792), and darts on down the gallery to the place it will strike;
// it follows the strike's own clock, which is the flight's progress (the hero's owlShadowAt), and nothing of the eye; as the bird
// goes through, the shade of its spread wings lies on the roof just up the gallery from the hole, the whole bird's shape, heaving
// (0.821-0.892); the roof sags from 0.79 and pales, fractures
// run along it toward us (0.794-0.814) shedding a veil of crystals, burst 0.83, wrench 0.875 (pace lingers there; blocks 2 to 3 m
// across thud down and roll to rest 4 m either side of the eye's line); pull-up 0.90; 60 m up the shaft to the portal, the owl
// rowing away to the upper left.
// Looks by seed (ctx.vary.hour honoured): noon, polar twilight, night with aurora, thaw, ground blizzard; season
// (early / mid / April) and cast (voles or lemmings, ermine or least weasel, reindeer hooves or hare pads) too.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import { buildHero, ROOF_Y, CRACK_GLSL, DOME_GLSL, OWL_GLSL } from '../parts/under-the-snow-roof.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const SIN_P = Math.sin(65 * DEG), COS_P = Math.cos(65 * DEG), HOLE_Z = -ROOF_Y * COS_P / SIN_P;
// piecewise curve through knots [[x, y], ...]; smooth = ease between knots
const pw = (K, x, smooth = false) => {
  if (x <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const t = (x - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return lerp(K[i - 1][1], K[i][1], smooth ? t * t * (3 - 2 * t) : t); }
  return K[K.length - 1][1];
};
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material: noise, the roof light field, the daylight of the strike, fog
// ---------------------------------------------------------------------------------------------------------
const GLSL_N = /* glsl */`
float h11(float n){ return fract(sin(n*127.1+1.7)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=mix(mix(h31(i),h31(i+vec3(1.,0.,0.)),f.x), mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x), f.y);
  float b=mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x), mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x), f.y);
  return mix(a,b,f.z); }
`;
const GLSL_RF = /* glsl */`
uniform vec4 uPatch[32]; uniform vec4 uHoof[4]; uniform vec4 uPool0, uPool1, uPool2, uPool3, uPool4, uAur; uniform vec3 uHoleR; uniform vec2 uHoleR2; uniform vec4 uWell;
uniform vec3 uTurq, uCobalt, uDayCol, uShadowCol, uLeeCol; uniform vec4 uLee;
uniform float uTime, uGlow, uGreen, uBand, uSeedF, uDay, uLobe, uGrey, uThickOff, uThickAmp, uPatchK, uGreenThin, uDim, uSwell, uAurBand;
uniform float uDome;
const vec3 AXG = vec3(0.0, ${SIN_P.toFixed(5)}, ${(-COS_P).toFixed(5)});
float rfFbm(vec2 p){ return 0.57*vn2(p) + 0.29*vn2(p*2.03+17.1) + 0.14*vn2(p*4.07+5.3); }
${DOME_GLSL}
// snow thickness over a point of the floor plan, 0.06 (a skin) .. 1 (a deep drift)
float rfThick(vec2 p){
  // the patches where the roof is thin (w > 0) or deep (w < 0). Under a thin patch the drift's own swells lie nearly flat, so that the
  // patch is thin, and glows, whatever the drift does on this seed
  float pk = 0., pn = 0.;
  for (int i = 0; i < 32; i++) { vec2 d = p - uPatch[i].xy; float e = uPatch[i].w*exp(-dot(d,d)/max(uPatch[i].z*uPatch[i].z, 1.)); pk += max(e, 0.); pn += min(e, 0.); }
  float hold = 1. - min(3.*pk, 0.9);
  float th = 0.56 + uThickOff + hold*uThickAmp*(rfFbm(p*0.045+uSeedF) - 0.5);
  // the drift lies in long swells: deep (dim cobalt) here, a clear blue-turquoise skin there; none of it over the strike gallery
  { vec2 dh = p - vec2(0., ${HOLE_Z.toFixed(3)}); th += hold*uSwell*(vn2(p*0.0125 + uSeedF*1.7 + 3.1) - 0.56)*(1. - exp(-dot(dh, dh)/2500.)); }
  th -= uPatchK*(pk + pn);
  return clamp(th, 0.06, 1.);
}
// what stands or passes on the snow above: hooves (compressed columns) and the owl's shadow
// x: the pressed column under a hoof (dark), y: the ring of snow squeezed thin round it (bright)
vec2 hoofCR(vec2 p){
  vec2 cr = vec2(0.);
  for (int i = 0; i < 4; i++) {
    vec2 d = p - uHoof[i].xy; float r = length(d) - 5.3; d.x = abs(d.x) - uLobe;
    cr += uHoof[i].z*vec2(exp(-dot(d,d)/11.), exp(-r*r/2.2));
  }
  return min(cr, vec2(1.));
}
// the owl's shadow on the snow above (owlShaded: the hero's own shape and shade, which its roof disc draws too)
${OWL_GLSL}
// the light of snow of middling depth, which the owl's shade is measured against (0.47: what such snow lets through, exp(-1.5*0.5))
float owlRef(){ return dot(mix(uTurq, uCobalt, 0.5), vec3(0.3, 0.5, 0.2))*uGlow*0.47; }
float rfDim(vec2 p){
  return 1. - 0.2*hoofCR(p).x;                                                    // what lies under a hoof-fall dims a little; the roof itself goes dark (ROOF_FS)
}
// light leaving the roof underside above p (linear HDR): thin snow is bright turquoise, thick is dim cobalt. rfLightBare: all of it
// but the owl's shade; rfLight (below it): with the shade, which everything under the roof takes
vec3 rfLightBare(vec2 p){
  float th = rfThick(p);
  vec3 c = mix(uTurq, uCobalt, smoothstep(0.2, 0.8, th))*uGlow*exp(-1.5*th);
  // the green of the aurora comes through in slow bands (uAurBand), whole again over the strike gallery; a thaw is green-white where the roof is thin
  float aur = 1.;
  if (uAurBand > 0.) { vec2 dh = p - vec2(0., ${HOLE_Z.toFixed(3)}); float bn = smoothstep(0.3, 0.7, vn2(vec2(p.x*0.021 + p.y*0.012 + uTime*0.03, p.y*0.019 - p.x*0.008) + 31.)); aur = mix(mix(1., bn*1.7, uAurBand), 1., exp(-dot(dh, dh)/3600.)); }
  c = mix(c, vec3(c.g*0.9, c.g*1.25, c.g*0.8), min(max(uGreen*aur, uGreenThin*(1. - smoothstep(0.08, 0.34, th))), 1.));
  c = mix(c, vec3(dot(c, vec3(0.3, 0.5, 0.2)))*vec3(0.92, 1.0, 1.1), uGrey);
  { vec2 da = p - uAur.xy; float ka = uAur.w*exp(-dot(da, da)/max(uAur.z*uAur.z, 1.)); c = mix(c, vec3(0.16, 1.0, 0.4)*(c.g*2.3 + 0.22), ka); }   // the aurora, where it stands over thin snow (night)
  // as the owl's weight comes onto the roof the pressed snow round the bulge darkens: by at most 0.07 of itself (the greatest
  // the hero gives uDim) at the hole's centre, falling to 1/e of that 60 m out
  { vec2 dh = p - vec2(0., ${HOLE_Z.toFixed(3)}); c *= 1. - uDim*exp(-dot(dh, dh)/3600.); }                  // the pressed snow round the bulge darkens
  // the paling dome brightens the roof round it: the roof's own light is multiplied by 1 + domeGain (DOME_GAIN at the hole's
  // centre, falling by the distance in plan from it to 1/e 30 m out) times uDome (0 before the bulge, 1 when the dome has paled,
  // 0 again once the roof is through). It is applied here, after the dim above: at the hole's centre, with the dome fully paled
  // and the dim at its greatest, the roof stands (1 + DOME_GAIN)*(1 - 0.07) times itself, so that it grows brighter there while
  // it is pressed when that product is over 1. The bands, the hoof-falls and the well's shade below are factors on
  // it like the rest; the well's daylight is added after and does not take it; the owl's shade is laid last of all, in rfLight,
  // as the lesser of all this and its one even tone. (The strike's roof disc applies the same gain before its own dim.)
  { vec2 dh = p - vec2(0., ${HOLE_Z.toFixed(3)}); c *= 1. + domeGain(dot(dh, dh))*uDome; }
  c *= 0.8 + 0.2*sin(p.x*0.2 + p.y*0.08 + rfFbm(p*0.04)*6. - uTime*0.4*uBand);
  c *= rfDim(p);
  vec2 dw = p - uWell.xy; float rw = length(dw)/max(uWell.z, 0.5);
  c *= 1. - 0.8*(1. - uWell.w)*exp(-rw*rw*1.6)*step(1., uWell.z);
  c += uDayCol*uWell.w*(3.2*(1. - smoothstep(0.75, 1.1, rw)) + 0.14*exp(-rw*rw*0.07));
  return c;
}
// (under the owl's whole shade the light is the lesser of rfLightBare's and the shade's one even tone: owlShaded)
vec3 rfLight(vec2 p){ return owlShaded(rfLightBare(p), p, owlRef()); }
// pools of daylight under the smaller openings: the ptarmigan's plunge hole, the fox's dig, the gap beside the boulder (x, z, radius, open)
float poolAt(vec2 p, vec4 q){ vec2 d = p - q.xy; return q.w*exp(-dot(d, d)/max(q.z*q.z, 1.)); }
// daylight let in by the strike (a cone down the shaft axis) and by the rare second well
vec3 dayAt(vec3 wp){
  vec3 q = wp - AXG*dot(wp, AXG); float cone = exp(-dot(q,q)/156.)*(1. - smoothstep(${(ROOF_Y + 1).toFixed(1)}, ${(ROOF_Y + 6).toFixed(1)}, wp.y));
  float amb = 0.16*exp(-dot(wp.xz, wp.xz)/2600.);
  vec2 dw = wp.xz - uWell.xy; float well = uWell.w*exp(-dot(dw,dw)/650.);
  // the light that comes down the gap in the boulder's lee (uLee: x, z, radius, strength; uLeeCol: its colour by the hour): a pool
  // on the floor where the shaft lands and on what stands low in it, fading up the walls
  vec2 dl = wp.xz - uLee.xy; vec3 lee = uLeeCol*uLee.w*exp(-dot(dl, dl)/max(uLee.z*uLee.z, 1.))*(1. - 0.75*smoothstep(3., 14., wp.y));
  return uDayCol*(uDay*(1.5*cone + amb) + well*0.4 + 0.85*(poolAt(wp.xz, uPool0) + poolAt(wp.xz, uPool1) + poolAt(wp.xz, uPool2) + poolAt(wp.xz, uPool3) + poolAt(wp.xz, uPool4))) + lee;
}
// the roof itself where something has opened it (0..1): a ragged disc of plain daylight
float holeAt(vec2 p, vec4 q, float rh){ float r = length(p - q.xy)/max(rh, 0.5) + 0.3*(vn2(p*0.55 + q.xy) - 0.5); return q.w*(1. - smoothstep(0.78, 1.02, r)); }
float holesAt(vec2 p){ return max(holeAt(p, uPool0, uHoleR.x), max(holeAt(p, uPool1, uHoleR.y), holeAt(p, uPool2, uHoleR.z))); }
// windows of clear ice in the roof with the moon behind them (night)
float lensAt(vec2 p){ return min(max(holeAt(p, uPool3, uHoleR2.x), holeAt(p, uPool4, uHoleR2.y)), 1.); }
// a surface lit by the roof: vivid keeps some of the albedo's own hue under the blue-green light
vec3 shade(vec3 alb, vec3 L, vec3 D, float kd, float vivid){
  vec3 Lv = mix(L, vec3(dot(L, vec3(0.25, 0.55, 0.2)))*vec3(1.04, 1.0, 0.92), vivid);
  vec3 c = alb*(Lv*kd*2.5 + uShadowCol*2.4 + D);
  return c + uShadowCol*0.55*exp(-dot(c, vec3(4., 8., 4.)));          // shadows fall to navy (#0E1E4A), never to black
}
`;
const FOG_VP = '#include <fog_pars_vertex>', FOG_V = '#include <fog_vertex>';
const FOG_FP = '#include <fog_pars_fragment>', FOG_F = '#include <fog_fragment>';
const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb *= 1.0 - fogF;
#endif`;
// end of every vertex main(): expects vec4 wp (world position)
const VEND = `vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;\n${FOG_V}\n`;
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
function mk(U, o) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...U, ...(o.uniforms || {}) }, fog: true,
    side: o.side ?? THREE.DoubleSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true, blending: o.blending ?? THREE.NormalBlending,
    vertexShader: `${FOG_VP}\n${GLSL_N}\n${GLSL_RF}\n${o.vs}`,
    fragmentShader: `${FOG_FP}\n${GLSL_N}\n${GLSL_RF}\n${o.fs}`,
  });
}

// ---------------------------------------------------------------------------------------------------------
// triangle soup builder: position, linear colour, one free vec4 (aA); smooth normals computed at the end
// ---------------------------------------------------------------------------------------------------------
class Soup {
  constructor() { this.p = []; this.c = []; this.a = []; this.i = []; this.k = 0; }
  v(x, y, z, c, a) { this.p.push(x, y, z); this.c.push(c[0], c[1], c[2]); this.a.push(a ? a[0] : 0, a ? a[1] : 0, a ? a[2] : 0, a ? a[3] : 0); return this.k++; }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  loft(rings, wrap = true) {
    for (let j = 0; j + 1 < rings.length; j++) {
      const r0 = rings[j], r1 = rings[j + 1], n = r0.length, m = wrap ? n : n - 1;
      for (let k = 0; k < m; k++) { const k1 = (k + 1) % n; this.quad(r0[k], r0[k1], r1[k1], r1[k]); }
    }
  }
  // tube along pts (V3[]); rad(t), col(t, ang) -> [r,g,b], attr(t) -> [4]; t runs 0..1 along it
  tube(pts, rad, sides, col, attr, cap = true) {
    const n = pts.length, rings = [], T = new V3(), N = new V3(0, 1, 0), B = new V3(), q = new V3();
    for (let j = 0; j < n; j++) {
      T.copy(pts[Math.min(j + 1, n - 1)]).sub(pts[Math.max(j - 1, 0)]).normalize();
      if (j === 0 && Math.abs(T.y) > 0.9) N.set(1, 0, 0);
      N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
      const t = j / (n - 1), r = rad(t), ring = [], at = attr ? attr(t) : null;
      for (let k = 0; k < sides; k++) {
        const a = k / sides * TAU, ra = rad.length > 1 ? rad(t, a) : r; q.copy(pts[j]).addScaledVector(N, Math.cos(a) * ra).addScaledVector(B, Math.sin(a) * ra);
        ring.push(this.v(q.x, q.y, q.z, col(t, a), at));
      }
      rings.push(ring);
    }
    this.loft(rings, true);
    if (cap) { const e = pts[n - 1], c = this.v(e.x, e.y, e.z, col(1, 0), attr ? attr(1) : null), r = rings[n - 1]; for (let k = 0; k < sides; k++) this.tri(c, r[k], r[(k + 1) % sides]); }
  }
  // ellipsoid with axes (rx, ry, rz); col(lat -1..1, ang) -> colour
  ball(c, rx, ry, rz, segs, rows, col, attr) {
    const rings = [];
    for (let j = 0; j <= rows; j++) {
      const la = -Math.PI / 2 + Math.PI * j / rows, cy = Math.sin(la), cr = Math.max(Math.cos(la), 0.02), ring = [];
      for (let k = 0; k < segs; k++) { const a = k / segs * TAU; ring.push(this.v(c.x + Math.cos(a) * cr * rx, c.y + cy * ry, c.z + Math.sin(a) * cr * rz, col(cy, a), attr)); }
      rings.push(ring);
    }
    this.loft(rings, true);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(this.a, 4));
    g.setIndex(this.i); g.computeVertexNormals();
    return g;
  }
}

// ---------------------------------------------------------------------------------------------------------
// materials of the snowpack: roof underside and hoar walls, floor
// ---------------------------------------------------------------------------------------------------------
const ROOF_VS = /* glsl */`
attribute float aG; attribute vec2 aZ; attribute vec4 aW;
varying vec3 vW; varying vec3 vN; varying float vG; varying vec2 vZ; varying vec4 vY;
void main(){
  vec3 p = position; vG = aG; vZ = aZ; vY = aW;
  float k = clamp(aG/3., 0., 1.);
  for (int i = 0; i < 4; i++) { vec2 d = p.xz - uHoof[i].xy; p.y -= 2.1*uHoof[i].w*k*exp(-dot(d,d)/15.); }
  // drifted walls: they belly in and out along their length (not at the foot, which the floor's bank takes)
  float wl = aZ.y*(1. - smoothstep(0.35, 0.8, abs(normal.y)))*clamp(aG/1.5, 0., 1.);
  p += normal*wl*(1.3*(vn3(p*0.19 + 3.) - 0.5) + 0.6*(vn3(p*0.41) - 0.5));
  vW = p; vN = normal;
  vec4 wp = vec4(p, 1.);
  ${VEND}
}`;
const ROOF_FS = /* glsl */`
uniform float uCrGrow, uHole;
varying vec3 vW; varying vec3 vN; varying float vG; varying vec2 vZ; varying vec4 vY;
${CRACK_GLSL}
// a wall of drifted snow in section (q: metres along it, metres up): lenses of clear ice lie in it, each a thin level band that pinches
// out at both ends. x: 1 inside one, y: 0 at its skin .. 1 at its heart; soft over a pixel (px) at its skin
vec2 iceLens(vec2 q, float px){
  float wv = q.y/0.85 + 0.45*vn2(vec2(q.x*0.09, 3.)), row = floor(wv), fy = fract(wv) - 0.5;
  float c = q.x/3.6 + h11(row)*9.3, id = floor(c), fa = fract(c) - 0.5, hh = h21(vec2(id, row)), hb = fract(hh*9.7);
  float a0 = 0.26 + 0.2*hb, t0 = (0.11 + 0.16*hh)*sqrt(max(1. - fa*fa/(a0*a0), 0.)), d = t0 - abs(fy - (hb - 0.5)*0.3);
  return vec2(step(0.42, hh)*smoothstep(0., 0.035 + px*1.2, d), clamp(d/max(t0, 1e-3), 0., 1.));
}
// drifted snow on a wall: rounded pillows, each lit from above and dark beneath, with a crease between neighbours (x: light, y: 0 in a crease)
vec2 pillows(vec2 q){
  vec2 i = floor(q), f = fract(q); float d1 = 8., d2 = 8., ry = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 c = i + g;
    vec2 r = g + vec2(h21(c), h21(c+17.3)) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; ry = r.y; } else if (d < d2) { d2 = d; } }
  d1 = sqrt(d1); d2 = sqrt(d2);
  return vec2(clamp(0.55 - 1.15*ry - 0.3*d1, 0., 1.), smoothstep(0., 0.2, d2 - d1));
}
float worley(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 1.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y));
    vec2 r = g + vec2(h21(i+g), h21(i+g+17.3)) - f; d = min(d, dot(r, r)); }
  return sqrt(d); }
// nearest and second nearest cell point, and a hash of the nearest cell
vec3 wor3(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8., id = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 c = i + g;
    vec2 r = g + vec2(h21(c), h21(c+17.3)) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h21(c + 5.1); } else if (d < d2) { d2 = d; } }
  return vec3(sqrt(d1), sqrt(d2), id); }
// cupped depth hoar: thin bright cup centres, thick dark ribs between them, at two sizes; close to the eye it resolves into
// separate crystals, each a flat facet of its own brightness with a dark seam round it
float cups(vec2 q, float fine){
  float cup = worley(q*0.3 + uSeedF), cup2 = worley(q*0.95 + 3.7);
  float c = (1.28 - 0.95*smoothstep(0.08, 0.62, cup))*(1.1 - 0.46*smoothstep(0.1, 0.6, cup2));
  if (fine > 0.01) { vec3 w = wor3(q*3.1 + 9.1); c *= mix(1., (0.8 + 0.42*w.z)*(0.7 + 0.3*smoothstep(0., 0.42, w.y - w.x)), fine*0.85); }
  return c;
}
void main(){
  vec2 e = (vW.xz - vec2(0., ${HOLE_Z.toFixed(3)}))/vec2(14.5, 16.);
  if (dot(e, e) < 1. && vW.y > ${(ROOF_Y - 1.6).toFixed(1)}) discard;                       // the hero's disc and shaft take over here
  vec3 N = normalize(vN); float down = abs(N.y);
  vec3 V = normalize(cameraPosition - vW);
  float pwc = min(fwidth(vW.x), 1.2);                                                        // a pixel's width here, for the fractures (taken outside any loop)
  float pwy = fwidth(vW.y), pwl = 0.6*(pwc + pwy);                                           // and its height, for what the walls show by the rooms
  vec3 Lb = rfLightBare(vW.xz);                                                              // the roof's light here without the owl's shade (the shade is laid below, on the roof's face with its cups)
  float nearK = 1. - smoothstep(10., 34., length(cameraPosition - vW));                      // grain of the hoar, only where it is close enough to resolve
  float kSt = 1. - smoothstep(70., 105., length(vW.xz));                                     // the strike gallery, whose walls are bare snow
  // the cups are laid on the roof in plan and on the walls in elevation (two wall projections blended by the normal),
  // so that they do not smear down a steep wall
  float wr = smoothstep(0.3, 0.7, down), wx = N.x*N.x, wz = N.z*N.z, ws = max(wx + wz, 1e-4);
  wx *= (1. - wr)/ws; wz *= (1. - wr)/ws;
  float cell = 0.;
  float fine = 1. - smoothstep(5., 16., length(cameraPosition - vW));
  if (wr > 0.004) cell += wr*cups(vW.xz + vec2(vW.y*0.35), fine);
  if (wx > 0.004) cell += wx*cups(vec2(vW.z + 31., vW.y*1.15), fine);
  if (wz > 0.004) cell += wz*cups(vec2(vW.x + 57., vW.y*1.15), fine);
  float grain = vn2((vW.xz + vec2(vW.y*0.8))*1.1 + 5.);
  float strata = 0.5 + 0.5*sin(vW.y*4.2 + vn2(vW.xz*0.4)*5.);
  // wind crust seen from below: where the snow above was ribbed by the wind the roof is ribbed too, thick blue ridges and thin pale troughs
  float rph = dot(vW.xz, vec2(0.83, 0.56))*4.6 + 3.4*vn2(vW.xz*0.085 + 3.) + 1.1*vn2(vW.xz*0.33);
  float ribW = vZ.x*wr*(1. - smoothstep(0.5, 1.5, fwidth(rph))), rfr = fract(rph/6.2832), ribT = smoothstep(0., 0.14, rfr)*(1. - smoothstep(0.14, 0.92, rfr));
  cell *= mix(1., 0.5 + 0.95*ribT, ribW);
  Lb = mix(Lb, mix(Lb*vec3(0.6, 0.8, 1.15), Lb*vec3(1.05, 1.1, 1.0) + vec3(0.02, 0.04, 0.04), ribT), ribW*0.6);
  vec2 hcr = hoofCR(vW.xz);
  // the owl's shade: on the light the wall's grain takes (L) as everything under the roof takes it, and on the roof's own face
  // with its cups (em), as the hero's disc takes it: the tone there is the tone of the snow without its cups, times the cups
  // evened, times the grain; a cup's bright centre comes down to it, a rib already dimmer than it stays as it is, and no point of
  // the face has more light under the bird than without it (the part's owlShadedFace)
  float owlK = owlShade(vW.xz), lSnow = dot(Lb, vec3(0.3, 0.5, 0.2));
  vec3 L = owlShadedK(Lb, owlK, owlTone(lSnow, owlRef()));
  vec3 em = Lb*cell*(0.82 + 0.36*grain)*(1. + nearK*(0.5*vn3(vW*2.9) + 0.35*vn3(vW*8.3) - 0.42))*max(1. - 0.95*hcr.x, 0.2)*(1. + 2.2*hcr.y);
  em = owlShadedFace(em, owlK, lSnow, cell, owlRef());
  em *= mix(1., 0.72 + 0.4*strata, 1. - wr);
  float roofK = mix(mix(0.34, 0.6, kSt), 1., smoothstep(0.25, 0.8, down))*mix(0.35, 1., smoothstep(0.4, 3.6, vG));
  vec3 col = em*roofK;
  // relief of the cups under the light that falls down and across the walls (derivatives taken here, outside any loop)
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float hx = dFdx(cell), hy = dFdy(cell);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 Nb = normalize(N*(abs(det) + 1e-7) + 0.55*sign(det)*(hx*r1 + hy*r2));
  float rel = clamp(0.4 + 1.1*dot(Nb, normalize(N*0.5 + vec3(0., 1., 0.01))), 0.12, 1.7);
  vec3 dd = vec3(-vW.x, ${(ROOF_Y * 0.7).toFixed(1)} - vW.y, ${(HOLE_Z * 0.5).toFixed(2)} - vW.z);
  float relD = 0.25 + 1.2*max(dot(Nb, dd/max(length(dd), 0.5)), 0.);
  // granular depth hoar of the walls: strata, pockets and grains, lit from across the gallery
  float gr = vn3(vW*2.3), gr2 = vn3(vW*7.1);
  float pock = worley(vec2(vW.x + vW.z*0.7, vW.y*1.3)*0.75);
  vec3 alb = vec3(0.44, 0.56, 0.70)*(0.42 + 0.4*gr + 0.3*gr2)*(0.7 + 0.3*strata)*(0.45 + 0.85*smoothstep(0.05, 0.55, pock));
  alb *= mix(1., 0.45 + 0.8*clamp((cell - 0.25)/1.1, 0., 1.), 1. - wr);
  col += alb*(L*0.5*(1. - roofK*0.85)*rel*(1. + 0.9*kSt) + uShadowCol*(0.6 + 1.3*(1. - wr)) + dayAt(vW)*(0.45 + 0.55*down)*relD);
  float litW = 0.5;                                                                          // how a wall's pillows take the light here (for the wet walls below)
  { float wallW = max(max(1. - wr, 1. - smoothstep(0.6, 0.9, down)), 1. - smoothstep(2.5, 6., vG))*vZ.y;   // the walls, the roof where it leans, and the low roof that comes down to them
    if (wallW > 0.004) {
      vec2 pa = vec2(vW.z + 31., vW.y*1.25), pb = vec2(vW.x + 57., vW.y*1.25), pc = vW.xz + vec2(vW.y*0.5);
      vec2 pl = vec2(0.);
      if (wx > 0.004) pl += wx*(0.7*pillows(pa*0.5) + 0.3*pillows(pa*1.2 + 7.));
      if (wz > 0.004) pl += wz*(0.7*pillows(pb*0.5) + 0.3*pillows(pb*1.2 + 7.));
      if (wr > 0.004) pl += wr*(0.7*pillows(pc*0.5) + 0.3*pillows(pc*1.2 + 7.));
      float lit = pl.x*(0.25 + 0.75*pl.y);
      // close to the eye every pillow is itself a drift of smaller ones, each lit from above with its own crease, and the snow is grainy:
      // no wall is ever one flat tone across more than a hand's breadth of the frame
      float nearW = 1. - smoothstep(10., 26., length(cameraPosition - vW));
      if (nearW > 0.01) {
        vec2 pf = vec2(0.);
        if (wx > 0.004) pf += wx*pillows(pa*2.6 + 3.);
        if (wz > 0.004) pf += wz*pillows(pb*2.6 + 3.);
        if (wr > 0.004) pf += wr*pillows(pc*2.6 + 3.);
        lit = mix(lit, (0.3*lit + 0.7*lit*(0.4 + 1.2*pf.x))*(0.3 + 0.7*pf.y), nearW*0.9);
        lit *= 1. + nearW*(0.6*vn3(vW*5.3) + 0.3*vn3(vW*13.) - 0.45);
      }
      vec3 Lw = mix(L, vec3(dot(L, vec3(0.3, 0.5, 0.2)))*vec3(0.82, 0.95, 1.12), 0.45);                 // snow, not glass: paler and less green than the roof's own glow
      vec3 albW = vec3(0.52, 0.62, 0.74)*(0.72 + 0.3*gr + 0.22*gr2)*(0.84 + 0.16*strata);
      vec3 wallC = albW*(Lw*(0.07 + 1.4*lit)*mix(0.45, 1., smoothstep(0.1, 2.6, vG)) + uShadowCol*(0.4 + 1.4*lit) + dayAt(vW)*(0.25 + 0.75*lit)) + em*0.05;
      col = mix(col, wallC, wallW); litW = mix(litW, lit, wallW);
    } }
  // what the walls show by the rooms (vY; all of it is skipped where the weights are nought)
  { float wallF = max(1. - wr, 1. - smoothstep(2.5, 6., vG));
    if (vY.x > 0.004 && wx + wz > 0.004) {
      // lenses of clear ice: the roof's own light comes down through them, so they glow where the roof above is thin; crazed, with a glassy skin
      vec2 ln = (wx*iceLens(vec2(vW.z + 31., vW.y), pwl) + wz*iceLens(vec2(vW.x + 57., vW.y), pwl))/(wx + wz);
      float craze = smoothstep(0.03, 0.4, worley(vec2(vW.x + vW.z, vW.y*2.)*1.3));
      vec3 ice = L*vec3(0.5, 0.95, 1.12)*(0.3 + 0.75*ln.y)*(0.7 + 0.5*craze) + uShadowCol*0.5 + L*0.5*pow(clamp(1. - abs(dot(N, V)), 0., 1.), 3.);
      col = mix(col, ice, vY.x*ln.x*min((wx + wz)*1.5, 1.));
    }
    if (vY.y*wallF > 0.004) {
      // wet walls: the snow is soaked dark and glazed, and trickles run down it catching the roof's light. The glaze lies on the
      // crowns of the pillows in patches and leaves their creases dark, so that a wet wall keeps its drifted form however flat to
      // the eye's line it stands; each trickle runs in a dark soaked streak of its own
      vec2 wq = wx > wz ? vec2(vW.z + 31., vW.y) : vec2(vW.x + 57., vW.y);
      float trN = vn2(vec2(wq.x*2.4, wq.y*0.16 + 3.)), tr = smoothstep(0.62, 0.8, trN)*(1. - wr), trD = smoothstep(0.5, 0.62, trN)*(1. - wr);
      float bead = 0.5 + 0.5*sin(wq.y*5. + uTime*1.6 + vn2(vec2(wq.x*2.4, 7.))*20.);
      float fr = pow(clamp(1. - abs(dot(N, V)), 0., 1.), 3.);
      float crown = smoothstep(0.3, 0.85, litW)*(0.35 + 0.65*smoothstep(0.3, 0.7, vn2(wq*0.9 + 13.)));
      col = mix(col, col*vec3(0.5, 0.62, 0.7)*(0.55 + 0.75*litW)*(1. - 0.4*trD) + L*(0.03 + 0.5*fr*crown) + L*tr*(0.14 + 0.6*bead*bead), vY.y*wallF);
    }
    if (vY.z > 0.004) {
      // moss on the foot of the walls, in cushions: highest where the wall is rough (vG: the roof's height over the floor, low at a wall's foot)
      float mh = 1. - smoothstep(0.6, 3.4, vG - 1.6*(vn2(vW.xz*0.45 + 9.) - 0.5) - 0.8*(gr - 0.5));
      float cu = worley(vec2(vW.x + 0.6*vW.y, vW.z - 0.4*vW.y)*1.4);
      float tip = 0.55 + 0.6*vn3(vW*9.) + 0.5*vn3(vW*21.)*(1. - smoothstep(0.02, 0.09, pwl));                // frond tips, gone before a pixel outgrows them
      vec3 mossC = mix(vec3(0.03, 0.09, 0.025), vec3(0.14, 0.27, 0.06), smoothstep(0.15, 0.7, 1. - cu))*tip;
      col = mix(col, shade(mossC, L*mix(0.45, 1., smoothstep(0.3, 2.6, vG)), dayAt(vW), 0.35 + 0.5*(1. - cu), 0.55), vY.z*smoothstep(0.35, 0.6, mh + 0.25*(1. - cu) - 0.2));
    }
    if (vY.w*(1. - wr) > 0.004) {
      // bare wind crust: in patches hard layers stand out of the wall as ledges two thirds of a metre apart, each with a pale lip and its
      // own shade under it (faded out before a pixel is as tall as a lip); the wall is paler and less green than drifted snow
      float cy = vW.y*1.5 + 1.6*vn2(vec2(vW.x + vW.z, vW.y*0.25)*0.35) + 0.5*vn2(vW.xz*1.3), cf = fract(cy);
      float kc = (1. - smoothstep(0.03, 0.09, pwy))*smoothstep(0.3, 0.55, vn2(vec2(vW.x - vW.z, vW.y*0.6)*0.3 + 7.));
      vec3 cc = col*(1. + kc*(0.8*smoothstep(0.78, 0.9, cf)*(1. - smoothstep(0.93, 1., cf)) - 0.45*(1. - smoothstep(0., 0.28, cf))));
      col = mix(col, mix(cc, vec3(dot(cc, vec3(0.3, 0.5, 0.2)))*vec3(1.04, 1.15, 1.3), 0.45), vY.w*(1. - wr));
    } }
  col += uShadowCol*0.5*exp(-dot(col, vec3(4., 8., 4.)));
  { float hg = holesAt(vW.xz)*smoothstep(0.35, 0.75, down)*step(4.5, vG); col = mix(col, uDayCol*2.7, hg); }
  { float hl = lensAt(vW.xz)*smoothstep(0.35, 0.75, down)*step(4.5, vG), ck = worley(vW.xz*0.8 + 3.);                 // an ice lens: blue, crazed, brightest between the cracks
    col = mix(col, uDayCol*vec3(0.46, 0.78, 1.6)*(0.5 + 1.75*smoothstep(0.04, 0.5, ck))*(0.75 + 0.25*grain), hl); }
  // the fractures that run out from the bulge along the roof toward us: gaps in a dark seam of sheared snow, their broken edge a pale
  // lip. Until the roof goes through a gap is mixed toward near black and then, where its measure is over 0.5, toward daylight
  // (the two mixes below); once the roof is through it is mixed half way to near black where its measure is 1
  if (uCrGrow > 0.004) {
    vec3 gcr = galleryCracks(vW.xz - vec2(0., ${HOLE_Z.toFixed(3)}), uCrGrow, pwc)*smoothstep(0.18, 0.5, down)*step(3., vG);
    float lit = 1. - uHole;                                                                  // once the roof has gone through they close to dark seams
    col *= 1. - min(gcr.y, 1.)*(0.5*lit + 0.3*uHole);
    col = mix(col, col*0.12 + vec3(0.008, 0.02, 0.05), min(gcr.x, 1.)*(0.9*lit + 0.5*uHole));
    // until the roof goes through, a gap is open to the day: where the gap's measure (gcr.x) is over 0.5 the colour is mixed
    // toward LEAK_GAP times the leak's colour, by a smoothstep of gcr.x from 0.5 to 1, times lit. galleryCracks gives 1 across a
    // gap's breadth and less over its soft edge (a pixel and a centimetre wide), where a gap's half breadth is under three
    // quarters of a pixel, in the spurs (0.8 at most) and between 1 and 5 m along the gallery from the hole's centre; the
    // caller's factors above (down, vG) lessen it too. Where gcr.x is under 0.5 the gap keeps the mix toward near black of the
    // line above. Nothing is added to the sheared snow either side
    col = mix(col, leakCol(uDayCol, uTurq)*LEAK_GAP, smoothstep(0.5, 1., gcr.x)*lit);
    col += mix(uDayCol, uTurq*1.3 + uDayCol*0.35, 0.3)*0.6*min(gcr.z, 1.)*lit;
  }
  // facets of hoar catching the eye
  vec3 q = vW*2.2, c = floor(q); float h = h31(c);
  vec3 dgl = vec3(h31(c+3.1), h31(c+7.7), h31(c+11.3))*2. - 1.;
  float s = max(0., sin(dot(dgl, V)*9. + h*40. + uTime*1.3)); s *= s; s *= s; s *= s;
  float m = 1. - smoothstep(0.08, 0.3, length(fract(q) - 0.5));
  col += (L*1.8 + vec3(0.02, 0.05, 0.08) + uDayCol*uDay*0.6)*s*s*step(0.78, h)*m;
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
const FLOOR_VS = /* glsl */`
attribute float aG; attribute vec2 aZ; attribute vec4 aW;
varying vec3 vW; varying vec3 vN; varying float vG; varying float vBank; varying float vWet; varying float vStr;
void main(){
  vec3 p = position; vWet = aW.y; vStr = aW.x;
  // the snow slumps off the wall onto the floor: a bank of uneven height that buries the line where they meet
  vBank = aZ.y*(1. - smoothstep(0.3, 3.2, aG))*(0.35 + 0.9*vn2(p.xz*0.16 + 5.));
  p.y += 0.95*vBank;
  vW = p; vN = normal; vG = aG; vec4 wp = vec4(p, 1.); ${VEND} }`;
const FLOOR_FS = /* glsl */`
uniform vec4 uBlob[10]; uniform float uWet, uWaterY; uniform vec3 uMossA, uMossB;
varying vec3 vW; varying vec3 vN; varying float vG; varying float vBank; varying float vWet; varying float vStr;
// a scatter of straight needles and straws: one to a cell, each at its own angle. x: coverage, y: a hash
vec2 needles(vec2 q, float w, float aa){
  vec2 c = floor(q), f = fract(q) - 0.5; float h = h21(c), a = h*6.2832;
  vec2 d = vec2(cos(a), sin(a)), o = (vec2(h21(c + 3.1), h21(c + 7.7)) - 0.5)*0.2;
  float al = dot(f - o, d), ac = abs(dot(f - o, vec2(-d.y, d.x)));
  return vec2((1. - smoothstep(w, w + aa, ac))*(1. - smoothstep(0.3, 0.34, abs(al)))*step(0.3, fract(h*7.3)), fract(h*13.7));
}
// grains of hoar: lozenges of every size, each turned its own way and pushed off its cell's centre; most cells are empty
float hoar(vec2 q, float cov, float aa, out float hh){
  vec2 c = floor(q), f = fract(q) - 0.5; float h = h21(c + 4.4), h2 = h21(c + 9.7), a = h2*6.2832;
  vec2 d = f - (vec2(h21(c + 1.3), h21(c + 8.1)) - 0.5)*0.5;
  d = vec2(d.x*cos(a) - d.y*sin(a), d.x*sin(a) + d.y*cos(a));
  float r = 0.06 + 0.14*h2*h2;
  hh = h; return (1. - smoothstep(r, r + aa, abs(d.x) + 0.6*abs(d.y)))*step(h, cov*0.6);
}
void main(){
  vec2 p = vW.xz;
  float dist = length(cameraPosition - vW), far = 1. - smoothstep(18., 60., dist);        // fine detail fades before it can alias
  // metres to a pixel here (taken before any branch). On a floor seen at a slant a pixel is many times longer away from the eye than
  // it is wide, and a grain finer than its length would be drawn as streaks lying across the view; so the measure leans to the
  // pixel's long side, and every layer of the floor's grain, the coarse ones too, goes to its mean before it is finer than that
  float fx = length(dFdx(p)), fy = length(dFdy(p)), pw = mix(min(fx, fy), max(fx, fy), 0.6);
  float k13 = 1. - smoothstep(0.2, 0.5, pw*13.), k23 = 1. - smoothstep(0.2, 0.5, pw*23.), k41 = 1. - smoothstep(0.2, 0.5, pw*41.), kn = 1. - smoothstep(0.02, 0.07, pw);
  float k2 = 1. - smoothstep(0.2, 0.5, pw*1.7), k5 = 1. - smoothstep(0.2, 0.5, pw*5.3), k9 = 1. - smoothstep(0.2, 0.5, pw*9.);
  float n1 = rfFbm(p*0.33), n2 = mix(0.5, vn2(p*1.7 + 3.), k2), n3 = mix(0.5, vn2(p*5.3), k5), n4 = mix(0.5, vn2(p*13.), k13), n5 = mix(0.5, vn2(p*5.3 + 7.), k5);
  float n6 = mix(0.5, vn2(p*23. + 1.7), k23), n7 = mix(0.5, vn2(p*41. + 5.1), k41), n8 = mix(0.5, vn2(p*41. + 19.3), k41);
  // moss or litter: the fine octaves break the boundary into a ragged edge of single fronds; close to, nothing is a soft fade
  float mossK = smoothstep(0.455, 0.525, n1 + 0.25*(n3 - 0.5) + 0.16*(n4 - 0.5) + 0.12*(n6 - 0.5));
  vec3 moss = mix(uMossA, uMossB, smoothstep(0.3, 0.75, n2*0.6 + n3*0.4));
  moss *= 0.5 + 1.0*smoothstep(0.36, 0.64, n6*0.55 + n7*0.45);                            // lit frond tips over the dark between them
  moss = mix(moss, uMossB*1.45, smoothstep(0.62, 0.7, n8)*0.55*k41);                      // pale new growth
  vec3 litter = mix(vec3(0.10, 0.065, 0.04), vec3(0.30, 0.22, 0.12), n3*n3 + 0.3*n4);
  litter *= 0.66 + 0.7*smoothstep(0.38, 0.62, n6);                                         // crumbs of leaf and bark
  litter = mix(litter, vec3(0.04, 0.03, 0.022), smoothstep(0.62, 0.7, n8)*0.65*k41);
  vec3 alb = mix(litter, moss, mossK);
  alb *= 0.6 + 0.5*n4*n3 + 0.3*n2;
  // straw chaff pressed into it, then single needles and straws lying on it
  float ch = vn2(vec2(p.x*1.3 + p.y*3.1, p.y*9. - p.x*4.)), ch2 = vn2(vec2(p.x*8. + p.y*2.3, p.y*1.1 - p.x*3.3));
  alb = mix(alb, vec3(0.40, 0.32, 0.17), (smoothstep(0.80, 0.9, ch) + smoothstep(0.82, 0.9, ch2))*0.6*far*k9);
  vec2 nd = needles(p*1.9, 0.03, pw*1.9), nd2 = needles(p*3.3 + 17., 0.035, pw*3.3);
  alb = mix(alb, mix(vec3(0.46, 0.37, 0.19), vec3(0.2, 0.12, 0.06), step(0.6, nd.y))*(0.8 + 0.4*n6), nd.x*kn*0.9);
  alb = mix(alb, mix(vec3(0.05, 0.04, 0.03), vec3(0.36, 0.3, 0.17), step(0.55, nd2.y)), nd2.x*kn*0.85);
  // rime: close to, separate grains of hoar, thick where the soft field says frost lies; far off, the field itself
  float cov = smoothstep(0.5, 0.9, vn2(p*0.55 + 11.)*0.7 + n2*0.25 + n3*0.15);
  float gh = 0., gh2 = 0., kg = 1. - smoothstep(0.2, 0.5, pw*9.1);
  float grain = max(hoar(mat2(0.878, 0.479, -0.479, 0.878)*p*5.3, cov, pw*5.3, gh), hoar(mat2(0.622, -0.783, 0.783, 0.622)*p*9.1 + 7., cov, pw*9.1, gh2));
  gh = max(gh, gh2);
  float frost = mix(cov*(0.2 + 0.3*smoothstep(0.4, 0.6, n3)), grain, kg);
  alb = mix(alb, vec3(0.44, 0.55, 0.66)*(0.75 + 0.5*gh*kg), frost*0.72);
  float bank = smoothstep(0.1, 0.34, vBank + 0.22*(n3 - 0.5) + 0.14*(n6 - 0.5));
  // (the bank is slumped lumps of snow with dark creases between them, never one pale sheet)
  float lump = smoothstep(0.18, 0.5, vn2(p*0.75 + 11.))*(0.6 + 0.4*smoothstep(0.2, 0.55, mix(0.5, vn2(p*2.3 + 3.), 1. - smoothstep(0.2, 0.5, pw*2.3))));
  alb = mix(alb, vec3(0.50, 0.61, 0.73)*(0.78 + 0.26*n4 + 0.2*n7)*(0.42 + 0.75*lump), bank);
  float kSt = 1. - smoothstep(20., 40., length(p));                     // round the strike only: a little darker and bluer, so that the pool of daylight is the brightest thing on the floor
  alb *= mix(vec3(1.), vec3(0.45, 0.58, 0.8), kSt);
  vec3 N = normalize(vN + vec3(n3 - 0.5, 0., n5 - 0.5)*0.8*far + vec3(n7 - 0.5, 0., n8 - 0.5)*1.1);
  vec3 L = rfLight(p); float ao = mix(0.25, 1., smoothstep(0.3, 4.5, vG));
  float sh = 1.;
  for (int i = 0; i < 10; i++) { vec2 d = p - uBlob[i].xy; sh *= 1. - uBlob[i].w*exp(-dot(d,d)/max(uBlob[i].z*uBlob[i].z, 0.01)); }
  // runnels of meltwater by the fox's room and the meltwater (vWet): narrow winding threads no finer than a pixel, the litter soaked dark
  // under them, with a glint that runs along them
  float runK = 0.;
  if (vWet > 0.004) {
    float rw = 0.02 + 0.22*pw, ra = abs(vn2(p*0.19 + 21.) - 0.5);
    runK = vWet*(1. - smoothstep(rw*0.5, rw*1.2, ra))*(1. - bank)*(1. - smoothstep(0.25, 0.6, pw));
    alb *= 1. - 0.5*vWet*(1. - smoothstep(rw, rw*3.5, ra))*(1. - bank);
  }
  // the stream's margin (vStr: where the meltwater runs): the bank goes down into the water through a band of soaked ground, dark
  // and smooth, its edge ragged, three quarters of a metre up from the water's level, and a lace of thin shelf ice lies along the
  // waterline itself; so the floor has no hard edge at the stream. hW: metres above the water's level
  float hW = vW.y - uWaterY + 0.3*(n3 - 0.5) + 0.16*(n4 - 0.5), wetM = vStr*(1. - smoothstep(0.1, 0.8, hW));
  float lace = vStr*(1. - smoothstep(0.05, 0.2, abs(vW.y - uWaterY - 0.05 + 0.14*(n3 - 0.5))))*(0.45 + 0.55*n6);
  alb = mix(alb, vec3(0.05, 0.047, 0.04)*(0.7 + 0.6*n4), 0.8*wetM);
  N = normalize(mix(N, normalize(vN), 0.7*wetM));
  vec3 col = shade(alb, L*ao*sh, dayAt(vW)*sh, 0.45 + 0.4*N.y, mix(0.6, 0.28, kSt));
  vec3 V = normalize(cameraPosition - vW); float fres = pow(clamp(1. - dot(N, V), 0., 1.), 4.);
  col += L*ao*sh*wetM*(0.05 + 1.1*fres);                                                    // the soaked ground shines back the roof
  col = mix(col, vec3(0.52, 0.64, 0.74)*(0.6 + 0.5*n2)*(L*1.5 + uShadowCol*2. + dayAt(vW)), 0.8*lace);
  col += L*ao*sh*runK*(0.22 + 0.9*fres + 0.7*pow(max(sin(dot(p, vec2(3.1, 2.3)) - uTime*2.6), 0.), 6.));
  float tw = step(0.7, gh)*pow(max(sin(gh*40. + dot(V.xz, vec2(7., 5.))*4. + uTime), 0.), 12.);
  col += L*ao*sh*(grain*tw*2.2*kg + 0.25*fres*frost);                                      // a grain here and there catches the eye
  col += L*ao*sh*uWet*(0.08 + 0.6*fres)*(1. - smoothstep(0.3, 0.55, n1))*(0.8 + 0.2*sin(uTime*2. + n2*20.));   // meltwater film
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;

// ---------------------------------------------------------------------------------------------------------
// sedge ribbons, frost feathers, hoar cup crystals
// ---------------------------------------------------------------------------------------------------------
const SEDGE_VS = /* glsl */`
attribute vec3 aUv; attribute vec2 aRnd; attribute vec3 aSide; attribute vec4 aSt;
uniform vec4 uVole;
varying vec3 vW; varying vec3 vN; varying vec3 vS; varying vec3 vL; varying vec3 vD; varying vec3 vUv; varying vec2 vR; varying vec4 vSt;
void main(){
  vec3 p = position;
  float fr = 0.25 + aUv.y*aUv.y;
  vec3 dv = p - uVole.xyz; float wake = uVole.w*exp(-dot(dv, dv)/70.);
  p += normal*(sin(uTime*2.6 + aRnd.x*40. + aUv.y*5.)*0.045 + sin(uTime*13. + aRnd.x*17. + aUv.y*9.)*0.3*wake)*fr*(1. - 0.6*aSt.y);   // a wet blade is heavy
  vW = p; vN = normal; vS = aSide; vUv = aUv; vR = aRnd; vSt = aSt; vL = rfLight(p.xz); vD = dayAt(p);
  vec4 wp = vec4(p, 1.);
  ${VEND}
}`;
// a dry sedge leaf: aUv = (across -1..1, along 0..1, metres along). The geometry is a smooth tapering ribbon; the keel fold,
// veins, mould specks, nibbled edges, frayed tip and the broken rime along the edges are drawn here, and the blade's state by its
// place (fwx, fwd: the change of the blade's two coordinates across one pixel, so that nothing drawn is finer than a pixel)
const SEDGE_FS = /* glsl */`
uniform vec3 uStraw, uStraw2, uGreenBase;
varying vec3 vW; varying vec3 vN; varying vec3 vS; varying vec3 vL; varying vec3 vD; varying vec3 vUv; varying vec2 vR; varying vec4 vSt;
void main(){
  float x = vUv.x, ax = abs(x), v = vUv.y, dm = vUv.z, h = vR.x, h2 = fract(h*13.7), h3 = fract(h*71.3);
  float fwx = fwidth(x);                                                   // 2 / (width of the blade in pixels)
  float fwd = fwidth(dm);                                                  // metres along the blade to a pixel
  float near = 1. - smoothstep(9., 28., length(cameraPosition - vW));
  float notch = smoothstep(0.62, 0.9, vn2(vec2(dm*1.9 + h*31., h*5.)))*near;
  float fray = smoothstep(0.7, 1., v)*step(0.45, h3)*vn2(vec2(dm*6. + h*70., x*1.3 + h*9.));
  if (ax > 1. - 0.42*notch - 0.75*fray) discard;
  // the blade's state by its place along the way (stateAt): rimed, bleached to a pale warm straw, wet, mossed at the foot; all nought
  // off the way. No state makes the blade darker than it is plain
  float stR = max(vSt.x, 0.), stG = max(-vSt.x, 0.), stW = vSt.y, stM = vSt.z, mk = 0.;
  bool way = stR + stG + stW + stM > 0.;
  // broken short: a ragged end of splinters (as broad as the footprint lets them be drawn)
  if (vSt.w < 0.999 && v > vSt.w - 0.012 - 0.05*abs(fract(x*1.7 + h*9.) - 0.5)*(1. - smoothstep(0.25, 0.7, fwx*1.7))) discard;
  vec3 N0 = normalize(vN), S = normalize(vS + vec3(1e-4, 0., 0.)), V = normalize(cameraPosition - vW);
  float sg = dot(N0, V) < 0. ? -1. : 1.;
  float hs = clamp(x*5., -1., 1.);
  vec3 N = normalize(N0 - S*hs*0.8)*sg;                                    // the keel fold: one half takes the light, the other is in shade
  vec3 alb = mix(uStraw, uStraw2, h);
  alb = mix(alb, vec3(0.62, 0.52, 0.28), step(0.78, h2)*0.8);              // bleached leaves
  alb = mix(alb, vec3(0.17, 0.085, 0.035), step(h2, 0.16)*0.75);           // weathered russet ones
  alb = mix(alb, uGreenBase, (1. - smoothstep(0.0, 0.45, v))*vR.y);
  float fib = vn2(vec2(x*5. + h*30., dm*0.7)), fib2 = vn2(vec2(x*2.2 + h*11., dm*3.1));
  alb *= 0.66 + 0.36*fib + 0.2*fib2;
  alb *= 1. - 0.3*(1. - smoothstep(0.045, 0.11, fwx))*(0.5 + 0.5*sin(x*18.85 + h*40.));   // parallel veins, gone before they can alias
  alb *= 1. - 0.5*(1. - smoothstep(0.02, 0.13, ax));                       // the crease of the keel
  alb *= 1. - 0.5*near*smoothstep(0.74, 0.86, vn2(vec2(x*1.8 + h*50., dm*2.3)));   // mould specks
  alb *= mix(0.45, 1., smoothstep(0., 0.3, v));                            // dark where it roots in the pack
  alb *= 1. - 0.45*step(0.9, N0.y);                                        // trodden litter is darker
  if (way) {
    float lum = dot(alb, vec3(0.3, 0.55, 0.15));
    // wet straw is deeper in colour, toward amber, and as light as it is dry
    { vec3 wetC = alb*vec3(1.2, 0.95, 0.5); alb = mix(alb, wetC*(lum/max(dot(wetC, vec3(0.3, 0.55, 0.15)), 1e-4)), stW); }
    // moss for the first metres up from the root, a velvet of small cushions with a ragged upper edge
    mk = stM*(1. - smoothstep(1.8 + 3.2*h3, 3.6 + 5.*h3, dm + 1.6*(fib2 - 0.5)));
    float cu = vn2(vec2(x*2.6 + h*17., dm*3.4)), cuK = 1. - smoothstep(0.3, 0.8, fwd*3.4);
    alb = mix(alb, mix(vec3(0.045, 0.12, 0.028), vec3(0.20, 0.34, 0.07), mix(0.5, cu, cuK))*(0.75 + 0.5*fib), mk*0.92);
    alb = mix(alb, (lum*0.9 + 0.2)*vec3(1.24, 1.0, 0.56), 0.86*stG);                                        // bleached by wind and sun to a pale warm straw, lighter than the plain blade
    alb = mix(alb, (vec3(lum)*1.1 + 0.07)*vec3(0.86, 0.96, 1.07), 0.5*stR);                                 // pale under its rime
  }
  // rime: broken crystals along both edges, patches on the face, a frosted tip
  float c1 = vn2(vec2(dm*6.5 + h*90., x*2.)), c2 = vn2(vec2(dm*17. + h*33., x*4.));
  float fr = smoothstep(0.55, 0.9, ax)*mix(0.5, smoothstep(0.4, 0.62, c1)*(0.55 + 0.9*c2), near);
  fr += 0.32*smoothstep(0.66, 0.84, vn2(vec2(dm*0.8 + h*20., x*0.6 + h*3.)))*(0.5 + 0.5*c1) + 0.3*smoothstep(0.8, 1., v);
  fr = clamp(fr, 0., 1.);
  float glit = 0.;
  if (way) {
    // rimed: frost stands broad along both edges and in patches on the face; a thin glaze of it only on a wet blade, little on moss
    float c1K = 1. - smoothstep(0.25, 0.7, fwd*6.5);
    float rimed = smoothstep(0.32, 0.8, ax + 0.5*(c1 - 0.5)*c1K) + 0.4*smoothstep(0.46, 0.74, vn2(vec2(dm*1.1 + h*20., x*0.9 + h*3.)));
    fr = clamp(max(fr, stR*min(rimed, 1.)*(0.78 + 0.44*mix(0.5, c2, c1K)))*(1. - 0.65*stW)*(1. - 0.7*mk), 0., 1.);
    // a cold glitter: one crystal to a cell of 14 cm, each turning its face to the eye in its own time; cells smaller than a pixel
    // give their mean instead
    vec2 gq = vec2(dm*7. + h*31., x*2.5 + h*7.), gi = floor(gq), gf = fract(gq) - 0.5;
    float gh = h11(gi.x*17.3 + gi.y*71.7 + h*113.), gK = 1. - smoothstep(0.3, 0.85, fwd*7. + fwx*2.5);
    float gl1 = pow(max(sin(gh*61. + dot(V, vec3(5., 3., 4.))*6.), 0.), 24.)*(1. - smoothstep(0.12, 0.42, length(gf)));
    glit = stR*fr*mix(0.045, gl1*1.9, gK);
  }
  alb = mix(alb, vec3(0.66, 0.76, 0.84), fr*0.78);
  if (way) alb = mix(alb, vec3(0.78, 0.9, 1.), fr*0.45*stR);               // thick rime is whiter
  float kd = 0.42 + 0.22*N.y + 0.34*max(dot(N, V), 0.);
  float lumL = dot(vL, vec3(0.25, 0.55, 0.2));
  float sp = pow(max(dot(N, normalize(V + vec3(0., 0.7, 0.))), 0.), 14.)*(1. - fr)*0.2;      // dry straw has a sheen
  vec3 col = shade(alb, vL, vD, kd, 0.9) + alb*(vL*0.4*(1. - abs(dot(N0, V))) + vec3(1.0, 0.84, 0.56)*(0.10*lumL + 0.01)*(1. + 1.2*max(vSt.y, 0.)));   // straw lets a little light through, wet straw more
  col += (vL + vD)*vec3(1., 0.9, 0.7)*sp;
  float tw = pow(max(sin(c2*37. + dot(V, vec3(5., 3., 4.))*5. + h*20.), 0.), 12.);
  col += (vL*1.2 + vD*2.)*tw*fr*near*0.8;                                  // crystals catching the eye
  if (way) {
    col += (vL*1.1 + vD*2.)*vec3(0.84, 0.96, 1.1)*glit;
    // a wet blade shines: a narrow light off its face and the roof's light along its edge-on parts
    col += stW*vL*vec3(0.9, 1., 1.05)*(0.55*pow(max(dot(N, normalize(V + vec3(0., 0.7, 0.))), 0.), 44.) + 0.2*pow(max(1. - abs(dot(N0, V)), 0.), 3.));
  }
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
const FROST_VS = /* glsl */`
attribute vec2 aUv; attribute vec2 aRnd;
varying vec3 vW; varying vec3 vL; varying vec3 vD; varying vec2 vUv; varying vec2 vR;
void main(){
  vec3 p = position;
  p += normal*sin(uTime*3.1 + aRnd.x*50.)*0.035*aUv.y;
  vW = p; vUv = aUv; vR = aRnd; vL = rfLight(p.xz); vD = dayAt(p);
  vec4 wp = vec4(p, 1.);
  ${VEND}
}`;
const FROST_FS = /* glsl */`
varying vec3 vW; varying vec3 vL; varying vec3 vD; varying vec2 vUv; varying vec2 vR;
void main(){
  float x = vUv.x*2. - 1., ax = abs(x), v = vUv.y, pxv = fwidth(vUv.y);
  if (vR.y > 0.5) {
    // on a wet blade: a bead of water hanging at the blade's edge instead of a feather. vR.y - 1 is the quad's half breadth over its
    // length, so the bead is round; it is widened by half the pixel's footprint and left out when it would be under half a pixel
    float a = vR.y - 1., r = min(0.13, 0.6*a)*(0.82 + 0.18*sin(uTime*0.9 + vR.x*40.));
    vec2 q = vec2(x*a, v - r)/(r + 0.5*pxv); float dd = dot(q, q);
    if (dd > 1. || pxv > 2.*r) discard;
    // water: dark where we look through it, the roof's light gathered on its far side, a thin bright rim and one point of light
    vec2 qh = q - vec2(-0.34, -0.3);
    float hl = exp(-dot(qh, qh)*24.), low = smoothstep(0., 0.95, q.y)*(1. - dd*dd*dd);
    vec3 Lb = mix(vL, vec3(dot(vL, vec3(0.25, 0.55, 0.2))), 0.5);
    vec3 colB = vL*(0.03 + 0.5*low*low) + Lb*(0.4*dd*dd*dd*dd + 2.4*hl) + vD*(0.3 + 2.5*hl) + uShadowCol*0.12;
    gl_FragColor = vec4(colB*min(r/(r + 0.5*pxv) + 0.25, 1.), 1.);
    ${FOG_F}
    return;
  }
  float w = sin(3.14159*pow(clamp(v, 0., 1.), 0.65))*0.92;
  float cb = v*13. - ax*3.4 + vR.x*7.;
  float barb = mix(smoothstep(0.1, 0.45, abs(fract(cb) - 0.5)*2.), 0.62, smoothstep(0.18, 0.4, fwidth(cb)));   // too fine to draw: a plain feather
  float m = step(ax, w*(0.3 + 0.7*barb)) + step(ax, 0.07)*step(v, 0.97);
  if (m < 0.5) discard;
  vec3 V = normalize(cameraPosition - vW);
  float tw = pow(max(sin(vR.x*60. + dot(V, vec3(5., 3., 4.))*4. + floor(v*13.)*2.1), 0.), 10.);
  vec3 alb = vec3(0.62, 0.72, 0.80)*(0.7 + 0.3*barb);
  vec3 Lw = mix(vL, vec3(dot(vL, vec3(0.25, 0.55, 0.2))), 0.55);
  vec3 col = alb*(Lw*(0.8 + 1.4*tw) + uShadowCol*0.6 + vD*(1. + 2.*tw));
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
// A plume of hoar is a tuft of narrow curved fronds (ribbons); each frond is drawn here as a feather of ice: a shaft, a lance-shaped
// outline cut into a dozen teeth, and some forty fine barbs slanting to the tip. Teeth and barbs are faded out through their own
// pixel size (fwidth), so far off a frond is a plain soft blade and nothing can alias into stripes. aUv = (across 0..1, along 0..1).
const PLUME_VS = /* glsl */`
attribute vec2 aUv; attribute vec2 aRnd;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vD; varying vec2 vUv; varying vec2 vR;
void main(){
  vec3 p = position;
  p += normal*(sin(uTime*2.3 + aRnd.x*50. + aUv.y*4.)*0.03 + sin(uTime*5.7 + aRnd.x*23.)*0.012)*aUv.y*aUv.y;
  vW = p; vN = normal; vUv = aUv; vR = aRnd; vL = rfLight(p.xz); vD = dayAt(p);
  vec4 wp = vec4(p, 1.);
  ${VEND}
}`;
const PLUME_FS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vD; varying vec2 vUv; varying vec2 vR;
void main(){
  float x = vUv.x*2. - 1., ax = abs(x), v = clamp(vUv.y, 0., 1.), h = vR.x, h2 = fract(h*17.31);
  float cb = v*42. - ax*9. + h*7., ct = v*13. - ax*2.6 + h2*5.;
  float fb = fwidth(cb), ft = fwidth(ct);                                       // how many barbs, how many teeth, to a pixel
  float kb = smoothstep(0.16, 0.36, fb), kt = smoothstep(0.2, 0.42, ft);       // 1: too fine to draw, so a plain blade
  float w = pow(clamp(v, 0., 1.), 0.55)*pow(clamp(1. - v, 0., 1.), 0.8)*2.25;                                 // a lance, broadest two fifths of the way up
  float tooth = abs(fract(ct) - 0.5)*2.;
  float wt = w*mix(0.5 + 0.5*tooth, 0.8, kt);
  float needle = 1. - smoothstep(0.3 - fb, 0.3 + fb, abs(fract(cb) - 0.5));     // one barb, soft over a pixel
  float solid = mix(0.34 + 0.66*needle, 0.9, kb);                                // the barbs stand apart toward the edge; the shaft side is whole
  if (ax > wt*max(solid, step(ax, 0.3*wt)) && ax > 0.05*(1. - v)) discard;
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float ndv = abs(dot(N, V)), e = clamp(ax/max(wt, 0.03), 0., 1.);
  // ice: the roof's light comes through it, most where it is thinnest (the barbs and the tip); the shaft is a darker line
  vec3 Lw = mix(vL, vec3(dot(vL, vec3(0.25, 0.55, 0.2))), 0.6);
  float thin = 0.5 + 0.55*e*e + 0.3*v;
  float tone = (0.8 + 0.45*h2)*(0.66 + 0.34*ndv)*mix(0.45, 1., smoothstep(0.0, 0.3, v));
  tone *= 1. - 0.3*(1. - smoothstep(0.03, 0.1, ax))*(1. - kb);
  tone *= mix(0.86 + 0.28*needle, 1., kb);
  float tw = pow(max(sin(h*60. + dot(V, vec3(5., 3., 4.))*4. + floor(cb)*2.1 + uTime*0.6), 0.), 14.)*(1. - 0.6*kb);
  vec3 col = vec3(0.62, 0.74, 0.82)*(Lw*thin*tone + uShadowCol*0.7 + vD*(0.7 + 0.5*e)*tone);
  col += (Lw*1.3 + vD*2. + vec3(0.02, 0.05, 0.06))*tw*(0.35 + 0.65*e);
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
// A cup crystal of depth hoar: a hollow six-sided cup hung by its point, thin-walled. color = (rim, inside, 0).
const CRYS_VS = /* glsl */`
attribute float aSeed; attribute vec3 color;
varying vec3 vW; varying vec3 vL; varying vec3 vD; varying float vS; varying vec3 vC; varying vec3 vO; varying vec3 vNs;
void main(){
  vC = color; vO = position; vNs = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal + vec3(0., 1e-5, 0.));
  vec4 wp = modelMatrix*instanceMatrix*vec4(position, 1.);
  vec3 o = (modelMatrix*instanceMatrix*vec4(0., 0., 0., 1.)).xyz;
  float a = sin(uTime*2.3 + aSeed*40.)*0.04 + sin(uTime*5.1 + aSeed*17.)*0.02;
  vec3 r = wp.xyz - o; wp.xyz = o + vec3(r.x + r.y*a, r.y, r.z + r.y*a*0.7);
  vW = wp.xyz; vS = aSeed; vL = rfLight(wp.xz); vD = dayAt(wp.xyz);
  ${VEND}
}`;
const CRYS_FS = /* glsl */`
uniform vec3 uSparkCol; uniform float uSpark;
varying vec3 vW; varying vec3 vL; varying vec3 vD; varying float vS; varying vec3 vC; varying vec3 vO; varying vec3 vNs;
void main(){
  vec3 c = cross(dFdx(vW), dFdy(vW)); float l = length(c); vec3 F = l > 1e-12 ? c/l : vec3(0., 1., 0.);
  vec3 V = normalize(cameraPosition - vW); if (dot(F, V) < 0.) F = -F;
  vec3 Ns = normalize(vNs); if (dot(Ns, V) < 0.) Ns = -Ns;
  vec3 Nm = normalize(mix(F, Ns, 0.45));                                                // a facet is not one flat tone: it rounds a little toward its edges
  float fres = pow(clamp(1. - dot(Nm, V), 0., 1.), 2.);
  float rim = vC.r, inner = vC.g*(1. - vC.r);
  // stepped growth: the wall is a stair of treads, each lighter toward its lip, with a dark riser under it; gone before it can alias
  float fw = fwidth(vO.y)*17., kf = max(smoothstep(0.3, 0.8, fw), step(1.5, vS));        // (an icicle, seed over 1, is smooth)
  float stp = fract(vO.y*17. + vS*3.);
  float band = mix((0.74 + 0.3*stp)*(1. - 0.3*smoothstep(0.86, 0.97, stp)), 0.88, kf);
  float lip = smoothstep(0.62, 0.8, stp)*(1. - smoothstep(0.84, 0.9, stp))*(1. - kf);
  float ph = dot(F, vec3(17., 31., 23.)) + vS*6.283 + dot(V, vec3(5., 3., 4.))*3. + uTime*0.35;
  float g = pow(max(sin(ph), 0.), 22.);
  float lum = dot(vL, vec3(0.25, 0.55, 0.2));
  // thin glassy walls: the roof's light comes through them, most where a wall is seen edge on; the hollow is in its own shade
  vec3 col = vL*vec3(0.78, 0.95, 1.)*(0.14 + 0.8*fres + 0.22*max(-Nm.y, 0.))*band*(1. - 0.78*inner) + uShadowCol*mix(0.6, 1.1, inner);
  col += vL*vec3(0.6, 1.0, 0.98)*(rim*(0.6 + 0.9*fres) + lip*0.22*(1. - inner));          // the rim and the lip of every step catch the turquoise
  col += vD*(0.5 + 3.*g)*(1. - 0.5*inner) + (mix(vL, vec3(lum), 0.6)*2.6*uSpark + uSparkCol*lum)*g*(1. - 0.7*inner);
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;

// ---------------------------------------------------------------------------------------------------------
// plants (lingonberry, moss, lichen, willow): one shader, material id in aA.x, bend weight in aA.y
// 0 stem  1 leaf  2 berry  3 moss  4 lichen  5 catkin bud  6 willow bark
// ---------------------------------------------------------------------------------------------------------
const PLANT_VS = /* glsl */`
attribute vec4 aA; attribute vec3 color;
uniform vec4 uVole;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec3 vD; varying vec4 vA; varying vec3 vO;
void main(){
  vec4 wp = vec4(position, 1.); vec3 n = normal; float ph = aA.w*20.;
  #ifdef USE_INSTANCING
    wp = instanceMatrix*wp; n = mat3(instanceMatrix)*n; ph = dot(instanceMatrix[3].xz, vec2(0.7, 1.3));
  #endif
  wp = modelMatrix*wp;
  vec2 dv = wp.xz - uVole.xz; float wake = uVole.w*exp(-dot(dv, dv)/70.);
  float b = aA.y;
  wp.x += b*(sin(uTime*1.3 + ph)*0.06 + sin(uTime*11. + ph)*0.5*wake);
  wp.z += b*(cos(uTime*1.1 + ph*1.7)*0.06 + cos(uTime*9. + ph)*0.4*wake);
  vW = wp.xyz; vO = position; vN = normalize(n + vec3(0., 1e-5, 0.)); vC = color; vA = aA; vL = rfLight(wp.xz); vD = dayAt(wp.xyz);
  ${VEND}
}`;
const PLANT_FS = /* glsl */`
uniform vec2 uBirch;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec3 vD; varying vec4 vA; varying vec3 vO;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW); if (dot(N, V) < 0.) N = -N;
  float pw = length(fwidth(vW)), fwAz = fwidth(vA.z);                               // a pixel's width here in metres (taken outside the branches)
  float m = vA.x; vec3 alb = vC; float top = 0.5 + 0.5*N.y, kd = 0.3 + 0.7*top, vivid = 0.5; vec3 add = vec3(0.);
  float fres = pow(clamp(1. - dot(N, V), 0., 1.), 3.);
  vec3 R = reflect(-V, N); float up = smoothstep(0.1, 0.9, R.y);
  if (m < 0.5) { alb *= 0.75 + 0.5*vn3(vW*3.); }
  else if (m < 1.5) {
    alb *= 0.7 + 0.5*vn2(vO.xz*3. + vO.y);
    alb *= 0.75 + 0.25*smoothstep(0.02, 0.12, abs(vA.z));                         // midrib
    alb = mix(alb, vec3(0.66, 0.78, 0.84), smoothstep(0.72, 1., abs(vA.z) + 0.2*vn2(vO.xz*9.))*0.75);   // rimed edge
    add = vL*(0.14*up + 0.4*fres*up); vivid = 0.4;
  } else if (m < 2.5) {
    float cap = smoothstep(0.55, 0.9, N.y + 0.25*vn3(vW*4.));
    alb = mix(alb, vec3(0.70, 0.79, 0.86), cap*0.85); vivid = mix(0.9, 0.3, cap); kd = 0.5 + 0.5*top;
    add = vL*(0.3*pow(max(R.y, 0.), 8.) + 0.25*fres) + alb*0.05;
  } else if (m < 3.5) {
    // a frond of feather moss: a stem with close pinnae either side, cut out of its ribbon (vA.z along, vA.w across)
    float v = vA.z, ax = abs(vA.w);
    float env = min(pow(max(v, 0.), 0.45)*pow(max(1. - v, 0.), 0.55)*2.1, 1.);
    float pin = abs(fract(v*10. - ax*1.6) - 0.5)*2., kp = smoothstep(0.2, 0.5, fwAz*10.);                // kp 1: the pinnae are too fine to draw, so a plain lance
    if (ax > max(env*mix(0.3 + 0.7*smoothstep(0.15, 0.6, pin), 0.72, kp), 0.12*(1. - v))) discard;
    alb *= (0.55 + 0.65*v)*(0.7 + 0.3*smoothstep(0.0, 0.25, ax))*mix(0.78 + 0.4*pin, 1., kp);
    alb = mix(alb, vec3(0.6, 0.72, 0.78), smoothstep(0.75, 1., v)*0.4); vivid = 0.45; kd = 0.45 + 0.55*top;
    add = alb*vL*0.2*fres;
  } else if (m < 4.5) {
    alb *= 0.7 + 0.5*vn3(vW*5.); kd = 0.42 + 0.58*top; vivid = 0.3; add = alb*vL*0.35*fres;
  } else if (m < 5.5) {
    alb *= 0.8 + 0.4*vn3(vW*12.); add = vL*0.7*pow(clamp(1. - dot(N, V), 0., 1.), 1.6); vivid = 0.3;   // silver fuzz
  } else if (m < 6.5) {
    float fur = vn3(vec3(vW.x*2.6, vW.y*0.22, vW.z*2.6)), len = vn3(vec3(vW.x*8., vW.y*0.7, vW.z*8.) + 4.);
    float lent = smoothstep(0.78, 0.9, vn3(vec3(vW.x*1.5, vW.y*3.5, vW.z*1.5) + 9.));          // lenticels
    alb *= (0.16 + 0.75*smoothstep(0.25, 0.75, fur))*(0.6 + 0.5*len);
    alb = mix(alb, vC*1.5, lent*0.6);
    // rime on the upper side: a granular crust in patches with a sharp edge and the bark's shadow under it. A stem that stands up
    // through the hall into the snow (vA.z: how far up it, 0 at the foot and 1 at the roof; nought on a bough or a root) is rimed
    // all round in patches from a little above its foot, and takes the roof's light along its edge: a pale column with dark bark
    // showing through, never a dark bar
    float fis6 = abs(vn3(vec3(vW.x*3.3, vW.y*0.4, vW.z*3.3) + 2.) - 0.5);
    alb *= 0.3 + 0.7*smoothstep(0.0, 0.06, fis6);
    float rg6 = vn3(vW*19.)*(1. - smoothstep(0.02, 0.09, pw)), rn6 = vn3(vW*0.9 + 31.) - 0.5, rv6 = N.y + 0.3*fur + 0.2*len + 0.5*rn6 - 0.2;
    rv6 = max(rv6, 0.33 + 0.12*smoothstep(0.04, 0.4, vA.z)*step(0.001, vA.z) + 0.3*rn6 + 0.55*(fur - 0.5) + 0.3*(len - 0.5));
    float rc6 = smoothstep(0.4, 0.44, rv6);
    alb *= 1. - 0.55*smoothstep(0.28, 0.4, rv6)*(1. - rc6);
    alb = mix(alb, vec3(0.50, 0.60, 0.68)*(0.6 + 0.5*rg6 + 0.3*len), rc6*0.88);
    // a standing stem is lit by the whole hall's roof round it, not only by the snow right above, which is thick where a stem goes
    // into it: its rime, and its bark the more for being so dark
    add = vL*(0.12 + 0.5*step(0.001, vA.z))*fres + alb*mix(uTurq, uCobalt, 0.5)*uGlow*(0.12 + 0.2*top)*mix(4., 1., rc6)*step(0.001, vA.z); vivid = 0.8;
  } else if (m < 7.5) {
    // birch. vA.z = 0 on the trunk: white paper bark in lapping sheets, thin dark lenticels of every length, a rough black collar at
    // the foot. vA.z = 1 on the roots: russet, fluted (the geometry), cracked into flakes, pale where a flake has gone, mossy low down
    float g1 = vn3(vW*1.7), g2 = vn3(vW*5.3);
    vec2 bd = vW.xz - uBirch; float arc = atan(bd.y, -bd.x)*2.8, hy = vW.y;
    vec3 bark = mix(vec3(0.58, 0.57, 0.54), vec3(0.76, 0.73, 0.68), vn2(vec2(arc*0.5, hy*1.3)));
    bark = mix(bark, vec3(0.66, 0.50, 0.44), smoothstep(0.58, 0.8, vn2(vec2(arc*0.35 + 7., hy*0.7 + 3.)))*0.5);     // pink where the outer sheet has peeled
    bark *= 0.85 + 0.15*vn2(vec2(arc*1.3, hy*13.));
    float sheet = abs(fract(hy*0.8 + 0.4*vn2(vec2(arc*0.6, hy*0.2))) - 0.5);
    bark *= 1. - 0.32*(1. - smoothstep(0.0, 0.035 + pw, sheet));                                                    // the edge of one sheet over the next
    float row = floor(hy/0.5), cx = arc/1.7 + h11(row)*7., id = floor(cx);
    float hA = h21(vec2(id, row)), hB = h21(vec2(id + 3.7, row + 1.3));
    float hl = 0.07 + 0.28*hB*hB, ht = 0.07 + 0.09*hA;
    float ldx = fract(cx) - 0.5 - (hA - 0.5)*0.24, ldy = fract(hy/0.5) - 0.5 - (hB - 0.5)*0.4;
    float lval = abs(ldy)/ht + ldx*ldx/(hl*hl), lw = clamp(pw/(ht*0.5), 0.02, 0.6);
    bark = mix(bark, vec3(0.04, 0.035, 0.03), (1. - smoothstep(1. - lw, 1. + lw, lval))*step(0.22, hA)*0.92);        // lenticels: lens-shaped dashes
    float collar = 1. - smoothstep(3.0, 6.4, hy + 2.2*(vn2(vec2(arc*0.8, 3.)) - 0.5));
    float fis = vn2(vec2(arc*3.2, hy*0.5)), fis2 = vn2(vec2(arc*9., hy*1.6));
    bark = mix(bark, mix(vec3(0.03, 0.028, 0.025), vec3(0.2, 0.18, 0.16), smoothstep(0.35, 0.7, fis*0.7 + fis2*0.3)), collar*0.94);
    float rk = vn3(vW*2.0 + 3.), rk2 = vn3(vW*5.1 + 1.), fib = vn3(vW*vec3(11., 11., 11.));
    float crack = (1. - smoothstep(0.0, 0.03 + pw*0.5, abs(rk - 0.5)))*0.75 + (1. - smoothstep(0.0, 0.035 + pw, abs(rk2 - 0.5)))*0.4;
    vec3 root = vC*(0.55 + 0.6*g1)*(0.8 + 0.3*fib)*(1. - min(crack, 0.85));
    root = mix(root, vec3(0.30, 0.22, 0.14)*(0.8 + 0.3*fib), smoothstep(0.66, 0.71, vn3(vW*2.3 + 8.))*0.55);            // paler wood where a flake has gone
    root = mix(root, vec3(0.13, 0.24, 0.07)*(0.5 + 1.0*g2), smoothstep(0.5, 0.75, vn3(vW*0.8 + 21.) + 0.45*(1. - smoothstep(0.2, 4.5, hy)))*0.85);   // moss in the forks
    alb = mix(bark, root, vA.z);
    // rime on what faces up: on the roots a granular crust in patches, sharp at its edge, with the wood's shadow under it
    float rg7 = vn3(vW*21.)*(1. - smoothstep(0.02, 0.09, pw)), rv7 = N.y + 0.3*g1 + 0.3*g2 - 0.2;
    float rc7 = mix(smoothstep(0.55, 0.85, rv7), smoothstep(0.6, 0.64, rv7 + 0.12*(fib - 0.5)), vA.z);
    alb *= 1. - 0.5*vA.z*smoothstep(0.46, 0.6, rv7)*(1. - rc7);
    alb = mix(alb, vec3(0.56, 0.67, 0.76)*mix(1., 0.5 + 0.5*rg7 + 0.3*g2, vA.z), rc7*mix(0.7*(0.55 + 0.45*step(0.45, fib)), 0.86, vA.z));
    add = vL*0.1*fres*(1. - 0.7*vA.z); vivid = mix(0.85, 0.95, vA.z); kd = 0.34 + 0.66*top;
  } else if (m < 8.5) {
    // granite: speckle, a dark joint or two, map lichen in yellow-green islands, grey and rust crusts, moss at the foot, rime above
    float g1 = vn3(vW*0.33), g2 = vn3(vW*1.5), g3 = vn3(vW*3.1), sp = vn3(vW*9.);
    alb = mix(vec3(0.17, 0.17, 0.19), vec3(0.40, 0.38, 0.37), g1*0.55 + g2*0.45)*(0.72 + 0.56*sp);
    alb = mix(alb, vec3(0.48, 0.37, 0.33), step(0.74, vn3(vW*6.3 + 2.))*0.5);
    alb *= 0.4 + 0.6*smoothstep(0.0, 0.03, abs(vn3(vW*0.42 + 7.) - 0.5));
    float l1 = vn3(vW*0.5 + 11.) + 0.1*(g3 - 0.5), lm = smoothstep(0.57, 0.6, l1);
    alb *= 1. - 0.65*smoothstep(0.535, 0.57, l1)*(1. - lm);
    alb = mix(alb, vec3(0.34, 0.40, 0.12)*(0.65 + 0.6*g3), lm*0.92);
    alb = mix(alb, vec3(0.58, 0.61, 0.58)*(0.8 + 0.3*sp), smoothstep(0.66, 0.7, vn3(vW*1.1 + 51.) + 0.08*(sp - 0.5))*0.8);
    alb = mix(alb, vec3(0.46, 0.24, 0.07), smoothstep(0.71, 0.75, vn3(vW*0.85 + 31.) + 0.06*(g3 - 0.5))*0.8);
    alb = mix(alb, vec3(0.12, 0.22, 0.07)*(0.5 + 1.0*g3), (1. - smoothstep(0.4, 4.2, vW.y + 2.5*g2 - 1.))*0.85);
    alb = mix(alb, vec3(0.46, 0.56, 0.66), smoothstep(0.5, 0.85, N.y + 0.3*g2 - 0.12)*0.6);
    kd = 0.28 + 0.72*top; vivid = 0.85; add = vL*0.05*fres;
  } else if (m < 9.5) {
    // feathers: overlapping scallops in rows, each with a soft shadow under its tip; vA.z is the size of one feather
    float fs = max(vA.z, 0.2), rad = length(vO.xy) + 1e-3;
    rad = length(vO.xz) + 1e-3;
    vec2 fq = vec2(atan(vO.x, vO.z + 1e-4)*rad/fs*0.55, vO.y/fs + 0.3*vn2(vO.xz*0.25)); fq.x += 0.5*floor(fq.y);
    vec2 ff = fract(fq) - vec2(0.5, 0.); float tipD = ff.y - 2.2*ff.x*ff.x;
    float edge = smoothstep(0.08, 0.0, tipD) + 0.5*smoothstep(0.3, 0.0, tipD);
    float barb = 0.5 + 0.5*sin((ff.x*9. + ff.y*5.)*6.2832/ (1. + 3.*fwidth(fq.x)));
    alb *= (1. - 0.24*edge)*(0.9 + 0.1*barb*(1. - smoothstep(0.02, 0.2, fwidth(fq.x))))*(0.9 + 0.2*h21(floor(fq)));
    kd = 0.2 + 0.8*top; vivid = 0.75; add = alb*(vL + vD)*(0.22 + 0.5*fres);
  } else if (m < 10.5) {
    // fallen snow: clods and powder
    float g1 = vn3(vW*1.3), g2 = vn3(vW*4.7);
    alb = vec3(0.58, 0.68, 0.78)*(0.72 + 0.3*g1 + 0.2*g2); kd = 0.3 + 0.7*top; vivid = 0.5; add = alb*(vL*0.25 + vD*0.3)*fres;
  } else {
    // a curl of birch paper (vA.z across -1..1, vA.w along 0..1, vC three hashes): white outside, pink-tan within, torn at its edges
    float ax = abs(vA.z), v = vA.w;
    float rag = vn2(vec2(v*5. + vC.r*40., vA.z*2. + vC.g*9.)), tear = vn2(vec2(vA.z*3.5 + vC.g*30., 3.));
    if (ax > 1. - 0.34*rag*smoothstep(0.05, 0.5, v) || v > 1. - 0.3*tear) discard;
    float inner = gl_FrontFacing ? 0. : 1.;
    vec3 outC = vec3(0.74, 0.72, 0.67)*(0.84 + 0.16*vn2(vec2(v*3., vA.z*13.)));
    outC = mix(outC, vec3(0.05, 0.045, 0.04), (1. - smoothstep(0.035, 0.06 + fwAz, abs(vA.z - 0.6*(vC.b - 0.5))))*step(0.15, v)*step(v, 0.25 + 0.5*vC.r)*0.85);
    vec3 inC = mix(vec3(0.62, 0.38, 0.27), vec3(0.72, 0.55, 0.40), vn2(vec2(v*8., vA.z*4. + vC.r*5.)));
    alb = mix(outC, inC, inner); kd = 0.3 + 0.7*top; vivid = 0.9; add = alb*vL*0.3;                                    // the light comes through the paper
  }
  vec3 col = shade(alb, vL, vD, kd, vivid) + add;
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
// ---------------------------------------------------------------------------------------------------------
// Stone and fallen snow seen at arm's length (the boulder, the stones, the fox's heap): aA = (kind: 8 granite, 10 snow; size; seed).
// One height field carries the grain, the joints, the lichen crusts and the snow cap; its slope across the screen turns the normal,
// so a crust stands proud, a joint is cut in and the cap has an edge with a shadow under it.
// Nothing on the stone is cut on a lattice. Its tone and its bumps come from value noise laid twice, each lattice turned off the
// world's axes and the second finer (rn3), so no cell of either shows; its crystals and its lichens come from points scattered one
// to a cell (near3): feldspar laths 0.2 m apart and mica flakes 0.07 m apart, each lying its own way; lichen rosettes of two sizes,
// each with its own number of lobes round the edge, furrows between the lobes and a paler margin, over sheets of map lichen; hair
// cracks and the lichen's areoles are the lines where such a field crosses its middle.
// The pixel's footprint is read for all of it (pw: the length of the change of the world position across one pixel, metres on the
// stone; and for each line the change of its own field across one pixel): an edge is as wide as a pixel is, a crystal or a line
// narrower than a pixel goes into the stone's mean tone, and no grain is drawn finer than a pixel.
// ---------------------------------------------------------------------------------------------------------
const ROCK_VS = /* glsl */`
attribute vec4 aA;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vD; varying vec4 vA;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.);
  vW = wp.xyz; vN = normalize(normal + vec3(0., 1e-5, 0.)); vA = aA; vL = rfLight(wp.xz); vD = dayAt(wp.xyz);
  ${VEND}
}`;
const ROCK_FS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vD; varying vec4 vA;
vec3 h33(vec3 p){ return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))))*43758.5453); }
// value noise with no lattice to be seen: two lattices, each turned off the world's axes, the second finer
float rn3(vec3 p){
  vec3 a = vec3(0.80*p.y + 0.60*p.z, -0.80*p.x + 0.36*p.y - 0.48*p.z, -0.60*p.x - 0.48*p.y + 0.64*p.z);
  vec3 b = vec3(0.80*a.y + 0.60*a.z, -0.80*a.x + 0.36*a.y - 0.48*a.z, -0.60*a.x - 0.48*a.y + 0.64*a.z)*1.31 + 3.7;
  return 0.5*(vn3(a) + vn3(b));
}
// the nearest of the points scattered one to a cell, among the eight cells about p: xyz from that point to p (in cells), w its number
vec4 near3(vec3 p){
  vec3 b = floor(p - 0.5), f = p - b; vec4 best = vec4(0.); float bd = 99.;
  for (int i = 0; i < 8; i++) {
    float fi = float(i); vec3 o = vec3(mod(fi, 2.), mod(floor(fi*0.5), 2.), floor(fi*0.25));
    vec3 hh = h33(b + o), d = f - o - 0.25 - 0.5*hh; float dd = dot(d, d);
    if (dd < bd) { bd = dd; best = vec4(d, fract(hh.x*7.13 + hh.y*3.71)); }
  }
  return best;
}
void main(){
  vec3 N0 = normalize(vN); vec3 V = normalize(cameraPosition - vW); if (dot(N0, V) < 0.) N0 = -N0;
  float pw = length(fwidth(vW));                                                    // a pixel's footprint on the stone, metres
  float fine = 1. - smoothstep(0.015, 0.07, pw), mid = 1. - smoothstep(0.07, 0.35, pw);
  float snowK = step(9., vA.x), size = max(vA.y, 0.4);
  vec3 q = vW + vec3(vA.z, vA.z*0.37, vA.z*0.71);
  // (the two finest grains go to their mean before a pixel is half their wavelength)
  float g1 = vn3(q*0.33), g2 = rn3(q*1.5), g3 = rn3(q*3.1), sp = mix(0.5, rn3(q*9.), 1. - smoothstep(0.02, 0.06, pw)), gr = mix(0.5, rn3(q*23.), 1. - smoothstep(0.008, 0.022, pw));
  // joints, hair cracks and areoles: the lines where a field crosses its middle (fc, fa: that field's change across one pixel)
  float nj = vn3(q*0.42 + 7.), nc = rn3(q*1.1 + 13.), na = rn3(q*7.3 + 3.), fj = fwidth(nj), fc = fwidth(nc), fa = fwidth(na);
  float j1 = abs(nj - 0.5), j2 = abs(nc - 0.5);
  float crack = 0.5*(1. - smoothstep(0.003 + 0.5*fc, 0.008 + 1.5*fc, j2))*(1. - smoothstep(0.06, 0.2, fc))*smoothstep(0.47, 0.6, g2);
  float joint = max(1. - smoothstep(0.0, 0.035, j1), crack);
  float l1 = 0.72*vn3(q*0.5 + 11.) + 0.28*rn3(q*2.3 + 17.) + 0.1*(g3 - 0.5), lm = smoothstep(0.57, 0.6, l1), fl = fwidth(l1);
  float areole = (1. - smoothstep(0.5*fa, 0.04 + 1.5*fa, abs(na - 0.5)))*(1. - smoothstep(0.1, 0.3, fa));
  // What the height field may carry. Its slope is taken across the screen, where it is one value for each block of two pixels by
  // two: a bump narrower than some four pixels would show as a grid of such blocks. So each grain goes out of the height before a
  // pixel is a quarter of its wavelength (k3, kS, kG), an edge in it is at least three pixels wide (jointH, lmH, the rosettes'
  // e), and the hair cracks and areoles, which are a pixel wide, are in the colour alone
  float k3 = 1. - smoothstep(0.04, 0.09, pw), kS = 1. - smoothstep(0.014, 0.03, pw), kG = 1. - smoothstep(0.005, 0.012, pw);
  float jointH = 1. - smoothstep(0.0, 0.035 + 3.*fj, j1), lmH = smoothstep(0.57 - 1.5*fl, 0.6 + 1.5*fl, l1);
  // lichen rosettes of two sizes (2.4 m and 0.9 m apart): grey-green ones (crust) and orange ones (rust), each with five to eight
  // lobes round its edge, a furrow between two lobes and a margin (rimK)
  vec3 t1 = normalize(cross(N0, vec3(0.31, 0.95, 0.08)) + 1e-4), t2 = cross(N0, t1);
  float crust = 0., rust = 0., rimK = 0., furrow = 0.;
  for (int i = 0; i < 2; i++) {
    float sc = i == 0 ? 0.42 : 1.15; vec4 ro = near3(q*sc + (i == 0 ? 51. : 87.)); vec3 d = ro.xyz/sc; float hR = ro.w;
    // (measured across the face from the point's foot on it; a point that lies more than a quarter of a cell off the face grows nothing)
    vec3 dt = d - N0*dot(d, N0); float off = abs(dot(d, N0))*sc;
    float aX = dot(dt, t1), aY = dot(dt, t2);                                     // (at a rosette's exact middle both are nought: the angle is nought there)
    float r0 = (0.2 + 0.2*fract(hR*7.3))/sc, th = atan(aY, aX + step(abs(aX) + abs(aY), 0.)*1e-6), n1 = 5. + floor(fract(hR*13.7)*4.), ph = sin(th*n1 + hR*40.);
    float rim = length(dt)/(r0*(1. + 0.13*ph + 0.07*sin(th*(2.*n1 + 3.) + hR*70.) + 0.2*(g3 - 0.5))), e = max(2.5*pw/r0, 0.03);
    float kR = 1. - smoothstep(0.04, 0.1, pw/r0);                                 // its furrows and its margin: only while it is 20 pixels across and more
    float ins = (1. - smoothstep(1. - e, 1. + e, rim))*step(i == 0 ? 0.25 : 0.5, hR)*(1. - smoothstep(0.2, 0.28, off)), orange = step(0.7, fract(hR*3.1));
    crust = max(crust, ins*(1. - orange)); rust = max(rust, ins*orange); rimK = max(rimK, ins*kR*smoothstep(0.55, 0.95, rim));
    furrow = max(furrow, ins*kR*smoothstep(0.5, 0.95, rim)*(1. - smoothstep(-0.99, -0.86, ph)));
  }
  float capv = N0.y + 0.6*(g2 - 0.5) + 0.4*(g3 - 0.5) - 0.12*jointH;
  float cap = max(smoothstep(0.74, 0.78, capv), snowK);
  float under = smoothstep(0.58, 0.74, capv)*(1. - cap);
  float clod = 0.5, clod2 = 0.5;
  if (snowK > 0.5) { clod = abs(vn3(q*2.3 + 5.) - 0.5); clod2 = abs(vn3(q*5.9 + 9.) - 0.5); }
  // crystals: laths of feldspar and flakes of mica, each lying its own way (kF, kM: how much of each a pixel can still show)
  vec4 fe = near3(q*5. + 11.), mi = near3(q*14. + 4.);
  vec3 aF = normalize(fract(fe.w*vec3(5.3, 11.7, 17.9)) - 0.5 + 1e-3), aM = normalize(fract(mi.w*vec3(7.1, 13.3, 19.7)) - 0.5 + 1e-3);
  float eF = max(pw*5., 1e-6), kF = 1. - smoothstep(0.2, 0.55, eF), dF = sqrt(dot(fe.xyz, fe.xyz) + 3.*dot(fe.xyz, aF)*dot(fe.xyz, aF)), rF = 0.2 + 0.2*fe.w;
  float feld = mix(0.16, (1. - smoothstep(rF - eF, rF + eF, dF))*step(0.3, fe.w), kF);
  // and the large crystals of the granite, 0.5 m apart (in the height they are low cones, so their edges are never a pixel sharp)
  vec4 ph2 = near3(q*2.1 + 31.); vec3 aP = normalize(fract(ph2.w*vec3(3.7, 9.1, 15.3)) - 0.5 + 1e-3);
  float eP = max(pw*2.1, 1e-6), dP = sqrt(dot(ph2.xyz, ph2.xyz) + 4.*dot(ph2.xyz, aP)*dot(ph2.xyz, aP)), rP = 0.2 + 0.22*ph2.w;
  float phen = (1. - smoothstep(rP - eP, rP + eP, dP))*step(0.35, ph2.w)*(1. - smoothstep(0.25, 0.6, eP)), phenH = max(1. - dP/rP, 0.)*step(0.35, ph2.w)*(1. - smoothstep(0.03, 0.07, eP));
  float eM = max(pw*14., 1e-6), kM = 1. - smoothstep(0.2, 0.55, eM), dM = sqrt(dot(mi.xyz, mi.xyz) + 5.*dot(mi.xyz, aM)*dot(mi.xyz, aM)), rM = 0.16 + 0.18*mi.w;
  float mica = mix(0.08, (1. - smoothstep(rM - eM, rM + eM, dM))*step(0.45, mi.w), kM);
  float hRock = 0.07*g3*k3 + 0.05*sp*kS + 0.016*gr*kG + 0.02*phenH - 0.12*jointH + (0.05*lmH + (0.045*crust + 0.03*rust)*(1. + 0.5*rimK - 0.6*furrow))*(0.7 + 0.6*mix(0.5, sp, kS));
  float hSnow = 0.17 + 0.07*g3*k3 + 0.03*sp*kS + 0.016*gr*kG + snowK*(0.5*min(clod, 0.16) + 0.2*min(clod2, 0.1)*mid);
  float h = mix(hRock, hSnow, cap);
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, N0), r2 = cross(N0, dpx); float det = dot(dpx, r1);
  vec3 N = normalize(abs(det)*N0 - sign(det)*(dhx*r1 + dhy*r2)*2.6 + N0*1e-6);
  float top = 0.5 + 0.5*N.y, yb = (vW.y + 0.12)/size;
  vec3 alb = mix(vec3(0.10, 0.10, 0.12), vec3(0.30, 0.28, 0.27), g1*0.55 + g2*0.45)*(0.45 + 1.1*sp);
  alb = mix(alb, vec3(0.46, 0.35, 0.31)*(0.8 + 0.5*fract(fe.w*9.1)), 0.65*feld);
  alb = mix(alb, vec3(0.50, 0.40, 0.36)*(0.8 + 0.4*fract(ph2.w*9.1)), 0.6*phen);
  alb = mix(alb, vec3(0.5, 0.5, 0.48), smoothstep(0.58, 0.7, gr)*0.45);                                     // quartz, glassy grey
  alb = mix(alb, vec3(0.03), 0.65*mica);
  alb *= 1. - 0.78*joint;
  alb *= 1. - 0.6*smoothstep(0.535, 0.57, l1)*(1. - lm);
  alb = mix(alb, vec3(0.30, 0.36, 0.10)*(0.5 + 0.9*g3)*(0.75 + 0.5*sp), lm*0.95);
  alb = mix(alb, vec3(0.44, 0.47, 0.44)*(0.6 + 0.7*sp)*(1. + 0.3*rimK), crust*0.85);
  alb = mix(alb, vec3(0.46, 0.24, 0.07)*(0.6 + 0.7*sp)*(1. + 0.3*rimK), rust*0.8);
  alb *= (1. - 0.4*furrow)*(1. - 0.4*areole*max(lm, max(crust, rust)));
  alb = mix(alb, vec3(0.10, 0.20, 0.06)*(0.5 + 1.0*g3), (1. - smoothstep(0.12, 0.7, yb + 0.5*(g2 - 0.5)))*0.85);
  alb *= 0.4 + 0.6*smoothstep(0.0, 0.22, yb);
  vec3 snow = vec3(0.60, 0.70, 0.80)*(0.76 + 0.2*g2 + 0.14*sp)*(0.84 + 0.3*gr*fine);
  snow *= 1. - snowK*(0.42*(1. - smoothstep(0.0, 0.05, clod)) + 0.25*(1. - smoothstep(0.0, 0.04, clod2))*mid);
  alb = mix(alb, snow, cap);
  alb *= 1. - 0.62*under*(1. - snowK);
  float fres = pow(clamp(1. - dot(N, V), 0., 1.), 3.);
  float glint = step(0.8, mi.w)*(1. - smoothstep(0.1, 0.2 + eM, length(mi.xyz)))*fine*cap;                 // a crystal of the cap catching the light
  vec3 add = vL*(0.05*fres + 0.5*glint) + alb*(vL*0.2 + vD*0.25)*fres*cap;
  vec3 col = shade(alb, vL, vD, 0.12 + 0.88*top*top*1.3, mix(0.85, 0.5, cap)) + add;
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
// russet birch leaves and winged seeds frozen into the floor (alpha-tested quads)
const LEAF_VS = /* glsl */`
attribute vec2 aUv; attribute vec2 aRnd;
varying vec3 vW; varying vec3 vL; varying vec3 vD; varying vec2 vUv; varying vec2 vR;
void main(){
  vec3 p = position;
  if (aRnd.y > 3.5) p.y += 0.05*sin(uTime*3.1 + aRnd.x*50.)*(0.5 + 0.5*aUv.x);       // down stirs in the draught (the kinds are listed at LEAF_FS)
  vW = p; vUv = aUv; vR = aRnd; vL = rfLight(p.xz); vD = dayAt(p); vec4 wp = vec4(p, 1.); ${VEND} }`;
// vR.y: 0.3 a birch leaf frozen into the floor, 1 a winged seed, 4 a down feather of the ptarmigan. The feather's barbs are faded
// out by the pixel's footprint (fwidth of the quad's own coordinate)
const LEAF_FS = /* glsl */`
varying vec3 vW; varying vec3 vL; varying vec3 vD; varying vec2 vUv; varying vec2 vR;
void main(){
  vec2 q = vUv; float seed = step(0.75, vR.y);
  float fq = max(fwidth(q.x), fwidth(q.y));
  if (vR.y > 3.5) {
    float h = vR.x, xx = clamp(q.x*0.5 + 0.5, 0., 1.);
    float w = 0.62*sin(3.14159*pow(xx, 0.6)), ay = abs(q.y), cb = q.x*9. - ay*5. + h*7.;
    float wisp = mix(smoothstep(0.08, 0.5, abs(fract(cb) - 0.5)*2.), 0.6, smoothstep(0.2, 0.5, fq*9.));
    if (ay > max(w*(0.25 + 0.75*wisp), 0.05*step(q.x, 0.9))) discard;
    vec3 alb = vec3(0.70, 0.75, 0.80)*(0.78 + 0.22*wisp)*(1. - 0.25*(1. - smoothstep(0.0, 0.08, ay)));
    gl_FragColor = vec4(shade(alb, vL, vD, 0.9, 0.85) + alb*vL*0.15, 1.);
    ${FOG_F}
    return;
  }
  // birch leaf: ovate, pointed, doubly toothed; q.x runs base (-1) to tip (+1). Seeds are small two-winged ovals.
  float xx = clamp(q.x*0.5 + 0.5, 0., 1.);
  float w = 0.78*pow(xx, 0.42)*pow(1. - xx, 0.8)*1.75;
  w *= 1. + 0.07*sin(xx*46. + vR.x*9.) + 0.035*sin(xx*131.);
  w = mix(w, 0.5*sqrt(max(1. - q.x*q.x, 0.))*(0.45 + 0.55*abs(q.x)), seed);
  float d = abs(q.y) - w;
  if (d > 0. || abs(q.x) > 0.98) discard;
  vec3 alb = mix(vec3(0.13, 0.05, 0.02), vec3(0.30, 0.13, 0.045), vR.x);
  alb = mix(alb, vec3(0.36, 0.30, 0.18), seed);
  float vein = (1. - smoothstep(0.0, 0.035, abs(q.y))) + 0.6*(1. - smoothstep(0.0, 0.05, abs(fract(q.x*3.4 - abs(q.y)*2.6) - 0.5) - 0.42));
  alb *= 1. - 0.4*clamp(vein, 0., 1.)*(1. - seed);
  alb *= 0.75 + 0.5*vn2(vW.xz*6.);
  alb = mix(alb, vec3(0.55, 0.65, 0.74), (1. - smoothstep(0.0, 0.16, -d))*0.6 + 0.25*smoothstep(0.55, 0.8, vn2(vW.xz*3. + 9.)));   // frozen rim, rime patches
  vec3 col = shade(alb, vL, vD, 0.8, 0.85);
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;

// ---------------------------------------------------------------------------------------------------------
// small mammals: lofted body, ears, tail, four legs, fur fins for a soft outline.
// aA = (kind, w, phase offset or across, extra): 0 body, 1 leg, 2 tail, 3 ear, 4 fur fin, 5 the stem it nibbles, 6 eye
// ---------------------------------------------------------------------------------------------------------
const CRIT_VS = /* glsl */`
attribute vec4 aA; attribute vec3 color;
uniform float uTailDrop, uPhase, uRun, uSit, uStride, uLift, uArch, uLen, uSnout, uHipZ, uHipY, uNeckZ, uWhip, uT0, uDuty, uKick, uFootRot, uBob, uRoll, uArchZ, uLook, uHaunch, uTailUp;
uniform vec4 uAnk; uniform vec2 uFootL; uniform vec2 uAhead;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec3 vD; varying vec4 vA; varying vec3 vO; varying vec3 vLa; varying float vTh;
vec3 rotX(vec3 p, vec3 piv, float a){ p -= piv; float c = cos(a), s = sin(a); return vec3(p.x, p.y*c - p.z*s, p.y*s + p.z*c) + piv; }
vec3 rotY(vec3 p, vec3 piv, float a){ p -= piv; float c = cos(a), s = sin(a); return vec3(p.x*c + p.z*s, p.y, p.z*c - p.x*s) + piv; }
float footA;                                                                  // how far this vertex's foot is rolled up on its toes (radians)
vec3 pose(vec3 p){
  float kind = aA.x, zf = clamp(position.z/uLen + 0.5, 0., 1.), tt = uTime + uT0, legK = 0.; footA = 0.;
  if (kind > 0.5 && kind < 1.5) {
    // aA.w: 0 hind leg, 1 hind foot, 2 fore leg, 3 fore foot. A foot in stance is pinned (it moves back at body speed);
    // at the end of the stance it rolls up onto its toes, and it trails sole-up into the swing
    legK = aA.y;
    float f = fract(uPhase/6.28318 + aA.z), st = step(f, uDuty);
    float fs = f/uDuty, fw = clamp((f - uDuty)/(1. - uDuty), 0., 1.), fe = fw*fw*(3. - 2.*fw);
    float fore = step(1.5, aA.w), foot = step(0.5, aA.w - 2.*fore);
    float ang = uFootRot*uRun*mix(1. - smoothstep(0.2, 0.7, fw), smoothstep(0.5, 1., fs), st);
    vec2 piv = mix(uAnk.xy, uAnk.zw, fore); float fl = mix(uFootL.x, uFootL.y, fore);
    if (foot > 0.5) { p = rotX(p, vec3(p.x, piv.x, piv.y), ang); footA = ang; }
    float kb = fw - 0.22;
    float dz = mix(mix(-0.5, 0.5, fe), mix(0.5, -0.5, fs), st)*uStride*uDuty - (1. - st)*uKick*smoothstep(0., 0.12, fw)*exp(-kb*kb/0.03);
    p.z += (dz + fl*(1. - cos(ang)))*aA.y*uRun;
    p.y += ((1. - st)*sin(fw*3.14159)*uLift + fl*sin(ang))*aA.y*uRun;
    p.yz += vec2(0.6, 2.0)*fore*aA.y*uSit;                                   // sitting up, the forepaws come up to the mouth
  } else {
    p.y += uBob*sin(uPhase*2.)*uRun;
    p.x += 0.12*sin(uPhase + zf*5.)*uRun;
    p.y += p.x*uRoll*sin(uPhase)*(1. - zf)*uRun;                              // the haunches rock from foot to foot
    if (uHaunch > 0.) {
      // (the animal we follow) and each thigh works with its own hind foot, on that foot's phase of the stride: forward as the foot
      // comes down, back as it pushes off, up as it swings through
      float fh = 6.28318*(uPhase/6.28318 + (p.x < 0. ? 0. : 0.5)), wq = smoothstep(0.3, 1.4, abs(p.x))*(1. - smoothstep(0.1, 0.44, zf))*uRun*uHaunch;
      p.z += wq*cos(fh); p.y -= 0.55*wq*sin(fh); p.x += sign(p.x)*0.35*wq*cos(fh);
    }
  }
  float arch = uArch*(0.5 + 0.5*sin(uPhase + 0.6))*uRun, az = (zf - uArchZ)/0.2;
  p.y += arch*exp(-az*az)*(1. - legK); p.z += arch*0.55*sin(6.28318*zf);   // the back humps between the leg pairs and the ends draw together; paws stay down
  if (kind > 1.5 && kind < 2.5) { float w = aA.y; p.x += sin(uPhase*1.0 - w*2.5 + tt*2.)*(0.35 + uWhip)*w; p.y += w*w*uWhip*1.6*sin(uPhase + 2.2 - w*2.) - w*w*uTailDrop*uSit;
    if (uTailUp > 0.) p.y += w*uTailUp*(0.6 + 0.4*sin(uPhase*2. - w*2.))*uRun; }      // (the animal we follow) carried up at the run, bobbing with each footfall
  if (kind > 2.5 && kind < 3.5) { float tw = pow(max(sin(tt*1.9 + aA.z*2.3), 0.), 14.); p.z -= aA.y*0.35*tw; p.x += aA.y*0.2*tw*aA.z; p.y += 0.5*uSit; }
  float hw = smoothstep(uNeckZ - 0.06, uNeckZ + 0.1, zf);
  p.x += hw*sin(tt*13.)*uSnout*smoothstep(uNeckZ, 1., zf);                                  // twitching snout
  if (kind > 4.5 && kind < 5.5) p = mix(vec3(0., uHipY*1.3, (uNeckZ - 0.5)*uLen + 1.), p, uSit);
  // sitting up: the trunk shortens and curls up over the haunches, which spread on the ground (a pear, not a leaning tube); the
  // head comes level again on top of it, nodding as it gnaws
  float zN = (uNeckZ - 0.5)*uLen;
  p.z -= 0.32*uSit*max(min(p.z, zN) - uHipZ, 0.);
  p.x *= 1. + 0.2*uSit*(1. - smoothstep(0.15, 0.55, zf));
  p.y = uHipY + (p.y - uHipY)*(1. + 0.3*uSit*smoothstep(0.02, 0.2, zf)*(1. - smoothstep(0.4, 0.66, zf))*step(abs(kind - 2.) , 2.5)*step(0.5, abs(kind - 1.)));
  float nib = uSit*(0.86 + 0.06*sin(tt*9.)) + 0.10*sin(uPhase*2. + 1.)*uRun;
  p = rotX(p, vec3(0., uHipY*1.25, zN - 0.32*uSit*(zN - uHipZ)), nib*hw);
  p = rotX(p, vec3(0., uHipY, uHipZ), -1.08*uSit*smoothstep(0.1, 0.62, zf));
  // a glance back over the shoulder (uLook, radians, to its left when positive): the trunk bends aside from behind the
  // shoulders and the head turns further on the neck, so that from behind we see its cheek, eye, ear and whiskers
  if (abs(uLook) > 0.001) {
    vec3 pb = vec3(0., 0., -0.12*uLen);
    p = rotY(p, pb, uLook*0.25*smoothstep(0.38, uNeckZ, zf));
    p = rotY(p, rotY(vec3(0., 0., zN), pb, uLook*0.25), uLook*0.5*hw);
  }
  return p;
}
void main(){
  vec3 p = pose(position);
  vec4 wp = modelMatrix*vec4(p, 1.);
  float zf = clamp(position.z/uLen + 0.5, 0., 1.);
  vec3 nl = rotY(normal, vec3(0.), uLook*(0.25*smoothstep(0.38, uNeckZ, zf) + 0.5*smoothstep(uNeckZ - 0.06, uNeckZ + 0.1, zf)));
  if (uHaunch > 0.) nl = rotX(nl, vec3(0.), footA);                             // (the animal we follow) a sole that is turned to the eye is lit as it faces
  vec3 n = normalize(mat3(modelMatrix)*nl + vec3(0., 1e-5, 0.));
  n = normalize(mix(n, mat3(modelMatrix)*rotX(normal, vec3(0.), uSit*(0.86*smoothstep(uNeckZ - 0.06, uNeckZ + 0.1, zf) - 1.08*smoothstep(0.1, 0.62, zf))), step(0.01, uSit)));
  vW = wp.xyz; vN = n; vC = color; vA = aA; vO = position; vL = rfLight(wp.xz); vD = dayAt(wp.xyz); vLa = rfLight(wp.xz + uAhead); vTh = rfThick(wp.xz);
  { vec2 dw = wp.xz - uWell.xy; float rw = length(dw)/max(uWell.z, 0.5); vL = max(vL - uDayCol*uWell.w*3.2*(1. - smoothstep(0.75, 1.1, rw)), vec3(0.)); vD = max(vD - uDayCol*uWell.w*0.3*exp(-dot(dw, dw)/650.), vec3(0.)); }
  ${VEND}
}`;
const CRIT_FS = /* glsl */`
uniform float uRimK, uVivid, uFillK, uGain, uUnder, uFurK, uFurC, uStripe, uHipY, uKnee, uLen, uRimA, uFringe, uSoft, uLemStripe, uHaunch, uSit;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vL; varying vec3 vD; varying vec4 vA; varying vec3 vO; varying vec3 vLa; varying float vTh;
void main(){
  float kind = vA.x, isFin = step(3.5, kind)*step(kind, 4.5), isBody = step(kind, 0.5), coat = isFin + isBody, tip = 0.;
  tip = vA.y*isFin;
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW); if (isFin < 0.5 && dot(N, V) < 0.) N = -N;
  // the cards of the soft outline (uFringe): hairs 5 cm apart along a card, raked back on the lengthwise rows; the derivatives are
  // taken here, outside any branch
  float lonF = step(1.5, vA.w), ucF = (vA.z + lonF*vA.y*0.3)/0.055, fwU = fwidth(ucF), awF = clamp(fwU*0.8, 0., 1.);
  vec3 fNF = cross(dFdx(vW), dFdy(vW)); float faceF = abs(dot(fNF/max(length(fNF), 1e-9), V)), silF = 1. - smoothstep(0.3, 0.78, abs(dot(N, V)));
  float dist = length(cameraPosition - vW), nearK = 1. - smoothstep(12., 40., dist);
  // the lie of the coat: streaks that run back along the body and gather at the tail root (th: 0 over the spine, +-pi under the belly)
  float th = atan(vO.x, vO.y - uHipY + 1e-4), rad = length(vec2(vO.x, vO.y - uHipY)), fl = vO.z*0.55 - rad*0.9;
  // (uSoft, the animal we follow: hairs of one width all over, measured round the body in metres, so they do not fan out of the tail root)
  float arcS = th*max(rad, 0.4);
  float st1 = vn2(vec2(mix(th*17., arcS*8., uSoft), fl*mix(3.4, 2.4, uSoft))), st2 = mix(0.5, vn2(vec2(mix(th*41. + 9., arcS*21. + 9., uSoft), fl*mix(7.3, 5.2, uSoft) + 3.)), nearK), clump = vn2(vec2(mix(th*5. + 2., arcS*2.1 + 2., uSoft), fl*1.1));
  float furB = mix(0.5, st1*0.6 + st2*0.4, smoothstep(0.1, mix(0.5, 1.5, uSoft), rad));
  float fur = mix(vn3(vec3(vO.x*7., vO.y*7., vO.z*1.4)), furB, coat), fur2 = mix(vn3(vec3(vO.x*19., vO.y*19., vO.z*4.) + 5.), st2, coat);
  // (own, the animal we follow: the one whose haunches work) where it turns its face to the eye it is pale, in the buff of its own
  // kind: the muzzle, the cheeks under the eye, the chin, the throat and the belly between the legs; the fur's streaks and locks lie
  // over the pale as over the rest. syH: the height on the body at this place along it, -1 under it and 1 over it (the head is
  // carried above the line of the back); the pale's edge is ragged, as fur parts
  float own = uSoft*step(0.01, uHaunch), zfB = vO.z/uLen + 0.5;
  float cyH = uHipY*(1. + 0.53*smoothstep(0.6, 0.8, zfB) - 0.2*smoothstep(0.88, 1., zfB)), syH = (vO.y - cyH)/(0.8*uHipY) + 0.3*(vn2(vec2(th*6., zfB*40.)) - 0.5);
  float paleK = own*coat*max(max(smoothstep(0.91, 0.97, zfB)*(1. - smoothstep(0.1, 0.55, syH)), smoothstep(0.75, 0.82, zfB)*(1. - smoothstep(-0.3, 0.08, syH))), smoothstep(0.3, 0.5, zfB)*(1. - smoothstep(-0.8, -0.4, syH)));
  vec3 vCp = mix(vC, mix(vec3(0.58, 0.47, 0.31), vec3(0.62, 0.48, 0.27), uLemStripe), 0.85*paleK);   // the pale is a warm cream
  vec3 alb = vCp*mix(0.62 + 0.5*fur + 0.3*fur2, (1. + uFurC*0.52*(furB - 0.5))*(1. + uFurC*0.36*(clump - 0.5)), coat*uFurK);
  alb *= 1. - 0.5*uStripe*coat*exp(-th*th/0.09)*smoothstep(0.05 + 0.13*uSoft, 0.3 + 0.14*uSoft, vO.z/uLen + 0.5);   // the darker stripe down the spine (on the animal we follow it dies out on the lower back)
  // (uSoft, the animal we follow) fur that is fur from 20 m behind. The coat lies back toward the tail in locks, 50 round the body and
  // 0.8 m long, with a finer set among them; each is pointed and ends at a place of its own, so the line of the tips is broken; a
  // lock is lit toward its tip, rounded across, and lies in the shadow of the one before it at its root. Measured round the body in
  // radians and along the coat in metres from the tail root, and faded out by the pixel's footprint in both (fwA, fwM: taken here,
  // outside the branch) before a lock is narrower than three pixels, so nothing shimmers
  float mL = vO.z + 0.5*uLen + 0.9*rad, fwA = length(fwidth(vO.xy))/max(rad, 0.08), fwM = fwidth(mL);
  if (uSoft > 0.5 && coat > 0.5) {
    float lk = 0.;
    for (int i = 0; i < 2; i++) {
      float nc = i == 0 ? 50. : 84., lr = i == 0 ? 0.8 : 0.5, cc = th*nc/6.28318 + float(i)*0.37 + 0.3*sin(mL*2.1 + th*3. + float(i)), id = floor(cc), f = fract(cc) - 0.5;
      float hc = h11(id*1.31 + float(i)*7.7), rr = mL/lr + hc*3.7 - 0.5*abs(f), v = fract(rr), hl = h11(id*3.17 + floor(rr)*5.91 + float(i));
      float fc = fwA*nc/6.28318, fr = fwM/lr, keep = (1. - smoothstep(0.3, 0.75, fc))*(1. - smoothstep(0.3, 0.75, fr));
      lk += (i == 0 ? 0.52 : 0.48)*keep*(mix(-1., 1. - 1.7*v, smoothstep(0., max(fr*1.5, 0.06), v)) - 0.5*smoothstep(0.55, 1., abs(f)*2.) + 0.5*(hl - 0.5));
    }
    alb *= 1. + 0.36*lk;
  }
  // the lemming's black stripe (uLemStripe): broad between the shoulders, it narrows down the back, breaks up and ends on the lower back,
  // so that the rump is one tawny mass
  if (uLemStripe > 0.) {
    float bw = mix(0.05, 0.3, smoothstep(0.2, 0.56, zfB)), ends = smoothstep(0.17, 0.3, zfB + 0.07*(vn2(vec2(th*9., zfB*14.)) - 0.5));
    float gaps = smoothstep(0.35, 0.55, vn2(vec2(zfB*23. + 3., 1.7)) + 0.9*smoothstep(0.3, 0.42, zfB));
    float band = (1. - smoothstep(bw*0.6, bw, abs(th) + 0.05*(vn2(vec2(zfB*31., th*7.)) - 0.5)))*ends*gaps;
    alb = mix(alb, vec3(0.012, 0.011, 0.012), 0.92*uLemStripe*coat*band);
  }
  // a tail that is not the followed animal's (the ermine's brush): long hairs lying back along it, dark between them
  float tailK = step(1.5, kind)*step(kind, 2.5)*(1. - uSoft);
  alb *= mix(1., 0.34 + 0.7*vn3(vec3(vO.x*24., vO.y*24., vO.z*0.8) + 3.) + 0.5*vn3(vec3(vO.x*60., vO.y*60., vO.z*2.) + 7.)*nearK, tailK);
  alb *= mix(1., mix((0.66 + 0.5*tip)*(0.86 + 0.28*h11(vA.w*17.3)), 0.96 + 0.2*tip, uFringe), isFin);
  float isEar = step(2.5, kind)*step(kind, 3.5), earIn = isEar*smoothstep(0.08, 0.7, vA.w);                // the bare inside of an ear, out to its furred rim
  float earEdge = isEar*(1. - smoothstep(-0.9, -0.2, vA.w));                                                // the rim of the cup itself (aA.w -1 there)
  alb = mix(alb, vec3(0.36, 0.2, 0.18)*(0.45 + 0.75*vA.y)*(0.85 + 0.3*fur2)*(1. - 0.6*smoothstep(0.7, 1., vA.w))*(1. + 0.35*uSoft), earIn);
  float top = 0.5 + 0.5*N.y;
  // the animal we follow (own): its rump is a round end under a glowing roof, lightest on top and darker toward the belly and the
  // ground. Where the coat closes behind, the light is taken by the height on the body, as on a ball. Forward of the shoulders
  // (frontK) it is lit as a face is: the roof's light rims its whole outline, muzzle, cheek and throat, and the daylight reaches
  // what is turned down, so that a head turned to the eye stands off the floor
  float yB = clamp((vO.y - uHipY)/max(uHipY, 0.1), -1., 1.), frontK = smoothstep(0.5, 0.72, zfB), ownB = own*(1. - frontK);
  top = mix(top, 0.5 + 0.5*yB, 0.8*own*coat*(1. - smoothstep(0.1, 0.36, zfB))*(1. - uSit));   // (sitting up, its height on the body is no longer its height over the ground)
  float topR = mix(0.35 + 0.65*top, smoothstep(0.2, 0.7, top), ownB*(1. - uSit));   // at the run, behind the shoulders, its rim of light stands over the back and down the flanks: none on what is turned to the ground
  float rim = pow(clamp(1. - abs(dot(N, V)), 0., 1.), mix(2.2, 3.6, uSoft));
  rim = mix(rim, max(rim, 0.38*smoothstep(0.45, 0.95, top)), own*coat);    // (own) the roof's glow lies on all that faces up, whichever way it is seen from
  rim *= 1. - isEar*mix(0.45, 0.85, earIn);                                 // an ear takes the light along its edge, not as a sheet over its face
  float kd = mix(0.22 + 0.78*top, 0.05 + 0.95*top*top, uUnder);            // uUnder: a white coat needs a real shadow side to have volume
  // the animal we follow (uSoft) takes its tone from the roof over its own place: under a thin bright roof, where the ground about
  // it glows, it goes down to a dark shape; under deep dim snow, where the floor is dark, its coat is lifted clear of the floor's
  // tone and keeps its own hue. Daylight that falls on it (a pool, a moonbeam) never washes it pale
  float deep = uSoft*smoothstep(0.22, 0.7, clamp(vTh, 0., 1.));
  float lumL = dot(vL, vec3(0.25, 0.55, 0.2));
  // (uSoft) a head, and the pale of the animal we follow, are lit by the roof and not dyed by it: the light that fills them and rims
  // them keeps a quarter of the roof's hue and is a warm cream for the rest (headSel: where; vLh: the roof's light so tempered)
  float headSel = uSoft*max(frontK, paleK);
  vec3 vLh = mix(vL, mix(vec3(lumL)*vec3(1.08, 1., 0.8), vL, 0.25), headSel);
  vec3 Dk = mix(vD, vD/(1. + 2.4*dot(vD, vec3(0.25, 0.55, 0.2))), uSoft), DkR = Dk;
  // (own) daylight comes from above and leaves the coat its hue: no blue wash over the faces turned to the eye (the rim of light
  // along its outline keeps the daylight's own colour: DkR)
  Dk = mix(Dk, vec3(dot(Dk, vec3(0.25, 0.55, 0.2)))*vec3(1.05, 0.96, 0.8)*mix(0.3 + 0.7*top, 1., frontK), 0.75*own*coat);
  vec3 Lk = vL*uGain*mix(1., mix(0.68, 1.8, deep), uSoft)/(1. + uKnee*lumL);
  vec3 col = shade(alb, Lk, Dk, kd, mix(uVivid, 0.94, deep)) + alb*(vLh + Dk)*uFillK*mix(1., 0.4 + 0.8*top, ownB);
  // (own) its shadow side keeps the coat's hue: as dark as the shade makes it, in the fur's own colour and not in the shadow's blue
  col = mix(col, alb*(dot(col, vec3(0.25, 0.55, 0.2))/max(dot(alb, vec3(0.25, 0.55, 0.2)), 1e-3)), 0.62*own*coat);
  float darkF = uSoft*(1. - smoothstep(0.012, 0.05, max(alb.r, alb.g)));                           // black fur stays black: no navy floor under it
  col = max(col - uShadowCol*0.47*darkF, vec3(0.));
  rim *= mix(0.55 + 0.9*fur2, 0.35 + 1.3*furB, coat);
  float isTail = step(1.5, kind)*step(kind, 2.5);
  vec3 Lr = mix(vL, Lk, step(0.01, uKnee)) + Dk;
  // the glow of the roof ahead of a running animal rims its back, ears and haunches (uRimA: how much)
  Lr = max(Lr, vLa*uRimA);
  // (uSoft) the rim is the roof's own light over the animal, in the roof's hue and never fainter than a part of its full glow, so
  // that it draws the back, the ears, the tail and the heels where the snow is deep and the ground dark; black fur takes a thread of it
  vec3 Lroof = max(vL*max(lumL, 0.13*uGlow)/max(lumL, 1e-3), vLa*uRimA) + DkR*0.5;
  Lr = mix(Lr, Lroof, uSoft);
  // (the rim of a head keeps a quarter of the roof's hue, the rim of the back behind it a little over half: one animal from nose to rump)
  Lr = mix(Lr, mix(vec3(dot(Lr, vec3(0.25, 0.55, 0.2)))*vec3(1.08, 1., 0.8), Lr, mix(0.58, 0.25, max(frontK, paleK))), uSoft);
  float rimS = mix(1. - 0.35*uSoft, (0.9 + 1.5*deep)*(1. - 0.86*darkF), uSoft);
  // (own: a tuft of the outline has the coat's colour at its root and takes the light at its tip alone)
  col += Lr*rim*uRimK*topR*mix(alb*3.5, vec3(1.), mix(0.22, 0.5 - 0.14*ownB, uSoft))*(1. - 0.5*isTail)*(1. - isFin*(1. - 0.3*uFringe*mix(1., 0.6 + 1.2*tip*tip, own)))*rimS;
  col += Lr*pow(clamp(1. - abs(dot(N, V)), 0., 1.), 4.5)*0.5*darkF*(0.3 + 0.7*top)*(1. - uFringe);       // and takes a hair-thin edge of the roof's light
  // a black head has a form all the same: the roof's light lies as a dim sheen on its crown and on what else of it faces up, along
  // the lie of the fur, and a broader edge of light draws its outline, so that it is a head and not a dark shape
  // (the tufts of its outline are tipped with that light)
  { float headK = darkF*smoothstep(0.5, 0.62, zfB);
    col += Lr*headK*(1. - uFringe)*(0.13*smoothstep(0.3, 0.9, top)*(0.5 + 1.0*furB) + 0.34*pow(clamp(1. - abs(dot(N, V)), 0., 1.), 2.4)*(0.35 + 0.65*top));
    col += Lr*headK*uFringe*0.3*tip*tip*isFin; }
  // a black tail tip keeps a thin lit edge, so that it shows against a dark wall
  col += Lr*pow(rim, 0.7)*0.55*isTail*(1. - smoothstep(0.02, 0.08, vC.r));
  col += Lr*uRimK*0.3*tip*tip*isFin*mix(0.4 + 0.6*top, topR, own)*mix(alb*3.5, vec3(1.), 0.3)*(1. - 0.75*uFringe)*mix(1., (1. + 1.2*deep)*(1. - 0.8*darkF), uSoft);        // light caught in the fur tips
  col += Lr*earEdge*0.32*(0.4 + 0.6*vA.y)*mix(alb*3.5, vec3(1.), 0.45)*(1. - 0.75*darkF);                     // the lit rim of the ear's cup
  col += vec3(0.85, 0.36, 0.3)*dot(vL + Dk, vec3(0.25, 0.55, 0.2))*0.1*earIn*(0.3 + 0.7*vA.y)*(1. + 0.5*uSoft);  // the roof's light comes through the thin ear
  if (kind > 5.5) { vec3 R = reflect(-V, N); col = vec3(0.004, 0.006, 0.012) + (vL + vD)*pow(max(R.y, 0.), 14.)*1.2; }
  float alpha = 1.;
  if (uFringe > 0.5) {
    float v = vA.y, hs = vA.w - 2.*lonF, id = floor(ucF), f = fract(ucF) - 0.5, h = h11(id*1.37 + hs*91.);
    float Ls = 0.42 + 0.58*h;                                                                    // each hair its own length
    float hair = (1. - smoothstep(0.14, 0.46, abs(f + (h - 0.5)*0.4)))*(1. - smoothstep(Ls*0.6, Ls, v));
    float soft = 0.6*(1. - smoothstep(0.15, 0.95, v));                                           // what the hairs come to where they are too fine to be told apart
    // there they stand in tufts, 0.3 m of the row each, pointed and of their own lengths, which is what makes the outline ragged
    // from far behind; a tuft narrower than two pixels goes back into the soft edge
    float tc = ucF*0.19 + hs*3.3, tH = h11(floor(tc)*2.13 + hs*57.), tv = v/(0.4 + 0.6*tH), fT = max(fwU*0.19, 1e-6), tw = 0.5*(1. - 0.9*clamp(tv, 0., 1.));
    float tuft = (1. - smoothstep(tw - fT, tw + fT, abs(fract(tc) - 0.5 + (tH - 0.5)*0.25*tv)))*step(tv, 1.);
    soft = mix(max(tuft, 0.25*soft), soft, smoothstep(0.3, 0.8, fT));
    alpha = max(1. - smoothstep(0.04, 0.26, v), mix(hair, soft, awF))*silF*smoothstep(0.12, 0.45, faceF);
    alpha *= mix(1., 0.45 + 0.55*smoothstep(0.15, 0.6, top), own);                               // (own) the outline is thinner where the body is in its own shade
  }
  gl_FragColor = vec4(col, alpha);
  ${FOG_F}
}`;
// soft point sprites: vCol.rgb is linear HDR colour, vCol.a opacity
const PT_FS = (add) => /* glsl */`
varying vec4 vCol;
void main(){
  vec2 d = gl_PointCoord - 0.5; float r = dot(d, d)*4.;
  float a = exp(-r*3.5)*(1. - smoothstep(0.6, 1., r))*vCol.a;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vCol.rgb, a);
  ${add ? FOG_ADD : FOG_F}
}`;

// the ptarmigan: a smooth body under some fifteen hundred separate feathers. aF = (across -1..1, along 0..1, hash, kind):
// 0 skin, 1 white feather, 2 black tail feather, 3 horn (bill, claws), 4 eye, 5 comb. aBN is the body's own smooth normal at the
// feather's root, which the feather is mostly lit by, so the bird shades as one soft mass and each feather only adds its edge
const BIRD_VS = /* glsl */`
attribute vec3 aBN; attribute vec4 aF;
varying vec3 vW; varying vec3 vN; varying vec3 vBN; varying vec3 vL; varying vec3 vD; varying vec4 vF;
void main(){
  vec3 p = position; float isF = step(0.5, aF.w)*step(aF.w, 2.5);
  float shiver = pow(max(sin(uTime*0.8 + position.z*0.3 + position.y*0.2), 0.), 10.);          // a ruffle runs through the plumage now and then
  p += aBN*(sin(uTime*1.9 + aF.z*40.)*0.03 + 0.15*shiver)*aF.y*isF;
  vec4 wp = modelMatrix*vec4(p, 1.);
  mat3 m3 = mat3(modelMatrix);
  vN = normalize(m3*normal + vec3(0., 1e-5, 0.)); vBN = normalize(m3*aBN + vec3(0., 1e-5, 0.));
  vW = wp.xyz; vF = aF; vL = rfLight(wp.xz); vD = dayAt(wp.xyz);
  ${VEND}
}`;
const BIRD_FS = /* glsl */`
uniform vec3 uKey;
varying vec3 vW; varying vec3 vN; varying vec3 vBN; varying vec3 vL; varying vec3 vD; varying vec4 vF;
void main(){
  float kind = vF.w, x = vF.x, ax = abs(x), v = vF.y, h = vF.z;
  float isF = step(0.5, kind)*step(kind, 2.5);
  vec3 V = normalize(cameraPosition - vW);
  vec3 Ng = normalize(vN); if (dot(Ng, V) < 0.) Ng = -Ng;
  vec3 Nb = normalize(vBN);
  vec3 N = normalize(mix(Ng, Nb, 0.72*isF));
  vec3 alb = vec3(0.79, 0.775, 0.74); float occ = 1., edge = 0.;
  if (isF > 0.5) {
    // the vane: full a seventh of the way out, round at the tip, its last third loosening into separate barbs when seen close
    float w = sqrt(clamp(v/0.14, 0., 1.))*sqrt(max(1. - pow(max(v - 0.3, 0.)/0.7, 2.), 0.));
    float near = 1. - smoothstep(16., 42., length(cameraPosition - vW));
    float rag = max(vn2(vec2(v*17. + h*40., x*2.3 + h*7.)) - 0.4, 0.)*0.5*smoothstep(0.3, 1., v)*near;
    if (ax > w*(0.97 - rag)) discard;
    edge = clamp(ax/max(w, 0.05), 0., 1.);
    occ = mix(0.46, 1., smoothstep(0.0, 0.6, v));                                            // its root lies under the feather in front
    alb *= 0.9 + 0.1*smoothstep(0.4, 1., v);
    alb *= 1. - 0.09*(1. - smoothstep(0.02, 0.09, ax))*near*step(v, 0.9);                     // the shaft
    alb *= mix(1., 0.9 + 0.2*vn2(vec2(x*3.1 + h*9., (v - ax*0.35)*22.)), near);              // barbs, as soft streaks
    alb *= 0.93 + 0.12*h;
    if (kind > 1.5) alb = mix(vec3(0.02, 0.02, 0.026)*(0.7 + 0.6*edge), vec3(0.6, 0.6, 0.58), smoothstep(0.94, 0.975, v));
  } else if (kind < 0.5) { alb *= 0.6; }
  else if (kind < 3.5) { alb = vec3(0.028, 0.027, 0.03); }
  else if (kind < 4.5) { alb = vec3(0.004, 0.005, 0.008); }
  else { alb = vec3(0.50, 0.02, 0.03); }
  float up = N.y*0.5 + 0.5, kk = dot(N, uKey);
  float kdDay = smoothstep(-0.3, 0.9, kk);
  vec3 roof = vL*vec3(0.58, 1.0, 1.12)*(0.26 + 0.5*up);                                      // the roof's turquoise fills the shadow side
  vec3 col = alb*occ*(vD*kdDay*1.6*vec3(1.05, 1.0, 0.9) + roof + uShadowCol*1.4);
  col += alb*(vD*0.35 + vL*0.12)*isF*(0.3 + 0.7*edge)*pow(clamp(1. - abs(dot(Ng, V)), 0., 1.), 1.5);        // light in the feather edges along the outline
  if (kind > 2.5) { vec3 R = reflect(-V, Ng); col += (vL + vD)*pow(max(R.y, 0.), 16.)*(kind < 4.5 ? 0.8 : 0.25); }
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;

// the fox's head and paw: a smooth skin under a few thousand separate locks of fur. aF = (x, y, z, kind):
// 0 skin (sin of the angle round the head, 0, hash)   1 a lock of fur (across -1..1, along 0..1, hash)   2 the nose pad (unit coords)
// 3 an eye (u toward the nose, v up, side)   4 a whisker (side -1..1, along 0..1, hash; aBN is its tangent)   5 the inside of an ear
// 6 claw. aBN is the skin's own smooth normal at a lock's root: the coat is lit as one soft mass and each lock adds its edge
const FOX_VS = /* glsl */`
attribute vec3 aBN; attribute vec4 aF; attribute vec3 color;
uniform float uPx;
varying vec3 vW; varying vec3 vN; varying vec3 vBN; varying vec3 vC; varying vec3 vL; varying vec3 vD; varying vec3 vO; varying vec4 vF;
void main(){
  vec3 p = position; float kind = aF.w;
  float isT = step(0.5, kind)*step(kind, 1.5), isW = step(3.5, kind)*step(kind, 4.5);
  p += aBN*(sin(uTime*2.1 + aF.z*40.)*0.05 + sin(uTime*6.3 + aF.z*23.)*0.02)*aF.y*isT;                 // the tips of the fur stir
  p.y += isW*aF.y*aF.y*(0.22*sin(uTime*7.3 + aF.z*30.) + 0.3*pow(max(sin(uTime*1.7 + aF.z*3.), 0.), 8.)); // whiskers tremble as it snuffs
  vec4 wp = modelMatrix*vec4(p, 1.);
  mat3 m3 = mat3(modelMatrix);
  vec3 n = normalize(m3*normal + vec3(0., 1e-5, 0.)), bn = normalize(m3*aBN + vec3(0., 1e-5, 0.));
  if (isW > 0.5) {
    // a whisker is a ribbon turned to the eye and never thinner than a pixel and a half
    vec3 Vv = cameraPosition - wp.xyz; float d = max(length(Vv), 0.1);
    vec3 S = cross(bn, Vv); S /= max(length(S), 1e-4);
    wp.xyz += S*aF.x*max(0.035*(1. - 0.6*aF.y), 0.8*d/max(uPx, 1.));
    n = Vv/d;
  }
  vW = wp.xyz; vN = n; vBN = bn; vC = color; vO = position; vF = aF; vL = rfLight(wp.xz); vD = dayAt(wp.xyz);
  ${VEND}
}`;
const FOX_FS = /* glsl */`
uniform float uFoxHoleY;
varying vec3 vW; varying vec3 vN; varying vec3 vBN; varying vec3 vC; varying vec3 vL; varying vec3 vD; varying vec3 vO; varying vec4 vF;
void main(){
  float kind = vF.w, h = vF.z;
  vec3 V = normalize(cameraPosition - vW);
  vec3 Ng = normalize(vN); if (dot(Ng, V) < 0.) Ng = -Ng;
  vec3 Nb = normalize(vBN);
  float dist = length(cameraPosition - vW), near = 1. - smoothstep(22., 60., dist);
  float lum = dot(vL, vec3(0.25, 0.55, 0.2));
  vec3 Lv = mix(vL, vec3(lum)*vec3(1.05, 1.0, 0.9), 0.9);                                  // russet keeps its own hue under the blue-green roof
  vec3 alb = vC, N = Ng, add = vec3(0.); float occ = 1., gloss = 0., snowK = 0.;
  float fwX = fwidth(vF.x) + 1e-4, fwY = fwidth(vF.y) + 1e-4;                                // taken here, outside the branches
  if (kind < 0.5) {
    // skin: the short coat as fine streaks lying back from the nose, the dark line of the lips, the rows of dark pits the whiskers grow from
    float th = atan(vO.x, vO.y + 0.4), fl = vO.z*1.7 - length(vO.xy)*0.5;
    float st1 = vn2(vec2(th*26., fl*1.9)), st2 = mix(0.5, vn2(vec2(th*70. + 9., fl*4.6 + 3.)), near);
    alb *= 0.62 + 0.42*st1 + 0.3*st2;
    float sA = vF.x, z = vO.z;
    float sLip = -0.34 + 0.3*smoothstep(5.3, 6.6, z) - 0.1*smoothstep(3.6, 2.5, z);
    float dl = abs(sA - sLip), fw = fwX;
    float lip = (1. - smoothstep(0.035, 0.05 + fw, dl))*smoothstep(2.3, 2.9, z)*step(z, 6.9);
    alb = mix(alb, vec3(0.012, 0.01, 0.01), lip*0.92);
    alb *= 1. - 0.35*(1. - smoothstep(0.05, 0.2, dl))*smoothstep(2.3, 2.9, z);              // the shadow the upper lip throws
    vec2 wc = vec2(z*2.1, (sA - 0.02)*9.), wf = fract(wc) - 0.5;
    float pad = smoothstep(3.5, 3.9, z)*(1. - smoothstep(5.5, 5.8, z))*step(-0.26, sA)*step(sA, 0.2);
    alb *= 1. - 0.75*pad*(1. - smoothstep(0.12, 0.2, length(wf)));
    snowK = smoothstep(0.62, 0.8, vn3(vO*1.4 + 3.) + 0.25*Ng.y)*smoothstep(0.1, 0.6, Ng.y);
  } else if (kind < 1.5) {
    // a lock of fur: pointed, parting from a little above its root into three strands and each strand into hairs, so that its end
    // is a wisp and not a flat blade; dark at the root where the lock in front lies over it
    float x = vF.x, ax = abs(x), v = vF.y;
    float wv = pow(max(1. - v, 0.), 0.6), comb = (0.5 + 0.5*cos(x*9.42 + h*6.283))*(0.4 + 0.6*(0.5 + 0.5*cos(x*24. + h*17.))), part = smoothstep(0.14, 0.8, v);
    if (ax > wv*(1. - part*0.9*(1. - comb))) discard;
    N = normalize(mix(Ng, Nb, 0.74));
    occ = mix(0.4, 1., smoothstep(0., 0.55, v));
    alb *= (0.8 + 0.4*h)*(0.84 + 0.32*vn2(vec2(x*4. + h*31., v*2.3)))*(0.9 + 0.3*v);
    add = alb*(vD*0.5 + Lv*0.5)*v*v*pow(clamp(1. - abs(dot(Ng, V)), 0., 1.), 1.5);                         // light caught in the tips along the outline
    snowK = step(0.82, fract(h*7.31))*smoothstep(0.25, 0.6, Nb.y)*smoothstep(0.2, 0.7, v);  // powder clinging to the fur that faces up
  } else if (kind < 2.5) {
    // the nose: wet black leather, pebbled, with two comma nostrils and the groove below them
    vec3 q = vF.xyz; float axn = abs(q.x);
    float dn = length(vec2((axn - 0.44)/0.2, (q.y + 0.02 - 0.5*(axn - 0.44))/0.13));
    float nost = (1. - smoothstep(0.7, 1.05, dn))*step(0., q.z);
    float groove = (1. - smoothstep(0.02, 0.07, axn))*step(q.y, 0.05)*step(0., q.z);
    float peb = vn3(vO*13.), peb2 = vn3(vO*31.);
    alb = vec3(0.016, 0.014, 0.015)*(0.6 + 0.8*peb)*(1. - 0.9*nost)*(1. - 0.6*groove);
    N = normalize(Ng + (vec3(peb, peb2, vn3(vO*13. + 7.)) - 0.5)*0.5*near);
    gloss = 1. - nost;
  } else if (kind < 3.5) {
    // an eye: amber iris with a dark upright slit, a black rim, lids that blink, and a glint
    float u = vF.x, v = vF.y;
    float open = 1. - 0.97*pow(max(sin(uTime*0.83 + 1.3), 0.), 70.);
    float lidU = 0.56*pow(max(1. - u*u*1.1, 0.), 0.6)*open, lidL = -0.4*pow(max(1. - u*u*1.1, 0.), 0.7)*open;
    float fw = fwY;
    float inEye = smoothstep(lidL - fw, lidL + fw, v)*(1. - smoothstep(lidU - fw, lidU + fw, v));
    float r = length(vec2(u, v));
    vec3 iris = mix(vec3(0.42, 0.17, 0.02), vec3(0.95, 0.56, 0.08), smoothstep(0.1, 0.5, r))*(0.75 + 0.5*vn2(vec2(atan(v, u)*9., r*4.)));
    iris *= 1. - 0.75*smoothstep(0.46, 0.6, r);
    float pup = 1. - smoothstep(0.85, 1.1, length(vec2(u/0.14, v/0.4)));
    vec3 eye = mix(iris, vec3(0.004), pup);
    eye = mix(vec3(0.02, 0.012, 0.008), eye, 1. - smoothstep(0.58, 0.66, r));
    eye *= 0.45 + 0.55*smoothstep(lidU, lidU - 0.3, v);                                      // the shadow of the upper lid
    alb = mix(vec3(0.012, 0.01, 0.01), eye, inEye);
    gloss = 0.6 + 0.4*inEye;
    float gl = (1. - smoothstep(0.05, 0.1, length(vec2(u + 0.14, v - 0.2))))*inEye;
    add = (vD*2.2 + Lv*3. + vec3(0.25))*gl + alb*(vD*0.5 + Lv*0.6)*inEye;                    // the iris glows a little, like a held lamp
  } else if (kind < 4.5) {
    alb = vec3(0.6, 0.58, 0.52)*(0.6 + 0.4*smoothstep(0., 0.3, vF.y)); N = normalize(V + vec3(0., 0.6, 0.));
    add = alb*(vD*0.5 + Lv*0.5);
  } else if (kind < 5.5) {
    alb *= 0.7 + 0.5*vn2(vO.xy*2.3); add = vec3(0.5, 0.2, 0.14)*(vD*0.16 + Lv*0.2);          // the light through the thin ear
  } else { alb = vec3(0.11, 0.1, 0.09); gloss = 0.5; }
  alb = mix(alb, vec3(0.6, 0.7, 0.8), snowK*0.85);
  float up = N.y*0.5 + 0.5, kdDay = smoothstep(-0.35, 0.8, N.y);
  vec3 col = alb*occ*(Lv*(0.5 + 2.0*up) + uShadowCol*2.0 + vD*(0.3 + 1.0*kdDay));
  col += uShadowCol*0.4*exp(-dot(col, vec3(4., 8., 4.)));
  vec3 R = reflect(-V, N); float sp = max(pow(max(R.y, 0.), 20.), 0.7*pow(max(dot(N, normalize(V + vec3(0., 0.9, 0.))), 0.), 40.)), fres = pow(clamp(1. - dot(N, V), 0., 1.), 3.);
  col += (vD*1.6 + vL*1.2)*(sp*1.5 + 0.25*fres)*gloss;
  col += add;
  // the neck and the leg pass into the shadow of the hole they come through: the fur darkens over the last four metres under the roof
  col *= 1. - 0.85*smoothstep(uFoxHoleY - 4.6, uFoxHoleY - 0.6, vW.y + 0.8*(vn3(vO*0.9) - 0.5));
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;

// one mammal geometry from a table of body sections [zf 0 (rump) .. 1 (nose), centre y, radius y, radius x].
// sp.haunch shapes the rear as two thigh masses with a cleft under the tail; sp.fin is the length of the fur that stands out of
// the coat as raked, pointed tufts (drawn in CRIT_FS), which is what breaks the outline; feet are flat pads with toes
function mammalGeometry(sp) {
  const g = new Soup(), L = sp.len, rows = sp.rows, SIDES = sp.sides || 16, rings = [], NR = rows.length, hk0 = sp.haunch || 0, NFR = sp.rings || 26;
  const hsh = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  // a section of the body at zf: straight between the rows of the table, or (sp.smooth) a curve through them, so that a body of many
  // rings has no crease at a row
  const at = (zf) => {
    for (let i = 1; i < NR; i++) if (zf <= rows[i][0]) {
      const a = rows[i - 1], b = rows[i], h = b[0] - a[0], t = (zf - a[0]) / h;
      if (!sp.smooth) return [zf, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
      const p = rows[Math.max(i - 2, 0)], q = rows[Math.min(i + 1, NR - 1)], t2 = t * t, t3 = t2 * t;
      const m = (k) => (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * h * (b[k] - p[k]) / Math.max(b[0] - p[0], 1e-4) + (3 * t2 - 2 * t3) * b[k] + (t3 - t2) * h * (q[k] - a[k]) / Math.max(q[0] - a[0], 1e-4);
      return [zf, m(1), Math.max(m(2), 0.03), Math.max(m(3), 0.03)];
    }
    return rows[NR - 1];
  };
  const fine = []; for (let i = 0; i <= NFR; i++) fine.push(at(sstep(0, 1, i / NFR) * 0.35 + (i / NFR) * 0.65));
  let maxRx = 0.1; for (const r of rows) maxRx = Math.max(maxRx, r[3]);
  const cleftK = (zf, s, c) => hk0 * (1 - sstep(0.02, 0.2, zf)) * Math.exp(-(c * c) / 0.07) * (s < 0.35 ? 1 : 0.2);
  const pt = (r, k, out = 0) => {
    const a = k / SIDES * TAU, s = Math.sin(a), c = Math.cos(a), zf = r[0];
    const hk = hk0 * sstep(0.0, 0.07, zf) * (1 - sstep(0.2, 0.42, zf)), mid = Math.exp(-(c * c) / 0.07);
    const ry = r[2] * (s < 0 ? 0.82 : 1) + out, rx = (r[3] + out) * (1 + 0.26 * hk * Math.exp(-((s + 0.4) ** 2) / 0.2) * Math.abs(c));   // thighs bulge low on each side
    return [c * rx, r[1] + s * ry + hk * mid * (s < 0 ? 0.32 : -0.09) * r[2],                  // the belly is tucked up between them; a shallow dip over the spine
      (zf - 0.5) * L + 0.4 * cleftK(zf, s, c)];                                               // and the cleft under the tail
  };
  for (const r of fine) { const ring = []; for (let k = 0; k < SIDES; k++) { const a = k / SIDES * TAU, p = pt(r, k), s = Math.sin(a), c = Math.cos(a), ao = 1 - 0.32 * cleftK(r[0], s, c), cl = sp.coat(r[0], s, c); ring.push(g.v(p[0], p[1], p[2], [cl[0] * ao, cl[1] * ao, cl[2] * ao], [0, r[0], 0, 0])); } rings.push(ring); }
  g.loft(rings, true);
  // fur: pointed tufts lying back along the coat like shingles, each lifted off the surface, splayed and sized on its own. They
  // give the coat its depth and break the outline (no alpha: they are plain triangles, so they hold at any distance)
  const fin = sp.fin ?? 0;
  if (fin > 0) {
    const TPF = sp.tufts || 4, P0 = new V3(), Fl = new V3(), Nn = new V3(), Sd = new V3(), Dr = new V3(), q0 = new V3();
    for (let j = 1; j < fine.length - 2; j++) for (let k = 0; k < SIDES; k++) for (let q = 0; q < TPF; q++) {
      const hh = hsh(j + q * 17.3, k), h2 = hsh(k + 3.7 + q * 5.1, j + 9.1), h3 = hsh(j + 5.3, k + 1.9 + q * 7.7), h4 = hsh(q + 1.1 + j * 0.37, k * 2.3 + 0.7);
      const zf = clamp(fine[j][0] + (hh - 0.5) * 0.045, 0.02, 0.975), ka = k + h2, r = at(zf), rb = at(Math.max(zf - 0.03, 0.004));
      const am = ka / SIDES * TAU; if (Math.sin(am) < -0.62) continue;
      const a = pt(r, ka), b = pt(rb, ka), c = pt(r, ka + 0.5);
      P0.set(a[0], a[1], a[2]); Fl.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();          // the lie of the coat: back along the surface
      Sd.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize(); Nn.crossVectors(Sd, Fl).normalize();
      const flip = Nn.x * a[0] + Nn.y * (a[1] - r[1]) < 0; if (flip) Nn.negate();
      const len = fin * (0.5 + 0.5 * Math.min(r[3] / (0.6 * maxRx), 1)) * (zf > sp.neckZ ? 0.5 : 1) * (0.6 + 0.8 * h3), lift = 0.16 + 0.34 * h4, w = len * (0.13 + 0.09 * hh);
      Dr.copy(Fl).multiplyScalar(Math.cos(lift)).addScaledVector(Nn, Math.sin(lift)).addScaledVector(Sd, (h2 - 0.5) * 0.7).normalize();
      const col = sp.coat(zf, Math.sin(am), Math.cos(am));
      q0.copy(P0).addScaledVector(Sd, -w).addScaledVector(Nn, -0.04); const v0 = g.v(q0.x, q0.y, q0.z, col, [4, 0, 0, hh]);
      q0.copy(P0).addScaledVector(Sd, w).addScaledVector(Nn, -0.04); const v1 = g.v(q0.x, q0.y, q0.z, col, [4, 0, 1, hh]);
      q0.copy(P0).addScaledVector(Dr, len); const v2 = g.v(q0.x, q0.y, q0.z, col, [4, 1, 0.5, hh]);
      if (flip) g.tri(v1, v0, v2); else g.tri(v0, v1, v2);
    }
  }
  // ears: rounded cups, bare and pink inside (aA.w = 1 there, fading to 0 at the furred rim) and deepening to a dark canal, domed and
  // furred behind, turned outward so that they show from the side too; E.fur puts a fringe of short hair round the rim, which
  // breaks its outline. Nothing in an ear is flat: seen from behind it is a small round back with light along its rim
  const E = sp.ear;
  for (const sd of [-1, 1]) {
    const er = at(E.z), cx = sd * E.x, cy = er[1] + er[2] * E.up, cz = (E.z - 0.5) * L, n = E.seg || 10, cyw = Math.cos(E.yaw || 0), syw = Math.sin(E.yaw || 0), R = E.r;
    const ev = (ex, ey, ez, col, w, inn = 0) => g.v(cx + ex * cyw + sd * ez * syw, cy + ey, cz + ez * cyw - sd * ex * syw, col, [3, w, sd, inn]);
    const dim = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
    const rim = [], inA = [], inB = [], bkA = [], bkB = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU, ca = Math.cos(a), sa = Math.sin(a), wx = 0.85 * (1 + 0.15 * sd * ca), w = 0.5 + 0.5 * sa;
      rim.push(ev(ca * R * wx, R * 0.45 + sa * R, 0.12 * R * Math.abs(ca), sp.earOut, w, -1));
      inA.push(ev(ca * R * wx * 0.8, R * 0.45 + sa * R * 0.8, -0.14 * R, sp.earIn, w, 0.75));
      inB.push(ev(ca * R * wx * 0.45, R * 0.42 + sa * R * 0.45, -0.34 * R, dim(sp.earIn, 0.7), w, 1));
      bkA.push(ev(ca * R * wx * 0.86, R * 0.45 + sa * R * 0.86, -0.22 * R, sp.earOut, w));
      bkB.push(ev(ca * R * wx * 0.5, R * 0.43 + sa * R * 0.5, -0.44 * R, dim(sp.earOut, 0.85), w));
    }
    const ci = ev(0, R * 0.36, -0.42 * R, dim(sp.earIn, 0.4), 0.4, 1), cb = ev(0, R * 0.4, -0.54 * R, dim(sp.earOut, 0.8), 0.4);
    for (let k = 0; k < n; k++) {
      const k1 = (k + 1) % n;
      g.tri(ci, inB[k], inB[k1]); g.quad(inB[k], inA[k], inA[k1], inB[k1]); g.quad(inA[k], rim[k], rim[k1], inA[k1]);
      g.tri(cb, bkB[k1], bkB[k]); g.quad(bkB[k], bkB[k1], bkA[k1], bkA[k]); g.quad(bkA[k], bkA[k1], rim[k1], rim[k]);
    }
    if (E.fur) for (let k = 0, m = n * (E.furN || 2); k < m; k++) {
      const a = (k + 0.5 * hsh(k, sd + 2)) / m * TAU, ca = Math.cos(a), sa = Math.sin(a), wx = 0.85 * (1 + 0.15 * sd * ca), w = 0.5 + 0.5 * sa, hh = hsh(k + 0.3, sd + 5), fl = E.fur * R * (0.6 + 0.8 * hh), da = 0.5 * TAU / m;
      if (sa < -0.55) continue;
      const v0 = ev(Math.cos(a - da) * R * wx * 0.94, R * 0.45 + Math.sin(a - da) * R * 0.94, 0.06 * R, sp.earOut, w), v1 = ev(Math.cos(a + da) * R * wx * 0.94, R * 0.45 + Math.sin(a + da) * R * 0.94, 0.06 * R, sp.earOut, w);
      const v2 = ev(ca * (R * wx + fl), R * 0.45 + sa * (R + fl), -0.1 * R - 0.25 * fl, sp.earOut, w);
      g.tri(v0, v1, v2);
    }
  }
  // eyes
  for (const sd of [-1, 1]) { const er = at(sp.eye.z); g.ball(new V3(sd * er[3] * 0.78, er[1] + er[2] * 0.42, (sp.eye.z - 0.5) * L), sp.eye.r, sp.eye.r, sp.eye.r, 6, 4, () => [0.01, 0.01, 0.015], [6, 0, 0, 0]); }
  // tail
  const T = sp.tail, tp = [], r0 = at(0.02);
  for (let i = 0; i <= 9; i++) { const t = i / 9; tp.push(new V3(0, r0[1] - r0[2] * 0.4 - T.droop * Math.sin(t * 1.4) + T.lift * t * t, -0.5 * L + 0.3 - t * T.len)); }
  // a tail flung up in the bound (curl: how far it turns from straight back toward upright and over, radians at the tip)
  if (T.curl) { let y = tp[0].y, z = tp[0].z; for (let i = 1; i <= 9; i++) { const a = T.curl * (i - 0.5) / 9; y += Math.sin(a) * T.len / 9; z -= Math.cos(a) * T.len / 9; tp[i].set(0, y, z); } }
  g.tube(tp, (t) => T.r * (1 - 0.55 * t) * (T.point ? 1 - 0.92 * sstep(0.62, 1, t) : 1) * (T.brush ? 1 + T.brush * sstep(0.45, 0.8, t) * (1 - sstep(0.9, 1, t)) : 1), 7, (t) => (t > (T.tipFrom ?? 2) ? T.tip : T.col), (t) => [2, t, 0, 0]);
  // legs: hip to paw. A foot is a flat pad (pale sole underneath) with toes, so that it reads as a foot when it kicks back sole-up
  for (const lg of sp.legs) for (const sd of [-1, 1]) {
    const hz = (lg.z - 0.5) * L, hx = sd * lg.x, ph = lg.ph + (sd > 0 ? lg.alt : 0), fore = lg.z > 0.4 ? 2 : 0, fA = [1, 1, ph, fore + 1];
    const ank = new V3(hx * 1.05, lg.r * 0.9, hz + lg.knee * 0.3), toe = new V3(hx * 1.08, lg.r * 0.55, hz + lg.foot);
    const pts = [new V3(hx * 0.8, lg.hip, hz), new V3(hx, lg.hip * 0.55, hz + lg.knee), ank, toe];
    const thin = lg.toes ? 0.95 : 0.55, lp = sp.legSub ? new THREE.CatmullRomCurve3(pts).getPoints(10) : pts;
    g.tube(lp, (t) => lg.r * (1.25 - thin * t), sp.legSub ? 9 : 7, (t) => (t > (sp.legSub ? 0.78 : 0.6) ? sp.paw : sp.legCoat || sp.coat(lg.z, -1, 0)), (t) => [1, sstep(0, 0.75, t), ph, fore + (t > 0.5 ? 1 : 0)]);
    if (lg.sole) {
      const fl = lg.foot - lg.knee * 0.3, c = ank.clone().lerp(toe, 0.56).add(new V3(0, -lg.r * 0.3, 0));
      g.ball(c, lg.sole, lg.r * (lg.toes ? 0.36 : 0.5), fl * (lg.toes ? 0.5 : 0.62), 8, 5, (cy) => (cy < 0.25 ? sp.sole : sp.paw), fA);
      for (let q = 0; q < (lg.toes || 0); q++) {
        const f = lg.toes > 1 ? q / (lg.toes - 1) - 0.5 : 0, az = f * 0.95, tl = fl * 0.3 * (1 - 0.5 * f * f), b = new V3(c.x + f * lg.sole * 1.5, c.y - lg.r * 0.02, c.z + fl * 0.4);
        const e = b.clone().add(new V3(Math.sin(az) * tl, -lg.r * 0.1, Math.cos(az) * tl));
        g.tube([b, b.clone().lerp(e, 0.55).add(new V3(0, lg.r * 0.1, 0)), e], (t) => lg.sole * (0.3 - 0.13 * t), 5, (t) => (t > 0.7 ? sp.sole : sp.toe || sp.paw), () => fA, true);
      }
    }
  }
  // the clipped stem a sitting animal holds to its mouth
  if (sp.stem) {
    const nz = (sp.neckZ - 0.5) * L, sc = [0.62, 0.52, 0.30], sd = [0.5, 0.4, 0.2];
    g.tube([new V3(0.4, 0.7, nz + 2.1), new V3(0.3, 1.1, nz + 2.4), new V3(0.1, 1.5, nz + 2.7), new V3(-0.3, 2.6, nz + 3.5), new V3(-0.6, 3.5, nz + 4.3)], (t) => 0.17 - 0.07 * t, 5, () => sc, () => [5, 0, 0, 0]);
    g.ball(new V3(-0.65, 3.75, nz + 4.5), 0.3, 0.5, 0.3, 6, 4, () => sd, [5, 0, 0, 0]);
  }
  const geo = g.build();
  // the soft outline (sp.fringe): rows of short cards that stand out of the coat, raked back, along every ring of the body and along
  // its length. CRIT_FS draws fine hairs on them and shows a card only where the coat turns away from the eye, so the animal's outline
  // is a fringe of fur and its face-on coat stays smooth. aA = (4, 0 root .. 1 tip, metres along the row, hash [+ 2 on a lengthwise row])
  if (sp.fringe) {
    const F = sp.fringe, P = [], Nm = [], C = [], A = [], I = []; let nv = 0;
    const NJ = F.rings || 40, NK = F.sides || SIDES, P0 = new V3(), Fl = new V3(), Nn = new V3(), Sd = new V3();
    const zfOf = (j) => { const x = j / NJ; return clamp(sstep(0, 1, x) * 0.3 + x * 0.7, 0.012, 0.992); };
    const frame = (zf, ka) => {
      const r = at(zf), rb = at(Math.max(zf - 0.025, 0.004)), a = pt(r, ka), b = pt(rb, ka), c = pt(r, ka + 0.4);
      P0.set(a[0], a[1], a[2]); Fl.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); Sd.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
      Nn.crossVectors(Sd, Fl).normalize(); if (Nn.x * a[0] + Nn.y * (a[1] - r[1]) < 0) Nn.negate();
      return r;
    };
    const lenAt = (zf, r) => F.len * (0.55 + 0.45 * Math.min(r[3] / (0.6 * maxRx), 1)) * (zf > sp.neckZ ? 0.6 : 1) * (1 - 0.6 * sstep(0.9, 0.99, zf));
    const card = (zf, ka, u, hh, back) => {                                       // a root and a tip; returns the root's index
      const r = frame(zf, ka), am = ka / SIDES * TAU, col = sp.coat(zf, Math.sin(am), Math.cos(am)), len = lenAt(zf, r) * (0.8 + 0.4 * hsh(ka * 3.1 + 0.7, zf * 91.3));
      const cb = Math.cos(back), sb = Math.sin(back);
      P.push(P0.x - Nn.x * 0.03, P0.y - Nn.y * 0.03, P0.z - Nn.z * 0.03, P0.x + (Nn.x * cb + Fl.x * sb) * len, P0.y + (Nn.y * cb + Fl.y * sb) * len, P0.z + (Nn.z * cb + Fl.z * sb) * len);
      Nm.push(Nn.x, Nn.y, Nn.z, Nn.x, Nn.y, Nn.z); C.push(col[0], col[1], col[2], col[0], col[1], col[2]); A.push(4, 0, u, hh, 4, 1, u, hh);
      nv += 2; return nv - 2;
    };
    const low = (ka) => Math.sin(ka / SIDES * TAU) < -0.72;                        // nothing under the belly
    for (let j = 1; j < NJ; j++) {                                                // round every ring
      const zf = zfOf(j), hh = hsh(j + 0.37, 5.1), r = at(zf); let u = 0, prev = -1, px = 0, py = 0;
      for (let k = 0; k <= NK; k++) {
        const ka = k / NK * SIDES, q = pt(r, ka);
        if (k > 0) u += Math.hypot(q[0] - px, q[1] - py);
        px = q[0]; py = q[1];
        if (low(ka)) { prev = -1; continue; }
        const v0 = card(zf, ka, u, hh, 0.9);
        if (prev >= 0) I.push(prev, v0, v0 + 1, prev, v0 + 1, prev + 1);
        prev = v0;
      }
    }
    for (let k = 0; k < NK; k++) {                                                // and along its length
      const ka = (k + 0.5) / NK * SIDES, hh = 2 + hsh(k + 0.91, 3.3); if (low(ka)) continue;
      let prev = -1;
      for (let j = 0; j <= NJ; j++) { const zf = zfOf(j), v0 = card(zf, ka, (zf - 0.5) * L, hh, 0.3); if (prev >= 0) I.push(prev, v0, v0 + 1, prev, v0 + 1, prev + 1); prev = v0; }
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('normal', new THREE.Float32BufferAttribute(Nm, 3));
    fg.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); fg.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4)); fg.setIndex(I);
    geo.userData.fringe = fg;
  }
  return geo;
}

// meltwater: a dark mirror that holds the roof, with a slow current, drip rings and a rim of shelf ice. aD = depth of water (m)
const WATER_VS = /* glsl */`
attribute float aD;
varying vec3 vW; varying float vDp;
void main(){ vW = position; vDp = aD; vec4 wp = vec4(position, 1.); ${VEND} }`;
const WATER_FS = /* glsl */`
uniform vec4 uDrip[4]; uniform float uRoofH;
varying vec3 vW; varying float vDp;
void main(){
  vec2 p = vW.xz; float t = uTime;
  // (the water ends a little short of the bank, at a ragged line: the soaked margin of the floor lies between them)
  float sh = vDp + 0.22*(vn2(p*1.3 + 3.) - 0.5) + 0.1*(vn2(p*4.1) - 0.5);
  if (sh < 0.05) discard;
  float far = 1. - smoothstep(25., 70., length(cameraPosition - vW));
  vec2 n2 = 0.5*(vec2(vn2(p*0.45 + vec2(0., t*0.3)), vn2(p*0.45 + vec2(7.3, t*0.26))) - 0.5);
  n2 += 0.22*far*(vec2(vn2(p*1.9 - vec2(t*0.7, 0.)), vn2(p*1.9 + vec2(3.1, t*0.6))) - 0.5);
  for (int i = 0; i < 4; i++) {
    vec2 d = p - uDrip[i].xy; float r = length(d), ph = fract(t*uDrip[i].z + uDrip[i].w), rr = r - ph*7.5;
    n2 += d/max(r, 0.05)*sin(rr*4.2)*exp(-rr*rr/1.6)*(1. - ph)*0.42;
  }
  vec3 N = normalize(vec3(n2.x, 1., n2.y));
  vec3 V = normalize(cameraPosition - vW);
  float fres = 0.05 + 0.95*pow(clamp(1. - dot(N, V), 0., 1.), 3.5);
  vec3 R = reflect(-V, N);
  vec2 rp = p + R.xz/max(R.y, 0.12)*uRoofH;
  vec3 Lr = rfLight(rp); float cup = 0.62 + 0.75*vn2(rp*0.33 + 2.)*vn2(rp*0.9);
  float hr = max(holesAt(rp), lensAt(rp));
  vec3 Lh = rfLight(p);
  float peb = vn2(p*1.1 + 5.)*vn2(p*2.9);
  vec3 deep = uShadowCol*0.35 + Lh*(vec3(0.016, 0.03, 0.035) + vec3(0.11, 0.09, 0.05)*peb*(1. - smoothstep(0.1, 0.9, sh)));
  vec3 col = mix(deep, mix(Lr*cup, uDayCol*2.7, hr), fres) + dayAt(vW)*(0.03 + 0.5*fres);
  float gl = smoothstep(0.6, 0.92, vn2(p*3.3 + n2*9. + vec2(t*0.5, 0.)));
  col += Lr*gl*0.3*far*max(R.y, 0.);
  // shelf ice round the edge: white where it is thick, glassy where it thins over the water
  float ice = 1. - smoothstep(0.1, 0.34, sh);
  vec3 iceC = vec3(0.52, 0.64, 0.74)*(0.6 + 0.5*vn2(p*2.3))*(Lh*1.5 + uShadowCol*2. + dayAt(vW));
  col = mix(col, iceC, ice*0.9);
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}`;
// a shaft of daylight in the hoar-dusted air (additive): bright through its middle, soft at the edge, streaked, with ice dust turning in it
const SHAFT_VS = /* glsl */`
attribute float aOpen;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vOpen;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal); vUv = uv; vOpen = aOpen; ${VEND} }`;
const SHAFT_FS = /* glsl */`
uniform float uOpen, uSoft; uniform vec3 uTint;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vOpen;
void main(){
  vec3 V = normalize(cameraPosition - vW); float f = abs(dot(normalize(vN), V));
  // (the streaks and the dust are laid round the shaft by its angle, whole round it: there is no seam down its side)
  float ang = vUv.x*6.28318; vec2 cs = vec2(cos(ang), sin(ang)), cs2 = vec2(cos(ang + uTime*0.021), sin(ang + uTime*0.021));
  float streak = 0.55 + 0.45*vn3(vec3(cs*4.14, vUv.y*1.5 + uTime*0.05));
  float dust = pow(vn3(vec3(cs2*9.55, vUv.y*40. - uTime*0.6)), 5.)*2.5*(1. + uSoft);
  // (uSoft 1: a shaft seen from far off against a tall wall goes out toward its edge with no line there: its edge is ragged, further
  // in here and further out there up its height, drifting slowly, and thins into the air)
  float fe = clamp(f + 0.4*uSoft*(vn3(vec3(cs*2.1, vUv.y*6. - uTime*0.04)) - 0.5), 0., 1.);
  float a = mix(f*f, fe*fe*fe*fe*1.6, uSoft)*(0.25 + 0.75*vUv.y)*smoothstep(0., 0.12, vUv.y)*(1. - smoothstep(0.9, 1., vUv.y))*(streak + dust)*uOpen;
  a *= vOpen*vOpen*(3. - 2.*vOpen);                                     // (it goes out before the snow it enters: aOpen)
  a *= smoothstep(2., 7., length(cameraPosition - vW));
  gl_FragColor = vec4(uDayCol*uTint*0.16*a, 1.);
  ${FOG_ADD}
}`;

// looks: hour and weather. No warm light in any of them (the twilight column is a cold peach) but one: the sun that comes down the
// gap in the boulder's lee by day (LEE, in build).
const LOOKS = {
  noon: { thick: 0, hour: 'noon', weather: 'clear', turq: '#3FC9C4', cobalt: '#2456B8', glow: 2.5, green: 0, grey: 0, band: 1, wet: 0, fog: '#1b4c98', fogD: 0.0072, exposure: 0.86, spark: '#000000', title: 'Under the Snow Roof' },
  twilight: { thick: 0.12, hour: 'twilight', weather: 'clear', turq: '#52B8D8', cobalt: '#5B30C8', glow: 3.4, green: 0, grey: 0, band: 0.7, wet: 0, fog: '#2e2a8c', fogD: 0.0072, exposure: 1.1, spark: '#000000', title: 'Under the Snow Roof, Polar Twilight' },
  night: { thick: 0.04, hour: 'night', weather: 'clear', turq: '#3FC9A8', cobalt: '#20409C', glow: 1.62, green: 0.35, grey: 0, band: 0.6, wet: 0, fog: '#0c2562', fogD: 0.0066, exposure: 1.2, spark: '#3FD98A', title: 'Under the Snow Roof, Aurora Night' },
  // the thaw: thin patches of brilliant green-white between deep teal ribs (more of the drift's own relief, greener only where it is thin)
  thaw: { thick: 0.05, hour: 'noon', weather: 'thaw', turq: '#7CEBB4', cobalt: '#0F6C80', glow: 2.05, green: 0.04, greenThin: 0.62, amp: 0.9, patchK: 1.1, grey: 0, band: 1.2, wet: 1, fog: '#0b4a5c', fogD: 0.0074, exposure: 0.72, spark: '#000000', shadow: '#0A2C40', title: 'Under the Snow Roof, Thaw' },
  blizzard: { thick: 0.03, hour: 'noon', weather: 'blizzard', turq: '#74C0C8', cobalt: '#3A5E9E', glow: 2.3, green: 0, grey: 0.4, band: 5, wet: 0, fog: '#2b5390', fogD: 0.0076, exposure: 0.92, spark: '#000000', title: 'Under the Snow Roof, Ground Blizzard' },
};

export default {
  id: 'under-the-snow-roof',
  name: 'Under the Snow Roof',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['tiny', 'interior', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const lr = rng.fork('snow-roof-look'), r0 = lr();
    let lookId = r0 < 0.30 ? 'noon' : r0 < 0.48 ? 'twilight' : r0 < 0.62 ? 'thaw' : r0 < 0.76 ? 'blizzard' : r0 < 0.9 ? 'night' : 'noon';
    const dayPick = lr() < 0.5 ? 'noon' : 'thaw';
    if (vary.hour === 'night') lookId = 'night'; else if (vary.hour === 'dawn' || vary.hour === 'golden') lookId = 'twilight';
    else if (vary.hour === 'day' && (lookId === 'night' || lookId === 'twilight')) lookId = dayPick;
    const LK = LOOKS[lookId];
    // the light that comes down the gap in the boulder's lee, by the hour and the weather the deal gives (c its colour, k the strength
    // of its pool on the floor, shaft the strength of its shaft in the air): warm sun at noon; the same through wet air in a thaw,
    // softer; a veiled grey-white sun in a ground blizzard, weak; the cold peach of the sky at twilight, low; moonlight by night,
    // cold and thin
    const LEE = { noon: { c: [1.0, 0.7, 0.36], k: 1.5, shaft: 2.4 }, thaw: { c: [1.0, 0.78, 0.46], k: 1.1, shaft: 1.9 }, blizzard: { c: [0.8, 0.85, 0.92], k: 0.45, shaft: 1.4 },
      twilight: { c: [1.0, 0.8, 0.72], k: 0.45, shaft: 1.1 }, night: { c: [0.5, 0.72, 1.2], k: 0.3, shaft: 1.5 } }[lookId];
    const season = lookId === 'thaw' ? 'april' : lr.pick(['mid', 'mid', 'early', 'april']);
    const lemmings = lr.chance(0.3), weasel = lr.chance(0.35), hare = lr.chance(0.3), rare = !!vary.rare;
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    // every scatter draws from a stream of its own, made from the world's seed and the scatter's name: lengthening one deals nothing else anew
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('snow-roof-' + name + ':' + ctx.seed));
    let sr = stream('homes');                                   // the stream of the scatter at work (deal() hands it on)
    const deal = (name) => { sr = stream(name); return sr; };

    const scene = new THREE.Scene();
    const fogIn = col(LK.fog);
    scene.fog = new THREE.FogExp2(fogIn.clone(), LK.fogD);
    scene.background = fogIn.clone().multiplyScalar(0.6);

    // ---- the hero: the strike. World space = its local space.
    const PAL = ['#0E1E4A', LK.cobalt, LK.turq, '#D6F6F2', '#B4975A', '#C21F2E', '#F7FBFF'];
    const hero = await buildHero(ctx, { palette: PAL, hour: LK.hour, weather: LK.weather, roofGlow: LK.glow });
    scene.add(hero.object);
    const A = hero.anchors, heroU = hero.object.children[0].material.uniforms;
    await ctx.yield();

    const U = {
      uTime: { value: 0 }, uPatch: { value: Array.from({ length: 32 }, () => new THREE.Vector4(0, 0, 1, 0)) },
      uHoof: { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uShadow: heroU.uShadow, uShadowN: heroU.uShadowN, uShadowW: heroU.uShadowW, uWell: { value: new THREE.Vector4(0, 0, 0, 0) },
      uTurq: { value: col(LK.turq) }, uCobalt: { value: col(LK.cobalt) }, uDayCol: heroU.uDayCol, uShadowCol: { value: col(LK.shadow || '#0E1E4A') },
      uThickAmp: { value: LK.amp ?? 0.48 }, uPatchK: { value: LK.patchK ?? 1 }, uGreenThin: { value: LK.greenThin || 0 }, uSwell: { value: LK.swell ?? 0.42 }, uAurBand: { value: lookId === 'night' ? 0.85 : 0 }, uDim: heroU.uDim, uCrGrow: heroU.uCrGrow, uCrA: heroU.uCrA, uHole: heroU.uHole,
      uGlow: { value: LK.glow }, uGreen: { value: LK.green }, uBand: { value: LK.band }, uSeedF: { value: stream('drift').range(0, 40) }, uDay: heroU.uDay,
      uPool0: { value: new THREE.Vector4(0, 1e4, 1, 0) }, uPool1: { value: new THREE.Vector4(0, 1e4, 1, 0) }, uPool2: { value: new THREE.Vector4(0, 1e4, 1, 0) }, uHoleR: { value: new V3(4.6, 6.6, 3.4) },
      uPool3: { value: new THREE.Vector4(0, 1e4, 1, 0) }, uPool4: { value: new THREE.Vector4(0, 1e4, 1, 0) }, uHoleR2: { value: new THREE.Vector2(3.0, 1.8) }, uAur: { value: new THREE.Vector4(0, 1e4, 1, 0) },
      uLobe: { value: hare ? 0.3 : 1.15 }, uGrey: { value: LK.grey }, uThickOff: { value: LK.thick }, uVole: { value: new THREE.Vector4(0, 0, 1e4, 0) },
      uDome: { value: 0 },
      uLee: { value: new THREE.Vector4(0, 1e4, 1, 0) }, uLeeCol: { value: new V3(...LEE.c) },
    };

    // ---- the path: runway, hall (curving right), three forks (left, right, left), strike gallery, pull-up, shaft
    const hR = -lr.range(0.30, 0.42), hH = lr.range(0.40, 0.52), h1 = -lr.range(0.24, 0.34), h2 = lr.range(0.26, 0.36);
    const HK = [[0, hR], [140, hR], [270, hH], [352, hH], [412, h1], [452, h1], [512, h2], [530, h2], [585, 0], [672, 0]];
    const SF = 672, dX = new Float32Array(SF + 1), dZ = new Float32Array(SF + 1);
    dZ[SF] = 6.24;
    for (let s = SF; s > 0; s--) { const h = pw(HK, s - 0.5, true); dX[s - 1] = dX[s] - Math.sin(h); dZ[s - 1] = dZ[s] + Math.cos(h); }
    const EYE = [[0, 3], [150, 3], [185, 3.5], [255, 3.5], [290, 3.3], [540, 3.2], [576, A.flyThrough[0].y]];
    const pts = [];
    for (let s = 0; s <= 576; s += 12) pts.push([dX[s], pw(EYE, s, true), dZ[s]]);
    for (const p of A.flyThrough) pts.push([p.x, p.y, p.z]);
    const path = makePath(pts);
    const L = path.length, Sflat = L - 73.6;
    hero.setClimb((L - 60) / L);
    // the hero laid its sedge before this route was made: it now measures every blade against the route and turns, or lowers, the
    // blades that come too near it (clearSedge in the parts file)
    await hero.clearSedge(path);
    // hoof-falls: [u, t]; each lands about 22 m ahead of the camera, over the path
    const HOOF_UT = [[0.392, -1], [0.486, 0.8], [0.582, -0.8], [0.651, 0]], hoofS = HOOF_UT.map(([hu]) => hu * L + 19.5);
    const nearHoof = (s) => hoofS.some((h) => Math.abs(s - h) < 11);

    // ---- path frames every metre (x, z, tangent) so that anything can be placed in (s, t) coordinates
    // (the engine clips everything behind the entry plane when this world is seen through a portal, so the picture in the
    // opening is the cut at s = 0: the gallery flares into a vestibule there, wide and tall enough to fill the whole disc)
    const S0 = -24, sLast = Math.floor(Sflat) - 2, S1 = sLast + 58, NF = S1 - S0 + 1;
    const FX = new Float32Array(NF), FZ = new Float32Array(NF), TX = new Float32Array(NF), TZ = new Float32Array(NF);
    { const pv = new V3(), tv = new V3();
      for (let i = 0; i < NF; i++) {
        const s = S0 + i;
        if (s <= sLast) { path.posAtDist(s, pv); path.tangentAtDist(Math.max(s, 0), tv); const l = Math.hypot(tv.x, tv.z) || 1; FX[i] = pv.x; FZ[i] = pv.z; TX[i] = tv.x / l; TZ[i] = tv.z / l; }
        else { const j = sLast - S0; FX[i] = FX[j]; FZ[i] = FZ[j] - (s - sLast); TX[i] = 0; TZ[i] = -1; }
      } }
    const F_ = { x: 0, z: 0, tx: 0, tz: -1 };
    const fr = (s) => { const f = clamp(s - S0, 0, NF - 1.001), i = Math.floor(f), k = f - i; F_.x = lerp(FX[i], FX[i + 1], k); F_.z = lerp(FZ[i], FZ[i + 1], k); F_.tx = lerp(TX[i], TX[i + 1], k); F_.tz = lerp(TZ[i], TZ[i + 1], k); return F_; };
    const W_ = { x: 0, z: 0 };
    const toW = (s, t) => { fr(s); W_.x = F_.x - F_.tz * t; W_.z = F_.z + F_.tx * t; return W_; };   // right normal = (-tz, tx)

    // ---- the gallery map: hall, branches, and the height field G (roof above floor) on an (s, t) grid
    const sHall = 205, tHall = 9, Rh = 29, hPh = lr.range(0, TAU);
    toW(sHall, tHall); const hcx = W_.x, hcz = W_.z;
    const sDive = Math.round(0.755 * L + 15);
    const mkBranch = (s0, side, ang, len, w, H, curl = 0) => {
      fr(s0); let a = Math.atan2(F_.tx, -F_.tz) + side * ang, x = F_.x, z = F_.z; const P = [[x, z]];
      for (let d = 0; d < len; d += 3) { a += side * curl * 3; x += Math.sin(a) * 3; z -= Math.cos(a) * 3; P.push([x, z]); }
      return { s0, side, len, w, H, P, sMin: s0 - 16 - (ang > 1.6 ? len : 0), sMax: s0 + len + 16 };
    };
    const BR = [
      mkBranch(233, -1, 1.25, 42, 6.2, 9.6, -0.004),      // 0 the far end of the hall, left: the gallery the ermine comes out of
      mkBranch(224, 1, 1.3, 42, 5.6, 9.0),                // 1 hall, right: the burrow the ermine leaves by
      mkBranch(146, -1, 1.3, 26, 3.0, 4.2),               // 2 the vole's short cut, out of the runway beyond the root cellar ...
      mkBranch(158, 1, 1.9, 20, 3.0, 4.2),                // 3 ... and back in before the hall
      mkBranch(296, -1, 1.1, 22, 4.0, 4.6),               // 4 where the meltwater comes in
      mkBranch(494, -1, 1.35, 30, 3.8, 5.6),              // 5 the ermine's way into the lichen garden
      mkBranch(360, 1, 1.25, 20, 4.0, 4.6),               // 6 where the water leaves
      mkBranch(486, 1, 1.2, 30, 3.8, 5.6),                // 7 the ermine's way out
      mkBranch(314, 1, 1.3, 18, 3.0, 4.2),                // 8 the vole's burrow off the bank
      mkBranch(sDive, 1, 0.85, 24, 3.6, 5.6),             // 9 the vole's side hole
      mkBranch(205, 1, 1.5, 48, 5.6, 9.0),                // 10 hall, right: where the feeding voles bolt to
      mkBranch(398, -1, 1.5, 20, 3.0, 4.2),               // 11 the vole's way back, into the boulder's room
    ];
    // the chambers strung along the runway, each a dome of its own over a different place: centre (s, t), radius, height,
    // mounds on its floor, what grows in it, and the thin patch in its roof (thin: [ds, dt, radius, how thin]): the glow behind its doorway
    const ROOMS = [
      { id: 'thicket', s: 77, t: 3, R: 17, H: 10.5, mound: 0, sprigs: 46, moss: 120, thin: [3, 0, 20, 0.16] },
      { id: 'cellar', s: 100, t: 5, R: 16, H: 12.5, mound: 0, sprigs: 10, moss: 80, thin: [0, 0, 15, 0.22] },
      { id: 'ice', s: 138, t: -2, R: 18, H: 15.5, mound: 0, fans: 250, crystals: 320, thin: [0, 0, 25, 0.44] },
      // the far end of the hall, where the ermine crosses the floor from its gallery on the left
      { id: 'cross', s: 236, t: -4, R: 17, H: 13.5, mound: 0 },
      { id: 'foxAnte', s: 246, t: 2, R: 13, H: 10, mound: 0, fans: 46, crystals: 50, sprigs: 10, moss: 100, thin: [0, 0, 19, 0.24] },
      { id: 'fox', s: 272, t: -2, R: 21, H: 15.5, mound: 0, sprigs: 8, moss: 70, thin: [0, 0, 26, 0.16] },
      { id: 'melt', s: 313, t: 1, R: 14, H: 9.5, mound: 0, moss: 150, thin: [13, -1, 30, 0.3] }, { id: 'melt2', s: 338, t: -1, R: 14, H: 10.5, mound: 0, moss: 150 },
      { id: 'grotto', s: 368, t: -2, R: 14, H: 10, mound: 2.0, moss: 520, sprigs: 14, lichen: 9, thin: [0, 0, 18, 0.26] },
      { id: 'rockAnte', s: 398, t: 0, R: 13, H: 10, mound: 0, stones: 14, moss: 120, sprigs: 6, thin: [10, 0, 30, 0.28] },
      { id: 'rock', s: 424, t: 5, R: 20, H: 17, mound: 0, moss: 100 },
      { id: 'lichenAnte', s: 456, t: 0, R: 13, H: 10, mound: 1.6, lichen: 14, moss: 80, thin: [0, 0, 16, 0.2] },
      { id: 'lichen', s: 481, t: 1, R: 17, H: 11.5, mound: 2.4, lichen: 30, moss: 80, thin: [0, 0, 25, 0.34] },
      { id: 'iceAnte', s: 508, t: -1, R: 12, H: 11, mound: 0, fans: 90, crystals: 120, thin: [0, 0, 16, 0.3] },
      { id: 'ptar', s: 534, t: 15, R: 25, H: 28, mound: 0, crystals: 40, thin: [7, 3, 27, 0.14] },
      { id: 'last', s: 572, t: 0, R: 12, H: 9.5, mound: 1.4, sprigs: 18, moss: 220, lichen: 6, thin: [0, 0, 15, 0.26] },
    ];
    // (every room takes its phase from a stream of its own id, all sixteen alike)
    for (const rm of ROOMS) { toW(rm.s, rm.t); rm.x = W_.x; rm.z = W_.z; rm.ph = stream('room-' + rm.id).range(0, TAU); }
    const RM = Object.fromEntries(ROOMS.map((r) => [r.id, r]));
    await ctx.yield();
    // the thatch stands thickest in the runway we start in, in the hall and in the last straight; the chambers between keep six blades in ten
    const sedgeK = (s) => Math.max(0.62, 1 - 0.38 * sstep(50, 62, s), 0.85 * sstep(170, 178, s) * (1 - sstep(246, 254, s)), sstep(578, 590, s));
    // THE THATCH'S STATE BY PLACE, in metres along the way, eased over 8 m between neighbours and over 4 m at the hall's ends (o: rimed,
    // wet, mossed at the foot, bleached and broken short). By the ice gallery the blades are rimed; by the fox's room and the
    // meltwater wet (deeper in colour, toward amber, as light as the dry blade, with a sheen), with beads of water hanging from
    // their edges where the frost feathers would stand; by the grotto and the boulder green with moss at the foot; by the lichen
    // garden and the ptarmigan bleached to a pale warm straw, lighter than the plain blade, and broken short. It is nought before
    // 114 m, in the hall and after 560 m: the runway, the thicket, the cellar, the hall and the last straight keep their sedge.
    const stateAt = (s, o) => {
      o[0] = sstep(114, 122, s) * (1 - sstep(166, 170, s)); o[1] = sstep(254, 258, s) * (1 - sstep(350, 358, s));
      o[2] = sstep(350, 358, s) * (1 - sstep(442, 450, s)); o[3] = sstep(442, 450, s) * (1 - sstep(552, 560, s));
    };
    // 1 inside a span of the way (a to b metres), eased to nought over e metres at both ends
    const span = (a, b, s, e = 8) => sstep(a, a + e, s) * (1 - sstep(b - e, b, s));
    // the ermine's two runs over open floor, as lines in (s, t): the floor is trodden level along them and only low plants grow there;
    // the feeding places of the hall voles (the floor is level there too); and the line our vole runs, from the arch to its side hole
    const ERM_ST = [[[240.3, -22], [236.3, -10], [235.4, 0], [232.6, 9], [229.4, 20]], [[497.3, -14.6], [493, -8], [489, -1], [488.2, 5.5], [489.3, 8.4], [491.4, 14]]];
    const HOME0 = [[210.1, 10.65], [207.6, 14.3], [199.5, 20], [213, 21.5], [222.5, 21], [218, 24.5], [228, 9.5], [206, 22.5], [224, 14.5]];
    const lineDist = (P, s, t) => {
      let best = 1e9;
      for (let i = 0; i + 1 < P.length; i++) {
        const ax = P[i][0], az = P[i][1], ex = P[i + 1][0] - ax, ez = P[i + 1][1] - az;
        const k = clamp(((s - ax) * ex + (t - az) * ez) / (ex * ex + ez * ez), 0, 1), qx = ax + ex * k - s, qz = az + ez * k - t;
        best = Math.min(best, qx * qx + qz * qz);
      }
      return Math.sqrt(best);
    };
    const ermDist = (s, t) => Math.min(lineDist(ERM_ST[0], s, t), lineDist(ERM_ST[1], s, t));
    const trodden = (s, t) => { let d = ermDist(s, t); for (const h of HOME0) d = Math.min(d, Math.hypot(s - h[0], t - h[1]) + 2); return 1 - sstep(5, 9.5, d); };
    // the ermine's stage: a strip of one width along each of its two routes over the floor, where only low plants grow
    const stage = (s, t) => ermDist(s, t) < 9;
    // what stands on the floor where our vole cannot run, as discs in (s, t) with room for its body: the birch, its root and the cache
    // between them, the fox's heap, the boulder, the ptarmigan, two stems of the hall, the feeding places of the hall voles
    const birchAt = { s: 100, t: 13 }, cacheAt = { s: 104, t: 7.6 }, foxAt = { s: 276, t: -3 }, rockAt = { s: 434, t: 20.5 }, gapAt = { s: 425.5, t: 7.5 }, sunSpot = { s: 423.5, t: 5 }, birdAt = { s: 545, t: 21 };
    const STEMS = [[196, 11], [176, 21], [226, 28], [183, -12], [238, 12]];
    // the birch's roots: [direction in the (s, t) plane, reach, height where it leaves the trunk, hump, radius]
    const ROOTS = [[3.45, 15, 3.8, 1.6, 1.1], [4.45, 7, 3.2, 1.2, 1.0], [2.7, 12, 3.4, 1.4, 0.95], [1.9, 9, 2.6, 1.0, 0.8], [5.8, 9, 2.8, 1.1, 0.8], [0.6, 8, 2.4, 0.9, 0.7], [3.95, 4.6, 2.2, 0.5, 0.6]];
    const STAND = [[birchAt.s, birchAt.t, 8.5], [cacheAt.s, cacheAt.t, 4.4], [91, 10.2, 3.6], [foxAt.s, foxAt.t, 8.6], [rockAt.s, rockAt.t, 16.6], [birdAt.s, birdAt.t, 11], ...STEMS.map(([hs, ht]) => [hs, ht, 2.6]), ...HOME0.map(([hs, ht]) => [hs, ht, 4])];
    const VT = new Float32Array(600), voleT = (s) => { const f = clamp(s, 0, 598.99), i = Math.floor(f); return lerp(VT[i], VT[i + 1], f - i); };
    // the meltwater's bed: a line in (s, t) from the burrow on the left to the one on the right, pooling twice on the way
    const STREAM = [[303.5, -15.5], [300.5, -9], [300, -4], [305, -0.8], [315, 0.9], [324, 2.4], [332, 0.4], [340, -2.2], [348, -0.3], [354, 3.2], [359.5, 7], [363, 11.5], [365, 16]];
    const stD = { d: 0, s: 0 };
    const streamDist = (s, t) => {
      let best = 1e9, bs = 0;
      for (let i = 0; i + 1 < STREAM.length; i++) {
        const ax = STREAM[i][0], az = STREAM[i][1], ex = STREAM[i + 1][0] - ax, ez = STREAM[i + 1][1] - az;
        const k = clamp(((s - ax) * ex + (t - az) * ez) / (ex * ex + ez * ez), 0, 1), qx = ax + ex * k - s, qz = az + ez * k - t, d = qx * qx + qz * qz;
        if (d < best) { best = d; bs = ax + ex * k; }
      }
      stD.d = Math.sqrt(best); stD.s = bs; return stD;
    };
    const streamW = (s) => 2.3 + 0.9 * sstep(304, 314, s) * (1 - sstep(352, 360, s)) + 1.8 * Math.exp(-(((s - 316) / 6) ** 2)) + 3.3 * Math.exp(-(((s - 338) / 7) ** 2));
    const WATER_Y = -0.62;
    const brD = { d: 0, k: 0 };
    const brDist = (b, x, z) => {
      let best = 1e9, bk = 0; const P = b.P, n = P.length - 1;
      for (let i = 0; i < n; i++) {
        const ax = P[i][0], az = P[i][1], ex = P[i + 1][0] - ax, ez = P[i + 1][1] - az;
        const t = clamp(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez), 0, 1), qx = ax + ex * t - x, qz = az + ez * t - z, d = qx * qx + qz * qz;
        if (d < best) { best = d; bk = (i + t) / n; }
      }
      brD.d = Math.sqrt(best); brD.k = bk; return brD;
    };
    const NQ = 40, NJ = 2 * NQ + 1, DSG = 1.25, NCH = 12;
    const tOf = (q) => q * 0.55 + Math.sign(q) * 0.0135 * q * q;
    const qOf = (t) => Math.sign(t) * (-0.55 + Math.sqrt(0.3025 + 0.054 * Math.abs(t))) / 0.027;
    const iPer = Math.ceil((S1 - S0) / DSG / NCH / 2) * 2, NI = iPer * NCH + 1, chunkLen = iPer * DSG, SG1 = S0 + (NI - 1) * DSG;
    const chunkOf = (s) => clamp(Math.floor((s - S0) / chunkLen), 0, NCH - 1);
    // objs: the shell (roof, floor), shown to 215 m ahead; det: everything standing in it, shown to 150 m (some two thirds fogged by then)
    const chunks = Array.from({ length: NCH }, (_, c) => ({ s0: S0 + c * chunkLen, s1: S0 + (c + 1) * chunkLen, objs: [], det: [] }));
    const GX = new Float32Array(NI * NJ), GZ = new Float32Array(NI * NJ), FY = new Float32Array(NI * NJ), GG = new Float32Array(NI * NJ), MND = new Float32Array(NI * NJ);
    const sag = season === 'april' ? 0.94 : 1;
    // the hollow in the boulder's lee: its middle, reach and height; the grid points it lifts, each one's height without the lift and
    // with it, and the lift itself over the whole grid (nought nearly everywhere); leeSet puts the roof down (false) or up again (true)
    const LEE_R = 12.5, LEE_H = 26, leeX = toW(427, 9.5).x, leeZ = W_.z, leeIdx = [], leePre = [], leePost = [], LIFT = new Float32Array(NI * NJ);
    const leeSet = (up) => { for (let i = 0; i < leeIdx.length; i++) GG[leeIdx[i]] = up ? leePost[i] : leePre[i]; };
    const WK = [[S0, 10], [-1, 10], [17, 4.7], [560, 4.6], [598, 10.2], [sLast + 30, 10.2], [sLast + 55, 0.3]], HMK = [[S0, 12], [-1, 12], [17, 7.0], [560, 6.9], [598, ROOF_Y + 1.3]], EK = [[S0, 2.6], [560, 2.6], [598, 4.2]];
    for (let i = 0; i < NI; i++) {
      const s = Math.min(S0 + i * DSG, S1 - 0.01);
      const wS = pw(WK, s) * (1 + 0.12 * noise.n2(s * 0.035, 3.1)), hS = pw(HMK, s) * (1 + 0.07 * noise.n2(s * 0.05, 9.2)) * sag, eS = pw(EK, s);
      const off = 0.5 * noise.n2(s * 0.03, 5.5) * (1 - sstep(540, 570, s));
      fr(s); const fx = F_.x, fz = F_.z, nx = -F_.tz, nz = F_.tx;
      for (let j = 0; j < NJ; j++) {
        const t = tOf(j - NQ), x = fx + nx * t, z = fz + nz * t, o = i * NJ + j;
        GX[o] = x; GZ[o] = z;
        const ddx = x - hcx, ddz = z - hcz, rr = Math.hypot(ddx, ddz), inHall = rr < Rh * 1.3;
        const dStrike = Math.hypot(x, z - HOLE_Z), kS = sstep(46, 30, dStrike);
        let fy = -0.08 + 0.2 * noise.fbm2(x * 0.1, z * 0.1, 2) * sstep(2, 6, Math.abs(t));
        if (inHall) fy += 3.0 * Math.max(0, noise.fbm2(x * 0.045 + 31, z * 0.045, 2) + 0.12) * sstep(7, 15, Math.abs(t)) * sstep(Rh * 1.3, Rh * 0.9, rr) * (1 - 0.88 * trodden(s, t));   // level where the ermine crosses and where the voles feed, so their feet show
        fy = lerp(fy, -0.08, kS);
        const wM = lerp(wS, 10.6, kS), HM = lerp(hS, ROOF_Y + 2.6, kS), eM = lerp(eS, 7, kS);
        let g = wM > 0.35 ? HM * (1 - Math.pow(Math.abs(t - off) / wM, eM)) : -1;
        if (inHall) {
          const Rl = Rh * (1 + 0.1 * Math.sin(3 * Math.atan2(ddz, ddx) + hPh) + 0.07 * noise.n2(x * 0.06, z * 0.06));
          if (rr < Rl * 1.05) g = Math.max(g, 18.5 * sag * (1 - Math.pow(rr / Rl, 2.4)) - (fy + 0.08));
        }
        for (const rm of ROOMS) {
          if (Math.abs(s - rm.s) > rm.R * 1.45) continue;
          const dx = x - rm.x, dz = z - rm.z, rr = Math.hypot(dx, dz); if (rr > rm.R * 1.3) continue;
          const Rl = rm.R * (1 + 0.1 * Math.sin(3 * Math.atan2(dz, dx) + rm.ph) + 0.07 * noise.n2(x * 0.06 + rm.s, z * 0.06));
          if (rm.mound) { const md = rm.mound * Math.max(0, noise.fbm2(x * 0.07 + 11, z * 0.07, 2) + 0.15) * sstep(4.5, 10, Math.abs(t)) * sstep(rm.R * 1.25, rm.R * 0.85, rr); fy += md; MND[o] += md; }
          if (rr < Rl * 1.05) g = Math.max(g, rm.H * sag * (1 - Math.pow(rr / Rl, 2.4)) - (fy + 0.08));
        }
        // the hollow in the boulder's lee: where the wind turns round the rock the snow is scooped out against its face, a vault
        // narrower than the boulder's room and half as tall again, highest at the rock and coming down onto its shoulder. It lifts
        // the roof only where the room already stands 8 m high and more (eased in slowly, whole only where the room stands 15.5 m:
        // the vault grows out of the room's own roof with no step where it begins), so the foot of every wall, the floor
        // anything stands or runs on and all that is dealt by the roof's height below that are as the room alone leaves them.
        // The lift is kept apart (leeIdx, leePre, leePost, LIFT): the thatch is dealt on the roof as the room alone leaves it and
        // rides up with the lift afterwards
        let lift = 0;
        if (g > 8) { const dx = x - leeX, dz = z - leeZ, rr = Math.hypot(dx, dz);
          if (rr < LEE_R) { const hL = LEE_H * sag * (1 - Math.pow(rr / LEE_R, 2.4)) - (fy + 0.08); if (hL > g) lift = (hL - g) * sstep(8, 15.5, g); } }
        for (const b of BR) {
          if (s < b.sMin || s > b.sMax) continue;
          const q = brDist(b, x, z), wk = b.w * (1 - sstep(0.6, 1, q.k));
          if (wk > 0.3 && q.d < wk * 1.2) g = Math.max(g, b.H * (0.55 + 0.45 * (1 - sstep(0.5, 1, q.k))) * (1 - Math.pow(q.d / wk, 2.4)));
        }
        if (g > 0) g += (noise.n2(x * 0.33, z * 0.33) * 0.36 + noise.n2(x * 0.9, z * 0.9) * 0.13) * clamp(g / 2.5, 0, 1);
        if (s > 290 && s < 372) { const q = streamDist(s, t), k = 1 - (q.d / streamW(q.s)) ** 2; if (k > 0) { const dip = 1.3 * k * (2 - k); fy -= dip; if (g > 0) g += dip; } }
        // the vestibule floor is a hollow we rise out of, so the lower part of the portal's disc is ground too, not a cut edge
        { const dip = 4.8 * (1 - sstep(1, 17, s)); if (dip > 0) { fy -= dip; if (g > 0) g += dip; } }
        FY[o] = fy; GG[o] = Math.max(g, -0.6);
        if (lift > 0) { leeIdx.push(o); leePre.push(GG[o]); GG[o] = g + lift; leePost.push(GG[o]); LIFT[o] = GG[o] - leePre[leePre.length - 1]; }
      }
      await ctx.yield();
    }
    const samp = (Arr, s, t) => {
      const fi = clamp((s - S0) / DSG, 0, NI - 1.001), fj = clamp(qOf(t) + NQ, 0, NJ - 1.001), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j, o = i * NJ + j;
      return lerp(lerp(Arr[o], Arr[o + 1], b), lerp(Arr[o + NJ], Arr[o + NJ + 1], b), a);
    };
    const Gat = (s, t) => samp(GG, s, t), Fat = (s, t) => samp(FY, s, t);
    // the line our vole runs, metre by metre. One law on every seed: the floor it can run on is read from the height field at its place
    // (the roof 4.4 m or more over both shoulders, no water, clear of what stands on the floor), and it swings from side to side of the
    // middle of that floor as a smooth wave of its own arc length, as wide as the floor leaves room for and never wider than 5.5 m
    { const NT = 84, VM = new Float32Array(600), VH = new Float32Array(600), T1 = new Float32Array(600), T2 = new Float32Array(600);
      const freeAt = (fs, ft) => {
        if (Gat(fs, ft - 1.8) < 4.4 || Gat(fs, ft + 1.8) < 4.4 || (fs > 290 && fs < 372 && Fat(fs, ft) < WATER_Y + 0.3)) return false;
        for (const o of STAND) if ((fs - o[0]) * (fs - o[0]) + (ft - o[1]) * (ft - o[1]) < o[2] * o[2]) return false;
        return true;
      };
      let lo = -1, hi = 1;
      for (let i = 0; i < 600; i++) {
        let bl = 0, bh = 0, bo = -1e9, a0 = 0, open = false;
        for (let j = 0; j <= NT + 1; j++) {
          const ft = -10.5 + j * 0.25, f = j <= NT && freeAt(i, ft);
          if (f && !open) { a0 = ft; open = true; }
          else if (!f && open) { open = false; const b0 = ft - 0.25, ov = Math.min(b0, hi) - Math.max(a0, lo) + 0.02 * (b0 - a0); if (ov > bo) { bo = ov; bl = a0; bh = b0; } }
        }
        if (bo > -1e8) { lo = bl; hi = bh; }
        VM[i] = 0.5 * (lo + hi); VH[i] = 0.5 * (hi - lo);
        if ((i & 63) === 63) await ctx.yield();
      }
      // the middle is smoothed over a body's length or two; the room is the least within 5 m, smoothed likewise
      const box = (A, B, r) => { for (let i = 0; i < 600; i++) { let a = 0, n = 0; for (let k = Math.max(0, i - r); k <= Math.min(599, i + r); k++) { a += A[k]; n++; } B[i] = a / n; } };
      for (let i = 0; i < 600; i++) { let m = 1e9; for (let k = Math.max(0, i - 5); k <= Math.min(599, i + 5); k++) m = Math.min(m, VH[k]); T1[i] = m; }
      box(T1, VH, 4); box(VM, T1, 5); box(T1, T2, 5);
      const tanD = Math.tan(0.85);
      let ph = 0, tp = 0;
      for (let i = 0; i < 600; i++) {
        const h = Math.min(VH[i], 5.5), w = 0.8 * Math.sin(ph + 0.6) + 0.2 * Math.sin(ph * 2.3 + 2.1);
        let t = (T2[i] + h * w) * sstep(24, 40, i);
        t = lerp(t, Math.max((i - sDive - 1.5) * tanD, -3), sstep(sDive - 6, sDive + 6, i));      // into its side hole, along the hole's own line
        VT[i] = t;
        const da = Math.hypot(1, t - tp); ph += TAU * da / (26 + 5 * h); tp = t;
      }
      for (let it = 0; it < 2; it++) { let p0 = VT[0]; for (let i = 1; i < 599; i++) { const c = VT[i]; VT[i] = 0.25 * p0 + 0.5 * c + 0.25 * VT[i + 1]; p0 = c; } }
      await ctx.yield();
      // the mounds of the chambers lie level along its run
      for (let i = 0; i < NI; i++) {
        const gs = Math.min(S0 + i * DSG, S1 - 0.01), vt = voleT(gs);
        for (let j = 0; j < NJ; j++) { const o = i * NJ + j; if (MND[o] <= 0) continue; const d = MND[o] * 0.85 * (1 - sstep(2.6, 5.6, Math.abs(tOf(j - NQ) - vt))); FY[o] -= d; if (GG[o] > 0) GG[o] += d; }
      }
    }
    await ctx.yield();

    // ---- roof underside + walls, and the floor, in chunks along the path
    // zones along the flight (aZ): x the roof is ribbed wind crust (the runway and thicket, the lichen garden's porch), y the walls are
    // drifted pillows with a bank at their foot (everywhere but the ice gallery, the hall and the fox's room)
    const wallZ = (s) => 1 - sstep(98, 106, s) * (1 - sstep(300, 310, s));
    const ribZ = (s) => sstep(30, 40, s) * (1 - sstep(96, 104, s)) + sstep(430, 438, s) * (1 - sstep(470, 478, s));
    // and what the shell itself shows by the rooms (aW; nought outside the way): x lenses of clear ice in the walls (the ice gallery),
    // y wet walls and runnels on the floor (the fox's room, the meltwater), z moss on the foot of the walls (the grotto, the boulder),
    // w bare wind crust (the lichen garden, the ptarmigan's burrow)
    // (the walls by the meltwater, 296 to 354 m, carry lenses of ice as well, at 0.7 of the ice gallery's strength)
    const wayZ = (s, o) => { o.push(Math.max(span(118, 170, s), 0.7 * span(296, 354, s)), span(254, 354, s), span(354, 446, s), span(446, 566, s)); };
    const gridMeshes = async (roof, st, mat) => {
      for (let c = 0; c < NCH; c++) {
        const iA = c * iPer, iB = (c + 1) * iPer, nI = (iB - iA) / st + 1, nJ = (NJ - 1) / st + 1;
        const map = new Int32Array(nI * nJ).fill(-1), P = [], N = [], Gs = [], Zs = [], Ws = [], I = [];
        const yAt = (i, j) => FY[i * NJ + j] + (roof ? GG[i * NJ + j] : 0);
        const vert = (i, j) => {
          const m = ((i - iA) / st) * nJ + j / st; if (map[m] >= 0) return map[m];
          const o = i * NJ + j, i0 = Math.max(i - st, 0), i1 = Math.min(i + st, NI - 1), j0 = Math.max(j - st, 0), j1 = Math.min(j + st, NJ - 1);
          const ax = GX[i1 * NJ + j] - GX[i0 * NJ + j], ay = yAt(i1, j) - yAt(i0, j), az = GZ[i1 * NJ + j] - GZ[i0 * NJ + j];
          const bx = GX[i * NJ + j1] - GX[i * NJ + j0], by = yAt(i, j1) - yAt(i, j0), bz = GZ[i * NJ + j1] - GZ[i * NJ + j0];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1, sg = (ny < 0) === roof ? 1 : -1;
          P.push(GX[o], yAt(i, j), GZ[o]); N.push(nx / l * sg, ny / l * sg, nz / l * sg); Gs.push(GG[o]); Zs.push(ribZ(S0 + i * DSG), wallZ(S0 + i * DSG)); wayZ(S0 + i * DSG, Ws);
          if (!roof) Ws[Ws.length - 4] = span(288, 373, S0 + i * DSG, 3);    // (the floor has no ice lenses: its x is where the meltwater runs)
          return (map[m] = P.length / 3 - 1);
        };
        for (let i = iA, row = 0; i < iB; i += st, row++) {
          for (let j = 0; j < NJ - 1; j += st) {
            const g = Math.max(GG[i * NJ + j], GG[(i + st) * NJ + j], GG[i * NJ + j + st], GG[(i + st) * NJ + j + st]);
            if (g < -0.25) continue;
            const a = vert(i, j), b = vert(i + st, j), d = vert(i + st, j + st), e = vert(i, j + st);
            I.push(a, b, d, a, d, e);
          }
          if ((row & 7) === 7) await ctx.yield();
        }
        await ctx.yield();
        if (!I.length) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        geo.setAttribute('aG', new THREE.Float32BufferAttribute(Gs, 1)); geo.setAttribute('aZ', new THREE.Float32BufferAttribute(Zs, 2)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(Ws, 4)); geo.setIndex(I); geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(geo, mat); mesh.matrixAutoUpdate = false; scene.add(mesh); chunks[c].objs.push(mesh);
        await ctx.yield();
      }
    };
    const season01 = season === 'early' ? 1 : 0;
    const roofMat = mk(U, { vs: ROOF_VS, fs: ROOF_FS });
    const blobs = Array.from({ length: 10 }, () => new THREE.Vector4(0, 1e4, 1, 0));
    const floorMat = mk(U, { vs: FLOOR_VS, fs: FLOOR_FS, uniforms: { uBlob: { value: blobs }, uWet: { value: LK.wet }, uWaterY: { value: WATER_Y }, uMossA: { value: col(LK.wet ? '#1d4418' : '#22381c') }, uMossB: { value: col(LK.wet ? '#5c8a2a' : season01 ? '#5d7a2c' : '#55682e') } } });
    await gridMeshes(true, 1, roofMat);
    await gridMeshes(false, 2, floorMat);
    await ctx.yield();

    // ---- scatter helpers over the gallery map
    // nothing hangs or grows within 15 m of the ptarmigan
    const birdXZ = (() => { toW(birdAt.s, birdAt.t); return [W_.x, W_.z]; })();
    const nearBird = (x, z) => Math.hypot(x - birdXZ[0], z - birdXZ[1]) < 15;
    const D_ = { x: 0, z: 0, l: 0 };
    const gradW = (s, t) => { const gs = (Gat(s + 0.8, t) - Gat(s - 0.8, t)) / 1.6, gt = Gat(s, t + 0.5) - Gat(s, t - 0.5); fr(s); D_.x = F_.tx * gs - F_.tz * gt; D_.z = F_.tz * gs + F_.tx * gt; D_.l = Math.hypot(D_.x, D_.z); return D_; };
    const hallST = () => { const a = sr.range(0, TAU), r = Rh * Math.sqrt(sr()) * 0.97; return [sHall + Math.sin(a) * r, tHall + Math.cos(a) * r]; };   // roughly: the hall in (s, t)
    const nHall = lemmings ? Math.round(2 + (dens - 0.7) / 0.6 * 7) : 3;
    // the feeding places lie right of the runway, in the hall
    const homes = []; for (let i = 0; i < nHall; i++) { const b = HOME0[i % 9]; homes.push([b[0] + sr.range(-0.4, 0.4), b[1] + sr.range(-0.4, 0.4)]); }

    // ---- the stones and the clods of the fox's heap are drawn here, from streams of their own, and built further down with the boulder
    // and the heap; and the feet of everything that stands beside the way are listed as discs in (s, t): the stones, the boulder's rim,
    // the birch's trunk and roots, the stems of the hall, the heap and its clods. Stones keep clear of the line the vole runs
    const STONES = [], CLODS = [], FEET = [];
    { const R = stream('stones');
      for (let i = 0; i < 11; i++) {
        const s = R.range(410, 444), t = R.range(5.6, 11), r = R.range(0.7, 2.2), sq = R.range(0.55, 0.85), sd = R.range(0, 50), rt = R.range(0.8, 1.2);
        if (Gat(s, t) < 2 || Math.hypot(s - sunSpot.s, t - sunSpot.t) < 3.2 || Math.abs(t - voleT(s)) < r * 1.25 + 1.3) continue;
        STONES.push([s, t, r, sq, rt, sd, 0.45]);
      }
      for (let i = 0; i < RM.rockAnte.stones; i++) {
        const s = R.range(386, 411), t = R.range(4.8, 11.5) * R.sign(), r = R.range(0.8, 2.6), sq = R.range(0.5, 0.85), sd = R.range(0, 50), rt = R.range(0.8, 1.2);
        if (Gat(s, t) < 2 || Math.abs(t - voleT(s)) < r * 1.25 + 1.3) continue;
        STONES.push([s, t, r, sq, rt, sd, 0.4]);
      }
      const Rc = stream('fox-heap');
      for (let i = 0; i < 16; i++) { const a = Rc.range(0, TAU), d = Rc.range(1, 6.5); CLODS.push([foxAt.s + Math.cos(a) * d, foxAt.t + Math.sin(a) * d, Rc.range(0.4, 1.0), Rc.range(0.8, 1.2), Rc.range(0, 50), d]); }
      for (const q of STONES) FEET.push([q[0], q[1], q[2]]);
      for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; FEET.push([rockAt.s + Math.cos(a) * 16.3, rockAt.t + Math.sin(a) * 13.8, 0.5]); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; FEET.push([birchAt.s + Math.cos(a) * 4.5, birchAt.t + Math.sin(a) * 4.5, 0.4]); }
      for (const [a, reach, , , r0] of ROOTS) for (const k of [0.45, 1]) FEET.push([birchAt.s + Math.cos(a) * (1.6 + reach * k), birchAt.t + Math.sin(a) * (1.6 + reach * k), r0 * (1 - 0.68 * k)]);
      FEET.push([birchAt.s + Math.cos(4.52) * 23.3, birchAt.t + Math.sin(4.52) * 23.3, 0.5]);
      for (const [hs, ht] of STEMS) FEET.push([hs, ht, 0.9]);
      FEET.push([191.5, -13.5, 0.4]);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; FEET.push([foxAt.s + Math.cos(a) * 5.3, foxAt.t + Math.sin(a) * 4.8, 0.5]); }
      for (const q of CLODS) FEET.push([q[0], q[1], q[2]]);
    }
    const inSolid = (s, t) => ((s - rockAt.s) / 16.3) ** 2 + ((t - rockAt.t) / 13.8) ** 2 < 0.94 || Math.hypot(s - birchAt.s, t - birchAt.t) < 4.2 || STONES.some((q) => Math.hypot(s - q[0], t - q[1]) < q[2] * 0.85);
    // one rule for every foot whose face comes within 12 m of the route, the whole way: `per` things for each metre of its radius (and
    // one for the foot itself) stand on the floor round its rim, clear of the vole's run, the ermine's strip and the ptarmigan
    const dress = (R, per, put) => {
      for (const [fs, ft, rad] of FEET) {
        if (Math.abs(ft) - rad > 12) continue;
        for (let k = 0, n = Math.floor(per * (1 + rad) + R()); k < n; k++) {
          const a = R.range(0, TAU), d = rad + R.range(0.1, 1.25), s = fs + Math.cos(a) * d, t = ft + Math.sin(a) * d;
          if (Math.abs(t) < 2.9 || Gat(s, t) < 1.5 || Fat(s, t) < -0.5 || inSolid(s, t) || Math.abs(t - voleT(s)) < 1.5 || ermDist(s, t) < 4.5) continue;
          toW(s, t); if (nearBird(W_.x, W_.z)) continue;
          put(s, t, R);
        }
      }
    };

    // ---- sedge ribbons (wall thatch, ribs over the crown, litter) and the frost feathers on their edges
    const mkAcc = () => Array.from({ length: NCH }, () => ({ P: [], N: [], UV: [], R: [], I: [] }));
    const frost = mkAcc();
    // sedge goes into growing typed arrays (normals and side vectors as signed bytes): there are a few hundred thousand vertices
    const SK = [['P', 3], ['N', 3], ['S', 3], ['UV', 3], ['R', 2], ['St', 4]];
    const sedge = Array.from({ length: NCH }, () => ({ P: new Float32Array(3 * 32768), N: new Int8Array(3 * 32768), S: new Int8Array(3 * 32768), UV: new Float32Array(3 * 32768), R: new Float32Array(2 * 32768), St: new Int8Array(4 * 32768), I: new Uint32Array(3 * 32768), nv: 0, ni: 0, cap: 32768, capI: 3 * 32768 }));
    const growS = (a, nv, ni) => {
      if (a.nv + nv > a.cap) { const c = a.cap * 2; for (const [k, m] of SK) { const q = new a[k].constructor(c * m); q.set(a[k]); a[k] = q; } a.cap = c; }
      if (a.ni + ni > a.capI) { const c = a.capI * 2, q = new Uint32Array(c); q.set(a.I); a.I = q; a.capI = c; }
    };
    // a frost feather that would hang past a blade's broken end is worked out all the same, into this scratch store, so that it takes its draws
    const frostDry = { P: [], N: [], UV: [], R: [], I: [] };
    // the place (metres along the way) of the blade being made, for its state (stateAt); under nought: it has none. brk: it may be broken short
    let bladeS = -1, bladeBrk = false;
    const stQ = [0, 0, 0, 0];
    const frostP = 0.06 * (season === 'early' ? 0.55 : 1) * detail;
    const cX = new Float32Array(14), cY = new Float32Array(14), cZ = new Float32Array(14), nX = new Float32Array(14), nY = new Float32Array(14), nZ = new Float32Array(14);
    // the lift of each centre of a blade laid in the boulder's lee (nought elsewhere); lifted: the blade in hand has some; leeDown: the
    // roof of the lee is down for the thatch's deal
    const cL = new Float32Array(14); let lifted = false, leeDown = false;
    const CRW = [0, 1, 2].map((q) => { const t = q / 3, t2 = t * t, t3 = t2 * t; return [-0.5 * t3 + t2 - 0.5 * t, 1.5 * t3 - 2.5 * t2 + 1, -1.5 * t3 + 2 * t2 + 0.5 * t, 0.5 * t3 - 0.5 * t2, t]; });
    const SUB = 3, MF = 48, fX = new Float32Array(MF), fY = new Float32Array(MF), fZ = new Float32Array(MF), gX = new Float32Array(MF), gY = new Float32Array(MF), gZ = new Float32Array(MF), fD = new Float32Array(MF), kp = new Int16Array(MF);
    // one leaf from n centres (cX..nZ): the centre line is relaxed and run through a Catmull-Rom spline so it bends without corners,
    // points are kept where it turns (so straight runs stay cheap), and it tapers from a broad base to a fine point
    const emitRibbon = (n, width, hash, green, ch, frosty, coarse = false) => {
      const turnMax = coarse ? 0.13 : 0.085, stepMax = coarse ? 2 * SUB : SUB;
      if (n < 3) return;
      for (let it = 0; it < 3; it++) {
        let ax = cX[0], ay = cY[0], az = cZ[0], bx0 = nX[0], by0 = nY[0], bz0 = nZ[0];
        for (let k = 1; k < n - 1; k++) {
          const bx = cX[k], by = cY[k], bz = cZ[k]; cX[k] = (ax + 2 * bx + cX[k + 1]) * 0.25; cY[k] = (ay + 2 * by + cY[k + 1]) * 0.25; cZ[k] = (az + 2 * bz + cZ[k + 1]) * 0.25; ax = bx; ay = by; az = bz;
          const mx = nX[k], my = nY[k], mz = nZ[k]; nX[k] = (bx0 + 2 * mx + nX[k + 1]) * 0.25; nY[k] = (by0 + 2 * my + nY[k + 1]) * 0.25; nZ[k] = (bz0 + 2 * mz + nZ[k + 1]) * 0.25; bx0 = mx; by0 = my; bz0 = mz;
        }
      }
      const m = (n - 1) * SUB + 1;
      for (let k = 0; k < n - 1; k++) {
        const k0 = Math.max(k - 1, 0), k2 = k + 1, k3 = Math.min(k + 2, n - 1);
        for (let q = 0; q < SUB; q++) {
          const cw = CRW[q], a0 = cw[0], a1 = cw[1], a2 = cw[2], a3 = cw[3], t = cw[4], o = k * SUB + q;
          fX[o] = a0 * cX[k0] + a1 * cX[k] + a2 * cX[k2] + a3 * cX[k3]; fY[o] = a0 * cY[k0] + a1 * cY[k] + a2 * cY[k2] + a3 * cY[k3]; fZ[o] = a0 * cZ[k0] + a1 * cZ[k] + a2 * cZ[k2] + a3 * cZ[k3];
          gX[o] = nX[k] + (nX[k2] - nX[k]) * t; gY[o] = nY[k] + (nY[k2] - nY[k]) * t; gZ[o] = nZ[k] + (nZ[k2] - nZ[k]) * t;
        }
      }
      fX[m - 1] = cX[n - 1]; fY[m - 1] = cY[n - 1]; fZ[m - 1] = cZ[n - 1]; gX[m - 1] = nX[n - 1]; gY[m - 1] = nY[n - 1]; gZ[m - 1] = nZ[n - 1];
      let nk = 1, turn = 0, steps = 0, px = fX[1] - fX[0], py = fY[1] - fY[0], pz = fZ[1] - fZ[0], pl = Math.sqrt(px * px + py * py + pz * pz) || 1e-6;
      kp[0] = 0; fD[0] = 0;
      for (let j = 1; j < m; j++) {
        fD[j] = fD[j - 1] + pl;                                      // pl: the length of the step that ends here
        if (j === m - 1) { kp[nk++] = j; break; }
        const qx = fX[j + 1] - fX[j], qy = fY[j + 1] - fY[j], qz = fZ[j + 1] - fZ[j], ql = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1e-6;
        // the chord between the two unit directions: near enough the angle turned
        turn += Math.sqrt(Math.max(2 - 2 * (px * qx + py * qy + pz * qz) / (pl * ql), 0)); steps++;
        px = qx; py = qy; pz = qz; pl = ql;
        if (turn > turnMax || steps >= stepMax) { kp[nk++] = j; turn = 0; steps = 0; }
      }
      const len = fD[m - 1]; if (len < 0.5) return;
      // its state by its place. A blade broken short is made as far as the first point past its break (SEDGE_FS draws the broken end);
      // the points after it are still worked through, so that every draw is taken
      let s0 = 0, s1 = 0, s2 = 0, s3 = 127, wet = 0, off = false, nw = 0;
      if (bladeS >= 0) {
        stateAt(bladeS, stQ); s0 = Math.round((stQ[0] - stQ[3]) * 127); s1 = Math.round(stQ[1] * 127); s2 = Math.round(stQ[2] * 127); wet = stQ[1];
        if (bladeBrk && (hash * 37.1) % 1 < stQ[3] * 0.85) s3 = Math.round((0.3 + 0.4 * ((hash * 91.7) % 1)) * 127);
      }
      const cut = s3 / 127;
      const acc = sedge[ch]; growS(acc, nk * 2, (nk - 1) * 6);
      const base = acc.nv, P = acc.P, N = acc.N, S = acc.S, UV = acc.UV, R = acc.R, I = acc.I, St = acc.St;
      for (let i = 0; i < nk; i++) {
        const j = kp[i], j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, m - 1);
        let dx = fX[j1] - fX[j0], dy = fY[j1] - fY[j0], dz = fZ[j1] - fZ[j0]; const dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1; dx /= dl; dy /= dl; dz /= dl;
        let ux = gX[j], uy = gY[j], uz = gZ[j]; const ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1; ux /= ul; uy /= ul; uz /= ul;
        let sx = dy * uz - dz * uy, sy = dz * ux - dx * uz, sz = dx * uy - dy * ux; const sl = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1; sx /= sl; sy /= sl; sz /= sl;
        const v = fD[j] / len, w = Math.max(width * 0.5 * Math.pow(1 - v, 0.62) * (0.55 + 0.45 * Math.min(v * 7, 1)), 0.012);
        // (a blade in the boulder's lee rides up with the roof it lies on: lf, between the lifts of its two nearest centres)
        let lf = 0; if (lifted) { const kc = Math.min(Math.floor(j / SUB), n - 1), k1 = Math.min(kc + 1, n - 1); lf = cL[kc] + (cL[k1] - cL[kc]) * (j - kc * SUB) / SUB; }
        if (!off) {
          const o = (base + i * 2) * 3, o2 = (base + i * 2) * 2, o4 = o2 * 2;
          P[o] = fX[j] - sx * w; P[o + 1] = fY[j] - sy * w + lf; P[o + 2] = fZ[j] - sz * w; P[o + 3] = fX[j] + sx * w; P[o + 4] = fY[j] + sy * w + lf; P[o + 5] = fZ[j] + sz * w;
          N[o] = N[o + 3] = ux * 127; N[o + 1] = N[o + 4] = uy * 127; N[o + 2] = N[o + 5] = uz * 127;
          S[o] = S[o + 3] = sx * 127; S[o + 1] = S[o + 4] = sy * 127; S[o + 2] = S[o + 5] = sz * 127;
          UV[o] = -1; UV[o + 1] = v; UV[o + 2] = fD[j]; UV[o + 3] = 1; UV[o + 4] = v; UV[o + 5] = fD[j];
          R[o2] = R[o2 + 2] = hash; R[o2 + 1] = R[o2 + 3] = green;
          St[o4] = St[o4 + 4] = s0; St[o4 + 1] = St[o4 + 5] = s1; St[o4 + 2] = St[o4 + 6] = s2; St[o4 + 3] = St[o4 + 7] = s3;
          nw++;
          if (cut < 1 && v >= cut) off = true;
          else if (i < nk - 1) { const a = base + i * 2, q = acc.ni; I[q] = a; I[q + 1] = a + 1; I[q + 2] = a + 3; I[q + 3] = a; I[q + 4] = a + 3; I[q + 5] = a + 2; acc.ni += 6; }
        }
        if (frosty && i > 0 && v < 0.9 && sr() < frostP * (fD[j] - fD[kp[i - 1]]) / 1.2) {                 // a frost feather hanging off this edge
          // (none past a break; on a wet blade some are beads of water, FROST_FS: their second number is then 1 + half breadth over length)
          const fa = v > cut - 0.03 ? frostDry : frost[ch], fb = fa.P.length / 3, sg = sr() < 0.5 ? -1 : 1, cw = sr.range(0.12, 0.25), fl = sr.range(0.3, 0.72);
          let vx = ux * 0.8 + sx * sg * 0.5 + sr.range(-0.3, 0.3), vy = uy * 0.8 + sy * sg * 0.5 - 0.25, vz = uz * 0.8 + sz * sg * 0.5 + sr.range(-0.3, 0.3); const vl = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1; vx *= fl / vl; vy *= fl / vl; vz *= fl / vl;
          const ex = fX[j] + sx * sg * w, ey = fY[j] + sy * sg * w + lf, ez = fZ[j] + sz * sg * w, h2 = sr();
          fa.P.push(ex - dx * cw, ey - dy * cw, ez - dz * cw, ex + dx * cw, ey + dy * cw, ez + dz * cw, ex + dx * cw + vx, ey + dy * cw + vy, ez + dz * cw + vz, ex - dx * cw + vx, ey - dy * cw + vy, ez - dz * cw + vz);
          const qx = dy * vz - dz * vy, qy = dz * vx - dx * vz, qz = dx * vy - dy * vx, ql = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
          const bead = wet > 0 && (h2 * 7.3) % 1 < wet ? 1 + cw / fl : 0;
          for (let q = 0; q < 4; q++) { fa.N.push(qx / ql, qy / ql, qz / ql); fa.R.push(h2, bead); }
          fa.UV.push(0, 0, 1, 0, 1, 1, 0, 1); fa.I.push(fb, fb + 1, fb + 2, fb, fb + 2, fb + 3);
        }
      }
      acc.nv += nw * 2;
    };
    // a ribbon pressed against the snow: starts at (s, t), runs at angle a from "uphill" toward the tunnel direction
    // roof height, its gradient (per metre of s and of t) and the floor height at (s, t), from one visit to the grid
    const SA = { g: 0, f: 0, gs: 0, gt: 0 };
    const sampAll = (s, t) => {
      const fi = clamp((s - S0) / DSG, 0, NI - 1.001), fq = clamp(qOf(t) + NQ, 1, NJ - 2.001), i = Math.floor(fi), j = Math.floor(fq), a = fi - i, b = fq - j, o = i * NJ + j, o1 = o + NJ;
      const g00 = GG[o], g01 = GG[o + 1], g10 = GG[o1], g11 = GG[o1 + 1], g0 = g00 + (g01 - g00) * b, g1 = g10 + (g11 - g10) * b;
      SA.g = g0 + (g1 - g0) * a; SA.gs = (g1 - g0) / DSG;
      const lo = (GG[o - 1] + (g00 - GG[o - 1]) * b) * (1 - a) + (GG[o1 - 1] + (g10 - GG[o1 - 1]) * b) * a, hi = (g01 + (GG[o + 2] - g01) * b) * (1 - a) + (g11 + (GG[o1 + 2] - g11) * b) * a, q = fq - NQ;
      SA.gt = (hi - lo) / (tOf(q + 1) - tOf(q - 1));
      const f0 = FY[o] + (FY[o + 1] - FY[o]) * b, f1 = FY[o1] + (FY[o1 + 1] - FY[o1]) * b; SA.f = f0 + (f1 - f0) * a;
    };
    const wallRibbon = (s, t, a, sgn, len, width, inset, NS = 7, gMax = 99) => {
      // a blade is cut off where it would come too near the eye's line (path.isClear with 2.5 m asked); one that stands more than 6 m from it
      // is built coarser (fewer segments, and points kept only where it bends), and coarser again beyond 14 m
      const coarse = Math.abs(t) > 6; if (coarse) NS = Math.min(NS, Math.abs(t) > 14 ? 5 : 6);
      const seg = len / NS, ch = chunkOf(s), ca = Math.cos(a), sa = Math.sin(a); let px = 0, pz = 0, have = false, n = 0;
      for (let k = 0; k <= NS; k++) {
        sampAll(s, t); const g = SA.g, fl = SA.f; if (g < 0.05) break;
        const lev = g > gMax;                                       // above its height the blade runs level along the wall
        toW(s, t); const ux = F_.tx * SA.gs - F_.tz * SA.gt, uz = F_.tz * SA.gs + F_.tx * SA.gt, ul = Math.sqrt(ux * ux + uz * uz), tx = F_.tx * sgn, tz = F_.tz * sgn;
        let dx = px, dz = pz;
        if (ul > 0.03) { const c1 = lev ? -0.0891 : ca, s1 = lev ? 0.996 : sa; dx = ux / ul * c1 + tx * s1; dz = uz / ul * c1 + tz * s1; }
        if (have) { if (dx * px + dz * pz < 0.2) { dx = px; dz = pz; } else { dx = px * 0.5 + dx * 0.5; dz = pz * 0.5 + dz * 0.5; } }
        const dl = Math.sqrt(dx * dx + dz * dz); if (dl < 1e-4) break; dx /= dl; dz /= dl; px = dx; pz = dz; have = true;
        const nl = Math.sqrt(ux * ux + 1 + uz * uz), ins = inset * (0.6 + 0.4 * Math.min(k, 2) / 2);
        if (g > 5.6 && W_.x * W_.x + (W_.z - HOLE_Z) * (W_.z - HOLE_Z) < 256) break;            // nothing hangs under the roof the owl comes through
        nX[n] = ux / nl; nY[n] = -1 / nl; nZ[n] = uz / nl;
        cX[n] = W_.x + nX[n] * ins; cY[n] = Math.max(fl + g + nY[n] * ins, fl + 0.05); cZ[n] = W_.z + nZ[n] * ins;
        if (Math.abs(t) < 3.4 && cY[n] < 6.8 && !path.isClear(cX[n], cY[n], cZ[n], width * 0.5, 2.5)) break;
        // (in the boulder's lee the blade is laid on the roof as the room alone leaves it; each point's lift goes with it, cL)
        if (leeDown && s > 408 && s < 446) { cL[n] = samp(LIFT, s, t); if (cL[n] > 0) lifted = true; } else cL[n] = 0;
        n++;
        const slope = ux * dx + uz * dz, h = seg / Math.sqrt(1 + slope * slope);
        s += (dx * F_.tx + dz * F_.tz) * h; t += (-dx * F_.tz + dz * F_.tx) * h;
        if (s < S0 + 1 || s > SG1 - 2 || Math.abs(t) > 42) break;
      }
      emitRibbon(n, width, sr(), season01 * sr(), ch, true, coarse); lifted = false;
    };
    // a ribbon lying on the floor (matted litter, clipped stems)
    const floorRibbon = (s, t, ang, len, width, lift, R = sr) => {
      const ch = chunkOf(s); let n = 0; fr(s); const dx = Math.sin(ang), dz = -Math.cos(ang), ds = (dx * F_.tx + dz * F_.tz) * len / 4, dt = (-dx * F_.tz + dz * F_.tx) * len / 4;
      for (let k = 0; k <= 4; k++) {
        if (Gat(s, t) < 0.6) break;
        toW(s, t); cX[n] = W_.x; cY[n] = Fat(s, t) + 0.06 + lift * (0.3 + Math.sin(k / 4 * Math.PI)); cZ[n] = W_.z; nX[n] = 0; nY[n] = 1; nZ[n] = 0; n++;
        s += ds; t += dt;
      }
      emitRibbon(n, width, R(), season01 * R(), ch, false);
    };
    // first wall met when marching sideways from the path at s: where the thatch that the camera passes lives
    const wallAt = (s, side, gT) => {                                // (walks the grid columns outward along the row at s)
      const fi = clamp((s - S0) / DSG, 0, NI - 1.001), i = Math.floor(fi), a = fi - i, o = i * NJ + NQ;
      let prev = GG[o + side] * (1 - a) + GG[o + side + NJ] * a; if (prev < gT) return NaN;
      for (let q = 2; q < NQ; q++) {
        const j = o + side * q, g2 = GG[j] * (1 - a) + GG[j + NJ] * a;
        if (g2 < gT) { const k = (prev - gT) / Math.max(prev - g2, 1e-3); return side * (tOf(q - 1) + (tOf(q) - tOf(q - 1)) * k); }
        prev = g2;
      }
      return NaN;
    };
    deal('thatch');
    const nRib = Math.round(13500 * detail * (0.85 + 0.15 * dens));
    let made = 0;
    const oneRibbon = (s, t) => {
      if (sr() > sedgeK(s)) return;
      const kind = sr();
      bladeS = s; bladeBrk = true;
      if (kind < 0.04 && !nearHoof(s)) wallRibbon(s, t, sr.range(0.05, 0.45), sr.sign(), sr.range(13, 20), sr.range(0.2, 0.36), sr.range(0.1, 0.4), 13);       // ribs over the crown
      else wallRibbon(s, t, sr.range(0.85, 1.45), sr.sign(), sr.range(8, 16), 0.17 + 0.25 * sr() * (0.5 + 0.5 * sr()), sr.range(0.08, 0.6), 9, 2.2 + 2.6 * sr() * sr());   // thatch: leaves 17 to 42 cm wide at the base
      made++; bladeS = -1; bladeBrk = false;
      if (frostDry.P.length) for (const k in frostDry) frostDry[k].length = 0;
    };
    // (the roof of the boulder's lee is down while the thatch is dealt, and up again after: every blade of the whole way is dealt as
    // the rooms alone leave it, and those of the lee ride up with its roof)
    leeSet(false); leeDown = true;
    for (let tries = 0; tries < 500000 && made < nRib; tries++) {
      const m = sr();
      if (m < 0.6) { const s = sr.range(S0 + 3, SG1 - 8), t = wallAt(s, sr.sign(), sr.range(0.15, 2.2)); if (t === t && Math.abs(t) < 42) oneRibbon(s, t); }
      else {
        let s, t; const inH = m < 0.72; if (inH) [s, t] = hallST(); else { s = sr.range(S0 + 3, SG1 - 6); t = sr.range(-42, 42); }
        const g = Gat(s, t);
        if (g > 0.15 && g < 1.8) oneRibbon(s, t);
        else if (g > 1.6 && sr() < (inH ? 0.03 : 0.2) && Math.abs(t) > 1.2) { bladeS = s; floorRibbon(s, t, sr.range(0, TAU), sr.range(3, 8), sr.range(0.18, 0.34), sr() * sr() * 0.35); bladeS = -1; made++; }
      }
      if ((tries & 3) === 3) await ctx.yield();
    }
    leeSet(true); leeDown = false;
    // the strike gallery: frosted thatch standing a third of the way up its walls
    deal('strike-thatch');
    for (let i = 0, n = Math.round(900 * detail); i < n; i++) {
      const s = sr.range(596, sLast + 40), t = wallAt(s, sr.sign(), sr.range(0.2, 3.2));
      if (t === t) wallRibbon(s, t, sr.range(0.1, 0.75), sr.sign(), sr.range(7, 13), 0.15 + 0.2 * sr(), sr.range(0.08, 0.5), 9, 3.2 + 2.6 * sr());
      if ((i & 127) === 127) await ctx.yield();
    }
    // the frosted arch that frames the first view, and the heaps of clipped stems the hall voles feed at
    deal('arch');
    for (let i = 0; i < 30; i++) { const s = sr.range(27, 36), side = sr.sign(); let t = side * 0.5; while (Math.abs(t) < 12 && Gat(s, t) > 0.9) t += side * 0.25; wallRibbon(s, t, sr.range(-0.12, 0.12), 1, sr.range(15, 21), sr.range(0.3, 0.5), sr.range(0.15, 0.6), 13); }
    // the strike gallery is 20 m wide: straw litter right across its floor
    deal('strike-litter');
    const gS0 = 588, gS1 = sLast + 44, gT = () => (sr() < 0.5 ? sr.gauss() * 5.2 : sr.range(-9.6, 9.6));
    for (let i = 0, n = Math.round(520 * detail); i < n; i++) { const s = sr.range(gS0, gS1), t = gT(); if (Gat(s, t) > 1.6) floorRibbon(s, t, sr.range(0, TAU), sr.range(3, 8), sr.range(0.18, 0.34), sr() * sr() * 0.4, sr); if ((i & 31) === 31) await ctx.yield(); }
    // at every foot beside the way: frosted blades standing out of the floor, leaning and arching over; and frost feathers on the
    // crowns of the stones
    deal('foot-blades');
    dress(sr, 1.7, (s, t, R) => {
      const g = Gat(s, t), h = Math.min(R.range(0.9, 2.3), g * 0.6), az = R.range(0, TAU), lean = R.range(0.08, 0.4), curl = R.range(0.3, 1.0), ca = Math.cos(az), sa = Math.sin(az), wd = R.range(0.14, 0.26);
      let px = W_.x, py = Fat(s, t) - 0.06, pz = W_.z;
      if (!path.isClear(px, py + h * 0.6, pz, h * 0.6, 2.6)) return;
      for (let k = 0; k <= 5; k++) {
        const v = k / 5, tilt = lean + curl * v * v, st = Math.sin(tilt), ct = Math.cos(tilt);
        cX[k] = px; cY[k] = py; cZ[k] = pz; nX[k] = ct * ca; nY[k] = -st; nZ[k] = ct * sa;
        px += st * ca * h / 5; py += ct * h / 5; pz += st * sa * h / 5;
      }
      bladeS = s; emitRibbon(6, wd, R(), season01 * R(), chunkOf(s), true); bladeS = -1;
    });
    await ctx.yield();
    deal('stone-frost');
    for (const [qs, qt, qr, qsq] of STONES) {
      for (let k = 0, n = Math.round(3 + qr * 3); k < n; k++) {
        const a = sr.range(0, TAU), d = qr * 0.55 * Math.sqrt(sr()), s = qs + Math.cos(a) * d, t = qt + Math.sin(a) * d, az = sr.range(0, TAU), cw = sr.range(0.12, 0.24), fl = sr.range(0.3, 0.7), h2 = sr();
        toW(s, t); const fa = frost[chunkOf(s)], fb = fa.P.length / 3, ex = W_.x, ez = W_.z, ey = Fat(qs, qt) + qr * qsq * (0.42 + Math.sqrt(Math.max(1 - (d / qr) * (d / qr), 0.2))) - 0.14;
        const dx = Math.cos(az), dz = Math.sin(az), vx = -dz * 0.35 * fl + sr.range(-0.1, 0.1), vy = fl, vz = dx * 0.35 * fl + sr.range(-0.1, 0.1);
        fa.P.push(ex - dx * cw, ey, ez - dz * cw, ex + dx * cw, ey, ez + dz * cw, ex + dx * cw + vx, ey + vy, ez + dz * cw + vz, ex - dx * cw + vx, ey + vy, ez - dz * cw + vz);
        const qx = -dz * vy, qy = dz * vx - dx * vz, qz = dx * vy, ql = Math.hypot(qx, qy, qz) || 1;
        for (let q = 0; q < 4; q++) { fa.N.push(qx / ql, qy / ql, qz / ql); fa.R.push(h2, 0); }
        fa.UV.push(0, 0, 1, 0, 1, 1, 0, 1); fa.I.push(fb, fb + 1, fb + 2, fb, fb + 2, fb + 3);
      }
    }
    await ctx.yield();
    deal('heaps');
    for (const [hs, ht] of homes) for (let i = 0; i < 26; i++) floorRibbon(hs + sr.range(-2.5, 2.5) + 4, ht + sr.range(-2.5, 2.5), sr.range(0, TAU), sr.range(2, 4.5), sr.range(0.2, 0.34), sr.range(0.2, 1.4));
    await ctx.yield();
    // The make of the animal we follow that its room on the run is measured by (voleSpec takes these): the sections of its body
    // [zf 0 (rump) .. 1 (nose), centre y, radius y, radius x], the length of the fur of its outline, how far its thighs bulge and
    // how far each works at the run. VOLE_HALF: half its greatest width as it runs, fur and working thigh and all (3.48 m). The
    // moss cushions and the lichen of the way, and the hoar tufts and the drifts of the last straight, keep off the middle of its
    // run by that and by their own reach
    const VOLE_ROWS = [[0, 1.45, 0.05, 0.05], [0.02, 1.5, 0.8, 0.85], [0.06, 1.58, 1.22, 1.42], [0.13, 1.64, 1.52, 1.84], [0.24, 1.7, 1.68, 2.02], [0.38, 1.76, 1.72, 2.0], [0.52, 1.82, 1.6, 1.86], [0.63, 2.0, 1.48, 1.72], [0.72, 2.5, 1.4, 1.56], [0.80, 2.9, 1.44, 1.56], [0.88, 2.88, 1.24, 1.32], [0.94, 2.7, 0.9, 0.94], [0.985, 2.5, 0.44, 0.48], [1, 2.44, 0.06, 0.06]];
    const VOLE_FRINGE = 0.5, VOLE_HAUNCH = 1, VOLE_HAUNCHK = 0.3;
    const VOLE_HALF = (Math.max(...VOLE_ROWS.map((r) => r[3])) + VOLE_FRINGE) * (1 + 0.26 * VOLE_HAUNCH) + VOLE_HAUNCHK;
    // the ice gallery and the two ante-rooms: plumes of hoar grown up from the floor along the walls, 1 to 2 m tall. Each is a tuft of
    // five to nine narrow fronds that lean out of one root, arch over and cross; the feathering is drawn in PLUME_FS
    const plume = mkAcc();
    const onePlume = (s, t, H, yaw, lean, hh) => {
      toW(s, t); const fa = plume[chunkOf(s)], y0 = Fat(s, t) - 0.06, bx = W_.x, bz = W_.z;
      const hs = (n) => { const v = Math.sin(n * 12.9898 + hh * 78.233) * 43758.5453; return v - Math.floor(v); };
      const nb = 5 + Math.floor(hs(1.3) * 3.99), SEG = 4;
      for (let b = 0; b < nb; b++) {
        const az = yaw + b * 2.39996 + (hs(b + 2.1) - 0.5) * 0.9, out0 = b === 0 ? 0.06 : 0.12 + 0.5 * hs(b + 5.7), curl = b === 0 ? 0.5 : 0.6 + 0.9 * hs(b + 9.3);
        const len = H * (b === 0 ? 1 : 0.55 + 0.42 * hs(b + 13.1)), hw = len * (0.125 + 0.07 * hs(b + 17.9)), tw = (hs(b + 23.3) - 0.5) * 1.3, hb = hs(b + 31.7);
        const ca = Math.cos(az), sa = Math.sin(az), base = fa.P.length / 3;
        let px = bx + ca * 0.08 + lean * H * 0.1, py = y0, pz = bz + sa * 0.08;
        for (let k = 0; k <= SEG; k++) {
          const v = k / SEG, tilt = out0 + curl * v * v;                 // angle from the vertical: it arches outward toward the tip
          const dx = Math.sin(tilt) * ca, dy = Math.cos(tilt), dz = Math.sin(tilt) * sa;
          // across the blade: square to its lean, twisted a little more toward the tip so that the fronds of a tuft cross
          const a2 = az + Math.PI / 2 + tw * (0.4 + 0.6 * v), wx = Math.cos(a2), wz = Math.sin(a2);
          let nx = dy * wz, ny = dz * wx - dx * wz, nz = -dy * wx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          fa.P.push(px - wx * hw, py, pz - wz * hw, px + wx * hw, py, pz + wz * hw);
          fa.N.push(nx, ny, nz, nx, ny, nz); fa.UV.push(0, v, 1, v); fa.R.push(hb, len, hb, len);
          if (k < SEG) { const a = base + k * 2; fa.I.push(a, a + 1, a + 3, a, a + 3, a + 2); }
          px += dx * len / SEG; py += dy * len / SEG; pz += dz * len / SEG;
        }
      }
    };
    deal('plumes');
    for (const rm of ROOMS) { if (!rm.fans) continue; const big = rm.H / 15.5;
      for (let i = 0, n = Math.round(rm.fans * detail); i < n; i++) {
        const a = sr.range(0, TAU), r = rm.R * sr.range(0.42, 0.98), s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r, g = Gat(s, t);
        const h = Math.min(sr.range(1.6, 4.6) * big, g * 0.8), yaw = sr.range(0, TAU), lean = sr.range(-0.3, 0.3), hh = sr();
        if (Math.abs(t) < 4.6 || g < 1.2 || Math.abs(t - voleT(s)) < 2.8) continue;
        onePlume(s, t, Math.min(0.95 + 0.26 * h / big, g * 0.7), yaw, lean, hh);
        if ((i & 31) === 31) await ctx.yield();
      }
      // and smaller tufts between them, right down to the edge of the runway
      for (let i = 0, n = Math.round(rm.fans * 0.5 * detail); i < n; i++) {
        const a = sr.range(0, TAU), r = rm.R * sr.range(0.26, 1.0), s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r, H = sr.range(0.55, 1.25), yaw = sr.range(0, TAU), hh = sr(), g = Gat(s, t);
        if (Math.abs(t) < 3.4 || g < 1.0 || Math.abs(t - voleT(s)) < 2.8) continue;
        onePlume(s, t, Math.min(H, g * 0.7), yaw, 0, hh);
        if ((i & 31) === 31) await ctx.yield();
      } }
    // the last straight (566 to 640 m): small tufts of hoar stand on the floor either side of the way, half a metre to a metre tall,
    // from a stream of their own, metre by metre (all the draws are taken, then the place is tried). A tuft keeps more than 2.0 m
    // from the eye's line with its whole reach, and off the middle of the vole's run by half the animal's width and its own reach
    { const R = stream('last-hoar');
      for (let s = 566, q = 0; s < 640; s += 0.7) {
        if ((++q & 15) === 15) await ctx.yield();
        const ps = s + 0.7 * R(), tt = R.sign() * R.range(3.0, 8.5), H = R.range(0.45, 1.0), yaw = R.range(0, TAU), hh = R();
        if (Gat(ps, tt) < 1.6 || Math.abs(tt) < 2.7 + 0.8 * H || Math.abs(tt - voleT(ps)) < VOLE_HALF + 0.8 * H || inSolid(ps, tt)) continue;
        toW(ps, tt); if (!path.isClear(W_.x, Fat(ps, tt) + 0.5 * H, W_.z, 0.9 * H, 2.5)) continue;
        onePlume(ps, tt, H, yaw, 0, hh);
      } }
    await ctx.yield();
    // ---- THE WAY BETWEEN THE ROOMS: what the walls and their foot carry beside the thatch, by place: moss cushions (354 to 446 m),
    // stones that bear a bush of lichen (356 to 446 m), bushes and cups of lichen (446 to 566 m) and the ptarmigan's down on the floor
    // (500 to 566 m), each further down, with its own kind. Every kind is dealt from a stream of its own, metre by metre along the way
    // (all its draws are taken at every place, then the place is tried; but the forks of a lichen bush, on a stone of the way or at
    // the wall's foot, are drawn only where its place has passed), and keeps more than 2.0 m from the eye's line (path.isClear with
    // 2.5 m asked, which measures to the path's sampled points); none of it hangs over the line.
    const stripMat = (vs, fs, uniforms) => mk(U, { vs, fs, uniforms });
    const sedgeMat = stripMat(SEDGE_VS, SEDGE_FS, { uStraw: { value: col('#BC9C5A') }, uStraw2: { value: col('#8f7a50') }, uGreenBase: { value: col('#5f7a34') } });
    const frostMat = stripMat(FROST_VS, FROST_FS);
    const plumeMat = stripMat(PLUME_VS, PLUME_FS);
    await ctx.yield();
    const accMeshes = async (accs, mat) => { for (let c = 0; c < accs.length; c++) {
      const a = accs[c]; if (!a.I.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(a.P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(a.N, 3));
      geo.setAttribute('aUv', new THREE.Float32BufferAttribute(a.UV, 2)); geo.setAttribute('aRnd', new THREE.Float32BufferAttribute(a.R, 2));
      geo.setIndex(a.I); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat); mesh.matrixAutoUpdate = false; scene.add(mesh); chunks[c].det.push(mesh);
      await ctx.yield();
    } };
    for (let c = 0; c < NCH; c++) {
      const a = sedge[c]; if (!a.ni) continue;
      const geo = new THREE.BufferGeometry(), nv = a.nv;
      await ctx.yield();
      geo.setAttribute('position', new THREE.BufferAttribute(a.P.slice(0, nv * 3), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(a.N.slice(0, nv * 3), 3, true));
      geo.setAttribute('aSide', new THREE.BufferAttribute(a.S.slice(0, nv * 3), 3, true)); geo.setAttribute('aUv', new THREE.BufferAttribute(a.UV.slice(0, nv * 3), 3));
      geo.setAttribute('aRnd', new THREE.BufferAttribute(a.R.slice(0, nv * 2), 2)); geo.setAttribute('aSt', new THREE.BufferAttribute(a.St.slice(0, nv * 4), 4, true)); geo.setIndex(new THREE.BufferAttribute(a.I.slice(0, a.ni), 1)); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, sedgeMat); mesh.matrixAutoUpdate = false; scene.add(mesh); chunks[c].det.push(mesh);
      sedge[c] = null; await ctx.yield();
    }
    await ctx.yield();
    await accMeshes(frost, frostMat); await ctx.yield();
    await accMeshes(plume, plumeMat); await ctx.yield();

    // ---- hoar chandeliers: clusters of cup crystals hanging from the roof. One crystal is a hollow six-sided cup hung by its point:
    // a thin wall flaring downward, a rim, and the inside wall going back up into the hollow (colour = rim, inside flags for CRYS_FS)
    // (fine: for the crystals that hang near the path, a cup with bevelled corners and a stepped wall)
    const crystalGeo = (fine) => {
      const g = new Soup(), rings = [];
      const prof = fine ? [[0.04, 0, 0, 0], [0.18, -0.14, 0, 0], [0.23, -0.27, 0, 0], [0.37, -0.4, 0, 0], [0.42, -0.56, 0, 0], [0.57, -0.7, 0, 0], [0.66, -0.86, 1, 0], [0.57, -0.848, 1, 1], [0.36, -0.52, 0, 1]]
        : [[0.05, 0, 0, 0], [0.24, -0.2, 0, 0], [0.45, -0.55, 0, 0], [0.66, -0.86, 1, 0], [0.56, -0.845, 1, 1], [0.34, -0.5, 0, 1]];
      const NS = fine ? 12 : 6, last = prof.length - 1;
      prof.forEach(([r, y, rim, ins], j) => { const ring = []; for (let k = 0; k < NS; k++) { const a = fine ? (Math.floor(k / 2) + (k % 2 ? 0.11 : -0.11) + 0.03 * j) / 6 * TAU : (k + 0.08 * j) / 6 * TAU; ring.push(g.v(Math.cos(a) * r, y, Math.sin(a) * r, [rim, ins, 0])); } rings.push(ring); });
      g.loft(rings, true);
      const c = g.v(0, 0.04, 0, [0, 0, 0]); for (let k = 0; k < NS; k++) g.tri(c, rings[0][k], rings[0][(k + 1) % NS]);
      const ci = g.v(0, -0.16, 0, [0, 1, 0]); for (let k = 0; k < NS; k++) g.tri(ci, rings[last][(k + 1) % NS], rings[last][k]);
      return g.build();
    };
    const crys = Array.from({ length: NCH }, () => ({ M: [], S: [] })), crysN = Array.from({ length: NCH }, () => ({ M: [], S: [] }));
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), p4 = new V3(), s4 = new V3();
    const BSC = 0.8;
    // (up: how far the lee's roof is raised over the crystal's seat. The crystal is tried and dealt at the height it has under the
    // roof as the room alone leaves it, and then hangs that much higher)
    const addCrystal = (x, y, z, size, s, tilt = 0.6, R = sr, clear = 4.7, up = 0) => {
      const dp = path.distanceTo(x, y - size * 0.5, z); if (dp < 3.2 + size * 0.6) return;
      e4.set(R.range(-tilt, tilt), R.range(0, TAU), R.range(-tilt, tilt)); q4.setFromEuler(e4);
      m4.compose(p4.set(x, y + up, z), q4, s4.set(size, size * R.range(0.9, 1.5), size));
      const sd = R(); if (nearBird(x, z) || dp < clear + size * 0.9) return;                       // (none hangs right beside the eye; tested after the draws, so no stream moves)
      const c = (dp < 8.6 ? crysN : crys)[chunkOf(s)]; for (let k = 0; k < 16; k++) c.M.push(m4.elements[k]); c.S.push(sd);
    };
    // (the clusters are dealt on the roof as the room alone leaves it, the lee's vault down, as the thatch is: every test that
    // decides whether a place is taken and every draw reads that roof, so the deal is one and the same whatever the lee does; a
    // crystal whose seat lies under the lee's vault then hangs from the raised roof)
    deal('chandeliers'); leeSet(false);
    const nClus = Math.round(125 * dens * detail * (season === 'early' ? 0.45 : 1));
    for (let i = 0, tries = 0; i < nClus && tries < 4000; tries++) {
      if ((tries & 31) === 31) await ctx.yield();
      let s, t; if (sr() < 0.45) [s, t] = hallST(); else { s = sr.range(S0 + 6, sLast - 30); t = sr.range(-30, 30); }
      const g = Gat(s, t); if (g < 4.6) continue;
      const R = sr.range(1.3, 3.0), depth = sr.range(0.5, 2.6) * (g > 12 ? 2.2 : 1), n = sr.int(6, 12); i++;
      for (let k = 0; k < n; k++) {
        const a = sr.range(0, TAU), r = R * Math.sqrt(sr()), s2 = s + Math.cos(a) * r, t2 = t + Math.sin(a) * r, g2 = Gat(s2, t2); if (g2 < 3.5) continue;
        toW(s2, t2); addCrystal(W_.x, Fat(s2, t2) + g2 - 0.1 - (1 - r / R) * depth * sr(), W_.z, sr.range(0.5, 1.05), s2, 0.6, sr, 4.7, samp(LIFT, s2, t2));
      }
    }
    leeSet(true);
    // a few clusters high on the walls of the strike gallery, clear of the roof the owl comes through
    deal('strike-crystals');
    for (let i = 0, tries = 0, n = Math.round(18 * dens * detail); i < n && tries < 600; tries++) {
      const s = sr.range(600, sLast + 34), t = sr.range(6.6, 9.7) * sr.sign(), g = Gat(s, t); toW(s, t);
      if (g < 5 || Math.hypot(W_.x, W_.z - HOLE_Z) < 17) continue;
      if ((i & 3) === 3) await ctx.yield();
      const R = sr.range(1.2, 2.4), depth = sr.range(1, 3.5), nc = sr.int(7, 12); i++;
      for (let k = 0; k < nc; k++) {
        const a = sr.range(0, TAU), r = R * Math.sqrt(sr()), s2 = s + Math.cos(a) * r, t2 = t + Math.sin(a) * r, g2 = Gat(s2, t2); if (g2 < 4) continue;
        toW(s2, t2); addCrystal(W_.x, Fat(s2, t2) + g2 - 0.1 - (1 - r / R) * depth * sr(), W_.z, sr.range(0.5, 1.05), s2);
      }
    }
    // the great chandelier hanging from the bent bough, 4 m over the eye in the hall
    const boughS = 197;
    deal('bough-chandelier');
    for (let k = 0; k < 44; k++) { const a = sr.range(0, TAU), r = 2.7 * Math.sqrt(sr()); toW(boughS + Math.cos(a) * r, Math.sin(a) * r); addCrystal(W_.x, 9.5 - (1 - r / 2.7) * 1.7 * sr() - 0.2 * sr(), W_.z, sr.range(0.6, 1.1), boughS, 0.35, sr, 0); }
    // the ice gallery: its whole vault hung with cup crystals, close set, the larger ones toward the walls and in hanging bunches
    deal('vault-crystals');
    for (const rm of ROOMS) { if (!rm.crystals) continue;
      for (let i = 0, n = Math.round(rm.crystals * detail); i < n; i++) {
        const a = sr.range(0, TAU), r = rm.R * Math.sqrt(sr()) * 0.98, s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r, g = Gat(s, t), size = (0.62 + 0.45 * (sr.range(1.0, 2.5) - 1) / 1.5) * (0.75 + 0.25 * r / rm.R), drop = sr() * sr() * 2.5;
        if (g < 4) continue;
        toW(s, t); addCrystal(W_.x, Fat(s, t) + g - 0.1 - drop, W_.z, size, s, 0.5);
        if ((i & 63) === 63) await ctx.yield();
      }
      for (let i = 0, n = Math.round(rm.crystals * 0.6 * detail); i < n; i++) {
        const a = sr.range(0, TAU), r = rm.R * Math.sqrt(sr()) * 0.98, s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r, g = Gat(s, t), size = sr.range(0.42, 0.95), drop = sr() * sr() * sr() * 4.5;
        if (g < 4) continue;
        toW(s, t); addCrystal(W_.x, Fat(s, t) + g - 0.1 - drop, W_.z, size, s, 0.5, sr);
        if ((i & 63) === 63) await ctx.yield();
      } }
    // icicles over the meltwater (the same stepped crystal, drawn out and hung point down)
    deal('icicles');
    for (let i = 0; i < 90; i++) {
      const s = sr.range(302, 356), t = sr.range(-11, 11), g = Gat(s, t), len = sr.range(1.2, 3.6), sd = sr();
      if (g < 5) continue;
      toW(s, t); const yTop = Fat(s, t) + g + 0.1;
      if (path.distanceTo(W_.x, yTop - len, W_.z) < 3.8) continue;
      m4.compose(p4.set(W_.x, yTop - len, W_.z), q4.identity(), s4.set(len * 0.3, -len / 0.84, len * 0.3));
      const c = crys[chunkOf(s)]; for (let k = 0; k < 16; k++) c.M.push(m4.elements[k]); c.S.push(sd + 2);
    }
    // by night a ring of cup crystals has grown round each window of clear ice, with chains of them hanging from it into the moonbeam
    deal('lens-crystals');
    if (lookId === 'night') for (const [ls, lt, lR] of [[335.5, -1, 3.6], [403.5, -3.4, 2.4]]) {
      for (let i = 0; i < 26; i++) {
        const a = i / 26 * TAU + sr.range(-0.1, 0.1), r = lR + sr.range(0, 1.2), s = ls + Math.cos(a) * r, t = lt + Math.sin(a) * r, g = Gat(s, t), chain = sr() < 0.3 ? sr.int(2, 4) : 1;
        if (g < 4) continue;
        toW(s, t); const cx = W_.x, cz = W_.z, top = Fat(s, t) + g - 0.15;
        for (let k = 0; k < chain; k++) addCrystal(cx + sr.range(-0.1, 0.1) * k, top - k * 0.62, cz + sr.range(-0.1, 0.1) * k, sr.range(0.45, 0.8) * (1 - 0.12 * k), s, 0.5, sr, 3.4);
      }
    }
    await ctx.yield();
    // chains of cup crystals hang over the way, one for every 12 to 18 m of it, to one side or the other, by a stream of their own. A
    // chain's seat is dealt at any side distance from the route's line out to where the roof comes down (read column by column of the
    // height field) to the chain's own length (roof to the point its lowest cup hangs by) plus CHAIN_CLEAR over the floor, and the chain
    // hangs wherever the roof over its seat stands at least that high; path.isClear keeps every crystal off the route
    // CHAIN_CLEAR, in metres: the lowest cup hangs clear of the back of a vole on the floor under it (the design's height of a vole at the back)
    // (dealt, like the clusters, on the roof as the room alone leaves it: the roof's heights it reads, the tests and the draws are
    // those; a chain whose seat lies under the lee's vault then hangs from the raised roof)
    leeSet(false);
    { const R = stream('chains'), CHAIN_CLEAR = 4;
      for (let cs = 20 + R.range(0, 12); cs < sLast - 60; cs += R.range(12, 18)) {
        const sd = R.sign(), n = R.int(4, 7), need = 0.1 + (n - 1) * 0.55 + 0.1 * (n - 1) * (n - 1) / n + CHAIN_CLEAR;
        let qOut = 0; while (qOut < NQ && Gat(cs, sd * tOf(qOut + 1)) >= need) qOut++;
        const ct = sd * R.range(0, tOf(qOut)), g = Gat(cs, ct);
        if (g < need) continue;
        toW(cs, ct); const cx = W_.x, cz = W_.z, top = Fat(cs, ct) + g - 0.1;
        for (let k = 0; k < n; k++) {
          const size = R.range(0.5, 0.75) * (1 - 0.08 * k), x = cx + R.range(-0.12, 0.12) * k, y = top - k * 0.55 - 0.1 * k * k / n, z = cz + R.range(-0.12, 0.12) * k;
          if (path.isClear(x, y - size * 0.5, z, size * 0.9, 3.3)) addCrystal(x, y, z, size, cs, 0.45, R, 3.3, samp(LIFT, cs, ct));
        }
      }
    }
    leeSet(true);
    await ctx.yield();
    const crysMat = mk(U, { vs: CRYS_VS, fs: CRYS_FS, uniforms: { uSparkCol: { value: col(LK.spark, 2.5) }, uSpark: { value: season === 'early' ? 0.8 : 1 } } });
    for (let ci = 0; ci < 2 * NCH; ci++) {
      const fine = ci >= NCH, c = (fine ? crysN : crys)[ci % NCH], n = c.S.length; if (!n) continue;
      const geo = crystalGeo(fine); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(c.S), 1));
      const im = new THREE.InstancedMesh(geo, crysMat, n); im.instanceMatrix.array.set(c.M); im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere(); im.matrixAutoUpdate = false; scene.add(im); chunks[ci % NCH].det.push(im);
      await ctx.yield();
    }
    await ctx.yield();

    // ---- plants. Instanced per chunk; one shader for all.
    const uBirch = { value: new THREE.Vector2(0, 1e4) };
    const plantMat = mk(U, { vs: PLANT_VS, fs: PLANT_FS, uniforms: { uBirch } });
    const instOne = (geo, M, c) => {
      if (!M.length) return;
      const im = new THREE.InstancedMesh(geo, plantMat, M.length / 16); im.instanceMatrix.array.set(M); im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere(); im.matrixAutoUpdate = false; scene.add(im); chunks[c].det.push(im);
    };
    const instChunks = (geo, lists) => lists.forEach((M, c) => instOne(geo, M, c));
    const pushM = (list, x, y, z, yaw, sc, tiltX = 0, tiltZ = 0) => { e4.set(tiltX, yaw, tiltZ); q4.setFromEuler(e4); m4.compose(p4.set(x, y, z), q4, s4.set(sc, sc, sc)); for (let k = 0; k < 16; k++) list.push(m4.elements[k]); };

    // lingonberry: an arching stem, leathery oval leaves, three berries with a frost cap
    const sprigGeo = (() => {
      const g = new Soup(), stemC = lin('#6e4332'), leafA = lin('#2a5226'), leafB = lin('#55803a'), berryC = lin('#C21F2E');
      const spine = []; for (let i = 0; i <= 7; i++) { const t = i / 7; spine.push(new V3(Math.sin(t * 1.5) * 2.0, t * 6.5 - t * t * 1.0, Math.sin(t * 2.6) * 0.5)); }
      const at = (t, o) => { const f = clamp(t, 0, 0.999) * 7, i = Math.floor(f); return o.copy(spine[i]).lerp(spine[i + 1], f - i); };
      g.tube(spine, (t) => 0.13 - 0.07 * t, 5, () => stemC, (t) => [0, t * t, 0, 0], false);
      const b = new V3(), ax = new V3(), sd = new V3(), nn = new V3(), UPV = new V3(0, 1, 0), p = new V3(), ST = [0, 0.3, 0.68, 1], WD = [0.12, 0.8, 0.7, 0.04];
      for (let i = 0; i < 10; i++) {
        const t = 0.2 + i * 0.082, ph = i * 2.4 + 0.5; at(t, b);
        ax.set(Math.cos(ph), 0.4, Math.sin(ph)).normalize(); sd.crossVectors(ax, UPV).normalize(); nn.crossVectors(sd, ax);
        const len = 1.5 * (1 - 0.25 * t) * (0.85 + 0.3 * ((i * 0.37) % 1)), colr = mixc(leafA, leafB, (i * 0.61) % 1), hh = (i * 0.173) % 1, rows = [];
        for (let k = 0; k < 4; k++) {
          const v = ST[k], w = WD[k] * len * 0.5, row = [];
          for (const x of [-1, 0, 1]) { p.copy(b).addScaledVector(ax, 0.1 + v * len).addScaledVector(sd, x * w).addScaledVector(nn, (x === 0 ? -0.1 : 0.04) * w * 2 - 0.3 * v * v); row.push(g.v(p.x, p.y, p.z, colr, [1, t * t, x * (k === 0 || k === 3 ? 0.3 : 1), hh])); }
          rows.push(row);
        }
        g.loft(rows, false);
      }
      for (let i = 0; i < 3; i++) {
        at(0.8 + i * 0.07, b); const c = b.clone().add(new V3(Math.cos(i * 2.1 + 1) * 0.55, -0.6 - 0.15 * i, Math.sin(i * 2.1 + 1) * 0.55));
        g.tube([b.clone(), b.clone().lerp(c, 0.5).add(new V3(0, 0.12, 0)), c.clone().add(new V3(0, 0.36, 0))], () => 0.035, 3, () => stemC, () => [0, 0.8, 0, 0], false);
        g.ball(c, 0.42, 0.4, 0.42, 8, 5, () => berryC, [2, 0.8, 0, 0]);
      }
      return g.build();
    })();
    const sprigs = Array.from({ length: NCH }, () => []), dumpL = [];          // dumpL: sprigs that would stand within the ptarmigan's clear radius
    // every sprig keeps its whole body (stem, leaves, berries) more than 2.0 m from the eye's line, by place: 2.3 m is asked of every
    // point of it, against the line laid out every quarter metre. A sprig that would reach nearer is made smaller where it stands,
    // by steps of 0.85, until it clears (its foot stands 2.9 m and more to the side of the line, so it always does); nothing is
    // drawn for it from any stream, so every other sprig and every other thing of the deal stands as without this rule
    const lineCell = new Map();
    { const pv = new V3(); for (let d = 0; d <= L; d += 0.25) { path.posAtDist(d, pv); const k = Math.floor(pv.x / 6) * 4096 + Math.floor(pv.z / 6); let a = lineCell.get(k); if (!a) lineCell.set(k, a = []); a.push(pv.x, pv.y, pv.z); } }
    // (the square of the distance from a point to the eye's line; 1e9 where the line is more than 6 m off)
    const lineDist2 = (x, y, z) => {
      let b = 1e9; const ci = Math.floor(x / 6), ck = Math.floor(z / 6);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = lineCell.get((ci + i) * 4096 + ck + j); if (!a) continue;
        for (let n = 0; n < a.length; n += 3) { const dx = a[n] - x, dy = a[n + 1] - y, dz = a[n + 2] - z, dd = dx * dx + dy * dy + dz * dz; if (dd < b) b = dd; } }
      return b;
    };
    const sprigP = sprigGeo.attributes.position.array; let sprigR = 0; for (let i = 0; i < sprigP.length; i += 3) sprigR = Math.max(sprigR, Math.hypot(sprigP[i], sprigP[i + 1], sprigP[i + 2]));
    // the size at which a sprig of size sc, standing at (x, y, z) turned and tilted so, clears the eye's line (path.distanceTo measures to
    // the path's sampled points, 2.33 m apart: 1.2 m is taken off it before a sprig is passed without its points being measured)
    const sprigFit = (x, y, z, yaw, sc, tiltX, tiltZ) => {
      if (path.distanceTo(x, y, z) - 1.2 > 2.3 + sprigR * sc) return sc;
      e4.set(tiltX, yaw, tiltZ); q4.setFromEuler(e4);
      for (; sc > 0.05; sc *= 0.85) {
        m4.compose(p4.set(x, y, z), q4, s4.set(sc, sc, sc)); const e = m4.elements; let ok = true;
        for (let i = 0; i < sprigP.length && ok; i += 3) { const a = sprigP[i], b = sprigP[i + 1], c = sprigP[i + 2]; ok = lineDist2(e[0] * a + e[4] * b + e[8] * c + e[12], e[1] * a + e[5] * b + e[9] * c + e[13], e[2] * a + e[6] * b + e[10] * c + e[14]) > 2.3 * 2.3; }
        if (ok) break;
      }
      return sc;
    };
    const pushSprig = (list, x, y, z, yaw, sc, tiltX, tiltZ) => pushM(list, x, y, z, yaw, sprigFit(x, y, z, yaw, sc, tiltX, tiltZ), tiltX, tiltZ);
    deal('sprigs');
    const nSprig = Math.round(140 * dens * (0.7 + 0.3 * detail));
    for (let i = 0, tries = 0; i < nSprig && tries < 20000; tries++) {
      if ((tries & 127) === 127) await ctx.yield();
      let s, t; const inH = sr() < 0.5; if (inH) [s, t] = hallST(); else { s = sr.range(S0 + 8, sLast - 20); t = sr.range(3.0, 9) * sr.sign(); }
      const g = Gat(s, t), at_ = Math.abs(t); if (g < 2.6 || at_ < 3.0 || Fat(s, t) < -0.45) continue;
      let sc = clamp((g - 0.9) / 6.2, 0.4, 1.25) * sr.range(0.8, 1); if (ermDist(s, t) < 7 || stage(s, t) || Math.abs(t - voleT(s)) < 3.2) sc = Math.min(sc, 0.3);    // only low sprigs where the ermine and the vole run
      if (at_ < 3.0 + 2.6 * sc && sc > 0.55) continue;
      fr(s); const ox = -F_.tz * Math.sign(t), oz = F_.tx * Math.sign(t);
      const yaw = (at_ > 9 ? sr.range(0, TAU) : Math.atan2(-oz, ox) + sr.range(-0.7, 0.7));
      toW(s, t); pushSprig(nearBird(W_.x, W_.z) ? dumpL : sprigs[chunkOf(s)], W_.x, Fat(s, t) - 0.1, W_.z, yaw, sc, sr.range(-0.12, 0.12), sr.range(-0.12, 0.12)); i++;
    }
    deal('strike-sprigs');
    for (let i = 0, tries = 0, n = Math.round(7 * dens); i < n && tries < 400; tries++) {               // a few against the walls of the strike gallery
      const s = sr.range(gS0 + 10, gS1 - 4), t = sr.range(6.6, 9.3) * sr.sign(), g = Gat(s, t); toW(s, t);
      if (g < 3 || Math.hypot(W_.x, W_.z) < 17) continue;
      pushSprig(sprigs[chunkOf(s)], W_.x, Fat(s, t) - 0.1, W_.z, sr.range(0, TAU), clamp((g - 0.9) / 6.2, 0.45, 1.1) * sr.range(0.75, 1), sr.range(-0.12, 0.12), sr.range(-0.12, 0.12)); i++;
    }
    deal('room-sprigs');
    for (const rm of ROOMS) { if (!rm.sprigs) continue;                                                   // each chamber's own thicket
      for (let i = 0, tries = 0, n = Math.round(rm.sprigs * (0.7 + 0.3 * detail)); i < n && tries < 900; tries++) {
        const a = sr.range(0, TAU), r = rm.R * sr.range(0.3, 0.96), s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r, g = Gat(s, t); let sc = clamp((g - 0.9) / 5.2, 0.4, 1.3) * sr.range(0.75, 1);
        if (ermDist(s, t) < 7 || stage(s, t) || Math.abs(t - voleT(s)) < 3.2) sc = Math.min(sc, 0.3);
        if (g < 2.2 || Math.abs(t) < 3.2 + 1.6 * sc || Fat(s, t) < -0.45 || Math.hypot(s - 104, t - 7.6) < 4.5) continue;
        toW(s, t); if (nearBird(W_.x, W_.z)) continue; pushSprig(sprigs[chunkOf(s)], W_.x, Fat(s, t) - 0.1, W_.z, sr.range(0, TAU), sc, sr.range(-0.12, 0.12), sr.range(-0.12, 0.12)); i++;
      } }
    // a low sprig or two of lingonberry at every foot beside the way
    deal('foot-sprigs');
    dress(sr, 0.32, (s, t, R) => { pushSprig(sprigs[chunkOf(s)], W_.x, Fat(s, t) - 0.1, W_.z, R.range(0, TAU), R.range(0.22, 0.36), R.range(-0.14, 0.14), R.range(-0.14, 0.14)); });
    await ctx.yield();
    instChunks(sprigGeo, sprigs);
    await ctx.yield();

    // feather moss: tufts of arching fronds carpeting the floor, thickest beside the path
    const mossGeo = (() => {
      const g = new Soup(), c0 = lin(LK.wet ? '#1d4016' : season01 ? '#22381a' : '#1c2e18'), c1 = lin(LK.wet ? '#668c2c' : season01 ? '#5d7a30' : '#4f6030');
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + (i % 2) * 0.4, len = 0.8 + 0.55 * ((i * 0.41) % 1), dxm = Math.cos(a), dzm = Math.sin(a), rows = [], w = 0.3 + 0.08 * ((i * 0.63) % 1);
        for (let k = 0; k < 3; k++) { const v = k / 2, r = v * len * 0.8, y = Math.sin(v * 2.2) * len * 0.42;
          rows.push([g.v(dxm * r - dzm * w, y, dzm * r + dxm * w, mixc(c0, c1, v), [3, v * v, v, -1]), g.v(dxm * r + dzm * w, y, dzm * r - dxm * w, mixc(c0, c1, v), [3, v * v, v, 1])]); }
        g.loft(rows, false);
      }
      // every frond takes most of its light as the cushion does (from above), so a tuft shades as one soft thing, not as tilted plates
      const geo = g.build(), nn = geo.attributes.normal;
      for (let i = 0; i < nn.count; i++) { let x = nn.getX(i) * 0.4, y = nn.getY(i) * 0.4 + 0.75, z = nn.getZ(i) * 0.4; const l = Math.hypot(x, y, z) || 1; nn.setXYZ(i, x / l, y / l, z / l); }
      return geo;
    })();
    const moss = Array.from({ length: NCH }, () => []);
    deal('moss');
    const nMoss = Math.round(2600 * detail * dens);
    for (let i = 0, tries = 0; i < nMoss && tries < 30000; tries++) {
      if ((tries & 255) === 255) await ctx.yield();
      let s, t; const m = sr(); if (m < 0.2) [s, t] = hallST(); else { s = sr.range(S0 + 4, SG1 - 10); t = sr.gauss() * 3.2; }
      if (Gat(s, t) < 1.4 || Math.abs(t) > 42) continue;
      toW(s, t); pushM(moss[chunkOf(s)], W_.x, Fat(s, t) - 0.03, W_.z, sr.range(0, TAU), sr.range(0.32, 0.8), sr.range(-0.2, 0.2), sr.range(-0.2, 0.2)); i++;
    }
    deal('room-moss');
    for (const rm of ROOMS) { if (!rm.moss) continue; const deep = rm.moss > 300 ? 1.45 : 1.0;             // and its own moss, in cushions out to the walls
      for (let i = 0, n = Math.round(rm.moss * detail); i < n; i++) {
        const a = sr.range(0, TAU), r = rm.R * Math.sqrt(sr()), s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r;
        if (Gat(s, t) < 1.4 || Fat(s, t) < -0.5) continue;
        toW(s, t); pushM(moss[chunkOf(s)], W_.x, Fat(s, t) - 0.03, W_.z, sr.range(0, TAU), sr.range(0.45, 1.0) * deep, sr.range(-0.2, 0.2), sr.range(-0.2, 0.2));
      } await ctx.yield(); }
    deal('strike-moss');
    for (let i = 0, n = Math.round(760 * detail * dens); i < n; i++) {
      const s = sr.range(gS0, gS1), t = gT(); if (Gat(s, t) < 1.4) continue;
      toW(s, t); pushM(moss[chunkOf(s)], W_.x, Fat(s, t) - 0.03, W_.z, sr.range(0, TAU), sr.range(0.36, 0.9), sr.range(-0.2, 0.2), sr.range(-0.2, 0.2));
      if ((i & 255) === 255) await ctx.yield();
    }
    deal('near-moss');
    for (let i = 0, n = Math.round(1300 * detail); i < n; i++) {                                           // small tufts right under the eye, along the whole run
      const s = sr.range(S0 + 4, SG1 - 10), t = sr.gauss() * 2.4, sc = sr.range(0.26, 0.5), yw = sr.range(0, TAU), tx = sr.range(-0.2, 0.2), tz = sr.range(-0.2, 0.2);
      if ((i & 255) === 255) await ctx.yield();
      if (Gat(s, t) < 1.4 || Fat(s, t) < -0.5) continue;
      toW(s, t); pushM(moss[chunkOf(s)], W_.x, Fat(s, t) - 0.02, W_.z, yw, sc, tx, tz);
    }
    // tufts of moss at every foot beside the way
    deal('foot-moss');
    dress(sr, 1.3, (s, t, R) => { pushM(moss[chunkOf(s)], W_.x, Fat(s, t) - 0.03, W_.z, R.range(0, TAU), R.range(0.4, 0.85), R.range(-0.2, 0.2), R.range(-0.2, 0.2)); });
    await ctx.yield();
    // by the grotto and the boulder: moss climbs the walls in cushions, each a handful of large tufts set square to the snow (the wall
    // itself is green under them: ROOF_FS)
    { const R = stream('way-moss'), UPV = new V3(0, 1, 0), nv = new V3(), qy = new THREE.Quaternion(), q = new Float32Array(28);
      for (let s = 354; s < 446; s += 0.7) {
        const side = R.sign(), gT = 0.5 + 3.6 * R() * R(), nt = R.int(4, 7), keep = R(), ps = s + 0.7 * R(), pt = wallAt(ps, side, gT);
        for (let k = 0; k < 28; k++) q[k] = R();
        if (!(pt === pt) || Math.abs(pt) < 3.2 || Math.abs(pt) > 40 || keep > span(354, 446, ps, 6)) continue;
        for (let k = 0; k < nt; k++) {
          const o = k * 4, s2 = ps + (q[o] - 0.5) * 1.5, t2 = pt + (q[o + 1] - 0.5) * 1.0;
          sampAll(s2, t2); if (SA.g < 0.15 || SA.g > 5) continue;
          toW(s2, t2); const ux = F_.tx * SA.gs - F_.tz * SA.gt, uz = F_.tz * SA.gs + F_.tx * SA.gt, nl = Math.sqrt(ux * ux + 1 + uz * uz), sc = 1.0 + 0.9 * q[o + 3];
          nv.set(ux / nl, -1 / nl, uz / nl); p4.set(W_.x, SA.f + SA.g, W_.z);
          // (clear of the eye's line, of the line's middle by place and of the vole's run, each by its own reach; off the run by
          // half the animal's width besides)
          if (!path.isClear(p4.x, p4.y, p4.z, 1.6 * sc, 2.5) || Math.abs(t2) < 2.5 + 1.15 * sc || Math.abs(t2 - voleT(s2)) < VOLE_HALF + 1.15 * sc) continue;
          q4.setFromUnitVectors(UPV, nv); qy.setFromAxisAngle(UPV, q[o + 2] * TAU); q4.multiply(qy); m4.compose(p4, q4, s4.set(sc, sc, sc));
          const list = moss[chunkOf(s2)]; for (let e = 0; e < 16; e++) list.push(m4.elements[e]);
        }
      }
    }
    await ctx.yield();
    for (let c = 0; c < moss.length; c++) { instOne(mossGeo, moss[c], c); if ((c & 3) === 3) await ctx.yield(); }
    await ctx.yield();

    // russet birch leaves and winged seeds frozen into the floor
    const leaves = mkAcc();
    deal('leaves');
    const nLeaf = Math.round(2400 * detail);
    for (let i = 0, tries = 0; i < nLeaf && tries < 40000; tries++) {
      if ((tries & 255) === 255) await ctx.yield();
      let s, t; if (sr() < 0.15) [s, t] = hallST(); else { s = sr.range(S0 + 4, SG1 - 10); t = sr.gauss() * 3.4; }
      if (Gat(s, t) < 1.0 || Math.abs(t) > 42) continue;
      toW(s, t); const a = leaves[chunkOf(s)], b0 = a.P.length / 3, y = Fat(s, t) + 0.05 + sr() * 0.07, ang = sr.range(0, TAU), isSeed = sr() < 0.22, r = isSeed ? sr.range(0.25, 0.4) : sr.range(0.4, 0.62), h = sr();
      const cA = Math.cos(ang) * r, sA = Math.sin(ang) * r, tl = sr.range(-0.12, 0.12);
      a.P.push(W_.x - cA + sA, y - tl, W_.z - sA - cA, W_.x + cA + sA, y + tl, W_.z + sA - cA, W_.x + cA - sA, y + tl, W_.z + sA + cA, W_.x - cA - sA, y - tl, W_.z - sA + cA);
      for (let q = 0; q < 4; q++) { a.N.push(0, 1, 0); a.R.push(h, isSeed ? 1 : 0.3); }
      a.UV.push(-1, -1, 1, -1, 1, 1, -1, 1); a.I.push(b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2); i++;
    }
    deal('strike-leaves');
    for (let i = 0, n = Math.round(620 * detail); i < n; i++) {
      const s = sr.range(gS0, gS1), t = gT(); if (Gat(s, t) < 1.0) continue;
      toW(s, t); const a = leaves[chunkOf(s)], b0 = a.P.length / 3, y = Fat(s, t) + 0.05 + sr() * 0.07, ang = sr.range(0, TAU), isSeed = sr() < 0.22, r = isSeed ? sr.range(0.25, 0.4) : sr.range(0.4, 0.62), h = sr();
      const cA = Math.cos(ang) * r, sA = Math.sin(ang) * r, tl = sr.range(-0.12, 0.12);
      a.P.push(W_.x - cA + sA, y - tl, W_.z - sA - cA, W_.x + cA + sA, y + tl, W_.z + sA - cA, W_.x + cA - sA, y + tl, W_.z + sA + cA, W_.x - cA - sA, y - tl, W_.z - sA + cA);
      for (let q = 0; q < 4; q++) { a.N.push(0, 1, 0); a.R.push(h, isSeed ? 1 : 0.3); }
      a.UV.push(-1, -1, 1, -1, 1, 1, -1, 1); a.I.push(b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2);
    }
    // the root cellar: last autumn's birch leaves drifted against the roots, and the winged seeds of the cache
    deal('cellar-leaves');
    for (let i = 0; i < 230; i++) {
      const cache = i < 60, a0 = sr.range(0, TAU), r0 = cache ? 3.2 * Math.sqrt(sr()) : 12 * Math.sqrt(sr()), s = (cache ? 104 : 99) + Math.cos(a0) * r0, t = (cache ? 7.6 : 10) + Math.sin(a0) * r0;
      const ang = sr.range(0, TAU), isSeed = cache || sr() < 0.2, r = isSeed ? sr.range(0.3, 0.46) : sr.range(0.45, 0.7), h = sr(), tl = sr.range(-0.14, 0.14), lift = sr();
      if (Gat(s, t) < 1.0) continue;
      toW(s, t); const a = leaves[chunkOf(s)], b0 = a.P.length / 3, y = Fat(s, t) + 0.06 + lift * (cache ? 0.5 : 0.1), cA = Math.cos(ang) * r, sA = Math.sin(ang) * r;
      a.P.push(W_.x - cA + sA, y - tl, W_.z - sA - cA, W_.x + cA + sA, y + tl, W_.z + sA - cA, W_.x + cA - sA, y + tl, W_.z + sA + cA, W_.x - cA - sA, y - tl, W_.z - sA + cA);
      for (let q = 0; q < 4; q++) { a.N.push(0, 1, 0); a.R.push(h, isSeed ? 1 : 0.3); }
      a.UV.push(-1, -1, 1, -1, 1, 1, -1, 1); a.I.push(b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2);
    }
    // and leaves drifted against every foot beside the way
    deal('foot-leaves');
    dress(sr, 1.6, (s, t, R) => {
      const a = leaves[chunkOf(s)], b0 = a.P.length / 3, y = Fat(s, t) + 0.05 + R() * 0.1, ang = R.range(0, TAU), isSeed = R() < 0.2, r = isSeed ? R.range(0.25, 0.4) : R.range(0.4, 0.62), h = R(), tl = R.range(-0.14, 0.14);
      const cA = Math.cos(ang) * r, sA = Math.sin(ang) * r;
      a.P.push(W_.x - cA + sA, y - tl, W_.z - sA - cA, W_.x + cA + sA, y + tl, W_.z + sA - cA, W_.x + cA - sA, y + tl, W_.z + sA + cA, W_.x - cA - sA, y - tl, W_.z - sA + cA);
      for (let q = 0; q < 4; q++) { a.N.push(0, 1, 0); a.R.push(h, isSeed ? 1 : 0.3); }
      a.UV.push(-1, -1, 1, -1, 1, 1, -1, 1); a.I.push(b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2);
    });
    await ctx.yield();
    // by the ptarmigan's burrow and along the way to it: its down, caught on the floor (kind 4 of LEAF_FS). A feather keeps clear of
    // the eye's line, the vole's run and the ermine's
    const wayQuad = (s, t, kind, r, ang, tl, roll, h, lift) => {
      if (Math.abs(t) < 2.6 + r || Gat(s, t) < 1.0 || Fat(s, t) < -0.45 || Math.abs(t - voleT(s)) < 1.2 + r || ermDist(s, t) < 3.5 || inSolid(s, t)) return;
      toW(s, t);
      const y = Fat(s, t) + 0.07 + lift; if (!path.isClear(W_.x, y, W_.z, r * 1.42, 2.5)) return;
      const a = leaves[chunkOf(s)], b0 = a.P.length / 3, cA = Math.cos(ang) * r, sA = Math.sin(ang) * r;
      a.P.push(W_.x - cA + sA, y - tl - roll, W_.z - sA - cA, W_.x + cA + sA, y + tl - roll, W_.z + sA - cA, W_.x + cA - sA, y + tl + roll, W_.z + sA + cA, W_.x - cA - sA, y - tl + roll, W_.z - sA + cA);
      for (let q = 0; q < 4; q++) { a.N.push(0, 1, 0); a.R.push(h, kind); }
      a.UV.push(-1, -1, 1, -1, 1, 1, -1, 1); a.I.push(b0, b0 + 2, b0 + 1, b0, b0 + 3, b0 + 2);
    };
    // (past 566 m only the feathers along the way are laid, fewer with every metre, the last at 606 m: blown on down the gallery)
    { const R = stream('way-down');
      for (let s = 500; s < 606; s += 0.4) {
        const a = R.range(0, TAU), rr = 12 + 15 * Math.sqrt(R()), r = R.range(0.3, 0.6), ang = R.range(0, TAU), tl = R.range(-0.25, 0.3), roll = R.range(-0.2, 0.2), h = R(), wide = R() < 0.35, tw = R.gauss() * 4.5, ps = s + 0.4 * R();
        if (s >= 566 && (!wide || h > 1 - (ps - 566) / 40)) continue;
        if (wide) wayQuad(ps, tw, 4, r, ang, tl * r, roll * r, h, 0.25 * r);
        else wayQuad(birdAt.s + Math.cos(a) * rr, birdAt.t + Math.sin(a) * rr, 4, r, ang, tl * r, roll * r, h, 0.25 * r);
      }
    }
    await accMeshes(leaves, mk(U, { vs: LEAF_VS, fs: LEAF_FS }));
    await ctx.yield();

    // ---- the hall: willow stems piercing the pack, the snow-bent bough with catkin buds, reindeer lichen
    const hallG = new Soup();
    const barkA = lin('#4c3a2c'), barkB = lin('#7a644c'), budC = lin('#a9b3b8'), twigC = lin('#4a3324');
    deal('stems');
    const stemTop = [], stem0 = [];
    STEMS.forEach(([s, t], si) => {
      toW(s, t); const bx = W_.x, bz = W_.z, by = Fat(s, t) - 0.6;
      const ls = s + sr.range(-3, 3), lt = t + (si === 0 ? sr.range(2.5, 4.5) : sr.range(-4, 4)); toW(ls, lt);
      const topY = Fat(ls, lt) + Math.max(Gat(ls, lt), 6) + 2.5, tx = W_.x, tz = W_.z, sp = [];
      for (let i = 0; i <= 10; i++) { const v = i / 10, e = v * v * (1.6 - 0.6 * v); sp.push(new V3(lerp(bx, tx, e) + Math.sin(v * 5 + si) * 0.25, lerp(by, topY, v), lerp(bz, tz, e) + Math.cos(v * 4 + si * 2) * 0.25)); }
      hallG.tube(sp, (v) => 0.66 - 0.2 * v + 0.45 * Math.exp(-v * 7) + 0.05 * Math.sin(v * 31 + si) + 0.04 * Math.sin(v * 73), 12, (v, a) => mixc(barkA, barkB, 0.5 + 0.5 * Math.sin(a * 3 + v * 9 + si)), (v) => [6, 0, Math.max(v, 0.002), si * 0.2], false);
      stemTop.push([tx, tz]); if (si === 0) stem0.push(...sp);
      for (let k = 0; k < 5; k++) {                                   // side twigs with buds
        const v = sr.range(0.3, 0.8), b = sp[Math.round(v * 10)], a = sr.range(0, TAU), tip = b.clone().add(new V3(Math.cos(a) * 1.5, sr.range(0.6, 1.4), Math.sin(a) * 1.5));
        if (path.distanceTo(tip.x, tip.y, tip.z) < 5) continue;
        hallG.tube([b.clone(), b.clone().lerp(tip, 0.55).add(new V3(0, 0.25, 0)), tip], (q) => 0.1 - 0.05 * q, 4, () => twigC, () => [0, 0.5, 0, 0], false);
        hallG.ball(tip.clone().add(new V3(0, 0.45, 0)), 0.26, 0.62, 0.26, 6, 4, () => budC, [5, 0.6, 0, 0]);
      }
    });
    await ctx.yield();
    deal('bough');
    { // the bent bough: off the first stem, over the path, down to the floor on the far side
      const P = (s, t, y) => { toW(s, t); return new V3(W_.x, y, W_.z); };
      const cv = new THREE.CatmullRomCurve3([stem0[7].clone(), P(198.5, 4, 12.0), P(boughS, 0, 10.5), P(195, -5, 8.0), P(193, -10, 3.8), P(191.5, -13.5, 0.1)]);
      const bp = cv.getPoints(18);
      hallG.tube(bp, (v) => 0.4 - 0.2 * v, 8, (v, a) => mixc(barkA, barkB, 0.5 + 0.5 * Math.sin(a * 3 + v * 14)), () => [6, 0, 0, 0.9]);
      for (let k = 1; k < 17; k++) {
        const b = bp[k], sdn = k % 2 ? 1 : -1, tip = b.clone().add(new V3(sr.range(-0.5, 0.5), sr.range(0.5, 1.0), sdn * sr.range(0.3, 0.9)));
        hallG.tube([b.clone(), tip], () => 0.06, 4, () => twigC, () => [0, 0.4, 0, 0], false);
        hallG.ball(tip.clone().add(new V3(0, 0.4, 0)), 0.24, 0.6, 0.24, 6, 4, () => budC, [5, 0.5, 0, 0]);
      }
    }
    await ctx.yield();
    // reindeer lichen: pale coral bushes on the mounds
    const lichA = lin('#6c7c70'), lichB = lin('#d4dfcd');
    let growG = hallG;
    const grow = (p, dir, len, r, depth) => {
      const e = p.clone().addScaledVector(dir, len), mid = p.clone().lerp(e, 0.5).add(new V3(sr.range(-1, 1), sr.range(-0.4, 0.4), sr.range(-1, 1)).multiplyScalar(len * 0.14));
      growG.tube([p, mid, e], (v) => r * (1 - 0.3 * v), 3, (v) => mixc(lichA, lichB, clamp((3 - depth + v) / 3.6, 0, 1)), () => [4, (3 - depth) * 0.12, 0, 0], depth === 0);
      if (depth === 0) return;
      const n = depth === 3 ? 3 : sr.int(2, 3);
      for (let i = 0; i < n; i++) { const d2 = dir.clone().add(new V3(sr.range(-1, 1), sr.range(-0.15, 0.5), sr.range(-1, 1)).multiplyScalar(0.85)).normalize(); grow(e, d2, len * 0.66, r * 0.62, depth - 1); }
    };
    deal('hall-lichen');
    const nLich = Math.round(22 * (0.7 + 0.3 * detail));
    for (let i = 0, tries = 0; i < nLich && tries < 2000; tries++) {
      if ((tries & 3) === 3) await ctx.yield();
      let s, t; if (sr() < 0.8) [s, t] = hallST(); else { s = sr.pick([350, 452, 545]) + sr.range(-8, 8); t = sr.range(4.5, 7) * sr.sign(); }
      const g = Gat(s, t); if (g < 5.5 || Math.abs(t) < 6.5 + (g < 9 ? -2 : 2) || ermDist(s, t) < 6) continue;
      toW(s, t); const sz = Math.min(sr.range(1.5, 2.0), (g - 1) / 2.6);
      grow(new V3(W_.x, Fat(s, t) - 0.2, W_.z), new V3(sr.range(-0.2, 0.2), 1, sr.range(-0.2, 0.2)).normalize(), sz, sz * 0.13, 3); i++;
    }
    await ctx.yield();
    { const mesh = new THREE.Mesh(hallG.build(), plantMat); mesh.geometry.computeBoundingSphere(); mesh.matrixAutoUpdate = false; scene.add(mesh); }
    await ctx.yield();

    // =====================================================================================================
    // THE CHAMBERS: what stands in each of the places the runway opens into
    // =====================================================================================================
    const P3 = (s, t, y) => { toW(s, t); return new V3(W_.x, y, W_.z); };
    const addStatic = (g, s, mat = plantMat) => { const mesh = new THREE.Mesh(g.build(), mat); mesh.geometry.computeBoundingSphere(); mesh.matrixAutoUpdate = false; scene.add(mesh); chunks[chunkOf(s)].det.push(mesh); return mesh; };
    const berryC = lin('#C21F2E'), W1 = [1, 1, 1];

    // ---- buried willow: where a thicket lies under the drift its twigs hold the vault up. A lattice of them hugs the roof of three
    // rooms, and side twigs with catkin buds hang from it into the air below
    deal('willow-lattice');
    for (const id of ['melt2', 'grotto', 'rockAnte']) {
      const rm = RM[id], g = new Soup();
      for (let a = 0; a < 6; a++) {
        const an = (a % 2 ? 0.5 : -0.45) + sr.range(-0.35, 0.35) + (a > 3 ? 1.2 : 0), ca = Math.cos(an), sa = Math.sin(an), off = (a - 2.5) * 2.6 + sr.range(-1, 1), ph = sr.range(0, TAU), pts = [];
        for (let k = 0; k <= 14; k++) {
          const q = (k / 14 * 2 - 1) * rm.R * 0.92, w = Math.sin(k * 0.9 + ph) * 0.7, ss = rm.s + ca * q - sa * (off + w), tt = rm.t + sa * q + ca * (off + w), gg = Gat(ss, tt);
          if (gg < 2.2) { if (pts.length > 3) break; pts.length = 0; continue; }
          pts.push(P3(ss, tt, Fat(ss, tt) + gg - 0.22 - 0.25 * Math.abs(Math.sin(k * 1.7 + ph))));
        }
        if (pts.length < 4) continue;
        pts[0].y += 0.7; pts[pts.length - 1].y += 0.7;                  // both ends go up into the snow
        const r0 = sr.range(0.13, 0.24);
        g.tube(pts, (v) => r0 * (0.4 + 0.6 * Math.sin(Math.PI * v)) + 0.02 * Math.sin(v * 40 + ph), 6, (v, aa) => mixc(barkA, barkB, 0.5 + 0.5 * Math.sin(aa * 3 + v * 17 + ph)), () => [6, 0, 0, ph], false);
        for (let k = 1; k < pts.length - 1; k++) {
          if (sr() < 0.3) continue;
          const b = pts[k], len = sr.range(0.8, 2.3), tip = b.clone().add(new V3(sr.range(-0.7, 0.7), -len, sr.range(-0.7, 0.7)));
          if (path.distanceTo(tip.x, tip.y, tip.z) < 4.2) continue;
          g.tube([b.clone(), b.clone().lerp(tip, 0.5).add(new V3(sr.range(-0.25, 0.25), 0.1, sr.range(-0.25, 0.25))), tip], (q) => 0.085 - 0.045 * q, 4, () => twigC, () => [0, 0.5, 0, 0], false);
          g.ball(tip.clone().add(new V3(0, -0.2, 0)), 0.2, 0.42, 0.2, 6, 4, () => budC, [5, 0.6, 0, 0]);
        }
        await ctx.yield();
      }
      addStatic(g, rm.s);
      await ctx.yield();
    }

    // ---- the root cellar: a dwarf birch stands in the pack; between its roots a vole has laid up berries, seeds and catkins
    deal('cellar');
    { const g = new Soup(), TS = birchAt.s, TT = birchAt.t, f0 = Fat(TS, TT), rootC = lin('#a8683c');
      const trunkC = (v, o) => { toW(TS + Math.sin(v * 2.1) * 0.5, TT + Math.cos(v * 1.7) * 0.4); return o.set(W_.x, f0 - 0.6 + v * 18, W_.z); }, trunkR = (v) => 2.5 + 2.0 * Math.exp(-v * 6) + 0.12 * Math.sin(v * 23);
      const tp = []; for (let i = 0; i <= 21; i++) tp.push(trunkC(i / 21, new V3()));
      // the trunk: not quite round, swelling into buttresses where the roots leave it
      g.tube(tp, (v, a) => trunkR(v) * (1 + 0.035 * Math.cos(3 * a + v * 5) + 0.02 * Math.cos(7 * a - v * 9) + 0.14 * Math.exp(-v * 9) * Math.cos(5 * a + 1.3)), 28, () => W1, () => [7, 0, 0, 0], false);
      toW(TS, TT); uBirch.value.set(W_.x, W_.z);
      // curls of paper bark: each is fast to the trunk along one edge, lifts off round it and rolls up on itself (white outside,
      // pink-tan within); most are on the side we pass
      { const c0 = new V3(), pv = new V3(), toPath = (() => { const a = toW(TS, 0), ax = a.x, az = a.z; toW(TS, TT); return Math.atan2(az - W_.z, ax - W_.x); })();
        for (let i = 0; i < 52; i++) {
          const y = 3.0 + 10.5 * sr(), v = (y - (f0 - 0.6)) / 18, ph = toPath + clamp(sr.gauss() * 1.0, -2.4, 2.4), dir = sr() < 0.5 ? -1 : 1, Ls = sr.range(1.6, 3.8), hw0 = sr.range(0.3, 0.85), curl = sr.range(2.4, 5.4), hc = [sr(), sr(), sr()];
          trunkC(v, c0); const nx = Math.cos(ph), nz = Math.sin(ph), tx = -nz * dir, tz = nx * dir, NS = 12; pv.set(c0.x + nx * (trunkR(v) * 1.02 + 0.05), y, c0.z + nz * (trunkR(v) * 1.02 + 0.05));
          let pb = -1, pt2 = -1;
          for (let k = 0; k <= NS; k++) {
            const t = k / NS, th = curl * Math.pow(sstep(0.08, 1, t), 1.4), hw = hw0 * (1 - 0.35 * t), yy = pv.y - 0.2 * Ls * t * t;
            const b = g.v(pv.x, yy - hw, pv.z, hc, [11, 0, -1, t]), tt = g.v(pv.x, yy + hw, pv.z, hc, [11, 0, 1, t]);
            if (pb >= 0) { if (dir > 0) { g.tri(pb, tt, b); g.tri(pb, pt2, tt); } else { g.tri(pb, b, tt); g.tri(pb, tt, pt2); } }
            pb = b; pt2 = tt;
            const st = Ls / NS; pv.x += (tx * Math.cos(th) + nx * Math.sin(th)) * st; pv.z += (tz * Math.cos(th) + nz * Math.sin(th)) * st;
          }
        } }
      // roots: [direction in the (s, t) plane, reach, height where it leaves the trunk, hump, radius]; fluted, knotted, tapering
      const rootRad = (r0, taper, ri) => (v, a) => r0 * (1 - taper * v) * (1 + 0.1 * Math.sin(v * 17 + ri)) * (1 + 0.14 * Math.cos(4 * a + ri * 1.7 + v * 3) + 0.07 * Math.cos(9 * a + ri) + 0.3 * Math.exp(-(((v - 0.33 - 0.07 * (ri % 3)) / 0.045) ** 2)) * (0.5 + 0.5 * Math.cos(a - ri)) + 0.22 * Math.exp(-(((v - 0.68) / 0.04) ** 2)) * (0.5 + 0.5 * Math.cos(a + 2 + ri)));
      const rootCol = (ri) => (v, a) => { const k = 0.74 + 0.26 * Math.cos(4 * a + ri * 1.7 + v * 3); return [rootC[0] * k, rootC[1] * k, rootC[2] * k]; };
      ROOTS.forEach(([a, reach, h0, hump, r0], ri) => {
        const pts = [], ca = Math.cos(a), sa = Math.sin(a);
        for (let i = 0; i <= 9; i++) { const k = i / 9, d = 1.6 + reach * k, s = TS + ca * d + Math.sin(k * 5 + ri) * 0.5 * k, t = TT + sa * d + Math.cos(k * 4 + ri * 2) * 0.5 * k;
          pts.push(P3(s, t, Fat(s, t) + h0 * (1 - k) * (1 - k) + hump * Math.sin(Math.PI * Math.min(k * 1.5, 1)) * (1 - 0.5 * k) + 0.25 - 0.9 * sstep(0.8, 1, k))); }
        g.tube(new THREE.CatmullRomCurve3(pts).getPoints(22), rootRad(r0, 0.68, ri), 14, rootCol(ri), (v) => [7, 0, sstep(0, 0.07, v), 0]);
        for (let q = 0; q < 2; q++) {                                  // rootlets
          const k = 0.3 + 0.3 * q + 0.1 * ((ri * 0.37) % 1), b = pts[Math.round(k * 9)], sg = (ri + q) % 2 ? 1 : -1, e2 = P3(TS + ca * (1.6 + reach * k) - sa * sg * 2.6 + ca * 1.4, TT + sa * (1.6 + reach * k) + ca * sg * 2.6 + sa * 1.4, 0);
          e2.y = b.y * 0.2 + 0.1; g.tube(new THREE.CatmullRomCurve3([b.clone(), b.clone().lerp(e2, 0.5).add(new V3(0, 0.3, 0)), e2]).getPoints(8), rootRad(r0 * 0.28, 0.6, ri + q + 3), 8, rootCol(ri + q), () => [7, 0, 1, 0]);
        }
      });
      await ctx.yield();
      { const pts = [], a = 4.52, ca = Math.cos(a), sa = Math.sin(a);                 // one root arches clean over the runway and goes to ground on its far side
        for (let i = 0; i <= 12; i++) { const k = i / 12, d = 1.8 + 21.5 * k, s = TS + ca * d, t = TT + sa * d; pts.push(P3(s, t, Fat(s, t) + 5.2 * (1 - k) + 22 * k * (1 - k) - 0.5 * k)); }
        g.tube(new THREE.CatmullRomCurve3(pts).getPoints(30), rootRad(1.0, 0.45, 5), 16, rootCol(5), (v) => [7, 0, sstep(0, 0.05, v), 0]); }
      // the cache: a heap of lingonberries with a few willow catkins laid on it
      for (let i = 0; i < 34; i++) {
        const a = sr.range(0, TAU), d = 2.3 * Math.sqrt(sr()), s = cacheAt.s + Math.cos(a) * d, t = cacheAt.t + Math.sin(a) * d, r = sr.range(0.42, 0.56);
        g.ball(P3(s, t, Fat(s, t) + r * 0.8 + (1 - d / 2.3) * 1.5 * sr()), r, r * 0.95, r, 8, 5, () => berryC, [2, 0, 0, 0]);
      }
      for (let i = 0; i < 4; i++) { const a = sr.range(0, TAU), c = P3(cacheAt.s + Math.cos(a) * 1.6, cacheAt.t + Math.sin(a) * 1.6, Fat(cacheAt.s, cacheAt.t) + 1.5 + 0.2 * i), e = c.clone().add(new V3(Math.cos(a * 2.3) * 1.5, 0.3, Math.sin(a * 2.3) * 1.5));
        g.tube([c, c.clone().lerp(e, 0.5).add(new V3(0, 0.15, 0)), e], (v) => 0.36 * Math.sin(Math.PI * (0.12 + 0.8 * v)), 7, () => budC, () => [5, 0, 0, 0]); }
      addStatic(g, 98); }
    await ctx.yield();

    // ---- the fox's dig: the heap of snow it has knocked through, lying in the daylight under the hole
    // (a lump of stone or snow: an ellipsoid drawn out of round by noise, creased, and cut flat on a few faces taken from its seed)
    const rockMat = mk(U, { vs: ROCK_VS, fs: ROCK_FS });
    const lumpK = (ds, sy, dt, sd) => 1 + 0.22 * noise.fbm3(ds * 1.5 + sd, sy * 1.5, dt * 1.5, 3) + 0.07 * noise.n3(ds * 4.6, sy * 4.6 + sd, dt * 4.6) - 0.1 * Math.abs(noise.n3(ds * 2.3 + 7, sy * 2.3, dt * 2.3 + sd));
    const lump = (g, cx, cy, cz, tx, tz, rs, ry, rt, nrg, nsg, sd, attr, nCut) => {
      const rg = [], cuts = [];
      for (let c = 0; c < nCut; c++) {
        const h1 = Math.sin(sd * 12.9898 + c * 78.233) * 43758.5453, h2 = Math.sin(sd * 39.3468 + c * 11.135) * 24634.6345, a = (h1 - Math.floor(h1)) * TAU, e = 0.2 + 0.95 * (h2 - Math.floor(h2));
        cuts.push([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e), 0.8 + 0.12 * ((c * 0.618 + sd) % 1)]);
      }
      for (let j = 0; j <= nrg; j++) { const la = -Math.PI / 2 + Math.PI * j / nrg, sy = Math.sin(la), cr = Math.max(Math.cos(la), 0.015), ring = [];
        for (let k = 0; k < nsg; k++) { const a = k / nsg * TAU, ds = Math.cos(a) * cr, dt = Math.sin(a) * cr;
          let kk = lumpK(ds, sy, dt, sd);
          for (const c of cuts) { const dn = ds * c[0] + sy * c[1] + dt * c[2]; if (dn * kk > c[3]) kk = c[3] / dn; }
          ring.push(g.v(cx + (tx * ds * rs - tz * dt * rt) * kk, cy + sy * ry * kk, cz + (tz * ds * rs + tx * dt * rt) * kk, W1, attr)); }
        rg.push(ring); }
      g.loft(rg, true);
    };
    { const g = new Soup(), c = P3(foxAt.s, foxAt.t, Fat(foxAt.s, foxAt.t) + 0.1); fr(foxAt.s); const tx = F_.tx, tz = F_.tz;
      lump(g, c.x, c.y, c.z, tx, tz, 5.0, 1.5, 4.5, 12, 26, 7.7, [10, 3, 7.7, 0], 0);
      for (const [cs, ct, r, rz, sd, d] of CLODS) { toW(cs, ct); lump(g, W_.x, c.y + r * 0.5 + Math.max(0, 1.2 - d * 0.25), W_.z, tx, tz, r, r * 0.75, r * rz, 8, 12, sd, [10, r, sd, 0], 2); }
      addStatic(g, foxAt.s, rockMat);
      toW(foxAt.s, foxAt.t); U.uPool1.value.set(W_.x, W_.z, 10, 0); }
    await ctx.yield();
    // small drifts on the floor of the last straight (566 to 640 m): low mounds of blown snow, one to two and a half metres long and
    // half a metre high, of the heap's own snow, lying along the way, from a stream of their own (all the draws are taken,
    // then the place is tried). A drift keeps more than 2.0 m from the eye's line with its whole body, and off the middle of the
    // vole's run by half the animal's width and its own reach
    { const R = stream('last-drifts'), g = new Soup(); let n = 0;
      for (let s = 566; s < 640; s += 2.2) {
        const ps = s + 2.2 * R(), tt = R.sign() * R.range(3.6, 8.5), rs = R.range(1.1, 2.4), rt = rs * R.range(0.5, 0.8), ry = R.range(0.4, 0.7), sd = R.range(0, 50), yaw = R.range(-0.5, 0.5), rr = rs * 1.2;
        if (Gat(ps, tt) < 1.6 || Math.abs(tt) < 2.6 + rr || Math.abs(tt - voleT(ps)) < VOLE_HALF + rr || inSolid(ps, tt)) continue;
        toW(ps, tt); const x = W_.x, z = W_.z, y = Fat(ps, tt); if (!path.isClear(x, y, z, rr, 2.5)) continue;
        const ca = Math.cos(yaw), sa = Math.sin(yaw);
        lump(g, x, y - 0.06, z, F_.tx * ca - F_.tz * sa, F_.tx * sa + F_.tz * ca, rs, ry, rt, 6, 12, sd, [10, rs, sd, 0], 0); n++;
        if ((n & 3) === 3) await ctx.yield();
      }
      if (n) addStatic(g, 600, rockMat).name = 'drifts'; }
    await ctx.yield();

    // ---- the meltwater: the water surface itself
    const waterMat = mk(U, { vs: WATER_VS, fs: WATER_FS, uniforms: { uDrip: { value: [[337, -1.5, 0.31, 0.1], [341, 1, 0.27, 0.6], [334, -3.5, 0.23, 0.35], [316, 1, 0.37, 0.8]].map(([s, t, r, ph]) => { toW(s, t); return new THREE.Vector4(W_.x, W_.z, r, ph); }) }, uRoofH: { value: 9 } } });
    const water = (() => {
      const P = [], D = [], I = [], ns = 54, nt = 35, s0 = 290, ds = 1.5, t0 = -17;
      for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) { const s = s0 + i * ds, t = t0 + j; toW(s, t); P.push(W_.x, WATER_Y, W_.z); D.push(Gat(s, t) > 0.3 ? WATER_Y - Fat(s, t) : -1); }
      for (let i = 0; i + 1 < ns; i++) for (let j = 0; j + 1 < nt; j++) { const a = i * nt + j, b = a + nt; if (Math.max(D[a], D[a + 1], D[b], D[b + 1]) < -0.3) continue; I.push(a, b, b + 1, a, b + 1, a + 1); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aD', new THREE.Float32BufferAttribute(D, 1)); geo.setIndex(I); geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, waterMat); m.matrixAutoUpdate = false; scene.add(m); return m;
    })();
    await ctx.yield();

    // ---- the boulder: granite the size of a house, its crown in the snow; where it has held the pack off, daylight comes down its shoulder
    // (the reindeer lichen stands in one mesh for each chunk of the way that has any: a bush of the way is filed with the chunk of its
    // own place, a room's bushes with the chunk the room's middle lies in, those on the boulder and its stones with the boulder's chunk)
    const lichG = [], lichAt = (s) => { const c = chunkOf(s); return lichG[c] || (lichG[c] = new Soup()); };
    { const g = new Soup(), gl = lichAt(428), gw = [], c = P3(rockAt.s, rockAt.t, 3); fr(rockAt.s); const tx = F_.tx, tz = F_.tz;
      lump(g, c.x, c.y, c.z, tx, tz, 16, 15.5, 13.5, 36, 56, 3.1, [8, 5, 3.1, 0], 0);
      await ctx.yield();
      // the stones round its foot and in the room before it (drawn above), each a broken lump with a snow cap of its own
      let si = 0;
      for (const [qs, qt, r, sq, rt, sd, sit] of STONES) { toW(qs, qt); lump(g, W_.x, Fat(qs, qt) + r * sq * sit, W_.z, tx, tz, r, r * sq, r * rt, 12, 18, sd, [8, r, sd, 0], 3); if ((++si & 7) === 7) await ctx.yield(); }
      await ctx.yield();
      // reindeer lichen in small bushes on the shoulders of the stones and on the boulder's face toward the way
      deal('stone-lichen'); growG = gl;
      for (const [qs, qt, r, sq, , , sit] of STONES) {
        if (r < 1 || sr() < 0.3) continue;
        const a = sr.range(0, TAU), d = r * sr.range(0.3, 0.6), len = sr.range(0.4, 0.75); toW(qs + Math.cos(a) * d, qt + Math.sin(a) * d);
        grow(new V3(W_.x, Fat(qs, qt) + r * sq * (sit + Math.sqrt(1 - (d / r) * (d / r))) - 0.25, W_.z), new V3(sr.range(-0.3, 0.3), 1, sr.range(-0.3, 0.3)).normalize(), len, len * 0.13, 2);
      }
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI / 2 + sr.range(-0.9, 0.9), la = sr.range(-0.12, 0.3), sy = Math.sin(la), cr = Math.cos(la), ds = Math.cos(a) * cr, dt = Math.sin(a) * cr, kk = lumpK(ds, sy, dt, 3.1) * 0.98, len = sr.range(0.6, 1.1);
        const p = new V3(c.x + (tx * ds * 16 - tz * dt * 13.5) * kk, c.y + sy * 15.5 * kk, c.z + (tz * ds * 16 + tx * dt * 13.5) * kk);
        grow(p, new V3(tx * ds - tz * dt, 0.9, tz * ds + tx * dt).normalize(), len, len * 0.13, 2);
      }
      // by the grotto and the boulder: small stones lie at the foot of the walls on both sides, each with a bush of lichen on its shoulder
      // (of the stones the stream deals, only those that bear a bush stand). A stone that lies in a chunk before the boulder's goes
      // into a mesh of that chunk (gw), one further on into the boulder's own, which is on show before it; its bush goes with the
      // lichen of its own chunk
      { const R = stream('way-stones'), keepS = sr, c0 = chunkOf(428); sr = R;
        for (let s = 356; s < 446; s += 2.2) {
          const side = R.sign(), gT = R.range(1.4, 2.8), r = R.range(0.45, 1.05), sq = R.range(0.55, 0.85), rt = R.range(0.8, 1.2), sd = R.range(0, 50), bush = R() < 0.6, a = R.range(0, TAU), len = R.range(0.5, 0.9), keep = R(), ps = s + 2.2 * R();
          const pt0 = wallAt(ps, side, gT), pt = pt0 - side * r * 0.6;
          if (!(pt0 === pt0) || Math.abs(pt) < 3.4 + r || Math.abs(pt) > 40 || keep > span(354, 446, ps, 6)) continue;
          // (off the vole's run by half the animal's width and the reach of the stone and its bush)
          if (Gat(ps, pt) < 1.2 || Fat(ps, pt) < -0.45 || Math.abs(pt - voleT(ps)) < VOLE_HALF + r * 1.3 + len * 1.6 || ermDist(ps, pt) < 4.5 || inSolid(ps, pt)) continue;
          toW(ps, pt); const y = Fat(ps, pt) + r * sq * 0.45, x = W_.x, z = W_.z;
          if (!bush || !path.isClear(x, y, z, r * 1.3 + len * 1.6, 2.5)) continue;
          const cs = chunkOf(ps); growG = lichAt(ps);
          lump(cs < c0 ? gw[cs] || (gw[cs] = new Soup()) : g, x, y, z, tx, tz, r, r * sq, r * rt, 8, 12, sd, [8, r, sd, 0], 2);
          grow(new V3(x + Math.cos(a) * r * 0.35, y + r * sq * 0.7, z + Math.sin(a) * r * 0.35), new V3(Math.cos(a) * 0.25, 1, Math.sin(a) * 0.25).normalize(), len, len * 0.13, 2);
          await ctx.yield();
        }
        sr = keepS; }
      growG = hallG;
      addStatic(g, 428, rockMat); gw.forEach((q, i) => addStatic(q, chunks[i].s0 + 1, rockMat));
      toW(gapAt.s, gapAt.t); U.uPool2.value.set(W_.x, W_.z, 7.5, 0.7);
      // the pool of the lee's own light lies where its shaft lands, on the floor the animal we follow crosses and up the boulder's foot
      toW(sunSpot.s, sunSpot.t); U.uLee.value.set(W_.x, W_.z, 6.5, LEE.k); }
    await ctx.yield();

    // ---- the lichen garden: reindeer lichen in pale coral bushes over the mounds on both sides
    // by the lichen garden and the ptarmigan's burrow (from sA to sB metres of the way): bushes of reindeer lichen along the foot of the
    // walls, and clumps of cup lichen on the floor beside them: grey-green goblets on a stalk, a metre tall at this scale
    // (g: the lichen's mesh of the chunk the place lies in)
    const wayLichen = async (sA, sB) => {
      let g = null;
      const R = stream('way-lichen-' + sA), keepS = sr, cq = new Float32Array(24), ring = (r, y, x, z, yaw, c) => { const o = []; for (let k = 0; k < 6; k++) { const a = yaw + k / 6 * TAU; o.push(g.v(x + Math.cos(a) * r, y, z + Math.sin(a) * r, c, [4, 0, 0, 0])); } return o; };
      sr = R;
      for (let s = sA; s < sB; s += 1.6) {
        const side = R.sign(), gT = R.range(2.4, 4.2), sz0 = R.range(1.1, 2.0), lx = R.range(-0.25, 0.25), lz = R.range(-0.25, 0.25), cups = R.int(3, 6), keep = R(), ps = s + 1.6 * R();
        for (let k = 0; k < 24; k++) cq[k] = R();
        const pt0 = wallAt(ps, side, gT), pt = pt0 - side * 0.6;
        if (!(pt0 === pt0) || Math.abs(pt) < 4.2 || Math.abs(pt) > 40 || keep > span(446, 566, ps, 6)) continue;
        g = growG = lichAt(ps);
        for (let k = 0; k < cups; k++) {
          const o = k * 4, s2 = ps + (cq[o] - 0.5) * 3, t2 = pt - side * (1 + 2.2 * cq[o + 1]), h = 0.7 + 0.9 * cq[o + 2], rr = h * 0.3;
          if (Math.abs(t2) < 3.6 || Gat(s2, t2) < 3.4 || Fat(s2, t2) < -0.4 || ermDist(s2, t2) < 4.5 || Math.abs(t2 - voleT(s2)) < VOLE_HALF + rr) continue;   // (off the vole's run by half the animal's width and the cup's own)
          toW(s2, t2); const x = W_.x, z = W_.z, y = Fat(s2, t2) - 0.05, yaw = cq[o + 3] * TAU, c0 = mixc(lichA, lichB, 0.25), c1 = mixc(lichA, lichB, 0.8);
          if (nearBird(x, z) || !path.isClear(x, y + h, z, rr, 2.5)) continue;
          g.loft([ring(rr * 0.22, y, x, z, yaw, c0), ring(rr * 0.2, y + h * 0.5, x, z, yaw, c0), ring(rr * 0.42, y + h * 0.78, x, z, yaw, c1), ring(rr, y + h, x, z, yaw, c1), ring(rr * 0.84, y + h * 0.97, x, z, yaw, c1), ring(rr * 0.12, y + h * 0.7, x, z, yaw, c0)], true);
        }
        if (Gat(ps, pt) < 2.2 || Fat(ps, pt) < -0.4 || ermDist(ps, pt) < 4.5) continue;
        // (a bush keeps off the middle of the vole's run by half the animal's width and its own reach, one and a half times its first limb)
        toW(ps, pt); const szF = Math.min(sz0, (Gat(ps, pt) - 0.6) / 2.2);
        if (Math.abs(pt - voleT(ps)) < VOLE_HALF + szF * 1.5 || nearBird(W_.x, W_.z) || !path.isClear(W_.x, Fat(ps, pt) + szF, W_.z, szF * 1.5, 2.5)) continue;
        grow(new V3(W_.x, Fat(ps, pt) + 0.1, W_.z), new V3(lx, 1, lz).normalize(), szF, szF * 0.13, szF > 1.5 ? 3 : 2);
        await ctx.yield();
      }
      sr = keepS; growG = hallG;
    };
    deal('lichen-garden');
    for (const rm of ROOMS) { if (!rm.lichen) continue; growG = lichAt(rm.s);
      for (let i = 0, tries = 0, n = Math.round(rm.lichen * (0.7 + 0.3 * detail)); i < n && tries < 1500; tries++) {
        const a = sr.range(0, TAU), r = rm.R * Math.sqrt(sr()) * 0.95, s = rm.s + Math.cos(a) * r, t = rm.t + Math.sin(a) * r, gg = Gat(s, t), sz0 = sr.range(1.6, 2.9), lean = [sr.range(-0.25, 0.25), sr.range(-0.25, 0.25)];
        if (gg < 4 || Math.abs(t) < 5.4 || Fat(s, t) < -0.4) continue;
        if (ermDist(s, t) < 4.5) continue;                                     // the ermine's line across the floor stays open
        toW(s, t); const sz = Math.min(sz0, (gg - 1) / 2.6, stage(s, t) || Math.abs(t - voleT(s)) < 3.6 ? 0.5 : 9);       // low cushions on the ermine's stage and in the vole's run
        grow(new V3(W_.x, Fat(s, t) - 0.2, W_.z), new V3(lean[0], 1, lean[1]).normalize(), sz, sz * 0.13, 3); i++;
        if ((i & 3) === 3) await ctx.yield();
      }
      // (the lichen of the way from 446 m to 566 m is dealt in two runs, each from a stream of its own; every bush and clump of it goes
      // into the lichen's mesh of the chunk it stands in, a room's bushes into the mesh of the chunk the room's middle lies in)
      if (rm.id === 'lichen') await wayLichen(446, 506); else if (rm.id === 'last') await wayLichen(506, 566);
      growG = hallG; }
    for (let c = 0; c < lichG.length; c++) { const g = lichG[c]; if (g && g.k) { addStatic(g, chunks[c].s0 + 1).name = 'lichen'; await ctx.yield(); } }
    await ctx.yield();

    // ---- the ptarmigan: a willow ptarmigan in winter white, sitting in the burrow it dived into from above, in the daylight of its own
    // plunge hole. A smooth body carries overlapping separate feathers (BIRD_FS draws each vane); wings folded along the flanks, black
    // tail feathers under white coverts, feathered legs and toes. The head is its own group: it lifts out of the breast and watches us.
    deal('ptarmigan');
    const bird = new THREE.Group(), birdHead = new THREE.Group(), birdHole = { s: 542, t: 18.5 }, birdKey = new V3(0, 1, 0);
    {
      const mkFB = () => {
        const P = [], BN = [], A = [], I = []; let n = 0;
        return {
          v(p, b, a0, a1, a2, a3) { P.push(p.x, p.y, p.z); BN.push(b.x, b.y, b.z); A.push(a0, a1, a2, a3); return n++; },
          tri(a, b, c) { I.push(a, b, c); },
          build() {
            const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aBN', new THREE.Float32BufferAttribute(BN, 3));
            g.setAttribute('aF', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
          },
        };
      };
      const c0 = new V3(), q = new V3(), bn = new V3(), P0 = new V3(), Fl = new V3(), Sd = new V3(), Nn = new V3(), Dr = new V3(), tA = new V3(), tB = new V3(), UPV = new V3(0, 1, 0);
      // one feather: root R0, pointing along D, S across it, N0 the body's normal there. Three rows of three points: cupped across,
      // curving back toward the body at the tip; its shading normal is the body's, leaned a little toward its own edges and tip
      const feather = (fb, R0, D, S, N0, len, wid, kind, hh, cup = 0.14) => {
        c0.crossVectors(S, D).normalize(); if (c0.dot(N0) < 0) c0.negate();
        const idx = [];
        for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) {
          const a = r * 0.5;
          q.copy(R0).addScaledVector(D, len * a).addScaledVector(S, wid * c).addScaledVector(c0, (c === 0 ? cup * wid : 0) - 0.1 * len * a * a);
          bn.copy(N0).addScaledVector(S, 0.3 * c).addScaledVector(D, 0.22 * (a - 0.3)).normalize();
          idx.push(fb.v(q, bn, c, a, hh, kind));
        }
        for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const a = idx[r * 3 + c], b = idx[r * 3 + c + 1], d = idx[(r + 1) * 3 + c], e = idx[(r + 1) * 3 + c + 1]; fb.tri(a, b, e); fb.tri(a, e, d); }
      };
      const tubeFB = (fb, pts, rad, sides, kind) => {
        const T = new V3(), N1 = new V3(0, 1, 0), B1 = new V3(), rings = [], m = pts.length;
        for (let j = 0; j < m; j++) {
          T.copy(pts[Math.min(j + 1, m - 1)]).sub(pts[Math.max(j - 1, 0)]).normalize();
          if (Math.abs(T.dot(N1)) > 0.9) N1.set(1, 0, 0);
          N1.addScaledVector(T, -N1.dot(T)).normalize(); B1.crossVectors(T, N1);
          const r = rad(j / (m - 1)), ring = [];
          for (let k = 0; k < sides; k++) { const a = k / sides * TAU; bn.copy(N1).multiplyScalar(Math.cos(a)).addScaledVector(B1, Math.sin(a)); q.copy(pts[j]).addScaledVector(bn, r); ring.push(fb.v(q, bn, 0, 0, 0, kind)); }
          rings.push(ring);
        }
        for (let j = 0; j + 1 < m; j++) for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; fb.tri(rings[j][k], rings[j][k1], rings[j + 1][k1]); fb.tri(rings[j][k], rings[j + 1][k1], rings[j + 1][k]); }
      };
      const ballFB = (fb, c, r, kind) => {
        const rings = [];
        for (let j = 0; j <= 6; j++) { const la = -Math.PI / 2 + Math.PI * j / 6, ring = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bn.set(Math.cos(a) * Math.cos(la), Math.sin(la), Math.sin(a) * Math.cos(la)); q.copy(c).addScaledVector(bn, r); ring.push(fb.v(q, bn, 0, 0, 0, kind)); } rings.push(ring); }
        for (let j = 0; j < 6; j++) for (let k = 0; k < 8; k++) { const k1 = (k + 1) % 8; fb.tri(rings[j][k], rings[j][k1], rings[j + 1][k1]); fb.tri(rings[j][k], rings[j + 1][k1], rings[j + 1][k]); }
      };
      // the body: sections [z, centre y, radius y, radius x] from the tail root to the front of the breast, joined by a smooth curve.
      // It is plump, fullest just ahead of the middle, the breast carried high and forward, and it rests flat on the snow
      const ROWS = [[-12.6, -1.2, 0.05, 0.05], [-11.0, -0.9, 2.6, 3.4], [-8.2, -0.3, 5.3, 6.0], [-4.2, 0, 7.3, 7.9], [0.2, 0.2, 8.2, 8.6], [4.0, 0.8, 8.4, 8.3], [7.0, 1.8, 7.8, 7.1], [9.4, 2.8, 6.3, 5.6], [11.1, 3.5, 4.0, 3.5], [12.0, 3.8, 0.05, 0.05]];
      const rowAt = (zf) => {
        const NRw = ROWS.length, f = clamp(zf, 0, 1) * (NRw - 1), i = Math.min(Math.floor(f), NRw - 2), t = f - i, t2 = t * t, t3 = t2 * t;
        const a = ROWS[Math.max(i - 1, 0)], b = ROWS[i], c = ROWS[i + 1], d = ROWS[Math.min(i + 2, NRw - 1)], o = [0, 0, 0, 0];
        for (let k = 0; k < 4; k++) o[k] = 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - 3 * c[k] + d[k] - a[k]) * t3);
        o[2] = Math.max(o[2], 0.04); o[3] = Math.max(o[3], 0.04); return o;
      };
      const bodyPt = (zf, ang, o) => {
        const r = rowAt(zf), c = Math.cos(ang), sn = Math.sin(ang), wing = 1 + 0.05 * Math.exp(-((sn - 0.2) ** 2) / 0.12) * sstep(0.15, 0.3, zf) * (1 - sstep(0.62, 0.8, zf));
        return o.set(c * r[3] * wing, Math.max(r[1] + sn * r[2] * (sn < 0 ? 0.9 : 1), -7.55), r[0]);
      };
      const HR = 2.9;
      const headPt = (hf, ang, o) => { const zc = -3.05 + 6.1 * clamp(hf, 0, 1), rr = HR * Math.sqrt(Math.max(1 - (zc / 3.1) ** 2, 0.0004)), sn = Math.sin(ang); return o.set(Math.cos(ang) * rr * 0.96, sn * rr * (sn > 0 ? 0.95 : 1), zc); };
      // at a point of a surface: the root P0, the lie of the feathers Fl (toward the tail), Sd across, Nn outward
      const frame = (ptFn, zf, ang, cy) => {
        ptFn(zf, ang, P0); ptFn(zf - 0.012, ang, tA); ptFn(zf, ang + 0.03, tB);
        Fl.copy(tA).sub(P0); if (Fl.lengthSq() < 1e-9) Fl.set(0, 0, -1); Fl.normalize();
        Sd.copy(tB).sub(P0); if (Sd.lengthSq() < 1e-9) Sd.set(1, 0, 0); Sd.normalize();
        Nn.crossVectors(Sd, Fl); if (Nn.lengthSq() < 1e-9) Nn.set(0, 1, 0); Nn.normalize(); if (Nn.x * P0.x + Nn.y * (P0.y - cy) < 0) Nn.negate();
        Sd.crossVectors(Fl, Nn).normalize();
      };
      const skin = (fb, ptFn, NZ, NA, cyOf) => {
        const rings = [];
        for (let j = 0; j <= NZ; j++) { const zf = j / NZ, ring = []; for (let k = 0; k < NA; k++) { frame(ptFn, zf, k / NA * TAU, cyOf(zf)); ring.push(fb.v(P0, Nn, 0, 0, 0, 0)); } rings.push(ring); }
        for (let j = 0; j < NZ; j++) for (let k = 0; k < NA; k++) { const k1 = (k + 1) % NA; fb.tri(rings[j][k], rings[j][k1], rings[j + 1][k1]); fb.tri(rings[j][k], rings[j + 1][k1], rings[j + 1][k]); }
      };
      const B = mkFB();
      skin(B, bodyPt, 36, 30, (zf) => rowAt(zf)[1]);
      await ctx.yield();
      // the contour feathers, row over row from the tail root forward: long on the back and rump, short and fluffed out on the breast
      const NJ = 34;
      for (let j = 0; j < NJ; j++) {
        const zf = 0.035 + 0.955 * (j / (NJ - 1)), r = rowAt(zf), front = sstep(0.6, 0.9, zf);
        const len0 = lerp(2.9, 1.9, front), nk = Math.max(6, Math.round(Math.PI * (r[2] + r[3]) / (len0 * 0.5)));
        for (let k = 0; k < nk; k++) {
          const ang = (k + (j % 2) * 0.5 + sr.range(-0.25, 0.25)) / nk * TAU, hh = sr(), len = len0 * sr.range(0.8, 1.2), lift = lerp(0.2, 0.42, front) + sr.range(-0.08, 0.12), yawJ = sr.range(-0.3, 0.3);
          if (Math.sin(ang) < -0.78) continue;
          frame(bodyPt, zf, ang, r[1]);
          Dr.copy(Fl).multiplyScalar(Math.cos(lift)).addScaledVector(Nn, Math.sin(lift)).addScaledVector(Sd, yawJ).normalize();
          tA.crossVectors(Nn, Dr).normalize(); P0.addScaledVector(Nn, 0.04);
          feather(B, P0, Dr, tA, Nn, len, len * 0.42, 1, hh);
        }
        if ((j & 3) === 3) await ctx.yield();
      }
      // the folded wings: coverts, secondaries and the long primaries, lying back along each flank, the tips rising over the rump
      for (const sd of [-1, 1]) {
        [[0.62, 0.74, 0.34, 7, 3.6, 1.5, 0.14], [0.36, 0.68, 0.22, 8, 5.6, 1.7, 0.1], [0.12, 0.52, 0.14, 6, 7.2, 1.45, 0.07]].forEach(([aw, z0, z1, n, len, wid, lift], ri) => {
          for (let i = 0; i < n; i++) {
            const zf = lerp(z0, z1, i / (n - 1)), r = rowAt(zf);
            frame(bodyPt, zf, (sd > 0 ? aw : Math.PI - aw) + sr.range(-0.04, 0.04), r[1]);
            Dr.copy(Fl).multiplyScalar(Math.cos(lift)).addScaledVector(Nn, Math.sin(lift)).addScaledVector(Sd, -sd * (ri === 2 ? 0.25 : 0.06)).normalize();
            tA.crossVectors(Nn, Dr).normalize(); P0.addScaledVector(Nn, 0.22 + 0.06 * ri);
            feather(B, P0, Dr, tA, Nn, len * sr.range(0.92, 1.08), wid, 1, sr(), 0.1);
          }
        });
      }
      // the tail: thirteen black feathers in a shallow fan, and the long white coverts that lie over their middle
      for (let i = -6; i <= 6; i++) { const yw = i * 0.085; Dr.set(Math.sin(yw), -0.1, -Math.cos(yw)).normalize(); tA.crossVectors(UPV, Dr).normalize(); P0.set(i * 0.45, -1.5 - 0.03 * i * i, -10.6); feather(B, P0, Dr, tA, UPV, 7.4 - 0.9 * Math.abs(i) / 6, 1.05, 2, sr(), 0.08); }
      for (let i = -3; i <= 3; i++) { const yw = i * 0.1; Dr.set(Math.sin(yw), -0.13, -Math.cos(yw)).normalize(); tA.crossVectors(UPV, Dr).normalize(); P0.set(i * 0.7, -0.75 - 0.05 * i * i, -9.6); feather(B, P0, Dr, tA, UPV, 5.4 - 0.25 * Math.abs(i), 1.3, 1, sr(), 0.12); }
      await ctx.yield();
      // feathered legs and feet under the breast: a muff of feathers down each leg, three toes with stiff feathers over them, dark claws
      for (const sd of [-1, 1]) {
        const hip = new V3(sd * 2.9, -3.2, 7.4), ank = new V3(sd * 3.0, -7.0, 8.7);
        tubeFB(B, [hip, hip.clone().lerp(ank, 0.5).add(new V3(0, 0, 0.3)), ank], (t) => 1.25 - 0.3 * t, 8, 0);
        for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) {
          const a = (k + 0.5 * (i % 2)) / 7 * TAU, v = i / 4;
          Nn.set(Math.cos(a), 0, Math.sin(a)); P0.copy(hip).lerp(ank, v).addScaledVector(Nn, 1.2 - 0.3 * v);
          Dr.set(Nn.x * 0.3, -1, Nn.z * 0.3 + 0.3).normalize(); tA.crossVectors(Nn, Dr).normalize();
          feather(B, P0, Dr, tA, Nn, sr.range(1.5, 2.0), 0.7, 1, sr());
        }
        for (const ta of [-0.55, 0, 0.55]) {
          const az = ta + sd * 0.2, dx = Math.sin(az), dz = Math.cos(az), L3 = ta === 0 ? 3.6 : 3.0;
          const e = new V3(ank.x + dx * L3, -7.5, ank.z + dz * L3), m = ank.clone().lerp(e, 0.5); m.y = -7.25;
          tubeFB(B, [ank.clone().add(new V3(0, -0.2, 0)), m, e], (t) => 0.72 - 0.3 * t, 7, 0);
          tubeFB(B, [e.clone(), new V3(e.x + dx * 0.55, -7.5, e.z + dz * 0.55), new V3(e.x + dx * 0.95, -7.7, e.z + dz * 0.95)], (t) => 0.26 * (1 - 0.85 * t), 5, 3);
          for (let i = 0; i < 5; i++) for (const c of [-1, 0, 1]) {
            const v = i / 5; P0.copy(ank).lerp(e, v); P0.y += 0.5 - 0.2 * v + (c === 0 ? 0.15 : -0.2); P0.x += dz * c * 0.5; P0.z -= dx * c * 0.5;
            Nn.set(dz * c * 0.7, 1, -dx * c * 0.7).normalize(); Dr.set(dx + dz * c * 0.45, -0.12, dz - dx * c * 0.45).normalize(); tA.crossVectors(Nn, Dr).normalize();
            feather(B, P0, Dr, tA, Nn, sr.range(1.1, 1.5), 0.5, 1, sr());
          }
        }
      }
      await ctx.yield();
      // the head: small and round, feathered from the bill back into a ruff that lies over the breast; a short dark bill, a plain dark
      // eye, and the small red comb over it
      const H = mkFB(), eyeP = [new V3(-2.52, 0.45, 1.25), new V3(2.52, 0.45, 1.25)], combP = [new V3(-2.4, 1.4, 1.3), new V3(2.4, 1.4, 1.3)];
      skin(H, headPt, 14, 20, () => 0);
      for (let j = 0; j < 13; j++) {
        const hf = 0.06 + 0.9 * (j / 12), zc = -3.05 + 6.1 * hf, rr = HR * Math.sqrt(Math.max(1 - (zc / 3.1) ** 2, 0.01)), back = 1 - sstep(0.1, 0.45, hf);
        const len0 = lerp(1.25, 2.6, back), nk = Math.max(5, Math.round(TAU * rr / (len0 * 0.54)));
        for (let k = 0; k < nk; k++) {
          const ang = (k + (j % 2) * 0.5 + sr.range(-0.2, 0.2)) / nk * TAU, hh = sr(), len = len0 * sr.range(0.85, 1.15), lift = 0.2 + sr.range(-0.05, 0.12);
          frame(headPt, hf, ang, 0);
          Dr.copy(Fl).multiplyScalar(Math.cos(lift)).addScaledVector(Nn, Math.sin(lift)).normalize(); tA.crossVectors(Nn, Dr).normalize(); P0.addScaledVector(Nn, 0.03);
          tB.copy(P0).addScaledVector(Dr, len * 0.6);
          if (Math.min(P0.distanceTo(eyeP[0]), P0.distanceTo(eyeP[1]), tB.distanceTo(eyeP[0]), tB.distanceTo(eyeP[1])) < 0.68 || Math.min(tB.distanceTo(combP[0]), tB.distanceTo(combP[1])) < 0.6) continue;
          feather(H, P0, Dr, tA, Nn, len, len * 0.45, 1, hh);
        }
      }
      tubeFB(H, [new V3(0, -0.4, 2.6), new V3(0, -0.5, 3.45), new V3(0, -0.8, 4.0), new V3(0, -1.25, 4.35)], (t) => 0.6 * (1 - 0.88 * t * t), 8, 3);
      for (const sd of [-1, 1]) {
        ballFB(H, eyeP[sd < 0 ? 0 : 1], 0.38, 4);
        tubeFB(H, [new V3(sd * 2.25, 1.2, 2.0), new V3(sd * 2.5, 1.5, 1.3), new V3(sd * 2.4, 1.3, 0.6)], (t) => 0.2 * Math.sin(Math.PI * (0.15 + 0.7 * t)) + 0.05, 5, 5);
      }
      await ctx.yield();
      const birdMat = mk(U, { vs: BIRD_VS, fs: BIRD_FS, uniforms: { uKey: { value: birdKey } } });
      const body = new THREE.Mesh(B.build(), birdMat); body.frustumCulled = false; bird.add(body);
      await ctx.yield();
      const head = new THREE.Mesh(H.build(), birdMat); head.frustumCulled = false; birdHead.add(head); birdHead.position.set(0, 10.2, 8.9); bird.add(birdHead);
      const f = Fat(birdAt.s, birdAt.t); toW(birdAt.s, birdAt.t); bird.position.set(W_.x, f + 7.5 * BSC, W_.z); bird.scale.setScalar(BSC);
      fr(birdAt.s); const ds = 0.35, dt = -0.94; bird.rotation.y = Math.atan2(F_.tx * ds - F_.tz * dt, F_.tz * ds + F_.tx * dt);
      scene.add(bird); chunks[chunkOf(birdAt.s)].det.push(bird);
      // the plunge hole is over its shoulder on our side: the light comes down on its crown and back, and the flank we see is in shade
      toW(birdHole.s, birdHole.t); U.uPool0.value.set(W_.x, W_.z, 15, 1);
      birdKey.set(W_.x - bird.position.x, Fat(birdHole.s, birdHole.t) + Gat(birdHole.s, birdHole.t) - bird.position.y, W_.z - bird.position.z).normalize(); }
    await ctx.yield();

    // ---- shafts of daylight under the three openings (additive cones; the fox's comes and goes with its digging)
    const moonT = new V3(0.62, 0.86, 1.7).multiplyScalar(2.6), shaftT = lookId === 'night' ? moonT : new V3(1, 1, 1);   // by night the shafts are moonbeams: bluer, and drawn stronger
    // st (the shaft's foot and head in the way's own measure: s0, t0, s1, t1): the shaft is laid in sixteen rings and each point of
    // it knows how far it stands clear under the snow (aOpen: 1 with 1.6 m of air over it and over the place 0.8 m further out,
    // 0 where it meets the roof or a wall), so that the shaft goes out before the snow and no line is drawn where it enters it
    const makeShaft = (top, bot, rTop, rBot, s, tint = shaftT, soft = 0, st = null) => {
      const n = 24, nr = st ? 16 : 1, P = [], N = [], UV = [], O = [], I = [];
      for (let j = 0; j <= nr; j++) for (let k = 0; k <= n; k++) {
        const a = k / n * TAU, v = j / nr, r = lerp(rBot, rTop, v), cy = lerp(bot.y, top.y, v), ca = Math.cos(a), sa = Math.sin(a);
        let x = lerp(bot.x, top.x, v) + ca * r, z = lerp(bot.z, top.z, v) + sa * r, nx = ca, nz = sa, open = 1;
        if (st) {
          const sc = lerp(st.s0, st.s1, v), tc = lerp(st.t0, st.t1, v); toW(sc, tc); const ox = W_.x, oz = W_.z; toW(sc + ca * r, tc + sa * r); x = W_.x; z = W_.z;
          const l = Math.hypot(x - ox, z - oz) || 1; nx = (x - ox) / l; nz = (z - oz) / l;
          open = clamp((Math.min(roofAt(sc + ca * r, tc + sa * r), roofAt(sc + ca * (r + 0.8), tc + sa * (r + 0.8))) - cy - 0.2) / 1.4, 0, 1);
        }
        P.push(x, cy, z); N.push(nx, 0, nz); UV.push(k / n, v); O.push(open);
      }
      for (let j = 0; j < nr; j++) for (let k = 0; k < n; k++) { const a = j * (n + 1) + k, b = a + n + 1; I.push(a, a + 1, b + 1, a, b + 1, b); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); geo.setAttribute('aOpen', new THREE.Float32BufferAttribute(O, 1)); geo.setIndex(I); geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mk(U, { vs: SHAFT_VS, fs: SHAFT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uOpen: { value: 1 }, uTint: { value: tint }, uSoft: { value: soft } } }));
      mesh.matrixAutoUpdate = false; mesh.renderOrder = 3; scene.add(mesh); chunks[chunkOf(s)].det.push(mesh); return mesh;
    };
    const roofAt = (s, t) => Fat(s, t) + Gat(s, t);
    const foxShaft = makeShaft(P3(foxAt.s, foxAt.t, roofAt(foxAt.s, foxAt.t) + 0.5), P3(foxAt.s, foxAt.t, 0), 4.2, 6.5, foxAt.s);
    // the shaft in the boulder's lee, from the gap at the rock's shoulder down the tall vault to the floor, in the lee's own light
    { const dc = U.uDayCol.value; makeShaft(P3(gapAt.s, gapAt.t, roofAt(gapAt.s, gapAt.t) + 0.5), P3(sunSpot.s, sunSpot.t + 0.2, 0), 2.3, 3.6, 425, new V3(LEE.c[0] / Math.max(dc.r, 0.05), LEE.c[1] / Math.max(dc.g, 0.05), LEE.c[2] / Math.max(dc.b, 0.05)).multiplyScalar(LEE.shaft), 1,
      { s0: sunSpot.s, t0: sunSpot.t + 0.2, s1: gapAt.s, t1: gapAt.t }); }
    makeShaft(P3(birdHole.s, birdHole.t, roofAt(birdHole.s, birdHole.t) + 0.5), P3(birdAt.s - 0.8, birdAt.t - 0.6, 4), 4.0, 10, 545);
    // by night two more lights: the moon through a lens of clear ice over the meltwater, on the shrew and in the water; and a moonbeam
    // through a blow-hole in the room before the boulder, on its frosted stones. Over the lichen garden the aurora stands
    // above thin snow and the whole room is green (rfLight)
    const nightK = lookId === 'night' ? 1 : 0, lensAt = { s: 335.5, t: -1 }, beamAt = { s: 403.5, t: -3.4 };
    if (nightK) {
      toW(lensAt.s, lensAt.t); U.uPool3.value.set(W_.x, W_.z, 9.5, 1.9);
      makeShaft(P3(lensAt.s, lensAt.t, roofAt(lensAt.s, lensAt.t) + 0.5), P3(lensAt.s + 1, lensAt.t + 2, WATER_Y), 2.6, 6.0, lensAt.s);
      toW(beamAt.s, beamAt.t); U.uPool4.value.set(W_.x, W_.z, 7.5, 2.0);
      makeShaft(P3(beamAt.s, beamAt.t, roofAt(beamAt.s, beamAt.t) + 0.5), P3(beamAt.s - 0.6, beamAt.t - 0.6, 0), 1.6, 3.6, beamAt.s, moonT.clone().multiplyScalar(2.2));
      toW(481, 1); U.uAur.value.set(W_.x, W_.z, 30, 0.8);
    }
    await ctx.yield();

    // ---- thin-roof patches: the hall, a halo round every stem, the strike gallery (a place: it is there the whole flight); then one in
    // the roof of every chamber (ROOMS.thin), so that the far side of every doorway glows; the runway's far end and the approach to the
    // strike gallery (the far ends of the first and the last straight)
    const setPatch = (i, x, z, r, a) => U.uPatch.value[i].set(x, z, r, a);
    setPatch(0, hcx, hcz, 30, 0.3);
    stemTop.forEach(([x, z], i) => setPatch(1 + i, x, z, 3.6, 0.3));
    setPatch(6, 0, HOLE_Z, 46, 0.5);
    { let slot = 7;
      const put = (ps, pt, r, a) => { toW(ps, pt); setPatch(slot, W_.x, W_.z, r, a); slot += slot === 10 ? 2 : 1; };
      // 12 the opening (lit cobalt overhead), 13 the tunnel behind the entry (what the previous portal looks into)
      put(64, 0, 28, 0.36); put(sLast - 62, 0, 36, 0.2); put(10, 0, 40, 0.1); put(-8, 0, 20, 0.06);
      for (const rm of ROOMS) if (rm.thin) put(rm.s + rm.thin[0], rm.t + rm.thin[1], rm.thin[2], rm.thin[3]);
      // the halo round the birch and the halo where the boulder holds the snow off
      put(birchAt.s, birchAt.t, 5, 0.3); put(426, 9, 7, 0.3);
      // thick dark snow behind the ermine's crossing: over the left gallery it comes out of
      { const b = BR[0].P[10]; setPatch(slot++, b[0], b[1], 15, -0.38); }
    }
    const ptar = (() => { toW(214, 17); return { x: W_.x, z: W_.z, y: Fat(214, 17) + Gat(214, 17) }; })();
    if (rare) { setPatch(11, ptar.x, ptar.z, 11, 0.3); U.uWell.value.set(ptar.x, ptar.z, 3.4, 0); }
    // the rare ptarmigan has been roosting in the snow over the hall: as it kicks off, one feather-shod foot punches the roof open
    let ptarFoot = null;
    if (rare) {
      const g = new Soup(), claw = [0.03, 0.03, 0.04], fc = (t, a) => { const k = 0.8 + 0.2 * Math.sin(a * 7 + t * 23); return [0.86 * k, 0.9 * k, 0.95 * k]; };
      g.tube([new V3(0, 13, -1.5), new V3(0, 6, -0.6), new V3(0, 1.6, 0)], (t) => 1.25 - 0.35 * t, 9, fc, null, false);
      for (const a of [-0.6, 0, 0.6, Math.PI]) {
        const l = a > 3 ? 1.5 : 3.1, dx = Math.sin(a), dz = Math.cos(a);
        g.tube([new V3(0, 1.6, 0), new V3(dx * l * 0.45, 1.0, dz * l * 0.45), new V3(dx * l, 0.55, dz * l)], (t) => 0.85 - 0.3 * t, 7, fc, null, true);
        g.tube([new V3(dx * l, 0.6, dz * l), new V3(dx * (l + 0.5), 0.5, dz * (l + 0.5)), new V3(dx * (l + 0.9), 0.1, dz * (l + 0.9))], (t) => 0.2 * (1 - 0.8 * t), 5, () => claw, null, true);
      }
      ptarFoot = new THREE.Mesh(g.build(), plantMat); ptarFoot.frustumCulled = false; ptarFoot.visible = false;
      ptarFoot.scale.setScalar(0.8); ptarFoot.rotation.y = 2.2; ptarFoot.position.set(ptar.x, ptar.y, ptar.z); scene.add(ptarFoot);
      await ctx.yield();
    }

    // ---- the cast. Every gait phase is distance along the animal's own route divided by its stride.
    const umber = lin('#74502f'), umberB = lin('#6e5a48'), bellyC = lin('#857b70'), gold = lin('#c08a34'), tawny = lin('#8e5c22'), blackC = lin('#15110e'), white = lin('#c3ccd2'), cream = lin('#a9a78e'), umberD = lin('#3c2a1c'), creamL = lin('#a89a78'), chestC = lin('#b3a48e');
    // The animal we follow is built to be read from behind: a low round rump that narrows forward to the shoulders, the head carried a
    // little above the line of the back so that both ears stand clear of the rump from the eye's height, a short tail, hind feet that
    // flick up pale soles. Its coat has no tufts of its own: CRIT_FS draws the locks of the fur in its shading and a fringe of hair
    // that stands in ragged tufts along its outline (fringe). At the run, on its own stride: the hind feet roll up onto their toes and
    // kick back in turn, soles to the eye, low behind the rump; each thigh works with its foot (haunchK, metres); the tail is carried
    // up and bobs (tailUp, metres at its tip).
    // a Norway lemming's coat. own: the animal we follow (its stripe is drawn in CRIT_FS, uLemStripe; its rump is one warm tawny mass, buff
    // along the lower edge); otherwise the stripe runs the whole back in the colours of the mesh
    const lemCoat = (own) => (zf, sy, c = 0) => {
      let k = mixc(mixc(creamL, gold, sstep(-0.95, -0.6, sy)), tawny, 0.45 * sstep(-0.2, 0.8, sy));
      if (own) { const rump = 1 - sstep(0.2, 0.44, zf); k = mixc(mixc(k, lin('#a4692a'), rump * sstep(-0.7, -0.2, sy)), lin('#c9a868'), 0.75 * rump * (1 - sstep(-0.9, -0.45, sy))); }
      else k = mixc(k, blackC, 0.92 * Math.exp(-(c * c) / 0.085) * sstep(0, 0.4, sy));
      // head and shoulders above the cheek: black on the lemmings of the hall; on the animal we follow the body's own tawny, a
      // shade deeper (its black is the stripe, which runs on over the crown between the ears, and the ears)
      const cap = sstep(0.5, 0.6, zf + 0.04 * sy) * sstep(-0.42, -0.08, sy + 0.2 * sstep(0.56, 0.74, zf));
      k = own ? mixc(k, lin('#6a4218'), 0.5 * cap) : mixc(k, blackC, cap);
      return zf > 0.97 ? mixc(k, lin('#6a4a40'), 0.7) : k;
    };
    const voleSpec = {
      len: 11, stride: 6, lift: 1.15, rim: 0.9, vivid: 0.78, neckZ: 0.72, hipY: 1.9, hipZ: -3.3, stem: true, fin: 0, sides: 28, rings: 40, smooth: true, fringe: { len: VOLE_FRINGE, rings: 40, sides: 28 }, soft: 1, furC: 0.4, haunch: VOLE_HAUNCH, knee: 0.5, gain: lemmings ? 1.0 : 1.2, under: lemmings ? 0.6 : 0.55, furK: 1, stripe: lemmings ? 0 : 1, snout: 0.03, kick: 2.0, footRot: 1.05, bob: 0.3, roll: 0.13,
      haunchK: VOLE_HAUNCHK, tailUp: lemmings ? 0.45 : 0.75, band: lemmings ? 1 : 0,
      rows: VOLE_ROWS,
      // a vole: dark umber back, darker along the spine, grey-brown flanks, a paler belly only underneath.
      // a Norway lemming: a tawny-gold back with a black stripe down the spine and on over the crown, a head of the body's own
      // tawny a shade deeper, black ears, the chin and throat pale, cream underneath: from behind, a striped gold rump with the
      // head and its dark ears over it (the lemmings of the hall have the black head and shoulders of their kind)
      coat: lemmings ? lemCoat(true)
        : (zf, sy) => mixc(mixc(mixc(mixc(bellyC, umberB, sstep(-0.95, -0.55, sy)), umber, sstep(-0.45, 0.15, sy)), umberD, sstep(0.4, 1, sy) * 0.6), chestC, 0.8 * sstep(0.46, 0.58, zf) * sstep(0.84, 0.76, zf) * sstep(-0.15, -0.6, sy)),
      ear: lemmings ? { z: 0.775, x: 1.3, up: 0.86, r: 0.7, yaw: 0.9, seg: 18, fur: 0 } : { z: 0.775, x: 1.34, up: 0.94, r: 0.92, yaw: 0.9, seg: 22, fur: 0 },
      earIn: lemmings ? lin('#7a564c') : lin('#c8a295'), earOut: lemmings ? blackC : lin('#6f5646'), eye: { z: 0.87, r: lemmings ? 0.29 : 0.28 },
      tail: { len: lemmings ? 1.5 : 2.4, r: 0.24, droop: 0.35, lift: 0.1, point: true, col: lemmings ? lin('#b08a52') : lin('#8a705c'), tip: lemmings ? lin('#c9ad7c') : lin('#a58c78') },
      legs: [{ z: 0.16, x: 1.5, hip: 1.3, knee: 0.5, foot: 1.5, r: 0.4, ph: 0, alt: 0.5, sole: 0.33, toes: 4 }, { z: 0.63, x: 1.25, hip: 1.1, knee: 0.3, foot: 0.85, r: 0.3, ph: 0.5, alt: 0.5, sole: 0.2, toes: 3 }],
      paw: lin('#8a6a62'), sole: lin('#e6c4b6'), toe: lin('#d6b0a2'),
    };
    // (the make and gait of the voles of the hall, where theirs is not the followed animal's: thighs that do not work, a level tail, a blunt tail's end)
    const hallKeep = { coat: lemmings ? lemCoat(false) : voleSpec.coat, lift: 1.75, footRot: 1.5, roll: 0.09, haunchK: 0, tailUp: 0, band: 0, sole: lin('#d2b4aa'), toe: lin('#c9aaa0'),
      tail: { ...voleSpec.tail, r: 0.2, point: false, col: lemmings ? tawny : umber, tip: lemmings ? tawny : umber }, legs: [{ ...voleSpec.legs[0], sole: 0.38, foot: 1.9 }, voleSpec.legs[1]] };
    // the ermine: a long body with a deep chest and haunch and a narrow waist, carried high on its legs; it bounds
    // (short ground contact, back humped as the hind feet land), and its white coat keeps a blue shadow side
    const ermSpec = {
      len: 25, stride: 30, lift: 1.5, duty: 0.16, rim: 0.4, vivid: 0.72, neckZ: 0.78, hipY: 3.2, hipZ: -8, fin: 0.36, tufts: 2, fill: 0.12, gain: 0.9, under: 1, furK: 1, furC: 2.3, whip: 1, snout: 0.02, kick: 0.6, legSub: true, legCoat: lin('#bcc5cb'), footRot: 1.1, bob: 0.1, roll: 0.03, archZ: 0.4,
      rows: [[0, 3.2, 0.3, 0.3], [0.04, 3.3, 1.5, 1.4], [0.12, 3.4, 2.1, 1.95], [0.24, 3.35, 1.95, 1.8], [0.40, 3.3, 1.55, 1.45], [0.55, 3.35, 1.7, 1.55], [0.66, 3.45, 2.0, 1.8], [0.76, 3.95, 1.5, 1.35], [0.85, 4.35, 1.5, 1.5], [0.93, 4.2, 1.1, 1.15], [0.98, 4.0, 0.55, 0.6], [1, 3.95, 0.1, 0.1]],
      coat: (zf, sy) => (zf > 0.985 ? blackC : mixc(cream, white, sstep(-0.5, 0.25, sy))),
      ear: { z: 0.835, x: 1.1, up: 0.8, r: 0.72, yaw: 0.5 }, earIn: lin('#b9a6a0'), earOut: white, eye: { z: 0.915, r: 0.27 },
      tail: { len: 9, r: 0.8, droop: 0.2, lift: 1.2, curl: 2.5, col: white, tip: weasel ? white : blackC, tipFrom: 0.42, brush: 1.2 },
      legs: [{ z: 0.12, x: 1.55, hip: 3.0, knee: 1.0, foot: 2.5, r: 0.66, ph: 0, alt: 0.05, sole: 0.55 }, { z: 0.66, x: 1.4, hip: 3.0, knee: 0.5, foot: 1.7, r: 0.6, ph: 0.5, alt: 0.05, sole: 0.5 }],
      paw: lin('#b9bcc0'), sole: lin('#8f8a8c'),
    };
    const shrewSpec = {
      len: 7.2, stride: 1.5, lift: 0.3, rim: 1.1, vivid: 0.9, neckZ: 0.62, hipY: 1.0, hipZ: -2.2, fin: 0.24, tufts: 2, furK: 1, furC: 0.45, under: 0.45, snout: 0.2,
      rows: [[0, 1.0, 0.15, 0.15], [0.05, 1.05, 0.75, 0.8], [0.17, 1.1, 1.05, 1.15], [0.34, 1.1, 1.1, 1.2], [0.5, 1.05, 1.0, 1.05], [0.6, 1.0, 0.82, 0.8], [0.7, 0.92, 0.6, 0.55], [0.8, 0.84, 0.4, 0.36], [0.9, 0.78, 0.24, 0.22], [0.97, 0.76, 0.15, 0.14], [1, 0.76, 0.05, 0.05]],
      // a water shrew: velvet slate-black above, silver-white below, the two meeting in a sharp line along the flank; a pink snout;
      // a white tuft behind the eye; a dark tail
      coat: (zf, sy) => (zf > 0.93 ? lin('#b98c82') : mixc(mixc(lin('#b4babc'), lin('#26221f'), sstep(-0.42, -0.22, sy)), lin('#b4babc'), 0.85 * sstep(0.6, 0.64, zf) * sstep(0.7, 0.66, zf) * sstep(-0.1, 0.1, sy) * sstep(0.55, 0.35, sy))),
      ear: { z: 0.6, x: 0.62, up: 0.6, r: 0.2 }, earIn: lin('#7a625c'), earOut: lin('#26221f'), eye: { z: 0.69, r: 0.13 },
      tail: { len: 4.6, r: 0.17, droop: 0.3, lift: 0.5, col: lin('#3a332e'), tip: lin('#3a332e') },
      legs: [{ z: 0.16, x: 0.85, hip: 0.5, knee: 0.15, foot: 0.5, r: 0.17, ph: 0, alt: 0.5, sole: 0.14, toes: 3 }, { z: 0.5, x: 0.7, hip: 0.5, knee: 0.1, foot: 0.34, r: 0.15, ph: 0.5, alt: 0.5, sole: 0.12, toes: 3 }],
      paw: lin('#a98a84'), sole: lin('#b79a94'),
    };
    const critters = [];
    const makeCritter = (spec, geo, scale = 1, t0 = 0) => {
      const ank = new THREE.Vector4(), footL = new THREE.Vector2();
      if (spec.legs && spec.legs.length) { const [h, f] = spec.legs, z = (l) => (l.z - 0.5) * spec.len + l.knee * 0.3; ank.set(h.r * 0.9, z(h), f.r * 0.9, z(f)); footL.set(h.foot - h.knee * 0.3, f.foot - f.knee * 0.3); }
      const mat = mk(U, { vs: CRIT_VS, fs: CRIT_FS, uniforms: {
        uPhase: { value: 0 }, uRun: { value: 0 }, uSit: { value: 0 }, uStride: { value: spec.stride }, uLift: { value: spec.lift }, uArch: { value: 0 }, uLen: { value: spec.len },
        uSnout: { value: spec.snout }, uHipZ: { value: spec.hipZ }, uHipY: { value: spec.hipY }, uNeckZ: { value: spec.neckZ }, uWhip: { value: spec.whip || 0 }, uT0: { value: t0 },
        uRimK: { value: spec.rim }, uVivid: { value: spec.vivid }, uFillK: { value: spec.fill || 0 }, uGain: { value: spec.gain ?? 1 }, uUnder: { value: spec.under || 0 }, uDuty: { value: spec.duty || 0.5 },
        uTailDrop: { value: spec.tail ? spec.tail.lift : 0 }, uKnee: { value: spec.knee || 0 }, uFurK: { value: spec.furK ?? 0 }, uFurC: { value: spec.furC ?? 1 }, uStripe: { value: spec.stripe || 0 }, uKick: { value: spec.kick || 0 }, uFootRot: { value: spec.footRot || 0 }, uBob: { value: spec.bob ?? 0.1 }, uRoll: { value: spec.roll || 0 }, uArchZ: { value: spec.archZ ?? 0.5 }, uAnk: { value: ank }, uFootL: { value: footL }, uLook: { value: 0 }, uAhead: { value: new THREE.Vector2() }, uRimA: { value: 0 }, uFringe: { value: 0 }, uSoft: { value: spec.soft || 0 }, uHaunch: { value: spec.haunchK || 0 }, uTailUp: { value: spec.tailUp || 0 }, uLemStripe: { value: spec.band || 0 } } });
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.scale.setScalar(scale); scene.add(mesh);
      // its soft outline rides on it: the same shader and the same uniforms (the same objects, so every pose reaches both), blended, drawn
      // after everything else that is see-through
      if (geo.userData.fringe) {
        const fm = mk(U, { vs: CRIT_VS, fs: CRIT_FS, transparent: true, depthWrite: false, uniforms: { ...mat.uniforms, uFringe: { value: 1 } } });
        const fr2 = new THREE.Mesh(geo.userData.fringe, fm); fr2.frustumCulled = false; fr2.renderOrder = 6; mesh.add(fr2);
      }
      const c = { mesh, u: mat.uniforms, spec, scale }; critters.push(c); return c;
    };
    const put = (c, x, y, z, dx, dz) => { c.mesh.position.set(x, y, z); c.mesh.rotation.y = Math.atan2(dx, dz); };
    const curveOf = (P) => { const cv = new THREE.CatmullRomCurve3(P.map((p) => new V3(p[0], p[2] ?? 0, p[1]))); cv.arcLengthDivisions = 120; return { cv, len: cv.getLength() }; };
    const wpt = (s, t) => { toW(s, t); return [W_.x, W_.z, Fat(s, t)]; };
    const bpt = (b, k) => { const p = BR[b].P[Math.min(k, BR[b].P.length - 1)]; return [p[0], p[1], -0.08]; };
    const cp = new V3(), ct = new V3();
    const along = (c, R, d) => { const q = clamp(d / R.len, 0, 1); R.cv.getPointAt(q, cp); R.cv.getTangentAt(q, ct); put(c, cp.x, cp.y, cp.z, ct.x, ct.z); return cp; };

    const voleGeo = mammalGeometry(voleSpec);
    await ctx.yield();
    const vole = makeCritter(voleSpec, voleGeo); vole.mesh.name = 'followed';
    // An animal's whole run is a list of knots [u, s, t]: a monotone cubic through them (so it stands still where two knots agree),
    // sampled into a table of position, heading and distance run. Every gait phase is that distance over the stride.
    const pchip = (K, c) => {
      const n = K.length, d = new Float64Array(n), m = new Float64Array(n - 1);
      for (let i = 0; i + 1 < n; i++) m[i] = (K[i + 1][c] - K[i][c]) / (K[i + 1][0] - K[i][0]);
      for (let i = 1; i + 1 < n; i++) d[i] = m[i - 1] * m[i] <= 0 ? 0 : 2 * m[i - 1] * m[i] / (m[i - 1] + m[i]);
      d[0] = m[0]; d[n - 1] = m[n - 2];
      return (u) => {
        if (u <= K[0][0]) return K[0][c]; if (u >= K[n - 1][0]) return K[n - 1][c];
        let i = 0; while (u > K[i + 1][0]) i++;
        const h = K[i + 1][0] - K[i][0], x = (u - K[i][0]) / h, x2 = x * x, x3 = x2 * x;
        return (2 * x3 - 3 * x2 + 1) * K[i][c] + (x3 - 2 * x2 + x) * h * d[i] + (3 * x2 - 2 * x3) * K[i + 1][c] + (x3 - x2) * h * d[i + 1];
      };
    };
    const makeRoute = (K, yOff = 0.05) => {
      const fs = pchip(K, 1), ft = pchip(K, 2), u0 = K[0][0], u1 = K[K.length - 1][0], N = Math.ceil((u1 - u0) / 0.00025) + 2, du = (u1 - u0) / (N - 1);
      const X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N), HX = new Float32Array(N), HZ = new Float32Array(N), D = new Float32Array(N), V = new Float32Array(N);
      let hx = 0, hz = 0, dist = 0, first = -1;
      for (let i = 0; i < N; i++) {
        const u = u0 + du * i, sv = fs(u), tv = ft(u); toW(sv, tv); X[i] = W_.x; Z[i] = W_.z; Y[i] = Fat(sv, tv) + yOff;
        if (i > 0) { const dx = X[i] - X[i - 1], dz = Z[i] - Z[i - 1], dl = Math.hypot(dx, dz); dist += dl; V[i] = dl / (du * L); if (dl > 0.012) { hx = dx / dl; hz = dz / dl; if (first < 0) first = i; } }
        HX[i] = hx; HZ[i] = hz; D[i] = dist;
      }
      for (let i = 0; i < Math.max(first, 0); i++) { HX[i] = HX[first]; HZ[i] = HZ[first]; }
      // the heading is eased over a few samples, so a turn is a turn and not a snap
      const sx = new Float32Array(N), sz = new Float32Array(N);
      for (let i = 0; i < N; i++) { let ax = 0, az = 0; for (let k = -8; k <= 8; k++) { const j = clamp(i + k, 0, N - 1); ax += HX[j]; az += HZ[j]; } const l = Math.hypot(ax, az) || 1; sx[i] = ax / l; sz[i] = az / l; }
      return { u0, u1, at(u, o) {
        const f = clamp((u - u0) / du, 0, N - 1.001), i = Math.floor(f), k = f - i;
        o.x = lerp(X[i], X[i + 1], k); o.y = lerp(Y[i], Y[i + 1], k); o.z = lerp(Z[i], Z[i + 1], k); o.hx = lerp(sx[i], sx[i + 1], k); o.hz = lerp(sz[i], sz[i + 1], k); o.d = lerp(D[i], D[i + 1], k); o.v = lerp(V[i], V[i + 1], k);
        return o;
      } };
    };
    // Our vole sits upright in the arch with a stem at its mouth, drops and runs, and runs the whole way to its side hole without a
    // stop, along its own line (VT). Its lead on the eye is one smooth function of u, measured to the middle of its body: 21.6 m (some
    // 16 m to its heels), the nearest at which the whole animal, ears and all, stays under 0.28 of the frame's height. Twice the
    // ermine hunts it (the brief's beats, u 0.27 and u 0.61): each time it bolts, is across the ermine's line before the ermine is, and
    // lets us come up with it again over the next stretch; so the ermine crosses between it and us with nothing in front of it
    const voleLead = (q) => 21.6 + 22.4 * sstep(0.232, 0.266, q) * (1 - sstep(0.28, 0.345, q)) + 18 * sstep(0.585, 0.612, q) * (1 - sstep(0.622, 0.675, q)) + 2.5 * sstep(0.70, 0.752, q);
    const voleK = [[0, 24, 0], [0.012, 24, 0]];
    for (let ks = 30; ks <= 589.5; ks = ks < 588 ? Math.min(ks + 3, 588) : ks + 1.5) {
      let a = 0.012, b = 0.9;
      for (let it = 0; it < 30; it++) { const m = (a + b) / 2; if (m * L + voleLead(m) < ks) a = m; else b = m; }
      voleK.push([(a + b) / 2, ks, voleT(ks)]);
    }
    const VOLE_RUN = makeRoute(voleK);
    await ctx.yield();
    const RO = { x: 0, y: 0, z: 0, hx: 0, hz: -1, d: 0, v: 0 };
    const ermScale = weasel ? 0.88 : 1;
    const ermine = makeCritter(ermSpec, mammalGeometry(ermSpec), ermScale, 2); ermine.mesh.name = 'ermine';
    await ctx.yield();
    // each run is timed so that at its beat (uk) the animal is at the route point nearest 'at', mid-crossing; X, Z: the route in 201 steps
    const ermRun = (uk, at, w, arch, P) => {
      const R = curveOf(P), X = new Float32Array(201), Z = new Float32Array(201); let k = 0, best = 1e9;
      for (let i = 0; i <= 200; i++) { R.cv.getPointAt(i / 200, cp); X[i] = cp.x; Z[i] = cp.z; const d = Math.hypot(cp.x - at[0], cp.z - at[1]); if (d < best) { best = d; k = i / 200; } }
      return { u0: uk - k * w, u1: uk + (1 - k) * w, arch, R, X, Z, at };
    };
    const ermRuns = [
      // the hall (the brief's beat: u 0.27, 34 m ahead): out of the gallery on the left at the hall's far end, across the floor and
      // across our line, on toward the feeding places and out by the burrow on the right
      ermRun(0.27, wpt(235.4, 0), 0.07, 4.9, [bpt(0, 11), bpt(0, 9), bpt(0, 7), wpt(236.3, -10), wpt(235.4, 0), wpt(232.6, 9), wpt(229.4, 20), bpt(1, 8), bpt(1, 10), bpt(1, 13)]),
      // the lichen garden: out of a burrow on the left and across the floor into the one on the right, with our vole going away beyond it
      ermRun(0.6175, wpt(489, -1), 0.085, 3.4, [bpt(5, 9), bpt(5, 7), bpt(5, 5), wpt(493, -8), wpt(489, -1), wpt(488.2, 5.5), bpt(7, 3), bpt(7, 5), bpt(7, 8)]),
    ];
    // where the ermine is on its run r at u: the point of its route into p and its heading into t; the share of the run done is returned
    const ermAt = (r, u, p, t) => { const q = clamp((u - r.u0) / (r.u1 - r.u0), 0, 1); r.R.cv.getPointAt(q, p); r.R.cv.getTangentAt(q, t); return q; };
    await ctx.yield();
    // the hall voles feed side on to us, each facing the burrow on the right (BR 10); each bolts for it along its own line, fixed in
    // the world, when the ermine comes within 34 m of its feeding place
    const hallGeo = mammalGeometry({ ...voleSpec, ...hallKeep, fringe: null, smooth: false, rings: 26, fin: 0.4, tufts: 2, sides: 16, ear: { ...voleSpec.ear, fur: lemmings ? 0.3 : 0.16 } });
    const hallSpec = { ...voleSpec, ...hallKeep, soft: 0, furC: 1, gain: 0.85, under: 0 };
    await ctx.yield();
    const hallVoles = []; let hi = 0;
    deal('hall-voles');
    for (const [hs, ht] of homes) {
      const i = hi++, sc0 = 1.05 + 0.08 * (sr.range(1.08, 1.2) - 1.08) / 0.12, c = makeCritter(hallSpec, hallGeo, i === 0 ? 1.1 : i === 1 ? 1.0 : sc0, i * 3.7 + 1);
      const h = wpt(hs, ht), ms = (hs + 206.5) / 2 + (i % 3 - 1) * 1.6, mt = (ht + 31) / 2, e0 = ermRuns[0]; c.home = h;
      c.ub = e0.u1; for (let k = 0; k <= 200; k++) if (Math.hypot(e0.X[k] - h[0], e0.Z[k] - h[1]) < 34) { c.ub = lerp(e0.u0, e0.u1, k / 200); break; }
      c.yaw = Math.atan2(mt - ht, ms - hs) + sr.range(-0.5, 0.5) * 0.6;
      c.R = curveOf([h, wpt(ms, mt), bpt(10, 11), bpt(10, 13), bpt(10, 15)]);
      c.u.uGain.value = 0.85; c.u.uKnee.value = 0.7;
      fr(hs); c.dir = [F_.tx, F_.tz]; hallVoles.push(c);
      if (i % 3 === 2) await ctx.yield();
    }
    await ctx.yield();
    // the shrew drinks at the edge of the meltwater pool, side on to us, then patters away down the bank and out with the water. Its
    // law, in metres of the way: it sits at its place on the bank (SHREW_AT: 337 m along, 5.2 m to the right) from when the eye is
    // 68.5 m short of it (SHREW_SEEN) until the eye is 16 m off (SHREW_LEAD); then it goes, keeping that lead down the bank for its
    // first 7 m, and turns off to the wall with the eye gaining on it: 14.5 m, 13.3 m and, as it goes into the wall at 356 m,
    // 12.3 m ahead (SHREW_RUN: where it is, and how far ahead of the eye it is there). So it is seen whole, an animal on its feet,
    // and never as a flank filling the side of the view. Each key of its route is the eye's metre there (the shrew's metre less its
    // lead) over the way's length
    const shrew = makeCritter(shrewSpec, mammalGeometry(shrewSpec), 1.3, 5);
    const SHREW_AT = [337, 5.2], SHREW_SEEN = 68.5, SHREW_LEAD = 16, SHREW_RUN = [[344, 4.8, SHREW_LEAD], [348.5, 4.4, 14.5], [352.5, 7, 13.3], [356, 11, 12.3]];
    const shrewR = makeRoute([[(SHREW_AT[0] - SHREW_SEEN) / L, ...SHREW_AT], [(SHREW_AT[0] - SHREW_LEAD) / L, ...SHREW_AT], ...SHREW_RUN.map(([s, t, lead]) => [(s - lead) / L, s, t])], 0.02);
    const shrewFace = wpt(337.6, -3);
    shrew.u.uGain.value = 1.7; shrew.u.uRimK.value = 1.7;
    await ctx.yield();

    // the fox: it has heard us through the snow and dug. A russet muzzle with a black nose comes down through the roof in a burst of
    // daylight, snuffing, and one black-stockinged forepaw rakes beside it. Both are driven by how far off we are along our way (see update), and are gone before we pass under.
    const uPx = { value: 400 };
    const foxRu = lin('#b4521a'), foxRu2 = lin('#cc7a2e'), foxDk = lin('#2c1a10'), foxBr = lin('#6a3212'), foxW = lin('#c8c6ba'), foxBlk = lin('#120e0b'), foxCream = lin('#bcae96'), foxPink = lin('#8c5a50');
    const mkFur = () => {
      const P = [], BN = [], F = [], C = [], I = []; let n = 0;
      return {
        v(p, b, f0, f1, f2, f3, c) { P.push(p.x, p.y, p.z); BN.push(b.x, b.y, b.z); F.push(f0, f1, f2, f3); C.push(c[0], c[1], c[2]); return n++; },
        tri(a, b, c) { I.push(a, b, c); },
        build() {
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aBN', new THREE.Float32BufferAttribute(BN, 3));
          g.setAttribute('aF', new THREE.Float32BufferAttribute(F, 4)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals(); g.computeBoundingSphere(); return g;
        },
      };
    };
    const fxP = new V3(), fxA = new V3(), fxB = new V3(), fxFl = new V3(), fxSd = new V3(), fxN = new V3(), fxD = new V3(), fxQ = new V3(), fxS = new V3(), fxT = new V3(), ZV = new V3(0, 0, 1), YV = new V3(0, 1, 0);
    const fhash = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
    // a lofted surface from sections [z, centre y, radius up, radius down, radius across], joined by a smooth curve; bump(z, a) swells it
    const furSurf = (ROWS, bump, ox = 0) => {
      const n = ROWS.length, o = [0, 0, 0, 0, 0];
      const rowAt = (z) => {
        let i = 0; while (i < n - 2 && z > ROWS[i + 1][0]) i++;
        const t = clamp((z - ROWS[i][0]) / (ROWS[i + 1][0] - ROWS[i][0]), 0, 1), t2 = t * t, t3 = t2 * t, a = ROWS[Math.max(i - 1, 0)], b = ROWS[i], c = ROWS[i + 1], d = ROWS[Math.min(i + 2, n - 1)];
        for (let k = 1; k < 5; k++) o[k] = Math.max(0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - 3 * c[k] + d[k] - a[k]) * t3), k === 1 ? -99 : 0.03);
        return o;
      };
      const pt = (z, a, out) => {
        const r = rowAt(z), c = Math.cos(a), s = Math.sin(a), k = 1 + (bump ? bump(z, a) : 0);
        return out.set(ox + Math.sign(c) * Math.pow(Math.abs(c), 0.9) * r[4] * k, r[1] + Math.sign(s) * Math.pow(Math.abs(s), 0.9) * (s > 0 ? r[2] : r[3]) * k, z);
      };
      // at (z, a): the point fxP, the lie of the coat fxFl (toward the back), across it fxSd, the outward normal fxN
      const frame = (z, a) => {
        pt(z, a, fxP); pt(z - 0.06, a, fxA); pt(z, a + 0.03, fxB); const cy = rowAt(z)[1];
        fxFl.copy(fxA).sub(fxP); if (fxFl.lengthSq() < 1e-10) fxFl.set(0, 0, -1); fxFl.normalize();
        fxSd.copy(fxB).sub(fxP); if (fxSd.lengthSq() < 1e-10) fxSd.set(1, 0, 0); fxSd.normalize();
        fxN.crossVectors(fxSd, fxFl); if (fxN.lengthSq() < 1e-10) fxN.set(0, 1, 0); fxN.normalize(); if (fxN.x * (fxP.x - ox) + fxN.y * (fxP.y - cy) < 0) fxN.negate();
        fxSd.crossVectors(fxFl, fxN).normalize();
      };
      return { pt, frame, rowAt, z0: ROWS[0][0], z1: ROWS[n - 1][0] };
    };
    // one lock of fur: root R0, pointing along D, S across, N0 the skin's normal; it lifts off the coat and bends back to it at the tip
    const lock = (fb, R0, D, S, N0, len, hw, hh, col, colTip) => {
      const i0 = [];
      for (let r = 0; r < 3; r++) for (const c of [-1, 1]) {
        const a = r * 0.5; fxQ.copy(R0).addScaledVector(D, len * a).addScaledVector(S, hw * c).addScaledVector(N0, -0.05 - 0.16 * len * a * a);
        i0.push(fb.v(fxQ, N0, c, a, hh, 1, r === 2 && colTip ? colTip : col));
      }
      fb.tri(i0[0], i0[1], i0[3]); fb.tri(i0[0], i0[3], i0[2]); fb.tri(i0[2], i0[3], i0[5]); fb.tri(i0[2], i0[5], i0[4]);
    };
    // skin and coat over a surface. o: NZ, NA, zOf(t 0..1), coat(z, a, P) -> colour, len(z, a) -> length of the fur there (0: none),
    // lift(z, a) -> how far it stands off, skip(root, tip, z, a), step: rows of locks per unit of fur length
    const furBody = async (fb, S, o) => {
      const rings = [];
      for (let j = 0; j <= o.NZ; j++) {
        const z = o.zOf(j / o.NZ), ring = [];
        for (let k = 0; k < o.NA; k++) { const a = k / o.NA * TAU; S.frame(z, a); ring.push(fb.v(fxP, fxN, Math.sin(a), 0, fhash(j, k), 0, o.coat(z, a, fxP))); }
        rings.push(ring);
      }
      for (let j = 0; j < o.NZ; j++) for (let k = 0; k < o.NA; k++) { const k1 = (k + 1) % o.NA; fb.tri(rings[j][k], rings[j][k1], rings[j + 1][k1]); fb.tri(rings[j][k], rings[j + 1][k1], rings[j + 1][k]); }
      let z = S.z1 - 0.05, row = 0;
      while (z > S.z0 + 0.1) {
        const L0 = Math.max(o.len(z, 1.2), o.len(z, 0), o.len(z, -1.2), 0.3), r = S.rowAt(z), circ = Math.PI * (0.5 * (r[2] + r[3]) + r[4]), nk = Math.max(6, Math.round(circ / (L0 * 0.36)));
        for (let k = 0; k < nk; k++) {
          const h1 = fhash(row * 1.37 + 3.1, k + 0.7), h2 = fhash(k * 2.11 + 9.3, row + 5.1), h3 = fhash(row + 0.37, k * 1.7 + 2.9);
          const a = (k + (row % 2) * 0.5 + (h1 - 0.5) * 0.6) / nk * TAU, zz = z + (h2 - 0.5) * L0 * 0.3, len0 = o.len(zz, a); if (len0 <= 0) continue;
          const len = len0 * (0.75 + 0.5 * h3), lift = o.lift(zz, a) + (h2 - 0.5) * 0.14;
          S.frame(zz, a);
          fxD.copy(fxFl).multiplyScalar(Math.cos(lift)).addScaledVector(fxN, Math.sin(lift)).addScaledVector(fxSd, (h1 - 0.5) * 0.5).normalize();
          fxS.crossVectors(fxN, fxD).normalize(); fxT.copy(fxP).addScaledVector(fxD, len * 0.75);
          if (o.skip && o.skip(fxP, fxT, zz, a)) continue;
          lock(fb, fxP, fxD, fxS, fxN, len, len * (0.2 + 0.1 * h1), h1, o.coat(zz, a, fxP), o.tip ? o.tip(zz, a) : null);
        }
        z -= L0 * (o.step || 0.3); row++;
        if ((row & 3) === 3) await ctx.yield();
      }
    };
    // the head, nose toward +z: neck and occiput, the broad cheeks, brow and stop, the long narrow muzzle
    const foxGeo = await (async () => {
      const fb = mkFur(), aEye = 0.72, zEye = -0.25, EYER = 0.98;
      const angD = (a, b) => { let d = a - b; d -= Math.round(d / TAU) * TAU; return d; };
      const bump = (z, a) => {
        let k = 0;
        for (const a0 of [aEye, Math.PI - aEye]) {
          const d = angD(a, a0) * (a0 < 1.57 ? 1 : -1);                                         // d > 0: toward the crown
          k -= 0.07 * Math.exp(-(((z - zEye) / 0.8) ** 2) - ((d / 0.2) ** 2));                  // the socket
          k += 0.075 * Math.exp(-(((z + 0.95) / 0.9) ** 2) - (((d - 0.3) / 0.2) ** 2));          // the brow over it
        }
        return k;
      };
      const S = furSurf([[-11, 0.7, 4.7, 4.5, 4.6], [-8, 0.7, 4.8, 4.5, 4.8], [-5.5, 0.6, 4.6, 4.3, 4.9], [-3.2, 0.35, 4.3, 4.0, 5.0], [-1.4, 0.1, 3.9, 3.6, 4.5], [-0.2, -0.15, 3.3, 3.3, 3.7],
        [1.0, -0.5, 2.5, 2.8, 2.75], [2.3, -0.78, 1.95, 2.25, 2.1], [3.8, -0.9, 1.7, 1.9, 1.75], [5.2, -0.95, 1.5, 1.6, 1.45], [6.1, -0.95, 1.22, 1.3, 1.15], [6.6, -0.9, 0.8, 0.85, 0.8], [6.9, -0.88, 0.1, 0.1, 0.1]], bump);
      // eyes: where each sits, which way it looks, its own axes (u toward the nose and a little down, v up)
      const EYES = [aEye, Math.PI - aEye].map((a0, i) => {
        S.frame(zEye, a0); const e = fxN.clone().multiplyScalar(0.8).addScaledVector(ZV, 0.5).addScaledVector(YV, 0.12).normalize(), c = fxP.clone().addScaledVector(fxN, -0.06);
        const ex = ZV.clone().addScaledVector(e, -e.z).normalize(), ey = new V3().crossVectors(e, ex); if (ey.y < 0) ey.negate();
        ex.addScaledVector(ey, -0.3).normalize(); ey.crossVectors(e, ex); if (ey.y < 0) ey.negate();
        return { c, e, ex, ey, sd: i ? -1 : 1 };
      });
      const eyeD = (p) => Math.min(p.distanceTo(EYES[0].c), p.distanceTo(EYES[1].c));
      const sLip = (z) => -0.34 + 0.3 * sstep(5.3, 6.6, z) - 0.1 * sstep(3.6, 2.5, z);
      const coat = (z, a, P) => {
        const s = Math.sin(a), n = 0.5 + 0.5 * noise.n3(z * 0.45, s * 2.2, Math.cos(a) * 2.2 + 7);
        let c = mixc(foxRu, foxRu2, n);
        c = mixc(c, foxBr, 0.4 * sstep(0.6, 0.98, s) * sstep(-7, -2, z) * (1 - sstep(0, 1.5, z)));          // the crown a shade deeper
        c = mixc(c, foxDk, 0.8 * sstep(0.3, 0.8, s) * sstep(1.0, 5.0, z));                                  // the bridge darkens to black-brown
        c = mixc(c, foxDk, 0.85 * Math.exp(-(((s - 0.36) / 0.2) ** 2)) * sstep(0.0, 0.9, z) * (1 - sstep(3.0, 4.4, z)));   // the dark line from eye to whiskers
        const sW = z > 2.2 ? lerp(0.0, 0.12, sstep(2.2, 4.5, z)) : z > -1.5 ? lerp(-0.22, 0.0, sstep(-1.5, 2.2, z)) : lerp(-0.5, -0.22, sstep(-7, -1.5, z));
        c = mixc(c, foxW, 1 - sstep(sW - 0.1, sW + 0.14, s + 0.14 * (n - 0.5)));                             // white chin, lips, cheeks and throat
        c = mixc(c, foxBlk, Math.max(sstep(6.2, 6.5, z), P ? 1 - sstep(0.85, 1.5, eyeD(P)) : 0));           // black skin round the nose and the eyes
        return c;
      };
      const ruffK = (z, a) => sstep(0.3, 0.8, Math.abs(Math.cos(a))) * (1 - sstep(0.1, 0.65, Math.sin(a))) * sstep(0.9, -1.2, z) * (1 - sstep(-6, -9.5, z));
      await furBody(fb, S, {
        NZ: 46, NA: 30, zOf: (t) => S.z0 + (S.z1 - S.z0) * (1 - Math.pow(1 - t, 1.5)), coat,
        // (the ruff of the cheeks is a little longer than the coat about it and lies nearly as close: fur, not a fan standing off the jaw)
        len: (z, a) => (z > 6.2 ? 0 : (z > 2.6 ? 0.62 : z > 0 ? lerp(1.2, 0.62, z / 2.6) : lerp(1.2, 1.9, sstep(0, -7, z))) * (1 + 0.2 * ruffK(z, a))),
        lift: (z, a) => 0.2 + 0.16 * ruffK(z, a) + 0.14 * sstep(-4, -8, z),
        skip: (P, T, z, a) => eyeD(P) < EYER * 1.04 || eyeD(T) < EYER * 0.98 || eyeD(fxQ.copy(P).lerp(T, 0.5)) < EYER || (z > 2.5 && Math.abs(Math.sin(a) - sLip(z)) < 0.075),
        tip: (z, a) => (ruffK(z, a) > 0.5 ? foxCream : null),
      });
      // the eyes: a shallow dome set in each socket (FOX_FS draws iris, slit, lids and glint on it)
      for (const E of EYES) {
        const rings = [];
        for (let i = 0; i <= 5; i++) { const r = i / 5, ring = [];
          for (let k = 0; k < 18; k++) { const ph = k / 18 * TAU, u = Math.cos(ph) * r, v = Math.sin(ph) * r;
            fxQ.copy(E.c).addScaledVector(E.ex, u * EYER).addScaledVector(E.ey, v * EYER).addScaledVector(E.e, EYER * (0.34 * (1 - r * r) - 0.04 * r));
            ring.push(fb.v(fxQ, E.e, u, v, E.sd, 3, foxBlk)); }
          rings.push(ring); }
        for (let i = 0; i < 5; i++) for (let k = 0; k < 18; k++) { const k1 = (k + 1) % 18; fb.tri(rings[i][k], rings[i][k1], rings[i + 1][k1]); fb.tri(rings[i][k], rings[i + 1][k1], rings[i + 1][k]); }
      }
      // the nose pad
      { const cn = new V3(0, -0.84, 6.3), rings = [];
        for (let j = 0; j <= 10; j++) { const la = -Math.PI / 2 + Math.PI * j / 10, sy = Math.sin(la), cr = Math.max(Math.cos(la), 0.02), ring = [];
          for (let k = 0; k < 20; k++) { const a = k / 20 * TAU, dx = Math.cos(a) * cr, dz = Math.sin(a) * cr; fxQ.set(cn.x + dx * 1.04, cn.y + sy * 0.86, cn.z + dz * 0.9); ring.push(fb.v(fxQ, fxA.set(dx, sy, dz), dx, sy, dz, 2, foxBlk)); }
          rings.push(ring); }
        for (let j = 0; j < 10; j++) for (let k = 0; k < 20; k++) { const k1 = (k + 1) % 20; fb.tri(rings[j][k], rings[j][k1], rings[j + 1][k1]); fb.tri(rings[j][k], rings[j + 1][k1], rings[j + 1][k]); } }
      // the ears: cupped triangles laid a little back, black behind, pale within, long white hair along the inner edges
      for (const sd of [-1, 1]) {
        S.frame(-3.5, sd > 0 ? 1.02 : Math.PI - 1.02); const B = fxP.clone().addScaledVector(fxN, -0.5);
        const A = new V3(sd * 0.36, 1, -0.5).normalize(), Fn = new V3(sd * 0.5, 0.2, 1); Fn.addScaledVector(A, -Fn.dot(A)).normalize(); const Wd = new V3().crossVectors(A, Fn).normalize(), H = 4.9;
        const nFn = Fn.clone().negate(), inn = [], out = [];
        const ep = (t, x, o) => { const hw = 1.8 * Math.pow(1 - t, 0.8) * (0.78 + 0.34 * Math.sin(Math.PI * Math.min(t * 2, 1))); return o.copy(B).addScaledVector(A, H * t).addScaledVector(Wd, hw * x).addScaledVector(Fn, 0.6 * hw * x * x - 0.3 * t * t); };
        for (let r = 0; r <= 7; r++) { const t = r / 7 * 0.985, ri = [], ro = [];
          for (let j = -3; j <= 3; j++) { const x = j / 3; ep(t, x, fxQ);
            ri.push(fb.v(fxQ, Fn, x, t, 0.3, 5, mixc(foxCream, foxPink, (1 - Math.abs(x)) * (1 - 0.6 * t))));
            fxQ.addScaledVector(Fn, -0.12); ro.push(fb.v(fxQ, nFn, 0, 0, 0.6, 0, mixc(foxRu, foxBlk, sstep(0.12, 0.42, t)))); }
          inn.push(ri); out.push(ro); }
        for (let r = 0; r < 7; r++) for (let j = 0; j < 6; j++) { fb.tri(inn[r][j], inn[r][j + 1], inn[r + 1][j + 1]); fb.tri(inn[r][j], inn[r + 1][j + 1], inn[r + 1][j]); fb.tri(out[r][j], out[r + 1][j + 1], out[r][j + 1]); fb.tri(out[r][j], out[r + 1][j], out[r + 1][j + 1]); }
        for (let i = 0; i < 26; i++) {                                    // hair along both inner edges, turning in and up
          const x = i % 2 ? 1 : -1, t = 0.04 + 0.8 * (i / 26), hh = fhash(i, sd + 3); ep(t, x * 0.96, fxP);
          fxD.copy(Wd).multiplyScalar(-x * 0.75).addScaledVector(A, 0.55).addScaledVector(Fn, 0.3).normalize(); fxS.crossVectors(Fn, fxD).normalize();
          lock(fb, fxP, fxD, fxS, Fn, 1.5 * (1 - 0.5 * t) * (0.8 + 0.4 * hh), 0.3, hh, foxW, null);
        }
        for (let r = 0; r < 9; r++) for (let j = -2; j <= 2; j++) {       // short fur up the back
          const t = 0.03 + 0.1 * r + 0.03 * fhash(r, j), x = (j + 0.5 * (r % 2) - 0.25) / 2.6, hh = fhash(r * 3.1 + j, sd + 7); if (Math.abs(x) > 0.95) continue;
          ep(t, x, fxP).addScaledVector(Fn, -0.14); fxD.copy(A).multiplyScalar(0.92).addScaledVector(Fn, -0.3).normalize(); fxS.crossVectors(nFn, fxD).normalize();
          lock(fb, fxP, fxD, fxS, nFn, 0.95 * (0.8 + 0.4 * hh), 0.3, hh, mixc(foxRu, foxBlk, sstep(0.12, 0.42, t)), null);
        }
      }
      // whiskers: single hairs, three and two on each side of the muzzle, the longest behind and none longer than the muzzle is
      // broad, each going its own way (side by side and all of a length they would lie as a pale sheet under the jaw)
      const whisker = (R0, D, len, droop, hh) => {
        let p0 = -1, p1 = -1;
        for (let k = 0; k <= 7; k++) { const t = k / 7; fxQ.copy(R0).addScaledVector(D, len * t); fxQ.y -= droop * len * t * t; fxQ.z -= 0.12 * len * t * t;
          fxT.copy(D).multiplyScalar(len); fxT.y -= 2 * droop * len * t; fxT.z -= 0.24 * len * t; fxT.normalize();
          const a = fb.v(fxQ, fxT, -1, t, hh, 4, foxW), b = fb.v(fxQ, fxT, 1, t, hh, 4, foxW);
          if (p0 >= 0) { fb.tri(p0, p1, b); fb.tri(p0, b, a); } p0 = a; p1 = b; }
      };
      for (const sd of [-1, 1]) {
        for (let row = 0; row < 2; row++) for (let i = 0; i < (row ? 2 : 3); i++) {
          const z = 3.95 + 0.7 * i + 0.35 * row, sn = 0.03 - 0.2 * row, a = sd > 0 ? Math.asin(sn) : Math.PI - Math.asin(sn), hh = fhash(i + row * 7, sd + 11), h2 = fhash(i * 3 + row, sd + 23), back = 1 - i / 2.5;
          S.frame(z, a); fxD.copy(fxN).multiplyScalar(0.9).addScaledVector(ZV, -0.1 - 0.5 * back + (h2 - 0.5) * 0.5).addScaledVector(YV, 0.2 - 0.45 * row + (hh - 0.5) * 0.5).normalize();
          whisker(fxP.clone().addScaledVector(fxN, -0.05), fxD.clone(), (1.5 + 1.3 * back) * (0.8 + 0.4 * hh), 0.1 + 0.16 * row + 0.1 * h2, hh);
        }
      }
      return fb.build();
    })();
    await ctx.yield();
    // the forepaw that rakes beside it: a black stocking, four furred toes, dark claws
    const pawGeo = await (async () => {
      const fb = mkFur();
      const leg = furSurf([[-6, 0, 1.3, 1.3, 1.3], [-2, 0, 1.2, 1.2, 1.2], [1.2, 0, 1.02, 1.05, 1.08], [2.8, -0.1, 1.0, 1.05, 1.5], [4.0, -0.2, 0.98, 1.0, 1.85], [5.0, -0.3, 0.8, 0.8, 1.6], [5.5, -0.35, 0.25, 0.25, 0.8]], null);
      const legCoat = (z, a) => mixc(mixc(foxRu, foxRu2, 0.5 + 0.5 * noise.n3(z * 0.5, Math.sin(a) * 2, Math.cos(a) * 2)), foxBlk, sstep(-4.6, -1.6, z + 0.5 * Math.sin(a * 3)));
      await furBody(fb, leg, { NZ: 22, NA: 16, zOf: (t) => leg.z0 + (leg.z1 - leg.z0) * t, coat: legCoat, len: (z, a) => 0.8 + 0.5 * sstep(0.2, -0.8, Math.sin(a)) * sstep(3, 0, z), lift: () => 0.26 });
      for (let q = 0; q < 4; q++) {
        const f = q - 1.5, dz = -0.28 * Math.abs(f), x = f * 0.84;
        const toe = furSurf([[4.7 + dz, -0.3, 0.42, 0.42, 0.4], [5.5 + dz, -0.32, 0.54, 0.5, 0.5], [6.2 + dz, -0.4, 0.44, 0.46, 0.43], [6.65 + dz, -0.5, 0.1, 0.1, 0.1]], null, x);
        await furBody(fb, toe, { NZ: 7, NA: 10, zOf: (t) => toe.z0 + (toe.z1 - toe.z0) * t, coat: () => foxBlk, len: () => 0.5, lift: () => 0.3 });
        const pts = [new V3(x, -0.5, 6.45 + dz), new V3(x, -0.72, 6.95 + dz), new V3(x, -1.1, 7.3 + dz), new V3(x, -1.5, 7.42 + dz)], rings = [];
        for (let j = 0; j < 4; j++) { const r = 0.2 * (1 - 0.3 * j), ring = []; fxT.copy(pts[Math.min(j + 1, 3)]).sub(pts[Math.max(j - 1, 0)]).normalize(); fxA.set(1, 0, 0); fxB.crossVectors(fxT, fxA).normalize();
          for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; fxN.copy(fxA).multiplyScalar(Math.cos(a)).addScaledVector(fxB, Math.sin(a)); fxQ.copy(pts[j]).addScaledVector(fxN, j === 3 ? 0.02 : r); ring.push(fb.v(fxQ, fxN, 0, 0, 0, 6, foxBlk)); }
          rings.push(ring); }
        for (let j = 0; j < 3; j++) for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; fb.tri(rings[j][k], rings[j][k1], rings[j + 1][k1]); fb.tri(rings[j][k], rings[j + 1][k1], rings[j + 1][k]); }
      }
      return fb.build();
    })();
    await ctx.yield();
    const uFoxHoleY = { value: 1e3 };                              // the height of the roof where the fox comes through (the fur goes into shadow toward it)
    const foxMat = mk(U, { vs: FOX_VS, fs: FOX_FS, uniforms: { uPx, uFoxHoleY } });
    const foxMesh = (geo, sc) => { const mesh = new THREE.Mesh(geo, foxMat); mesh.frustumCulled = false; mesh.scale.setScalar(sc); scene.add(mesh); return { mesh }; };
    const fox = foxMesh(foxGeo, 1.2), foxPaw = foxMesh(pawGeo, 1);
    // the broken edge of the hole it has dug: clods of snow hanging round it (shown once the roof is open)
    deal('fox-rim');
    const foxRim = (() => {
      const g = new Soup();
      for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + sr.range(-0.1, 0.1), d = 6.1 + sr.range(-0.7, 0.9), s = foxAt.s + Math.cos(a) * d, t = foxAt.t + Math.sin(a) * d, r = sr.range(0.5, 1.3);
        g.ball(P3(s, t, Fat(s, t) + Gat(s, t) - r * sr.range(0.1, 0.7)), r, r * sr.range(0.6, 0.9), r * sr.range(0.8, 1.2), 8, 5, () => W1, [10, 0, 0, 0]); }
      const mesh = new THREE.Mesh(g.build(), plantMat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.visible = false; scene.add(mesh); return mesh;
    })();
    const foxNose = new V3(), foxDir = new V3();
    fox.mesh.rotation.order = 'YXZ'; foxPaw.mesh.rotation.order = 'YXZ'; fox.mesh.visible = false; foxPaw.mesh.visible = false;
    const foxTop = P3(foxAt.s, foxAt.t, roofAt(foxAt.s, foxAt.t)), foxPawTop = P3(foxAt.s + 2.5, foxAt.t + 4.6, roofAt(foxAt.s + 2.5, foxAt.t + 4.6));
    const foxYaw = (() => { fr(foxAt.s); const ds = -1, dt = 0.55; return Math.atan2(F_.tx * ds - F_.tz * dt, F_.tz * ds + F_.tx * dt); })();
    // the collar round its neck: the snow it has pushed down and broken in coming through hangs under the roof in slabs and lumps,
    // each with broken faces, set round the place where the neck passes the roof (the neck leans, so that place is longer along
    // the lean than across it: 7.6 m by 5.7 m), some of them into the fur, so that the fur meets the snow in a broken line. The
    // collar is torn, not a ring: either side of the neck the slabs are large (to 2.7 m in radius) and hang low; over the nape, which
    // is turned to the way we come, and under the throat there are only crumbs, high in the hole, and gaps between them. From a
    // stream of its own (all the draws are taken for each place, then it is tried); a lump that would come within 2.0 m of the
    // eye's line is left out. Shown with the rim, once the roof is open
    const foxCollar = (() => {
      const R = stream('fox-collar'), g = new Soup(), sy = Math.sin(foxYaw), cy = Math.cos(foxYaw);
      for (let i = 0; i < 22; i++) {
        const a = i / 22 * TAU + R.range(-0.14, 0.14), k = R.range(0.96, 1.3), h1 = R(), h2 = R(), sd = R.range(0, 50), rz = R.range(0.6, 1.3), keep = R();
        const side = Math.pow(Math.abs(Math.sin(a)), 1.5), r = (0.55 + 0.45 * h1) * (0.75 + 1.95 * side), drop = lerp(0.05 + 0.3 * h2, 0.3 + 1.0 * h2, side);
        if (keep > 0.45 + 0.55 * side) continue;
        const al = Math.cos(a) * 7.6 * k, ac = Math.sin(a) * 5.7 * k, x = foxTop.x + sy * al + cy * ac, z = foxTop.z + cy * al - sy * ac, y = foxTop.y - r * drop;
        if (!path.isClear(x, y, z, r * 1.3, 2.5)) continue;
        lump(g, x, y, z, Math.cos(sd), Math.sin(sd), r, r * (0.45 + 0.3 * h2), r * rz, 7, 10, sd, [10, r, sd, 0], 3);
      }
      const mesh = new THREE.Mesh(g.build(), rockMat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.name = 'fox-collar'; scene.add(mesh); return mesh;
    })();
    uFoxHoleY.value = foxTop.y;
    // the mouth of the hole it comes out of: broken snow in shadow. Just under the roof, round the place where the neck passes it and
    // wider than the neck by two metres and more all round (9.2 m by 7.2 m, with the collar's slabs about its edge), the roof is
    // dark: no daylight and no lit roof is seen right round the fur. On the side away from the way we come, and less along the
    // flanks, the broken edge of the roof hangs down as a lip, to 3 m at the back: seen as we come, the head and the nape stand
    // against its shadowed inside and not against the lit roof. Its outer edge is torn (bites and teeth of a metre, cut by a grain
    // of its own place), nowhere a straight line. All but black deep in the mouth, the lip's lower part is snow that takes the
    // roof's light. No part of it comes within 2.0 m of the eye's line (a place that would is hung less far). Shown with the rim,
    // once the roof is open
    const foxMouth = (() => {
      const g = new Soup(), n = 48, c0 = [0, 0, 0], ln = Math.hypot(1, 0.55), as = -1 / ln, at = 0.55 / ln, rows = [[], [], [], [], [], []];
      const st = (rho, a) => { const al = Math.cos(a) * 9.2 * rho, ac = Math.sin(a) * 7.2 * rho; return [foxAt.s + as * al + at * ac, foxAt.t + at * al - as * ac]; };
      const at_ = (rho, a, dy, k, edge) => { const [s, t] = st(rho, a); toW(s, t); return g.v(W_.x, roofAt(s, t) - 0.25 - dy, W_.z, c0, [k, edge, 0, 0]); };
      const mid = at_(0, 0, 0, 0, 0);
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU, e = 1 + 0.16 * (fhash(k, 3.7) - 0.5); let h = 3 * sstep(0.3, 0.8, 0.5 - 0.5 * Math.cos(a)) * (0.7 + 0.6 * fhash(k, 9.1));
        rows[0].push(at_(0.25, a, 0, 0, 0)); rows[1].push(at_(0.5, a, 0, 0, 0)); rows[2].push(at_(0.75, a, 0, 0.1, 0)); rows[3].push(at_(e, a, 0, 0.25, 0));
        for (; h > 0; h -= 0.4) { const [s, t] = st(e * 1.12, a); toW(s, t); if (path.isClear(W_.x, roofAt(s, t) - 0.25 - h, W_.z, 0.4, 2.5)) break; }
        h = Math.max(h, 0);
        rows[4].push(at_(e * 1.05, a, 0.55 * h, 0.6, 0.5)); rows[5].push(at_(e * 1.12, a, h + 0.3, 1, 1));
      }
      for (let k = 0; k < n; k++) g.tri(mid, rows[0][k], rows[0][(k + 1) % n]);
      g.loft(rows, true);
      const mat = mk(U, { vs: /* glsl */`
attribute vec4 aA; varying vec3 vW; varying vec3 vL; varying vec2 vK;
void main(){ vec4 wp = vec4(position, 1.); vW = position; vK = aA.xy; vL = rfLight(position.xz); ${VEND} }`, fs: /* glsl */`
varying vec3 vW; varying vec3 vL; varying vec2 vK;
void main(){
  // vK.x: 0 deep in the mouth, 1 at the lip's lower edge; vK.y: 0 within, 1 at the outer edge, which is torn by a grain
  if (vK.y > 0.3 + 0.75*vn3(vW*0.9 + 4.) - 0.2*vn3(vW*3.1)) discard;
  float f = 0.5 + 0.6*vn3(vW*1.3) + 0.4*vn3(vW*4.1);
  vec3 col = mix(vec3(0.004, 0.007, 0.016)*f, vec3(0.5, 0.62, 0.78)*f*(vL*0.55 + uShadowCol*1.4), 0.85*smoothstep(0.4, 1., vK.x));
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}` });
      const mesh = new THREE.Mesh(g.build(), mat); mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.visible = false; mesh.name = 'fox-mouth'; scene.add(mesh); return mesh;
    })();
    await ctx.yield();

    // the snow crane fly (Chionea) stalking a blade beside the runway: a small detailed thing for the close pass
    const fly = (() => {
      const g = new Soup(), bodyC = lin('#2a1f16'), legC = lin('#5a4630');
      g.ball(new V3(0, 0, 0), 0.16, 0.15, 0.42, 7, 5, () => bodyC, [0, 0, 0, 0]); g.ball(new V3(0, 0.05, 0.5), 0.13, 0.12, 0.2, 6, 4, () => bodyC, [0, 0, 0, 0]);
      g.ball(new V3(0, 0.02, 0.74), 0.1, 0.1, 0.1, 6, 4, () => blackC, [0, 0, 0, 0]);
      for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1, zz = [0.35, 0.05, -0.25][i >> 1], ph = (i % 2 + (i >> 1)) % 2 * 0.5 + (i >> 1) * 0.12;
        g.tube([new V3(sd * 0.1, 0, zz), new V3(sd * 0.75, 0.55, zz * 1.6), new V3(sd * 1.25, -0.5, zz * 2.4 + 0.1)], () => 0.035, 4, () => legC, (t) => [1, t * t, ph, 0], false); }
      const geo = g.build();
      deal('fly');
      const c = makeCritter({ stride: 0.5, lift: 0.25, len: 1.6, snout: 0, hipZ: 0, hipY: 0, neckZ: 0.95, rim: 0.8, vivid: 0.5 }, geo, 1.3, 0);
      const s = 52, side = sr.sign(); let t = side * 0.5; while (Math.abs(t) < 12 && Gat(s, t) > 3.4) t += side * 0.2;
      toW(s, t); c.base = [W_.x, Fat(s, t) + Gat(s, t) - 0.75, W_.z]; fr(s); c.dir = [F_.tx, F_.tz]; c.u.uRun.value = 1;
      return c;
    })();

    // ---- sprites: sifting crystals, springtails, the curtains shed by each hoof-fall, the vole's breath and heel frost
    const mkPoints = (n, attrs, vs, uniforms, add) => {
      const geo = new THREE.BufferGeometry();
      for (const k in attrs) geo.setAttribute(k, new THREE.Float32BufferAttribute(attrs[k], attrs[k].length / n));
      const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, uPx, ...uniforms }, fog: true, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending,
        vertexShader: `${FOG_VP}\n${GLSL_N}\n${GLSL_RF}\n${vs}`, fragmentShader: `${FOG_FP}\n${PT_FS(add)}` });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts); return pts;
    };
    const uSift = { value: 0 }, uHoofT = { value: new THREE.Vector4(-1, -1, -1, -1) };
    deal('sift');
    const nSift = Math.round(3400 * detail * (season === 'early' ? 0.6 : 1)), sP = [], sB = [], sR = [];
    for (let i = 0, tries = 0; i < nSift && tries < 60000; tries++) {
      if ((tries & 511) === 511) await ctx.yield();
      let s, t; if (sr() < 0.25) [s, t] = hallST(); else { s = sr.range(S0 + 4, SG1 - 10); t = sr.gauss() * 4; }
      const g = Gat(s, t); if (g < 2 || Math.abs(t) > 42) continue;
      toW(s, t); const f = Fat(s, t); sP.push(W_.x, f + g - 0.2, W_.z); sB.push(f); sR.push(sr(), sr.range(0.25, 0.9), sr.range(0.07, 0.16), sr()); i++;
    }
    const sift = mkPoints(sP.length / 3, { position: sP, aBase: sB, aR: sR }, /* glsl */`
attribute float aBase; attribute vec4 aR;
uniform float uPx, uSift, uFall; uniform vec3 uSparkCol;
varying vec4 vCol;
void main(){
  float span = max(position.y - aBase, 0.5);
  float f = fract(aR.x*7. + uTime*aR.y*uFall/span);
  vec3 p = vec3(position.x + sin(uTime*0.7 + aR.x*30.)*0.25, position.y - f*span, position.z + cos(uTime*0.6 + aR.x*17.)*0.25);
  vec4 wp = vec4(p, 1.);
  ${VEND}
  float dist = -mvPosition.z;
  float tw = 0.3 + 0.7*pow(max(sin(uTime*3. + aR.x*60.), 0.), 6.);
  vec3 Lc = rfLight(p.xz) + dayAt(p)*3.;
  gl_PointSize = min(aR.z*uPx/max(dist, 0.5), uPx*0.03);
  float a = step(aR.w, 0.3 + 0.7*uSift)*smoothstep(1.0, 3.5, dist)*smoothstep(0., 0.08, f)*(1. - smoothstep(0.92, 1., f));
  vCol = vec4((mix(Lc, vec3(dot(Lc, vec3(0.3, 0.5, 0.2))), 0.4)*1.1 + uSparkCol*0.25)*tw*(1. + uSift), a);
}`, { uSift, uFall: { value: LK.wet ? 7 : 1 }, uSparkCol: { value: col(LK.spark) } }, true);
    deal('springtails');
    const nSpring = Math.round((season === 'april' ? 2400 : 620) * detail), gP = [], gR = [];
    for (let i = 0, tries = 0; i < nSpring && tries < 40000; tries++) {
      const s = sr.range(S0 + 4, sLast - 10), t = sr.gauss() * 2.6; if (Gat(s, t) < 1.5 || Math.abs(t) > 12) continue;
      toW(s, t); gP.push(W_.x, Fat(s, t) + 0.1, W_.z); gR.push(sr(), sr.range(1.4, 4.5), sr.range(0, TAU), sr.range(0.12, 0.2)); i++;
    }
    mkPoints(gP.length / 3, { position: gP, aR: gR }, /* glsl */`
attribute vec4 aR;
uniform float uPx;
varying vec4 vCol;
void main(){
  float c = (uTime + aR.x*aR.y*7.)/aR.y, id = floor(c), hop = clamp(fract(c)/0.2, 0., 1.);
  float fwd = mod(id, 2.) < 0.5 ? hop : 1. - hop;
  vec3 p = position + vec3(cos(aR.z)*1.5*fwd, 4.*hop*(1. - hop)*1.2, sin(aR.z)*1.5*fwd);
  vec4 wp = vec4(p, 1.);
  ${VEND}
  float dist = -mvPosition.z;
  gl_PointSize = min(aR.w*uPx/max(dist, 0.5), uPx*0.02);
  vCol = vec4(vec3(0.010, 0.014, 0.035) + rfLight(p.xz)*0.03, 0.92*smoothstep(0.8, 2.5, dist)*(1. - smoothstep(60., 90., dist)));
}`, {}, false);
    await ctx.yield();
    // snow dust in the shaft of the boulder's lee: fine crystals sifting down the gap from the rock's shoulder to the floor, each on
    // its own slow fall and sideways drift (the world's clock), turning its face to the light now and then; lit by the shaft's light
    { const R = stream('lee-dust'), n = Math.round(260 * (0.6 + 0.4 * detail)), dP = [], dR = [];
      const top = P3(gapAt.s, gapAt.t, roofAt(gapAt.s, gapAt.t)), bot = P3(sunSpot.s, sunSpot.t + 0.2, Fat(sunSpot.s, sunSpot.t) + 0.3);
      for (let i = 0; i < n; i++) { const a = R.range(0, TAU), r = Math.sqrt(R()); dP.push(Math.cos(a) * r, R(), Math.sin(a) * r); dR.push(R(), R.range(0.35, 1), R.range(0.05, 0.12), R()); }
      mkPoints(n, { position: dP, aR: dR }, /* glsl */`
attribute vec4 aR;
uniform float uPx; uniform vec3 uLeeTop, uLeeBot;
varying vec4 vCol;
void main(){
  float f = fract(position.y + uTime*aR.y*0.022);                              // 0 at the gap, 1 at the floor
  vec3 ax = mix(uLeeTop, uLeeBot, f); float rr = mix(2.1, 3.4, f);
  vec3 p = ax + vec3(position.x*rr + sin(uTime*0.5 + aR.x*30.)*0.35, 0., position.z*rr + cos(uTime*0.43 + aR.w*23.)*0.35);
  vec4 wp = vec4(p, 1.);
  ${VEND}
  // the mote's size is by its depth, as every point cloud's; it thins out near the eye by its distance from where the eye IS
  // (gone at 1.5 m, whole from 4 m), whichever way the eye looks
  float dist = -mvPosition.z, eyeD = length(cameraPosition - p);
  float tw = 0.25 + 0.75*pow(max(sin(uTime*2.1 + aR.x*60. + f*40.), 0.), 4.);
  gl_PointSize = min(aR.z*uPx/max(dist, 0.5), uPx*0.02);
  vCol = vec4(uLeeCol*uLee.w*1.5*tw, smoothstep(1.5, 4., eyeD)*smoothstep(0., 0.06, f)*(1. - smoothstep(0.94, 1., f))*(1. - 0.6*length(position.xz)));
}`, { uLeeTop: { value: top }, uLeeBot: { value: bot } }, true); }
    const HOOF = HOOF_UT.map(([hu, t], i) => { const s = hoofS[i]; toW(s, t); return { u: hu, x: W_.x, z: W_.z, y: Fat(s, t) + Gat(s, t), f: Fat(s, t) }; });
    const cP = [], cR = [];
    deal('curtains');
    const nCurt = Math.round(400 * (0.6 + 0.4 * detail));
    HOOF.forEach((h, hi) => { for (let i = 0; i < nCurt; i++) { const s = hoofS[hi] + sr.range(-9, 10), t = sr.range(-4.2, 4.2), g = Gat(s, t), fl = Fat(s, t); toW(s, t); cP.push(W_.x, fl + Math.max(g, 2.5) - 0.2 - sr() * sr() * 3, W_.z); cR.push(sr(), hi, sr.range(0.09, 0.2), sr()); } });
    mkPoints(cP.length / 3, { position: cP, aR: cR }, /* glsl */`
attribute vec4 aR;
uniform float uPx; uniform vec4 uHoofT;
varying vec4 vCol;
void main(){
  float t0 = aR.y < 0.5 ? uHoofT.x : aR.y < 1.5 ? uHoofT.y : aR.y < 2.5 ? uHoofT.z : uHoofT.w;
  float t = t0*1.5 - aR.x*0.85, fall = max(t, 0.);
  vec3 p = position; p.y -= 2.4*fall + 5.5*fall*fall*(0.6 + 0.4*aR.w); p.x += sin(aR.w*40. + fall*3.)*0.3*fall;
  vec4 wp = vec4(p, 1.);
  ${VEND}
  float dist = -mvPosition.z;
  gl_PointSize = min(aR.z*uPx/max(dist, 0.5), uPx*0.035);
  float tw = 0.35 + 0.65*pow(max(sin(fall*11. + aR.w*60. + uTime*5.), 0.), 3.);
  vec3 Lc = rfLight(p.xz + vec2(11., 0.));
  vCol = vec4((Lc*0.9 + vec3(0.3, 0.5, 0.55))*tw*2.3, step(0., t)*smoothstep(0.05, 0.5, p.y)*smoothstep(1., 3., dist));
}`, { uHoofT }, true);
    // the snow the fox knocks through: clods and powder falling from the hole for as long as it is open (looping on time). They
    // fall from the collar of broken snow round its neck, 5.4 to 7.8 m from the hole's middle
    const uFoxT = { value: 0 };
    deal('fox-snow');
    { const n = 110, fP = [], fR = [], top = roofAt(foxAt.s, foxAt.t);
      for (let i = 0; i < n; i++) { const a = sr.range(0, TAU), r = 5.4 + 2.4 * sr(); toW(foxAt.s + Math.cos(a) * r, foxAt.t + Math.sin(a) * r); fP.push(W_.x, top, W_.z); fR.push(sr(), sr.range(0.5, 1.1), sr() < 0.25 ? sr.range(0.5, 0.9) : sr.range(0.14, 0.34), sr()); }
      mkPoints(n, { position: fP, aR: fR }, /* glsl */`
attribute vec4 aR;
uniform float uPx, uFoxT;
varying vec4 vCol;
void main(){
  float f = fract(uTime*aR.y*0.55 + aR.x);
  vec3 p = position; p.y -= f*f*${top.toFixed(1)}; p.x += sin(aR.w*40. + f*5.)*0.5*f; p.z += cos(aR.w*31. + f*4.)*0.5*f;
  vec4 wp = vec4(p, 1.);
  ${VEND}
  float dist = -mvPosition.z;
  gl_PointSize = min(aR.z*uPx/max(dist, 0.5), uPx*0.05);
  vec3 Lc = rfLight(p.xz)*0.5 + dayAt(p)*1.3 + uShadowCol;
  vCol = vec4(Lc*0.8, 0.85*uFoxT*step(aR.w, uFoxT + 0.15)*smoothstep(0., 0.06, f)*(1. - smoothstep(0.9, 1., f))*smoothstep(1.5, 4., dist));
}`, { uFoxT }, false); }
    // the veil before the strike: crystals shaken loose from under the sagging dome fall the whole height of the gallery, and more
    // sift down from each fracture as it runs along the roof toward us (aR = hash, fall speed, size, 0 for the dome or 1 + the
    // fraction of its fracture's length at which the grain hangs)
    const uVeil = { value: 0 }, crTri = (x) => Math.abs(x - Math.floor(x) - 0.5) * 4 - 1;
    deal('veil');
    { const vP = [], vR = [], CR = heroU.uCrA.value, nDome = Math.round(900 * (0.6 + 0.4 * detail)), nLine = Math.round(200 * (0.6 + 0.4 * detail));
      for (let i = 0; i < nDome; i++) { const x = sr.gauss() * 5, z = HOLE_Z + 1.5 + sr.gauss() * 5, r2 = x * x + (z - HOLE_Z) * (z - HOLE_Z); vP.push(x, ROOF_Y - 0.6 - 4.2 * Math.exp(-r2 / 70), z); vR.push(sr(), sr.range(3.5, 8), sr.range(0.1, 0.24), 0); }
      for (let c = 0; c < 7; c++) for (let i = 0; i < nLine; i++) {
        const k = CR[c], fq = sr() ** 0.8, d = 3 + fq * (k.y - 3), x = k.x * (1 - Math.exp(-d / 11)) + k.w * (Math.sin(d * 0.19 + k.z) + 0.45 * Math.sin(d * 0.53 + k.z * 2.7) + 0.5 * crTri(d * 0.115 + k.z * 1.9) + 0.2 * crTri(d * 0.37 + k.z * 4.3)) + sr.gauss() * 0.25;
        const z = HOLE_Z + d, sq = Sflat + 6.24 - z, g = Gat(sq, x), h0 = sr(), sp = sr.range(3.5, 8), sz = sr.range(0.09, 0.2);
        if (g < 3) continue;
        vP.push(x, Math.min(Fat(sq, x) + g - 0.15, d < 26 ? ROOF_Y - 0.5 : 99), z); vR.push(h0, sp, sz, 1 + d / k.y);
      }
      // a curtain under each of the seven fractures: up to nCurt more grains to each (this loop's own nCurt: 500 at full detail),
      // dealt from the veil's stream after all the draws above, on the fracture's own line (crX: the same wandering line as
      // above), each set off from it across the gallery by a normal deviate of standard deviation 0.1 m (it has no bound: about
      // one grain in twenty hangs more than 0.2 m off the line), anywhere from 3 m out to its end with an even chance, kept where
      // the gallery is at least 3 m high and put 0.15 m under the roof there (within 26 m of the hole's centre no higher than half a
      // metre under ROOF_Y), each 0.06 to 0.13 m across (the veil's shader draws no grain under 2.4 pixels across, nor over 0.03
      // of uPx), with a fall speed of 2.5 to 6; like the grains above, each shows once its fracture has grown as far as it hangs
      const crX = (k, d) => k.x * (1 - Math.exp(-d / 11)) + k.w * (Math.sin(d * 0.19 + k.z) + 0.45 * Math.sin(d * 0.53 + k.z * 2.7) + 0.5 * crTri(d * 0.115 + k.z * 1.9) + 0.2 * crTri(d * 0.37 + k.z * 4.3));
      for (let c = 0, nCurt = Math.round(500 * (0.6 + 0.4 * detail)); c < 7; c++) for (let i = 0; i < nCurt; i++) {
        const k = CR[c], d = 3 + sr() * (k.y - 3), x = crX(k, d) + sr.gauss() * 0.1, z = HOLE_Z + d, sq = Sflat + 6.24 - z, g = Gat(sq, x);
        if (g < 3) continue;
        vP.push(x, Math.min(Fat(sq, x) + g - 0.15, d < 26 ? ROOF_Y - 0.5 : 99), z); vR.push(sr(), sr.range(2.5, 6), sr.range(0.06, 0.13), 1 + d / k.y);
      }
      mkPoints(vP.length / 3, { position: vP, aR: vR }, /* glsl */`
attribute vec4 aR;
uniform float uPx, uVeil, uCrGrow;
varying vec4 vCol;
void main(){
  float span = max(position.y, 1.), f = fract(aR.x*7.3 + uTime*aR.y/span);
  vec3 p = vec3(position.x + sin(uTime*0.9 + aR.x*31.)*0.22, position.y*(1. - f*(0.7 + 0.3*f)), position.z + cos(uTime*0.7 + aR.x*17.)*0.22);
  vec4 wp = vec4(p, 1.);
  ${VEND}
  float dist = -mvPosition.z;
  float tw = 0.3 + 0.7*pow(max(sin(uTime*4.1 + aR.x*60.), 0.), 3.);
  gl_PointSize = clamp(aR.z*uPx/max(dist, 0.5), 2.4, uPx*0.03);
  float on = aR.w < 0.5 ? uVeil : uVeil*step(aR.w - 1., uCrGrow);
  vCol = vec4((uDayCol*1.9 + rfLight(p.xz)*0.5)*tw, on*smoothstep(0., 0.05, f)*(1. - smoothstep(0.86, 1., f))*smoothstep(1., 3.5, dist));
}`, { uVeil }, true); }
    // 3 breath puffs + the frost thrown by the heels: per grain (delay, life, fan angle, back throw, height, size, brightness, side drift)
    deal('heel-frost');
    const NGRAIN = 72, NFOXB = 4, NPUFF = 3 + NGRAIN + NFOXB, puffP = new Float32Array(NPUFF * 3), puffC = new Float32Array(NPUFF * 4), GR = new Float32Array(NGRAIN * 8);
    for (let k = 0; k < NGRAIN; k++) { const o = k * 8, big = sr() < 0.22; GR[o] = sr() * 0.16; GR[o + 1] = sr.range(0.2, 0.46); GR[o + 2] = sr.gauss() * 0.34; GR[o + 3] = sr.range(0.5, 1.15); GR[o + 4] = 0.12 + 1.25 * sr() * sr(); GR[o + 5] = big ? sr.range(0.2, 0.32) : sr.range(0.07, 0.17); GR[o + 6] = sr.range(0.5, 1.15); GR[o + 7] = sr.range(-0.5, 0.5); }
    const puffs = mkPoints(NPUFF, { position: puffP, aC: puffC }, /* glsl */`
attribute vec4 aC;
uniform float uPx;
varying vec4 vCol;
void main(){
  vec4 wp = vec4(position, 1.);
  ${VEND}
  gl_PointSize = min(aC.x*uPx/max(-mvPosition.z, 0.5), uPx*0.12);
  vec3 Lp = rfLight(position.xz) + dayAt(position);
  vCol = vec4(mix(Lp, vec3(dot(Lp, vec3(0.3, 0.5, 0.2))), 0.65)*aC.z + uShadowCol, aC.y*smoothstep(1.5, 4., -mvPosition.z));
}`, {}, false);
    await ctx.yield();

    // ---- above the snow: the sky the shaft opens on, the fen's snow surface and far fells
    const SKY = {
      noon: { preset: 'day', zenith: '#2B6FD6', sunElevation: 13, sunAzimuth: -100, clouds: false, clouds2: false },
      thaw: { preset: 'day', zenith: '#3b7fd8', sunElevation: 17, sunAzimuth: -100, clouds: false },
      twilight: { preset: 'dawn', zenith: '#5a66c0', horizon: '#f0b9a4', sunElevation: 1.5, sunAzimuth: -100, clouds: false, clouds2: false },
      night: { preset: 'polar', bake: true, renderer: ctx.renderer },
      blizzard: { preset: 'overcast' },
    }[lookId];
    await ctx.yield();
    const sky = makeSky({ rng, ...SKY }); scene.add(sky.object); sky.object.visible = false;
    await ctx.yield();
    const fogOut = sky.fogColor.clone();
    const surf = (() => {
      const geo = new THREE.RingGeometry(27, 3400, 72, 16), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y), r2 = 27 + 3373 * Math.pow(Math.max(0, (r - 27) / 3373), 2.6), k = r2 / r, X = x * k, Z = y * k;
        const h = sstep(500, 1900, r2) * (60 + 260 * Math.max(0, noise.fbm2(X * 0.0011 + 5, Z * 0.0011, 3) + 0.25)) + 0.6 * noise.n2(X * 0.05, Z * 0.05) * sstep(30, 80, r2);
        p.setXYZ(i, X, 58.05 + h, Z - 27);
      }
      geo.computeVertexNormals();
      const mat = new THREE.ShaderMaterial({
        uniforms: { ...fogU(), uSun: { value: A.sunDir.clone() }, uSunCol: { value: sky.lightColor.clone().multiplyScalar(LK.hour === 'night' ? 0.5 : 1.9) }, uAmb: { value: sky.ambientColor.clone().multiplyScalar(LK.hour === 'night' ? 0.25 : 0.5) } },
        fog: true, side: THREE.DoubleSide,
        vertexShader: `varying vec3 vW; varying vec3 vN;\n${FOG_VP}\nvoid main(){ vW = position; vN = normal; vec4 wp = vec4(position, 1.); ${VEND} }`,
        fragmentShader: /* glsl */`uniform vec3 uSun, uSunCol, uAmb; varying vec3 vW; varying vec3 vN;
${FOG_FP}
${GLSL_N}
void main(){
  vec3 N = normalize(vN); if (N.y < 0.) N = -N;
  float n = vn2(vec2(vW.x*0.03 + vW.z*0.09, vW.z*0.02)) + 0.5*vn2(vW.xz*0.31);
  N = normalize(N + vec3(n - 0.75, 0., vn2(vW.xz*0.11 + 4.) - 0.5)*0.4);
  vec3 col = vec3(0.70, 0.76, 0.84)*(uAmb + uSunCol*max(dot(N, uSun), 0.));
  gl_FragColor = vec4(col, 1.);
  ${FOG_F}
}` });
      const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.visible = false; scene.add(m); return m;
    })();
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // ---- per-frame
    const DUR = 46, camW = new V3(), v2 = new THREE.Vector2(), gazeV = new V3(0, 3, 0), gazeW = new V3(), gazeE = new V3(), portalPos = path.pointAt(1);
    const rockW = P3(rockAt.s, rockAt.t, 0), birdLook = P3(birdAt.s - 3, birdAt.t - 5, 6.5), leeLook = P3(424, 6.5, 5), gazeL = new V3(), gazeL2 = new V3(), gazeB = new V3(), gazeO = new V3(), owlSh = { d: 0, side: 0, turn: 0, long: 1, half: 1, soft: 1, dark: 0, lift: 0, tilt: 0 };
    // where the owl's low shadow lies on the gallery's roof at the flight's progress u (the hero is asked: owlShadowAt): the look
    // lifts to it while it is ahead
    const owlSh2 = { ...owlSh }, owlLook = new V3();
    const owlLookAt = (time, u) => { if (hero.owlShadowAt(u, owlSh2)) { toW(Sflat + 6.24 - HOLE_Z - owlSh2.d, owlSh2.side); owlLook.set(W_.x, ROOF_Y, W_.z); } else owlLook.copy(A.lookAt); return owlLook; };
    const puffPos = puffs.geometry.attributes.position, puffCol = puffs.geometry.attributes.aC;
    // (the ermine's resting aim is the animal's own: the place where its first run crosses our line, the point that run is timed to, 4 m up)
    gazeE.set(ermRuns[0].at[0], 4, ermRuns[0].at[1]);
    const gazeE0 = gazeE.clone();
    // The three aims the gaze is drawn to. Each is worked out from u alone, by the law that puts its animal where it is (VOLE_RUN.at,
    // ermAt, shrewR.at: update() places the three animals by the same), so the look at a place is the same however we come to it.
    const RG = { x: 0, y: 0, z: 0, hx: 0, hz: -1, d: 0, v: 0 }, gp = new V3(), gt = new V3();
    const aimV = (time, u) => { VOLE_RUN.at(u, RG); return gazeV.set(RG.x, RG.y + 2.4, RG.z); };                 // our vole, above its back
    // the ermine on its first run: until it comes the aim rests where it will cross our line; then it goes over, in the first fifth of
    // the run, to ride on the animal's chest, so that head and forequarters stay in a tall, narrow frame
    const aimE = (time, u) => {
      const r = ermRuns[0]; if (u <= r.u0) return gazeE.copy(gazeE0);
      const k = sstep(0, 0.2, ermAt(r, u, gp, gt));
      return gazeE.set(lerp(gazeE0.x, gp.x + gt.x * 5, k), lerp(gazeE0.y, gp.y + 4.2, k), lerp(gazeE0.z, gp.z + gt.z * 5, k));
    };
    const aimW = (time, u) => { shrewR.at(u, RG); return gazeW.set(RG.x, RG.y + 1.2, RG.z); };                   // the shrew, above its back
    const T_BULGE = (A.timeline.bulge - A.timeline.burst) * A.timeline.secondsPerU;
    // the glance over its shoulder: its spacing in metres of its own run, where in that spacing the first one falls, and the scatter of
    // the later ones, from a stream of the animal's own
    const glR = stream('vole-glance'), glPer = glR.range(58, 74), glPh = glR(), glSd = glR.range(0, 50);
    // the bend its head leads into is read one length of its own body ahead along its own run: 11 m
    const VOLE_BEND = voleSpec.len, RB = { ...RO };
    const update = (dt, time, camera, u) => {
      U.uTime.value = time;
      camera.getWorldPosition(camW);
      uPx.value = ctx.renderer.getDrawingBufferSize(v2).y * 0.5 * camera.projectionMatrix.elements[5];
      hero.setProgress(u); hero.update(dt, time, camera);
      const camS = u * L, upShaft = camW.y > ROOF_Y + 8;
      for (const c of chunks) { const vis = !upShaft && c.s1 > camS - 30 && c.s0 < camS + 215, visD = vis && c.s0 < camS + 150; for (const o of c.objs) o.visible = vis; for (const o of c.det) o.visible = visD; }
      water.visible = !upShaft && camS > 140 && camS < 390;

      // what happens on the snow above: hoof-falls, the owl's shadow, the rare ptarmigan
      let sf = sstep(0.714, 0.726, u) * (1 - sstep(0.75, 0.79, u));
      HOOF.forEach((h, i) => {
        const a = sstep(h.u, h.u + 0.011, u);
        U.uHoof.value[i].set(h.x, h.z, a, a * (1 - 0.3 * sstep(h.u + 0.02, h.u + 0.07, u)));
        uHoofT.value.setComponent(i, a > 0 ? (u - h.u) * DUR : -1);
        sf = Math.max(sf, 0.6 * a * (1 - sstep(h.u + 0.03, h.u + 0.07, u)));
      });
      // the owl's shadow on the snow above: the hero says where the bird's shadow lies at this u, in metres up the gallery from the
      // roof hole, how it is turned, and where its wings stand in their beat (owlShadowAt: the strike's own clock, which reads
      // nothing of the eye); it is laid along the way's own line there, and everything the roof lights takes it, the hero's roof
      // disc too
      if (hero.owlShadowAt(u, owlSh)) {
        toW(Sflat + 6.24 - HOLE_Z - owlSh.d, owlSh.side); const ct = Math.cos(owlSh.turn), st = Math.sin(owlSh.turn);
        U.uShadow.value.set(W_.x, W_.z, owlSh.dark, owlSh.long); U.uShadowN.value.set(F_.tx * ct - F_.tz * st, F_.tx * st + F_.tz * ct, owlSh.half, owlSh.soft); U.uShadowW.value.set(owlSh.lift, owlSh.tilt);
      } else U.uShadow.value.z = 0;
      if (rare) { const open = sstep(0.232, 0.243, u); U.uWell.value.w = open * (1 - 0.3 * sstep(0.25, 0.3, u)); sf = Math.max(sf, open * (1 - sstep(0.28, 0.34, u))); ptarFoot.visible = u > 0.23 && u < 0.266; ptarFoot.position.y = ptar.y + 1.5 - 6.5 * sstep(0.232, 0.241, u) * (1 - sstep(0.247, 0.264, u)); }
      uSift.value = sf;
      // the veil of grains under the fractures runs on the strike's own clock (seconds from the burst): it gathers through the first
      // half of the bulge and is gone within a second of the burst
      uVeil.value = sstep(T_BULGE * 0.98, T_BULGE * 0.55, hero.state.t) * (1 - sstep(0.05, 0.95, hero.state.t));
      // how far the dome has paled, from the strike's own state: the bulge times 1.25, at most 1, times one less the hole's opening
      // (state.hole, which runs from 0 to 1 as the roof goes through)
      U.uDome.value = Math.min(hero.state.bulge * 1.25, 1) * (1 - hero.state.hole);
      if (lookId === 'night') { U.uGreen.value = 0.35 * (0.6 + 0.4 * Math.sin(time * 0.45)); U.uAur.value.w = 0.82 * (0.8 + 0.2 * Math.sin(time * 0.6 + 1)); }

      // fog and sky: cobalt haze under the snow, open air once the camera climbs the shaft
      const kOut = sstep(ROOF_Y - 4, ROOF_Y + 6, camW.y);
      scene.fog.color.copy(fogIn).lerp(fogOut, kOut); scene.fog.density = lerp(LK.fogD, 0.0004, kOut);
      const open = hero.state.hole > 0 || camW.y > ROOF_Y - 3;
      sky.object.visible = open; surf.visible = open;
      sky.update(dt, time, camera);

      // our vole
      let vVis = false, vx = 0, vy = 0, vz = 1e4, dx = 0, dz = -1, runK = 0, strides = 0, fadeV = 0;
      if (u <= VOLE_RUN.u1) {
        VOLE_RUN.at(u, RO); vVis = true; vx = RO.x; vy = RO.y; vz = RO.z; dx = RO.hx; dz = RO.hz; strides = RO.d / voleSpec.stride;
        runK = sstep(0.06, 0.45, RO.v); fadeV = 1 - sstep(VOLE_RUN.u1 - 0.004, VOLE_RUN.u1, u);
      }
      // at the opening it sits upright, turned back over its shoulder so that its chest, forepaws and both ears show, the stem at its
      // mouth; it has dropped and gone by u 0.012
      const sitK = 1 - sstep(0.003, 0.012, u), faceK = sitK, yaw = Math.atan2(dx, dz) + 2.0 * sitK;
      vole.mesh.position.set(vx, vy, vz); vole.mesh.rotation.y = yaw; vole.mesh.scale.setScalar(Math.max(fadeV, 1e-3)); vole.mesh.visible = vVis;
      // (one gain for the whole flight, set where the animal is made; the rim along its back comes from the glow ahead)
      vole.u.uSit.value = sitK; vole.u.uRun.value = runK; vole.u.uRimK.value = lerp(1.7, voleSpec.rim + 0.45 * runK, Math.max(runK, 1 - sitK));
      vole.u.uPhase.value = strides * TAU;
      // the tells of the animal we follow, all on its own clock and its own track. Its head leads into the bend of its own run: its
      // steady turn is the angle from its heading here to its heading VOLE_BEND metres of that run further on, to the side its track
      // turns; it swings with the stride; and once in every glPer metres of its own run it looks right back over a shoulder for some
      // 14 m, the left shoulder and the right by turns, by the glance's own number. Its body always points the way it runs
      let ua = VOLE_RUN.u0, ub = VOLE_RUN.u1; for (let it = 0; it < 16; it++) { const m = (ua + ub) / 2; if (VOLE_RUN.at(m, RB).d < RO.d + VOLE_BEND) ua = m; else ub = m; }
      VOLE_RUN.at(ub, RB); const bend = Math.atan2(RB.hx * dz - RB.hz * dx, RB.hx * dx + RB.hz * dz);
      const gq = RO.d / glPer - glPh, gk = Math.floor(gq), gh = Math.sin(gk * 12.9898 + glSd) * 43758.5453, gc = gk + 0.5 + 0.3 * (gh - Math.floor(gh) - 0.5);
      const glance = sstep(gc - 0.11, gc - 0.05, gq) * (1 - sstep(gc + 0.05, gc + 0.11, gq));
      const look = runK * (1 - sitK) * (bend + 0.1 * Math.sin(strides * TAU) + 1.15 * glance * (gk & 1 ? -1 : 1));
      vole.u.uLook.value = look; vole.u.uAhead.value.set(dx * 20, dz * 20); vole.u.uRimA.value = 1.5 * runK;
      U.uVole.value.set(vx, vy + 1.5, vz, vVis ? runK : 0);
      blobs[0].set(vx, vz, 3.0, vVis ? 0.72 : 0);
      // breath every third stride (slow breaths while it sits), frost thrown by its heels
      const bw = runK > 0.5 ? 0.4 : 0.6, bc = runK > 0.5 ? (strides / 3) % 1 : (time * 0.3 + 0.97) % 1, bf = clamp(bc / bw, 0, 1), sit = sitK;
      // standing or sitting, it breathes the way it faces; glancing back, the puff leaves its turned head to that side
      const la = look * 0.75, hx0 = lerp(dx, Math.sin(yaw), faceK), hz0 = lerp(dz, Math.cos(yaw), faceK);
      const bx = hx0 * Math.cos(la) + hz0 * Math.sin(la), bz = hz0 * Math.cos(la) - hx0 * Math.sin(la), ng = Math.abs(look);
      const nx0 = vx + hx0 * lerp(5.6, 2.6, Math.max(sit, ng * 0.75)) + bx * 3.1 * ng, ny0 = vy + lerp(1.9, 5.0, sit) + 0.5 * ng, nz0 = vz + hz0 * lerp(5.6, 2.6, Math.max(sit, ng * 0.75)) + bz * 3.1 * ng;
      for (let j = 0; j < 3; j++) {
        puffPos.setXYZ(j, nx0 + bx * bf * 1.4 - bz * (j - 1) * 0.5 * bf, ny0 + bf * (0.8 + 0.5 * j), nz0 + bz * bf * 1.4 + bx * (j - 1) * 0.5 * bf);
        puffCol.setXYZW(j, 0.5 + 1.5 * bf + 0.5 * ng, vVis && bc < bw ? lerp(0.3, 0.46, Math.max(faceK, ng)) * (1 - bf) * sstep(0, 0.15, bf) : 0, 0.8 + 0.5 * ng, 0);
      }
      // frost thrown by the heels: each hind foot flicks a low, irregular spray of grains as it leaves the ground (the left at half a
      // stride, the right at the whole). Every grain has its own delay, throw, fan angle, height, size and life, and it is left
      // behind at the vole's own speed, so nothing lines up; it is gone within half a stride
      for (let k = 0; k < NGRAIN; k++) {
        const o = k * 8, right = k & 1, life = GR[o + 1];
        const age = (((strides - (right ? 0 : 0.5) - GR[o]) % 1) + 1) % 1, a = Math.min(age / life, 1);
        const fan = clamp(GR[o + 2], -0.62, 0.62), thr = GR[o + 3] * age * voleSpec.stride;
        const lx = (right ? 1.5 : -1.5) + GR[o + 7] * 0.7 + Math.sin(fan) * (0.25 + thr * 0.75), lz = -5.1 - thr * Math.cos(fan), ly = 0.12 + GR[o + 4] * 4 * a * (1 - a) * (1 - 0.35 * a);
        puffPos.setXYZ(k + 3, vx + dz * lx + dx * lz, vy + ly, vz - dx * lx + dz * lz);
        puffCol.setXYZW(k + 3, GR[o + 5] * (1.35 + 0.6 * a), vVis && a < 1 ? 0.9 * (1 - a) * Math.sqrt(1 - a) * sstep(0, 0.1, a) * runK : 0, 2.3 * GR[o + 6], 0);
      }
      puffPos.needsUpdate = true; puffCol.needsUpdate = true;

      // the feeding voles: gnaw, sit up, bolt for the hole when the ermine comes
      hallVoles.forEach((c, i) => {
        let x = c.home[0], z = c.home[1], vis = true;
        if (u < c.ub) {
          const ca = Math.cos(c.yaw), sa = Math.sin(c.yaw);
          put(c, x, c.home[2], z, c.dir[0] * ca - c.dir[1] * sa, c.dir[0] * sa + c.dir[1] * ca);
          c.u.uSit.value = (0.5 + 0.5 * Math.sin(time * 0.5 + i * 2.1)) * (1 - sstep(c.ub - 0.004, c.ub, u)); c.u.uRun.value = 0;
        } else {
          const d = (u - c.ub) * L * 1.35; along(c, c.R, d); x = cp.x; z = cp.z; vis = d < c.R.len - 2;
          c.u.uSit.value = 0; c.u.uRun.value = 1; c.u.uPhase.value = d / (voleSpec.stride * c.scale) * TAU;
        }
        c.mesh.visible = vis;
        if (i < 5) blobs[3 + i].set(x, z, 3.2 * c.scale, vis ? 0.55 : 0);
      });

      // the ermine: across the far end of the hall and across the lichen garden
      let eVis = false;
      for (const r of ermRuns) if (u > r.u0 && u < r.u1) {
        const q = ermAt(r, u, cp, ct), d = q * r.R.len; put(ermine, cp.x, cp.y, cp.z, ct.x, ct.z);
        ermine.u.uPhase.value = d / (ermSpec.stride * ermScale) * TAU; ermine.u.uArch.value = r.arch; ermine.u.uRun.value = 1;
        ermine.mesh.scale.setScalar(ermScale * sstep(0, 0.05, q) * (1 - sstep(0.95, 1, q)) + 1e-3);
        eVis = true;
        const es = ermine.mesh.scale.x, hx = ct.x * 7.2 * es, hz = ct.z * 7.2 * es;                              // dark ground under the haunch and the chest, lighter under the arch
        blobs[1].set(cp.x - hx, cp.z - hz, 4.4 * es, 0.62); blobs[8].set(cp.x + hx * 0.75, cp.z + hz * 0.75, 4.2 * es, 0.62); blobs[9].set(cp.x - hx * 0.1, cp.z - hz * 0.1, 5.5 * es, 0.3);
      }
      ermine.mesh.visible = eVis; if (!eVis) { blobs[1].w = 0; blobs[8].w = 0; blobs[9].w = 0; }

      // the shrew at the water: it drinks side on to us, then patters away down the bank
      { const sVis = u > shrewR.u0 && u < shrewR.u1; shrew.mesh.visible = sVis;
        if (sVis) {
          shrewR.at(u, RO); const run = sstep(0.06, 0.4, RO.v); let yw = Math.atan2(RO.hx, RO.hz), dy = Math.atan2(shrewFace[0] - RO.x, shrewFace[1] - RO.z) - yw; dy -= Math.round(dy / TAU) * TAU; yw += dy * (1 - run) * (1 - sstep(0.44, 0.449, u));
          shrew.mesh.position.set(RO.x, RO.y, RO.z); shrew.mesh.rotation.y = yw; shrew.mesh.scale.setScalar(1.3 * (1 - sstep(shrewR.u1 - 0.004, shrewR.u1, u)) + 1e-3);
          shrew.u.uPhase.value = RO.d / (shrewSpec.stride * 1.3) * TAU; shrew.u.uRun.value = run; blobs[2].set(RO.x, RO.z, 2.4, 0.5);
        } else blobs[2].w = 0; }

      // the fox: the roof opens, the muzzle comes down snuffing, the paw rakes, both are pulled out again; the hole stays
      { const openF = sstep(0.292, 0.304, u), k = sstep(0.306, 0.322, u) * (1 - sstep(0.343, 0.357, u)), k2 = sstep(0.316, 0.328, u) * (1 - sstep(0.34, 0.352, u));
        U.uPool1.value.w = openF; foxShaft.material.uniforms.uOpen.value = openF; uFoxT.value = openF * (1 - 0.6 * sstep(0.38, 0.42, u));
        uSift.value = Math.max(uSift.value, 0.8 * openF * (1 - sstep(0.38, 0.42, u)));
        const pitch = 0.82 + 0.07 * Math.sin(time * 2.3), yw = foxYaw + 0.12 * Math.sin(time * 1.1), reach = -11 + 19.8 * k + 0.5 * Math.sin(time * 4.1) * k, c1 = Math.cos(pitch);
        fox.mesh.rotation.set(pitch, yw, 0); fox.mesh.position.set(foxTop.x + Math.sin(yw) * c1 * reach, foxTop.y - Math.sin(pitch) * reach, foxTop.z + Math.cos(yw) * c1 * reach); fox.mesh.visible = k > 0.002;
        foxRim.visible = foxCollar.visible = foxMouth.visible = openF > 0.3 && camS > 150 && camS < 330;
        // its breath: a plume from the nostrils with each snuff, drifting on along the muzzle and up
        fox.mesh.updateMatrixWorld(); foxNose.set(0, -0.8, 7.3).applyMatrix4(fox.mesh.matrixWorld); foxDir.set(Math.sin(yw) * c1, -Math.sin(pitch), Math.cos(yw) * c1);
        for (let j = 0; j < NFOXB; j++) {
          const f = (time * 0.85 + j * 0.11) % 1, fb = Math.min(f / 0.7, 1), o = 3 + NGRAIN + j, sdw = (j % 2 ? 1 : -1) * (0.45 + 0.9 * fb);
          puffPos.setXYZ(o, foxNose.x + foxDir.x * (0.5 + 3.4 * fb) + Math.cos(yw) * sdw, foxNose.y + foxDir.y * (0.5 + 2.0 * fb) + 1.6 * fb * fb, foxNose.z + foxDir.z * (0.5 + 3.4 * fb) - Math.sin(yw) * sdw);
          puffCol.setXYZW(o, 1.3 + 3.2 * fb, k > 0.6 && f < 0.7 ? 0.34 * (1 - fb) * sstep(0, 0.12, fb) : 0, 1.0, 0);
        }
        const p2 = 1.2 + 0.28 * Math.sin(time * 5.3), y2 = foxYaw - 0.3, r2 = -9 + 11.5 * k2 + 0.9 * Math.sin(time * 5.3 + 1) * k2, c2 = Math.cos(p2);
        foxPaw.mesh.rotation.set(p2, y2, 0); foxPaw.mesh.position.set(foxPawTop.x + Math.sin(y2) * c2 * r2, foxPawTop.y - Math.sin(p2) * r2, foxPawTop.z + Math.cos(y2) * c2 * r2); foxPaw.mesh.visible = k2 > 0.002; }

      // the ptarmigan: it breathes; as we come it lifts its head out of its feathers and watches us go by
      { const wake = sstep(0.60, 0.65, u), br = Math.sin(time * 1.3); bird.scale.set(BSC * (1 + 0.006 * br), BSC * (1 + 0.012 * br), BSC);
        let hy = Math.atan2(camW.x - bird.position.x, camW.z - bird.position.z) - bird.rotation.y; hy -= Math.round(hy / TAU) * TAU;
        birdHead.rotation.set(0.5 * (1 - wake) + 0.04 * Math.sin(time * 0.9), clamp(hy * 0.7, -0.5, 0.5) * wake + 0.08 * Math.sin(time * 0.6), 0); birdHead.position.y = 10.2 - 2.0 * (1 - wake);
        if (u > 0.45) { blobs[3].set(bird.position.x, bird.position.z, 9.5, 0.6); blobs[4].set(rockW.x, rockW.z, 15, 0.5); } }

      // the snow fly, stalking
      { const o = Math.sin(time * 0.13) * 1.4; put(fly, fly.base[0] + fly.dir[0] * o, fly.base[1], fly.base[2] + fly.dir[1] * o, fly.dir[0] * Math.cos(time * 0.13), fly.dir[1] * Math.cos(time * 0.13) + 1e-4); fly.u.uPhase.value = time * 1.7; fly.mesh.visible = camS < 140; }
    };
    { const c0 = new THREE.PerspectiveCamera(62, 16 / 9, 0.2, 6000); path.pointAt(0, c0.position); c0.updateMatrixWorld(true); update(0, 0, c0, 0); }

    return {
      scene, path, duration: DUR, title: LK.title,
      // even through the chambers (each is worth its seconds), a little slower in the hall and past the ptarmigan, lingering from the
      // bulge to the pull-out, level again for the climb
      pace: (u) => 1 - 0.18 * sstep(0.19, 0.23, u) * (1 - sstep(0.335, 0.37, u)) - 0.12 * sstep(0.64, 0.68, u) * (1 - sstep(0.73, 0.76, u)) - 0.4 * sstep(0.765, 0.805, u) * (1 - sstep(0.882, 0.9, u)),
      camera: { fov: 62, near: 0.2, far: 6000, lookAhead: 22, sway: 0.6, bank: 1 },
      pois: [
        { at: aimV, from: 0.0, to: 0.05, weight: 0.3 },
        { at: P3(102, 10.5, 4), from: 0.07, to: 0.15, weight: 0.5 },
        // the look to the ermine opens as its first run begins and closes as that run ends
        { at: aimE, from: ermRuns[0].u0, to: ermRuns[0].u1, weight: 0.7 },
        { at: P3(foxAt.s - 5, foxAt.t + 1, 9), from: 0.275, to: 0.372, weight: 0.6 },
        { at: aimW, from: 0.385, to: 0.465, weight: 0.3 },
        // the boulder's lee: the look goes to the foot of the shaft and lifts up it as we come, and rests on the lit hollow as long
        // as it is ahead of the eye; as we come alongside (0.553-0.577) it goes back down the tunnel (by the flight's progress alone)
        { at: (time, u) => { path.posAtDist(Math.min(u * L + 48, L - 1), gazeL2); gazeL2.y += 1; return gazeL2.lerp(gazeL.set(leeLook.x, lerp(5, 17, sstep(0.48, 0.545, u)), leeLook.z), 1 - sstep(0.553, 0.577, u)); }, from: 0.465, to: 0.6, weight: 0.5 },
        // the ptarmigan: the gaze is on it as we come up to it, then goes back down the tunnel by u 0.72, where the owl's shadow is crossing the roof
        { at: (time, u) => { path.posAtDist(Math.min(u * L + 48, L - 1), gazeB); gazeB.y += 1; return gazeB.lerp(birdLook, 1 - sstep(0.7, 0.722, u)); }, from: 0.64, to: 0.745, weight: 0.62 },
        { at: A.lookAt.clone(), from: 0.735, to: 0.905, weight: 0.75 },
        // the owl's low shadow hangs on the gallery's roof ahead (0.756-0.780): the look lifts to it, and comes down to the sagging
        // roof as it darts away (where the shadow lies is the hero's answer for this u: nothing of the eye)
        { at: owlLookAt, from: 0.748, to: 0.792, weight: 0.6 },
        // the owl going away, or the portal until it is out: the hero is asked where the bird is at this u (owlAt: it reads only, and
        // the hero's own update asks the same question for the bird it moves)
        { at: (time, u) => (hero.owlAt(u, gazeO) ? gazeO : portalPos), from: 0.9, to: 0.975, weight: 0.3 },
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: LK.hour === 'twilight' ? '#ffd9c6' : LK.hour === 'night' ? '#bfe9d6' : '#cfe6ff', glow: 1, revealDistance: 220 },
      post: { exposure: LK.exposure, bloom: { strength: 0.2, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a1638', vignette: 0.36, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
