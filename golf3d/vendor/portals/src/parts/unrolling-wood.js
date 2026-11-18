// The Unrolling Wood: hero set piece, THE KING CROZIER, and the quilling style kit for the whole world.
//
// WHAT IT IS. One bottle-green paper strip 9 m wide, wound ~40 turns into a 70 m coil tilted 30 degrees on a
// telescoped bark cone, ~200 lime leaflet coils glued along its top edge. Three acts keyed to the world's u:
//   tight (u < springAt[0])  ->  the outer turns spring to 124 m with a wobble, lanes 14 m wide, the heart
//   (38 m) stays wound and turns like a balance wheel  ->  the heart lets go (unrollAt): the strip straightens
//   from the anchor into a frond 205 m long, the roll runs off down it shedding turns, leaflets spring open in
//   pairs, and a loose eccentric ring on its own slim cone waits at the tip for the portal.
// Local frame: origin at the trunk's base, +Y up, +Z toward the arriving eye (low lip at +Z, 13 m; high lip at
// -Z, 75 m). The lane runs clockwise seen from above: +Z lip, -X side, -Z lip, +X side; the frond leaves the
// +X side, swings round under the low lip and runs off toward -X, a little +Z, rising 7.6 degrees.
// Size: radius ~75 m sprung (frond reaches x = -185), height ~80 m. Cost: ~110k triangles, 9 draw calls
// (11 with the viewer card), build ~125 ms, no lights, no textures. update() costs ~0.3 ms of CPU: the king's
// 2,561 nodes are recomputed and uploaded every frame (one 20 kB buffer); nothing is created or recompiled.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera), setProgress(u),
//   dispose, uniforms, material, papers }
//   opts.palette   brief order [lime, leaf, bottle, bark, stream, scarlet, cream]
//   opts.detail    0.6..1 thins leaflets and raindrops (never the king)
//   opts.card      default true = viewer dressing (cream ground disc and sky ball, URL aids ku/kview). THE WORLD
//                  PASSES card: false and lays its own card.
//   opts.uniforms  a makeQuillUniforms() set to share with the world (else the hero makes one: hero.uniforms)
//   opts.sun       THREE.Vector3 toward the sun in WORLD space (default behind the left shoulder, 25 degrees up)
//   opts.springAt [0.10, 0.22], opts.laneAt [0.255, 0.665], opts.unrollAt [0.665, 0.9]   the acts, in world u
//   setProgress(u): call every frame with the world's u. Until it is called the piece plays its acts on a
//   40 s loop of time (viewer only). All acts are pure functions of u; time only drives breath and raindrops.
//
// ANCHORS (local space; apply the hero's matrix):
//   hub                 centre of the coil and of the wound heart (use as the poi)
//   approach, laneEntry points leading in to the strip's cut end at the low lip
//   lane[25]            centre line of the lane between the first and second turns, three quarters of a turn,
//                       mid-height of the walls, 7 m from each (breath moves the walls about +-1 m)
//   frond[]             from the lane's end over the inner wall and along the frond 3 m above its top edge
//                       (3 m is the brief's figure; the leaflet tips stand 6.5 m to either side)
//   exitStraightFrom    start of the last 60 m, dead straight to the seat, rising ~13 degrees
//   portalSeat          { position, facing (unit, direction of travel), up, radius 7 }: centre of the exit ring
//   flyThrough          approach, laneEntry, lane, frond, seat, a point 12 m beyond: one safe ordered line
//   lowLip, highLip, discNormal, discUphill, frondTip, hoopFoot, wallCloseUp, viewFromStream, timing
// Expects around it: cream card at y = 0 for 250 m about the origin (the stain ribbon lies at y = 0.06), open
// air west of the trunk for the frond (it passes 17 to 40 m up), nothing within 12 m of flyThrough.
//
// THE STYLE, AND WHAT TO SHADE THE WORLD WITH (post: flat 1, no bloom, grade neutral; no inverse tone map):
//   makePapers(palette)        the nine papers, card and stain as linear THREE.Colors (under flat they show as hex)
//   makeQuillUniforms()        uTime, uU, uSun, uCream, uStain, uPx, uTint: one set per world, kept by hero.update
//   QUILL_VERT_GLSL            quillTint (three distance tints, eased over 24 m so nothing pops), quillThickP
//                              (paper never thinner than 2.2 px; windings under ~3 px close into a flat lid in
//                              the average tint, so no moire), quillSpring (leap, overshoot, three wobbles)
//   QUILL_FRAG_GLSL            quillShade(): flat paper; top edge two steps lighter (the style's only line);
//                              glow-through one step lighter and warmer when the sun is behind the face;
//                              laid lines, chain lines, tooth, ragged edge burr and glued overlaps, all
//                              fwidth-filtered and gone by 80 m. Needs varyings vPaper, vWN, vWP, vSurf, vSolid.
//   quillGeometry(segs)        a strip as a chain of thin boxes (6 triangles a segment; capOnly for far coils)
//   quillMaterial(Q)           the one program for every instanced strip (use hero.material to share it)
//   quillBatch(geo, mat, n)    InstancedMesh + set(i, matrix, {...}): the seven shapes from per-instance values:
//                              peg / loose coil / teardrop (tear) / marquise / cone or dome (lift) with
//                              kind 'coil'; 's', 'v' scrolls and 'arc' (a stem with a coil at its tip) with
//                              stem. open + trigger + springU spring a coil when uU passes its own u.
//   beadMesh(Q, n)             glue beads: pale dot, one white fleck
//   stainMaterial(Q)           the shadow: lilac-grey on the card with MIN blending (never piles up); feed it
//                              flat geometry with attribute aSoft (0 at the rim, 1 inside)
// Added for the world: makePapers takes optional palette entries 7 and 8 (spring, fern); a negative `lift` makes a
// dome instead of a cone (the coil-dome hills); uFrost (0..1) turns every top edge mist white (first frost); the
// leaflets on the lane's walls are 2.4 m coils on 40 segments; the URL aids are read only when card !== false.
// Second pass (for the avenue and the views from above): the frond STANDS UPRIGHT as it straightens (twistAt: its
// width turns from the disc's normal to world up between 40 and 95 m from the anchor; node slot 7 carries the
// twist; leaflets, beads, drops, anchors and the exit ring follow it); the frond's leaflet pairs are slimmer
// teardrops (1.7 m coils, 1.05 m strip, 6.5 m reach, 4.9 m apart) that flutter on time; the roll runs 20 to 45 m
// ahead of the eye (exponent 1.12) and leaflets open 12 m behind it; hero.rollAt(u, out) gives the roll's centre
// for a poi; the heart swings from 30% of the spring on; in first frost glow-through is a cool tint; beadMesh
// takes a detail argument.
// Polish round (the roadside winds shut; only the king springs): a negative springU makes a coil stand open and WIND
// SHUT to `open` when uU passes its trigger (quillWind), `shrink` draws a frond's stem or a leaflet in as it winds, and
// once shut it peeps out and rolls back on time. The running roll is the seventh shape, a peg pushed out into a low
// bouncing cone (ROLL_CONE) with looser turns, so its turns' light edges show from any height of eye; it runs at the
// eye's pace (ROLL_K 1). The frond's pairs stand up in a shallow V and are hidden while wound into the roll; the lane's
// leaflets are tipped back toward the oncoming eye and wind back to pegs as the coil unrolls; beads are larger. The top
// of every face carries the edge line at 2.3 px or more (the flat cap is sub-pixel to a low or far eye). The distance
// tints are 0.42 and 0.64 toward cream. The king ticks a little while still wound tight. The hoop is 12.6 m.
// Third pass (the avenue, the ring, round coils, the far wood): the frond TAPERS from 9 m to 4.2 m at its tip (its top
// edge keeps its line, the foot rises; KING_VERT works the width out from the paper coordinate), and the roll is as wide
// as the strip where it runs, shrinks faster (rollR), is nearly a flat peg once it runs (ROLL_CONE_RUN), runs 40 m ahead
// (ROLL_K 1.15), carries a heavier edge (0.36 m) and LEANS BACK half a radian against its run (ROLL_TIP:
// uTip / uTipAt / uTipAxis turn everything still wound about the line from the frond's top edge through the roll's
// middle), so its wound top shows as nested loops. The frond's pairs are 5.2 m apart, lie flatter, are sized like a
// fern's (small at the base, full in the middle) and open slowly, so the pair at the roll is caught half wound.
// quillGeometry takes a third argument, bias: segments gathered toward the outer turn (the lane's leaflets and the
// pairs use it and are round). The exit hoop's innermost turn is 7.63 m at every moment (nothing lies across the 7 m
// opening); it loosens by its outer turns only, on the CPU. Distance tints are 0.27 and 0.47 toward cream; first
// frost's white edges are held to 40% beyond 150 m; where windings close into a lid the lid is one flat tint (no
// line, no burr); the glue bead is a step darker than the card and its fleck is a glint on the side that is seen.
// Polish round 3: the wound heart's lid closes in COLOUR before its caps close (KING_VERT: by 4 px a turn the line and the
// gap are one flat tint), so no rows of teeth; scarlet paper keeps its own edge in first frost, and so does any strip
// set with noFrost: true (the exit hoop, now 0.42 m thick: loops of bottle paper from afar); a scroll's pitch follows its
// tip coil (the world's cloud scrolls); the raindrops on the king's edge are small round pegs; the lane's beads are smaller.
// Polish round 5/7/7b: the lane's leaflets and the pairs still wound on the turns are let go BY u (see buildLeaflets): each as
// the route's own bearing about the hub at the present u (tabled once from the course the world hands over) comes within 24 m
// of it along its turn, never before the king has settled, so the wave keeps pace with us round the whole lane; nothing
// reads the camera's place. Wound, a leaflet is two turns of thicker paper half a metre apart, let go a
// teardrop of nearly three turns 5 m long that sweeps away from the course. quillTint mixes toward cream in gamma space
// (as pigments). An S scroll takes `sway` (one end rolls up as the other unrolls, on time). Both ends of every instanced
// strip are cut a little off square. The king's stain uses the sun in the hero's own frame. The roll dwindles to the curl of
// its cut end over the last tenth of the frond while the hoop goes from 3 turns to 3.75 and 13.3 m.
// Round 7b: the heart lets go over LET_GO_SECONDS (the design's own spring; the world turns the seconds into a share of the
// unrolling through its pace and hands it over with hero.setLetGo); the running roll has an attitude of its own (it leans
// back ROLL_TIP against its run, about its heading x its width, from the letting go on) and never turns to the eye.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- papers
export const DEFAULT_PALETTE = ['#B9D532', '#6DB33F', '#1E5B3C', '#7B4A2A', '#3E8FC6', '#E1262D', '#F6EED8'];
// The nine papers of the wood plus card and stain. opts.palette (brief order: lime, leaf, bottle, bark,
// stream, scarlet, cream) overrides seven of them; optional entries 7 and 8 give spring and fern; mist and the stain are fixed.
export function makePapers(palette = DEFAULT_PALETTE) {
  const p = (palette && palette.length >= 7) ? palette : DEFAULT_PALETTE;
  const hex = { lime: p[0], spring: p[7] || '#8FC741', leaf: p[1], fern: p[8] || '#3D8B40', bottle: p[2], bark: p[3], mist: '#FBFAF4',
    stream: p[4], scarlet: p[5], cream: p[6], stain: '#C9CCD8' };
  const out = { hex };
  for (const k in hex) out[k] = new THREE.Color(hex[k]);   // linear; under post.flat they show as the hex
  return out;
}

// ---------------------------------------------------------------- shared uniforms
// One set for the whole world, made per build (never module-level: the same world can be alive twice, once on
// screen and once behind its own portal). Pass it to every factory below; hero.update() keeps it current.
export function makeQuillUniforms() {
  return {
    uTime: { value: 0 },                                             // seconds, loops (breath, grain never moves)
    uU: { value: 0 },                                                // world progress u, drives per-instance triggers
    uSun: { value: new THREE.Vector3(-0.5, 0.42, 0.75).normalize() }, // WORLD direction toward the undrawn sun
    uCream: { value: new THREE.Color('#F6EED8') },                   // the card: ground, sky and the tint target
    uStain: { value: new THREE.Color('#C9CCD8') },                   // lilac-grey shadow stain
    uPx: { value: 0.0026 },                                          // radians per pixel (set in update from the camera)
    uTint: { value: new THREE.Vector2(150, 400) },                   // distances of the half and quarter tints
    uFrost: { value: 0 },                                            // 1 = first frost: every top edge mist white
  };
}

