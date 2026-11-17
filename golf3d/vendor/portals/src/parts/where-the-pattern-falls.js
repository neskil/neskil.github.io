// THE FALLS: hero set piece of "where-the-pattern-falls".
//
// A river of upright black, white and silver rectangles marches in ranks down a gold-leaf plateau, fans to a ruled
// brink, leans, goes over between two piers of tooled gold and falls 250 m in three curtains, each rank turning as
// one in the plane of the curtain. On the way down the corners round, a flat inner shape of colour grows out to the
// edge (silver to rose, black to cobalt, white to malachite and pearl) and the tile lands as a disc, almond, spiral
// or eight-petalled flower with a ringed centre, in a spray of leaping gold dots. In the dark cobalt pool the shapes
// tip their faces up to the eye and drift off as a meadow with slowly turning rings, between the two mantle-peaks:
// six overlapping scallop-hemmed robes each, the dark one in rectangles, chequers, bars and bricks, the other in
// whorls, ringed eyes, scales and waves. Plateau, cliff, lower country and sky are one sheet of 12 m gold leaves.
//
// LOCAL SPACE  origin at the foot of the cliff under the middle curtain; +Y up; +Z downstream (the piece faces +Z).
//              Cliff face = plane z 0, x -450..450, y 0..250; plateau top y 250 (z -700..0); lower country y 0.
//              River bed x +-35 (z -420) fanning to +-90 at the brink; curtains centred x -64, 0, 64 (52 m wide,
//              tiles at z 0.8..3.5); piers at x +-32 standing 7 m proud with a prow 46 m upstream; pool x +-100,
//              z 0..110; meadow to z 600 (uMeadowLen); peaks' base centres (-210, 300) dark and (210, 300) bright,
//              300 m tall, bending about 115 m toward each other at the crowns. Everything is in hero.bounds.
// SIZE         hero.radius / height / center are a FRAMING for the set-piece viewer (an orbit over the pool, between
//              falls and peaks). True size: 1520 x 300 x 1560 m (hero.bounds).
// COST         about 120k triangles (tiles 86.9k: 10,314 river + 13,122 falling + 21,000 meadow instances; peaks
//              12.7k drawn twice for the contour hull; spray 3k; leaf, bed, pool and dome 1.5k), 7 draw calls
//              (leaf, sky dome, bed + pool, tiles, peaks, peaks hull, spray), 5 shader programs, no textures, no
//              lights. Build about 230 ms, yielding throughout.
// LIGHTING     None: every material is an unlit ShaderMaterial writing flat colour and ignoring scene lights AND
//              scene fog (the brief's rule: no shading, no shadow, no fog). Palette hexes are on-screen targets: each
//              ink is its hex as linear colour (hero.inkOf(hex)) and the world returns post.flat = 1 with exposure 1,
//              saturation 1, contrast 1, vignette 0 and bloom threshold 1.15: inks stay at or under 1 and only the
//              blazing leaf (5.0, 4.0, 2.1) blooms. In the set-piece viewer judge it with &flat=1.
// STYLE        see the hand-off at the end of this comment.
//
// OPTS         palette      7 hex strings in brief order (gold, pale gold, dark gold, black, white, rose, cobalt)
//              detail       0.6..1 thins the meadow and the spray only (default ctx.quality.detail or 1)
//              metal        0 yellow gold on red bole, 1 white gold on grey-green bole (cold highlight), 2 black lacquer
//              scheme       0 rose / cobalt / malachite, 1 orange / turquoise / ivory, 2 violet / indigo / leaf-green
//              march        0 straight ranks, 1 chevrons, 2 echelon          swapPeaks  true puts the dark robe at +x
//                           (all four are drawn from ctx.rng when not given: real per-seed variety)
//              rare         true/false: the gold-rank event (default 8 percent of seeds), driven by setProgress(u)
//              darkPeak / brightPeak  [x, z] base centres;  motifScale  multiplies the robes' motif size
//              meadowCount (21000), meadowLength (600), sprayCount (1500), riverSpeed (7 m/s), fallSpeed (22 m/s),
//              window / windowSky  [x, y, z] the imaginary window for land and for sky,  highlightCos (0.9993),
//              walk (1.1: how fast steps walk from leaf to leaf),  sky  false to leave the dome out
//              sheen [0.3, 0.42, 0.08]: the burnished zone round the mirror direction (where it starts as a cosine,
//                           how many steps it lifts a leaf, the lift everywhere); [1, 0, 0.2] gives the even scatter
//
// RETURNS      the contract { object, radius, height, center, anchors, update, dispose, ground: false } plus
//              setProgress(u)   call every frame with the world's u: runs the rare event (no-op on ordinary seeds)
//              setRare(g)       0 none; 0..1 gold has come that far down the river; ..2 down the curtain; ..3 the meadow
//              uniforms         shared: uInk[14] (0 gold 1 pale 2 dark gold 3 black 4 white 5 rose 6 cobalt 7 silver
//                               8 malachite 9 umber 10 bole 11 pool 12 mean gold 13 gold step 1), uTime, uCamL,
//                               uViewH, uTanHalf, uRate, uMeadowLen, uGold
//              leafUniforms / skyUniforms   uWindow, uWindowSky, uHiCos, uWalk, uHi, uLeaf, uStep[6], ...
//              makeLeafMaterial(sky)        the leaf material (false) or the dome's (true) for more ground or hills:
//                                           needs position, normal and aE (vec2: metres to a contour edge, tooled 0/1)
//              makePatternMaterial(hull)    the robe material (false) or its umber contour hull (true); attributes
//                                           aCM (centre xyz, motif metres), aPat (motif id [+8 = dark blocks], three
//                                           ink indices), aHemP (0,0,0,0 = no hem), aHem (0,0), plus smooth normals
//              inkOf(hex), inks, variant, bounds, sky (the dome mesh)
// update(dt, time, camera) reads camera.matrixWorld only, moves the dome to the camera and sets uniforms; nothing is
// created, switched or recompiled after build.
//
// ANCHORS (local space, THREE.Vector3)
//   entry          { position (-23, 258, -300), facing +Z }: 8 m over the river, ranks marching away to the brink
//   flyThrough     18 points: down the river, a left sweep out over the -x bank to run the brink heading +X at z 10,
//                  a 48 degree descent across all three curtains at z 12 (falling tiles 8 m off, never nearer than 6),
//                  level at y 9 across the pool, then approach -> portalSeat
//   portalSeat     { position, facing (toward the arriving camera), travel (unit direction of the last straight), radius 7 }:
//                  the ring's centre, 9.5 m up; the last 120 m from `approach` are straight and level, 30 degrees off
//                  downstream toward the dark peak, whose robe stands about 70 m behind the ring on that line
//   approach       where that last straight begins
//   viewpoints     { entry, brink, curtain, pool, ring }: { from, at } pairs for the brief's must-work frames
//   curtainPoi     gaze target on the middle curtain;  brink, curtains[3], piers[2], pool: the layout in numbers
//   peaks / darkPeak / brightPeak   { dark, base, crown };  whorlHem: a point 14 m off the bright peak's hem
//   window         the land window direction (the same Vector3 the shader uses: edit it in place to steer the highlight)
//
// HOW THE STYLE IS DONE (for the world coder: match it for hills, trees, creatures)
//   Flat ink: no lights, no fog, no gradients; every colour is inkOf(hex). Opaque with discard, depth write on (spray
//   alone is additive). GOLD LEAF: cell = floor(local position / 12 m) on level faces (x, z), on vertical faces
//   (along, y), on the dome (arc length); a hash tilts each leaf up to 4 degrees; a = dot(reflect(-V to the leaf's
//   CENTRE, n), window) is one number per leaf; s = abs(fract(bias + a * walk) * 2 - 1), lifted by a sheen term
//   smoothstep(0.3, 1, a) and by slow drifts of like-toned leaves, picks one of five flat steps (thresholds 0.29,
//   0.52, 0.8, 0.935): away from the mirror direction about a quarter dark, most mid, few pale; toward it the pale
//   steps gather, so land and sky have a decided bright quarter made only of flat squares, the steps walk from leaf
//   to leaf as the camera moves, and the HDR leaf is at the heart of it (round 4b: chosen by hiSel, see ROUND 4b below). A 0.25 m seam on two edges is one step paler, red bole shows at worn edges and in
//   hairline cracks with a 1.5 pixel floor, brushed streaks vary tone in four flat bands, one leaf in nine carries a
//   compass-struck whorl, others a row of punch dots (dark ring, pale crescent); under 6 pixels a leaf goes to mean gold.
//   PATTERN SOLIDS: uv = metres from the solid's centre on a sheet facing the camera's position (not its gaze), so
//   silhouettes slide over their patterns; eight loop-free three-ink motifs; average ink below 4..9 pixels a motif.
//   CONTOUR: #3A2410, max(7 cm, 1.6 pixels): an inverted hull on solids, inside the quad on tiles, in the shader on
//   leaf faces (aE). TILES: one rounded-rectangle distance function whose half size and corner radius follow the
//   fraction fallen; ornament bands come from that distance.
//
// LATER CHANGES (the world coder, after the first review)
//   SKY     five courses of leaves to a band share their columns, and every band lines up downstream: squares stack on
//           squares (the old per-course offset read as brick bond).
//   METALS  white gold is a cool champagne silver (blue pewter to warm near-white, wide grey-green bole, a cold blue-white
//           blaze on one leaf); black lacquer is black on black with a dim hairline seam, gold only where leaves near the
//           mirror direction catch it in two steps, and its tooled piers stay gold (METALS: sheen, seamW, seamCol, boleW,
//           hiCos, pierLift). The steps also breathe slowly with time (uTime * 0.003), so a still eye sees leaves change.
//   FALLS   beyond 70 m one falling tile in four is drawn up to 2.7 times its size while its neighbours shrink away, so
//           the change of shape reads in the wide view of all three curtains; within 70 m every tile is its true size.
//   RARE    a gold tile is pale gold with a black band inside its umber edge and a black lozenge or centre, and the
//           cliff's leaves behind gold tiles drop to the two darkest steps (uGold in the leaf shader). The world keys the
//           event to its own flight with setRare(); setProgress(u) keeps the artist's timing for the set-piece viewer.
//   ROBES   the peaks' pattern material is double-sided: under a flared hem the lining wears the pattern.
//
// POLISH ROUND (the world coder, after the second review)
//   GROUND  yellow and white gold are a calm sheet: a leaf's own hash spans a tenth of the ramp (METALS calm), tone moves
//           in broad slow drifts several leaves wide (two octaves of noise, by direction on the dome), the side turned
//           from the window is a step duller (dull), and the pale steps gather in one burnished quarter round the blaze
//           (sheen starts at cosine 0.7). White gold is neutral pewter to warm near-white, no blue. Lacquer is unchanged.
//   MEADOW  the bed/pool quad now carries a dark cobalt bed under the whole meadow, between scalloped banks that wander
//           and taper away by z 700 (meadowHalf / meadowMid, the same in the tile shader, the bed shader and the world);
//           banks and far end thin out tile by tile; beyond 100 m one disc in eight is drawn 3.4 times its size.
//   PEAKS   the axis bends inward as it climbs (about 100 m, the dark one less than the bright one) and hooks over at a
//           blunt domed crown; tiers are of unequal height, hems sag up to 50 m lower on one side, lower hems flare wider
//           and each robe hangs out on one side; radius is capped at 116 m + 0.6 h so the flight's hem pass stays clear.
//   CLIFF   the river's punched bank panel runs on down the cliff as a gilded border either side of the falls.
// THIRD ROUND (the world coder, after the third review)
//   LEAF    still the calm sheet, with the metal back: the overlapped seam is a paler rule never under a pixel and a
//           quarter (lacquer keeps its dim hairline); one leaf in five is worn through to the bole along an edge or round
//           a corner, 1 to 3 m deep; streaks double where the burnish lies; whorls and dot rows are also struck 3.2 times
//           as large for the far view and catch pale inside the burnished zone; the blaze is off within 110 m of the eye.
//           White gold runs cool silver in its mid steps and champagne only in the top two.
//   CLIFF   panelled with the bank border: every 96 m along the face, under the brink, at mid height and above the foot.
//   TILES   upright tablets carry bolder marks (a block, three squares or a bar) that hold to about 60 m.
//   PEAKS   lean 124 m (was 104). Every smoothstep in the shaders has its edges in rising order.
// FOURTH ROUND (the world coder)
//   LEAF    yellow and white gold are a mosaic again, in measure: a leaf's own hash spans 0.42 of the ramp (the first
//           version had 0.8, the calm sheet 0.06), light tesserae beside dark, still under the broad drifts; inside the
//           burnished zone the three top steps mix (sheen lift 0.4), so no flank or floor is one pale sheet. The far-view
//           whorl is line work: three struck rings that fill the leaf, on one leaf in twelve (one in six on the cliff),
//           in a dark gold between the next step down and the tool ink, pale where the burnish lies; no far dot rows.
//           Worn bole shows only where a leaf is more than about 10 pixels across, and on fewer leaves of the sky.
// FIFTH ROUND (the world coder: the gold ground was the same flat tile wall the whole flight long),
// as corrected in ROUND 4a against the brief (no figures, no one implied, no blue in the sky, everything else gold leaf)
//   THE SECOND SCALE. The sheet carries marks many leaves across, all drawn in the leaf shader as flat inlay (no new draw
//   call, no texture), so the backdrop differs from one part of the flight to the next:
//   FRIEZE  the cliff either side of the falls carries bands of inlay (swagAt / swagInk): great curls struck in the leaf over
//           each flank, and three tiers of flat pattern lying right across it IN the plane of the cliff, between two tiers of
//           the leaf itself, every lower edge scalloped and edged in umber with a pale band, fixed in time (triangles,
//           chequers and bars in black, white and silver on the whorl robe's flank; spirals and ringed rounds in the scheme's
//           colours on the dark robe's). Nothing on the wall stands, tapers or is capped: there are no figures. A band of
//           chequers tooled in gold runs along the foot and a band of punched gold almonds under the brink. The mid-height
//           panel border is gone.
//   SKY     gold only, in three quarters by bearing (uSd mirrors them with the peaks): downstream a dotted sky of struck coins;
//           beyond the dark robe great curls; beyond the whorl robe rows of punch dots along every third course and great
//           punched rounds (four struck rings in dark gold, each with a pale crescent, and a ring of punch dots).
//   GROUND  the pool and the meadow wear a border of chequers tooled in gold between drawn rules (bankD), with great curls
//           struck in the ground beyond; on the plateau a border of gold triangles runs along the river's bank (riverBank).
//   ROUND 4b  on the dome the blaze is chosen, not thresholded: the one leaf the mirror direction falls in (and its neighbour
//           in the same course while that direction is within a seventh of a leaf of their shared side). On the land it is every
//           leaf whose mirror direction meets the window (a > uHiCos), as before that round. The inlay is drawn at time 0 and, seen
//           along the face, sampled along the pixel's long axis, so it is drawn or flat average, never a smear. The spray's
//           dots add mid gold, not ochre.
//   BLAZE   the blazing leaf is the whole leaf at uHi, edge to edge: one in the sky, and on the land every leaf whose
//           mirror direction meets the window. Nothing in it reads where the camera looks.
//   Every pow, sqrt and division added here has a guarded argument; lacquer draws curls, coins and rounds in gold on black.
import * as THREE from 'three';

