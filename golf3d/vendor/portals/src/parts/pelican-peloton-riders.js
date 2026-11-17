// pelican-peloton-riders.js: THE RIDERS of the pelican peloton: every rider kind's geometry, the dress, the
// bibs, the pack's vertex law, the pack's meshes and shadows. The look kit (the flat material with the one line, the
// builders of solids) is ./pelican-peloton.js; every number two files need is ./pelican-peloton-plan.js.
// A RIDER'S FRAME: origin on the road under the cranks, +Z the way it rides, +Y up, +X to port, in metres at PP.SCALE
// (2.5) times life. The drive side is at -X: seen from starboard (where the lens flies) the rider faces right.
// NOTE on the cycle of imports: ./pelican-peloton.js imports this file for buildHero. Nothing at this file's top level
// reads a binding of that file (only inside calls), so either may be loaded first.
import * as THREE from 'three';
import { PP, laneN, DRIFT_UP, DRIFT_PORT, DRIFT_RUN, DRIFT_AHEAD, DRIFT_RISE } from './pelican-peloton-plan.js';
import { flatMaterial, makeBuilder, loft, ball, cone, tube, stroke, ring, box, plate, digits, setPart, setRow, finish, setInstances } from './pelican-peloton.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const X_AXIS = V(1, 0, 0), Y_AXIS = V(0, 1, 0), Z_AXIS = V(0, 0, 1);
const INK_W = PP.LINE_RIDER, f1 = (x) => Number(x).toFixed(4);
const Pyz = (x, yz) => V(x, yz[0], yz[1]);

// ---------------------------------------------------------------------------------------------
// THE PACK LAW (build plan section 5, shader S2), as flatMaterial's vertexPre and vertexMove.
// A row is iA = (lane n, offset o, own number, size over life), iB = (tint r, g, b, glitch id).
//   station  s = o + F(uD) + surge,  surge = SURGE sin(F / SURGE_LEN + 2 pi own)   (a slider has none)
//   side     n = lane + WEAVE sin(s / WEAVE_LEN)
//   place    the road's own point at (s, n) by the cubic Hermite of the 64 knots; turned to its heading, tipped to its slope
//   wheels   m / r + 1.5 uTime;  cranks m / (2.5 gear) + 40 own + uTime, gear 0.95 (the leader 0.6), where m is the metres
//            the rider's own wheels ride: F + surge, less its lane times the road's heading there (the lane's own length
//            round a bend: by the plan's road the law is within 0.2 % of the lane's true length; without the lane's term
//            a wheel of lane 2 would slide 11 % on the landing bend)
// THE MIRROR of this law is the plan file's riderPlace(row, d, road). Nothing here reads a clock but the two small
// time terms, the lens but for a pixel's footprint (the spokes' drawing-in), a seed or a gaze.
// GLITCH ids (iB.w): 0 none | 1 a slider (turned 70 degrees toward starboard, wheels still, no surge) | 2 the drifter
// (its bird rises 0.09 m a metre flown from d0 = (o - 20) / (1 - K0), for 155 m, and once 4 m up slides to port as well:
// the plan's drifterLift)
// | 3 the leader (gear 0.6; stands on the climb; turns its head 35 degrees toward the open lane by the plan's TURN_D)
// | 4 a rider that stands on the pedals wherever the road's slope at its own station is over one in ten
// | 5 a rider of the generations that only ROCKS (as 3 and 4 do too): bicycle and bird lean 2 degrees to either hand about
// the line its tyres ride, once a turn of the cranks, each rider in its own step (its own number is in the cranks' angle).
// Out of the saddle the bird sways the other way by the kit's own term, so there the bicycle rocks under a steady bird.
// The lean is inside every box of the plan it is given to: the widest thing of a pelican, its wing with the line, comes
// to 1.05 m off its lane seated and 1.15 m standing (box 1.2 m; the leader 1.49 m in 1.5 m). A hopeless kind rocks only
// where its builder says so (its widest thing then stands 0.2 m inside its box); the guests do not rock.
// | 6 the third slider, on SQUARE WHEELS: a slider whose two wheels tumble corner over corner (a quarter turn for every
// 6.3 m ridden: it slides, so they only flop) while the whole of it rides up and down on them, fore and aft out of step.
// PARTS OF THIS FILE'S OWN (20 and over; the kit never touches them), all in the rider's own frame:
//   21 a limb that swings about a pin across the rider (pin y, pin z, radians, phase): a stride, a kick, a tail
//   22 a thing that slides out and back (dy, dz, turns a metre ridden, phase): the turtle's head
//   23 a thing that sways to either hand about a foot on the centre line (foot y, turns a metre ridden, radians, phase)
//   24 a square wheel (hub y, hub z, -, phase) | 25 a wing on a hinge along the rider (hinge x, hinge y, radians, phase)
//   26 the hoverer's lump (rise, beats a metre ridden, the z of its upright, radians it looks aside at the most)
// A part number 32 over its own is the same part of the rider's LOOSE body: the drifter's bird, which the law of the
// drifter carries up and away whole (trunk, head, wings and legs that still pedal the air).
// ---------------------------------------------------------------------------------------------
export const GLITCH = { none: 0, slider: 1, drifter: 2, leader: 3, stands: 4, rocks: 5, square: 6 };
const TURN_D = PP.TURN_D;                             // the leader's head: in between the first two (metres flown), held, back between the last two
const ROCK = 0.036;                                   // radians of lean to either hand
export const GLANCE = 0.6;                            // radians a head turns in a glance (34 degrees): a pelican's bill tip then stands 1.0 m off its lane
const SQ = { A: 0.62, K: 0.25, PH: 0.9, ZR: -1.2, ZF: 1.55 };   // the square wheels: half a side, radians a metre ridden, the front one's lead, the two hubs
export const PACK_PRE = /* glsl */`
  #define PP_BEGIN
  float gGl = 0., gSlope = 0., gS = 0., gN = 0., gRock = 0., gStride = 0., gSqR = 0., gSqF = 0., gLook = 0.; vec2 gHd = vec2(0., 1.); vec3 gBase = vec3(0.);
  void ppBegin(){
    gGl = floor(iB.w + 0.5);
    float slide = ((gGl > 0.5 && gGl < 1.5) || (gGl > 5.5 && gGl < 6.5)) ? 1. : 0.;
    bool lead = gGl > 2.5 && gGl < 3.5;
    float F = ppF(uD), surge = (1. - slide) * ${f1(PP.SURGE)} * sin(F / ${f1(PP.SURGE_LEN)} + 6.2831853 * iA.z);
    float s = iA.y + F + surge, nn = iA.x + ${f1(PP.WEAVE)} * sin(s / ${f1(PP.WEAVE_LEN)});
    gS = s; gN = nn; gSlope = ppRoadY(s).y;
    gBase = ppRoad(s, nn, 0., gHd);
    gSize = iA.w / ${f1(PP.SCALE)};
    // the metres this rider's own wheels ride: the road's metres, less its lane times the heading turned (a lane to port
    // of the centre line is the shorter way round a left bend and the longer way round a right one), so that no wheel
    // slides on a bend. The heading stays within 80 degrees of +Z on the whole road, so its cosine is never near nothing
    gTrav = F + surge - iA.x * atan(gHd.x / max(gHd.y, 0.05)); gSpin = 1. - slide; gWheelT = 1.5 * uTime; gOwn = 40. * iA.z;
    gCrank = gTrav / (2.5 * (lead ? 0.6 : 0.95)) + gOwn + uTime;
    gStride = 0.55 * gTrav + uTime + gOwn;
    gStand = (gGl > 2.5 && gGl < 4.5) ? smoothstep(0.08, 0.12, gSlope) : 0.;
    // the head: the leader's turns 35 degrees toward the open lane between the plan's TURN_D metres. EVERY OTHER RIDER
    // GLANCES ASIDE AND BACK on the world's time (a back must show its bill): one glance every 5 to 8 s, at its own pace
    // and in its own step (both from its own number, which is typed by its place in the race), in over a seventh of the
    // turn, held, back by the middle of it: four in ten of the pack are turned at any moment. Seven glances in ten go
    // toward the open lane (the side of the lens's lane from this rider's own lane: a place), the others away from it.
    // GLANCE radians (a little less out of the saddle), times the head's own share (aRig.w of part 11). gLook: -1 .. 1.
    float gp = uTime * (0.125 + 0.075 * fract(iA.z * 7.31)) + 13. * iA.z, gc = floor(gp), gt = gp - gc;
    gLook = (iA.x > ${f1(PP.LENS_N)} ? 1. : -1.) * (fract(gc * 0.618 + 5. * iA.z) < 0.7 ? 1. : -1.) * smoothstep(0., 0.14, gt) * (1. - smoothstep(0.4, 0.56, gt));
    gTurn = lead ? 0.6109 * smoothstep(${f1(TURN_D[0])}, ${f1(TURN_D[1])}, uD) * (1. - smoothstep(${f1(TURN_D[2])}, ${f1(TURN_D[3])}, uD)) : ${f1(GLANCE)} * (1. - 0.14 * gStand) * gLook;
    gRock = (gGl > 2.5 && gGl < 5.5) ? ${f1(ROCK)} * sin(gCrank) : 0.;
    if (gGl > 5.5 && gGl < 6.5) {                                       // each square wheel's hub rides a (cos + sin - 1) over the road
      float t0 = mod(gTrav * ${f1(SQ.K)}, 1.5708), t1 = mod(gTrav * ${f1(SQ.K)} + ${f1(SQ.PH)}, 1.5708);
      gSqR = ${f1(SQ.A)} * (cos(t0) + sin(t0) - 1.); gSqF = ${f1(SQ.A)} * (cos(t1) + sin(t1) - 1.);
    }
    gPx = ppPixel(projectionMatrix * viewMatrix * vec4(gBase + vec3(0., 2., 0.), 1.));
  }
`;
export const PACK_MOVE = /* glsl */`
  {
    if (part > 20.5 && part < 21.5) {                                   // a limb swings about its pin, by the metres ridden
      float a = aRig.z * sin(gStride + aRig.w);
      p.yz = ppRot2(p.yz - aRig.xy, a) + aRig.xy; n.yz = ppRot2(n.yz, a);
    } else if (part > 21.5 && part < 22.5) {                            // out and back, dwelling at both ends
      p.yz += aRig.xy * smoothstep(-0.45, 0.45, sin(6.2831853 * aRig.z * gTrav + 0.9 * uTime + aRig.w + gOwn));
    } else if (part > 22.5 && part < 23.5) {                            // a sway to either hand about a foot on the centre line
      float a = aRig.z * sin(6.2831853 * aRig.y * gTrav + 0.8 * uTime + aRig.w + gOwn);
      vec2 q = ppRot2(vec2(p.x, p.y - aRig.x), a); p.x = q.x; p.y = q.y + aRig.x; n.xy = ppRot2(n.xy, a);
    } else if (part > 23.5 && part < 24.5) {                            // a square wheel tumbles about its hub
      float a = gTrav * ${f1(SQ.K)} + aRig.w;
      p.yz = ppRot2(p.yz - aRig.xy, a) + aRig.xy; n.yz = ppRot2(n.yz, a);
    } else if (part > 24.5 && part < 25.5) {                            // a wing beats about its hinge
      float a = aRig.z * sin(3.2 * uTime + 0.5 * gTrav + aRig.w + gOwn);
      p.xy = ppRot2(p.xy - aRig.xy, a) + aRig.xy; n.xy = ppRot2(n.xy, a);
    } else if (part > 25.5 && part < 26.5) {                            // the hoverer's lump: it bobs, and looks aside about its own upright
      p.y += aRig.x * sin(gTrav * aRig.y + 0.5 * uTime + gOwn);
      float a = (iA.x > ${f1(PP.LENS_N)} ? 1. : -1.) * aRig.w * (0.8 + 0.2 * abs(gLook));   // always toward the open lane; furthest in its glance
      vec2 q = ppRot2(vec2(p.x, p.z - aRig.z), a); p.x = q.x; p.z = q.y + aRig.z; n.xz = ppRot2(n.xz, a);
    }
    p.y += mix(gSqR, gSqF, clamp((p.z - ${f1(SQ.ZR)}) / ${f1(SQ.ZF - SQ.ZR)}, -0.6, 1.6));   // the square wheels' ride (nothing on any other rider)
    p.xy = ppRot2(p.xy, gRock); n.xy = ppRot2(n.xy, gRock);             // the rock, about the line the tyres ride
    p *= gSize;
    if ((gGl > 0.5 && gGl < 1.5) || (gGl > 5.5 && gGl < 6.5)) { p.xz = ppRot2(p.xz, 1.2217); n.xz = ppRot2(n.xz, 1.2217); }   // a slider: broadside, pointing to starboard
    float cs = 1. / sqrt(1. + gSlope * gSlope), sn = gSlope * cs;       // tipped to the road's slope
    vec2 ua = vec2(p.y * cs + p.z * sn, p.z * cs - p.y * sn), nua = vec2(n.y * cs + n.z * sn, n.z * cs - n.y * sn);
    vec3 port = vec3(gHd.y, 0., -gHd.x), fwd = vec3(gHd.x, 0., gHd.y);
    p = gBase + port * p.x + fwd * ua.y + vec3(0., ua.x, 0.);
    n = port * n.x + fwd * nua.y + vec3(0., nua.x, 0.);
    if (gGl > 1.5 && gGl < 2.5 && (gLoose > 0.5 || (part > 12.5 && part < 13.5))) {   // THE DRIFTER'S BIRD (the mirror of the plan's drifterLift)
      // from the metre at which its rider is DRIFT_AHEAD m ahead of the lens's own station on the cliff road it rises
      // DRIFT_UP a metre flown for DRIFT_RUN metres; once it is DRIFT_RISE up it also slides DRIFT_PORT a metre to port
      float t = clamp(uD - (iA.y - ${f1(DRIFT_AHEAD)}) / max(1. - uF.x, 0.05), 0., ${f1(DRIFT_RUN)});
      p += vec3(0., ${f1(DRIFT_UP)} * t, 0.) + port * (${f1(DRIFT_PORT)} * max(t - ${f1(DRIFT_RISE / DRIFT_UP)}, 0.));
    }
  }
`;