// ---------------------------------------------------------------- GLSL: the style
// Vertex side. quillTint: the paper in its distance tint (full, half at uTint.x, quarter at uTint.y; pass
// step < 0 to choose by distance of the coil's centre, or 0 / 1 / 2 to force). quillThick: paper thickness
// that never drops under 2.2 pixels (so a far coil is drawn as its light top edge) and never over maxT.
export const QUILL_VERT_GLSL = /* glsl */`
uniform float uTime, uU, uPx;
uniform vec3 uSun, uCream;
uniform vec2 uTint;
vec3 quillTint(vec3 paper, float stepSel, float dist) {
  float s = stepSel < 0. ? smoothstep(uTint.x - 12., uTint.x + 12., dist) + smoothstep(uTint.y - 20., uTint.y + 20., dist) : stepSel;
  float k = 0.27 * min(s, 1.) + 0.2 * clamp(s - 1., 0., 1.);   // the two paler tints, held full enough that the far wood keeps its greens
  // mixed as pigments on the screen (in gamma space): a far paper is the same paper printed paler, a far green still green and a
  // far bark still brown (a linear mix let the cream's light swamp the dark papers into grey)
  return pow(mix(pow(max(paper, vec3(1e-5)), vec3(0.4545)), pow(max(uCream, vec3(1e-5)), vec3(0.4545)), k), vec3(2.2));
}
float quillThick(float nominal, float maxT, float dist) {
  return min(max(nominal, 2.2 * uPx * dist), max(maxT, nominal));
}
// tight windings: when the gap between turns is under ~3 pixels the caps close up into one flat lid in the
// average tint (returned in solid 0..1), so a far peg is a flat disc and never a moire.
float quillThickP(float nominal, float pitch, float dist, out float solid) {
  float px = max(uPx * dist, 1e-5);
  solid = 1. - smoothstep(2.6, 4.0, pitch / px);
  float open = min(max(nominal, 2.2 * px), max(min(0.5 * pitch, 0.9), nominal));
  return mix(open, pitch * 1.2, solid);
}
// a tight coil let go: leaps, overshoots, settles in three wobbles. x = time since release / spring time.
float quillSpring(float x) {
  float t = max(x, 0.);
  return x <= 0. ? 0. : 1. - exp(-4.2 * t) * cos(9.2 * t);
}
// an open frond rolling itself shut: eases in, snaps the last of the way, one small rebound. x as above.
float quillWind(float x) {
  float t = clamp(x, 0., 1.), r = max(x - 1., 0.);
  return t * t * (3. - 2. * t) + 0.05 * exp(-5. * r) * sin(11. * r);
}
`;

// Fragment side. Every strip in the wood ends in quillShade(): flat paper, lighter top edge, glow-through
// when the sun is behind the face, laid grain and edge burr that fade with distance. No lighting model.
//   vPaper  face colour (already tinted for distance)        vWN  world normal of the face
//   vSurf   x = metres along the strip, y = metres up the strip's width, z = 1 on the top cap else 0,
//           w = the strip's width in metres                   vWP  world position
export const QUILL_FRAG_GLSL = /* glsl */`
uniform float uTime, uPx;
uniform vec3 uSun, uCream, uStain;
uniform float uFrost;
uniform vec2 uTint;
varying vec3 vPaper, vWN, vWP;
varying vec4 vSurf;
varying float vSolid;
vec3 quillLighter(vec3 c, float steps) { return pow(max(c, vec3(1e-4)), vec3(pow(0.787, steps))); }
vec3 quillGlow(vec3 c) { return mix(c, pow(max(c, vec3(1e-4)), vec3(0.6)) * mix(vec3(1.06, 1.0, 0.72), vec3(0.9, 1.0, 0.97), uFrost), mix(0.6, 0.35, uFrost)); }
float quillHash(float n) { return fract(sin(n * 91.345) * 47453.5453); }
vec3 quillShade() {
  vec3 toCam = cameraPosition - vWP;
  float dist = length(toCam);
  vec3 V = toCam / max(dist, 1e-4);
  float nl = length(vWN);
  vec3 N = nl > 1e-5 ? vWN / nl : vec3(0., 1., 0.);
  if (dot(N, V) < 0.) N = -N;                      // the side of the paper we are looking at
  // first frost whitens every top edge; far off it is held to less than half, so a far coil is still a green loop
  // vSolid carries two things: 0..1 how far the windings have closed into a lid, and +2 for a strip that keeps its own
  // paper's edge in first frost (the exit ring). Scarlet paper never frosts either: the butterflies stay the one accent.
  float noFrost = step(1.5, vSolid), solidK = clamp(vSolid - 2. * noFrost, 0., 1.);
  float scarlet = smoothstep(6., 12., vPaper.r / max(vPaper.g, 1e-3));
  float frostK = uFrost * (1. - noFrost) * (1. - 0.85 * scarlet);
  vec3 edge = mix(quillLighter(vPaper, 2.), vec3(0.965, 0.955, 0.905), frostK * (1. - 0.6 * smoothstep(uTint.x * 0.45, uTint.x, dist)));
  float lidK = 1. - solidK;                           // where the windings have closed into a flat lid, no line and no burr
  if (vSurf.z > 0.5) return mix(edge, mix(vPaper, edge, 0.3), solidK);   // top edge: the style's line
  vec3 col = vPaper;
  // the hand: every 131 m of strip a glued overlap, double paper (no glow) with a step at its end
  float sp = mod(vSurf.x, 131.), fx = max(fwidth(vSurf.x), 1e-5), fy = max(fwidth(vSurf.y), 1e-5);
  float lap = step(sp, 2.2) * step(8., vSurf.w);
  // glow-through: sun on the far side of this face, eased as the face turns
  float back = smoothstep(0.08, 0.75, -dot(N, uSun)) * (1. - 0.75 * lap);
  col = mix(col, quillGlow(col), back);
  col *= 1. - 0.16 * lap * (1. - smoothstep(0.05, 0.05 + fx * 1.5, abs(sp - 2.2)));
  // laid paper: close lines along the strip, chain lines across it, a faint tooth; gone by 80 m
  float near = 1. - smoothstep(25., 80., dist), close = 1. - smoothstep(6., 30., dist);
  float ly = abs(fract(vSurf.y / 0.3) - 0.5) * 0.3;
  float laid = (1. - smoothstep(0.025, 0.025 + fy * 1.5, ly)) * (1. - smoothstep(0.06, 0.15, fy));
  float lx = abs(fract(vSurf.x / 2.6) - 0.5) * 2.6;
  float chain = (1. - smoothstep(0.035, 0.035 + fx * 1.5, lx)) * (1. - smoothstep(0.1, 0.4, fx));
  vec2 tc = floor(vec2(vSurf.x, vSurf.y) / 0.045);
  float tooth = quillHash(tc.x * 1.37 + tc.y * 57.1) * (1. - smoothstep(0.012, 0.04, max(fx, fy)));
  float wide = clamp(vSurf.w / 9., 0.25, 1.);
  col *= 1. - wide * near * (0.08 + 0.05 * close) * laid - wide * near * (0.10 + 0.05 * close) * chain - close * 0.07 * (tooth - 0.5);
  // burr: the cut edges catch the light, raggedly
  float cell = vSurf.x / 0.31;
  float rag = mix(quillHash(floor(cell)), quillHash(floor(cell) + 1.), smoothstep(0., 1., fract(cell)));
  float bw = (0.07 + 0.3 * rag * rag) * min(vSurf.w / 4., 1.5) + fy * 1.5;
  float burr = (1. - smoothstep(bw * 0.55, bw, vSurf.w - vSurf.y)) + 0.7 * (1. - smoothstep(bw * 0.4, bw * 0.8, vSurf.y));
  col = mix(col, edge, clamp(burr, 0., 1.) * 0.7 * (1. - smoothstep(70., 160., dist)) * lidK);
  // the line: the top cap lies flat and a low or distant eye sees it edge-on, thinner than a pixel, so the top of the
  // face carries the same light edge, never under 2.3 pixels: a far coil is drawn as its edge line at any height of eye
  float lw = min(max(0.1, 2.3 * fy), 0.45 * vSurf.w);
  col = mix(col, edge, (1. - smoothstep(lw, lw + fy, vSurf.w - vSurf.y)) * lidK);
  // under a closed lid the top of every face takes the lid's own tint, so nothing darker or lighter peeps between the caps
  col = mix(col, mix(vPaper, edge, 0.3), (1. - lidK) * smoothstep(0.5, 0.7, vSurf.y / max(vSurf.w, 1e-4)));
  return col;
}
`;