const BRIEF_PALETTE = ['#D8A837', '#F4DC92', '#7E5F1A', '#16130F', '#F5F1E7', '#C3476C', '#2C58AA'];
const TAU = Math.PI * 2;

// ---- on-screen colour targets ----
// The world returns post.flat = 1 (the tone map is skipped and the linear colour written is the colour shown), so an
// ink is simply its hex as linear colour. Everything stays at or under 1 except the one blazing leaf (uHi), which is
// the only thing over the bloom threshold. (An earlier version inverted the tone curve instead; its inks reached 2.0
// and the whole picture bloomed while the post settings blend toward the next world on the approach to the portal.)
function inkOf(hex) {
  const t = new THREE.Color(hex);
  return new THREE.Vector3(t.r, t.g, t.b);
}

// ---- shared GLSL ----
const GLSL_COMMON = /* glsl */`
  #define TAU 6.2831853
  uniform vec3 uInk[14];   // 0 gold 1 pale gold 2 dark gold 3 black 4 white 5 rose 6 cobalt 7 silver 8 malachite 9 umber 10 bole 11 pool 12 mean gold 13 gold step 2
  uniform float uTime;
  float h11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
  float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
  vec2 h22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
  vec3 inkAt(float i){ int k=int(clamp(i+.5,0.,13.)); return uInk[k]; }
  float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
`;

// Flat three-ink motifs, loop free. uv in motif units, aa = width of one pixel in motif units.
// id: 0 chequer 1 bars 2 bricks 3 scales 4 ringed eyes 5 spirals 6 triangles 7 waves. Returns ink weights (sum 1).
const GLSL_MOTIF = /* glsl */`
  float edge(float d, float aa){ return smoothstep(-aa, aa, d); }
  vec3 motifW(vec2 uv, float id, float aa, float t){
    float a = max(aa, 1e-4) * .75;
    if (id < .5) {                       // chequer with a small counter-square in every fourth field
      float su = edge(.25 - abs(fract(uv.x*.5) - .5), a*.5), sv = edge(.25 - abs(fract(uv.y*.5) - .5), a*.5);
      float c = mix(su, 1. - su, sv);
      vec2 g = floor(uv), q = abs(fract(uv) - .5);
      float dot2 = edge(.17 - max(q.x, q.y), a) * step(.5, fract((g.x + g.y*2.)*.25 + .1));
      return mix(vec3(1. - c, c, 0.), vec3(0., 0., 1.), dot2);
    } else if (id < 1.5) {               // bars: broad, narrow, and a pinstripe of the third ink
      float x = fract(uv.x*.5)*2.;
      float b1 = edge(.5 - abs(x - .55), a), pin = edge(.07 - abs(x - 1.5), a);
      float yb = edge(.42 - abs(fract(uv.y*.25 + floor(uv.x*.5)*.37) - .5), a*.25);
      return vec3((1. - b1)*(1. - pin) , b1*yb, pin + b1*(1. - yb));
    } else if (id < 2.5) {               // bricks: long rectangles in running bond, no joint
      float row = floor(uv.y*2.); float x = uv.x*.5 + row*.5*.618;
      float k = h21(vec2(floor(x), row));
      float ex = min(fract(x), 1. - fract(x))*2., ey = min(fract(uv.y*2.), 1. - fract(uv.y*2.))*.5;
      float inset = edge(min(ex, ey) - .09, a);
      vec3 w = k < .42 ? vec3(1., 0., 0.) : (k < .8 ? vec3(0., 1., 0.) : vec3(0., 0., 1.));
      return mix(vec3(1., 0., 0.), w, inset);
    } else if (id < 3.5) {               // scales: overlapping discs in offset rows, each with a ring
      vec2 p = vec2(uv.x, uv.y*1.6); float row = floor(p.y);
      vec2 f = vec2(fract(p.x + row*.5) - .5, fract(p.y));
      vec2 f2 = vec2(fract(p.x + (row + 1.)*.5) - .5, fract(p.y) - 1.);
      float d1 = length(vec2(f.x, f.y/1.6 + .1)), d2 = length(vec2(f2.x, f2.y/1.6 + .1));
      float d = d2 < .52 ? d2 : d1;
      float ring = edge(.07 - abs(d - .36), a), core = edge(.16 - d, a);
      return vec3((1. - ring)*(1. - core), ring, core);
    } else if (id < 4.5) {               // ringed eyes on a half-drop grid
      vec2 p = uv*.8; float col = floor(p.x); p.y += col*.5;
      vec2 f = fract(p) - .5; float d = length(f);
      float k = h21(vec2(col, floor(p.y)));
      float r1 = edge(.44 - d, a), r2 = edge(.33 - d, a), r3 = edge(.2 + .05*sin(t*.4 + k*TAU) - d, a), r4 = edge(.09 - d, a);
      vec3 w = vec3(1., 0., 0.);
      w = mix(w, vec3(0., 0., 1.), r1); w = mix(w, vec3(0., 1., 0.), r2);
      w = mix(w, k < .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.), r3); w = mix(w, vec3(0., 1., 0.), r4);
      return w;
    } else if (id < 5.5) {               // spirals: one slow-winding whorl per cell
      vec2 p = uv*.6; vec2 g = floor(p); vec2 f = fract(p) - .5; float d = length(f);
      float k = h21(g); float dir = k < .5 ? 1. : -1.;
      float ang = atan(f.y + 1e-5, f.x + 1e-5)/TAU;
      float s = fract(ang*dir + d*(3.2 + sin(t*.25 + k*TAU)*.7) + k + t*.03);
      float arm = edge(.25 - abs(s - .5), a*(1.5 + .25/max(d, .05)));
      float disc = edge(.46 - d, a), core = edge(.07 - d, a);
      vec3 w = mix(vec3(1., 0., 0.), vec3(0., 1., 0.), arm);
      w = mix(w, vec3(0., 0., 1.), core);
      return mix(vec3(0., 0., 1.)*.0 + vec3(1., 0., 0.), w, disc);
    } else if (id < 6.5) {               // triangles, point down, alternate rows shifted
      float row = floor(uv.y); vec2 f = vec2(fract(uv.x + row*.5), fract(uv.y));
      float tri = edge(f.y*.5 - abs(f.x - .5) , a);
      float k = h21(vec2(floor(uv.x + row*.5), row));
      return mix(vec3(1., 0., 0.), k < .7 ? vec3(0., 1., 0.) : vec3(0., 0., 1.), tri);
    }
    float y = uv.y + .22*sin(uv.x*TAU*.5 + t*.3);   // waves in three bands
    float f = fract(y*.5)*2.;
    float b1 = edge(.33 - abs(f - .4), a), b2 = edge(.12 - abs(f - 1.25), a);
    float pinl = edge(.03 - abs(f - .4), a) + edge(.045 - abs(fract(uv.x*2. + .5*floor(y*.5)) - .5), a*2.) * edge(.05 - abs(f - 1.72), a);
    b2 = max(b2, min(pinl, 1.));
    return vec3((1. - b1)*(1. - b2), b1*(1. - b2), b2);
  }
  vec3 motifAvg(float id){
    if (id < .5) return vec3(.47, .47, .06); if (id < 1.5) return vec3(.45, .40, .15); if (id < 2.5) return vec3(.55, .28, .17);
    if (id < 3.5) return vec3(.56, .30, .14); if (id < 4.5) return vec3(.48, .30, .22); if (id < 5.5) return vec3(.62, .34, .04);
    if (id < 6.5) return vec3(.5, .35, .15); return vec3(.55, .33, .12);
  }
`;

// ---- GOLD LEAF: plateau, cliff, piers, lower country and sky dome share this one program ----
// uMode 0/1: a flat face; leaf coordinates come from the local position (xz on level faces, along-face and y on
// vertical ones). uMode 2: the dome; leaves are counted by arc length round and up it.
const LEAF_VERT = /* glsl */`
  attribute vec2 aE;                 // x: metres to the nearest contour edge of the face (big if none), y: 1 on tooled piers
  uniform float uMode; uniform vec3 uCamL;
  varying vec3 vP; varying vec3 vN; varying vec2 vE;
  void main(){
    vP = position; vN = normal; vE = aE;
    vec4 mv = modelViewMatrix * vec4(position, 1.);
    gl_Position = projectionMatrix * mv;
    if (uMode > 1.5) gl_Position.z = gl_Position.w * .9999;
  }`;
