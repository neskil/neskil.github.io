// CABLES TO THE MOON: the roof of the forest.
//   makeCanopy()     one shader sheet that follows the eye: leaf, crown and country scales of pattern, swells, gusts, haze
//   makeLeaves()     the real leaves we skim (three shapes from one grid, shaped and veined in the shader)
//   makePeakMesh()   the canopy drawn up like cloth under a tent pole where a cable is tied, and the far ones
//   makeCrownTrees() the built crowns: the roof's (roofCrowns: the painted pattern's own) and the hill's (hillCrowns)
// Everything here subtracts cmDrop() (the forest falling away as we climb) and rides cmRoof() (the swells and
// the crowns standing on them; the common part). ANTIALIASING, declared once: a pattern goes to its mean when it
// is smaller than a few pixels, by the pixel's footprint (fw, fc, cmPx: screen derivatives of the thing's own
// coordinates); nothing here goes by metres from the eye but the air (cmHaze) and ONE thing of the sheet's own
// mesh, a rule of cost of that one mesh (SHEET_VERT): its middle goes with the eye and its cells are 0.055 of
// their distance from its middle across, so the HEIGHT THE MESH IS DRAWN AT carries the swells out to
// 1,100 m from its middle on the map (gone to the level by 2,400 m). (Mend T) THE MESH CARRIES NO CROWN: it
// lies at the crowns' mean, 2.7 m under the swell, and THE CROWNS ARE RELIEF DRAWN BY THE RAY in the
// sheet's own program (SHEET_FRAG), a wood of crowns at every distance. Everything PAINTED on the sheet
// goes by the pixel's footprint alone: a crown's round (edge, gap, lit and shaded sides, shade) by the
// pixel's reach ON THAT RELIEF, crisp while a crown is more than about two pixels across; its grain by the
// pixel's width where the ray meets the crown; the swells' light, the ranks and the valleys by the larger
// reach on the map (mend S). WHAT A ROUND GOES TO IS THE MEAN OF WHAT THE RAY SEES OF IT, light as well as
// shade, declared once (cnMean); the one thing there that reads the ray's angle to the roof is how open a
// crown's sides are (cnHid). Things stand on cmRoof, never on the mesh: a crown-top can stand up to
// 18.7 m over the mesh under it (a 16 m crown on its swell, the mesh 2.7 m under the swell).
import * as THREE from 'three';
import { cmStream, crownSites, crownTop, CM_GLSL, withShared, Geo, bound, hump, peakH, peakLump, crownSize, clamp, lerp, sstep, ROOF_Y } from './cables-to-the-moon-common.js';