// ---------------------------------------------------------------- the strip program (instanced coils)
// quillGeometry(segs): one strip as a chain of thin boxes, two faces and a top cap (6 triangles a segment).
// aQ = (t along the strip 0..1, side -1/+1, v 0 bottom / 1 top, cap 0/1).
export function quillGeometry(segs = 40, capOnly = false, bias = 1) {
  const per = capOnly ? 2 : 6, n = segs + 1;
  const q = new Float32Array(n * per * 4), idx = [];
  for (let j = 0; j < n; j++) {
    const t = Math.pow(j / segs, bias), o = j * per * 4;
    const rows = capOnly ? [[-1, 1, 1], [1, 1, 1]] : [[1, 0, 0], [1, 1, 0], [-1, 0, 0], [-1, 1, 0], [1, 1, 1], [-1, 1, 1]];
    rows.forEach((r, k) => { q[o + k * 4] = t; q[o + k * 4 + 1] = r[0]; q[o + k * 4 + 2] = r[1]; q[o + k * 4 + 3] = r[2]; });
    if (j < segs) {
      const a = j * per, b = a + per;
      if (capOnly) idx.push(a, a + 1, b, b, a + 1, b + 1);
      else idx.push(a, b, a + 1, a + 1, b, b + 1, a + 2, a + 3, b + 2, b + 2, a + 3, b + 3, a + 4, a + 5, b + 4, b + 4, a + 5, b + 5);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('aQ', new THREE.BufferAttribute(q, 4));
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * per * 3), 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// The seven shapes, bent in the vertex shader. Local frame of an instance: the coil lies in XY, the strip's
// width runs along +Z (so on the card the instance matrix turns Z up). Per-instance attributes:
//   iA = (loose turns, loose outer radius m, strip width m, paper thickness m)
//   iB = (teardrop pinch 0..1, marquise pinch 0..1, eccentricity 0..1 (turns gathered at the glue point), cone lift m)
//   iC = (tight turns, tight radius m, loose inner radius as a fraction, elongation of teardrop / marquise)
//   iD = (openness now 0..1, trigger u or -1, spring length in u, breath phase)
//   iE = (kind 0 coil family / 1 S scroll / 2 V scroll / 3 arc with a coil at its tip, stem length m, V half angle (V scroll) or
//         shrink 0..1 (coil, arc: how far it is drawn in as it winds shut), breath 0..1)
//   iD.z < 0 (springU negative) reverses the trigger: the coil stands open and winds shut to `open` when uU passes its u
//   iPaper = (linear rgb, tint step: -1 by distance, 0 full, 1 half, 2 quarter)
const QUILL_SHAPE_GLSL = /* glsl */`
attribute vec4 aQ, iA, iB, iC, iD, iE, iPaper;
varying vec3 vPaper, vWN, vWP;
varying vec4 vSurf;
varying float vSolid;
vec3 quillCoil(float t, float o) {
  float T = mix(iC.x, iA.x, o), R = mix(iC.y, iA.y, o);
  float rin = mix(0.12, iC.z, o);
  float ph = 6.2831853 * T * t;
  float r = R * mix(1., rin, t);
  float ecc = iB.z * o;
  vec2 p = r * vec2(cos(ph), sin(ph)) + vec2(ecc * (R - r), 0.);
  float late = smoothstep(0.45, 1., o);
  float xn = clamp((R - p.x) / max(2. * R, 1e-4), 0., 1.);
  float tear = min(1.3 * pow(xn + 1e-4, 0.7), 1.);
  float marq = pow(4. * xn * (1. - xn) + 1e-4, 0.6);
  p.y *= mix(1., tear, iB.x * late) * mix(1., marq, iB.y * late);
  float el = mix(1., iC.w, late);
  p.x = (R - p.x) * el - R * (1. - ecc) ;           // glue point at the origin when eccentric, centre when not
  float rr = clamp(r / max(R, 1e-4), 0., 1.);
  float prof = iB.w < 0. ? sqrt(max(1. - rr * rr, 0.)) : 1. - rr;   // lift > 0: cone; lift < 0: dome of that height
  return vec3(p, abs(iB.w) * prof * mix(0.2, 1., o));
}
vec2 quillSpiralArm(float tau, float o) {
  float T = max(mix(iC.x, iA.x, o), 0.02), Th = 6.2831853 * T;
  float rt = mix(iC.y, iA.y, o), L = iE.y * (iE.x > 2.5 ? mix(1., smoothstep(0.08, 0.95, o), iE.z) : 1.);   // a frond that winds shut draws its stem in
  float th = Th * tau, k = 1. - tau;
  float r = rt * mix(1., 0.25, tau) + L * k * k * k;
  float r0 = rt + L, dr0 = -3. * L / Th - 0.75 * rt / Th;
  vec2 q = r * vec2(cos(th), sin(th)) - vec2(r0, 0.);
  float il = 1. / max(length(vec2(dr0, r0)), 1e-4);
  float c = dr0 * il, s = r0 * il;                    // rotate so the arm leaves the origin along +X
  return vec2(c * q.x + s * q.y, -s * q.x + c * q.y);
}
vec3 quillShape(float t, float o) {
  if (iE.x < 0.5) return quillCoil(t, o);
  if (iE.x > 2.5) return vec3(quillSpiralArm(t, o), 0.);
  float sg = t < 0.5 ? -1. : 1.;
  float oa = iE.x < 1.5 ? clamp(o + sg * iE.z * sin(uTime * 0.33 + iD.w), 0.04, 1.3) : o;   // S scroll: one end rolls up as the other unrolls
  vec2 q = quillSpiralArm(abs(2. * t - 1.), oa);
  if (iE.x < 1.5) return vec3(sg * q, 0.);            // S scroll: point symmetry
  float ca = cos(iE.z), sa = sin(iE.z);
  vec2 a = vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y);   // V scroll: mirrored arms, coils rolled outward
  a.y *= sg;
  return vec3(a, 0.);
}
void main() {
  float o = iD.x;
  if (iD.y >= 0.) {
    float sx = (uU - iD.y) / max(abs(iD.z), 1e-4);
    // springU > 0: a tight coil let go (the king's own); springU < 0: an open one winding shut as we pass
    // once shut it is shy: it peeps out a quarter of the way and rolls back, each to its own slow beat (time)
    float peek = 0.25 * (0.5 + 0.5 * sin(uTime * 1.3 + iD.w * 1.7)) * smoothstep(1.2, 2.4, sx);
    o = iD.z < 0. ? max(mix(1., iD.x + peek, quillWind(sx)), 0.) : mix(o, 1., quillSpring(sx));
  }
  o *= 1. + 0.035 * iE.w * sin(uTime * (0.9 + 0.5 * max(iE.w - 2., 0.)) + iD.w) * smoothstep(0.2, 0.4, o);   // crowns in the rush (breath over 2) toss faster
  float t = aQ.x;
  // shrink (iE.z on a coil): a leaflet that is drawn in to nothing as it winds shut
  float sc = iE.x < 0.5 ? mix(1., smoothstep(0.1, 0.9, o), iE.z) : 1.;
  vec3 p = quillShape(t, o) * sc;
  float e = 0.004;
  vec3 pa = quillShape(max(t - e, 0.), o) * sc, pb = quillShape(min(t + e, 1.), o) * sc;
  vec2 tg = pb.xy - pa.xy;
  float tl = length(tg);
  tg = tl > 1e-6 ? tg / tl : vec2(1., 0.);
  vec2 nrm = vec2(-tg.y, tg.x);
  mat4 M = modelMatrix * instanceMatrix;
  vec3 org = (M * vec4(0., 0., 0., 1.)).xyz;
  float dist = length(cameraPosition - (M * vec4(p, 1.)).xyz);
  float Tn = mix(iC.x, iA.x, o), Rn = mix(iC.y, iA.y, o);
  float pitch = iE.x < 0.5 ? Rn * (1. - mix(0.12, iC.z, o)) / max(Tn, 0.05) : max(4., 0.6 * Rn / max(Tn, 0.05));   // a scroll's tip coil; the sky's cloud scrolls are wound 20 m apart
  float solid = 0.;
  float th = quillThickP(iA.w, pitch, dist, solid);
  float keep = step(9.5, iPaper.a);                    // tint + 10: this strip keeps its own edge in first frost
  vSolid = solid + 2. * keep;
  vec3 lp = p + vec3(nrm * (aQ.y * th * 0.5 * min(sc * 4., 1.)), aQ.z * iA.z * sc);
  lp.xy += tg * ((aQ.z - 0.5) * min(0.2 * iA.z, 0.5) * sc * (step(t, 0.0005) - step(0.9995, t)));   // the hand: ends cut a little off square
  vec4 wp = M * vec4(lp, 1.);
  vWP = wp.xyz;
  vWN = mat3(M) * (aQ.w > 0.5 ? vec3(0., 0., 1.) : vec3(nrm * aQ.y, 0.));
  float len = 6.2831853 * mix(iC.x, iA.x, o) * mix(iC.y, iA.y, o) * 0.6 + iE.y;
  vSurf = vec4(t * len + iD.w * 3.7, aQ.z * iA.z, aQ.w, iA.z);
  vPaper = quillTint(iPaper.rgb, iPaper.a - 10. * keep, length(cameraPosition - org));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

// quillMaterial(Q): the one material for every instanced strip. Opaque, unlit, double sided.
export function quillMaterial(Q, extraUniforms = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...Q, ...extraUniforms },
    vertexShader: QUILL_VERT_GLSL + QUILL_SHAPE_GLSL,
    fragmentShader: QUILL_FRAG_GLSL + 'void main(){ gl_FragColor = vec4(quillShade(), 1.); }',
    side: THREE.DoubleSide,
  });
}

// quillBatch(geometry, material, count): an InstancedMesh plus a writer.
//   batch.set(i, matrix, { paper: THREE.Color, tint, turns, radius, width, thick, tear, marquise, ecc, lift,
//     tightTurns, tightRadius, inner, elong, open, trigger, springU, phase, kind, stem, vAngle })
//   batch.openness(i, o) changes one coil's openness (then batch.commit()). Hide a coil with a zero-scale matrix.
const KINDS = { coil: 0, s: 1, v: 2, arc: 3 };
export function quillBatch(geometry, material, count) {
  const geo = geometry.clone();
  const names = ['iA', 'iB', 'iC', 'iD', 'iE', 'iPaper'], arr = {};
  for (const nm of names) { arr[nm] = new Float32Array(count * 4); geo.setAttribute(nm, new THREE.InstancedBufferAttribute(arr[nm], 4)); }
  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, zero);
  geo.getAttribute('iD').setUsage(THREE.DynamicDrawUsage);
  return {
    mesh, count,
    set(i, matrix, o = {}) {
      mesh.setMatrixAt(i, matrix);
      const c = o.paper || new THREE.Color('#6DB33F'), k = i * 4;
      const turns = o.turns ?? 4, radius = o.radius ?? 2;
      arr.iA.set([turns, radius, o.width ?? 3, o.thick ?? 0.12], k);
      arr.iB.set([o.tear ?? 0, o.marquise ?? 0, o.ecc ?? 0, o.lift ?? 0], k);
      arr.iC.set([o.tightTurns ?? turns * 1.8, o.tightRadius ?? radius * 0.35, o.inner ?? 0.3, o.elong ?? 1], k);
      arr.iD.set([o.open ?? 1, o.trigger ?? -1, o.springU ?? 0.012, o.phase ?? i * 1.7], k);
      arr.iE.set([KINDS[o.kind] ?? 0, o.stem ?? 0, o.kind === 'v' ? (o.vAngle ?? 0.5) : o.kind === 's' ? (o.sway ?? 0) : (o.shrink ?? 0), o.breath ?? 1], k);
      arr.iPaper.set([c.r, c.g, c.b, (o.tint ?? -1) + (o.noFrost ? 10 : 0)], k);
    },
    openness(i, o) { arr.iD[i * 4] = o; },
    commit() { geo.getAttribute('iD').needsUpdate = true; },
    commitAll() { for (const nm of names) geo.getAttribute(nm).needsUpdate = true; mesh.instanceMatrix.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- the king's strip: kinematics (CPU, per frame)
// Disc frame: E1 east (+X), E2 uphill (north, away from the arriving eye), EN the strip's width direction.
// The strip is a chain of nodes; a node's material coordinate m is metres of paper from the outer cut end.
// Three settled states (tight, sprung, frond) and two fronts between them, all functions of progress u.
const TILT = Math.PI / 6, HUB_Y = 44, KW = 9;                    // disc tilt, height of the coil's centre, strip width
const E1 = new THREE.Vector3(1, 0, 0), E2 = new THREE.Vector3(0, Math.sin(TILT), -Math.cos(TILT)), EN = new THREE.Vector3(0, Math.cos(TILT), Math.sin(TILT));
const R_OUT = 62, LANE = 14, R_HEART = 19, R_TIGHT = 35, P_TIGHT = 0.84;
const B_S = LANE / TAU;                                           // sprung spiral: r = R_OUT - B_S * theta
const TH_S = (R_OUT - R_HEART) / B_S;                             // sprung winding of the real paper (3.07 turns)
const TH_A = TAU * 1.75;                                          // the anchor: 1.75 turns in, on the east side
const mOf = (th) => R_OUT * th - 0.5 * B_S * th * th;             // paper used by sprung winding th
const M_REAL = mOf(TH_S), M_A = mOf(TH_A);
const FROND = 205, LC = Math.PI * (R_OUT - B_S * TH_A);           // frond length; length over which it uncurls
const ramp = (x, w) => (x <= 0 ? 0 : x < w ? (x * x) / (2 * w) : x - w / 2);
const liftAt = (s) => 0.153 * ramp(s - 70, 50);                   // metres along EN: the frond rises 7.6 degrees
// the running roll: how it runs out along the frond (F metres at unroll pu), its radius, pitch and how far its
// middle is pushed up. It is the seventh shape, a peg pushed out into a low cone, so every turn's light top edge
// stands a step above the last and it reads as a wound coil from any height of eye.
const ROLL_K = 1.15, rollF = (pu) => FROND * (1 - Math.pow(1 - pu, ROLL_K));
const ROLL_CONE = 0.3, ROLL_CONE_RUN = 0.1;   // pushed out as it comes off the heart; nearly a flat peg once it runs, so an eye above it sees closed loops
const ROLL_TIP = 0.5;                              // radians: the running roll leans back against its run (about its heading x the strip's width), an attitude of its own
const KW_TIP = 4.2;                               // the frond's width at its tip (it tapers from 40 m out)
const rollR = (e) => lerp(R_HEART + 0.5, 3.6, clamp(Math.pow(clamp(e, 0, 1), 0.6) + 0.2 * sstep(0, 0.06, e) * (1 - sstep(0.08, 0.4, e)), 0, 1)) * (1 - 0.5 * sstep(0.9, 1, e));   // at the hoop's foot it runs out to the curl of its cut end   // the roll's radius: it shrinks fastest as it sets off
const rollP = (e) => lerp(1.5, 1.8, sstep(0, 0.3, e));                       // its pitch: looser as it runs, air between the turns
const springFn = (x) => (x <= 0 ? 0 : 1 - Math.exp(-4.2 * x) * Math.cos(9.2 * x));
// The frond stands up as it straightens: between 40 and 95 m from the anchor its width turns from the disc's
// normal to world up (a twist of TILT about its own length, which there runs along E1), so the avenue of leaflets
// lies level to either side of a level top edge. widthDir(tw) is the strip's width direction at twist tw.
const twistAt = (s) => TILT * sstep(40, 95, s);
const widthDir = (tw, out) => out.copy(EN).multiplyScalar(Math.cos(tw)).addScaledVector(E2, Math.sin(tw));

const ROLL_LOOSE = 0.42, ROLL_NK = 1.3, ARC_N = 48;
// THE HEART LETS GO AS ANY WOUND PEG OF THE WOOD DOES. The design's motion line: "a tight peg let go leaps to a loose coil
// in a quarter of a second of flight, overshoots and settles in three wobbles ... the king". With the wood's spring (springFn:
// 1 - exp(-4.2 x) cos(9.2 x)) the leap is over when the cosine first reaches zero, at x = pi / (2 * 9.2), and the wobbles are
// spent at x = 1. So a quarter of a second for the leap makes the spring's unit, the whole letting go, 1.46 s: in that time
// the heart's turns spring apart and it slides off the hub and becomes the running roll.
export const LET_GO_SECONDS = 0.25 / (Math.PI / (2 * 9.2));
const LET_GO_VIEWER = LET_GO_SECONDS / 12;        // the same length as a share of the unrolling in the viewer's own loop (demoU gives the unrolling 12 s); a world hands over its own share (setLetGo)
function makeKing(rng, NS, NH) {
  const arcT = new Float32Array(ARC_N + 1);
  const N = NS + NH + 1;
  const heartTurns = 36 + Math.floor(rng() * 5), tightPhase = -Math.PI / 2 + rng.range(0.3, 1.0);
  const wob = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0.6, 1.1)];
  // static per node: sprung winding, paper coordinate, tight winding, heart fraction
  const thS = new Float32Array(N), mm = new Float32Array(N), thT = new Float32Array(N), hq = new Float32Array(N);
  const aT = P_TIGHT / (4 * Math.PI);
  const tightTh = (m) => (R_TIGHT - Math.sqrt(Math.max(R_TIGHT * R_TIGHT - 4 * aT * m, 0))) / (2 * aT);
  const thTEnd = tightTh(M_REAL), rTEnd = R_TIGHT - P_TIGHT * thTEnd / TAU;
  for (let i = 0; i < N; i++) {
    if (i <= NS) { thS[i] = TH_S * i / NS; mm[i] = mOf(thS[i]); thT[i] = tightTh(mm[i]); hq[i] = 0; }
    else { const q = (i - NS) / NH; hq[i] = q; thS[i] = TH_S + q * TAU * heartTurns; thT[i] = thTEnd + q * TAU * heartTurns; mm[i] = M_REAL + q * 600; }
  }
  // static per node, in doubles: every term of compute's loop that reads only the node (its share of the real paper, tight
  // and sprung radius, share of the swing, bell, share of the shiver, both ends of the phase and of the pitch). Tabled once,
  // by the first compute() (the hero's own first update, in the build: where this arithmetic was first done before)
  const nMf = new Float64Array(N), nRT = new Float64Array(N), nRS = new Float64Array(N), nTw = new Float64Array(N), nBell = new Float64Array(N), nShiv = new Float64Array(N);
  const nPhT = new Float64Array(N), nPhS = new Float64Array(N), nPtT = new Float64Array(N), nPtS = new Float64Array(N);
  let tabled = false;
  const tabulate = () => { tabled = true;
    for (let i = 0; i < N; i++) {
      const mf = Math.min(mm[i] / M_REAL, 1), q = hq[i];
      // tight and sprung, blended in polar form about the hub
      const rT0 = q > 0 ? lerp(rTEnd, 0.7, q) : R_TIGHT - P_TIGHT * thT[i] / TAU;
      const bandA = 0.48 * sstep(1, 0.92, q), bandP = TAU * rT0 / 4.3 + wob[1];
      const rT = rT0 + bandA * Math.sin(bandP);                                                    // the hand: turns bunched in bands
      const un = 1 + 0.035 * wob[2] * Math.sin(thS[i] * 0.37 + wob[0]) * (1 - q);                 // the hand: wound a little unevenly
      const hb = 0.42 * sstep(0, 0.05, q) * sstep(1, 0.9, q), hp = TAU * lerp(R_HEART, 0.6, q) / 4.2 + wob[0];
      const rS = q > 0 ? lerp(R_HEART, 0.6, q) + hb * Math.sin(hp) : (R_OUT - B_S * thS[i]) * (1 + (un - 1) * sstep(TH_A * 1.03, TH_A * 1.3, thS[i]));
      const tw = q > 0 ? 1 : Math.pow(thS[i] / TH_S, 2.6);
      const bell = mf * (1 - mf) * 4 * (1 - q);
      nMf[i] = mf; nRT[i] = rT; nRS[i] = rS; nTw[i] = tw; nBell[i] = bell; nShiv[i] = 1 - sstep(M_A - 150, M_A - 20, mm[i]);
      nPhT[i] = tightPhase - thT[i]; nPhS[i] = -Math.PI / 2 - thS[i];
      nPtT[i] = P_TIGHT * Math.max(1 + bandA * TAU / 4.3 * Math.cos(bandP), 0.25); nPtS[i] = q > 0 ? (R_HEART / heartTurns) * Math.max(1 + hb * TAU / 4.2 * Math.cos(hp), 0.3) : LANE;
    }
  };
  // the spring of each node and its three blends (radius, phase, pitch), kept from the last compute() while st.spring is the same
  const oR = new Float64Array(N), oPh = new Float64Array(N), oPt = new Float64Array(N); let oKey = NaN;
  // the frond's centreline in the disc plane, tabulated every half metre from the anchor
  const GN = Math.ceil(FROND * 2) + 2, gx = new Float32Array(GN), gy = new Float32Array(GN), ga = new Float32Array(GN);
  { let x = R_OUT - B_S * TH_A, y = 0, a = -Math.PI / 2;
    for (let k = 0; k < GN; k++) { gx[k] = x; gy[k] = y; ga[k] = a; const s = k * 0.5; const kap = -(1 / (R_OUT - B_S * TH_A)) * Math.max(1 - s / LC, 0);
      a += kap * 0.25; x += Math.cos(a) * 0.5; y += Math.sin(a) * 0.5; a += kap * 0.25; } }
  const G = (s, o) => { const f = clamp(s * 2, 0, GN - 1.001), k = Math.floor(f), t = f - k;
    o.x = lerp(gx[k], gx[k + 1], t); o.y = lerp(gy[k], gy[k + 1], t); o.a = lerp(ga[k], ga[k + 1], t); return o; };
  const g0 = { x: 0, y: 0, a: 0 };
  const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N), pt = new Float32Array(N), ptw = new Float32Array(N);
  // compute(st): st = { spring 0..1, unroll 0..1, time, breath 0..1 } -> px, py (disc plane), pz (lift along EN)
  function compute(st) {
    const settle = (0.28 + 0.72 * sstep(0.3, 0.62, st.spring)) * (1 - sstep(0, 0.1, st.unroll)) * (st.breath ?? 1);   // wound tight it already ticks a little, like a watch
    const beta = 0.42 * Math.sin(st.time * TAU / 6.4) * settle, puff = 0.03 * Math.sin(st.time * TAU / 4.3 + 1.3) * settle;   // the heart turns like a balance wheel, the lanes take it up
    const puffU = 0.022 * Math.sin(st.time * TAU / 2.3 + 0.7) * sstep(0.02, 0.14, st.unroll) * (st.breath ?? 1);   // what is left of the coil shivers as the frond is paid out
    const pu = st.unroll, F = rollF(pu), mo = st.letGo ?? LET_GO_VIEWER, wU = sstep(0, mo, pu), e = F / FROND;      // mo: the letting go, as a share of the unrolling
    const rin = lerp(1.0, 1.2, e), R = rollR(e), p = lerp((R_HEART + 0.5 - 1.0) / (heartTurns + 1.95), rollP(e), wU);   // THE HEART LETS GO BY SPRINGING: from the first instant its turns are let out (the lid breaks into a spiral with air between the turns) while it slides off the hub, all over the one length of the letting go
    const kTurn = 2;                                    // whole turns between the sprung winding's phase at the anchor and the roll's
    const cone = lerp(ROLL_CONE, ROLL_CONE_RUN, sstep(0.3, 0.62, pu)) * sstep(0.03, 0.3, pu) * (1 + 0.14 * Math.sin(st.time * 6.3) * sstep(0.1, 0.3, pu));   // the pushed-out middle bounces as the roll runs
    // THE RUNNING ROLL IS A LOOSE COIL (round 6): its outer turns stand apart (a third of its radius at the rim, easing to the
    // inner pitch over a turn and a half), so card and sky show between them where its wound top is seen
    const pOut = Math.max(p, ROLL_LOOSE * R * springFn(pu / mo) * (1 - sstep(0.9, 1, pu))), dLoose = (pOut - p) * ROLL_NK;      // the outer turns leap apart by the wood's spring, whose unit is the letting go
    const rrOf = (n) => R - p * n - dLoose * (1 - Math.exp(-n / ROLL_NK));
    let nTot = (R - rin) / p; { let lo = 0, hi = nTot; for (let k = 0; k < 18; k++) { const m = (lo + hi) * 0.5; if (rrOf(m) > rin) lo = m; else hi = m; } nTot = lo; }
    const psiTot = nTot * TAU;
    { let acc = 0; arcT[0] = 0; for (let k = 1; k <= ARC_N; k++) { acc += TAU * rrOf(nTot * (k - 0.5) / ARC_N) * nTot / ARC_N; arcT[k] = acc; } }
    G(F, g0); const cx = g0.x + R * Math.sin(g0.a), cy = g0.y - R * Math.cos(g0.a), ac = Math.atan2(-(-Math.cos(g0.a)), -Math.sin(g0.a));
    const psiOf = (m1) => { if (m1 <= 0) return 0; if (m1 >= arcT[ARC_N]) return psiTot;      // paper length -> winding, by the table of the loose spiral's arc
      let a = 0, b = ARC_N; while (b - a > 1) { const m = (a + b) >> 1; if (arcT[m] > m1) b = m; else a = m; }
      return psiTot * (a + (m1 - arcT[a]) / Math.max(arcT[b] - arcT[a], 1e-6)) / ARC_N; };
    const psiRealEnd = psiOf(Math.max(M_REAL - M_A - F, 0)), hF = liftAt(F);
    const g1 = { x: 0, y: 0, a: 0 }, twF = twistAt(F), sinF = Math.sin(twF), cosF = Math.cos(twF);
    if (!tabled) tabulate();
    if (st.spring !== oKey) { oKey = st.spring;
      for (let i = 0; i < N; i++) { const o = springFn(st.spring * 2.7 - nMf[i] * 1.25);
        oR[i] = lerp(nRT[i], nRS[i], o); oPh[i] = lerp(nPhT[i], nPhS[i], o); oPt[i] = lerp(nPtT[i], nPtS[i], clamp(o, 0, 1)); } }
    for (let i = 0; i < N; i++) {
      const q = hq[i], bell = nBell[i];
      let r = oR[i] * (1 - puff * bell - puffU * bell * nShiv[i]), ph = oPh[i] - beta * nTw[i];
      let x, y, z = 0, twi = 0, pitch = oPt[i];
      if (wU > 0 && mm[i] > M_A) {
        const s = mm[i] - M_A; let ux, uy;
        let up = p;
        if (q === 0 && s <= F) { x = r * Math.cos(ph); y = r * Math.sin(ph); G(s, g1); ux = g1.x; uy = g1.y; z = liftAt(s); up = 4; twi = twistAt(s); }
        else { const psi = q > 0 ? psiRealEnd + q * (psiTot - psiRealEnd) : psiOf(s - F);
          const rr = rrOf(psi / TAU), an = ac - psi, h = cone * (R - rr); up = p + (pOut - p) * Math.exp(-psi / (TAU * ROLL_NK));
          // round 6: the heart becomes the roll IN POLAR FORM about a centre that slides from the hub to the roll's own (radius and
          // winding angle each eased), so at every moment it is one clean spiral and never two crossed
          const rad = lerp(r, rr, wU), ang = lerp(ph, an - TAU * kTurn, wU);
          x = cx * wU + rad * Math.cos(ang); y = cy * wU + rad * Math.sin(ang) + h * sinF * wU; ux = x; uy = y; z = hF + h * cosF; twi = twF; }
        x = lerp(x, ux, wU); y = lerp(y, uy, wU); z *= wU; twi *= wU; pitch = lerp(pitch, up, wU);
      } else { x = r * Math.cos(ph); y = r * Math.sin(ph); }      // (wound into the roll, above, x and y are set anew from rad and ang: no cosine and sine of ph there)
      px[i] = x; py[i] = y; pz[i] = z; pt[i] = pitch; ptw[i] = twi;
    }
    return { F, R, cx, cy, hF, gx: g0.x, gy: g0.y, ga: g0.a, twF, pu, bx: cx * wU, by: cy * wU };
  }
  return { N, NS, NH, mm, thS, hq, px, py, pz, pt, ptw, compute, G, heartTurns };
}

// The king's mesh: one instance per segment of the chain, reading two consecutive nodes from one interleaved
// buffer (8 floats a node: x, y, lift, max thickness, nx, ny, paper coordinate m, twist of the width toward world up).
const KING_VERT = QUILL_VERT_GLSL + /* glsl */`
attribute vec4 aQ, n0a, n0b, n1a, n1b;
uniform vec3 uPaper, uHub, uE1, uE2, uEN;
uniform float uWidth, uThick, uMA, uRollF, uWidthTip, uRun, uTip, uReal;
uniform vec3 uTipAt, uTipAxis, uBandC;
vec3 kingTip(vec3 v, float ang) { float c = cos(ang), s = sin(ang); return v * c + cross(uTipAxis, v) * s + uTipAxis * dot(uTipAxis, v) * (1. - c); }
varying vec3 vPaper, vWN, vWP;
varying vec4 vSurf;
varying float vSolid, vBand, vGap;
void main() {
  vec4 a = mix(n0a, n1a, aQ.x), b = mix(n0b, n1b, aQ.x);
  // the room between this turn and the next, in metres: the node's own pitch of the winding (the strip's state, not the eye's) on the REAL PAPER;
  // the heart's own nodes (paper coordinate beyond the real paper's length) carry none: their stated pitch runs ahead of their turns as they let go
  vGap = mix(n0b.z > uReal ? 0. : n0a.w, n1b.z > uReal ? 0. : n1a.w, aQ.x);
  // THE WOUND LID IS BANDED: where the windings close into one flat tint the hand's bunched turns still show, as rings
  // 4.2 m wide about the hub, alternately the lid's tint and one step lighter. Worked out from the node's radius, so the
  // rings are whole turns (clean ellipses), stand still while the heart swings and cannot alias at any distance.
  vBand = clamp(sin(6.2831853 * length(a.xy - uBandC.xy) / 8.4 + 0.9) * 3., -1., 1.) * uBandC.z;
  vec2 nr = b.xy;
  float nl = length(nr);
  nr = nl > 1e-5 ? nr / nl : vec2(1., 0.);
  vec3 c = uHub + uE1 * a.x + uE2 * a.y + uEN * a.z;
  vec3 wc = (modelMatrix * vec4(c, 1.)).xyz;
  float solid = 0.;
  // once the heart lets go the paper of the frond and of the roll shows a heavier edge (0.36 m), so the frond's top edge is
  // a line that carries to the roll and the roll's wound top reads as loops of light edge from a following eye
  float kd = length(cameraPosition - wc);
  float th = quillThickP(uThick + 0.2 * uRun * smoothstep(uMA - 20., uMA + 20., b.z) + 0.26 * uRun * smoothstep(uMA + uRollF - 3., uMA + uRollF + 3., b.z), a.w, kd, solid);   // round 6: what is wound in the roll shows a heavier edge still (0.62 m), a spiral of light line
  // The wound heart's caps are polygons, and where they have only half closed the slivers of gap left between them
  // show as rows of dark teeth. So the lid's COLOUR closes first: by the time the turns are 4 pixels apart the edge line
  // and the gap are one flat tint, and the caps then close under it unseen.
  vSolid = max(solid, 1. - smoothstep(4.0, 5.6, a.w / max(uPx * kd, 1e-5)));
  vec3 nrm = uE1 * nr.x + uE2 * nr.y;
  // the cut ends are a little off square
  float endCut = (1. - smoothstep(0., 1.5, b.z)) * 0.9;
  vec3 tang = uE1 * nr.y - uE2 * nr.x;
  vec3 wd = uEN * cos(b.w) + uE2 * sin(b.w);           // the strip's width: the disc's normal, twisted upright along the frond
  vec3 fn = nrm - wd * dot(nrm, wd);                    // the face normal stays square to the width
  float fl = length(fn);
  fn = fl > 1e-4 ? fn / fl : nrm;
  // the frond tapers toward its tip (the top edge keeps its line, the foot rises); what is still wound in the roll is
  // as wide as the strip where the roll runs, so the roll grows lower as it runs out
  float wT = clamp(clamp(b.z - uMA, 0., uRollF) / 175., 0., 1.);
  float wNow = mix(uWidth, uWidthTip, wT * (1.6 - 0.6 * wT));   // round 6: it tapers from the anchor on, so the roll is lower from the start
  vec3 lp = c + fn * (aQ.y * th * 0.5) + wd * (0.5 * uWidth - (1. - aQ.z) * wNow) + tang * endCut * (aQ.z - 0.5);
  // the running roll leans back against its run (uTip: an attitude of its own, the same from wherever it is seen), about the
  // line from where the strip's top edge meets it through its middle (the last metres of strip twist into it)
  float tipA = uTip * smoothstep(uMA + uRollF - 6., uMA + uRollF + 0.5, b.z);
  lp = uTipAt + kingTip(lp - uTipAt, tipA);
  vec4 wp = modelMatrix * vec4(lp, 1.);
  vWP = wp.xyz;
  vWN = mat3(modelMatrix) * kingTip(aQ.w > 0.5 ? wd : fn * aQ.y, tipA);
  vSurf = vec4(b.z, aQ.z * wNow, aQ.w, wNow);
  vPaper = uPaper;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

function makeKingMesh(king, paper, Q) {
  const seg = new THREE.InstancedBufferGeometry();
  // one segment: faces A and B and the top cap; aQ = (end 0/1, side, v, cap)
  const rows = [[0, 1, 0, 0], [0, 1, 1, 0], [1, 1, 0, 0], [1, 1, 1, 0], [0, -1, 0, 0], [0, -1, 1, 0], [1, -1, 0, 0], [1, -1, 1, 0], [0, 1, 1, 1], [0, -1, 1, 1], [1, 1, 1, 1], [1, -1, 1, 1], [0, 1, 0, 1], [0, -1, 0, 1], [1, 1, 0, 1], [1, -1, 0, 1]];
  seg.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(rows.flat()), 4));
  seg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48), 3));
  seg.setIndex([0, 2, 1, 1, 2, 3, 4, 5, 6, 6, 5, 7, 8, 10, 9, 9, 10, 11]);   // two faces and the top cap (the foot of the strip is a sixth of a metre of paper seen only from below, where the faces' own lower edge line stands for it)
  const data = new Float32Array((king.N + 1) * 8);
  const ib = new THREE.InstancedInterleavedBuffer(data, 8, 1);
  ib.setUsage(THREE.DynamicDrawUsage);
  seg.setAttribute('n0a', new THREE.InterleavedBufferAttribute(ib, 4, 0));
  seg.setAttribute('n0b', new THREE.InterleavedBufferAttribute(ib, 4, 4));
  seg.setAttribute('n1a', new THREE.InterleavedBufferAttribute(ib, 4, 8));
  seg.setAttribute('n1b', new THREE.InterleavedBufferAttribute(ib, 4, 12));
  seg.instanceCount = king.N - 1;
  seg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, HUB_Y, 0), 400);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...Q, uPaper: { value: paper }, uHub: { value: new THREE.Vector3(0, HUB_Y, 0) }, uE1: { value: E1 }, uE2: { value: E2 }, uEN: { value: EN },
      uWidth: { value: KW }, uThick: { value: 0.16 }, uMA: { value: M_A }, uReal: { value: M_REAL }, uRollF: { value: 0 }, uRun: { value: 0 }, uTip: { value: 0 }, uTipAt: { value: new THREE.Vector3() }, uTipAxis: { value: new THREE.Vector3(1, 0, 0) }, uBandC: { value: new THREE.Vector3(0, 0, 1) }, uWidthTip: { value: KW_TIP } },
    vertexShader: KING_VERT, side: THREE.DoubleSide,
    fragmentShader: QUILL_FRAG_GLSL + /* glsl */`varying float vBand, vGap;
      void main() {
        vec3 c = quillShade();
        float sk = clamp(vSolid, 0., 1.);
        // THE WIDE PAPER READS AS A STRIP ON EDGE from the climb and the lip: its lower cut edge and its outer cut end carry the
        // light line too (never under two pixels), and the chain lines of the laid paper are drawn every 2.6 m as marks that
        // carry (never under a pixel, gone before they would crowd), so a flank is never one flat dark shape
        float kfx = max(fwidth(vSurf.x), 1e-5), kfy = max(fwidth(vSurf.y), 1e-5), kface = (1. - step(0.5, vSurf.z)) * (1. - sk);
        vec3 kedge = mix(quillLighter(vPaper, 2.), vec3(0.965, 0.955, 0.905), uFrost * 0.7);
        float klx = abs(fract(vSurf.x / 2.6) - 0.5) * 2.6, kcw = max(0.05, 1.1 * kfx);
        c *= 1. - 0.085 * (1. - smoothstep(kcw, kcw + kfx, klx)) * (1. - smoothstep(0.35, 0.8, kfx)) * kface;
        float klw = min(max(0.1, 2.1 * kfy), 0.3 * max(vSurf.w, 1e-3));
        c = mix(c, kedge, (1. - smoothstep(klw, klw + kfy, vSurf.y)) * kface * 0.85);
        float kle = max(0.16, 2.1 * kfx);
        c = mix(c, kedge, (1. - smoothstep(kle, kle + kfx, vSurf.x)) * kface);
        // THE KING'S TOP EDGE ON ITS FACES, pale and in the king's own proportion: an ordinary 3 m strip carries a top line of 0.1 m, so the 9 m
        // strip carries 0.3 m (never over 0.45 of the width; no floor in pixels: thinner than a pixel it thins away by its share of that pixel, and
        // the line as quillShade drew it stands), in the cap's own pale mix, so cap and line are one pale edge
        float ktw = min(0.3, 0.45 * max(vSurf.w, 1e-3));
        vec3 ktop = mix(kedge, vec3(0.965, 0.955, 0.905), 0.4);
        // THE PALE BAND STANDS ONLY WHERE THERE IS ROOM FOR IT BETWEEN THE TURNS: whole at a gap of 1.2 m (four times the band), absent at 0.6 m
        // (twice the band), where the face keeps the line as quillShade drew it, so close turns are still told apart by cap and face
        c = mix(c, ktop, (1. - smoothstep(ktw, ktw + kfy, vSurf.w - vSurf.y)) * min(1., ktw / kfy) * kface * smoothstep(0.6, 1.2, vGap));
        c = mix(c, vec3(0.965, 0.955, 0.905), 0.4 * step(0.5, vSurf.z) * (1. - sk));      // the king's cut edge shows the paper's pale core: its line stands whiter than a small coil's
        vec3 lite = mix(quillLighter(c, 1.25), vec3(0.965, 0.955, 0.905), 0.3 * uFrost);
        c = mix(c, vBand > 0. ? lite : mix(c, vPaper, 0.7), abs(vBand) * sk);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(seg, mat);
  mesh.frustumCulled = false;
  function upload() {
    const { N, px, py, pz, pt, mm, ptw } = king;
    for (let i = 0; i < N; i++) {
      const a = i > 0 ? i - 1 : 0, b = i < N - 1 ? i + 1 : N - 1, o = i * 8;
      const tx = px[b] - px[a], ty = py[b] - py[a];
      data[o] = px[i]; data[o + 1] = py[i]; data[o + 2] = pz[i]; data[o + 3] = pt[i];
      data[o + 4] = -ty; data[o + 5] = tx; data[o + 6] = mm[i]; data[o + 7] = ptw[i];
    }
    ib.needsUpdate = true;
  }
  return { mesh, upload, mat };
}

// ---------------------------------------------------------------- buildHero
const _v = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _size = new THREE.Vector2(), _wd = new THREE.Vector3();
const disc = (x, y, z, out) => out.set(0, HUB_Y, 0).addScaledVector(E1, x).addScaledVector(E2, y).addScaledVector(EN, z);

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('king-crozier') : ctx.rng;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const papers = makePapers(opts.palette);
  const Q = opts.uniforms ?? makeQuillUniforms();
  Q.uCream.value.copy(papers.cream);
  Q.uStain.value.copy(papers.stain);
  if (opts.sun) Q.uSun.value.copy(opts.sun).normalize();
  const springAt = opts.springAt ?? [0.10, 0.22], unrollAt = opts.unrollAt ?? [0.665, 0.9], laneAt = opts.laneAt ?? [0.255, 0.665];
  const object = new THREE.Group();
  object.name = 'king-crozier';
  const parts = { rng, detail, papers, object, Q, mat: quillMaterial(Q), springAt, unrollAt, laneAt, opts, hooks: [] };

  const king = makeKing(rng, 900, 1660);
  const kingMesh = makeKingMesh(king, papers.bottle, Q);
  object.add(kingMesh.mesh);
  parts.king = king;
  await ctx.yield();
  await buildLeaflets(ctx, parts);
  await ctx.yield();
  await buildTrunk(ctx, parts);
  await ctx.yield();
  await buildExtras(ctx, parts);
  await ctx.yield();
  const anchors = makeAnchors(parts);

  let progress = opts.progress ?? null;
  // viewer aids (tools/shot.mjs _part --query "...&ku=0.4&kview=lane"): force progress, orbit a detail
  const dbg = opts.card !== false ? new URLSearchParams(globalThis.location?.search ?? '') : null, kview = dbg ? dbg.get('kview') : null;   // viewer only: a world (card: false) never reads the URL
  if (dbg && dbg.get('ku') != null) progress = parseFloat(dbg.get('ku'));
  const views = { lane: [anchors.lane[12], 9, 12], wall: [anchors.wallCloseUp, 3, 6], heart: [anchors.hub, 22, 30], frond: [anchors.frond[9], 14, 16], exit: [anchors.portalSeat.position, 16, 14], foot: [new THREE.Vector3(0, 6, 0), 12, 14] };
  const view = views[kview] || [new THREE.Vector3(0, 44, 0), 80, 96];
  const st = { spring: 0, unroll: 0, time: 0, breath: 1, u: 0, F: 0, letGo: LET_GO_VIEWER };
  const demoU = (time) => { const t = time % 40;                 // viewer only: the three acts on a 40 s loop
    return t < 4 ? 0.08 : t < 9 ? lerp(0.10, 0.22, (t - 4) / 5) : t < 22 ? lerp(0.22, 0.665, (t - 9) / 13) : t < 34 ? lerp(0.665, 0.9, (t - 22) / 12) : lerp(0.9, 1, (t - 34) / 6); };
  function update(dt, time, camera) {
    const u = progress == null ? demoU(time) : progress;
    st.u = u; st.time = time;
    st.spring = clamp((u - springAt[0]) / (springAt[1] - springAt[0]), 0, 1);
    st.unroll = clamp((u - unrollAt[0]) / (unrollAt[1] - unrollAt[0]), 0, 1);
    const info = king.compute(st);
    st.F = info.F; st.info = info;
    kingMesh.upload();
    { const ku = kingMesh.mat.uniforms, wd = widthDir(info.twF, _wd);
      ku.uRollF.value = info.F; ku.uRun.value = sstep(0, 0.08, st.unroll); ku.uBandC.value.set(info.bx, info.by, 1 - sstep(0.3, 0.5, st.unroll));   // the lid's rings stay round the roll's own middle while any lid is left
      disc(info.gx, info.gy, info.hF, ku.uTipAt.value).addScaledVector(wd, KW * 0.5);              // where the frond's top edge meets the roll
      _v.set(0, 0, 0).addScaledVector(E1, Math.cos(info.ga)).addScaledVector(E2, Math.sin(info.ga));   // the frond's heading there
      ku.uTipAxis.value.crossVectors(_v, wd).normalize();
      // THE ROLL HAS AN ATTITUDE OF ITS OWN: it leans back ROLL_TIP against its run, about the axis heading x width through the
      // point where the frond's top edge meets it, coming to that lean as it lets go and standing up again as it runs out at
      // the hoop's foot. Its inputs are the roll's own (its place, its heading, the strip's width, how far it has unrolled).
      ku.uTip.value = ROLL_TIP * sstep(0, st.letGo, info.pu) * (1 - sstep(0.93, 1, info.pu)) * (1 + 0.05 * Math.sin(time * 5.1)); }
    Q.uTime.value = time;
    Q.uU.value = u;
    if (camera && ctx.renderer) {
      ctx.renderer.getDrawingBufferSize(_size);
      Q.uPx.value = 2 / (Math.max(Math.abs(camera.projectionMatrix.elements[5]), 1e-3) * Math.max(_size.y, 1));
    }
    for (const h of parts.hooks) h(st, dt, camera);
  }
  update(0, 0, null);
  return {
    object, radius: view[1], height: view[2], center: view[0].clone(), anchors,
    update, setProgress(u) { progress = u; }, dispose() {},
    // setLetGo(share): the length of the heart's letting go (LET_GO_SECONDS of the world's flight) as a share of the unrolling
    setLetGo(share) { st.letGo = clamp(share, 0.01, 1); },
    // leafletsClearOf(points): points = the course as WORLD-space Vector3s at even steps of u from 0 to 1 (the hero's matrix
    // must be set). The leaflets' wave is paced by it (the route's bearing about the hub, by u); and, a rule of place like
    // the clear corridor, a lane leaflet glued within 11 m of the course sweeps away from it when it opens.
    leafletsClearOf(points) {
      object.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(object.matrixWorld).invert();
      parts.clearOf(points.map((p) => p.clone().applyMatrix4(inv)));
    },
    // rollAt(u, out): the centre of the running roll at world progress u, in the object's local space (a pure
    // function of u, for a poi); returns its radius
    rollAt(u, out) {
      const pu = clamp((u - unrollAt[0]) / Math.max(unrollAt[1] - unrollAt[0], 1e-4), 0, 1), F = rollF(pu), e = F / FROND;
      const R = rollR(e), g = king.G(F, { x: 0, y: 0, a: 0 }), w = sstep(0, st.letGo, pu);
      disc((g.x + R * Math.sin(g.a)) * w, (g.y - R * Math.cos(g.a)) * w, liftAt(F) * w, out);
      return R;
    },
    ground: false, groundY: 0, papers, uniforms: Q, material: parts.mat,
  };
}

// glue bead: a pale dot with one white fleck (an instanced low dome, unlit). Exported for the world coder.
export function beadMesh(Q, count, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...Q },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vWP;
      void main() { mat4 M = modelMatrix * instanceMatrix; vec4 wp = M * vec4(position, 1.); vWP = wp.xyz; vN = mat3(M) * normal; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uCream; varying vec3 vN; varying vec3 vWP;
      void main() { float l = length(vN); vec3 N = l > 1e-5 ? vN / l : vec3(0., 1., 0.);
        // the fleck is the bead's glint: it sits on the side we see, drawn a little toward the sun and low (the coil covers the bead's top)
        vec3 tc = cameraPosition - vWP; float tl = length(tc); vec3 V = tl > 1e-4 ? tc / tl : vec3(0., 1., 0.);
        vec3 f = normalize(V + vec3(0.42 * uSun.x, -0.6, 0.42 * uSun.z));
        float fl = smoothstep(0.925, 0.95, dot(N, f));
        vec3 c = mix(uCream * vec3(0.76, 0.79, 0.78), vec3(1.), fl);
        gl_FragColor = vec4(c, 1.); }`,
  });
  const mesh = new THREE.InstancedMesh(g, mat, count);
  mesh.frustumCulled = false;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < count; i++) mesh.setMatrixAt(i, zero);
  return mesh;
}

