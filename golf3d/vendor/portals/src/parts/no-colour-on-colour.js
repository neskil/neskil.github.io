// NO COLOUR UPON COLOUR: hero set piece (THE LION) and the style kit of the world.
//
// WHAT IT IS
//   A gold lion 160 m from muzzle to rump, a jointed charge of nineteen rigid gold slabs 1.5 m thick in
//   three layers 2 m apart, armed and langued gules, eye sable, keylined sable.
//   TWO LAWS CAN DRIVE IT. A world may give it A TIMETABLE (opts.way; see wayLaw below): the world of this name
//   does, and there the lion stands at the places of its road, wheels and runs between them by our own place on
//   the route. Where no timetable is given (the site's set-piece viewer, which builds this part alone) THE LAW OF
//   THE TEETH drives it, as this head and PLACE AND PROGRESS describe it: it goes along the crest of a
//   dancetty ridge from tip to tip by ATTITUDES: it walks (passant, statant with the tail thrown up, passant on
//   the other forepaw: four paces to a tooth), HALTS on a tip (statant, its head turned down to us, the tail out
//   behind), ROARS on the next (the head thrown up, the jaws wide, the tail out stiff behind), walks on down the crest,
//   and takes the last teeth AT A RUN (courant, every paw on the green: gathered on a tip with all four paws together
//   and the rump high; then LONG between two tips, forepaws on the tip ahead and hind paws on the tip behind), and the
//   last tooth in ONE BOUND (driving off, hind paws on the tip; at FULL STRETCH 234 m long along the line of the tips;
//   REACHING DOWN, forepaws on the summit) to the summit, where it lands crouched, springs
//   (salient) and rears RAMPANT with its hind paws on the summit tooth, about 170 m from paw to ear, the tail
//   lashing in held beats. Each planted paw is set on the crest under it and turned to its slope.
//   One lion, uncrowned, no blazon of any house. Nothing lettered.
//
// PLACE AND PROGRESS (the world sets one number)
//   hero.setProgress(u): u is the world's progress 0..1. The lion's place and pose are pure functions of u
//   through THE LAW OF THE LION'S PLACE below (nccLionLaw): its stations are the tips of the crest; its arc
//   position is the crest's arc abeam of the route's place at u (opts.abeam) plus one smooth lead (three typed
//   table of lengths by its own arc, opts.leads); it stands at the tip its arc position has last reached and goes to the
//   next as the arc position covers the span. There is no list of route metres or of u anywhere.
//   (A WORLD MAY GIVE THE ARC ITSELF, opts.arc: its own smooth, never-falling arc position by progress, in place of
//   abeam plus lead; opts.run names a stretch of the crest whose tips it takes at a run, opts.sitHold the share of
//   the roaring tip's span it holds the roar. The figure, its stations and its attitudes are the same.)
//   The same on every seed. NOTHING OF THE LENS ENTERS: the camera is neither read nor passed here. The drawn flank
//   (see THE FIGURE'S FRAME) is the one on which THE FLOWN LINE'S OWN POINT at this progress lies, opts.line (the
//   path as built: a law of the place and the route); with no line given (the viewer), the flank it is built for.
//   The clock enters only to mark time at the first station
//   (seen through the previous portal it lifts a forepaw and curls its tail, one change every 1.1 s) and to lash
//   the tail when rampant. Until setProgress is first called (the viewer) it runs the last teeth and rears by the
//   clock. A frame at dt 0 changes nothing; update() writes uniforms and one matrix, and makes no arrays.
//
// OPTS
//   style      the world's shared makeStyle() instance (else the hero makes its own and drives it)
//   palette    seven hex strings in the brief's order (gules, azure, vert, sable, purpure, or, argent)
//   crestY     (d) => height of the crest at arc distance d (default nccCrest(): teeth 110 m apart,
//              18 m deep, tips rising 60 to 90 m, the summit tip at d = opts.summit, default 738)
//   pitch      a tooth (110): the tips, and so the stations, stand at opts.summit - k * pitch
//   abeam      (u) => the crest's arc distance abeam of the route's place at progress u (the world's geometry)
//   arc        (u) => the lion's arc position itself at progress u (smooth, never falling); given, it replaces abeam and leads
//   run        [d0, d1]: the tips within this stretch of the crest are left at a run (courant), besides the last RUN_TEETH
//   sitHold    the share (0..1) of the span from the roaring tip that the roar is held (default the roar's own hold)
//   halt       the arc of the tip where it halts (see nccLionLaw: from that tip on it runs from tip to tip)
//   strides    how many strides of the run it takes from one station to the next (default 1)
//   bound      false: no bound; the last station before the summit too is left at a run (a paw on the ground throughout)
//   rest       [arc, arc]: it sits (sejant) at its first station short of the first arc position and has risen at the second
//   line       (u, out) => the flown line's own point at progress u (a Vector3): the drawn flank is the one that point
//              is on (see THE FIGURE'S FRAME); not given, the flank is `side`'s
//   floorY     (d) => the ground its planted paws stand on (default the crest's own line); back (d) => how far behind the
//              crest's plan line the figure's plane stands (the fold behind a crest, the walk behind a wall's battlements)
//   leads      [[arc, lead], ...]: the lion's lead over the place abeam, by its own arc (eased between the named arcs);
//              sit: the arc of the tip where it roars
//   crestXZ    (d, out) => out[0] = x, out[1] = z of the crest in the hero's local space (default: a
//              straight run along -X with the summit tip at the origin). Pass both for the world's
//              curved ridge: the lion's plane then follows the tangent, its drawn flank facing
//              up x heading (toward the hub when the ridge circles the hub as the brief has it).
//   side       +1 (default) or -1: which flank is the drawn one: side * (up x heading). With +1 the lion
//              looks toward the left of a viewer facing that flank (dexter, as arms are drawn); with -1
//              toward the right. Choose the one that faces the route (see the hand-off on handedness).
//   ridge      false: the lion alone. The hero's own ridge (three flats, vert edged argent, 428 m) is
//              only built on the default straight run; a world passing crestXZ builds its own ridge.
//   summit, toothDepth, sun ([x, y, z], only when the hero owns the style), detail (accepted; nothing
//   here is plentiful enough to thin).
//
// RETURNS { object, radius 100, height 70 (viewer framing only: the lion stands 60 to 90 m up and
//   reaches about y 265 when rampant), center, anchors, style, setProgress(u), lionCenter(u, out), law, solveAt,
//   update(dt, time, camera), dispose(), ground, groundY }.
//   anchors.crest     corner points of the default crest line, local [x, y, z]
//   anchors.summit    the summit tooth's tip (hind paws stand here at the reveal)
//   anchors.viewFrom  the normal of the drawn flank on the default run: [0, 0, 1]
//   anchors.tips      the stations: arc distances of the tips the lion stands on, the last the summit
//   law, solveAt(u)   the law itself (stations, lead, arcAt, uSummit, uReared) and the figure as placed at u
//   lionCenter(u, out) the middle of the figure at progress u, local: use it for the world's poi.
//   No portal seat or fly-through: the lion is a body the world keeps hundreds of metres off.
//
// THE STYLE KIT: makeStyle(ctx, { palette, sun, leafSeed, counterchange }) (draws once from ctx.rng)
//   tinctures  { gules, azure, vert, sable, purpure, or, argent } linear THREE.Color; tones { orDeep,
//              orCore, argentDeep, argentCore, clay }
//   colour(name)            COLOUR: unlit, writes its hex (instanceColor multiplies it when present)
//   metal('or' | 'argent')  METAL: domed normal (18 degrees at the rim, from aDome), leaf squares 8 m
//              wide each tilted 1 to 2 degrees by a seeded hash, h = normalize(sun + view) with ONE sun
//              (uniforms.uSun, setSun(x, y, z)), mix(deep, leaf, smoothstep(.3, .78, d)) then a broad burnish and the pale core
//              by 0.26 d^16 + 0.85 d^40 (mixed, not added: nothing exceeds 1), seams as fwidth lines 4 percent darker
//              that go when a square is a few pixels, red clay where the rim has worn
//   counter(colour, metal)  COUNTERCHANGED pair: the colour on metal ground, the metal on colour ground,
//              per fragment, by nccGroundAA(world xz); with o.mark the ground is taken at the fragment's place
//              shifted by the instance's own aMark (world x, z): a thing counterchanged by the ground at its mark
//              with o.fruit the pair is laid the other way (the metal on metal ground, the colour on colour ground): the
//              FRUIT of a counterchanged charge, a metal on the charge where it is a colour and a colour where it is a metal
//   keyline({ keyWidth, out3 })   sable, for a slab's keyGeometry; holds 1.5 pixels by widening with distance (out3: the
//              geometry carries aOut3, the way out as a vector of its own space, for a slab turned out of its plane after it was cut)
//   All four work on a Mesh, an InstancedMesh, or a jointed figure ({ joints: { value: Vector4[] } }
//   with attribute aPart: each part turned and shifted in its plane by [cos, sin, tx, ty]).
//   slab(outline, o)        THE SLAB: outline [[x, y], ...] triangulated, extruded to o.thickness about
//              z = o.z, with a rim strip for the worn edge; keyGeometry is the outline set out by
//              o.keyline metres, lying just inside both faces. outline(spec, sub) draws smooth outlines.
//   COUNTERCHANGE  glsl.counter holds nccGround(vec2 xz) (1 metal ground, 0 colour ground): three plan
//              lines through the hub (uniforms uCcH, uCcA, uCcB, uCcC, uCcEntry), parity of the positive
//              sides against the entry's, and THE PALE OF THE WAY (uCcW, nccWay(xz); setCounterchange({ way })):
//              on the hub's hand of the way's own line everything is the counterchange. World x and z only. ground(x, z) is its JavaScript twin for
//              per-instance things; setCounterchange({ hub, through, entry }) sets the uniforms once
//              (defaults are the brief's: hub (300, 110), through (7,172), (70,303), (178,384), entry (0,0)).
//   update(dt, time, camera) drives the shared uniforms (uTime, uPx); call it once a frame.
//
// COST: lion 12.2k triangles in 3 draw calls; with the default ridge 13.5k triangles, 5 draw calls;
//   build about 40 ms; no lights, no textures, no render targets. Expects post { flat: 1, bloom 0 }:
//   every hex is written as its linear colour and nothing is pre-corrected for a tone map.
//   Keep the camera's near plane at 0.3 m or more: the slabs' layering steps are 0.15 m.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------------------------
// TINCTURES. Brief order of opts.palette: gules, azure, vert, sable, purpure, or, argent.
// ---------------------------------------------------------------------------------------------
export const NCC_PALETTE = ['#C8202A', '#1F4FA8', '#1E7F45', '#17161A', '#6C2C7A', '#E2B33C', '#E6E8EA'];
const NAMES = ['gules', 'azure', 'vert', 'sable', 'purpure', 'or', 'argent'];
const METAL_TONES = { or: ['#B98A2C', '#FFF2C0'], argent: ['#BFC5CC', '#FFFFFF'] };   // deep leaf, pale core
const CLAY = '#8E3A2B';
const BRIEF_SUN = [0.718, 0.559, -0.4145];   // azimuth 120 degrees from +Z toward +X, 34 degrees up

// The law of counterchange, one function of world x and z alone. Three straight plan lines A, B, C
// pass through the hub H; a point is on the positive side of a line when cross(dir, p - H) > 0.
// parity = number of positive sides mod 2; the ground is METAL where parity equals the entry's.
// nccGround(xz) is the exact law (1 metal ground, 0 colour ground); nccGroundAA(xz) is the same law
// with its edges one pixel soft (screen derivatives of xz only; no camera, clock or seed enters).
const GLSL_COUNTER = /* glsl */`
uniform vec2 uCcH; uniform vec2 uCcA; uniform vec2 uCcB; uniform vec2 uCcC; uniform float uCcEntry; uniform vec4 uCcW;
float nccSide(vec2 d, vec2 xz) { vec2 r = xz - uCcH; return d.x * r.y - d.y * r.x; }
// THE PALE OF THE WAY, the fourth dividing line: the line of the way as it lies on the ground (a straight to the arc's
// first point, the arc about the hub, the straight after it; uCcW = the radial direction at the arc's end, the arc's
// radius, 1 when the world has a way). Metres to the ridge's hand of it (positive) or to the hub's hand (negative).
float nccWay(vec2 xz) {
  vec2 r = xz - uCcH;
  if (r.y < 0.) return r.x - uCcW.z;
  return dot(r, vec2(-uCcW.y, uCcW.x)) > 0. ? dot(r, uCcW.xy) - uCcW.z : length(r) - uCcW.z;
}
float nccGround(vec2 xz) {
  float n = step(0., nccSide(uCcA, xz)) + step(0., nccSide(uCcB, xz)) + step(0., nccSide(uCcC, xz));
  float parity = mod(n, 2.);
  float g = 1. - abs(parity - uCcEntry);
  return abs(g - uCcW.w * step(nccWay(xz), 0.));   // on the hub's hand of the way: the counterchange
}
float nccSoft(float s) { return clamp(s / max(fwidth(s), 1e-5) + 0.5, 0., 1.); }
float nccGroundAA(vec2 xz) {
  float a = nccSoft(nccSide(uCcA, xz)), b = nccSoft(nccSide(uCcB, xz)), c = nccSoft(nccSide(uCcC, xz));
  float ab = a + b - 2. * a * b;
  float parity = ab + c - 2. * ab * c;
  float g = 1. - abs(parity - uCcEntry), w = uCcW.w * (1. - nccSoft(nccWay(xz)));
  return g + w - 2. * g * w;
}`;