// ---------------------------------------------------------------- the pattern of a canopy seen from above
// (mend T, T1 c) THE LAND'S OWN LIGHT AND SHADE AT A PLACE: one sum, for the painted roof and for the built crowns
// that stand on it (the built crowns had none of it: under a cloud's shadow, in a basin or on an old patch they
// stood bright on a darker roof, and the line between made and painted wood could be drawn).
const LAND_GLSL = /* glsl */`
// x: the shadow of high cloud, drifting, an edge to it; y: the sun between clouds; z: the old patches of forest
// (-0.5 .. 0.5); w: a rift, a long dark valley of leaf. fw, the pixel's reach, WIDENS THE RIFT'S EDGE ONE WAY
// (outward: 0.014 + fw * 0.0003), so the rift's mean over the land RISES with the footprint (mend U, the code
// reader's count: 0.037 near; 0.28 to 0.30 at a reach of 460 to 490 m): it darkens far wood under flat
// rays. Said, not mended: it is named for the first polish round.
vec4 cnLandAt(vec2 p, float fw){
  float cloud = smoothstep(0.52, 0.62, cmF((p + uTime*vec2(7.0, 2.2))*0.0009 + 4.0));
  float bright = smoothstep(0.56, 0.64, cmF((p + uTime*vec2(7.0, 2.2))*0.0013 + 31.0))*(1.0 - cloud);
  float rf = abs(cmF(p*0.00055 + 7.0) - 0.5);
  return vec4(cloud, bright, cmF(p*0.0021 + 3.0) - 0.5, 1.0 - smoothstep(0.006, 0.014 + fw*0.0003, rf));
}
// what they do to a leaf's openness
float cnLandAo(vec4 L){ return (1.0 - 0.24*smoothstep(0.0, -0.3, L.z))*(1.0 - 0.8*L.w)*(1.0 - 0.5*L.x); }
// THE LAND'S LARGE RELIEF TELLS (the basins lie in a little shade, the ridges catch the sun); THE ROOF STANDS IN
// RANKS (the long swells are darker where they rise); LONG DARKER VALLEYS run through the forest (a pattern of
// the land drawn out one way, 2.5 km long and 600 m across); and THE STEAM BANKS THROW THEIR SHADE on the leaves
// under them (cmSteam's own banks, drifting with them; read at the roof itself, wherever it has sunk to).
// The ranks and the valleys are light and shade about the wood's own mean (each over its own mean over the
// land, 0.87 and 0.95: mend S); wRank, wVale: how much of each is drawn (the sheet's footprint fades; 1 near).
float cnLandLight(vec2 p, float wRank, float wVale){
  float rel = cmRelief(p), rank = cmN(p*0.0019 + 5.0);
  float valley = smoothstep(0.5, 0.74, cmN(vec2(p.x*0.0004 + p.y*0.00022, p.y*0.0017 - p.x*0.0006) + 21.0));
  float bankS = clamp((cmSteam(vec3(p.x, -cmDrop(p), p.y)) - 0.2)/0.5, 0.0, 1.0);
  return mix(0.64, 1.0, smoothstep(-7.0, 1.0, rel))*(1.0 + 0.22*smoothstep(2.0, 8.0, rel))*mix(1.0, (1.0 - 0.3*smoothstep(0.4, 0.66, rank))/0.87, wRank)*mix(1.0, (1.0 - 0.2*valley)/0.95, wVale)*(1.0 - 0.15*bankS);
}
`;
const CANOPY_GLSL = /* glsl */`
${LAND_GLSL}
// nearest and second nearest point of a scatter: x = F1, y = F2 - F1, zw = vector to the nearest
vec4 cnCell(vec2 p, out float id){
  vec2 n = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; vec2 r1 = vec2(0.0); id = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)), o = cmH2(n + g), r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; r1 = r; id = cmH(n + g + 7.7); } else if (d < d2) d2 = d;
  }
  return vec4(sqrt(d1), sqrt(d2) - sqrt(d1), r1);
}
// THE ROOF SEEN FROM ABOVE, at four sizes: leaves (a third of a metre: never drawn one by one here, only as the
// glitter and grain of thousands, each tilted its own way), a tuft (the end of a bough, a clump of some hundreds of
// leaves, 6 m), a crown (34 m, dark between crowns where the depth goes down), the country (stands of forest,
// rifts, the shadows of cloud). p: metres on the roof; n0: the normal of the ground it lies on; tx, tz: where the
// pattern's two axes point in the world; v: to the eye; fw: metres a pixel covers; crownK: 1 where p lies on a
// roof of many crowns, 0 where the whole thing drawn is one crown (kindT: its own number then). The stands'
// tone, the old patches' shade, the cloud's shadow and the sun between clouds are the same at every distance.
// A CROWN'S ROUND (its dome's light, the gap round it, its lit and shaded sides, the shade it throws, its lit
// edge) and its KIND (its colour: new leaf, bronze, flower, dead, old, yellowing) go to their means by ONE
// weight, wCrown (wRound is the same number): by the pixel's reach on the crowns' relief on the sheet, by
// fw on every other thing that calls canopy(). (Mend R's cnRound, a fade by the smaller reach, is gone.)
// (mend T, T1) THE SHEET DRAWS THE CROWNS AS RELIEF (SHEET_FRAG) and hands canopy() two footprints of its own:
// cnCrown, the pixel's reach ON THAT RELIEF (a crown's round goes to its mean by it), and cnFine, the pixel's
// reach on a crown's own surface (its tufts, sprigs and leaves go by it). Under 0: the caller has none, and
// both are fw (the hills' cloth).
float cnCrown = -1.0, cnFine = -1.0;
// cnHid: HOW MUCH OF THE GAPS BETWEEN CROWNS THE RAY CANNOT SEE. The painted sheet sets it by the angle the ray
// makes with the roof (SHEET_FRAG); every other thing that calls canopy() leaves it 0. It is read in ONE
// place, the mean of the rounds (cnMean, below): where it is 1 a crown's sides are as open as its top,
// where it is 0 they are CN_FLK of it. (Mends S and S2 shaded the whole round by it and ended the round's
// fade at two counted numbers, CN_MEAN and CN_MEAN_TOPS, with CN_TOPS for a side's shade: all three are
// gone. In mend T the relief hides the gaps from a flat ray by itself, and the fade's end is cnMean.)
float cnHid = 0.0;
const float CN_GAP = 0.45, CN_GIANT = -0.06;
const vec3 CN_KIND = vec3(1.07, 0.94, 1.45);
// (mend T, T1 a) THE CROWNS' RELIEF AS IT IS DRAWN: the common part's cmCrownH (each crown's dome by the one
// rule of size, its top its own height over the swell, 7 m down in the gaps), with EVERY CROWN'S EDGE ROUNDED
// DOWN INTO THE GAP between it and the next: over the last 0.45 of a crown's lead over its neighbour (some 8 m
// on the map) what is left of its side falls to the gap's floor. Where two crowns of unlike height or size
// meet, cmCrownH has a cliff; drawn, that was a wall with the paint run down it. cnEdge: how much of the
// dome is left at a point by that fall (1 inside, 0 on the line between two crowns); cnSide: how far down
// its side the point lies with it, 0 on the top .. 1 on the gap's floor.
float cnEdge(float lead){ return smoothstep(0.0, 0.45, lead); }
float cnSide(float f1, float lead){ return 1.0 - (1.0 - cmSide(f1))*cnEdge(lead); }
float cnH(vec2 p){ float id; vec2 sq; vec4 c = cmCrownQ(p, id, sq); float s = cnSide(c.x/cmSize(id, sq), c.y); return cmTop(id)*(1.0 - s) - 7.0*s; }
// (mend T, T1 b, with the reader's R1) THE MEAN OF WHAT THE RAY SEES OF THE ROUNDS, DECLARED ONCE, HERE. Where a
// crown is no longer drawn singly (wRound 0) the wood is not the level roof with a number for its shade: it
// is the light of A DOME'S SEVEN FACES, its top and six sides (60 degrees apart round it, the first toward
// the eye: each tilted CN_TILT from the roof's own normal, and wider by CN_GS of the spread of the grain
// that has gone to its mean), every face lit by the leaf's own law (cmLeaf: the sun on it, its shade, and
// the light that comes THROUGH a face turned from the sun, by the ray's turn to the sun), and each counted
// by how much of it the ray sees: its share of the dome (the top CN_TOPW, the sides the rest) times how
// squarely it faces the eye; a face turned from the eye is not seen. WHAT THE FADE TAKES AWAY IT GIVES BACK,
// LIGHT AS WELL AS SHADE: a side has the whole round's own turn-to-the-sun factor (1 + flank (0.5 t - 0.1),
// t the side's turn to the sun's bearing: CN_FLKL is the flank's mean over a side) and the mean of a
// crown's lit-through edge (CN_EDGE of a side turned to the sun: cnEdgeM, added with the tufts' edges by
// the same turn of the ray to the sun). So the wood toward the sun keeps the glow of its lit-through
// sides at every distance and in every size of picture, and away from the sun its lit sides. The sides'
// openness: CN_FLK of the top's where the ray sees the gaps (cnHid 0), the top's own where it sees none;
// the whole by CN_SHD, the mean of the shade a crown throws and of its flanks (the map's count: 0.900 x
// 0.973). The numbers were settled BY COUNT against the whole rounds, in the page, on chance points of the
// map, never at a still (shots/cables-to-the-moon/fix14/cables-to-the-moon-meancal.js: the report's table,
// rays of 2 to 70 degrees, bearings every 10 degrees from the sun's to 60, then 75, 90, 135, 180, 270).
const float CN_TILT = 0.8, CN_TOPW = 0.36, CN_FLK = 0.8, CN_SHD = 0.876, CN_FLKL = 0.25, CN_GS = 0.5, CN_EDGE = 0.46;
// (mend T, the reader's R1, for the GRAIN) WHERE LEAVES, SPRIGS AND TUFTS GO TO THEIR MEANS, THEIR LIGHT GOES TO ITS
// MEAN: the leaf's light (cmLeaf) over the spread of tilts the grain gave the roof, not the light of the one
// flat face left. The tilt a leaf, a sprig or a tuft gives, along one axis, deviates by CN_SL, CN_SS, CN_ST
// (the roof's own unit: a tilt of 1 is 45 degrees); sg is root three times the deviation of all that has
// gone to its mean, and the light is taken at the face and at sg to each side of it ALONG THE SUN'S BEARING
// (the one axis the sun's light and the lit-through light go by), weighed 2/3, 1/6, 1/6: the three-point
// rule for a spread. The numbers were settled by count (fix14/cables-to-the-moon-graincal.js).
const float CN_SL = 0.43, CN_SS = 0.2, CN_ST = 0.31;
// (and what the spread does not give back, counted the same way: a leaf's holes, its young leaves and its
// glitter, a tuft's own lit and shaded sides: the wood with the leaves at their mean stood at 0.93 of the
// wood with them drawn, with the tufts at 0.92: CN_GL, CN_GT are those two made up)
const float CN_GL = 1.075, CN_GT = 1.09;
vec3 cnLeafG(vec3 nU, vec3 ax, float sg, vec3 v, float tone, float ao, float wax){
  vec3 c = cmLeaf(normalize(nU), v, tone, 0.85, ao, wax);
  if (sg > 0.03) c = c*0.6666667 + (cmLeaf(normalize(nU + ax*sg), v, tone, 0.85, ao, wax) + cmLeaf(normalize(nU - ax*sg), v, tone, 0.85, ao, wax))*0.1666667;
  return c;
}
// (mend T, T1 c) NO BLACK HOLES: LEAF IN DEEP SHADE IS DARK GREEN WITH FORM. The shades that lie on the roof (a
// crown's own, a giant's, the hills', the cloud's, the steam banks', the basins', the valleys', the ranks')
// each take their share of a leaf's WHOLE light, and where two or three of them met on a crown's side
// turned from the sun the product fell under the picture's own black (counted with a ramp drawn on the
// sheet: the engine's grade shows a linear green of 0.045 and all under it as black, 0.06 as 30 of 255,
// 0.07 as 44): a hole in the wood, and whole fields of them where the land lies in shade. But a shade
// takes the sun's light, not the sky's: so no leaf PAINTED on the roof's sheet or on a hill's cloth (the two
// that take the floor: mend U; the BUILT crowns and the twigs' leaves take none) is drawn darker than cnFloor, the leaf's
// own darkest green (uLeafD) times CN_DEEP, a little lighter where the leaf's face looks up at the sky
// and by the leaf's own tone and the grain's openness (0.79 to 1.27 of it: the dark keeps the grain's and
// the crown's form).
// cnDeep(): what is drawn comes down to that floor smoothly and never under it (the floor and a soft step
// up from it an eighth of the floor wide: a colour of one and a quarter floors is left as it is within
// an eightieth). The two that call canopy() (the sheet, the hills' cloth) pass their own last shades
// through it; the floor goes to its mean with the round and the grain that form it. CN_DEEP was set on
// the whole field, by the grade's black: the floor shows as 5 to 50 of 255 in green.
const float CN_DEEP = 1.45;
vec3 cnFloor = vec3(0.0);
vec3 cnDeep(vec3 col){ vec3 f = max(cnFloor, vec3(1e-5)), x = 8.0*(col - f)/f; return f + 0.125*f*mix(log(1.0 + exp(min(x, 20.0))), x, step(20.0, x)); }
float cnEdgeM = 0.0;       // (cnMean leaves the lit-through edge's mean over the same faces here)
vec3 cnMean(vec3 nG, vec3 n0, vec3 tx, vec3 tz, vec3 v, float tone, float ao, float wax, float sg){
  vec2 eb = vec2(dot(v, tx), dot(v, tz)); eb /= max(length(eb), 1e-4);          // the eye's bearing on the roof
  vec2 sb = normalize(vec2(dot(uSunDir, tx), dot(uSunDir, tz)) + 1e-4);          // and the sun's
  // (the sides' tilt with the grain's spread in it: the two spreads add by their squares)
  float tl = sqrt(CN_TILT*CN_TILT + CN_GS*sg*sg/3.0), aoS = ao*mix(CN_FLK, 1.0, cnHid), wS = (1.0 - CN_TOPW)/(6.0*sqrt(1.0 + tl*tl));
  float w = CN_TOPW*max(dot(n0, v), 0.0), ws = w, ed = 0.0;
  vec3 c = w*cnLeafG(nG, tx*sb.x + tz*sb.y, sg, v, tone, ao, wax);
  for (int i = 0; i < 6; i++) {
    // (the six sides stand 60 degrees apart round the dome, the first toward the eye)
    float ca = i == 0 ? 1.0 : (i == 3 ? -1.0 : (i == 1 || i == 5 ? 0.5 : -0.5)), sa = i == 0 || i == 3 ? 0.0 : (i < 3 ? 0.8660254 : -0.8660254);
    vec2 d2 = vec2(eb.x*ca - eb.y*sa, eb.x*sa + eb.y*ca); vec3 d = (tx*d2.x + tz*d2.y)*tl;
    w = wS*max(dot(n0 + d, v), 0.0);
    if (w > 0.0) {
      float ts = dot(d2, sb);
      c += w*cmLeaf(normalize(nG + d), v, tone, 0.85, aoS, wax)*(1.0 + CN_FLKL*(0.5*ts - 0.1));
      ed += w*CN_EDGE*max(ts, 0.0); ws += w;
    }
  }
  ws = max(ws, 1e-4); cnEdgeM = ed/ws;
  return c*(CN_SHD/ws);
}
vec3 canopy(vec2 p, vec3 n0, vec3 tx, vec3 tz, vec3 v, float fw, float crownK, float kindT){
  vec2 p0 = p;
  // CRISP AT THE SIZE IT IS SEEN (antialiasing by the pixel's footprint; nothing here blurs wider than it).
  // EVERY SIZE GOES TO ITS MEAN BY THE FOOTPRINT, never by metres from the eye. fw is the pixel's LARGER reach
  // on the thing's own map (round Q, R4 a: seen at a low angle a pixel is long along the line from the eye,
  // and a flat pattern drawn whole where the pixel was already longer than it ran into streaks).
  // A giant's light and shade is whole while fw is under 0.16 of 90 m and at its mean past 0.42 of it; the
  // stands from 0.25 to 0.8 of 420 m. A crown and its grain go by the two footprints below (on the sheet the
  // pixel's reach on the relief and its width where the ray meets a crown; elsewhere fw): a tuft's grain is
  // whole while its footprint is under 0.15 of 6 m and gone past 0.6 of it; sprigs and leaves from 0.25 to
  // 0.9 of 1.5 m and 0.34 m.
  // (mend T, T1 b) A CROWN IS CRISP WHILE IT IS MORE THAN ABOUT TWO PIXELS ACROSS: whole while the pixel's reach
  // (fc) is under 0.4 of 34 m (two and a half pixels to a crown) and at its mean past 0.8 of it (one and a
  // quarter). It was whole only to 6 pixels and, on the sheet, gone under 17 by the smaller reach (mend R).
  float fc = cnCrown < 0.0 ? fw : cnCrown;
  float wCrown = 1.0 - smoothstep(0.4, 0.8, fc/34.0), wLand = 1.0 - smoothstep(0.25, 0.8, fw/420.0);
  float wRound = wCrown;
  float gust = cmGust(p, uTime);
  float idT = 0.0, idS = 0.0, idC, idL;
  vec4 ct = vec4(0.3, 0.3, 0.0, 0.0), cs = vec4(0.3, 0.3, 0.0, 0.0);
  vec2 sqC; vec4 cc = cmCrownQ(p, idC, sqC);
  // (THE ONE RULE OF SIZE, cmSize in the common part: the built crowns call its JS twin)
  float kSz = mix(1.0, cmSize(idC, sqC), crownK);
  float f1s = cc.x/kSz, side = mix(clamp(2.3*f1s*f1s, 0.0, 1.0), cnSide(f1s, cc.y), crownK)*crownK;
  // (mend T, T1 a and c) A CROWN'S SIDE IS LIT LEAF LIKE ITS TOP, down to the GAP between it and the next: leaf in
  // shade (CN_GAP of the top's openness, never a black hole), taken up over the lower half of the side. (It
  // darkened from the top down to 0.07: a painted crown was a bright spot in a wide dark ring, and the wood
  // stood far under the built crowns beside it.) The dome's slope is the relief's own: it falls (top + 7 m)
  // x 2.3 x (r / (34 m x size))^2, so a metre out it tilts 4.6 (top + 7) r / (34 size)^2; its edge tilts more.
  float domeAo = mix(1.0, CN_GAP, smoothstep(0.5, 1.0, side));
  float domeK = mix(1.3/kSz, min(4.6*(cmTop(idC) + 7.0)/(34.0*kSz*kSz), 2.2), crownK), bs = (1.0 - cnEdge(cc.y))*crownK;
  vec2 domeW = cc.zw*domeK*step(side, 0.999) + cc.zw/max(cc.x, 1e-3)*5.0*bs*(1.0 - bs), dome = domeW*wRound;
  // THE GRAIN'S FOOTPRINT (fd): the caller's (fw), or on the sheet's relief the pixel's width where the ray
  // meets the crown (cnFine) over how squarely it meets the crown's own surface there
  float fd = cnFine < 0.0 ? fw : min(fw, cnFine/max(dot(normalize(n0 - tx*dome.x - tz*dome.y), v), 0.05));
  float wLeaf = 1.0 - smoothstep(0.25, 0.9, fd/0.34), wSprig = 1.0 - smoothstep(0.25, 0.9, fd/1.5), wTuft = 1.0 - smoothstep(0.15, 0.6, fd/6.0);
  // (mend T, T1 a: THE GRAIN IS THE MAP'S, on the relief as on the level. A trial that moved it outward by the
  // depth fallen, to lay it on the crown's own surface, drew the tufts and sprigs two to three times too
  // small round every lesser crown, in fine lines of equal height: taken out. On a steep side a leaf is
  // drawn as long as the side is steep.)
  if (wTuft > 0.002) ct = cnCell(p/6.0 + 5.0, idT);
  if (wSprig > 0.002) cs = cnCell(p/1.5 + 11.0, idS);
  vec2 wv = vec2(cmN(p*0.0021 + 1.0), cmN(p*0.0021 + 9.3)) - 0.5;
  vec4 cl = cnCell((p + 200.0*wv)/420.0 + 3.0, idL);
  // leaves: each cell of a third of a metre is one leaf's worth of roof, tilted its own way, some of them holes
  vec2 lc = floor(p/0.34); float id1 = cmH(lc + 3.1), id2 = cmH(lc + 47.7);
  vec2 tilt = (vec2(id1, id2) - 0.5)*1.5;
  tilt += gust*0.5*sin(uTime*(5.0 + 4.0*id2) + id1*40.0)*vec2(id1 - 0.5, id2 - 0.5);
  float hole = step(0.84, fract(id1*7.7 + id2*3.1));
  float young = step(0.93, fract(id1*31.7));
  float leafAo = mix(1.0, 0.25, hole);
  // a sprig and a tuft: mounds of leaves, shaded between mounds
  float sprigAo = 0.55 + 0.45*smoothstep(0.0, 0.3, cs.y);
  // (a tuft is a soft billow of leaf, lit on its sun side: never a dark-edged scale)
  float tuftAo = 0.62 + 0.38*smoothstep(0.0, 0.5, ct.y);
  // the country: whole stands paler or darker, older forest in patches, rifts where a river runs under the roof
  float land = 0.5 + 0.5*cos(idL*6.2831853), landEdge = smoothstep(0.0, 0.25, cl.y);
  // A CROWN IS A DOME OF ITS OWN SIZE: 0.72 to 1.28 of the room the pattern gives it by its own number; a lesser
  // tree is 0.62 to 0.48 of that, ringed by the dim understory it stands in (one in ten, and seven in ten in a
  // drift of small trees); and the one in 25 that stands over the rest (cmTop) fills its room to the edge. Its sides fall into the gap between it and the next
  // (leaf in shade, never a black hole). (The painted look alone:
  // what stands on the roof stands on cmRoof, unchanged.)
  vec2 grain = tilt*wLeaf - cs.zw*0.7*wSprig - ct.zw*1.1*wTuft, bump = grain - dome;
  vec3 nG = n0 + tx*grain.x + tz*grain.y, n = normalize(nG - tx*domeW.x - tz*domeW.y);     // (n: the WHOLE round's)
  vec4 LD = cnLandAt(p0, fw);                       // the land's own shades at the place (LAND_GLSL)
  float cloud = LD.x, bright = LD.y, patchy = LD.z, rift = LD.w;
  float kindC = mix(kindT, fract(idC*3.3), crownK);
  // WHAT KIND OF TREE A CROWN IS (the built crowns read the same two numbers: roofCrowns): in new leaf, bronzed,
  // and of the rest one in ten in flower, one in 17 dead, one in six an older green, one in 18 yellowing
  float kq = fract(idC*29.9), mid_ = step(0.07, kindC)*step(kindC, 0.88)*crownK;
  float kFlower = mid_*step(kq, 0.1), kDead = mid_*step(0.1, kq)*step(kq, 0.16), kOld = mid_*step(0.16, kq)*step(kq, 0.33);
  // THE SHADE OF A CROWN (a rule of the place: the sun stands 15 degrees up on the visit's own bearing): a crown
  // that stands taller toward the sun throws its shade on the roof behind it
  vec2 sx = normalize(vec2(dot(uSunDir, tx), dot(uSunDir, tz)) + 1e-4);
  float shade = 0.0;
  if (wRound*crownK > 0.01) {
    float sd0 = cmSide(cc.x/kSz), hp = cmTop(idC)*(1.0 - sd0) - 7.0*sd0;
    for (int i = 0; i < 3; i++) {
      float L = i == 0 ? 9.0 : (i == 1 ? 18.0 : 30.0), ids; vec2 sqN; vec4 cq = cmCrownQ(p + sx*L, ids, sqN); float sq = cmSide(cq.x/cmSize(ids, sqN));   // (T5: the neighbour's dome by the crowns' one rule of size, as this crown's own is)
      shade = max(shade, smoothstep(0.0, 3.0, cmTop(ids)*(1.0 - sq) - 7.0*sq - hp - 0.268*L));
    }
  }
  float tone = clamp(0.3 + 0.5*(fract(id1*7.1) - 0.3)*wLeaf + 0.3*(fract(idS*3.7) - 0.5)*wSprig + 0.3*(fract(idT*5.3) - 0.5)*wTuft + 0.8*(kindC - 0.5)*wCrown
    + ((land - 0.5)*0.8*wLand + patchy*1.1)*0.75 + 0.3*rift, 0.0, 1.0);
  // (aoG: the openness of the grain and the stands, without the round; ao: with the WHOLE round's)
  float aoG = mix(0.88, leafAo, wLeaf)*mix(0.847, sprigAo, wSprig)*mix(0.805, tuftAo, wTuft)*mix(1.0, 0.8 + 0.2*landEdge, 0.6*wLand);
  float ao = aoG*mix(1.0, domeAo, crownK);
  // GIANTS (a few stand over the rest: three in ten of the 130 m cells hold one, its dome 70 to 110 m across):
  // lit on its sun side and shaded on the other, a dark cleft round its foot, its shade thrown 45 to 85 m on the
  // roof behind it (the sun's bearing); the common crowns' clefts are only creases between its great boughs.
  // It goes to its mean by the footprint as the crowns do (whole at 6 pixels across, gone under 2.4).
  float idG; vec4 cg = cnCell(p0/130.0 + 31.0, idG);
  float wG0 = 1.0 - smoothstep(0.16, 0.42, fw/90.0), wG = wG0*crownK, gR = 0.27 + 0.15*fract(idG*3.7);
  float gIs = step(fract(idG*7.31), 0.3), gIn = gIs*(1.0 - smoothstep(gR - 0.05, gR, cg.x));
  float gRing = gIs*smoothstep(gR - 0.05, gR, cg.x)*(1.0 - smoothstep(gR + 0.01, gR + 0.09, cg.x));
  float gShade = 0.0;
  if (wG > 0.01) for (int i = 0; i < 2; i++) {
    float i2; vec4 c2 = cnCell((p0 + sx*(i == 0 ? 45.0 : 85.0))/130.0 + 31.0, i2); float r2 = 0.27 + 0.15*fract(i2*3.7);
    gShade = max(gShade, step(fract(i2*7.31), 0.3)*(1.0 - smoothstep(r2 - 0.04, r2 + 0.03, c2.x)));
  }
  vec2 og = -cg.zw/max(cg.x, 1e-3);
  ao = mix(ao, max(ao, 0.62*mix(0.847, sprigAo, wSprig)*mix(0.805, tuftAo, wTuft)), gIn*wG);
  float giant = 1.0 + crownK*mix(CN_GIANT, gIn*(0.1 + 0.34*dot(og, sx)*smoothstep(0.1, 0.7, cg.x/gR)) - 0.6*gRing - 0.42*gShade*(1.0 - gIn), wG0);
  float aoL = cnLandAo(LD);                         // the land's own shades
  ao *= aoL*(1.0 - 0.62*shade);
  // THE SUN'S SIDE OF EVERY CROWN IS LIT AND ITS FAR SIDE IS IN SHADE (the sun stands low on the visit's bearing):
  // by where on the dome the point lies, and a little the same for each tuft; it goes to its mean with the crown
  vec2 od = -cc.zw/max(cc.x, 1e-3), ot = -ct.zw/max(ct.x, 1e-3);
  float flank = smoothstep(0.1, 0.6, f1s)*(1.0 - side*side);
  float toward = clamp(dot(-v, uSunDir), 0.0, 1.0), wax = (0.9*wLeaf + 0.15)*(1.0 - 0.6*cloud);
  // each leaf throws the sun back its own way: a glitter, never a broad shine
  // THE WHOLE ROUND: the leaf's light on the dome's own face, its sun side and its far side, its lit-through edge
  // (sg: the spread of the grain that has gone to its mean; ax: the sun's bearing on the roof: cnLeafG, above)
  float sg = sqrt(3.0*((1.0 - wLeaf)*CN_SL*CN_SL + (1.0 - wSprig)*CN_SS*CN_SS + (1.0 - wTuft)*CN_ST*CN_ST));
  vec3 ax = tx*sx.x + tz*sx.y;
  vec3 col = cnLeafG(nG - tx*domeW.x - tz*domeW.y, ax, sg, v, tone, ao, wax)*(1.0 + crownK*flank*(0.5*dot(od, sx) - 0.1));
  col += uLeafT*uSunCol*(clamp(dot(-cc.zw, sx)*1.6, 0.0, 1.0)*side*(1.0 - side)*4.0*crownK)*toward*toward*0.2*(1.0 - 0.7*cloud);
  // AND ITS MEAN, where a crown is no longer drawn singly (cnMean, above)
  float aoM = aoG*aoL;
  float edgeM = 0.0;
  if (crownK*(1.0 - wRound) > 0.004) { col = mix(cnMean(nG, n0, tx, tz, v, tone, aoM, wax, sg), col, mix(1.0, wRound, crownK)); edgeM = cnEdgeM*crownK*(1.0 - wRound); }
  col *= (1.0 + 0.4*young*wLeaf + 0.2*gust*wTuft)*(1.0 + 0.22*bright)*(1.0 + 0.2*wTuft*smoothstep(0.1, 0.5, ct.x)*dot(ot, sx))*giant;
  col *= mix(CN_GL, 1.0, wLeaf)*mix(CN_GT, 1.0, wTuft);
  // (a crown's KIND goes to its mean with the crown: CN_KIND, the mean of the kinds' colours over the pattern)
  col *= mix(vec3(1.0), mix(CN_KIND, vec3(1.0), wCrown), crownK);
  // a crown now and then in new leaf (pale, yellow), bronzed to copper, in flower (pale gold or white, in dabs on
  // its tufts), dead (grey), or an older darker green: each tells from far off
  float lum = dot(col, vec3(0.3, 0.5, 0.2));
  col = mix(col, col*vec3(1.25, 1.12, 0.62), (step(0.88, kindC)*0.7*wCrown + young*wLeaf*0.6)*(1.0 - side));
  col = mix(col, lum*vec3(2.1, 1.02, 0.42), step(kindC, 0.07)*crownK*0.75*wCrown);
  col = mix(col, lum*(kq < 0.05 ? vec3(2.0, 1.9, 1.5) : vec3(2.1, 1.6, 0.62)), kFlower*wCrown*(1.0 - 0.7*side)*mix(0.6, step(0.4, fract(idT*9.7)), wTuft));
  col = mix(col, lum*vec3(0.62, 0.59, 0.54), kDead*0.85*wCrown);
  col = mix(col, col*vec3(1.3, 1.1, 0.5), mid_*step(0.4, kq)*step(kq, 0.455)*0.8*wCrown*(1.0 - side));       // a yellowing crown
  col = mix(col, col*vec3(0.6, 0.68, 0.55), kOld*0.8*wCrown);
  // the hard light of the swollen sun: the far side of every crown and tuft is lit through, its top glares
  // (the tufts' lit-through edges, and where they are at their mean its mean, 0.1; the crowns' edges' mean, cnMean's)
  col += uLeafT*uSunCol*(mix(0.1, clamp(dot(-ct.zw, sx)*2.0, 0.0, 1.0)*0.5, wTuft) + edgeM)*toward*toward*0.2*(1.0 - 0.7*cloud);
  // (mend T, R1: THE FAR SHEEN IS TAKEN OUT. "Far off the glitter of a million leaves runs together into a sheen":
  // it came on as the sprigs went to their mean and so was a light by the footprint, a fifth of the wood's
  // light straight toward the sun that the near wood and the built crowns never had.)
  // (a rift is a long dark valley of leaf: nothing in this forest shines as open water)
  cnFloor = uLeafD*(CN_DEEP*(0.8 + 0.3*clamp(normalize(nG - tx*dome.x - tz*dome.y).y, 0.0, 1.0))*mix(0.93, 1.07, tone)*mix(0.9, 1.08, aoG));
  return col;
}
`;

