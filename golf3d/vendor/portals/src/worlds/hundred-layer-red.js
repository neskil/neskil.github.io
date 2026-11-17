// THE HUNDRED-LAYER RED. A world with no air in it, cut from one block of layered lacquer: colour is only how deep
// the knife went (vermilion land, green water under it, buff vault under that). It carves itself ahead of the
// camera and heals behind under a slow red rain, round a peony 180 m across with the portal down its well.
//
// Layout (world metres; the uncut top of the block is y 0, depth of cut d = -y, water at y -47):
//   a gorge 60 m wide along +Z from z -560 to the basin; a round basin 420 m across with the peony at the origin;
//   a tongue of uncut block with a terrace, a pavilion and a three-arch bridge to the flower's leaf collar;
//   the vault (ring wall 1,300 m out, 480 m tall, shallow lid) worked in cloud diaper with red cloud scrolls.
//   THE TRAY round the flower (set down after the path, every piece clear of it by one rule; rooted in the water and coloured
//   by depth like the rest): nine lesser blooms, none over 18 m across (a tenth of the peony), each the peony's own upper
//   tiers on a green stem in a collar of leaves; lidded boxes 6 to 10 m across and 9 to 13 m tall (green body with a foot
//   ring, two rows of the fret between two beads and a plain shoulder; red lid with a rim, a stepped dome and a knob);
//   leaf islands; and a low causeway of nine arches from a leaf island in the gorge's mouth to the terrace.
//   Nine parasol figures in all: four on the bridge, two on the pavilion's terrace, three on the causeway. The basin
//   wall carries one great band: a running vine standing proud of a ground cut back to the buff; on the far wall (the
//   sector behind the flower as the gorge sees it) the upper face carries a second vine, in relief on the wall's own red.
// Flight (laid out in the path block from straights and arcs; its length and the u of every place fall where the
// geometry puts them): it enters the gorge with the flower's near lips 300 m ahead (buff in the fret cuts of both
// walls, the vine being cut on the port wall ahead, the flower alone in the gorge's mouth with its crown on the buff of
// the vault), out over the water beside the causeway with the flower to port, close by the pavilion to starboard and
// across the end of the bridge above its deck (parasol figures below);
// THE FLANK: a line drawn from the petals themselves, 12.2 m outside the outline of the outer petals with the crests of
// that outline joined over the notches between petals, 16 m over the water (12 to 14 m off the lips that reach
// furthest, more abeam of a notch), the eye ahead along it with the flank to port; the turn in on a circle as wide as
// the flank and the chord allow, climbing the flower's own slope clear of every lip, to the chord UNDER the canopy
// (one tier-six petal that reaches out level: the lens passes three and a half metres inside its lip and six metres
// under it, its ruled underside overhead, its lip against the lid); then ONE SPIRAL to port: down the flower's slope
// and out low over the water on a wide arc (the tray, the causeway, the bridge and the pavilion pass while the eye
// comes round to the flower), a tighter arc to its furthest place from the heart, an arc ABOUT the heart at that
// distance, 16.5 m over the water, while the eye comes onto the flower; then the climb, up and over the tongue of uncut
// block the pavilion stands on (12 m over its top) and on up the spiral (the whole flower ringed by its tray), and a
// helix in from about 100 m up and down the well. From the canopy until the climb must begin the lens is never further
// than 18 m from the water, the tray or the petals.
// The gaze is authored as one moving point of interest (see THE GAZE by the contract): it rests on the line of flight
// and is turned from it by rules written in metres from things of the world (the flower's lips, the pavilion, the
// canopy's edge), with no table and no knot of the flight's own u; it is held to 0.7 degrees of turn for each metre
// flown from both ends, so the eye leads a fast-passing sight as much as it trails it. The poi is given once, at
// weight 1, for the whole flight.
// The near flock is forty curls 2.6 to 4.6 m long, dealt at random, that wheel as one, 10 to 20 m from the lens, at one
// station of the route for the whole flight (metres flown ahead, to starboard of the line of flight, up), lifted only
// over what is carved under it, and gone by the metres still to fly to the canopy's edge. The flower's own flock of
// shavings flies the whole flight too.
// Moments are found on the path (uGorge, uPav, uBridge, uTurnIn, uSlot, uTurn, uIn, uMouth) and everything keyed to the
// flight's u uses them: the pace, the flower's clock, the key's swing and the rare event. The key is a direction only: astern and a
// little to starboard in the gorge (port wall lit, starboard wall in shade), swinging round abeam, to the west, past the
// pavilion and staying there, so the flank sees the flower lit from behind the lens and then raked, and the spiral
// sees it raked and then lit again.
// Shade lands on the brief's values (#6E1511 on red, #27432F on green, #9A7A4A on buff) by a toe under the tone scale
// (TOE; see shadeToe in the part), one constant for the whole flight.
// By seed (ctx.rng fork 'coats'): the stack (three-colour; marbled red and black coats; a black cap over the red),
// the key (18, 10 or 32 degrees; ctx.vary.hour dawn/day/golden picks one, night picks the black cap: a near-black skin
// nine metres deep with vermilion in every fret cut) and the weather
// (steady rain; heavy rain that heals within 60 m; dry with three times the shavings). Rare (ctx.vary.rare): from
// the pavilion on, one groove six metres wide crosses the whole vault cutting a new cloud band, and its shavings drift
// down as a slow flock of hundreds (bridge to canopy). No lights, no fog, no blending: all opaque.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, STACK, CURL_FRAG, PETAL_GRID } from '../parts/hundred-layer-red.js';

const D2R = Math.PI / 180, WATER = -47, GORGE_W = 30, BASIN_R = 210, GORGE_Z0 = -560, ARC_R = 107;
const BRIDGE_AZ = 262 * D2R;      // far enough round that the key clears the basin's rim and lights the bridge and pavilion
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const pol = (az, r, y) => [Math.sin(az) * r, y, Math.cos(az) * r];

// ---- the land as one analytic function: height of the block's top at (x, z) ----
// the tongue: a promontory of uncut block reaching in from the basin cliff toward the bridge, described in the
// bridge frame (s = metres outward along the bridge axis from the arc, a = metres along the direction of travel)
const PAV_S = 30 + 12 * Math.cos(20 * D2R), PAV_A = -20 - 12 * Math.sin(20 * D2R);     // the pavilion's foot, on the cut corner
const BE = [Math.sin(BRIDGE_AZ), Math.cos(BRIDGE_AZ)], BT = [Math.cos(BRIDGE_AZ), -Math.sin(BRIDGE_AZ)];
const toBridge = (x, z) => { const px = x - BE[0] * ARC_R, pz = z - BE[1] * ARC_R; return [px * BE[0] + pz * BE[1], px * BT[0] + pz * BT[1]]; };
const fromBridge = (s, a) => [BE[0] * (ARC_R + s) + BT[0] * a, BE[1] * (ARC_R + s) + BT[1] * a];
const TERRACE_Y = -39, T_A0 = -44, T_A1 = 12, T_S0 = 18, M_S0 = 30, M_A0 = -34, M_A1 = 8, CHAMF = 14, T_CH = 6;
const CH_PHI = 20 * D2R, CH_S = Math.sin(CH_PHI), CH_C = Math.cos(CH_PHI), CH_RUN = 1 / Math.tan(CH_PHI);   // the cut corner faces the approach
// signed distance (negative inside) to a box in the bridge frame with its approach-side inner corner cut off
function tongueSd(s, a, s0, a0, a1, ch) {
  const d = Math.max(s0 - s, a0 - a, a - a1);
  return Math.max(d, (s0 - s) * CH_S + (a0 + ch - a) * CH_C);
}
function landTop(x, z) {
  const r = Math.hypot(x, z);
  if (Math.abs(x) < GORGE_W && z > GORGE_Z0 && z < 0 && r >= BASIN_R - 1) return WATER;
  if (r < BASIN_R) {
    const [s, a] = toBridge(x, z);
    if (tongueSd(s, a, M_S0, M_A0, M_A1, CHAMF) < 0) return 0;
    if (tongueSd(s, a, T_S0, T_A0, T_A1, T_CH) < 0) return TERRACE_Y;
    return WATER;
  }
  return 0;
}

// ---- shared GLSL: the diapers and the plan of the land ----
const f1 = (v) => v.toFixed(4);
const G_COMMON = /* glsl */`
float scaleH(vec2 q, float ring) {                       // wave diaper: overlapping scale arcs, front rows cover those behind
  float h = 0., done = 0., r0 = floor(q.y * 2.) + 2.;
  for (int j = 0; j < 4; j++) {
    float row = r0 - float(j), off = mod(row, 2.) * .5;
    float cx = floor(q.x - off + .5) + off;
    float dd = length(q - vec2(cx, row * .5)) / .56;
    float hit = step(dd, 1.) * (1. - done);
    h += hit * (1. - smoothstep(.8, 1., dd)) * mix(1. - .5 * dd * dd, .58 + .42 * cos(dd * 15.7), ring);
    done += hit;
  }
  return h;
}
float waveH(vec2 uv, float time, float ring) {           // the water: scale cells 6 m, shifting half a cell in step every 2 s
  float tt = time * .5 - length(uv) * .012, sh = (floor(tt) + smoothstep(0., .35, fract(tt))) * .5;
  return 1.2 * scaleH(vec2(uv.x + sh * 6., uv.y) / 6., ring);
}
float fretH(vec2 q) {                        // square meander: nested squares, each broken and linked to the next
  vec2 f = fract(q) - .5;
  float m = max(abs(f.x), abs(f.y)) * 6.;
  float gap = step(0., f.x) * (1. - smoothstep(.03, .07, abs(f.y + (mod(floor(m), 2.) - .5) * .12)));
  float band = smoothstep(.12, .3, abs(fract(m) - .5));
  return max(band, gap) * step(m, 2.95);
}
float hexH(vec2 p) {                         // hexagon-flower: a six-lobed boss in every hexagon
  vec2 r = vec2(1., 1.7320508), h = r * .5;
  vec2 a = mod(p, r) - h, b = mod(p - h, r) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  float rad = length(g), ang = atan(g.y, abs(g.x) < 1e-5 ? 1e-5 : g.x);
  float lobe = .30 + .10 * cos(ang * 6.);
  return (1. - smoothstep(lobe - .06, lobe + .06, rad)) * (.6 + .4 * smoothstep(.05, .12, rad)) + .5 * (1. - smoothstep(.0, .07, abs(rad - .46)));
}
vec2 toBridge(vec2 p) { vec2 q = p - vec2(${f1(BE[0] * ARC_R)}, ${f1(BE[1] * ARC_R)}); return vec2(dot(q, vec2(${f1(BE[0])}, ${f1(BE[1])})), dot(q, vec2(${f1(BT[0])}, ${f1(BT[1])}))); }
float tongueSd(vec2 sa, float s0, float a0, float a1, float ch) {
  return max(max(max(s0 - sa.x, a0 - sa.y), sa.y - a1), (s0 - sa.x) * ${f1(CH_S)} + (a0 + ch - sa.y) * ${f1(CH_C)});
}
float voidSd(vec2 p) {                       // metres inside the cut-away part of the block (gorge and basin), negative in solid
  float basin = ${f1(BASIN_R)} - length(p);
  float gorge = min(min(${f1(GORGE_W)} - abs(p.x), p.y - ${f1(GORGE_Z0)}), -p.y);
  return min(max(basin, gorge), tongueSd(toBridge(p), ${f1(M_S0)}, ${f1(M_A0)}, ${f1(M_A1)}, ${f1(CHAMF)}));
}
float terraceSd(vec2 p) { return tongueSd(toBridge(p), ${f1(T_S0)}, ${f1(T_A0)}, ${f1(T_A1)}, ${f1(T_CH)}); }
`;

// ---- the land material: gorge walls, cliffs, terraces, bridge, pavilion, vine and the displaced water patch ----
// aL = (kind, baked key visibility, lip, key): kind 0 wall (chart: metres along, world y), 1 flat (world xz; key 0
// block top, 1 terrace), 2 smooth, 3 water (key 1 = the displaced follow patch), 4 vine (key = z, cut by the groove)
const LAND_VERT = /* glsl */`
attribute vec4 aL; attribute vec2 aUv;
uniform vec4 uPatch; uniform vec2 uPsi; uniform float uTime, uHeadZ;
varying vec3 vW, vN; varying vec4 vL; varying vec2 vUv;
${G_COMMON}
void main() {
  vec3 p = position; vec4 l = aL; vec2 uv = aUv;
  if (aL.x > 2.5 && aL.x < 3.5) {
    if (aL.w > .5) p.xz += uPatch.xy;
    uv = vec2(p.x * uPsi.x - p.z * uPsi.y, p.x * uPsi.y + p.z * uPsi.x);       // the flower's own frame, as its apron uses
    float edge = 1. - smoothstep(.7, .98, max(abs(position.x), abs(position.z)) / uPatch.z);
    edge *= smoothstep(92., 106., length(p.xz)) * smoothstep(.3, 3., min(voidSd(p.xz), terraceSd(p.xz)));
    l.w = edge * step(.5, aL.w);
    p.y += (waveH(uv, uTime, 0.) + .1) * l.w;
  } else if (aL.x > 3.5 && aL.x < 4.5) {
    float cut = smoothstep(0., 2.5, uHeadZ - aL.w);                              // nothing stands ahead of the groove head
    p.x = mix(34.5, p.x, cut); l.z *= cut;
  }
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * normal; vL = l; vUv = uv;
  gl_Position = projectionMatrix * (viewMatrix * w);
}`;
const LAND_FRAG = /* glsl */`
uniform vec3 uKey, uKeyCol, cGlow, cFar, cFresh, cHi, cBounce, cHoney, cDeep, uLift;
uniform float uTime, uFill, uGlow, uCamS, uHeadZ; uniform vec3 uHeal, uPav; uniform sampler2D uShade; uniform vec4 uShadeBox;
varying vec3 vW, vN; varying vec4 vL; varying vec2 vUv;
${STACK}
${G_COMMON}
float gBig, gNorth;                           // set in main: 1 on the basin's ring wall and the tongue; on the far wall's sector, metres in from its ends (negative outside)
float gBandH, gBandM, gBandU;                 // out: the bands' relief (0..1); the great band's ground (0..1); the far wall's second vine, its ground (0..1)
vec2 wallH(vec2 uv) {                        // x: relief in metres, y: how freshly cut
  float y = uv.y, s = uv.x;
  float top = y > -15. ? 0. : (y > -31. ? -15. : -31.), v = top - y;      // three faces; v grows down each
  float band = smoothstep(1.3, 1.7, v) * (1. - smoothstep(5.3, 5.7, v));
  float row = 1. - top * .09;
  float behind = mod(uTime * (7. + 2. * row) + row * 310. - s, 700.);       // metres behind this band's travelling groove
  float depth = mix(.3, 1., 1. - smoothstep(200., 650., behind));
  float h = .5 * band * fretH(vec2(s, v - 1.5) / 4.) * depth;
  vec2 c = vec2((fract(s / 5.) - .5) * 5., v - 6.);
  float lc = length(c);
  // the great band (middle face, round the basin): a running vine eight metres tall, a stem in a slow S with a bud in every
  // bend, standing proud of a ground cut back to the buff; broad enough to read from right across the water
  // THE FAR WALL'S SECOND VINE: on the sector of the basin wall that stands behind the flower as it is seen from the gorge,
  // the upper face carries the same vine (its buds between those of the band below) in relief on the wall's own red:
  // its ground is set back a little and stays the lacquer it is cut in, read by its lit lip and its shade alone. It
  // runs out into the plain wall over the last metres of the sector.
  float upper = step(0., gNorth) * step(-.5, top), vb = v + .9 * upper, sv = s + 9. * upper;
  float zone = max(gBig * step(-15.5, top) * step(top, -14.5), upper), wv = vb - 10.9;
  float inB = zone * smoothstep(6.3, 6.7, vb) * (1. - smoothstep(15.1, 15.5, vb)) * mix(1., clamp(gNorth / 12., 0., 1.), upper);
  float sy = 2.1 * sin(sv * .1745), sl = 2.1 * .1745 * cos(sv * .1745);
  float stem = abs(wv - sy) / sqrt(1. + sl * sl) - .75;
  float kb = floor(sv / 18. + .5), sb = (mod(kb, 2.) * 2. - 1.);
  float bud = length(vec2(sv - kb * 18., wv + sb * 1.5)) - 1.75;
  float rail = abs(abs(wv) - 3.75) - .32;
  float hb = 1. - smoothstep(-.15, .35, min(min(stem, bud), rail));
  gBandM = (1. - hb) * inB * (1. - upper);
  gBandU = (1. - hb) * inB * upper;
  gBandH = mix(1., hb, inB);
  float plain = 1. - zone * smoothstep(5.9, 6.4, vb);
  h += .4 * (1. - smoothstep(2., 2.4, lc)) * step(0., c.y) * (.55 + .45 * smoothstep(.8, 1.2, lc)) * (.5 + .5 * depth) * plain;
  float fl = .5 + .5 * cos(s * 2.0944);
  h += .3 * fl * fl * smoothstep(9.2, 10.4, v) * plain;
  return vec2(h, band * (1. - smoothstep(3., 24., behind)));
}
vec2 relief(float kind, vec2 uv, float key) {
  if (kind < .5) return wallH(uv);
  if (kind < 1.5) return vec2(.5 * mix(hexH(uv / 5.), fretH(uv / 6.), key), 0.);
  if (kind > 2.5 && kind < 3.5) return vec2(waveH(uv, uTime, 1.), 0.);
  if (kind > 4.5) return vec2(.22 * fretH(uv / 1.7), 0.);
  if (kind > 3.5 && abs(uv.x) < 1.5) {                 // a vine leaf: midrib and six side veins raking toward the tip
    float ax = abs(uv.x), rib = exp(-uv.x * uv.x * 70.);
    float sv = .5 + .5 * cos(6.2832 * (uv.y * 6.5 - ax * 1.5));
    return vec2(.26 * rib + .2 * sv * sv * sv * (1. - rib) * (1. - smoothstep(.7, 1., ax)), 0.);
  }
  return vec2(0.);
}
void main() {
  float kind = vL.x;
  float vs = voidSd(vW.xz), ts = terraceSd(vW.xz);
  bool gone = kind > .5 && kind < 1.5 && (vL.w < .5 ? vs > -5.6 : (ts > -3.1 || vs < -.3));
  gone = gone || (kind > 2.5 && kind < 3.5 && length(vW.xz) < 90.);
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  float d = -vW.y, fw = max(fwidth(d), 1e-4);
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); vec2 dux = dFdx(vUv), duy = dFdy(vUv);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  det = (det < 0. ? -1. : 1.) * max(abs(det), 1e-7);
  vec3 gU = (r1 * dux.x + r2 * duy.x) / det, gV = (r1 * dux.y + r2 * duy.y) / det;
  float cell = kind < .5 ? 2. : (kind < 1.5 ? 1.5 : (kind > 4.5 ? .5 : (kind > 3.5 ? .22 : 3.5)));
  float fade = 1. - smoothstep(.25, .7, (length(dux) + length(duy)) / cell);
  // healing: behind the camera the gorge shallows, its lines soften and a wet sheen spreads
  float heal = smoothstep(uHeal.x, uHeal.y, uCamS - (vW.z + 420.)) * (1. - smoothstep(-250., -205., vW.z));
  // the ground cut back behind the vine: a plain dark field along the stem's S once the groove has passed
  float vy = -24.5 + 4. * sin(vW.z * .1428);
  float vground = step(kind, .5) * step(29., vW.x) * (1. - smoothstep(5., 6.4, abs(vW.y - vy))) * smoothstep(0., 2.5, uHeadZ - vW.z) * (1. - smoothstep(-214., -208., vW.z)) * smoothstep(-509., -505., vW.z);
  float e = (kind > 3.5 && kind < 4.5) ? .012 : .06, key = kind < 1.5 ? clamp(vL.w, 0., 1.) : 0.;      // (0 block top, 1 terrace: held there against multisampling)
  gBig = 1. - step(vW.z, -204.) * step(abs(vW.x), 38.); gBandH = 1.; gBandM = 0.; gBandU = 0.;
  gNorth = length(vW.xz) > 200. ? (.9585 - abs(atan(vW.x, max(vW.z, 1.)))) * 210. : -1.;      // the ring wall within 55 degrees of north
  float fadeB = (1. - smoothstep(.25, .7, (length(dux) + length(duy)) / 12.)) * step(kind, .5);
  float hu = relief(kind, vUv + vec2(e, 0.), key).x; float hbu = gBandH;
  float hv = relief(kind, vUv + vec2(0., e), key).x; float hbv = gBandH;
  vec2 h0 = relief(kind, vUv, key); float hb0 = gBandH, hm0 = gBandM, hu0 = gBandU;
  vec3 bump = (gU * (hu - h0.x) + gV * (hv - h0.x)) / e;
  bump *= fade * (1. - heal) * (1. - .85 * vground) * min(1., 2.5 / max(length(bump), 1e-4));
  vec3 bumpB = (gU * (hbu - hb0) + gV * (hbv - hb0)) * (.9 / e);
  bump += bumpB * (fadeB * (1. - heal) * min(1., 2.2 / max(length(bumpB), 1e-4)));
  N = N - bump; N /= max(length(N), 1e-4);
  if (kind > 2.5 && kind < 3.5) d = 47. - (h0.x - .6) * fade;
  else if (kind > .5 && kind < 1.5) d += (.5 - h0.x) * fade * .9;
  // black-cap land: the cap is a skin, so every cut of the fret band (and of the diaper on the block's top) goes
  // through it to the vermilion; twenty coats deeper, so the coat lines keep their place
  float vTop = -vUv.y;
  float capCut = kind < .5 ? smoothstep(1.3, 1.7, vTop) * (1. - smoothstep(5.3, 5.7, vTop)) * (1. - smoothstep(.04, .14, h0.x))
               : (kind < 1.5 ? (1. - smoothstep(.06, .2, h0.x)) : 0.);
  d += 8. * capCut * step(0., uCap) * fade;
  vec3 alb = stackColor(d, fw);
  alb = mix(alb, stackColor(d, 4.), heal);
  // the niche behind the pavilion: the cliff round it stands in shade so the lit roofs read against it
  float niche = kind < .5 ? 1. - .62 * (1. - smoothstep(13., 27., length(vW.xz - uPav.xz))) * (1. - smoothstep(-22., -12., vW.y)) : 1.;
  float cav = (kind < 1.5 || kind > 4.5) ? mix(1., .8 + .2 * smoothstep(0., .15, h0.x), fade * (1. - heal)) : (kind > 3.5 ? mix(1., .72 + .28 * smoothstep(0., .1, h0.x), fade) : 1.);
  cav *= 1. - (.42 * vground + .35 * vground * (1. - smoothstep(.0, .5, 5.7 - abs(vW.y - vy)))) * (1. - heal);
  cav *= 1. - .3 * hu0 * fadeB;                                             // the set-back ground of the far wall's second vine lies in its own shade
  alb = mix(alb * cav, cFresh, .7 * h0.y * step(d, 40.) * fade);
  if (kind > 3.5 && kind < 4.5) alb = mix(alb, cFresh, .5 * (1. - smoothstep(0., 13., uHeadZ - vL.w)));
  float lip = clamp(vL.z, 0., 1.);
  float S = clamp(vL.y, 0., 1.) * niche * (1. - .72 * vground * (1. - heal));
  if (kind > 2.5 && kind < 3.5) S = texture2D(uShade, (vW.xz - uShadeBox.xy) * uShadeBox.zw).r;
  float w = clamp((dot(N, uKey) + .25) / 1.25, 0., 1.);
  w = 1. - (1. - w) * (1. - w);
  vec3 fill = mix(cBounce, cHoney, N.y * .5 + .5) * uFill;
  vec3 Bd = vec3(-uKey.x, .3, -uKey.z); Bd /= max(length(Bd), 1e-4);          // the lit land opposite the key throws its red back
  float bw = clamp(dot(N, Bd) * .5 + .5, 0., 1.);
  fill *= .62 + .7 * bw * bw;
  vec3 col = alb * (uKeyCol * w * S + fill);
  vec3 Hh = uKey + V; Hh /= max(length(Hh), 1e-4);
  float nh = max(dot(N, Hh), 0.); nh *= nh; nh = nh * nh * nh; nh *= nh;
  col += .16 * nh * S * (1. + 2. * heal) * (cHi * step(d, 40.) + alb * 2.2);
  float rim = 1. - max(dot(N, V), 0.); rim = rim * rim * rim;
  col += .35 * rim * alb * (.35 + .65 * w * S) * (1. + heal) + .45 * lip * lip * alb * w * S;
  // buff in the cuts: the floor of every cut of the cliffs' fret bands is the buff at the bottom of the stack, as in the
  // flower: the stack's own buff under the same light as the vault behind (lit buff, honey in the shade)
  vec3 ground = cBuff * (uKeyCol * (w * S) + cHoney * (uFill * 1.25)) * (1. + .2 * rim);
  float wv = (vUv.y > -15. ? 0. : (vUv.y > -31. ? -15. : -31.)) - vUv.y;
  float gcut = kind < .5 ? smoothstep(1.3, 1.7, wv) * (1. - smoothstep(5.3, 5.7, wv)) * (1. - smoothstep(.03, .13, h0.x)) * fade * (1. - heal) * (1. - step(0., uCap)) : 0.;
  col = mix(col, ground, .85 * gcut);
  float gcutB = hm0 * fadeB * (1. - heal);                                  // the great band's ground: buff (under a black cap, the vermilion under the cap)
  col = mix(col, mix(ground, cFresh * (.4 + .5 * w * S + .25 * rim), step(0., uCap)), .8 * gcutB);
  col /= 1. + 1.1 * max(col.r - .58, 0.);
  float tow = clamp(.5 - dot(V, uKey) * .7, 0., 1.);
  col = min(col + cGlow * (uGlow * lip * lip * lip * tow * tow), max(col, GLOW_PEAK));      // (the glow fills what is left under its peak and never stacks over it)
  float low = clamp(1. - col.r / .13, 0., 1.);
  col += cDeep * (low * low * step(d, 40.25) * (1. - .8 * w * S));
  col = shadeToe(col, stackToe(d, fw));
  col = mix(col, cFar, min(.9, .75 * (1. - exp(-dist / 700.)) + .28 * smoothstep(380., 800., dist)));   // the far cliffs sink deeper so the flower stands off them
  if (gone) discard;
  gl_FragColor = vec4(clamp(col, 0., 40.) + uLift, 1.);
}`;

