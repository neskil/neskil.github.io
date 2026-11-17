// The Old Stem: hero set piece of "Smoke Turns the Aspens", and the raku style kit for the whole world.
//
// WHAT IT IS. One aspen 80 m tall fired in raku: a white crackle-glaze trunk 9 m thick at the foot (6 m at 50 m) with root
// buttresses, fourteen great limbs from 20 m up, ~440 branches (sweepers that run round between the limbs, droopers and hangers
// that make a skirt down to 12 m; a door is left open below 29 m on the side the flight arrives from), ~2,000 black clay twigs,
// ~89,000 copper leaf discs in thirteen loose tiers, 400 magpies, a smoke ring 50 m across, smoke pooled between the roots, green litter on a black clay apron.
// Puffs of smoke rise through the crown and copper blooms in a patch round each (see POLISH 2 below; the first version had a
// ring and a line): an unturned disc is dull verdigris, a turned one lustre (penny / oxblood / turquoise by the angle of the
// quaking disc to eye and sun, one pale flash at the mirror angle). As the clock runs, the newest generation of crackle races up
// the trunk and out along each limb (crack fronts are measured in metres of wood from the root) and stays, and the magpies of
// each patch burst out and wind round the trunk in ropes.
//
// STYLE EXPORTS (shade the whole world with these; nothing here uses the tone map: return post { flat: 1, bloom 0 }):
//   RAKU_PALETTE            the seven hexes [white glaze, black clay, smoke, verdigris, penny, oxblood, turquoise]
//   STYLE_GLSL              uniforms + rakuFog(col, dist) (distance is smoke, black goes first, nothing lost in the first ~12 m),
//                           rakuLustre(n, toEye), rakuLustreAvg(), rkCrackle(), rkLine(), hashes and noise. Safe in vertex shaders.
//   SURFACE_GLSL            rakuGlaze(uvS, N1, arc, ao, objPos, worldNormal, dist) and rakuClay(objPos, dist) (fragment only)
//   makeRakuStyle(palette, { sunElevation, sunRight, fogHalf, fire }) -> { uniforms, glazeMaterial(props, own), clayMaterial(),
//       leafMaterial(turnNow, soft), smokeMaterial({ lift, spin, alpha, flat, pale }), birdMaterial(turnNow, scale), skyMaterial() }
//       uniforms are shared by every material it makes: uTime (set it each frame, or let hero.update do it), uSunDir, uFogHalf (120),
//       uFire (-1 light reduction .. +1 heavy), uGust.x (0 still, 1 cold gusts), uViewH, uRingY / uFront (defaults: all smoked, all crazed).
//       Added for the world: flyerMaterial(flap, fold, scale) one free bird placed by its mesh matrix; floorMaterial({ pool, ash }) the
//       black clay floor with dried fissures and lying smoke; smokeMaterial({ rope, bend, pale < 0 }) puffs that climb as a rope
//       (aPuff.z = rate) and sootier smoke; uniforms uCast (0 magpie, 1 pied woodpecker, 2 white owl) and uBeat (wing-beat rate).
//   makeSweeper()           sweep(pts, radii, { sides, cell, arc0, ao, sway, shape }) tubes with the crackle mapping; build() -> geometry.
//                           Use it for grove trunks, boulders, deer; clay twigs put their radius in aCk.x (see CLAY_VERT).
//   leafGeometry(pos, leaf, turn), smokeGeometry(pos, puff), birdGeometry(roost, bird)   instanced geometries for those materials
//   buildDaughterHoop(ctx, style, { centre, dir, groundY, opening })   the exit's hoop tree, same glaze
//
// buildHero(ctx, opts) opts: palette (7 hexes), detail 0.6..1 (thins leaves, litter, smoke, birds), style (a makeRakuStyle result to
//   share), sky (default true: adds the smoke dome with the sun disc, which follows any camera; pass false if the world makes its
//   own with style.skyMaterial()), floor (default true: a 90 m black clay apron at y 0; pass false over the world's own floor),
//   leaves (60000), birds (400), birdScale, plus the makeRakuStyle options.
// Returns the contract object plus: style, uniforms, ringY ({value}), fronts ({value: Vector3}), skeleton (every limb's points and
//   radii, for perches), stats, and the progress hooks
//   setRingY(y)      smoke ring height in local metres. In the crown set it to the camera's local y + 3 every frame (from u).
//   setProgress(p)   the same as 0..1 from under the crown (16 m) to over the top (88 m).
//   setFronts(a,b,c) crack fronts for generations 1..3 in metres of wood from the root (default: 1 and 2 complete, 3 = ringY + 3.5).
//   setGust(g)
// SIZE. Crown radius 46 m, top at 80 m (anchors.crownRadius, anchors.top). radius 22 / height 44 / center y 42 are the framing
//   core the viewer orbits, not the full bound. Origin at the foot, +Y up; the camera line arrives from -Z.
// ANCHORS (local space):
//   flyThrough   81 points: [0..7] a 40 m approach from (23.6, 20, -39) under the lowest limb, [8..72] one and a quarter turns
//                round the trunk, trunk on the left, 22 m out closing to 11 m and back to 16 m, rising 24 m -> 54 m, [73..80] a 79 m
//                straight climbing 5 degrees, heading 35 degrees left of +Z, to the portal seat. No wood within 6.4 m of this line,
//                no twig within 5 m, no leaf within 3.8 m. Leave the line as it is: the limbs were grown round it.
//   helixStart 8, helixEnd 72; portalSeat { position (32, 60.9, 73.6), facing, direction, radius 7, pitchDeg 5 }; hoopCentre
//   closePass / oneImage / entryView { position, lookAt }; trunkAt(y), trunkRadiusAt(y); sunDir; crownRadius; crownBase; top
// FIX 0 ADDITIONS. leafMaterial(turnNow, soft, props, { fogHalf, minPx }) (a hung disc never drawn under minPx pixels of radius);
//   glazeMaterial / clayMaterial own.fogHalf; smokeMaterial({ far: [start, end, amount] }); skyMaterial({ band, floor, floorY,
//   pool, ash, entryZ }) paints the floor below the horizon; floorMaterial({ fogHalf, entryZ }); buildHero opts heroFogHalf,
//   trunkCell, leafMinPx; buildDaughterHoop opts thick, cell, fogHalf. The Stem, and the hoop, keep their marks through more smoke
//   than the grove (their own uFogHalf), so the hero reads from the entry on.
// POLISH 1 ADDITIONS. rakuFog goes to uShade (the smoke a step darker: far trunks end as silhouette bars) and mixes on square
//   roots, so black clay holds for tens of metres. The floor is two values: black clay and pale smoke pools with a decided,
//   sliding edge (floorMaterial / skyMaterial take poolAt and clearAt, Vector3 (x, z, radius): a pool that always lies there,
//   clay that always shows there). skyMaterial({ farLine: 1, glow: 1 }) paints a far tree line on a slot of paler smoke between
//   trunk bars, a low pale warm band strongest under the sun disc, and from above 34 m the far canopy as crown cells with copper
//   along the drifts and ragged treetops on the horizon. rakuClayL(op, dist, lift): clay with a lit half (aCk.z; ferns fold
//   along the rib). Boughs curl in plan (no straight rods), hangers leave every limb of the lower two thirds and carry 2.4x
//   the leaves (the top tiers half), leaves keep within 2.7 m of their twig and 6.4 m off the camera line; the helix runs
//   24.5 -> 13.5 -> 18.5 m from the axis; flying birds beyond ~115 m are not drawn. buildDaughterHoop sets the hoop in a crown:
//   opts crown (true), boughs (12), crownTurn (aTurn of the crown's leaves); it returns perches (Vector3[]) for birds.
// POLISH 2 ADDITIONS. NO RING AND NO LINE: ringY is now a bloom clock. 92 patches (anchors-free: api.patches, api.bloomAt) stand in
//   the crown, each with the clock value at which its puff of smoke arrives; a leaf goes over when the nearest patch has grown
//   out to it (one unit a metre), a bird bursts from its roost at the same moment, and 'old-stem-smoke-ring' is now the puffs
//   themselves, climbing through each patch while it blooms (smokeGeometry(pos, puff, gate) + smokeMaterial({ gate })). The hem's
//   patches bloomed before we came. A skirt of boughs under the outside of the first half-turn and a ceiling over the last one
//   are grown from a private random stream (ctx.rng's sequence is as it was). flyerGeometry() + flyerMaterial(flap, fold, scale,
//   head): the free bird seen large (head, beak, coverts, separate flight feathers, fanned tail; three casts; white parts craze).
//   rkPoolField / rkAnkle / rkPoolCol (FLOOR_GLSL): the lying smoke as a field every surface can ask, so smoke lies over the foot
//   of what stands in a pool and over litter; the floor's fissures gape and close and change scale in patches. Leaves beside the
//   camera line are the small ones. api.fog ({value}) is the Stem's own smoke distance; opts.leafFogHalf its leaves'.
// COST. ~160k triangles (was ~117k), 8 draw calls (glaze, twigs, leaves, magpies, ring, pool, apron, sky), no lights, no textures;
//   ~300 ms build in yielded steps, nothing created after build, update() only writes uniforms.
// EXPECTS AROUND IT: the grove on a level floor at y 0, the sun behind the right shoulder (uSunDir default), no scene fog.
import * as THREE from 'three';

export const RAKU_PALETTE = ['#F1EEE6', '#17150F', '#C9C8C2', '#6E8F7C', '#C46A3A', '#7A1F1C', '#2FA39A'];

// ---------------------------------------------------------------------------------------------
// STYLE_GLSL: the whole raku look in one chunk. Uniform block + fog + lustre ramp + crackle.
// ---------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
uniform vec3 uWhite, uBlack, uSmoke, uGreen, uPenny, uOx, uTurq, uStain, uShade;
uniform vec3 uSunDir;
uniform float uTime, uFogHalf, uFire, uRingY;
uniform vec3 uFront;
uniform vec4 uGust;