// ---------------------------------------------------------------------------------------------
// THE BICYCLE. One set of measures for every generation (metres, rider's frame, at 2.5 times life); what a generation
// has is told by o. lod: 'hi' (the full build), 'mid' (the bulk's build), 'lo' (the light build).
//   o: { lod, col (the frame's colour; with tint 1 the row's tint paints it), tint, spokes (a wheel's count; 0 none),
//        chain, stays (seat stays), rear (the rear triangle at all), saddle, bars }
// Returns the rig of its legs for flatMaterial: { hip, thigh, shin, crank, arm }.
// ---------------------------------------------------------------------------------------------
export const BIKE = {
  R: 0.85, rear: [0.85, -1.2], front: [0.85, 1.55], bb: [0.72, 0], arm: 0.43, drive: -0.13, pedalX: 0.36, ring: 0.36, cog: 0.13,
  seat: [1.58, -0.52], saddle: [1.78, -0.62], headTop: [2.3, 1.02], headLow: [1.85, 1.16], stemTop: [2.72, 0.98], grip: [0.66, 2.78, 0.66],
  hip: [2.05, -0.28], thigh: 0.82, shin: 0.95,    // a low saddle and short legs: a bird's, bent at the knee all the way round
};
const RIG = () => ({ hip: BIKE.hip, thigh: BIKE.thigh, shin: BIKE.shin, crank: BIKE.bb, arm: BIKE.arm });
// a wheel: the tyre a stroke (so it wears the line's own law and is never a heavier band than the line), spokes that are
// drawn in to the hub as the wheel grows small on the picture, a hub
function wheel(B, look, hub, o = {}) {
  const { lod = 'hi', spokes = 12, R = BIKE.R, turn = 1, off = 0, rig = null, hubCol = null } = o, hi = lod === 'hi', c = Pyz(0, hub);
  const rg = rig || [hub[0], hub[1], R, turn], sp = [rg[0], rg[1], rg[2], 2 * turn];
  ring(B, c, R - 0.045, 0.045, { nR: hi ? 22 : lod === 'mid' ? 20 : 10, nr: 3, part: 1, rig: rg, col: look.col('tyre'), line: -0.045, far: true });
  for (let i = 0; i < spokes; i++) {
    if (spokes % 2 === 0 && i >= spokes / 2) continue;                  // an even count: each stroke runs right across the wheel and is two spokes
    const a = (i / spokes) * Math.PI * 2 + off, e = (sg) => V(0, hub[0] + sg * Math.cos(a) * (R - 0.07), hub[1] + sg * Math.sin(a) * (R - 0.07));
    stroke(B, [spokes % 2 ? c : e(-1), e(1)], 0.014, { part: 1, rig: sp, col: look.col('ink') });
  }
  if (hi && hubCol) ball(B, c, [0.09, 0.07, 0.07], { nseg: 6, nring: 2, col: hubCol, line: 0, part: 1, rig: rg });
}
export function bicycle(B, look, o = {}) {
  const { lod = 'hi', tint = 1, spokes = 12, chain = true, stays = true, rear = true, saddle = true, bars = true } = o, hi = lod === 'hi', lo = lod === 'lo';
  const G = BIKE, ink = look.col('ink'), steel = look.col('rim'), col = o.col || look.col('bikeRed');
  const fr = { col, tint, nseg: hi ? 5 : 3, line: INK_W };              // every build wears the line: a light rider is the same drawing with fewer corners
  const bar = (a, b, r, c0 = false, c1 = false) => tube(B, [a, b], lo ? 0.07 : r, { ...fr, cap0: c0, cap1: c1 });
  const bb = Pyz(0, G.bb), sc = Pyz(0, G.seat), ht = Pyz(0, G.headTop), hl = Pyz(0, G.headLow), top = sc.clone().lerp(Pyz(0, G.saddle), 0.15);
  // the diamond: every bar ends in the next one
  bar(bb, Pyz(0, [G.saddle[0] - 0.06, G.saddle[1] + 0.03]), 0.065);          // seat tube and post
  bar(top, ht, 0.06); bar(bb, hl, 0.07);
  if (!lo) bar(hl.clone().lerp(ht, -0.12), ht.clone().lerp(hl, -0.18), 0.08);   // head tube
  if (hi) for (const sx of [-1, 1]) {
    if (rear) bar(V(sx * 0.03, G.bb[0], G.bb[1]), Pyz(sx * 0.11, G.rear), 0.045);
    if (rear && stays) bar(V(sx * 0.03, top.y, top.z), Pyz(sx * 0.11, G.rear), 0.04);
    bar(V(sx * 0.03, hl.y, hl.z), Pyz(sx * 0.11, G.front), 0.045);
  } else { if (rear) bar(bb, Pyz(0, G.rear), 0.05); if (rear && stays) bar(top, Pyz(0, G.rear), 0.045); bar(hl, Pyz(0, G.front), 0.05); }
  // stem and handlebars
  const st = Pyz(0, G.stemTop), gx = G.grip[0], gy = G.grip[1], gz = G.grip[2];
  if (bars && hi) {
    tube(B, [ht, st], 0.045, { col: steel, nseg: 4, line: INK_W, cap0: false, cap1: false });
    tube(B, [V(-gx, gy, gz), V(-gx + 0.14, st.y, st.z - 0.03), V(gx - 0.14, st.y, st.z - 0.03), V(gx, gy, gz)], 0.05, { col: steel, nseg: 4, line: INK_W });
  } else if (bars) { stroke(B, [ht, st], 0.045, { col: steel }); stroke(B, [V(-gx, gy, gz), V(gx, gy, gz)], 0.05, { col: steel }); }
  const hubCol = o.hubs ? steel : null;
  if (o.wheels !== false) { wheel(B, look, G.rear, { lod, spokes, hubCol }); if (o.frontWheel !== false) wheel(B, look, G.front, { lod, spokes, off: 0.3, hubCol }); }
  // the drive, on the starboard side: a chainring that is a ring, a chain round it and round a much smaller cog; then
  // axle, arms and pedals opposite each other
  // (o.crankAt: the crank set turns about another place than the bracket; o.cranks false: there is none)
  const ck = o.crankAt || G.bb, dx = G.drive, crg = (ph) => [ck[0], ck[1], ph, 1];
  if (chain && rear) {
    if (hi) {
      ring(B, V(dx, ck[0], ck[1]), G.ring - 0.03, 0.03, { nR: 12, nr: 3, part: 2, rig: crg(0), line: -0.03, col: ink });
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; stroke(B, [V(dx, ck[0], ck[1]), V(dx, ck[0] + Math.cos(a) * (G.ring - 0.04), ck[1] + Math.sin(a) * (G.ring - 0.04))], 0.028, { part: 2, rig: crg(0), col: ink }); }
      const cc = Pyz(0, G.rear);
      loft(B, [{ p: cc.clone().setX(dx - 0.03), rx: 1e-4, rz: 1e-4 }, { p: cc.clone().setX(dx - 0.03), rx: G.cog, rz: G.cog, m: 1.3 }, { p: cc.clone().setX(dx + 0.03), rx: G.cog, rz: G.cog, m: 1.3 }, { p: cc.clone().setX(dx + 0.03), rx: 1e-4, rz: 1e-4 }],
        6, { col: steel, part: 1, rig: [G.rear[0], G.rear[1], G.R, 1], axis: X_AXIS, side: Y_AXIS, line: INK_W });
    }
    for (const s of hi ? [-1, 1] : [1]) stroke(B, [V(dx, ck[0] + s * (G.ring - 0.03), ck[1] - 0.02), V(dx, G.rear[0] + s * (G.cog + 0.02), G.rear[1])], 0.03, { col: ink, detail: 0.3 });   // the chain's two runs
  }
  if (o.cranks !== false) {
  if (hi) stroke(B, [V(-0.24, ck[0], ck[1]), V(0.24, ck[0], ck[1])], 0.05, { part: 2, rig: crg(0), col: ink });
  for (const sx of [-1, 1]) {
    const ph = sx < 0 ? 0 : Math.PI, ax = sx * 0.22;
    stroke(B, [V(ax, ck[0], ck[1]), V(ax, ck[0] + G.arm, ck[1])], 0.045, { part: 2, rig: crg(ph), nseg: hi ? 4 : 3, col: ink });
    const px = sx * G.pedalX, py = ck[0] + G.arm, pz = ck[1];
    if (!lo) box(B, V(px - 0.13, py - 0.04, pz - 0.15), V(px + 0.13, py + 0.04, pz + 0.15), { col: ink, line: 0, part: 3, rig: [ck[0], ck[1], ph, G.arm] });
  }
  }
  // the saddle: brown, lined, long enough behind the post to be seen under the bird
  if (saddle && !lo) ball(B, Pyz(0, G.saddle), [0.2, 0.52, 0.11], { nseg: hi ? 6 : 4, nring: hi ? 3 : 2, axis: Z_AXIS, col: look.col('saddle'), line: INK_W });
  return RIG();
}

// the index of a rig in the builder's table (a leg carries it in aRig.w; flatMaterial takes the table): equal rigs share one
function rigIndex(B, rig) {
  const T = B.rigs || (B.rigs = []), key = JSON.stringify(rig);
  let i = T.findIndex((r) => JSON.stringify(r) === key);
  if (i < 0) { i = T.length; T.push(rig); }
  return i;
}
// Two legs in bone space (the shader lays each from hip to knee to the ankle over its pedal), each with a webbed foot.
// xs: the x of each leg; phases: the crank phase each foot rides (0 the starboard pedal, PI the port one); ri: the rig's index.
// o.lift: the ankle's height over its pedal (one number or one a leg; a negative one is a foot that slips off once a turn).
function legs(B, look, rig, xs, phases, o = {}) {
  const { lod = 'hi', col = look.col('legs'), r = 0.06, lift = 0.12, foot = true, ri = 0, fk = 1 } = o, hi = lod === 'hi', n = hi ? 4 : 3, line = INK_W;
  xs.forEach((x, i) => {
    const rg = [x, phases[i], Array.isArray(lift) ? lift[i] : lift, ri];
    tube(B, [V(0, 0, 0), V(0, rig.thigh, 0)], r, { col, nseg: n, line, part: 4, rig: rg, cap0: hi, cap1: hi, round: 0.9 });
    tube(B, [V(0, 0, 0), V(0, rig.shin, 0)], r * 0.85, { col, nseg: n, line, part: 5, rig: rg, cap0: hi, cap1: false, round: 0.9 });   // the ankle is in the foot
    if (foot) loft(B, [...(hi ? [{ p: V(0, -0.05, -0.14), rx: 1e-4, rz: 1e-4 }] : []), { p: V(0, -0.04, -0.06), rx: 0.08 * fk, rz: 0.055 }, { p: V(0, -0.05, 0.36 * fk), rx: (hi ? 0.2 : 0.17) * fk, rz: 0.045 }, ...(hi ? [{ p: V(0, -0.05, 0.45 * fk), rx: 1e-4, rz: 1e-4 }] : [])],
      hi ? 4 : 3, { col, side: X_AXIS, axis: Z_AXIS, line, part: 6, rig: rg });
  });
}

// A smooth run of n + 1 stations through a few typed ones (Catmull-Rom on place, radii and rig; closer together toward
// both ends, where an outline turns fastest): a blade or a neck seen close keeps no corners of its typing.
function smooth(ctrl, n) {
  const m = ctrl.length - 1, out = [], cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - 3 * c + d - a) * t * t * t);
  for (let i = 0; i <= n; i++) {
    const u = (0.5 - 0.5 * Math.cos(Math.PI * i / n)) * m, k = Math.min(m - 1, Math.floor(u)), t = u - k;
    const A = ctrl[Math.max(0, k - 1)], Bc = ctrl[k], Cc = ctrl[k + 1], D = ctrl[Math.min(m, k + 2)], f = (g) => cr(g(A), g(Bc), g(Cc), g(D), t);
    const st = { p: V(f((q) => q.p.x), f((q) => q.p.y), f((q) => q.p.z)) };
    if (Bc.rx !== undefined) { st.rx = Math.max(1e-4, f((q) => q.rx)); st.rz = Math.max(1e-4, f((q) => q.rz)); }
    if (Bc.r !== undefined) st.r = Math.max(1e-4, f((q) => q.r));
    if (Bc.rig) st.rig = Bc.rig.map((_, j) => (j === 3 ? Math.min(1, Math.max(0, f((q) => q.rig[3]))) : Bc.rig[j]));
    out.push(st);
  }
  return out;
}

// A SECOND FLAT TONE on a ball just laid (base: its first vertex; i0: its first index; nring, nseg as it was lofted): the
// columns j0 .. j1 - 1 of its skin about its axis take the colour `col`. Their corners are laid again in that colour (the
// three corners of a triangle carry ONE colour), straight after the ball's own, and the ball's hull record is made to
// cover them. Returns the two edges of the band as lines a hair off the skin, pole to pole (for the strokes of its line).
function toneBand(B, base, i0, nring, nseg, j0, j1, col) {
  const cols = nseg + 1, map = new Map();
  const again = (v) => {
    let w = map.get(v);
    if (w === undefined) {
      w = B.pos.length / 3; map.set(v, w);
      for (let q = 0; q < 3; q++) { B.pos.push(B.pos[v * 3 + q]); B.nor.push(B.nor[v * 3 + q]); B.col.push(col[q]); }
      for (let q = 0; q < 4; q++) { B.k.push(B.k[v * 4 + q]); B.rig.push(B.rig[v * 4 + q]); }
    }
    return w;
  };
  for (let i = 0; i < nring; i++) for (let j = j0; j < j1; j++) { const q = i0 + (i * nseg + j) * 6; for (let e = 0; e < 6; e++) B.idx[q + e] = again(B.idx[q + e]); }
  const hull = B.hulls.find((h) => h[0] === base); if (hull) hull[1] = B.pos.length / 3;
  return [j0, j1].map((j) => {
    const line = [];
    for (let i = 1; i < nring; i++) { const v = (base + i * cols + j) * 3; line.push(V(B.pos[v] + B.nor[v] * 0.015, B.pos[v + 1] + B.nor[v + 1] * 0.015, B.pos[v + 2] + B.nor[v + 2] * 0.015)); }
    return line;
  });
}

// ---------------------------------------------------------------------------------------------
// THE BACK (after the first preview: seen from astern a rider was a white knob). What makes a back a BIRD's, on every
// generation and build, all of it riding with the trunk (part 10 unless told) and inside the kind's own box:
//   two WING FOLDS in ink: the inner edges of the folded wings, from the shoulders down the back to meet at the tail's
//   root (a V from astern), and on the full build a feather's scallop outboard of each;
//   the PRIMARIES (o.prim): each folded wing's pointed end in the black of a white pelican's flight feathers, hanging
//   aft and down from the wing's rear end, a little outboard: from astern they stand out of the trunk's outline either
//   side of the rump (a tone and an outline that stay where a line is too small). o.prim.col: the wing itself, where a
//   kind had none (generation one): a blade of that colour with the line from the shoulder, its last third black;
//   a TAIL: one cocked spade of the trunk's colour with the line, ink strokes parting its three feathers.
// T: the trunk as trunkOf(centre [y, z], radii, axis [y, z]) gives it; onTrunk(T, t, th, sx, off): the place on its skin
// at t along its axis (-1 the rear pole, 1 the fore one) and th radians round from its dorsal line toward the flank
// sx, `off` metres proud of it. o.arc: [t, th] at the shoulder, [t, th] at the tail's root.
// ---------------------------------------------------------------------------------------------
const trunkOf = (c, r, ax) => { const a = V(0, ax[0], ax[1]).normalize(); return { c: V(0, c[0], c[1]), r, a, u: V(0, a.z, -a.y) }; };
function onTrunk(T, t, th, sx = 1, off = 0.03) {
  const k = Math.sqrt(Math.max(0, 1 - t * t)), sn = Math.sin(th) * sx, cs = Math.cos(th);
  const p = T.c.clone().addScaledVector(T.a, t * T.r[1]).add(V(k * sn * T.r[0], 0, 0)).addScaledVector(T.u, k * cs * T.r[2]);
  const n = T.a.clone().multiplyScalar(t / T.r[1]).add(V(k * sn / T.r[0], 0, 0)).addScaledVector(T.u, k * cs / T.r[2]).normalize();
  return p.addScaledVector(n, off);
}
function backInto(B, look, T, o = {}) {
  const { lod = 'hi', part = 10, rig = [0, 0, 0, 0], arc = [0.15, 0.95, -0.86, 0.18], tail = null, prim = null, col = look.col('pelican') } = o;
  const lo = lod === 'lo', hi = lod === 'hi', ink = look.col('ink'), mv = { part, rig }, m = lo ? 2 : 4, at = (f) => [arc[0] + (arc[2] - arc[0]) * f, arc[1] + (arc[3] - arc[1]) * Math.pow(f, 1.6)];
  for (const sx of [-1, 1]) {
    const pts = []; for (let i = 0; i <= m; i++) { const [t, th] = at(i / m); pts.push(onTrunk(T, t, th, sx)); }
    stroke(B, pts, INK_W * 0.5, { ...mv, col: ink, detail: 0.2 });
    if (hi) {                                                            // a scallop: a feather's end, open toward the head
      const [t, th] = at(0.5), dt = 0.13 * Math.sign(arc[0] - arc[2]);
      stroke(B, [onTrunk(T, t + dt, th + 0.22, sx), onTrunk(T, t - 0.2 * dt, th + 0.42, sx), onTrunk(T, t + dt, th + 0.62, sx)], INK_W * 0.42, { ...mv, col: ink, detail: 0.3 });
    }
    if (prim) {
      const a = V(sx * prim.root[0], prim.root[1], prim.root[2]), b = V(sx * prim.tip[0], prim.tip[1], prim.tip[2]), d = b.clone().sub(a), side = V(0, d.z, -d.y).normalize(), w = prim.w, ns = lo ? 3 : 4;
      const blade = (f0, k0, c, line, out) => loft(B, [{ p: a.clone().addScaledVector(d, f0).add(out), rx: k0 * w, rz: 0.04 }, { p: a.clone().addScaledVector(d, f0 + (1 - f0) * 0.4).add(out), rx: Math.max(k0, 0.9) * w, rz: 0.04 }, { p: b.clone().add(out), rx: 1e-4, rz: 1e-4 }], ns, { col: c, side, line, ...mv });
      if (prim.col) { blade(0, 0.5, prim.col, INK_W, V(0, 0, 0)); blade(0.62, 0.82, look.col('wingTip'), 0, V(sx * 0.02, -0.03, -0.03)); }
      else blade(0, 0.5, look.col('wingTip'), 0, V(0, 0, 0));
    }
  }
  if (tail) {
    const r0 = V(0, tail.root[0], tail.root[1]), r1 = V(0, tail.tip[0], tail.tip[1]), d = r1.clone().sub(r0), tw = tail.w, wide = r0.clone().addScaledVector(d, 0.7);
    loft(B, [{ p: r0, rx: 0.4 * tw, rz: 0.06 }, { p: wide, rx: tw, rz: 0.045 }, { p: r1, rx: 1e-4, rz: 1e-4 }], lo ? 4 : 6, { col, side: X_AXIS, line: INK_W, ...mv });
    if (!lo) for (const sx of [-1, 1]) for (const face of hi ? [-1, 1] : [-1]) {   // the underside always (a cocked tail shows it from astern)
      const up = V(0, -d.z, d.y).normalize().multiplyScalar(0.062 * face);
      stroke(B, [r0.clone().addScaledVector(d, 0.3).add(up).add(V(sx * 0.14 * tw, 0, 0)), r0.clone().addScaledVector(d, 0.86).add(up).add(V(sx * 0.3 * tw, 0, 0))], INK_W * 0.38, { ...mv, col: ink, detail: 0.3 });
    }
  }
}