async function buildLeaflets(ctx, P) {
  const { rng, king, papers, object } = P;
  const list = [];
  const nodeOf = (m) => { let lo = 0, hi = king.NS; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (king.mm[mid] < m) lo = mid; else hi = mid; } return lo; };
  for (let m = 5; m < M_A - 3; m += 5.5 / P.detail) list.push({ m: m + rng.range(-0.8, 0.8), side: list.length % 2 ? 1 : -1, pair: false });
  for (let s = 4; s < FROND - 3; s += 5.2 / P.detail) { const j = rng.range(-0.3, 0.3); list.push({ m: M_A + s + j, side: 1, pair: true }, { m: M_A + s + j + 0.5, side: -1, pair: true }); }
  // two batches, both with their segments gathered toward the outer turn so the coil is round where it is largest on
  // screen: the lane's coils (passed at arm's length) on 64 segments, the frond's pairs on 40
  const nLane = list.filter((L) => !L.pair).length, nPair = list.length - nLane;
  const batchL = quillBatch(quillGeometry(48, false, 1.6), P.mat, Math.max(nLane, 1)), batchP = quillBatch(quillGeometry(34, false, 1.5), P.mat, Math.max(nPair, 1));
  let iL = 0, iP = 0;
  const beadsL = beadMesh(P.Q, Math.max(nLane, 1)), beadsP = beadMesh(P.Q, Math.max(nPair, 1), 0);   // the lane's beads are passed at arm's length (round); the pairs' are seen from 13 m and more over the frond
  const I = new THREE.Matrix4();
  list.forEach((L, i) => {
    L.node = nodeOf(L.m); L.th = king.thS[L.node] % TAU; L.size = rng.range(0.85, 1.12); L.sweep = rng.range(0.85, 1.05);
    // on the lane's walls: 2.4 m coils. Along the frond (the avenue): slimmer teardrops reaching 6.5 m to either side,
    // low and open enough that the strip's own edge and face show between the pairs
    if (L.pair) { L.sweep *= 1.08;   // the pairs sweep forward, toward the tip; like a fern's they are small at the base (where the eye crosses the strip), full along the middle and smaller again toward the tip
      const sF = L.m - M_A; L.size *= lerp(0.5, 1, sstep(15, 65, sF)) * lerp(1, 0.8, sstep(150, 200, sF)); }
    L.B = L.pair ? batchP : batchL; L.bi = L.pair ? iP++ : iL++;
    L.B.set(L.bi, I, L.pair ? { paper: rng.chance(0.3) ? papers.spring : papers.lime, tint: 0, turns: 2.0, radius: 1.7 * L.size, width: 1.05, thick: 0.09,
      tear: 1, ecc: 1, elong: 1.9, inner: 0.34, tightTurns: 2.0, tightRadius: 0.8 * L.size, open: 0, phase: rng.range(0, TAU), breath: 2 }
      : { paper: rng.chance(0.3) ? papers.spring : papers.lime, tint: 0, turns: 2.8, radius: 1.5 * L.size, width: 1.25, thick: 0.13,
        tear: 1, ecc: 1, elong: 1.7, inner: 0.26, tightTurns: 2.0, tightRadius: 1.12 * L.size, open: 0, phase: rng.range(0, TAU), breath: 2 });
  });
  batchL.commitAll(); batchP.commitAll();
  object.add(batchL.mesh, batchP.mesh, beadsL, beadsP);
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), O = new THREE.Vector3(), WD = new THREE.Vector3();
  P.leaflets = list;
  // THE WAVE KEEPS PACE WITH US BY u. The route's own bearing about the hub (the route's point at u projected onto the disc,
  // as winding angle from the low lip) is tabled against u once, from the course the world hands over (clearOf), and a
  // leaflet is let go when that bearing has come within WAVE_LEAD metres of it along its own turn, one after another round
  // every turn the bearing sweeps, from the lane's first metre to its last. So in every second of the lane leaflets are
  // springing open a little ahead of us and those beside and behind stand open. Nothing reads the camera. (Until a course
  // is handed over, as in the viewer, the bearing is taken from the lane's share of u.)
  const WAVE_LEAD = 24, WAVE_M = 14;
  for (const L of list) L.rS = R_OUT - B_S * king.thS[L.node];
  let bearTab = null;                                    // the route's bearing at even steps of u from 0 to 1
  const routeBearing = (st) => {
    if (!bearTab) return lerp(-0.3, TAU * 0.75, clamp((st.u - P.laneAt[0]) / Math.max(P.laneAt[1] - P.laneAt[0], 1e-4), 0, 1));
    const f = clamp(st.u, 0, 1) * (bearTab.length - 1), k = Math.min(Math.floor(f), bearTab.length - 2), a = bearTab[k], b = bearTab[k + 1];
    let th = Math.abs(b - a) < Math.PI ? lerp(a, b, f - k) : a;      // (where the angle wraps between two entries: the entry behind)
    // once the route has left the lane (it swings on round under the low lip) what its bearing passed stays open
    if (st.u >= P.laneAt[1]) th = th < Math.PI ? TAU : Math.max(th, TAU * 0.75);
    return th;
  };
  // clearOf(points): the course in the hero's local space, at even steps of u from 0 to 1. Its bearing about the hub is
  // tabled for the wave; and a lane leaflet glued within 11 m of it sweeps away from it.
  P.clearOf = (points) => {
    bearTab = points.map((e) => { const dx = e.x, dy = e.y - HUB_Y, dz = e.z, ex = dx * E1.x + dy * E1.y + dz * E1.z, ey = dx * E2.x + dy * E2.y + dz * E2.z;
      const th = -Math.PI / 2 - Math.atan2(ey, ex); return th - TAU * Math.floor((th + 0.6) / TAU); });      // winding angle from the low lip, in [-0.6, 2 pi - 0.6)
    king.compute({ spring: 1, unroll: 0, time: 0, breath: 0 });
    const Pq = new THREE.Vector3(), Tq = new THREE.Vector3(), Cq = new THREE.Vector3();
    for (const L of list) {
      if (L.pair) continue;
      const n = L.node, a = Math.max(n - 1, 0), b = Math.min(n + 1, king.N - 1);
      disc(king.px[n], king.py[n], king.pz[n], Pq).addScaledVector(EN, KW * 0.5);
      let dmin = 1e9, near = null;
      for (const e of points) { const de = e.distanceTo(Pq); if (de < dmin) { dmin = de; near = e; } }
      if (near && dmin < 11) {
        const tx = king.px[b] - king.px[a], ty = king.py[b] - king.py[a];
        Tq.set(0, 0, 0).addScaledVector(E1, -ty).addScaledVector(E2, tx);      // the wall's left-hand normal in the disc
        L.side = Cq.subVectors(near, Pq).dot(Tq) > 0 ? -1 : 1;
      }
    }
  };
  // a leaflet pair let go: leaps from peg to teardrop and keeps wobbling for some 25 m behind the roll
  const pairSpring = (x) => (x <= 0 ? 0 : 1 - Math.exp(-2.5 * x) * Math.cos(9.2 * x));
  const Xt = new THREE.Vector3(), Zt = new THREE.Vector3(), _sv = new THREE.Vector3();
  P.hooks.push((st) => {
    const { px, py, pz, ptw, N } = king;
    const Fo = st.F - 0.5 + (st.unroll >= 1 ? 40 : 0), hideRoll = sstep(0.02, 0.05, st.unroll), thE = routeBearing(st), settled = st.spring >= 1 ? 1 : 0;
    for (let i = 0; i < list.length; i++) {
      const L = list[i], n = L.node, a = Math.max(n - 1, 0), b = Math.min(n + 1, N - 1);
      let tx = px[b] - px[a], ty = py[b] - py[a]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      // THE WAVE: each leaflet leaps from its wound peg to an open teardrop as the route's bearing comes within WAVE_LEAD metres
      // of it along its turn, overshoots and settles; behind the wave every turn's edge stands open (never before the king itself has settled)
      let o = springFn((WAVE_LEAD - (L.th - thE) * L.rS) / WAVE_M) * settled, show = 1;
      const s = L.m - M_A;
      if (st.unroll > 0) {
        if (s > 0) { o = lerp(o * (1 - sstep(0, 0.03, st.unroll)), 1, clamp(pairSpring((Fo - s) / 40), 0, 1.3)); show = 1 - hideRoll * (1 - sstep(-1.5, 1.5, st.F - s)); }   // wound into the roll until the strip leaves it
        else o *= 1 - sstep(0.12, 0.34, st.unroll - L.th * 0.012);            // what is left of the coil winds its leaflets back to pegs as we leave
      }
      // once open, the teardrops flutter in the rush (time, a few degrees), each to its own beat
      const open = sstep(0.5, 1, o), sw = L.sweep * open * L.side * (1 + 0.27 * Math.sin(st.time * 4.2 + i * 1.7) * (L.pair ? 1 : 0.4));
      // in-plane direction of the leaflet: along the strip while a coil, swept out sideways as a teardrop
      const c = Math.cos(sw), s2 = Math.sin(sw), dx = tx * c - ty * s2, dy = ty * c + tx * s2;
      widthDir(ptw[n], WD);
      X.set(0, 0, 0).addScaledVector(E1, dx).addScaledVector(E2, dy); X.addScaledVector(WD, -X.dot(WD)).normalize();
      // the pairs of the frond stand up in a shallow V about their glue points, so the teardrops' outlines face an
      // eye that follows the roll (flat, they were seen edge-on as bars); the coils on the lane's walls are glued on
      // tipped back the same way, so the eye riding the lane sees their wound tops and not their sides
      const up = L.pair ? (0.27 + 0.15 * Math.sin(st.time * 3.6 + i * 2.3)) * open : 0.46 + 0.08 * Math.sin(st.time * 2.9 + i * 2.3) * clamp(o * 2, 0, 1), cu = Math.cos(up), su = Math.sin(up);   // wound or open, a lane leaflet is glued on tipped back toward the eye that comes round the lane, so its winding shows
      Xt.copy(X).multiplyScalar(cu).addScaledVector(WD, su); Zt.copy(WD).multiplyScalar(cu).addScaledVector(X, -su);
      Y.crossVectors(Zt, Xt);
      disc(px[n] - ty * L.side * 0.12 * open, py[n] + tx * L.side * 0.12 * open, pz[n], O).addScaledVector(WD, KW * 0.5 + 0.06);
      _m4.makeBasis(Xt, Y, Zt).scale(_sv.set(show, show, show)).setPosition(O);
      L.B.mesh.setMatrixAt(L.bi, _m4);
      L.B.openness(L.bi, clamp(o, 0, 1.2));
      const br = (L.pair ? 0.42 : 0.5) * show;                  // the glue bead clasps the edge under its leaflet
      _m4.makeScale(br, br, br).setPosition(O.x - WD.x * 0.12, O.y - WD.y * 0.12, O.z - WD.z * 0.12);
      (L.pair ? beadsP : beadsL).setMatrixAt(L.bi, _m4);
    }
    batchL.mesh.instanceMatrix.needsUpdate = true; batchP.mesh.instanceMatrix.needsUpdate = true; beadsL.instanceMatrix.needsUpdate = true; beadsP.instanceMatrix.needsUpdate = true; batchL.commit(); batchP.commit();
  });
}