const LEAF_FRAG = /* glsl */`
  precision highp float;
  ${GLSL_COMMON}
  ${GLSL_MOTIF}
  uniform float uMode, uLeaf, uHiCos, uWalk, uSd; uniform vec3 uSheen; uniform vec4 uCalm; uniform float uDull;
  uniform vec3 uCamL, uWindow, uWindowSky, uHi, uTool, uStep[6], uSeamCol; uniform float uSeamInk, uSeamW, uBoleW, uGold, uPierLift;
  varying vec3 vP; varying vec3 vN; varying vec2 vE;
  float lineCov(float d, float w, float px){ return clamp((w - d) / max(px, 1e-5) + .5, 0., 1.); }
  vec3 rampAt(float i){ return i < .5 ? uStep[0] : (i < 1.5 ? uStep[1] : (i < 2.5 ? uStep[2] : (i < 3.5 ? uStep[3] : uStep[4]))); }
  // a compass-struck whorl: rings every half metre out to 1.5 m and a petalled ring; x = the struck line, y = its pale crescent
  vec2 whorl(vec2 c, float kind, float pw, float px){
    float r = length(c);
    float rr = abs(fract(clamp(r, 0., 1.5) * 2.) - .5) * .5;
    float ring = lineCov(rr, pw, px) * step(r, 1.62);
    float ang = atan(c.y + 1e-5, c.x + 1e-5);
    float pet = lineCov(abs(r - (.75 + .5 * abs(sin(ang * 4. + kind * 40.)))), pw, px) * step(r, 1.5);
    vec2 c2 = c - vec2(pw, -pw) * 1.2; float rr2 = abs(fract(clamp(length(c2), 0., 1.5) * 2.) - .5) * .5;
    return vec2(max(ring, pet), lineCov(rr2, pw, px) * step(length(c2), 1.62) * (1. - ring));
  }
  // the far-view whorl: three struck rings that fill the leaf (5 m), a pale crescent inside each; x = the line, y = its crescent
  vec2 farWhorl(vec2 c, float pw, float px){
    float r = length(c), ring = lineCov(abs(mod(r, 1.65) - .825), pw, px) * step(r, 4.95);
    vec2 c2 = c - vec2(pw, -pw) * 1.3; float r2 = length(c2);
    return vec2(ring, lineCov(abs(mod(r2, 1.65) - .825), pw, px) * step(r2, 4.95) * (1. - ring));
  }
  float meadowHalf(float z){
    float pool = 100. * (.55 + .45 * smoothstep(-6., 42., z));
    float w = pool + 10. * smoothstep(70., 150., z) - 16. * smoothstep(170., 300., z) * (1. - smoothstep(300., 420., z)) + 60. * smoothstep(330., 520., z);
    return w * (1. - .95 * smoothstep(470., 700., z));
  }
  float meadowMid(float z){ return 46. * sin((z - 330.) * .0105) * smoothstep(330., 430., z); }
  float bankD(vec2 xz){                                              // metres outside the outline of the pool and the meadow's bed (as the bed draws it)
    vec2 q = abs(vec2(xz.x, xz.y - 30.)) - vec2(100., 80.) + 46.;
    float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - 46.;
    float dB = xz.y > 64. ? max(abs(xz.x - meadowMid(xz.y)) - meadowHalf(xz.y) - 5. - 3. * sin(xz.y * .11), xz.y - 699.) : 1e3;
    return min(d, dB);
  }
  float riverBank(vec2 xz){                                          // metres outside the river's gilded bank panel, on the plateau
    float zeta = clamp((xz.y + 420.) / 420., 0., 1.);
    float hw = 36.5 + 55. * pow(max(zeta, 1e-4), 1.6) + 2.5 * smoothstep(.9, 1., zeta);
    return max(abs(xz.x), length(vec2(xz.x, min(xz.y + 420., 0.) * 1.6))) - hw - 3.4;
  }
  // ---- THE SECOND SCALE (fifth round, round 4a): curls, swags and bands inlaid in the sheet, flat ink ----
  // a field of great curls struck into the gold (the scroll trees' volutes, 20 m across): c in metres, cs = the cell
  float curls(vec2 c, float cs, float wm, float px, out vec2 ctr, out float kk){
    vec2 p = c / cs; p.y += .5 * floor(p.x);
    vec2 g = floor(p), f = fract(p) - .5; float d = length(f), k = h21(g + 17.7), dir = k < .5 ? 1. : -1.;
    ctr = vec2(g.x + .5, g.y + .5 - .5 * g.x) * cs; kk = h21(g * 1.9 + 3.3);
    float s = fract(atan(f.y + 1e-5, f.x + 1e-5) / TAU * dir + d * 3. + k);
    float sc = 3. / cs;
    return clamp((wm * sc * .5 - abs(s - .5)) / max(px * sc, 1e-5) + .5, 0., 1.) * step(d, .47) * step(.05, d);
  }
  // THE INLAID BANDS (the "swags" of round 4a; the first crew's ruling of 2026-10-06, round 4b): five tiers lie right across
  // each flank IN the plane of the cliff, three of flat pattern (0, 2, 4) between two of the bare leaf (1, 3). Each lower
  // edge is a drawn, scalloped line that dips in long unequal waves: a shape, fixed, with no time in it. Nothing stands, tapers
  // or is capped, no two flanks and no stack of edges share a vertical axis, and the tiers run the whole length of the flank.
  // The pattern tiers are trimmed (round 4b: .165, .425, .825) so that ink is two fifths of a flank and under 44 percent of
  // what any view shows of one. p = metres along the flank from the falls' border, and height (12 to 231 m: the top tier stops
  // 19 m under the brink). Returns the tier (0..4) and metres above that tier's lower edge.
  vec2 swagAt(vec2 p, float side){
    float t = clamp((p.y - 12.) / 219., 0., 1.), x = p.x, k = side * 3.7;
    float s1 = abs(sin(x * .145 + k)), s2 = abs(sin(x * .17 + 1.1 - k)), s3 = abs(sin(x * .125 + 2.3 + k)), s4 = abs(sin(x * .19 + .7));
    float h1 = .165 + .04 * sin(x * .019 + 1.3 + k) + .015 * sin(x * .047 - k * 2.) - .042 * s1;
    float h2 = .425 + .04 * sin(x * .027 + 4.1 - k) + .015 * sin(x * .061 + k) - .042 * s2;
    float h3 = .60 + .04 * sin(x * .023 + 2.6 + k * 2.) + .015 * sin(x * .053 + 1.9) - .042 * s3;
    float h4 = .825 + .035 * sin(x * .031 + .4 - k) + .015 * sin(x * .043 + k * 3.) - .042 * s4;
    float ti = step(h1, t) + step(h2, t) + step(h3, t) + step(h4, t);
    float hb = ti < .5 ? -1. : (ti < 1.5 ? h1 : (ti < 2.5 ? h2 : (ti < 3.5 ? h3 : h4)));
    return vec2(ti, (t - hb) * 219.);
  }
  // the ink of a patterned tier (0, 2, 4; tiers 1 and 3 are the gold leaf itself): on the flank by the whorl robe triangles,
  // chequers and bars in black, white and silver; on the flank by the dark robe spirals and ringed rounds in the scheme's colours
  // (round 4b) The inlay does not move: the motif is drawn at time 0. Seen along the face a pixel covers many times more wall
  // one way than the other, so the motif is taken at four points along the pixel's long axis (mj, in motif units) and each is
  // softened only by aaT, the larger of the short axis and a quarter of the long one: edges stay drawn, nothing smears, and
  // under 4 pixels a motif on the long axis the tier is its flat average ink.
  vec3 swagInk(vec2 uv, float ti, float bright, float mpx, vec2 mj, float aaT){
    vec4 pt;
    if (bright < .5) pt = ti < .5 ? vec4(6., 3., 4., 7.) : (ti < 2.5 ? vec4(0., 3., 7., 4.) : vec4(1., 3., 7., 4.));
    else pt = ti < .5 ? vec4(5., 6., 0., 4.) : (ti < 2.5 ? vec4(4., 5., 0., 6.) : vec4(5., 8., 0., 5.));
    vec3 w = vec3(0.);
    for (int i = 0; i < 4; i++) w += motifW(uv + mj * (float(i) * .25 - .375), pt.x, aaT, 0.);
    w *= .25;
    w = mix(motifAvg(pt.x), w, smoothstep(4., 9., mpx));
    return inkAt(pt.y) * w.x + inkAt(pt.z) * w.y + inkAt(pt.w) * w.z;
  }
  void main(){
    vec3 n0, T, B; vec2 q; float cols = 1.;
    if (uMode > 1.5) {
      vec3 d = normalize(vP + vec3(1e-4));
      float R = 420.; float el = asin(clamp(d.y, -1., 1.));
      float row = floor(el * R / uLeaf), bandR = floor(row / 5.) * 5.;      // five courses to a band share their columns: squares stack on squares
      cols = max(6., floor(TAU * R * cos((bandR + 2.5) * uLeaf / R) / uLeaf));
      float az = atan(d.x + 1e-5, d.z + 1e-5) / TAU;                        // 0 downstream, where every band lines up
      q = vec2(az * cols + 1000., el * R / uLeaf);
      n0 = -d; T = normalize(vec3(d.z, 0., -d.x) + vec3(1e-4, 0., 0.)); B = cross(T, n0);
    } else {
      n0 = normalize(vN + vec3(0., 1e-5, 0.));
      if (abs(n0.y) > .7) { T = vec3(1., 0., 0.); B = vec3(0., 0., 1.); q = vP.xz / uLeaf; }
      else { T = normalize(vec3(n0.z, 0., -n0.x)); B = vec3(0., 1., 0.); q = vec2(dot(vP, T), vP.y) / uLeaf; }
    }
    vec2 cell = floor(q), f = fract(q), m = f * uLeaf;
    float lx = length(dFdx(vP)), ly = length(dFdy(vP));
    float px = max(max(lx, ly), 1e-4);                               // metres of leaf per pixel (the coarser axis)
    float leafPx = uLeaf / max(sqrt(lx * ly), 1e-4);                 // leaf size in pixels (by area)
    vec2 hh = h22(cell + 11.3); float bias = h21(cell * 1.7 + 4.1), kind = h21(cell * 2.3 + 9.7);
    vec3 n = normalize(n0 + (T * (hh.x - .5) + B * (hh.y - .5)) * .14);
    vec3 zone = vec3(0.);
    float a, camD = 1e4, hiSel = 0.; vec2 dqA = cell * .115, dqB = cell * .041;     // where the broad drifts of tone are read: several leaves wide
    if (uMode > 1.5) {
      vec3 ws = normalize(uWindowSky + .22 * vec3(sin(uCamL.z / 90.), sin(uCamL.y / 70.) * .6, cos(uCamL.x / 75. + uCamL.z / 130.)));
      float elc = (cell.y + .5) * uLeaf / 420., phc = (cell.x + .5 - 1000.) / max(cols, 1.) * TAU;
      vec3 dc = vec3(sin(phc) * cos(elc), sin(elc), cos(phc) * cos(elc));
      a = dot(normalize(dc + (T * (hh.x - .5) + B * (hh.y - .5)) * .09), ws);
      // THE BLAZE (round 4b): the one leaf the mirror direction falls in, and while that direction is within a seventh of a
      // leaf of the leaf's side the next leaf of the same course with it: one leaf, two as it hands over, never more
      float hx = atan(ws.x + 1e-5, ws.z + 1e-5) / TAU * cols + 1000. - (cell.x + .5); hx -= cols * floor(hx / cols + .5);
      hiSel = step(abs(hx), .64) * step(abs(asin(clamp(ws.y, -1., 1.)) * 420. / uLeaf - (cell.y + .5)), .5);
      dqA = dc.xz * 4.4 + dc.y * 2.7; dqB = dc.xz * 1.6 + dc.y * 1.1;      // on the dome the drifts follow direction, so they run unbroken across the bands
      // the sky's three quarters (by the leaf's own bearing, 0 downstream, + toward the dark robe): dotted, curled, ringed
      float azL = mod(phc * uSd + 3.14159265, TAU) - 3.14159265, elK = smoothstep(.1, .26, elc);
      zone = vec3((1. - smoothstep(.75, 1.2, abs(azL))) * elK, smoothstep(.75, 1.2, azL) * (1. - smoothstep(2.5, 2.95, azL)), smoothstep(.75, 1.2, -azL) * (1. - smoothstep(2.5, 2.95, -azL)) * elK);
    } else {
      vec3 cL = vP + (T * (.5 - f.x) + B * (.5 - f.y)) * uLeaf;  // the leaf's centre: one value for the whole leaf
      vec3 Vc = normalize(uCamL - cL + vec3(1e-4)); camD = length(uCamL - cL);
      a = dot(reflect(-Vc, n), uWindow);
      // on the land every leaf whose mirror direction meets the window blazes (a > uHiCos), as before round 4b
      hiSel = step(uHiCos, a);
    }
    // one number per leaf: a walking hash (steps wander as the eye moves) lifted by the sheen, a broad burnished
    // zone round the mirror direction where pale leaves gather and the blazing one sits. Still one flat step a leaf.
    float s0 = abs(fract(bias + a * uWalk + uTime * .003) * 2. - 1.);     // and the sheet breathes: a leaf now and then changes its step even when the eye is still
    float sh = smoothstep(uSheen.x, 1., a); sh = sh * (.45 + .55 * sh);
    // A calm sheet (uCalm: how much of the ramp a single leaf's own hash spans away from and inside the sheen, how much
    // the drifts span, and which drift): neighbouring leaves keep within a step and tone moves in broad slow drifts, so
    // the pale steps are found only in the burnished quarter. Lacquer keeps its own scatter (black on black hides it).
    float driftN = .62 * vnoise(dqA + 7.3 + vec2(uTime * .006, uTime * .004)) + .38 * vnoise(dqB + 3.1 - vec2(uTime * .002, 0.));
    float drift = mix(vnoise(cell * .27 + 7.3), clamp((driftN - .5) * 1.3 + .5, 0., 1.), uCalm.w);
    float s = s0 * mix(uCalm.x, uCalm.y, sh) + uSheen.y * sh + uSheen.z + (drift - .5) * uCalm.z
      - uDull * (1. - smoothstep(-.65, .15, a));                              // and the side turned from the window is a step duller, in the same broad drifts
    float stepI = s < .29 ? 0. : (s < .52 ? 1. : (s < .8 ? 2. : (s < .935 ? 3. : 4.)));
    stepI = max(stepI, uPierLift * step(.5, vE.y));                  // lacquer: the tooled piers stay gold
    // overlapped seam on two edges: one step paler
    // the rare gold rank: behind gold tiles the cliff's leaves go to the two darkest steps, so every tile stands off the wall
    if (uMode < 1.5 && abs(n0.z) > .7 && vE.y < .5 && abs(vP.x) < 93. && abs(vP.z) < 1.) {
      float sHere = clamp((250. - (cell.y + .5) * uLeaf) / 250., 0., 1.);
      stepI = mix(stepI, min(floor(stepI * .5), 1.), step(1. + sHere, uGold));
    }
    // the overlapped seam on two edges is one step paler. In gold it is never thinner than a pixel and a quarter, so from far
    // off the sheet is ruled in pale overlaps (the dark hairline is lacquer's own).
    float gilt = 1. - uSeamInk;
    float seamW = mix(uSeamW, max(uSeamW, px * 1.25), gilt);
    float seam = max(lineCov(m.x, seamW, px), lineCov(m.y, seamW, px));
    vec3 dark = uStep[0], g1 = uStep[1], g2 = uStep[2], g3 = uStep[3], g4 = uStep[4];
    vec3 col = rampAt(stepI);
    col = mix(col, rampAt(stepI < 3.5 ? stepI + 1. : 3.), seam * gilt);    // (on the palest leaf the overlap is the step below: still a pale rule)
    col = mix(col, mix(uSeamCol, uInk[13], sh), seam * uSeamInk);          // lacquer: a dim hairline that turns gold only in the burnished zone
    // brushed streaks, 16 to 1, in four flat bands: five percent, and twice that where the burnish lies across them
    vec2 sm = kind < .5 ? m : m.yx;
    float streak = vnoise(vec2(sm.x * .55, sm.y * 9.) + cell * 3.1);
    col *= 1. + (floor(streak * 4.) / 3. - .5) * (.09 + .11 * sh * gilt) * smoothstep(8., 30., leafPx);
    // punched tooling: a compass-struck whorl on one leaf in nine (one in five on the cliff), a row of punch dots on others.
    // Far off the same whorl is struck 3.2 times as large, as the hills' motifs and the far tiles are, so the panel is still
    // worked from 300 m; and where the burnish lies on a mid-toned leaf the struck lines catch pale instead of dark.
    float tool = smoothstep(30., 70., leafPx), tooled = step(.5, vE.y);
    float cliffK = (uMode < 1.5 && abs(n0.y) < .7) ? 1. : 0.;
    float pw = max(.035, px * .8);
    vec2 c = m - uLeaf * .5;
    vec3 toolInk = mix(uTool, g4, smoothstep(.15, .5, sh) * step(stepI, 2.5) * gilt);
    if (kind > mix(mix(.89, .8, cliffK), .45, tooled)) {
      vec2 wn = whorl(c, kind, pw, px);
      // far off, on fewer leaves, the whorl is struck leaf-wide: line work one step darker than its leaf (pale where the burnish lies)
      vec2 wf = farWhorl(c, max(.2, px * .7), px) * step(mix(.92, .84, cliffK), kind) * (1. - smoothstep(70., 150., leafPx)) * smoothstep(6., 12., leafPx) * gilt;
      vec3 farInk = mix(mix(stepI > .5 ? rampAt(stepI - 1.) : uStep[0] * .86, uTool, .7), g4, smoothstep(.15, .5, sh) * step(stepI, 2.5));
      col = mix(col, g4, wf.y * .7); col = mix(col, farInk, wf.x * .9);
      col = mix(col, g4, wn.y * tool * .9); col = mix(col, toolInk, wn.x * tool);
    } else if (kind < mix(.16, .4, tooled)) {
      vec2 pm = kind < .08 ? m : m.yx;
      vec2 pd = vec2(fract(pm.x / .75) * .75 - .375, pm.y - (1.1 + h11(kind * 91.) * 2.));
      float dd = abs(length(pd) - .16);
      float ring = lineCov(dd, pw, px), cres = lineCov(abs(length(pd - vec2(pw, -pw)) - .16), pw, px) * (1. - ring);
      col = mix(col, g4, cres * tool * .9); col = mix(col, toolInk, ring * tool);
    }
    // (round 4d) a pier is worked all over: three more punched rows to a leaf, struck where the leaf is passed at arm's length
    // (a leaf over 110 px), so the face of a pier a few metres off is still tooled gold and never a bare sheet
    if (tooled > .5) {
      vec2 pr = vec2(fract(m.x / .75) * .75 - .375, mod(m.y, 3.) - 1.5);
      float rowK = step(3., m.y) * smoothstep(110., 200., leafPx);
      float ringP = lineCov(abs(length(pr) - .16), pw, px), cresP = lineCov(abs(length(pr - vec2(pw, -pw)) - .16), pw, px) * (1. - ringP);
      col = mix(col, g4, cresP * rowK * .9); col = mix(col, toolInk, ringP * rowK);
      // and nearer still (a leaf over 300 px: the pass in front of the falls goes by a pier 4 to 9 m off) the ground between
      // those rows is punched too: a small ring every 0.75 m in each metre row, alternate rows set half a step along, and a
      // ruled double line half a metre inside the leaf's edge. All of it tooling in the leaf's own gold.
      float nearK = smoothstep(300., 520., leafPx), rowI = floor(m.y);
      vec2 pf = vec2(fract(m.x / .75 + .5 * mod(rowI, 2.)) * .75 - .375, m.y - rowI - .5);
      float bare = 1. - step(3., m.y) * step(abs(mod(m.y, 3.) - 1.5), .5);
      float ringF = lineCov(abs(length(pf) - .07), pw * .8, px), cresF = lineCov(abs(length(pf - vec2(pw, -pw)) - .07), pw * .8, px) * (1. - ringF);
      float eT = min(min(m.x, m.y), min(uLeaf - m.x, uLeaf - m.y));
      float rule = max(lineCov(abs(eT - .5), pw, px), lineCov(abs(eT - .68), pw * .7, px));
      col = mix(col, g4, cresF * bare * nearK * .8); col = mix(col, toolInk, max(ringF * bare, rule) * nearK * .85);
    }
    // bole at worn edges and in hairline cracks, never thinner than a pixel and a half
    float e = min(min(m.x, m.y), min(uLeaf - m.x, uLeaf - m.y));
    float wob = vnoise(q * 37. + 5.);
    float bw = mix(.03, .11, wob) * (.5 + bias) * uBoleW;
    float bole = max(lineCov(e, bw, px), lineCov(e, px * .75, px) * .55 * smoothstep(9., 26., leafPx) * mix(.22, 1., uSeamInk));
    // worn leaves: on one leaf in five the gold has rubbed through along an edge or round a corner, in ragged flat patches
    // one to three metres deep: bole enough to be seen in a wide frame
    float wornLeaf = step(h21(cell * 3.7 + 1.9), uMode > 1.5 ? .12 : .21) * gilt * smoothstep(9., 20., leafPx);   // (fewer on the sky, and none where a leaf is a few pixels)
    vec2 wc = vec2(hh.x < .5 ? m.x : uLeaf - m.x, hh.y < .5 ? m.y : uLeaf - m.y);
    float ragged = .65 * vnoise(m * .8 + cell * 5.3) + .35 * vnoise(m * 2.9 + cell * 2.1);
    float wearW = min((.5 + 3. * bias) * max(ragged - .3, 0.) * 3., 3.2);
    float wearD = kind < .5 ? wc.x : min(wc.x, wc.y) + .12 * max(wc.x, wc.y);
    bole = max(bole, lineCov(wearD, wearW, px) * step(.02, wearW) * wornLeaf);
    if (kind > .3 && kind < .62) {
      float cy = mix(2., 10., hh.x) + (hh.y - .5) * 1.4 * (sm.x - 6.) + (vnoise(vec2(sm.x * .9, kind * 50.)) - .5) * 2.2;
      float seg = smoothstep(0., 1.5, sm.x - hh.y * 5.) * smoothstep(0., 1.5, hh.y * 5. + 6.5 - sm.x);
      bole = max(bole, lineCov(abs(sm.y - cy), max(.018, px * .75), px) * seg * smoothstep(mix(10., 20., uSeamInk), mix(24., 50., uSeamInk), leafPx));
    }
    col = mix(col, uInk[10], bole);
    // too small to read: the mean of the sheet
    col = mix(uStep[5], col, smoothstep(2.5, 6., leafPx));
    // ---- THE SECOND SCALE on sky and ground (fifth round, corrected in round 4a: gold only) ----
    // Sky: one quarter dotted with struck coins (downstream, over the river run), one hung with great curls (beyond the dark
    // robe), one with rows of punch dots and great punched rounds (beyond the whorl robe). Lower country: the pool and the
    // meadow wear a border of gold chequers between drawn rules, and great curls are struck in the ground beyond it. Plateau:
    // a border of gold triangles along the river's bank, curls beyond.
    vec3 curlInk = mix(uInk[2], uInk[13], uSeamInk);
    vec2 cC; float cK;
    if (uMode > 1.5) {
      vec3 dd = normalize(vP + vec3(1e-4));
      vec2 cc = m - uLeaf * .5; float cr = length(cc);
      // (round 4d) a coin on one leaf in four at most, in the heart of the downstream quarter, and they are the leaves the whorls
      // are struck on first (the same number picks both): where the quarter thins out the marked leaves fall to the whorls' own one
      // in nine, so nowhere in the sky is more than one leaf in four marked
      float coin = step(1. - .25 * zone.x, kind) * step(.001, zone.x);
      col = mix(col, mix(uStep[0] * .86, uInk[13], uSeamInk), lineCov(cr, 3.1, px) * coin * smoothstep(3., 7., leafPx));
      col = mix(col, mix(g3, uInk[1], uSeamInk), lineCov(abs(cr - 1.75), .34, px) * coin * smoothstep(8., 14., leafPx));
      vec2 sc = dd.xz / (1. + max(dd.y, -.6)) * 420.;
      float pxS = max(max(length(dFdx(sc)), length(dFdy(sc))), 1e-4);
      float cu = curls(sc, 74., 3.6, pxS, cC, cK);
      float azC = atan(cC.x * uSd + 1e-5, cC.y + 1e-5);
      float zc = smoothstep(.75, 1.2, azC) * (1. - smoothstep(2.5, 2.95, azC));
      // (round 4d) the sky's curls are struck, not inked: the line is the step of gold under the leaf it crosses, with a punch's
      // pale crescent beside it, so a curl is always gold on gold and never a brown line on a pale leaf
      float cuK = step(cK, zc * 1.1 - .05), cuO = max(1.2, pxS * .8);
      vec2 cC2; float cK2;
      float cuP = curls(sc - vec2(cuO, -cuO), 74., 3.6, pxS, cC2, cK2) * (1. - cu) * cuK * step(abs(cC2.x - cC.x) + abs(cC2.y - cC.y), 1.);
      col = mix(col, mix(g4, uInk[13], uSeamInk), cuP * .55 * gilt);
      col = mix(col, mix(stepI > .5 ? rampAt(stepI - 1.) : uStep[0] * .86, uInk[13], uSeamInk), cu * mix(.9, .8, uSeamInk) * cuK);   // (lacquer's gold curl is as it was)
      // the ringed quarter (round 4a; no ink but gold in the sky): rows of punch dots along every third course of leaves, and
      // great punched rounds, 60 to 76 m across on the sheet: four struck rings in dark gold, each with its pale crescent, a
      // punched heart and a ring of punch dots outside
      float dotRow = step(mod(cell.y, 3.), .5) * zone.z * smoothstep(6., 10., leafPx);
      float pwD = max(.5, px * .8);
      col = mix(col, uInk[1], lineCov(abs(length(cc - vec2(pwD, -pwD)) - 2.3), pwD, px) * dotRow * .9);
      col = mix(col, curlInk, lineCov(abs(cr - 2.3), pwD, px) * dotRow);
      vec2 ePq = sc / 90.; ePq.y += .5 * floor(ePq.x);
      vec2 eG = floor(ePq), eC = vec2(eG.x + .5, eG.y + .5 - .5 * eG.x) * 90.;
      float eK = h21(eG * 2.7 + 6.1), eR = length(eC) / 420., eAz = atan(eC.x * uSd + 1e-5, eC.y + 1e-5);
      // (round 4d) a rule of the sky: no great round nearer downstream than 54 degrees
      float eZone = smoothstep(.95, 1.3, -eAz) * (1. - smoothstep(2.5, 2.95, -eAz)) * step(eR, .93) * step(.3, eR);
      if (eK < .72 * eZone) {
        vec2 eD = sc - eC - (h22(eG + 4.4) - .5) * 20.;
        float R0 = 30. + 8. * h21(eG * 3.3 + 1.2), er = length(eD), gap = R0 * .25, pwR = max(1.2, pxS * .8);
        vec2 eD2 = eD - vec2(pwR, -pwR) * 1.3; float er2 = length(eD2);
        float ring = lineCov(abs(mod(er, gap) - gap * .5), pwR, pxS) * step(er, R0);
        float cres = lineCov(abs(mod(er2, gap) - gap * .5), pwR, pxS) * step(er2, R0) * (1. - ring);
        float ea2 = atan(eD.y + 1e-5, eD.x + 1e-5) / TAU * 18.;
        vec2 pd = vec2((fract(ea2) - .5) * TAU / 18. * er, er - R0 * 1.16);
        float dotR = lineCov(length(pd), 2.4, pxS), dotC = lineCov(length(pd - vec2(pwR, -pwR)), 2.4, pxS) * (1. - dotR);
        float heart = lineCov(er, 3.2, pxS);
        col = mix(col, uInk[1], max(cres, dotC) * .9);
        col = mix(col, curlInk, max(max(ring, dotR), heart));
      }
    } else if (abs(n0.y) > .7) {
      float rw = max(.3, px * 1.6);
      if (vP.y < 100.) {
        float bd = bankD(vP.xz);
        float cu = curls(vP.xz, 62., 3.2, px, cC, cK) * (1. - smoothstep(1.6, 3.6, px));
        col = mix(col, curlInk, cu * .8 * step(34., bankD(cC)) * step(cK, .62));
        if (bd > 3. && bd < 18.) {
          col = uInk[1];
          if (bd < 14.5) {
            vec3 w = motifW(vP.xz / 4.6, 0., px / 4.6, uTime);
            w = mix(motifAvg(0.), w, smoothstep(4., 9., 4.6 / px));
            col = uInk[2] * w.x + uInk[1] * w.y + uInk[13] * w.z;                  // tooled in gold: dark against pale (round 4a)
          }
        }
        col = mix(col, uInk[9], max(max(lineCov(abs(bd - 3.), rw, px), lineCov(abs(bd - 14.5), rw, px)), lineCov(abs(bd - 18.), rw, px)));
      } else {
        float bk = riverBank(vP.xz);
        float cu = curls(vP.xz + 31., 62., 3.2, px, cC, cK) * (1. - smoothstep(1.6, 3.6, px));
        col = mix(col, curlInk, cu * .8 * step(30., riverBank(cC - 31.)) * step(cK, .62));
        if (bk > 1.5 && bk < 10.5) {
          vec3 w = motifW(vP.xz / 4.5, 6., px / 4.5, uTime);
          w = mix(motifAvg(6.), w, smoothstep(4., 9., 4.5 / px));
          col = uInk[13] * w.x + uInk[2] * w.y + uInk[1] * w.z;
        }
        col = mix(col, uInk[9], max(lineCov(abs(bk - 1.5), rw, px), lineCov(abs(bk - 10.5), rw, px)) * step(-450., vP.z));
      }
    }
    // the one blazing leaf (kept to the last)
    float hi = hiSel * (1. - bole * .7) * smoothstep(.6, 1.5, leafPx);
    hi *= smoothstep(110., 240., camD);                               // on the land it blazes only at a distance: a leaf under the eye keeps its pale step and cannot flood the frame
    col = mix(col, uHi, hi);                                          // the whole leaf, edge to edge (round 4e: no pale rim inside it)
    float cw = max(.09, px * 1.6);
    // the river's punched bank panel runs on over the brink and down the cliff: a gilded border either side of the falls
    // and the cliff is panelled with it: the same border every 96 m along the face, under the brink, at mid height and above the foot
    float ax = abs(vP.x) - 93.5;
    vec2 dpx = max(vec2(length(vec2(dFdx(vP.x), dFdy(vP.x))), length(vec2(dFdx(vP.y), dFdy(vP.y)))), vec2(1e-4));
    vec2 wdx = vec2(dFdx(vP.x) * sign(vP.x), dFdx(vP.y)), wdy = vec2(dFdy(vP.x) * sign(vP.x), dFdy(vP.y));   // the pixel's two axes on the cliff face (metres)
    if (uMode < 1.5 && abs(n0.z) > .7 && vE.y < .5 && abs(vP.z) < 1. && ax > 0.) {
      // THE FRIEZE (round 4a, held to the ruling in round 4b): bands of ornament inlaid in the panel. Great curls are struck
      // in the leaf over the whole flank; three tiers of flat pattern lie across it between two tiers of the leaf itself, each
      // lower edge scalloped and edged in umber with a pale band; a band of tooled gold chequers runs along the foot and a
      // band of punched gold almonds under the brink. Nothing on the wall stands, tapers, is capped, hangs or moves.
      float side = vP.x * uSd > 0. ? 1. : 0.;
      float fcw = max(.45, px * 1.7);
      // (round 4d) THE PANELS. The inlay keeps every tier, hem, ink and its origin, and is masked in two places. Beside the falls
      // it begins 12 m from the outer curtain's edge (ax 8.5): a pier's width of bare leaf, foot to brink, with nothing on it.
      // And every 96 m it stops for the width of a border (6 m) and the leaf itself goes through: a flat band of the panel's own
      // gold with the leaf's own tooling, no fill, no beads, no rules of its own. Where a panel is ink its end is one drawn umber
      // edge, and only while the band beside it is ten pixels wide or more, so a far band is a plain gold gap and never a line.
      float bx = mod(ax, 96.), pxB = dpx.x;
      float endD = min(min(bx - 6., 96. - bx), ax - 8.5);              // metres into a panel from its nearer end: negative on the strip and on a band
      vec2 cuC; float cuK;
      float cu = curls(vec2(ax + 23. * side, vP.y), 46., 2.6, px, cuC, cuK) * (1. - smoothstep(1.4, 3.2, px));
      cu *= step(8.5 + .47 * 46., cuC.x - 23. * side);                 // a curl is struck whole or not at all: none reaches into the strip
      col = mix(col, mix(uInk[2], uInk[13], uSeamInk), cu * .85);
      if (endD > -pxB) {
        vec3 leafCol = col; float inkK = step(vP.y, 246.);              // (the top 4 m under the brink are leaf)
        if (vP.y > 12. && vP.y < 231.) {
          vec2 sw = swagAt(vec2(ax, vP.y), side);
          // (round 4e) a rule of the wall: on the flank the flight leaves the face by (the whorl robe's side: side 0) the lowest
          // tier begins at the second panel. In the first panel it is left as the leaf itself, with its scalloped hem above it
          // and the foot band below it
          inkK = (1. - step(.5, mod(sw.x, 2.))) * (1. - step(sw.x, .5) * step(ax, 96.) * (1. - side));
          if (inkK > .5) {
            float fm = 9.5 + .9 * sw.x;
            bool wide = dot(wdx, wdx) > dot(wdy, wdy);
            vec2 mj = (wide ? wdx : wdy) / fm, mn = (wide ? wdy : wdx) / fm;
            col = swagInk(vec2(ax, vP.y) / fm + sw.x * 3.1 + side * 7.7, sw.x, side, fm / px, mj, max(length(mn), length(mj) * .25));
          }
          float hemK = step(.5, sw.x);
          inkK = max(inkK, step(sw.y, 2.8 + fcw) * hemK);
          col = mix(col, uInk[1], step(sw.y, 2.8) * hemK);               // each hem: a plain pale band between two drawn lines
          col = mix(col, uInk[9], max(lineCov(sw.y, fcw, px), lineCov(abs(sw.y - 2.8), fcw * .6, px)) * hemK);
        } else if (vP.y <= 12.) {                                        // the foot: chequers tooled in gold, dark against pale
          vec3 w = motifW(vec2(ax, vP.y) / 4., 0., px / 4., uTime);
          w = mix(motifAvg(0.), w, smoothstep(4., 9., 4. / px));
          col = uInk[2] * w.x + uInk[1] * w.y + uInk[13] * w.z;
        } else if (vP.y < 246.) {                                        // under the brink: a row of punched almonds, gold on dark gold
          vec2 ep = vec2(mod(ax + 5., 17.) - 8.5, vP.y - 238.5) / 5.6;
          float ed2 = 1. - max(length(ep - vec2(0., .6)), length(ep + vec2(0., .6))), er = length(ep), ea = px / 5.6;
          float pwE = max(.035, ea * .8);
          col = uInk[13];
          col = mix(col, uInk[1], smoothstep(-ea, ea, ed2));
          col = mix(col, uInk[2], clamp((pwE - abs(er - .31)) / max(ea, 1e-5) + .5, 0., 1.) * step(0., ed2));
          col = mix(col, uInk[2], smoothstep(-ea, ea, .15 - er));
          col = mix(col, uInk[9], clamp((fcw * .6 / 5.6 - abs(ed2)) / max(ea, 1e-5) + .5, 0., 1.));
          col = mix(mix(uInk[13], uInk[1], .3), col, smoothstep(2., 5., 5.6 / px));        // too small to read: its mean, a mid gold
        }
        col = mix(col, uInk[9], max(lineCov(abs(vP.y - 12.), fcw, dpx.y), max(lineCov(abs(vP.y - 231.), fcw, dpx.y), lineCov(abs(vP.y - 246.), fcw, dpx.y))));
        col = mix(col, uInk[9], lineCov(endD, max(.4, pxB * 1.2), pxB) * inkK * smoothstep(10., 20., 6. / max(pxB, 1e-4)));
        col = mix(leafCol, col, clamp(endD / max(pxB, 1e-4) + .5, 0., 1.));         // the end of a panel is a drawn edge: covered, never stepped
      }
    }
    // umber contour where a face ends (brink, foot, pier arrises)
    float ed = vE.x;
    col = mix(col, uInk[9], lineCov(ed, cw, px));
    gl_FragColor = vec4(col, 1.);
  }`;