// ---- the vault: ring wall and lid, cut down to the buff layer, worked in cloud diaper with red cloud scrolls ----
// chart: vC.x = metres up the wall and on across the lid; the azimuth is taken in the fragment. Authored, not hazed.
const VAULT_R = 1300;
const VAULT_VERT = /* glsl */`
attribute float aS;
varying vec3 vW, vN; varying float vS;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz; vN = mat3(modelMatrix) * normal; vS = aS;
  gl_Position = projectionMatrix * (viewMatrix * w);
}`;
const VAULT_FRAG = /* glsl */`
uniform vec3 uKey, uKeyCol, cRed, cRed2, cBuff, cBlack, cCap, cGlow, cFresh, cHoney, uLift;
uniform float uTime, uFill, uMarble, uCap; uniform vec4 uBand;      // rare event: head azimuth (m), tail azimuth, on, glow
varying vec3 vW, vN; varying float vS;
${G_COMMON}
float h11(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
// cloud diaper: a curled ruyi head in every cell (40 m), rows staggered. fine: 1 where its two fine lines (the ring cut
// inside each head and the bar under it, 2.4 to 2.8 m wide) are drawn, 0 where they are left out and their mean is laid
// in their place
float cloudH(vec2 q, float fine) {
  q.x += .5 * mod(floor(q.y), 2.);
  vec2 f = fract(q) - .5;
  float sd = min(length(f - vec2(0., .1)) - .22, min(length(f - vec2(-.2, -.1)) - .17, length(f - vec2(.2, -.1)) - .17));
  return (1. - smoothstep(-.03, .03, sd)) * (1. - .6 * fine * (1. - smoothstep(.0, .035, abs(sd + .08))))
       + .5 * fine * (1. - smoothstep(.0, .03, abs(f.y + .36))) * step(abs(f.x), .32) - .033 * (1. - fine);
}
float scrollSd(vec2 p) {                      // signed distance (m) to the nearest cloud scroll, negative inside
  float best = 1e3;
  for (int row = 0; row < 3; row++) {
    float fr = float(row), cw = 6.2831853 * ${f1(VAULT_R)} / (18. - 3. * fr);
    float ax = p.x + fr * 173. + uTime * .6, ci = floor(ax / cw);
    float r1 = h11(ci * 3.1 + fr * 17.), r2 = h11(ci * 7.7 + fr * 5. + 2.);
    float len = mix(90., 220., r1) * (1. + .25 * fr);
    vec2 q = vec2(ax - (ci + .5) * cw - (r2 - .5) * (cw - len * 1.25), p.y - (95. + 190. * fr + 90. * (r1 * r2 - .25)));
    // no two scrolls from one stamp: half face the other way, every puff has its own height and girth, and most
    // carry a crest puff somewhere along their back
    float r3 = h11(ci * 5.3 + fr * 11. + 4.), r4 = h11(ci * 9.7 + fr * 2.3 + 1.);
    q.x *= r3 < .5 ? -1. : 1.;
    float sd = 1e3;
    for (int k = 0; k < 4; k++) {
      float fk = float(k), jk = h11(ci * 1.7 + fk * 9.1 + fr * 3.), gk = h11(ci * 2.9 + fk * 4.3 + fr);
      vec2 c = vec2(len * (-.34 + .21 * fk), len * (.05 * mod(fk, 2.) - .02 * fk + .03 + .08 * (jk - .5)));
      sd = min(sd, length(q - c) - len * (.185 - .033 * fk) * (.8 + .4 * gk));
    }
    sd = min(sd, length(q - vec2(len * (-.3 + .45 * r4), len * (.13 + .05 * r3))) - len * .095 + 1e3 * step(r4, .3));
    float tx = clamp((q.x - len * .3) / (len * .42), 0., 1.);                 // the tail, tapering to a point
    sd = min(sd, length(q - vec2(len * .3 + tx * len * .42, -len * .04 + tx * tx * len * .05)) - len * .07 * (1. - tx));
    best = min(best, sd);
  }
  return best;
}
void main() {
  vec3 N = vN / max(length(vN), 1e-4);
  float az = atan(vW.x, (abs(vW.z) < 1e-3 && abs(vW.x) < 1e-3) ? 1e-3 : vW.z);
  vec2 p = vec2(az * ${f1(VAULT_R)}, vS);
  vec3 T = vec3(vW.z, 0., -vW.x); T /= max(length(T), 1e-4);
  vec3 Uc = cross(T, N);
  vec2 L2 = vec2(dot(uKey, T), dot(uKey, Uc)); L2 /= max(length(L2), 1e-3);
  float rr = length(vW.xz) / ${f1(VAULT_R)}, crush = smoothstep(.3, .6, rr);
  // metres of the vault in one pixel (the pixel's angle times the distance, longer where the lens looks along the
  // surface): no line of the diaper or of the fret is drawn under two pixels wide; each fades to its own mean tone
  // before it comes to that. The diaper's fine lines (2.4 m) go between 3 and 2 pixels, its heads (lobes 13.6 m)
  // between 4 and 2, the fret's lines (1.25 m) between 3 and 2
  float mpp = max(length(dFdx(vW)), length(dFdy(vW)));
  float dLine = 1. - smoothstep(.8, 1.2, mpp), dHead = 1. - smoothstep(3.4, 6.8, mpp), dFret = 1. - smoothstep(.42, .625, mpp);
  // the ground: cloud diaper in the buff
  vec2 q = vec2(az * 204. / 6.2831853, vS / 40.);
  float hc = cloudH(q, dLine), hx = cloudH(q + vec2(.02, 0.), dLine), hy = cloudH(q + vec2(0., .02), dLine);
  float h0 = mix(.262, hc, dHead);
  vec3 Nd = N - (T * (hx - hc) + Uc * (hy - hc)) * (1.6 * crush * dHead); Nd /= max(length(Nd), 1e-4);
  float w = clamp((dot(Nd, uKey) + .35) / 1.35, 0., 1.);
  // the scrolls: red, six metres proud; they shade the buff beside them, away from the key
  float sd = scrollSd(p), sdL = scrollSd(p + L2 * 4.), sdS = scrollSd(p + L2 * 12.);
  sd = mix(1e3, sd, crush); sdS = mix(1e3, sdS, crush);
  float inS = 1. - smoothstep(-.8, .8, sd);
  float shade = 1. - .42 * (1. - smoothstep(-4., 5., sdS)) * (1. - inS);
  // the fret border where wall meets land, and its top bead
  float foot = 1. - smoothstep(29., 31., vS);
  vec2 fq = vec2(az * 544. / 6.2831853, vS / 15.);
  float fh = mix(.573, fretH(fq), dFret) * step(2., vS) * (1. - smoothstep(26., 27., vS));
  float red = max(inS, foot);
  vec3 buff = cBuff * (1. - .13 * (1. - h0) * crush);
  // coat lines on the scroll's bevel: contours following its outline, and two echo grooves inside
  float lines = .5 + .5 * cos(sd * 4.2);
  float bev = smoothstep(-7., -.5, sd);
  float echo = (1. - smoothstep(0., 1.3, abs(sd + 11.))) + (1. - smoothstep(0., 1.3, abs(sd + 21.)));
  float lipL = clamp((sd - sdL) / 4., -1., 1.);                               // +1 on the lip that faces the key
  vec3 rcol = mix(cRed, cRed2, .35) * (1. - .22 * bev * lines - .4 * echo) * (1. - .25 * foot * (1. - fh));
  rcol = mix(rcol, cCap, max(uMarble * bev * step(.5, lines) * .85, step(0., uCap) * (1. - bev) * .85));
  float wr = clamp(w + .55 * lipL * bev, 0., 1.2);
  vec3 col = mix(buff * (uKeyCol * w * shade + cHoney * uFill * 1.25), rcol * (uKeyCol * wr + cHoney * uFill), red);
  col += cGlow * .5 * inS * bev * max(lipL, 0.) * max(lipL, 0.) * crush;                           // the lit lip glows
  // rare event: one groove six metres wide crosses the whole vault, cutting a new cloud band behind it
  float bs = 285. + 60. * sin(az * 2.) + 30. * sin(az * 5. + 1.);
  float cutd = uBand.y - p.x;                                                  // metres behind the head
  float on = uBand.z * step(0., cutd) * step(p.x, uBand.y) * step(uBand.x, p.x);
  float gd = abs(vS - bs);
  float groove = on * (1. - smoothstep(2.4, 3.6, gd));
  float puff = length(vec2((fract(p.x / 62.) - .5) * 62., vS - bs - 12.)) - 23.;
  float newc = on * (1. - smoothstep(-.6, .6, puff)) * smoothstep(20., 60., cutd) * step(0., vS - bs);
  float fresh = 1. - smoothstep(0., 400., cutd);
  col = mix(col, mix(cRed, cFresh, fresh) * (uKeyCol * (.35 + .65 * w) + cHoney * uFill) * (1. - .25 * (.5 + .5 * cos(puff * 4.2)) * smoothstep(-6., 0., puff)), newc);
  col = mix(col, cRed2 * .55 + cGlow * 1.6 * fresh * uBand.w, groove);
  gl_FragColor = vec4(col + uLift, 1.);
}`;

