// THE YARD GOES GREEN: the look (light on black) and the one set piece, THE LAMP TOWER.
//
// THE WORLD'S ANSWER TO THE VISITOR (the one thing that goes by the metres flown): every lamp carries ONE number,
// turnAt, worked out at the build from its own place by yardTurnAt() below (the brief's one formula, the same text for
// every lamp of yard, bridge, tower, board, cutting and rim). A lamp's state is yardLamp(turnAt, doubt) in STYLE_GLSL,
// a function of uFlown - turnAt and of nothing else; tint on wet steel, streaks, halo and rain use the same call.
// uFlown is set by the world from the route's u alone (style.setFlown(u * 1250)). No clock drives a lamp's colour.
// THE HASH: one hash of place, yardCell(), with ONE salt (YARD_SALT = 17, opts.salt): one 5 m cell in fifty stands
// green at the arrival (keep 0), one in thirty doubts. 29 is only the part's default: the BUILDER, who stands the rim
// and the last post, must try them with yardCell() and choose the one salt under which no pane of the rim and no
// lamp of the last post's head doubts or stands green early (one number for all lamps, never a line for a lamp),
// hand it to makeYardStyle({ salt }) and say it and why at the head of the world file.
//
// USES OF THE EYE, all of them, each lawful under the brief's list:
//  (1) a lens's beam falloff, its glints and its halo's strength, by the direction from lamp to eye (LAMP_FS, and
//      the halo's quad in LAMP_VS with HALO_FS); a round bar's pale band is 0.45 to 1 as strong by whether the
//      floodlight stands on the eye's side of the bar, and a round bar's LAMP-LIT SKIN is shaded as the round bar
//      it truly is: lit on the side toward its lamp, and how much of that side is seen is by the ray from the eye
//      (BODY_VS vLn, BODY_FS lam: the bar's own roundness, as (3) draws it; nothing follows the eye);
//  (2) a tone by distance alone: yardTone() dims far things to a fifth at 1.5 km: lines, bands and beads of bodies,
//      lamps and their halos, streaks, smears, runs, pools, rain strokes and drips (BODY_FS, LAMP_FS, HALO_FS,
//      STREAK_VS, POOL_VS, RAIN_VS). A maker told tone 0 (makeStreaks, makeRuns, makePools: uTone) gives its
//      things NO tone by the eye's distance, and a streak told so no beam falloff by the direction to the eye
//      either (it is drawn at its full strength from everywhere): the world says so of the rim's own light, at
//      the way out;
//  (3) by the pixel's footprint (fwidth, no camera read): yardLine() keeps a line 1.5 pixels wide and dims it by true
//      over drawn; rings, ribs, beads and streak breaks go to their mean when finer than about 3 pixels. A round bar
//      is drawn inside its fixed three-sided carrier as the round bar it truly is (BODY_VS: the ray from eye to axis
//      says which pixels of the fixed carrier the bar covers; nothing is moved, turned or sized). AND BY THE EYE'S
//      DISTANCE, named here: the LEAST WIDTH a line keeps is chosen by it (a bar's pale band and a lamp's rim keep
//      2.2 pixels within 40 m of the eye and 1.5 beyond 80 m, a plate's band 3 pixels within 40 m and 1.5 beyond
//      120 m: minPx, bandPx), and the fixed carrier quad of a streak, smear, run and rain stroke is given room for
//      that least width by its distance from the eye (hw: the drawn band inside it is by the footprint);
//  (4) rain strokes and drips face the eye about their own length (RAIN_VS);
//  (5) THE ANSWER by the metres flown (uFlown).
// ORDER 1 added, each under the same list: (1) a POOL's glints lie thicker on the side of the lamp toward the eye
// (POOL_VS) and the far floodlight's catch on rain is strongest between the eye and the floodlight (RAIN_VS); a
// streak's and a smear's strength by the lamp's axis to the eye as before; (2) beads and wet runs on plate thin out
// with distance alone (BODY_FS farK); (3) THE HALO'S ONE RULE (HALO_FS: far off, by the footprint, a halo shrinks to
// the lamp's own point of 3 pixels, never wider than its face), a pool's islands and flecks, a plate's runs and
// beads and a streak's dashes go to their means.
// ORDER 2 (D3), THE HALO'S ONE RULE IN FULL, two halves, the same for every lamp of the world: (a) BY PLACE, baked at
// the build and read from no eye: a halo reaches no farther than the lesser of about three of its lamp's own lens
// widths and half the way to its nearest neighbour lamp (yardNeighbours -> site.nb -> aReach, in the lamp's own
// metres, so a far lamp's halo is small); (b) BY THE FOOTPRINT, use (3), as before: far off the halo shrinks to the
// lamp's own point of 3 pixels, never wider than its face nor than (a). Depth-tested; no rim, no disc.
// ORDER 2 (D2) added the RUN (makeRuns): the streak laid level along a wet surface; it reads the eye for tone alone (2).
// ORDER 3 (PASS E) added, reading no eye: the film's rain RINGS are no tile (yardRing: each from its own drop, place,
// size and phase on the world's clock, one cell in five at a time on two unlike grids; they still go to nothing under
// 3 pixels, use (3)); o.rings on makeWetFilm and style.calm (uCalm) are the seeded weather's numbers, set once at the
// build (after the rain: no rings, streaks in water hardly broken); buildHero takes opts.guyTurn (the guys' anchors
// turned about the mast by place).
// ORDER 3 (PASS F, "THE MEAN AND THE FILLED PATCH", the designer's second word, M1 to M5) added, each under the same list:
//  M1 THE LAW OF EVERY REFLECTION (STREAK_FS: streaks, smears, runs): one column under its lamp in a few long pieces;
//     where a piece is under about 4 pixels or the column under about 1.5, it goes over into its mean, a smooth dim
//     band: use (3), the footprint (fwidth), no eye.
//  M2 far lines get DIMMER by the footprint, use (3): the floor of a line's strength is 0.045 (BODY_FS), and a far
//     rain stroke's floor falls to a seventh (RAIN_FS). No stroke of rain was added or lengthened.
//  M3 THE FILLED PATCH. A POOL (POOL_FS) is a filled patch with a soft falling edge, no islands, no glints; it is a
//     little stronger on the side toward the eye, use (1) as before. THE LIT FACE (BODY_VS/FS, yardLightFaces): every
//     wet face takes its nearest lamp BY PLACE at the build and carries its colour as a filled soft patch by that
//     lamp's state; use (1), the direction from the face to the eye, is read for ONE thing: WHICH SIDE of a plate is
//     seen (the patch lies only on the side that looks at its lamp). It places, sizes, hides nothing.
//  M4 BLACK FACES HIDE: a band-less face lies 4 cm behind its place in depth (by gl_FragCoord, no eye) so that the
//     bracing drawn in its plane stands before it; the tower's mast has black walls between its legs.
// ORDER 3 (PASS G) added or took away, each under the same list:
//  THE RAIN (G2; the designer's six conditions, each a law of this look):
//   R1 THE LAMPS LIGHT IT: a stroke is lit by its nearest lamp alone, by ONE law for every stroke of the world
//      (RAIN_FS: the square of what is left of the reach, over the lamp's spreading, half at RAIN_HALF metres):
//      brightest beside the lamp, black at RAIN_REACH (ONE NAMED NUMBER below, 60; set it to 9 in one edit).
//   R2 THE STATE BY THE SAME NUMBER: a stroke carries its nearest lamp's own turnAt and doubt (baked at the build,
//      by place): the front stands in the rain; with the eye still no stroke changes colour.
//   R3 BLACK STAYS BLACK BETWEEN: no floodlight on rain (use (1) of order 1, the floodlight's catch, is TAKEN AWAY:
//      with both lamp colours black there is no rain); a stroke beyond every lamp's reach is not stood.
//   R4 STROKES STAND AT A DEPTH: depth-tested like every body; the world stands none within 4 m of the flown line.
//   R5 ONE FALL: all parallel, one slant, by the world's clock; 3 m long and more; a stroke keeps 1.5 pixels and
//      goes to its mean by the footprint, use (3) (its floor of strength falls where a pixel is wide).
//   R6 THE WATER TAKES IT: makeRain(..., { mirror: 1 }) draws the same strokes for a mirror group: they shiver by
//      the clock and lie in a few long pieces (the breaks go to their mean by the footprint, use (3)).
//  STEAM (G1): soft pieces only, lit ONLY within STEAM_REACH of its nearest lamp (baked by place); no floodlight.
//  A POOL (G9): after the rain (uCalm) a pool carries its lamp's drip rings, which go to their mean by the
//      footprint, use (3). (The lead's mend after pass G: a pool has NO tone by the eye's distance but yardTone's.)
// ORDER 4 (PASS H, "the faults three strangers name") added or took away, each under the same list:
//  H1 NO SPECK ON A SLAB: a plate's glass beads and runs are OUT of BODY_FS (only a CABLE keeps beads). A plate near
//     a lamp carries that lamp's GRADED PATCH and nothing else. A MOVING body may name its own nearest lamp: BODY_VS
//     holds the globals yardLit/yardLit2 (set from aLit/aLit2) which a world's yardMove may overwrite BY PLACE (the
//     train's plates take the standing lamp they pass); this reads no eye.
//  H2 a NARROW unit's hood leaves 2 hundredths off its beam (it left 12): use (1) as before (LAMP_FS, uBeam.w).
//  H3 A CABLE FAR OFF GOES OUT by its footprint, use (3) (BODY_FS flb): a guy wire thinner than a pixel is not drawn.
//  H7 THE LIT GROUND HAS THINGS IN IT (POOL_FS): the fill is graded from the lamp outward; puddles by place
//     (poolNoise) with bright edges and slow rings by the clock, both going to their mean by the footprint, use (3);
//     the lamp's own long reflection, brightest in the middle, lies from the lamp TOWARD the eye, use (1).
//  H8 a RUN is a long clean line (STREAK_FS): no dash throw, no per-plate jitter; breaks go to their mean, use (3).
// ORDER 4 (PASS J) added, reading no eye: buildHero takes opts.rainLen and opts.rainReach, the seeded weather's
// numbers for the rings' rain (drizzle: strokes 0.3 as long, lit no farther than 20 m from their lamp). No shader changed.
// ORDER 5 (PASS L, "the light") added, each under the same list; no new use of the eye:
//  L7 THE BAND (STREAK_FS uBand; makeStreaks/makeSmears o.band): THE WATER MIRRORS ITS LAMPS, NOT THE RAIN STROKE BY
//     STROKE. A lamp's mirror in standing water is ONE FILLED SMOOTH BAND WITH AN EDGE: a spindle, flat across to
//     its edge, widest and brightest at the lamp's image, graded to nothing toward the lamp's foot and toward us,
//     its edge waving and its light breathing by the clock; the bands of one rank blend by the greater (never a
//     comb). Thinner than about 3 pixels it GOES OVER INTO ITS MEAN by the footprint, use (3): a dim smooth band at
//     its true share. After the rain (uCalm) it is long and hardly drawn in. buildHero takes opts.rainMirror 0 (the
//     rings' strokes are not drawn again in the water; the rings' bands are).
//  L2 a SMEAR told band: 1 is the same filled spindle hung down wet plate (the world's engine).
//  L3 STEAM HAS AN OUTLINE (STEAM_FS): the soft field is cut at one level into one filled shape with an edge, graded
//     to its heart, its edge a line some two pixels wide by the footprint, use (3); lit by its lamp alone as before.
// ORDER 6 (PASS M, "the mends") added, under the same list; no new use of the eye:
//  M2 THE RANK'S BAND (RANK_VS/FS, makeRankBands; RANK_FALL 18 m): a rank of lamps mirrors in the water as ONE
//     filled graded band along the rank with a brighter knot under each lamp (the world lays no streak for a lamp
//     of a rank); each lamp's share by its own number, the two of a link by the greater. Uses (1) and
//     (2) at each end's lamp as a streak has them, and (3): under about 3 pixels deep it goes over into its mean.
// Nothing else reads the eye: update() takes no camera, makes nothing, and stands a step of nought.
//
// ORDER 1, THE LOOK (a wet night): colours are LINEAR under post flat (0.02 already shows as a dull slab), so:
// steel is cold and quiet (pale band 0.6, rails 0.4 in the world), lamps and their reflections are the brightest
// things; a lamp's colour comes onto steel only as beads (BODY_FS), onto the ground as its POOL (makePools), onto
// water as its long broken STREAK (makeStreaks), onto wet plate as SMEARS (makeSmears), into the air as its lit CONE
// of rain (addLampRain + makeRain) and onto STEAM (makeSteam). A tint amount under nought marks a CABLE.
//
// THE LOOK. post flat, bloom 0; palette [ink, pale steel, shade steel, signal red, signal green, glass], written as
// linear colours with no tone correction. A thing is a BLACK BODY (opaque, depth-writing, so it hides every lamp, line
// and reflection behind it, in the mirror too) carrying EDGES OF LIGHT from one far floodlight (style.flood, one fixed
// direction): a pale band a sixth of the width on the side toward it, a shade line on the far side. Colour belongs to
// lamps. No fog, no gradient but a lamp's halo and the mirror's streak.
//
// EXPORTS FOR THE WORLD (one style object shades everything):
//  makeYardStyle({ palette, flood, salt })  -> style { uniforms, flood, salt, setFlown(m), setTime(t), ... }
//  yardTurnAt(m, aside, height, keep), yardCell(x, y, z, salt), yardSite(style, place, m, aside, height, cellKey)
//  STYLE_GLSL                                the shared chunk: yardLamp, yardLampColor, yardLine, yardTone, yardHash
//  makeBodyBuilder(style)                    -> b.bar(), b.plate(), b.ring() ... b.build(): one merged black-body mesh
//  makeLampUnits(style, kind, sites, o)      -> { body, halo }: instanced lamp UNITS ('target' | 'dwarf' | 'board')
//  makeStreaks(style, sites, o)              -> the lamps' streak quads for the mirror group
//  makeRankBands(style, links, o)            -> (order 6, M2) a rank's ONE band in the water, lamp to lamp (one draw call)
//  makeRain(style, strokes, o)               -> instanced rain strokes and drips
//  makeWetFilm(style, o)                     -> the ground film (multiply by the wet mask, writes depth)
//  makePools(style, sites, o)                -> what near lamps light on the wet ground (one draw call, max blending)
//  yardLightFaces(mesh, sites, o)            (async) bakes each face's nearest lamp into a built body: THE LIT FACES
//  makeSmears(style, items, o)               -> the lamps' smears down wet upright plate (the streak, hung upright)
//  addLampRain(strokes, rng, lamp, n, reach, rail)  the strokes of a lamp's lit cone, for makeRain (stroke.cone)
//  makeSteam(style, items, o)                -> steam: soft crossed sheets with a hard inner curl (one draw call)
//  addDwarfSignal(b, sites, o), addBoardPanel(b, sites, o)   the two other lamp units: bodies into a builder, lamps
//                                            into a list of sites for makeLampUnits(style, 'dwarf' | 'board', sites)
//  LAMP_KINDS, ORDER                         the units' sizes; renderOrder of the mirror's lights, the film, the upright
// (buildHero's own anchors, opts, size and cost are described above buildHero at the foot of this file.)
// THE PROOF STILLS (opts.inWorld not set) take their settings as a build option, opts.proof: { yard: 'red' | 'half' |
// 'green' | metres (the fixed metres flown), yardShow: 'units' (the dwarfs, a last-post target and a board panel),
// yardR, yardY (orbit) }. Nothing of the page is read. The world passes inWorld: true.
import * as THREE from 'three';

export const PALETTE = ['#050608', '#C9D6E2', '#4A5766', '#FF2A1C', '#19E0B0', '#EAF2F8'];
export const YARD_SALT = 17;
export const ORDER = { mirror: 1, film: 2, upright: 3 };
// (order 3, PASS G) THE RAIN'S REACH, ONE NAMED NUMBER: the farthest from its nearest lamp, in metres, that a stroke of
// rain may be lit at all (the designer's R1). 60 over the fields of large lamps; SET IT BACK TO 9 HERE, in this one
// edit, and every stroke of the world follows (the tower's rings keep 20 at the least: TOWER_RAIN_REACH).
// RAIN_HALF: the metres from its lamp at which a stroke has lost half its light by the lamp's own spreading.
// STEAM_REACH: the same for steam (a lamp lights steam within it and no farther; no floodlight on steam).
export const RAIN_REACH = 60, RAIN_HALF = 8, STEAM_REACH = 16;
export const TOWER_RAIN_REACH = Math.max(20, RAIN_REACH);