// ---------------------------------------------------------------- the sheet
const SHEET_VERT = /* glsl */`
uniform vec3 uCentre;
varying vec3 vW;
${CM_GLSL}
void main(){
  vec2 xz = position.xz + uCentre.xz;
  // THE SHEET'S OWN MESH (a rule of cost of this one mesh; no thing stands on it): its cells are 0.055 of their
  // distance from its middle across (its middle goes with the eye: the one reading of the eye's map place
  // here). (Mend T) IT CARRIES NO CROWN: it lies at the crowns' mean, 2.7 m under the swell, and the crowns
  // are relief drawn by the ray on it (SHEET_FRAG). It carries the swells while its cells are under 60 m
  // (1,100 m from its middle) and lies at the roof's level where they are past 130 m (2,400 m). Only the
  // mesh's drawn height: what stands on the roof stands on cmRoof and does not move.
  float r = length(position.xz), cell = 0.055*r;
  float amp = 1.0 - smoothstep(60.0, 130.0, cell);
  float y = mix(${ROOF_Y.toFixed(1)}, cmHump(xz, uTime) - 2.7, amp) - cmDrop(xz);
  vW = vec3(xz.x, y, xz.y);
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`;
const SHEET_FRAG = /* glsl */`
varying vec3 vW;
${CM_GLSL}
${CANOPY_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  vec2 p = vW.xz;
  // THE PIXEL'S TWO REACHES ON THE MAP: the larger (fw) and the smaller (fs: the footprint's area over fw)
  vec2 pdx = dFdx(p), pdy = dFdy(p);
  float fw = max(max(length(pdx), length(pdy)), 1e-4), fs = max(abs(pdx.x*pdy.y - pdx.y*pdy.x)/fw, 1e-4);
  float e = 3.0;
  float h0 = cmHump(p, uTime), hx = cmHump(p + vec2(e, 0.0), uTime), hz = cmHump(p + vec2(0.0, e), uTime);
  vec3 n0 = normalize(vec3(-(hx - h0)/e, 1.0, -(hz - h0)/e));
  // (mend T, T1 a and b) THE CROWNS ARE RELIEF, DRAWN BY THE RAY. The sheet's mesh carries the swells and lies
  // at the crowns' mean, 2.7 m under the swell; the crowns stand on it as the common part's cmCrownH has them
  // (tops to 6 m over the swell, the gaps 7 m under it: the heights everything stands on; drawn with each
  // crown's edge rounded into the gap, canopy()'s cnH). The ray is walked
  // down from 7 m over the swell to the gaps' floor and the first crown THE WALK FINDS is the crown drawn, at
  // the place on it where the ray meets it: so a ray that lies flat along the roof meets the near sides and
  // the tops of crowns standing one behind another and (as far as the walk reaches) not the gaps between
  // them, and a ray from above sees rounds with their gaps. THE WALK'S REACH, AS IT IS (mend U): one step to
  // each 7 m of map and 20 at the most, so under rays flatter than about 5.7 degrees a step is longer than
  // 7 m of map and a nearer crown's edge can be stepped over (the code reader's count: 13 rays in 100 under
  // 5.7 degrees, 22 to 23 under 4, 37 under 2): there the crown drawn is not always the first on the ray.
  // AND NOT ONLY UNDER FLAT RAYS (mend V, the same reader's count): under steeper rays too a crown is stepped
  // over now and then, 1.7 to 1.9 rays in 100 at 15 degrees (a step of 7 m of map can still pass a crown's
  // edge that stands into the ray by less than the step).
  // Said, not mended: named for the first polish round.
  // No pattern is laid flat and left to foreshorten into streaks (the cause of the
  // streaks: SHEET_FRAG's note below). A crown that stands higher than 7 m (one in 25) is drawn from where
  // the ray comes under 7 m.
  // THE PIXEL'S REACH ON THAT RELIEF (fr): never more than its larger reach on the map, and never more than
  // its smaller reach over 0.12: a crown's cap stands some 4 m over the crown before it, 0.12 of its 34 m,
  // and that cap is what a flat ray sees of it. A crown's round is whole while fr is under 0.4 of 34 m and at
  // its mean past 0.8 of it (canopy()'s wCrown; the same two numbers flatten the relief here, so the crowns
  // sink to the level as they go to their mean and nothing is cut off).
  float fr = 1.0/(1.0/fw + 0.12/fs), wRel = 1.0 - smoothstep(0.4, 0.8, fr/34.0);
  vec2 q = p;
  if (wRel > 0.01) {
    // sg: the ray's height over the swell, in the relief's own metres (9.7 = 7 m over the swell, counted
    // from the mesh 2.7 m under it; -4.3 = the gaps' floor); dq: the way on the map for a metre of it
    vec2 dq = v.xz*(wRel*n0.y/max(dot(v, n0), 0.015));
    float nSt = clamp(ceil(14.0*length(dq)/7.0), 3.0, 20.0), ds = 14.0/nSt, sHit = 9.7, sPrev = 9.7;
    // fA, fB: the ray's height over the relief at the last place found above it and the first found under it;
    // the meeting is where the straight line between the two crosses nought, so the place drawn goes
    // smoothly from pixel to pixel (halving alone left steps of a third of a metre: lines of equal height
    // on every near crown)
    float fA = 9.7 - cnH(p + dq*9.7) - 2.7, fB = -1.0;
    if (fA > 0.0) {
      sHit = -4.3;
      for (int i = 1; i <= 20; i++) {
        float sg = 9.7 - ds*float(i), f = sg - cnH(p + dq*sg) - 2.7;
        if (float(i) >= nSt || f <= 0.0) { sHit = max(sg, -4.3); sPrev = sHit + ds; fB = min(f, 0.0); break; }
        fA = f;
      }
      for (int i = 0; i < 4; i++) {
        float sm = 0.5*(sHit + sPrev), f = sm - cnH(p + dq*sm) - 2.7;
        if (f <= 0.0) { sHit = sm; fB = f; } else { sPrev = sm; fA = f; }
      }
      sHit = mix(sHit, sPrev, clamp(-fB/max(fA - fB, 1e-4), 0.0, 1.0));
    }
    q = p + dq*sHit;
  }
  cnCrown = fr;
  // (the grain on a crown goes by the pixel's width there over how squarely the ray meets the crown's own
  // surface: canopy()'s fd; fs is that width)
  cnFine = fs;
  // HOW MUCH OF THE GAPS BETWEEN CROWNS THE RAY CANNOT SEE (cnHid: read only by cnMean, where the rounds are at
  // their mean, for the openness of a crown's sides): a ray under 7 degrees to the roof sees none of the gaps
  // between the crowns before it, one steeper than 30 degrees sees them all (v.y: the sine of the ray's
  // angle to the level roof). Where the rounds are drawn the relief itself hides the gaps from a flat ray.
  cnHid = 1.0 - smoothstep(0.12, 0.5, v.y);
  vec3 col = canopy(q, n0, vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), v, fw, 1.0, 0.5);
  col *= 1.0 - 0.4*cmHillShade(p);                            // the hills' own shade lies on the roof
  // (round Q, R4 b) SEEN FROM A HEIGHT THE ROOF READS BY ITS FORM. The land's swells and the roof's own humps
  // (the heights this sheet is built to: n0 is their slope) are LIT ON THE SUN'S SIDE AND SHADED ON THE OTHER as
  // a slope under a sun 15 degrees up is: the light on a slope s toward the sun is (sin 15 - s cos 15)/sin 15 =
  // 1 - 3.7 s of the light on the level; here 3.0 of it, held within 0.28 either way. It is a function of the
  // place alone and its mean is the level's: where crowns have gone to their mean the land still has its relief.
  // (mend S, part 2 c: NO STRETCHED STRIPES. The swells are 75 to 315 m from crest to crest, the ranks about 500 m,
  // the long valleys 600 m across: seen at a grazing angle a pixel reaches farther than that along the ray
  // and they ran into dark parallel bands. Each goes to its mean by the pixel's larger reach, as every
  // pattern of the roof does: the swells' light whole while the reach is under a quarter of 150 m and at its
  // mean, the level's, past 0.8 of it; the ranks the same by 520 m; the valleys by 600 m: to 1, see below.)
  float wSwell = 1.0 - smoothstep(0.25, 0.8, fw/150.0), wRank = 1.0 - smoothstep(0.25, 0.8, fw/520.0), wVale = 1.0 - smoothstep(0.25, 0.8, fw/600.0);
  col *= 1.0 + wSwell*clamp(3.0*dot(n0.xz, normalize(uSunDir.xz + 1e-5)), -0.28, 0.28);
  // (a built crown stands on the painted crown it is a nearer look at, as tall as it, and covers it; the shade a
  // crown throws is the pattern's own, by the sun's bearing: nothing here is shaded by the road's line)
  // the land's large relief, its ranks, its long valleys and the steam banks' shade (LAND_GLSL's cnLandLight:
  // the same sum the built crowns take)
  col *= cnLandLight(p, wRank, wVale);
  col = cnDeep(col);                                          // (no black holes: canopy()'s cnFloor)
  // (round Q, R1: NO MIST LIES IN THE HOLLOWS. A hollow is darker leaf, as above; the air's own haze along the
  // ray, below, and the banks at the world's edge are all the air there is.)
  // the roof's own haze along the ray (seen from high over it the ray crosses the layer steeply, and the land
  // keeps its green and its relief: see cmHaze)
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

export function makeCanopy(ctx, shared, o = {}) {
  // a polar disc: rings 4 m apart under the eye, growing by 5.5 percent a ring out to 12 km (the world's file
  // gives the radius). THE LAND'S END IS NEVER SEEN (mend T, T1 d): the air's law (cmHaze) has taken 0.99 of
  // the land into the land's own lit air by 4.5 km seen from the roof and by 8.9 km seen from the road's
  // end, by the ring (the eye 539 m over the roof AS IT HAS SUNK there; made true in mend V: this note said
  // "the eye 518 m over the roof", which that reach is not for), all of it inside this disc, and
  // the sky part paints that same colour on
  // the world's limb and under it. (The eye's far plane stands at 9.6 km, the world's file: seen from the
  // ring's height the land has 0.995 of that colour there, seen from the roof all of it.)
  const SECT = 128, RINGS = 150, R0 = 4, RMAX = o.radius ?? 5600, g = Math.pow(RMAX / R0, 1 / (RINGS - 1));
  const pos = new Float32Array((SECT * RINGS + 1) * 3), idx = [];
  for (let j = 0; j < RINGS; j++) { const r = R0 * Math.pow(g, j); for (let i = 0; i < SECT; i++) { const a = ((i + (j % 2) * 0.5) / SECT) * Math.PI * 2, k = (1 + j * SECT + i) * 3; pos[k] = Math.cos(a) * r; pos[k + 2] = Math.sin(a) * r; } }
  for (let i = 0; i < SECT; i++) idx.push(0, 1 + ((i + 1) % SECT), 1 + i);
  for (let j = 0; j < RINGS - 1; j++) for (let i = 0; i < SECT; i++) { const a = 1 + j * SECT + i, b = 1 + j * SECT + ((i + 1) % SECT), c = a + SECT, d = b + SECT; idx.push(a, b, c, b, d, c); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const own = { uCentre: { value: new THREE.Vector3() } };
  const mat = new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, side: THREE.DoubleSide, fog: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'canopy-sheet';
  const cp = new THREE.Vector3();
  return { object: mesh, triangles: idx.length / 3, update(camera) { camera.getWorldPosition(cp); own.uCentre.value.set(cp.x, 0, cp.z); } };
}

// ---------------------------------------------------------------- the real leaves
// One grid, 6 x 3 quads. aI0: x, lift over the swell, z, yaw.  aI1: length, kind (0 fig, 1 pad, 2 strap), pitch, roll.
// aI2: tone, phase, how deep in the pile 0..1, fixed height added (the peak).
const LEAF_VERT = /* glsl */`
attribute vec4 aI0, aI1, aI2; attribute vec2 aI3;
varying vec3 vW, vN; varying vec2 vUv; varying vec4 vK;
${CM_GLSL}
void main(){
  float u = position.x, s = position.z;                 // u 0..1 from the stalk to the tip, s -1..1 across
  float kind = aI1.y, L = aI1.x;
  // half width along the blade, by shape
  float wFig = 0.42*pow(max(sin(3.14159*pow(u, 0.8)), 0.0), 0.7)*(1.0 - 0.45*u) + 0.02;
  float wPad = 0.5*sqrt(max(1.0 - (2.0*u - 1.0)*(2.0*u - 1.0), 0.0)) + 0.02;
  float wStr = 0.13*pow(max(sin(3.14159*pow(u, 0.6)), 0.0), 0.5) + 0.01;
  float w = kind < 0.5 ? wFig : (kind < 1.5 ? wPad : wStr);
  float gust = cmGust(aI0.xz, uTime);
  // the blade in its own frame: x along, z across, y up; cupped across, drooping to the tip, lifting in a gust
  float cup = (kind < 1.5 ? 0.22 : 0.5)*s*s*w*L;
  float droop = -0.10*L*u*u*(kind > 1.5 ? 1.6 : 1.0) + gust*0.05*L*u*sin(uTime*(3.0 + 3.0*aI2.y) + aI2.y*31.0);
  vec3 q = vec3((u - 0.12)*L, cup + droop, s*w*L);
  vec3 n = normalize(vec3(0.2*u*(kind > 1.5 ? 1.6 : 1.0), 1.0, -(kind < 1.5 ? 0.44 : 1.0)*s));
  float roll = aI1.w + gust*0.3*sin(uTime*(4.0 + 3.0*aI2.y) + aI2.y*17.0), pitch = aI1.z, yaw = aI0.w;
  float cr = cos(roll), sr = sin(roll), cpi = cos(pitch), spi = sin(pitch), cy = cos(yaw), sy = sin(yaw);
  q = vec3(q.x, q.y*cr - q.z*sr, q.y*sr + q.z*cr); n = vec3(n.x, n.y*cr - n.z*sr, n.y*sr + n.z*cr);          // roll about the midrib
  q = vec3(q.x*cpi - q.y*spi, q.x*spi + q.y*cpi, q.z); n = vec3(n.x*cpi - n.y*spi, n.x*spi + n.y*cpi, n.z);   // pitch: tip up
  q = vec3(q.x*cy + q.z*sy, q.y, -q.x*sy + q.z*cy); n = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy);        // yaw
  // it stands on the crown its twig grows from: aI3 is that crown's place, and the crown rides the swell of the
  // roof there (or, on the hill, stands at the fixed height aI2.w)
  vec3 base = vec3(aI0.x, (aI2.w > 0.5 ? aI2.w : cmHump(aI3, uTime)) + aI0.y - cmDrop(aI3), aI0.z);
  vW = base + q; vN = n; vUv = vec2(u, s); vK = vec4(kind, aI2.x, aI2.y, aI2.z);
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`;
const LEAF_FRAG = /* glsl */`
varying vec3 vW, vN; varying vec2 vUv; varying vec4 vK;
${CM_GLSL}
void main(){
  float u = clamp(vUv.x, 0.0, 1.0), s = clamp(vUv.y, -1.0, 1.0), as = abs(s), kind = vK.x, ph = vK.z;
  // the outline inside the grid: scallops, a notch at the stalk of a pad, a tear here and there
  float fw = fwidth(s) + 1e-4, pxL = cmPx(vW);              // (the footprint, taken before any branch)
  float rim = 1.0;
  if (kind > 0.5 && kind < 1.5) {
    float ang = atan(s*sqrt(max(1.0 - (2.0*u - 1.0)*(2.0*u - 1.0), 0.0)), (2.0*u - 1.0) + 1e-5);
    rim = 0.93 + 0.07*sin(ang*11.0 + ph*20.0);
    if (3.14159 - abs(ang) < 0.10) discard;                 // the notch where the stalk joins
  } else if (kind < 0.5) rim = 0.94 + 0.06*sin(u*38.0 + ph*9.0);
  float tear = smoothstep(0.80, 0.86, cmN(vec2(u*5.0 + ph*13.0, s*1.5 + ph*7.0)))*smoothstep(0.35, 0.6, as)*step(0.55, fract(ph*7.3));
  if (as > rim + fw*0.5 || tear > 0.5) discard;
  vec3 v = normalize(cameraPosition - vW);
  // veins: a midrib, side veins leaving it at an angle
  float rib = 1.0 - smoothstep(0.03, 0.03 + fw*1.5 + 0.02, as);
  float sv = abs(fract(u*(kind > 1.5 ? 14.0 : 7.0) - as*1.4) - 0.5);
  float side = (1.0 - smoothstep(0.03, 0.09, sv))*(1.0 - smoothstep(0.75, 1.0, as));
  float lod = 1.0 - smoothstep(0.12, 0.44, pxL);               // veins and grain go to their mean under the pixel's footprint
  float vein = mix(0.10, max(rib, side*0.6), lod);             // (0.10: the share of a leaf that is vein, weighed as here)
  vec3 n = normalize(vN);
  n = normalize(n + 0.12*lod*vec3(cmN(vUv*vec2(9.0, 3.0) + ph*40.0) - 0.5, 0.0, cmN(vUv*vec2(9.0, 3.0) + 19.0 + ph*40.0) - 0.5));
  float young = step(0.88, fract(ph*3.7));
  float deep = vK.w;
  float ao = (0.55 + 0.45*smoothstep(0.0, 0.3, u))*(1.0 - 0.5*deep)*(0.8 + 0.2*smoothstep(1.0, 0.7, as));
  float thin = (1.0 - 0.55*vein)*(0.8 + 0.2*young);
  vec3 col = cmLeaf(n, v, vK.y, thin, ao, 1.0);
  col *= 1.0 - 0.2*vein + 0.35*young;
  col = mix(col, col*vec3(1.12, 1.06, 0.72), young*0.6);
  // a dry brown edge on old leaves
  col = mix(col, col*vec3(1.1, 0.8, 0.45), smoothstep(0.82, 1.0, as/max(rim, 0.01))*0.5*step(fract(ph*5.1), 0.4));
  col *= 1.0 - 0.4*cmHillShade(vW.xz);                        // the hills' shade, as on the crown it stands on
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;

function leafGrid() {
  const NU = 4, NS = 2, p = [], idx = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NS; j++) p.push(i / NU, 0, (j / NS) * 2 - 1);
  for (let i = 0; i < NU; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  return { p: new Float32Array(p), idx };
}
// leaves: [{ x, y (lift over the roof), z, yaw, len, kind, pitch, roll, tone, phase, deep, fixed, ax, az (where its twig stands) }]
export function makeLeafMesh(material, leaves, name, centre, radius) {
  const grid = leafGrid(), n = leaves.length;
  const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
  g.setAttribute('position', new THREE.BufferAttribute(grid.p, 3)); g.setIndex(grid.idx);
  const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4), a3 = new Float32Array(n * 2);
  leaves.forEach((l, i) => { a0.set([l.x, l.y, l.z, l.yaw], i * 4); a1.set([l.len, l.kind, l.pitch, l.roll], i * 4); a2.set([l.tone, l.phase, l.deep, l.fixed || 0], i * 4); a3.set([l.ax ?? l.x, l.az ?? l.z], i * 2); });
  g.setAttribute('aI3', new THREE.InstancedBufferAttribute(a3, 2));
  g.setAttribute('aI0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aI1', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aI2', new THREE.InstancedBufferAttribute(a2, 4));
  bound(g, centre[0], centre[1], centre[2], radius);
  const m = new THREE.Mesh(g, material);
  m.name = name; return m;
}
export function makeLeafMaterial(shared) {
  return new THREE.ShaderMaterial({ uniforms: withShared(shared.U), vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide, fog: false });
}

// the lobes of a crown, as the crown shader swells them (the same sums in JS: see trLobe() below)
const _f = Math.fround, frac = (x) => x - Math.floor(x);
function h3(x, y, z) { x = frac(_f(x * 0.1031)); y = frac(_f(y * 0.1031)); z = frac(_f(z * 0.1031)); const d = x * (z + 31.32) + y * (y + 31.32) + z * (x + 31.32); x += d; y += d; z += d; return frac(_f((x + y) * z)); }
function n3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z); let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const c = (i, j, k) => h3(ix + i, iy + j, iz + k);
  const a = lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy), b = lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy);
  return lerp(a, b, fz);
}
export const crownLobe = (x, y, z, id) => 0.44 * (n3(x * 1.9 + id * 37, y * 1.9 + id * 37, z * 1.9 + id * 37) - 0.5) + 0.2 * (n3(x * 4.3 + id * 11, y * 4.3 + id * 11, z * 4.3 + id * 11) - 0.5);

