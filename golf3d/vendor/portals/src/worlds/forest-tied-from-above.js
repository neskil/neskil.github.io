// The Forest Tied from Above: macrame. Nothing stands, everything hangs: cream three-ply cotton knotted downward
// out of a rose void, fringes trailing in a flat indigo sea, and two bundles of ropes that tie one square knot
// across the course while we fly through its eye. Unlit, flat post (no tone map): every pixel is a palette colour.
// All shading comes from the hero part's style kit (cordMaterial / beechMaterial / sea / void), on ONE uniform set
// made per build (hero.style): nothing is shared between two instances of the world.
// Everything within 30 m of the camera is rope at true gauge: the spiral trunk is four hawser strands, each ten real
// 0.6 m three-ply ropes laid over a core, with real half-knot wraps; the sleeve's meetings are real square knots (two
// working ropes round four); the Knot's bundles carry 30 real ropes each. The forest is sinnet trunks ending in
// combed tassels of separate strands, six see-through net trunks and sixteen turning cradles with their great beads;
// beech beads are discs that face the eye (flat, exact round). Dipped tips draw wake arcs on the sea, beads plop. The fringe rows hang below the sight line to the Knot and end before the eye opens;
// far curtains thin strand by strand (never a sheet). The kink is keyed to the journey clock (u), not wall time.
// Near ropes (trunk, wraps, sleeve, cradles, carriers) draw a close lay when they are near enough to count plies and
// the long lay beyond (cordMaterial fine: true); the hawser's ropes carry a thin cord-on-cord line on their outlines
// (valleyRim) and the wraps ride over each strand's crown and down into the valley. Every dowel and the exit ring
// carry a lark's head at each strand, drawn in the wood's own material (LARK_GLSL), and each carrying rope ends in a
// rope collar. The dipped tips' wakes stream towards the Knot as pairs of arcs; two of the six beads plop ahead of
// the last rows.
// Fix 3 (after review 3 and two outside reviews): the sleeve is a loose curtain at the entry and the zip of square
// knots comes down past us on the spiral (FRONT); the gaze is lifted from the start of the turn, comes down the trunk
// to the sea for its last quarter, dips to the water in the corridor and glances at a hauled tail before the ring;
// tassel-moths are an escort hung along the course (tan bead, cream wings with dipped tips), those on the spiral
// lifting off the trunk, and a flight of a dozen crosses the entry; hitch-climbers are loops inching up the sleeve's
// ropes; tassel ends and wing tips are dipped; knots, wraps and sinnets sit a tone deeper (cordMaterial tone); the
// exit ring's pale band runs round its near face and each of its four ropes ends in a collar; the sea meets the void
// in a soft seam; the spiral trunk seen from afar is a calm column (rim, lay and core tone fade with pixel size).
// Fix 4 (after review 4 and two outside reviews): tone is how much cord lies on cord, used at full strength (the
// Knot's crossings and the inside of its eye, the trunk's half-knot wraps, the net's square knots and the lark's heads
// take the groove tint; single cords and fringes stay crown cream); distance is three planes (style kit); the Knot's
// first move is under way at the entry, so the two bundles lean together from the first second; the entry leg starts
// 14 m later, which puts the look past the trunk to the half-tied Knot, framed by a diamond of the net, at u 0.34;
// the gaze is ONE scripted poi (gazeAt); a moth's wing is a comb of separate strands cut out in its own shader; the
// rows about the ring are fringes of rope and leave the water under the hauled tails open for the drops.
// Fix 5 (after review 5 and two outside reviews): the entry is three shapes in open rose (the spiral trunk and the two
// great bundles): the sleeve hangs gathered in three hanks behind the trunk and is let go as we arrive (uGather), the
// forest keeps out of the wedge the entry looks down (entryOpen) and is gone into the void by 520 m (farFade), the far
// ranks stand in groups, the corridor rows' carrying ropes hang one behind the other as the entry sees them, and the
// bundles are laid only a third of the way at 0 s, so each hangs plumb in its own window. The gaze: the sea keeps the
// lower third round the spiral; the first look at the Knot is held to its left until the trunk has gone by; inside the
// fringe (u 0.52) it turns to the rows on the left hand; no glance up inside the eye; a longer look at a hauled tail.
// A moth's wing is fringe at every size (ten strands, then five thick ones with notches, each its own length and tide).
// The spiral trunk sits a tone under a plain rope (it is knot all the way down). The exit is a bare hole in the beech
// ring: one flat tint of the void until the next world shows (portal.veil, frame 0).
// Fix 6 (after review 6 and four outside reviews): rope is ROUND where it is near. Every near rope (the sleeve, the
// trunk's forty, its half-knot wraps, the square knots, carriers and strays, the Knot's riding ropes) hands the style
// kit its centreline (ctrL in the vertex body); the kit then draws the lay as it lies on a cylinder (three grooves,
// each a lens-shaped S across the crown) and cuts the outline in where a groove meets the flank, so each ply bulges.
// The Knot's drawn cords get the same lay and a scalloped valley; its bearing tone ends cord by cord. Distance is
// the void in four plain steps (far ranks plainly rosier; a third of the far ribbons left out). On the spiral the
// lower third is drawn: wide rings open from the trunk's tassel over the sea (hero sea, uRing) and six loose ropes
// of the sleeve end level with the flight in dipped tassels, two with beads (let down as the sleeve is let go).
// The entry: the flight keeps just ahead of us, the framing cradle and tassels stand whole inside the frame, the
// curtain parts where we come in. The fringe rows are combs (two strands of every three, wakes from every fourth).
// Inside the fringe (u 0.52) the look rests on the Knot, whole, tassels at eye height on both hands (the gaze's one
// change: a smaller turn than before). The sea greys to the horizon through a greyed blue, the ring's pale band is
// one thin line. The unhitching: strands slip four a second from 22.5 s, curl as they fall, and lie downstream of
// their dowel as cream scribbles, each keeping its dipped end.
// Fix 7 (after review 7 and the outside reviews of the stills): VOLUME WITHOUT LIGHT. The cord-on-cord tone gathers on
// whatever flank faces the lower right of the screen (the lay's marks broaden there on a round rope; the ropes on
// that flank of each strand of the spiral trunk sit a tone deeper; each of the Knot's bundles is tan down that flank,
// cord by cord), the pale fuzz stays on the upper left: all in the style kit. The sea greys to the horizon through
// the soft haze band again. Distance: a hanging keeps its cream and its knot tone to 250 m. THE RING'S HANGING: just
// behind the beech ring a macrame wall hanging frames the exit (eighteen pairs of rope by lark's heads from one long
// beech dowel, a net of diamonds tied with square knots, a V of beaded tassels; drawn on one plumb sheet, see
// RINGNET_GLSL); the ring's opening is a flat cream disc until the next world shows. The spiral trunk's half-knot
// wraps are pairs of round ropes in true metres that bite into the strands. The look: a few degrees above the course
// at the entry, on the trunk itself for the first stretch of the turn (u 0.155..0.175), and the turn to the Knot is
// spread over u 0.298..0.346 (was 0.305..0.34). The moth flight opens out and makes off after u 0.08. Every other
// dipped tip draws its wake. The unhitching runs from the row's far end inwards, three a second, the last strand by
// the corridor at 28.2 s; a slipped strand falls plumb, braked by the air, wriggling, and is carried on from where
// it lands. Nothing changed in the path, its length, pace(u) or the 44 s.
// Fix 8 (after review 8 and the readers of the whole flight as a strip): STRETCHES, NOT STILLS. THE LANE (u 0.40-0.58):
// the eight fringe rows across the course are gone; the fringe hangs from rods that run ALONG the course, 9.5 m (12 m
// where the forest leans) to either hand, seen end-on, with a sparser line 27 m out, and ends 120 m short of the Knot,
// which stands large and clear over the lane from the net on. (A departure: the brief hangs the rows across the course.)
// The rod that can come unhitched hangs apart, square to the lane, 28-48 m out on the left beyond its end: seen
// broadside, one strand slips every two thirds of a second from 20 s, from the lane outward, five seconds in the air,
// bent in an S with a hook at its head (finer geometry), and lies as a loose curl carried towards the Knot. THE
// DIAMOND WE LEAVE BY: the net's lacing is turned 3.4 m and raised 7.5 m and that one diamond is slack, 6.5 m wider to
// either side (its neighbours give way), so that the sight line to the half-tied Knot runs through its middle for the
// last second and a half of the spiral (a departure: one irregular diamond). THE TRUNK is 8.9 m thick (brief: 8 m),
// ten ropes over a slimmer core with open gaps, its wraps true eight-sided ropes; the look keeps it under two fifths
// of the frame (gazeAt: no rest on the trunk; the turn to the Knot is a blend of directions over u 0.316-0.356;
// no hold beside the Knot in the lane). THE ENTRY: the sleeve's hanks are let go by u 0.085 (were 0.115). Lane moths
// fly low down the lane towards the Knot and are drawn within 95-130 m. Beads plop beside the lane, 5-13 m out, never
// through the picture of the Knot. Triangles: the eight rows (576 strands) are replaced by seven rods (about 200).
// Nothing changed in the path, its length, pace(u) or the 44 s.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as K from '../parts/forest-tied-from-above.js';

const PI = Math.PI, TAU = PI * 2;
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const HERO_Z = 340, TRUNK_Z = 100, SLEEVE_R = 26, NET_Y0 = 44, NET_H = 12, NET_LINES = 20;
const TH_D = 54 * PI / 180, S_ANG = TAU / NET_LINES;   // where the path crosses the sleeve (azimuth round the trunk); line spacing
// (fix 8) THE DIAMOND WE LEAVE BY. The net's lacing is laid so that the sight line from the last of the spiral to the
// Knot passes through the middle of ONE diamond for two seconds (u 0.37 to 0.41): the lacing is turned 3.2 m round
// the sleeve and raised 4 m against the path's crossing point, and that one diamond is tied a little slack (its two
// sides stand 3.5 m further apart at its middle, the neighbours taking it up: the hand's fault, used).
const NET_TH = TH_D + 3.4 / SLEEVE_R, NET_YL = NET_Y0 + 7.5, NET_WID = 6.5 / SLEEVE_R;
const netWide = (th, y) => { const d = Math.atan2(Math.sin(th - NET_TH), Math.cos(th - NET_TH)), a = Math.abs(d), e = (y - NET_YL) / 14;
  return th + Math.sign(d) * NET_WID * sstep(0, 0.12, a) * (1 - sstep(0.45, 1.3, a)) * Math.exp(-e * e); };

// speed against the world's average: brisk in, lingering on the spiral, quick through the eye
function pace(u) {
  let p = 1.07;
  p += (0.67 - 1.07) * sstep(0.12, 0.17, u);
  p += (0.8 - 0.67) * sstep(0.33, 0.37, u);
  p += (1.07 - 0.8) * sstep(0.42, 0.47, u);
  p += (1.24 - 1.07) * sstep(0.6, 0.66, u);
  p += (1.12 - 1.24) * sstep(0.84, 0.9, u);
  return p;
}