// frond geometry shared by the hoop, the anchors and the stain
function frondPoint(king, s, up, out) {            // a point `up` metres above the frond's top edge at s metres from the anchor
  const g = king.G(s, { x: 0, y: 0, a: 0 });
  return disc(g.x, g.y, liftAt(s), out).addScaledVector(widthDir(twistAt(s), _wd), KW * 0.5 + up);
}
function exitFrame(king) {
  const from = frondPoint(king, FROND - 60, 3, new THREE.Vector3());
  const tip = frondPoint(king, FROND, 0, new THREE.Vector3());
  const wdEnd = widthDir(twistAt(FROND), new THREE.Vector3());          // the frond's width at its tip (world up)
  const seat = tip.clone().addScaledVector(wdEnd, 8.0);
  const dir = seat.clone().sub(from).normalize();
  const side = new THREE.Vector3().crossVectors(dir, wdEnd).normalize();   // the hoop's plane: side and up
  const up = new THREE.Vector3().crossVectors(side, dir).normalize();
  seat.copy(tip).addScaledVector(up, 1.25 + 0.88 * 7.63);
  return { from, tip, seat, dir, side, up };
}

async function buildTrunk(ctx, P) {
  const { rng, papers, object } = P;
  // the trunk: one bark strip pushed out into a telescoped cone, its top edge the spiral seam
  const turns = 20 + Math.floor(rng() * 5), baseR = rng.range(6.2, 7.2);
  const trunk = quillBatch(quillGeometry(560), P.mat, 2);
  const up = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  trunk.set(0, up.clone().multiply(new THREE.Matrix4().makeRotationZ(rng.range(0, TAU))),
    { paper: papers.bark, tint: 0, turns, radius: baseR, width: 3.2, thick: 0.14, lift: 36.6, inner: 0.13, open: 1, tightTurns: turns, tightRadius: baseR, phase: 0, breath: 0 });
  // the hoop's own slim cone, standing in the side gully
  const ex = exitFrame(P.king);
  const foot = ex.tip.clone().addScaledVector(ex.up, 0.1).addScaledVector(ex.side, 2.4);
  const h2 = Math.max(foot.y - 3.0, 6);
  trunk.set(1, new THREE.Matrix4().makeTranslation(foot.x, 0, foot.z).multiply(up),
    { paper: papers.bark, tint: 0, turns: 26, radius: 3.4, width: 3, thick: 0.12, lift: h2, inner: 0.1, open: 1, tightTurns: 26, tightRadius: 3.4, phase: 2, breath: 0 });
  trunk.commitAll();
  object.add(trunk.mesh);
  P.exit = ex; P.hoopFoot = foot;
  await ctx.yield();
  // ground scrolls at the king's foot: roots as S scrolls, V scrolls and a few waiting fiddleheads
  const n = 14, foot2 = quillBatch(quillGeometry(36), P.mat, n);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rng.range(-0.2, 0.2), d = baseR + rng.range(2.5, 9), kind = i % 3;
    const M = new THREE.Matrix4().makeTranslation(Math.sin(a) * d, 0, Math.cos(a) * d).multiply(new THREE.Matrix4().makeRotationY(a + rng.range(-0.5, 0.5))).multiply(up);
    if (kind === 0) foot2.set(i, M, { kind: 's', paper: papers.bark, turns: 1.6, radius: rng.range(0.9, 1.4), stem: rng.range(3, 5), width: rng.range(1.6, 2.4), tightTurns: 1.6, tightRadius: 1.1, open: 1 });
    else if (kind === 1) foot2.set(i, M, { kind: 'v', paper: rng.chance(0.5) ? papers.fern : papers.leaf, turns: 1.5, radius: rng.range(0.7, 1.1), stem: rng.range(2.5, 4.5), vAngle: rng.range(0.35, 0.6), width: rng.range(1.8, 2.6), tightTurns: 2.6, tightRadius: 0.5, open: 1 });
    else foot2.set(i, M, { paper: papers.lime, turns: 3, radius: rng.range(1.3, 2.0), width: rng.range(2.2, 3), inner: 0.25, tightTurns: 5, tightRadius: 0.5, open: 1, phase: rng.range(0, 0.1) * 60, lift: 0.8 });
  }
  foot2.commitAll();
  object.add(foot2.mesh);
}

