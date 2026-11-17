// THE PEONY BOSS: hero set piece of "The Hundred-Layer Red".
// A peony 180 m across carved out of one block of layered lacquer: nine tiers, 96 petals, a leaf collar on the
// water, and a 16 m well bored at 63 degrees from the crown down to a buff chamber where the portal waits.
//
// FRAME. Local origin = centre of the flower at the WATERLINE (world depth of cut d = 47). +Y up. The uncut top of
// the block is local y = TOP (47): place hero.object at world y = -47 so that d = -worldY as in the brief. The
// camera is meant to arrive from +Z; the well descends toward -Z (rotate the object about Y to suit the path).
// Colour is never chosen: every fragment reads the stack from d = (object world y + 47) - fragment world y.
//
// opts: palette [red, deepRed, green, buff, black, glow] (brief default); detail 0.6..1 (thins rain and curls);
//       keyDir [x,y,z] direction TOWARD the key light, local space (default 18 degrees up, from -X, a little +Z);
//       the cast shade is baked against it at build, so pass it here rather than only calling setKey later;
//       apron (default true): the ring of green wave-diaper water out to 170 m; false if the world lays its own;
//       rain (default true): red beads falling round the flower; false if the world rains everywhere itself;
//       apronRadius (default 210); lift [r,g,b] (default .024,.042,.04): a small veil added to every fragment to
//       stand against the grade's linear contrast, which otherwise strips red of all green and blue (see U.uLift).
//       keyFor(tierSix) -> [x,y,z]: called once the petals exist and before the shade is baked, in place of keyDir;
//       canopyAz (default none): local azimuth near which one tier-six petal is made a canopy reaching out over
//       the trough (it is marked canopy: true in keyFor's list and in anchors.tierSix);
//       marble (default false): red and black coats alternate every 2 m; cap (default none): depth in metres of a
//       black cap over the red (the world's stack variations; both are plain uniforms, uMarble and uCap).
// Hooks: setProgress(u) with the world's path u: tiers one to nine are cut free at u .34 .40 ... .82 (groove runs
//       round the root, curls lift, petals tip out 4 degrees one after another with a slight overshoot). Until it
//       is called the piece runs a slow demonstration loop of its own. setKey(dir) turns the key (shade stays baked).
//       uniforms: the shared uniform table (uKeyCol, uFill, uGlow, uLift, the layer colours) for matching or tuning.
//       parts: { petals, core, well, leaves, apron } meshes, all on one material.
//       PETAL_GRID (export): the petal mesh's grid (columns, rows, petals per tier, tier roots), so a world can copy
//       petals out of parts.petals.geometry into lesser blooms of the same carving on the same material.
// Near the lens (within about 60 m) rain runs down the flute valleys of the petals: a bright bead with a wet trail.
// anchors (local space): portalSeat {position, normal} centre of the 14 m portal in the bore, normal pointing back
//       up the bore at the arriving camera; wellAxis {mouth, dir} unit vector down the bore; flyThrough: ordered
//       points over tiers seven to nine, over the innermost petal and dead straight down the bore (8 m wall all
//       round); underPetal {position, look}: the pass under a tier-six lip; viewpoints: flank, crown, bridgeSide;
//       tierSix: every tier-six lip {lip, azimuth} to choose another; tierLips {r, y} per tier; tierU: release u
//       per tier; waterY; topY; chamberFloor; keyDir.
// Size: radius 92, height 47 above the water (the well goes 28 m below it). Cost: about 147k triangles, 7 draw
// calls, about 300 ms of build (400 with a second, early key) in steps of a few milliseconds (every buffer is a typed
// array of its final size, so nothing grows and nothing is collected), no lights and no textures: it is lit by its own shader
// (one raking key with shade baked per vertex, red bounce from below, honey from above).
// Lighting it expects: none from the scene. Bloom threshold 1.0: only lips standing against the key pass it.
// Everything is opaque; scene fog is honoured if the world sets any (the brief asks for none).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TOP = 47, WELL_PITCH = 63 * Math.PI / 180, WELL_R = 8, MOUTH_Y = 40.5;
const TIER_U = [0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70, 0.76, 0.82];
// per tier: root radius, root height, petal length, lift of the petal axis (degrees), width, count
const TIERS = [
  [64, 9.5, 26, 5, 26, 16], [56.5, 12.5, 25, 13, 26, 14], [49, 16.5, 24, 20, 25, 13],
  [41.5, 20.5, 23, 28, 24, 12], [34, 24.5, 21, 36, 22, 11], [27, 28.5, 20, 44, 24, 9],
  [20.5, 32.5, 15, 53, 20, 8], [15.4, 36, 11.5, 60, 17, 7], [11.4, 39, 8.2, 66, 14, 6],
];

// ---- shared GLSL: the stack, read by depth of cut ----
export const STACK = /* glsl */`
// the glow of a lit lip peaks here: the brief's lightest orange, #F07F45, written as the linear colour that this world's
// lift (uLift) and last pass (exposure 0.92, the tone curve, saturation and contrast 1.05) bring to exactly that value in
// the middle of the frame; a lip in full glow is this colour and nothing of the lacquer is lighter
#define GLOW_PEAK vec3(.919, .128, .034)
uniform vec3 cRed, cRed2, cGreen, cBuff, cBlack, cCap;
uniform float uMarble, uCap;
// level: 1 where the surface lies nearly level, where a coat would spread into a broad band, so there it is left out
vec3 stackColorS(float d, float fw, float level) {
  vec3 red = mix(cRed, cRed2, clamp(d / 40., 0., 1.));
  // coat lines: every coat, and every tenth more strongly, each fading to its mean tone before it can crawl
  float t1 = abs(fract(d / .4) - .5) * 2., t10 = abs(fract(d / 4.) - .5) * 2.;
  float f1 = 1. - smoothstep(.06, .15, fw), f10 = 1. - smoothstep(.8, 1.8, fw);
  // a coat line is a crisp hair: 7 cm of the coat or a little over a pixel, whichever is wider
  float hw = max(.035, 1.2 * fw);
  float l1 = 1. - smoothstep(hw * .5, hw * 1.5, (1. - t1) * .2), l10 = smoothstep(.72, .97, t10);
  // variations of the stack: marbled (one thin black coat laid into every two metres of red), or a black cap over the
  // red. A black coat is a fine level line that follows the carved form, with the red on either side of it left bright
  // where the knife turned; far off the lines melt into their mean tone and never stand as bands.
  // A black coat is never a void: its coat lines are drawn in vermilion, so it reads as a dark line ruled in red
  float mf = abs(fract(d / 2.) - .5) * 2., mfar = smoothstep(.4, 1.4, fw);
  float mk = mix(clamp((.11 - mf) / fw + .5, 0., 1.), .14, mfar);
  float me = uMarble * (1. - mfar) * clamp(1. - abs(mf - .2) / max(.06, fw), 0., 1.);
  me *= 1. - level;
  float dark = max(uMarble * mk * (1. - level), clamp((uCap - d) / fw + .5, 0., 1.));
  red = mix(red, mix(cCap, red, mix(.8, .62, step(0., uCap)) * mix(mix(.22, .1, step(0., uCap)), l1, f1) + .2 * mix(mix(.16, .08, step(0., uCap)), l10, f10)), dark);
  vec3 c = mix(cBuff, cGreen, clamp((56.2 - d) / fw + .5, 0., 1.));
  float inRed = clamp((40.25 - d) / fw + .5, 0., 1.);
  c = mix(c, red, inRed);
  c *= 1. - (.42 * mix(.22, l1, f1) + .3 * mix(.16, l10, f10)) * (1. - dark * inRed);
  c *= 1. + .5 * me * inRed;
  // black guide hairlines: keep their width and lose their ink with distance
  hw = max(.25, .6 * fw); float ink = min(1., .25 / hw);
  float g = max(1. - smoothstep(hw - fw * .5, hw + fw * .5, abs(d - 40.25)),
                1. - smoothstep(hw - fw * .5, hw + fw * .5, abs(d - 56.2)));
  return mix(c, cBlack, g * ink);
}
vec3 stackColor(float d, float fw) { return stackColorS(d, fw, 0.); }
// the tone the shade of a layer lands on: a share of the layer's own plain colour (uToe: for red, green and buff; of the
// red only its red, so its shade keeps its hue); zero: none
uniform vec3 uToe;
vec3 stackToe(float d, float fw) {
  float inRed = clamp((40.25 - d) / fw + .5, 0., 1.), inGreen = clamp((56.2 - d) / fw + .5, 0., 1.);
  float red = mix(mix(cRed.r, cRed2.r, clamp(d / 40., 0., 1.)), cCap.r * 2., .5 * clamp((uCap - d) / fw + .5, 0., 1.));
  vec3 k = mix(mix(vec3(0., 0., 1.), vec3(0., 1., 0.), inGreen), vec3(1., 0., 0.), inRed);
  return vec3(red * uToe.x * k.x, 0., 0.) + cGreen * (uToe.y * k.y) + cBuff * (uToe.z * k.z);
}
// shade is never black: under the whole tone scale lies a toe in the layer's own colour, so the deepest shade lands on it
// and everything above keeps its order (the toe fades out as the tone rises; exp of a negative number, nothing to clamp)
vec3 shadeToe(vec3 col, vec3 toe) {
  float lt = max(dot(toe, vec3(.3, .6, .1)), 1e-5);
  return col + toe * exp(-max(dot(col, vec3(.3, .6, .1)), 0.) / (1.5 * lt));
}`;