vec2 rkHash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float rkHash1(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float rkNoise3(vec3 x){ vec3 i = floor(x), f = x - i; f = f * f * (3. - 2. * f);
  return mix(mix(mix(rkHash1(i), rkHash1(i + vec3(1,0,0)), f.x), mix(rkHash1(i + vec3(0,1,0)), rkHash1(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(rkHash1(i + vec3(0,0,1)), rkHash1(i + vec3(1,0,1)), f.x), mix(rkHash1(i + vec3(0,1,1)), rkHash1(i + vec3(1,1,1)), f.x), f.y), f.z); }

// Distance is smoke, and it takes the black first: half the contrast of a white trunk is gone at uFogHalf (120 m),
// black clay goes about two and a half times sooner. No scene fog anywhere.
// It goes to uShade, a tone darker than the smoke sky, so far trunks end as silhouette bars against the paler low smoke
// (never as nothing), and the mix is done on square roots (as the eye counts), so black clay stays black for tens of metres.
vec3 rakuFog(vec3 c, float d){
  float l = clamp(sqrt(max(dot(c, vec3(.3, .55, .15)), 0.)) * 1.25, 0., 1.);
  float k = .6931 / max(uFogHalf, 1.);
  float dd = d * d * d / (d * d + 2025.);                // nothing is lost in the first dozen metres: near black is the clay's black
  float f = 1. - exp(-dd * k * mix(1.5, 1., l));
  vec3 m = mix(sqrt(max(c, vec3(0.))), sqrt(uShade), f);
  return m * m;
}

// Copper lustre: hue by the angle between the (quaking) surface normal and the half vector of eye and sun disc.
// turquoise at the glancing angle, oxblood edge on, penny square on, one pale flash at the mirror angle.
vec3 rakuLustre(vec3 n, vec3 toEye){
  vec3 h = toEye + uSunDir; h = h / max(length(h), 1e-4);
  float d = abs(dot(n, h)) + uFire * .08;
  vec3 c = mix(uTurq, uOx, smoothstep(.07, .2, d));
  c = mix(c, uPenny, smoothstep(.34, .58, d));
  c = mix(c, mix(uPenny, uWhite, .3), smoothstep(.925, .985, d) * (1. - .5 * max(uFire, 0.)));
  return c;
}
// what a turned crown averages to far away (flat penny, a little oxblood in it)
vec3 rakuLustreAvg(){ return mix(uPenny, uOx, .22 + .15 * uFire); }

// One crackle generation: Voronoi F2 - F1 in surface coordinates x (cells), periodic in x.x with period per.
// Returns (edge distance in cells, cell id hash). Derivatives are taken by the caller, outside the loop.
vec2 rkCrackle(vec2 x, float per){
  vec2 n = floor(x), f = x - n; float d1 = 8., d2 = 8., id = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 c = n + g; c.x = mod(c.x, max(per, 1.));
    vec2 o = rkHash2(c + 17.); vec2 r = g + .12 + .76 * o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = o.x; } else if (d < d2) { d2 = d; }
  }
  return vec2(sqrt(d2) - sqrt(d1), id);
}
// a hairline held at >= 1.5 px: e = edge distance, fw = fwidth(e), w = its fired width in the same units
float rkLine(float e, float fw, float w){ float hw = max(w, .8 * fw); return 1. - smoothstep(hw - .6 * fw - 1e-5, hw + .9 * fw + 1e-5, e); }
`;

// ---------------------------------------------------------------------------------------------
// SURFACE_GLSL: the two fired surfaces that are not copper. rakuGlaze() = white crackle, rakuClay() = smoked black.
//   uvS   surface coordinates: x = fraction round the limb (0..1), y = distance along it in generation-1 cells
//   N1    whole number of generation-1 cells round the limb (constant per limb; >= 3)
//   arc   metres from the root along the wood (what the crack fronts uFront.xyz are measured in)
//   ao    0..1 how much smoke has lain here (lee side, under limbs)
//   op    object-space position, nrm world normal, dist metres to the eye
// ---------------------------------------------------------------------------------------------
export const SURFACE_GLSL = /* glsl */`
vec3 rakuGlaze(vec2 uvS, float N1, float arc, float ao, vec3 op, vec3 nrm, float dist){
  N1 = max(floor(N1 + .5), 3.);
  vec2 x1 = vec2(uvS.x * N1, uvS.y);
  vec2 fx = fwidth(x1);
  float px1 = 1. / max(max(fx.x, fx.y), 1e-5);          // pixels per generation-1 cell
  float cool = rkNoise3(op * .085 + 3.7);               // where the piece cooled faster
  float lag = rkNoise3(op * .45 + 11.) * 4.;
  // the hand: cracks wander (a seamless warp from object space) and their weight comes and goes
  vec3 wq = op * .5;
  x1 += (vec2(rkNoise3(wq), rkNoise3(wq + 19.3)) - .5) * .8;
  float wv = .55 + 1.0 * rkNoise3(op * 1.2 + 2.);
  vec2 c1 = rkCrackle(x1, N1);
  vec2 c2 = rkCrackle(x1 * 4. + 31., N1 * 4.);
  vec2 c3 = rkCrackle(x1 * 16. + 77., N1 * 16.);
  float f1 = fwidth(c1.x), f2 = fwidth(c2.x), f3 = fwidth(c3.x);
  // fronts: a generation exists where its front has passed; the racing tip is drawn a little heavier
  vec3 t = uFront - arc - lag * vec3(.3, .6, 1.);
  vec3 rev = smoothstep(vec3(0.), vec3(.6, 1.2, 2.), t);
  vec3 tip = exp(-t * t * vec3(.5, .2, .06)) * step(vec3(0.), t);
  // a net finer than ~3 px is replaced by its flat average tint
  float v1 = smoothstep(2.4, 5.5, px1), v2 = smoothstep(2.4, 5.5, px1 * .25), v3 = smoothstep(2.4, 5.5, px1 * .0625);
  float m2 = .35 + .65 * smoothstep(.30, .50, cool), m3 = smoothstep(.47, .62, cool);
  float l1 = mix(.10, rkLine(c1.x, f1, .019 * wv * (1. + 1.6 * tip.x)), v1) * rev.x;
  // about half of the quarter-metre net belongs to the newest firing: it arrives with the racing front and stays
  float young = smoothstep(.44, .56, rkNoise3(op * .21 + 70.));
  float rev2 = mix(rev.y, rev.z, young), tip2 = mix(tip.y, tip.z, young);
  float l2 = mix(.05, rkLine(c2.x, f2, .02 * (1. + 2. * tip2)) * .92, v2) * rev2 * m2;
  float l3 = mix(.03, rkLine(c3.x, f3, .022 * (1. + 2. * tip.z)) * .8, v3) * rev.z * m3;
  float lines = clamp(max(l1, max(l2, l3)), 0., 1.);
  // smoke rubbed into the craze: a soft grey edge beside generation 1 and 2
  float rub = (1. - smoothstep(0., .16, c1.x)) * .30 * rev.x * v1 + (1. - smoothstep(0., .22, c2.x)) * .16 * rev2 * m2 * v2;
  // each cell fired a hair differently
  float cellTint = (c1.y - .5) * .05 * v1;
  // bark eyes: lens scars where the glaze crawled back to black clay, a brow over each, stain round it
  float Ne = max(2., floor(N1 / 4. + .5));
  vec2 ex = vec2(uvS.x * Ne, uvS.y * Ne / N1 * .5);
  ex.y += rkHash2(vec2(mod(floor(ex.x), Ne), 3.)).x * 7.;   // each column at its own height, so two never sit level like a face
  vec2 ei = floor(ex), ew = vec2(mod(ei.x, Ne), ei.y);
  vec2 h = rkHash2(ew + 5.), h2 = rkHash2(ew + 91.);
  float present = step(h.x, .42);
  vec2 q = (ex - ei - vec2(.4 + .2 * h.y, .3 + .4 * h2.x)) * vec2(N1 / Ne, 2. * N1 / Ne);
  q /= (.6 + .6 * h2.y) * min(1., N1 / Ne / 3.6);
  float tlt = (fract(h2.x * 31.) - .5) * 1.1; q = vec2(q.x * cos(tlt) - q.y * sin(tlt), q.x * sin(tlt) + q.y * cos(tlt));
  q += (vec2(rkNoise3(op * 1.6), rkNoise3(op * 1.6 + 7.)) - .5) * .4;
  float browOnly = step(fract(h.x * 17.), .3);
  float dl = length(vec2(q.x, abs(q.y) + 1.517)) - 1.817 + browOnly * .22;
  float fd = fwidth(dl) + 1e-4;
  float eye = present * (1. - smoothstep(-fd, fd, dl));
  float db = abs(length(vec2(q.x * .8, q.y + .95 + .25 * q.x * q.x)) - 1.817);
  float brow = present * step(.6, fract(h.y * 23.)) * step(0., q.y) * (1. - smoothstep(.035, .035 + 1.5 * fd, db)) * (1. - smoothstep(1.0, 1.6, abs(q.x)));
  float halo = present * (q.y < 0. ? exp(-max(dl, 0.) * 1.0) * (1. - smoothstep(.6, 1.2, abs(q.x))) : .6 * exp(-max(dl, 0.) * 2.6));
  // crawled bare spots
  float crawl = rev.y * step(c2.y, .035) * smoothstep(.45, .65, rkNoise3(op * .2 + 40.)) * v2 * smoothstep(.03, .09, c2.x);
  // stain: never cast; it blooms a moment after the smoke has passed
  float smoked = smoothstep(-3., 5., uRingY - op.y * .55 - 8.);
  float stain = ao * (.55 + .45 * smoked) * (.7 + 1.1 * rkNoise3(op * .31 + 5.));
  float under = smoothstep(0., 1., -nrm.y);
  vec3 col = uWhite * (1. - .11 * under + cellTint);
  col = mix(col, uStain, clamp(stain + halo * .65 + rub, 0., .92));
  col = mix(col, uBlack, lines);
  col = mix(col, uBlack, max(eye, max(brow * .92, crawl)));
  return rakuFog(col, dist);
}
// clay with a lit half: lift 0..1 lets the brown of the body through the smoke-black (fern fronds fold along the rib)
vec3 rakuClayL(vec3 op, float dist, float lift){
  return rakuFog(mix(uBlack, uStain, .05 + .06 * rkNoise3(op * .7) + .42 * lift), dist);
}
vec3 rakuClay(vec3 op, float dist){
  return rakuFog(mix(uBlack, uStain, .05 + .06 * rkNoise3(op * .7)), dist);
}
`;

const GLAZE_VERT = /* glsl */`
attribute vec4 aCk;                       // N1, arc, ao, sway weight
varying vec3 vO, vN, vW; varying vec2 vUv; varying vec4 vCk;
uniform float uTime;
void main(){
  vec3 p = position;
  float sw = aCk.w;                       // twigs sway a hand's width; glaze never moves
  p.x += sin(uTime * 1.1 + position.y * .21 + position.z * .13) * .11 * sw;
  p.z += sin(uTime * .9 + position.x * .17 + position.y * .15) * .09 * sw;
  vO = position; vUv = uv; vCk = aCk;
  vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const GLAZE_FRAG = /* glsl */`
varying vec3 vO, vN, vW; varying vec2 vUv; varying vec4 vCk;
void main(){
  float dist = length(vW - cameraPosition);
  vec3 c = rakuGlaze(vUv, vCk.x, vCk.y, vCk.z, vO, vN, dist);
  gl_FragColor = vec4(mix(c, rkPoolCol(dist), .86 * rkAnkle(vW, dist)), 1.);      // smoke lies over the foot of whatever stands in a pool
}`;
// clay twigs: aCk = (radius m, arc, 0, sway weight). A twig never thins below ~1.5 px: it is fattened along its normal.
const CLAY_VERT = /* glsl */`
attribute vec4 aCk;
varying vec3 vO, vN, vW; varying vec2 vUv; varying vec4 vCk;
uniform float uTime, uViewH;
void main(){
  vec3 p = position; float sw = aCk.w;
  p.x += sin(uTime * 1.1 + position.y * .21 + position.z * .13) * .11 * sw;
  p.z += sin(uTime * .9 + position.x * .17 + position.y * .15) * .09 * sw;
  vec4 w = modelMatrix * vec4(p, 1.);
  float dist = length(w.xyz - cameraPosition);
  float pix = dist * 2. / max(projectionMatrix[1][1] * uViewH, 1.);      // metres per pixel here
  vec3 nw = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
  w.xyz += nw * max(0., .8 * pix - aCk.x) * step(1e-4, aCk.x);
  vO = position; vUv = uv; vCk = aCk; vN = nw; vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const CLAY_FRAG = /* glsl */`
varying vec3 vO, vN, vW; varying vec2 vUv; varying vec4 vCk;
void main(){ float dist = length(vW - cameraPosition); vec3 c = rakuClayL(vO, dist, smoothstep(.44, .56, vCk.z));
  gl_FragColor = vec4(mix(c, rkPoolCol(dist), .86 * rkAnkle(vW, dist)), 1.); }`;

// Leaf: one instanced triangle per disc (the disc and its black stalk are cut in the fragment shader with an fwidth edge).
// Two states only: verdigris, or lustre by angle. aTurn is the value of uTurnNow at which smoke reaches this leaf.
const LEAF_VERT = /* glsl */`
attribute vec3 aPos;                      // disc centre
attribute vec4 aLeaf;                     // azimuth of the face, tilt, phase 0..1, radius (m)
attribute float aTurn;
uniform float uTurnNow, uTurnSoft, uMinPx, uViewH;
varying vec2 vP; varying vec3 vCol; varying float vDist, vLie;
void main(){
  float ph = aLeaf.z * 6.2832;
  float hz = .5 + .3 * fract(aLeaf.z * 7.31);                       // 0.5 .. 0.8 Hz, never a sparkle
  float gust = 1. + uGust.x * (.5 + .5 * sin(uTime * .35 + aPos.x * .05 + aPos.z * .04));
  float az = aLeaf.x + .44 * gust * sin(uTime * 6.2832 * hz + ph) + .1 * sin(uTime * 2.3 + ph * 3.);
  float tl = aLeaf.y + .08 * sin(uTime * 6.2832 * hz * .5 + ph * 2.);
  vec3 n = vec3(sin(az) * cos(tl), sin(tl), cos(az) * cos(tl));
  vec3 tu = vec3(cos(az), 0., -sin(az));
  vec3 tv = cross(n, tu);
  vec4 cw = modelMatrix * vec4(aPos, 1.);
  vec3 toEye = cameraPosition - cw.xyz; float dist = length(toEye); toEye = toEye / max(dist, 1e-4);
  vec3 nw = normalize(mat3(modelMatrix) * n + vec3(0., 1e-6, 0.));
  float turned = smoothstep(0., max(uTurnSoft, 1e-4), uTurnNow - aTurn);
  vec3 lus = mix(rakuLustre(nw, toEye), rakuLustreAvg(), clamp((dist - 20.) / 200., 0., 1.));
  vec3 grn = uGreen * (.97 + .06 * fract(aLeaf.z * 13.7));
  vCol = rakuFog(mix(grn, lus, turned), dist);
  // a disc lying on the floor inside a pool is under the smoke: a faint shape, a quarter of its contrast at most
  vLie = step(1.2, abs(aLeaf.y));
  if (vLie > .5) vCol = mix(vCol, rkPoolCol(dist), .8 * rkAnkle(cw.xyz, dist));
  vP = position.xy; vDist = dist;
  // a hung disc is never drawn smaller than uMinPx pixels of radius, so a far crown stays a mass and does not fizz away
  float pix = dist * 2. / max(projectionMatrix[1][1] * uViewH, 1.);
  float rad = aLeaf.w * clamp(uMinPx * pix / max(aLeaf.w, .05), 1., 5.) ;
  rad = mix(rad, aLeaf.w, step(1.2, abs(aLeaf.y)));
  vec3 p = aPos + (tu * position.x + tv * position.y) * rad;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
}`;
const LEAF_FRAG = /* glsl */`
varying vec2 vP; varying vec3 vCol; varying float vDist, vLie;
void main(){
  // disc with the aspen's small point at the bottom
  vec2 p = vP; float tipw = max(0., -p.y - .55); p.x *= 1. + tipw * .9; p.y *= 1. - .16 * step(p.y, 0.) * (1. - min(abs(p.x) * 2.2, 1.));
  float r = length(p); float fw = fwidth(r) + 1e-5;
  float disc = 1. - smoothstep(1. - fw, 1., r);
  // black clay stalk above the disc, held at 1.5 px, dropped when the leaf is only a few pixels across
  float sw = max(.028, .8 * fw);
  float stalk = (1. - smoothstep(sw - .5 * fw, sw + .5 * fw, abs(vP.x + .09 * (vP.y - .9) * (vP.y - .9)))) * step(.9, vP.y) * step(vP.y, 1.7) * (1. - smoothstep(.05, .12, fw)) * (1. - vLie);
  if (max(disc, stalk) < .5) discard;
  vec3 clay = mix(rakuFog(uBlack, vDist), vCol, vLie);
  // where the matt glaze breaks thin over the rim the clay shows a little
  float rim = smoothstep(.86, .99, r) * (1. - smoothstep(.03, .10, fw)) * .35;
  gl_FragColor = vec4(mix(clay, mix(vCol, clay, rim), disc), 1.);
}`;

// Smoke: soft discs in sky grey, alpha under 0.25, no depth write. Used for the ring, drifts, ropes and pools.
const SMOKE_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aPuff;   // size, seed, drift speed, rise
attribute float aGate;                       // the value of uGate.x at which this puff arrives (used where uGate.y is 1)
uniform float uLift, uSpin, uAlpha, uFlat, uRope; uniform vec3 uFar; uniform vec2 uGate;
uniform vec3 uBend;
varying vec2 vP; varying float vA;
void main(){
  float a = uSpin * uTime * (.6 + .8 * aPuff.y) ;
  float c = cos(a), s = sin(a);
  vec3 q = vec3(aPos.x * c + aPos.z * s, aPos.y + uLift + sin(uTime * .21 + aPuff.y * 40.) * aPuff.w, -aPos.x * s + aPos.z * c);
  q.xz *= 1. + .05 * sin(uTime * .13 + aPuff.y * 17.);
  // a rope (aPuff.z > 0): each puff climbs uRope metres from its foot at aPuff.z turns a second, bending over by uBend as it goes
  float rp = fract(aPuff.y * 7.13 + uTime * aPuff.z) * step(1e-5, aPuff.z);
  q += (vec3(0., uRope, 0.) * rp + uBend * rp * rp) * step(1e-5, aPuff.z);
  vec4 mv = viewMatrix * modelMatrix * vec4(q, 1.);
  float dist = length(mv.xyz);
  float sz = aPuff.x * (1. + .12 * sin(uTime * .3 + aPuff.y * 90.)) * (1. + 2.2 * rp);
  mv.xy += position.xy * sz * (1. - uFlat);
  mv += viewMatrix * vec4(position.x * sz, 0., position.y * sz, 0.) * uFlat;      // uFlat 1: the puff lies level (pools, sheets)
  vP = position.xy;
  // thin out against the lens so a puff never slaps the camera, and with distance (smoke on smoke is nothing)
  vA = uAlpha * (.6 + .4 * fract(aPuff.y * 9.7)) * smoothstep(1.5, 9., dist) * (1. - uFar.z * smoothstep(uFar.x, uFar.y, dist))
    * mix(1., smoothstep(0., .07, rp) * (1. - rp * rp), step(1e-5, aPuff.z))
    * mix(1., smoothstep(-6., -1.5, uGate.x - aGate) * (1. - smoothstep(8., 16., uGate.x - aGate)), uGate.y);
  gl_Position = projectionMatrix * mv;
}`;
const SMOKE_FRAG = /* glsl */`
uniform vec3 uSmokeCol;
varying vec2 vP; varying float vA;
void main(){
  float r = dot(vP, vP); float f = max(1. - r, 0.);
  gl_FragColor = vec4(uSmokeCol, vA * f * f);
}`;

// Magpie: one ~52-triangle mesh, instanced. The three surfaces by aPart (0 white glaze, 1 black clay, 2 copper lustre).
// Lift-off is keyed to uTurnNow passing aBird.x (never wall-clock); flap and the winding rope run on world time.
const BIRD_VERT = /* glsl */`
attribute float aPart, aWing;             // aWing: signed span fraction (-1..1), 0 on the body
attribute vec3 aRoost; attribute vec4 aBird;   // lift threshold, seed, rope radius, rope phase
uniform float uTurnNow, uBirdScale, uCast, uBeat;
varying vec3 vCol; varying vec3 vL; varying float vPart, vDist;
void main(){
  float seed = aBird.y;
  float s = uTurnNow - aBird.x;                                  // metres the smoke has risen past this roost
  float fl = smoothstep(0., 3.5, s);
  float sc = max(s, 0.);
  // the rope: every bird of a tier shares one helix round the trunk and is strung along it
  float dirn = fract(aBird.w * 3.7) < .5 ? 1. : -1.;
  float th = aBird.w * 6.2832 + seed * 1.6 + dirn * (uTime * (.22 + .05 * fract(seed * 5.)) + sc * .055);
  float rr = aBird.z * (1. + .12 * sin(th * 2. + seed * 9.)) + 1.5 * sin(seed * 60.);
  vec3 orb = vec3(sin(th) * rr, aRoost.y + 2. + min(sc, 30.) * .55 + 2.5 * sin(th * 1.5 + seed * 12.) + 1.2 * sin(seed * 31.), cos(th) * rr);
  vec3 c = mix(aRoost, orb, fl);
  c.y += sin(fl * 3.1416) * 2.5;                                 // the jump off the limb
  // a flying bird never comes nearer the eye than five metres: it is eased out along the line from the lens
  { vec3 cw0 = (modelMatrix * vec4(c, 1.)).xyz - cameraPosition; float dl = length(cw0);
    c += cw0 / max(dl, 1e-3) * max(0., 5. - dl) * fl; }
  float face = mix(seed * 40., th + dirn * 1.5708, fl);
  float cf = cos(face), sf = sin(face);
  // wings: flap twice a second with glides; folded on the roost
  float glide = smoothstep(-.3, .25, sin(uTime * .8 + seed * 20.));
  float beat = sin(uTime * 12.566 * uBeat + seed * 30.);
  float ang = mix(-1.25, beat * .95 * glide + .12, fl);
  vec3 p = position; float w = abs(aWing);
  vec3 nl = vec3(0., 1., 0.);
  if (w > 0.) {
    float a = ang * (.55 + .75 * w);
    float fold = mix(.45, 1., fl);
    float x = p.x * fold;
    p.x = x * cos(a); p.y += abs(x) * sin(a); p.z -= (1. - fl) * w * .16;
    nl = vec3(-sign(aWing) * sin(a), cos(a), 0.);
  } else if (aPart > 1.5) { nl = normalize(vec3(.35 * sign(p.x + 1e-4), 1., .1 * sin(uTime * 3. + seed * 7.))); }
  // roost: a slow bob and a tail flick
  p.y += (1. - fl) * .02 * sin(uTime * 2.2 + seed * 50.);
  float dcam = length((modelMatrix * vec4(c, 1.)).xyz - cameraPosition);
  p *= uBirdScale * (1. + .5 * fl * smoothstep(14., 42., dcam)) * (1. - fl * smoothstep(95., 135., dcam));      // on the wing it is seen from further off: a size larger
  float bank = fl * dirn * -.35;
  p.xy = vec2(p.x * cos(bank) - p.y * sin(bank), p.x * sin(bank) + p.y * cos(bank));
  nl.xy = vec2(nl.x * cos(bank) - nl.y * sin(bank), nl.x * sin(bank) + nl.y * cos(bank));
  vec3 pw = c + vec3(p.x * cf + p.z * sf, p.y, -p.x * sf + p.z * cf);
  vec3 nw = vec3(nl.x * cf + nl.z * sf, nl.y, -nl.x * sf + nl.z * cf);
  vec4 wp = modelMatrix * vec4(pw, 1.);
  vec3 toEye = cameraPosition - wp.xyz; float dist = length(toEye); toEye = toEye / max(dist, 1e-4);
  nw = normalize(mat3(modelMatrix) * nw + vec3(0., 1e-6, 0.));
  vec3 col = aPart < .5 ? uWhite * (position.y < 0. ? .9 : 1.) : (aPart < 1.5 ? uBlack : mix(rakuLustre(nw, toEye), rakuLustreAvg(), clamp((dist - 60.) / 240., 0., 1.)));
  vCol = col; vL = position; vPart = aPart; vDist = dist;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BIRD_FRAG = /* glsl */`
uniform float uCast;
varying vec3 vCol; varying vec3 vL; varying float vPart, vDist;
void main(){
  vec3 col = vCol;
  // the cast: 0 magpie; 1 pied woodpecker (barred wings, one oxblood cap); 2 white owl with black barring
  if (uCast > 1.5) { float ax = abs(vL.x), bx = fract(ax * 7.5 + .15 + vL.z * 1.5), bz = fract(vL.z * 8. + .2);      // barred all over the back, black wing tips: an owl, not a paper dart
    float bar = ax > .07 ? max(1. - smoothstep(.3, .38, bx), smoothstep(.5, .54, ax)) : (vL.y > .03 || vL.z < -.2 ? 1. - smoothstep(.34, .42, bz) : 0.);
    col = mix(uWhite * (vL.y < 0. ? .9 : 1.), uBlack, bar * .92);
    if (vL.z > .455) col = uBlack; }
  else if (uCast > .5) {
    if (vPart > 1.5) col = mix(uBlack, uWhite, step(.5, fract(abs(vL.x) * 6.5 + .25)));
    if (vL.z > .3 && vL.z < .44 && vL.y > .035) col = uOx; }
  if (vPart < .5) {                                              // the breast is glaze: it crazes too
    vec2 x = vL.xz * 16. + vL.y * 9.; vec2 fx = fwidth(x);
    vec2 ck = rkCrackle(x, 512.); float fw = fwidth(ck.x);
    float vis = smoothstep(3., 8., 1. / max(max(fx.x, fx.y), 1e-5));
    col = mix(col, uBlack, mix(.06, rkLine(ck.x, fw, .02), vis));
  }
  gl_FragColor = vec4(rakuFog(col, vDist), 1.);
}`;

// Sky: a dome that follows the camera. Pale kiln smoke, lighter overhead, warmer low, level bands creeping sideways,
// and the sun as a flat hard-edged white disc three degrees across. No horizon.
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform float uBand, uFloorY, uFloorOn, uFarLine, uGlow;
varying vec3 vDir;
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4);
  float az = atan(d.x, d.z + 1e-5 * step(abs(d.x) + abs(d.z), 0.));
  vec3 col = uSmoke * mix(vec3(1.02, 1.0, .965), vec3(1.05, 1.05, 1.055), smoothstep(-.1, .9, d.y));
  float h = d.y * 15. + .5 * sin(az * 2. + uTime * .02);
  float b1 = sin(h + sin(az * 3. - uTime * .031) * .7), b2 = sin(h * 2.3 + 1.7 + sin(az * 2. + uTime * .017) * .9);
  float bands = smoothstep(-.5, .7, b1) * .65 + smoothstep(-.3, .8, b2) * .35;
  col *= 1. + uBand * (bands - .5) * smoothstep(.015, .16, d.y) * (1. - smoothstep(.5, .95, d.y));
  // the far wood, painted: a tree line (the smoke's shade with verdigris in it, copper where a drift has passed) on a slot of
  // paler smoke between far trunk bars; over it a low pale warm band, strongest under the sun disc: light low between the trunks
  float camY = cameraPosition.y - uFloorY, hl = max(length(d.xz), 1e-3);
  vec2 hd = d.xz / hl; vec2 sh = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float sunward = smoothstep(-.6, .95, dot(hd, sh));
  float te = d.y / hl, fy = fwidth(te) + 1e-5;
  float rag = rkNoise3(vec3(hd * 23., 1.)) * .6 + rkNoise3(vec3(hd * 71., 4.)) * .4;
  float y0 = -camY / 430., yb = (14. - camY) / 430., yt = (37. - camY) / 430. + .03 * rag;
  vec3 glowCol = mix(uSmoke, uWhite, .62) * vec3(1.035, 1., .93);
  float glow = (.38 + .62 * sunward) * exp(-max(te - yt, 0.) / .15) * uGlow;
  col = mix(col, glowCol, glow * .8);
  float sd = dot(d, uSunDir); float fs = fwidth(sd) + 1e-6;
  col = mix(col, uWhite, smoothstep(.99966 - fs, .99966 + fs, sd));
  // below the horizon: the floor itself, where the view ray meets y = uFloorY, fading into the smoke as the real floor does
  float tg = (cameraPosition.y - uFloorY) / max(-d.y, 1e-4);
  vec3 hit = cameraPosition + d * min(tg, 3000.);
  vec3 fl = rkFloor(vec3(hit.x, uFloorY, hit.z), min(tg, 3000.));
  col = mix(col, mix(uShade, fl, 1. - smoothstep(300., 700., tg)), step(d.y, 0.) * step(0., tg) * uFloorOn);
  { float bn = rkNoise3(vec3(hd * 150., 2.)), fb = fwidth(bn) + 1e-4;
    float bar = smoothstep(.55 - fb, .55 + fb, bn) * (1. - smoothstep(.5, 1.6, fb));
    vec3 slot = mix(mix(uShade, uSmoke, .5), glowCol, (.3 + .7 * sunward) * uGlow);
    slot = mix(slot, uShade, bar * .8 + .12);
    float cu = smoothstep(.56, .64, rkNoise3(vec3(hd * 7., 3.)));
    vec3 can = mix(mix(uShade, uGreen, .3), mix(uShade, rakuLustreAvg(), .55), cu) * (.93 + .1 * smoothstep(yb, yt, te));
    float inSlot = smoothstep(y0 - fy, y0 + fy, te) * (1. - smoothstep(yb - fy, yb + fy, te));
    float inBand = smoothstep(yb - fy, yb + fy, te) * (1. - smoothstep(yt - fy, yt + fy, te));
    float low = uFarLine * (1. - smoothstep(26., 40., camY));
    col = mix(col, slot, inSlot * low); col = mix(col, can, inBand * low);
    // from above the wood goes on to the horizon: crowns as cells of verdigris, copper along the drifts, dark between
    float tc = (camY - 33.) / max(-d.y, 1e-4); vec3 hc = cameraPosition + d * clamp(tc, 0., 4000.);
    vec2 cx = hc.xz / 12.; vec2 fcx = fwidth(cx); float pxc = 1. / max(max(fcx.x, fcx.y), 1e-5), vis = smoothstep(2.5, 6., pxc);
    vec2 cc = rkCrackle(cx + (vec2(rkNoise3(vec3(cx * .7, 2.)), rkNoise3(vec3(cx * .7, 8.))) - .5), 4096.);
    float cuN = smoothstep(.47, .6, rkNoise3(vec3(hc.xz * .0065, 3.))) * .85;
    vec3 crown = mix(uGreen, rakuLustreAvg(), step(cc.y, cuN)) * (.9 + .2 * fract(cc.y * 7.3));
    crown = mix(mix(uGreen, rakuLustreAvg(), cuN), crown, vis);
    crown = mix(mix(uShade, uBlack, .45), crown, mix(.82, smoothstep(.03, .1, cc.x), vis));
    float hi = smoothstep(34., 41., camY) * uFarLine;
    col = mix(col, rakuFog(crown, clamp(tc, 0., 4000.)), step(d.y, 0.) * hi);
    // the farthest treetops stand a little over the horizon: a ragged edge, never a ruled line
    float tops = .003 + .02 * (rkNoise3(vec3(hd * 37., 6.)) * .6 + rkNoise3(vec3(hd * 150., 2.)) * .4);
    col = mix(col, mix(uShade, uGreen, .12) * .9, hi * step(0., d.y) * (1. - smoothstep(tops - fy, tops + fy, te))); }
  gl_FragColor = vec4(col, 1.);
}`;

// A free bird: the same mesh and surfaces, placed by its own matrix (companion, hoppers, the last ones through the hoop).
// uFlap = wing angle in radians (the world animates it), uFold 1 = perched with wings shut.
const FLYER_VERT = /* glsl */`
attribute float aPart, aWing; attribute vec4 aFeat;
uniform float uFlap, uFold, uBirdScale, uCast, uHead;
varying vec3 vCol; varying vec3 vL; varying float vPart, vDist; varying vec4 vF;
void main(){
  vec3 p = position; float w = abs(aWing); vec3 nl = vec3(0., 1., 0.);
  if (aFeat.z > .5 && aFeat.z < 2.5) {                             // the head turns on the neck
    vec3 nk = vec3(0., .045, .35); vec3 q = p - nk; float c = cos(uHead), s = sin(uHead);
    p = nk + vec3(q.x * c + q.z * s, q.y, -q.x * s + q.z * c); }
  if (w > 0.) { float a = mix(uFlap, -1.25, uFold) * (.55 + .75 * w); float x = p.x * mix(1., .45, uFold);
    p.x = x * cos(a); p.y += abs(x) * sin(a); p.z -= uFold * w * .16; nl = vec3(-sign(aWing) * sin(a), cos(a), 0.); }
  else if (aPart > 1.5) { nl = normalize(vec3(.35 * sign(p.x + 1e-4), 1., 0.)); }
  p *= uBirdScale;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 toEye = cameraPosition - wp.xyz; float dist = length(toEye); toEye = toEye / max(dist, 1e-4);
  vec3 nw = normalize(mat3(modelMatrix) * nl + vec3(0., 1e-6, 0.));
  vCol = rakuLustre(nw, toEye); vL = position; vPart = aPart; vDist = dist; vF = aFeat;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
// The free bird's surfaces. Feathers are cut round at the tip and parted by a hairline; the cast decides what is glaze, clay and
// copper: 0 magpie (copper flight feathers tipped black, white shoulder patch and belly), 1 pied woodpecker (black feathers
// barred white, white cheek, one oxblood cap), 2 white owl (dense black barring, a black-ringed face, black wing tips).
// Every white part is glaze and crazes.
const FLYER_FRAG = /* glsl */`
uniform float uCast;
varying vec3 vCol; varying vec3 vL; varying float vPart, vDist; varying vec4 vF;
void main(){
  float kind = vF.z, al = vF.x, ac = abs(vF.y);
  float feat = step(3.5, kind), tail = step(4.5, kind), head = step(.5, kind) * (1. - step(1.5, kind)), beak = step(1.5, kind) * (1. - step(2.5, kind)), cov = step(2.5, kind) * (1. - feat);
  float fa = fwidth(al) + 1e-5, fc = fwidth(ac) + 1e-5;
  // glaze crazes (worked out before anything is discarded)
  vec2 cx = feat > .5 ? vec2(al * 5. + vF.w * 37., vF.y * 1.2 + vF.w * 11.) : vL.xz * 15. + vL.y * 9.; vec2 fx = fwidth(cx);
  vec2 ck = rkCrackle(cx, 512.); float fw = fwidth(ck.x);
  float craze = mix(.07, rkLine(ck.x, fw, .03), smoothstep(3., 8., 1. / max(max(fx.x, fx.y), 1e-5)));
  // the round tip of a feather, and the notch between it and the next
  float tq = max(al - .72, 0.) / .28; float e = tq * tq + ac * ac;
  if (feat > .5 && al > .72 && e > 1.) discard;
  float edge = feat * max(smoothstep(1. - 1.6 * fc - .07, 1. - .6 * fc, ac), al > .72 ? smoothstep(.78, .97, e) : 0.);      // the hairline that parts two feathers
  float tip = feat * smoothstep(.8 - fa, .8 + fa, al);
  vec3 wht = uWhite * (vL.y < 0.02 && kind < .5 ? .9 : 1.), col;
  float bar = 0.;
  if (uCast > 1.5) {                                                // white owl
    float b1 = fract(al * (tail > .5 ? 6. : 4.6) + vF.w * 2.3);
    bar = feat * (1. - smoothstep(.3 - fa * 5., .3 + fa * 5., b1));
    bar = max(bar, feat * (1. - tail) * step(.5, vF.w) * smoothstep(.62, .7, al));                 // black wing tips (the primaries)
    bar = max(bar, cov * max(1. - smoothstep(.16, .2, al), step(.5, fract(vF.y * 9. + al * 1.5)) * step(.55, al)));   // a black leading edge, spotted coverts
    float bz = fract(vL.z * 13. + .3);
    bar = max(bar, (1. - feat) * (1. - cov) * (1. - head) * (1. - beak) * step(-.1, vF.y) * (1. - smoothstep(.3, .36, bz)));   // barred back
    bar = max(bar, head * max(step(al, .46) * step(.25, fract(al * 9.)), smoothstep(.46, .5, al) * (1. - smoothstep(.56, .6, al))));   // barred crown, the face ringed black
    bar = max(bar, head * step(.72, al) * step(al, .9) * step(.25, vF.y) * step(vF.y, .8));                               // the eyes
    col = mix(wht, uBlack, max(bar * .94, beak));
  } else if (uCast > .5) {                                          // pied woodpecker
    float b1 = fract(al * 4.2 + .15);
    bar = feat * smoothstep(.5 - fa * 4., .5 + fa * 4., b1) * (1. - smoothstep(.9, .94, al)) * (tail > .5 ? step(.8, abs(vF.w - .5) * 2.) : 1.);
    col = mix(uBlack, wht, bar);
    if (cov > .5) col = vPart < .5 ? wht : mix(uBlack, wht, step(.6, fract(vF.y * 7.)) * step(.3, al) * step(al, .8));
    if (kind < .5) col = vPart < .5 ? wht : uBlack;
    if (head > .5) col = vF.y > .45 && al > .3 ? uOx : (vF.y < .3 && al > .25 ? wht : uBlack);
    if (beak > .5) col = uBlack;
  } else {                                                          // magpie
    col = vPart < .5 ? wht : (vPart < 1.5 ? uBlack : vCol);
    col = mix(col, uBlack, tip * step(1.5, vPart));
  }
  float lum = dot(col, vec3(.3, .55, .15));
  col = mix(col, mix(uBlack, uStain, step(lum, .12) * .5), edge * .9);                              // a brown thread on black feathers, black on the rest
  col = mix(col, uBlack, craze * step(.6, lum));
  gl_FragColor = vec4(rakuFog(col, vDist), 1.);
}`;

// The floor: bare clay smoked black, dried in fine fissures, with pale smoke lying on it ankle-deep. Seen low the smoke
// closes the floor in within a few tens of metres (a long look through a thin layer); seen from above it is pale pools that slide.
const FLOOR_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FLOOR_GLSL = /* glsl */`
uniform float uPool, uAsh, uEntryZ;
uniform vec3 uPoolAt, uClearAt;      // (x, z, radius): a pool that always lies here; clay that always shows here
// The lying smoke as a field (no derivatives: safe in vertex shaders). At world point w seen from dist metres it returns
// (how much smoke lies there, the level above which it is a pool, dist as counted from the entry plane, pre).
// An eye standing behind the entry plane (z < uEntryZ: the view through the previous world's portal) counts smoke only from
// that plane on, so the portal shows what the first frame shows.
vec4 rkPoolField(vec3 w, float dist){
  float pre = 0.;
  { float behind = max(uEntryZ - cameraPosition.z, 0.); float kb = clamp(behind / max(w.z - cameraPosition.z, 1e-3), 0., 1.);
    pre = kb * smoothstep(3., 22., behind); dist = dist * (1. - kb) + 5.5 * pre; }
  float h = max(cameraPosition.y - w.y, .6);
  vec2 sp = w.xz * .043 + vec2(uTime * .011, uTime * .006);
  vec2 wp2 = sp + (vec2(rkNoise3(vec3(sp * 2.3, 7.)), rkNoise3(vec3(sp * 2.3 + 4.7, 9.))) - .5) * .55;
  float raw = rkNoise3(vec3(wp2, uTime * .012)) * .62 + rkNoise3(vec3(wp2 * 2.9 + 3., 3. - uTime * .02)) * .27 + rkNoise3(vec3(sp * 8.3 + 5., uTime * .03)) * .11;
  vec2 ez = vec2(w.x, w.z - uEntryZ);
  float nearEntry = exp(-min(dot(ez, ez) / 3600., 40.));
  { vec2 a = (w.xz - uPoolAt.xy) / max(uPoolAt.z, 1.), b = (w.xz - uClearAt.xy) / max(uClearAt.z, 1.);
    raw += .42 * exp(-min(dot(a, a), 40.)) - .2 * exp(-min(dot(b, b), 40.));
    // along the floor run past the entry the clay is kept mostly bare, so the low flight is over black with pools, not one pale field
    vec2 e = vec2(w.x / 17., (w.z - uEntryZ - 80.) / 44.); raw -= .2 * exp(-min(dot(e, e), 40.));
    // the entry is composed, the same on every seed and hour: bare clay under the eye and to the right of it, a pool lying in
    // from the left, one across to the right behind it, a third further down the avenue
    vec2 p1 = (ez - vec2(7.5, 24.)) / 5.5, p2 = (ez - vec2(-5.5, 44.)) / 5.5, k1 = (ez - vec2(-2.5, 5.5)) / 6., k2 = (ez - vec2(-2., 27.)) / 5.;
    raw += .34 * exp(-min(dot(p1, p1), 40.)) + .27 * exp(-min(dot(p2, p2), 40.)) - .36 * exp(-min(dot(k1, k1), 40.)) - .22 * exp(-min(dot(k2, k2), 40.));
    // this side of the entry plane (seen only in the previous world's portal): bare clay with three small pools, whatever the hour
    vec2 b1 = (ez - vec2(-2.6, -5.5)) / 3.1, b2 = (ez - vec2(2.6, -9.5)) / 3.3, b3 = (ez - vec2(-1., -15.)) / 3.6;
    float rb = .12 + .8 * (exp(-min(dot(b1, b1), 40.)) + exp(-min(dot(b2, b2), 40.)) + exp(-min(dot(b3, b3), 40.)));
    raw = mix(raw, rb, smoothstep(1., 5., -ez.y)); }
  float through = dist / h;
  float pl = mix(max(uPool, .5), 1., nearEntry);
  float th = (.53 - .045 * smoothstep(6., 70., through) + .05 * smoothstep(14., 40., h)) / pl + .16 * pre + .045 * (1. - smoothstep(3., 12., h));      // from far behind the entry the pools are drawn a little smaller, so the portal picture has black in it
  return vec4(raw, th, dist, pre);
}
// what lying smoke looks like from dist metres (a step under the white glaze, so trunks, boulders and deer stand clear of it)
vec3 rkPoolCol(float dist){ return rakuFog(mix(uSmoke, uShade, .22), dist); }
// how much the lying smoke veils a thing at w (0..1): only inside a pool, only ankle-deep. Smoke lies OVER what stands in it.
float rkAnkle(vec3 w, float dist){
  if (w.y > .36) return 0.;
  vec4 f = rkPoolField(vec3(w.x, 0., w.z), dist);
  return smoothstep(f.y - .012, f.y + .03, f.x) * (1. - smoothstep(.1, .36, w.y));
}
`;
// the floor at world point w, seen from dist metres away (shared by the floor mesh and by the sky dome below the horizon)
const FLOORDRAW_GLSL = /* glsl */`
vec3 rkFloor(vec3 w, float dist0){
  vec4 pf = rkPoolField(w, dist0); float dist = pf.z, raw = pf.x, th = pf.y;
  vec2 x = w.xz * 1.9; vec2 fx = fwidth(x); float px = 1. / max(max(fx.x, fx.y), 1e-5);
  vec3 wq = vec3(w.xz * .6, 0.);
  x += (vec2(rkNoise3(wq), rkNoise3(wq + 9.1)) - .5) * 1.3;
  x += (vec2(rkNoise3(vec3(w.xz * .16, 5.)), rkNoise3(vec3(w.xz * .16, 12.))) - .5) * 4.5;      // the hand: plates change scale in patches
  // dried clay: big plates whose fissures gape and close along their length (never a mesh of even lines), a finer craze
  // inside them near the eye, hairlines inside those within a few metres; plates fired a shade apart, a few lifted paler
  vec2 c1 = rkCrackle(x * .62, 4096.); float f1 = fwidth(c1.x);
  vec2 c2 = rkCrackle(x * 2.1 + 13., 4096.); float f2 = fwidth(c2.x);
  vec2 c3 = rkCrackle(x * 7.3 + 41., 4096.); float f3 = fwidth(c3.x);
  float v1 = smoothstep(2.5, 7., px / .62), v2 = smoothstep(2.5, 7., px / 2.1), v3 = smoothstep(3., 9., px / 7.3);
  float wv = rkNoise3(vec3(w.xz * .55, 2.)), wv2 = rkNoise3(vec3(w.xz * 1.7, 6.));
  float patchy = smoothstep(.3, .62, rkNoise3(vec3(w.xz * .11, 4.)));
  float l1 = mix(.07, rkLine(c1.x, f1, .003 + .04 * wv * wv) * smoothstep(.3, .58, wv + .3 * wv2), v1);
  float l2 = mix(.05, rkLine(c2.x, f2, .012 + .03 * wv2) * smoothstep(.3, .6, wv2 + .3 * patchy), v2) * (.35 + .65 * patchy);
  float l3 = rkLine(c3.x, f3, .03) * v3 * smoothstep(.45, .7, rkNoise3(vec3(w.xz * .8, 11.))) * .7;
  float lines = max(l1, max(l2 * .8, l3 * .55));
  // where smoke has lain longest the clay keeps a grey-brown bloom
  float ash = smoothstep(.45, .8, rkNoise3(vec3(w.xz * .045, 1.))) * uAsh;
  float lifted = step(.86, c1.y) * v1;
  vec3 col = mix(uBlack, uStain, .008 + .07 * c1.y * c1.y * v1 + .035 * c2.y * v2 + .1 * lifted + .05 * ash);      // (linear: a little stain goes a long way)
  // a fissure is a gap with pale ash settled in it: heavy ones nearly the smoke's tone, hairlines only a brown thread
  col = mix(col, mix(uStain, uSmoke, .08 + .4 * l1 * wv), lines * (.15 + .25 * l1 * wv + .08 * ash));
  // the lying smoke, as the potter would have it: a stain with an edge. Two values only, black clay and pale smoke, the
  // outline decided (one pixel of blend), sliding slowly; a tide line of stain just inside the edge, a second paler
  // level inside the widest pools. Seen low and far the pools close up a little (a long look through a thin layer),
  // but black always shows between them.
  float fr = fwidth(raw) + 1e-4;
  float pool = smoothstep(th - fr, th + fr, raw);
  float tide = pool * (1. - smoothstep(th + .012 + fr, th + .03 + 2. * fr, raw));
  float core = smoothstep(th + .085 - fr, th + .085 + fr, raw);
  vec3 smokeCol = mix(mix(uSmoke, uShade, .22), uSmoke, core);      // a step under the white glaze, so trunks, boulders and deer stand clear of it
  smokeCol = mix(smokeCol, uStain, .34 * tide);
  // the fissures show faintly through the thin edge of a pool, never through its core
  col = mix(col, smokeCol, pool * (.93 - .1 * lines * (1. - core)));
  return rakuFog(col, dist);
}
`;
const FLOOR_FRAG = /* glsl */`
varying vec3 vW;
void main(){ gl_FragColor = vec4(rkFloor(vW, length(vW - cameraPosition)), 1.); }`;

// ---------------------------------------------------------------------------------------------
// makeRakuStyle(palette): one set of shared uniforms and the material factories for the whole world.
// ---------------------------------------------------------------------------------------------
export function makeRakuStyle(palette = RAKU_PALETTE, o = {}) {
  const C = (i) => new THREE.Color(palette[i] || RAKU_PALETTE[i]);
  const stain = C(1).lerp(C(2), 0.27); stain.r *= 1.3; stain.g *= 1.08; stain.b *= 0.78;
  // what distance goes to: the smoke a step darker and a hair cooler (far trunks are bars of this against the paler low smoke)
  const shade = C(2); shade.r *= 0.60; shade.g *= 0.615; shade.b *= 0.645;
  // the sun disc: 38 degrees up, 150 degrees right of the course (+Z); right of +Z is -X
  const el = THREE.MathUtils.degToRad(o.sunElevation ?? 38), azr = THREE.MathUtils.degToRad(o.sunRight ?? 150);
  const sun = new THREE.Vector3(-Math.sin(azr) * Math.cos(el), Math.sin(el), Math.cos(azr) * Math.cos(el));
  const U = {
    uWhite: { value: C(0) }, uBlack: { value: C(1) }, uSmoke: { value: C(2) }, uGreen: { value: C(3) },
    uPenny: { value: C(4) }, uOx: { value: C(5) }, uTurq: { value: C(6) }, uStain: { value: stain }, uShade: { value: shade },
    uSunDir: { value: sun }, uTime: { value: 0 }, uFogHalf: { value: o.fogHalf ?? 120 }, uFire: { value: o.fire ?? 0 },
    uViewH: { value: 720 }, uRingY: { value: 1e4 }, uFront: { value: new THREE.Vector3(1e4, 1e4, 1e4) }, uGust: { value: new THREE.Vector4(0, 0, 0, 0) },
    uCast: { value: o.cast ?? 0 }, uBeat: { value: o.beat ?? 1 },
    // the lying smoke (every surface asks it whether it stands in a pool); the world's floor sets these
    uPool: { value: 1 }, uAsh: { value: 1 }, uEntryZ: { value: -1e6 }, uPoolAt: { value: new THREE.Vector3(0, -1e5, 1) }, uClearAt: { value: new THREE.Vector3(0, -1e5, 1) },
  };
  const mk = (vs, fs, extra, props) => new THREE.ShaderMaterial({ uniforms: { ...U, ...(extra || {}) }, vertexShader: vs, fragmentShader: fs, ...(props || {}) });
  const FR = STYLE_GLSL + FLOOR_GLSL + SURFACE_GLSL;
  return {
    uniforms: U, palette: palette.slice(),
    // white crackle glaze. Geometry needs: position, normal, uv (round fraction, along in gen-1 cells), aCk vec4 (N1, arc, ao, 0)
    // own = { ringY: {value}, front: {value: Vector3} } gives this material its own smoke height and crack fronts
    glazeMaterial: (props, own) => mk(GLAZE_VERT, FR + GLAZE_FRAG, own ? { uRingY: own.ringY || U.uRingY, uFront: own.front || U.uFront, uFogHalf: own.fogHalf || U.uFogHalf } : null, props),
    // smoked black clay. Same attributes (aCk.w = sway weight for twigs; give 0 for things that stand still)
    clayMaterial: (props, own) => mk(CLAY_VERT, FR + CLAY_FRAG, own?.fogHalf ? { uFogHalf: own.fogHalf } : null, props),
    // copper leaf discs: geometry from leafGeometry(n); turnNow is a {value} you own (u, or a height), soft its blend width
    // own = { fogHalf: {value}, minPx } gives the leaves their own smoke distance and a minimum drawn radius in pixels
    leafMaterial: (turnNow, soft = 0.3, props, own) => mk(STYLE_GLSL + FLOOR_GLSL + LEAF_VERT, STYLE_GLSL + LEAF_FRAG,
      { uTurnNow: turnNow || { value: 0 }, uTurnSoft: { value: soft }, uMinPx: { value: own?.minPx ?? 0 }, ...(own?.fogHalf ? { uFogHalf: own.fogHalf } : {}) }, { side: THREE.DoubleSide, ...(props || {}) }),
    // soft smoke discs: geometry from smokeGeometry(list); lift/spin/alpha are per material
    smokeMaterial: (so = {}) => mk('uniform float uTime;\n' + SMOKE_VERT, SMOKE_FRAG,
      { uLift: so.lift || { value: 0 }, uSpin: { value: so.spin ?? 0 }, uFlat: { value: so.flat ? 1 : 0 }, uAlpha: { value: Math.min(so.alpha ?? 0.2, 0.25) }, uRope: { value: so.rope ?? 0 }, uBend: { value: so.bend || new THREE.Vector3() }, uFar: { value: new THREE.Vector3(...(so.far || [150, 500, 0.7])) }, uGate: so.gate || { value: new THREE.Vector2(0, 0) },
        uSmokeCol: { value: so.pale < 0 ? C(2).lerp(C(1), -so.pale * 0.5) : C(2).lerp(C(0), so.pale ?? 0.25) } },      // pale < 0: sootier, toward the clay
      { transparent: true, depthWrite: false }),
    // magpies: geometry from birdGeometry(list); turnNow as for leaves (a bird lifts when it passes its aBird.x)
    birdMaterial: (turnNow, scale = 1) => mk(STYLE_GLSL + BIRD_VERT, STYLE_GLSL + BIRD_FRAG,
      { uTurnNow: turnNow || { value: 0 }, uBirdScale: { value: scale } }, { side: THREE.DoubleSide }),
    // one free bird placed by its mesh matrix: geometry from birdGeometry with a single instance; flap/fold are {value}s you own
    flyerMaterial: (flap, fold, scale = 1.3, head) => mk(STYLE_GLSL + FLYER_VERT, STYLE_GLSL + FLYER_FRAG,
      { uFlap: flap || { value: 0 }, uFold: fold || { value: 0 }, uBirdScale: { value: scale }, uHead: head || { value: 0 } }, { side: THREE.DoubleSide }),
    // the grove floor: black clay with dried fissures and lying smoke (pool 0..1 how much smoke lies, ash 0..1 stain)
    floorMaterial: (fo = {}) => { U.uPool.value = fo.pool ?? 1; U.uAsh.value = fo.ash ?? 1; U.uEntryZ.value = fo.entryZ ?? -1e6; if (fo.poolAt) U.uPoolAt.value.copy(fo.poolAt); if (fo.clearAt) U.uClearAt.value.copy(fo.clearAt);
      return mk(FLOOR_VERT, STYLE_GLSL + FLOOR_GLSL + FLOORDRAW_GLSL + FLOOR_FRAG, fo.fogHalf ? { uFogHalf: fo.fogHalf } : null); },
    // sky dome (radius 1 sphere scaled by you, follows the camera in the shader; renderOrder -1, frustumCulled false)
    // so = { band (0.11), floor: true to paint the floor below the horizon, floorY, pool, ash, fogHalf: the floor material's own values }
    skyMaterial: (so = {}) => mk(SKY_VERT, STYLE_GLSL + FLOOR_GLSL + FLOORDRAW_GLSL + SKY_FRAG, { uBand: { value: so.band ?? 0.11 }, uFarLine: { value: so.farLine ?? 0 }, uGlow: { value: so.glow ?? 0 }, uFloorY: { value: so.floorY ?? 0 }, uFloorOn: { value: so.floor ? 1 : 0 },
      ...(so.fogHalf ? { uFogHalf: so.fogHalf } : {}) }, { side: THREE.BackSide, depthWrite: false, depthTest: false }),
  };
}

// --- geometry helpers (exported so grove trees, the hoop, boulders and deer are swept and mapped the same way) ---
// A growing buffer for swept limbs. sweep() appends one tapered tube with the crackle mapping; build() makes the geometry.
export function makeSweeper() {
  const P = [], Nn = [], UV = [], CK = [], I = [];
  const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _pt = new THREE.Vector3();
  return {
    get vertexCount() { return P.length / 3; }, get triangleCount() { return I.length / 3; },
    // pts: Vector3[], radii: number[], o: { sides, cell (m, generation-1 cell at the base), arc0, ao(p, radial, s, i) -> 0..1,
    //   sway(sFraction) -> 0..1, shape(theta, s) -> radius multiplier, cap }
    sweep(pts, radii, o = {}) {
      const K = o.sides || 8, n = pts.length, base = P.length / 3;
      const N1 = Math.max(3, Math.round((2 * Math.PI * radii[0]) / (o.cell || 1)));
      _t.subVectors(pts[1], pts[0]).normalize();
      _n.set(1, 0, 0); if (Math.abs(_t.x) > 0.9) _n.set(0, 0, 1);
      _n.addScaledVector(_t, -_n.dot(_t)).normalize();
      let s = 0, v = 0; const prevT = _t.clone();
      for (let i = 0; i < n; i++) {
        if (i < n - 1) _t.subVectors(pts[i + 1], pts[Math.max(i - 1, 0)]).normalize(); else _t.subVectors(pts[i], pts[i - 1]).normalize();
        _q.setFromUnitVectors(prevT, _t); _n.applyQuaternion(_q); _n.addScaledVector(_t, -_n.dot(_t)).normalize(); prevT.copy(_t);
        _b.crossVectors(_t, _n);
        if (i > 0) { const ds = pts[i].distanceTo(pts[i - 1]); s += ds; v += (ds * N1) / (Math.PI * (radii[i] + radii[i - 1])); }
        for (let k = 0; k <= K; k++) {
          const th = (k / K) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
          _v.copy(_n).multiplyScalar(c).addScaledVector(_b, sn);
          const r = radii[i] * (o.shape ? o.shape(th, s, _v) : 1);
          _pt.copy(pts[i]).addScaledVector(_v, r);
          P.push(_pt.x, _pt.y, _pt.z); Nn.push(_v.x, _v.y, _v.z); UV.push(k / K, v);
          CK.push(N1, (o.arc0 || 0) + s, o.ao ? Math.min(1, Math.max(0, o.ao(_pt, _v, s, i))) : 0, o.sway ? o.sway(i / (n - 1)) : 0);
        }
        if (i > 0) for (let k = 0; k < K; k++) {
          const a = base + (i - 1) * (K + 1) + k, b = a + K + 1;
          I.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
      return { arcEnd: (o.arc0 || 0) + s, N1 };
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('aCk', new THREE.Float32BufferAttribute(CK, 4));
      g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      return g;
    },
  };
}

// leafGeometry(pos, leaf, turn): instanced one-triangle discs. pos xyz per leaf (disc centre), leaf (azimuth, tilt, phase 0..1,
// radius m), turn (value of the material's uTurnNow at which the leaf goes over; 1e9 = stays green for good).
export function leafGeometry(pos, leaf, turn) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 2, 0, -1.7321, -1, 0, 1.7321, -1, 0], 3));
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(leaf, 4));
  g.setAttribute('aTurn', new THREE.InstancedBufferAttribute(turn, 1));
  g.instanceCount = turn.length;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// smokeGeometry(pos, puff): instanced soft discs. pos xyz, puff (size m, seed 0..1, rope rate (0 = stays put; see smokeMaterial({ rope, bend })), bob m).
export function smokeGeometry(pos, puff, gate) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('aPuff', new THREE.InstancedBufferAttribute(puff, 4));
  g.setAttribute('aGate', new THREE.InstancedBufferAttribute(gate || new Float32Array(puff.length / 4), 1));
  g.instanceCount = puff.length / 4;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// birdGeometry(roost, bird): instanced magpies (49 triangles each, 1.2 m beak to tail tip at scale 1, beak toward local +Z).
// roost xyz, bird (lift threshold in uTurnNow units, seed 0..1, rope radius m, rope phase 0..1).
export function birdGeometry(roost, bird) {
  const P = [], PT = [], W = [];
  const tri = (a, b, c, part, wa = 0, wb = 0, wc = 0) => { P.push(...a, ...b, ...c); PT.push(part, part, part); W.push(wa, wb, wc); };
  const st = [[0.50, 0.0, -0.012], [0.40, 0.055, 0.03], [0.30, 0.048, 0.012], [0.14, 0.115, 0], [-0.06, 0.09, 0.005], [-0.2, 0.03, 0.02]];
  const ring = ([z, r, y]) => [[0, y + r, z], [r * 0.9, y, z], [0, y - r * 0.95, z], [-r * 0.9, y, z]];
  for (let i = 0; i < st.length - 1; i++) {
    const A = ring(st[i]), B = ring(st[i + 1]);
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4, lower = k === 1 || k === 2;
      const part = lower && (i === 2 || i === 3) ? 0 : 1;
      if (i === 0) tri(A[0], B[k2], B[k], 1); else { tri(A[k], A[k2], B[k], part); tri(A[k2], B[k2], B[k], part); }
    }
  }
  for (const sg of [-1, 1]) {
    const A = [sg * 0.06, 0.05, 0.16], B = [sg * 0.06, 0.05, -0.06], Cc = [sg * 0.34, 0.05, 0.15], D = [sg * 0.32, 0.05, -0.11],
      E = [sg * 0.62, 0.05, -0.02], F = [sg * 0.5, 0.05, -0.15];
    const w = (p) => (sg * (Math.abs(p[0]) - 0.06)) / 0.56 + sg * 0.001;
    tri(A, Cc, B, 0, w(A), w(Cc), w(B)); tri(B, Cc, D, 2, w(B), w(Cc), w(D));
    tri(Cc, E, D, 2, w(Cc), w(E), w(D)); tri(D, E, F, 1, w(D), w(E), w(F));
    tri([sg * 0.035, 0.02, -0.2], [sg * 0.115, 0.02, -0.5], [sg * 0.07, 0.02, -0.55], 2);     // copper tail edge
  }
  const rl = [-0.035, 0.02, -0.2], rr = [0.035, 0.02, -0.2], ml = [-0.07, 0.02, -0.55], mr = [0.07, 0.02, -0.55], tp = [0, 0.02, -0.72];
  tri(rl, rr, mr, 1); tri(rl, mr, ml, 1); tri(ml, mr, tp, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(PT, 1));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
  g.setAttribute('aRoost', new THREE.InstancedBufferAttribute(roost, 3));
  g.setAttribute('aBird', new THREE.InstancedBufferAttribute(bird, 4));
  g.instanceCount = bird.length / 4;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// flyerGeometry(): one free bird seen large (the companion, the two on the boulder, the last ones through the hoop), ~290
// triangles: a body with rounded shoulders, a head and a beak, wings of coverts and separate flight feathers (five secondaries,
// seven primaries a side), a fanned tail of seven feathers. Same local frame as birdGeometry (beak toward +Z, 1.2 m beak to tail
// tip at scale 1). aPart as there; aWing the signed span fraction; aFeat = (along 0..1, across -1..1, kind, feather hash) with
// kind 0 body, 1 head, 2 beak, 3 covert, 4 flight feather, 5 tail feather. Feather tips are cut round in FLYER_FRAG.
export function flyerGeometry() {
  const P = [], PT = [], W = [], F = [];
  const v = (p, part, w, f) => { P.push(p[0], p[1], p[2]); PT.push(part); W.push(w); F.push(f[0], f[1], f[2], f[3]); };
  const tri = (a, b, c, part, w, fa, fb, fc) => { v(a, part, w(a), fa); v(b, part, w(b), fb); v(c, part, w(c), fc); };
  const w0 = () => 0;
  const ringOf = ([z, r, y], K) => { const o = []; for (let k = 0; k < K; k++) { const a = (k / K) * Math.PI * 2, c = Math.cos(a); o.push([Math.sin(a) * r * 0.92, y + c * r * (c > 0 ? 1 : 0.95), z, c]); } return o; };
  // body: breast, rounded shoulders, belly, rump (lower flanks and belly are glaze, the rest clay)
  const st = [[0.36, 0.05, 0.045], [0.3, 0.086, 0.032], [0.2, 0.118, 0.012], [0.07, 0.125, 0], [-0.06, 0.1, 0.004], [-0.16, 0.06, 0.015], [-0.225, 0.028, 0.02]];
  for (let i = 0; i < st.length - 1; i++) { const A = ringOf(st[i], 8), B = ringOf(st[i + 1], 8);
    for (let k = 0; k < 8; k++) { const k2 = (k + 1) % 8, part = k >= 2 && k <= 5 && i >= 1 && i <= 4 ? 0 : 1;
      const fa = [i / 6, A[k][3], 0, 0], fb = [i / 6, A[k2][3], 0, 0], fc = [(i + 1) / 6, B[k][3], 0, 0], fd = [(i + 1) / 6, B[k2][3], 0, 0];
      tri(A[k], A[k2], B[k], part, w0, fa, fb, fc); tri(A[k2], B[k2], B[k], part, w0, fb, fd, fc); } }
  // head and beak (kind 1 and 2: the shader can turn them on the neck)
  const hd = [[0.36, 0.05, 0.045], [0.4, 0.074, 0.062], [0.45, 0.07, 0.07], [0.495, 0.042, 0.064], [0.52, 0.02, 0.058]];
  for (let i = 0; i < hd.length - 1; i++) { const A = ringOf(hd[i], 6), B = ringOf(hd[i + 1], 6);
    for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6;
      const fa = [i / 4, A[k][3], 1, 0], fb = [i / 4, A[k2][3], 1, 0], fc = [(i + 1) / 4, B[k][3], 1, 0], fd = [(i + 1) / 4, B[k2][3], 1, 0];
      tri(A[k], A[k2], B[k], 1, w0, fa, fb, fc); tri(A[k2], B[k2], B[k], 1, w0, fb, fd, fc); } }
  { const A = ringOf(hd[4], 6), tip = [0, 0.048, 0.615]; for (let k = 0; k < 6; k++) tri(A[k], A[(k + 1) % 6], tip, 1, w0, [0, 0, 2, 0], [0, 0, 2, 0], [1, 0, 2, 0]); }
  // one feather: a quad from the root and a quad for the tip (cut round in the shader); o = root, d = unit direction, s = unit side
  const feather = (o, d, s, len, wr, wt, y, part, kind, hash, w) => {
    const at = (al, ac, wd) => [o[0] + d[0] * len * al + s[0] * wd * ac, y, o[2] + d[2] * len * al + s[2] * wd * ac];
    const r0 = at(0, -1, wr), r1 = at(0, 1, wr), m0 = at(0.72, -1, wt), m1 = at(0.72, 1, wt), t0 = at(1, -1, wt), t1 = at(1, 1, wt);
    const f = (al, ac) => [al, ac, kind, hash];
    tri(r0, r1, m1, part, w, f(0, -1), f(0, 1), f(0.72, 1)); tri(r0, m1, m0, part, w, f(0, -1), f(0.72, 1), f(0.72, -1));
    tri(m0, m1, t1, part, w, f(0.72, -1), f(0.72, 1), f(1, 1)); tri(m0, t1, t0, part, w, f(0.72, -1), f(1, 1), f(1, -1)); };
  for (const sg of [-1, 1]) {
    const w = (p) => sg * (Math.min(1, Math.max(0, (Math.abs(p[0]) - 0.06) / 0.58)) + 0.001);
    const S = [sg * 0.07, 0.056, 0.2], Wr = [sg * 0.36, 0.056, 0.215], S2 = [sg * 0.07, 0.056, 0.085], Wr2 = [sg * 0.36, 0.056, 0.11], T = [sg * 0.585, 0.056, 0.135], T2 = [sg * 0.55, 0.056, 0.07];
    const cv = (al, p) => [al, w(p) * sg, 3, 0];
    // coverts: the arm (the shoulder patch, glaze) and the hand (clay)
    tri(S, Wr, Wr2, 0, w, cv(0, S), cv(0, Wr), cv(1, Wr2)); tri(S, Wr2, S2, 0, w, cv(0, S), cv(1, Wr2), cv(1, S2));
    tri(Wr, T, T2, 1, w, cv(0, Wr), cv(0, T), cv(1, T2)); tri(Wr, T2, Wr2, 1, w, cv(0, Wr), cv(1, T2), cv(1, Wr2));
    // secondaries along the arm, primaries fanning round the hand
    for (let j = 0; j < 5; j++) { const t = (j + 0.5) / 5, o = [S2[0] + (Wr2[0] - S2[0]) * t, 0, S2[2] + (Wr2[2] - S2[2]) * t + 0.02], a = (4 + 9 * t) * Math.PI / 180;
      feather(o, [sg * Math.sin(a), 0, -Math.cos(a)], [sg * Math.cos(a), 0, Math.sin(a)], 0.215 + 0.03 * t, 0.034, 0.036, 0.05 - j * 0.0016, 2, 4, (j + 0.37) / 12, w); }
    for (let j = 0; j < 7; j++) { const t = (j + 0.5) / 7, o = [Wr2[0] + (T2[0] - Wr2[0]) * t, 0, Wr2[2] + (T2[2] - Wr2[2]) * t + 0.02], a = (14 + 62 * Math.pow(t, 1.25)) * Math.PI / 180;
      feather(o, [sg * Math.sin(a), 0, -Math.cos(a)], [sg * Math.cos(a), 0, Math.sin(a)], 0.275 - 0.05 * t, 0.026, 0.03, 0.042 - j * 0.0016, 2, 4, (j + 5.37) / 12, w); }
  }
  // the tail: seven feathers fanned, the middle ones longest, the outer pair copper
  for (let j = 0; j < 7; j++) { const a = (j - 3) * 7.5 * Math.PI / 180, c = Math.abs(j - 3);
    feather([Math.sin(a) * 0.02, 0, -0.19], [Math.sin(a), 0, -Math.cos(a)], [Math.cos(a), 0, Math.sin(a)], 0.55 - 0.035 * c, 0.022, 0.036, 0.03 - c * 0.003, c === 3 ? 2 : 1, 5, (j + 0.5) / 7, w0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(PT, 1));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
  g.setAttribute('aFeat', new THREE.Float32BufferAttribute(F, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return g;
}

// The Old Stem's safe camera line (local space): a 40 m approach, one and a quarter turns round the trunk with the trunk on the
// left, then a 79 m straight to the portal seat. t 0..1 over the helix only.
const FLY = { a0: THREE.MathUtils.degToRad(-60), a1: THREE.MathUtils.degToRad(395), y0: 24, y1: 54, approach: 40, exit: 79, exitPitch: THREE.MathUtils.degToRad(5) };
function flyHelix(t, out = new THREE.Vector3()) {
  const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const a = FLY.a0 + (FLY.a1 - FLY.a0) * t;
  const r = t < 0.55 ? 24.5 - 11 * ss(t / 0.55) : 13.5 + 5 * ss((t - 0.55) / 0.45);
  return out.set(-r * Math.cos(a), FLY.y0 + (FLY.y1 - FLY.y0) * t, r * Math.sin(a));
}
function flyLine() {
  const pts = [], h0 = new THREE.Vector3(Math.sin(FLY.a0), 0, Math.cos(FLY.a0)), p0 = flyHelix(0);
  for (let i = 8; i >= 1; i--) pts.push(p0.clone().addScaledVector(h0, (-FLY.approach * i) / 8).setY(FLY.y0 - 4 * Math.pow(i / 8, 1.5)));
  for (let i = 0; i <= 64; i++) pts.push(flyHelix(i / 64));
  const h1 = new THREE.Vector3(Math.sin(FLY.a1) * Math.cos(FLY.exitPitch), Math.sin(FLY.exitPitch), Math.cos(FLY.a1) * Math.cos(FLY.exitPitch)), p1 = flyHelix(1);
  for (let i = 1; i <= 8; i++) pts.push(p1.clone().addScaledVector(h1, (FLY.exit * i) / 8));
  return { pts, exitDir: h1, entryDir: h0 };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, yieldNow = ctx.yield ? () => ctx.yield() : async () => {};
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const style = opts.style || makeRakuStyle(opts.palette || RAKU_PALETTE, opts);
  const U = style.uniforms;
  const group = new THREE.Group(); group.name = 'old-stem';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), UP = V3(0, 1, 0);
  const lerp = (a, b, t) => a + (b - a) * t, sat = (x) => Math.min(1, Math.max(0, x));
  const H = 80 * (opts.heightScale ?? 1);
  // a private random stream for what this round added (patches, the skirt): it leaves ctx.rng's sequence as it was
  const pr = (() => { let a = (((ctx.seed ?? 1) * 2654435761) ^ 0x9e3779b9) >>> 0; const f = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.range = (lo, hi) => lo + (hi - lo) * f(); f.gauss = () => Math.sqrt(-2 * Math.log(1 - f() * 0.999999)) * Math.cos(6.2832 * f()); return f; })();

  // ---- the camera line and a hash grid of samples along it, for clearance tests ----
  const fly = flyLine(), CELL = 10, grid = new Map(), gkey = (i, j, k) => (i + 64) * 16384 + (j + 64) * 128 + (k + 64);
  { const a = V3(), n = fly.pts.length;
    for (let i = 0; i < n - 1; i++) { const d = fly.pts[i].distanceTo(fly.pts[i + 1]), m = Math.max(1, Math.ceil(d / 1.0));
      for (let j = 0; j < m; j++) { a.lerpVectors(fly.pts[i], fly.pts[i + 1], j / m);
        const k = gkey(Math.floor(a.x / CELL), Math.floor(a.y / CELL), Math.floor(a.z / CELL));
        let c = grid.get(k); if (!c) grid.set(k, (c = [])); c.push(a.x, a.y, a.z); } } }
  // distance from (x,y,z) to the camera line, exact up to 10 m, 99 beyond
  const flyDist = (x, y, z) => {
    const ix = Math.floor(x / CELL), iy = Math.floor(y / CELL), iz = Math.floor(z / CELL); let best = 9801;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      const cell = grid.get(gkey(ix + a, iy + b, iz + c)); if (!cell) continue;
      for (let i = 0; i < cell.length; i += 3) { const dx = cell[i] - x, dy = cell[i + 1] - y, dz = cell[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
    }
    return Math.sqrt(best);
  };
  const minClear = (pts, radii, from = 1) => { let m = 99; for (let i = from; i < pts.length; i++) m = Math.min(m, flyDist(pts[i].x, pts[i].y, pts[i].z) - radii[i]); return m; };

  // ---- skeleton ----
  const grow = (p0, dir, L, n, rise, wob) => {
    const pts = [p0.clone()], d = dir.clone(), p = p0.clone(), curl = (wob[0] < 0 ? -1 : 1) * (0.45 + 0.75 * Math.abs(wob[0])) / n, cc = Math.cos(curl), cs = Math.sin(curl);
    for (let i = 1; i <= n; i++) {
      { const dx = d.x * cc - d.z * cs, dz = d.x * cs + d.z * cc; d.x = dx; d.z = dz; }
      d.y += rise / n; d.x += wob[i * 3] * 0.2; d.y += wob[i * 3 + 1] * 0.1; d.z += wob[i * 3 + 2] * 0.2;
      d.normalize(); p.addScaledVector(d, L / n); pts.push(p.clone());
    }
    return pts;
  };
  const wobble = (n) => { const w = new Float32Array((n + 1) * 3); for (let i = 0; i < w.length; i++) w[i] = rng.range(-1, 1); return w; };
  const taper = (r0, n, tip = 0.14, pw = 0.85) => { const r = []; for (let i = 0; i <= n; i++) r.push(Math.max(0.045, r0 * (1 - (1 - tip) * Math.pow(i / n, pw)))); return r; };
  const branches = [];
  // trunk: 9 m thick at the foot, 6 m at 50 m, a slow sway in the leader
  const leanA = rng.range(0, Math.PI * 2), leanM = rng.range(0.3, 0.75), leanF = rng.range(0.8, 1.5), topLean = rng.range(1.2, 3.2);
  const axis = (y, out = V3()) => { const t = y / H, o = leanM * Math.sin(t * Math.PI * leanF * 2 + leanA) * sat(y / 12) + topLean * Math.pow(sat((y - 0.7 * H) / (0.3 * H)), 2);
    return out.set(Math.cos(leanA) * o, y, Math.sin(leanA) * o); };
  const trunkR = (y) => (y < 0 ? 4.5 - y * 0.5 : y < 50 ? 4.5 - 1.5 * (y / 50) : 0.28 + 2.72 * (1 - Math.pow(sat((y - 50) / (H - 50)), 1.25)));
  { const pts = [], radii = [], n = 50;
    for (let i = 0; i <= n; i++) { const t = i / n, y = -1.5 + (H + 1.5) * (0.35 * t + 0.65 * t * t * (1.3 - 0.3 * t)) / 1.0; pts.push(axis(y)); radii.push(trunkR(y)); }
    branches.push({ pts, radii, level: 0, arc0: 0, cell: opts.trunkCell ?? 1.4, sides: 30, attach: [] }); }
  const trunk = branches[0];
  const GOLD = Math.PI * (3 - Math.sqrt(5)), az0 = rng.range(0, Math.PI * 2);
  const nLimbs = 14; let dropped = 0;
  for (let i = 0; i < nLimbs; i++) {
    const t = i / (nLimbs - 1);
    const hBase = 20 + Math.pow(t, 0.9) * (H - 30) + rng.range(-1, 1), azBase = az0 + i * GOLD + rng.range(-0.25, 0.25);
    const L = lerp(44, 13, Math.pow(t, 1.1)) * rng.range(0.9, 1.1), e0 = THREE.MathUtils.degToRad(lerp(16, 52, t) + rng.range(-5, 6));
    const rise = lerp(0.62, 0.2, t) * rng.range(0.8, 1.2), r0 = lerp(1.25, 0.42, t) * rng.range(0.92, 1.08);
    const n = Math.max(6, Math.round(L / 3.2)), wob = wobble(n), radii = taper(r0, n, 0.13, 0.8);
    let best = null, bestC = -1e9;
    search: for (let ai = 0; ai < 23; ai++) for (let hi = 0; hi < 7; hi++) {
      const az = azBase + (ai === 0 ? 0 : Math.ceil(ai / 2) * 0.28 * (ai % 2 ? 1 : -1)), h = hBase + (hi === 0 ? 0 : Math.ceil(hi / 2) * 2.2 * (hi % 2 ? 1 : -1));
      if (h < 19.5) continue;
      const dir = V3(Math.sin(az) * Math.cos(e0), Math.sin(e0), Math.cos(az) * Math.cos(e0));
      const pts = grow(axis(h), dir, L, n, rise, wob), c = minClear(pts, radii);
      if (c > bestC) { bestC = c; best = { pts, h }; }
      if (c >= 7.0) break search;
    }
    if (bestC < 6.4) { dropped++; continue; }
    { // smooth the great limbs: twice the rings through the same points, so no kinks show at the close pass
      const cv = new THREE.CatmullRomCurve3(best.pts, false, 'centripetal'), m = n * 2, np = [], nr = [];
      for (let k = 0; k <= m; k++) { np.push(cv.getPoint(k / m)); const x = (k / m) * n, i0 = Math.min(n - 1, Math.floor(x)); nr.push(lerp(radii[i0], radii[i0 + 1], x - i0)); }
      best.pts = np; radii.length = 0; for (const r of nr) radii.push(r); }
    const limb = { emerge: trunkR(best.h) * 1.12, pts: best.pts, radii, level: 1, arc0: best.h + 1.5, cell: 0.75, sides: 12, attach: [], L, order: t };
    branches.push(limb); { const d0 = V3().subVectors(best.pts[1], best.pts[0]).normalize(), hl = Math.hypot(d0.x, d0.z) || 1; trunk.attach.push({ p: best.pts[0].clone().addScaledVector(d0, trunkR(best.h)), r: r0, dx: d0.x / hl, dz: d0.z / hl }); }
    if (i % 3 === 2) await yieldNow();
  }
  await yieldNow();
  // secondaries and tertiaries: forks alternate sides and turn up; anything that would come within 6.5 m of the camera line is not grown
  const fork = (par, f, sideSign, len, level) => {
    const n = par.pts.length - 1, fi = Math.min(n - 1, Math.max(1, Math.round(f * n)));
    const tan = V3().subVectors(par.pts[fi + 1], par.pts[fi - 1]).normalize(), sv = V3().crossVectors(tan, UP);
    if (sv.lengthSq() < 1e-4) sv.set(1, 0, 0); sv.normalize().multiplyScalar(sideSign);
    const phi = rng.range(0.7, 1.15), dir = tan.clone().multiplyScalar(Math.cos(phi)).addScaledVector(sv, Math.sin(phi)); dir.y += rng.range(0.05, 0.3); dir.normalize();
    const r0 = Math.max(level === 2 ? 0.16 : 0.09, par.radii[fi] * rng.range(0.5, 0.62)), m = Math.max(3, Math.round(len / (level === 2 ? 3.4 : 2.6)));
    const wob = wobble(m), radii = taper(r0, m, 0.2, 0.9), pts = grow(par.pts[fi], dir, len, m, rng.range(0.15, 0.5), wob);
    if (minClear(pts, radii) < 6.5) return null;
    let s = 0; for (let k = 1; k <= fi; k++) s += par.pts[k].distanceTo(par.pts[k - 1]);
    const b = { emerge: par.radii[fi] * 1.1, pts, radii, level, arc0: par.arc0 + s, cell: level === 2 ? 0.5 : 0.36, sides: level === 2 ? 7 : 5, attach: [] };
    par.attach.push({ p: pts[0].clone().addScaledVector(dir, par.radii[fi]), r: r0 });
    branches.push(b); return b;
  };
  const limbs = branches.filter((b) => b.level === 1);
  const droop = (par, f, sideSign, long) => {
    const n = par.pts.length - 1, fi = Math.min(n - 1, Math.max(1, Math.round(f * n)));
    const tan = V3().subVectors(par.pts[fi + 1], par.pts[fi - 1]).normalize(), sv = V3().crossVectors(tan, UP);
    if (sv.lengthSq() < 1e-4) sv.set(1, 0, 0); sv.normalize().multiplyScalar(sideSign);
    const dir = tan.clone().multiplyScalar(long ? rng.range(0.0, 0.3) : rng.range(0.25, 0.7)).addScaledVector(sv, rng.range(0.6, 1)); dir.y = long ? rng.range(-0.12, 0.05) : rng.range(-0.3, 0.0); dir.normalize();
    const len = long ? rng.range(17, 25) : rng.range(9, 15), m = Math.max(4, Math.round(len / 2.6)), r0 = Math.max(long ? 0.3 : 0.2, Math.min(long ? 0.5 : 0.38, par.radii[fi] * 0.55));
    const wob = wobble(m), radii = taper(r0, m, 0.2, 0.9), pts = grow(par.pts[fi], dir, len, m, long ? rng.range(-0.45, -0.2) : rng.range(-0.75, -0.35), wob);
    for (let k = 1; k <= m; k++) if (pts[k].y < 13.5) pts[k].y = 13.5 + (13.5 - pts[k].y) * 0.2;
    if (minClear(pts, radii) < 6.5) return null;
    let sa = 0; for (let k = 1; k <= fi; k++) sa += par.pts[k].distanceTo(par.pts[k - 1]);
    const b = { emerge: par.radii[fi] * 1.1, pts, radii, level: 2, arc0: par.arc0 + sa, cell: 0.5, sides: 6, attach: [], droop: true, long: !!long };
    par.attach.push({ p: pts[0].clone().addScaledVector(dir, par.radii[fi]), r: r0 });
    branches.push(b); return b;
  };
  // hangers: boughs that leave the low limbs outward and go down, to 12 m above the floor: the crown's skirt, below the eye
  // through the first turn of the flight (so there are leaves under the turning line from the moment we come in)
  const hang = (par, f, sideSign) => {
    const n = par.pts.length - 1, fi = Math.min(n - 1, Math.max(1, Math.round(f * n))), p0 = par.pts[fi];
    const rl = Math.hypot(p0.x, p0.z) || 1, tan = V3().subVectors(par.pts[fi + 1], par.pts[fi - 1]).normalize();
    const dir = V3(p0.x / rl, 0, p0.z / rl).multiplyScalar(rng.range(0.3, 0.8)).addScaledVector(V3(-p0.z / rl, 0, p0.x / rl), sideSign * rng.range(0.3, 0.9)).addScaledVector(tan, 0.2); dir.y = rng.range(-0.75, -0.4); dir.normalize();
    const len = rng.range(13, 21), m = Math.max(5, Math.round(len / 3.2)), r0 = Math.max(0.2, Math.min(0.36, par.radii[fi] * 0.5));
    const wob = wobble(m), radii = taper(r0, m, 0.2, 0.9), pts = grow(p0, dir, len, m, rng.range(0.1, 0.5), wob);
    for (let k = 1; k <= m; k++) if (pts[k].y < 12) pts[k].y = 12 + (12 - pts[k].y) * 0.25;
    if (minClear(pts, radii) < 6.5) return null;
    let sa = 0; for (let k = 1; k <= fi; k++) sa += par.pts[k].distanceTo(par.pts[k - 1]);
    const b = { emerge: par.radii[fi] * 1.1, pts, radii, level: 2, arc0: par.arc0 + sa, cell: 0.5, sides: 5, attach: [], droop: true, hanger: true };
    par.attach.push({ p: pts[0].clone().addScaledVector(dir, par.radii[fi]), r: r0 });
    branches.push(b); return b;
  };
  for (let li = 0; li < limbs.length; li++) { const limb = limbs[li]; if (limb.order > 0.72) continue;
    const nh = Math.round(lerp(14, 6, limb.order / 0.72));
    for (let k = 0; k < nh; k++) { const f = lerp(0.3, 0.98, (k + rng.range(0.15, 0.85)) / nh), side = k % 2 ? 1 : -1; hang(limb, f, side) || hang(limb, f, -side) || hang(limb, Math.min(0.98, f + 0.12), side); }
    if (li % 2 === 1) await yieldNow(); }
  await yieldNow();
  for (let li = 0; li < limbs.length; li++) { const limb = limbs[li]; if (limb.order > 0.62) continue;
    const nd = Math.round(lerp(6, 3, limb.order / 0.62));
    for (let k = 0; k < nd; k++) { const f = lerp(0.42, 0.97, (k + rng.range(0.15, 0.85)) / nd), side = k % 2 ? 1 : -1; droop(limb, f, side) || droop(limb, f, -side); }
    // sweepers: long boughs that leave the limb sideways and run round the crown, so there is wood (and leaves) between the great limbs
    for (const [f, side] of [[0.5, 1], [0.5, -1], [0.78, 1], [0.78, -1]]) { const sw = droop(limb, f + rng.range(-0.06, 0.06), side, true);
      if (sw) for (let q = 0; q < 3; q++) { const fq = lerp(0.3, 0.95, (q + rng.range(0.2, 0.8)) / 3); if (limb.order < 0.5 && q !== 2) hang(sw, fq, q ? side : -side) || droop(sw, fq, -1); else droop(sw, fq, q % 2 ? 1 : -1); } }
    if (li % 2 === 1) await yieldNow(); }
  await yieldNow();
  for (let li = 0; li < limbs.length; li++) {
    const limb = limbs[li], ns = Math.round(lerp(6, 3, limb.order));
    for (let k = 0; k < ns; k++) {
      const f = lerp(0.26, 0.9, (k + rng.range(0.2, 0.8)) / ns), side = (k + li) % 2 ? 1 : -1;
      const sec = fork(limb, f, side, (1 - f) * limb.L * 0.55 + rng.range(5, 9), 2) || fork(limb, f, -side, (1 - f) * limb.L * 0.45 + 5, 2);
      if (!sec) continue;
      const nt = rng.int(2, 3);
      for (let q = 0; q < nt; q++) fork(sec, lerp(0.3, 0.9, (q + rng.range(0.2, 0.8)) / nt), (q % 2 ? 1 : -1) * side, rng.range(4, 8.5), 3);
    }
    if (li % 2 === 1) await yieldNow();
  }
  await yieldNow();

  // the skirt on the outside of the first half-turn: boughs that come down from the wood above and outside the camera line and
  // spread 6-12 m below it, so a tier of leaves lies under the eye on the outside of the turn from the moment we go in
  { const cands = branches.filter((b) => b.level >= 1 && !b.hanger), wobP = (n) => { const w = new Float32Array((n + 1) * 3); for (let i = 0; i < w.length; i++) w[i] = pr.range(-1, 1); return w; };
    // (and, over the last half-turn, a ceiling: boughs that come up and out to 7-12 m above the line, so green is overhead to the end)
    for (let k = 0; k < 90; k++) { const up = k >= 46, t = up ? lerp(0.56, 1.0, (k - 46 + pr()) / 44) : lerp(0.0, 0.6, (k + pr()) / 46), c = flyHelix(t), rl = Math.hypot(c.x, c.z) || 1, ox = c.x / rl, oz = c.z / rl;
      const out = up ? pr.range(3, 20) : pr.range(8, 25), q = V3(c.x + ox * out, c.y + (up ? pr.range(7.5, 12) : -pr.range(6, 12)), c.z + oz * out);
      let best = null, bd = 1e9, bi = 0;
      for (const b of cands) for (let i = 1; i < b.pts.length; i++) { const p = b.pts[i], dy = p.y - q.y; if ((up ? dy < -16 || dy > 5 : dy < 5 || dy > 26) || b.radii[i] < 0.12) continue; const d = Math.hypot(p.x - q.x, p.z - q.z) + Math.abs(dy) * 0.5; if (d < bd) { bd = d; best = b; bi = i; } }
      if (!best || bd > 30) continue;
      const p0 = best.pts[bi], dir = V3().subVectors(q, p0), len = Math.max(7, dir.length() * 1.2); dir.y *= 0.55; dir.normalize();
      const m = Math.max(4, Math.round(len / 3)), r0 = Math.max(0.18, Math.min(0.34, best.radii[bi] * 0.55)), radii = taper(r0, m, 0.2, 0.9), pts = grow(p0, dir, len, m, up ? 0.35 : -0.5, wobP(m));
      for (let i = 1; i <= m; i++) if (pts[i].y < 12) pts[i].y = 12 + (12 - pts[i].y) * 0.25;
      if (minClear(pts, radii) < 6.5) continue;
      let sa = 0; for (let i = 1; i <= bi; i++) sa += best.pts[i].distanceTo(best.pts[i - 1]);
      branches.push({ emerge: best.radii[bi] * 1.1, pts, radii, level: 2, arc0: best.arc0 + sa, cell: 0.5, sides: 5, attach: [], droop: true, hanger: true, skirt: true });
      best.attach.push({ p: p0.clone().addScaledVector(dir, best.radii[bi]), r: r0 });
      if (k % 8 === 7) await yieldNow(); } }
  await yieldNow();

  // ---- sweep the wood: white crackle glaze, stain baked as ao (lee side, under every limb, at every fork, at the foot) ----
  const glaze = makeSweeper(), lee = rng.range(0, Math.PI * 2), leeV = V3(Math.cos(lee), 0, Math.sin(lee));
  const nb = rng.int(5, 7), bph = rng.range(0, 6.28), bph2 = rng.range(0, 6.28);
  const collars = (att, p) => { let a = 0;
    for (let k = 0; k < att.length; k++) { const c = att[k], dx = p.x - c.p.x, dy = p.y - c.p.y, dz = p.z - c.p.z, d2 = dx * dx + dy * dy + dz * dz, w = 2.3 * c.r + 0.5;
      if (d2 < w * w * 6) a += Math.exp(-d2 / (w * w)) * (dy < 0 ? 0.95 : 0.4);
      if (dy < 0 && dy > -9 * c.r - 3) { const h2 = dx * dx + dz * dz, ww = 1.25 * c.r + 0.3; a += 0.55 * Math.exp(-h2 / (ww * ww)) * Math.exp(dy / (5 * c.r + 1.5)); } }
    return a; };
  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi];
    if (b.level === 0) glaze.sweep(b.pts, b.radii, { sides: b.sides, cell: b.cell, arc0: 0,
      shape: (th, s, rad) => { const y = s - 1.5, fl = Math.exp(-Math.max(y, 0) / 4.2); const c = 0.5 + 0.5 * Math.cos(nb * th + bph);
        let bulge = 0;      // a swollen collar where each great limb leaves the trunk
        for (let k = 0; k < b.attach.length; k++) { const c = b.attach[k], dy = (y - c.p.y + 0.6 * c.r) / (1.9 * c.r), dd = rad.x * c.dx + rad.z * c.dz; if (dy * dy < 9 && dd > 0) bulge += 0.3 * c.r * Math.exp(-dy * dy) * dd * dd * dd * dd; }
        return 1 + fl * (0.14 + 0.62 * c * c * c + 0.1 * Math.cos(2 * th + bph2)) + 0.022 * Math.sin(3 * th + y * 0.21 + bph2) + 0.018 * Math.sin(5 * th - y * 0.6 + bph) + bulge / Math.max(0.3, trunkR(y)); },
      ao: (p, rad) => 0.42 * Math.max(0, rad.x * leeV.x + rad.z * leeV.z) + 0.6 * Math.exp(-Math.max(p.y, 0) / 2.2) + collars(b.attach, p) });
    else { const r0 = b.radii[0];
      const sE = b.emerge || 0, flare = b.level === 1 ? 0.6 : 0.32;      // a branch collar: the limb swells where it leaves its parent
      glaze.sweep(b.pts, b.radii, { sides: b.sides, cell: b.cell, arc0: b.arc0,
        shape: (th, s) => 1 + flare * Math.exp(-Math.max(0, s - sE) / (1.3 * r0)),
        ao: (p, rad, s) => 0.3 * Math.max(0, -rad.y) + 0.8 * Math.exp(-Math.max(0, s - sE) / (2.0 * r0 + 0.4)) + 0.12 * Math.max(0, rad.x * leeV.x + rad.z * leeV.z) + collars(b.attach, p) }); }
    if (bi % 12 === 11 || bi < 2) await yieldNow();
  }
  // roots: each buttress runs out over the floor as a white crackle root and goes under
  for (let k = 0; k < nb; k++) {
    const th = (Math.PI * 2 * k - bph) / nb + rng.range(-0.08, 0.08), dx = Math.cos(th), dz = -Math.sin(th);
    const len = rng.range(8, 13), n = 8, pts = [], radii = [], bend = rng.range(-0.5, 0.5), a0 = axis(0);
    for (let i = 0; i <= n; i++) { const t = i / n, d = 2.6 + len * t, sw = bend * t * t * len * 0.5 + Math.sin(t * 4 + k * 1.7) * 1.7 * t;
      pts.push(V3(a0.x + dx * d - dz * sw, 2.3 * (1 - t) * (1 - t) * (1 - t) - 1.7 * t * t - 0.2, a0.z + dz * d + dx * sw)); radii.push(lerp(2.0, 0.75, Math.pow(t, 0.8))); }
    glaze.sweep(pts, radii, { sides: 9, cell: 0.9, arc0: 0, shape: (th, s, rad) => 0.8 + 0.5 * rad.y * rad.y, ao: (p) => 0.6 * Math.exp(-Math.max(p.y, 0) / 0.9) });
  }
  const ringY = { value: 50 }, fronts = { value: new THREE.Vector3(1e4, 1e4, 55) };
  // the Stem keeps its marks through more smoke than the grove does (it is the one thing meant to be seen from the entry on)
  const heroFog = { value: opts.heroFogHalf ?? Math.max(U.uFogHalf.value, 300) };
  const wood = new THREE.Mesh(glaze.build(), style.glazeMaterial(null, { ringY, front: fronts, fogHalf: heroFog })); wood.name = 'old-stem-glaze'; wood.frustumCulled = false; group.add(wood);
  await yieldNow();

  // ---- twigs of bare smoked clay, and the leaf discs that hang from them in eleven loose tiers ----
  const clay = makeSweeper(), tiers = 13, tier0 = 11, tierStep = (H + 3 - tier0) / (tiers - 1);
  const tierPull = (y, k) => { const q = Math.min(tiers - 1, Math.max(0, Math.round((y - tier0) / tierStep))); return lerp(y, tier0 + q * tierStep, k); };
  const nLeaf = Math.round((opts.leaves ?? 56000) * (0.55 + 0.45 * (detail - 0.6) / 0.4));
  const twigs = [];
  const DOOR = V3(0.447, 0, -0.894), inDoor = (x, y, z) => { const r = Math.hypot(x, z); return y < 25 + 4 * Math.sin(x * 0.2 + z * 0.13) && r > 5 && (x * DOOR.x + z * DOOR.z) > r * 0.86; };
  const addTwig = (par, f, R = rng) => {
    const n = par.pts.length - 1, x = f * n, i0 = Math.min(n - 1, Math.floor(x)), p0 = V3().lerpVectors(par.pts[i0], par.pts[i0 + 1], x - i0);
    const tan = V3().subVectors(par.pts[i0 + 1], par.pts[i0]).normalize();
    const dir = V3(R.range(-1, 1), R.range(-0.35, 0.5), R.range(-1, 1)).addScaledVector(tan, 0.9).normalize();
    const len = R.range(2.6, 5.2), r0 = Math.min(0.075, Math.max(0.04, par.radii[i0] * 0.5)), pts = [p0];
    const p = p0.clone(), d = dir.clone();
    for (let k = 1; k <= 3; k++) { d.x += R.range(-0.25, 0.25); d.z += R.range(-0.25, 0.25); d.y -= 0.06; d.normalize(); p.addScaledVector(d, len / 3); const q = p.clone(); q.y = tierPull(q.y, 0.5 * (k / 3)); pts.push(q); }
    let ok = true; for (let k = 1; k <= 3; k++) if (flyDist(pts[k].x, pts[k].y, pts[k].z) < 5) ok = false;
    if (!ok || inDoor(pts[3].x, pts[3].y + 1.5, pts[3].z)) return;
    const radii = [r0, r0 * 0.75, r0 * 0.5, r0 * 0.3];
    const mark = clay.vertexCount; clay.sweep(pts, radii, { sides: 3, sway: (t) => t * t });
    twigs.push({ pts, mark, skirt: !!par.skirt, w: par.skirt ? 1.9 : par.hanger ? 2.4 : par.droop ? 1.5 : pts[3].y > 60 ? 0.5 : 1 });      // the skirt below the eye is thick with leaves; the top tiers, never seen close, are thinner
  };
  for (let bi = 1; bi < branches.length; bi++) {
    const b = branches[bi], nt = b.long ? 7 : b.hanger ? 7 : b.droop ? 5 : b.level === 3 ? 3 : b.level === 2 ? 4 : 8;
    if (b.skirt) { for (let k = 0; k < 8; k++) addTwig(b, lerp(0.25, 1, (k + pr()) / 8), pr); continue; }
    for (let k = 0; k < nt; k++) addTwig(b, b.level === 1 ? lerp(0.4, 1, (k + rng()) / nt) : lerp(b.droop ? 0.2 : 0.3, 1, (k + rng()) / nt));
    if (bi % 20 === 19) await yieldNow();
  }
  for (let k = 0; k < 5; k++) addTwig(trunk, lerp(0.93, 1, (k + rng()) / 5));
  await yieldNow();
  const clayGeo = clay.build();
  { const ck = clayGeo.getAttribute('aCk'), nn = ck.count;      // clay twigs carry their radius in aCk.x (see CLAY_VERT)
    for (let ti = 0; ti < twigs.length; ti++) { const end = ti + 1 < twigs.length ? twigs[ti + 1].mark : nn;
      for (let v = twigs[ti].mark; v < end; v++) { const ring = Math.floor((v - twigs[ti].mark) / 4); ck.setX(v, 0.06 * [1, 0.75, 0.5, 0.3][ring]); } } }
  const twigMesh = new THREE.Mesh(clayGeo, style.clayMaterial(null, { fogHalf: heroFog })); twigMesh.name = 'old-stem-twigs'; twigMesh.frustumCulled = false; group.add(twigMesh);
  await yieldNow();

  // ---- where the smoke touches. No line climbs this crown: puffs from the leaf piles rise through it, and copper blooms in a
  //      patch round each one where it touches, each patch growing until the dappled crown is wholly copper. A patch is
  //      (centre, the value of the bloom clock at which its puff arrives); a leaf goes over when the nearest patch has grown out
  //      to it (one clock unit a metre). The clock is ringY: the world sets it from u. Low patches bloomed before we came. ----
  const NPATCH = 92, patch = new Float32Array(NPATCH * 4);
  for (let i = 0; i < NPATCH; i++) { const y = lerp(13, H - 3, Math.pow((i + pr()) / NPATCH, 0.85)), e = (y - 44) / 40, rc = 46 * Math.sqrt(Math.max(0.03, 1 - e * e));
    const a = pr.range(0, Math.PI * 2), r = 7 + (rc - 9) * Math.sqrt(pr()), ax = axis(y);
    patch[i * 4] = ax.x + Math.cos(a) * r; patch[i * 4 + 1] = y; patch[i * 4 + 2] = ax.z + Math.sin(a) * r;
    patch[i * 4 + 3] = y < 27 ? lerp(3, 19, (y - 13) / 14) + pr.range(-5, 4) : Math.min(72, y + 3.5 + pr.range(-8, 7)); }
  const bloomAt = (x, y, z) => { let b = 1e9; for (let i = 0; i < NPATCH; i++) { const dx = patch[i * 4] - x, dy = (patch[i * 4 + 1] - y) * 1.25, dz = patch[i * 4 + 2] - z, v = patch[i * 4 + 3] + Math.sqrt(dx * dx + dy * dy + dz * dz); if (v < b) b = v; } return b; };

  // ---- leaves: 60,000 discs, each hung to quake; aTurn is the clock value at which a patch of smoke reaches it ----
  const litter = Math.round(1400 * detail), perTwig = Math.max(1, (nLeaf - litter) / Math.max(1, twigs.reduce((a, t) => a + (t.skirt ? 0 : t.w), 0)));
  const nCap = nLeaf + Math.ceil(twigs.reduce((a, t) => a + (t.skirt ? 1 : 0), 0) * perTwig * 2.4) + 64;
  const lPos = new Float32Array(nCap * 3), lLeaf = new Float32Array(nCap * 4), lTurn = new Float32Array(nCap);
  let nl = 0; const tp = V3();
  for (let ti = 0; ti < twigs.length; ti++) {
    const tw = twigs[ti].pts, R = twigs[ti].skirt ? pr : rng;
    for (let k = 0, nk = Math.round(perTwig * twigs[ti].w); k < nk && nl < nCap; k++) {
      const f = R.range(0.1, 1.12) * 3, i0 = Math.min(2, Math.floor(f)); tp.lerpVectors(tw[i0], tw[i0 + 1], f - i0);
      const a = R.range(0, Math.PI * 2), rr = 2.7 * Math.sqrt(R()), rad = R.range(0.38, 0.56), drop = R(), ph = R(), az = R.range(0, Math.PI * 2), tl = R.gauss() * 0.45, tj = R.range(-2, 2), stay = R();
      const x = tp.x + Math.cos(a) * rr, z = tp.z + Math.sin(a) * rr, y = tierPull(tp.y + 0.5 - drop * Math.sqrt(drop) * 2.4, 0.42) - rad;
      const fd = flyDist(x, y, z);
      if (fd < 6.4 || inDoor(x, y, z) || (y > 62 && k % 3 === 2)) continue;
      lPos[nl * 3] = x; lPos[nl * 3 + 1] = y; lPos[nl * 3 + 2] = z;
      // discs beside the camera line are the small ones (none over about 45 px on screen); the full size from 11 m out
      lLeaf[nl * 4] = az; lLeaf[nl * 4 + 1] = tl; lLeaf[nl * 4 + 2] = ph; lLeaf[nl * 4 + 3] = rad * Math.min(1, Math.max(0.5, (fd - 2.5) / 8.5));
      lTurn[nl] = stay < 0.008 ? 1e9 : bloomAt(x, y, z) + tj * 0.7; nl++;
    }
    if (ti % 4 === 3) await yieldNow();
  }
  // a litter of unturned green discs lying flat on the black floor, stirring
  for (let k = 0; k < litter && nl < nCap; k++) {
    const a = rng.range(0, Math.PI * 2), rr = 7 + 60 * Math.pow(rng(), 0.7);
    lPos[nl * 3] = Math.cos(a) * rr; lPos[nl * 3 + 1] = 0.06 + rng() * 0.05; lPos[nl * 3 + 2] = Math.sin(a) * rr;
    lLeaf[nl * 4] = rng.range(0, 6.28); lLeaf[nl * 4 + 1] = 1.45 + rng.range(-0.06, 0.06); lLeaf[nl * 4 + 2] = rng(); lLeaf[nl * 4 + 3] = rng.range(0.3, 0.42);
    lTurn[nl] = 1e9; nl++;
  }
  const leafMesh = new THREE.Mesh(leafGeometry(lPos.subarray(0, nl * 3), lLeaf.subarray(0, nl * 4), lTurn.subarray(0, nl)), style.leafMaterial(ringY, 0.5, null, { fogHalf: opts.leafFogHalf || heroFog, minPx: opts.leafMinPx ?? 2.1 }));
  leafMesh.name = 'old-stem-leaves'; leafMesh.frustumCulled = false; group.add(leafMesh);
  await yieldNow();

  // ---- magpies: four hundred roosting on the limbs; each bursts out as the patch of smoke reaches its roost ----
  const nBird = Math.round((opts.birds ?? 400) * (detail < 0.8 ? 0.6 : 1)), bRoost = new Float32Array(nBird * 3), bBird = new Float32Array(nBird * 4);
  const perches = branches.filter((b) => b.level === 1 || b.level === 2), ropeR = [], ropePh = [];
  for (let q = 0; q < tiers; q++) { ropeR.push(rng.range(15, 33)); ropePh.push(rng()); }
  for (let i = 0; i < nBird; i++) {
    const b = perches[Math.floor(rng() * perches.length)], n = b.pts.length - 1, x = rng.range(0.15, 0.92) * n, i0 = Math.min(n - 1, Math.floor(x));
    tp.lerpVectors(b.pts[i0], b.pts[i0 + 1], x - i0);
    const r = lerp(b.radii[i0], b.radii[i0 + 1], x - i0), q = Math.min(tiers - 1, Math.max(0, Math.round((tp.y - tier0) / tierStep)));
    bRoost[i * 3] = tp.x; bRoost[i * 3 + 1] = tp.y + r + 0.1; bRoost[i * 3 + 2] = tp.z;
    bBird[i * 4] = Math.max(26.6 + 2.4 * pr(), bloomAt(tp.x, tp.y, tp.z) + rng.range(-0.9, 0.9)); bBird[i * 4 + 1] = rng(); bBird[i * 4 + 2] = ropeR[q] + rng.range(-1.2, 1.2); bBird[i * 4 + 3] = ropePh[q];
    if (i % 100 === 99) await yieldNow();
  }
  await yieldNow();
  const birdMesh = new THREE.Mesh(birdGeometry(bRoost, bBird), style.birdMaterial(ringY, opts.birdScale ?? 1.3)); birdMesh.name = 'old-stem-magpies'; birdMesh.frustumCulled = false; group.add(birdMesh);

  // ---- smoke: a puff climbing through each patch as it blooms (it arrives, the copper spreads round it, it thins away),
  //      and smoke pooling ankle-deep between the roots ----
  const nRing = Math.round(420 * detail), sPos = new Float32Array(nRing * 3), sPuff = new Float32Array(nRing * 4), sGate = new Float32Array(nRing);
  for (let i = 0; i < nRing; i++) {
    const wide = i % 4 === 3, a = rng.range(0, Math.PI * 2), rr = wide ? rng.range(30, 47) : 25 + rng.gauss() * 3.2;      // (draws kept as they were, so the grove round the Stem stays where each seed had it)
    sPos[i * 3] = Math.cos(a) * rr; sPos[i * 3 + 1] = rng.gauss() * (wide ? 0.9 : 1.5); sPos[i * 3 + 2] = Math.sin(a) * rr;
    sPuff[i * 4] = wide ? rng.range(7, 11) : rng.range(4.5, 8); sPuff[i * 4 + 1] = rng(); sPuff[i * 4 + 2] = 0; sPuff[i * 4 + 3] = rng.range(0.3, 0.9);
    const k = i % NPATCH;
    sPos[i * 3] = patch[k * 4] + pr.range(-1.2, 1.2); sPos[i * 3 + 1] = patch[k * 4 + 1] - 9; sPos[i * 3 + 2] = patch[k * 4 + 2] + pr.range(-1.2, 1.2);
    sPuff[i * 4] = pr.range(1.5, 2.6); sPuff[i * 4 + 1] = pr(); sPuff[i * 4 + 2] = pr.range(0.045, 0.075); sPuff[i * 4 + 3] = 0.2; sGate[i] = patch[k * 4 + 3];
  }
  const gate = { value: new THREE.Vector2(ringY.value, 1) };
  const ringMesh = new THREE.Mesh(smokeGeometry(sPos, sPuff, sGate), style.smokeMaterial({ rope: 15, bend: V3(2.2, 0, 1.4), alpha: 0.2, pale: 0.12, far: [70, 170, 0.75], gate }));
  ringMesh.name = 'old-stem-smoke-ring'; ringMesh.frustumCulled = false; ringMesh.renderOrder = 5; group.add(ringMesh);
  const nPool = Math.round(70 * detail), pPos = new Float32Array(nPool * 3), pPuff = new Float32Array(nPool * 4);
  for (let i = 0; i < nPool; i++) {
    const a = rng.range(0, Math.PI * 2), rr = rng.range(6, 38);
    pPos[i * 3] = Math.cos(a) * rr; pPos[i * 3 + 1] = rng.range(0.3, 0.9); pPos[i * 3 + 2] = Math.sin(a) * rr;
    pPuff[i * 4] = rng.range(3.5, 7); pPuff[i * 4 + 1] = rng(); pPuff[i * 4 + 2] = 0; pPuff[i * 4 + 3] = 0.15;
  }
  if (opts.floor !== false) { const poolMesh = new THREE.Mesh(smokeGeometry(pPos, pPuff), style.smokeMaterial({ spin: 0.012, alpha: 0.2, flat: true }));
    poolMesh.name = 'old-stem-smoke-pool'; poolMesh.frustumCulled = false; poolMesh.renderOrder = 4; group.add(poolMesh); }      // (the world's floor draws its own pools, with an edge)
  if (opts.floor !== false) {      // a black clay apron so the piece stands on its own floor (the world lays its own: pass floor:false)
    const apron = new THREE.Mesh(new THREE.CircleGeometry(opts.floorRadius ?? 90, 48).rotateX(-Math.PI / 2), style.clayMaterial()); apron.name = 'old-stem-floor'; group.add(apron);
  }
  let sky = null;
  if (opts.sky !== false) { sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 12), style.skyMaterial()); sky.renderOrder = -0.5; sky.frustumCulled = false; group.add(sky); }
  await yieldNow();

  // ---- anchors (local space) ----
  const seat = fly.pts[fly.pts.length - 1].clone();
  const anchors = {
    flyThrough: fly.pts.map((p) => p.clone()),          // 8 approach points, 65 helix points, 8 exit points: >= 6.4 m from all wood
    helixStart: 8, helixEnd: 72,
    portalSeat: { position: seat, facing: fly.exitDir.clone().negate(), direction: fly.exitDir.clone(), radius: 7, pitchDeg: 5 },
    hoopCentre: seat.clone(),
    closePass: { position: flyHelix(0.55), lookAt: axis(flyHelix(0.55).y) },
    oneImage: { position: flyHelix(0.72), lookAt: axis(flyHelix(0.72).y + 2) },
    entryView: { position: fly.pts[0].clone(), lookAt: axis(34) },
    trunkAt: (y) => axis(y), trunkRadiusAt: (y) => trunkR(y),
    sunDir: U.uSunDir.value.clone(), crownRadius: 46, crownBase: 21, top: axis(H),
  };
  let autoFront = true; const size = new THREE.Vector2();
  const api = {
    object: group, radius: 22, height: 44, center: V3(0, 42, 0), anchors, ground: false, groundY: 0,
    style, uniforms: U, ringY, fronts, fog: heroFog, skeleton: branches, stats: { limbs: limbs.length, dropped, branches: branches.length, twigs: twigs.length, leaves: nl, birds: nBird },
    // the smoke ring's height in metres above the base: the world sets it to the camera's local height + 3 as it circles
    setRingY(y) { ringY.value = y; }, patches: patch, bloomAt,
    // or as 0..1 from below the crown (16 m) to above the top
    setProgress(p) { ringY.value = lerp(16, H + 8, sat(p)); },
    // crack fronts in metres of wood from the root for generations 1..3; by default generation 3 races just above the ring
    setFronts(a, b, c) { autoFront = false; fronts.value.set(a, b, c); },
    setGust(g) { U.uGust.value.x = g; },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uViewH.value = size.y; }
      if (autoFront) fronts.value.set(1e4, 1e4, ringY.value + 3.5);
      gate.value.x = ringY.value;
    },
    dispose() {},
  };
  return api;
}

// ---------------------------------------------------------------------------------------------
// buildDaughterHoop(ctx, style, o): the exit's frame, in the same glaze. The Stem's eldest daughter, a slender aspen bowed right
// over until its top fused into its own trunk: a hoop with a 7.5 m opening, black twigs and green discs along its upper arc.
// o.centre (Vector3, the portal centre), o.dir (unit Vector3 the camera flies along; the hoop lies square to it),
// o.groundY (0), o.opening (7.5), o.turnNow ({value} for its leaves, see leafMaterial), o.turn (aTurn of its leaves, 1e9 = stay green).
// Returns { object, foot, centre }. About 1.6k triangles, 3 draw calls. Add it to the same parent as the hero.
// ---------------------------------------------------------------------------------------------
export async function buildDaughterHoop(ctx, style, o = {}) {
  const rng = ctx.rng, g = new THREE.Group(); g.name = 'daughter-hoop';
  const c = (o.centre || new THREE.Vector3(0, 60, 0)).clone(), dir = (o.dir || new THREE.Vector3(0, 0, 1)).clone().normalize();
  const e1 = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir); if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0); e1.normalize();
  const e2 = new THREE.Vector3().crossVectors(dir, e1).normalize();
  const r0 = o.thick ?? 1.0, Rh = (o.opening ?? 7.5) + r0 * 0.8, gy = o.groundY ?? 0;
  const at = (phi, out = new THREE.Vector3()) => out.copy(c).addScaledVector(e1, Math.cos(phi) * Rh).addScaledVector(e2, Math.sin(phi) * Rh);
  const pts = [], radii = [], start = at(0), drop = Math.max(4, start.y - gy + 1.2), nT = 12, nC = 30;
  const lean = rng.range(1.5, 4), la = rng.range(0, 6.28);
  for (let i = 0; i < nT; i++) { const t = i / nT, d = drop * (1 - t), w = Math.sin(t * Math.PI) * lean;       // the stem, foot to the spring of the bow
    pts.push(start.clone().addScaledVector(e2, -d).add(new THREE.Vector3(Math.cos(la) * w + (1 - t) * (1 - t) * 3 * e1.x, 0, Math.sin(la) * w + (1 - t) * (1 - t) * 3 * e1.z)));
    radii.push(r0 * (1.3 - 0.3 * t) * (1 + 0.6 * Math.exp(-(t * drop) / 2.5))); }
  const fuse = Math.PI * 2 - 0.09;
  for (let i = 0; i <= nC; i++) { const t = i / nC; pts.push(at(t * fuse)); radii.push(r0 * (1.0 - 0.28 * t) * (1 + 0.1 * Math.sin(t * 23 + la))); }
  const sw = makeSweeper(), hoopFog = { value: o.fogHalf ?? Math.max(style.uniforms.uFogHalf.value, 260) }, fuseP = at(0);
  // big cells (the daughter is young: her glaze is still taking its first cracks), stain only at the foot and where the top fused in
  sw.sweep(pts, radii, { sides: 12, cell: o.cell ?? 1.25, arc0: 0, ao: (p, rad, s, i) => 0.08 * Math.max(0, -rad.y) + 0.5 * Math.exp(-Math.max(p.y - gy, 0) / 1.5)
    + 0.75 * Math.exp(-p.distanceToSquared(fuseP) / (5 * r0 * r0)) * (0.55 + 0.45 * Math.max(0, -rad.y)) });
  // the fused tip: the last of the leader lying down the stem below the fuse, like a healed graft
  { const tp = [], tr = []; for (let k = 0; k <= 5; k++) { const t = k / 5; tp.push(at(fuse + 0.02).addScaledVector(e2, -t * 3.2 * r0).addScaledVector(dir, -r0 * (0.75 - 0.5 * t))); tr.push(r0 * 0.5 * (1 - 0.8 * t)); }
    sw.sweep(tp, tr, { sides: 7, cell: 0.8, arc0: 0, ao: () => 0.5 }); }
  const boughs = [], UPV = new THREE.Vector3(0, 1, 0);
  const axisDist = (p) => { const v = p.clone().sub(c); return v.addScaledVector(dir, -v.dot(dir)).length(); };
  if (o.crown !== false) { const nB = o.boughs ?? 12;
    for (let k = 0; k < nB; k++) { let p0, d0, r;
      if (k % 2) { const phi = (0.98 + 0.86 * (k / nB) + rng.range(-0.05, 0.05)) * Math.PI; p0 = at(phi); d0 = p0.clone().sub(c).normalize().addScaledVector(dir, rng.range(-0.8, 0.8)); d0.y += 0.2; r = r0 * 0.4; }
      else { const t = 0.42 + 0.52 * (k / nB) + rng.range(-0.03, 0.03), i0 = Math.min(nT - 1, Math.floor(t * nT)), a = rng.range(0, 6.283); p0 = pts[i0].clone();
        d0 = e1.clone().multiplyScalar(Math.cos(a) * 0.7 + 0.6).addScaledVector(dir, Math.sin(a)); d0.y = rng.range(0.1, 0.45); r = radii[i0] * 0.4; }
      d0.normalize();
      const len = rng.range(10, 17), n = 7, bp = [p0.clone()], br = [], d = d0.clone(), p = p0.clone(), curl = rng.range(-0.13, 0.13);
      for (let i = 1; i <= n; i++) { d.applyAxisAngle(UPV, curl); d.y += 0.07; d.x += rng.range(-0.12, 0.12); d.z += rng.range(-0.12, 0.12); d.normalize(); p.addScaledVector(d, len / n);
        const ad = axisDist(p); if (ad < Rh + 3.6) { const v = p.clone().sub(c); v.addScaledVector(dir, -v.dot(dir)); if (v.lengthSq() < 1e-6) v.copy(e1); v.normalize(); p.addScaledVector(v, Rh + 3.6 - ad); }
        bp.push(p.clone()); }
      for (let i = 0; i <= n; i++) br.push(Math.max(0.07, r * (1 - 0.82 * i / n)));
      sw.sweep(bp, br, { sides: 6, cell: 0.6, arc0: 0, shape: (th, sd) => 1 + 0.5 * Math.exp(-sd / (1.4 * r)), ao: (pp, rad, sd) => 0.3 * Math.max(0, -rad.y) + 0.7 * Math.exp(-sd / 1.0) });
      boughs.push(bp); } }
  const ring = new THREE.Mesh(sw.build(), style.glazeMaterial(null, { fogHalf: hoopFog })); ring.frustumCulled = false; g.add(ring);
  await ctx.yield?.();
  // twigs and leaves on the outside of the upper arc only: nothing hangs into the opening
  const clay = makeSweeper(), LP = [], LL = [], LT = [], out = new THREE.Vector3(), base = new THREE.Vector3();
  const nTw = o.twigs ?? 44;
  for (let k = 0; k < nTw; k++) {
    const phi = 0.12 * Math.PI + (k + rng()) / nTw * 0.86 * Math.PI; at(phi, base); out.subVectors(base, c).normalize();
    const d = out.clone().addScaledVector(dir, rng.range(-0.5, 0.5)).addScaledVector(e1, rng.range(-0.3, 0.3)); d.y += 0.25; d.normalize();
    const len = rng.range(2.6, 5.4), tp = [base.clone().addScaledVector(out, r0 * 0.6)];
    for (let j = 1; j <= 3; j++) tp.push(base.clone().addScaledVector(d, (len * j) / 3).add(new THREE.Vector3(rng.range(-0.3, 0.3), -0.08 * j * j, rng.range(-0.3, 0.3))));
    clay.sweep(tp, [0.075, 0.055, 0.036, 0.02], { sides: 3, sway: (t) => t * t });
    for (let j = 0; j < 15; j++) { const f = rng.range(0.25, 1.1) * 3, i0 = Math.min(2, Math.floor(f)), q = tp[i0].clone().lerp(tp[i0 + 1], f - i0);
      q.addScaledVector(out, rng.range(0.2, 1.6)).add(new THREE.Vector3(rng.range(-1.3, 1.3), rng.range(-0.3, 0.8), rng.range(-1.3, 1.3)));
      if (q.distanceTo(c) < Rh + r0 + 0.7) continue;
      LP.push(q.x, q.y, q.z); LL.push(rng.range(0, 6.28), rng.gauss() * 0.4, rng(), rng.range(0.4, 0.56)); LT.push(o.turn ?? 1e9); }
  }
  const perches = [];
  for (let k = 0; k < 9; k++) { const phi = (0.2 + 0.6 * (k + 0.5) / 9) * Math.PI; at(phi, base); out.subVectors(base, c).normalize(); perches.push(base.clone().addScaledVector(out, r0 * 0.78)); }
  for (const bp of boughs) { const n = bp.length - 1;
    perches.push(bp[3].clone().add(new THREE.Vector3(0, 0.3, 0)));
    for (let k = 0; k < 6; k++) { const x = (0.3 + 0.7 * (k + rng()) / 6) * n, i0 = Math.min(n - 1, Math.floor(x)), b0 = bp[i0].clone().lerp(bp[i0 + 1], x - i0);
      const d = new THREE.Vector3(rng.range(-1, 1), rng.range(-0.2, 0.6), rng.range(-1, 1)).add(bp[i0 + 1].clone().sub(bp[i0]).normalize()).normalize(), len = rng.range(2.4, 4.4), tp = [b0];
      for (let j = 1; j <= 3; j++) tp.push(b0.clone().addScaledVector(d, (len * j) / 3).add(new THREE.Vector3(rng.range(-0.3, 0.3), -0.08 * j * j, rng.range(-0.3, 0.3))));
      clay.sweep(tp, [0.075, 0.055, 0.036, 0.02], { sides: 3, sway: (t) => t * t });
      for (let j = 0; j < 17; j++) { const fq = rng.range(0.2, 1.1) * 3, i1 = Math.min(2, Math.floor(fq)), q = tp[i1].clone().lerp(tp[i1 + 1], fq - i1);
        q.add(new THREE.Vector3(rng.range(-1.9, 1.9), rng.range(-1.6, 0.5), rng.range(-1.9, 1.9))); const stay = rng();
        if (axisDist(q) < Rh + r0 + 1.2) continue;
        LP.push(q.x, q.y, q.z); LL.push(rng.range(0, 6.28), rng.gauss() * 0.4, rng(), rng.range(0.42, 0.6)); LT.push(stay < 0.1 ? 1e9 : (o.crownTurn ?? -1)); } } }
  const cg = clay.build(), ck = cg.getAttribute('aCk'); for (let v = 0; v < ck.count; v++) ck.setX(v, 0.075 * [1, 0.75, 0.5, 0.3][Math.floor((v % 16) / 4)]);
  const tw = new THREE.Mesh(cg, style.clayMaterial(null, { fogHalf: hoopFog })); tw.frustumCulled = false; g.add(tw);
  const lm = new THREE.Mesh(leafGeometry(new Float32Array(LP), new Float32Array(LL), new Float32Array(LT)), style.leafMaterial(o.turnNow || { value: 0 }, o.turnSoft ?? 0.004, null, { fogHalf: hoopFog, minPx: 1.8 })); lm.frustumCulled = false; g.add(lm);
  return { object: g, foot: pts[0].clone(), centre: c, perches };
}