// THE ONE FORMULA (brief, techNotes, THE ANSWER). m: route metre nearest the lamp; aside: its metres from the route;
// height: its metres over its rail level; keep: 0 for a cell that stands green at the arrival, else 1.
export function yardTurnAt(m, aside, height, keep = 1) {
  return keep * (m - Math.min(0.137 * m, 112) - 20 * (m / 90 - Math.floor(m / 90)) + aside / 3 + 1.33 * height);
}
// One hash of place (5 m cells) with the world's one salt: 0..1.
export function yardCell(x, y, z, salt = YARD_SALT) {
  let h = Math.imul(Math.floor(x / 5) | 0, 374761393) ^ Math.imul(Math.floor(y / 5) | 0, 668265263) ^ Math.imul(Math.floor(z / 5) | 0, 1274126177) ^ Math.imul(salt | 0, 1103515245);
  h = Math.imul(h ^ (h >>> 13), 1597334677); h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// A lamp's site: place is its WORLD position (for the hash), m / aside / height as above. cellKey (optional, a
// THREE.Vector3-like) replaces the place in the hash where several lamps are one cell (a board row).
export function yardSite(style, place, m, aside, height, cellKey) {
  const c = cellKey || place, h = yardCell(c.x, c.y, c.z, style.salt);
  const keep = h < 1 / 50 ? 0 : 1, doubt = keep && h < 1 / 50 + 1 / 30 ? 1 : 0;
  return { turnAt: yardTurnAt(m, aside, height, keep), doubt, keep };
}

export const STYLE_GLSL = /* glsl */`
uniform float uTime, uFlown, uCalm;   // uCalm (order 3, E7): the seeded weather's still water, 0 in rain, 1 after it (a number set once at the build)
uniform vec3 uInk, uPale, uShade, uRed, uGreen, uGlass, uFlood;
// THE ANSWER: x red, y green, from uFlown - turnAt alone. A turn takes 10 m: red sinks to dark, then green rises.
// A doubter (doubt 1) tries green early over d -72..-48 and falls back to red before it holds at its metre.
vec2 yardLamp(float turnAt, float doubt) {
  float d = uFlown - turnAt;
  float red = 1. - smoothstep(-10., -4., d);
  float green = smoothstep(-6., 0., d);
  float tryG = smoothstep(-72., -66., d) * (1. - smoothstep(-54., -48., d));
  float tryR = smoothstep(-78., -72., d) * (1. - smoothstep(-48., -42., d));
  return vec2(red * (1. - doubt * tryR), green + doubt * tryG);
}
vec3 yardLampColor(vec2 s) { return uRed * s.x + uGreen * s.y; }
// tone by distance alone: far lines dim to a fifth at 1.5 km, never grey
float yardTone(float dist) { return mix(1., 0.2, smoothstep(60., 1500., dist)); }
// the footprint law: a line of true half-width h (metres) at x metres from its centre, px metres to the pixel:
// it keeps minPx pixels and dims by true over drawn (never under floorS), one soft pixel of flank.
float yardLine(float x, float h, float px, float minPx, float floorS) {
  float dh = max(h, 0.5 * minPx * px);
  float m = 1. - smoothstep(dh - 0.5 * px, dh + 0.5 * px, abs(x));
  return m * max(h / max(dh, 1e-5), floorS);
}
float yardHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

export function makeYardStyle(o = {}) {
  const pal = (o.palette && o.palette.length >= 6 ? o.palette : PALETTE).map((h) => new THREE.Color(h));
  const flood = (o.flood ? new THREE.Vector3().copy(o.flood) : new THREE.Vector3(-0.5, 0.03, 0.86)).normalize();
  const uniforms = {
    uTime: { value: 0 }, uFlown: { value: 0 }, uCalm: { value: o.calm ?? 0 }, uFlood: { value: flood },
    uInk: { value: pal[0] }, uPale: { value: pal[1] }, uShade: { value: pal[2] },
    uRed: { value: pal[3] }, uGreen: { value: pal[4] }, uGlass: { value: pal[5] },
  };
  return {
    uniforms, flood, pal, salt: o.salt ?? YARD_SALT,
    setFlown(m) { uniforms.uFlown.value = m; }, setTime(t) { uniforms.uTime.value = t; },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// THE BLACK BODY WITH ITS EDGES OF LIGHT. One merged mesh, one material, two kinds of face:
//  a BAR (aDir.w = true radius): a round member drawn inside a fixed three-sided carrier. The fragment knows its
//    metres from the bar's axis across the view (s), blackens |s| < r (the body: it writes depth and hides), lays the
//    pale band a sixth of the width where the bar's skin turns toward the floodlight, and the shade line on the far
//    side. The lamp's tint (aTint: turnAt, doubt, amount) adds on the shade side, where the steel is wet and dark.
//  a PLATE (aDir.w = -1): a flat black face with a baked band at each long edge (aPar: across metres, width, code at
//    edge 0, code at edge 1; code 1 pale band, 0.5 shade line, 0 none), tint as area in thin streaks.
// o.move: GLSL text defining  void yardMove(inout vec3 p, inout vec3 ax, inout vec3 d, inout vec3 tn)  for a body
// that moves: the world's train (carried in its own frame along a fixed road by the world's clock, uTime, and by
// nothing else) and its semaphore arms (turned about a pivot by uFlown - turnAt, THE ANSWER, and by nothing else).
// A plate may carry o.pivot and o.spin for such a hook: they ride in aAxis and aDir.xyz, which a plate does not use.
const bodyVS = (move) => /* glsl */`
attribute vec3 aAxis; attribute vec4 aDir; attribute vec4 aPar; attribute vec3 aTint; attribute vec4 aLit; attribute vec3 aLit2;
varying vec4 vBar; varying vec4 vPar; varying vec3 vTint; varying float vDist; varying float vKind; varying vec2 vAz; varying vec3 vW;
varying vec4 vLv; varying vec3 vEv; varying vec3 vLs; varying vec2 vLn;
${STYLE_GLSL}
// (order 4, H1) the lit face's lamp as the shader holds it (aLit, aLit2: baked by place). A body that MOVES past
// standing lamps (the world's train) may set these in its yardMove from its own place on the world's clock: the
// nearest standing lamp to the face, the same one law, no eye
vec4 yardLit; vec3 yardLit2;
${move || 'void yardMove(inout vec3 p, inout vec3 ax, inout vec3 d, inout vec3 tn) {}'}
void main() {
  float bar = step(0., aDir.w);
  yardLit = aLit; yardLit2 = aLit2;
  // a guy or a pole wire sways on the world's clock: aPar.xyz the sway at full swing, aPar.w its phase (bars only)
  vec3 sw = bar * aPar.xyz * sin(uTime * 0.9 + aPar.w) ;
  vec3 p0 = position + sw, a0 = aAxis + sw, d0 = aDir.xyz, tn = aTint;
  yardMove(p0, a0, d0, tn);
  vec4 wp = modelMatrix * vec4(p0, 1.);
  vec3 wa = (modelMatrix * vec4(a0, 1.)).xyz;
  vec3 T = normalize(mat3(modelMatrix) * d0 + vec3(0., 1e-5, 0.));
  vec3 ray = wa - cameraPosition; float dist = length(ray); ray /= max(dist, 1e-4);
  vec3 n = cross(T, ray); n /= max(length(n), 1e-4);
  vec3 v = cross(n, T);                                   // across the bar, away from the eye
  vec3 P = uFlood - T * dot(uFlood, T); P /= max(length(P), 1e-4);
  vBar = vec4(dot(wp.xyz - wa, n), aDir.w, dot(P, n), -dot(P, v));
  vPar = aPar; vTint = tn; vKind = 1. - bar; vW = position;   // the body's own frame: beads ride with a moving body
  vDist = length(wp.xyz - cameraPosition);
  // (order 3, M3) THE LIT FACE: aLit the place of this face's nearest lamp (in the body's frame) and its reach in
  // metres (0: no lamp near, the face stays black); aLit2 that lamp's turnAt, doubt and strength. vLv: from the
  // face to the lamp; vEv: from the face to the eye (BODY_FS asks it only WHICH SIDE of a plate is seen: use (1));
  // vLn: for a bar, the lamp's direction across the bar and toward the eye (as vBar.zw holds the floodlight's).
  vec3 lw = (modelMatrix * vec4(yardLit.xyz, 1.)).xyz, lb = lw - wa; float lbl = max(length(lb), 1e-4);
  vLv = vec4(mix(lw - wp.xyz, lb, bar), yardLit.w); vEv = cameraPosition - wp.xyz; vLs = yardLit2;
  vLn = vec2(dot(lb, n), -dot(lb, v)) / lbl;
  vec4 ca = projectionMatrix * viewMatrix * vec4(wa, 1.); vAz = ca.zw;   // the bar's own depth, not its carrier's
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BODY_FS = /* glsl */`
varying vec4 vBar; varying vec4 vPar; varying vec3 vTint; varying float vDist; varying float vKind; varying vec2 vAz; varying vec3 vW;
varying vec4 vLv; varying vec3 vEv; varying vec3 vLs; varying vec2 vLn;
${STYLE_GLSL}
void main() {
  // (order 3, M4) a face without bands (codes 0, 0: a girder's web, a lattice leg's or the mast's black face, a deck)
  // lies some 4 cm behind its own place in depth (0.012 w^2 with the lens's near plane at 0.3 m), so that the
  // bracing drawn in its plane always stands before it and never fights it
  gl_FragDepth = vKind < 0.5 ? clamp(0.5 * vAz.x / max(vAz.y, 1e-4) + 0.5, 0., 1.) : min(gl_FragCoord.z + step(vPar.z + vPar.w, 0.2) * 0.012 * gl_FragCoord.w * gl_FragCoord.w, 1.);
  // (order 3, M3) THE LIT FACE, ONE LAW FOR EVERY FACE: a wet black face near a lamp carries that lamp's colour as a
  // FILLED PATCH WITH A SOFT FALLING EDGE: (1 - (d / reach)^2)^2 of the metres d from the lamp, nothing at its reach
  // and beyond; by that lamp's state by the same number (yardLamp); only on the side of the face that looks at the
  // lamp, and stronger the more squarely it looks. A face far from every lamp stays black; the floodlight washes no
  // face. Its colour passes through uRed and uGreen and nothing else: with both black every face is black.
  float litD = length(vLv.xyz) / max(vLv.w, 1e-3), litF = max(1. - litD * litD, 0.) * step(1e-3, vLv.w); litF *= litF;
  vec3 litC = yardLampColor(yardLamp(vLs.x, vLs.y)) * vLs.z * litF;
  vec3 gn = cross(dFdx(vEv), dFdy(vEv)); gn /= max(length(gn), 1e-12);
  float litP = dot(gn, vLv.xyz) / max(length(vLv.xyz), 1e-4) * (dot(gn, vEv) < 0. ? -1. : 1.);   // a plate: the lamp stands on the side we see
  // STEEL IS COLD: the pale band and the shade line are steel and nothing else. A lamp's colour comes onto wet steel
  // only as GLINTS (beads of water, one to a cell of the body's own frame, going to their mean by the footprint) and
  // as a line only hard by the lamp (amount squared). aTint.z < 0: a CABLE, a fifth of the steel's strength, beaded.
  float amt = abs(vTint.z), cable = step(vTint.z, -1e-3);
  vec3 lampC = yardLampColor(yardLamp(vTint.x, vTint.y)) * amt * (1. - cable);
  // (order 3, M2) FAR LINES GO TO THEIR MEAN AND GET DIMMER: a line keeps its 1.5 pixels and its strength falls as
  // true over drawn, down to a floor of 0.045 (it was 0.16): a far lattice is a few dim strokes, never a pale fuzz
  float tone = yardTone(vDist), fl = mix(0.045 * tone, 1., cable), steel = mix(1., 0.13, cable);   // (linear 0.13 of 0.6: a fifth to the eye)
  float minPx = mix(2.2, 1.5, smoothstep(40., 80., vDist));
  float pw = max(length(fwidth(vW)), 1e-5);
  vec3 bi = floor(vW / 0.16); float bh = yardHash(bi.xz + bi.y * 17.3 + 0.5);
  // (colours are linear: a mean of 0.02 already shows as a dull slab, so beads and runs are sparse and thin out with
  // distance alone, use (2), to leave a far plate black)
  float farK = mix(1., 0.25, smoothstep(30., 120., vDist));
  // (order 4, H1) NO BEAD AND NO RUN ON BLACK PLATE OR BAR: pixel-sized beads peppered on black read as render noise.
  // A bead is at its mean at every distance, and that mean on a wet black face far from a lamp is NOTHING; near a
  // lamp it is the filled patch itself (litC below: GRADED LAMP LIGHT falling from the lamp). Only a CABLE keeps its
  // few glass beads (they say it is a cable and no ruled line), going to their mean by the footprint, use (3).
  float bead = mix(step(0.9, bh), 0.1, smoothstep(0.05, 0.16, pw)) * farK;
  vec3 col = uInk;
  if (vKind < 0.5) {
    float s = vBar.x, r = vBar.y, px = max(fwidth(s), 1e-5);
    float Px = clamp(vBar.z, -1., 1.), Pv = vBar.w;
    float hb = r / 6., side = Px < 0. ? -1. : 1.;
    float sb = mix(side, Px, step(0., Pv)) * (r - hb);
    float ext = max(r, abs(sb) + max(hb, 0.5 * minPx * px)) + 0.5 * px;
    if (abs(s) > ext) discard;
    // (order 4, H3; M2's law for a far line, use (3) the footprint) A CABLE FAR OFF GOES OUT: it kept its full fifth
    // at every distance and stood as ruled grey lines across the sky 250 m away; now it holds that strength only
    // while its true width is some third of a pixel and more, and is nothing under a sixteenth
    float flb = mix(fl, smoothstep(0.06, 0.3, 2. * r / px), cable);
    float pale = yardLine(s - sb, hb, px, minPx, flb) * mix(0.45, 1., smoothstep(-0.6, 0.3, Pv));
    float shade = yardLine(s + side * r * 0.86, r / 10., px, 1.5, flb);
    float dark = shade * (1. - pale);
    col += (uPale * 0.6 * pale + uShade * 0.5 * dark) * tone * steel + lampC * dark * (0.3 * amt * amt);
    col += uGlass * tone * cable * bead * step(0.95, bh) * max(pale, shade) * 0.9;   // a cable's beads of water
    // the lit face of a round member (M3): its skin where it turns toward its lamp; a thin bar (under 0.06 m) has no
    // face to light, and under a pixel the face is its share (3)
    float nx = clamp(s / max(r, 1e-4), -1., 1.), lam = nx * vLn.x + sqrt(max(1. - nx * nx, 0.)) * vLn.y;
    float skin = (1. - smoothstep(r - px, r, abs(s))) * min(r / px, 1.) * smoothstep(0.06, 0.18, r) * (1. - cable);
    col += litC * skin * smoothstep(-0.15, 0.6, lam) * (1. - 0.7 * pale) * 0.8;
  } else {
    // A PLATE IS A BLACK MASS: a WIDE pale band (a sixth of its width, to 0.4 m; 3 pixels or more near) on the edge
    // toward the floodlight, a shade line on the other, both cold steel; its face black, with a few glass beads and,
    // where a lamp is near, thin wet runs and beads in the lamp's colour. No tint as area.
    float a = vPar.x, W = vPar.y, px = max(fwidth(a), 1e-5);
    float hb = min(W / 12., 0.2), hs = min(W / 24., 0.025), bandPx = mix(3., 1.5, smoothstep(40., 120., vDist));
    float p0 = step(0.75, vPar.z), p1 = step(0.75, vPar.w);
    float h0 = mix(hs, hb, p0), h1 = mix(hs, hb, p1);
    float l0 = yardLine(a - h0, h0, px, mix(1.5, bandPx, p0), fl) * step(0.25, vPar.z);
    float l1 = yardLine(W - a - h1, h1, px, mix(1.5, bandPx, p1), fl) * step(0.25, vPar.w);
    // the band is wet: brightest at its outer third, a second flat step inside (two flat tones, no gradient)
    float e0 = mix(1., 0.55 + 0.45 * step(a, 0.7 * h0), p0), e1 = mix(1., 0.55 + 0.45 * step(W - a, 0.7 * h1), p1);
    vec3 c0 = mix(uShade * 0.5, uPale * e0, p0) * tone, c1 = mix(uShade * 0.5, uPale * e1, p1) * tone;
    float face = 1. - max(l0, l1);
    // (order 4, H1) the face carries no bead and no run: black, or its lamp's graded patch
    col += max(c0 * l0, c1 * l1) * 0.62;
    // the lit face of a plate (M3; H1: GRADED LAMP LIGHT): the filled patch, on the side that looks at the lamp,
    // brightest hard by the lamp and falling with the metres from it to nothing at its reach
    col += litC * smoothstep(0.02, 0.3, litP) * (0.45 + 0.55 * litP) * mix(0.45, 1., face) * 0.85;
  }
  gl_FragColor = vec4(min(col, vec3(1.)), 1.);
}`;
export function makeBodyMaterial(style, o = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...(o.uniforms || {}) }, vertexShader: bodyVS(o.move), fragmentShader: BODY_FS, side: THREE.DoubleSide });
}

// The builder of black bodies: push bars and plates, then build() one mesh. Points are THREE.Vector3 in the mesh's
// own frame; `flood` is the floodlight's direction in that frame (plates bake their edge codes from it; bars work
// theirs out in world space in the shader). o.tint = [turnAt, doubt, amount] ties a member to its nearest lamp.
export function makeBodyBuilder(style, flood = style.flood) {
  const pos = [], axis = [], dir = [], par = [], tint = [], idx = [], prims = [];   // prims: the first vertex of each bar (six) and, as -1 - v, of each plate (four): yardLightFaces reads it
  let nv = 0;
  const T = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3(), A = new THREE.Vector3();
  const NOT = [0, 0, 0], Z4 = [0, 0, 0, 0];
  // one straight round bar a -> b of true radius r; o.carrier the carrier's circumradius (default 2r + 0.9: a line
  // keeps its 1.5 pixels inside it to about 400 m); o.sway0 / o.sway1 = [x, y, z, phase] sway at each end.
  function bar(a, b, r, o = {}) {
    T.subVectors(b, a); const len = T.length(); if (len < 1e-6) return; T.divideScalar(len);
    U.set(0, 1, 0); if (Math.abs(T.y) > 0.9) U.set(1, 0, 0);
    U.crossVectors(T, U).normalize(); V.crossVectors(T, U).normalize();
    const R = o.carrier ?? (2 * r + 0.9), tn = o.tint || NOT, base = nv;
    if (!o.unlit) prims.push(base);
    for (let e = 0; e < 2; e++) {
      const p = e ? b : a, sw = (e ? o.sway1 : o.sway0) || Z4;
      for (let k = 0; k < 3; k++) {
        const an = k * 2.0943951 + 0.5, cu = Math.cos(an) * R, sv = Math.sin(an) * R;
        pos.push(p.x + U.x * cu + V.x * sv, p.y + U.y * cu + V.y * sv, p.z + U.z * cu + V.z * sv);
        axis.push(p.x, p.y, p.z); dir.push(T.x, T.y, T.z, r); par.push(sw[0], sw[1], sw[2], sw[3]); tint.push(tn[0], tn[1], tn[2]); nv++;
      }
    }
    for (let k = 0; k < 3; k++) { const k1 = (k + 1) % 3; idx.push(base + k, base + k1, base + 3 + k, base + k1, base + 3 + k1, base + 3 + k); }
  }
  // a run of bars through points; o.closed joins the last to the first; o.tintAt(i) gives each bar its own tint
  function chain(pts, r, o = {}) {
    const n = pts.length, m = o.closed ? n : n - 1;
    for (let i = 0; i < m; i++) bar(pts[i], pts[(i + 1) % n], r, o.tintAt ? { ...o, tint: o.tintAt(i) } : o);
  }
  // a flat black face: a0, a1 the ends of edge 0 and b0, b1 of edge 1 (a0-b0 and a1-b1 run across).
  // o.codes = [edge 0, edge 1] (1 pale band, 0.5 shade line, 0 none); left out, baked from the floodlight.
  function plate(a0, a1, b1, b0, o = {}) {
    const W0 = a0.distanceTo(b0), W1 = a1.distanceTo(b1), tn = o.tint || NOT, base = nv;
    let e0, e1;
    if (o.codes) { e0 = o.codes[0]; e1 = o.codes[1]; } else {
      A.subVectors(a0, b0).add(a1).sub(b1); const d = A.lengthSq() > 1e-9 ? A.normalize().dot(flood) : 0;
      e0 = d > 0 ? 1 : 0.5; e1 = d > 0 ? 0.5 : 1;
    }
    const pv = o.pivot, sp = o.spin;
    const put = (p, a, W) => { pos.push(p.x, p.y, p.z); if (pv) axis.push(pv.x, pv.y, pv.z); else axis.push(p.x, p.y, p.z); if (sp) dir.push(sp.x, sp.y, sp.z, -1); else dir.push(0, 0, 0, -1); par.push(a, W, e0, e1); tint.push(tn[0], tn[1], tn[2]); nv++; };
    if (!o.unlit) prims.push(-1 - base);
    put(a0, 0, W0); put(a1, 0, W1); put(b1, W1, W1); put(b0, W0, W0);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  function build(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aAxis', new THREE.Float32BufferAttribute(axis, 3));
    g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 4));
    g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 4));
    g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 3));
    // (order 3, M3) the lit faces: every face starts black (reach 0); yardLightFaces() fills these at the build
    g.setAttribute('aLit', new THREE.BufferAttribute(new Float32Array(nv * 4), 4));
    g.setAttribute('aLit2', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    g.setIndex(idx); g.computeBoundingSphere(); g.boundingSphere.radius += 2;
    const mesh = new THREE.Mesh(g, material || makeBodyMaterial(style));
    mesh.userData.yardPrims = Int32Array.from(prims);
    return mesh;
  }
  return { bar, chain, plate, build, indexCount: () => idx.length, triangles: () => idx.length / 3 };
}

