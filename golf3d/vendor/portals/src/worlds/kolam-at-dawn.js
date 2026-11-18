// KOLAM AT DAWN
// Blue dawn at ant height on a swept and wetted Tamil doorstep, built 200 times life size. A thread of rice
// flour falls from above and races in loops round a grid of dots (the hero, src/parts/kolam-at-dawn.js);
// we chase its landing point, twice rising to see the growing drawing whole (about u 0.16 and 0.31), run west along
// the street side and turn once round beside the brass pot in the drawing's south-west corner while a sparrow drinks
// on its rim in the last of the blue hour (the still life, u 0.39 to 0.52: the pot in the left third, the knot,
// the veil and the lamp-lit door to its right, nothing warm but the lamps, their streaks in the wet and the low band
// in the east; the sparrow flies off at about 0.53), spiral up and out over the knot's west side and down across the
// finished knot while the sun comes up and its edge rakes over it from the east (u 0.60 to 0.80; the line closes at
// 0.66), level out 9 m above the ground and run aslant toward the house for a hundred metres (the low pass,
// u 0.78 to 0.85: the flour ridge and then the ants' column with their white loads beside us in the lower half of
// the frame, each ant with its long shadow, a sparrow pecking beyond them, and above them the lit step with its ochre
// and white bands, the lamp row, the hibiscus and the lamp-lit door), climb east of the door (u 0.85 to 0.92) to look
// down across the wet red floor of the step (over its edge at 0.94) and glide in between the hibiscus and the lamps
// and out through the door slot.
// The threshold's own colours run through all of it: bands of red ochre round the drawing, a flower on every dot,
// a row of clay oil lamps along the step and a tall brass lamp by the door, mango leaves strung over the door.
//
// SPACE  x along the street (+x: the sun), z from the street (+z) to the house (-z), paving at y 0.
// FILE   1 helpers, the route planner (planRoute)            5 small things: beads, moss, rings, motes
//        2 shared light GLSL, the sky function, propMat      6 creatures: ants, sparrows, the bee
//        3 the sky dome and the house (step, beam, door)     7 build(): looks, timeline, update, dispose
//        4 props: pot, bowl, broom, incense, leaflet, hibiscus, door fittings, lamps, the leaf festoon, dot flowers
// LIGHT  no three.js lights: every shader reads the hero's sky light and its sunrise edge (hero.uniforms),
//        so the sun's edge sweeps over stone, flour, pot, birds and flowers together. Fog is one FogExp2.
//        The lamps are eleven points in hero.uniforms.uLamps (xyz, brightness): the house front, the floor and the
//        flowers take their light, the wet ground mirrors them as streaks; update() only makes them waver.
//        The house is one opaque dark cliff (GLSL_CLIFF): lamp-lit at its foot, its top and far ends gone into the
//        haze by colour, never by transparency. The wet ground also mirrors the step's lime-wash bands (uStep).
//        The sunrise is keyed to u itself (U_SUN, edgeOf): cold and blue until the look-down begins (u 0.60), then
//        the edge comes in from the east and is on the knot through the whole look-down (u 0.62 to 0.80).
// TIME   everything scripted runs on b, the brief's clock: u remapped so that the chase ends at b 0.31,
//        the apex is b 0.54, the descent ends at b 0.77 and the step edge is b 0.95, whatever this seed's
//        knot made of the route's length. Ambient loops run on time.
//        The pour itself is re-timed between u 0.15 and the end of the chase (holdBack): it runs ahead or hangs back
//        so that the lens never climbs over the landing point and looks straight down on it; the pull-back keeps
//        the burst and the slanting rope ahead, below the horizon, with the lamps or the street behind them.
// GLINT  once, u 0.186 to 0.226 (the design's beat at 0.20): a gold glint high in the haze where the gaze of u 0.20
//        rests, and its narrow streak in the wet under it; both fade if the glint leaves the frame.
// GAZE   every moving gaze target is a pure function of u (aim). On the low pass and the climb the target is the door
//        seen some ten degrees below eye level (poiDoor), for the whole stretch from just before the low point to
//        the step's edge; the ants' lane is the route itself moved 15 m to its house side (antLane), so no position
//        along it is special.
// LOOKS  0 white loop on blue wet granite, 1 festival morning (rose haze, coloured cells, marigolds, two bees,
//        pale hen sparrows), 2 village yard (dark damp umber earth under a grey-blue sky with a strong peach band, a
//        lotus of eight petal strokes, earth swept in broad wet finger arcs, moss in drifts, dark red-brown ants).
//        Hour picks it; with hour 'any' the seed does. Rare (looks 0 and 1; the yard becomes look 0): about u 0.04 to
//        0.32 (the jump over the dot at 0.11 to 0.15) a gust bends the rope and the veil downwind across the frame, the line misses
//        the turn round one rim dot (west, house side) and that loop stays open for good: two loose ends, each with a
//        small heap, the dot standing clear in dark stone, the flour fanned out over the stone beside it.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, GLSL_COMMON } from '../parts/kolam-at-dawn.js';

const TAU = Math.PI * 2;
const PAL = ['#1B2942', '#3E5C8A', '#A9B9D6', '#F4F2EA', '#E7B48B', '#D8A23F', '#C3352D'];
const C = (h) => new THREE.Color(h);
const mixC = (a, b, t) => C(a).lerp(C(b), t);
const STEP_Z = -200, STEP_Y = 24, DOOR_Z = -270, SLOT = 9;
const POT = [-80, 0, 130], POT_S = 1.15, ORB = [50, 165], ORB_R = 38, LOOP_C = [-43.5, 207], LOOP_R = 20, RIM_B = 65 * Math.PI / 180, BOWL = [-150, 0, -50], INCENSE = [70, STEP_Y, -230], BROOM = [216, 108];
// the oil lamps along the step's front edge [x, z] and the tall brass lamp beside the door
const LAMPS = [-46, 46, -68, 68, -90, 90, -112, 112, -134, 134].map((x) => [x, STEP_Z - 7.5]), TALL = [-40, -243];
// the five hibiscus on the step: [x, z, size]; the two we fly between are the largest, lie at the step's edge tipped
// toward our track and fill the lower corners at u 0.95; two small ones before the door keep petals in view to u 0.975
const HIB = [[-62, -236, 0.95], [-18, -249, 0.8], [-23, -216, 1.5], [23, -216, 1.5], [19, -251, 0.85]];
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
// The sunrise is keyed to u itself, so that on every seed the line has closed and the sun's edge is crossing the
// knot while the look-down holds it (u 0.62 to 0.80): the line closes at U_CLOSE; the sun is switched on at U_SUN,
// the start of the look-down, with its edge still far up the street. Until then the yard is the blue hour: the only
// warm things are the lamps, their streaks in the wet and the low band in the eastern sky.
const U_CLOSE = 0.66, U_SUN = 0.6;
// the chase: metres of line drawn while we track it, the smoothing window (half width, m of line), how far to the
// street side of the burst we ride, and how much of that offset swings behind the line's direction
const CHASE_LINE = 810, CHASE_W = 22, CHASE_D = 33, CHASE_BEHIND = 0.5, RUN_IN = 640, T_EST = 1200;
// the height of the chase against u: low behind the burst, two rises from which the growing drawing is seen whole
const chaseY = pw([[0, 8], [0.05, 8.5], [0.075, 13], [0.115, 36], [0.15, 45], [0.18, 40], [0.215, 19], [0.235, 15.5], [0.5, 15.5]]);
// the last 360 m of the run-in against the metres still to fly to the orbit's end: the pull-back rise over the knot's
// street-side rim, down to the pot's shoulder round its west and south, up again on the way out
const endY = pw([[0, 46], [26, 37], [60, 28], [90, 22], [118, 20.5], [145, 22], [172, 30], [200, 43], [226, 45.5], [244, 41], [268, 32], [300, 22], [330, 17.5], [360, 15.5]]);

// piecewise-linear map through sorted [x, y] knots
function pw(knots) {
  return (x) => {
    if (x <= knots[0][0]) return knots[0][1];
    for (let i = 1; i < knots.length; i++) if (x <= knots[i][0]) { const a = knots[i - 1], b = knots[i]; return lerp(a[1], b[1], (x - a[0]) / Math.max(1e-6, b[0] - a[0])); }
    return knots[knots.length - 1][1];
  };
}

// ---------------------------------------------------------------------------------------------------
// The route. Entry on the hero's axis; the chase, a tracking shot that rides to the street side of the landing
// point while some 550 m of this seed's line is drawn: low behind the burst, then twice it lifts to 45 m and stands
// back to the street-side rim, so that the growing drawing is seen whole with the veil at its tip (about u 0.16 and
// 0.31); then west along the street side of the drawing and one and three quarter turns of a small helix south-east
// of the brass pot (first turn level, then rising), the gaze held still on the pot, the drawing and the door (see the
// pois); out of the helix north-west over the pot and up the knot's west side with the whole finished drawing below,
// the house behind it and the sun on the right; down across the knot toward the house as the sun's edge crosses it;
// level at 9 m past the house-side tip of the drawing and on aslant toward the house for a hundred metres, the ants'
// column beside us and the lit step and door ahead (the low pass); up and round east of the door, so that we look
// down across the step's red floor from above and to one side, and a glide down over its edge and in between the two
// great flowers to the ring's height and the door slot. (The plan of the chase still scores itself against the old orbit site,
// ORB: that only decides which way round the knot the chase goes.) Nothing here draws
// from the seed's random stream; the yields only keep any one stretch of planning short.
async function planRoute(hero, look, ctx) {
  const L = hero.L, v = new THREE.Vector3();
  const kAt = (s) => hero.pointAt(clamp(s, 0, L - 0.01), v);
  const s0 = hero.landAt(0), land0 = hero.pointAt(s0, new THREE.Vector3());
  const chaseS = [], [px, pz] = ORB, R = ORB_R, DEG = Math.PI / 180;
  const wrap = (d) => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  // The camera rides D metres to the street side of the (smoothed) landing point, swung a little behind the way the
  // line is running, so that the burst is ahead of us with the rope and the veil standing against the dark house
  // front. D grows with height, and at full height we stand no nearer the house than the knot's street-side rim.
  const sm = (s, half, o) => { let x = 0, z = 0, n = 0; for (let d = -half; d <= half; d += 4) { kAt(s + d); x += v.x; z += v.z; n++; } o.x = x / n; o.z = z / n; return o; };
  const sA = s0 + 22, NK = Math.floor(CHASE_LINE / 3), raw = [], a = { x: 0, z: 0 }, b = { x: 0, z: 0 }, c = { x: 0, z: 0 };
  // steering: 3 m forward, curvature limited to 1/Rm and eased in over about 30 m
  const st = { x: 0, z: 0, th: 0, kap: 0 };
  const steer = (tx2, tz2, Rm) => {
    const d = wrap(Math.atan2(tz2 - st.z, tx2 - st.x) - st.th);
    st.kap += clamp(clamp(d * 0.07, -1 / Rm, 1 / Rm) - st.kap, -0.0032, 0.0032);
    st.th += st.kap * 3; st.x += Math.cos(st.th) * 3; st.z += Math.sin(st.th) * 3;
    return d;
  };
  // The tracking point of the low chase (smoothed), and where the entry stands
  {
    let tx = 0, tz = -1;
    for (let k = 0; k <= NK; k++) {
      const s = sA + k * 3; sm(s + 6, CHASE_W, c); sm(s - 16, CHASE_W, a); sm(s + 16, CHASE_W, b);
      const dx = b.x - a.x, dz = b.z - a.z, dl = Math.hypot(dx, dz); if (dl > 2) { tx = dx / dl; tz = dz / dl; }
      let ox = -tx * CHASE_BEHIND, oz = 1 - tz * CHASE_BEHIND; const ol = Math.hypot(ox, oz); ox /= ol; oz /= ol;
      raw.push({ x: c.x + ox * CHASE_D, z: c.z + oz * CHASE_D, s });
    }
    for (let pass = 0; pass < 2; pass++) {
      const q = raw.map((p) => ({ x: p.x, z: p.z }));
      for (let k = 0; k <= NK; k++) { let x = 0, z = 0, n = 0; for (let j = Math.max(0, k - 5); j <= Math.min(NK, k + 5); j++) { x += q[j].x; z += q[j].z; n++; } raw[k].x = x / n; raw[k].z = z / n; }
    }
  }
  await ctx.yield();
  const ex = clamp(land0.x - 1.5, -45, 12), ez = Math.max(raw[0].z, land0.z + 34) + 4;
  const pts = [[ex, 8, ez + 56], [ex, 8, ez + 28], [ex, 8, ez]];
  // ctl: the control points of the run-in after the entry, each with the metres flown to it (d, from the path's
  // start) and the metres of line laid when we are there (s). Heights come from d at the end.
  // B, the first rise: from the entry we swing onto an arc round the knot, 100 m out, and climb along it, east or
  // west, whichever leaves the burst ahead of us when we come down.
  const KA = 56, NB = 44, PHI_X = -90 * DEG;        // (the orbit ends on the pot's house side, heading west along the knot's rim)
  const flyB = (dir, out) => {              // returns how far off the landing point is, on average, while we are on the arc
    st.x = ex; st.z = ez; st.th = -Math.PI / 2; st.kap = 0; let off = 0;
    for (let j = 1; j <= NB; j++) {
      const az = Math.atan2(st.z, st.x) - dir * 0.5, sj = raw[Math.round(KA * j / NB)].s;
      steer(Math.cos(az) * 100, Math.sin(az) * 100, 36);
      kAt(sj); off += Math.hypot(v.x - st.x, v.z - st.z) / NB;
      if (out && j % 6 === 0) out.push({ x: st.x, z: st.z, d: 56 + 3 * j, s: sj });
    }
    return off;
  };
  // C, the swoop: down off the arc and low across the drawing, through the place where the tracking point will be
  // when we get there (the burst then 33 m to our house side), and on. D, the pull-back: from there onto the orbit
  // round the pot, a steered pursuit of the orbit's tangent point, never tighter than 40 m, climbing over the
  // street-side rim so that the drawing lies whole behind and below us.
  const goTo = (k, out, d0) => {              // steer to raw[k]; returns the steps taken, or -1 when it cannot be reached
    for (let j = 1; j <= 70; j++) {
      if (Math.hypot(raw[k].x - st.x, raw[k].z - st.z) < 9) return j - 1;
      steer(raw[k].x, raw[k].z, 34);
      if (out && j % 6 === 0) out.push({ x: st.x, z: st.z, d: d0 + 3 * j, s: -2 });
    }
    return -1;
  };
  const link = (out, d0) => {                 // from the present state onto the orbit: { len, phi } (metres flown, where it joins)
    let n = 0, phi = 0; const steps = [];
    for (let j = 1; j < 200; j++) {
      const dx = st.x - px, dz = st.z - pz, d = Math.hypot(dx, dz); phi = Math.atan2(dz, dx);
      if (d < R + 2.5) break;
      const ft = phi - Math.acos(clamp(R / d, 0, 1));
      steer(px + Math.cos(ft) * R, pz + Math.sin(ft) * R, 40); n++;
      if (out && j % 6 === 0) steps.push([st.x, st.z, n]);
    }
    while (phi < PHI_X + 0.5) phi += TAU;
    if (out) for (const q of steps) if ((n - q[2]) * 3 > 13) out.push({ x: q[0], z: q[1], d: d0 + q[2] * 3, s: -1 });
    return { len: n * 3, phi };
  };
  // try both ways round and a range of meeting places; take the plan whose run-in is nearest the wanted length, but
  // not one that rides the arc on the far side of the knot from the pour (the burst and the rope then stay small in
  // the middle distance for the whole first rise): every metre beyond 90 that the landing point is off, on average,
  // counts against that way round
  let plan = null;
  for (const dir of [1, -1]) for (let k = KA + 14; k <= KA + 86; k += 4) {
    if (k % 24 === 6) await ctx.yield();
    const off = flyB(dir, null);
    const n1 = goTo(k, null, 0); if (n1 < 5) continue;
    const save = { ...st };
    for (let ext = 0; ext <= 16; ext += 4) {
      st.x = save.x + Math.cos(save.th) * 3 * ext; st.z = save.z + Math.sin(save.th) * 3 * ext; st.th = save.th; st.kap = 0;
      if (st.z < -95 || Math.abs(st.x) > 120) break;
      const lk = link(null, 0), pre = 56 + 3 * (NB + n1 + ext) + lk.len + (lk.phi - PHI_X) * R;
      const score = Math.abs(pre - RUN_IN) + 0.15 * lk.len + 0.5 * Math.abs(n1 * 3 - 100) * 0.3 + (lk.len > 400 ? 500 : 0) + 0.12 * Math.max(0, off - 90);
      if (!plan || score < plan.score) plan = { score, dir, k, ext };
    }
  }
  if (!plan) plan = { dir: 1, k: KA + 30, ext: 0 };
  const ctl = [], dirB = plan.dir;
  flyB(dirB, ctl);
  const dB = 56 + 3 * NB, nC0 = ctl.length, n1 = Math.max(0, goTo(plan.k, ctl, dB));
  st.x += Math.cos(st.th) * 3 * plan.ext; st.z += Math.sin(st.th) * 3 * plan.ext; st.kap = 0;
  const dE = dB + 3 * (n1 + plan.ext), sB = raw[KA].s, sE2 = raw[plan.k].s + plan.ext * 3;
  ctl.push({ x: st.x, z: st.z, d: dE, s: sE2 });
  for (let i = nC0; i < ctl.length; i++) ctl[i].s = lerp(sB, sE2, (ctl[i].d - dB) / Math.max(1, dE - dB));
  // The run-in's heights still hang on where the old orbit would have ended (dX): that keeps every seed's chase and
  // its two rises as they were. From E on the route is the still life: west along the street side of the kaavi toward
  // the brass pot in the drawing's south-west corner, then a rising helix of one and three quarter turns beside it.
  const E = ctl[ctl.length - 1], stE = { ...st }, join = link(null, dE), dX = dE + join.len + (join.phi - PHI_X) * R;
  Object.assign(st, stE); st.kap = 0;
  const yOf = (d) => (d < dX - 360 ? chaseY(d / T_EST) : endY(dX - d));
  for (const q of ctl) { if (q.s >= 0) chaseS.push({ i: pts.length, s: q.s }); pts.push([q.x, yOf(q.d), q.z]); }
  // pure pursuit, 3 m a step: curvature toward the target, limited to 1/Rm and eased in at `rate` a step
  const pp = (tx2, tz2, Rm, rate) => {
    const dl = Math.hypot(tx2 - st.x, tz2 - st.z), err = wrap(Math.atan2(tz2 - st.z, tx2 - st.x) - st.th);
    st.kap += clamp(clamp(2 * Math.sin(err) / Math.max(dl, 6), -1 / Rm, 1 / Rm) - st.kap, -rate, rate);
    st.th += st.kap * 3; st.x += Math.cos(st.th) * 3; st.z += Math.sin(st.th) * 3;
  };
  const [lcx, lcz] = LOOP_C, RL = LOOP_R, run = [], loop = []; let dd = dE, guard = 0;
  while ((st.x > lcx + 3 || Math.abs(st.z - (lcz - RL)) > 7) && guard++ < 90) {
    pp(Math.max(lcx - 8, st.x - 27), lcz - RL, 25, 0.005); dd += 3;
    if (guard % 5 === 0) run.push({ x: st.x, z: st.z, d: dd });
  }
  if (run.length && dd - run[run.length - 1].d < 7) run.pop();
  const dLoop = dd; loop.push({ x: st.x, z: st.z, m: 0 });
  let swept = 0, prev = Math.atan2(st.z - lcz, st.x - lcx); guard = 0;
  while (swept < 1.75 * TAU - 0.06 && guard++ < 140) {
    const f = Math.atan2(st.z - lcz, st.x - lcx) - 0.55;
    pp(lcx + Math.cos(f) * RL, lcz + Math.sin(f) * RL, RL - 1.5, 0.012); dd += 3;
    const a2 = Math.atan2(st.z - lcz, st.x - lcx); swept += wrap(prev - a2); prev = a2;
    if (guard % 4 === 0) loop.push({ x: st.x, z: st.z, m: dd - dLoop });
  }
  const lapLen = TAU * RL;
  // heights: the run comes down from the second rise to the pot's shoulder; the first turn of the helix stays there,
  // the rest climbs to the look-down
  const loopY = pw([[0, 31], [0.25 * lapLen, 29.5], [0.5 * lapLen, 28.5], [0.75 * lapLen, 29.5], [lapLen, 31.5], [1.25 * lapLen, 36], [1.5 * lapLen, 44.5], [1.75 * lapLen, 54]]);
  for (const q of run) { const t = smoothstep(0.3, 1, (q.d - dE) / Math.max(1, dLoop - dE)); pts.push([q.x, lerp(yOf(q.d), 31, t), q.z]); }
  const iJoin = pts.length; let iLap = -1;
  for (const q of loop) { if (iLap < 0 && q.m >= lapLen - 1.5) iLap = pts.length; pts.push([q.x, loopY(q.m), q.z]); }
  const iX = pts.length - 1;
  // out of the helix: north-west over the pot and up the knot's west side with the whole drawing below, the house
  // behind it and the sun on the right; then down across the knot toward the house
  const iApex = pts.length; pts.push([-33, 58, 121]);
  pts.push([-50, 61, 87], [-61, 55, 50], [-43, 45, 11], look === 2 ? [-19, 31, -24] : [-23, 31, -24]);
  const iDesc = pts.length; pts.push(look === 2 ? [0, 13, -56] : [-8, 12.5, -56]);     // the low point; in the yard it runs east of the last petal, its tip dot under the lens
  // the low pass: level at 9 m for some 95 m, out past the house-side tip of the drawing and on over the open ground
  // toward the step, aslant to the house (east of the door, heading north-east), the ant column 15 m off on our house
  // side the whole way and the lit step, the lamp row and the door ahead on the left; then up in 90 m, still east of
  // the door, to look down across the wet red floor, and a glide down over its edge, turning in to the ring
  const lowX = look === 2 ? 5 : 0;
  pts.push([15 + lowX, 9.8, -77], [39 + lowX, 8.8, -99], [61 + lowX * 0.4, 9.4, -121]);
  const iLow = pts.length - 1;
  pts.push([73, 21, -146], [64, 41, -168], [44, 53.5, -184]);
  const iStep = pts.length; pts.push([16, 47, -200], [3, 41, -214], [0, 37, -232], [0, 34.5, -252], [0, 34, DOOR_Z]);     // in over the edge between the lamps, and down the middle between the two great flowers
  await ctx.yield();
  const path = makePath(pts, { samples: 640 });
  await ctx.yield();
  // path fraction of each control point (monotone nearest search over samples)
  const N = 1600, P = []; for (let i = 0; i <= N; i++) P.push(path.pointAt(i / N));
  const uOf = []; let from = 0;
  for (const p of pts) {
    let bi = from, bd = 1e9;
    for (let i = from; i <= Math.min(N, from + 200); i++) { const d = (P[i].x - p[0]) ** 2 + (P[i].y - p[1]) ** 2 + (P[i].z - p[2]) ** 2; if (d < bd) { bd = d; bi = i; } }
    uOf.push(bi / N); from = bi;
  }
  const uE = uOf[chaseS[chaseS.length - 1].i], uApex = uOf[iApex], uDesc = uOf[iDesc], uStep = uOf[iStep], uLow = uOf[iLow];
  const bOf = pw([[0, 0], [uOf[chaseS[0].i], 0.07], [uE, 0.31], [uApex, 0.54], [uDesc, 0.77], [uStep, 0.95], [1, 1]]);
  const uOfB = pw([[0, 0], [0.07, uOf[chaseS[0].i]], [0.31, uE], [0.54, uApex], [0.77, uDesc], [0.95, uStep], [1, 1]]);
  // the landing point: 30 m of line ahead of us through the chase, then on to the closing
  const kn = [[0, s0]]; for (const c2 of chaseS) kn.push([uOf[c2.i], c2.s]);
  kn.push([U_CLOSE, L], [1, L + 400]);
  await ctx.yield();
  const landOf = await holdBack(hero, path, kn, uE, ctx);
  return { path, pts, bOf, uOfB, landOf, baseLand: pw(kn), uE, uApex, uDesc, uStep, uLow, uJoin: uOf[iJoin], uLap: uOf[Math.max(iLap, iJoin)], uX: uOf[iX], entryX: ex, entryZ: ez + 56, sA, sE: E.s, dirB, plan, length: path.length };
}

// The pour is re-timed while we swing down across the drawing and pull away over its street side (u U_HOLD to a little
// past the end of the run-in). At its plain pace the route overtakes the landing point there and climbs right over
// it, so the gaze had to tip straight down and lost the horizon. Here the pour runs ahead of the plain schedule (up to
// three times its pace) or hangs back (down to half), whichever keeps the burst a good way off and no more than about
// 19 degrees below the horizon as we see it, with the slanting rope clear of the lens and far enough off to be seen
// whole, and the house, the lamps or the ends of the lane behind it rather than the open street. The schedule is found by a small dynamic programme over (u, metres laid); what the line has gained or lost
// it gives back on the way to its closing. kn: the knots [u, metres] of the plain schedule; returns landOf(u).
const U_HOLD = 0.15;
async function holdBack(hero, path, kn, uE, ctx) {
  const base = pw(kn), uA = U_HOLD, uB = uE + 0.03, DU = 0.005, n = Math.round((uB - uA) / DU), Lp = path.length, v = new THREE.Vector3();
  const sA = base(uA), sB = base(uB), nom = (sB - sA) / n, NS = Math.ceil(sB - sA) + 200;
  if (!(n > 4) || !(nom > 1.5) || NS > 1100) return base;
  const cam = new Float32Array((n + 1) * 3), pt = new Float32Array((NS + 81) * 2);
  for (let i = 0; i <= n; i++) { path.posAtDist((uA + i * DU) * Lp, v); cam[i * 3] = v.x; cam[i * 3 + 1] = v.y; cam[i * 3 + 2] = v.z; }
  for (let j = 0; j <= NS + 80; j++) { hero.pointAt(Math.min(hero.L - 0.01, sA + j), v); pt[j * 2] = v.x; pt[j * 2 + 1] = v.z; }
  await ctx.yield();
  const nodeCost = (i, j) => {
    const cx = cam[i * 3], cy = cam[i * 3 + 1], cz = cam[i * 3 + 2], hd = Math.hypot(pt[j * 2] - cx, pt[j * 2 + 1] - cz), pit = Math.atan2(cy - 3, hd) * 57.3;
    let c = 4 * Math.max(0, pit - 19) ** 2 + 0.012 * Math.max(0, hd - 80) ** 2, vis = 0;
    c += 100 * smoothstep(100, 150, Math.abs(Math.atan2(pt[j * 2] - cx, cz - pt[j * 2 + 1]) * 57.3));     // behind the burst we want the house, the lamps or the lane's ends, not the open street
    for (let k = 6; k <= 72; k += 6) {                    // the rope: 60 m up at 72 m of line ahead of the burst; it fades out within 62 m of the lens
      const d = Math.hypot(pt[(j + k) * 2] - cx, k * 0.833 - cy, pt[(j + k) * 2 + 1] - cz);
      if (d < 14) c += 300 * (14 - d);
      if (k % 12 === 0 && k <= 48) vis += smoothstep(28, 62, d) * 0.25;
    }
    return c + 300 * (1 - vis) * (1 - vis);
  };
  const INF = 1e18, d0 = Math.max(1, Math.floor(nom * 0.5)), d1 = Math.ceil(nom * 3), back = [];
  let prev = new Float64Array(NS + 1).fill(INF); prev[0] = 0;
  for (let i = 1; i <= n; i++) {
    const cur = new Float64Array(NS + 1).fill(INF), bk = new Int16Array(NS + 1).fill(-1);
    for (let j = d0; j <= NS; j++) {
      let best = INF, bi = -1;
      for (let d = d0; d <= d1; d++) { const k = j - d; if (k < 0) break; if (prev[k] >= INF) continue; const r = d / nom, c = prev[k] + (r > 1 ? 25 : 60) * (r - 1) * (r - 1); if (c < best) { best = c; bi = k; } }
      if (bi >= 0) { cur[j] = best + nodeCost(i, j); bk[j] = bi; }
    }
    back.push(bk); prev = cur;
    if ((i & 3) === 0) await ctx.yield();
  }
  let bj = -1, bc = INF; for (let j = 0; j <= NS; j++) { const c = prev[j] + 0.6 * Math.abs(sA + j - sB); if (c < bc) { bc = c; bj = j; } }
  if (bj < 0) return base;
  const sch = new Array(n + 1); sch[n] = bj; for (let i = n - 1; i >= 0; i--) sch[i] = back[i][sch[i + 1]];
  // the knots: the plain schedule up to U_HOLD, the new one, a stretch of the way on to the closing; smoothed so that
  // the pour changes pace over a second or so, never at a step
  const out = kn.filter((q) => q[0] < uA - 1e-6), held = [], sEnd = sA + bj, tail = kn.filter((q) => q[0] > uB + 0.065);
  for (let i = 0; i <= n; i++) held.push([uA + i * DU, sA + sch[i]]);
  for (let i = 1; i <= 12; i++) { const u = uB + i * DU; held.push([u, lerp(sEnd, tail[0][1], (u - uB) / (tail[0][0] - uB))]); }
  for (let pass = 0; pass < 6; pass++) { let a = held[0][1]; for (let i = 1; i < held.length - 1; i++) { const b = held[i][1]; held[i][1] = (a + 2 * b + held[i + 1][1]) / 4; a = b; } }
  for (let i = 1; i < held.length; i++) held[i][1] = Math.max(held[i][1], held[i - 1][1] + 0.01);
  return pw(out.concat(held, tail));
}