const VERT = /* glsl */`
attribute vec3 aPivot; attribute vec4 aData; attribute vec3 aUv; attribute float aShadeA;
uniform float uProg, uKeyMix;
varying vec3 vW, vN, vK; varying vec4 vD; varying vec2 vUv;
#include <fog_pars_vertex>
void main() {
  float kind = aUv.z, tier = aData.x, seq = aData.y;
  vec3 p = position, n = normal;
  float T = (uProg - (.34 + .06 * tier)) / .05;          // -1: groove starts, 0: first petal goes, 1: all settled
  float x = clamp((T - seq * .7) / .3, 0., 1.);
  float tip = kind < .5 ? (1. - exp(-5. * x) * cos(7.5 * x)) * .0698 : 0.;
  vec3 ax = vec3(aPivot.z, 0., -aPivot.x); ax /= max(length(ax), 1e-4);
  float c = cos(tip), s = sin(tip);
  vec3 q = p - aPivot;
  p = aPivot + q * c + cross(ax, q) * s + ax * dot(ax, q) * (1. - c);
  n = n * c + cross(ax, n) * s + ax * dot(ax, n) * (1. - c);
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * n;
  // fresh cut: bright matte band where the groove head has just passed this root
  float head = T + 1. - seq;
  vK = vec3(kind, tier, clamp(head * 6., 0., 1.) * (1. - smoothstep(.25, 1.6, head)));
  vD = aData; vD.w = mix(aShadeA, aData.w, uKeyMix); vUv = aUv.xy;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
#define RUN_CAP .5
uniform vec3 uKey, uKeyCol, cGlow, cJade, cFar, cFresh, cHi, cBounce, cHoney, cDeep, uPortal, uMouth, uLift;
uniform float uTop, uTime, uFill, uGlow, uUnder;
varying vec3 vW, vN, vK; varying vec4 vD; varying vec2 vUv;
#include <fog_pars_fragment>
${STACK}
float scaleH(vec2 q) {                       // wave diaper: overlapping scale arcs, front rows cover those behind
  float h = 0., done = 0., r0 = floor(q.y * 2.) + 2.;
  for (int j = 0; j < 4; j++) {
    float row = r0 - float(j), off = mod(row, 2.) * .5;
    float cx = floor(q.x - off + .5) + off;
    float dd = length(q - vec2(cx, row * .5)) / .56;
    float hit = step(dd, 1.) * (1. - done);
    h += hit * (1. - smoothstep(.8, 1., dd)) * (.58 + .42 * cos(dd * 15.7));
    done += hit;
  }
  return h;
}
float fretH(vec2 q) {                        // square meander: nested squares, each broken and linked to the next
  vec2 f = fract(q) - .5;
  float m = max(abs(f.x), abs(f.y)) * 6.;
  float gap = step(0., f.x) * (1. - smoothstep(.03, .07, abs(f.y + (mod(floor(m), 2.) - .5) * .12)));
  float band = smoothstep(.12, .3, abs(fract(m) - .5));
  return max(band, gap) * step(m, 2.95) + step(2.95, m) * .0;
}
float relief(float kind, vec2 uv, float d, float flag) {   // metres, out of the surface
  if (kind < .5) {                                         // petal: fluted veins fanning from the root, a mid crease
    float fl = .5 + .5 * cos(uv.x * 56.55);
    return (.15 * fl * fl) * smoothstep(.02, .3, uv.y) * (1. - .6 * smoothstep(.8, 1., uv.y));
  } else if (kind < 1.5) {                                 // core: fret band on the riser faces
    return .0;
  } else if (kind < 2.5) {                                 // well: green scales in the green band, fret on the floor
    float band = smoothstep(40.6, 41.4, d) * (1. - smoothstep(55.2, 56., d));
    float tt = uTime * .5 - uv.y * .04, sh = (floor(tt) + smoothstep(0., .35, fract(tt))) * .5;
    return mix(.7 * band * scaleH(vec2(uv.x + sh * 3.14, uv.y) / 3.14), .5 * fretH(uv / 5.), flag);
  } else if (kind < 3.5) {                                 // water: scale cells 6 m, shifting half a cell every 2 s
    float tt = uTime * .5 - length(uv) * .012, sh = (floor(tt) + smoothstep(0., .35, fract(tt))) * .5;
    return 1.2 * scaleH(vec2(uv.x + sh * 6., uv.y) / 6.);
  }
  float rib = exp(-uv.x * uv.x * 180.);                    // leaf: midrib and six side veins
  float sv = .5 + .5 * cos(6.2832 * (uv.y * 6.5 - abs(uv.x) * 1.6));
  return .32 * rib + .2 * sv * sv * sv * (1. - rib) * (1. - smoothstep(.7, 1., abs(uv.x))) - .25 * abs(uv.x);
}
void main() {
  float kind = vK.x;
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float d = uTop - vW.y, fw = max(fwidth(d), 1e-4);
  // relief by bump: gradient of the uv chart in world space (derivatives all taken here, outside any branch or loop)
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); vec2 dux = dFdx(vUv), duy = dFdy(vUv);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  det = (det < 0. ? -1. : 1.) * max(abs(det), 1e-7);
  vec3 gU = (r1 * dux.x + r2 * duy.x) / det, gV = (r1 * dux.y + r2 * duy.y) / det;
  float cell = kind < .5 ? .18 : (kind < 2.5 ? 1. : (kind < 3.5 ? 3.5 : .15));
  float fade = 1. - smoothstep(.25, .7, (length(dux) + length(duy)) / cell);
  float e = kind < .5 || kind > 3.5 ? .004 : .06;
  float h0 = relief(kind, vUv, d, vD.z), hu = relief(kind, vUv + vec2(e, 0.), d, vD.z), hv = relief(kind, vUv + vec2(0., e), d, vD.z);
  vec3 bump = (gU * (hu - h0) + gV * (hv - h0)) / e;
  bump *= fade * min(1., 2.5 / max(length(bump), 1e-4));
  // the six flutes of a petal are modelled in the light as well as in the mesh, so each has a lighter and a darker side
  // from as far off as the flower can be seen whole, and the underside of the canopy is a fluted ceiling
  float level = 1. - smoothstep(.1, .38, 1. - N.y * N.y);
  // the underside of the canopy tier. From far off it is one smooth coat (the stack's soft coat bands would stripe it).
  // Near the lens (within 45 m, gone by 75) it is RULED: a hair at every coat of the stack and a stronger one at every
  // tenth, each drawn at one width on the surface whatever its slope (3 cm, or a pixel), so the ruling is as crisp where
  // the petal rolls level overhead as on its steep root; the broad flutes, which read there as soft stripes, are eased
  float under6 = step(kind, .5) * step(4.5, vK.y) * step(vK.y, 5.5) * clamp(-N.y * 1.6 + .1, 0., 1.);
  float nearU = under6 * (1. - smoothstep(45., 75., dist));
  float gS = sqrt(max(1. - N.y * N.y, 0.));                                  // 0 level, 1 upright
  float hwU = max(.03 * max(gS, .05), .9 * fw);
  float ruleU = (1. - smoothstep(hwU, hwU + fw, (.5 - abs(fract(d / .4) - .5)) * .4)) * (1. - smoothstep(.07, .13, fw));
  float ruleX = (1. - smoothstep(hwU * 2.2, hwU * 2.2 + fw, (.5 - abs(fract(d / 4.) - .5)) * 4.)) * (1. - smoothstep(.5, 1.2, fw));
  vec3 gUn = gU / max(length(gU), 1e-5);
  float flf = step(kind, .5) * (1. - smoothstep(.06, .22, length(dux) + length(duy))) * smoothstep(.05, .3, vUv.y);
  vec3 N0 = N;
  N = N - bump + gUn * (.42 * sin(vUv.x * 18.85) * flf * (1. - .55 * nearU)); N /= max(length(N), 1e-4);
  // (under multisampling a varying is extrapolated past the triangle at a silhouette: lip and shade are held to 0..1 there,
  // or a lip of -2 cubed gives a negative colour and a black pixel on the glowing edge)
  float lip = (kind < .5 || kind > 3.5) ? clamp(vD.z, 0., 1.) : 0.;
  // the incandescent lip is a hair, not a band: the last 0.3 m of the petal and never more than a few pixels of it
  float lipPx = (1. - lip) / max(fwidth(lip), 1e-5);
  float hair = smoothstep(.72, 1., lip) * (1. - smoothstep(1.5, 4.5, lipPx));
  float isWell = step(1.5, kind) * step(kind, 2.5);
  if (kind > 2.5 && kind < 3.5) d -= (h0 - .6) * fade;

  vec3 alb = stackColorS(d, fw, level);
  alb = mix(alb, mix(cRed, cRed2, clamp(d / 40., 0., 1.)) * (.94 - nearU * (.5 * ruleU + .26 * ruleX * (1. - ruleU))), .9 * under6);
  float cav = kind < 3.5 && kind > .5 ? 1. : mix(1., (kind < .5 ? .66 : .86) + (kind < .5 ? .34 : .14) * smoothstep(0., .12, h0), fade);
  float ao = kind < .5 ? (.62 + .38 * (.5 + .5 * cos(vUv.x * 18.85))) * (.55 + .45 * smoothstep(0., .5, vUv.y)) : 1.;
  float root = kind < .5 ? 1. - smoothstep(.03, .12, vUv.y) : (kind < 1.5 ? clamp(vD.z, 0., 1.) : 0.);
  float fresh = clamp(vK.z, 0., 1.);
  alb = mix(alb * cav, cFresh, .75 * fresh * root);

  float S = clamp(vD.w, 0., 1.) * mix(1., 1. - smoothstep(2., 15., vUv.y), isWell);
  float w = clamp((dot(N, uKey) + .25) / 1.25, 0., 1.);
  w = mix(w, 1. - (1. - w) * (1. - w), .55);              // waxy, but a raked face is still plainly darker than one square to the key
  // shade keeps its ruling: on a petal's shaded face near the lens (within 45 m, gone by 75) every coat of the stack is a
  // hair and every tenth a stronger one, drawn as on the canopy's underside, and the coat between the hairs is as much
  // lighter as they take away: red shade ruled by its own coats, never one dark mass
  float shadeK = step(kind, .5) * (1. - under6) * (1. - smoothstep(.12, .45, w * S)) * (1. - smoothstep(45., 75., dist));
  alb *= 1. + shadeK * (.1 - .5 * ruleU - .26 * ruleX * (1. - ruleU));
  vec3 fill = mix(cBounce, cHoney, N.y * .5 + .5) * uFill * mix(1., .35, isWell);
  // shade is modelled too: the lit land opposite the key throws its red back, so a shaded form still has two faces
  vec3 Bd = vec3(-uKey.x, .3, -uKey.z); Bd /= max(length(Bd), 1e-4);
  float bw = clamp(dot(N, Bd) * .5 + .5, 0., 1.);
  fill *= mix(1., .62 + .7 * bw * bw, 1. - isWell);
  // three tones in the shade: faces turned up to the vault are the lightest, walls between, undercuts the deepest red
  fill *= mix(1., .4 + 1.25 * smoothstep(-.55, .75, N.y), 1. - isWell);
  vec3 col = alb * ao * (uKeyCol * w * S + fill);
  vec3 Hh = uKey + V; Hh /= max(length(Hh), 1e-4);
  float nh = max(dot(N, Hh), 0.); nh *= nh; nh = nh * nh * nh; nh *= nh;
  col += .16 * nh * S * (cHi * step(kind, 1.5) * step(d, 40.) + alb * 2.2);   // waxy: the sheen keeps the layer's hue
  float rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
  col += .35 * rim * alb * (.45 + .75 * w * S) + .45 * lip * lip * alb * w * S;   // rim, and the lit bevel of a lip
  // rain on the lacquer: beads run down the flute valleys of every petal near the lens, each a bright head with a wet
  // trail (they fade out with distance and before they are finer than a pixel, so the far flower is unchanged)
  float fxr = vUv.x * 9., fhr = fract(sin(floor(fxr) * 12.9898 + vD.y * 78.233 + vK.y * 37.7) * 43758.5453);
  float runr = fract(vW.y * .4 + uTime * (.33 + .2 * fhr) + fhr * 9.);
  float wet = smoothstep(0., .08, runr) * (1. - smoothstep(.08, .55, runr)) * (1. - smoothstep(.08, .2, abs(fract(fxr) - .5)));
  wet *= step(kind, .5) * (1. - smoothstep(40., 85., dist)) * (1. - smoothstep(.02, .07, fw * .4)) * smoothstep(.1, .25, vUv.y) * (1. - smoothstep(.85, .97, lip));
  // (the head is held under the brief's lightest red: a wet line in the lacquer's own colour, never a sparkle)
  col *= min(1. + .8 * wet, max(1., RUN_CAP / max(col.r, 1e-4)));
  // buff in the cuts: where a petal runs down into the cut behind the tier in front, the knife has gone through red, black
  // and green to the buff at the bottom of the stack: the stack's own buff under the same light as the vault behind
  vec3 ground = cBuff * (uKeyCol * (w * S) + cHoney * (uFill * 1.25)) * (1. + .2 * rim);
  float cut = step(kind, .5) * (1. - smoothstep(.05, .2, vUv.y)) * (1. - .7 * fresh);
  col = mix(col, ground, cut);
  // a petal is thin toward its tip: with the key behind it the outer half passes a little of it, warm, so a back-lit
  // petal runs from a deep root to a lighter tip instead of standing as one dark shape
  float thru = step(kind, .5) * smoothstep(.3, 1., vUv.y) * clamp(-dot(N, uKey), 0., 1.) * S;
  col += alb * uKeyCol * (.34 * thru);
  // the ceiling of the trough: the underside of the canopy tier takes the red light thrown up from the lit tiers beneath
  // it (the land's own bounce), so close overhead it is a lit, fluted ceiling and not a dark slab
  float ceil6 = step(kind, .5) * step(4.5, vK.y) * step(vK.y, 5.5) * clamp(-N.y * 1.6 + .1, 0., 1.);
  col += alb * (cRed * 1.4 + uKeyCol * .22) * (.6 * ceil6 * (1. - uUnder * nearU));
  col /= 1. + 1.1 * max(col.r - .58, 0.);
  // thin lips pass the key: orange when they stand between us and it
  float tow = clamp(.5 - dot(V, uKey) * .7, 0., 1.);
  vec3 glow = cGlow * (uGlow * tow * tow * (kind > 3.5 ? .12 * lip * lip * lip : 1.5 * hair + .1 * lip * lip * lip));
  // and a lip that simply catches the key is a bright hairline too: lit, or lit through from behind
  glow += cGlow * (step(kind, .5) * hair * (.3 + .75 * w * S + 1.1 * clamp(.15 - dot(N, uKey), 0., 1.) * tow));
  // the glow peaks at the brief's lightest orange: it fills what is left under that peak and never stacks over it
  col = min(col + glow, max(col, GLOW_PEAK));
  // down the well the key is lost and the portal's pale jade takes over, as a rim
  vec3 tp = uPortal - vW; float jd = length(tp); tp /= max(jd, 1e-4);
  float jw = clamp(dot(N, tp) * .5 + .5, 0., 1.);
  vec3 jade = cJade * (.16 + .5 * jw * jw + .9 * rim) * (.3 + .9 * exp(-jd / 38.));
  // (the well's floor flag is 0 or 1: held there, for under multisampling a varying runs on past its range at an edge)
  float wellFloor = clamp(vD.z, 0., 1.);
  col += isWell * (alb * jade * mix(1.1, .3, wellFloor) + cJade * rim * .2 * (.3 + .7 * exp(-jd / 38.)));
  // the mouth of the well lights the petals standing round it with that jade: a light on their own lacquer and a rim on
  // their edges, never a colour laid over them
  vec3 tm = uMouth - vW; float md = length(tm); tm /= max(md, 1e-4);
  float mj = step(kind, 1.5) * (1. - smoothstep(8., 24., md)) * clamp(dot(N0, tm) * .6 + .4, 0., 1.);
  vec3 jadeG = cJade * vec3(.72, 1., .8);
  col += jadeG * (mj * mj) * (alb * .45 + .3 * rim);
  // and the lip of the bore keeps its own ruled red, the black hairline and the green below it: there too the jade is
  // only a rim light on the ledges
  float mg = isWell * (1. - wellFloor) * (1. - smoothstep(1.5, 6.5, vUv.y));
  col += jadeG * (.4 * mg * rim);
  float low = clamp(1. - col.r / .13, 0., 1.);
  col += cDeep * (low * low * step(d, 40.25) * (1. - isWell) * (1. - .8 * w * S));     // red shade is never a void: the deepest tone of the lacquer
  col = mix(col, shadeToe(col, stackToe(d, fw)), 1. - isWell);
  float t = 1. - exp(-dist / 700.);
  col = mix(col, cFar, .5 * t * (1. - isWell));
  gl_FragColor = vec4(clamp(col, 0., 40.) + uLift, 1.);
  #include <fog_fragment>
}`;