// ---------------------------------------------------------------------------------------------
// THE PELICAN WHOLE, on its bicycle: generations three and four, the bulk's later build and the leader.
//   o: { lod: 'hi' | 'mid' | 'lo', gen: 3 | 4 | 5 (the leader), fine (1; the leader 1.4: rings and sides), ri (rig index),
//        col / tint (the frame), spokes }
// Returns { rig, head: { top: [y, z], part, rig }, neck: [y, z], neckR, back: [y, z] }.
// ---------------------------------------------------------------------------------------------
function pelican(B, look, o = {}) {
  const { lod = 'hi', gen = 3, fine = 1 } = o, hi = lod === 'hi', mid = lod === 'mid', lo = lod === 'lo';
  const white = look.col('pelican'), ink = look.col('ink'), bill = look.col('bill'), pouch = look.col('pouch'), L = INK_W;
  const q = (n) => Math.max(3, Math.round(n * fine)), headPart = gen >= 5 ? 16 : 11;
  const rig = bicycle(B, look, { lod, col: o.col, tint: o.tint ?? 1, spokes: o.spokes ?? (hi ? 12 : mid ? 6 : 4), chain: !lo, ...(o.bike || {}) }), ri = rigIndex(B, rig);
  const nod = [4.05, 0.55, 0.05, 0];
  // trunk: an egg tipped nose up, sitting low on the saddle; a short tail
  const tn = hi ? 2 * Math.round(q(18) / 2) : mid ? 12 : 8, tr = hi ? q(14) : mid ? 9 : 6, ti = B.idx.length, shade = look.col('pelicanShade');
  const tb = ball(B, V(0, 2.62, -0.3), [0.64, 1.1, 0.72], { nseg: tn, nring: tr, axis: V(0, 0.26, 0.966), col: white, line: INK_W, part: 10 });
  if (gen >= 4 && !lo) {
    // THE SECOND TONE of the fine ones, on the trunk: its underside, from 25 degrees under each flank's widest line, is a
    // flat grey (the trunk's own skin in another colour: nothing cuts into anything), and an ink stroke runs along each
    // edge of the grey, so the shade is a drawn shape with its line and no gradient
    const m = Math.max(1, Math.round(tn * 25 / 360));
    for (const edge of toneBand(B, tb, ti, tr, tn, tn / 2 + m, tn - m, shade)) stroke(B, edge, INK_W * 0.5, { part: 10, col: ink, detail: 0.3 });
  }
  backInto(B, look, trunkOf([2.62, -0.3], [0.64, 1.1, 0.72], [0.26, 0.966]), { lod, tail: { root: [2.42, -1.2], tip: [2.98, -1.92], w: 0.4 }, prim: hi && gen >= 4 ? null : { root: [0.75, 2.62, -0.85], tip: [0.8, 2.08, -1.42], w: 0.14 } });   // the fine ones' black feathers are their own, below
  // the long neck, standing clear of the trunk in its S, and the head
  const nk = hi ? smooth([[2.95, 0.42, 0.33], [3.3, 0.72, 0.27], [3.7, 0.8, 0.22], [4.08, 0.64, 0.2], [4.38, 0.46, 0.19]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 7)
    : mid ? smooth([[2.95, 0.46, 0.31], [3.35, 0.72, 0.26], [3.75, 0.78, 0.22], [4.38, 0.48, 0.19]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 4)
    : [[2.95, 0.5, 0.3], [3.7, 0.74, 0.22], [4.38, 0.5, 0.19]].map(([y, z, r]) => ({ p: V(0, y, z), r }));
  tube(B, nk.map((k) => k.p), nk.map((k) => k.r), { col: white, nseg: hi ? q(8) : mid ? 6 : 5, line: INK_W, part: 10, cap0: false, cap1: false });
  ball(B, V(0, 4.5, 0.5), [0.3, 0.35, 0.31], { nseg: hi ? q(12) : mid ? 9 : 7, nring: hi ? q(6) : mid ? 5 : 4, axis: Z_AXIS, col: white, line: INK_W, part: headPart, rig: nod });
  if (!lo) for (const sx of [-1, 1]) ball(B, V(sx * 0.265, 4.58, 0.63), hi ? [0.07, 0.07, 0.07] : [0.055, 0.055, 0.055], { nseg: hi ? 6 : 4, nring: hi ? 3 : 2, col: ink, line: 0, part: headPart, rig: nod });   // the eye: a round dot on the full build
  // the huge bill and under it the pouch
  const b0 = V(0, 4.5, 0.74), b1 = V(0, 3.78, 2.3), bd = b1.clone().sub(b0), dn = V(0, -bd.z, bd.y).normalize();   // dn: across the bill, downward
  const at = (f, sag = 0, x = 0) => b0.clone().addScaledVector(bd, f).addScaledVector(dn, sag).add(V(x, 0, 0));
  loft(B, [{ p: at(0), rx: 0.19, rz: 0.13 }, ...(hi ? [{ p: at(0.45), rx: 0.16, rz: 0.1 }] : []), { p: at(0.92), rx: 0.085, rz: 0.065 }, { p: at(1.0, 0.07), rx: 1e-4, rz: 1e-4 }],
    hi ? 6 : mid ? 4 : 3, { col: bill, side: X_AXIS, line: L, part: headPart, rig: nod });
  const sack = hi ? [[0.0, 0.16, 0.15, 0.13, 0], [0.22, 0.36, 0.2, 0.3, 0.8], [0.5, 0.38, 0.18, 0.3, 1], [0.8, 0.18, 0.11, 0.13, 0.4]] : [[0.0, 0.16, 0.15, 0.13, 0], [0.4, 0.38, 0.19, 0.3, 1]];
  loft(B, [...sack.map(([f, sag, rx, rz, w]) => ({ p: at(f, sag), rx, rz, rig: [w, nod[0], nod[1], nod[2]] })), { p: at(0.99, 0.05), rx: 1e-4, rz: 1e-4, rig: [0, nod[0], nod[1], nod[2]] }],
    hi ? 6 : mid ? 4 : 3, { col: pouch, side: X_AXIS, line: L, part: 7 });
  // wings: one blade down each flank, its fore end lying on the grip (pinned there when the rider stands on the pedals)
  const [gx, gy, gz] = BIKE.grip, wingCol = gen >= 4 ? shade : white;
  for (const sx of [-1, 1]) {
    const w = (x, y, z, rx, rz, pin = 0) => ({ p: V(sx * x, y, z), rx, rz, rig: [0, 0, 0, pin] });
    // seen from the side a blade's outline is drawn by its stations, so it has many of them and only four corners round
    if (hi) loft(B, smooth([w(0.7, 2.6, -1.08, 1e-4, 1e-4), w(0.72, 2.63, -0.92, 0.055, 0.17), w(0.75, 2.71, -0.55, 0.09, 0.34), w(0.77, 2.8, -0.12, 0.1, 0.42),
      w(0.77, 2.83, 0.24, 0.1, 0.39, 0.3), w(gx + 0.04, gy + 0.03, gz + 0.02, 0.08, 0.14, 1), w(gx, gy + 0.01, gz + 0.2, 1e-4, 1e-4, 1)], 10), 4, { col: wingCol, side: X_AXIS, line: INK_W, part: 10 });
    else loft(B, [w(0.72, 2.62, -0.95, 1e-4, 1e-4), w(0.77, 2.8, -0.05, 0.08, 0.4), w(gx, gy + 0.02, gz + 0.12, 0.06, 0.12, 1)], 3, { col: wingCol, side: X_AXIS, line: INK_W, part: 10 });
    if (hi && gen >= 4) {
      // the fourth generation's black flight feathers under the blade's rear end (their ends droop aft and down: from astern they stand out either side of the rump), and a row of scallops along its edge
      loft(B, [w(0.75, 2.5, -0.5, 0.05, 0.13), w(0.75, 2.46, -0.86, 0.05, 0.13), w(0.8, 2.08, -1.42, 1e-4, 1e-4)], 3, { col: look.col('wingTip'), side: X_AXIS, line: 0, part: 10 });
      for (let i = 0; i < 3; i++) { const z = -0.55 + i * 0.3, y = 2.56 + i * 0.035, x = sx * 0.862; stroke(B, [V(x, y + 0.1, z - 0.11), V(x, y, z), V(x, y + 0.1, z + 0.11)], INK_W * 0.42, { part: 10, col: ink, detail: 0.45 }); }
    }
  }
  if (gen >= 4 && !lo) {
    // the second tone under the pouch: a deeper orange (a flat shape of its own with its line, no gradient)
    loft(B, [[0.1, 0.3, 0.1, 0.1, 0.4], [0.3, 0.47, 0.15, 0.2, 1], [0.55, 0.45, 0.12, 0.18, 1], [0.76, 0.26, 0.05, 0.07, 0.4]].map(([f, sag, rx, rz, wt]) => ({ p: at(f, sag), rx, rz, rig: [wt, nod[0], nod[1], nod[2]] })),
      hi ? 5 : 4, { col: look.col('pouchShade'), side: X_AXIS, line: INK_W, part: 7 });
  }
  // two lines a hull cannot draw, because the shapes cut into each other there, each a stroke of the line's own weight:
  // the gape (down each side of the bill, where the pouch hangs from it) and a ring where the bill leaves the head
  if (hi) {
    for (const sx of [-1, 1]) stroke(B, [at(0.06, 0.1, sx * 0.19), at(0.3, 0.085, sx * 0.175), at(0.6, 0.07, sx * 0.145), at(0.92, 0.05, sx * 0.08)], INK_W * 0.5, { part: headPart, rig: nod, col: ink, detail: 0.3 });
    const loop = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI * 2; loop.push(at(0.045, Math.sin(a) * 0.145, Math.cos(a) * 0.2)); }
    stroke(B, loop, INK_W * 0.5, { part: headPart, rig: nod, col: ink, detail: 0.3 });
    // three speed strokes in the air behind the head and the back
    speedStrokes(B, look, [[0.2, 4.42, -0.02, 0.36], [-0.2, 3.95, -0.25, 0.4], [0.08, 3.36, -1.0, 0.4]]);
  }
  if (gen >= 5) {
    // the leader alone: a pale yellow wash on the crown, and the eye in a pale ring
    ball(B, V(0, 4.68, 0.44), [0.23, 0.29, 0.2], { nseg: q(8), nring: q(4), axis: Z_AXIS, col: look.col('crownWash'), line: INK_W, part: headPart, rig: nod });
    for (const sx of [-1, 1]) ball(B, V(sx * 0.255, 4.58, 0.63), [0.03, 0.1, 0.1], { nseg: 8, nring: 3, col: look.col('eyeRing'), line: 0, part: headPart, rig: nod });
  }
  legs(B, look, rig, [-BIKE.pedalX - 0.02, BIKE.pedalX + 0.02], [0, Math.PI], { lod, ri });
  return { rig, at, head: { top: [4.84, 0.5], part: headPart, rig: nod }, neck: [3.42, 0.75], neckR: 0.26, back: [3.2, -0.95] };
}

// ---------------------------------------------------------------------------------------------
// GENERATION TWO, the pouch arrives: a body tilted forward, an S neck, a long straight bill with a yellow sack under it,
// a flat wing on each flank, no tail yet. Its bicycle is a diamond of coloured tubes whose REAR TRIANGLE IS MISSING
// (nothing joins the pedals to the rear wheel), wheels of four spokes, no chain. THE FLAW THAT LASTED LONGEST: both legs
// are on the near side, and one foot slips off its pedal once a turn. o: { lod, col / tint }
// ---------------------------------------------------------------------------------------------
function pouchBird(B, look, o = {}) {
  const { lod = 'hi' } = o, hi = lod === 'hi', mid = lod === 'mid', lo = lod === 'lo', L = INK_W;
  const white = look.col('pelican'), ink = look.col('ink'), nod = [3.98, 0.56, 0.05, 0], tilt = V(0, -0.1, 0.995);
  const rig = bicycle(B, look, { lod, col: o.col, tint: o.tint ?? 1, spokes: 4, chain: false, rear: false, stays: false }), ri = rigIndex(B, rig);
  ball(B, V(0, 2.6, -0.3), [0.62, 1.0, 0.7], { nseg: hi ? 16 : mid ? 11 : 8, nring: hi ? 12 : mid ? 8 : 6, axis: tilt, col: white, line: INK_W, part: 10 });
  const nk = (hi ? smooth([[2.8, 0.42, 0.31], [3.3, 0.8, 0.25], [3.8, 0.7, 0.21], [4.3, 0.5, 0.19]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 6)
    : mid ? smooth([[2.8, 0.42, 0.31], [3.3, 0.8, 0.25], [3.8, 0.7, 0.21], [4.3, 0.5, 0.19]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 4)
    : [[2.8, 0.46, 0.3], [3.55, 0.78, 0.22], [4.3, 0.5, 0.19]].map(([y, z, r]) => ({ p: V(0, y, z), r })));
  tube(B, nk.map((k) => k.p), nk.map((k) => k.r), { col: white, nseg: hi ? 8 : mid ? 6 : 5, line: INK_W, part: 10, cap0: false, cap1: false });
  ball(B, V(0, 4.42, 0.52), [0.3, 0.34, 0.3], { nseg: hi ? 12 : mid ? 9 : 7, nring: hi ? 6 : mid ? 5 : 4, axis: Z_AXIS, col: white, line: INK_W, part: 11, rig: nod });
  if (!lo) for (const sx of [-1, 1]) ball(B, V(sx * 0.265, 4.5, 0.64), [0.055, 0.055, 0.055], { nseg: 4, nring: 2, col: ink, line: 0, part: 11, rig: nod });
  // the bill: one straight spike, no hook yet; the sack under it
  const b0 = V(0, 4.42, 0.76), b1 = V(0, 3.86, 2.2), bd = b1.clone().sub(b0), dn = V(0, -bd.z, bd.y).normalize(), at = (f, sag = 0) => b0.clone().addScaledVector(bd, f).addScaledVector(dn, sag);
  loft(B, [{ p: at(0), rx: 0.18, rz: 0.12 }, { p: at(1), rx: 1e-4, rz: 1e-4 }], hi ? 6 : mid ? 4 : 3, { col: look.col('bill'), side: X_AXIS, line: L, part: 11, rig: nod });
  const sack = hi ? [[0.02, 0.14, 0.14, 0.12, 0], [0.3, 0.36, 0.19, 0.28, 1], [0.62, 0.3, 0.15, 0.22, 0.8]] : [[0.02, 0.14, 0.14, 0.12, 0], [0.42, 0.36, 0.18, 0.28, 1]];
  loft(B, [...sack.map(([f, sag, rx, rz, w]) => ({ p: at(f, sag), rx, rz, rig: [w, nod[0], nod[1], nod[2]] })), { p: at(0.92, 0.05), rx: 1e-4, rz: 1e-4, rig: [0, nod[0], nod[1], nod[2]] }],
    hi ? 6 : mid ? 4 : 3, { col: look.col('pouch'), side: X_AXIS, line: L, part: 7 });
  // a wing: one flat ellipsoid on each flank, reaching for nothing
  for (const sx of [-1, 1]) ball(B, V(sx * 0.7, 2.7, -0.34), [0.08, 0.66, 0.36], { nseg: hi ? 8 : mid ? 6 : 4, nring: hi ? 7 : mid ? 5 : 3, axis: tilt, side: X_AXIS, col: white, line: INK_W, part: 10 });
  backInto(B, look, trunkOf([2.6, -0.3], [0.62, 1.0, 0.7], [-0.1, 0.995]), { lod, tail: { root: [2.62, -1.18], tip: [3.02, -1.74], w: 0.3 }, prim: { root: [0.72, 2.72, -0.8], tip: [0.8, 2.15, -1.4], w: 0.14 } });   // its first tail: a small one
  // both legs on the near side (the drive side, toward the lens's lane); the inner foot slips
  legs(B, look, rig, [-BIKE.pedalX - 0.04, -BIKE.pedalX + 0.2], [0, 0.55], { lod, ri, lift: [0.12, -0.34] });
  return { rig, at, head: { top: [4.76, 0.52], part: 11, rig: nod }, neck: [3.42, 0.78], neckR: 0.25, back: [3.2, -0.95] };
}

// ---------------------------------------------------------------------------------------------
// GENERATION ONE, the egg birds: a white egg, a ball head, a dot eye, a small orange cone for a bill, no pouch, a stub
// tail; two short legs that pump but never reach the pedals. Its bicycle is two rings, one triangle and a bar for the
// handle, all in ONE flat primary (the row's tint); no spokes, no chain; two small boxes for pedals, turning on nothing.
// o.head: '' | 'duck' (a short flat yellow bill) | 'goose' (a long neck, a short bill) | 'stork' (a long thin red bill,
// red legs): the same build with another head, what a model may call its own drawing. They ride undressed.
// ---------------------------------------------------------------------------------------------
function eggBird(B, look, o = {}) {
  const { lod = 'hi', head = '' } = o, lo = lod === 'lo', L = INK_W, white = look.col('pelican'), ink = look.col('ink');
  const prim = { col: look.col('bikeRed'), tint: 1 }, hubs = [[0.85, -1.2], [0.85, 1.4]], apex = V(0, 2.0, -0.2), G = BIKE;
  for (const h of hubs) ring(B, Pyz(0, h), 0.78, 0.07, { nR: lo ? 10 : 18, nr: lo ? 3 : 6, line: L, ...prim });
  const bars = [[Pyz(0, hubs[0]), apex], [apex, Pyz(0, hubs[1])], [Pyz(0, hubs[1]), Pyz(0, hubs[0])], [Pyz(0, hubs[1]), V(0, 2.78, 1.02)]];   // the triangle, and the bar for the handle
  bars.forEach(([a, b], i) => tube(B, [a, b], 0.07, { nseg: lo ? 3 : 4, line: L, cap0: !lo, cap1: !lo || i === 3, ...prim }));   // the light build's bars end open in their joints
  for (const [sx, ph] of [[-1, 0], [1, Math.PI]]) box(B, V(sx * G.pedalX - 0.13, G.bb[0] + G.arm - 0.05, -0.16), V(sx * G.pedalX + 0.13, G.bb[0] + G.arm + 0.05, 0.16), { ...prim, line: 0, part: 3, rig: [G.bb[0], G.bb[1], ph, G.arm] });
  // the egg, standing on the triangle's top corner and leaning a little forward; its stub of a tail
  const lean = V(0, 0.94, 0.34), goose = head === 'goose', hy = goose ? 4.5 : 3.84, hz = goose ? 0.62 : 0.34, nod = [hy - 0.4, hz, 0.04, head === 'stork' ? 1.2 : 1.9];   // a short bill shows only in a long glance: its head turns 65 degrees (the stork's 41)
  ball(B, V(0, 2.84, -0.18), [0.6, 0.88, 0.64], { nseg: lo ? 8 : 14, nring: lo ? 5 : 8, axis: lean, col: white, line: L, part: 10 });
  backInto(B, look, trunkOf([2.84, -0.18], [0.6, 0.88, 0.64], [0.94, 0.34]), { lod, arc: [0.5, 0.95, -0.5, 0.2], tail: { root: [2.48, -0.7], tip: [2.84, -1.26], w: 0.3 }, prim: { root: [0.5, 3.28, -0.1], tip: [0.8, 2.22, -0.82], w: 0.2, col: white } });   // its first wings
  if (goose) tube(B, [V(0, 3.5, 0.1), V(0, 3.95, 0.42), V(0, 4.36, 0.58)], [0.24, 0.17, 0.16], { col: white, nseg: lo ? 4 : 6, line: L, part: 10, cap0: false, cap1: false });
  ball(B, V(0, hy, hz), [0.31, 0.31, 0.31], { nseg: lo ? 6 : 12, nring: lo ? 3 : 6, col: white, line: L, part: 11, rig: nod });
  if (!lo) for (const sx of [-1, 1]) ball(B, V(sx * 0.27, hy + 0.08, hz + 0.14), [0.055, 0.055, 0.055], { nseg: 4, nring: 2, col: ink, line: 0, part: 11, rig: nod });
  // the bill, by the head it was given
  const b0 = V(0, hy - 0.03, hz + 0.24), n = lo ? 3 : 6, mv = { part: 11, rig: nod, line: L };
  if (head === 'duck') loft(B, [{ p: b0, rx: 0.17, rz: 0.08 }, { p: b0.clone().add(V(0, -0.05, 0.36)), rx: 0.2, rz: 0.05 }, { p: b0.clone().add(V(0, -0.06, 0.5)), rx: 0.12, rz: 1e-4 }], n, { col: look.col('bikeYellow'), side: X_AXIS, ...mv });
  else if (head === 'stork') cone(B, b0, b0.clone().add(V(0, -0.32, 1.25)), 0.09, 0, { nseg: lo ? 3 : 5, col: look.col('bikeRed'), cap0: false, ...mv });
  else cone(B, b0, b0.clone().add(V(0, -0.07, goose ? 0.36 : 0.52)), goose ? 0.12 : 0.15, 0, { nseg: n, col: look.col('bill'), cap0: false, ...mv });
  // two short legs: they pump after the pedals and end short of them (the chain of two bones is too short to arrive)
  const rig = { hip: [2.3, -0.1], thigh: 0.48, shin: 0.5, crank: G.bb, arm: G.arm }, ri = rigIndex(B, rig);
  legs(B, look, rig, [-G.pedalX - 0.02, G.pedalX + 0.02], [0, Math.PI], { lod, ri, lift: 0.25, col: head === 'stork' ? look.col('bikeRed') : look.col('legs') });
  return { rig, head: { top: [hy + 0.33, hz], part: 11, rig: nod }, neck: [hy - 0.35, hz - 0.1], neckR: 0.24, back: [3.2, -0.7] };
}

// ---------------------------------------------------------------------------------------------
// ROWS. A dealt row of the plan ({ n | lane, o, own, size, livery, kind, band, slider }) as the eight numbers of iA, iB.
// ---------------------------------------------------------------------------------------------
const LIVERY = { red: 'bikeRed', teal: 'bikeTeal', yellow: 'bikeYellow' }, ROCKERS = ['g1', 'g2', 'bulk2', 'bulk3', 'g3'];
export function rowNumbers(look, row) {
  if (Array.isArray(row)) return row;
  const t = look.col(LIVERY[row.livery] || 'bikeRed');
  const gl = row.glitch ?? (row.kind === 'h9' ? GLITCH.square : row.slider ? GLITCH.slider : row.kind === 'h7' ? GLITCH.drifter : (row.band === 'leader' || row.kind === 'leader') ? GLITCH.leader : (row.band === 'g4' || row.kind === 'g4') ? GLITCH.stands : ROCKERS.includes(row.band) ? GLITCH.rocks : 0);
  return [row.n ?? laneN(row.lane ?? 1), row.o ?? 0, row.own ?? 0, row.size ?? PP.SCALE, t[0], t[1], t[2], gl];
}
const rowOn = (B, from, look, row) => { const r = rowNumbers(look, row); setRow(B, from, r.slice(0, 4), r.slice(4)); };
// move everything laid since `from` along the rider's own length (a kind whose loose part must lie about the box's middle)
function shiftZ(B, from, dz, dy = 0) {
  for (let v = from; v < B.pos.length / 3; v++) {
    const part = B.k[v * 4 + 1] % 32, r = v * 4;
    if (part >= 4 && part <= 6) continue;                                // a leg is laid in its bones' own space: its rig's hip and crank are moved by the caller
    B.pos[v * 3 + 2] += dz; B.pos[v * 3 + 1] += dy;
    if ([1, 2, 3, 11, 16, 17, 21, 24].includes(part)) { B.rig[r + 1] += dz; B.rig[r] += dy; }
    else if (part === 7) { B.rig[r + 2] += dz; B.rig[r + 1] += dy; }
    else if (part === 23) B.rig[r] += dy; else if (part === 25) B.rig[r + 1] += dy;
  }
}
// turn everything laid since `from` half round about the vertical through z = zc (a bird that faces astern): places and
// normals, the pins of the parts that swing, the nod's hand; a leg's bones are turned in their own space
function turnAbout(B, from, zc) {
  for (let v = from; v < B.pos.length / 3; v++) {
    const part = B.k[v * 4 + 1] % 32, r = v * 4, leg = part >= 4 && part <= 6;
    B.pos[v * 3] = -B.pos[v * 3]; B.pos[v * 3 + 2] = (leg ? 0 : 2 * zc) - B.pos[v * 3 + 2];
    B.nor[v * 3] = -B.nor[v * 3]; B.nor[v * 3 + 2] = -B.nor[v * 3 + 2];
    if (leg) { B.rig[r] = -B.rig[r]; B.rig[r + 1] += Math.PI; }             // the other hand's pedal
    else if (part === 11 || part === 16) { B.rig[r + 1] = 2 * zc - B.rig[r + 1]; B.rig[r + 2] = -B.rig[r + 2]; }
    else if (part === 7) { B.rig[r + 2] = 2 * zc - B.rig[r + 2]; B.rig[r + 3] = -B.rig[r + 3]; }
    else if (part === 25) B.rig[r] = -B.rig[r];
  }
}
// a bicycle laid since `from`, made k times its size about the road under its cranks (the line keeps its one weight)
function scaleBike(B, from, k) {
  for (let v = from; v < B.pos.length / 3; v++) {
    const part = B.k[v * 4 + 1], r = v * 4;
    for (let q = 0; q < 3; q++) B.pos[v * 3 + q] *= k;
    if (B.k[r] < 0) B.k[r] *= k;                                         // a stroke's own radius
    if (part === 1) { B.rig[r] *= k; B.rig[r + 1] *= k; B.rig[r + 2] *= k; }
    else if (part === 2) { B.rig[r] *= k; B.rig[r + 1] *= k; }
    else if (part === 3) { B.rig[r] *= k; B.rig[r + 1] *= k; B.rig[r + 3] *= k; }
  }
}
// everything laid since `from` becomes the rider's LOOSE body (the drifter's bird): the same parts, 32 over
const loosen = (B, from) => { for (let v = from; v < B.pos.length / 3; v++) B.k[v * 4 + 1] += 32; };

// THE BIB: a white card with the line round it, a race number of one to three digits on it (digits only; one may lie on
// its side on a hopeless rider). It rides with the trunk. AFTER THE FIRST PREVIEW it hangs UPRIGHT under the tail, over
// the rear wheel: lying on the back's slope its digits' up ran along the road, and from abeam the picture sheared them
// over until a near bib read back to front. Now the digits' up is the world's up (they stand upright from every place)
// and the card is turned 32 degrees from square astern toward the open lane: nearly square on to the lens from astern
// in the next lane, and still facing it as it draws abeam. o.port: turned to port instead (a rider of the starboard
// file, which the lens passes on its port hand: by its lane, a place). It hides neither the tail nor a wing's end.
function bibInto(B, look, number, o = {}) {
  const sx = o.port ? 1 : -1, nrm = V(sx * 0.53, 0, -0.848), up = V(0, 1, 0), rt = V(nrm.z, 0, -nrm.x), c = V(0, 2.1, -1.55), hw = 0.46, hh = 0.32, part = o.part ?? 10;
  const P = (x, y, lift = 0) => c.clone().addScaledVector(rt, x).addScaledVector(up, y).addScaledVector(nrm, lift);
  plate(B, P(-hw, -hh), P(hw, -hh), P(hw, hh), P(-hw, hh), { col: look.col('pelican'), line: INK_W, part, two: true });
  const h = number >= 100 ? 0.36 : 0.42;                                // upright the card is seen square on: these stand as tall on the picture as 0.58 m did on the slope
  if (o.side) digits(B, number, P(0, 0, 0.03), up, rt.clone().negate(), h, { part, col: look.col('ink') });
  else digits(B, number, P(0, 0, 0.03), rt, up, h, { part, col: look.col('ink') });
}

// ---------------------------------------------------------------------------------------------
// THE HOPELESS: drawings that went wrong, each a CLASS of failure drawn our own way (design/ab/pelican-peloton.kinds-ruling.md),
// each bicycle ONE flat primary (the row's tint). Every kind is modelled inside its kindBox of the plan.
// ---------------------------------------------------------------------------------------------
// h1 TWO CIRCLES AND A TRIANGLE (always the first slider): a bicycle that is nothing but those shapes, and on it a bird
// made the same way: one white circle with a dot eye and one orange triangle, balanced on the top corner. No legs.
function twoCircles(B, look) {
  const hubs = [[0.85, -1.2], [0.85, 1.4]], apex = V(0, 2.2, 0.1), tintCol = { col: look.col('bikeRed'), tint: 1 };
  for (const h of hubs) ring(B, Pyz(0, h), 0.78, 0.07, { nR: 20, nr: 6, line: INK_W, ...tintCol });
  for (const [a, b] of [[Pyz(0, hubs[0]), apex], [apex, Pyz(0, hubs[1])], [Pyz(0, hubs[1]), Pyz(0, hubs[0])]]) tube(B, [a, b], 0.07, { nseg: 5, line: INK_W, ...tintCol });
  const wob = [0.05, 0.3, 0.0, 0.09], c = V(0, 3.02, 0.1);                 // it wobbles there, by the metres ridden
  ball(B, c, [0.8, 0.8, 0.8], { nseg: 20, nring: 10, col: look.col('pelican'), line: INK_W, part: 9, rig: wob });
  for (const sx of [-1, 1]) ball(B, V(sx * 0.6, 3.34, 0.52), [0.07, 0.07, 0.07], { nseg: 6, nring: 3, col: look.col('ink'), line: 0, part: 9, rig: wob });
  cone(B, V(0, 3.02, 0.82), V(0, 2.9, 1.72), 0.3, 0, { nseg: 10, col: look.col('bill'), line: INK_W, part: 9, rig: wob, cap0: false });
  // its back, made the same way: one arc for a wing on each flank of the circle, and one more triangle for a tail
  for (const sx of [-1, 1]) stroke(B, [[0.95, 0.42], [1.3, 0.2], [1.36, -0.1], [1.05, -0.38], [0.6, -0.46]].map(([az, el]) => V(sx * 0.83 * Math.sin(az) * Math.cos(el), 3.02 + 0.83 * Math.sin(el), 0.1 - 0.83 * Math.cos(az) * Math.cos(el))),
    INK_W * 0.5, { part: 9, rig: wob, col: look.col('ink'), detail: 0.2 });
  cone(B, V(0, 3.12, -0.6), V(0, 3.36, -1.22), 0.3, 0, { nseg: 6, flat: 0.3, side: X_AXIS, col: look.col('pelican'), line: INK_W, part: 9, rig: wob, cap0: false });
  return { rig: null };
}
// h2 THE HOVERER: ONE grey lump with a dot eye and a short orange wedge, bobbing 1.2 m over the saddle of a frame whose
// bars stop short of each joint; its bicycle keeps two whole wheels. No ball head, no legs.
function hoverer(B, look) {
  const G = BIKE, tintCol = { col: look.col('bikeRed'), tint: 1, nseg: 5, line: INK_W };
  wheel(B, look, G.rear, { lod: 'hi', spokes: 0 }); wheel(B, look, G.front, { lod: 'hi', spokes: 0 });
  const bb = Pyz(0, G.bb), sc = Pyz(0, [G.saddle[0] - 0.06, G.saddle[1] + 0.03]), ht = Pyz(0, G.headTop), hl = Pyz(0, G.headLow), top = Pyz(0, G.seat);
  for (const [a, b] of [[bb, sc], [top, ht], [bb, hl], [bb, Pyz(0, G.rear)], [top, Pyz(0, G.rear)], [hl, Pyz(0, G.front)], [ht, Pyz(0, G.stemTop)]]) {
    const d = b.clone().sub(a), l = d.length(), cut = Math.min(0.4, l * 0.28) / l;                       // every bar stops short of both its joints
    tube(B, [a.clone().addScaledVector(d, cut), b.clone().addScaledVector(d, -cut)], 0.065, tintCol);
  }
  tube(B, [V(-0.55, G.grip[1] + 0.12, G.grip[2] + 0.1), V(0.55, G.grip[1] + 0.12, G.grip[2] + 0.1)], 0.055, tintCol);
  ball(B, Pyz(0, G.saddle), [0.2, 0.52, 0.11], { nseg: 6, nring: 3, axis: Z_AXIS, col: look.col('saddle'), line: INK_W });
  // the lump is this file's part 26: it bobs as before and LOOKS ASIDE about its own upright (at z 0.1), always toward the
  // open lane: 39 degrees at rest, 49 in its glance, so that from astern an eye and the orange wedge show beside it. On
  // each flank a folded wing drawn in ink (its outline and one feather), and at its rear a tuft of three short feathers:
  // it is no bare disc from any side. Still ONE grey lump: no ball head, no legs.
  const hov = [0.16, 0.45, 0.1, 0.85], grey = look.col('greyBlob'), ink = look.col('ink'), mv = { part: 26, rig: hov }, T = trunkOf([3.75, -0.1], [0.74, 1.05, 0.8], [0.16, 0.987]);
  ball(B, V(0, 3.75, -0.1), [0.74, 1.05, 0.8], { nseg: 16, nring: 9, axis: V(0, 0.16, 0.987), col: grey, line: INK_W, ...mv });
  for (const sx of [-1, 1]) {
    ball(B, V(sx * 0.64, 4.15, 0.17), [0.1, 0.1, 0.1], { nseg: 6, nring: 3, col: ink, line: 0, ...mv });   // on its flank, so the turned lump shows one from astern
    const leaf = smooth([[0.42, 1.0], [0.05, 0.78], [-0.4, 0.72], [-0.8, 0.95], [-0.45, 1.5], [0.0, 1.72], [0.42, 1.0]].map(([t, th]) => ({ p: onTrunk(T, t, th, sx) })), 12).map((q) => q.p);
    stroke(B, leaf, INK_W * 0.5, { ...mv, col: ink, detail: 0.2 });
    stroke(B, [onTrunk(T, 0.05, 1.3, sx), onTrunk(T, -0.2, 1.12, sx), onTrunk(T, -0.5, 1.12, sx)], INK_W * 0.42, { ...mv, col: ink, detail: 0.3 });
  }
  cone(B, V(0, 3.98, 0.86), V(0, 3.86, 1.5), 0.2, 0, { nseg: 8, flat: 0.6, col: look.col('bill'), line: INK_W, cap0: false, ...mv });
  for (const [x, y, z] of [[0, 4.12, -1.3], [0.2, 3.95, -1.18], [-0.2, 3.95, -1.18]]) {
    const r0 = V(x * 0.3, 3.6, -0.9), r1 = V(x, y, z);
    loft(B, [{ p: r0, rx: 0.08, rz: 0.04 }, { p: r0.clone().lerp(r1, 0.6), rx: 0.14, rz: 0.035 }, { p: r1, rx: 1e-4, rz: 1e-4 }], 4, { col: grey, side: X_AXIS, line: INK_W, ...mv });
  }
  return { rig: null };
}
// THE BIRD OF THE FIRST TRIES, for the hopeless kinds that need a whole bird: a white egg tipped forward, a neck, a ball
// head with two dot eyes, a long straight orange bill with no pouch under it, a flat wing on each flank, a stub tail,
// two orange legs with webbed feet. It is drawn plainly so that what went wrong with it is the one thing read.
//   o: { rig (its legs' rig; default the bicycle's), xs, phases, lift (as legs()), bill (metres), wings (false: none),
//        noLegs, legR }
// Returns { rig, head: [y, z] }.
function firstBird(B, look, o = {}) {
  const { bill = 1.05, wings = true } = o, white = look.col('pelican'), ink = look.col('ink'), L = INK_W, nod = [3.9, 0.5, 0.05, o.turn ?? 1.5];   // its head's share of the glance: 52 degrees
  ball(B, V(0, 2.64, -0.28), [0.6, 0.98, 0.68], { nseg: 14, nring: 8, axis: V(0, 0.3, 0.954), col: white, line: L, part: 10 });
  backInto(B, look, trunkOf([2.64, -0.28], [0.6, 0.98, 0.68], [0.3, 0.954]), { tail: { root: [2.42, -1.08], tip: [2.84, -1.62], w: 0.3 }, prim: wings ? { root: [0.69, 2.6, -0.75], tip: [0.78, 2.05, -1.35], w: 0.13 } : null });
  tube(B, [V(0, 3.2, 0.3), V(0, 3.72, 0.52), V(0, 4.2, 0.46)], [0.27, 0.2, 0.19], { col: white, nseg: 6, line: L, part: 10, cap0: false, cap1: false });
  ball(B, V(0, 4.34, 0.46), [0.3, 0.3, 0.32], { nseg: 10, nring: 5, col: white, line: L, part: 11, rig: nod });
  for (const sx of [-1, 1]) ball(B, V(sx * 0.262, 4.42, 0.6), [0.06, 0.06, 0.06], { nseg: 5, nring: 2, col: ink, line: 0, part: 11, rig: nod });
  cone(B, V(0, 4.3, 0.7), V(0, 4.3 - 0.3 * bill, 0.7 + bill), 0.17, 0, { nseg: 6, flat: 0.75, side: X_AXIS, col: look.col('bill'), line: L, part: 11, rig: nod, cap0: false });
  if (wings) for (const sx of [-1, 1]) ball(B, V(sx * 0.67, 2.74, -0.32), [0.08, 0.62, 0.34], { nseg: 6, nring: 5, axis: V(0, 0.3, 0.954), side: X_AXIS, col: white, line: L, part: 10 });
  const rig = o.rig || RIG();
  if (!o.noLegs) legs(B, look, rig, o.xs || [-BIKE.pedalX - 0.02, BIKE.pedalX + 0.02], o.phases || [0, Math.PI], { lod: 'hi', ri: rigIndex(B, rig), lift: o.lift ?? 0.12, r: o.legR ?? 0.07 });
  return { rig, head: { top: [4.66, 0.46], part: 11, rig: nod }, neck: [3.6, 0.48], neckR: 0.22, back: [3.2, -0.95] };
}
// three short speed strokes in the air close behind a rider's head, neck and back, sliding fore and aft on the world's time
function speedStrokes(B, look, list) {
  list.forEach(([x, y, z, len], i) => stroke(B, [V(x, y, z), V(x, y, z - Math.min(len, STROKE_MAX))], INK_W * 0.4, { part: 12, rig: [i * 2.1, 0.06, 0, 0], col: look.col('ink'), detail: 0.2 }));
}
// A SPEED STROKE IS NEVER LONGER THAN 0.4 m (a tenth of its bird) and lies close behind the head, the neck or the back
// it trails: a long one a metre astern of a near rider stood on the picture as a dark bar in the sky beside a far sea bird
const STROKE_MAX = 0.4, HOP_STROKES = [[0.2, 4.28, -0.06, 0.36], [-0.2, 3.85, -0.3, 0.4], [0.08, 3.32, -1.0, 0.4]];

// h12 THE WHEEL AHEAD: a rider whose front wheel rolls along by itself a metre ahead of its fork. The whole of it, the
// loose wheel too, lies within 2.8 m either way of the box's middle (so the rider sits 0.6 m astern of it).
// The loose wheel also rolls half a metre to STARBOARD of its rider's line: the lens overtakes on the riders' starboard
// hand, and a wheel to port lies on the sight line behind its own rider's trunk (tried both: only this one is seen from astern).
const WHEEL_AHEAD_DZ = -0.6, WHEEL_AHEAD_DX = -0.5;
function wheelAhead(B, look) {
  const from = B.pos.length / 3, G = BIKE, dz = WHEEL_AHEAD_DZ;
  const at = pelican(B, look, { lod: 'mid', gen: 3, spokes: 6, bike: { lod: 'hi', frontWheel: false } });     // round wheels: it passes 4.4 m from the lens
  shiftZ(B, from, dz);
  const fw = B.pos.length / 3; wheel(B, look, [G.front[0], G.front[1] + dz + 1.0], { lod: 'hi', spokes: 6, off: 0.3 }); shiftX(B, fw, WHEEL_AHEAD_DX);
  const rig = { ...at.rig, hip: [at.rig.hip[0], at.rig.hip[1] + dz], crank: [at.rig.crank[0], at.rig.crank[1] + dz] }, ri = rigIndex(B, rig);
  for (let v = from; v < B.pos.length / 3; v++) { const part = B.k[v * 4 + 1]; if (part >= 4 && part <= 6) B.rig[v * 4 + 3] = ri; }
  return { ...at, rig };
}
// h13 THE BLANK CARD: where a drawing should be, a plain white outlined rectangle, 4 by 3, upright across the lane,
// gliding along on nothing. Never a square, no icon, no handles.
function blankCard(B, look) {
  const hov = [0.07, 0.3, 0.0, 0.0];
  plate(B, V(2.0, 0.42, 0), V(-2.0, 0.42, 0), V(-2.0, 3.42, 0), V(2.0, 3.42, 0), { col: look.col('pelican'), line: INK_W, two: true, part: 9, rig: hov });
  return { rig: null };
}
// h3 PEDALS IN THE AIR: the crank set (arms, pedals, a chainring in the frame's colour) turns in the air ahead of the bars,
// over the front wheel, joined to nothing; there is no chain; the feet pump the air at the bracket, where no pedal is.
// The whole of it lies within 2.8 m either way of the box's middle (so the rider sits 0.45 m astern of it).
const PEDALS_DZ = -0.45, PEDALS_AT = [2.72, 2.58];
function pedalsInAir(B, look) {
  const from = B.pos.length / 3, G = BIKE, dz = PEDALS_DZ, [cy, cz] = PEDALS_AT, crg = [cy, cz, 0, 1];
  bicycle(B, look, { lod: 'hi', spokes: 8, chain: false, crankAt: PEDALS_AT });
  ring(B, V(G.drive, cy, cz), 0.27, 0.07, { nR: 14, nr: 6, part: 2, rig: crg, line: INK_W, col: look.col('bikeRed'), tint: 1 });
  const rig = { ...RIG(), hip: [G.hip[0], G.hip[1] + dz], crank: [G.bb[0], G.bb[1] + dz] };
  const at = firstBird(B, look, { rig });
  shiftZ(B, from, dz);
  speedStrokes(B, look, HOP_STROKES.map(([x, y, z, l]) => [x, y, z + dz, l]));
  return { ...at, rig, dz };
}
// h5 BACKWARDS: a whole bird that faces astern and pedals while its bicycle goes forward (its knees bend astern, its
// bill points back down the road at whoever comes up behind).
function backwards(B, look) {
  const G = BIKE, zc = -0.4;
  bicycle(B, look, { lod: 'hi', spokes: 8 });
  const from = B.pos.length / 3, rig = { ...RIG(), hip: [G.hip[0], 2 * zc - G.hip[1]], back: true };
  firstBird(B, look, { rig, bill: 0.95 });
  turnAbout(B, from, zc);
  speedStrokes(B, look, [[0.34, 4.85, -0.75, 0.4], [-0.3, 4.72, -1.45, 0.4]]);
  return { rig };
}
// h6 ONE SIDE: both legs down the near side and both feet on the one pedal, one standing on the other; the bird hangs
// off to that hand; the far pedal goes round empty.
function oneSide(B, look) {
  bicycle(B, look, { lod: 'hi', spokes: 8 });
  const from = B.pos.length / 3, a = -0.2, y0 = 1.85, c = Math.cos(a), sn = Math.sin(a);
  const at = firstBird(B, look, { xs: [-BIKE.pedalX - 0.16, -BIKE.pedalX + 0.1], phases: [0, 0], lift: [0.12, 0.27], turn: 1 });   // it hangs off to starboard: its head turns the plain glance
  for (let v = from; v < B.pos.length / 3; v++) {                        // the lean, about the line of the saddle
    const part = B.k[v * 4 + 1]; if (part >= 4 && part <= 6) continue;
    const x = B.pos[v * 3], y = B.pos[v * 3 + 1] - y0, nx = B.nor[v * 3], ny = B.nor[v * 3 + 1];
    B.pos[v * 3] = x * c + y * sn; B.pos[v * 3 + 1] = y0 - x * sn + y * c; B.nor[v * 3] = nx * c + ny * sn; B.nor[v * 3 + 1] = -nx * sn + ny * c;
  }
  speedStrokes(B, look, HOP_STROKES.map(([x, y, z, l]) => [x - 0.35, y, z, l]));
  return at;
}
// h7 THE DRIFTER: the bird leaves the saddle whole, still pedalling the air, and its bicycle rolls on with the pedals
// turning. Every part of the bird is of the rider's LOOSE body (the pack law carries it by the plan's drifterLift).
function drifter(B, look) {
  bicycle(B, look, { lod: 'hi', spokes: 8 });
  const from = B.pos.length / 3, at = firstBird(B, look, {});
  loosen(B, from);
  return at;
}
// h8 THE FIVE-WHEELER (always the second slider): five wheels of five sizes in a row under one long frame, each in its
// own fork; the cranks turn on the middle wheel's hub and the bird pedals them. Never four, never in pieces.
function fiveWheeler(B, look) {
  const G = BIKE, fr = { col: look.col('bikeRed'), tint: 1, nseg: 5, line: INK_W }, steel = look.col('rim'), yb = 1.6;
  const W = [[0.47, -1.83], [0.27, -1.04], [0.52, -0.2], [0.38, 0.75], [0.66, 1.84]];   // [radius, hub z], from the back
  tube(B, [V(0, yb, -1.95), V(0, yb, 1.95)], 0.075, fr);                 // the one long bar
  W.forEach(([R, z], i) => {
    wheel(B, look, [R, z], { lod: 'mid', spokes: i % 2 ? 4 : 6, R, off: i * 0.4 });
    for (const sx of [-1, 1]) tube(B, [V(sx * 0.03, yb, z), V(sx * 0.12, R, z)], 0.04, { ...fr, nseg: 4, cap0: false });
  });
  tube(B, [V(0, yb, -0.62), V(0, G.saddle[0] - 0.06, G.saddle[1] + 0.03)], 0.06, { ...fr, cap0: false, cap1: false });
  ball(B, Pyz(0, G.saddle), [0.2, 0.52, 0.11], { nseg: 6, nring: 3, axis: Z_AXIS, col: look.col('saddle'), line: INK_W });
  tube(B, [V(0, yb, 1.1), Pyz(0, G.stemTop)], 0.05, { ...fr, cap0: false });
  tube(B, [V(-G.grip[0], G.grip[1], G.grip[2]), V(-G.grip[0] + 0.14, G.stemTop[0], G.stemTop[1] - 0.03), V(G.grip[0] - 0.14, G.stemTop[0], G.stemTop[1] - 0.03), V(G.grip[0], G.grip[1], G.grip[2])], 0.05, { col: steel, nseg: 4, line: INK_W });
  const ck = [W[2][0], W[2][1]], ink = look.col('ink'), arm = 0.4;      // the cranks, on the middle wheel's hub
  for (const sx of [-1, 1]) {
    const ph = sx < 0 ? 0 : Math.PI, ax = sx * 0.22;
    stroke(B, [V(ax, ck[0], ck[1]), V(ax, ck[0] + arm, ck[1])], 0.045, { part: 2, rig: [ck[0], ck[1], ph, 1], nseg: 4, col: ink });
    box(B, V(sx * G.pedalX - 0.13, ck[0] + arm - 0.04, ck[1] - 0.15), V(sx * G.pedalX + 0.13, ck[0] + arm + 0.04, ck[1] + 0.15), { col: ink, line: 0, part: 3, rig: [ck[0], ck[1], ph, arm] });
  }
  const rig = { hip: G.hip, thigh: 1.0, shin: 1.12, crank: ck, arm };
  return firstBird(B, look, { rig });
}
// h9 SQUARE WHEELS (always the third slider): two square wheels that tumble corner over corner while the bicycle rides
// up and down on them (the pack law's glitch 6). The frame sits lower, on hubs half a side above the road.
function squareWheels(B, look) {
  const G = BIKE, from = B.pos.length / 3, a = SQ.A, dy = a - G.R, ink = look.col('tyre');
  bicycle(B, look, { lod: 'hi', wheels: false, chain: false });
  const rig = { ...RIG(), hip: [G.hip[0] + dy, G.hip[1]], crank: [G.bb[0] + dy, G.bb[1]] };
  const at = firstBird(B, look, { rig });
  shiftZ(B, from, 0, dy);
  [[SQ.ZR, 0], [SQ.ZF, SQ.PH]].forEach(([z, ph]) => {
    const rg = [a, z, 0, ph], e = a - 0.055, c = (sy, sz) => V(0, a + sy * e, z + sz * e), o = { part: 24, rig: rg, col: ink, nseg: 4 };
    for (const [p0, p1] of [[c(-1, -1.06), c(-1, 1.06)], [c(1, -1.06), c(1, 1.06)], [c(-1.06, -1), c(1.06, -1)], [c(-1.06, 1), c(1.06, 1)]]) stroke(B, [p0, p1], 0.055, o);
    stroke(B, [c(-1, -1), c(1, 1)], 0.02, o); stroke(B, [c(-1, 1), c(1, -1)], 0.02, o);
  });
  return { ...at, rig };
}
// h10 THREE WINGS: a part too many. A wing on each flank and a third standing on its back, the three beating in turn.
function threeWings(B, look) {
  bicycle(B, look, { lod: 'hi', spokes: 8 });
  const at = firstBird(B, look, { wings: false }), white = look.col('pelican');
  [[0.55, 2.95, 1.047, 0], [-0.55, 2.95, 2.094, 2.094], [0.001, 3.42, 1.571, 4.189]].forEach(([hx, hy, rest, ph], i) => {
    const len = i === 2 ? 0.82 : 0.62, ax = V(Math.cos(rest), Math.sin(rest), 0), c = V(hx, hy, -0.3).addScaledVector(ax, len * 0.5);
    ball(B, c, [0.3, len * 0.5, 0.07], { nseg: 8, nring: 5, axis: ax, side: Z_AXIS, col: white, line: INK_W, part: 25, rig: [hx, hy, i === 2 ? 0.5 : 0.42, ph] });
  });
  speedStrokes(B, look, [[0.34, 4.25, -0.06, 0.38], [-0.3, 3.3, -1.1, 0.4]]);
  return at;
}
// h11 THE BIG BIRD: a tall gawky grown pelican (long neck, long bill, its pouch) on a bicycle half the size it needs:
// it sits far back over the rear wheel with its knees up before its breast. White; never round or compact.
function bigBird(B, look) {
  const k = 0.55, from = B.pos.length / 3, white = look.col('pelican'), ink = look.col('ink'), L = INK_W, G = BIKE;
  bicycle(B, look, { lod: 'hi', spokes: 8, bars: false });
  scaleBike(B, from, k);
  const ht = V(0, G.headTop[0] * k, G.headTop[1] * k), st = V(0, 1.62, 0.5);   // a short stem and a narrow bar: the shins pass outside it
  tube(B, [ht, st], 0.04, { col: look.col('rim'), nseg: 4, line: L, cap0: false });
  tube(B, [V(-0.14, st.y, st.z), V(0.14, st.y, st.z)], 0.045, { col: look.col('rim'), nseg: 4, line: L });
  ball(B, V(0, 2.06, -0.52), [0.6, 1.14, 0.7], { nseg: 14, nring: 8, axis: V(0, 0.9, 0.436), col: white, line: L, part: 10 });
  backInto(B, look, trunkOf([2.06, -0.52], [0.6, 1.14, 0.7], [0.9, 0.436]), { arc: [0.45, 0.95, -0.6, 0.2], tail: { root: [1.6, -1.05], tip: [1.92, -1.6], w: 0.32 }, prim: { root: [0.68, 1.75, -0.85], tip: [0.76, 1.2, -1.3], w: 0.13 } });
  const nk = smooth([[2.85, -0.12, 0.3], [3.6, 0.16, 0.22], [4.5, 0.02, 0.19], [5.3, 0.24, 0.18]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 6);
  tube(B, nk.map((q) => q.p), nk.map((q) => q.r), { col: white, nseg: 6, line: L, part: 10, cap0: false, cap1: false });
  const nod = [5.1, 0.3, 0.05, 0], hp = { part: 11, rig: nod };
  ball(B, V(0, 5.44, 0.3), [0.3, 0.34, 0.31], { nseg: 10, nring: 5, axis: Z_AXIS, col: white, line: L, ...hp });
  for (const sx of [-1, 1]) ball(B, V(sx * 0.262, 5.52, 0.43), [0.06, 0.06, 0.06], { nseg: 5, nring: 2, col: ink, line: 0, ...hp });
  const b0 = V(0, 5.42, 0.54), bd = V(0, -0.9, 1.72), dn = V(0, -bd.z, bd.y).normalize(), at = (f, sag = 0) => b0.clone().addScaledVector(bd, f).addScaledVector(dn, sag);
  loft(B, [{ p: at(0), rx: 0.19, rz: 0.13 }, { p: at(0.92), rx: 0.085, rz: 0.065 }, { p: at(1, 0.07), rx: 1e-4, rz: 1e-4 }], 5, { col: look.col('bill'), side: X_AXIS, line: L, ...hp });
  loft(B, [...[[0.0, 0.16, 0.15, 0.13, 0], [0.3, 0.38, 0.2, 0.3, 1], [0.7, 0.26, 0.13, 0.18, 0.6]].map(([f, sag, rx, rz, w]) => ({ p: at(f, sag), rx, rz, rig: [w, nod[0], nod[1], nod[2]] })), { p: at(0.99, 0.05), rx: 1e-4, rz: 1e-4, rig: [0, nod[0], nod[1], nod[2]] }],
    5, { col: look.col('pouch'), side: X_AXIS, line: L, part: 7 });
  for (const sx of [-1, 1]) ball(B, V(sx * 0.66, 2.2, -0.62), [0.08, 0.74, 0.36], { nseg: 6, nring: 5, axis: V(0, 0.9, 0.436), side: X_AXIS, col: white, line: L, part: 10 });
  const rig = { hip: [1.25, -0.72], thigh: 1.6, shin: 1.66, crank: [G.bb[0] * k, 0], arm: G.arm * k };
  legs(B, look, rig, [-0.3, 0.3], [0, Math.PI], { lod: 'hi', ri: rigIndex(B, rig), lift: 0.1, r: 0.075, fk: 0.8 });
  speedStrokes(B, look, [[0.3, 5.38, -0.2, 0.38], [-0.28, 4.4, -0.45, 0.4], [0.1, 3.2, -1.25, 0.4]]);
  return { rig };
}
// h14 SUN SPOKES: wheels whose spokes stick out a hand beyond the rim all round, so that it rides on their tips.
function sunSpokes(B, look) {
  const G = BIKE, from = B.pos.length / 3, R = 0.68, out = 0.26, dy = R + out - G.R, ink = look.col('ink');
  bicycle(B, look, { lod: 'hi', wheels: false });
  const rig = { ...RIG(), hip: [G.hip[0] + dy, G.hip[1]], crank: [G.bb[0] + dy, G.bb[1]] };
  const at = firstBird(B, look, { rig });
  speedStrokes(B, look, HOP_STROKES);
  shiftZ(B, from, 0, dy);
  for (const [hz, off] of [[G.rear[1], 0], [G.front[1], 0.3]]) {
    const hy = R + out, rg = [hy, hz, R + out, 1];
    ring(B, V(0, hy, hz), R - 0.045, 0.045, { nR: 20, nr: 3, part: 1, rig: rg, col: look.col('tyre'), line: -0.045, far: true });
    for (let i = 0; i < 10; i++) { const a = i * 0.6283 + off; stroke(B, [V(0, hy, hz), V(0, hy + Math.cos(a) * (R + out - 0.03), hz + Math.sin(a) * (R + out - 0.03))], 0.028, { part: 1, rig: rg, col: ink }); }
  }
  return { ...at, rig };
}

// ---------------------------------------------------------------------------------------------
// THE GUESTS: the other animals kept to catch cheats, as the kinds ruling re-pairs them (none is a pair of the one maker's
// film): our own drawings of six public ideas, bare (no gear of any kind), each with its own small motion, each inside
// the guests' box (2.5 m wide, 5.2 m long, 6.6 m tall). The vehicle is the row's one flat primary.
// ---------------------------------------------------------------------------------------------
const GP = { pink: '#FF8FB1', pinkDeep: '#F0608F', bare: '#F2A6A0', face: '#F4F1EA', frog: '#4CB648', frogPale: '#BFE38A', shell: '#2F8F57',
  shellRim: '#C9E08A', skin: '#7BC96A', giraffe: '#F4C534', patch: '#A8622D', beak: '#F2C48D' };
const shiftX = (B, from, dx) => { for (let v = from; v < B.pos.length / 3; v++) B.pos[v * 3] += dx; };
const eyes = (B, look, y, z, x, r, o) => { for (const sx of [-1, 1]) ball(B, V(sx * x, y, z), [r, r, r], { nseg: 5, nring: 2, col: look.col('ink'), line: 0, ...o }); };
// FLAMINGO ON A UNICYCLE: a pink body, an S neck, a bent bill with a black tip; one long leg pedals the one wheel (its
// joint bends astern, as the bird's does) and the other is folded up under it. Spokes end at the rim.
function flamingo(B, look) {
  const pink = look.col(GP.pink), deep = look.col(GP.pinkDeep), ink = look.col('ink'), L = INK_W, hub = [0.85, 0], arm = 0.36;
  const fr = { col: look.col('bikeRed'), tint: 1, nseg: 5, line: L };
  wheel(B, look, hub, { lod: 'hi', spokes: 8 });
  for (const sx of [-1, 1]) {
    tube(B, [V(sx * 0.14, hub[0], 0), V(sx * 0.14, 1.72, 0), V(0, 1.95, 0)], 0.05, { ...fr, cap1: false });   // the fork's two blades
    const ph = sx < 0 ? 0 : Math.PI;
    stroke(B, [V(sx * 0.24, hub[0], 0), V(sx * 0.24, hub[0] + arm, 0)], 0.045, { part: 2, rig: [hub[0], 0, ph, 1], nseg: 4, col: ink });
    box(B, V(sx * 0.36 - 0.12, hub[0] + arm - 0.04, -0.15), V(sx * 0.36 + 0.12, hub[0] + arm + 0.04, 0.15), { col: ink, line: 0, part: 3, rig: [hub[0], 0, ph, arm] });
  }
  tube(B, [V(0, 1.9, 0), V(0, 2.42, -0.04)], 0.06, { ...fr, cap0: false, cap1: false });
  ball(B, V(0, 2.46, -0.06), [0.2, 0.42, 0.1], { nseg: 6, nring: 3, axis: Z_AXIS, col: look.col('saddle'), line: L });
  ball(B, V(0, 3.16, -0.12), [0.46, 0.84, 0.52], { nseg: 14, nring: 8, axis: V(0, 0.22, 0.975), col: pink, line: L, part: 10 });
  for (const sx of [-1, 1]) ball(B, V(sx * 0.44, 3.22, -0.34), [0.05, 0.52, 0.24], { nseg: 6, nring: 5, axis: V(0, 0.22, 0.975), side: X_AXIS, col: deep, line: L, part: 10 });
  loft(B, [{ p: V(0, 3.02, -0.9), rx: 0.2, rz: 0.14 }, { p: V(0, 3.1, -1.3), rx: 1e-4, rz: 1e-4 }], 4, { col: ink, side: X_AXIS, line: 0, part: 10 });   // black flight feathers
  const sway = [3.5, 0.02, 0.07, 0], nk = smooth([[3.5, 0.5, 0.15], [4.15, 1.0, 0.12], [4.75, 0.74, 0.11], [5.1, 0.42, 0.105], [5.42, 0.62, 0.105]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 9);
  tube(B, nk.map((q) => q.p), nk.map((q) => q.r), { col: pink, nseg: 6, line: L, part: 23, rig: sway, cap0: false, cap1: false });
  ball(B, V(0, 5.46, 0.72), [0.19, 0.24, 0.2], { nseg: 9, nring: 5, axis: Z_AXIS, col: pink, line: L, part: 23, rig: sway });
  eyes(B, look, 5.5, 0.8, 0.165, 0.045, { part: 23, rig: sway });
  cone(B, V(0, 5.44, 0.92), V(0, 5.24, 1.3), 0.11, 0.09, { nseg: 6, col: look.col(GP.face), line: L, part: 23, rig: sway, cap0: false, cap1: false });
  cone(B, V(0, 5.24, 1.3), V(0, 4.98, 1.36), 0.09, 0, { nseg: 6, col: ink, line: L, part: 23, rig: sway, cap0: false });
  const rig = { hip: [2.72, -0.05], thigh: 1.1, shin: 1.2, crank: hub, arm, back: true }, lc = look.col(GP.pinkDeep);
  legs(B, look, rig, [-0.36], [0], { lod: 'hi', ri: rigIndex(B, rig), lift: 0.1, r: 0.045, col: lc, fk: 0.7 });
  tube(B, [V(0.3, 2.72, -0.05), V(0.3, 2.2, -0.75), V(0.3, 2.62, 0.05)], 0.045, { col: lc, nseg: 4, line: L });   // the folded leg
  return { rig };
}
// OPOSSUM ON A PLAIN KICK SCOOTER (no motor, no lamp): a grey body upright on a two-wheeled plank with a stalk and a bar,
// a long white face with a pink nose, round dark ears, eyes fast; one foot on the plank and the other kicking; its bare
// tail only trails.
function opossum(B, look) {
  const grey = look.col('greyBlob'), face = look.col(GP.face), bare = look.col(GP.bare), ink = look.col('ink'), L = INK_W;
  const fr = { col: look.col('bikeRed'), tint: 1, nseg: 5, line: L }, steel = look.col('rim'), nod = [2.6, 0.3, 0.04, 0], hp = { part: 11, rig: nod };
  wheel(B, look, [0.3, -1.55], { lod: 'mid', spokes: 4, R: 0.3 }); wheel(B, look, [0.3, 1.5], { lod: 'mid', spokes: 4, R: 0.3, off: 0.5 });
  box(B, V(-0.28, 0.4, -1.3), V(0.28, 0.5, 0.95), { col: fr.col, tint: 1, line: L });                       // the plank
  for (const sx of [-1, 1]) { tube(B, [V(sx * 0.1, 0.3, -1.55), V(sx * 0.1, 0.45, -1.25)], 0.04, { ...fr, nseg: 4 }); tube(B, [V(sx * 0.1, 0.3, 1.5), V(sx * 0.06, 0.95, 1.32)], 0.04, { ...fr, nseg: 4, cap1: false }); }
  tube(B, [V(0, 0.45, 0.95), V(0, 0.95, 1.32), V(0, 2.5, 1.08)], 0.055, fr);                                // the neck and the stalk
  tube(B, [V(-0.52, 2.52, 1.08), V(0.52, 2.52, 1.08)], 0.05, { col: steel, nseg: 4, line: L });             // the bar
  ball(B, V(0, 1.72, -0.02), [0.5, 0.92, 0.56], { nseg: 14, nring: 8, axis: V(0, 0.93, 0.36), col: grey, line: L, part: 10 });
  ball(B, V(0, 1.62, 0.3), [0.3, 0.6, 0.2], { nseg: 8, nring: 5, axis: V(0, 0.93, 0.36), col: face, line: 0, part: 10 });   // the pale front
  ball(B, V(0, 2.86, 0.42), [0.36, 0.34, 0.4], { nseg: 10, nring: 6, col: face, line: L, ...hp });
  cone(B, V(0, 2.82, 0.7), V(0, 2.7, 1.42), 0.22, 0.05, { nseg: 8, col: face, line: L, cap0: false, cap1: false, ...hp });
  ball(B, V(0, 2.7, 1.44), [0.075, 0.075, 0.075], { nseg: 6, nring: 3, col: bare, line: L, ...hp });        // the nose
  eyes(B, look, 2.98, 0.7, 0.27, 0.06, hp);
  for (const sx of [-1, 1]) ball(B, V(sx * 0.3, 3.2, 0.3), [0.17, 0.19, 0.05], { nseg: 8, nring: 3, col: ink, line: 0, ...hp });   // the ears
  for (const sx of [-1, 1]) {                                                                              // arms to the bar
    tube(B, [V(sx * 0.4, 2.3, 0.2), V(sx * 0.5, 2.2, 0.7), V(sx * 0.44, 2.5, 1.04)], [0.1, 0.085, 0.07], { col: grey, nseg: 5, line: L });
    ball(B, V(sx * 0.44, 2.54, 1.08), [0.09, 0.09, 0.1], { nseg: 5, nring: 3, col: bare, line: L });
  }
  tube(B, [V(0.2, 1.1, -0.1), V(0.2, 0.62, -0.02)], [0.13, 0.1], { col: grey, nseg: 5, line: L, cap0: false });   // the standing leg and its foot
  loft(B, [{ p: V(0.2, 0.56, -0.2), rx: 0.1, rz: 0.06 }, { p: V(0.2, 0.55, 0.3), rx: 0.11, rz: 0.05 }, { p: V(0.2, 0.55, 0.4), rx: 1e-4, rz: 1e-4 }], 4, { col: bare, side: X_AXIS, line: L });
  const kick = [1.15, -0.12, 0.55, 0], kp = { part: 21, rig: kick };                                       // the kicking leg, swung from the hip
  tube(B, [V(-0.44, 1.15, -0.12), V(-0.44, 0.22, -0.14)], [0.13, 0.09], { col: grey, nseg: 5, line: L, cap0: false, ...kp });
  loft(B, [{ p: V(-0.44, 0.13, -0.3), rx: 0.1, rz: 0.06 }, { p: V(-0.44, 0.12, 0.2), rx: 0.11, rz: 0.05 }, { p: V(-0.44, 0.12, 0.3), rx: 1e-4, rz: 1e-4 }], 4, { col: bare, side: X_AXIS, line: L, ...kp });
  const tl = smooth([[1.0, -0.5, 0.1], [0.72, -1.1, 0.075], [0.86, -1.7, 0.055], [1.2, -2.2, 0.03]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 6);
  tube(B, tl.map((q) => q.p), tl.map((q) => q.r), { col: bare, nseg: 5, line: L, cap0: false });           // the tail
  return { rig: null };
}
// FROG ON ROLLER SKATES: a green frog, round eyes on top, striding on two skates in the row's flat primary (never red),
// its arms swinging the other way.
function frog(B, look) {
  const green = look.col(GP.frog), pale = look.col(GP.frogPale), ink = look.col('ink'), L = INK_W, tint = { col: look.col('bikeTeal'), tint: 1 };
  ball(B, V(0, 2.1, 0.06), [0.64, 0.86, 0.6], { nseg: 14, nring: 8, axis: V(0, 0.95, 0.31), col: green, line: L });
  ball(B, V(0, 2.0, 0.42), [0.42, 0.58, 0.2], { nseg: 8, nring: 5, axis: V(0, 0.95, 0.31), col: pale, line: 0 });      // the pale belly
  const nod = [2.7, 0.3, 0.04, 0], hp = { part: 11, rig: nod };
  ball(B, V(0, 3.06, 0.4), [0.68, 0.4, 0.56], { nseg: 14, nring: 6, col: green, line: L, ...hp });
  for (const sx of [-1, 1]) {
    ball(B, V(sx * 0.36, 3.46, 0.44), [0.21, 0.21, 0.21], { nseg: 8, nring: 5, col: look.col('pelican'), line: L, ...hp });
    ball(B, V(sx * 0.38, 3.5, 0.62), [0.08, 0.09, 0.05], { nseg: 5, nring: 3, col: ink, line: 0, ...hp });
  }
  stroke(B, [V(-0.5, 2.98, 0.76), V(-0.2, 2.9, 0.94), V(0.2, 2.9, 0.94), V(0.5, 2.98, 0.76)], L * 0.5, { col: ink, detail: 0.3, ...hp });   // the mouth
  for (const [sx, ph] of [[-1, 0], [1, Math.PI]]) {
    const leg = { part: 21, rig: [1.5, 0, 0.42, ph] }, x = sx * 0.4;
    tube(B, [V(x, 1.5, 0), V(x, 0.98, 0.26), V(x, 0.5, 0)], [0.17, 0.13, 0.1], { col: green, nseg: 5, line: L, cap0: false, cap1: false, ...leg });
    box(B, V(x - 0.17, 0.2, -0.32), V(x + 0.17, 0.5, 0.42), { ...tint, line: L, ...leg });                             // the boot, and its four wheels
    for (const [dx, dz] of [[-0.19, -0.2], [0.19, -0.2], [-0.19, 0.3], [0.19, 0.3]]) ball(B, V(x + dx, 0.1, dz), [0.1, 0.035, 0.1], { nseg: 8, nring: 2, axis: X_AXIS, side: Y_AXIS, col: ink, line: 0, ...leg });
    const arm = { part: 21, rig: [2.5, 0.1, 0.5, ph + Math.PI] }, ax = sx * 0.72;
    tube(B, [V(ax, 2.5, 0.1), V(ax + sx * 0.08, 1.95, 0.3), V(ax + sx * 0.04, 1.5, 0.52)], [0.11, 0.09, 0.08], { col: green, nseg: 5, line: L, cap0: false, ...arm });
    ball(B, V(ax + sx * 0.04, 1.44, 0.56), [0.12, 0.12, 0.13], { nseg: 6, nring: 3, col: green, line: L, ...arm });
  }
  return { rig: null };
}
// TURTLE ON A PENNY-FARTHING (teal or yellow): a great wheel with a small one behind; on top a green shell with a paler
// rim, two long thin legs that reach the pedals, and a head on a short neck that goes in and out.
function turtle(B, look) {
  const shell = look.col(GP.shell), rim = look.col(GP.shellRim), skin = look.col(GP.skin), ink = look.col('ink'), L = INK_W;
  const fr = { col: look.col('bikeTeal'), tint: 1, nseg: 5, line: L }, hub = [1.7, 0.45], arm = 0.32, small = [0.42, -1.85];
  wheel(B, look, hub, { lod: 'hi', spokes: 12, R: 1.7 }); wheel(B, look, small, { lod: 'mid', spokes: 4, R: 0.42 });
  for (const sx of [-1, 1]) {
    tube(B, [V(sx * 0.14, hub[0], hub[1]), V(sx * 0.14, 3.42, 0.36), V(0, 3.62, 0.34)], 0.05, { ...fr, cap1: false });
    tube(B, [V(sx * 0.1, small[0], small[1]), V(0, 1.0, -1.74)], 0.04, { ...fr, nseg: 4, cap1: false });
    const ph = sx < 0 ? 0 : Math.PI;
    stroke(B, [V(sx * 0.24, hub[0], hub[1]), V(sx * 0.24, hub[0] + arm, hub[1])], 0.045, { part: 2, rig: [hub[0], hub[1], ph, 1], nseg: 4, col: ink });
    box(B, V(sx * 0.36 - 0.12, hub[0] + arm - 0.04, hub[1] - 0.15), V(sx * 0.36 + 0.12, hub[0] + arm + 0.04, hub[1] + 0.15), { col: ink, line: 0, part: 3, rig: [hub[0], hub[1], ph, arm] });
  }
  const bk = smooth([[3.6, 0.34], [3.42, -0.5], [2.5, -1.34], [1.0, -1.74]].map(([y, z]) => ({ p: V(0, y, z), r: 0.07 })), 7);
  tube(B, bk.map((q) => q.p), 0.07, fr);                                                                   // the backbone
  tube(B, [V(0, 3.6, 0.34), V(0, 3.82, 0.46)], 0.045, { col: look.col('rim'), nseg: 4, line: L, cap0: false });
  tube(B, [V(-0.5, 3.84, 0.46), V(0.5, 3.84, 0.46)], 0.045, { col: look.col('rim'), nseg: 4, line: L });
  ball(B, V(0, 3.62, -0.2), [0.18, 0.4, 0.09], { nseg: 6, nring: 3, axis: Z_AXIS, col: look.col('saddle'), line: L });
  ball(B, V(0, 3.88, -0.25), [0.74, 0.13, 0.88], { nseg: 14, nring: 4, col: rim, line: L });                // the shell's rim, and the dome on it
  const dome = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; dome.push({ p: V(0, 3.9 + 0.5 * Math.sin(a), -0.25), rx: Math.max(0.64 * Math.cos(a), 1e-4), rz: Math.max(0.78 * Math.cos(a), 1e-4) }); }
  loft(B, dome, 14, { col: shell, axis: Y_AXIS, side: X_AXIS, line: L });
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.3, c = Math.cos(a), sn = Math.sin(a); stroke(B, [V(0.3 * c, 4.37, -0.25 + 0.36 * sn), V(0.56 * c, 4.14, -0.25 + 0.68 * sn)], L * 0.45, { col: ink, detail: 0.3 }); }
  const head = { part: 22, rig: [-0.2, -0.62, 1 / 30, 0] };                                                // out and back: into the shell's front
  tube(B, [V(0, 4.0, 0.42), V(0, 4.2, 0.9)], [0.15, 0.13], { col: skin, nseg: 6, line: L, cap0: false, cap1: false, ...head });
  ball(B, V(0, 4.26, 1.02), [0.22, 0.2, 0.27], { nseg: 9, nring: 5, col: skin, line: L, ...head });
  eyes(B, look, 4.34, 1.14, 0.19, 0.05, head);
  for (const sx of [-1, 1]) tube(B, [V(sx * 0.52, 3.94, 0.3), V(sx * 0.5, 3.86, 0.46)], 0.1, { col: skin, nseg: 5, line: L, cap0: false });   // the fore feet on the bar
  loft(B, [{ p: V(0, 3.92, -1.08), rx: 0.1, rz: 0.06 }, { p: V(0, 3.86, -1.36), rx: 1e-4, rz: 1e-4 }], 4, { col: skin, side: X_AXIS, line: L });
  const rig = { hip: [3.86, -0.2], thigh: 1.28, shin: 1.36, crank: hub, arm };
  legs(B, look, rig, [-0.38, 0.38], [0, Math.PI], { lod: 'hi', ri: rigIndex(B, rig), lift: 0.1, r: 0.06, col: skin, fk: 0.75 });
  return { rig };
}
// OSTRICH IN A TINY CAR (teal or yellow): a small open car on four wheels, the black bird sitting in it with its white
// wing and tail plumes, its long bare neck up through the top, swaying.
function ostrich(B, look) {
  const ink = look.col('ink'), white = look.col('pelican'), neck = look.col(GP.bare), L = INK_W, tint = { col: look.col('bikeTeal'), tint: 1 };
  loft(B, [{ p: V(0, 0.76, -2.2), rx: 1e-4, rz: 1e-4 }, { p: V(0, 0.8, -2.05), rx: 0.7, rz: 0.36 }, { p: V(0, 0.84, -0.6), rx: 0.84, rz: 0.46 }, { p: V(0, 0.8, 1.1), rx: 0.82, rz: 0.42 },
    { p: V(0, 0.72, 2.05), rx: 0.66, rz: 0.3 }, { p: V(0, 0.7, 2.2), rx: 1e-4, rz: 1e-4 }], 12, { ...tint, side: X_AXIS, axis: Z_AXIS, line: L });
  for (const z of [-1.3, 1.25]) for (const sx of [-1, 1]) { const f = B.pos.length / 3; wheel(B, look, [0.42, z], { lod: 'mid', spokes: 4, R: 0.42, off: z }); shiftX(B, f, sx * 0.97); }
  ball(B, V(0, 1.27, -0.5), [0.62, 0.05, 0.8], { nseg: 12, nring: 2, col: ink, line: 0 });                  // the open top
  for (const sx of [-1, 1]) ball(B, V(sx * 0.5, 0.86, 2.06), [0.12, 0.12, 0.08], { nseg: 6, nring: 3, col: white, line: L });   // the car's two round lamps
  ball(B, V(0, 1.86, -0.5), [0.58, 0.62, 0.78], { nseg: 14, nring: 8, col: ink, line: L, part: 10 });
  for (const sx of [-1, 1]) ball(B, V(sx * 0.6, 1.7, -0.5), [0.09, 0.2, 0.5], { nseg: 6, nring: 5, col: white, line: L, part: 10 });   // a wing's plumes, low on each flank
  for (const [y, x] of [[2.5, 0], [2.1, 0.3], [2.1, -0.3], [1.72, 0]]) tube(B, [V(x * 0.3, 2.12, -1.12), V(x, y, -1.8)], [0.07, 0.17], { col: white, nseg: 5, line: L, part: 10, cap0: false });   // the tail's plumes, fanned
  const sway = [2.3, 0.015, 0.08, 0], sp = { part: 23, rig: sway };
  const nk = smooth([[2.2, -0.1, 0.2], [3.2, 0.2, 0.14], [4.3, 0.05, 0.12], [5.4, 0.3, 0.11]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 8);
  tube(B, nk.map((q) => q.p), nk.map((q) => q.r), { col: neck, nseg: 6, line: L, cap0: false, cap1: false, ...sp });
  ball(B, V(0, 5.56, 0.4), [0.24, 0.22, 0.3], { nseg: 9, nring: 5, col: neck, line: L, ...sp });
  for (const sx of [-1, 1]) { ball(B, V(sx * 0.2, 5.66, 0.5), [0.1, 0.1, 0.1], { nseg: 6, nring: 4, col: white, line: L, ...sp }); ball(B, V(sx * 0.27, 5.67, 0.56), [0.04, 0.045, 0.045], { nseg: 5, nring: 2, col: ink, line: 0, ...sp }); }
  loft(B, [{ p: V(0, 5.5, 0.62), rx: 0.17, rz: 0.08 }, { p: V(0, 5.44, 1.1), rx: 0.11, rz: 0.04 }, { p: V(0, 5.43, 1.2), rx: 1e-4, rz: 1e-4 }], 6, { col: look.col(GP.beak), side: X_AXIS, line: L, ...sp });
  return { rig: null };
}
// GIRAFFE ON A SKATEBOARD: a small yellow giraffe with brown patches standing four-square on a long board, its neck
// swaying to either hand, its tail switching. The board never flips.
function giraffe(B, look) {
  const yel = look.col(GP.giraffe), brown = look.col(GP.patch), ink = look.col('ink'), L = INK_W;
  box(B, V(-0.42, 0.4, -2.2), V(0.42, 0.5, 2.2), { col: look.col('bikeRed'), tint: 1, line: L });           // the board and its four wheels
  for (const z of [-1.5, 1.5]) for (const sx of [-1, 1]) { const f = B.pos.length / 3; wheel(B, look, [0.19, z], { lod: 'mid', spokes: 0, R: 0.19 }); shiftX(B, f, sx * 0.4); ball(B, V(sx * 0.4, 0.19, z), [0.06, 0.07, 0.07], { nseg: 5, nring: 2, col: look.col('rim'), line: 0, part: 1, rig: [0.19, z, 0.19, 1] }); }
  ball(B, V(0, 2.5, -0.1), [0.5, 1.05, 0.62], { nseg: 14, nring: 8, axis: Z_AXIS, side: X_AXIS, col: yel, line: L });
  for (const z of [-0.85, 0.6]) for (const sx of [-1, 1]) {
    tube(B, [V(sx * 0.3, 2.2, z), V(sx * 0.3, 0.62, z)], [0.14, 0.085], { col: yel, nseg: 5, line: L, cap0: false, cap1: false });
    cone(B, V(sx * 0.3, 0.66, z), V(sx * 0.3, 0.5, z + 0.03), 0.1, 0.13, { nseg: 6, col: brown, line: L });   // a hoof
  }
  const sway = [2.9, 0.012, 0.07, 0], sp = { part: 23, rig: sway };
  const nk = smooth([[2.75, 0.62, 0.36], [3.7, 0.95, 0.25], [4.7, 1.12, 0.2], [5.55, 1.22, 0.17]].map(([y, z, r]) => ({ p: V(0, y, z), r })), 8);
  tube(B, nk.map((q) => q.p), nk.map((q) => q.r), { col: yel, nseg: 7, line: L, cap0: false, cap1: false, ...sp });
  ball(B, V(0, 5.7, 1.42), [0.21, 0.42, 0.22], { nseg: 9, nring: 6, axis: V(0, -0.36, 0.933), col: yel, line: L, ...sp });
  ball(B, V(0, 5.57, 1.76), [0.17, 0.16, 0.15], { nseg: 7, nring: 4, col: look.col(GP.face), line: L, ...sp });   // the muzzle
  eyes(B, look, 5.82, 1.5, 0.185, 0.05, sp);
  for (const sx of [-1, 1]) {
    tube(B, [V(sx * 0.1, 5.9, 1.24), V(sx * 0.12, 6.2, 1.2)], 0.04, { col: yel, nseg: 4, line: L, cap0: false, ...sp });
    ball(B, V(sx * 0.12, 6.24, 1.2), [0.07, 0.07, 0.07], { nseg: 5, nring: 3, col: brown, line: L, ...sp });
    ball(B, V(sx * 0.34, 5.86, 1.2), [0.16, 0.07, 0.09], { nseg: 6, nring: 3, col: yel, line: L, ...sp });   // an ear
  }
  // the patches: flat brown pads lying on the skin (on each flank of the trunk; up each side of the neck, swaying with it)
  for (const sx of [-1, 1]) {
    for (const [y, z, r] of [[2.72, -0.62, 0.2], [2.36, -0.2, 0.22], [2.74, 0.24, 0.19], [2.3, 0.52, 0.16], [2.5, -0.98, 0.15]]) {
      const x = 0.5 * Math.sqrt(Math.max(0, 1 - ((z + 0.1) / 1.05) ** 2 - ((y - 2.5) / 0.62) ** 2));
      ball(B, V(sx * (x + 0.005), y, z), [0.03, r, r * 1.2], { nseg: 7, nring: 2, col: brown, line: 0 });
    }
    [[3.3, 0.82, 0.29], [4.1, 1.03, 0.225], [4.9, 1.14, 0.19]].forEach(([y, z, r], i) => ball(B, V(sx * (r + 0.005), y + (sx > 0 ? 0.3 : 0), z), [0.03, 0.17 - 0.02 * i, 0.15 - 0.02 * i], { nseg: 7, nring: 2, col: brown, line: 0, ...sp }));
  }
  const tail = { part: 21, rig: [2.62, -1.1, 0.35, 0] };
  tube(B, [V(0, 2.62, -1.1), V(0, 1.8, -1.34)], 0.04, { col: yel, nseg: 4, line: L, cap0: false, ...tail });
  ball(B, V(0, 1.7, -1.37), [0.08, 0.16, 0.08], { nseg: 5, nring: 3, col: brown, line: L, ...tail });
  return { rig: null };
}
const GUEST_BUILT = { flamingo, opossum, frog, turtle, ostrich, giraffe };

// THE WICKER BASKET ahead of the bars, a blue fish in it looking over the front rim, its forked tail flapping over the
// back one (generation four's, on three to five of them, and the leader's)
function basketInto(B, look, o = {}) {
  const { lod = 'hi', part = 0 } = o, hi = lod === 'hi', ink = look.col('ink'), straw = look.col('straw'), fish = look.col('fish');
  const b0 = box(B, V(-0.42, 2.18, 1.22), V(0.42, 2.86, 1.96), { col: straw, line: INK_W, part });
  for (const q of [0, 1, 4, 5]) { B.pos[(b0 + q) * 3] *= 0.74; B.pos[(b0 + q) * 3 + 2] = 1.59 + (B.pos[(b0 + q) * 3 + 2] - 1.59) * 0.78; }   // narrower at the foot
  if (hi) for (const y of [2.4, 2.63]) {                                 // the weave: two hoops and crossed strokes on the near faces
    const k = 0.74 + 0.26 * (y - 2.18) / 0.68, hx = 0.42 * k + 0.012, hz = 0.37 * (0.78 + 0.22 * (y - 2.18) / 0.68) + 0.012;
    stroke(B, [V(-hx, y, 1.59 - hz), V(hx, y, 1.59 - hz), V(hx, y, 1.59 + hz), V(-hx, y, 1.59 + hz), V(-hx, y, 1.59 - hz)], 0.016, { part, col: ink, detail: 0.45 });
  }
  const fax = V(0, -0.2, 0.98).normalize(), up = V(0, 0.98, 0.2).normalize(), fc = V(-0.14, 3.04, 1.74);
  ball(B, fc, [0.11, 0.52, 0.2], { nseg: hi ? 6 : 4, nring: hi ? 4 : 3, axis: fax, side: X_AXIS, col: fish, line: INK_W, part });
  const t0 = fc.clone().addScaledVector(fax, -0.44), flap = [t0.y, t0.z, 0.11, 0];
  for (const s of [-1, 1]) {
    const tip = t0.clone().addScaledVector(fax, -0.36).addScaledVector(up, s * 0.19);
    loft(B, [{ p: t0, rx: 0.04, rz: 0.06 }, { p: t0.clone().lerp(tip, 0.6), rx: 0.04, rz: 0.085 }, { p: tip, rx: 1e-4, rz: 1e-4 }], 3, { col: fish, side: X_AXIS, line: INK_W, part: 17, rig: flap });
  }
  for (const sx of [-1, 1]) ball(B, fc.clone().addScaledVector(fax, 0.32).addScaledVector(up, 0.04).add(V(sx * 0.085, 0, 0)), [0.045, 0.045, 0.045], { nseg: 4, nring: 2, col: ink, line: 0, part });
}

// riderGeometry(kind, look, rng, Y, opts) -> B (not finished: finish(B, Y, { instanced: true }) makes it). B.rigs is the
// rig table for packMaterial; B.at tells where its head, neck and back are (for the dress).
//   kind: 'g1' | 'g2' | 'g3' | 'g4' | 'bulk2' | 'bulk3'; opts.lo: the light build; opts.head: 'duck' | 'goose' | 'stork'
export async function riderGeometry(kind, look, rng, Y, opts = {}) {
  const B = makeBuilder(), lo = !!opts.lo;
  if (kind === 'g4') B.at = pelican(B, look, { lod: lo ? 'lo' : 'hi', gen: 4 });
  else if (kind === 'bulk3') B.at = pelican(B, look, { lod: lo ? 'lo' : 'mid', gen: 3 });
  else if (kind === 'g2' || kind === 'bulk2') B.at = pouchBird(B, look, { lod: kind === 'bulk2' ? 'mid' : lo ? 'lo' : 'hi' });
  else if (kind === 'g1') B.at = eggBird(B, look, { lod: lo ? 'lo' : 'hi', head: opts.head || '' });
  else B.at = pelican(B, look, { lod: lo ? 'lo' : 'hi', gen: 3 });
  if (Y) await Y();
  return B;
}
// The hopeless: kinds 'h1' .. 'h14' of the plan (or 1 .. 14), appended into B with the row's iA / iB on every vertex.
const HOPELESS_BUILT = { h1: twoCircles, h2: hoverer, h3: pedalsInAir, h5: backwards, h6: oneSide, h7: drifter, h8: fiveWheeler, h9: squareWheels,
  h10: threeWings, h11: bigBird, h12: wheelAhead, h13: blankCard, h14: sunSpokes };
const HOPELESS_BIB = { h3: PEDALS_DZ, h10: 0, h12: WHEEL_AHEAD_DZ };   // the kinds a bib can be pinned on (a whole bird on the plain saddle), and how far astern each sits
export async function hopelessGeometry(B, kind, look, row, Y) {
  const k = typeof kind === 'number' ? 'h' + kind : kind, from = B.pos.length / 3, made = HOPELESS_BUILT[k];
  if (!made) throw new Error('pelican-peloton: no hopeless kind ' + k + ' is modelled');   // the plan deals the thirteen built ones only (the design's number 4 is no kind)
  const at = made(B, look);
  if (row.bib && k in HOPELESS_BIB) { const fb = B.pos.length / 3; bibInto(B, look, row.bib, { side: !!row.bibSide, port: row.lane === 0 }); shiftZ(B, fb, HOPELESS_BIB[k]); }
  rowOn(B, from, look, row);
  if (Y) await Y();
  return at;
}
// The guests: 'flamingo' | 'opossum' | 'frog' | 'turtle' | 'ostrich' | 'giraffe' (the plan's six; any other name stops the build).
export async function guestGeometry(B, kind, look, row, Y) {
  const from = B.pos.length / 3, made = GUEST_BUILT[kind];
  if (!made) throw new Error('pelican-peloton: no guest ' + kind + ' is modelled');
  const at = made(B, look);
  rowOn(B, from, look, { ...row, glitch: GLITCH.none });
  if (Y) await Y();
  return at;
}
// The leader, the one that is entirely right: generation four at a finer build, the wash on the crown, the eye's ring,
// the wicker basket with its fish, bib number 1; nothing it was not asked for. On a RED bicycle, true in every bar.
export async function leaderGeometry(B, look, row, Y) {
  const from = B.pos.length / 3;
  const at = pelican(B, look, { lod: 'hi', gen: 5, fine: 1.6, tint: 0, col: look.col('bikeRed'), bike: { hubs: true } });
  if (Y) await Y();
  basketInto(B, look, { lod: 'hi' });
  bibInto(B, look, row.bib || 1);
  rowOn(B, from, look, { ...row, glitch: GLITCH.leader });
  if (Y) await Y();
  return at;
}

// ---------------------------------------------------------------------------------------------
// THE DRESS: things nobody asked for, one a rider and no more (the kinds ruling), each a small geometry of its own in the
// rider's frame, instanced on the rows of the riders that wear it. Pelicans of the whole build only (one head for all).
//   'tophat' (ink, with a YELLOW band, upright) | 'cap' (one flat colour, peak forward) | 'neckerchief' (plain red, two
//   tails streaming; never dealt to a teal bicycle) | 'helmet' (small, teal or red by helmetRow) | 'basket' (wicker, fish)
//   'bib': opts.rows = the dealt rows that wear one (row.bib its number): ONE merged geometry with the rows on its vertices
// ---------------------------------------------------------------------------------------------
const HEAD_AT = { top: [4.84, 0.5], nod: [4.05, 0.55, 0.05, 0], neck: [3.42, 0.75], neckR: 0.26 };
export async function dressGeometry(kind, look, Y, opts = {}) {
  const B = makeBuilder(), hi = !opts.lo, [y, z] = HEAD_AT.top, mv = { part: 11, rig: HEAD_AT.nod }, n = hi ? 10 : 6, L = INK_W;
  const st = (yy, r, zz = 0) => ({ p: V(0, y + yy, z + zz), rx: r, rz: r });
  if (kind === 'tophat') {
    loft(B, [st(-0.05, 1e-4), st(-0.05, 0.4), st(0.0, 0.4), st(0.0, 0.25), st(0.56, 0.27), st(0.56, 1e-4)], n, { col: look.col('hat'), axis: Y_AXIS, line: 0, ...mv });
    loft(B, [st(0.02, 0.262), st(0.15, 0.266)], n, { col: look.col('hatBand'), axis: Y_AXIS, line: 0, ...mv });      // the band: yellow
  } else if (kind === 'cap') {
    const cap = look.col('cap');
    loft(B, [st(-0.1, 1e-4, -0.02), st(-0.1, 0.34, -0.02), st(0.04, 0.33, -0.02), st(0.16, 0.22, -0.02), st(0.21, 1e-4, -0.02)], n, { col: cap, axis: Y_AXIS, line: L, ...mv });
    ball(B, V(0, y - 0.07, z + 0.42), [0.27, 0.28, 0.035], { nseg: hi ? 8 : 4, nring: hi ? 4 : 2, axis: Z_AXIS, col: cap, line: L, ...mv });     // the peak, forward
  } else if (kind === 'helmet') {
    const c = look.col('bikeTeal');                                       // its colour is its row's tint: teal or red (helmetRow)
    loft(B, [st(-0.12, 1e-4), st(-0.12, 0.35), st(0.02, 0.35), st(0.16, 0.27), st(0.24, 0.14), st(0.27, 1e-4)], n, { col: c, tint: 1, axis: Y_AXIS, line: L, ...mv });
    ball(B, V(0, y + 0.1, z), [0.07, 0.06, 0.33], { nseg: 5, nring: 4, axis: Z_AXIS, col: c, tint: 1, line: L, ...mv });   // the ridge along its top
  } else if (kind === 'neckerchief') {
    const [ny, nz] = HEAD_AT.neck, R = HEAD_AT.neckR + 0.06, red = look.col('scarf');
    ball(B, V(0, ny, nz), [R, 0.1, R], { nseg: hi ? 8 : 4, nring: hi ? 3 : 2, axis: V(0, 0.8, 0.6), col: red, line: L, part: 10 });     // the band, low on the neck
    const knot = V(0, ny + 0.03, nz - R - 0.06);
    ball(B, knot, [0.11, 0.11, 0.11], { nseg: 5, nring: 2, col: red, line: L, part: 10 });
    for (const [dy, dx, len] of [[0.16, 0.08, 1.1], [0.03, -0.08, 0.85]]) {                                  // two tails streaming back in a curve, never a plank
      const m = hi ? 6 : 3, S = [];
      for (let i = 0; i <= m; i++) { const f = i / m, s = f * len; S.push({ p: V(dx * f * 2 + 0.07 * Math.sin(f * 5.5), knot.y + dy * f * 2.2 + 0.09 * Math.sin(f * 4.4 + 0.6) * f, knot.z - s), rx: i === 0 ? 0.05 : 0.1 * (1 - 0.45 * f), rz: 0.035, rig: [s, 0.3, 0, 0] }); }
      S.push({ p: S[m].p.clone().add(V(0, 0, -0.12)), rx: 1e-4, rz: 1e-4, rig: [len + 0.12, 0.3, 0, 0] });
      loft(B, S, 4, { col: red, side: Y_AXIS, line: L, part: 8 });
    }
  } else if (kind === 'basket') basketInto(B, look, { lod: hi ? 'hi' : 'mid' });
  else if (kind === 'bib') {
    for (const row of opts.rows || []) { const from = B.pos.length / 3; bibInto(B, look, row.bib ?? opts.number ?? 0, { side: !!row.bibSide, port: row.lane === 0 }); rowOn(B, from, look, row); }
    if (!opts.rows) bibInto(B, look, opts.number ?? 0);
  }
  if (Y) await Y();
  return B;
}
// the small helmet is TEAL OR RED (the ruling), never the bicycle's own colour: red over a teal bicycle, teal over a red
// one, and over a yellow one by the rider's own number. The row's numbers with that colour in the tint's place.
export function helmetRow(look, row) {
  const r = rowNumbers(look, row).slice(), red = row.livery === 'teal' || (row.livery !== 'red' && Math.floor((row.own ?? 0) * 8) % 2 === 1);
  const c = look.col(red ? 'bikeRed' : 'bikeTeal'); r[4] = c[0]; r[5] = c[1]; r[6] = c[2];
  return r;
}
// packMaterial(look, rig, opts): the flat material with the pack law. rig: a rig or a builder's table (B.rigs).
// opts: more vertexPre / vertexMove (after the law), fragPre, fragColor, uniforms, side, extra. The same text serves
// instanced rows and rows on the vertices (the attributes are bound either way).
export function packMaterial(look, rig, opts = {}) {
  const m = flatMaterial(look.U, rig && (!Array.isArray(rig) || rig.length) ? rig : RIG(), {
    keepInk: true, ...opts, vertexPre: PACK_PRE + (opts.vertexPre || ''), vertexMove: PACK_MOVE + (opts.vertexMove || '') });   // keepInk: a rider keeps its line and its colours at any distance
  m.userData.look = look; m.name = opts.name || 'pp-pack';
  return m;
}
// packMesh(geometry, rows, material) -> THREE.Mesh. On an instanced geometry the rows (dealt rows or eight numbers each)
// become iA and iB; a merged geometry already carries them. Never culled (the shader places it).
export function packMesh(geometry, rows, material) {
  if (geometry.isInstancedBufferGeometry && rows) setInstances(geometry, rows.map((r) => rowNumbers(material.userData.look, r)));
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// THE DRAWN SHADOWS: ONE instanced mesh of flat shadow shapes 8 m long, moved by the pack law with the riders, laid
// away from the sun's bearing on the road's own surface and CUT at the road's own edges at its station (no shadow lies
// on air). Paint on the road: a mesh of its own with a polygon offset, drawn just after the strip (renderOrder by the world).
// ---------------------------------------------------------------------------------------------
const SHADOW_PRE = /* glsl */`
  varying vec3 vEdge;
`;
const SHADOW_MOVE = /* glsl */`
  {
    vec2 sd = -uSunDir.xz; sd = sd / max(length(sd), 1e-4);            // away from the sun, in plan
    vec2 off = (sd * p.z + vec2(sd.y, -sd.x) * p.x) * gSize;
    float al = dot(off, gHd), ac = dot(off, vec2(gHd.y, -gHd.x));      // along the road, and to port
    float t = clamp((gS + al - ${f1(PP.TAPER_S0)}) / ${f1(PP.TAPER_S1 - PP.TAPER_S0)}, 0., 1.);
    vEdge = vec3(gN + ac, mix(${f1(PP.ROAD_N0)}, ${f1(PP.RIB_N0)}, t), mix(${f1(PP.ROAD_N1)}, ${f1(PP.RIB_N1)}, t));
    p = vec3(gBase.x + off.x, ppRoadY(gS + al).x + 0.05, gBase.z + off.y);   // on the road's own skin at its own station (the brink's curve too)
    n = vec3(0., 1., 0.);
  }
`;
export function makeShadows(look, rows) {
  const B = makeBuilder(), col = look.col('shadow'), N = 12, pts = [];
  // the shape, in its own frame (+Z away from the sun): it starts under the wheels and runs 8 m, narrowing
  for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), z = 2.9 + 4.0 * c, w = 0.66 - 0.26 * (z + 1.1) / 8; pts.push([s * w * (0.55 + 0.45 * Math.abs(s)), z]); }
  B.pos.push(0, 0, 2.9); for (const [x, z] of pts) B.pos.push(x, 0, z);
  for (let v = 0; v <= N; v++) { B.nor.push(0, 1, 0); B.col.push(col[0], col[1], col[2]); B.k.push(0, 20, 0, 1); B.rig.push(0, 0, 0, 0); }
  for (let i = 0; i < N; i++) B.idx.push(0, 1 + i, 1 + ((i + 1) % N));   // facing up
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(B.col, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(B.k, 4)); g.setAttribute('aRig', new THREE.Float32BufferAttribute(B.rig, 4));
  g.setIndex(B.idx); g.userData.triangles = N;
  const m = flatMaterial(look.U, RIG(), {
    vertexPre: PACK_PRE + SHADOW_PRE, vertexMove: SHADOW_MOVE, fragPre: 'varying vec3 vEdge;',
    fragColor: 'if (vEdge.x < vEdge.y || vEdge.x > vEdge.z) cut = true;',
    extra: { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 } });
  m.userData.look = look; m.name = 'pp-shadows';
  const mesh = packMesh(g, rows, m); mesh.name = 'pp-shadows';
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// buildPack(ctx, look, rows, Y) -> { group, meshes, counts: { triangles, calls } }: every mesh of the race from the dealt
// rows (the plan's dealPack). One instanced mesh a kind and build; the hopeless, the guests and the leader in ONE merged
// geometry with their rows on the vertices; one instanced mesh a dress; the bibs merged; the shadows.
// ---------------------------------------------------------------------------------------------
export async function buildPack(ctx, look, rows, Y) {
  const group = new THREE.Group(); group.name = 'pp-pack';
  const meshes = [], counts = { triangles: 0, calls: 0, byMesh: {} };
  const add = (mesh, name, n = 1) => {
    mesh.name = name; group.add(mesh); meshes.push(mesh);
    const t = (mesh.geometry.userData.triangles || 0) * n; counts.triangles += t; counts.calls += 1; counts.byMesh[name] = t;
  };
  if (!Y) Y = async () => {};
  for (const [band, lo] of [['g1', false], ['g1', true], ['g2', false], ['g2', true], ['bulk2', false], ['bulk3', false], ['g3', false], ['g4', false]]) {
    const rs = rows.filter((r) => r.band === band && !!r.lo === lo);
    if (!rs.length) continue;
    if (band === 'g1' && !lo) {                                          // four riders, four heads: one merged geometry, the rows on its vertices
      const M = makeBuilder();
      for (const r of rs) { const from = M.pos.length / 3; eggBird(M, look, { lod: 'hi', head: r.head || '' }); rowOn(M, from, look, r); await Y(); }
      const g = await finish(M, Y); add(packMesh(g, null, packMaterial(look, M.rigs)), 'pp-g1');
      continue;
    }
    const B = await riderGeometry(band, look, null, Y, { lo }), g = await finish(B, Y, { instanced: true });
    add(packMesh(g, rs, packMaterial(look, B.rigs)), 'pp-' + band + (lo ? '-lo' : ''), rs.length);
    await Y();
  }
  const one = makeBuilder(); let any = false;
  for (const r of rows) {
    if (r.band === 'hopeless' || r.band === 'star') { await hopelessGeometry(one, r.kind, look, r, Y); any = true; }
    else if (r.band === 'guest') { await guestGeometry(one, r.kind, look, r, Y); any = true; }
    else if (r.band === 'leader') { await leaderGeometry(one, look, r, Y); any = true; }
  }
  if (any) { const g = await finish(one, Y); add(packMesh(g, null, packMaterial(look, one.rigs)), 'pp-oneoff'); await Y(); }
  for (const kind of ['tophat', 'cap', 'neckerchief', 'helmet', 'basket']) {
    const rs = rows.filter((r) => r.band !== 'leader' && (kind === 'basket' ? r.basket : r.dress === kind));
    if (!rs.length) continue;
    const B = await dressGeometry(kind, look, Y, { lo: false }), g = await finish(B, Y, { instanced: true });
    add(packMesh(g, kind === 'helmet' ? rs.map((r) => helmetRow(look, r)) : rs, packMaterial(look, null)), 'pp-' + kind, rs.length);
  }
  const bibbed = rows.filter((r) => r.bib && (r.band === 'bulk3' || r.band === 'g3' || r.band === 'g4'));
  if (bibbed.length) { const B = await dressGeometry('bib', look, Y, { rows: bibbed }), g = await finish(B, Y); add(packMesh(g, null, packMaterial(look, null)), 'pp-bibs'); }
  const sh = makeShadows(look, rows); sh.renderOrder = -1; add(sh, 'pp-shadows', rows.length);
  return { group, meshes, counts };
}