// THE TWIGS. Single leaves are seen where a twig stands up out of a crown: sprays of nine to thirteen small leaves
// (half a metre to 0.85 m) on the sunward upper side of every built crown (o.crowns: every crown, from
// makeCrownTrees), by the crown's own rule (below). Nothing stands within 7 m of the eye anywhere along the route.
export async function makeLeaves(ctx, shared, o) {
  const rng = cmStream(shared, o.rng, 'twigs', ctx), detail = ctx.quality?.detail ?? 1;
  const material = makeLeafMaterial(shared), group = new THREE.Group(); group.name = 'twigs';
  const midY = (c) => (c.hill ? c.foot : shared.hump(c.x, c.z, 0)) + c.trunk;
  // THE CROWN'S OWN RULE: every built crown that is alive puts up one spray of new twigs on its sunward upper side
  // (within 70 degrees of the sun's bearing), and a crown in new leaf two; a dead crown none. The one thing the
  // road asks: no spray within 9 m of it (such a spray is not there).
  const all = o.crowns || [], sunAz = Math.atan2(shared.sunDir.z, shared.sunDir.x), jobs = [];
  all.forEach((c, ci) => { const dead = c.id > 0.46 && c.id <= 0.52, young = c.id > 0.22 && c.id <= 0.36; for (let k = 0; k < (dead ? 0 : young ? 2 : 1); k++) jobs.push(ci); });
  const CH = 6, chunks = Array.from({ length: CH }, () => []);
  let made = 0, tris = 0;
  for (let ji = 0; ji < jobs.length; ji++) {
    const c = all[jobs[ji]], az = sunAz + rng.range(-1.2, 1.2), up = rng.range(0.25, 1), st = Math.sqrt(1 - up * up), lx = Math.cos(az) * st, lz = Math.sin(az) * st;
    const nL = rng.int(9, 13), lean = rng.range(0, Math.PI * 2), kind = rng() < 0.5 ? 0 : (rng() < 0.6 ? 1 : 2), tone0 = clamp(0.45 + rng.gauss() * 0.2, 0, 1);
    const k = 1 + crownLobe(lx, up, lz, c.id) + 0.02, cx = c.x + lx * c.R * k, cz = c.z + lz * c.R * k, lift = c.trunk + up * c.R * c.sq * k, top = midY(c) - c.trunk + lift;
    const ch = Math.min(CH - 1, Math.floor((ji / jobs.length) * CH));
    // (the leaves are dealt whether or not the spray is there, so that the road's keep-clear re-deals no other spray)
    const keep = o.path.distanceTo(cx, top + 1, cz) >= 7 + 2, bin = keep ? chunks[ch] : [];
    for (let j = 0; j < nL; j++) {
      const a = lean + (j / nL) * Math.PI * 2 + rng.gauss() * 0.3, r = rng.range(0.1, 1.0);
      bin.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, ax: c.x, az: c.z, y: lift + rng.range(0.1, 1.3), yaw: -a + rng.gauss() * 0.25,
        len: (kind === 2 ? rng.range(0.7, 1.0) : rng.range(0.5, 0.85)), kind, pitch: rng.range(0.1, 0.85), roll: rng.gauss() * 0.3,
        tone: clamp(tone0 + rng.gauss() * 0.1, 0, 1), phase: rng(), deep: rng() * 0.5, fixed: c.hill ? c.foot : 0 });
    }
    made++;
    if (made % 40 === 0) await ctx.yield();
  }
  for (let c = 0; c < CH; c++) {
    if (!chunks[c].length) continue;
    const n = chunks[c].length, m = makeLeafMesh(material, chunks[c], 'twigs-' + c, [0, 0, 0], 1);
    // (the chunks are not tidy in space: they are drawn whenever any could be seen)
    m.frustumCulled = false;
    group.add(m); tris += n * 16;
    await ctx.yield();
  }
  return { object: group, material, triangles: tris };
}