// ---- geometry helpers: every mesh carries the same attributes so one shader program serves them all ----
// (buffers are typed arrays of exactly the final size, written through a cursor: growing plain arrays of a million
// numbers made garbage whose collection showed up as one long build step)
const newBuf = (nv, ni) => ({ pos: new Float32Array(nv * 3), nor: new Float32Array(nv * 3), piv: new Float32Array(nv * 3), dat: new Float32Array(nv * 4), uv: new Float32Array(nv * 3), idx: new Uint32Array(ni), n: 0, ni: 0 });
function putV(B, v, p0, p1, p2, d0, d1, d2, d3, u0, u1, u2) {
  const a = v * 3, b = v * 4;
  B.piv[a] = p0; B.piv[a + 1] = p1; B.piv[a + 2] = p2; B.dat[b] = d0; B.dat[b + 1] = d1; B.dat[b + 2] = d2; B.dat[b + 3] = d3; B.uv[a] = u0; B.uv[a + 1] = u1; B.uv[a + 2] = u2;
}
// add a (nu+1) x (nv+1) grid: P = flat xyz array, normals by central differences, sign +1 keeps cross(dv, du)
function addGrid(B, P, nu, nv, sign, attr) {
  const base = B.n, W = nu + 1;
  const at = (i, j) => (Math.min(nu, Math.max(0, i)) + Math.min(nv, Math.max(0, j)) * W) * 3;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), e = at(i, j + 1), o = at(i, j);
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[e] - P[c], vy = P[e + 1] - P[c + 1], vz = P[e + 2] - P[c + 2];
    let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
    const l = sign / Math.max(Math.hypot(nx, ny, nz), 1e-6);
    const v = B.n++, q = v * 3;
    B.pos[q] = P[o]; B.pos[q + 1] = P[o + 1]; B.pos[q + 2] = P[o + 2]; B.nor[q] = nx * l; B.nor[q + 1] = ny * l; B.nor[q + 2] = nz * l;
    attr(i, j, B, v);
  }
  let q = B.ni;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = base + i + j * W, b = a + 1, c = a + W, d = c + 1;
    if (sign > 0) { B.idx[q] = a; B.idx[q + 1] = c; B.idx[q + 2] = b; B.idx[q + 3] = b; B.idx[q + 4] = c; B.idx[q + 5] = d; } else { B.idx[q] = a; B.idx[q + 1] = b; B.idx[q + 2] = c; B.idx[q + 3] = b; B.idx[q + 4] = d; B.idx[q + 5] = c; }
    q += 6;
  }
  B.ni = q;
  return base;
}
// the same in slices (a yield every `rows` rows), for the core's big grid
async function addGridA(B, P, nu, nv, sign, attr, ctx, rows) {
  const base = B.n, W = nu + 1;
  const at = (i, j) => (Math.min(nu, Math.max(0, i)) + Math.min(nv, Math.max(0, j)) * W) * 3;
  for (let j = 0; j <= nv; j++) { if (j && j % rows === 0) await ctx.yield(); for (let i = 0; i <= nu; i++) {
    const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), e = at(i, j + 1), o = at(i, j);
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[e] - P[c], vy = P[e + 1] - P[c + 1], vz = P[e + 2] - P[c + 2];
    let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
    const l = sign / Math.max(Math.hypot(nx, ny, nz), 1e-6);
    const v = B.n++, q = v * 3;
    B.pos[q] = P[o]; B.pos[q + 1] = P[o + 1]; B.pos[q + 2] = P[o + 2]; B.nor[q] = nx * l; B.nor[q + 1] = ny * l; B.nor[q + 2] = nz * l;
    attr(i, j, B, v);
  } }
  await ctx.yield();
  let q = B.ni;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = base + i + j * W, b = a + 1, c = a + W, d = c + 1;
    if (sign > 0) { B.idx[q] = a; B.idx[q + 1] = c; B.idx[q + 2] = b; B.idx[q + 3] = b; B.idx[q + 4] = c; B.idx[q + 5] = d; } else { B.idx[q] = a; B.idx[q + 1] = b; B.idx[q + 2] = c; B.idx[q + 3] = b; B.idx[q + 4] = d; B.idx[q + 5] = c; }
    q += 6;
  }
  B.ni = q;
  return base;
}
// plain arrays are copied into typed arrays by hand, a slice at a time with a yield between slices: handing a plain
// array of a million numbers to a BufferAttribute constructor held the page for one long step
export async function typed(arr, Ctor, ctx) {
  if (arr instanceof Ctor) return arr;
  const n = arr.length, out = new Ctor(n);
  for (let i = 0; i < n; i += 40000) {
    const e = Math.min(n, i + 40000);
    for (let k = i; k < e; k++) out[k] = arr[k];
    if (ctx) await ctx.yield();
  }
  return out;
}
async function toGeometry(B, ctx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(await typed(B.pos, Float32Array, ctx), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(await typed(B.nor, Float32Array, ctx), 3));
  g.setAttribute('aPivot', new THREE.BufferAttribute(await typed(B.piv, Float32Array, ctx), 3));
  g.setAttribute('aData', new THREE.BufferAttribute(await typed(B.dat, Float32Array, ctx), 4));
  g.setAttribute('aUv', new THREE.BufferAttribute(await typed(B.uv, Float32Array, ctx), 3));
  const n = B.pos.length / 3, shA = B.shA || new Float32Array(n);
  if (!B.shA) for (let v = 0; v < n; v++) shA[v] = B.dat[v * 4 + 3];
  g.setAttribute('aShadeA', new THREE.BufferAttribute(shA, 1));
  g.setIndex(new THREE.BufferAttribute(await typed(B.idx, Uint32Array, ctx), 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 10, 0), 260);     // given, so the first frame does not stop to measure it
  return g;
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- one petal: cupped, ruffled along a scalloped lip thinned to nothing, wrapped round the flower ----
// p: { R0, Y0, L, W, elev, cup, roll, th0 (azimuth), tier, seq, ruf, nr, ns, ph1, ph2, ph3, thick }
const PNU = 30, PNV = 9;    // 30 across = ten quads to each of the three lobes of the lip, five to each flute
// (for a world that cuts lesser blooms from the same petals: the grid of one petal, petals per tier, a tier's root radius and height)
export const PETAL_GRID = { nu: PNU, nv: PNV, counts: TIERS.map((t) => t[5]), roots: TIERS.map((t) => [t[0], t[1]]) };
function addPetal(B, p) {
  const NS = 32, clR = new Float32Array(NS + 1), clY = new Float32Array(NS + 1), clA = new Float32Array(NS + 1);
  let r = p.R0 - 2.2, y = p.Y0 - 0.4;                      // the root starts inside the core: still joined to the block
  for (let k = 0; k <= NS; k++) {
    const s = k / NS, a = p.elev + p.cup * Math.sin(Math.PI * Math.min(1, s / 0.8) * 0.9) - p.roll * sstep(0.62, 1.05, s);
    clR[k] = r; clY[k] = y; clA[k] = a;
    r += Math.cos(a) * (p.L + 2.2) / NS; y += Math.sin(a) * (p.L + 2.2) / NS;
  }
  const top = new Float32Array((PNU + 1) * (PNV + 1) * 3), bot = new Float32Array(top.length);
  const lipA = new Float32Array((PNU + 1) * (PNV + 1));
  const px = Math.sin(p.th0) * p.R0, pz = Math.cos(p.th0) * p.R0;
  for (let j = 0; j <= PNV; j++) for (let i = 0; i <= PNU; i++) {
    const u = (i / PNU) * 2 - 1, v = Math.pow(j / PNV, 0.85), o = (i + j * (PNU + 1)) * 3;
    const lenS = (0.74 + 0.26 * Math.sqrt(1 - u * u * 0.97)) * (1 + p.scal * (Math.pow(Math.abs(Math.cos(u * Math.PI * 1.5)), 0.55) - 0.62));
    const s = Math.min(1, v * lenS), f = s * NS, k = Math.min(NS - 1, Math.floor(f)), fr = f - k;
    const cr = clR[k] + (clR[k + 1] - clR[k]) * fr, cy = clY[k] + (clY[k + 1] - clY[k]) * fr, a = clA[k] + (clA[k + 1] - clA[k]) * fr;
    const hw = p.W * 0.5 * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * 0.5 * Math.min(1, s / 0.62)), 0.8)) * (1 - 0.1 * sstep(0.7, 1, s));
    const x = u * hw;
    const lift = p.cup2 * u * u * hw * (0.25 + 0.75 * sstep(0, 0.5, s))
      + p.flute * 0.5 * Math.cos(u * Math.PI * 6) * sstep(0.12, 0.7, s)
      + p.ruf * s * s * s * Math.sin(u * Math.PI * p.nr + p.ph1);
    const rr = cr - lift * Math.sin(a), y1 = cy + lift * Math.cos(a), yy = y1 > 45.6 ? 45.6 + 1.3 * (1 - Math.exp(-(y1 - 45.6) / 1.3)) : y1;   // nothing can stand above the uncut top of the block
    const ph = p.th0 + (x / Math.max(rr, 9)) * 0.92;
    top[o] = Math.sin(ph) * rr; top[o + 1] = yy; top[o + 2] = Math.cos(ph) * rr;
    const edge = Math.min((1 - j / PNV) * p.L, j / PNV > 0.22 ? (1 - Math.abs(u)) * hw : 99);
    lipA[i + j * (PNU + 1)] = 1 - Math.min(1, edge / 1.5);
  }
  const data = (i, j, Bf, v) => putV(Bf, v, px, p.Y0, pz, p.tier, p.seq, lipA[i + j * (PNU + 1)], 1, (i / PNU) * 2 - 1, j / PNV, 0);
  const b0 = addGrid(B, top, PNU, PNV, 1, data);
  // underside: the top surface pushed back along its own normal, 4 m at the root and nothing at lip and sides
  for (let j = 0; j <= PNV; j++) for (let i = 0; i <= PNU; i++) {
    const u = (i / PNU) * 2 - 1, v = j / PNV, o = (i + j * (PNU + 1)) * 3, n = (b0 + i + j * (PNU + 1)) * 3;
    const th = p.thick * Math.pow(1 - v, 0.7) * Math.sqrt(1 - u * u * u * u) * (0.55 + 0.45 * (1 - v));
    bot[o] = top[o] - B.nor[n] * th; bot[o + 1] = top[o + 1] - B.nor[n + 1] * th; bot[o + 2] = top[o + 2] - B.nor[n + 2] * th;
  }
  addGrid(B, bot, PNU, PNV, -1, data);
}

