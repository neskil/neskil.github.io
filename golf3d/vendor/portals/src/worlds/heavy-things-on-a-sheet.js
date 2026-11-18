// HEAVY THINGS ON A SHEET
// The classroom demonstration of gravity grown to the size of a sky: one stretched cloth ruled in ballpoint, lit by a four
// o'clock window, lost sports balls sitting in their own dips. We follow a glass marble on a slingshot round the deepest
// well while one more ball falls in and the whole well sinks. Flat switch on: every colour written is the hex on screen.
// Everything is made from one makeStyle instance (src/parts/heavy-things-on-a-sheet.js): no lights, no fog, no textures.
//
// Plan (three.js axes: flying toward +Z, screen left is +X, the window light comes from +X, its patch lies on the -X wall):
//   entry (0, y, -30), 40 m above the cloth, the planet ball whole at the right -> down under its overhang -> the crossing
//   beside a rolling golf ball (left), climbing all the way -> a crest 110 m above the lip of the great well (the whole well
//   below) -> the dive at the bowling ball's shoulder (the ball whole in the frame, a mirror for the room) -> the whip round
//   the ball while the well sinks, in three pictures: skimming its mirror low on the wall with the gaze turned in to it,
//   swinging 84 m out and 40 m up so the ball stands whole in its well with the ring circling it, then in again and over
//   the golf ball that fell in and lodged -> down to the cloth and out up the wall 9 m off it, FLOWN LOW BETWEEN LARGE
//   BALLS: a second golf ball rolling down the wall at our right, the gate (an orange bowling ball left, a golf ball right,
//   the planet ball, which has rolled here while we were in the well, behind it) -> a lift of 64 m over the funnel's rim:
//   the whole whirlpool below (forty marbles spiralling down to the brass plate and its grommet, the portal), the steel
//   bearing on its near wall, a globe and a pool ball on its far rim -> down to ride the funnel's wall low among the
//   marbles for a third of a turn, a climb to 55 m above the wall for the turn inward (the brass plate whole below, the
//   marbles keeping to its rim on our side so the grommet, 20 m across, is seen open) and the dive at 42 degrees. Our marble
//   rolls further ahead the higher we ride. The gate is passed BETWEEN its balls, in the saddle of their two dips, gaze level.
//   The gaze is held on the cloth by pois. The hour stands on the walls: two windows' light, leaning panes above the hoop
//   (one ahead of the entry and behind the dive, a taller one on the wall we face from the great well to the funnel).
//   Light is two flat tones: every ball lays one long hard-edged shadow, every dip has its crescent. The cloth carries
//   ballpoint only (ruled lines every 40 m, a half rule and, seen close, a quarter rule; the family of lines we cross at
//   speed keeps to 40 m so nothing passes under the lens more than three times a second). No pencil marks.
// Seeded looks (seed % 4): black lycra ruled in chalk / red biro on cream with a navy planet / ballpoint with a baseball /
// ballpoint with the cricket ball; the hour (four o'clock, golden, dawn, blue-hour night) from ctx.vary.hour or the seed.
// Rare event (ctx.vary.rare): the flick, one straight ripple crossing the sheet and passing under us near the lip.
// Scripted things are functions of u (the roll beside us, the planet rolling off, the plunge, the sink); every ball also
// settles in a small slow circle of its own in time; the marble ring, the whirlpool and one golf ball on the funnel's far rim
// roll in time (closed forms, so a held frame is alive and every replay is the same).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero, carvedSphere, golfGeometry, wayRound, SWINGV, SWING_UP, SWINGA, SWING_MIN } from '../parts/heavy-things-on-a-sheet.js';