// ---------------------------------------------------------------------------------------------------
// Shared GLSL. skyCol(d) is the whole sky as a function of direction: the dome draws it, the house front
// dissolves into it with height, and its horizon is exactly the fog colour.
const GLSL_SKY = /* glsl */`
uniform vec3 uZen, uMid, uHor, uBand, uRose; uniform float uWarm, uSunUp;
vec3 skyCol(vec3 d){
  float h = d.y, hl = max(length(d.xz), 1e-4); float east = d.x / hl;          // +1 toward the sun
  float hh = clamp(h, 0., 1.);
  vec3 c = mix(uHor, uMid, smoothstep(0., .24, hh));
  c = mix(c, uZen, smoothstep(.16, .85, hh));
  float e = smoothstep(-.35, 1., east);
  float band = exp(-(hh - .06) * (hh - .06) / .0075) * e * e;
  c = mix(c, uRose, exp(-(hh - .2) * (hh - .2) / .016) * e * e * (.3 + .22 * uWarm));
  c = mix(c, uBand * (.78 + .5 * uWarm), band * (.6 + .38 * uWarm));
  // thin rose streaks low on the right
  float st = vnoise(vec2(atan(d.z, d.x + 1e-4) * 5., hh * 46.)) * .6 + vnoise(vec2(atan(d.z, d.x + 1e-4) * 13. + 3., hh * 120.)) * .4;
  c = mix(c, uRose, smoothstep(.56, .8, st) * smoothstep(.03, .08, hh) * (1. - smoothstep(.13, .24, hh)) * e * e * .55);
  c = mix(c, uHor, 1. - smoothstep(-.01, .035, h));                              // the ground mist
  return c;
}
`;