// stainMaterial(): the shadow. A soft lilac-grey band on the card, drawn with MIN blending so stains never
// pile up darker where they overlap. Geometry: any flat mesh with attribute aSoft (0 at its rim, 1 inside).
export function stainMaterial(Q) {
  return new THREE.ShaderMaterial({
    uniforms: { ...Q },
    vertexShader: 'attribute float aSoft; varying float vS; void main(){ vS = aSoft; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform vec3 uStain; varying float vS; void main(){ float a = smoothstep(0., 1., vS); gl_FragColor = vec4(mix(vec3(1.), uStain, a), 1.); }',
    blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    depthWrite: false, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
}

async function buildExtras(ctx, P) {
  const { rng, papers, object, king, exit: ex } = P;
  // the exit hoop: one loose turn of bottle paper standing across the path on its slim cone
  const hoop = quillBatch(quillGeometry(180), P.mat, 1);   // sixty segments a turn: it fills half the frame at the end and must be round
  const HW = 4, hm = new THREE.Matrix4().makeBasis(ex.up, ex.side.clone().negate(), ex.dir).setPosition(ex.tip.clone().addScaledVector(ex.up, 1.25).addScaledVector(ex.dir, -HW / 2));
  // Its innermost turn is 7.63 m in radius at every moment (the opening is 7 m), so nothing of it ever lies across the
  // opening: all flight it is three loops out to 10.6 m; as the roll runs out at its foot it takes up a turn and lets go to 3.75 turns and 13.3 m.
  const HOOP_IN = 7.63;
  const hoopSet = (k) => { const R = lerp(10.6, 13.3, k), T = lerp(3.0, 3.75, k);   // three loops all flight; as the roll runs out at its foot it takes up the last turn of the strip and lets go to 13.3 m
    hoop.set(0, hm, { paper: papers.bottle, tint: 0, noFrost: true, turns: T, radius: R, inner: HOOP_IN / R, ecc: 0.88, width: HW, thick: 0.42, tightTurns: T, tightRadius: R, open: 1, breath: 0, phase: 1 });
    hoop.commitAll(); };
  hoopSet(0);
  object.add(hoop.mesh);
  let hoopK = 0;
  // (it also breathes a little on time, so the last approach is never still)
  P.hooks.push((st) => { const k = Math.round((springFn((st.u - (P.unrollAt[1] - 0.045)) / 0.06) + 0.07 * Math.sin(st.time * 1.3)) * 500) / 500;
    if (k !== hoopK) { hoopK = k; hoopSet(k); } });
  // glue beads: hub on the trunk, hoop on its cone, hoop to the frond's tip
  const beads = beadMesh(P.Q, 6);
  const put = (i, p, r) => beads.setMatrixAt(i, _m4.makeScale(r, r, r).setPosition(p));
  put(0, new THREE.Vector3(0, 40.2, 0), 0.9);
  put(1, P.hoopFoot.clone().addScaledVector(ex.up, 0.3), 0.6);
  put(2, ex.tip.clone().addScaledVector(ex.up, 0.25), 0.55);
  object.add(beads);
  await ctx.yield();
  // the king's stain on the card: a ribbon under the strip, pushed away from the sun
  const step = 3, SN = Math.floor((king.N - 1) / step) + 1;
  const sg = new THREE.BufferGeometry(), spos = new Float32Array(SN * 3 * 3), soft = new Float32Array(SN * 3), sidx = [];
  for (let k = 0; k < SN; k++) { soft[k * 3] = 0; soft[k * 3 + 1] = 1; soft[k * 3 + 2] = 0;
    if (k < SN - 1) { const a = k * 3, b = a + 3; sidx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); } }
  const sattr = new THREE.BufferAttribute(spos, 3); sattr.setUsage(THREE.DynamicDrawUsage);
  sg.setAttribute('position', sattr); sg.setAttribute('aSoft', new THREE.BufferAttribute(soft, 1)); sg.setIndex(sidx);
  sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 600);
  const stain = new THREE.Mesh(sg, stainMaterial(P.Q));
  stain.frustumCulled = false; stain.renderOrder = -5;
  object.add(stain);
  const A = new THREE.Vector3(), B = new THREE.Vector3(), sinv = new THREE.Matrix4();
  P.hooks.push(() => {
    object.updateWorldMatrix(true, false);
    const sun = _v.copy(P.Q.uSun.value).transformDirection(sinv.copy(object.matrixWorld).invert()), hl = Math.hypot(sun.x, sun.z) || 1, ox = -sun.x / hl, oz = -sun.z / hl;   // the sun in the hero's own frame
    const { px, py, pz, N } = king, e1x = E1.x, e1y = E1.y, e1z = E1.z, e2x = E2.x, e2y = E2.y, e2z = E2.z, enx = EN.x, eny = EN.y, enz = EN.z;
    for (let k = 0; k < SN; k++) {
      const i = Math.min(k * step, N - 1), j = Math.min(i + step, N - 1), h = Math.max(i - step, 0);
      // disc() in plain numbers, each sum in disc()'s own order: (0, HUB_Y, 0) + E1 x + E2 y + EN z (of the points ahead and behind only x and z are read)
      const zi = pz[i] - KW * 0.5, ax = 0 + e1x * px[i] + e2x * py[i] + enx * zi, ay = HUB_Y + e1y * px[i] + e2y * py[i] + eny * zi, az = 0 + e1z * px[i] + e2z * py[i] + enz * zi;
      const bx = 0 + e1x * px[j] + e2x * py[j] + enx * pz[j], bz = 0 + e1z * px[j] + e2z * py[j] + enz * pz[j], hx = 0 + e1x * px[h] + e2x * py[h] + enx * pz[h], hz = 0 + e1z * px[h] + e2z * py[h] + enz * pz[h];
      let tx = bx - hx, tz = bz - hz; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const sh = ay * 0.42, cx = ax + ox * sh, cz = az + oz * sh, w = 2.2 + ay * 0.035, o = k * 9;
      spos[o] = cx - tz * w; spos[o + 1] = 0.06; spos[o + 2] = cz + tx * w;
      spos[o + 3] = cx; spos[o + 4] = 0.06; spos[o + 5] = cz;
      spos[o + 6] = cx + tz * w; spos[o + 7] = 0.06; spos[o + 8] = cz - tx * w;
    }
    sattr.needsUpdate = true;
  });
  // THE DARKER POOL UNDER THE WOUND HEART: one soft fan on the card, a step deeper than the stain, where the heart's shade
  // falls; when the heart lets go it follows the roll and shrinks with it (a tight coil keeps its pool; a frond has none)
  {
    const PK = 18, pg = new THREE.BufferGeometry(), ppos = new Float32Array((PK + 1) * 3), psoft = new Float32Array(PK + 1), pidx = [];
    psoft[0] = 1.5; for (let k = 0; k < PK; k++) pidx.push(0, 1 + k, 1 + ((k + 1) % PK));
    const pattr = new THREE.BufferAttribute(ppos, 3); pattr.setUsage(THREE.DynamicDrawUsage);
    pg.setAttribute('position', pattr); pg.setAttribute('aSoft', new THREE.BufferAttribute(psoft, 1)); pg.setIndex(pidx);
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 600);
    const poolMat = stainMaterial(P.Q); poolMat.uniforms.uStain = { value: new THREE.Color('#B2B6C8') };
    const poolMesh = new THREE.Mesh(pg, poolMat); poolMesh.frustumCulled = false; poolMesh.renderOrder = -5;
    object.add(poolMesh);
    P.hooks.push((st) => {
      const info = st.info; if (!info) return;
      const sun = _v.copy(P.Q.uSun.value).transformDirection(sinv.copy(object.matrixWorld).invert()), hl = Math.hypot(sun.x, sun.z) || 1, ox = -sun.x / hl, oz = -sun.z / hl;
      disc(info.bx, info.by, info.hF, A);
      const R = Math.max((st.unroll > 0 ? info.R : R_HEART) * 0.8 * (1 - sstep(0.8, 1, st.unroll)), 0.01), sh = A.y * 0.42, cx = A.x + ox * sh, cz = A.z + oz * sh;
      ppos[0] = cx; ppos[1] = 0.07; ppos[2] = cz;
      for (let k = 0; k < PK; k++) { const a = (k / PK) * TAU, o = (k + 1) * 3; ppos[o] = cx + Math.cos(a) * R; ppos[o + 1] = 0.07; ppos[o + 2] = cz + Math.sin(a) * R; }
      pattr.needsUpdate = true;
    });
  }
  // raindrops: tight stream-blue pegs beaded on the king's top edge, running down it and looping (time, not u)
  const DN = Math.round(46 * P.detail), drops = quillBatch(quillGeometry(14), P.mat, DN), dm = [];   // round pegs: fourteen segments over one turn and a third
  for (let i = 0; i < DN; i++) { dm.push({ m0: rng.range(0, 1), v: rng.range(2.2, 3.6), r: rng.range(0.32, 0.5) * 0.56 });   // beads of rain, a quarter of a leaflet coil across
    drops.set(i, new THREE.Matrix4(), { paper: papers.stream, tint: 0, turns: 1.3, radius: dm[i].r, width: 0.3, thick: 0.05, inner: 0.3, tightTurns: 1.3, tightRadius: dm[i].r, open: 1, breath: 0 }); }
  drops.commitAll();
  object.add(drops.mesh);
  const DX = new THREE.Vector3(), DY = new THREE.Vector3(), DO = new THREE.Vector3();
  P.hooks.push((st) => {
    const { px, py, pz, ptw, mm, NS } = king, span = M_A + Math.min(st.F, FROND - 8) - 6;
    for (let i = 0; i < DN; i++) {
      const d = dm[i], m = 3 + ((d.m0 * span + st.time * d.v) % span);
      let lo = 0, hi = NS; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (mm[mid] < m) lo = mid; else hi = mid; }
      const f = clamp((m - mm[lo]) / Math.max(mm[hi] - mm[lo], 1e-4), 0, 1);
      const x = lerp(px[lo], px[hi], f), y = lerp(py[lo], py[hi], f), z = lerp(pz[lo], pz[hi], f);
      let tx = px[hi] - px[lo], ty = py[hi] - py[lo]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      widthDir(ptw[lo], _wd);
      DX.set(0, 0, 0).addScaledVector(E1, tx).addScaledVector(E2, ty); DX.addScaledVector(_wd, -DX.dot(_wd)).normalize(); DY.crossVectors(_wd, DX);
      const show = st.spring > 0.6 ? 1 : 0.001;
      disc(x, y, z, DO).addScaledVector(_wd, KW * 0.5 + 0.03);
      _m4.makeBasis(DX, DY, _wd).scale(_v.set(show, show, show)).setPosition(DO);
      drops.mesh.setMatrixAt(i, _m4);
    }
    drops.mesh.instanceMatrix.needsUpdate = true;
  });
  // viewer dressing (opts.card !== false): the cream card as ground and sky. The world builds its own.
  if (P.opts.card !== false) {
    const cm = new THREE.MeshBasicMaterial({ color: papers.cream });
    const card = new THREE.Mesh(new THREE.CircleGeometry(2400, 48), cm); card.rotation.x = -Math.PI / 2; card.renderOrder = -0.4;
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 12), new THREE.MeshBasicMaterial({ color: papers.cream, side: THREE.BackSide, depthWrite: false, fog: false }));
    sky.renderOrder = -0.5; cm.fog = false;
    object.add(sky, card);
  }
}