// ---- the core: the solid heart of the block under the petals, a cove undercut behind every tier's root ----
const MOUTH_A = WELL_R, MOUTH_B = WELL_R / Math.sin(WELL_PITCH);
const mouthR = (th) => 1 / Math.sqrt((Math.sin(th) / MOUTH_A) ** 2 + (Math.cos(th) / MOUTH_B) ** 2);
async function buildCore(tierPhase, lobes, ctx) {
  // profile control points [r, y, tier or -1, nose flag, mouth blend]
  const cp = [[74, -3, -1, 0, 0], [72.6, 0.4, -1, 0, 0], [70.6, 3.4, -1, 0, 0]];
  for (let k = 0; k < 9; k++) {
    const [R, Y] = TIERS[k], Yp = k ? TIERS[k - 1][1] : 3.6;
    cp.push([R - 4.4, Yp + 1.7, k, 0, 0], [R - 5.2, Y - 2.3, k, 0, 0], [R - 1.6, Y - 0.9, k, 1, 0], [R + 0.1, Y - 0.1, k, 1, 0]);
    if (k < 8) cp.push([R - 2.4, Y + 0.9, k, 0, 0]);
  }
  cp.push([1.13, 40.1, 8, 0, 1], [1.07, MOUTH_Y, 8, 0, 1], [1.01, MOUTH_Y - 0.3, 8, 0, 1], [0.99, MOUTH_Y - 1.6, 8, 0, 1]);
  // Catmull-Rom through the points: rounded knife bevels, no hard creases
  const prof = [], SUB = 2;
  for (let i = 0; i < cp.length - 1; i++) for (let s = 0; s < SUB; s++) {
    const t = s / SUB, p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
    const mouth = p1[4] || p2[4];
    const cr = (a, b, c, d) => (mouth ? b + (c - b) * t : 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t));
    prof.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1]), p1[2], p1[3] + (p2[3] - p1[3]) * t, p1[4] && p2[4] ? 1 : (p2[4] ? -1 : 0), p1[0], p2[0]]);
  }
  const last = cp[cp.length - 1]; prof.push([last[0], last[1], 8, 0, 1, last[0]]);
  const NT = 96, NP = prof.length - 1, P = new Float32Array((NT + 1) * (NP + 1) * 3);
  for (let j = 0; j <= NP; j++) for (let i = 0; i <= NT; i++) {
    if (i === 0 && j % 20 === 19) await ctx.yield();
    const th = (i / NT) * Math.PI * 2, q = prof[j], o = (i + j * (NT + 1)) * 3;
    let r = q[0];
    if (q[4] === 1) r = mouthR(th) * q[0];                               // the rim of the well: an ellipse, the bore cut level
    else if (q[4] === -1) r = q[5] + (mouthR(th) * q[6] - q[5]) * (j % SUB) / SUB;
    else r *= 1 + 0.012 * Math.sin(th * lobes + q[1] * 0.3) + (q[3] > 0 ? 0 : 0.008 * Math.cos(th * (q[2] < 0 ? 28 : TIERS[q[2]][5] * 3)));
    P[o] = Math.sin(th) * r; P[o + 1] = q[1]; P[o + 2] = Math.cos(th) * r;
  }
  await ctx.yield();
  const B = newBuf((NT + 1) * (NP + 1), NT * NP * 6);
  await addGridA(B, P, NT, NP, -1, (i, j, Bf, v) => {
    const q = prof[j], k = Math.max(0, q[2]), sq = i / NT + tierPhase[k];
    putV(Bf, v, 1, 0, 0, k, sq - Math.floor(sq), q[2] < 0 ? 0 : q[3], 1, (i / NT) * 6.2832 * q[0], q[1], 1);
  }, ctx, 6);
  return B;
}

