// The Fogged Palm House: hero set piece (the dome and its palm) and the STYLE KIT of the whole world.
//
// THE LAW (styleNote): sharpness and colour belong to contact. Milk white glass is the light; a thing is crisp
// viridian where it touches a pane or the lens, and grows larger, softer and paler away from it, into milk, never
// into dark. No lights, no shadows, no fog, no screen blur. Everything here is an unlit ShaderMaterial.
// PIPELINE ASSUMED: post { flat: 1, bloom: { strength: 0 } (or a faint 0.1), grade neutral }, so the palette hexes
// are shown exactly; nothing exceeds 1.0. Under another world's tone map (through a portal) milk reads pale grey.
//
// makeStyle(ctx, { palette, runDensity }) -> style
//   palette        { milk, pearl, greyGreen, viridian, deep, scarlet, blue } linear THREE.Colors (brief order)
//   uniforms       shared {value} objects: uTime, uLens (world position of the lens), uInside (1: sharpness follows the
//                  lens; 0: seen from the snow, it follows each card's distance to its pane), uRunDensity, uSyringe, uResY
//   update(dt, time, camera)   call every frame (reads camera.matrixWorld); setInside(0|1); setSyringe(0..1)
//   glass(o)       panes. Geometry: uv = (lane coordinate, 1 lane = 0.3-0.5 m; metres down from the pane's top), normals.
//                  o = { outside, L (run length m), bars (glazing bars per lane), lap (m), reflect, milk, cutA, cutB }.
//                  The glass has a body: every pane its own white (four quiet steps of pearl, the cast of its crate, one in
//                  fifteen odd, some a touch warm), a bead stipple, o.crack = Vector2(bar cell, lap cell) of one puttied pane;
//                  makeStyle({ honey: '#hex', honeyX }) turns the panes on the +X side honey (the golden hour).
//                  Inside face: opaque milk; a run rules a clear track that shows blue high / pearl low / white at foot.
//                  Outside face: transparent, alpha = fog, so clear tracks show what is behind. Draw real crisp plants
//                  before it and ghosts after it (renderOrder). Bars (white, grey-green rebate >= 1.5 px), laps, beads,
//                  mismatched panes, the puttied crack and the stray run are all in this shader.
//   iron(o)        white iron for geometry from ironSweep(): the grey-green rebate line on both edges of every face.
//                  o = { rivet (m), tone (0 white .. 1 pearl stone), cutA, cutB }. Works with InstancedMesh.
//   leaf(o)        leaf cards on an InstancedMesh with aLeaf = (metres to nearest pane | -1 pressed on glass: always
//                  crisp, seed, droop, atlas cell); o = { fan (analytic pleated palm fan) | atlas cell, core, centre,
//                  sway, breath, conformR, afterGlass, ghost, scarlet, white, reach (scales the one distance: the accent
//                  uses 0.6 so it holds full colour to about 4 m), fade (soft pass thins as contact is lost), moth (1 butterfly,
//                  2 white moth: an analytic wing hinged on the card's line y = 0.25; aLeaf.w = +1/-1 head direction) }. Use two meshes on the same data:
//                  core (s < 0.25, alpha-tested, depth-written) and soft (blended). Scale, edge softness (mip bias),
//                  veins and tint all come from one distance. Pressed prints: core + afterGlass, renderOrder above the panes.
//   stem(o)        trunks and stalks (tube with uv = (turns, metres), attribute aPane): fibre near, pale soft column far.
//                  o.reach scales the one distance, as for leaf (the great trunk uses 0.3: its bark holds from across the pool).
//   POLISH 1: the rosette has twenty more pressed fans between its rings (no hole of bare milk in the print), each fan its
//   own depth of green; the hanging crown and the pads hold their contact further (reach 0.4 / hold 0.82).
//   pool(o), floor(), mist(o), drops(o)   the mirror pool (dome reflected by ray, with the same runs), ringed paving,
//                  level mist shelves (fade within 1.5 m of lens height, curl round the lens), falling drips.
//   leafAttr(geo, rows), cardGeometry, ironSweep, iSection, boxSection, textures { cond, atlas }, glsl { common, runs }, DOME
//   ATLAS_CELLS    hand, frond, lance, fatsia, flower, pad, gecko, heart (the shape is the middle half of its card)
//
// buildHero(ctx, { style, palette, detail (0.6-1), runDensity, archIn, archOut }) -> hero
//   LOCAL SPACE = the brief's world axes with the dome's centre on the snow at the origin (world z 200): the course
//   runs toward +Z, the fern wing joins at -Z, the apse arch (the way out, the "front") faces +Z. Do not rotate it.
//   Size: radius 30, drum 10 m, apex 40 m (finial to 48). About 66k triangles, 20 draw calls, ~50 ms of script.
//   What it holds: the hull (inside and outside faces), 48 ribs, hoops, cresting, finial, the gallery at 10 m on
//   pierced brackets, the spiral stair, both arch frames, the palm (trunk, stalks, ~27 hanging fans, 30 fans pressed on
//   the apex as the rosette), the pool with island, kerb, 40 pads, 5 lilies, the paved floor, 3 mist shelves, drips.
//   anchors (local): entryArch / exitArch { position, halfWidth, height, rise, facing } (the holes cut in the shell:
//   butt the wing vault and the apse against them; change with opts.archIn / archOut = { hw, h, rise });
//   flyThrough (the brief's spiral: 7 m under both arches, 8 m off the trunk, 2-3 m under the lowest fans at y 24,
//   as the brief asks); crown (aim the poi here), trunkTop, apex, rosetteRadius; pool { center, radius, kerbTop },
//   island, kerbSeat (the watering can), stair, chairSeat, galleryY, mistShelves (heights), viewpoints.
//   update(dt, time, camera): if the hero made its own style it drives it (and uInside from the lens being in the
//   dome); with opts.style the WORLD must call style.update and style.setInside itself. hero.setSyringe(0..1) fogs
//   every pane whole (the rare event); there is no other progress hook: all motion is ambient and loops on time.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#F1F3EE', '#C3CAC8', '#8EA89C', '#0E6F57', '#0A4638', '#D7281E', '#6C9BC7'];
const NAMES = ['milk', 'pearl', 'greyGreen', 'viridian', 'deep', 'scarlet', 'blue'];

// Dome dimensions (metres, local space of the hero).
export const DOME = { R: 30, drumH: 10, apexY: 40, bays: 48, lanesPerBay: 8, rosetteR: 15, poolR: 14 };
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- GLSL shared by every material
// The one rule: sharpness and colour belong to contact. contactS(d) is 0 at contact and 1 far away
// (half at 9 m); every leaf card takes its scale, edge softness and tint from it.
const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uLens;        // world position of the lens (camera), set every frame by style.update
uniform vec3 cMilk, cPearl, cGrey, cVirid, cDeep, cScarlet, cBlue;
float h11(float n){ return fract(sin(n * 127.1 + 1.7) * 43758.5453); }
// 1 inside an arch opening cut in a shell (object space; cutA faces +Z, cutB faces -Z; each = halfWidth, height, rise, on)
float archCut(vec3 op, vec4 cutA, vec4 cutB){
  vec4 c = mix(cutB, cutA, step(0., op.z));
  float x = op.x / max(c.x, 1e-3);
  float top = c.y - c.z + c.z * sqrt(max(0., 1. - x * x));
  return step(abs(x), 1.) * step(op.y, top) * c.w;
}
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float contactS(float d){ return pow(clamp((d - 1.5) / 28.5, 1e-5, 1.), 0.52); }
// what a clear track shows: blue high, pearl lower, snow white at the foot (y = up component, -1..1)
vec3 trackSky(float y){
  vec3 c = mix(cPearl, cBlue, smoothstep(0.12, 0.62, y));
  return mix(mix(cMilk, cPearl, 0.42), c, smoothstep(-0.06, 0.1, y));   // the snow outside is a tone darker than the glass
}
// leaf colour by contact, printed in three flat inks so three depths read in one frame: at the lens the deep green
// carries the blade (viridian only on its ribs and lit pleats), by a few metres full viridian, by 9 m grey-green, milk far away
vec3 leafTint(float s, float fold){
  float hand = 1. - smoothstep(0.0, 0.2, s);                              // within arm's reach
  vec3 near = mix(cVirid, cDeep, clamp(fold + 0.5 * hand, 0., 1.));
  near = mix(near, cDeep * 0.82, hand * smoothstep(0.55, 1., fold) * 0.6);   // the fold of a leaf in contact: the darkest ink in the house
  vec3 c = mix(near, cGrey, smoothstep(0.2, 0.56, s));
  return mix(c, cMilk, smoothstep(0.52, 1.0, s) * 0.86);
}
// THE SECOND KEY (polish 4). The sun, low behind the thin overcast, comes through the ribbed glass and is printed where it
// falls on anything level (floor, water, mist) as flat, hard-edged bands of one pale gold: one band to each bay between
// ribs, each bay let through a little more or less by its fog. Never a gradient, never
// a cast shadow of a thing. Bands lie 13 m apart and slanted to the course, so under the lens they pass less than twice a second.
uniform vec3 cSun; uniform vec4 uSun;      // uSun: xy unit direction across the bands (world xz), z period in metres, w strength
float sunBand(vec2 p, float px){
  float per = max(uSun.z, 1.);
  float t = dot(p, uSun.xy) / per + 0.07 * sin(dot(p, vec2(-uSun.y, uSun.x)) * 0.05);
  float f = fract(t), w = clamp(px / per, 1e-4, 0.2);
  float band = smoothstep(0.1 - w, 0.1 + w, f) * (1. - smoothstep(0.58 - w, 0.58 + w, f));
  // (no bars ruled inside a band: a thin line across the course passes under the lens as a flick; the band's two edges pass about 1.5 times a second)
  return band * (0.72 + 0.28 * h11(floor(t) * 3.7 + 0.5)) * uSun.w;
}
// the same light on anything that stands in it: a bay's beam leans as it comes down, so a thing at height y is lit where
// the floor band, carried up the beam, meets it. Trunks, leaves and the mist shelves are cut by the same flat bands.
float sunAt(vec3 p, float px){ return sunBand(p.xz + uSun.xy * (0.9 * p.y), px); }
`;

// POLISH 6: THE LIGHT COMES THROUGH THE PLANTING. Inside a bay's band of gold the leaves that stand in its way are printed as
// flat leaf shapes of the floor's own shade tone (the atlas silhouettes, scattered, each turning a little on its stalk): the
// sun is seen to fall through fronds. Flat and hard-edged like everything the light prints; never a gradient.
// p: world xz in metres, px: metres to a pixel (taken outside: no derivatives here). Returns 0..1, 1 = a leaf in the way.
const GLSL_DAPPLE = /* glsl */`
uniform sampler2D uAtlas;
float dapple(vec2 p, float px){
  float m = 0.;
  float lod = clamp(log2(max(px / 0.014, 1.)), 0., 6.);
  float w = clamp(0.06 + px * 0.25, 0.06, 0.3);
  float seen = 1. - smoothstep(0.5, 1.6, px);
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 g = p / (4.4 + 1.9 * fk) + fk * 13.7;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float r1 = h21(id + 3.1 + fk), r2 = h21(id + 7.7 + fk * 2.3);
    float a = r1 * 6.2831853 + 0.07 * sin(uTime * 0.6 + r1 * 40.), ca = cos(a), sa = sin(a);
    vec2 q = clamp(mat2(ca, -sa, sa, ca) * f * 0.92 + 0.5, 0., 1.);
    float cell = floor(r2 * 3.99);
    float t = textureLod(uAtlas, (vec2(cell, 1.) + q) / vec2(4., 2.), lod).r;
    m = max(m, smoothstep(0.5 - w, 0.5 + w, t) * step(0.45, fract(r1 * 7.3 + r2)));
  }
  return m * seen;
}
`;

// Condensation runs. x: lane coordinate (1 unit = one lane, about 0.3-0.5 m), v: metres down the pane from
// its top edge, L: length of the pane's run in metres, wpx: fwidth(x) taken OUTSIDE (no derivatives here).
// Returns vec2(clear, head): clear 0..1 is how far the fog is wiped (1 just behind a drop, 0 after ~10 s),
// head is the bead of the running drop itself.
const GLSL_RUNS = /* glsl */`
uniform float uRunDensity;  // 0..1 share of lanes that carry drops
uniform float uSyringe;     // 0 normal; 1 = every pane fogged whole (rare event); world drives it
uniform vec2 uFlush;        // rare event: x = how far down (0..1 of L) every lane has let go at once, y = strength
vec2 paneRuns(float x, float v, float L, float wpx){
  float lane = floor(x), fx = fract(x);
  float clear = 0., bead = 0.;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float sd = h11(lane * 1.73 + fk * 31.3);
    float on = step(h11(lane * 0.37 + fk * 3.1), uRunDensity);
    float spd = mix(1.3, 2.8, h11(lane * 3.1 + fk * 7.7));           // metres a second
    float span = L + 16.0 * spd * 0.6;                               // run, then wait while the track mists
    float head = fract(uTime * spd / span + sd) * span;              // metres from the top
    float start = h11(lane * 5.3 + fk * 1.9) * L * 0.45 * fk * 0.5;   // later heads start lower down
    float stray = step(0.93, h11(lane * 9.1 + fk));                  // the run that wanders off its lane
    float wob = 0.5 + (0.10 + 0.07 * stray) * sin(v * (0.33 + 0.2 * sd) + sd * 40.) + 0.05 * sin(v * 1.4 + sd * 9.);
    float hw = max(mix(0.2, 0.3, h11(lane + fk * 5.)), 0.8 * wpx);    // never under ~1.5 px
    float dx = abs(fx - wob);
    float line = 1. - smoothstep(hw - wpx, hw + wpx, dx);
    float behind = min(head, L) - v;
    float age = (head - v) / spd;                                    // seconds since the drop passed here
    float tr = step(0., behind) * step(start, v) * (1. - smoothstep(5.5, 10.0, age));
    tr *= smoothstep(0., 0.6, v - start);
    clear = max(clear, line * tr * on);
    float hd = 1. - smoothstep(0.0, 1.0, length(vec2(dx / max(hw * 1.3, 1e-3), (head - 0.2 - v) * 2.4)));   // the bead rides just inside the head of its track
    bead = max(bead, hd * on * step(v, L) * step(start, v));
  }
  // the syringing: every lane lets go together, and the pane clears from its top edge down
  float fwob = 0.5 + 0.1 * sin(v * 0.4 + lane * 2.3);
  float fhw = max(0.26, 0.8 * wpx);
  float fl = (1. - smoothstep(fhw - wpx, fhw + wpx, abs(fx - fwob))) * (1. - smoothstep(uFlush.x * L - 0.8, uFlush.x * L, v)) * uFlush.y;
  fl *= 1. - 0.8 * smoothstep(0.75, 0.95, fract(v * 0.11 - uTime * 0.28 + h11(lane * 7.7)));   // drops still running in every cleared lane
  float fhd = (1. - smoothstep(0., 1., length(vec2((fx - fwob) / max(fhw * 1.5, 1e-3), (uFlush.x * L - v) * 1.6)))) * uFlush.y * step(v, L);
  return vec2(max(clear * (1. - uSyringe), fl), max(bead * (1. - uSyringe), fhd));
}
`;

// ---------------------------------------------------------------- (n8b) the wall's depth, written by what stands before the wall
// A layer of a pane that is drawn after everything else (the forcing house wall's own bars over its prints) must not be drawn over a
// thing that stands in the air before the pane and writes no depth of its own (a blended pane, a butterfly). Such a thing is drawn once
// more with its own shader and the define WALL_DEPTH: no colour, and where the eye's own line through the fragment goes on to meet the
// pane's rectangle it writes the depth of the pane's plane on that line (uWall.x), so what is drawn after it at or behind that plane on that line stops there (the
// wall's bars); where the line misses the rectangle, or the thing is not between this eye and the plane, it writes nothing. Nothing before the plane or beside the pane is touched.
const GLSL_WALL_DEPTH = /* glsl */`
#ifdef WALL_DEPTH
uniform vec4 uWall;              // x: the plane (world x) whose depth is written; y, z: the wall's two ends along z; w: its height from the ground
uniform mat4 projectionMatrix;
void wallDepth(vec3 wp){
  float dx = wp.x - cameraPosition.x;
  if (dx <= 0. || wp.x >= uWall.x) discard;                                        // not between this eye and the wall's plane
  vec3 q = cameraPosition + (wp - cameraPosition) * ((uWall.x - cameraPosition.x) / dx);
  if (q.z < uWall.y || q.z > uWall.z || q.y < 0. || q.y > uWall.w) discard;          // the eye's line misses the wall's rectangle
  vec4 c = projectionMatrix * viewMatrix * vec4(q, 1.);
  gl_FragDepth = c.z / c.w * 0.5 + 0.5;
}
#endif
`;

// ---------------------------------------------------------------- pane (glass) shader
const PANE_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vWp; varying vec3 vWn; varying vec3 vOp;
void main(){
  vUv = uv; vOp = position;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vWp = wp.xyz;
  vWn = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PANE_FRAG = GLSL_COMMON + GLSL_RUNS + /* glsl */`