function makeAnchors(P) {
  const king = P.king, ex = P.exit, V = (x, y, z) => disc(x, y, z, new THREE.Vector3());
  // the lane between the outer turn and the second: three quarters of a turn, clockwise seen from above,
  // from the low lip (+Z) up the -X side, over the high lip (-Z) and down the +X side; mid-height of the walls
  const lane = [];
  for (let k = 0; k <= 24; k++) { const th = (k / 24) * TAU * 0.75, r = R_OUT - B_S * th - LANE / 2, ph = -Math.PI / 2 - th; lane.push(V(r * Math.cos(ph), r * Math.sin(ph), 0)); }
  const laneEntry = V(-22, -(R_OUT - LANE / 2) - 4, 0), approach = V(-60, -(R_OUT - LANE / 2) - 20, -2);
  // the frond: from the lane's end slide in over the inner wall, then 3 m above its top edge, then straight to the seat
  const frond = [], g = { x: 0, y: 0, a: 0 };
  for (let s = 12; s <= FROND - 60; s += 12) {
    king.G(s, g); const w = 1 - sstep(0, 55, s);
    frond.push(V(g.x - Math.sin(g.a) * 7 * w, g.y + Math.cos(g.a) * 7 * w, liftAt(s)).addScaledVector(widthDir(twistAt(s), _wd), (KW * 0.5 + 3) * (1 - w)));
  }
  frond.push(ex.from.clone());
  const beyond = ex.seat.clone().addScaledVector(ex.dir, 12);
  return {
    hub: new THREE.Vector3(0, HUB_Y, 0),                    // centre of the coil and of the wound heart (poi)
    discNormal: EN.clone(), discUphill: E2.clone(),
    lowLip: V(0, -R_OUT, 0), highLip: V(0, R_OUT, 0),
    approach, laneEntry, lane, frond,
    flyThrough: [approach, laneEntry, ...lane, ...frond, ex.seat.clone(), beyond],
    portalSeat: { position: ex.seat.clone(), facing: ex.dir.clone(), up: ex.up.clone(), radius: 7 },
    exitStraightFrom: ex.from.clone(), frondTip: ex.tip.clone(), hoopFoot: P.hoopFoot.clone(),
    wallCloseUp: V((R_OUT - B_S * TAU * 1.5) * Math.cos(-Math.PI / 2 - TAU * 0.5) , (R_OUT - B_S * TAU * 1.5) * Math.sin(-Math.PI / 2 - TAU * 0.5), 0),
    viewFromStream: new THREE.Vector3(0, 2.4, 190),         // where the arriving eye stands when the king springs
    timing: { springAt: P.springAt, laneAt: P.laneAt, unrollAt: P.unrollAt },
  };
}
