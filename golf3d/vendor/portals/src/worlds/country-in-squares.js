// THE COUNTRY MARKED OUT IN SQUARES. A sunny countryside laid out as one enormous chessboard: straight brooks run
// across it from side to side, green hedges reach from brook to brook, and the squares between are real fields in
// two tones (ripe corn against clover and pasture). Red and white chessmen as tall as churches stand on the
// squares in the position of a game that is still being played, and move as their kinds move.
//
// The flight starts on the hill's level top between beds of live flowers taller than we fly, with a red bishop
// standing over the garden, goes level along the walk, down the slope and through the gate between two great pieces
// of the red back rank. Little trains run along the first brook on their rail, one after another on a round of
// their own (a timber trestle three metres over the meadows where we pass, a ballast bank far off; the rail ends in
// tunnel mouths in the hills), and each in its turn leaps the brook between two tall timber ramps, over the place
// where our line crosses it: we go through the gap under the leap. As far as the fourth brook we fly low, at the
// hedges' tops. The red queen (the hero, src/parts/country-in-squares.js) runs on the spot in the first square of
// her lane, the whole visit through: all the running she can do, to keep in the same place, the ground streaming
// under her, her pawn before her, her hedge and her oak keeping pace beside her; she stands her wake's length
// beyond the first brook, so her skirt, her dust and the straws under her end short of its water and far short of the
// railway beyond it. We pass abeam of her some fifty metres beyond the first brook, and go down the rank past a
// white rook that stands over us like a tower. In that same
// rank, after the first brook, the looking-glass insects are met by the hedge that runs beside us: a
// rocking-horse-fly swings from branch to branch on the end bush of a hedge length, and bread-and-butterflies, no
// broader than the bush is high, creep and flutter low over the grass at the hedge's foot by those bushes (none of
// them is in the garden: the garden's insects are common butterflies). Then the board is the sight: we swing
// across her open lane past the square of giant flowers, where elephants stand on the blooms and fan their ears;
// past the third rank, where a red knight stands great beside our line with a rook and pawns of its side; and past
// her lane's end. In the middle of the board two knights meet beside the flight; we come down to the fifth brook
// and the wood's front of tall trunks and go up a lit ride of birches, level with the head of the wood's fawn. The
// fawn keeps a round of its own between the brook, where it drinks, and the ride beyond the glade (it walks up,
// stands in the glade's light, bounds on, turns and walks back): we come on it wherever on its round it then is.
// We come out straight and level down an avenue of the white court to a great gold crown that stands on the grass
// as an arch with the portal inside it, its light lying on the walk before it.
// Round the plain of the squares stand downs with hanging woods, and higher hills behind them; the squares are drawn
// on them and ranks of chessmen stand on them. Where no hedge stands a file line carries a grass balk and, near our
// line, a low clipped border; the fields carry what their crops leave (cocks of hay, shocks, skeps, heaps).
//
// WHAT IS DRIVEN BY WHAT. Everything that moves in this world moves by the world's clock, which runs whether a
// visitor is there or not, and is on a round or a sway of its own that looks right at any moment of it: the game's
// moves (the bishop's glide and the rare capture among them: the game's first move), the far pieces, the queen's
// running on the spot with her pawn, her hedge and her oak, the trains on their round and their leap, the fawn on
// its round, heads, flowers, elephants, insects, birds, sheep, clouds, wind, the cloth of her hem. Nothing in the
// world begins, turns or ends by the metres flown, at a place of the route or by the visitor's nearness.
// BY THE METRES FLOWN (u) go the film's own things only: how fast we go (pace), where the gaze is drawn (pois: the
// windows are places of the route; the queen's aim and the fawn's are held off our beam down her lane and its way,
// so they read the visitor's place, and the fawn's also reads where the fawn then is).
// NO FIGURE REGARDS THE VISITOR: a chessman's head looks about on a slow sway of its own, the queen and her pawn
// look straight down her course, the fawn looks about, a live flower turns its face from side to side and nods: each
// on the world's clock from its own phase, the same whether a visitor is near, far or not there at all.
// WHAT ANSWERS THE EYE'S DISTANCE is paint and the kit only: the ground's paint: the turf's grain, a crop's ears and
// the small flowers of the grass are painted within stated metres
// of the eye (the nearest 22 to 120 m, then 60 to 320 m), a far brook is drawn a little broader, the far land stands
// in the blue of the air between, and no grain is drawn finer than a point of the picture (as any texture is
// smoothed). And three things of the kit and the shadows, about the eye itself: the thistledown is the kit's
// following field (its seeds drift in a box of air that goes with the eye, so the air is nowhere empty of them); the
// kit thins a bird of its flocks, a butterfly or a dragonfly away within a few metres of the eye (none comes so
// near: every one of them is kept off our line by its place, its whole roam 2.5 m and more from the line); and the
// sheet of soft shadows is lifted off the turf by 0.0012 of its distance from the eye, so that it does not flicker
// against the ground far off.
//
// Each visit draws its own board (see build): how deep the ranks are, where the hill stands, which side the
// queen's file lies on, how deep the wood is, morning or evening. Coordinates: the flight goes toward -Z. Hedges
// stand on x = k * SQ, brooks on z = -k * SZ. Rank r (0..7) of the game is z in [-(r + 1) * SZ, -r * SZ]; file f
// (0..7) is x in [(f - 4) * SQ, (f - 3) * SQ].
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeEnv, makeLit, Geo, Prof, makePieces, pieceGeometryAsync, ownGeometry, hedgeGeometry, makeBlobs, PIECES, RUNNER, RUN_WAKE, PIECE_ANIM, CS_COMMON, lin, mulc, mixc, GOLD, IVORY, TAU, neck } from '../parts/country-in-squares.js';

// THE HILL'S TABLE: the garden's hill is cut level at KT of the way in from its foot to its middle: a level lawn, an
// ellipse 2 * (1 - KT) of the hill long and wide (83 m long on our line), where a visitor arrives: who steps through
// a portal stands level, so the flight's first sixty metres and the thirty it looks ahead are level ground.
const SQ = 96, BROOK = 4.2, BROOK_RAG = 1.6, HH = 26, HRX = 150, HRZ = 104, KT = 0.6;
const v3 = (hex, k = 1) => { const c = lin(hex); return `vec3(${(c[0] * k).toFixed(4)}, ${(c[1] * k).toFixed(4)}, ${(c[2] * k).toFixed(4)})`; };