// One lit material for everything that is not the hero. Geometry comes from F.Geo (position, normal, color,
// aAnim, aPivot). o.vert may move `p` (object space) and `n`; o.frag may change alb, n, gloss, metal, ao, emis.
function propMat(U, o = {}) {
  return new THREE.ShaderMaterial({
    fog: true, side: o.side ?? THREE.DoubleSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? true,
    uniforms: { ...fogU(), ...U, ...(o.uniforms || {}) },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      attribute vec3 color; attribute vec4 aAnim; attribute vec3 aPivot;
      ${o.vpars || ''}
      varying vec3 vW, vN, vC, vL; varying vec4 vA;
      void main(){
        vec3 p = position, n = normal; vec4 A = aAnim;
        #ifdef USE_INSTANCING
          mat4 im = instanceMatrix;
        #else
          mat4 im = mat4(1.);
        #endif
        ${o.vert || ''}
        vec4 wp = modelMatrix * im * vec4(p, 1.);
        vW = wp.xyz; vN = mat3(modelMatrix) * mat3(im) * n; vC = color; vL = p; vA = A;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      uniform float uBandK;
      ${o.fpars || ''}
      varying vec3 vW, vN, vC, vL; varying vec4 vA;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-4);
        float close = 1. - smoothstep(10., 70., dist);
        vec3 alb = vC, emis = vec3(0.); float gloss = ${(o.gloss ?? 0).toFixed(3)}, metal = ${(o.metal ?? 0).toFixed(3)}, ao = 1., alpha = 1., sunK = 1.;
        ${o.frag || ''}
        n = normalize(n + vec3(0., 1e-4, 0.));
        float sun = sunAt(vW) * sunK, nl = max(dot(n, uSunDir), 0.), back = max(-dot(n, uSunDir), 0.);
        vec3 light = skyLight(n);
        light = mix(light, light * vec3(.62, .74, 1.02), sun * back * .8);
        light += uSunCol * nl * 1.3 * sun;
        vec3 col = alb * light * ao;
        vec3 R = reflect(-V, n); float ndv = clamp(dot(V, n), 0., 1.);
        float rh = clamp(R.y, 0., 1.);
        vec3 env = mix(uSkyLow * 1.05, uSkyTop, pow(rh, .5));
        env = mix(env, uHouse * 2., smoothstep(.05, .9, -R.z) * (1. - smoothstep(.08, .4, rh)) * mix(.85, .4, metal));
        env = mix(env, mix(uPeach, uSunCol, .4) * (.8 + .5 * max(uSun, uBandK)), smoothstep(-.1, .9, R.x) * (1. - smoothstep(0., .5, rh)) * .72);     // the peach band
        env = mix(uSkyLow * .3 + uSkyTop * .12 + uPeach * .1, env, smoothstep(-.3, .03, R.y));    // the wet stone below the horizon
        env += (uSkyLow * .35 + uPeach * .3) * exp(-R.y * R.y * 70.) * (.35 + .65 * smoothstep(-.6, .7, R.x));   // and the pale line of the horizon itself
        env += uSunCol * sun * pow(max(dot(R, uSunDir), 0.), 24.) * 2.2;
        float fr = gloss * (.05 + .95 * pow(1. - ndv, 4.));
        col = mix(col, env * ao, fr);
        col = mix(col, alb * mix(env, vec3(dot(env, vec3(.3, .5, .2))) * vec3(1.06, 1., .9), .55) * 1.9 * (.35 + .65 * ao), metal);    // metal keeps its own colour: brass does not go green under a blue sky
        vec3 lampL = vec3(0.);
        ${o.lamps ? 'lampL = lampLight(vW, n); col += alb * lampL * (.4 + .6 * ao) * (1. - .6 * metal);' : ''}
        col += emis;
        gl_FragColor = vec4(max(col, vec3(0.)), alpha);
        ${o.ownFog ? '' : '#include <fog_fragment>'}
        ${o.post || ''}
      }`,
  });
}
const geoMesh = (g, mat, name) => { const geo = g.build(); geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); m.name = name; return m; };
// a sheet over a (u, v) grid: fn(u, v) -> [x, y, z], col(u, v) -> Color; aAnim = (u, v, a2, a3)
function sheet(g, nu, nv, fn, col, a2 = 0, a3 = 0) {
  const start = g.n;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const u = i / nu, w = j / nv, q = fn(u, w); const id = g.v(q[0], q[1], q[2], col(u, w)); g.a[id * 4] = u; g.a[id * 4 + 1] = w; g.a[id * 4 + 2] = a2; g.a[id * 4 + 3] = a3; }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = start + j * (nu + 1) + i; g.quad(a, a + 1, a + nu + 2, a + nu + 1); }
  return [start, g.n];
}
// a lathe about the y axis: prof [[r, y], ...] bottom to top; col(t, ang) -> Color; aAnim = (t, ang/TAU, 0, 0)
function lathe(g, cx, cy, cz, prof, seg, col, wob) {
  const start = g.n, n = prof.length;
  for (let j = 0; j < n; j++) for (let i = 0; i <= seg; i++) {
    const ang = (i / seg) * TAU, t = j / (n - 1), k = wob ? wob(t, ang) : 1;
    const id = g.v(cx + Math.cos(ang) * prof[j][0] * k, cy + prof[j][1], cz + Math.sin(ang) * prof[j][0] * k, col(t, ang));
    g.a[id * 4] = t; g.a[id * 4 + 1] = i / seg;
  }
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < seg; i++) { const a = start + j * (seg + 1) + i; g.quad(a, a + seg + 1, a + seg + 2, a + 1); }
  return [start, g.n];
}

// ---------------------------------------------------------------------------------------------------
// The sky dome: skyCol plus two last stars and the small orange sun that clears the band on the right.
function makeDome(U) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(2600, 40, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: U,
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      ${GLSL_SKY}
      uniform vec3 uSunDisc; uniform float uStars;
      varying vec3 vD;
      void main(){
        vec3 d = normalize(vD); vec3 c = skyCol(d);
        vec3 sd = normalize(vec3(.99, -.035 + .085 * uSunUp, .12)); float g = 1. - dot(d, sd);
        float above = smoothstep(.0, .012, d.y);
        c += uSunDisc * ((1. - smoothstep(.00009, .00016, g)) * 3.2 + exp(-g * 900.) * .9 + exp(-g * 60.) * .22) * above * smoothstep(0., .15, uSunUp);
        vec3 s1 = normalize(vec3(-.32, .7, -.5)), s2 = normalize(vec3(.3, .62, .42));
        float tw = .7 + .3 * sin(uTime * 3.1);
        c += vec3(.8, .88, 1.) * (exp(-(1. - dot(d, s1)) * 90000.) * 2.4 * tw + exp(-(1. - dot(d, s2)) * 120000.) * 1.7 * (1.4 - tw)) * uStars;
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  m.frustumCulled = false; m.renderOrder = -10; m.name = 'kolam-dome';
  return m;
}

// How the house front leaves the picture. It is opaque on every look, a dark cliff wider than any frame, and it has
// depth by tone alone. (1) At its foot the lamps light it: the carved door, its bosses and studs, the dado and the
// plaster beside it keep the colour the flames give them (lampA, the lamps' light at that point; after sunrise the
// sun's too). (2) Above the lamps' reach and from afar, door, jambs, plaster and studs sink into the cliff's own dark
// tone (uCliff, stained in long runs; it takes nothing from the peach band or the rose streaks, so it never looks like
// a pane with the sky in it) and nothing on it is brighter than six tenths of the haze behind it. (3) From about
// 90 m up that tone goes, by colour, into the blue haze that stands before it (the sky of that direction without its
// band), thin bands of mist drift across its face, and by 420 m up, and beyond some 400 m along the street, it IS the
// sky and the mist: there is no edge to see, and no transparency anywhere. Every boundary is a slow billow; the sun's
// edge on it is 140 m wide, never an upright line.
const GLSL_CLIFF = /* glsl */`
uniform vec2 uHz; uniform vec3 uCliff;
vec3 cliff(vec3 c, vec3 W, vec3 V, float dist, float lampA){
  vec3 skyB = skyCol(-V); float hh = clamp(-V.y, 0., 1.);
  vec3 skyP = min(skyB, mix(mix(uHor, uMid, smoothstep(0., .24, hh)), uZen, smoothstep(.16, .85, hh)));     // the sky without its band and streaks
  float lsP = dot(skyP, vec3(.3, .5, .2));
  float sunW = uSun * smoothstep(-70., 70., W.x + .14 * W.z - uSunEdgeX), sunL = sunW * (1. - smoothstep(60., 150., W.y));
  float lampK = smoothstep(.004, .05, lampA), keepK = max(sunL, lampK);
  float bil = vnoise(vec2(W.x * .0042 + 3., W.y * .0065)) * .65 + vnoise(vec2(W.x * .012, W.y * .017 + 7.)) * .35 - .5;
  float hY = W.y + bil * 64., farS = smoothstep(150., 460., dist);
  // stains: long runs down the face and broad damp patches
  float run = vnoise(vec2(W.x * .045 + 2., W.y * .0024)), run2 = vnoise(vec2(W.x * .14 + 9., W.y * .007 + 3.)), damp0 = vnoise(vec2(W.x * .011 + 5., W.y * .009));
  float stain = run * .3 + run2 * .14 + damp0 * .56;
  float rise = smoothstep(26., 240., hY);
  vec3 tone = uCliff * (.68 + .54 * stain) * mix(mix(.6, 1.15, rise), 1., sunL);
  tone *= 1. + vec3(1.5, .8, .25) * sunW * (.25 + .5 * stain);                      // the level sun grazes it
  float lt = dot(tone, vec3(.3, .5, .2));
  tone *= clamp(.6 * lsP / max(lt, 1e-4), .7, 1.); lt = dot(tone, vec3(.3, .5, .2));   // under the sky wherever the sky is pale enough to be under
  c = mix(c, tone * .7 + c * .4, farS * .8 * (1. - .65 * keepK));
  float lh = dot(c, vec3(.3, .5, .2));
  c = mix(c, c * min(1., max(.6 * lsP, lt) / max(lh, 1e-4)), 1. - keepK);                               // (at every height: plaster lit by the sky is never paler than the sky)
  float mg = 72. + 48. * max(sunW, lampK);                                           // (the lit door keeps its carving a little higher)
  c = mix(c, tone, smoothstep(mg, mg + 130., hY + 60. * farS * (1. - .6 * keepK)));
  // mist: slow bands drifting along the face, thickest half way up, thin before the lamp-lit door
  vec2 mq = vec2(W.x * .0025 - uTime * .024, W.y * .021 + bil * 1.5);
  float mb = vnoise(mq) * .58 + vnoise(mq * vec2(2.7, 2.1) + vec2(uTime * .021, 4.)) * .42;
  float band = smoothstep(.56, .82, mb) * smoothstep(70., 190., hY) * (1. - .75 * lampK) * (1. - .5 * sunL);
  vec3 mistC = mix(skyP, uHor, .55) * .9;
  c = mix(c, max(c, mistC), band * .24);
  // along the street the wall goes into the mist from the top down and over a long stretch: its upper face is gone
  // by some 1,050 m, its foot and the step only by 1,750 m (so what stands in the lane, the palms and the pots, stands
  // before a wall that is still faintly there); the boundary billows and drifts with the mist bands. Within the frame
  // of any view across the yard it stays the cold tone of the cliff: it takes the band's colour only as it goes.
  float farD = dist * (1. + .55 * bil + .5 * (mb - .5) * smoothstep(300., 700., dist));
  float hzH = smoothstep(uHz.x - 12., uHz.y - 60., hY), hzD = smoothstep(380., mix(1750., 1050., smoothstep(20., 190., hY)), farD);
  hzH = hzH * (.55 + .45 * hzH) + band * .1 * (1. - hzH);
  float hz = 1. - (1. - hzH) * (1. - hzD);
  return mix(c, mix(skyP, skyB, max(smoothstep(.5, 1., hzH), hzD)), hz);
}`;
const HOUSE_POST = /* glsl */`
      if (vA.x < .5) {                                    // the painted step runs off both ways into the same mist as the wall above it
        gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(skyCol(-V), uHouse * 2., .2), smoothstep(360., 1750., dist));
      } else gl_FragColor.rgb = cliff(gl_FragColor.rgb, vW, V, dist, dot(lampL, vec3(.3, .5, .2)));
      gl_FragColor.a = 1.;`;

// The house: the step with its ochre and white bands, the red-oxide floor on top of it, the carved threshold
// beam, the two door leaves standing ajar and the wall: one opaque dark cliff whose top is lost in the haze by colour.
function makeHouse(U, noise, look) {
  const g = new F.Geo(), w = C('#ffffff');
  const id = (r, k) => g.anim(r, () => [k, 0, 0, 0]);
  const box = (x0, x1, y0, y1, z0, z1, k, nx = 1) => {      // five faces (no bottom), split along x
    const st = g.n;
    for (let i = 0; i < nx; i++) {
      const a = lerp(x0, x1, i / nx), b = lerp(x0, x1, (i + 1) / nx);
      const q = (p) => { const s = g.n; for (const v of p) g.v(v[0], v[1], v[2], w); g.quad(s, s + 1, s + 2, s + 3); };
      q([[a, y0, z1], [b, y0, z1], [b, y1, z1], [a, y1, z1]]); q([[a, y1, z1], [b, y1, z1], [b, y1, z0], [a, y1, z0]]);
      q([[b, y0, z0], [a, y0, z0], [a, y1, z0], [b, y1, z0]]);
      if (i === 0) q([[a, y0, z0], [a, y0, z1], [a, y1, z1], [a, y1, z0]]);
      if (i === nx - 1) q([[b, y0, z1], [b, y0, z0], [b, y1, z0], [b, y1, z1]]);
    }
    return id([st, g.n], k);
  };
  // the step: a profile with a worn, chipped front edge, extruded along x
  const prof = [[STEP_Z, -1], [STEP_Z, 21.6], [STEP_Z - 0.35, 23.1], [STEP_Z - 1.5, STEP_Y], [-300, STEP_Y]], NX = 440, st = g.n;
  for (let i = 0; i <= NX; i++) for (let j = 0; j < prof.length; j++) {
    const x = i === 0 ? -2700 : i === NX ? 2700 : -1100 + (i / NX) * 2200, chip = (j === 1 || j === 2) ? Math.max(0, noise.n2(x * 0.11, j * 3.1) - 0.35) * 2.2 : 0;
    g.v(x, prof[j][1] - chip * (j === 2 ? 0.5 : 1), prof[j][0] - chip * 0.9 + (j < 3 ? noise.n2(x * 0.03, 5) * 0.25 : 0), w);
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < prof.length - 1; j++) { const a = st + i * prof.length + j, b = a + prof.length; g.quad(a, b, b + 1, a + 1); }
  id([st, g.n], 0);
  // the threshold beam: a rope moulding along x (a round back on a square foot)
  const bst = g.n, BS = 10, BN = 100;
  for (let i = 0; i <= BN; i++) for (let j = 0; j <= BS; j++) {
    const x = -125 + (i / BN) * 250, a = (j / BS) * Math.PI, r = 3.0;
    const idv = g.v(x, STEP_Y + Math.sin(a) * r * (j === 0 || j === BS ? 0 : 1), -258 + Math.cos(a) * 3.1, w); g.a[idv * 4 + 1] = j / BS;
  }
  for (let i = 0; i < BN; i++) for (let j = 0; j < BS; j++) { const a = bst + i * (BS + 1) + j, b = a + BS + 1; g.quad(a, b, b + 1, a + 1); }
  for (let i = bst; i < g.n; i++) g.a[i * 4] = 3;
  // door leaves (8 m thick, their inner edges 9 m either side of the axis), jambs, wall, the dark behind the slot
  for (const sx of [-1, 1]) {
    box(sx > 0 ? SLOT : -109, sx > 0 ? 109 : -SLOT, STEP_Y, 430, DOOR_Z - 4, DOOR_Z + 4, 2);
    box(sx > 0 ? 109 : -124, sx > 0 ? 124 : -109, STEP_Y, 430, DOOR_Z - 6, DOOR_Z + 9, 5);
    box(sx > 0 ? 124 : -2700, sx > 0 ? 2700 : -124, STEP_Y, 430, DOOR_Z - 6, DOOR_Z + 2, 1, 4);
  }
  box(-70, 70, STEP_Y, 430, DOOR_Z - 16, DOOR_Z - 15, 4);
  const hib = HIB.map((h) => new THREE.Vector3(h[0], h[1], h[2]));
  const ochre = look === 2 ? '#7b5140' : '#743f36';
  const mat = propMat(U, {
    lamps: true, ownFog: true,
    uniforms: { uHib: { value: hib }, uOxA: { value: C('#5c1f17') }, uOxB: { value: C('#8c3524') }, uLime: { value: C(look === 2 ? '#bdb9a8' : '#b6bac2') },
      uOchre: { value: C(ochre) }, uTeak: { value: C('#7a4c2e') }, uWall: { value: look === 2 ? new THREE.Color(0.16, 0.15, 0.14) : look === 1 ? new THREE.Color(0.14, 0.13, 0.19) : new THREE.Color(0.13, 0.14, 0.19) }, uBrass: { value: C('#b98a34') }, uTurm: { value: C(PAL[5]) }, uVerm: { value: C(PAL[6]) } },
    fpars: GLSL_SKY + GLSL_CLIFF + 'uniform vec3 uHib[5]; uniform vec3 uOxA, uOxB, uLime, uOchre, uTeak, uBrass, uTurm, uVerm, uWall;',
    frag: /* glsl */`
      vec3 P = vW; float k = vA.x;
      float mid = 1. - smoothstep(60., 320., dist);
      if (k < .5) {
        if (n.y > .6) {                                   // the floor on the step: polished red oxide, damp
          float n1 = vnoise(P.xz * .21), n2 = vnoise(P.xz * 1.7), n3 = vnoise(P.xz * 2.9 + 4.);
          alb = mix(uOxA, uOxB, n1 * .6 + n2 * .3) * (.9 + .2 * n3 * close);
          float cr = abs(vnoise(P.xz * .09 + 7.) - .5) + (1. - mid) * .1; alb *= .55 + .45 * smoothstep(0., .014, cr);        // hairline cracks
          vec2 dp = mat2(.8, .6, -.6, .8) * P.xz * .1 + vec2(n1, vnoise(P.xz * .17 + 5.)) * 1.6;
          float du = smoothstep(.42, .9, vnoise(dp + 3.) * .7 + vnoise(mat2(.6, -.8, .8, .6) * dp * 2.1) * .3);                                     // flour trodden in: pale drifts
          alb = mix(alb, uFlour * .5, du * .2);
          vec2 sg = P.xz * .55 + vnoise(P.xz * .6) * 1.5; float sp = step(.955, hash21(floor(sg))) * (1. - smoothstep(.16, .36, length(fract(sg) - .5)));
          alb = mix(alb, uFlour * .75, sp * .8 * (1. - smoothstep(40., 150., dist)));                              // a few spilled clumps
          gloss = .9 * (.7 + .3 * n1) * (1. - .3 * du);
          for (int i = 0; i < 5; i++) { vec2 d = P.xz - uHib[i].xy; ao *= 1. - .6 * exp(-dot(d, d) / (60. * uHib[i].z * uHib[i].z)); }
          ao *= .5 + .5 * smoothstep(0., 6., abs(P.z + 258.) - 3.);
          ao *= .45 + .55 * smoothstep(0., 9., P.z - ${(DOOR_Z + 4).toFixed(1)});
          n = normalize(n + vec3(vnoise(P.xz * .6 + 2.) - .5, 0., vnoise(P.xz * .45 + 8.) - .5) * .035);      // the film lies in broad shallow swells
          // the polished floor mirrors the door, the glow in the slot and the flowers
          vec3 Rf = reflect(-V, n); float rz = min(Rf.z, -1e-3), tz = (${(DOOR_Z + 4).toFixed(1)} - P.z) / rz; vec3 hit = P + Rf * tz;
          float mk = smoothstep(.05, .3, -Rf.z) * (1. - smoothstep(70., 220., hit.y)) * step(0., Rf.y) * smoothstep(${(DOOR_Z + 4).toFixed(1)}, ${(DOOR_Z + 8.5).toFixed(1)}, P.z);
          vec2 dq = vec2(abs(hit.x) - 9., hit.y - 27.); float ry2 = mod(dq.y, 60.), tl2 = step(ry2, 38.), hh2 = mix(11., 19., tl2);
          vec2 df = vec2(abs(fract(dq.x / 25.) - .5) * 25., abs(ry2 - mix(49., 19., tl2)));
          float panel = (1. - smoothstep(8., 11., df.x)) * (1. - smoothstep(hh2 - 4.6, hh2 - 1.6, df.y)), stud = 1. - smoothstep(.8, 3.2, length(df - vec2(12.5, hh2)));
          vec3 mc = uTeak * (.35 + .5 * panel) * (uSkyLow * .9 + uSunCol * sunAt(vW) * .8) + uBrass * stud * (uSkyLow + uSunCol * sunAt(vW)) * .9;
          // the dark of the slot, and the ring's light drawn down the floor as one soft upright streak
          float inSlot = 1. - smoothstep(4., 13., abs(hit.x)), ry = hit.y - 34.;
          mc = mix(mc, vec3(.01, .012, .02), inSlot * .8);
          float streak = exp(-hit.x * hit.x / 30.) * (.85 * exp(-ry * ry / 420.) + .3 * exp(-abs(ry) / 46.)) + .12 * exp(-hit.x * hit.x / 260.) * exp(-abs(ry) / 60.);
          mc += vec3(1., .82, .6) * streak * smoothstep(0., 12., tz);
          vec3 fcol = vec3(.3, .012, .018) * (uSkyLow * .8 + uSunCol * sunAt(vW) * .7);
          for (int i = 0; i < 5; i++) {
            vec3 dC = vec3(uHib[i].x, ${STEP_Y + 3}., uHib[i].y) - P; float tt = max(dot(dC, Rf), 0.); vec3 off = dC - Rf * tt; off.y *= 2.2;
            float bl = exp(-dot(off, off) / (48. * uHib[i].z * uHib[i].z)) * step(tt, 46.); mc = mix(mc, fcol, bl * .9); mk = max(mk, bl * step(0., Rf.y));
          }
          float fres = gloss * (.1 + .9 * pow(1. - clamp(dot(V, n), 0., 1.), 3.));
          emis += mc * mk * fres * ao; gloss *= 1. - .85 * mk;
          float slotK = 1. - smoothstep(${(DOOR_Z + 4).toFixed(1)}, ${(DOOR_Z + 8.5).toFixed(1)}, P.z);                          // in the slot the floor has only the dark behind the door to show
          gloss *= 1. - slotK; alb *= 1. - .75 * slotK;
          // the flames along the edge and on the tall lamp, each a small warm point in the wet with a short tail toward us
          float lg = 0.;
          for (int i = 0; i < 11; i++) {
            vec3 dC = uLamps[i].xyz - P; float tt = max(dot(dC, Rf), 0.); vec3 off = dC - Rf * tt; off.y *= .3;
            lg += uLamps[i].w * exp(-dot(off, off) / 1.6) * step(0., Rf.y);
          }
          emis += uLampCol * lg * fres * 2.2;
        } else {                                          // the riser: lime wash brushed on by hand in upright bands of red ochre and chalk white
          float ph = P.x / 20. + .5, bi = floor(ph), wj = (hash21(vec2(bi, 3.)) - .5) * .3;          // every band its own width
          float brush = (vnoise(vec2(P.x * .5, P.y * .22)) - .5) * .09 + (vnoise(vec2(P.x * 2.3, P.y * .35 + 7.)) - .5) * .05;   // the edge wanders with the brush
          float tri = abs(fract((ph + wj) * .5 + brush * .5) - .5) * 2.;
          float bth = mix(.5, .76, hash21(vec2(floor(ph * .5), 9.)));                                    // some ochre bands a hand wide, some two
          float band = smoothstep(bth - .022, bth + .022, tri + (vnoise(vec2(P.x * 5., P.y * 1.3)) - .5) * .05);
          float thin = vnoise(vec2(P.x * 1.1, P.y * .09 + bi * 3.7)), drag = vnoise(vec2(P.x * 3.7, P.y * .16));                 // wash dragged thin, bristle streaks
          vec3 lime = uLime * (.66 + .3 * vnoise(P.xy * .3) + .1 * drag), och = uOchre * (.62 + .5 * vnoise(P.xy * .45 + 3.) + .2 * drag);
          och = mix(och, lime * .8, smoothstep(.66, .95, thin) * .28);                                  // the white shows through where the ochre is thin
          lime = mix(lime, och * 1.1, smoothstep(.7, .95, vnoise(vec2(P.x * .8 + 30., P.y * .11))) * .22);                        // and ochre has run into the white
          alb = mix(lime, och, band) * (.88 + .2 * vnoise(vec2(P.x * 6., P.y * .5)));
          alb = mix(alb, mix(lime, och, .5), smoothstep(260., 900., dist) * .4);                        // far along the street the bands soften into each other
          float damp = 1. - smoothstep(0., 9., P.y + vnoise(vec2(P.x * .13, 2.)) * 7. - 2.);                                      // rising damp at the foot: darker, greener
          alb = mix(alb, alb * vec3(.4, .46, .42), damp * .85);
          float cn = vnoise(vec2(P.x * .35, P.y * .6) + 11.) * .6 + vnoise(vec2(P.x * 1.9, P.y * 2.3)) * .25 + vnoise(vec2(P.x * 7., P.y * 8.)) * .15;
          float chip = smoothstep(.6, .66, cn) * max(smoothstep(17.5, 23.5, P.y), (1. - smoothstep(.5, 4.5, P.y)) * .7);        // flaked to the grey stone along the top edge and the foot
          alb *= 1. - .22 * smoothstep(.0, .3, abs(P.y - 20.2)) * (1. - smoothstep(.3, .6, abs(P.y - 20.2)));
          alb = mix(alb, vec3(.15, .16, .18) * (.7 + .6 * vnoise(P.xy * 2.1)), chip);
          n = normalize(n + vec3(vnoise(P.xy * 1.3) - .5, vnoise(P.xy * 1.3 + 9.) - .5, 0.) * .25 * mid);
          ao *= .5 + .5 * smoothstep(0., 6., P.y);
          gloss = .35 * damp;
        }
      } else if (k < 1.5) {                               // the wall: lime wash, a dado of ochre stripes, stains
        float band = (1. - smoothstep(62. + 2. * vnoise(vec2(P.x * .21, 1.)), 65. + 2. * vnoise(vec2(P.x * .21, 1.)), P.y)) * (.82 + .18 * vnoise(vec2(P.x * .4, P.y * .1)));   // a hand-painted dado of red oxide
        float stain = vnoise(vec2(P.x * .05, P.y * .012)) * .6 + vnoise(P.xy * .2) * .4, run = mix(.5, vnoise(vec2(P.x * .33, P.y * .008)), mid);      // (the fine runs are for near views: from the street they would read as rain)
        vec3 plaster = uWall * (.5 + .75 * stain) * (.75 + .35 * run) * (.8 + .3 * vnoise(P.xy * 1.1) * mid);
        plaster *= .86 + .28 * vnoise(vec2(P.x * .023 + 4., P.y * .05));                // (no courses: only the trowel's slow unevenness)
        alb = mix(plaster, uOchre * (.34 + .3 * stain) * (.8 + .3 * run), band);
        float ly = P.y - 1.2 * (vnoise(vec2(P.x * .06, 3.)) - .5) - .5 * (vnoise(vec2(P.x * .4, 8.)) - .5);
        float lineW = smoothstep(66., 67.4, ly) * (1. - smoothstep(69.2, 70.8, ly)) * smoothstep(.3, .62, vnoise(vec2(P.x * .045 + 20., 1.)));   // a chalk line above it, drawn by hand and half worn away
        alb = mix(alb, uLime * (.3 + .25 * stain), lineW * .4);
        ao *= .6 + .4 * smoothstep(${STEP_Y}., ${STEP_Y + 14}., P.y);
        // the level sun grazes the plaster beside the door: peach at its foot, fading with height; its edge is 140 m wide
        float sunP = uSun * smoothstep(-70., 70., P.x + .14 * P.z - uSunEdgeX);
        vec3 warmA = mix(alb, vec3(dot(alb, vec3(.3, .5, .2))) * vec3(1.25, .95, .7), .55);
        emis += warmA * uSunCol * sunP * ((.2 + .4 * stain) + 1.5 * exp(-max(P.y - ${STEP_Y}., 0.) / 95.) * (.7 + .5 * run)) * ao;
      } else if (k < 2.5 || (k > 4.5 && k < 5.5)) {       // the door and its frame: dark teak, framed panels
        vec2 q = vec2(abs(P.x) - 9., P.y - 27.); float ry = mod(q.y, 60.), tall = step(ry, 38.), hh = mix(11., 19., tall);
        vec2 f = vec2(abs(fract(q.x / 25.) - .5) * 25., abs(ry - mix(49., 19., tall)));
        float inPanel = (1. - smoothstep(9.2, 9.8, f.x)) * (1. - smoothstep(hh - 3.4, hh - 2.8, f.y));
        float groove = (smoothstep(9., 9.6, f.x) * (1. - smoothstep(9.8, 10.6, f.x)) * step(f.y, hh - 2.2) + smoothstep(hh - 3.6, hh - 3., f.y) * (1. - smoothstep(hh - 2.8, hh - 2., f.y)) * step(f.x, 10.4)) * step(k, 2.5);
        float vert = 1. - step(hh - 2.4, f.y);                                         // grain runs up the panels and stiles, along the rails
        float pid = hash21(vec2(floor(q.x / 25.) + 9. * step(0., P.x), floor(q.y / 60.) * 2. + tall));
        float loz = f.x / 7.4 + f.y / 5., lozE = (1. - tall) * step(k, 2.5) * (1. - smoothstep(0., .14, abs(loz - 1.)));   // the short panels carry a carved lozenge
        vec2 gq = mix(vec2(P.y * .9, P.x * .06), vec2(P.x * .9, P.y * .06), vert);
        float grain = vnoise(gq) * .6 + vnoise(gq * vec2(3., 1.) + 4.) * .4;
        alb = uTeak * (.55 + .9 * grain) * (1. - .7 * groove) * (.8 + .3 * inPanel) * (.8 + .4 * pid) * (1. - .55 * lozE) * (1. + .25 * (1. - tall) * step(loz, .86));
        alb *= .6 + .4 * smoothstep(${STEP_Y}., ${STEP_Y + 20}., P.y);
        gloss = .3; if (abs(n.x) > .7) { alb *= .35; gloss = 0.; ao *= .4; }
      } else if (k < 3.5) {                               // the beam: a carved rope with turmeric and vermilion dots
        float tw = fract(P.x / 5.2 + vA.y * 1.6);
        float rope = abs(tw - .5) * 2.;
        alb = uTeak * 1.5 * (.5 + .7 * rope) * (.8 + .4 * vnoise(vec2(P.x * 2., vA.y * 9.)));
        n = normalize(n + vec3((tw - .5) * 1.1, 0., 0.) * (1. - .5 * rope));
        float dx = fract(P.x / 9.) - .5, dc = length(vec2(dx * 9., (vA.y - .5) * 9.4));
        float dotm = (1. - smoothstep(1.05, 1.3, dc)) * smoothstep(24., 46., dist), which = step(.5, fract(floor(P.x / 9.) * .5));     // (the painted dots fade as the lens passes over the beam: the last metres show the carved rope alone)
        alb = mix(alb, mix(uTurm, uVerm, which) * (.8 + .3 * vnoise(P.xz * 3.)), dotm);
        gloss = .25 * (1. - dotm); ao *= .7 + .3 * rope;
      } else if (k < 4.5) { alb = vec3(.004, .005, .01); sunK = 0.; }
      else { alb = uBrass; metal = .9; }
      `,
    post: HOUSE_POST,
  });
  const mesh = geoMesh(g, mat, 'kolam-house');
  return mesh;
}

// ---------------------------------------------------------------------------------------------------
// Props on the stone. Each returns meshes to add; all lit by propMat.
function spline(keys, n) {         // smooth [r, y] profile through key points
  const c = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(k[0], k[1], 0)), false, 'centripetal'), out = [];
  for (let i = 0; i <= n; i++) { const p = c.getPoint(i / n); out.push([Math.max(0, p.x), p.y]); }
  return out;
}

// The brass water pot in the drawing's south-west corner (the brief's pot, a little larger): hammered brass that is
// mostly a dark warm mirror. Its belly shows the wet ground below a bright horizon line and the dawn sky above it,
// every hammer mark tilting that picture a little; the rolled rim is rubbed bright; the peach of the eastern band runs
// down its sunward flank; the lamps on the step stand in it as a row of small warm points; drips run down it.
// Round it a shallow puddle: a smoother sheet of the same sky, with slow rings from the drips as soft pale ripples.
const GLSL_POT_ENV = /* glsl */`
uniform float uBandK;          // how far the eastern band has grown (0..1): the brass shows it long before the sun is up
vec3 potEnv(vec3 R){
  float hl = max(length(R.xz), 1e-4), east = R.x / hl, north = -R.z / hl, up = R.y, upc = clamp(up, 0., 1.);
  vec3 warm = mix(uPeach, uSunCol, .35);
  vec3 sky = mix(uSkyLow * 1.05, uSkyTop * .9, pow(upc, .55));
  sky = mix(sky, uHouse * 2.4, smoothstep(.1, .8, north) * (1. - smoothstep(.1, .5, upc)) * .9);          // the dark house front
  sky = mix(sky, warm * (1.2 + .6 * max(uSun, uBandK)), smoothstep(-.1, .75, east) * (1. - smoothstep(.03, .46, upc)) * .92);   // the peach band
  vec3 gnd = (uSkyLow * .24 + uSkyTop * .1) * (.5 + .5 * smoothstep(-1., -.08, up));                     // wet stone, darker toward our feet
  gnd = mix(gnd, warm * .42, smoothstep(.15, .9, east) * smoothstep(-.55, -.02, up) * .65);
  vec3 c = mix(gnd, sky, smoothstep(-.16, .2, up));
  c += (uSkyLow * .3 + uPeach * .2) * exp(-up * up * 34.) * (.35 + .65 * smoothstep(-.6, .7, east));   // the bright line of the horizon
  return c;
}`;
function makePot(U, noise) {
  const g = new F.Geo(), brass = C('#b08a3a'), [px, , pz] = POT, S = POT_S;
  const prof = spline([[4.6, 0], [7.6, 0.7], [10.6, 4.6], [12, 10.5], [11.2, 16], [8.4, 20.2], [6.3, 22.8], [6.1, 24.4], [7.7, 26.6], [9.3, 27.7], [9.1, 28.1], [7.7, 27.5], [6.9, 25.8]], 44).map((q) => [q[0] * S, q[1] * S]);
  lathe(g, px, 0, pz, prof, 72, () => brass, (t, a) => 1 + 0.01 * noise.n2(Math.cos(a) * 3 + t * 9, Math.sin(a) * 3));
  const wr = lathe(g, px, 25.3 * S, pz, [[0, 0], [3.5 * S, 0.02], [6.6 * S, 0.05]], 32, () => brass);     // the water inside
  for (let i = wr[0]; i < wr[1]; i++) g.a[i * 4 + 2] = 1;
  const geo = g.build(); geo.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), ...U, uPotC: { value: new THREE.Vector3(px, 28 * S, pz) }, uBrassC: { value: new THREE.Color(0.86, 0.56, 0.2) }, uBeak: { value: new THREE.Vector2(px + Math.sin(RIM_B) * 2.5, pz - Math.cos(RIM_B) * 2.5) } },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      attribute vec4 aAnim; varying vec3 vW, vN; varying vec4 vA;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * normal; vA = aAnim;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${GLSL_POT_ENV}
      uniform vec3 uPotC, uBrassC; uniform vec2 uBeak; uniform float uLampK;
      varying vec3 vW, vN; varying vec4 vA;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-4);
        float t = vA.x, a = vA.y, h = vW.y, top = uPotC.y;
        vec3 col;
        if (vA.z > .5) {                                   // the water: a dark mirror, ringed where the sparrow drinks
          vec2 dq = vW.xz - uBeak; float rr = length(dq), wv = sin(rr * 2.6 - uTime * 3.4) * exp(-rr * .22);
          vec3 nw = normalize(vec3(dq.x, 0., dq.y) / max(rr, .2) * wv * .1 + vec3(0., 1., 0.));
          vec3 Rw = reflect(-V, nw); float fw = .08 + .92 * pow(1. - clamp(dot(V, nw), 0., 1.), 4.);
          col = mix(uBrassC * uBrassC * .05 * uSkyLow, potEnv(Rw), fw) * (.75 + .25 * smoothstep(0., 5., length(vW.xz - uPotC.xz)));
        } else {
          vec3 nh = normalize(vec3(n.x, 0., n.z) + vec3(1e-4, 0., 0.)), T = vec3(-nh.z, 0., nh.x), B = normalize(cross(n, T) + vec3(0., 1e-4, 0.));
          // hammer marks: the mirror is not true. Thousands of shallow blows have left it gently dented, so what it
          // shows swims a little from mark to mark; no mark has an edge
          vec2 hq = vec2(a * 88., h * 1.02);
          float bodyK = 1. - smoothstep(.5, .6, t), detail = 1. - smoothstep(130., 360., dist);
          vec2 dent = vec2(vnoise(hq) - .5, vnoise(hq + 17.3) - .5) * .24 + vec2(vnoise(hq * 2.3 + 9.) - .5, vnoise(hq * 2.3 + 41.) - .5) * .13 + vec2(vnoise(hq * .31 + 5.) - .5, vnoise(hq * .31 + 31.) - .5) * .1;
          float hr = vnoise(hq * 1.9 + 3.);
          vec3 nd = normalize(n + (T * dent.x + B * dent.y) * bodyK * detail);
          float ndv = clamp(dot(V, nd), 0., 1.);
          vec3 R = reflect(-V, nd), Rs = reflect(-V, n);
          float tarn = .66 + .4 * vnoise(vec2(a * 22., h * .22)) + .12 * (hr - .5) * detail;
          vec3 tint = mix(uBrassC, vec3(1., .93, .8), pow(1. - ndv, 5.) * .5);
          col = potEnv(R) * tint * tarn * .4 * (1. + .3 * smoothstep(.55, .9, vnoise(hq * 2.6 + 50.)) * bodyK * detail);                                            // dark: old brass keeps a third of what it is shown
          col += uBrassC * skyLight(n) * .035 * tarn;                                   // and scatters a little
          col *= .45 + .55 * smoothstep(0., 9., h);                                     // tarnish and splash at the foot
          // the rolled rim, rubbed bright by hands: a thin line of the whole sky
          float rimK = smoothstep(26.9, 27.45, h / ${S.toFixed(2)});
          vec3 rimC = (potEnv(Rs) * 1.1 + uSkyLow * .5 + uPeach * .32) * mix(uBrassC, vec3(1.), .26) * (.85 + .3 * vnoise(vec2(a * 40., 3.)));
          col = mix(col, rimC, rimK * .9);
          col += (uSkyLow + uPeach * .5) * pow(1. - clamp(dot(V, n), 0., 1.), 2.) * rimK * .35 * mix(uBrassC, vec3(1.), .5);
          // the peach of the eastern band, a streak down the flank that faces it
          vec3 Vc = normalize(vec3(cameraPosition.x - uPotC.x, 0., cameraPosition.z - uPotC.z) + vec3(1e-4, 0., 0.));
          float sx = dot(nh, vec3(Vc.z, 0., -Vc.x)), sz = dot(nh, Vc);                  // across the pot as we see it, and toward us
          float rl = max(length(Rs.xz), 1e-3), re = max(Rs.x / rl, 0.);
          float flank = pow(re, 22.) * smoothstep(.04, .16, t) * (1. - smoothstep(.5, .62, t)) * (.55 + .45 * (1. - smoothstep(.2, .8, abs(Rs.y))));
          col += mix(uPeach, uSunCol, .3) * flank * (.6 + .4 * max(uSun, uBandK)) * (.7 + .6 * hr) * mix(uBrassC, vec3(1.), .25) * 1.15;
          // the lamps of the step, a row of small warm points across the belly
          float ty = n.y - .2, lamps = 0.;
          for (int i = 0; i < 11; i++) {
            float lx = clamp(uLamps[i].x / 134., -1., 1.), sc = .1 + .5 * lx, big = step(9.5, float(i));
            float dx2 = (sx - sc) * (sx - sc) + ty * ty * 1.6;
            lamps += min(uLamps[i].w, 1.6) * exp(-dx2 * mix(2200., 900., big)) * step(0., sz);
          }
          col += uLampCol * lamps * 4.2 * uLampK;
          // drips: a wet track down every other flute, a bead of sky at its head
          float colm = floor(a * 46.), ch = hash21(vec2(colm, 3.)), fa = abs(fract(a * 46.) - .5);
          float dy = fract(ch * 7. - uTime * (.03 + .045 * ch)), tq = t * .86;
          float trail = (1. - smoothstep(0., .2, fa)) * step(.45, ch) * smoothstep(dy - .22, dy, tq) * step(tq, dy) * bodyK;
          float bead = (1. - smoothstep(0., .3, length(vec2(fa * 1.6, (tq - dy) * 26.)))) * step(.45, ch) * bodyK;
          col *= 1. + .35 * trail; col += (uSkyLow * .9 + uPeach * .25) * bead * .7;
          col *= 1. - .3 * smoothstep(19., 21.5, h / ${S.toFixed(2)}) * (1. - rimK);         // the neck sits in the shade of the rim
          if (!gl_FrontFacing) col *= .25;                                               // inside the neck
          col += uSunCol * sunAt(vW) * (pow(max(dot(R, uSunDir), 0.), 70.) * 1.6 + max(dot(n, uSunDir), 0.) * .16) * uBrassC;
        }
        gl_FragColor = vec4(max(col, vec3(0.)), 1.);
        #include <fog_fragment>
      }`,
  });
  const pot = new THREE.Mesh(geo, mat); pot.name = 'kolam-pot';
  // the puddle
  const rg = new THREE.CircleGeometry(34, 56); rg.rotateX(-Math.PI / 2); rg.translate(px, 0.07, pz);
  const rings = new THREE.Mesh(rg, new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, uniforms: { ...fogU(), ...U, uC: { value: new THREE.Vector2(px, pz) }, uPotR: { value: new THREE.Vector2(12 * S, 28 * S) }, uBrassC: { value: new THREE.Color(0.86, 0.56, 0.2) } },
    vertexShader: /* glsl */`#include <fog_pars_vertex>
      varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`#include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${GLSL_POT_ENV}
      uniform vec2 uC, uPotR; uniform vec3 uBrassC; varying vec3 vW;
      void main(){
        vec2 d = vW.xz - uC; float r = length(d), ang = atan(d.y, d.x + 1e-4);
        float lobe = 5. * vnoise(vec2(cos(ang), sin(ang)) * 1.7 + 4.) + 2.5 * vnoise(vec2(cos(ang), sin(ang)) * 5. + 9.);
        float edge = 1. - smoothstep(14.5 + lobe, 23. + lobe, r);
        // slow rings from where the drips fall: a height and its slope along the ring's radius
        vec2 slope = vec2(0.);
        for (int i = 0; i < 4; i++) {
          float fi = float(i), cyc = uTime * .2 + fi * .27, ph = fract(cyc), a0 = fi * 1.7 + floor(cyc) * 2.4;
          vec2 c = vec2(cos(a0), sin(a0)) * uPotR.x * 1.08, q = d - c; float rr = length(q), front = ph * 15., x = rr - front;
          float amp = exp(-x * x * .1) * (1. - ph) * (1. - ph) * smoothstep(0., 1.5, rr);
          slope += q / max(rr, .3) * cos(x * 1.3) * amp * 1.5;
        }
        slope += (vec2(vnoise(vW.xz * .8 + uTime * .15), vnoise(vW.xz * .8 + 7. - uTime * .13)) - .5) * .25;    // the film is never quite still
        vec3 V = normalize(cameraPosition - vW), n = normalize(vec3(-slope.x * .11, 1., -slope.y * .11));
        vec3 R = reflect(-V, n); R.y = abs(R.y);
        float F = .2 + .8 * pow(1. - clamp(dot(V, n), 0., 1.), 3.);
        vec3 col = potEnv(R) * .52;
        // the pot stands in it: a dark warm column toward us, its bright rim at the far end
        float rl = max(length(R.xz), 1e-4); vec2 rd = R.xz / rl; float al = dot(-d, rd), lat = abs(d.x * rd.y - d.y * rd.x);
        float hy = max(al, 0.) * R.y / rl, inPot = (1. - smoothstep(uPotR.x * .72, uPotR.x * 1.02, lat)) * step(0., al) * (1. - smoothstep(uPotR.y * .92, uPotR.y * 1.02, hy));
        vec3 potC = uBrassC * (uSkyLow * .16 + uPeach * .1) * (.6 + .8 * smoothstep(uPotR.y * .5, uPotR.y, hy)) + (uSkyLow * .5 + uPeach * .2) * uBrassC * smoothstep(uPotR.y * .86, uPotR.y * .93, hy);
        col = mix(col, potC, inPot * .8);
        float shade = 1. - smoothstep(uPotR.x * .8, uPotR.x * 1.35, r);                 // contact shade at the foot
        col *= 1. - .55 * shade;
        float lip = smoothstep(12. + lobe, 18.5 + lobe, r) * edge;                       // the film's raised edge takes a soft line of sky
        col += uSkyLow * lip * .2;
        col += uSunCol * sunAt(vW) * pow(max(dot(reflect(-V, n), uSunDir), 0.), 60.) * 1.5;
        col += uSkyLow * .2 * clamp(dot(slope, normalize(vec2(.4, -1.))), 0., 1.);                   // the far face of each ripple takes the sky
        gl_FragColor = vec4(max(col, vec3(0.)), edge * clamp(F * .62 + .14 + shade * .5, 0., .9));
        #include <fog_fragment>
      }`,
  }));
  rings.renderOrder = 1; rings.name = 'kolam-pot-rings';
  return [pot, rings];
}

// The coconut-shell bowl heaped with flour, the rib broom along the street edge, the incense stick, the neem leaflet.
function makeYardThings(U, noise, rng, entryX, beads) {
  const g = new F.Geo(), [bx, , bz] = BOWL;
  const shell = C('#3b2a1c'), shell2 = C('#6b5236'), flour = C(PAL[3]).multiplyScalar(0.86);
  // bowl: aAnim.z = 1 shell, 2 flour, 3 broom rib, 4 cord, 5 stick, 6 ash, 7 leaf
  const tag = (r, k) => { for (let i = r[0]; i < r[1]; i++) g.a[i * 4 + 2] = k; return r; };
  tag(lathe(g, bx, 0, bz, spline([[2.2, 0], [5.4, 0.9], [8.6, 3.8], [10, 7.6], [10.1, 9], [9.5, 9.1], [9.2, 8.2]], 18), 40,
    (t, a) => shell.clone().lerp(shell2, 0.5 + 0.5 * noise.n2(a * 2.2, t * 3)), (t, a) => 1 + 0.03 * noise.n2(Math.cos(a) * 2, Math.sin(a) * 2 + t * 2)), 1);
  tag(lathe(g, bx, 8.2, bz, spline([[0, 4.6], [2.2, 4.2], [5, 2.6], [7.6, 0.9], [9.3, 0]], 12).reverse(), 40,
    () => flour, (t, a) => 1 + 0.05 * noise.n2(Math.cos(a) * 3, Math.sin(a) * 3 + t * 5)), 2);
  // broom: 44 pale ribs bound with cord at the left, fanned along the street edge. The fan's end is a ragged arc:
  // the middle ribs are the longest, the outer ones a third shorter, and every few ribs one is worn short
  const rib = C('#ead9a4'), rib2 = C('#a88c52'), cord = C('#7a5a30');
  for (let i = 0; i < 44; i++) {
    const f = (i + 0.5) / 44 - 0.5, len = 150 * (0.82 + 0.18 * rng()) * (1 - 1.36 * f * f) * (i % 5 === 2 ? 0.86 : 1), pts = [], rad = [];
    const z1 = BROOM[1] + f * 62 + (rng() - 0.5) * 3, lift = 0.45 + (i % 3) * 0.4, bowz = (rng() - 0.5) * 5;
    for (let k = 0; k <= 7; k++) {
      const t = k / 7, x = BROOM[0] - len * t, spread = smoothstep(0.05, 0.75, t);
      pts.push([x, lerp(2.6 + (i % 4) * 0.6, lift * (1 - 0.6 * t) + 0.3, smoothstep(0, 0.35, t)), lerp(BROOM[1] + f * 5, z1, spread) + Math.sin(t * Math.PI) * bowz]);
      rad.push(lerp(0.42, 0.16, t));
    }
    tag(g.tube(pts, rad, 5, rib.clone().lerp(rib2, (i % 2) * 0.45 + rng() * 0.4), rib2), 3);
  }
  for (let k = 0; k < 3; k++) {         // three turns of cord round the bundle
    const pts = []; for (let j = 0; j <= 12; j++) { const a = (j / 12) * TAU; pts.push([BROOM[0] - 7 - k * 7 - j * 0.12, 3.4 + Math.sin(a) * 3.3, BROOM[1] + Math.cos(a) * 4.6]); }
    tag(g.tube(pts, 0.5, 5, cord, cord), 4);
  }
  // incense stick with its ash
  const [ix, iy, iz] = INCENSE;
  tag(g.tube([[ix + 1.2, iy - 0.2, iz], [ix + 0.6, iy + 16, iz], [ix, iy + 33, iz]], [0.42, 0.4, 0.36], 6, C('#5a3a26'), C('#3a2a22')), 5);
  tag(g.tube([[ix, iy + 33, iz], [ix - 0.25, iy + 37, iz + 0.1], [ix - 0.4, iy + 40, iz + 0.2]], [0.36, 0.4, 0.3], 6, C('#8d8f96'), C('#b8bcc4')), 6);      // the ash, and at its foot the ember
  // neem leaflet by the entry: saw-edged, a bead of water at each tooth
  const lx = entryX - 13, lz = 131, yaw = 0.75, cy = Math.cos(yaw), sy = Math.sin(yaw), leafA = C('#2f5a26'), leafB = C('#6f8f3a');
  const leafPt = (u, w) => {
    const saw = 1 + 0.2 * (((u * 9) % 1) - 0.5), half = 2.5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.93 + 0.04)), 0.7) * saw;
    const X = (u - 0.5) * 14, Z = (w * 2 - 1) * half + Math.sin(u * 3) * 0.9, Y = 0.25 + 1.7 * u * u * u + 0.5 * Math.abs(w * 2 - 1) + 0.35 * Math.sin(u * 7);
    return [lx + X * cy - Z * sy, Y, lz + X * sy + Z * cy];
  };
  tag(sheet(g, 36, 6, leafPt, (u, w) => leafA.clone().lerp(leafB, 0.25 + 0.5 * u + 0.3 * Math.abs(w - 0.5))), 7);
  for (let k = 0; k < 9; k++) for (const w of [0, 1]) { const q = leafPt((k + 0.48) / 9, w); beads.push([q[0], q[1] - 0.25, q[2], 0.55 + 0.3 * rng()]); }
  const mesh = geoMesh(g, propMat(U, {
    vert: 'if (A.z > 2.5 && A.z < 6.5) { vec3 wq = (modelMatrix * vec4(p, 1.)).xyz; float dq = length(cameraPosition - wq); p += n * max(0., dq * (A.z < 4.5 ? .0027 : .0021) - (A.z < 4.5 ? .16 : .3)); }',      // ribs, cord, stick and ash keep two pixels of width at any distance
    frag: /* glsl */`
      float k = vA.z;
      if (k < 1.5) {                              // coconut shell: fibres running pole to rim
        float fib = vnoise(vec2(vA.y * 190., vA.x * 5.)) * .6 + vnoise(vec2(vA.y * 60., vA.x * 22.)) * .4;
        alb *= .45 + 1.1 * fib; n = normalize(n + vec3(fib - .5) * .35); ao *= .5 + .5 * smoothstep(0., 5., vW.y);
      } else if (k < 2.5) {                       // the heap of flour, finger grooves round it
        float gr = sin(vA.y * 6.2832 * 3. + vA.x * 16.) * .5 + .5;
        alb *= .8 + .2 * gr + .1 * vnoise(vL.xz * 4.); n = normalize(n + vec3(0., (gr - .5) * .5, 0.)); ao *= .7 + .3 * vA.x;
      } else if (k < 3.5) { alb *= .82 + .3 * vnoise(vec2(vL.x * .35, vL.z * 3.)); n = normalize(n + vec3(0., 1.4, 0.)); ao *= .8 + .2 * smoothstep(0., 1.6, vW.y); alb = mix(alb, vec3(dot(alb, vec3(.3, .5, .2))) * vec3(.98, 1., 1.06), .4 * (1. - uSun)); emis += alb * (uSkyLow * (.24 + .08 * uSun) + uSunCol * sunAt(vW) * .5); }      // pale straw: lighter than the ground under it; ash-pale in the blue hour, warm in the sun
      else if (k < 4.5) { alb *= .6 + .7 * step(.5, fract(vL.x * 1.2 + vL.y * .9)); }
      else if (k < 5.5) { alb *= .7 + .4 * vnoise(vL.xy * 3.); }
      else if (k < 6.5) { float e = 1. - smoothstep(.2, .9 + dist * .003, abs(vW.y - ${(INCENSE[1] + 33.5).toFixed(1)})); alb *= .8 + .4 * vnoise(vL.xy * 5.); emis += vec3(3.4, .82, .1) * e * (.8 + .2 * sin(uTime * 2.3)); }      // grey ash, and the one orange ember point
      else {                                      // leaf: midrib and side veins, waxy
        float mr = 1. - smoothstep(.0, .05, abs(vA.y - .5)), sv = 1. - smoothstep(.0, .12, abs(fract(vA.x * 9. - abs(vA.y - .5) * 1.4) - .5));
        alb *= 1. + .5 * mr + .22 * sv; gloss = .5; ao *= .6 + .4 * smoothstep(0., 1.2, vW.y);
      }`,
  }), 'kolam-yard-things');
  return mesh;
}

// The ribbon of incense smoke, 100 m long, curling as it climbs.
function makeSmoke(U) {
  const geo = new THREE.PlaneGeometry(1, 1, 2, 80); geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U, uBase: { value: new THREE.Vector3(INCENSE[0] - 0.4, INCENSE[1] + 40, INCENSE[2] + 0.2) } },
    vertexShader: /* glsl */`#include <fog_pars_vertex>
      ${GLSL_COMMON}
      uniform vec3 uBase; varying vec2 vQ; varying vec3 vW;
      void main(){
        float h = position.y, c = position.x * 2.;
        vec3 p = uBase + vec3(0., h * 100., 0.);
        float am = h * h * 26. + h * 3.;
        p.x += (sin(h * 9. - uTime * .9) * .6 + sin(h * 21. - uTime * 1.7) * .25) * am - h * 14.;
        p.z += (cos(h * 7. - uTime * .7) * .6 + sin(h * 17. - uTime * 1.3) * .3) * am;
        vec3 toCam = normalize(cameraPosition - p), side = normalize(cross(vec3(0., 1., 0.), toCam) + vec3(1e-4, 0., 0.));
        float wd = .5 + h * 9. + max(0., length(cameraPosition - p) * .0022 - .5);
        p += side * c * wd; vQ = vec2(c, h); vW = p;
        vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`#include <fog_pars_fragment>
      ${GLSL_COMMON}
      varying vec2 vQ; varying vec3 vW;
      void main(){
        float st = vnoise(vec2(vQ.x * 3. + vQ.y * 9., vQ.y * 30. - uTime * 1.2));
        float a = (1. - vQ.x * vQ.x) * (.35 + .65 * st) * smoothstep(0., .03, vQ.y) * (1. - smoothstep(.45, 1., vQ.y)) * .55;
        vec3 col = uSkyLow * .95 + uSunCol * sunAt(vW) * .7;
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  }));
  m.frustumCulled = false; m.renderOrder = 3; m.name = 'kolam-smoke';
  return m;
}

// Five red hibiscus laid on the step: veined, ruffled petals that shiver, a pale column dusted with pollen and
// tipped with five red pads. aAnim = (u, w, part, phase); part 1 petal, 2 column, 3 anther, 4 pad, 5 calyx.
async function makeHibiscus(U, rng, beads, ctx) {
  const g = new F.Geo(), tops = [];
  const throat = C('#24040a'), red = C('#7a0b20'), rim = C('#b0263a'), cream = C('#e6c7b2'), cream2 = C('#f1ddc8'), pollen = C('#e2b23c'), pad = C('#8a1220'), green = C('#3f6a2c');
  const tag = (r, k, ph) => { for (let i = r[0]; i < r[1]; i++) { g.a[i * 4 + 2] = k; g.a[i * 4 + 3] = ph; } return r; };
  for (let fi = 0; fi < HIB.length; fi++) {
    const H = HIB[fi];
    const fx0 = H[0], fz0 = H[1], inner = H[2] > 1.2;
    const yaw = rng() * TAU, ph = fi * 1.7, tiltX = (rng() - 0.5) * 0.12, tiltZ = (rng() - 0.5) * 0.12, scl = H[2] * (0.97 + 0.06 * rng());
    // the two flowers we pass between lie tipped over, faces turned to our track and up the yard
    const upv = inner ? [-Math.sign(fx0) * 0.5, 0.74, 0.45] : [tiltX, 1, tiltZ], ul = Math.hypot(upv[0], upv[1], upv[2]); upv[0] /= ul; upv[1] /= ul; upv[2] /= ul;
    const zv = [-upv[0] * upv[2], -upv[1] * upv[2], 1 - upv[2] * upv[2]], zl = Math.hypot(zv[0], zv[1], zv[2]); zv[0] /= zl; zv[1] /= zl; zv[2] /= zl;
    const xv = [upv[1] * zv[2] - upv[2] * zv[1], upv[2] * zv[0] - upv[0] * zv[2], upv[0] * zv[1] - upv[1] * zv[0]], lift = inner ? 4.5 : 0;
    const place = (x, y, z) => [fx0 + (x * xv[0] + y * upv[0] + z * zv[0]) * scl, STEP_Y + lift + (x * xv[1] + y * upv[1] + z * zv[1]) * scl, fz0 + (x * xv[2] + y * upv[2] + z * zv[2]) * scl];
    for (let k = 0; k < 5; k++) {
      const a0 = yaw + (k / 5) * TAU, lean = (rng() - 0.5) * 0.5, f1 = 5 + 3 * rng(), f2 = 13 + 6 * rng();
      const pt = (u, w) => {
        const c = w * 2 - 1, spread = 0.74 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.84 + 0.13)), 0.6);
        const r = (1.0 + 9.0 * u) * (1 - 0.13 * c * c * u), ang = a0 + c * spread + 0.28 * u;
        // a cupped, ruffled petal: the edge rises and falls in two rhythms, the blade folds along its midrib
        const y = 0.5 + 5.6 * Math.pow(u, 0.8) - 2.5 * u * u * u * u + (0.62 * Math.sin(c * f1 + k * 2.1) + 0.26 * Math.sin(c * f2 + k)) * u * u + c * (0.55 + lean) * u + 0.25 * (1 - c * c) * u - 0.35 * Math.abs(c) * u * (1 - u);
        return place(Math.cos(ang) * r, y, Math.sin(ang) * r);
      };
      tag(sheet(g, 20, 16, pt, (u) => throat.clone().lerp(red, smoothstep(0.04, 0.4, u)).lerp(rim, 0.45 * smoothstep(0.7, 1, u))), 1, ph + k);
      for (let d = 0, nd = inner ? 8 : 4; d < nd; d++) { const q = pt(0.3 + 0.62 * rng(), 0.12 + 0.76 * rng()); beads.push([q[0], q[1] - 0.06, q[2], inner ? 0.3 + 0.55 * rng() : 0.22 + 0.3 * rng()]); }
    }
    // calyx cup and five sepals
    tag(lathe(g, fx0, STEP_Y, fz0, [[0.9, 0], [1.9, 0.5], [2.4, 1.5], [2.0, 2.2]], 12, () => green), 5, ph);
    // the staminal column with anthers on short filaments and five pads on top; on the two flowers we pass between
    // it leans in toward our track
    const cy = inner ? -Math.sign(fx0) * 0.94 : Math.cos(yaw), sy = inner ? 0.34 : Math.sin(yaw), reach = inner ? 3.4 : 1.5;
    const colP = (t) => { const off = reach * t * t; return place(cy * off, 1.4 + 10.8 * t, sy * off); };
    const cpts = [], crad = []; for (let j = 0; j <= 8; j++) { cpts.push(colP(j / 8)); crad.push(lerp(0.62, 0.36, j / 8)); }
    tag(g.tube(cpts, crad, 8, cream, cream2), 2, ph);
    for (let j = 0; j < 46; j++) {
      const t = 0.42 + 0.5 * rng(), a = rng() * TAU, el = (rng() - 0.3) * 0.9, base = colP(t), out = 0.9 + 0.5 * rng();
      const tip = [base[0] + Math.cos(a) * Math.cos(el) * out, base[1] + Math.sin(el) * out, base[2] + Math.sin(a) * Math.cos(el) * out];
      tag(g.tube([base, tip], [0.07, 0.05], 3, cream2, pollen), 3, ph + j);
      tag(g.blob(tip[0], tip[1], tip[2], 0.26, 0.2, 0.26, pollen, pollen, 5, 3), 3, ph + j);
    }
    const top = colP(1); tops.push(top);
    for (let j = 0; j < 5; j++) {
      const a = yaw + j * TAU / 5, tip = [top[0] + Math.cos(a) * 1.25, top[1] + 0.9, top[2] + Math.sin(a) * 1.25];
      tag(g.tube([top, [lerp(top[0], tip[0], 0.6), top[1] + 0.75, lerp(top[2], tip[2], 0.6)], tip], [0.2, 0.16, 0.14], 4, cream2, pad), 4, ph + j);
      tag(g.blob(tip[0], tip[1] + 0.2, tip[2], 0.55, 0.5, 0.55, pad, pad, 7, 4), 4, ph + j);
    }
    await ctx.yield();
  }
  const mat = propMat(U, {
    lamps: true,
    gloss: 0.22,
    vert: /* glsl */`
      float part = A.z, hgt = p.y - ${STEP_Y}.;
      if (part < 1.5) p.y += (sin(uTime * 3.3 + A.w * 2.1 + A.x * 5.) * .1 + sin(uTime * 7.1 + A.y * 9. + A.w) * .05) * A.x * A.x * (1. + .5 * abs(A.y - .5));
      else if (part < 4.5) p.xz += vec2(sin(uTime * 1.3 + floor(A.w)), cos(uTime * 1.1 + floor(A.w))) * .012 * hgt * hgt;`,
    frag: /* glsl */`
      float part = vA.z;
      if (part < 1.5) {
        // veins fan out from the throat; fine crepe between them; the red is kept deep so that it never clips
        float c = vA.y - .5, fan = c / (.16 + vA.x * .8), vv = abs(fract(fan * 7. + sin(vA.x * 7.) * .08) - .5) * 2.;
        float vein = max(smoothstep(.7, .95, vv), 1. - smoothstep(0., .035, abs(c))) * smoothstep(.04, .22, vA.x) * (1. - smoothstep(.82, 1., vA.x));
        float fine = abs(fract(fan * 28.) - .5) * 2.;
        float crepe = vnoise(vec2(c * 60., vA.x * 22.)) * .55 + vnoise(vec2(c * 22., vA.x * 70.)) * .45;
        alb *= (1. - .62 * vein) * (.66 + .58 * crepe) * (.86 + .14 * fine * close);
        alb = mix(alb, alb * vec3(1.5, 1.25, 1.2), .5 * smoothstep(.8, 1., vA.x) * crepe);                 // the thin ruffled rim is paler
        n = normalize(n + vec3(crepe - .5, 0., (vein - .5) * .8) * (.3 + .4 * close));
        emis += alb * (uSkyLow * .03 + uSunCol * sunAt(vW) * .14);                                        // a little light through the petal
        ao *= .45 + .55 * smoothstep(.0, .5, vA.x); sunK = .55; gloss = .42;
      } else if (part < 2.5) { alb *= .8 + .3 * vnoise(vec2(vL.y * 4., vL.x * 3.)); vec2 pg = vL.xy * 5. + vL.z * 3.; alb = mix(alb, vec3(.8, .6, .15), step(.86, hash21(floor(pg))) * .8); }
      else if (part < 3.5) { alb *= .8 + .5 * hash21(floor(vL.xz * 9.)); emis += alb * .12; }
      else if (part < 4.5) { alb *= .7 + .6 * vnoise(vL.xz * 9.); gloss = .0; }
      else { alb *= .7 + .5 * vnoise(vL.xz * 2.); }`,
  });
  return { mesh: geoMesh(g, mat, 'kolam-hibiscus'), tops };
}

// Lotus bosses (10 m) in the door panels and brass studs (4 m) on the rails: two instanced meshes.
function makeDoorFittings(U) {
  const dummy = new THREE.Object3D(), out = [];
  const post = 'gl_FragColor.rgb = cliff(gl_FragColor.rgb, vW, V, dist, dot(lampL, vec3(.3, .5, .2)));';
  // carving and studs are detail of the near door: they shrink away with height and with distance, before the door
  // sinks into the cliff's one tone, so that no grid of dots is left standing on it
  const vpars = 'uniform vec2 uHz;', vert = 'vec3 fo = (modelMatrix * im * vec4(0., 0., 0., 1.)).xyz; p *= (1. - smoothstep(90., 190., fo.y)) * (1. - smoothstep(300., 430., length(cameraPosition - fo)) * smoothstep(40., 110., fo.y));';
  const gb = new F.Geo(), teak = C('#6a4126'), teak2 = C('#a8744a');
  lathe(gb, 0, 0, 0, [[5.0, 0], [4.7, 0.5], [3.9, 1.0], [2.6, 1.25], [1.5, 1.2], [1.3, 1.7], [0.7, 2.1], [0, 2.2]], 32,
    (t, a) => teak.clone().lerp(teak2, t), (t, a) => (t < 0.5 ? 1 + 0.16 * Math.cos(a * 8) * (1 - t * 2) - 0.0 : 1));
  const bg = gb.build(); bg.rotateX(Math.PI / 2); bg.computeVertexNormals();
  const bosses = new THREE.InstancedMesh(bg, propMat(U, {
    lamps: true, ownFog: true, gloss: 0.3, fpars: GLSL_SKY + GLSL_CLIFF, post, vpars, vert,
    frag: 'float pet = abs(sin(atan(vL.y, vL.x + 1e-4) * 4.)); alb *= (.55 + .6 * pet * (1. - smoothstep(1.2, 2.2, vL.z))) * (.7 + .5 * vnoise(vL.xy * 2.)); ao *= .55 + .45 * smoothstep(0., 1.2, vL.z);',
  }), 32);
  let k = 0;
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const sc = 1.22 + 0.12 * ((i + j) % 2); dummy.position.set(sx * (21.5 + 25 * i), 46 + 60 * j, DOOR_Z + 4); dummy.rotation.set(0, 0, i * 0.4 + j); dummy.scale.set(sc, sc, 1.15); dummy.updateMatrix(); bosses.setMatrixAt(k++, dummy.matrix); }
  dummy.scale.set(1, 1, 1);
  bosses.name = 'kolam-door-bosses'; out.push(bosses);
  const gs = new F.Geo(), brass = C('#b08a3a');
  lathe(gs, 0, 0, 0, [[2.0, 0], [2.0, 0.22], [1.88, 0.58], [1.6, 0.93], [1.16, 1.22], [0.6, 1.4], [0, 1.47]], 22, () => brass);
  const sg = gs.build(); sg.rotateX(Math.PI / 2); sg.computeVertexNormals();
  const pos = [];
  for (const sx of [-1, 1]) for (let i = 0; i <= 4; i++) for (let j = 0; j < 4; j++) {
    const x = sx * (9 + 25 * i + (i === 0 ? 3 : i === 4 ? -3 : 0));
    pos.push([x, 27 + 60 * j + (j === 0 ? 3 : 0)], [x, 65 + 60 * j]);                       // where stiles and rails cross
    if (i < 4) pos.push([sx * (21.5 + 25 * i), 76 + 60 * j]);                                 // one in the heart of each lozenge
  }
  const studs = new THREE.InstancedMesh(sg, propMat(U, { lamps: true, ownFog: true, metal: 0.9, gloss: 0.4, fpars: GLSL_SKY + GLSL_CLIFF, post, vpars, vert, frag: 'alb *= .7 + .4 * vnoise(vW.xy * .8); ao *= .5 + .5 * smoothstep(0., .9, vL.z);' }), pos.length);
  pos.forEach((p, i) => { dummy.position.set(p[0], p[1], DOOR_Z + 4); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); studs.setMatrixAt(i, dummy.matrix); });
  studs.name = 'kolam-door-studs'; out.push(studs);
  for (const m of out) { m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; }
  return out;
}

// The lights of the threshold: clay oil lamps in a row along the step's edge, their lips turned to the yard, and one
// tall brass lamp of five wicks beside the door. aAnim.z: 1 clay, 2 brass, 3 oil, 4 wick; aAnim.w: how near its flame.
// Returns the bodies, the flames (one mesh: teardrops that waver, and a soft halo round each) and the flame list.
function makeLamps(U, rng, farFlames = []) {
  const g = new F.Geo(), clay = C('#7a3f26'), clay2 = C('#a9643c'), brass = C('#b08a3a'), brass2 = C('#8c6a2a'), oil = C('#2a1606'), wickC = C('#d8cdb4'), char = C('#1a1410');
  const flames = [];      // [x, y, z, height, phase, big]
  const tag = (r, k, f) => { for (let i = r[0]; i < r[1]; i++) { g.a[i * 4 + 2] = k; const dx = g.p[i * 3] - f[0], dy = g.p[i * 3 + 1] - f[1], dz = g.p[i * 3 + 2] - f[2]; g.a[i * 4 + 3] = 1 / (1 + (dx * dx + dy * dy + dz * dz) * f[3]); } return r; };
  for (const [x, z] of LAMPS) {
    const yaw = Math.PI / 2 + (rng() - 0.5) * 0.8, sc = 0.92 + 0.22 * rng(), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const fl = [x + cy * 6.9 * sc, STEP_Y + 4.3 * sc, z + sy * 6.9 * sc, 0.035];
    const prof = [[0, 0], [2.7, 0.08], [4.5, 1.0], [5.6, 2.5], [5.95, 3.5], [5.4, 3.45], [4.3, 2.4], [2.2, 2.0], [0, 1.9]].map((q) => [q[0] * sc, q[1] * sc]);
    const lip = (t, a) => 1 + 0.36 * Math.pow(Math.max(0, Math.cos(a - yaw)), 8) * smoothstep(0.2, 0.45, t) * (1 - smoothstep(0.72, 0.9, t)) + 0.03 * Math.sin(a * 5 + x);
    tag(lathe(g, x, STEP_Y, z, prof, 26, (t, a) => clay.clone().lerp(clay2, 0.5 + 0.5 * Math.sin(a * 3 + t * 6 + x)), lip), 1, fl);
    tag(lathe(g, x, STEP_Y + 2.75 * sc, z, [[0, 0], [2.4 * sc, 0.01], [4.75 * sc, 0.02]], 18, () => oil, lip), 3, fl);
    tag(g.tube([[x + cy * 2.6 * sc, STEP_Y + 2.7 * sc, z + sy * 2.6 * sc], [x + cy * 5.4 * sc, STEP_Y + 3.3 * sc, z + sy * 5.4 * sc], [fl[0], fl[1], fl[2]]], [0.42, 0.4, 0.3], 5, wickC, char), 4, fl);
    flames.push([fl[0], fl[1] - 0.2, fl[2], 6.6 * sc, rng() * 40, 0]);
  }
  {   // the tall lamp: foot, a stem of knops, the bowl with five lips, a finial
    const [x, z] = TALL, a0 = 0.3, top = [x, STEP_Y + 31, z, 0.0022];
    const prof = [[0, 0], [9.2, 0], [9.8, 1.1], [8.6, 2.5], [4.6, 3.3], [2.7, 4.8], [2.2, 7.6], [3.7, 9.2], [3.9, 10.3], [2.3, 11.8], [1.9, 15.6], [3.3, 17.1], [3.5, 18.3], [2.1, 19.7], [1.8, 23.6], [3.1, 25.1], [6.6, 26.3], [9.3, 27.9], [9.9, 29.3], [9.1, 29.25], [6.6, 28.2], [2.4, 27.9], [1.7, 30.2], [2.6, 32.2], [1.4, 34.6], [2.8, 36.6], [3.1, 38.1], [1.5, 40.2], [0, 43]];
    const lips = (t, a) => (t > 0.58 && t < 0.7 ? 1 + 0.24 * Math.pow(Math.max(0, Math.cos((a - a0) * 2.5)), 6) : 1);
    tag(lathe(g, x, STEP_Y, z, prof, 30, (t, a) => brass.clone().lerp(brass2, 0.5 + 0.5 * Math.sin(t * 40)), lips), 2, top);
    tag(lathe(g, x, STEP_Y + 28.7, z, [[2.3, 0], [5.5, 0.01], [8.9, 0.02]], 20, () => oil), 3, top);
    for (let i = 0; i < 5; i++) {
      const a = a0 + (i / 5) * TAU, f = [x + Math.cos(a) * 11.6, STEP_Y + 29.9, z + Math.sin(a) * 11.6];
      tag(g.tube([[x + Math.cos(a) * 7.5, STEP_Y + 28.8, z + Math.sin(a) * 7.5], [x + Math.cos(a) * 10.4, STEP_Y + 29.4, z + Math.sin(a) * 10.4], f], [0.5, 0.48, 0.34], 5, wickC, char), 4, top);
      flames.push([f[0], f[1] - 0.2, f[2], 8.2, rng() * 40, 1]);
    }
  }
  const bodies = geoMesh(g, propMat(U, {
    fpars: 'uniform float uLampK;',
    frag: /* glsl */`
      float k = vA.z, fl = vA.w * uLampK;
      if (k < 1.5) { float c1 = vnoise(vL.xz * 1.3 + vL.y * 2.), c2 = vnoise(vL.xz * 6. + vL.y * 9.); alb *= .62 + .5 * c1 + .25 * c2 * close; alb = mix(alb, vec3(.03, .025, .02), smoothstep(.55, .9, vA.w) * .7); n = normalize(n + vec3(c2 - .5, 0., c1 - .5) * .3); }   // fired clay, sooted at the lip
      else if (k < 2.5) { metal = .9; gloss = .5; float tr = abs(fract(vL.y * .9) - .5); alb *= .72 + .5 * vnoise(vec2(vA.y * 40., vL.y * .6)) + .2 * smoothstep(.3, .5, tr); ao *= .6 + .4 * smoothstep(0., 3., vL.y - ${STEP_Y}.); }
      else if (k < 3.5) { gloss = .95; alb *= .6 + .6 * vnoise(vL.xz * 2. + uTime * .2); emis += vec3(.9, .45, .08) * fl * .6; }
      else { alb *= .8 + .3 * vnoise(vL.xz * 9.); emis += vec3(2.4, .8, .15) * smoothstep(.7, 1., vA.w) * uLampK; }
      emis += alb * uLampCol * fl * (k > 1.5 && k < 2.5 ? 1.5 : 2.4);`,
  }), 'kolam-lamps');
  // flames and halos: position is local to the flame's base (aBase); aQ = (height 0..1, phase, kind, size)
  const P = [], Bs = [], Q = [], I = [], FP = [[0, 0], [0.5, 0.05], [0.9, 0.17], [1, 0.31], [0.9, 0.48], [0.64, 0.66], [0.36, 0.83], [0.14, 0.94], [0, 1]], SEG = 10;
  for (const f of flames) {
    const b0 = P.length / 3, w = f[3] * 0.2;
    for (let j = 0; j < FP.length; j++) for (let i = 0; i <= SEG; i++) { const a = (i / SEG) * TAU; P.push(Math.cos(a) * FP[j][0] * w, FP[j][1] * f[3], Math.sin(a) * FP[j][0] * w); Bs.push(f[0], f[1], f[2]); Q.push(FP[j][1], f[4], 0, w); }
    for (let j = 0; j < FP.length - 1; j++) for (let i = 0; i < SEG; i++) { const a = b0 + j * (SEG + 1) + i, b = a + SEG + 1; I.push(a, b, b + 1, a, b + 1, a + 1); }
    const h0 = P.length / 3;
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(cx, cz, 0); Bs.push(f[0], f[1] + f[3] * 0.45, f[2]); Q.push(0, f[4], 1, f[5] ? 30 : 17); }
    I.push(h0, h0 + 1, h0 + 2, h0, h0 + 2, h0 + 3);
  }
  for (const f of farFlames) {            // the lamps far along the street: only their halos, seen through the mist
    const h0 = P.length / 3, ph = rng() * 40;
    for (const [cx, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(cx, cz, 0); Bs.push(f[0], f[1], f[2]); Q.push(0, ph, 2, f[3]); }
    I.push(h0, h0 + 1, h0 + 2, h0, h0 + 2, h0 + 3);
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('aBase', new THREE.Float32BufferAttribute(Bs, 3)); fg.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); fg.setIndex(I);
  const fire = new THREE.Mesh(fg, new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...fogU(), uTime: U.uTime, uLampCol: U.uLampCol, uLampK: U.uLampK },
    vertexShader: /* glsl */`
      uniform float uTime; attribute vec3 aBase; attribute vec4 aQ;
      varying vec3 vN, vV; varying vec4 vQ; varying vec2 vC; varying float vD;
      void main(){
        float ph = aQ.y, t = aQ.x; vec4 mv;
        if (aQ.z > .5) { mv = viewMatrix * modelMatrix * vec4(aBase, 1.); mv.xy += position.xy * aQ.w * (1. + .06 * sin(uTime * 11. + ph)); vC = position.xy; vN = vec3(0., 0., 1.); vV = vec3(0., 0., 1.); }
        else {
          vec3 p = position; p.y *= 1. + .1 * sin(uTime * 9.3 + ph) + .05 * sin(uTime * 17. + ph * 2.);
          p.xz += vec2(sin(uTime * 6.1 + ph + t * 3.) * .7 + sin(uTime * 13.7 + ph * 3.) * .3, cos(uTime * 5.3 + ph * 1.7 + t * 2.) * .6) * t * t * aQ.w;
          vec4 wp = modelMatrix * vec4(aBase + p, 1.); mv = viewMatrix * wp;
          vN = normalize(normalMatrix * vec3(position.x, .25 * aQ.w, position.z)); vV = normalize(-mv.xyz); vC = vec2(0.);
        }
        vQ = aQ; vD = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLampCol; uniform float uLampK, fogDensity; varying vec3 vN, vV; varying vec4 vQ; varying vec2 vC; varying float vD;
      void main(){
        float haze = exp(-fogDensity * fogDensity * vD * vD); vec3 col;
        if (vQ.z > .5) { float r2 = dot(vC, vC); col = uLampCol * (exp(-r2 * 5.) * .34 + exp(-r2 * 22.) * .5) * (1. - smoothstep(.6, 1., r2)) * uLampK; if (vQ.z > 1.5) { col *= 1.5; haze = sqrt(haze); } }
        else {
          float t = vQ.x, ndv = abs(dot(normalize(vN), normalize(vV)));
          vec3 body = mix(vec3(3.6, 1.7, .34), vec3(2.6, .78, .1), smoothstep(.45, 1., t));          // the colour stays in the flame: gold body, orange tip
          body = mix(vec3(.25, .3, .9), body, smoothstep(.02, .2, t));                              // a blue root at the wick
          col = (body * (.35 + .65 * ndv * ndv) + vec3(1.6, 1.3, .7) * pow(ndv, 6.) * (1. - smoothstep(.3, .75, t))) * pow(ndv, 1.3) * smoothstep(0., .08, t) * (1. - .5 * smoothstep(.8, 1., t)) * uLampK;
        }
        gl_FragColor = vec4(col * haze * mix(.34, 1., smoothstep(24., 95., vD)), 1.);      // close to the lens a flame keeps its colour: gold, not white
      }`,
  }));
  fire.frustumCulled = false; fire.renderOrder = 4; fire.name = 'kolam-flames';
  return { bodies, fire, flames };
}

// A string of mango leaves hung across the door slot from leaf to leaf, above the ring: each leaf swings on its stalk.
// aAnim = (u along the leaf, w across, 7 leaf | 4 cord, phase).
function makeFestoon(U, rng) {
  const g = new F.Geo(), cord = C('#8a6a3c'), dark = C('#27501f'), lite = C('#6f9632'), gold = C('#b3a53a');
  const X0 = -47, X1 = 47, Y0 = 78, Z = DOOR_Z + 6.4, N = 15, sag = (t) => Y0 - 34 * t * (1 - t);
  const cp = []; for (let i = 0; i <= 24; i++) { const t = i / 24; cp.push([lerp(X0, X1, t), sag(t), Z - 1.6 * Math.cos((t - 0.5) * Math.PI)]); }
  g.anim(g.tube(cp, 0.5, 6, cord, cord), () => [0, 0, 4, 0]);
  for (const x of [X0, X1]) g.anim(g.tube([[x, Y0, DOOR_Z + 3.8], [x, Y0, Z + 0.8]], [0.9, 0.7], 6, cord, cord), () => [0, 0, 4, 0]);     // two pegs in the door frame
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N, x = lerp(X0, X1, t), y = sag(t) - 0.3, len = 14.5 + 4.5 * rng(), wid = 2.3 + 0.6 * rng(), yaw = (rng() - 0.5) * 1.1, ph = rng() * 20, curl = (rng() - 0.5) * 2.4;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), col = dark.clone().lerp(rng() < 0.25 ? gold : lite, 0.25 + 0.6 * rng());
    const r = sheet(g, 12, 4, (u, w) => {
      const c = w * 2 - 1, half = wid * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.07)), 0.75) * (1 - 0.3 * u);
      const lx = c * half, lz = 0.45 * Math.abs(c) * half + curl * u * u + 0.5 * Math.sin(u * 9 + ph) * (1 - u), ly = -(1.4 + u * len);
      return [x + lx * cy - lz * sy, y + ly, Z + 0.4 + lx * sy + lz * cy];
    }, (u, w) => col.clone().multiplyScalar(0.75 + 0.35 * u + 0.15 * Math.abs(w - 0.5)), 7, ph);
    g.pivot(r, x, y, Z);
    g.pivot(g.anim(g.tube([[x, y + 0.4, Z], [x, y - 1.5, Z + 0.4]], 0.22, 4, cord, dark), () => [0, 0, 4, ph]), x, y, Z);
  }
  const mesh = geoMesh(g, propMat(U, {
    lamps: true,
    vert: 'if (A.z > 5.) { float hang = aPivot.y - p.y; p.x += (sin(uTime * 1.2 + A.w) * .08 + sin(uTime * 2.9 + A.w * 1.7) * .03) * hang; p.z += cos(uTime * .9 + A.w * 1.3) * .06 * hang; }',
    frag: /* glsl */`
      if (vA.z > 5.) {
        float c = abs(vA.y - .5), mr = 1. - smoothstep(0., .05, c), sv = 1. - smoothstep(0., .14, abs(fract(vA.x * 11. - c * 1.6) - .5));
        alb *= (.8 + .35 * vnoise(vec2(vA.y * 9., vA.x * 30.))) * (1. + .55 * mr + .2 * sv); gloss = .5;
        emis += alb * (uSkyLow * .16 + uSunCol * sunAt(vW) * .25); ao *= .75 + .25 * vA.x;
      } else alb *= .7 + .5 * step(.5, fract(vL.x * .9 + vL.y * .7));`,
  }), 'kolam-festoon');
  return mesh;
}

// Flowers laid on the dots: a red hibiscus on the inner ones, small marigold heads on the rim (in the festival look
// the rim and the heart carry the hero's own flowers, so only the inner four get one). aAnim = (u, w, 1 marigold | 2 hibiscus | 3 column, phase).
function makeDotFlowers(U, rng, hero, look) {
  const g = new F.Geo(), deep = C('#a03c08'), orange = C('#e0701c'), gold = C(PAL[5]), throat = C('#30040c'), red = C('#8f0f24'), rim = C('#c3352d'), cream = C('#e9cfb2'), pollen = C('#e2b23c');
  const tag = (r, k, ph) => { for (let i = r[0]; i < r[1]; i++) { g.a[i * 4 + 2] = k; g.a[i * 4 + 3] = ph; } return r; };
  hero.anchors.dots.forEach((d, di) => {
    const ring = Math.round((Math.abs(d.x) + Math.abs(d.z)) / 40), hib = ring < 2;
    if (look === 1 && ring !== 1) { rng(); return; }
    const yaw0 = rng() * TAU, y0 = 2.25, ph = di * 1.9;
    if (hib) {
      for (let k = 0; k < 5; k++) {
        const a0 = yaw0 + (k / 5) * TAU, f1 = 5 + 3 * ((k * 7 + di) % 3);
        tag(sheet(g, 7, 6, (u, w) => {
          const c = w * 2 - 1, spread = 0.72 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.84 + 0.13)), 0.6), r = 0.3 + 3.5 * u, ang = a0 + c * spread + 0.25 * u;
          return [d.x + Math.cos(ang) * r, y0 + 0.5 + 1.5 * Math.pow(u, 0.7) - 2.3 * u * u * u + 0.22 * Math.sin(c * f1 + k) * u * u + 0.2 * (1 - c * c) * u, d.z + Math.sin(ang) * r];
        }, (u) => throat.clone().lerp(red, smoothstep(0.05, 0.4, u)).lerp(rim, 0.5 * smoothstep(0.65, 1, u))), 2, ph + k);
      }
      const tip = [d.x + Math.cos(yaw0) * 1.3, y0 + 4.4, d.z + Math.sin(yaw0) * 1.3];
      tag(g.tube([[d.x, y0 + 0.6, d.z], [d.x + Math.cos(yaw0) * 0.5, y0 + 2.6, d.z + Math.sin(yaw0) * 0.5], tip], [0.24, 0.19, 0.15], 5, cream, cream), 3, ph);
      tag(g.blob(tip[0], tip[1] + 0.1, tip[2], 0.42, 0.42, 0.42, pollen, pollen, 6, 3), 3, ph);
    } else {
      const tint = rng() < 0.5 ? gold : orange;
      for (let tier = 0; tier < 4; tier++) {
        const f = tier / 3, n = 11 - 2 * tier, lift = 0.1 + 1.25 * f, len = 2.5 - 1.3 * f;
        for (let k = 0; k < n; k++) {
          const a0 = yaw0 + (k + (tier & 1) * 0.5 + (rng() - 0.5) * 0.3) / n * TAU, sh = 0.8 + 0.3 * rng(), cl = Math.cos(lift), sl = Math.sin(lift);
          tag(sheet(g, 3, 2, (u, w) => {
            const c = w * 2 - 1, half = 0.55 * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 0.7 + 0.15))), al = len * u, dr = 0.5 * len * u * u * u;
            const rr = al * cl - dr * sl * 0.4, yy = al * sl - dr * cl + 0.12 * (1 - c * c);
            return [d.x + Math.cos(a0) * rr - Math.sin(a0) * c * half, y0 + 0.5 + 0.9 * Math.sin(f * 1.5) + yy, d.z + Math.sin(a0) * rr + Math.cos(a0) * c * half];
          }, (u) => deep.clone().lerp(orange, 0.3 + 0.5 * f).lerp(tint, u * u).multiplyScalar(sh * (0.55 + 0.45 * u))), 1, ph + k);
        }
      }
    }
  });
  return geoMesh(g, propMat(U, {
    gloss: 0.15,
    vert: 'p.y += sin(uTime * 2.6 + A.w * 2.3 + A.x * 4.) * .05 * A.x * A.x;',
    frag: /* glsl */`
      if (vA.z > 2.5) { alb *= .85 + .3 * vnoise(vL.xz * 9.); }
      else if (vA.z > 1.5) {
        float c = vA.y - .5, fan = c / (.16 + vA.x * .8), vv = abs(fract(fan * 6.) - .5) * 2.;
        float vein = max(smoothstep(.72, .95, vv), 1. - smoothstep(0., .04, abs(c))) * smoothstep(.05, .25, vA.x) * (1. - smoothstep(.8, 1., vA.x));
        alb *= (1. - .55 * vein) * (.7 + .5 * vnoise(vec2(c * 40., vA.x * 18.))); emis += alb * (uSkyLow * .05 + uSunCol * sunAt(vW) * .16); ao *= .5 + .5 * smoothstep(0., .45, vA.x); sunK = .6; gloss = .35;
      } else { alb *= .75 + .45 * vnoise(vL.xz * 5. + vL.y * 3.); emis += alb * (uSkyLow * .06 + uSunCol * sunAt(vW) * .12); ao *= .6 + .4 * vA.x; }`,
  }), 'kolam-dot-flowers');
}

// ---------------------------------------------------------------------------------------------------
// The street in the mist. Beyond the yard the lane stands as pale layered shapes, each paler than the one before
// it and all of them melting into the sky that is behind them (so the peach band shows through the eastern ones).
// West along the house front: water pots stacked at the foot of the step, a bicycle leaning on the wall, two banana
// plants, and the neighbour's doorstep with its own row of lamps and a kolam before it. East, where the yard lies
// open to the sunrise: banana plants, pots, a low garden wall, and far off the tip of a temple tower. South, across
// the street: the opposite neighbour's step, lamps and kolam, pots and banana plants at the foot of the mist.
// aAnim = (least haze, the height by which it has thinned away upward, kind: 1 flame | 2 leaf | 3 flour, phase).
// Returns the mesh and the far flames [x, y, z, halo size] (their halos ride in the lamps' own flame mesh).
async function makeStreet(U, rng, noise, look, ctx) {
  const g = new F.Geo(), flames = [];
  const tag = (r, floor, top, kind = 0, ph = 0) => g.anim(r, () => [floor, top, kind, ph]);
  const box = (x0, x1, y0, y1, z0, z1, col, col2) => {
    const st = g.n, c2 = col2 || col;
    const q = (p) => { const s = g.n; for (const v of p) g.v(v[0], v[1], v[2], v[1] > (y0 + y1) / 2 ? col : c2); g.quad(s, s + 1, s + 2, s + 3); };
    q([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]); q([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]); q([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]);
    q([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]); q([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]);
    return [st, g.n];
  };
  // a water pot of radius R standing at (x, y, z): round belly, narrow neck, rolled rim
  const POTP = spline([[0.36, 0], [0.7, 0.07], [0.95, 0.3], [1, 0.56], [0.9, 0.82], [0.63, 1.03], [0.44, 1.15], [0.42, 1.25], [0.55, 1.36], [0.6, 1.41], [0.5, 1.43]], 16);
  const pot = (x, y, z, R, cA, cB, top) => {
    const ph = rng() * 9;
    tag(lathe(g, x, y, z, POTP.map((q) => [q[0] * R, q[1] * R]), 26, (t, a) => cA.clone().lerp(cB, 0.5 + 0.5 * Math.sin(a * 2 + t * 5 + ph)).multiplyScalar(0.75 + 0.35 * t), (t, a) => 1 + 0.02 * Math.sin(a * 3 + ph)), 0, top);
    return y + 1.3 * R;
  };
  const clay = C('#6e4634'), clay2 = C('#8a5a3c'), brass = C('#8a7038'), brass2 = C('#5e4c2a');
  const stack = (x, z, R, top) => { let y = pot(x, 0, z, R, clay, clay2, top); y = pot(x + R * 0.06, y, z - R * 0.04, R * 0.82, brass, brass2, top); pot(x - R * 0.04, y, z + R * 0.03, R * 0.66, clay2, clay, top); };
  // a banana plant: a stout sheathed stem, a crown of long torn leaves that arch out and droop, one hanging bud
  const banana = (x, z, s, yaw0, top) => {
    const stemA = C('#4d5a3e'), stemB = C('#6a7448'), leafA = C('#2f4c34'), leafB = C('#4e6a3c'), H = 150 * s, lean = [(rng() - 0.5) * 0.12, (rng() - 0.5) * 0.12];
    const sp = [], sr = []; for (let k = 0; k <= 8; k++) { const t = k / 8; sp.push([x + lean[0] * H * t * t, H * t, z + lean[1] * H * t * t]); sr.push(lerp(21, 11, Math.pow(t, 0.8)) * s * (1 + 0.06 * Math.sin(t * 19))); }
    tag(g.tube(sp, sr, 10, stemA, stemB), 0, top);
    const tx = sp[8][0], ty = sp[8][1], tz = sp[8][2], NL = 9;
    for (let i = 0; i < NL; i++) {
      const az = yaw0 + (i / NL) * TAU * 1.62 + (rng() - 0.5) * 0.3, old = i / (NL - 1), e0 = lerp(1.38, 0.5, old), e1 = lerp(-0.25, -1.25, old * old), Lf = (150 + 50 * rng()) * s * lerp(0.72, 1, Math.sin(Math.PI * Math.min(1, old + 0.25))), ph = rng() * 20;
      const NS = 14, mid = [[tx, ty - 6 * s, tz]]; let px = 0, py = 0;
      for (let k = 1; k <= NS; k++) { const t = k / NS, a = lerp(e0, e1, Math.pow(t, 1.25)); px += Math.cos(a) * Lf / NS; py += Math.sin(a) * Lf / NS; mid.push([tx + Math.cos(az) * px, ty - 6 * s + py, tz + Math.sin(az) * px]); }
      const cx = -Math.sin(az), cz = Math.cos(az), wmax = (27 + 8 * rng()) * s, tear = 5 + Math.floor(rng() * 4);
      const r = sheet(g, NS, 4, (u, w) => {
        const f = u * NS, k = Math.min(NS - 1, Math.floor(f)), ft = f - k, c = w * 2 - 1;
        const mx = lerp(mid[k][0], mid[k + 1][0], ft), my = lerp(mid[k][1], mid[k + 1][1], ft), mz = lerp(mid[k][2], mid[k + 1][2], ft);
        const torn = 1 - 0.3 * Math.max(0, Math.sin(u * tear * TAU + ph)) * Math.abs(c) * smoothstep(0.25, 0.5, u);        // the wind has torn the blade to the midrib here and there
        const hw = wmax * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.07)), 0.55) * torn;
        return [mx + cx * c * hw, my - Math.abs(c) * hw * (0.22 + 0.5 * u) - 3 * s * Math.sin(u * tear * TAU + ph) * Math.abs(c), mz + cz * c * hw];
      }, (u, w) => leafA.clone().lerp(leafB, 0.2 + 0.5 * Math.abs(w - 0.5) + 0.3 * u).multiplyScalar(Math.abs(w - 0.5) < 0.13 ? 1.35 : 1), 0, 0);
      tag(r, 0, top, 2, ph); g.pivot(r, tx, ty, tz);
    }
    // the bud on its bent stalk
    const ba = yaw0 + 2.2, bx = tx + Math.cos(ba) * 34 * s, bz = tz + Math.sin(ba) * 34 * s;
    tag(g.tube([[tx, ty - 4 * s, tz], [lerp(tx, bx, 0.6), ty + 6 * s, lerp(tz, bz, 0.6)], [bx, ty - 14 * s, bz], [bx + 1, ty - 42 * s, bz]], [5 * s, 4.4 * s, 4 * s, 3.4 * s], 6, stemB, stemA), 0, top);
    tag(g.blob(bx + 1, ty - 55 * s, bz, 10 * s, 17 * s, 10 * s, C('#5a2a3c'), C('#3c1c30'), 9, 6), 0, top);
  };
  // WEST of the door, in front of the house wall
  stack(-402, -150, 36, 9999); pot(-466, 0, -116, 31, brass, brass2, 9999);
  banana(-585, -35, 1.0, 0.4, 330); banana(-676, 50, 0.66, 2.1, 240);
  await ctx.yield();
  {   // the bicycle: it stands on the step and leans on the wall, its front wheel to the west
    const X0 = -800, Z0 = -237, LEAN = 0.15, cl = Math.cos(LEAN), sl = Math.sin(LEAN), RW = 62, top = 9999;
    const P = (X, Y, Zl = 0) => [X0 - X, STEP_Y + Y * cl, Z0 - Y * sl + Zl];
    const steel = C('#3c4654'), steel2 = C('#586478'), tyre = C('#23262c'), chrome = C('#8f98a8'), hide = C('#4a3424');
    const T = (pts, r, cA = steel, cB = steel2, sides = 6) => tag(g.tube(pts, r, sides, cA, cB), 0, top);
    for (const wx of [-108, 108]) {
      const ring = []; for (let j = 0; j <= 40; j++) { const a = (j / 40) * TAU; ring.push(P(wx + Math.cos(a) * RW, RW + 6 + Math.sin(a) * RW)); }
      T(ring, 5.6, tyre, tyre, 7);
      for (let j = 0; j < 14; j++) { const a = (j / 14) * TAU + (wx > 0 ? 0.2 : 0); T([P(wx + Math.cos(a) * 7, RW + 6 + Math.sin(a) * 7, (j & 1 ? 5 : -5)), P(wx + Math.cos(a) * (RW - 3), RW + 6 + Math.sin(a) * (RW - 3))], 1.7, chrome, chrome, 3); }
      T([P(wx, RW + 6, -8), P(wx, RW + 6, 8)], 7, chrome, steel, 8);                                    // hub
      const guard = []; for (let j = 0; j <= 16; j++) { const a = lerp(wx > 0 ? 0.25 : -0.2, wx > 0 ? 3.3 : 2.9, j / 16); guard.push(P(wx + Math.cos(a) * (RW + 9), RW + 6 + Math.sin(a) * (RW + 9))); }
      T(guard, 3.6, steel, steel2, 5);
    }
    const BB = [-8, 62], ST = [-38, 168], HT = [70, 174], HL = [78, 146], RA = [-108, RW + 6], FA = [108, RW + 6];
    T([P(BB[0], BB[1]), P(ST[0], ST[1]), P(ST[0] - 4, ST[1] + 16)], 4.6);                                // seat tube and post
    T([P(ST[0], ST[1] - 6), P(HT[0], HT[1] - 6)], 4.4); T([P(BB[0], BB[1]), P(HL[0], HL[1])], 5);         // top tube, down tube
    T([P(HL[0] + 2, HL[1] - 6), P(HT[0] - 4, HT[1] + 22)], 5);                                           // head tube and stem
    for (const zl of [-7, 7]) { T([P(BB[0], BB[1], zl * 0.4), P(RA[0], RA[1], zl)], 3.2); T([P(ST[0], ST[1] - 8, zl * 0.4), P(RA[0], RA[1], zl)], 3); T([P(HL[0], HL[1], zl * 0.4), P(92, 104, zl), P(FA[0], FA[1], zl)], 3.4); }
    T([P(HT[0] - 4, HT[1] + 22, -30), P(HT[0] - 2, HT[1] + 24, 0), P(HT[0] - 4, HT[1] + 22, 30)], 3.6, chrome, chrome);                          // handlebar
    for (const zl of [-30, 30]) T([P(HT[0] - 4, HT[1] + 22, zl), P(HT[0] - 30, HT[1] + 17, zl * 1.1)], 4.6, hide, hide);
    tag(g.blob(...P(ST[0] - 8, ST[1] + 21), 26, 6.5, 12, hide, C('#2c2018'), 9, 5), 0, top);               // saddle
    T([P(-152, 143, -10), P(-44, 147, -10), P(-44, 147, 10), P(-152, 143, 10), P(-152, 143, -10)], 2.8);  // carrier
    for (const zl of [-10, 10]) T([P(-140, 143, zl), P(RA[0], RA[1], zl)], 2.4);
    const cw = []; for (let j = 0; j <= 16; j++) { const a = (j / 16) * TAU; cw.push(P(BB[0] + Math.cos(a) * 17, BB[1] + Math.sin(a) * 17, 7)); }
    T(cw, 3, chrome, steel, 5); T([P(BB[0], BB[1], 9), P(BB[0] + 14, BB[1] - 28, 11)], 2.6, chrome, chrome); T([P(BB[0] + 6, BB[1] - 28, 6), P(BB[0] + 22, BB[1] - 28, 18)], 3.4, tyre, tyre);
    T([P(BB[0] + 17, BB[1] + 4, 7), P(RA[0] + 8, RA[1] + 7, 7)], 1.8, chrome, chrome, 3); T([P(BB[0] + 17, BB[1] - 14, 7), P(RA[0] + 8, RA[1] - 7, 7)], 1.8, chrome, chrome, 3);   // chain
  }
  await ctx.yield();
  {   // the neighbour's doorstep: a doorway in the same wall, lamps along its step, a kolam on the ground before it
    const DX = -1090, top = 330, teak = C('#4a3424'), teak2 = C('#32241c'), lime = C('#8a8f98'), flour = C(PAL[3]).multiplyScalar(0.8), clayL = C('#7a3f26');
    tag(box(DX - 96, DX - 74, STEP_Y, 300, DOOR_Z + 2, DOOR_Z + 12, lime), 0, top); tag(box(DX + 74, DX + 96, STEP_Y, 300, DOOR_Z + 2, DOOR_Z + 12, lime), 0, top);
    tag(box(DX - 74, DX - 3, STEP_Y, 300, DOOR_Z + 2, DOOR_Z + 6, teak, teak2), 0, top); tag(box(DX + 3, DX + 74, STEP_Y, 300, DOOR_Z + 2, DOOR_Z + 6, teak, teak2), 0, top);
    for (const sx of [-1, 1]) for (let j = 0; j < 4; j++) tag(box(DX + sx * 14, DX + sx * 62, STEP_Y + 14 + j * 62, STEP_Y + 62 + j * 62, DOOR_Z + 6, DOOR_Z + 8.5, teak2, teak), 0, top);     // sunk panels
    tag(box(DX - 110, DX + 110, STEP_Y, STEP_Y + 5, DOOR_Z + 2, DOOR_Z + 22, teak), 0, top);                 // the threshold
    for (let i = 0; i < 7; i++) {
      const x = DX + (i - 3) * 36 + (rng() - 0.5) * 8, z = STEP_Z - 8, sc = 1.15 + 0.3 * rng();
      tag(lathe(g, x, STEP_Y, z, [[0, 0], [3, 0.1], [5.6, 1.6], [6.6, 3.6], [5.4, 3.5], [2.4, 2.2], [0, 2]].map((q) => [q[0] * sc, q[1] * sc]), 12, () => clayL), 0, top);
      const f = [x, STEP_Y + 4 * sc, z + 6 * sc], fl = [[0, 0], [1.5, 1.6], [1.9, 3.6], [1.3, 6.2], [0.5, 8.6], [0, 10]].map((q) => [q[0] * sc, q[1] * sc]);
      tag(lathe(g, f[0], f[1], f[2], fl, 8, () => clayL), 0, top, 1, rng() * 40);
      flames.push([f[0], f[1] + 5 * sc, f[2], 46]);
    }
    // the kolam: one line looping round a ring of dots, as on every doorstep of the street
    const KX = DX, KZ = -78, kp = []; for (let j = 0; j <= 160; j++) { const a = (j / 160) * TAU, r = 60 + 30 * Math.cos(a * 4) + 9 * Math.cos(a * 8); kp.push([KX + Math.cos(a + 0.39) * r, 1.6, KZ + Math.sin(a + 0.39) * r]); }
    tag(g.tube(kp, 3.3, 4, flour, flour), 0, 9999, 3);
    const k2 = []; for (let j = 0; j <= 96; j++) { const a = (j / 96) * TAU, r = 30 + 12 * Math.cos(a * 4 + Math.PI); k2.push([KX + Math.cos(a + 0.39) * r, 1.6, KZ + Math.sin(a + 0.39) * r]); }
    tag(g.tube(k2, 3, 4, flour, flour), 0, 9999, 3);
    for (let j = 0; j < 9; j++) { const a = (j / 8) * TAU + 0.39, r = j === 8 ? 0 : 62; tag(g.blob(KX + Math.cos(a) * r, 1.5, KZ + Math.sin(a) * r, 4.6, 3, 4.6, flour, flour, 7, 4), 0, 9999, 3); }
  }
  await ctx.yield();
  // EAST: banana plants and pots on the open side of the yard, a low mud wall beyond them
  banana(655, -168, 1.06, 1.3, 340); banana(738, -112, 0.7, 3.4, 250);
  stack(584, -150, 33, 9999); pot(542, 0, -128, 27, clay, clay2, 9999);
  {
    const way = [[762, -196], [778, -60], [822, 70], [900, 210], [1010, 350], [1150, 470]], mud = C('#5e5246'), mud2 = C('#77695a');
    const cv = new THREE.CatmullRomCurve3(way.map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal'), N = 44, a = new THREE.Vector3(), t = new THREE.Vector3();
    const prof = [[-11, 0], [-10, 34], [-6, 43], [0, 46], [6, 43], [10, 34], [11, 0]];
    const r = sheet(g, N, prof.length - 1, (u, w) => {
      cv.getPointAt(u, a); cv.getTangentAt(u, t); const q = prof[Math.round(w * (prof.length - 1))], hgt = 1 + 0.12 * noise.n2(u * 9, 3.3) - 0.3 * smoothstep(0.86, 1, u);
      return [a.x - t.z * q[0], q[1] * hgt, a.z + t.x * q[0]];
    }, (u, w) => mud.clone().lerp(mud2, 0.5 + 0.5 * noise.n2(u * 23, w * 3)).multiplyScalar(0.7 + 0.5 * Math.sin(Math.PI * w)), 0, 0);
    tag(r, 0, 9999);
  }
  await ctx.yield();
  {   // ACROSS THE STREET, 650 m off, where the chase and the glint look out over the wet: the opposite neighbour's
      // step with its own row of lamps and a kolam before it, water pots, banana plants. No wall stands behind them:
      // the mist is the wall, and they are pale shapes at its foot.
    const ZS = 652, DX = -290, limeA = C('#8a8f98'), limeB = C('#6c5a58'), flour = C(PAL[3]).multiplyScalar(0.8), clayL = C('#7a3f26');
    tag(box(-2300, 1800, 0, 22, ZS, ZS + 50, limeA, limeB), 0, 9999);
    for (let i = 0; i < 9; i++) {
      const x = DX + (i - 4) * 40 + (rng() - 0.5) * 9, z = ZS + 8, sc = 1.2 + 0.3 * rng();
      tag(lathe(g, x, 22, z, [[0, 0], [3, 0.1], [5.6, 1.6], [6.6, 3.6], [5.4, 3.5], [2.4, 2.2], [0, 2]].map((q) => [q[0] * sc, q[1] * sc]), 12, () => clayL), 0, 9999);
      const f = [x, 22 + 4 * sc, z - 6 * sc], fl = [[0, 0], [1.5, 1.6], [1.9, 3.6], [1.3, 6.2], [0.5, 8.6], [0, 10]].map((q) => [q[0] * sc, q[1] * sc]);
      tag(lathe(g, f[0], f[1], f[2], fl, 8, () => clayL), 0, 9999, 1, rng() * 40);
      flames.push([f[0], f[1] + 5 * sc, f[2], 50]);
    }
    const KX = DX + 10, KZ = 548, kp = []; for (let j = 0; j <= 160; j++) { const a = (j / 160) * TAU, r = 62 + 26 * Math.cos(a * 6) + 8 * Math.cos(a * 12); kp.push([KX + Math.cos(a + 0.2) * r, 1.6, KZ + Math.sin(a + 0.2) * r]); }
    tag(g.tube(kp, 3.4, 4, flour, flour), 0, 9999, 3);
    for (let j = 0; j < 7; j++) { const a = (j / 6) * TAU + 0.2, r = j === 6 ? 0 : 50; tag(g.blob(KX + Math.cos(a) * r, 1.5, KZ + Math.sin(a) * r, 4.8, 3, 4.8, flour, flour, 7, 4), 0, 9999, 3); }
    stack(-96, 606, 35, 9999); pot(-34, 0, 624, 28, brass, brass2, 9999); stack(-640, 612, 30, 9999); pot(250, 0, 618, 30, clay, clay2, 9999);
    banana(-500, 598, 1.0, 0.9, 330); banana(-585, 630, 0.62, 2.6, 230); banana(96, 612, 0.86, 4.0, 300); banana(520, 640, 0.74, 5.2, 260);
  }
  await ctx.yield();
  if (look === 2) {   // far beyond the open east, the tip of a temple tower stands out of the mist against the peach band
    const TX = 1350, TZ = -1600, stone = C('#5a4e68'), stone2 = C('#74627c');
    let y = 0, w = 400, d = 300; const st = g.n;
    for (let i = 0; i < 9; i++) {
      box(TX - w / 2, TX + w / 2, y, y + 58, TZ - d / 2, TZ + d / 2, stone, stone2); box(TX - w * 0.54, TX + w * 0.54, y + 58, y + 68, TZ - d * 0.54, TZ + d * 0.54, stone2);
      for (let k = -2; k <= 2; k++) box(TX + k * w * 0.2 - w * 0.05, TX + k * w * 0.2 + w * 0.05, y + 12, y + 44, TZ + d / 2, TZ + d / 2 + 6, stone2);                       // niches
      y += 68; w *= 0.875; d *= 0.875;
    }
    sheet(g, 10, 10, (u, v) => { const a = v * Math.PI; return [TX + (u - 0.5) * w * 1.05, y + Math.sin(a) * d * 0.62, TZ + Math.cos(a) * d * 0.55]; }, () => stone2);   // the barrel roof
    for (let k = -3; k <= 3; k++) g.blob(TX + k * w * 0.14, y + d * 0.62 + 16, TZ, 8, 22, 8, stone2, stone, 6, 4);                                                           // its row of finials
    g.anim([st, g.n], (x, yy) => [-lerp(0.92, 0.74, smoothstep(250, 520, yy)), 9999, 0, 0]);
  }
  await ctx.yield();
  const geo = g.build(); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { ...U, uMistK: { value: 0.00105 } },
    vertexShader: /* glsl */`
      ${GLSL_COMMON}
      attribute vec3 color; attribute vec4 aAnim; attribute vec3 aPivot;
      varying vec3 vW, vN, vC; varying vec4 vA;
      void main(){
        vec3 p = position;
        if (aAnim.z > 1.5 && aAnim.z < 2.5) { vec3 q = p - aPivot; float d = length(q); p.y += sin(uTime * .55 + aAnim.w) * .035 * d; p.xz += vec2(cos(uTime * .4 + aAnim.w * 1.3), sin(uTime * .33 + aAnim.w)) * .02 * d; }   // the great leaves sway
        if (aAnim.z > .5 && aAnim.z < 1.5) p.xz += vec2(sin(uTime * 7. + aAnim.w), cos(uTime * 6. + aAnim.w)) * .5;                 // the far flames waver
        vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * normal; vC = color; vA = aAnim;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_COMMON}
      ${GLSL_SKY}
      uniform float uMistK;
      varying vec3 vW, vN, vC; varying vec4 vA;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-4);
        float k = vA.z, flame = step(.5, k) * step(k, 1.5), ndv = clamp(dot(V, n), 0., 1.);
        vec3 alb = vC * (.78 + .44 * vnoise(vW.xz * .09 + vW.y * .13));
        vec3 lit = alb * (skyLight(n) + uSunCol * uSunUp * (max(dot(n, uSunDir), 0.) * 1.1 + .3 * pow(1. - ndv, 2.)));
        lit += alb * uSkyLow * .25 * pow(1. - ndv, 3.);
        lit = mix(lit, uLampCol * (2.4 + .5 * sin(uTime * 9. + vA.w)), flame);
        float hz = 1. - exp(-dist * dist * uMistK * uMistK); hz = vA.x < 0. ? min(hz, -vA.x) : max(hz, vA.x); hz = max(hz, .22 * (1. - flame));   // (a negative floor is a ceiling: the far tower never quite drowns)
        hz = 1. - (1. - hz) * (1. - .62 * exp(-max(vW.y, 0.) / 28.)) * (1. - .94 * step(1., vA.y) * smoothstep(vA.y * .5, max(vA.y, 1.), vW.y));     // deeper in the mist at the foot; the tall ones thin away upward
        hz *= 1. - .6 * flame;
        gl_FragColor = vec4(mix(lit, skyCol(-V), hz), 1.);
      }`,
  }));
  mesh.frustumCulled = false; mesh.name = 'kolam-street';
  return { mesh, flames };
}

// ---------------------------------------------------------------------------------------------------
// Beads of sprinkled water: instanced domes with a lens shader. list: [x, y, z, radius]. They tremble when
// grains land near them, shrink slowly through the flight, and flash one sun point each when the sun comes.
function makeBeads(U, list, stone) {
  const g = new F.Geo(), w = C('#ffffff');
  lathe(g, 0, 0, 0, [[1.0, 0], [0.97, 0.2], [0.82, 0.42], [0.55, 0.57], [0, 0.64]], 10, () => w);
  const base = g.build(); base.computeVertexNormals();
  const geo = new THREE.InstancedBufferGeometry(); geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position')); geo.setAttribute('normal', base.getAttribute('normal'));
  const arr = new Float32Array(list.length * 4); list.forEach((b, i) => arr.set(b, i * 4));
  geo.setAttribute('aBead', new THREE.InstancedBufferAttribute(arr, 4)); geo.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: { ...fogU(), ...U, uStone: { value: stone }, uDry: { value: 0 }, uLandP: { value: new THREE.Vector2() } },
    vertexShader: /* glsl */`#include <fog_pars_vertex>
      ${GLSL_COMMON}
      attribute vec4 aBead; uniform float uDry; uniform vec2 uLandP;
      varying vec3 vW, vN, vL;
      void main(){
        float ph = aBead.x * 1.7 + aBead.z * 2.3; vec2 dl = aBead.xz - uLandP;
        float tr = exp(-dot(dl, dl) / 3600.) * step(aBead.y, 4.);
        float r = aBead.w * (1. - uDry * (.25 + .3 * fract(ph)));
        vec3 p = position * r; p.y *= 1. + tr * .25 * sin(uTime * 37. + ph); p.xz *= 1. - tr * .1 * sin(uTime * 37. + ph);
        p.xz += tr * .05 * r * vec2(sin(uTime * 29. + ph), cos(uTime * 31. + ph));
        vec4 wp = modelMatrix * vec4(p + aBead.xyz, 1.); vW = wp.xyz; vN = normal; vL = position;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`#include <fog_pars_fragment>
      ${GLSL_COMMON}
      uniform vec3 uStone; varying vec3 vW, vN, vL;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) n = -n;
        vec3 V = normalize(cameraPosition - vW), R = reflect(-V, n); float ndv = clamp(dot(V, n), 0., 1.);
        float sun = sunAt(vW); vec3 Lk = normalize(mix(vec3(0., .55, .83), uSunDir + vec3(0., .25, 0.), sun));
        vec3 refl = mix(uSkyLow, uSkyTop, pow(clamp(R.y, 0., 1.), .5)); refl = mix(refl, uHouse, smoothstep(0., .8, -R.z) * .8);
        float far = max(dot(n, normalize(vec3(-Lk.x, .15, -Lk.z))), 0.);
        vec3 inside = uStone * (.5 + .5 * smoothstep(0., .35, vL.y)) + uSkyLow * .07 + (uSkyLow + uSunCol * sun * 1.4) * (1.15 * far * far);   // the lens gathers light on its far side
        float F = .06 + .94 * pow(1. - ndv, 3.);
        vec3 col = mix(inside, refl, F * .85);
        col += uSkyLow * (pow(max(dot(R, Lk), 0.), 40.) * 2.2 + pow(1. - ndv, 5.) * .5);
        col += uSunCol * sun * (pow(max(dot(R, uSunDir), 0.), 260.) * 8. + pow(max(dot(R, uSunDir), 0.), 24.) * 1.6 + 1.3 * far * far);      // every bead flares when the sun finds it
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.name = 'kolam-beads';
  return m;
}

// Moss in the paving joints: lumpy cushions and nodding spore stalks, two instanced meshes.
function makeMoss(U, rng, noise, path, detail, look, hero) {
  const g = new F.Geo(), dark = C(look === 2 ? '#2c3516' : '#1b3518'), lite = C(look === 2 ? '#545c2a' : '#3f6030');
  // a soft dome: 3 rings of 10
  const top = g.v(0, 1, 0, lite), rows = [];
  for (let r = 1; r <= 3; r++) { const row = []; for (let k = 0; k < 10; k++) { const a = (k + r * 0.5) / 10 * TAU, ph = r / 3 * 1.45, l = 1 + 0.13 * Math.sin(a * 2 + r * 1.9) + 0.06 * Math.sin(a * 3 + r); row.push(g.v(Math.cos(a) * Math.sin(ph) * l, r === 3 ? -0.15 : Math.cos(ph) * (0.9 + 0.1 * Math.cos(a * 2 + r)), Math.sin(a) * Math.sin(ph) * l, r === 3 ? dark : dark.clone().lerp(lite, 0.6 - r * 0.2))); } rows.push(row); }
  for (let k = 0; k < 10; k++) g.tri(top, rows[0][(k + 1) % 10], rows[0][k]);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 10; k++) g.quad(rows[r][k], rows[r][(k + 1) % 10], rows[r + 1][(k + 1) % 10], rows[r + 1][k]);
  const cg = g.build(); cg.computeVertexNormals();
  // spots: [x, z, width, height, yaw]. On the granite the cushions crowd the joints, big and small overlapping into
  // one soft strip; in the yard there are no joints and the moss grows in loose drifts where the earth stays damp.
  const spots = [], clearOf = (x, z) => z > STEP_Z + 4 && Math.hypot(x - POT[0], z - POT[2]) > 15 && Math.hypot(x - BOWL[0], z - BOWL[2]) > 13;
  const sized = () => { const t = rng(); return 0.7 + 2.3 * t * t; };
  if (look === 2) {
    for (let k = 0; k < 5200 && spots.length < 1500 * Math.min(1, detail + 0.15); k++) {
      const x = (rng() - 0.5) * 640, z = -196 + rng() * 520, m = noise.n2(x * 0.011 + 3.3, z * 0.011) + 0.35 * noise.n2(x * 0.05, z * 0.05 + 7);
      if (m < 0.42 || Math.hypot(x, z) < 116 || !clearOf(x, z)) continue;
      const w = sized() * (0.6 + 0.8 * Math.min(1, (m - 0.42) * 3)); spots.push([x, z, w, 0.35 + 0.45 * w * (0.6 + 0.6 * rng()), rng() * TAU]);
    }
  } else {
    for (const axis of [0, 1]) for (const j of [-180, -60, 60, 180]) {
      for (let t = -300; t < 300; t += 1.5 + 1.5 * rng()) {
        const x = axis ? t : j + (rng() - 0.5) * 1.5, z = axis ? j + (rng() - 0.5) * 1.5 : t;
        if (!clearOf(x, z)) continue;
        const far = Math.hypot(x, z) > 190; if ((far && rng() < 0.45) || rng() > detail + 0.15) continue;
        if (noise.n2(x * 0.02, z * 0.02) < -0.45) continue;                // bare stretches
        const w = sized(); spots.push([x, z, w, 0.4 + 0.42 * w * (0.6 + 0.6 * rng()), rng() * TAU]);
      }
    }
  }
  const dummy = new THREE.Object3D();
  const cushions = new THREE.InstancedMesh(cg, propMat(U, {
    // velvet: tufted, a yellower patch here and there, the sky caught along the rim
    frag: 'vec2 mq = vW.xz + vW.y * .8; float m1 = vnoise(mq * 2.2), m2 = vnoise(mq * 7.), m3 = vnoise(vW.xz * .3 + 5.), nap = vnoise(mq * 21.) * .6 + vnoise(mq * 47.) * .4, tuft = smoothstep(.3, .7, vnoise(mq * 4.4 + 7.)); alb *= (.5 + .5 * m1 + .35 * m2) * (.72 + .56 * nap * (.35 + .65 * close)) * (.75 + .4 * tuft); alb = mix(alb, alb * vec3(1.2, 1.08, .62), smoothstep(.5, .8, m3) * .8); n = normalize(n + vec3(m2 - .5, 0., m1 - .5) * .5 + vec3(nap - .5, 0., vnoise(mq * 21. + 5.) - .5) * .5 * close); ao *= .32 + .68 * smoothstep(0., 1.2, vW.y); float rimM = pow(1. - clamp(dot(V, n), 0., 1.), 2.5); emis += (alb * .5 + vec3(.05, .07, .06) * (.5 + nap)) * uSkyLow * rimM * 1.1 + alb * uSkyLow * .03;',
  }), spots.length);
  spots.forEach((s, i) => { dummy.position.set(s[0], 0, s[1]); dummy.scale.set(s[2] * 1.2, s[3], s[2] * 0.9); dummy.rotation.set(0, s[4], 0); dummy.updateMatrix(); cushions.setMatrixAt(i, dummy.matrix); });
  cushions.instanceMatrix.needsUpdate = true; cushions.frustumCulled = false; cushions.name = 'kolam-moss';
  // loose pebbles and clods beside the route (many in the yard, a few grains of grit on the granite)
  const np = Math.round((look === 2 ? 380 : 160) * detail), pebbles = new THREE.InstancedMesh(cg, propMat(U, {
    gloss: 0.6, uniforms: { uPeb: { value: C(look === 2 ? '#8a7c62' : '#56607a') } }, fpars: 'uniform vec3 uPeb;',
    frag: 'float m1 = vnoise(vW.xz * 3.1), m2 = vnoise(vW.xz * 11.), m3 = vnoise(vW.xz * .7 + 9.); alb = mix(uPeb, uPeb.bgr * 1.1, m3 * .5) * (.6 + .7 * m1) * (.85 + .3 * m2 * close); alb = mix(alb, alb * 1.7, smoothstep(.62, .7, vnoise(vW.xz * 1.9 + vW.y * 3.)) * .5); n = normalize(n + vec3(m2 - .5, 0., m1 - .5) * .28); ao *= .5 + .5 * smoothstep(-.05, .5, vW.y); vec3 Rp = reflect(-V, n); emis += uSkyLow * (pow(max(dot(Rp, normalize(vec3(0., .55, .83))), 0.), 34.) * 1.5 + .3 * max(n.y, 0.) * max(n.y, 0.) + .34 * pow(1. - clamp(dot(V, n), 0., 1.), 3.)) + uSunCol * sunAt(vW) * pow(max(dot(Rp, uSunDir), 0.), 60.) * 2.;',
  }), np);
  for (let i = 0; i < np; i++) {
    const q = path.pointAt(rng() * 0.9), a = rng() * TAU, rr = 8 + 60 * rng() * rng(), sc = 0.35 + 1.3 * rng() * rng();
    const x = q.x + Math.cos(a) * rr, z = q.z + Math.sin(a) * rr; let ok = q.y < 45 && z > STEP_Z + 6;
    for (let k = 0; ok && k < hero.curve.count; k += 4) if (Math.abs(hero.curve.X[k] - x) < 4 && Math.abs(hero.curve.Z[k] - z) < 4) ok = false;
    for (const d of hero.anchors.dots) if (Math.hypot(d.x - x, d.z - z) < 4.5) ok = false;
    dummy.position.set(x, ok ? -0.1 * sc : -50, z); dummy.scale.set(sc * (0.8 + 0.6 * rng()), sc * (0.45 + 0.4 * rng()), sc); dummy.rotation.set(0, rng() * TAU, 0); dummy.updateMatrix(); pebbles.setMatrixAt(i, dummy.matrix);
  }
  pebbles.instanceMatrix.needsUpdate = true; pebbles.frustumCulled = false; pebbles.name = 'kolam-pebbles';
  // stalks: two crossed blades with a capsule at the tip
  const s = new F.Geo(), stem = C(look === 2 ? '#8f9a50' : '#7fa052'), cap = C('#9a8648');
  for (const [dx, dz] of [[1, 0], [0, 1]]) {
    const st = s.n, hw = [0.06, 0.045, 0.04, 0.11, 0.03], hy = [0, 0.5, 0.82, 0.92, 1];
    for (let k = 0; k < 5; k++) for (const c of [-1, 1]) { const id = s.v(dx * c * hw[k], hy[k], dz * c * hw[k], k >= 3 ? cap : stem); s.a[id * 4] = hy[k]; }
    for (let k = 0; k < 4; k++) s.quad(st + k * 2, st + k * 2 + 1, st + k * 2 + 3, st + k * 2 + 2);
  }
  const sgeo = s.build(); sgeo.computeVertexNormals();
  const stand = [], pp = []; for (let k = 0; k <= 90; k++) pp.push(path.pointAt(k / 90));
  for (const sp of spots) {
    let nd = 1e9; for (const q of pp) nd = Math.min(nd, Math.abs(q.x - sp[0]) + Math.abs(q.z - sp[1]));
    if (rng() < (nd > 190 ? 0.9 : 0.7)) continue;        // a few fine stalks, not a fence
    const n = 1 + Math.floor(rng() * 2.4); for (let k = 0; k < n; k++) stand.push([sp[0] + (rng() - 0.5) * 1.6, sp[3] * 0.6, sp[1] + (rng() - 0.5) * 1.6, 1.4 + 1.5 * rng(), rng() * TAU]);
  }
  const stalks = new THREE.InstancedMesh(sgeo, propMat(U, {
    vert: /* glsl */`
      vec3 o = (modelMatrix * im * vec4(0., 0., 0., 1.)).xyz; float dd = length(cameraPosition - o);
      p.xz *= max(1., dd * .0045);
      p.x += sin(uTime * 1.7 + o.x * .31 + o.z * .23) * .13 * A.x * A.x; p.z += cos(uTime * 1.3 + o.x * .2 - o.z * .27) * .1 * A.x * A.x;
      n = vec3(0., 1., 0.);`,
    frag: 'ao *= .6 + .4 * vA.x; emis += alb * uSkyLow * .45;',
  }), stand.length);
  stand.forEach((q, i) => { dummy.position.set(q[0], q[1], q[2]); dummy.scale.set(1, q[3], 1); dummy.rotation.set(0, q[4], 0); dummy.updateMatrix(); stalks.setMatrixAt(i, dummy.matrix); });
  stalks.instanceMatrix.needsUpdate = true; stalks.frustumCulled = false; stalks.name = 'kolam-moss-stalks';
  return { cushions, stalks, pebbles, spots };
}

// Where beads stand: beside the route, over the knot (never on the line), on the step between the flowers.
function scatterBeads(rng, hero, path, list, detail, density, lane) {
  const X = hero.curve.X, Z = hero.curve.Z, n = X.length, dots = hero.anchors.dots;
  const clearOfLine = (x, z, r) => {
    for (let i = 0; i < n; i += 3) { const dx = X[i] - x, dz = Z[i] - z; if (dx * dx + dz * dz < (r + 3.2) * (r + 3.2)) return false; }
    for (const d of dots) if (Math.hypot(d.x - x, d.z - z) < r + 3.6) return false;
    for (let i = 1; i < lane.length; i++) {                 // the ants' lane stays open
      const ax = lane[i - 1][0], az = lane[i - 1][1], bx = lane[i][0] - ax, bz = lane[i][1] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / Math.max(1e-6, bx * bx + bz * bz), 0, 1);
      if (Math.hypot(x - ax - bx * t, z - az - bz * t) < r + 3.4) return false;
    }
    return true;
  };
  const size = () => { const t = rng(); return 0.3 + 1.25 * t * t * t + (rng() < 0.06 ? 0.5 : 0); };
  const want = Math.round(520 * detail * clamp(density, 0.8, 1.25)), e0 = path.pointAt(0);
  for (let k = 0; k < 46; k++) { const x = e0.x + (rng() - 0.5) * 90, z = e0.z - 12 - rng() * 75, r = size() * 1.25; if (Math.abs(x - e0.x) > 6 + r && clearOfLine(x, z, r)) list.push([x, -0.03, z, r]); }
  for (let k = 0; k < want * 3 && list.length < want; k++) {
    let x, z; const r = size();
    if (k % 3 === 0) { const a = rng() * TAU, rr = Math.sqrt(rng()) * 150; x = Math.cos(a) * rr; z = Math.sin(a) * rr; }
    else { const p = path.pointAt(rng() * 0.93); if (p.y > 45) continue; const a = rng() * TAU, rr = 7 + 48 * rng() * rng(); x = p.x + Math.cos(a) * rr; z = p.z + Math.sin(a) * rr; }
    if (z < STEP_Z + 3) {
      if (z < DOOR_Z + 14 || Math.abs(x) > 130) continue;
      let ok = true; for (const h of HIB) if (Math.hypot(x - h[0], z - h[1]) < 12 * h[2] + r) ok = false;
      if (ok && Math.abs(z + 258) > 5 + r) list.push([x, STEP_Y - 0.03, z, r * 0.8]);
      continue;
    }
    if (Math.hypot(x - POT[0], z - POT[2]) < 14 + r || Math.hypot(x - BOWL[0], z - BOWL[2]) < 12 + r) continue;
    const jx = Math.abs(((x - 60) % 120 + 120) % 120), jz = Math.abs(((z - 60) % 120 + 120) % 120);
    if (Math.min(jx, 120 - jx) < 2.2 + r || Math.min(jz, 120 - jz) < 2.2 + r) continue;
    if (!clearOfLine(x, z, r)) continue;
    list.push([x, -0.03, z, r]);
  }
}

// ---------------------------------------------------------------------------------------------------
// The ants' lane, from their nest where the paving joints cross at (60, -180) to the ridge they cut: it runs beside the low pass
// for its whole length, 15 m off on the house side of our track (a rule over the whole stretch uDesc to uLow: the lane
// is the route itself moved sideways), climbs over whatever ridge lies in its way and keeps clear of the dots.
function antLane(route, hero) {
  const path = route.path, K = hero.curve, p = new THREE.Vector3(), t = new THREE.Vector3(), way = [[60.5, -181], [59.6, -170], [58, -157]];
  const nearK = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < K.count; i += 2) { if (K.W[i] < 0.5) continue; const d = (K.X[i] - x) ** 2 + (K.Z[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } } return { i: bi, d: Math.sqrt(bd) }; };
  const N = 9, u0 = route.uDesc + 0.002, u1 = route.uLow + 0.012;
  for (let i = 0; i <= N; i++) {
    const u = lerp(u1, u0, i / N); path.pointAt(u, p); path.tangentAt(u, t); const l = Math.hypot(t.x, t.z) || 1, off = lerp(11, 15, smoothstep(0, 0.35, 1 - i / N) * smoothstep(0, 0.3, i / N));
    let x = p.x + (t.z / l) * off, z = p.z - (t.x / l) * off;                    // (to the left of a heading that has the house ahead on the left)
    for (const d of hero.anchors.dots) { const dx = x - d.x, dz = z - d.z, dl = Math.hypot(dx, dz) || 1; if (dl < 8) { x = d.x + (dx / dl) * 8; z = d.z + (dz / dl) * 8; } }
    way.push([x, z]);
  }
  const last = way[way.length - 1], cut = nearK(last[0] - 6, last[1] + 6);
  way.push([K.X[cut.i], K.Z[cut.i]]);
  return { way, cut, nearK };
}

// Ants: sixty six-leg walkers on a two-lane loop from the joint to the ridge and back, the homeward lane
// carrying white clumps. Poses are written on the CPU each frame (60 x 7 floats); legs and antennae move
// in the vertex shader. aAnim = (weight, side, gait phase, kind): kind 1 antenna, 2 leg, 3 load.
function makeAnts(U, rng, hero, laneIn, count, look) {
  const g = new F.Geo(), body = C(look === 2 ? '#120a07' : '#0b0d12'), body2 = C(look === 2 ? '#2e1409' : '#1a2030'), white = C(PAL[3]).multiplyScalar(0.9);
  g.blob(0, 0.78, -0.82, 0.44, 0.42, 0.66, body2, body, 9, 6);          // gaster
  g.blob(0, 0.72, -0.14, 0.15, 0.16, 0.16, body, body, 6, 3);           // petiole
  g.blob(0, 0.8, 0.3, 0.3, 0.29, 0.5, body2, body, 8, 5);               // thorax
  g.blob(0, 0.88, 1.02, 0.36, 0.31, 0.38, body2, body, 8, 5);           // head
  for (const s of [-1, 1]) {
    g.tube([[s * 0.16, 0.8, 1.3], [s * 0.3, 0.74, 1.52], [s * 0.1, 0.72, 1.62]], [0.07, 0.05, 0.02], 4, body, body);   // mandible
    const r = g.tube([[s * 0.17, 1.02, 1.2], [s * 0.48, 1.36, 1.5], [s * 0.56, 1.14, 1.98]], [0.05, 0.045, 0.035], 4, body, body);
    g.anim(r, (x, y, z) => [clamp((z - 1.2) / 0.78, 0, 1), s, 0, 1]);
    for (let k = 0; k < 3; k++) {
      const z0 = 0.58 - k * 0.3, fz = [0.95, 0.05, -1.05][k], out = [1.2, 1.32, 1.25][k];
      const leg = g.tube([[s * 0.2, 0.68, z0], [s * 0.72, 1.0, lerp(z0, fz, 0.4)], [s * out * 0.9, 0.36, lerp(z0, fz, 0.85)], [s * out, 0.02, fz]], [0.075, 0.06, 0.045, 0.03], 4, body, body);
      const gait = ((k + (s > 0 ? 1 : 0)) % 2);
      g.anim(leg, (x) => [clamp((Math.abs(x) - 0.2) / (out - 0.2), 0, 1), s, gait, 2]);
    }
  }
  const load = g.blob(0, 1.2, 1.62, 0.42, 0.38, 0.44, white, white, 7, 4);
  g.move(load, (p, i) => { p.x *= 1 + 0.25 * Math.sin(i * 2.1); p.y += 0.06 * Math.sin(i * 3.7); });
  g.anim(load, () => [0, 0, 0, 3]);
  const base = g.build(); base.computeVertexNormals();
  const geo = new THREE.InstancedBufferGeometry(); geo.index = base.index;
  for (const k of ['position', 'normal', 'color', 'aAnim', 'aPivot']) geo.setAttribute(k, base.getAttribute(k));
  const pose = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4), state = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  pose.setUsage(THREE.DynamicDrawUsage); state.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iPose', pose); geo.setAttribute('iState', state); geo.instanceCount = count;
  const mesh = new THREE.Mesh(geo, propMat(U, {
    gloss: 0.85,
    vpars: 'attribute vec4 iPose; attribute vec3 iState;',
    vert: /* glsl */`
      float kind = A.w, ph = iPose.w;
      if (kind > 1.5 && kind < 2.5) { float lp = ph + A.z * 3.14159; p.z += sin(lp) * .34 * A.x; p.y += max(0., cos(lp)) * .24 * A.x * A.x; }
      else if (kind > .5 && kind < 1.5) { p.x += sin(uTime * 5. + ph * .3 + A.y * 1.3) * .2 * A.x; p.y += cos(uTime * 4.3 + ph * .2) * .14 * A.x; }
      else if (kind > 2.5) p = mix(vec3(0., .9, 1.3), p, iState.x);
      p.y += sin(ph * 2.) * .03; p *= iState.y;
      float hc = cos(iPose.z), hs = sin(iPose.z);
      p = vec3(p.x * hc + p.z * hs, p.y, -p.x * hs + p.z * hc) + vec3(iPose.x, iState.z, iPose.y);
      n = vec3(n.x * hc + n.z * hs, n.y, -n.x * hs + n.z * hc);`,
    frag: 'if (vA.w > 2.5) { gloss = 0.; alb *= .8 + .3 * vnoise(vL.xy * 9.); } else { ao *= .55 + .45 * smoothstep(.2, .9, vL.y); float rimA = pow(1. - clamp(dot(V, n), 0., 1.), 3.); vec3 Ra = reflect(-V, n); emis += uSkyLow * (pow(max(dot(Ra, normalize(vec3(0., .6, .8))), 0.), 22.) * .9 + .22 * rimA * max(n.y + .3, 0.)) + uSunCol * sunAt(vW) * rimA * .55; }',
  }));
  mesh.frustumCulled = false; mesh.name = 'kolam-ants';
  // each ant's long shadow, thrown west along the ground by the level sun (it is there only where the sun is): one
  // more instanced mesh on the same pose attributes
  const sq = new THREE.PlaneGeometry(1, 1); sq.rotateX(-Math.PI / 2);
  const sgeo = new THREE.InstancedBufferGeometry(); sgeo.index = sq.index; sgeo.setAttribute('position', sq.getAttribute('position'));
  sgeo.setAttribute('iPose', pose); sgeo.setAttribute('iState', state); sgeo.instanceCount = count;
  const shadow = new THREE.Mesh(sgeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, uniforms: { ...fogU(), ...U },
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      attribute vec4 iPose; attribute vec3 iState; varying vec2 vQ; varying vec3 vW;
      void main(){
        vQ = position.xz + .5; vec2 sd = -normalize(uSunDir.xz + vec2(1e-4, 0.)), sp = vec2(-sd.y, sd.x);
        vec2 xz = iPose.xy + (sd * (vQ.x * 10. - .5) + sp * (vQ.y - .5) * (1.5 + .9 * vQ.x)) * step(.5, iState.y);
        vec4 wp = vec4(xz.x, .1, xz.y, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      varying vec2 vQ; varying vec3 vW;
      void main(){
        float across = abs(vQ.y - .5) * 2., a = smoothstep(0., .06, vQ.x) * (1. - smoothstep(.3, 1., vQ.x)) * (1. - smoothstep(.35, 1., across));
        gl_FragColor = vec4(uSkyTop * .12 + uHouse * .25, a * .8 * sunAt(vW));
        #include <fog_fragment>
      }`,
  }));
  shadow.frustumCulled = false; shadow.renderOrder = 0.4; shadow.name = 'kolam-ant-shadows';
  // the lane (antLane): from the joint, beside the low pass on its house side, to the ridge
  const K = hero.curve, nearK = laneIn.nearK, cut = laneIn.cut, cx = K.X[cut.i], cz = K.Z[cut.i], way = laneIn.way;
  const curve = new THREE.CatmullRomCurve3(way.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  const half = curve.getLength(), NS = Math.ceil(half / 0.75), lane = new Float32Array((NS + 1) * 3), pt = new THREE.Vector3(), tg = new THREE.Vector3();
  for (let i = 0; i <= NS; i++) {
    curve.getPointAt(i / NS, pt); curve.getTangentAt(i / NS, tg);
    const d = nearK(pt.x, pt.z).d, dotD = hero.anchors.dots.reduce((m, q) => Math.min(m, Math.hypot(q.x - pt.x, q.z - pt.z)), 1e9);
    lane[i * 3] = pt.x; lane[i * 3 + 1] = pt.z; lane[i * 3 + 2] = Math.max(1.55 * (1 - smoothstep(0.4, 2.4, d)), 2.2 * (1 - smoothstep(0.5, 3, dotD)));
  }
  const ph0 = []; for (let i = 0; i < count; i++) ph0.push((i + 0.6 * rng()) / count);
  const tmp = { x: 0, z: 0, y: 0, th: 0 };
  const sample = (s, side) => {                 // s metres from the joint along the lane, side -1 out, +1 home
    const f = clamp(s / half, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(f)), t = f - i;
    const x0 = lane[i * 3], z0 = lane[i * 3 + 1], x1 = lane[i * 3 + 3], z1 = lane[i * 3 + 4], dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1;
    const off = 1.5 * side * smoothstep(0, 6, s) * smoothstep(0, 5, half - s);
    tmp.x = lerp(x0, x1, t) - (dz / l) * off; tmp.z = lerp(z0, z1, t) + (dx / l) * off; tmp.y = lerp(lane[i * 3 + 2], lane[i * 3 + 5], t);
    tmp.th = Math.atan2(dx * -side, dz * -side);
    return tmp;
  };
  return {
    mesh, shadow, cutS: cut.i * K.ds, cutAt: new THREE.Vector3(cx, 0, cz), half, lane,
    update(time, b) {
      const P = pose.array, S = state.array, front = smoothstep(0.7, 0.765, b) * 2.2 * half, gone = b < 0.695;       // (they are out along the whole lane before the low pass begins)
      for (let i = 0; i < count; i++) {
        const d = (ph0[i] * 2 * half + time * 8.5) % (2 * half), home = d > half, s = home ? 2 * half - d : d;
        const q = sample(s, home ? 1 : -1);
        P[i * 4] = q.x; P[i * 4 + 1] = q.z; P[i * 4 + 2] = q.th; P[i * 4 + 3] = d * 2.6;
        const show = gone ? 0 : smoothstep(0, 5, s) * (d < front ? 1 : 0);
        S[i * 3] = home ? smoothstep(half, half - 3, s) : 0; S[i * 3 + 1] = show; S[i * 3 + 2] = q.y;
      }
      pose.needsUpdate = true; state.needsUpdate = true; mesh.visible = !gone; shadow.visible = !gone;
    },
  };
}