// ---------------------------------------------------------------- the anchor peaks
// A polar mesh: aP = (angle, r / radius, rib, tatter). The pattern is the canopy's, pulled taut toward the top.
const PEAK_VERT = /* glsl */`
attribute vec4 aP; attribute float aS;
uniform vec4 uPeak; uniform vec2 uPeakS;       // x, z, height, radius; power, ribs
varying vec3 vW, vN; varying vec4 vP; varying float vS;
${CM_GLSL}
float ph(float r01, float rib){ return uPeak.z*pow(max(1.0 - r01, 0.0), uPeakS.x)*(1.0 + rib*0.10*r01*(1.0 - r01)*4.0); }
void main(){
  float a = aP.x, r01 = aP.y, r = r01*uPeak.w;
  vec2 dir = vec2(cos(a), sin(a)), xz = uPeak.xy + dir*r;
  float skirt = smoothstep(0.55, 1.0, r01);
  float base = mix(cmRoof(xz, uTime) - 0.6, ${ROOF_Y.toFixed(1)}, smoothstep(1.0, 0.75, r01));
  float h = ph(r01, aP.z) + base*skirt + aP.w;
  // slope for the normal
  float e = 0.02, h2 = ph(r01 + e, aP.z), dh = (h2 - ph(r01, aP.z))/(e*uPeak.w);
  vN = normalize(vec3(-dir.x*dh, 1.0, -dir.y*dh));
  // the hill is crown on crown too: the same crowns, laid along the slope (aS: metres down it from the top), their
  // sides falling 7 m into the hill; they give way to the roof's own crowns at the hill's foot
  float id; vec4 c = cmCrown(uPeak.xy + dir*aS, id);
  vec3 w = vec3(xz.x, h, xz.y) - vN*2.5*cmSide(c.x)*(1.0 - skirt)*smoothstep(0.0, 0.04, r01);
  w.y -= cmDrop(xz);
  vW = w; vP = aP; vS = aS;
  gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.0);
}`;
const PEAK_FRAG = /* glsl */`
uniform vec4 uPeak; uniform vec2 uPeakS;
varying vec3 vW, vN; varying vec4 vP; varying float vS;
${CM_GLSL}
${CANOPY_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  // the roof's own pattern, laid along the slope: its distance from the middle is the length down the slope, so
  // crowns, tufts and leaves keep their size however steep the hill is
  float a = vP.x; vec2 dir = vec2(cos(a), sin(a));
  vec2 p = uPeak.xy + dir*vS;
  float fw = max(length(dFdx(p)), length(dFdy(p)));
  vec3 n0 = normalize(vN), ar = vec3(-dir.y, 0.0, dir.x), dn = -normalize(cross(ar, n0));     // round the hill, down the hill
  vec3 col = canopy(p, n0, dn*dir.x - ar*dir.y, dn*dir.y + ar*dir.x, v, fw, 1.0, 0.5);
  col *= 0.6;                                                            // what shows of the hill between its crowns lies in their shade
  col *= 1.0 - 0.4*smoothstep(0.45, 1.0, vP.y);                          // and a hill stands in its own shade at its foot
  // a hill has form: the flank toward the sun is lit, the flank turned from it lies in shade
  vec2 sxz = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
  col *= 0.72 + 0.56*smoothstep(-0.7, 0.7, dot(dir, sxz));
  col = cnDeep(col);                                                     // (no black holes: canopy()'s cnFloor)
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
export function makePeakMesh(ctx, shared, pk, o = {}) {
  const noise = ctx.noise, SECT = o.sect ?? 144, RINGS = o.rings ?? 84, G = new Geo({ aP: 4, aS: 1 });
  // the length down the slope from the top to each ring (the pattern is laid on this, not on the map)
  const ring01 = (j) => Math.pow(j / RINGS, 1.25) * 1.06, arc = [0];
  for (let j = 1, s = 0; j <= RINGS; j++) {
    const t0 = ring01(j - 1), t1 = ring01(j);
    for (let k = 0; k < 6; k++) { const t = t0 + (t1 - t0) * (k + 0.5) / 6; s += Math.hypot(pk.r, pk.h * pk.p * Math.pow(Math.max(1 - t, 0), pk.p - 1)) * (t1 - t0) / 6; }
    arc.push(s);
  }
  for (let j = 0; j <= RINGS; j++) {
    const r01 = ring01(j); G.set('aS', arc[j]);
    for (let i = 0; i <= SECT; i++) {
      const a = (i / SECT) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      const rib = Math.max(0, noise.n2(ca * 3.1 + pk.x * 0.01, sa * 3.1 + pk.z * 0.01) * 1.3 + 0.5 * Math.cos(a * (pk.ribs ?? 9)));
      const tat = (noise.n2(ca * 9 + 7, sa * 9 + r01 * 6) * 2.2 + noise.n2(ca * 23, sa * 23 + r01 * 15) * 1.0) * sstep(0.02, 0.2, r01) * sstep(1.05, 0.7, r01) * (pk.ragged ?? 1);
      G.set('aP', a, r01, rib, tat + peakLump(pk, ca * r01, sa * r01)); G.v(0, 0, 0);
    }
  }
  G.stitch(0, RINGS + 1, SECT, true);
  const geo = bound(G.geometry(), pk.x, pk.h * 0.4, pk.z, pk.r * 1.2 + 700);
  const own = { uPeak: { value: new THREE.Vector4(pk.x, pk.z, pk.h, pk.r) }, uPeakS: { value: new THREE.Vector2(pk.p, pk.ribs ?? 9) } };
  const mat = new THREE.ShaderMaterial({ uniforms: withShared(shared.U, own), vertexShader: PEAK_VERT, fragmentShader: PEAK_FRAG, side: THREE.DoubleSide, fog: false });
  const m = new THREE.Mesh(geo, mat); m.name = 'peak'; m.frustumCulled = false;
  return { object: m, triangles: G.triangles };
}

// ---------------------------------------------------------------- CROWNS
// A tree's whole crown: a dome of leaves swollen into great lobes (the ends of its main boughs), each lobe into
// billows a few metres across (the ends of its lesser boughs), every billow a glitter of leaves; dark where
// billow meets billow, darker underneath, ragged against the sky. Most crowns stand only half out of the roof;
// one in six stands up on its trunk with aerial roots let down beside it; the hill is crown on crown.
// aT0: x, z, radius, how high the dome's middle stands over its foot.  aT1: its own number, height / radius,
// the height of its foot when it stands on the hill (else the swell of the roof carries it), on the hill 1 / on the roof 0.
// position: the unit shape; aK: 0 leaves, 1 wood.
const TREE_GLSL = /* glsl */`
vec3 trH3(vec3 q){ return vec3(cmH3(q), cmH3(q + 17.1), cmH3(q + 43.7)); }
// billows: the nearest of a scatter of points in space. xyz = from that point to p, w = how much nearer it is than the next
vec4 trBillow(vec3 p){
  vec3 n = floor(p), f = fract(p), r1 = vec3(0.0); float d1 = 8.0, d2 = 8.0;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k)), r = g + trH3(n + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; r1 = r; } else if (d < d2) d2 = d;
  }
  return vec4(-r1, sqrt(d2) - sqrt(d1));
}
// the lobes of a crown: how far the surface stands out along the unit direction p (about -0.2 .. 0.25 radii)
float trLobe(vec3 p, float id){ return 0.44*(cmN3(p*1.9 + id*37.0) - 0.5) + 0.2*(cmN3(p*4.3 + id*11.0) - 0.5); }
`;
const TREE_VERT = /* glsl */`
attribute vec4 aT0, aT1; attribute float aK;
varying vec3 vW, vN, vL; varying vec4 vT; varying vec2 vK;
${CM_GLSL}
${TREE_GLSL}
void main(){
  vec3 p = position, n = normal; float R = aT0.z, sq = aT1.y;
  if (aK < 0.5) {
    p *= 1.0 + trLobe(p, aT1.x);
    // it stirs in a gust
    p.xz += 0.03*cmGust(aT0.xy, uTime)*sin(uTime*1.3 + aT1.x*40.0 + p.y*2.0)*max(p.y + 0.4, 0.0);
  }
  float foot = mix(cmHump(aT0.xy, uTime), aT1.z, aT1.w);
  vec3 w = vec3(aT0.x, foot + aT0.w, aT0.y) + vec3(p.x*R, p.y*R*sq, p.z*R);
  w.y -= cmDrop(aT0.xy);
  vW = w; vN = normalize(vec3(n.x, n.y/max(sq, 0.2), n.z)); vL = position; vT = vec4(aT0.xy, R, aT1.x); vK = vec2(aK, sq);
  gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.0);
}`;
const TREE_FRAG = /* glsl */`
#define CM_FOLLOW 1.0
varying vec3 vW, vN, vL; varying vec4 vT; varying vec2 vK;
${CM_GLSL}
${LAND_GLSL}
${TREE_GLSL}
void main(){
  vec3 v = normalize(cameraPosition - vW);
  vec3 n0 = normalize(vN), col;
  float R = vT.z, id = vT.w, sq = max(vK.y, 0.2);
  float px = cmPx(vW);                 // metres of the crown a pixel covers here (taken before the branch below)
  // (mend T, T1 c) A BUILT CROWN STANDS IN THE LAND'S OWN LIGHT AND SHADE, as the painted roof under it does
  vec4 LD = cnLandAt(vW.xz, px);
  if (vK.x < 0.5) {
    vec3 lp = vL/max(length(vL), 1e-3);
    // ONE RULE OF SIZE FOR EVERY CROWN, great or small: billows 4.2 m across, sprigs of a metre and a half,
    // leaves of a third of a metre, each measured in metres on the crown's true surface (its squash and its
    // lobes counted: mq is the point in the crown's own metres). So no crown's leaf is larger than its
    // neighbour's and no pattern is pulled long down a steep flank. Each goes to its mean under 3 pixels.
    vec3 mq = vec3(vL.x, vL.y*sq, vL.z)*R*(1.0 + trLobe(vL, id));
    float wB = 1.0 - smoothstep(0.3, 1.0, px/4.2);
    vec4 b = trBillow(mq/4.2 + id*17.0);
    vec3 bn = normalize(b.xyz + 1e-4);
    // sprigs and leaves: soft dabs of light and shade, each tilted its own way, with holes between them that go
    // down into the dark of the crown
    vec3 mp = mq + id*31.0;
    float wS = 1.0 - smoothstep(0.3, 1.0, px/1.5), wL = 1.0 - smoothstep(0.3, 1.0, px/0.36);
    vec3 j1 = vec3(cmN3(mp/1.5), cmN3(mp/1.5 + 7.3), cmN3(mp/1.5 + 13.9)) - 0.5;
    vec3 j0 = vec3(cmN3(mp/0.36), cmN3(mp/0.36 + 5.1), cmN3(mp/0.36 + 11.7)) - 0.5;
    float hole = smoothstep(0.16, 0.3, j0.x + 0.5*j1.x);
    vec3 n = normalize(n0*0.6 + bn*0.8*wB + j1*0.9*wS + j0*0.8*wL);
    float crease = smoothstep(0.0, 0.3, b.w);
    float ao = mix(0.75, mix(0.36, 1.0, crease), wB)*mix(0.9, 0.8 + 0.6*j1.x, wS)*mix(0.92, mix(1.0, 0.55, hole), wL);
    ao *= mix(0.14, 1.0, smoothstep(-0.5, 0.3, lp.y));                      // its underside is in its own shade
    ao *= cnLandAo(LD);
    // a crown is one kind of tree: its green is its own; a few are in new leaf (pale, yellow) or old and bronzed
    // (its kind is its number: under 0.08 bronzed to copper, to 0.22 an older darker green, 0.22 to 0.36 in new
    // leaf, 0.36 to 0.46 in flower (white, or pale gold), 0.46 to 0.52 dead: bare grey limbs, the rest full green)
    float kind = id, copper = step(kind, 0.08), old = step(0.08, kind)*step(kind, 0.22), young = step(0.22, kind)*step(kind, 0.36), flower = step(0.36, kind)*step(kind, 0.46), dead = step(0.46, kind)*step(kind, 0.52);
    float tone = clamp(0.3 + 0.35*fract(id*7.3) - 0.22*old + 0.3*young + 0.5*j1.y*wS + 0.6*j0.z*wL + 0.825*LD.z + 0.3*LD.w, 0.0, 1.0);
    col = cmLeaf(n, v, tone, 0.85, ao, (0.15 + 0.25*wL)*(1.0 - 0.6*LD.x));
    col = mix(col, col*vec3(0.6, 0.68, 0.55), old*0.8);
    col = mix(col, col*vec3(1.25, 1.12, 0.62), young*0.7);
    col = mix(col, dot(col, vec3(0.3, 0.5, 0.2))*vec3(2.1, 1.02, 0.42), copper*0.75);
    // (and of the full green ones the painted roof's yellowing crowns, one in 18: 0.570 to 0.610 here)
    col = mix(col, col*vec3(1.3, 1.1, 0.5), step(0.5701, kind)*step(kind, 0.6096)*0.8);
    vec3 lit = uSunCol*clamp(dot(n, uSunDir)*0.6 + 0.4, 0.0, 1.0)*0.3 + cmAmb(n)*0.75;
    // in flower: every other billow is a mass of bloom, white or pale gold, over the whole upper crown
    float bloom = smoothstep(-0.1, 0.06, j1.x + 0.3*j0.y*wL)*smoothstep(-0.3, 0.3, lp.y);
    col = mix(col, (kind < 0.41 ? vec3(0.92, 0.9, 0.76) : vec3(0.96, 0.74, 0.3))*lit*(0.55 + 0.45*ao), flower*bloom*0.9);
    // dead: the leaves are gone; bare grey limbs run out from its middle and fork (five great boughs, eleven
    // lesser ones from half way out, twenty-three twigs at its edge) over the dark of the empty crown
    float azL = atan(lp.z, lp.x)/6.2831853, rr = acos(clamp(lp.y, -1.0, 1.0)), girth = 6.2831853*max(sin(rr), 0.05)*R;
    float wob = 0.5*(cmN3(mp/7.0 + 3.0) - 0.5);
    float d1 = abs(fract(azL*5.0 + wob) - 0.5)*girth/5.0, d2 = abs(fract(azL*11.0 + 2.0*wob + 0.3) - 0.5)*girth/11.0, d3 = abs(fract(azL*23.0 + 3.0*wob + 0.7) - 0.5)*girth/23.0;
    float limbs = max((1.0 - smoothstep(0.45, 0.5 + px, d1))*(1.0 - smoothstep(0.9, 1.2, rr)), max((1.0 - smoothstep(0.2, 0.24 + px, d2))*smoothstep(0.3, 0.5, rr), (1.0 - smoothstep(0.1, 0.13 + px, d3))*smoothstep(0.75, 0.95, rr)));
    limbs = mix(limbs, 0.3, smoothstep(0.3, 1.2, px));
    vec3 bare = mix(vec3(0.17, 0.16, 0.13)*(1.0 + 0.9*j1.x)*mix(1.0, 0.45, hole), vec3(0.4, 0.38, 0.34), limbs*0.85)*lit*(0.7 + 0.3*ao);
    col = mix(col, bare, dead*0.92);
    // the low sun behind it comes through its edge
    float toward = clamp(dot(-v, uSunDir), 0.0, 1.0), ndv = abs(dot(n0, v));
    col += uLeafT*uSunCol*pow(clamp(1.0 - ndv, 0.0, 1.0), 2.0)*toward*toward*0.16*ao;
    // ragged against the sky: at its edge the leaves stand apart
    float cut = 0.5 + 1.6*j1.z + 1.2*j0.y*wL;
    if (ndv < 0.3*wS && cut > ndv/0.3 + 0.2) discard;
  } else {
    // wood: bark that runs up it, moss on the weather side
    float g = 0.55 + 0.6*cmN(vec2(atan(vL.z, vL.x + 1e-5)*7.0 + id*20.0, vW.y*0.35));
    vec3 alb = mix(vec3(0.22, 0.19, 0.13), vec3(0.12, 0.2, 0.06), smoothstep(0.45, 0.75, cmN(vW.xz*0.4 + vW.y*0.3)));
    col = alb*g*(uSunCol*max(dot(n0, uSunDir), 0.0)*0.45 + cmAmb(n0)*0.7);
  }
  col *= 1.0 - 0.4*cmHillShade(vW.xz);                                  // the hills' shade lies on a built crown as on the painted roof
  col *= (1.0 + 0.22*LD.y)*cnLandLight(vW.xz, 1.0, 1.0);
  col = cmHaze(col, vW, 1.0);
  gl_FragColor = vec4(col, 1.0);
}`;
// THE BUILT CROWNS OF THE ROOF ARE A NEARER LOOK AT THE SAME ROOF. Each stands exactly where the painted pattern
// has a crown (crownSites() in the common file) and takes everything from that crown's own place and number:
//   radius   ITS ROOM TIMES ITS SIZE: the one rule of size (crownSize in the common file, the painted crown's
//            cmSize) times, never more than, the room the pattern gives it, so a lesser tree is built as small
//            as it is painted. Its room: 1.05 of the mean of half the way to the nearest crown beside it and
//            half the mean way to the next three, 7 to 22 m: unequal, as the pattern's crowns are (a crown
//            crowded by one neighbour is small and stands shoulder to shoulder with it)
//   height   its top stands where the painted crown's top stands (crownTop() in the common file: 0 to 6 m over
//            the roof's swell, most low; one in 25 EMERGENT, a fifth wider, 10 to 16 m up), plus the depth of
//            its own lobes (0.6 m and 0.12 of its half-height) so that the painted dome under it is covered;
//            and it is as flat as the painted dome it covers: its half-height is its radius x sq, with
//            sq = radius x (top + 7) / (251 x size x size) kept between 0.34 and 1 (size: the one rule's; the
//            painted dome of a crown of that size falls by r / (34 x size)). (251 = 34 x 34 / (2 x 2.3): the painted
//            dome falls (top + 7) x 2.3 x (r / 34)^2 at r metres from its middle; a dome of half-height H and
//            radius R falls H r^2 / (2 R^2) near its top; the same curve gives H = R^2 (top + 7) / 251.) So
//            the edge of the level of detail cannot be told by height
//   kind     the painting's own (its pale new-leaf crowns and its bronzed old ones are those here); of the
//            rest one in ten is in flower, one in 17 dead, one in six an older darker green, one in 18 yellowing
// WHICH crowns get a mesh is a level of detail, declared once: every crown whose middle is within LOD_M = 115 m
// of the road's ground line (line: its knots on the map) and off the hill. The road decides nothing else: not
// where a crown stands, not how tall it is, not whether it exists. hump: the visit's roof (shared.hump).
export const LOD_M = 115;
export function roofCrowns(hump, line, pk) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of line) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const seg = (x, z, a, b) => { const bx = b[0] - a[0], bz = b[1] - a[1], t = clamp(((x - a[0]) * bx + (z - a[1]) * bz) / Math.max(bx * bx + bz * bz, 1e-6), 0, 1); return Math.hypot(x - a[0] - bx * t, z - a[1] - bz * t); };
  const fr = (v) => v - Math.floor(v), out = [];
  for (const s of crownSites(x0 - LOD_M, x1 + LOD_M, z0 - LOD_M, z1 + LOD_M)) {
    let d = Infinity; for (let i = 0; i + 1 < line.length; i++) d = Math.min(d, seg(s.x, s.z, line[i], line[i + 1]));
    if (d > LOD_M || peakH(pk, s.x, s.z) > 0.5) continue;
    const k = fr(s.id * 3.3), h2 = fr(s.id * 91.73), h4 = fr(s.id * 29.9), emergent = h2 < 0.04, T = crownTop(s.id);
    const R = clamp(0.525 * (s.r + s.room), 7, 22) * (emergent ? 1.2 : 1), sq = clamp(R * (T + 7) / 251, 0.34, 1), top = T + 0.6 + 0.12 * R * sq;
    // the number the crown shader reads its kind from (under 0.08 copper, to 0.22 older green, to 0.36 new leaf, to 0.46 in flower, to 0.52 dead, the rest full green)
    const id = k >= 0.88 ? 0.22 + 0.14 * h4 : k <= 0.07 ? 0.08 * h4 : h4 < 0.1 ? 0.36 + h4 : h4 < 0.16 ? 0.46 + (h4 - 0.1) : h4 < 0.33 ? 0.08 + 0.14 * (h4 - 0.16) / 0.17 : 0.52 + 0.48 * (h4 - 0.33) / 0.67;
    // THE CROWN AS IT IS BUILT, AND THE ONLY FORM HANDED ON (mend P, H1): its dome is the painted crown's own size
    // by the one rule (crownSize, the painted cmSize: the emergent crown's 1.5 as well), never wider than its
    // room (R above), its top where the painted top stands. The road's laying, its clearance, the facts and all
    // that stands on a crown read this one form; no fuller form is kept for the road.
    const size = crownSize(s.id, s.qx, s.qz), dR = R * Math.min(size, 1), dsq = clamp(dR * (T + 7) / (251 * size * size), 0.34, 1), dtop = T + 0.6 + 0.12 * dR * dsq;
    out.push({ x: s.x, z: s.z, R: dR, sq: dsq, top: dtop, trunk: dtop - dR * dsq, y: hump(s.x, s.z, 0) + dtop - dR * dsq, id, emergent, nx: s.nx, nz: s.nz });
  }
  return out;
}
// how far the point p stands from the leaves of the built crown c (metres; never more than the truth: its lobes
// stand out a quarter of its radius beyond the ball it is measured as)
export const crownGap = (p, c) => { const dx = p.x - c.x, dz = p.z - c.z, dy = (p.y - c.y) / c.sq; return c.sq * (Math.sqrt(dx * dx + dy * dy + dz * dz) - c.R * 1.28); };
// THE HILL IS MADE OF CROWNS sunk in its slope from its foot to the cable's root, small and close near the top
// (hr: their stream; kr: the stream of their kinds). The road's ONE rule on the hill: a crown whose leaves would
// come nearer the road than `keep` is not made (lost counts them; least: the nearest any made crown's leaves
// come to the road).
export function hillCrowns(hump, pk, path, hr, kr, keep, count = 175) {
  const list = [], TAU = Math.PI * 2; let lost = 0, least = Infinity;
  for (let i = 0, tries = 0; i < count && tries < 7000; tries++) {
    const a = hr() * TAU, r01 = hr() < 0.3 ? hr.range(0.03, 0.3) : Math.sqrt(hr.range(0.02, 0.95)), R = hr.range(8, 15) * lerp(0.6, 1, r01), x = pk.x + Math.cos(a) * r01 * pk.r, z = pk.z + Math.sin(a) * r01 * pk.r;
    const foot = peakH(pk, x, z) + hump(x, z, 0) * sstep(0.55, 1, r01), trunk = R * hr.range(-0.3, 0.05), sq = hr.range(0.65, 0.9), id = kr();
    if (list.some((q) => Math.hypot(q.x - x, q.z - z) < (q.R + R) * 0.55)) continue;
    const gap = path.distanceTo(x, foot + trunk, z) - R * 1.28;
    if (gap < keep) { lost++; continue; }
    least = Math.min(least, gap);
    list.push({ x, z, R, trunk, sq, foot, hill: 1, id }); i++;
  }
  return { list, lost, least };
}
// o: { roof (roofCrowns()), hillRng, kindRng, path, peak, hill (how many on the hill) }
export async function makeCrownTrees(ctx, shared, o) {
  const G = new Geo({ aK: 1 }), pk = o.peak, TAU = Math.PI * 2;
  // the unit shape: a dome from its top to well under its widest, closed underneath ...
  { const SEG = 16, RG = 8, base = G.count; G.set('aK', 0);
    for (let j = 0; j <= RG; j++) { const th = (j / RG) * 2.15, st = Math.sin(th), ct = Math.cos(th), rr = j === RG ? 0.4 : 1;
      for (let k = 0; k <= SEG; k++) { const a = ((k + (j % 2) * 0.5) / SEG) * TAU; G.v(Math.cos(a) * st * rr, ct * rr, Math.sin(a) * st * rr, Math.cos(a) * st, ct, Math.sin(a) * st); } }
    G.stitch(base, RG + 1, SEG, true); }
  // ... a trunk under it, and five aerial roots let down from its boughs (wood)
  const tube = (x0, y0, z0, x1, y1, z1, r0, r1, sides) => { const base = G.count; G.set('aK', 1);
    for (let j = 0; j <= 1; j++) for (let k = 0; k <= sides; k++) { const a = (k / sides) * TAU, r = j ? r1 : r0; G.v((j ? x1 : x0) + Math.cos(a) * r, j ? y1 : y0, (j ? z1 : z0) + Math.sin(a) * r, Math.cos(a), 0, Math.sin(a)); }
    G.stitch(base, 2, sides, true); };
  tube(0, -0.2, 0, 0.05, -2.4, 0.03, 0.12, 0.19, 7);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4, r = 0.5 + 0.09 * (i % 3); tube(Math.cos(a) * r, -0.35, Math.sin(a) * r, Math.cos(a) * (r + 0.07), -2.4, Math.sin(a) * (r + 0.07), 0.014, 0.02, 4); }
  const g0 = G.geometry(), per = G.triangles, list = [], P = new THREE.Vector3(), T = new THREE.Vector3();
  // THE ROOF'S BUILT CROWNS are o.roof (roofCrowns() above): the pattern's own crowns, as they stand. None is
  // sunk and none left out for the road: the road is laid over them (the world file). ON THE HILL the road has
  // ONE rule (o.keep, the world file's HILL_KEEP = 22 m): a crown whose leaves would come nearer the road than
  // that is not made (lost counts them).
  for (const q of o.roof || []) list.push({ x: q.x, z: q.z, R: q.R, trunk: q.trunk, sq: q.sq, foot: 0, hill: 0, id: q.id });
  await ctx.yield();
  const hill = hillCrowns(shared.hump, pk, o.path, cmStream(shared, o.hillRng, 'crowns-hill', ctx), cmStream(shared, o.kindRng, 'crown-kinds', ctx), o.keep ?? 22, o.hill ?? 175);
  for (const q of hill.list) list.push(q);
  await ctx.yield();
  const n = list.length, g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
  for (const nm of ['position', 'normal', 'aK']) g.setAttribute(nm, g0.getAttribute(nm)); g.setIndex(g0.getIndex());
  const t0 = new Float32Array(n * 4), t1 = new Float32Array(n * 4);
  list.forEach((q, i) => { t0.set([q.x, q.z, q.R, q.trunk], i * 4); t1.set([q.id, q.sq, q.foot, q.hill], i * 4); });
  g.setAttribute('aT0', new THREE.InstancedBufferAttribute(t0, 4)); g.setAttribute('aT1', new THREE.InstancedBufferAttribute(t1, 4));
  bound(g, pk.x, 40, pk.z + 150, 1000);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: withShared(shared.U), vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, fog: false }));
  m.name = 'crowns'; m.frustumCulled = false;
  return { object: m, triangles: per * n, list, lost: hill.lost, least: hill.least };
}
