// THE TISZA IN FLOWER (mayfly-bloom), after Emile Galle: a June evening on a lowland river seen from
// inside a lamp-lit Nancy cameo vase. Everything is the blank (a satin ground graded citron, honey, rose,
// closed by an aubergine collar) times overlays of olive, amber-brown and aubergine glass cut back in
// steps; the only thing lighter than the ground is gold foil sealed in wings. No lights, no fog, no
// textures, no blending except the mount's wing blur. post.flat = 1: colours reach the screen as written.
//
// Layout (the hero's local space = world space): entry at the origin, +Z upstream, water at y 0. The
// river runs straight to z 250, then bends to starboard (+X) on a radius of 170 m. Port bank: the clay
// bluff with martin holes; starboard: a low bar with hogweed, the sandbar with storks, white willows.
// The path (round 3) is an S across the river: past a hogweed specimen at the tip of the bar, low over the lily
// rafts, up into the dance 30 m off the banded clay bluff, low over a water lily in flower, back across past the
// storks wading off their bar, then (o5) up the open reach to the GATE OF UMBELS (five giant hogweeds arching over
// the channel with the lamp's flare behind them), under it looking up through the spokes, on past one willow on
// its islet, then straight through a curtain of fronds into a flooded willow channel to the portal. The water is the mirror of the vase's wall, a tone deeper (rose to plum under the eye): see
// glassGround in the part.
// (o7) The evening sun is in the wall now: one round of deeper honey with a pale rim (glassGround, uSun.w), standing
// behind the far gate of umbels from the entry on, with its path of level gold breaks on the water (waterMat). The
// mayfly bloom is gathered into ONE COLUMN at the head of the bend (s 437, two winding strands, a pool of spent wings
// at its foot) and the even swarm is two thirds of what it was. The clay bluff is planted (aprons of leaf, an iris bed
// along its foot, iris clumps beside the course), the gate leaves its image in the water, and no willow hangs
// trunkless over the lens beside the storks or under the lone willow.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import {
  buildHero, makeGlass, GLASS_GLSL, GALLE_PALETTE, overlayMaterial, blankMaterial, courseAt, DEFAULT_COURSE, dragonflyGeometry, dragonflyStyle, WING_GLSL,
} from '../parts/mayfly-bloom.js';

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bump = (a, b, x, soft) => sstep(a, a + soft, x) * (1 - sstep(b - soft, b, x));
// (p3) BELOW THE SKIN: THE WELL'S LAW. The water's skin (the plane y 0) is treated as OPAQUE and pierced by ONE ROUND HOLE about
// the route's own point. The point is path.pointAt(u); the radius is a law of progress (wellR in build: 0 outside the stretch, u
// HALL_U = 0.118 to 0.29, which is 62.1 to 152.7 m of route; 1.2 m as the route comes down to the skin and through it; from 0.5
// to 3 m of route under the skin it WIDENS to twice that (WELL_WIDE), keeps it until WELL_HOLD (4.2 m of route after the first
// touch) and is drawn in to a tenth over the WELL_DRAW (3.2 m of route) after that; and the mirror of that before the second
// touch, for the rise; above the water it is 1.2 m as it was). The hole is where the skin lies within that radius of that
// point. (p3 hall3, with the deeper line; hall3/prints/round-s7.txt) The route goes through the skin at 74.2 m and at 140.4 m (74.21 and 140.41 by a finer walk).
// The hole on the skin is 1.2 m in radius at the touches and WIDEST, 2.35 m, 3 m inside each touch (at 77.2 m and at 137.45 m);
// it is open for 6.1 m of route after the first touch (74.2 to 80.3 m) and its last 2 m of radius shut in 1.25 m of route
// (79.05 to 80.3 m); on the rise it opens at 134.3 m and is 2 m wide by 135.55 m. It is not there at all while the route is
// further from the skin than the radius (its rim wanders 0.08 m by a noise of the place). What the shaders compute (wellIn and
// wellHid in the style kit: does the straight line from the eye to this fragment cross the skin inside the round?) is exactly
// the picture a real hole in an opaque skin would give, no more: a thing under the skin is seen from above only through the
// hole; a thing over the skin is seen from beneath only through the hole; the skin, and what floats or is pictured on it, is
// not there inside the hole. This is the ONLY reading of the eye's place that the passage under the skin ADDS to hide anything (live's ribbon is cleared within 2.5 to 11 m of the eye, as it was). The passage under the skin
// moves, sizes and times nothing else by where the eye is. It LIGHTS one thing by it, as live's blank does: the hall's ground
// (hallGround in the part) warms toward the lamp's bearing, and that bearing is taken from the eye's place (update: uSun.xy).
// Nothing at all goes by the lens, a window, a seed's number, a still or the wall clock; there is no timer. The hall reads no
// lens or window uniform; its edges, the stems' rim, the nets' and the chains' fineness go by the pixel's footprint, as
// live's cut does.
// What goes by PROGRESS (u) and not by the eye: the radius; THE HALL'S MESHES SHOWN (p3 hall3: the basin, the burrows, the ceiling
//   and everything that stands under the skin are drawn only while u is inside HALL_U, the round's own bounds; outside it every
//   fragment of them was discarded anyway; the two pads beside the touches lie on the skin and are shown from the start (but for the one update on which the world above goes to rest, at 80.4 m; while no hole is open every fragment of them is discarded) to u
//   0.29; the shoal's matrices are sent only while the hall is shown); the three images (image, mirror, gate-image: geometry
//   hung under the water that stands for the bank's picture ON the skin, so from beneath an opaque skin it is not seen: not
//   drawn while the route's point is under the skin); the banks' flat sheets (WELL_OVER, below); the world above (all of it but those two pads) resting while
//   the route's point is deeper than the radius and 0.1 m (no hole is open then, so no sight line reaches it: `shut` in
//   build); the neighbours and the blur of our own wings withdrawn (underK: u 0.118 to 0.128, back over u 0.27 to 0.28); the
//   lotus opening (by the OLD line's progress 0.17 to 0.21, which is 89.6 to 110.7 m of route); the looks (the vault look, the
//   lotus look and, p3 hall3, the two end looks: END_LOOK in build); the ceiling's net widening with the distance, in the
//   skin's own plane, from the route's own point (uWell.xz: progress, not the eye);
//   (p3 hall2) OUR OWN TWO FORELEGS DRAWN BACK under the body from 67 to 73 m of route and let out again from 141 to 146 m
//   (foldK, below: they were the two thin lines at the foot of every frame; before 67 m and after 146 m they are live's); the
//   one shoal's place in the nave (shoalAt in build: metres of route).
// What goes by PLACE alone: the basin, the hall, its garden, the planting of its two ends, the roots on its walls, the forms on
//   its bed and the clear air of all of them (lineD: the flown line's own points); the ceiling's net's PLACE AND DRIFT (the skin's own place,
//   the sun's road, a line of the world, and the clock; its CELL SIZE is not by place: it widens by steps with the distance from the route's own
//   point, uWell.xz, a law of progress listed above, and in flight the eye stands on that point in plan: shading only, nothing is placed,
//   hidden or moved by it; where one step of size hands over to the next, on rings 8, 16 and 32 m from that point, a few lines of the net
//   end); the shafts of light (from a gap between discs down the sun's bearing to the bed); the
//   ONE net of light on the bed (in the bed's own material: the same law of net as the ceiling's (rnet) with the bed's own 1.3 m cells, offset and
//   rate, read at the place that lies up the sun's bearing from the bed's own place, boldest round the shafts' feet; no eye, no lens); the beads' strings. No pad or
//   cast skin lies near the low line, and NO REED CLUMP STANDS INSIDE THE TUB'S PLAN NOR WITHIN 0.6 m OF IT. One constant of
//   the water reaches beyond the stretch: THE EMERGENCE DIMPLES RUN TO z 150 (live: z 100; uEmerge.y), bank to bank, and that
//   water can be seen from the entry reach (before 56 m of route).
// What goes by the world's CLOCK: the rim's two rings, the ceiling's and the bed's nets drifting on the water's own flow, the
//   shafts' sway, the stems' and roots' sway, the chains' climb, the beads' rise, the lotus's breathing, the shoal's fin beat
//   and its little rise and fall.
// EVERY READ OF THE EYE'S PLACE in this file (hall3/prints/eye-reads.txt lists each line):
//   (1) WELL_UNDER and the style kit's wellIn/wellHid: the hole, as above.
//   (2) The ground along the sight line, in every material (water, ribbon, mirror, column, chains, (p3 hall3) shafts and beads,
//   and the kit's overlay and blank): the style itself, a colour by the sight line's direction; with it the kit's cut by
//   distance (how fine the cut is) and each drawn thing's own fineness by distance (hammer marks, flecks, the trees' rim, the
//   column's dancers as specks: these two read the window's height too; live's).
//   (3) Live's fronds (the curtain of the last reach): far strands drawn up, near strands turned and parted round the eye, a
//   slot toward the portal; live's, as it was.
//   (4) update: the blank's sphere is centred on the eye; THE SUN'S BEARING is taken from the eye's place to the lamp's foot
//   (uSun.xy; live's); THE RIBBON'S FRONT AND THE FLOCKS' WINDOW go by the eye's place along the course (latOf of the eye;
//   live's); THE CLOSE FLOCK FLIES AT THE EYE'S HEIGHT (live's); our own body (legs, wing blur, what we carry) rides with the
//   camera; the hero is updated with the camera and told the window's height.
//   In the style kit: the swarm lies low far from the eye and parts along the sight line to the portal, the gold leaf is dealt
//   in a box that goes with the eye, the escort is posed from the camera, and swarm, neighbours and column keep a far animal
//   from falling under about two pixels (they read the window's height and the projection for that); all live's, as they were.
//   The hall adds only (1) and, in the chains', the shafts' and the beads' shaders, the ground along the sight line of (2).
//   THE CEILING READS NO EYE AT ALL (its net goes by its own place and the route's point, on which the eye stands in plan while we fly). (p3 hall2) The second round added no
//   read: the bed with its light, the colonies, the roots, the garden and the shoal are cut in the kit's overlay (the ground
//   and the cut of (2)) and wear WELL_UNDER (1); the forelegs go by progress. (p3 hall3) The third round adds none either.
// The law is typed once in the style kit (wellOn, wellIn, wellHid: parts/mayfly-bloom.js); these are its uses.
// The three images that hang under the water (image, mirror, gate-image): not drawn where the well is, nor while the route's own point is under the skin.
const WELL_IMAGE = 'if (uWell.w > 0. && (uWell.y < 0. || wellIn(vWpos) > 0.5)) discard;';
// A thing built under the skin: seen from above it is drawn only inside the well (and its lap above the skin never).
const WELL_UNDER = 'if (vWpos.y > 0. || (cameraPosition.y > 0. && wellIn(vWpos) < 0.5)) discard;';
// The skin seen from beneath (the hall's ceiling), and what floats on the skin (pads, cast skins): not drawn inside the well.
const WELL_SKIN = 'if (wellOn(vWpos) > 0.5) discard;';
// A wide flat thing over the skin (the banks, 0.03 to 0.45 m high and 12 m or more from the route): not drawn while the route's own
// point is more than 0.05 m under the skin (from there no sight line through the round reaches it), and in those 0.05 m, seen from
// beneath, only through the well. The closed basin and the ceiling stand before it anyway; but a far sheet seen edge-on from just
// under its own height is a sliver one pixel high whose depth a rasteriser gets wrong, and it showed as a dark dash on the hall's wall.
const WELL_OVER = 'if ((uWell.w > 0. && uWell.y < -0.05) || wellHid(vWpos) > 0.5) discard;';
// A thing that stands or flies above the skin, seen from beneath: drawn only where the sight line to it crosses the skin inside
// the well (the first rule's mirror). The ceiling stands before it everywhere else; but now and then one stray pixel of the
// trees, the reeds or the iris came through at the frame's very edge (trial/prints/speck.txt), and this takes it away. Worn by
// everything cut in the overlay skin that stands on the banks or flies (aboveMaterial); the banks themselves wear WELL_OVER.
const WELL_ABOVE = 'if (wellHid(vWpos) > 0.5) discard;';   // wellHid (the style kit): a fragment over the skin, the eye under it, the sight line crossing the skin outside the round
const aboveMaterial = (glass, o = {}) => overlayMaterial(glass, { ...o, fragPost: (o.fragPost || '') + WELL_ABOVE });
// Where the flight is under the water or about to be (by u): the neighbours and the blur of our own wings are withdrawn there.
const HALL_U = [0.118, 0.29];   // (p3 hall3) THE STRETCH, a law of progress: the round has a radius, and the hall's meshes are drawn, only between these two
const WELL_R = 1.2;   // the round's radius at its widest, in metres, round the route's own point (by progress: wellR in build)
const WELL_WIDE = 1, WELL_HOLD = 4.2, WELL_DRAW = 3.2;   // (p3 hall2) the round under the skin: wider by WELL_WIDE times its radius from 0.5 to 3 m of route after the first touch, kept until WELL_HOLD metres after it, then drawn in over WELL_DRAW metres (and the mirror of that before the second touch)
const underK = (u) => sstep(0.118, 0.128, u) * (1 - sstep(0.27, 0.28, u));   // (p3 hall3) back over u 0.27 to 0.28 (142.2 to 147.4 m: the line comes up through the skin at 140.4 m)
// (p3 hall2) OUR OWN FORELEGS (the two legs carried before the eye) are drawn back under the body where the flight goes down to the
// skin and let out again after the rise: a law of progress along the route, in metres of route (drawn back over 67 to 73 m, out
// again over 141 to 146 m; the route is under the skin from 74.2 to 140.4 m). Before 67 m and after 146 m: 0, the legs as live has them.
const FOLD = [67, 73, 141, 146];
const foldK = (m) => sstep(FOLD[0], FOLD[1], m) * (1 - sstep(FOLD[2], FOLD[3], m));

// The water's hammer marks (the water's own text, taken out whole so that the hall's bed can carry the same field: p3 hall2)
const MARTELE_GLSL = /* glsl */`
        float martele(vec2 p){
          p.y *= 0.62; vec2 i = floor(p), f = fract(p); float best = 9.;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 o = vec2(float(x), float(y)); vec2 c = o + 0.5 + (vec2(gHash(i + o), gHash(i + o + 17.3)) - 0.5) * 0.7 - f;
            best = min(best, dot(c, c));
          }
          return 1. - smoothstep(0.0, 0.5, sqrt(best));              // a shallow dish: 1 at the heart, grading to 0 at the rim
        }
`;
// (p3 hall3) THE RIPPLE NET: the cut light a rippled skin throws. rnet(p, t): a field of cells (one to a unit of p) whose points
// swing round their own places on the clock t; it is 0 on a cell's border and grows inward, so "rnet < w" is a net of lines.
// skinNet(q, D, fw, w): the net at the place q (metres on the skin) as it is cut D metres away IN THE SKIN'S OWN PLANE from the
// route's own point (a law of place and progress: no eye, no lens): cells NET_S0 metres wide within NET_D0 metres of that
// point, twice as wide at each doubling of D (to 16 times) and drawn out along the reach (+Z) as they widen, so that the net
// stands as a net at a grazing angle 40 m up the hall as well as overhead. Between two widths the finer net's lines thin to
// nothing while the wider net's grow from nothing (hard edges throughout: no dissolve). Returns the line's mask; fw = the
// pixel's footprint on the skin in metres (x, z), by which a cut edge is eased and lines finer than a pixel give way to their
// flat average, as everywhere in the cut.
const RNET_GLSL = /* glsl */`
        float rnet(vec2 p, float t){
          p += (vec2(gNoise(p * 0.83 + vec2(3.1, t * 0.11)), gNoise(p * 0.83 + vec2(t * 0.09, 8.7))) - 0.5) * 0.9;   // the lines are bent: a ripple is no straight edge
          vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9.;
          for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
            vec2 o = vec2(float(x), float(y)), h = vec2(gHash(i + o), gHash(i + o + 17.3));
            vec2 c = o + 0.5 + 0.36 * sin(t * (0.7 + 0.6 * h.yx) + 6.2831 * h) - f;
            float d = dot(c, c); d2 = min(d2, max(d1, d)); d1 = min(d1, d);
          }
          return sqrt(d2) - sqrt(d1);
        }
        float netLine(float n, float w, float g, float f){ float ge = max(g, 1e-4); return mix(1. - smoothstep(w - ge, w + ge, n), min(2.4 * w, 1.), smoothstep(0.6 * w, 2.2 * w + 1e-4, f)) * step(1e-3, w); }
        float skinNet(vec2 q, float D, vec2 fw, float w, float t, float seed){
          float L = log2(clamp(D / NET_D0, 1., 16.)), l0 = floor(L), e = smoothstep(0.15, 0.85, L - l0);
          float sA = NET_S0 * exp2(l0), aA = 1.3 * pow(1.45, l0), sB = sA * 2., aB = aA * 1.45;
          float nA = rnet(vec2(q.x / sA, q.y / (sA * aA)) + l0 * 7.31 + seed, t), nB = rnet(vec2(q.x / sB, q.y / (sB * aB)) + (l0 + 1.) * 7.31 + seed, t);
          float fA = max(fw.x / sA, fw.y / (sA * aA)), fB = max(fw.x / sB, fw.y / (sB * aB));
          float wv = w * (0.5 + 1.1 * gNoise(q / (sA * 1.7) + seed + 5.));   // a line swells and thins along its way
          float gA = min(fwidth(nA), 3. * fA), gB = min(fwidth(nB), 3. * fB);   // the edge's ease: the field's own change across a pixel (bounded by the footprint, so the step between two widths draws no ring)
          return max(netLine(nA, wv * (1. - e), gA, fA), netLine(nB, wv * e, gB, fB));
        }
`;
// (p3 hall3) THE SKIN'S TONES FROM BENEATH, ONE TYPED SET: the ceiling's ground, the two tones of its net, and the tones of the
// pads' discs seen against it. The hall's two variants differ in this set alone.
//   PALE: a honey ground, a citron and an amber net (the base's tone, the net three times and more as strong in value as the
//         base's hammering); the discs in the pads' own olive cut.
//   DEEP: what a water's skin does from beneath outside the round overhead: it mirrors the bed. A rose-plum ground one step
//         lighter than the bed, a honey and a citron net; the discs lit glass against it (the light comes through them from
//         above): a honey-olive heart, a bright cut rim, darker ribs.
// ground, netA, netB: GLSL colours (uAmberT: the amber overlay's multiplier); netW: the two nets' line widths in cells;
// disc: GLSL run after a vault disc's cut ('' = the pads' own cut), with dLit = 1 on a disc under the skin, 0 on a sunken leaf.
const SKIN_TONES = {
  ground: 'mix(uHoney, uCitron, 0.2)', netA: 'uCitron', netB: 'mix(uHoney, uCitron, 0.2) * mix(vec3(1.), uAmberT, 0.42)', netW: [0.085, 0.07],
  disc: '',
};
const NET_GLSL = `\n#define NET_S0 0.85\n#define NET_D0 4.\n${RNET_GLSL}`;