// ---- TILES: river ranks, the three curtains and the meadow are one instanced quad; a whole life in closed form ----
const TILE_VERT = /* glsl */`
  attribute vec4 aA;      // stage (0 river, 1 fall, 2 meadow), lane (river: -1..1, fall: x in metres, meadow: -1..1), phase, seed
  attribute vec4 aB;      // top ink (0 black 1 white 2 silver), shape seed, landed radius, fall layer z
  #define TAU 6.2831853
  uniform float uTime, uViewH, uTanHalf, uMeadowLen, uGold; uniform vec3 uCamL, uRate;
  varying vec2 vQ; varying vec2 vBh; varying vec4 vS; varying vec4 vM;
  float meadowHalf(float z){
    float pool = 100. * (.55 + .45 * smoothstep(-6., 42., z));
    float w = pool + 10. * smoothstep(70., 150., z) - 16. * smoothstep(170., 300., z) * (1. - smoothstep(300., 420., z)) + 60. * smoothstep(330., 520., z);
    return w * (1. - .95 * smoothstep(470., 700., z));               // past the peaks it spreads, wanders and thins away to nothing
  }
  float meadowMid(float z){ return 46. * sin((z - 330.) * .0105) * smoothstep(330., 430., z); }
  void main(){
    float stage = aA.x, seed = aA.w, f = 0., sc = 1., life = 0.;
    vec3 C, Tx, Ty;
    if (stage < .5) {
      float zeta = fract(aA.z + uTime * uRate.x);
      float z = -420. + zeta * 421.6;
      float hw = 35. + 55. * pow(max(zeta, 1e-4), 1.6), u = aA.y;
      float ci = clamp(floor((u + 1.) * 1.5), 0., 2.), loc = (u + 1.) * 1.5 - ci;
      float x = mix(u * hw, (ci - 1.) * 64. + (loc - .5) * 49., smoothstep(-96., -46., z));
      float lean = 1.22 * smoothstep(-3.4, .7, z), over = max(z, 0.);
      vec3 base = vec3(x, 250.45 - over * over * .9, z);
      vec3 tc = uCamL - base; float sg = tc.z < 0. ? -1. : 1.;
      float yw = atan(tc.x, abs(tc.z) + 1e-3);                      // abeam of the camera a tile turns part way to it: never edge-on
      yw *= smoothstep(.45, 1.25, abs(yw)) * .72 * (1. - smoothstep(-3.4, .7, z));
      Tx = vec3(cos(yw), 0., -sin(yw) * sg); Ty = vec3(0., cos(lean), sin(lean));
      C = base + Ty * .8;
      sc = smoothstep(0., .02, zeta) * (1. - smoothstep(.9972, 1., zeta)); life = zeta;
    } else if (stage < 1.5) {
      float s = fract(aA.z + uTime * uRate.y), dist = s * 250.;
      float lean = 1.22 * (1. - smoothstep(0., .04, s));
      float ang = (seed < .5 ? -1. : 1.) * (.04 + .035 * (fract(seed * 2.) - .5) * smoothstep(.08, .6, s)) * dist * smoothstep(.01, .09, s);   // a rank turns as one, then loosens
      float ca = cos(ang), sa = sin(ang), cl = cos(lean), sl = sin(lean);
      Tx = vec3(ca, sa * cl, sa * sl); Ty = vec3(-sa, ca * cl, ca * sl);
      C = vec3(aA.y + sin(dist * .031 + seed * TAU) * 1.4 * s, 251.2 - dist, mix(.9, aB.w + (seed - .5) * .85, smoothstep(0., .035, s)));
      f = s; sc = smoothstep(0., .012, s) * (1. - smoothstep(.978, 1., s)); life = 1. + s;
    } else {
      float s = fract(aA.z + uTime * uRate.z);
      float z = 3. + uMeadowLen * (.22 * s + .78 * pow(max(s, 1e-4), 2.2));
      float x = meadowMid(z) + aA.y * meadowHalf(z) + sin(z * .021 + aA.y * 3. + seed * 2.) * 5. * smoothstep(40., 160., z);
      float settle = smoothstep(0., .03, s);
      C = vec3(x, .55 + seed * .9 + .12 * sin(uTime * .9 + seed * 40.) + 1.6 * (1. - settle), z);
      vec3 tc = uCamL - C; vec3 h = normalize(vec3(tc.x, 0., tc.z) + vec3(1e-4, 0., 1e-4));
      float tip = (.24 + .37 * aB.y) * settle;
      vec3 N = normalize(mix(vec3(0., 0., 1.), vec3(0., cos(tip), 0.) + h * sin(tip), settle));
      Tx = normalize(cross(vec3(0., .5, -.866), N) + vec3(1e-5, 0., 0.)); Ty = cross(N, Tx);
      f = 1.; sc = smoothstep(0., .022, s) * (1. - smoothstep(.94, 1., s)); life = 2. + s;
      // the banks and the far end thin out tile by tile instead of stopping on a line
      sc *= step(fract(seed * 7.77 + aB.y * 5.3), 1. - .82 * max(smoothstep(.84, 1., abs(aA.y)), smoothstep(430., 690., z)));
    }
    float R = aB.z;
    vec2 b = mix(vec2(.3, .8), vec2(R), f);
    float dC = max(length(uCamL - C), .5);
    // seen from far off (the portrait of the falls) one falling tile in four is drawn 2.7 times its size and stands for its
    // neighbours, which shrink away: the motif grows with distance, as on the hills, so the change of shape still reads at 250 m
    // (the meadow the same from the height: beyond 100 m one disc in eight is drawn 3.4 times its size over the dark bed)
    float pick = fract(seed * 17.31 + aB.y * 3.7);
    float farK = stage < .5 ? 0. : (stage < 1.5 ? smoothstep(70., 230., dC) : smoothstep(100., 300., dC));
    float mag = mix(1., stage < 1.5 ? step(pick, .26) * 2.7 : step(pick, .13) * 3.4, farK);
    sc *= mag;
    float pxM = dC * 2. * uTanHalf / max(uViewH, 1.) / max(mag, .05);
    float cw = min(max(.05, 1.6 * pxM), .45 * min(b.x, b.y));
    vec2 ext = b + cw + pxM;
    vec3 P = C + (Tx * position.x * ext.x + Ty * position.y * ext.y) * sc;
    vQ = position.xy * ext; vBh = b; vS = vec4(f, aB.x, seed, R); vM = vec4(pxM, aB.y, step(life, uGold - seed * .02), cw);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.);
  }`;