// ---- the well: a 16 m bore at 63 degrees, its top cut level with the crown, opening into the buff chamber ----
const WELL_DIR = [0, -Math.sin(WELL_PITCH), -Math.cos(WELL_PITCH)], WELL_E2 = [0, -Math.cos(WELL_PITCH), Math.sin(WELL_PITCH)];
const WELL_END = 76, PORTAL_S = 62, CHAMBER_R = 12.5;
const wellRad = (s) => WELL_R + (CHAMBER_R - WELL_R) * sstep(56.6, 61, s) - 4 * sstep(WELL_END - 2.5, WELL_END, s) ** 2;
function wellPoint(s, R, ph, out, o) {
  const c = Math.cos(ph) * R, sn = Math.sin(ph) * R;
  out[o] = c + WELL_DIR[0] * s; out[o + 1] = MOUTH_Y + WELL_DIR[1] * s + WELL_E2[1] * sn; out[o + 2] = WELL_DIR[2] * s + WELL_E2[2] * sn;
}
function buildWell() {
  const NA = 48, NB = 44, NF = 5, B = newBuf((NA + 1) * (NB + 1) + (NA + 1) * (NF + 1), NA * NB * 6 + NA * NF * 6), P = new Float32Array((NA + 1) * (NB + 1) * 3), SS = new Float32Array((NA + 1) * (NB + 1));
  for (let j = 0; j <= NB; j++) for (let i = 0; i <= NA; i++) {
    const ph = (i / NA) * Math.PI * 2, s0 = -WELL_R * Math.cos(WELL_PITCH) * Math.sin(ph) / Math.sin(WELL_PITCH) + 0.3;
    const t = j / NB, s = s0 + (WELL_END - s0) * (0.35 * t + 0.65 * t * t * (3 - 2 * t));
    SS[i + j * (NA + 1)] = s; wellPoint(s, wellRad(s), ph, P, (i + j * (NA + 1)) * 3);
  }
  addGrid(B, P, NA, NB, 1, (i, j, Bf, v) => putV(Bf, v, 1, 0, 0, -9, 0, 0, 1, (i / NA) * Math.PI * 2 * WELL_R, SS[i + j * (NA + 1)], 2));
  const F = new Float32Array((NA + 1) * (NF + 1) * 3), R1 = wellRad(WELL_END);   // the fret floor, square to the bore
  for (let j = 0; j <= NF; j++) for (let i = 0; i <= NA; i++) wellPoint(WELL_END, R1 * (1 - j / NF), (i / NA) * Math.PI * 2, F, (i + j * (NA + 1)) * 3);
  addGrid(B, F, NA, NF, 1, (i, j, Bf, v) => {
    const ph = (i / NA) * Math.PI * 2, R = R1 * (1 - j / NF);
    putV(Bf, v, 1, 0, 0, -9, 0, 1, 1, Math.cos(ph) * R, Math.sin(ph) * R, 2);
  });
  for (let n = B.nor.length - (NA + 1) * (NF + 1) * 3; n < B.nor.length; n += 3) { B.nor[n] = -WELL_DIR[0]; B.nor[n + 1] = -WELL_DIR[1]; B.nor[n + 2] = -WELL_DIR[2]; }
  return B;
}

// ---- a collar leaf lying out over the water, and the water apron itself ----
function addLeaf(B, th0, r0, L, W, y0, ph, fold) {
  const NU = 6, NV = 9, top = new Float32Array((NU + 1) * (NV + 1) * 3), bot = new Float32Array(top.length), lipA = new Float32Array((NU + 1) * (NV + 1));
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = (i / NU) * 2 - 1, v = j / NV, o = (i + j * (NU + 1)) * 3;
    const hw = W * 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(0.08 + 0.92 * v, 0.72)), 0.85) * (1 + 0.07 * Math.sin(v * 21 + ph));
    const r = r0 - 2 + (L + 2) * v, x = u * hw + Math.sin(v * 2.4 + ph) * 1.6 * v;
    const y = 0.75 + y0 * Math.pow(1 - v, 1.5) + 1.7 * Math.sin(Math.PI * v) + fold * Math.abs(u) * hw * 0.22 + 0.35 * Math.sin(u * 5 + v * 9 + ph) * v;
    const a = th0 + x / r;
    top[o] = Math.sin(a) * r; top[o + 1] = y; top[o + 2] = Math.cos(a) * r;
    lipA[i + j * (NU + 1)] = 1 - Math.min(1, Math.min((1 - Math.abs(u)) * hw, (1 - v) * L) / 1.2);
  }
  const data = (i, j, Bf, v) => putV(Bf, v, 1, 0, 0, -9, 0, lipA[i + j * (NU + 1)], 1, (i / NU) * 2 - 1, j / NV, 4);
  const b0 = addGrid(B, top, NU, NV, 1, data);
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = (i / NU) * 2 - 1, v = j / NV, o = (i + j * (NU + 1)) * 3, n = (b0 + i + j * (NU + 1)) * 3;
    const t = 1.3 * Math.sqrt(Math.max(0, 1 - u * u)) * Math.sqrt(1 - v);
    bot[o] = top[o] - B.nor[n] * t; bot[o + 1] = top[o + 1] - B.nor[n + 1] * t; bot[o + 2] = top[o + 2] - B.nor[n + 2] * t;
  }
  addGrid(B, bot, NU, NV, -1, data);
}
function buildApron(R1) {
  const NT = 96, NR = 26, B = newBuf((NT + 1) * (NR + 1), NT * NR * 6), P = new Float32Array((NT + 1) * (NR + 1) * 3);
  for (let j = 0; j <= NR; j++) for (let i = 0; i <= NT; i++) {
    const th = (i / NT) * Math.PI * 2, r = 60 + (R1 - 60) * Math.pow(j / NR, 1.5), o = (i + j * (NT + 1)) * 3;
    P[o] = Math.sin(th) * r; P[o + 1] = 0; P[o + 2] = Math.cos(th) * r;
  }
  addGrid(B, P, NT, NR, 1, (i, j, Bf, v) => { const o = (i + j * (NT + 1)) * 3; putV(Bf, v, 1, 0, 0, -9, 0, 0, 1, P[o], P[o + 2], 3); });
  return B;
}