// ---- geometry helpers ----
// buffers are typed arrays with room to spare, written through a cursor (n vertices, ni indices): no growing, no garbage
const newB = (cap = 30000) => ({ pos: new Float32Array(cap * 3), nor: new Float32Array(cap * 3), l: new Float32Array(cap * 4), uv: new Float32Array(cap * 2), idx: new Uint32Array(cap * 6), n: 0, ni: 0 });
// add a (nu+1) x (nv+1) grid of points P (flat xyz); normals by central differences; attr(i, j) -> [kind, shade, lip, key, u, v]
function addGrid(B, P, nu, nv, sign, attr) {
  const base = B.n, Wd = nu + 1;
  const at = (i, j) => (Math.min(nu, Math.max(0, i)) + Math.min(nv, Math.max(0, j)) * Wd) * 3;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), e = at(i, j + 1), o = at(i, j);
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[e] - P[c], vy = P[e + 1] - P[c + 1], vz = P[e + 2] - P[c + 2];
    const nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
    const k = sign / Math.max(Math.hypot(nx, ny, nz), 1e-6);
    const v = B.n++, q = v * 3, t = attr(i, j);
    B.pos[q] = P[o]; B.pos[q + 1] = P[o + 1]; B.pos[q + 2] = P[o + 2]; B.nor[q] = nx * k; B.nor[q + 1] = ny * k; B.nor[q + 2] = nz * k;
    B.l[v * 4] = t[0]; B.l[v * 4 + 1] = t[1]; B.l[v * 4 + 2] = t[2]; B.l[v * 4 + 3] = t[3]; B.uv[v * 2] = t[4]; B.uv[v * 2 + 1] = t[5];
  }
  let q = B.ni;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = base + i + j * Wd, b = a + 1, c = a + Wd, d = c + 1;
    if (sign > 0) { B.idx[q] = a; B.idx[q + 1] = c; B.idx[q + 2] = b; B.idx[q + 3] = b; B.idx[q + 4] = c; B.idx[q + 5] = d; } else { B.idx[q] = a; B.idx[q + 1] = b; B.idx[q + 2] = c; B.idx[q + 3] = b; B.idx[q + 4] = d; B.idx[q + 5] = c; }
    q += 6;
  }
  B.ni = q;
  return base;
}
// the same in slices (a yield every `rows` rows), for the big cliff grid
async function addGridA(B, P, nu, nv, sign, attr, ctx, rows) {
  const base = B.n, Wd = nu + 1;
  const at = (i, j) => (Math.min(nu, Math.max(0, i)) + Math.min(nv, Math.max(0, j)) * Wd) * 3;
  for (let j = 0; j <= nv; j++) { if (j && j % rows === 0) await ctx.yield(); for (let i = 0; i <= nu; i++) {
    const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), e = at(i, j + 1), o = at(i, j);
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[e] - P[c], vy = P[e + 1] - P[c + 1], vz = P[e + 2] - P[c + 2];
    const nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux;
    const k = sign / Math.max(Math.hypot(nx, ny, nz), 1e-6);
    const v = B.n++, q = v * 3, t = attr(i, j);
    B.pos[q] = P[o]; B.pos[q + 1] = P[o + 1]; B.pos[q + 2] = P[o + 2]; B.nor[q] = nx * k; B.nor[q + 1] = ny * k; B.nor[q + 2] = nz * k;
    B.l[v * 4] = t[0]; B.l[v * 4 + 1] = t[1]; B.l[v * 4 + 2] = t[2]; B.l[v * 4 + 3] = t[3]; B.uv[v * 2] = t[4]; B.uv[v * 2 + 1] = t[5];
  } }
  await ctx.yield();
  let q = B.ni;
  for (let j = 0; j < nv; j++) { if (j && j % (rows * 2) === 0) await ctx.yield(); for (let i = 0; i < nu; i++) {
    const a = base + i + j * Wd, b = a + 1, c = a + Wd, d = c + 1;
    if (sign > 0) { B.idx[q] = a; B.idx[q + 1] = c; B.idx[q + 2] = b; B.idx[q + 3] = b; B.idx[q + 4] = c; B.idx[q + 5] = d; } else { B.idx[q] = a; B.idx[q + 1] = b; B.idx[q + 2] = c; B.idx[q + 3] = b; B.idx[q + 4] = d; B.idx[q + 5] = c; }
    q += 6;
  } }
  B.ni = q;
  return base;
}
async function toGeo(B, ctx) {
  const g = new THREE.BufferGeometry(), n = B.n;
  g.setAttribute('position', new THREE.BufferAttribute(B.pos.slice(0, n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(B.nor.slice(0, n * 3), 3));
  await ctx.yield();
  g.setAttribute('aL', new THREE.BufferAttribute(B.l.slice(0, n * 4), 4));
  g.setAttribute('aUv', new THREE.BufferAttribute(B.uv.slice(0, n * 2), 2));
  g.setIndex(new THREE.BufferAttribute(B.idx.slice(0, B.ni), 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1500);     // given, so the first frame does not stop to measure it
  return g;
}
// the plan of the land again, as distances (mirrors voidSd and terraceSd in the shaders)
function voidSdJS(x, z) {
  const basin = BASIN_R - Math.hypot(x, z), gorge = Math.min(GORGE_W - Math.abs(x), z - GORGE_Z0, -z);
  const px = x - BE[0] * ARC_R, pz = z - BE[1] * ARC_R;                  // (toBridge, written out: this runs a few million times in the bakes)
  return Math.min(Math.max(basin, gorge), tongueSd(px * BE[0] + pz * BE[1], px * BT[0] + pz * BT[1], M_S0, M_A0, M_A1, CHAMF));
}
// voidSdJS again with a plain square root for its Math.hypot: only a guard for the key's march, which asks voidSdJS
// itself wherever this is within 1e-6 m of letting the solid's test pass (the two differ by far less than that); no
// number of the world is made from its value
function voidSdQuick(x, z) {
  const basin = BASIN_R - Math.sqrt(x * x + z * z), gorge = Math.min(GORGE_W - Math.abs(x), z - GORGE_Z0, -z);
  const px = x - BE[0] * ARC_R, pz = z - BE[1] * ARC_R;
  return Math.min(Math.max(basin, gorge), tongueSd(px * BE[0] + pz * BE[1], px * BT[0] + pz * BT[1], M_S0, M_A0, M_A1, CHAMF));
}
const terraceSdJS = (x, z) => { const px = x - BE[0] * ARC_R, pz = z - BE[1] * ARC_R; return tongueSd(px * BE[0] + pz * BE[1], px * BT[0] + pz * BT[1], T_S0, T_A0, T_A1, T_CH); };
const wallOff = (y) => (y > -15 ? 5.2 : (y > -31 ? 2.6 : 0));
// how much of the key reaches a point: a march toward the light over the plan of the land and the flower's dome
function keyVis(x, y, z, K, noDome) {
  let occ = 0, t = 2.2;
  for (let i = 0; i < 26 && occ < 1; i++) {
    const px = x + K.x * t, py = y + K.y * t, pz = z + K.z * t;
    if (py > 0.5) break;
    const soft = 0.8 + 0.06 * t;
    // (two guards, each before a test that stands as it was: the solid's own test and the dome's own test run wherever
    // they could pass, the solid's within 1e-6 m by the quick distance, the dome's within 90.00006 m by squares)
    if (-voidSdQuick(px, pz) - wallOff(py) - 0.6 > -1e-6) {
      const inSolid = -voidSdJS(px, pz) - wallOff(py) - 0.6;
      if (inSolid > 0) occ = Math.max(occ, Math.min(1, inSolid / soft));
    }
    if (py < TERRACE_Y) { const tin = -terraceSdJS(px, pz) - 3.6; if (tin > 0) occ = Math.max(occ, Math.min(1, tin / soft)); }
    if (!noDome && px * px + pz * pz < 8100.01) {
      const r = Math.hypot(px, pz);
      if (r < 90 && !noDome) { const top = WATER + 45 * Math.sqrt(1 - (r / 92) * (r / 92)); if (py < top) occ = Math.max(occ, Math.min(1, (top - py) / (soft * 2))); }
    }
    t *= 1.21;
  }
  return 1 - occ;
}
// the cliff profile: [set-back into the block, y], knife bevels at each ledge
const PROFILE = [[0, -48.5], [0, -44], [0, -40], [0, -36], [0, -32.4], [0.15, -31.5], [0.6, -31.05], [2.1, -31], [2.5, -30.6], [2.6, -27],
  [2.6, -23], [2.6, -19], [2.6, -16.4], [2.75, -15.5], [3.2, -15.05], [4.7, -15], [5.1, -14.6], [5.2, -11], [5.2, -7], [5.2, -3.6],
  [5.25, -1.2], [5.55, -0.3], [6.3, 0], [9.5, 0]];
const PROFILE_T = [[0, -48.5], [0, -45], [0, -41], [0.15, -39.6], [0.6, -39.05], [3.6, -39]];
// one cliff: a polyline of foot points [x, z], the void on the side landTop says; the chart runs along it in metres
async function addCliff(B, line, profile, K, ctx, s0) {
  const n = line.length, nv = profile.length - 1, P = new Float32Array(n * (nv + 1) * 3), S = new Float32Array(n), NX = new Float32Array(n), NZ = new Float32Array(n);
  let acc = s0;
  for (let i = 0; i < n; i++) {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)], c = line[i];
    let nx = -(b[1] - a[1]), nz = b[0] - a[0]; const k = 1 / Math.max(Math.hypot(nx, nz), 1e-6); nx *= k; nz *= k;
    if (voidSdJS(c[0] + nx * 1.5, c[1] + nz * 1.5) < voidSdJS(c[0] - nx * 1.5, c[1] - nz * 1.5) && profile === PROFILE) { nx = -nx; nz = -nz; }
    if (profile !== PROFILE && terraceSdJS(c[0] + nx * 1.5, c[1] + nz * 1.5) < 0) { nx = -nx; nz = -nz; }
    if (i) acc += Math.hypot(c[0] - line[i - 1][0], c[1] - line[i - 1][1]);
    S[i] = acc; NX[i] = nx; NZ[i] = nz;
    const but = 1.5 * (1 - sstep(0.5, 0.85, Math.cos(acc * 6.2832 / 24)));
    for (let j = 0; j <= nv; j++) {
      const off = profile[j][0] + (profile === PROFILE && j < nv - 1 ? but : 0), o = (i + j * n) * 3;
      P[o] = c[0] - nx * off; P[o + 1] = profile[j][1]; P[o + 2] = c[1] - nz * off;
    }
  }
  // which way round the grid faces: the first quad's normal must look into the void
  await ctx.yield();
  const vis = new Float32Array(n * (nv + 1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= nv; j++) { const o = (i + j * n) * 3; vis[i + j * n] = keyVis(P[o] + NX[i] * 0.7, P[o + 1] + 0.3, P[o + 2] + NZ[i] * 0.7, K); }
    if (i % 6 === 5) await ctx.yield();
  }
  await ctx.yield();
  const pier = (i) => 0.72 + 0.28 * sstep(0.5, 0.85, Math.cos(S[i] * 6.2832 / 24));
  const main = profile === PROFILE, PR = new Float32Array(n); for (let i = 0; i < n; i++) PR[i] = main ? pier(i) : 1;
  await ctx.yield();
  const base = await addGridA(B, P, n - 1, nv, 1, (i, j) => [0, vis[i + j * n] * PR[i], j >= nv - 2 && main ? 0.5 : 0, 0, S[i], profile[j][1]], ctx, 3);
  await ctx.yield();
  // flip if the computed normals point into the block
  const q = base * 3 + (Math.floor(n / 2) + 2 * n) * 3, mid = Math.floor(n / 2);
  if (B.nor[q] * NX[mid] + B.nor[q + 2] * NZ[mid] < 0) {
    for (let v = base * 3; v < B.n * 3; v++) B.nor[v] = -B.nor[v];
    await ctx.yield();
    for (let t = B.ni - (n - 1) * nv * 6; t < B.ni; t += 3) { const tmp = B.idx[t + 1]; B.idx[t + 1] = B.idx[t + 2]; B.idx[t + 2] = tmp; }
  }
  return acc;
}

// a grid whose facing is decided by a direction it must look toward (out), not by the order of its rows
function surf(B, P, nu, nv, attr, out) {
  const base = addGrid(B, P, nu, nv, 1, attr), m = (base + Math.floor(nu / 2) + Math.floor(nv / 2) * (nu + 1)) * 3;
  if (B.nor[m] * out[0] + B.nor[m + 1] * out[1] + B.nor[m + 2] * out[2] < 0) {
    for (let v = base * 3; v < B.n * 3; v++) B.nor[v] = -B.nor[v];
    for (let t = B.ni - nu * nv * 6; t < B.ni; t += 3) { const tmp = B.idx[t + 1]; B.idx[t + 1] = B.idx[t + 2]; B.idx[t + 2] = tmp; }
  }
  return base;
}
// a builder working in a local frame: u along, y up, w out; everything it makes is kind 2 (smooth carved work)
function makeFrame(B, O, U, Wd, y0, K, sc = 1) {
  const X = (u, w) => O[0] + (U[0] * u + Wd[0] * w) * sc, Z = (u, w) => O[1] + (U[1] * u + Wd[1] * w) * sc;
  const dir = (du, dy, dw) => [U[0] * du + Wd[0] * dw, dy, U[1] * du + Wd[1] * dw];
  const F = {
    // fn(i, j) -> [u, y, w, lip]; out: local direction [du, dy, dw] the surface must face
    surf(nu, nv, fn, out, shadeMul = 1) {
      const P = new Float32Array((nu + 1) * (nv + 1) * 3), lip = new Float32Array((nu + 1) * (nv + 1)), uvA = new Float32Array((nu + 1) * (nv + 1) * 2);
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const t = fn(i / nu, j / nv), k = i + j * (nu + 1), o = k * 3; P[o] = X(t[0], t[2]); P[o + 1] = y0 + t[1] * sc; P[o + 2] = Z(t[0], t[2]); lip[k] = t[3] || 0; uvA[k * 2] = t[4] || 0; uvA[k * 2 + 1] = t[5] || 0; }
      const od = dir(out[0], out[1], out[2]);
      surf(B, P, nu, nv, (i, j) => { const o = (i + j * (nu + 1)) * 3; return [2, shadeMul * keyVis(P[o] + od[0] * 0.5, P[o + 1] + od[1] * 0.5 + 0.2, P[o + 2] + od[2] * 0.5, K), lip[i + j * (nu + 1)], 0, uvA[(i + j * (nu + 1)) * 2], uvA[(i + j * (nu + 1)) * 2 + 1]]; }, od);
    },
    // the same in slices (the march toward the key for each vertex is the slow part)
    async surfA(nu, nv, fn, out, shadeMul, ctx) {
      const P = new Float32Array((nu + 1) * (nv + 1) * 3), lip = new Float32Array((nu + 1) * (nv + 1)), uvA = new Float32Array((nu + 1) * (nv + 1) * 2);
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const t = fn(i / nu, j / nv), k = i + j * (nu + 1), o = k * 3; P[o] = X(t[0], t[2]); P[o + 1] = y0 + t[1] * sc; P[o + 2] = Z(t[0], t[2]); lip[k] = t[3] || 0; uvA[k * 2] = t[4] || 0; uvA[k * 2 + 1] = t[5] || 0; }
      const od = dir(out[0], out[1], out[2]);
      const NV = (nu + 1) * (nv + 1), vis = new Float32Array(NV);
      for (let k = 0; k < NV; k++) { const o = k * 3; vis[k] = shadeMul * keyVis(P[o] + od[0] * 0.5, P[o + 1] + od[1] * 0.5 + 0.2, P[o + 2] + od[2] * 0.5, K); if (k % 120 === 119) await ctx.yield(); }
      await ctx.yield();
      surf(B, P, nu, nv, (i, j) => { const k = i + j * (nu + 1); return [2, vis[k], lip[k], 0, uvA[k * 2], uvA[k * 2 + 1]]; }, od);
    },
    box(u0, u1, ya, yb, w0, w1, lip = 0) {
      const f = (a, b, c, out) => F.surf(1, 1, (s, t) => { const q = a(s, t); return [q[0], q[1], q[2], lip * (b ? t : 0)]; }, out);
      f((s, t) => [u0 + (u1 - u0) * s, ya + (yb - ya) * t, w1], 1, 0, [0, 0, 1]);
      f((s, t) => [u0, ya + (yb - ya) * t, w0 + (w1 - w0) * s], 1, 0, [-1, 0, 0]);
      f((s, t) => [u1, ya + (yb - ya) * t, w0 + (w1 - w0) * s], 1, 0, [1, 0, 0]);
      f((s, t) => [u0 + (u1 - u0) * s, yb, w0 + (w1 - w0) * t], 0, 0, [0, 1, 0]);
      f((s, t) => [u0 + (u1 - u0) * s, ya + (yb - ya) * t, w0], 1, 0, [0, 0, -1]);
    },
    post(u, w, ya, yb, r, n = 8, bulge = 0) {
      F.surf(n, 3, (s, t) => { const a = s * 6.2832, rr = r * (1 + bulge * Math.sin(t * 3.1416)); return [u + Math.cos(a) * rr, ya + (yb - ya) * t, w + Math.sin(a) * rr, 0]; }, [1, 0, 0]);
    },
    // a flat silhouette: outline [[u, y], ...] counter-clockwise, extruded from w0 to w1; its edges carry the lip
    cutout(pts, w0, w1, uo = 0, yo = 0, sc = 1) {
      const n = pts.length; let cu = 0, cy = 0; for (const q of pts) { cu += q[0] / n; cy += q[1] / n; }
      for (const [w, out] of [[w1, 1], [w0, -1]]) F.surf(n, 1, (s, t) => { const q = pts[Math.round(s * n) % n]; return [uo + sc * (cu + (q[0] - cu) * t), yo + sc * (cy + (q[1] - cy) * t), w, t * t]; }, [0, 0, out]);
      F.surf(n, 1, (s, t) => { const q = pts[Math.round(s * n) % n]; return [uo + sc * q[0], yo + sc * q[1], w0 + (w1 - w0) * t, 1]; }, [pts[Math.floor(n / 2)][0] - cu, pts[Math.floor(n / 2)][1] - cy, 0]);
    },
  };
  return F;
}
// a figure under a parasol, 1.8 m tall: robe and head as one outline, the parasol as another
const FIG_BODY = [[-0.42, 0], [0.42, 0], [0.34, 0.7], [0.3, 1.25], [0.16, 1.42], [0.17, 1.6], [0.1, 1.78], [-0.1, 1.78], [-0.17, 1.6], [-0.16, 1.42], [-0.3, 1.25], [-0.34, 0.7]];
const FIG_SHADE = [[-1.05, 2.3], [-0.5, 2.22], [0.5, 2.22], [1.05, 2.3], [0.7, 2.52], [0.3, 2.64], [0, 2.72], [-0.3, 2.64], [-0.7, 2.52]];