const TILE_FRAG = /* glsl */`
  precision highp float;
  ${GLSL_COMMON}
  uniform vec3 uGoldInk;
  varying vec2 vQ; varying vec2 vBh; varying vec4 vS; varying vec4 vM;
  float band(float x, float lo, float hi, float aa){ return smoothstep(-aa, aa, x - lo) - smoothstep(-aa, aa, x - hi); }
  void main(){
    float f = vS.x, ci = vS.y, seed = vS.z, R = max(vS.w, .1), sh = vM.y, px = max(vM.x, 1e-4), cw = vM.w;
    vec2 b = vBh, ext = b + cw + px, p = clamp(vQ, -ext, ext);        // the across coordinate, held to the quad's own extent before anything squares it
    float c = min(mix(.03, R, smoothstep(.1, .7, f)), min(b.x, b.y));
    vec2 q = abs(p) - b + c;
    float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - c;        // rectangle whose corners round until it is a disc
    float late = smoothstep(.6, .92, f);
    float r = length(p), th = atan(p.y + 1e-5, p.x + 1e-5) + uTime * (.2 + .5 * seed) * (seed > .5 ? 1. : -1.) * late;
    if (sh > .3 && sh < .52) {                                        // almond: two discs intersected
      float k = .75 * R, ra = 1.25 * R;
      d = mix(d, max(length(p - vec2(0., k)), length(p + vec2(0., k))) - ra, late);
    } else if (sh > .76) {                                            // eight petals
      d = mix(d, r - R * (.8 + .2 * abs(cos(th * 4.))), late);
    }
    float aa = px * .75, dep = -d, lod = smoothstep(3., 7., R / px);
    vec3 top = ci < .5 ? uInk[3] : (ci < 1.5 ? uInk[4] : uInk[7]);
    bool pearl = fract(seed * 2.) < .45;
    vec3 landed = ci < .5 ? uInk[6] : (ci < 1.5 ? (pearl ? uInk[4] : uInk[8]) : uInk[5]);
    vec3 ringInk = ci < .5 ? uInk[0] : (ci < 1.5 ? (pearl ? uInk[6] : uInk[4]) : uInk[0]);
    vec3 coreInk = ci < .5 ? uInk[4] : (ci < 1.5 ? (pearl ? uInk[3] : uInk[0]) : uInk[3]);
    vec3 hairInk = ci < .5 ? uInk[7] : (ci < 1.5 ? uInk[7] : uInk[4]);
    if (vM.z > .5) { top = uInk[1]; landed = uInk[1]; ringInk = uInk[3]; coreInk = uInk[3]; hairInk = uInk[3]; }
    float g = smoothstep(.3, .84, f), md = min(b.x, b.y);
    vec3 col = mix(top, landed, smoothstep(-aa, aa, dep - md * (1. - g) * 1.02) * step(.002, g));
    // the upright tile: an inset hairline and, on one in four, a small gold lozenge
    float rect = (1. - smoothstep(.3, .62, f)) * (1. - smoothstep(.025, .07, px));
    col = mix(col, hairInk, band(dep, .075, .075 + max(.022, px * 1.2), aa) * rect);
    float loz = smoothstep(-aa, aa, .11 - abs(p.x) - abs(p.y - .32) * .55) * max(step(.74, fract(seed * 7.31)), vM.z);
    // and bolder marks that hold to 60 m, so the ranks are a pattern of tablets and not plain slabs: on about one in three a
    // block in the upper half, on one in four three small squares up the middle, on some a bar; white on black, black on white and silver
    float rect2 = (1. - smoothstep(.3, .62, f)) * (1. - smoothstep(.09, .2, px)) * (1. - vM.z);
    float mk = 0.;
    if (sh < .3) mk = smoothstep(-aa, aa, min(.13 - abs(p.x), .22 - abs(p.y - .3)));
    else if (sh < .55) mk = smoothstep(-aa, aa, .075 - max(abs(p.x), abs(fract((p.y + .6) / .4) * .4 - .2))) * step(abs(p.y), .6);
    else if (sh < .7) mk = smoothstep(-aa, aa, min(.05 - abs(p.x), .55 - abs(p.y)));
    col = mix(col, ci < .5 ? uInk[4] : uInk[3], mk * rect2);
    col = mix(col, vM.z > .5 ? uInk[3] : uInk[0], loz * rect);
    // the landed ornament: ring bands from the edge distance, a ringed centre, spiral arms on some
    float orn = late * lod;
    float ring = band(dep, .2 * R, .36 * R, aa);
    if (sh > .52 && sh < .76) {
      float sp = fract(th / TAU * 2. + r / R * 1.7);
      ring = smoothstep(-aa, aa, dep - .14 * R) * band(sp, .25, .75, aa * (1. + .3 * R / max(r, .05)) / R);
    }
    col = mix(col, ringInk, ring * orn);
    float cr = (sh > .3 && sh < .52) ? r / (.5 * R) : r / R;      // centres are true circles even in an almond
    col = mix(col, coreInk, (1. - smoothstep(-aa / R, aa / R, cr - .36)) * orn);
    col = mix(col, ringInk, (1. - smoothstep(-aa / R, aa / R, cr - .2)) * orn);
    col = mix(col, coreInk, (1. - smoothstep(-aa / R, aa / R, cr - .1)) * orn * step(.5, fract(seed * 13.7)));
    col = mix(col, uInk[3], band(dep, 0., min(max(.08, px), .24 * md), aa) * vM.z);      // a gold tile wears a black band inside its edge
    // umber contour inside the quad, with a pixel floor; nothing outside it
    col = mix(col, uInk[9], smoothstep(-aa, aa, d));
    if (d > cw) discard;
    gl_FragColor = vec4(col, 1.);
  }`;