// House sparrows, 28 m long and 24 m tall. One geometry, one material each (their pose is four numbers):
// uPose = (wing spread, flap angle, peck angle, crouch). aAnim = (u, w, part, side): part 1 wing, 3 legs.
function sparrowGeometry(variant) {
  const g = new F.Geo(), hen = variant === 1;
  const back = C(hen ? '#7d6a50' : '#6b4a2e'), belly = C(hen ? '#c2b59c' : '#b5aa98'), crown = C(hen ? '#7b6c58' : '#6d6965'), nape = C(hen ? '#84684a' : '#7a3d22');
  const bib = C(hen ? '#b5a88f' : '#17120f'), cheek = C('#cdc4b2'), horn = C(hen ? '#8a7558' : '#2a2622'), leg = C('#a07a62'), dark = C('#2c2118'), buff = C('#b89a6a');
  g.loft([
    { z: -10, y: 10.5, rx: 1.4, ry: 1.4, top: back, belly }, { z: -7, y: 11.5, rx: 4.2, ry: 3.8, top: back, belly }, { z: -3, y: 12.8, rx: 6.3, ry: 5.8, top: back, belly },
    { z: 1.5, y: 14, rx: 6.9, ry: 6.6, top: back, belly }, { z: 5.5, y: 15.6, rx: 6.2, ry: 6.2, top: back, belly }, { z: 8.5, y: 17.6, rx: 4.9, ry: 5, top: nape, belly: bib },
    { z: 10.2, y: 19.3, rx: 4.2, ry: 4.3, top: nape, belly: bib }, { z: 11.8, y: 20.6, rx: 4.3, ry: 4.2, top: crown, belly: cheek }, { z: 13.6, y: 21, rx: 3.5, ry: 3.3, top: crown, belly: bib },
    { z: 15, y: 20.8, rx: 2.0, ry: 1.9, top: crown, belly: bib }, { z: 15.9, y: 20.6, rx: 0, ry: 0, top: crown, belly: bib },
  ], { sides: 16, shade: [-0.35, 0.35] });
  g.loft([{ z: 15.1, y: 20.55, rx: 1.35, ry: 1.2, top: horn }, { z: 16.6, y: 20.35, rx: 0.85, ry: 0.75, top: horn }, { z: 18.3, y: 20.05, rx: 0, ry: 0, top: horn }], { sides: 8 });
  for (const s of [-1, 1]) g.blob(s * 2.95, 21.35, 13.5, 0.5, 0.6, 0.6, C('#050505'), C('#050505'), 7, 4);
  // tail: two layered blades
  for (const [w, dy] of [[1, 0], [0.6, 0.5]]) {
    const A = [], B = []; for (let k = 0; k <= 4; k++) { const t = k / 4, z = -8.5 - 11 * t, y = 11 - 3.6 * t + dy, hw = (2.2 + 3.6 * t) * w; A.push([-hw, y - 0.3 * t, z]); B.push([hw, y - 0.3 * t, z]); }
    g.strip(A, B, w === 1 ? buff.clone().lerp(dark, 0.45) : dark, w === 1 ? back : dark);
  }
  // wings, modelled spread: root at the shoulder, 15 m span, three bands (chestnut coverts, white bar, dark flights)
  for (const s of [-1, 1]) {
    const sh = [s * 5.3, 16.6, 4.2];
    const r = sheet(g, 18, 8, (u, w) => {
      const chord = lerp(10.5, 8.2, u) * (1 - 0.55 * Math.pow(u, 6)), sweep = -3.6 * u * u;        // the fingers of the primaries are cut out in the shader
      return [sh[0] + s * u * 19.5, sh[1] + 0.9 * Math.sin(w * Math.PI) * (1 - u) - 0.4 * u + 0.5 * u * u * w, sh[2] + 2.2 + sweep - w * chord];
    }, (u, w) => (w < 0.3 ? nape.clone().lerp(back, u) : w < 0.4 ? cheek.clone().lerp(buff, u * 0.5) : dark.clone().lerp(buff, 0.25 * Math.abs(Math.sin(u * 28)))), 1, s);
    g.pivot(r, sh[0], sh[1], sh[2]);
    // legs: thigh tuft, tarsus, three toes forward and one back, each with a claw
    const tag = (rr) => g.anim(rr, () => [0, 0, 3, s]);
    tag(g.blob(s * 2.7, 9.6, 0.4, 2.1, 2.6, 2.4, belly, belly, 7, 4));
    tag(g.tube([[s * 2.7, 9.4, 0.4], [s * 2.85, 5.6, -1.3], [s * 3.0, 0.75, 0.7]], [0.85, 0.7, 0.62], 7, leg, leg));
    for (const [ang, len] of [[-0.5, 5], [0, 5.8], [0.5, 5], [Math.PI, 3.6]]) {
      const dx = Math.sin(ang) * s, dz = Math.cos(ang);
      tag(g.tube([[s * 3.0, 0.7, 0.7], [s * 3.0 + dx * len * 0.5, 0.55, 0.7 + dz * len * 0.5], [s * 3.0 + dx * len * 0.85, 0.42, 0.7 + dz * len * 0.85], [s * 3.0 + dx * len, 0.05, 0.7 + dz * len]], [0.55, 0.42, 0.3, 0.04], 6, leg, dark));
    }
  }
  const geo = g.build(); geo.computeVertexNormals();
  return geo;
}
function makeSparrows(U, variant) {
  const geoCock = sparrowGeometry(0), geoHen = variant === 1 ? sparrowGeometry(1) : geoCock, birds = [];
  for (let i = 0; i < 3; i++) {
    const hen = variant === 1 && i > 0, geo = hen ? geoHen : geoCock;       // the bird on the pot's rim is a cock on every look: black bib, pale cheek, chestnut wing
    const nape = C(hen ? '#8a6c4c' : '#8a4424'), cheek = C('#d6cebc'), dark = C(hen ? '#4a3c2c' : '#2a2018');
    const uPose = { value: new THREE.Vector4(0, 0, 0, 0) }, uTuck = { value: 0 };
    const mat = propMat(U, {
      gloss: 0.08, uniforms: { uPose, uTuck, uWingA: { value: nape }, uWingB: { value: cheek }, uWingC: { value: dark } },
      vpars: 'uniform vec4 uPose; uniform float uTuck;', fpars: 'uniform vec3 uWingA, uWingB, uWingC;',
      vert: /* glsl */`
        if (A.z > .5 && A.z < 1.5) {
          vec3 q = p - aPivot; float fa = (1. - uPose.x) * 1.42 * A.w, fc = cos(fa), fs = sin(fa);
          q = vec3(q.x * fc + q.z * fs, q.y, -q.x * fs + q.z * fc); n = vec3(n.x * fc + n.z * fs, n.y, -n.x * fs + n.z * fc);
          q.x *= mix(.45, 1., uPose.x); q.y -= (1. - uPose.x) * abs(q.z) * .22;
          float wa = uPose.y * A.w * (.4 + .6 * A.x), wc = cos(wa), ws = sin(wa);
          q = vec3(q.x * wc - q.y * ws, q.x * ws + q.y * wc, q.z); n = vec3(n.x * wc - n.y * ws, n.x * ws + n.y * wc, n.z);
          p = aPivot + q;
        }
        if (A.z < 2.5) {
          vec3 q = p - vec3(0., 10., 0.); float pc = cos(uPose.z), ps = sin(uPose.z);
          q = vec3(q.x, q.y * pc - q.z * ps, q.z * pc + q.y * ps); n = vec3(n.x, n.y * pc - n.z * ps, n.z * pc + n.y * ps);
          p = vec3(0., 10. - uPose.w, 0.) + q;
        } else { p.y *= 1. - uPose.w * .09; p = mix(p, vec3(p.x * .8, 10.2 + p.y * .12, -2.5 + p.z * .5), uTuck); }`,
      frag: /* glsl */`
        float rimK = pow(1. - clamp(dot(V, n), 0., 1.), 2.);
        if (vA.z > 2.5) { alb *= .7 + .35 * step(.5, fract(vL.y * .9 + vL.z * .4)); ao *= .6 + .4 * smoothstep(0., 4., vL.y); }
        else if (vA.z > .5) {
          // the wing: chestnut lesser coverts, a white bar, black-centred greater coverts, then the flight feathers, each
          // with its shaft and pale edge; the primaries end in separate fingers with the sky between them
          float wu = vA.x, ww = vA.y, nf = 17., fu = wu * nf + .35 * ww * ww, fi = floor(fu), ff = fract(fu) - .5;
          float deep = mix(.1, .46, smoothstep(.5, .95, wu)), into = (ww - (1. - deep)) / deep;
          if (into > 0. && abs(ff) > .5 - mix(.05, .26, smoothstep(.55, 1., wu)) * into - .5 * smoothstep(.75, 1., into) * smoothstep(.2, .5, abs(ff))) discard;
          float fh = hash21(vec2(fi, 3.)), wob = (vnoise(vec2(wu * 9., ww * 3.)) - .5) * .06, wq = ww + wob;
          vec3 chest = uWingA * (.75 + .5 * vnoise(vec2(wu * 30., ww * 40.))), flight = uWingC * (.7 + .5 * fh);
          float cov = abs(fract(wu * 26. + floor(wq * 9.) * .5) - .5) * 2.;                                   // small covert scallops
          vec3 wc = mix(chest * (.7 + .4 * cov), uWingB, smoothstep(.2, .23, wq) * (1. - smoothstep(.27, .31, wq)));
          wc = mix(wc, mix(uWingC * .6, uWingA * 1.1, smoothstep(.25, .48, abs(fract(wu * 11. + .5) - .5) * 2.)), smoothstep(.3, .33, wq) * (1. - smoothstep(.46, .5, wq)));
          float edge = smoothstep(.3, .47, abs(ff)), shaft = 1. - smoothstep(0., .05, abs(ff));
          wc = mix(wc, flight * (1. - .3 * shaft) + uWingB * (.1 + .2 * fh) * edge * smoothstep(.55, 1., ww), smoothstep(.47, .52, wq));
          alb = wc;
          float under = step(n.y, -.05);                                                                       // seen from below: pale, the light comes through
          alb = mix(alb, mix(vec3(.42, .39, .34), alb, .35) * (.85 + .3 * edge), under * .85);
          emis += mix(uSkyLow, uSunCol, .25 * uSun) * (.1 + .32 * smoothstep(.45, 1., ww) * (1. - .6 * shaft)) * under * alb * 2.2;
          n = normalize(n + vec3(ff * .5, 0., 0.) * (1. - smoothstep(60., 260., dist)));
          ao *= .7 + .3 * smoothstep(.0, .25, ww);
        } else {
          // the body: soft masses, not scales. Dark streaks along the back, a paler breast with faint grey streaks,
          // fine barbs everywhere, and a downy rim that takes the sky.
          float cy = 11. + (vL.z + 10.) * .4, upn = clamp((vL.y - cy) / 5., -1., 1.);
          float st = vnoise(vec2(vL.x * 1.5 + vnoise(vL.xz * .3) * 2., vL.z * .34)), st2 = vnoise(vec2(vL.x * 2.4 + 9., (vL.z - vL.y * .6) * .5));
          float barb = vnoise(vec2(vL.x * 6., vL.z * 1.6 + vL.y * 1.2)) * .6 + vnoise(vec2(vL.x * 15., vL.z * 4. + vL.y * 3.)) * .4;
          float backK = smoothstep(.1, .6, upn) * step(vL.z, 9.) * step(-9., vL.z);
          alb *= mix(1., .32, smoothstep(.5, .72, st) * backK);                                                // black streaks on the mantle
          float brK = 1. - smoothstep(-.5, .15, upn);                                                          // the breast and belly: soft grey, layered in rows of rounded feathers
          float fy = vL.y * .62 + vL.z * .3, fx2 = vL.x * .55 + .5 * floor(fy), scal = length(vec2(fract(fx2) - .5, (fract(fy) - .15) * .9));
          alb *= mix(1., .9 + .16 * smoothstep(.2, .62, scal), brK) * mix(1., .93 + .1 * st2, brK);
          alb *= mix(.8 + .4 * barb, .95 + .1 * barb, brK);
          n = normalize(n + vec3(barb - .5, 0., st - .5) * .35 * (1. - .7 * brK) * (1. - smoothstep(60., 260., dist)));
          ao *= .62 + .38 * smoothstep(-1., .4, n.y);
          emis += alb * uSkyLow * .35 * rimK;
        }
        emis += alb * uSkyLow * .4 * max(-n.y, 0.);`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.visible = false; mesh.name = 'kolam-sparrow-' + i;
    birds.push({ mesh, pose: uPose.value, tuck: uTuck });
  }
  // soft contact shade under each bird
  const sg = new THREE.CircleGeometry(1, 24); sg.rotateX(-Math.PI / 2);
  const shade = new THREE.InstancedMesh(sg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, uniforms: { ...fogU(), uHouse: U.uHouse },
    vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vC; void main(){ vC = position.xz; vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: '#include <fog_pars_fragment>\nuniform vec3 uHouse; varying vec2 vC; void main(){ float r = length(vC); float a = (1. - smoothstep(.15, 1., r)) * .62; gl_FragColor = vec4(uHouse * .5, a);\n#include <fog_fragment>\n}',
  }), 3);
  shade.frustumCulled = false; shade.renderOrder = 0.5; shade.name = 'kolam-sparrow-shade';
  return { birds, shade };
}

// The honeybee, 3 m long: striped abdomen, furry thorax, dangling legs, wings beating in the vertex shader.
function makeBee(U) {
  const g = new F.Geo(), amber = C('#c98a1e'), black = C('#16110c'), fur = C('#8a6a2a'), wing = C('#b9c4d6');
  const ab = g.blob(0, 0, -0.75, 0.52, 0.5, 0.95, amber, amber, 10, 7);
  g.paint(ab, (x, y, z, c) => { if (Math.sin(z * 9.5) > 0.1) c.copy(black); });
  g.blob(0, 0.08, 0.42, 0.5, 0.48, 0.52, fur, fur, 9, 5);
  g.blob(0, 0.02, 1.08, 0.36, 0.34, 0.3, black, black, 8, 4);
  for (const s of [-1, 1]) {
    g.blob(s * 0.25, 0.08, 1.2, 0.16, 0.2, 0.16, C('#050505'), C('#050505'), 6, 3);
    g.tube([[s * 0.12, 0.25, 1.25], [s * 0.3, 0.55, 1.5], [s * 0.36, 0.4, 1.85]], [0.035, 0.03, 0.02], 4, black, black);
    for (let k = 0; k < 3; k++) { const z = 0.7 - k * 0.3; g.tube([[s * 0.3, -0.25, z], [s * 0.62, -0.6, z - 0.1], [s * 0.5, -1.15, z - 0.35]], [0.06, 0.05, 0.03], 4, black, black); }
    const r = sheet(g, 5, 2, (u, w) => [s * (0.22 + u * 1.9), 0.5 + 0.1 * u, 0.55 - 0.25 * u - w * (0.75 - 0.3 * u * u)], () => wing, 1, s);
    g.pivot(r, s * 0.22, 0.5, 0.4);
  }
  const mat = propMat(U, {
    gloss: 0.35,
    vert: 'if (A.z > .5) { vec3 q = p - aPivot; float wa = (.25 + .9 * sin(uTime * 95.)) * A.w, wc = cos(wa), ws = sin(wa); q = vec3(q.x * wc - q.y * ws, q.x * ws + q.y * wc, q.z); p = aPivot + q; }',
    frag: 'if (vA.z > .5) { alb *= .8 + .4 * step(.5, fract(vA.x * 4. + vA.y * 2.)); emis += uSkyLow * .25; } else { alb *= .75 + .5 * vnoise(vL.xz * 14.); }',
  });
  const geo = g.build(); geo.computeVertexNormals();
  const bees = [];
  for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.visible = false; m.name = 'kolam-bee-' + i; bees.push(m); }
  return bees;
}