// The ground of one visit. The country rolls: the board is draped over long downs (three crossing swells 300 to
// 760 m long and 9, 6 and 3.5 m high, their phases PH drawn by the visit), every brook runs in a channel cut BANK deep
// into the land (so it falls where the down drops), the garden's hill stands on it (its level top round z = HZC), the lawn
// the crown stands on is level (within 34 m of it, easing out to 110 m), and far beyond the board the land climbs to
// hills that carry the same squares. Ranks are SZ deep. Returns the height functions and the shaders that draw this
// ground and the shadows cast on it.
const BANK = 1.6;
// a hedge runs from brook to brook in HEDGE_SEG lengths with a gap HEDGE_GAP wide at its middle
const HEDGE_SEG = 4, HEDGE_GAP = 7;
function makeGround(HZC, SZ, CX, CZ, PH) {

const f4 = (v) => v.toFixed(4);
// THE HILLS. The plain of the squares lies in a ring of hills. Measured from the board's middle (0, ZM): the near
// hills' foot is RG[0].f = 150 m beyond the back of the garden's hill (so beyond the eighth row by as much); they are
// downs, a chain of round heads (k of them round the ring, each between lo and 1 of the range's rise h, with the
// saddles between them), and behind them, across a wide vale, stand far hills more than twice as high whose heads
// show in the near hills' saddles. Each falls back by 0.4 of its rise behind its crest. A range's line wanders (w
// metres, j times round). The squares are drawn on the hills as on the plain, the heights of the near hills carry
// hanging woods, and the far ranks stand on them.
const ZM = -4 * SZ, RG0 = 4 * SZ + HZC + HRZ + 150;
const RG = [{ f: RG0, c: RG0 + 400, h: 170, w: 70, j: 3, k: 13, m: 5, lo: 0.4 }, { f: RG0 + 950, c: RG0 + 1550, h: 430, w: 120, j: 4, k: 9, m: 4, lo: 0.3 }];
RG.forEach((g, i) => { g.b = i < RG.length - 1 ? RG[i + 1].f - g.w - RG[i + 1].w - 50 : g.c + 250; g.p = [PH[4] + i * 2.1, PH[5] + i * 1.3, PH[4] * 0.7 + i]; });
const rangeWarp = (i, th) => RG[i].w * Math.sin(th * RG[i].j + RG[i].p[0]);
const ranges = (x, z) => {
  const R = Math.hypot(x, z - ZM); if (R < RG0 - 100) return 0;
  const th = Math.atan2(x, ZM - z); let h = 0;
  for (let i = 0; i < RG.length; i++) { const g = RG[i], Rw = R - rangeWarp(i, th); h += g.h * (g.lo + (1 - g.lo) * (0.5 + 0.5 * Math.sin(th * g.k + g.p[1])) * (0.6 + 0.4 * Math.sin(th * g.m + g.p[2]))) * (smoothstep(g.f, g.c, Rw) - 0.4 * smoothstep(g.c, g.b, Rw)); }
  return h;
};
const land = (x, z) => 9 * Math.sin(x * 0.0105 + PH[0]) * Math.sin(z * 0.0083 + PH[1]) + 6 * Math.sin(x * 0.0058 - z * 0.0074 + PH[2]) + 3.5 * Math.sin(x * 0.0171 + z * 0.0127 + PH[3]) + ranges(x, z);
const LAWN = land(CX, CZ);
// (under the table the land's roll is taken out: the lawn lies at the land's height where our line crosses the front
// lip, TABLE_LAND; the roll eases back in over the 0.15 of the way below the lip)
// BEHIND THE TABLE THE HILL IS DUG INTO THE DOWN (backCut): where the land under the hill's back flank stands higher
// than the table's own land it is cut down to it: wholly from the table's back lip to half the way down the flank
// (31 m on the walk's line), easing out from there to the hill's foot, and round the hill's sides from the back
// lip's row forward to the hill's middle row. So the back flank falls away from the lip on every visit (uncut, a
// down that climbs behind the hill stands as much as 9 m over the lawn 15 m behind the lip): a visitor arrives
// along the walk's level line, and that line continued backward from the visit's first point has open air under it.
const TABLE_LAND = land(0, HZC - HRZ * (1 - KT)), hillK = (x, z) => clamp(1 - Math.hypot(x / HRX, (z - HZC) / HRZ), 0, 1);
const backCut = (z, kh, h) => h - smoothstep(0, KT / 2, kh) * smoothstep(HZC, HZC + HRZ * (1 - KT), z) * Math.max(0, h - TABLE_LAND);
const hillAt = (x, z) => { const k = Math.min(hillK(x, z), KT); return HH * k * k * (3 - 2 * k); };
const heightAt = (x, z) => {
  const kc = 1 - smoothstep(34, 110, Math.hypot(x - CX, z - CZ)), kh = hillK(x, z), kt = Math.min(kh, KT), dB = SZ * Math.abs(z / SZ - Math.round(z / SZ));
  return lerp(backCut(z, kh, lerp(land(x, z), LAWN, kc)), TABLE_LAND, smoothstep(KT - 0.15, KT, kh)) + HH * kt * kt * (3 - 2 * kt) - BANK * (1 - smoothstep(BROOK, BROOK + 5, dB)) * (1 - smoothstep(0, 0.1, kh)) * (1 - kc);
};
const GROUND_H = /* glsl */`
float csHill(vec2 p){ return clamp(1. - length(vec2(p.x / ${HRX}., (p.y - ${HZC.toFixed(2)}) / ${HRZ}.)), 0., 1.); }
float csRanges(vec2 p){
  vec2 d = vec2(p.x, p.y - ${f4(ZM)}); float R = length(d), h = 0.;
  if (R > ${f4(RG0 - 100)}) {
    float th = atan(d.x, -d.y), Rw;
${RG.map((g) => `    Rw = R - ${f4(g.w)} * sin(th * ${g.j}. + ${f4(g.p[0])}); h += ${f4(g.h)} * (${f4(g.lo)} + ${f4(1 - g.lo)} * (.5 + .5 * sin(th * ${g.k}. + ${f4(g.p[1])})) * (.6 + .4 * sin(th * ${g.m}. + ${f4(g.p[2])}))) * (smoothstep(${f4(g.f)}, ${f4(g.c)}, Rw) - .4 * smoothstep(${f4(g.c)}, ${f4(g.b)}, Rw));`).join('\n')}
  }
  return h;
}
float csLand(vec2 p){
  return 9. * sin(p.x * .0105 + ${f4(PH[0])}) * sin(p.y * .0083 + ${f4(PH[1])}) + 6. * sin(p.x * .0058 - p.y * .0074 + ${f4(PH[2])}) + 3.5 * sin(p.x * .0171 + p.y * .0127 + ${f4(PH[3])}) + csRanges(p);
}
float csGroundH(vec2 p){
  float k = csHill(p), kt = min(k, ${f4(KT)}), kc = 1. - smoothstep(34., 110., length(p - vec2(${f4(CX)}, ${f4(CZ)}))), dB = ${f4(SZ)} * abs(p.y / ${f4(SZ)} - floor(p.y / ${f4(SZ)} + .5));
  float base = mix(csLand(p), ${f4(LAWN)}, kc);
  base -= smoothstep(0., ${f4(KT / 2)}, k) * smoothstep(${f4(HZC)}, ${f4(HZC + HRZ * (1 - KT))}, p.y) * max(0., base - ${f4(TABLE_LAND)});
  return mix(base, ${f4(TABLE_LAND)}, smoothstep(${f4(KT - 0.15)}, ${f4(KT)}, k)) + ${HH}. * kt * kt * (3. - 2. * kt) - ${BANK.toFixed(1)} * (1. - smoothstep(${BROOK.toFixed(1)}, ${(BROOK + 5).toFixed(1)}, dB)) * (1. - smoothstep(0., .1, k)) * (1. - kc);
}`;

// What the ground is at a point: crop, verge, hedge line, brook, wood floor, lawn. sunK is how much of the sun reaches
// it past the things that cast on it (1 in the open, 0 in the middle of a cast shadow). SHADE: a cast shadow is shade,
// not a hole: where the sun is hidden the sky's light stays, and the ground stands at half its lit brightness, by the
// sky's own colour (so bluer than in the sun; hid = 1 - sunK as it is passed in). One rule for every caster that is drawn with this ground.
const GROUND_FRAG = /* glsl */`
${CS_COMMON}
${GROUND_H}
uniform sampler2D tMap; uniform vec3 uCloud; uniform sampler2D tCanopy; uniform vec3 uPond; uniform vec4 uWood; uniform vec2 uWalk;
varying vec3 vW, vN;
const float SQ = ${SQ}., SZ = ${SZ.toFixed(3)};
vec3 csGround(vec3 W, vec3 N, float sunK){
  float hid = 1. - sunK; sunK = 1.;
  vec3 toCam = cameraPosition - W; float dist = length(toCam); vec3 v = toCam / max(dist, 1e-3);
  vec2 p = W.xz, g = vec2(p.x / SQ, -p.y / SZ), cell = floor(g), f = g - cell;
  vec4 info = texture2D(tMap, (cell + .5) / 64.);
  float pale = mod(cell.x + cell.y, 2.), id = floor(info.r * 7.99), flag = info.b;
  float dH = min(f.x, 1. - f.x) * SQ, dB = min(f.y, 1. - f.y) * SZ;
  float fw = max(fwidth(g.x), fwidth(g.y)), aaH = fwidth(dH) * 1.2 + .3, aaB = fwidth(dB) * 1.2 + .25;
  vec4 n1 = texture2D(tNoise, p * .0037), n2 = texture2D(tNoise, p * .027), n3 = texture2D(tNoise, p * .21), n4 = texture2D(tNoise, p * 1.07);
  float gust = texture2D(tNoise, p * .006 - uTime * vec2(.021, .012)).b;
  float dap = texture2D(tNoise, p * .045 + uTime * .004).a;
  // THE GROUND'S GRAIN is in metres and of three sizes: tufts (0.3 to 0.6 m), sprigs (6 to 12 cm) and blades (2 to
  // 4 cm). px is how much ground one point of the picture covers: a grain shows while it is some points wide and is
  // gone before it is one, so nothing glitters; the blades show only on the turf close under us
  float px = length(fwidth(p));
  float near = (1. - smoothstep(60., 320., dist)) * (1. - smoothstep(.12, .5, px)), close = (1. - smoothstep(22., 120., dist)) * (1. - smoothstep(.03, .12, px)), blade = 1. - smoothstep(.006, .03, px);
  float n5 = texture2D(tNoise, p * 4.3).r;
  float fine = mix(.5, n3.r, near), micro = mix(.5, n4.g, close), tex = fine * .45 + micro * .3 + mix(.5, n5, blade) * .25;
  vec2 rd = info.g > .5 ? vec2(1., 0.) : vec2(0., 1.); float ac = dot(p, rd), al = dot(p, rd.yx);
  float streak = mix(.5, texture2D(tNoise, vec2(ac * .33, al * .011)).r, near);
  float wave = .5 + .5 * sin(dot(p, vec2(.11, .07)) - uTime * 1.9 + n2.g * 5.), wind = smoothstep(.35, .8, gust) * wave;
  float rows = 1. - smoothstep(.15, .5, fw * 8.);
  // the low sun catches every tuft and ear: relief from the same noise, lit from the sun's side
  float hB = texture2D(tNoise, (p + uSun.xz * .6) * .21).r, hC = texture2D(tNoise, (p + uSun.xz * .17) * 1.07).g;
  float hD = texture2D(tNoise, (p + uSun.xz * .04) * 4.3).r;
  float emb = clamp((n3.r - hB) * 1.5 * near + (n4.g - hC) * 1.2 * close + (n5 - hD) * 1.2 * blade, -1., 1.), tall = 1.;
  // rows and swaths stand up in the low sun: the lit flank of every ridge, the shaded one behind it
  float sunAc = dot(rd, normalize(uSun.xz + vec2(1e-4, 0.))), wph = dot(p, vec2(.11, .07)) - uTime * 1.9 + n2.g * 5.;
  // a standing crop has grain: one head to every 0.4 m, pale against the dark between the stalks, held within 75 m
  vec2 eq = p * 2.6 + vec2(n3.g, n3.a) * .9, ec = fract(eq) - .5; vec4 eh = texture2D(tNoise, (floor(eq) + .5) * .0371);
  float ear = 1. - smoothstep(.1, .3, length(ec - (eh.rg - .5) * .45)), earK = (1. - smoothstep(18., 75., dist)) * (1. - smoothstep(.04, .16, px)), edgeK = 1. - smoothstep(4., 11., min(dH, dB - 5.));
  vec3 col;
  if (pale > .5) {
    if (id < .5) {                                                       // wheat
      col = mix(vec3(.43, .3, .075), vec3(.72, .54, .17), n2.r * .3 + streak * .35 + tex * .35) * (1. + .2 * wind);
      col = mix(col, vec3(.8, .66, .3), smoothstep(.62, .8, micro) * .5);
      col *= 1. - .3 * smoothstep(.6, .7, n2.b) * smoothstep(.45, .6, n1.a);
      col *= mix(1., mix(.5, 1.45, ear), earK * .85);
      col = mix(col, vec3(.72, .05, .03), max(smoothstep(.7, .76, n3.a) * smoothstep(.5, .62, n2.a), edgeK * ear * step(.62, eh.b)) * near * .85);
      emb += cos(wph) * .45 * smoothstep(.3, .75, gust) * near + (ear - .4) * .8 * earK;
    } else if (id < 1.5) {                                               // barley, silvered by the wind
      col = mix(vec3(.42, .38, .13), vec3(.7, .63, .27), n2.r * .3 + streak * .3 + tex * .4) * (1. + .34 * wind);
      col *= mix(1., mix(.55, 1.4, ear), earK * .85);
      col = mix(col, vec3(.2, .28, .7), max(smoothstep(.72, .78, n3.a) * smoothstep(.5, .62, n2.a), edgeK * ear * step(.7, eh.b)) * near * .7);
      emb += cos(wph) * .55 * smoothstep(.3, .75, gust) * near + (ear - .4) * .8 * earK;
    } else if (id < 2.5) {                                               // stubble after the reaping
      col = mix(vec3(.44, .34, .15), vec3(.66, .55, .27), tex * .6 + .4 * smoothstep(-.2, .2, sin(ac * 2.6)) * rows); tall = .6;
      emb -= cos(ac * 2.6) * sunAc * .7 * rows;
    } else {                                                             // hay lying in swaths
      col = mix(vec3(.2, .3, .075), vec3(.62, .55, .2), (.15 + .7 * smoothstep(-.35, .35, sin(ac * .9 + n2.b * 3.))) * rows + .4 * (1. - rows)) * (.8 + .4 * tex); tall = .7;
      emb -= cos(ac * .9 + n2.b * 3.) * sunAc * 1.3 * rows;
    }
    if (id < 1.5) { float tl = abs(fract(ac / 14.) - .5) * 14.; col *= 1. - .42 * (1. - smoothstep(.25, .8, abs(tl - 1.1))) * rows; }
  } else {
    if (id < 4.5) {                                                      // clover
      col = mix(vec3(.026, .115, .034), vec3(.07, .21, .05), n2.r * .45 + tex * .55);
      col = mix(col, vec3(.5, .2, .34), smoothstep(.7, .8, n4.r) * step(.45, n3.g) * close * .7);
      col = mix(col, vec3(.46, .2, .32), smoothstep(.56, .7, n3.g) * smoothstep(.35, .6, n2.a) * near * .55);
      col = mix(col, mix(vec3(.7, .32, .5), vec3(.9, .86, .8), step(.5, eh.a)), ear * step(.55, eh.b) * earK * .85);   // clover heads, crimson and white
    } else if (id < 5.5) {                                               // pasture
      col = mix(vec3(.05, .15, .035), vec3(.15, .27, .06), n2.g * .4 + tex * .6);
      col = mix(col, vec3(.75, .62, .08), smoothstep(.72, .8, n4.b) * step(.5, n3.b) * close * .8);
    } else if (id < 6.5) {                                               // roots in rows
      col = mix(vec3(.15, .09, .05), vec3(.045, .2, .055), (smoothstep(-.1, .5, sin(ac * 2.1)) * .75 + .1) * rows + .5 * (1. - rows)) * (.75 + .5 * tex);
      emb -= cos(ac * 2.1) * sunAc * .9 * rows;
    } else {                                                             // orchard grass, mown between the trees
      col = mix(vec3(.045, .14, .036), vec3(.1, .23, .055), .25 + .35 * smoothstep(-.2, .2, sin(ac * .52)) * rows + .4 * tex); tall = .7;
    }
    col *= 1. + .12 * wind; tall *= .8;
  }
  col *= .84 + .32 * n1.r;
  // light squares and dark squares: the board must read from the air
  col *= pale > .5 ? vec3(1.24, 1.14, .9) : vec3(.62, .76, .68);
  // the wood's floor (a stretch of the queen's file, uWood = x0, x1, far z, near z) and the giant flowers' meadow
  float inSq = smoothstep(0., 7., min(dH, dB - 4.));
  float wood = smoothstep(0., 7., min(min(p.x - uWood.x, uWood.y - p.x), min(p.y - uWood.z, uWood.w - p.y))), mead = step(.9, flag) * inSq;
  // (light moss and grass, with drifts of bluebells where the noise gathers them)
  col = mix(col, mix(vec3(.055, .13, .045), vec3(.13, .29, .085), smoothstep(.3, .7, n3.b * .6 + n4.r * .4)) * (.7 + .6 * tex) * mix(vec3(1.), vec3(1.2, 1.15, .7), smoothstep(.5, .75, n2.a)), wood);
  col = mix(col, vec3(.15, .2, .55) * (.7 + .6 * tex), wood * smoothstep(.56, .7, n2.b) * smoothstep(.38, .6, n3.g) * .7 * near);
  col = mix(col, mix(vec3(.05, .17, .045), vec3(.14, .3, .07), n2.r * .5 + tex * .5), mead);
  col = mix(col, vec3(.8, .66, .1), mead * smoothstep(.7, .8, n4.g) * step(.4, n3.g) * close * .8);
  // the wood's own shade: tCanopy holds, for every 2 m of the wood's floor, the share of the sun that finds its way
  // down between the crowns of the trees that stand (reckoned once, from the trees and the sun); the leaves' finer
  // dapple plays inside the light
  float can = 1.;
  if (wood > .01) { vec2 cq = (p - uWood.xz) / (uWood.yw - uWood.xz) + (n3.rg - .5) * .012; can = texture2D(tCanopy, cq).r * (.72 + .28 * smoothstep(.36 - .1 * uNight, .6 - .1 * uNight, dap)); }
  sunK *= 1. - wood * (1. - can);
  // a hedge's rough bottom and its dark foot lie only where that length of the hedge stands: the map's fourth number
  // holds, for the line on a square's low-x side, which of the run's lengths stand (one bit each, counted from the
  // run's end farther down the board). Where none stands the two fields meet. The brook's lush bank is its own.
  float hs = floor((f.x < .5 ? info.a : texture2D(tMap, (cell + vec2(1.5, .5)) / 64.).a) * 15. + .5), hz = (.5 - f.y) * SZ;
  float hj = hz < 0. ? step(-${f4((SZ - 16 - HEDGE_GAP) / HEDGE_SEG + HEDGE_GAP / 2)}, hz) : 2. + step(${f4((SZ - 16 - HEDGE_GAP) / HEDGE_SEG + HEDGE_GAP / 2)}, hz);
  float stands = mod(floor(hs / exp2(hj)), 2.);
  // every file line carries a grass balk, a pace and a half to either hand, whether a hedge stands on it or not (two
  // fields never meet on a ruled line), and a crop ends raggedly, by its own tufts
  float rag = (n3.g - .5) * 1.4 * near, balk = 1. - smoothstep(1.3, 2.1, dH + rag);
  float verge = max(max((1. - smoothstep(3., 5.5, dH + rag)) * stands, balk), 1. - smoothstep(3., 5.5, dB - 6. + rag));
  col = mix(col, mix(vec3(.05, .13, .035), vec3(.13, .23, .06), tex), verge * .9);
  // THE AVENUE: a mown walk (8.5 m either side of its line) between two waysides of rough turf where its flowers
  // stand (to WALK_B = 14 m); it begins by degrees at the wood's far edge, and its edges are ragged by the turf's
  // own tufts: no ruled strip laid over the field
  float wIn = (1. - smoothstep(uWalk.y - 5., uWalk.y + 1., p.y + rag * 3.)) * step(-8.5 * SZ, p.y), wdx = abs(p.x - uWalk.x) + rag;
  float walk = wIn * (1. - smoothstep(7., 8.5, wdx)), wayside = wIn * (1. - smoothstep(13., 15., wdx + (n2.g - .5) * 3.));
  float hed = (1. - smoothstep(1.9, 1.9 + aaH, dH)) * smoothstep(7.5, 9., dB) * (1. - walk) * stands;
  col = mix(col, vec3(.02, .06, .022) * (.6 + .8 * n3.g), hed);
  float bw = ${BROOK.toFixed(1)} + (n2.b - .5) * ${BROOK_RAG.toFixed(1)};
  col = mix(col, mix(vec3(.03, .12, .035), vec3(.08, .2, .05), tex), (1. - smoothstep(bw + .4, bw + 3.6, dB)) * .85);
  float bwF = bw + clamp(dist * .0035, 0., 5.), water = 1. - smoothstep(bwF - aaB, bwF + aaB, dB);
  // the pond on the pasture: a round of water with a lush rim
  float pd = length(p - uPond.xy) + (n2.b - .5) * 5., pk = step(.5, uPond.z);
  col = mix(col, mix(vec3(.03, .12, .035), vec3(.08, .2, .05), tex), (1. - smoothstep(uPond.z, uPond.z + 4., pd)) * .85 * pk);
  water = max(water, (1. - smoothstep(uPond.z - 1. - aaB, uPond.z - 1. + aaB, pd)) * pk);
  // the garden's lawn on the hill and the walk up the avenue, mown in stripes
  // (the crown stands on a lawn of its own: mown turf over its level round of 34 m, its edge ragged, lost in the
  // field by 50 m)
  float hk = csHill(p), crownLawn = 1. - smoothstep(34., 50., length(p - vec2(${f4(CX)}, ${f4(CZ)})) + (n2.b - .5) * 10.);
  float lawn = max(max(smoothstep(0., .1, hk), crownLawn), max(walk, wayside) * (1. - water));
  float gard = smoothstep(0., .1, hk) * (1. - walk), stripe = smoothstep(-.25, .25, sin(p.x * .9)) * rows * (1. - gard);
  vec3 lawnCol = mix(vec3(.07, .19, .045), vec3(.105, .25, .058), stripe) * (.8 + .4 * tex);
  lawnCol = mix(lawnCol, vec3(.8, .8, .7), smoothstep(.74, .8, n4.b) * step(.55, n3.b) * close * .8);
  // the garden's turf: drifts of small flowers some 5 m across, rose, gold and blue mixed as they seed themselves,
  // every flower a head of its own a hand across, strewn (about one to a square pace, none in rows); beyond the
  // reach of the heads a drift is a faint warm breath on the green
  vec3 headCol = eh.a < .45 ? vec3(.8, .32, .45) : eh.a < .55 ? vec3(.88, .74, .2) : vec3(.45, .5, .9);
  float head = (1. - smoothstep(.06, .2, length(ec - clamp((eh.rg - .5) * 1.6, -.3, .3)))) * step(.52, eh.b);
  lawnCol = mix(lawnCol, mix(vec3(.62, .52, .5), headCol, earK), gard * smoothstep(.48, .58, n2.a) * mix(.1, head * .9, earK));
  // the last walk is mown in a fine chequer of the mower's two ways, squares of 0.6 m: finer than a pace
  vec2 wq = vec2(p.x + 8., p.y) / .6, wf = abs(fract(wq) - .5); float wfw = max(fwidth(wq.x), fwidth(wq.y));
  float chq = mix(mod(floor(wq.x) + floor(wq.y), 2.), .5, max(smoothstep(.5 - wfw * 1.5 - .01, .5, max(wf.x, wf.y)), smoothstep(.25, .8, wfw)));
  vec3 rough = mix(vec3(.035, .12, .03), vec3(.075, .2, .045), tex) * (.75 + .5 * n3.r);
  rough = mix(rough, vec3(.85, .82, .7), smoothstep(.7, .8, n4.b) * step(.45, n3.b) * close * .85);
  lawnCol = mix(lawnCol, rough, wayside);
  lawnCol = mix(lawnCol, mix(rough, vec3(.13, .3, .07) * (.9 + .2 * tex), chq), walk);
  col = mix(col, lawnCol, lawn);
  water *= (1. - smoothstep(0., .1, hk)) * (1. - smoothstep(${f4(RG0 - 60)}, ${f4(RG0 + 60)}, length(vec2(p.x, p.y - ${f4(ZM)})))); tall = mix(tall, mix(.5, 1.1 - .8 * chq, walk), lawn);
  // far off the squares run together
  vec3 farC = mix(pale > .5 ? vec3(.5, .4, .13) : vec3(.05, .14, .05), vec3(.22, .25, .09), smoothstep(.8, 2.2, fw));
  col = mix(col, farC * (.85 + .3 * n1.r), smoothstep(.35, 1., fw) * (1. - lawn) * (1. - wood));
  // the near hills carry hanging woods on their heights, as downs do: dark caps whose lower edge is ragged
  float Rm = length(vec2(p.x, p.y - ${f4(ZM)}));
  if (Rm > ${f4(RG0)}) { float hang = smoothstep(.5, .62, csRanges(p) / ${f4(RG[0].h)} + .3 * (n1.g - .5)) * (1. - smoothstep(${f4(RG[0].b)}, ${f4(RG[1].f)}, Rm)); col = mix(col, vec3(.03, .085, .04) * (.75 + .5 * n1.r), hang); }
  // the shadows of the great clouds drift over the country, soft and wide
  float sh = smoothstep(.5, .68, texture2D(tNoise, (p + uCloud.xy) * .00085).r);
  sunK *= 1. - uCloud.z * sh;
  vec3 n = normalize(N + vec3(0., 1e-5, 0.));
  float ndl = clamp(dot(n, uSun), 0., 1.);
  vec3 Ls = uSunCol * ndl * sunK * clamp(1. + 1.5 * emb * tall, .2, 2.5), La = csAmbient(n) * (.92 - .1 * wood + 1.8 * wood * uNight) * (1. + .25 * emb * tall);
  const vec3 LUM = vec3(.3, .55, .15);
  vec3 fill = uSky / max(dot(uSky, LUM), 1e-3) * max(0., .5 * dot(Ls + La, LUM) - dot(La, LUM));
  vec3 lit = col * (Ls * (1. - hid) + La + fill * hid);
  sunK *= 1. - hid;
  lit += col * uSunCol * vec3(1., 1., .7) * can * wood * .4 * (1. - hid);
  // WATER. A brook runs to the lower end of its line across the board. Its face is broken by ripples that keep their
  // size in metres (a 10 m and a 3.7 m tile of the noise, the first carried down the stream at 1.3 m/s); it mirrors
  // the sky, and the far bank where the mirrored ray meets the bank (2 m of bank and verge) before it clears it; seen
  // from above it is clear over pebbles in the first metre from its edge and dark from 3 m in; the sun glints on the
  // ripples toward the sun; where its bed drops by more than 9 to 13 in a hundred down the stream it breaks white.
  // A cast shadow lies on it as on the land.
  if (water > .002) {
    float zc = floor(p.y / SZ + .5) * SZ, zr = p.y - zc, flow = csLand(vec2(-300., zc)) > csLand(vec2(300., zc)) ? 1. : -1.;
    float pondK = pk * (1. - smoothstep(uPond.z - 1., uPond.z, pd)), inB = mix(bw - dB, uPond.z - 1. - pd, pondK);
    vec4 ra = texture2D(tNoise, vec2(p.x - flow * uTime * 1.3 * (1. - pondK), p.y) * .1), rb = texture2D(tNoise, (p + uTime * vec2(-.25, .4)) * .27);
    vec3 wn = normalize(vec3((ra.r - .5) * .9 + (rb.g - .5) * .6, 1., (ra.b - .5) * .9 + (rb.a - .5) * .6)), r = reflect(-v, wn);
    float fres = .03 + .97 * pow(1. - clamp(dot(v, wn), 0., 1.), 5.);
    float rise = r.y * max(r.z > 0. ? bw - zr : bw + zr, 0.) / max(abs(r.z), .08), bankM = (1. - smoothstep(1., 2., rise)) * (1. - pondK);
    vec3 light = uSunCol * ndl * sunK + csAmbient(n);
    vec3 refl = mix(csEnv(r), vec3(.035, .11, .035) * light, bankM);
    vec3 peb = mix(vec3(.2, .17, .12), vec3(.62, .56, .44), smoothstep(.35, .65, n4.b)) * (.7 + .6 * n3.r);
    // (pebbles under water are wet: half as bright as dry ones and greener, so the brook's edge is clear, not pale)
    vec3 wcol = mix(mix(peb * vec3(.34, .42, .36), vec3(.012, .05, .055), smoothstep(.2, 3., inB)) * light, refl, fres);
    wcol += uSunCol * pow(clamp(dot(r, uSun), 0., 1.), 120.) * 2.5 * sunK;
    float drop = (csLand(vec2(p.x - 1.5, zc)) - csLand(vec2(p.x + 1.5, zc))) / 3. * flow;
    float foam = smoothstep(.09, .13, drop) * smoothstep(.42, .62, texture2D(tNoise, vec2((p.x * flow - uTime * 2.4) * .06, p.y * .45)).g) * (1. - pondK);
    wcol = mix(wcol, vec3(.8) * light, foam) * mix(.6, 1., sunK);
    lit = mix(lit, wcol, water);
  }
  // THE GATE'S GLOW LIES ON THE WALK: the light of the door in the crown falls out through its doorway and down the
  // walk before it, widening as it goes (a quarter of a metre to the metre) and spent in some 90 m
  vec2 gd = vec2(p.x - ${f4(CX)}, p.y - ${f4(CZ)});
  if (gd.y > 0. && gd.y < 120.) lit += col * vec3(3.6, 2.3, .8) * exp(-gd.y / 30.) * (1. - smoothstep(.55, 1., abs(gd.x) / (5. + .25 * gd.y))) * smoothstep(0., 3., gd.y);
  // the far land stands in blue air (it is the air between the eye and the ground, so it is laid off from the eye):
  // the blue begins half way out to the near hills' foot, the near hills stand in under half of it, so that their
  // fields and woods still show, and the far hills behind them in three quarters of it; the haze then pales both
  lit = mix(lit, uSky * 1.25, .42 * smoothstep(${f4(0.5 * RG0)}, ${f4(RG[0].c)}, dist) + .33 * smoothstep(${f4(RG[0].c)}, ${f4(RG[1].c)}, dist));
  return csFog(lit, dist);
}`;
const GROUND_VERT = /* glsl */`varying vec3 vW, vN; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`;
// a chessman flattened along the sun onto the ground: the same ground, in shade
// PEN: the edge of a cast shadow is soft over PEN of the height of the point that casts it (so it softens with the
// distance from the caster's foot), and the shade thins to a half at the height of the queen's crown above the foot.
const PEN = 0.06;
const SHADOW_VERT = (inst) => /* glsl */`
attribute vec4 aRig; ${inst ? 'attribute vec4 iAnim;' : 'uniform vec4 uIAnim;'}
uniform vec3 uSun; uniform float uTime;
varying vec3 vW, vN; varying float vA;
${GROUND_H}
${PIECE_ANIM}
void main(){
  vec3 p = position, n = normal; csAnim(p, n, aRig, ${inst ? 'iAnim' : 'uIAnim'});
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
  #endif
  vec4 w = m * vec4(p, 1.);
  vec2 sl = uSun.xz / max(uSun.y, .08), q = w.xz; float gy = csGroundH(q);
  for (int i = 0; i < 2; i++) { q = w.xz - sl * max(w.y - gy, 0.); gy = csGroundH(q); }
  // how deep in the shade this point lies: 0 on the outline (where the caster's surface turns edge-on to the sun)
  float h = max(w.y - gy, 0.), rr = max(length((m * vec4(p.x, 0., p.z, 0.)).xyz), 1.), e = abs(dot(normalize(mat3(m) * n), uSun));
  vA = smoothstep(0., clamp(sqrt(2. * ${PEN.toFixed(3)} * h / rr), .04, 1.), e) * (1. - .5 * smoothstep(0., ${RUNNER.crown.toFixed(2)}, h));
  vec3 cam = cameraPosition - vec3(q.x, gy, q.y);
  vW = vec3(q.x, gy + .12 + length(cam) * .0012, q.y);
  vN = normalize(vec3(gy - csGroundH(q + vec2(1., 0.)), 1., gy - csGroundH(q + vec2(0., 1.))));
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;

return { hillAt, heightAt, landAt: land, GROUND_VERT, GROUND_FRAG, SHADOW_VERT, ZM, RG, RG0, rangeWarp, rangesAt: ranges };
}

// how tall each kind of the live flowers stands at its own size (metres to the head)
const FLOWER_H = { lily: 11, rose: 8.5, daisy: 7, larkspur: 12.5 };
// ---------------------------------------------------------------- the live flowers (heads are part 1: they turn and nod)
// a petal or leaf: a sheet that leaves the axis at elevation e0 and curls by `curl` along its length
function petal(g, phi, r0, L, W, e0, curl, cup = 0.25, nv = 5, y0 = 0) {
  const c = Math.cos(phi), s = Math.sin(phi), path = [[r0, y0]];
  for (let i = 1; i <= nv; i++) { const th = e0 + curl * (i - 0.5) / nv, q = path[i - 1]; path.push([q[0] + Math.cos(th) * L / nv, q[1] + Math.sin(th) * L / nv]); }
  g.grid(2, nv, (u, v) => {
    const k = Math.round(v * nv), q = path[k], w = W * 0.5 * Math.pow(Math.sin(Math.PI * (0.1 + 0.86 * v)), 0.7), x = (u * 2 - 1) * w, lift = cup * (u * 2 - 1) * (u * 2 - 1) * w;
    return [s * q[0] + c * x, q[1] + lift, c * q[0] - s * x, 0.62 + 0.38 * v];
  });
}
// lo: the same flower in about a third of the triangles, for blooms far from the flight
function flowerGeometry(kind, rng, lo = false) {
  const g = new Geo(), H = FLOWER_H[kind], green = lin('#3f8a3a'), leaf = lin('#4a9a3c');
  const bx = rng.range(-0.5, 0.5), bz = rng.range(-0.5, 0.5);
  g.mat(3, 0.3).col(green).rig(0);
  g.tube([[0, -0.5, 0], [bx, H * 0.35, bz], [bx * 0.6, H * 0.72, bz * 0.6], [0, H, 0]], (t) => H * (0.034 - 0.014 * t), lo ? 4 : 6);
  g.col(leaf);
  const nl = lo ? 4 : kind === 'daisy' ? 7 : kind === 'rose' ? 6 : 8, pv = (n) => (lo ? Math.max(2, n >> 1) : n);
  for (let i = 0; i < nl; i++) {
    const t = kind === 'daisy' ? 0.02 : 0.12 + 0.5 * i / nl, y = H * t, ph = i * 2.4 + rng.range(-0.3, 0.3);
    petal(g, ph, 0.1 + Math.abs(bx) * t, kind === 'lily' ? 4.6 : kind === 'daisy' ? 2.6 : 2.4, kind === 'lily' ? 0.8 : 1.3, kind === 'daisy' ? 0.25 : 0.7, -1.3, 0.3, pv(4), y);
  }
  g.rig(1, H, 0, 0).mat(7, 0.25);
  if (kind === 'daisy') {
    g.at(0, H, 0, 0.95, 0, 0);
    // its rays in two ranks: every other one lies a little lower and shorter, in its neighbours' shade, each ray
    // folded along its middle; the disc is a dome of florets, ringed, with a darker heart
    const np = lo ? 9 : 15; for (let i = 0; i < np; i++) { const o = i % 2; g.col(lin('#f1ecdf'), o ? 0.84 : 1); petal(g, i / np * TAU, 0.9, o ? 2.45 : 2.7, lo ? 1.25 : 0.78, o ? 0.02 : 0.14, -0.35, 0.24, pv(3), o ? 0.04 : 0.1); }
    g.mat(3, 0.2).col(lin('#f2b92a')).blob([0, 0.2, 0], [1.15, 0.55, 1.15], lo ? 6 : 10, lo ? 3 : 5, { f: (x, y, z) => 1 + (lo ? 0 : 0.07 * Math.sin(Math.atan2(x, z) * 5) * (1 - y * y)), shade: (x, y) => 0.72 + 0.28 * y });
    if (!lo) g.col(lin('#c98712')).blob([0, 0.52, 0], [0.62, 0.36, 0.62], 8, 3, { shade: (x, y) => 0.8 + 0.2 * y });
  } else if (kind === 'lily') {
    g.at(0, H, 0, 1.05, 0, 0);
    g.col(lin('#f27a1e')); for (let i = 0; i < 6; i++) petal(g, i / 6 * TAU + (i % 2) * 0.1, 0.25, 3.9, 1.25, 1.15, -2.5, 0.5, pv(6), 0);
    g.mat(3, 0.3).col(lin('#6a2a12'));
    for (let i = 0; i < (lo ? 0 : 6); i++) { const a = i / 6 * TAU + 0.5, s = Math.sin(a), c = Math.cos(a); g.tube([[s * 0.1, 0.2, c * 0.1], [s * 0.5, 1.7, c * 0.5], [s * 1.0, 2.9, c * 1.0]], (t) => 0.07 + (t > 0.8 ? 0.16 : 0), 4); }
  } else if (kind === 'rose') {
    g.at(0, H, 0, 0.85, 0, 0);
    g.col(lin('#e04866'));
    for (let i = 0; i < 7; i++) petal(g, i / 7 * TAU, 0.5, 2.6, 2.5, 0.5, 0.7, -0.5, pv(4), 0.2);
    for (let i = 0; i < 6; i++) petal(g, i / 6 * TAU + 0.5, 0.35, 2.1, 2.1, 0.95, 0.5, -0.6, pv(4), 0.35);
    for (let i = 0; i < (lo ? 0 : 5); i++) petal(g, i / 5 * TAU + 0.2, 0.2, 1.7, 1.6, 1.3, 0.4, -0.7, 4, 0.5);
    g.mat(3, 0.2).col(lin('#b02848')).blob([0, 1.3, 0], [0.6, 0.9, 0.6], lo ? 4 : 6, lo ? 2 : 4);
    g.col(leaf); for (let i = 0; i < (lo ? 0 : 5); i++) petal(g, i / 5 * TAU, 0.3, 1.5, 0.7, -0.5, -0.6, 0.2, 3, 0.1);
  } else {
    g.at(0, H * 0.62, 0, 0.12, 0, 0).rig(1, H * 0.62, 0, 0);
    const SH = H * 0.4, n = lo ? 9 : 15;
    g.mat(3, 0.3).col(green).tube([[0, 0, 0], [0, SH * 0.5, 0], [0, SH, 0]], (t) => 0.2 - 0.15 * t, 5);
    g.mat(7, 0.25);
    for (let i = 0; i < n; i++) {
      const t = i / n, a = i * 2.4, y = 0.4 + t * SH, s = 0.95 * (1 - 0.65 * t), r = 0.35 + s * 0.6;
      g.col(lin(i % 3 ? '#5b54d8' : '#8a7cf0')).blob([Math.sin(a) * r, y, Math.cos(a) * r], [s * (lo ? 1.1 : 0.85), s * (lo ? 0.8 : 0.6), s * (lo ? 1.1 : 0.85)], lo ? 4 : 5, lo ? 2 : 3);
    }
  }
  g.xf(null);
  return { geometry: g.build(), H, headY: kind === 'larkspur' ? H * 0.62 : H };
}

// ---------------------------------------------------------------- looking-glass insects (wings are part 6), ~2 to 3 m long, facing +Z
function breadFlyGeometry() {
  const g = new Geo(), crust = lin('#8a5a2a'), butter = lin('#ffe07a'), bread = lin('#f3e2b8');
  // the body is a crust, the head a lump of sugar
  g.mat(3, 0.25).col(crust).rig(0).tube([[0, 0, -1.0], [0, 0.08, -0.4], [0, 0.08, 0.4], [0, 0, 0.9]], (t) => 0.3 - 0.12 * Math.abs(t - 0.5), 6);
  g.mat(3, 0.55).col([0.97, 0.97, 0.99]).at(0, 0.08, 1.12, 0.25, 0.5, 0.15).box([0, 0, 0], [0.5, 0.5, 0.5]).xf(null);
  g.mat(3, 0.3).col(crust); for (const sg of [-1, 1]) g.tube([[sg * 0.12, 0.25, 1.2], [sg * 0.3, 0.7, 1.6], [sg * 0.45, 0.75, 1.9]], 0.035, 4);
  // each wing is a thin slice of bread and butter: the end of a loaf with its domed top outward, crust all round
  for (const sg of [-1, 1]) {
    g.rig(6, 0.1, sg * 0.2, sg);
    const out = [[0.2, -0.72], [1.35, -0.78]]; for (let i = 1; i < 8; i++) { const a = -Math.PI / 2 + Math.PI * i / 8; out.push([1.35 + 0.62 * Math.cos(a), 0.78 * Math.sin(a)]); } out.push([1.35, 0.78], [0.2, 0.72]);
    const P3 = (q, y, k = 1) => [sg * (0.2 + (q[0] - 0.2) * k + (1 - k) * 0.75), y, q[1] * k + 0.1];
    const ring = (y, k) => { const r = out.map((q) => P3(q, y, k)); return sg > 0 ? r.reverse() : r; };
    g.mat(3, 0.15).col(bread).poly(ring(0.19, 1));
    g.mat(3, 0.5).col(butter).poly(ring(0.215, 0.8));
    g.mat(3, 0.15).col(bread, 0.9).poly(ring(0.01, 1).reverse());
    g.mat(3, 0.2).col(crust);
    for (let i = 0; i < out.length; i++) { const a = out[i], b = out[(i + 1) % out.length]; g.poly([P3(a, 0.01), P3(b, 0.01), P3(b, 0.19), P3(a, 0.19)]); }
  }
  return g.build();
}
function rockingFlyGeometry() {
  const g = new Geo(), red = lin('#d8342a'), yel = lin('#f4c430'), blue = lin('#2f6fd0'), grn = lin('#2e8a50');
  g.mat(3, 0.7).col(red).rig(0).blob([0, 1.0, 0], [0.42, 0.5, 1.0], 10, 6);
  g.tube([[0, 1.25, 0.7], [0, 1.75, 1.05], [0, 2.05, 1.2]], (t) => 0.3 - 0.08 * t, 6);
  g.at(0, 2.1, 1.42, 0.7, 0, 0).blob([0, 0, 0], [0.2, 0.26, 0.48], 8, 5).xf(null);
  g.col(yel).at(0, 1.75, 0.8, -0.5, 0, 0).blob([0, 0, 0], [0.07, 0.5, 0.2], 5, 4).xf(null);
  g.tube([[0, 1.2, -0.95], [0, 1.2, -1.35], [0, 0.75, -1.5]], (t) => 0.12 - 0.07 * t, 5);
  g.col(blue).blob([0, 1.45, -0.1], [0.36, 0.14, 0.42], 8, 4);
  g.col(red);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.25, 0.8, sz * 0.6], [sx * 0.34, 0.25, sz * 0.95]], 0.09, 5);
  g.col(grn);
  for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 8; i++) { const z = (i / 8 * 2 - 1) * 1.55; pts.push([sx * 0.34, 0.1 + 0.42 * (z / 1.55) * (z / 1.55), z]); } g.tube(pts, 0.09, 5); }
  // (no wings: it is all of wood, and swings itself from branch to branch)
  return g.build();
}
// (a snap-dragon-fly: a plum-pudding body, a raisin for a head burning in brandy, wings of holly leaves, 4.4 m across
// the wings. It is never nearer than 20 m to the flight, so its body is turned in few sides.)
function snapFlyGeometry() {
  const g = new Geo(), pud = lin('#3a2216'), holly = lin('#1d5a2a');
  g.mat(3, 0.35).col(pud).rig(0).blob([0, 0, 0], [0.66, 0.6, 0.72], 8, 5, { f: (x, y, z) => 1 + 0.05 * Math.sin(x * 9) * Math.sin(z * 8 + y * 5) });
  g.mat(3, 0.5).col([0.96, 0.93, 0.85]).blob([0, 0.36, 0], [0.5, 0.26, 0.54], 8, 3, { f: (x, y, z) => 1 + 0.16 * Math.sin(Math.atan2(x, z) * 5) });
  g.mat(3, 0.6).col(lin('#c2202b')); for (let i = 0; i < 3; i++) g.blob([Math.sin(i * 2.1) * 0.12, 0.66, Math.cos(i * 2.1) * 0.12], [0.09, 0.09, 0.09], 4, 2);
  // the raisin
  g.mat(3, 0.3).col(lin('#2a1420')).blob([0, 0.1, 0.86], [0.2, 0.17, 0.24], 5, 3);
  // burning in brandy
  g.mat(5, 3.2).col(lin('#5aa8ff')).tube([[0, 0.2, 0.9], [0.03, 0.42, 0.93], [-0.02, 0.66, 0.9], [0, 0.9, 0.92]], (t) => 0.13 * (1 - t) + 0.02, 4);
  for (const sg of [-1, 1]) for (const k of [0, 1]) {                    // wings of holly leaves
    g.rig(6, 0.15, sg * 0.3, sg).mat(3, 0.85).col(holly);
    const L = 1.9 - k * 0.5, z0 = 0.25 - k * 0.6, out = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, w = Math.sin(Math.PI * t) * 0.34 + (i % 2 ? 0.16 : 0); out.push([sg * (0.3 + L * t), 0.15, z0 + w]); }
    for (let i = 10; i >= 0; i--) { const t = i / 10, w = Math.sin(Math.PI * t) * 0.34 + (i % 2 ? 0.16 : 0); out.push([sg * (0.3 + L * t), 0.15, z0 - w]); }
    for (let i = 0; i < 10; i++) { const a = out[i], b = out[i + 1], c = out[21 - i - 1], d = out[21 - i]; g.poly(sg > 0 ? [a, d, c, b] : [a, b, c, d]); }
  }
  return g.build();
}

// an elephant that works at a bloom like a bee: ears are part 5 and fan (plain: the far make, a fifth of the triangles)
function elephantGeometry(plain = false) {
  const g = new Geo(), grey = lin('#8d8f96'), k = plain ? 0.3 : 1, n = (v) => Math.max(3, Math.round(v * k));
  g.mat(3, 0.15).col(grey).rig(0);
  g.blob([0, 0, 0], [1.9, 1.8, 2.9], n(14), n(9), { shade: (x, y) => 0.7 + 0.3 * clamp(y + 0.8, 0, 1) });
  g.blob([0, 0.7, 3.0], [1.35, 1.45, 1.45], n(12), n(8));
  g.tube([[0, 0.5, 4.0], [0, -0.3, 4.9], [0, -1.6, 5.3], [0, -2.9, 5.1], [0, -3.6, 4.7]], (t) => 0.55 - 0.33 * t, n(7));
  for (const sx of [-1, 1]) {
    for (const z of [-1.5, 1.5]) g.tube([[sx * 1.0, -1.0, z], [sx * 1.05, -2.5, z + 0.15], [sx * 1.05, -3.3, z + 0.05]], (t) => 0.62 - 0.12 * t, n(7), { shade: 0.8 });
    if (!plain) g.mat(3, 0.6).col([0.95, 0.92, 0.82]).tube([[sx * 0.55, 0.1, 4.0], [sx * 0.75, -0.5, 4.9], [sx * 0.8, -0.4, 5.7]], (t) => 0.15 - 0.1 * t, 5).mat(3, 0.15).col(grey);
    g.rig(5, sx * 1.1, 2.7, sx).at(sx * 1.2, 0.9, 2.7, 0, sx * 0.5, 0).blob([sx * 1.1, 0, 0], [1.3, 1.5, 0.16], n(10), n(6), { shade: () => 0.85 }).xf(null).rig(0);
  }
  if (!plain) g.tube([[0, 0.6, -2.8], [0, 0, -3.5], [0, -1.2, -3.6]], (t) => 0.14 - 0.08 * t, 4);
  return g.build();
}

// ---------------------------------------------------------------- the little train (facing +Z, rail level at y = 0)
function engineGeometry() {
  const g = new Geo(), grn = lin('#1f6a3a'), blk = lin('#22262a'), red = lin('#b8262e');
  g.mat(3, 0.6).col(grn).rig(0).tube([[0, 2.3, -1.3], [0, 2.3, 1], [0, 2.3, 3.6]], 1.25, 10);
  g.col(blk).tube([[0, 2.3, 3.5], [0, 2.3, 4.3]], 1.32, 10);
  g.tube([[0, 3.3, 3.7], [0, 4.5, 3.7], [0, 5.1, 3.7]], (t) => 0.4 + (t > 0.7 ? 0.24 : 0), 8);
  g.mat(1, 0.8).col(GOLD).blob([0, 3.7, 1.5], [0.6, 0.65, 0.6], 8, 5);
  g.mat(3, 0.6).col(red).box([0, 3.0, -2.6], [2.9, 3.4, 2.6]).box([0, 1.0, 1.0], [2.7, 0.5, 9.6]);
  g.at(0, 0.7, 5.5, 0.6, 0, 0).box([0, 0, 0], [2.6, 0.2, 1.7]).xf(null);
  g.col(blk).box([0, 4.85, -2.6], [3.3, 0.3, 3.1]);
  g.mat(3, 0.8).col([0.06, 0.08, 0.1]).box([0, 3.7, -1.27], [2.0, 1.0, 0.06]).box([0, 3.7, -2.6], [2.96, 1.0, 1.4]);
  g.mat(3, 0.4).col(blk);
  for (const sx of [-1, 1]) for (const z of [-2.6, 0.2, 2.8]) g.tube([[sx * 1.2, 0.95, z], [sx * 1.55, 0.95, z]], 0.95, 10);
  return g.build();
}
function carriageGeometry() {
  const g = new Geo(), cream = lin('#f1e4c0'), red = lin('#b8262e'), blk = lin('#22262a');
  g.mat(3, 0.5).col(cream).rig(0).box([0, 2.5, 0], [2.8, 2.3, 6.8]);
  g.col(red).box([0, 1.75, 0], [2.88, 0.9, 6.88]);
  g.mat(3, 0.8).col([0.07, 0.09, 0.12]).box([0, 2.95, 0], [2.9, 0.8, 5.8]);
  g.mat(3, 0.5).col(cream); for (let i = -2; i <= 2; i++) g.box([0, 2.95, i * 1.2], [2.94, 0.84, 0.18]);
  g.col(lin('#1f6a3a')).box([0, 3.8, 0], [3.0, 0.3, 7.1]).box([0, 4.05, 0], [2.2, 0.25, 6.6]);
  g.mat(3, 0.4).col(blk).box([0, 1.1, 0], [2.4, 0.4, 6.4]);
  for (const sx of [-1, 1]) for (const z of [-2.2, 2.2]) g.tube([[sx * 1.15, 0.7, z], [sx * 1.5, 0.7, z]], 0.7, 8);
  return g.build();
}

// ---------------------------------------------------------------- the crown that stands on the grass as an arch
// A band 19 m in radius and 20 m high with a round-headed doorway through it front (+Z) and back, eight fleurs,
// four arches meeting under a monde, cabochons round the band. Origin at the centre on the ground.
async function crownGeometry(pause) {
  const g = new Geo(), R = 19, Ri = 17.5, H = 20, N = 72, ND = 5, aD = ND * TAU / N, hw = R * Math.sin(aD), yc = 9.5;
  const pt = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
  const archY = (a) => yc + Math.sqrt(Math.max(hw * hw - (R * Math.sin(a)) ** 2, 0));
  const inDoor = (a) => { const d = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))), e = Math.min(d, Math.PI - d); return e < aD - 1e-4; };
  g.mat(1, 0.8).col(GOLD).rig(0);
  for (let i = 0; i < N; i++) {
    const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, door = inDoor((a0 + a1) / 2);
    const fold = (a) => { const d = Math.atan2(Math.sin(a), Math.cos(a)); return Math.abs(d) > Math.PI / 2 ? Math.PI - Math.abs(d) : Math.abs(d); };
    const b0 = door ? archY(fold(a0)) : 0, b1 = door ? archY(fold(a1)) : 0;
    g.poly([pt(R, a0, b0), pt(R, a1, b1), pt(R, a1, H), pt(R, a0, H)]);
    g.poly([pt(Ri, a1, b1), pt(Ri, a0, b0), pt(Ri, a0, H), pt(Ri, a1, H)], 0.7);
    g.poly([pt(R, a0, H), pt(R, a1, H), pt(Ri, a1, H), pt(Ri, a0, H)]);
    if (door) g.poly([pt(R, a1, b1), pt(R, a0, b0), pt(Ri, a0, b0), pt(Ri, a1, b1)], 0.6);
  }
  await pause();
  for (const c of [0, Math.PI]) for (const sg of [-1, 1]) {            // the doorways' jambs
    const a = c + sg * aD, q = [pt(R, a, 0), pt(Ri, a, 0), pt(Ri, a, yc), pt(R, a, yc)];
    g.poly(sg > 0 ? q.reverse() : q, 0.75);
  }
  const arc = (y, r, rad, a0, a1) => { const pts = [], n = Math.max(4, Math.round((a1 - a0) / 0.09)); for (let i = 0; i <= n; i++) pts.push(pt(r, lerp(a0, a1, i / n), y)); g.tube(pts, rad, 6); };
  for (const c of [0, Math.PI]) { arc(0.8, R + 0.3, 0.9, c + aD + 0.03, c + Math.PI - aD - 0.03); arc(15.4, R + 0.15, 0.5, c + aD + 0.2, c + Math.PI - aD - 0.2); arc(6.4, R + 0.15, 0.5, c + aD + 0.03, c + Math.PI - aD - 0.03); }
  arc(19.6, R + 0.25, 0.85, 0, TAU);
  for (const c of [0, Math.PI]) { arc(15.4, Ri - 0.1, 0.45, c + aD + 0.2, c + Math.PI - aD - 0.2); arc(6.4, Ri - 0.1, 0.45, c + aD + 0.03, c + Math.PI - aD - 0.03); arc(0.7, Ri - 0.2, 0.8, c + aD + 0.03, c + Math.PI - aD - 0.03); }
  for (const c of [0, Math.PI]) { const pts = []; for (let i = 0; i <= 16; i++) { const a = lerp(-aD, aD, i / 16); pts.push(pt(R + 0.2, c + a, archY(Math.abs(a)) + 0.5)); } g.tube(pts, 0.55, 6); }
  await pause();
  // cabochons on the band between the doorways, pearls above them
  const gems = [lin('#e01b3c'), lin('#2a5cf0'), lin('#17a05a')];
  for (const c of [0, Math.PI]) for (let k = 0; k < 5; k++) {
    const a = c + aD + (k + 0.75) / 5.5 * (Math.PI - 2 * aD), big = k % 2 === 0;
    g.at(Math.sin(a) * R, 11, Math.cos(a) * R, 0, a, 0);
    g.mat(1, 0.8).col(mulc(GOLD, 0.8)).blob([0, 0, 0.1], big ? [2.3, 2.8, 0.5] : [1.6, 1.6, 0.5], 12, 6);
    g.mat(4, 1).col(gems[(k + (c ? 1 : 0)) % 3]).blob([0, 0, 0.45], big ? [1.75, 2.25, 0.8] : [1.15, 1.15, 0.7], 12, 6);
    g.xf(null);
    g.mat(3, 0.85).col([0.93, 0.9, 0.84]);
    for (const da of [-0.11, 0, 0.11]) { const p = pt(R + 0.5, a + da, 17.4); g.blob(p, [0.55, 0.55, 0.55], 6, 4); }
  }
  // eight fleurs on the rim, a ruby in the one over each doorway
  for (let i = 0; i < 8; i++) {
    await pause();
    const a = i / 8 * TAU;
    g.at(Math.sin(a) * (R - 0.7), H, Math.cos(a) * (R - 0.7), 0, a, 0);
    g.mat(1, 0.8).col(GOLD).blob([0, 4.6, 0], [2.3, 5.4, 0.7], 10, 7, { f: (x, y) => 1 - 0.35 * Math.max(0, y) });
    for (const sg of [-1, 1]) g.blob([sg * 2.2, 2.6, 0], [1.5, 2.6, 0.6], 8, 5);
    g.mat(3, 0.85).col([0.93, 0.9, 0.84]).blob([0, 9.4, 0], [0.9, 0.9, 0.9], 8, 5);
    if (i % 4 === 0) g.mat(4, 1).col(gems[0]).blob([0, 4.2, 0.55], [1.0, 1.9, 0.5], 8, 5);
    g.xf(null);
  }
  for (let i = 0; i < 4; i++) {                                           // the arches
    await pause();
    const a = (i + 0.5) / 4 * TAU, pts = [], n = 14;
    for (let k = 0; k <= n; k++) { const t = k / n, r = (R - 0.8) * Math.cos(t * Math.PI / 2), y = H + 21.5 * Math.sin(t * Math.PI / 2); pts.push(pt(Math.max(r, 0.4), a, y)); }
    g.mat(1, 0.8).col(GOLD).tube(pts, (t) => 1.25 - 0.4 * t, 7);
    g.mat(3, 0.85).col([0.93, 0.9, 0.84]);
    for (let k = 1; k < n; k++) { const t = k / n, r = (R - 0.8) * Math.cos(t * Math.PI / 2) + 0.9 * Math.cos(t * Math.PI / 2), y = H + 21.5 * Math.sin(t * Math.PI / 2) + 0.9 * Math.sin(t * Math.PI / 2) + 0.4; g.blob(pt(r, a, y), [0.5, 0.5, 0.5], 5, 3); }
  }
  g.mat(1, 0.8).col(GOLD).blob([0, 43.2, 0], [3.3, 3.3, 3.3], 14, 9);
  g.mat(4, 1).col(gems[1]).blob([0, 43.2, 0], [3.45, 0.7, 3.45], 14, 4);
  g.mat(1, 0.8).col(GOLD).tube([[0, 46, 0], [0, 48, 0]], 0.5, 6).blob([0, 49, 0], [1.2, 1.2, 1.2], 8, 5);
  return { geometry: g.build(), R, H, hw, yc };
}

// a fern of the wood's floor: seven slender arching fronds (about 6 m across at scale 1) in two greens of a lit floor,
// the more upright ones the lighter
function fernGeometry() {
  const g = new Geo(); g.mat(6, 0).rig(0);
  for (let i = 0; i < 7; i++) { g.col(i % 2 ? [0.11, 0.36, 0.09] : [0.06, 0.25, 0.075], 0.85 + 0.3 * ((i * 3) % 4) / 3); petal(g, i / 7 * TAU + (i % 2) * 0.2, 0.15, 3.0 + 0.5 * (i % 3), 0.8, 0.95 - 0.12 * (i % 2) + 0.3 * (i % 2), -1.7 - 0.3 * (i % 2), 0.35, 3, 0); }
  return g.build();
}
// the fawn (facing +Z, 2.3 m at the shoulder at scale 1): the head is part 1 (turns and goes down to drink); each leg is
// a thigh (part 7, swings about its hip) and a lower leg with its joint and hoof (part 8, bends at the joint: the knee
// of a foreleg under the shoulder, the hock of a hind leg behind the hip); a coat of hair (material 8), fawn brown on
// the back, paler down the legs, a pale belly, rows of pale spots and dapples, large dark eyes, big ears
function fawnGeometry(moon) {
  const g = new Geo(), coat = lin(moon ? '#cfc4b4' : '#94602f'), pale = lin('#f1e4c8'), dark = [0.022, 0.016, 0.014];
  const under = (x, y) => 0.6 + 0.4 * clamp(y * 1.4 + 0.75, 0, 1);
  g.mat(8, 1).col(coat).rig(0);
  g.blob([0, 2.35, 0], [0.58, 0.62, 1.25], 12, 8, { shade: under });
  g.blob([0, 2.47, 0.92], [0.52, 0.64, 0.62], 10, 6, { shade: under }); g.blob([0, 2.45, -0.95], [0.56, 0.66, 0.64], 10, 6, { shade: under });
  g.mat(8, 0).tube([[0, 2.55, 1.1], [0, 3.05, 1.5], [0, 3.5, 1.72]], (t) => 0.4 - 0.13 * t, 8);
  g.col(pale).blob([0, 2.02, 0.1], [0.4, 0.3, 1.0], 8, 5).blob([0, 2.3, 1.42], [0.3, 0.4, 0.2], 8, 5).blob([0, 2.75, -1.55], [0.24, 0.28, 0.17], 6, 4);
  for (let i = 0; i < 22; i++) {                                           // the spots: two rows down each flank
    const side = i % 2 ? 1 : -1, row = (i >> 1) % 2, a = side * (0.5 + 0.55 * row + 0.08 * ((i * 7) % 3)), zz = -1.2 + 2.3 * (((i >> 2) + 0.5 * row) / 5.6), k = Math.sqrt(Math.max(0.1, 1 - (zz / 1.5) * (zz / 1.5)));
    g.blob([Math.sin(a) * 0.6 * k, 2.38 + Math.cos(a) * 0.64 * k, zz], [0.11, 0.05, 0.12], 5, 3);
  }
  g.rig(1, 3.3, 1.6, 0).col(coat);
  g.blob([0, 3.78, 1.95], [0.36, 0.37, 0.47], 10, 7, { shade: under }).blob([0, 3.64, 2.4], [0.21, 0.2, 0.3], 8, 5);
  g.col(pale).blob([0, 3.55, 2.36], [0.17, 0.12, 0.26], 6, 4);
  g.col(dark).mat(3, 0.6).blob([0, 3.68, 2.68], [0.1, 0.085, 0.07], 6, 4);
  for (const sx of [-1, 1]) {
    g.mat(8, 0).col(pale).blob([sx * 0.27, 3.9, 2.12], [0.12, 0.17, 0.19], 7, 5);                                         // a pale ring round each eye
    g.mat(3, 0.97).col(dark).blob([sx * 0.31, 3.9, 2.14], [0.1, 0.14, 0.155], 8, 6);                                       // large gentle eyes
    g.mat(8, 0).col(coat).at(sx * 0.3, 4.05, 1.72, -0.35, sx * 0.5, -sx * 0.75).blob([0, 0.42, 0], [0.17, 0.46, 0.07], 7, 5).xf(null);
    g.col(pale).at(sx * 0.3, 4.05, 1.76, -0.35, sx * 0.5, -sx * 0.75).blob([0, 0.4, 0], [0.11, 0.34, 0.04], 6, 4).xf(null);
  }
  let k = 0;
  for (const sz of [1, -1]) for (const sx of [-1, 1]) {
    const hz = sz * 0.92, ph = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5][k++], x = sx * 0.3;
    const jy = sz > 0 ? 1.18 : 1.3, jz = sz > 0 ? hz + 0.06 : hz - 0.3, fz = sz > 0 ? hz + 0.02 : hz - 0.12;
    g.mat(8, 0).rig(7, 2.05, hz, ph).col(coat, 0.9).tube([[x, 2.45, hz], [x, 1.9, hz + (sz > 0 ? 0.03 : 0.08)], [x * 0.97, jy, jz]], (t) => 0.3 - 0.17 * t, 6, { shade: 0.86 });
    g.rig(8, jy, jz, ph).blob([x * 0.97, jy, jz], [0.15, 0.17, 0.16], 6, 4);
    g.col(mixc(coat, pale, 0.35)).tube([[x * 0.97, jy, jz], [x * 0.95, 0.42, fz - 0.03 * sz], [x * 0.95, 0.24, fz]], (t) => 0.115 - 0.035 * t, 5, { shade: 0.9 });
    g.mat(3, 0.5).col(dark).tube([[x * 0.95, 0.27, fz], [x * 0.95, 0.0, fz + 0.07]], (t) => 0.09 + 0.045 * t, 5);
  }
  return g.build();
}
// The clouds' noise, in the form the kit's cloud field takes (tileable fbm: R from a coarse lattice, G from a finer
// one, B and A shifted copies of R), made here in short steps (a pause after every 64 rows). Given none, the kit makes
// the same texture inside one step of the build, which was this world's longest.
async function cloudNoise(rng, pause, size = 256) {
  const N = size * size, f = [new Float32Array(N), new Float32Array(N)];
  const ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
  for (let ch = 0; ch < 2; ch++) {
    const acc = f[ch];
    for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
      const lat = new Float32Array(per * per);
      for (let i = 0; i < lat.length; i++) lat[i] = rng();
      for (let x = 0; x < size; x++) { const fx = x * per / size, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
      for (let y = 0; y < size; y++) {
        const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
        for (let x = 0, p = y * size; x < size; x++, p++) {
          const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], k = wx[x], top = a + (b - a) * k;
          acc[p] += amp * (top + (c + (d - c) * k - top) * wy);
        }
        if ((y & 63) === 63) await pause();
      }
    }
  }
  const norm = 0.5 * (1 + 0.55 + 0.55 * 0.55 + 0.55 * 0.55 * 0.55), data = new Uint8Array(N * 4), m = size - 1;
  const px = (v) => clamp(((v / norm - 0.5) * 1.75 + 0.5) * 255, 0, 255);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m);
    data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s]); data[p * 4 + 3] = px(f[0][s2]);
    if (x === m && (y & 63) === 63) await pause();
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}
// a clump of reeds for the pond's rim (about 4 m tall at scale 1), two bulrushes among the blades
function reedGeometry() {
  const g = new Geo(); g.mat(6, 0).rig(0);
  for (let i = 0; i < 7; i++) { g.col([0.1, 0.3, 0.06], 0.8 + 0.4 * ((i * 3) % 4) / 3); petal(g, i / 7 * TAU, 0.1 + 0.08 * (i % 3), 3.2 + 0.5 * (i % 3), 0.34, 1.32 - 0.1 * (i % 2), -0.5, 0.3, 3, 0); }
  g.mat(3, 0.1);
  for (const [x, z, h] of [[0.25, 0.1, 4.2], [-0.2, -0.25, 3.6]]) { g.col([0.16, 0.3, 0.07]).tube([[x, 0, z], [x * 1.3, h, z * 1.3]], 0.05, 3); g.col([0.2, 0.1, 0.04]).tube([[x * 1.27, h - 0.9, z * 1.27], [x * 1.3, h - 0.1, z * 1.3]], 0.14, 5); }
  return g.build();
}

// small things of the fields
function bridgeGeometry() {
  const g = new Geo(), wood = lin('#a8793f'), dark = lin('#6e4a26'), L = 11, W = 2.6;
  g.mat(3, 0.2).col(wood).rig(0);
  for (let i = 0; i < 7; i++) { const t = (i + 0.5) / 7, z = (t - 0.5) * L, y = 0.5 + 0.9 * Math.sin(Math.PI * t); g.col(wood, 0.85 + 0.3 * ((i * 7) % 3) / 3).at(0, y, z, -0.26 * Math.cos(Math.PI * t), 0, 0).box([0, 0, 0], [W, 0.16, L / 7 * 0.94]).xf(null); }
  g.col(dark);
  for (const sx of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([sx * W * 0.5, 1.5 + 0.9 * Math.sin(Math.PI * t), (t - 0.5) * L]); }
    g.tube(pts, 0.09, 4);
    for (const t of [0.04, 0.5, 0.96]) g.box([sx * W * 0.5, 0.75 + 0.9 * Math.sin(Math.PI * t), (t - 0.5) * L], [0.16, 1.6, 0.16]);
  }
  return g.build();
}
// the walk's deck over a brook: planks as long as the mown walk is broad (17 m), laid from bank to bank over the
// brook's cut (19 m), cambered a foot, a kerb beam along either side: nothing on it stands higher than a knee
function deckGeometry() {
  const g = new Geo(), wood = lin('#a8793f'), dark = lin('#6e4a26'), L = 19, W = 17, N = 12;
  g.mat(3, 0.2).col(wood).rig(0);
  for (let i = 0; i < N; i++) { const t = (i + 0.5) / N, z = (t - 0.5) * L, y = 0.05 + 0.3 * Math.sin(Math.PI * t); g.col(wood, 0.85 + 0.3 * ((i * 7) % 3) / 3).at(0, y, z, -0.05 * Math.cos(Math.PI * t), 0, 0).box([0, 0, 0], [W, 0.16, L / N * 0.94]).xf(null); }
  g.col(dark); for (const sx of [-1, 1]) g.box([sx * (W * 0.5 + 0.15), 0.2, 0], [0.3, 0.5, L]);
  return g.build();
}
// a stook: bound sheaves leant together in two rows, ears up (near: four sheaves each with its band and its head
// of ears; far: one tent of them under a crown of ears; farthest, 250 m off and more, where a stook is a fleck of
// straw on the stubble: the tent alone, four faces to its point)
function stookGeometry(hi, farthest = false) {
  const g = new Geo(), straw = [0.43, 0.27, 0.05], ear = [0.5, 0.3, 0.045], band = [0.2, 0.12, 0.03]; g.mat(3, 0.1).rig(0);
  if (farthest) {
    for (let i = 0; i < 4; i++) { const a0 = i / 4 * TAU, a1 = (i + 1) / 4 * TAU; g.col(i % 2 ? ear : straw, 0.72 + 0.28 * Math.cos(a0 + 0.6)).poly([[Math.sin(a0) * 1.5, 0, Math.cos(a0) * 1.5], [Math.sin(a1) * 1.5, 0, Math.cos(a1) * 1.5], [0, 2.9, 0]]); }
    return g.build();
  }
  if (!hi) {
    for (let i = 0; i < 5; i++) {
      const a0 = i / 5 * TAU, a1 = (i + 1) / 5 * TAU, am = (a0 + a1) / 2, p = (a, r, y) => [Math.sin(a) * r, y, Math.cos(a) * r];
      g.col(straw, 0.72 + 0.28 * Math.cos(a0 + 0.6)).poly([p(a0, 1.5, 0), p(a1, 1.5, 0), p(a1, 0.55, 2.0), p(a0, 0.55, 2.0)]);
      g.col(ear).poly([p(a0, 0.55, 2.0), p(a1, 0.55, 2.0), p(am, 1.15, 2.9)]);
    }
    return g.build();
  }
  for (let i = 0; i < 4; i++) {
    const row = i < 2 ? -1 : 1, k = i % 2 ? 1 : -1, fx = row * 1.05, fz = k * 0.8, tx = row * 0.22, tz = k * 0.45;
    const at = (t) => [lerp(fx, tx, t), 2.5 * t, lerp(fz, tz, t)];
    const ring = (t, r, j) => { const q = at(t), a = j / 5 * TAU; return [q[0] + Math.sin(a) * r, q[1], q[2] + Math.cos(a) * r]; };
    const hoop = (t0, r0, t1, r1, k) => { for (let j = 0; j < 5; j++) g.poly([ring(t0, r0, j), ring(t0, r0, j + 1), ring(t1, r1, j + 1), ring(t1, r1, j)], k * (0.78 + 0.22 * Math.cos(j / 5 * TAU + 0.6))); };
    g.col(straw, 0.84 + 0.14 * i / 3); hoop(0, 0.56, 0.58, 0.3, 1);
    g.col(band); hoop(0.58, 0.33, 0.66, 0.33, 1);
    g.col(ear); hoop(0.66, 0.3, 0.9, 0.6, 1); hoop(0.9, 0.6, 1.14, 0.12, 0.85);
    const top = at(1.08);
    for (let j = 0; j < 3; j++) {                                           // ears standing out of the top, seen from either side
      const a = j / 3 * TAU + i, b = a + 0.5, A = [top[0] + Math.sin(a) * 0.3, top[1] - 0.15, top[2] + Math.cos(a) * 0.3], C = [top[0] + Math.sin(b) * 0.3, top[1] - 0.15, top[2] + Math.cos(b) * 0.3], T2 = [top[0] + Math.sin(a) * 0.75 + row * 0.2, top[1] + 0.7, top[2] + Math.cos(a) * 0.75];
      g.poly([A, C, T2]).poly([C, A, T2]);
    }
  }
  return g.build();
}
// an apple tree: a short trunk under a few leafy lumps with red apples on it (make 1), a single lump (make 0), or a
// single lump of fewer faces (make -1, for the trees far from the flight)
function appleTreeGeometry(rng, make) {
  const hi = make > 0;
  const g = new Geo(), leaf = [0.045, 0.16, 0.04];
  g.mat(3, 0.1).col(lin('#5a4030')).rig(0).tube([[0, -0.3, 0], [0.15, 1.5, 0], [0, 2.7, 0.1]], (t) => 0.34 - 0.1 * t, hi ? 5 : 3);
  const lump = (c, r, nu, nv) => g.mat(6, 0).col(leaf, rng.range(0.85, 1.2)).blob(c, r, nu, nv, { f: (x, y, z) => 1 + 0.16 * Math.sin(x * 5 + z * 3 + c[0]) * Math.sin(y * 4 + z * 4), shade: (x, y) => 0.5 + 0.5 * clamp(y + 0.7, 0, 1) });
  if (!hi) { lump([0, 4.3, 0], [3.0, 2.3, 3.0], make < 0 ? 5 : 6, make < 0 ? 3 : 4); return g.build(); }
  lump([0, 4.6, 0], [2.3, 2.0, 2.3], 7, 4);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + rng.range(-0.4, 0.4), r = rng.range(1.4, 1.9); lump([Math.sin(a) * r, 3.9 + rng.range(-0.3, 0.5), Math.cos(a) * r], [rng.range(1.5, 2.0), rng.range(1.3, 1.6), rng.range(1.5, 2.0)], 5, 3); }
  g.mat(3, 0.6).col(lin('#c2202b'));
  for (let i = 0; i < 8; i++) { const a = i * 2.4, b = (i % 3 - 1) * 0.45; g.blob([Math.sin(a) * 3.1 * Math.cos(b), 4.2 + Math.sin(b) * 2.0, Math.cos(a) * 3.1 * Math.cos(b)], [0.25, 0.25, 0.25], 3, 2); }
  return g.build();
}
// a sheep (facing +Z, 2.3 m long): the head is part 1 and goes down to graze (far: the plainer make)
function sheepGeometry(far = false) {
  const g = new Geo(), wool = [0.86, 0.83, 0.74], dark = [0.09, 0.08, 0.08];
  g.mat(3, 0.05).col(wool).rig(0).blob([0, 1.05, 0], [0.62, 0.58, 1.0], far ? 4 : 6, far ? 2 : 3, { shade: (x, y) => 0.62 + 0.38 * clamp(y + 0.8, 0, 1) });
  g.col(dark); for (const sz of [-1, 1]) g.box([0, 0.3, sz * 0.6], [0.7, 0.6, 0.14]);
  g.rig(1, 1.25, 0.8, 0).blob([0, 1.42, 1.18], [0.24, 0.26, 0.4], far ? 3 : 4, far ? 2 : 3);
  return g.build();
}

// a clump of reeds for a brook's bank (about 4 m tall at scale 1): five blades and one bulrush
function brookReedGeometry() {
  const g = new Geo(); g.mat(6, 0).rig(0);
  for (let i = 0; i < 5; i++) { g.col([0.1, 0.3, 0.06], 0.8 + 0.4 * ((i * 3) % 4) / 3); petal(g, i / 5 * TAU, 0.1 + 0.08 * (i % 3), 3.2 + 0.5 * (i % 3), 0.4, 1.3 - 0.1 * (i % 2), -0.5, 0.3, 3, 0); }
  g.mat(3, 0.1).col([0.2, 0.1, 0.04]).tube([[0.3, 3.2, 0.1], [0.33, 4.1, 0.12]], 0.15, 4);
  return g.build();
}
// a length of low clipped border: 12 m long along Z, 1.3 m broad, 1 m high, its foot sunk 0.3 m (16 triangles)
function borderGeometry() {
  const g = new Geo(), c = [0.03, 0.12, 0.035], P = [[-0.65, -0.3], [-0.6, 0.82], [-0.35, 1.0], [0.35, 1.0], [0.6, 0.82], [0.65, -0.3]];
  g.mat(6, 1).rig(0);
  for (let i = 0; i < 5; i++) { const a = P[i], b = P[i + 1]; g.col(c, i === 2 ? 1.3 : i === 1 || i === 3 ? 1.1 : 0.85).poly([[a[0], a[1], -6], [a[0], a[1], 6], [b[0], b[1], 6], [b[0], b[1], -6]]); }
  for (const z of [-6, 6]) { const q = P.map((p) => [p[0], p[1], z]); g.col(c, 0.8).poly(z > 0 ? q.reverse() : q); }
  return g.build();
}
// a cock: a round heap 2.6 m across and 2.15 m high (hay cock, corn rick, bee skep, root heap, mole hill, by its
// scale and tint), white, coloured by its instance (30 triangles)
function cockGeometry() {
  const g = new Geo(), n = 6, R = [[1.3, -0.2], [1.2, 0.9], [0.7, 1.7]], p = (a, r, y) => [Math.sin(a) * r, y, Math.cos(a) * r]; g.mat(7, 0.1).rig(0);
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, k = 0.75 + 0.25 * Math.cos(a0 + 0.6);
    for (let j = 0; j < 2; j++) g.col([1, 1, 1], k * (j ? 1.08 : 0.92)).poly([p(a0, R[j][0], R[j][1]), p(a1, R[j][0], R[j][1]), p(a1, R[j + 1][0], R[j + 1][1]), p(a0, R[j + 1][0], R[j + 1][1])]);
    g.col([1, 1, 1], k * 1.15).poly([p(a0, 0.7, 1.7), p(a1, 0.7, 1.7), [0, 2.15, 0]]);
  }
  return g.build();
}
// a stepping stone, about 2.6 m across at scale 1
function stoneGeometry() {
  const g = new Geo(); g.mat(3, 0.25).col(lin('#9a968a')).rig(0).blob([0, 0, 0], [1.3, 0.55, 1.1], 5, 2, { f: (x, y, z) => 1 + 0.12 * Math.sin(x * 4 + z * 3), shade: (x, y) => 0.6 + 0.4 * clamp(y + 0.6, 0, 1) });
  return g.build();
}
// a field gate of four bars between two posts, 7 m wide and 3 m high, across X (it stands in the gap of a hedge)
function gateGeometry() {
  const g = new Geo(), wood = lin('#b08a56'); g.mat(3, 0.15).col(wood).rig(0);
  for (const sx of [-1, 1]) g.box([0, 1.7, sx * 3.4], [0.5, 3.4, 0.5]);
  for (let i = 0; i < 4; i++) g.col(wood, 0.85 + 0.1 * i).box([0, 0.7 + i * 0.7, 0], [0.16, 0.22, 6.4]);
  return g.build();
}
// a Lombardy poplar, 26 m tall at scale 1: a short trunk under a tall lumpy spire of leaves (far: the same spire of
// five sides by three rows on a trunk of one length, for the poplars 120 m and more from the flight)
function poplarGeometry(far = false) {
  const g = new Geo(); g.mat(3, 0.1).col(lin('#5a4a3a')).rig(0).tube(far ? [[0, -0.5, 0], [0, 6, 0]] : [[0, -0.5, 0], [0, 3, 0], [0, 6, 0]], 0.7, 3);
  g.mat(6, 0).col([0.035, 0.14, 0.04]).blob([0, 15.5, 0], [2.9, 10.6, 2.9], far ? 5 : 6, far ? 3 : 4, { f: (x, y, z) => (1 - 0.3 * Math.max(0, y)) * (1 + 0.14 * Math.sin(x * 5 + y * 7) * Math.sin(z * 6)), shade: (x, y) => 0.55 + 0.45 * clamp(y + 0.6, 0, 1) });
  return g.build();
}
// a cottage, 9 m to the ridge: cream walls, a thatched roof, a chimney, a door and two windows (facing +Z)
function cottageGeometry() {
  const g = new Geo(), wall = lin('#eadfc4'), thatch = lin('#8a6a3a'), dark = [0.05, 0.05, 0.06]; g.rig(0);
  g.mat(3, 0.1).col(wall).box([0, 2.4, 0], [9, 4.8, 6.4]);
  g.col(thatch).poly([[-5, 4.5, 3.9], [5, 4.5, 3.9], [5, 9, 0], [-5, 9, 0]]).poly([[5, 4.5, -3.9], [-5, 4.5, -3.9], [-5, 9, 0], [5, 9, 0]], 0.75);
  g.col(wall, 0.9).poly([[4.5, 4.8, 3.2], [4.5, 4.8, -3.2], [4.5, 8.6, 0]]).poly([[-4.5, 4.8, -3.2], [-4.5, 4.8, 3.2], [-4.5, 8.6, 0]]);
  g.col(lin('#9a5a3a')).box([3, 8.6, 0.6], [1.2, 3, 1.2]);
  g.col(lin('#3a5a8a')).box([0, 1.4, 3.22], [1.5, 2.8, 0.1]);
  g.mat(3, 0.6).col(dark); for (const sx of [-1, 1]) g.box([sx * 2.8, 2.7, 3.22], [1.5, 1.4, 0.1]);
  return g.build();
}

// ---------------------------------------------------------------- the game
// A game played out by seeded moves from the opening position (red at ranks 0-1 by the hill, white at 6-7).
// The red queen is out running and one white pawn runs with her. `blocked(f, r)`: squares no piece may stand on
// or slide through (the wood, the flowers, the queen's lane, squares under the flight).
async function playGame(rng, blocked, o) {
  const B = Array.from({ length: 8 }, () => new Array(8).fill(null)), pieces = [];
  const back = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'], gone = rng.pick([1, 2, 5, 6]);
  if (o.mirror) back.reverse();
  const put = (k, w, f, r, court) => { const p = { k, w, f, r, court, home: [f, r], moves: [], busy: -1e9, id: pieces.length }; pieces.push(p); B[f][r] = p; };
  for (let f = 0; f < 8; f++) {
    if (back[f] !== 'queen') put(back[f], false, f, 0, back[f] === 'king'); put('pawn', false, f, 1, false);
    put(back[f], true, f, 7, back[f] === 'king' || back[f] === 'queen'); if (f !== gone) put('pawn', true, f, 6, f === 3 || f === 4);
  }
  const free = Array.from({ length: 8 }, () => new Array(8).fill(-1e9));
  const inB = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;
  const SL = { rook: [[1, 0], [-1, 0], [0, 1], [0, -1]], bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]] }; SL.queen = SL.rook.concat(SL.bishop);
  const KN = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const movesOf = (p, t, cap) => {
    const out = [], ok = (f, r) => inB(f, r) && !blocked(f, r) && free[f][r] <= t;
    const tryTo = (f, r, slide) => {
      if (!ok(f, r)) return false;
      const q = B[f][r];
      if (!q) { out.push({ f, r }); return true; }
      if (cap && q.w !== p.w && q.k !== 'king' && !q.court && p.k !== 'pawn') out.push({ f, r, cap: q });
      return false;
    };
    if (p.k === 'pawn') {
      const d = p.w ? -1 : 1, r1 = p.r + d;
      if (ok(p.f, r1) && !B[p.f][r1]) { out.push({ f: p.f, r: r1 }); if (p.r === p.home[1] && ok(p.f, r1 + d) && !B[p.f][r1 + d]) out.push({ f: p.f, r: r1 + d }); }
      if (cap) for (const df of [-1, 1]) { const q = inB(p.f + df, r1) ? B[p.f + df][r1] : null; if (q && q.w !== p.w && q.k !== 'king' && !q.court && !blocked(p.f + df, r1)) out.push({ f: p.f + df, r: r1, cap: q }); }
    } else if (p.k === 'knight') for (const [a, b] of KN) tryTo(p.f + a, p.r + b);
    else if (p.k === 'king') for (const [a, b] of SL.queen) tryTo(p.f + a, p.r + b);
    else for (const [a, b] of SL[p.k]) for (let i = 1; i < 8; i++) if (!tryTo(p.f + a * i, p.r + b * i)) break;
    return out;
  };
  const W = { pawn: 1.3, knight: 1.7, bishop: 1.5, rook: 0.7, queen: 0.8, king: 0.12 };
  // one ply for a side at time t: returns the move made, or null
  const ply = (white, t, cap, fits) => {
    const all = [];
    for (const p of pieces) {
      if (p.dead || p.w !== white || p.court || p.busy > t) continue;
      for (const m of movesOf(p, t, cap)) {
        if (fits && !fits(p, m)) continue;
        const adv = (p.w ? p.r - m.r : m.r - p.r);
        all.push({ p, m, w: W[p.k] * (1 + 0.25 * adv) * (m.cap ? 2 : 1) * (m.r > 0 && m.r < 7 ? 1 : 0.5) });
      }
    }
    if (!all.length) return null;
    let x = rng() * all.reduce((s, a) => s + a.w, 0), pick = all[0];
    for (const a of all) { x -= a.w; if (x <= 0) { pick = a; break; } }
    return pick;
  };
  const apply = (pick) => { const { p, m } = pick; if (m.cap) { m.cap.dead = true; } B[p.f][p.r] = null; B[m.f][m.r] = p; p.f = m.f; p.r = m.r; };
  for (let i = 0; i < o.plies; i++) { const pick = ply(i % 2 === 0, 0, rng.chance(0.3), null); if (pick) apply(pick); }
  for (const p of pieces) p.start = [p.f, p.r];
  if (o.stage) o.stage(pieces, B);
  // THE GAME IS IN PLAY WHEN WE COME: each side is to have o.movers pieces with a move that fits the board's rule
  // here. While a side has fewer, the opening is played on from the same stream, a ply a side (moves that fit, no
  // captures; nobody staged is moved), for o.on plies a side at the most.
  const movers = (w) => pieces.filter((p) => !p.dead && p.w === w && !p.court && movesOf(p, 0, false).some((m) => !o.fits || o.fits(p, m))).length;
  for (let i = 0; o.movers && i < 2 * (o.on || 0) && (movers(true) < o.movers || movers(false) < o.movers); i++) { const pick = ply(i % 2 === 0, 0, false, o.fits); if (pick) apply(pick); }
  for (const p of pieces) p.start = [p.f, p.r];
  const moversAtStart = [movers(true), movers(false)];
  // the game goes on: one move begins every `gap` seconds
  const DUR = { pawn: 9, knight: 6.5, king: 11 };
  for (let i = 0, t = o.first; i < o.more; i++, t += o.gap) {
    if (o.pause && i % 12 === 11) await o.pause();
    const pick = ply((i + o.plies) % 2 === 0, t, false, o.fits);
    if (!pick) continue;
    const { p, m } = pick, d = Math.max(Math.abs(m.f - p.f), Math.abs(m.r - p.r)), dur = DUR[p.k] || 6 + 3.2 * d;
    p.moves.push({ t0: t, t1: t + dur, from: [p.f, p.r], to: [m.f, m.r] });
    free[p.f][p.r] = t + dur; p.busy = t + dur + 4;
    apply(pick);
  }
  const alive = pieces.filter((p) => !p.dead); alive.movers = moversAtStart;
  return alive;
}

export default {
  id: 'country-in-squares',
  name: 'The Country Marked Out in Squares',
  category: 'books',
  placeKind: 'bizarre',
  book: 'Through the Looking-Glass',
  author: 'Lewis Carroll, 1832 to 1898',
  media: ['air', 'open'],
  weirdness: 0.75,
  async build(ctx) {
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene();
    // Every stream this world draws from is made here, once, from the world's seed and its own name, in one fixed list
    // before anything is built: no stream draws from another, so no thing's deal hangs on any other thing's.
    const S = {};
    for (const n of ['vary', 'sky', 'env', 'crops', 'game', 'far', 'queen', 'lamps', 'hedges', 'hedges.far', 'fields', 'trees', 'trees.o1', 'trees.b1', 'trees.o0', 'trees.b0',
      'trees.w1', 'trees.w0', 'trees.w2', 'trees.row', 'trees.wood', 'trees.willow', 'flowers', 'flowers.lily', 'flowers.rose', 'flowers.daisy', 'flowers.larkspur',
      'elephants', 'insects.glow', 'clouds', 'bf', 'drag', 'dragkit', 'swifts', 'crows', 'geese', 'sparks', 'down', 'puff', 'willowplace', 'breadflies', 'garden', 'sown',
      'rockflies', 'snaps', 'reeds', 'ranks', 'glints', 'ferns', 'phases', 'fawn', 'pacer', 'train', 'cloudshadow', 'gamephase',
      'board', 'sheep', 'woodtrees', 'giants', 'woodflowers', 'woodbirds', 'woodbf', 'clouds.f0', 'clouds.f1', 'clouds.f2', 'clouds.f3', 'clouds.f4', 'clouds.f5', 'clouds.f6', 'clouds.f7', 'clouds.f8', 'clouds.noise', 'clouds.g0', 'clouds.g1', 'clouds.g2', 'clouds.g3', 'clouds.g4', 'clouds.g5', 'clouds.g6', 'clouds.g7', 'clouds.g8', 'clouds.h0', 'clouds.h1', 'clouds.h2', 'clouds.h3', 'clouds.h4', 'clouds.h5', 'clouds.h6', 'clouds.h7', 'clouds.h8',
      'land', 'moon', 'flowers.lo', 'poplars', 'brookreeds', 'stones', 'cottages', 'farkinds', 'hem', 'hemblooms', 'ramps', 'canopy', 'dust', 'table', 'trees.far', 'orchard', 'dress']) S[n] = ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed));

    // ------------------------------------------------------------ what this visit is like
    const rv = S.vary, bd = S.board;
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    // What the visit draws of the board: how deep its ranks of squares are (so how far apart the brooks run), how far
    // before the first brook the hill stands, which side of the board's middle line the queen's file lies on, how deep
    // the wood is, and whether the low sun stands in the east (morning) or in the west (evening).
    const SZ = bd.range(86, 106), HZC = HRZ + bd.range(4, 30), MX = bd.chance(0.5) ? 1 : -1, WD = SZ * bd.range(1.35, 1.6), east = bd.chance(0.5);
    // THE WAY IN: the ride through the wood and the walk to the crown are one straight line down her file, WAY_IN = 10 m
    // to the board's middle side of the file's axis (the fawn's way keeps the axis' other side); the crown stands on it.
    const WAY_IN = 10, WAY_X = MX * (SQ / 2 - WAY_IN);
    const { hillAt, heightAt, landAt, GROUND_VERT, GROUND_FRAG, SHADOW_VERT, ZM, RG, RG0, rangeWarp, rangesAt } = makeGround(HZC, SZ, WAY_X, -7.8 * SZ, [0, 1, 2, 3, 4, 5].map(() => S.land.range(0, TAU)));
    // THE HOUR. The visitor's own setting is obeyed: night is night, daylight is the day's sun (23 to 27 degrees up,
    // from the side the board drew), dawn the low morning sun, the golden hours the low evening sun. When nothing is
    // asked the world's own choice stands: the low golden sun (9 to 13.5 degrees) of morning or evening, by the board.
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'day' ? 'day' : vary.hour === 'dawn' ? 'morning' : vary.hour === 'golden' ? 'evening' : east ? 'morning' : 'evening';
    const night = hour === 'night', day = hour === 'day', morning = hour === 'morning' || (day && east);
    // from one side of the board: every piece throws a shadow across the squares (two or three squares long under the low sun)
    const sunAz = (morning ? 1 : -1) * (104 + rv.range(0, 22)), sunLow = rv.range(9, 13.5), sunEl = day ? 23 + (sunLow - 9) / 4.5 * 4 : sunLow;
    // the night's moon: its height and its bearing are drawn by the visit (a stream of its own)
    const moonEl = S.moon.range(16, 30), moonAz = (S.moon.chance(0.5) ? 1 : -1) * S.moon.range(20, 70);

    // ------------------------------------------------------------ sky, light, haze
    await ctx.yield();
    const sky = makeSky(night ? {
      rng: S.sky, preset: 'night', zenith: '#06143e', mid: '#14357c', horizon: '#4169b0', ground: '#1c3458', stars: 0.8, milkyWay: 0.35, bake: true, renderer: ctx.renderer,
      bodyOverrides: { 0: { elevation: moonEl, azimuth: moonAz, size: 7.5, phase: 1, glow: 0.3, intensity: 1.15 } }, clouds: false, clouds2: { opacity: 0.2 },
      lightColor: '#b8cdff', lightIntensity: 1.6, ambientColor: '#4a6cc0', ambientIntensity: 2.3,
    } : day ? {
      rng: S.sky, preset: 'day', zenith: '#2f6fd0', mid: '#7fb4ea', horizon: '#dbe8f2', sunElevation: sunEl, sunAzimuth: sunAz, clouds: false, clouds2: { opacity: 0.25 },
    } : {
      rng: S.sky, preset: 'goldenHour', zenith: morning ? '#3a7ed8' : '#2f66c0', mid: morning ? '#86bcee' : '#7ba8e0', horizon: morning ? '#f4e2bc' : '#f6d29c', sunElevation: sunEl, sunAzimuth: sunAz, clouds: false, clouds2: { opacity: 0.28 },
    });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.3 });
    scene.add(rig.object);
    await ctx.yield();
    const ahead = sky.colorAt(new THREE.Vector3(0, 0.035, -1).normalize(), new THREE.Color());
    // far ranks of pieces stand in blue air
    const fogCol = night ? new THREE.Color(0.1, 0.18, 0.36) : ahead.clone().lerp(new THREE.Color(0.58, 0.7, 0.88), morning ? 0.55 : 0.45);
    const fogDen = night ? 0.00036 : 0.0005;
    scene.fog = new THREE.FogExp2(fogCol, fogDen);
    await ctx.yield();
    const env = await makeEnv(S.env, () => ctx.yield());
    env.uSun.value.copy(sky.lightDirection);
    env.uSunCol.value.setRGB(...(night ? [0.5, 0.66, 1.05] : day ? [3.0, 2.75, 2.3] : morning ? [3.4, 2.3, 1.2] : [3.4, 2.15, 1.05]));
    env.uSky.value.setRGB(...(night ? [0.1, 0.17, 0.36] : day ? [0.42, 0.56, 0.86] : morning ? [0.4, 0.52, 0.8] : [0.36, 0.45, 0.72]));
    env.uGnd.value.setRGB(...(night ? [0.05, 0.08, 0.14] : morning ? [0.31, 0.3, 0.16] : [0.34, 0.28, 0.15]));
    env.uFogCol.value.copy(fogCol); env.uFogDen.value = fogDen; env.uNight.value = night ? 1 : 0;
    const SUN = env.uSun.value;
    await ctx.yield();

    // ------------------------------------------------------------ the board of this visit, and the flight over it
    // Files are SQ wide and ranks SZ deep; B(k) is the k-th brook across the board, and the hill stands before brook 0.
    // The queen's file lies on the MX side of the board's middle line (x = 0); fx_ mirrors a file's number with it.
    const B = (k) => -k * SZ, sqXZ = (f, r) => [(f - 3.5) * SQ, -(r + 0.5) * SZ], fx_ = (f) => (MX > 0 ? f : 7 - f);
    const LF = fx_(4), OF = fx_(3), LX = MX * SQ / 2;
    // THE SQUARE OF GIANT FLOWERS is the square of the second rank on the outer side of her lane's file: the hand away
    // from her lane and from the board's middle once we have crossed her lane. (From the second brook on our
    // line swings across her lane toward that square; the square on the board's middle side falls behind us there.)
    const MF = fx_(5), MEAD = [MF, 2], LANE = [[LF, 1], [LF, 2], [LF, 3]], CROWN = [WAY_X, B(7.8)], CROWN_K = 1.25;
    // her lane: the axis of file LF, from a hem and a third past the first brook to a hem and a third short of the fourth
    const LANE_Z0 = B(1) - 1.3 * RUNNER.hem, LANE_Z1 = B(4) + 1.3 * RUNNER.hem, LANE_LEN = LANE_Z0 - LANE_Z1;
    // the wood: the queen's file from the fifth brook on, WD deep
    const WX0 = Math.min(0, MX * SQ), WX1 = Math.max(0, MX * SQ), WZ0 = B(5), WZ1 = B(5) - WD;
    const inWood = (x, z, m) => x > WX0 - m && x < WX1 + m && z < WZ0 + m && z > WZ1 - m;
    // THE STAND-OFF of the pieces staged beside the flight (the knights' meeting, the court's pairs) and of every move
    // of the game: STAND = 2 of the piece's OWN heights from the flight's line in plan.
    // THE GREAT THINGS PASSED CLOSE all stand by ONE RULE: NEAR = one of the thing's own heights of clear ground
    // between its foot's rim and our line (a chessman's foot, the queen's hem): a person standing under our line
    // sees the thing whole, top to foot, by lifting the eyes half a right angle. So stand the hill's own bishop, the
    // white rook by our low line, the red knight of the third rank, and the queen and her lane's two hands: OFF = her
    // hem's sweep and one height of hers (QH, the top of her crown) from her lane's axis.
    const STAND = 2, NEAR = 1, QH = RUNNER.crown, OFF = RUNNER.hem + QH;
    const NEAR_X = LX - MX * OFF, FAR_X = LX + MX * OFF, XW = WAY_X;
    // THE ROUTE, every knot a height over the ground at a place of the board.
    // Off the hill: at the height of the daisy's head (GARDEN_FLY: the lowest of the garden's four blooms, so every
    // bloom's head stands at or over the eye) from the back lip of the hill's table (zS, where the visit begins) level
    // across the table to its front lip, down the slope to the hill's foot, then one steady slope to the gate
    // between the two great pieces of the back rank.
    // From the gate to the third brook we fly LOW: at the top of the tallest hawthorn hedge and the lane's margin over
    // it (HEDGE_TOP + LANE_M), skimming the hedges, so that the pieces stand over us against the sky.
    // Beside the queen: abeam of her lane's head, down the near line (the board's middle side) to the second
    // brook; across her lane's axis, well down her open lane before her, at the middle of the square between the
    // second and the third brook; on her lane's far hand at the third brook, and on that same line, still low, past
    // her lane's end.
    // Then halfway up, halfway over, to the wood's ride: 10 m inside the file's axis, level with the fawn's head,
    // through the wood and on, on that same line, up the walk to the crown.
    const HEDGE_H = 5.6, HEDGE_K = 1.2, HEDGE_TOP = HEDGE_H * HEDGE_K, LANE_M = 4, LOW = HEDGE_TOP + LANE_M, GARDEN_FLY = FLOWER_H.daisy;
    const TREE_H = 18 * 1.45, FLY = 0.3 * TREE_H, AV = WZ1 - CROWN[1];
    const zS = HZC + HRZ * (1 - KT), over = (x, z, h) => [x, heightAt(x, z) + h, z];
    // (the fawn's measures and its way are told here, before the route, because the ride's height is told by them;
    // the way itself is described below)
    const FS = 2.4, FAWN_H = 4.5 * FS, FAWN_HEAD = 3.78 * FS, FAWN_OFF = 2 * FAWN_H, GLADE_R = TREE_H / 2;
    const FPH = S.fawn.range(0, TAU), FZ0 = WZ0 + 6, FLEN = FZ0 - (WZ1 - TREE_H), fawnX = (s) => XW + MX * FAWN_OFF + 2.2 * Math.sin(s * 0.045 + FPH);
    // IN THE WOOD WE FLY LEVEL WITH THE FAWN'S HEAD: at each of the ride's four knots our line is as high as the
    // fawn's head stands where its way runs beside that knot (FAWN_HEAD over the ground of its way there: the ground
    // under its way and under ours differ by some metres, and we are to look it in the face, neither up nor down at
    // it), and never under GARDEN_FLY over our own ground.
    const ride = (x, z, up = 0) => [x, Math.max(heightAt(x, z) + GARDEN_FLY, heightAt(fawnX(FZ0 - z), z) + FAWN_HEAD) + up, z];
    // THE WAY'S END: the last knot stands in the crown's doorway at the middle of the doorway's height (the door is
    // 9.5 m of jamb and an arch of 8.03 m over it, by the crown's own measure CROWN_K, sunk 0.3 m in its lawn); the
    // knot before it stands RUN_IN = 60 m and one step of the route's 2.5 m before it on the walk's line at that same
    // height, and the knot before that three steps further back, on the same line and height: the last 60 m are
    // flown straight and level. (The crown's lawn is level for 34 m about it and the land comes back in by 110 m:
    // over these 70 m the ground stays well under the door's middle; further out the land may stand higher than
    // the door, so the line is not held level there.) Between the wood's far edge and the level stretch one knot
    // more, halfway: at the mean of the two heights, and never under GARDEN_FLY over its own ground.
    const END_Y = heightAt(CROWN[0], CROWN[1]) - 0.3 + 0.5 * (9.5 + 8.03) * CROWN_K, RUN_IN = 62.5, LEVEL_IN = 7.5, Z_MID = 0.5 * (WZ1 + CROWN[1] + RUN_IN + LEVEL_IN);
    const KNOTS = [over(0, zS, GARDEN_FLY), over(0, HZC, GARDEN_FLY), over(0, HZC - HRZ * (1 - KT), GARDEN_FLY), over(0, HZC - HRZ * 2 / 3, GARDEN_FLY), over(0, HZC - HRZ, GARDEN_FLY), over(0, B(0.5), LOW),
      over(NEAR_X, LANE_Z0, LOW), over(NEAR_X, B(2), LOW), over(LX, B(2.5), LOW), over(FAR_X, B(3), LOW),
      over(FAR_X, LANE_Z1, LOW), over((FAR_X + XW) / 2, B(4.5), 0.5 * (LOW + FLY)),
      ride(XW, WZ0), ride(XW, WZ0 - WD / 3), ride(XW, WZ0 - WD * 2 / 3), ride(XW, WZ1),
      [XW, Math.max(0.5 * (ride(XW, WZ1)[1] + END_Y), heightAt(XW, Z_MID) + GARDEN_FLY), Z_MID], [XW, END_Y, CROWN[1] + RUN_IN + LEVEL_IN], [XW, END_Y, CROWN[1] + RUN_IN], [XW, END_Y, CROWN[1]]];
    const path = makePath(KNOTS);
    const L = path.length;
    // The route as it is flown, a point every 2.5 m, and the ground covered up to each: every clearance in this world
    // is tested against these points, and every place along the flight is read from them (the metre at which the
    // route crosses a line across the board, found between two points: the kit's nearestXZ snaps to 1/320 of the route).
    const route = [], routeV = new THREE.Vector3(), GR = [0];
    for (let d = 0; d <= L + 2.5; d += 2.5) { path.posAtDist(Math.min(d, L), routeV); route.push(routeV.x, routeV.y, routeV.z); }
    const NR = route.length / 3;
    for (let i = 1; i < NR; i++) GR.push(GR[i - 1] + Math.hypot(route[i * 3] - route[i * 3 - 3], route[i * 3 + 2] - route[i * 3 - 1]));
    // metres flown when the route crosses the line z (it runs down the board all the way)
    const mAtZ = (z) => { for (let i = 1; i < NR; i++) if (route[i * 3 + 2] <= z) { const z0 = route[i * 3 - 1], z1 = route[i * 3 + 2]; return clamp((i - 1 + (z0 - z) / Math.max(z0 - z1, 1e-6)) * 2.5, 0, L); } return L; };
    // metres of ground covered after d metres of flight; the route's x where it crosses the line z
    const groundAt = (d) => { const f = clamp(d / 2.5, 0, NR - 1), i = Math.min(NR - 2, Math.floor(f)); return lerp(GR[i], GR[i + 1], f - i); };
    const xAtZ = (z) => { const f = clamp(mAtZ(z) / 2.5, 0, NR - 1), i = Math.min(NR - 2, Math.floor(f)); return lerp(route[i * 3], route[i * 3 + 3], f - i); };
    // (LINE_M: the margin kept from our line, 2.5 m and what the 2.5 m between the line's points can hide, 0.3 m)
    const LINE_M = 2.8;
    // would a thing at (x, z) reaching from y0 to y1 over the ground it stands on, r wide, come within `margin` of the flight?
    const inLane = (x, z, y0, y1, r, margin) => {
      const m2 = (r + margin) * (r + margin), g = heightAt(x, z);
      for (let i = 0; i < route.length; i += 3) { const dx = route[i] - x, dz = route[i + 2] - z; if (dx * dx + dz * dz < m2 && route[i + 1] - g > y0 - margin && route[i + 1] - g < y1 + margin) return true; }
      return false;
    };
    // the least distance of a point of the world from the flight as flown (from the stretches between its points)
    const lineDist = (x, y, z) => {
      let m = 1e18;
      for (let i = 0; i + 3 < route.length; i += 3) {
        const ax = route[i], ay = route[i + 1], az = route[i + 2], bx = route[i + 3] - ax, by = route[i + 4] - ay, bz = route[i + 5] - az;
        const t = clamp(((x - ax) * bx + (y - ay) * by + (z - az) * bz) / Math.max(bx * bx + by * by + bz * bz, 1e-9), 0, 1), dx = x - ax - bx * t, dy = y - ay - by * t, dz = z - az - bz * t;
        m = Math.min(m, dx * dx + dy * dy + dz * dz);
      }
      return Math.sqrt(m);
    };
    // the same in plan only (how far a place of the board lies from our line on the map)
    const planDist = (x, z) => {
      let m = 1e18;
      for (let i = 0; i + 3 < route.length; i += 3) {
        const ax = route[i], az = route[i + 2], bx = route[i + 3] - ax, bz = route[i + 5] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / Math.max(bx * bx + bz * bz, 1e-9), 0, 1), dx = x - ax - bx * t, dz = z - az - bz * t;
        m = Math.min(m, dx * dx + dz * dz);
      }
      return Math.sqrt(m);
    };
    const besideLine = (z, side, dist) => { const i = clamp(Math.round(mAtZ(z) / 2.5), 1, NR - 2), tx = route[i * 3 + 3] - route[i * 3 - 3], tz = route[i * 3 + 5] - route[i * 3 - 1], tl = Math.hypot(tx, tz), sg = Math.sign(-tz * side) || 1; return [route[i * 3] - tz / tl * sg * dist, route[i * 3 + 2] + tx / tl * sg * dist]; };
    const win = (a, b, soft, d) => smoothstep(a - soft, a + soft, d) * (1 - smoothstep(b - soft, b + soft, d));
    let D_FOOT = 0;                                                                // where the flight leaves the garden's hill
    for (let i = 0; i < route.length; i += 3) if (hillAt(route[i], route[i + 2]) > 1.5) D_FOOT = i / 3 * 2.5;
    // her lane lies open before her: nothing of the fields stands in the strip she, her pawn and the pacing hedge run at
    const inStrip = (x, z) => Math.abs(x - LX) < 36 && z < LANE_Z0 + 40 && z > LANE_Z1 - 16;
    // places along the flight, in metres flown: the gate, the brooks of her lane, her lane's head and end, where we cross her axis, the knights' meeting, the wood's two edges
    const D_MID = mAtZ(HZC), D_GATE = mAtZ(B(0.5)), D_B1 = mAtZ(B(1)), D_HEAD = mAtZ(LANE_Z0), D_B2 = mAtZ(B(2)), D_CROSS = mAtZ(B(2.5)), D_B3 = mAtZ(B(3)), D_END = mAtZ(LANE_Z1), D_B4 = mAtZ(B(4)), D_KN = mAtZ(B(4.6)), D_WIN = mAtZ(WZ0), D_WOUT = mAtZ(WZ1);
    await ctx.yield();
    // The fawn's own way, in world coordinates: beside the wood's ride, FAWN_OFF = 2 of the fawn's own heights (to its
    // ear tips; the fawn is FS = 2.4 times life: 10.8 m, its head 9.1 m up) from the route's line along the whole way
    // (the stand-off rule, in its own measure), winding a little: from its drinking place 6 m short of the fifth
    // brook to one tree's height past the wood's far edge. (The fawn's round, told at the fawn below, keeps to the
    // way's first part: from the brook to five bounds beyond the glade.)
    // THE GLADE lies on the fawn's way at the middle of the wood's depth: a round opening in the wood's roof, one
    // tree's height across (GLADE_R = half of TREE_H), and open to the sun: no crown stands in the sun's way to its floor.
    const fawnTrack = [];
    for (let s = 0; s <= FLEN; s += 2.5) fawnTrack.push([fawnX(s), FZ0 - s]);
    const GLADE_S = FZ0 - (WZ0 + WZ1) / 2, GLADE = [fawnX(GLADE_S), FZ0 - GLADE_S];
    // where the staged pieces stand off their squares' middles (x, z, radius): field things keep clear of them
    const stagedAt = [], nearStaged = (x, z, m) => stagedAt.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + m);

    // ------------------------------------------------------------ which crop each square holds (64 x 64 squares, wrapping)
    const mapData = new Uint8Array(64 * 64 * 4), cr = S.crops;
    const paleDeck = [], darkDeck = [];
    const crop = (pale) => { const d = pale ? paleDeck : darkDeck; if (!d.length) d.push(...cr.shuffle(pale ? [0, 0, 1, 2, 3, 0, 2] : [4, 4, 5, 6, 7, 5, 7])); return d.pop(); };
    const cropAt = (cx, cz) => mapData[(((cz % 64) + 64) % 64 * 64 + ((cx % 64) + 64) % 64) * 4];
    for (let cz = -20; cz < 44; cz++) for (let cx = -32; cx < 32; cx++) {
      const i = (((cz % 64) + 64) % 64 * 64 + ((cx % 64) + 64) % 64) * 4, pale = (((cx + cz) % 2) + 2) % 2 === 1;
      mapData[i] = crop(pale) * 32 + 16; mapData[i + 1] = Math.floor(cr() * 256); mapData[i + 2] = 0; mapData[i + 3] = 255;
      // (the fourth number holds which hedge lengths stand: all of them, far off; no draw is spent on it)
      if (cx === MEAD[0] - 4 && cz === MEAD[1]) { mapData[i + 2] = 255; mapData[i] = 5 * 32 + 16; }
    }
    const tMap = new THREE.DataTexture(mapData, 64, 64, THREE.RGBAFormat, THREE.UnsignedByteType);
    tMap.wrapS = tMap.wrapT = THREE.RepeatWrapping; tMap.magFilter = tMap.minFilter = THREE.NearestFilter; tMap.needsUpdate = true;
    const cropId = (cx, cz) => Math.floor(cropAt(cx, cz) / 32);

    // ------------------------------------------------------------ the ground
    // the wood's roof as its floor sees it: one number to every 2 m (filled once the wood's trees stand; all light till then)
    const CAN_W = Math.round(SQ / 2), CAN_H = Math.ceil(WD / 2), canData = new Uint8Array(CAN_W * CAN_H * 4).fill(255);
    const tCanopy = new THREE.DataTexture(canData, CAN_W, CAN_H, THREE.RGBAFormat, THREE.UnsignedByteType);
    tCanopy.magFilter = tCanopy.minFilter = THREE.LinearFilter; tCanopy.needsUpdate = true;
    const gU = { ...env, tMap: { value: tMap }, uCloud: { value: new THREE.Vector3(0, 0, night ? 0.2 : 0.42) }, uWood: { value: new THREE.Vector4(WX0, WX1, WZ1, WZ0) }, uWalk: { value: new THREE.Vector2(XW, WZ1 - 6) }, uPond: { value: new THREE.Vector3(0, 0, 0) }, tCanopy: { value: tCanopy } };
    {
      // fine under the hill (f0..f1), 24 m steps over the board (m0..m1), then wider and wider to the horizon
      const axis = (lo, m0, f0, f1, m1, hi) => {
        const out = [];
        for (let v = f0; v <= f1 + 1e-6; v += 8) out.push(v);
        for (let v = f1 + 24; v < m1; v += 24) out.push(v);
        for (let s = 32, v = out[out.length - 1] + s; v < hi; s *= 1.3, v += s) out.push(v);
        out.push(hi);
        for (let v = f0 - 24; v > m0; v -= 24) out.unshift(v);
        for (let s = 32, v = out[0] - s; v > lo; s *= 1.3, v -= s) out.unshift(v);
        out.unshift(lo);
        return out;
      };
      // the plain is one square grid, G either way from the board's middle (to 20 m beyond the back of the hill); the
      // ranges round it are an apron laid out along their own lines (below)
      const G = RG0 - 130, ZHI = ZM + G, fz1 = -8 + 8 * Math.floor((ZHI + 7.9) / 8);
      const xs = axis(-G, -430, -160, 160, 430, G), zs0 = axis(ZM - G, ZM - G, -8, fz1, ZHI, ZHI), cuts = [];
      for (let k = 0; k <= 9; k++) for (const o of [-BROOK - 5, -BROOK, BROOK, BROOK + 5]) cuts.push(-k * SZ + o);
      const zs = zs0.filter((v) => !cuts.some((c) => Math.abs(c - v) < 3)).concat(cuts).sort((p, q) => p - q), nx = xs.length, nz = zs.length;
      const grid = new Float32Array(nx * nz * 3);
      for (let j = 0, k = 0; j < nz; j++) { for (let i = 0; i < nx; i++, k += 3) { grid[k] = xs[i]; grid[k + 1] = heightAt(xs[i], zs[j]); grid[k + 2] = zs[j]; } if (j % 12 === 0) await ctx.yield(); }
      // THE DRAWN GROUND LIES UNDER THE THINGS' FEET. Every vertex of the grid stands on the rule the things stand by
      // (heightAt), but a flat triangle 8 m across (24 m down the board) cuts the land's bends: the hill's lip, the
      // cut behind the hill, a brook's bank, the roll of the land itself; a bloom stood by the rule would hang in
      // the air over such a triangle, or a stook sink into it. So wherever a cell of the grid comes within FINE_R
      // of the flight's line on the map (the 40 m within which a foot can be told from the turf) and its two
      // triangles leave the rule by more than FINE_TOL at any point of a lattice of sixteen steps either way, the
      // cell is laid as a finer lattice of its own, kx by kz (each of 1, 2, 4, 8: the fewest triangles that keep
      // within FINE_TOL at those points), every vertex on the rule, each small cell cut along the diagonal that
      // lies nearer the land at its middle (a bend that crosses it aslant is followed, not cut). Cells that share
      // an edge share its vertices: kx is one number down a column of fine cells that touch, kz one along a row
      // (a cell made finer by its neighbours is tried again as it will be laid, and made finer still if that
      // lattice leaves the rule), and a plain cell beside a fine one is laid as a fan about its middle that takes
      // up the fine edge's vertices. A cell near the line that keeps its two triangles is cut along its better
      // diagonal too (`aslant`). So the ground has no seam, and the far ground keeps its two triangles a cell.
      const FINE_R = 42, FINE_TOL = 0.12, FN = 16, FW = FN + 1, FK = [1, 2, 4, 8], ncx = nx - 1, ncz = nz - 1, fineK = new Map(), aslant = new Set();
      {
        const smpOf = new Map(); let smp = new Float64Array(FW * FW);
        // how far the lattice kx by kz of a cell, laid as it will be, leaves the cell's sampled heights (every
        // `step`-th point looked at)
        const errK = (kx, kz, step = 1) => {
          const sx = FN / kx, sz = FN / kz; let w = 0;
          for (let b = 0; b < kz; b++) for (let a = 0; a < kx; a++) {
            const p0 = a * sx, q0 = b * sz, A = smp[q0 * FW + p0], Bh = smp[q0 * FW + p0 + sx], Ch = smp[(q0 + sz) * FW + p0], D = smp[(q0 + sz) * FW + p0 + sx], hm = smp[(q0 + sz / 2) * FW + p0 + sx / 2];
            const alt = Math.abs((Bh + Ch) / 2 - hm) > Math.abs((A + D) / 2 - hm);
            for (let q = 0; q <= sz; q += step) for (let p = 0; p <= sx; p += step) {
              const u = p / sx, v = q / sz, h = alt ? (v >= u ? A + u * (D - Ch) + v * (Ch - A) : A + u * (Bh - A) + v * (D - Bh)) : (u + v <= 1 ? A + u * (Bh - A) + v * (Ch - A) : D + (1 - u) * (Ch - D) + (1 - v) * (Bh - D));
              w = Math.max(w, Math.abs(smp[(q0 + q) * FW + p0 + p] - h));
            }
          }
          return w;
        };
        // the fewest triangles, no coarser than kx by kz, that keep within FINE_TOL (the finest lattice if none does)
        const least = (kx0, kz0) => { let best = null; for (const kx of FK) for (const kz of FK) if (kx >= kx0 && kz >= kz0 && (!best || kx * kz < best[0] * best[1]) && errK(kx, kz) <= FINE_TOL) best = [kx, kz]; return best || [FK[FK.length - 1], FK[FK.length - 1]]; };
        let rx0 = 1e9, rx1 = -1e9, rz0 = 1e9, rz1 = -1e9, seen = 0;
        for (let k = 0; k < route.length; k += 3) { rx0 = Math.min(rx0, route[k]); rx1 = Math.max(rx1, route[k]); rz0 = Math.min(rz0, route[k + 2]); rz1 = Math.max(rz1, route[k + 2]); }
        for (let j = 0; j < ncz; j++) for (let i = 0; i < ncx; i++) {
          const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1], half = Math.hypot(x1 - x0, z1 - z0) / 2;
          if (x1 < rx0 - FINE_R || x0 > rx1 + FINE_R || z1 < rz0 - FINE_R || z0 > rz1 + FINE_R || planDist((x0 + x1) / 2, (z0 + z1) / 2) > FINE_R + half) continue;
          // (a first look at every fourth point; the whole lattice only where that shows a bend)
          for (let q = 0; q <= FN; q += 4) for (let p = 0; p <= FN; p += 4) smp[q * FW + p] = heightAt(x0 + (x1 - x0) * p / FN, z0 + (z1 - z0) * q / FN);
          if (++seen % 60 === 0) await ctx.yield();
          const hm = smp[FN / 2 * FW + FN / 2], alt = Math.abs((smp[FN] + smp[FN * FW]) / 2 - hm) > Math.abs((smp[0] + smp[FN * FW + FN]) / 2 - hm);
          if (errK(1, 1, 4) <= FINE_TOL / 2) { if (alt) aslant.add(j * ncx + i); continue; }
          for (let q = 0; q <= FN; q++) for (let p = 0; p <= FN; p++) if ((p | q) & 3) smp[q * FW + p] = heightAt(x0 + (x1 - x0) * p / FN, z0 + (z1 - z0) * q / FN);
          const best = least(1, 1);
          if (best[0] * best[1] > 1) { fineK.set(j * ncx + i, best); smpOf.set(j * ncx + i, smp); smp = new Float64Array(FW * FW); } else if (alt) aslant.add(j * ncx + i);
        }
        await ctx.yield();
        for (let pass = 0, changed = true; changed && pass < 8; pass++) {
          // one kx down a column of fine cells that touch, one kz along a row of them (the finest any of them asks)
          for (let i = 0; i < ncx; i++) for (let j = 0; j < ncz; j++) { if (!fineK.has(j * ncx + i)) continue; let j1 = j, m = 1; for (; j1 < ncz && fineK.has(j1 * ncx + i); j1++) m = Math.max(m, fineK.get(j1 * ncx + i)[0]); for (let q = j; q < j1; q++) fineK.get(q * ncx + i)[0] = m; j = j1; }
          for (let j = 0; j < ncz; j++) for (let i = 0; i < ncx; i++) { if (!fineK.has(j * ncx + i)) continue; let i1 = i, m = 1; for (; i1 < ncx && fineK.has(j * ncx + i1); i1++) m = Math.max(m, fineK.get(j * ncx + i1)[1]); for (let q = i; q < i1; q++) fineK.get(j * ncx + q)[1] = m; i = i1; }
          changed = false;
          for (const [cell, f] of fineK) { smp = smpOf.get(cell); if (errK(f[0], f[1]) <= FINE_TOL) continue; const g = least(f[0], f[1]); if (g[0] !== f[0] || g[1] !== f[1]) { f[0] = g[0]; f[1] = g[1]; changed = true; } }
          await ctx.yield();
        }
      }
      await ctx.yield();
      const more = [], moreAt = new Map(), tri = [];
      // a vertex added to the grid's own, on the rule; one to a place, whichever cell asks for it
      const vAt = (x, z) => { const key = x + ',' + z; let v = moreAt.get(key); if (v === undefined) { v = nx * nz + more.length / 3; more.push(x, heightAt(x, z), z); moreAt.set(key, v); } return v; };
      // the p-th of n points along a cell's edge in x (at the row jz of the grid), and the same along an edge in z:
      // the edge's ends are the grid's own vertices
      const onX = (i, jz, p, n) => p === 0 ? jz * nx + i : p === n ? jz * nx + i + 1 : vAt(xs[i] + (xs[i + 1] - xs[i]) * p / n, zs[jz]);
      const onZ = (ix, j, q, n) => q === 0 ? j * nx + ix : q === n ? (j + 1) * nx + ix : vAt(xs[ix], zs[j] + (zs[j + 1] - zs[j]) * q / n);
      const yOf = (v) => v < nx * nz ? grid[v * 3 + 1] : more[(v - nx * nz) * 3 + 1];
      const kOf = (i, j, w) => { const f = i >= 0 && j >= 0 && i < ncx && j < ncz ? fineK.get(j * ncx + i) : null; return f ? f[w] : 1; };
      for (let j = 0; j < ncz; j++) {
        for (let i = 0; i < ncx; i++) {
          const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1, f = fineK.get(j * ncx + i);
          if (f) {
            const [kx, kz] = f, row = (q) => { const o = []; for (let p = 0; p <= kx; p++) o.push(q === 0 ? onX(i, j, p, kx) : q === kz ? onX(i, j + 1, p, kx) : p === 0 ? onZ(i, j, q, kz) : p === kx ? onZ(i + 1, j, q, kz) : vAt(xs[i] + (xs[i + 1] - xs[i]) * p / kx, zs[j] + (zs[j + 1] - zs[j]) * q / kz)); return o; };
            // (each small cell is cut along the diagonal that lies nearer the land at its middle: a bend that crosses
            // the cell aslant is followed, not cut)
            let lo = row(0);
            for (let q = 1; q <= kz; q++) {
              const hi = row(q), zm = zs[j] + (zs[j + 1] - zs[j]) * (q - 0.5) / kz;
              for (let p = 0; p < kx; p++) {
                const A = lo[p], Bv = lo[p + 1], Cv = hi[p], D = hi[p + 1], hm = heightAt(xs[i] + (xs[i + 1] - xs[i]) * (p + 0.5) / kx, zm);
                if (Math.abs((yOf(Bv) + yOf(Cv)) / 2 - hm) <= Math.abs((yOf(A) + yOf(D)) / 2 - hm)) tri.push(A, Cv, Bv, Bv, Cv, D); else tri.push(A, Cv, D, A, D, Bv);
              }
              lo = hi;
            }
            continue;
          }
          const nb = kOf(i, j - 1, 0), nt = kOf(i, j + 1, 0), nl = kOf(i - 1, j, 1), nr = kOf(i + 1, j, 1);
          if (nb + nt + nl + nr === 4) { if (aslant.has(j * ncx + i)) tri.push(a, c, d, a, d, b); else tri.push(a, c, b, b, c, d); continue; }
          // a plain cell beside a fine one: a fan about its middle, round by its near edge, its right, its far edge, its left
          const ring = [], mid = vAt((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2);
          for (let p = 0; p < nb; p++) ring.push(onX(i, j, p, nb));
          for (let q = 0; q < nr; q++) ring.push(onZ(i + 1, j, q, nr));
          for (let p = nt; p > 0; p--) ring.push(onX(i, j + 1, p, nt));
          for (let q = nl; q > 0; q--) ring.push(onZ(i, j, q, nl));
          for (let m = 0; m < ring.length; m++) tri.push(ring[m], mid, ring[(m + 1) % ring.length]);
        }
        if (j % 24 === 0) await ctx.yield();
      }
      const pos = new Float32Array(grid.length + more.length), idx = new Uint32Array(tri); pos.set(grid); pos.set(more, grid.length);
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gg.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      {
        // the ground's normals, each face's own summed at its corners (as three.js reckons them), a slice at a time
        const nrm = new Float32Array(pos.length);
        for (let k = 0; k < idx.length; k += 3) {
          const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
          const ux = pos[c] - pos[b], uy = pos[c + 1] - pos[b + 1], uz = pos[c + 2] - pos[b + 2], vx = pos[a] - pos[b], vy = pos[a + 1] - pos[b + 1], vz = pos[a + 2] - pos[b + 2];
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
          if (k % 18000 === 0) await ctx.yield();
        }
        for (let k = 0; k < nrm.length; k += 3) { const l = Math.hypot(nrm[k], nrm[k + 1], nrm[k + 2]) || 1; nrm[k] /= l; nrm[k + 1] /= l; nrm[k + 2] /= l; }
        gg.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      }
      await ctx.yield();
      const ground = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: gU, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG + 'void main(){ gl_FragColor = vec4(csGround(vW, vN, 1.), 1.); }' }));
      ground.frustumCulled = false; ground.renderOrder = -2; scene.add(ground);
      // the apron: from the square's edge out over the hills, a ring of 192 spokes (fifteen to a head of the near
      // hills); its rows lie along each range's own foot, slope (three rows), crest and back
      const NS = 192, rows = [null];
      RG.forEach((g, i) => { for (const q of [0, 0.25, 0.5, 0.75, 1]) rows.push([i, g.f + (g.c - g.f) * q]); rows.push([i, g.b]); });
      const ap = new Float32Array(NS * rows.length * 3), ai = new Uint32Array(NS * (rows.length - 1) * 6);
      for (let j = 0, k = 0; j < NS; j++) {
        const th = j / NS * TAU, sx = Math.sin(th), sz = -Math.cos(th), edge = G / Math.max(Math.abs(sx), Math.abs(sz));
        for (let i = 0; i < rows.length; i++, k += 3) { const r = i ? Math.max(edge, rows[i][1] + rangeWarp(rows[i][0], th)) : edge, x = sx * r, z = ZM + sz * r; ap[k] = x; ap[k + 1] = heightAt(x, z) - (i ? 0 : 1.5); ap[k + 2] = z; }
        if (j % 24 === 0) await ctx.yield();
      }
      for (let j = 0, k = 0; j < NS; j++) for (let i = 0; i < rows.length - 1; i++, k += 6) { const a = j * rows.length + i, b = a + 1, c = ((j + 1) % NS) * rows.length + i, d = c + 1; ai[k] = a; ai[k + 1] = b; ai[k + 2] = c; ai[k + 3] = c; ai[k + 4] = b; ai[k + 5] = d; }
      await ctx.yield();
      const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(ap, 3)); ag.setIndex(new THREE.BufferAttribute(ai, 1));
      ag.computeVertexNormals(); await ctx.yield();
      const apron = new THREE.Mesh(ag, ground.material); apron.name = 'ranges'; apron.frustumCulled = false; apron.renderOrder = -2; scene.add(apron);
    }
    // the shade is laid over the ground it falls on after the ground is drawn, and of two that overlap the darker stands
    // (at its outline it is given a little brighter than the ground, so the outline itself never shows)
    const shadowFrag = GROUND_FRAG + 'varying float vA; void main(){ gl_FragColor = vec4(csGround(vW, vN, 1. - vA) * (1. + .12 * (1. - vA) * (1. - vA)), 1.); }';
    const shadowOpts = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6, blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor };
    const shadowMat = new THREE.ShaderMaterial({ uniforms: gU, vertexShader: SHADOW_VERT(true), fragmentShader: shadowFrag, ...shadowOpts });
    const cast = (mesh) => { mesh.renderOrder = -1; scene.add(mesh); return mesh; };
    await ctx.yield();

    // ------------------------------------------------------------ the game: a seeded position, and the moves that follow
    const blockedSq = new Set([MEAD, ...LANE, [LF, 5], [LF, 6], [OF, 4]].map((s) => s[0] + ',' + s[1]));
    for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) { const q = sqXZ(f, r); if (path.nearestXZ(q[0], q[1]).dist < 34) blockedSq.add(f + ',' + r); }
    const fitMemo = new Map();
    // a move fits when its whole line stays STAND of the piece's own heights clear of the flight's line over the ground (tested at every 5 m of it)
    const fits = (p, m) => {                                             // no piece crosses the flight
      const key = p.f + p.r * 8 + m.f * 64 + m.r * 512 + p.k, lim = STAND * PIECES[p.k].h;
      let ok = fitMemo.get(key);
      if (ok === undefined) {
        const a = sqXZ(p.f, p.r), b = sqXZ(m.f, m.r), ex = b[0] - a[0], ez = b[1] - a[1], e2 = Math.max(1e-6, ex * ex + ez * ez); ok = true;
        for (let i = 0; i < route.length && ok; i += 6) {
          const s = clamp(((route[i] - a[0]) * ex + (route[i + 2] - a[1]) * ez) / e2, 0, 1), dx = a[0] + ex * s - route[i], dz = a[1] + ez * s - route[i + 2];
          if (dx * dx + dz * dz < lim * lim) ok = false;
        }
        // nor does it pass through a staged piece that stands off its square (2 m between their feet)
        for (const q of stagedAt) { const s = clamp(((q[0] - a[0]) * ex + (q[1] - a[1]) * ez) / e2, 0, 1); if (Math.hypot(a[0] + ex * s - q[0], a[1] + ez * s - q[1]) < q[2] + PIECES[p.k].r + 2) ok = false; }
        fitMemo.set(key, ok);
      }
      return ok;
    };
    await ctx.yield();
    // THE STAGING, by the game, whatever game is dealt. The red queen has left her square to run; the red king keeps
    // his beside it and a white rook has got as far as her empty square: the flight goes down between the two. Her
    // bishop steps out of its own square next to hers onto the square a file further out, where a pawn stood; on the rare
    // visit a white pawn has reached that square and the bishop takes it: the pawn bows off the board in a puff of
    // flowers. The glide is a move of the game, on the game's clock like every other (GLIDE_T0 to GLIDE_T1, below):
    // when the game's moves are taken back the bishop glides home again, and the pawn stands up out of its flowers.
    // Five red pawns stand a rank across the board on their own squares (both sides of her lane); on the third rank
    // stand a red knight NEAR our line beyond the giant flowers, a red rook beyond it and a red pawn on her lane's
    // other side; a white rook stands near our low line (below). In the middle of the board a red knight and a
    // white knight meet beside the flight, and five white pawns stand a rank across the board with them. The pawns
    // of these ranks and the third rank's rook are pieces in play. The white court makes an avenue to the crown:
    // the run-in from the wood's far edge to the crown is told off in quarters: pawns at the first, bishops at the
    // middle, queen and king at the third, one of each pair
    // on either side of the flight. The nearer knight of the meeting and the court's pairs stand STAND = 2 of their
    // own heights from the flight's line (the meeting's other knight further off: its rule is at its place below),
    // and no piece of the game stands or moves nearer than that; the white rook by
    // our low line, the red knight of the third rank and the hill's own piece stand NEAR (below).
    // (the pawns of the staged ranks are pieces in play: they stand on their squares when the game is at its start
    // and move by the game's rule like any piece; `ranked` holds them until the staging is done)
    let glide = null, rankAt = null;
    const ranked = [];
    const stage = (pieces, Bd) => {
      const pick = (w, k, f) => pieces.find((p) => p.w === w && p.k === k && !p.court && !p.dead && (f === undefined || p.home[0] === f)) || pieces.find((p) => p.w === w && p.k === k && !p.court && (f === undefined || p.home[0] === f));
      const seat = (p, f, r) => { const o = Bd[f][r]; if (o && o !== p) o.dead = true; if (Bd[p.f][p.r] === p) Bd[p.f][p.r] = null; p.dead = false; p.court = true; p.f = f; p.r = r; Bd[f][r] = p; };
      const at = (p, x, z) => { p.px = x; p.pz = z; stagedAt.push([x, z, PIECES[p.k].r]); };
      for (const [f, r] of [...LANE, [LF, 5], [LF, 6]]) { const o = Bd[f][r]; if (o) { o.dead = true; Bd[f][r] = null; } }       // nobody stands in her lane or in the wood
      const rook = pick(true, 'rook'), bishop = pick(false, 'bishop', fx_(2)), to = [fx_(1), 1], from = [fx_(2), 0];
      if (rook) seat(rook, OF, 0);
      for (const f of [0, 2, 5, 6, 7].map(fx_)) { const p = pick(false, 'pawn', f); if (p) { seat(p, f, 1); ranked.push(p); } }
      // THE THIRD RANK, her own side's: a red knight on the square beyond the giant flowers, NEAR our line on the hand
      // away from her (abeam of that square's middle); a red rook on the next square out; and a red pawn on the
      // square on her lane's other side. The rook and the pawn are in play.
      const kn1 = pick(false, 'knight'); if (kn1) { seat(kn1, MF, 3); rankAt = besideLine(B(3.5), MX, PIECES.knight.r + NEAR * PIECES.knight.h); at(kn1, ...rankAt); }
      const rk1 = pick(false, 'rook'); if (rk1) { seat(rk1, fx_(6), 3); ranked.push(rk1); }
      for (const f of [3].map(fx_)) { const p = pick(false, 'pawn'); if (p) { seat(p, f, 3); ranked.push(p); } }
      // THE HILL'S OWN PIECE: the red bishop of the king's side stands where the garden ends, on the hill's foot line
      // across our way (or as far up from it as keeps its foot off the bank of the brook below the hill), NEAR our
      // line on her lane's hand, beyond that hand's wall of flowers: the garden's guest, standing over the beds. The
      // train comes on the other hand.
      const hb = pick(false, 'bishop', fx_(5));
      if (hb) { if (Bd[hb.f][hb.r] === hb) Bd[hb.f][hb.r] = null; hb.dead = false; hb.court = true; at(hb, MX * (PIECES.bishop.r + NEAR * PIECES.bishop.h), Math.max(HZC - HRZ, BROOK + 5 + PIECES.bishop.r)); }
      // the white rook near our low line, NEAR the line, measured square to it:
      // in the square beside her lane's first, on the hand away from her, abeam of that square's middle
      const rk2 = pick(true, 'rook'); if (rk2) { seat(rk2, OF, 1); at(rk2, ...besideLine(B(1.5), -MX, PIECES.rook.r + NEAR * PIECES.rook.h)); }
      // THE KNIGHTS' MEETING: the two stand face to face on one line down the board, 0.55 of a height short of
      // B(4.6) and beyond it, on the hand away from her lane. That line lies as far out as puts the NEARER of the two
      // STAND of its height from our line, measured square to our line (planDist: our line runs slantwise across
      // the board there, so two heights laid off along x would stand nearer than two heights; the other knight
      // then stands further off than STAND)
      const kr = pick(false, 'knight'), kw = pick(true, 'knight'), kz = B(4.6), kd = 0.55 * PIECES.knight.h;
      let kx = xAtZ(kz) - MX * STAND * PIECES.knight.h;
      for (let i = 0; i < 400 && Math.min(planDist(kx, kz - kd), planDist(kx, kz + kd)) < STAND * PIECES.knight.h; i++) kx -= MX * 0.25;
      if (kw) { seat(kw, OF, 4); at(kw, kx, kz - kd); }
      if (kr) { if (Bd[kr.f][kr.r] === kr) Bd[kr.f][kr.r] = null; kr.dead = false; kr.court = true; kr.f = OF; kr.r = 4; at(kr, kx, kz + kd); }
      for (const f of [1, 2, 5, 7, 0].map(fx_)) { const p = (f !== fx_(3) && f !== fx_(4) && pick(true, 'pawn', f)) || pieces.find((q) => q.w && q.k === 'pawn' && !q.court && q.home[0] !== 3 && q.home[0] !== 4); if (p) { seat(p, f, 4); ranked.push(p); } }
      const pair = (a, b, share) => { const z = WZ1 - share * AV, x = xAtZ(z); for (const [p, sg] of [[a, -1], [b, 1]]) if (p) { if (!p.court && Bd[p.f][p.r] === p) Bd[p.f][p.r] = null; p.court = true; p.dead = false; at(p, x + sg * STAND * PIECES[p.k].h, z); } };
      const home = (k, f) => pieces.find((p) => p.w && p.k === k && p.home[0] === f);
      pair(home('pawn', 3), home('pawn', 4), 0.25);
      pair(home('bishop', 2), home('bishop', 5), 0.5);
      pair(pieces.find((p) => p.w && p.home[0] === 3 && p.home[1] === 7), pieces.find((p) => p.w && p.home[0] === 4 && p.home[1] === 7), 0.75);
      // no piece of the game stands on a square nearer the flight's line than STAND of its own heights (the gate's two and the staged ones stand by their own rules)
      for (const p of pieces) if (!p.court && !p.dead && path.nearestXZ(...sqXZ(p.f, p.r)).dist < STAND * PIECES[p.k].h) { p.dead = true; if (Bd[p.f][p.r] === p) Bd[p.f][p.r] = null; }
      // THE WHITE KNIGHT THAT IS NOT AT THE MEETING IS IN PLAY ON EVERY VISIT (white's other officers are all staged):
      // it stays where the opening left it if it lives and has two hops that fit; else it stands on the free square
      // of its side's three back ranks nearest its home file where it has two
      const KNH = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
      const hopsAt = (f, r) => KNH.filter(([a, b]) => { const tf = f + a, tr = r + b; return tf >= 0 && tf < 8 && tr >= 0 && tr < 8 && !blockedSq.has(tf + ',' + tr) && !Bd[tf][tr] && fits({ k: 'knight', f, r }, { f: tf, r: tr }); }).length;
      const wn = pieces.find((p) => p.w && p.k === 'knight' && !p.court);
      if (wn && (wn.dead || hopsAt(wn.f, wn.r) < 2)) {
        let best = null;
        for (const r of [6, 5, 7]) for (let f = 0; f < 8; f++) {
          const c = sqXZ(f, r), d = Math.abs(f - wn.home[0]) + (r === 6 ? 0 : r === 5 ? 0.3 : 0.6);
          if (Bd[f][r] || blockedSq.has(f + ',' + r) || path.nearestXZ(c[0], c[1]).dist < STAND * PIECES.knight.h || stagedAt.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < q[2] + PIECES.knight.r + 2) || hopsAt(f, r) < 2) continue;
          if (!best || d < best[0]) best = [d, f, r];
        }
        if (best) { seat(wn, best[1], best[2]); ranked.push(wn); }
      }
      if (!bishop) { for (const p of ranked) p.court = false; return; }
      const o = Bd[from[0]][from[1]]; if (o && o !== bishop) { o.dead = true; Bd[from[0]][from[1]] = null; }
      seat(bishop, to[0], to[1]);
      let pawn = null;
      // (on the rare visit the pawn that is taken is one of white's rank: the one whose way the red knight bars, or
      // failing it another; the rank then stands a pawn short)
      if (rare) { pawn = ranked.find((p) => p.w && p.k === 'pawn' && p.f === MF && p.r === 4) || ranked.find((p) => p.w && p.k === 'pawn') || pick(true, 'pawn'); if (pawn && ranked.includes(pawn)) ranked.splice(ranked.indexOf(pawn), 1); if (pawn) { if (Bd[pawn.f][pawn.r] === pawn) Bd[pawn.f][pawn.r] = null; pawn.dead = false; pawn.court = true; pawn.f = to[0]; pawn.r = to[1]; } }
      const q = sqXZ(to[0], to[1]);
      glide = { p: bishop, pawn, from: sqXZ(from[0], from[1]), to: q };
      for (const p of ranked) p.court = false;
    };
    const game = await playGame(S.game, (f, r) => blockedSq.has(f + ',' + r), { plies: rv.int(10, 22), first: 1.5, gap: 2.4, more: 110, movers: 4, on: 6, fits, stage, mirror: MX < 0, pause: () => ctx.yield() });
    await ctx.yield();
    // other games on the squares beyond: the far country is peopled too
    const fr = S.far, KINDS = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'], farPieces = [];
    for (let i = 0, tries = 0; i < Math.round(36 * Math.min(1, detail + 0.2)) && tries < 900; tries++) {
      const f = fr.int(-13, 20), r = fr.int(-3, 17), k = fr.pick(['pawn', 'pawn', 'pawn', 'rook', 'knight', 'bishop', 'bishop', 'queen', 'king', 'rook']), w = fr.chance(0.5), ph = fr.range(0, 40), ta = fr.pick([-1, 1]), tb = fr.pick([-1, 1]);
      if ((f >= 0 && f < 8 && r >= 0 && r < 8) || farPieces.some((q) => q.f === f && q.r === r)) continue;
      const q = sqXZ(f, r); if (hillAt(q[0], q[1]) > 0.01) continue;
      farPieces.push({ k, w, f, r, ph, to: k === 'pawn' ? null : k === 'rook' ? [ta, 0] : k === 'knight' ? null : [ta, tb] }); i++;
    }
    // a far piece that would glide onto the main board, or onto another far piece's square or the square it glides to, stands still
    { const taken = new Set(farPieces.map((p) => p.f + ',' + p.r));
      for (const p of farPieces) { if (!p.to) continue; const f = p.f + p.to[0], r = p.r + p.to[1], key = f + ',' + r; if ((f >= 0 && f < 8 && r >= 0 && r < 8) || taken.has(key)) p.to = null; else taken.add(key); } }
    const sets = {}, farSets = {}, lampAt = [], pause = () => ctx.yield();
    // THE DISTANT MAKE: a chessman farther than FAR_MAKE = 400 m from our line (its square, and the square it glides
    // to) stands in the part's distant make (five sides, fewer rows: at 400 m a chessman is no broader than a thumb
    // held at arm's length, and its turned rings run together); nearer it keeps the plain one. A shadow's edge is
    // soft, so no shadow needs its piece's own make: the pieces of a set that comes within 100 m of our line cast
    // their shadows by the part's caster's make (five sides, every turned ring), every other set by the distant one.
    // (each set built on the distant make is given a geometry of its own on that make's vertices: its colours and
    // its count are its own. The shadow of a chessman beyond FAR_MAKE is cast by the horizon's make, the part's
    // plainest: at 400 m and more a shadow is a soft bar across the squares.)
    const FAR_MAKE = 400, distMake = {}, distant = async (k) => distMake[k] || (distMake[k] = await pieceGeometryAsync(k, -2.5, pause));
    const castMake = {}, caster = async (k) => castMake[k] || (castMake[k] = await pieceGeometryAsync(k, -2, pause));
    const horMake = {}, horizon = async (k) => horMake[k] || (horMake[k] = await pieceGeometryAsync(k, -3, pause));
    for (const p of farPieces) { const a = sqXZ(p.f, p.r), b = p.to ? sqXZ(p.f + p.to[0], p.r + p.to[1]) : a; p.d = Math.min(path.nearestXZ(a[0], a[1]).dist, path.nearestXZ(b[0], b[1]).dist); }
    const reach = (p) => { let d = p.px !== undefined ? path.nearestXZ(p.px, p.pz).dist : path.nearestXZ(...sqXZ(p.start[0], p.start[1])).dist; for (const m of p.moves) d = Math.min(d, path.nearestXZ(...sqXZ(m.to[0], m.to[1])).dist); if (glide && (p === glide.p || p === glide.pawn)) d = 0; return d; };
    for (const k of KINDS) {
      const all = game.filter((p) => p.k === k), far = farPieces.filter((p) => p.k === k);
      for (const hi of [true, false]) {
        const mine = all.filter((p) => (reach(p) < 100) === hi);
        if (!mine.length) continue;
        const s = makePieces(env, { kind: k, count: mine.length, geometry: await pieceGeometryAsync(k, hi ? 1 : 0, pause) }); s.list = mine; s.mesh.name = k + (hi ? 'Hi' : 'Mid'); scene.add(s.mesh);
        await ctx.yield();
        cast(s.twin(shadowMat, 0, hi ? await caster(k) : await distant(k)));
        mine.forEach((p, i) => { p.i = i; p.ph = S.phases.range(0, TAU); s.color(i, p.w, !night ? 0 : p.w ? 0.5 : -0.9); if (night && !p.w) p.lamp = lampAt.push(p) - 1; });
        (sets[k] = sets[k] || []).push(s);
        await ctx.yield();
      }
      for (const dist of [false, true]) {
        const mine = far.filter((p) => (p.d >= FAR_MAKE) === dist);
        if (!mine.length) continue;
        const s = makePieces(env, { kind: k, count: mine.length, geometry: dist ? ownGeometry(await distant(k)) : await pieceGeometryAsync(k, -1, pause) }); s.list = mine; s.mesh.name = k + (dist ? 'Dist' : 'Far'); scene.add(s.mesh);
        (farSets[k] = farSets[k] || []).push(s);
        await ctx.yield();
        cast(s.twin(shadowMat, 0, dist ? await horizon(k) : mine.some((p) => p.d < 100) ? await caster(k) : await distant(k)));
        mine.forEach((p, i) => { p.i = i; s.color(i, p.w, !night ? 0 : p.w ? 0.5 : -0.9); });
      }
      await ctx.yield();
    }

    // ------------------------------------------------------------ the hero: the red queen at full run in her lane's first square, the white pawn at her side
    // her pawn, her pacing hedge and the oak that keeps pace with her are on her inner hand (the board's middle side),
    // the hand our line passes her on: the pawn 15 m, the hedge 24 m and the oak 31 m from her lane's axis, our line
    // OFF from it, so we see her over them. The pawn runs PAWN_LEAD before her.
    // WHERE SHE STANDS: she has the first brook at her back, and beyond the brook the railway on its trestle. She
    // stands her wake and a margin beyond the brook's water: QZ = the water's edge on her side at its widest (WATER:
    // the brook's bed and half the rag the ground's shader draws the water's edge with), less the longer of her
    // skirt blown back at a full run and her dust's tail (the part's RUN_WAKE, read from its make: 25.6 m and
    // 42.3 m behind her axis), less WAKE_M = 2 m: 49.3 m beyond the brook's middle. So her skirt, and every billow
    // of her dust while it has any body, lie over her own lane's grass; the trestle and the trains stand RAIL =
    // 7.8 m beyond the brook's middle again (57 m behind her axis), and her pacing hedge (its hind end 21 m behind
    // her axis) is nowhere near the brook's reeds or the railway's timbers.
    // THE STRAWS that stream under her lie on the ground and would run 47.5 m before her and behind her (the
    // part's full stream): no square of the board has that much grass between two brooks, so the part is told the
    // room there is (STRAW_REACH: the lesser of the room behind her and the room before her, each to WAKE_M short
    // of its brook's water) and draws its stream in to it; no straw streams over water.
    const PAWN_LEAD = 16, WAKE_M = 2, WATER = BROOK + BROOK_RAG / 2;
    const QZ = B(1) - WATER - Math.max(RUN_WAKE.skirt, RUN_WAKE.dust) - WAKE_M, STRAW_REACH = Math.min(RUN_WAKE.straws, B(1) - WATER - WAKE_M - QZ, QZ - B(2) - WATER - WAKE_M);
    const hero = await buildHero(ctx, { env, rng: S.queen, dustRng: S.dust, ground: false, family: false, contact: false, side: -1, pawnAt: [MX * 15, PAWN_LEAD], hedgeAt: [MX * 24, -3], strawReach: STRAW_REACH });
    scene.add(hero.object); hero.object.rotation.y = Math.PI;
    // SHE RUNS ON THE GROUND: she stands at the land's own height over her lane's axis (the brooks' cuts pass under her
    // hem, which spans them) and square on the land's slope under her hem, as a chessman stands on a tilted board, so
    // her hem meets the turf all round; her shade is the one the world lays on the land (no level disc under her)
    const qTilt = new THREE.Quaternion(), qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), qUp = new THREE.Vector3(0, 1, 0), qN = new THREE.Vector3();
    const queenStand = (zq, o) => { const R = RUNNER.hem; o.gx = (landAt(LX + R, zq) - landAt(LX - R, zq)) / (2 * R); o.gz = (landAt(LX, zq + R) - landAt(LX, zq - R)) / (2 * R); o.y = landAt(LX, zq); return o; };
    {
      const sm = new THREE.ShaderMaterial({ uniforms: { ...gU, uIAnim: hero.queenMaterial.uniforms.uIAnim }, vertexShader: SHADOW_VERT(false), fragmentShader: shadowFrag, ...shadowOpts });
      const qs = new THREE.Mesh(hero.queenShadowGeometry, sm); qs.frustumCulled = false; qs.renderOrder = -1; hero.queen.parent.add(qs);
      const pm = new THREE.ShaderMaterial({ uniforms: { ...gU, uIAnim: hero.pawnMaterial.uniforms.uIAnim }, vertexShader: SHADOW_VERT(false), fragmentShader: shadowFrag, ...shadowOpts });
      const ps = new THREE.Mesh(hero.pawn.geometry, pm); ps.frustumCulled = false; ps.renderOrder = -1; hero.pawn.add(ps);
    }
    // THE RUNNER RUNS ON THE SPOT, IN THE FIRST SQUARE OF HER LANE, the whole visit through and for every visitor
    // alike (the book's own joke: all the running she can do, to keep in the same place). It is a standing habit:
    // her stride, her lean, her bob, the swing of her arms and skirts, her dust and her pawn's hops run on the
    // world's clock in the part and are whole from the first frame to the last (the part's setSpeed is given one set
    // of numbers, once); no metre of our flight, no place of the route and no nearness of ours changes any of it.
    // The ground slides under her and she gets nowhere: the straws stream back under her hem and her dust trails
    // behind her at their fullest (the part's streak, whole).
    // Her pawn runs PAWN_LEAD before her, her hedge and her oak keep beside her, each in its own place, bobbing on
    // the clock. Her lane lies open before her, and she never gets down it: we see her because our line runs down
    // beside her lane (OFF from its axis, from the lane's head to the second brook) and passes abeam of her on the
    // way, not because she waited.
    const QS = queenStand(QZ, { gx: 0, gz: 0, y: 0 });
    hero.setSpeed(1, 1, PAWN_LEAD, 1);
    hero.object.position.set(LX, QS.y, QZ); hero.object.quaternion.copy(qTilt.setFromUnitVectors(qUp, qN.set(-QS.gx, 1, -QS.gz).normalize())).multiply(qYaw);
    // by night the red pieces stand in lamp light: a warm lamp at the foot of each, and of the queen
    if (night) { hero.queenMaterial.uniforms.uIShade.value.w = -0.9; hero.pawnMaterial.uniforms.uIShade.value.w = 0.5; }
    const lamps = night ? fx.makeGlows({ rng: S.lamps, time: env.uTime, positions: new Float32Array((lampAt.length + 1) * 3), color: '#ffb060', size: 15, intensity: 1.5, flicker: 0.12 }) : null;
    if (lamps) { scene.add(lamps.object); lamps.setPosition(lampAt.length, LX - MX * 9, QS.y + 3, QZ + 6); }
    await ctx.yield();

    // ------------------------------------------------------------ hedges from brook to brook, plank bridges, stooks and apple trees
    const litI = makeLit(env), litD = makeLit(env, { side: THREE.DoubleSide });
    const inst = (geometry, count, material = litI) => { const s = makePieces(env, { geometry, count: Math.max(1, count), material }); s.mesh.count = count; scene.add(s.mesh); return s; };
    const hr = S.hedges, hedgeAt = [], HEDGE_M = 2.5;
    // (the railway runs along the first brook RAIL = 7.8 m from its middle, on the near bank on her lane's side of
    // our crossing and on the far bank on the other: no hedge stands across it; its way is cut 3 m wider than its feet)
    const RAIL = 7.8, RAIL_X = xAtZ(B(1)), railBank = (x) => B(1) + (Math.abs(x - RAIL_X) < 24 ? 0 : (x - RAIL_X) * MX > 0 ? RAIL : -RAIL);
    // tall hawthorn hedges, HEDGE_H = 5.6 m by 0.85 to HEDGE_K = 1.2, each run laid in four lengths that climb and dip
    // with the land, with a gap 7 m wide at the middle of every run and a field gate in the gap of every hedge within
    // 160 m of the flight's line: fine near the flight, plain beyond. A length is left out where the flight would
    // come within HEDGE_M of it, and where a piece staged off its square stands on the hedge's line: a hedge under
    // or beside our low line stands.
    const HSEG = HEDGE_SEG, GATE_W = HEDGE_GAP, HSL = (SZ - 16 - GATE_W) / HSEG, hedgeLen = [], hedgeRuns = [];
    for (let kx = -4; kx <= 4; kx++) for (let r = -1; r <= 9; r++) {
      const x = kx * SQ, z = -(r + 0.5) * SZ, flip = hr.chance(0.5) ? Math.PI : 0, k = hr.range(0.85, HEDGE_K);
      const mi = (((r + 64) % 64) * 64 + ((kx + 64) % 64)) * 4 + 3; mapData[mi] = 0;        // the ground's record of this run: no length stands yet
      if (hillAt(x, z) > 0.2 || hillAt(x, z + 36) > 0.2 || hillAt(x, z - 36) > 0.2) continue;
      const q = [x, z, flip, k, 0]; hedgeAt.push(q); hedgeRuns.push([q, mi]);              // q[4]: which of its lengths stand, as bits
    }
    // the two makes of a length (fine within 70 m of our line, plain beyond), and the box that holds both: the make's
    // own half breadth, half length and top, its lumps counted in
    const hedgeMake = [hedgeGeometry(hr, { length: HSL + 5, steps: 12, around: 8, height: HEDGE_H, width: 4.6 }), hedgeGeometry(hr, { length: HSL + 5, steps: 4, around: 4, height: HEDGE_H, width: 4.6 })];
    let HBX = 0, HBY = 0, HBZ = 0;
    for (const g of hedgeMake) { g.computeBoundingBox(); const bb = g.boundingBox; HBX = Math.max(HBX, -bb.min.x, bb.max.x); HBY = Math.max(HBY, bb.max.y); HBZ = Math.max(HBZ, -bb.min.z, bb.max.z); }
    // A LENGTH IS TESTED AS THE BOX IT IS. A run's own measure k makes it taller by k and narrower and shorter by the
    // root of k (it keeps its bulk); it is laid on the sloping line between the ground at its two ends. It is left
    // out where any point of our line comes within HEDGE_M of that box (and half the 2.5 m between the line's points).
    const hedgeHit = (x, zc, k) => {
      const g0 = heightAt(x, zc) - 0.3, sl = (heightAt(x, zc + HSL / 2) - heightAt(x, zc - HSL / 2)) / HSL, w = 1 / Math.sqrt(k), hb = HBX * w, hl = HBZ * w, m = HEDGE_M + 1.25;
      for (let i = 0; i < route.length; i += 3) {
        const dz = route[i + 2] - zc, ex = Math.max(0, Math.abs(route[i] - x) - hb), ez = Math.max(0, Math.abs(dz) - hl), ey = Math.max(0, route[i + 1] - (g0 + Math.abs(clamp(dz, -hl, hl) * sl) + HBY * k));
        if (ex * ex + ey * ey + ez * ez < m * m) return true;
      }
      return false;
    };
    for (const [q, mi] of hedgeRuns) {
      for (let j = 0; j < HSEG; j++) {
        const zc = q[1] + (j - (HSEG - 1) / 2) * HSL + (j < HSEG / 2 ? -1 : 1) * GATE_W / 2;
        let low = hedgeHit(q[0], zc, q[3]) || Math.abs(zc - railBank(q[0])) < HBZ / Math.sqrt(q[3]) + (Math.abs(q[0] - RAIL_X) < 24 ? RAIL : 0) + 3; for (let i = -2; i <= 2; i++) if (nearStaged(q[0], zc + i * HSL / 4, 2.3)) low = true;
        if (!low) { hedgeLen.push([q, zc]); q[4] |= 1 << j; }
      }
      mapData[mi] = q[4] * 17;
      if (mi % 8 === 0) await ctx.yield();
    }
    tMap.needsUpdate = true;
    // (a length HEDGE_FAR = 120 m and more from our line is the plainest make: three steps by three round, a dark
    // bar with a flat top, on a stream of its own; it is not among the makes a length is measured by. Round three,
    // the make's top ring lies a sixth of a turn off the crest, so it is asked for that much taller and its flat
    // top stands at the hedge's own height.)
    const HEDGE_FAR = 120, hedgeFar = hedgeGeometry(S['hedges.far'], { length: HSL + 5, steps: 3, around: 3, height: HEDGE_H / Math.pow(Math.cos(Math.PI / 6), 0.55), width: 4.6 });
    for (const make of [0, 1, 2]) {
      const mine = hedgeLen.filter((h) => { const d = path.nearestXZ(h[0][0], h[0][1]).dist; return (d < 70 ? 0 : d < HEDGE_FAR ? 1 : 2) === make; });
      const hedges = inst(make < 2 ? hedgeMake[make] : hedgeFar, mine.length); hedges.mesh.name = ['hedgeHi', 'hedgeLo', 'hedgeFar'][make]; await ctx.yield();
      mine.forEach(([q, zc], i) => { const dh = heightAt(q[0], zc + HSL / 2) - heightAt(q[0], zc - HSL / 2); hedges.place(i, q[0], heightAt(q[0], zc) - 0.3, zc, q[2], (q[2] ? 1 : -1) * Math.atan2(dh, HSL), 0, q[3]); });
      hedges.commit(); await ctx.yield();
    }
    {
      // a gate hangs between the two middle lengths of a run, where both stand
      const mine = hedgeAt.filter((q) => (q[4] & 6) === 6 && path.nearestXZ(q[0], q[1]).dist < 160), gates = inst(gateGeometry(), mine.length); gates.mesh.name = 'gates';
      mine.forEach((q, i) => gates.place(i, q[0], heightAt(q[0], q[1]) - 0.1, q[1], 0));
      gates.commit();
    }
    await ctx.yield();
    // poplars, 26 to 34 m, stand in a line along one hedge run in three (four to a run), none within 30 m of the flight
    // and none on the two side borders of the square of giant flowers (meadSide): there the blooms are the trees
    const meadSide = (x, z) => Math.abs(Math.abs(x - sqXZ(MEAD[0], MEAD[1])[0]) - SQ / 2) < 3 && z < -MEAD[1] * SZ && z > -(MEAD[1] + 1) * SZ;
    const poplarAt = [], pp = S.poplars;
    for (const q of hedgeAt) {
      const has = pp.chance(1 / 3) && q[4] === 15;
      for (let j = 0; j < 4; j++) {
        const z = q[1] + (j - 1.5) * (SZ - 16) / 4 + pp.range(-2, 2), sc = pp.range(1, 1.3), yaw = pp.range(0, TAU), y = heightAt(q[0], z);
        if (has && !inWood(q[0], z, 6) && !meadSide(q[0], z) && !inLane(q[0], z, 0, 26 * sc, 4, 26)) poplarAt.push([q[0], y, z, yaw, sc]);
      }
    }
    for (const far of [false, true]) {
      const mine = poplarAt.filter((q) => (path.nearestXZ(q[0], q[2]).dist >= 120) === far), poplars = inst(poplarGeometry(far), mine.length); poplars.mesh.name = far ? 'poplarsFar' : 'poplars';
      mine.forEach((q, i) => poplars.place(i, q[0], q[1] - 0.3, q[2], q[3], 0, 0, 1, q[4]));
      poplars.commit();
    }
    await ctx.yield();
    scene.add(flora.makeGroundShadows({ points: poplarAt.filter((q) => path.nearestXZ(q[0], q[2]).dist < 260).map((q) => ({ x: q[0], z: q[2], r: 3.4 * q[4] })), heightAt, sunDir: SUN, strength: night ? 0.3 : 0.5, stretch: 2.6 }).object);
    await ctx.yield();
    // plank bridges: one by each of the three middle hedge lines on every brook but the railway's, within 250 m of our
    // line (beyond it a plank is not to be told from its bank)
    const bridgeAt = [];
    for (let k = 2; k <= 8; k++) for (let kx = -1; kx <= 1; kx++) { const x = kx * SQ - 7.5; if (path.nearestXZ(x, -k * SZ).dist < 250 && Math.hypot(x - CROWN[0], -k * SZ - CROWN[1]) > 34) bridgeAt.push([x, -k * SZ]); }
    const bridgeGeo = bridgeGeometry(); await ctx.yield();
    const bridges = inst(bridgeGeo, bridgeAt.length); bridges.mesh.name = 'bridges';
    bridgeAt.forEach((q, i) => bridges.place(i, q[0], heightAt(q[0], q[1]) - 0.25, q[1], 0));
    bridges.commit();
    // THE WALK CROSSES THE SEVENTH BROOK ON ITS OWN DECK, as broad as the walk and level with its banks (laid on the
    // line between the two banks' heights): the walk runs on over it; no footbridge stands up in the middle of the way
    { const zd = B(7), ha = heightAt(XW, zd + 9.6), hb = heightAt(XW, zd - 9.6), deck = inst(deckGeometry(), 1); deck.mesh.name = 'deck';
      const hl = (heightAt(XW - 8.5, zd + 9.6) + heightAt(XW - 8.5, zd - 9.6)) / 2, hr = (heightAt(XW + 8.5, zd + 9.6) + heightAt(XW + 8.5, zd - 9.6)) / 2;
      deck.place(0, XW, (ha + hb) / 2, zd, 0, -Math.atan2(ha - hb, 19.2), Math.atan2(hr - hl, 17)); deck.commit(); }
    await ctx.yield();
    // every stook, apple tree and sheep is dealt first and tested afterwards, so the deal does not hang on the route
    const stookAt = [], appleAt = [], cockAt = [], sr = S.fields, shr = S.sheep, inCrown = (x, z) => Math.hypot(x - CROWN[0], z - CROWN[1]) < 21 * CROWN_K + 9;
    // THE WALK TO THE CROWN IS CLEAR: the mown walk (8.5 m either side of its line) and its flower border (to WALK_B =
    // 14 m either side), from the wood's far edge to the crown, carry no tree, bush, stook, cottage or beast: each
    // keeps its own reach m outside the border.
    const WALK_B = 14, inWalk = (x, z, m) => Math.abs(x - XW) < WALK_B + m && z < WZ1 + m;
    // a pond lies on the pasture nearest the flight (when one lies 40 to 170 m off), in the lowest quarter of its square,
    // clear of the square's middle where a piece may stand
    let pond = null;
    for (let cz = 0; cz <= 7; cz++) for (let cx = -4; cx <= 3; cx++) {
      if (cropId(cx, cz) !== 5 || (cx === MEAD[0] - 4 && cz === MEAD[1])) continue;
      const x = cx * SQ + 48, z = -(cz + 0.5) * SZ, n = path.nearestXZ(x, z);
      if (hillAt(x, z) > 0.01 || inStrip(x, z) || inWood(x, z, 30) || n.dist < 40 || n.dist > 170 || (pond && n.dist >= pond.dist)) continue;
      let low = null;                                                         // water gathers in the lowest quarter of the square
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const qx = x + 24 * sx, qz = z + 24 * sz, h = heightAt(qx, qz);
        if (Math.hypot(qx - CROWN[0], qz - CROWN[1]) < 21 * CROWN_K + 30 || nearStaged(qx, qz, 24)) continue;     // not under the crown, nor where a staged piece stands
        if (!low || h < low.h) low = { x: qx, z: qz, h };
      }
      if (!low) continue;
      pond = { x: low.x, z: low.z, r: 15, dist: n.dist };
    }
    if (pond) gU.uPond.value.set(pond.x, pond.z, pond.r);
    const inPond = (x, z, m) => pond !== null && Math.hypot(x - pond.x, z - pond.z) < pond.r + m;
    for (let cz = 0; cz <= 8; cz++) for (let cx = -4; cx <= 3; cx++) {
      const id = cropId(cx, cz), x0 = cx * SQ, z0 = -cz * SZ, hz = SZ / 2;
      // every square of a crop draws its numbers; on the square of giant flowers nothing of the crop is kept
      const mead = cx === MEAD[0] - 4 && cz === MEAD[1];
      if (id === 2) for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        const lx = 13 + i * 10 + sr.range(-0.6, 0.6), lz = 13 + j * (SZ - 26) / 7 + sr.range(-0.6, 0.6), yaw = sr.range(-0.4, 0.4), k = sr.range(0.9, 1.15), x = x0 + lx, z = z0 - lz;
        if (mead || Math.abs(lx - 48) < 11 || Math.abs(lz - hz) < 11 || inStrip(x, z) || inWood(x, z, 4) || nearStaged(x, z, 5) || inCrown(x, z) || inWalk(x, z, 2.5) || inLane(x, z, 0, 5, 2.5, 4)) continue;
        stookAt.push([x, z, yaw, k]);
      }
      if (id === 7) for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const lx = 12 + i * 12 + sr.range(-1, 1), lz = 12 + j * (SZ - 24) / 6 + sr.range(-1, 1), yaw = sr.range(0, TAU), k = sr.range(0.85, 1.2), x = x0 + lx, z = z0 - lz;
        if (mead || Math.abs(lx - 48) < 13 || Math.abs(lz - hz) < 13 || inStrip(x, z) || inWood(x, z, 6) || nearStaged(x, z, 8) || inCrown(x, z) || inWalk(x, z, 3.8) || inLane(x, z, 0, 9, 3.8, 5)) continue;
        appleAt.push([x, z, yaw, k]);
      }
    }
    // the brooks' own things. Stepping stones: three across the water at every file's middle on every brook of the
    // board, within 200 m of the flight's line (beyond it a stone is not to be told from the water). Reeds: a clump to every 16 m of each bank, kept within 60 m of the flight's line (not under it).
    {
      const st = S.stones, stoneAt = [];
      for (let k = 1; k <= 8; k++) for (let f = 0; f < 8; f++) {
        const x0 = (f - 3.5) * SQ + st.range(-6, 6);
        for (let j = -1; j <= 1; j++) { const x = x0 + st.range(-0.5, 0.5), z = -k * SZ + j * 2.7, sc = st.range(0.8, 1.15), yaw = st.range(0, TAU); if (hillAt(x, z) < 0.01 && !inCrown(x, z) && path.nearestXZ(x, z).dist < 200) stoneAt.push([x, z, yaw, sc]); }
      }
      const stones = inst(stoneGeometry(), stoneAt.length); stones.mesh.name = 'stones';
      stoneAt.forEach((q, i) => { stones.place(i, q[0], heightAt(q[0], q[1]) + 0.15, q[1], q[2], 0, 0, 1, q[3]); stones.tint(i, [1, 1, 1], 0.25, night ? 0.06 : 0); });
      stones.commit();
      // a clump's reach from its foot (with the kit's fullest sway, as a tree's is read) and its height are read from
      // the make: it is tested as that, times its own scale, with the trees' margin (LINE_M)
      const breedG = brookReedGeometry(), breedP = breedG.attributes.position, br = S.brookreeds, breedAt = [];
      let BREED_R = 0, BREED_H = 0;
      for (let i = 0, w = breedG.attributes.wind; i < breedP.count; i++) { BREED_R = Math.max(BREED_R, Math.hypot(breedP.getX(i), breedP.getZ(i)) + (w ? 1.44 * w.getX(i) + 0.11 * w.getY(i) : 0)); BREED_H = Math.max(BREED_H, breedP.getY(i)); }
      for (let k = 0; k <= 8; k++) for (let i = 0; i < Math.round(8 * SQ / 16); i++) for (const bank of [-1, 1]) {
        const x = br.range(-4 * SQ, 4 * SQ), z = -k * SZ + bank * (BROOK + br.range(0.2, 1.6)), yaw = br.range(0, TAU), sc = br.range(1.1, 1.9), y = heightAt(x, z);
        if (hillAt(x, z) > 0.01 || inCrown(x, z) || path.nearestXZ(x, z).dist > 60 || inLane(x, z, 0, BREED_H * sc, BREED_R * sc, LINE_M) || inWalk(x, z, BREED_R * sc) || Math.abs(x - LX) < RUNNER.hem + 6) continue;
        breedAt.push([x, y, z, yaw, sc]);
      }
      const breeds = inst(breedG, breedAt.length, litD); breeds.mesh.name = 'brookreeds';
      breedAt.forEach((q, i) => { breeds.place(i, q[0], q[1] - 0.1, q[2], q[3], 0, 0, 1, q[4]); breeds.tint(i, [1, 1, 1], 0.2, night ? 0.06 : 0); });
      breeds.commit();
    }
    // a cottage stands in the corner of one dark square in three of the board (20 m in from its hedge and its brook),
    // none on the hill, in her lane's strip, in the wood, on the walk or within 40 m of the flight
    const cottageAt = [], ct = S.cottages;
    for (let cz = 0; cz <= 7; cz++) for (let cx = -4; cx <= 3; cx++) {
      const has = ct.chance(1 / 3), x = cx * SQ + 20 + ct.range(-3, 3), z = -cz * SZ - 22 + ct.range(-3, 3), yaw = ct.range(-0.5, 0.5) + (ct.chance(0.5) ? Math.PI : 0), y = heightAt(x, z);
      if (!has || (((cx + cz) % 2) + 2) % 2 === 1 || (cx === MEAD[0] - 4 && cz === MEAD[1])) continue;
      if (hillAt(x, z) > 0.01 || inStrip(x, z) || inWood(x, z, 10) || nearStaged(x, z, 12) || inCrown(x, z) || inWalk(x, z, 8) || inLane(x, z, 0, 9, 7, 40)) continue;
      cottageAt.push([x, y, z, yaw]);
    }
    for (let i = appleAt.length - 1; i >= 0; i--) if (cottageAt.some((c) => Math.hypot(c[0] - appleAt[i][0], c[2] - appleAt[i][1]) < 10)) appleAt.splice(i, 1);
    {
      // THE SQUARES' EDGES STAND. Along every hedge line, wherever no tall length of hawthorn stands (the runs by the
      // hill, the lengths left out under our line, by the rail or by a staged piece), a LOW CLIPPED BORDER stands
      // instead: 1 m high, 1.3 m broad, in 12 m lengths that follow the land, within 300 m of our line. It keeps a
      // hedge's gateway open, stops short of the brooks' banks, the rail, the wood, her lane's strip, the walk, the
      // pond and the crown's lawn, and gives way to a staged piece. And THE GARDEN'S EDGE STANDS: the same border
      // runs round the hill's foot where the garden's lawn ends (0.05 of the hill's breadth inside its rim), open
      // 8 m either side of our way out of the garden. (A clipped border is dealt nothing: it stands by the lines alone.)
      const borderAt = [], BL = 12, NB = Math.floor(SZ / BL);
      const tallAt = (x, z) => hedgeLen.some(([q, zc]) => q[0] === x && Math.abs(z - zc) < HBZ / Math.sqrt(q[3]) + BL / 2 - 1);
      const borderOk = (x, z) => !inStrip(x, z) && !inWood(x, z, 2) && !nearStaged(x, z, 2 + BL / 2) && !inCrown(x, z) && !inWalk(x, z, 1) && !inPond(x, z, 2 + BL / 2)
        && SZ * Math.abs(z / SZ - Math.round(z / SZ)) > BROOK + 5 + BL / 2 && Math.abs(z - railBank(x)) > (Math.abs(x - RAIL_X) < 24 ? RAIL : 0) + 3 + BL / 2;
      for (let kx = -4; kx <= 4; kx++) { for (let r = -1; r <= 9; r++) for (let j = 0; j < NB; j++) {
        if (j === 0) await ctx.yield();
        const x = kx * SQ, zm = -(r + 0.5) * SZ, z = zm + (j - (NB - 1) / 2) * BL;
        const run = hedgeAt.find((q) => q[0] === x && q[1] === zm);
        if (run && run[4] && Math.abs(z - zm) < GATE_W / 2 + BL / 2) continue;
        if (hillAt(x, z) > 0.01 || hillAt(x, z + BL / 2) > 0.01 || hillAt(x, z - BL / 2) > 0.01 || path.nearestXZ(x, z).dist > 300 || tallAt(x, z) || !borderOk(x, z)) continue;
        if (inLane(x, z - 4, 0, 1.2, 0.8, HEDGE_M) || inLane(x, z, 0, 1.2, 0.8, HEDGE_M) || inLane(x, z + 4, 0, 1.2, 0.8, HEDGE_M)) continue;
        borderAt.push([x, z, 0, -Math.atan2(heightAt(x, z + BL / 2) - heightAt(x, z - BL / 2), BL)]);
      } }
      await ctx.yield();
      const RIM = 0.95, NRIM = Math.round(Math.PI * (3 * (HRX + HRZ) - Math.sqrt((3 * HRX + HRZ) * (HRX + 3 * HRZ))) * RIM / BL);
      for (let i = 0; i < NRIM; i++) {
        const a = (i + 0.5) / NRIM * TAU, x = RIM * HRX * Math.sin(a), z = HZC + RIM * HRZ * Math.cos(a);
        if ((Math.abs(x) < 8 + BL / 2 && z < HZC) || !borderOk(x, z) || inLane(x, z, 0, 1.2, BL / 2, HEDGE_M)) continue;
        borderAt.push([x, z, Math.atan2(HRX * Math.cos(a), -HRZ * Math.sin(a)), 0]);
      }
      await ctx.yield();
      const borders = inst(borderGeometry(), borderAt.length, litD); borders.mesh.name = 'borders';
      borderAt.forEach((q, i) => { borders.place(i, q[0], heightAt(q[0], q[1]), q[1], q[2], q[3], 0, 1, 1); borders.tint(i, [1, 1, 1], 0.1, night ? 0.05 : 0); });
      borders.commit();
    }
    await ctx.yield();
    {
      // EVERY CROP HAS ITS OWN STANDING THINGS, as the stubble has its stooks, the orchard its trees and the pasture
      // its sheep: corn (wheat, barley) its ricks, four to a square; hay its cocks, five by five; clover its bee
      // skeps and roots their heaps, four by four; pasture its mole hills; and the orchard has its bee skeps too,
      // on the mown grass between the trees (2.5 m from a trunk). All are one round heap by scale and
      // tint, set out over the square with a little straying, within 120 m of our line; none on the hill, in her
      // lane's strip, in the wood, on the walk, in the pond, by a cottage or a staged piece, and none within 4 m
      // of our line (the stooks' margin). Every one is dealt whether or not it stands.
      const dq = S.dress, KIND = { 0: [2, 2.6, 1, [0.5, 0.36, 0.1]], 1: [2, 2.6, 1, [0.52, 0.44, 0.16]], 3: [5, 1.2, 1, [0.4, 0.38, 0.13]], 4: [4, 0.9, 1, [0.6, 0.47, 0.2]], 5: [4, 0.45, 0.6, [0.17, 0.1, 0.05]], 6: [4, 1.0, 0.6, [0.3, 0.16, 0.12]], 7: [4, 0.9, 1, [0.6, 0.47, 0.2]] };
      for (let cz = 0; cz <= 8; cz++) { await ctx.yield(); for (let cx = -4; cx <= 3; cx++) {
        const K = KIND[cropId(cx, cz)], mead = cx === MEAD[0] - 4 && cz === MEAD[1]; if (!K) continue;
        for (let i = 0; i < K[0]; i++) for (let j = 0; j < K[0]; j++) {
          const x = cx * SQ + SQ * (i + 0.5 + dq.range(-0.3, 0.3)) / K[0], z = -cz * SZ - SZ * (j + 0.5 + dq.range(-0.3, 0.3)) / K[0], yaw = dq.range(0, TAU), sc = K[1] * dq.range(0.85, 1.15);
          const dH = Math.min(x - cx * SQ, (cx + 1) * SQ - x), dB = Math.min(-cz * SZ - z, z + (cz + 1) * SZ);
          if (mead || dH < 4 + 1.3 * sc || dB < BROOK + 6 + 1.3 * sc || hillAt(x, z) > 0.01 || path.nearestXZ(x, z).dist > 120 || inStrip(x, z) || inWood(x, z, 4) || nearStaged(x, z, 5) || inCrown(x, z) || inWalk(x, z, 2.5) || inPond(x, z, 3)) continue;
          if (inLane(x, z, 0, 2.15 * sc, 1.3 * sc, 4) || cottageAt.some((c) => Math.hypot(c[0] - x, c[2] - z) < 8) || Math.abs(z - railBank(x)) < 6 || appleAt.some((a) => Math.hypot(a[0] - x, a[1] - z) < 2.5)) continue;
          cockAt.push([x, z, yaw, sc, K[2], K[3]]);
        }
      } }
      await ctx.yield();
      const cocks = inst(cockGeometry(), cockAt.length); cocks.mesh.name = 'cocks';
      cockAt.forEach((q, i) => { cocks.place(i, q[0], heightAt(q[0], q[1]), q[1], q[2], 0, 0, q[4], q[3]); cocks.tint(i, q[5], 0.1, night ? 0.06 : 0); });
      cocks.commit();
    }
    await ctx.yield();
    const cottages = inst(cottageGeometry(), cottageAt.length); cottages.mesh.name = 'cottages';
    cottageAt.forEach((q, i) => { cottages.place(i, q[0], q[1] - 0.2, q[2], q[3], 0, 0, 1, 1); cottages.tint(i, [1, 1, 1], 0.1, night ? 0.1 : 0); });
    cottages.commit();
    await ctx.yield();
    for (const make of [0, 1, 2]) {
      const mine = stookAt.filter((q) => { const d = path.nearestXZ(q[0], q[1]).dist; return (d < 35 ? 0 : d < 250 ? 1 : 2) === make; }), stooks = inst(stookGeometry(make === 0, make === 2), mine.length); stooks.mesh.name = ['stookHi', 'stookLo', 'stookFar'][make];
      mine.forEach((q, i) => stooks.place(i, q[0], heightAt(q[0], q[1]), q[1], q[2], 0, 0, q[3], 1.5));
      stooks.commit(); await ctx.yield();
    }
    // apple trees in three makes: with their apples within 45 m of the flight's line, a plain lump to 150 m, a plainer one beyond
    for (const make of [1, 0, -1]) {
      const mine = appleAt.filter((q) => { const d = path.nearestXZ(q[0], q[1]).dist; return (d < 45 ? 1 : d < 150 ? 0 : -1) === make; }), apples = inst(appleTreeGeometry(S.orchard, make), mine.length); apples.mesh.name = make > 0 ? 'appleHi' : make ? 'appleFar' : 'appleLo';
      mine.forEach((q, i) => apples.place(i, q[0], heightAt(q[0], q[1]), q[1], q[2], 0, 0, q[3], 1.15));
      apples.commit(); await ctx.yield();
    }
    const flock = [], nearPath = (x, z, d) => path.nearestXZ(x, z).dist < d;
    for (let cz = 0; cz <= 7; cz++) for (let cx = -4; cx <= 3; cx++) {
      if (cropId(cx, cz) !== 5 || (cx === MEAD[0] - 4 && cz === MEAD[1])) continue;
      const c0 = [cx * SQ + shr.range(26, 70), -cz * SZ - shr.range(26, SZ - 26)];
      for (let i = 0; i < 10; i++) {
        const a = shr.range(0, TAU), d = 20 * Math.sqrt(shr()), x = c0[0] + Math.sin(a) * d, z = c0[1] + Math.cos(a) * d, q = { x, z, yaw: shr.range(0, TAU), ph: shr.range(0, 40), w: shr.range(0.25, 0.5), k: shr.range(0.9, 1.15) };
        if (hillAt(x, z) > 0.01 || inStrip(x, z) || inWood(x, z, 3) || nearStaged(x, z, 4) || inPond(x, z, 2.5) || inWalk(x, z, 1.5) || inLane(x, z, 0, 3, 1.5, 5) || cottageAt.some((c) => Math.hypot(c[0] - x, c[2] - z) < 8)) continue;
        flock.push(q);
      }
    }
    // (a sheep beyond 150 m of the flight's line is the plainer make, as an apple tree is)
    const sheepSets = [false, true].map((far) => {
      const mine = flock.filter((q) => nearPath(q.x, q.z, 150) !== far), set = inst(sheepGeometry(far), mine.length); set.mesh.name = far ? 'sheepFar' : 'sheep';
      mine.forEach((q, i) => { q.set = set; q.i = i; set.place(i, q.x, heightAt(q.x, q.z), q.z, q.yaw, 0, 0, 1, q.k); set.tint(i, [1, 1, 1], 0.05, night ? 0.08 : 0); });
      set.commit(); return set;
    });
    // (the soft shadows of these small things lie on a sheet of 8 m cells: the downs roll in swells 300 m long and more)
    const smallShadows = flora.makeGroundShadows({ points: [...appleAt.filter((q) => nearPath(q[0], q[1], 150)).map((q) => ({ x: q[0], z: q[1], r: 3.3 })), ...stookAt.filter((q) => nearPath(q[0], q[1], 90)).map((q) => ({ x: q[0], z: q[1], r: 2.3 })), ...flock.filter((q) => nearPath(q.x, q.z, 110)).map((q) => ({ x: q.x, z: q.z, r: 1.1 }))],
      heightAt, sunDir: SUN, strength: night ? 0.3 : 0.5, stretch: 1.7, cell: 8 });
    scene.add(smallShadows.object);
    await ctx.yield();

    // ------------------------------------------------------------ trees: oaks and birches in the hedgerows, the dark wood on its square, the willow in the garden
    const wind = flora.makeWind({ direction: [0.85, 0.5], strength: 1, speed: 1 });
    const matOptions = { wind, backlight: 0.9, ambient: night ? 2.6 : 2.0, leafAmbient: night ? 2.4 : 1.8 };
    await flora.prepareLeafTexture(matOptions, ctx.yield);
    const treeMat = flora.windMaterial(matOptions);
    await ctx.yield();
    const tr = S.trees, wt = S.woodtrees;
    const oakHi = flora.oakGeometry({ rng: S['trees.o1'], detail: 1, height: 13 });
    await ctx.yield();
    const birchHi = flora.birchGeometry({ rng: S['trees.b1'], detail: 1, height: 14 });
    await ctx.yield();
    const oakLo = flora.oakGeometry({ rng: S['trees.o0'], detail: 0, height: 13 });
    await ctx.yield();
    const birchLo = flora.birchGeometry({ rng: S['trees.b0'], detail: 0, height: 14 });
    await ctx.yield();
    // THE WOOD'S PINES: grown PINE_H = 30 m tall (a middle height of theirs, so that their needles' pads keep their
    // own fineness on a tall tree) in a light wood's colours: sunlit greens above, pale warm bark. They stand
    // upright: the kit grows each make with a lean of its own, and the make is set back upright here (sheared so that
    // the trunk's middle, between 0.3 and 0.42 of its height, stands over its foot).
    const PINE_H = 30, woodPal = { leaf: '#4f9440', leafLight: '#b8d868', leafDark: '#2c6a36', bark: '#b8a88e', barkDark: '#6a5a4a', barkLight: '#d8c8ac' };
    const upright = (g) => {
      const p = g.attributes.position, H = g.userData.height, lo = [0, 0, 0, 0], hi = [0, 0, 0, 0];
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), b = y < 0.08 * H ? lo : y > 0.3 * H && y < 0.42 * H ? hi : null; if (b) { b[0] += p.getX(i); b[1] += y; b[2] += p.getZ(i); b[3]++; } }
      if (!lo[3] || !hi[3]) return g;
      const dy = hi[1] / hi[3] - lo[1] / lo[3], kx = (hi[0] / hi[3] - lo[0] / lo[3]) / dy, kz = (hi[2] / hi[3] - lo[2] / lo[3]) / dy;
      for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) - kx * p.getY(i), p.getY(i), p.getZ(i) - kz * p.getY(i));
      p.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere();
      g.userData.radius = Math.max(g.boundingBox.max.x, -g.boundingBox.min.x, g.boundingBox.max.z, -g.boundingBox.min.z);
      return g;
    };
    const woodHi = upright(flora.pineGeometry({ rng: S['trees.w1'], detail: 1, height: PINE_H, ...woodPal }));
    await ctx.yield();
    const woodLo = upright(flora.pineGeometry({ rng: S['trees.w0'], detail: 0, height: PINE_H, ...woodPal }));
    await ctx.yield();
    const woodEdge = flora.oakGeometry({ rng: S['trees.w2'], detail: 0, height: 13, ...woodPal, fullness: 1.15 });
    await ctx.yield();
    // THE MEASURE OF A MAKE, read from the make itself: its top, and in 16 bands of its height the farthest that any
    // leaf or limb reaches from the trunk's axis when the wind bends it most (the kit's sway at its fullest gust with
    // its wobble: 1.44 times a vertex's own sway; and its flutter).
    const profileOf = (g) => {
      const p = g.attributes.position, w = g.attributes.wind, R = new Float32Array(16); let H = 0, top = 0;
      for (let i = 0; i < p.count; i++) H = Math.max(H, p.getY(i));
      for (let i = 0; i < p.count; i++) { const b = clamp(Math.floor(p.getY(i) / H * 16), 0, 15), r = Math.hypot(p.getX(i), p.getZ(i)) + (w ? 1.44 * w.getX(i) + 0.11 * w.getY(i) : 0); if (r > R[b]) R[b] = r; if (r > top) top = r; }
      return { H, R, top };
    };
    // A TREE STANDS CLEAR OF OUR LINE BY ITS OWN MEASURE. It is left out where our line, at its height over the
    // tree's foot, comes within LINE_M of the make's band at that height: the band times the tree's scale, with what
    // the kit's scatter may add (a tenth of stretch either way, its sink into the ground, its lean of `tilt` both
    // ways). LINE_M is 2.5 m and what the 2.5 m between the line's points can hide (0.3 m).
    const WOOD_TILT = 0.015, ROW_TILT = 0.05;
    const treeHits = (x, z, pf, sc, tilt) => {
      const g = heightAt(x, z), top = 1.1 * pf.H * sc, lean = 1.42 * tilt, far = pf.top * sc + lean * top + LINE_M;
      for (let i = 0; i < route.length; i += 3) {
        const dx = route[i] - x, dz = route[i + 2] - z, d2 = dx * dx + dz * dz, h = route[i + 1] - g;
        if (d2 > far * far || h > top + LINE_M) continue;
        for (let b = 0; b < 16; b++) {
          const y0 = (0.9 * b / 16 - 0.033) * pf.H * sc - 0.4 * sc, y1 = 1.1 * (b + 1) / 16 * pf.H * sc, r = pf.R[b] * sc + lean * y1 + LINE_M;
          if (h > y0 - LINE_M && h < y1 + LINE_M && d2 < r * r) return true;
        }
      }
      return false;
    };
    const woodProf = [], rowProf = [];
    for (const g of [woodHi, woodLo, woodEdge, birchHi, birchLo]) { woodProf.push(profileOf(g)); await ctx.yield(); }
    for (const g of [oakHi, birchHi, oakLo, birchLo]) { rowProf.push(profileOf(g)); await ctx.yield(); }
    const rowTrees = [], woodTrees = [];
    for (let kx = -4; kx <= 4; kx++) { await ctx.yield(); for (let r = -1; r <= 9; r++) {
      for (let n = tr.chance(0.55) ? (tr.chance(0.3) ? 2 : 1) : 0; n > 0; n--) {
        const x = kx * SQ + tr.range(-1, 1), z = -(r + tr.range(0.12, 0.88)) * SZ, s = tr.range(0.95, 1.45), birch = tr.chance(0.3), rot = tr.range(0, TAU);
        // (a hedgerow tree keeps clear of our line by its own make's measure, as the wood's trees do)
        const d = path.nearestXZ(x, z).dist, v = (d < 48 ? 0 : 2) + (birch ? 1 : 0);
        if (hillAt(x, z) > 0.05 || treeHits(x, z, rowProf[v], s, ROW_TILT)) continue;
        // none on the wood's own edges, none within a knight's height of a piece staged off its square, none on the
        // side borders of the square of giant flowers
        if (inWood(x, z, 3) || nearStaged(x, z, PIECES.knight.h) || meadSide(x, z)) continue;
        rowTrees.push({ x, y: heightAt(x, z), z, s, rot, d, u: 0, v });
      }
    } }
    await ctx.yield();
    // the wood: tall pines of many heights with birches among them and along the ride, oaks along its edges, over the whole of its
    // ground; the sixth brook runs through it. THE RIDE through it is open: no pine's trunk stands within RIDE_G = 5
    // of its own girths of our line (a pine's girth is 0.94 m to each unit of its scale: 1.2 to 2 m), no tree of any
    // make, pine, birch or edge oak, hangs into our line (each told by its own make's measure, treeHits), and no tree at all stands between our line and the fawn's way or within 4.5 m of the fawn's
    // way beyond it. No crown reaches into the glade, and none stands in the sun's way to the glade's floor (the
    // glade's own breadth and half a crown wide, as far toward the sun as the tree's top is over the sun's ray
    // from the glade's far rim).
    const RIDE_G = 5, GIRTH = 0.94, sunH = Math.hypot(SUN.x, SUN.z) || 1;
    const betweenWays = (x, z, r) => z < FZ0 && z > FZ0 - FLEN && (x - xAtZ(z)) * MX > 0 && (x - fawnX(FZ0 - z)) * MX < r + 4.5;
    // (the glade's round is the wood's own; the sun's way to it is the hour's: every tree is dealt as if it stood, and
    // the ones in the sun's way at this hour are taken out after the deal, so the wood is the same wood at any hour)
    const inGlade = (x, z, crown) => Math.hypot(x - GLADE[0], z - GLADE[1]) < GLADE_R + crown;
    const inSunWay = (x, z, crown, top) => {
      const dx = x - GLADE[0], dz = z - GLADE[1], al = (dx * SUN.x + dz * SUN.z) / sunH, ac = Math.abs(dx * SUN.z - dz * SUN.x) / sunH;
      return !night && al > 0 && ac < GLADE_R + 0.5 * crown && top > (al + GLADE_R) * SUN.y / sunH;
    };
    const edgeOf = (x, z) => Math.min(x - WX0, WX1 - x, WZ0 - z, z - WZ1), NJ = Math.round(WD / 10.4);
    for (let i = 0; i < 9; i++) for (let j = 0; j < NJ; j++) {
      if (j === 0 && i % 3 === 0) await ctx.yield();
      const x = WX0 + 5.3 + i * 10.67 + wt.range(-2.8, 2.8), z = WZ0 - (j + 0.5) * WD / NJ + wt.range(-2.8, 2.8), k = wt(), rot = wt.range(0, TAU), isBirch = wt.chance(0.16), q = path.nearestXZ(x, z), y = heightAt(x, z);
      // THE RIDE'S BIRCHES: within one tree's height of our line or of the fawn's way the wood's trees are birches,
      // the tree of rides and glades where the light comes in (pale trunks, small light leaves in upright clumps);
      // the pines stand behind them
      const light = Math.min(q.dist, Math.abs(x - fawnX(FZ0 - z))) < TREE_H;
      const edge = edgeOf(x, z), oak = edge < 12 && q.dist > 21, birch = (isBirch || light) && !oak, s = oak ? lerp(1.5, 2.0, k) : birch ? lerp(1.3, 1.75, k) : lerp(1.3, 2.1, k * k);
      if (Math.abs(z - B(6)) < 4.5 + BANK) continue;
      if (q.dist > 40 && (i + j) % 2) continue;                                          // beyond 40 m from the ride the wood stands half as thick
      const v = oak ? 2 : birch ? (q.dist < 20 ? 3 : 4) : q.dist < TREE_H ? 0 : 1, sm = oak || birch ? s : s * 18 / PINE_H;
      if (fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 0.7 * s + 4.5) || (!oak && inLane(x, z, 0, 18 * s, 0.5 * GIRTH * s, RIDE_G * GIRTH * s)) || treeHits(x, z, woodProf[v], sm, WOOD_TILT)) continue;
      if (betweenWays(x, z, 0.7 * s) || inGlade(x, z, 4.5 * s)) continue;
      // (a pine's scale is told against an 18 m tree, as its rules above are: its make is PINE_H tall; the finer
      // make stands within a tree's height of our line; a birch's finer make within 20 m of it, the ride's nearest
      // rank, where its leaves can be told one from another)
      woodTrees.push({ x, y, z, s: sm, rot, d: q.dist, u: 0, v, edge, gone: inSunWay(x, z, 4.5 * s, 18 * s) });
    }
    // THE WOOD'S FRONT. Along its near edge, 4 m inside it, stands a close rank of the wood's tallest pines (1.8 to
    // 2.1 of an 18 m tree: 32 to 38 m, bare pale trunks to half their height), one to every FRONT_PITCH = 5.3 m, half
    // the wood's own spacing: a front of tall pale trunks, open where the ride and the fawn's way go in (the ride's
    // own rules: the whole breadth from RIDE_G girths on our line's one hand to the fawn's margin on the other).
    const FRONT_PITCH = 5.33;
    for (let i = 0; i < Math.round(SQ / FRONT_PITCH); i++) {
      const x = WX0 + (i + 0.5) * FRONT_PITCH + wt.range(-1, 1), z = WZ0 - 4 + wt.range(-1.5, 1.5), sc = lerp(1.8, 2.1, wt()), rot = wt.range(0, TAU), q = path.nearestXZ(x, z);
      if (woodTrees.some((o) => Math.hypot(o.x - x, o.z - z) < 3) || fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 0.7 * sc + 4.5) || inLane(x, z, 0, 18 * sc, 0.5 * GIRTH * sc, RIDE_G * GIRTH * sc) || treeHits(x, z, woodProf[q.dist < TREE_H ? 0 : 1], sc * 18 / PINE_H, WOOD_TILT)) continue;
      if (betweenWays(x, z, 0.7 * sc) || inGlade(x, z, 4.5 * sc)) continue;
      woodTrees.push({ x, y: heightAt(x, z), z, s: sc * 18 / PINE_H, rot, d: q.dist, u: 0, v: q.dist < TREE_H ? 0 : 1, edge: 4, gone: inSunWay(x, z, 4.5 * sc, 18 * sc) });
    }
    // THE WOOD'S ROOF: for every 2 m of the floor, how much of the sun comes down between the crowns. A crown is told
    // as a round mass about 0.7 of the tree's height up, 0.3 of the height deep and 0.8 of the make's own breadth
    // wide, which stops four fifths of a ray through its middle and nothing at its rim; a ray is followed from the
    // floor toward the sun past every tree of the wood.
    const canAt = (x, z) => { const i = clamp(Math.floor((x - WX0) / 2), 0, CAN_W - 1), j = clamp(Math.floor((z - WZ1) / (WD / CAN_H)), 0, CAN_H - 1); return canData[(j * CAN_W + i) * 4] / 255; };
    {
      const makes = [woodHi, woodLo, woodEdge, birchHi, birchLo], crowns = woodTrees.filter((t) => !t.gone).map((t) => { const u = makes[t.v].userData, H = u.height * t.s; return [t.x, t.y + 0.7 * H, t.z, 0.8 * u.radius * t.s, 0.3 * H]; });
      for (let j = 0; j < CAN_H; j++) {
        if (j % 12 === 0) await ctx.yield();
        for (let i = 0; i < CAN_W; i++) {
          const x = WX0 + (i + 0.5) * 2, z = WZ1 + (j + 0.5) * WD / CAN_H, y = heightAt(x, z); let lit = 1;
          for (const c of crowns) {
            const px = (x - c[0]) / c[3], py = (y - c[1]) / c[4], pz = (z - c[2]) / c[3], sx = SUN.x / c[3], sy = SUN.y / c[4], sz = SUN.z / c[3];
            const tt = Math.max(0, -(px * sx + py * sy + pz * sz) / (sx * sx + sy * sy + sz * sz)), d = Math.hypot(px + tt * sx, py + tt * sy, pz + tt * sz);
            if (d < 1.05) lit *= 1 - 0.8 * (1 - smoothstep(0.55, 1.05, d));
          }
          const o = (j * CAN_W + i) * 4, v = Math.round(255 * lit); canData[o] = canData[o + 1] = canData[o + 2] = v;
        }
      }
      tCanopy.needsUpdate = true;
    }
    const shadeOpt = { sunDir: SUN, strength: night ? 0.3 : 0.42, stretch: 1.6 };
    const forest = flora.makeScatter({ rng: S['trees.row'], points: rowTrees, variants: [oakHi, birchHi, oakLo, birchLo], material: treeMat, heightAt });
    // THE FAR ROW TREES: beyond FAR_TREE = 150 m of the flight's line a hedgerow tree stands as a plainer make
    // still, a mound of its kind's leaves over its hedge (150 triangles for an oak's 415 to 514), as the
    // orchard's trees do beyond the same 150 m. The scatter has dealt every tree its lean, stretch and tint as it
    // always did; the far ones are handed over to the plainer make with what they were dealt. A birch's mound is
    // half as broad and a quarter taller.
    const FAR_TREE = 150, farM = new THREE.Matrix4(), farV = new THREE.Vector3(), farC = new THREE.Color();
    const farMakes = [{ leaf: '#41742e', leafLight: '#93b24c', leafDark: '#234d28' }, { leaf: '#6fa832', leafLight: '#c8e060', leafDark: '#2a5220' }].map((pal) => flora.bushGeometry({ rng: S['trees.far'], detail: 0, size: 8.5, ...pal }));
    for (const [v, lo, k, sx, sy] of [[2, oakLo, 0, 1, 1], [3, birchLo, 1, 0.5, 1.25]]) {
      const mine = rowTrees.filter((p) => p.v === v), old = forest.meshes.find((m) => m.geometry === lo), nFar = mine.filter((p) => p.d >= FAR_TREE).length;
      if (!old || !nFar) continue;
      const far = new THREE.InstancedMesh(farMakes[k], treeMat, nFar);
      let na = 0, nb = 0;
      mine.forEach((p, i) => {
        old.getMatrixAt(i, farM); old.getColorAt(i, farC);
        if (p.d >= FAR_TREE) { far.setMatrixAt(nb, farM.scale(farV.set(sx, sy, sx))); far.setColorAt(nb++, farC); } else { old.setMatrixAt(na, farM); old.setColorAt(na++, farC); }
      });
      old.count = na; far.name = k ? 'birchFar' : 'oakFar'; far.renderOrder = old.renderOrder; far.castShadow = old.castShadow; far.receiveShadow = old.receiveShadow;
      for (const m of [old, far]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.computeBoundingSphere(); m.boundingSphere.radius += 3; }
      forest.object.add(far); forest.meshes.push(far);
    }
    // the row trees' shadows on the ground: under those within 260 m of the flight's line, as the poplars'
    const rowR = [oakHi, birchHi, oakLo, birchLo].map((g) => g.userData.radius || 1);
    scene.add(flora.makeGroundShadows({ points: rowTrees.filter((p) => p.d < 260).map((p) => ({ x: p.x, z: p.z, r: rowR[p.v] * p.s })), heightAt, ...shadeOpt }).object);
    await ctx.yield();
    const wood = flora.makeScatter({ rng: S['trees.wood'], points: woodTrees, variants: [woodHi, woodLo, woodEdge, birchHi, birchLo], material: treeMat, heightAt, tint: 0.1, tilt: WOOD_TILT,
      // a little dimmer inside than at its edges
      shade: (x, z) => { const k = night ? 1.3 : 0.92 + 0.16 * (1 - smoothstep(4, 22, edgeOf(x, z))); return [k, k, k * 0.96]; } });
    // the trees in the sun's way to the glade at this hour leave the wood with what they were dealt
    [woodHi, woodLo, woodEdge, birchHi, birchLo].forEach((geo, v) => {
      const mine = woodTrees.filter((p) => p.v === v), mesh = wood.meshes.find((m) => m.geometry === geo); let n = 0;
      if (!mesh || !mine.some((p) => p.gone)) return;
      mine.forEach((p, i) => { if (p.gone) return; mesh.getMatrixAt(i, farM); mesh.getColorAt(i, farC); mesh.setMatrixAt(n, farM); mesh.setColorAt(n++, farC); });
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    });
    scene.add(forest.object, wood.object);
    await ctx.yield();
    const willowG = flora.willowGeometry({ rng: S['trees.willow'], detail: 1, height: 12.5 });   // it stands 50 m and more from our line: the plainer make
    await ctx.yield();
    const willow = new THREE.Mesh(willowG, treeMat);
    willow.scale.setScalar(2.6); willow.rotation.y = S['trees.willow'].range(0, TAU); scene.add(willow);       // a great tree: some 32 m
    await ctx.yield();
    // one tree keeps pace beside the queen with her hedge, however fast she runs (the book's joke)
    const pacer = new THREE.Mesh(oakHi, treeMat); pacer.scale.setScalar(1.35); pacer.frustumCulled = false; scene.add(pacer);
    const pacerShadow = new THREE.Mesh(oakLo, new THREE.ShaderMaterial({ uniforms: { ...gU, uIAnim: { value: new THREE.Vector4() } }, vertexShader: SHADOW_VERT(false), fragmentShader: shadowFrag, ...shadowOpts }));
    pacerShadow.frustumCulled = false; pacerShadow.renderOrder = -1; pacer.add(pacerShadow);
    await ctx.yield();

    // the live flowers, the elephants and the insects are built last (below); their streams are named here
    const fl = S.flowers, gi = S.giants, er = S.elephants;

    // ------------------------------------------------------------ the little trains along the first brook, and their leap over the brook
    // The railway runs along the first brook, RAIL = 7.8 m from its middle: on the far bank on the board's middle side
    // (-MX) and on the near bank on her lane's side (+MX), where it passes behind the queen's lane head. Where the
    // route's own line crosses the brook the rail is broken, and a train leaps the brook from bank to bank OVER OUR
    // LINE. Each bank's rail rises on a timber trestle to a ramp top; both tops stand at one height, LEAP_TOP: LEAP_OVER
    // = 3.5 m over our line's own height where it crosses the brook. A ramp is twice as long as its top stands over
    // the rail abreast of the crossing (RAMP), leaves its foot level and its top at 1 in 2 (the rail's level at its
    // foot is the land's, so one ramp rises a little more than the other: rampY), and ends in the air over the
    // bank's edge. Between the two ramp tops a train flies FLIGHT = the channel's whole breadth (both banks and the
    // water, 18.4 m) on the arc of a thing thrown off a 1 in 2 ramp (ARC = FLIGHT / 8 = 2.3 m over the ramp tops at
    // its middle). The leap is LEAP_HALF = RAMP + FLIGHT / 2 either side of our crossing.
    // OUR LINE GOES THROUGH THE GAP, UNDER THE ARC: the trains pass over the eye. Measured on seeds 1 to 300, at every
    // phase of the round and as flown at entry clocks of 0, 15, 30, 45 and 60 s: the nearest timber of either ramp
    // stands 7.9 m or more from our line; engine and carriages (their whole boxes, wheels and all) come no nearer
    // than 5.1 m, overhead (the rails' level at the arc's top is LEAP_OVER + ARC = 5.8 m over the line where the two
    // cross); their steam no nearer than 11.5 m.
    // THE RAIL'S ENDS are places: at either end the rail runs level into the first range of the hills through a stone
    // mouth, set where the hillside has risen 1 m over the rail (MOUTH_NEG, MOUTH_POS: the same rule on both sides,
    // looked for from the board's edge outward), with a vault behind it. A train is drawn VAULT = 60 m past a
    // mouth and no further (2.5 seconds of its run, behind the dark that closes the tunnel 3 m in; the round counts
    // it), so the vault runs that far at the least: a hill's head can fall away again behind its mouth, and a
    // train under a hollow of it would stand out of the turf. From there the vault runs on into the hill until
    // the hillside stands VAULT_COVER = 1 m over every stone of its ring, the crown and both walls (vaultEnd: the
    // mouth's own search carried on, 2 m at a time, to 400 m at the most): so its far end is under the hill.
    // Under the hill the rail goes on along the land's own roll (it can rise or fall some metres in a vault's
    // length), and the vault goes with it: its floor is laid 0.6 m under the rail in lengths of VAULT_STEP = 10 m,
    // so that a train's roof stays under its crown all the way. No steam rises through the hill.
    // THE TRAINS RUN THEIR ROUND ON THE WORLD'S CLOCK, whether anyone is there or not, and the round is the same at
    // every moment of it: out of the mouth on the board's middle side, along the far bank, up the ramp and over the
    // brook, down the far ramp, on along the near bank behind her lane's head and in under the other mouth (TDIR =
    // +MX); under the hills the round closes, unseen. They follow one another TRAIN_GAP = two files apart at
    // TRAIN_V = 24 m a second, so a train leaps the brook every eight seconds and one is always on the open rail
    // within a file of the leap. A leap, from the engine's taking the one ramp to the last carriage's leaving the
    // other, lasts some five seconds; the ramps and the air between them stand empty some three seconds at a time,
    // and the way from the hill's table down to the brook is longer than both together, so a whole leap falls in
    // it whenever one comes. The round is a whole number of gaps long: the least that holds the open
    // rail, both vaults and one train's trail of steam (TRAIL: the longer of the train and its steam), so that a
    // train with its steam is wholly under the hill, past the vault's end, where the round's end meets its
    // beginning. A train is not drawn past a vault's end (trainHid), and none casts a shadow under the hill.
    const CAR0 = 12.6, CAR_D = 11.4, NPUFF = 14, PUFF_D = 4.4, TRAIL = Math.max(CAR0 + 3 * CAR_D + CAR_D / 2, NPUFF * PUFF_D - 5.5), VAULT = 60;
    const ZB_NEAR = B(1) + RAIL, ZB_FAR = B(1) - RAIL, LEAP_X = xAtZ(B(1)), TDIR = MX;
    // THE RAIL RUNS ON A TIMBER TRESTLE over the brook's meadow, RAIL_UP = 3 m over the grass (the brook floods; a
    // man and a half could walk under it), across the board's six middle files; over the outermost file on either
    // side (from 3 SQ to the board's edge at 4 SQ) it comes down to its ballast bank, and runs on the ground from
    // the board's edge into the hills' mouths.
    const RAIL_UP = 3, railLift = (x) => RAIL_UP * (1 - smoothstep(3 * SQ, 4 * SQ, Math.abs(x)));
    const railY = (x, z) => heightAt(x, z) - rangesAt(x, z) + 0.35 + railLift(x);
    const LEAP_OVER = 3.5, LEAP_TOP = path.posAtDist(D_B1, routeV).y + LEAP_OVER, FLIGHT = 2 * (BROOK + 5), ARC = FLIGHT / 8;
    const RAMP = 2 * (LEAP_TOP - 0.5 * (railY(LEAP_X, ZB_FAR) + railY(LEAP_X, ZB_NEAR))), LEAP_HALF = RAMP + FLIGHT / 2, LX0 = LEAP_X - LEAP_HALF, LX1 = LEAP_X + LEAP_HALF;
    const railZ = (x) => { const t0 = clamp((x - LX0) / (LX1 - LX0), 0, 1), t = MX > 0 ? t0 : 1 - t0; return lerp(ZB_FAR, ZB_NEAR, t * t * (3 - 2 * t)); };
    const mouthAt = (sg) => { let x = 4 * SQ; while (x < 2000 && rangesAt(sg * x, railZ(sg * x)) < 1) x += 2; return sg * x; }, MOUTH_NEG = mouthAt(-1), MOUTH_POS = mouthAt(1);
    // a ramp's height at the share q of its length from its foot (level `foot`): level at the foot, 1 in 2 at the top
    const RY_A = railY(LX0, railZ(LX0)), RY_B = railY(LX1, railZ(LX1));
    const rampY = (foot, q) => { const m = RAMP / (2 * (LEAP_TOP - foot)); return foot + (LEAP_TOP - foot) * q * q * (3 - m + (m - 2) * q); };
    const TR = { x: 0, y: 0, z: 0 }, TR2 = { x: 0, y: 0, z: 0 };
    // the rail's place and level at x: on its bank, on a ramp, or in the air over the gap (the arc)
    const trainAt = (x, out) => {
      const sx = x - LEAP_X, a = Math.abs(sx); out.x = x; out.z = railZ(x);
      out.y = a >= LEAP_HALF ? railY(x, out.z) : a <= FLIGHT / 2 ? LEAP_TOP + ARC * (1 - 4 * sx * sx / (FLIGHT * FLIGHT)) : rampY(sx < 0 ? RY_A : RY_B, (LEAP_HALF - a) / RAMP);
      return out;
    };
    // a train's place on its round: the engine's x at the world's clock t, for the n-th train (the round begins
    // VAULT inside the mouth the trains come out of); under a hill past a vault's end nothing of a train is drawn
    const TRAIN_V = 24, TRAIN_GAP = 2 * SQ, RAIL_OUT = TDIR > 0 ? MOUTH_NEG : MOUTH_POS;
    const TRAINS = Math.ceil((MOUTH_POS - MOUTH_NEG + 2 * VAULT + TRAIL) / TRAIN_GAP), ROUND = TRAINS * TRAIN_GAP;
    const trainX = (t, n, ph) => RAIL_OUT + TDIR * (((TRAIN_V * t + (n + ph) * TRAIN_GAP) % ROUND + ROUND) % ROUND - VAULT);
    const trainHid = (x) => x < MOUTH_NEG - VAULT || x > MOUTH_POS + VAULT;
    {
      // THE TRACK, on both banks: bright rails on dark sleepers (drawn within SLEEPERS = 170 m of the leap, as far as
      // a sleeper can be told from the next). On the trestle they lie on two pale stringers carried by bents 8 m
      // apart (two battered legs and a cap each) with a pale brace running from each bent's head to the next one's
      // foot on both faces; toward the mouths, on a bank of pale ballast with sloping shoulders. Over each ramp of
      // the leap the rails run on a timber deck carried by trestle bents (two legs, a cap, braces and ties) a sixth of the
      // ramp apart, and the deck is broken off at the ramp's top, its planks' ends ragged.
      const g = new Geo(), bal = lin('#a2947e'), steel = lin('#c9cdd3'), tie = lin('#4b3a2b'), timber = lin('#8a6744'), pale = lin('#c2a678'), rr = S.ramps, SLEEPERS = 170;
      const quad = (a, b, d0, d1, l0, l1) => g.poly([[a.x, a.y + l0, a.z + d0], [b.x, b.y + l0, b.z + d0], [b.x, b.y + l1, b.z + d1], [a.x, a.y + l1, a.z + d1]]);
      const rails2 = (a, b, lift) => { g.mat(3, 0.85).col(steel); for (const dz of [-0.78, 0.78]) quad(a, b, dz + 0.13, dz - 0.13, lift, lift); };
      let spans = 0;
      for (const [x0, x1] of [[MOUTH_NEG - 8, LX0], [LX1, MOUTH_POS + 8]]) for (let x = x0; x < x1; x += 8) {
        if (++spans % 10 === 0) await ctx.yield();
        const xb = Math.min(x + 8, x1), a = trainAt(x, TR), b = trainAt(xb, TR2);
        if (railLift((x + xb) / 2) < 0.5) { g.mat(3, 0.1).col(bal); quad(a, b, 1.7, -1.7, -0.25, -0.25); quad(a, b, 3.1, 1.7, -1.0, -0.25); quad(a, b, -1.7, -3.1, -0.25, -1.0); }
        else {
          const ga = heightAt(a.x, a.z) - 0.3, gb = heightAt(b.x, b.z) - 0.3;
          g.mat(3, 0.15).col(pale);
          for (const dz of [-1.45, 1.45]) {
            quad(a, b, dz, dz, -0.25, -0.85);
            g.poly([[a.x, a.y - 0.85, a.z + dz], [a.x, a.y - 1.2, a.z + dz], [b.x, gb, b.z + dz * 1.4], [b.x, gb + 0.35, b.z + dz * 1.4]]);
            g.tube([[a.x, a.y - 0.85, a.z + dz], [a.x, ga, a.z + dz * 1.4]], 0.3, 4);
          }
          g.col(pale, 0.85).box([a.x, a.y - 1.0, a.z], [0.45, 0.35, 3.8]);
        }
        rails2(a, b, -0.05);
      }
      await ctx.yield(); g.mat(3, 0.1).col(tie);
      for (let x = LEAP_X - SLEEPERS; x < LEAP_X + SLEEPERS; x += 0.95) { if (++spans % 60 === 0) { await ctx.yield(); g.mat(3, 0.1).col(tie); } if (Math.abs(x - LEAP_X) < LEAP_HALF) continue; const a = trainAt(x - 0.16, TR), b = trainAt(x + 0.16, TR2); quad(a, b, 1.3, -1.3, -0.19, -0.19); }
      for (const sg of [-1, 1]) {
        await ctx.yield();
        const NB = 6, foot = LEAP_X + sg * LEAP_HALF, top = LEAP_X + sg * FLIGHT / 2, P0 = { x: 0, y: 0, z: 0 }, P1 = { x: 0, y: 0, z: 0 };
        for (let i = 0; i < NB; i++) {
          trainAt(lerp(foot, top, i / NB), P0); trainAt(lerp(foot, top, (i + 1) / NB), P1);
          const a = sg > 0 ? P1 : P0, b = sg > 0 ? P0 : P1;
          g.mat(3, 0.15).col(timber, 0.9 + 0.2 * rr()); quad(a, b, 1.6, -1.6, -0.25, -0.25); quad(a, b, -1.6, 1.6, -0.55, -0.55);
          rails2(a, b, -0.05);
          // the bent under this step's upper end: legs from the ground to the deck, a cap under the deck, a brace
          const hl = P1.y - 0.55 - heightAt(P1.x, P1.z), w = 0.3 + 0.1 * rr();
          g.mat(3, 0.15).col(timber, 0.7 + 0.25 * rr());
          if (hl > 0.5) {
            // (the legs are stouter the taller the bent; to every 3.5 m or so of its height a brace runs across the
            // storey, by turns one way and the other, with a tie between the legs where two storeys meet)
            const wl = w * (1 + hl / 14), NS = Math.max(1, Math.round(hl / 3.5)), hs = hl / NS;
            for (const dz of [-1.25, 1.25]) g.box([P1.x, P1.y - 0.55 - hl / 2 - 0.3, P1.z + dz], [wl, hl + 0.6, wl]);
            g.box([P1.x, P1.y - 0.7, P1.z], [0.34, 0.3, 3.4]);
            for (let k = 0; k < NS; k++) {
              const y1 = P1.y - 0.9 - k * hs, y0 = P1.y - 0.9 - (k + 1) * hs + (k === NS - 1 ? 0.7 : 0), sd = k % 2 ? -1 : 1;
              if (hl > 2) g.tube([[P1.x, y1, P1.z - 1.25 * sd], [P1.x, y0, P1.z + 1.25 * sd]], 0.1, 4);
              if (k > 0) g.box([P1.x, y1, P1.z], [0.22, 0.25, 2.9]);
            }
          }
        }
        // the broken end: three planks run on past the last bent, each its own length
        for (let k = 0; k < 3; k++) { const e = rr.range(0.4, 1.5), d = (k - 1) * 1.05, sl = (P1.y - P0.y) / Math.max(1e-3, Math.abs(P1.x - P0.x)); const q = { x: P1.x - sg * e, y: P1.y + sl * e, z: P1.z };
          g.mat(3, 0.15).col(timber, 0.8 + 0.3 * rr()); quad(sg > 0 ? q : P1, sg > 0 ? P1 : q, d + 0.5, d - 0.5, -0.25, -0.25); }
      }
      await ctx.yield(); const railGeo = g.build(); await ctx.yield();
      const rails = new THREE.Mesh(railGeo, makeLit(env, { instanced: false, side: THREE.DoubleSide })); rails.name = 'rails'; rails.frustumCulled = false; scene.add(rails);
    }
    await ctx.yield();
    {
      // the two mouths: a stone arch, the vault behind it, and the dark of the tunnel 3 m in
      const mg = new Geo(), stone = lin('#9a9082'), R = 5.5, WALL = 3, ring = [[R, 0]], VAULT_COVER = 1, VAULT_STEP = 10;
      for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; ring.push([Math.cos(a) * R, WALL + Math.sin(a) * R]); }
      ring.push([-R, 0]);
      // the vault's floor at v behind its mouth lies 0.6 under the rail's own level there: under the hill the rail
      // goes on along the land's roll, and a level vault would let a train's roof through its crown
      const floorAt = (xm, sg, v) => trainAt(xm + sg * v, TR).y - 0.6;
      // how far behind its mouth a vault runs: as far as a train is drawn, and on to where the hillside is
      // VAULT_COVER over every point of its ring
      const vaultEnd = (xm, sg, zr) => { let v = VAULT; while (v < 400 && ring.some(([dz, dy]) => heightAt(xm + sg * v, zr + dz) < floorAt(xm, sg, v) + dy + VAULT_COVER)) v += 2; return v; };
      for (const xm of [MOUTH_NEG, MOUTH_POS]) {
        const sg = Math.sign(xm), zr = railZ(xm), y0 = floorAt(xm, sg, 0), vault = vaultEnd(xm, sg, zr), nv = Math.ceil(vault / VAULT_STEP), y1 = floorAt(xm, sg, vault / nv);
        mg.mat(3, 0.15).col(stone).tube(ring.map(([dz, dy]) => [xm, y0 + dy, zr + dz]), 1.1, 6);
        for (let n = 0; n < nv; n++) {
          const va = vault * n / nv, vb = vault * (n + 1) / nv, xa = xm + sg * va, xb = xm + sg * vb, ya = floorAt(xm, sg, va), yb = floorAt(xm, sg, vb);
          for (let i = 0; i < ring.length - 1; i++) { const [z0, h0] = ring[i], [z1, h1] = ring[i + 1]; mg.poly([[xa, ya + h0, zr + z0], [xa, ya + h1, zr + z1], [xb, yb + h1, zr + z1], [xb, yb + h0, zr + z0]]); }
        }
        // the dark stands on the vault's own floor 3 m in, so that it closes the vault from wall to wall
        const yd = y0 + (y1 - y0) * 3 * nv / vault;
        mg.mat(3, 0).col([0.004, 0.004, 0.006]).poly(ring.map(([dz, dy]) => [xm + sg * 3, yd + dy, zr + dz]));
      }
      const mouths = new THREE.Mesh(mg.build(), makeLit(env, { instanced: false, side: THREE.DoubleSide })); mouths.name = 'mouths'; mouths.frustumCulled = false; scene.add(mouths);
    }
    await ctx.yield();
    // the steam: puffs with form (a knobbly ball each, of as few faces as a billow of the queen's dust: there are
    // NPUFF to every train on the rail), let go one to every PUFF_D of rail
    const engine = inst(engineGeometry(), TRAINS), cars = inst(carriageGeometry(), 4 * TRAINS);
    const puffG = new Geo(); puffG.mat(3, 0.02).col([0.96, 0.96, 0.98]).blob([0, 0, 0], [1, 0.9, 1], 8, 5, { f: (x, y, z) => 1 + 0.26 * Math.sin(x * 3.1 + 1) * Math.sin(y * 3.4) * Math.sin(z * 2.9 + 2) + 0.1 * Math.sin(x * 7 + y * 5) * Math.sin(z * 6) });
    const puffs = inst(puffG.build(), NPUFF * TRAINS);
    await ctx.yield();

    // ------------------------------------------------------------ the crown on the eighth row, the portal inside it
    const crownG = await crownGeometry(pause), crownY = heightAt(CROWN[0], CROWN[1]) - 0.3;
    const crown = new THREE.Mesh(crownG.geometry, makeLit(env, { instanced: false, side: THREE.DoubleSide, fragExtra: /* glsl */`
      if (id > .5 && id < 1.5) {                                          // the band is chased in lozenges with a stud at every crossing
        float rr = length(vP.xz), band = smoothstep(1.9, 2.5, vP.y) * (1. - smoothstep(18.1, 18.8, vP.y)) * step(16.5, rr) * (1. - smoothstep(19.2, 19.5, rr));
        vec2 lq = vec2(atan(vP.x, vP.z + 1e-4) * 19. / 2.3, vP.y / 2.3), lc = abs(fract(lq) - .5);
        eng = 1. - band * (1. - smoothstep(.03, .1, abs(lc.x + lc.y - .5))) * .5 + band * (1. - smoothstep(.09, .15, length(fract(lq + vec2(.5, 0.)) - .5))) * .45;
      }` }));
    crown.name = 'crown';
    crown.position.set(CROWN[0], crownY, CROWN[1]); crown.scale.setScalar(CROWN_K); scene.add(crown);
    await ctx.yield();
    const crownShadow = flora.makeGroundShadows({ points: [{ x: CROWN[0], z: CROWN[1], r: 21 * CROWN_K }], heightAt, sunDir: SUN, strength: 0.5, stretch: 1.3 }); scene.add(crownShadow.object);
    await ctx.yield();

    // ------------------------------------------------------------ a few great clouds standing round the board; low blue hills at the edge of the country
    // Nine courses, one to each ninth of the compass (a little off it), each through a place 700 to 1400 m from the middle
    // of the board. Down each course three clouds (each 520 to 820 m across, each a shape of its own) follow one another
    // a third of the course apart, at the wind's own speed, on the world's clock. A course runs REACH either way of its
    // place, and REACH is long enough that its two ends lie beyond the distance at which the kit's field has faded a cloud
    // away, from every point of our way (CLOUD_FAR, read from the kit's field below, and the furthest place with its
    // cloud's width, and the route's furthest point, all from the board's middle): a cloud goes round to the other end
    // where no one on the way can see it (the clock wrapped at CLOUD_T = 2 REACH / WSP, from a phase of its own).
    // Three to a course a third apart, one of them is always within a sixth of the course of its place.
    // The ground shadows of the clouds drift the same way at the same speed.
    const cl = S.clouds, cloudAt = [], WIND = [3.4, 1.5], WSP = Math.hypot(WIND[0], WIND[1]), cloudPh = [], SHADE_TILE = 1 / 0.00085, TRAIN = 3;
    for (let i = 0; i < 9; i++) { const a = (i + cl.range(0.15, 0.85)) / 9 * TAU, d = cl.range(700, 1400); cloudAt.push([Math.sin(a) * d, cl.range(420, 520) + d * 0.08, B(4) + Math.cos(a) * d, cl.range(520, 820)]); }
    // each cloud is a field of its own with a stream of its own, built with a pause after it; all share one noise
    for (let i = 0; i < 9; i++) cloudPh.push(cl.range(0, 1));
    const cloudTex = await cloudNoise(S['clouds.noise'], () => ctx.yield());
    const cloudFields = [];
    for (let k = 0; k < 9 * TRAIN; k++) {
      cloudFields.push(makeCloudField({ rng: S['clouds.' + 'fgh'[(k - k % 9) / 9] + k % 9], sky, mode: 'cumulus', at: [cloudAt[k % 9]], noiseTexture: cloudTex, puffs: Math.round(34 * Math.min(1, detail + 0.15)), height: 1.1, towers: 0.3, shadeColor: '#6a7aa6', bump: 1.05, wind: [WIND[0], 0, WIND[1]] }));
      scene.add(cloudFields[k].object);
      await ctx.yield();
    }
    let routeR = 0;
    for (let i = 0; i < NR; i++) routeR = Math.max(routeR, Math.hypot(route[3 * i], route[3 * i + 2] - B(4)));
    const CLOUD_FAR = cloudFields[0].uniforms.uFade.value.w;
    const REACH = CLOUD_FAR + cloudAt.reduce((m, c) => Math.max(m, Math.hypot(c[0], c[2] - B(4)) + c[3]), 0) + routeR, CLOUD_T = 2 * REACH / WSP;
    await ctx.yield();

    // ------------------------------------------------------------ small life: butterflies, dragonflies on the brooks, birds, blue sparks in the wood, thistledown
    const DUR = 50, fauna =F.makeFauna(scene, { light: F.lightFrom(scene) });
    // A BUTTERFLY'S PLACE is dealt beside our line and kept only where its whole roam (the kit's: 3.5 m across the
    // ground, under a metre up and down, and its wings: 4 m in all) stays 2.5 m from the flight and a metre over
    // the grass; every place is dealt whether or not it is kept.
    const BF_ROAM = 4, besideAt = (rng, n, d0, d1, spread, lift) => {
      const at = [], p = new THREE.Vector3(), t = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const d = rng.range(d0, d1), w = rng.sign() * rng.range(BF_ROAM + 2.5, spread), up = rng.range(lift[0], lift[1]);
        path.posAtDist(d, p); path.tangentAtDist(d, t);
        const x = p.x - t.z * w, z = p.z + t.x * w, y = Math.max(p.y + up, heightAt(x, z) + 1);
        if (lineDist(x, y, z) >= BF_ROAM + 2.5) at.push([x, y, z]);
      }
      return at;
    };
    const bfAt = besideAt(S.bf, Math.round(44 * dens * detail), 0, D_GATE, 34, [-10, 2]);
    fauna.add(F.makeButterflies({ rng: S.bf, positions: bfAt, count: bfAt.length, size: 2.1 }));
    // a dragonfly darts 3.5 m about its place over a brook (the kit's roam) and is half a metre long: 4 m in all
    const dragAt = [], dr = S.drag;
    for (let k = 1; k <= 7; k++) for (let i = 0; i < 4; i++) { const x = dr.range(-70, 70), z = -k * SZ + dr.range(-3, 3), y = heightAt(x, z) + dr.range(1.5, 5); if (lineDist(x, y, z) >= 4 + 2.5) dragAt.push([x, y, z]); }
    fauna.add(F.makeDragonflies({ rng: S.dragkit, positions: dragAt, count: dragAt.length, size: 2.4 }));
    await ctx.yield();
    // A FLOCK FLIES OVER THE LAND IT IS OVER. The kit deals the birds' places round a looped way; the flock is then
    // lifted whole so that its lowest bird at the lowest of its wander clears the highest ground under its whole
    // reach by `clear` metres (a height of its own kind), and the highest point of our line under that reach by 2.5 m
    // beyond the bird's whole roam taken as a ball (rad: its wander's breadth and height together), whichever way it strays.
    const flockOver = (o, clear) => {
      const f = F.makeFlock({ ...o, center: [o.center[0], 0, o.center[1]] }), iA = f.geometry.attributes.iA.array, iB = f.geometry.attributes.iB.array;
      const u = f.uniforms, w = u.uWander.value, soar = o.form === 'soar', wing = 1.4 * u.uNear.value.x, d = f.route.data, N = f.route.N;
      let lat = 0, down = 0, cx = 0, cz = 0, R = 0, low = 1e9, top = -1e9, lineTop = -1e9;
      for (let i = 0; i < f.count; i++) { lat = Math.max(lat, Math.hypot(iA[i * 4], iB[i * 4 + 3])); down = Math.max(down, -iA[i * 4 + 1]); }
      const rv = w.y + (soar ? u.uSoar.value.z : 0), rad = Math.hypot(soar ? 1.82 * u.uSoar.value.x : Math.hypot(1.5 * w.x, w.z), rv), reach = lat + rad + wing, drop = down + rv + wing;
      for (let i = 0; i < N; i++) { cx += d[i * 4] / N; cz += d[i * 4 + 2] / N; low = Math.min(low, d[i * 4 + 1]); }
      for (let i = 0; i < N; i++) R = Math.max(R, Math.hypot(d[i * 4] - cx, d[i * 4 + 2] - cz));
      R += reach;
      const st = Math.max(4, R / 12);
      for (let x = -R; x <= R; x += st) for (let z = -R; z <= R; z += st) if (x * x + z * z <= (R + st) * (R + st)) top = Math.max(top, heightAt(cx + x, cz + z));
      for (let i = 0; i < route.length; i += 3) if (Math.hypot(route[i] - cx, route[i + 2] - cz) < R + 2.5) lineTop = Math.max(lineTop, route[i + 1]);
      f.object.position.y = Math.max(top + clear + drop, lineTop + 2.5 + down + rad + wing) - low;
      return f;
    };
    // swifts hunt over her lane two hedges' height over the land; crows keep over the wood's roof; the geese pass
    // over the crown higher than the tallest chessman stands
    fauna.add(flockOver({ rng: S.swifts, species: 'swifts', count: Math.round(26 * dens), center: [LX + MX * 44, B(1.5)], radius: 40 }, 2 * HEDGE_TOP));
    fauna.add(flockOver({ rng: S.crows, species: 'crows', count: Math.round(13 * dens), center: [LX, WZ0 - WD / 2], radius: 78 }, 1.25 * TREE_H));
    await ctx.yield();
    fauna.add(flockOver({ rng: S.geese, species: 'geese', count: 15, center: [CROWN[0], CROWN[1] - 40], radius: 210 }, 1.25 * PIECES.king.h));
    // the wood's own small life: butterflies along the ride, and small birds wheeling in the glade's opening over the
    // fawn: their way a quarter of the glade's radius round its middle, each bird's own ring a sixth of it, so the
    // whole flock stays inside the glade's rim, and its lowest bird 2.5 m over the fawn's ears
    const wbfAt = besideAt(S.woodbf, Math.round(26 * dens * detail), D_WIN, D_WOUT, 15, [-5, 3]);
    fauna.add(F.makeButterflies({ rng: S.woodbf, positions: wbfAt, count: wbfAt.length, size: 1.5 }));
    fauna.add(flockOver({ rng: S.woodbirds, species: 'swifts', form: 'soar', count: Math.round(12 * dens), center: GLADE, radius: GLADE_R / 4, height: 0, spread: [GLADE_R / 4, 2, GLADE_R / 4],
      soarRadius: GLADE_R / 6, soarLift: 2, speed: 5, wander: [0, 1, 0, 0.7] }, FAWN_H + 2.5));
    // A BLUE SPARK'S PLACE is dealt over the wood's own ground (anywhere in the file's breadth and the wood's depth),
    // 2 to 17 m over its floor, and kept only where its whole drift (the kit's: 2.8 m across the ground, 0.6 m up
    // and down) and its glow (0.9 m) stay 2.5 m from the flight. (No spark is thinned by the eye's nearness: the
    // kit's near fade is set to nothing, since no spark can come so near.)
    const sparkAt = [], sp = S.sparks, SPARK_ROAM = 3 + 0.9;
    for (let i = 0, n = Math.round(70 * detail); i < n; i++) {
      const x = WX0 + sp.range(0, SQ), z = WZ0 - sp.range(0, WD), up = sp.range(2, 17), y = heightAt(x, z) + up;
      if (lineDist(x, y, z) >= SPARK_ROAM + 2.5) sparkAt.push([x, y, z]);
    }
    fauna.add(F.makeFireflies({ rng: S.sparks, positions: sparkAt, count: sparkAt.length, color: '#6ab4ff', color2: '#b8dcff', size: 0.6, nearFade: [0, 0.01] }));
    await ctx.yield();
    // thistledown: the kit's following field of drifting seeds (fx.makeParticles, preset 'pollen') in its default form
    const down = fx.makeParticles({ rng: S.down, preset: 'pollen', time: env.uTime, count: Math.round(420 * dens * detail), colors: ['#ffffff', '#f4f8ff', '#fff6e0'], size: [0.06, 0.17], intensity: night ? 0.5 : 1.0, additive: 0.3, velocity: [0.9, 0.1, 0.5] });
    scene.add(down.object);
    const puff = glide && glide.pawn ? fx.makeParticles({ rng: S.puff, preset: 'petals', time: env.uTime, follow: false, center: [glide.to[0], heightAt(glide.to[0], glide.to[1]) + 17, glide.to[1]], box: [38, 36, 38], count: 800, size: [0.7, 1.7], velocity: [0.6, 2.2, 0.3], colors: ['#ff9ec0', '#ffffff', '#ffd84a', '#ff7a3a'] }) : null;
    if (puff) { scene.add(puff.object); puff.setOpacity(0); }
    await ctx.yield();
    // ============================================================ built last
    // ------------------------------------------------------------ the garden's flowers (its insects are the common butterflies; the looking-glass insects are met after the first brook, below)
    const FK = ['lily', 'rose', 'daisy', 'larkspur'], flowers = [], FH = FLOWER_H, HEAD_R = { lily: 4.2, rose: 3.0, daisy: 3.7, larkspur: 1.8 }, GIANT_OFF = 1.5, SWAY = 0.05;
    // the willow, a great tree of some 32 m with a crown WILLOW_R = 17 m in radius, stands on the lower slope of the
    // hill that faces the board, on the hand of her lane (+MX; the hill's own piece stands at the garden's end below it): 55 to 80 m
    // toward the board from the hill's middle, its crown's rim one crown's width (2 WILLOW_R) and up to 9 m more from our line
    const wp = S.willowplace, WILLOW_R = 17, willowAt = [MX * (3 * WILLOW_R + wp.range(0, 9)), HZC - wp.range(55, 80)];
    willow.position.set(willowAt[0], heightAt(willowAt[0], willowAt[1]) - 0.3, willowAt[1]);
    const willowShadow = flora.makeGroundShadows({ objects: [willow], heightAt, ...shadeOpt }); scene.add(willowShadow.object);
    // ------------------------------------------------------------ the live flowers: the garden on the hill, the border of the avenue, the giants where the elephants work
    const TINTS = { lily: [[1, 1, 1], [1.1, 0.78, 0.5], [1.05, 1.15, 0.7]], rose: [[1, 1, 1], [1.12, 1.6, 1.5], [0.85, 0.5, 0.6], [1.15, 1.9, 1.3]], daisy: [[1, 1, 1], [1, 0.97, 0.7], [1, 0.82, 0.9]], larkspur: [[1, 1, 1], [1.25, 0.8, 1.05], [0.75, 1.1, 1.1]] };
    // would a bloom stand in the flight's way? Heights included: its head (rim margin) or its stem (stem margin).
    // The margins hold for the bloom's whole sway, not its rest place: the plant leans in the wind by 0.035 each way,
    // which carries its head SWAY = 0.05 of its height from where it rests (its head turns and nods inside its own
    // radius, which the rim's measure holds already).
    const flowerInLane = (x, z, s, kind, rim = 13, stem = 8) => { const top = FH[kind] * s, r = HEAD_R[kind] * s, sway = SWAY * top; return inLane(x, z, top - r, top + r, r, rim + sway) || inLane(x, z, 0, top, 0.5, stem + sway); };
    // THE GARDEN'S BEDS, the whole way we fly over the hill: back along the table to where the flight begins, and down
    // the hill to its foot (counted both ways from zB, 4 m before the table's middle, in steps of BED_PITCH). One bed on
    // either side of our line to every BED_PITCH = 20 m of the way, each BED_L = 15 m long (a grass path of 5 m between
    // two beds) and three rows deep, the rows ROW_D = 5.2 m apart from BED_IN = 12 m out: tiger-lilies nearest, then
    // roses, then larkspurs; four blooms to a row: 12 blooms to a bed of 15 m by 15.6 m (one to every 19.5
    // square metres; heads 6 to 11 m across, so the rows close over). Every bloom is 1 to 1.3 times its kind's size,
    // so its head stands at or over the height we fly, and its rim keeps its own crown's width from our line (its
    // stem 3 head radii off or more). The first row are full blooms, the rows behind them plain copies.
    // Between the beds the turf under our line is sown with small blooms (0.28 to 0.4 of their kind's size), one to
    // every 60 square metres, wherever the lane rule lets one stand under us with the hedges' margin (HEDGE_M): plain
    // copies all.
    const gd = S.garden, BED_PITCH = 20, BED_L = 15, BED_IN = 12, ROW_D = 5.2, PER_ROW = 4, ROWS = ['lily', 'rose', 'larkspur'], WAY = HRZ - 4, zB = HZC - 4, BACK = zS - zB;
    const clearOfStaged = (x, z, r) => !stagedAt.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r) && Math.hypot(x - willowAt[0], z - willowAt[1]) > 6 + r;
    const bed = (k, rng) => {
      for (const sx of [-1, 1]) for (let r = 0; r < ROWS.length; r++) for (let j = 0; j < PER_ROW; j++) {
        const kind = ROWS[r], sc = rng.range(1, 1.3), z = zB - k * BED_PITCH - (j + 0.5 + 0.5 * (r % 2)) * BED_L / PER_ROW + rng.range(-0.8, 0.8), off = Math.max(BED_IN + r * ROW_D + rng.range(-0.8, 0.8), 3 * HEAD_R[kind] * sc), x = sx * off;
        const q = { x, y: heightAt(x, z), z, s: sc, kind, yaw: rng.range(0, TAU), ph: rng.range(0, 40), tint: rng.pick(TINTS[kind]), lo: r > 0 };
        if (hillAt(x, z) >= 1.5 && clearOfStaged(x, z, HEAD_R[kind] * sc) && !flowerInLane(x, z, sc, kind, HEDGE_M, HEDGE_M)) flowers.push(q);
      }
    };
    const small = (rng, z0, len) => {
      for (let i = 0; i < Math.round(len * 2 * BED_IN / 60); i++) {
        const kind = rng.pick(FK), sc = rng.range(0.28, 0.4), x = rng.range(-BED_IN, BED_IN), z = z0 - rng.range(0, len);
        const q = { x, y: heightAt(x, z), z, s: sc, kind, yaw: rng.range(0, TAU), ph: rng.range(0, 40), tint: rng.pick(TINTS[kind]), lo: true };
        if (hillAt(x, z) >= 1.5 && !flowerInLane(x, z, sc, kind, HEDGE_M, HEDGE_M)) flowers.push(q);
      }
    };
    // (down the hill first, on the streams they have always drawn from; then the table's back, on a stream of its own)
    for (let k = 0; (k + 1) * BED_PITCH <= WAY; k++) bed(k, gd);
    small(S.sown, zB, WAY);
    for (let k = 1; k * BED_PITCH <= BACK; k++) bed(-k, S.table);
    small(S.table, zS, BACK);
    // THE LOOKING-GLASS INSECTS ARE MET AFTER THE FIRST BROOK, BY A BUSH. In the rank between the first brook and the
    // second our line runs beside a hedge; a hedgerow tree can hardly ever stand so near it (its crown would hang
    // into our line), so the bushes are the hedge's own on every visit: of the run nearest our line in that rank,
    // the end bush of every length's end that is not grown into the next length, taken as we come to them, each at
    // least half a length from the one before, three at most. A bush is as broad as its hedge and stands the
    // hedge's height. Where a slender hedgerow tree does stand in that hedge, an end within its crown and a
    // rocking-horse-fly's swing of it is passed over.
    // (a rocking-horse-fly's size and its reach in plan from its place to its farthest point: its make is further on)
    const ROCK_S = 1.5, ROCK_R = 2.8 * ROCK_S;
    const treeBy = (x, z, m) => rowTrees.some((t) => Math.hypot(t.x - x, t.z - z) < rowProf[t.v].top * t.s + m);
    const bushRuns = hedgeAt.filter((q) => Math.abs(q[1] + 1.5 * SZ) < 1 && q[4]), bushes = [];
    const runOff = (q) => Math.min(...hedgeLen.filter((h) => h[0] === q).map((h) => path.nearestXZ(q[0], h[1]).dist));
    const bushRun = bushRuns.sort((qa, qb) => runOff(qa) - runOff(qb))[0];
    if (bushRun) {
      const w = 1 / Math.sqrt(bushRun[3]), hb = HBX * w, hl = HBZ * w, at = hedgeLen.filter((h) => h[0] === bushRun).map((h) => h[1]), ends = [];
      for (const zc of at) for (const sg of [1, -1]) if (!at.some((z2) => Math.abs(z2 - zc - sg * HSL) < 1)) ends.push(zc + sg * (hl - hb));
      for (const z of ends.sort((za, zb) => zb - za)) {
        if (bushes.length < 3 && !bushes.some((o) => Math.abs(o.z - z) < HSL / 2) && !treeBy(bushRun[0], z, 2 * hb + ROCK_R)) bushes.push({ x: bushRun[0], z, r: hb, top: HBY * bushRun[3], away: Math.sign(bushRun[0] - xAtZ(z)) || 1 });
      }
    }
    // BREAD-AND-BUTTERFLIES creep and flutter low over the grass at the hedge's foot by those bushes, on the face
    // of the hedge away from our line (between the hedge and her lane's strip), each with its whole reach (its roam
    // and its wing together) 0.2 to 1.2 m clear of the leaves. Four are dealt to a bush, by turns before it and
    // beyond it, each from one to BREAD_FAR times clear of the bush's rocking-horse-fly (the swing's end, the two
    // creatures' reaches together). By a bush a bread-and-butterfly is BREAD_BUSH of the size it is dealt (the
    // garden's, 10 to 12 m over the wings, would not go between a hedge and her strip, which lie 9 m apart: these
    // are 3.9 to 4.7 m, less than their bush is high). Each is so low that the lowest beat of a wing brushes the grass
    // tops: a bread-and-butterfly's wing dips BREAD_DIP of its size under its middle (its beat, its roll and its
    // nod together), it rises and falls BREAD_BOB about its place, and its farthest point is BREAD_REACH of its
    // size from its middle. Each is dealt whole, then kept only where its whole roam and reach stay 2.5 m from our
    // line, out of her lane's strip, off the brooks' banks and the railway's, and clear of every hedge length's
    // leaves, of every bush's swing, of the bread-and-butterflies kept before it, of a piece staged off its square
    // and of what stands in the field (stooks, apple trees, heaps, sheep, a cottage, a bridge, a hedgerow tree's crown).
    const bfr = S.breadflies, bfly = [], BREAD_DIP = 1.3, BREAD_BOB = 1.25, BREAD_REACH = 2.1, BREAD_BUSH = 0.4, BREAD_FAR = 1.6;
    const inHedge = (x, z, m) => hedgeLen.some(([q, zc]) => Math.abs(x - q[0]) < HBX / Math.sqrt(q[3]) + m && Math.abs(z - zc) < HBZ / Math.sqrt(q[3]) + m);
    const inSwing = (x, z, m) => bushes.some((o) => Math.hypot(x - o.x - o.away * (o.r + 0.63 * ROCK_S), Math.max(0, Math.abs(z - o.z) - 0.9 * o.r)) < ROCK_R + m - 0.01);
    const standsBy = (list, x, z, m, ix, iz, rad) => list.some((q) => Math.hypot(q[ix] - x, q[iz] - z) < m + rad(q));
    const inField = (x, z, m) => standsBy(stookAt, x, z, m, 0, 1, (q) => 2.5 * q[3]) || standsBy(appleAt, x, z, m, 0, 1, (q) => 3.8 * q[3]) || standsBy(cockAt, x, z, m, 0, 1, (q) => 1.3 * q[3])
      || standsBy(flock, x, z, m, 'x', 'z', (q) => 1.5 * q.k) || standsBy(cottageAt, x, z, m, 0, 2, () => 8) || standsBy(bridgeAt, x, z, m, 0, 1, () => 6) || treeBy(x, z, m);
    for (const bu of bushes) for (let i = 0; i < 4; i++) {
      const far = bfr.range(1, BREAD_FAR), out = bfr.range(0.2, 1.2), ph = bfr.range(0, 40), r = bfr.range(1.6, 2.2), sc = BREAD_BUSH * bfr.range(2.3, 2.8), R = r + BREAD_REACH * sc;
      const x = bu.x + bu.away * (bu.r + R + out), z = bu.z + (i % 2 ? -1 : 1) * (0.9 * bu.r + far * (ROCK_R + R));
      // (the grass tops under it: the highest turf under its whole roam and reach)
      let turf = heightAt(x, z); for (let j = 0; j < 8; j++) turf = Math.max(turf, heightAt(x + Math.sin(j * TAU / 8) * R, z + Math.cos(j * TAU / 8) * R));
      const y = turf + BREAD_BOB + BREAD_DIP * sc + 0.2;
      if (lineDist(x, y, z) < Math.hypot(r, BREAD_BOB) + BREAD_REACH * sc + 2.5 || inStrip(x + bu.away * R, z) || inHedge(x, z, R) || inSwing(x, z, R) || bfly.some((o) => Math.hypot(o.a[0] - x, o.a[2] - z) < o.R + R)) continue;
      if (Math.abs(z - railBank(x)) < R + 5 || Math.abs(z - B(1)) < R + BROOK + 3 || Math.abs(z - B(2)) < R + BROOK + 3 || nearStaged(x, z, R) || inField(x, z, R)) continue;
      bfly.push({ a: [x, y, z], ph, r, s: sc, R });
    }
    const breadFlies = inst(breadFlyGeometry(), bfly.length, litD);
    bfly.forEach((b, i) => breadFlies.anim(i, 0.3, 0.8, 8 + (i % 3), b.ph));
    for (let z = WZ1 - 14; z > CROWN[1] + 30; z -= 12) for (const sx of [-1, 1]) {
      const x = XW + sx * (12.5 + fl.range(-1, 1)), zz = z + fl.range(-2, 2), s = fl.range(0.5, 0.72), kind = fl.pick(FK), q = { x, y: heightAt(x, zz), z: zz, s, kind, yaw: fl.range(0, TAU), ph: fl.range(0, 40), tint: fl.pick(TINTS[kind]) };
      // (a bloom of the border keeps one and a half of its own breadth from our line, rim and stem, as the giants
      // do, and never less than the border's 8 m)
      const off = Math.max(8, GIANT_OFF * 2 * HEAD_R[kind] * s);
      if (Math.abs(zz - B(7)) > 7 && !flowerInLane(x, zz, s, kind, off, off)) flowers.push(q);
    }
    const mz0 = -MEAD[1] * SZ, giants = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      // sixteen places, four by four, counted from the square's edge toward her lane (so mirrored with her side)
      const x = MX * (SQ + 4 + i * 22 + gi.range(-4, 4)), z = mz0 - (13 + j * 23) * SZ / SQ + gi.range(-5, 5), kind = FK[(i + j * 3) % 4];
      // A giant bloom is larger than a cottage: a lily's head 20 to 27 m across, a daisy's 18 to 24, a rose's 14 to
      // 19, a larkspur's spire 9 to 12 (a cottage here is 9 m long, an elephant 12 m from trunk to tail), on a stem
      // 17 to 40 m tall: of the chessmen's own size. It stands whole beside the flight: neither its rim nor its stem
      // within GIANT_OFF = one and a half of its own head's breadth of the flight's line, and clear of a staged piece.
      const gs = gi.range(2.4, 3.2), gyaw = gi.range(0, TAU), gph = gi.range(0, 40), gt = gi.pick(TINTS[kind]), broad = 2 * HEAD_R[kind] * gs;
      if (flowerInLane(x, z, gs, kind, GIANT_OFF * broad, GIANT_OFF * broad) || !clearOfStaged(x, z, broad / 2)) continue;
      flowers.push({ x, y: heightAt(x, z), z, s: gs, kind, yaw: gyaw, ph: gph, tint: gt }); giants.push(flowers[flowers.length - 1]);
    }
    // small flowers on the wood's floor, as tall as the ferns: none within 4 m of the ride, 3 m of the fawn's way or 2 m of a trunk
    const wf = S.woodflowers;
    for (let i = 0, tries = 0; i < Math.round(10 * dens) && tries < 600; tries++) {
      const x = WX0 + wf.range(4, SQ - 4), z = WZ0 - wf.range(4, WD - 4), kind = wf.chance(0.5) ? 'daisy' : 'larkspur', s = wf.range(0.28, 0.42), yaw = wf.range(0, TAU), ph = wf.range(0, 40), tint = wf.pick(TINTS[kind]);
      if (Math.abs(z - B(6)) < 4 || flowerInLane(x, z, s, kind, 4, 2.5) || fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3) || woodTrees.some((q) => Math.hypot(q.x - x, q.z - z) < 2)) continue;
      flowers.push({ x, y: heightAt(x, z), z, s, kind, yaw, ph, tint }); i++;
    }
    // and in the hem before the wood, among the bracken: one small bloom to every 150 square metres (plain copies)
    // (on a stream of their own, 'hemblooms': the wood's floor flowers above are dealt in a loop that tries again)
    const hb = S.hemblooms;
    for (let i = 0; i < Math.round(2 * 30 * (SZ / 3) / 150); i++) {
      const kind = hb.pick(FK), sc = hb.range(0.28, 0.42), x = XW + hb.range(-30, 30), z = WZ0 + BROOK + 5 + hb.range(0, SZ / 3);
      const q = { x, y: heightAt(x, z), z, s: sc, kind, yaw: hb.range(0, TAU), ph: hb.range(0, 40), tint: hb.pick(TINTS[kind]), lo: true };
      if (!flowerInLane(x, z, sc, kind, HEDGE_M, HEDGE_M) && !fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 3)) flowers.push(q);
    }
    // each kind of flower stands in two sets: the full bloom within 40 m of the flight's line (and every giant), a plain copy beyond;
    // in the garden the full blooms are the beds' first rows
    const FSETS = [];
    for (const q of flowers) if (q.lo === undefined) q.lo = q.s < 1.8 && path.nearestXZ(q.x, q.z).dist > 40;   // the garden's blooms say which they are (above)
    for (const lo of [false, true]) for (const k of FK) {
      const fg = flowerGeometry(k, lo ? S['flowers.lo'] : S['flowers.' + k], lo), mine = flowers.filter((q) => q.kind === k && q.lo === lo), s = inst(fg.geometry, mine.length, litD);
      s.list = mine; FSETS.push(s);
      mine.forEach((q, i) => { q.i = i; q.H = fg.H; s.tint(i, q.tint, 0.25, night ? 0.12 : 0); });
      await ctx.yield();
    }
    const giantShadows = flora.makeGroundShadows({ points: giants.map((q) => ({ x: q.x, z: q.z, r: 3.2 })), heightAt, sunDir: SUN, strength: night ? 0.3 : 0.5, stretch: 2.4 });
    scene.add(giantShadows.object);
    // ELEPHANTS at the giant blooms, nine of them, each as big as its bloom (12 m from trunk to tail at ESC = 2): each
    // stands on its own bloom with its trunk deep in it, fanning its ears slowly and turning a little from side to side
    // (on the world clock, each on a round of its own); none flies. Each casts a soft shadow where the sun's ray
    // through it meets the ground, and so
    // does every giant bloom's head (and, on the same sheet of soft shadows, the train's engine and carriages).
    const eleph = [], ESC = 2, EP1 = { x: 0, y: 0, z: 0, yaw: 0 };
    for (const g of er.shuffle(giants.slice()).slice(0, 9)) {
      let b = g, bd = 1e9; for (const o of giants) { const d = Math.hypot(o.x - g.x, o.z - g.z); if (o !== g && d < bd) { bd = d; b = o; } }
      eleph.push({ a: g, b, ph: er.range(0, 40), az: er.range(0, TAU), bz: er.range(0, TAU), T: er.range(11, 17) });
    }
    const elephants = inst(elephantGeometry(), eleph.length), elephBlobs = makeBlobs(env, eleph.length + giants.length + 5 * TRAINS); scene.add(elephBlobs.mesh);
    giants.forEach((g, i) => { const sk = FLOWER_H[g.kind] * g.s / Math.max(SUN.y, 0.08), bx = g.x - SUN.x * sk, bz = g.z - SUN.z * sk; elephBlobs.place(eleph.length + i, bx, heightAt(bx, bz), bz, HEAD_R[g.kind] * g.s, SUN); });
    eleph.forEach((e, i) => elephants.tint(i, [1, 1, 1], 0.15, night ? 0.1 : 0));
    const perch = (g, az, out) => { const r = Math.min(6.3, HEAD_R[g.kind] * g.s); out.x = g.x - Math.sin(az) * r; out.y = g.y + g.H * g.s + 3.05 * ESC; out.z = g.z - Math.cos(az) * r; out.yaw = az; return out; };
    await ctx.yield();

    // ------------------------------------------------------------ looking-glass insects: the rocking-horse-flies by their bushes, the snap-dragon-flies in the wood
    // A ROCKING-HORSE-FLY swings itself from branch to branch of its bush (one fly to a bush): between two branch
    // tips at the bush's rim on the side away from our line, a horse's breadth out from the leaves, nine tenths of
    // the bush's breadth apart along the hedge and three quarters to seventeen twentieths of its height up, sagging
    // between them as far as it always did where the bush is high enough, so that at the bottom of its swing it
    // hangs half way up the bush. A fly at its size ROCK_S (above) is ROCK_R in plan from its place to its farthest
    // point, stands ROCK_UP over its place with its wings up and its head thrown back, and comes ROCK_DOWN under it
    // at the end of a swing, ROCK_MID at the bottom. Its numbers are dealt first; then its sag is taken no deeper
    // than keeps its lowest point 0.3 m over the highest turf under its whole reach (it never rocks into the
    // grass), and the whole swing is tested as the trees are (our line, at its height over the fly, never within
    // LINE_M of the fly's breadth and height).
    const rk = S.rockflies, rock = [], ROCK_UP = 3.2 * ROCK_S, ROCK_DOWN = 0.77 * ROCK_S, ROCK_MID = 0.22 * ROCK_S;
    const flyHits = (x, y, z) => {
      for (let i = 0; i < route.length; i += 3) { const dx = route[i] - x, dz = route[i + 2] - z, h = route[i + 1] - y, m = ROCK_R + LINE_M; if (dx * dx + dz * dz < m * m && h > -ROCK_DOWN - LINE_M && h < ROCK_UP + LINE_M) return true; }
      return false;
    };
    const turfUnder = (x, z) => { let g = heightAt(x, z); for (let j = 0; j < 8; j++) g = Math.max(g, heightAt(x + Math.sin(j * TAU / 8) * ROCK_R, z + Math.cos(j * TAU / 8) * ROCK_R)); return g; };
    for (let i = 0; i < 3; i++) {
      const ph = rk.range(0, 6), w = rk.range(0.7, 1.0), deep = rk.range(2, 3.5), up = rk.range(0.75, 0.85), bu = bushes[i];
      if (!bu) continue;
      const x = bu.x + bu.away * (bu.r + 0.63 * ROCK_S), za = bu.z + 0.9 * bu.r, zb = bu.z - 0.9 * bu.r, A = [x, heightAt(bu.x, za) - 0.3 + up * bu.top, za], B2 = [x, heightAt(bu.x, zb) - 0.3 + up * bu.top, zb];
      let sag = deep, clear = true;
      for (let k = 0; k <= 8; k++) {
        const t = k / 8, sw = Math.sin(Math.PI * t), room = lerp(A[1], B2[1], t) - ROCK_MID - (ROCK_DOWN - ROCK_MID) * Math.abs(Math.cos(Math.PI * t)) - turfUnder(x, lerp(za, zb, t)) - 0.3;
        if (sw < 0.01) clear = clear && room > 0; else sag = Math.min(sag, room / sw);
      }
      for (let k = 0; k <= 8 && clear; k++) { const t = k / 8; clear = sag >= 0 && !flyHits(x, lerp(A[1], B2[1], t) - sag * Math.sin(Math.PI * t), lerp(za, zb, t)); }
      if (clear) rock.push({ A, B: B2, ph, w, sag });
    }
    const rockFlies = inst(rockingFlyGeometry(), rock.length, litD);
    rock.forEach((b, i) => rockFlies.anim(i, 0.15, 0.85, 31, b.ph));
    // snap-dragon-flies hang among the trunks all through the wood. A snap-dragon-fly is SNAP_SPAN = 4.4 m across its
    // wings at its scale 1 and hovers 2 m about its place: its place is no nearer our line than its hover and four
    // of its own spans (20 to 27 m: a hovering thing keeps its distance from whatever passes, as a dragonfly does
    // from a walker), and none hangs in the open ride between our line and the fawn's way or over the fawn's way.
    const sn = S.snaps, snaps = [], SNAP_SPAN = 4.4;
    for (let i = 0, tries = 0; i < 18 && tries < 400; tries++) {
      const x = WX0 + sn.range(8, 88), z = WZ0 - sn.range(8, WD - 8), a = [x, heightAt(x, z) + sn.range(5, 13), z], ph = sn.range(0, 40), sc = sn.range(1.0, 1.4);
      if (inLane(x, z, a[1] - heightAt(x, z) - 1.5, a[1] - heightAt(x, z) + 1.5, 2, 4 * SNAP_SPAN * sc) || betweenWays(x, z, 2 + SNAP_SPAN * sc) || woodTrees.some((q) => Math.hypot(q.x - x, q.z - z) < 3.4) || fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 6)) continue;
      snaps.push({ a, ph, s: sc }); i++;
    }
    const snapFlies = inst(snapFlyGeometry(), snaps.length, litD);
    snaps.forEach((b, i) => snapFlies.anim(i, 0.2, 0.7, 26, b.ph));
    const flames = fx.makeGlows({ rng: S['insects.glow'], time: env.uTime, positions: new Float32Array(Math.max(1, snaps.length) * 3), color: '#6ab4ff', size: 2.8, intensity: 2.3, flicker: 0.45 });
    scene.add(flames.object);
    await ctx.yield();
    // ------------------------------------------------------------ the wood's light: a slanting shaft of the low sun stands in a real gap of the wood's roof
    {
      // Places are drawn over the wood's floor (stream 'canopy'); a shaft stands at a place only if the roof lets the
      // sun down there (canAt), within 40 m of our line, and only in a gap narrower than 8 m across the sun's way
      // (wider light is open ground: the ride's own strip of sky, the glade), as broad as its gap. At most 18 stand.
      const sh = S.canopy, SP = [], SA = [], SI = [], sl = Math.hypot(SUN.x, SUN.z) || 1, c1 = [-SUN.z / sl, 0, SUN.x / sl];
      const c2 = new THREE.Vector3(SUN.x, SUN.y, SUN.z).cross(new THREE.Vector3(c1[0], c1[1], c1[2])).normalize();
      for (let tries = 0, n = 0; tries < 240 && n < 18; tries++) {
        const gx = WX0 + sh.range(6, SQ - 6), gz = WZ0 - sh.range(6, WD - 6), top = sh.range(19, 26), seed = sh(), gy = heightAt(gx, gz), k = Math.min(top / Math.max(SUN.y, 0.12), 30 / sl);
        if (canAt(gx, gz) < 0.75 || path.nearestXZ(gx, gz).dist > 40) continue;
        let half = 0; while (half < 4 && canAt(gx + c1[0] * (half + 1), gz + c1[2] * (half + 1)) > 0.6 && canAt(gx - c1[0] * (half + 1), gz - c1[2] * (half + 1)) > 0.6) half++;
        if (half >= 4) continue;
        // a shaft is a beam up the sun's ray as broad as its sheets: none stands where the beam comes within LINE_M of our line
        const wdt = 1.2 + 0.7 * half; let hit = false;
        for (let i = 0; i < route.length && !hit; i += 3) { const px = route[i] - gx, py = route[i + 1] - gy, pz = route[i + 2] - gz, t = clamp((px * SUN.x + py * SUN.y + pz * SUN.z) / k, 0, 1); hit = Math.hypot(px - SUN.x * k * t, py - SUN.y * k * t, pz - SUN.z * k * t) < wdt + LINE_M; }
        if (hit) continue;
        n++;
        for (const c of [c1, [c2.x, c2.y, c2.z]]) {
          const base = SP.length / 3;
          for (const [a, b] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { SP.push(gx + SUN.x * k * b + c[0] * a * wdt, gy + SUN.y * k * b + c[1] * a * wdt, gz + SUN.z * k * b + c[2] * a * wdt); SA.push(a, b, seed); }
          SI.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
      if (!SP.length) { SP.push(0, -50, 0, 0, -50, 0, 0, -50, 0); SA.push(0, 0, 0, 0, 0, 0, 0, 0, 0); SI.push(0, 1, 2); }
      const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3)); sgeo.setAttribute('aQ', new THREE.Float32BufferAttribute(SA, 3)); sgeo.setIndex(SI);
      const shaftMesh = new THREE.Mesh(sgeo, new THREE.ShaderMaterial({ uniforms: env, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec3 aQ; varying vec3 vQ, vW; void main(){ vQ = aQ; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`${CS_COMMON} varying vec3 vQ, vW;
          void main(){
            float a = clamp(vQ.x, -1., 1.), soft = 1. - a * a; soft *= soft;
            float along = smoothstep(0., .06, vQ.y) * (1. - smoothstep(.7, 1., vQ.y));
            float n = texture2D(tNoise, vec2(a * .22 + vQ.z * 7., vQ.y * 1.7 - uTime * .015)).r, n2 = texture2D(tNoise, vec2(a * .9 + vQ.z * 3., vQ.y * 6. + uTime * .03)).g;
            float d = length(cameraPosition - vW), fog = 1. - clamp(1. - exp(-d * d * uFogDen * uFogDen), 0., 1.);
            gl_FragColor = vec4(uSunCol * mix(vec3(1., .88, .56), vec3(.75, .9, 1.2), uNight) * soft * along * (.35 + .9 * n) * (.7 + .5 * n2) * fog * (.1 + .15 * uNight), 1.);
          }` }));
      shaftMesh.name = 'shafts'; shaftMesh.frustumCulled = false; shaftMesh.renderOrder = 2; scene.add(shaftMesh);
    }
    // ------------------------------------------------------------ reeds round the pond
    if (pond) {
      const rr = S.reeds, reedAt = [];
      for (let i = 0; i < 30; i++) { const a = rr.range(0, TAU), d = pond.r + rr.range(-1.5, 2.5), q = [pond.x + Math.sin(a) * d, pond.z + Math.cos(a) * d, rr.range(0, TAU), rr.range(0.8, 1.4)]; if (rr.chance(0.75)) reedAt.push(q); }
      const reeds = inst(reedGeometry(), reedAt.length, litD); reeds.mesh.name = 'reeds';
      reedAt.forEach((q, i) => { reeds.place(i, q[0], heightAt(q[0], q[1]) - 0.1, q[1], q[2], 0, 0, 1, q[3]); reeds.tint(i, [1, 1, 1], 0.2, night ? 0.06 : 0); });
      reeds.commit();
    }
    // ------------------------------------------------------------ far ranks: whole ranks of chessmen drawn up on distant squares, row behind row
    // Eight ranks: five beyond the board (nine to fifteen ranks out) and three to its sides; each is a back rank of
    // all the kinds (rook, knight, bishop, queen, king, bishop, knight, rook: 30 to 48 m tall) or, two times in five, a
    // rank of pawns. They stand in the haze as churches do; the far pieces between them glide (above). The
    // distant make, instanced, no shadow twins (trimmed for the budget); a rank's piece FAR_RANK = 500 m and more
    // from our line stands in the horizon's make (four sides, its outline kept: a pawn there is thirty dots of
    // the picture broad, and most stand twice as far).
    {
      const rk2 = S.ranks, fk = S.farkinds, rankAt = [], farTaken = new Set(), BACK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      for (const p of farPieces) { farTaken.add(p.f + ',' + p.r); if (p.to) farTaken.add((p.f + p.to[0]) + ',' + (p.r + p.to[1])); }
      for (let n = 0; n < 8; n++) {
        const side = n < 5 ? 0 : (rk2.chance(0.5) ? -1 : 1), r = side ? rk2.int(1, 7) : rk2.int(9, 15), f0 = side ? (side < 0 ? rk2.int(-13, -9) : rk2.int(9, 12)) : rk2.int(-5, 5), w = rk2.chance(0.5), back = fk.chance(0.6);
        for (let i = 0; i < 8; i++) {
          const f = f0 + i, key = f + ',' + r, q = sqXZ(f, r);
          if ((f >= 0 && f < 8 && r >= 0 && r < 8) || farTaken.has(key) || hillAt(q[0], q[1]) > 0.01) continue;
          farTaken.add(key); rankAt.push({ x: q[0], z: q[1], w, k: back ? BACK[i] : 'pawn' });
        }
      }
      const FAR_RANK = 500;
      for (const k of KINDS) for (const hor of [false, true]) {
        const mine = rankAt.filter((q) => q.k === k && (path.nearestXZ(q.x, q.z).dist >= FAR_RANK) === hor);
        if (!mine.length) continue;
        const rs = makePieces(env, { kind: k, count: mine.length, geometry: ownGeometry(hor ? await horizon(k) : await distant(k)) }); rs.mesh.name = 'ranks.' + k + (hor ? '.far' : ''); scene.add(rs.mesh);
        mine.forEach((q, i) => { rs.color(i, q.w, !night ? 0 : q.w ? 0.5 : -0.9); rs.place(i, q.x, heightAt(q.x, q.z) - 0.4, q.z, q.w ? 0 : Math.PI, 0, 0, 1, 1); rs.anim(i, 0, 0.04, 0, 0); });
        rs.commit();
        await ctx.yield();
      }
    }
    // ------------------------------------------------------------ gold glints on the crown: the pearls of its fleurs and its cabochons catch the low sun
    const glintAt = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; glintAt.push([CROWN[0] + Math.sin(a) * 18.3 * CROWN_K, heightAt(CROWN[0], CROWN[1]) - 0.3 + 29.4 * CROWN_K, CROWN[1] + Math.cos(a) * 18.3 * CROWN_K]); }
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU; glintAt.push([CROWN[0] + Math.sin(a) * 19.6 * CROWN_K, heightAt(CROWN[0], CROWN[1]) - 0.3 + 19.8 * CROWN_K, CROWN[1] + Math.cos(a) * 19.6 * CROWN_K]); }
    const glints = fx.makeGlows({ rng: S.glints, time: env.uTime, positions: glintAt, color: night ? '#cfe0ff' : '#fff2c0', size: 7, intensity: night ? 0.5 : 0.9, flicker: 0.6 });
    scene.add(glints.object);
    await ctx.yield();
    const fnr = S.ferns, fernAt = [];
    for (let i = 0, tries = 0; i < Math.round(110 * Math.min(1, detail + 0.1)) && tries < 1600; tries++) {
      const x = WX0 + fnr.range(3, 93), z = WZ0 - fnr.range(3, WD - 3), s = fnr.range(1.1, 2.0), yaw = fnr.range(0, TAU);
      // (no fern under our line: none stands nearer the line than its own breadth, 6.6 m to each unit of its scale,
      // the ride's floor is grass, and the bracken begins a fern's own breadth from the ride's middle)
      if (path.nearestXZ(x, z).dist < 6.6 * s || fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.5 + 1.5 * s) || woodTrees.some((q) => Math.hypot(q.x - x, q.z - z) < 1.6)) continue;
      fernAt.push([x, z, yaw, s]); i++;
    }
    // THE WOOD'S HEM: bracken stands out from the wood's front over HEM_D = a third of a rank, from the fifth brook's
    // bank, within HEM_W = 30 m either side of the ride's line: one fern to every 36 square metres, none nearer our
    // line than its own breadth (as in the wood), none on the fawn's drinking place
    // (the hem's bracken is dealt on a stream of its own, 'hem': the wood's ferns above are dealt in a loop that tries again)
    const HEM_D = SZ / 3, HEM_W = 30, HEM_Z = WZ0 + BROOK + 5, hemr = S.hem;
    for (let i = 0; i < Math.round(2 * HEM_W * HEM_D / 36); i++) {
      const x = XW + hemr.range(-HEM_W, HEM_W), z = HEM_Z + hemr.range(0, HEM_D), sc = hemr.range(1.1, 2.0), yaw = hemr.range(0, TAU);
      if (path.nearestXZ(x, z).dist >= 6.6 * sc && !fawnTrack.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.5 + 1.5 * sc)) fernAt.push([x, z, yaw, sc]);
    }
    // (the ferns that are drawn are those within 50 m of the flight's line: the floor of the deep wood beyond is
    // not seen from the ride; the deal is the whole wood's, as it was)
    const fernNear = fernAt.filter((q) => path.nearestXZ(q[0], q[1]).dist < 50);
    const ferns = inst(fernGeometry(), fernNear.length, litD); ferns.mesh.name = 'ferns';
    fernNear.forEach((q, i) => { ferns.place(i, q[0], heightAt(q[0], q[1]) - 0.1, q[1], q[2], 0, 0, 1, q[3]); ferns.tint(i, [0.6, 0.8, 0.78], 0.2, night ? 0.06 : 0); });
    ferns.commit();
    await ctx.yield();
    // ------------------------------------------------------------ the fawn of the wood
    const fawn = inst(fawnGeometry(night), 1); fawn.mesh.name = 'fawn';
    fawn.tint(0, [1, 1, 1], 0.12, night ? 0.55 : 0);                   // pale in the moonlight: a paler coat and a light of its own
    cast(fawn.twin(shadowMat, 0, fawnGeometry(night)));
    const fawnBlob = makeBlobs(env, 1); scene.add(fawnBlob.mesh);       // a soft shadow under its body, in the wood's shade too
    // THE FAWN KEEPS A ROUND OF ITS OWN ON THE WORLD'S CLOCK, on its way beside the ride (fawnTrack), whether anyone
    // is there or not. It drinks at the fifth brook (T_DRINK, lifting its head now and then to look about, and for
    // good over the last two seconds); walks up its ride to the middle of the glade at FAWN_WALK = 6 m a second
    // (gathering pace over the first fifth of the way and slowing over the last: fawnEase); stands in the glade's
    // light, head up, T_GLADE; bounds on up the ride, BOUNDS = five bounds of BOUND = 9 m (a bound is its own
    // length) at FAWN_BOUND = 15 m a second, and lands on the last; turns about where it stands (T_TURN, stepping
    // round); walks back down the ride to the brook, turns about, and lowers its head to the water again. One
    // round takes some 65 to 75 seconds (FAWN_T: by the wood's depth). Where it is at a moment is a function of
    // the world's clock and of nothing else (its phase is this visit's own, PH.fawn); every part of the round
    // begins and ends at a stand, so its place, its heading, its gait and its head change smoothly all round.
    // Its whole round lies on its way, FAWN_OFF from our line: we come on it wherever on its round it then is.
    const FAWN_WALK = 6, FAWN_BOUND = 15, BOUND = 9, BOUNDS = 5, F_FAR = GLADE_S + BOUNDS * BOUND, D_LEVEL = mAtZ(GLADE[1]), D_FFAR = mAtZ(FZ0 - F_FAR);
    const fawnEase = (q) => { const r = 0.2; return q < r ? q * q / (2 * r * (1 - r)) : q < 1 - r ? (q - r / 2) / (1 - r) : 1 - (1 - q) * (1 - q) / (2 * r * (1 - r)); };
    const T_DRINK = 12, T_OUT = GLADE_S / (0.8 * FAWN_WALK), T_GLADE = 5, T_BOUND = BOUNDS * BOUND / (0.8 * FAWN_BOUND), T_TURN = 3, T_BACK = F_FAR / (0.8 * FAWN_WALK);
    const FAWN_T = T_DRINK + T_OUT + T_GLADE + T_BOUND + T_TURN + T_BACK + T_TURN, fawnGo = (q) => smoothstep(0, 0.12, q) * (1 - smoothstep(0.88, 1, q));
    const fGaze = new THREE.Vector3(fawnX(0), 6, FZ0), FW = { s: 0, x: 0, z: 0, yaw: 0, run: 0, walk: 0, hop: 0, gait: 0, drink: 0, eb: 0, still: 0 }, FG = { ...FW };
    const fawnAt = (t, o, ph) => {
      let c = ((t + ph) % FAWN_T + FAWN_T) % FAWN_T, s = 0, turn = 0, eb = 0, walk = 0, run = 0, still = 0, drink = 0, gait = 0;
      if (c < T_DRINK) drink = 1 - smoothstep(T_DRINK - 2, T_DRINK, c);
      else if ((c -= T_DRINK) < T_OUT) { const q = c / T_OUT; s = GLADE_S * fawnEase(q); walk = fawnGo(q); gait = s * 0.62; }
      else if ((c -= T_OUT) < T_GLADE) { const q = c / T_GLADE; s = GLADE_S; still = fawnGo(q); run = smoothstep(0.4, 1, q); }
      else if ((c -= T_GLADE) < T_BOUND) { const q = c / T_BOUND; eb = BOUNDS * BOUND * fawnEase(q); s = GLADE_S + eb; walk = fawnGo(q); run = 1; }
      else if ((c -= T_BOUND) < T_TURN) { const q = c / T_TURN; s = F_FAR; eb = BOUNDS * BOUND; turn = Math.PI * ease5(q); run = 1 - smoothstep(0, 0.6, q); walk = 0.5 * Math.sin(Math.PI * q) * Math.sin(Math.PI * q); gait = 3 * turn; }
      else if ((c -= T_TURN) < T_BACK) { const q = c / T_BACK; s = F_FAR * (1 - fawnEase(q)); turn = Math.PI; walk = fawnGo(q); gait = (F_FAR - s) * 0.62; }
      else { const q = (c - T_BACK) / T_TURN; turn = Math.PI * (1 + ease5(q)); walk = 0.5 * Math.sin(Math.PI * q) * Math.sin(Math.PI * q); gait = 3 * turn; drink = smoothstep(0.5, 1, q); }
      o.s = s; o.x = fawnX(s); o.z = FZ0 - s; o.yaw = Math.atan2(2.2 * 0.045 * Math.cos(s * 0.045 + FPH), -1) + turn;
      o.run = run; o.walk = walk; o.eb = eb; o.gait = gait; o.still = still; o.drink = drink; o.hop = Math.abs(Math.sin(eb * Math.PI / BOUND)) * run * walk;
      return o;
    };
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // ------------------------------------------------------------ every frame
    const NONE = [], qGaze = new THREE.Vector3(LX, heightAt(LX, QZ) + RUNNER.waist, QZ);
    const PH = { fawn: S.fawn.range(0, TAU), pacer: [S.pacer.range(0, TAU), S.pacer.range(0, TAU), S.pacer.range(0, TAU)], train: S.train.range(0, TAU), cloud: [S.cloudshadow.range(0, 660), S.cloudshadow.range(0, 660)] };
    // THE GAZE: one pull at a time, each window ending at places of the flight. A pull turns in and out over TURN =
    // 90 m of flight (the engine takes one turn for both ends of a window, as a share of it: turnOf); where one pull
    // hands over to the next, the next one's turn-in ends where the first one's turn-out ends, so the two together
    // never weigh more than the heavier of them alone.
    // The trains' leap, 0.6: the place where the arc's top stands over our own crossing of the first brook, a
    // carriage's height over the rail there (a place: it does not follow a train). From the middle of the hill's
    // table (a visitor arrives looking level along the walk between the beds; the railway is seen from the table's
    // front and the slope) until we are TURN short of being abeam of her lane's head; it is let go over the last
    // TURN of that, the stretch over which the queen's pull turns in.
    // The queen, 0.7: from two TURNs short of abeam of her lane's head, whole one TURN short of it (she stands her
    // wake's length further down the lane: QZ). The aim is her waist, where she runs on the spot, for as long as
    // she is Q_AHEAD (her lane's stand-off from our line) or more before our beam; nearer than that, and past her,
    // the aim is the place on her lane Q_AHEAD before our beam, at
    // her waist's height over the lane's ground there (the two are joined over some 6 m of the lane, no corner). So
    // the gaze is never turned more than half a right angle from her lane and is never on her behind our beam: she
    // goes out at the frame's edge as we come abeam, and the pull stays down the lane she runs along and gets
    // nowhere on. It is let go over the last TURN before the second brook, the stretch over which the flowers' pull
    // turns in on the same hand: the gaze swings on from her lane to the flowers and not back to our heading
    // between the two (let go abeam of her, it swung back and out again at 28 to 29 degrees a second).
    // The square of giant flowers, 1: the middle of the blooms of its nearer half (the half toward the second brook,
    // which we come to first), at the mean height of their heads, where the elephants stand. The pull turns in up to
    // the second brook, is whole there, and is let go by half a TURN short of the third brook, as we come abeam of
    // the square.
    // The red knight of the third rank, 0.7: the near piece of her own side's rank beyond the flowers, on the same
    // hand; from TURN short of the third brook until we are abeam of it, where it is wholly let go. The aim is
    // its head (0.8 of its height).
    // The fawn, 0.7: from her lane's end until we are abeam of the far end of the fawn's round (D_FFAR). The aim is
    // the fawn's head (FAWN_HEAD over the ground of its way) for as long as the fawn is FAWN_AHEAD = two stand-offs
    // or more before our beam along its way; nearer than that, or behind us, the aim is the place on its way
    // FAWN_AHEAD before our beam, at its head's height there (the two are joined over some 6 m of the way, with no
    // corner). So the gaze is never on it behind our beam and is never turned more than half a right angle from
    // its way, wherever on its round the fawn is when we come; we pass the fawn as we pass any standing thing.
    // (At the ride's four knots our line is as high as the fawn's head stands beside that knot; between the knots
    // the land under its way and under ours rolls differently, and through the wood our line runs anywhere between
    // 1.6 m under the level of the head beside it and 3.0 m over it: measured on seeds 1 to 300.)
    const TURN = 90, turnOf = (a, b, turn = TURN) => Math.min(0.5, turn / Math.max(b - a, 1));
    const Q_FROM = D_HEAD - 2 * TURN, LEAP_TO = D_HEAD - TURN, SQ_TO = D_B3 - TURN / 2, SQ_TURN = Math.min(TURN, SQ_TO - D_B2), SQ_FROM = D_B2 - SQ_TURN;
    const RK_FROM = Math.max(D_B2, D_B3 - TURN), RK_TO = mAtZ(B(3.5));
    const rkGaze = rankAt ? new THREE.Vector3(rankAt[0], heightAt(rankAt[0], rankAt[1]) + 0.8 * PIECES.knight.h, rankAt[1]) : null;
    const sqMid = sqXZ(MEAD[0], MEAD[1]), sqGaze = new THREE.Vector3(sqMid[0], heightAt(sqMid[0], sqMid[1]) + 21, sqMid[1]);
    const nearHalf = giants.filter((g) => g.z > sqMid[1]);
    if (nearHalf.length) { sqGaze.set(0, 0, 0); for (const g of nearHalf) { sqGaze.x += g.x / nearHalf.length; sqGaze.y += (g.y + FLOWER_H[g.kind] * g.s) / nearHalf.length; sqGaze.z += g.z / nearHalf.length; } }
    const squareGaze = () => sqGaze;
    const leapGaze = new THREE.Vector3(LEAP_X, LEAP_TOP + ARC + 4, B(1));
    const FAWN_AHEAD = 2 * FAWN_OFF, Q_AHEAD = OFF, gazeMe = new THREE.Vector3();
    const queenGaze = (time, u) => {
      path.pointAt(clamp(u, 0, 1), gazeMe);
      const b = QZ - gazeMe.z + Q_AHEAD, z = QZ - 0.5 * (b + Math.sqrt(b * b + 36));
      return qGaze.set(LX, heightAt(LX, z) + RUNNER.waist, z);
    };
    const fawnGaze = (time, u) => {
      path.pointAt(clamp(u, 0, 1), gazeMe);
      const a = fawnAt(time, FG, PH.fawn * FAWN_T / TAU).s, b = FZ0 - gazeMe.z + FAWN_AHEAD, sa = 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + 36)), x = fawnX(sa), z = FZ0 - sa;
      return fGaze.set(x, heightAt(x, z) + FAWN_HEAD, z);
    };
    const ease5 = (s) => s * s * s * (s * (6 * s - 15) + 10), wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const M = { x: 0, z: 0, hop: 0, mv: 0, vx: 0, vz: 0 };
    // the game runs on the world clock. After its last move it is not begun anew: the same moves are taken back one
    // by one (each piece gliding back the way it came), and then played again: the game never jumps. About its two turns
    // no piece moves for some seconds (ten at the far turn, three at the near one), and in every second half the moves run back.
    const GAME_T = game.reduce((m, p) => p.moves.reduce((a, q) => Math.max(a, q.t1), m), 0) + 5;
    // WHERE THE GAME STANDS AT THE WORLD CLOCK'S NOUGHT is drawn for the visit (stream 'gamephase': anywhere on its round of there and
    // back), so no move sets off with our first look: the glide and the rare capture are met at whatever moment of the round the clock gives.
    const GAME_PH = S.gamephase.range(0, 2 * GAME_T);
    // THE BISHOP'S GLIDE is the game's first move, by the game's own measures: it begins when the game's first move
    // begins (1.5 s on the game's clock) and takes what a glide of one square takes (6 + 3.2 s). On the rare visit
    // the pawn on the square it comes to bows and goes over the CAP_T = 4 s after the bishop has come, and its
    // petals hang PETAL_T = 8 s longer. Like every move it is taken back in the game's second half.
    const GLIDE_T0 = 1.5, GLIDE_T1 = GLIDE_T0 + 6 + 3.2, CAP_T = 4, PETAL_T = 8;
    const pieceAt = (p, t) => {
      let f = p.start[0], r = p.start[1]; M.hop = 0; M.mv = 0; M.vx = 0; M.vz = 0;
      for (const m of p.moves) {
        if (t >= m.t1) { f = m.to[0]; r = m.to[1]; continue; }
        if (t > m.t0) {
          const s = (t - m.t0) / (m.t1 - m.t0), e = ease5(s);
          f = lerp(m.from[0], m.to[0], e); r = lerp(m.from[1], m.to[1], e); M.mv = 16 * s * s * (1 - s) * (1 - s); M.vx = m.to[0] - m.from[0]; M.vz = -(m.to[1] - m.from[1]);
          if (p.k === 'knight') M.hop = Math.sin(Math.PI * e);
        }
        break;
      }
      M.x = (f - 3.5) * SQ; M.z = -(r + 0.5) * SZ;
    };
    // a piece's head looks about on a slow sway of its own on the world's clock (its own phase), no further than
    // PIECE_NECK; no piece regards the visitor
    const PIECE_NECK = 1.2;
    const stand = (s, p, x, z, t, hop, scale, bow) => {
      const kn = s.kind === 'knight', y = heightAt(x, z) + (kn ? hop * 15 : 0), yaw = p.w ? 0 : Math.PI, ph = p.ph || 0;
      const vl = Math.hypot(M.vx, M.vz) || 1, wx = M.vx / vl * M.mv, wz = M.vz / vl * M.mv, c = Math.cos(yaw), sn = Math.sin(yaw);
      s.place(p.i, x, y, z, yaw, 0.02 * Math.sin(t * 0.8 + ph) + 0.12 * (wx * sn + wz * c) + bow, 0.02 * Math.sin(t * 0.63 + ph * 2) - 0.12 * (wx * c - wz * sn), 1 + 0.012 * Math.sin(t * 1.7 + ph), scale);
      if (kn) { const rear = 0.45 * Math.pow(Math.max(0, Math.sin(t * 0.45 + ph)), 6) + 0.5 * hop; s.anim(p.i, 0, 0.13 * Math.sin(t * 1.9 + ph) + 0.6 * rear * Math.sin(t * 3.1 + ph), rear, 0); }
      else s.anim(p.i, clamp(0.5 * Math.sin(t * 0.23 + ph * 1.7) + 0.12 * Math.sin(t * 0.5 + ph), -PIECE_NECK, PIECE_NECK), 0.04 + 0.05 * Math.sin(t * 1.3 + ph), 0, 0);
    };
    const world = {
      scene, path, duration: DUR,
      // ONE PACING, in round shares of our pace: four fifths from her lane's head to the fourth brook, where the
      // great things stand close on both hands and the gaze goes from one to the next; seven tenths through the wood
      // (from its near edge to its far edge), where the trunks stand nearest of all.
      pace: (u) => { const d = u * L; return 1 - 0.2 * win(D_HEAD, D_B4, 30, d) - 0.3 * win(D_WIN, D_WOUT, 25, d); },
      // (we lean into our turns only a little, 0.1 of the engine's lean and 1.6 degrees at the most, the whole flight
      // through: the visitor is carried over this country as a piece is carried over a board, upright)
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 30, sway: 1, bank: 0.1 },
      // (the leap's window is shorter than two TURNs, so its turn-out is given as its own share of the window: it
      // ends where the queen's turn-in ends, and the two together never weigh more than the queen's alone)
      pois: [{ at: leapGaze, from: D_MID / L, to: LEAP_TO / L, weight: 0.6, fade: Math.min(1, TURN / Math.max(LEAP_TO - D_MID, 1)) },
        { at: queenGaze, from: Q_FROM / L, to: D_B2 / L, weight: 0.7, fade: turnOf(Q_FROM, D_B2) },
        { at: squareGaze, from: SQ_FROM / L, to: SQ_TO / L, weight: 1, fade: turnOf(SQ_FROM, SQ_TO, SQ_TURN) },
        ...(rkGaze ? [{ at: rkGaze, from: RK_FROM / L, to: RK_TO / L, weight: 0.7, fade: turnOf(RK_FROM, RK_TO) }] : []),
        { at: fawnGaze, from: D_END / L, to: D_FFAR / L, weight: 0.7, fade: turnOf(D_END, D_FFAR) }],
      // what this visit drew (for replay)
      drawn: { hour, asked: vary.hour || 'any', moon: night ? [Math.round(moonEl), Math.round(moonAz)] : null, sunElevation: Math.round(sunEl * 10) / 10, sunAzimuth: Math.round(sunAz), rare, density: Math.round(dens * 100) / 100, pond: pond ? [Math.round(pond.x), Math.round(pond.z)] : null, capture: !!(glide && glide.pawn), moves: game.reduce((n, p) => n + p.moves.filter((m) => m.t0 < DUR).length, 0), movers: game.movers,
        board: { squareDepth: Math.round(SZ * 10) / 10, hillBeforeFirstBrook: Math.round((HZC - HRZ) * 10) / 10, queenSide: MX, woodDepth: Math.round(WD * 10) / 10, trains: TRAINS },
        metres: { length: Math.round(L), foot: Math.round(D_FOOT), gate: Math.round(D_GATE), brook1: Math.round(D_B1), laneHead: Math.round(D_HEAD), brook2: Math.round(D_B2), brook3: Math.round(D_B3), brook4: Math.round(D_B4), cross: Math.round(D_CROSS), laneEnd: Math.round(D_END), knights: Math.round(D_KN), woodIn: Math.round(D_WIN), fawnLevel: Math.round(D_LEVEL), woodOut: Math.round(D_WOUT), fawnFar: Math.round(D_FFAR) } },
      portal: { shape: 'circle', radius: Math.min(7, 8.03 * CROWN_K - 2.5), color: '#ffe9a8', glow: 1.1, revealDistance: 330 },
      post: {
        exposure: night ? 1.2 : 1.0, bloom: { strength: night ? 0.5 : 0.3, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.0, contrast: 1.05, tint: day ? '#ffffff' : morning ? '#fffaf0' : '#fff4e4', shadowTint: night ? '#060a26' : '#0c1434', vignette: 0.26, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        const t = time;
        env.uTime.value = t;
        sky.update(dt, t, camera); rig.update(dt, t, camera);
        // the kit's field drifts by wind x its clock: each is given the world's clock from its own phase, wrapped at its course's length
        for (let k = 0; k < 9 * TRAIN; k++) cloudFields[k].update(dt, (((t / CLOUD_T + cloudPh[k % 9] + (k - k % 9) / (9 * TRAIN)) % 1 + 1) % 1 - 0.5) * CLOUD_T, camera);
        gU.uCloud.value.x = (PH.cloud[0] - WIND[0] * t) % SHADE_TILE; gU.uCloud.value.y = (PH.cloud[1] - WIND[1] * t) % SHADE_TILE;
        // the game
        const tc = (t + GAME_PH) % (2 * GAME_T), back = tc > GAME_T, tg = back ? 2 * GAME_T - tc : tc;
        for (const k of KINDS) {
          for (const s of sets[k] || NONE) {
            for (const p of s.list) {
              pieceAt(p, tg); if (back) { M.vx = -M.vx; M.vz = -M.vz; }
              let x = p.px !== undefined ? p.px : M.x, z = p.px !== undefined ? p.pz : M.z, hop = M.hop, scale = 1, bow = 0;
              if (glide && p === glide.p) { const sg = clamp((tg - GLIDE_T0) / (GLIDE_T1 - GLIDE_T0), 0, 1), e = ease5(sg), dir = back ? -1 : 1; x = lerp(glide.from[0], glide.to[0], e); z = lerp(glide.from[1], glide.to[1], e); M.mv = 16 * sg * sg * (1 - sg) * (1 - sg); M.vx = dir * (glide.to[0] - glide.from[0]); M.vz = dir * (glide.to[1] - glide.from[1]); }
              if (glide && p === glide.pawn) { const e = smoothstep(GLIDE_T1, GLIDE_T1 + CAP_T, tg); bow = 0.75 * smoothstep(0, 0.5, e); scale = 1 - 0.999 * smoothstep(0.45, 1, e); z += 28 * e * e; }
              stand(s, p, x, z, t, hop, scale, bow);
              if (lamps && p.lamp !== undefined) lamps.setPosition(p.lamp, x, heightAt(x, z) + 2.5 + hop * 15, z + PIECES[p.k].r * 0.9);
            }
            s.commit();
          }
          for (const fs of farSets[k] || NONE) {
            for (const p of fs.list) {
              const c = (t + p.ph) % 36, g = !p.to ? 0 : c < 9 ? ease5(c / 9) : c < 18 ? 1 : c < 27 ? 1 - ease5((c - 18) / 9) : 0;
              M.mv = 0; M.vx = 0; M.vz = 0;
              stand(fs, p, (p.f + (p.to ? p.to[0] * g : 0) - 3.5) * SQ, -(p.r + (p.to ? p.to[1] * g : 0) + 0.5) * SZ, t, 0, 1, 0);
            }
            fs.commit();
          }
        }
        if (puff) { const e = smoothstep(GLIDE_T1, GLIDE_T1 + CAP_T, tg) * (1 - smoothstep(GLIDE_T1 + CAP_T, GLIDE_T1 + CAP_T + PETAL_T, tg)); puff.setOpacity(e); puff.update(dt, t, camera); }
        // the queen runs on the spot in her lane's first square (THE RUNNER): the part moves her by the world's clock; her
        // head and her pawn's look straight down her course (no watch point is given: neither regards the visitor)
        hero.update(dt, t, camera);
        // her pawn and her pacing hedge stand on the land where they are (the hero's own space lies on the slope under her)
        for (const o of [hero.pawn, hero.hedge]) o.position.y += heightAt(LX - o.position.x, QZ - o.position.z) - QS.y + QS.gx * o.position.x + QS.gz * o.position.z;
        pacer.position.set(LX - MX * (31 + 0.5 * Math.sin(t * 1.3 + PH.pacer[0])), heightAt(LX - MX * 31, QZ - 8) - 0.2 + 0.3 * Math.abs(Math.sin(t * 4.1 + PH.pacer[1])), QZ - 8 + 1.4 * Math.sin(t * 0.8 + PH.pacer[2]));
        pacer.rotation.set(0.03 * Math.sin(t * 4.1 + PH.pacer[1]), 0.6, 0.02 * Math.sin(t * 2.3 + PH.pacer[0]));
        if (lamps) lamps.update(dt, t, camera);
        // the fawn, at its place on its round by the world's clock; its head looks about on a sway of its own
        {
          const F2 = fawnAt(t, FW, PH.fawn * FAWN_T / TAU), x = F2.x, z = F2.z, run = F2.run, walk = F2.walk, drink = F2.drink, yaw = F2.yaw, hx = Math.sin(yaw), hz = Math.cos(yaw), gy = heightAt(x, z);
          // it stands on the land: its body tilts with the ground's own slope along its heading, so every hoof meets the
          // ground where it stands; in the bound it rises 1.2 of its scale and pitches with the leap
          const slope = Math.atan2(heightAt(x + hx * FS, z + hz * FS) - heightAt(x - hx * FS, z - hz * FS), 2 * FS);
          fawn.place(0, x, gy + 1.2 * FS * F2.hop * walk, z, yaw, -slope + 0.3 * Math.sin(F2.eb * TAU / BOUND) * run * walk, 0, 1, FS);
          fawnBlob.place(0, x, gy, z, 1.25 * FS, SUN);
          const lookAbout = 1.1 * Math.sin(t * 0.37 + PH.fawn * 1.9), peek = smoothstep(0.55, 0.9, Math.sin(t * 0.5 + PH.fawn)), glance = (1 - drink) * (1 - run) * (0.45 + 0.4 * Math.sin(t * 0.6 + PH.fawn)) + (1 - walk) * lerp(0.5, peek, drink);
          // while it drinks its head is down and straight; now and then (peek, on the clock) it lifts its head and looks
          // about; walking, it glances to one side and the other; standing in the glade its head is up and turns slowly
          // from side to side: all on the world's clock, none of it to the visitor
          // legs: a walk's phase by the metres it has walked; in the bound one gather and one stretch to every bound (stretched at the top of it)
          fawn.anim(0, clamp(lookAbout, -1.3, 1.3) * clamp(glance + F2.still, 0, 1), 0.95 * drink * (1 - 0.85 * peek) - 0.22 * F2.still + 0.02 * Math.sin(t * 1.1), (0.4 + 0.45 * run) * walk, lerp(F2.gait, F2.eb * TAU / BOUND + Math.PI / 2, run));
          fawn.commit();
        }
        // the live flowers, the giants among them, turn their faces slowly from side to side and nod as if talking
        // to one another (each on the world's clock from its own phase; none faces the visitor)
        for (const s of FSETS) {
          for (const q of s.list) {
            s.place(q.i, q.x, q.y - 0.2, q.z, q.yaw, 0.035 * Math.sin(t * 0.9 + q.ph), 0.035 * Math.sin(t * 0.7 + q.ph * 2), 1, q.s);
            s.anim(q.i, 0.55 * Math.sin(t * 0.19 + q.ph * 1.3) + 0.25 * Math.sin(t * 0.6 + q.ph), 0.05 + 0.13 * Math.sin(t * 2.3 + q.ph) * Math.sin(t * 0.37 + q.ph * 3), 0, 0);
          }
          s.commit();
        }
        // elephants at the giant blooms: each stands on its bloom, trunk in it, fanning its ears
        for (let i = 0; i < eleph.length; i++) {
          const e = eleph[i]; perch(e.a, e.az, EP1);
          const x = EP1.x, z = EP1.z, y = EP1.y + 0.1 * Math.sin(t * 1.3 + e.ph), sip = 0.5 + 0.5 * Math.sin(t * 0.9 + e.ph * 3);
          elephants.place(i, x, y, z, EP1.yaw + 0.15 * Math.sin(t * TAU / e.T + e.ph), 0.16 + 0.1 * sip, 0.04 * Math.sin(t * 1.7 + e.ph), 1, ESC);
          elephants.anim(i, 0.15, 0.4, 0, t * 1.1 + e.ph);
          const gy = heightAt(x, z), sk = Math.max(0, y - 2 * ESC - gy) / Math.max(SUN.y, 0.08), bx = x - SUN.x * sk, bz = z - SUN.z * sk;
          elephBlobs.place(i, bx, heightAt(bx, bz), bz, 3.4 * ESC, SUN);
        }
        elephants.commit();
        // insects
        for (let i = 0; i < bfly.length; i++) {
          const b = bfly[i], a = t * 0.55 + b.ph, vx = b.r * Math.cos(a) * 0.55, vz = -b.r * Math.sin(a * 0.8 + b.ph) * 0.44;
          breadFlies.place(i, b.a[0] + b.r * Math.sin(a), b.a[1] + 1.0 * Math.sin(a * 1.7 + 1) + 0.25 * Math.sin(t * 8 + b.ph), b.a[2] + b.r * Math.cos(a * 0.8 + b.ph), Math.atan2(vx, vz), 0.18 * Math.sin(t * 2.6 + b.ph), 0.2 * Math.sin(a * 1.3), 1, b.s);
        }
        breadFlies.mesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < rock.length; i++) {
          const b = rock[i], w = t * b.w + b.ph, s = 0.5 - 0.5 * Math.cos(w), dir = Math.sin(w) >= 0 ? 1 : -1, dx = (b.B[0] - b.A[0]) * dir, dz = (b.B[2] - b.A[2]) * dir;
          rockFlies.place(i, lerp(b.A[0], b.B[0], s), lerp(b.A[1], b.B[1], s) - b.sag * Math.sin(Math.PI * s), lerp(b.A[2], b.B[2], s), Math.atan2(dx, dz), 0.55 * Math.cos(Math.PI * s) * dir + 0.2 * Math.sin(t * 5 + b.ph), 0, 1, 1.5);
        }
        rockFlies.mesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < snaps.length; i++) {
          const b = snaps[i], a = t * 0.7 + b.ph, x = b.a[0] + 1.5 * Math.sin(a) + 0.5 * Math.sin(a * 4.1), y = b.a[1] + 0.8 * Math.sin(a * 1.6 + 1), z = b.a[2] + 1.5 * Math.cos(a * 0.76) + 0.5 * Math.sin(a * 3.3);
          const yaw = Math.atan2(Math.cos(a) + 1.4 * Math.cos(a * 4.1), -0.76 * Math.sin(a * 0.76) + 1.1 * Math.cos(a * 3.3));
          snapFlies.place(i, x, y, z, yaw, 0.15 * Math.sin(a * 2.2), 0.2 * Math.sin(a * 1.9), 1, b.s);
          flames.setPosition(i, x + Math.sin(yaw) * 0.9 * b.s, y + 0.62 * b.s, z + Math.cos(yaw) * 0.9 * b.s);
        }
        snapFlies.mesh.instanceMatrix.needsUpdate = true;
        flames.update(dt, t, camera); glints.update(dt, t, camera);
        // the trains, each at its place on the round by the world's clock: along the brook, up the ramp, through the air
        // over the water, down the far ramp and on; each engine and carriage casts a soft shadow where the sun's ray
        // through it meets the ground or the water (none under the hill)
        const car = (set, i, slot, x) => {
          const a = trainAt(x - TDIR * 0.6, TR), b = trainAt(x + TDIR * 0.6, TR2), dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, l = Math.hypot(dx, dy, dz) || 1;
          set.place(i, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, Math.atan2(dx, dz), -Math.asin(clamp(dy / l, -1, 1)), 0.02 * Math.sin(t * 9 + slot + PH.train), 1, trainHid(x) ? 0.001 : 1.5);
          const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, cz = (a.z + b.z) / 2, gy = heightAt(cx, cz), sk = Math.max(0, cy - gy) / Math.max(SUN.y, 0.08), bx = cx - SUN.x * sk, bz = cz - SUN.z * sk;
          elephBlobs.place(eleph.length + giants.length + slot, bx, heightAt(bx, bz), bz, cy < gy - 1 ? 0.001 : 4.6, SUN);
        };
        for (let n = 0; n < TRAINS; n++) {
          const xe = trainX(t, n, PH.train / TAU);
          car(engine, n, n * 5, xe); for (let i = 0; i < 4; i++) car(cars, n * 4 + i, n * 5 + i + 1, xe - TDIR * (CAR0 + i * CAR_D));
          // the engine lets go one puff to every PUFF_D of rail, and a puff stays over the place where it was let go:
          // it swells, rises, thins and drifts down the wind by how far the engine has gone on since (its bobbing
          // runs from a phase of its own), and is gone TRAIL behind the engine; none is let go under the hill (a
          // puff fades over the 6 m inside a mouth)
          const q = TDIR * xe / PUFF_D, nq = Math.floor(q);
          for (let j = 0; j < NPUFF; j++) {
            const age = q - (nq - j), a = trainAt(xe - TDIR * (age * PUFF_D - 5.5), TR), open = smoothstep(MOUTH_NEG, MOUTH_NEG + 6, a.x) * (1 - smoothstep(MOUTH_POS - 6, MOUTH_POS, a.x));
            const sc = (1.3 + 0.55 * age) * smoothstep(0, 0.6, age) * (1 - smoothstep(4, NPUFF - 0.5, age)) * open;
            puffs.place(n * NPUFF + j, a.x + WIND[0] * 0.25 * age, a.y + 7.6 + age * 1.8 + 0.4 * Math.sin(t * 1.3 + (nq - j) * 1.7), a.z + WIND[1] * 0.25 * age + 0.3 * age * Math.sin((nq - j) * 2.3), (nq - j) * 1.3, 0, 0, 1, sc);
          }
        }
        engine.mesh.instanceMatrix.needsUpdate = true; cars.mesh.instanceMatrix.needsUpdate = true;
        puffs.mesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < flock.length; i++) { const q = flock[i], gr = smoothstep(-0.2, 0.3, Math.sin(t * q.w + q.ph)); q.set.anim(q.i, 0.3 * Math.sin(t * 0.4 + q.ph) * (1 - gr), 0.95 * gr + 0.04 * Math.sin(t * 5 + q.ph) * gr, 0, 0); }
        for (const set of sheepSets) set.iAnim.needsUpdate = true;
        forest.update(dt, t, camera); wood.update(dt, t, camera); fauna.update(dt, t, camera, u); down.update(dt, t, camera);
      },
      dispose() { if (sky.dispose) sky.dispose(); },
    };
    const cam0 = new THREE.PerspectiveCamera(62, 1.78, 0.3, 6000); cam0.position.copy(path.start); cam0.updateMatrixWorld(true);
    world.update(0, 0, cam0, 0);                                         // every instance in its place before the first frame
    return world;
  },
};