// ---- what lies under the tiles: the black river bed ticked with silver, and the dark cobalt plunge pool ----
const UNDER_VERT = /* glsl */`
  varying vec3 vP;
  void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const UNDER_FRAG = /* glsl */`
  precision highp float;
  ${GLSL_COMMON}
  uniform vec3 uRate;
  varying vec3 vP;
  float meadowHalf(float z){
    float pool = 100. * (.55 + .45 * smoothstep(-6., 42., z));
    float w = pool + 10. * smoothstep(70., 150., z) - 16. * smoothstep(170., 300., z) * (1. - smoothstep(300., 420., z)) + 60. * smoothstep(330., 520., z);
    return w * (1. - .95 * smoothstep(470., 700., z));               // past the peaks it spreads, wanders and thins away to nothing
  }
  float meadowMid(float z){ return 46. * sin((z - 330.) * .0105) * smoothstep(330., 430., z); }
  float lineCov(float d, float w, float px){ return clamp((w - d) / max(px, 1e-5) + .5, 0., 1.); }
  void main(){
    float px = max(max(length(dFdx(vP)), length(dFdy(vP))), 1e-4);
    float cw = max(.1, px * 1.6);
    vec3 col; float outside;
    if (vP.y > 100.) {                                   // river bed, fanning from 70 m to 180 m
      float zeta = clamp((vP.z + 420.) / 420., 0., 1.);
      float hw = 36.5 + 55. * pow(max(zeta, 1e-4), 1.6) + 2.5 * smoothstep(.9, 1., zeta);
      float head = length(vec2(vP.x, min(vP.z + 420., 0.) * 1.6));
      float ax = max(abs(vP.x), head);
      float e = hw - ax;                                 // metres inside the bank
      vec2 g = vec2(vP.x / max(hw, 1.) * 30., (vP.z - uTime * uRate.x * 421.6) / 4.4);
      vec2 gi = floor(g), gf = fract(g);
      float k = h21(gi);
      float dash = lineCov(abs(gf.x - .5) * hw / 30., .07, px) * step(abs(gf.y - .5), .12 + .2 * k) * step(.35, k);
      col = mix(uInk[3], uInk[7], dash * (1. - smoothstep(.12, .5, px)));
      col = mix(col, mix(uInk[3], uInk[7], .09), smoothstep(.12, .5, px));
      // the gilded bank panel: a pale fillet, a dark fillet and a row of punch dots, 3.4 m wide
      float bank = -e;
      if (bank > 0.) {
        col = bank < .5 ? uInk[1] : (bank < 2.9 ? uInk[13] : uInk[0]);
        vec2 pd = vec2(fract(vP.z / 1.4) * 1.4 - .7, bank - 1.7);
        float dd = abs(length(pd) - .36), pw = max(.05, px * .8);
        col = mix(col, uInk[1], lineCov(abs(length(pd - vec2(pw, -pw)) - .36), pw, px) * (1. - smoothstep(.1, .3, px)));
        col = mix(col, uInk[2], lineCov(dd, pw, px) * (1. - smoothstep(.1, .3, px)));
        col = mix(col, uInk[9], max(lineCov(abs(bank - .5), cw * .6, px), lineCov(abs(bank - 2.9), cw * .6, px)));
      }
      col = mix(col, uInk[9], lineCov(abs(e), cw, px));
      outside = bank - 3.4;
      col = mix(col, uInk[9], lineCov(abs(outside), cw, px));
    } else {                                             // plunge pool: 200 m across, 110 m long, rounded downstream
      vec2 q = abs(vec2(vP.x, vP.z - 30.)) - vec2(100., 80.) + 46.;
      float d = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - 46.;
      // and the meadow's bed runs on from it: the same dark cobalt between scalloped banks, wandering and tapering away downstream
      float dB = vP.z > 64. ? max(abs(vP.x - meadowMid(vP.z)) - meadowHalf(vP.z) - 5. - 3. * sin(vP.z * .11), vP.z - 699.) : 1e3;
      d = min(d, dB);
      col = uInk[11];
      vec2 g = vP.xz / 13., gi = floor(g);
      vec2 o = (h22(gi) - .5) * 6.; float k = h21(gi + 3.3);
      float ph = fract(uTime * (.09 + .06 * k) + k * 7.);
      float rr = length((fract(g) - .5) * 13. - o);
      float w = max(.05, px * .8) * (1. - ph);
      float rip = max(lineCov(abs(rr - ph * 5.2), w, px), lineCov(abs(rr - ph * 5.2 + 1.1), w * .7, px) * step(1.1, ph * 5.2));
      col = mix(col, uInk[0], rip * (1. - ph) * (1. - smoothstep(.15, .6, px)));
      float foot = lineCov(abs(fract(vP.z / 2.6 - uTime * .35) - .5) * 2.6, max(.05, px * .7), px) * step(vP.z, 9.) * step(.3, h21(vec2(floor(vP.x / 3.), floor(vP.z / 2.6 - uTime * .35))));
      col = mix(col, uInk[0], foot * (1. - smoothstep(.15, .5, px)));
      col = mix(col, uInk[0], step(d, 0.) * lineCov(abs(d + .9), .22, px));     // a gold rim line just inside the edge
      col = mix(col, uInk[9], lineCov(abs(d), cw, px));
      outside = d;
    }
    if (outside > cw) discard;
    gl_FragColor = vec4(col, 1.);
  }`;

// ---- PATTERN SOLIDS (the mantle-peaks' robes; hills and trees of the world can use the same material) ----
// Each solid has a centre C and a motif size m (aCM). The pattern lies on a flat sheet through C that faces the
// camera's POSITION (not its gaze), measured in metres: the silhouette slides over it and robe slides against robe.
// uHull 1 draws the umber contour: the same mesh, back faces, pushed out along the normal with a pixel floor.
const PAT_VERT = /* glsl */`
  attribute vec4 aCM;     // pattern centre xyz (local), motif size in metres
  attribute vec4 aPat;    // motif id, ink indices 0, 1, 2 (into uInk)
  attribute vec4 aHemP;   // hem: base height, drape amplitude, drape phase, scallops round the hem (0 = no hem cut)
  attribute vec2 aHem;    // height along the peak's axis, azimuth
  uniform vec3 uCamL; uniform float uViewH, uTanHalf, uHull;
  varying vec2 vUv; varying vec4 vPat; varying vec4 vHemP; varying vec3 vHem;
  void main(){
    vec3 P = position;
    vec3 C = aCM.xyz; float m = max(aCM.w, .01);
    vec3 fv = C - uCamL; float dC = max(length(fv), 1.); fv /= dC;
    vec3 r = normalize(vec3(fv.z, 0., -fv.x) + vec3(1e-4, 0., 0.));
    vec3 t = cross(r, fv);
    vUv = vec2(dot(P - C, r), dot(P - C, t)) / m;
    float dP = max(length(P - uCamL), .5);
    float pxM = dP * 2. * uTanHalf / max(uViewH, 1.);
    P += normalize(normal + vec3(0., 1e-5, 0.)) * max(.07, 1.6 * pxM) * uHull;
    vPat = aPat; vHemP = aHemP;
    vHem = vec3(aHem, m * uViewH / (2. * uTanHalf * min(dC, dP)));   // motif size in pixels (at the nearer of centre and surface)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.);
  }`;
const PAT_FRAG = /* glsl */`
  precision highp float;
  ${GLSL_COMMON}
  ${GLSL_MOTIF}
  uniform float uHull;
  varying vec2 vUv; varying vec4 vPat; varying vec4 vHemP; varying vec3 vHem;
  void main(){
    float hd = 1e3, fh = max(fwidth(vHem.x), 1e-4);
    if (vHemP.w > .5) {
      float az = vHem.y;
      float sc = abs(sin(az * vHemP.w * .5 + vHemP.z * 3.));          // scallops, points down between the lobes
      float line = vHemP.x + vHemP.y * sin(az + vHemP.z) + .35 * vHemP.y * sin(az * 2. - vHemP.z * 1.7) - 11. * sc * sc;
      hd = vHem.x - line;
      if (hd < 0.) discard;
    }
    if (uHull > .5) { gl_FragColor = vec4(uInk[9], 1.); return; }
    float px = max(vHem.z, 1e-3);
    float blk = step(7.5, vPat.x), id = vPat.x - 8. * blk;
    vec3 w = motifW(vUv, id, 1. / px, uTime);
    w = mix(motifAvg(id), w, smoothstep(4., 9., px));
    vec2 bu = vec2(vUv.x * .14 + 3.3, vUv.y * .31 + 1.7); bu.x += floor(bu.y) * .37;
    vec2 be = min(fract(bu), 1. - fract(bu)) * vec2(7.1, 3.2);
    float ab = 1. / px;
    float mk = step(h21(floor(bu) + 2.5), .56) * smoothstep(0., 2. * ab, min(be.x, be.y) - .12);
    w = mix(w, vec3(1., 0., 0.), mk * blk);
    vec3 col = inkAt(vPat.y) * w.x + inkAt(vPat.z) * w.y + inkAt(vPat.w) * w.z;
    // the hem: an umber edge, then a plain border band in the robe's second ink
    float cw = max(.12, 1.6 * fh);
    col = mix(col, inkAt(vPat.z), step(hd, 2.6) * step(.5, vHemP.w));
    col = mix(col, uInk[9], clamp((cw - min(hd, abs(hd - 2.6))) / fh + .5, 0., 1.));
    gl_FragColor = vec4(col, 1.);
  }`;

// ---- small geometry helpers ----
function quadSoup() {
  const pos = [], nor = [], e = [];
  const v = new THREE.Vector3(), w = new THREE.Vector3(), n = new THREE.Vector3();
  // a, b, c, d counter-clockwise as [x, y, z]; ea..ed = metres to the nearest contour edge at each corner
  function quad(a, b, c, d, ea = 1e3, eb = 1e3, ec = 1e3, ed = 1e3, tool = 0, nrm = null) {
    if (nrm) n.set(nrm[0], nrm[1], nrm[2]);
    else { v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); w.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]); n.crossVectors(v, w).normalize(); }
    for (const [p, ee] of [[a, ea], [b, eb], [c, ec], [a, ea], [c, ec], [d, ed]]) { pos.push(p[0], p[1], p[2]); nor.push(n.x, n.y, n.z); e.push(ee, tool); }
  }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aE', new THREE.Float32BufferAttribute(e, 2));
    return g;
  }
  return { quad, geometry };
}

// World constants of the piece (metres, local space: cliff face is the plane z = 0, +Z downstream).
const TOP = 250, HALF_W = 450, BACK = -700, RIVER_Z0 = -420, CURTAIN_W = 52, PIER_W = 12, PIER_X = 32;
const PEAK_X = 210, PEAK_Z = 300, PEAK_R = 100, PEAK_H = 300, LEAN = 8 * Math.PI / 180;

function buildLeafGeometry() {
  const S = quadSoup(), q = S.quad, W = HALF_W, G = 760, up = [0, 1, 0];
  q([-G, 0, 0], [-G, 0, 860], [G, 0, 860], [G, 0, 0], 1e3, 1e3, 1e3, 1e3, 0, up);                 // lower country
  q([-W, TOP, BACK], [-W, TOP, 0], [W, TOP, 0], [W, TOP, BACK], 1e3, 1e3, 1e3, 1e3, 0, up);       // plateau
  const hm = TOP / 2;
  for (const [x0, z0, x1, z1] of [[-W, 0, W, 0], [W, 0, W, BACK], [W, BACK, -W, BACK], [-W, BACK, -W, 0]]) {   // cliff faces
    q([x0, 0, z0], [x1, 0, z1], [x1, hm, z1], [x0, hm, z0], 0, 0, hm, hm);
    q([x0, hm, z0], [x1, hm, z1], [x1, TOP, z1], [x0, TOP, z0], hm, hm, 0, 0);
  }
  // two piers of bare tooled gold: a chamfered buttress with a flared foot and a capital, and a cutwater prow upstream
  const plan = [[-6, 0], [-6, 3.6], [-3.1, 6.8], [3.1, 6.8], [6, 3.6], [6, 0]];
  const rings = [[0, 1.85, 2.3], [7, 1.7, 2.05], [26, 1.32, 1.5], [70, 1.08, 1.12], [150, 1.0, 1.0], [234, 1.0, 1.0], [238, 1.13, 1.2], [247, 1.13, 1.2], [249.4, 1.0, 1.0], [252.8, 1.0, 1.0]];
  for (const sx of [-1, 1]) {
    const cx = sx * PIER_X;
    const P = (i, k) => [cx + plan[i][0] * rings[k][1], rings[k][0], 0.02 + plan[i][1] * rings[k][2]];
    for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < plan.length - 1; i++) {
      const a = P(i, k), b = P(i + 1, k), c = P(i + 1, k + 1), d = P(i, k + 1);
      const mid = (u, v2) => [(u[0] + v2[0]) / 2, (u[1] + v2[1]) / 2, (u[2] + v2[2]) / 2];
      const ab = mid(a, b), dc = mid(d, c), hw = Math.hypot(b[0] - a[0], b[2] - a[2]) / 2;
      const band = (k === 5 || k === 7) ? 0 : hw;       // the capital's two short courses read as umber bands
      q(a, ab, dc, d, 0, band, band, 0, 1); q(ab, b, c, dc, band, 0, 0, band, 1);
    }
    const yT = 252.8, tip = [cx, yT, -46], cen = [cx, yT, 1.5];
    const top = [...plan.map((p) => [cx + p[0], yT, 0.02 + p[1]]), tip];
    for (let i = 0; i < top.length; i++) { const a = top[i], b = top[(i + 1) % top.length]; q(cen, a, b, cen, 5.5, 0, 0, 5.5, 1, up); }
    for (const s2 of [-1, 1]) {                           // prow walls rising 2.8 m out of the river bed
      const a = [cx + s2 * 6, TOP, 0.02], t0 = [cx, TOP, -46];
      const ym = TOP + 1.4;
      q(a, t0, [t0[0], ym, t0[2]], [a[0], ym, a[2]], 0.4, 0.4, 1.4, 1.4, 1);
      q([a[0], ym, a[2]], [t0[0], ym, t0[2]], [t0[0], yT, t0[2]], [a[0], yT, a[2]], 1.4, 1.4, 0, 0, 1);
    }
  }
  return S.geometry();
}

const SCHEMES = [
  { name: 'rose-cobalt-malachite', a: null, b: null, c: '#2F8F5B' },
  { name: 'orange-turquoise-ivory', a: '#E2752B', b: '#1F8F96', c: '#F2E8CF' },
  { name: 'violet-leafgreen', a: '#7A4BB0', b: '#3E2A78', c: '#5FA83A' },
];
const METALS = [
  // calm: [a leaf's own hash, the same inside the sheen, the drifts' span, 1 = broad drifts]; sheen: [where it starts (cosine), its lift, the base tone]
  { name: 'yellow-gold', steps: null, bole: '#8E2F1F', hi: [5.0, 4.0, 2.1], calm: [0.42, 0.5, 0.36, 1], sheen: [0.7, 0.4, 0.32], dull: 0.15 },
  // silver leaf with a champagne light: neutral pewter to warm near-white (no blue), grey-green bole wide in the worn edges, the blaze a cold blue-white on one leaf
  { name: 'white-gold', steps: ['#70757A', '#9CA2A5', '#C3C6C4', '#E3DDC8', '#FAF3DC', '#B6B9B6'], bole: '#4A6F5C', hi: [1.0, 1.9, 3.4], hiCos: 0.9997, boleW: 2.3, seamW: 0.16, calm: [0.42, 0.5, 0.36, 1], sheen: [0.7, 0.38, 0.32], dull: 0.15 },
  // burnished black: black on black, a dim hairline seam, and gold only where leaves near the mirror direction catch it in two steps
  { name: 'black-lacquer', steps: ['#0C0B0A', '#131110', '#1B1713', '#7E5F1A', '#D8A837', '#151310'], bole: '#5E4716', hi: [5.0, 4.0, 2.1], sheen: [0.55, 0.5, -0.12], seamW: 0.07, seamCol: '#4A3912', pierLift: 3 },
];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('pattern-falls') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : BRIEF_PALETTE;
  // per-seed variety (every draw happens here, in a fixed order, before any yield)
  const rMetal = rng(), rScheme = rng(), rMarch = rng(), rSwap = rng(), rRare = rng();
  const metalI = opts.metal ?? VIEW.metal ?? (rMetal < 0.72 ? 0 : rMetal < 0.86 ? 1 : 2);
  const schemeI = opts.scheme ?? VIEW.scheme ?? (rScheme < 0.56 ? 0 : rScheme < 0.8 ? 1 : 2);
  const marchI = opts.march ?? VIEW.march ?? (rMarch < 0.5 ? 0 : rMarch < 0.78 ? 1 : 2);
  const swap = opts.swapPeaks ?? VIEW.swapPeaks ?? (rSwap < 0.3);            // dark robe on the right instead of the left
  const metal = METALS[metalI], scheme = SCHEMES[schemeI];
  const gd = [pal[2], '#B8892A', pal[0], '#E6C463', pal[1], '#C99C32'];
  const st = metal.steps || gd, mi = metalI === 1 ? st : gd;       // pattern inks: white gold follows the metal, lacquer keeps gold
  const inkHex = [mi[2], mi[4], mi[0], pal[3], pal[4], scheme.a || pal[5], scheme.b || pal[6], '#9FA3A6', scheme.c, '#3A2410', metal.bole, '#131A2E', mi[5], mi[1]];
  const steps = st.map((h) => inkOf(h));
  const inks = inkHex.map((h) => inkOf(h));
  const motifGold = inks[0];

  const U = {                                              // uniforms shared by every material of the piece
    uInk: { value: inks }, uTime: { value: 0 }, uGold: { value: 0 }, uCamL: { value: new THREE.Vector3(0, 258, -300) },
    uViewH: { value: 720 }, uTanHalf: { value: Math.tan(31 * Math.PI / 180) },
  };
  const window0 = new THREE.Vector3(...(opts.window ?? [0.879, 0.242, 0.41])).normalize();
  const leafU = (mode) => ({
    ...U, uMode: { value: mode }, uLeaf: { value: 12 }, uHiCos: { value: opts.highlightCos ?? metal.hiCos ?? 0.9993 }, uWalk: { value: opts.walk ?? 1.1 }, uSheen: { value: new THREE.Vector3(...(opts.sheen ?? metal.sheen ?? [0.3, 0.42, 0.08])) }, uCalm: { value: new THREE.Vector4(...(opts.calm ?? metal.calm ?? [0.8, 0.7, 0.26, 0])) }, uDull: { value: metal.dull ?? 0 },
    uSeamW: { value: metal.seamW ?? 0.25 }, uSeamCol: { value: inkOf(metal.seamCol ?? '#B8892A') }, uBoleW: { value: metal.boleW ?? 1 }, uPierLift: { value: metal.pierLift ?? 0 },
    uStep: { value: steps }, uSeamInk: { value: metalI === 2 ? 1 : 0 }, uTool: { value: metalI === 2 ? inks[2] : steps[0].clone().multiplyScalar(0.8) },
    uSd: { value: swap ? 1 : -1 }, uWindow: { value: window0 }, uWindowSky: { value: new THREE.Vector3(...(opts.windowSky ?? [-0.35, 0.3, 0.89])).normalize() }, uHi: { value: new THREE.Vector3(...metal.hi) },
  });
  const group = new THREE.Group(); group.name = 'where-the-pattern-falls:hero';
  const leafMat = new THREE.ShaderMaterial({ uniforms: leafU(0), vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide, fog: false });
  const leaf = new THREE.Mesh(buildLeafGeometry(), leafMat); leaf.frustumCulled = false; group.add(leaf);
  await ctx.yield();
  // sky: the same sheet. Follows the camera, drawn before everything else of the piece and without depth.
  const domeMat = new THREE.ShaderMaterial({ uniforms: leafU(2), vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
  domeMat.uniforms.uWindow = leafMat.uniforms.uWindow; domeMat.uniforms.uWindowSky.value = leafMat.uniforms.uWindowSky.value;
  const domeGeo = new THREE.SphereGeometry(420, 32, 20);
  domeGeo.setAttribute('aE', new THREE.Float32BufferAttribute(new Float32Array(domeGeo.attributes.position.count * 2).fill(0).map((_, i) => (i % 2 ? 0 : 1e3)), 2));
  const dome = new THREE.Mesh(domeGeo, domeMat); dome.frustumCulled = false; dome.renderOrder = -0.5; dome.visible = opts.sky !== false; group.add(dome);
  await ctx.yield();

  // ---- under the tiles: river bed and plunge pool (one material, two quads, discard outside their outlines) ----
  U.uRate = { value: new THREE.Vector3((opts.riverSpeed ?? 7) / 421.6, (opts.fallSpeed ?? 22) / 250, opts.meadowRate ?? 0.009) };
  {
    const S = quadSoup(), up = [0, 1, 0];
    S.quad([-100, TOP + 0.4, -446], [-100, TOP + 0.4, 0], [100, TOP + 0.4, 0], [100, TOP + 0.4, -446], 0, 0, 0, 0, 0, up);
    S.quad([-280, 0.4, 0.05], [-280, 0.4, 706], [280, 0.4, 706], [280, 0.4, 0.05], 0, 0, 0, 0, 0, up);
    const under = new THREE.Mesh(S.geometry(), new THREE.ShaderMaterial({ uniforms: U, vertexShader: UNDER_VERT, fragmentShader: UNDER_FRAG, side: THREE.DoubleSide, fog: false }));
    under.frustumCulled = false; group.add(under);
  }
  await ctx.yield();

  // ---- the tiles ----
  const tr = rng.fork ? rng.fork('tiles') : rng;
  const NC = 54, NR = 191, FC = 27, FL = 3, FR = 54;
  const nRiver = NC * NR, nFall = 3 * FC * FL * FR, nMeadow = Math.round((opts.meadowCount ?? 24000) * detail);
  const nT = nRiver + nFall + nMeadow;
  const aA = new Float32Array(nT * 4), aB = new Float32Array(nT * 4);
  let ti = 0;
  const inkPick = (i, j) => (tr() < 0.12 ? Math.floor(tr() * 3) : ((i + Math.floor(j / 3)) % 3 + 3) % 3);
  const marchOff = (u) => { const l = ((u + 1) * 1.5) % 1; return marchI === 1 ? Math.abs(l - 0.5) * 0.02 : marchI === 2 ? (u + 1) * 0.016 : 0; };
  for (let r = 0; r < NR; r++) {
    for (let c = 0; c < NC; c++, ti++) {
      const u = ((c + 0.5) / NC) * 2 - 1;
      aA.set([0, u, r / NR + marchOff(u), tr()], ti * 4);
      aB.set([inkPick(r, c), tr(), 0.6 + 0.9 * Math.pow(tr(), 1.6), 0], ti * 4);
    }
    if (r % 24 === 23) await ctx.yield();
  }
  for (let cu = 0; cu < 3; cu++) for (let c = 0; c < FC; c++) {
    for (let l = 0; l < FL; l++) for (let r = 0; r < FR; r++, ti++) {
      const lx = (c + 0.5) / FC, x = (cu - 1) * 64 + (lx - 0.5) * 50 + (tr() - 0.5) * 0.7;
      const u = (cu + lx) / 1.5 - 1;
      aA.set([1, x, (r + l / FL + (c % 2) * 0.5 / FL) / FR + marchOff(u) * 1.7, (tr() + ((r + l) % 2)) * 0.5], ti * 4);
      aB.set([inkPick(r + l, c), tr(), 0.6 + 0.9 * Math.pow(tr(), 1.6), 1.2 + l * 0.9], ti * 4);
    }
    if (c % 9 === 8) await ctx.yield();
  }
  for (let i = 0; i < nMeadow; i++, ti++) {
    aA.set([2, tr() * 2 - 1, tr(), tr()], ti * 4);
    aB.set([Math.floor(tr() * 3), tr(), 0.6 + 0.9 * Math.pow(tr(), 1.6), 0], ti * 4);
    if (i % 4000 === 3999) await ctx.yield();
  }
  const tileGeo = new THREE.InstancedBufferGeometry();
  tileGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  tileGeo.setIndex([0, 1, 2, 0, 2, 3]);
  tileGeo.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
  tileGeo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
  tileGeo.instanceCount = nT;
  U.uMeadowLen = { value: opts.meadowLength ?? 700 }; U.uGoldInk = { value: motifGold };
  const tiles = new THREE.Mesh(tileGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: TILE_VERT, fragmentShader: TILE_FRAG, side: THREE.DoubleSide, fog: false }));
  tiles.frustumCulled = false; group.add(tiles);
  await ctx.yield();

  // ---- the mantle-peaks: six overlapping robes each, every robe one flat pattern cut to its outline ----
  const pr = rng.fork ? rng.fork('peaks') : rng;
  const SEG_A = 44, SEG_V = 12;
  const peakParts = { pos: [], cm: [], pat: [], hemP: [], hem: [], idx: [] };
  const peakInfo = [];
  const hemLine = (hp, az) => { const sc = Math.abs(Math.sin(az * hp[3] * 0.5 + hp[2] * 3)); return hp[0] + hp[1] * Math.sin(az + hp[2]) + 0.35 * hp[1] * Math.sin(az * 2 - hp[2] * 1.7) - 11 * sc * sc; };
  for (const sx of [-1, 1]) {
    const dark = (sx < 0) !== swap;
    const pp = (dark ? opts.darkPeak : opts.brightPeak) || [sx * PEAK_X, PEAK_Z], PX = Math.abs(pp[0]), PZ = pp[1];
    const ph = [pr() * TAU, pr() * TAU, pr() * TAU, pr() * TAU], pw = 1.0 + pr() * 0.22, Ht = PEAK_H;
    // the axis bends inward as it climbs (crowns end about half as far apart as the hems) and hooks over at the top, off to one side
    const leanM = (opts.lean ?? 124) * (dark ? 0.84 : 1.08), crownZ = 14 * Math.sin(ph[2] * 1.7);
    const axis = (h) => { const t = h / Ht, hk = Math.max(0, (t - 0.82) / 0.18); return [sx * PX - sx * (leanM * (0.5 * t + 0.5 * t * t) + 12 * hk * hk) + Math.sin(h / 80 + ph[0]) * 7 * t, PZ + Math.cos(h / 65 + ph[1]) * 8 * t + crownZ * hk * hk]; };
    // a skirt that spreads at the hem, a slimmer waist, and a blunt crown (a stub that closes in a dome over the last 20 m)
    const rad = (h, az) => PEAK_R * (0.66 * Math.pow(Math.max(0, 1 - h / Ht), pw) + 0.34 * Math.pow(Math.max(0, 1 - h / Ht), 6) + 0.1 * Math.min(1, h / 60)) * (1 + 0.15 * Math.sin(2 * az + ph[2] + h * 0.006) + 0.09 * Math.sin(3 * az + ph[3] - h * 0.011)) / 1.12;
    const capK = (h) => { const c = Math.max(0, (h / Ht - 0.92) / 0.08); return Math.sqrt(Math.max(0, 1 - c * c)); };
    const FLARE = [0, 17, 15, 12, 7, 6], BULGE = [0, 8, 7, 5, 3, 2];            // lower hems flare wider; each robe hangs out further on one side
    const motifs = pr.shuffle ? pr.shuffle(dark ? [0, 1, 2, 6, 1, 0] : [5, 4, 3, 7, 5, 4]) : (dark ? [0, 1, 2, 6, 1, 0] : [5, 4, 3, 7, 5, 4]);
    const inkSets = dark ? null : [[5, 0, 6], [6, 0, 4], [8, 0, 5], [0, 5, 6], [6, 8, 0], [5, 8, 4]];
    const plainK = Math.floor(pr() * 6);
    // tiers of unequal height: five gaps between 0.45 and 2.3 shares of the height
    const gaps = [0, 1, 2, 3, 4].map(() => { const g = (pr.range(-13, 13) + 13) / 26; return 0.45 + 1.85 * g * g; }), gSum = gaps.reduce((a2, b2) => a2 + b2, 0);
    const h0 = [0]; for (let k = 1; k < 6; k++) h0.push(h0[k - 1] + (k === 1 ? 22 : 0) + 212 * gaps[k - 1] / gSum);
    for (let k = 0; k < 6; k++) {
      const hp = k ? [h0[k], pr.range(17, 37) * (k > 3 ? 0.55 : 1), pr() * TAU, 5 + Math.floor(pr() * 5) - Math.floor(k * 0.6)] : [-100, 0, 0, 0];   // the hem sags up to 50 m lower on one side
      const lo = k ? Math.max(0, h0[k] - 1.35 * hp[1] - 14) : 0, hi = k < 5 ? Math.min(Ht, h0[k + 1] + 62) : Ht;
      const hm = (Math.max(lo, h0[k]) + hi) / 2, ax = axis(hm), m = (dark ? pr.range(7, 11) : pr.range(9, 14)) * (opts.motifScale ?? 1);
      const C = [ax[0] + pr.range(-8, 8), hm + pr.range(-6, 6), ax[1] + pr.range(-8, 8)];
      const set = dark ? ({ 0: [3, 7, 4], 1: [3, 7, 0], 2: [3, 7, 4], 6: [3, 4, 7] })[motifs[k]] : inkSets[k], fold = [8 + Math.floor(pr() * 7), pr() * TAU], base = peakParts.pos.length / 3;
      for (let j = 0; j <= SEG_V; j++) {
        const tv = j / SEG_V, h = lo + (hi - lo) * (k === 5 ? 1 - (1 - tv) * (1 - tv) * 0.6 - 0.4 * (1 - tv) : tv), a0 = axis(h);
        for (let i = 0; i <= SEG_A; i++) {
          const az = (i / SEG_A) * TAU, above = h - hemLine(hp, az);
          let r = rad(h, az) + (k ? 1.0 + 1.5 * k + FLARE[k] * Math.exp(-Math.max(above, 0) / 20) + BULGE[k] * (1 + Math.cos(az - fold[1])) * Math.exp(-Math.max(above, 0) / 70)
            + 2.4 * Math.sin(az * fold[0] + fold[1]) * Math.exp(-Math.max(above, 0) / 38) : 0);
          r = Math.min(r, 116 + 0.6 * h) * capK(h);                     // the flight's corridor at the hems, and the crown's dome
          peakParts.pos.push(a0[0] + Math.cos(az) * r, h, a0[1] + Math.sin(az) * r);
          peakParts.cm.push(C[0], C[1], C[2], m); peakParts.pat.push(motifs[k] + (dark && k !== plainK ? 8 : 0), set[0], set[1], set[2]);
          peakParts.hemP.push(hp[0], hp[1], hp[2], hp[3]); peakParts.hem.push(h, az);
        }
      }
      for (let j = 0; j < SEG_V; j++) for (let i = 0; i < SEG_A; i++) {
        const a = base + j * (SEG_A + 1) + i, b = a + 1, c = a + SEG_A + 1, d = c + 1;
        peakParts.idx.push(a, c, b, b, c, d);
      }
      await ctx.yield();
    }
    const top = axis(Ht);
    peakInfo.push({ dark, base: new THREE.Vector3(sx * PX, 0, PZ), crown: new THREE.Vector3(top[0], Ht, top[1]) });
  }
  const peakGeo = new THREE.BufferGeometry();
  peakGeo.setAttribute('position', new THREE.Float32BufferAttribute(peakParts.pos, 3));
  peakGeo.setAttribute('aCM', new THREE.Float32BufferAttribute(peakParts.cm, 4));
  peakGeo.setAttribute('aPat', new THREE.Float32BufferAttribute(peakParts.pat, 4));
  peakGeo.setAttribute('aHemP', new THREE.Float32BufferAttribute(peakParts.hemP, 4));
  peakGeo.setAttribute('aHem', new THREE.Float32BufferAttribute(peakParts.hem, 2));
  { // make sure the robes face outwards whatever the winding came out as
    const p = peakParts.pos, i0 = peakParts.idx[0], i1 = peakParts.idx[1], i2 = peakParts.idx[2];
    const e1 = [p[i1 * 3] - p[i0 * 3], p[i1 * 3 + 1] - p[i0 * 3 + 1], p[i1 * 3 + 2] - p[i0 * 3 + 2]], e2 = [p[i2 * 3] - p[i0 * 3], p[i2 * 3 + 1] - p[i0 * 3 + 1], p[i2 * 3 + 2] - p[i0 * 3 + 2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], nz = e1[0] * e2[1] - e1[1] * e2[0];
    if (nx * (p[i0 * 3] - peakInfo[0].base.x) + nz * (p[i0 * 3 + 2] - peakInfo[0].base.z) < 0) for (let i = 0; i < peakParts.idx.length; i += 3) { const t = peakParts.idx[i]; peakParts.idx[i] = peakParts.idx[i + 1]; peakParts.idx[i + 1] = t; }
  }
  peakGeo.setIndex(peakParts.idx); peakGeo.computeVertexNormals();
  await ctx.yield();
  const makePatternMaterial = (hull) => new THREE.ShaderMaterial({
    uniforms: { ...U, uHull: { value: hull ? 1 : 0 } }, vertexShader: PAT_VERT, fragmentShader: PAT_FRAG,
    side: hull ? THREE.BackSide : THREE.FrontSide, fog: false });
  const peakMat = makePatternMaterial(false); peakMat.side = THREE.DoubleSide;      // under a flared hem the lining wears the pattern, not the hull's umber
  const peaks = new THREE.Mesh(peakGeo, peakMat), peaksHull = new THREE.Mesh(peakGeo, makePatternMaterial(true));
  peaks.frustumCulled = false; peaksHull.frustumCulled = false; group.add(peaks, peaksHull);
  await ctx.yield();

  // ---- the foot of the falls: a spray of leaping gold dots (additive, no depth write) ----
  {
    const sr = rng.fork ? rng.fork('spray') : rng, nS = Math.round((opts.sprayCount ?? 1500) * detail);
    const sA = new Float32Array(nS * 4), sB = new Float32Array(nS * 4);
    for (let i = 0; i < nS; i++) {
      const cu = Math.floor(sr() * 3), x = (cu - 1) * 64 + (sr() - 0.5) * 54;
      sA.set([x, sr(), sr(), 0.16 + 0.3 * sr() * sr()], i * 4);                     // x, phase, seed, radius
      sB.set([(sr() - 0.5) * 9, 9 + 13 * sr(), 2 + 13 * sr() * sr(), 0.35 + 0.4 * sr()], i * 4);   // velocity xyz, cycles per second
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(sA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(sB, 4));
    g.instanceCount = nS;
    const sprayMat = new THREE.ShaderMaterial({
      uniforms: U, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec4 aA; attribute vec4 aB;
        uniform float uTime, uViewH, uTanHalf; uniform vec3 uCamL;
        varying vec2 vQ; varying float vK;
        void main(){
          float t = fract(aA.y + uTime * aB.w), T = aB.y / 9.81 * 2.;          // one leap lasts until it lands again
          float tt = t * T;
          vec3 C = vec3(aA.x + aB.x * tt, .9 + aB.y * tt - 4.905 * tt * tt, 1.5 + aB.z * tt);
          vec3 tc = uCamL - C; float d = max(length(tc), .5); tc /= d;
          vec3 r = normalize(vec3(tc.z, 0., -tc.x) + vec3(1e-4, 0., 0.)), u = cross(tc, r);
          float pxM = d * 2. * uTanHalf / max(uViewH, 1.);
          float rad = max(aA.w * (1. - t * t), 0.) + pxM * .75;
          // (round 4d) a dot smaller than the pixel it is drawn on gives that pixel its true share of light: the square of the
          // ratio (it was the ratio itself, five times too much at 300 m, so the foot seen from across the pool was a pale veil
          // that lifted the white discs behind it over the bloom threshold). A dot a pixel across or more is as it was.
          float fill = min(1., aA.w * (1. - t * t) / max(pxM * .75, 1e-4));
          vQ = position.xy; vK = step(.02, 1. - t) * fill * fill;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(C + (r * position.x + u * position.y) * rad, 1.);
        }`,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uInk[14];
        varying vec2 vQ; varying float vK;
        void main(){
          float r = length(clamp(vQ, -1., 1.)); if (r > 1.) discard;     // (the across coordinate is held to the quad's own range before it is squared)
          // (round 4b) a gold dot with a paler heart, flat. Added to the dark pool it lands on mid gold (it was 55 percent of
          // that, an ochre that read as brown); either part adds the same light, 0.40, so over a pale leaf it stays under the bloom
          vec3 col = r < .55 ? uInk[0] * .5 + uInk[1] * .25 : uInk[0] * .9;
          gl_FragColor = vec4(col * clamp(vK, 0., 1.), 1.);
        }` });
    const spray = new THREE.Mesh(g, sprayMat); spray.frustumCulled = false; spray.renderOrder = 2; group.add(spray);
  }
  await ctx.yield();

  // ---- anchors (local space; see the header) ----
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const darkP = peakInfo.find((p) => p.dark), brightP = peakInfo.find((p) => !p.dark), sd = Math.sign(darkP.base.x) || -1;
  const gaze = V(sd * 0.5, 0, 0.866);                                   // the last straight: 30 degrees off downstream, toward the dark robe
  const seat = V(darkP.base.x - sd * 135, 9.5, darkP.base.z - 65);      // the dark robe stands about 70 m behind the ring along that gaze
  const approach = seat.clone().addScaledVector(gaze, -120);
  const anchors = {
    entry: { position: V(-23, 258, -300), facing: V(0, 0, 1) },
    flyThrough: [
      V(-23, 258, -300), V(-30, 258, -215), V(-70, 258, -140), V(-118, 258, -75), V(-140, 257.5, -30), V(-132, 257, 0),
      V(-108, 256, 10), V(-85, 249, 11.5), V(-40, 199, 12), V(10, 144, 12), V(60, 88, 12), V(98, 46, 13), V(120, 20, 24),
      V(118, 10, 52), V(80, 9, 88), V(30, 9, 108), approach.clone(), seat.clone(),
    ],
    portalSeat: { position: seat, facing: gaze.clone().negate(), travel: gaze.clone(), radius: 7 },
    approach,
    viewpoints: {
      entry: { from: V(-23, 258, -300), at: V(0, 262, 0) },
      brink: { from: V(-108, 256, 10), at: V(0, 215, 4) },
      curtain: { from: V(10, 144, 12), at: V(34, 126, 2) },
      pool: { from: V(80, 9, 88), at: V(0, 4, 60) },
      ring: { from: approach, at: seat },
    },
    curtainPoi: V(0, 125, 2),
    brink: { y: TOP, z: 0, halfWidth: 90 }, curtains: [-64, 0, 64].map((x) => ({ x, width: CURTAIN_W, z: 2 })), piers: [-PIER_X, PIER_X],
    pool: { center: V(0, 0.4, 55), halfWidth: 100, length: 110 },
    peaks: peakInfo, darkPeak: darkP, brightPeak: brightP,
    whorlHem: V(brightP.base.x - Math.sign(brightP.base.x) * 114, 8, brightP.base.z),
    window: window0,
  };

  // ---- the rare event, keyed to the flight: gold comes down the river, the curtain turns gold from the top, the meadow lands gold ----
  const rare = opts.rare ?? VIEW.rare ?? (rRare < 0.08);
  const ramp = (u, a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
  const setRare = (g) => { U.uGold.value = Math.min(3.05, Math.max(0, g)); };     // 0 none, 0..1 down the river, 1..2 down the curtain, 2..3 down the meadow
  const setProgress = (u) => { if (rare) setRare(0.3 + 0.7 * ramp(u, 0, 0.22) + ramp(u, 0.26, 0.56) + 1.05 * ramp(u, 0.56, 0.8)); };

  if (VIEW.gold) setRare(VIEW.gold);
  const camW = new THREE.Vector3(), inv = new THREE.Matrix4(), size = new THREE.Vector2();
  const hero = {
    object: group, radius: VIEW.radius, height: VIEW.height, center: new THREE.Vector3(...VIEW.center),
    anchors, ground: false, groundY: 0,
    bounds: new THREE.Box3(V(-760, 0, -700), V(760, 300, 860)),
    uniforms: U, leafUniforms: leafMat.uniforms, skyUniforms: domeMat.uniforms,
    variant: { metal: metal.name, scheme: scheme.name, march: ['ranks', 'chevrons', 'echelon'][marchI], swap, rare },
    makeLeafMaterial: (sky) => (sky ? domeMat : leafMat), makePatternMaterial, inkOf, inks, sky: dome,
    setProgress, setRare,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) {
        group.updateWorldMatrix(true, false);
        camW.setFromMatrixPosition(camera.matrixWorld);
        U.uCamL.value.copy(camW).applyMatrix4(inv.copy(group.matrixWorld).invert());
        dome.position.copy(U.uCamL.value);
        if (camera.isPerspectiveCamera) U.uTanHalf.value = Math.tan(camera.fov * Math.PI / 360) / (camera.zoom || 1);
      }
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uViewH.value = size.y; }
    },
    dispose() {},
  };
  return hero;
}
// Framing for the set-piece viewer: an orbit over the pool and meadow, between the falls and the peaks, that never goes
// behind the cliff. The world flies its own path; the true extents are in hero.bounds.
const VIEW = { radius: 107, height: 100, center: [0, 100, 200] };