// ---------------------------------------------------------------------------------------------------
const LOOKS = [
  { name: 'loop', zen: '#182246', mid: '#3d5582', hor: '#8191b4', band: '#E7B48B', rose: '#d48a92', skyLow: '#A9B9D6', skyTop: '#4a5a8a', house: '#0b111c', sunCol: '#f09a58',
    fog: 0.0020, tint: '#f6f4fa', shadow: '#0b0f1a', sat: 1.04, exposure: 1.0 },
  { name: 'festival', zen: '#2c3a80', mid: '#7480ba', hor: '#bfb1c6', band: '#f4c29c', rose: '#ea8aa6', skyLow: '#c6bfd6', skyTop: '#6a78bc', house: '#141220', sunCol: '#f2a060',
    fog: 0.0017, tint: '#fff4f4', shadow: '#1a1030', sat: 1.12, exposure: 0.94 },
  { name: 'yard', zen: '#213e60', mid: '#6f8fa8', hor: '#9db0c2', band: '#f8b76a', rose: '#e08460', skyLow: '#c0cbd4', skyTop: '#4a6f94', house: '#1a1f27', sunCol: '#f39a4c',
    fog: 0.00095, tint: '#fff8ee', shadow: '#0e1420', sat: 1.12, exposure: 1.1 },
];