// ---- cast shade, baked per vertex: march toward the key through the petal layers of every tier and the core ----
const SG = 160, SEXT = 104;
async function makeShadeLayers(PB, ctx) {
  const H = new Float32Array(9 * SG * SG).fill(-1e9), U = new Float32Array(9 * SG * SG).fill(1e9), HM = new Float32Array(SG * SG).fill(-1e9);
  const n = PB.pos.length / 3;
  for (let v = 0; v < n; v++) {
    if (v % 500 === 499) await ctx.yield();
    const k = PB.dat[v * 4], x = PB.pos[v * 3], y = PB.pos[v * 3 + 1], z = PB.pos[v * 3 + 2];
    const gx = Math.round((x + SEXT) / (2 * SEXT) * SG), gz = Math.round((z + SEXT) / (2 * SEXT) * SG);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const ix = gx + dx, iz = gz + dz; if (ix < 0 || iz < 0 || ix >= SG || iz >= SG) continue;
      const o = (iz * SG + ix) * 9 + k; if (y > H[o]) H[o] = y; if (y < U[o]) U[o] = y; if (y > HM[iz * SG + ix]) HM[iz * SG + ix] = y;
    }
  }
  return { H, U, HM };
}
function coreRadiusAt(y) {                                  // the solid heart as a shade caster (coves ignored)
  if (y < 4) return 71; if (y > 39) return y < 40.3 ? 11 : 0;
  const f = (y - 4.5) / 4, k = Math.min(8, Math.max(0, Math.floor(f)));
  return TIERS[k][0] - 3;
}
async function bakeShade(B, L, key, ctx, own, nSteps = 22) {
  const { H, U, HM } = L, n = B.pos.length / 3, hl = Math.max(Math.hypot(key[0], key[2]), 1e-4);
  const kx = key[0] / hl, kz = key[2] / hl, ky = key[1] / hl;
  // (a yield every 400 vertices, a millisecond or two of work: asked for again inside its slice the engine's yield
  // returns at once, so asking often costs no frame, and on a busy machine no single piece comes near 50 ms)
  for (let v = 0; v < n; v++) {
    if (v % 400 === 399) await ctx.yield();
    let x = B.pos[v * 3] + B.nor[v * 3] * 0.7, y = B.pos[v * 3 + 1] + B.nor[v * 3 + 1] * 0.7, z = B.pos[v * 3 + 2] + B.nor[v * 3 + 2] * 0.7;
    let occ = 0, step = 1.1;
    for (let s = 0; s < nSteps && occ < 1; s++) {
      x += kx * step; z += kz * step; y += ky * step; step *= 1.11;
      if (y > 50) break;
      if (s > 1) { const cr = coreRadiusAt(y); if (cr > 0 && x * x + z * z < cr * cr * 1.000001) { const r = Math.hypot(x, z); if (r < cr) { occ = Math.max(occ, Math.min(1, (cr - r) / 2)); continue; } } }
      const gx = Math.round((x + SEXT) / (2 * SEXT) * SG), gz = Math.round((z + SEXT) / (2 * SEXT) * SG);
      if (gx < 0 || gz < 0 || gx >= SG || gz >= SG) break;
      if (y > HM[gz * SG + gx] - 0.45) continue;            // above every layer here: nothing can shade it
      const o = (gz * SG + gx) * 9, me = own ? B.dat[v * 4] : -1;
      for (let k = 0; k < 9; k++) {
        const h = H[o + k]; if (h < -1e8) continue;
        const mine = k === me;
        if (mine && s < 4) continue;
        const dep = mine ? Math.min(h - 1.6 - y, y - U[o + k] - 1.2) : Math.min(h - 0.45 - y, y - U[o + k] + 0.3);
        if (dep > 0) occ = Math.max(occ, Math.min(1, dep / 1.2));
      }
    }
    B.dat[v * 4 + 3] = 1 - occ;
  }
}