// The metal: leaf over raised gesso. n is the slab normal already domed across the slab (vertex
// shader), T and B the slab's own plane axes in world space, lf the slab's own plane coordinates in
// metres (the leaf squares travel with the slab), edge 0..1 toward the slab's rim.
const GLSL_METAL = /* glsl */`
uniform vec3 uSun; uniform float uLeafSeed; uniform vec3 uClay;
float nccHash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float nccVal(vec2 p) {
  vec2 i = floor(p), f = p - i; f = f * f * (3. - 2. * f);
  return mix(mix(nccHash(i), nccHash(i + vec2(1., 0.)), f.x), mix(nccHash(i + vec2(0., 1.)), nccHash(i + vec2(1., 1.)), f.x), f.y);
}
vec3 nccMetal(vec3 deep, vec3 leaf, vec3 core, vec3 n, vec3 T, vec3 B, vec3 wpos, vec2 lf, float edge) {
  vec2 sq = lf / 8., cell = floor(sq), f = sq - cell;
  float h1 = nccHash(cell + uLeafSeed), h2 = nccHash(cell.yx + 19.7 + uLeafSeed * 1.7);
  float ang = 6.2832 * h1, mag = 0.0175 * (1. + h2);                 // each leaf square tilted 1 to 2 degrees
#ifdef NCC_CLEAN
  mag = 0.;                                                          // (the great lion: one clean sheet of gold, no square answers the sun by itself)
#endif
  vec3 nn = n + (cos(ang) * T + sin(ang) * B) * mag; nn = nn / max(length(nn), 1e-4);
  vec3 v = cameraPosition - wpos; v = v / max(length(v), 1e-4);
  // THE ONE SUN, TAKEN ON THE FACE WE SEE (the same for every metal body): leaf lies on both faces of a slab, and the
  // face turned from the sun answers it as its other face does (the sun mirrored in the slab's own plane), so that the
  // palette's metal lies over most of every slab from either side and the deep leaf only toward the rim turned from the sun
  vec3 fn = cross(T, B); fn = fn / max(length(fn), 1e-4); if (dot(fn, v) < 0.) fn = -fn;
#ifdef NCC_CLEAN
  // THE GREAT LION IS ONE GOLD FROM THE ENTRY TO THE RING (round 14, T5a). Its leaf answered the one sun AND the eye:
  // beside the fields, where the eye stands between the sun and its flank, the whole beast lay in the burnish's pale
  // core (cream), and by the ring, seen across the sun, in the palette's gold. It now takes its light in ITS OWN
  // drawing, the same from every place of the way: the palette's gold over every slab, the pale burnish only along a
  // slab's upper rim, the deep leaf under its lower one.
  vec3 hv = fn + 0.55 * B / max(length(B), 1e-4);
#else
  vec3 sun = uSun - 2. * min(dot(uSun, fn), 0.) * fn;
  vec3 hv = sun + v;
#endif
  hv = hv / max(length(hv), 1e-4);
  float d = max(dot(nn, hv), 0.);
  vec3 col = mix(deep, leaf, smoothstep(0.3, 0.78, d));
  float p8 = d * d; p8 *= p8; p8 *= p8; float p16 = p8 * p8, p40 = p16 * p16 * p8;   // d^16, d^40
  col = mix(col, core, clamp(0.26 * p16 + 0.85 * p40, 0., 1.));                // a broad burnish with the pale core in it
  vec2 w = fwidth(sq); float px = max(max(w.x, w.y), 1e-5);            // leaf squares per pixel
  vec2 g = min(f, 1. - f);
  float seam = 1. - smoothstep(0.6 * px, 1.4 * px, min(g.x, g.y));
#ifndef NCC_CLEAN
  col *= 1. - 0.04 * seam * (1. - smoothstep(0.15, 0.5, px));          // seams go when a square is a few pixels
#endif
  float wear = smoothstep(0.5, 0.85, nccVal(lf / 4.3 + uLeafSeed * 0.37));
  float ew = max(fwidth(edge), 1e-4);
  float clay = smoothstep(-ew, ew, edge - (1.08 - 0.75 * wear));        // red clay where the rim has worn through
  clay *= 1. - smoothstep(0.12, 0.4, ew);                              // a rim under a few pixels wide shows no clay (no red haze on small far slabs)
  return mix(col, uClay, clay);
}`;