// A small geometry collector: every form carries attribute "cut" = (relief 0 edge..1 heart, wheel
// coordinate, round flag). Round forms (tubes, blobs) take their relief from the facing term.
class Cutter {
  constructor() { this.pos = []; this.nor = []; this.cut = []; this.idx = []; this.extra = null; this.extraSize = 0; this.cur = null; }
  withExtra(size) { this.extra = []; this.extraSize = size; this.cur = new Array(size).fill(0); return this; }
  v(x, y, z, nx, ny, nz, r, w, round) {
    this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.cut.push(r, w, round);
    if (this.extra) for (let k = 0; k < this.extraSize; k++) this.extra.push(this.cur[k]);
    return this.pos.length / 3 - 1;
  }
  get count() { return this.pos.length / 3; }
  // tube through pts ([x,y,z]...) with radii; wheel coordinate w0 + along*wk (so rings or one line can be engraved)
  tube(pts, radii, sides = 6, w0 = 9, wk = 0) {
    const base = this.count, n = pts.length;
    const t = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3();
    let len = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(i + 1, n - 1)], o = pts[Math.max(i - 1, 0)];
      t.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(t.y) > 0.9) up.set(1, 0, 0);
      a.crossVectors(t, up).normalize(); b.crossVectors(a, t);
      if (i > 0) len += Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]);
      const R = Array.isArray(radii) ? radii[i] : radii;
      for (let k = 0; k < sides; k++) {
        const an = k / sides * TAU, c = Math.cos(an), s = Math.sin(an);
        const nx = a.x * c + b.x * s, ny = a.y * c + b.y * s, nz = a.z * c + b.z * s;
        this.v(p[0] + nx * R, p[1] + ny * R, p[2] + nz * R, nx, ny, nz, 0, w0 + len * wk, 1);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
      const p0 = base + i * sides + k, p1 = base + i * sides + (k + 1) % sides;
      this.idx.push(p0, p1, p0 + sides, p1, p1 + sides, p0 + sides);
    }
  }
  // lumpy blob (a crown, a clump): a sphere pushed in and out by a few sine lobes; normals are recomputed
  // by finish({ smooth: true }) so the lumps show as terraces
  blob(cx, cy, cz, rx, ry, rz, seed, lump = 0.22, seg = 10, rows = 6, w = 9) {
    const base = this.count;
    for (let j = 0; j <= rows; j++) {
      const ph = j / rows * Math.PI, sy = Math.cos(ph), sr = Math.sin(ph);
      for (let i = 0; i < seg; i++) {
        const th = i / seg * TAU, dx = Math.cos(th) * sr, dz = Math.sin(th) * sr;
        const l = 1 + lump * (Math.sin(th * 3 + seed * 7.1 + sy * 2.3) * 0.6 + Math.sin(th * 5 - seed * 3.7 + sy * 4.1) * 0.4) * sr
          + lump * 0.5 * Math.sin(sy * 5 + seed * 11);
        this.v(cx + dx * rx * l, cy + sy * ry * l, cz + dz * rz * l, dx, sy, dz, 0, w, 1);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * seg + i, b = base + j * seg + (i + 1) % seg;
      this.idx.push(a, a + seg, b, b, a + seg, b + seg);
    }
  }
  // a weeping crown: one lobe of a mass of hanging leaf, a leaning dome open below. cut = (h: 1 at the apex ..
  // 0 at the foot of its skirt, arc length round it in metres (offset per lobe so no two are cut alike), 2).
  // The fragment shader cuts the solid leaf mass in the upper part and strands of lance leaves of unequal
  // length in the skirt, so the foot is hanging leaf with sky between; hemAt(x, z) may lift the foot locally.
  crown(cx, top, cz, R, hem, seed, seg = 14, rows = 7, hemAt = null, lump = 0.26, sx = 0, sz = 0) {
    const base = this.count, n1 = seg + 1, arc0 = (seed * 13.7) % 61;
    for (let j = 0; j <= rows; j++) {
      // rings are closer together toward the apex, so the top is a round dome and never a faceted cone
      const f = Math.pow(j / rows, 1.7), k = Math.min(1, f * 2.1), prof = Math.pow(Math.sin(k * Math.PI / 2), 0.75) * (1 + 0.1 * f * f) + 0.02;
      for (let i = 0; i <= seg; i++) {
        const th = (i % seg) / seg * TAU, c = Math.cos(th), s = Math.sin(th);
        const l = 1 + lump * (0.4 + 0.6 * f) * (Math.sin(th * 3 + seed * 7.1) * 0.5 + Math.sin(th * 5 - seed * 3.7 + f * 2.2) * 0.3 + Math.sin(th * 2 + seed * 1.9) * 0.4);
        const x = cx + sx * (1 - f) + c * R * prof * l, z = cz + sz * (1 - f) + s * R * prof * l;
        const hy = hemAt ? Math.max(hem, hemAt(cx + c * R * l, cz + s * R * l)) : hem;
        const y = top - (top - hy) * Math.pow(f, 1.25) * (1 - 0.1 * Math.sin(th * 2 + seed) - 0.07 * Math.sin(th * 3 + seed * 2.3)) + (1 - f) * (1 - f) * 0.5 * R * 0.3 * Math.sin(th * 2 + seed * 4.1) * Math.min(1, f * 4);
        this.v(x, y, z, c, 0.3, s, 1 - f, arc0 + i / seg * TAU * R, 2);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * n1 + i, b = a + 1;
      this.idx.push(a, a + n1, b, b, a + n1, b + n1);
    }
  }
  // a closed mass of leaf (a poplar's spindle): an ellipsoid, pointed above, bitten at its outline. cut = (0, arc, 3)
  mass(cx, cy, cz, rx, ry, rz, seed, seg = 9, rows = 7) {
    const base = this.count, n1 = seg + 1, arc0 = (seed * 9.3) % 47;
    for (let j = 0; j <= rows; j++) {
      const f = j / rows, sy = Math.cos(f * Math.PI), sr = Math.pow(Math.sin(Math.pow(f, 1.35) * Math.PI), 0.8);
      for (let i = 0; i <= seg; i++) {
        const th = (i % seg) / seg * TAU, c = Math.cos(th), s = Math.sin(th);
        const l = 1 + 0.22 * (Math.sin(th * 3 + seed * 7.1 + sy * 3.1) * 0.6 + Math.sin(th * 2 - seed * 3.7 + sy * 6.3) * 0.4);
        this.v(cx + c * rx * sr * l + 0.12 * ry * sy * Math.sin(seed * 5.1), cy + sy * ry, cz + s * rz * sr * l, c, 0.2, s, 0, arc0 + i / seg * TAU * rx, 3);
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) {
      const a = base + j * n1 + i, b = a + 1;
      this.idx.push(a, a + n1, b, b, a + n1, b + n1);
    }
  }
  finish(o = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('cut', new THREE.Float32BufferAttribute(this.cut, 3));
    if (this.extra) g.setAttribute(o.extraName || 'aX', new THREE.Float32BufferAttribute(this.extra, this.extraSize));
    g.setIndex(this.idx);
    if (o.smooth) g.computeVertexNormals();
    return g;
  }
}

export default {
  id: 'mayfly-bloom',
  name: 'The Tisza in Flower',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Émile Gallé, 1846 to 1904',
  weirdness: 0.3,
  media: ['air', 'water', 'tiny'],

  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---- the edition, chosen once -------------------------------------------------------------
    const er = rng(), cr = rng();
    let edition = er < 0.45 ? 'honey' : er < 0.6 ? 'thunder' : er < 0.8 ? 'highwater' : 'autumn';
    if (vary.hour === 'golden' || vary.hour === 'day') edition = er < 0.6 ? 'honey' : 'highwater';
    else if (vary.hour === 'night') edition = 'thunder';
    else if (vary.hour === 'dawn') edition = 'autumn';
    const flooded = edition === 'highwater';
    const hunterCast = cr < 0.3;                       // martins give way to forty dragonflies
    const rare = !!vary.rare;                           // the white-tailed eagle
    const glass = makeGlass(GALLE_PALETTE, flooded ? 'honey' : edition);
    glass.uniforms.uSun.value.set(0.33, 0.944, 0.34, 4.9);   // (o5) the lamp stands up the bend, behind the gate of umbels
    const GU = glass.uniforms, T = glass.tints;
    GU.uBand.value.z = 34;                              // (o5) the collar sits higher: it closes the picture when the gaze tips up (under the gate of umbels), and is never a dark band cut by the top of a level frame
    const rose0 = GU.uRose.value.clone(), roseSmoke = rose0.clone().lerp(GU.uHoney.value, 0.34).lerp(GU.uAub.value, 0.1);
    const riverHalf = flooded ? 80 : 45;
    const C = DEFAULT_COURSE;

    // ---- the hero: the river of wings ----------------------------------------------------------
    let uRoute = 0;   // (p3) the flight's progress along the flown route, as the engine hands it to update()
    const hero = await buildHero(ctx, { glass, detail, riverWidth: riverHalf * 2, dragonflies: 6, count: 13000, farCount: 8500, neighboursAway: () => underK(uRoute) });   // (p3) by the route's own progress (set in update)
    scene.add(hero.object);
    const A = hero.anchors;
    await ctx.yield();

    // ---- the path ------------------------------------------------------------------------------
    const exitS = A.exitS, ex = courseAt(exitS, C), seat = A.portalSeat.position;
    const rideY = 0.95;
    // (round 3) an S across the river: the hogweed bar, low over the lily rafts, the dance under the clay bluff, back across to the storks' bar
    // (o5) the bluff is passed at 30 m (its beds are lines at a distance, never a wall at the lens) and low over a water lily in
    // flower; the bend is four pictures: up over the open reach toward the gate of giant umbels with the lamp's flare behind it
    // (s 262-300), down and under the gate looking up through its spokes (s 316-330), on to one arching willow on its islet
    // (s 396), then up to look down on the pads as the round cut of the portal shows (s 406-424)
    const pts = [[0, 2.5, 0], [0.3, 2.5, 30], [1.2, 2.3, 56], [-4, 1.2, 84], [-11, 2.6, 112], [-16, 3.5, 140], [-17, 2.0, 164], [-16, 1.3, 184], [-13, 2.1, 206], [-7, 2.6, 224], [0, 2.3, 242]];
    for (const [s, y] of [[262, 2.6], [280, 2.8], [298, 2.3], [316, 1.7], [334, 1.4], [352, 1.3], [370, 1.5], [388, 2.4], [406, 4.2], [424, 4.2], [441, 2.7]]) {
      const p = A.bandPoint(s, 0.1); pts.push([p.x, y, p.z]);
    }
    pts.push([ex.x, 1.5, ex.z], [ex.x + ex.tx * 31, 2.9, ex.z + ex.tz * 31], [seat.x, seat.y, seat.z]);
    const path = makePath(pts);   // (p3) the line the world is planted along: every clearance, lifted hem and placement below is taken from it, as it always was
    // (p3) BELOW THE SKIN: THE FLOWN ROUTE. Up to the knot at z 56 and from the knot at z 164 it IS the old line (the same curve, so
    // the eye, the gaze and the bank outside the stretch are what they were). Between those two knots three knots give way to the
    // plan's eight on the same plan line: down through the water's skin at z 75.6, 3 m under it at z 103, up through it at z 134.1.
    // The eight are joined by the kit's own curve through the two old knots, with a guide knot beyond each end set so that the new
    // curve leaves and rejoins the old line in the old line's own direction (the kit's centripetal curve passes a knot along the
    // bisector of the two chords that meet there: the guide is the far chord mirrored in the old direction, at two and a half times
    // its length, which turns the pitch most gently: with the plan's heights 1.15 degrees per metre at the worst). One curve through all
    // the knots would not do: a span of it leans on the knot beyond each of its ends, and the old line moved by 0.2 m before z 56.
    const zMetre = (p, z, hi) => { const v = new THREE.Vector3(); let a = 0, b = hi; for (let i = 0; i < 48; i++) { const m = (a + b) / 2; if (p.posAtDist(m, v).z < z) a = m; else b = m; } return (a + b) / 2; };   // the reach runs up +Z there
    // (p3 hall) heights eased against the plan's (1.3, 0 and, at the last knot, 2.2), the plan line kept: with them no place of the
    // route turns its pitch faster than 0.8 degrees a metre (hall/prints/route-*.txt)
    // (p3 hall3) THE DEEPER LINE: sixteen knots on the same plan line (their x is the second round's plan line at their z, to 0.01 m),
    // so that the line is 2.0 m under the skin by 87 m of route and still 2.0 m under at 127 m: through the skin at 74.2 m (z 73.8),
    // 3.0 m under it from z 103 to z 110 (as it was), up through it at 140.4 m (z 138.0); never steeper than 9.7 degrees, its
    // pitch never turning faster than 1.1 degrees a metre (hall3/prints/knots.txt). ROAD_AT: the hall's middle (the fourth of the
    // second round's eight knots), a place of the world the sun's road is drawn through.
    const HALL_KNOTS = [[0.68, 1.98, 61], [-0.12, 1.30, 66], [-1.09, 0.46, 71], [-2.19, -0.38, 76], [-3.31, -1.24, 81], [-4.56, -2.08, 86.3], [-6.53, -2.78, 94], [-8.85, -3.0, 103],
      [-10.49, -2.9, 110], [-12.22, -2.6, 118], [-13.59, -2.06, 124.9], [-14.44, -1.40, 129.5], [-15.75, 0, 138], [-16.5, 1.14, 145], [-16.82, 1.90, 151], [-16.96, 2.2, 156.5]], ROAD_AT = [-8.8, 102.8];
    const LL = path.length, mA = zMetre(path, pts[2][2], 200), mB = zMetre(path, pts[6][2], 200);   // the old line's metres at the two knots
    const guide = (knot, far, T) => { const k = new THREE.Vector3(knot[0], knot[1], knot[2]), v = new THREE.Vector3(far[0], far[1], far[2]).sub(k), len = v.length(); v.normalize(); return k.addScaledVector(T.clone().multiplyScalar(2 * T.dot(v)).sub(v), -2.5 * len); };
    const mid = makePath([guide(pts[2], HALL_KNOTS[0], path.tangentAtDist(mA)), pts[2], ...HALL_KNOTS, pts[6], guide(pts[6], HALL_KNOTS[HALL_KNOTS.length - 1], path.tangentAtDist(mB))]);
    const sA = zMetre(mid, pts[2][2], mid.length), LM = zMetre(mid, pts[6][2], mid.length) - sA, LR = mA + LM + (LL - mB);   // the new span's length; the route's
    const route = (() => {
      const N = 320, sx = new Float32Array(N + 1), sy = new Float32Array(N + 1), sz = new Float32Array(N + 1), v = new THREE.Vector3();
      const r = {
        length: LR, points: [...pts.slice(0, 3), ...HALL_KNOTS, ...pts.slice(6)].map((q) => new THREE.Vector3(q[0], q[1], q[2])),
        start: path.start, end: path.end, startTangent: path.startTangent, endTangent: path.endTangent,
        posAtDist(d, out = new THREE.Vector3()) { return d <= mA ? path.posAtDist(d, out) : d >= mA + LM ? path.posAtDist(d - (mA + LM) + mB, out) : mid.posAtDist(sA + (d - mA), out); },
        tangentAtDist(d, out = new THREE.Vector3()) { return d <= mA ? path.tangentAtDist(d, out) : d >= mA + LM ? path.tangentAtDist(d - (mA + LM) + mB, out) : mid.tangentAtDist(sA + (d - mA), out); },
        pointAt(u, out) { return r.posAtDist(u * LR, out); },
        tangentAt(u, out) { return r.tangentAtDist(u * LR, out); },
        nearestXZ(x, z) { let best = Infinity, bi = 0; for (let i = 0; i <= N; i++) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } return { dist: Math.sqrt(best), u: bi / N, y: sy[bi] }; },
        distanceTo(x, y, z) { let best = Infinity; for (let i = 0; i <= N; i++) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); },
        isClear(x, y, z, radius = 0, margin = 4) { return r.distanceTo(x, y, z) > radius + margin; },
        frameAt(end, out, tilt) { return path.frameAt(end, out, tilt); },   // both ends are the old line's
      };
      for (let i = 0; i <= N; i++) { r.posAtDist(i / N * LR, v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; }
      return r;
    })();
    // The route is longer than the line it replaces (by the new span's length less the old span's), so the same u is no longer the
    // same place. Everything the world keys to progress (the hero's hatch, band and escort, the lamp's flare, the ribbon, the eagle,
    // the looks, the pace) keeps its PLACE: liveU(u) is the progress the old line had where the route stands at u (across the new
    // span, in proportion), routeU its inverse.
    const liveU = (u) => { const d = clamp(u, 0, 1) * LR; return (d <= mA ? d : d >= mA + LM ? d - LM + (mB - mA) : mA + (d - mA) * (mB - mA) / LM) / LL; };
    const routeU = (ul) => { const d = clamp(ul, 0, 1) * LL; return (d <= mA ? d : d >= mB ? d + LM - (mB - mA) : mA + (d - mA) * LM / (mB - mA)) / LR; };
    const P0 = route.pointAt(0), T0 = route.tangentAt(0);
    const pathClear = (x, z) => path.nearestXZ(x, z).dist;
    // lateral offset of a point from the river's centre line (negative = port) and its course s
    const latOf = (x, z) => { const s = A.courseNearest(x, z), c = courseAt(s, C); return { s, lat: (x - c.x) * c.tz - (z - c.z) * c.tx }; };
    const atLat = (s, lat) => { const c = courseAt(s, C); return [c.x + c.tz * lat, c.z - c.tx * lat, c]; };
    // the starboard water's edge: the hogweed bar (s 14..128) and the storks' sandbar (s 166..214) reach in
    const barIn = 1;                                   // the bars stay, even at high water
    const edgeR = (s) => riverHalf - (riverHalf - 6.5) * barIn * bump(14, 128, s, 26) - (riverHalf - 8.5) * barIn * bump(184, 268, s, 14) + 3 * Math.sin(s * 0.043 + 1.7);
    const edgeL = (s) => -(riverHalf + 3) + 3.5 * Math.sin(s * 0.037 + 0.4);
    // (p3) the route's own places: where it stands in plan as it passes z (the reach runs up +Z there), and where it goes through the skin
    const routeXZ = [], touches = [], sweep = [], route3 = [];
    { const v = new THREE.Vector3(); let py = 1, px = 0, pz = 0;
      for (let m = 40; m <= 180; m += 0.25) { route.posAtDist(m, v); if (m > 40 && (py < 0) !== (v.y < 0)) { const k = py / (py - v.y); touches.push({ x: px + (v.x - px) * k, z: pz + (v.z - pz) * k, m: m - 0.25 + 0.25 * k }); } routeXZ.push([v.z, v.x]); route3.push(v.x, v.y, v.z); if (v.y < 0 && v.y > -WELL_R) sweep.push([v.x, v.z, Math.sqrt(WELL_R * WELL_R - v.y * v.y)]); py = v.y; px = v.x; pz = v.z; } }
    const lineX = (z) => { let i = 1; while (i < routeXZ.length - 1 && routeXZ[i][0] < z) i++; const a = routeXZ[i - 1], b = routeXZ[i]; return a[1] + (b[1] - a[1]) * clamp((z - a[0]) / (b[0] - a[0]), 0, 1); };
    const touchNear = (x, z, d) => touches.some((q) => Math.hypot(q.x - x, q.z - z) < d);
    // (p3 hall) the least distance in space from a place to the flown line (its points every 0.25 m from 40 to 180 m of route): the hall's clear air is kept by it
    const lineD = (x, y, z) => { const n = route3.length / 3, d2 = (i) => { const dx = route3[i * 3] - x, dy = route3[i * 3 + 1] - y, dz = route3[i * 3 + 2] - z; return dx * dx + dy * dy + dz * dz; };
      let best = 1e9, bi = 0; for (let i = 0; i < n; i += 8) { const d = d2(i); if (d < best) { best = d; bi = i; } }   // every 2 m first, then every 0.25 m round the nearest
      for (let i = Math.max(0, bi - 8); i <= Math.min(n - 1, bi + 8); i++) { const d = d2(i); if (d < best) best = d; } return Math.sqrt(best); };
    // THE ROUND'S RADIUS, by progress alone: 0 outside the stretch (u 0.118 to 0.29); 1.2 m as the route comes down to the skin and
    // goes through it; under the skin it widens (to 2.4 m by 3 m of route after the touch), keeps that until WELL_HOLD metres after
    // the touch and draws in to a tenth over WELL_DRAW metres, so the round stays open overhead until 6.1 m of route after the touch (shut at 80.3 m), the last 2 m of its radius closing in 1.25 m of route
    // (p3 hall2: it was 1.5 m, a wipe); the mirror of that before the second touch, for the rise. Above the water: 1.2 m, as it was.
    const wellR = (u) => { if (!(u > HALL_U[0] && u < HALL_U[1])) return 0; const m = u * LR, dm = Math.min(m - touches[0].m, touches[1].m - m);
      return WELL_R * (1 + WELL_WIDE * sstep(0.5, 3, dm)) * (1 - 0.9 * bump(touches[0].m + WELL_HOLD, touches[1].m - WELL_HOLD, m, WELL_DRAW)); };
    // ... and where the round lies open on the skin while the route is under it (seen from beneath, a pad at its rim would show its underside as a shard)
    const wellNear = (x, z, d) => sweep.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + d);
    // THE TUB's plan (the hall under the skin, built below): from z 57.5 to z 157.5, 10 m either side of the route's line, or 1 m
    // inside the bar's water's edge (the shore as the banks cut it) where that is nearer; its bed 2.5 m down at z 72, 5.2 m down
    // from z 86 to z 126, then a ramp up to 0.3 m at z 154. inTub: is a place inside that plan (widened by m)?
    const TUB = { z0: 57.5, z1: 157.5, half: 10, shore: 1, lap: 0.05, inset: 0.6, bed: [[57.5, 0.05], [72, -2.5], [86, -5.2], [126, -5.2], [154, -0.3], [157.5, 0.05]] };
    const shoreR = (s) => edgeR(s) + 1.1 * Math.sin(s * 0.29 + 1) + 0.7 * Math.sin(s * 0.67 + 2) * Math.sin(s * 0.113);
    const tubA = (z) => lineX(z) - TUB.half, tubB = (z) => Math.min(lineX(z) + TUB.half, shoreR(z) - TUB.shore);
    const inTub = (x, z, m = 0) => z > TUB.z0 - m && z < TUB.z1 + m && x > tubA(z) - m && x < tubB(z) + m;
    const bedY = (z) => { const B = TUB.bed; let i = 1; while (i < B.length - 1 && B[i][0] < z) i++; return B[i - 1][1] + (B[i][1] - B[i - 1][1]) * clamp((z - B[i - 1][0]) / (B[i][0] - B[i - 1][0]), 0, 1); };

    // ---- the blank: the uncut wall of the vase, following the eye ---------------------------------
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), blankMaterial(glass));
    sky.renderOrder = -1; sky.frustumCulled = false; sky.name = 'blank'; scene.add(sky);
    const tp = (t, k) => new THREE.Vector3(Math.pow(t.x, k), Math.pow(t.y, k), Math.pow(t.z, k));
    const tmul = (a, b) => new THREE.Vector3(a.x * b.x, a.y * b.y, a.z * b.z);

    // ---- the water: honey glass in martele, with fish rings and the dimples of the emergence -----
    const waterMat = new THREE.ShaderMaterial({
      uniforms: { ...GU, uFlow: { value: new THREE.Vector2(0, -0.7) }, uEmerge: { value: new THREE.Vector4(30, 150, 1, 0) }, uPool: { value: new THREE.Vector4(0, 0, 14, 0) } },
      vertexShader: 'varying vec3 vWpos; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWpos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: /* glsl */`
        ${GLASS_GLSL} varying vec3 vWpos; uniform vec2 uFlow; uniform vec4 uEmerge, uPool;
${MARTELE_GLSL}        // one expanding ring per cell: x = pale line, y = the dished inside
        vec2 ringCell(vec2 p, float cell, float rmax, float rate, float fwp){
          vec2 q = p / cell; vec2 i = floor(q), f = fract(q) - 0.5;
          float h = gHash(i + 5.5), life = fract(uTime * rate * (0.6 + 0.8 * gHash(i + 2.2)) + h);
          vec2 c = (vec2(gHash(i + 9.1), gHash(i + 13.7)) - 0.5) * 0.45;
          float dd = length(f - c) * cell, rad = rmax * (0.15 + 0.85 * life);
          float w = max(0.035 * rmax, 0.9 * fwp);
          float line = (1. - smoothstep(w * 0.5, w, abs(dd - rad))) * (1. - life) * (1. - life);
          float dish = (1. - smoothstep(rad * 0.6, rad, dd)) * (1. - life);
          return vec2(line, dish) * step(0.35, h);
        }
        void main(){
          vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
          vec3 g = glassGround(d);
          vec2 p = vWpos.xz - uFlow * uTime;
          float fwp = max(fwidth(vWpos.x), fwidth(vWpos.z));
          float l = log2(clamp(dist / 1.6, 1., 40.)); float l0 = floor(l), lf = l - l0;
          float s0 = 0.12 * exp2(l0);
          vec2 q = p / s0; float fq = max(fwp / s0, 1e-4);
          // two sets of hammer marks laid over each other, so the rims never join into a net
          float mA = mix(martele(q), martele(q * 0.5 + 11.), smoothstep(0.2, 0.9, lf));
          float mB = mix(martele(q * 0.71 + 5.3), martele(q * 0.355 + 23.), smoothstep(0.2, 0.9, lf));
          float m = max(mA, mB * 0.85);
          m = mix(m, 0.5, smoothstep(0.12, 0.34, fq));
          vec3 pale = mix(g, max(g, uCitron), 0.55);
          vec3 col = g * (1.035 - 0.095 * m);
          // fish rings (large, few) fading where they would be finer than a few pixels
          vec2 rg = ringCell(vWpos.xz, 11., 2.6, 0.16, fwp) * (1. - smoothstep(0.25, 0.7, fwp));
          // the emergence: small dimples popping bank to bank across a stretch of river
          float em = smoothstep(uEmerge.x, uEmerge.x + 14., vWpos.z) * (1. - smoothstep(uEmerge.y - 30., uEmerge.y, vWpos.z)) * uEmerge.z;
          vec2 dm = ringCell(vWpos.xz + 3.3, 1.15, 0.34, 0.55, fwp) * em * (1. - smoothstep(0.05, 0.16, fwp));
          vec2 dm2 = ringCell(vWpos.xz * 1.0 + 41.7, 2.6, 0.62, 0.3, fwp) * (0.7 + 0.3 * em) * (1. - smoothstep(0.1, 0.3, fwp));
          col = mix(col, g * 0.86, clamp(rg.y * 0.5 + dm.y * 0.8 + dm2.y * 0.7, 0., 1.));
          col = mix(col, pale, clamp(rg.x + dm.x + dm2.x, 0., 1.) * 0.9);
          // far dimples are their flat average: a paler stretch of water
          col = mix(col, pale, em * 0.16 * smoothstep(0.05, 0.3, fwp));
          // (p3 hall) THE WATER'S ANSWER TO THE ROUND: two of its own dimple rings in honey (pale from beneath), spreading from the
          // bitten rim on the water's own clock, half a turn apart, and wandering as the rim wanders (the same noise)
          { float wn = uWell.w + (gNoise(vWpos.xz * 2.3) - 0.5) * 0.16, wb2 = wn * wn - uWell.y * uWell.y;
            float wd = length(vWpos.xz - uWell.xz) - sqrt(max(wb2, 0.)), ww = max(0.014, 1.3 * fwp);
            float l1 = fract(uTime * 0.27), l2 = fract(uTime * 0.27 + 0.5);
            float wring = (1. - smoothstep(ww * 0.5, ww, abs(wd - 0.04 - 0.5 * l1))) * (1. - l1) + (1. - smoothstep(ww * 0.5, ww, abs(wd - 0.04 - 0.5 * l2))) * (1. - l2);
            wring *= step(1e-4, uWell.w) * step(0., wb2) * (1. - smoothstep(0.25, 0.7, fwp));
            col = mix(col, uHoney, clamp(wring * 1.3, 0., 1.) * 0.92);
          }
          // (o7) the sun's path: under the low sun its light lies down the water toward the eye in level breaks, the
          // sun's own colour under the far bank and gold foil nearer, each break a lens with soft ends (never a sparkle)
          float we2 = degrees(asin(clamp(-d.y, 0., 1.)));
          vec2 nh2 = d.xz * inversesqrt(max(dot(d.xz, d.xz), 1e-6));
          float sdn = dot(nh2, uSun.xy), scr = nh2.x * uSun.y - nh2.y * uSun.x;
          float hwp = 0.05 + 0.0105 * we2;
          float rc = sqrt(we2) * 3.4, rfr = fract(rc), ri = floor(rc);
          float dn = gNoise(vec2(scr * 40. / (1. + 0.05 * we2) + ri * 3.7, ri * 5.7 + uTime * 0.12));
          float lens = smoothstep(0., 0.07, dn - 0.4 - abs(rfr - 0.45) * 0.85);      // each break a lens: thick at its heart, drawn out to points
          lens = mix(lens, 0.8, 1. - smoothstep(0.25, 1.1, we2));
          float senv = (1. - smoothstep(hwp * 0.45, hwp, abs(scr))) * step(0., sdn) * step(0.01, uSun.w) * (1. - smoothstep(13., 28., we2));
          vec3 sunC = mix(mix(uHoney, uRose, 0.12) * vec3(1.04, 0.86, 0.7), uFoil, smoothstep(1.2, 5., we2));
          col = mix(col, sunC, lens * senv * 0.85);
          // (o7) the pool of spent wings under the mayfly column: torn foil lying thick at its foot, thinning outward
          float pd = length(vWpos.xz - uPool.xy) / max(uPool.z, 1e-3), pool = (1. - smoothstep(0.25, 1., pd)) * uPool.w;
          float pn = gNoise(vWpos.xz * 7.) * 0.6 + gNoise(vWpos.xz * 17. + 7.) * 0.4, pthr = mix(0.9, 0.36, pool);
          float pfl = mix(smoothstep(pthr - 0.03 - fwp * 6., pthr + 0.03 + fwp * 6., pn), 1. - smoothstep(0.2, 0.8, pthr), smoothstep(0.012, 0.09, fwp));
          col = mix(col, mix(uHoney, uFoil, 0.6 + 0.4 * sin(uTime * 1.7 + pn * 40.)), pfl * step(0.01, pool) * 0.9);
          gl_FragColor = vec4(col, 1.);
        }`,
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.set(60, 0, 250); water.frustumCulled = false; water.name = 'water'; scene.add(water);
    waterMat.depthWrite = false; water.renderOrder = -0.5;   // drawn first and without depth: the images of the trees stand under it (the mirror, below)
    await ctx.yield();

    // ---- the ribbon of beaten gold: the band's foil laid along the honey water under it. One strip along
    //      the course (lateral -1..1, course s), torn flecks near the eye that give way to their flat
    //      average far off, so the band is a bright line drawn round the bend; it arrives with the turn.
    const ribbonMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { ...GU, uRib: { value: new THREE.Vector4(-1e4, 0, 0, 0) }, uHole: { value: new THREE.Vector4(0, 0, 7, 0) }, uHalf: { value: 1 } },
      vertexShader: 'attribute vec2 aRib; varying vec2 vRib; varying vec3 vWpos; void main(){ vRib = aRib; vec4 wp = modelMatrix * vec4(position, 1.); vWpos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: /* glsl */`
        ${GLASS_GLSL} varying vec2 vRib; varying vec3 vWpos; uniform vec4 uRib, uHole; uniform float uHalf;
        void main(){
          vec3 V = vWpos - cameraPosition; float dist = length(V);
          float lat = vRib.x * uHalf, al = abs(lat);
          // a bright core under the thick of the band, a thinner sheet to its edges that gathers into a line far off
          float farK = smoothstep(14., 110., dist);
          float prof = max(exp(-lat * lat / 2.2) * 0.9 * (0.68 + 0.32 * smoothstep(1.2, 7., dist)), mix(0.0, 0.86, farK) * (1. - smoothstep(0.45, 1., abs(vRib.x)) * mix(1., 0.75, farK)));
          prof *= 1. - smoothstep(uRib.x - 40., uRib.x, vRib.y);                          // the front of the band
          prof *= smoothstep(uHole.z * 0.55, uHole.z, length(vWpos.xz - uHole.xy) + (1. - uHole.w) * 1e4);
          vec2 q = vec2(lat, vRib.y - uRib.y);
          float fp = max(fwidth(vWpos.x), fwidth(vWpos.z));
          float n = gNoise(q * vec2(24., 11.)) * 0.6 + gNoise(q * vec2(55., 27.) + 7.) * 0.4;
          float thr = mix(0.86, 0.24, prof);
          float fleck = smoothstep(thr - 0.03 - fp * 6., thr + 0.03 + fp * 6., n);
          float avg = 1. - smoothstep(0.2, 0.8, thr);
          float a = mix(fleck, avg, smoothstep(0.01, 0.09, fp)) * smoothstep(0., 0.08, prof) * smoothstep(2.5, 11., dist);   // under the eye the water is clear: the foil lies ahead
          float turn = 0.5 + 0.5 * sin(uTime * 2.3 + gHash(floor(q * vec2(24., 11.))) * 6.28);
          vec3 col = mix(uHoney, uFoil, 0.72 + 0.28 * mix(turn, 0.6, smoothstep(0.01, 0.09, fp)));
          if (wellHid(vWpos) > 0.5) discard;   // (p3) from beneath the skin: only through the well
          gl_FragColor = vec4(col, a * 0.5);   // the band's reflection: quieter than the wings above it
        }`,
    });
    {
      const pos = [], rib = [], idx = []; let n = 0;
      for (let s = -140; s <= 1000; s += 4, n++) for (const sd of [-1, 1]) {
        const p = A.bandPoint(s, 0, sd * A.band.halfWidth); pos.push(p.x, 0.06, p.z); rib.push(sd, s);
      }
      for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 2)); g.setIndex(idx);
      ribbonMat.uniforms.uHalf.value = A.band.halfWidth;
      const ribbon = new THREE.Mesh(g, ribbonMat); ribbon.frustumCulled = false; ribbon.renderOrder = 2; ribbon.name = 'ribbon'; scene.add(ribbon);
    }
    await ctx.yield();

    // ---- the vase wall: the far tree line etched inside the belly, bowed ------------------------------
    {
      const cw = new Cutter(), N = 360, R = 730, bowP = rng.range(0, TAU);
      for (let i = 0; i <= N; i++) {
        const a = i / N * TAU, x = 60 + Math.cos(a) * R, z = 250 + Math.sin(a) * R;
        const bow = 0.5 + 0.5 * Math.sin(a * 2 + bowP), lumps = Math.sqrt(Math.abs(Math.sin(a * 37 + bowP))) * 9 + Math.sqrt(Math.abs(Math.sin(a * 91 + 1.3))) * 5 + 4 * Math.sin(a * 13);
        const h = 20 + 34 * bow * bow + lumps;
        cw.v(x, h, z, 0, 0, 1, 0, 9, 0); cw.v(x, -3, z, 0, 0, 1, 1.25, 9, 0);
        if (i < N) { const b = i * 2; cw.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      // a second, nearer and lower line with gaps (islands of trees on the plain), so the far distance has two skins
      const b0 = cw.count, R2 = 470;
      for (let i = 0; i <= N; i++) {
        const a = i / N * TAU, x = 60 + Math.cos(a) * R2, z = 250 + Math.sin(a) * R2;
        const gate = sstep(-0.15, 0.25, Math.sin(a * 5 + bowP * 2) + 0.5 * Math.sin(a * 11 + 2.));
        const h = (9 + Math.sqrt(Math.abs(Math.sin(a * 53 + bowP))) * 8 + Math.sqrt(Math.abs(Math.sin(a * 131))) * 4) * gate - 2.5;
        cw.v(x, h, z, 0, 0, 1, 0, 9, 0); cw.v(x, -3, z, 0, 0, 1, 1.1, 9, 0);
        if (i < N) { const b = b0 + i * 2; cw.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
      const wall = new THREE.Mesh(cw.finish(), aboveMaterial(glass, { skins: 1, wobble: 0.02, thinFirst: 0.8 }));
      wall.frustumCulled = false; wall.name = 'wall'; scene.add(wall);
    }
    await ctx.yield();

    // ---- the banks: low land cut back from the water's edge (the shoreline is a pale rim) ----------
    {
      const cl = new Cutter();
      for (const side of [-1, 1]) {
        const base = cl.count; let n = 0;
        for (let s = -260; s <= 1100; s += 2.5, n++) {
          const e = (side > 0 ? edgeR(s) : edgeL(s)) + 1.1 * Math.sin(s * 0.29 + side) + 0.7 * Math.sin(s * 0.67 + 2 * side) * Math.sin(s * 0.113);
          const [x0, z0] = atLat(s, e), [x1, z1] = atLat(s, e + side * (9 - (side > 0 ? 7.6 * bump(204, 264, s, 8) : 0))), [x2, z2] = atLat(s, e + side * Math.min(75, 165 - Math.abs(e)));
          cl.v(x0, 0.03, z0, 0, 1, 0, 0, 9, 0); cl.v(x1, 0.3, z1, 0, 1, 0, side > 0 ? 0.8 + 0.25 * bump(204, 264, s, 8) : 0.8, 9, 0); cl.v(x2, 0.45, z2, 0, 1, 0, 1, 9, 0);
        }
        for (let i = 0; i < n - 1; i++) { const a = base + i * 3; cl.idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
      }
      const land = new THREE.Mesh(cl.finish(), overlayMaterial(glass, { skins: 2, wobble: 0.5, biteScale: 0.7, tints: [tp(T.olive, 0.85), tmul(T.olive, tp(T.amber, 0.5)), tp(T.amber, 0.9)], fragPost: WELL_OVER }));   // (p3)
      land.frustumCulled = false; land.name = 'land'; scene.add(land);
    }
    // ---- the gallery: the willow wood behind the bank trees, one lofted wall each side ----------------
    const galleryH = (s, side) => 9 + 6 * Math.sqrt(Math.abs(Math.sin(s * 0.052 + side * 1.3))) + 2.4 * Math.sqrt(Math.abs(Math.sin(s * 0.131 + side * 2.9))) + 1.6 * Math.sin(s * 0.023 + side);
    {
      const cg = new Cutter();
      for (const side of [-1, 1]) {
        const base = cg.count; let n = 0;
        for (let s = -260; s <= 1100; s += 3, n++) {
          const lat = side * (riverHalf + 24 + 4 * Math.sin(s * 0.021 + side));
          const [x, z] = atLat(s, side > 0 ? Math.min(lat, 150) : lat), h = galleryH(s, side) * (0.22 + 0.78 * sstep(-0.35, 0.3, Math.sin(s * 0.052 + side * 0.8)));
          cg.v(x, h, z, 0, 0, 1, 0, 9, 0); cg.v(x, -0.5, z, 0, 0, 1, 1.05, 9, 0);
        }
        for (let i = 0; i < n - 1; i++) { const a = base + i * 2; cg.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const gal = new THREE.Mesh(cg.finish(), aboveMaterial(glass, { skins: 2, wobble: 0.2 }));
      gal.frustumCulled = false; gal.name = 'gallery'; scene.add(gal);
    }
    { // the sedge bank behind the sandbar: a low dark wall, so the storks read as pale medallions cut through it
      const cs = new Cutter(); let n = 0;
      for (let s = 200; s <= 264; s += 0.8, n++) {
        const [x, z] = atLat(s, edgeR(s) + 4.0 + Math.sin(s * 0.4) * 0.5), h = (1.5 + 1.3 * Math.abs(Math.sin(s * 0.53)) * Math.abs(Math.sin(s * 0.19 + 1.)) + 0.5 * Math.sin(s * 1.7) + 0.4 * Math.sin(s * 3.1)) * bump(200, 264, s, 9);
        cs.v(x, h, z, 0, 0, 1, 0, 9, 0); cs.v(x, h * 0.5, z, 0, 0, 1, 0.8, 9, 0); cs.v(x, 0.1, z, 0, 0, 1, 1.1, 9, 0);
        if (n > 0) { const a = (n - 1) * 3; cs.idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
      }
      const sedge = new THREE.Mesh(cs.finish(), aboveMaterial(glass, { skins: 3, biteScale: 0.8, wobble: 1.2, fragMod: 'r = min(r * 5., 0.95);', tints: [tp(T.olive, 0.9), tmul(T.olive, tp(T.amber, 0.7)), tmul(T.amber, tp(T.aubergine, 0.5))] }));   // one rim, then the dark: no contour bands along the sedge tops
      sedge.frustumCulled = false; sedge.name = 'sedge'; scene.add(sedge);
    }
    await ctx.yield();

    // ---- the clay bluff to port (s 20..220), its strata wheel-cut, pierced by martin holes ------------
    const bluffTop = (s) => (13.2 + 1.6 * Math.sin(s * 0.06) + 0.9 * Math.sin(s * 0.19 + 2)) * bump(16, 226, s, 22);
    const bluffFace = (s, f) => { // f 0 = foot at the water's edge .. 1 = the top (set back 3.4 m)
      const [x, z, c] = atLat(s, edgeL(s) + 1.5 - f * 3.4 - 0.8 * Math.sin(f * 6 + s * 0.3));
      return [x, bluffTop(s) * f - 0.3 * (1 - f), z, c];
    };
    {
      const cb = new Cutter(), rows = [1, 0.8, 0.52, 0]; let n = 0;
      for (let s = 14; s <= 228; s += 2.5, n++) for (const f of rows) {
        const [x, y, z] = bluffFace(s, f);
        cb.v(x, y, z, 1, 0, 0, f >= 1 ? 0 : f > 0.7 ? 0.5 : 1.02, y, 0);
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < 3; k++) { const a = i * 4 + k; cb.idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
      const bluff = new THREE.Mesh(cb.finish(), aboveMaterial(glass, {
        skins: 3, biteScale: 0.6, veins: 0.42, veinHalf: 0.035, wobble: 0.35,
        // (round 3) the clay lies in beds: the face is cut in alternating terraces that wander along it, never one dark slab
        fragMod: 'float bst = wy * 0.3 + 0.9 * gNoise(vec2(dot(vWpos.xz, vec2(0.05, 0.11)), wy * 0.22)); float btri = abs(fract(bst) - 0.5) * 2.; r = mix(r, 0.52 + 0.4 * smoothstep(0.38, 0.62, btri), smoothstep(0.8, 1.0, r));',
        tints: [tp(T.amber, 0.42), tp(T.amber, 0.82), tmul(T.amber, tp(T.aubergine, 0.3))] }));
      bluff.frustumCulled = false; bluff.name = 'bluff'; scene.add(bluff);
      // martin holes: pale medallions cut right through the overlay to the ground
      const ch = new Cutter(), hr = rng.fork('holes'), NH = 200;
      for (let i = 0; i < NH; i++) {
        const cluster = 30 + (i % 9) * 21 + hr.range(-4, 4), s = clamp(cluster + hr.gauss() * 5, 26, 216), f = clamp(0.78 + hr.gauss() * 0.07 - (i % 3) * 0.06, 0.5, 0.93);
        const [x, y, z, c] = bluffFace(s, f), rad = hr.range(0.3, 0.52), ox = c.tz * 0.35, oz = -c.tx * 0.35, b = ch.count;
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) ch.v(x + ox + c.tx * u * rad * 1.25, y + v * rad * 0.8, z + oz + c.tz * u * rad * 1.25, 1, 0, 0, u, v, 0);
        ch.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
      const holes = new THREE.Mesh(ch.finish(), aboveMaterial(glass, {
        skins: 1, tints: [new THREE.Vector3(1.04, 1.04, 1.02), T.amber, T.amber], wobble: 0.01,
        fragMod: 'float md = 1. - dot(vCut.xy, vCut.xy); if (md < 0.) discard; r = 0.02 + md * 0.4; wy = 9.;',
        fragPost: 'col = mix(g * uT2, mix(g, max(g, uCitron), 0.8), smoothstep(0.0, 0.35, md));' }));
      holes.frustumCulled = false; holes.name = 'holes'; scene.add(holes);
    }
    await ctx.yield();

    // ---- trees: white willows (lofted crowns, leaning trunks, trailing fronds) and black poplars ------
    const ct = new Cutter(), cf = new Cutter().withExtra(4), tr = rng.fork('trees');
    let frondBudget = Math.round(9000 * detail);
    // THE MIRROR: the lakeside vases show every tree twice, standing and in the water. The trees near our course
    // are drawn a second time turned over under the water plane (same geometry, a thinner skin, broken by the
    // hammered water); gallery, bluff and poplars leave plain images cut by the mirror material.
    const cm = new Cutter();
    const mirIdx = [];                                  // index ranges of the trees whose image stands in the water
    const mirrorTree = (cx, cz, H, R, hem, sd) => {      // a far tree's image: one dome turned over
      const b = cm.count; cm.crown(cx, H, cz, R, hem, sd, 8, 3, null, 0.24);
      for (let i = b; i < cm.count; i++) cm.pos[i * 3 + 1] *= -1;
    };
    // one trailing frond: a ribbon of 5 segments; cut = (across -1..1, along in leaf cells, 0); the lance
    // leaves and the stem are cut out of it in the fragment shader (fragMod below)
    function frond(x, y, z, ox, oz, len, half, reach, skip = false) {
      if (frondBudget-- <= 0) return;
      const wx = -oz, wz = ox, ph = tr.range(0, TAU), nseg = 4, b = cf.count;
      if (skip) return;
      for (let j = 0; j <= nseg; j++) {
        const f = j / nseg, out = reach * (1 - (1 - f) * (1 - f)), dn = len * Math.pow(f, 1.25), hw = half * (1 - 0.55 * f * f);
        const px = x + ox * out, py = y - dn, pz = z + oz * out;
        cf.cur[0] = f; cf.cur[1] = ph; cf.cur[2] = len; cf.cur[3] = -hw;
        cf.v(px - wx * hw, py, pz - wz * hw, ox, 0, oz, -1, dn / 0.36, 0);
        cf.cur[3] = hw;
        cf.v(px + wx * hw, py, pz + wz * hw, ox, 0, oz, 1, dn / 0.36, 0);
        if (j < nseg) { const a = b + j * 2; cf.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    }
    // a willow: base (x,z), lean (unit lx,lz) toward the water, height H, crown radius R, nf fronds hanging
    // to about y = tipY on the side given by faceW (0 = all round .. 1 = only toward the lean)
    // the hem of a crown is lifted where it hangs over our course, so leaf stays above the eye
    const hemLift = (x, z) => { const pc = path.nearestXZ(x, z); return pc.dist > 13 ? -99 : (pc.y + 2.7 + 3.4 * sstep(0.895, 0.93, pc.u) + 4.5 * bump(0.6, 0.9, pc.u, 0.06) - pc.dist * 0.1) - 30 * sstep(8, 13, pc.dist); };
    function willow(x, z, lx, lz, H, R, nf, tipY, faceW = 0.6, lobes = 2, guard = true, weep = 1, seg = 10, thin = 0) {
      const sd = tr.range(0, 10), L = R * 0.55, cx = x + lx * L, cz = z + lz * L, la = Math.atan2(lz, lx);
      const hem = Math.max(tipY + 1.0, (H - 1.3 * R) * (1 - weep) + Math.max(tipY + 1.5, 2.3) * weep), span = H - hem;
      // the trunk: one leaning curve with a slow S in it, so it never shows an elbow
      const tpt = [], trd = [], bend = tr.range(-0.5, 0.5), r0 = R * 0.075 + 0.2;
      const mi0 = ct.idx.length;
      const trunkAt = (f) => { const g = Math.pow(f, 1.6), w = Math.sin(f * Math.PI) * bend; return [x + lx * L * g - lz * w, -0.6 + (H * 0.84 + 0.6) * f, z + lz * L * g + lx * w]; };
      for (let i = 0; i <= 6; i++) { const f = i / 6; tpt.push(trunkAt(f)); trd.push(r0 * (1 - 0.8 * Math.pow(f, 0.8)) + 0.05); }
      ct.tube(tpt, trd, seg > 12 ? 7 : 6, 0.5 + sd, 0.31);
      const ha = guard ? hemLift : null, big = seg > 12, low = seg < 10;
      // the mass: a leaning middle lobe whose foot is held high, and lobes of unequal height and width round it,
      // each on its own bough; the foot of a lobe is lifted on the river side, so trunk and boughs show under the leaf
      ct.crown(cx, H, cz, R * 0.78, hem + span * 0.24 * weep, sd, big ? 16 : low ? 8 : 10, big ? 8 : low ? 5 : 6, ha, 0.26, lx * R * 0.3, lz * R * 0.3);
      const nL = lobes + 2, fork = trunkAt(0.42);
      for (let k = 0; k < nL; k++) {
        const a = sd * 3 + k * TAU / nL + tr.range(-0.5, 0.5), r2 = R * tr.range(0.4, 0.64), off = R * tr.range(0.5, 0.78), ox = Math.cos(a) * off, oz = Math.sin(a) * off;
        const river = Math.max(0, Math.cos(a - la)), top = H - span * tr.range(0.08, 0.42);
        const hemL = Math.max(tipY + 0.6, hem - 0.8 + span * tr.range(0, 0.36) * (0.35 + 0.65 * river) * weep);
        ct.tube([fork, [cx + ox * 0.45, fork[1] + (top - fork[1]) * 0.5, cz + oz * 0.45], [cx + ox, top - (top - hemL) * 0.25, cz + oz]], [R * 0.045 + 0.1, R * 0.03 + 0.07, 0.05], 5, 0.5 + sd + k, 0.31);
        ct.crown(cx + ox, top, cz + oz, r2, hemL, sd + k * 1.7 + 1, big ? 12 : low ? 6 : 8, big ? 6 : low ? 4 : 5, ha, 0.3, Math.cos(a) * r2 * 0.3 + lx * 0.4, Math.sin(a) * r2 * 0.3 + lz * 0.4);
      }
      if (pathClear(x, z) < 27) mirIdx.push(mi0, ct.idx.length); else mirrorTree(cx, cz, H, R * 1.15, Math.min(hem, 2.5), sd);
      for (let i = 0; i < nf; i++) {
        const a = la + (tr() * 2 - 1) * Math.PI * (1 - 0.72 * faceW), inner = tr() < 0.25, rr = R * (inner ? Math.sqrt(tr.range(0.05, 0.6)) : 1.1 - 0.42 * tr() * tr());
        const fx = cx + Math.cos(a) * rr, fz = cz + Math.sin(a) * rr;
        const pc = path.nearestXZ(fx, fz), near = guard && pc.dist < 12;
        const hy = near ? Math.max(hem, hemLift(fx, fz)) : hem, fy = hy + tr.range(0.3, 0.2 + 0.4 * span) * (inner ? 1.4 : 1);
        const tip = near ? Math.max(tipY, pc.y + 1.9 + 3.6 * sstep(0.895, 0.93, pc.u) - pc.dist * (0.12 + 0.3 * sstep(0.895, 0.93, pc.u))) : tipY;
        const len = Math.max(1.5, (fy - tip) * (1 - 0.55 * tr() * tr()));
        frond(fx, fy, fz, Math.cos(a), Math.sin(a), len, tr.range(0.26, 0.4), inner ? tr.range(0.2, 0.8) : tr.range(0.2, 2.6) * tr(), (thin > 0 && i % thin === 0) || (thin < 0 && pc.dist < -thin));
      }
    }
    function poplar(x, y0, z, H) { // tall and narrow, four times taller than wide: a spindle of leaf on a bare trunk
      const sd = tr.range(0, 10), w = H * tr.range(0.085, 0.11);
      ct.tube([[x, y0 - 1, z], [x + 0.2, y0 + H * 0.12, z], [x + 0.1, y0 + H * 0.26, z + 0.15], [x, y0 + H * 0.45, z + 0.2]], [0.46, 0.38, 0.3, 0.14], 6, 0.5 + sd, 0.31);
      ct.mass(x, y0 + H * 0.6, z, w, H * 0.42, w, sd, 8, 7);
      { const b = cm.count; cm.mass(x, y0 + H * 0.6, z, w, H * 0.42, w, sd, 6, 4); for (let i = b; i < cm.count; i++) cm.pos[i * 3 + 1] *= -1; }
      ct.mass(x + w * 0.75, y0 + H * 0.43, z - w * 0.4, w * 0.66, H * 0.25, w * 0.66, sd + 2, 7, 6);
    }

    // -- placement --
    {
      // the two entry willows: one on a snag in the stream to port, one on the hogweed bar to starboard;
      // their fronds hang across the top corners of the first frame
      willow(-17, 35, 1, 0.2, 15.5, 5.2, Math.round(200 * detail), 2.6, 0.2, 3, true, 0.6, 14, 2);   // (o5) seen whole: no dark mass cut by the top edge
      await ctx.yield();
      willow(25, 50, -1, -0.05, 13.5, 6, Math.round(180 * detail), 2.6, 0.2, 3, true, 0.6, 14);
      await ctx.yield();
      willow(-30, 100, 0.9, 0.3, 14, 6, Math.round(120 * detail), 2.0, 0.3, 2);
      await ctx.yield();
      // bank willows, both sides, the whole visible course
      let k = 0;
      for (const side of [-1, 1]) for (let s = -74; s <= 600; s += 11) {
        const ss = s + tr.range(-3, 3), e = side > 0 ? edgeR(ss) : edgeL(ss);
        const onBluff = side < 0 && ss > 10 && ss < 232;
        let lat = e + side * tr.range(3, 10); if (side > 0) lat = Math.max(lat, Math.min(riverHalf - 6, 31) + tr.range(0, 6));
        const H = tr.range(12, 18), R = tr.range(4.6, 6.6), nf = Math.round(16 * detail * density);
        if (onBluff || (ss > 266 && ss < 452)) continue;
        const [x, z, c] = atLat(ss, lat);
        if (pathClear(x, z) < 15) continue;
        willow(x, z, -side * c.tz, side * c.tx, H, R + 1, nf, tr.range(0.3, 2.2), 0.75, ss > 140 && ss < 455 ? 0 : 1, true, 1, 8);   // fewer lobes where the wall rows stand in front
        if (++k % 2 === 0) await ctx.yield();
      }
      // black poplars tall on the bluff
      for (let i = 0; i < 20; i++) {
        const s = 28 + i * 9.9 + tr.range(-2.5, 2.5), [x, y, z, c] = bluffFace(s, 1);
        poplar(x - c.tz * tr.range(4, 9), y - 0.5, z + c.tx * tr.range(4, 9), tr.range(17, 25));
      }
      await ctx.yield();
      // the exit: the curtain willow leaning over the path where it leaves the bend, then the flooded
      // channel, port row whole, starboard row only near the portal so the round cut shows from the bend
      const px = ex.tz, pz = -ex.tx, chan = (t, l) => [ex.x + ex.tx * t + px * l, ex.z + ex.tz * t + pz * l];
      { const [x, z] = chan(15, -10.5); willow(x, z, px, pz, 16.5, 7.6, Math.round(64 * detail), 1.2, 0.2, 3, false, 0, 14); }
      // THE LANDSCAPE VASE: from the dance to the exit, willows stand in the water on both hands. A near
      // row leans over our course (their hanging leaf is cropped by the top corners of the frame), a
      // second row behind makes the dark walls; the gold band threads between the trunks. The sight
      // line from the bend to the portal is left open, so the round cut shows in the outer wall.
      const sightClear = (x, z, R, tx = x, tz = z) => {
        const low = pathClear(x, z) > R + 4;            // a crown over our course is lifted and does not hide a far, low thing
        for (let sv = 343; sv <= 458; sv += 9) {
          const p = A.bandPoint(sv, 0.1), dx = seat.x - p.x, dz = seat.z - p.z, dd = dx * dx + dz * dz;
          const t = clamp(((x - p.x) * dx + (z - p.z) * dz) / dd, 0, 1), t2 = clamp(((tx - p.x) * dx + (tz - p.z) * dz) / dd, 0, 1);
          if (low && Math.hypot(x - p.x - dx * t, z - p.z - dz * t) < R * 1.4 + 2) return false;
          if (Math.hypot(tx - p.x - dx * t2, tz - p.z - dz * t2) < 2.6) return false;
        }
        return true;
      };
      let kn = 0;
      for (let s = 112; s <= 452; s += flooded ? 14 : 15.5, kn++) {
        const side = kn % 2 ? 1 : -1, ss = s + tr.range(-3, 3), onBar = side > 0 && ss > 160 && ss < 262;
        const setBack = (onBar && ss > 205) || (side < 0 && ss >= 218 && ss < 250);   // (o7) and the port willow opposite them stands back with the grove behind it: while the gaze is on the storks no crown hangs trunkless over the lens
        const R = onBar ? tr.range(5.4, 6.2) : tr.range(7.2, 9), [x, z, c] = atLat(ss + (setBack && onBar ? 14 : 0), side * ((onBar ? tr.range(19, 23) : ss < 250 ? tr.range(13.5, 17) : tr.range(12.5, 16)) + (setBack ? (onBar ? 7 : 11) : 0)));
        const H = Math.min(tr.range(16, 21), setBack ? 15.5 : 99), tip = tr.range(0.3, 0.9) + 3.6;
        const high = side > 0 && ss > 372;
        if (ss > 248 && ss < 428) continue;             // (o5) from the gate of umbels to the lone willow no near row hangs over the lens: the groves stand to the sides as wings
        if (!high && !sightClear(x - side * c.tz * R * 0.55, z + side * c.tx * R * 0.55, R, x, z)) continue;
        if (pathClear(x, z) < 10 || (side < 0 && ss < 218)) continue;   // the course crosses the river now: no trunk stands in it, and the water under the bluff is open
        willow(x, z, -side * c.tz, side * c.tx, high ? H + 2 : H, R, Math.round(58 * detail), high ? 7.5 : tip, 0.3, 2, true, high ? 0.3 : 1, 14);
        await ctx.yield();
      }
      for (const side of [-1, 1]) for (let s = 124; s <= 470; s += 14) {
        const ss = s + tr.range(-3, 3) + (side > 0 ? 7 : 0), R = tr.range(5.4, 6.8), [x, z, c] = atLat(ss, side * tr.range(21, 29));
        const H = tr.range(12.5, 17), tip = tr.range(0.3, 1.2) + 2.2;
        if (!sightClear(x, z, R) || (ss > 250 && Math.sin(ss * 0.07 + 0.6 + side) > 0.25) || pathClear(x, z) < 10 || (side < 0 && ss < 218)) continue;
        willow(x, z, -side * c.tz, side * c.tx, H, R, Math.round(28 * detail), tip, 0.5, 1, true, 1, 10);
        if (++kn % 2 === 0) await ctx.yield();
      }
      await ctx.yield();
      // (o5) ONE willow arches over the course at s 396, standing on its own islet on the inner side and seen whole as we come down to it
      { const [x, z, c] = atLat(396, 16); willow(x, z, -c.tz, c.tx, 18, 8.0, Math.round(120 * detail), 4.4, 0.3, 2, true, 0.8, 16, -11); }   // (o7) it stands beside the course now, whole as we come to it, and lets no strand down over the lens (thin < 0: none within that many metres of the path)
      await ctx.yield();
      let i = 0;
      for (const [t, l] of [[24, -10.5], [37, -10.2], [50, -13.5], [64, -17], [77, -15.5], [90, -11.5], [104, -8], [73, 25], [86, 20], [97, 12.5], [106, 7.5], [118, -3], [120, 5]]) {
        const [x, z] = chan(t + tr.range(-1.5, 1.5), l), sg = l < 0 ? 1 : -1;
        willow(x, z, px * sg, pz * sg, tr.range(13.5, 17), tr.range(5.2, 6.4), Math.round(90 * detail), 0.5, 0.35, 2, true, 0.8, 14);
        if (++i % 2 === 0) await ctx.yield();
      }
      // high water: willows standing in the river, the band threading between their trunks
      if (flooded) for (let j = 0; j < 38; j++) {
        const s = -70 + j * 15 + tr.range(-5, 5), side = j % 2 ? 1 : -1, lat = side * (j % 5 === 0 ? tr.range(16, 22) : tr.range(30, 72));
        const [x, z, c] = atLat(s, lat);
        if (pathClear(x, z) < 11 || (side < 0 && s > 10 && s < 232 && lat < -70)) continue;
        willow(x, z, -side * c.tz, side * c.tx, tr.range(11, 16), tr.range(4.4, 6), Math.round(16 * detail), 0.3, 0.3, 0, true, 0.8, 8);
        if (j % 6 === 0) await ctx.yield();
      }
    }
    await ctx.yield();
    const SWAY = 'float sw = max(SY - 3., 0.) * 0.012; vec2 swv = vec2(sin(uTime * 0.4 + p.z * 0.05 + p.x * 0.03) * 2.2, cos(uTime * 0.33 + p.x * 0.06) * 1.6) * sw;';
    // Trees are cut the way the landscape vases cut them: ONE pale rim along every bitten edge, then the dark
    // overlay (never contour bands). A crown's upper part is a solid mass of leaf with a wandering foot; below
    // it the skirt is cut into strands of lance leaves of clearly unequal length, gathered in clumps with
    // gaps of sky between (leaves with engraved midribs near, bars at mid distance, the clump's outline far).
    // A trunk is one dark overlay with its rim and a few engraved bark lines.
    const treeOpts = {
      skins: 3, wobble: 0.3, biteScale: 1.2, veinHalf: 0.05, vertexMove: SWAY.replace('SY', 'p.y') + ' p.xz += swv;',
      // three planes of glass: the far rows one thin olive skin, the next amber-brown, only the nearest aubergine
      tints: [tp(T.olive, 0.85), tmul(T.amber, tp(T.aubergine, 0.12)), T.aubergine],
      // (written without branches: every derivative is taken at the top level, one discard at the end)
      fragMod: /* glsl */`
        float kind = vCut.z;                               // 1 trunk or bough, 2 crown lobe, 3 closed mass
        float isLeafy = step(1.5, kind), isLobe = isLeafy * (1. - step(2.5, kind));
        float innerF = gl_FrontFacing ? 1. : 0.;           // the far side of a lobe, seen from inside or below (lobes are wound inward)
        float frr = fwidth(rr) + 1e-4;
        // one rim: 2 px wide far off, a hand wide at arm's length, whatever the unit of the edge coordinate
        float rimPx = max(2., 0.075 * uViewH / (max(dist, 0.3) * 1.2));
        float ca = vCut.y, ch = vCut.x, fa = fwidth(ca) + 1e-4, fch = fwidth(ch) + 1e-4, fyw = fwidth(vWpos.y) + 1e-4;
        // the outline is bitten along itself: by height down a lobe's side, by arc along its top (the other way
        // the surface is seen edge-on and any pattern would be finer than a pixel)
        float topW = smoothstep(0.35, 0.75, abs(n.y));
        float snS = gNoise(vec2(ca * 0.2 + 3., vWpos.y * 1.3)) * 0.58 + gNoise(vec2(ca * 0.3, vWpos.y * 4.3 + 5.)) * 0.42 * (1. - smoothstep(0.1, 0.3, fyw * 4.3));
        float snT = gNoise(vec2(ca * 1.3, vWpos.y * 0.2 + 7.)) * 0.58 + gNoise(vec2(ca * 4.3 + 2., vWpos.y * 0.3)) * 0.42 * (1. - smoothstep(0.1, 0.3, fa * 4.3));
        float eS = (rr - (0.1 + 0.36 * mix(snS, snT, topW))) / (frr * 2.);
        float cn = gNoise(vec2(ca * 0.55, vWpos.y * 0.1 + 3.)) * 0.65 + gNoise(vec2(ca * 1.3 + 5., vWpos.y * 0.22)) * 0.35 * (1. - smoothstep(60., 150., dist));
        float rBody = 0.42 + 0.52 * mix(cn, 0.6, smoothstep(0.12, 0.4, fa));   // foreshortened toward the outline: the flat tone
        // the foot of the solid mass wanders between a quarter and two thirds of the lobe's height
        float hs = 0.24 + 0.3 * gNoise(vec2(ca * 0.23, 8.3)) + 0.12 * gNoise(vec2(ca * 0.9, 2.9));
        float eH = (ch - hs) / (fch * rimPx);
        // the strands of the skirt
        float wS = 0.5, sq = ca / wS + 0.35 * gNoise(vec2(ca * 0.7, 1.7)), ci = floor(sq), fx = (fract(sq) - 0.5) * 2.3;
        float h1 = gHash(vec2(ci, 3.7)), h2 = gHash(vec2(ci, 9.1));
        float clump = smoothstep(0.34, 0.6, gNoise(vec2(ca * 0.31, 4.4)) * 0.72 + 0.28 * gNoise(vec2(ca * 1.07, 7.7)));
        float lenS = (clump * mix(0.14, 0.8, h1 * h1) + step(0.86, h2) * step(0.1, clump) * 0.5);   // long outliers
        // beyond a few trees' distance the strands close up into broad hanging festoons with a wandering foot
        // (a flat mass of leaf, never a cap with a level brim and never a row of slits)
        float dK = smoothstep(12., 28., dist);
        float farK = max(smoothstep(0.13, 0.22, fa / wS), dK), farK2 = max(smoothstep(0.3, 0.5, fa / wS), dK);
        float fest = clump * (0.5 + 0.5 * gNoise(vec2(ca * 0.17, 6.1)));
        float tip = hs * (1. - min(mix(lenS, fest, farK2), 1.));
        float fl = vWpos.y / 0.42 + h1 * 7., ffl = fwidth(fl) + 1e-4;
        float leafK = (1. - smoothstep(0.1, 0.28, ffl)) * (1. - dK);
        float kk = fract(fl - abs(fx) * 1.15 + (fx >= 0. ? 0. : 0.5));
        float hw = 0.36 * pow(max(sin(3.14159 * kk), 1e-4), 0.7) * smoothstep(0., 0.06, ch - tip) + 1e-3;
        float lc = abs(fx) - 0.46;
        float r1 = 1. - abs(lc) / hw, rs = 1. - abs(fx) / 0.09;
        // strands too thin to draw either close up with their neighbours or drop out (never a row of slits)
        float bar = 1. - abs(fx) / max(mix(0.36 + 0.26 * h2, mix(step(fract(h2 * 7.3), 0.58) * 1.3, 1.3, farK2), farK), 1e-3);
        float rl = mix(bar, max(r1, rs), leafK);
        float frl = fwidth(rl) * rimPx;
        float eT = min(rl / max(frl, 1e-4), (ch - tip) / (fch * rimPx));
        eT += 9. * smoothstep(0.14, 0.34, frl) * step(0., eT);   // a strand a few pixels wide has no room for a rim
        eT = mix(eT, -1., innerF);                               // the far side keeps only its solid mass
        // a midrib tapers out before the leaf ends; only on leaves a hand wide on screen
        float midK = leafK * step(rs, r1) * step(eH, 0.) * step(0., eT) * step(0.5, sin(3.14159 * kk)) * (1. - smoothstep(0.03, 0.06, ffl)) * isLobe;
        float eLeaf = mix(9., max(eH, eT), isLobe);
        // the rim belongs to the hanging leaf; along a lobe's side it is a thinner thread, so lobes that overlap
        // never draw heavy contour lines inside the mass
        float rimA = mix(1., mix(1., 0.3 - 0.15 * smoothstep(18., 50., dist), step(eS, eLeaf)), isLeafy);
        // trunks and boughs: the rim, the dark, and two wandering wheel-cut bark lines broken along the length
        float eTr = rr / (frr * rimPx) + 9. * smoothstep(0.16, 0.4, frr * rimPx);
        float bk = gNoise(vec2(vWpos.y * 0.45, vCut.y * 3.1));
        float wyTr = mix(9., rr - (0.3 + 0.5 * bk), step(0.42, gNoise(vec2(vWpos.y * 0.8 + 5., vCut.y))) * step(0.2, rr));
        float E = mix(eTr, min(eLeaf, eS), isLeafy);       // E: 0 at a bitten edge, 1 one rim's width inside
        if (isLeafy > 0.5 && E < 0.) discard;
        E = mix(E, 9., isLeafy * innerF);                  // no rim inside a mass
        r = mix(0.84, mix(rBody, mix(0.92, rBody, smoothstep(-3., 0., eH)), isLobe * (1. - innerF)), isLeafy);
        wy = mix(wyTr, mix(9., lc, midK), isLeafy);
        r += max(gNoise(vWpos.xy * uWob + vWpos.z * uWob * 0.61) - 0.78, 0.) * 1.6 * isLeafy;   // no undercut bays inside a mass of leaf
        float fE = 1. / rimPx;                             // E is in rim widths, so one pixel is 1 / rimPx of it (no derivative: E jumps between strands)`,
      fragPost: 'col = mix(mix(col, mix(g, max(g, uCitron), 0.5), rimA), col, aaStep(1., E, fE));' };
    await ctx.yield();
    const treeGeo = ct.finish({ smooth: true });
    await ctx.yield();
    const trees = new THREE.Mesh(treeGeo, aboveMaterial(glass, treeOpts));   // (p3) from beneath, only through the well (and so the exit's frame, which wears the same material)
    {
      const mg = new THREE.BufferGeometry(), src = treeGeo.index.array, sub = [];
      for (const nm of ['position', 'normal', 'cut']) mg.setAttribute(nm, treeGeo.getAttribute(nm));
      for (let k = 0; k < mirIdx.length; k += 2) for (let i = mirIdx[k]; i < mirIdx[k + 1]; i++) sub.push(src[i]);
      mg.setIndex(sub);
      const image = new THREE.Mesh(mg, overlayMaterial(glass, { ...treeOpts,
        vertexMove: treeOpts.vertexMove + ' float mdp = max(p.y, 0.), mwv = min(mdp * 0.2, 1.); p.x += sin(mdp * 1.3 + uTime * 0.9 + p.z * 0.11) * 0.32 * mwv; p.z += cos(mdp * 1.1 + uTime * 0.7 + p.x * 0.13) * 0.26 * mwv;',
        fragPost: treeOpts.fragPost + /* glsl */`
          float dep = max(-vWpos.y, 0.), mfy = fwidth(dep) * 1.25, mlat = dot(vWpos.xz, vec2(0.21, 0.13));
          float rip = gNoise(vec2(mlat, dep * 1.25 - uTime * 0.22)) * 0.62 + gNoise(vec2(mlat * 2.7 + 4., dep * 3.1 + uTime * 0.35)) * 0.38 * (1. - smoothstep(0.1, 0.3, mfy * 2.5));
          float mthr = mix(0.06, 0.46, smoothstep(0., 24., dep)), mfine = smoothstep(0.14, 0.42, mfy);
          float me = mix(rip - mthr, 0.5, mfine);
          if (me < 0.) discard;
          col = mix(g, col, mix(0.92, 0.62, smoothstep(0., 22., dep)) * (1. - mfine * mthr * 0.7));   // an image is a thinner skin than its tree
          col = mix(mix(g, max(g, uCitron), 0.25), col, smoothstep(0., 0.03 + fwidth(rip) * 1.5, me));
          ${WELL_IMAGE}` }));
      await ctx.yield();
      image.scale.y = -1; image.name = 'image'; image.frustumCulled = false; image.renderOrder = -0.4; scene.add(image);
    }
    trees.name = 'trees'; trees.frustumCulled = false; scene.add(trees);
    await ctx.yield();
    const frondMat = aboveMaterial(glass, {
      skins: 3, wobble: 0.9, veinHalf: 0.045, biteScale: 1.2, tints: [tp(T.olive, 0.85), tmul(T.amber, tp(T.aubergine, 0.12)), T.aubergine],
      fragPost: 'vec3 pt = mix(mix(uT1, uT2, 1. - smoothstep(86., 103., dist * 1.2)), uT3, 1. - smoothstep(28., 37., dist * 1.2)); col = mix(col, g * pt, smoothstep(0.03, 0.1, ffl));',
      vertexDecl: 'attribute vec4 aX; uniform vec3 uSeat;', uniforms: { uSeat: { value: seat.clone() } },
      vertexMove: /* glsl */`
        float hf = aX.x, topY = p.y + aX.z * pow(max(hf, 1e-4), 1.25);
        // far off a strand is drawn up into its crown (a short tassel on the hem); it lets itself down as we come near
        p.y = topY - (topY - p.y) * (1. - 0.72 * smoothstep(34., 80., length(p.xz - cameraPosition.xz)));
        ${SWAY.replace('SY', 'topY')} p.xz += swv;
        float h2 = hf * hf;                                   // glass flows: slow viscous curves, never a snap
        p.x += sin(uTime * 0.52 + aX.y + p.y * 0.23) * 0.5 * h2 + sin(uTime * 0.21 + aX.y * 2.1) * 0.25 * hf;
        p.z += cos(uTime * 0.41 + aX.y * 1.7 + p.y * 0.19) * 0.42 * h2;
        // near the eye a strand turns about its own axis to face us, so we part leaves and never a ribbon's edge
        vec2 wd = vec2(-n.z, n.x), cxz = p.xz - wd * aX.w, aw = cxz - cameraPosition.xz; float ad = length(aw);
        vec2 fd = vec2(-aw.y, aw.x) / max(ad, 0.05); fd *= dot(fd, wd) >= 0. ? 1. : -1.;
        float turnK = 1. - smoothstep(3.5, 9., ad);
        vec2 nd = mix(wd, fd, turnK); nd *= inversesqrt(max(dot(nd, nd), 1e-4));
        p.xz = cxz + nd * aX.w * (1. + 0.35 * turnK);
        float push = (1. - smoothstep(0.5, 2.7, ad)) * (1. - smoothstep(1.2, 3.2, abs(p.y - cameraPosition.y))) * smoothstep(0., 0.3, hf);
        p.xz += aw / max(ad, 0.05) * push * 2.3;
        // from the last of the bend on, hanging strands draw aside from the line of sight to the portal (a cone that
        // is a strand's width at the eye and the medallion's width there), so nothing hangs across the round cut
        vec2 sd2 = uSeat.xz - cameraPosition.xz; float sD = max(length(sd2), 1.); vec2 cf = sd2 / sD, cp = vec2(-cf.y, cf.x);
        float ahead = dot(aw, cf), latc = dot(aw, cp), ak = clamp(ahead / sD, 0., 1.);
        float halfW = 0.75 + 8.5 * ak, yTop = cameraPosition.y + (uSeat.y + 8. - cameraPosition.y) * ak + 1.2;
        float slot = (1. - smoothstep(halfW, halfW + 1.5, abs(latc))) * smoothstep(-1., 1.5, ahead) * (1. - smoothstep(sD - 6., sD - 2., ahead))
          * (1. - smoothstep(yTop, yTop + 1.5, p.y)) * smoothstep(0., 0.3, hf) * smoothstep(0.78, 0.83, uProgress);
        p.xz += cp * (latc >= 0. ? 1. : -1.) * slot * (halfW + 1.5 - abs(latc));`,
      fragMod: /* glsl */`
        float fa = vCut.x, fl = vCut.y;
        float ffl = fwidth(fl) + 0.6 * fwidth(fa);
        float farK = smoothstep(0.22, 0.85, ffl);
        float kk = fract(fl - abs(fa) * 1.15 + (fa >= 0. ? 0. : 0.5));
        // leaves too small to tell apart close up into one hanging strand with a wavy edge (never a dotted line)
        float joinK = smoothstep(0.02, 0.07, ffl);
        float hw = mix(0.36 * pow(max(sin(3.14159 * kk), 1e-4), 0.7), 0.3 + 0.1 * sin(3.14159 * kk), joinK) + farK * 0.9 + 1e-3;
        float lc = abs(fa) - 0.46;
        float r1 = 1. - abs(lc) / hw;
        float rs = 1. - abs(fa) / mix(0.085, 0.2, joinK);
        float rl = max(r1, rs);
        if (rl < 0.) discard;
        wy = mix(mix(lc, 9., step(r1, rs)), 9., step(0.3, farK));
        r = mix(min(max(r1 * 4.5, rs * 0.75), 1.), (1. - abs(fa)) * 1.5, farK);
        r = max(r, 0.93 * smoothstep(0.014, 0.04, ffl));`,   // a leaf under a hand long on screen has no room for a rim
    });
    await ctx.yield();
    const frondGeo = cf.finish({ extraName: 'aX' });
    await ctx.yield();
    const fronds = new THREE.Mesh(frondGeo, frondMat);
    fronds.name = 'fronds'; fronds.frustumCulled = false; scene.add(fronds);
    await ctx.yield();

    // ---- the mirror: gallery and bluff leave their images too; then one mesh under the water plane -----
    {
      for (const side of [-1, 1]) {
        const base = cm.count; let n = 0;
        for (let s = -260; s <= 1100; s += 6, n++) {
          const lat = side * (riverHalf + 24 + 4 * Math.sin(s * 0.021 + side));
          const [x, z] = atLat(s, side > 0 ? Math.min(lat, 150) : lat), h = galleryH(s, side) * (0.22 + 0.78 * sstep(-0.35, 0.3, Math.sin(s * 0.052 + side * 0.8)));
          cm.v(x, -h, z, 0, 0, 1, 0, 9, 0); cm.v(x, 0, z, 0, 0, 1, 1, 9, 0);
        }
        for (let i = 0; i < n - 1; i++) { const a = base + i * 2; cm.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      { const base = cm.count; let n = 0;
        for (let s = 14; s <= 228; s += 3.5, n++) { const [x, y, z] = bluffFace(s, 1), [x0, , z0] = bluffFace(s, 0); cm.v(x, -y, z, 0, 0, 1, 0, 9, 0); cm.v(x0, 0, z0, 0, 0, 1, 1, 9, 0); }
        for (let i = 0; i < n - 1; i++) { const a = base + i * 2; cm.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      await ctx.yield();
      const mirrorMat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: { ...GU, uT1: { value: tp(T.olive, 0.85) }, uT2: { value: tmul(T.amber, tp(T.aubergine, 0.12)) }, uT3: { value: T.aubergine } },
        vertexShader: /* glsl */`
          varying vec3 vWpos; uniform float uTime;
          void main(){
            vec3 p = position; float dep = max(-p.y, 0.), wv = min(dep * 0.22, 1.);
            // glass flows: the image sways sideways in slow curves, more the deeper it reaches
            p.x += sin(dep * 1.3 + uTime * 0.9 + p.z * 0.11) * 0.3 * wv; p.z += cos(dep * 1.1 + uTime * 0.7 + p.x * 0.13) * 0.24 * wv;
            vec4 wp = modelMatrix * vec4(p, 1.); vWpos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */`
          ${GLASS_GLSL} varying vec3 vWpos; uniform vec3 uT1, uT2, uT3;
          void main(){
            vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
            vec3 g = glassGround(d);
            float dep = max(-vWpos.y, 0.), fy = fwidth(dep) * 1.25;
            // the hammered water breaks the image into level lenses, wider toward its far end
            float lat = dot(vWpos.xz, vec2(0.21, 0.13));
            float rip = gNoise(vec2(lat, dep * 1.25 - uTime * 0.22)) * 0.62 + gNoise(vec2(lat * 2.7 + 4., dep * 3.1 + uTime * 0.35)) * 0.38 * (1. - smoothstep(0.1, 0.3, fy * 2.5));
            float thr = mix(0.08, 0.48, smoothstep(0., 22., dep));
            float fine = smoothstep(0.14, 0.42, fy);            // breaks finer than a few pixels give way to their flat average
            float e = mix(rip - thr, 0.5, fine);
            if (e < 0.) discard;
            // the same three planes as the trees above, but a thinner skin: an image is never as dark as its tree
            vec3 tint = mix(uT1, uT2, 1. - smoothstep(74., 94., dist));
            tint = mix(tint, uT3, 1. - smoothstep(24., 34., dist));
            tint = pow(tint, vec3(mix(0.8, 0.5, smoothstep(0., 20., dep))));
            tint = mix(tint, vec3(1.), fine * thr * 0.7);
            vec3 col = g * tint;
            col = mix(mix(g, max(g, uCitron), 0.4), col, smoothstep(0., 0.035 + fwidth(rip) * 1.5, e));   // a pale rim along each break
            ${WELL_IMAGE}
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      await ctx.yield();
      const mirror = new THREE.Mesh(cm.finish(), mirrorMat);
      mirror.name = 'mirror'; mirror.frustumCulled = false; mirror.renderOrder = -0.4; scene.add(mirror);
    }
    await ctx.yield();

    // ---- hogweed, the workshop's emblem: ribbed stem, rays each ending in its own small umbel, lobed leaves
    const seedHeads = edition === 'autumn';
    function hogweedGeometry(full) {
      const c = new Cutter(), H = 3.3, GA = 2.39996;
      c.tube([[0, -0.2, 0], [0.05, H * 0.35, 0.02], [-0.03, H * 0.7, -0.03], [0, H, 0]], [0.12, 0.1, 0.08, 0.06], full ? 6 : 4, 9, 0);
      const lens = (x, y, z, rad) => { // a small umbel: a lens of 12 triangles, relief from the facing term
        const b = c.count, ry = rad * (seedHeads ? 0.22 : 0.5), rr = rad * (seedHeads ? 0.7 : 1);
        c.v(x, y + ry, z, 0, 1, 0, 0, 9, 1);
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.v(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, Math.cos(a), 0.15, Math.sin(a), 0, 9, 1); }
        c.v(x, y - ry * 0.6, z, 0, -1, 0, 0, 9, 1);
        for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; c.idx.push(b, b + 1 + k2, b + 1 + k, b + 7, b + 1 + k, b + 1 + k2); }
      };
      const umbel = (ox, oy, oz, rays, rad, tiltX, tiltZ) => {
        for (let i = 0; i < rays; i++) {
          const rho = Math.sqrt((i + 0.6) / rays) * rad, a = i * GA;
          let ex2 = Math.cos(a) * rho, ez = Math.sin(a) * rho, ey = rad * (0.62 - 0.42 * (rho / rad) * (rho / rad));
          ex2 += tiltX * ey; ez += tiltZ * ey;
          const mx = ox + ex2 * 0.45, my = oy + ey * 0.62, mz = oz + ez * 0.45;
          c.tube([[ox, oy, oz], [ox + ex2, oy + ey, oz + ez]], [0.036, 0.026], 3, 9, 0);
          lens(ox + ex2, oy + ey, oz + ez, rad * (seedHeads ? 0.2 : 0.235));
        }
      };
      umbel(0, H, 0, full ? 24 : 9, 0.82, 0, 0);
      if (full) for (const [a, h, len] of [[0.6, 0.62, 0.95], [3.4, 0.5, 0.8]]) {
        const bx = Math.cos(a) * len * 0.7, bz = Math.sin(a) * len * 0.7, by = H * h + len * 0.75;
        c.tube([[0, H * h, 0], [bx * 0.6, H * h + len * 0.4, bz * 0.6], [bx, by, bz]], [0.05, 0.04, 0.03], 4, 9, 0);
        umbel(bx, by, bz, 11, 0.44, Math.cos(a) * 0.35, Math.sin(a) * 0.35);
      }
      // lobed leaves: a fan with a wandering, deeply cut rim; midrib engraved where the wheel coordinate is 0
      for (let li = 0; li < (full ? 4 : 2); li++) {
        const a = li * 1.9 + 0.4, ca = Math.cos(a), sa = Math.sin(a), L = 1.15 - li * 0.1, y0 = 0.25 + li * 0.42, b = c.count;
        const P = (t, w, lift) => [ca * t * L - sa * w * L * 0.55, y0 + lift * 0.3 + (t * 0.95 - t * t * 0.55) * L + w * L * 0.8, sa * t * L + ca * w * L * 0.55];
        const mid = [[0.12, 0.3], [0.45, 0.55], [0.8, 0.5]], rim = [[0.05, 0.1, 0.18], [0.3, 0.42, 0.5], [0.42, 0.2, 0.52], [0.62, 0.5, 0.58], [0.72, 0.22, 0.5], [0.95, 0.3, 0.4], [1.12, 0, 0.3]];
        for (const [t, lift] of mid) { const q = P(t, 0, lift); c.v(q[0], q[1], q[2], 0, 1, 0, 1, 0, 0); }
        for (const sgn of [1, -1]) for (const [t, w, lift] of rim) { const q = P(t, w * sgn, lift); c.v(q[0], q[1], q[2], 0, 1, 0, 0, w * sgn * 3 + sgn * 0.3, 0); }
        for (const o of [3, 10]) { const R = (k) => b + o + k; const tri = (x, y, z) => c.idx.push(x, y, z);
          tri(b, R(0), R(1)); tri(b, R(1), R(2)); tri(b, R(2), b + 1); tri(b + 1, R(2), R(3)); tri(b + 1, R(3), R(4)); tri(b + 1, R(4), b + 2); tri(b + 2, R(4), R(5)); tri(b + 2, R(5), R(6)); }
      }
      return c.finish();
    }
    const hogMat = aboveMaterial(glass, {
      skins: 3, wobble: 2.2, veinHalf: 0.05, tints: [tmul(tp(T.olive, 0.5), tp(T.amber, 0.7)), tmul(T.amber, tp(T.aubergine, 0.5)), T.aubergine],
      fragMod: 'r = min(r * 2.4, 0.96);',   // the steps keep close to the bitten edge: a stepped rim, then the dark, never broad contour bands
      vertexMove: /* glsl */`
        float hph = 0.;
        #ifdef USE_INSTANCING
          hph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
        #endif
        float hb = p.y * p.y * 0.012;
        p.x += sin(uTime * 0.6 + hph) * hb + sin(uTime * 1.7 + hph * 3. + p.z * 4.) * 0.012 * p.y;
        p.z += cos(uTime * 0.47 + hph * 1.3) * hb;` });
    const hogSpots = [], hr2 = rng.fork('hogweed');
    const addHog = (x, z, sc, near) => hogSpots.push({ x, z, sc, near, rot: hr2.range(0, TAU) });
    addHog(7.2, 19, 1.62, true); addHog(6.5, 31, 1.78, true); addHog(9.2, 41, 1.4, true); addHog(8.4, 52, 1.5, true);   // the first frame's three heads
    addHog(8.0, 55, 1.2, true); addHog(-7.6, 47, 1.0, true); addHog(4.5, 49.5, 1.6, true);
    {
      const nBar = Math.round(36 * density), nBank = Math.round(64 * detail * density);
      for (let i = 0; i < nBar; i++) { const s = hr2.range(48, 122), lat = edgeR(s) + 0.8 + hr2.range(0, 1) * hr2.range(0, 9); const [x, z] = atLat(s, lat); if (pathClear(x, z) > 6.6) addHog(x, z, hr2.range(0.85, 1.3), true); }
      for (let i = 0; i < nBank; i++) {
        const side = hr2() < 0.62 ? 1 : -1, s = hr2.range(-90, 600), e = side > 0 ? edgeR(s) : edgeL(s), [x, z] = atLat(s, e + side * hr2.range(0.6, 5));
        const d = pathClear(x, z); if (d < 6.6 || (side < 0 && s > 12 && s < 230) || (side > 0 && s > 204 && s < 272)) continue;   // none behind the storks: the pale birds stand alone
        addHog(x, z, hr2.range(0.85, 1.35), d < 15);
      }
    }
    for (const [uu, lat, sc] of [[0.675, 6.5, 1.7], [0.737, -5.2, 1.9], [0.775, 6.2, 1.6], [0.845, -3.8, 1.45]]) {   // specimens standing in the water beside our course
      const pp = path.pointAt(uu), tt = path.tangentAt(uu); hogSpots.push({ x: pp.x + tt.z * lat, z: pp.z - tt.x * lat, sc, near: true, rot: hr2.range(0, TAU) });
    }
    { // the two hogweeds that close the round of the exit frame, leaning in from either side
      const px = ex.tz, pz = -ex.tx;
      for (const sd of [-1, 1]) hogSpots.push({ x: seat.x - ex.tx * 1.6 + px * sd * 9.6, z: seat.z - ex.tz * 1.6 + pz * sd * 9.6, sc: 1.75, near: true, rot: hr2.range(0, TAU) });
    }
    const dummy = new THREE.Object3D();
    for (const full of [true, false]) {
      const list = hogSpots.filter((h) => h.near === full), mesh = new THREE.InstancedMesh(hogweedGeometry(full), hogMat, Math.max(1, list.length));
      list.forEach((h, i) => { dummy.position.set(h.x, h.y ?? 0.15, h.z); dummy.rotation.set(h.tilt ?? 0, h.rot, 0); dummy.scale.setScalar(h.sc); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
      if (!list.length) { dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(0, dummy.matrix); }
      mesh.frustumCulled = false; mesh.name = full ? 'hogweed' : 'hogweed-far'; scene.add(mesh);
      await ctx.yield();
    }

    // ---- (o5) THE GATE OF UMBELS: giant hogweed, the workshop's emblem grown to the height of the vase. Five ribbed stalks
    //      rise from the water at the start of the bend and arch over the channel; their flat heads (rays, each ending in a
    //      round umbellet whose spokes and florets are cut out of a disc) stand against the flare of the lamp behind them.
    const gateSpec = [[322, -9.5, 25, 7, 10], [330, 10, 29, 8.5, 11.5], [315, 14.5, 20, 4, 8], [340, -10.5, 22, 7, 8.6], [349, 9, 16, 5, 7]];   // [course s, lateral, height, overhang, head radius]
    const gateHeads = [], isletAt = atLat(396, 16);
    {
      const c = new Cutter().withExtra(1), gr = rng.fork('gate'), GA = 2.39996;
      const fa = new THREE.Vector3(), fb = new THREE.Vector3(), ft = new THREE.Vector3();
      const loft = (pts, radii, sides, ribbed) => {      // a stem: rings with a doubled seam and a carried frame (no twist); wheel coordinate = the side index (ribs) or 9 (plain)
        const base = c.count, n = pts.length; fa.set(1, 0, 0.3).normalize();
        for (let i = 0; i < n; i++) {
          const p = pts[i], q = pts[Math.min(i + 1, n - 1)], o = pts[Math.max(i - 1, 0)];
          ft.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
          fb.crossVectors(ft, fa); if (fb.lengthSq() < 1e-6) fb.set(0, 0, 1); fb.normalize(); fa.crossVectors(fb, ft).normalize();
          for (let k = 0; k <= sides; k++) {
            const an = k / sides * TAU, co = Math.cos(an), si = Math.sin(an), nx = fa.x * co + fb.x * si, ny = fa.y * co + fb.y * si, nz = fa.z * co + fb.z * si;
            c.v(p[0] + nx * radii[i], p[1] + ny * radii[i], p[2] + nz * radii[i], nx, ny, nz, 0, ribbed ? k : 9, 1);
          }
        }
        for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const p0 = base + i * (sides + 1) + k; c.idx.push(p0, p0 + 1, p0 + sides + 1, p0 + 1, p0 + sides + 2, p0 + sides + 1); }
      };
      const dN = new THREE.Vector3(), d1 = new THREE.Vector3(), d2 = new THREE.Vector3();
      const disc = (x, y, z, R) => {                     // an umbellet: a flat round in the plane (d1, d2); cut = its own (x, y) in radii
        const b = c.count; c.cur[0] = 1;
        c.v(x, y, z, dN.x, dN.y, dN.z, 0, 0, 0);
        for (let k = 0; k < 8; k++) { const an = k / 8 * TAU, co = Math.cos(an) * 1.09, si = Math.sin(an) * 1.09; c.v(x + (d1.x * co + d2.x * si) * R, y + (d1.y * co + d2.y * si) * R, z + (d1.z * co + d2.z * si) * R, dN.x, dN.y, dN.z, co, si, 0); }
        for (let k = 0; k < 8; k++) c.idx.push(b, b + 1 + k, b + 1 + (k + 1) % 8);
        c.cur[0] = 0;
      };
      const umbel = (o, ax, rad, rays) => {              // o = the node the rays spring from, ax = the head's axis
        dN.set(ax[0], ax[1], ax[2]).normalize(); d1.set(0.2, 0, 1).cross(dN).normalize(); d2.crossVectors(dN, d1);
        for (let i = 0; i < rays; i++) {
          const f = Math.sqrt((i + 0.6) / rays), rho = f * rad, an = i * GA + o[0], h = rad * (0.66 - 0.36 * f * f), ca = Math.cos(an) * rho, sa = Math.sin(an) * rho;
          const q = [o[0] + d1.x * ca + d2.x * sa + dN.x * h, o[1] + d1.y * ca + d2.y * sa + dN.y * h, o[2] + d1.z * ca + d2.z * sa + dN.z * h];
          const m = [o[0] + (q[0] - o[0]) * 0.55 - dN.x * h * 0.16, o[1] + (q[1] - o[1]) * 0.55 - dN.y * h * 0.16, o[2] + (q[2] - o[2]) * 0.55 - dN.z * h * 0.16];   // a ray bows out a little
          loft([o, m, q], [rad * 0.03, rad * 0.024, rad * 0.018], 4, false);
          disc(q[0], q[1], q[2], rad * (0.125 + 0.035 * gr()));
        }
      };
      const leaf = (o, a, L, droop) => {                 // a lobed leaf: a fan with a deeply cut rim, midrib on the wheel
        const ca = Math.cos(a), sa = Math.sin(a), b = c.count;
        const P = (t, w, lift) => [o[0] + ca * t * L - sa * w * L * 0.6, o[1] + lift * 0.3 * L + (t * 0.75 - t * t * droop) * L + Math.abs(w) * L * 0.25, o[2] + sa * t * L + ca * w * L * 0.6];
        const mid = [[0.1, 0.1], [0.45, 0.25], [0.8, 0.2]], rim = [[0.02, 0.06, 0.05], [0.3, 0.46, 0.2], [0.42, 0.2, 0.22], [0.62, 0.54, 0.25], [0.72, 0.22, 0.2], [0.95, 0.32, 0.12], [1.14, 0, 0.05]];
        for (const [t, lift] of mid) { const q = P(t, 0, lift); c.v(q[0], q[1], q[2], 0, 1, 0, 1, 0, 0); }
        for (const sgn of [1, -1]) for (const [t, w, lift] of rim) { const q = P(t, w * sgn, lift); c.v(q[0], q[1], q[2], 0, 1, 0, 0, w * sgn * 3 + sgn * 0.3, 0); }
        for (const o2 of [3, 10]) { const R = (k) => b + o2 + k, tri = (x, y, z) => c.idx.push(x, y, z);
          tri(b, R(0), R(1)); tri(b, R(1), R(2)); tri(b, R(2), b + 1); tri(b + 1, R(2), R(3)); tri(b + 1, R(3), R(4)); tri(b + 1, R(4), b + 2); tri(b + 2, R(4), R(5)); tri(b + 2, R(5), R(6)); }
      };
      for (const [gs, glat, H, over, rad] of gateSpec) {
        const [fx, fz, cc] = atLat(gs, glat), sg = glat > 0 ? -1 : 1, lx = cc.tz * sg, lz = -cc.tx * sg;   // (lx, lz): toward the channel
        const al = gr.range(-1.5, 1.5), spine = (f) => { const o = over * f * f; return [fx + lx * o + cc.tx * al * f, -0.8 + (H + 0.8) * (f - 0.25 * f * f) / 0.75, fz + lz * o + cc.tz * al * f]; };
        const sp = [], sr = [], r0 = 0.04 * H;
        for (let i = 0; i <= 11; i++) { const f = i / 11; sp.push(spine(f)); sr.push(r0 * (1 - 0.56 * f) * (1 + 0.16 * Math.exp(-Math.pow((f - 0.36) / 0.035, 2)) + 0.16 * Math.exp(-Math.pow((f - 0.66) / 0.035, 2)))); }   // swollen at its two nodes
        loft(sp, sr, 10, true);
        const top = spine(1), under = spine(0.94), tx = top[0] - under[0], ty = top[1] - under[1], tz = top[2] - under[2], tl = Math.hypot(tx, ty, tz) || 1;
        umbel(top, [tx / tl * 0.7, ty / tl * 0.7 + 1.0, tz / tl * 0.7], rad, 30);
        gateHeads.push(new THREE.Vector3(top[0], top[1] + rad * 0.35, top[2]));
        await ctx.yield();
        // two lesser heads on side shoots from the upper node, and three great leaves from the lower one
        for (const [f, da, len, k] of [[0.66, 1.25, 0.3, 0.52], [0.7, -1.35, 0.24, 0.42]]) {
          const o = spine(f), a = Math.atan2(lz, lx) + da, ex2 = Math.cos(a) * H * len * 0.75, ez = Math.sin(a) * H * len * 0.75, ey = H * len * 0.8;
          const e = [o[0] + ex2, o[1] + ey, o[2] + ez];
          loft([o, [o[0] + ex2 * 0.6, o[1] + ey * 0.4, o[2] + ez * 0.6], e], [r0 * 0.4, r0 * 0.33, r0 * 0.26], 5, false);
          umbel(e, [ex2 * 0.012, 1, ez * 0.012], rad * k, 13);
        }
        for (const [f, da, L] of [[0.3, 2.5, 0.2], [0.36, -2.5, 0.22], [0.2, 3.14, 0.17]]) { const o = spine(f); leaf(o, Math.atan2(lz, lx) + da + gr.range(-0.3, 0.3), H * L, 0.55); }   // turned away from the channel
        await ctx.yield();
      }
      { // the islet of the lone willow: a low mound with a wandering shore
        const b = c.count, [ix, iz] = isletAt;
        c.v(ix, 0.7, iz, 0, 1, 0, 1, 9, 0);
        for (let k = 0; k < 18; k++) { const a = k / 18 * TAU, ro = 5.2 + 1.3 * Math.sin(a * 3 + 1) + 0.7 * Math.sin(a * 5); c.v(ix + Math.cos(a) * ro * 1.25, 0.05, iz + Math.sin(a) * ro, 0, 1, 0, 0, 9, 0); }
        for (let k = 0; k < 18; k++) c.idx.push(b, b + 1 + (k + 1) % 18, b + 1 + k);
      }
      const gateOpts = {
        skins: 3, biteScale: 0.3, wobble: 0.5, veinHalf: 0.1,
        tints: [tmul(tp(T.olive, 0.5), tp(T.amber, 0.7)), tmul(T.amber, tp(T.aubergine, 0.5)), T.aubergine],
        vertexDecl: 'attribute float aK; varying float vK;', fragDecl: 'varying float vK;',
        // glass flows: the tall stalks lean and recover in slow curves, the heads most
        vertexMove: 'vK = aK; float gb = max(p.y, 0.) * max(p.y, 0.) * 0.0012; p.x += sin(uTime * 0.31 + p.z * 0.05) * gb; p.z += cos(uTime * 0.24 + position.x * 0.04) * gb * 0.8;',
        fragMod: /* glsl */`
          float isD = step(0.5, vK);
          vec2 dq = vCut.xy; float drho = length(dq), dang = drho > 1e-3 ? atan(dq.y, dq.x) : 0.;
          float dfw = fwidth(drho) + 1e-4;
          float a12 = abs(fract(dang * 1.9099 + 0.25) - 0.5) * 0.5236 * drho;      // distance to the nearest of twelve spokes, in radii
          float a6 = abs(fract(dang * 0.9549 + 0.1) - 0.5) * 1.0472 * drho;
          float fo = 1. - length(vec2(drho - 0.78, a12)) / 0.215;                  // a ring of florets at the spoke ends
          float fi = 1. - length(vec2(drho - 0.4, a6)) / 0.17;                     // and a lesser ring inside it
          float spk = (1. - a12 / max(0.05, dfw * 1.3)) * step(drho, 0.78);        // a spoke never thinner than a pixel and a half
          float dnear = max(max(fo, fi), spk);
          float dfar = 1.04 + 0.05 * cos(dang * 12.) - drho;                       // far off the umbellet is its flat round with a scalloped rim
          float dmd = mix(dnear, dfar, smoothstep(0.06, 0.13, dfw));
          if (isD > 0.5 && dmd < 0.) discard;
          r = mix(min(r * 2.4, 0.96), min(dmd * 1.5 + 0.08, 0.96), isD);
          // a stalk, ray or umbellet only a few pixels wide has no room for a rim: it is the dark overlay alone
          r = max(r, 0.93 * mix(smoothstep(0.08, 0.25, fwidth(rr)) * step(0.5, vCut.z), smoothstep(0.07, 0.15, dfw), isD));
          wy = mix(mix(vCut.y, fract(vCut.y) - 0.5, step(0.5, vCut.z)), 9., isD);` };
      const gate = new THREE.Mesh(c.finish({ extraName: 'aK' }), aboveMaterial(glass, gateOpts));
      gate.name = 'gate'; gate.frustumCulled = false; scene.add(gate);
      // (o7) and its image stands in the water under it, a thinner skin broken into level lenses by the hammered surface
      const gateImage = new THREE.Mesh(gate.geometry, overlayMaterial(glass, { ...gateOpts, fragPost: /* glsl */`
        float dep = max(-vWpos.y, 0.), mfy = fwidth(dep) * 1.25, mlat = dot(vWpos.xz, vec2(0.21, 0.13));
        float rip = gNoise(vec2(mlat, dep * 1.1 - uTime * 0.22)) * 0.62 + gNoise(vec2(mlat * 2.7 + 4., dep * 2.6 + uTime * 0.35)) * 0.38 * (1. - smoothstep(0.1, 0.3, mfy * 2.5));
        float mthr = mix(0.1, 0.5, smoothstep(0., 30., dep)), mfine = smoothstep(0.14, 0.42, mfy);
        float me = mix(rip - mthr, 0.5, mfine);
        if (me < 0.) discard;
        col = mix(g, col, mix(0.85, 0.5, smoothstep(0., 28., dep)) * (1. - mfine * mthr * 0.7));
        col = mix(mix(g, max(g, uCitron), 0.25), col, smoothstep(0., 0.03 + fwidth(rip) * 1.5, me));
          ${WELL_IMAGE}` }));
      gateImage.scale.y = -1; gateImage.name = 'gate-image'; gateImage.frustumCulled = false; gateImage.renderOrder = -0.4; scene.add(gateImage);
    }
    await ctx.yield();

    // ---- (o7) THE BLOOM ITSELF: where the river leaves the bend the swarm stands up off the water in one great
    //      column, two strands of wings (one of foil, one of thin amber skins) winding round each other from a wide skirt at the water through a narrow
    //      waist to a crown that opens 36 m up, with the low sun beside it. Against the lit band the animals are thin
    //      amber skins; where the wall or the willows are darker than foil their wings turn gold. All closed form of time.
    const colAt = atLat(437, -13), COL_H = 44;
    const colU = { uCol: { value: new THREE.Vector4(colAt[0], colAt[1], COL_H, 1) }, uColR: { value: new THREE.Vector4(9, 3.0, 7, 0.4) }, uAmberT: { value: T.amber } };
    {
      const nCol = Math.round(12000 * detail), g = new THREE.InstancedBufferGeometry(), cr2 = rng.fork('column');
      const A2 = [0.15, -0.1], B2 = [0.5, 1.22], C2 = [-1.05, 0.45], pos = [];
      for (const sd of [-1, 1]) for (const v of (sd < 0 ? [A2, B2, C2] : [A2, C2, B2])) pos.push(v[0], v[1], sd);
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const seed = new Float32Array(nCol * 4); for (let i = 0; i < seed.length; i++) seed[i] = cr2();
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = nCol;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(colAt[0], 18, colAt[1]), 1e5);
      const colMat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, uniforms: { ...GU, ...colU },
        vertexShader: /* glsl */`
          attribute vec4 aSeed; uniform float uTime, uViewH; uniform vec4 uCol, uColR;
          varying vec2 vQ; varying vec3 vWpos; varying vec4 vInfo; varying float vTone;
          void main(){
            float H = uCol.z, loose = step(0.8, aSeed.y), arm = floor(aSeed.x * 2.);
            float h = fract(aSeed.z + uTime * (0.016 + 0.012 * aSeed.w));          // every animal climbs the column and begins again
            float y = 0.25 + h * H;
            float R = uColR.x * exp(-y / 2.4) + uColR.y + uColR.z * h * h * h;      // skirt, waist, crown
            float rnd = fract(aSeed.w * 7.13), rn2 = fract(aSeed.w * 23.7);
            float th = arm * 3.14159 + y * uColR.w - uTime * 0.22 + (aSeed.y - 0.4) * mix(0.75, 8.5, loose);
            float open = smoothstep(0.74, 1., h);                                    // the crown opens and the strands come apart
            float rr = R * mix(0.84 + 0.28 * rnd, 0.25 + 1.15 * sqrt(rnd), max(loose, open * 0.8)) * (1. + 1.4 * open * rn2);
            vec3 c = vec3(uCol.x + cos(th) * rr, y + sin(uTime * 1.3 + aSeed.w * 40.) * 0.25, uCol.y + sin(th) * rr);
            // nose along the strand, climbing; wings beating
            vec3 fw = normalize(vec3(-sin(th), 0.55, cos(th))), rt = normalize(vec3(cos(th), 0., sin(th))), up = cross(rt, fw);
            float beat = uTime * (11. + 5. * aSeed.z) + aSeed.w * 57., ang = 0.85 + 0.6 * sin(beat);
            vec3 toC = c - cameraPosition; float dist = max(length(toC), 0.05);
            float W = 0.085 * (0.85 + 0.3 * rn2);
            float px = W * uViewH * 0.5 * projectionMatrix[1][1] / dist;
            float big = step(0.86, fract(aSeed.w * 29.7));
            float pmin = mix(3.4, 5.5 + 5. * rnd, big);
            vTone = mix(1. - arm, step(0.4, rn2), loose);                             // a strand of foil and a strand of thin amber skins wind round each other
            float k = max(1., pmin / max(px, 1e-3)) * smoothstep(0., 0.03, h) * (1. - smoothstep(0.9, 1., h)) * uCol.w;
            vec3 wdir = rt * position.z * cos(ang) + up * sin(ang);
            vec3 p = c + (fw * position.x + wdir * position.y) * W * k;
            vQ = position.xy; vWpos = p; vInfo = vec4(0.5 + 0.5 * sin(beat + 0.9), aSeed.w, px * k, h);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`
          ${GLASS_GLSL} ${WING_GLSL}
          uniform vec3 uAmberT; varying vec2 vQ; varying vec3 vWpos; varying vec4 vInfo; varying float vTone;
          void main(){
            vec3 V = vWpos - cameraPosition; float dist = length(V); vec3 d = V / max(dist, 1e-4);
            vec3 g = glassGround(d);
            float fwq = max(fwidth(vQ.x), fwidth(vQ.y));
            vec3 w = wingShape(vQ);
            if (w.x < 0.) discard;
            vec3 col = wingGlass(g, w, vQ, fwq, vInfo.x, vInfo.y, vInfo.z, uAmberT);
            // far off a strand is one tone: foil that turns with the beat, or a thin amber skin over the ground (which
            // carries the column where the lit band behind it is as pale as foil)
            float fine = smoothstep(9., 26., vInfo.z);
            vec3 foilC = mix(mix(uHoney, uFoil, 0.55 + 0.45 * vInfo.x), uCitron, 0.3);
            vec3 skinC = g * mix(vec3(1.), uAmberT, 0.7 + 0.25 * fract(vInfo.y * 9.7));
            col = mix(mix(skinC, foilC, step(0.5, vTone)), col, fine);
            if (wellHid(vWpos) > 0.5) discard;   // (p3) from beneath the skin: only through the well
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      const column = new THREE.Mesh(g, colMat); column.name = 'column'; column.frustumCulled = false; scene.add(column);
      waterMat.uniforms.uPool.value.set(colAt[0], colAt[1], 17, 1);
    }
    await ctx.yield();

    // ---- reed and arrowhead at the margins ---------------------------------------------------------------
    {
      const c = new Cutter(), rr = rng.fork('reeds');
      for (let i = 0; i < 6; i++) { // a blade: 3 x 3 vertices, edges r 0, heart r 1, midrib on the wheel
        const a = rr.range(0, TAU), ox = Math.cos(a) * rr.range(0.05, 0.4), oz = Math.sin(a) * rr.range(0.05, 0.4), h = rr.range(1.5, 2.6), w = rr.range(0.045, 0.07);
        const lx = Math.cos(a) * rr.range(0.1, 0.5), lz = Math.sin(a) * rr.range(0.1, 0.5), wx = -Math.sin(a), wz = Math.cos(a), b = c.count;
        for (let j = 0; j < 3; j++) { const f = j / 2, ww = w * (1 - f * 0.95), px = ox + lx * f * f, pz = oz + lz * f * f;
          for (const k of [-1, 0, 1]) c.v(px + wx * ww * k, h * f - 0.1, pz + wz * ww * k, 0, 1, 0, k === 0 ? 1 - f * 0.9 : 0, k, 0); }
        for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const q = b + j * 3 + k; c.idx.push(q, q + 1, q + 3, q + 1, q + 4, q + 3); }
      }
      for (let i = 0; i < 2; i++) { // arrowhead: a stalk and one barbed leaf
        const a = rr.range(0, TAU), ca = Math.cos(a), sa = Math.sin(a), h = rr.range(0.7, 1.1), ox = ca * 0.45, oz = sa * 0.45, b0 = c.count;
        c.tube([[ox * 0.5, -0.1, oz * 0.5], [ox, h * 0.6, oz], [ox * 1.2, h, oz * 1.2]], [0.022, 0.018, 0.014], 3, 9, 0);
        const b = c.count, L = 0.42, tx = ox * 1.2, tz = oz * 1.2;
        c.v(tx, h, tz, 0, 1, 0, 1, 0, 0);
        for (const [t, w] of [[1.0, 0], [0.2, 0.42], [-0.75, 0.5], [-0.15, 0.06], [-0.15, -0.06], [-0.75, -0.5], [0.2, -0.42]]) c.v(tx + (ca * t - sa * w) * L, h + t * L * 0.75, tz + (sa * t + ca * w) * L, 0, 1, 0, 0, w * 4 + (w >= 0 ? 0.2 : -0.2), 0);
        for (let k = 0; k < 7; k++) c.idx.push(b, b + 1 + k, b + 1 + (k + 1) % 7);
      }
      await ctx.yield();
      const spots = [];
      const nR = Math.round(170 * detail * density);
      for (let i = 0; i < nR; i++) {
        const side = rr() < 0.6 ? 1 : -1, s = rr.range(-80, 620), e = side > 0 ? edgeR(s) : edgeL(s), [x, z] = atLat(s, e + side * rr.range(-1.2, 2.5));
        if (pathClear(x, z) < 5.6 || (side < 0 && s > 14 && s < 228 && rr() < 0.5)) continue;
        spots.push([x, z, rr.range(0.8, 1.35), rr.range(0, TAU)]);
      }
      for (let k = 0; k < 26; k++) { const s = rr.range(200, 260), [x, z] = atLat(s, edgeR(s) + rr.range(2.6, 3.8)); spots.push([x, z, rr.range(1.1, 1.5), rr.range(0, TAU)]); } // the reed bed behind the storks
      for (let k = 0; k < 56; k++) { const onStork = k % 2 === 0, s = onStork ? rr.range(190, 264) : rr.range(22, 120), [x, z] = atLat(s, edgeR(s) + 1 + rr.range(0, 1) * rr.range(2, 20)); if (pathClear(x, z) > 6) spots.push([x, z, rr.range(0.9, 1.5), rr.range(0, TAU)]); }   // tufts over the bars, so no bar lies bare
      for (const [gs, glat] of gateSpec) { const [x, z] = atLat(gs, glat); for (let k = 0; k < 7; k++) { const a = rr.range(0, TAU), d = rr.range(1.6, 4.2); spots.push([x + Math.cos(a) * d, z + Math.sin(a) * d, rr.range(1.5, 2.6), rr.range(0, TAU)]); } }   // (o5) sedge round the feet of the giant umbels
      for (let k = 0; k < 16; k++) { const a = rr.range(0, TAU), d = rr.range(3.5, 6.5); spots.push([isletAt[0] + Math.cos(a) * d * 1.25, isletAt[1] + Math.sin(a) * d, rr.range(1.2, 2.2), rr.range(0, TAU)]); }   // and round the lone willow's islet
      for (const [x, z] of [[-18, 15], [-19, 86]]) for (let k = 0; k < 5; k++) spots.push([x + rr.range(-1.6, 1.6), z + rr.range(-1.6, 1.6), rr.range(0.8, 1.2), rr.range(0, TAU)]);
      for (let i = 0; i < 40; i++) { const uu = 0.06 + 0.9 * (i + rr()) / 40, pp = path.pointAt(uu), tt = path.tangentAt(uu), sd = i % 2 ? -1 : 1, lat = sd * rr.range(5.5, 11);
        for (let k = 0; k < 3; k++) spots.push([pp.x + tt.z * lat + rr.range(-1.1, 1.1), pp.z - tt.x * lat + rr.range(-1.1, 1.1), rr.range(1.2, 2.1), rr.range(0, TAU)]); }   // clumps standing in the water along our course
      await ctx.yield();
      { const keep = spots.filter(([x, z]) => !inTub(x, z, 0.6)); spots.length = 0; spots.push(...keep); }   // (p3) no clump stands in the tub's plan nor within 0.6 m of it: its foot would hang under the hall's ceiling (by place; every draw above is made as before)
      const reeds = new THREE.InstancedMesh(c.finish(), aboveMaterial(glass, {
        skins: 3, wobble: 1.4, veinHalf: 0.12, tints: [tp(T.olive, 0.75), T.olive, tmul(T.olive, tp(T.amber, 0.7))],
        vertexMove: /* glsl */`
          float rph = 0.;
          #ifdef USE_INSTANCING
            rph = instanceMatrix[3].x * 0.41 + instanceMatrix[3].z * 0.29;
          #endif
          float rb = p.y * p.y * 0.035;
          p.x += sin(uTime * 0.7 + rph + p.z * 2.) * rb; p.z += cos(uTime * 0.53 + rph * 1.7 + p.x * 2.) * rb;` }), Math.max(1, spots.length));
      spots.forEach(([x, z, sc, rot], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); reeds.setMatrixAt(i, dummy.matrix); });
      reeds.frustumCulled = false; reeds.name = 'reeds'; scene.add(reeds);
    }
    await ctx.yield();

    // ---- (o7) THE IRIS BED: the workshop's other flower. Sword leaves in one olive skin with a wheel-cut midrib, and on
    //      each stalk a flag cut in three steps to an aubergine heart (three falls, three standards, a pale rim and one
    //      engraved line down each petal). They plant the foot of the clay bluff and stand in clumps beside our course.
    {
      const c = new Cutter().withExtra(1), ir = rng.fork('iris');
      const strip = (o, a, st, rc, lean = 0) => {          // a leaf or petal: stations [out, up, half width] along direction a
        const ca = Math.cos(a), sa = Math.sin(a), b = c.count, n = st.length;
        for (let j = 0; j < n; j++) { const [out, up, hw] = st[j], f = j / (n - 1), px = o[0] + ca * (out + lean * f * f), pz = o[2] + sa * (out + lean * f * f);
          for (const k of [-1, 0, 1]) c.v(px - sa * hw * k, o[1] + up, pz + ca * hw * k, ca, 0.5, sa, k === 0 ? rc * (1 - 0.5 * f) : 0, k, 0); }
        for (let j = 0; j < n - 1; j++) for (let k = 0; k < 2; k++) { const q = b + j * 3 + k; c.idx.push(q, q + 1, q + 3, q + 1, q + 4, q + 3); }
      };
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3 + ir.range(-0.3, 0.3), h = ir.range(0.8, 1.35), w = ir.range(0.045, 0.065), d0 = ir.range(0.02, 0.1);
        c.cur[0] = 0; strip([Math.cos(a) * d0, -0.1, Math.sin(a) * d0], a, [[0, 0, w], [0, h * 0.55, w * 0.9], [0, h, 0.004]], 0.34, ir.range(0.12, 0.4));
      }
      for (const [sa0, sh, sx] of [[0.7, 1.8, 0.1], [3.6, 1.45, 0.16]]) {
        const ox = Math.cos(sa0) * sx, oz = Math.sin(sa0) * sx, top = [ox * 1.6, sh, oz * 1.6];
        c.cur[0] = 0; c.tube([[ox * 0.4, -0.1, oz * 0.4], [ox, sh * 0.55, oz], top], [0.02, 0.017, 0.014], 3, 9, 0); c.cur[0] = 1;
        for (let k = 0; k < 3; k++) {
          const a = sa0 + k * 2.0944;
          strip(top, a, [[0.02, 0, 0.03], [0.15, 0.1, 0.13], [0.3, 0.07, 0.15], [0.4, -0.1, 0.105], [0.43, -0.26, 0.004]], 1);       // a fall
          strip(top, a + 1.0472, [[0.02, 0.03, 0.03], [0.1, 0.2, 0.105], [0.09, 0.37, 0.085], [0.0, 0.48, 0.004]], 1);                // a standard
        }
      }
      const spots = [];
      for (let s = 22; s <= 224; s += 8.5) for (let k = 0; k < 3; k++) { const ss = s + ir.range(-2.2, 2.2), [x, z] = atLat(ss, edgeL(ss) + 2.2 + ir.range(0, 1) * ir.range(0.4, 4.2)); spots.push([x, z, ir.range(2.1, 3.3), ir.range(0, TAU)]); }   // in clumps along the foot of the bluff
      for (const [uu, lat] of [[0.178, -6.8], [0.205, 7.2], [0.232, -7.6], [0.262, 6.6], [0.288, -6.4], [0.405, -7.5]]) {   // clumps standing in the water beside our course
        const pp = path.pointAt(uu), tt = path.tangentAt(uu), tl = Math.hypot(tt.x, tt.z) || 1;
        for (let k = 0; k < 4; k++) spots.push([pp.x + tt.z / tl * lat + ir.range(-1.3, 1.3), pp.z - tt.x / tl * lat + ir.range(-1.3, 1.3), ir.range(1.7, 2.5), ir.range(0, TAU)]);
      }
      for (let i = 0; i < 22; i++) { const s = ir.range(236, 600), side = i % 2 ? 1 : -1, e = side > 0 ? edgeR(s) : edgeL(s), [x, z] = atLat(s, e - side * ir.range(0.5, 3)); if (pathClear(x, z) > 6.5) spots.push([x, z, ir.range(1.4, 2.2), ir.range(0, TAU)]); }
      { const keep = spots.filter(([x, z]) => !inTub(x, z, 0.6)); spots.length = 0; spots.push(...keep); }   // (p3) nor an iris clump (by place; the draws are made as before)
      const iris = new THREE.InstancedMesh(c.finish({ extraName: 'aP' }), aboveMaterial(glass, {
        skins: 3, biteScale: 0.3, wobble: 1.2, veinHalf: 0.1, tints: [tp(T.olive, 0.8), tmul(T.amber, tp(T.aubergine, 0.45)), T.aubergine],
        vertexDecl: 'attribute float aP; varying float vP;', fragDecl: 'varying float vP;',
        fragMod: 'r = min(r * mix(1., 3., step(0.5, vP)), 0.96);',
        vertexMove: /* glsl */`
          vP = aP; float iph = 0.;
          #ifdef USE_INSTANCING
            iph = instanceMatrix[3].x * 0.41 + instanceMatrix[3].z * 0.29;
          #endif
          float ib = p.y * p.y * 0.03;
          p.x += sin(uTime * 0.7 + iph + p.z * 2.) * ib; p.z += cos(uTime * 0.53 + iph * 1.7 + p.x * 2.) * ib;` }), spots.length);
      spots.forEach(([x, z, sc, rot], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); iris.setMatrixAt(i, dummy.matrix); });
      iris.name = 'iris'; iris.frustumCulled = false; scene.add(iris);
      // the bluff's hanging growth: aprons of olive leaf let down its face from the top in ragged tongues, so the clay
      // shows as beds between planted ground and never as a bare striped wall
      const ca = new Cutter(); let n = 0;
      for (let s = 16; s <= 226; s += 0.9, n++) {
        const tongue = Math.pow(Math.abs(Math.sin(s * 0.21 + 0.6) * Math.sin(s * 0.083 + 2.1)), 0.7), fine = 0.5 + 0.5 * Math.sin(s * 0.83) * Math.sin(s * 0.31 + 1.3);
        const f1 = clamp(0.93 - (0.1 + 0.62 * tongue) * (0.62 + 0.38 * fine), 0.2, 0.95);
        const [x, y, z, cc] = bluffFace(s, 1.03), [x1, y1, z1] = bluffFace(s, f1), ox = cc.tz * 0.2, oz = -cc.tx * 0.2;
        ca.v(x + ox, y + 0.2, z + oz, 1, 0, 0, 1.05, 9, 0); ca.v((x + x1) / 2 + ox, (y + y1) / 2, (z + z1) / 2 + oz, 1, 0, 0, 0.55, 9, 0); ca.v(x1 + ox, y1, z1 + oz, 1, 0, 0, 0, 9, 0);
        if (n > 0) { const a = (n - 1) * 3; ca.idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
      }
      const apron = new THREE.Mesh(ca.finish(), aboveMaterial(glass, { skins: 2, biteScale: 0.6, wobble: 0.9, tints: [tp(T.olive, 0.8), tmul(T.olive, tp(T.amber, 0.6)), tmul(T.olive, tp(T.amber, 0.6))] }));
      apron.name = 'apron'; apron.frustumCulled = false; scene.add(apron);
    }
    await ctx.yield();

    const PALE = [tp(T.amber, 0.7), T.amber, tmul(T.amber, tp(T.aubergine, 0.3))];
    const CUT_THROUGH = 'col = mix(mix(g, max(g, uCitron), 0.94) * (0.97 + 0.05 * wob), col, smoothstep(0.5, 0.6, vCut.x));';
    // ---- nenuphars: rafts of lily pads on the water along our course, each raft with its pale flowers. A pad is
    //      a round skin of olive with a pale bitten rim, one V cut to its heart and wheel-cut ribs; a flower is
    //      cut through to the ground with only the hearts and tips of its petals left thick.
    const rafts = [], lr2 = rng.fork('lilies');
    let padsMat = null, lilyGeo = null;   // (p3 hall) the pads' material and the flower's geometry, for the hall's own pads and lotus
    for (let i = 0; i < 96; i++) {
      const uu = 0.03 + 0.95 * (i + lr2()) / 96, pp = path.pointAt(uu), tt = path.tangentAt(uu), side = i % 2 ? 1 : -1;
      const tl = Math.hypot(tt.x, tt.z) || 1, lat = (i % 3 === 1 || (uu > 0.63 && i % 2 === 0)) && uu > 0.12 ? lr2.range(-1.5, 1.5) : side * (2.3 + 9 * lr2() * lr2() + (uu < 0.5 ? 2.5 : 0));
      rafts.push({ x: pp.x + tt.z / tl * lat, z: pp.z - tt.x / tl * lat, R: lr2.range(1.6, 3.8), u: uu });
    }
    // (o5) specimens: a water lily in flower, large and whole, beside the course off the bluff and on the open reach before the gate
    const lilySpec = [[0.3468, 1.1, 3.3], [0.363, -2.3, 2.5], [0.376, 3.2, 2.4], [0.538, 2.2, 3.2], [0.556, -3.0, 2.6]].map(([uu, lat, sc]) => { const pp = path.pointAt(uu), tt = path.tangentAt(uu), tl = Math.hypot(tt.x, tt.z) || 1; return [pp.x + tt.z / tl * lat, pp.z - tt.x / tl * lat, sc, uu * 9]; });
    for (const [x, z] of lilySpec) rafts.push({ x: x + 0.5, z: z + 0.4, R: 1.7, u: 0.5 });
    {
      const c = new Cutter().withExtra(4), flowers = [...lilySpec]; let rk = 0;
      for (const rf of rafts) {
        if (++rk % 8 === 0) await ctx.yield();
        const n = Math.round((7 + rf.R * rf.R * 3.2) * (0.5 + 0.5 * detail));
        for (let k = 0; k < n; k++) {
          const a = lr2.range(0, TAU), rr = rf.R * Math.sqrt(lr2()), x = rf.x + Math.cos(a) * rr * 1.5, z = rf.z + Math.sin(a) * rr, sz = lr2.range(0.38, 0.95), rot = lr2.range(0, TAU), b = c.count;
          c.cur[0] = x; c.cur[1] = z; c.cur[2] = lr2(); c.cur[3] = sz;
          if (!touchNear(x, z, 2.5 + sz) && !wellNear(x, z, 0.3 + sz) && !(inTub(x, z) && lineD(x, 0.08, z) - (0.9906 * sz + 0.06) < 2.22)) {   // (p3) no pad lies within 2.5 m of where the route goes through the skin, nor at the round while the route is under it, nor, in the tub's plan, with its edge nearer the flown line than 2.2 m (by place; the draws are made as before)
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.v(Math.cos(rot) * u - Math.sin(rot) * v, 0, Math.sin(rot) * u + Math.cos(rot) * v, 0, 1, 0, u, v, 0);
          c.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
          if (lilySpec.some((q) => Math.hypot(q[0] - x, q[1] - z) < 1.6)) { c.cur[3] = sz * 0.6; for (let q = 1; q <= 4; q++) c.extra[c.extra.length - q * 4 + 3] = sz * 0.6; }   // small pads round a specimen flower
          }
          if (k < 1 + rf.R * 0.9 && k % 2 === 0 && pathClear(x, z) > 2.2 && !lilySpec.some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.4)) { const fl = [x + lr2.range(-0.3, 0.3), z + lr2.range(-0.3, 0.3), lr2.range(1.5, 2.4), lr2.range(0, TAU)]; if (!touchNear(fl[0], fl[1], 2.5 + 0.4 * fl[2]) && !(inTub(fl[0], fl[1]) && lineD(fl[0], 0, fl[1]) < 2.25 + 0.55 * fl[2])) flowers.push(fl); }   // (p3) nor a flower; (p3 hall) nor, in the tub's plan, a flower that would reach within 2.2 m of the flown line
        }
      }
      await ctx.yield();
      const pads = new THREE.Mesh(c.finish({ extraName: 'aX' }), overlayMaterial(glass, {
        skins: 3, wobble: 0.8, veins: 1, veinHalf: 0.07, biteScale: 0.8, tints: [tp(T.olive, 0.8), tmul(T.olive, tp(T.amber, 0.55)), tmul(T.amber, tp(T.aubergine, 0.3))],
        vertexDecl: 'attribute vec4 aX;',
        vertexMove: 'p = vec3(aX.x + p.x * aX.w + sin(uTime * 0.31 + aX.z * 40.) * 0.06, 0.075 + 0.004 * aX.z, aX.y + p.z * aX.w + cos(uTime * 0.27 + aX.z * 23.) * 0.06);',   // above the band's foil on the water
        fragMod: /* glsl */`
          vec2 pq = vCut.xy; float rho = length(pq), ang = rho > 1e-3 ? atan(pq.y, -pq.x) : 0.;
          float md = min(1. + 0.05 * sin(ang * 5. + vWpos.x * 2.) - rho * 1.06, (3.14159 - abs(ang)) * rho * 2.4 - 0.06);
          if (md < 0.) discard;
          r = min(md * 1.7, 0.97); wy = ang * 2.228;`,
        fragPost: WELL_SKIN + WELL_ABOVE }));   // (p3) a pad is bitten away with the skin it lies on; from beneath, only through the well
      pads.name = 'pads'; pads.frustumCulled = false; scene.add(pads); padsMat = pads.material;
      await ctx.yield();
      // the flower: three rings of pointed petals opening from a cup
      const f = new Cutter();
      for (const [np, el, len, hw, a0] of [[9, 0.38, 0.34, 0.085, 0], [7, 0.85, 0.29, 0.075, 0.4], [5, 1.3, 0.22, 0.06, 0.9]]) for (let k = 0; k < np; k++) {
        const a = a0 + k / np * TAU, ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(el), se = Math.sin(el), b = f.count;
        const P = (t, w, lift) => [ca * t * ce * len - sa * w, 0.05 + t * se * len + lift, sa * t * ce * len + ca * w];
        for (const [t, w, lift, r] of [[0.02, 0, 0, 0.95], [0.5, hw, 0.03, 0.05], [0.5, -hw, 0.03, 0.05], [1, 0, 0.05, 0.72], [0.5, 0, 0, 0.38]]) { const q = P(t, w, lift * len * 3); f.v(q[0], q[1], q[2], ca, 0.4, sa, r, 9, 0); }
        f.idx.push(b, b + 1, b + 4, b, b + 4, b + 2, b + 4, b + 1, b + 3, b + 4, b + 3, b + 2);
      }
      const lily = new THREE.InstancedMesh(f.finish(), aboveMaterial(glass, {
        skins: 3, tints: PALE, wobble: 2.5, biteScale: 0.3, fragPost: CUT_THROUGH,
        vertexMove: /* glsl */`
          float lph = 0.;
          #ifdef USE_INSTANCING
            lph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.4;
          #endif
          p.xz *= 1. + 0.1 * sin(uTime * 0.5 + lph) * p.y * 3.; p.y += 0.02 * sin(uTime * 0.6 + lph);` }), Math.max(1, flowers.length));
      flowers.forEach(([x, z, sc, rot], i) => { dummy.position.set(x, 0.06, z); dummy.rotation.set(0, rot, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); lily.setMatrixAt(i, dummy.matrix); });
      lily.name = 'lilies'; lily.frustumCulled = false; scene.add(lily); lilyGeo = lily.geometry;
    }
    await ctx.yield();

    // ---- cast skins floating like petals: pale medallions cut through to the ground, drifting downstream
    {
      const c = new Cutter().withExtra(4), sr = rng.fork('skins'), nS = Math.round(2300 * detail);
      for (let i = 0; i < nS; i++) {
        const s = sr.range(-50, 570), lat = sr.gauss() * 9, [x, z] = atLat(s, clamp(lat, -38, 38)), rot = sr.range(0, TAU), b = c.count;
        c.cur[0] = x; c.cur[1] = z; c.cur[2] = sr(); c.cur[3] = sr.range(0.17, 0.34);
        for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.v(Math.cos(rot) * u - Math.sin(rot) * v, 0, Math.sin(rot) * u + Math.cos(rot) * v, 0, 1, 0, u, v, 0);
        c.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
      // (p3 hall) the line runs low over the skin now: a cast skin is drawn in to nothing where its own place on the water comes
      // within 2.4 m of the flown line between 60 and 156 m of route (the line there as 24 chords; a law of the skin's place and
      // the line's place alone: it is 1 to the bit everywhere else, and nothing of it looks at the eye)
      const lineU = { value: [] }; { for (let m = 60; m <= 156; m += 4) lineU.value.push(route.posAtDist(m, new THREE.Vector3())); }
      const skins = new THREE.Mesh(c.finish({ extraName: 'aX' }), overlayMaterial(glass, {
        skins: 1, wobble: 0.01, veinHalf: 0.1, tints: [new THREE.Vector3(1.05, 1.05, 1.03), T.amber, T.amber],
        vertexDecl: 'attribute vec4 aX; uniform vec3 uLine[25];',
        vertexMove: /* glsl */`
          float fr = fract(uTime * 0.028 + aX.z), sc = sin(3.14159 * fr);
          { vec3 sp = vec3(aX.x, 0.035, aX.y + (0.5 - fr) * 25.); float ld = 1e9;
            for (int i = 0; i < 24; i++) { vec3 la = uLine[i], lb = uLine[i + 1] - la; ld = min(ld, length(sp - la - lb * clamp(dot(sp - la, lb) / dot(lb, lb), 0., 1.))); }
            sc *= smoothstep(2.4, 2.7, ld); }
          float tw = uTime * 0.12 * (aX.z - 0.5);
          p = vec3(aX.x + (p.x * cos(tw) - p.z * sin(tw)) * aX.w * sc, 0.035, aX.y + (0.5 - fr) * 25. + (p.x * sin(tw) + p.z * cos(tw)) * aX.w * sc);`,
        fragMod: 'float md = 1. - (vCut.x * vCut.x * 3.2 + vCut.y * vCut.y); if (md < 0.) discard; r = 0.03 + md * 0.4; wy = vCut.x * 3.;',
        fragPost: 'col = mix(g, max(g, uCitron), 0.6 + 0.3 * smoothstep(0.1, 0.5, md));' + WELL_SKIN + WELL_ABOVE }));   // (p3) and so is a cast skin
      skins.material.uniforms.uLine = lineU;
      skins.frustumCulled = false; skins.name = 'skins'; scene.add(skins);
    }
    await ctx.yield();

    // ---- five white storks on the sandbar: cut through to the ground, only wing tips, legs and bill left thick
    const storkSpots = [];
    {
      const c = new Cutter().withExtra(3), sr = rng.fork('storks');
      const flat = (from, r, fx, fz) => { for (let i = from; i < c.count; i++) { c.cut[i * 3] = r; c.cut[i * 3 + 1] = 9; c.cut[i * 3 + 2] = 0; c.nor[i * 3] = fx; c.nor[i * 3 + 1] = 0; c.nor[i * 3 + 2] = fz; } };
      for (let k = 0; k < 5; k++) {
        const su = 0.441 + k * 0.0095, sp = path.pointAt(su), st = path.tangentAt(su), jit = sr.range(-0.8, 0.8), sl = 4.6 + (k % 2) * 1.7 + sr.range(0, 0.8);
        const x = sp.x + st.z * sl + st.x * jit, z = sp.z - st.x * sl + st.z * jit, cc = courseAt(A.courseNearest(x, z), C);
        const dir = k % 3 === 1 ? -1 : 1, fx = cc.tx * dir, fz = cc.tz * dir, sx = -fz, sz = fx, S = sr.range(2.4, 2.8), ph = sr.range(0, TAU);
        const Pt = (f, y, l = 0) => [x + (fx * f + sx * l) * S, 0.05 + y * S, z + (fz * f + sz * l) * S];
        storkSpots.push(new THREE.Vector3(x, 0.9, z));
        const part = (w, r, fn) => { c.cur[0] = w; c.cur[1] = ph; c.cur[2] = 0; const b = c.count; fn(); flat(b, r, fx, fz); };
        part(0, 0.36, () => {   // long pale legs: the bird reads as a stork from far off
          c.tube([Pt(0.02, 0, 0.04), Pt(0.0, 0.3, 0.04), Pt(0.03, 0.58, 0.04)], 0.024 * S, 4); c.tube([Pt(0.1, 0, -0.04), Pt(0.12, 0.3, -0.04), Pt(0.06, 0.58, -0.04)], 0.024 * S, 4); });
        part(0, 0.32, () => { const p = Pt(0.02, 0.7); c.blob(p[0], p[1], p[2], (Math.abs(fx) * 0.19 + 0.13) * S, 0.165 * S, (Math.abs(fz) * 0.19 + 0.13) * S, k, 0.06, 8, 5); });
        part(0, 1, () => { const p = Pt(-0.19, 0.68); c.blob(p[0], p[1], p[2], (Math.abs(fx) * 0.08 + 0.16) * S, 0.115 * S, (Math.abs(fz) * 0.08 + 0.16) * S, k + 3, 0.05, 7, 4); });   // the dark flight feathers over the rear of the folded wing: what makes it a stork
        part(0.45, 0.32, () => c.tube([Pt(0.22, 0.74), Pt(0.3, 0.9)], [0.05 * S, 0.04 * S], 5));
        part(1, 0.32, () => { c.tube([Pt(0.3, 0.9), Pt(0.33, 1.06), Pt(0.4, 1.1)], [0.04 * S, 0.034 * S, 0.045 * S], 5); });
        part(1, 1, () => c.tube([Pt(0.42, 1.1), Pt(0.55, 1.07), Pt(0.68, 1.03)], [0.032 * S, 0.024 * S, 0.008 * S], 4));
      }
      const storks = new THREE.Mesh(c.finish({ extraName: 'aX' }), aboveMaterial(glass, {
        skins: 3, tints: [tp(T.amber, 0.7), tmul(T.amber, tp(T.aubergine, 0.6)), T.aubergine], wobble: 0.6, biteScale: 0.3, fragPost: CUT_THROUGH, vertexDecl: 'attribute vec3 aX;',   // flight feathers and bill a full aubergine, so they never melt into the amber bank behind
        vertexMove: /* glsl */`
          float sb = max(sin(uTime * 0.8 + aX.y), 0.), sb2 = sb * sb, sb4 = sb2 * sb2, stab = sb4 * sb4 * sb2;
          p += n * (sin(uTime * 0.22 + aX.y) * 0.5 + aX.x * (0.1 * sin(uTime * 0.9 + aX.y * 2.) + stab * 0.3));
          p.y -= aX.x * stab * 0.62 * (p.y - 0.05) ;` }));
      storks.frustumCulled = false; storks.name = 'storks'; scene.add(storks);
    }
    await ctx.yield();

    // ---- sand martins (or, in some casts, forty dragonflies) on lanes that overtake us, and ten more hunters
    function martinGeometry() {
      const c = new Cutter();
      c.tube([[0.075, 0, 0], [0.04, 0.004, 0], [-0.02, 0, 0], [-0.075, 0, 0]], [0.004, 0.019, 0.017, 0.003], 5, 9, 0);
      for (const sd of [-1, 1]) {
        const b = c.count;
        c.v(0.045, 0.004, sd * 0.012, 0, 1, 0, 0, 9, 0); c.v(0.0, 0.004, sd * 0.012, 0, 1, 0, 1, 9, 0); c.v(-0.035, 0.004, sd * 0.012, 0, 1, 0, 0, 9, 0);
        c.v(0.01, 0.004, sd * 0.085, 0, 1, 0, 0, 9, 0); c.v(-0.02, 0.004, sd * 0.085, 0, 1, 0, 0.8, 9, 0); c.v(-0.05, 0.004, sd * 0.085, 0, 1, 0, 0, 9, 0);
        c.v(-0.075, 0.004, sd * 0.16, 0, 1, 0, 0, 9, 0);
        c.idx.push(b, b + 1, b + 3, b + 1, b + 4, b + 3, b + 1, b + 2, b + 4, b + 2, b + 5, b + 4, b + 3, b + 4, b + 6, b + 4, b + 5, b + 6);
        const t = c.count; c.v(-0.06, 0, 0, 0, 1, 0, 0.8, 9, 0); c.v(-0.125, 0, sd * 0.03, 0, 1, 0, 0, 9, 0); c.v(-0.1, 0, 0, 0, 1, 0, 0, 9, 0); c.idx.push(t, t + 1, t + 2);
      }
      return c.finish();
    }
    const lr = rng.fork('lanes');
    const makeLanes = (n, v0, v1, nClose) => { const L = []; for (let i = 0; i < n; i++) { const close = i < nClose;
      L.push({ z: lr.range(0, 220), v: lr.range(v0, v1), lat: close ? lr.range(2.4, 5) * (i % 2 ? 1 : -1) : lr.range(-34, 30), y: close ? lr.range(-0.3, 1.5) : lr.range(1.5, 9), amp: close ? 0.8 : lr.range(2, 9), w: lr.range(0.25, 0.7), ph: lr.range(0, TAU), sc: lr.range(0.9, 1.2), close }); } return L; };
    const flocks = [];
    const addFlock = (geo, mat, n, v0, v1, nClose, sc) => {
      const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false; mesh.name = 'flock-' + flocks.length; scene.add(mesh);
      flocks.push({ mesh, lanes: makeLanes(n, v0, v1, nClose), sc });
    };
    if (!hunterCast) addFlock(martinGeometry(), aboveMaterial(glass, {
      skins: 3, biteScale: 5, wobble: 0.6, tints: [tp(T.amber, 0.8), tmul(T.amber, tp(T.aubergine, 0.4)), T.aubergine],
      vertexMove: 'if (cut.z < 0.5) { float mf = sin(uTime * 17. + float(gl_InstanceID) * 1.7); p.y += abs(p.z) * (mf * 0.75 + 0.2); p.z *= 1. - 0.25 * max(-mf, 0.); }' }), 60, 5.5, 9, 16, 1.8);
    {
      addFlock(dragonflyGeometry(), aboveMaterial(glass, dragonflyStyle(glass)), hunterCast ? 40 : 10, 7.5, 11, hunterCast ? 12 : 4, 1.7);
    }
    await ctx.yield();

    // ---- the rare visitor: a white-tailed eagle, cut through to the ground with thick wing tips ---------
    let eagle = null;
    if (rare) {
      const c = new Cutter().withExtra(1);
      c.cur[0] = 0; c.tube([[0.42, 0.02, 0], [0.3, 0.03, 0], [0, 0, 0], [-0.3, 0, 0]], [0.02, 0.085, 0.15, 0.07], 6);
      for (let i = 0; i < c.count; i++) { c.cut[i * 3] = 0.3; c.cut[i * 3 + 2] = 0; }
      { const b = c.count; for (const [x, z, r] of [[-0.25, 0, 0.32], [-0.62, 0.2, 0.05], [-0.66, 0, 0.3], [-0.62, -0.2, 0.05]]) c.v(x, 0, z, 0, 1, 0, r, 9, 0); c.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      for (const sd of [-1, 1]) {
        const b = c.count, n = 6;
        for (let i = 0; i <= n; i++) {
          const f = i / n, z = sd * (0.1 + 1.05 * f), ch = 0.46 * (1 - 0.3 * f * f), x0 = 0.16 - 0.05 * f, tipR = f > 0.6 ? 1 : 0.32;
          c.cur[0] = f;
          c.v(x0, 0, z, 0, 1, 0, f > 0.6 ? 0.7 : 0.06, 9, 0); c.v(x0 - ch * 0.45, 0, z, 0, 1, 0, tipR, 9, 0); c.v(x0 - ch + (i % 2) * 0.09 * f, 0, z, 0, 1, 0, f > 0.6 ? 0.7 : 0.06, 9, 0);
          if (i < n) { const a = b + i * 3; c.idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3, a + 1, a + 2, a + 4, a + 2, a + 5, a + 4); }
        }
      }
      eagle = new THREE.Mesh(c.finish({ extraName: 'aF' }), aboveMaterial(glass, {
        skins: 3, tints: PALE, wobble: 2.5, biteScale: 0.3, fragPost: CUT_THROUGH, vertexDecl: 'attribute float aF;',
        vertexMove: 'float ef = sin(uTime * 2.6); p.y += aF * aF * (0.42 * ef + 0.12) + aF * 0.1 * ef;' }));
      eagle.frustumCulled = false; eagle.name = 'eagle'; scene.add(eagle);
    }

    // ---- the exit frame: the black poplar fallen bank to bank over the side channel, bowed into a round ----
    {
      const c = new Cutter(), fr = rng.fork('frame'), px = ex.tz, pz = -ex.tx, cx = seat.x - ex.tx * 0.6, cz = seat.z - ex.tz * 0.6, R = 8.9;
      const pt = (l, y, t = 0) => [cx + px * l + ex.tx * t, y, cz + pz * l + ex.tz * t];
      const arc = [], rad = [];
      for (let i = 0; i <= 16; i++) { const th = (205 - i * 13.6) * Math.PI / 180; arc.push(pt(Math.cos(th) * R * 1.04, 4 + Math.sin(th) * R, Math.sin(i * 1.3) * 0.25)); rad.push(1.0 - 0.036 * i + 0.1 * Math.sin(i * 2.1)); }
      c.tube(arc, rad, 9, 0.5, 0.31);
      for (let k = 0; k < 4; k++) { const p = pt(-R * 1.04 - 0.3 + fr.range(-1.2, 1.2), 0.2 + fr.range(0, 2), fr.range(-1.5, 1.5)); const rb = fr.range(1.3, 2.1); c.crown(p[0], p[1] + rb * 0.9, p[2], rb, -0.4, k * 3.1, 10, 4); }
      for (const [i0, len, lean] of [[4, 5.5, -0.5], [7, 6.5, 0.15], [10, 5, 0.5], [12, 3.6, 0.8]]) { // dead boughs standing up from the trunk
        const a = arc[i0], l0 = lean * len;
        c.tube([a, [a[0] + px * l0 * 0.4, a[1] + len * 0.55, a[2] + pz * l0 * 0.4], [a[0] + px * l0, a[1] + len, a[2] + pz * l0]], [0.34, 0.2, 0.06], 5, 0.5, 0.31);
      }
      const frame = new THREE.Mesh(c.finish({ smooth: true }), trees.material);
      frame.frustumCulled = false; frame.name = 'exit-frame'; scene.add(frame);
    }
    await ctx.yield();

    // ---- the medallion: round the portal the dark wall is cut right through to the ground, a pale round with a
    //      wandering bitten edge (the cut the workshop used for storks and skins), so the way out shows from the
    //      bend as a clean pale round in the outer willow wall
    {
      const c = new Cutter(), px = ex.tz, pz = -ex.tx, mx = seat.x + ex.tx * 0.9, mz = seat.z + ex.tz * 0.9, N = 56;
      for (let i = 0; i <= N; i++) {
        const th = i / N * TAU, co = Math.cos(th), si = Math.sin(th), ro = 12.0 + 0.55 * Math.sin(th * 3 + 1.1) + 0.35 * Math.sin(th * 7 + 0.4) + 0.25 * Math.sin(th * 13);
        for (const [rad, rel] of [[5.8, 1], [ro - 1.1, 0.5], [ro, 0]]) c.v(mx + px * co * rad, seat.y + si * rad, mz + pz * co * rad, -ex.tx, 0, -ex.tz, rel, 9, 0);
        if (i < N) { const b = i * 3; c.idx.push(b, b + 1, b + 3, b + 1, b + 4, b + 3, b + 1, b + 2, b + 4, b + 2, b + 5, b + 4); }
      }
      const medal = new THREE.Mesh(c.finish(), aboveMaterial(glass, {
        skins: 1, wobble: 0.6, tints: [new THREE.Vector3(1.04, 1.04, 1.02), T.amber, T.amber],
        fragMod: 'float mr = vCut.x; r = 0.03 + mr * 0.6; wy = 9.;',
        fragPost: 'col = mix(g * mix(uT2, vec3(1.), 0.35), mix(g, max(g, uCitron), 0.8) * (0.975 + 0.04 * wob), smoothstep(0.0, 0.16, mr + (wob - 0.5) * 0.1));' }));
      medal.frustumCulled = false; medal.name = 'medallion'; scene.add(medal);
    }
    await ctx.yield();

    // ---- the mount: we are a mayfly. Two long forelegs reach ahead at the foot of the frame, and a blur
    //      of foil-flecked wing beats in the top corners. Everything carried with the camera is in `carried`.
    const carried = new THREE.Group(); carried.name = 'carried'; scene.add(carried);
    let legsMesh = null; const legsFold = { value: 0 };   // (p3 hall2) FOLD: 0 = the legs as ever, 1 = drawn back under the body
    const wingBlurMat = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { ...GU, uAway: { value: 1 } },   // (p3) uAway: 1 as ever, 0 while the flight is under the water (no wings beat there)
      vertexShader: 'varying vec2 vQ; void main(){ vQ = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: /* glsl */`
        ${GLASS_GLSL} varying vec2 vQ; uniform float uAway;
        void main(){
          // vQ: x 0 at the inner edge .. 1 at the frame's corner, y 0 bottom .. 1 top
          float beat = 0.5 + 0.5 * sin(uTime * 23.);
          float reach = vQ.x * 0.75 + vQ.y * 0.65 - 0.52 - 0.1 * beat;
          float a = smoothstep(0., 0.5, reach);
          vec2 st = vec2(atan(1.15 - vQ.y, 1.2 - vQ.x) * 5., length(vec2(1.2 - vQ.x, 1.15 - vQ.y)) * 9.);
          float streak = gNoise(vec2(st.x * 2.2, st.y * 0.7 - uTime * 2.6)) * 0.6 + gNoise(vec2(st.x * 5.1, st.y * 1.3 + uTime * 3.4)) * 0.4;
          float foil = smoothstep(0.66, 0.8, streak);
          vec3 col = mix(mix(uHoney, uCitron, 0.3), mix(uHoney, uFoil, 0.4 + 0.6 * beat), foil);
          gl_FragColor = vec4(col, a * (0.04 + 0.5 * foil) * uAway);   // only the foil streaks of our own wings: no veil over the corners
        }`,
    });
    {
      const c = new Cutter();
      for (const sd of [-1, 1]) {
        const b = c.count;
        c.tube([[sd * 0.06, -0.14, 0.02], [sd * 0.122, -0.104, -0.14], [sd * 0.14, -0.118, -0.27], [sd * 0.118, -0.132, -0.38], [sd * 0.108, -0.124, -0.44]], [0.0034, 0.0029, 0.0024, 0.0019, 0.0009], 6);
        for (let i = b; i < c.count; i++) c.cut[i * 3 + 1] = Math.cos(((i - b) % 6) / 6 * TAU + 0.5 + sd * 0.6);   // one wheel-cut line along the leg
      }
      const legs = new THREE.Mesh(c.finish(), overlayMaterial(glass, {
        skins: 2, biteScale: 30, veinHalf: 0.16, wobble: 0, tints: [tp(T.amber, 0.4), tp(T.amber, 0.7), T.amber],
        vertexDecl: 'uniform float uFold;', uniforms: { uFold: legsFold },
        vertexMove: 'float lk = -p.z * 2.2; p.y += lk * lk * 0.012 * sin(uTime * 2.3 + p.x * 40.); p.x += lk * lk * 0.008 * sin(uTime * 1.7 + 1.); p.z += uFold * 0.5; p.y -= uFold * 0.06;' }));   // (p3 hall2) drawn back along the body, behind the eye, by FOLD
      legs.frustumCulled = false; legs.name = 'legs'; carried.add(legs); legsMesh = legs;
      for (const sd of [-1, 1]) {
        const g = new THREE.PlaneGeometry(0.13, 0.085), q = new THREE.Mesh(g, wingBlurMat);
        if (sd < 0) { const uvA = g.attributes.uv; for (let i = 0; i < uvA.count; i++) uvA.setX(i, 1 - uvA.getX(i)); }
        q.position.set(sd * 0.203, 0.107, -0.25); q.frustumCulled = false; q.renderOrder = 20; q.name = 'wing-blur'; carried.add(q);
      }
    }
    await ctx.yield();

    // ---- (p3) BELOW THE SKIN: THE HALL. A closed basin under the water where the route goes down (lofted like the banks, in the
    //      bluff's bedded cut, burrow rounds on its port wall), the skin again as its ceiling, and the hall planted in it: a
    //      colonnade of ribbed lily stems, the pads' discs seen from beneath, one great lotus with twelve small ones hanging
    //      under the skin toward the sun's road, and double chains of nymphs climbing from the bed to the skin (ten now).
    //      (p3 hall2) THE SECOND ROUND: the walls stepped in three cut layers with the bank's roots hanging from the shelf in
    //      fringes; the burrow rounds gathered into five colonies; the bed lit by the ceiling's hammered light and set with
    //      sunken leaves, drifts' ridges, great mussel halves (and, then, the shade rounds of the discs: gone in the third round); the great lotus turned and given
    //      its own room; the nave's end a garden (a second flowering of six lotus, two more double chains, the colonnade and
    //      the discs run on to the tub's end, a thicket and shore mounds where the squared end wall was); one shoal. Everything
    //      stands over the hall's ground (hallGround in the part). No sight line that starts under the skin inside the basin ends
    //      anywhere but on the basin, on the ceiling or on what stands in it. From above all of it shows only through the well
    //      (WELL_UNDER), the ceiling never (BackSide).
    //      (p3 hall3) THE THIRD ROUND: the ceiling a sheet of moving cut light (a net of ripple lines in one typed set of tones); fourteen
    //      slanted shafts of cut light from gaps between the discs down to the bed; the two ends planted (78 to 94 m and 120 to
    //      137 m of route: twelve more great stems, root curtains in two tiers, a garland more in each, strings of rising beads of
    //      air); the line deeper (2.0 m under the skin from 87 to 127 m) and the gaze turned down along the two ends (END_LOOK);
    //      NO SHADE ROUNDS on the bed, and one net of light on it instead of the hammered patches; the great lotus and the lesser
    //      ones a rosette of broad petals; the starboard wall beside the great lotus planted; the shoal twelve great fish, to port
    //      of the line; the discs and the two pads eight-sided; the hall shown by progress. All of it dealt from one more fork
    //      of the hall's own stream (h3, 'ends'), taken after everything the second round deals from the hall's stream before it.
    //      DEALT from a stream of its own, forked from the world's stream HERE, after everything live deals (one draw, the last
    //      the world makes): nothing live deals moves by it (hall/prints/same-deal-*.txt).
    //      CLEAR AIR by place, from lineD (the flown line's own points): stems and roots 2.6 m, chains 3.0 m, discs, lotus,
    //      mussels, shafts and beads 2.2 m as drawn (2.0 m by their true triangles), the shoal 3.0 m, sways at their widest
    //      included; the bed and its forms 2.0 m and more under the line (hall3/prints/clear-*.txt, lists-*.txt).
    const hl = rng.fork('hall'), hg = hl.fork('garden'), lampAt = [54, 424];   // (p3 hall2) the garden, the bed's forms and the shoal are dealt from a fork of the hall's own stream; lampAt: the lamp's foot, a place in the world (update turns the sun's bearing to it)
    const roadU = (() => { const kn = ROAD_AT, rdx = lampAt[0] - kn[0], rdz = lampAt[1] - kn[1], rl = Math.hypot(rdx, rdz); return { value: new THREE.Vector4(kn[0], kn[1], rdz / rl, -rdx / rl) }; })();   // (p3 hall3) THE SUN'S ROAD on the skin: the straight line from the lamp's foot over the hall's middle (a place of the world: x -8.8, z 102.8); xy = a point of it, zw = its normal
    // the hall's tone: a skin never comes out darker on the screen than luma 46 over the hall's deepest ground (the plum of the
    // foot: rose with two fifths of aubergine); where a pigment would (the thunder edition's most of all), it is cut thinner. Only
    // the heart of a stem is left its full aubergine.
    const sR = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055), plum = rose0.clone().lerp(GU.uAub.value, 0.4);
    const lumaOn = (t, k) => 255 * (0.2126 * sR(plum.r * Math.pow(t.x, k)) + 0.7152 * sR(plum.g * Math.pow(t.y, k)) + 0.0722 * sR(plum.b * Math.pow(t.z, k)));
    const lit = (t, min = 46) => { if (lumaOn(t, 1) >= min) return t; let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (lumaOn(t, m) >= min) a = m; else b = m; } return tp(t, a); };
    const underMat = (o) => overlayMaterial(glass, { ...o, ground: 'hallGround', fragPost: (o.fragPost || '') + WELL_UNDER });
    // the basin's section: [metres in from the lip, share of the bed's depth there]: steep under the skin, easing into the bed
    // (p3 hall2) THE BASIN'S SECTION, each side: the lip at the skin; under it the bank's overhang runs in to the wall's FACE (whose
    // place wanders along the wall: faceIn, a law of z), and from the face the wall goes down in THREE CUT LAYERS: the upper clay
    // face, a ledge, the second face, a second ledge, the foot and its talus easing into the bed.
    const SEC = [[0, 0.03], [0.18, 0.30], [0.95, 0.34], [1.15, 0.62], [2.0, 0.66], [2.3, 0.90], [3.5, 1]];   // [metres in from the face, share of the bed's depth there]
    const wav = (z, a, b, c, d) => 0.5 + 0.5 * Math.sin(z * a + b) * Math.sin(z * c + d);
    const faceIn = (side, z) => { const ends = sstep(TUB.z0, TUB.z0 + 8, z) * (1 - sstep(TUB.z1 - 8, TUB.z1, z));   // how far under the bank the wall's face stands
      return (side < 0 ? 0.25 + 2.2 * wav(z, 0.41, 1.3, 0.071, 0.4) : clamp(tubB(z) - lineX(z) - 8.4, 0, 1.8) * (0.15 + 0.85 * wav(z, 0.37, 0.7, 0.083, 2.9))) * ends; };
    // one side's section at z, from the lip inward: [metres in from the lip, height] (drawn together where the basin is narrow)
    const secAt = (side, z) => { const d = bedY(z), F = faceIn(side, z), k = Math.min(1, ((tubB(z) - tubA(z)) / 2 - 0.3) / (F + 3.5)), P = [[0, TUB.lap]];
      for (const q of SEC) P.push([(F + q[0]) * k, Math.min(TUB.lap, d * q[1])]); return P; };
    // the stations (2 m apart) and the section BETWEEN them as the tub's own rows have it (each point of the section drawn straight from one station to the next)
    const STN = []; for (let z = TUB.z0; z <= TUB.z1 + 1e-6; z += 2) STN.push([z, tubA(z), secAt(-1, z), tubB(z), secAt(1, z)]);
    const secX = (side, z) => { const f = clamp((z - TUB.z0) / 2, 0, STN.length - 1.000001), i = Math.floor(f), t = f - i, A = STN[i], B = STN[i + 1], k = side < 0 ? 1 : 3;   // [x, height] from the lip inward
      return A[k + 1].map((q, j) => { const qb = B[k + 1][j], xa = A[k] - side * q[0], xb = B[k] - side * qb[0]; return [xa + (xb - xa) * t, q[1] + (qb[1] - q[1]) * t]; }); };
    const secH = (P, side, x) => { const o = (x - P[0][0]) * -side; if (o <= 0) return TUB.lap; let i = 1; while (i < P.length - 1 && (P[i][0] - P[0][0]) * -side < o) i++; const a = P[i - 1], b = P[i], oa = (a[0] - P[0][0]) * -side, ob = (b[0] - P[0][0]) * -side; return o >= ob ? b[1] : a[1] + (b[1] - a[1]) * (o - oa) / Math.max(ob - oa, 1e-6); };
    const tubY = (x, z) => Math.max(secH(secX(-1, z), -1, x), secH(secX(1, z), 1, x));
    const onBed = (x, z, m = 0) => x > secX(-1, z)[7][0] + m && x < secX(1, z)[7][0] - m;   // on the flat of the bed, m metres clear of both walls' feet
    let ceiling;
    // THE TUB (p3 hall2): ONE Cutter, finished after the hall is dealt (the bed's drifts, mussels and shore are cut in
    // the same glass). Rows of the section at stations 2 m apart, each band of the section with rows of its own, so that a layer
    // ends in a hard edge. cut.x = 2 * layer + the relief within the layer (layer 0: the overhang and the upper face; 1: the first
    // ledge and the second face; 2: the second ledge, the foot, the bed and what lies on it); cut.y = the height (the beds' wheel
    // lines); aS = (0, 0, 1 where no light of the ceiling falls: a mussel)
    const ctub = new Cutter().withExtra(3); let tubX0 = 1e9, tubX1 = -1e9;
    {
      const BANDS = [[0, 1, 0, 0, 0.5], [1, 2, 0, 0.5, 0.5], [2, 3, 1, 0.6, 0], [3, 4, 1, 0.5, 0.5], [4, 5, 2, 1.0, 0], [5, 6, 2, 0.93, 0.93], [6, 7, 2, 0.93, 1.04]];   // [from, to (points of the section), layer, relief at each]: a ledge's relief falls to 0 at its nosing (the pale cut rim)
      const NB = BANDS.length * 2, NS = NB * 2; let n = 0;
      for (const [z, a, PA, b, PB] of STN) { n++;
        for (const side of [-1, 1]) { const P = side < 0 ? PA : PB;
          for (const [i0, i1, lay, r0, r1] of BANDS) for (const [i, r] of [[i0, r0], [i1, r1]]) ctub.v(side < 0 ? a + P[i][0] : b - P[i][0], P[i][1], z, 0, 1, 0, 2 * lay + r, P[i][1], 0); }
        tubX0 = Math.min(tubX0, a); tubX1 = Math.max(tubX1, b);
      }
      for (let i = 0; i < n - 1; i++) { const s0 = i * NS, s1 = s0 + NS;
        for (let k = 0; k < NS; k += 2) ctub.idx.push(s0 + k, s0 + k + 1, s1 + k, s0 + k + 1, s1 + k + 1, s1 + k);
        ctub.idx.push(s0 + NB - 1, s0 + NS - 1, s1 + NB - 1, s0 + NS - 1, s1 + NS - 1, s1 + NB - 1); }   // the bed, from talus to talus
      await ctx.yield();
      // THE BURROWS (p3 hall2): where the nymphs lived in the clay. FIVE COLONIES on the port wall's upper face, from z 80 to z 128:
      // each a field of 20 to 30 pale rounds (the martin holes' recipe) gathered on a darker ground with a pale cut rim, and none
      // loose between them. A place on the face: faceA(z, t), t 0 at the face's top to 1 at its foot, taken between the stations
      // as the wall's own rows are
      const cb = new Cutter(), colonies = [];
      const faceA = (z, t, lift) => { const P = secX(-1, z), dx = P[2][0] - P[1][0], dy = P[2][1] - P[1][1], dl = Math.hypot(dx, dy) || 1;
        return [P[1][0] + dx * t - dy / dl * lift, P[1][1] + dy * t + dx / dl * lift, z, -dy / dl, dx / dl]; };   // lifted off the face along its normal (which looks into the hall)
      for (let i = 0; i < 5; i++) {
        const zc = 81 + i * 11.6 + hl.range(-1.5, 1.5), half = hl.range(2.0, 2.6), th = hl.range(0.43, 0.47), ph = hl.range(0, TAU), nR = 22 + Math.floor(hl() * 8), b = cb.count;
        const edge = (a) => 1 + 0.16 * Math.sin(a * 3 + ph) + 0.09 * Math.sin(a * 5 + ph * 2.3);   // the ground's wandering outline, in its own radii
        { const q = faceA(zc, 0.5, 0.05); cb.v(q[0], q[1], q[2], q[3], q[4], 0, 1, 0, 0.25); }
        for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, e = edge(a), q = faceA(zc + Math.cos(a) * half * e, clamp(0.5 + Math.sin(a) * th * e, 0.02, 0.98), 0.05); cb.v(q[0], q[1], q[2], q[3], q[4], 0, 0, 0, 0.25); }
        for (let k = 0; k < 14; k++) cb.idx.push(b, b + 1 + k, b + 1 + (k + 1) % 14);
        const got = [];
        for (let tries = 0; got.length < nR && tries < 4000; tries++) {
          const a = hl.range(0, TAU), rr = Math.sqrt(hl()) * 0.86, rad = hl.range(0.085, 0.15), dz = Math.cos(a) * half * rr * edge(a), dt = Math.sin(a) * th * rr * edge(a);
          if (got.some((g) => Math.hypot((g[0] - dz) / 1.2, (g[1] - dt) * 1.4) < g[2] + rad + 0.03)) continue;   // (dt is in shares of a face 1.4 m tall; a round is 1.2 times as long as tall)
          got.push([dz, dt, rad]);
          const c0 = faceA(zc + dz, 0.5 + dt, 0.09), up = faceA(zc + dz, 0.5 + dt - 0.1, 0.09), ul = Math.hypot(up[0] - c0[0], up[1] - c0[1]) || 1, ux = (up[0] - c0[0]) / ul, uy = (up[1] - c0[1]) / ul, b2 = cb.count;
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cb.v(c0[0] + ux * v * rad, c0[1] + uy * v * rad, c0[2] + u * rad * 1.2, c0[3], c0[4], 0, u, v, 0);
          cb.idx.push(b2, b2 + 1, b2 + 2, b2, b2 + 2, b2 + 3);
        }
        colonies.push([zc, got.length]);
      }
      const burrows = new THREE.Mesh(cb.finish(), underMat({
        skins: 1, tints: [new THREE.Vector3(1.04, 1.04, 1.02), lit(T.amber), lit(tp(T.aubergine, 0.5))], wobble: 0.01,
        // cut.z 0: a round (cut.xy its own (u, v)); cut.z 0.25: a colony's ground (cut.x its relief, 0 at the outline)
        fragMod: 'float gk = step(0.1, vCut.z); float md = mix(1. - dot(vCut.xy, vCut.xy), vCut.x, gk); if (md < 0.) discard; float fmd = fwidth(md); r = 0.02 + md * 0.4; wy = 9.;',
        fragPost: 'vec3 brim = mix(g, max(g, uCitron), 0.6); col = mix(mix(g * uT2, brim, smoothstep(0.0, 0.35, md)), mix(brim, g * uT3, aaStep(0.13, md, fmd)), gk);' }));
      burrows.name = 'burrows'; burrows.frustumCulled = false; burrows.userData.colonies = colonies; scene.add(burrows);
      await ctx.yield();
      // THE CEILING: the water's plane again over the whole plan (and 2 m beyond), seen from beneath, writing depth. (p3 hall3) A SHEET
      // OF MOVING CUT LIGHT in a glass of its own: a bold net of ripple lines in two tones (skinNet: the net's cells widen with the
      // distance, in the skin's own plane, from the route's own point, so that it reads at a grazing angle 40 m ahead as it does
      // overhead; no lens and no eye in it) on a ground one clear step away, bolder along the sun's road, drifting on the water's
      // own flow and the world's clock; its tones are ONE TYPED SET (SKIN_TONES). The water's answer to the round (two pale rings)
      // as the water has it; not drawn inside the well; shown only while the hall is (update). Laid in panes 2 m by a fifth of its width:
      // two great triangles put the skin's own reckoning of the round a pixel off the reckoning of the things seen through it
      // (trial: 113 pixels of blank at the round's lower rim, 134.6 m)
      const ceilMat = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { ...GU, uFlow: waterMat.uniforms.uFlow, uRoad: roadU, uAmberT: { value: T.amber } }, vertexShader: waterMat.vertexShader,
        fragmentShader: /* glsl */`
        ${GLASS_GLSL} ${NET_GLSL} varying vec3 vWpos; uniform vec2 uFlow; uniform vec4 uRoad; uniform vec3 uAmberT;
        void main(){
          vec2 q = vWpos.xz - uFlow * uTime, fw = vec2(fwidth(vWpos.x), fwidth(vWpos.z));   // the net drifts with the water's own flow
          float D = length(vWpos.xz - uWell.xz);                                            // metres in the skin's plane from the route's own point
          float road = 1. - smoothstep(2.5, 9., abs(dot(vWpos.xz - uRoad.xy, uRoad.zw)));   // the sun's road on the skin (a line of the world): the net is bolder along it
          vec3 col = ${SKIN_TONES.ground};
          float nb = skinNet(q * 0.61 + 31.7, D, fw * 0.61, ${SKIN_TONES.netW[1].toFixed(3)}, uTime * 0.5, 3.1);
          float na = skinNet(q, D, fw, ${SKIN_TONES.netW[0].toFixed(3)} * (1. + 0.7 * road), uTime * 0.8, 0.);
          col = mix(col, ${SKIN_TONES.netB}, nb); col = mix(col, ${SKIN_TONES.netA}, na);
          // THE WATER'S ANSWER TO THE ROUND, from beneath: two pale rings spreading from the bitten rim on the water's own clock (the water's own law)
          { float fwp = max(fw.x, fw.y), wn = uWell.w + (gNoise(vWpos.xz * 2.3) - 0.5) * 0.16, wb2 = wn * wn - uWell.y * uWell.y;
            float wd = D - sqrt(max(wb2, 0.)), ww = max(0.014, 1.3 * fwp);
            float l1 = fract(uTime * 0.27), l2 = fract(uTime * 0.27 + 0.5);
            float wring = (1. - smoothstep(ww * 0.5, ww, abs(wd - 0.04 - 0.5 * l1))) * (1. - l1) + (1. - smoothstep(ww * 0.5, ww, abs(wd - 0.04 - 0.5 * l2))) * (1. - l2);
            wring *= step(1e-4, uWell.w) * step(0., wb2) * (1. - smoothstep(0.25, 0.7, fwp));
            col = mix(col, max(col, uCitron), clamp(wring, 0., 1.) * 0.9); }
          ${WELL_SKIN}
          gl_FragColor = vec4(col, 1.);
        }` });
      const cg = new THREE.BufferGeometry(), X0 = tubX0 - 2, X1 = tubX1 + 2, Z0 = TUB.z0 - 2, cp = [], ci = [], NZ = 52, NX = 5;
      for (let j = 0; j <= NZ; j++) for (let k = 0; k <= NX; k++) cp.push(X0 + (X1 - X0) * k / NX, 0, Z0 + j * 104 / NZ);
      for (let j = 0; j < NZ; j++) for (let k = 0; k < NX; k++) { const a = j * (NX + 1) + k; ci.push(a, a + NX + 1, a + 1, a + 1, a + NX + 1, a + NX + 2); }   // facing up, at y 0 to the bit
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci);
      ceiling = new THREE.Mesh(cg, ceilMat); ceiling.name = 'ceiling'; ceiling.frustumCulled = false; ceiling.visible = false; scene.add(ceiling);
    }
    await ctx.yield();
    // ---- THE HALL, DEALT (places first, then the meshes). The colonnade: 36 great stems 3 to 5 m either side of the line, each
    //      rising in a slow S from the bed to its pad's disc at the skin (or, where the line is too near the skin for a disc,
    //      ending under it as a shoot); the great lotus hangs at the head of one of them.
    // (p3 hall2) THE GREAT LOTUS, by its place in the world: 6 m to starboard of the route's own point at 119 m of route, its heart 2.0 m
    // under the skin (level with the line there) at the head of its stem, and TURNED: it nods, opening down toward the bed, back down
    // the nave and toward the line (LOTUS_AX), so that we come up to it seen from the side and a little from within, a cup with depth,
    // pass it level and leave it in profile.
    const LOTUS_Y = -1.9, LOTUS_AX = new THREE.Vector3(-0.5, -0.6, -0.62).normalize();
    const LOTUS = (() => { const p = route.posAtDist(119), t = route.tangentAtDist(119), tl = Math.hypot(t.x, t.z) || 1; return [p.x + t.z / tl * 6, p.z - t.x / tl * 6]; })();
    // (p3 hall2) the lotus's own room: the plan between the line from 99 to 121.5 m of route and the flower stands free of stems and of
    // lesser lotus, so that nothing bars it while we come up to it (a keep-out by place, like the clear air's)
    const lotusWedge = (() => { const P = (m, o) => { const p = route.posAtDist(m), t = route.tangentAtDist(m), tl = Math.hypot(t.x, t.z) || 1; return [p.x + t.z / tl * o, p.z - t.x / tl * o]; }, Q = [P(99, 0.5), P(121.5, 0.5), P(121.5, 7.4), P(116, 7.4)];
      return (x, z) => { let s = 0; for (let i = 0; i < 4; i++) { const a = Q[i], b = Q[(i + 1) % 4], c = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); if (c > 0) s |= 1; else if (c < 0) s |= 2; } return s !== 3; }; })();
    const STEM_SWAY = 0.18, SWAYMAX = STEM_SWAY * Math.hypot(1, 0.8);   // the sway's widest reach, in metres (vertexMove below)
    const discs = [], lotus = [], gStems = [], lStems = [], wellPads = [], chains = [];
    const inHall = (x, z, m) => z > 62 && z < 156 && x > tubA(z) + m && x < tubB(z) - m;   // (p3 hall2) on to the tub's end (was z 150)
    const OCT = Array.from({ length: 8 }, (_, k) => [Math.cos((k + 0.5) * Math.PI / 4) * 1.0722, Math.sin((k + 0.5) * Math.PI / 4) * 1.0722]);   // (p3 hall3) the eight corners of a disc's body, in half-widths
    const discClear = (x, z, sz) => lineD(x, -0.06, z) - 0.9906 * sz >= 2.22;   // the round cut in the quad reaches 0.9906 of its half-width
    const discFree = (x, z, sz, k = 0.8) => !discs.some((q) => Math.hypot(q[0] - x, q[1] - z) < k * (q[2] + sz));
    const stemAt = (foot, top, bow, r0, taper) => (f) => { const g = f * f * (3 - 2 * f), w = Math.sin(f * Math.PI) * bow; return [foot[0] + (top[0] - foot[0]) * g, foot[1] + (top[1] - foot[1]) * f, foot[2] + (top[2] - foot[2]) * g + w, r0 * (1 - taper * f)]; };
    const stemClear = (sp) => { for (let k = 0; k <= 16; k++) { const f = k / 16, q = sp(f); if (lineD(q[0], q[1], q[2]) - q[3] * 1.2 - SWAYMAX * Math.sin(f * Math.PI) < 2.66) return false; } return true; };
    // a pad on the skin beside each place where the line goes through it, to the open water's side (2.2 m and more of clear
    // air), and its disc under it: 3.5 m BEFORE the first touch, where we still look down on it as the round opens beside it;
    // 3 m beyond the second. The one thing there that says how large the round is. Dealt first, so that it has its place
    // before the colonnade's discs take theirs
    { const v = new THREE.Vector3();
      touches.forEach((q, k) => {
        const sz = hl.range(0.75, 0.95), rot = hl.range(0, TAU), sd = hl(); route.tangentAtDist(q.m, v); const tl = Math.hypot(v.x, v.z) || 1, tx = v.x / tl, tz = v.z / tl, side = 1, along = k ? 3 : -3.5;
        for (let lat = 1.6 + sz; lat < 6; lat += 0.1) { const x = q.x + tx * along + tz * side * lat, z = q.z + tz * along - tx * side * lat; if (lineD(x, 0.075, z) - (0.9906 * sz + 0.06) < 2.22 || !discFree(x, z, sz)) continue; wellPads.push([x, z, sz, rot, sd]); discs.push([x, z, sz, rot]); break; }
      }); }
    { const lot = Math.round((116.6 - 66) / (84 / 36));   // the stem that carries the great lotus (the one whose turn falls nearest z 117 on the starboard side)
      for (let i = 0; i < 36; i++) {
        const isLot = i === lot + (lot % 2 ? 0 : 1); let side = i % 2 ? 1 : -1, off = hl.range(3.0, 5.0);
        const zf = isLot ? LOTUS[1] - 0.6 : 66 + (i + hl.range(0.15, 0.85)) * (84 / 36), lz = hl.range(-1.2, 1.2), lx = hl.range(0, 0.8), bow = hl.range(-0.35, 0.35), r0 = hl.range(0.11, 0.18), sz0 = hl.range(1.05, 2.1), rise = hl.range(0.4, 1.2), ph = hl.range(0, TAU);
        let done = false;
        for (let tries = 0; tries < 14 && !done; tries++, off += 0.3) {
          let xf = lineX(zf) + side * off;
          if (!isLot && lotusWedge(xf, zf)) { side = -1; xf = lineX(zf) - off; }   // (p3 hall2) out of the lotus's room: it stands to port instead
          if (!isLot && (xf < tubA(zf) + 0.5 || xf > tubB(zf) - 0.5)) { side = -side; xf = lineX(zf) + side * off; if (xf < tubA(zf) + 0.5 || xf > tubB(zf) - 0.5) continue; }
          const foot = isLot ? [LOTUS[0] + 1.3, tubY(LOTUS[0] + 1.3, LOTUS[1] + 0.9) - 0.3, LOTUS[1] + 0.9] : [xf, tubY(xf, zf) - 0.3, zf]; let top = isLot ? [LOTUS[0] - LOTUS_AX.x * 0.1, LOTUS_Y - LOTUS_AX.y * 0.1, LOTUS[1] - LOTUS_AX.z * 0.1] : [xf + side * lx, -0.07, zf + lz], sz = isLot ? 2.12 : sz0, shoot = isLot;   // (p3 hall2) the lotus's stem ends at its flower, under no disc
          if (!isLot) { while (sz > 0.55 && !(discClear(top[0], top[2], sz) && discFree(top[0], top[2], sz, 0.7))) sz -= 0.25; if (!(sz > 0.55 && inHall(top[0], top[2], sz + 0.1))) { shoot = true; top = [top[0], -rise, top[2]]; } }
          const sp = stemAt(foot, top, bow, r0, isLot ? 0.4 : shoot ? 0.85 : 0.4);
          if (!stemClear(sp)) continue;
          gStems.push({ sp, ph, great: true }); if (!shoot) discs.push([top[0], top[2], sz, hl.range(0, TAU)]); else hl();
          done = true;
        }
      } }
    const nG = discs.length;   // the two pads' discs and the great stems' own come first
    await ctx.yield();
    // the lotus: one 3.2 m across at the plan's place, and twelve small ones in a loose drift round it and back along the way
    // we come, where the sun's road lies on the ceiling as we near it; each hangs under a disc of its own
    lotus.push([LOTUS[0], LOTUS[1], 3.2 / 0.632, hl.range(0, TAU), LOTUS_Y, LOTUS_AX]);
    { const PR = [0.16, 0.3, 0.36, 0.3, 0.1];   // its seed head: a ribbed body in the flower's heart, 0.9 m long (a flower with thickness from every side); it stands still (aK.x 1)
      gStems.push({ sp: (f) => [LOTUS[0] + LOTUS_AX.x * (-0.12 + 0.9 * f), LOTUS_Y + LOTUS_AX.y * (-0.12 + 0.9 * f), LOTUS[1] + LOTUS_AX.z * (-0.12 + 0.9 * f), PR[Math.round(f * 4)]], ph: 0, great: false, still: true, rings: 4, sides: 8 }); }   // (p3 hall2) the great one: [x, z, scale, turn about its own axis, height, the way it opens]
    for (let i = 0, tries = 0; i < 12 && tries < 600; tries++) {
      const x = LOTUS[0] + hl.range(-7, 6.5), z = LOTUS[1] + hl.range(-19, 11), sc = hl.range(1.5, 2.6), rot = hl.range(0, TAU), sz = 0.316 * sc / 0.943 + 0.4;
      if (!inHall(x, z, sz + 0.1) || !discClear(x, z, sz) || !discFree(x, z, sz, 1.05) || [0.07, 0.07 + 0.2 * sc, 0.07 + 0.45 * sc].some((dp) => lineD(x, -dp, z) - 0.316 * sc < 2.3) || Math.hypot(x - LOTUS[0], z - LOTUS[1]) < 3.4 || lotusWedge(x, z)) continue;   // clear as a cylinder, shut or open; (p3 hall2) and none in the great one's own room
      lotus.push([x, z, sc, rot]); discs.push([x, z, sz, hl.range(0, TAU)]); i++;
    }
    // discs up to 150 in the list here: under the live rafts of z 62 to 156, as the pads lie over them (the garden, the vault and
    // the ends add theirs, and the sunken leaves go into the same list: 186 to 198 vault discs on seeds 1 to 24 and 34 sunken leaves are built)
    { const under = rafts.filter((rf) => rf.z > 62 && rf.z < 156 && inTub(rf.x, rf.z, 2));
      for (let tries = 0; discs.length < 150 && tries < 6000 && under.length; tries++) {
        const rf = under[tries % under.length], a = hl.range(0, TAU), rr = rf.R * Math.sqrt(hl()), x = rf.x + Math.cos(a) * rr * 1.5, z = rf.z + Math.sin(a) * rr, sz = hl.range(0.55, 1.35), rot = hl.range(0, TAU);
        if (inHall(x, z, sz + 0.1) && discFree(x, z, sz) && discClear(x, z, sz)) discs.push([x, z, sz, rot]);   // whole inside the basin's lip
        if (tries % 300 === 299) await ctx.yield();
      } }
    await ctx.yield();
    // the lesser stems, 150: one to every disc that lies 5 to 10 m from the line and has no great stem, the rest free shoots
    // in the same band that end under the skin; thinned by the quality's detail (evenly: the deal is the same at every quality)
    { const want = [];
      for (let k = nG; k < discs.length && want.length < 150; k++) { const [x, z] = discs[k], o = Math.abs(x - lineX(z)); if (o >= 5 && o <= 10 && !lotusWedge(x, z)) want.push([x, -0.07, z, false]); }
      for (let tries = 0; want.length < 150 && tries < 3000; tries++) { const z = hl.range(64, 152), side = hl() < 0.5 ? -1 : 1, x = lineX(z) + side * hl.range(5, 9.6), rise = hl.range(0.3, 1.8); if (x > tubA(z) + 0.6 && x < tubB(z) - 0.6 && tubY(x, z) < -rise - 0.5 && !lotusWedge(x, z)) want.push([x, -rise, z, true]); }
      want.forEach((top, i) => {
        const lx = hl.range(-0.9, 0.9), lz = hl.range(-0.9, 0.9), bow = hl.range(-0.3, 0.3), r0 = hl.range(0.03, 0.06), ph = hl.range(0, TAU);
        if (Math.floor((i + 1) * detail) === Math.floor(i * detail)) return;
        let xf = top[0] + lx, zf = top[2] + lz; if (xf < tubA(zf) + 0.3 || xf > tubB(zf) - 0.3) { xf = top[0]; zf = top[2]; }
        const sp = stemAt([xf, tubY(xf, zf) - 0.3, zf], top, bow, r0, top[3] ? 0.85 : 0.35);
        if (stemClear(sp) && !lotusWedge(xf, zf)) lStems.push({ sp, ph, great: false });
      }); }
    await ctx.yield();
    // ---- THE HALL, BUILT: stems (two meshes, one material), discs, lotus, each from its own Cutter
    // ---- (p3 hall2) THE GARDEN AT THE NAVE'S END. From 116 m of route on the hall grows richer toward the rise: a second flowering of
    //      lotus (six, smaller than the great one, each under a disc on a stem of its own), discs and great stems on to the tub's
    //      end, a thicket of lesser shoots over the last twenty metres, and (with the bed's forms, below) the bed heaped to the skin
    //      in drifts along the tub's end and the last ten metres of its sides. All by place, from the garden's fork (hg), with
    //      the hall's own clear air (lineD).
    const lineNear = (x, z) => { let best = 1e9, y = 0; for (let i = 0; i < route3.length; i += 3) { const dx = route3[i] - x, dz = route3[i + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; y = route3[i + 1]; } } return [Math.sqrt(best), y]; };   // [how far the flown line passes in plan, its height there]
    const lineYat = (x, z) => lineNear(x, z)[1];   // the flown line's height where it passes nearest in plan
    for (let i = 0, tries = 0; i < 6 && tries < 1200; tries++) {
      const z = hg.range(118, 132), x = lineX(z) + (i % 2 ? 1 : -1) * hg.range(2.8, 7.5), sc = hg.range(2.5, 3.6), rot = hg.range(0, TAU), drot = hg.range(0, TAU), sz = 0.316 * sc / 0.943 + 0.4;
      const lx = hg.range(-0.8, 0.8), lz = hg.range(-0.8, 0.8), bow = hg.range(-0.3, 0.3), r0 = hg.range(0.04, 0.065), ph = hg.range(0, TAU);
      if (!inHall(x, z, sz + 0.1) || !discClear(x, z, sz) || !discFree(x, z, sz, 1.05) || [0.07, 0.07 + 0.2 * sc, 0.07 + 0.45 * sc].some((dp) => lineD(x, -dp, z) - 0.316 * sc < 2.3) || Math.hypot(x - LOTUS[0], z - LOTUS[1]) < 3.8) continue;
      lotus.push([x, z, sc, rot]); discs.push([x, z, sz, drot]); i++;
      const sp = stemAt([x + lx, tubY(x + lx, z + lz) - 0.3, z + lz], [x, -0.07, z], bow, r0, 0.35); if (stemClear(sp)) lStems.push({ sp, ph, great: false });
    }
    // a disc over the rise: 1.5 m before the place where the line comes up through the skin, to port, as near as its clear air lets it lie
    if (touches[1]) { const q = touches[1], v = route.tangentAtDist(q.m - 1.5), tl = Math.hypot(v.x, v.z) || 1, p = route.posAtDist(q.m - 1.5), sz = 1.7, rot = hg.range(0, TAU);
      for (let lat = 2.2; lat < 8; lat += 0.1) { const x = p.x - v.z / tl * lat, z = p.z + v.x / tl * lat; if (!inHall(x, z, sz + 0.1) || !discClear(x, z, sz) || !discFree(x, z, sz)) continue; discs.push([x, z, sz, rot]);
        const sp = stemAt([x - 0.6, tubY(x - 0.6, z + 0.5) - 0.3, z + 0.5], [x, -0.07, z], 0.2, 0.1, 0.4); if (stemClear(sp)) gStems.push({ sp, ph: rot, great: true }); break; } }
    // discs on to the tub's end, and six more great stems under their own
    for (let n = 0, tries = 0; n < 26 && tries < 1500; tries++) { const z = hg.range(124, 155.6), x = lineX(z) + hg.range(-9.6, 9.6), sz = hg.range(0.6, 1.5), rot = hg.range(0, TAU); if (inHall(x, z, sz + 0.1) && discFree(x, z, sz) && discClear(x, z, sz)) { discs.push([x, z, sz, rot]); n++; } }
    for (let i = 0; i < 6; i++) {
      const zf = 136 + (i + hg.range(0.2, 0.8)) * 3.2, lz = hg.range(-1, 1), lx = hg.range(0, 0.7), bow = hg.range(-0.3, 0.3), r0 = hg.range(0.1, 0.16), sz0 = hg.range(0.9, 1.7), rise = hg.range(0.15, 0.5), ph = hg.range(0, TAU), rot = hg.range(0, TAU); let side = i % 2 ? -1 : 1, off = hg.range(3.2, 6.5);
      for (let tries = 0; tries < 12; tries++, off += 0.35) {
        const xf = lineX(zf) + side * off; if (xf < tubA(zf) + 0.5 || xf > tubB(zf) - 0.5) { side = -side; continue; }
        let top = [xf + side * lx, -0.07, zf + lz], sz = sz0, shoot = false;
        while (sz > 0.55 && !(discClear(top[0], top[2], sz) && discFree(top[0], top[2], sz, 0.7))) sz -= 0.25;
        if (!(sz > 0.55 && inHall(top[0], top[2], sz + 0.1))) { shoot = true; top = [top[0], -rise, top[2]]; }
        if (tubY(xf, zf) > top[1] - 0.5) continue;
        const sp = stemAt([xf, tubY(xf, zf) - 0.3, zf], top, bow, r0, shoot ? 0.85 : 0.4); if (!stemClear(sp)) continue;
        gStems.push({ sp, ph, great: true }); if (!shoot) discs.push([top[0], top[2], sz, rot]); break;
      }
    }
    // the thicket: forty lesser shoots from z 134 to the tub's end, thicker toward the end and toward the walls, each ending just under the skin
    for (let i = 0, tries = 0; i < 40 && tries < 2500; tries++) {   // (p3 hall3: forty, was seventy: the ends' planting is paid for here, in the chains and in the curtains)
      const z = 134 + 22.6 * Math.pow(hg(), 0.75), w = hg(), x = tubA(z) + 0.6 + (tubB(z) - tubA(z) - 1.2) * (hg() < 0.6 ? (w < 0.5 ? 0.5 * w * w * 2 : 1 - 0.5 * (1 - w) * (1 - w) * 2) : w), rise = hg.range(0.06, 0.4);
      const lx = hg.range(-0.7, 0.7), lz = hg.range(-0.7, 0.7), bow = hg.range(-0.3, 0.3), r0 = hg.range(0.03, 0.055), ph = hg.range(0, TAU), yb = tubY(x, z);
      if (yb > -rise - 0.45 || x + lx < tubA(z + lz) + 0.3 || x + lx > tubB(z + lz) - 0.3) continue;
      const sp = stemAt([x, yb - 0.3, z], [x + lx, -rise, z + lz], bow, r0, 0.85); if (!stemClear(sp)) continue;
      if (Math.floor((i + 1) * detail) !== Math.floor(i * detail)) lStems.push({ sp, ph, great: false }); i++;
    }
    // the vault over the nave: twelve pads' discs over the line's own plan where it flies deepest (z 90 to 118: 2.4 m and more under
    // the skin, so a disc straight overhead keeps its 2.2 m of clear air), so that the ceiling over our heads holds pads from beneath
    for (let n = 0, tries = 0; n < 12 && tries < 600; tries++) { const z = hg.range(90, 118), x = lineX(z) + hg.range(-2.6, 2.6), sz = hg.range(0.7, 1.4), rot = hg.range(0, TAU); if (inHall(x, z, sz + 0.1) && discFree(x, z, sz, 1.0) && discClear(x, z, sz)) { discs.push([x, z, sz, rot]); n++; } }
    await ctx.yield();
    // ---- (p3 hall2) THE BANK'S HANGING ROOTS: fringes of four to six roots let down from the walls' top (the edge of the shelf under
    //      the bank) in front of the upper clay face, along both walls; ribbed lofts in the stems' own glass, held at the bank and
    //      swaying most at their free tips (the stems' law of sway on a quarter wave: aK.x runs 0 to 0.5 down a root). Clear air 2.6 m.
    const roots = [];
    const rootClear = (sp) => { for (let k = 0; k <= 8; k++) { const f = k / 8, q = sp(f); if (lineD(q[0], q[1], q[2]) - q[3] * 1.2 - SWAYMAX * Math.sin(f * Math.PI / 2) < 2.66) return false; } return true; };
    { let ri = 0;
      for (const side of [-1, 1]) for (let zc = 63 + hg.range(0, 3); zc < 155.5; zc += hg.range(3.6, 6) * (side < 0 ? 1 : 1.5)) {
        const nr = 4 + Math.floor(hg() * 3), span = hg.range(0.8, 1.5);
        for (let k = 0; k < nr; k++) {
          const z = zc + hg.range(-span, span), len = hg.range(0.55, 1.1) + hg() * hg() * 0.9, inw = hg.range(0.05, 0.4), dz = hg.range(-0.3, 0.3), r0 = hg.range(0.028, 0.05), ph = hg.range(0, TAU), bow = hg.range(-0.25, 0.25);
          const P = secX(side, z), x0 = P[1][0], y0 = P[1][1], dir = -side, L = Math.min(len, (P[1][1] - P[2][1]) * 0.93), i = ri++;
          if (L < 0.3) continue;
          const sp = (f) => [x0 + dir * (-0.03 + 0.11 * Math.min(1, f * 4) + 0.19 * f + inw * f * f), y0 + 0.02 - L * f, z + dz * f + bow * Math.sin(f * Math.PI) * 0.4, r0 * (1 - 0.88 * f)];
          if (Math.floor((i + 1) * detail) !== Math.floor(i * detail) && rootClear(sp)) roots.push({ sp, ph, root: true });
        }
      } }
    await ctx.yield();
    // ---- (p3 hall3) THE TWO ENDS AND THE LIGHT, dealt from a fork of the hall's own stream taken HERE (h3: after everything the
    //      second round dealt before it, so the hall's own deal up to here is what it was).
    const h3 = hl.fork('ends'), BED_SUN = 0.6;   // BED_SUN: how far along the sun's bearing the light is carried for each metre it falls (the shafts' slant, and the bed's net)
    // THE TWO END STRETCHES, as places: 78 to 94 m and 120 to 137 m of route, by the z of the route's own points there.
    const ENDS = [[78, 94], [120, 137]].map(([a, b]) => [route.posAtDist(a).z, route.posAtDist(b).z]);
    // (a) six more great stems in each (dealt on to 5 m beyond its far end, as the shafts and the beads are, so that the last metres
    //     of a stretch have them before the eye), 2.9 m and more off the line (nearer than the colonnade's), each from the bed to a pad's disc
    //     of its own at the skin (or a shoot where no disc has room), with the colonnade's own clear air (stemClear, discClear)
    ENDS.forEach(([z0, z1], b) => { for (let i = 0; i < 6; i++) {
      const zf = z0 + (z1 + 5 - z0) * (i + h3.range(0.15, 0.85)) / 6, lz = h3.range(-1, 1), lx = h3.range(0, 0.7), bow = h3.range(-0.35, 0.35), r0 = h3.range(0.12, 0.19), sz0 = h3.range(1.0, 1.9), rise = h3.range(0.25, 0.7), ph = h3.range(0, TAU), rot = h3.range(0, TAU); let side = (i + b) % 2 ? -1 : 1, off = h3.range(2.9, 4.2);
      for (let tries = 0; tries < 16; tries++, off += 0.3) {
        const xf = lineX(zf) + side * off; if (xf < tubA(zf) + 0.5 || xf > tubB(zf) - 0.5) { side = -side; continue; }
        if (lotusWedge(xf, zf) || gStems.some((st) => { const q = st.sp(0); return Math.hypot(q[0] - xf, q[2] - zf) < 1.1; })) continue;   // not in the lotus's room, nor foot to foot with another
        let top = [xf + side * lx, -0.07, zf + lz], sz = sz0, shoot = false;
        while (sz > 0.55 && !(discClear(top[0], top[2], sz) && discFree(top[0], top[2], sz, 0.7))) sz -= 0.25;
        let own = sz > 0.55 && inHall(top[0], top[2], sz + 0.1);
        if (!own) {   // no room for a disc of its own: it rises to the nearest loose disc within 2.4 m (one that carries no stem and no lotus), or ends as a shoot
          const tops = [...gStems, ...lStems].map((st) => st.sp(1)), free = discs.filter((q, k) => k >= 2 && Math.hypot(q[0] - xf, q[1] - zf) < 2.4 && q[2] > 0.7 && !tops.some((t) => Math.hypot(t[0] - q[0], t[2] - q[1]) < 0.4) && !lotus.some((l) => Math.hypot(l[0] - q[0], l[1] - q[1]) < 0.4)).sort((p, q) => Math.hypot(p[0] - xf, p[1] - zf) - Math.hypot(q[0] - xf, q[1] - zf))[0];
          if (free) top = [free[0], -0.07, free[1]]; else { shoot = true; top = [top[0], -rise, top[2]]; } }
        if (tubY(xf, zf) > top[1] - 0.5) continue;
        const sp = stemAt([xf, tubY(xf, zf) - 0.3, zf], top, bow, r0, shoot ? 0.85 : 0.4); if (!stemClear(sp)) continue;
        gStems.push({ sp, ph, great: true, end: true }); if (own) discs.push([top[0], top[2], sz, rot]); break;
      } } });
    // (a2) THE STARBOARD WALL BESIDE THE GREAT LOTUS (110 to 122 m of route: LOTUS_WALL, its z) is planted like the others: three stems
    //     standing 1.2 to 2.4 m before its face (beyond the lotus's own room, behind the flower as we come), root curtains (below),
    //     a burrow colony on its upper face with a string of beads rising from it (the colony's mesh and the beads' places further on).
    const LOTUS_WALL = [route.posAtDist(110).z, route.posAtDist(122).z];
    for (let i = 0, tries = 0; i < 3 && tries < 60; tries++) {
      const zf = LOTUS_WALL[0] + (LOTUS_WALL[1] - LOTUS_WALL[0]) * (i + h3.range(0.15, 0.85)) / 3, xf = secX(1, zf)[1][0] - h3.range(1.2, 2.4), lx = h3.range(-0.5, 0.2), lz = h3.range(-0.8, 0.8), bow = h3.range(-0.3, 0.3), r0 = h3.range(0.08, 0.12), rise = h3.range(0.2, 0.6), ph = h3.range(0, TAU);
      if (lotusWedge(xf, zf) || Math.hypot(xf - LOTUS[0], zf - LOTUS[1]) < 2.6 || tubY(xf, zf) > -rise - 0.8) continue;
      const sp = stemAt([xf, tubY(xf, zf) - 0.3, zf], [xf + lx, -rise, zf + lz], bow, r0, 0.8); if (!stemClear(sp)) continue;
      gStems.push({ sp, ph, great: true, end: true }); i++;
    }
    // (b) THE ROOT CURTAINS of the two ends: every 3.4 to 4.2 m along both walls a curtain in TWO TIERS, six thick roots let down from
    //     the shelf's edge before the upper face and four from the first ledge's nosing before the second face (the fringes' own
    //     form and sway, twice as thick); thinned by the quality's detail; clear air 2.6 m.
    { let ri = 0;
      [...ENDS, LOTUS_WALL].forEach(([z0, z1], e) => { for (const side of e < 2 ? [-1, 1] : [1]) for (let zc = z0 + h3.range(0, 1.5); zc < z1 + 1; zc += h3.range(3.4, 4.2)) for (let k = 0; k < 10; k++) {
        const tier = k < 6 ? 1 : 3, z = zc + h3.range(-1.5, 1.5), len = h3.range(0.8, 1.5), inw = h3.range(0.1, 0.5), dz = h3.range(-0.3, 0.3), r0 = h3.range(0.05, 0.085), ph = h3.range(0, TAU), bow = h3.range(-0.25, 0.25);
        const P = secX(side, z), x0 = P[tier][0], y0 = P[tier][1], dir = -side, L = Math.min(len, (P[tier][1] - P[tier + 1][1]) * 0.95), i = ri++;
        if (L < 0.3 || z < TUB.z0 + 1 || z > TUB.z1 - 1) continue;
        const sp = (f) => [x0 + dir * (-0.03 + 0.11 * Math.min(1, f * 4) + 0.19 * f + inw * f * f), y0 + 0.02 - L * f, z + dz * f + bow * Math.sin(f * Math.PI) * 0.4, r0 * (1 - 0.85 * f)];
        if (Math.floor((i + 1) * detail) !== Math.floor(i * detail) && rootClear(sp)) roots.push({ sp, ph, root: true, curtain: true });
      } }); }
    // (c) the starboard colony, in the burrows' own glass (the port colonies' recipe, on the starboard wall's upper face): a mesh of its own
    { const cb = new Cutter(), bm = scene.getObjectByName('burrows'), zc = (LOTUS_WALL[0] + LOTUS_WALL[1]) / 2 + h3.range(-1.5, 1.5), half = h3.range(2.0, 2.6), th = h3.range(0.43, 0.47), ph = h3.range(0, TAU), nR = 22 + Math.floor(h3() * 8), got = [];
      const faceB = (z, t, lift) => { const P = secX(1, z), dx = P[2][0] - P[1][0], dy = P[2][1] - P[1][1], dl = Math.hypot(dx, dy) || 1; return [P[1][0] + dx * t + dy / dl * lift, P[1][1] + dy * t - dx / dl * lift, z, dy / dl, -dx / dl]; };   // lifted off the face along its normal (which looks into the hall)
      const edge = (a) => 1 + 0.16 * Math.sin(a * 3 + ph) + 0.09 * Math.sin(a * 5 + ph * 2.3);
      { const q = faceB(zc, 0.5, 0.05); cb.v(q[0], q[1], q[2], q[3], q[4], 0, 1, 0, 0.25); }
      for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, e = edge(a), q = faceB(zc - Math.cos(a) * half * e, clamp(0.5 + Math.sin(a) * th * e, 0.02, 0.98), 0.05); cb.v(q[0], q[1], q[2], q[3], q[4], 0, 0, 0, 0.25); }
      for (let k = 0; k < 14; k++) cb.idx.push(0, 1 + k, 1 + (k + 1) % 14);
      for (let tries = 0; got.length < nR && tries < 4000; tries++) {
        const a = h3.range(0, TAU), rr = Math.sqrt(h3()) * 0.86, rad = h3.range(0.085, 0.15), dz = Math.cos(a) * half * rr * edge(a), dt = Math.sin(a) * th * rr * edge(a);
        if (got.some((g) => Math.hypot((g[0] - dz) / 1.2, (g[1] - dt) * 1.4) < g[2] + rad + 0.03)) continue;
        got.push([dz, dt, rad]);
        const c0 = faceB(zc + dz, 0.5 + dt, 0.09), up = faceB(zc + dz, 0.5 + dt - 0.1, 0.09), ul = Math.hypot(up[0] - c0[0], up[1] - c0[1]) || 1, ux = (up[0] - c0[0]) / ul, uy = (up[1] - c0[1]) / ul, b2 = cb.count;
        for (const [u, v] of [[1, -1], [-1, -1], [-1, 1], [1, 1]]) cb.v(c0[0] + ux * v * rad, c0[1] + uy * v * rad, c0[2] + u * rad * 1.2, c0[3], c0[4], 0, u, v, 0);
        cb.idx.push(b2, b2 + 1, b2 + 2, b2, b2 + 2, b2 + 3);
      }
      if (bm) { const m2 = new THREE.Mesh(cb.finish(), bm.material); m2.name = 'burrows-starboard'; m2.frustumCulled = false; m2.userData.colonies = [[zc, got.length, 1]]; scene.add(m2); } }
    // LIGHT COMES DOWN THROUGH THE GAPS: fourteen slanted shafts of cut light, each from a gap between the pads' discs at the skin
    // down to the bed, slanting away from the lamp's foot as the bed's light is carried (BED_SUN); five in the first end stretch
    // (dealt on to z 98) and six in the second (on to z 139.5), so that the last metres of each have them before the eye, 2.7 to 5.2 m off
    // the line, three in the middle, 4.6 to 8 m off. Each is TWO CROSSED BANDS about its own axis (one across the
    // sun's bearing, one in the bearing's upright plane), so it keeps its look from the side and from below; nothing of it turns
    // to the eye. It sways at its foot on the world's clock (SHAFT.sway metres at most). Clear air 2.2 m at any sway.
    const onFloor = (x, z, m = 0) => x > secX(-1, z)[6][0] + m && x < secX(1, z)[6][0] - m, why = { gap: 0, floor: 0, air: 0, cut: 0 };   // on the bed or the talus at a wall's foot
    const stemTops = [...gStems, ...lStems].map((st) => st.sp(1));
    const rooted = (q) => lineNear(q[0], q[1])[0] < 2.7 || discs.indexOf(q) < 2 || stemTops.some((t) => Math.hypot(t[0] - q[0], t[2] - q[1]) < 0.4) || lotus.some((l) => Math.hypot(l[0] - q[0], l[1] - q[1]) < 0.4);   // a disc that carries a stem or a lotus, lies under a pad by a touch, or stands in the vault over the line: never taken out
    const SHAFT = { sway: 0.12, n: [5, 3, 6], z: [[77.5, 98], [99, 116], [118.5, 139.5]], off: [[2.7, 5.2], [4.6, 8], [2.7, 5.2]] }, shafts = [];
    for (let b = 0; b < 3; b++) for (let i = 0, tries = 0; i < SHAFT.n[b] && tries < 400; tries++) {
      const [z0, z1] = SHAFT.z[b], wide = (tries % 40) >= 20, z = wide ? h3.range(z0, z1) : z0 + (z1 - z0) * (i + h3.range(0.15, 0.85)) / SHAFT.n[b], side = ((i + b) % 2 ? 1 : -1) * (wide && h3() < 0.5 ? -1 : 1), x = lineX(z) + side * h3.range(SHAFT.off[b][0], SHAFT.off[b][1] + (wide ? 1 : 0)), hw = h3.range(0.32, 0.56), ph = h3.range(0, TAU);   // its own turn of the stretch and its own side first; where great pads shut that, anywhere in the stretch
      const over = discs.filter((q) => !q[4] && Math.hypot(q[0] - x, q[1] - z) < q[2] * 0.99 + hw * 0.6);   // the discs that would lie over its head
      if (!inHall(x, z, hw + 0.6) || over.length > 3 || over.some(rooted) || shafts.some((q) => Math.hypot(q.top[0] - x, q.top[2] - z) < 2.4)) { why.gap++; continue; }
      const lx = lampAt[0] - x, lz = lampAt[1] - z, ll = Math.hypot(lx, lz), sxn = lx / ll, szn = lz / ll;
      let fx = x, fz = z, fy = 0; for (let k = 0; k < 4; k++) { fy = tubY(fx, fz); fx = x + sxn * BED_SUN * fy; fz = z + szn * BED_SUN * fy; }   // its foot: where the light that came through at (x, z) meets the bed
      if (!onFloor(fx, fz, hw * 0.5)) { why.floor++; continue; }
      let ok = true; for (let k = 0; k <= 12 && ok; k++) { const f = k / 12; if (lineD(x + (fx - x) * f, -0.04 + (fy + 0.04) * f, z + (fz - z) * f) - hw * (1 + 0.3 * f) - SHAFT.sway * f < 2.26) ok = false; }
      if (!ok) { why.air++; continue; }
      for (const q of over) { discs.splice(discs.indexOf(q), 1); why.cut++; }   // the gap is OPENED where the canopy is thickest: a loose disc (no stem, no lotus) over the shaft's head is taken out
      shafts.push({ top: [x, -0.04, z], foot: [fx, fy - 0.25, fz], hw, ph, sun: [sxn, szn] }); i++;   // the band runs 0.25 m into the bed: the bed cuts it off
    }
    await ctx.yield();
    // ---- (p3 hall2) THE BED LIVES: cameo forms cut in the bed's own glass (the tub's Cutter), all 2.0 m and more under the flown line.
    //      BED_SUN: how far along the sun's bearing the ceiling's light is carried for each metre it falls (the same figure in the
    //      tub's shader and in the shafts' slant).
    const bedForms = { leaves: 0, drifts: 0, mussels: 0, shades: 0, shore: 0 };
    const deep = (x, y, z, m = 2.02) => lineYat(x, z) - y >= m && lineD(x, y, z) >= m;   // far enough under the line, and from it
    const TV = (x, y, z, r, s0 = 0, s1 = 0, s2 = 0) => { ctub.cur[0] = s0; ctub.cur[1] = s1; ctub.cur[2] = s2; return ctub.v(x, y, z, 0, 1, 0, 4 + r, y, 0); };   // a vertex of the bed's layer
    // (a) (p3 hall3) NO SHADE ROUNDS: no shadow of any body is drawn on the bed (the second round laid a dark round under every disc)
    // (b) sunken lily leaves lying on the bed (the vault discs' own cut, their corners following the bed): into the discs' list
    for (let n = 0, tries = 0; n < 34 && tries < 900; tries++) { const z = hg.range(76, 150), x = lineX(z) + hg.range(-7.5, 7.5), sz = hg.range(0.45, 1.15), rot = hg.range(0, TAU);
      if (!onBed(x, z, sz * 1.3) || !deep(x, tubY(x, z) + 0.06, z) || discs.some((q) => q[4] && Math.hypot(q[0] - x, q[1] - z) < q[2] + sz + 0.3)) continue; discs.push([x, z, sz, rot, 1]); n++; bedForms.leaves++; }
    // (c) drifts: sixteen low crescent ridges across the flow, each rising from the bed on its long windward side to a crest (its
    //     relief falls to 0 there: the pale cut edge, and the terraces of tone down both flanks) and falling short to leeward
    for (let n = 0, tries = 0; n < 16 && tries < 600; tries++) {
      const cz = hg.range(74, 151), cx = lineX(cz) + hg.range(-6.5, 6.5), a = hg.range(-0.6, 0.6), L = hg.range(3, 7), bw = hg.range(-0.9, 0.9), h0 = hg.range(0.3, 0.75), ww = hg.range(1.0, 1.7), wl = hg.range(0.35, 0.6);
      const dxx = Math.cos(a), dzz = Math.sin(a), N = 6, R = []; let ok = true;
      for (let i = 0; i <= N && ok; i++) { const t = i / N, s = (t - 0.5) * L, k = Math.pow(Math.sin(Math.PI * t), 0.7), bo = bw * (1 - (2 * t - 1) * (2 * t - 1)), px = cx + dxx * s - dzz * bo, pz = cz + dzz * s + dxx * bo;
        const W = [px + dzz * ww * (0.3 + 0.7 * k), pz - dxx * ww * (0.3 + 0.7 * k)], Le = [px - dzz * wl * (0.3 + 0.7 * k), pz + dxx * wl * (0.3 + 0.7 * k)];
        if (!onBed(W[0], W[1], 0.2) || !onBed(Le[0], Le[1], 0.2) || !onBed(px, pz, 0.2)) { ok = false; break; }
        const yb = tubY(px, pz), h = Math.max(0, Math.min(h0, lineYat(px, pz) - 2.04 - yb, lineD(px, yb, pz) - 2.06)) * k;
        R.push([W[0], tubY(W[0], W[1]) - 0.04, W[1], px, yb + h - 0.04 * (1 - k), pz, Le[0], tubY(Le[0], Le[1]) - 0.04, Le[1]]); if (i === N / 2 && h < 0.1) ok = false; }
      if (!ok) continue;
      const b = ctub.count; for (const q of R) { TV(q[0], q[1], q[2], 1.04); TV(q[3], q[4], q[5], 0); TV(q[6], q[7], q[8], 1.04); }
      for (let i = 0; i < N; i++) for (let k = 0; k < 2; k++) { const p = b + i * 3 + k; ctub.idx.push(p, p + 1, p + 3, p + 1, p + 4, p + 3); }
      n++; bedForms.drifts++;
    }
    await ctx.yield();
    // (d) six great mussels standing open in the bed, hinge down: two halves each, leaning apart; a half is a shallow dome whose
    //     relief runs from its hinge (the thickest) to 0 at its lip (growth bands in the bed's three tones, a pale lip)
    for (let n = 0, tries = 0; n < 6 && tries < 500; tries++) {
      const z = n % 2 ? hg.range(112, 130) : hg.range(80, 94), x = lineX(z) + (hg() < 0.5 ? -1 : 1) * hg.range(2.6, 6), ha = hg.range(0, Math.PI), Lm = hg.range(1.5, 2.1) * (tries > 250 ? 0.75 : 1), Hm = Lm * hg.range(0.56, 0.66), al = hg.range(0.42, 0.66);
      if (!onBed(x, z, Lm * 0.7)) continue;
      const y0 = tubY(x, z) - 0.1, hx = Math.cos(ha), hz = Math.sin(ha), sx = -hz, sz2 = hx, V = []; let ok = true;
      for (const sg of [-1, 1]) for (const v of [0, 0.55, 1]) for (const u of [-1, -0.5, 0, 0.5, 1]) {
        const vm = Math.pow(Math.max(1 - u * u, 0), 0.4) * (0.25 + 0.75 * v) * (u * u === 1 ? 0.25 * v : 1), up = v * Hm * vm, bul = 0.14 * Lm * Math.sin(Math.PI * Math.min(v, 0.999)) * (1 - u * u);
        const out = sg * (Math.sin(al) * up + Math.cos(al) * bul), px = x + hx * u * Lm * 0.5 * (1 - 0.12 * v) + sx * out, py = y0 + Math.cos(al) * up - Math.sin(al) * bul, pz = z + hz * u * Lm * 0.5 * (1 - 0.12 * v) + sz2 * out;
        if (py > y0 + 0.12 && !(lineYat(px, pz) - py >= 2.02 && lineD(px, py, pz) >= 2.26)) ok = false;
        V.push([px, py, pz, v === 0 ? 1.04 : v < 1 ? 0.62 : 0]);
      }
      if (!ok) continue;
      const b = ctub.count; for (const q of V) TV(q[0], q[1], q[2], q[3], 0, 0, 1);
      for (let h = 0; h < 2; h++) for (let j = 0; j < 2; j++) for (let k = 0; k < 4; k++) { const p = b + h * 15 + j * 5 + k; ctub.idx.push(p, p + 1, p + 5, p + 1, p + 6, p + 5); }
      n++; bedForms.mussels++;
    }
    // (e) THE SHORE: along the tub's end and the last twelve metres of its sides the bed is heaped to the skin in drifts: twelve
    //     mounds, each a flat at the skin's height (never drawn above the skin: the ceiling closes it), falling in a scalloped
    //     front to the bed. No squared end and no straight wall top is left there to be seen: the ceiling meets drifts.
    { const mound = (cx, cz, ra, rb, rot, sd) => {
        const b = ctub.count, NSEG = 10, co = Math.cos(rot), si = Math.sin(rot), pts = []; let ok = true;
        for (const [k, yk, r] of [[0.34, 1, 0], [0.66, 0.42, 0.72], [1, 0, 1.04]]) for (let i = 0; i < NSEG; i++) {
          const a = i / NSEG * TAU, e = k * (1 + 0.22 * Math.sin(a * 3 + sd) + 0.12 * Math.sin(a * 5 + sd * 2.1)), ux = Math.cos(a) * ra * e, uz = Math.sin(a) * rb * e, x = cx + co * ux - si * uz, z = clamp(cz + si * ux + co * uz, TUB.z0, TUB.z1 + 1.5), yb = Math.min(tubY(x, Math.min(z, TUB.z1)), TUB.lap) - 0.06;
          const y = yk >= 1 ? TUB.lap : yb + (TUB.lap - yb) * yk; if (y > -0.2 && lineD(x, y, z) < 2.03) ok = false; pts.push([x, y, z, r]); }
        if (!ok || lineD(cx, TUB.lap, cz) < 2.03) return false;
        TV(cx, TUB.lap, cz, 0); for (const q of pts) TV(q[0], q[1], q[2], q[3]);
        for (let i = 0; i < NSEG; i++) { const j = (i + 1) % NSEG; ctub.idx.push(b, b + 1 + i, b + 1 + j);
          for (let k = 0; k < 2; k++) { const p = b + 1 + k * NSEG; ctub.idx.push(p + i, p + NSEG + i, p + j, p + j, p + NSEG + i, p + NSEG + j); } }
        bedForms.shore++; return true; };
      for (let i = 0; i < 6; i++) { const z = 155.6 + hg.range(-1.2, 0.8), x = tubA(z) + 1 + (tubB(z) - tubA(z) - 2) * (i + hg.range(0.2, 0.8)) / 6; mound(x, z, hg.range(2.3, 3.3), hg.range(3.2, 5.6), hg.range(-0.3, 0.3), hg.range(0, TAU)); }
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 146 + i * 3.8 + hg.range(-1, 1), x = side < 0 ? tubA(z) + hg.range(0.4, 1.2) : tubB(z) - hg.range(0.4, 1.2); mound(x, z, hg.range(2.6, 4.2), hg.range(2.6, 3.8), hg.range(-0.4, 0.4), hg.range(0, TAU)); }
    }
    // THE TUB'S MESH. Its glass: the walls' two upper layers each one flat skin with a pale rim at a ledge's nosing (a far wall
    // thinner); the third layer, the bed and its forms, in the bluff's bedded cut. (p3 hall3) ONE NET OF CUT LIGHT LIES ON THE BED,
    // its own engraved layer: the ceiling's net of ripple lines (rnet, the same law) taken at the place on the skin from which the
    // light that reaches this place of the bed came (carried down along the bearing from this place to the lamp's foot, BED_SUN
    // metres for each metre of depth), drifting on the water's own flow and clock: a honey line with a rose flank, hard-edged;
    // bolder under the sun's road (the straight line on the skin from the lamp's foot over the hall's middle) and BOLDEST ROUND
    // THE FEET OF THE SHAFTS (uFeet: each shaft's foot on the bed and its half width), where the cells between the lines go a step
    // lighter too. None on the walls' feet (the relief says where the bed is), none on a mussel. Every term is a place of the bed
    // or the world's clock: nothing of it reads the eye. No shadow of any body is drawn.
    { const kn = [ROAD_AT[0], 0, ROAD_AT[1]], rdx = lampAt[0] - kn[0], rdz = lampAt[1] - kn[2], rl = Math.hypot(rdx, rdz);
      const tub = new THREE.Mesh(ctub.finish({ extraName: 'aS' }), underMat({
        skins: 3, wobble: 0.35, veins: 0.42, veinHalf: 0.035, tints: [lit(tp(T.amber, 0.3)), lit(tp(T.aubergine, 0.25)), lit(tp(T.aubergine, 0.4))],   // the wall's top a thin amber skin; under it two thin skins of aubergine: the bed is plum, deeper than the water's skin beside the round seen from above, and never black
        vertexDecl: 'attribute vec3 aS; varying vec3 vS;', vertexMove: 'vS = aS;',
        fragDecl: `varying vec3 vS; uniform vec2 uLamp, uFlow; uniform vec4 uRoad; uniform vec3 uFeet[${Math.max(1, shafts.length)}]; ${NET_GLSL}`,
        uniforms: { uLamp: { value: new THREE.Vector2(lampAt[0], lampAt[1]) }, uFlow: waterMat.uniforms.uFlow, uRoad: { value: new THREE.Vector4(kn[0], kn[2], rdz / rl, -rdx / rl) },
          uFeet: { value: shafts.length ? shafts.map((q) => new THREE.Vector3(q.foot[0], q.foot[2], q.hw * 1.3)) : [new THREE.Vector3(0, -1e4, 1)] } },
        fragMod: /* glsl */`
          float tl = floor(vCut.x * 0.5 + 1e-3), rl = vCut.x - 2. * tl, fwl = fwidth(rl) + 1e-5;
          r = rl;
          // the bluff's beds: the clay lies in terraces of two skins that wander over the bed in drifts a few metres across
          float bst = wy * 0.3 + 0.9 * gNoise(vec2(dot(vWpos.xz, vec2(0.05, 0.11)), wy * 0.22)) + 0.55 * gNoise(vWpos.xz * vec2(0.42, 0.2) + 3.7); float btri = abs(fract(bst) - 0.5) * 2.;
          r = mix(r, 0.47 + 0.45 * smoothstep(0.38, 0.62, btri), smoothstep(0.8, 1.0, r) * step(1.5, tl));
          vec2 bsd = uLamp - vWpos.xz; bsd *= inversesqrt(max(dot(bsd, bsd), 1e-6));
          vec2 bsk = vWpos.xz + bsd * max(-vWpos.y, 0.) * ${BED_SUN.toFixed(2)};          // the place on the skin this place's light came through
          vec2 blp = (bsk - uFlow * uTime) / 1.3; blp += (vec2(gNoise(blp * 1.9 + 2.3), gNoise(blp * 1.9 + 7.9)) - 0.5) * 0.45; float bfl = max(fwidth(blp.x), fwidth(blp.y));   // the net's cells, 1.3 m
          float bnet = rnet(blp + 17.3, uTime * 0.5), bfn = min(fwidth(bnet), 3. * bfl);`,
        fragPost: /* glsl */`
          { float w0t = min(max(0.055, 2. * fwl), 0.3);
            vec3 wallC = g * mix(mix(uT1, uT2, step(0.5, tl)), uT1, 0.6 * smoothstep(45., 80., dist) * step(0.5, tl));
            col = mix(mix(mix(g, max(g, uCitron), 0.5), wallC, aaStep(w0t, rl, fwl)), col, step(1.5, tl)); }
          { float road = 1. - smoothstep(3., 12., abs(dot(bsk - uRoad.xy, uRoad.zw))), foot = 0.;
            for (int i = 0; i < ${Math.max(1, shafts.length)}; i++) foot = max(foot, 1. - smoothstep(uFeet[i].z, uFeet[i].z * 3.4, length(vWpos.xz - uFeet[i].xy)));
            float amt = smoothstep(0.945, 0.985, rl) * step(1.5, tl) * (1. - step(0.5, vS.z));   // on the bed and its forms, not on the walls' feet nor on a mussel
            float w = (0.05 + 0.03 * road + 0.1 * foot) * amt * (0.3 + 1.5 * gNoise(blp / 1.9 + 5.));   // the lines swell and thin along their length, as light does on a bed
            float lr = netLine(bnet, w * 2.3 + 0.015 * amt, bfn, bfl), lh = netLine(bnet, w, bfn, bfl);
            col = mix(col, mix(col, uRose, 0.5), foot * amt);                                       // under a shaft the bed is a step lighter
            col = mix(col, uRose * 0.97, lr * 0.9); col = mix(col, mix(uHoney, uRose, 0.12 - 0.12 * foot), lh * 0.94); }` }));
      tub.name = 'tub'; tub.frustumCulled = false; tub.userData.forms = bedForms; tub.userData.section = secX; tub.userData.bedAt = tubY; tub.userData.inPlan = inTub; scene.add(tub); }
    await ctx.yield();
    const hall = []; let wellPadsMesh = null;   // the meshes that stand under the skin (they do not rest with the world above)
    {
      const fa = new THREE.Vector3(), fb = new THREE.Vector3(), ft = new THREE.Vector3();
      // the gate's loft: rings with a doubled seam and a carried frame; wheel coordinate = the side's number (the ribs);
      // aK = (how far up the stem, the stem's own phase) for the sway
      const loft = (c, st, rings, sides) => {
        const base = c.count, P = []; fa.set(1, 0, 0.3).normalize();
        for (let i = 0; i <= rings; i++) P.push(st.sp(i / rings));
        for (let i = 0; i <= rings; i++) {
          const f = i / rings, p = P[i], q = P[Math.min(i + 1, rings)], o = P[Math.max(i - 1, 0)];
          ft.set(q[0] - o[0], q[1] - o[1], q[2] - o[2]).normalize();
          fb.crossVectors(ft, fa); if (fb.lengthSq() < 1e-6) fb.set(0, 0, 1); fb.normalize(); fa.crossVectors(fb, ft).normalize();
          const R = p[3] * (st.great ? 1 + 0.16 * Math.exp(-Math.pow((f - 0.36) / 0.05, 2)) + 0.16 * Math.exp(-Math.pow((f - 0.7) / 0.05, 2)) : 1);   // swollen at its two nodes
          c.cur[0] = st.root ? 0.5 * f : st.still ? 1 : f; c.cur[1] = st.ph;   // (p3 hall2) a root is held at the bank only: a quarter wave of the sway
          for (let k = 0; k <= sides; k++) { const an = k / sides * TAU, co = Math.cos(an), si = Math.sin(an), nx = fa.x * co + fb.x * si, ny = fa.y * co + fb.y * si, nz = fa.z * co + fb.z * si; c.v(p[0] + nx * R, p[1] + ny * R, p[2] + nz * R, nx, ny, nz, 0, k, 1); }
        }
        for (let i = 0; i < rings; i++) for (let k = 0; k < sides; k++) { const p0 = base + i * (sides + 1) + k; c.idx.push(p0, p0 + 1, p0 + sides + 1, p0 + 1, p0 + sides + 2, p0 + sides + 1); }
      };
      // three planes by distance (the bite scaled by 4): an aubergine heart inside about 9 m, amber to about 28 m, olive beyond
      const stemMat = underMat({
        skins: 3, biteScale: 4, wobble: 0.5, veinHalf: 0.1, tints: [lit(tp(T.olive, 0.8)), lit(tp(T.amber, 0.85)), lit(T.aubergine)],   // (p3 hall2) the heart too is cut no thicker than the hall's tone floor
        vertexDecl: 'attribute vec2 aK;',
        // glass flows: a stem is held at the bed and at the skin and leans between them in slow curves (at most STEM_SWAY times 1.28 m, midway up)
        vertexMove: `float ssw = sin(3.14159 * aK.x) * ${STEM_SWAY.toFixed(2)}; p.x += sin(uTime * 0.31 + aK.y) * ssw; p.z += cos(uTime * 0.24 + aK.y * 1.3) * ssw * 0.8;`,
        fragMod: 'r = max(r, 0.93 * smoothstep(0.08, 0.25, fwidth(rr))); wy = fract(vCut.y) - 0.5;' });   // a stem a few pixels wide has no room for a rim
      const cg = new Cutter().withExtra(2); for (const st of gStems) loft(cg, st, st.rings || 6, st.sides || 10);
      const stems = new THREE.Mesh(cg.finish({ extraName: 'aK' }), stemMat); stems.name = 'stems'; stems.frustumCulled = false; stems.userData.sway = STEM_SWAY; stems.userData.great = gStems.filter((st) => st.great).map((st) => ({ foot: st.sp(0), top: st.sp(1), end: !!st.end })); stems.userData.sp = gStems.map((st) => st.sp); stems.userData.swayMax = SWAYMAX; scene.add(stems); hall.push(stems);
      await ctx.yield();
      const cl = new Cutter().withExtra(2); for (const st of lStems) loft(cl, st, 4, 4);
      const lesser = new THREE.Mesh(cl.finish({ extraName: 'aK' }), stemMat); lesser.name = 'stems-lesser'; lesser.frustumCulled = false; lesser.userData.sway = STEM_SWAY; lesser.userData.sp = lStems.map((st) => st.sp); scene.add(lesser); hall.push(lesser);
      await ctx.yield();
      const cr = new Cutter().withExtra(2); for (const st of roots) loft(cr, st, 3, 3);   // (p3 hall2) the bank's hanging roots, in the stems' glass
      const rootsM = new THREE.Mesh(cr.finish({ extraName: 'aK' }), stemMat); rootsM.name = 'roots'; rootsM.frustumCulled = false; rootsM.userData.sway = STEM_SWAY; rootsM.userData.roots = roots.map((r) => ({ top: r.sp(0), tip: r.sp(1), curtain: !!r.curtain })); rootsM.userData.sp = roots.map((r) => r.sp); scene.add(rootsM); hall.push(rootsM);
      await ctx.yield();
      // THE VAULT DISCS: the pads seen from beneath, cut as the pads are (one V to the heart, the ribs on), 6 cm under the skin.
      // (p3 hall3) EIGHT-SIDED: the round cut in the glass reaches 0.9906 of the half-width; the body is the eight-sided figure drawn round
      // that round (OCT: corners at 1.0722), so no true triangle of it reaches further than 1.0722 half-widths (a square's corners
      // reached 1.414 and came to 1.78 m from the flown line, undrawn). With discClear's 2.22 m to the round: 2.04 m and more.
      const cd = new Cutter();
      for (const [x, z, sz, rot, bed] of discs) { const b = cd.count, co = Math.cos(rot), si = Math.sin(rot);   // (p3 hall2) bed: a sunken leaf, its corners 3.5 cm over the bed
        for (const [u, v] of OCT) { const px = x + (co * u - si * v) * sz, pz = z + (si * u + co * v) * sz; cd.v(px, bed ? tubY(px, pz) + 0.035 : -0.06, pz, 0, bed ? 1 : -1, 0, u, v, 0); }
        for (let k = 1; k < 7; k++) cd.idx.push(b, b + k, b + k + 1); }
      const vault = new THREE.Mesh(cd.finish(), underMat({
        skins: 3, wobble: 0.8, veins: 1, veinHalf: 0.07, biteScale: 0.8, tints: [lit(tp(T.olive, 0.8)), lit(tmul(T.olive, tp(T.amber, 0.55))), lit(tmul(T.amber, tp(T.aubergine, 0.3)))],
        fragMod: /* glsl */`
          vec2 pq = vCut.xy; float rho = length(pq), ang = rho > 1e-3 ? atan(pq.y, -pq.x) : 0.;
          float md = min(1. + 0.05 * sin(ang * 5. + vWpos.x * 2.) - rho * 1.06, (3.14159 - abs(ang)) * rho * 2.4 - 0.06);
          if (md < 0.) discard;
          r = min(md * 1.7, 0.97); wy = ang * 2.228;`,
        fragPost: `float dLit = step(n.y, -0.5); ${SKIN_TONES.disc}` }));   // (p3 hall3) the discs' tones are the skin's set's
      vault.name = 'discs'; vault.frustumCulled = false; vault.userData.discs = discs; scene.add(vault); hall.push(vault);
      await ctx.yield();
      // THE LOTUS (p3 hall3): A ROSETTE OF BROAD PETALS with smooth cut edges, hanging under the skin (the great one at the head of its
      // stem, turned), closed until we are near: it opens over uProgress 0.17 to 0.21 (a law of progress). Eight broad outer petals
      // and six inner ones standing steeper, each a cupped band whose OUTLINE IS CUT IN THE GLASS (a smooth pointed oval of the
      // petal's own (across, along): no bite, no saw teeth), and a six-sided heart. Two tones of lit glass (the outer ring rose with
      // a little citron, the inner ring paler), each petal deeper toward its foot, a pale cut rim; the heart darker (honey in aubergine).
      // cut = (across -1..1, along 0..1, ring: 0 outer, 1 inner, 2 the heart). The same reach as the lilies' flower (0.316 of its scale).
      const fl = new Cutter();
      for (const [np, el, len, hw, a0, ring] of [[8, 0.32, 0.333, 0.125, 0, 0], [6, 0.85, 0.27, 0.105, 0.26, 1]]) for (let k = 0; k < np; k++) {
        const a = a0 + k / np * TAU, ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(el), se = Math.sin(el), b = fl.count;
        for (const [t, lift] of [[0, 0], [0.5, 0.045], [1, 0.02]]) for (const sd of [-1, 1]) fl.v(ca * t * ce * len - sa * hw * sd, 0.05 + t * se * len + lift * len * 3, sa * t * ce * len + ca * hw * sd, ca, 0.4, sa, sd, t, ring);
        fl.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2, b + 2, b + 3, b + 4, b + 3, b + 5, b + 4);
      }
      { const b = fl.count; fl.v(0, 0.1, 0, 0, 1, 0, 0, 0, 2); for (let k = 0; k < 6; k++) fl.v(Math.cos(k / 6 * TAU) * 0.075, 0.055, Math.sin(k / 6 * TAU) * 0.075, 0, 1, 0, 1, 0, 2); for (let k = 0; k < 6; k++) fl.idx.push(b, b + 1 + k, b + 1 + (k + 1) % 6); }
      const lot = new THREE.InstancedMesh(fl.finish(), underMat({
        skins: 1, tints: PALE.map((t) => lit(t)), wobble: 0.01, biteScale: 0.3,
        fragMod: 'float pmd = vCut.z > 1.5 ? 1. : pow(max(sin(3.14159 * pow(clamp(vCut.y, 0., 1.), 0.72)), 0.), 0.62) - abs(vCut.x); if (pmd < 0.) discard; float fpm = fwidth(pmd) + 1e-4; r = 0.5; wy = 9.;',
        fragPost: /* glsl */`
          { vec3 pOut = mix(uRose, uCitron, 0.16), pIn = mix(uRose, uCitron, 0.5), pc = mix(pOut, pIn, step(0.5, vCut.z));
            pc = mix(mix(pc, uAub, 0.2), pc, aaStep(0.36, vCut.y + 0.1 * abs(vCut.x), fwidth(vCut.y) + 1e-4));   // deeper toward its foot: the second tone
            pc = mix(mix(g, max(g, uCitron), 0.94), pc, aaStep(0.085, pmd, fpm));                             // the pale cut rim
            col = mix(pc, mix(uHoney, uAub, 0.45), step(1.5, vCut.z)); }`,
        vertexMove: /* glsl */`
          float lph = 0.;
          #ifdef USE_INSTANCING
            lph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.4;
          #endif
          float lop = smoothstep(0.17, 0.21, uProgress);
          p.xz *= mix(0.3, 1., lop) * (1. + 0.06 * sin(uTime * 0.5 + lph) * p.y * 3.); p.y *= mix(1.5, 1., lop);` }), lotus.length);
      { const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), Y1 = new THREE.Vector3(0, 1, 0);
        lotus.forEach(([x, z, sc, rot, y, ax], i) => {
          if (ax) { dummy.position.set(x, y, z); dummy.quaternion.copy(qa.setFromUnitVectors(Y1, ax)).multiply(qb.setFromAxisAngle(Y1, rot)); dummy.scale.set(sc, sc, sc); }   // (p3 hall2) the great one, turned: its own +y is the way it opens
          else { dummy.position.set(x, -0.07, z); dummy.rotation.set(0, rot, 0); dummy.scale.set(sc, -sc, sc); }
          dummy.updateMatrix(); lot.setMatrixAt(i, dummy.matrix); }); }
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      lot.name = 'lotus'; lot.frustumCulled = false; lot.userData.lotus = lotus; scene.add(lot); hall.push(lot);
      await ctx.yield();
    }
    // ---- (p3 hall3) THE SHAFTS' MESH: each band five rows from the skin to the bed, widening a little as it falls. cut = (across -1..1,
    //      along 0..1, 0); aK = (the shaft's own phase, its length in metres). Its glass: THREE CUT LAYERS of the pale rim's own
    //      tone over the hall's ground (the nearer the heart the paler: pale honey to citron), hard-edged; the heart a ray of its
    //      own with clear water either side of it, a thinner slit between the two flank layers; all three run on into the bed.
    if (shafts.length) {
      const c = new Cutter().withExtra(2), A1 = new THREE.Vector3(), A2 = new THREE.Vector3(), AX = new THREE.Vector3(), NS = 4;
      for (const sh of shafts) {
        AX.set(sh.foot[0] - sh.top[0], sh.foot[1] - sh.top[1], sh.foot[2] - sh.top[2]); const len = AX.length(); AX.normalize();
        A1.set(-sh.sun[1], 0, sh.sun[0]); A2.crossVectors(AX, A1).normalize(); c.cur[0] = sh.ph; c.cur[1] = len;
        for (const A of [A1, A2]) { const b = c.count;
          for (let j = 0; j <= NS; j++) { const f = j / NS, hw = sh.hw * (1 + 0.3 * f), px = sh.top[0] + AX.x * len * f, py = sh.top[1] + AX.y * len * f, pz = sh.top[2] + AX.z * len * f;
            for (const sd of [-1, 1]) c.v(px + A.x * hw * sd, py + A.y * hw * sd, pz + A.z * hw * sd, 0, 1, 0, sd, f, 0); }
          for (let j = 0; j < NS; j++) { const q = b + j * 2; c.idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
      }
      const shaftMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...GU },
        vertexShader: `attribute vec3 cut; attribute vec2 aK; uniform float uTime; varying vec3 vWpos, vCut; varying vec2 vK;
          void main(){ vec3 p = position; p.xz += vec2(sin(uTime * 0.33 + aK.x), cos(uTime * 0.27 + aK.x * 1.7)) * ${(SHAFT.sway * 0.7).toFixed(3)} * cut.y;
            vCut = cut; vK = aK; vWpos = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
        fragmentShader: /* glsl */`
          ${GLASS_GLSL} varying vec3 vWpos, vCut; varying vec2 vK;
          void main(){
            vec3 V = vWpos - cameraPosition; vec3 d = V / max(length(V), 1e-4); vec3 g = hallGround(d);
            float a = abs(vCut.x), t = vCut.y, fa = fwidth(vCut.x) + 1e-4;
            float wn = gNoise(vec2(t * vK.y * 0.8 + vK.x * 7., vK.x * 3.)) - 0.5, wn2 = gNoise(vec2(t * vK.y * 1.7 + vK.x * 13., 4.4 + vCut.x * 0.2)) - 0.5;
            // the layers' half widths: each draws in as it falls and is cut off by the bed; a clear slit of water between the heart and the flanks, and a thinner one between the middle and the outer layer (the band's ribs)
            float h1 = (0.96 + 0.08 * wn) * (1. - 0.38 * smoothstep(0.45, 1., t)), h2 = (0.64 + 0.1 * wn2) * (1. - 0.42 * smoothstep(0.35, 1., t)), h3 = 0.2 * (1. - 0.4 * smoothstep(0.6, 1., t)), gap = (0.33 + 0.07 * wn2) * (1. - 0.3 * smoothstep(0.35, 1., t));
            float in1 = aaStep(a, h1, fa), in2 = aaStep(a, h2, fa), in3 = aaStep(a, h3, fa), clr = aaStep(h3, a, fa) * aaStep(a, gap, fa), slit = aaStep(h2 + 0.015, a, fa) * aaStep(a, h2 + 0.075, fa);
            if (max(in1, in3) < 0.5 || (clr > 0.5 && in3 < 0.5) || slit > 0.5) discard;
            vec3 pale = max(g, uCitron);
            vec3 col = mix(g, pale, 0.4); col = mix(col, mix(g, pale, 0.66), in2); col = mix(col, mix(mix(g, pale, 0.9), uHoney, 0.12), in3);
            ${WELL_UNDER}
            gl_FragColor = vec4(col, 1.);
          }` });
      const sm = new THREE.Mesh(c.finish({ extraName: 'aK' }), shaftMat); sm.name = 'shafts'; sm.frustumCulled = false; sm.userData.shafts = shafts; sm.userData.why = why; sm.userData.sway = SHAFT.sway; scene.add(sm); hall.push(sm);
      await ctx.yield();
    }
    // ---- the two pads beside the touches: on the skin, in the pads' own material (placed by its vertex shader from aX)
    if (wellPads.length) {
      const c = new Cutter().withExtra(4);
      for (const [x, z, sz, rot, sd] of wellPads) { const b = c.count; c.cur[0] = x; c.cur[1] = z; c.cur[2] = sd; c.cur[3] = sz;
        for (const [u, v] of OCT) c.v(Math.cos(rot) * u - Math.sin(rot) * v, 0, Math.sin(rot) * u + Math.cos(rot) * v, 0, 1, 0, u, v, 0);   // (p3 hall3) eight-sided, as the vault's discs
        for (let k = 1; k < 7; k++) c.idx.push(b, b + k, b + k + 1); }
      const wp = new THREE.Mesh(c.finish({ extraName: 'aX' }), padsMat); wp.name = 'well-pads'; wp.frustumCulled = false; scene.add(wp); wellPadsMesh = wp;
    }
    // ---- THE NYMPH CHAINS: ten double strands (eight of the second round, and one more in each end stretch) climbing from the bed to the skin, in the column's closed form of time (each
    //      nymph climbs its strand and begins again; a strand of foil and a strand of thin amber skins wind round each other).
    //      2,240 nymphs times the quality's detail, dealt in turn to the ten chains. Each is one quad that lies along its strand, turned its own way
    //      about it and rolling slowly (the foil turns); nothing of it is turned, sized or placed by the eye.
    const chainR = (hh, h) => 0.55 * Math.exp(-hh / 0.8) + 0.16 + 0.12 * h;   // the strand's radius: a skirt at the bed, then a waist (the same law in the shader)
    for (let i = 0; i < 8; i++) {   // (p3 hall2: eight; two more stand in the garden, at z 124 and beside the rise at z 131) z 78 to 130 (the plan's reach): the first stands just beyond the first touch, where the round looks down on it
      const z = (i < 6 ? 78.4 + i * 10.2 : i === 6 ? 124.3 : 131.0) + hl.range(-0.4, 0.6), ph = hl.range(0, TAU); let side = i % 2 ? 1 : -1, off = hl.range(3.6, 6.5); if (i === 0 || i === 7) off = 3.3;   // the first as near as its clear air lets it stand
      for (let tries = 0; tries < 16; tries++, off += 0.3) {
        let x = lineX(z) + side * off; if (x < tubA(z) + 1.4 || x > tubB(z) - 1.4) { side = -side; x = lineX(z) + side * off; if (x < tubA(z) + 1.4 || x > tubB(z) - 1.4) continue; }
        const yb = tubY(x, z), H = -0.2 - yb; let ok = true;
        for (let k = 0; k <= 20 && ok; k++) { const h = k / 20; if (lineD(x, yb + 0.12 + h * H, z) - chainR(h * H, h) - 0.26 < 3.04) ok = false; }
        if (ok) { chains.push([x, z, yb, ph]); break; }
      }
    }
    // (p3 hall3) a second garland in each end stretch (from the ends' fork): at two fifths of the first, to starboard; at the far end of the second, to port
    ENDS.forEach(([z0, z1], b) => { const z = z0 + (z1 - z0) * (b ? 0.93 : 0.36) + h3.range(-0.5, 0.5), ph = h3.range(0, TAU); let side = b ? -1 : 1, off = 3.3;
      for (let tries = 0; tries < 20; tries++, off += 0.3) {
        let x = lineX(z) + side * off; if (x < tubA(z) + 1.4 || x > tubB(z) - 1.4) { side = -side; x = lineX(z) + side * off; if (x < tubA(z) + 1.4 || x > tubB(z) - 1.4) continue; }
        const yb = tubY(x, z), H = -0.2 - yb; let ok = !chains.some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.2) && !shafts.some((q) => Math.hypot((q.top[0] + q.foot[0]) / 2 - x, (q.top[2] + q.foot[2]) / 2 - z) < 1.6);
        for (let k = 0; k <= 20 && ok; k++) { const h = k / 20; if (lineD(x, yb + 0.12 + h * H, z) - chainR(h * H, h) - 0.26 < 3.04) ok = false; }
        if (ok) { chains.push([x, z, yb, ph]); break; }
      } });
    if (chains.length) {
      const nN = Math.round(2240 * detail), g = new THREE.InstancedBufferGeometry(), seed = new Float32Array(nN * 4), ch = new Float32Array(nN * 4);
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      for (let i = 0; i < nN; i++) { for (let k = 0; k < 4; k++) seed[i * 4 + k] = hl(); const q = chains[i % chains.length]; ch.set(q, i * 4); }
      g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aCh', new THREE.InstancedBufferAttribute(ch, 4)); g.instanceCount = nN;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-9, -2.5, 104), 1e5);
      const chainMat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide, uniforms: { ...GU, uAmberT: { value: lit(T.amber) } },
        vertexShader: /* glsl */`
          attribute vec4 aSeed, aCh; uniform float uTime;
          varying vec2 vQ; varying vec3 vWpos; varying vec3 vInfo;
          void main(){
            float H = -0.2 - aCh.z, arm = floor(aSeed.x * 2.);
            float h = fract(aSeed.z + uTime * (0.014 + 0.006 * aSeed.w));        // every nymph climbs its chain and begins again
            float hh = h * H, R = 0.55 * exp(-hh / 0.8) + 0.16 + 0.12 * h;        // a skirt at the bed, then a waist
            float th = arm * 3.14159 + hh * 1.9 - uTime * 0.2 + aCh.w + (aSeed.y - 0.5) * 0.45;
            vec3 c = vec3(aCh.x + cos(th) * R, aCh.z + 0.12 + hh, aCh.y + sin(th) * R);
            vec3 rad = vec3(cos(th), 0., sin(th)), fw = normalize(vec3(-sin(th) * 1.9 * R, 1., cos(th) * 1.9 * R)), tng = normalize(cross(fw, rad));   // nose up the strand
            float roll = aSeed.w * 6.2831 + uTime * 0.6 * (aSeed.y - 0.5);
            vec3 side = rad * cos(roll) + tng * sin(roll);
            float L = 0.17 * (0.8 + 0.5 * fract(aSeed.w * 7.3)), k = smoothstep(0., 0.04, h) * (1. - smoothstep(0.96, 1., h));
            vec3 p = c + (fw * position.x * L + side * position.y * L * 0.42) * k;
            vQ = position.xy; vWpos = p; vInfo = vec3(0.5 + 0.5 * sin(uTime * (1.5 + 2. * aSeed.z) + aSeed.w * 40.), aSeed.w, arm);
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`
          ${GLASS_GLSL}
          uniform vec3 uAmberT; varying vec2 vQ; varying vec3 vWpos; varying vec3 vInfo;
          void main(){
            vec3 V = vWpos - cameraPosition; vec3 d = V / max(length(V), 1e-4);
            vec3 g = hallGround(d);
            float x = vQ.x, y = vQ.y, fwq = max(fwidth(vQ.x), fwidth(vQ.y)), fine = 1. - smoothstep(0.25, 0.6, fwq);
            // a nymph: broad head and thorax, the abdomen tapering to three tails (wheel lines); far off, one fleck
            float hw = mix(0.22, 0.95, smoothstep(-0.55, 0.35, x)) * (1. - 0.7 * smoothstep(0.7, 1., x)) * step(-0.6, x);
            float r = 1. - abs(y) / max(hw, 1e-3), fr = fwidth(r);
            float tl = clamp((-0.55 - x) / 0.45, 0., 1.);
            float tail = max(wheelLine(abs(y) - 0.8 * tl, 0.1, fwq), wheelLine(y, 0.1, fwq)) * step(x, -0.55) * fine;
            if (r < 0. && tail < 0.3) discard;
            vec3 skin = g * mix(vec3(1.), uAmberT, 0.85), foil = mix(uHoney, uFoil, 0.25 + 0.75 * vInfo.x);
            float fl = aaStep(0.5, gNoise(vQ * vec2(2.2, 1.6) + vInfo.y * 37.), fwq * 3.);
            vec3 col = mix(mix(foil, skin, fl * 0.6 * fine), mix(skin, foil, fl * step(0.1, x) * 0.8 * fine), step(0.5, vInfo.z));
            col = mix(mix(g, max(g, uCitron), 0.5), col, mix(1., aaStep(0.14, r, fr), fine * step(0., r)));
            if (r < 0.) col = skin;
            ${WELL_UNDER}
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      const nymphs = new THREE.Mesh(g, chainMat); nymphs.name = 'chains'; nymphs.frustumCulled = false; nymphs.userData.chains = chains; scene.add(nymphs); hall.push(nymphs);
    }
    await ctx.yield();
    // ---- (p3 hall3) BEADS OF AIR: loose strings of small solids (eight-faced, pale honey with a citron upper half) rising from the bed and
    //      from the burrow colonies to the skin on the world's clock, each bead beginning again at its string's foot (the chains'
    //      closed form of time). Four strings from the bed in the first end stretch and five in the second (each on to 5 m beyond its stretch), one from
    //      every colony; twelve beads to a string at detail 1 (fifteen strings: 1,440 triangles at most). A string wanders 0.07 m; clear air 2.2 m round its whole column.
    const BEAD = { n: 12, wob: 0.07, r: [0.045, 0.085] }, strings = [];
    { const col = (x, yb, z) => { for (let k = 0; k <= 10; k++) if (lineD(x, yb + (-0.08 - yb) * k / 10, z) - BEAD.wob - BEAD.r[1] * 1.2 < 2.26) return false; return !shafts.some((q) => Math.hypot((q.top[0] + q.foot[0]) / 2 - x, (q.top[2] + q.foot[2]) / 2 - z) < 1.2); };
      ENDS.forEach(([z0, z1], b) => { const nS = b ? 5 : 4, zE = z1 + 5; for (let i = 0, tries = 0; i < nS && tries < 200; tries++) {
        const z = z0 + (zE - z0) * (i + h3.range(0.1, 0.9)) / nS, x = lineX(z) + ((i + b) % 2 ? 1 : -1) * h3.range(2.6, 5.6), ph = h3.range(0, TAU);
        if (!onFloor(x, z, 0.3) || !col(x, tubY(x, z), z)) continue; strings.push([x, tubY(x, z) + 0.05, z, ph]); i++; } });
      for (const [zc, , sd = -1] of [...(scene.getObjectByName('burrows')?.userData.colonies || []), ...(scene.getObjectByName('burrows-starboard')?.userData.colonies || [])]) { const z = zc + h3.range(-1.2, 1.2), ph = h3.range(0, TAU), P = secX(sd, z), x = P[2][0] - sd * 0.22, yb = (P[1][1] + P[2][1]) / 2; if (col(x, yb, z)) strings.push([x, yb, z, ph]); } }
    if (strings.length) {
      const nB = Math.max(4, Math.round(BEAD.n * detail)), V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], F = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
      const pos = [], aB = [], aS = [];
      for (const [x, yb, z, ph] of strings) for (let k = 0; k < nB; k++) { const sd = (k + h3.range(0.1, 0.9)) / nB, sz = h3.range(BEAD.r[0], BEAD.r[1]);
        for (const f of F) for (const vi of f) { pos.push(...V[vi]); aB.push(x, yb, z, -0.08 - yb); aS.push(sd, sz, ph + k * 2.4); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 4)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 3));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-9, -2.5, 104), 1e5);
      const beadMat = new THREE.ShaderMaterial({ uniforms: { ...GU },
        vertexShader: /* glsl */`
          attribute vec4 aB; attribute vec3 aS; uniform float uTime; varying vec3 vWpos; varying float vUp;
          void main(){
            float h = fract(aS.x + uTime * 0.045);                                   // every bead rises its string and begins again
            vec2 wob = vec2(sin(uTime * 0.9 + aS.z + h * 9.), cos(uTime * 0.7 + aS.z * 1.3 + h * 7.)) * ${BEAD.wob.toFixed(3)} * smoothstep(0., 0.25, h);
            float s = aS.y * (0.6 + 0.6 * h) * smoothstep(0., 0.03, h) * (1. - smoothstep(0.975, 1., h));   // it swells as it rises, and is nothing where it begins and where it meets the skin
            vec3 p = vec3(aB.x + wob.x, aB.y + h * aB.w, aB.z + wob.y) + position * s * vec3(1., 0.8, 1.);
            vUp = position.y; vWpos = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
          }`,
        fragmentShader: /* glsl */`
          ${GLASS_GLSL} varying vec3 vWpos; varying float vUp;
          void main(){
            vec3 V = vWpos - cameraPosition; vec3 d = V / max(length(V), 1e-4); vec3 g = hallGround(d);
            vec3 pale = mix(g, max(g, mix(uHoney, uCitron, 0.5)), 0.85);
            vec3 col = mix(pale, max(g, uCitron), aaStep(0.18, vUp, fwidth(vUp)));   // two cut tones: pale honey beneath, citron over
            ${WELL_UNDER}
            gl_FragColor = vec4(col, 1.);
          }` });
      const beads = new THREE.Mesh(g, beadMat); beads.name = 'beads'; beads.frustumCulled = false; beads.userData.strings = strings; beads.userData.law = BEAD; scene.add(beads); hall.push(beads);
      await ctx.yield();
    }
    // ---- (p3 hall3) ONE SHOAL: TWELVE GREAT RIVER FISH (1.1 to 1.5 m long) in a cameo cut, each a solid with thickness (a deep spindle of
    //      four sides and a tail wedge), never turned to the eye: a pale belly edge, two tones of flank, a darker spine, hard-edged.
    //      THEIR PLACE IS A LAW OF PROGRESS ALONG THE ROUTE (shoalAt, metres of route), to port of the line and never under it (the
    //      deeper line leaves no 3 m of clear air between itself and the bed): until 92 m they hold station 6.2 m to port of the
    //      route's point at 117 m; from 92 to 116 m they swim slowly up the nave (to the point at 125.5 m, so that we come up on them to 9.5 m);
    //      from 116 to 133 m they DART AHEAD TOGETHER at our own pace, to the point at 142.5 m, and TURN TOGETHER as they go, toward the wall and back
    //      (SHOAL.swing metres either way); there they stay. Every fish keeps its own place in the shoal (a file 9 m long, 1 m
    //      wide, in two staggered rows) and swims in mid water (2.1 to 3.3 m under the skin), never nearer the ground than 0.5 m; its fin beat is a loop on
    //      the world's clock (the shader), its little rise and fall too. Never nearer the flown line than 3.0 m (hall3/prints/clear-*.txt).
    const SHOAL = { m0: 92, m1: 116, m2: 133, q0: 117, q1: 125.5, q2: 142.5, lat: -6.2, swing: 0.35, n: 12 }, shoalFish = [], shoalO = {};
    for (let i = 0; i < SHOAL.n; i++) shoalFish.push({ a: -4.5 + 9 * (i + hg.range(0.25, 0.75)) / SHOAL.n, b: (i % 2 ? 1 : -1) * hg.range(0.2, 0.5), y: 0.25 + 0.35 * ((i * 5) % SHOAL.n + hg()) / SHOAL.n, L: hg.range(1.1, 1.5), ph: hg.range(0, TAU) });
    const shoalC = (m) => { const mm = clamp(m, SHOAL.m0, SHOAL.m2), w = clamp((mm - SHOAL.m1) / (SHOAL.m2 - SHOAL.m1), 0, 1), q = SHOAL.q0 + (SHOAL.q1 - SHOAL.q0) * clamp((mm - SHOAL.m0) / (SHOAL.m1 - SHOAL.m0), 0, 1) + (SHOAL.q2 - SHOAL.q1) * w * w * (3 - 2 * w), lat = SHOAL.lat - SHOAL.swing * Math.sin(w * TAU);
      const p = route.posAtDist(q), t = route.tangentAtDist(q), tl = Math.hypot(t.x, t.z) || 1; return [p.x + t.z / tl * lat, p.z - t.x / tl * lat]; };   // the shoal's middle, in plan
    // the shoal at m metres of route (and, for the rise and fall alone, at the world's clock): out[i] = [x, y, z, heading x, heading z, length]
    const shoalAt = (m, time, out) => { const mc = clamp(m, SHOAL.m0 + 0.8, SHOAL.m2 - 0.8), c = shoalC(m), a = shoalC(mc - 0.75), b = shoalC(mc + 0.75), hl2 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, hx = (b[0] - a[0]) / hl2, hz = (b[1] - a[1]) / hl2;
      shoalFish.forEach((f, i) => { const x = c[0] + hx * f.a + hz * f.b, z = c[1] + hz * f.a - hx * f.b, mid = -3.3 + (f.y - 0.25) * 3.4;
        out[i] = [x, Math.max(tubY(x, z) + 0.5, mid) + 0.06 * Math.sin(time * 0.7 + f.ph), z, hx, hz, f.L]; }); return out; };
    let shoal = null;
    { const c = new Cutter(), RG = [[0.3, 0.12, 0.07], [0.02, 0.19, 0.1], [-0.28, 0.07, 0.035]];   // [along, half height, half width] of the body's three rings, in lengths
      c.v(0.5, 0, 0, 1, 0, 0, 0.45, 9, 0);
      for (const [x, hh, hw] of RG) { c.v(x, hh, 0, 0, 1, 0, 1, 9, 0); c.v(x, 0, hw, 0, 0, 1, 0.52, 9, 0); c.v(x, -hh, 0, 0, -1, 0, 0, 9, 0); c.v(x, 0, -hw, 0, 0, -1, 0.52, 9, 0); }
      c.v(-0.52, 0.24, 0, 0, 1, 0, 0.75, 9, 0); c.v(-0.52, -0.24, 0, 0, -1, 0, 0.1, 9, 0);
      for (let k = 0; k < 4; k++) c.idx.push(0, 1 + k, 1 + (k + 1) % 4);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const p = 1 + r * 4 + k, q = 1 + r * 4 + (k + 1) % 4; c.idx.push(p, p + 4, q, q, p + 4, q + 4); }
      c.idx.push(9, 13, 10, 10, 13, 14, 10, 14, 11, 9, 12, 13, 12, 14, 13, 12, 11, 14);   // the tail: from the last ring (top 9, right 10, bottom 11, left 12) to its upper and lower points (13, 14)
      shoal = new THREE.InstancedMesh(c.finish(), underMat({
        skins: 1, biteScale: 0.3, wobble: 0.01, tints: [lit(tp(T.amber, 0.15)), lit(tp(T.amber, 0.5)), lit(tmul(T.amber, tp(T.aubergine, 0.3)))],
        // cut.x: 0 at the belly's keel, 0.52 along the flanks' middle, 1 at the spine
        fragPost: /* glsl */`
          { float fcx = fwidth(vCut.x) + 1e-4; vec3 flank = mix(uRose, uHoney, 0.55);
            col = mix(mix(g, max(g, uCitron), 0.92), mix(flank, max(g, uCitron), 0.3), aaStep(0.09, vCut.x, fcx));   // the pale belly edge, the lower flank
            col = mix(col, flank, aaStep(0.5, vCut.x, fcx)); col = mix(col, mix(flank, uAub, 0.55), aaStep(0.8, vCut.x, fcx)); }`,   // the upper flank, the darker spine
        vertexMove: /* glsl */`
          float fph = 0.;
          #ifdef USE_INSTANCING
            fph = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 2.3;
          #endif
          p.z += sin(uTime * 4.5 + fph - p.x * 5.) * 0.07 * (0.25 - p.x);` }), shoalFish.length);   // the fin beat: the body's wave, widest at the tail, on the world's clock
      shoal.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shoal.frustumCulled = false; shoal.name = 'shoal'; shoal.userData.at = shoalAt; shoal.userData.law = SHOAL; scene.add(shoal); hall.push(shoal);
    }
    const shoalSet = (m, time) => { shoalAt(m, time, shoalO); const X = new THREE.Vector3(), Yv = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(), S = new THREE.Vector3(), M = new THREE.Matrix4();
      for (let i = 0; i < shoalFish.length; i++) { const q = shoalO[i]; X.set(q[3], 0, q[4]); Z.set(-q[4], 0, q[3]); M.makeBasis(X, Yv, Z).scale(S.set(q[5], q[5], q[5])).setPosition(q[0], q[1], q[2]); shoal.setMatrixAt(i, M); }
      shoal.instanceMatrix.needsUpdate = true; };
    shoalSet(0, 0);
    // (p3) the world above the hall: everything of this world but the blank, the hall (basin, burrows, ceiling and what stands
    // in it) and what rides with the eye. While the route's own point lies deeper under the skin than the well reaches (its
    // round on the skin has closed, ragged rim and all), no sight line from the hall ends on any of it, and it rests (update):
    // a far thing seen exactly edge-on could otherwise come through the wall as a single pixel of the wrong depth
    // (trial/prints/speck.txt)
    const hallSet = new Set([ceiling, ...hall]);
    // (p3 hall3) THE HALL IS SHOWN BY PROGRESS: every mesh of it (the basin, the burrows, the ceiling and all that stands under the skin) is
    // drawn only while the round has a radius, u HALL_U[0] to HALL_U[1] (62.1 to 152.7 m of route: wellR's own bounds, the ceiling's
    // as they were): outside it every fragment of them was discarded anyway (WELL_UNDER, WELL_SKIN). The two pads beside the touches
    // lie ON the skin and are seen from above like any pad: they are shown from the start until u HALL_U[1].
    const hallShown = [ceiling, ...hall, ...scene.children.filter((o) => o.name === 'tub' || o.name.startsWith('burrows'))]; let hallOn = true;
    const hallShow = (on) => { if (on === hallOn) return; hallOn = on; for (const o of hallShown) o.visible = on; };
    hallShow(false);
    const above = scene.children.filter((o) => o !== sky && o !== carried && !hallSet.has(o) && o.name !== 'tub' && !o.name.startsWith('burrows'));
    let shut = false;
    await ctx.yield();

    // ---- the flight ---------------------------------------------------------------------------------
    const parkCam = new THREE.PerspectiveCamera(62, 1.6, 0.1, 100);
    parkCam.position.copy(P0); parkCam.lookAt(P0.clone().add(T0)); parkCam.updateMatrixWorld(true);
    const buf = new THREE.Vector2(), camP = new THREE.Vector3();
    const pois = [];
    pois.push({ at: [4.5, 3.6, 49.5], from: 0.02, to: 0.105, weight: 0.4 });                                   // the hogweed bar
    pois.push({ at: [-47, 8, 204], from: 0.245, to: 0.3, weight: 0.45 });                                      // the clay bluff and its martins ((p3 hall) from 0.245, was 0.19: the look begins as we rise to the skin, not in the hall)
    pois.push({ at: [lilySpec[0][0], 0.2, lilySpec[0][1]], from: 0.3, to: 0.365, weight: 0.4 });               // (o5) low over the water lily in flower
    { const a = gateHeads[0], b = gateHeads[1]; pois.push({ at: [(a.x + b.x) / 2 - 9, 14, (a.z + b.z) / 2 + 3], from: 0.455, to: 0.565, weight: 0.36 }); }   // (o5) the gate of umbels, whole
    pois.push({ at: gateHeads[3].clone(), from: 0.565, to: 0.655, weight: 0.6 });                              // (o5) under it, looking up through the spokes
    pois.push({ at: storkSpots[1].clone().setY(1.7), from: 0.37, to: 0.465, weight: 0.5 });                    // the storks
    pois.push({ at: [isletAt[0], 9, isletAt[1]], from: 0.63, to: 0.725, weight: 0.2 });                        // the lone willow on its islet, whole, as the column shows beside it
    pois.push({ at: [colAt[0], 14, colAt[1]], from: 0.64, to: 0.85, weight: 0.55 });                          // (o7) the mayfly column, whole, the low sun beside it
    pois.push({ at: [seat.x, seat.y, seat.z], from: 0.815, to: 0.9, weight: 0.3 });                            // the round cut in the willow wall
    for (const p of pois) { p.from = routeU(p.from); p.to = routeU(p.to); }   // (p3) each look keeps its place on the longer route
    // (p3 hall) THE HALL'S TWO LOOKS, laws of progress along the route (u) and of places in the world, both turned along the angle
    // and kept whole for the steady camera. The vault look: the route's own point 20 m further on, held 2 m over the skin, so the
    // gaze lifts off the bed to the lit ceiling as we go under and stays on it down the nave. The lotus look: the great lotus.
    const vaultP = new THREE.Vector3();
    pois.push({ at: (t, u) => { route.posAtDist(clamp(u, 0, 1) * LR + 20, vaultP); vaultP.y = 2; return vaultP; }, from: 0.125, to: 0.235, weight: 0.55, arc: true, steady: true });
    pois.push({ at: [LOTUS[0] + LOTUS_AX.x * 0.6, LOTUS_Y + LOTUS_AX.y * 0.6, LOTUS[1] + LOTUS_AX.z * 0.6], from: 0.172, to: 0.238, weight: 0.66, fade: 0.18, arc: true, steady: true });   // (p3 hall2) held until the lotus is abeam (119 m), let go over the 6 m after
    // (p3 hall3) THE TWO END LOOKS, laws of progress and of the route's own places, turned along the angle, whole (weight 1) and last, so
    // that where they stand whole the gaze IS theirs: the route's own point END_LOOK.ahead metres further on, held under the route's
    // point here by END_LOOK.drop metres for every END_LOOK.ahead metres of plan between them (a gaze 13.5 degrees under the level:
    // the skin's far edge stands at 0.70 of the frame's height, the ceiling takes its upper three tenths). Whole from 79 to 92 m and
    // from 122 to 133 m of route; eased in over 71 to 79 m and out over 92 to 100 m; in over 113 to 122 m, out over 133 to 142 m.
    const END_LOOK = { ahead: 10, drop: 2.4, at: [[71, 100, 8], [113, 142, 9]] }, endP = new THREE.Vector3(), endQ = new THREE.Vector3();
    const endLook = (t, u) => { const m = clamp(u, 0, 1) * LR; route.posAtDist(m, endQ); route.posAtDist(m + END_LOOK.ahead, endP); endP.y = endQ.y - END_LOOK.drop * Math.hypot(endP.x - endQ.x, endP.z - endQ.z) / END_LOOK.ahead; return endP; };
    for (const [a, b, ease] of END_LOOK.at) pois.push({ at: endLook, from: a / LR, to: b / LR, weight: 1, fade: ease / (b - a), arc: true, steady: true });
    const wellP = new THREE.Vector3();
    const eagleP = new THREE.Vector3(), eagleT = new THREE.Vector3(), tmpM = new THREE.Matrix4(), bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), tv = new THREE.Vector3(), sv = new THREE.Vector3();

    function update(dt, time, camera, u) {
      ctx.renderer.getDrawingBufferSize(buf);
      hero.setViewport(buf.y);
      uRoute = u; const ul = liveU(u);   // (p3) ul: the progress the old line had at this place; everything below that was keyed to u is keyed to it
      hero.setProgress(ul);
      hero.update(dt, time, ctx.through ? parkCam : camera);   // seen through a portal: the escort waits at the entry
      camera.getWorldPosition(camP);
      sky.position.copy(camP);
      // (p3) THE WELL: the route's own point and, across the stretch, its round of 1.2 to 2.4 to 0.24 m (elsewhere none: the world as it was).
      // The hall is shown while there is a round; the world above rests while no hole is open (`shut`); neighbours and wing blur go by
      // underK(u); the shoal and the forelegs are keyed on the lines after
      route.pointAt(u, wellP); GU.uWell.value.set(wellP.x, wellP.y, wellP.z, wellR(u));
      hallShow(u > HALL_U[0] && u < HALL_U[1]); if (wellPadsMesh) wellPadsMesh.visible = u < HALL_U[1];   // (p3 hall3) the hall by progress (the ceiling's own bounds)
      { const now = GU.uWell.value.w > 0 && wellP.y < -(GU.uWell.value.w + 0.1); if (now !== shut) { shut = now; for (const o of above) o.visible = !shut; } }
      wingBlurMat.uniforms.uAway.value = 1 - underK(u);
      if (hallOn) shoalSet(u * LR, time);   // (p3 hall2) the shoal: by progress along the route (its rise and fall by the world's clock); (p3 hall3) its matrices are sent only while the hall is shown
      legsFold.value = foldK(u * LR); legsMesh.visible = legsFold.value < 1;   // (p3 hall2) the forelegs by FOLD: not there at all while they are wholly drawn back
      // (o5) the lamp flares behind the gate of umbels: gentle at the entry, at its hottest from the turn to the gate, sinking
      // as we round the bend; in the same stretch the rose of the wall and the water goes a little smokier, so the flare is the
      // brightest, hottest thing in the flight
      const flare = sstep(0.36, 0.5, ul) * (1 - sstep(0.66, 0.74, ul) * 0.3) * (1 - sstep(0.82, 0.9, ul));
      GU.uSun.value.z = 0.34 + 0.66 * flare;
      // (o7) the lamp is a thing in the vase, a hundred metres behind the gate of umbels: from the entry on, the low sun
      // stands beside the far gate at the end of the reach and its path lies down the water to us; once we are at the
      // gate it is the fixed evening sun of the bend (the same bearing there, so nothing jumps)
      { const lx = lampAt[0] - camP.x, lz = lampAt[1] - camP.z, ll = Math.hypot(lx, lz) || 1, k = sstep(0.46, 0.56, ul);
        const sx = lx / ll + (0.33 - lx / ll) * k, sz = lz / ll + (0.944 - lz / ll) * k, sl = Math.hypot(sx, sz) || 1;
        GU.uSun.value.x = sx / sl; GU.uSun.value.y = sz / sl; }
      GU.uRose.value.copy(rose0).lerp(roseSmoke, 0.75 * flare);
      // martins and hunters: lanes in a window that travels with the eye and overtakes it
      const cl = latOf(camP.x, camP.z);
      // the ribbon arrives with the turn (the same front and flow as the swarm's band)
      ribbonMat.uniforms.uRib.value.set(cl.s - 120 + 240 * clamp((ul - 0.455) / 0.08, 0, 1) + 3000 * sstep(0.53, 0.6, ul), 1.3 * 520 * Math.max(0, ul - 0.47) + time * 1.5, 0, 0);
      for (const F of flocks) {
        for (let i = 0; i < F.lanes.length; i++) {
          const l = F.lanes[i], zz = ((l.z + l.v * time) % 220 + 220) % 220 - 95, s = cl.s + zz, cc = courseAt(s, C);
          const wv = Math.sin(time * l.w + l.ph), dw = Math.cos(time * l.w + l.ph) * l.w * l.amp;
          const lat = (l.close ? cl.lat : 0) + l.lat + wv * l.amp;
          const y = Math.max(0.35, (l.close ? camP.y : 0) + l.y + Math.sin(time * l.w * 1.7 + l.ph * 2) * (l.close ? 0.3 : 1.3));
          const yw = Math.atan2(dw, 13 + l.v), hx = cc.tx * Math.cos(yw) + cc.tz * Math.sin(yw), hz = cc.tz * Math.cos(yw) - cc.tx * Math.sin(yw);
          bx.set(hx, 0, hz); by.set(0, 1, 0); bz.set(-hz, 0, hx).negate(); by.addScaledVector(bz, -yw * 1.5).normalize(); bz.crossVectors(bx, by);
          const S = F.sc * l.sc * sstep(-95, -85, zz) * sstep(125, 110, zz);
          tmpM.makeBasis(bx, by, bz).scale(sv.set(S, S, S)).setPosition(cc.x + cc.tz * lat, y, cc.z - cc.tx * lat);
          F.mesh.setMatrixAt(i, tmpM);
        }
        F.mesh.instanceMatrix.needsUpdate = true;
      }
      if (eagle) { // crosses 10 m ahead at u 0.66, port to starboard
        const k = (ul - 0.66) / 0.05, on = sstep(1.25, 1.05, Math.abs(k));
        route.pointAt(Math.min(1, u + 10 / 520), eagleP); route.tangentAt(Math.min(1, u + 10 / 520), eagleT);
        const rx = eagleT.z, rz = -eagleT.x, lat = k * 22, S = 2.7 * Math.max(0.001, on);   // (rx, rz) points to starboard (+X at the entry)
        bx.set(eagleT.x * 0.77 + rx * 0.64, 0, eagleT.z * 0.77 + rz * 0.64).normalize();        // going away and across
        by.set(-bx.z * 0.3, 1, bx.x * 0.3).normalize(); bz.crossVectors(bx, by);                 // banked, so the spread wings show
        tmpM.makeBasis(bx, by, bz).scale(sv.set(S, S, S)).setPosition(eagleP.x + rx * lat + eagleT.x * k * 3, eagleP.y + 1.3 + 0.5 * Math.cos(k * 2.), eagleP.z + rz * lat + eagleT.z * k * 3);
        eagle.matrixAutoUpdate = false; eagle.matrix.copy(tmpM); eagle.matrixWorldNeedsUpdate = true;
        ribbonMat.uniforms.uHole.value.set(tmpM.elements[12], tmpM.elements[14], 7, on);   // the band parts round it and closes
      }
      // the mount rides with the eye; absent while the world is only seen through a portal
      carried.visible = !ctx.through;
      camera.updateWorldMatrix(true, false);
      carried.matrixAutoUpdate = false; carried.matrix.copy(camera.matrixWorld); carried.matrixWorldNeedsUpdate = true;
    }

    return {
      scene, path: route, duration: 45.97,
      // slow over the bloom, a little quicker up to the bluff, lingering past the storks, hurried through the turn, slow in the band
      // (p3) and at 0.48 of that pace across the stretch (u 0.12 to 0.29, 63.2 to 152.7 m of route, eased over 0.02 at each end; the route is under the skin from 74.2 to 140.4 m); the duration is longer by what that takes, so the pace elsewhere is as it was
      pace: (u) => { const ul = liveU(u); return (0.85 + 0.2 * sstep(0.1, 0.28, ul) - 0.12 * sstep(0.36, 0.4, ul) + 0.32 * sstep(0.46, 0.5, ul) - 0.4 * sstep(0.5, 0.58, ul) + 0.15 * sstep(0.85, 0.9, ul)) * (1 - 0.52 * bump(0.12, 0.29, u, 0.02)); },
      camera: { fov: 62, near: 0.06, far: 3400, sway: 0.5, bank: 0.6, nearThrough: 0.3, lookAhead: clamp(LL * 0.05, 8, 40) },   // (p3) lookAhead: what the engine took from the old line's length, so the gaze reaches as far ahead as it did
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F7D56A', glow: 0.25, revealDistance: 320, blendDistance: 25, veil: '#EFE8A6' },   // (o7) until the next world shows, the opening is the pale round cut through to the blank, not a swirl
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