// a unit cord: radius 1 round the y axis, y from 0 down to -1; uv.x = 0..1 along, uv.y = 0..1 round
function unitTube(sides, stops) {
  const P = [], N = [], UV = [], I = [];
  for (let j = 0; j < stops.length; j++) for (let i = 0; i <= sides; i++) {
    const a = i / sides * TAU; P.push(Math.cos(a), -stops[j], Math.sin(a)); N.push(Math.cos(a), 0, Math.sin(a)); UV.push(stops[j], i / sides);
  }
  const w = sides + 1;
  for (let j = 0; j < stops.length - 1; j++) for (let i = 0; i < sides; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1; I.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  return g;
}
const evenStops = (n) => Array.from({ length: n + 1 }, (_, i) => i / n);

// everything that hangs free is a pendulum: aA = (length m, radius m, swing amplitude rad, kink delay s),
// aB = (tassel share of the length, flare, slip order or -1, seed). One clock restarts them all (the kink).
const HANG_HEAD = /* glsl */`
  attribute vec4 aA; attribute vec4 aB; attribute float aS;
  uniform float uSw, uKinkAge, uLean, uFallT, uComb, uPxK, uGap, uDipEnd, uRowTide, uTide, uRoundK, uLift, uShow, uSink;`;
const HANG_BODY = /* glsl */`
  { float s = uv.x, L = aA.x; sd += aB.w;
    vec3 top = instanceMatrix[3].xyz;
    float T = 2.007 * sqrt(max(L, 0.5));
    float k = uKinkAge - aA.w;
    float ang = aA.z * mix(sin(6.2831853 * uSw / T), sin(6.2831853 * max(k, 0.) / T), smoothstep(0., 0.5, k)) + uLean;
    float tf = smoothstep(1. - aB.x, 1., s);
    flatK = tf * step(0.5, aB.y);
    float r = aA.y * (1. + aB.y * uComb * tf * (1. + 0.25 * sin(ang * 9. + aB.w * 6.)));
    // never thinner than 1.5 px; and where a row's strands would fuse into a sheet (their gap under three line
    // widths) a seeded share of them is left out, so a far curtain stays a comb and thins to a wash
    // (aS: metres a strand may hang lower than its row; zero for every strand now. Above zero, metres this strand hangs lower,
    // whole; below zero, metres this length of carrying rope is paid out at its lower end, its upper end where it was)
    float sk = aS * uSink, pay = max(-sk, 0.) * step(0.9999, s);
    float rmin = distance(top + vec3(0., -s * L - pay, 0.), cameraPosition) * uPxK;
    float wMid = distance(top + vec3(0., -0.5 * L, 0.), cameraPosition) * uPxK * 2.;
    float keep = clamp(uGap / max(wMid * 3.2, 1e-4), 0.1, 1.);
    float gone = (1. - step(0.999, keep)) * smoothstep(keep - 0.06, keep, fract(aB.w * 7.13 + 0.37));
    // (fix 7) a strand that has slipped its lark's head is seen falling: never under about 2.5 px wide, never left out
    float fy = max(uFallT - aB.z * 0.3333, 0.) * step(0., aB.z), fK = step(1e-4, fy);
    float airK = fK * (1. - smoothstep(0.85, 1., (1.0 * fy + 1.7 * fy * fy) / max(top.y - 0.4, 1.)));   // (in the air it is drawn bold; lying, a loose curl two or three pixels wide)
    r = max(r * (1. + 1.2 * airK), rmin * (1. + 2.2 * airK + 0.6 * (fK - airK))) * (1. - gone * (1. - fK)) * uShow;
    p.xz *= r;
    // the kink: a sideways bump that comes down the cord from where it leaves the void (y 250)
    float kv = mix(40., 110., smoothstep(60., 200., L));
    float kb = (s * L - max(top.y - 250., 0.) - max(k, 0.) * kv) / 6.;
    float bump = exp(-kb * kb) * step(0., k) * min(3., 0.03 * L + 0.9) * smoothstep(0., 0.04, s);
    float d = s * L + pay;
    vec3 off = p;
    p = vec3(p.x + sin(ang) * d + bump, -cos(ang) * d, p.z + bump * 0.35);
    // the unhitching: a slipped strand falls and lies on the sea as a slow cream scribble
    float room = max(top.y - 0.4, 1.);
    float fallD = min(1.0 * fy + 1.7 * fy * fy, room);   /* (fy counts half seconds: one strand slips every two thirds of a second, and is 4.5 s in the air) */   // (fix 8: it drops clear of the rod at once)   // (fix 7: light cotton, braked by the air: ten or twelve are in the air at once)
    float lay = smoothstep(0.9, 1., fallD / room);   // (fix 7) it falls plumb under the lark's head it slipped from and is laid down only as it meets the sea
    // (fix 6) it lies downstream of its row, towards the Knot and a little towards the corridor (the sea draws that
    // way, as the wakes show), and is carried on slowly for a few seconds: so the scribbles lie ahead of the bared
    // dowel, where the eye is, not under it. In the air it curls.
    float a0 = 0.3 + 2.6 * fract(aB.w * 43.);   // (each lies its own way: a field of separate scribbles)
    float tL = min(max(fy - 2.5, 0.) * 2., 6.);
    float hS = fract(aB.w * 91.), dS = d * 0.5;   // (each lies a little apart from the next and is carried at its own pace: separate scribbles, not one streak)
    // (it is carried a good way down the draw as it comes down: 26..38 m on from its row, so that the fallen lie in
    // front of the eye as it passes the bared dowel, not under it)
    vec3 lie = vec3(dS * 0.7 * cos(a0) + sin(d * 1.25 + aB.w * 40. + uSw * 0.21) * 1.5 + sin(d * 0.45 + aB.w * 9.) * 1.3 - 0.5 * tL + (hS - 0.5) * 13. - 5., -room + 0.45, dS * 0.7 * sin(a0) + cos(d * 1.05 + aB.w * 17. + uSw * 0.17) * 1.5 + cos(d * 0.38 + aB.w * 23.) * 1.3 + 2. + 4. * fract(aB.w * 57.) + tL * (8. + 2. * fract(aB.w * 57.)))   /* (fix 7) it lands under its own dowel and is carried on from there, 26..42 m in six seconds */ + vec3(off.z, off.x, 0.) * 1.5;   // (as thick up as across: from low over the sea a flat ribbon would be a hairline)
    // (fix 8) a slipped strand is slack from the instant it lets go: an S a strand-spacing wide all down it, its upper end
    // hooking over, turning as it falls
    { float bn = smoothstep(0., 0.3, fy) * (1. - 0.6 * smoothstep(0.75, 1., fallD / room));
      p.x += (sin(d * 0.55 + aB.w * 30. + uSw * 2.2) * 0.8 + 1.7 * exp(-d * 0.4) * sin(aB.w * 50. + uSw * 1.7)) * bn;
      p.z += (cos(d * 0.42 + aB.w * 17. + uSw * 1.9) * 0.9 + 1.7 * exp(-d * 0.4) * cos(aB.w * 50. + uSw * 1.7)) * bn; }
    p.y -= fallD;
    ctrL = vec4(p - vec3(off.x, 0., off.z), r * uRoundK * (1. - step(1e-4, fallD)));   // (fix 6) the cord's centreline: a rope near enough is drawn round
    p = mix(p, lie, lay);
    flatK = mix(flatK, 2., step(0.5, lay));
    // a tassel was dipped before it was hung: its end is blue above an uneven tide line (uDipEnd m, 0 = not dipped)
    dipE = uDipEnd > 0. ? min(uDipEnd, 0.42 * L) * (0.55 + 0.9 * fract(aB.w * 13.7)) - (1. - s) * L : -1000.;
    // a row was dipped together: its tide line runs along the row, rising and falling a little (uRowTide 1), never a
    // stair of separate lines
    // (a strand that has fallen keeps the dip it had while it hung: its lower end blue, the rest of it cream on the sea)
    dipE = max(dipE, mix(-1000., uTide + 0.9 + 0.9 * sin(top.x * 0.23 + top.z * 0.13) + 0.45 * sin(top.x * 0.61 + 1.7) - mix(top.y + p.y, top.y - d, step(1e-4, fallD)), uRowTide));
    { float lift = uLift - max(sk, 0.); p.y += lift; ctrL.y += lift; }   // (a rope still being let down out of the void: lifted whole, see the strays)
    vArcAdd = s * (L - 1.) + pay; }`;

// The lark's head, the knot that hangs everything: drawn in the material of the beech it is tied round. q = metres
// along the wood from the nearest strand, dq = metres one pixel covers, sp = strand spacing m, on = 1 where a strand
// hangs, yn = -1..1 round the wood (-1 where the cord leaves it), dy = its pixel step. Two cream turns of cord over
// the wood with a thin groove between them and the bight as a short bar of the cord-on-cord tone beneath; never
// thinner than 2 px, and one flat average tint where the strands are closer than about 3 px.
const LARK_GLSL = /* glsl */`
  vec3 larkCol(vec3 wood, float q, float dq, float sp, float on, float yn, float dy){
    float wT = min(0.27, sp * 0.3), hw = max(wT, dq);
    float wrap = (1. - smoothstep(hw - 0.5 * dq, hw + 0.5 * dq, q)) * on;
    float sw = max(0.035, 0.75 * dq);
    float seam = (1. - smoothstep(sw - 0.5 * dq, sw + 0.5 * dq, q)) * smoothstep(3., 5., wT / dq);
    float bar = smoothstep(-0.82 - dy, -0.82 + dy, yn) * (1. - smoothstep(-0.4 - dy, -0.4 + dy, yn)) * (1. - smoothstep(hw * 1.3 - 0.5 * dq, hw * 1.3 + 0.5 * dq, q)) * on;
    vec3 c = mix(wood, mix(uCream, uGroove, 0.55), wrap);
    c = mix(c, mix(uGroove, uBeech, 0.4) * 0.9, seam * wrap);
    c = mix(c, mix(uGroove, uBeech, 0.4) * 0.9, bar);
    vec3 avg = mix(wood, mix(uCream, uGroove, 0.55), clamp(2. * wT / max(sp, 1e-3), 0., 1.) * on);
    return mix(avg, c, smoothstep(2.5, 4.5, sp / dq));
  }`;

// (fix 7) the ring's hanging, drawn on one plumb sheet (see build): X across (m), Y world height. No derivative is
// taken inside a loop; every division is guarded.
const RINGNET_GLSL = /* glsl */`
  varying vec2 vP; varying vec3 vW; uniform float uKinkAge;
  const float NL = 18., NP = 5.2, NA = 2.05, NY0 = 34., NH = 7., NYT = 128.5;
  // a round three-ply rope seen square on: lat -1..1 across it, al metres along it, dl and da their pixel steps
  vec3 netRope(float lat, float al, float dl, float da, float tone, float seed){
    float cph = sqrt(max(1. - lat * lat, 0.));
    float gR = 0.27 * cph * cph + 0.5 * smoothstep(0.1, 0.75, -lat);   // (the sheet faces the approach: -X is the screen's right)
    float dR = max(length(vec2(uPly * dl / (6.2831853 * max(cph, 0.3)), da / 0.51)), 1e-5);
    float mk = smoothstep(1. - gR - dR, 1. - gR + dR, abs(fract(uPly * asin(clamp(lat, -1., 1.)) / 6.2831853 + al / 0.51 + seed) - 0.5) * 2.) * smoothstep(dR, 1.6 * dR, gR);
    mk = mix(mk, 0.26, smoothstep(0.2, 0.34, dR));
    vec3 lieC = mix(uGroove, uBeech, 0.4) * 0.9;
    return mix(mix(uCream, uGroove, tone), mix(uGroove, lieC, tone), mk);
  }
  void main(){
    float X = vP.x, Y = vP.y, px = max(fwidth(vP.x), 1e-4), py = max(fwidth(vP.y), 1e-4);
    float k = uKinkAge - 1.2, kb = ((250. - Y) - max(k, 0.) * 110.) / 6.;
    X -= exp(-kb * kb) * step(0., k) * 2.4;
    float yn = (Y - NY0) / NH, g = 1. - smoothstep(118., 124., Y), cz = cos(3.14159265 * yn), sz = sin(3.14159265 * yn);
    float kf = X / NP + (NL - 1.) * 0.5, k0 = floor(kf);
    float r = max(0.42, 1.15 * px), wide = smoothstep(4., 7., r / px), hit = 0.;
    vec3 col = vec3(0.);
    for (int q = 0; q < 2; q++) { float kk = k0 + float(q), sgn = mod(kk, 2.) < 0.5 ? 1. : -1., nE = floor(abs(kk - (NL - 1.) * 0.5) / 2.2);
      float ok = step(-0.5, kk) * step(kk, NL - 0.5) * step(NY0 + nE * NH - 0.4, Y) * step(Y, NYT);
      float cx = (kk - (NL - 1.) * 0.5) * NP + sgn * NA * cz * g, sl = sgn * NA * 3.14159265 / NH * sz * g, sc = sqrt(1. + sl * sl);
      float off = 0.42 * (1. + 1.1 * g * (1. - cz * cz));
      for (int e = 0; e < 2; e++) { float es = e == 0 ? -1. : 1., lat = (X - cx - es * off) / (r * sc);
        float GR = 0.5 + 0.5 * cos(6.2831853 * (uPly * (lat < 0. ? -0.25 : 0.25) + Y * sc / 0.51 + kk * 0.37 + es * 0.2));
        float thr = 0.82 - 0.13 * GR * GR * wide;
        if (ok > 0.5 && abs(lat) < thr) { col = netRope(lat, Y * sc, px / (r * sc), py * sc, 0.34, kk * 0.37 + es * 0.2);
          col = mix(col, mix(col, vec3(1., 0.985, 0.95), 0.6), smoothstep(thr - 2.4 * px / r, thr - 1.2 * px / r, abs(lat)) * step(0., lat) * wide); hit = 1.; } } }
    // a square knot where two pairs meet: two wraps of rope across the four, one above the other, a tone deeper
    { float n = floor(yn + 0.5), dy = (yn - n) * NH, xm = (k0 + 0.5 - (NL - 1.) * 0.5) * NP, dx = X - xm;
      float nEm = floor(min(abs(k0 - (NL - 1.) * 0.5), abs(k0 + 1. - (NL - 1.) * 0.5)) / 2.2);
      float kOK = (1. - step(0.5, mod(k0 - n + 64., 2.))) * step(-0.5, k0) * step(k0, NL - 1.5) * step(nEm - 0.5, n) * step(n, 12.5);
      float hs = dy < 0. ? -1. : 1., wy = (dy - hs * 0.37) / 0.37, ex = max(abs(dx) - 1.2, 0.) / 0.37, d2 = sqrt(wy * wy + ex * ex);
      float GR = 0.5 + 0.5 * cos(6.2831853 * (uPly * (wy < 0. ? -0.25 : 0.25) + dx / 0.51 + n * 0.3 + hs * 0.2));
      if (kOK > 0.5 && d2 < 0.9 - 0.12 * GR * GR * wide) { col = netRope(clamp(wy, -1., 1.), dx + hs, py / 0.37, px, 0.85, n * 0.3 + hs * 0.2 + k0 * 0.17); hit = 1.; } }
    // the dowel it hangs from (turned beech, rounded ends, one paler band) with a lark's head for each pair of ropes,
    // and the two ropes that carry it
    { float dd = Y - NYT - 0.15, endx = 48.5 - abs(X), ee = max(0.45 - endx, 0.);
      if (dd * dd + ee * ee < 0.2025) { float q = abs(fract(kf + 0.5) - 0.5) * NP, on = step(-0.5, floor(kf + 0.5)) * step(floor(kf + 0.5), NL - 0.5);
        vec3 wood = mix(uBeech, mix(uBeech, uCream, 0.5), smoothstep(0.7 - px, 0.7 + px, endx) * (1. - smoothstep(1.1 - px, 1.1 + px, endx)));
        float wrap = (1. - smoothstep(0.85 - px, 0.85 + px, q)) * on, seam = (1. - smoothstep(0.06, 0.06 + px, abs(q - 0.36))) * smoothstep(3., 5., 0.7 / px);
        col = mix(wood, mix(mix(uCream, uGroove, 0.55), mix(uGroove, uBeech, 0.4) * 0.9, seam), wrap); hit = 1.; }
      float lc = (abs(X) - 6.5 * NP) / r, thc = 0.82 - 0.13 * wide * (0.5 + 0.5 * cos(6.2831853 * (0.75 + Y / 0.51)));
      if (Y > NYT + 0.5 && abs(lc) < thc) { col = netRope(lc * (X < 0. ? -1. : 1.) , Y, px / r, py, 0., 0.4); hit = 1.; } }
    if (hit < 0.5) discard;
    gl_FragColor = vec4(styleDistance(col, vW, cameraPosition), 1.);
  }`;

export default {
  id: 'forest-tied-from-above',
  name: 'The Forest Tied from Above',
  category: 'alien',
  weirdness: 0.65,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const density = Math.min(1.3, Math.max(0.6, vary.density || 1));
    const scene = new THREE.Scene();

    // ---- variations: hour, stock, weather (chosen once, as uniform values) -----------------------------------
    const rare = !!vary.rare;
    const hours = ['afternoon', 'dawn', 'golden', 'night'];
    let hour = hours[rng.int(0, 3)];
    if (typeof vary.hour === 'string') { const h = vary.hour.toLowerCase(); hour = /night|midnight/.test(h) ? 'night' : /dawn|morning/.test(h) ? 'dawn' : /dusk|gold|sunset|evening/.test(h) ? 'golden' : /noon|day|after/.test(h) ? 'afternoon' : hour; }
    else if (typeof vary.hour === 'number') { const h = ((vary.hour % 24) + 24) % 24; hour = h < 5 || h >= 21 ? 'night' : h < 9 ? 'dawn' : h < 16 ? 'afternoon' : 'golden'; }
    const stockRoll = rng(), weatherRoll = rng();
    const stock = rare && stockRoll < 0.5 ? 'madder' : stockRoll < 0.68 ? 'cotton' : 'flax';
    const weather = weatherRoll < 0.45 ? 'still' : weatherRoll < 0.75 ? 'draught' : 'combing';
    const pal = K.PALETTE.slice();
    if (hour === 'dawn') { pal[3] = '#E8B79A'; pal[4] = '#F3DCC8'; pal[5] = '#2F4F86'; pal[6] = '#6E8FBE'; }
    if (hour === 'golden') { pal[3] = '#C48A93'; pal[4] = '#E2B7B0'; pal[0] = '#F2E2C2'; }
    if (hour === 'night') { pal[3] = '#4A2E4C'; pal[4] = '#6A4763'; pal[5] = '#161F45'; pal[6] = '#3E5C92'; }
    if (stock === 'flax') { pal[0] = '#D8D3C2'; pal[1] = '#ACA590'; }
    if (stock === 'madder') { pal[5] = '#8C3A2B'; pal[6] = '#B8614A'; if (hour !== 'night') { pal[3] = '#BDB2A6'; pal[4] = '#D6CCC0'; } }
    const lean = weather === 'draught' ? 6 * PI / 180 : 0;
    const HU = { uSw: { value: 0 }, uKinkAge: { value: -1 }, uLean: { value: lean }, uFallT: { value: -1 }, uComb: { value: weather === 'combing' ? 1.9 : 1 }, uPxK: { value: 0.0012 }, uGap: { value: 1e6 }, uDipEnd: { value: 0 }, uRowTide: { value: 0 }, uRoundK: { value: 0 }, uLift: { value: 0 }, uShow: { value: 1 }, uSink: { value: 1 } };
    await ctx.yield();

    // ---- the hero: the Knot, with its sea and void --------------------------------------------------------------
    const hero = await K.buildHero(ctx, { palette: pal, detail });
    hero.object.position.set(0, 0, HERO_Z);
    scene.add(hero.object);
    const S = hero.style;   // this build's own style uniforms (palette, fade, time): nothing shared between instances
    if (weather === 'combing') S.uFade.value.set(180, 420, 700);
    const cordMat = (o) => K.cordMaterial({ ...o, style: S });
    await ctx.yield();

    // ---- the flight ---------------------------------------------------------------------------------------------
    const EX = SLEEVE_R * Math.cos(TH_D), EZ = SLEEVE_R * Math.sin(TH_D);   // where the sleeve is crossed (in at -, out at +)
    const route = [[EX, 116, 14], [EX, 116, 44], [EX, 116, 76], [14.6, 116, 90]];
    for (let d = 0; d <= 360; d += 45) { const a = d * PI / 180; route.push([14 * Math.cos(a), 116 - 62 * d / 360 - (d === 0 ? 0.6 : 0), TRUNK_Z + 14 * Math.sin(a)]); }
    route.push([EX, NET_Y0, TRUNK_Z + EZ], [8, 30, 160], [3, 16, 205]);
    for (const p of hero.anchors.flyThrough) route.push([p.x, p.y, p.z + HERO_Z]);
    const path = makePath(route);
    await ctx.yield();
    const DUR = 44, NT = 256;
    const JT = new Float32Array(NT + 1), FRONT = new Float32Array(NT + 1);
    { let acc = 0, low = 102; const v = new THREE.Vector3();
      for (let i = 1; i <= NT; i++) { acc += 1 / pace((i - 0.5) / NT); JT[i] = acc; }
      // the zip: at the entry the sleeve is a loose curtain of plumb ropes, netted only high above (y 150); from the
      // start of the spiral the front of square knots comes down faster than we do, passes us a third of the way
      // round (u 0.25: the net above, the loose curtain below; 10 m/s) and from u 0.3 keeps 14 m beneath us
      for (let i = 0; i <= NT; i++) { const u = i / NT; JT[i] *= DUR / acc; path.curve.getPointAt(u, v); low = Math.min(low, Math.max(20, v.y - 14));
        FRONT[i] = u < 0.289 ? Math.max(low, 150 - 84 * Math.min(1, Math.max(0, (u - 0.159) / 0.13))) + 190 * (1 - sstep(0.1, 0.159, u)) : low; } }
    const table = (T, u) => { const x = Math.min(Math.max(u, 0), 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return T[i] + (T[i + 1] - T[i]) * (x - i); };
    // THE GAZE, one script for the whole flight (a single poi; where it returns the path's own look-ahead point the
    // engine's gaze is untouched). Entry: along the course. The spiral: lifted off the sea and turned a little out
    // from the trunk, to the net, the zip and the void (the trunk takes a quarter of the frame). As the trunk
    // uncovers the Knot (u 0.34) it goes to the half-tied Knot, low, so that it stands on the sea line in the top
    // third over the fringe rows; out through the diamond it rests on the Knot; coming down to the corridor it dips
    // to the rows and the drawn water (u 0.43); then the whole Knot, the open eye, the ring through the eye; passing through,
    // a glance up at the left crossing sliding by and down to the left tail rising with its drops; then the ring.
    await ctx.yield();
    const GAZE_W = 0.94, gA = new THREE.Vector3(), gC = new THREE.Vector3(), gT = new THREE.Vector3(), gO = new THREE.Vector3(), gD = new THREE.Vector3();
    const G8 = { t0: 0.316, t1: 0.356, kMin: 0.72, o0: 0.118, o1: 0.16, o2: 0.178, o3: 0.215 };
    const gazeAt = (time, u) => { const L = path.length; u = Math.min(1, Math.max(0, u));
      path.posAtDist(u * L, gC); path.posAtDist(u * L + 22, gA); gO.copy(gA);
      // (fix 7) the entry looks a few degrees above the course (the fringe rows far below stay under the frame's edge)
      gO.y += 4.2 * (1 - sstep(0.015, 0.05, u)) + 2.4 * sstep(0.015, 0.05, u) * (1 - sstep(0.06, 0.1, u));
      const sp = sstep(0.09, 0.14, u);
      // (fix 7) for the first stretch of the turn (u 0.156 to 0.175, turning in from u 0.112) the look is on the trunk itself, whole in the frame at
      // arm's length; then it turns out to the sleeve and the zip as before (from u 0.215 on nothing has changed)
      const kO = 1.06 - (1.06 - G8.kMin) * sstep(G8.o0, G8.o1, u) * (1 - sstep(G8.o2, G8.o3, u));
      gO.lerp(gT.set(gA.x * kO, gC.y + 3.5, TRUNK_Z + (gA.z - TRUNK_Z) * kO), sp);   // (the sea keeps the lower third round the spiral)
      // (the first look at the Knot is held a little to its left until the trunk has gone by: the diamond and the
      // Knot in it, the trunk only at the frame's edge)
      // (fix 8) THE TURN TO THE KNOT is made in directions, not between points (a far target used to take the look over in
      // the first tenth of the blend: 75 deg/s), and later: round the spiral the look turns with the path, the trunk held
      // at the frame's right edge, until the Knot comes out from behind the trunk's limb (u 0.32); only then is it taken
      // to the Knot, so the camera never turns faster than the spiral itself does
      { const kT = sstep(G8.t0, G8.t1, u);
        if (kT > 0) { gT.set(90 * (1 - sstep(0.34, 0.378, u)), 7 + 53 * sstep(0.34, 0.378, u) - 14 * sstep(0.39, 0.43, u), HERO_Z).sub(gC).normalize();   /* (lifted a little while the diamond frames the Knot, so its upper knot stays in view) */ gD.subVectors(gO, gC).normalize();
          gD.lerp(gT, kT).normalize(); gO.copy(gC).addScaledVector(gD, 80); } }   // (fix 7: the turn to the Knot takes a third longer, 0.298..0.346 for 0.305..0.34)
      path.posAtDist(u * L + 60, gT); gT.y = 0; gO.lerp(gT, 0.22 * sstep(0.4, 0.44, u) * (1 - sstep(0.46, 0.52, u)));   // (fix 8: a nod to the lane's wakes, no more: from the diamond on the look rests on the Knot)
      // inside the fringe (u 0.52) the look turns to the rows on the left hand: tassels at arm's length, their dipped
      // tips and wakes below, the Knot's fourth move beyond them to the right
      // (fix 6: no longer a turn to the wall of strands. Inside the fringe the look rests on the Knot, held a little to
      // its left, so that it stands whole in the frame with tassels at eye height on both hands)
      // (fix 8: no turn aside inside the fringe: the Knot is the subject all the way down the lane)
      gO.lerp(gT.set(0, 40, HERO_Z), sstep(0.555, 0.605, u));
      gO.lerp(gT.set(0, 46, HERO_Z + 80), sstep(0.64, 0.7, u));
      gO.lerp(gT.set(-34, 17, HERO_Z + 125), 0.75 * sstep(0.8, 0.86, u) * (1 - sstep(0.885, 0.925, u)));   // (the hauled tail, its strings of drops and the rings under it: the ring goes to the frame's edge)
      return gO.lerp(gA, sstep(0.925, 0.95, u)); };
    await ctx.yield();

    // ---- materials (all from the style kit) and the instanced hanger ---------------------------------------------
    const hangMat = (o) => { const m = cordMat({ ...o, vertexHead: HANG_HEAD, vertexBody: HANG_BODY }); Object.assign(m.uniforms, HU); return m; };
    const beech = K.beechMaterial({ style: S });
    const hang = (geo, list, mat) => {
      const n = list.length, g = geo.clone(), A = new Float32Array(n * 4), B = new Float32Array(n * 4), SK = new Float32Array(n);
      const mesh = new THREE.InstancedMesh(g, mat, n), m4 = new THREE.Matrix4(), eu = new THREE.Euler();
      for (let i = 0; i < n; i++) { const h = list[i];
        A.set([h.L, h.r, h.amp || 0, h.delay || 0], i * 4); B.set([h.tass || 0, h.flare || 0, h.fall ?? -1, h.seed || 0], i * 4); SK[i] = h.sink || -(h.pay || 0);
        mesh.setMatrixAt(i, (h.tilt ? m4.makeRotationFromEuler(eu.set(0, h.yaw || 0, h.tilt, 'YXZ')) : m4.makeRotationY(h.yaw || 0)).setPosition(h.x, h.y, h.z)); }
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(SK, 1));
      mesh.frustumCulled = false; scene.add(mesh); return mesh;
    };
    let dowelMesh = null;
    const kinkDelay = (x, z) => Math.hypot(x, z - HERO_Z) / 400;

    // ---- the spiral trunk: a half-knot sinnet of four ropes on the axis, turning, 8 m thick ----------------------
    const trunk = new THREE.Group(); trunk.position.set(0, 0, TRUNK_Z); scene.add(trunk);
    // Each of the four strands is a hawser: a core (the many-rope shader, dark where it beds on its neighbours) and
    // ten real 0.6 m three-ply ropes (seven-sided) laid side by side over its outer face, so at the close pass the nearest cord
    // of the flight is rope at true gauge with its own silhouette, not a painted tube.
    // (fix 8) FOUR GREAT ROPES, not a wall: each strand is ten ropes laid round a slimmer core (round to its inner flank) and the four stand a
    // little apart, so a gap of void spirals between them (8.9 m across all, nearer the brief's 8) and each strand's
    // crown, flanks and valley can be told apart
    const TRS = 0.98, TS = 3.0, ROPE_OUT = 1.15, LAY = 30;   // core radius; strand centre from the axis; rope centres from the strand's
    const helixA = (y, q) => (420 - y) / LAY * TAU + q * PI / 2;   // one turn of the sinnet in 30 m: the strands just touch
    const axisX = (y) => 0.7 * Math.sin(y * 0.021 + 1), axisZ = (y) => 0.6 * Math.sin(y * 0.017);
    // frame of strand q at height y: centre c, outward e, and b = tangent x outward (the helix leans 43 degrees)
    const SF = { c: [0, 0, 0], e: [0, 0, 0], b: [0, 0, 0] };
    const strandAt = (y, q) => { const a = helixA(y, q), sl = TS + 0.09 * Math.sin(y * 0.11 + q), ca = Math.cos(a), sa = Math.sin(a);
      const k = -sl * TAU / LAY, tl = Math.hypot(k, 1);
      SF.c[0] = sl * ca + axisX(y); SF.c[1] = y; SF.c[2] = sl * sa + axisZ(y);
      SF.e[0] = ca; SF.e[1] = 0; SF.e[2] = sa; SF.b[0] = sa / tl; SF.b[1] = k / tl; SF.b[2] = -ca / tl; return SF; };
    { const YS = []; for (let y = 320; y > 212; y -= 4) YS.push(y); for (let y = 212; y > 135; y -= 3) YS.push(y); for (let y = 135; y >= 33; y -= 1.5) YS.push(y);
      const NY = YS.length, yRope0 = YS.findIndex((y) => y <= 171);
      const SE = [];   // (fix 7) per vertex of a laid rope: the way out of its strand
      const sweep = (P, N, UV, I, q, sides, j0, rad, psi0, wob, arc0) => { const base = P.length / 3, w = sides + 1; let arc = arc0, px = 0, py = 0, pz = 0;
        for (let j = j0; j < NY; j++) { const y = YS[j], f = strandAt(y, q);
          const ps = psi0 + wob * 0.05 * Math.sin(y * 0.23 + psi0 * 3.7 + q), rr = rad + wob * 0.05 * Math.sin(y * 0.31 + psi0 * 5.1), cp = Math.cos(ps), sp = Math.sin(ps);
          // a rope's centre rides the strand at angle ps; a core's centre is the strand's own
          const ox = wob ? (f.e[0] * cp + f.b[0] * sp) * rr : 0, oy = wob ? (f.e[1] * cp + f.b[1] * sp) * rr : 0, oz = wob ? (f.e[2] * cp + f.b[2] * sp) * rr : 0;
          const cx = f.c[0] + ox, cy = f.c[1] + oy, cz = f.c[2] + oz, tr = wob ? 0.285 * Math.min(1, (j - j0) / 3) : rad;
          if (j > j0) arc += Math.hypot(cx - px, cy - py, cz - pz); px = cx; py = cy; pz = cz;
          for (let i = 0; i <= sides; i++) { const t = i / sides * TAU + (wob ? ps : 0), ct = Math.cos(t), st = Math.sin(t);   // a rope's uv.y = 0 faces out of its strand
            const nx = f.e[0] * ct + f.b[0] * st, ny = f.e[1] * ct + f.b[1] * st, nz = f.e[2] * ct + f.b[2] * st;
            P.push(cx + nx * tr, cy + ny * tr, cz + nz * tr); N.push(nx, ny, nz); UV.push(arc, i / sides); if (wob) SE.push(ox / rr, oy / rr, oz / rr); } }
        for (let j = 0; j < NY - j0 - 1; j++) for (let i = 0; i < sides; i++) { const a = base + j * w + i, b = a + 1, c = a + w, d = c + 1; I.push(a, c, b, b, c, d); } };
      const mk = (P, N, UV, I) => { const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); return g; };
      { const P = [], N = [], UV = [], I = [];
        for (let q = 0; q < 4; q++) { sweep(P, N, UV, I, q, 8, 0, TRS, 0, 0, q * 3.1); await ctx.yield(); }
        // the core: thirteen ropes drawn round it, and the flat cord-on-cord tone where a strand beds on the next
        // (from afar, where a rope is under about six pixels, the core between the ropes is the ropes' own flat tone and
        // only the valley between strands stays tan: a calm cream column, no stipple)
        const m = new THREE.Mesh(mk(P, N, UV, I), cordMat({ gauge: 0.6, strands: 10.5, twist: 0, seed: 0.3, tone: 0.3, side: THREE.DoubleSide, vertexHead: 'uniform float uPxK;',
          vertexBody: 'float farK = smoothstep(0.07, 0.11, distance((modelMatrix * vec4(position, 1.)).xyz, cameraPosition) * uPxK * 1.25); lieD = mix(length(position.xz - vec2(0.7 * sin(position.y * 0.021 + 1.), 0.6 * sin(position.y * 0.017))) - 2.9, -1., step(position.y, 167.) * (1. - farK));' }));
        m.material.uniforms.uPxK = HU.uPxK; m.frustumCulled = false; trunk.add(m); }
      await ctx.yield();
      { const P = [], N = [], UV = [], I = [];
        for (let q = 0; q < 4; q++) { for (let k = -4; k <= 5; k++) { sweep(P, N, UV, I, q, 7, yRope0, ROPE_OUT, (k - 0.5) * 0.487, 1, q * 11.3 + (k + 4) * 3.7); if (k % 2 === 0) await ctx.yield(); } }
        await ctx.yield();
        const rg = mk(P, N, UV, I); rg.setAttribute('aE', new THREE.Float32BufferAttribute(SE, 3));
        // (fix 7) each strand is a round thing: the ropes on its flank that faces the lower right of the screen sit a tone deeper, rope by rope
        const m = new THREE.Mesh(rg, cordMat({ gauge: 0.6, pitch: 0.85, grooveW: 0.2, strands: 1, seed: 0.33, fine: true, fineBow: 0.022, valleyRim: true, tone: 0.12, lens: [0.2, 0.22], side: THREE.DoubleSide, crown: 0.88, vertexHead: 'attribute vec3 aE;', vertexBody: 'ctrL = vec4(position - normal * 0.285, 0.285); { vec2 rd = position.xz - vec2(0.7 * sin(position.y * 0.021 + 1.), 0.6 * sin(position.y * 0.017)); shd = (0.25 - dot(aE.xz, rd / max(length(rd), 1e-3))) * 2.; }' }));   /* (fix 8) the tone is on the rope that lies in the valley, where strand bears on strand (was: whatever faced the lower right) */ m.frustumCulled = false; trunk.add(m); }   // (a sinnet is knot all the way down: it sits a tone under a plain rope)
      await ctx.yield();
      // half-knot units: every 5.2 m two working ropes (true gauge) cross the four diagonally, the crossing walking
      // round the trunk as it comes down: this is what makes a sinnet spiral
      // (fix 7) a half-knot unit is a PAIR of round three-ply ropes of the trunk's own gauge laid side by side round
      // the four strands (real tubes in metres, their arc length true, so the lay has the trunk ropes' pitch): each
      // rides a strand's crown, dips into the valley, and at the trunk's limb turns round the strand and is gone
      // behind it, never standing further out than its own thickness. Four-sided tubes a little over gauge: the style
      // kit cuts the round outline and the lay from the centreline (ctrL), whatever the side count.
      const WP = [], WN = [], WUV = [], WI = [], WSEG = 56, WSD = 8, WRG = 0.3;   // (fix 8: a true round rope of eight sides at its own gauge, drawn as it is built: no outline cut from a centreline, which broke up where the wrap turns end-on at the trunk's limb)
      // where a rope laid round the trunk rides: on each strand's crown (the strand is an oval in a level cut, since
      // it leans), down its flank and into the valley between two strands, so its outline is four scallops
      const wrapR = (ph) => { ph = Math.abs(((ph % (PI / 2)) + PI / 2) % (PI / 2)); if (ph > PI / 4) ph = PI / 2 - ph;
        const c = Math.cos(ph), sn = Math.sin(ph), ar = ROPE_OUT + 0.625, bt = ar / 0.88, VF = TS * 0.7071 + ar - 0.3, qa = c * c / (ar * ar) + sn * sn / (bt * bt), qb = c * TS / (ar * ar), qc = TS * TS / (ar * ar) - 1;
        const disc = qb * qb - qa * qc, r = disc > 0 ? (qb + Math.sqrt(disc)) / qa : 0, x = r - VF;
        return VF + 0.5 * (x + Math.sqrt(x * x + 0.06)); };   // (between two strands the wrap runs straight across the gap)
      for (let k = 0; k < 2; k++) { const base = WP.length / 3, C = []; let arc = k * 5;
        for (let i = 0; i <= WSEG; i++) { const a = i / WSEG * TAU, yy = 1.5 * Math.sin(a) + (k ? 0.33 : -0.33) + 0.07 * Math.sin(5 * a + k * 2);
          const rad = wrapR(a + yy * TAU / LAY) - 0.27; C.push([Math.cos(a) * rad, yy, Math.sin(a) * rad]); }
        for (let i = 0; i <= WSEG; i++) { const c = C[i], pa = C[(i + WSEG - 1) % WSEG], pb = C[(i + 1) % WSEG];
          let tx = pb[0] - pa[0], ty = pb[1] - pa[1], tz = pb[2] - pa[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          let ox = c[0], oy = 0, oz = c[2]; const d = ox * tx + oz * tz; ox -= tx * d; oy -= ty * d; oz -= tz * d; const ol = Math.hypot(ox, oy, oz) || 1; ox /= ol; oy /= ol; oz /= ol;
          const bx = ty * oz - tz * oy, by = tz * ox - tx * oz, bz = tx * oy - ty * ox;
          if (i) arc += Math.hypot(c[0] - C[i - 1][0], c[1] - C[i - 1][1], c[2] - C[i - 1][2]);
          for (let j = 0; j <= WSD; j++) { const t = j / WSD * TAU, ct = Math.cos(t), st = Math.sin(t), nx = ox * ct + bx * st, ny = oy * ct + by * st, nz = oz * ct + bz * st;
            WP.push(c[0] + nx * WRG, c[1] + ny * WRG, c[2] + nz * WRG); WN.push(nx, ny, nz); WUV.push(arc, j / WSD); } }
        for (let i = 0; i < WSEG; i++) for (let j = 0; j < WSD; j++) { const a = base + i * (WSD + 1) + j, b = a + 1, c = a + WSD + 1, d = c + 1; WI.push(a, b, c, b, d, c); } }
      await ctx.yield();
      const wg = new THREE.BufferGeometry();
      wg.setAttribute('position', new THREE.Float32BufferAttribute(WP, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(WN, 3));
      wg.setAttribute('uv', new THREE.Float32BufferAttribute(WUV, 2)); wg.setIndex(WI);
      const NW = 28, NWV = 20, wraps = new THREE.InstancedMesh(wg, cordMat({ gauge: 0.6, pitch: 0.85, grooveW: 0.2, strands: 1, seed: 0.45, fine: true, tone: 0.5, valleyRim: true }), NWV), wm = new THREE.Matrix4(), we = new THREE.Euler(), wq = new THREE.Quaternion(), wv = new THREE.Vector3(), ws = new THREE.Vector3();
      for (let i = 0; i < NW; i++) { const y = 40 + i * 5.2 + rng.range(-0.5, 0.5);
        we.set(rng.range(-0.05, 0.05), -helixA(y, 0), rng.range(-0.05, 0.05)); wq.setFromEuler(we);
        wv.set(0.7 * Math.sin(y * 0.021 + 1), y, 0.6 * Math.sin(y * 0.017)); ws.setScalar(1 + (rng.range(0.995, 1.03) - 1) * 0.3);
        if (i < NWV) wraps.setMatrixAt(i, wm.compose(wv, wq, ws)); }
      wraps.frustumCulled = false; trunk.add(wraps);
      // the neck: a binding of rope turns, and a beech bead above it
      const ng = new THREE.CylinderGeometry(4.9, 4.3, 6, 20, 1, true), uv = ng.attributes.uv;
      for (let i = 0; i < uv.count; i++) { const u0 = uv.getX(i), v0 = uv.getY(i); uv.setXY(i, u0 * 29, v0); }
      const neck = new THREE.Mesh(ng, cordMat({ gauge: 0.6, strands: 9, twist: 0, seed: 0.7 })); neck.position.y = 30; trunk.add(neck);
      const bead = new THREE.Mesh(new THREE.SphereGeometry(5.9, 24, 12).scale(1, 0.62, 1), beech); bead.position.y = 36.8; trunk.add(bead); }
    await ctx.yield();

    // ---- the sleeve: forty ropes round the trunk, tied into a net of diamonds behind a front that comes down ------
    const SU = { uFront: { value: 340 }, uGather: { value: 1 } }; let sleeveSeed = null, sleeveHank = null, sleevePart = null;
    const gatherAt = (u) => 1 - sstep(0.03, 0.085, u);   // (fix 8: let go sooner, so the forty ropes are in their places, thin and apart, before we come to them: no hank crosses the lane at u 0.09 to 0.12)
    const sleeveBody = /* glsl */`
      { float s = uv.x; float y = mix(420., -1., s); sd += aS.w;
        float g = smoothstep(uFront - 1., uFront + 7., y);
        float zig = aS.y * 3.6 * cos(3.14159265 * (y - ${NET_YL.toFixed(2)}) / ${NET_H}.) * g;
        float loose = (1. - g) * (1.1 * sin(uSw * 0.9 + aS.w * 40.) + 0.6 * sin(uSw * 0.53 + aS.x * 3.)) * (1. - s) * 3.;
        float cz = cos(3.14159265 * (y - ${NET_YL.toFixed(2)}) / ${NET_H}.);
        float th = aS.x + (zig + loose + aS.z * (1. + 1.1 * g * (1. - cz * cz))) / ${SLEEVE_R}.;
        // (fix 8) the diamond we leave by is tied a little slack: its sides stand further apart at its middle (netWide)
        { float dW = mod(th - ${NET_TH.toFixed(5)} + 3.14159265, 6.2831853) - 3.14159265, aW = abs(dW), eW = (y - ${NET_YL.toFixed(2)}) / 14.;
          th += sign(dW) * ${NET_WID.toFixed(5)} * smoothstep(0., 0.12, aW) * (1. - smoothstep(0.45, 1.3, aW)) * exp(-eW * eW) * g; }
        // (fix 6) the curtain parts where we come in through it (y 116): the two lines either side of the way in
        // hang 3.9 m further apart there, so no rope passes the lens at arm's length as a cropped column
        float pe = (y - 116.) / 20.; th += aP * 0.15 * (1. - g) * exp(-pe * pe);
        // until we come to it the curtain hangs gathered in three hanks beyond the trunk (the ropes run together from
        // high in the void, y 330..210); they are let go as we arrive and swing out to their places
        float gat = uGather * (1. - smoothstep(210., 330., y)) * (1. - g);
        th = mix(th, aG.x + (aG.y + 0.35 * loose) / ${SLEEVE_R}., gat);
        float rS = ${SLEEVE_R}. + aG.z * gat;
        vec3 c0 = vec3(cos(th) * rS, y, sin(th) * rS);
        float rS2 = max(0.36, distance(c0 + vec3(0., 0., ${TRUNK_Z}.), cameraPosition) * uPxK);
        p = c0 + vec3(p.x, 0., p.z) * rS2; ctrL = vec4(c0, rS2);
        vArcAdd = s * 420.; }`;
    { // stops: a metre and a quarter apart where we fly (y 14..150), coarse above where the ropes pale into the void
      const st = []; for (let y = 420; y > 330; y -= 30) st.push(y); for (let y = 330; y > 150; y -= 10) st.push(y); for (let y = 150; y > 132; y -= 3) st.push(y); for (let y = 132; y > 30; y -= 2) st.push(y); st.push(30, 26.5, 23, 19.5, 16, 12, 6, -1);
      const g = unitTube(5, st.map((y) => (420 - y) / 421)), n = NET_LINES * 2, SA = new Float32Array(n * 4);
      for (let k = 0; k < NET_LINES; k++) for (let e = 0; e < 2; e++) SA.set([NET_TH + (k + 0.5) * S_ANG, k % 2 ? -1 : 1, e ? 0.33 : -0.33, rng()], (k * 2 + e) * 4);
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(SA, 4)); sleeveSeed = SA;
      { const PA = new Float32Array(n); PA[26] = PA[27] = -1 - (NET_TH - TH_D) / 0.15; PA[28] = PA[29] = 1 - (NET_TH - TH_D) / 0.15;   /* (fix 8: the lacing is turned a little; the way in stays midway between its two lines) */ g.setAttribute('aP', new THREE.InstancedBufferAttribute(PA, 1)); sleevePart = PA; }   // (mend 11d) the parting value of each rope is set here ONCE: ropeAt of the hitch-climbers reads this same array
      // three hanks behind the trunk as the entry sees it, so the first picture is the spiral trunk alone between
      // the two great bundles; let go, the ropes swing round both sides to their places (hank azimuth, place in it m)
      { const HK = [91, 99, 107].map((d) => d * PI / 180), GA = new Float32Array(n * 3), cnt = [0, 0, 0, 0];
        for (let i = 0; i < n; i++) { const th = SA[i * 4]; let best = 0, bd = 9;
          for (let h = 0; h < 3; h++) { const d = Math.abs(Math.atan2(Math.sin(th - HK[h]), Math.cos(th - HK[h]))); if (d < bd) { bd = d; best = h; } }
          const j = cnt[best]++, ring = j < 4 ? 0 : 1, a = j * 2.4 + best, rr = ring ? 1.15 : 0.5;
          GA.set([th + Math.atan2(Math.sin(HK[best] - th), Math.cos(HK[best] - th)), rr * Math.cos(a) * 1.1, rr * Math.sin(a) * 0.9], i * 3); }
        g.setAttribute('aG', new THREE.InstancedBufferAttribute(GA, 3)); sleeveHank = GA; }
      const mat = cordMat({ gauge: 0.6, strands: 1, fine: true, vertexHead: 'attribute vec4 aS; attribute vec3 aG; attribute float aP; uniform float uFront, uGather, uSw, uPxK;', vertexBody: sleeveBody });
      Object.assign(mat.uniforms, SU, { uSw: HU.uSw, uPxK: HU.uPxK });
      const mesh = new THREE.InstancedMesh(g, mat, n); mesh.frustumCulled = false; trunk.parent.add(mesh); mesh.position.set(0, 0, TRUNK_Z);
      await ctx.yield();
      // a square knot where two pairs meet: two working ropes laid across the four, one above the other, each
      // crossing over at one side and under at the other (real tubes at rope gauge); they wrap in as the front passes
      const KP = [], KN = [], KUV = [], KI = [], SEG = 10, SDS = 5, kw = SDS + 1;
      for (let h = 0; h < 2; h++) { const base = KP.length / 3, sg = h ? 1 : -1;
        for (let i = 0; i <= SEG; i++) { const a = i / SEG * TAU, ca = Math.cos(a), sa = Math.sin(a);
          // centreline: an oval round the four ropes (x across the net, z out from it), climbing as it goes round
          const cx = 1.5 * ca, cz = 0.62 * sa, cy = sg * 0.5 + sg * 0.18 * ca + 0.1 * Math.sin(2 * a + h);
          let tx = -1.5 * sa, tz = 0.62 * ca, ty = -sg * 0.18 * sa; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          // frame: n1 = outward in the oval's plane, n2 = up-ish
          let ox = ca * 0.62, oz = sa * 1.5; const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
          const ux = ty * oz, uy = tz * ox - tx * oz, uz = -ty * ox;   // t x o
          for (let k = 0; k <= SDS; k++) { const b = k / SDS * TAU, cb = Math.cos(b), sb = Math.sin(b);
            const nx = ox * cb + ux * sb, ny = uy * sb, nz = oz * cb + uz * sb;
            KP.push(cx + nx * 0.3, cy + ny * 0.3, cz + nz * 0.3); KN.push(nx, ny, nz); KUV.push(i / SEG * 7.2 + h * 3.3, k / SDS); } }
        for (let i = 0; i < SEG; i++) for (let k = 0; k < SDS; k++) { const a = base + i * kw + k, b = a + 1, c = a + kw, d = c + 1; KI.push(a, c, b, b, c, d); } }
      const kg = new THREE.BufferGeometry();
      kg.setAttribute('position', new THREE.Float32BufferAttribute(KP, 3)); kg.setAttribute('normal', new THREE.Float32BufferAttribute(KN, 3));
      kg.setAttribute('uv', new THREE.Float32BufferAttribute(KUV, 2)); kg.setIndex(KI);
      const kmat = cordMat({ gauge: 0.6, strands: 1, seed: 0.5, fine: true, tone: 0.85, side: THREE.DoubleSide,
        vertexHead: 'uniform float uFront;', vertexBody: '{ float scK = smoothstep(uFront - 1., uFront + 3.5, instanceMatrix[3].y); p *= scK; ctrL = vec4((position - normal * 0.3) * scK, 0.3 * scK); }' });
      Object.assign(kmat.uniforms, SU);
      const rows = 14, knots = new THREE.InstancedMesh(kg, kmat, rows * 10), m4 = new THREE.Matrix4(), ke = new THREE.Euler(), kq = new THREE.Quaternion(), kv = new THREE.Vector3(), ks = new THREE.Vector3(); let c = 0;
      for (let r = 0; r < rows; r++) { const y = NET_YL - 2 * NET_H + r * NET_H;
        for (let k = 0; k < 10; k++) { const th = netWide(NET_TH + (2 * k + (r % 2 ? 0 : 1)) * S_ANG, y);
          ke.set(0, PI / 2 - th, rng.range(-0.12, 0.12)); kq.setFromEuler(ke); ks.setScalar(rng.range(0.94, 1.08));
          knots.setMatrixAt(c++, m4.compose(kv.set(SLEEVE_R * Math.cos(th), y, TRUNK_Z + SLEEVE_R * Math.sin(th)), kq, ks)); } }
      knots.frustumCulled = false; scene.add(knots); }
    await ctx.yield();

    // ---- the fringe: strands hung in rows from beech dowels, their tips a metre under the sea ---------------------
    const PXZ = [], PY = []; { const v = new THREE.Vector3(); for (let i = 0; i <= 96; i++) { path.curve.getPointAt(i / 96, v); PXZ.push(v.x, v.z); PY.push(v.y); } }
    const pathDist = (x, z) => { let m = 1e9; for (let i = 0; i < PXZ.length; i += 2) m = Math.min(m, Math.hypot(x - PXZ[i], z - PXZ[i + 1])); return m; };
    // THE ENTRY'S OPEN VOID. The first picture (and what the previous portal shows) is three shapes in open rose: the
    // spiral trunk and the two great bundles. So nothing of the forest hangs in the wedge the entry looks down (from
    // its right-hand bundle's window to its left-hand one's) nearer than the forest's own vanishing distance: the
    // trunks, cradles, net trunks, far ribbons and outlying fringe rows stand to either side of it and beyond the
    // Knot, and the forest's cords are gone into the void by 520 m (the Knot holds its tone: it is the subject).
    const eBear = (x, z) => Math.atan2(x - EX, z - 14) * 180 / PI, eDist = (x, z) => Math.hypot(x - EX, z - 14);
    const entryOpen = (x, z, m = 0) => { const b = eBear(x, z); return z > 14 && b > -31 - m && b < 27 + m && eDist(x, z) < 545; };
    const farFade = { value: weather === 'combing' ? new THREE.Vector3(180, 400, 500) : new THREE.Vector3(250, 440, 520) };
    const strands = [], ropes = [], dowels = []; let rareDowel = -1;
    const perDowel = Math.max(24, Math.round(54 * detail * Math.min(1, density)));
    const swingK = weather === 'draught' ? 0.6 : 1;
    const fineRopes = [], curtain = [], farStrands = [], rowRopes = [];
    // (repair after review 8) THE CORRIDOR'S ROWS ARE THERE FROM THE FIRST FRAME, whole and at their own height: rod on
    // its two ropes, lark's heads, the comb down to its dipped tips, wakes at the tips. Nothing of them is drawn in,
    // hidden or lowered at the entry on any screen: what stands in the corridor is what every flight sees.
    const rowPay = [];
    const addDowel = (x0, x1, y, z, falls, fine, far, carr) => {
      const sink = 0;
      const dw = { x: (x0 + x1) / 2, y, z, len: Math.abs(x1 - x0) + 3, nS: 2, sp: 1, falls: falls ? 1 : 0, h0: 0, h1: 0, sink }; dowels.push(dw);
      // its two carrying ropes (carr: where along it, 0..1; the corridor's rows hang theirs where the entry sees
      // them one behind the other, so sixteen dowels show four cords)
      const cf = carr || [0.12, 0.88]; dw.h0 = (cf[0] - 0.5) * (x1 - x0); dw.h1 = (cf[1] - 0.5) * (x1 - x0);
      for (const f of cf) (fine ? fineRopes : ropes).push({ x: x0 + (x1 - x0) * f, y: 420, z, L: 420 - y - 0.3, r: 0.3, delay: kinkDelay(x0, z), seed: rng() });
      // (a row that hangs low at the entry: each of its two ropes is paid out by a length of its own, hung from the rope's end,
      // which is drawn back into the hitch as the row comes up; the ropes themselves are not touched)
      if (sink > 0) for (const f of cf) rowPay.push({ x: x0 + (x1 - x0) * f, y: y + 0.3, z, L: 0.01, r: 0.3, delay: 1e6, seed: 0.5, pay: sink });
      const cut = rng.range(0.15, 0.4), a0 = rng.range(0.085, 0.115) * 1.5 * swingK;
      const nS = fine ? Math.max(6, Math.round(Math.abs(x1 - x0) / 1.9)) : Math.max(8, Math.round(perDowel * Math.abs(x1 - x0) / 54 * (far ? 0.5 : 1))); dw.nS = nS; dw.sp = (x1 - x0) / (nS - 1);
      // (fix 6) a row is a comb of separate strands with the sea between them: two of every three are hung, evenly
      // spaced (the third's draws are still taken, so nothing built after this moves)
      const thin = !fine, nK = thin ? nS - Math.floor(nS / 3) : nS; let j = 0;
      if (thin) { dw.nS = nK; dw.sp = (x1 - x0) / (nK - 1); }
      for (let i = 0; i < nS; i++) { if (thin && i % 3 === 2) { rng(); rng(); rng(); continue; }
        const f = j / (nK - 1), x = x0 + (x1 - x0) * f; j++;
        const L = (y + 1) * (1 - cut * f) * (1 + (rng() - 0.5) * 0.03);
        if (fine) { rowRopes.push({ x, y: y - 0.5, z: z + (rng() - 0.5) * 0.3, L, r: 0.3, amp: a0 * 0.8, delay: kinkDelay(x, z), tass: Math.min(0.5, 7 / L), flare: 1.1, seed: rng() }); continue; }
        (far ? farStrands : strands).push({ x, y: y - 0.4, z: z + (rng() - 0.5) * 0.3, L, r: 0.13, amp: a0, delay: kinkDelay(x, z), tass: Math.min(0.5, 7 / L), flare: 1.2, fall: falls ? nK - j : -1, seed: rng(), sink }); }
    };
    const pathX = (z) => { let m = 1e9, x = 0; for (let i = 0; i < PXZ.length; i += 2) { const dz = Math.abs(z - PXZ[i + 1]); if (i > 60 && dz < m) { m = dz; x = PXZ[i]; } } return x; };
    { let row = 0; const rareRow = 7, cut0 = [dowels.length, ropes.length, strands.length];
      // (fix 8: these eight rows across the course are no longer hung, see THE LANE below; their draws are still taken
      // from the build's generator so that nothing built after them moves)
      // eight rows over the sea, z 156..230: each dowel hangs just under the line of sight from the diamond to the
      // Knot's sill, so the fringe lies below and beside the Knot and never across it; the last row is behind us
      // by the time the eye stands open
      for (let z = 156; z <= 231; z += 10.6, row++) { const yRow = 43 - (z - 142) * 0.29, yL = yRow + rng.range(-2.5, 1.5), yR = yRow + rng.range(-2.5, 1.5), in0 = (lean > 0 ? 11.5 : 8) + row * 0.75, px = pathX(z);
        const zL = z + rng.range(-1.5, 1.5), zR = z + rng.range(-1.5, 1.5), xl0 = px - in0, xr0 = px + in0 - (lean > 0 ? 3.5 : 0), xr1 = px + 63;
        const cAt = (deg, zz, x0, x1, lo, hi) => Math.min(hi, Math.max(lo, (EX + (zz - 14) * Math.tan(deg * PI / 180) - x0) / (x1 - x0)));
        addDowel(xl0, xl0 - 54, yL, zL, false, false, false, [cAt(-10, zL, xl0, xl0 - 54, 0.06, 0.3), cAt(-19.4, zL, xl0, xl0 - 54, 0.6, 0.94)]);
        addDowel(xr0, xr1, yR, zR, rare && row === rareRow, false, false, [cAt(1.5, zR, xr0, xr1, 0.04, 0.3), cAt(12, zR, xr0, xr1, 0.5, 0.95)]);
        if (rare && row === rareRow) rareDowel = dowels.length - 1; }
      dowels.length = cut0[0]; ropes.length = cut0[1]; strands.length = cut0[2]; rareDowel = -1;
      await ctx.yield();
      // (fix 8) THE LANE. Over the sea the fringe hangs in rows that run ALONG the course, a lane 9.5 m to either hand:
      // each rod is seen end-on, its strands a comb that swings across the course as one
      // slow wave travelling down the lane, wakes at the dipped tips; a second, sparser line stands 24 m out. No rod
      // crosses the frame; the Knot stands clear over the lane's end. The unhitching (rare) is the last rod on the
      // left hand: its strands slip from our end onward, three a second from 22.5 s. Own generator.
      { const rr = ctx.core.makeRng('ftfa-lane:' + ctx.seed), pathY = (z) => { let m = 1e9, y = 0; for (let i = 62; i < PXZ.length; i += 2) { const dz = Math.abs(z - PXZ[i + 1]); if (dz < m) { m = dz; y = PY[i >> 1]; } } return y; };
        const addRail = (side, lat, z0, z1, up, falls, share, zRef, latB) => { const xa = pathX(z0) + side * lat, xb = pathX(z1) + side * (latB || lat + (z1 - z0) * 0.04), dx = xb - xa, dz = z1 - z0, len = Math.hypot(dx, dz);
          const y = pathY(zRef || z1) + up + rr.range(-0.8, 0.8), nS = Math.max(8, Math.round(len * share * Math.min(1, density) * (0.6 + 0.4 * detail)) + 1);
          dowels.push({ x: (xa + xb) / 2, y, z: (z0 + z1) / 2, len: len + 3, nS, sp: (falls ? -1 : 1) * len / (nS - 1), falls: falls ? 1 : 0, h0: -0.36 * len, h1: 0.36 * len, sink: 0, yaw: Math.atan2(-dz, dx) });
          for (const f of [0.14, 0.86]) ropes.push({ x: xa + dx * f, y: 420, z: z0 + dz * f, L: 420 - y - 0.3, r: 0.3, delay: kinkDelay(xa, z0), seed: rr() });
          const cut = rr.range(0.1, 0.28), a0 = rr.range(0.085, 0.115) * 1.5 * swingK, way = rr.chance(0.5);
          for (let i = 0; i < nS; i++) { const f = i / (nS - 1), x = xa + dx * f, z = z0 + dz * f, L = (y + 1) * (1 - cut * (way ? f : 1 - f)) * (1 + (rr() - 0.5) * 0.03);
            strands.push({ x: x + (rr() - 0.5) * 0.3, y: y - 0.4, z, L, r: 0.13, amp: a0, delay: kinkDelay(x, z), tass: Math.min(0.5, 7 / L), flare: 1.2, fall: falls ? i : -1, seed: rr(), sink: 0, slack: zRef ? 1 : 0 }); }
          return dowels.length - 1; };
        // (the brief's dowels are 60 m long: one long rod a side, then a shorter one; each hangs level, so we come down
        // past its near end from above and are under its far end)
        const lat = lean > 0 ? 12 : 9.5;
        addRail(1, lat, 152, 190, 4.5, false, 1);
        // (the one rod that can come unhitched hangs apart, out on the left hand beyond the lane's end and square to it,
        // 28 to 48 m from the course and under the line of sight: seen broadside from the lane, its strands a strand's
        // length apart on screen, so each slipped one falls alone against the open sea)
        { const k = addRail(1, 28, 234, 236, 7.5, rare, 0.75, 235, 48); if (rare) rareDowel = k; }
        // (the lane ends 120 m short of the Knot: from 25.7 s the Knot stands whole over open water, nothing beside it)
        addRail(-1, lat, 157, 187, 4.5, false, 1); addRail(-1, lat + 0.4, 196, 215, 4.5, false, 1);
        addRail(1, 27, 148, 200, 15, false, 0.4); addRail(-1, 27, 154, 204, 15, false, 0.4); }
      // three more rows beyond the ring, low, so the last approach has cords in its lower frame
      for (const z of [437, 452, 470]) { addDowel(-10, -25, rng.range(16, 24), z, false, true); addDowel(10, 25, rng.range(16, 24), z, false, true); addDowel(-108, -162, rng.range(20, 31), z + 6, false, false, true); addDowel(108, 162, rng.range(20, 31), z + 6, false, false, true); }   // (the outer rows stand beyond the hauled tails, clear of the water the drops fall through)
      const outer = Math.round(22 * density);
      for (let i = 0; i < outer; i++) { const sx = i % 2 ? 1 : -1; let x = sx * rng.range(95, 330), z = rng.range(60, 560); const w = rng.range(40, 60), y = rng.range(30, 75);
        // (an outlying row stands clear of the entry's open void: it is slid out along its own line until it is)
        for (let k = 0; k < 40 && (entryOpen(x, z, 3) || entryOpen(x + sx * w, z, 3)); k++) x += sx * 14;
        if (Math.abs(x) > 520) continue;
        addDowel(x, x + sx * w, y, z, false, false, true); } }
    await ctx.yield();
    // the exit ring's curtain: 28 cords by lark's heads from its lower half, parted in the middle
    const RING = new THREE.Vector3(0, 46, 420), RING_R = 8.1;
    for (let i = 0; i < 28; i++) { const side = i < 14 ? -1 : 1, f = (i % 14) / 13, a = -PI / 2 + side * (0.3 + f * 1.2);
      const x = RING_R * Math.cos(a), y = RING.y + RING_R * Math.sin(a) - 0.7;
      curtain.push({ x, y, z: RING.z - (y - RING.y) * 0.19, L: y + 1 + rng.range(-0.6, 0.3), r: 0.13, amp: 0.07 * swingK, delay: 1.5 + Math.abs(x) * 0.07, tass: 0.22, flare: 2.4, seed: rng() }); }
    const fringeMat = hangMat({ gauge: 0.2, strands: 1, seed: 0.1 }); fringeMat.uniforms.uGap = { value: 1.05 }; fringeMat.uniforms.uRowTide = { value: 1 }; fringeMat.uniforms.uTideJ = { value: 0.25 }; fringeMat.uniforms.uFade = farFade;
    // (repair after review 8: neither the corridor's rows nor the exit ring's curtain is drawn in: both are there
    // whole from the first frame, as in the versions before fix 7; the curtain keeps a material of its own)
    const ROWIN = { value: 1 }, curtMat = hangMat({ gauge: 0.2, strands: 1, seed: 0.1 });
    for (const k of ['uGap', 'uRowTide', 'uTideJ', 'uFade']) curtMat.uniforms[k] = fringeMat.uniforms[k]; curtMat.uniforms.uShow = ROWIN;
    hang(unitTube(3, [0, 0.2, 0.4, 0.55, 0.7, 0.88, 0.95, 1]), strands.filter((q) => !q.slack), fringeMat);
    // (fix 8) the strands of the rod that can come unhitched are cut finer along their length (on every seed), so that a
    // slipped one falls as a curve: an S down it and a hook at its upper end, not a bent stick
    hang(unitTube(3, [0, 0.012, 0.03, 0.05, 0.075, 0.1, 0.14, 0.18, 0.23, 0.28, 0.34, 0.4, 0.47, 0.55, 0.63, 0.7, 0.78, 0.88, 0.95, 1]), strands.filter((q) => q.slack), fringeMat);
    await ctx.yield();
    hang(unitTube(3, evenStops(22)), curtain, curtMat);
    await ctx.yield();
    // wakes: every third dipped tip draws two thin pale arcs on the sea, opening behind it for six seconds; the same
    // pendulum law as the strands, so the arcs follow the travelling wave and a row reads as combed water
    { const src = strands.filter((_, i) => i % 6 === 0).concat(curtain)   /* (fix 7: every other tip draws its wake, as many as before the rows were thinned) */, n = src.length;
      const P = [], I = [], NSEG = 7;
      for (let arm = -1; arm <= 1; arm += 2) { const base = P.length / 3;
        for (let j = 0; j <= NSEG; j++) P.push(-1, j / NSEG, arm, 1, j / NSEG, arm);
        for (let j = 0; j < NSEG; j++) { const a = base + j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      const A = new Float32Array(n * 4), B = new Float32Array(n * 4);
      const wmat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
        uniforms: { uSw: HU.uSw, uKinkAge: HU.uKinkAge, uLean: HU.uLean, uFallT: HU.uFallT, uPxK: HU.uPxK, uBlue: S.uBlue, uIndigo: S.uIndigo },
        vertexShader: /* glsl */`attribute vec4 aA; attribute vec4 aB; uniform float uSw, uKinkAge, uLean, uPxK, uFallT; varying float vF;
          float tipX(float t, float k){ float T = 2.007 * sqrt(max(aA.x, 0.5));
            float ang = aA.z * mix(sin(6.2831853 * t / T), sin(6.2831853 * max(k, 0.) / T), smoothstep(0., 0.5, k)) + uLean;
            return tan(clamp(ang, -1., 1.)) * aA.y; }
          void main(){ vec3 top = instanceMatrix[3].xyz; float f = position.y, tau = f * 6.5, k = uKinkAge - aA.w;
            float x0 = tipX(uSw - tau, k - tau), x1 = tipX(uSw - tau - 0.25, k - tau - 0.25);
            // the sea draws slowly towards the Knot: each tip's wake is carried that way, a pair of arcs that keeps the
            // swing it was drawn with
            vec2 c0 = vec2(top.x + x0, top.z + position.z * (0.2 + 0.16 * tau) + 5.2 * tau);
            vec2 dv = vec2(x1 - x0, -(5.2 + position.z * 0.16) * 0.25); dv /= max(length(dv), 1e-4);
            vec2 nrm = vec2(-dv.y, dv.x);
            float dist = distance(vec3(c0.x, 0., c0.y), cameraPosition);
            float fell = step(0., aB.y) * step(aB.y * 0.3333, uFallT);
            // 1.5 px on screen: a line running across the view lies foreshortened on the sea, so it is drawn wider there
            float hw = max(0.05, dist * uPxK * 1.2) * mix(1., clamp(dist / max(abs(cameraPosition.y), 1.), 1., 9.), abs(nrm.y));
            hw *= (1. - fell) * (1. - smoothstep(110., 150., dist));
            vec2 pp = c0 + nrm * position.x * hw; vF = f;
            gl_Position = projectionMatrix * viewMatrix * vec4(pp.x, 0.06, pp.y, 1.); }`,
        fragmentShader: /* glsl */`precision highp float; uniform vec3 uBlue, uIndigo; varying float vF;
          void main(){ if (vF > 0.97) discard; gl_FragColor = vec4(mix(uBlue, uIndigo, 0.8 * smoothstep(0.72, 0.97, vF)), 1.); }` });
      const mesh = new THREE.InstancedMesh(g, wmat, n), wm4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) { const h = src[i]; A.set([h.L, h.y, h.amp || 0, h.delay || 0], i * 4); B.set([0, h.fall ?? -1, h.seed || 0, 0], i * 4); mesh.setMatrixAt(i, wm4.makeTranslation(h.x, h.y, h.z)); }
      g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4));
      mesh.frustumCulled = false; scene.add(mesh); }
    await ctx.yield();
    { const fm = hangMat({ gauge: 0.2, strands: 1, seed: 0.1 }); fm.uniforms.uGap = { value: 162 / perDowel }; fm.uniforms.uRowTide = { value: 1 }; fm.uniforms.uTideJ = { value: 0.25 }; fm.uniforms.uFade = farFade;
      hang(unitTube(3, [0, 0.5, 0.86, 1]), farStrands, fm); }   // the outlying curtains: every other strand   // the ring's curtain: fine enough to carry the kink
    await ctx.yield();
    // a dowel: a turned beech rod with rounded ends and its one paler band, a rope collar where each of its two
    // carrying ropes is hitched round it, and a lark's head at every strand (drawn in the rod's material)
    { const RINGS = [[0, -0.4, 0.001], [0, -0.27, 0.7], [0, 0, 1], [1, -1.0, 1], [1, -0.88, 1.8], [1, 0.88, 1.8], [1, 1.0, 1],
        [2, -1.0, 1], [2, -0.88, 1.8], [2, 0.88, 1.8], [2, 1.0, 1], [3, 0, 1], [3, 0.27, 0.7], [3, 0.4, 0.001]];
      const SD = 8, P = [], R = [], I = [];
      RINGS.forEach((r, j) => { for (let i = 0; i <= SD; i++) { const t = i / SD * TAU; P.push(0, Math.cos(t), Math.sin(t)); R.push(r[0], r[1], r[2]); }
        if (j) for (let i = 0; i < SD; i++) { const a = (j - 1) * (SD + 1) + i, b = a + 1, c = a + SD + 1, d = c + 1; I.push(a, b, c, b, d, c); } });
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); dg.setAttribute('aR', new THREE.Float32BufferAttribute(R, 3)); dg.setIndex(I);
      const DA = new Float32Array(dowels.length * 4); dowels.forEach((d, i) => DA.set([Math.abs(d.sp), d.nS, d.falls, (d.sp < 0 ? -1 : 1) * (d.falls ? -1 : 1)], i * 4));
      dg.setAttribute('aD', new THREE.InstancedBufferAttribute(DA, 4));
      const DH = new Float32Array(dowels.length * 3); dowels.forEach((d, i) => DH.set([d.h0, d.h1, d.sink], i * 3));   // (.z: zero for every row)
      dg.setAttribute('aH', new THREE.InstancedBufferAttribute(DH, 3));
      const dmat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
        uniforms: { ...S, uGW: { value: 0.16 }, uPly: { value: 3 }, uFallT: HU.uFallT, uFade: farFade, uSink: HU.uSink },
        vertexShader: /* glsl */`attribute vec3 aR; attribute vec4 aD; attribute vec3 aH; uniform float uSink; varying float vX, vH, vHx, vEnd; varying vec2 vYZ; varying vec4 vD; varying vec3 vW;
          void main(){ float len = length(instanceMatrix[0].xyz); vec3 ax = instanceMatrix[0].xyz / max(len, 1e-4);
            float span = (aD.y - 1.) * aD.x, hk = step(0.5, aR.x) * step(aR.x, 2.5);
            float X = aR.x < 0.5 ? -0.5 * len + aR.y : aR.x < 1.5 ? min(aH.x, aH.y) + aR.y : aR.x < 2.5 ? max(aH.x, aH.y) + aR.y : 0.5 * len + aR.y;
            vec3 pl = instanceMatrix[3].xyz + ax * X + (instanceMatrix[1].xyz * position.y + instanceMatrix[2].xyz * position.z) * (0.38 * aR.z);
            pl.y -= aH.z * uSink;   // (zero for every row)
            vec4 w = modelMatrix * vec4(pl, 1.);
            vX = X; vH = hk * step(1.2, aR.z); vHx = hk * aR.y; vEnd = 0.5 * len - abs(X); vYZ = position.yz; vD = aD; vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: 'precision highp float;\n' + K.STYLE_GLSL + LARK_GLSL + /* glsl */`
          uniform float uFallT; varying float vX, vH, vHx, vEnd; varying vec2 vYZ; varying vec4 vD; varying vec3 vW;
          void main(){ float sp = max(vD.x, 1e-3), nS = vD.y, span = (nS - 1.) * sp;
            float dq = max(fwidth(vX), 1e-4), dy = max(fwidth(vYZ.x), 1e-4);
            float c = (vX + 0.5 * span) / sp, i = floor(c + 0.5), q = abs(c - i) * sp;
            float idx = vD.w > 0. ? i : nS - 1. - i;
            float on = step(-0.5, c) * step(c, nS - 0.5) * (1. - vD.z * step(idx * 0.3333, uFallT));
            vec3 wood = mix(uBeech, mix(uBeech, uCream, 0.5), smoothstep(0.5 - dq, 0.5 + dq, vEnd) * (1. - smoothstep(0.85 - dq, 0.85 + dq, vEnd)));
            vec3 col = larkCol(wood, q, dq, sp, on, vYZ.x, dy);
            // the hitch of a carrying rope: three turns of rope round the rod
            float fh = max(fwidth(vH), 1e-4), hm = smoothstep(0.5 - 0.5 * fh, 0.5 + 0.5 * fh, vH), lw = max(0.04, 0.75 * dq);
            float tl = (1. - smoothstep(lw - 0.5 * dq, lw + 0.5 * dq, abs(abs(vHx) - 0.3))) * smoothstep(3., 5., 0.6 / dq);
            col = mix(col, mix(uCream, uGroove, tl), hm);
            gl_FragColor = vec4(styleDistance(col, vW, cameraPosition), 1.); }` });
      const dm = new THREE.InstancedMesh(dg, dmat, dowels.length), m4 = new THREE.Matrix4();
      const dsc = new THREE.Vector3();
      dowels.forEach((d, i) => dm.setMatrixAt(i, m4.makeRotationY(d.yaw || 0).scale(dsc.set(d.len, 1, 1)).setPosition(d.x, d.y, d.z)));
      dm.frustumCulled = false; scene.add(dm); dowelMesh = dm; }
    await ctx.yield();

    // ---- the spiral trunk's tassel, and the ropes that hold the ring ----------------------------------------------
    for (let i = 0; i < 64; i++) { const a = i / 64 * TAU + rng() * 0.05, rr = 2.2 + (i % 3) * 0.75;
      ropes.push({ x: rr * Math.cos(a), y: 28, z: TRUNK_Z + rr * Math.sin(a), L: 29 + rng.range(-0.8, 0.7), r: 0.3, amp: 0.035, delay: kinkDelay(0, TRUNK_Z), tass: 0.3, flare: 0.9, seed: rng() }); }
    for (const a of [PI / 2, 0.6, PI - 0.6]) { const x = RING_R * Math.cos(a), y = RING.y + RING_R * Math.sin(a);
      fineRopes.push({ x, y: 420, z: RING.z - (y - RING.y) * 0.19, L: 420 - y - 0.4, r: 0.3, delay: 0.2, seed: rng() }); }
    ropes.push({ x: 0, y: RING.y - RING_R - 0.4, z: RING.z + RING_R * 0.19, L: RING.y - RING_R + 0.6, r: 0.3, tass: 0.2, flare: 1.2, seed: rng() });
    const ropeMat = hangMat({ gauge: 0.6, strands: 1, seed: 0.2, fine: true }); ropeMat.uniforms.uLean = { value: 0 }; ropeMat.uniforms.uFade = farFade; ropeMat.uniforms.uRoundK = { value: 1 };
    ropes.push(...rowPay);
    hang(unitTube(5, evenStops(6)), ropes, ropeMat);
    await ctx.yield();
    // (the rope fringes beyond the ring: from far off their ropes would fuse into a sheet, so a seeded share is left out)
    { const rowMat = hangMat({ gauge: 0.6, strands: 1, seed: 0.2, fine: true }); rowMat.uniforms.uLean = { value: 0 }; rowMat.uniforms.uGap = { value: 1.9 }; rowMat.uniforms.uFade = farFade; rowMat.uniforms.uRoundK = { value: 1 };
      hang(unitTube(5, evenStops(10)), rowRopes, rowMat); }
    await ctx.yield();
    { const st = [0, 0.2, 0.4, 0.55, 0.65, 0.7]; for (let i = 0; i <= 26; i++) st.push(0.74 + i * 0.01);
      hang(unitTube(5, st), fineRopes, ropeMat); }   // the ropes about the ring: stops close enough to show the kink come down
    // the exit ring: turned beech with its paler band, and a lark's head where each of its 28 curtain cords hangs
    { const rmat = new THREE.ShaderMaterial({
        uniforms: { ...S, uGW: { value: 0.16 }, uPly: { value: 3 }, uKeep: { value: 1 } },   // (the ring holds its tone from afar: it is where we are going)
        vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vUv = uv; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: 'precision highp float;\n' + K.STYLE_GLSL + LARK_GLSL + /* glsl */`
          varying vec2 vUv; varying vec3 vW;
          void main(){ float dl = abs(vUv.x * 6.2831853 - 4.712389), sp = 1.2 / 13. * ${RING_R.toFixed(2)};
            float c = (dl - 0.3) / (1.2 / 13.), i = floor(c + 0.5), q = abs(c - i) * sp;
            float dq = max(fwidth(dl) * ${RING_R.toFixed(2)}, 1e-4), yn = -cos(vUv.y * 6.2831853), dy = max(fwidth(yn), 1e-4);
            float on = step(-0.5, c) * step(c, 13.5);
            // turned beech all the way round: its one paler band runs round the rim on the face towards the approach
            float fy = max(fwidth(vUv.y), 1e-4);
            vec3 wood = mix(uBeech, mix(uBeech, uCream, 0.5), smoothstep(0.715 - fy, 0.715 + fy, vUv.y) * (1. - smoothstep(0.785 - fy, 0.785 + fy, vUv.y)));   // (fix 6: the band is one thin line, the rim reads as beech)
            vec3 col = larkCol(wood, q, dq, sp, on, yn, dy);
            // a rope collar where each of the three ropes from above and the one to the sea is hitched: three cream
            // turns round the rim, a thin groove line between the turns
            float th = vUv.x * 6.2831853, m = min(min(abs(th - 1.5707963), abs(th - 0.6)), min(abs(th - 2.5415927), abs(th - 4.712389))) * ${RING_R.toFixed(2)};
            float cw = 0.95, cm = 1. - smoothstep(cw - 0.5 * dq, cw + 0.5 * dq, m), lw = max(0.045, 0.75 * dq);
            float tl = (1. - smoothstep(lw - 0.5 * dq, lw + 0.5 * dq, abs(m - 0.32))) * smoothstep(3., 5., 0.6 / dq);
            col = mix(col, mix(uCream, uGroove, tl), cm);
            gl_FragColor = vec4(styleDistance(col, vW, cameraPosition), 1.); }` });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_R + 0.1, 0.7, 10, 56), rmat);
      ring.position.copy(RING); ring.rotation.x = -11 * PI / 180; scene.add(ring); }
    await ctx.yield();

    // ---- (fix 6) the sleeve's strays, and the trunk's rings on the sea ----------------------------------------------
    // Six loose ropes of the sleeve hang outside the net (33 m from the trunk), each ending level with the flight in
    // a neck and a combed tassel of cord dipped blue, two with a beech bead: as we come down the spiral they pass
    // through the lower left of the frame, in front of the sea. They are let down out of the void as the sleeve is
    // let go (uLift, u 0.055 to 0.135), so the entry's open rose is untouched. Their own generator: no draw is taken
    // from the build's rng, so nothing else moves.
    const SL = { uLift: { value: 340 } }, strayBeads = [];
    { const rx = ctx.core.makeRng('ftfa-strays:' + ctx.seed), sr = [], st = [];
      [140, 175, 210, 245, 280, 315].forEach((A, k) => { const a = (A + rx.range(-4, 4)) * PI / 180, rr = 33 + rx.range(-1.5, 2.5), x = rr * Math.cos(a), z = TRUNK_Z + rr * Math.sin(a);
        const yN = 116 - 62 * (A - 100) / 360 - 3 + rx.range(-1, 1), tl = rx.range(6.5, 8.5);
        sr.push({ x, y: 420, z, L: 420 - yN, r: 0.3, amp: 0, delay: kinkDelay(x, z), tass: 0, flare: 0, seed: rx() });
        for (let i = 0; i < 9; i++) { const ph = (i + rx()) / 9 * TAU, rho = 0.34 * rx.range(0.2, 0.9);
          st.push({ x: x + rho * Math.cos(ph), y: yN + 0.3, z: z + rho * Math.sin(ph), L: tl * rx.range(0.72, 1.08) * (rx.chance(0.14) ? 0.6 : 1), r: 0.1, amp: 0.32 / tl, delay: kinkDelay(x, z),
            yaw: -ph, tilt: (0.02 + 0.07 * rho / 0.34) * rx.range(0.6, 1.3), seed: rx() }); }
        if (k % 2 === 0) strayBeads.push({ x, y: yN + 0.75, z, r: rx.range(0.85, 1.05) }); });
      const srMat = hangMat({ gauge: 0.6, strands: 1, seed: 0.2, fine: true }); srMat.uniforms.uLean = { value: 0 }; srMat.uniforms.uRoundK = { value: 1 }; srMat.uniforms.uLift = SL.uLift;
      hang(unitTube(5, evenStops(8)), sr, srMat);
      const stMat = hangMat({ gauge: 0.2, strands: 1, seed: 0.27 }); stMat.uniforms.uLean = { value: 0 }; stMat.uniforms.uDipEnd = { value: 4.6 }; stMat.uniforms.uLift = SL.uLift;
      hang(unitTube(3, [0, 0.5, 0.8, 1]), st, stMat);
      // the spiral trunk's tassel touches the sea: wide slow rings open from it over the water the spiral looks out on
      // (kept out of the corridor of fringe rows, which draws its own wakes)
      if (hero.sea) { hero.sea.material.uniforms.uRing.value.set(0, TRUNK_Z - HERO_Z, 620, 1); hero.sea.material.uniforms.uRingCut.value.set(118, 150, 70, 100); } }
    await ctx.yield();

    // ---- the forest: sinnet trunks hung on all sides, each ending in a tassel over the sea, a bead at its neck ----
    // a trunk ends at its neck under a beech bead; below it the tassel is its own combed strands, each a rope hung
    // a little splayed and cut unevenly, with the void showing between them
    const trunks = [], fruit = [], tassels = [], tLean = lean * 0.25;
    const addTassel = (x, y, z, r, tl, n0, delay) => { const n = Math.max(6, Math.round(n0 * (0.7 + 0.3 * detail))); for (let i = 0; i < n; i++) { const ph = (i + rng()) / n * TAU, rho = r * rng.range(0.2, 0.9);
      tassels.push({ x: x + rho * Math.cos(ph), y, z: z + rho * Math.sin(ph), L: tl * rng.range(0.72, 1.08) * (rng.chance(0.12) ? 0.62 : 1), r: 0.3, amp: 0.3 / tl, delay,
        yaw: -ph, tilt: (0.03 + 0.11 * rho / r) * rng.range(0.6, 1.3), seed: rng() }); } };
    const addTrunk = (x, z, yb, r) => { const L = 420 - yb, tl = Math.min(30, rng.range(5, 9) * r), Ln = L - tl;
      trunks.push({ x, y: 420, z, L: Ln, r, amp: 0.8 / L, delay: kinkDelay(x, z), tass: 0, flare: 0, seed: rng() });
      const nx = x + Math.sin(tLean) * Ln, ny = 420 - Math.cos(tLean) * Ln;
      fruit.push({ x: nx, y: ny + r * 0.6, z, r: r * 1.55, push: r * 1.15 });
      addTassel(nx, ny + r * 0.3, z, r, tl, Math.max(8, Math.min(14, Math.round(4 + r * 3))), kinkDelay(x, z)); };
    for (const t of [[-16, 58, 103, 2.2], [48, 36, 96, 2.6], [-22, 22, 72, 1.8], [66, 98, 75, 3.0], [-60, 130, 66, 2.4], [88, 150, 38, 2.0], [-70, 60, 30, 3.2], [80, 10, 110, 2.8]]) addTrunk(...t);
    // ---- cradles: plant-hanger nets of square knots gathered under a beech ring, each holding one great bead, turning ----
    const cradles = [];
    const addCradle = (x, z, y) => { cradles.push({ x, y, z, ph: rng() * TAU, w: rng.range(0.1, 0.2) * (rng.chance(0.5) ? 1 : -1) });
      trunks.push({ x, y: 420, z, L: 420 - y - 1.2, r: 0.42, amp: 0, delay: kinkDelay(x, z), tass: 0, flare: 0, seed: rng() });
      fruit.push({ x, y: y - 10.2, z, r: 3.0, round: 1 });
      addTassel(x, y - 14.4, z, 0.5, rng.range(5, 8), 9, kinkDelay(x, z)); };
    for (const c of [[-46, 78, 122], [52.7, 76, 126], [-50, 462, 80], [44, 476, 98], [-22, 505, 112], [62, 508, 70], [-88, 490, 100]]) addCradle(...c);
    { let tries = 0;
      while (cradles.length < 16 && tries++ < 600) { const a = rng() * TAU, d = 90 + 300 * Math.sqrt(rng()), x = Math.cos(a) * d, z = 240 + Math.sin(a) * d, y = rng.range(60, 150);
        if (pathDist(x, z) < 45 || Math.hypot(x, z - TRUNK_Z) < 62 || Math.hypot(x, z - HERO_Z) < 175 || (Math.abs(x) < 78 && z > 138 && z < 246) || entryOpen(x, z, 2)) continue;
        if (cradles.some((c) => Math.hypot(x - c.x, z - c.z) < 34) || trunks.some((t) => Math.hypot(x - t.x, z - t.z) < 14)) continue;
        addCradle(x, z, y); } }
    let cradleCords = null, cradleRings = null;
    { const CP = [], CN = [], CUV = [], CI = [], T = new THREE.Vector3(), A = new THREE.Vector3(), Bv = new THREE.Vector3();
      const tubeAlong = (pts, rad, sides, arc0, upRef, closed) => { const n = pts.length, base = CP.length / 3, w = sides + 1; let arc = arc0;
        for (let j = 0; j < n; j++) { const pa = closed ? pts[(j + n - 2) % (n - 1)] : pts[Math.max(0, j - 1)], pb = closed ? pts[(j + 1) % (n - 1)] : pts[Math.min(n - 1, j + 1)];
          T.subVectors(pb, pa).normalize();
          if (upRef) A.set(0, 1, 0); else A.set(pts[j].x, 0, pts[j].z);
          A.addScaledVector(T, -A.dot(T)); if (A.lengthSq() < 1e-5) { A.set(T.z, 0, -T.x); if (A.lengthSq() < 1e-5) A.set(1, 0, 0); } A.normalize(); Bv.crossVectors(T, A);
          if (j) arc += pts[j].distanceTo(pts[j - 1]);
          for (let i = 0; i <= sides; i++) { const t = i / sides * TAU, c = Math.cos(t), s = Math.sin(t), nx = A.x * c + Bv.x * s, ny = A.y * c + Bv.y * s, nz = A.z * c + Bv.z * s;
            CP.push(pts[j].x + nx * rad, pts[j].y + ny * rad, pts[j].z + nz * rad); CN.push(nx, ny, nz); CUV.push(arc, i / sides); } }
        for (let j = 0; j < n - 1; j++) for (let i = 0; i < sides; i++) { const a = base + j * w + i, b = a + 1, c = a + w, d = c + 1; CI.push(a, c, b, b, c, d); } };
      const cyl = (th, rho, y) => new THREE.Vector3(rho * Math.cos(th), y, rho * Math.sin(th));
      // a square knot: two wraps round the cords that meet there, one above the other
      const knot = (th, rho, y, ax, az) => { for (let h = 0; h < 2; h++) { const sg = h ? 1 : -1, pts = [];
        for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU + h * 0.5, ca = Math.cos(a), sa = Math.sin(a), rr = rho + az * sa;
          pts.push(new THREE.Vector3(rr * Math.cos(th) - ax * ca * Math.sin(th), y + sg * 0.3 + sg * 0.12 * ca, rr * Math.sin(th) + ax * ca * Math.cos(th))); }
        tubeAlong(pts, 0.24, 4, h * 2.3 + th, true, true); } };
      for (let p = 0; p < 4; p++) { const th = p * PI / 2;
        for (const s of [-1, 1]) { const q = th + s * (PI / 4 - 0.09);
          const cv = new THREE.CatmullRomCurve3([cyl(th + s * 0.3, 0.35, -1.3), cyl(th + s * 0.2, 0.5, -2.7), cyl(th + s * 0.118, 1.7, -5), cyl(th + s * (PI / 4 - 0.073), 2.75, -7.6),
            cyl(q, 3.22, -10.2), cyl(q, 2.35, -12.6), cyl(q, 0.5, -13.7), cyl(q, 0.42, -14.7)], false, 'catmullrom', 0.4);
          tubeAlong(cv.getPoints(13), 0.26, 4, p * 3.1 + s, false, false); }
        knot(th, 1.7, -5, 0.62, 0.42); knot(th + PI / 4, 2.75, -7.6, 0.62, 0.42); await ctx.yield(); }
      knot(0, 0, -2.1, 0.62, 0.62); knot(0, 0, -14.1, 0.6, 0.6);   // the gathering under the ring, and the neck under the bead
      await ctx.yield();
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(CP, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(CN, 3));
      cg.setAttribute('uv', new THREE.Float32BufferAttribute(CUV, 2)); cg.setIndex(CI);
      cradleCords = new THREE.InstancedMesh(cg, cordMat({ gauge: 0.6, pitch: 0.85, grooveW: 0.2, strands: 1, seed: 0.55, fine: true, side: THREE.DoubleSide }), cradles.length);
      cradleCords.material.uniforms.uFade = farFade;
      const beechFar = K.beechMaterial({ style: S }); beechFar.uniforms.uFade = farFade;
      cradleRings = new THREE.InstancedMesh(new THREE.TorusGeometry(1.3, 0.3, 5, 14), beechFar, cradles.length);
      const cm = new THREE.Matrix4();
      cradles.forEach((c, i) => { cm.makeRotationY(c.ph).setPosition(c.x, c.y, c.z); cradleCords.setMatrixAt(i, cm); cradleRings.setMatrixAt(i, cm); });
      cradleCords.frustumCulled = false; cradleRings.frustumCulled = false; scene.add(cradleCords); scene.add(cradleRings); }
    await ctx.yield();
    // ---- (fix 7) the ring's hanging: the large knotted thing that frames the exit -------------------------------------
    // A macrame wall hanging just behind the beech ring: eighteen pairs of rope hung by lark's heads from one long
    // beech dowel (two carrying ropes up into the void), tied into a net of diamonds by square knots (a net is darker
    // than a fringe: its ropes sit a tone under a plain rope, its knots at the full cord-on-cord tone), its lower
    // edge a V of tassels with a beech bead at each neck. The net is drawn on one plumb sheet and everything between
    // its ropes is cut away (as the net trunks are): each rope round by its own lay (lens marks that broaden towards
    // the lower-right flank), a scalloped outline, never under two pixels. The portal's disc hides what passes behind
    // the opening. The kink comes down it (a sideways bump, 110 m/s) 1.2 s after the jerk; its tassels swing as
    // pendulums and restart with the kink. Its own generator: no draw is taken from the build's rng.
    const NETH = { NL: 18, P: 5.2, A: 2.05, Y0: 34, H: 7, YT: 128.5, Z: 423.5 };
    { const rx = ctx.core.makeRng('ftfa-ringnet:' + ctx.seed), h = NETH;
      for (let k = 0; k < h.NL; k++) { const sgn = k % 2 ? -1 : 1, dk = Math.abs(k - (h.NL - 1) / 2), nE = Math.floor(dk / 2.2), yE = h.Y0 + nE * h.H;
        const x = (k - (h.NL - 1) / 2) * h.P + sgn * h.A * (nE % 2 ? -1 : 1), tl = rx.range(6, 9.5), dl = 1.2 + (250 - yE) / 110;
        fruit.push({ x, y: yE - 0.95, z: h.Z, r: rx.range(0.62, 0.8), push: 0.5 });
        for (let i = 0; i < 8; i++) { const ph = (i + rx()) / 8 * TAU, rho = 0.42 * rx.range(0.2, 0.9);
          tassels.push({ x: x + rho * Math.cos(ph), y: yE - 1.2, z: h.Z + rho * Math.sin(ph), L: tl * rx.range(0.72, 1.08) * (rx.chance(0.14) ? 0.6 : 1), r: 0.3, amp: 0.3 / tl, delay: dl,
            yaw: -ph, tilt: (0.03 + 0.1 * rho / 0.42) * rx.range(0.6, 1.3), seed: rx() }); } }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-50, 24, h.Z, 50, 24, h.Z, 50, 420, h.Z, -50, 420, h.Z], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const nmat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
        uniforms: { ...S, uGW: { value: 0.16 }, uPly: { value: 3 }, uKeep: { value: 1 }, uKinkAge: HU.uKinkAge },
        vertexShader: /* glsl */`varying vec2 vP; varying vec3 vW;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vP = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: 'precision highp float;\n' + K.STYLE_GLSL + RINGNET_GLSL });
      const mesh = new THREE.Mesh(g, nmat); mesh.frustumCulled = false; scene.add(mesh); }
    await ctx.yield();
    // ---- net trunks: tubes of alternating square knots, lace you can see through (the sleeve's diamond lacing). The lacing
    // is drawn on a tube and everything between the cords is cut away; each crossing is a knot, a tone darker. ----
    const netTrunks = [];
    { for (const [x, z, yb, R] of [[-105, 150, 40, 3.6], [118, 70, 56, 3.2], [-150, 236, 30, 4], [132, 216, 48, 3.4], [-120, 560, 36, 3.8], [106, 588, 52, 3.4]]) {
        const tl = rng.range(12, 18), L = 420 - yb - tl; netTrunks.push({ x, y: 420, z, L, R, seed: rng() });
        fruit.push({ x, y: yb + tl + 1.2, z, r: R * 0.8, push: R * 0.5 }); addTassel(x, yb + tl, z, R * 0.45, tl, 12, kinkDelay(x, z)); }
      const n = netTrunks.length, g = unitTube(12, [0, 0.4, 0.8, 0.93, 0.975, 1]), NA = new Float32Array(n * 4), nm4 = new THREE.Matrix4();
      const nmat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
        uniforms: { ...S, uGW: { value: 0.16 }, uPly: { value: 3 }, uSw: HU.uSw, uFade: farFade },
        vertexShader: /* glsl */`attribute vec4 aN; uniform float uSw; varying vec2 vU; varying vec3 vW;
          void main(){ float s = uv.x, L = aN.x; vec3 top = instanceMatrix[3].xyz;
            float R = aN.y * (1. - 0.82 * smoothstep(0.9, 1., s));               // gathered into the neck
            float sway = 0.9 * s * sin(uSw * 6.2831853 / (2.007 * sqrt(max(L, 1.))) + aN.z * 6.3);
            vec3 w = top + vec3(position.x * R + sway, -s * L, position.z * R);
            vU = vec2(uv.y, s * L); vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
        fragmentShader: 'precision highp float;\n' + K.STYLE_GLSL + /* glsl */`
          varying vec2 vU; varying vec3 vW;
          void main(){ float u1 = vU.x * 5. + vU.y / 9., u2 = vU.x * 5. - vU.y / 9.;
            float d1 = abs(fract(u1) - 0.5), d2 = abs(fract(u2) - 0.5);
            float w1 = max(fwidth(u1), 1e-4), w2 = max(fwidth(u2), 1e-4);
            float h1 = max(0.07, 0.9 * w1), h2 = max(0.07, 0.9 * w2);          // a cord is never under 1.5 px; far off the lace closes to a flat tint
            float l1 = 1. - smoothstep(h1 - 0.5 * w1, h1 + 0.5 * w1, d1), l2 = 1. - smoothstep(h2 - 0.5 * w2, h2 + 0.5 * w2, d2);
            float kn = 1. - smoothstep(0.13, 0.13 + max(w1, w2), max(d1, d2));  // where two cords meet: the knot
            if (max(max(l1, l2), kn) < 0.5) discard;
            float q = (l1 > l2 ? u2 : u1) * 7.;
            float ply = layLine(abs(fract(q) - 0.5) * 2., 0.22, fwidth(q)) * styleDetail(vW, cameraPosition) * (1. - kn);
            vec3 c = mix(uCream, uGroove, max(ply, 0.75 * max(kn, min(l1, l2))));
            gl_FragColor = vec4(styleDistance(c, vW, cameraPosition), 1.); }` });
      netTrunks.forEach((t, i) => NA.set([t.L, t.R, t.seed, 0], i * 4));
      g.setAttribute('aN', new THREE.InstancedBufferAttribute(NA, 4));
      const mesh = new THREE.InstancedMesh(g, nmat, n);
      netTrunks.forEach((t, i) => mesh.setMatrixAt(i, nm4.makeTranslation(t.x, t.y, t.z)));
      mesh.frustumCulled = false; scene.add(mesh); }
    await ctx.yield();
    { const want = Math.round(120 * density * (0.7 + 0.3 * detail)); let tries = 0;
      while (trunks.length < want && tries++ < 4000) { const a = rng() * TAU, d = 40 + 760 * Math.sqrt(rng()), x = Math.cos(a) * d, z = 240 + Math.sin(a) * d * 1.1;
        const yb = rng.range(12, 230), r = rng.range(1.4, 3.6);
        if (pathDist(x, z) < 36 + r || Math.hypot(x, z - TRUNK_Z) < 62 || Math.hypot(x, z - HERO_Z) < 175 || entryOpen(x, z, 1.5)) continue;
        if (Math.abs(x) < 78 && z > 138 && z < 246) continue;
        if (cradles.some((c) => Math.hypot(x - c.x, z - c.z) < 12 + r) || netTrunks.some((c) => Math.hypot(x - c.x, z - c.z) < 14 + r)) continue;
        addTrunk(x, z, yb, r); } }
    await ctx.yield();
    const trunkMat = hangMat({ gauge: 0.6, strands: 4, twist: 0.03, seed: 0.4, tone: 0.2 }); trunkMat.uniforms.uLean = { value: tLean }; trunkMat.uniforms.uFade = farFade;
    hang(unitTube(6, [0, 0.12, 0.25, 0.38, 0.5, 0.62, 0.74, 0.84, 0.92, 1]), trunks, trunkMat);
    const tasselMat = hangMat({ gauge: 0.6, strands: 1, seed: 0.25 }); tasselMat.uniforms.uLean = { value: tLean }; tasselMat.uniforms.uDipEnd = { value: 5.5 }; tasselMat.uniforms.uFade = farFade;
    const hangTassels = () => hang(unitTube(3, [0, 0.55, 1]), tassels, tasselMat);
    await ctx.yield();
    { const far = [], n = Math.round(300 * detail), G = [];   // (fix 6: two in three of them are hung, see below)
      // the far ranks stand in loose groups with gaps of void between them, never as an even comb
      for (let k = 0; k < 20; k++) { const a = rng() * TAU, d = rng.range(240, 860); G.push([Math.cos(a) * d, 240 + Math.sin(a) * d, rng.range(22, 55)]); }
      for (let i = 0; i < n; i++) { const gq = G[i % 20], a = rng() * TAU, d = gq[2] * Math.sqrt(rng()) * 1.5, x = gq[0] + Math.cos(a) * d, z = gq[1] + Math.sin(a) * d;
        if (Math.hypot(x, z - HERO_Z) < 180 || entryOpen(x, z, 1) || pathDist(x, z) < 60) { rng(); rng(); rng(); continue; }
        const fr = { x, y: 420, z, L: 420 - rng.range(5, 260), r: rng.range(0.5, 1.0), amp: 0.002, delay: kinkDelay(x, z), tass: 0.05, flare: 1.5, seed: rng() };
        if (i % 3 !== 2) far.push(fr); }   // (the far ranks thinned by a third: they stripe the frame less, the near ropes carry the picture)
      if (!far.length) far.push({ x: 700, y: 420, z: -300, L: 300, r: 0.6, amp: 0.002, delay: 2, tass: 0.05, flare: 1.5, seed: 0.5 });
      hang(unitTube(3, [0, 0.9, 1]), far, trunkMat); }
    await ctx.yield();

    // ---- life: beech beads (fruit, sliding beads, moth bodies), tassel-moths, hitch-climbers, lint ----------------
    const NM = Math.round(220 * (0.6 + 0.4 * detail)), NS = 12, NC = 60, NFL = 18;
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(), e3 = new THREE.Euler();
    // beech beads are turned round: each is a disc that faces the eye (a sphere's outline, exact at any size), flat
    // tan with its one paler band and no rim. Instance scale = (half width, half height, how far it stands towards the eye).
    const beadMat = new THREE.ShaderMaterial({
      uniforms: { ...S, uGW: { value: 0.16 }, uPly: { value: 3 } },
      vertexShader: /* glsl */`varying vec2 vB; varying vec3 vW;
        void main(){ vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          vec4 w = modelMatrix * vec4(instanceMatrix[3].xyz, 1.); vW = w.xyz;
          vec4 mv = viewMatrix * w; mv.xy += position.xy * sc.xy;
          // it stands towards the eye in depth only (its place and size on screen are the sphere's own)
          vec4 pz = projectionMatrix * vec4(mv.xy, min(mv.z + sc.z, -0.6), 1.);
          vB = position.xy; gl_Position = projectionMatrix * mv; gl_Position.z = pz.z / max(pz.w, 1e-4) * gl_Position.w; }`,
      fragmentShader: 'precision highp float;\n' + K.STYLE_GLSL + /* glsl */`
        varying vec2 vB; varying vec3 vW;
        void main(){ float band = 0.5 + (vB.y + 0.16 * vB.x * vB.x) * 0.36;
          gl_FragColor = vec4(beechShade(band, vec3(0., 0., 1.), vW, cameraPosition), 1.); }` });
    await ctx.yield();
    const discGeo = new THREE.CircleGeometry(1, 22);
    const beadMesh = (n, mat) => { const m = new THREE.InstancedMesh(discGeo, mat || beadMat, n); m.frustumCulled = false; return m; };
    const beadFar = beadMat.clone(); Object.assign(beadFar.uniforms, S, { uFade: farFade });   // (a clone copies uniform values: point it back at this build's own set)
    const NF = 6, beads = beadMesh(fruit.length, beadFar), mothBeads = beadMesh(NM + NF + strayBeads.length), slide = beadMesh(NS);
    // beads that drop into the corridor and plop: where each lands the sea draws two rings (hero sea, local frame)
    const drops = Array.from({ length: NF }, (_, i) => { const z = [176, 198, 221, 244, 264, 287][i] + rng.range(-4, 4); const v = rng.range(-5.5, 5.5);   // (fix 8: a bead falls beside the lane, 5 to 7.5 m from the course, and before the Knot 9 to 13 m: never through the picture)
      return { x: pathX(z) + (v < 0 ? -1 : 1) * (i < 3 ? 5 + Math.abs(v) / 5.5 * 2.5 : 9 + Math.abs(v) / 5.5 * 4), z, ph: i / NF + rng.range(-0.05, 0.05), r: rng.range(0.45, 0.75) }; });
    const plops = hero.sea ? hero.sea.material.uniforms.uPlop.value : null;
    fruit.forEach((f, i) => beads.setMatrixAt(i, m4.makeScale(f.r, f.r * (f.round || 0.8), f.push || 0).setPosition(f.x, f.y, f.z)));
    await ctx.yield(); hangTassels(); await ctx.yield();
    scene.add(beads); scene.add(mothBeads); trunk.add(slide);
    // a wing: a small combed tassel of twine pointing along +x, fanned wide and a third as deep (never a flat card)
    const wingGeo = unitTube(6, [0, 1]);
    { const p = wingGeo.attributes.position, uv = wingGeo.attributes.uv;
      for (let i = 0; i < p.count; i++) { const s = -p.getY(i), r = 0.06 + 0.42 * s; p.setXYZ(i, s * 0.95, p.getZ(i) * r * 0.4, p.getX(i) * r); uv.setX(i, s * 0.95); } }
    // (a wing is a tassel, and a tassel was dipped: the outer third of each wing is blue above its own tide line)
    // Bound where it meets the bead, then ten strands of twine fanning out with the void between their outer halves
    // (cut out in the fragment shader, as the net trunks cut between their cords: no extra triangles), one or two cut
    // clearly shorter, each end dipped blue to its own height so the tide line is a ragged comb. Under about 3 px a
    // strand the wing is the flat fan. A settled moth's fan is drawn in (instance z scale): its strands hang together.
    const wingMat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { ...S, uGW: { value: 0.16 }, uPly: { value: 3 }, uPxK: HU.uPxK },
      vertexShader: /* glsl */`uniform float uPxK; varying vec3 vW, vQ; varying float vSd; varying vec2 vLv;
        void main(){ float s = uv.x / 0.95, r = 0.06 + 0.42 * s; vSd = floor(fract(float(gl_InstanceID) * 0.6180339) * 64.);
          vec3 sc = vec3(length(instanceMatrix[0].xyz), 1., length(instanceMatrix[2].xyz));
          vec4 w = modelMatrix * (instanceMatrix * vec4(position, 1.)); vW = w.xyz;
          vQ = vec3(s, position.z / r, sc.x / max(sc.z, 1e-4));
          // how many pixels one of ten strands is wide at this wing's distance: one answer for the whole wing
          float px10 = 0.096 * sc.z / max(distance((modelMatrix * vec4(instanceMatrix[3].xyz, 1.)).xyz, cameraPosition) * uPxK * 1.25, 1e-5);
          vLv = vec2(1. - step(4., px10), 1. - smoothstep(1.3, 1.9, px10));
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: 'precision highp float;\n' + K.STYLE_GLSL + /* glsl */`
        varying vec3 vW, vQ; varying float vSd; varying vec2 vLv;
        void main(){ float s = vQ.x;
          // ten strands of twine while each is four pixels wide or more; five or six thick ones below that, with
          // notches of void in the outer half; the plain fan only when a strand would be under three pixels. At
          // every size each strand keeps its own length (one is cut clearly short) and its own tide height, so the
          // wing's end is uneven and the blue never a bar
          float c10 = (vQ.y * 0.5 + 0.5) * 10., d10 = max(fwidth(c10), 1e-4), ds = max(fwidth(s), 1e-4);
          float few = step(0.5, vLv.x), N = mix(10., 5., few);
          float c = c10 * N / 10., dc = d10 * N / 10., i = clamp(floor(c), 0., N - 1.), x = abs(c - i - 0.5) * 2.;
          float sd = floor(vSd + 0.5) * 0.37 + few * 3.;   // (a whole number per wing: a hash must not see the interpolator's rounding)
          float h1 = sHash(i * 1.7 + 0.3 + sd), h2 = sHash(i * 3.1 + 1.9 + sd), h3 = sHash(i * 5.3 + 4.1 + sd);
          float shortI = floor(sHash(sd + 7.7) * N);
          float len = (h1 < 0.16 || abs(i - shortI) < 0.5) ? 0.55 + 0.13 * h2 : 0.83 + 0.17 * h2;
          float r = 0.06 + 0.42 * s;
          float fill = clamp(mix(0.046, 0.1, few) * N / (2. * r) * vQ.z, mix(0.3, 0.52, few), 1.);
          float solid = max(step(0.5, vLv.y), smoothstep(0.34, 0.5, dc));
          if (step(fill, x) * (1. - solid) > 0.5 || s > len) discard;
          float tide = len - (0.17 + 0.23 * h3);
          vec3 col = mix(uCream, uGroove, 0.22);
          col = mix(col, uGroove, 0.8 * smoothstep(1. - 3. * dc, 1. - dc, x) * step(0.999, fill) * (1. - solid));
          float bl = abs(fract(s / 0.055) - 0.5) * 2.;
          col = mix(col, uGroove, step(s, 0.165) * (0.3 + 0.55 * step(0.6, bl) * (1. - smoothstep(0.25, 0.45, ds / 0.055))));
          vec3 dye = mix(uBlue, uIndigo, smoothstep(0.1, 0.3, s - tide));
          col = mix(col, dye, smoothstep(tide - ds, tide + ds, s));
          gl_FragColor = vec4(styleDistance(col, vW, cameraPosition), 1.); }` });
    const wings = new THREE.InstancedMesh(wingGeo, wingMat, NM * 2);
    wings.frustumCulled = false; scene.add(wings);
    // where the moths live: along the course (the escort), on the spiral trunk, on the sleeve, in the fringe. (Earlier:)
    // ahead of where we shall pass and lift off as we come down to them, so a dozen are in the air beside us all the
    // way round the spiral.
    // The escort: moths hung in the air along the course, each where the gaze will rest when we are 14 m short of it
    // (a tan bead between two cream fan wings, a twentieth of the frame at that distance), to either side and above and
    // below; those along the spiral sit on the trunk and lift off to their place as we come down to them. Then a
    // flight of a dozen that crosses the entry from the trunk's side to the other, keyed to the journey clock.
    const moths = [], FV = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    { const L = path.length, C = new THREE.Vector3(), A = new THREE.Vector3(), D = new THREE.Vector3(), Rv = new THREE.Vector3(), Uv = new THREE.Vector3(), Kd = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
      const bell = ctx.core.bell;
      // the gaze at uc, as the engine works it out: along the path, then pulled by each poi in turn (see pois below)
      const aim = (uc) => { uc = Math.min(1, Math.max(0, uc)); path.curve.getPointAt(uc, C); path.curve.getPointAt(Math.min(1, uc + 22 / L), A);
        D.subVectors(A, C).normalize();
        const w1 = GAZE_W * sstep(0, 0.04, uc) * (1 - sstep(0.93, 0.985, uc));
        Kd.copy(gazeAt(0, uc)).sub(C).normalize(); D.multiplyScalar(1 - w1).addScaledVector(Kd, w1).normalize();
        Rv.crossVectors(D, UP).normalize(); Uv.crossVectors(Rv, D); };
      let sm = 38, i = 0;
      while (sm < 0.64 * L && moths.length < NM - NFL - 20) { const uc = (sm - 14) / L; aim(uc);
        const spiral = uc > 0.115 && uc < 0.34, side = i % 2 ? 1 : -1, lat = side * rng.range(1.8, 5.5), vert = rng.range(-2.4, 2.2), fwd = 11.5 + rng.range(-2.5, 2.5);
        // (fix 8) over the lane the escort keeps 5 m and more to either side and low, before the Knot 6.5 m: none against the lens
        const lane = uc > 0.4 ? (uc > 0.55 ? 4.7 : 3.2) : 0, la = lat + side * lane, ve = vert - (lane ? 2.5 : 0);
        const x = C.x + D.x * fwd + Rv.x * la + Uv.x * ve, y = Math.max(2.2, C.y + D.y * fwd + Rv.y * la + Uv.y * ve), z = C.z + D.z * fwd + Rv.z * la + Uv.z * ve;
        const m = { x, y, z, ph: rng() * 7, yaw: Math.atan2(Rv.x, -Rv.z), sz: rng.range(0.95, 1.25), fly: 1, lift: -1, hx: x, hy: y, hz: z };
        if (spiral) { const ah = Math.atan2(z - TRUNK_Z, x); m.hx = 5 * Math.cos(ah); m.hy = y - 5; m.hz = TRUNK_Z + 5 * Math.sin(ah); m.lift = table(JT, Math.max(0, (sm - 48) / L)); }
        moths.push(m); sm += spiral ? 3.2 : 7; i++; }
      await ctx.yield();
      // (mend 10d) A RULE OF THE PLACE. An escort moth is a body, and a body is kept off the lens by its place: it is NOT
      // LAID where the route comes within 2.0 m of its REACH. The route is the path walked once in metres, a point every
      // 0.25 m (hence 2.05). The reach is all the room the moth's bead and wings can take up at any clock: its berth, the
      // flutter at the furthest of each axis (update's own 0.7, 0.5, 0.7 m, a box), grown by the wing at any flap and turn
      // (its furthest vertex, 0.85 * sz * hypot(0.95, 0.48) from the moth's middle; the bead, 0.29 * sz, lies inside that).
      // A moth of the spiral lifts off the trunk by the metres flown and by nothing else (update: o from table(JT, u)), so
      // at a point of the route it is taken at every stage o that the metres within 5 m either side of the point set, on
      // its way from the trunk (hx, hy, hz) out to its berth, the flutter growing with o as in update. NOT LAID: every
      // draw above is taken as before and the moth keeps its slot in every list; its size is 0, so update writes its bead
      // and both its wings with scale 0 and no triangle of it has any area. Places in world metres only: nothing here
      // reads the lens, the gaze, a clock or the seed, and nothing is moved, pushed or dealt again.
      const RS = 0.25, nR = Math.ceil(L / RS), RP = new Float64Array(nR * 3 + 3); let RG = RS;   // (RG: the greatest step between two of the points, m)
      for (let j = 0; j <= nR; j++) { path.posAtDist(Math.min(j * RS, L), C); RP[j * 3] = C.x; RP[j * 3 + 1] = C.y; RP[j * 3 + 2] = C.z; if (j) RG = Math.max(RG, Math.hypot(C.x - RP[j * 3 - 3], C.y - RP[j * 3 - 2], C.z - RP[j * 3 - 1])); }
      await ctx.yield();
      for (const m of moths) { const hx = m.hx, hy = m.hy, hz = m.hz, wx = m.x - hx, wy = m.y - hy, wz = m.z - hz, far = 2.05 + 0.85 * m.sz * Math.hypot(0.95, 0.48), out = far + Math.hypot(wx, wy, wz) + Math.hypot(0.7, 0.5, 0.7);
        const stage = (s) => (m.lift < 0 ? 1 : sstep(m.lift, m.lift + 3, table(JT, s / L)));
        // metres from route point j to the moth's middle at stage o, the flutter at its furthest
        const gap = (j, o) => { const a = Math.max(Math.abs(RP[j * 3] - hx - wx * o) - 0.7 * o, 0), b = Math.max(Math.abs(RP[j * 3 + 1] - hy - wy * o) - 0.5 * o, 0), c = Math.max(Math.abs(RP[j * 3 + 2] - hz - wz * o) - 0.7 * o, 0); return Math.sqrt(a * a + b * b + c * c); };
        for (let j = 0; j <= nR && m.sz > 0; j++) { const g = gap(j, 0); if (g > out) { j += Math.floor((g - out) / RG); continue; }   // out of its reach at every stage, and so is every point that many steps on
          let o0 = stage(Math.min(j * RS, L) - 5), o1 = stage(Math.min(j * RS, L) + 5);
          if (gap(j, o0) - (o1 - o0) * (out - far) > far) continue;   // (the gap changes by no more than out - far over the whole of o)
          for (let n = 0; n < 48 && o1 - o0 > 1e-9; n++) { const p = o0 + (o1 - o0) / 3, q = o1 - (o1 - o0) / 3; if (gap(j, p) < gap(j, q)) o1 = q; else o0 = p; }   // (the gap is convex in o: its least is found by thirds)
          if (gap(j, 0.5 * (o0 + o1)) < far) m.sz = 0; } }
      await ctx.yield();
      aim(0.08); const tc = table(JT, 0.08);
      // (the flight: at the entry it is in the open void between the left-hand bundle and the trunk, well above the
      // sea line; it comes down across the course and is beside us at u 0.08)
      FV[0] = D.x * 11.5 - Rv.x * 1.1; FV[1] = -0.9; FV[2] = D.z * 11.5 - Rv.z * 1.1;   // (fix 6: it keeps just ahead of us all the way in, so it is large in the frame from the first second)
      // (fix 7) once it has been beside us (u 0.08) the flight opens out and makes off ahead, up and away from the trunk:
      // its middle, the way out from the trunk, the way on (so no pile-up of moths against the lens at u 0.12)
      FV[3] = C.x + D.x * 12.5 - Rv.x * 4.6; FV[4] = C.y + 2.2; FV[5] = C.z + D.z * 12.5 - Rv.z * 4.6; FV[6] = -Rv.x; FV[7] = -Rv.z; FV[8] = D.x; FV[9] = D.z;
      for (let k = 0; k < NFL; k++) { const a = rng.range(-9.5, -2) * 0.8, b = rng.range(-1.5, 3.5), c = rng.range(-4, 4.5);
        moths.push({ x: C.x + D.x * (12.5 + c) + Rv.x * a, y: C.y + 1.2 + b, z: C.z + D.z * (12.5 + c) + Rv.z * a, ph: rng() * 7, yaw: Math.atan2(Rv.x, -Rv.z), sz: rng.range(0.95, 1.25), fly: 2, lift: tc }); } }
    const NE = moths.length;
    for (let i = NE; i < NM; i++) { let x, y, z, fly = 0; const f = (i - NE) / Math.max(1, NM - NE);
      if (f < 0.4) { const a = rng() * TAU; x = 4.8 * Math.cos(a); z = TRUNK_Z + 4.8 * Math.sin(a); y = rng.range(40, 135); }
      else if (f < 0.75) { const a0 = NET_TH + (rng.int(0, 9) * 2 + 1) * S_ANG, yy = NET_YL + NET_H * 2 * rng.int(0, 4), a = netWide(a0, yy); x = (SLEEVE_R - 1.3) * Math.cos(a); z = TRUNK_Z + (SLEEVE_R - 1.3) * Math.sin(a); y = yy + 1.6; fly = -1; }
      else { z = rng.range(158, 232); x = (rng.chance(0.5) ? 1 : -1) * rng.range(8.5, 14); y = rng.range(4, 20); x = (x < 0 ? -1 : 1) * (Math.abs(x) - 8.5) * 0.9 + (x < 0 ? -1.2 : 1.2); y = 1.6 + (y - 4) * 0.28; z = 150 + (z - 158) * 2.4; fly = 3; }   // (fix 8) low over the lane, leading down it towards the Knot
      moths.push({ x, y, z, ph: rng() * 7, yaw: fly === 3 ? -PI / 2 : Math.atan2(z - TRUNK_Z, x), sz: rng.range(0.9, 1.2), fly, lift: -1 });
      if (i % 40 === 39) await ctx.yield(); }
    await ctx.yield();
    // hitch-climbers: loops of twine that inch up the sleeve's ropes (the only things here that go up). A loop holds its
    // rope by a hitch at its foot and one at its head: it throws the upper hitch ahead (the loop draws out tall and
    // narrow), then draws the lower one free and up (the loop rounds out again). It is turned to the eye, like the beads.
    const climbers = new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.11, 4, 14), cordMat({ gauge: 0.2, strands: 1, seed: 0.6, side: THREE.DoubleSide,
      vertexBody: '{ float a = uv.x * 1.2083049; vec2 sc = max(vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz)), vec2(1e-3)); vec3 rg = vec3(cos(a), sin(a), 0.); p = rg + (position - rg) / vec3(sc, 1.); }' }), NC);
    { const uv = climbers.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 5.2, uv.getY(i)); }
    climbers.frustumCulled = false; scene.add(climbers);
    // where sleeve rope (k, e) is at height y: the same law as its vertex shader (net above the front, loose below)
    const ropeAt = (y, k, e, out, t, front) => { const cz = Math.cos(PI * (y - NET_YL) / NET_H), g = sstep(front - 1, front + 7, y), th0 = NET_TH + (k + 0.5) * S_ANG;
      const loose = (1 - g) * (1.1 * Math.sin(t * 0.9 + sleeveSeed[(k * 2 + e) * 4 + 3] * 40) + 0.6 * Math.sin(t * 0.53 + th0 * 3)) * (y + 1) / 421 * 3;
      let th = th0 + ((k % 2 ? -1 : 1) * 3.6 * cz * g + loose + (e ? 0.33 : -0.33) * (1 + 1.1 * g * (1 - cz * cz))) / SLEEVE_R;
      th += (netWide(th, y) - th) * g;
      th += sleevePart[k * 2 + e] * 0.15 * (1 - g) * Math.exp(-(((y - 116) / 20) ** 2));   // (mend 11d) the parting: the very number the rope program takes as aP (the sleeve's own array, set where the sleeve is laid)
      const gat = SU.uGather.value * (1 - sstep(210, 330, y)) * (1 - g), o = (k * 2 + e) * 3;
      th += (sleeveHank[o] + (sleeveHank[o + 1] + 0.35 * loose) / SLEEVE_R - th) * gat;
      const rS = SLEEVE_R + sleeveHank[o + 2] * gat;
      return out.set(rS * Math.cos(th), y, TRUNK_Z + rS * Math.sin(th)); };
    const cXb = new THREE.Vector3(), cYb = new THREE.Vector3(), cZb = new THREE.Vector3(), cTop = new THREE.Vector3(), cIn = new THREE.Vector3();
    const climbPh = Array.from({ length: NC }, () => rng() * 80), slidePh = Array.from({ length: NS }, () => rng() * 90);
    // a strand's centre (out = 0) or a rope on its outer face (out = metres from the strand's centre)
    const helix = (y, q, out, off = 0) => { const a = helixA(y, q), rr = TS + 0.09 * Math.sin(y * 0.11 + q) + off; return out.set(rr * Math.cos(a) + axisX(y), y, rr * Math.sin(a) + axisZ(y)); };
    await ctx.yield();
    // lint: pale motes drifting down and sideways, wrapped round the camera
    const LU = { uTime: S.uTime, uPale: S.uPale, uCream: S.uCream, uPx: { value: 800 }, uDrift: { value: weather === 'draught' ? 3.2 : 0.5 } };
    { const n = Math.round(700 * detail), P = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) P[i] = rng() * 120;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
      const lint = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: LU, depthWrite: false,
        vertexShader: /* glsl */`uniform float uTime, uPx, uDrift;
          void main(){ vec3 p = position + vec3(uTime * uDrift, -uTime * 0.7, uTime * 0.15 + sin(uTime * 0.3 + position.y) * 0.8);
            p = mod(p - cameraPosition + 60., 120.) - 60. + cameraPosition;
            vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(0.22 * uPx / max(-mv.z, 0.5), 1.6, 9.); }`,
        fragmentShader: /* glsl */`precision highp float; uniform vec3 uPale, uCream;
          void main(){ vec2 c = gl_PointCoord - 0.5; if (dot(c, c) > 0.25) discard; gl_FragColor = vec4(mix(uPale, uCream, 0.6) * 1.03, 1.); }` }));
      lint.frustumCulled = false; scene.add(lint); }
    await ctx.yield();

    const size = new THREE.Vector2();
    const KINK_S = 39.15;
    // the gaze: round the spiral it is lifted off the sea to the net and the void (the path itself dives at 35
    // degrees); from the diamond on it rests on the Knot
    const gp = new THREE.Vector3();
    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 62, near: 0.5, far: 4000, lookAhead: 22, bank: 0.2 },
      pois: [{ at: gazeAt, from: 0, to: 1, weight: GAZE_W, fade: 0.001 }],
      // the beech ring is the whole frame of the exit: the opening is a bare hole, one flat tint of the void until the
      // next world shows in it (no swirl, no glow, no halo)
      portal: { shape: 'circle', radius: 7.5, tilt: true, color: pal[0], veil: pal[0], frame: 0, glow: 0, halo: false, revealDistance: 260, blendDistance: 25 },   // (7.5: the ring's own opening, so no sliver of void shows between the picture and the beech)
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        const secs = table(JT, u || 0);
        // (the entry: each bundle is laid a third of the way and hangs plumb below the hand, clear of the trunk; the
        // tails are drawn together over the first five seconds and cross by 13 s, as the brief has it)
        { const t = secs / 13; hero.setClock(secs < 13 ? 0.34 + 0.66 * (0.6 * t + 0.4 * sstep(0, 0.6, t)) : hero.clockAtSeconds(secs)); } hero.update(dt, time, camera);
        HU.uSw.value = time;
        HU.uKinkAge.value = secs >= KINK_S ? secs - KINK_S : -1;
        if (rareDowel >= 0) {   // the unhitching: the bared dowel swings up and stays up
          const d = dowels[rareDowel], f = sstep(0, 1, (secs - 31) / 3.5), wob = Math.sin((secs - 25) * 1.7) * 0.05 * f * Math.exp(-Math.max(0, secs - 34) * 0.4);
          dowelMesh.setMatrixAt(rareDowel, m4.makeRotationFromEuler(e3.set(0, d.yaw || 0, 0.035 * f + wob, 'YZX')).scale(s3.set(d.len, 1, 1)).setPosition(d.x, d.y + 2.6 * f, d.z)); dowelMesh.instanceMatrix.needsUpdate = true; }
        HU.uFallT.value = rare && rareDowel >= 0 ? (secs - 20) * 0.5 : -1;   // (fix 8: one every two thirds of a second from 20 s, from the rod's end by the lane outward; each is five seconds in the air)   // (fix 7: three a second from the row's far end inwards, the last one by the corridor at 28.2 s: as we come level the row is bare at its far end, still hung by us, eight or nine strands in the air between)   // (fix 6: four a second from 22.5 s, so that the row is half undone with strands in the air as we come level with it at 27.5 s, and the first to fall have been carried on ahead of the bared dowel)
        SU.uFront.value = table(FRONT, u || 0); SU.uGather.value = gatherAt(u || 0);
        trunk.rotation.y = -time * TAU / 20;
        ctx.renderer.getDrawingBufferSize(size); LU.uPx.value = size.y; HU.uPxK.value = 0.96 / Math.max(size.y, 200);
        camera.getWorldPosition(gp);   // the eye in the world, for the moths drawn only from where they are moths
        // moths: short hops up the cord, wings folded down like a small tassel between them
        for (let i = 0; i < moths.length; i++) { const m = moths[i], c = (time * 0.33 + m.ph) % 1, hop = sstep(0, 0.3, c), fl = c < 0.34 ? 1 : 0;
          let x = m.x, y = m.y, z = m.z, flying = 1, hid = 1;
          if (m.fly === 1) { const o = m.lift < 0 ? 1 : sstep(m.lift, m.lift + 3, secs);   // the escort: off the trunk and out to its place
            x = m.hx + (m.x - m.hx) * o + Math.sin(time * 1.3 + m.ph) * 0.7 * o; y = m.hy + (m.y - m.hy) * o + Math.sin(time * 1.9 + m.ph * 2.3) * 0.5 * o; z = m.hz + (m.z - m.hz) * o + Math.cos(time * 1.1 + m.ph) * 0.7 * o;
            flying = o > 0.01 ? 1 : 0; hid = 1 - sstep(95, 130, Math.hypot(x - gp.x, y - gp.y, z - gp.z)); }   /* (fix 8: like the lane's moths, drawn from where it is a moth: never a speck over the sea) */
          else if (m.fly === 2) { const dt0 = secs - m.lift, dt = dt0 > 0 ? 6.5 * (1 - Math.exp(-dt0 / 6.5)) : dt0;   // the flight: ahead of us all the way in, then it slows and is left hovering beyond the trunk (fix 6)
            const dp = Math.max(dt0, 0), sp = 1 + 0.22 * dp;
            x = FV[3] + (x - FV[3]) * sp + FV[0] * dt + (FV[6] * 3 + FV[8] * 6) * dp + Math.sin(time * 1.1 + m.ph) * 0.6; y = FV[4] + (y - FV[4]) * sp + FV[1] * Math.min(dt, 0) + 3 * dp + Math.sin(time * 1.7 + m.ph * 2.1) * 0.7; z = FV[5] + (z - FV[5]) * sp + FV[2] * dt + (FV[7] * 3 + FV[9] * 6) * dp + Math.cos(time * 0.9 + m.ph) * 0.6; }
          else if (m.fly === 3) { z = 150 + ((m.z - 150 + secs * 3.4) % 178); x = pathX(z) + m.x + Math.sin(time * 0.8 + m.ph) * 0.8; y = m.y + Math.sin(time * 1.6 + m.ph * 2.3) * 0.5; hid = sstep(150, 158, z) * (1 - sstep(318, 328, z)) * (1 - sstep(95, 130, Math.hypot(x - gp.x, y - gp.y, z - gp.z))); }   /* (a moth of the lane is drawn from where it is a moth, six pixels of wing: never a speck on the sea from the forest's height) */
          else { y += ((Math.floor(time * 0.33 + m.ph) % 4) + hop) * 1.6; flying = fl; if (m.fly < 0 && m.y < SU.uFront.value + 3) hid = 0; }   // (a moth of the net settles on a knot once it is tied)
          const flap = flying ? 0.22 + Math.sin(time * 15 + m.ph * 9) * 0.55 : -1.35;
          mothBeads.setMatrixAt(i, m4.makeScale(0.25 * m.sz * hid, 0.29 * m.sz * hid, 0).setPosition(x, y, z));   // true size: a bead under half a metre, wings about 1.6 m across
          for (let w = 0; w < 2; w++) { e3.set(flying ? (w ? -1.15 : 1.15) : 0, -m.yaw + PI / 2 + w * PI, flap, 'YZX'); q4.setFromEuler(e3);
            wings.setMatrixAt(i * 2 + w, m4.compose(v3.set(x, y, z), q4, s3.set(0.85 * m.sz * hid, 0.85 * m.sz * hid, 0.85 * m.sz * hid * (flying ? 1 : 0.4)))); } }
        for (let i = 0; i < NF; i++) { const d = drops[i], t = ((time * 0.15 + d.ph) % 1) * 6.667, y = 30.6 - 4.9 * t * t, air = y > 0 ? 1 : 0;
          mothBeads.setMatrixAt(NM + i, m4.makeScale(d.r * air, d.r * air, 0).setPosition(d.x, Math.max(y, 0), d.z));
          if (plops) plops[i].set(d.x, d.z - HERO_Z, 0.5 + (d.z > 235 ? 2.6 : 1.7) * Math.max(0, t - 2.5), air ? 0 : 1); }
        // (the strays: let down out of the void as the sleeve is let go; a bead rides its rope down)
        SL.uLift.value = 340 * (1 - sstep(0.055, 0.135, u || 0));
        for (let i = 0; i < strayBeads.length; i++) { const b = strayBeads[i]; mothBeads.setMatrixAt(NM + NF + i, m4.makeScale(b.r, b.r * 0.8, 0.5).setPosition(b.x, b.y + SL.uLift.value, b.z)); }
        mothBeads.instanceMatrix.needsUpdate = true; wings.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < cradles.length; i++) { const c = cradles[i]; m4.makeRotationY(c.ph + time * c.w).setPosition(c.x, c.y, c.z); cradleCords.setMatrixAt(i, m4); cradleRings.setMatrixAt(i, m4); }
        cradleCords.instanceMatrix.needsUpdate = true; cradleRings.instanceMatrix.needsUpdate = true;
        // hitch-climbers inch up the trunk's ropes; beads slide down them and stop with a small bounce
        camera.getWorldPosition(gp);
        { const front = SU.uFront.value;
          for (let i = 0; i < NC; i++) { const c = time * 0.45 + climbPh[i], st = Math.floor(c), f = c - st, up = sstep(0.5, 1, f);
            const yr = (i * 29.3 + (st % 400) * 1.1 + 1.1 * up) % 75, yb = 50 + yr, h = f < 0.5 ? 0.9 + 1.1 * sstep(0, 0.5, f) : 2 - 1.1 * up, k = i % 20, e = (i / 20 | 0) % 2;
            ropeAt(yb, k, e, v3, time, front); ropeAt(yb + h, k, e, cTop, time, front);
            const show = sstep(0, 3, yr) * (1 - sstep(72, 75, yr));
            cZb.set(gp.x - v3.x, 0, gp.z - v3.z); if (cZb.lengthSq() < 1e-6) cZb.set(1, 0, 0); cZb.normalize(); cXb.set(cZb.z, 0, -cZb.x);
            cTop.sub(v3); const ax = cTop.dot(cXb), ay = cTop.y, len = Math.hypot(ax, ay) || 1;
            cYb.copy(cXb).multiplyScalar(ax / len); cYb.y = ay / len; cIn.crossVectors(cYb, cZb);
            const sx = Math.max(0.24, 0.78 - 0.24 * len) , sy = len / 2, sd = i % 2 ? 1 : -1;
            v3.addScaledVector(cYb, sy).addScaledVector(cIn, sd * (sx + 0.2)).addScaledVector(cZb, 0.4);
            m4.makeBasis(cIn.multiplyScalar(Math.max(sx * show, 1e-4)), cYb.multiplyScalar(Math.max(sy * show, 1e-4)), cZb).setPosition(v3);
            climbers.setMatrixAt(i, m4); } }
        climbers.instanceMatrix.needsUpdate = true;
        const ta = trunk.rotation.y, tcx = gp.x * Math.cos(ta) - (gp.z - TRUNK_Z) * Math.sin(ta), tcz = gp.x * Math.sin(ta) + (gp.z - TRUNK_Z) * Math.cos(ta);   // the eye in the trunk's turning frame
        for (let i = 0; i < NS; i++) { const c = (time * 0.11 + slidePh[i]) % 1, f = Math.min(1, c / 0.8), y = 150 - (i * 9 + 2) - f * f * 18 + (c > 0.8 ? Math.abs(Math.sin((c - 0.8) * 40)) * Math.exp(-(c - 0.8) * 22) * 1.2 : 0);
          // a bead rides the outer face of its rope, whole: it is drawn only while its side of the trunk faces us
          // (never half behind the trunk's limb), and stands clear of the wraps and of a settled moth
          helix(y, i % 4, v3, ROPE_OUT + 0.25); const bl = Math.hypot(v3.x, v3.z) || 1, dx = tcx - v3.x, dz = tcz - v3.z, dl = Math.hypot(dx, dz) || 1;
          const face = sstep(0.45, 0.7, (v3.x * dx + v3.z * dz) / (bl * dl));
          slide.setMatrixAt(i, m4.makeScale(0.66 * face, 0.56 * face, 4.5).setPosition(v3.x, v3.y, v3.z)); }
        slide.instanceMatrix.needsUpdate = true;
      },
      dispose() { if (hero.dispose) hero.dispose(); },
    };
  },
};