// One vertex shader for every slab material: plain, instanced (InstancedMesh) or jointed (the
// figure's rigid parts take a 2D rotation and shift each from the uniform table uJoint, by aPart).
const VERT = /* glsl */`
attribute vec3 aDome; attribute vec2 aLeaf;
#ifdef NCC_JOINTS
attribute float aPart; uniform vec4 uJoint[NCC_JOINTS];
#endif
#ifdef NCC_KEY
attribute vec2 aOut; uniform float uKeyW;
#ifdef NCC_OUT3
attribute vec3 aOut3;   // the keyline's way out as a vector of the thing's own space (a slab turned out of its drawing plane after it was cut: a wing)
#endif
#endif
#if defined(NCC_KEY) || defined(NCC_FAR) || defined(NCC_PLAIN)
uniform float uPx;
#endif
#ifdef NCC_PLAIN
// A SMALL THING DRAWN PLAINLY: uPlain.x is the metres a pixel spans at the thing's own place beyond which it is drawn
// plain: its keyline is then uPlain.y m broad and never less than a pixel and a quarter (round 12: with its two lines
// no limb of it is drawn thinner than three pixels; none where uPlain.y is 0), and the fragment shader is told so
// (vPlain 1) and draws it in one tincture, with no inner line.
uniform vec2 uPlain; varying float vPlain;
#endif
#ifdef NCC_MARK
attribute vec2 aMark; varying vec2 vMark;   // per instance: from the thing's place to its MARK, the place whose ground it takes its tinctures by (world x, z)
#endif
#ifdef NCC_FAR
varying vec2 vFar;   // the thing's own place (its origin): metres of the slab's own width a pixel spans there, and its height (one value over the whole thing)
#endif
varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vW; varying vec2 vLeaf; varying float vEdge;
#ifdef USE_INSTANCING_COLOR
varying vec3 vInst;
#endif
void main() {
  mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
#endif
  vec3 p = position;
#ifdef NCC_MARK
  vMark = aMark;
#endif
  vec3 n = normal + vec3(aDome.xy * 0.325 * abs(normal.z), 0.);       // 18 degrees at the rim
  vec3 tx = vec3(1., 0., 0.), ty = vec3(0., 1., 0.);
#ifdef NCC_KEY
  vec2 grow = aOut;
#endif
#ifdef NCC_JOINTS
  vec4 j = uJoint[int(aPart + 0.5)];
  p.xy = vec2(j.x * p.x - j.y * p.y, j.y * p.x + j.x * p.y) + j.zw;
  n.xy = vec2(j.x * n.x - j.y * n.y, j.y * n.x + j.x * n.y);
  tx = vec3(j.x, j.y, 0.); ty = vec3(-j.y, j.x, 0.);
#ifdef NCC_KEY
  grow = vec2(j.x * aOut.x - j.y * aOut.y, j.y * aOut.x + j.x * aOut.y);
#endif
#endif
#ifdef NCC_KEY
  vec3 grow3 = vec3(grow, 0.);
#endif
#ifdef NCC_JOINTS
  // (NO WORLD TURNS THE HEAD NOW: the table's last entry is always [1, 0, the neck's place, 0], and this block leaves
  // the head as it is drawn. It is kept as it stood: the head's slabs go through this arithmetic, and taking it out
  // would move their corners by a rounding.)
  // THE HEAD'S TURN (regardant): the slabs of the head (aPart carries a quarter) are swung about the upright through
  // the neck by the last entry of the table: [cos, sin, the neck's place along the figure, a step toward the drawn
  // flank]. Their layers keep their order toward the drawn flank, so at the half turn the head is the same drawing
  // looking back, laid over the mane.
  if (fract(aPart) > 0.1) {
    vec4 h = uJoint[NCC_JOINTS - 1];
    float dxh = p.x - h.z;
    p.x = h.z + dxh * h.x; p.z += h.w + dxh * h.y;
    n = vec3(n.x * h.x - n.z * h.y, n.y, n.x * h.y + n.z * h.x);
    tx = vec3(tx.x * h.x, tx.y, tx.x * h.y); ty = vec3(ty.x * h.x, ty.y, ty.x * h.y);
#ifdef NCC_KEY
    grow3 = vec3(grow.x * h.x, grow.y, grow.x * h.y);
#endif
  }
#endif
  vec4 wp = m * vec4(p, 1.);
#ifdef NCC_KEY
  // the keyline holds 1.5 pixels: push the outset rim outward with distance
  float dist = length(wp.xyz - cameraPosition);
  float extra = max(1.5 * uPx * dist - uKeyW, 0.);
#ifdef NCC_PLAIN
  extra = mix(extra, (uPlain.y > 0. ? max(uPlain.y, 1.25 * uPx * dist) : 0.) - uKeyW, smoothstep(0.92 * uPlain.x, 1.08 * uPlain.x, uPx * length(m[3].xyz - cameraPosition)));
#endif
#ifdef NCC_OUT3
  wp.xyz += mat3(m) * (aOut3 * extra);
#else
  wp.xyz += mat3(m) * (grow3 * extra);
#endif
#endif
#ifdef NCC_FAR
  // (paint only: the slab's own width as it is drawn, so seen aslant it counts as the narrower thing it is on the screen)
  vec3 toEye = cameraPosition - m[3].xyz; float farD = max(length(toEye), 1e-3);
  vec3 face = m[2].xyz / max(length(m[2].xyz), 1e-6);
  vFar = vec2(uPx * farD / max(abs(dot(face, toEye)) / farD, 0.35), m[3].y);
#endif
#ifdef NCC_PLAIN
  vPlain = smoothstep(0.92 * uPlain.x, 1.08 * uPlain.x, uPx * length(m[3].xyz - cameraPosition));
#endif
  mat3 m3 = mat3(m);
  vec3 wt = m3 * tx, wb = m3 * ty;
  vN = m3 * n; vT = wt / max(length(wt), 1e-6); vB = wb / max(length(wb), 1e-6); vW = wp.xyz; vLeaf = aLeaf; vEdge = aDome.z;
#ifdef USE_INSTANCING_COLOR
  vInst = instanceColor;
#endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG_HEAD = /* glsl */`
varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vW; varying vec2 vLeaf; varying float vEdge;
#ifdef USE_INSTANCING_COLOR
varying vec3 vInst;
#endif
#ifdef NCC_MARK
varying vec2 vMark;
#endif
`;

// ---------------------------------------------------------------------------------------------
// OUTLINES. An outline is an array of [x, y] in metres, closed, any winding.
// ---------------------------------------------------------------------------------------------
// nccOutline(spec, sub): spec points are [x, y] (the line passes smoothly through) or [x, y, 1]
// (a corner). Each span is a Hermite curve of `sub` steps, so a shape is drawn with a few points.
export function nccOutline(spec, sub = 4) {
  const n = spec.length, out = [];
  const dir = (i) => {
    const a = spec[(i + n - 1) % n], b = spec[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l];
  };
  for (let i = 0; i < n; i++) {
    const p1 = spec[i], p2 = spec[(i + 1) % n];
    const ex = p2[0] - p1[0], ey = p2[1] - p1[1], L = Math.hypot(ex, ey);
    if (L < 1e-6) continue;
    const t1 = p1[2] ? [ex / L, ey / L] : dir(i), t2 = p2[2] ? [ex / L, ey / L] : dir(i + 1);
    const steps = (p1[2] && p2[2]) ? 1 : sub;
    for (let k = 0; k < steps; k++) {
      const t = k / steps, t2_ = t * t, t3 = t2_ * t;
      const h1 = 2 * t3 - 3 * t2_ + 1, h2 = t3 - 2 * t2_ + t, h3 = -2 * t3 + 3 * t2_, h4 = t3 - t2_;
      out.push([h1 * p1[0] + h2 * L * t1[0] + h3 * p2[0] + h4 * L * t2[0], h1 * p1[1] + h2 * L * t1[1] + h3 * p2[1] + h4 * L * t2[1]]);
    }
  }
  return out;
}
function signedArea(pts) { let a = 0; for (let i = 0, n = pts.length; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
// Offset an outline (counter-clockwise) by d metres, outward for d > 0; mitres limited.
// Returns [x, y, mx, my] per vertex: the moved point and the direction it moved in.
function offsetOutline(pts, d, limit = 2.4) {
  const n = pts.length, out = new Array(n);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    let ax = p1[0] - p0[0], ay = p1[1] - p0[1], bx = p2[0] - p1[0], by = p2[1] - p1[1];
    const la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1; ax /= la; ay /= la; bx /= lb; by /= lb;
    let mx = ay + by, my = -ax - bx; const lm = Math.hypot(mx, my);
    if (lm < 1e-6) { mx = ay; my = -ax; } else { mx /= lm; my /= lm; }
    const k = 1 / Math.max(mx * ay - my * ax, 1 / limit);
    out[i] = [p1[0] + mx * k * d, p1[1] + my * k * d, mx * k, my * k];
  }
  return out;
}

// THE SLAB: an outline triangulated and extruded to a thickness about the plane z = o.z, with a rim
// strip (o.rim metres wide) that carries the worn edge, and its KEYLINE: the outline set out by
// o.keyline metres, as flat sable copies lying just inside both faces (so the line shows round the
// slab from either side and parts it from whatever slab lies behind). o: { thickness 1.5, z 0,
// keyline 1.2 (0: none), rim, part (joint index for a jointed figure), keyInset 0.15, backKey true }.
// Returns { geometry, keyGeometry } with attributes position, normal, aDome, aLeaf (aOut, aPart);
// merge many with BufferGeometryUtils.mergeGeometries, or use style.batch().
export function nccSlab(outline, o = {}) {
  let pts = outline.map((p) => [p[0], p[1]]);
  if (signedArea(pts) < 0) pts.reverse();
  const n = pts.length, t = o.thickness ?? 1.5, z0 = o.z ?? 0, h = t / 2;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hx = Math.max((x1 - x0) / 2, 1e-3), hy = Math.max((y1 - y0) / 2, 1e-3);
  const rim = o.rim ?? Math.min(0.9, 0.06 * Math.min(hx, hy) * 2);
  const ins = offsetOutline(pts, -rim, 1.6);
  const tris = THREE.ShapeUtils.triangulateShape(pts.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const pos = [], nor = [], dome = [], leaf = [], idx = [];
  let nv = 0;
  const put = (x, y, z, nx, ny, nz, e, face) => {
    pos.push(x, y, z); nor.push(nx, ny, nz); leaf.push(x, y);
    dome.push(face ? (x - cx) / hx : 0, face ? (y - cy) / hy : 0, e); return nv++;
  };
  for (const s of [1, -1]) {
    const zf = z0 + s * h, b = nv;
    for (let i = 0; i < n; i++) put(ins[i][0], ins[i][1], zf, 0, 0, s, 0, true);
    for (const tr of tris) { if (s > 0) idx.push(b + tr[0], b + tr[1], b + tr[2]); else idx.push(b + tr[0], b + tr[2], b + tr[1]); }
    const b2 = nv;
    for (let i = 0; i < n; i++) { put(ins[i][0], ins[i][1], zf, 0, 0, s, 0, true); put(pts[i][0], pts[i][1], zf, 0, 0, s, 1, true); }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ii = b2 + 2 * i, oi = ii + 1, ij = b2 + 2 * j, oj = ij + 1;
      if (s > 0) idx.push(oi, oj, ij, oi, ij, ii); else idx.push(oi, ij, oj, oi, ii, ij);
    }
  }
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l;
    const a = put(p[0], p[1], z0 + h, nx, ny, 0, 0.45, false), b = put(q[0], q[1], z0 + h, nx, ny, 0, 0.45, false);
    const c = put(q[0], q[1], z0 - h, nx, ny, 0, 0.45, false), d = put(p[0], p[1], z0 - h, nx, ny, 0, 0.45, false);
    idx.push(a, c, b, a, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geometry.setAttribute('aDome', new THREE.Float32BufferAttribute(dome, 3));
  geometry.setAttribute('aLeaf', new THREE.Float32BufferAttribute(leaf, 2));
  if (o.part !== undefined) geometry.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(nv).fill(o.part), 1));
  geometry.setIndex(idx);
  let keyGeometry = null;
  const kw = o.keyline ?? 1.2;
  if (kw > 0) {
    const out = offsetOutline(pts, kw), kp = [], kn = [], ko = [], ki = [];
    const ki0 = o.keyInset ?? 0.15, sides = o.backKey === false ? [1] : [1, -1];
    let kv = 0;
    for (const s of sides) {
      const zk = z0 + s * (h - ki0), b = kv;
      for (let i = 0; i < n; i++) { kp.push(out[i][0], out[i][1], zk); kn.push(0, 0, s); ko.push(out[i][2], out[i][3]); kv++; }
      for (const tr of tris) { if (s > 0) ki.push(b + tr[0], b + tr[1], b + tr[2]); else ki.push(b + tr[0], b + tr[2], b + tr[1]); }
    }
    keyGeometry = new THREE.BufferGeometry();
    keyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3));
    keyGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(kn, 3));
    keyGeometry.setAttribute('aOut', new THREE.Float32BufferAttribute(ko, 2));
    if (o.part !== undefined) keyGeometry.setAttribute('aPart', new THREE.Float32BufferAttribute(new Float32Array(kv).fill(o.part), 1));
    keyGeometry.setIndex(ki);
  }
  return { geometry, keyGeometry };
}

// ---------------------------------------------------------------------------------------------
// THE STYLE KIT
// ---------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const pal = opts.palette || NCC_PALETTE;
  const tinctures = {};
  NAMES.forEach((nm, i) => { tinctures[nm] = new THREE.Color(pal[i] || NCC_PALETTE[i]); });
  const tones = {
    orDeep: new THREE.Color(METAL_TONES.or[0]), orCore: new THREE.Color(METAL_TONES.or[1]),
    argentDeep: new THREE.Color(METAL_TONES.argent[0]), argentCore: new THREE.Color(METAL_TONES.argent[1]),
    clay: new THREE.Color(CLAY),
  };
  const tinc = (c) => (c && c.isColor ? c : tinctures[c] || tinctures.sable);
  const isMetal = (nm) => nm === 'or' || nm === 'argent';
  const leafSeed = opts.leafSeed ?? Math.floor((ctx && ctx.rng ? ctx.rng() : 0.37) * 997) * 0.731;
  // shared uniforms: the same objects sit in every material, so the world sets each once
  const uniforms = {
    uSun: { value: new THREE.Vector3().fromArray(opts.sun || BRIEF_SUN).normalize() },
    uLeafSeed: { value: leafSeed }, uClay: { value: tones.clay },
    uCcH: { value: new THREE.Vector2(300, 110) }, uCcA: { value: new THREE.Vector2(-293, 62).normalize() },
    uCcB: { value: new THREE.Vector2(-230, 193).normalize() }, uCcC: { value: new THREE.Vector2(-122, 274).normalize() },
    uCcEntry: { value: 0 }, uPx: { value: 0.0027 }, uTime: { value: 0 },
    uCcW: { value: new THREE.Vector4(1, 0, 300, 0) },
  };
  // JavaScript twin of nccGround: 1 on metal ground, 0 on colour ground (per-instance things).
  const parityAt = (x, z) => {
    const H = uniforms.uCcH.value; let k = 0;
    for (const u of [uniforms.uCcA, uniforms.uCcB, uniforms.uCcC]) { const d = u.value; if (d.x * (z - H.y) - d.y * (x - H.x) >= 0) k++; }
    return k % 2;
  };
  // the pale of the way (JavaScript twin of nccWay): metres to the ridge's hand (positive) or the hub's (negative)
  const wayAt = (x, z) => {
    const H = uniforms.uCcH.value, W = uniforms.uCcW.value, rx = x - H.x, rz = z - H.y;
    if (rz < 0) return rx - W.z;
    return rx * -W.y + rz * W.x > 0 ? rx * W.x + rz * W.y - W.z : Math.hypot(rx, rz) - W.z;
  };
  const ground = (x, z) => { const g = 1 - Math.abs(parityAt(x, z) - uniforms.uCcEntry.value); return uniforms.uCcW.value.w > 0.5 && wayAt(x, z) <= 0 ? 1 - g : g; };
  // setCounterchange({ hub: [x, z], through: [[x, z], [x, z], [x, z]], entry: [x, z] }): the three lines
  // pass through the hub and one named point each; the entry's ground is metal. Call once at build.
  function setCounterchange(c = {}) {
    const hub = c.hub || [300, 110], thr = c.through || [[7, 172], [70, 303], [178, 384]], en = c.entry || [0, 0];
    uniforms.uCcH.value.set(hub[0], hub[1]);
    [uniforms.uCcA, uniforms.uCcB, uniforms.uCcC].forEach((u, i) => u.value.set(thr[i][0] - hub[0], thr[i][1] - hub[1]).normalize());
    uniforms.uCcEntry.value = parityAt(en[0], en[1]);
    // c.way { end: [x, z] (the radial direction from the hub at the arc's end), radius }: the way's own line is a fourth line
    if (c.way) uniforms.uCcW.value.set(c.way.end[0], c.way.end[1], c.way.radius, 1);
  }
  setCounterchange(opts.counterchange);
  function setSun(x, y, z) { if (x && x.isVector3) uniforms.uSun.value.copy(x).normalize(); else uniforms.uSun.value.set(x, y, z).normalize(); }

  // MATERIALS. o: { joints: { value: Vector4[] } (jointed figure), side, key: cache key }
  const cache = new Map();
  function make(kind, a, b, o = {}) {
    const key = o.joints || o.mark || o.fruit || o.side !== undefined || o.keyWidth !== undefined ? null : kind + '|' + (a && a.isColor ? a.getHexString() : a) + '|' + (b || '');
    if (key && cache.has(key)) return cache.get(key);
    const u = { ...uniforms }, defines = {};
    let body = '';
    if (o.joints) { defines.NCC_JOINTS = o.joints.value.length; u.uJoint = o.joints; }
    if (o.mark) defines.NCC_MARK = 1;   // counterchanged by the ground at the thing's mark (instanced attribute aMark), not under it
    if (o.clean) defines.NCC_CLEAN = 1; // a metal with no leaf squares: no tilt from square to square, no seams (the great lion)
    if (o.fruit) defines.NCC_FRUIT = 1; // the fruit of a counterchanged charge: the METAL on metal ground (where the charge is its colour), the colour on colour ground
    if (kind === 'colour' || kind === 'key') {
      u.uCol = { value: tinc(a) };
      if (kind === 'key') { defines.NCC_KEY = 1; u.uKeyW = { value: o.keyWidth ?? 1.2 }; if (o.out3) defines.NCC_OUT3 = 1; if (o.plain) { defines.NCC_PLAIN = 1; u.uPlain = { value: new THREE.Vector2(o.plain[0], o.plain[1]) }; } }
      body = 'uniform vec3 uCol;\nvoid main() {\n vec3 col = uCol;\n#ifdef USE_INSTANCING_COLOR\n col *= vInst;\n#endif\n gl_FragColor = vec4(col, 1.);\n}';
    } else {
      const mt = kind === 'metal' ? a : b;
      u.uLeaf = { value: tinc(mt) }; u.uDeep = { value: tones[mt + 'Deep'] || tinc(mt) }; u.uCore = { value: tones[mt + 'Core'] || tinc(mt) };
      const metal = ' vec3 n = vN / max(length(vN), 1e-4);\n vec3 mc = nccMetal(uDeep, uLeaf, uCore, n, vT, vB, vW, vLeaf, vEdge);\n';
      if (kind === 'metal') body = GLSL_METAL + 'uniform vec3 uLeaf, uDeep, uCore;\nvoid main() {\n' + metal + ' gl_FragColor = vec4(mc, 1.);\n}';
      else {
        u.uCol = { value: tinc(a) };
        body = GLSL_METAL + GLSL_COUNTER + 'uniform vec3 uLeaf, uDeep, uCore, uCol;\nvoid main() {\n' + metal + '#ifdef NCC_MARK\n float g = nccGroundAA(vW.xz + vMark);\n#else\n float g = nccGroundAA(vW.xz);\n#endif\n#ifdef NCC_FRUIT\n g = 1. - g;\n#endif\n gl_FragColor = vec4(mix(mc, uCol, g), 1.);\n}';
      }
    }
    const m = new THREE.ShaderMaterial({ uniforms: u, defines, vertexShader: VERT, fragmentShader: FRAG_HEAD + body, side: o.side ?? THREE.FrontSide });
    if (kind === 'key') { m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1; }
    if (key) cache.set(key, m);
    return m;
  }
  const style = {
    tinctures, tones, uniforms, glsl: { counter: GLSL_COUNTER, metal: GLSL_METAL, vertex: VERT, fragHead: FRAG_HEAD },
    isMetal,
    // COLOUR: unlit, writes its hex. name is a tincture name or a THREE.Color.
    colour: (name, o) => make('colour', name, null, o),
    // METAL: 'or' or 'argent'; the leaf answers the one sun and the view.
    metal: (name, o) => make('metal', name, null, o),
    // COUNTERCHANGED: a pair, one colour and one metal: the colour on metal ground, the metal on colour ground.
    counter: (colourName, metalName, o) => make('counter', colourName, metalName, o),
    // KEYLINE: sable, for the keyGeometry of a slab; o.keyWidth must equal the slab's keyline width.
    keyline: (o) => make('key', 'sable', null, o),
    // fimbriation(metal, { keyWidth }): a broad flat edge of a metal for a slab's keyGeometry (it lies before the sable keyline)
    fimbriation: (metalName, o) => { const m = make('key', metalName, null, o); m.polygonOffsetFactor = 0.5; m.polygonOffsetUnits = 0.5; return m; },
    outline: nccOutline, slab: nccSlab, ground, parityAt, wayAt, setCounterchange, setSun,
    // update: shared uniforms only (clock, pixel size for the keyline). Call once a frame.
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      if (camera && camera.projectionMatrix) {
        let hpx = 720;
        if (ctx && ctx.renderer) { ctx.renderer.getDrawingBufferSize(_size); hpx = Math.max(_size.y, 1); }
        uniforms.uPx.value = 2 / (Math.max(Math.abs(camera.projectionMatrix.elements[5]), 1e-3) * hpx);
      }
    },
  };
  return style;
}
const _size = new THREE.Vector2();

// ---------------------------------------------------------------------------------------------
// THE LION, drawn. Lion space: x forward (the muzzle looks toward +x), y up, soles at y 0, metres.
// Every slab is drawn in the REST attitude (statant) with the pivot it turns about, its parent and
// its layer: lay -1 far, 0 middle, +1 near (2 m apart), sub a small step inside the layer so slabs
// that overlap at a joint never share a plane. Nineteen gold slabs; tongue, claws, eye, drawn lines and fangs besides.
// ---------------------------------------------------------------------------------------------
const C = 1;   // corner flag for outline points
const FORE_UP = [[22, 67], [30, 72.5], [38, 68.5], [40, 58], [36.5, 46], [33, 38], [29.5, 32.5], [23.5, 33], [20, 39], [20, 50], [20, 60]];
const FORE_LO = [[21, 42], [26, 45.5], [31.5, 43], [33.5, 32], [34, 17], [31.5, 10], [26.5, 10], [24.5, 16], [24, 24], [19, 21, C], [22.5, 30], [16.5, 31, C], [21, 37]];
const FORE_PAW = [[24.5, 9], [25.5, 15.5], [30.5, 18], [36, 15.5], [39.5, 11.5], [42.5, 9.5, C], [45, 10.2], [47, 7.2, C], [49.3, 7.4], [50.3, 4, C], [51.8, 3.2], [51.5, 0.6], [47, 0, C], [30, 0, C], [25, 1.8]];
const HIND_UP = [[-67, 61], [-58, 70], [-46, 69.5], [-37, 60], [-33, 48], [-33, 39], [-37.5, 32.5], [-45, 33.5], [-51, 40], [-59, 46], [-66, 52]];
const HIND_LO = [[-35, 42], [-32.5, 35], [-37, 29.5], [-48, 24], [-57, 18.5], [-63.5, 18.5], [-67, 22.5], [-71.5, 29, C], [-63, 29.5], [-52, 34.5], [-43.5, 43]];
const HIND_PAW = [[-67, 23], [-62, 28.5], [-56.5, 24.5], [-54.5, 14], [-52, 10.5], [-47, 9.6, C], [-44.5, 10.4], [-42.5, 7.3, C], [-40.2, 7.5], [-39.2, 4, C], [-37.7, 3.2], [-38, 0.6], [-42.5, 0, C], [-58.5, 0, C], [-62, 3], [-63, 12]];
// a drawn line: a sliver along the points, so wide in its middle, tapering to its two ends (every point a corner)
const stroke = (pts, w) => {
  const L = [], R = [];
  pts.forEach((q, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = w * (i === 0 || i === pts.length - 1 ? 0.2 : 0.5);
    L.push([q[0] - dy / l * hw, q[1] + dx / l * hw, C]); R.push([q[0] + dy / l * hw, q[1] - dx / l * hw, C]);
  });
  return L.concat(R.reverse());
};
const claws = (tx, ty) => [   // three hooked claws at a paw's toes, gules; (tx, ty) the middle toe's front
  [[tx - 4.2, ty + 3.6, C], [tx - 0.6, ty + 4.6], [tx + 2.4, ty + 2.2, C], [tx - 1.2, ty + 2.6], [tx - 3.6, ty + 1.4, C]],
  [[tx - 2.6, ty + 0.6, C], [tx + 1.2, ty + 1.2], [tx + 3.8, ty - 1.6, C], [tx + 0.2, ty - 0.9], [tx - 2.2, ty - 2.2, C]],
  [[tx - 4.8, ty - 2.2, C], [tx - 1.0, ty - 2.6], [tx + 1.6, ty - 3.4, C], [tx - 2.2, ty - 3.9, C]],
];
// name, parent, pivot (rest), layer, sub, outline spec, kind ('or' gold slab, 'gules', 'sable')
const LION_PARTS = [
  { name: 'torso', parent: -1, pivot: [-52, 58], lay: 0, sub: -1, kind: 'or', spec: [
    [-81, 64], [-76, 75], [-60, 81], [-34, 77.5], [-8, 77], [14, 82], [32, 90], [46, 95], [57, 90], [60, 76], [57, 62], [51, 48], [39, 41],
    [23, 43], [5, 50], [-17, 57.5], [-33, 56], [-46, 48], [-62, 44.5], [-76, 51]] },
  { name: 'tail1', parent: 0, pivot: [-76, 70], lay: 0, sub: 0, kind: 'or', spec: [
    [-73, 65.5], [-87, 72.5], [-99.5, 86], [-102, 100], [-97.5, 112], [-92, 116], [-88.5, 110.5], [-93.5, 100], [-92.5, 90], [-85, 80.5], [-73.5, 74.5]] },
  { name: 'tail2', parent: 1, pivot: [-93, 109], lay: 0, sub: 1, kind: 'or', spec: [
    [-98, 105], [-94, 118], [-83.5, 127], [-69, 128.5], [-57.5, 122], [-53, 112.5], [-57, 108], [-61.5, 112], [-65.5, 118.5], [-73, 121], [-82, 119], [-88, 111], [-90.5, 103.5]] },
  { name: 'tuft', parent: 2, pivot: [-57.5, 113], lay: 0, sub: 0, kind: 'or', spec: [
    [-61, 113], [-57, 107.5], [-49, 106.5], [-41.5, 111], [-34, 121, C], [-41, 119], [-38.5, 131, C], [-46.5, 123.5], [-49.5, 133, C], [-54.5, 123], [-60.5, 126, C], [-59.5, 118]] },
  { name: 'jaw', parent: 5, pivot: [57, 84], lay: 0, sub: 0, kind: 'or', spec: [
    [51, 86], [60, 84.5], [68, 81], [73.5, 78.2, C], [75.8, 82.2, C], [77.2, 77, C], [82.5, 75], [81, 70], [73, 68.5], [63.5, 69.5], [55.5, 73.5], [50, 80]] },
  { name: 'head', parent: 0, pivot: [48, 86], lay: 0, sub: 1, kind: 'or', spec: [
    [45, 89], [47, 99.5], [54, 104], [56.5, 111.5, C], [62.5, 104], [69, 104], [74, 100.5], [80.5, 99], [87.5, 95.5], [88, 89.5], [83.5, 85.8, C],
    [77.2, 86.2, C], [76, 81.6, C], [73.6, 86.4, C], [66, 87.2], [60.5, 86, C], [56.5, 80.5], [48, 80]] },
  { name: 'mane', parent: 0, pivot: [40, 80], lay: 1, sub: -1, kind: 'or', spec: [
    [55.5, 105], [46, 107], [34.5, 102, C], [40, 97], [24.5, 95, C], [31.5, 89], [12, 85, C], [24, 79], [8.5, 70, C], [23.5, 67], [14, 55, C], [29, 55.5],
    [28, 41.5, C], [39.5, 48.5], [45.5, 35, C], [51.5, 48], [62.5, 43, C], [60, 57], [67, 62, C], [60, 69.5], [58, 78], [54, 86], [54, 96]] },
  { name: 'nfUp', parent: 0, pivot: [30, 62], lay: 1, sub: 0, kind: 'or', spec: FORE_UP },
  { name: 'nfLo', parent: 7, pivot: [26, 38], lay: 1, sub: 1, kind: 'or', spec: FORE_LO },
  { name: 'nfPaw', parent: 8, pivot: [30, 13], lay: 1, sub: 0, kind: 'or', spec: FORE_PAW },
  { name: 'ffUp', parent: 0, pivot: [30, 62], lay: -1, sub: 0, kind: 'or', spec: FORE_UP },
  { name: 'ffLo', parent: 10, pivot: [26, 38], lay: -1, sub: 1, kind: 'or', spec: FORE_LO },
  { name: 'ffPaw', parent: 11, pivot: [30, 13], lay: -1, sub: 0, kind: 'or', spec: FORE_PAW },
  { name: 'nhUp', parent: 0, pivot: [-52, 58], lay: 1, sub: 0, kind: 'or', spec: HIND_UP },
  { name: 'nhLo', parent: 13, pivot: [-40, 37], lay: 1, sub: -1, kind: 'or', spec: HIND_LO },
  { name: 'nhPaw', parent: 14, pivot: [-62, 24], lay: 1, sub: 0, kind: 'or', spec: HIND_PAW },
  { name: 'fhUp', parent: 0, pivot: [-52, 58], lay: -1, sub: 0, kind: 'or', spec: HIND_UP },
  { name: 'fhLo', parent: 16, pivot: [-40, 37], lay: -1, sub: -1, kind: 'or', spec: HIND_LO },
  { name: 'fhPaw', parent: 17, pivot: [-62, 24], lay: -1, sub: 0, kind: 'or', spec: HIND_PAW },
  // langued and armed gules, the eye sable: each rides the joint of the slab named in `on`
  // (THE HEAD READS, round 8. LANGUED: the tongue lies in the open mouth under the upper lip and comes out CLEAR OF THE
  // MUZZLE, its tip curled up 4 to 7 m before the nose: no red lies on the cheek or the brow; it lies behind the jaw's
  // face and the head's, so the fangs stand before it. THE EYE: one large almond, sable, a slab well proud of the
  // head's face (it is drawn, not keylined: nothing sets it back). DRAWN IN SABLE on the head's face: the brow over the
  // eye, the nostril, the line of the muzzle over the lip; on the jaw its own line; on the mane a line in from every
  // notch between two locks. ARMED ARGENT in the mouth: the two fangs, keylined.)
  { name: 'tongue', on: 4, lay: 0, sub: -0.5, kind: 'gules', spec: [[66, 82.4], [74, 81.3], [83, 81.7], [90.5, 83.8], [95.5, 89.2, C], [91.2, 86.9], [86, 84.9], [79, 84.1], [71, 83.9], [66, 84.5]] },
  { name: 'eye', on: 5, lay: 0, sub: 3, kind: 'sable', key: 0, spec: [[59.8, 96.2, C], [67.2, 101.2], [75.6, 96.9, C], [67.6, 93.1]] },
  { name: 'brow', on: 5, lay: 0, sub: 3, kind: 'sable', key: 0, spec: stroke([[58.5, 101.2], [66.5, 104.4], [76.5, 100.6]], 1.5) },
  { name: 'nostril', on: 5, lay: 0, sub: 3, kind: 'sable', key: 0, spec: stroke([[83.6, 95.6], [86.3, 93.6], [85, 91.2]], 1.4) },
  { name: 'muzzle', on: 5, lay: 0, sub: 3, kind: 'sable', key: 0, spec: stroke([[84.5, 88.9], [78.5, 90.4], [70.5, 90.6], [64, 89.4]], 1.1) },
  { name: 'jawline', on: 4, lay: 0, sub: 2, kind: 'sable', key: 0, spec: stroke([[56.5, 77.4], [63.5, 74], [72, 72.6], [79, 72.9]], 1.1) },
  ...[[[40, 97], [44.5, 91.5]], [[31.5, 89], [38, 85]], [[24, 79], [32.5, 77.5]], [[23.5, 67], [32, 68.5]], [[29, 55.5], [36, 60]], [[39.5, 48.5], [43, 56.5]], [[51.5, 48], [50.5, 57]]]
    .map((q, i) => ({ name: 'lock' + i, on: 6, lay: 1, sub: 2, kind: 'sable', key: 0, spec: stroke([q[0], [(q[0][0] + q[1][0]) / 2 + 0.6, (q[0][1] + q[1][1]) / 2 - 0.6], q[1]], 1.3) })),
  { name: 'fangUp', on: 5, lay: 0, sub: 2.4, kind: 'argent', key: 0.5, spec: [[73.9, 86.6, C], [76, 82.3, C], [77.1, 86.4, C]] },
  { name: 'fangLo', on: 4, lay: 0, sub: 1.4, kind: 'argent', key: 0.5, spec: [[74, 78.2, C], [75.8, 81.6, C], [76.9, 77.4, C]] },
  ...claws(52.5, 3.6).map((spec, i) => ({ name: 'nfClaw' + i, on: 9, lay: 1, sub: -0.6, kind: 'gules', spec })),
  ...claws(52.5, 3.6).map((spec, i) => ({ name: 'ffClaw' + i, on: 12, lay: -1, sub: -0.6, kind: 'gules', spec })),
  ...claws(-37, 3.6).map((spec, i) => ({ name: 'nhClaw' + i, on: 15, lay: 1, sub: -0.6, kind: 'gules', spec })),
  ...claws(-37, 3.6).map((spec, i) => ({ name: 'fhClaw' + i, on: 18, lay: -1, sub: -0.6, kind: 'gules', spec })),
];

// A POSE is 29 numbers, blended linearly and then solved (so every in-between is a lawful figure):
//  0 rear (body angle, nose up, radians)  1 crouch (hips lowered, m)  2 head  3 jaw  4 mane (joint turns)
//  5..7 tail joints   then four legs (near fore, far fore, near hind, far hind), five numbers each:
//  plant (1 on the crest, 0 lifted), dx (the planted paw's shift along the crest from its rest place),
//  wx, wy (the lifted wrist or hock in the torso's rest frame), paw (the lifted paw's turn against the body);
//  28 skim (1: the stretched attitude, the whole figure carried along the line of the crest's tips).
//  29 bound (1: an attitude of the bound: the body's angle is the slope of the line of the tips under it plus
//     `rear`, and the body hangs from whichever pair of paws is on the crest: over the hind paws on the tip it
//     leaves, or from the fore paws on the tip it comes down to).
const NP = 30;
const pose = (rear, crouch, head, jaw, mane, tail, nf, ff, nh, fh, skim = 0, bound = 0) => [rear, crouch, head, jaw, mane, ...tail, ...nf, ...ff, ...nh, ...fh, skim, bound];
const POSES = {
  passantA: pose(0, 0, 0.02, -0.2, 0, [0, 0, 0], [1, -7, 0, 0, 0], [0, 0, 68, 50, 0.75], [1, 9, 0, 0, 0], [1, -15, 0, 0, 0]),
  statant: pose(0, 0, -0.03, -0.1, 0, [0.06, -0.1, -0.1], [1, -5, 0, 0, 0], [1, 11, 0, 0, 0], [1, 7, 0, 0, 0], [1, -12, 0, 0, 0]),
  passantB: pose(0, 0, 0.02, -0.2, 0, [0, 0.05, 0.1], [0, 0, 69, 52, 0.8], [1, -6, 0, 0, 0], [1, -13, 0, 0, 0], [1, 10, 0, 0, 0]),
  statantTail: pose(0, 0, 0.06, -0.26, 0, [-0.2, 0.62, 0.42], [1, 10, 0, 0, 0], [1, -6, 0, 0, 0], [1, -11, 0, 0, 0], [1, 7, 0, 0, 0]),
  // the second tip's held attitude: statant, the head turned down to us on the route below, the jaws a little open, a
  // forepaw raised and the tail thrown up over its back (it tells from the walk, whose head is level and whose tail trails)
  statantDown: pose(0, 1, -0.5, -0.3, -0.06, [1.3, -0.6, -0.5], [0, 0, 66, 47, 0.7], [1, 6, 0, 0, 0], [1, 7, 0, 0, 0], [1, -12, 0, 0, 0]),
  // the roar held: statant, the head thrown up, the jaws wide, the tail out stiff behind
  roar: pose(0.05, 2, 0.5, -0.62, 0.12, [0.9, -0.6, -0.5], [1, 12, 0, 0, 0], [1, 2, 0, 0, 0], [1, 2, 0, 0, 0], [1, -14, 0, 0, 0]),
  // sejant: upright on its haunches, the forepaws straight down before it, the tail curled up behind
  // (ROUND 10: AT REST, where the world names a rest (law.rest): the haunches right down on the ground, the hind paws
  // drawn forward under the belly, the forelegs straight and close before it, the back rising 30 degrees to a high
  // head held level; sejantB the same with the tail's end let down: the clock's own beat while it sits.)
  sejant: pose(0.5, 42, -0.5, -0.1, -0.3, [-0.9, 0.6, 0.7], [1, -22, 77.9, 51.8, 0.2], [1, -14, 76, 45.2, 0.1], [1, 38, -99.5, 46.1, -2.0], [1, 30, -98.6, 42.9, -1.9]),
  sejantB: pose(0.5, 42, -0.5, -0.1, -0.3, [-0.8, 0.35, 0.2], [1, -22, 77.9, 51.8, 0.2], [1, -14, 76, 45.2, 0.1], [1, 38, -99.5, 46.1, -2.0], [1, 30, -98.6, 42.9, -1.9]),
  // courant, the run in two attitudes that differ in whole outline. STRETCHED: long and level along the line of the
  // tips, the forelegs reaching for the next tip, the hind legs trailing straight out from the one just left, the tail
  // streaming. GATHERED: all four paws together on one tip, the rump high, the head down, the tail thrown up.
  courantS: pose(0, 0, 0.12, -0.3, 0.05, [0.62, -0.25, -0.75], [0, 0, 77.9, 51.8, 0.2], [0, 0, 76, 45.2, 0.1], [0, 0, -99.5, 46.1, -2.0], [0, 0, -98.6, 42.9, -1.9], 1, 1),
  // the bound's two other attitudes. DRIVING OFF: the hind paws still on the tip it leaves and the hind legs straight
  // back to it, the forelegs folded under the chest, the body rising, the tail down. REACHING DOWN: the forepaws set
  // down on the tip ahead, the hind legs drawn up under the belly, the body along the line of the tips, the tail thrown up.
  // (Where the planted paws stand is the bound's own: the places they have on the tip left and on the tip landed on.)
  courantD: pose(0.3, -4, -0.22, -0.22, 0.04, [0.35, -0.3, -0.45], [0, 0, 43, 39, -1.25], [0, 0, 37, 33, -1.35], [1, 0, -99.5, 46.1, -2.0], [1, 0, -98.6, 42.9, -1.9], 0, 1),
  // (REACHING DOWN is a leap coming down, never a dive: the body lies along the line of the tips, a degree or two nose-up
  // in its own plane, and only the forelegs reach down ahead to the tip. From the route the figure is seen aslant and from
  // below, which steepens any pitch it is given: tipped 15 degrees forward it read as a lion standing on its nose.)
  courantR: pose(0.04, 0, 0.14, -0.26, 0.05, [-0.5, 0.7, 0.55], [1, 0, 77.9, 51.8, 0.2], [1, 0, 76, 45.2, 0.1], [0, 0, -33, 37, 0.9], [0, 0, -41, 41, 0.8], 0, 1),
  // THE RUN'S LONG ATTITUDE (courant, stretched long, every paw on the green): the forepaws set on the tip ahead, the hind
  // paws still on the tip behind, the body a bridge over the notch between the two, the head low and forward, the tail
  // streaming out behind. (Where the planted paws stand is the run's own: see lionPose.)
  courantB: pose(0.02, 6, 0.1, -0.3, 0.05, [0.62, -0.25, -0.75], [1, 0, 77.9, 51.8, 0.2], [1, 0, 76, 45.2, 0.1], [1, 0, -99.5, 46.1, -2.0], [1, 0, -98.6, 42.9, -1.9]),
  courantG: pose(0.03, 6, -0.2, -0.1, -0.06, [0.4, -0.3, -0.4], [1, -14, 77.9, 51.8, 0.2], [1, -21, 76, 45.2, 0.1], [1, 46, -99.5, 46.1, -2.0], [1, 37, -98.6, 42.9, -1.9]),
  curl: pose(0, 0, -0.03, 0.02, 0, [0.1, -0.32, -0.55], [1, -5, 0, 0, 0], [1, 11, 0, 0, 0], [1, 7, 0, 0, 0], [1, -12, 0, 0, 0]),
  gather: pose(0.1, 13, -0.12, 0.1, 0.02, [0.5, -0.5, -0.3], [1, -2, 0, 0, 0], [1, 8, 0, 0, 0], [1, 22, 0, 0, 0], [1, 8, 0, 0, 0]),
  land: pose(0.1, 13, -0.12, 0.1, 0.02, [0.5, -0.5, -0.3], [1, -2, 77.9, 51.8, 0.2], [1, 8, 76, 45.2, 0.1], [1, 22, -99.5, 46.1, -2.0], [1, 8, -98.6, 42.9, -1.9]),   // gather, as the last bound comes down into it
  salient: pose(0.62, 4, -0.3, -0.12, -0.2, [0.35, 0.3, 0.2], [0, 0, 70, 40, 0.1], [0, 0, 62, 30, -0.1], [1, 4, -80, 26, -0.5], [1, -8, -88, 32, -0.6]),   // salient: both hind paws stay on the tip
  rampant: pose(0.98, 3, -0.5, -0.2, -0.38, [-0.2, 0.55, 0.4], [0, 0, 71, 39, -0.2], [0, 0, 51, 20, -0.55], [1, 9, 0, 0, 0], [1, -11, 0, 0, 0]),
  rampantB: pose(0.98, 3, -0.5, -0.2, -0.38, [0.12, -0.3, -0.5], [0, 0, 68, 35, -0.3], [0, 0, 54, 23, -0.45], [1, 9, 0, 0, 0], [1, -11, 0, 0, 0]),
};
// (ROUND 13) the roar's second held attitude (the clock's own beat while it stands: the head a little lower, the tail lashed
// up), and THE WHEEL's attitude: reared on its haunches, the hind paws close together on the place it turns on, the
// forepaws drawn up, the tail out behind for balance
// (the roar as the timetable holds it, roarW and roarB: the hind paws 9 m apart, as the wheel and the gallop have them,
// so that it rears, turns and bounds away from where they stand and no hind paw steps or slides)
POSES.roarW = pose(0.05, 2, 0.5, -0.62, 0.12, [0.9, -0.6, -0.5], [1, 12, 0, 0, 0], [1, 2, 0, 0, 0], [1, -1.5, 0, 0, 0], [1, -10.5, 0, 0, 0]);
POSES.roarB = pose(0.05, 2, 0.4, -0.5, 0.1, [0.5, -0.3, -0.1], [1, 12, 0, 0, 0], [1, 2, 0, 0, 0], [1, -1.5, 0, 0, 0], [1, -10.5, 0, 0, 0]);
// (round 13b: THE ROAR HALF REARED, roarUpW and roarUpB: where the standing figure is TURNED out of its road's line its
// forepaws would stand off its walk: it roars risen on its hind paws, which keep the place, its forepaws clawing the air)
POSES.roarUpW = pose(0.16, 3, 0.4, -0.62, 0.0, [0.9, -0.6, -0.5], [0, 0, 72, 42, 0.2], [0, 0, 60, 30, -0.15], [1, 4.5, -80, 26, -0.5], [1, -4.5, -88, 32, -0.6]);
POSES.roarUpB = pose(0.16, 3, 0.3, -0.5, 0.0, [0.5, -0.3, -0.1], [0, 0, 70, 46, 0.35], [0, 0, 62, 27, -0.05], [1, 4.5, -80, 26, -0.5], [1, -4.5, -88, 32, -0.6]);
// (ROUND 14, T5b: COUCHANT, as it waits at the river: lying along its walk, the belly down, the forelegs laid out before
// it, the hind paws drawn up under the flank, the head held up; couchantB the same with the tail's end and its tuft
// let down: the clock's own beat while it lies. Its hind paws keep the place it stands on: it lies down and rises there.)
POSES.couchantW = pose(-0.12, 40, 0.42, -0.14, 0.05, [0.9, -0.6, -0.5], [1, 40, 77.9, 51.8, 0.2], [1, 32, 76, 45.2, 0.1], [1, 38, -99.5, 46.1, -2.0], [1, 30, -98.6, 42.9, -1.9]);
POSES.couchantB = pose(-0.12, 40, 0.42, -0.14, 0.05, [0.82, -0.42, 0.05], [1, 40, 77.9, 51.8, 0.2], [1, 32, 76, 45.2, 0.1], [1, 38, -99.5, 46.1, -2.0], [1, 30, -98.6, 42.9, -1.9]);
POSES.couchant = POSES.couchantW;
POSES.pivot = pose(0.66, 5, -0.36, -0.3, -0.24, [0.5, 0.5, 0.2], [0, 0, 70, 40, 0.1], [0, 0, 60, 29, -0.2], [1, 4.5, -80, 26, -0.5], [1, -4.5, -88, 32, -0.6]);
// THE LAW OF THE LION'S PLACE (the same on every seed; nothing of the lens, no list of route metres or of u).
// (a) THE STATIONS are places on the crest: the tips of the ridge's own dancetty line, one tooth apart, counted back
//     from the summit tip; the first is the tip the lion's arc position has last reached at the route's own start.
//     The tip where it roars (o.sit, a place the world names) and the summit are among them. Nothing else is a station.
// (b) THE ATTITUDE held at a station is given by what the crest is there (attitudeAt, indexed by station): the tip
//     where it roars: the roar; the tip before it the halt (statant, the head turned down to us); the last RUN_TEETH
//     tips before the summit courant gathered (it takes them at a run, a paw on the green throughout, and the last in
//     its ONE bound); every other tip passant (the walk, before the halt and down from the roar); the summit rampant.
// (c) WHERE THE LION IS: its arc position along the crest = the crest's arc at the place abeam of us (o.abeam(u):
//     the crest at our place's bearing from the hub) + ONE smooth lead, given by the lion's own arc (o.leads: lengths
//     at arcs the world names, eased between them). The lion stands at the tip its arc position has last reached and
//     goes to the next as the arc position covers the span between the two (the share of the span covered is the
//     progress of the walk, the run or the bound). So when it lands is given by where the teeth are and by the lead:
//     by nothing else.
const LEAD_ENTRY = 495;    // the lead where the world names none (the viewer): the brief's first frame, the lion 424 m off and 18 degrees left of the entry axis
const REAR_RUN = 0.45;     // the share of a tooth of its arc position over which it rears, once it has run a tenth of a tooth on
const SALIENT = [0.22, 0.55];   // of that stretch: salient by the first share, held to the second, rampant at its end
// THE BOUND, in shares of the way from the tip left to the tip landed on (the same for every bound and every seed):
// four clean moves of BOUND_MOVE each with three equal holds between them; the figure's place at each held attitude.
const BOUND_MOVE = 0.11, BOUND_STEP = (1 - BOUND_MOVE) / 3;
const BOUND_E = [0, 0.44, 0.6, 0.74, 1];   // gathered on the tip, driving off, full stretch, reaching down, landed
const RUN_TEETH = 3;         // the last teeth before the summit: two it takes at a run, the last in the one bound
const PACES = 4;           // the walk: four paces to a tooth, each a held attitude and one clean move
const mixPose = (a, b, t, out = []) => { for (let i = 0; i < NP; i++) out[i] = a[i] + (b[i] - a[i]) * t; return out; };
const ease = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
export const NCC_LION = { stand: 30, leap: 22 };   // at the summit the figure's origin stands 30 m past the tip, so that its hind paws are on the tip itself; the rear carries it 22 m on
const PACE_AT = ['passantB', 'statantTail', 'passantA'];
const BOUND_AT = [POSES.courantD, POSES.courantS, POSES.courantR];
// nccLionLaw(o): o.summit (arc of the summit tip), o.pitch (a tooth, 110), o.crestY(d), o.abeam(u) (the crest's arc
// abeam of the route's place at progress u), o.leads (the lead by the lion's own arc, below), o.sit (the arc of the
// tip where it roars).
export function nccLionLaw(o) {
  if (o.way) return wayLaw(o);   // (round 13: the world's typed timetable; see THE LION'S OWN WAY below)
  const Ds = o.summit, pitch = o.pitch ?? 110, LD = o.leads;
  // THE LEAD BY THE LION'S OWN ARC (o.leads: [[arc, lead], ...] in the order of the arcs, places of the crest the world
  // names): between two named arcs the lead goes from the one length to the other by one smooth ease; before the first
  // and after the last it keeps theirs. (Without o.leads, the viewer: LEAD_ENTRY throughout.)
  const lead = (a) => {
    if (!LD || !LD.length) return LEAD_ENTRY;
    if (a <= LD[0][0]) return LD[0][1];
    for (let i = 1; i < LD.length; i++) if (a < LD[i][0]) return LD[i - 1][1] + (LD[i][1] - LD[i - 1][1]) * ease((a - LD[i - 1][0]) / (LD[i][0] - LD[i - 1][0]));
    return LD[LD.length - 1][1];
  };
  let LO = LEAD_ENTRY - 1, HI = LEAD_ENTRY + 1;
  if (LD) for (const q of LD) { LO = Math.min(LO, q[1] - 1); HI = Math.max(HI, q[1] + 1); }
  // the arc position for a place abeam: a - lead(a) = abeam (the left side rises with a, so one answer; bisection)
  const arcOf = (dab) => { let lo = dab + LO, hi = dab + HI; for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; if (m - lead(m) < dab) lo = m; else hi = m; } return (lo + hi) / 2; };
  // (o.arc: the world gives the arc position itself, as a law of OUR place on the route: (u) => arc; it never goes back)
  const arcAt = o.arc ? (u) => o.arc(Math.min(1, Math.max(0, u))) : (u) => arcOf(o.abeam(Math.min(1, Math.max(0, u))));
  const K = Math.max(1, Math.ceil((Ds - arcAt(0)) / pitch - 1e-6)), tip = (s) => Ds - (K - s) * pitch;
  // THE TIP WHERE IT ROARS (o.sit: its arc; the world names the place): the station nearest that arc. Without it (the
  // viewer) the lowest tip of the crest, or the third tip of a level crest.
  let sSad = -1, low = Infinity;
  if (o.sit !== undefined) sSad = Math.min(K - 1, Math.max(1, Math.round((o.sit - tip(0)) / pitch)));
  else {
    for (let s = 1; s < K; s++) { const y = o.crestY(tip(s)); if (y < low - 0.5) { low = y; sSad = s; } }
    if (sSad < 0 || low > o.crestY(tip(0)) - 3) sSad = Math.min(2, K - 1);
  }
  // THE ATTITUDE BY STATION: on the tip where it roars the roar; on the tip before it statant, the head turned down to
  // us (the halt); on the last RUN_TEETH tips before the summit gathered (the run, and the bound to the summit); on every
  // other tip it walks (passant).
  // (o.run: [arc, arc], places of the crest the world names: the tips from the first arc up to, not with, the second are
  // left AT A RUN too: where its law of place carries it along the crest several times as fast as we fly, it runs)
  const inRun = (s) => !!o.run && tip(s) > o.run[0] - 1 && tip(s) < o.run[1] - 1;
  // (o.halt: the arc of the tip where it HALTS, a place the world names apart from the roaring tip. Given, the stations'
  // attitudes are: the halt on that tip, the roar on o.sit's, gathered on every other tip from the halt on; and from the
  // halt on every tip is left AT A RUN, the last before the summit in the one bound. Without it, the law as it was.)
  const sHalt = o.halt !== undefined ? Math.min(K - 1, Math.max(0, Math.round((o.halt - tip(0)) / pitch))) : -1;
  const attitudeAt = sHalt >= 0
    ? (s) => (s >= K ? 'land' : s === sSad ? 'roar' : s === sHalt ? 'statantDown' : s > sHalt || s >= K - RUN_TEETH || inRun(s) ? 'courantG' : 'passantA')
    : (s) => (s >= K ? 'land' : s >= K - RUN_TEETH || inRun(s) ? 'courantG' : s === sSad ? 'roar' : s === sSad - 1 ? 'statantDown' : 'passantA');
  // (o.bound === false, round 11: THE LION NEVER LEAVES ITS ROAD: the last station too is left at a run, a paw on the
  // road throughout, and there is no bound)
  const noBound = o.bound === false;
  const bounds = (s) => !noBound && s === K - 1;          // the one station it leaves in a bound: the last tip before the summit
  const runs = (s) => (s >= K - RUN_TEETH && (noBound || s < K - 1)) || inRun(s) || (sHalt >= 0 && s >= sHalt && (noBound || s < K - 1));    // the stations it leaves at a run (courant, a paw on the green throughout)
  // the share of the span to the next tip for which a station's attitude is held (o.sitHold: the roar's, where the world names it)
  const holdAt = (s, at) => (s === sSad && o.sitHold !== undefined ? o.sitHold : HOLD[at]);
  // the progress at which the arc position reaches a given arc (bisection on the smooth law; for the world's cues)
  const uOfArc = (d) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (arcAt(m) < d) lo = m; else hi = m; } return (lo + hi) / 2; };
  // (o.rest: [arc, arc], two arc positions of the lion's own law before its first move: short of the first it SITS
  // (sejant) at its first station; as its arc position covers the stretch to the second it rises to the station's own
  // standing attitude. A law of its arc, as every attitude is.)
  return { rest: o.rest || null, strides: Math.max(1, Math.round(o.strides || 1)), Ds, pitch, K, sSad, tip, lead, arcOf, arcAt, attitudeAt, bounds, runs, holdAt, uOfArc, uSummit: uOfArc(Ds), uReared: uOfArc(Ds + (0.1 + REAR_RUN) * pitch) };
}

// lionPose(law, u, time, out): the figure's pose and its place along the crest, a pure function of the world's
// progress u through the law above (and of the clock only to mark time at the first station and to lash the tail).
// out.p the pose, out.d the arc of the figure's origin, out.s station + share of the span, out.q the rear's share.
// HOLD: the share of the span to the next tip for which a station's attitude is held, by attitude.
const HOLD = { passantA: 0.3, statant: 0.3, statantDown: 0.36, roar: 0.55, sejant: 0.5, courantG: 0.14 };
export function lionPose(law, u, time, out = { p: [], d: 0, s: 0, q: 0 }) {
  out.psi = 0; out.piv = NaN; out.anch = 1;
  if (law.way) return wayPose(law, u, time, out);
  const a = law.arcAt(u), K = law.K, pitch = law.pitch;
  const beat = Math.floor(time / 1.1), bf = time / 1.1 - beat;                  // the clock's own held beats
  const x = (a - law.tip(0)) / pitch;
  if (x >= K) {
    // THE SUMMIT: it lands as on every tip, gathered, all four paws together ON the summit tip; when its arc position
    // has run a tenth of a tooth on it springs (salient) and rears RAMPANT over the next REAR_RUN of a tooth, the hind paws
    // staying on the summit tip (the figure's origin goes on NCC_LION.stand + leap metres as the body comes upright over them)
    // (ROUND 12: THE REAR IS PREPARED. Of that stretch of its arc the first SALIENT[0] is one clean move into SALIENT:
    // gathered on its haunches, the forepaws leaving the ground, the body risen 35 degrees; it HOLDS that attitude to
    // SALIENT[1] of the stretch; over the rest it comes upright, rampant. Three attitudes, two moves, by its arc alone.)
    const over = a - law.Ds, share = (over - 0.1 * pitch) / (REAR_RUN * pitch), m1 = ease(share / SALIENT[0]), m2 = ease((share - SALIENT[1]) / (1 - SALIENT[1])), q = 0.5 * m1 + 0.5 * m2;
    mixPose(POSES.courantG, POSES.courantG, 0, out.p); out.d = law.Ds; out.s = K; out.q = q;
    if (m1 > 0) {
      const lash = mixPose(beat % 2 ? POSES.rampant : POSES.rampantB, beat % 2 ? POSES.rampantB : POSES.rampant, ease(bf / 0.3), _pb);
      mixPose(POSES.courantG, POSES.salient, m1, out.p);
      if (m2 > 0) mixPose(out.p, lash, m2, out.p);
      out.d = law.Ds + (NCC_LION.stand + NCC_LION.leap) * q;
    }
    return out;
  }
  const s = Math.max(0, Math.floor(x)), f = Math.max(0, x - s), at = law.attitudeAt(s);
  // marking time at the first station: by the clock it lifts a forepaw and curls its tail (seen through the previous portal)
  const here = s === 0 ? mixPose(beat % 2 ? POSES.passantA : POSES.curl, beat % 2 ? POSES.curl : POSES.passantA, ease(bf / 0.18), _pa) : POSES[at];
  if (s === 0 && law.rest) {
    // AT REST: it sits until its arc position reaches law.rest[0] and has risen when it reaches law.rest[1]: one move
    const r = 1 - ease((a - law.rest[0]) / Math.max(law.rest[1] - law.rest[0], 1e-6));
    if (r > 0) mixPose(here, mixPose(beat % 2 ? POSES.sejant : POSES.sejantB, beat % 2 ? POSES.sejantB : POSES.sejant, ease(bf / 0.18), _pc), r, here);
  }
  // (the summit is landed on as every tip is: gathered, the forepaws meeting the tip itself in the outline reaching down)
  const there = s + 1 >= K ? POSES.courantG : POSES[law.attitudeAt(s + 1)], d0 = law.tip(s), d1 = law.tip(s + 1);
  const hold = law.holdAt(s, at), w = Math.max(0, (f - hold) / (1 - hold));
  let e;
  if (law.runs(s)) {
    // THE RUN (courant, every paw on the green): from the tip, gathered, it throws its forepaws to the tip ahead and lies
    // LONG between the two tips (courantB, held); then the hind paws come up and it is gathered on the tip ahead. Two clean
    // moves and one held attitude to a tooth. The hind paws keep the tip left until the second move; the forepaws take the
    // tip ahead with the first.
    // (law.strides, round 11: the span between two stations is run in that many such strides, gathered between them,
    // so that the long attitude is no longer than its legs and every paw of it stands on the road)
    const n = law.strides, qn = w * n, c = Math.min(n - 1, Math.floor(qn)), q2 = (qn - c) * 2, j = Math.min(1, Math.floor(q2)), m = ease((q2 - j) / 0.4), span = (d1 - d0) / n;
    const hereC = c === 0 ? here : POSES.courantG, thereC = c === n - 1 ? there : POSES.courantG, ec = (j + m) / 2;
    mixPose(j === 0 ? hereC : POSES.courantB, j === 0 ? POSES.courantB : thereC, m, out.p);
    e = (c + ec) / n;
    for (let k = 0; k < 4; k++) {
      const o = 8 + k * 5 + 1, onNext = thereC[o] + span * (1 - ec), onLeft = hereC[o] - span * ec, onLong = POSES.courantG[o] + span * (1 - ec);
      // (a paw's place along the crest from the figure's origin: with the first move the forepaws go over to the place
      // ahead, set as the gathered attitude sets them; with the second the hind paws come up and every paw takes the
      // place the attitude ahead gives it)
      out.p[o] = k < 2 ? (j === 0 ? onLeft + (onLong - onLeft) * m : onLong + (onNext - onLong) * m) : (j === 0 ? onLeft : onLeft + (onNext - onLeft) * m);
      out.p[o - 1] = 1;
    }
  } else if (!law.bounds(s)) {
    // THE WALK: four paces to the next tip, each one clean move and a held attitude; the last pace sets it in the next tip's own
    const q4 = w * PACES, j = Math.min(PACES - 1, Math.floor(q4)), m = ease((q4 - j) / 0.4);
    mixPose(j === 0 ? here : POSES[PACE_AT[(j - 1) % 3]], j === PACES - 1 ? there : POSES[PACE_AT[j % 3]], m, out.p);
    e = (j + m) / PACES;
  } else {
    // THE BOUND: from the tip it stretches (courant, long and level along the line of the tips), is carried to the
    // next tip in that one attitude, and gathers on it with all four paws
    // A GALLOP MADE OF ATTITUDES, by shares of the span and nothing else (the same for every bound): gathered on the
    // tip (the station's hold); then three held outlines of equal share, each reached by one clean move: DRIVING OFF
    // (the hind paws still on the tip it leaves), FULL STRETCH (carried over the line of the tips), REACHING DOWN (the
    // forepaws set on the tip ahead); then the gathered landing. The figure's place holds with each attitude and is
    // carried on by each move. A paw on the crest stays where the station's attitude has it: the hind paws on the tip
    // left until the stretch, every paw from the stretch on at its own landing place on the tip ahead.
    const q4 = w / BOUND_STEP, j = Math.min(3, Math.floor(q4)), m = ease((q4 - j) * BOUND_STEP / BOUND_MOVE), span = d1 - d0;
    const a0 = j === 0 ? here : BOUND_AT[j - 1], a1 = j === 3 ? there : BOUND_AT[j];
    mixPose(a0, a1, m, out.p);
    e = BOUND_E[j] + (BOUND_E[j + 1] - BOUND_E[j]) * m;
    for (let k = 0; k < 4; k++) { const o = 8 + k * 5 + 1; out.p[o] = j < 2 ? here[o] - span * e : there[o] + span * (1 - e); }
  }
  out.d = d0 + (d1 - d0) * e; out.s = s + f; out.q = 0;
  return out;
}
const _pa = [], _pb = [], _pc = [];

// ---------------------------------------------------------------------------------------------
// ROUND 13: THE LION'S OWN WAY ALONG ITS ROAD (o.way: the world's typed timetable; the same on every seed)
// ---------------------------------------------------------------------------------------------
// The world gives ONE TIMETABLE: keys [route metre of OUR way, the place on the lion's road (the crest's arc where its
// hind paws stand), which way it faces (1 along its road, -1 back along it, toward us as we come), the attitude held],
// and hOf(u), our place on the way in route metres at progress u. Between two keys the lion does one of three things,
// by what the two keys say and by nothing else:
//   IT STANDS (the same place, the same facing): the attitude of the first key goes over to the second's in one move;
//   IT WHEELS (the same place, the facing changed): it rears on its haunches (POSES.pivot), turns about the upright
//     through its hind paws, which keep their place, and comes down facing the other way;
//   IT RUNS (another place): courant, THE BOUNDING GALLOP below, from the one place to the other in whole bounds.
// So it is always standing at a place or running to the next; it never keeps our pace. Its place is a smooth law of
// our own place on the way (no clock in it, no jump of place: dt 0 changes nothing but the clock's own tail-lash).
// THE BOUNDING GALLOP (a great cat's bound in three attitudes, as the stags gallop). One bound, by the share f of its
// length L covered: GATHERED (all four paws together under it) -> DRIVING (the hind paws keep the place they stand on,
// the hind legs straighten behind, the forelegs are drawn up, the body rises) -> STRETCHED (the flight: forelegs
// reaching together, hind legs trailing, long and level, the tail streaming) -> REACHING DOWN (the forepaws set down
// together on their place ahead and keep it, the hind legs come up under the belly) -> GATHERED. A paw that stands
// keeps its place on the road while the body goes on over it (it never slides); the body goes on evenly.
// GAL: where the paws stand under the gathered figure (from its origin, m); how far the body may go on over the
// standing hind paws (hold) and before the standing forepaws (reach): the legs' own lengths; the bound's length wanted.
const GAL = { hG: [-4, -13], fG: [23, 16], hold: 60, reach: 34, xh: -8.5, soft: 0.05, stride: 150, launch: 41.5 };
// the four keyed attitudes (the legs' numbers here are the LIFTED places; which paws stand, and where, is the gallop's own)
const GAL_KEY = [
  pose(0.03, 6, -0.2, -0.1, -0.06, [0.7, 1.5, 0.4], [1, 0, 16, 19, 0], [1, 0, 9, 19, 0], [1, 0, -16, 30, 0], [1, 0, -25, 30, 0]),
  pose(0.2, -2, -0.2, -0.22, 0.04, [0.75, 1.6, 0.45], [0, 0, 48, 42, -1.1], [0, 0, 42, 36, -1.2], [1, 0, -99.5, 46.1, -2.0], [1, 0, -98.6, 42.9, -1.9]),
  pose(0.04, 2, 0.1, -0.3, 0.05, [0.8, 1.7, 0.5], [0, 0, 77.9, 51.8, 0.2], [0, 0, 76, 45.2, 0.1], [0, 0, -99.5, 46.1, -2.0], [0, 0, -98.6, 42.9, -1.9]),
  pose(-0.07, 8, 0.12, -0.26, 0.05, [0.8, 1.75, 0.5], [1, 0, 62, 26, 0.3], [1, 0, 56, 26, 0.3], [0, 0, -33, 37, 0.9], [0, 0, -41, 41, 0.8]),
];
function gallopPose(ph, L, out) {
  const f = ph - Math.floor(ph), f1 = Math.min(0.6, GAL.hold / L), f2 = 1 - Math.min(0.38, GAL.reach / L), sf = GAL.soft;
  const k1 = 0.6 * f1, k2 = 0.5 * (f1 + f2), k3 = f2 + 0.25 * (1 - f2);
  const i = f < k1 ? 0 : f < k2 ? 1 : f < k3 ? 2 : 3, t0 = i === 0 ? 0 : i === 1 ? k1 : i === 2 ? k2 : k3, t1 = i === 0 ? k1 : i === 1 ? k2 : i === 2 ? k3 : 1;
  mixPose(GAL_KEY[i], GAL_KEY[(i + 1) % 4], ease((f - t0) / (t1 - t0)), out);
  for (let k = 0; k < 4; k++) {
    const o = 8 + k * 5, fore = k < 2, g = fore ? GAL.fG[k] : GAL.hG[k - 2];
    let rel, plant;
    if (fore) {
      if (f >= f2 - sf) { rel = g + (1 - f) * L; plant = ease((f - f2 + sf) / sf); }      // set down on its place ahead, and standing there
      else { rel = g - f * L; plant = 1 - ease(f / sf); }                                  // leaving the place it stood on
    } else if (f <= f1 + sf) { rel = g - f * L; plant = 1 - ease((f - f1) / sf); }         // standing on the place it drives from
    else { rel = g + (1 - f) * L; plant = ease((f - 1 + sf) / sf); }                       // coming down on its place ahead
    out[o] = plant; out[o + 1] = rel - (fore ? 37 : -50);
  }
  return out;
}
// the run's share of its length by the share t of its stretch of our way: even speed, eased in and out over RUN_EASE
// of the stretch at either end (so its place and its speed are both continuous with the stands before and after)
const RUN_EASE = 0.22;
const runShare = (t) => {
  t = Math.min(1, Math.max(0, t)); const e = RUN_EASE, r = (x) => e * (x * x * x - x * x * x * x / 2);
  return (t < e ? r(t / e) : t > 1 - e ? 1 - e - r((1 - t) / e) : e / 2 + (t - e)) / (1 - e);
};
// where the hind paws stand under an attitude (the middle of the two, from the figure's origin, m)
const hindX = (p) => -50 + (p[19] + p[24]) / 2;
// one move between two attitudes in which a standing paw that must change its place STEPS (it is lifted and set down)
function stepMix(A, B, m, out) {
  const hA = hindX(A), hB = hindX(B);
  mixPose(A, B, m, out);
  for (let k = 0; k < 4; k++) {
    const o = 8 + k * 5;
    if (A[o] > 0.5 && B[o] > 0.5 && Math.abs(A[o + 1] - B[o + 1] - hA + hB) > 4.5) {   // (its place on the road: against where the hind paws stand)
      const g = LEGS[k], s = Math.sin(Math.PI * m);
      out[o] = 1 - 0.9 * s * s; out[o + 2] = g.w[0] + out[o + 1]; out[o + 3] = g.w[1] + 9 + out[1]; out[o + 4] = 0;
    }
    // (a paw that stands in the one attitude and is lifted in the other keeps its place on the road while it stands)
    else if (A[o] > 0.5 !== B[o] > 0.5) { const S = A[o] > 0.5 ? A : B; out[o + 1] = S[o + 1] - (S === A ? hA : hB) + hindX(out); }
  }
  return out;
}
POSES.gathered = gallopPose(0, GAL.stride, []);
// THE WHEEL, in shares of its stretch of our way: it has reared by the first, has turned by the second, is down at the end
const WHEEL = [0.46, 0.54];
const _ph = [[], []];
// an attitude as held: the roar and the rampant figure lash the tail by the clock's own beat (two held attitudes)
const heldPose = (name, beat, bf, out) => {
  const A = name === 'roar' ? POSES.roarW : name === 'roarUp' ? POSES.roarUpW : name === 'rampant' ? POSES.rampant : name === 'couchant' ? POSES.couchantW : null; if (!A) return POSES[name] || POSES.statant;
  const B = name === 'roar' ? POSES.roarB : name === 'roarUp' ? POSES.roarUpB : name === 'couchant' ? POSES.couchantB : POSES.rampantB;
  return mixPose(beat % 2 ? A : B, beat % 2 ? B : A, ease(bf / 0.3), out);
};
function wayLaw(o) {
  const keys = o.way.keys, hOf = o.way.hOf, segs = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1], s = { h0: a[0], h1: b[0], P0: a[1], P1: b[1], f0: a[2], f1: b[2], aName: a[3], bName: b[3], Afix: null, Bfix: null, toRun: false, r0: (a[4] || 0) * Math.PI / 180, r1: (b[4] || 0) * Math.PI / 180 };
    if (a[1] !== b[1]) {
      // A RUN: from the launch off its haunches (the hind paws on the place it leaves) to the gathered landing (the hind
      // paws on the place it comes to), in whole bounds of the length nearest the gallop's own
      s.kind = 2; s.dA = a[1] + 50; s.dB = b[1] - GAL.xh;
      const total = s.dB - s.dA + GAL.launch; s.n = Math.max(1, Math.round(total / (o.way.stride || GAL.stride))); s.L = total / s.n; s.ph0 = GAL.launch / s.L;
    } else s.kind = a[2] !== b[2] ? 1 : 0;
    // (a key's fifth number: A TURN of the standing figure out of its road's line, degrees about the upright through
    // its hind paws' place, its head toward the far side of its walk: a wheel carries it into the next key's)
    segs.push(s);
  }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]; if (s.kind !== 2) continue;
    const launch = gallopPose(s.ph0, s.L, []);
    if (i > 0) { segs[i - 1].Bfix = launch; segs[i - 1].toRun = true; }
    if (i + 1 < segs.length) segs[i + 1].Afix = POSES.gathered;
  }
  const way = { segs, hOf, last: 0, dip: o.way.dip || null }, last = keys[keys.length - 1], P = { p: [], d: 0, s: 0, q: 0, psi: 0, piv: NaN, anch: 1, at: 0 };
  // the arc of the figure's MIDDLE on its road at progress u (the smooth law of its place: for the looks and the keeps)
  const law = { way, Ds: last[1], pitch: o.pitch ?? 110, K: keys.length, tip: (s) => keys[Math.min(keys.length - 1, Math.max(0, s))][1], rest: null, strides: 1 };
  law.arcAt = (u) => { wayPose(law, u, 0, P); return Number.isNaN(P.piv) ? P.d - 9 : P.piv - (hindX(P.p) + 9) * Math.cos(P.psi); };
  // the progress at which our way reaches route metre h (bisection on the world's own law)
  const uOfH = (h) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (hOf(m) < h) lo = m; else hi = m; } return (lo + hi) / 2; };
  let hSummit = last[0], hReared = last[0];
  for (let i = segs.length - 1; i >= 0; i--) if (segs[i].kind === 2) { hSummit = segs[i].h1; break; }
  for (let i = 0; i < keys.length; i++) if (keys[i][3] === 'rampant') { hReared = keys[i][0]; break; }
  law.uSummit = uOfH(hSummit); law.uReared = uOfH(hReared); law.uOfH = uOfH;
  law.uOfArc = (d) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (law.arcAt(m) < d) lo = m; else hi = m; } return (lo + hi) / 2; };
  law.attitudeAt = (s) => keys[Math.min(keys.length - 1, Math.max(0, s))][3]; law.runs = () => false; law.bounds = () => false;
  return law;
}
function wayPose(law, u, time, out) {
  const W = law.way, segs = W.segs, h = W.hOf(Math.min(1, Math.max(0, u))), beat = Math.floor(time / 1.1), bf = time / 1.1 - beat;
  let i = W.last;
  if (!(h >= segs[i].h0 && h < segs[i].h1)) { i = 0; while (i < segs.length - 1 && h >= segs[i].h1) i++; W.last = i; }
  const s = segs[i], t = Math.min(1, Math.max(0, (h - s.h0) / (s.h1 - s.h0)));
  out.s = i + t;
  if (s.kind === 2) {
    const d = s.dA + (s.dB - s.dA) * runShare(t);
    gallopPose(s.ph0 + (d - s.dA) / s.L, s.L, out.p);
    out.d = d; out.psi = 0; out.piv = NaN; out.anch = 1; out.q = 0;
    out.at = s.P0 + (s.P1 - s.P0) * (d - s.dA) / (s.dB - s.dA);   // (its station on its road: from the place it left to the place it comes to)
    return out;
  }
  const A = s.Afix || heldPose(s.aName, beat, bf, _ph[0]), B = s.Bfix || heldPose(s.bName, beat, bf, _ph[1]);
  let psi = (s.f0 < 0 ? Math.PI : 0) + s.r0, anch = 0;
  if (s.kind === 0) { stepMix(A, B, ease(t), out.p); psi += (s.r1 - s.r0) * ease(t); }
  else {
    if (t < WHEEL[0]) stepMix(A, POSES.pivot, ease(t / WHEEL[0]), out.p);
    else if (t > WHEEL[1]) { const m = ease((t - WHEEL[1]) / (1 - WHEEL[1])); stepMix(POSES.pivot, B, m, out.p); if (s.toRun) anch = m; }
    else mixPose(POSES.pivot, POSES.pivot, 0, out.p);
    psi += ((s.f1 < 0 ? Math.PI : 0) + s.r1 - psi) * ease((t - WHEEL[0]) / (WHEEL[1] - WHEEL[0]));
  }
  // the hind paws keep the place: the figure's origin stands before it by where the attitude has them
  out.d = s.P0 - hindX(out.p); out.psi = psi; out.piv = s.P0; out.anch = anch; out.q = Math.min(1, Math.max(0, out.p[0] / 0.98));
  out.at = s.P0;
  return out;
}

// solveLion(p, x0, crestY, T): places the 19 slabs. x0 is the arc distance of the figure's origin
// along the crest, crestY(d) the crest's height there. T receives, per part of LION_PARTS, four
// numbers [cos, sin, tx, ty]: the part's turn and shift in the figure's plane (x along the crest
// from x0, y absolute height). Planted paws stand on the crest, each turned to the slope under it.
const LEGS = [
  { up: 7, s: [30, 62], e: [26, 38], w: [30, 13], c: [37, 0], sign: -1, reach: 47.6 },
  { up: 10, s: [30, 62], e: [26, 38], w: [30, 13], c: [37, 0], sign: -1, reach: 47.6 },
  { up: 13, s: [-52, 58], e: [-40, 37], w: [-62, 24], c: [-50, 0], sign: 1, reach: 33.5 },
  { up: 16, s: [-52, 58], e: [-40, 37], w: [-62, 24], c: [-50, 0], sign: 1, reach: 33.5 },
];
for (const g of LEGS) { g.l1 = Math.hypot(g.e[0] - g.s[0], g.e[1] - g.s[1]); g.l2 = Math.hypot(g.w[0] - g.e[0], g.w[1] - g.e[1]); g.a1 = Math.atan2(g.e[1] - g.s[1], g.e[0] - g.s[0]); g.a2 = Math.atan2(g.w[1] - g.e[1], g.w[0] - g.e[0]); }
const setT = (T, i, ang, px, py, wx, wy) => { const c = Math.cos(ang), s = Math.sin(ang); T[i * 4] = c; T[i * 4 + 1] = s; T[i * 4 + 2] = wx - (c * px - s * py); T[i * 4 + 3] = wy - (s * px + c * py); };
const _foot = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
// a point of part i's rest drawing, carried by its joint (no arrays are made here: this runs every frame)
const tpx = (T, i, x, y) => T[i * 4] * x - T[i * 4 + 1] * y + T[i * 4 + 2], tpy = (T, i, x, y) => T[i * 4 + 1] * x + T[i * 4] * y + T[i * 4 + 3];
const chain = (T, i, parent, ang) => { const q = LION_PARTS[i].pivot; setT(T, i, ang, q[0], q[1], tpx(T, parent, q[0], q[1]), tpy(T, parent, q[0], q[1])); return ang; };
// THE KEEL of the stretched figure, in the torso's rest drawing: the trailing hind toes, the belly, the reaching
// fore toes. Stretched, the figure is set so that each of the three rides at least SKIM metres over the line of the tips.
const KEEL = [[-131, 25], [-14, 40], [103, 36]], SKIM = 5, BACK_MIN = 0.1;
// tipY(d): the line through the crest's tips (optional; without it the stretched figure rides the crest itself)
export function solveLion(p, x0, crestY, T, tipY) {
  // 1. where each planted paw would stand: contact point, slope, wrist
  let foreY = Infinity, hindY = Infinity, foreW = 0, hindW = 0, hindS = 0, hindN = 0;
  for (let k = 0; k < 4; k++) {
    const g = LEGS[k], o = 8 + k * 5, xc = g.c[0] + p[o + 1];
    const ya = crestY(x0 + xc - 8), yb = crestY(x0 + xc + 8), ym = Math.max(crestY(x0 + xc), (ya + yb) / 2);
    const sl = Math.max(-0.3, Math.min(0.3, 0.6 * Math.atan2(yb - ya, 16)));
    const cs = Math.cos(sl), sn = Math.sin(sl), rx = g.w[0] - g.c[0], ry = g.w[1] - g.c[1];
    _foot[k * 3] = xc + cs * rx - sn * ry; _foot[k * 3 + 1] = ym + sn * rx + cs * ry; _foot[k * 3 + 2] = sl;
    const pl = Math.min(1, Math.max(0, p[o]));
    if (k < 2) { foreW = Math.max(foreW, pl); if (pl > 0.5) foreY = Math.min(foreY, _foot[k * 3 + 1]); }
    else { hindW = Math.max(hindW, pl); if (pl > 0.5) { hindY = Math.min(hindY, _foot[k * 3 + 1]); hindS += _foot[k * 3 + 1]; hindN++; } }
  }
  if (hindN) hindY = Math.min(hindY + 12, hindS / hindN + 1.5);
  // 2. the body: hips over the hind paws, shoulders over the fore paws, then the pose's rear and crouch
  // (a pair in the air, as in the spring at the summit: the body rides over the crest under it)
  if (hindY === Infinity) hindY = Math.max(crestY(x0 - 50), crestY(x0 - 20) - 4) + 24; if (foreY === Infinity) foreY = Math.max(crestY(x0 + 37), crestY(x0 + 8) - 4) + 13;
  let hipY = hindY + 33.5 - p[1];
  // THE BACK IS NEVER NOSE-DOWN: where the forepaws stand lower than the hind paws would carry the back level, the hips
  // come down (the hind legs fold under) until the back rises BACK_MIN toward the shoulders. (Seen from the way, from
  // below and aslant, a level back on the crest reads as falling away; one that rises a little reads as level.)
  let raw = Math.atan2(foreY + 47.6 - 4 - hipY, 82);
  if (raw < BACK_MIN && foreW > 0.5 && hindW > 0.5) { hipY += (foreY + 43.6 - 82 * Math.tan(BACK_MIN) - hipY) * Math.min(foreW, hindW); raw = Math.atan2(foreY + 43.6 - hipY, 82); }
  let pitch = Math.max(-0.3, Math.min(0.3, raw)) * (1 - Math.min(1, Math.abs(p[0]) * 3));
  // an attitude of the bound (p[29]): the body's angle is the slope of the line of the tips under it (plus the pose's
  // rear), and the body hangs from the paws that are on the crest: over the hind paws (as any standing attitude), or
  // with its shoulders 44 m over the fore wrists; with no paw down it rides over the crest as before
  const bd = Math.min(1, 2 * (p[29] || 0));
  if (bd > 0) {
    const ty = tipY || crestY, sl = Math.atan2(ty(x0 + 1) - ty(x0 - 1), 2), thN = sl + p[0];
    const hLow = Math.min(_foot[7], _foot[10]), hAll = Math.min(hLow + 12, (_foot[7] + _foot[10]) / 2 + 1.5), fAll = Math.min(_foot[1], _foot[4]);
    const fromHind = hAll + 33.5 - p[1], fromFore = fAll + 44 - (82 * Math.sin(thN) + 4 * Math.cos(thN)) - p[1];
    const hipN = hindW * fromHind + (1 - hindW) * (foreW * fromFore + (1 - foreW) * hipY);
    hipY += (hipN - hipY) * bd; pitch += (sl - pitch) * bd;
  }
  // the stretched attitude (p[28]): the whole figure is one rigid outline carried along the line of the tips,
  // long and level; by the half-way of the move into it the paws have left the crest and it rides that line alone
  const sk = Math.min(1, 2 * (p[28] || 0));
  if (sk > 0) {
    const ty = tipY || crestY, pS = Math.atan2(ty(x0 + KEEL[2][0]) - ty(x0 + KEEL[0][0]), KEEL[2][0] - KEEL[0][0]), cs = Math.cos(pS), sn = Math.sin(pS);
    let hS = -Infinity;
    for (let k = 0; k < 3; k++) { const kx = KEEL[k][0] + 52, ky = KEEL[k][1] - 58; hS = Math.max(hS, ty(x0 - 52 + cs * kx - sn * ky) + SKIM - sn * kx - cs * ky); }
    hipY += (hS - p[1] - hipY) * sk; pitch += (pS - pitch) * sk;
  }
  const th = pitch + p[0];
  setT(T, 0, th, -52, 58, -52, hipY);
  // 3. head, jaw, mane, tail: plain joint turns down the chain
  const aH = chain(T, 5, 0, th + p[2]); chain(T, 4, 5, aH + p[3]); chain(T, 6, 0, th + p[4]);
  const a1 = chain(T, 1, 0, th + p[5]), a2 = chain(T, 2, 1, a1 + p[6]); chain(T, 3, 2, a2 + p[7]);
  // 4. legs: two bones from the shoulder or hip to the wrist or hock, the paw turned to its ground
  for (let k = 0; k < 4; k++) {
    const g = LEGS[k], o = 8 + k * 5, pl = Math.min(1, Math.max(0, p[o]));
    const Sx = tpx(T, 0, g.s[0], g.s[1]), Sy = tpy(T, 0, g.s[0], g.s[1]), lx = p[o + 2] || g.w[0], ly = p[o + 3] || g.w[1];
    const Fx = tpx(T, 0, lx, ly), Fy = tpy(T, 0, lx, ly);
    let wx = Fx + (_foot[k * 3] - Fx) * pl, wy = Fy + (_foot[k * 3 + 1] - Fy) * pl;
    const pa = (th + p[o + 4]) * (1 - pl) + _foot[k * 3 + 2] * pl;
    let dx = wx - Sx, dy = wy - Sy, d = Math.hypot(dx, dy) || 1e-3; dx /= d; dy /= d;
    const dd = Math.min(g.l1 + g.l2 - 0.05, Math.max(Math.abs(g.l1 - g.l2) + 1, d));
    const a = (g.l1 * g.l1 - g.l2 * g.l2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(g.l1 * g.l1 - a * a, 0)) * g.sign;
    const ex = Sx + dx * a - dy * hh, ey = Sy + dy * a + dx * hh;
    wx = Sx + dx * dd; wy = Sy + dy * dd;
    setT(T, g.up, Math.atan2(ey - Sy, ex - Sx) - g.a1, g.s[0], g.s[1], Sx, Sy);
    setT(T, g.up + 1, Math.atan2(wy - ey, wx - ex) - g.a2, g.e[0], g.e[1], ex, ey);
    setT(T, g.up + 2, pa, g.w[0], g.w[1], wx, wy);
  }
  // 5. tongue, eye and claws ride their slabs
  for (let i = 19; i < LION_PARTS.length; i++) { const j = LION_PARTS[i].on * 4; T[i * 4] = T[j]; T[i * 4 + 1] = T[j + 1]; T[i * 4 + 2] = T[j + 2]; T[i * 4 + 3] = T[j + 3]; }
  return T;
}
export const nccLionParts = LION_PARTS, nccPoses = POSES;

// THE DANCETTY CREST the lion is drawn to walk: nccCrest(o) returns crestY(d), the crest's height at
// arc distance d (metres) along the ridge. Teeth o.pitch apart (110) and o.depth deep (18), counted
// back from the summit tooth's tip at d = o.summit (738: at the summit the lion's origin stands 30 m beyond it,
// see NCC_LION); tips rise from o.low (60) at d 0 to o.high (90) at the summit; beyond the tip the
// far slope of the summit tooth runs on down (the ridge's end).
export function nccCrest(o = {}) {
  const Ds = o.summit ?? 738, pitch = o.pitch ?? 110, depth = o.depth ?? 18, low = o.low ?? 60, high = o.high ?? 90;
  return (d) => {
    if (d > Ds) { const r = d - Ds; return r < 70 ? high - r * (2 * depth / pitch) : Math.max(0, high - 70 * (2 * depth / pitch) - (r - 70) * 1.15); }
    const k = (Ds - d) / pitch, f = k - Math.floor(k), tip = Math.max(low, high - (Ds - d) * (high - low) / Math.max(Ds, 1));
    return tip - depth * (1 - Math.abs(2 * f - 1));
  };
}

// ---------------------------------------------------------------------------------------------
// THE HERO
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const own = !opts.style, style = opts.style || makeStyle(ctx, opts), rng = ctx.rng;
  if (own && !opts.sun) style.setSun(-0.2, 0.7, 0.68);   // viewer only: a sun that puts the pale core on the upper part of each slab
  const object = new THREE.Group(); object.name = 'ncc-hero';
  const Ds = opts.summit ?? 738, PITCH = opts.pitch ?? 110;
  const toothDepth = opts.toothDepth ?? 18;
  const crestY = opts.crestY || nccCrest({ summit: Ds, depth: toothDepth });
  const crestXZ = opts.crestXZ || ((d, out) => { out[0] = Ds - d; out[1] = 0; return out; });
  // THE FOLD (a world may give both): floorY(d), the ground the planted paws stand on where it is not the crest's own
  // line (the floor of the fold behind the crest's flat, a wall-walk behind its battlements); back(d), how far behind
  // the crest's plan line (away from the drawn flank's side) the figure's plane stands when its origin is at arc d.
  // The line of the tips (tipY) is the crest's own throughout: the stretched figure of the bound rides over the tips.
  const floorY = opts.floorY || crestY, backOf = opts.back || null;
  const jitter = rng.fork ? rng.fork('lion') : rng;
  const side = opts.side === -1 ? -1 : 1;

  // ---- the lion: three draw calls (gold, gules, keyline), every slab a joint of one uniform table
  // (the table's last entry is the head's turn, always nought: see the shader's remark)
  const J = LION_PARTS.map(() => new THREE.Vector4(1, 0, 0, 0)), joints = { value: J }, NJ = LION_PARTS.length;
  J.push(new THREE.Vector4(1, 0, 0, 0));
  const ofHead = (q) => q.name === 'head' || q.name === 'jaw' || q.on === 4 || q.on === 5;
  const gold = [], red = [], key = [], black = [], white = [];
  for (let i = 0; i < LION_PARTS.length; i++) {
    const part = LION_PARTS[i];
    let spec = part.spec;
    if (part.name === 'mane' || part.name === 'tuft') spec = spec.map((q) => (q[2] ? [q[0] + jitter.range(-1.3, 1.3), q[1] + jitter.range(-1.3, 1.3), 1] : q));   // the hand: no two manes cut alike
    const g = nccSlab(nccOutline(spec, 4), { z: part.lay * 2 + part.sub * 0.3, part: i + (ofHead(part) ? 0.25 : 0), thickness: part.kind === 'gules' ? 1.1 : 1.5, keyline: part.key === 0 ? 0 : (part.key || (part.kind === 'or' ? 1.2 : 0.9)) });
    if (part.kind === 'or') gold.push(g.geometry);
    else if (part.kind === 'gules') red.push(g.geometry);
    else if (part.kind === 'argent') white.push(g.geometry);
    else if (part.kind === 'sable') black.push(g.geometry);
    else { g.geometry.deleteAttribute('aDome'); g.geometry.deleteAttribute('aLeaf'); g.geometry.setAttribute('aOut', new THREE.Float32BufferAttribute(new Float32Array(g.geometry.attributes.position.count * 2), 2)); key.push(g.geometry); }
    if (g.keyGeometry) key.push(g.keyGeometry);
    if (i % 6 === 5) await ctx.yield();
  }
  const lion = new THREE.Group(); lion.name = 'ncc-lion'; lion.matrixAutoUpdate = false;
  const mk = (geos, mat, name) => { const m = new THREE.Mesh(mergeGeometries(geos, false), mat); for (const g of geos) g.dispose(); m.frustumCulled = false; m.name = name; lion.add(m); return m; };
  mk(gold, style.metal('or', { joints, clean: true }), 'lion-or');
  mk(red, style.colour('gules', { joints }), 'lion-gules');
  mk(black, style.colour('sable', { joints }), 'lion-sable');     // the eye and the drawn lines: slabs proud of the gold, drawn as a tincture (no keyline's set-back)
  mk(white, style.metal('argent', { joints }), 'lion-argent');    // the fangs
  mk(key, style.keyline({ joints }), 'lion-keyline');
  object.add(lion);
  await ctx.yield();

  // ---- a short run of its own ridge (viewer, or a world that wants it): three flats, vert edged argent
  const crestPts = [];
  const flat = (cy, dA, dB, z, thick, band, verts, argents) => {
    const ds = [dA]; for (let d = Math.ceil(dA / 5) * 5; d < dB; d += 5) ds.push(d); ds.push(dB);
    const top = ds.map((d) => [Ds - d, Math.max(cy(d), 0.5)]), under = top.map((q) => [q[0], Math.max(q[1] - band, 0.2)]);
    // keep only the corners of the zigzag (collinear points go)
    const keep = (a) => a.filter((q, i) => i === 0 || i === a.length - 1 || Math.abs((a[i + 1][1] - q[1]) * (q[0] - a[i - 1][0]) - (q[1] - a[i - 1][1]) * (a[i + 1][0] - q[0])) > 1e-3);
    const t = keep(top), b = keep(under);
    verts.push(nccSlab([...b, [b[b.length - 1][0], 0], [b[0][0], 0]], { z, thickness: thick, keyline: 0, rim: 0.5 }).geometry);
    argents.push(nccSlab([...t, ...b.slice().reverse()], { z, thickness: thick, keyline: 0, rim: 0.6 }).geometry);
    return t;
  };
  if (opts.ridge !== false && !opts.crestXZ) {
    const verts = [], argents = [], ph = rng.range(20, 60), ph2 = rng.range(60, 100);
    for (const q of flat(crestY, Ds - 300, Ds + 128, 0, 5, 5, verts, argents)) crestPts.push([q[0], q[1], 0]);
    await ctx.yield();
    const c2 = nccCrest({ summit: Ds - ph, depth: toothDepth * 0.8, low: 44, high: 60 }), c3 = nccCrest({ summit: Ds - ph2 + 150, depth: toothDepth * 0.65, low: 22, high: 34 });
    flat(c2, Ds - 300, Ds - ph + 105, 16, 3, 4, verts, argents);
    flat(c3, Ds - 300, Ds - ph2 + 150 + 85, 32, 3, 3.2, verts, argents);
    const rv = new THREE.Mesh(mergeGeometries(verts, false), style.colour('vert')); rv.name = 'ridge-vert';
    const ra = new THREE.Mesh(mergeGeometries(argents, false), style.metal('argent')); ra.name = 'ridge-argent';
    for (const g of verts) g.dispose(); for (const g of argents) g.dispose();
    object.add(rv, ra);
    await ctx.yield();
  }

  // ---- progress: the lion's place and pose are pure functions of u through the law (and of the clock for
  // marking time and for the tail). No world: the place abeam runs evenly up the default crest.
  const law = nccLionLaw({
    summit: Ds, pitch: PITCH, crestY, leads: opts.leads, sit: opts.sit, arc: opts.arc, run: opts.run, sitHold: opts.sitHold, rest: opts.rest, halt: opts.halt, bound: opts.bound, strides: opts.strides, way: opts.way,
    abeam: opts.abeam || ((u) => Ds - 3 * PITCH - 495 + u * (4.3 * PITCH + 115)),
  });
  // the line through the crest's tips (the stretched figure is carried along it)
  const tipY = (d) => { if (d >= Ds) return crestY(Ds); const k = (Ds - d) / PITCH, k0 = Math.floor(k), f = k - k0; return crestY(Ds - k0 * PITCH) * (1 - f) + crestY(Ds - (k0 + 1) * PITCH) * f; };
  let progress = -1;
  const line = opts.line || null, _eye = new THREE.Vector3();
  const P = { p: [], d: 0, s: 0, q: 0, psi: 0, piv: NaN, anch: 1, at: 0 }, T = new Array(LION_PARTS.length * 4).fill(0), _a = [0, 0], _b = [0, 0];
  // (ROUND 13b) THE LEVEL OF ITS ROAD: where the world's road has a LOW WAY (law.way.dip: metres under the walk, by the
  // figure's station on its road), the whole figure stands so much lower, as drawn: nothing of it is switched off
  const dipOf = (Q) => (law.way && law.way.dip ? law.way.dip(Q.at) : 0);
  const viewerU = (time) => { const t = ((time % 40) + 40) % 40; return Math.min(0.45 + t / 42, 0.98); };   // no world: run the last teeth and rear
  // (ROUND 13) THE FIGURE'S FRAME. As built, the figure's origin stands on the crest's plan line at its arc d, its plane
  // along the crest there. Where it STANDS or WHEELS (the timetable gives the place its hind paws keep, P.piv, and its
  // turn about the upright through that place, P.psi: 0 along its road, pi back along it) the plane goes through that
  // place: its heading is the crest's own at the turned figure's middle, turned by psi toward the drawn flank's side;
  // P.anch carries the one into the other as it comes down into a run. THE DRAWN FLANK IS THE ONE THE WAY IS ON: the
  // lion is drawn on both its flanks (mane, near legs, eye and claws lie toward one side of its plane), and that side
  // is the one on which THE FLOWN LINE'S OWN POINT at this progress lies (opts.line(u): the path as built, a law of
  // the place and the route; the camera is not read and not passed). The two change over where the line's point is
  // in the plane itself, where nothing of either flank is seen from the line. With no line (the viewer): `side`'s.
  // F: the origin's place (ox, oz), the heading (hx, hz), the flank's sign (the normal is sg * (up x heading)).
  const F = { ox: 0, oz: 0, hx: 1, hz: 0, sg: side }, _mir = [NaN];
  const mirFloor = (sv) => floorY(2 * _mir[0] - sv);
  const tangent = (d, o) => { crestXZ(d - 1, _a); crestXZ(d + 1, _b); let tx = _b[0] - _a[0], tz = _b[1] - _a[1]; const tl = Math.hypot(tx, tz) || 1; o[0] = tx / tl; o[1] = tz / tl; return o; };
  const _t = [0, 0], _c = [0, 0];
  function frame(Q, eye) {   // (eye: the flown line's own point at this progress, or null)
    const d = Q.d, turned = !Number.isNaN(Q.piv) && Q.anch < 1;
    if (!turned) {
      tangent(d, _t); crestXZ(d, _c); const bk = backOf ? backOf(d) : 0;   // (the fold: the whole figure stands so far behind the crest's plan line, in true depth)
      F.hx = _t[0]; F.hz = _t[1]; F.ox = _c[0] - side * _t[1] * bk; F.oz = _c[1] + side * _t[0] * bk;
    } else {
      const xp = Q.piv - d, cs = Math.cos(Q.psi), sn = Math.sin(Q.psi), aArc = Q.piv + (d - Q.piv) * Q.anch, xa = xp * (1 - Q.anch);
      tangent(Q.piv - xp * cs, _t);
      F.hx = cs * _t[0] + sn * side * _t[1]; F.hz = cs * _t[1] - sn * side * _t[0];
      tangent(aArc, _t); crestXZ(aArc, _c); const bk = backOf ? backOf(aArc) : 0;
      F.ox = _c[0] - side * _t[1] * bk - xa * F.hx; F.oz = _c[1] + side * _t[0] * bk - xa * F.hz;
    }
    F.sg = eye ? ((eye.x - F.ox) * F.hz - (eye.z - F.oz) * F.hx >= 0 ? 1 : -1) : side * (Math.cos(Q.psi || 0) >= 0 ? 1 : -1);
    return F;
  }
  const solveP = (Q) => { _mir[0] = Q.piv; return solveLion(Q.p, Q.d, Q.psi > Math.PI / 2 ? mirFloor : floorY, T, tipY); };
  function place(u, time) {
    lionPose(law, u, time, P);
    const d = P.d;
    solveP(P);
    for (let i = 0; i < NJ; i++) J[i].set(T[i * 4], T[i * 4 + 1], T[i * 4 + 2], T[i * 4 + 3]);
    // (the head's turn about the upright through the neck, the torso's own point [50, 86] as the torso stands: nought)
    J[NJ].set(1, 0, tpx(T, 0, 50, 86), 0);
    frame(P, line ? line(u, _eye) : null);
    lion.matrix.set(F.hx, 0, F.sg * F.hz, F.ox, 0, 1, 0, dipOf(P), F.hz, 0, -F.sg * F.hx, F.oz, 0, 0, 0, 1);   // columns: heading, up, the drawn flank's normal: sg * (up x heading)
    lion.matrixWorldNeedsUpdate = true;
    return d;
  }
  place(0.6, 0);
  const hero = {
    object, radius: 100, height: 70, center: new THREE.Vector3(-8, 150, 0), ground: true, groundY: 0, style,
    anchors: {
      crest: crestPts,                               // the default ridge's crest line, corner by corner (local)
      summit: [crestXZ(Ds, [0, 0])[0], crestY(Ds), crestXZ(Ds, [0, 0])[1]],   // the summit tooth's tip, where the hind paws stand at the reveal
      viewFrom: [0, 0, side],                           // the side the figure is drawn for (its flank's normal on the default run)
      tips: Array.from({ length: law.K + 1 }, (_, k) => law.tip(k)),   // the stations: arc distances of the tips the lion stands on, the last the summit
    },
    // setProgress(u): the world's progress 0..1. Until it is first called the lion walks by the clock (viewer).
    setProgress(u) { progress = Math.max(0, u); },
    // lionCenter(u, out): the middle of the figure in local space at progress u (for a point of interest)
    lionCenter(u, out = new THREE.Vector3()) {
      lionPose(law, u, 0, P); if (law.way) { frame(P, null); return out.set(F.ox - 9 * F.hx, floorY(P.d) + 58 + 22 * P.q + dipOf(P), F.oz - 9 * F.hz); }
      crestXZ(P.d, _a);
      return out.set(_a[0], tipY(P.d) + 58 + 22 * P.q, _a[1]);
    },
    // lionAbeam(u, out): the place on the crest of the lion's ARC POSITION at progress u: the smooth law itself, not the
    // figure's held places (the figure goes by attitudes and clean moves; a gaze that follows this glides, and the
    // lion is seen to move against the picture). Past the summit it comes to rest where the reared figure stands.
    // (back: the same place for an arc position so many metres behind: the figure holds its tips and trails the law)
    lionAbeam(u, out = new THREE.Vector3(), back = 0) {
      if (law.way) {
        // (round 13, the timetable: the arc of the figure's MIDDLE, a smooth law of our place; the height its floor's there)
        lionPose(law, u, 0, P);
        const a = (Number.isNaN(P.piv) ? P.d - 9 : P.piv - (hindX(P.p) + 9) * Math.cos(P.psi)) - back, q = P.q; crestXZ(a, _a);
        return out.set(_a[0], floorY(a) + 58 + 22 * q + dipOf(P), _a[1]);
      }
      const a = law.arcAt(u) - back, over = Math.max(0, a - Ds), reach = NCC_LION.stand + NCC_LION.leap;
      const d = Math.min(a, Ds) + reach * Math.tanh(over / reach), q = ease((over - 0.1 * PITCH) / (REAR_RUN * PITCH));
      crestXZ(d, _a);
      return out.set(_a[0], tipY(d) + 58 + 22 * q, _a[1]);
    },
    // (ROUND 13) THE FIGURE AS IT STANDS AT PROGRESS u, for the world's looks, keeps and checks (no eye in it):
    // lionPoint(u, x, y, out): the place in the world of a point of the figure's own plane, x m along it from its
    //   origin (as it faces), y the height; lionPart(u, i, x, y, out): of a point of part i's rest drawing (the head is
    //   part 5, the tail's tuft part 3), as its joint carries it; lionEnds(u, a, b): the two ends of the figure's
    //   length (its tail's reach and its muzzle), at the height of its top; it returns the height of its back.
    lionPoint(u, x, y, out = new THREE.Vector3(), time = 0) { lionPose(law, u, time, P); frame(P, null); return out.set(F.ox + x * F.hx, y, F.oz + x * F.hz); },
    lionPart(u, i, x, y, out = new THREE.Vector3(), time = 0) {
      lionPose(law, u, time, P); solveP(P); frame(P, null);
      const fx = tpx(T, i, x, y), fy = tpy(T, i, x, y) + dipOf(P);
      return out.set(F.ox + fx * F.hx, fy, F.oz + fx * F.hz);
    },
    lionEnds(u, a, b, time = 0) {
      lionPose(law, u, time, P); solveP(P); frame(P, null);
      const x0 = Math.min(tpx(T, 3, -45, 120), tpx(T, 1, -100, 95), tpx(T, 15, -62, 10)) - 6, x1 = Math.max(tpx(T, 5, 88, 92), tpx(T, 9, 52, 4)) + 6;
      const dy = dipOf(P), top = Math.max(tpy(T, 5, 56, 111), tpy(T, 3, -45, 128), tpy(T, 2, -75, 128), tpy(T, 6, 46, 107)) + dy;   // (their height: the figure's top, ear, mane or tail)
      a.set(F.ox + x0 * F.hx, top, F.oz + x0 * F.hz); b.set(F.ox + x1 * F.hx, top, F.oz + x1 * F.hz);
      return tpy(T, 0, -10, 70) + dy;   // (the height of its back)
    },
    // the law itself (stations, lead, the progress at which the summit is reached and the rear is done) and, for the
    // world's checks, the figure as placed at progress u: the joint table T ([cos, sin, tx, ty] per part of nccLionParts,
    // x along the crest from the returned arc distance, y absolute)
    // (round 13: and its frame: the origin's place ox, oz and the heading hx, hz of the figure's plane in the world:
    // a point x m along the figure from its origin (the table's own x) stands at [ox + x hx, y, oz + x hz])
    law,
    solveAt(u, time = 0) { lionPose(law, u, time, P); solveP(P); frame(P, null); return { d: P.d, s: P.s, q: P.q, T, p: P.p, back: backOf ? backOf(P.d) : 0, psi: P.psi, piv: P.piv, ox: F.ox, oz: F.oz, hx: F.hx, hz: F.hz, at: P.at, dy: dipOf(P) }; },
    // (the camera goes to the kit's own style alone, and only where this part owns the style: the viewer)
    update(dt, time, camera) {
      if (own) style.update(dt, time, camera);
      place(progress < 0 ? viewerU(time) : progress, time);
    },
    dispose() {},
  };
  return hero;
}