// ---- the tray: lesser blooms and leaf islands cut from the great flower's own petals and leaves ----
// Templates in the hero's vertex layout (so its one material and program draw them): every second column and row of a
// petal's grid is kept. A bloom's origin is the root of its lowest tier, which is always seated just above the black
// guide line, so its calyx is cut in the green and its petals in the red, like everything else in the block.
const heroBuf = (nv, ni) => ({ pos: new Float32Array(nv * 3), nor: new Float32Array(nv * 3), piv: new Float32Array(nv * 3), dat: new Float32Array(nv * 4), uv: new Float32Array(nv * 3), sh: new Float32Array(nv), idx: new Uint32Array(ni), n: 0, ni: 0 });
function heroGeo(B, radius) {
  const g = new THREE.BufferGeometry(), n = B.n;
  g.setAttribute('position', new THREE.BufferAttribute(B.pos.subarray(0, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(B.nor.subarray(0, n * 3), 3));
  g.setAttribute('aPivot', new THREE.BufferAttribute(B.piv.subarray(0, n * 3), 3)); g.setAttribute('aData', new THREE.BufferAttribute(B.dat.subarray(0, n * 4), 4));
  g.setAttribute('aUv', new THREE.BufferAttribute(B.uv.subarray(0, n * 3), 3)); g.setAttribute('aShadeA', new THREE.BufferAttribute(B.sh.subarray(0, n), 1));
  g.setIndex(new THREE.BufferAttribute(B.idx.subarray(0, B.ni), 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius);
  return g;
}
const gridIdx = (B, base, nu, nv, sign) => {
  let q = B.ni; const Wd = nu + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = base + i + j * Wd, b = a + 1, c = a + Wd, d = c + 1;
    if (sign > 0) { B.idx[q] = a; B.idx[q + 1] = c; B.idx[q + 2] = b; B.idx[q + 3] = b; B.idx[q + 4] = c; B.idx[q + 5] = d; } else { B.idx[q] = a; B.idx[q + 1] = b; B.idx[q + 2] = c; B.idx[q + 3] = b; B.idx[q + 4] = d; B.idx[q + 5] = c; }
    q += 6;
  }
  B.ni = q;
};
// petals of the hero's tiers k0..8 (y measured from tier k0's root). A lesser bloom stands open for the whole flight:
// its petals carry the tier value of a thing long since released (-9, as the turned forms do), the same for all nine
function bloomPetals(B, G, k0) {
  const { nu, nv, counts, roots } = PETAL_GRID, per = (nu + 1) * (nv + 1), P = G.position.array, N = G.normal.array, V = G.aPivot.array, D = G.aData.array, U = G.aUv.array, S = G.aShadeA.array;
  const I = [], J = [0, 1, 3, 5, 7, 9].filter((j) => j <= nv); for (let i = 0; i <= nu; i += 2) I.push(i);
  let first = 0; for (let k = 0; k < k0; k++) first += counts[k];
  const y0 = roots[k0][1];
  for (let k = k0, pi = first; k < counts.length; k++) for (let m = 0; m < counts[k]; m++, pi++) for (let skin = 0; skin < 2; skin++) {
    const base = B.n, src = pi * per * 2 + skin * per;
    for (const j of J) for (const i of I) {
      const s = src + i + j * (nu + 1), v = B.n++;
      for (let c = 0; c < 3; c++) { B.pos[v * 3 + c] = P[s * 3 + c] - (c === 1 ? y0 : 0); B.nor[v * 3 + c] = N[s * 3 + c]; B.piv[v * 3 + c] = V[s * 3 + c] - (c === 1 ? y0 : 0); B.uv[v * 3 + c] = U[s * 3 + c]; }
      B.dat[v * 4] = -9; B.dat[v * 4 + 1] = D[s * 4 + 1]; B.dat[v * 4 + 2] = D[s * 4 + 2]; B.dat[v * 4 + 3] = 0.35 + 0.65 * D[s * 4 + 3]; B.sh[v] = 0.35 + 0.65 * S[s];
    }
    gridIdx(B, base, I.length - 1, J.length - 1, skin ? -1 : 1);
  }
}
// a turned form about the axis: prof [[r, y], ...] from the foot up (the hero's core kind: smooth, ruled by the stack)
function heroLathe(B, prof, na, shade) {
  const base = B.n, np = prof.length;
  for (let j = 0; j < np; j++) {
    const a = prof[Math.max(0, j - 1)], b = prof[Math.min(np - 1, j + 1)], dr = b[0] - a[0], dy = b[1] - a[1], k = 1 / Math.max(Math.hypot(dr, dy), 1e-6);
    for (let i = 0; i <= na; i++) {
      const th = (i / na) * Math.PI * 2, sx = Math.sin(th), cz = Math.cos(th), v = B.n++;
      B.pos[v * 3] = sx * prof[j][0]; B.pos[v * 3 + 1] = prof[j][1]; B.pos[v * 3 + 2] = cz * prof[j][0];
      B.nor[v * 3] = dy * k * sx; B.nor[v * 3 + 1] = -dr * k; B.nor[v * 3 + 2] = dy * k * cz;
      B.piv[v * 3] = 1; B.dat[v * 4] = -9; B.dat[v * 4 + 3] = shade; B.sh[v] = shade; B.uv[v * 3] = th * prof[j][0]; B.uv[v * 3 + 1] = prof[j][1]; B.uv[v * 3 + 2] = 1;
    }
  }
  gridIdx(B, base, na, np - 1, -1);
}
// a rosette of the hero's collar leaves, their roots moved in to radius rho (origin at the waterline)
function leafRosette(B, G, picks, rho, turn) {
  const per = 70, P = G.position.array, N = G.normal.array, D = G.aData.array, U = G.aUv.array, S = G.aShadeA.array, n = picks.length;
  picks.forEach((li, q) => {
    const r0 = li * per * 2 + 3, rx = P[r0 * 3], rz = P[r0 * 3 + 2], rr = Math.max(Math.hypot(rx, rz), 1e-4), ex = rx / rr, ez = rz / rr;      // the leaf's own axis
    const an = turn + (q / n) * Math.PI * 2, nx = Math.sin(an), nz = Math.cos(an);
    for (let skin = 0; skin < 2; skin++) {
      const base = B.n, src = li * per * 2 + skin * per;
      for (let t = 0; t < per; t++) {
        const s = src + t, v = B.n++, px = P[s * 3] - rx, pz = P[s * 3 + 2] - rz, a = px * ex + pz * ez, b = px * ez - pz * ex;
        B.pos[v * 3] = nx * (rho + a) + nz * b; B.pos[v * 3 + 1] = P[s * 3 + 1]; B.pos[v * 3 + 2] = nz * (rho + a) - nx * b;
        const qa = N[s * 3] * ex + N[s * 3 + 2] * ez, qb = N[s * 3] * ez - N[s * 3 + 2] * ex;
        B.nor[v * 3] = nx * qa + nz * qb; B.nor[v * 3 + 1] = N[s * 3 + 1]; B.nor[v * 3 + 2] = nz * qa - nx * qb;
        B.piv[v * 3] = 1; B.dat[v * 4] = -9; B.dat[v * 4 + 2] = D[s * 4 + 2]; B.dat[v * 4 + 3] = 1; B.sh[v] = 1;
        B.uv[v * 3] = U[s * 3]; B.uv[v * 3 + 1] = U[s * 3 + 1]; B.uv[v * 3 + 2] = 4;
      }
      gridIdx(B, base, 6, 9, skin ? -1 : 1);
    }
  });
}

// ---- shavings (the only birds) and the slow red rain ----
// iA: three numbers by kind, phase; iB: length, turns, kind, random. kind 0 the near flock riding the path ahead of
// the lens, 1 far flocks working the cliffs, 2 the rare event's drift, 3 the shaving at the vine's groove, 4 the well's
const CURL_VERT = /* glsl */`
attribute vec4 iA, iB;
uniform float uTime, uGrow, uRareOn, uPeel, uWellS;
uniform vec3 uFlockC, uFlockD, uWellO, uWellD, uPeelP;
varying vec3 vW, vN; varying vec2 vT;
void main() {
  float t = position.x, wd = position.y, kind = iB.z, ph = iA.w;
  vec3 c, A; float size = 1., flexOn = 1., grow = 1.;
  vec3 up = vec3(0., 1., 0.);
  if (kind < .5) {
    vec3 f = uFlockD, r = vec3(-f.z, 0., f.x);
    float wh = uTime * .22, cw = cos(wh), sw = sin(wh);
    vec2 ro = vec2(iA.x * cw - iA.y * sw, iA.x * sw + iA.y * cw);
    c = uFlockC + r * (ro.x * .56 + sin(uTime * .5 + ph)) + up * (ro.y * .48 + .85 * sin(uTime * .63 + ph * 2.)) + f * (iA.z * .26 + sin(uTime * .4 + ph * 3.));
    A = f + r * .5 * sin(uTime * .3 + ph) + up * .35 * cos(uTime * .45 + ph);
    size = uGrow;
  } else if (kind < 1.5) {
    float th = iA.x + uTime * .035 + .25 * sin(uTime * .11 + iB.w * 6.);
    float rr = iA.y + 8. * sin(uTime * .21 + ph);
    c = vec3(sin(th) * rr, iA.z + 5. * sin(uTime * .3 + th * 3. + ph), cos(th) * rr);
    A = vec3(cos(th), .3 * sin(uTime * .4 + ph), -sin(th));
  } else if (kind < 2.5) {
    c = iA.xyz + vec3(3. * sin(uTime * .31 + ph), 34. - mod(uTime * 2.6 + iB.w * 68., 68.), 3. * cos(uTime * .27 + ph));
    A = vec3(sin(ph + uTime * .2), .5, cos(ph + uTime * .2));
    size = uRareOn;
  } else if (kind < 3.5) {
    float fr = smoothstep(.62, 1., uPeel);
    c = uPeelP + vec3(-1.3 - 8. * fr, 1.6 + 3. * fr + 7. * fr * fr, 5. * fr);
    A = mix(vec3(0., 1., 0.), vec3(-.6, .5, .6), fr);
    grow = smoothstep(0., .5, uPeel); size = 1. - smoothstep(.92, 1., uPeel); flexOn = fr;
  } else {
    vec3 e1 = cross(uWellD, vec3(1., 0., 0.)); e1 /= max(length(e1), 1e-4);
    vec3 e2 = cross(uWellD, e1);
    float a = uTime * .9 + ph;
    c = uWellO + uWellD * (max(uWellS, -5.) + 7. + iA.x * 3.6) + (e1 * cos(a) + e2 * sin(a)) * (3.2 + iA.y);
    A = uWellD + (e2 * cos(a) - e1 * sin(a)) * .6;
  }
  A /= max(length(A), 1e-4);
  vec3 Bv = cross(A, vec3(.31, .9, .3)); Bv /= max(length(Bv), 1e-4);
  vec3 Cv = cross(A, Bv);
  float flex = 1. + .32 * sin(uTime * 9.42 + ph) * flexOn;                 // opening and closing 1.5 times a second
  float ang = (t - .5) * iB.y * 6.2832 * flex + ph;
  // near the lens a ribbon is finer, and every other one is gone (the groove's own shaving and the well's are left alone)
  float dn = length(cameraPosition - (modelMatrix * vec4(c, 1.)).xyz);
  float nearK = (.2 + .8 * smoothstep(16., 75., dn)) * mix(1., smoothstep(26., 48., dn), step(.5, fract(ph * 3.7)));
  if (kind > 2.5) nearK = 1.;
  if (kind < .5) nearK = smoothstep(5.5, 9.5, dn);                // the near flock: whole curls in formation, never shrunk to scraps, never in the lens
  size *= nearK;
  float len = iB.x * size, rho = len * .13 / flex;
  float w = wd * ((kind > 2.5 && kind < 3.5) ? 1.05 : (kind < .5 ? .66 : .62)) * smoothstep(0., .1, t) * (1. - smoothstep(.86, 1., t)) * min(1., size * 3.);   // the groove's own shaving is a broad one
  vec3 nrm = Bv * cos(ang) + Cv * sin(ang);
  vec3 p = c + (A * ((t - .5) * len * .95 * flex + w) + nrm * rho) * grow;
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vN = mat3(modelMatrix) * nrm; vT = vec2(t, wd * 2.);
  gl_Position = projectionMatrix * (viewMatrix * wp);
}`;
const RAIN_VERT = /* glsl */`
attribute vec4 iP;
uniform float uTime, uPx; uniform vec3 uCam;
varying float vL;
void main() {
  vec3 c = iP.xyz;
  c.xz = mod(c.xz - uCam.xz + 45., 90.) - 45. + uCam.xz;
  c.y = mod(c.y - uTime * (2.7 + .6 * iP.w) - uCam.y + 35., 70.) - 35. + uCam.y;
  float dist = length(cameraPosition - c);
  vec3 side = vec3(cameraPosition.z - c.z, 0., c.x - cameraPosition.x); side /= max(length(side), 1e-4);
  float wdt = max(.06, dist * uPx * .85) * smoothstep(2.5, 7., dist);       // never a bead in the lens
  vec3 wp = c + side * position.x * wdt + vec3(0., position.y * max(.125, wdt * 1.8), 0.);
  vL = 1. - .7 * position.x * position.x - .25 * position.y;
  gl_Position = projectionMatrix * (viewMatrix * vec4(wp, 1.));
}`;
const RAIN_FRAG = /* glsl */`
uniform vec3 cRed, uKeyCol, uLift;
varying float vL;
// a bead's light is the lit vermilion: from that at its tail (key times 0.55) to the brief's highlight, #DB4A34, at its
// head (key times 0.77) and never lighter, under the same lift as every other fragment, so the lightest warm thing in a
// frame is a lit lip or a shaving's edge and not the rain. (vL runs .25 to 1.25 over a bead; under multisampling a
// varying runs on past its range on so thin a quad: it is held to its range here)
void main() { gl_FragColor = vec4(cRed * (uKeyCol * (.5 + .216 * clamp(vL, .25, 1.25))) + uLift, 1.); }`;

// ---- three loops of build(), each a small function of its own (so long a function as build() is never optimized by
// the engine): the statements are build()'s own, in their order; what they read comes in under its own name; none of
// them yields (the yields beside them stay in build()) ----
// the petal scan: one petal's points (see THE FLANK in build()); hands back the petal's greatest reach from the heart
function petalScan(perP, tv, PGA, g, hero, LGC, LGN, rm, k, OUTER, lipTop) {
  for (let j = 0; j < perP; j++) {
    tv.fromBufferAttribute(PGA, g * perP + j).applyMatrix4(hero.object.matrixWorld);
    const cx = Math.floor(tv.x / LGC) + LGN / 2, cz = Math.floor(tv.z / LGC) + LGN / 2, r = Math.hypot(tv.x, tv.z);
    if (r > rm) rm = r;
    if (k < 2) OUTER.push(tv.x, tv.y - WATER, tv.z);
    if (cx >= 0 && cz >= 0 && cx < LGN && cz < LGN && tv.y - WATER > lipTop[cx + cz * LGN]) lipTop[cx + cz * LGN] = tv.y - WATER;
  }
  return rm;
}
// the flank line: one bearing of it (see THE FLANK'S LINE in build()); hands back the distance found
function flankLine(OUTER, ex, ez, FLANK_H, D2, best) {
  for (let j = 0; j < OUTER.length; j += 3) {
    const al = OUTER[j] * ex + OUTER[j + 2] * ez; if (al < 50) continue;
    const pe = OUTER[j] * ez - OUTER[j + 2] * ex, dy = FLANK_H - OUTER[j + 1], q = D2 - pe * pe - dy * dy;
    if (q > 0) { const R = al + Math.sqrt(q); if (R > best) best = R; }
  }
  return best;
}
// the shade texture: one row of it (key visibility at the water; inside the flower's apron its own baked petal shade)
function shadeRow(SH_W, SH_X0, SH_SX, SH_Z0, j, SH_SZ, R1, cs, sn, AD, KEY, shadeData) {
  for (let i = 0; i < SH_W; i++) {
    const x = SH_X0 + (i + 0.5) / SH_W * SH_SX, z = SH_Z0 + (j + 0.5) / SH_W * SH_SZ, r = Math.hypot(x, z);
    let sv;
    if (r > 60 && r < R1 && voidSdJS(x, z) > 0) {
      const lx = x * cs - z * sn, lz = x * sn + z * cs;
      let th = Math.atan2(lx, lz); if (th < 0) th += Math.PI * 2;
      const fi = th / (Math.PI * 2) * 96, fj = Math.pow((r - 60) / (R1 - 60), 1 / 1.5) * 26;
      const i0 = Math.min(95, Math.floor(fi)), j0 = Math.min(25, Math.floor(fj)), a = fi - i0, b = fj - j0, at = (ii, jj) => AD.getW(ii + jj * 97);
      sv = (at(i0, j0) * (1 - a) + at(i0 + 1, j0) * a) * (1 - b) + (at(i0, j0 + 1) * (1 - a) + at(i0 + 1, j0 + 1) * a) * b;
    } else sv = keyVis(x, WATER + 0.4, z, KEY);
    shadeData[i + j * SH_W] = Math.round(sat(sv) * 255);
  }
}

export default {
  id: 'hundred-layer-red',
  name: 'The Hundred-Layer Red',
  category: 'bizarre',
  weirdness: 0.9,
  media: ['air', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1));
    const vary = ctx.vary || {}, hour = vary.hour || 'any', rare = !!vary.rare, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#3a0b0a');

    // ---- the seeded look: stack, key, weather (all drawn first, from a fork, so nothing below can shift them) ----
    const vr = rng.fork('coats');
    let stack = [2, 1, 0][Math.floor(vr() * 3)], keyVar = [1, 0, 2][Math.floor(vr() * 3)], weather = [0, 2, 1][Math.floor(vr() * 3)];
    if (hour === 'dawn') keyVar = 1; else if (hour === 'day') keyVar = 2; else if (hour === 'golden') keyVar = 0;
    else if (hour === 'night') stack = 2;
    const keyElev = [18, 10, 32][keyVar] * D2R, keyAz = [194, 191, 204][keyVar] * D2R + vr.range(-6, 6) * 0.5 * D2R;   // from astern, a little to starboard: it rakes the port wall and its vine
    const KEY = new THREE.Vector3(Math.sin(keyAz) * Math.cos(keyElev), Math.sin(keyElev), Math.cos(keyAz) * Math.cos(keyElev)).normalize();
    // the key is a direction only: astern down the gorge and over the water, it comes round abeam, to the west, past the
    // pavilion, so the petals are lit or raked from the side all the way round. Land shade is baked for the
    // first, petal shade for the second; the vault keeps the first.
    const KEY_SWING = 84 * D2R, keyAt = (k, out) => { const a = keyAz + KEY_SWING * k; return out.set(Math.sin(a) * Math.cos(keyElev), Math.sin(keyElev), Math.cos(a) * Math.cos(keyElev)); };
    const KEYB = keyAt(1, new THREE.Vector3()), toLocalKey = (K, out) => out.set(K.x * Math.cos(psi) - K.z * Math.sin(psi), K.y, K.x * Math.sin(psi) + K.z * Math.cos(psi));
    const rainAmt = [1, 2.4, 0.25][weather], curlAmt = [1, 0.7, 3][weather] * density, healNear = weather === 1 ? 25 : 60, healFar = weather === 1 ? 60 : 220;

    // ---- the hero: turned about Y so that one tier-six lip and the bore suit the spiral that ends the flight ----
    // (the petals fall by seed, so the hero asks for its key once they exist: keyFor picks the lip and fixes the turn)
    const UNDER_W = 110 * D2R, A6_IDEAL = 180 * D2R;   // world azimuth of the dip under the lip; best local azimuth
    let psi = 0, a6 = A6_IDEAL;
    const hero = await buildHero(ctx, {
      detail, rain: false, apron: true, apronRadius: BASIN_R + 4, marble: stack === 1, cap: stack === 2 ? 9 : -100, canopyAz: A6_IDEAL,
      keyFor(six) {
        let best = 9;
        for (const p of six) if (p.canopy) { a6 = p.azimuth; best = -1; }
        if (best > 0) for (const p of six) { const e = Math.abs(Math.atan2(Math.sin(p.azimuth - A6_IDEAL), Math.cos(p.azimuth - A6_IDEAL))); if (e < best) { best = e; a6 = p.azimuth; } }
        psi = UNDER_W - a6;
        return { key: toLocalKey(KEYB, new THREE.Vector3()).toArray(), early: toLocalKey(KEY, new THREE.Vector3()).toArray() };
      },
    });
    hero.object.position.set(0, WATER, 0); hero.object.rotation.y = psi;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const L = (az, r, y) => pol(az + psi, r, y + WATER);          // hero-local polar (azimuth, radius, height) to world
    const along = (s) => toWorld(A.wellAxis.mouth.clone().addScaledVector(A.wellAxis.dir, s)).toArray();

    // ---- the path ----
    const W = (azDeg, r, yLocal) => pol(azDeg * D2R, r, yLocal + WATER);   // world polar round the flower
    const FB2 = (sB, aB, yLocal) => { const q = fromBridge(sB, aB); return [q[0], yLocal + WATER, q[1]]; };
    // The route is drawn as a plan of straight runs joined by arcs of a set radius (never tighter than RT), so the
    // heading never swings more than about ten degrees in a hundredth of the flight; heights are laid along it after.
    const RT = 96, co = [Math.sin(UNDER_W), Math.cos(UNDER_W)], ct = [Math.cos(UNDER_W), -Math.sin(UNDER_W)];
    const CFp = (o, t) => [co[0] * o + ct[0] * t, co[1] * o + ct[1] * t];       // the canopy's frame: metres outward, metres along the chord
    const fillet = (plan, corners) => {
      const add = (x, z) => { const l = plan[plan.length - 1]; if (!l || Math.hypot(x - l[0], z - l[1]) > 4) plan.push([x, z]); };
      const run = (ax, az, bx, bz) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 24)); for (let i = 0; i <= n; i++) add(ax + (bx - ax) * i / n, az + (bz - az) * i / n); };
      let from = corners[0];
      for (let i = 1; i < corners.length; i++) {
        const c = corners[i], nx = corners[i + 1];
        if (!nx) { run(from[0], from[1], c[0], c[1]); break; }
        let d1x = c[0] - corners[i - 1][0], d1z = c[1] - corners[i - 1][1], d2x = nx[0] - c[0], d2z = nx[1] - c[1];
        const l1 = Math.max(Math.hypot(d1x, d1z), 1e-6), l2 = Math.max(Math.hypot(d2x, d2z), 1e-6); d1x /= l1; d1z /= l1; d2x /= l2; d2z /= l2;
        const cr = d1z * d2x - d1x * d2z, th = Math.atan2(Math.abs(cr), d1x * d2x + d1z * d2z), R = c[2] || RT, tl = R * Math.tan(th / 2), sg = cr >= 0 ? 1 : -1;   // sg +1: a turn to port (left)
        const ax = c[0] - d1x * tl, az = c[1] - d1z * tl, ox = ax + sg * d1z * R, oz = az - sg * d1x * R;
        run(from[0], from[1], ax, az);
        const n = Math.max(1, Math.round(th / 0.24)), a0 = Math.atan2(ax - ox, az - oz);
        for (let k = 1; k <= n; k++) { const a = a0 + sg * th * k / n; add(ox + Math.sin(a) * R, oz + Math.cos(a) * R); }
        from = [c[0] + d2x * tl, c[1] + d2z * tl];
      }
    };
    const slotY = Math.min(A.canopy.floor + 5.0, A.canopy.under - 6.7);     // the pass is 6 m under the canopy's underside (slotY + 0.7), as the brief has it
    const FBp = (sB, aB) => fromBridge(sB, aB), P1 = FBp(19, -40);
    // the bore's heading in plan; the flight ends along it
    const mouthP = toWorld(A.wellAxis.mouth), boreW = A.wellAxis.dir.clone().transformDirection(hero.object.matrixWorld);
    const hbl = Math.max(Math.hypot(boreW.x, boreW.z), 1e-4), hb = [boreW.x / hbl, boreW.z / hbl];
    // after the canopy: one spiral to port round the flower. A wide arc (R1) from the chord's nearest point, a tighter one (R2)
    // that it touches from inside, and the bore's own line for the last sIn metres (R1 follows from the other two).
    // R2: the tight circle is the widest that keeps the lens, wherever the eye is on the whole flower, within 175 m of
    // the flower's middle, twice the radius of its rim (89 m) less a little: the far arc then lies 171.5 m from the heart,
    // and over the tongue, 59 to 67 m up, the lens has come in to 168 m (the brief's whole view, its 55 percent of the
    // frame's width, follows from that distance and the rim's size).
    // LOW: metres over the water of the run-out from the flower's outer lips until the flower stands whole or the climb
    // over the tongue must begin (inside 18 m of the water all that way)
    const R2 = 81, LOW = 16.5, norm2 = (a) => { while (a < 0) a += Math.PI * 2; while (a >= Math.PI * 2) a -= Math.PI * 2; return a; };
    // (oc: the chord's distance from the heart where it passes the canopy; phi: the chord turned so much outward there)
    const spiral = (oc, sIn, phi = 0) => {
      const T = [mouthP.x - hb[0] * sIn, mouthP.z - hb[1] * sIn], c2 = [T[0] + hb[1] * R2, T[1] - hb[0] * R2];
      const cf = Math.cos(phi), sf = Math.sin(phi), d = [ct[0] * cf + co[0] * sf, ct[1] * cf + co[1] * sf], nl = [ct[0] * sf - co[0] * cf, ct[1] * sf - co[1] * cf];   // the heading under the canopy; its port side
      const P = [co[0] * oc, co[1] * oc], qx = P[0] - c2[0], qz = P[1] - c2[1], den = 2 * (qx * nl[0] + qz * nl[1] + R2);
      const R1 = Math.abs(den) > 1e-3 ? (R2 * R2 - qx * qx - qz * qz) / den : -1;
      const c1 = [P[0] + nl[0] * R1, P[1] + nl[1] * R1], a0 = Math.atan2(-nl[0], -nl[1]);
      const aJ = Math.atan2(c2[0] - c1[0], c2[1] - c1[1]), th1 = norm2(aJ - a0), th2 = norm2(Math.atan2(T[0] - c2[0], T[1] - c2[1]) - aJ);
      return { oc, sIn, P, d, nl, a0, c1, c2, R1, aJ, th1, th2, ok: R1 > R2 + 12 && R1 < 4000 && th1 < 4.6 && th2 > 0.9 && th2 < 5.2 };
    };
    // THE CHORD UNDER THE CANOPY is square to the petal, three and a half metres inside its lip (and 42 to 47 m from the
    // heart). The bore's own line is taken as short, and the chord is turned outward by as little, as lets the wide arc
    // meet the tight circle.
    const lipR = Math.hypot(A.canopy.lip.x, A.canopy.lip.z), OC = Math.min(47, Math.max(42, lipR - 3.5));
    let S = null;
    for (let tries = 0, sI = 40; tries < 12 && !S; tries++, sI += 14) for (let k = 0; k <= 12 && !S; k++) { const sp = spiral(OC, sI, k * 2 * D2R); if (sp.ok && sp.R1 < 1500) S = sp; }
    if (!S) S = spiral(OC, 96, 0);
    // THE FLANK (the brief's journey D and E): from the bridge the flight rounds the north-west of the flower on a line
    // drawn from its outer petals (see THE FLANK'S LINE below), low over the water; then it turns in on a circle (RHO)
    // that touches both that line's end and the chord, climbing the flower's own slope over the lips of each tier in
    // turn, to the pass under the canopy. Nowhere on it is the lens further than 18 m from the carving.
    // (what the flank is measured from: the mean reach of the outermost lips; and, over each 2 m cell of the plan, the
    // highest point of the petals of tiers one to five, so that the flight can be kept clear above every lip it crosses)
    const LGN = 120, LGC = 2, lipTop = new Float32Array(LGN * LGN).fill(-99);
    let lip1 = 0;
    const OUTER = [];                                                        // every point of the petals of tiers one and two: x, metres over the water, z
    {
      const PGA = hero.parts.petals.geometry.attributes.position, perP = (PETAL_GRID.nu + 1) * (PETAL_GRID.nv + 1) * 2, tv = new THREE.Vector3();
      for (let k = 0, g = 0; k < 5; k++) {
        for (let m = 0; m < PETAL_GRID.counts[k]; m++, g++) {
          let rm = 0;
          rm = petalScan(perP, tv, PGA, g, hero, LGC, LGN, rm, k, OUTER, lipTop);
          if (k === 0) lip1 += rm / PETAL_GRID.counts[0];
        }
        await ctx.yield();
      }
    }
    // the height over the water at which a point over (x, z) is c metres clear of all of them
    const lipClear = (x, z, c) => {
      let need = -99; const rad = c + 1.45, i0 = Math.floor((x - rad) / LGC) + LGN / 2, i1 = Math.floor((x + rad) / LGC) + LGN / 2, j0 = Math.floor((z - rad) / LGC) + LGN / 2, j1 = Math.floor((z + rad) / LGC) + LGN / 2;
      for (let j = Math.max(0, j0); j <= Math.min(LGN - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(LGN - 1, i1); i++) {
        const top = lipTop[i + j * LGN]; if (top < -90) continue;
        const h = Math.max(0, Math.hypot((i - LGN / 2 + 0.5) * LGC - x, (j - LGN / 2 + 0.5) * LGC - z) - 1.45); if (h >= c) continue;
        need = Math.max(need, top + Math.sqrt(c * c - h * h));
      }
      return need;
    };
    // THE CANOPY'S PLAN: the one-metre cells of the water that the canopy petal stands over (its own mesh, laid flat), so
    // the flight can tell where its edge passes overhead
    const CGN = 96, canPlan = new Uint8Array(CGN * CGN), canMid = toWorld(A.canopy.lip);
    {
      const PGA = hero.parts.petals.geometry.attributes.position, nu = PETAL_GRID.nu + 1, nv = PETAL_GRID.nv + 1, perP = nu * nv * 2, tv = new THREE.Vector3();
      let g6 = 0; for (let k = 0; k < 5; k++) g6 += PETAL_GRID.counts[k];
      let gc = g6, bd = 1e9;
      for (let m = 0; m < PETAL_GRID.counts[5]; m++) { tv.fromBufferAttribute(PGA, (g6 + m) * perP + PETAL_GRID.nu / 2 + PETAL_GRID.nv * nu); const d = tv.distanceTo(A.canopy.lip); if (d < bd) { bd = d; gc = g6 + m; } }
      const q = [];
      for (let j = 0; j < nu * nv; j++) { tv.fromBufferAttribute(PGA, gc * perP + j).applyMatrix4(hero.object.matrixWorld); q.push(tv.x, tv.z); }
      for (let j = 0; j < nv - 1; j++) for (let i = 0; i < nu - 1; i++) {
        const a = (j * nu + i) * 2, b = a + 2, c = a + nu * 2, d = c + 2;
        for (let v = 0; v <= 6; v++) for (let u = 0; u <= 3; u++) {
          const fu = u / 3, fv = v / 6, x = (q[a] * (1 - fu) + q[b] * fu) * (1 - fv) + (q[c] * (1 - fu) + q[d] * fu) * fv, z = (q[a + 1] * (1 - fu) + q[b + 1] * fu) * (1 - fv) + (q[c + 1] * (1 - fu) + q[d + 1] * fu) * fv;
          const cx = Math.floor(x - canMid.x) + CGN / 2, cz = Math.floor(z - canMid.z) + CGN / 2;
          if (cx >= 0 && cz >= 0 && cx < CGN && cz < CGN) canPlan[cx + cz * CGN] = 1;
        }
      }
    }
    const underCanopy = (x, z) => { const cx = Math.floor(x - canMid.x) + CGN / 2, cz = Math.floor(z - canMid.z) + CGN / 2; return cx >= 0 && cz >= 0 && cx < CGN && cz < CGN && canPlan[cx + cz * CGN] === 1; };
    await ctx.yield();
    const OVER = 5;
    // THE FLANK'S LINE is drawn from the petals themselves. Round the flower, a degree at a time: the distance from the
    // heart at which a point FLANK_H over the water is exactly FLANK_D metres from the nearest outer petal (every point of
    // the petals of tiers one and two). The crests of that outline are joined over the notches between petals (the
    // greatest within FLANK_J degrees either side, about 21 m of the arc) and the joined line is eased (twice a mean
    // over FLANK_E degrees either side), so the flight is nowhere nearer than FLANK_D to a petal, passes the lips that
    // reach furthest at just that distance, and does not weave: abeam of a notch between two petals the nearest lip is
    // further off by the depth of the notch.
    const FLANK_D = 12.2, FLANK_H = 16, FLANK_J = 12, FLANK_E = 6;
    // (where the line from the pavilion pass touches a circle of radius Rs about the heart, the circle to port of it; and
    // the turn-in circle: RHO to port of the chord, touching from inside a circle of radius Re about the heart; it
    // touches the chord tct metres before the canopy. RHO is as wide as the flank and the chord allow, 73 m at most:
    // half the sum of their distances from the heart is the widest circle that touches both)
    const flankEnds = (Rs, Re) => {
      const RHO = Math.min(73, (Re + OC) / 2 - 0.3);
      const qx = S.P[0] + S.nl[0] * RHO, qz = S.P[1] + S.nl[1] * RHO, qd = qx * S.d[0] + qz * S.d[1];
      const tct = -qd - Math.sqrt(Math.max(qd * qd - (qx * qx + qz * qz - (Re - RHO) * (Re - RHO)), 0)), tcc = [qx + S.d[0] * tct, qz + S.d[1] * tct];
      const dl = Math.hypot(P1[0], P1[1]), ta = Math.atan2(-P1[0], -P1[1]) - Math.asin(Math.min(1, Rs / dl)), tl = Math.sqrt(Math.max(dl * dl - Rs * Rs, 0));
      const E = [P1[0] + Math.sin(ta) * tl, P1[1] + Math.cos(ta) * tl];
      return { tct, tcc, E, e0: Math.atan2(E[0], E[1]), aT: Math.atan2(tcc[0], tcc[1]), Rs, Re, RHO };
    };
    let FE = flankEnds(lip1 + 11, lip1 + 11);
    const FA0 = FE.e0 - (FLANK_J + FLANK_E + 8) * D2R, FAN = Math.ceil(norm2(FE.aT - FE.e0) / D2R) + 2 * (FLANK_J + FLANK_E + 8), flankR = new Float32Array(FAN + 1);
    {
      const E = new Float32Array(FAN + 1), J = new Float32Array(FAN + 1), D2 = FLANK_D * FLANK_D;
      for (let i = 0; i <= FAN; i++) {
        const a = FA0 + i * D2R, ex = Math.sin(a), ez = Math.cos(a); let best = lip1;
        best = flankLine(OUTER, ex, ez, FLANK_H, D2, best);
        E[i] = best;
        if (i % 6 === 5) await ctx.yield();
      }
      for (let i = 0; i <= FAN; i++) { let m = 0; for (let k = -FLANK_J; k <= FLANK_J; k++) m = Math.max(m, E[Math.min(FAN, Math.max(0, i + k))]); J[i] = m; }
      for (let pass = 0; pass < 2; pass++) {
        const src = pass ? flankR.slice() : J;
        for (let i = 0; i <= FAN; i++) { let a = 0; for (let k = -FLANK_E; k <= FLANK_E; k++) a += src[Math.min(FAN, Math.max(0, i + k))]; flankR[i] = a / (2 * FLANK_E + 1); }
      }
    }
    const flankAt = (a) => { const x = norm2(a - FA0) / D2R, i = Math.max(0, Math.min(FAN - 1, Math.floor(x))); return flankR[i] + (flankR[i + 1] - flankR[i]) * sat(x - i); };
    // (the line begins and ends level, on the greatest radius of its first and last six degrees, so the straight from the
    // pavilion and the turn-in circle both touch it)
    for (let it = 0; it < 3; it++) {
      let Rs = 0, Re = 0;
      for (let k = 0; k <= 6; k++) { Rs = Math.max(Rs, flankAt(FE.e0 + k * D2R)); Re = Math.max(Re, flankAt(FE.aT - k * D2R)); }
      FE = flankEnds(Rs, Re);
    }
    await ctx.yield();
    // ---- the tray: what stands in the water round the peony (listed here, placed after the path, built further down) ----
    // lesser blooms (kind 'A' three tiers, 'B' two), lidded boxes and jars, leaf islands; [kind, x, z, size, turn]
    const AZ = (azDeg, r) => [Math.sin(azDeg * D2R) * r, Math.cos(azDeg * D2R) * r];
    const K2A = [-15, -131], K2B = fromBridge(18.3, -30);                     // the low causeway: from a leaf island by the gorge's mouth to the pavilion's terrace
    const TRAY0 = [
      ['A', -70, -158, 0.31, 0.4], ['B', 52, -138, 0.42, 1.9], ['A', -122, -112, 0.32, 2.7], ['B', ...AZ(60, 160), 0.45, 0.8], ['A', ...AZ(325, 178), 0.31, 4.1],
      ['B', ...AZ(5, 174), 0.46, 3.0], ['A', ...AZ(100, 162), 0.28, 5.2], ['B', ...AZ(293, 174), 0.41, 0.2], ['A', ...AZ(140, 168), 0.3, 1.1],
      ['box', 24, -184, 4.6, 12.6], ['box', 33.5, -170, 3.1, 10.2], ['box', -24, -190, 3.8, 11.6],
      ['box', -39.3, -97.6, 4.2, 12.2], ['box', -70.3, -72.6, 3.4, 11.0],
      ['box', ...AZ(318, 107), 4.4, 12.4], ['box', ...AZ(325, 110), 2.8, 9.4], ['box', ...AZ(346, 108), 3.6, 11.4], ['box', ...AZ(11, 106), 4.8, 12.8], ['box', ...AZ(17, 109), 3.0, 9.8],
      ['box', ...AZ(160, 112), 3.8, 11.8], ['box', ...AZ(206, 150), 4.4, 12.4], ['box', ...AZ(213, 152), 2.9, 9.6],
      ['isle', K2A[0] + 2, K2A[1] - 7, 0.46, 0.5], ['isle', 12, -143, 0.36, 2.0], ['box', 8, -127, 3.2, 10.4], ['isle', -74, -71, 0.32, 1.7], ['isle', 1, -233, 0.3, 2.9], ['isle', -13, -212, 0.26, 4.4], ['isle', 15, -200, 0.24, 1.0], ['box', 21.5, -221, 2.8, 9.4], ['isle', 4, -160, 0.3, 3.6], ['isle', ...AZ(333, 109), 0.3, 1.2], ['isle', ...AZ(2, 108), 0.34, 2.2], ['isle', ...AZ(172, 126), 0.36, 0.2], ['isle', ...AZ(286, 136), 0.36, 3.3],
      ['isle', ...AZ(232, 118), 0.3, 4.0], ['isle', ...AZ(84, 122), 0.34, 5.0], ['isle', ...AZ(128, 124), 0.3, 1.5],
    ];
    for (const t of TRAY0) { t.R = t[0] === 'A' ? 28 * t[3] : t[0] === 'B' ? 19.5 * t[3] : t[0] === 'box' ? t[3] * 1.1 : 24 * t[3]; t.H = t[0] === 'box' ? t[4] : t[0] === 'isle' ? 3 : 6.9 + (t[0] === 'A' ? 13.2 : 9.7) * t[3]; }
    // THE ENTRY (the brief's journey A): in the gorge, on its line, where the flower's near lips stand 300 m ahead.
    const START_Z = Math.max(GORGE_Z0 + 80, -(300 + lip1));
    const plan = [], hgt = [], tail = [], tightY = [];                                   // plan samples [x, z]; height anchors [x, z, y over the water]; the tight part's own heights
    const spAt = (f) => { const a = S.a0 + S.th1 * f; return [S.c1[0] + Math.sin(a) * S.R1, S.c1[1] + Math.cos(a) * S.R1]; };      // along the wide arc
    const chord = (t) => [S.P[0] + S.d[0] * t, S.P[1] + S.d[1] * t];                                                                    // along the chord, metres past the canopy
    // THE TIGHT PART of the spiral is in three pieces: the tight circle (R2 about c2) from the wide arc to its apex, the
    // place furthest from the heart; an arc ABOUT THE HEART at that distance (`flat` radians of it, found below: the run-out
    // keeps its greatest distance until the eye bears on the flower, so nothing before the first whole view is further
    // out than it: the arc lies 0.2 m outside the apex, a margin over the curve's own rounding between its ten-metre
    // places); and a second tight arc (radius R3 about c3) that touches both that arc and the bore's line.
    const tight = (flat) => {
      const aA = Math.atan2(S.c2[0], S.c2[1]), thA = Math.min(norm2(aA - S.aJ), S.th2), RA = Math.hypot(S.c2[0], S.c2[1]) + R2 + 0.2;
      if (!(flat > 0) || thA >= S.th2) return { flat: 0, thA, RA, aA, R3: R2, c3: S.c2, sIn: S.sIn, L1: R2 * thA, L2: 0, L3: R2 * (S.th2 - thA) };
      const aE = S.aJ + S.th2, p = [-Math.sin(aE), -Math.cos(aE)];                                                        // from the bore's line to the circle's centre
      const A3 = [Math.sin(aA + flat), Math.cos(aA + flat)], Ap = A3[0] * p[0] + A3[1] * p[1], mp = mouthP.x * p[0] + mouthP.z * p[1];
      const R3 = (RA * Ap - mp) / (1 + Ap), c3 = [A3[0] * (RA - R3), A3[1] * (RA - R3)];
      return { flat, thA, RA, aA, R3, c3, sIn: (mouthP.x - (c3[0] - p[0] * R3)) * hb[0] + (mouthP.z - (c3[1] - p[1] * R3)) * hb[1], L1: R2 * thA, L2: RA * flat, L3: R3 * (S.th2 - thA - flat) };
    };
    let TI = tight(0);
    const tightAt = (len) => {                                                                                              // metres along the tight part
      if (len <= TI.L1) { const a = S.aJ + len / R2; return [S.c2[0] + Math.sin(a) * R2, S.c2[1] + Math.cos(a) * R2]; }
      if (len <= TI.L1 + TI.L2) { const a = TI.aA + (len - TI.L1) / TI.RA; return [Math.sin(a) * TI.RA, Math.cos(a) * TI.RA]; }
      const a = TI.aA + TI.flat + (len - TI.L1 - TI.L2) / TI.R3; return [TI.c3[0] + Math.sin(a) * TI.R3, TI.c3[1] + Math.cos(a) * TI.R3];
    };
    const inAt = (f) => tightAt(f * (TI.L1 + TI.L2 + TI.L3));                                                               // along the tight part, by its share
    // THE EYE'S SWING (see the gaze below) begins where the canopy's edge passes overhead and turns to port SWING degrees
    // for every metre flown; worked out here in plan, on the line of the flight itself (a place every 2.5 m), to find
    // where it first bears on what it is to rest on: lipXZ (where the swing begins), lowEnd (metres along the tight part
    // where the flower stands whole and the low run-out ends)
    const SWING = 0.7, OUT = 4, EYE_AHEAD = 30, BR_MID = fromBridge(23, 0);
    let lipXZ = null, lowEnd = 0;
    let iF = 0, iT = 0, iW = 0;                                                           // the flank begins, the turn-in begins, the wide arc ends: plan samples
    {
      // gorge (well clear of both walls), out over the water with the flower to port, close by the pavilion and square over
      // the bridge; then round the flank, and in under the canopy
      const { tct, tcc, E, e0, aT, RHO } = FE;
      fillet(plan, [[6.5, START_Z], [5, -153, 110], [P1[0], P1[1], 110], E]);          // straight down the gorge to its mouth, then round to starboard
      iF = plan.length;
      // the flank: a place every three degrees of the petals' own line (eased onto its level ends over six degrees)
      const sw = norm2(aT - e0), na = Math.max(2, Math.round(sw / (3 * D2R)));
      const flankXZ = (a) => { const t = norm2(a - e0), f = flankAt(a), R = f + (FE.Rs - f) * (1 - sstep(0, 6 * D2R, t)) + (FE.Re - f) * sstep(sw - 6 * D2R, sw, t); return [Math.sin(a) * R, Math.cos(a) * R]; };
      for (let k = 1; k <= na; k++) plan.push(flankXZ(e0 + sw * k / na));
      iT = plan.length - 1;
      const sw2 = norm2(S.a0 - aT), nb = Math.max(2, Math.round(sw2 / 0.17));
      for (let k = 1; k <= nb; k++) { const a = aT + sw2 * k / nb; plan.push([tcc[0] + Math.sin(a) * RHO, tcc[1] + Math.cos(a) * RHO]); }
      plan.push(chord(0));
      const arcAt = (f) => flankXZ(e0 + sw * f);
      const inDeg = (deg) => { const a = aT + Math.min(sw2, deg * D2R); return [tcc[0] + Math.sin(a) * RHO, tcc[1] + Math.cos(a) * RHO]; };   // so many degrees round the turn-in
      const n1 = Math.max(2, Math.round(S.th1 * S.R1 / 12));
      for (let k = 1; k <= n1; k++) plan.push(spAt(k / n1));
      iW = plan.length - 1;
      hgt.push([6.5, START_Z, 17], [6, -256, 16.6], [5, -206, 14.5], [-30, -128, 10.6], [-76, -91, 9.8], [P1[0], P1[1], 13.5], [...FBp(8, 0), 16.5], [...arcAt(0), 16], [...arcAt(0.5), 15.5], [...arcAt(1), 16.5],
        [...inDeg(30), 21], [...inDeg(60), 29.5], [...inDeg(90), 37], [...inDeg(115), slotY + 3.2],
        [...chord(tct), slotY + 1.8], [...chord(-2), slotY + 0.7], [...chord(10), slotY + 0.9], [...chord(24), slotY + 1.8], [...spAt(0.55), 30], [...spAt(1), LOW]);
      // the eye's swing, in plan: the line of the flight from the start of the turn-in, a place every 2.5 m (the turn-in
      // circle, the chord, the wide arc, the tight circle to its apex, and on round the heart at that distance)
      const X = [], Z = [], put = (q) => { X.push(q[0]); Z.push(q[1]); }, ST = 2.5;
      for (let l = 0; l < RHO * sw2; l += ST) { const a = aT + l / RHO; put([tcc[0] + Math.sin(a) * RHO, tcc[1] + Math.cos(a) * RHO]); }
      for (let t = tct; t < 0; t += ST) put(chord(t));
      for (let l = 0; l < S.R1 * S.th1; l += ST) put(spAt(l / (S.R1 * S.th1)));
      const iTight = X.length;
      for (let l = 0; l < TI.L1; l += ST) put(tightAt(l));
      const iApex = X.length, FLAT_MAX = 14 * D2R;
      for (let l = 0; l <= TI.RA * FLAT_MAX + EYE_AHEAD + ST; l += ST) { const a = TI.aA + l / TI.RA; put([Math.sin(a) * TI.RA, Math.cos(a) * TI.RA]); }
      const nA = Math.round(EYE_AHEAD / ST), yawOf = (i) => Math.atan2(X[i + nA] - X[i], Z[i + nA] - Z[i]);
      let iLip = 0; while (iLip < iTight - 1 && !underCanopy(X[iLip], Z[iLip])) iLip++;
      lipXZ = [X[iLip], Z[iLip]];
      let iArr = X.length - nA - 1, prev = 0;
      for (let i = iLip; i < X.length - nA; i++) {
        const kb = 0.5 * sstep(OC, lip1, Math.hypot(X[i], Z[i])), yt = Math.atan2(BR_MID[0] * kb - X[i], BR_MID[1] * kb - Z[i]), y0 = yawOf(iLip);
        let dy = yt - y0; dy -= Math.PI * 2 * Math.round((dy - prev) / (Math.PI * 2)); if (i === iLip && dy < -0.5) dy += Math.PI * 2;      // the flower is taken round to port
        prev = dy;
        if (SWING * D2R * (i - iLip) * ST >= dy + OUT * D2R) { iArr = i; break; }
      }
      // (eight metres more, so the flower stands whole before the turn in and the climb begin; the second tight arc is
      // never tighter than 75 m, and the arc about the heart never longer than 14 degrees: it ends short of the tongue of
      // uncut block the pavilion stands on)
      let flat = iArr > iApex ? Math.min(FLAT_MAX, ((iArr - iApex) * ST + 8) / TI.RA) : 0;
      while (flat > 0 && !(tight(flat).R3 >= 75 && tight(flat).L3 > 60 && tight(flat).sIn > 8)) flat = Math.max(0, flat - D2R);
      TI = tight(flat);
      lowEnd = Math.max(0, (iArr - iTight) * ST + 8);
    }
    {
      // the last of it: one arc of pitch (radius RP) down to the bore's 63 degrees, laid along the plan's own line: its first,
      // gentle part still rides the end of the tight circle (bq0 metres back from the mouth, more than sIn), the steep part is
      // in the bore's own vertical plane
      const RP = 104, P0 = -18 * D2R, PB = Math.asin(Math.min(1, Math.max(-1, -boreW.y))), sIn = TI.sIn;
      const T = new THREE.Vector3().fromArray(along(-4)), h = new THREE.Vector3(hb[0], 0, hb[1]), up = new THREE.Vector3(0, 1, 0);
      const C = T.clone().addScaledVector(h, -RP * Math.sin(PB)).addScaledVector(up, -RP * Math.cos(PB));
      const at = (ph) => C.clone().addScaledVector(h, RP * Math.sin(ph)).addScaledVector(up, RP * Math.cos(ph));    // pitch ph below level
      const q0 = at(P0), n = 7, arcL = TI.L1 + TI.L2 + TI.L3;
      const backOf = (q) => (mouthP.x - q.x) * hb[0] + (mouthP.z - q.z) * hb[1];              // metres back from the mouth, in plan
      const planBack = (b) => (b <= sIn ? [mouthP.x - hb[0] * b, mouthP.z - hb[1] * b] : inAt(Math.max(0, 1 - (b - sIn) / arcL)));
      const bq0 = backOf(q0), fEnd = bq0 > sIn ? Math.max(0.2, 1 - (bq0 - sIn) / arcL) : 1;
      // the tight circle stops where the pitch arc begins (or runs on to the bore's line and a straight run-in, if sIn is long)
      const n2 = Math.max(2, Math.round(arcL * fEnd / 10));                                       // a place every ten metres
      for (let k = 1; k <= n2; k++) plan.push(inAt(fEnd * k / n2));
      const gap = Math.max(0, sIn - bq0);                                                        // the straight run from the turn to the arc
      const hA = q0.y - WATER + gap * Math.tan(P0);
      // LOW until the flower stands whole (lowEnd); then THE CLIMB, from level there to the pitch arc's own slope and
      // height where the plan ends (cubics in the distance flown: no flat, no step). THE TONGUE of uncut block the
      // pavilion stands on lies across the spiral, and the flight goes over its top: where the plan comes to the
      // tongue's edge (dT) the lens is as far over the block's top as it flies from the petals of the flank (FLANK_D),
      // and the climb is in two curves that meet there on one slope: up to the edge, and on from it. The first is never
      // steeper than CLIMB (one in one): where the flower stands whole too near the tongue for that, the climb begins
      // as much sooner as that slope needs, and only then.
      const CLIMB = 1, dE = arcL * fEnd, H_T = FLANK_D - WATER;
      let dT = -1; for (let l = 0; l < dE; l += 1) { const q = inAt(l / arcL); if (voidSdJS(q[0], q[1]) <= 0) { dT = l; break; } }
      let d0 = Math.min(0.8 * dE, lowEnd), s2 = 0, m = 0;
      if (dT > 0 && hA > H_T) {
        s2 = (hA - H_T) / (dE - dT);
        const steep = (L) => { const k = Math.min(1.4, s2 * L / (H_T - LOW)); return (H_T - LOW) / L * (3 - k) * (3 - k) / (3 * (2 - k)); };       // the cubic's greatest slope over a run L
        let L1 = Math.max(10, dT - d0); while (steep(L1) > CLIMB && L1 < dT) L1 += 1;
        d0 = Math.max(0, dT - L1); m = Math.min(1.4, s2 * (dT - d0) / (H_T - LOW));
      } else dT = -1;
      const a2 = Math.min(1.4, Math.tan(-P0) * (dE - Math.max(dT, d0)) / Math.max(hA - (dT > 0 ? H_T : LOW), 1));
      const climbAt = (l) => {                                                                    // metres over the water, l metres along the tight part
        if (l <= d0) return LOW;
        if (dT > 0 && l < dT) { const x = (l - d0) / (dT - d0); return LOW + (H_T - LOW) * ((3 - m) * x * x + (m - 2) * x * x * x); }
        if (dT > 0) { const x = Math.min(1, (l - dT) / (dE - dT)); return H_T + (hA - H_T) * (x + (1 - a2) * x * x + (a2 - 1) * x * x * x); }
        const x = Math.min(1, (l - d0) / (dE - d0)); return LOW + (hA - LOW) * ((3 - a2) * x * x + (a2 - 2) * x * x * x);
      };
      for (let k = 1; k <= n2; k++) tightY.push(climbAt(dE * k / n2));
      hgt.push([...inAt(d0 / arcL * 0.5), LOW]);
      for (const x of [0.25, 0.5, 0.75]) hgt.push([...inAt(fEnd * x), climbAt(dE * x)]);
      hgt.push([plan[plan.length - 1][0], plan[plan.length - 1][1], hA]);
      const ng = Math.floor(gap / 24);
      for (let k = 1; k <= ng; k++) { const back = gap * (1 - k / (ng + 1)), m = q0.clone().addScaledVector(h, -back); tail.push([m.x, m.y + back * Math.tan(P0), m.z]); }
      for (let k = (gap > 0 ? 0 : 1); k < n; k++) { const q = at(P0 + (PB - P0) * k / n), pb = planBack(backOf(q)); tail.push([pb[0], q.y, pb[1]]); }
      tail.push(along(-4), along(14), along(38), along(62));
    }
    // heights: each anchor sits at the plan sample nearest to it; between anchors a straight slope, then smoothed
    const pts = [];
    {
      const np = plan.length, Sd = new Float32Array(np), Y = new Float32Array(np), st = [];
      for (let i = 1; i < np; i++) Sd[i] = Sd[i - 1] + Math.hypot(plan[i][0] - plan[i - 1][0], plan[i][1] - plan[i - 1][1]);
      let lo = 0;
      for (const hq of hgt) { let bi = lo, bd = 1e12; for (let i = lo; i < np && Sd[i] - Sd[bi] < 220; i++) { const dd = (plan[i][0] - hq[0]) ** 2 + (plan[i][1] - hq[1]) ** 2; if (dd < bd) { bd = dd; bi = i; } } st.push([Sd[bi], hq[2]]); lo = bi; }   // (the nearest within the next 220 m: the spiral crosses the early legs in plan)
      st[st.length - 1][0] = Sd[np - 1];
      for (let i = 0, k = 0; i < np; i++) { while (k < st.length - 2 && Sd[i] > st[k + 1][0]) k++; const f = sat((Sd[i] - st[k][0]) / Math.max(st[k + 1][0] - st[k][0], 1e-3)); Y[i] = st[k][1] + (st[k + 1][1] - st[k][1]) * f; }
      for (let pass = 0; pass < 2; pass++) { let prev = Y[0]; for (let i = 1; i < np - 1; i++) { const v = (prev + 2 * Y[i] + Y[i + 1]) / 4; prev = Y[i]; Y[i] = v; } }
      for (let k = 0; k < tightY.length; k++) Y[iW + 1 + k] = tightY[k];                    // (the tight part: the climb's own curve, as written)
      // over the lips: from the flank to the spiral the flight is nowhere nearer than OVER metres to a petal of the tiers under
      // it (the pass itself is set by the canopy: slotY)
      for (let i = iF; i <= iW; i++) Y[i] = Math.max(Y[i], lipClear(plan[i][0], plan[i][1], OVER));
      for (let i = iF + 1; i < iW; i++) if (Math.hypot(plan[i][0] - S.P[0], plan[i][1] - S.P[1]) > 16) Y[i] = Math.max(Y[i], (Y[i - 1] + 2 * Y[i] + Y[i + 1]) / 4);
      // from the canopy out to the spiral's low arc the flight is low over the water and is lifted for nothing: a bloom
      // or box of the tray that would stand in its way is the one that moves (below, where the tray is placed)
      for (let i = Math.max(iF + 1, iW - 5); i < np - 1; i++) Y[i] = Math.max(Y[i], (Y[i - 1] + 2 * Y[i] + Y[i + 1]) / 4);      // (eased by filling, never by lowering)
      for (let i = 0; i < np; i++) pts.push([plan[i][0], Y[i] + WATER, plan[i][1]]);
      for (const q of tail) pts.push(q);
      // the crest of the climb is eased: the flight is nowhere higher than 100 m over the water
      for (const q of pts) q[1] -= 1.8 * sstep(72, 100, q[1] - WATER);
    }
    await ctx.yield();
    const path = makePath(pts), LEN = path.length;
    const turnAt = spAt(1), slotXZ = chord(-3), turnInAt = plan[Math.min(plan.length - 1, iT)];
    await ctx.yield();
    // ---- the tray is placed. Nothing stands within twelve metres of the flight (unless the flight is well above it): a
    // piece that would is moved along its own line from the flower's heart, out or in, to the nearest place that is clear
    // (two metres at a time: a box twelve at most, and left out if there is none; a lesser bloom as far as thirty, so
    // that all nine stand on every seed). Leaf islands lie flat on the water and are flown over.
    const PS = []; { const tp = new THREE.Vector3(); for (let d = 0; d <= LEN; d += 2.5) { path.posAtDist(d, tp); PS.push(tp.x, tp.y - WATER, tp.z); } }      // the flight, a place every 2.5 m
    const clearOf = (x, z, R, H) => { for (let i = 0; i < PS.length; i += 3) if (PS[i + 1] < H + 9 && Math.hypot(PS[i] - x, PS[i + 2] - z) < R + 12) return false; return true; };
    const TRAY = TRAY0.filter((t) => {
      const R = t.R, H = t.H;
      const fits = (x, z) => voidSdJS(x, z) > R * 0.6 + 2 && terraceSdJS(x, z) > R * 0.6 + 2 && Math.hypot(x, z) > 96 + R * 0.5 && (t[0] === 'isle' || clearOf(x, z, R * (t[0] === 'box' ? 1 : 0.8), H));
      const r0 = Math.max(Math.hypot(t[1], t[2]), 1);
      for (let k = 0, kn = t[0] === 'A' || t[0] === 'B' ? 30 : 12; k <= kn; k++) { const m = (r0 + (k & 1 ? k + 1 : -k)) / r0, x = t[1] * m, z = t[2] * m; if (fits(x, z)) { t[1] = x; t[2] = z; return true; } }
      return false;
    });
    await ctx.yield();
    // the moments of the flight, found on the path itself (so they hold on every seed): each is the place where the
    // route first passes a point of the world, looked for every 2 m from the moment before it (the search is over once
    // the route has been within 3 m of the point and is 30 m off again); the u of each falls where the route puts it
    const uNear = (x, z, m0) => { const tp = new THREE.Vector3(); let bd = 1e12, bm = m0; for (let d = m0; d <= LEN; d += 2) { path.posAtDist(d, tp); const dd = (tp.x - x) ** 2 + (tp.z - z) ** 2; if (dd < bd) { bd = dd; bm = d; } else if (bd < 9 && dd > 900) break; } return bm / LEN; };
    const uGorge = uNear(5, -206, 0), uPav = uNear(P1[0], P1[1], uGorge * LEN), uBridge = uNear(...FBp(8, 0), uPav * LEN);
    await ctx.yield();
    const uTurnIn = uNear(...turnInAt, uBridge * LEN), uSlot = uNear(...slotXZ, uTurnIn * LEN);
    const uTurn = uNear(...turnAt, uSlot * LEN), uMouth = 1 - 62 / LEN, uIn = uMouth - (TI.sIn + 10) / LEN, slotAt = [slotXZ[0], slotY + 0.7 + WATER, slotXZ[1]];
    // where the canopy's edge passes overhead (found in plan above), as metres from the start; and where the lens comes
    // in over the reach of the flower's outermost lips on the turn in (dOver) and is out past it again after the pass (dOut)
    const dLip = uNear(lipXZ[0], lipXZ[1], uTurnIn * LEN) * LEN;
    let dOver = dLip, dOut = dLip;
    for (let k = Math.ceil(uTurnIn * LEN / 2.5); k * 3 < PS.length && k * 2.5 < dLip; k++) if (Math.hypot(PS[k * 3], PS[k * 3 + 2]) < lip1) { dOver = k * 2.5; break; }
    for (let k = Math.ceil(dLip / 2.5); k * 3 < PS.length; k++) if (Math.hypot(PS[k * 3], PS[k * 3 + 2]) > lip1) { dOut = k * 2.5; break; }
    await ctx.yield();
    const bump = (a, b, c, d, u) => sstep(a, b, u) * (1 - sstep(c, d, u));
    // the pace hurries the gorge (the hurry comes on over the first width of the gorge flown), lingers on the turn in and under the canopy, and picks up round the spiral and down to the well
    const paceOf = (u) => 1 + 0.22 * bump(0, 2 * GORGE_W / LEN, uGorge - 0.02, uGorge + 0.04, u) - 0.3 * bump(uSlot - 0.13, uSlot - 0.05, uSlot + 0.015, uSlot + 0.06, u) + 0.16 * bump(uTurn - 0.02, uTurn + 0.05, uIn + 0.01, uMouth - 0.01, u);
    // THE FLOWER'S CLOCK (its tiers come free at .34, .40 ... .82 of it) runs on the seconds of the flight: the first tier
    // comes free as the lens passes the pavilion, and one more every three and a half seconds after it, at one even
    // rate all the way to the dive; from there it runs out to the end
    const PN = Math.ceil(LEN / 3), PROG = new Float32Array(PN + 1);      // (a value every PN-th of the route: about 3 m)
    {
      const T = new Float32Array(PN + 1); for (let i = 1; i <= PN; i++) T[i] = T[i - 1] + 1 / paceOf((i - 0.5) / PN);
      const sec = (u) => { const x = sat(u) * PN, i = Math.min(PN - 1, Math.floor(x)); return (T[i] + (T[i + 1] - T[i]) * (x - i)) * 50 / T[PN]; };
      const t1 = sec(uPav), at = (u) => { const t = sec(u); return t < t1 ? 0.34 * t / t1 : 0.34 + 0.06 * (t - t1) / 3.5; }, vIn = Math.min(0.9, at(uIn));
      for (let i = 0; i <= PN; i++) { const u = i / PN; PROG[i] = u < uIn ? Math.min(vIn, at(u)) : vIn + (1 - vIn) * (u - uIn) / (1 - uIn); }
    }
    const progAt = (u) => { const x = sat(u) * PN, i = Math.min(PN - 1, Math.floor(x)); return PROG[i] + (PROG[i + 1] - PROG[i]) * (x - i); };
    await ctx.yield();

    // ---- the land material (one program for everything carved that is not the flower) ----
    const HU = hero.uniforms;
    HU.uKeyCol.value.multiplyScalar(1.33); HU.cHoney.value.multiplyScalar(0.8); HU.uFill.value = 3.2; HU.uLift.value.setRGB(0.026, 0.05, 0.046);
    HU.cCap.value.set(stack === 2 ? '#241210' : '#48221d');    // never a dead black: the cap and the marbling keep their shading          // lit red must stay red under the tone map: lower the key, never the saturation
    const SH_W = 256, SH_X0 = -216, SH_Z0 = -566, SH_SX = 432, SH_SZ = 784, shadeData = new Uint8Array(SH_W * SH_W);
    const shadeTex = new THREE.DataTexture(shadeData, SH_W, SH_W, THREE.RedFormat, THREE.UnsignedByteType);
    shadeTex.minFilter = shadeTex.magFilter = THREE.LinearFilter; shadeTex.generateMipmaps = false;
    const LU = {
      ...HU, uPatch: { value: new THREE.Vector4(0, 0, 48, 0) }, uPsi: { value: new THREE.Vector2(Math.cos(psi), Math.sin(psi)) },
      uHeadZ: { value: -1e4 }, uPav: { value: new THREE.Vector3(...FB2(PAV_S, PAV_A, 0)) }, uCamS: { value: 0 }, uHeal: { value: new THREE.Vector3(healNear, healFar, 0) }, uShade: { value: shadeTex },
      uShadeBox: { value: new THREE.Vector4(SH_X0, SH_Z0, 1 / SH_SX, 1 / SH_SZ) },
    };
    const landMat = new THREE.ShaderMaterial({ uniforms: LU, vertexShader: LAND_VERT, fragmentShader: LAND_FRAG });
    const addMesh = async (B, name, mat = landMat) => { const m = new THREE.Mesh(await toGeo(B, ctx), mat); m.name = name; m.frustumCulled = false; scene.add(m); return m; };

    // ---- cliffs: gorge walls, the basin's ring, the tongue; then the terrace's low edge ----
    const zm = -Math.sqrt(BASIN_R * BASIN_R - GORGE_W * GORGE_W), sC = (a) => Math.sqrt(BASIN_R * BASIN_R - a * a) - ARC_R;
    const line = [], seg = (out, ax, az, bx, bz, step) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step)); for (let i = 0; i < n; i++) out.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); };
    const arc = (out, a0, a1, step) => { const n = Math.max(1, Math.round(Math.abs(a1 - a0) * BASIN_R / step)); for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([Math.sin(a) * BASIN_R, Math.cos(a) * BASIN_R]); } };
    const fbSeg = (out, s0, a0, s1, a1, step) => { const p = fromBridge(s0, a0), q = fromBridge(s1, a1); seg(out, p[0], p[1], q[0], q[1], step); };
    seg(line, -GORGE_W, zm, -GORGE_W, GORGE_Z0, 2); seg(line, -GORGE_W, GORGE_Z0, GORGE_W, GORGE_Z0, 3); seg(line, GORGE_W, GORGE_Z0, GORGE_W, zm, 2);
    const azP = Math.atan2(GORGE_W, zm), t1 = fromBridge(sC(M_A1), M_A1), t0 = fromBridge(sC(M_A0), M_A0);
    let azT1 = Math.atan2(t1[0], t1[1]), azT0 = Math.atan2(t0[0], t0[1]);
    while (azT1 > azP) azT1 -= Math.PI * 2; while (azT0 > azT1) azT0 -= Math.PI * 2;
    arc(line, azP, azT1, 3.5);
    fbSeg(line, sC(M_A1), M_A1, M_S0, M_A1, 2); fbSeg(line, M_S0, M_A1, M_S0, M_A0 + CHAMF, 2); fbSeg(line, M_S0, M_A0 + CHAMF, M_S0 + CHAMF * CH_RUN, M_A0, 2); fbSeg(line, M_S0 + CHAMF * CH_RUN, M_A0, sC(M_A0), M_A0, 2);
    arc(line, azT0, -azP, 3.5);
    line.push([-GORGE_W, zm]);
    const CB = newB(44000);
    await addCliff(CB, line, PROFILE, KEY, ctx, 0);
    await ctx.yield();
    const tl = [];
    fbSeg(tl, sC(T_A1), T_A1, T_S0, T_A1, 2); fbSeg(tl, T_S0, T_A1, T_S0, T_A0 + T_CH, 2); fbSeg(tl, T_S0, T_A0 + T_CH, T_S0 + T_CH * CH_RUN, T_A0, 2); fbSeg(tl, T_S0 + T_CH * CH_RUN, T_A0, sC(T_A0) + 2, T_A0, 2);
    await addCliff(CB, tl, PROFILE_T, KEY, ctx, 40);
    await ctx.yield();
    await addMesh(CB, 'cliffs');
    await ctx.yield();

    // ---- flats: the uncut top with the terraced country beyond, the terrace, the gorge's water ----
    const FB = newB(8000);
    {
      const NT = 96, NR = 30, P = new Float32Array((NT + 1) * (NR + 1) * 3), cph = rng.range(0, 6.28);
      for (let j = 0; j <= NR; j++) for (let i = 0; i <= NT; i++) {
        const th = (i / NT) * Math.PI * 2, r = 150 + (VAULT_R + 10 - 150) * Math.pow(j / NR, 1.6), o = (i + j * (NT + 1)) * 3;
        const x = Math.sin(th) * r, z = Math.cos(th) * r;
        const away = sstep(300, 420, r) * sstep(0.35, 0.8, Math.abs(Math.atan2(Math.sin(th - Math.PI), Math.cos(th - Math.PI))));
        const v = Math.max(0, (r - 330) / 85 + 0.9 * Math.sin(th * 3 + cph) + 0.5 * Math.sin(th * 7 + cph * 2)), fl = Math.floor(v);
        P[o] = x; P[o + 1] = -4 * Math.min(8, fl + sstep(0.82, 1, v - fl)) * away; P[o + 2] = z;
      }
      await ctx.yield();
      await addGridA(FB, P, NT, NR, 1, (i, j) => { const o = (i + j * (NT + 1)) * 3; return [1, 1, 0, 0, P[o], P[o + 2]]; }, ctx, 8);
      await ctx.yield();
      const NS = 26, NA = 18, Q = new Float32Array((NS + 1) * (NA + 1) * 3);
      for (let j = 0; j <= NA; j++) for (let i = 0; i <= NS; i++) { const q = fromBridge(20 + 94 * i / NS, -50 + 68 * j / NA), o = (i + j * (NS + 1)) * 3; Q[o] = q[0]; Q[o + 1] = TERRACE_Y; Q[o + 2] = q[1]; }
      addGrid(FB, Q, NS, NA, -1, (i, j) => { const o = (i + j * (NS + 1)) * 3; return [1, keyVis(Q[o], TERRACE_Y + 0.4, Q[o + 2], KEY), 0, 1, Q[o], Q[o + 2]]; });
      await ctx.yield();
      const GX = 6, GZ = 40, G = new Float32Array((GX + 1) * (GZ + 1) * 3);
      for (let j = 0; j <= GZ; j++) for (let i = 0; i <= GX; i++) { const o = (i + j * (GX + 1)) * 3; G[o] = -31 + 62 * i / GX; G[o + 1] = WATER - 0.07; G[o + 2] = GORGE_Z0 - 2 + (358) * j / GZ; }
      addGrid(FB, G, GX, GZ, 1, (i, j) => [3, 1, 0, 0, 0, 0]);
    }
    await ctx.yield();
    await addMesh(FB, 'flats');
    await ctx.yield();
    // the follow patch: 96 m of water at 1.2 m, displaced by the wave diaper, snapped to the cell grid under the lens
    {
      const PB = newB(7000), NP = 80, P = new Float32Array((NP + 1) * (NP + 1) * 3);
      for (let j = 0; j <= NP; j++) for (let i = 0; i <= NP; i++) { const o = (i + j * (NP + 1)) * 3; P[o] = -48 + 96 * i / NP; P[o + 1] = WATER + 0.02; P[o + 2] = -48 + 96 * j / NP; }
      await ctx.yield();
      await addGridA(PB, P, NP, NP, 1, () => [3, 1, 0, 1, 0, 0], ctx, 12);
      await ctx.yield();
      await addMesh(PB, 'patch');
    }
    await ctx.yield();
    // key visibility at the water, 16 rows a step; inside the flower's apron its own baked petal shade is folded in
    {
      const ap = hero.parts.apron.geometry.attributes, AP = ap.position, AD = ap.aData, R1 = BASIN_R + 4, cs = Math.cos(psi), sn = Math.sin(psi);
      for (let v = 0; v < AP.count; v++) {
        const lx = AP.getX(v), lz = AP.getZ(v), x = lx * cs + lz * sn, z = -lx * sn + lz * cs;
        AD.setW(v, AD.getW(v) * keyVis(x, WATER + 0.4, z, KEY, true));
        if (v % 120 === 119) await ctx.yield();
      }
      AD.needsUpdate = true;
      for (let j = 0; j < SH_W; j++) {
        shadeRow(SH_W, SH_X0, SH_SX, SH_Z0, j, SH_SZ, R1, cs, sn, AD, KEY, shadeData);
        if (j % 2 === 1) await ctx.yield();
      }
      // what stands in the water lays its shade on it, away from the key the flower is seen by (a soft capsule each)
      const kh = Math.max(Math.hypot(KEYB.x, KEYB.z), 1e-4), kx = KEYB.x / kh, kz = KEYB.z / kh, run = Math.min(3.2, kh / Math.max(KEYB.y, 0.05));
      const TS = TRAY.map((t) => { const Ls = t.H * run * 0.8; return [t[1], t[2], t.R, Ls, t[0] === 'isle' ? 0.25 : 0.5, Ls + t.R * 1.25]; });
      const trayShadeOf = (list, x, z) => {
        let m = 1;
        for (const t of list) {
          const dx = x - t[0], dz = z - t[1], rb = t[5];
          if (dx > rb || dx < -rb || dz > rb || dz < -rb) continue;
          const al = Math.min(t[3], Math.max(0, -(dx * kx + dz * kz))), d = Math.hypot(dx + kx * al, dz + kz * al);
          if (d < t[2] * 1.25) m *= 1 - t[4] * (1 - sstep(t[2] * 0.6, t[2] * 1.25, d)) * (1 - 0.6 * al / Math.max(t[3], 1e-3));
        }
        return m;
      };
      const trayShade = (x, z) => trayShadeOf(TS, x, z);
      for (let j = 0; j < SH_W; j++) {
        const z = SH_Z0 + (j + 0.5) / SH_W * SH_SZ;
        if (z > -230 && z < 230) {
          const row = TS.filter((t) => Math.abs(z - t[1]) < t[5]);
          if (row.length) for (let i = 0; i < SH_W; i++) { const x = SH_X0 + (i + 0.5) / SH_W * SH_SX, m = trayShadeOf(row, x, z); if (m < 1) shadeData[i + j * SH_W] = Math.round(shadeData[i + j * SH_W] * m); }
        }
        if (j % 32 === 31) await ctx.yield();
      }
      for (let v = 0, SA = ap.aShadeA; v < AP.count; v++) { const lx = AP.getX(v), lz = AP.getZ(v), m = trayShade(lx * cs + lz * sn, -lx * sn + lz * cs); AD.setW(v, AD.getW(v) * m); SA.setX(v, SA.getX(v) * m); }
      await ctx.yield();
      shadeTex.needsUpdate = true;
    }

    // ---- the vault ----
    const VU = { ...HU, uKey: { value: KEY.clone() }, uBand: { value: new THREE.Vector4(0, 0, 0, 1) } };
    {
      const prof = [[VAULT_R, -70], [VAULT_R, 0], [VAULT_R, 60], [VAULT_R, 140], [VAULT_R, 230], [VAULT_R, 320], [VAULT_R, 400], [VAULT_R, 450], [VAULT_R - 12, 476], [VAULT_R - 45, 492],
        [1150, 512], [1000, 532], [800, 556], [600, 578], [400, 597], [220, 611], [90, 619], [0, 622]];
      const NT = 96, pos = [], nor = [], sA = [], idx = []; let sAcc = -70;
      for (let j = 0; j < prof.length; j++) {
        const a = prof[Math.max(0, j - 1)], b = prof[Math.min(prof.length - 1, j + 1)], dr = b[0] - a[0], dy = b[1] - a[1], k = 1 / Math.max(Math.hypot(dr, dy), 1e-6);
        if (j) sAcc += Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]);
        for (let i = 0; i <= NT; i++) {
          const th = (i / NT) * Math.PI * 2, sx = Math.sin(th), cz = Math.cos(th);
          pos.push(sx * prof[j][0], prof[j][1], cz * prof[j][0]); nor.push(-dy * k * sx, dr * k, -dy * k * cz); sA.push(sAcc);
        }
      }
      for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < NT; i++) { const a = i + j * (NT + 1), b = a + 1, c = a + NT + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(sA, 1)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1500);
      const vault = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: VU, vertexShader: VAULT_VERT, fragmentShader: VAULT_FRAG, side: THREE.DoubleSide }));
      vault.name = 'vault'; vault.frustumCulled = false; scene.add(vault);
    }
    await ctx.yield();
    // ---- built things, each fused to the block at its back and foot: the bridge, the pavilion, nine figures ----
    const SB = newB();
    // the pavilion is the one thing the key must find: its visibility is taken as if the key just cleared the basin's rim
    const pe = Math.max(keyElev, 29 * D2R), KEY_PAV = new THREE.Vector3(Math.sin(keyAz) * Math.cos(pe), Math.sin(pe), Math.cos(keyAz) * Math.cos(pe));
    const figure = (F, u, w, yb, sc, flip) => {
      F.cutout(FIG_BODY, w - 0.14 * sc, w + 0.14 * sc, u, yb, sc);
      F.cutout(FIG_SHADE, w - 0.1 * sc, w + 0.1 * sc, u + flip * 0.3 * sc, yb, sc);
      F.box(u + flip * 0.3 * sc - 0.035 * sc, u + flip * 0.3 * sc + 0.035 * sc, yb + 0.95 * sc, yb + 2.24 * sc, w - 0.035 * sc, w + 0.035 * sc);
    };
    {
      const F = makeFrame(SB, fromBridge(0, 0), BE, BT, 0, KEY), S0 = -24, S1 = T_S0 + 1.5, NS = 88;
      const deckY = (q) => TERRACE_Y + 1.5 * Math.max(0, 1 - ((q - 2) / 25) * ((q - 2) / 25));
      const archY = (q) => { let y = -48.2; for (const c of [-13, 2, 17]) { const t = (q - c) / 4.5; if (Math.abs(t) < 1) y = Math.max(y, -47.7 + 6.3 * Math.sqrt(1 - t * t)); } return y; };
      const edge = (q) => { let e = 0; for (const c of [-13, 2, 17]) e = Math.max(e, 1 - Math.abs(Math.abs(q - c) - 4.5) / 0.6); return Math.max(0, e); };
      const v0 = SB.n;
      for (const sd of [1, -1]) {
        F.surf(NS, 4, (a, t) => { const q = S0 + (S1 - S0) * a, yb = archY(q); return [q, yb + (deckY(q) + 1.05 - yb) * t, sd * 1.6, Math.max(yb > -48 ? (1 - t * 4) : 0, edge(q) * (t < 0.6 ? 1 : 0), t > 0.97 ? 1 : 0)]; }, [0, 0, sd]);
        F.surf(NS, 1, (a, t) => { const q = S0 + (S1 - S0) * a; return [q, deckY(q) + 1.05 * t, sd * 1.25, t]; }, [0, 0, -sd]);
        F.surf(NS, 1, (a, t) => { const q = S0 + (S1 - S0) * a; return [q, deckY(q) + 1.05, sd * (1.25 + 0.35 * t), 1]; }, [0, 1, 0]);
        await ctx.yield();
        for (let q = S0 + 2.5; q < S1; q += 5) F.post(q, sd * 1.43, deckY(q), deckY(q) + 1.65, 0.26, 6, 0.5);
        await ctx.yield();
      }
      for (let v = v0; v < SB.n; v++) { SB.l[v * 4] = 5; SB.uv[v * 2] = toBridge(SB.pos[v * 3], SB.pos[v * 3 + 2])[0] + 0.85; SB.uv[v * 2 + 1] = SB.pos[v * 3 + 1] * 1.0; }   // a fretted web and parapet
      F.surf(NS, 2, (a, t) => { const q = S0 + (S1 - S0) * a; return [q, archY(q), -1.6 + 3.2 * t, 0.6 * (1 - Math.abs(t * 2 - 1))]; }, [0, -1, 0], 0.5);
      const d0 = SB.n;
      F.surf(40, 1, (a, t) => { const q = S0 + (S1 - S0) * a; return [q, deckY(q), -1.25 + 2.5 * t, 0]; }, [0, 1, 0]);
      for (let v = d0; v < SB.n; v++) { SB.l[v * 4] = 5; SB.uv[v * 2] = SB.pos[v * 3]; SB.uv[v * 2 + 1] = SB.pos[v * 3 + 2]; }
      await ctx.yield();
      // the bridge's four figures face along the deck (nine in all: four here, two on the terrace, three on the causeway) (the flight comes down its axis): robe and head as a silhouette,
      // a real parasol over each (a shallow cone, its rim carrying the lip light) and the shade it lays on the deck
      const F2 = makeFrame(SB, fromBridge(0, 0), BT, BE, 0, KEY), fs = 1.25;
      for (const [q, fl] of [[-20.5, 1], [-14, -1], [-7.5, 1], [-2, -1]]) {
        const yb = deckY(q), u0 = 0.5 * fl, up = u0 + 0.22 * fl * fs;
        F2.cutout(FIG_BODY, q - 0.16 * fs, q + 0.16 * fs, u0, yb, fs);
        F2.box(up - 0.04, up + 0.04, yb + 0.95 * fs, yb + 2.3 * fs, q - 0.04, q + 0.04);
        F2.surf(12, 2, (a, t) => { const an = a * 6.2832, r = 1.12 * fs * t; return [up + Math.cos(an) * r, yb + (2.62 - 0.36 * t * t) * fs, q + Math.sin(an) * r, t > 0.75 ? 1 : 0]; }, [0, 1, 0]);
        F2.surf(12, 1, (a, t) => { const an = a * 6.2832, r = 1.12 * fs * (1 - 0.1 * t); return [up + Math.cos(an) * r, yb + (2.26 - 0.1 * t) * fs, q + Math.sin(an) * r, 1 - t]; }, [0, -1, 0], 0.5);
        F2.surf(10, 1, (a, t) => { const an = a * 6.2832, w = q - 0.7 + Math.sin(an) * 1.5 * t; return [u0 * 0.8 + Math.cos(an) * 0.62 * t, deckY(w) + 0.05, w, 0]; }, [0, 1, 0], 0.1);
        await ctx.yield();
      }
    }
    await ctx.yield();
    {
      const F = makeFrame(SB, fromBridge(PAV_S, PAV_A), [BE[0] * CH_C - BT[0] * CH_S, BE[1] * CH_C - BT[1] * CH_S], [-(BE[0] * CH_S + BT[0] * CH_C), -(BE[1] * CH_S + BT[1] * CH_C)], TERRACE_Y, KEY_PAV, 1.3);
      F.surf(6, 4, (a, t) => [-10.5 + 21 * a, 10.2 * t, 0.2, 0], [0, 0, 1], 0.1);          // the ground cut down behind it: a shaded niche
      F.box(-6.6, 6.6, -0.5, 0.7, -1.8, 3.5, 0.5); F.box(-1.6, 1.6, -0.5, 0.35, 3.5, 4.3, 0.5);
      await ctx.yield();
      for (const u of [-5.5, -3.3, -1.15, 1.15, 3.3, 5.5]) F.post(u, 2.95, 0.7, 3.9, 0.27, 8, 0.12);
      for (const [a, b] of [[-5.5, -3.3], [-3.3, -1.15], [1.15, 3.3], [3.3, 5.5]]) { F.box(a, b, 0.7, 0.86, 2.86, 3.04, 1); F.box(a, b, 1.42, 1.58, 2.86, 3.04, 1); for (let q = a + 0.44; q < b - 0.1; q += 0.44) F.box(q - 0.05, q + 0.05, 0.86, 1.42, 2.9, 3.0, 0); }
      await ctx.yield();
      F.box(-5.9, 5.9, 3.7, 4.15, -1.8, 3.2, 0.4); F.box(-5.2, 5.2, 0.7, 3.7, -1.8, 0.3, 0);
      await ctx.yield();
      const roof = (hw, wE, yE, rise, sweep, ncol) => {
        const f = (dy, rib) => (a, t) => { const u = -hw + 2 * hw * a, e = Math.abs(u) / hw; return [u, yE + dy + rise * Math.pow(t, 0.75) + sweep * e * e * e * (1 - t) + rib * Math.cos(u * 6.2832 / 0.64) * (1 - 0.6 * t), wE - (wE + 1.8) * t * (1 - 0.16 * e * (1 - t)), t < 0.1 ? 1 : 0]; };
        F.surf(ncol, 7, f(0, 0.085), [0, 1, 0.3]); F.surf(24, 2, f(-0.22, 0), [0, -1, 0], 0.5);
        F.surf(24, 1, (a, t) => { const q = f(-0.22 * (1 - t), 0)(a, 0); return [q[0], q[1], q[2], 1]; }, [0, 0, 1]);
      };
      roof(7.6, 4.5, 4.05, 1.5, 1.25, 96);
      await ctx.yield();
      F.box(-3.7, 3.7, 5.3, 6.5, -1.8, 2.2, 0.3); await ctx.yield();
      for (const u of [-3.45, -1.15, 1.15, 3.45]) F.post(u, 2.2, 5.3, 6.5, 0.2, 6, 0.1);
      await ctx.yield();
      roof(5.3, 3.5, 6.5, 1.3, 1.0, 68);
      await ctx.yield();
      F.box(-3.2, 3.2, 7.75, 8.05, -1.8, 0.6, 0.6); F.post(0, 0.3, 8.0, 8.9, 0.24, 8, 1.3);
      for (const [u, w, fl] of [[-8.6, 5.6, 1], [8.4, 6.4, -1]]) figure(F, u, w, 0, 0.9, fl);
    }
    await ctx.yield();
    await addMesh(SB, 'built');
    await ctx.yield();
    // ---- the tray, built: lesser blooms and leaf islands in the flower's own material, boxes and the low causeway in the land's ----
    {
      const HG = hero.parts.petals.geometry.attributes, LG = hero.parts.leaves.geometry.attributes, hmat = hero.parts.petals.material, cnt = PETAL_GRID.counts;
      const nA = cnt[6] + cnt[7] + cnt[8], nB = cnt[7] + cnt[8], NAZ = 28;
      const profA = [[16, -28], [14.5, -20], [14, -12], [17.5, -7], [23.6, -4.5], [21.2, -1.2], [19.3, 0.2], [17, 1.6], [15, 3.0], [14.2, 3.7], [12.3, 5.0], [10.6, 6.3], [9, 7.6], [6.5, 8.8], [3.4, 9.6], [0.01, 9.9]];
      const profB = [[12.5, -20], [11.5, -12], [13, -6.5], [17, -3.5], [15.2, -0.8], [14.2, 0.2], [12.3, 1.5], [10.6, 2.8], [9, 4.1], [6.5, 5.3], [3.4, 6.1], [0.01, 6.4]];
      const TA = heroBuf(nA * 192 + (NAZ + 1) * profA.length, nA * 900 + NAZ * (profA.length - 1) * 6), TBm = heroBuf(nB * 192 + (NAZ + 1) * profB.length, nB * 900 + NAZ * (profB.length - 1) * 6);
      bloomPetals(TA, HG, 6); heroLathe(TA, profA, NAZ, 0.8);
      await ctx.yield();
      bloomPetals(TBm, HG, 7); heroLathe(TBm, profB, NAZ, 0.8);
      await ctx.yield();
      const RA = heroBuf(8 * 140, 8 * 648), knob = [[4.6, -1], [5, 1.6], [4.2, 3.6], [2.4, 5.2], [0.01, 5.9]], RI = heroBuf(6 * 140 + 17 * knob.length, 6 * 648 + 16 * (knob.length - 1) * 6);
      leafRosette(RA, LG, [0, 3, 4, 7, 8, 11, 12, 15], 23.5, 0);
      leafRosette(RI, LG, [1, 6, 9, 14, 19, 24], 3.5, 0.3); heroLathe(RI, knob, 16, 0.9);
      await ctx.yield();
      const gA = heroGeo(TA, 60), gB = heroGeo(TBm, 60), gRA = heroGeo(RA, 60), gRI = heroGeo(RI, 40);
      const put = (g, x, y, z, sc, turn, name) => { const m = new THREE.Mesh(g, hmat); m.name = name; m.position.set(x, y, z); m.scale.setScalar(sc); m.rotation.y = turn; m.updateMatrix(); m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m); };
      // (us, y0: the pattern's own coordinates on a turned band: us for one turn, and metres above y0)
      const TB = newB(30000), boxLathe = (F, R, prof, kind, us = R * 6.2832, y0 = 0) => {
        const v0 = TB.n, nv = prof.length - 1;
        F.surf(22, nv, (a, t) => { const q = prof[Math.round(t * nv)], an = a * 6.2832; return [Math.cos(an) * q[0] * R, q[1], Math.sin(an) * q[0] * R, q[2] || 0, a * us, q[1] - y0]; }, [-1, 0.25, 0]);
        if (kind) for (let v = v0; v < TB.n; v++) TB.l[v * 4] = kind;
      };
      for (const t of TRAY) {
        if (t[0] === 'A' || t[0] === 'B') { put(t[0] === 'A' ? gA : gB, t[1], WATER + 6.9, t[2], t[3], t[4], 'bloom'); put(gRA, t[1], WATER, t[2], t[3] * (t[0] === 'A' ? 0.58 : 0.4), t[4] + 0.4, 'bloom-leaves'); }
        else if (t[0] === 'isle') put(gRI, t[1], WATER, t[2], t[3], t[4], 'leaf-island');
        else {
          // a lidded box (the wider ones) or jar, carved like everything else here and coloured by depth of cut alone: its
          // body in the green, the seam of its lid on the black guide line, the lid in the red. From the water up: a foot
          // ring; TWO ROWS OF THE FRET between two beads, at the fret's own size (the parapets' 1.7 m cell, a whole
          // number of cells round the box); a plain shoulder with one raised ring; the lid's rim standing out over the
          // seam; a stepped dome; a knob on its neck
          const R = t[3], H = t[4], sf = Math.min(0.68, Math.max(0.5, 6.75 / H)), F = makeFrame(TB, [t[1], t[2]], [1, 0], [0, 1], WATER, KEY), hs = sf * H, ly = (k) => (sf + (1 - sf) * k) * H;
          const fb0 = 0.2 * hs, fb1 = fb0 + 3.4, cells = Math.max(4, Math.round(R * 0.98 * 6.2832 / 1.7)), sh = (k) => fb1 + (hs - fb1) * k;
          boxLathe(F, R, [[0.95, -0.7], [1.05, 0.02 * hs], [1.07, 0.08 * hs, 1], [1.0, 0.13 * hs], [1.03, 0.165 * hs, 0.6], [0.98, fb0]], 0);
          boxLathe(F, R, [[0.98, fb0], [0.98, fb1]], 5, cells * 1.7, fb0);
          boxLathe(F, R, [[0.98, fb1], [1.03, sh(0.1), 0.6], [1.0, sh(0.22)], [1.035, sh(0.5)], [1.0, sh(0.88)], [0.985, hs]], 0);
          boxLathe(F, R, [[0.985, ly(0)], [1.09, ly(0.03), 1], [1.1, ly(0.11), 1], [1.0, ly(0.17)], [0.96, ly(0.27)], [0.9, ly(0.31), 0.6], [0.8, ly(0.5)], [0.5, ly(0.68)], [0.24, ly(0.74)], [0.2, ly(0.85)], [0.33, ly(0.95), 0.6], [0.2, ly(0.99)], [0.01, ly(1.0)]], 0);
        }
        await ctx.yield();
      }
      // the low causeway: nine arches from a leaf island by the gorge's mouth to the pavilion's terrace, three of the nine parasol figures walking it
      {
        const dx = K2B[0] - K2A[0], dz = K2B[1] - K2A[1], Lc = Math.hypot(dx, dz), U2 = [dx / Lc, dz / Lc], W2 = [-U2[1], U2[0]], F = makeFrame(TB, K2A, U2, W2, WATER, KEY);
        const NS = Math.round(Lc / 1.25), PA = Lc / 9, deckY = (q) => 1.6 + 1.5 * sstep(0, 7, q) + 4.9 * sstep(Lc - 17, Lc - 1, q);
        const archY = (q) => { const c = (q / PA - Math.floor(q / PA) - 0.5) * PA / (PA * 0.36); return Math.abs(c) < 1 && q > 4 && q < Lc - 15 ? 2.25 * Math.sqrt(1 - c * c) : -1; };
        const v0 = TB.n;
        for (const sd of [1, -1]) {
          F.surf(NS, 3, (a, t) => { const q = a * Lc, yb = archY(q); return [q, yb + (deckY(q) + 0.85 - yb) * t, sd * 1.35, t > 0.97 ? 1 : (yb > -0.5 && t < 0.2 ? 0.7 : 0)]; }, [0, 0, sd]);
          F.surf(NS, 1, (a, t) => { const q = a * Lc; return [q, deckY(q) + 0.85 * t, sd * 1.05, t]; }, [0, 0, -sd]);
          F.surf(NS, 1, (a, t) => { const q = a * Lc; return [q, deckY(q) + 0.85, sd * (1.05 + 0.3 * t), 1]; }, [0, 1, 0]);
          await ctx.yield();
        }
        for (let v = v0; v < TB.n; v++) { TB.l[v * 4] = 5; const px = TB.pos[v * 3] - K2A[0], pz = TB.pos[v * 3 + 2] - K2A[1]; TB.uv[v * 2] = px * U2[0] + pz * U2[1]; TB.uv[v * 2 + 1] = TB.pos[v * 3 + 1]; }
        F.surf(NS, 1, (a, t) => { const q = a * Lc; return [q, archY(q), -1.35 + 2.7 * t, 0.5 * (1 - Math.abs(t * 2 - 1))]; }, [0, -1, 0], 0.5);
        F.surf(Math.round(NS / 2), 1, (a, t) => { const q = a * Lc; return [q, deckY(q), -1.05 + 2.1 * t, 0]; }, [0, 1, 0]);
        await ctx.yield();
        const F2 = makeFrame(TB, K2A, W2, U2, WATER, KEY), fs = 1.3;
        for (let k = 0; k < 3; k++) {
          const q = Lc * [0.24, 0.5, 0.78][k], fl = k % 2 ? 1 : -1, yb = deckY(q), u0 = 0.35 * fl, up = u0 + 0.22 * fl * fs;
          F2.cutout(FIG_BODY, q - 0.16 * fs, q + 0.16 * fs, u0, yb, fs);
          F2.box(up - 0.04, up + 0.04, yb + 0.95 * fs, yb + 2.3 * fs, q - 0.04, q + 0.04);
          F2.surf(12, 2, (a, t) => { const an = a * 6.2832, r = 1.12 * fs * t; return [up + Math.cos(an) * r, yb + (2.62 - 0.36 * t * t) * fs, q + Math.sin(an) * r, t > 0.75 ? 1 : 0]; }, [0, 1, 0]);
          F2.surf(12, 1, (a, t) => { const an = a * 6.2832, r = 1.12 * fs * (1 - 0.1 * t); return [up + Math.cos(an) * r, yb + (2.26 - 0.1 * t) * fs, q + Math.sin(an) * r, 1 - t]; }, [0, -1, 0], 0.5);
          if (k % 2) await ctx.yield();
        }
      }
      await ctx.yield();
      await addMesh(TB, 'tray');
    }
    await ctx.yield();
    // ---- the vine on the port wall: stem in a slow S, a leaf every 5 m, tendrils ending in tight scrolls ----
    // it stands 1.5 m proud of the wall's piers with the ground cut down behind it, and is solid back to the block
    const VINE_Y = -24.5, vineY = (z) => VINE_Y + 4 * Math.sin(z * 6.2832 / 44), vineS = (z) => 4 * 6.2832 / 44 * Math.cos(z * 6.2832 / 44);
    {
      const VB = newB(), F = makeFrame(VB, [34.3, 0], [0, 1], [-1, 0], 0, KEY), Z0 = -505, Z1 = zm - 4;
      const prof = [[-0.5, 0], [-0.46, 2.55], [-0.27, 3.0], [0, 3.15], [0.27, 3.0], [0.46, 2.55], [0.5, 0]];
      await F.surfA(Math.round((Z1 - Z0) / 1.1), 6, (a, t) => { const z = Z0 + (Z1 - Z0) * a, q = prof[Math.round(t * 6)], k = 1 / Math.hypot(1, vineS(z)); return [z - q[0] * vineS(z) * k, vineY(z) + q[0] * k, q[1], t > 0.3 && t < 0.7 ? 0.4 : 0, 9, 0]; }, [0, 0, 1], 1, ctx);
      await ctx.yield();
      // leaves: pointed, keeled along a raised midrib so one half takes the raking key and the other stands in shade,
      // each with its own chart (across -1..1, along 0..1) for the veins; a skirt joins every edge back to the block
      let n = 0;
      for (let z = Z0 + 3; z < Z1 - 3; z += 6, n++) {
        const up = n % 2 ? 1 : -1, sl = Math.atan(vineS(z)), ang = sl + up * (0.92 + 0.22 * Math.sin(n * 2.4)), len = 5.1 + 0.8 * Math.sin(n * 1.7), cu = Math.cos(ang), su = Math.sin(ang), y0 = vineY(z);
        F.surf(18, 10, (a, t) => {
          const j = Math.round(t * 10), skirt = j === 0 || j === 10, b = j === 0 ? -1 : (j === 10 ? 1 : -1 + (j - 1) / 4);
          const hw = 0.3 * len * (a < 0.3 ? Math.pow(Math.sin(a / 0.3 * Math.PI / 2), 0.75) : Math.pow((1 - a) / 0.7, 0.85)) + 0.02;
          const l = (0.14 + a) * len, o = b * hw + 0.55 * Math.sin(Math.PI * a) * up * 0.6, env = 0.4 + 0.6 * Math.sin(Math.PI * Math.pow(a, 0.8));
          const w = skirt ? 0 : 1.75 + 1.05 * Math.pow(1 - Math.abs(b), 0.8) * env + 0.22 * Math.exp(-b * b * 30) * env;
          return [z + cu * l - su * o * up, y0 + su * l + cu * o * up, w, skirt ? 0 : (Math.abs(b) > 0.9 ? 1 : 0), skirt ? b * 1.2 : b, a];
        }, [0, 0, 1]);
        if (n % 3 === 2) {      // a tendril: a ridge wound into a tight scroll
          const c = [z + 3, y0 - up * (3.9 + 0.6 * Math.sin(n))];
          F.surf(52, 4, (a, t) => { const th = a * 12.5, r = 2.1 * (1 - 0.84 * a) + [-0.2, -0.16, 0, 0.16, 0.2][Math.round(t * 4)]; return [c[0] + Math.cos(th) * r * up, c[1] + Math.sin(th) * r, [0, 2.3, 2.8, 2.3, 0][Math.round(t * 4)], t > 0.2 && t < 0.8 ? 0.7 : 0, 9, 0]; }, [0, 0, 1]);
        }
        await ctx.yield();
      }
      for (let v = 0; v < VB.n; v++) { VB.l[v * 4] = 4; VB.l[v * 4 + 3] = VB.pos[v * 3 + 2]; }
      await ctx.yield();
      await addMesh(VB, 'vine');
    }
    await ctx.yield();
    // ---- shavings: the near flock, the far flocks, the groove's own, the well's five, and the rare drift ----
    const nNear = 40, nFar = Math.min(520, Math.round(220 * detail * curlAmt)), nRare = rare ? Math.round(300 * detail) : 0, nCurl = nNear + nFar + nRare + 1 + 5;
    const CU = { ...HU, uGrow: { value: 0 }, uRareOn: { value: 0 }, uPeel: { value: 0 }, uWellS: { value: -99 },
      uFlockC: { value: new THREE.Vector3() }, uFlockD: { value: new THREE.Vector3(0, 0, 1) }, uPeelP: { value: new THREE.Vector3() },
      uWellO: { value: toWorld(A.wellAxis.mouth) }, uWellD: { value: A.wellAxis.dir.clone().transformDirection(hero.object.matrixWorld) } };
    {
      const cr = rng.fork('curls'), iA = new Float32Array(nCurl * 4), iB = new Float32Array(nCurl * 4), tp = new THREE.Vector3(), tt = new THREE.Vector3();
      for (let i = 0; i < nCurl; i++) {
        const ph = cr.range(0, 6.283);
        if (i < nNear) { iA.set([cr.range(-7, 7), cr.range(-5, 5), cr.range(-9, 9), ph], i * 4); iB.set([cr.range(2.6, 4.6), cr.range(2, 3), 0, cr()], i * 4); }
        else if (i < nNear + nFar) {
          const fl = Math.floor(cr() * 7), az = fl * 0.9 + cr.gauss() * 0.16 + 0.4;
          iA.set([az, cr.range(184, 203), cr.range(-40, -8), ph], i * 4); iB.set([cr.range(2.5, 5), cr.range(2, 3), 1, cr()], i * 4);
        } else if (i < nNear + nFar + nRare) {
          const rk = (x) => uBridge + (uSlot + 0.08 - uBridge) * (x - 0.5) / 0.3;
          path.pointAt(rk(cr.range(0.5, 0.8)), tp); path.tangentAt(rk(cr.range(0.5, 0.8)), tt);
          const lat = cr.range(-4, 46), fw = cr.range(-10, 10);
          iA.set([tp.x - tt.z * lat + tt.x * fw, tp.y + cr.range(-4, 10), tp.z + tt.x * lat + tt.z * fw, ph], i * 4); iB.set([cr.range(3.5, 5.5), cr.range(2, 3), 2, cr()], i * 4);
        } else if (i === nNear + nFar + nRare) { iA.set([0, 0, 0, ph], i * 4); iB.set([6.5, 2.6, 3, 0], i * 4); }
        else { const k = i - (nNear + nFar + nRare + 1); iA.set([k, cr.range(-0.8, 0.8), 0, k * 1.2566 + cr.range(-0.3, 0.3)], i * 4); iB.set([cr.range(3.2, 4.4), cr.range(2, 3), 4, cr()], i * 4); }
      }
      const NS = 28, pos = [], idx = [];
      for (let i = 0; i <= NS; i++) { pos.push(i / NS, -0.5, 0, i / NS, 0.5, 0); if (i < NS) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = nCurl;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: CU, vertexShader: CURL_VERT, fragmentShader: CURL_FRAG, side: THREE.DoubleSide }));
      m.name = 'shavings'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- rain: opaque beads in a 90 m box wrapped round the lens ----
    const RU = { cRed: HU.cRed, uKeyCol: HU.uKeyCol, uLift: HU.uLift, uTime: HU.uTime, uPx: { value: 1.2 / 1080 }, uCam: { value: new THREE.Vector3() } };
    {
      const rr = rng.fork('rain'), nRain = Math.max(60, Math.round(1400 * detail * rainAmt)), iP = new Float32Array(nRain * 4);
      for (let i = 0; i < nRain; i++) iP.set([rr.range(0, 90), rr.range(0, 70), rr.range(0, 90), rr()], i * 4);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, -1, 0.2, 0, 1, 0.2, 0, 0, -1, 0], 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.instanceCount = nRain;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: RU, vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, side: THREE.DoubleSide }));
      m.name = 'rain'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();
    // ---- the contract ----
    const pavXZ = fromBridge(PAV_S, PAV_A), pavAt = new THREE.Vector3(pavXZ[0], TERRACE_Y + 4, pavXZ[1]);
    const vineAt = new THREE.Vector3(), canopyAt = toWorld(A.canopy.lip).add(new THREE.Vector3(0, -1.5, 0));
    const mouthLow = new THREE.Vector3().fromArray(along(6));
    const mouthW = toWorld(A.wellAxis.mouth);
    const cp = new THREE.Vector3(), cd = new THREE.Vector3(), keyW = new THREE.Vector3(), keyLoc = new THREE.Vector3();
    const pp = new THREE.Vector3(), pf = new THREE.Vector3(), pt = new THREE.Vector3(), sz = new THREE.Vector2();
    // shade lands on the brief's values by a toe under the tone scale, a share of each layer's own colour (red, green,
    // buff), one constant for the whole flight
    const TOE = new THREE.Vector3(0.35, 0.26, 0.3); HU.uToe.value.copy(TOE); HU.uUnder.value = 0.5;
    // THE NEAR FLOCK'S STATION: one place of the route for the whole flight. FLOCK_D metres from the lens's place on the
    // route (the middle of the brief's 10 to 20 m from the lens), toward a point of the route FLOCK_ST[0] metres on,
    // moved FLOCK_ST[1] to starboard of the line of flight there and FLOCK_ST[2] up: thirty degrees to starboard of the
    // line of flight (from the bridge on the flower and its flank are to port of it, the water and the wall to
    // starboard) and twenty up (over the tray, under the vault). It is lifted only where something stands under it:
    // FLOCK_CLR metres (a curl's own length) clear of the top of whatever is carved within its reach (carvedTop:
    // terrace, pavilion roof, bridge and its parasols, the boxes and lesser blooms of the tray; each top falls away to
    // the water over six metres, the flock's own half width, so the lift comes and goes without a step).
    const FLOCK_D = 15.1, FLOCK_ST = [12.3, 7.2, 5], FLOCK_CLR = 5;
    const carvedTop = (x, z) => {
      const px = x - BE[0] * ARC_R, pz = z - BE[1] * ARC_R, bs = px * BE[0] + pz * BE[1], ba = px * BT[0] + pz * BT[1];
      let top = (TERRACE_Y - WATER) * (1 - sstep(0, 6, tongueSd(bs, ba, T_S0, T_A0, T_A1, T_CH)));                                  // the terrace
      top = Math.max(top, (TERRACE_Y - WATER + 11.6) * (1 - sstep(8.5, 16, Math.hypot(x - pavXZ[0], z - pavXZ[1]))));               // the pavilion's roof and finial
      top = Math.max(top, (TERRACE_Y - WATER + 4.8) * (1 - sstep(2, 9, Math.abs(ba))) * sstep(-30, -24, bs) * (1 - sstep(19.5, 25.5, bs)));   // the bridge and its parasols
      for (const t of TRAY) if (t[0] !== 'isle') top = Math.max(top, t.H * (1 - sstep(t.R, t.R + 6, Math.hypot(x - t[1], z - t[2]))));
      return top;
    };
    // THE GAZE, authored as one moving point of interest. Nothing in it is a table or a knot of the flight's own u: every
    // term is written from metres to a thing of the world or between two places of the route, and each distance is a
    // size of the world. The eye rests on the line of flight (the point of the route EYE_AHEAD metres on, the camera's
    // own look-ahead; only half of any climb) and is turned from it:
    //  - TOWARD THE FLOWER'S MIDDLE by a share wF: a third when the lens is a flower's radius (lip1) or more from the
    //    reach of its outermost lips, falling to a tenth where it flies beside them at the flank's distance (FLANK_D):
    //    the eye AHEAD down the flank, the petal beside the lens the inner edge of the picture, the lips ahead stepping
    //    back, water, tray and wall on the outer side;
    //  - TOWARD THE PAVILION, by its bearing in the world, by a share wP of at most WP: eased in over the whole approach,
    //    from the pavilion's distance from the gorge's mouth (where the approach begins) down to PASS, the 16 m at which
    //    the brief has it pass; and let go as it comes abeam, by the metres it still lies ahead along the line of flight,
    //    from one look-ahead to none;
    //  - a LIFT of the eye where the flower's lips are close beside the lens (the tiers stand above it): up to LIFT
    //    degrees at the flank's distance from the outer lips' reach, none at twice that, and let go as the lens comes in
    //    over the lips (gone one flank distance inside their reach);
    //  - FROM THE BRIDGE TO THE CANOPY'S EDGE the eye turns evenly, the same share of a degree with every metre flown,
    //    from where the rule above has it over the bridge to OUT degrees outward of the line of flight (away from the
    //    flower) where the canopy's edge passes overhead: a straight line in the metres still to fly to that edge, no
    //    hold in it and no step. The route itself turns slowly along the flank and fast on the turn in, so the eye
    //    comes to lead the line of flight a little where the turn in begins and falls behind it, outward, as the lens
    //    climbs over the lips: the petal mass slides off to the port side and the water, the tray and the wall open
    //    ahead; under the canopy the petal is a band across the upper port side and the way out is open beneath it.
    //    Over the turn in (TL metres) the eye also looks DOWN, up to DOWN degrees, by the square of the share of the
    //    turn in already flown (no flat part), and that is let go on the way out from under the canopy, by the place
    //    where the lens is out past the outer lips' reach again;
    //  - from the canopy's edge THE SWING to the whole flower: the eye turns steadily to port, SWING degrees for every
    //    metre flown, from where it stands there (OUT degrees outward) until it bears on what it is to rest on; where
    //    that is, the rate decides (and the route keeps its distance from the heart until then: see the tight part of
    //    the spiral); the pitch comes round to the flower over the same way out;
    //  - let go to the line of flight over the last look-ahead before the well's mouth (the dive).
    // What the eye rests on from the canopy on: the flower's middle, half way up its axis from its foot in the water to
    // its crown, so foot and crown are both in view from the water and from above alike. Seen from outside the flower
    // (the lens between the canopy's ring, OC, and the outer lips' reach, and beyond), low over the water, the point is
    // drawn half way out toward the middle of the bridge (the bridge and the pavilion stand in view beside the flower
    // wherever they bear ahead of it); from high up it is the flower's own axis again, and once the lens is above the
    // crown (from the crown's height to twice it) the point moves to the well's mouth and stays there.
    const LIFT = 4, DOWN = 5.5, WP = 0.55, PASS = 16, CROWN_H = 42;
    const crownMid = new THREE.Vector3(0, WATER + 21, 0), bridgeMid = new THREE.Vector3(BR_MID[0], WATER + 21, BR_MID[1]);
    const gP = new THREE.Vector3(), gH = new THREE.Vector3(), gC = new THREE.Vector3(), gOut = new THREE.Vector3();
    // worked out once here, as a table of yaw and pitch at even steps of the route's metres (about 2.5 m), and then held
    // to a top rate of turn (degrees for each metre flown)
    const GN = Math.ceil(LEN / 2.5), GS = LEN / GN, gYaw = new Float32Array(GN + 1), gPit = new Float32Array(GN + 1), AMAX = (SWING + 0.005) * D2R * GS, PMAX = 0.25 * D2R * GS;
    const iLip = Math.min(GN, Math.ceil(dLip / GS)), iBr = Math.min(iLip - 1, Math.round(uBridge * GN)), dMouth = uMouth * LEN, wrap = (a) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));
    const TL = Math.max(40, dLip - uTurnIn * LEN), dPM = Math.hypot(pavXZ[0], pavXZ[1] - zm);      // the turn in's length; the pavilion's distance from the gorge's mouth
    let yLine = 0;                                                                         // the line of flight's heading at the canopy's edge
    for (let i = 0, prev = 0, pdy = 0, kM = 0; i <= GN; i++) {
      const d = i * GS;
      if (i % 140 === 139) await ctx.yield();
      path.posAtDist(d, gP); path.posAtDist(Math.min(LEN, d + EYE_AHEAD), gH).sub(gP);
      if (d > LEN - EYE_AHEAD - 1) gH.copy(boreW);
      const mLip = dLip - d, rO = Math.hypot(gP.x, gP.z), xL = rO - lip1, hW = gP.y - WATER, mMouth = dMouth - d;
      if (i > iLip) kM = Math.max(kM, sstep(CROWN_H, 2 * CROWN_H, hW));
      gC.copy(crownMid).lerp(bridgeMid, i > iLip ? 0.5 * sstep(OC, lip1, rO) * (1 - sstep(60, 92, hW)) : 0).lerp(mouthLow, kM).sub(gP);
      let yh = Math.atan2(gH.x, gH.z); const hl = Math.max(gH.length(), 1e-4), pl = Math.atan2(gH.y, Math.max(Math.hypot(gH.x, gH.z), 1e-4)), ph = pl > 0 ? pl * 0.5 : pl, yc = Math.atan2(gC.x, gC.z), pc = Math.atan2(gC.y, Math.max(Math.hypot(gC.x, gC.z), 1e-4));
      if (i) yh -= Math.PI * 2 * Math.round((yh - prev) / (Math.PI * 2));
      prev = yh;
      if (i === iLip) yLine = yh;
      let dy = yc - yh; dy -= Math.PI * 2 * Math.round((dy - pdy) / (Math.PI * 2));        // the flower stays on the side it is on: past the canopy it is taken round to port, never across the stern
      pdy = dy;
      // the pavilion: metres to it, and metres it still lies ahead along the line of flight
      gC.copy(pavAt).sub(gP);
      const dP = gC.length(), xP = gC.dot(gH) / hl, wP = WP * (1 - sstep(PASS, dPM, dP)) * sstep(0, EYE_AHEAD, xP), dyP = wrap(Math.atan2(gC.x, gC.z) - yh), pP = Math.atan2(gC.y, Math.max(Math.hypot(gC.x, gC.z), 1e-4));
      let y, pt;
      if (i <= iLip) {
        const wF = 0.1 + 0.25 * sstep(FLANK_D, lip1, xL), lift = LIFT * (1 - sstep(FLANK_D, 2 * FLANK_D, xL)) * sstep(-FLANK_D, 0, xL), kIn = sat(1 - mLip / TL);
        y = yh + dy * wF + dyP * wP;
        pt = ph + (pc - ph) * wF + (pP - ph) * wP + (lift - DOWN * kIn * kIn) * D2R;
      } else {
        const fE = sstep(0, EYE_AHEAD, mMouth), kO = sstep(0, Math.max(dOut - dLip, 1), -mLip);
        y = yh + dy * fE;
        pt = ph + (pc - ph) * fE * kO - DOWN * (1 - kO) * D2R;      // (the pitch comes round to the flower on the way out, not at a step)
      }
      gYaw[i] = y; gPit[i] = pt;
    }
    // from the bridge to the canopy's edge: one even turn, a straight line in the metres still to fly to the edge
    { const y0 = gYaw[iBr], y1 = yLine - OUT * D2R; for (let i = iBr + 1; i <= iLip; i++) gYaw[i] = y0 + (y1 - y0) * (i - iBr) / (iLip - iBr); }
    // the swing: from the canopy's edge at SWING degrees a metre until it meets the bearing of what the eye rests on
    { const sl = SWING * D2R * GS; for (let i = iLip + 1, v = gYaw[iLip] + sl; i <= GN && v < gYaw[i]; i++, v += sl) gYaw[i] = v; }
    // held to a top rate of turn from both ends and the two averaged: the eye starts for a fast-passing sight before it
    // comes, and leaves it as late, instead of only ever trailing behind. The pitch first, to its own slower rate; then
    // the heading, to what is left of the whole turn allowed in a step (AMAX) once the pitch has taken its part
    const limit = (G, cap) => {
      const F = new Float32Array(GN + 1), Bk = new Float32Array(GN + 1); F[0] = G[0]; Bk[GN] = G[GN];
      for (let i = 1; i <= GN; i++) { const m = cap(i); F[i] = F[i - 1] + Math.max(-m, Math.min(m, G[i] - F[i - 1])); }
      for (let i = GN - 1; i >= 0; i--) { const m = cap(i + 1); Bk[i] = Bk[i + 1] + Math.max(-m, Math.min(m, G[i] - Bk[i + 1])); }
      for (let i = 0; i <= GN; i++) G[i] = (F[i] + Bk[i]) / 2;
    };
    limit(gPit, () => PMAX);
    limit(gYaw, (i) => { const dp = gPit[i] - gPit[i - 1]; return Math.sqrt(Math.max(AMAX * AMAX - dp * dp, 0)) / Math.max(Math.cos(gPit[i]), 0.3); });
    const gazeAt = (time, u) => {
      const x = Math.max(0, Math.min(1, u)) * GN, i = Math.min(GN - 1, Math.floor(x)), t = x - i;
      const y = gYaw[i] + (gYaw[i + 1] - gYaw[i]) * t, pt = gPit[i] + (gPit[i + 1] - gPit[i]) * t, c = Math.cos(pt);
      path.pointAt(u, gP);
      return gOut.set(gP.x + Math.sin(y) * c * 200, gP.y + Math.sin(pt) * 200, gP.z + Math.cos(y) * c * 200);
    };
    return {
      // probe: a few named points of the layout (not read by the engine)
      probe: { carvedTop, toe: TOE, lip: canopyAt, mouth: mouthW, slot: new THREE.Vector3().fromArray(slotAt), pav: pavAt, bridge: new THREE.Vector3(...FB2(0, 0, 10)), tray: TRAY.map((t) => t[0] + Math.round(t[1]) + '/' + Math.round(t[2])).join(' ') },
      moments: { uGorge, uPav, uBridge, uTurnIn, uSlot, uTurn, uIn, uMouth },
      scene, path, duration: 50, ride: 'none', style: 'none', look: { stack, key: keyVar, weather, rare, a6, psi, under: A.canopy.under, floor: A.canopy.floor, spiral: [S.R1, S.sIn, S.th1, S.th2], chord: OC, lip: lipR, turned: Math.round(Math.atan2(S.d[0] * co[0] + S.d[1] * co[1], S.d[0] * ct[0] + S.d[1] * ct[1]) / D2R), start: START_Z },
      pace: paceOf,
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 30, bank: 0.5, sway: 0.5 },
      // the gaze: the vine on the gorge's wall, lightly, and then the authored gaze over it. The second pull is whole from
      // u 0.04, so from there the flying camera looks exactly where the table says (the vine's pull shows in the first 0.04
      // and for a steady camera, which takes what share of each pull the engine gives it and keeps the rest of its eye on
      // the line of the route).
      pois: [
        { at: (time, u) => vineAt.set(31, -25, path.pointAt(u, vineAt).z + 46), from: 0.005, to: uGorge + 0.01, weight: 0.2, fade: 0.4 },
        // the authored gaze: ONE pull of weight 1 for the whole flight (the engine lets it in and out at the two ends)
        { at: gazeAt, from: 0, to: 1, weight: 1, fade: 0.04 },
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, color: '#DDF6E4', glow: 1, revealDistance: 300 },
      post: { exposure: 0.92, bloom: { strength: 0.2, radius: 0.5, threshold: 1.0 },
        grade: { saturation: 1.05, contrast: 1.05, vignette: 0.3, grain: 0.01, shadowTint: '#1A0504' } },
      update(dt, time, camera, u) {
        // the key comes abeam between the pavilion and the first of the circuit and stays there: side light on the flower all round
        const kSwing = sstep(uPav - 0.02, uBridge + 0.1, u); HU.uKeyMix.value = kSwing;
        hero.setKey(toLocalKey(keyAt(kSwing, keyW), keyLoc)); hero.setProgress(progAt(u)); hero.update(dt, time, camera);
        cp.setFromMatrixPosition(camera.matrixWorld); camera.getWorldDirection(cd);
        LU.uCamS.value = Math.min(START_Z + u * LEN, 150) + 420;      // how far down the gorge the flight has come (as z; it stops counting past the heart)
        const hl = Math.max(Math.hypot(cd.x, cd.z), 1e-3);
        LU.uPatch.value.x = Math.round((cp.x + cd.x / hl * 30) / 1.2) * 1.2; LU.uPatch.value.y = Math.round((cp.z + cd.z / hl * 30) / 1.2) * 1.2;
        // the vine's groove: already at work a little ahead of the entry, it overtakes in the gorge, leaving stem, leaves and scrolls
        path.pointAt(u, pp);
        const headZ = Math.min(pp.z + 22 + 34 * sstep(0.0, uGorge, u), zm);     // the groove head, well ahead on the port wall until the wall ends
        LU.uHeadZ.value = headZ;
        CU.uPeelP.value.set(31.3, vineY(headZ), headZ - 0.5);
        let peel = 0; for (const uk of [uGorge * 0.3, uGorge * 0.68]) { const q = (u - (uk - 0.028)) / 0.05; if (q > 0 && q < 1) peel = q; }
        CU.uPeel.value = peel;
        // THE NEAR FLOCK: forty curls that keep 10 to 20 m from the lens, flying a line of their own beside the path:
        // ONE station for the whole flight, in the frame of the route (FLOCK_ST: metres flown ahead, to starboard of the
        // line of flight there, up; FLOCK_D from the lens's place on the route: the camera itself is not read), lifted where
        // something carved stands under it (carvedTop + FLOCK_CLR), and drawn nearer in plan by as much as it is
        // lifted, so it keeps its distance from the lens. It leaves before the petal pass, by the metres flown between
        // two places: it begins to wheel away, up and out over the water, where the lens comes in over the reach of the
        // flower's outermost lips (dOver), and is gone where its station would come within its own distance of the
        // canopy's edge (two flock distances before the edge): nothing loose is under the petal or anywhere on the spiral.
        const away = sstep(dOver, dLip - 2 * FLOCK_D, u * LEN), a2 = away * away;
        const ua = Math.min(1, u + FLOCK_ST[0] / LEN);
        path.pointAt(ua, pf); path.tangentAt(ua, pt);
        const hf = Math.max(Math.hypot(pt.x, pt.z), 1e-3), fx = pt.x / hf, fz = pt.z / hf;
        CU.uFlockD.value.set(fx, 0, fz);
        pf.set(pf.x - fz * FLOCK_ST[1] - pp.x, pf.y + FLOCK_ST[2] - pp.y, pf.z + fx * FLOCK_ST[1] - pp.z).multiplyScalar(FLOCK_D / Math.max(pf.length(), 1));
        const fup = Math.min(FLOCK_D * 0.92, Math.max(pf.y, carvedTop(pp.x + pf.x, pp.z + pf.z) + FLOCK_CLR - (pp.y - WATER))), fh = Math.sqrt(Math.max(FLOCK_D * FLOCK_D - fup * fup, 1)) / Math.max(Math.hypot(pf.x, pf.z), 1e-3);
        CU.uFlockC.value.set(pp.x + pf.x * fh + (fx * 2 - fz * 3.6) * FLOCK_D * a2, pp.y + fup + 2.4 * FLOCK_D * a2, pp.z + pf.z * fh + (fz * 2 + fx * 3.6) * FLOCK_D * a2);
        CU.uGrow.value = 1 - sstep(0.5, 1, away);
        CU.uRareOn.value = rare ? bump(uBridge + 0.02, uBridge + 0.08, uIn, uIn + 0.05, u) : 0;
        CU.uWellS.value = (u - uMouth) * LEN;
        RU.uCam.value.copy(cp);
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(sz); RU.uPx.value = 1.2 / Math.max(sz.y, 1); }
        // rare: one groove six metres wide crosses the whole vault, cutting a new cloud band
        if (rare) { const hb2 = sstep(uPav, uSlot, u); VU.uBand.value.set(-4084, -4084 + 8168 * hb2, hb2 > 0 ? 1 : 0, 1 - sstep(uSlot - 0.05, uSlot + 0.03, u)); }
      },
      dispose() { shadeTex.dispose(); },
    };
  },
};