// (order 3, M3) THE LIT FACES OF A BUILT BODY, baked at the build BY PLACE (no eye, no clock): every bar of 0.06 m
// and more and every plate of the mesh takes its ONE nearest lamp among sites [{ pos, dir, turnAt, doubt, strength,
// lit (its own reach, else o.reach) }] within that lamp's reach (9 m), measured from the lamp to the nearest point
// of the member, and carries it in aLit / aLit2 for BODY_FS's one law. A lamp shines forward: a member behind its
// case takes 0.45 of it (site.back, o.back). sites are in the mesh's own frame (o.matrix: a Matrix4 from the sites' frame to the mesh's).
// o.pause: the build's "await ctx.yield" (called every 500 members).
export async function yardLightFaces(mesh, sites, o = {}) {
  const g = mesh.geometry, prims = mesh.userData.yardPrims, R0 = o.reach ?? 9, C = 12, K = 4096;
  if (!prims || !sites.length) return 0;
  const P = g.attributes.position.array, AX = g.attributes.aAxis.array, DR = g.attributes.aDir.array, L1 = g.attributes.aLit.array, L2 = g.attributes.aLit2.array;
  const key = (i, j, k) => (i + 1024) + (j + 64) * K + (k + 1024) * K * 256, grid = new Map(), ls = [];
  const v = new THREE.Vector3(), d3 = new THREE.Vector3();
  for (const s of sites) {
    v.copy(s.pos); d3.copy(s.dir || d3.set(0, 0, 0)); if (o.matrix) { v.applyMatrix4(o.matrix); d3.transformDirection(o.matrix); }
    const e = { x: v.x, y: v.y, z: v.z, dx: d3.x, dy: d3.y, dz: d3.z, R: s.lit ?? R0, bk: s.back ?? o.back ?? 0.45, t: s.turnAt, d: s.doubt || 0, st: Math.min(1, (s.strength ?? 1) * (o.gain ?? 1)) };
    if (!(e.R > 0) || !(e.st > 0)) continue;
    ls.push(e); const k = key(Math.floor(e.x / C), Math.floor(e.y / C), Math.floor(e.z / C)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(e);
  }
  const Rmax = ls.reduce((m, e) => Math.max(m, e.R), 0), cl = (x) => Math.max(0, Math.min(1, x)); let lit = 0;   // (a site's back, else o.back, else 0.45: the share a member behind the lamp's case takes; a lantern shines all round: 1)
  for (let n = 0; n < prims.length; n++) {
    if (o.pause && n % 500 === 499) await o.pause();
    const plate = prims[n] < 0, v0 = plate ? -1 - prims[n] : prims[n], nvp = plate ? 4 : 6;
    if (!plate && DR[v0 * 4 + 3] < 0.06) continue;
    // the member as a + u e1 (+ w e2 for a plate): a bar's axis from end to end; a plate's a0, a1 - a0, b0 - a0
    const A = plate ? P : AX, i0 = v0 * 3, i1 = (v0 + (plate ? 1 : 3)) * 3, i2 = (v0 + 3) * 3;
    const ax = A[i0], ay = A[i0 + 1], az = A[i0 + 2], e1x = A[i1] - ax, e1y = A[i1 + 1] - ay, e1z = A[i1 + 2] - az;
    const e2x = plate ? P[i2] - ax : 0, e2y = plate ? P[i2 + 1] - ay : 0, e2z = plate ? P[i2 + 2] - az : 0;
    const l1 = e1x * e1x + e1y * e1y + e1z * e1z || 1, l2 = e2x * e2x + e2y * e2y + e2z * e2z || 1;
    const cx = ax + 0.5 * (e1x + e2x), cy = ay + 0.5 * (e1y + e2y), cz = az + 0.5 * (e1z + e2z);
    const hx = Math.min(4 * C, 0.5 * (Math.abs(e1x) + Math.abs(e2x)) + Rmax), hy = Math.min(4 * C, 0.5 * (Math.abs(e1y) + Math.abs(e2y)) + Rmax), hz = Math.min(4 * C, 0.5 * (Math.abs(e1z) + Math.abs(e2z)) + Rmax);
    // o.below: a level plate (a gallery's deck) takes only lamps that stand under it: its wet underside is what one sees
    const ny = plate ? e1z * e2x - e1x * e2z : 0, level = o.below && plate && ny * ny > 0.72 * l1 * l2;
    let best = 0, bl = null, bk = 0;
    for (let i = Math.floor((cx - hx) / C); i <= Math.floor((cx + hx) / C); i++) for (let j = Math.floor((cy - hy) / C); j <= Math.floor((cy + hy) / C); j++) for (let k = Math.floor((cz - hz) / C); k <= Math.floor((cz + hz) / C); k++) {
      const c = grid.get(key(i, j, k)); if (!c) continue;
      for (const e of c) {
        const px = e.x - ax, py = e.y - ay, pz = e.z - az, u = cl((px * e1x + py * e1y + pz * e1z) / l1), w = plate ? cl((px * e2x + py * e2y + pz * e2z) / l2) : 0;
        const qx = e1x * u + e2x * w - px, qy = e1y * u + e2y * w - py, qz = e1z * u + e2z * w - pz, dd = Math.sqrt(qx * qx + qy * qy + qz * qz);
        if (dd >= e.R || (level && e.y > cy - 0.5)) continue;
        const f = 1 - (dd / e.R) * (dd / e.R), fw = (qx * e.dx + qy * e.dy + qz * e.dz) / Math.max(dd, 1e-3);
        const wk = e.bk + (1 - e.bk) * cl((fw + 0.3) / 0.6), sc = e.st * f * f * wk;
        if (sc > best) { best = sc; bl = e; bk = wk; }
      }
    }
    if (!bl) continue;
    const kk = bk; lit++;
    for (let q = 0; q < nvp; q++) { const a = (v0 + q) * 4, b = (v0 + q) * 3; L1[a] = bl.x; L1[a + 1] = bl.y; L1[a + 2] = bl.z; L1[a + 3] = bl.R; L2[b] = bl.t; L2[b + 1] = bl.d; L2[b + 2] = bl.st * kk; }
  }
  return lit;   // (the arrays are filled at the build, before the first draw: nothing is marked for a second upload)
}

// ---------------------------------------------------------------------------------------------------------------
// THE LAMP UNIT: a black face (round target or cornered case) with a pale rim, its lens at most a third of it, a
// deep hood that hides the lens by depth, beads of rain on the wet face, and a small halo (its own additive quad
// in the plane of the face). One lens (uOff 0) shows red sinking and green rising; two lenses (uOff > 0) change the
// light's PLACE: red in the lower, green in the upper. aLamp per instance: turnAt, doubt, strength (0 = dead),
// seed in the fraction + flags in the whole part (1 cracked lens, 2 the eased flicker on the world's clock).
const LAMP_VS = /* glsl */`
attribute vec3 aQ; attribute vec4 aLamp; attribute float aReach;
varying vec3 vQ; varying vec4 vLamp; varying vec3 vE; varying vec3 vFl; varying vec3 vH; varying float vReach;
${STYLE_GLSL}
void main() {
  vReach = aReach;
  mat4 im = modelMatrix * instanceMatrix;
  vec3 X = normalize(im[0].xyz), Y = normalize(im[1].xyz), Z = normalize(im[2].xyz);
  vec4 wp = im * vec4(position, 1.);
  vec3 toEye = cameraPosition - im[3].xyz; float dist = length(toEye); toEye /= max(dist, 1e-4);
  vE = vec3(dot(X, toEye), dot(Y, toEye), dot(Z, toEye));       // (1) the direction from lamp to eye, in the lamp's frame
  vFl = vec3(dot(X, uFlood), dot(Y, uFlood), dot(Z, uFlood));
  vec3 N = X * cos(aQ.x) + Y * sin(aQ.x);                          // a hood's skin (part 1: aQ.x its angle)
  vH = vec3(dot(N, uFlood), dot(N, normalize(cameraPosition - wp.xyz + vec3(0., 1e-5, 0.))), dist);
  vQ = aQ; vLamp = aLamp;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LAMP_COMMON = /* glsl */`
varying vec3 vQ; varying vec4 vLamp; varying vec3 vE; varying vec3 vFl; varying vec3 vH; varying float vReach;
uniform vec4 uShape; uniform vec2 uOff; uniform vec4 uBeam;   // uBeam: the lens's beam (1): cos lo, cos hi, floor, narrow
${STYLE_GLSL}
float lampPower() {   // strength with the eased flicker: one or two dips a second, never under 0.6 of itself
  float seed = fract(vLamp.w), flick = step(1.5, floor(vLamp.w + 1e-3));
  float ph = uTime * 1.3 + seed * 7., f = fract(ph);
  float dip = smoothstep(0., 0.12, f) * (1. - smoothstep(0.2, 0.55, f)) * step(0.3, yardHash(vec2(floor(ph), seed * 31.)));
  return vLamp.z * (1. - 0.4 * flick * dip);
}`;
const LAMP_FS = /* glsl */`
${LAMP_COMMON}
void main() {
  vec2 st = yardLamp(vLamp.x, vLamp.y);
  float seed = fract(vLamp.w), cracked = mod(floor(vLamp.w + 1e-3), 2.);
  float power = lampPower(), on = step(0.01, vLamp.z), dist = vH.z;
  float tone = yardTone(dist), fl = 0.16 * tone, minPx = mix(2.2, 1.5, smoothstep(40., 80., dist));
  vec3 e = normalize(vE + vec3(0., 0., 1e-4));
  float beam = smoothstep(uBeam.x, uBeam.y, e.z), front = step(0., e.z);
  vec3 gC = uGreen * st.y * on, rC = uRed * st.x * on, col = uInk;
  if (vQ.z < 0.5) {
    vec2 p = vQ.xy; float px = max(0.7 * length(fwidth(p)), 1e-5);
    vec2 q = abs(p) - (uShape.xy - uShape.z); float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - uShape.z;
    if (d > 0.) discard;
    float small = smoothstep(0.5, 1.5, uShape.x / px);           // a unit under a pixel or so goes to its halo alone
    float lit = dot(p / max(length(p), 1e-4), vFl.xy), pale = smoothstep(-0.15, 0.35, lit);
    float rim = yardLine(d + 0.028, 0.028, px, minPx, fl) * small;
    float lr = uShape.w; vec2 pg = p - vec2(0., uOff.x), pr = p + vec2(0., uOff.x);
    float rg = length(pg), rr = length(pr), rl = min(rg, rr); vec2 pl = rg < rr ? pg : pr;
    float inG = 1. - smoothstep(lr - px, lr, rg), inR = 1. - smoothstep(lr - px, lr, rr), inL = max(inG, inR);
    vec3 lampHere = gC * inG + rC * inR, glow = gC * exp(-max(rg - lr, 0.) / (0.55 * lr)) + rC * exp(-max(rr - lr, 0.) / (0.55 * lr));
    col += (mix(uShade * 0.5, uPale, pale) * tone + glow * 0.7 * power) * rim;   // the wet rim takes its lamp's light
    // the wet face: the lamp's small glow on it, and beads of rain creeping down by the world's clock
    float bc = 0.034; vec2 bp = p / bc; float colm = floor(bp.x);
    bp.y += uTime * (0.04 + 0.5 * step(0.93, yardHash(vec2(colm, seed)))) + 9. * yardHash(vec2(colm, 3.));
    vec2 bi = floor(bp), bf = fract(bp) - 0.5; float bh = yardHash(bi + seed * 17.);
    float bead = step(0.74, bh) * (1. - smoothstep(0.1, 0.2 + 0.15 * bh, length(bf - vec2(0.12, 0.1) * (bh - 0.8))));
    bead = mix(bead, 0.07, smoothstep(bc / 4., bc / 1.5, px));
    col += (1. - inL) * (1. - rim) * front * (glow * 0.5 * power + (uGlass * 0.4 * tone + glow * 1.6) * bead * 0.6);
    // the lens: a flat boss in the palette colour, ribs round it, a glint of glass toward the floodlight
    float pitch = lr / 4.5, rib = 0.5 + 0.5 * cos(6.2832 * rl / pitch), boss = 1. - smoothstep(0.3 * lr, 0.38 * lr, rl);
    rib = mix(rib, 0.5, smoothstep(pitch / 4., pitch / 1.5, px));
    // BRIGHT GLASS: the palette colour at full strength, ribbed, and a white-hot heart where the beam finds the eye (1)
    vec3 lens = lampHere * mix(0.72 + 0.28 * rib, 1., boss) * mix(max(uBeam.z, 0.55), 1., beam);
    float litHere = (st.y * inG + st.x * inR) * on;
    lens += uGlass * litHere * power * beam * beam * (0.8 * (1. - smoothstep(0.1 * lr, 0.34 * lr, rl)) + 0.22 * rib * (1. - boss));
    lens += uShade * 0.3 * rib * (1. - boss) * inL * (1. - st.x * inR * on) * (1. - st.y * inG * on) * tone;
    vec3 hv = normalize(e + vFl + vec3(0., 0., 1e-3)); vec2 pgl = pl - 0.8 * lr * hv.xy;
    float gl = (1. - smoothstep(0.05 * lr, 0.11 * lr + px, length(pgl))) + 0.5 * rib * rib * rib * exp(-dot(pgl, pgl) / (0.1 * lr * lr));
    lens += uGlass * gl * step(0., hv.z) * inL * tone * 0.9;
    vec2 qc = pl - lr * vec2(0.22, -0.18); float rq = length(qc), an = atan(qc.y, qc.x + 1e-5) * 1.1141 + seed * 5.;
    float cf = (fract(an) - 0.5 - 0.5 * (yardHash(vec2(floor(an), seed * 9.)) - 0.5)) * 0.8976 * rq;
    lens += uGlass * cracked * yardLine(cf, 0.004, px, 1.5, 0.3) * inL * (0.55 + 0.45 * power);
    col = mix(col, uInk + lens * small, inL * front);
    // (order 1, C7) a NARROW unit's deep hood hides its glass, rim and wet face from the side (use (1), the direction
    // from lamp to eye): off its beam only the hood's black skin is seen
    col = uInk + (col - uInk) * mix(1., beam, uBeam.w);
  } else {
    float a = vQ.y, px = max(fwidth(a), 1e-5), outside = step(0., vH.y);
    float lip = yardLine(a - 0.014, 0.014, px, 1.5, fl) * smoothstep(0.5, 1.5, 0.1 / px);
    col += mix(uShade * 0.5, uPale, smoothstep(-0.2, 0.4, vH.x)) * tone * lip;
    col += (1. - outside) * (gC + rC) * power * 0.34 * smoothstep(0., 0.3, a) * (1. - lip);   // the wet inside of the hood
    col = uInk + (col - uInk) * mix(1., 0.02 + 0.98 * beam, uBeam.w);   // (C7; order 4, H2: a fiftieth, it was an eighth: the dark board stood as a faint red grid) a narrow unit's hood goes out off its beam
  }
  gl_FragColor = vec4(min(col, vec3(1.)), 1.);
}`;
const HALO_FS = /* glsl */`
${LAMP_COMMON}
void main() {
  vec2 st = yardLamp(vLamp.x, vLamp.y);
  vec3 e = normalize(vE + vec3(0., 0., 1e-4));
  float beam = smoothstep(0., 0.5, e.z) * mix(1., smoothstep(uBeam.x, uBeam.y, e.z), uBeam.w), r = length(vQ.xy), px = max(0.7 * length(fwidth(vQ.xy)), 1e-5), lr = uShape.w;
  // THE HALO (H1 to H5): the lamp's own, on its own quad, depth-tested; it falls to nothing by about three lens
  // widths with no rim and no disc. ONE RULE for every lamp, by the footprint (3): far off the halo shrinks to the
  // lamp's own point, which keeps 3 pixels but never more than its own face (so ranks and tiers never run together).
  // (order 2, D3) THE HALO IN RANKS, the second half of the one rule, baked at the build by place: vReach is the
  // lesser of about three of the lamp's own lens widths (6.5 lens radii from its middle) and HALF THE WAY TO ITS
  // NEAREST NEIGHBOUR LAMP, in the unit's own metres (yardNeighbours); the halo is nothing from there on.
  float R = max(vReach, 1e-3), k = max(1.15 * lr, 0.8 * px), rr = max(lr, min(1.6 * px, min(0.95 * uShape.x, 0.8 * R)));
  float ring = exp(-max(r - lr, 0.) / k) * smoothstep(lr - px, lr + px, r) * mix(0.9, 0.95, smoothstep(0.4, 1.4, px / lr));
  float fill = (1. - smoothstep(rr - px, rr + px, r)) * smoothstep(0.5, 1.5, px / lr);   // far off, the halo is the lamp
  vec3 c = uGreen * st.y * step(-0.5, vQ.z - 3.) + uRed * st.x * step(vQ.z - 3., 0.5);
  float I = max(ring, fill) * (1. - smoothstep(0.55 * R, R, r)) * beam * lampPower() * yardTone(vH.z);
  gl_FragColor = vec4(c * I, 1.);
}`;
// Half sizes in metres: w, h of the face, cr its corner radius (cr = w = h: a round target), lens radius, off the
// lenses' offset up and down (0: one lens), hood radius and length, halo quad half size.
export const LAMP_KINDS = {
  target: { w: 0.4, h: 0.4, cr: 0.4, lens: 0.125, off: 0, hood: 0.165, hoodL: 0.32, halo: 1.0, seg: 6 },
  board: { w: 0.24, h: 0.24, cr: 0.24, lens: 0.09, off: 0, hood: 0.125, hoodL: 0.26, halo: 0.7, seg: 6 },
  dwarf: { w: 0.3, h: 0.6, cr: 0.09, lens: 0.125, off: 0.27, hood: 0.165, hoodL: 0.3, halo: 1.0, seg: 10 },
};
function unitGeometries(K) {
  const pos = [], q = [], idx = [], hp = [], hq = [], hi = [];
  pos.push(-K.w, -K.h, 0, K.w, -K.h, 0, K.w, K.h, 0, -K.w, K.h, 0); q.push(-K.w, -K.h, 0, K.w, -K.h, 0, K.w, K.h, 0, -K.w, K.h, 0);
  idx.push(0, 1, 2, 0, 2, 3);
  const cys = K.off > 0 ? [K.off, -K.off] : [0], SEG = K.hood > 0 ? (K.seg || 6) : 0;
  cys.forEach((cy, li) => {
    const base = pos.length / 3;
    for (let i = 0; SEG && i <= SEG; i++) {        // the hood: a visor longest over the crown, cut back at the cheeks
      const a = -0.4 + (Math.PI + 0.8) * i / SEG, lipZ = K.hoodL * (0.42 + 0.58 * Math.max(0, Math.sin(a)));
      const x = K.hood * Math.cos(a), y = cy + K.hood * Math.sin(a);
      pos.push(x, y, 0, x, y, lipZ); q.push(a, lipZ, 1, a, 0, 1);
    }
    for (let i = 0; i < SEG; i++) { const b = base + i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    const hb = hp.length / 3, S = K.halo, wh = 3 + (K.off > 0 ? (li === 0 ? 1 : -1) : 0);
    hp.push(-S, cy - S, 0.012, S, cy - S, 0.012, S, cy + S, 0.012, -S, cy + S, 0.012); hq.push(-S, -S, wh, S, -S, wh, S, S, wh, -S, S, wh);
    hi.push(hb, hb + 1, hb + 2, hb, hb + 2, hb + 3);
  });
  const mk = (p, a, ix) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(a, 3)); g.setIndex(ix); return g; };
  return [mk(pos, q, idx), mk(hp, hq, hi)];
}
// sites: [{ pos, dir (the lens's axis, unit), up?, turnAt, doubt, strength (0 dead), cracked?, flicker?, seed (0..1), scale? }]
// in the parent's own frame. kind: a name of LAMP_KINDS or such an object. Returns { body, halo } (two draw calls);
// o.order the halo's renderOrder (ORDER.upright; ORDER.mirror inside a mirror group).
// (order 2, D3) THE HALO IN RANKS: every lamp site is given ONE baked number by its place, site.nb, the metres to its
// nearest neighbour lamp among all the sites of the lists handed in (a grid of 3.5 m cells; a lamp with none within
// 3.5 m keeps Infinity: its halo is then bounded by its own lens alone). The world calls it once over all its lists;
// makeLampUnits calls it over its own list for sites that have none yet (the tower's, the proof stills').
export function yardNeighbours(lists) {
  const C = 3.5, grid = new Map(), seen = new Set(), all = [], key = (i, j, k) => i + ',' + j + ',' + k;
  for (const l of lists) for (const s of l) if (!seen.has(s)) { seen.add(s); all.push(s); }
  for (const s of all) { const k = key(Math.floor(s.pos.x / C), Math.floor(s.pos.y / C), Math.floor(s.pos.z / C)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(s); }
  for (const s of all) {
    const i0 = Math.floor(s.pos.x / C), j0 = Math.floor(s.pos.y / C), k0 = Math.floor(s.pos.z / C); let best = Infinity;
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (let k = k0 - 1; k <= k0 + 1; k++) {
      const c = grid.get(key(i, j, k)); if (!c) continue;
      for (const t of c) { if (t === s) continue; const d = Math.hypot(t.pos.x - s.pos.x, t.pos.y - s.pos.y, t.pos.z - s.pos.z); if (d > 0.05 && d < best) best = d; }
    }
    s.nb = best <= C ? best : Infinity;
  }
  return all.length;
}
export function makeLampUnits(style, kind, sites, o = {}) {
  const K = typeof kind === 'string' ? LAMP_KINDS[kind] : kind, n = sites.length;
  const [gb, gh] = unitGeometries(K);
  if (sites.some((s) => s.nb === undefined)) yardNeighbours([sites]);
  const reach = new Float32Array(n);
  const lamp = new Float32Array(n * 4), m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), S = new THREE.Vector3();
  const bm = K.beam || [-0.05, 0.7, 0.4, 0];   // a kind's own beam: [cos lo, cos hi, floor, narrow]; the board's is narrow
  const u = { ...style.uniforms, uShape: { value: new THREE.Vector4(K.w, K.h, K.cr, K.lens) }, uOff: { value: new THREE.Vector2(K.off, K.halo) }, uBeam: { value: new THREE.Vector4(bm[0], bm[1], bm[2], bm[3]) } };
  const body = new THREE.InstancedMesh(gb, new THREE.ShaderMaterial({ uniforms: u, vertexShader: LAMP_VS, fragmentShader: LAMP_FS, side: THREE.DoubleSide }), n);
  const halo = new THREE.InstancedMesh(gh, new THREE.ShaderMaterial({ uniforms: u, vertexShader: LAMP_VS, fragmentShader: HALO_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), n);
  for (let i = 0; i < n; i++) {
    const s = sites[i], sc = s.scale || 1;
    X.crossVectors(s.up || UP, s.dir).normalize(); Y.crossVectors(s.dir, X).normalize();
    m.makeBasis(X, Y, s.dir).scale(S.set(sc, sc, sc)).setPosition(s.pos);
    body.setMatrixAt(i, m); halo.setMatrixAt(i, m);
    reach[i] = Math.min(6.5 * K.lens, K.halo, 0.5 * s.nb / sc);   // (D3) in the unit's own metres
    lamp.set([s.turnAt, s.doubt || 0, s.strength ?? 1, Math.min(0.999, s.seed || 0) + (s.cracked ? 1 : 0) + (s.flicker ? 2 : 0)], i * 4);
  }
  const al = new THREE.InstancedBufferAttribute(lamp, 4);
  gb.setAttribute('aLamp', al); gh.setAttribute('aLamp', al);
  const ar = new THREE.InstancedBufferAttribute(reach, 1); gb.setAttribute('aReach', ar); gh.setAttribute('aReach', ar);
  body.computeBoundingSphere(); halo.computeBoundingSphere();
  halo.renderOrder = o.order ?? ORDER.upright;
  return { body, halo, kind: K };
}

// ---------------------------------------------------------------------------------------------------------------
// THE MIRROR. No render target. A mirror group (scale.y = -1 at the water's level) holds the same bodies and lamp
// units again and each lamp's STREAK: an upright quad square to the lamp's axis, from o.len[0] to o.len[1] times
// the lamp's height down, the light strongest at the lamp's image, shivering and broken by the world's clock, the
// breaks going to their mean by the footprint. Over the group lies the WET FILM (makeWetFilm): dst * mask + ink *
// (1 - mask), writing depth, so nothing of the mirror shows on dry ground or above the water.
const STREAK_VS = /* glsl */`
attribute vec4 aS; attribute vec4 aS2; attribute vec3 aAx; attribute vec4 aLamp; attribute vec2 aUp;
varying vec4 vS; varying vec4 vLamp; varying vec3 vB;
uniform float uTone;                                                 // 1: beam (1) and tone (2); 0: neither, full strength from everywhere (the rim's)
uniform float uBand;
${STYLE_GLSL}
void main() {
  vec3 lw = (modelMatrix * vec4(aS.xyz, 1.)).xyz;
  vec3 ax = normalize(mat3(modelMatrix) * aAx + vec3(1e-5, 0., 0.));
  vec3 toEye = cameraPosition - lw; float dist = length(toEye);
  vec2 t = vec2(-aAx.z, aAx.x); t /= max(length(t), 1e-4);
  float hw = aS.w * (4. + 2. * uBand) + dist / 260.;                 // room for the least width (3); (order 5, L7) and for the band
  float y = aS.y * mix(aS2.x, aS2.y, position.y);
  // aUp: (0, 0) a streak in a mirror group (y metres under the water); (1, top) a SMEAR on wet upright plate,
  // hung in the upright world from its lamp's image at top down the plate (makeSmears)
  vec3 p = vec3(aS.x + t.x * position.x * hw, mix(y, aUp.y - (y - aS.y), min(aUp.x, 1.)), aS.z + t.y * position.x * hw);
  // (order 2, D2) aUp (2, level): a RUN, the same reflection laid ALONG a wet surface from the lamp's image at aS.xz
  // (level aUp.y) the way aAx points (toward whoever comes), its width upright: a pile wall's long smear, a flange's line
  float isRun = step(1.5, aUp.x);
  if (isRun > 0.5) p = vec3(aS.x + aAx.x * (y - aS.y), aUp.y + position.x * hw, aS.z + aAx.z * (y - aS.y));
  vS = vec4(position.x * hw, y, aS.y, aS.w); vLamp = aLamp;
  float ez = dot(ax, toEye / max(dist, 1e-4));                       // aS2.w: a narrow beam's cosine (0: the wide beam)
  float beamK = mix(smoothstep(0., 0.7, ez) * mix(1., smoothstep(aS2.w, aS2.w + 0.08, ez), step(1e-3, aS2.w)), 1., isRun);   // a run is seen from wherever it is not hidden
  vB = vec3(mix(1., beamK * yardTone(dist), uTone), aS2.z, position.y);   // (1) (2); uTone 0: neither (the rim's)
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
}`;
const STREAK_FS = /* glsl */`
varying vec4 vS; varying vec4 vLamp; varying vec3 vB;
uniform float uBand;                                                 // (order 5, L7) 1: a streak in water is a filled band with an edge
${STYLE_GLSL}
void main() {
  float a = vS.x, y = vS.y, h = max(vS.z, 0.01), hw = vS.w, seed = fract(vLamp.w);
  float px = max(fwidth(a), 1e-5), py = max(fwidth(y), 1e-5);
  // A LONG BROKEN REFLECTION: strongest at the lamp's image (y = h), drawn out toward us many lamp heights, cut
  // into dashes that lengthen toward us, each dash thrown a little aside, all shivering by the world's clock;
  // the dashes go to their mean when finer than about 3 pixels (3).
  float t = (y - h) / h, tp = max(t, 0.);
  float kindS = floor(vLamp.w + 1e-3), run = step(1.5, kindS);   // 0 a streak in water, 1 a smear down plate, 2 a run along a wet surface
  // (a run is a thin hard line on plate: three times the dashes, a third of the wander, no widening, and it is cut
  // again plate by plate, each 2.5 m of the surface giving back its own share; that cut goes to its mean, (3))
  // (order 3, M1) THE LAW OF EVERY REFLECTION: ONE COLUMN UNDER ITS LAMP, broken into A FEW LONG PIECES (four or five
  // down a streak, each many times longer than wide), shivering by the clock. Where a piece would be shorter than
  // about 4 pixels (dpx: its phase per pixel) or the column thinner than about 1.5 pixels (px over hw), the
  // reflection GOES OVER INTO ITS MEAN (3): no breaks, no wander, a smooth dim band a few pixels wide in the lamp's
  // colour; a far row of lamps lays ONE smooth dim band under the row. Never a field of dashes, at any distance.
  // (order 4, H8) A RUN IS A LONG CLEAN LINE along a waler or a flange: a few long pieces like every reflection, no
  // cut plate by plate, no step of level, hardly a wander: a hard line of the lamp's colour, never a blurred smear
  float ph = 9. * log(1. + max(y, 0.) / (0.25 * h)) + 1.1 * sin(y * 0.31 + uTime * 1.7 + seed * 23.) + seed * 31.;
  float dash = floor(ph / 6.2832), dpx = max(fwidth(ph), 1e-4);
  float mean = max(smoothstep(0.55, 1.5, dpx), smoothstep(0.55, 1.35, px / max(hw, 1e-4)));
  float pl = floor((y - h + 1.) / 2.5), plh = yardHash(vec2(pl, seed * 13.));
  // (order 3, E7) after the rain the water lies still (uCalm): a streak in it hardly wanders and is hardly broken
  float calm = uCalm * (1. - step(0.5, kindS));
  a += (1. - 0.45 * calm) * (1. - mean) * (hw * mix(0.5 + 0.25 * min(tp, 4.), 0.3, run) * sin(y * 0.9 + uTime * 2.3 + seed * 40.) + hw * 0.7 * min(tp, 2.) * (1. - run) * (1. - uBand) * (yardHash(vec2(dash, seed * 61.)) - 0.5));   // (order 5, L7) a band is not thrown aside piece by piece
  // (in its mean the column is some four pixels wide and gives back its true share of light, never less than a sixth)
  float w = max(hw * (1. + 0.2 * min(tp, 5.) * (1. - run)), mix(0.75, 2.2, mean) * px), g = exp(-(a * a) / (w * w)) * max(hw / w, mix(0.5, mix(0.16, 0.05, run), mean));   // (a far run: a twentieth: far down a wall it is a dim mean, M6)
  float plate = mix(0.25 + 0.75 * plh, 0.62, max(mean, smoothstep(0.3, 0.8, py)));   // (a 2.5 m plate under some 4 pixels: its mean)
  g *= mix(1., 0.8 + 0. * plate, run);
  float prof = (t < 0. ? exp(2.6 * t) : 1. / (1. + mix(0.6, 0.45, run) * t)) * smoothstep(0., 0.06, vB.z) * (1. - smoothstep(mix(0.6, 0.8, run), 1., vB.z));
  float smear = step(0.5, kindS) * (1. - run);   // on plate the smear is nearly whole: water runs down it, no waves cut it
  float brk = mix(mix(mix(0.1, 0.55, max(smear, run)), 1., smoothstep(-0.35, 0.2, sin(ph))), mix(0.62, 0.8, smear), mean);
  brk = mix(brk, 0.85, calm);
  // (order 5, L7) THE BAND (uBand 1, a streak in standing water only): the water mirrors its LAMP as ONE FILLED
  // SMOOTH BAND WITH AN EDGE: flat across to a soft edge (never a hair of light), whole along its length but for a
  // slow swell, its edge waving by the clock; lamps of one rank lay ONE band (the maker blends by the greater, so
  // neighbours do not add up to a comb). Thinner than about 3 pixels it goes over into its mean by the footprint,
  // use (3): a dim smooth band at its true share of light.
  float bandK = uBand * (1. - run);   // (a smear told so too: the engine's plate, order 5, L2)
  // (its shape is a SPINDLE: widest at the lamp's image, drawn to a point toward the lamp's foot and toward us, so
  // that the mirrors of a file of lamps stand apart on black water and never tile into a pane)
  float tap = t < 0. ? mix(0.22, 1., exp(3. * t)) : mix(0.3, 1., exp(-0.45 * t)), wt = hw * 1.6 * mix(tap, 1., 0.6 * uCalm);
  float wb = max(wt, 1.5 * px), eb = max(1.1 * px, 0.14 * wb);
  float gb = (1. - smoothstep(wb - eb, wb + eb, abs(a))) * min(1., max(wt / wb, 0.3)) * mix(1., 0.55, smoothstep(0.5, 1.5, 1.5 * px / max(wt, 1e-4)));
  g = mix(g, 0.8 * gb, bandK);   // (a mirror is never as bright as its lamp)
  // (a band is GRADED along its length: brightest at the lamp's image, falling smoothly to nothing toward us and
  // toward the lamp's foot, so that it lies under its lamp as a reflection and never crosses the water as a bar)
  // (after the rain, uCalm, the water lies still: the band is long and hardly drawn in, every lamp doubled at length)
  prof = mix(prof, (t < 0. ? exp(mix(4.6, 2.4, uCalm) * t) : exp(-mix(0.85, 0.3, uCalm) * t)) * smoothstep(0., 0.06, vB.z) * (1. - smoothstep(0.5, 1., vB.z)), bandK);
  brk = mix(brk, mix(0.74 + 0.26 * smoothstep(-0.6, 0.4, sin(ph * 0.5)), 0.8, mean), bandK);
  // in its mean, and on the still water after the rain, the band breathes by the clock, lamp by lamp: a slow swell
  // that travels down the column (smooth in place and time: no sparkle)
  brk *= 1. + max(max(mean * 0.16, calm * 0.38), bandK * 0.3) * sin(uTime * 1.9 + seed * 40. - y * 0.21);   // (a band breathes too: the water is never still as glass)
  gl_FragColor = vec4(yardLampColor(yardLamp(vLamp.x, vLamp.y)) * min(vLamp.z * g * prof * brk * vB.x * vB.y, 1.), 1.);   // (bounded before the colour: the palette's hue holds)
}`;
const quadGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
// sites as for makeLampUnits (pos.y = metres over the water). o.len [near, far] as shares of the height (0.6, 2.5),
// o.width the half width in metres (0.3), o.gain (0.3). Add the mesh to the MIRROR group. One draw call.
export function makeStreaks(style, sites, o = {}) {
  const n = sites.length, len = o.len || [0.3, 6], g = new THREE.InstancedBufferGeometry().copy(quadGeo());
  const s = new Float32Array(n * 4), s2 = new Float32Array(n * 4), ax = new Float32Array(n * 3), lamp = new Float32Array(n * 4), up = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const t = sites[i], sd = t.seed || 0, sm = o.run ? 2 : o.smear ? 1 : 0;
    // a smear: pos is the lamp's image on the plate, unit its measure (the "height" of the streak's law)
    s.set([t.pos.x, sm ? (t.unit ?? o.unit ?? 1.2) : t.pos.y, t.pos.z, t.width ?? o.width ?? 0.3], i * 4);
    s2.set([sm ? 0.55 : len[0], t.len ?? (len[0] + (len[1] - len[0]) * (0.55 + 0.45 * sd)), (o.gain ?? 0.3) * (t.gain ?? 1) * (o.high && !sm ? 1 / (1 + (t.pos.y / o.high) * (t.pos.y / o.high)) : 1), o.beam ?? 0], i * 4);   // (order 5, L7) o.high (metres): a lamp high over the water lies in it fainter, by its own height alone   // t.len: a run's own length in units
    ax.set([t.dir.x, t.dir.y, t.dir.z], i * 3); lamp.set([t.turnAt, t.doubt || 0, t.strength ?? 1, Math.min(0.999, sd) + sm], i * 4);   // whole part 1: a smear
    up.set([sm, sm ? t.pos.y : 0], i * 2);
  }
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 4)); g.setAttribute('aS2', new THREE.InstancedBufferAttribute(s2, 4));
  g.setAttribute('aAx', new THREE.InstancedBufferAttribute(ax, 3)); g.setAttribute('aLamp', new THREE.InstancedBufferAttribute(lamp, 4));
  g.setAttribute('aUp', new THREE.InstancedBufferAttribute(up, 2));
  g.instanceCount = n;
  // (order 5, L7) o.band 1: a FILLED BAND with an edge (STREAK_FS uBand), blended by the greater so that a rank's bands
  // lie as one band and never add up to a comb
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uTone: { value: o.tone ?? 1 }, uBand: { value: o.band ? 1 : 0 } }, vertexShader: STREAK_VS, fragmentShader: STREAK_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    ...(o.band ? { blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor } : { blending: THREE.AdditiveBlending }) }));
  mesh.frustumCulled = false; mesh.renderOrder = o.order ?? (o.smear || o.run ? ORDER.upright : ORDER.mirror);
  return mesh;
}
// (order 6, M2) THE RANK'S BAND: A RANK OF LAMPS MIRRORS AS ONE BAND, the rank's own. Where lamps stand in a rank
// (the world says which: links from lamp to next lamp of the same file, by place) their mirror in the water is ONE
// filled graded band ALONG the rank: an upright ribbon in the mirror group from lamp to lamp, brightest along the
// line of the lamps' images and falling off to nothing over and under it, each lamp's light falling along the rank
// from its own image by RANK_FALL metres, in that lamp's colour by that lamp's own number (the two lights of a link
// blend by the greater: a rank part red and part green is a band part red and part green, by place). The brighter
// knot under each lamp is that lamp's own image, drawn here (the world lays no streak for a lamp of a rank). Its edge waves and it breathes by
// the clock. USE (3), the footprint: a band under about 3 pixels deep goes over into its mean (dimmer in that
// proportion), under about one pixel it is not drawn. Use (1) and (2) as a streak has them, at each end's lamp.
// links: [{ a, b (sites as for makeStreaks: pos, dir, turnAt, doubt, strength, gain), seed }]. One draw call.
// RANK_FALL: metres along the rank over which a lamp's share of the band falls to 1/e. RANK_DEEP: the band's quad
// reaches from 0.4 to RANK_DEEP lamp heights under the water (the images lie at 1). RANK_END: metres past an end lamp.
export const RANK_FALL = 18, RANK_DEEP = 3.6, RANK_END = 2.5;
const RANK_VS = /* glsl */`
attribute vec4 aA; attribute vec4 aB; attribute vec4 aLA; attribute vec4 aLB; attribute vec4 aXA; attribute vec4 aXB;
varying vec4 vLA; varying vec4 vLB; varying vec4 vR; varying vec2 vK; varying float vH;
${STYLE_GLSL}
float rankBeam(vec3 lw, vec3 ax) { vec3 e = cameraPosition - lw; float d = length(e); return smoothstep(0., 0.7, dot(ax, e / max(d, 1e-4))) * yardTone(d); }
void main() {
  float D = max(length(aB.xz - aA.xz), 0.01), e = ${RANK_END.toFixed(1)} / D;   // the quad runs RANK_END metres past each end lamp (room for its knot)
  float s = mix(-e, 1. + e, position.x * 0.5 + 0.5), h = max(mix(aA.y, aB.y, clamp(s, 0., 1.)), 0.05);
  float y = h * mix(0.4, ${RANK_DEEP.toFixed(1)}, position.y);
  vec3 p = vec3(mix(aA.x, aB.x, s), y, mix(aA.z, aB.z, s));
  vR = vec4(s * D, position.y, D, aXA.w);                            // metres along from lamp a, across 0..1, the link's metres, seed
  vH = h;
  vLA = aLA; vLB = aLB;
  vK = vec2(rankBeam((modelMatrix * vec4(aA.xyz, 1.)).xyz, normalize(mat3(modelMatrix) * aXA.xyz + vec3(1e-5, 0., 0.))),
            rankBeam((modelMatrix * vec4(aB.xyz, 1.)).xyz, normalize(mat3(modelMatrix) * aXB.xyz + vec3(1e-5, 0., 0.))));   // (1) (2), at each end's lamp
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
}`;
const RANK_FS = /* glsl */`
varying vec4 vLA; varying vec4 vLB; varying vec4 vR; varying vec2 vK; varying float vH;
${STYLE_GLSL}
void main() {
  float m = vR.x, v = vR.y, D = vR.z, seed = vR.w, da = abs(m), db = abs(D - m);
  float npx = 1. / max(fwidth(v), 1e-4);                             // (3) the band's depth in pixels
  float t = mix(0.4, ${RANK_DEEP.toFixed(1)}, v) - 1. + 0.07 * sin(m * 0.37 + uTime * 1.3 + seed * 40.) * (1. - 0.7 * uCalm);   // heights under the lamps' images; the edge waves
  float win = smoothstep(0., 0.1, v) * (1. - smoothstep(0.6, 1., v));
  // the band: brightest along the line of the lamps' images, graded to nothing toward the lamps' feet and toward us
  float prof = (t < 0. ? exp(4.2 * t) : exp(-mix(1.0, 0.6, uCalm) * t)) * win;
  // the knot under each lamp: that lamp's own image, a short bright spindle a little deeper than the band
  float kw = 0.6 + 0.07 * vH, profK = (t < 0. ? exp(6. * t) : exp(-3.2 * t)) * win;   // (a knot, not a column: gone a third of a height under the image)
  float endA = 1. - smoothstep(0.4 * ${RANK_END.toFixed(1)}, ${RANK_END.toFixed(1)}, -m), endB = 1. - smoothstep(0.4 * ${RANK_END.toFixed(1)}, ${RANK_END.toFixed(1)}, m - D);
  float fa = (0.5 * exp(-da / ${RANK_FALL.toFixed(1)}) * prof * endA * endB + exp(-(da * da) / (kw * kw)) * profK);
  float fb = (0.5 * exp(-db / ${RANK_FALL.toFixed(1)}) * prof * endA * endB + exp(-(db * db) / (kw * kw)) * profK);
  float br = 1. + 0.22 * sin(uTime * 1.9 + seed * 40. - m * 0.21);
  float k = br * min(1., npx / 3.) * smoothstep(0.5, 1.5, npx);
  vec3 ca = yardLampColor(yardLamp(vLA.x, vLA.y)) * min(vLA.z * fa * vK.x * k, 1.);
  vec3 cb = yardLampColor(yardLamp(vLB.x, vLB.y)) * min(vLB.z * fb * vK.y * k, 1.);
  gl_FragColor = vec4(max(ca, cb), 1.);
}`;
export function makeRankBands(style, links, o = {}) {
  const n = Math.max(1, links.length), g = new THREE.InstancedBufferGeometry().copy(quadGeo());
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4), LA = new Float32Array(n * 4), LB = new Float32Array(n * 4), XA = new Float32Array(n * 4), XB = new Float32Array(n * 4);
  const lamp = (t) => [t.turnAt, t.doubt || 0, (t.strength ?? 1) * (o.gain ?? 0.34) * (t.gain ?? 1) * (o.high ? 1 / (1 + (t.pos.y / o.high) * (t.pos.y / o.high)) : 1), 0];
  links.forEach((l, i) => {
    A.set([l.a.pos.x, l.a.pos.y, l.a.pos.z, 0], i * 4); B.set([l.b.pos.x, l.b.pos.y, l.b.pos.z, 0], i * 4);
    LA.set(lamp(l.a), i * 4); LB.set(lamp(l.b), i * 4);
    XA.set([l.a.dir.x, l.a.dir.y, l.a.dir.z, l.seed ?? 0], i * 4); XB.set([l.b.dir.x, l.b.dir.y, l.b.dir.z, 0], i * 4);
  });
  for (const [name, arr] of [['aA', A], ['aB', B], ['aLA', LA], ['aLB', LB], ['aXA', XA], ['aXB', XB]]) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, 4));
  g.instanceCount = n;                                               // (no link: one quad of no size and no light, so that the program is made at the build)
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: RANK_VS, fragmentShader: RANK_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = o.order ?? ORDER.mirror;
  return mesh;
}
// (order 2, D2) RUNS: a lamp's long reflection laid ALONG a wet surface toward whoever comes (a pile wall, a girder's
// lower flange): the same streak, level. items: [{ pos (the lamp's image on the surface; pos.y its level), dir (level,
// unit: the way the run is drawn out), unit (metres: the streak's measure), len (its length in units), width (its
// half height), turnAt, doubt, strength, seed, gain }]. It follows its lamp's state by the same number; a body
// before it hides it (depth). One draw call.
export function makeRuns(style, items, o = {}) {
  return makeStreaks(style, items, { len: [0.55, 8], width: 0.2, gain: 0.6, ...o, run: true });
}
// SMEARS on wet upright plate (wagon sides, tank, pile walls, the board's back): the same streak, hung in the UPRIGHT
// world. items: [{ pos (the lamp's image on the plate, a few cm proud of it), dir (the plate's outward normal, level),
// unit (metres: the smear's measure; it runs o.len[1] units down), width, turnAt, doubt, strength, seed, gain }].
// It follows its lamp's state by the same number; a body before it hides it (depth). One draw call.
export function makeSmears(style, items, o = {}) {
  return makeStreaks(style, items, { len: [0.55, 4], width: 0.12, gain: 0.5, ...o, smear: true });
}

// THE POOL: what a lamp lights on the wet ground within o.reach metres of its foot. No disc and no gradient: hard
// islands of wet (puddle edges, sleeper tops, ballast) that thin outward by a threshold, each island a flat low tone
// carrying small hard glints that wink on the world's clock; islands and glints go to their means by the footprint
// (3); the glints lie thicker on the side toward the eye (1: the direction from lamp to eye). Pools never add up
// (max blending). A pool follows its lamp's state by the same turnAt. From above: a round patch; low: a bright foot.
const POOL_VS = /* glsl */`
attribute vec4 aP; attribute vec4 aLamp; attribute float aGain;
varying vec3 vP; varying vec4 vLamp; varying vec3 vE; varying vec2 vXZ;
uniform float uTone;                                                 // 1: toned by distance (2); 0: no tone at all (the rim's lane)
${STYLE_GLSL}
void main() {
  vec4 wp = modelMatrix * vec4(aP.x + position.x * aP.w, aP.y, aP.z + position.y * aP.w, 1.);
  vec3 lw = (modelMatrix * vec4(aP.xyz, 1.)).xyz;
  vec2 te = cameraPosition.xz - lw.xz; te /= max(length(te), 1e-4);
  vP = vec3(position.xy * aP.w, aP.w); vLamp = aLamp; vXZ = wp.xz;
  vE = vec3(te, aGain * mix(1., yardTone(length(cameraPosition - lw)), uTone));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const POOL_FS = /* glsl */`
varying vec3 vP; varying vec4 vLamp; varying vec3 vE; varying vec2 vXZ; uniform float uFill;
${STYLE_GLSL}
float poolNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(yardHash(i), yardHash(i + vec2(1., 0.)), f.x), mix(yardHash(i + vec2(0., 1.)), yardHash(i + vec2(1., 1.)), f.x), f.y);
}
void main() {
  float R = vP.z, r = length(vP.xy); if (r > R) discard;
  float q = r / R, toward = dot(vP.xy / max(r, 1e-3), vE.xy) * smoothstep(0.03, 0.2, q);
  // (order 3, M3: it overrides the islands and glints of orders 1 and 2) A POOL IS A FILLED PATCH WITH A SOFT
  // FALLING EDGE: the lamp's colour by its state, strongest at the lamp's foot, falling with the distance from it
  // to nothing at its reach (no edge, no disc, no sparkle: the ballast is at its mean); a little stronger on the
  // side toward the eye (1). uFill 1 holds the patch fuller toward its edge (a pool that is seen from high above).
  // (the strength is bounded BEFORE it meets the colour: a strong pool is the palette's colour, never a clipped one)
  float soft = max(1. - q * q, 0.); soft *= mix(soft, 1., 0.6 * uFill);
  // (order 4, H7) THE PATCH IS GRADED FROM THE LAMP OUTWARD, never one flat tone to its edge: a bright foot under the
  // lamp (it falls to a fifth of itself by half the reach) on the soft patch, which still goes to nothing at the reach
  float fillK = (0.42 * soft + 0.95 * exp(-5.5 * q * q) * soft) * (0.78 + 0.22 * toward);
  float ppx0 = max(0.5 * (fwidth(vXZ.x) + fwidth(vXZ.y)), 1e-5);
  // (order 4, H7) THE LIT GROUND HAS THINGS IN IT (no eye but uses (1) and (3)):
  //  PUDDLES, fixed in the ground by place (two grids of smooth chance, 2.7 and 1.2 m): standing water mirrors the
  //  black sky, so inside a puddle the patch is at 0.45 of itself, and the puddle's wet EDGE is a thin bright line;
  //  a puddle under some 5 pixels is at its mean (3): far off the patch is smooth
  float pn = 0.62 * poolNoise(vXZ / 2.7) + 0.38 * poolNoise(vXZ / 1.2 + 7.3), pw = max(fwidth(pn), 1e-4);
  float near = 1. - smoothstep(0.18, 0.55, ppx0), pud = smoothstep(0.57 - pw, 0.57 + pw, pn);
  float edge = (1. - smoothstep(0.6 * pw, 2.2 * pw, abs(pn - 0.57))) * near;
  //  SLOW RINGS in the puddles: a drop to a 3.1 m cell, each at its own place and phase of the world's clock,
  //  widening to 1.3 m and fading; under some 3 pixels a ring they are nothing (3)
  vec2 rc = floor(vXZ / 3.1); float rh = yardHash(rc + 4.7), rt = fract(uTime * (0.16 + 0.1 * rh) + rh * 9.), rn = floor(uTime * (0.16 + 0.1 * rh) + rh * 9.);
  vec2 ro = (vec2(yardHash(rc + rn * 0.37), yardHash(rc.yx + 2.9 + rn * 0.61)) - 0.5) * 1.6;
  float rr = length(vXZ - (rc + 0.5) * 3.1 - ro), rg = (rr - 0.1 - 1.2 * rt) / 0.07;
  float pring = exp(-rg * rg) * (1. - rt) * (1. - smoothstep(0.03, 0.09, ppx0));
  fillK *= mix(1., 0.45, pud * near) * (1. + 0.9 * edge + 0.8 * pring * mix(0.35, 1., pud));
  //  THE LAMP'S OWN LONG REFLECTION, BRIGHTEST IN THE MIDDLE: one column from the lamp's foot toward the eye (use
  //  (1): the direction from lamp to eye), in a few long pieces that shiver by the clock, falling off with the patch;
  //  a column under 1.5 pixels wide goes to its mean, a dim band (3)
  float al = dot(vP.xy, vE.xy), ac = vP.x * vE.y - vP.y * vE.x, cw0 = 0.16 + 0.035 * max(al, 0.), cw = max(cw0, 1.3 * ppx0), cm = smoothstep(1., 2.5, 1.3 * ppx0 / cw0);
  ac += (1. - cm) * 0.5 * cw0 * sin(al * 1.9 + uTime * 2.1 + vLamp.w * 40.);
  float cbrk = mix(0.3 + 0.7 * smoothstep(-0.3, 0.25, sin(4.2 * log(1. + max(al, 0.) / 0.7) + 0.6 * sin(uTime * 1.5 + vLamp.w * 23.) + vLamp.w * 31.)), 0.7, cm);
  fillK += 1.5 * exp(-(ac * ac) / (cw * cw)) * (cw0 / cw) * cbrk * smoothstep(0.15, 0.9, al) * soft;
  // the wet under the light is alive (law 3, with the eye still): two slow broad swells cross the patch by the
  // world's clock (5.3 and 8.1 m long: no sparkle); under some 8 pixels a swell they are at their mean (3)
  float ppx = max(0.5 * (fwidth(vXZ.x) + fwidth(vXZ.y)), 1e-5), rip = 1. - smoothstep(0.5, 1.4, ppx);
  // (order 3, G9) after the rain (uCalm) nothing else stirs the water, and the swells are plainer: 0.3 and 0.26
  fillK *= 1. + rip * (mix(0.13, 0.3, uCalm) * sin(dot(vXZ, vec2(0.93, 0.37)) * 1.18 - uTime * 1.7) + mix(0.11, 0.26, uCalm) * sin(dot(vXZ, vec2(-0.44, 0.9)) * 0.78 + uTime * 1.3 + 1.7));
  // (order 3, G9) AFTER THE RAIN THE YARD STILL DRIPS (uCalm, the seeded weather's number): the lamp over the patch
  // drips into it, and two rings run out from its foot through the patch by the world's clock, each fading as it
  // widens; under some 3 pixels a ring they are at their mean (3)
  float t1 = fract(uTime * 0.55 + vLamp.w * 7.), t2 = fract(t1 + 0.5);
  float g1 = (r - t1 * R * 0.85) / 0.42, g2 = (r - t2 * R * 0.85) / 0.42;
  float ringK = exp(-g1 * g1) * (1. - t1) + exp(-g2 * g2) * (1. - t2);
  fillK *= 1. + uCalm * 0.75 * ringK * (1. - smoothstep(0.12, 0.4, ppx));
  gl_FragColor = vec4(yardLampColor(yardLamp(vLamp.x, vLamp.y)) * min(vLamp.z * vE.z * fillK * 0.4, 1.), 1.);
}`;
// sites as for makeLampUnits (pos the lamp's place). o.y the ground's level (0), o.lift (0.05) over it, o.reach (9),
// o.gain (0.9). A high lamp lights the ground less and wider: gain / (1 + (h / 7)^2), reach 4 + 0.8 h within 5..reach.
export function makePools(style, sites, o = {}) {
  const n = sites.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const p = new Float32Array(n * 4), lamp = new Float32Array(n * 4), gain = new Float32Array(n), y0 = o.y ?? 0, R = o.reach ?? 9;
  for (let i = 0; i < n; i++) {
    const t = sites[i], h = Math.max(0, t.pos.y - y0);
    p.set([t.pos.x, y0 + (o.lift ?? 0.05), t.pos.z, Math.min(R, Math.max(o.least ?? 5, 4 + 0.8 * h))], i * 4);   // o.least (5): the least reach of a low lamp's pool
    lamp.set([t.turnAt, t.doubt || 0, t.strength ?? 1, Math.min(0.999, t.seed || 0)], i * 4);
    gain[i] = (o.gain ?? 0.9) * (t.pool ?? 1) / (1 + (h / 7) * (h / 7));
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(p, 4)); g.setAttribute('aLamp', new THREE.InstancedBufferAttribute(lamp, 4));
  g.setAttribute('aGain', new THREE.InstancedBufferAttribute(gain, 1)); g.instanceCount = n;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, uFill: { value: o.fill ?? 0 }, uTone: { value: o.tone ?? 1 } }, vertexShader: POOL_VS, fragmentShader: POOL_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = o.order ?? (ORDER.film + 0.2);
  return mesh;
}
const FILM_VS = /* glsl */`varying vec3 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const filmFS = (mask, head) => /* glsl */`
varying vec3 vW; uniform float uWet, uRings;
${STYLE_GLSL}
${head || ''}
float yardWet(vec2 xz) { ${mask} }
// (order 3, E1) RINGS ARE NEVER A TILE: each ring comes from its own drop, at its own place in its cell, of its own
// size and at its own phase of the world's clock, and only one cell in five holds a drop at any moment (which cells:
// by the drop's own count on the clock); two grids of unlike measure, one turned, so no rank of arcs can form.
// x: the ring's strength, y: its crest toward the floodlight. Under 3 pixels a ring is its mean, which is nothing (3).
vec2 yardRing(vec2 xz, float cs, float salt, float px) {
  vec2 ci = floor(xz / cs), cf = fract(xz / cs) - 0.5;
  float h = yardHash(ci + salt), tt = uTime * (0.3 + 0.3 * h) + h * 13., n = floor(tt), age = tt - n;
  float on = step(0.8, yardHash(ci * 1.37 + vec2(n * 0.71 + salt, n * 1.93)));
  vec2 dv = (cf - (vec2(yardHash(ci + 3.1 + n), yardHash(ci + 7.7 - n)) - 0.5) * 0.44) * cs; float rr = length(dv);
  float size = (0.1 + 0.18 * yardHash(ci + 11.3 + n)) * cs;
  float ring = yardLine(rr - (0.05 + size * age), 0.02, px, 1.5, 0.) * (1. - age) * (1. - smoothstep(0.1, 0.35, px)) * on;
  return vec2(ring, ring * smoothstep(-0.3, 0.7, dot(dv / max(rr, 1e-4), uFlood.xz)));
}
void main() {
  vec2 xz = vW.xz; float px = max(0.7 * length(fwidth(xz)), 1e-5), open = clamp(yardWet(xz), 0., 1.);
  vec2 rg = (yardRing(xz, 2.3, 0., px) + yardRing(mat2(0.7986, 0.6018, -0.6018, 0.7986) * xz, 3.7, 5.7, px)) * uRings;
  float ring = min(rg.x, 1.);
  float m = uWet * open * (1. - 0.8 * ring);
  float crest = min(rg.y, 1.) * open;
  gl_FragColor = vec4(uInk * (1. - m) + uPale * 0.5 * crest, m);
}`;
// The ground film of one water level. o.size (metres square, 400) or o.geometry (flat, in the xz plane, y = 0);
// o.wet the mirror's share where it is open (0.6); o.mask: GLSL body of float yardWet(vec2 xz) in world metres,
// 1 where the ground mirrors (water, rail crowns), 0 where it is shut (ballast). Default: open everywhere.
export function makeWetFilm(style, o = {}) {
  let g = o.geometry; if (!g) { g = new THREE.PlaneGeometry(o.size || 400, o.size || 400); g.rotateX(-Math.PI / 2); }
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    // o.head: GLSL declarations the mask needs (its own uniforms, helpers), o.uniforms their values
    // o.rings (1): the share of the rain's rings on this water (0: after the rain the water lies still)
    uniforms: { ...style.uniforms, uWet: { value: o.wet ?? 0.6 }, uRings: { value: o.rings ?? 1 }, ...(o.uniforms || {}) }, vertexShader: FILM_VS, fragmentShader: filmFS(o.mask || 'return 1.;', o.head),
    transparent: true, depthWrite: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor }));
  mesh.renderOrder = ORDER.film;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// RAIN AND DRIPS: strokes of light sown at the build in fixed columns by place, each wrapping in height by the
// world's clock inside its own span and carrying its lamp's turnAt, so the rain's colour follows the front. A stroke
// is at least 1.2 m long, faces the eye about its own length (4), keeps 1.5 pixels and dims (3). It is seen only as
// far as a lamp (amount) or the floodlight (catch) reaches it. A drip (drip 1) is glass white and gathers speed.
// (order 3, PASS G: this holds over the three lines above) a stroke is 3 m long and more and is lit by its NEAREST
// LAMP alone, by the one law R1 (see the head); the floodlight catches no rain; a drip is a bead its lamp lights.
const RAIN_VS = /* glsl */`
attribute vec4 aR; attribute vec4 aR2; attribute vec4 aR3; attribute vec3 aTint; attribute vec4 aL; attribute vec3 aLd;
varying vec4 vR; varying vec3 vTint; varying vec3 vC; varying vec4 vL; varying vec2 vY; varying vec3 vLd;
${STYLE_GLSL}
void main() {
  float drip = aR3.x, ph = fract(uTime * aR2.y / max(aR.w, 0.1) + aR2.z), fall = mix(ph, ph * ph, drip);
  vec3 wc = (modelMatrix * vec4(aR.x, aR.y - fall * aR.w, aR.z, 1.)).xyz;
  vec3 wd = normalize(mat3(modelMatrix) * mix(vec3(0.075, -1., 0.035), vec3(0., -1., 0.), drip));
  vec3 toEye = cameraPosition - wc; float dist = length(toEye);
  vec3 side = cross(wd, toEye); side /= max(length(side), 1e-4);
  float hw = 0.03 + dist / 260.;
  vec3 wp = wc + wd * (position.y * aR2.x) + side * (position.x * hw);
#ifdef YARD_RAIN_MIRROR
  // (order 3, G2/R6) THE WATER TAKES IT: in the mirror group a stroke shivers sideways by the world's clock
  wp += side * (sin(wp.y * 1.9 + uTime * 2.6 + aR2.z * 40.) * 0.07);
#endif
  vY = vec2(wp.y, aR2.z);
  // THE CONE (aL: the lamp's place and its beam's reach; aLd its axis; reach 0: no cone): a stroke is lit by its
  // lamp only while it falls through the lamp's beam, by its own place on the world's clock: a lit volume in the air
  // (order 3, G2) the cone and the law are worked out in RAIN_FS, pixel by pixel along a long stroke, from the two
  // straight-line numbers handed on here: the stroke's place from its lamp (vL) and the lamp's axis (vLd)
  // aR2.w, the stroke's kind: 0 lit along its whole fall (a drip), 1 lit inside its lamp's CONE, 2 lit by THE ONE LAW
  // OF THE RAIN (R1, RAIN_FS) round its nearest lamp; a lamp with an axis (the board's) lights only the rain before it
  float kind = aR2.w;
  vR = vec4(position.x * hw, position.y, smoothstep(0., 0.05, ph) * (1. - smoothstep(0.93, 1., ph)) * yardTone(dist), drip);
  vTint = aTint; vC = vec3(step(0.5, dot(aLd, aLd)), step(1.5, kind), step(0.5, kind) * (1. - step(1.5, kind)));
  vL = vec4(wp - (modelMatrix * vec4(aL.xyz, 1.)).xyz, max(aL.w, 0.1));
  vLd = normalize(mat3(modelMatrix) * aLd + vec3(0., 0., 1e-5));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const RAIN_FS = /* glsl */`
varying vec4 vR; varying vec3 vTint; varying vec3 vC; varying vec4 vL; varying vec2 vY; varying vec3 vLd;
${STYLE_GLSL}
void main() {
  float px = max(fwidth(vR.x), 1e-5), hw = mix(0.006, 0.012, vR.w);
  // (order 3, M2) a far stroke goes to its mean and gets DIMMER by the footprint (3): its floor of strength falls
  // where a pixel is wide, so that far rain is a few dim strokes and never grain
  float line = yardLine(vR.x, hw, px, mix(1.5, 2., vC.z), mix(0.5, 0.6, vC.z) * (1. - 0.85 * smoothstep(0.04, 0.22, px))) * smoothstep(0., 0.25, vR.y) * (1. - smoothstep(0.7, 1., vR.y)) * vR.z;
  // (order 3, G2) R1, THE ONE LAW OF THE RAIN, for every stroke of the world: a stroke is lit by its nearest lamp
  // alone, brightest beside it and gone to black at the reach (vL.w: RAIN_REACH, baked): the square of what is left
  // of the reach, over the lamp's own spreading (half at RAIN_HALF metres). No floodlight on rain: lamps off, no rain.
  float d = length(vL.xyz), q = max(0., 1. - d / max(vL.w, 0.1)), law = q * q * ${RAIN_HALF.toFixed(1)} / (${RAIN_HALF.toFixed(1)} + d);
  // THE CONE (kind 1): lit only while it falls through its lamp's beam; a lamp with an axis lights only what is before it
  float al = dot(vL.xyz, vLd), rad = length(vL.xyz - vLd * al);
  float cone = smoothstep(-0.2, 0.5, al) * (1. - smoothstep(0.7, 1., al / vL.w)) * (1. - smoothstep(0.5, 1., rad / (0.3 + 0.45 * max(al, 0.))));
  float before = mix(1., smoothstep(-0.25, 0.35, al / max(d, 1e-3)), vC.x);
  vec3 lampC = yardLampColor(yardLamp(vTint.x, vTint.y)) * vTint.z * mix(1., 2.2 * law * before, vC.y) * mix(1., 1.1 * cone, vC.z);
#ifdef YARD_RAIN_MIRROR
  // (R6) the mirror's own rule: the stroke lies in the water in a few long pieces
  float pc = abs(fract(vY.x * 0.31 + vY.y * 7. + 0.12 * sin(vY.x * 1.7 + uTime * 1.9 + vY.y * 30.)) - 0.5) * 2.;
  lampC *= 0.75 * smoothstep(0.2, 0.2 + max(fwidth(vY.x) * 0.62, 0.02), pc);
#endif
  // a drip is a bead of glass that its lamp lights: white only by the lamp's own colour
  vec3 c = mix(lampC * 0.9, lampC * (1. + 1.2 * uGlass), vR.w);
  gl_FragColor = vec4(min(c, vec3(1.)) * line, 1.);
}`;
// strokes: [{ x, y (the top of its fall), z, span (metres it falls before it wraps), len, speed (m/s), phase (0..1),
// turnAt, doubt, amount (its lamp's reach on it, 0..1), flood (the floodlight's catch, 0..1), drip (0 | 1) }]
export function makeRain(style, strokes, o = {}) {
  const n = strokes.length, g = new THREE.InstancedBufferGeometry().copy(quadGeo());
  const r = new Float32Array(n * 4), r2 = new Float32Array(n * 4), r3 = new Float32Array(n * 4), tn = new Float32Array(n * 3), al = new Float32Array(n * 4), ald = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const s = strokes[i];
    // s.cone = { pos, dir, reach }: the lamp whose beam lights this stroke (kind 1); s.lamp = { pos, reach, dir? }:
    // its nearest lamp, which lights it by THE ONE LAW (kind 2; dir: a lamp that lights only what is before it);
    // neither: lit along its whole fall (kind 0, a drip)
    const kind = s.cone ? 1 : s.lamp ? 2 : 0;
    r.set([s.x, s.y, s.z, s.span], i * 4); r2.set([s.len, s.speed, s.phase, kind], i * 4); r3.set([s.drip || 0, 0, 0, 0], i * 4);
    tn.set([s.turnAt || 0, s.doubt || 0, s.amount || 0], i * 3);
    if (s.cone) { al.set([s.cone.pos.x, s.cone.pos.y, s.cone.pos.z, s.cone.reach ?? 9], i * 4); ald.set([s.cone.dir.x, s.cone.dir.y, s.cone.dir.z], i * 3); }
    else if (s.lamp) { al.set([s.lamp.pos.x, s.lamp.pos.y, s.lamp.pos.z, s.lamp.reach ?? RAIN_REACH], i * 4); if (s.lamp.dir) ald.set([s.lamp.dir.x, s.lamp.dir.y, s.lamp.dir.z], i * 3); }
  }
  g.setAttribute('aL', new THREE.InstancedBufferAttribute(al, 4)); g.setAttribute('aLd', new THREE.InstancedBufferAttribute(ald, 3));
  g.setAttribute('aR', new THREE.InstancedBufferAttribute(r, 4)); g.setAttribute('aR2', new THREE.InstancedBufferAttribute(r2, 4));
  g.setAttribute('aR3', new THREE.InstancedBufferAttribute(r3, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tn, 3));
  g.instanceCount = n;
  // o.mirror: the same strokes for a mirror group (R6): they shiver and lie in a few long pieces (one more shader text,
  // made at the build like every other)
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: RAIN_VS, fragmentShader: RAIN_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    defines: o.mirror ? { YARD_RAIN_MIRROR: 1 } : {},
    // strokes never add up (max): a crowd of red strokes stays signal red and never sums to pink
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = o.order ?? ORDER.upright;
  return mesh;
}

// THE LIT CONE OF RAIN round a near lamp: n draws of chance (six numbers each, always in this order), five strokes
// to a draw, sown inside the lamp's beam (reach metres long, widening 0.45 m a metre); each stroke falls through the
// beam and is lit only inside it (RAIN_VS). r: the caller's stream; lamp { pos, dir, turnAt, doubt }; rail: the ground.
export function addLampRain(strokes, r, lamp, n, reach = 9, rail = 0) {
  const pos = lamp.pos, dir = lamp.dir, sx = dir.z, sz = -dir.x, cone = { pos, dir, reach };
  for (let i = 0; i < n; i++) {
    // (order 3, G2) long: 3.1 to 4.9 m, falling into the beam from 1.5 m over it
    const d0 = r.range(0.4, reach), a = r.range(-0.9, 0.9), tp = r.range(0.5, 3.5), len = 1 + 1.6 * r.range(1.3, 2.4), speed = r.range(8, 11), phase = r();
    for (let j = 0; j < 5; j++) {
      const f = (q) => { const v = Math.sin((i * 5 + j + 1) * q + phase * 91.7) * 43758.5453; return v - Math.floor(v); };
      const d = j ? 0.5 + f(12.9898) * (reach * 0.9 - 0.5) : Math.min(d0, reach * 0.9), w = 0.3 + 0.45 * d, u = j ? (f(78.233) * 2 - 1) * w : Math.sin(a) * w;
      const top = pos.y + Math.sqrt(Math.max(0, w * w - u * u)) + 0.2 + (j ? f(37.71) : tp / 3.5) * 0.8;
      strokes.push({ x: pos.x + dir.x * d + sx * u, y: top + 1.5, z: pos.z + dir.z * d + sz * u, span: Math.max(4, Math.min(top + 1.5 - rail, 2 * w + 5)), len, speed, phase: (phase + j / 5) % 1,
        turnAt: lamp.turnAt, doubt: lamp.doubt || 0, amount: (1 - d / (reach + 1)) * 0.95, cone, rail });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// (order 3, PASS G, G1: THIS HOLDS over the older note below) STEAM IS FEW AND SOFT AND HAS A SOURCE: each sheet is
// eight soft pieces that fall to nothing at their edges (no ring, no curl, no outline, no edge of the sheet), and it
// is lit ONLY where a lamp catches it (e.lamp: the nearest lamp, baked by place; within STEAM_REACH), by that lamp's
// state by the same number. NO floodlight on steam: with both lamp colours black there is no steam.
// (the older note) STEAM: a few SOFT-EDGED sheets (two crossed, fixed by their place, never turned to the eye), each a handful of
// puffs rising and widening on the world's clock: a soft body with a HARD INNER CURL. It is seen only where light
// catches it: the floodlight (pale, a crescent on the side of each puff toward it, more the higher it rises) and the
// lamps of its place (aTint: their colour by their state, strongest at its foot). No outline, no ring.
const STEAM_VS = /* glsl */`
attribute vec4 aS; attribute vec4 aS2; attribute vec3 aTint; attribute vec4 aLp; varying vec2 vM; varying vec3 vTint; varying vec3 vP; varying vec2 vQ; varying vec4 vL; varying float vLow;
${STYLE_GLSL}
void main() {
  // (a height under nought marks a LOW BANK: the sheet is as wide at its foot as at its top)
  float low = step(aS.w, 0.), hgt = abs(aS.w), y = position.y, w = aS2.x * mix(0.45 + 0.55 * y, 1., low);
  vec2 t = vec2(cos(aS2.w), sin(aS2.w));
  vec3 p = aS.xyz + vec3(t.x * position.x * w, y * hgt, t.y * position.x * w) + vec3(aS2.y, 0., aS2.z) * y * y;
  vM = vec2(position.x * w, y * hgt); vTint = aTint; vLow = low;       // metres across the sheet and up it
  vP = vec3(hgt, fract(aS.x * 0.37 + aS.z * 0.11) + floor(aS2.w + 0.5) * 0.37, aS2.x);
  vQ = position.xy;
  // (order 3, G1) its lamp (aLp: place and reach): the sheet's place from it, a straight-line number for STEAM_FS
  vec4 wp = modelMatrix * vec4(p, 1.);
  vL = vec4(wp.xyz - (modelMatrix * vec4(aLp.xyz, 1.)).xyz, max(aLp.w, 0.1));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const STEAM_FS = /* glsl */`
varying vec2 vM; varying vec3 vTint; varying vec3 vP; varying vec2 vQ; varying vec4 vL; varying float vLow;
${STYLE_GLSL}
// one soft piece: a bell that falls to nothing with no edge, no ring and no curl; it rises, widens, sways and thins
float puff(vec2 m, float k, float seed, float H, float W) {
  float age = fract(uTime * 0.08 + k * 0.125 + seed);
  vec2 c = vec2(0.2 * W * sin(age * 4. + k * 2.4 + seed * 9.) * age, age * H * 0.8);
  float r = min(W, 0.3 * H) * (0.09 + 0.66 * age);
  vec2 q = (m - c) / max(r, 1e-3);
  q += 0.22 * sin(q.yx * 2.3 + vec2(seed * 7. + k, k * 1.7 + age * 3.));
  float b = max(0., 1. - dot(q, q) * 0.6);
  return b * b * b * smoothstep(0., 0.07, age) * (1. - age) * (1. - age);
}
// one soft piece of a LOW BANK (steam with no pipe under it: the wet ground's own breath): it comes up anywhere along
// the bank, drifts along it and a little upward, and goes again; as soft as the plume's piece
float bank(vec2 m, float k, float seed, float H, float W) {
  // (the sheet's seed comes as a varying: it is rounded to a 64th before it is hashed, so that no last bit of it
  // shows as a stipple)
  float sq = floor(seed * 64. + 0.5) / 64.;
  float age = fract(uTime * 0.1 + k * 0.125 + sq * (1. + k)), h1 = fract(sin(k * 12.9898 + sq * 78.233) * 437.5453), h2 = fract(h1 * 7.31 + 0.17);
  vec2 c = vec2((h1 * 2. - 1.) * 0.55 * W + (h2 - 0.5) * 1.3 * W * age, H * (0.16 + 0.3 * h2 + 0.22 * age));
  vec2 q = (m - c) / max(vec2(0.62 * W, 0.34 * H) * (0.7 + 0.3 * age), vec2(1e-3));
  q += 0.2 * sin(q.yx * 2.1 + vec2(seed * 7. + k, k * 1.7 + age * 3.));
  float b = max(0., 1. - dot(q, q) * 0.7), s = sin(3.14159 * age);
  return b * b * b * s * s;
}
void main() {
  float s = fract(vP.y), H = vP.x, W = vP.z;
  float sum = puff(vM, 0., s, H, W) + puff(vM, 1., s, H, W) + puff(vM, 2., s, H, W) + puff(vM, 3., s, H, W)
    + puff(vM, 4., s, H, W) + puff(vM, 5., s, H, W) + puff(vM, 6., s, H, W) + puff(vM, 7., s, H, W);
  // the column the pieces ride in: one soft swaying stem from the source, thinning to nothing at 0.8 of the rise
  float yk = clamp(vM.y / max(0.8 * H, 1e-3), 0., 1.), rad = min(W, 0.3 * H) * (0.07 + 0.5 * yk);
  float xs = (vM.x - 0.2 * W * sin(yk * 3.2 + s * 9. + uTime * 0.22) * yk) / max(rad, 1e-3);
  float stem = max(0., 1. - xs * xs); stem *= stem * (1. - yk) * (1. - yk) * smoothstep(0., 0.04, yk);
  float dens = 1. - exp(-1.1 * sum - 1.5 * stem);
  if (vLow > 0.5) {   // a low bank: no stem, six pieces
    float sb = bank(vM, 0., s, H, W) + bank(vM, 1., s, H, W) + bank(vM, 2., s, H, W) + bank(vM, 3., s, H, W) + bank(vM, 4., s, H, W) + bank(vM, 5., s, H, W);
    dens = (1. - exp(-1.3 * sb)) * smoothstep(0., 0.1, vQ.y);
  }
  // the sheet itself ends in nothing: no edge at its sides or its top
  dens *= (1. - smoothstep(0.5, 1., abs(vQ.x))) * (1. - smoothstep(0.7, 1., vQ.y));
  // lit ONLY where its lamp catches it, by that lamp's state (the square of what is left of the lamp's reach)
  float d = length(vL.xyz), q = max(0., 1. - d / vL.w);
  // (order 5, L3) STEAM HAS AN OUTLINE: the soft field is cut at one level into ONE FILLED SHAPE WITH AN EDGE (a
  // billow, graded from its edge to its heart) and its edge is drawn as a line of its lamp's colour, some two
  // pixels wide by the footprint, use (3). No soft round patch hangs in the air: what is under the level is
  // nothing. Lit by its lamp alone, by place and by that lamp's number, as before.
  float fw = max(fwidth(dens), 1e-4), th = 0.2;
  float shape = smoothstep(th - fw, th + fw, dens), line = (1. - smoothstep(0.9, 2.1, abs(dens - th) / fw)) * step(1e-3, dens);
  dens = shape * mix(0.3, 0.85, smoothstep(th, 0.85, dens)) + 0.75 * line;
  vec3 col = yardLampColor(yardLamp(vTint.x, vTint.y)) * vTint.z * q * q * dens * 1.5;
  gl_FragColor = vec4(min(col, vec3(1.)), 1.);
}`;
// items: [{ pos (its foot), h (metres it rises), w (its width at the top), lean (Vector3: its drift at the top),
// tint: [turnAt, doubt, amount] (the lamps of its place) }]. One draw call, two crossed sheets to an item.
export function makeSteam(style, items, o = {}) {
  const n = items.length * 2, a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4), a3 = new Float32Array(n * 3), g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  // (order 3, G1) e.lamp = { pos, reach }: the lamp that catches it (left out: it shows nothing)
  const a4 = new Float32Array(n * 4);
  items.forEach((e, i) => { for (let k = 0; k < 2; k++) { const j = i * 2 + k; a1.set([e.pos.x, e.pos.y, e.pos.z, e.low ? -e.h : e.h], j * 4);   // e.low: a low bank (no source)
 a2.set([e.w, e.lean.x, e.lean.z, k * 1.5708], j * 4); a3.set(e.lamp ? e.tint || [0, 0, 0] : [0, 0, 0], j * 3);
    a4.set(e.lamp ? [e.lamp.pos.x, e.lamp.pos.y, e.lamp.pos.z, e.lamp.reach ?? STEAM_REACH] : [0, 0, 0, 0.1], j * 4); } });
  g.setAttribute('aLp', new THREE.InstancedBufferAttribute(a4, 4));
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aS2', new THREE.InstancedBufferAttribute(a2, 4)); g.setAttribute('aTint', new THREE.InstancedBufferAttribute(a3, 3));
  g.instanceCount = Math.max(n, 0);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: STEAM_VS, fragmentShader: STEAM_FS, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  mesh.frustumCulled = false; mesh.renderOrder = o.order ?? ORDER.upright;
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// THE LAMP TOWER. Frame: origin at the foot's centre on the water, +Y up. The flown leg is taken to run along +Z at
// x = +30 (the tower 30 m to starboard of s 820), so the four guys go out on the diagonals and cross the leg 46 m up.
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TOWER = { H: 80, half: 4.5, tiers: 12, first: 10, step: 6, ringR: 11, lampR: 11.3, lamps: 48, guyOut: 95, guyTop: 78 };
// the default site of a local point: its world place, the route metre nearest it and its metres aside
const defaultSite = (p) => ({ x: p.x, y: p.y, z: p.z + 820, m: 820 + p.z, aside: Math.abs(30 - p.x) });

async function buildTower(ctx, style, o) {
  const rng = ctx.rng.fork('lamp-tower'), site = o.site || defaultSite, detail = o.detail ?? 1, T = TOWER;
  const b = makeBodyBuilder(style, o.flood || style.flood), sites = [], strokes = [];
  // the hand's faults: the mast a little out of true (under 1 degree), by the seed
  const leanA = rng.range(0, 6.283), leanK = rng.range(0.003, 0.012), lx = Math.cos(leanA) * leanK, lz = Math.sin(leanA) * leanK;
  const P = (x, y, z) => V3(x + lx * y, y, z + lz * y);
  // 576 lamps: 48 round targets on each of twelve galleries, facing outward; each gets its one number by its place
  const tierY = [], lampAt = [];
  for (let k = 0; k < T.tiers; k++) {
    const y = T.first + T.step * k; tierY.push(y); lampAt.push([]);
    for (let j = 0; j < T.lamps; j++) {
      const a = (j + 0.5) / T.lamps * 6.2831853, dir = V3(Math.sin(a), 0, Math.cos(a)), pos = P(dir.x * T.lampR, y + 0.62, dir.z * T.lampR);
      const w = site(pos), s = yardSite(style, w, w.m, w.aside, pos.y);
      const dead = rng.chance(1 / 60), strength = dead ? 0 : rng.range(0.6, 1);
      const L = { pos, dir, turnAt: s.turnAt, doubt: s.doubt, strength, seed: rng() };
      sites.push(L); lampAt[k].push(L);
    }
  }
  await ctx.yield();
  // the tint a member takes from its nearest lamp (wet steel within 9 m)
  const tintOf = (p, gain = 1) => {
    const k = Math.max(0, Math.min(T.tiers - 1, Math.round((p.y - T.first) / T.step)));
    let a = Math.atan2(p.x - lx * p.y, p.z - lz * p.y); if (a < 0) a += 6.2831853;
    const L = lampAt[k][Math.min(T.lamps - 1, Math.floor(a / 6.2831853 * T.lamps))], d = L.pos.distanceTo(p);
    return [L.turnAt, L.doubt, Math.max(0, 1 - d / 9) * gain * (L.strength > 0 ? 1 : 0.3)];
  };
  const mid = new THREE.Vector3(), tbar = (a, c, r, oo = {}) => b.bar(a, c, r, { ...oo, tint: tintOf(mid.addVectors(a, c).multiplyScalar(0.5), oo.gain ?? 1) });
  // MAJOR MEMBERS FIRST (the mirror draws only these). Mast: four legs, node levels each 6 m, a diamond of
  // diagonals on every face (Warren), a horizontal at every node level, plan bracing under every gallery.
  const h = T.half, corners = [[h, h], [-h, h], [-h, -h], [h, -h]], levels = [0, 4];
  for (let y = 10; y <= 76; y += 6) levels.push(y); levels.push(79.2);
  for (let i = 0; i < levels.length - 1; i++) {
    const y0 = levels[i], y1 = levels[i + 1];
    for (let c = 0; c < 4; c++) {
      const [x0, z0] = corners[c], [x1, z1] = corners[(c + 1) % 4], mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      tbar(P(x0, y0, z0), P(x0, y1, z0), 0.3);
      // (order 3, M3/M4) THE TOWER'S WALL: the mast is a black body with its lattice on it: a black face (no band)
      // between the legs on every side of every level, just inside the bracing; it hides what stands behind the mast
      // and carries the light of its nearest lamp as a filled soft patch (yardLightFaces)
      b.plate(P(x0 * 0.96, y0, z0 * 0.96), P(x0 * 0.96, y1, z0 * 0.96), P(x1 * 0.96, y1, z1 * 0.96), P(x1 * 0.96, y0, z1 * 0.96), { codes: [0, 0] });
      if (i > 0) tbar(P(x0, y0, z0), P(x1, y0, z1), 0.13);
      if (i % 2) { tbar(P(x0, y0, z0), P(mx, y1, mz), 0.15); tbar(P(x1, y0, z1), P(mx, y1, mz), 0.15); }
      else { tbar(P(mx, y0, mz), P(x0, y1, z0), 0.15); tbar(P(mx, y0, mz), P(x1, y1, z1), 0.15); }
    }
    if (i > 1) { tbar(P(h, y0, h), P(-h, y0, -h), 0.09); tbar(P(-h, y0, h), P(h, y0, -h), 0.09); }
  }
  // the head: a pyramid over the top frame and a short rod
  for (let c = 0; c < 4; c++) { const [x0, z0] = corners[c], [x1, z1] = corners[(c + 1) % 4]; tbar(P(x0, 79.2, z0), P(x1, 79.2, z1), 0.13); tbar(P(x0, 79.2, z0), P(0, 82.5, 0), 0.13); }
  b.bar(P(0, 82.5, 0), P(0, 86, 0), 0.04);
  // the foot: four spread shoes standing in the water
  for (let c = 0; c < 4; c++) { const [x0, z0] = corners[c]; b.bar(P(x0 * 1.18, 0.5, z0 * 1.18), P(x0 * 0.82, 0.5, z0 * 0.82), 0.5, { carrier: 1.9 }); }
  await ctx.yield();
  // galleries: outer and inner ring beams, the deck plate between, eight arms with knee braces from the mast
  const N = T.lamps, ringPt = (r, y, j) => { const a = j / N * 6.2831853; return P(Math.sin(a) * r, y, Math.cos(a) * r); };
  for (let k = 0; k < T.tiers; k++) {
    const y = tierY[k], tn = (j) => { const L = lampAt[k][j % N]; return [L.turnAt, L.doubt, L.strength > 0 ? 1 : 0.3]; };
    for (let j = 0; j < N; j++) {
      const a0 = ringPt(T.ringR, y, j), a1 = ringPt(T.ringR, y, j + 1), c0 = ringPt(T.ringR - 1.5, y, j), c1 = ringPt(T.ringR - 1.5, y, j + 1), t = tn(j);
      b.bar(a0, a1, 0.13, { tint: t, carrier: 1.0 }); b.bar(c0, c1, 0.08, { tint: [t[0], t[1], t[2] * 0.6], carrier: 0.9 });
      b.plate(c0, c1, a1, a0, { tint: [t[0], t[1], t[2] * 0.8], codes: [0, 0] });
    }
    for (let q = 0; q < 8; q++) {
      const a = (q + 0.5) / 8 * 6.2831853, sx = Math.sin(a), cz = Math.cos(a), mr = h / Math.max(Math.abs(sx), Math.abs(cz));
      const tip = P(sx * (T.ringR - 0.2), y - 0.12, cz * (T.ringR - 0.2));
      tbar(P(sx * mr, y - 0.12, cz * mr), tip, 0.11, { carrier: 0.9 }); tbar(P(sx * mr, y - 3.2, cz * mr), P(sx * (T.ringR - 1.6), y - 0.2, cz * (T.ringR - 1.6)), 0.07, { carrier: 0.9 });
    }
    if (k % 4 === 3) await ctx.yield();
  }
  // four guys from the head to anchors 95 m out on the diagonals, sagging, swaying on the world's clock
  const G = T.guyOut * Math.SQRT1_2;
  for (let c = 0; c < 4; c++) {
    // (order 3, E6) o.guyTurn (radians about the mast): the world turns the four anchors by place, off the diagonals
    const [x0, z0] = corners[c], gt = o.guyTurn || 0, fx = Math.sign(x0) * G, fz = Math.sign(z0) * G;
    const top = P(x0, T.guyTop, z0), foot = V3(fx * Math.cos(gt) + fz * Math.sin(gt), 0.4, fz * Math.cos(gt) - fx * Math.sin(gt)), pts = [], sag = rng.range(1.4, 2.6) * 2.5, phase = rng.range(0, 6.28);   // 3.5 to 6.5 m of sag: a cable, not a ruled line
    const sv = V3(-Math.sign(z0), 0, Math.sign(x0)).multiplyScalar(Math.SQRT1_2), SEG = 14;
    for (let i = 0; i <= SEG; i++) { const t = i / SEG, p = top.clone().lerp(foot, t); p.y -= Math.sin(t * Math.PI) * sag; pts.push(p); }
    for (let i = 0; i < SEG; i++) {
      const w0 = Math.sin(i / SEG * Math.PI) * 0.3, w1 = Math.sin((i + 1) / SEG * Math.PI) * 0.3;
      // a CABLE (tint amount under nought): a fifth of the steel's strength, no lamp's colour, beads of water
      b.bar(pts[i], pts[i + 1], 0.028, { tint: [0, 0, -1], sway0: [sv.x * w0, 0, sv.z * w0, phase], sway1: [sv.x * w1, 0, sv.z * w1, phase] });
    }
    b.bar(foot, V3(foot.x * 1.03, 0, foot.z * 1.03), 0.25, { carrier: 1.4 });   // the anchor block's stub
  }
  const major = b.indexCount();
  // MINOR MEMBERS (upright only): handrails and stanchions, a ladder up the port face
  for (let k = 0; k < T.tiers; k++) {
    const y = tierY[k];
    for (let j = 0; j < N; j++) {
      const L = lampAt[k][j], t = [L.turnAt, L.doubt, L.strength > 0 ? 0.4 : 0.1];
      b.bar(ringPt(T.ringR - 0.25, y + 1.25, j), ringPt(T.ringR - 0.25, y + 1.25, j + 1), 0.03, { tint: t, carrier: 0.6 });
      if (j % 4 === 0) b.bar(ringPt(T.ringR - 0.25, y, j), ringPt(T.ringR - 0.25, y + 1.25, j), 0.03, { tint: t, carrier: 0.5 });
    }
  }
  for (let i = 0; i < levels.length - 1; i++) for (const dz of [-0.3, 0.3]) tbar(P(-h - 0.4, levels[i], dz), P(-h - 0.4, levels[i + 1], dz), 0.03, { carrier: 0.5 });
  await ctx.yield();
  // RAIN lit 20 m round each ring: each stroke falls inside its own tier's 6 m and carries that tier's lamp's number
  // (order 3, G2: THE LIT RAIN, LONG AND FEW) a third as many strokes, each 4.5 to 8 m long, falling 14 m and more
  // through the tiers; each is lit by its NEAREST LAMP of the rings by THE ONE LAW (RAIN_FS, reach TOWER_RAIN_REACH)
  // and carries that lamp's own number: so the rain stands red round the red tiers and green round the green ones
  const nRain = Math.round(3400 * detail), rainN = Math.min(nRain, Math.round(1500 * (o.rain ?? detail)));
  for (let i = 0; i < nRain; i++) {
    const k = rng.int(0, T.tiers - 1), a = rng.range(0, 6.2831853), r = Math.abs(T.lampR + (rng() + rng() - 1) * 20);
    const u1 = rng.range(0.45, 1), len = 4.5 + (rng.range(1.5, 3.2) - 1.5) * 2.06, speed = rng.range(8, 11), phase = rng(), u2 = rng.chance(0.15);
    if (i >= rainN) continue;                                    // (the draws of chance are made for every stroke of old)
    const y = tierY[k] + 3 + 9 * u1, span = Math.min(y, 14 + (u2 ? 6 : 0)), mid = y - 0.5 * span - 0.5 * len;
    let kk = 0; for (let t = 1; t < T.tiers; t++) if (Math.abs(tierY[t] + 2 - mid) < Math.abs(tierY[kk] + 2 - mid)) kk = t;
    const L = lampAt[kk][Math.min(N - 1, Math.floor(a / 6.2831853 * N))];
    // (order 4, J4) o.rainLen, o.rainReach: the seeded weather's numbers (drizzle: fine short strokes close to the lamps only)
    strokes.push({ x: Math.sin(a) * r + lx * y, y, z: Math.cos(a) * r + lz * y, span, len: len * (o.rainLen ?? 1), speed, phase, rail: 0,
      turnAt: L.turnAt, doubt: L.doubt, amount: L.strength > 0 ? 1 : 0.25, lamp: { pos: L.pos, reach: o.rainReach ?? TOWER_RAIN_REACH } });
    if (i % 800 === 799) await ctx.yield();
  }
  // a drip line from every gallery: three strings of glass-white drops from the rim to the water
  // (order 3, G9) o.drips (3): strings to a gallery; o.dripLen (1): the drops' length. After the rain the world
  // hands more and longer: the tower streams, each drop lit by its own tier's lamp
  for (let k = 0; k < T.tiers; k++) for (let d = 0; d < (o.drips ?? 3); d++) {
    const a = rng.range(0, 6.2831853), y = tierY[k] - 0.2, L = lampAt[k][Math.min(N - 1, Math.floor(a / 6.2831853 * N))];
    const x = Math.sin(a) * (T.ringR + 0.1) + lx * y, z = Math.cos(a) * (T.ringR + 0.1) + lz * y, period = Math.sqrt(2 * y / 9.8) * 1.15, nd = 2 + Math.floor(y / 22), ph = rng();
    for (let e = 0; e < nd; e++) strokes.push({ x, y, z, span: y, len: rng.range(0.6, 1.0) * (o.dripLen ?? 1), speed: y / period, phase: ph + e / nd, turnAt: L.turnAt, doubt: L.doubt, amount: 0.5, drip: 1 });
  }
  return { b, sites, strokes, major, lean: [lx, lz] };
}

// ---------------------------------------------------------------------------------------------------------------
// THE TWO OTHER LAMP UNITS, as adders: each pushes its black body into a builder and its lamp into a list of sites,
// so the world builds hundreds into one body mesh and one makeLampUnits() call of that kind.
// A DWARF SIGNAL: a case 1.2 m tall on a short pedestal, two hooded lenses (red lowest). o: { pos (its foot),
// yaw (the lenses look along (sin yaw, 0, cos yaw)), turnAt, doubt, strength, seed, cracked, flicker }. kind 'dwarf'.
export function addDwarfSignal(b, sites, o) {
  // (order 1, C2) o.scale (1): the whole signal's size by place (the file by the flown line is a larger ground signal)
  const k = o.scale || 1, d = V3(Math.sin(o.yaw || 0), 0, Math.cos(o.yaw || 0)), r = V3(d.z, 0, -d.x), c = o.pos.clone().add(V3(0, 0.98 * k, 0));
  const t = [o.turnAt, o.doubt || 0, 0.55], pt = (sx, sy, back) => c.clone().addScaledVector(r, sx * 0.27 * k).add(V3(0, sy * 0.57 * k, 0)).addScaledVector(d, (-0.004 - back * 0.34) * k);
  for (const sx of [-1, 1]) b.plate(pt(sx, -1, 0), pt(sx, 1, 0), pt(sx, 1, 1), pt(sx, -1, 1), { tint: t });
  for (const sy of [-1, 1]) b.plate(pt(-1, sy, 0), pt(1, sy, 0), pt(1, sy, 1), pt(-1, sy, 1), { tint: t });
  b.plate(pt(-1, -1, 1), pt(-1, 1, 1), pt(1, 1, 1), pt(1, -1, 1), {});
  const foot = o.pos.clone().addScaledVector(d, -0.17 * k);
  b.bar(foot.clone().add(V3(0, 0.02, 0)), foot.clone().add(V3(0, 0.41 * k, 0)), 0.065 * k, { carrier: 0.5 * k, tint: t });
  b.bar(foot.clone().addScaledVector(r, -0.3 * k).add(V3(0, 0.07, 0)), foot.clone().addScaledVector(r, 0.3 * k).add(V3(0, 0.07, 0)), 0.07, { carrier: 0.5, tint: t });
  b.bar(pt(0.6, -1, 1), o.pos.clone().addScaledVector(d, -0.75 * k).addScaledVector(r, 0.3 * k), 0.022, { carrier: 0.4 });   // its cable
  sites.push({ pos: c, dir: d, turnAt: o.turnAt, doubt: o.doubt || 0, strength: o.strength ?? 1, seed: o.seed || 0, cracked: o.cracked, flicker: o.flicker, scale: k === 1 ? undefined : k });
}
// ONE PANEL OF THE BOARD: rows and columns of round hooded lamps on a black plate in a frame, a rail under every
// row, nothing else. o: { origin (its lower left corner), right, up (unit vectors), cols 10, rows 8, pitchX 0.9,
// pitchY 1.25, lamp(pos, rowKey, col, row) -> { turnAt, doubt, strength, seed } }; a row is one cell (rowKey).
// kind 'board'. The face looks along right x up.
export function addBoardPanel(b, sites, o) {
  const R = o.right, U = o.up || V3(0, 1, 0), n = new THREE.Vector3().crossVectors(R, U).normalize(), cols = o.cols || 10, rows = o.rows || 8, px = o.pitchX || 0.9, py = o.pitchY || 1.25;
  const W = cols * px + 0.5, H = rows * py + 0.5, at = (x, y, f) => o.origin.clone().addScaledVector(R, x).addScaledVector(U, y).addScaledVector(n, f);
  b.plate(at(0, 0, -0.1), at(0, H, -0.1), at(W, H, -0.1), at(W, 0, -0.1), { codes: [0, 0] });
  // (order 1, C7) o.frame false: no steel frame round the panel, o.rails false: no rail under the rows (the world's
  // board is a black plate that shows nothing from the side but one outline round the whole of it)
  if (o.frame !== false) b.chain([at(0, 0, -0.1), at(W, 0, -0.1), at(W, H, -0.1), at(0, H, -0.1)], 0.07, { closed: true, carrier: 0.9 });
  for (let j = 0; j < rows; j++) {
    const y = 0.25 + (j + 0.5) * py, rowKey = at(W / 2, y, 0); let first = null;
    for (let i = 0; i < cols; i++) {
      const pos = at(0.25 + (i + 0.5) * px, y, 0.02), L = o.lamp(pos, rowKey, i, j); first = first || L;
      sites.push({ pos, dir: n, up: U, turnAt: L.turnAt, doubt: L.doubt || 0, strength: L.strength ?? 1, seed: L.seed || 0 });
    }
    if (o.rails !== false) b.bar(at(0.2, y - 0.4, -0.02), at(W - 0.2, y - 0.4, -0.02), 0.03, { carrier: 0.6, tint: [first.turnAt, first.doubt || 0, o.railTint ?? 0.8] });
  }
}
// The viewer's proof of the two units (?yardShow=units): three dwarfs (green, dark in mid turn, red), a last-post
// target with a cracked, faltering lens, and one panel of the board behind them, on the wet film with their doubles.
async function buildUnitsProof(ctx, style, object, upright, mirror) {
  const rng = ctx.rng.fork('units'), b = makeBodyBuilder(style), dw = [], bd = [], tg = [];
  [[-1.5, 700], [0, 780], [1.5, 900]].forEach(([x, turnAt], i) => addDwarfSignal(b, dw, { pos: V3(x, 0, 0.4 * i), yaw: 0.25 - 0.2 * i, turnAt, strength: rng.range(0.7, 1), seed: rng() }));
  b.bar(V3(3.2, 0, -0.6), V3(3.2, 2.2, -0.6), 0.09, { carrier: 0.6 });
  tg.push({ pos: V3(3.2, 2.9, -0.45), dir: V3(-0.25, 0, 0.968).normalize(), turnAt: 700, strength: 1, seed: rng(), cracked: 1, flicker: 1, scale: 2 });
  addBoardPanel(b, bd, { origin: V3(-4.75, 1.6, -7), right: V3(1, 0, 0), lamp: (p, key, i, j) => ({ turnAt: 745 + j * 10, doubt: j === 6 ? 1 : 0, strength: rng.chance(1 / 60) ? 0 : rng.range(0.6, 1), seed: rng() }) });
  for (const x of [-4.4, 4.4]) b.bar(V3(x, 0, -7.25), V3(x, 1.6, -7.25), 0.12);
  await ctx.yield();
  const body = b.build(); upright.add(body); mirror.add(new THREE.Mesh(body.geometry, body.material));
  for (const [kind, s] of [['dwarf', dw], ['board', bd], ['target', tg]]) {
    const u = makeLampUnits(style, kind, s), m = makeLampUnits(style, kind, s, { order: ORDER.mirror });
    upright.add(u.body, u.halo); mirror.add(m.body, m.halo, makeStreaks(style, s, { len: [0.6, 2.5], width: 0.14, gain: 0.3 }));
  }
  const strokes = [];
  for (const L of dw.concat(tg)) for (let i = 0; i < 26; i++) {
    const a = rng.range(-1.2, 1.2), r = rng.range(0.3, 3.5), y = L.pos.y + rng.range(1, 3);
    strokes.push({ x: L.pos.x + Math.sin(a) * r, y, z: L.pos.z + Math.cos(a) * r, span: y, len: rng.range(1.2, 1.8), speed: rng.range(8, 10), phase: rng(), turnAt: L.turnAt, amount: (1 - r / 4) * 0.9, flood: 0.03 });
  }
  upright.add(makeRain(style, strokes));
  object.add(mirror, makeWetFilm(style, { size: 600, wet: 0.6 }));
  const back = new THREE.Mesh(new THREE.SphereGeometry(2900, 16, 8), new THREE.MeshBasicMaterial({ color: style.pal[0], side: THREE.BackSide, fog: false, depthWrite: false }));
  back.renderOrder = -0.5; back.frustumCulled = false; object.add(back);
  return { object, mirror, style, radius: -2.4, height: 2.2, center: V3(0.6, 1.0, 0), ground: false, groundY: 0, anchors: {},
    setFlown(m) { style.setFlown(m); }, setProgress(u) { style.setFlown(u * 1250); }, update(dt, time) { style.setTime(time); }, dispose() {} };
}

// buildHero: THE LAMP TOWER whole, with its mirrored double.
//  opts.palette   the brief's six colours (default PALETTE);   opts.detail 0.6..1 thins the rain only
//  opts.style     a style made by makeYardStyle (the world's one); left out, the hero makes one (hero.style)
//  opts.site      (localPoint) -> { x, y, z, m, aside }: the point's WORLD place, the route metre nearest it and its
//                 metres aside. The world gives this from its path; left out, the leg runs along +Z at x = +30, s 820.
//  opts.flood     the floodlight's direction in the hero's own frame (for baked plates); style.flood is the world's
//  opts.inWorld   true in the world: no black backdrop, no film (the world lays its own); hero.mirror is then a
//                 separate group (scale.y = -1, not added to hero.object) to put in the world's mirror group of the
//                 apron's level at the hero's own position and turn
//  opts.flown     the metres flown the hero stands at until setFlown is called (viewer: ?yard=red|half|green)
// Returns the contract plus: style, mirror, sites (the 576 lamps with turnAt), report { maxTurnAt, minTurnAt },
// setFlown(metres), setProgress(u) (= setFlown(u * 1250)). update(dt, time) sets the world's clock only.
// Size: radius 31 (the lit rain; guys reach 95), height 80 (rod to 86). Cost: about 45,000 triangles, 8 draw calls
// (10 in the viewer), no light, no texture. It expects black round it and water at y = 0 under it.
// anchors (local): leg { origin, dir, s } the flown leg it was built for; flyThrough: five points of that leg with
// 15 m or more of clear air (guys 16 m over it, galleries 18 m aside); viewpoints.far / .gasp; gaze (the mast 46 m
// up, the brief's poi); guyAnchors; top. The way out is not this piece: no portalSeat.
export async function buildHero(ctx, opts = {}) {
  // the proof stills' settings come as a build option (opts.proof: { yard, yardShow, yardR, yardY }); the page is never read
  const q = !opts.inWorld && opts.proof ? new Map(Object.entries(opts.proof)) : null;
  const style = opts.style || makeYardStyle({ palette: opts.palette, flood: opts.flood, salt: opts.salt });
  const yard = q && q.get('yard'), fixed = opts.flown ?? (yard === 'red' ? 640 : yard === 'green' ? 900 : yard && isFinite(+yard) ? +yard : 775);
  style.setFlown(fixed);
  const object = new THREE.Group(), upright = new THREE.Group(), mirror = new THREE.Group();
  mirror.scale.y = -1; object.add(upright);
  if (q && q.get('yardShow') === 'units') return buildUnitsProof(ctx, style, object, upright, mirror);
  const tw = await buildTower(ctx, style, { site: opts.site, flood: opts.flood, guyTurn: opts.guyTurn, detail: opts.detail ?? ctx.quality?.detail ?? 1, rain: opts.rain, drips: opts.drips, dripLen: opts.dripLen, rainLen: opts.rainLen, rainReach: opts.rainReach });   // (order 3, G2) opts.rain: the weather's share of the rings' rain (1 rain, 0.5 drizzle, 0 after it)
  await ctx.yield();
  const body = tw.b.build(); upright.add(body);
  await ctx.yield();
  // (order 3, M3) the tower's wet mast, galleries and legs carry its own lamps' light, tier by tier, by their state
  // (reach 20 m here, the designer's reach round the tower's rings: the lamps stand 7 m out from the mast and shine
  // back along the galleries too; a gallery's deck takes the tier under it on its wet underside)
  await yardLightFaces(body, tw.sites, { reach: opts.litReach ?? 20, back: 0.8, below: true, pause: () => ctx.yield() });
  await ctx.yield();
  const units = makeLampUnits(style, 'target', tw.sites); upright.add(units.body, units.halo);
  upright.add(makeRain(style, tw.strokes));
  await ctx.yield();
  // the double: the major members, the lamps without hoods (seen from under, a hood hides nothing), the streaks
  const mg = new THREE.BufferGeometry(); for (const k in body.geometry.attributes) mg.setAttribute(k, body.geometry.attributes[k]);
  mg.setIndex(body.geometry.index); mg.setDrawRange(0, tw.major); mg.boundingSphere = body.geometry.boundingSphere;
  const mUnits = makeLampUnits(style, { ...LAMP_KINDS.target, hood: 0 }, tw.sites, { order: ORDER.mirror });
  mirror.add(new THREE.Mesh(mg, body.material), mUnits.body, mUnits.halo, makeStreaks(style, tw.sites, { len: [0.7, 1.5], width: 0.32, gain: 0.26, band: 1 }));
  // (order 3, G2/R6) THE WATER TAKES THE RAIN: the rings' lit strokes again in the mirror, by the mirror's own rule
  // (order 5, L7: the water mirrors the LAMPS, not the rain stroke by stroke: the world says opts.rainMirror 0 and
  // the rings' bands above are the tower's light in the water)
  if (opts.rainMirror !== 0) mirror.add(makeRain(style, tw.strokes.filter((s) => s.lamp), { mirror: 1, order: ORDER.mirror }));
  if (!opts.inWorld) {
    object.add(mirror, makeWetFilm(style, { size: 3000, wet: 0.6 }));
    const back = new THREE.Mesh(new THREE.SphereGeometry(2900, 16, 8), new THREE.MeshBasicMaterial({ color: style.pal[0], side: THREE.BackSide, fog: false, depthWrite: false }));
    back.renderOrder = -0.5; back.frustumCulled = false; object.add(back);
  }
  let lo = Infinity, hi = -Infinity; for (const s of tw.sites) if (s.turnAt > 0) { lo = Math.min(lo, s.turnAt); hi = Math.max(hi, s.turnAt); }
  return {
    // (the viewer alone: ?yardR and ?yardY move its orbit nearer, farther, lower, for the proof stills)
    object, mirror, style, sites: tw.sites, radius: q && q.get('yardR') ? +q.get('yardR') : 31, height: q && q.get('yardY') ? 0 : 80,
    center: V3(0, q && q.get('yardY') ? +q.get('yardY') : !opts.inWorld ? 14 : 40, 0), ground: false, groundY: 0,
    report: { minTurnAt: lo, maxTurnAt: hi, lamps: tw.sites.length },
    anchors: {
      leg: { origin: V3(30, 0, 0), dir: V3(0, 0, 1), s: 820 },
      flyThrough: [V3(30, 4, -170), V3(30, 14, -115), V3(30, 30, -57), V3(30, 24, 0), V3(30, 6, 55)],
      viewpoints: { far: V3(30, 4, -170), gasp: V3(30, 30, -57) }, gaze: V3(0, 46, 0), top: V3(0, 80, 0),
      guyAnchors: [1, -1].flatMap((sx) => [1, -1].map((sz) => { const g = TOWER.guyOut * Math.SQRT1_2, gt = opts.guyTurn || 0; return V3((sx * Math.cos(gt) + sz * Math.sin(gt)) * g, 0, (sz * Math.cos(gt) - sx * Math.sin(gt)) * g); })),
    },
    setFlown(m) { style.setFlown(m); }, setProgress(u) { style.setFlown(u * 1250); },
    // the world hands the metres flown as the fourth number; the camera is never read
    update(dt, time, camera, flown) { style.setTime(time); if (typeof flown === 'number') style.setFlown(flown); },
    dispose() {},
  };
}