// ---- shavings: curls of cut lacquer that peel off each tier's groove, snap free and wheel round the flower ----
const CURL_VERT = /* glsl */`
attribute vec4 iA, iB; attribute vec3 iC;      // iA: tier (-1 = already flying), seq, length, phase; iB: three randoms, turns; iC: r, y, angle
uniform float uProg, uTime;
varying vec3 vW, vN; varying vec2 vT;
#include <fog_pars_vertex>
void main() {
  float t = position.x, wd = position.y, tier = iA.x;
  float head = tier < -.5 ? 40. : (uProg - (.34 + .06 * tier)) / .05 + 1. - iA.y;
  float age = max(head, 0.) * 2.3;
  float grow = smoothstep(0., .3, age), free = smoothstep(.35, 1.1, age), k = 1. - exp(-age * .45);
  float th = iC.z + k * (.7 + iB.z) + uTime * .05 * free;
  float r = iC.x + 3. + k * (16. + 24. * iB.x) + 2.5 * sin(uTime * .31 + iA.w) * free;
  float y = iC.y + 1.5 + k * (9. + 20. * iB.y) + 3. * sin(uTime * .4 + th * 2.) * free;
  vec3 rad = vec3(sin(th), 0., cos(th)), tan_ = vec3(cos(th), 0., -sin(th));
  vec3 A = tan_ * (.25 + .75 * free) + vec3(0., 1., 0.) * (1. - free) + rad * .3 * sin(iA.w * 3.); A /= max(length(A), 1e-4);
  vec3 Bv = rad - A * dot(rad, A); Bv /= max(length(Bv), 1e-4);
  vec3 Cv = cross(A, Bv);
  float flex = 1. + .32 * sin(uTime * 9.42 + iA.w) * free;                 // opening and closing 1.5 times a second
  float ang = (t - .5) * iB.w * 6.2832 * flex + iA.w;
  float rho = iA.z * .13 / flex;
  float w = wd * .62 * smoothstep(0., .1, t) * (1. - smoothstep(.86, 1., t));
  vec3 nrm = Bv * cos(ang) + Cv * sin(ang);
  // near the lens a shaving is finer, and every other one is gone: a ribbon is never broad against the lens
  vec3 c0 = vec3(rad * r) + vec3(0., y, 0.);
  float dn = length(cameraPosition - (modelMatrix * vec4(c0, 1.)).xyz);
  float nearK = (.55 + .45 * smoothstep(16., 60., dn)) * smoothstep(8., 13., dn);
  // released curls fly on for the whole flight, thinned by nothing but their distance from the lens (above)
  vec3 p = c0 + (A * ((t - .5) * iA.z * .5 * flex + w) + nrm * rho) * (grow * nearK);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix) * nrm; vT = vec2(t, wd * 2.);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
export const CURL_FRAG = /* glsl */`
uniform vec3 uKey, uKeyCol, cRed, cRed2, cBuff, cGlow, cBounce, cHoney, cFar, uLift;
uniform float uFill, uGlow;
varying vec3 vW, vN; varying vec2 vT;
#include <fog_pars_fragment>
void main() {
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float face = gl_FrontFacing ? 1. : 0.;
  if (face < .5) N = -N;
  float tri = abs(fract(clamp(vT.x, 0., 1.) * 9.) - .5) * 2.;      // (along and across are held to the ribbon's own range: a varying runs past it at a silhouette)
  vec3 alb = mix(mix(cRed, cBuff, .28), cRed, face) * (1. - .14 * smoothstep(.5, .95, tri) * face);
  float w = clamp((dot(N, uKey) + .35) / 1.35, 0., 1.);
  vec3 col = alb * (uKeyCol * w + mix(cBounce, cHoney, N.y * .5 + .5) * uFill);
  float rim = 1. - max(dot(N, V), 0.); col += .35 * rim * rim * rim * alb;
  float edge = smoothstep(.78, 1., min(abs(vT.y), 1.)), tow = clamp(.45 - dot(V, uKey) * .7, 0., 1.);
  col += cGlow * (uGlow * edge * tow * tow);
  col = mix(col, cFar, .75 * (1. - exp(-dist / 700.)));
  gl_FragColor = vec4(clamp(col, 0., 40.) + uLift, 1.);
  #include <fog_fragment>
}`;
// ---- the slow red rain: beads 0.25 m long falling at 3 m/s, kept at least a pixel and a half wide ----
const RAIN_VERT = /* glsl */`
attribute vec4 iP;
uniform float uTime;
varying float vL;
#include <fog_pars_vertex>
void main() {
  vec3 c = vec3(iP.x, mod(iP.y - uTime * (2.7 + .6 * iP.w), 78.) - 6., iP.z);
  vec4 wc = modelMatrix * vec4(c, 1.);
  float dist = length(cameraPosition - wc.xyz);
  vec3 side = vec3(cameraPosition.z - wc.z, 0., wc.x - cameraPosition.x); side /= max(length(side), 1e-4);
  vec4 wp = wc + vec4(side * position.x * max(.06, dist * .0007) + vec3(0., position.y * max(.25, dist * .0034), 0.), 0.);
  vL = 1. - .7 * position.x * position.x - .25 * position.y;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RAIN_FRAG = /* glsl */`
uniform vec3 cRed, uKeyCol, uLift;
varying float vL;
#include <fog_pars_fragment>
void main() {
  // a bead is the lit vermilion at its tail and the brief's highlight (#DB4A34) at its head, never lighter (vL runs .25 to
  // 1.25 over a bead and is held there: under multisampling a varying runs on past its range on so thin a quad)
  gl_FragColor = vec4(cRed * (uKeyCol * (.5 + .216 * clamp(vL, .25, 1.25))) + uLift, 1.);
  #include <fog_fragment>
}`;
function curlGeometry(count) {
  const NS = 28, pos = [], idx = [];
  for (let i = 0; i <= NS; i++) { pos.push(i / NS, -0.5, 0, i / NS, 0.5, 0); if (i < NS) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 220);
  return g;
}

const DEFAULT_PALETTE = ['#B3261E', '#7A1712', '#3F6B4A', '#D9B77A', '#16110F', '#E86A3A'];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const D2R = Math.PI / 180;
  // per-seed character: how open the flower is, how ruffled, how the tiers are staggered
  const open = rng.range(-4, 4) * D2R, rufAmt = rng.range(0.95, 1.6), cupAmt = rng.range(0.85, 1.2), lobes = rng.int(5, 9);
  const tierPhase = [], stagger = [];
  for (let k = 0; k < 9; k++) { tierPhase.push(rng()); stagger.push(k * 0.5 + rng.range(-0.18, 0.18)); }
  const keyL = new THREE.Vector3().fromArray(opts.keyDir || [-0.894, 0.309, 0.325]).normalize();

  // petals
  const nPet = TIERS.reduce((a, t) => a + t[5], 0);
  const PB = newBuf(nPet * 2 * (PNU + 1) * (PNV + 1), nPet * 2 * PNU * PNV * 6), tierLip = [], tierSix = [];
  const canopyAz = typeof opts.canopyAz === 'number' ? opts.canopyAz : null;
  let canopyM = -1, canopyBase = -1;
  if (canopyAz !== null) { let best = 9; for (let m = 0; m < TIERS[5][5]; m++) { const a = ((m + stagger[5]) / TIERS[5][5]) * Math.PI * 2 - canopyAz, e = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (e < best) { best = e; canopyM = m; } } }
  for (let k = 0; k < 9; k++) {
    const [R0, Y0, L, el, W, n] = TIERS[k], f = k / 8;
    for (let m = 0; m < n; m++) {
      const th0 = ((m + stagger[k]) / n) * Math.PI * 2 + rng.range(-0.035, 0.035), sq = th0 / (Math.PI * 2) + tierPhase[k];
      const base = PB.n;
      const pp = {
        R0, Y0, tier: k, th0, seq: sq - Math.floor(sq), thick: 4,
        L: L * rng.range(0.93, 1.07), W: W * rng.range(0.94, 1.04),
        elev: el * D2R + open * (0.4 + 0.6 * f) + ((m % 2) ? 2.6 : -2.6) * D2R + rng.range(-1.5, 1.5) * D2R,
        cup: (15 + 12 * f) * D2R * cupAmt, roll: ((k === 0 ? 62 : 38) - 16 * f) * D2R * rng.range(0.85, 1.15), cup2: rng.range(0.3, 0.46),
        ruf: rufAmt * (W / 26) * rng.range(0.8, 1.4), nr: rng.range(1.1, 2.3), scal: rng.range(0.1, 0.16), flute: (W / 26) * rng.range(0.45, 0.7),
        ph1: rng.range(0, 6.28),
      };
      // the canopy: one tier-six petal reaches out level over the trough so the flight can pass under its lip, and the
      // tier-five petals beneath it lie lower to leave that trough open (the values drawn above are only scaled)
      const dCan = canopyAz === null ? 9 : Math.abs(Math.atan2(Math.sin(th0 - canopyAz), Math.cos(th0 - canopyAz)));
      const isCanopy = k === 5 && m === canopyM;
      if (isCanopy) { pp.L *= 1.55; pp.elev = 36 * D2R; pp.roll = 104 * D2R; pp.W *= 1.12; pp.ruf = Math.min(pp.ruf, 1.1) * 0.5; pp.cup = 17 * D2R; pp.thick = 3.2; canopyBase = base; }
      else if (k === 4 && dCan < 1.1) { const f = 1 - sstep(0.72, 1.1, dCan); pp.elev -= 27 * D2R * f; pp.L *= 1 - 0.1 * f; pp.roll *= 1 + 0.5 * f; pp.cup2 *= 1 - 0.6 * f; }
      else if (k === 3 && dCan < 1.0) { const f = 1 - sstep(0.6, 1.0, dCan); pp.elev -= 8 * D2R * f; pp.cup2 *= 1 - 0.5 * f; }
      addPetal(PB, pp);
      const lv = (base + PNU / 2 + PNV * (PNU + 1)) * 3, lip = new THREE.Vector3(PB.pos[lv], PB.pos[lv + 1], PB.pos[lv + 2]);
      if (m === 0) tierLip.push({ r: Math.hypot(lip.x, lip.z), y: lip.y });
      if (k === 5) tierSix.push({ lip, azimuth: th0, canopy: isCanopy });
      await ctx.yield();
    }
    await ctx.yield();
  }
  // a world that turns the flower to suit its path only knows the turn once the lips have fallen: it may give the key here
  // (as [x,y,z], or as { key, early } when its key stands elsewhere early in the flight: the petals then carry a second
  // baked shade for that direction and uKeyMix, 0 early to 1, blends the two)
  let keyEarly = null;
  if (opts.keyFor) { const kf = opts.keyFor(tierSix); if (Array.isArray(kf)) keyL.fromArray(kf).normalize(); else { keyL.fromArray(kf.key).normalize(); keyEarly = new THREE.Vector3().fromArray(kf.early).normalize().toArray(); } }
  await ctx.yield();
  const layers = await makeShadeLayers(PB, ctx);
  await ctx.yield();
  const key3 = [keyL.x, keyL.y, keyL.z];
  const bakePetals = async (k3, nSteps) => {
    await bakeShade(PB, layers, k3, ctx, true, nSteps);
    // soften the petal shade: one box pass over each petal's own grid (a three-texel penumbra)
    const W = PNU + 1, Hh = PNV + 1, per = W * Hh, src = new Float32Array(per), nG = PB.pos.length / 3 / per;
    for (let g = 0; g < nG; g++) {
      for (let i = 0; i < per; i++) src[i] = PB.dat[(g * per + i) * 4 + 3];
      for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
        let a = 0, n = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const x = i + di, y = j + dj; if (x >= 0 && y >= 0 && x < W && y < Hh) { a += src[x + y * W]; n++; } }
        PB.dat[(g * per + i + j * W) * 4 + 3] = a / n;
      }
      if (g % 4 === 3) await ctx.yield();
    }
  };
  if (keyEarly) {
    await bakePetals(keyEarly, 14);      // only ever seen from far off: a shorter march
    PB.shA = new Float32Array(PB.pos.length / 3);
    for (let v = 0; v < PB.shA.length; v++) PB.shA[v] = PB.dat[v * 4 + 3];
    await ctx.yield();
  }
  await bakePetals(key3, 22);
  await ctx.yield();
  const CB = await buildCore(tierPhase, lobes, ctx); await ctx.yield();
  await bakeShade(CB, layers, key3, ctx, false);
  const WB = buildWell(); await ctx.yield();
  const nLeaf = 15, LB = newBuf(nLeaf * 2 * 2 * 70, nLeaf * 2 * 2 * 324), leafPh = rng();
  for (let i = 0; i < nLeaf * 2; i++) {
    const big = i % 2 === 0, th = ((i * 0.5 + leafPh) / nLeaf) * Math.PI * 2 + rng.range(-0.05, 0.05);
    addLeaf(LB, th, big ? 69.5 : 70.5, big ? rng.range(19, 24) : rng.range(11, 15), big ? rng.range(14, 17) : rng.range(9, 11), big ? 5.2 : 3.2, rng.range(0, 6.28), rng.range(0.7, 1.3));
  }
  await ctx.yield();
  await bakeShade(LB, layers, key3, ctx, false);
  const wantApron = opts.apron !== false, AB = buildApron(opts.apronRadius || 210);
  await ctx.yield();
  await bakeShade(AB, layers, key3, ctx, false);
  await ctx.yield();

  // one material, one program, for everything carved
  const lin = (h) => new THREE.Color(h);
  // the grade's contrast works on linear colour and takes about 0.025 off every channel, which leaves a pure red
  // with no green or blue at all (#A60000) and shade with no hue: uLift is a small veil added to every fragment
  // to stand against it, so lit red lands near #C4291F and its shade near #6E1511 (checked on screenshots)
  const lift = (c, a) => c.lerp(new THREE.Color(1, 1, 1), a);
  const U = {
    cRed: { value: lift(pal[0].clone().multiplyScalar(1.1), 0.01) }, cRed2: { value: lift(pal[0].clone().lerp(pal[1], 0.34), 0.008) }, cGreen: { value: pal[2].clone().multiplyScalar(1.35) },
    cBuff: { value: pal[3].clone() }, cBlack: { value: pal[4].clone() }, cGlow: { value: pal[5].clone() },
    cJade: { value: lin('#DDF6E4') }, cFar: { value: lin('#5A100E') }, cFresh: { value: lin('#D2382A') }, cHi: { value: lin('#FF7A5A') },
    cBounce: { value: pal[0].clone().multiplyScalar(0.26).lerp(new THREE.Color(0.13, 0.13, 0.13), 0.55) }, cHoney: { value: pal[3].clone().multiplyScalar(0.2).lerp(new THREE.Color(0.16, 0.16, 0.16), 0.5) },
    uKey: { value: keyL.clone() }, uKeyCol: { value: lin('#FFF0DC').multiplyScalar(1.2) }, uPortal: { value: new THREE.Vector3() }, uMouth: { value: new THREE.Vector3() },
    uTop: { value: TOP }, uTime: { value: 0 }, uProg: { value: 0 }, uKeyMix: { value: 1 }, uFill: { value: 2.4 }, uGlow: { value: 2.2 },
    uLift: { value: new THREE.Color().fromArray(opts.lift || [0.024, 0.042, 0.04]) },
    cCap: { value: lin('#1B1513') }, cDeep: { value: new THREE.Color(0.05, 0.006, 0.005) }, uMarble: { value: opts.marble ? 1 : 0 }, uCap: { value: opts.cap ?? -100 },
    // (the shade's toe and the dimming of the canopy's ceiling near the lens: both off unless a world sets them)
    uToe: { value: new THREE.Vector3(0, 0, 0) }, uUnder: { value: 0 },
  };
  const mkMat = (vertexShader, fragmentShader, side) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader, fragmentShader, fog: true, side,
  });
  const mat = mkMat(VERT, FRAG, THREE.FrontSide);
  const object = new THREE.Group(); object.name = 'peony-boss';
  const parts = {};
  for (const [name, Bf] of [['petals', PB], ['core', CB], ['well', WB], ['leaves', LB], ['apron', AB]]) {
    const m = new THREE.Mesh(await toGeometry(Bf, ctx), mat); m.name = name; m.frustumCulled = false;
    if (name === 'apron') m.visible = wantApron;
    object.add(m); parts[name] = m;
    await ctx.yield();
  }

  // shavings: a dozen per tier waiting on the groove, and a flock already on the wing
  const perTier = Math.max(6, Math.round(12 * detail)), nFlock = Math.round(28 * detail), nCurl = perTier * 9 + nFlock;
  const iA = new Float32Array(nCurl * 4), iB = new Float32Array(nCurl * 4), iC = new Float32Array(nCurl * 3);
  const flockAz = rng.range(0, 6.28);
  for (let i = 0; i < nCurl; i++) {
    const k = i < perTier * 9 ? Math.floor(i / perTier) : -1;
    if (k >= 0) {
      const seq = ((i % perTier) + rng.range(0.1, 0.9)) / perTier;
      iA.set([k, seq, rng.range(4.2, 5.6), rng.range(0, 6.28)], i * 4);
      iC.set([TIERS[k][0] + 1, TIERS[k][1], (seq - tierPhase[k]) * Math.PI * 2], i * 3);
    } else {
      iA.set([-1, 0, rng.range(2.4, 5), rng.range(0, 6.28)], i * 4);
      iC.set([rng.range(62, 84), rng.range(2, 16), flockAz + rng.gauss() * 0.42], i * 3);
    }
    iB.set([rng(), rng(), rng.range(0, 0.6), rng.range(2, 3)], i * 4);
  }
  const cg = curlGeometry(nCurl);
  cg.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); cg.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  cg.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 3));
  const curls = new THREE.Mesh(cg, mkMat(CURL_VERT, CURL_FRAG, THREE.DoubleSide)); curls.name = 'shavings'; curls.frustumCulled = false;
  object.add(curls);
  await ctx.yield();
  const nRain = Math.round(900 * detail), iP = new Float32Array(nRain * 4);
  for (let i = 0; i < nRain; i++) {
    const a = rng.range(0, 6.2832), r = 150 * Math.sqrt(rng());
    iP.set([Math.sin(a) * r, rng.range(0, 78), Math.cos(a) * r, rng()], i * 4);
  }
  const rg = new THREE.InstancedBufferGeometry();     // a bead is a small upright lozenge turned to face the lens
  rg.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, -1, 0.2, 0, 1, 0.2, 0, 0, -1, 0], 3)); rg.setIndex([0, 1, 2, 2, 1, 3]);
  rg.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); rg.instanceCount = nRain;
  const rain = new THREE.Mesh(rg, mkMat(RAIN_VERT, RAIN_FRAG, THREE.DoubleSide)); rain.name = 'rain'; rain.frustumCulled = false;
  rain.visible = opts.rain !== false;
  object.add(rain);

  // anchors, all in local space
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const dir = V3(...WELL_DIR), mouth = V3(0, MOUTH_Y, 0), along = (s) => mouth.clone().addScaledVector(dir, s);
  const portalSeat = { position: along(PORTAL_S), normal: dir.clone().negate() }, mouthIn = along(7);
  const fly = [];
  for (let k = 5; k < 9; k++) fly.push(V3(0, tierLip[k].y + 8 + (k === 5 ? 1 : 0), tierLip[k].r + (k === 5 ? 9 : 2)));
  fly.push(along(-22), along(-8), mouth.clone(), along(30), along(PORTAL_S));
  let six = tierSix[0];
  for (const p of tierSix) if (Math.abs(Math.sin((p.azimuth - 2.2) / 2)) < Math.abs(Math.sin((six.azimuth - 2.2) / 2))) six = p;
  const sixOut = V3(Math.sin(six.azimuth), 0, Math.cos(six.azimuth));
  // the slot under the canopy: its lowest underside and the highest tier-five petal beneath it, between r 40 and 48
  let canopy = null;
  if (canopyBase >= 0) {
    const cs = tierSix.find((p) => p.canopy), per = (PNU + 1) * (PNV + 1);
    let under = 99, floor = -99;
    for (let v = canopyBase; v < canopyBase + 2 * per; v++) { const r = Math.hypot(PB.pos[v * 3], PB.pos[v * 3 + 2]); if (r > 40 && r < 47 && Math.abs((v - canopyBase) % (PNU + 1) - PNU / 2) < PNU * 0.375) under = Math.min(under, PB.pos[v * 3 + 1]); }
    for (let v = 0; v < PB.pos.length / 3; v++) {
      if (PB.dat[v * 4] !== 4) continue;
      const x = PB.pos[v * 3], z = PB.pos[v * 3 + 2], r = Math.hypot(x, z); if (r < 39 || r > 49) continue;
      const da = Math.atan2(x, z) - cs.azimuth; if (Math.abs(Math.atan2(Math.sin(da), Math.cos(da))) < 0.5) floor = Math.max(floor, PB.pos[v * 3 + 1]);
    }
    canopy = { azimuth: cs.azimuth, lip: cs.lip.clone(), under, floor };
  }
  const anchors = {
    portalSeat, wellAxis: { mouth, dir }, chamberFloor: along(WELL_END), flyThrough: fly,
    underPetal: { position: six.lip.clone().addScaledVector(sixOut, 1).add(V3(0, -6, 0)), look: V3(sixOut.z, 0, -sixOut.x), lip: six.lip.clone() },
    tierSix: tierSix.map((p) => ({ lip: p.lip.clone(), azimuth: p.azimuth, canopy: p.canopy })),
    tierLips: tierLip.map((t) => ({ r: t.r, y: t.y })),
    canopy, viewpoints: { flank: V3(104, 14, 0), crown: V3(0, 62, 40), bridgeSide: V3(0, 9, 200) },
    tierU: TIER_U.slice(), waterY: 0, topY: TOP, keyDir: keyL.clone(),
  };

  let progress = null;
  const wp = new THREE.Vector3(), tmp = new THREE.Vector3();
  function update(dt, time) {
    object.updateWorldMatrix(true, false);
    U.uTime.value = time;
    U.uTop.value = wp.setFromMatrixPosition(object.matrixWorld).y + TOP;
    U.uPortal.value.copy(portalSeat.position).applyMatrix4(object.matrixWorld);
    U.uMouth.value.copy(mouthIn).applyMatrix4(object.matrixWorld);
    U.uKey.value.copy(tmp.copy(keyL).transformDirection(object.matrixWorld));
    if (progress === null) {            // nobody is driving: a slow demonstration, cut free tier by tier, then healed
      const ph = (time % 46) / 46;
      U.uProg.value = ph < 0.84 ? 0.27 + (ph / 0.84) * 0.64 : 0.91 - sstep(0.84, 1, ph) * 0.64;
    } else U.uProg.value = progress;
  }
  update(0, 0);
  return {
    object, radius: 92, height: TOP, center: V3(0, 22, 0), anchors, update, uniforms: U,
    setProgress(u) { progress = u; }, setKey(d) { keyL.copy(d).normalize(); },
    parts, dispose() {}, ground: false, groundY: 0,
  };
}