const COLOURWAYS = {
  ballpoint: ['#F2F0EA', '#C9D2DE', '#2B55C8', '#2A1B3D', '#A11D1D', '#E8552D', '#C9A227'],   // blue ballpoint on cloth
  biro:      ['#F4ECD8', '#D9CDB8', '#B3202C', '#2A1B3D', '#1F3F8F', '#E8552D', '#C9A227'],   // red biro on cream, a navy planet
  lycra:     ['#24262D', '#41444F', '#ECE9DF', '#0B0B10', '#A11D1D', '#E8552D', '#C9A227'],   // black lycra ruled in chalk
};
const AX = 120, AZ = 620;            // axis of the great well
const FX = -426, FZ = 305;           // axis of the empty funnel
const FD = 60, FA = 70;              // its depth and half-width
const PX = -48, PZ = 95, PR = 35;    // the planet ball (cricket ball or baseball)
const RW = 118;                      // radius of the whip
const GR = 20, MR = 6;               // golf ball and marble radii
const GD = 21, PD = 40;              // how deep a golf ball and the planet sink the cloth
const DIVE_T = Math.tan(42*Math.PI/180);   // the last dive comes down on the brass from above the marbles, so the opening is seen round and clear
const TURN_UP = 55;                  // metres above the funnel's wall we climb to for the turn inward
const ORBIT_SWEEP = 1.9, TURN_R = 45;   // the camera's own turn round the funnel (radians) and its turn inward (m)
const LODGE_TURN = 1.73;              // the falling golf ball's track curls this far round the well (radians), to lodge where the lens lifts off
const GOLF_GAZE = 40;                // the gaze rests this far outside the lodged golf ball, so the plum ball keeps to the frame's left edge
const WHIP_OUT = 84;                 // metres the whip swings out from the ball in its first half
const WHIP_UP = 40;                  // metres the whip climbs the wall beside the ball's shoulder
const WIN2_AZ = -0.8;                // where the second window's light lies on the wall (0 = the -X wall, negative toward -Z)
const RIM_UP = 64, ORB = 14;         // the lift over the funnel's rim (the whole whirlpool below), and the height we ride its wall at
const GOLF_ORBIT = 240;              // the golf ball that rolls round the funnel's far rim, outside the heavy balls
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a)/(b - a))); return t*t*(3 - 2*t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

export default {
  id: 'heavy-things-on-a-sheet',
  name: 'Heavy Things on a Sheet',
  category: 'sky',
  weirdness: 0.7,
  media: ['air', 'open'],
  async build(ctx) {
    const vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const vr = ctx.rng.fork ? ctx.rng.fork('look') : ctx.rng;
    // ---- the seeded look: colourway, hour, cast
    const sd = Math.abs(Math.floor(ctx.seed || 0)), look = sd % 4; void vr;
    const cw = ['lycra', 'biro', 'ballpoint', 'ballpoint'][look];
    const baseball = look === 2;
    const anyHour = ['four', 'golden', 'four', 'dawn'][(sd >> 2) % 4];
    let hour = vary.hour === 'golden' ? 'golden' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'night' ? 'night' : vary.hour === 'day' ? 'four' : anyHour;
    if (cw === 'lycra' && hour === 'night') hour = 'four';
    const rare = !!vary.rare, lycra0 = cw === 'lycra';
    const style = makeStyle(ctx, { palette: COLOURWAYS[cw], hour, white: cw === 'lycra' ? '#ECE9DF' : undefined });   // on black lycra, white things are chalk white
    const P = style.palette, U = style.uniforms;
    U.uWin.value.set(1.58, 0.175, 0.25, 0);            // the window's light, 40 degrees by 14: on the wall above the hoop, right of the entry's axis, never behind the exit
    if (hour === 'golden') U.uWin.value.set(1.58, 0.2, 0.42, 0);      // at golden hour it stands higher on the wall and leans further
    U.uWin2.value.set(WIN2_AZ, 0.3, U.uWin.value.z, 2);   // the next window's light, on the wall we face as we leave the great well
    const scene = new THREE.Scene();
    scene.background = P.shade.clone();
    await ctx.yield();

    // ---- the course in plan -------------------------------------------------------------------------------------
    const plan = [];                                     // { x, z, kind }  kind 0 cloth-following, 1 funnel level, 2 dive
    plan.push({ x: 0, z: -30, k: 0 });                   // (the entry stands 30 m back, so the planet ball is seen whole)
    for (let z = 0; z <= 360; z += 20) plan.push({ x: -6*Math.exp(-(((z - PZ)/45)**2)), z, k: 0 });
    // over the lip and down the wall: the heading starts as it arrives and turns tangent as r comes down to the whip
    let x = 0, z = 360, th = 0;
    const lipIndex = plan.length;
    for (let i = 0; i < 400; i++) {
      const dx = x - AX, dz = z - AZ, r = Math.hypot(dx, dz); th = Math.atan2(dz, dx);
      if (r <= RW + 2.5) break;
      const tx = Math.sin(th), tz = -Math.cos(th), ix = -Math.cos(th), iz = -Math.sin(th);
      const phi = 1.13*(0.2 + 0.8*sm(0, 1, (r - RW)/(286 - RW)));        // 65 degrees inward at the lip, easing to 13 at the whip
      x += (tx*Math.cos(phi) + ix*Math.sin(phi))*6; z += (tz*Math.cos(phi) + iz*Math.sin(phi))*6;
      if (i % 4 === 3) plan.push({ x, z, k: 0 });
    }
    const whipIndex = plan.length, th1 = th;
    // the whip: round the ball at r 118 until the tangent points at the funnel
    const dF = Math.hypot(FX - AX, FZ - AZ);
    let th2 = Math.atan2(FZ - AZ, FX - AX) + Math.acos(RW/dF);
    while (th2 > th1 - 2.0) th2 -= Math.PI*2;
    const nW = Math.ceil((th1 - th2)/0.2);
    // (not a circle: after skimming the mirror it swings out up the wall, so the ball is seen round in its well, and comes back in)
    for (let i = 1; i <= nW; i++) { const t = i/nW, a = th1 + (th2 - th1)*t, r = RW + WHIP_OUT*sm(0.08, 0.26, t)*(1 - sm(0.34, 0.56, t));
      plan.push({ x: AX + Math.cos(a)*r, z: AZ + Math.sin(a)*r, k: 0 }); }
    const flingIndex = plan.length;
    // flung out: straight to the funnel, over its rim, round its wall, then down into the grommet
    const lx = AX + Math.cos(th2)*RW, lz = AZ + Math.sin(th2)*RW, fl = Math.hypot(FX - lx, FZ - lz), fdx = (FX - lx)/fl, fdz = (FZ - lz)/fl;
    const RIM = 190, flR = fl - RIM;
    // the flung-out leg is flown low between large balls: [metres along it, metres to the right of it]
    const GATE_G = [278, 28], GATE_B = [315, -46], BEARING = [532, -50], ROLL_T = [72, 38], PLANET_T = [345, 64], STILL_L = [436, -150];   // (the gate stands where the lens is BETWEEN its balls at u 0.70; the rolling one is at our right at 0.61, its long shadow across our front)
    const LOW = 9;                                       // metres off the cloth on that leg
    for (let d = 24; d < flR - 6; d += 24) plan.push({ x: lx + fdx*d, z: lz + fdz*d, k: 0, s: d });
    const END_Y = -52;
    // into the whirlpool: over the funnel's rim, round its wall among the marbles (the throat on our left, as the ball was),
    // then a turn inward and the last straight dive to the brass
    { let x = FX - fdx*RIM, z = FZ - fdz*RIM, swept = 0, phi = Math.PI/2, turning = false, prevTh = Math.atan2(z - FZ, x - FX);
      plan.push({ x, z, k: 0, o: 1, od: 0 });
      for (let i = 0; i < 240; i++) {
        const dx = x - FX, dz = z - FZ, r = Math.hypot(dx, dz), th = Math.atan2(dz, dx);
        let dth = th - prevTh; dth -= Math.PI*2*Math.round(dth/(Math.PI*2)); swept += Math.abs(dth); prevTh = th;
        if (!turning && swept > ORBIT_SWEEP) turning = true;
        phi = turning ? Math.min(Math.PI/2, phi + 6/TURN_R) : 0.09 + (Math.PI/2 - 0.09)*sm(125, RIM, r);
        if (turning && phi >= Math.PI/2 - 1e-3) {
          const l = plan[plan.length - 1]; if (Math.hypot(l.x - x, l.z - z) < 9) plan.pop();
          for (const q of [1, 0.66, 0.33, 0]) plan.push({ x: FX + dx*q, z: FZ + dz*q, k: 2, d: r*q });
          break; }
        const tx = Math.sin(th), tz = -Math.cos(th), ix = -dx/r, iz = -dz/r;
        x += (tx*Math.cos(phi) + ix*Math.sin(phi))*6; z += (tz*Math.cos(phi) + iz*Math.sin(phi))*6;
        if (i % 4 === 3) plan.push({ x, z, k: 0, o: 1, od: (i + 1)*6 });
      } }
    const orbitC = Math.atan2(fdz, fdx);
    const NP = plan.length;
    const planU = new Float32Array(NP);
    { let s = 0; for (let i = 1; i < NP; i++) { s += Math.hypot(plan[i].x - plan[i - 1].x, plan[i].z - plan[i - 1].z); planU[i] = s; }
      for (let i = 0; i < NP; i++) planU[i] /= s; }
    await ctx.yield();

    // ---- the cast in plan ---------------------------------------------------------------------------------------
    const PTX = lx + fdx*PLANET_T[0] - fdz*PLANET_T[1], PTZ = lz + fdz*PLANET_T[0] + fdx*PLANET_T[1];   // where the planet ball ends its roll: on the funnel's rim, right of the course
    const planetDir = new THREE.Vector2(PTX - PX, PTZ - PZ), PLANET_ROLL = planetDir.length(); planetDir.normalize();
    // six golf balls sit still in their dips: clear of the course, the wells and each other
    const stills = [];
    { const sr = ctx.rng.fork ? ctx.rng.fork('stills') : ctx.rng; let guard = 0;
      const want = [[150, 215], [-190, 60], [-250, 620], [330, 150], [-120, 780], [-640, 580]];   // rough homes, jittered per seed
      for (const [hx, hz] of want) {
        let ok = false, sx = hx, sz = hz;
        if (stills.length === 2) { sx = lx + fdx*STILL_L[0] - fdz*STILL_L[1]; sz = lz + fdz*STILL_L[0] + fdx*STILL_L[1]; ok = true; }   // left of the course past the gate
        if (stills.length === 5) { sx = 228; sz = 886; ok = true; }   // one on the great well's far lip, where the gaze rests while we skim the mirror
        if (stills.length === 4) { sx = lx + fdx*GATE_G[0] - fdz*GATE_G[1]; sz = lz + fdz*GATE_G[0] + fdx*GATE_G[1]; ok = true; }   // the one on the lip, right of the course: a gate with the orange bowling ball
        while (!ok && guard++ < 400) {
          sx = hx + sr.range(-60, 60); sz = hz + sr.range(-50, 50); ok = true;
          if (Math.hypot(sx - AX, sz - AZ) < 345 || Math.hypot(sx - FX, sz - FZ) < 300 || Math.hypot(sx - PX, sz - PZ) < 110) ok = false;
          for (let i = 0; i < NP && ok; i++) if (Math.hypot(sx - plan[i].x, sz - plan[i].z) < 62) ok = false;
          for (const s of stills) if (Math.hypot(sx - s.x, sz - s.z) < 100) ok = false;
          if (sx > -190 && sx < -20 && sz > 60 && sz < 190 && Math.abs((sx - PX)*planetDir.y - (sz - PZ)*planetDir.x) < 75) ok = false;   // the planet's track
        }
        stills.push({ x: sx, z: sz, hx: sx, hz: sz, prev: { x: NaN, z: 0 }, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(sr.range(0, 6.28), sr.range(0, 6.28), sr.range(0, 6.28))) });
      }
    }
    // One more heavy thing for the climb out of the well. Still ball 0 waits at its home until we are in the whip, then
    // rolls in over the lip and down the wall across our front (seen on the slope ahead and to the right as we leave, dip, crescent and
    // long shadow with it) and comes to rest against the bowling ball as the first did.
    const R2T = { x: lx + fdx*ROLL_T[0] - fdz*ROLL_T[1], z: lz + fdz*ROLL_T[0] + fdx*ROLL_T[1] }, R2C = { x: AX + Math.cos(th2 + 0.95)*124, z: AZ + Math.sin(th2 + 0.95)*124 };
    const R2B = R2T;                                     // it is there when we are at u 0.61, half the frame high at our right
    const roll2 = (u, s0) => { const a1 = Math.pow(clamp01((u - 0.45)/0.14), 1.5), a2 = sm(0.655, 0.84, u);   // (it keeps its side of the course until we are past)
      s0.x = s0.hx + (R2B.x - s0.hx)*a1 + (R2C.x - R2B.x)*a2; s0.z = s0.hz + (R2B.z - s0.hz)*a1 + (R2C.z - R2B.z)*a2; return a1; };
    await ctx.yield();
    const planetYaw = ctx.rng.range(-0.5, 0.5), orbit0 = ctx.rng.range(0, 6.28);
    // four more heavy things, each in its own dip, on the way to the funnel and round its rim: a classroom globe, a steel
    // bearing, a pool ball and a second bowling ball. ang is measured round the funnel from the far side (0) toward screen right.
    const heavy = [
      { kind: 'globe',   R: 34, r: 184, ang: -0.35 + vr.range(-0.08, 0.08),  D: 30, a: 50, pull: 40 },
      { kind: 'bearing', R: 22, r: 176, ang: 1.13 + vr.range(-0.08, 0.08), D: 33, a: 34, pull: 44 },
      { kind: 'pool',    R: 24, r: 184, ang: 0.42 + vr.range(-0.06, 0.06), D: 19, a: 36, pull: 30 },   // on the far rim, where its long shadow runs on away from us
      { kind: 'bowl',    R: 30, r: 269, ang: 3.463 + vr.range(-0.02, 0.02), D: 32, a: 46, pull: 56 },
    ];
    for (const [b, c] of [[heavy[1], BEARING], [heavy[3], GATE_B]]) { const al = c[0] - fl; b.r = Math.hypot(al, c[1]); b.ang = Math.atan2(c[1], al) + vr.range(-0.01, 0.01); }
    let FDE = FD;                                         // the funnel's own depth, less what the rim's dips add at its axis
    for (const b of heavy) { const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
      b.hx = b.x = FX + (fdx*ca - fdz*sa)*b.r; b.hz = b.z = FZ + (fdz*ca + fdx*sa)*b.r; b.y = 0; FDE -= b.D*b.a*b.a/(b.r*b.r + b.a*b.a); }
    FDE -= PD*3600/((PTX - FX)**2 + (PTZ - FZ)**2 + 3600);   // (and the planet's, once it has rolled there)
    const FPULL = 74;                                     // metres of cloth the funnel draws in: every line near it pours into the throat

    // control-point progress table (plan distance first, true arc length after the first path is built)
    const ptU = Float32Array.from(planU);
    let pathLen = 1450;
    const K = {};
    const keys = () => {
      K.lip = ptU[lipIndex]; K.whip = ptU[whipIndex]; K.fling = ptU[flingIndex]; K.dive = ptU[NP - 4]; K.out = ptU[flingIndex + 9];
      K.g0 = K.lip - 0.012;                              // the golf ball leaves us
      K.sink0 = K.whip + 0.012; K.sink1 = K.sink0 + 0.085;   // it lodges; the well takes the weight
      K.roll0 = ptU[8];                                  // the planet starts to roll (we are under and past it)
    };
    keys();
    const eventAt = (u) => u < K.g0 ? 0 : u < K.sink0 ? Math.max(0.002, 0.65*(u - K.g0)/(K.sink0 - K.g0)) : 0.65 + 0.35*clamp01((u - K.sink0)/(K.sink1 - K.sink0));
    // a point of the plan at progress u plus 'ahead' metres, with the heading there
    const AL = { x: 0, z: 0, tx: 0, tz: 1 };
    const along = (u, ahead = 0, out = AL) => {
      const uu = u + ahead/pathLen;
      if (uu >= 1) { const a = plan[NP - 2], b = plan[NP - 1], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; out.tx = (b.x - a.x)/l; out.tz = (b.z - a.z)/l; out.x = b.x; out.z = b.z; return out; }
      let i = 1; while (i < NP - 1 && ptU[i] < uu) i++;
      const a = plan[i - 1], b = plan[i], f = clamp01((uu - ptU[i - 1])/Math.max(ptU[i] - ptU[i - 1], 1e-6)), l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      out.x = a.x + (b.x - a.x)*f; out.z = a.z + (b.z - a.z)*f; out.tx = (b.x - a.x)/l; out.tz = (b.z - a.z)/l; return out;
    };
    // (the cure of the marble's jumps) THE HEADING EASED ACROSS EACH PLAN POINT, BY PLACE. along() gives the heading of the
    // plan's straight piece, which steps at each plan point (by up to 40 degrees); a thing that rides a side offset from it
    // (our marble's weave, the companion's berth) jumped there by its offset times the step: metres in one frame. For those
    // two the heading now turns from one piece's to the next's over the half of each piece that adjoins the point (the
    // shorter half on both sides): at a point it is midway, at a piece's middle it is the piece's own, and it turns with no
    // step and no kink between. A pure function of the place along the plan; along() itself is unchanged for all else.
    const alongE = (u, ahead = 0, out = AL) => { along(u, ahead, out);
      const uu = u + ahead/pathLen; if (uu >= 1) return out;
      let i = 1; while (i < NP - 1 && ptU[i] < uu) i++;
      const a = plan[i - 1], b = plan[i], l = Math.hypot(b.x - a.x, b.z - a.z) || 1, d = Math.hypot(out.x - a.x, out.z - a.z);
      const j = d < 0.5*l ? i - 1 : i; if (j < 1 || j > NP - 2) return out;            // (the plan's two ends have one piece only)
      const p0 = plan[j - 1], p1 = plan[j], p2 = plan[j + 1], l0 = Math.hypot(p1.x - p0.x, p1.z - p0.z) || 1, l1 = Math.hypot(p2.x - p1.x, p2.z - p1.z) || 1;
      const h = 0.5*Math.min(l0, l1), k = sm(-h, h, j === i ? d - l : d);
      const tx = (p1.x - p0.x)/l0*(1 - k) + (p2.x - p1.x)/l1*k, tz = (p1.z - p0.z)/l0*(1 - k) + (p2.z - p1.z)/l1*k, tl = Math.hypot(tx, tz) || 1;
      out.tx = tx/tl; out.tz = tz/tl; return out; };
    // where each rolling thing is at progress u (functions of u only: the scripted world is keyed to the flight)
    const CP = { x: 0, z: 0 }, PP = { x: 0, z: 0, s: 0 };
    const companionAt = (u, out = CP) => {
      const uc = Math.min(u, K.g0), k = sm(0, 0.115, uc);
      const p = alongE(uc, 120 - 62*k - 42*sm(0.075, K.g0, uc)), lat = 78 - 28*k;
      out.x = p.x + p.tz*lat + 2.5*Math.cos(now*0.61 + 1); out.z = p.z - p.tx*lat + 2.5*Math.sin(now*0.61 + 1); return out;
    };
    let now = 0;                                         // world time: every ball also settles in a slow small circle of its own
    const planetAt = (u, out = PP) => { const s = 80*sm(K.roll0, K.roll0 + 0.3, u) + (PLANET_ROLL - 80)*sm(0.4, 0.67, u); out.s = s;   // while we are down in the well it rolls on to the funnel's rim
      out.x = PX + planetDir.x*s + 3.2*Math.cos(now*0.52); out.z = PZ + planetDir.y*s + 3.2*Math.sin(now*0.52); return out; };
    const PULL_G = 30, PULL_P = 50, PULL_GATE = 44;                      // metres of cloth a golf ball and the planet draw in (a quarter of a cell and more)
    const setWells = (u) => {
      const s = sm(0.65, 1, eventAt(u));
      style.setWell(0, AX, AZ, 150 + 35*s, 110, 99 + 55*s, 90, -50 - 45*s);
      const pl = planetAt(u); style.setWell(2, pl.x, pl.z, PD, 60, PULL_P, PR, 5);
      style.setWell(3, FX, FZ, FDE, FA, FPULL);
      for (let i = 0; i < 4; i++) { const b = heavy[i]; style.setWell(11 + i, b.x, b.z, b.D, b.a, b.pull); }
      const c = companionAt(u); style.setWell(4, c.x, c.z, GD*(1 - sm(K.g0 - 0.004, K.g0 + 0.004, u)), 30, PULL_G);
      roll2(u, stills[0]);
      for (let i = 0; i < 6; i++) style.setWell(5 + i, stills[i].x, stills[i].z, GD, 30, i === 4 ? PULL_GATE : PULL_G);
    };
    // heights: 6 m off the cloth as it lies when we are there; level over the funnel's mouth, then the dive
    // metres above the cloth, by plan point: level and high at the entry, down under the planet's overhang, high again for
    // the crossing, a crest above the lip of the great well (the whole well lies below), then down to the wall for the spiral
    const LIFT_IN = [40, 40, 38, 32, 22, 11.5, 9, 13, 20, 26, 33, 41, 50, 60, 71, 83, 96, 108, 113, 110];   // (from z -30, then every 20 m from 0 to 360)
    const LIFT_LIP = [104, 98, 88, 74, 56, 38, 23, 12.5, 8.5];
    const liftOf = (i) => i < lipIndex ? LIFT_IN[Math.min(i, LIFT_IN.length - 1)] : i - lipIndex < LIFT_LIP.length ? LIFT_LIP[i - lipIndex]
      : i >= whipIndex && i < flingIndex ? whipLift((i - whipIndex + 1)/(flingIndex - whipIndex)) : 7.5;
    // the whip is three pictures: skimming the mirror low on the wall, up the wall beside the ball's shoulder while the well
    // sinks, then lifting off past the lodged golf ball
    const whipLift = (t) => 7.5 + WHIP_UP*sm(0.08, 0.28, t) - 26*sm(0.86, 1, t);   // 47 m up where it passes over the lodged golf ball
    const liftPts = new Float32Array(NP);
    const liftAt = (u) => { let i = 1; while (i < NP - 1 && ptU[i] < u) i++;
      const f = clamp01((u - ptU[i - 1])/Math.max(ptU[i] - ptU[i - 1], 1e-6)); return liftPts[i - 1] + (liftPts[i] - liftPts[i - 1])*f; };
    const leadAt = (u) => 40 + 0.55*Math.min(95, Math.max(0, liftAt(u) - 7.5)) + 24*(1 - sm(0, 0.06, u));      // our marble rolls further ahead the higher we ride, so it stays in frame
    const buildPath = async () => {
      const pts = []; let cF0 = 0;
      for (let i = 0; i < NP; i++) {
        const p = plan[i]; let y;
        if (p.k === 2) y = END_Y + p.d*DIVE_T;
        else { setWells(ptU[i]); const n = style.normalAt(p.x, p.z), lf = liftOf(i), h = style.heightAt(p.x, p.z); y = h + (lf < 13 ? lf/Math.max(n.y, 0.5) : lf);
          if (p.s) { const t = Math.min(1, p.s/flR);              // flung out: down to the cloth and low up the wall, over the lip and between the gate balls
            y = h + LOW + (cF0 - LOW)*(1 - sm(0, 0.14, t)) + RIM_UP*sm(0.7, 1, t); }
          else if (p.o) y = h + ORB + (LOW + RIM_UP - ORB)*(1 - sm(0, 130, p.od)) + (TURN_UP - ORB)*sm(175, 285, p.od);   // over the rim high, down to ride the funnel's wall low, up a little for the turn inward
          else cF0 = y - h;
          liftPts[i] = y - h; }
        if (p.k === 2) liftPts[i] = 30;
        pts.push([p.x, y, p.z]);
        if (i % 20 === 19) await ctx.yield();
      }
      await ctx.yield();
      return makePath(pts, { samples: 480 });
    };
    style.setWell(1, 0, 0, 0, 30);
    await ctx.yield();
    let path = await buildPath();
    await ctx.yield();
    { let s = 0; const a = path.points; for (let i = 1; i < NP; i++) { s += a[i].distanceTo(a[i - 1]); ptU[i] = s; } for (let i = 0; i < NP; i++) ptU[i] /= s; }
    pathLen = path.length; keys();
    await ctx.yield();
    path = await buildPath(); pathLen = path.length;
    await ctx.yield();

    // ---- the cloth, the room, the hoop ------------------------------------------------------------------------------
    const CX = -40, CZ = 410, EDGE = 2900;      // the dense part (600 m) covers the great well, the course and the funnel's rim
    {
      const radii = [0]; for (let i = 1; i <= 120; i++) radii.push(i*5);
      while (radii[radii.length - 1] < EDGE) radii.push(Math.min(EDGE, radii[radii.length - 1]*1.047));
      const rings = radii.length - 1, sectors = 320, n = (rings + 1)*sectors;
      const pos = new Float32Array(n*3), idx = new Uint32Array(rings*sectors*6);
      for (let i = 0, k = 0; i <= rings; i++) { const r = radii[i];
        for (let j = 0; j < sectors; j++, k += 3) { const a = (j + (i & 1)*0.5)/sectors*Math.PI*2; pos[k] = Math.cos(a)*r; pos[k + 2] = Math.sin(a)*r; } }
      await ctx.yield();
      for (let i = 0, k = 0; i < rings; i++) for (let j = 0; j < sectors; j++, k += 6) {
        const a = i*sectors + j, b = i*sectors + (j + 1) % sectors, c = a + sectors, d = b + sectors;
        if (i & 1) { idx[k] = a; idx[k + 1] = c; idx[k + 2] = b; idx[k + 3] = b; idx[k + 4] = c; idx[k + 5] = d; }
        else { idx[k] = a; idx[k + 1] = d; idx[k + 2] = b; idx[k + 3] = a; idx[k + 4] = c; idx[k + 5] = d; } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const sheet = new THREE.Mesh(g, style.sheetMaterial); sheet.position.set(CX, 0, CZ); sheet.frustumCulled = false; sheet.name = 'sheet'; scene.add(sheet);
    }
    await ctx.yield();
    scene.add(style.makeRoom());
    if (cw === 'lycra') style.roomMaterial.uniforms.cCloth = { value: P.white };   // on black cloth the window's panes are chalk white, as on the gloss
    U.uOrg.value.set(0, 60);                                     // a heavy fifth line crosses 60 m ahead of the entry
    U.uSeam.value.set(154, 1);                                   // the sewn seam across the whole sheet
    U.uPatch.value.set(-62, 202, 30, 0.085);                     // the patch, ruled a few degrees off true
    // the brass hoop, 30 m thick, and the cord that laces the cloth to it
    const brassLit = P.brass, brassShd = P.brass.clone().lerp(P.plum, 0.5);
    const brassMat = style.ballMaterial({ lit: brassLit, shade: brassShd, edge: 0.05 });
    { const hoop = new THREE.Mesh(new THREE.TorusGeometry(EDGE + 150, 24, 8, 180).rotateX(Math.PI/2), brassMat);
      hoop.position.set(CX, 16, CZ); hoop.frustumCulled = false; scene.add(hoop); }
    const laceMat = style.mk(/* glsl */`
      uniform float uShake; uniform float uTime; attribute float aT;
      void main(){ vec3 p = position; p.y += aT*sin(uTime*11. + position.x*.01 + position.z*.013)*(1.2 + 5.*uShake);
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p, 1.); }`, /* glsl */`
      uniform vec3 cCloth, cShade; void main(){ gl_FragColor = vec4(mix(cShade, cCloth, .82), 1.); }`,
      { uShake: { value: 0 } }, { side: THREE.DoubleSide });
    { const NT = 150, lp = [], la = [], li = [];
      for (let i = 0; i < NT*2; i++) {                            // a zigzag: cloth edge, eyelet, cloth edge ...
        const a0 = i/(NT*2)*Math.PI*2, a1 = (i + 1)/(NT*2)*Math.PI*2, r0 = i & 1 ? EDGE + 128 : EDGE - 2, r1 = i & 1 ? EDGE - 2 : EDGE + 128;
        const y0 = i & 1 ? 14 : 0, y1 = i & 1 ? 0 : 14, b = lp.length/3;
        lp.push(Math.cos(a0)*r0, y0, Math.sin(a0)*r0, Math.cos(a0)*r0, y0 + 7, Math.sin(a0)*r0, Math.cos(a1)*r1, y1, Math.sin(a1)*r1, Math.cos(a1)*r1, y1 + 7, Math.sin(a1)*r1);
        la.push(0, 0, 0, 0); la[la.length - (i & 1 ? 4 : 2)] = 0.5; la[la.length - (i & 1 ? 3 : 1)] = 0.5;
        li.push(b, b + 1, b + 2, b + 2, b + 1, b + 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(la, 1)); g.setIndex(li);
      const lace = new THREE.Mesh(g, laceMat); lace.position.set(CX, 0, CZ); lace.frustumCulled = false; scene.add(lace); }
    await ctx.yield();

    // ---- the hero: the great well, the bowling ball, the marble ring, the golf ball that falls in -------------------------
    const g0 = companionAt(K.g0, { x: 0, z: 0 });
    const hero = await buildHero(ctx, { style, sheet: false, room: false, detail, wellIndex: 0, ballIndex: 0,
      marbles: Math.round(46*Math.min(1.15, density)), golfStart: [g0.x - AX, g0.z - AZ], lodgeTurn: LODGE_TURN });
    hero.object.position.set(AX, 0, AZ); scene.add(hero.object);
    await ctx.yield();

    // ---- the planet: a cricket ball (or a baseball), made as its makers make it -----------------------------------------
    const planet = new THREE.Group(); planet.name = 'planet'; scene.add(planet);
    {
      const ridge = baseball ? 0.012 : 0.03;                      // the raised seam: a ridge round the equator
      const g = await carvedSphere(PR, 96, 64, (nx, ny) => -PR*ridge*Math.exp(-((ny*PR/2.3)**2)), 1, () => ctx.yield());
      await ctx.yield();
      const leather = baseball ? P.cloth.clone().lerp(P.shade, 0.12) : P.red;
      const leatherShd = baseball ? P.shade.clone().lerp(P.plum, 0.22) : P.red.clone().lerp(P.plum, 0.6);
      const scuff = leather.clone().lerp(baseball ? P.shade : P.cloth, baseball ? 0.5 : 0.13);
      // the leather's marks (the maker's stamp in brass, crisp scratches on the scuffed side), flat inks of the look's own seven
      const glv = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
      const stampLit = P.brass, stampShd = P.brass.clone().lerp(P.plum, 0.5);                      // brass, as the hoop holds it
      const scratchLit = leather.clone().lerp(baseball ? P.shade : P.white, 0.38), scratchShd = leatherShd.clone().lerp(baseball ? P.shade : P.white, 0.38);
      const mat = style.ballMaterial({ lit: leather, shade: leatherShd, edge: 0.04, aux: new THREE.Vector4(scuff.r, scuff.g, scuff.b, 0), body: /* glsl */`
        vec3 on = vO/${PR.toFixed(1)};
        float sc = smoothstep(.62, .66, vn(on.xz*6. + on.y*4. + 7.))*smoothstep(.45, .7, dot(on, vec3(.5, -.62, .6)));   // the scuffed side
        lit = mix(lit, uAux.rgb, sc);
        float sd = 1. - smoothstep(.35, .7, abs(vO.y));           // the seam's own line
        // ---- the leather's marks, all in the ball's own frame (they tumble with it as it rolls) ----
        vec3 kn = normalize(vO); float kf = length(fwidth(vO))*.7 + 1e-4;     // metres of leather across a pixel: every edge is crisp
        float kLat = ${PR.toFixed(1)}*asin(clamp(kn.y, -1., 1.));             // metres over the leather from the seam's plane
        // the maker's stamp, one at the middle of each of the four panels: an oval ring 16 m by 9 m, its long side along the seam,
        // and three upright bars in it (the stumps). The four panels are folded onto one, so each carries the same stamp.
        vec3 kq = ${baseball ? 'kn' : '(kn.y < 0. ? kn.zyx : kn)'}; kq.yz = abs(kq.yz);
        vec2 ks = ${PR.toFixed(1)}*vec2(kq.x, (kq.y - kq.z)*.7071);          // metres along the seam and toward the pole, from the panel's middle
        float kk = length(ks/vec2(7.55, 4.05));
        float ke = (kk - 1.)/max(length(ks/vec2(57.0, 16.4))/max(kk, 1e-3), 1e-3);   // metres from the oval's own line
        vec2 kb = abs(ks);
        float kBar = min(max(kb.x - .45, kb.y - 2.5), max(abs(kb.x - 2.4) - .45, kb.y - 1.8));   // the middle bar 5 m tall, the outer two 3.6 m
        float kStamp = clamp(.5 - min(abs(ke) - .45, kBar)/kf, 0., 1.);
        // the quarter seams (the cricket ball only): one pressed line over each half, from the outermost stitches over the pole;
        // in the plane z 0 on the half of greater y, in the plane x 0 on the other, a quarter turn apart
        float kqd = ${baseball ? '99.' : '(kn.y > 0. ? abs(vO.z) : abs(vO.x))'};
        float kQuart = clamp(.5 - (kqd - .25)/kf, 0., 1.)*min(1., .5/kf)*clamp(.5 + (abs(kLat) - 8.)/kf, 0., 1.);
        // the scuffed side: short straight scratches in rows 1.6 m apart along the seam's direction, one to a cell of its row at
        // most, laid by the hash of the cell; fewer toward the side's edge (65 degrees from its centre), every one the same tone
        float kRow = floor(kLat/1.6), kRowLat = (kRow + .5)*1.6;
        float kCirc = 6.2832*${PR.toFixed(1)}*cos(kRowLat/${PR.toFixed(1)}), kN = max(floor(kCirc/9.), 1.), kW = kCirc/kN;   // the row's length, its cells (9 m and over)
        float kLon = atan(kn.z, kn.x + (abs(kn.x) + abs(kn.z) < 1e-4 ? 1e-3 : 0.))/6.2832 + .5;
        float kCol = min(floor(kLon*kN), kN - 1.); vec2 kCell = vec2(kCol, kRow + 40.);
        float kMidLon = ((kCol + .5)/kN - .5)*6.2832, kMidLat = kRowLat/${PR.toFixed(1)};
        float kSide = dot(vec3(cos(kMidLat)*cos(kMidLon), sin(kMidLat), cos(kMidLat)*sin(kMidLon)), vec3(.5, -.62, .6));   // the cell's own place on the side
        float kLen = mix(2.5, 6., h21(kCell*1.3 + 11.1)), kWid = mix(.4, .6, h21(kCell + 27.3));
        float kTilt = (h21(kCell*2.3 + 5.5) - .5)*2.*min(.364, (1.4 - kWid)/kLen);        // within 20 degrees of the seam's direction, and inside its own row
        float kx = (kLon*kN - kCol - .5)*kW - (h21(kCell*1.7 + 41.9) - .5)*(kW - kLen - 1.), ky = kLat - kRowLat - kTilt*kx;
        float kScr = clamp(.5 - max(abs(kx) - kLen*.5, abs(ky) - kWid*.5)/kf, 0., 1.)*min(1., kWid/kf);
        kScr *= step(h21(kCell + 3.7), .45*clamp((kSide - .4226)/.5774, 0., 1.))*step(.4226, dot(kn, vec3(.5, -.62, .6)));
        // none within 1 m of a stamp, a quarter seam or the outermost stitches, none within 14 m of a pole (where a row turns too tightly for a straight stroke)
        kScr *= step(1.45, ke)*step(1.25, kqd)*step(abs(kLat), 41.)*${baseball ? 'step(5.6, abs(kLat))*step(5.6, ' + PR.toFixed(1) + '*abs(asin(clamp(kn.z, -1., 1.))))' : 'step(8., abs(kLat))'};
        lit = mix(lit, ${glv(scratchLit)}, kScr); shd = mix(shd, ${glv(scratchShd)}, kScr);
        lit = mix(lit, shd, kQuart*.55);                           // toned as the seam's own line
        lit = mix(lit, ${glv(stampLit)}, kStamp); shd = mix(shd, ${glv(stampShd)}, kStamp);   // flat brass, two tones
        lit = mix(lit, shd, sd*.55);` });
      planet.add(new THREE.Mesh(g, mat));
      // stitches: raised capsules in rows either side of the seam
      const rows = baseball ? [-2.4, 2.4] : [-6.3, -4.2, -2.1, 2.1, 4.2, 6.3], per = baseball ? 54 : 31;
      const cap = new THREE.CapsuleGeometry(baseball ? 0.5 : 0.55, baseball ? 3.4 : 3.6, 3, 8);
      const rings = baseball ? 2 : 1;
      const st = new THREE.InstancedMesh(cap, style.ballMaterial({ lit: baseball ? P.red : P.white, shade: baseball ? P.red.clone().lerp(P.plum, 0.55) : cw === 'lycra' ? P.white.clone().lerp(P.plum, 0.4) : P.shade.clone().lerp(P.plum, 0.12), edge: 0.1 }), rows.length*per*rings);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
      let n = 0;
      for (let ring = 0; ring < rings; ring++) for (let r = 0; r < rows.length; r++) for (let i = 0; i < per; i++) {
        const a = (i + (r & 1)*0.5)/per*Math.PI*2, lat = rows[r]/PR, cl = Math.cos(lat), rr = PR*(1 + (baseball ? 0.012 : 0.03)*Math.exp(-((rows[r]/2.3)**2))) + 0.25;
        Z.set(Math.cos(a)*cl, Math.sin(lat), Math.sin(a)*cl);                        // outward
        const slant = baseball ? (r ? 1 : -1)*0.9 : 0;
        Y.set(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(Math.cos(slant)).addScaledVector(X.set(0, 1, 0), Math.sin(slant));
        Y.addScaledVector(Z, -Y.dot(Z)).normalize(); X.crossVectors(Y, Z);
        if (ring) { Z.set(Z.x, -Z.z, Z.y); Y.set(Y.x, -Y.z, Y.y); X.crossVectors(Y, Z); }
        M.makeBasis(X, Y, Z); Q.setFromRotationMatrix(M); M.compose(T.copy(Z).multiplyScalar(rr), Q, S); st.setMatrixAt(n++, M);
      }
      st.frustumCulled = false; planet.add(st);
    }
    const planetQ0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.36, 0.93, -0.01).normalize())
      .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), planetYaw*0.4));
    const planetAxis = new THREE.Vector3(planetDir.y, 0, -planetDir.x);
    await ctx.yield();

    // ---- golf balls: the one that rolls beside us (instance 0) and six sitting still; real dimples, the hero's own mould ----
    const heroGolf = hero.object.getObjectByName('golf-ball');
    const golf = new THREE.InstancedMesh(heroGolf.geometry, heroGolf.material, 5);
    golf.instanceMatrix.setUsage(THREE.DynamicDrawUsage); golf.frustumCulled = false; golf.name = 'golf-balls'; scene.add(golf);
    const golfFar = new THREE.InstancedMesh(await golfGeometry(64, 40, () => ctx.yield()), heroGolf.material, 2);   // the two that are never near: a lighter mould
    golfFar.instanceMatrix.setUsage(THREE.DynamicDrawUsage); golfFar.frustumCulled = false; golfFar.name = 'golf-balls-far'; scene.add(golfFar);
    const companionQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, 1.1, 0.2)), companionPrev = { x: NaN, z: 0 };
    // shadow slots 4..7 go to the four still balls nearest the course; the two farthest get a laid strip instead
    const stillOrder = stills.map((s, i) => ({ i, d: i === 1 ? 0 : i === 0 ? 1 : i === 4 ? 2 : i === 2 ? 3 : 1e6 + i })).sort((a, b) => a.d - b.d).map((o) => o.i);
    const nearStill = new Set([1, 4, 0, 2]);
    const farStrips = style.makeMarbles(2); farStrips.meshes[0].visible = farStrips.meshes[1].visible = farStrips.meshes[2].visible = false; scene.add(farStrips.group);
    // our marble: clear glass, one twisted orange vane, rolling on the cloth 40 m ahead of the lens
    const ours = style.makeMarbles(1); scene.add(ours.group);
    const oursQ = new THREE.Quaternion(), oursPrev = new THREE.Vector3(NaN, 0, 0);
    await ctx.yield();

    // ---- four more heavy things in their own dips: a globe, a steel bearing, a pool ball, a second bowling ball ------------
    const lycra = cw === 'lycra';
    const FWR = /* glsl */`vec3 fwR3 = fwidth(V) + fwidth(N)*2.; float fwR = max(max(fwR3.x, fwR3.y), fwR3.z);`;
    const WINDOW = /* glsl */`col = mix(col, cWhite, windowQuad(reflect(V, N)));`;
    {
      // the classroom globe: sea and land as two flat tones, the graticule ruled on it in the world's own ink
      const sea = lycra ? P.shade : P.white, land = lycra ? P.cloth.clone().lerp(P.plum, 0.3) : P.shade.clone().lerp(P.ballpoint, 0.28);
      const globeMat = style.ballMaterial({ lit: sea, shade: lycra ? P.cloth.clone().lerp(P.shade, 0.35) : P.shade.clone().lerp(P.plum, 0.16), edge: 0.06, gloss: true,
        aux: new THREE.Vector4(land.r, land.g, land.b, 0), body: /* glsl */`
        vec3 on = normalize(vO + vec3(0., 1e-4, 0.));
        float lv = .55*vn(on.xz*2.3 + on.y*vec2(1.9, -1.3) + 3.) + .45*vn(on.zy*4.4 + on.x*vec2(-2.1, 1.7) + 11.);
        float lf = fwidth(lv) + 1e-4; float landK = smoothstep(.53 - lf, .53 + lf, lv)*(1. - smoothstep(.9, .95, abs(on.y)));
        lit = mix(lit, uAux.rgb, landK); shd = mix(shd, mix(uAux.rgb, cPlum, .3), landK);
        float la = asin(clamp(on.y, -1., 1.)), lo = atan(on.z, on.x + 1e-5), cl = max(cos(la), .05);
        float fLa = fwidth(on.y)/cl*34. + 1e-3, fLo = length(fwidth(on.xz))*34. + 1e-3;
        float dLa = abs(fract(la/.2618 + .5) - .5)*.2618*34., dLo = abs(fract(lo/.2618 + .5) - .5)*.2618*34.*cl;
        float eq = 1. - step(.05, abs(la));
        float grat = max(1. - smoothstep(.3 + .5*eq, .3 + .5*eq + fLa, dLa), (1. - smoothstep(.3, .3 + fLo, dLo))*(1. - smoothstep(1.3, 1.4, abs(la))));
        grat *= 1. - smoothstep(2., 5., max(fLa, fLo));`,
        post: /* glsl */`col = mix(col, cInk, grat*.85); ${WINDOW}` });
      heavy[0].mesh = new THREE.Mesh(new THREE.SphereGeometry(34, 64, 40), globeMat);
      heavy[0].q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.41, vr.range(0, 6.28), 0.12));          // on its tilted axis
      await ctx.yield();
      // the steel bearing: a mirror for the ruled sheet and the room, bounded by one dark limb
      const steelMat = style.ballMaterial({ lit: P.white, shade: lycra ? P.shade.clone().lerp(P.white, 0.3) : P.shade.clone().lerp(P.plum, 0.22), edge: 0.05, gloss: true, body: FWR,
        aux: (() => { const c = lycra ? P.shade.clone().lerp(P.white, 0.62) : P.shade.clone().lerp(P.plum, 0.62); return new THREE.Vector4(c.r, c.g, c.b, 0); })(), post: /* glsl */`
        vec3 R = reflect(V, N); float th = sheetHit(vP + N*.3, R);
        float fy = fwidth(R.y) + 1e-4; float below = 1. - smoothstep(-fy, fy, R.y + .01);
        col = mix(mix(cShd, cWhite, max(windowQuad(R), wallPatch(R))), mix(mix(cShade, cCloth, .75), cInk, .17), below);   // the room on steel: a tone under the room's own
        if (th > 0.) col = sheetCol(vP + R*th, clamp(fwR*th*1.5, .5, 40.));
        float limb = 1. - abs(dot(N, V)); float lw = fwidth(limb) + 1e-4;
        col = mix(col, cShd, .16);                              // steel holds a tone of its own, under the cloth and the room
        col = mix(col, uAux.rgb, (1. - smoothstep(.05, .05 + 2.*fy, abs(R.y + .045)))*.9);   // and one dark band where the room meets the cloth
        col = mix(col, uAux.rgb, smoothstep(.9 - lw, .9 + lw, limb));
` });
      heavy[1].mesh = new THREE.Mesh(new THREE.SphereGeometry(22, 64, 40), steelMat);
      heavy[1].q0 = new THREE.Quaternion();
      await ctx.yield();
      // the pool ball: brass yellow, its number in a white roundel, the window on its gloss
      const poolMat = style.ballMaterial({ lit: P.brass, shade: P.brass.clone().lerp(P.plum, 0.5), edge: 0.06, gloss: true,
        aux: new THREE.Vector4(P.whiteShade.r, P.whiteShade.g, P.whiteShade.b, 0), body: /* glsl */`
        vec3 on = normalize(vO + vec3(0., 1e-4, 0.));
        float dd = length(on - vec3(0., 0., 1.)); float df = fwidth(dd) + 1e-4;
        float disc = 1. - smoothstep(.46 - df, .46 + df, dd);
        float bar = (1. - smoothstep(.05 - df, .05 + df, abs(on.x)))*(1. - smoothstep(.21 - df, .21 + df, abs(on.y)))*step(0., on.z);
        bar = max(bar, (1. - smoothstep(.04 - df, .04 + df, abs(on.x + on.y*.7 - .1)))*step(.09, on.y)*(1. - step(.21, on.y))*step(on.x, 0.)*step(0., on.z));
        lit = mix(lit, cWhite, disc); shd = mix(shd, uAux.rgb, disc);`,
        post: /* glsl */`col = mix(col, cPlum, bar*disc); ${WINDOW}` });
      heavy[2].mesh = new THREE.Mesh(new THREE.SphereGeometry(24, 64, 40), poolMat);
      // its roundel faces up and back along the course, toward the lens as we come
      heavy[2].q0 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-fdx*0.75 + fdz*0.35, 0.56, -fdz*0.75 - fdx*0.35).normalize());
      await ctx.yield();
      // the second bowling ball: marble orange, three real finger pits, a flat darker swirl
      const pits = [[0.26, 0.6, 3.3], [0.26, -0.6, 3.3], [0.34, Math.PI, 4.0]].map(([pol, az, r]) => ({ x: Math.sin(pol)*Math.cos(az), y: Math.cos(pol), z: Math.sin(pol)*Math.sin(az), r }));
      const bg = await carvedSphere(30, 72, 48, (x, y, z) => { let d = 0;
        for (const q of pits) { const ang = Math.acos(Math.min(1, x*q.x + y*q.y + z*q.z))*30; if (ang < q.r*1.15) d = Math.max(d, 5*(1 - sm(q.r*0.72, q.r*1.02, ang))); }
        return d; }, 1.5, () => ctx.yield());
      const bowlMat = style.ballMaterial({ lit: P.orange, shade: P.orange.clone().lerp(P.plum, 0.5), edge: 0.07, gloss: true,
        aux: new THREE.Vector4(vr.range(0, 30), vr.range(0, 30), 0, 0), body: /* glsl */`
        vec3 o = vO/30.; vec2 sw = vec2(o.x + o.y*.6, o.z - o.y*.4)*2.4 + uAux.xy;
        sw += 1.5*vec2(vn(sw*1.3 + 4.), vn(sw*1.3 + 17.));
        float sv = vn(sw*1.5); float sf = fwidth(sv) + 1e-4; float swirl = smoothstep(.56 - sf, .56 + sf, sv);
        float pit = 1. - smoothstep(29.2, 29.75, length(vO));
        lit = mix(lit, mix(cLit, cPlum, .22), swirl*(1. - pit)); shd = mix(shd, mix(cShd, cPlum, .25), swirl*(1. - pit));
        lit = mix(lit, cShd, pit);`,
        post: /* glsl */`col = mix(col, cWhite, windowQuad(reflect(V, N))*(1. - pit));` });
      heavy[3].mesh = new THREE.Mesh(bg, bowlMat);
      heavy[3].q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, vr.range(0, 6.28), -0.4));
      for (const b of heavy) { b.mesh.name = 'heavy-' + b.kind; b.mesh.frustumCulled = false; scene.add(b.mesh); }
    }
    await ctx.yield();

    // ---- pilling: bobbles of fluff on the cloth, each with its own small contact smudge ---------------------------------
    const NPILL = Math.max(600, Math.round(5200*density*detail));
    {
      const pp = [], pk = [];
      pp.push(-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0); pk.push(0, 0, 0, 0, 0, 0);                 // the bobble
      pp.push(-1, 0, -1, 1, 0, 1, 1, 0, -1, -1, 0, -1, -1, 0, 1, 1, 0, 1); pk.push(1, 1, 1, 1, 1, 1);                 // its smudge
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(pk, 1));
      const ai = new Float32Array(NPILL*4), pr = ctx.rng.fork ? ctx.rng.fork('pill') : ctx.rng, q = { x: 0, z: 0, tx: 0, tz: 1 };
      for (let i = 0; i < NPILL; i++) {
        let px, pz;
        if (i % 8 === 0) { px = pr.range(-150, 150); pz = 214 + pr.range(-9, 9); }            // thicker along the sewn seam
        else { along(pr()*0.985, 0, q); const d = pr.gauss()*24; px = q.x + q.tz*d; pz = q.z - q.tx*d; }
        if (Math.hypot(px - AX, pz - AZ) < 100) { px += 400; pz -= 300; }
        ai[i*4] = px; ai[i*4 + 1] = pz; ai[i*4 + 2] = pr.range(0.2, 0.5); ai[i*4 + 3] = pr();
        if (i % 400 === 399) await ctx.yield();
      }
      g.setAttribute('aI', new THREE.InstancedBufferAttribute(ai, 4)); g.instanceCount = NPILL;
      const mat = style.mk(/* glsl */`
        ${style.glsl.common}
        attribute vec4 aI; attribute float aK; varying float vLit, vK, vS; varying vec2 vQ;
        void main(){
          vec2 c = aI.xy; float h = sheetH(c); vec3 wp;
          float kf = 1. - smoothstep(60., 100., length(vec3(c.x, h, c.y) - cameraPosition));
          float s = aI.z*.85*kf*step(.5, kf);   // far off the fluff is not drawn at all (and never as a speck under two pixels): the wash stays even
          if (aK > .5) { vec2 o = position.xz*s*1.3 - normalize(uL.xz + vec2(1e-5, 0.))*s*.7; wp = vec3(c.x + o.x, sheetH(c + o) + .06, c.y + o.y); vQ = position.xz; }
          else { vec3 rgt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
            vec3 ctr = vec3(c.x, h + s*.5, c.y); ctr.xz += sin(uTime*vec2(1.7, 2.3) + aI.w*40.)*.07*s;            // it shivers
            wp = ctr + (rgt*position.x + up*position.y)*s; vQ = position.xy; }
          vLit = sheetLit(vec3(c.x, h + .5, c.y), 1.); vK = aK; vS = aI.w;
          gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
        }`, /* glsl */`
        ${style.glsl.common}
        uniform vec3 cCloth, cShade, cPlum; varying float vLit, vK, vS; varying vec2 vQ;
        void main(){
          float d = length(vQ);
          float lt = smoothstep(.4, .6, vLit);                                                                   // fluff is pale: cloth white with a soft underside of shade tone, never grit
          if (vK > .5) { if (d > 1.) discard; gl_FragColor = vec4(mix(mix(cShade, cPlum, .1), mix(cCloth, cShade, .8), lt), 1.); return; }
          float r = .78 + .22*vn(vQ/max(d, 1e-3)*2.2 + vS*37.);                                                  // a soft, uneven round
          if (d > r) discard;
          vec3 n = transpose(mat3(viewMatrix))*vec3(vQ, sqrt(max(r*r - d*d, 0.)) + 1e-4);
          float tone = smoothstep(-.5, .3, dot(normalize(n), uL));
          gl_FragColor = vec4(mix(mix(mix(cShade, cPlum, .1), mix(cCloth, cShade, .6), lt), mix(cShade, cCloth, lt), tone), 1.); }`, {}, {});
      const pill = new THREE.Mesh(g, mat); pill.frustumCulled = false; pill.name = 'pilling'; scene.add(pill);
    }
    await ctx.yield();

    // ---- the brass grommet in the funnel's throat: the portal sits in it ------------------------------------------------
    const grommet = new THREE.Group(); grommet.name = 'grommet';
    { const fm = new THREE.Matrix4(); path.frameAt(true, fm, true);
      grommet.add(new THREE.Mesh(new THREE.TorusGeometry(12, 1.9, 10, 56), brassMat));
      const washer = new THREE.Mesh(new THREE.RingGeometry(11.8, 15.8, 56), style.ballMaterial({ lit: P.brass.clone().lerp(P.plum, 0.18), shade: brassShd, edge: 0.05, side: THREE.DoubleSide }));
      washer.position.z = -0.8; grommet.add(washer);
      grommet.applyMatrix4(fm); scene.add(grommet); }
    await ctx.yield();

    // ---- everything that moves: one state for a progress u ---------------------------------------------------------------
    const N3 = new THREE.Vector3(), T3 = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), A3 = new THREE.Vector3();
    const Q0 = new THREE.Quaternion();
    const seat = (x, z, R, out) => { style.normalAt(x, z, N3); const h = style.heightAt(x, z); return out.set(x + N3.x*R, h + N3.y*R, z + N3.z*R); };
    // (the cure of the marble through the ball) OUR MARBLE KEEPS CLEAR AIR FROM THE LODGED GOLF BALL AND FROM THE PLANET, BY
    // PLACE. Its weave carried it through the golf ball lodged on the great well's wall (8.2 m inside it) and, on some
    // clocks, up to 0.95 m into the planet ball at the entry. Its point on the cloth is now pushed out in plan, straight away
    // from the ball's own place, until the two centres stand D' apart: D' = Dc + MSOFT*(D/(Dc + MSOFT))^((Dc + MSOFT)/MSOFT)
    // where D is their distance unpushed and Dc the two radii and MCLR. So D' is never under Dc, the push comes on with
    // no step and no kink MSOFT beyond Dc, and further off the marble is where it always was, to the bit. A pure
    // function of the two places as they stand: no lens, no seed, no position on the route, no clock of its own.
    const MCLR = 3, MSOFT = 12, MP = [0, 0], OM = [0, -1e5, 0];   // (OM: our marble's centre as seated this frame, for the ring and the whirlpool)
    const marbleClear = (bx, by, bz, R) => { const Dc = R + MR + MCLR, Dw = Dc + MSOFT;
      seat(MP[0], MP[1], MR, T3); let D = Math.hypot(T3.x - bx, T3.y - by, T3.z - bz); if (D >= Dw) return;
      let nx = T3.x - bx, nz = T3.z - bz; const nl = Math.hypot(nx, nz); if (nl < 1e-3) return; nx /= nl; nz /= nl;
      const want = Dc + MSOFT*Math.pow(D/Dw, Dw/MSOFT);
      for (let i = 0; i < 10 && Math.abs(want - D) > 1e-3; i++) { const s = (want - D)*D/Math.max(Math.hypot(T3.x - bx, T3.z - bz), 0.3*D);
        MP[0] += nx*s; MP[1] += nz*s; seat(MP[0], MP[1], MR, T3); D = Math.hypot(T3.x - bx, T3.y - by, T3.z - bz); } };
    const rollBy = (q, prev, x, z, R) => {                        // turn a ball by the ground it has covered
      if (prev.x === prev.x) { const dx = x - prev.x, dz = z - prev.z, d = Math.hypot(dx, dz);
        if (d > 1e-4 && d < 25) { Q4.setFromAxisAngle(A3.set(dz/d, 0, -dx/d), d/R); q.premultiply(Q4); } }
      prev.x = x; prev.z = z;
    };
    const ripple = (u) => {                                       // the rare flick: one straight ripple crossing from the window side
      if (!rare) return;
      const k = (u - 0.114)/0.185, amp = 6.5*sm(0, 0.08, k)*(1 - sm(0.92, 1, k));
      style.setRipple(0.8, 0.6, 1066 - 1300*k, k > 0 && k < 1 ? amp : 0);   // it comes from ahead and the window side, crosses the great well as we crest the lip and passes under us
    };
    // the brass plate the grommet is set in: an annulus laid on the cloth round the throat, stamped with two grooves and twelve rivets
    {
      const pg = new THREE.RingGeometry(12.2, 42, 72, 10).rotateX(-Math.PI/2);
      const plateMat = style.mk(/* glsl */`
        ${style.glsl.common}
        varying vec3 vP;
        void main(){ vec4 wp = modelMatrix*vec4(position, 1.); wp.y = sheetH(wp.xz) + .6; vP = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`, /* glsl */`
        ${style.glsl.common}
        uniform vec3 cLit, cShd, cPlum; uniform vec2 uC; varying vec3 vP;
        void main(){
          vec2 d = vP.xz - uC; float r = length(d); float fr = fwidth(r) + 1e-3;
          float tone = smoothstep(-.06, .06, dot(sheetN(vP.xz), uL))*smoothstep(.4, .6, sheetLit(vP, 1.));
          vec3 col = mix(cShd, cLit, tone);
          float groove = max(1. - smoothstep(.4, .4 + fr, abs(r - 18.)), 1. - smoothstep(.4, .4 + fr, abs(r - 39.)));
          float a = atan(d.y, d.x + 1e-5)/.5236; vec2 q = vec2((fract(a) - .5)*.5236*r, r - 28.5);
          float rivet = 1. - smoothstep(1.9, 1.9 + fr, length(q));
          float cap = 1. - smoothstep(1.2, 1.2 + fr, length(q - normalize(uL.xz + vec2(1e-5, 0.))*.45));
          col = mix(col, mix(cShd, cPlum, .35), max(groove, rivet));
          col = mix(col, cLit, cap*rivet);
          gl_FragColor = vec4(col, 1.); }`,
        { cLit: { value: brassLit }, cShd: { value: P.brass.clone().lerp(P.plum, 0.24) }, uC: { value: new THREE.Vector2(FX, FZ) } },
        { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const plate = new THREE.Mesh(pg, plateMat); plate.position.set(FX, 0, FZ); plate.frustumCulled = false; plate.name = 'brass-plate'; scene.add(plate);
    }
    // ---- the whirlpool: marbles spiralling down the funnel at their own radii and speeds, dropping through the brass ----------
    const NWH = Math.max(18, Math.round(42*Math.min(1.15, density)*detail));
    const whirl = style.makeMarbles(NWH); whirl.group.name = 'whirlpool'; scene.add(whirl.group);
    const wm = []; { const wr = ctx.rng.fork ? ctx.rng.fork('whirl') : ctx.rng;
      for (let i = 0; i < NWH; i++) wm.push({ p0: (i + wr.range(-0.4, 0.4))/NWH, T: wr.range(30, 46), th0: wr.range(0, 6.28), turns: wr.range(2.0, 3.0)*Math.PI*2,
        R: i % 9 === 4 ? wr.range(8.5, 10) : wr.range(4.8, 7), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(wr.range(0, 6.28), wr.range(0, 6.28), wr.range(0, 6.28))) }); }
    const W_OUT = 122, W_IN = 20, FLOOR_OFF = 6, wway = new Float64Array(NWH*4); let wwayT = NaN, wwayX = NaN, wwayY = NaN, wwayZ = NaN, wwayU = NaN;
    // (the cure of the lens rule's leap) each whirlpool marble's swing: 0 its side of the lens's point last frame, 1 swinging,
    // 2 pushed last frame, 3 its radius last frame, 4 seconds swung, 5 how steep the cloth stood under it, 6 which way it went
    // last, 7 its speed along its radius last frame (metres a second), 8 the radius the rule put it at last frame; and its share of its ride last frame
    const wsw = new Float64Array(NWH*9), wsp = new Float64Array(NWH), SWING_DIP = 22, SWING_CAP = 900, SWING_N = 16, SWING_AC = SWINGA, SWING_VC = 360;   // (metres from the grommet's axis; metres a second; steps tried; metres a second each second of its centre; metres a second of its centre)
    let pK = 1, paceU = 0; const wlv = new Float64Array(NWH*8);   // (the fifteenth) each whirlpool marble's centre last frame (0 to 2), its step then (3 to 5) and that frame's length (6)
    // (the cure of our marble through the whirlpool) a whirlpool marble's distance from our marble, seated with its point on the cloth at (x, z)
    let wh = 0; const whirlD = (x, z, R) => { style.normalAt(x, z, N3); wh = style.heightAt(x, z); return Math.hypot(x + N3.x*R - OM[0], wh + N3.y*R - OM[1], z + N3.z*R - OM[2]); };
    const whirlAt = (time, dt) => {
      const fresh = !(Math.abs(time - wwayT - dt) < 1e-4) || (dt === 0 && (OM[0] !== wwayX || OM[1] !== wwayY || OM[2] !== wwayZ || lastU !== wwayU)); wwayT = time; wwayX = OM[0]; wwayY = OM[1]; wwayZ = OM[2]; wwayU = lastU;
      for (let i = 0; i < NWH; i++) { const m = wm[i];
        const p = (((m.p0 + time/m.T) % 1) + 1) % 1, r = W_OUT - (W_OUT - W_IN)*Math.pow(p, 0.85);
        const ang = m.th0 - m.turns*(p + 1.6*p*p*p);                      // faster the lower it rides
        const k = sm(0, 0.035, p)*sm(W_IN + 1, W_IN + 9, r), R = m.R*Math.max(k, 1e-4);   // it rolls in over the rim and drops through the brass
        const c = Math.cos(ang), sn = Math.sin(ang);
        let rr = r;
        // in the last turn the marbles keep off the line from the lens to the grommet: on our side of the throat they ride
        // the plate's rim, so the opening and the world in it are seen clear, and drop through the brass on its far side
        const late = sm(0.855, 0.89, lastU); let rmin = 0;
        { const cb = Math.atan2(AV[1] - FZ, AV[0] - FX); let da = ang - cb; da -= Math.PI*2*Math.round(da/(Math.PI*2));
          const sk = (1 - sm(1.7, 2.3, Math.abs(da)))*late; rmin = r < 58 ? r + (58 - r)*sk : 58*sk; rr = Math.max(r, rmin); }
        let wpush = false; const dl = Math.hypot(FX + c*r - AV[0], FZ + sn*r - AV[1]);            // it steps aside from under the lens
        { const ox = FX + c*r - AV[0], oz = FZ + sn*r - AV[1], off = Math.abs(ox*GZ[1] - oz*GZ[0])/Math.max(dl, 1e-3);   // (sine of its bearing off the gaze)
          const need = (12 + 3.2*m.R)*(1 + 0.8*sm(0.9, 0.94, lastU))*(1 + 1.6*(ox*GZ[0] + oz*GZ[1] < 0 ? 1 : sm(0.42, 0.72, off))), reach = need*1.5;   // near ones only in the middle of the view: toward the frame's sides they keep far enough to be small
          if (dl < reach) { const t = 1 - dl/reach; rr += (r >= Math.hypot(AV[0] - FX, AV[1] - FZ) ? 1 : -1)*need*1.15*t*t*(3 - 2*t); } wpush = dl < reach; }   // (far enough that it stands whole in the frame, never a blob at a corner)
        { const hb = heavy[1], db = Math.hypot(FX + c*rr - hb.x, FZ + sn*rr - hb.z), need = hb.R + R + 3; if (db < need) rr -= need - db; }   // and round the foot of the steel bearing on the near wall
        if (late > 0) rr = Math.max(rr, rmin, Math.min(r, 30));          // (stepping aside never takes one across the throat or onto our side of the plate)
        // (the cure of the lens rule's leap) THE SWING, see the part. Where the lens's point has crossed a pushed marble's radius the
        // marble no longer leaps to the other side of it: from where it stood it makes for where the rule puts it, along its own
        // radius, at the swing's speed (down here the lens rides high over the funnel and a marble may pass under its point), and
        // when it is there the swing is over. While it swings it moves no faster along its radius than that, whatever the rule's
        // place does meanwhile (crossed again, the reach grown), but for the last turn's hold (below); in the last
        // turn a marble standing on or over the 30 m circle keeps it as it goes. Its radius is not passed through the steel bearing's foot again; the way
        // round our marble follows as ever. A marble that has just rolled in over the rim anew does not swing. IT DOES NOT STOP
        // DEAD (the fifteenth: THE BRAKE IS COUNTED ON THE MARBLE'S OWN CENTRE). Where the rule was carrying it when its swing
        // began it runs on and turns, and the step of its CENTRE changes from one frame to the next by no more than SWING_AC
        // allows (4 m at 60 a second; on an uneven clock by the two frames' lengths). Counted along its radius, as the fourteenth
        // counted it, the same brake was two to four times as hard where the marble is being parted round our marble (its centre
        // goes two to four metres there for a metre of its radius, and that ratio changes from frame to frame). So each swinging
        // frame its step along its radius is CHOSEN BY TRYING: its wish first (toward the rule's place at the swing's speed),
        // then SWING_N steps between the step it came with, none and its wish; each is placed whole (the way round our marble,
        // the floors, the steel bearing: the very lines below, the bearing's memory put back after each try) and the centre's
        // change of step measured against its step the frame before; the one nearest its wish within the allowance is taken
        // that does not send its centre faster than SWING_VC (360 m a second, 6 m a frame at 60; times the pace) or than it
        // came (where it is parted round our marble its centre goes several metres for a metre of its radius: there it goes
        // out more slowly); if none is so, the slowest within the allowance; if none is within it, the one that changes the
        // centre's step least. The step it is taken to have come with is never
        // over SWING_CAP (a snap of the rule's own, as where the last turn's circle switches on, is not a speed it was carried
        // at). Running on INWARD against its way it no longer stops on the 30 m circle: it may go under it, never under
        // SWING_DIP (22 m, clear of the plate's 20 m circle), and no nearer the axis each frame than the steady brake that
        // stops it on SWING_DIP takes it (the course of a constant brake from its speed and the room left, by the frame's own
        // length); then it comes back out at the swing's speed. THE LAST TURN'S HOLD: a swinging marble under the hold for its
        // bearing (rmin) makes for it at the swing's full speed more than its wish, and stops on it: it is under the hold only
        // for the frames that takes. THE VISITOR'S PACE (pK, reckoned in apply): the swing's clock, its speeds and SWING_CAP
        // run that many times as fast; the brake's allowance does not change with it. AND IT IS NOT FLUNG ON LANDING: its swing is
        // over only when the rule is moving its place at the marble's own step, to within SWINGA along its radius, and its wish itself is within the centre's allowance; where the rule's
        // place rushes by faster than the swing, the marble lets it by and follows. A side change that moves it under SWING_MIN
        // along its radius begins no swing. (In the fourteenth a swinging marble kept only the 30 m circle: see THE LAST TURN'S HOLD above.)
        let nT = 0, sA = 0, sB = 0, sW = 0, wasR = rr, wayS = 1, lowS = 0, landS = false; const born = fresh || p < wsp[i], ruleR = rr;
        { const j = i*9, ls = r >= Math.hypot(AV[0] - FX, AV[1] - FZ) ? 1 : -1, rr0 = rr;
          if (born) { wsw[j + 1] = 0; wsw[j + 7] = 0; }
          else if (dt > 0) {
            if (!wsw[j + 1] && ls !== wsw[j] && wsw[j] !== 0 && (wpush || wsw[j + 2]) && Math.abs(rr - wsw[j + 3]) > SWING_MIN) { wsw[j + 1] = 1; wsw[j + 4] = 0; wsw[j + 6] = 0; }
            if (wsw[j + 1]) { const g = rr - wsw[j + 3], way = g < 0 ? -1 : 1; if (way !== wsw[j + 6]) { wsw[j + 4] = 0; wsw[j + 6] = way; }   // (turned about, it starts from rest)
              wsw[j + 4] += dt*pK; const st = Math.min(SWINGV*Math.min(1, wsw[j + 4]/SWING_UP), Math.max(Math.abs(g)*6, 20))*pK*dt*Math.max(0.25, wsw[j + 5] || 1);   // (metres along the cloth)
              const sp = Math.max(-SWING_CAP*pK, Math.min(SWING_CAP*pK, wsw[j + 7]))*dt;
              nT = 1; wasR = wsw[j + 3]; wayS = way; sW = Math.abs(g) <= st ? g : way*st;
              if (late > 0 && rmin - wasR > sW) sW = Math.min(rmin - wasR, Math.max(sW, 0) + SWINGV*pK*dt*Math.max(0.25, wsw[j + 5] || 1));   // (the fifteenth, THE LAST TURN'S HOLD: under it, it makes for it at the swing's full speed more)
              sA = Math.min(sp, sW, 0); sB = Math.max(sp, sW, 0);   // (what it wishes, and the span it is tried on: below)
              landS = Math.abs(g) <= st && Math.abs(rr0 - wsw[j + 8] - g) <= SWINGA*Math.pow(pK, 0)*dt*dt;
              lowS = Math.min(wasR, SWING_DIP);                         // (running on inward against its way: no nearer the axis this frame than the steady brake that stops it on SWING_DIP takes it)
              if (sp < 0 && wasR > lowS) { const room = wasR - lowS, v = -sp/dt, d1 = wlv[i*8 + 6] || dt, vt = Math.max(v - v*v/(2*room)*d1/2, v*0.5); lowS += room*Math.pow(1 - Math.min(1, dt*vt/(2*room)), 2); } }
          } else if (wsw[j + 1]) rr = wsw[j + 3];                       // (a held frame: where it stood)
          if (dt > 0 && !nT) wsw[j + 7] = born || wsw[j] === 0 ? 0 : (rr - wsw[j + 3])/dt;
          if (dt > 0) wsw[j + 8] = rr0;
          wsw[j] = ls; wsw[j + 2] = wpush ? 1 : 0; if (!nT) wsw[j + 3] = rr; wsp[i] = p; }
        let x = 0, z = 0, h = 0, s = 0, bS = 0, bJ = 1e9, bD = 1e9, bOk = false, bW = false, bRk = -1;
        const wk0 = wway[i*4], wk1 = wway[i*4 + 1], wk2 = wway[i*4 + 2], wk3 = wway[i*4 + 3];
        for (let tr = nT ? SWING_N + 1 : 0; ; tr--) {
        if (nT) { s = tr > SWING_N ? sW : tr > 0 ? sA + (sB - sA)*(tr - 1)/(SWING_N - 1) : bS; rr = wasR + s;
          if (tr <= 0 && landS && bW && bOk) rr = ruleR;                // (landed: the rule's place, to the bit)
          else if (s*wayS < 0 && s < 0) rr = Math.max(rr, lowS);
          else if (late > 0 && wasR >= Math.min(r, 30)) rr = Math.max(rr, Math.min(r, 30)); }
        x = FX + c*rr; z = FZ + sn*rr;
        style.normalAt(x, z, N3); h = style.heightAt(x, z); wsw[i*9 + 5] = N3.y;
        // (the cure of our marble through the whirlpool) THE WHIRLPOOL PARTS FOR OUR MARBLE, BY PLACE: our marble rolled straight
        // through the whirlpool's marbles on its way down to the brass (up to 12 m inside one, and for seconds at a time: some
        // ride the swirl beside it). Each one within reach stands at a bearing from our marble (the part's wayRound: its own
        // bearing, kept and turned at a limited rate so that none jumps from one side of it to the other), its point on the cloth
        // far enough along that bearing for the two centres to stand D' apart, by the law our marble keeps off the lodged ball by
        // (Dc the two radii and MCLR; no step, no kink; further off than Dc + MSOFT it is where it always was, to the bit; a marble
        // rolling in small over the rim or shrinking into the brass keeps MCLR and has the soft margin in its own measure). None
        // stands nearer the funnel's axis than W_IN (its floor: the 20 m circle where the whirlpool's own ride ends; it
        // lies ON the brass, which reaches from 12.2 to 42 m). The last turn's own hold (rmin) is NOT a floor for this
        // push: held as one, a marble riding that hold could not give way toward the axis, waited at the hold's edge and
        // then went the long way round our marble (60 m in six frames) or was let go from its far side in one frame. So,
        // for the frames it is within reach of our marble, a marble may stand nearer the axis than the last turn's rule
        // holds it, and on our side of the brass, where the stepping aside for the lens never takes one. A marble ON
        // the 20 m circle has no soft margin (it keeps the two radii and 2 m, along the circle): the margin comes in
        // over FLOOR_OFF metres of room above it. A frame is fresh (every marble on its own bearing) when the clock was
        // set, and at dt nought when our marble or the route's share has moved (a still, a scrub).
        { const soft = Math.max(MSOFT*R/m.R, 1e-3), Dc = R + MR + MCLR, Dw = Dc + soft, ox = x + N3.x*R - OM[0], oz = z + N3.z*R - OM[2], D = Math.hypot(ox, h + N3.y*R - OM[1], oz);
          if (D >= Dw) wway[i*4 + 1] = 0;
          else { const pl = Math.hypot(ox, oz), rF = W_IN, want0 = Dc + soft*Math.pow(D/Dw, Dw/soft), hardD = R + MR + 2, want = Math.max(Math.min(D, want0), hardD + (want0 - hardD)*sm(0, FLOOR_OFF, rr - rF)), qx = x - ox, qz = z - oz, cx = FX - qx, cz = FZ - qz;
            const be = wayRound(wway, i*4, ox, oz, pl, cx, cz, rF, R + MR, Dc, Dw, D, dt, fresh), cb = Math.cos(be), sb = Math.sin(be);
            let lo = 0, hi = 0;                                           // the place along the bearing (the part: THE PLACE ALONG A BEARING)
            if (whirlD(qx + cb*pl, qz + sb*pl, R) < want) { const st = (want + 8)/12;
              for (hi = st; hi < want + 8 && whirlD(qx + cb*(pl + hi), qz + sb*(pl + hi), R) < want; hi += st) lo = hi;
              for (let j = 0; j < 12; j++) { const mid = (lo + hi)/2; if (whirlD(qx + cb*(pl + mid), qz + sb*(pl + mid), R) < want) lo = mid; else hi = mid; } }
            let rho = pl + hi;
            { const mc = cb*cx + sb*cz, L2 = cx*cx + cz*cz, disc = mc*mc - L2 + rF*rF;
              if (disc > 0) { const sq = Math.sqrt(disc), r1 = mc - sq, r2 = mc + sq;
                if (L2 < rF*rF) rho = Math.max(rho, r2);
                else if (rho > r1 && rho < r2) rho = pl*pl > L2 - rF*rF ? r2 : Math.max(r1, 0); } }
            x = qx + cb*rho; z = qz + sb*rho;
            { const hb = heavy[1], db = Math.hypot(x - hb.x, z - hb.z), need = Math.min(hb.R + R + 3, Math.hypot(qx + ox - hb.x, qz + oz - hb.z)), rx = Math.hypot(x - FX, z - FZ);   // pushed toward the steel bearing: no nearer its foot than live's own rule keeps it or than it stood (toward the axis by the shortfall, never under its floor)
              if (db < need && rx > 1e-3) { const rn = Math.max(rx - (need - db), Math.min(rx, rF)), ux = (x - FX)/rx, uz = (z - FZ)/rx; let f = 1;
                if (whirlD(FX + ux*rn, FZ + uz*rn, R) < R + MR + 2) { let a = 0, b = 1; for (let j = 0; j < 10; j++) { const mid = (a + b)/2; if (whirlD(FX + ux*(rx + (rn - rx)*mid), FZ + uz*(rx + (rn - rx)*mid), R) < R + MR + 2) b = mid; else a = mid; } f = a; }   // (only as far as our marble keeps its 2 m)
                x = FX + ux*(rx + (rn - rx)*f); z = FZ + uz*(rx + (rn - rx)*f); } }
            if (whirlD(x, z, R) < R + MR + 2) {                           // held at its floor with under 2 m of air: along the floor, away from our marble, to 2 m
              const a0 = Math.atan2(z - FZ, x - FX), rl = Math.max(Math.hypot(x - FX, z - FZ), rF), sg = (x - qx)*-Math.sin(a0) + (z - qz)*Math.cos(a0) >= 0 ? 1 : -1;
              lo = 0; hi = (R + MR + 10)/Math.max(rl, 1);
              for (let j = 0; j < 14; j++) { const mid = (lo + hi)/2, a = a0 + sg*mid; if (whirlD(FX + Math.cos(a)*rl, FZ + Math.sin(a)*rl, R) < R + MR + 2) lo = mid; else hi = mid; }
              x = FX + Math.cos(a0 + sg*hi)*rl; z = FZ + Math.sin(a0 + sg*hi)*rl; }
            { const hb = heavy[1]; if (Math.hypot(x - hb.x, z - hb.z) < hb.R + 2*R + 2) {   // pressed toward the steel bearing: no deeper in it, sphere to sphere, than its own place stood (back toward its own place, as far as our marble keeps its 2 m)
                const hy = style.heightAt(hb.x, hb.z) + hb.R, x0 = qx + ox, z0 = qz + oz, dep = (px, pz) => { style.normalAt(px, pz, N3); return hb.R + R - Math.hypot(px + N3.x*R - hb.x, style.heightAt(px, pz) + N3.y*R - hy, pz + N3.z*R - hb.z); }, lim = Math.max(dep(x0, z0), 0) + 1e-3;
                if (dep(x, z) > lim) { let a = 0, b = 1; for (let j = 0; j < 10; j++) { const mid = (a + b)/2; if (dep(x + (x0 - x)*mid, z + (z0 - z)*mid) > lim) a = mid; else b = mid; }
                  if (whirlD(x + (x0 - x)*b, z + (z0 - z)*b, R) < R + MR + 2) { let l2 = 0, h2 = b; for (let j = 0; j < 10; j++) { const mid = (l2 + h2)/2; if (whirlD(x + (x0 - x)*mid, z + (z0 - z)*mid, R) < R + MR + 2) h2 = mid; else l2 = mid; } b = l2; }
                  x += (x0 - x)*b; z += (z0 - z)*b; } } }
            whirlD(x, z, R); h = wh; } }
        if (tr <= 0) break;
        { const q = i*8, d1 = wlv[q + 6], k = d1 > 0 ? dt/d1 : 0, JA = SWING_AC*Math.pow(pK, 0)*dt*(d1 > 0 ? (dt + d1)/2 : dt); let vx = wlv[q + 3]*k, vy = wlv[q + 4]*k, vz = wlv[q + 5]*k; const vm = Math.hypot(vx, vy, vz), cap = SWING_CAP*pK*dt;
          if (vm > cap) { vx *= cap/vm; vy *= cap/vm; vz *= cap/vm; }   // (a snap of the rule's own is not a speed it was carried at)
          const J = Math.hypot(x + N3.x*R - wlv[q] - vx, h + N3.y*R - wlv[q + 1] - vy, z + N3.z*R - wlv[q + 2] - vz), cs = Math.hypot(x + N3.x*R - wlv[q], h + N3.y*R - wlv[q + 1], z + N3.z*R - wlv[q + 2]);
          // (2: within the allowance and its centre no faster than SWING_VC or than it came: the nearest its wish; 1: within the allowance only: the slowest; 0: the least change)
          const rk = J > JA ? 0 : cs <= Math.max(SWING_VC*pK*dt, Math.min(vm, cap)) ? 2 : 1, sc = rk === 2 ? Math.abs(s - sW) : rk === 1 ? cs : J;
          if (rk > bRk || (rk === bRk && sc < bD)) { bRk = rk; bD = sc; bJ = J; bS = s; bW = tr > SWING_N; bOk = rk > 0; }
          wway[i*4] = wk0; wway[i*4 + 1] = wk1; wway[i*4 + 2] = wk2; wway[i*4 + 3] = wk3;
          if (bW && bRk === 2) tr = 1; } }
        if (nT) { const j = i*9; if (landS && bW && bOk) wsw[j + 1] = 0; wsw[j + 7] = (rr - wasR)/dt; wsw[j + 3] = rr; }
        Q4.setFromAxisAngle(A3.set(0, 1, 0), -ang); Q0.setFromAxisAngle(A3.set(-c, 0, -sn), (-ang*r/m.R) % (Math.PI*2)).multiply(Q4).multiply(m.q);
        whirl.set(i, x + N3.x*R, h + N3.y*R, z + N3.z*R, R, Q0);
        { const q = i*8, c0 = x + N3.x*R, c1 = h + N3.y*R, c2 = z + N3.z*R;
          if (born) wlv[q + 3] = wlv[q + 4] = wlv[q + 5] = wlv[q + 6] = 0;
          else if (dt > 0) { wlv[q + 3] = c0 - wlv[q]; wlv[q + 4] = c1 - wlv[q + 1]; wlv[q + 5] = c2 - wlv[q + 2]; wlv[q + 6] = dt; }
          if (born || dt > 0) { wlv[q] = c0; wlv[q + 1] = c1; wlv[q + 2] = c2; } } }
      Q0.identity(); whirl.commit();
    };
    await ctx.yield();

    // our marble is the world's own, not a thing carried with the lens: through the middle of the flight it runs far ahead,
    // falls back beside us, crosses over (u, lead factor, metres to the left); outside these keys it rolls as it always did
    const MKEY = [[0.28, 1, 0], [0.34, 0.95, -8], [0.40, 0.95, 8], [0.43, 0.8, -8], [0.52, 2.1, -12], [0.61, 0.95, 6], [0.65, 0.75, 3], [0.675, 0.72, -10], [0.70, 1.25, 11], [0.725, 0.9, 1], [0.76, 1, 0], [0.80, 1.9, -16], [0.84, 1, 0]], MK = [1, 0];      // (the cure of the marble's jumps: the table ends on the lead the marble has outside it; it ended on 1.2 and the marble fell back ten metres in one frame)
    const marbleKey = (u) => { MK[0] = 1; MK[1] = 0;
      for (let i = 1; i < MKEY.length; i++) if (u >= MKEY[i - 1][0] && u < MKEY[i][0]) { const a = MKEY[i - 1], b = MKEY[i], t = sm(a[0], b[0], u);
        MK[0] = a[1] + (b[1] - a[1])*t; MK[1] = a[2] + (b[2] - a[2])*t; }
      return MK; };
    const skimAt = (u) => sm(K.whip - 0.05, K.whip - 0.012, u)*(1 - sm(K.whip + 0.005, K.whip + 0.035, u));   // skimming the mirror
    let shake = 0, lastU = 0, V0 = 50, paceRef = null; const GZ = [0, 1], gz3 = new THREE.Vector3(); const AV = [0, 0, 54];   // the plan radius the marble ring keeps from the lens (so the nearest pass whole, under a third of the frame). (It kept 20 m from a point ahead of the lens too, where our marble stood before it had its weave: that is gone, the ring parts for our marble where it stands, see hero.stepAside)
    // a small dip never gathers the ruling so hard that a line folds or kinks: its pull is held under what the stretch the
    // two great wells have already put on the cloth there allows (deep in the great well, a fraction of it)
    const capPull = (x, z, B, a, R) => { const W = U.uWell.value, Bw = U.uWellB.value; let k = 1;
      for (let j = 0; j < 4; j += 3) { const dx = x - W[j].x, dz = z - W[j].y, aa = W[j].w; k *= Math.max(0.05, 1 - Bw[j].x*aa/(dx*dx + dz*dz + aa*aa)); }
      return Math.min(B, 0.62*k*Math.min(1, 5*k*k)*(R*R + a*a)/a); };
    const apply = (dt, time, u) => {
      // (the fifteenth) THE VISITOR'S PACE, reckoned from how fast the route's share runs against the route's own pace; from 0.88
      // to 1.08 of it (where the engine's easing holds a visitor at pace 1 wherever a swing is on) it counts as 1. Outside the
      // band it joins without a step: under it the figure over 0.88, over it the figure over 1.08, so the slider's 0.4 is
      // reckoned 0.455 and its 2.5 as 2.31; never under 0.4 or over 2.5. A visitor at pace 1 is reckoned at another pace in two
      // places: for the first second or two after entry, where the engine still carries the last world's speed (no swing has
      // begun there), and at the end if the next world is not ready, where the engine eases to a stop over the last metres:
      // there the figure falls to 0.4 and the swings come home that much slower.
      { const k = dt > 0 && paceRef && u > paceU ? (u - paceU)/dt*pathLen/(V0*paceRef(u)) : 1; pK = Math.max(0.4, Math.min(2.5, k < 0.88 ? k/0.88 : k > 1.08 ? k/1.08 : 1)); paceU = u; hero.setPace(pK); }
      now = time; lastU = u;
      // the half rule (a 20 m cell) is drawn only where its lines pass under us fewer than three times a second: the family
      // we fly along keeps it at any speed, the family we cross loses it in the fast middle of the flight
      if (paceRef) { const h0 = along(u, 0), v = V0*paceRef(u)/60; U.uHalfK.value.set(1 - sm(0.8, 0.95, Math.abs(h0.tx)*v), 1 - sm(0.8, 0.95, Math.abs(h0.tz)*v), 1 - sm(0.8, 0.95, Math.abs(h0.tx)*v*2), 1 - sm(0.8, 0.95, Math.abs(h0.tz)*v*2)); }
      ripple(u);
      const e = eventAt(u);
      const mk = marbleKey(u), lead = leadAt(u)*(1 + (0.08 + 0.12*Math.sin(u*19 + 1))*sm(0.1, 0.16, u))*mk[0];      // our marble is the world's own: it runs ahead and falls back, and weaves
      // (leaving the well the ring keeps further off, so its marbles are seen whole on the slope ahead)
      { const c0 = along(u, 0); AV[0] = c0.x; AV[1] = c0.z; AV[2] = Math.max(54*(1 - 0.7*sm(25, 50, liftAt(u)))*(1 - 0.5*skimAt(u)), 46*sm(K.whip + 0.03, K.whip + 0.06, u)*(1 - sm(K.fling - 0.04, K.fling - 0.01, u)), 78*sm(K.fling - 0.05, K.fling - 0.005, u)*(1 - sm(K.fling + 0.05, K.fling + 0.09, u)));   // riding high, the ring passes under the lens
        hero.setAvoid(AV); }
      // every dip of the frame is laid before anything is seated on the cloth, so that nothing is seated by a dip of the frame before
      // (and a frame with no step changes nothing): first where each rolling thing stands now, with its dip; then the great well's own
      // (the part: wells 0, 1 and what rides in them); then each pull, and each large ball seated and draped
      const breathe = (i) => 1 + 0.09*Math.sin(time*(1.3 + 0.17*i) + i*2.1);
      style.setWell(3, FX, FZ, FDE, FA, FPULL*(1 + 0.05*Math.sin(time*0.9)));
      for (let i = 0; i < 4; i++) { const b = heavy[i], w = 0.38 + 0.07*i;       // each settles in a slow small circle and its dip goes with it
        b.x = b.hx + 2.6*Math.cos(now*w + i*2.3); b.z = b.hz + 2.6*Math.sin(now*w + i*2.3);
        style.setWell(11 + i, b.x, b.z, b.D, b.a, b.pull, 0, 0); }
      for (let i = 0; i < 6; i++) { const s0 = stills[i], w = 0.45 + 0.09*i, a = now*w + i*1.7;
        if (i === 1) { const oa = orbitC + 1.7*Math.sin(orbit0 + now*0.062); s0.x = FX + Math.cos(oa)*GOLF_ORBIT; s0.z = FZ + Math.sin(oa)*GOLF_ORBIT; }   // this one rolls: up the far rim of the funnel, back down and up the other side
        else if (i === 0) { const k = 1 - roll2(u, s0); s0.x += 3.5*Math.cos(a)*k; s0.z += 3.5*Math.sin(a)*k; }   // this one rolls in late, over the lip and down the wall
        else { s0.x = s0.hx + 3.5*Math.cos(a); s0.z = s0.hz + 3.5*Math.sin(a); }
        rollBy(s0.q, s0.prev, s0.x, s0.z, GR);
        style.setWell(5 + i, s0.x, s0.z, GD, 30, i === 4 ? PULL_GATE : PULL_G); }
      const c = companionAt(u), present = sm(0, 0.03, e), on = e <= 0.001;
      style.setWell(4, c.x, c.z, GD*(1 - present), 30, PULL_G*(1 - present));
      const pl = planetAt(u);
      style.setWell(2, pl.x, pl.z, PD, 60, PULL_P, 0, 0);
      hero.setEvent(e); hero.update(dt, time + 0.3);                    // wells 0, 1 and shadow balls 0, 1
      { const w1 = U.uWell.value[1]; U.uWellB.value[1].x = capPull(w1.x, w1.y, U.uWellB.value[1].x, 30, GR); }   // (the ball that fell in)
      U.uWellB.value[0].w = sm(0.65, 1, e);                       // the well that has taken more weight pulls folds down its wall
      U.uWellB.value[0].x += 4*Math.sin(time*1.15) + 1.5*Math.sin(time*2.9 + 1);   // the tension never quite settles: the ruling slides in and out
      for (let i = 0; i < 4; i++) { const b = heavy[i], w = 0.38 + 0.07*i;
        b.y = style.heightAt(b.x, b.z) + b.R;
        style.setWell(11 + i, b.x, b.z, b.D, b.a, capPull(b.x, b.z, b.pull*breathe(11 + i), b.a, b.R), b.R, b.y);
        style.setBall(8 + i, b.x, b.y, b.z, b.R);
        b.mesh.position.set(b.x, b.y, b.z);
        Q4.setFromAxisAngle(A3.set(Math.sin(now*w + i*2.3), 0, -Math.cos(now*w + i*2.3)), 2.6/b.R*Math.sin(now*w*0.5)); b.mesh.quaternion.copy(Q4).multiply(b.q0); }
      for (let i = 0; i < 6; i++) { const s0 = stills[i]; style.setWell(5 + i, s0.x, s0.z, GD, 30, capPull(s0.x, s0.z, (i === 4 ? PULL_GATE : PULL_G)*breathe(i), 30, GR)); }
      // the golf ball beside us: it carries its dip, its smudge and its shadow, and hands over to the one that falls
      style.setWell(4, c.x, c.z, GD*(1 - present), 30, capPull(c.x, c.z, PULL_G*(1 - present)*breathe(7), 30, GR));
      // the planet: seated in its dip; from K.roll0 it rolls and the dip goes with it
      const ph = style.heightAt(pl.x, pl.z) + PR;
      style.setWell(2, pl.x, pl.z, PD, 60, capPull(pl.x, pl.z, PULL_P*breathe(9), 60, PR), PR, ph);
      planet.position.set(pl.x, ph, pl.z);
      planet.quaternion.setFromAxisAngle(planetAxis, pl.s/PR).multiply(planetQ0);
      style.setBall(2, pl.x, ph, pl.z, PR);
      // golf balls
      seat(c.x, c.z, GR, T3); rollBy(companionQ, companionPrev, c.x, c.z, GR);
      style.setBall(3, T3.x, T3.y, T3.z, on ? GR : 0);
      M4.compose(T3, companionQ, S1.setScalar(on ? 1 : 1e-5)); golf.setMatrixAt(0, M4); S1.setScalar(1);
      for (let k = 0, nh = 1, nl = 0; k < 6; k++) { const s = stills[stillOrder[k]]; seat(s.x, s.z, GR, T3);
        M4.compose(T3, s.q, S1); if (nearStill.has(stillOrder[k])) golf.setMatrixAt(nh++, M4); else golfFar.setMatrixAt(nl++, M4);
        if (k < 4) style.setBall(4 + k, T3.x, T3.y, T3.z, GR); else farStrips.set(k - 4, T3.x, T3.y, T3.z, GR, Q0); }
      golf.instanceMatrix.needsUpdate = golfFar.instanceMatrix.needsUpdate = true; farStrips.commit();
      // our marble: 40 m ahead on the cloth; at the end it reaches the brass first and circles it like a coin in a funnel
      const a = alongE(u, lead), w = sm(K.dive - 0.1, K.dive - 0.05, u), ang = 2.2 - time*1.25;
      const inWhip = sm(K.whip - 0.03, K.whip, u)*(1 - sm(K.fling, K.fling + 0.03, u));
      const wv = (2.2*Math.sin(time*0.8) + ((13 - 5*inWhip)*Math.sin(u*31 + 2) - 4*inWhip)*sm(0.07, 0.11, u)*(1 - 0.65*sm(0.28, 0.32, u)*(1 - sm(0.82, 0.86, u))) + mk[1])*(1 - w);   // drawn a little toward each dip it passes; in the whip it keeps off the ball
      MP[0] = a.x + a.tz*wv + (FX + Math.cos(ang)*50 - a.x)*w; MP[1] = a.z - a.tx*wv + (FZ + Math.sin(ang)*50 - a.z)*w;
      marbleClear(AX + heroGolf.position.x, heroGolf.position.y, AZ + heroGolf.position.z, GR); marbleClear(planet.position.x, planet.position.y, planet.position.z, PR);
      const mx = MP[0], mz = MP[1];
      seat(mx, mz, MR, T3); rollBy(oursQ, oursPrev, mx, mz, MR);
      Q4.setFromAxisAngle(A3.set(0, 1, 0), time*0.6).multiply(oursQ);     // the vane keeps turning
      ours.set(0, T3.x, T3.y, T3.z, MR, Q4); ours.commit(); hero.setMirror(T3.x, T3.y, T3.z, MR);
      OM[0] = T3.x; OM[1] = T3.y; OM[2] = T3.z; hero.stepAside(T3.x, T3.y, T3.z, MR, dt, time);   // the ring's marbles part for it; the whirlpool's below
      whirlAt(time, dt);
      // the lacing trembles when something heavy moves
      const moving = Math.max(sm(K.roll0, K.roll0 + 0.02, u)*(1 - sm(K.roll0 + 0.2, K.roll0 + 0.3, u)), sm(0.6, 0.7, e)*(1 - sm(0.97, 1, e)) + (e >= 1 ? 0 : 0));
      shake += (moving - shake)*Math.min(1, dt*3); laceMat.uniforms.uShake.value = shake;
      lastU = u;
    };
    apply(0, 0, 0);
    await ctx.yield();

    const WALL_AHEAD = 100, WALL_OUT = 0, WALL_DROP = 12, wall3 = new THREE.Vector3();
    const bowl = new THREE.Vector3(AX, -50, AZ), bowl2 = bowl.clone(), comp3 = new THREE.Vector3(), ahead3 = new THREE.Vector3(), golf3 = new THREE.Vector3(), AL2 = { x: 0, z: 0, tx: 0, tz: 1 };
    const kLip = K.lip, kWhip = K.whip, kFling = K.fling, kDive = K.dive, kOut = K.out;
    const paceAt = (u) => 0.5 + 0.06*sm(0.03, 0.14, u) - 0.13*sm(0.06, 0.1, u)*(1 - sm(kLip + 0.02, kLip + 0.08, u)) + 0.5*sm(kLip + 0.03, kWhip, u) - 0.34*sm(kFling, kOut + 0.06, u) - 0.2*sm(kDive - 0.08, kDive + 0.02, u);
    { let I = 0; for (let i = 0; i < 200; i++) I += 1/paceAt((i + 0.5)/200)/200; V0 = pathLen*I/50; }   // metres a second per unit of pace
    paceRef = paceAt;
    const seatSide = new THREE.Vector2(PTX - FX, PTZ - FZ).normalize();   // in the last turn the gaze lifts a little and turns from the planet's side, so no rim ball is cut by the frame's corner
    const seatP = path.end.clone(), seat3 = new THREE.Vector3(), seat4 = new THREE.Vector3(), eye3 = new THREE.Vector3(), shoulder3 = new THREE.Vector3(AX - 22, -43, AZ + 21);
    return {
      scene, path, duration: 50,
      pace: paceAt,
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 34, sway: 0.35, bank: 0.6 },
      pois: [
        { at: new THREE.Vector3(PX + 22, 20, PZ + 20), from: 0.0, to: 0.075, weight: 0.32 },
        { at: new THREE.Vector3(PX - 12, 18, PZ - 9), from: -0.04, to: 0.05, weight: 0.85, fade: 0.33 },   // the entry: the planet ball's seam and stitches large, the ball cut by no side edge
        { at: (time, u) => { const uu = u ?? lastU, c = companionAt(uu), a = along(uu, 80, AL2), x = a.x + (c.x - a.x)*0.35, z = a.z + (c.z - a.z)*0.35;
            return comp3.set(x, style.heightAt(x, z) - 16*(1 - sm(0.1, 0.15, uu)), z); }, from: 0.035, to: kLip - 0.02, weight: 0.7, fade: 0.2 },   // the crossing: eyes on the ruled cloth ahead, a little toward the golf ball
        { at: (time, u) => bowl.set(AX, -50 - 45*sm(0.65, 1, eventAt(u ?? lastU)), AZ), from: kLip - 0.085, to: kLip + 0.07, weight: 0.75, fade: 0.2 },   // the crane up to the crest: eyes on the dome, then on the whole well
        { at: (time, u) => bowl2.set(AX, -22 - 45*sm(0.65, 1, eventAt(u ?? lastU)), AZ), from: kLip - 0.04, to: kWhip - 0.01, weight: 0.58 },
        { at: shoulder3, from: kLip + 0.04, to: kWhip - 0.035, weight: 0.7, fade: 0.35 },   // the dive at the ball's shoulder: the whole mirror in frame, its crown under the top edge, marbles streaming under at the right
        // the whip: eyes off the ball and onto the well's wall ahead, the ruled cloth climbing to the lip, our marble in front of it
        { at: (time, u) => { const uu = u ?? lastU, a = along(uu, WALL_AHEAD, AL2), ox = a.x - AX, oz = a.z - AZ, ol = Math.hypot(ox, oz) || 1, sk = skimAt(uu), wo = WALL_OUT - 45*sm(kWhip - 0.015, kWhip + 0.03, uu)*(1 - sm(kWhip + 0.04, kWhip + 0.08, uu)) - 30*sk, x = a.x + ox/ol*wo, z = a.z + oz/ol*wo, c = along(uu, 0, AL2);   // (as the course swings out, the gaze stays in toward the ball, so its limb and the window on it keep in frame)
            const kB = sm(kWhip + 0.012, kWhip + 0.045, uu)*(1 - sm(kWhip + 0.12, kWhip + 0.16, uu)), cy = -50 - 45*sm(0.65, 1, eventAt(uu));   // swung out and up the wall, the gaze turns to the ball: whole in its well, the ring circling it
            const wy = style.heightAt(c.x, c.z) - WALL_DROP + 9*sk + 0.9*Math.max(0, liftAt(uu) - 9.5), bx = AX + c.tx*30, bz = AZ + c.tz*30;
            return wall3.set(x + (bx - x)*kB, wy + (cy - 6 - wy)*kB, z + (bz - z)*kB); }, from: kWhip - 0.09, to: kFling - 0.06, weight: 0.82, fade: 0.2 },
        { at: () => { const gx = heroGolf.position.x, gz = heroGolf.position.z, gl = Math.hypot(gx, gz) || 1; return golf3.set(AX + gx + gx/gl*GOLF_GAZE, heroGolf.position.y - 8, AZ + gz + gz/gl*GOLF_GAZE); }, from: kFling - 0.15, to: kFling - 0.03, weight: 0.72, fade: 0.3 },   // the ball that fell in, lodged against the bowling ball, as we lift off the wall
        { at: (time, u) => { const uu = u ?? lastU, a = along(uu, 62 - 22*sm(kFling + 0.005, kFling + 0.05, uu), AL2), off = 34*(1 - sm(kFling + 0.01, kFling + 0.07, uu)), x = a.x - a.tz*off, z = a.z + a.tx*off;   // (at first a little to the right, off the shadows the well's balls throw ahead of us)
            const bump = sm(kFling - 0.065, kFling - 0.03, uu)*(1 - sm(kFling + 0.02, kFling + 0.045, uu));   // leaving the well the gaze comes up to level and a little over: the rolling ball whole, the window's light behind it
            const base = Math.max(style.heightAt(x, z) + 13*bump, path.pointAt(Math.min(1, Math.max(0, uu)), eye3).y - 90 + 99*bump) - 3*sm(kFling + 0.04, kFling + 0.1, uu) - 5*sm(kFling + 0.03, kFling + 0.05, uu)*(1 - sm(kFling + 0.055, kFling + 0.08, uu));
            const kG = sm(kOut - 0.09, kOut - 0.05, uu), c0 = along(uu, 0, AL2);   // through the gate the gaze is level, not down into the saddle between the two dips: the balls stand whole either side
            return ahead3.set(x, base + (style.heightAt(c0.x, c0.z) + LOW + 2 - 6*sm(kOut - 0.035, kOut - 0.01, uu) - base)*kG, z); }, from: kFling - 0.06, to: kOut + 0.03, weight: 0.85, fade: 0.12 },   // climbing out: eyes on the ruled slope and the lip coming down
        { at: (time, u) => { const uu = u ?? lastU, k = sm(0.9, 0.94, uu), k2 = k*(1 - sm(0.945, 0.975, uu));   // (through the gate the gaze is level; in the last turn it rests a little over the brass, so the plate lies whole in the lower half, and comes down onto it)
            return seat3.set(seatP.x - seatSide.x*4*k, seatP.y - 60*(1 - sm(kOut + 0.04, kOut + 0.12, uu))*sm(kOut - 0.005, kOut + 0.04, uu) + 20*k2, seatP.z - seatSide.y*4*k); }, from: kOut - 0.04, to: 1, weight: 0.8 },
        { at: (time, u) => { const uu = u ?? lastU; return seat4.set(seatP.x, seatP.y + 20*(1 - sm(0.945, 0.975, uu)), seatP.z); }, from: 0.88, to: 1.12, weight: 0.85, fade: 0.2 },   // the same, held to the end of the turn   // the brass; from far off the gaze dips a little under it so the sheet fills the frame
      ],
      portal: { shape: 'circle', radius: 10, color: '#' + P.brass.getHexString(), glow: 0.35, tilt: true, revealDistance: 260 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      debug: { style, K, heavy, plan, get len() { return pathLen; },
        things() { const out = [], o = new THREE.Vector3(); const t = (n, x, y, z, R) => out.push([n, x, y, z, R]);   // where every ball stands now (for framing checks)
          t('marble', T3.x, T3.y, T3.z, MR); t('plum', AX, U.uWellB.value[0].z, AZ, 90); t('lodged', AX + heroGolf.position.x, heroGolf.position.y, AZ + heroGolf.position.z, GR);
          for (const b of heavy) t(b.kind, b.x, b.y, b.z, b.R); t('planet', planet.position.x, planet.position.y, planet.position.z, PR);
          for (let k = 0; k < 6; k++) { seat(stills[k].x, stills[k].z, GR, o); t('golf' + k, o.x, o.y, o.z, GR); }
          t('plate', FX, style.heightAt(FX + 20, FZ), FZ, 42); t('grommet', seatP.x, seatP.y, seatP.z, 12); return out; },
        clearance(u0 = 0.55, u1 = 0.86, n = 63) { const out = [], c = new THREE.Vector3(), o = new THREE.Vector3();
        for (let i = 0; i <= n; i++) { const u = u0 + (u1 - u0)*i/n; apply(0, 20, u); path.pointAt(u, c); let best = 1e9, who = '';
          const t = (name, x, y, z, R) => { const d = Math.hypot(c.x - x, c.y - y, c.z - z) - R; if (d < best) { best = d; who = name; } };
          const mX = T3.x, mY = T3.y, mZ = T3.z; let mb = 1e9, mw = '';
          const t2 = (name, x, y, z, R) => { t(name, x, y, z, R); const d = Math.hypot(mX - x, mY - y, mZ - z) - R - MR; if (d < mb) { mb = d; mw = name; } };
          for (const b of heavy) t2(b.kind, b.x, b.y, b.z, b.R); t2('planet', planet.position.x, planet.position.y, planet.position.z, PR); t2('lodged', AX + heroGolf.position.x, heroGolf.position.y, AZ + heroGolf.position.z, GR); t('marble', mX, mY, mZ, MR);
          for (let k = 0; k < 6; k++) { seat(stills[k].x, stills[k].z, GR, o); t2('golf' + k, o.x, o.y, o.z, GR); }
          const a = along(u, 0); t('cloth', c.x, style.heightAt(a.x, a.z) - 1e3, c.z, 1e3);
          out.push([+u.toFixed(3), who, +best.toFixed(1), +liftAt(u).toFixed(1), mw, +mb.toFixed(1)]); }
        return out; } },
      update(dt, time, camera, u) { style.update(dt, time, camera);
        if (camera) { camera.getWorldDirection(gz3); const gl = Math.hypot(gz3.x, gz3.z); if (gl > 1e-3) { GZ[0] = gz3.x/gl; GZ[1] = gz3.z/gl; } } apply(Math.min(dt, 0.1), time, u || 0); },
      dispose() {},
    };
  },
};