uniform sampler2D uCond;   // R bead height, G lane seed, B fine grain (tiling)
uniform float uL;          // length of a run on this pane group, metres
uniform float uBars;       // glazing bars per lane unit
uniform float uLap;        // metres between glass laps
uniform float uOutside;    // 0: inside face (opaque, a clear track shows the sky); 1: outside face (alpha = fog)
uniform float uReflect;    // outside only: how far a clear track is filled with sky colour instead of being see-through
uniform float uMilk;       // tone offset of this pane group (the hand: panes that do not quite match)
uniform vec2 uCrack;       // the cell (bar, lap) of the one cracked pane of this group, puttied over
uniform vec3 cHoney; uniform float uHoney, uHoneyX;   // golden hour: honey on the lit side (uHoneyX = sign / half width of the house)
uniform vec4 uWipe;        // a leaf that wipes this pane: xyz world position of its stalk, w its reach in metres (0 = none)
uniform vec3 uWipeA;       // x: the leaf's angle now (radians from up, about the pane's normal), y: half its swing, z: 1 if the pane faces -X/+X (use zy) else xy
uniform vec4 uCutA, uCutB;
varying vec2 vUv; varying vec3 vWp; varying vec3 vWn; varying vec3 vOp;
${GLSL_WALL_DEPTH}
void main(){
  if (archCut(vOp, uCutA, uCutB) > 0.5) discard;
  #ifdef WALL_DEPTH
  wallDepth(vWp); gl_FragColor = vec4(0.); return;     // (n8b) this pane's own geometry, drawn as the wall's depth where it stands before the wall
  #endif
  float wpx = max(fwidth(vUv.x), 1e-5);
  float wpy = max(fwidth(vUv.y), 1e-5);
  vec2 run = paneRuns(vUv.x, vUv.y, uL, wpx);
  float bx = vUv.x * uBars, by = vUv.y / max(uLap, 1e-3);
  vec2 cell = vec2(floor(bx), floor(by));
  float bw = wpx * uBars;                                  // one pixel in bar units
  float lw = wpy / max(uLap, 1e-3);                        // one pixel in lap units
  // THE BODY OF THE GLASS. Every pane is its own white: four quiet steps of pearl, the cast of the crate it was cut
  // from, about one in fifteen clearly odd, a share of them a touch warm. Held where a pane is a few pixels each way.
  float tone = h21(cell + 3.7), t2 = h21(cell + 17.9), t3 = h21(cell + 5.3);
  float batch = h21(floor(cell / vec2(6., 4.)) + 41.3);
  float paneSeen = smoothstep(1.5, 5., min(1. / bw, 1. / lw));
  float odd = step(0.935, t2);
  float quilt = floor(tone * 4.) * 0.055 + (batch - 0.5) * 0.07 + odd * 0.17;
  quilt = mix(0.085 + (batch - 0.5) * 0.07, quilt, paneSeen);
  float warm = step(0.72, t3) * (0.45 + 0.55 * odd) * paneSeen;
  vec4 cd = texture2D(uCond, vec2(vUv.x * 0.19, vUv.y * 0.47));
  vec4 cs = texture2D(uCond, vec2(vUv.x * 0.085, vUv.y * 0.21) + 0.37);   // the same beads at twice the size: a stipple that carries across a hall
  float near = 1. - smoothstep(0.012, 0.05, wpy);                        // beads only where a pixel is under ~3 cm
  float swell = cd.r + 0.12 * sin(uTime * 0.7 + cd.g * 6.283);
  float bead = smoothstep(0.62, 0.8, swell) * near;
  float stip = smoothstep(0.25, 0.7, cs.r + 0.08 * sin(uTime * 0.5 + cs.g * 6.283));
  float F = clamp(1. - run.x * 0.96 - bead * 0.3, 0.04, 1.);
  F = mix(F, 1., uSyringe * (1. - uFlush.y));
  F = max(F * (1. - run.x * uFlush.y), 0.04);
  if (uWipe.w > 0.) {
    vec3 wv = vWp - uWipe.xyz;
    vec2 w2 = mix(wv.xy, vec2(wv.z, wv.y), uWipeA.z);
    float wr = length(w2);
    float wa = atan(w2.x, w2.y + 1e-5 + step(wr, 1e-4));
    float band = smoothstep(0.3, 0.42, wr / uWipe.w) * (1. - smoothstep(0.93, 1.0, wr / uWipe.w));
    float inArc = 1. - smoothstep(uWipeA.y, uWipeA.y + 0.07, abs(wa));
    float fresh = 0.66 + 0.34 * exp(-abs(wa - uWipeA.x) * 3.2);
    float smear = 0.82 + 0.18 * sin(wr * 23. + 2. * sin(wa * 7.));
    F = mix(F, 0.04, band * inArc * fresh * smear * (1. - uSyringe));
  }
  vec3 milk = mix(cMilk, cPearl, clamp(uMilk + quilt + stip * 0.085 + (cd.b - 0.5) * 0.08 * near, 0., 1.));
  milk *= mix(vec3(1.), vec3(1., 0.972, 0.9), warm);
  // golden hour: the panes on the lit side of the house turn honey, the far side stays milk
  milk = mix(milk, cHoney * (1. - 0.6 * quilt), uHoney * smoothstep(-0.25, 0.9, vWp.x * uHoneyX));
  milk = mix(milk, cMilk, smoothstep(0.86, 0.97, cs.r) * 0.7);          // the one soft sheen on a bead
  // the syringing: the spray sheets down the fogged glass in pearl veils
  float veil = texture2D(uCond, vec2(vUv.x * 0.043, (vUv.y - uTime * 1.3) * 0.031)).r;
  milk = mix(milk, cPearl, uSyringe * 0.5 * smoothstep(0.4, 0.75, veil));
  vec3 n = normalize(vWn + vec3(0., 1e-4, 0.));
  vec3 dir = vWp - uLens; dir /= max(length(dir), 1e-4);
  float high = smoothstep(10., 22., vWp.y) * 0.62;                      // blue high on a vault, pearl lower down, whatever the gaze
  vec3 sky = mix(trackSky(max(dir.y, high)), trackSky(n.y * 0.75 + 0.12), uOutside);
  vec3 col = mix(sky, milk, F);
  col = mix(col, vec3(1.), max(run.y * 0.85, bead * smoothstep(0.8, 0.95, swell) * 0.5));   // the one soft white sheen
  float alpha = mix(1., 1. - (1. - F) * (1. - uReflect), uOutside);
  // the cracked pane, puttied over (one the glazier chose: uCrack; and one in several hundred besides)
  vec2 cq = abs(cell - uCrack);
  float crack = max(step(0.9982, h21(cell + 11.3)), step(cq.x + cq.y, 0.5));
  float cside = (fract(bx) - 0.3) - (fract(by) - 0.5) * 0.55 - 0.1 * sin(fract(by) * 9.);
  float pw = max(0.05, 1.3 * bw);                                       // the putty line, never under ~2.5 px
  float putty = crack * (1. - smoothstep(pw, pw + bw, abs(cside)));
  col = mix(col, mix(cMilk, cPearl, 0.22), crack * step(0., cside) * F * paneSeen);   // the two halves never sat flush again
  col = mix(col, mix(cPearl, cGrey, 0.55), putty); alpha = max(alpha, putty);
  #ifdef BARS_ONLY
  alpha = 0.;     // (n8) a sheet that draws this pane's own laps and bars and nothing else of it
  #endif
  // glass laps: a faint pearl line across
  float ld = 0.5 - abs(fract(by) - 0.5);
  float lap = (1. - smoothstep(0.75 * lw, 1.75 * lw, ld)) * smoothstep(6., 30., 1. / lw) * 0.3;
  col = mix(col, cPearl, lap * F);
  #ifdef BARS_ONLY
  alpha = lap * F;
  #endif
  // glazing bars: white iron with a grey-green rebate each side, never under 1.5 px
  float bd = 0.5 - abs(fract(bx) - 0.5);                   // distance to the nearest bar, bar units
  float seen = smoothstep(4., 14., 1. / bw);               // fade where bars converge under a few pixels
  float coreW = 0.022;
  float reb = 1. - smoothstep(max(coreW + 0.018, 0.9 * bw), max(coreW + 0.018, 0.9 * bw) + bw, bd);
  float core = 1. - smoothstep(coreW - 0.5 * bw, coreW + 0.5 * bw, bd);
  col = mix(col, cGrey, reb * seen * mix(0.5, 0.9, smoothstep(10., 60., 1. / bw)));
  col = mix(col, cMilk, core * seen);
  alpha = max(alpha, reb * seen);
  gl_FragColor = vec4(col, alpha);
}`;

// ---------------------------------------------------------------- white iron with its rebate line
// uv.x: 0..1 across one face of the member, uv.y: metres along it. aIron.x: face width in metres.
const IRON_VERT = /* glsl */`
attribute float aW;
varying vec2 vUv; varying float vW; varying vec3 vOp;
void main(){
  vUv = uv; vW = aW;
  vec4 p = vec4(position, 1.);
  #ifdef USE_INSTANCING
  p = instanceMatrix * p;
  #endif
  vOp = p.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * p;
}`;
const IRON_FRAG = GLSL_COMMON + /* glsl */`
uniform float uRivet;      // spacing of rivets in metres (0 = none)
uniform float uTone;       // 0 white iron ... 1 pearl (stone kerbs)
uniform vec4 uCutA, uCutB;
varying vec2 vUv; varying float vW; varying vec3 vOp;
void main(){
  if (archCut(vOp, uCutA, uCutB) > 0.5) discard;
  float px = max(fwidth(vUv.x), 1e-5);
  float e = 0.5 - abs(vUv.x - 0.5);                                     // 0 at either edge of the face
  float lw = max(0.012 / max(vW, 0.01), 0.8 * px);                      // 1.2 cm, never under ~1.5 px
  float line = 1. - smoothstep(lw, lw + px, e);
  line *= 1. - 0.2 * smoothstep(0.25, 0.6, px);                         // a face only a pixel or two wide still holds its line
  vec3 col = mix(mix(cMilk, cPearl, uTone), cGrey, line * 0.92);
  float sp = max(uRivet, 1e-3);
  vec2 rv = vec2((vUv.x - 0.5) * vW, (fract(vUv.y / sp) - 0.5) * sp);
  float pr = max(fwidth(vUv.y), 1e-5);
  float dot_ = (1. - smoothstep(0.016, 0.016 + pr, length(rv))) * step(1e-3, uRivet) * (1. - smoothstep(0.004, 0.012, pr));
  col = mix(col, cGrey, dot_ * 0.8 * step(0.08, vW));
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- leaf cards (every plant in the world)
// One shader, four programs: FAN (the analytic pleated palm fan) or atlas silhouettes, each as CORE
// (cards in contact, s < 0.25, alpha-tested, depth-written) and soft (everything, blended, no depth write).
// Per instance: instanceMatrix (card frame: origin at the stalk, +Y along the leaf, +Z its face; uniform
// scale = leaf size in metres) and aLeaf = (distance to the nearest pane in metres, seed 0..1, droop, atlas cell).
const LEAF_VERT = GLSL_COMMON + /* glsl */`
attribute vec4 aLeaf;
uniform float uInside;     // 1: sharpness follows the lens; 0 (seen from the snow): it follows the nearest pane
uniform vec2 uCentre;      // card-space point the card grows about
uniform float uConformR;   // > 0: lay the card onto the inside of a sphere of this radius (pressed prints)
uniform float uSway;       // radians a leaf swings on its stalk
uniform float uBreath;     // share by which a pressed leaf swells and shrinks
uniform float uHold;       // 0..1: how far a thing lying on the mirror (a lily pad) keeps its contact however far the lens is
uniform float uReach;      // scales the one distance: the accent holds its contact out to about 4 m (0.6), all else 1
uniform vec2 uCoreS;       // (polish 7) x: a card is a cut, opaque shape while s is under this (0.25; more = it keeps its cut edge as it pales: a tonal step, never a blur); y: the soft pass draws it only from this s on
varying vec2 vQ; varying float vS; varying float vSeed; varying float vCell; varying float vPress; varying vec3 vWp;
#ifdef ACCENT_LEAF
uniform float uLeafReach, uLeafHold; varying float vT;     // (n8) a flower of the accent carried by a plant: the reach and hold of that plant's OWN leaf material (its uniforms themselves), and the s a leaf of it has at this card's distance
#endif
void main(){
  mat4 im = instanceMatrix;
  float sc = length(im[0].xyz);
  vec4 cw = modelMatrix * im * vec4(uCentre, 0., 1.);
  float d = mix(aLeaf.x, distance(cw.xyz, uLens), uInside);
  if (aLeaf.x < 0.) d = 0.;                                  // pressed on a pane: contact, always crisp
  float s = contactS(d * uReach) * (1. - uHold);
  #ifdef ACCENT_LEAF
  vT = contactS(d * uLeafReach) * (1. - uLeafHold);
  #endif
  vS = s; vSeed = aLeaf.y; vCell = aLeaf.w; vQ = position.xy; vPress = aLeaf.x < 0. ? 1. : 0.;
  vec3 p = position;
  float ang = uSway * (sin(uTime * 0.7 + aLeaf.y * 39.) + 0.5 * sin(uTime * 1.9 + aLeaf.y * 17.)) * (0.4 + 0.6 * s);
  float ca = cos(ang), sa = sin(ang);
  p.xy = mat2(ca, -sa, sa, ca) * p.xy;
  float grow = (1. + 0.6 * s) * (1. + uBreath * sin(uTime * 0.45 + aLeaf.y * 21.));
  p.xy = uCentre + (p.xy - uCentre) * grow;
  float r2 = dot(p.xy, p.xy);
  p.z -= aLeaf.z * r2 * (1. + 0.15 * sin(uTime * 0.9 + aLeaf.y * 50.));
  if (uConformR > 0.) p.z += r2 * sc / (2. * uConformR);
  vec4 wp = modelMatrix * im * vec4(p, 1.);
  vWp = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #ifdef CORE
  if (s >= uCoreS.x) gl_Position = vec4(0., 0., 2., 1.);
  #else
  if (s < uCoreS.y) gl_Position = vec4(0., 0., 2., 1.);
  #endif
}`;
const LEAF_FRAG = GLSL_COMMON + /* glsl */`
uniform sampler2D uAtlas;  // 4 x 2 cells: R silhouette, G veins and folds
uniform float uGhost;      // soft pass only: overall opacity (ghosts seen through fog use < 1)
uniform float uFade;       // soft pass only: how far a card thins out as it loses contact (a big fan must not read as a shadow on the hull)
uniform float uScarlet;    // 1: the one accent (hibiscus); gone to milk by 4 m
uniform float uWhite;      // 1: a white flower (lily): milk with pearl folds
uniform float uMoth;       // 1: a butterfly wing, pearl with one viridian band; 2: a white moth (no band)
uniform float uInside; uniform vec2 uCoreS; uniform float uHoldCol;
varying vec2 vQ; varying float vS; varying float vSeed; varying float vCell; varying float vPress; varying vec3 vWp;
#ifdef ACCENT_LEAF
varying float vT;
#endif
${GLSL_WALL_DEPTH}
void main(){
  float s = vS;
  float seed = floor(vSeed * 1024. + 0.5) / 1024.;      // an interpolated constant is not exact: never hash it raw (speckled tips)
  float mask, fold, vein;
  #ifdef FAN
  float r = length(vQ);
  float a = atan(vQ.x, vQ.y + 1e-5 + step(r, 1e-4));
  float A = 2.8;
  float t = a / A;
  float seg = (t * 0.5 + 0.5) * 30.;
  float tri = abs(fract(seg) - 0.5) * 2.;                                 // 0 on a segment's midrib, 1 in the fold between two
  float id = floor(seg);
  float Rb = 1. - 0.12 * t * t + 0.05 * (h11(id + seed * 91.) - 0.5) * (1. - s);
  float split = (0.14 + 0.2 * h11(id * 3.3 + seed * 13.)) * (1. - 0.5 * s);     // tips split deeper on some segments
  float Rr = Rb * (1. - split * tri * tri);
  float pr = max(fwidth(r), 1e-4);
  float w = max(pr, max(s - 0.2, 0.) * 0.45);     // (polish 4) a fan still dark enough to be a shape keeps a cut edge: a dark soft fan read as a smear
  mask = (1. - smoothstep(Rr - w, Rr + w, r)) * smoothstep(-w, w, (A - abs(a)) * r + 0.02);
  float pa = max(fwidth(seg), 1e-4);
  // a soft fan still shows its fingers: milk between the segments, so it reads as a leaf and never as a cast shadow
  float ray = smoothstep(0.45, 0.95, tri) * smoothstep(0.22, 0.5, s) * (1. - smoothstep(0.3, 1.0, pa)) * smoothstep(0.1, 0.4, r);
  mask *= 1. - 0.62 * ray;
  float crisp = 1. - smoothstep(0.0, 0.3, s);
  fold = mix(0.42, smoothstep(0.5, 1., tri) * 0.75 + 0.25 * mod(id, 2.), (1. - smoothstep(0.35, 1.2, pa)) * smoothstep(0.03, 0.25, r));
  fold = mix(0.3, fold, crisp);
  fold = clamp(fold + (h11(seed * 37.7 + 0.19) - 0.45) * 0.75 * crisp + 0.3 * crisp * (1. - smoothstep(0.1, 0.55, r)), 0., 1.);   // each fan its own green, deeper toward its hub
  vein = (1. - smoothstep(0.035, 0.035 + pa, tri)) * crisp * smoothstep(0.22, 0.6, r) * (1. - smoothstep(0.03, 0.12, pa));
  vein = max(vein, (1. - smoothstep(0.017 - pr, 0.017 + pr, r)) * crisp * (1. - smoothstep(0.004, 0.02, pr)));   // the hastula, pale: a small cut disc (polish 4: it was a soft round patch of haze on every near fan)
  #elif defined(WING)
  // a butterfly's wing, worked out: a fore and a hind lobe out from the hinge (the card's line y = 0.25), half the
  // body lying along it. vCell is +1 or -1: which way the head points along the card's x.
  float dirn = vCell < 0. ? -1. : 1.;
  vec2 wq = vec2(vQ.x * dirn * 2., (vQ.y - 0.25) * 2.);                  // (along the body, head +; out along the wing, 0..1)
  float df = length((wq - vec2(0.2, 0.5)) / vec2(0.4, 0.5));
  float dh = length((wq - vec2(-0.3, 0.29)) / vec2(0.28, 0.31));
  float dd = -log(exp(-7. * df) + exp(-7. * dh)) / 7.;                    // the two lobes as one outline (no seam between fore and hind wing)
  float pw = max(fwidth(dd), 1e-4);
  float ww = max(pw, s * 0.55);
  float crisp = 1. - smoothstep(0.0, 0.3, s);
  float wBody = (1. - smoothstep(1. - 3. * pw - s, 1. + 3. * pw + s, length(wq / vec2(0.52, 0.085)))) * step(-0.1, wq.y);
  mask = max((1. - smoothstep(1. - ww, 1. + ww, dd)) * smoothstep(-0.02 - ww * 0.3, 0.02 + ww * 0.3, wq.y), wBody);
  // (polish 4) drawn as an insect, not a striped card: a milk wing with a broad deep-green margin scalloped along its edge,
  // the one viridian band a row of spots inside it, a dark body; no rays
  float wEdge = smoothstep(0.74, 0.8, dd + 0.3 * max(wq.x, 0.) * wq.y);       // broadest at the forewing's tip
  float wSpot = (1. - smoothstep(0.07, 0.1, length(wq - vec2(0.24, 0.52)))) * step(uMoth, 1.5);
  fold = 0.; vein = 0.;
  vec3 wingCol = mix(mix(cMilk, cPearl, 0.12), mix(cMilk, cPearl, 0.6), step(1.5, uMoth));     // (polish 6) pearl, as the brief has it: a cream wing was an eighth colour and a sticker
  wingCol = mix(wingCol, cVirid, wSpot * 0.0);
  wingCol = mix(wingCol, mix(mix(cVirid, cDeep, 0.35), mix(cPearl, cGrey, 0.8), step(1.5, uMoth)), wEdge);     // the margin, and the one viridian band across the wing
  wingCol = mix(wingCol, cDeep, wBody);
  wingCol = mix(wingCol, cMilk, smoothstep(0.1, 0.7, s) * 0.8);
  #else
  vec2 q = vec2(clamp(vQ.x + 0.5, 0., 1.), clamp(vQ.y, 0., 1.));
  float cellI = floor(vCell + 0.5);                          // a varying is never exactly 4.0: round it, or cell 4 wraps
  vec2 uv = (vec2(cellI - 4. * step(3.5, cellI), 1. - step(3.5, cellI)) + q) / vec2(4., 2.);
  vec4 tx = texture2D(uAtlas, uv, 5.2 * s * s * sqrt(max(s, 0.)) + 0.8 * step(0.5, cellI) * step(cellI, 1.5));   // a frond keeps its outline and rows of pinnae well past arm's length
  float edge = mix(0.5, 0.25, s);
  float aw = max(fwidth(tx.r), 0.02) + s * (0.15 + 0.3 * s);
  mask = smoothstep(max(edge - aw, 0.04), edge + aw, tx.r);
  vec2 bq = min(q, 1. - q);
  mask *= smoothstep(0.0, 0.14, min(bq.x, bq.y));                     // alpha is zero at the card's border, whatever the bias
  float crisp = 1. - smoothstep(0.0, 0.3, s);
  fold = mix(0.3, tx.b, crisp);
  // a frond's pinnae are not all one green: each card its own depth of fold, so a crown in contact is leaves on leaves, never one flat mass
  float isFr = step(0.5, cellI) * step(cellI, 1.5);
  float own = h11(seed * 57.3 + 0.31);
  fold = clamp(fold + isFr * (own - 0.42) * 0.8 * crisp, 0., 1.);
  s = clamp(s + isFr * (own - 0.5) * 0.16 * smoothstep(0.2, 0.4, s), 0., 1.);
  vein = tx.g * crisp * (1. - smoothstep(0.012, 0.035, max(fwidth(q.x), fwidth(q.y))));   // no veins on a card under ~40 px: they alias into ladders
  #endif
  vec3 col = leafTint(s, fold);
  vec3 acc = mix(cScarlet, mix(cScarlet, cDeep, 0.78), clamp(fold * 1.25, 0., 1.) * crisp);     // the throat and the petals' overlaps, darker
  col = mix(col, mix(acc, cMilk, smoothstep(0.18, 0.44, s) * 0.9 * (1. - uHoldCol) + uHoldCol * 0.45 * smoothstep(0.25, 0.6, s)), uScarlet);
  #ifdef ACCENT_LEAF
  // (n8) the flower has gone from its accent toward milk by exactly the share a flat leaf of its own plant has gone from viridian toward milk at this distance (the leaf's own law, leafTint, at the leaf's own s)
  { vec3 lt = leafTint(vT, 0.), va = cMilk - cVirid; col = mix(col, mix(acc, cMilk, clamp(dot(lt - cVirid, va) / dot(va, va), 0., 1.)), uScarlet); }
  #endif
  col = mix(col, mix(mix(cMilk, cGrey, fold * 0.55 + 0.08), cMilk, s), uWhite);
  col = mix(col, mix(cGrey, cMilk, 0.35 + 0.65 * uScarlet), vein * (0.6 + 0.35 * uScarlet));
  float sheen = (1. - smoothstep(0.0, 0.15, abs(vQ.y * 0.8 + vQ.x * 0.45 - 0.42 - 0.2 * vSeed))) * crisp * 0.09;
  #ifdef FAN
  sheen = 0.;                                         // (polish 4) nor on a fan: a straight soft band across a big near fan read as a seam; its pleats carry its light
  #endif
  col = mix(col, cMilk, sheen * (1. - vPress));       // not on a pressed print: across the rosette the sheen bands read as pale smears
  // (tried and withdrawn: gold over green prints as khaki and turns the scarlet to peach; leaves keep their own inks, the
  // light is carried by floor, water, mist and trunks)
  #ifdef WING
  col = wingCol;
  #endif
  float alpha = mask * mix(1., 0.5, smoothstep(uCoreS.x, 1., s));
  alpha *= smoothstep(0.3, 0.75, distance(vWp, uLens));     // (polish 6) no card is drawn through the lens itself
  #ifdef CORE
  if (alpha < 0.5) discard;
  gl_FragColor = vec4(col, 1.);
  #else
  alpha *= uGhost * (1. - uFade * smoothstep(max(0.3, uCoreS.x), max(0.62, uCoreS.x + 0.11), s));     // (polish 7) where a card keeps its cut edge further, it lets go just beyond: no pale soft shapes standing as haze behind the cut ones
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(col, alpha);
  #endif
  #ifdef WALL_DEPTH
  wallDepth(vWp);     // (n8b) these cards drawn again as the wall's depth: each cut by its own outline (the discards above), each where its own matrix has it
  #endif
}`;

// ---------------------------------------------------------------- trunk, stalks and other solid plant matter
// Opaque-ish solids under the same rule: fibre and folds crisp at the lens, a pale soft column far away
// (the silhouette itself fades, by facing, as contact is lost). uv = (turns round the stem, metres along).
const STEM_VERT = GLSL_COMMON + /* glsl */`
uniform float uInside;
uniform float uReach;      // scales the one distance (the great trunk holds its bark from across the pool)
attribute float aPane;     // metres to the nearest pane
varying vec2 vUv; varying float vS; varying float vFace; varying vec3 vWp;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
  float d = mix(aPane, distance(wp.xyz, uLens), uInside);
  vS = contactS(d * uReach);
  vec3 wn = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
  vec3 v = uLens - wp.xyz; v /= max(length(v), 1e-4);
  vFace = abs(dot(wn, v));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const STEM_FRAG = GLSL_COMMON + /* glsl */`
uniform float uScales;     // old leaf bases round the stem (0 = a plain stalk)
uniform float uFar;        // opacity left when contact is lost (a trunk stays a pale column, a stalk all but goes)
uniform float uInside;
varying vec2 vUv; varying float vS; varying float vFace; varying vec3 vWp;
void main(){
  float s = vS;
  float crisp = 1. - smoothstep(0.3, 0.8, s);
  vec2 p = vec2(vUv.x * max(uScales, 1.), vUv.y * 1.15);
  float row = floor(p.y);
  p.x += 0.5 * mod(row, 2.) + 0.13 * sin(row * 7.3);
  vec2 f = vec2(fract(p.x) - 0.5, fract(p.y));
  float shield = abs(f.x) * 1.5 + (1. - f.y) * 0.75;                 // an old leaf base: a shield hanging point down
  float pw = max(fwidth(shield), 1e-4);
  float edge = 1. - smoothstep(0.0, 0.07 + pw, abs(shield - 0.78));
  float under = smoothstep(0.78, 1.25, shield);                      // the fold under the next base up
  float fib = 0.5 + 0.5 * sin(vUv.x * 520. + sin(vUv.y * 9. + row) * 2.5 + f.y * 4.);
  float fw = max(fwidth(vUv.x * 520.), 1e-4);
  fib *= 1. - smoothstep(0.6, 2.2, fw);
  float fold = clamp(edge * 0.85 + under * 0.7 + fib * 0.22, 0., 1.) * step(0.5, uScales) + (1. - step(0.5, uScales)) * 0.35;
  vec3 near = mix(mix(mix(cGrey, cPearl, 0.25), mix(cGrey, cVirid, 0.7), step(0.5, uScales)), cDeep, fold * 0.9);
  near = mix(near, cVirid, 0.16);
  near = mix(mix(cVirid, cDeep, 0.62), near, step(0.5, uScales));      // (polish 4) a stalk at the lens is the dark ink of its leaf: a mid-green stalk lay across a near fan as a pale smear
  vec3 far = mix(cGrey, cMilk, 0.12 + 0.2 * smoothstep(0.6, 1., s));
  far = mix(mix(cVirid, cGrey, 0.65), far, step(0.5, uScales));      // a stalk goes by fading, not by whitening
  vec3 col = mix(far, near, crisp);
  col = mix(col, cMilk, (1. - smoothstep(0.0, 0.3, abs(vFace - 0.82))) * 0.16 * crisp * step(0.5, uScales));   // the one soft sheen (on trunks only)
  // (polish 4) where it stands in a bay's light: gold laid flat across it. (polish 6) only on the pale ground between the old leaf
  // bases: every base stays drawn in its dark ink, so a trunk in the sun is still a trunk and never a cream pole
  col = mix(col, cSun, sunAt(vWp, max(fwidth(vWp.y), 0.02)) * uInside * 0.56 * (1. - smoothstep(0.12, 0.45, fold) * crisp));
  float soft = mix(0.02, 0.75, s);
  float alpha = smoothstep(0.0, soft, vFace) * mix(1., uFar, smoothstep(0.25, 0.62, s));
  alpha *= mix(smoothstep(0.55, 1.4, distance(vWp, uLens)), 1., step(0.5, uScales));     // (polish 6) a stalk or a frond's rib lets go within arm's length: at the lens it was a grey blade across the frame
  if (alpha < 0.2 * step(0.5, uScales) + 0.01) discard;                // a trunk's faded rim must not hold depth against the prints behind
  gl_FragColor = vec4(col, alpha);
}`;

// ---------------------------------------------------------------- the pool: a flat mirror of the dome, worked out by ray
const FLAT_VERT = /* glsl */`
varying vec3 vWp; varying vec3 vOp; varying vec2 vUv;
void main(){ vOp = position; vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const POOL_FRAG = GLSL_COMMON + GLSL_RUNS + GLSL_DAPPLE + /* glsl */`
uniform vec3 uDomeC;       // world position of the hull's centre (on the axis at the springing)
uniform vec4 uDome;        // R, run length L, arc from apex to rosette rim, lanes round the dome
uniform vec4 uRos;         // rosette: radius, scallops, phase, bays
varying vec3 vWp;
void main(){
  vec3 V = vWp - uLens; V /= max(length(V), 1e-4);
  vec2 nr = vec2(0.); float crest = 0.;
  vec2 pl = vWp.xz - uDomeC.xz;
  for (int k = 0; k < 5; k++) {                       // rings: a frog, a drop from a rib; each lives about 3.5 s
    float fk = float(k);
    float T = uTime / (3.4 + fk * 0.41) + fk * 0.23;
    float cyc = floor(T), ph = fract(T);
    vec2 c = (vec2(h21(vec2(cyc, fk)), h21(vec2(fk + 7., cyc))) - 0.5) * 21.;
    vec2 dl = pl - c; float dist = length(dl);
    float rad = ph * 3.4;
    float env = exp(-abs(dist - rad) * 2.4) * (1. - ph) * (1. - ph);
    float wv = sin((dist - rad) * 8.) * env;
    nr += dl / max(dist, 1e-3) * wv * 0.1;
    crest += max(wv, 0.) * env;
  }
  nr += 0.0035 * vec2(sin(vWp.x * 1.7 + uTime * 0.6) + sin(vWp.z * 2.3 - uTime * 0.5), sin(vWp.z * 1.9 + uTime * 0.7) + sin(vWp.x * 2.6 + uTime * 0.4));
  vec3 Rd = reflect(V, normalize(vec3(nr.x, 1., nr.y)));
  // a painter's mirror: the water is tilted toward what is overhead, so the rosette and its meridians are doubled
  // between the pads from the walk as well as from above
  Rd.y = abs(Rd.y) + 1.25; Rd /= max(length(Rd), 1e-4);
  vec3 oc = vWp - uDomeC;
  float R = uDome.x;
  float b = dot(oc, Rd), c = dot(oc, oc) - R * R;
  vec3 hit = oc + Rd * (-b + sqrt(max(b * b - c, 0.)));
  if (hit.y < 0.) {
    float a = max(dot(Rd.xz, Rd.xz), 1e-5), bb = dot(oc.xz, Rd.xz), cc = dot(oc.xz, oc.xz) - R * R;
    hit = oc + Rd * ((-bb + sqrt(max(bb * bb - a * cc, 0.))) / a);
  }
  float hz = hit.z; if (abs(hz) < 1e-4) hz = 1e-4;
  float turn = fract(atan(hit.x, hz) / 6.2831853 + 1.);
  float lane = turn * uDome.w;
  float e = asin(clamp(hit.y / R, 0., 1.));
  float v = hit.y >= 0. ? R * (1.5707963 - e) - uDome.z : R * 1.5707963 - uDome.z - hit.y;
  float wpx = min(max(fwidth(lane), 1e-5), 0.5);
  float wb = min(fwidth(turn * uRos.w), 0.5);
  float rh = length(hit.xz);
  float pr = max(fwidth(rh), 1e-3);
  vec2 run = paneRuns(lane, v, uDome.y, wpx);
  vec3 col = mix(trackSky(Rd.y), cMilk, 1. - run.x * 0.96);
  float rb = 0.5 - abs(fract(turn * uRos.w) - 0.5);
  float rw = 0.035 / max(cos(e), 0.2);
  col = mix(col, cGrey, (1. - smoothstep(rw, rw + wb, rb)) * 0.6);
  float az = turn * 6.2831853;
  float edgeR = uRos.x - 1.5 * abs(sin(az * uRos.y * 0.5 + uRos.z));
  float ros = (1. - smoothstep(edgeR - pr - 0.1, edgeR + pr + 0.1, rh)) * step(0., hit.y);
  ros *= 1. - 0.8 * (1. - smoothstep(0.25, 0.7, abs(rh - 9.9))) * step(0.3, abs(sin(az * 5. + 1.)));
  float pleat = abs(fract(az * uRos.y * 4.77) - 0.5) * 2.;
  float pfw = fwidth(az * uRos.y * 4.77);
  pleat = mix(0.5, pleat, 1. - smoothstep(0.15, 0.6, pfw));      // no pleat a pixel cannot hold (it broke into moire under the lens)
  col = mix(col, mix(mix(cGrey, cVirid, 0.55), cVirid, smoothstep(0.4, 1., pleat) * 0.7), ros * 0.34);   // a reflection, a tone paler than any leaf
  float ax = abs(oc.x * Rd.z - oc.z * Rd.x) / max(length(Rd.xz), 1e-3);
  col = mix(col, mix(cGrey, cMilk, 0.55), (1. - smoothstep(0.4, 1.7, ax)) * step(dot(oc.xz, Rd.xz), 0.) * 0.6);
  // the water: dark and still under the glass it mirrors (grey-green going to viridian), so the gold that falls across it glows
  float lum = dot(col, vec3(0.3, 0.5, 0.2));
  col = mix(mix(cVirid, cDeep, 0.22), col, 0.12 + 0.3 * (1. - smoothstep(0.5, 0.8, lum)));     // (polish 6) deeper: the one dark mirror under the white hull
  float pxw = max(fwidth(vWp.x), fwidth(vWp.z));
  float sun = sunBand(vWp.xz + nr * 9., pxw) * (1. - 0.85 * dapple(vWp.xz * 0.8 + nr * 9. + 31., pxw));     // (polish 7) the crown stands in the light: fan and leaf shapes lie in the gold on the water
  col = mix(col, mix(cSun, col, 0.3), sun);
  col = mix(col, cMilk, clamp(crest, 0., 1.) * 0.7);    // one soft white sheen on a ring's crest
  gl_FragColor = vec4(col, 1.);
}`;
// The floor: pale paving in rings, joints drawn grey-green where a pixel can hold them, glow further off.
const FLOOR_FRAG = GLSL_COMMON + GLSL_DAPPLE + /* glsl */`
uniform float uInside;
varying vec3 vWp; varying vec3 vOp;
void main(){
  float r = length(vOp.xz), a = atan(vOp.x, vOp.z + 1e-4);
  float s = contactS(mix(12., distance(vWp, uLens), uInside));
  float ring = floor(r / 1.5);
  vec2 p = vec2(a / 6.2831853 * floor(6.2831853 * (ring + 0.5) * 1.5 / 2.2) + 0.37 * ring, r / 1.5);
  vec2 f = 0.5 - abs(fract(p) - 0.5);
  vec2 w = max(fwidth(p), vec2(1e-4));
  w.x = min(w.x, 0.5);
  // joints are soft grooves, never a drawn line (the only hard line in this house is iron)
  float jt = max((1. - smoothstep(0.0, 0.05 + w.x, f.x)) * (1. - smoothstep(0.15, 0.4, w.x)), (1. - smoothstep(0.0, 0.075 + w.y, f.y)) * (1. - smoothstep(0.15, 0.4, w.y)));
  vec3 col = mix(mix(cPearl, cMilk, 0.45 + 0.2 * h21(vec2(floor(p.x), ring))), cMilk, 0.35 + 0.13 * smoothstep(0.3, 1., s));
  col = mix(col, mix(cPearl, cGrey, 0.3), jt * 0.5 * (1. - smoothstep(0.35, 0.85, s)));
  // the second key: wet stone out of the sun is a full tone of pearl under the glass; where a bay's light falls it is gold
  float pxm = max(fwidth(vWp.x), fwidth(vWp.z));
  float sun = sunBand(vWp.xz, pxm) * uInside * (1. - 0.9 * dapple(vWp.xz, pxm) * smoothstep(17., 19., r));     // leaves stand in the light over the walk and the beds, not over the pool's kerb
  col = mix(col, mix(cPearl, cGrey, 0.4 + 0.2 * jt), 0.74 * uInside * (1. - 0.45 * smoothstep(0.5, 1., s)));
  float bed = smoothstep(20.5, 20.62, r) * (1. - (1. - smoothstep(4.0, 4.2, abs(vOp.x))) * step(12., abs(vOp.z))) * uInside;
  float edging = (1. - smoothstep(0.1, 0.16, abs(r - 20.4))) * uInside;
  col = mix(col, mix(mix(cGrey, cVirid, 0.7), mix(cPearl, cGrey, 0.75), smoothstep(0.55, 1.0, contactS(mix(12., distance(vWp, uLens), uInside) * 0.4))), bed);     // (polish 7) planted earth holds its ink across the hall
  col = mix(col, cSun * (1. - 0.07 * jt), sun * (1. - 0.72 * bed));
  col = mix(col, mix(cMilk, cPearl, 0.3), edging);
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- air: mist shelves and falling drops
const MIST_FRAG = GLSL_COMMON + /* glsl */`
uniform float uInside; uniform float uStrength; uniform float uEdge; uniform vec2 uSpan;
varying vec3 vWp; varying vec3 vOp; varying vec2 vUv;
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec2 dl = vWp.xz - uLens.xz;
  float dy = abs(vWp.y - uLens.y);
  float curl = 1.4 * exp(-dot(dl, dl) / 40.) * (1. - smoothstep(0., 4., dy));       // it curls where the lens breaks through
  vec2 p = vOp.xz + vec2(-dl.y, dl.x) * curl * 0.35 + vec2(uTime * 0.4 + vOp.y * 7.3, vOp.y * 3.1);
  float n = vnoise(p * 0.085) * 0.6 + vnoise(p * 0.21 + 3.7) * 0.28 + vnoise(p * 0.55 - uTime * 0.05) * 0.12;
  float a = smoothstep(0.42, 0.74, n) * uStrength * uInside;
  a *= 0.05 + 0.95 * smoothstep(9., 22., length(vOp.xz));                              // thin over the middle, so the vault stays readable
  a *= smoothstep(0.6, 2.6, vWp.y - uLens.y);     // (polish 7) a shelf is only ever seen from below, against the glass: looked down through, it lay over the pool as a pane of haze
  a *= 1. - smoothstep(uEdge - 6., uEdge, length(vOp.xz));
  // POLISH 4: mist is never a slab. It has no straight edge (it frays out by its own noise well short of every edge of its
  // sheet, vUv), it is never laid over what the lens is close to (nothing within 16 m, so no leaf in contact is cut by it),
  // and it thins to wisps: only the crests of the noise are left.
  vec2 eb = min(vUv, 1. - vUv) * uSpan;                                            // metres to the sheet's nearest edges
  float fray = min(eb.x, eb.y) - 9. * vnoise(vOp.xz * 0.13 + 5.);
  a *= smoothstep(1., 9., fray);
  a *= smoothstep(13., 30., length(dl));
  a *= smoothstep(0.5, 0.8, n);
  float sun = sunAt(vWp, 0.3);
  gl_FragColor = vec4(mix(cMilk, cSun, sun * 0.8), a * (1. + 0.8 * sun));
}`;
// aDrop = (x, top y, z, seed) of a drip; a quad of position.xy in -1..1; falls under gravity, then waits.
const DROP_VERT = GLSL_COMMON + /* glsl */`
attribute vec4 aDrop;
uniform float uResY; uniform float uFloorY;
varying float vA; varying vec2 vQ;
void main(){
  float ph = fract(uTime / 5.5 + aDrop.w) * 5.5;
  float y = aDrop.y - 4.9 * ph * ph;
  float live = step(uFloorY, y);
  float len = 0.12 + 0.045 * 9.8 * ph;
  vec4 mv = viewMatrix * modelMatrix * vec4(aDrop.x, y, aDrop.z, 1.);
  vec4 up = viewMatrix * modelMatrix * vec4(0., 1., 0., 0.);
  float px = 2. * max(-mv.z, 0.1) / max(projectionMatrix[1][1] * uResY, 1.);
  mv.xyz += up.xyz * position.y * len * 0.5;
  mv.x += position.x * max(0.011, 0.8 * px);
  vA = live * (1. - smoothstep(25., 60., -mv.z)) * smoothstep(3., 7., -mv.z); vQ = position.xy;     // (polish 6: a drop a hand's breadth from the lens was a grey blade across the frame)
  gl_Position = projectionMatrix * mv;
  if (live < 0.5) gl_Position = vec4(0., 0., 2., 1.);
}`;
const DROP_FRAG = GLSL_COMMON + /* glsl */`
uniform float uInside;
varying float vA; varying vec2 vQ;
void main(){
  float a = vA * uInside * (1. - abs(vQ.x)) * smoothstep(-1., 0.6, vQ.y) * 0.85;
  gl_FragColor = vec4(mix(cGrey, cMilk, smoothstep(0.2, 1., vQ.y) * 0.7), a);
}`;

// ---------------------------------------------------------------- textures
// (polish 7: in three parts, so that the world can hand a frame back between them; the draws and their order are as they were)
function condGrain(rng) {
  // 512 px tiling data texture, written directly (canvas gradients are far too slow): R bead height, G bead phase, B grain
  const S = 512, d = new Uint8Array(S * S * 4);
  let h = (rng() * 0xffffffff) >>> 0;
  for (let i = 0; i < d.length; i += 4) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; d[i + 2] = 96 + (h >>> 26); d[i + 3] = 255; }
  return d;
}
function condBeads(d, rng, n) {
  const S = 512;
  for (let i = 0; i < n; i++) {
    const x = rng() * S, y = rng() * S, big = rng() < 0.12, r = big ? 5 + rng() * 5 : 1.6 + rng() * 3.2, ph = Math.floor(rng() * 255), ry = r * (1.05 + rng() * 0.35);
    const x0 = Math.floor(x - r), x1 = Math.ceil(x + r), y0 = Math.floor(y - ry), y1 = Math.ceil(y + ry);
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      const q = Math.hypot((px - x) / r, (py - y) / ry);
      if (q >= 1) continue;
      const v = Math.round(255 * (1 - q * q * q)), k = ((((py % S) + S) % S) * S + (((px % S) + S) % S)) * 4;
      if (v > d[k]) { d[k] = v; d[k + 1] = ph; }
    }
  }
}
function condFinish(d) {
  const S = 512;
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
function condensationTexture(rng) { const d = condGrain(rng); condBeads(d, rng, 1300); return condFinish(d); }

// ---------------------------------------------------------------- geometry helpers
// A flat card grid in the XY plane (z = 0), for leaf cards.
export function cardGeometry(x0, x1, y0, y1, nx = 1, ny = 1) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0, nx, ny);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
  return g;
}
// White iron: sweep a section along a path. pts: Vector3[]; nrm: unit Vector3[] (the section's "up" at each
// point); faces: [[n0, b0, n1, b1], ...] line segments of the section in metres (n along nrm, b along tangent x nrm).
// Every face is one strip with uv = (0..1 across, metres along) and aW = its width, which is what the iron
// material needs to draw the rebate line on both edges of every face.
export function ironSweep(pts, nrm, faces) {
  const n = pts.length, pos = [], uv = [], aw = [], idx = [];
  const T = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  const frames = [];
  let run = 0;
  for (let i = 0; i < n; i++) {
    T.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]);
    if (T.lengthSq() < 1e-10) T.set(0, 1, 0);
    T.normalize();
    B.crossVectors(T, nrm[i]); if (B.lengthSq() < 1e-10) B.set(1, 0, 0); B.normalize();
    if (i > 0) run += pts[i].distanceTo(pts[i - 1]);
    frames.push([nrm[i].clone(), B.clone(), run]);
  }
  for (const f of faces) {
    const w = Math.hypot(f[2] - f[0], f[3] - f[1]), base = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const [N, Bn, v] = frames[i];
      for (let e = 0; e < 2; e++) {
        P.copy(pts[i]).addScaledVector(N, f[e * 2]).addScaledVector(Bn, f[e * 2 + 1]);
        pos.push(P.x, P.y, P.z); uv.push(e, v); aw.push(w);
      }
      if (i < n - 1) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 1));
  g.setIndex(idx);
  return g;
}
// Section of a riveted I-beam, depth d (along nrm, centred) and flange width w.
export const iSection = (d = 0.3, w = 0.14) => [[-d / 2, 0, d / 2, 0], [d / 2, -w / 2, d / 2, w / 2], [-d / 2, -w / 2, -d / 2, w / 2]];
// Section of a small closed bar (four faces).
export const boxSection = (d = 0.08, w = 0.08) => [[-d / 2, -w / 2, d / 2, -w / 2], [d / 2, -w / 2, d / 2, w / 2], [d / 2, w / 2, -d / 2, w / 2], [-d / 2, w / 2, -d / 2, -w / 2]];

// ---------------------------------------------------------------- the style kit
// The style's two canvases, each drawn in a build step of its own (pass the result to makeStyle as opts.tex). The same
// rng fork and the same order of draws as makeStyle makes by itself.
export async function makeStyleTextures(ctx) {
  const rng = (ctx.rng.fork ? ctx.rng.fork('fph-style') : ctx.rng);
  await ctx.yield();
  const d = condGrain(rng);
  await ctx.yield();
  for (let k = 0; k < 4; k++) { condBeads(d, rng, 325); await ctx.yield(); }
  const cond = condFinish(d);
  await ctx.yield();
  const atlas = leafAtlasTexture(rng);
  await ctx.yield();
  return { cond, atlas };
}
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  const palette = {};
  NAMES.forEach((n, i) => { palette[n] = new THREE.Color(hex[i] || PALETTE[i]); });
  const made = opts.tex || null, rng = made ? null : (ctx.rng.fork ? ctx.rng.fork('fph-style') : ctx.rng);
  const cond = made ? made.cond : condensationTexture(rng);
  const atlas = made ? made.atlas : leafAtlasTexture(rng);
  // shared uniform objects: one {value} each, referenced by every material, driven by update()
  const U = {
    uTime: { value: 0 }, uLens: { value: new THREE.Vector3(0, 3, -1000) },
    cMilk: { value: palette.milk }, cPearl: { value: palette.pearl }, cGrey: { value: palette.greyGreen },
    cVirid: { value: palette.viridian }, cDeep: { value: palette.deep }, cScarlet: { value: palette.scarlet }, cBlue: { value: palette.blue },
    uRunDensity: { value: opts.runDensity ?? 0.8 }, uSyringe: { value: 0 }, uFlush: { value: new THREE.Vector2(0, 0) }, uInside: { value: 0 },
    uCond: { value: cond }, uAtlas: { value: atlas }, uResY: { value: 720 },
    cSun: { value: new THREE.Color(opts.sun || '#F6E2A6') }, uSun: { value: new THREE.Vector4(0.42 * (opts.sunX ?? 1), 0.9075, 13, opts.sunK ?? 1) },
    cHoney: { value: new THREE.Color(opts.honey || '#EBD29A') }, uHoney: { value: opts.honey ? (opts.honeyK ?? 1) : 0 }, uHoneyX: { value: opts.honeyX ?? 1 / 14 },
  };
  const materials = [];
  const keep = (m) => { materials.push(m); return m; };
  const style = {
    palette, uniforms: U, textures: { cond, atlas }, cardGeometry, ironSweep, iSection, boxSection, DOME,
    glsl: { common: GLSL_COMMON, runs: GLSL_RUNS, dapple: GLSL_DAPPLE },
    // A pane group. Geometry needs uv = (lane coordinate, metres down from the pane's top edge) and normals.
    // o: { outside: bool, L: run length m, bars: bars per lane, lap: m, reflect: 0..1, milk: 0..0.3 }.
    // Inside faces are opaque (BackSide of an outward-wound shell, or pass side); outside faces blend.
    glass(o = {}) {
      const out = !!o.outside;
      return keep(new THREE.ShaderMaterial({
        vertexShader: PANE_VERT, fragmentShader: PANE_FRAG,
        uniforms: { ...U, uL: { value: o.L ?? 12 }, uBars: { value: o.bars ?? 0.75 }, uLap: { value: o.lap ?? 1.2 },
          uOutside: { value: out ? 1 : 0 }, uReflect: { value: o.reflect ?? 0.0 }, uMilk: { value: o.milk ?? 0.0 },
          uCrack: { value: o.crack || new THREE.Vector2(-999, -999) },
          uWipe: { value: o.wipe || new THREE.Vector4(0, 0, 0, 0) }, uWipeA: { value: o.wipeA || new THREE.Vector3(0, 0.6, 0) },
          uCutA: { value: o.cutA || new THREE.Vector4(1, 0, 0, 0) }, uCutB: { value: o.cutB || new THREE.Vector4(1, 0, 0, 0) } },
        side: o.side ?? (out ? THREE.FrontSide : THREE.BackSide), transparent: out, depthWrite: !out,
      }));
    },
    // White iron with the grey-green rebate line on both edges of every face (geometry from ironSweep).
    iron(o = {}) {
      return keep(new THREE.ShaderMaterial({ vertexShader: IRON_VERT, fragmentShader: IRON_FRAG,
        uniforms: { ...U, uRivet: { value: o.rivet ?? 0 }, uTone: { value: o.tone ?? 0 }, uCutA: { value: o.cutA || new THREE.Vector4(1, 0, 0, 0) }, uCutB: { value: o.cutB || new THREE.Vector4(1, 0, 0, 0) } }, side: THREE.DoubleSide }));
    },
    // Leaf cards. o: { fan: bool (analytic palm fan, else atlas cell from aLeaf.w), core: bool, centre: [x,y],
    // conformR, sway, breath, ghost, scarlet }. Use core + soft on the same InstancedMesh data (two meshes).
    leaf(o = {}) {
      const core = !!o.core;
      const m = new THREE.ShaderMaterial({
        vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, defines: {},
        uniforms: { ...U, uCentre: { value: new THREE.Vector2(...(o.centre || (o.fan ? [0, 0.3] : [0, 0.5]))) },
          uConformR: { value: o.conformR ?? 0 }, uSway: { value: o.sway ?? 0.05 }, uBreath: { value: o.breath ?? 0 },
          uHold: { value: o.hold ?? 0 }, uReach: { value: o.reach ?? 1 }, uCoreS: { value: new THREE.Vector2(o.coreS ?? 0.25, o.softFrom ?? 0) }, uHoldCol: { value: o.holdCol ?? 0 }, uGhost: { value: o.ghost ?? 1 }, uFade: { value: o.fade ?? 0 }, uScarlet: { value: o.scarlet ? 1 : 0 }, uWhite: { value: o.white ? 1 : 0 }, uMoth: { value: o.moth ?? 0 } },
        side: THREE.DoubleSide, transparent: !core || !!o.afterGlass, depthWrite: core, depthTest: true,
      });
      if (o.fan) m.defines.FAN = 1;
      if (core) m.defines.CORE = 1;
      if (o.moth && !o.fan) m.defines.WING = 1;
      if (o.accentLeaf) { m.defines.ACCENT_LEAF = 1; m.uniforms.uLeafReach = o.accentLeaf.uniforms.uReach; m.uniforms.uLeafHold = o.accentLeaf.uniforms.uHold; }     // (n8) o.accentLeaf: the leaf material of the plant that carries these flowers; its own uniform objects are shared, no number is copied
      return keep(m);
    },
    // Trunks, stalks, stems: tube geometry with uv = (turns, metres) and aPane (metres to the nearest pane).
    // o = { scales (old leaf bases round a trunk; 0 = stalk), far (opacity left far away), depthWrite }.
    stem(o = {}) {
      return keep(new THREE.ShaderMaterial({ vertexShader: STEM_VERT, fragmentShader: STEM_FRAG,
        uniforms: { ...U, uScales: { value: o.scales ?? 0 }, uFar: { value: o.far ?? 0.7 }, uReach: { value: o.reach ?? 1 } }, transparent: true, depthWrite: o.depthWrite ?? true, side: THREE.FrontSide }));
    },
    // The pool mirror (hero) and the pale ringed floor; both flat meshes in the hero's local XZ plane.
    pool(o = {}) {
      return keep(new THREE.ShaderMaterial({ vertexShader: FLAT_VERT, fragmentShader: POOL_FRAG, uniforms: { ...U,
        uDomeC: { value: new THREE.Vector3(0, DOME.drumH, 0) }, uDome: { value: new THREE.Vector4(DOME.R, o.L ?? 41.4, DOME.R * Math.asin(DOME.rosetteR / DOME.R), DOME.bays * DOME.lanesPerBay) },
        uRos: { value: new THREE.Vector4(DOME.rosetteR, o.scallops ?? 15, o.phase ?? 0, DOME.bays) } } }));
    },
    floor() { return keep(new THREE.ShaderMaterial({ vertexShader: FLAT_VERT, fragmentShader: FLOOR_FRAG, uniforms: { ...U } })); },
    // A level mist shelf (any flat mesh): milk at alpha, gone within 1.5 m of the lens height, curling round the lens.
    mist(o = {}) {
      return keep(new THREE.ShaderMaterial({ vertexShader: FLAT_VERT, fragmentShader: MIST_FRAG, uniforms: { ...U, uStrength: { value: o.strength ?? 0.36 }, uEdge: { value: o.edge ?? 29 }, uSpan: { value: new THREE.Vector2(...(o.span || [60, 60])) } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    },
    // Falling drops: InstancedMesh of a 2 x 2 PlaneGeometry with instanced aDrop = (x, top y, z, seed); drive uResY.
    drops(o = {}) {
      return keep(new THREE.ShaderMaterial({ vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, uniforms: { ...U, uResY: U.uResY, uFloorY: { value: o.floorY ?? 0.4 } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    },
    // Fill aLeaf for an InstancedMesh of cards: arr of [paneDist, seed, droop, cell].
    leafAttr(geo, arr) {
      const a = new Float32Array(arr.length * 4);
      for (let i = 0; i < arr.length; i++) a.set(arr[i], i * 4);
      geo.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(a, 4));
      return geo;
    },
    setInside(v) { U.uInside.value = v; },
    setSyringe(v) { U.uSyringe.value = clamp(v, 0, 1); },
    setFlush(front, strength) { U.uFlush.value.set(front, clamp(strength, 0, 1)); },
    _v2: new THREE.Vector2(),
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) U.uLens.value.setFromMatrixPosition(camera.matrixWorld);
      if (ctx.renderer) U.uResY.value = ctx.renderer.getDrawingBufferSize(style._v2).y;
    },
    dispose() { cond.dispose(); atlas.dispose(); for (const m of materials) m.dispose(); },
  };
  return style;
}

// ---------------------------------------------------------------- the dome shell
// Arch openings cut in the shell (fragment discard, exact): halfWidth, height, rise of the head.
const ARCH_OUT_DEFAULT = { hw: 11, h: 22, rise: 11 };     // +Z: the apse arch, the way out
const ARCH_IN_DEFAULT = { hw: 11.5, h: 12, rise: 6.5 };   // -Z: the fern wing's barrel vault
const archTop = (A, x) => A.h - A.rise + A.rise * Math.sqrt(Math.max(0, 1 - (x / A.hw) * (x / A.hw)));
// point on the shell above ground height y at horizontal offset x, on the +Z (sgn 1) or -Z side
function shellZ(x, y, sgn, out = new THREE.Vector3()) {
  const R = DOME.R, dy = Math.max(0, y - DOME.drumH);
  return out.set(x, y, sgn * Math.sqrt(Math.max(0.01, R * R - x * x - dy * dy)));
}
function domeShellGeometry() {
  const { R, drumH, bays, lanesPerBay, rosetteR } = DOME;
  const seg = bays * 2, rows = [];
  const arcTop = R * Math.asin(rosetteR / R);                     // arc from the apex to the rosette rim
  for (let j = 0; j <= 4; j++) rows.push({ r: R, y: drumH * j / 4, ny: 0, nr: 1, v: R * Math.PI / 2 - arcTop + drumH * (1 - j / 4) });
  const NV = 26;
  for (let j = 1; j <= NV; j++) {
    const e = (j / NV) * Math.PI / 2;
    rows.push({ r: Math.max(R * Math.cos(e), 0.02), y: drumH + R * Math.sin(e), ny: Math.sin(e), nr: Math.cos(e), v: R * (Math.PI / 2 - e) - arcTop });
  }
  const pos = [], nor = [], uv = [], idx = [];
  for (let j = 0; j < rows.length; j++) {
    const w = rows[j];
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * TAU, s = Math.sin(a), c = Math.cos(a);
      pos.push(w.r * s, w.y, w.r * c); nor.push(w.nr * s, w.ny, w.nr * c);
      uv.push((i / seg) * bays * lanesPerBay, w.v);
    }
  }
  const W = seg + 1;
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < seg; i++) {
    const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// one rib from the foot of the drum up the hull to elevation eTop (radians), in the plane x = 0, +Z side
function ribGeometry(eTop, depth, flange) {
  const { R, drumH } = DOME, pts = [], nrm = [];
  for (let j = 0; j <= 5; j++) { pts.push(new THREE.Vector3(0, drumH * j / 5, R)); nrm.push(new THREE.Vector3(0, 0, 1)); }
  const n = Math.max(4, Math.round(eTop / (Math.PI / 2) * 30));
  for (let j = 1; j <= n; j++) {
    const e = eTop * j / n;
    pts.push(new THREE.Vector3(0, drumH + R * Math.sin(e), R * Math.cos(e))); nrm.push(new THREE.Vector3(0, Math.sin(e), Math.cos(e)));
  }
  return ironSweep(pts, nrm, iSection(depth, flange));
}
// a horizontal hoop at elevation e on the hull (or at height y on the drum when e < 0)
function hoopGeometry(e, y, section, off = 0) {
  const { R, drumH } = DOME, pts = [], nrm = [];
  const r = e < 0 ? R : R * Math.cos(e), yy = e < 0 ? y : drumH + R * Math.sin(e);
  const N = new THREE.Vector3(e < 0 ? 1 : Math.cos(e), e < 0 ? 0 : Math.sin(e), 0);
  const n = r > 12 ? 192 : 96;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a);
    pts.push(new THREE.Vector3((r + off * N.x) * s, yy + off * N.y, (r + off * N.x) * c));
    nrm.push(new THREE.Vector3(N.x * s, N.y, N.x * c));
  }
  return ironSweep(pts, nrm, section);
}
// the iron frame of an arch opening, following the shell
function archFrameGeometry(A, sgn, section) {
  const pts = [], nrm = [], n = 56, c = new THREE.Vector3(0, DOME.drumH, 0);
  const add = (x, y) => {
    const p = shellZ(x, y, sgn); pts.push(p);
    const nn = p.clone().sub(c); if (y <= DOME.drumH) nn.y = 0; nrm.push(nn.normalize());
  };
  const side = A.h - A.rise;
  for (let j = 0; j < 6; j++) add(-A.hw, side * j / 6);
  for (let j = 0; j <= n; j++) { const t = -1 + 2 * j / n, x = A.hw * Math.sin(t * Math.PI / 2); add(x, archTop(A, x)); }
  for (let j = 5; j >= 0; j--) add(A.hw, side * j / 6);
  return ironSweep(pts, nrm, section);
}

// The silhouette atlas: 4 x 2 cells of 256 px; each shape sits in the middle half of its cell (64 px margins, so
// the mip-biased read can soften it without touching a neighbour). R silhouette, G veins, B folds.
// Cells: 0 hand (fan) leaf, 1 fern frond length, 2 lance leaf, 3 fatsia, 4 flower (hibiscus, lily),
// 5 lily pad, 6 gecko, 7 heart leaf. A card's q = (0..1, 0..1) covers the whole cell: the stalk is at q = (0.5, 0.25).
export const ATLAS_CELLS = { hand: 0, frond: 1, lance: 2, fatsia: 3, flower: 4, pad: 5, gecko: 6, heart: 7 };
function leafAtlasTexture(rng) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 512);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const R = '#ff0000', G = '#00ff00', B = '#0000ff';
  const lobe = (x, y, ang, len, wid, sharp = 0.45) => {     // a leaf-shaped lobe from (x, y) pointing along ang (0 = up)
    g.save(); g.translate(x, y); g.rotate(-ang);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(wid, len * 0.15, wid, len * sharp, 0, len); g.bezierCurveTo(-wid, len * sharp, -wid, len * 0.15, 0, 0); g.fill();
    g.restore();
  };
  const ray = (x, y, ang, len, w) => { g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ang) * len, y + Math.cos(ang) * len); g.stroke(); };
  const cell = (i, fn) => {
    g.save(); g.beginPath(); g.rect((i % 4) * 256, Math.floor(i / 4) * 256, 256, 256); g.clip();
    g.translate((i % 4) * 256 + 128, Math.floor(i / 4) * 256 + 128); g.scale(64, -64);
    g.globalCompositeOperation = 'lighter'; fn(); g.restore();
  };
  cell(0, () => {                                            // hand leaf: 13 fingers from a low hub
    for (let k = -6; k <= 6; k++) { const a = k * 0.36, L = 1.75 - 0.045 * k * k + rng.range(-0.05, 0.05);
      g.fillStyle = R; lobe(0, -0.72, a, L, 0.13); g.strokeStyle = G; ray(0, -0.72, a, L * 0.9, 0.022);
      g.strokeStyle = B; ray(0, -0.72, a + 0.18, L * 0.62, 0.05); }
    g.strokeStyle = R; ray(0, -1, 0, 0.3, 0.07);
  });
  cell(1, () => {                                            // fern frond: a rib with pinnae either side
    for (let k = 0; k < 13; k++) { const y = -0.95 + k * 0.15, L = 0.62 * Math.sin(Math.PI * (0.18 + 0.8 * (1 - k / 13))) + 0.1;
      for (const sd of [-1, 1]) { g.fillStyle = R; lobe(0, y, sd * 1.15, L, 0.07, 0.5); g.strokeStyle = B; ray(0, y, sd * 1.15, L * 0.8, 0.02); } }
    g.fillStyle = R; lobe(0, 0.75, 0, 0.3, 0.06); g.strokeStyle = G; ray(0, -1, 0, 1.9, 0.03);
  });
  cell(2, () => {                                            // lance leaf
    g.fillStyle = R; lobe(0, -0.8, 0, 1.8, 0.42, 0.5); g.strokeStyle = R; ray(0, -1, 0, 0.25, 0.06);
    g.strokeStyle = G; ray(0, -0.8, 0, 1.7, 0.03);
    g.strokeStyle = B; for (const o of [-0.16, 0.16, -0.3, 0.3]) { g.lineWidth = 0.035; g.beginPath(); g.moveTo(0, -0.75); g.quadraticCurveTo(o * 2, 0.1, 0, 0.95); g.stroke(); }
  });
  cell(3, () => {                                            // fatsia: seven broad lobes
    for (let k = -3; k <= 3; k++) { const a = k * 0.62, L = 1.25 - 0.06 * k * k;
      g.fillStyle = R; lobe(0, -0.3, a, L, 0.3, 0.55); g.strokeStyle = G; ray(0, -0.3, a, L * 0.85, 0.028);
      g.strokeStyle = B; ray(0, -0.3, a + 0.31, 0.5, 0.06); }
    g.strokeStyle = R; ray(0, -1, 0, 0.75, 0.06);
  });
  cell(4, () => {                                            // flower: five overlapping petals, a darker throat, a pale stamen column
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + 0.2;
      g.fillStyle = R; lobe(0, 0, a, 1.0, 0.56, 0.86);
      g.save(); g.rotate(-a);                                 // each petal overlaps its neighbour: one edge drawn as a fold, and a crease
      g.strokeStyle = B; g.lineWidth = 0.05; g.beginPath(); g.moveTo(0, 0.05); g.bezierCurveTo(0.56, 0.15, 0.56, 0.86, 0.06, 0.99); g.stroke();
      g.lineWidth = 0.022; g.beginPath(); g.moveTo(0, 0.3); g.quadraticCurveTo(-0.07, 0.6, -0.03, 0.84); g.stroke();
      g.beginPath(); g.moveTo(-0.1, 0.3); g.quadraticCurveTo(-0.24, 0.52, -0.2, 0.7); g.stroke();
      g.restore(); }
    g.fillStyle = '#000050'; g.beginPath(); g.arc(0, 0, 0.42, 0, TAU); g.fill();        // the throat, darker toward the centre
    g.fillStyle = '#000060'; g.beginPath(); g.arc(0, 0, 0.32, 0, TAU); g.fill();
    g.fillStyle = '#000060'; g.beginPath(); g.arc(0, 0, 0.21, 0, TAU); g.fill();
    // (polish 4) the stamens: a small pale boss at the heart with a ring of anthers round it (the old column with its
    // cross-bar of anthers read as a letter T laid on the flower)
    g.fillStyle = G; g.beginPath(); g.arc(0, 0, 0.075, 0, TAU); g.fill();
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.3, rr = 0.17 + 0.03 * (k % 2); g.beginPath(); g.arc(Math.sin(a) * rr, Math.cos(a) * rr, 0.036, 0, TAU); g.fill(); }
  });
  cell(5, () => {                                            // lily pad: a disc with a notch, a turned-up rim, radial veins
    g.fillStyle = R; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 0.97, -Math.PI / 2 + 0.16, Math.PI * 1.5 - 0.16); g.closePath(); g.fill();
    g.strokeStyle = B; g.lineWidth = 0.1; g.beginPath(); g.arc(0, 0, 0.9, -Math.PI / 2 + 0.2, Math.PI * 1.5 - 0.2); g.stroke();
    g.strokeStyle = G; for (let k = 0; k < 11; k++) ray(0, 0, (k + 0.5) * TAU / 11 + Math.PI, 0.8, 0.022);
  });
  cell(6, () => {                                            // gecko, from above: stout enough to hold at 60 px, every toe pad printed
    g.scale(1.3, 1.3);                                       // (always pressed and crisp, so it may use the cell's margin)
    g.strokeStyle = R; g.lineWidth = 0.34; g.beginPath(); g.moveTo(-0.03, 0.5); g.bezierCurveTo(0.16, 0.28, -0.16, -0.02, 0.02, -0.3); g.stroke();
    g.fillStyle = R; g.beginPath(); g.ellipse(-0.05, 0.74, 0.19, 0.25, 0.12, 0, TAU); g.fill();
    let tx = 0.02, ty = -0.3;                                // the tail: an S that tapers
    for (let k = 0; k < 10; k++) { const t = k / 9, a = Math.PI - 0.25 + 1.5 * Math.sin(t * 2.6), nx = tx + Math.sin(a) * 0.085, ny = ty + Math.cos(a) * 0.085;
      g.lineWidth = 0.27 * (1 - t) + 0.07; g.beginPath(); g.moveTo(tx, ty); g.lineTo(nx, ny); g.stroke(); tx = nx; ty = ny; }
    for (const [x, y, a, b] of [[0.1, 0.4, 1.0, 0.25], [-0.13, 0.42, -1.25, -0.5], [0.08, -0.2, 2.15, 2.75], [-0.1, -0.16, -1.75, -2.5]]) {   // four splayed legs, the near pair mid-step
      g.strokeStyle = R; ray(x, y, a, 0.3, 0.14); const ex = x + Math.sin(a) * 0.3, ey = y + Math.cos(a) * 0.3; ray(ex, ey, b, 0.19, 0.12);
      const fx = ex + Math.sin(b) * 0.19, fy = ey + Math.cos(b) * 0.19;
      g.fillStyle = R; g.beginPath(); g.arc(fx, fy, 0.075, 0, TAU); g.fill();
      for (let t = -2; t <= 2; t++) { const ta = b + t * 0.52; ray(fx, fy, ta, 0.13, 0.05); g.beginPath(); g.arc(fx + Math.sin(ta) * 0.15, fy + Math.cos(ta) * 0.15, 0.047, 0, TAU); g.fill(); }
    }
    g.fillStyle = G; for (const sx of [-0.15, 0.06]) { g.beginPath(); g.arc(sx, 0.8, 0.04, 0, TAU); g.fill(); }
    g.strokeStyle = B; g.lineWidth = 0.08; g.beginPath(); g.moveTo(-0.03, 0.5); g.bezierCurveTo(0.16, 0.28, -0.16, -0.02, 0.02, -0.3); g.stroke();
  });
  cell(7, () => {                                            // heart leaf
    g.fillStyle = R; g.beginPath(); g.moveTo(0, -0.55); g.bezierCurveTo(-0.5, -1.05, -1.05, -0.3, -0.72, 0.25); g.bezierCurveTo(-0.5, 0.65, -0.12, 0.8, 0, 1);
    g.bezierCurveTo(0.12, 0.8, 0.5, 0.65, 0.72, 0.25); g.bezierCurveTo(1.05, -0.3, 0.5, -1.05, 0, -0.55); g.fill();
    g.strokeStyle = R; ray(0, -1, 0, 0.5, 0.06); g.strokeStyle = G; ray(0, -0.55, 0, 1.45, 0.03);
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { g.strokeStyle = k % 2 ? B : G; ray(0, -0.5 + k * 0.3, sd * (1.9 - k * 0.3), 0.6 - k * 0.08, 0.025); }
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 2;
  return t;
}

async function buildShell(ctx, style, group, ARCH_OUT, ARCH_IN) {
  const { R, drumH } = DOME;
  const cutA = new THREE.Vector4(ARCH_OUT.hw, ARCH_OUT.h, ARCH_OUT.rise, 1), cutB = new THREE.Vector4(ARCH_IN.hw, ARCH_IN.h, ARCH_IN.rise, 1);
  const L = R * (Math.PI / 2 - Math.asin(DOME.rosetteR / R)) + drumH;
  const shell = domeShellGeometry();
  const crack = new THREE.Vector2(262, 21);                     // the puttied pane: just above the gallery, right of the apse arch
  const gin = new THREE.Mesh(shell, style.glass({ L, bars: 0.75, lap: 1.31, cutA, cutB, crack }));
  const gout = new THREE.Mesh(shell, style.glass({ outside: true, L, bars: 0.75, lap: 1.31, reflect: 0.78, cutA, cutB, crack }));
  gout.renderOrder = 2;
  group.add(gin, gout);
  await ctx.yield();
  // ribs: every fourth runs on to the crown ring, the rest stop at the rosette hoop
  const eRos = Math.acos(DOME.rosetteR / R), eCrown = Math.acos(1.6 / R);
  const ironCut = style.iron({ rivet: 0.3, cutA, cutB });
  const m4 = new THREE.Matrix4();
  const ribs = (geo, pick) => {
    const ids = []; for (let i = 0; i < DOME.bays; i++) if (pick(i)) ids.push(i);
    const im = new THREE.InstancedMesh(geo, ironCut, ids.length);
    ids.forEach((i, k) => im.setMatrixAt(k, m4.makeRotationY((i / DOME.bays) * TAU)));
    im.frustumCulled = false; group.add(im); return im;
  };
  ribs(ribGeometry(eCrown, 0.42, 0.24), (i) => i % 4 === 0);
  ribs(ribGeometry(eRos, 0.32, 0.18), (i) => i % 4 !== 0);
  await ctx.yield();
  const hoops = [hoopGeometry(-1, 0.5, boxSection(0.5, 1.0)), hoopGeometry(-1, 5, boxSection(0.14, 0.12)), hoopGeometry(-1, drumH, boxSection(0.5, 0.5))];
  await ctx.yield();                                                             // nine hoops in one step ran to 50 ms on a busy machine
  hoops.push(hoopGeometry(eRos, 0, boxSection(0.3, 0.2)), hoopGeometry(eCrown, 0, boxSection(0.3, 0.3)));
  await ctx.yield();
  for (const e of [0.21, 0.42, 0.63, 0.84]) { hoops.push(hoopGeometry(e, 0, boxSection(0.12, 0.1))); if (e === 0.42) await ctx.yield(); }
  await ctx.yield();
  const hoopMesh = new THREE.Mesh(mergeGeometries(hoops), ironCut); group.add(hoopMesh);
  for (const h of hoops) h.dispose();
  await ctx.yield();
  const frames = [archFrameGeometry(ARCH_OUT, 1, boxSection(0.7, 0.5)), archFrameGeometry(ARCH_IN, -1, boxSection(0.7, 0.5))];
  await ctx.yield();
  const iw = buildIronwork(ctx.rng);
  await ctx.yield();
  const furn = new THREE.Mesh(mergeGeometries(iw.cut), ironCut); group.add(furn);
  for (const g of iw.cut) g.dispose();
  frames.push(...iw.free);
  return { frames, cutA, cutB, stair: iw.stair };
}

// ---------------------------------------------------------------- the palm
const paneDist = (x, y, z) => (y > DOME.drumH ? DOME.R - Math.hypot(x, y - DOME.drumH, z) : DOME.R - Math.hypot(x, z));
// a tube along pts with radius r[i]; uv = (turns * around, metres along); aPane from the dome
function tubeAlong(pts, rad, sides, turns = 1) {
  const n = pts.length, pos = [], nor = [], uv = [], ap = [], idx = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(1, 0, 0), B = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Vector3();
  let run = 0;
  for (let i = 0; i < n; i++) {
    T.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    B.crossVectors(T, N); if (B.lengthSq() < 1e-6) B.crossVectors(T, N.set(0, 0, 1)); B.normalize(); N.crossVectors(B, T).normalize();
    if (i > 0) run += pts[i].distanceTo(pts[i - 1]);
    for (let k = 0; k <= sides; k++) {
      const a = (k / sides) * TAU;
      Q.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      P.copy(pts[i]).addScaledVector(Q, rad[i]);
      pos.push(P.x, P.y, P.z); nor.push(Q.x, Q.y, Q.z); uv.push((k / sides) * turns, run); ap.push(Math.max(0, paneDist(P.x, P.y, P.z)));
    }
    if (i < n - 1) for (let k = 0; k < sides; k++) { const a = i * (sides + 1) + k, b = a + sides + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aPane', new THREE.Float32BufferAttribute(ap, 1));
  g.setIndex(idx);
  return g;
}
async function buildPalm(ctx, style, group, detail) {
  const rng = ctx.rng, { R, drumH } = DOME, C = new THREE.Vector3(0, drumH, 0);
  const lean = rng.range(0.3, 1.1), la = rng.range(0, TAU), topY = rng.range(32, 33.2), baseY = 1.1;
  const top = new THREE.Vector3(Math.cos(la) * lean, topY, Math.sin(la) * lean);
  const tp = [], tr = [];
  for (let i = 0; i <= 44; i++) {
    const t = i / 44, w = t * t * (3 - 2 * t) + 0.25 * Math.sin(t * Math.PI * 2) * (1 - t) * 0.4;
    tp.push(new THREE.Vector3(top.x * w, lerp(baseY - 0.4, topY, t), top.z * w));
    tr.push(0.8 * (1 + 0.55 * Math.exp(-t * 14) - 0.1 * t + 0.16 * Math.exp(-(1 - t) * (1 - t) * 90)));
  }
  const stems = [tubeAlong(tp, tr, 18, 1)];
  // stubs of old leaf stalks under the crown: the crisp silhouette of the close pass
  const nStub = 96, tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  for (let i = 0; i < nStub; i++) {
    const t = 1 - (i / nStub) * 0.36 - rng() * 0.01, a = i * 2.39996 + rng.range(-0.3, 0.3), k = Math.min(44, Math.floor(t * 44));
    const out = tmpA.set(Math.cos(a), 0, Math.sin(a)), len = rng.range(0.55, 1.2) * (0.6 + 0.4 * t), up = rng.range(0.5, 1.1);
    const p0 = tp[k].clone().addScaledVector(out, tr[k] * 0.8);
    const p1 = p0.clone().addScaledVector(out, len * 0.55).add(tmpB.set(0, len * up * 0.5, 0));
    const p2 = p0.clone().addScaledVector(out, len).add(tmpB.set(0, len * up, 0));
    stems.push(tubeAlong([p0, p1, p2], [0.16, 0.11, 0.04], 4, 0.25));
    if (i % 8 === 7) await ctx.yield();   // the stubs and their merge ran to 70 ms in one stretch on a busy machine
  }
  const trunk = new THREE.Mesh(mergeGeometries(stems), style.stem({ scales: 13, far: 0.95, reach: 0.3 }));
  trunk.renderOrder = 1; group.add(trunk);
  for (const g of stems) g.dispose();
  await ctx.yield();
  // fans: [frame matrix, aLeaf]; pressed ones lie on the glass in three rings, the rest hang in the crown
  const pressed = [], hanging = [], stalks = [], hubs = [];
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), H = new THREE.Vector3(), m = new THREE.Matrix4();
  const stalk = (to, lift) => {
    const pts = [], rad = [], ctl = top.clone().lerp(to, 0.45); ctl.y += lift;
    for (let j = 0; j <= 8; j++) { const t = j / 8; pts.push(new THREE.Vector3().copy(top).multiplyScalar((1 - t) * (1 - t)).addScaledVector(ctl, 2 * t * (1 - t)).addScaledVector(to, t * t)); rad.push(lerp(0.085, 0.035, t)); }
    stalks.push(tubeAlong(pts, rad, 5, 0.3));
  };
  const rings = [[rng.int(4, 5), 2.6, 3.0], [rng.int(9, 11), 6.9, 3.0], [0, 11.7, 3.0]];
  rings[2][0] = 30 - rings[0][0] - rings[1][0];
  for (const [cnt, arc, size] of rings) {
    const a0 = rng() * TAU;
    for (let i = 0; i < cnt; i++) {
      const az = a0 + (i / cnt) * TAU + rng.range(-0.06, 0.06), sArc = arc + rng.range(-0.5, 0.5), e = sArc / R;
      Z.set(-Math.sin(e) * Math.sin(az), -Math.cos(e), -Math.sin(e) * Math.cos(az));           // inward normal
      H.copy(C).addScaledVector(Z, -(R - 0.8 + pressed.length * 0.012));     // 0.8 to 0.44 m inside: clear of the flat facets of the hull and of the hoops, which showed through the outer ring as pale arcs
      Y.set(Math.cos(e) * Math.sin(az), -Math.sin(e), Math.cos(e) * Math.cos(az));             // down the meridian
      X.crossVectors(Y, Z); Y.applyAxisAngle(Z, rng.range(-0.3, 0.3)); X.crossVectors(Y, Z).normalize();
      const sc = size * rng.range(0.92, 1.08);
      m.makeBasis(X, Y, Z).scale(new THREE.Vector3(sc, sc, sc)).setPosition(H);
      pressed.push([m.clone(), [-1, rng(), 0, 0]]);
      stalk(H.clone().addScaledVector(Z, 0.1), 1.5 + arc * 0.12); hubs.push(H.clone());
    }
  }
  {
    const rx = ctx.core.makeRng(ctx.core.hashSeed('fph-rosette-fill:' + ctx.seed));
    for (const [cnt, arc] of [[7, 4.7], [13, 9.3]]) {
      const a0 = rx() * TAU;
      for (let i = 0; i < cnt; i++) {
        const az = a0 + (i / cnt) * TAU + rx.range(-0.08, 0.08), e = (arc + rx.range(-0.4, 0.4)) / R;
        Z.set(-Math.sin(e) * Math.sin(az), -Math.cos(e), -Math.sin(e) * Math.cos(az));
        H.copy(C).addScaledVector(Z, -(R - 0.86 - (pressed.length - 30) * 0.012));           // a hand's breadth under the others
        Y.set(Math.cos(e) * Math.sin(az), -Math.sin(e), Math.cos(e) * Math.cos(az));
        X.crossVectors(Y, Z); Y.applyAxisAngle(Z, rx.range(-0.5, 0.5)); X.crossVectors(Y, Z).normalize();
        const sc = 3.0 * rx.range(0.9, 1.06);
        m.makeBasis(X, Y, Z).scale(new THREE.Vector3(sc, sc, sc)).setPosition(H);
        pressed.push([m.clone(), [-1, rx(), 0, 0]]);
        stalk(H.clone().addScaledVector(Z, 0.1), 1.5 + arc * 0.12);
      }
    }
  }
  const nHang = Math.round(rng.int(24, 30) * (0.6 + 0.4 * detail));
  for (let i = 0; i < nHang; i++) {
    const az = i * 2.39996 + rng.range(-0.4, 0.4), low = i < 7;
    const el = low ? rng.range(-0.36, -0.2) : rng.range(-0.15, 0.75), len = low ? rng.range(8.5, 11) : rng.range(4.5, 9.5);
    Y.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    H.copy(top).addScaledVector(Y, len);
    if (paneDist(H.x, H.y, H.z) < 4) H.lerp(top, 0.3);
    Y.y -= 0.25; Y.normalize();
    Z.set(0, 1, 0).addScaledVector(Y, -Y.y).normalize().applyAxisAngle(Y, rng.range(-0.7, 0.7));
    X.crossVectors(Y, Z).normalize();
    const sc = 2.5 * rng.range(0.85, 1.12);
    m.makeBasis(X, Y, Z).scale(new THREE.Vector3(sc, sc, sc)).setPosition(H);
    hanging.push([m.clone(), [Math.max(0.5, paneDist(H.x, H.y, H.z)), rng(), rng.range(0.05, 0.16), 0]]);
    stalk(H.clone(), low ? 2.2 : 1.2); hubs.push(H.clone());
  }
  const stalkMesh = new THREE.Mesh(mergeGeometries(stalks), style.stem({ scales: 0, far: 0.0, depthWrite: false }));
  stalkMesh.renderOrder = 2.9; group.add(stalkMesh);     // under the rosette's print (order 3): no pale stalk across it
  for (const g of stalks) g.dispose();
  await ctx.yield();
  const card = cardGeometry(-1.5, 1.5, -1.05, 1.5, 6, 6);
  const inst = (list, mat, order) => {
    const g = style.leafAttr(card.clone(), list.map((l) => l[1]));
    const im = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((l, i) => im.setMatrixAt(i, l[0]));
    im.frustumCulled = false; im.renderOrder = order; group.add(im); return im;
  };
  const rosette = inst(pressed, style.leaf({ fan: true, core: true, afterGlass: true, conformR: R, breath: 0.03, sway: 0.012 }), 3);
  const cores = inst(hanging, style.leaf({ fan: true, core: true, sway: 0.05, reach: 0.4 }), 0);     // (polish: the crown is a crown from across the dome, dark at the lens and greying up into the print)
  const soft = inst(hanging, style.leaf({ fan: true, sway: 0.05, reach: 0.4, fade: 0.55 }), 2.5);     // a soft fan against the hull thins out: it must never read as the crown's shadow
  card.dispose();
  return { top, trunkPts: tp, rosette, cores, soft, hubs, scallops: rings[2][0], phase: 0 };
}

// ---------------------------------------------------------------- iron furniture of the dome
// finial lantern over the crown ring, cresting on the cornice, the gallery at 10 m on pierced brackets, the stair
function buildIronwork(rng) {
  const { R, drumH } = DOME, cut = [], free = [];
  const V = (x, y, z) => new THREE.Vector3(x, y, z), UP = V(0, 1, 0);
  const polar = (r, a, y) => V(r * Math.sin(a), y, r * Math.cos(a));
  const bar = (list, pts, sec, nrm) => list.push(ironSweep(pts, nrm || pts.map(() => UP), sec));
  // finial: eight ogee bars from the crown ring to a spike
  const y0 = drumH + R * Math.sin(Math.acos(1.6 / R));
  free.push(ringGeometry(1.6, y0 + 0.25, boxSection(0.3, 0.3), 32), ringGeometry(1.25, y0 + 1.9, boxSection(0.16, 0.2), 32));
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU, pts = [], nrm = [];
    for (let j = 0; j <= 12; j++) { const t = j / 12, r = t < 0.4 ? 1.5 - 0.25 * (t / 0.4) : 1.25 * Math.pow(1 - (t - 0.4) / 0.6, 0.55) + 0.05;
      pts.push(polar(r, a, y0 + 0.3 + t * 4.6)); nrm.push(polar(1, a, 0)); }
    free.push(ironSweep(pts, nrm, boxSection(0.12, 0.1)));
  }
  bar(free, [V(0, y0 + 4.6, 0), V(0, y0 + 8.2, 0)], boxSection(0.12, 0.12), [V(1, 0, 0), V(1, 0, 0)]);
  free.push(ringGeometry(0.42, y0 + 5.6, boxSection(0.3, 0.14), 16), ringGeometry(0.24, y0 + 6.5, boxSection(0.18, 0.1), 12));
  // cornice cresting: a spear over every half bay, and a small rail
  cut.push(ringGeometry(R + 0.42, drumH + 0.75, boxSection(0.06, 0.06), 192));
  for (let i = 0; i < 96; i++) {
    const a = ((i + 0.5) / 96) * TAU, h = i % 2 ? 0.8 : 1.25;
    cut.push(ironSweep([polar(R + 0.42, a, drumH + 0.2), polar(R + 0.42, a, drumH + 0.2 + h * 0.7), polar(R + 0.42, a, drumH + 0.2 + h)],
      [polar(1, a, 0), polar(1, a, 0), polar(1, a, 0)], [[-0.03, -0.09, -0.03, 0.09], [0.03, -0.09, 0.03, 0.09]]));
  }
  // gallery: deck, kerb rail, handrail, balusters, and a pierced bracket under it at every rib
  const gy = drumH, gr = R - 2.4;
  cut.push(ringGeometry(R - 1.25, gy, [[0, -1.15, 0, 1.15]], 192), ringGeometry(gr, gy - 0.12, boxSection(0.24, 0.1), 192), ringGeometry(gr + 0.05, gy + 1.1, boxSection(0.07, 0.09), 192),
    ringGeometry(gr + 0.05, gy + 0.55, boxSection(0.035, 0.035), 192));
  for (let i = 0; i < 192; i++) { const a = (i / 192) * TAU; cut.push(ironSweep([polar(gr + 0.05, a, gy), polar(gr + 0.05, a, gy + 1.1)], [polar(1, a, 0), polar(1, a, 0)], [[-0.02, 0, 0.02, 0], [0, -0.02, 0, 0.02]])); }
  for (let i = 0; i < DOME.bays; i++) {
    const a = (i / DOME.bays) * TAU, tang = polar(1, a + Math.PI / 2, 0), arc = [], an = [], ringP = [], rn = [];
    for (let j = 0; j <= 8; j++) { const t = (j / 8) * Math.PI / 2; arc.push(polar(R - 0.25 - 2.15 * Math.sin(t), a, gy - 0.2 - 2.4 * Math.cos(t))); an.push(tang); }
    for (let j = 0; j <= 12; j++) { const t = (j / 12) * TAU; ringP.push(polar(R - 0.95 + 0.52 * Math.cos(t), a, gy - 0.9 + 0.52 * Math.sin(t))); rn.push(tang); }
    cut.push(ironSweep(arc, an, [[-0.05, -0.07, -0.05, 0.07], [0.05, -0.07, 0.05, 0.07], [-0.05, 0, 0.05, 0]]), ironSweep(ringP, rn, [[-0.04, -0.05, -0.04, 0.05], [0.04, -0.05, 0.04, 0.05]]));
  }
  // spiral stair to the gallery, empty
  const sa = rng.pick([2.2, 4.1]) + rng.range(-0.15, 0.15), sc = polar(R - 4.4, sa, 0), steps = 44, turns = 2.25;
  bar(free, [V(sc.x, 0, sc.z), V(sc.x, gy + 1.2, sc.z)], boxSection(0.16, 0.16), [V(1, 0, 0), V(1, 0, 0)]);
  const rail = [], railN = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, a = sa + Math.PI + t * turns * TAU, y = t * gy, d = V(Math.sin(a), 0, Math.cos(a));
    if (i < steps) free.push(ironSweep([V(sc.x + d.x * 0.1, y + 0.2, sc.z + d.z * 0.1), V(sc.x + d.x * 1.45, y + 0.2, sc.z + d.z * 1.45)], [UP, UP], [[0, -0.16, 0, 0.16], [-0.03, -0.16, -0.03, 0.16]]));
    rail.push(V(sc.x + d.x * 1.45, y + 1.25, sc.z + d.z * 1.45)); railN.push(UP);
    if (i % 2 === 0 && i < steps) free.push(ironSweep([V(sc.x + d.x * 1.45, y + 0.2, sc.z + d.z * 1.45), V(sc.x + d.x * 1.45, y + 1.25, sc.z + d.z * 1.45)], [d, d], [[-0.02, 0, 0.02, 0], [0, -0.02, 0, 0.02]]));
  }
  free.push(ironSweep(rail, railN, boxSection(0.06, 0.06)));
  return { cut, free, stair: sc };
}

// ---------------------------------------------------------------- pool, island, pads, floor
function ringGeometry(r, y, section, n = 96) {
  const pts = [], nrm = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * TAU; pts.push(new THREE.Vector3(r * Math.sin(a), y, r * Math.cos(a))); nrm.push(new THREE.Vector3(0, 1, 0)); }
  return ironSweep(pts, nrm, section);
}
function plainDisc(r0, r1, y, n = 64) {      // a flat annulus for the iron material (no rebate line: uv.x = 0.5)
  const g = new THREE.RingGeometry(Math.max(r0, 0.001), r1, n, 1); g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
  const c = g.attributes.position.count, uv = g.attributes.uv, aw = new Float32Array(c).fill(1);
  for (let i = 0; i < c; i++) uv.setXY(i, 0.5, 0);
  g.setAttribute('aW', new THREE.BufferAttribute(aw, 1)); g.deleteAttribute('normal');
  return g;
}
async function buildPool(ctx, style, group, detail, palmInfo) {
  const rng = ctx.rng, { poolR } = DOME, waterY = 0.42;
  const disc = (r0, r1, y, n) => { const g = new THREE.RingGeometry(r0, r1, n, 1); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; };
  const pool = new THREE.Mesh(disc(2.6, poolR, waterY, 96), style.pool({ scallops: palmInfo.scallops, phase: palmInfo.phase }));
  group.add(pool);
  const floor = new THREE.Mesh(disc(poolR + 0.4, DOME.R - 0.02, 0.02, 96), style.floor()); group.add(floor);
  const stone = [ringGeometry(poolR + 0.25, 0.33, boxSection(0.66, 0.6)), ringGeometry(3.0, 0.5, boxSection(1.0, 0.7), 48), ringGeometry(2.1, 0.95, boxSection(0.5, 1.2), 40),
    plainDisc(0, 2.6, 1.0, 40)];
  const stoneMesh = new THREE.Mesh(mergeGeometries(stone), style.iron({ tone: 0.75 })); group.add(stoneMesh);
  for (const g of stone) g.dispose();
  await ctx.yield();
  // forty giant pads, moored; five lilies beside them
  const pads = [], lil = [], spots = [];
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(0, 1, 0), m = new THREE.Matrix4();
  const nPad = Math.round(40 * (0.7 + 0.3 * detail));
  for (let i = 0, tries = 0; i < nPad && tries < 900; tries++) {
    const r = Math.sqrt(rng.range(4.6 * 4.6, 12.6 * 12.6)), a = rng() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
    let ok = true; for (const sp of spots) if ((sp[0] - x) * (sp[0] - x) + (sp[1] - z) * (sp[1] - z) < 2.25 * 2.25) { ok = false; break; }
    if (!ok) continue;
    spots.push([x, z]); i++;
    const yaw = rng() * TAU, dia = rng.range(1.7, 2.25), sc = dia / 0.485;
    Y.set(Math.cos(yaw), 0, Math.sin(yaw)); X.crossVectors(Y, Z);
    m.makeBasis(X, Y, Z).scale(new THREE.Vector3(sc, sc, sc)).setPosition(x - Y.x * sc * 0.5, waterY + 0.03 + i * 0.0006, z - Y.z * sc * 0.5);
    pads.push([m.clone(), [Math.max(1, DOME.R - r - 4), rng(), 0, ATLAS_CELLS.pad]]);
  }
  for (let i = 0; i < 5; i++) {
    const sp = spots[Math.floor(rng() * spots.length)], a = rng() * TAU, sc = rng.range(1.3, 1.8);
    const x = sp[0] + Math.cos(a) * 1.25, z = sp[1] + Math.sin(a) * 1.25, yaw = rng() * TAU;
    Y.set(Math.cos(yaw), 0, Math.sin(yaw)); X.crossVectors(Y, Z);
    m.makeBasis(X, Y, Z).scale(new THREE.Vector3(sc, sc, sc)).setPosition(x - Y.x * sc * 0.5, waterY + 0.16, z - Y.z * sc * 0.5);
    lil.push([m.clone(), [12, rng(), -0.25, ATLAS_CELLS.flower]]);
  }
  const card = cardGeometry(-0.5, 0.5, 0, 1, 2, 2);
  const inst = (list, mat, order) => {
    const g = style.leafAttr(card.clone(), list.map((l) => l[1]));
    const im = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((l, i) => im.setMatrixAt(i, l[0]));
    im.frustumCulled = false; im.renderOrder = order; group.add(im); return im;
  };
  inst(pads, style.leaf({ core: true, sway: 0.03, hold: 0.82, reach: 0.5 }), 0);     // (polish: a pad lies on the mirror, and that is contact: crisp from across the pool)
  inst(pads, style.leaf({ sway: 0.03, hold: 0.82, reach: 0.5 }), 2.2);
  inst(lil, style.leaf({ white: true, sway: 0.02, breath: 0.08 }), 2.3);
  card.dispose();
  return { waterY, spots };
}

function buildAir(ctx, style, group, palm, pool, detail) {
  const rng = ctx.rng, shelves = [7, 14.5, 21], geos = [];
  for (const y of shelves) { const g = new THREE.CircleGeometry(29.2, 48); g.rotateX(-Math.PI / 2); g.translate(0, y + rng.range(-0.6, 0.6), 0); geos.push(g); }
  const mist = new THREE.Mesh(mergeGeometries(geos), style.mist({ strength: 0.36, edge: 29, span: [400, 400] }));
  mist.renderOrder = 5; group.add(mist);
  for (const g of geos) g.dispose();
  // drips from the fan tips into the pool
  const src = palm.hubs.filter((h) => { const r = Math.hypot(h.x, h.z); return r > 3.4 && r < DOME.poolR - 0.8; });
  const n = Math.max(8, Math.round(Math.min(src.length, 44) * detail)), a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const h = src[i % src.length]; a.set([h.x + rng.range(-1.2, 1.2), h.y - rng.range(0.5, 2), h.z + rng.range(-1.2, 1.2), rng()], i * 4); }
  const dg = new THREE.PlaneGeometry(2, 2);
  dg.setAttribute('aDrop', new THREE.InstancedBufferAttribute(a, 4));
  const drops = new THREE.InstancedMesh(dg, style.drops({ floorY: pool.waterY }), n);
  drops.frustumCulled = false; drops.renderOrder = 4; group.add(drops);
  return { shelves };
}

// ==== HERO ====
export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, { palette: opts.palette, runDensity: opts.runDensity });
  const own = !opts.style;
  await ctx.yield();
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const archOut = { ...ARCH_OUT_DEFAULT, ...(opts.archOut || {}) }, archIn = { ...ARCH_IN_DEFAULT, ...(opts.archIn || {}) };
  const group = new THREE.Group(); group.name = 'fogged-palm-house-hero';
  const shell = await buildShell(ctx, style, group, archOut, archIn);
  const misc = new THREE.Mesh(mergeGeometries(shell.frames), style.iron({ rivet: 0.3 })); group.add(misc);
  for (const g of shell.frames) g.dispose();
  await ctx.yield();
  const palm = await buildPalm(ctx, style, group, detail);
  await ctx.yield();
  const pool = await buildPool(ctx, style, group, detail, palm);
  await ctx.yield();
  const air = buildAir(ctx, style, group, palm, pool, detail);
  await ctx.yield();
  const V = (x, y, z) => new THREE.Vector3(x, y, z), R = DOME.R;
  const wp = new THREE.Vector3(), dc = new THREE.Vector3();
  const poolMat = group.children.find((c) => c.material && c.material.uniforms && c.material.uniforms.uDomeC).material;
  const hero = {
    object: group, radius: R, height: DOME.apexY, center: V(0, 20, 0), ground: true, groundY: 0, style,
    anchors: {
      entryArch: { position: V(0, 0, -R), halfWidth: archIn.hw, height: archIn.h, rise: archIn.rise, facing: V(0, 0, -1) },
      exitArch: { position: V(0, 0, shellZ(0, archOut.h, 1).z), rim: V(0, 0, R), halfWidth: archOut.hw, height: archOut.h, rise: archOut.rise, facing: V(0, 0, 1) },
      flyThrough: [V(0, 5, -30), V(16, 8, 0), V(0, 13.5, 15), V(-14, 19, 0), V(0, 24, -12), V(8, 24, 0), V(0, 13, 36)],
      crown: palm.top.clone().add(V(0, 3, 0)), trunkTop: palm.top.clone(), apex: V(0, DOME.apexY, 0), rosetteRadius: DOME.rosetteR,
      pool: { center: V(0, pool.waterY, 0), radius: DOME.poolR, kerbTop: 0.66 }, island: V(0, 1.0, 0),
      kerbSeat: V(Math.sin(0.6) * (DOME.poolR + 0.25), 0.66, -Math.cos(0.6) * (DOME.poolR + 0.25)),
      stair: shell.stair.clone(), chairSeat: shell.stair.clone().multiplyScalar(0.86), galleryY: DOME.drumH, mistShelves: air.shelves,
      viewpoints: { fromSnow: V(0, 3, -150), poolSide: V(16, 8, 0), underFans: V(8, 24, 0) },
    },
    setSyringe(v) { style.setSyringe(v); },
    update(dt, time, camera) {
      if (own) {
        style.update(dt, time, camera);
        if (camera) { wp.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(wp); style.setInside(wp.x * wp.x + wp.z * wp.z < R * R && wp.y < 41 ? 1 : 0); }
      }
      group.updateWorldMatrix(true, false);
      poolMat.uniforms.uDomeC.value.copy(dc.set(0, DOME.drumH, 0).applyMatrix4(group.matrixWorld));
    },
    dispose() { if (own) style.dispose(); },
  };
  return hero;
}