export default {
  id: 'kolam-at-dawn',
  name: 'Kolam at Dawn',
  category: 'domestic',
  weirdness: 0.1,
  media: ['tiny', 'air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const density = vary.density ?? 1, mood = vary.mood ?? 0.5, hour = vary.hour || 'any';
    const seedN = Number.isFinite(+ctx.seed) ? Math.abs(Math.floor(+ctx.seed)) : Math.floor(rng.fork('look')() * 1e6);
    let look = hour === 'day' ? 1 : hour === 'golden' ? 2 : (hour === 'dawn' || hour === 'night') ? 0 : (seedN % 5) % 3;
    const rare = !!vary.rare; if (rare && look === 2) look = 0;          // the open loop needs the looped knot
    const LK = LOOKS[look];
    const scene = new THREE.Scene();
    const dusk = look === 1 ? 0.5 : 1;                                   // the festival morning starts darker, so the powder and the veil glow
    const hor0 = C(LK.hor), hor1 = mixC(LK.hor, LK.band, 0.22), zen0 = C(LK.zen).multiplyScalar((0.8 + 0.2 * mood) * dusk), zen1 = mixC(LK.zen, LK.mid, 0.4);
    const mid0 = C(LK.mid).multiplyScalar(0.86 * dusk), mid1 = mixC(LK.mid, LK.hor, 0.25), horD = C(LK.hor).multiplyScalar(dusk);
    const fogCol = horD.clone();
    // the band in the east: on the yard's morning it is a low rosy peach until the sun is near, and only then the gold of its hour
    const band1 = C(LK.band), band0 = look === 2 ? mixC(LK.band, '#e59c8e', 0.6).multiplyScalar(0.9) : band1.clone();
    scene.fog = new THREE.FogExp2(fogCol, LK.fog * (0.92 + 0.16 * mood));

    const hero = await buildHero(ctx, { look, rare, palette: PAL, groundSize: 5400 });
    scene.add(hero.object);
    const HU = hero.uniforms;
    HU.uSkyLow.value.set(LK.skyLow); HU.uSkyTop.value.set(LK.skyTop); HU.uHouse.value.set(LK.house); HU.uSunCol.value.set(LK.sunCol); HU.uRose.value.set(LK.rose);
    HU.uStep.value.set(STEP_Z, STEP_Y - 0.6, 20, 1); HU.uLime.value.set(look === 2 ? '#bdb9a8' : '#b6bac2'); HU.uOchre.value.set(look === 2 ? '#7b5140' : '#743f36');      // the step's bands stand in the wet
    const skyLow0 = C(LK.skyLow).multiplyScalar(0.9), skyLow1 = C(LK.skyLow).multiplyScalar(1.06);
    const U = { ...HU, uZen: { value: zen0.clone() }, uMid: { value: mid0.clone() }, uHor: { value: fogCol }, uBand: { value: C(LK.band) }, uRose: { value: C(LK.rose) },
      uWarm: { value: 0 }, uBandK: { value: 0 }, uSunUp: { value: 0 }, uSunDisc: { value: C('#ff9a4a') }, uStars: { value: 1 }, uLampK: { value: 1 },
      uHz: { value: new THREE.Vector2(100, 480) }, uCliff: { value: look === 2 ? new THREE.Color(0.052, 0.058, 0.075) : look === 1 ? new THREE.Color(0.058, 0.052, 0.108) : new THREE.Color(0.054, 0.063, 0.113) } };          // the cliff: where its detail sinks into its one tone and where that tone has gone into the haze; the tone itself
    await ctx.yield();

    const route = await planRoute(hero, look, ctx), path = route.path;
    await ctx.yield();
    const dome = makeDome(U); scene.add(dome);
    await ctx.yield();
    const house = makeHouse(U, noise, look); scene.add(house);
    await ctx.yield();
    for (const m of makeDoorFittings(U)) scene.add(m);
    await ctx.yield();
    for (const m of makePot(U, noise)) scene.add(m);
    await ctx.yield();
    const beadList = [];
    scene.add(makeYardThings(U, noise, rng.fork('things'), route.entryX, beadList));
    await ctx.yield();
    const smoke = makeSmoke(U); scene.add(smoke);
    await ctx.yield();
    const hibs = await makeHibiscus(U, rng.fork('hibiscus'), beadList, ctx); scene.add(hibs.mesh);
    await ctx.yield();
    const lane = antLane(route, hero);
    scatterBeads(rng.fork('beads'), hero, path, beadList, detail, density, lane.way);
    await ctx.yield();
    const beads = makeBeads(U, beadList, look === 2 ? mixC('#4a4026', PAL[1], 0.3).multiplyScalar(0.75) : mixC(PAL[0], PAL[1], 0.25).multiplyScalar(0.5)); scene.add(beads);
    await ctx.yield();
    const moss = makeMoss(U, rng.fork('moss'), noise, path, detail, look, hero); scene.add(moss.cushions, moss.stalks, moss.pebbles);
    await ctx.yield();
    const ants = makeAnts(U, rng.fork('ants'), hero, lane, Math.round(clamp(60 * density, 48, 72)), look); scene.add(ants.mesh, ants.shadow);
    await ctx.yield();
    const spar = makeSparrows(U, look === 1 ? 1 : 0); for (const b of spar.birds) scene.add(b.mesh); scene.add(spar.shade);
    await ctx.yield();
    const bees = makeBee(U); for (const m of bees) scene.add(m);
    await ctx.yield();
    // the threshold's own colours: lamps along the step and one tall lamp by the door, mango leaves over it, flowers on the dots
    const street = await makeStreet(U, ctx.core.makeRng(ctx.core.hashSeed('kolam-street:' + seedN)), noise, look, ctx);      // (its own stream: the forks after it draw as before)
    scene.add(street.mesh);
    await ctx.yield();
    const lamps = makeLamps(U, rng.fork('lamps'), street.flames); scene.add(lamps.bodies, lamps.fire);
    const lampW = []; for (let i = 0; i < 10; i++) { const f = lamps.flames[i]; HU.uLamps.value[i].set(f[0], f[1] + 3, f[2], 1); lampW.push(1); }
    HU.uLamps.value[10].set(TALL[0], STEP_Y + 33, TALL[1], 2.8); lampW.push(2.8);
    await ctx.yield();
    scene.add(makeFestoon(U, rng.fork('festoon')));
    await ctx.yield();
    scene.add(makeDotFlowers(U, rng.fork('dotflowers'), hero, look));
    await ctx.yield();
    const timeU = { value: 0 };
    const motes = fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', count: Math.round(3800 * detail), box: [170, 80, 170], size: [0.12, 0.36],
      colors: ['#e9eef8', '#cfd9ee', '#ffffff'], intensity: 0.7, opacity: 0.55, additive: 0.3, velocity: [1.5, -1.7, 0.7], velocityRandom: [1.2, 0.9, 1.2], turbulence: [2.2, 1, 0.25], twinkle: 0.4, near: [3, 10], time: timeU });
    scene.add(motes.object);
    await ctx.yield();
    const sparks = fx.makeParticles({ rng: rng.fork('sparks'), preset: 'dust', follow: false, center: [0, 46, -236], box: [130, 46, 76], count: Math.round(520 * detail), size: [0.16, 0.42],
      colors: [PAL[5], PAL[4], '#fff0d0'], intensity: 1.5, opacity: 0.8, additive: 0.8, velocity: [-0.9, -0.5, 0.2], velocityRandom: [0.8, 0.5, 0.8], turbulence: [1.6, 0.8, 0.3], twinkle: 0.35, near: [3, 9], time: timeU });
    sparks.setOpacity(0); scene.add(sparks.object);
    await ctx.yield();
    const mist = fx.makeMist({ rng: rng.fork('mist'), count: 46, area: [1100, 10, 320], center: [0, 7, 430], size: [50, 110], color: '#' + mixC(LK.hor, '#ffffff', 0.25).getHexString(), opacity: 0.24, drift: [6, 0, 1.4], time: timeU });
    scene.add(mist.object);
    await ctx.yield();

    // ---- sparrows: where each stands (19 m from the ridge it pecks, facing it, well off our track) and when
    const K = hero.curve, v3 = new THREE.Vector3();
    const nearK = (x, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < K.count; i += 2) { if (K.W[i] < 0.5) continue; const d = (K.X[i] - x) ** 2 + (K.Z[i] - z) ** 2; if (d < bd) { bd = d; bi = i; } } return bi; };
    const SPOTS = [[-20, -104, -0.1, -1, -12, -90], [95, 30, -0.6, 0.8], [-85, 35, 0.3, -0.95]];          // (the third keeps clear of the pot in the south-west corner)
    const late = []; for (let i = 0; i <= 80; i++) late.push(path.pointAt(lerp(route.uOfB(0.76), 1, i / 80)));
    const plan = spar.birds.map((bird, i) => {
      const stands = [], S = SPOTS[i];
      for (let j = 0; j < 3; j++) {
        const cx = S[0] + S[2] * 30 * j, cz = S[1] + S[3] * 30 * j, ki = j === 0 && S.length > 4 ? nearK(S[4], S[5]) : nearK(cx, cz), rx = K.X[ki], rz = K.Z[ki];
        let dx = cx - rx, dz = cz - rz, l = Math.hypot(dx, dz); if (l < 1) { dx = S[2]; dz = S[3]; l = 1; }
        let sx = rx + (dx / l) * 19, sz = rz + (dz / l) * 19;
        for (let pass = 0; pass < 3; pass++) {          // keep the whole bird 30 m clear of the low pass and the exit
          let bd = 1e9, bp = late[0]; for (const q of late) { const d = Math.hypot(sx - q.x, 13 - q.y, sz - q.z); if (d < bd) { bd = d; bp = q; } }
          if (bd >= 30) break;
          const ax = sx - bp.x, az = sz - bp.z, al = Math.hypot(ax, az) || 1; sx += (ax / al) * (32 - bd); sz += (az / al) * (32 - bd);
        }
        const reach = Math.hypot(rx - sx, rz - sz);
        stands.push({ x: sx, z: sz, yaw: reach < 40 ? Math.atan2(rx - sx, rz - sz) : Math.atan2(-sx * 0.3, 60 - sz), s: ki * K.ds, reach: reach > 15 && reach < 22 });
      }
      // (the first bird lands sooner, at the end of the look-down, pecks at the house-side tip and hops twice toward the
      // step, each time further along the way we are going: through the low pass it stands on the open ground beyond
      // the ant column, between us and the door, where the gaze of that whole stretch rests)
      if (i === 0) [[-8, -140], [16, -186]].forEach((q, j) => { stands[j + 1] = { x: q[0], z: q[1], yaw: Math.atan2(44 - q[0], -124 - q[1]), s: stands[0].s, reach: false }; });
      const tL = i === 0 ? 0.728 : 0.772 + 0.01 * i, t0 = tL + 0.028;
      return { stands, tL, t0, hops: i === 0 ? [0.768, 0.8] : [t0 + 0.05, t0 + 0.1] };
    });
    // Before they land: bird 0 comes down to the brass pot while we are over the second rise, perches on its rim on the
    // side toward the drawing (side-on to the still life: head over the water, tail out to the right), drinks and
    // looks up through the first turn of the helix, and leaves over the knot as we begin to climb. The other two wheel
    // far up the street, small against the sky.
    const CIRC = [{ x: -98, y: 38, z: -122, r: 50, w: 0.3, ph: 0.4 }, { x: 40, y: 52, z: 480, r: 50, w: 0.42, ph: 1.2 }, { x: -70, y: 64, z: 500, r: 60, w: -0.36, ph: 4.0 }];
    const PERCH = new THREE.Vector3(POT[0] + Math.sin(RIM_B) * 9.1 * POT_S, 27.9 * POT_S, POT[2] - Math.cos(RIM_B) * 9.1 * POT_S), PERCH_YAW = Math.atan2(-Math.sin(RIM_B), Math.cos(RIM_B));
    const uOff = route.uLap - route.uJoin + 0.03;                       // when it leaves (u past the helix's start)
    const gA = new THREE.Vector3(), gB = new THREE.Vector3(), camT = [1.068, 0.601];
    const circAt = (i, time, out) => { const cc = CIRC[i], a = cc.ph + time * cc.w; out.set(cc.x + Math.cos(a) * cc.r, cc.y + 7 * Math.sin(time * 0.45 + i), cc.z + Math.sin(a) * cc.r); return Math.atan2(-Math.sin(a) * cc.w, Math.cos(a) * cc.w); };
    const wrapA = (d) => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
    const shadeM = new THREE.Matrix4(), hibTop = (i) => v3.set(hibs.tops[i][0], hibs.tops[i][1] + 1.2, hibs.tops[i][2]);
    const ss = smoothstep, landV = new THREE.Vector3(), poiLand = new THREE.Vector3();
    const setBird = (i, time, b, uu) => {
      const bird = spar.birds[i], P = plan[i], m = bird.mesh, pose = bird.pose; let shade = 0, gx = 0, gz = 0;
      if (b < P.tL) {
        const cc = CIRC[i], st = P.stands[0], kb = ss(P.tL - 0.05, P.tL, b);
        let yawC = circAt(i, time, gB), bankC = -0.3 * Math.sign(cc.w), flap = 0.42 * Math.sin(time * 5.2 + i * 2) * (0.5 + 0.5 * Math.sin(time * 0.6 + i)) + 0.18;
        let tuck = 1, spread = 1, peck = 0.06, crouch = 0;
        if (i === 0) {                                                             // to the pot's rim, a long drink, and away
          const kin = ss(-0.115, -0.045, uu), kout = ss(uOff, uOff + 0.06, uu), kp = kin * (1 - kout);
          if (kp > 0) {
            const away = kout > 0, settle = ss(0.9, 1, kp), near = ss(0, 0.8, kp), tp = time * 0.38;
            const dr = Math.pow(Math.max(0, Math.sin(tp * TAU)), 3), lookUp = ss(0.35, 0.6, Math.sin(tp * TAU + 2.4));
            const toC = Math.atan2(gB.x - PERCH.x, gB.z - PERCH.z), yawF = away ? toC : toC + Math.PI;      // flying out to the circle, or in from it
            const back = away ? 0 : 55 * (1 - kp) * near;                             // it comes in over the drawing, up the line of its perch
            gB.set(lerp(gB.x, PERCH.x - Math.sin(PERCH_YAW) * back, near), lerp(gB.y, PERCH.y, near) + Math.sin(Math.PI * kp) * (away ? 20 : 30), lerp(gB.z, PERCH.z - Math.cos(PERCH_YAW) * back, near));
            const yw = away ? PERCH_YAW + wrapA(yawF - PERCH_YAW) * (1 - ss(0.7, 1, kp)) : yawF + wrapA(PERCH_YAW - yawF) * ss(0.45, 0.95, kp);
            yawC = yw + wrapA(yawC - yw) * (1 - ss(0, 0.25, kp)) + settle * 0.08 * Math.sin(time * 0.7);
            bankC *= 1 - kp; spread = 1 - settle; tuck = 1 - ss(0.6, 0.92, kp);
            flap = lerp(flap, (0.7 * Math.sin(time * 14) + 0.25) * (1 - settle), ss(0.2, 0.6, kp));
            peck = lerp(0.06, 0.62 * dr - 0.1 * lookUp + 0.03 * Math.sin(time * 2.2), settle); crouch = settle * (1.3 + 0.9 * dr);
          }
          m.visible = true;
        } else m.visible = true;
        bird.tuck.value = tuck;
        m.position.set(lerp(gB.x, st.x - Math.sin(st.yaw) * 120, kb), lerp(gB.y, 92, kb), lerp(gB.z, st.z - Math.cos(st.yaw) * 120, kb));
        m.rotation.set(0, yawC + wrapA(st.yaw - yawC) * kb, bankC * (1 - kb));
        pose.set(spread, flap, peck, crouch);
      }
      else if (b < P.t0) {                                                       // landing with a fan of wings
        const k = (b - P.tL) / (P.t0 - P.tL), e = 1 - (1 - k) * (1 - k), st = P.stands[0], back = 120 * (1 - e);
        m.visible = true; bird.tuck.value = 1 - ss(0.35, 0.8, k); m.position.set(st.x - Math.sin(st.yaw) * back, 92 * (1 - e) * (1 - e) + 3 * Math.sin(Math.PI * k), st.z - Math.cos(st.yaw) * back);
        m.rotation.set(0, st.yaw, 0);
        pose.set(1 - ss(0.86, 1, k), (0.75 * Math.sin(time * 15) + 0.2) * (1 - ss(0.8, 1, k)), -0.5 * (1 - ss(0.6, 1, k)), 1.2 * ss(0.85, 1, k) * (1 - k));
        shade = ss(0.5, 1, k); gx = st.x; gz = st.z;
      } else {
        const j = b >= P.hops[1] ? 2 : b >= P.hops[0] ? 1 : 0, st = P.stands[j], since = j === 0 ? 1 : (b - P.hops[j - 1]) / 0.009;
        m.visible = true; bird.tuck.value = 0;
        if (since < 1) {                                                         // a hop, 30 m at a time
          const a = P.stands[j - 1], h = ss(0, 1, since); let dy = st.yaw - a.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
          m.position.set(lerp(a.x, st.x, h), 9 * Math.sin(Math.PI * since), lerp(a.z, st.z, h)); m.rotation.set(0, a.yaw + dy * h, 0);
          pose.set(0.55 * Math.sin(Math.PI * since), 0.5 * Math.sin(time * 15), -0.15 * Math.sin(Math.PI * since), 0);
          shade = 1 - 0.5 * Math.sin(Math.PI * since); gx = m.position.x; gz = m.position.z;
        } else {
          const ph = (time / 1.3 + i * 0.37) % 1, pk = ph < 0.42 ? Math.pow(Math.sin(Math.PI * ph / 0.42), 1.4) : 0;
          m.position.set(st.x, 0, st.z); m.rotation.set(0, st.yaw + (ph > 0.5 ? 0.12 * Math.sin((ph - 0.5) * TAU * 2) : 0), 0);
          pose.set(0, 0, (st.reach ? 0.92 : 0.8) * pk + 0.03 * Math.sin(time * 2.2 + i), 1.1 * pk + 0.25 * Math.sin(time * 1.7 + i * 2));
          shade = 1; gx = st.x; gz = st.z;
        }
      }
      for (let j = 0; j < 3; j++) { const start = j === 0 ? P.t0 : P.hops[j - 1] + 0.009; hero.setBite(i * 3 + j, P.stands[j].s, P.stands[j].reach ? 6 * ss(start + 0.004, start + 0.034, b) : 0); }
      shadeM.makeScale(16 * shade + 0.001, 1, 16 * shade + 0.001).setPosition(gx, 0.12, gz); spar.shade.setMatrixAt(i, shadeM);
    };
    // brisk through the chase and the pull-back, slow through the still life beside the pot, easier up the helix,
    // slowest on the long look down, easy to the door
    const pace = (u) => 0.94 + 0.2 * ss(0.03, 0.07, u) - 0.36 * ss(route.uJoin - 0.05, route.uJoin, u) + 0.16 * ss(route.uLap - 0.02, route.uLap + 0.03, u) - 0.16 * ss(route.uX - 0.01, route.uX + 0.04, u) + 0.18 * ss(route.uDesc - 0.02, route.uDesc + 0.03, u) - 0.04 * ss(0.9, 0.94, u);
    const camP = new THREE.Vector3(), poiKnot = new THREE.Vector3(0, 30, -40), poiStill = new THREE.Vector3(-20, 20, -100), poiDoor = new THREE.Vector3(0, 50, -246), tanV = new THREE.Vector3();
    // The three moving gaze targets are worked out from u alone (where the route is at u, where the line lands at
    // u), every time the engine asks for them, never from the frame before: a still taken at any u shows what the
    // flight shows there.
    const aP = new THREE.Vector3(), aL = new THREE.Vector3(); let aimU = -1;
    // (rare: the look-down's centre leans toward the loop the gust left open, so the gap, its two heaps and the spilled fan lie inside the frame)
    const gapAt = hero.anchors.gap ? hero.anchors.gap.at : null, heartX = gapAt ? lerp(4, gapAt.x, 0.4) : 4, heartZ = gapAt ? lerp(-16, gapAt.z, 0.4) : -16;
    const aim = (u) => {
      if (u === aimU) return; aimU = u;
      path.posAtDist(u * path.length, aP); hero.pointAt(Math.min(route.landOf(u), hero.L), aL);
      {   // the burst. From high up the gaze goes across the drawing, never steeper than about 22 degrees, so the horizon
        // stays in the frame; passing over the burst it is never steeper than about 40
        const hk = ss(24, 40, aP.y), hb = 0.7 * hk; let tx = aL.x * (1 - hb), tz = aL.z * (1 - hb) - 12 * hb;
        const dx = tx - aP.x, dz = tz - aP.z, dl = Math.hypot(dx, dz) || 1, minD = Math.max(2.4 * aP.y * hk, 0.82 * aP.y);
        if (dl < minD) { tx = aP.x + (dx / dl) * minD; tz = aP.z + (dz / dl) * minD; }
        poiLand.set(tx, 3, tz);
      }
      {   // the still life: the pot at six tenths of the half width to the left (on any shape of screen), the door kept
        // inside the frame on the right, the gaze level with the middle of pot and bird
        const hp = Math.atan2(POT[0] - aP.x, aP.z - POT[2]), hd = Math.atan2(-aP.x, aP.z - DOOR_Z), sep = wrapA(hd - hp);
        const rel = clamp(Math.max(Math.atan(0.6 * camT[0]), sep - Math.atan(0.78 * camT[0])), 0, Math.atan(0.86 * camT[0])), g = hp + rel;
        const rp = Math.hypot(POT[0] - aP.x, POT[2] - aP.z), el = clamp(Math.atan2(27 - aP.y, rp), -0.2, 0.06);
        poiStill.set(aP.x + Math.sin(g) * 260, aP.y + Math.tan(el) * 260, aP.z - Math.cos(g) * 260);
      }
      {   // the look down: the heart of the knot while we come round and over its rim, so the whole drawing lies in the
        // frame; then, on the way down, a point on the ground ahead along the route
        path.tangentAt(u, tanV); const tl = Math.hypot(tanV.x, tanV.z) || 1, k = 1 - ss(route.uDesc - 0.05, route.uDesc + 0.02, u), kd = ss(route.uDesc - 0.1, route.uDesc - 0.035, u);
        let fx2 = aP.x + (tanV.x / tl) * 110, fz2 = aP.z + (tanV.z / tl) * 110;
        if (gapAt) { const kg = 0.4 * (1 - ss(route.uDesc - 0.04, route.uDesc - 0.005, u)); fx2 = lerp(fx2, gapAt.x, kg); fz2 = lerp(fz2, gapAt.z, kg); }      // (rare: on the way down the gaze stays near the open loop until we are past it)
        poiKnot.set(lerp(heartX, fx2, kd), lerp(0, aP.y - lerp(22, 46, k), kd), lerp(heartZ, fz2, kd));
      }
      {   // the low pass and the way up to the step: the door, held some ten degrees below the level of the eye, so the
        // lit step, the lamp row and the door fill the top of the frame and the ground with the ants its lower half;
        // near the step's edge the old fixed point above the threshold
        const D = Math.hypot(aP.x, aP.z + 246), dip = lerp(0.19, 0.07, ss(route.uLow - 0.005, route.uLow + 0.035, u));       // (on the climb the eye comes up to the lamps and the door)
        poiDoor.set(0, lerp(aP.y - dip * D, 50, ss(route.uStep - 0.04, route.uStep - 0.012, u)), -246);
      }
    };
    // the gold glint (the design: "once, at u 0.20, a gold glint shows high in the haze"): high in the haze where the gaze of u 0.20 rests, some 13 degrees above it, never behind the wall
    const glintAt = new THREE.Vector3(), glintV = new THREE.Vector3(), glintM = new THREE.Matrix4();
    {
      aim(0.2); const gx = poiLand.x - aP.x, gz = poiLand.z - aP.z, gl = Math.hypot(gx, gz) || 1, pitch = Math.atan2(3 - aP.y, gl);
      let far = 230; if (gz < 0) far = Math.min(far, Math.max(120, (aP.z + 236) * gl / -gz));
      glintAt.set(aP.x + (gx / gl) * far, Math.max(52, aP.y + far * Math.tan(pitch + 0.23)), aP.z + (gz / gl) * far); hero.setGlintAt(glintAt.x, glintAt.y, glintAt.z);
    }
    // the sun's edge (x + 0.14 z, metres): in from the street's far end as the look-down begins, onto the knot's east
    // rim a moment later, then slowly across the whole knot while the look-down holds it, and away over the west of
    // the yard
    const edgeOf = pw([[U_SUN - 0.01, 560], [U_SUN + 0.005, 300], [U_SUN + 0.015, 180], [U_SUN + 0.025, 112], [U_SUN + 0.04, 78], [0.66, 46], [0.685, 14], [0.7, -6], [0.76, -46], [0.82, -90], [0.87, -150], [0.92, -380]]);

    // The gaze. Three stacks of pois, then a chain that makes the steady camera see the same picture through the chase,
    // the pull-back and the helix. In the chase and the pull-back the route swings wide of the burst and twice flies
    // away from it while the gaze stays on it, so a camera that looked 88 m down the route would lose the burst and the
    // rope; on the helix the route turns one and three quarter times under a gaze that hardly moves, and that camera
    // would swing right round twice. The steady camera takes a third of every poi, so no one
    // poi can turn it far: each link of the chain is aimed so that a third of it turns the gaze as far as a third can
    // (about 27 degrees) toward where the ordinary camera looks, and the last two links are that direction itself.
    // For the ordinary camera the last two links win and nothing changes.
    const prePois = [
      // the burst, held from the entry until the still life takes over. From high up the gaze rests between the burst
      // and the heart of the drawing.
      ...[0.9, 0.5, 0.5].map((weight) => ({ at: (time, u) => { aim(u); return poiLand; }, from: 0.025, to: route.uJoin - 0.025, weight, fade: 0.12 })),
      // the still life: the gaze holds the brass pot in the left third and the drawing, the veil and the lamp-lit door
      // to its right while the route runs in beside the pot and turns once round
      ...[0.9, 0.9, 0.9, 0.9].map((weight) => ({ at: (time, u) => { aim(u); return poiStill; }, from: route.uJoin - 0.085, to: route.uLap + 0.075, weight, fade: 0.14 })),
      // up the helix and out onto the look down: the heart of the knot
      ...[0.8, 0.6, 0.6, 0.45].map((weight) => ({ at: (time, u) => { aim(u); return poiKnot; }, from: route.uLap + 0.015, to: route.uDesc + 0.02, weight, fade: 0.1 })),
    ];
    const N_CH = 7, chT = Array.from({ length: N_CH + 2 }, () => new THREE.Vector3(0, 20, -100)), CH = [0.025, route.uApex + 0.03, 0.06];
    const cP = new THREE.Vector3(), cA = new THREE.Vector3(), cS = new THREE.Vector3(), cN = new THREE.Vector3(), cQ = new THREE.Vector3(), cX = new THREE.Vector3();
    const chain = (u) => {
      const L = path.length, d = u * L, guard = ss(0, 0.04, u) * (1 - ss(0.93, 0.985, u));
      path.posAtDist(d, cP); path.posAtDist(d + 26, cA); cN.subVectors(cA, cP).normalize();
      path.posAtDist(d + Math.min(26 * 3.4, Math.max(26, L * 0.22)), cA); cS.subVectors(cA, cP).normalize(); cS.y *= 0.55; cS.normalize();
      for (const q of prePois) {
        const w = bell(u, q.from, q.to, q.fade) * q.weight * guard; if (w <= 0.001) continue;
        cQ.copy(q.at(0, u)).sub(cP).normalize(); cN.multiplyScalar(1 - w).addScaledVector(cQ, w).normalize(); cS.multiplyScalar(1 - w * 0.35).addScaledVector(cQ, w * 0.35).normalize();
      }
      const w = bell(u, CH[0], CH[1], CH[2]) * 0.9 * guard * 0.35, far = Math.acos(-w / (1 - w));
      for (let i = 0; i < N_CH; i++) {
        const c = clamp(cS.dot(cN), -1, 1), ang = Math.acos(c);
        if (ang < 0.004 || w <= 0.001) cQ.copy(cN);
        else {
          const k = ((1 - w) / w) * Math.sin(ang), r = k >= 1 || ang > 1.5 ? far : ang + Math.asin(k);
          cX.copy(cN).addScaledVector(cS, -c); if (cX.lengthSq() < 1e-5) cX.set(-cS.z, 0, cS.x); cX.normalize();
          cQ.copy(cS).multiplyScalar(Math.cos(r)).addScaledVector(cX, Math.sin(r));
        }
        chT[i].copy(cP).addScaledVector(cQ, 300); cS.multiplyScalar(1 - w).addScaledVector(cQ, w).normalize();
      }
      chT[N_CH].copy(cP).addScaledVector(cN, 300); chT[N_CH + 1].copy(chT[N_CH]);
    };

    return {
      scene, path, duration: Math.round(clamp(route.length / 27.6, 42, 52)), pace,
      camera: { fov: 62, near: 0.5, far: 3400, lookAhead: 26, sway: 0.5, bank: 0.22, nearThrough: 0.5 },
      pois: [
        ...prePois,
        ...chT.map((v, i) => ({ at: (time, u) => { if (i === 0) chain(u); return v; }, from: CH[0], to: CH[1], weight: 0.9, fade: CH[2] })),
        // the low pass and the climb to the step: the gaze turns to the door a little before the low point (eased in over
        // some 50 m) and rests there
        { at: (time, u) => { aim(u); return poiDoor; }, from: route.uDesc - 0.05, to: route.uDesc + 0.03, weight: 0.8, fade: 0.48 },
        { at: (time, u) => { aim(u); return poiDoor; }, from: route.uDesc + 0.004, to: 0.95, weight: 0.88, fade: 0.12 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#ffe2b8', glow: 0.5, revealDistance: 640 },
      post: { exposure: LK.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 },
        grade: { saturation: LK.sat, contrast: 1.05, tint: LK.tint, shadowTint: LK.shadow, vignette: 0.34, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      debug: { route, hero, info: { look, rare, uE: +route.uE.toFixed(3), uJoin: +route.uJoin.toFixed(3), uLap: +route.uLap.toFixed(3), uX: +route.uX.toFixed(3), len: Math.round(route.length), uApex: +route.uApex.toFixed(3), uDesc: +route.uDesc.toFixed(3), uStep: +route.uStep.toFixed(3), L: Math.round(hero.L), frac: hero.frac },
        b: route.bOf, landmarks: () => ({ knot: { p: [0, 2, 0], size: 200 }, pot: { p: [POT[0], 14 * POT_S, POT[2]], size: 28 * POT_S }, heart: { p: [4, 2, -16], size: 20 }, broom: { p: [BROOM[0] - 135, 0, BROOM[1]], size: 46 }, door: { p: [0, 34, DOOR_Z], size: 14 },
          bird0: { p: [spar.birds[0].mesh.position.x, spar.birds[0].mesh.position.y + 15, spar.birds[0].mesh.position.z], size: 24 }, bird1: { p: spar.birds[1].mesh.position.toArray(), size: 24 }, bird2: { p: spar.birds[2].mesh.position.toArray(), size: 24 }, land: { p: [landV.x, 2, landV.z], size: 8 }, hib4: { p: [HIB[3][0], STEP_Y + 4, HIB[3][1]], size: 30 },
          ...(hero.anchors.gap ? { gap: { p: [hero.anchors.gap.at.x, 0, hero.anchors.gap.at.z], size: 50 } } : {}) }), gust: () => HU.uGust.value },
      update(dt, time, camera, u) {
        const b = route.bOf(u);
        timeU.value = time;
        hero.setProgress(b); hero.setLand(route.landOf(u)); hero.update(dt, time, camera);
        HU.uVeilK.value = 1 + 0.9 * (1 - ss(0.005, 0.05, u)) + 0.2 * ss(0.06, 0.1, u) * (1 - ss(0.28, 0.36, u));                    // the first view, through the previous portal: the curtain stands out against the dark house
        hero.setSun(ss(U_SUN - 0.008, U_SUN + 0.012, u), edgeOf(u)); HU.uGold.value = ss(U_SUN + 0.012, U_SUN + 0.085, u) * (1 - 0.75 * ss(0.9, 0.99, u));
        hero.landing(landV);
        glintV.copy(glintAt).applyMatrix4(glintM.copy(camera.matrixWorld).invert()).applyMatrix4(camera.projectionMatrix);
        hero.setGlint(ss(0.186, 0.196, u) * (1 - ss(0.208, 0.226, u)) * (1 - ss(0.8, 0.97, Math.abs(glintV.x))) * (1 - ss(0.8, 0.97, Math.abs(glintV.y))) * (glintV.z < 1 ? 1 : 0));
        // the sky pales and warms; the sun's rim clears the band from b 0.66
        const pale = ss(0.08, 0.62, u), warm = ss(0.2, 0.56, u);
        U.uZen.value.copy(zen0).lerp(zen1, pale); U.uMid.value.copy(mid0).lerp(mid1, pale); fogCol.copy(horD).lerp(hor0, ss(0.06, 0.42, u)).lerp(hor1, warm * 0.8);
        U.uSunUp.value = ss(U_SUN - 0.012, U_SUN + 0.13, u); U.uWarm.value = look === 2 ? 0.3 + 0.45 * warm + 0.25 * U.uSunUp.value : warm; U.uStars.value = 1 - ss(0.2, 0.5, u);
        U.uBand.value.copy(band0).lerp(band1, U.uSunUp.value);
        U.uBandK.value = warm;                                                  // what brass and wet petals show of the eastern band as it grows
        HU.uSkyLow.value.copy(skyLow0).lerp(skyLow1, pale);
        camP.setFromMatrixPosition(camera.matrixWorld); dome.position.copy(camP);
        { const pe = camera.projectionMatrix.elements; camT[0] = 1 / pe[0]; camT[1] = 1 / pe[5]; }
        for (let i = 0; i < 11; i++) HU.uLamps.value[i].w = lampW[i] * (0.84 + 0.11 * Math.sin(time * 9.1 + i * 2.3) + 0.07 * Math.sin(time * 23.3 + i * 5.1));     // the flames waver
        beads.material.uniforms.uDry.value = 0.7 * ss(0.05, 1, b); beads.material.uniforms.uLandP.value.set(landV.x, landV.z);
        ants.update(time, b); hero.setBite(11, ants.cutS, 3.4 * ss(0.79, 0.97, b));
        for (let i = 0; i < 3; i++) setBird(i, time, b, u - route.uJoin);
        spar.shade.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 2; i++) {                                            // the bee works the fourth hibiscus from b 0.90
          const m = bees[i], on = i === 0 || look === 1; m.visible = on && b > 0.84; if (!m.visible) continue;
          const top = hibTop(i === 0 ? 3 : 1), sgn = i === 0 ? -1 : 1, arrive = ss(0.845, 0.9 + 0.01 * i, b), t = time + i * 3.1;
          const hx = top.x + sgn * 2.6 + Math.sin(t * 1.3) * 1.5, hy = top.y + 1.2 + Math.sin(t * 2.1) * 0.7, hz = top.z + 1.2 + Math.cos(t * 0.9) * 1.6;
          m.position.set(lerp(top.x - sgn * 70, hx, arrive), lerp(top.y + 40, hy, arrive), lerp(top.z + 50, hz, arrive));
          m.rotation.set(0.25, Math.atan2(top.x - m.position.x, top.z - m.position.z), Math.sin(t * 3) * 0.2);
        }
        motes.setOpacity(0.55 * (1 - 0.6 * ss(0.86, 0.95, b))); motes.update(dt, time, camera); sparks.setOpacity(ss(0.7, 0.82, u)); sparks.update(dt, time, camera); mist.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
