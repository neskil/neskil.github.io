// Sky Through the Bone: after Georgia O'Keeffe. A bleached back bone as large as the country, flat turquoise through
// the hole in it, red and ochre hills folded like cloth, ranks of flat oval clouds seen from above, a door in an adobe wall.
// Everything is unlit: each form is one hue read off a ramp by a fold coordinate baked into it, cut into 8 soft bands that
// slide (the medium's own motion). post is flat: every colour is written as its hex, no tone map and no inverse.
// Course +Z. Looking along +Z, starboard is -X and port is +X.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, PALETTE, RAMPS, okUniforms, okMaterial, okFlatMaterial, okLineMaterial, okHoleMaterial,
  buildBoneGeometry, sutureRibbons, holeDecals, F, STYLE_GLSL,
} from '../parts/sky-through-the-bone.js';

const DEG = Math.PI / 180;
const HERO_Z = 700, RIDGE_Y = 30, WASH_END = 390, WALL_Z = 1190, RIB_Z = 1165, RING_Z = 46, ENTRY_Y = 46, WASH_Y = 14, END_Y = 9, LEVEL_Z = 1080;   // (LEVEL_Z: where the route comes to END_Y and the level run begins, 110 m before the wall)
const col = (h) => new THREE.Color(h);
const mixc = (a, b, t) => col(a).lerp(col(b), t);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export default {
  id: 'sky-through-the-bone',
  name: 'Sky Through the Bone',
  category: 'artists',
  placeKind: 'wilderness',
  after: "Georgia O'Keeffe, 1887 to 1986",
  weirdness: 0.45,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), vary = ctx.vary || {};
    const scene = new THREE.Scene();
    const lookRng = rng.fork('look'), propRng = rng.fork('props'), birdRng = rng.fork('birds');
    // The seeded look: 0 August morning, 1 the grey hills, 2 first snow; dusk when the visit asks for night.
    const lr = lookRng();
    const look = lr < 0.4 ? 0 : lr < 0.7 ? 1 : 2;
    const dusk = vary.hour === 'night';
    const rare = !!vary.rare;
    const P = PALETTE, [SKY, WHITE, LAV, RED, OCHRE, GW, VB] = P;
    const heroPal = dusk ? [VB, WHITE, LAV, RED, OCHRE, SKY, VB] : P;      // the holes paint the same sky as the dome
    const R = RAMPS(P);
    scene.background = col(dusk ? VB : SKY);

    // ---------------------------------------------------------------- the hero, turned 30 degrees to port
    // (the bore's own stream, made from the seed alone: its first draw is where round the bore the first white line
    // stands at the near rim, in turns; its second sets the three swells' shares of the round, by the part's one rule.
    // Both are taken before the bone is built or anything is asked of it)
    const boreRng = ctx.core.makeRng(ctx.core.hashSeed('boreband:' + ctx.seed)), boreStart = boreRng(), boreShares = boreRng();
    const hero = await buildHero(ctx, { palette: heroPal, detail, drivePhase: false, boreStart, boreShares });
    // Every fork of the world, in one fixed list, before any loop of the world runs. (look, props and birds are forked
    // before the hero is built and the rest after it: the part draws the bone's own shape from ctx.rng between them, so
    // these streams are forked after the parent's last draw there.) Each loop below deals from its own stream, whatever
    // the others draw. The ten ravens by the hero have a stream of their own, made from the seed alone: their places are
    // tried against the route, and no other deal hangs on how many tries that takes.
    const markRng = rng.fork('marks'), stoneRng = rng.fork('stones'), sageRng = rng.fork('sage'), snagRng = rng.fork('snags'), threadRng = rng.fork('threads');
    const ribMarkRng = rng.fork('ribMarks'), castRng = rng.fork('cast'), bandRng = rng.fork('bands'), heroRavenRng = ctx.core.makeRng(ctx.core.hashSeed('heroRavens:' + ctx.seed));
    // (streams made from their name and the seed alone, each for one thing: the basin's shares of stones, sage and snags,
    // and the snag at the climb's foot)
    const ownRng = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const basinStoneRng = ownRng('basinStones'), basinSageRng = ownRng('basinSage'), basinSnagRng = ownRng('basinSnags'), climbSnagRng = ownRng('climbSnag');
    hero.object.position.set(0, RIDGE_Y, HERO_Z);
    hero.object.rotation.y = Math.PI - 30 * DEG;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    // The bones' bands are one swell: across a fold the tone goes one way, light to dark, in eight bands. The slide is the
    // design's 0.06 on every bone (BONE_SLIDE: it moves a band's edge by about half a band and makes no band of its
    // own), in the bore as outside it, and the near term (a second travelling sine) has no amplitude on any of them
    // (uNear's first number is 0; its third is still the reach over which the near stretch of the fold coordinate, uDeep, eases off).
    const BONE_SLIDE = 0.06;
    const whiten = (geo, k) => { const a = geo.attributes.aC; if (!a) return; for (let i = 0; i < a.count; i++) a.array[i] = Math.pow(a.array[i], k); a.needsUpdate = true; };
    hero.object.traverse((o) => { if (o.isMesh && (o.name === 'backBone' || o.name === 'brokenTip')) { whiten(o.geometry, 1.3); o.material.uniforms.uBoreK.value = 1.3; o.material.uniforms.uAmp.value = BONE_SLIDE; o.material.uniforms.uBoreAmp.value = BONE_SLIDE; o.material.uniforms.uNear.value.set(0, 3.0, 220); o.material.uniforms.uDeep.value.set(0.85, 0.3); } });
    await ctx.yield();
    const heroInv = hero.object.matrixWorld.clone().invert(), _l = new THREE.Vector3();
    const heroDist = (x, y, z) => { _l.set(x, y, z).applyMatrix4(heroInv); return hero.fieldAll(_l.x, _l.y, _l.z); };
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const canalIn = toWorld(hero.anchors.canalIn), canalOut = toWorld(hero.anchors.canalOut);
    const axisW = canalOut.clone().sub(canalIn).normalize();
    // ---------------------------------------------------------------- the route
    // Wash and drop are typed world places. The close pass between them is laid from the bone's own geometry (the bone
    // differs a little with the seed): up the ridge on a swing out to starboard, in under the snapped tip, along the
    // underside of the starboard blade 10 m off its surface for PASS_MIN metres of the blade's own line (past the strut
    // that hangs under it), then in one S, to port across the hero's face and round to starboard, onto the canal's own
    // centre line: the bore is flown on its axis.
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), DOWN = V3(0, -1, 0), LEVEL_IN = 8;
    const bladeW = hero.anchors.bladeUnder.map((b) => ({ p: toWorld(b.p), n: b.n.clone().transformDirection(hero.object.matrixWorld), t: b.t.clone().transformDirection(hero.object.matrixWorld) })), bladeS = [0];
    for (let i = 1; i < bladeW.length; i++) bladeS.push(bladeS[i - 1] + bladeW[i].p.distanceTo(bladeW[i - 1].p));
    const bladeAt = (s, out) => {                              // the underside's centre line, s metres in from the break
      let i = 0; while (i < bladeW.length - 2 && bladeS[i + 1] < s) i++;
      const f = clamp((s - bladeS[i]) / Math.max(bladeS[i + 1] - bladeS[i], 1e-3), 0, 1), a = bladeW[i], b = bladeW[i + 1];
      out.p.copy(a.p).lerp(b.p, f); out.n.copy(a.n).lerp(b.n, f).normalize(); out.t.copy(a.t).lerp(b.t, f).normalize(); return out;
    };
    // the eye's place under station s: off the surface along its normal turned half way to straight down (so the blade is
    // over the eye, not beside it), at CLEAR metres from every bone by the hero's own distance function
    const CLEAR = 10.2;                                          // the stations are laid this far from the bone; the line is then faired in space (below), which keeps the bone at 10 m or more for the whole pass and, where the surface at 10.2 m has a crease, stands the eye up to a metre further off (never nearer)
    const _st = { p: V3(), n: V3(), t: V3() }, _dir = V3();
    const underBlade = (s, out, plumb) => {                       // (plumb: straight down from the line, not along the turned normal)
      bladeAt(s, _st); if (plumb) _dir.copy(DOWN); else _dir.copy(_st.n).add(DOWN).normalize(); let c = CLEAR;
      for (let it = 0; it < 24; it++) { out.copy(_st.p).addScaledVector(_dir, c); const d = heroDist(out.x, out.y, out.z); if (Math.abs(d - CLEAR) < 0.05) break; c += (CLEAR - d) * 0.8; }
      out.off = c; return out;
    };
    // the pass begins 6 m in from the break (inside the 9 m the open cells reach into the tip, so the first station
    // stands under the cells themselves; nearer the break than 6 m the blade's line has no surface under it), with
    // stations PASS_STEP apart (2 m), and runs in PASS_MIN metres of the blade's line, or as far as the station where
    // the strut under the blade is nearest (where the eye, held CLEAR off every bone, stands furthest from the blade's
    // own line) if that is further in. On every seed measured (1 to 40) the strut's station is the nearer of the two,
    // so the pass is PASS_MIN long and ends past the strut: the run under the blade is never shorter than 60 m of route
    // (PASS_MIN is 66: the taut line drawn below is 61.7 to 66.5 m long on those seeds)
    const PASS_IN = 6, PASS_STEP = 2, PASS_MIN = 66;
    let passOut = PASS_IN + 24;
    { const e = V3(); let best = 0; for (let s = PASS_IN + 24; s <= 100; s += 2) { underBlade(s, e); if (e.off > best) { best = e.off; passOut = s; } if (s % 8 === 0) await ctx.yield(); } }
    passOut = Math.min(Math.max(passOut, PASS_IN + PASS_MIN), bladeS[bladeS.length - 1]);
    const nPass = Math.max(Math.round((passOut - PASS_IN) / PASS_STEP), 1) + 1, pass = [];
    for (let i = 0; i < nPass; i++) pass.push(underBlade(lerp(PASS_IN, passOut, i / (nPass - 1)), V3()).clone());
    // between its first and last station (the first stands straight under the blade's line) the pass is drawn taut on
    // the surface that lies CLEAR from the bone: each station in turn is moved half way to the middle of its two
    // neighbours and set back on that surface along the field's gradient, until the line is the smooth shortest one
    // there (no station is placed by hand)
    underBlade(PASS_IN, pass[0], true);
    { const g = V3(), e = 0.6;
      for (let it = 0; it < 60; it++) {
        for (let i = 1; i < nPass - 1; i++) {
          const q = pass[i]; q.multiplyScalar(0.5).addScaledVector(pass[i - 1], 0.25).addScaledVector(pass[i + 1], 0.25);
          const d = heroDist(q.x, q.y, q.z); g.set(heroDist(q.x + e, q.y, q.z) - d, heroDist(q.x, q.y + e, q.z) - d, heroDist(q.x, q.y, q.z + e) - d); if (g.lengthSq() > 1e-8) q.addScaledVector(g.normalize(), CLEAR - d);
        }
        if (it % 4 === 3) await ctx.yield();
      } }
    await ctx.yield();
    // in under the tip: the last 34 m before the first station (one and a half times the camera's look-ahead) run along
    // the pass's own heading over its first LEAD_HEAD metres (no corner in plan where the pass begins), rising 15
    // degrees, so the break's open cells pass over the eye as the pass begins
    const LEAD_IN = 34, LEAD_DEG = 15, washEnd = V3(-3, 17, 396);
    const LEAD_HEAD = 8, iLead = Math.min(Math.round(LEAD_HEAD / PASS_STEP), nPass - 1);
    const hIn = V3(pass[iLead].x - pass[0].x, 0, pass[iLead].z - pass[0].z).normalize(), leadIn = pass[0].clone().addScaledVector(hIn, -LEAD_IN); leadIn.y -= LEAD_IN * Math.tan(LEAD_DEG * DEG);
    // (its points stand FAIR_STEP apart on the straight from the lead-in point to the first station; the fairing below
    // bends its end over into the pass's own slope)
    const R_SPACE = 18, FAIR_STEP = 2, FAIR_ROUNDS = 40, FAIR_LAST = 60, FAIR_SWEEPS = 12, FAIR_NEAR = 4, CLEAR_MIN = 10.12, CLEAR_MID = 10.15, leadPts = [];
    { const n = Math.round(LEAD_IN / FAIR_STEP); for (let i = 1; i < n; i++) leadPts.push(leadIn.clone().lerp(pass[0], i / n)); }
    // the climb from the wash's end to that point, laid by one rule in plan and one in height. In height: the slope
    // grows evenly from the wash's level to CLIMB_DEG over the first CLIMB_EASE metres, holds it, and over the last
    // CLIMB_EASE metres eases evenly to the lead-in's own 15 degrees. CLIMB_DEG is 34: the curve between two points
    // adds up to half a degree, and the design's limit is 35. In plan: on up the wash's own heading (+Z) for a metres, a turn
    // to starboard of radius R, a straight of b metres, a turn back to port of the same radius onto the blade's own
    // heading, and c metres straight into the lead-in in the blade's own upright plane (so the bone ahead only
    // nears). For a given a and R, the swing angle, b and c are the three that close the plan between the two named
    // points at the length the slope asks. The plan is searched so that one is found on every seed: R from CLIMB_R
    // (the radius of the route's other turn) down in steps of CLIMB_R_STEP, and for each R the first leg a from none
    // up to CLIMB_A_MOST in steps of CLIMB_A_STEP; the first plan on which the eye, tested every 2.5 m by the hero's
    // own distance function, is never farther from the bone than it has been (by 2 cm) is taken. If no plan at a
    // radius is so, the next radius is tried, down to CLIMB_R_LEAST, and the plan on which the bone distance grows
    // least is kept; below CLIMB_R_LEAST a radius is tried only while no plan has closed at all.
    // The curve's points stand CLIMB_STEP metres apart along that plan.
    const CLIMB_R = 32, CLIMB_R_STEP = 2, CLIMB_R_LEAST = 20, CLIMB_A_STEP = 6, CLIMB_A_MOST = 96, CLIMB_DEG = 34, CLIMB_EASE = 24, CLIMB_STEP = 12;   // (the ease a little over one look-ahead of the camera, the points' step half of it)
    const climbRise = leadIn.y - washEnd.y, climbT = Math.tan(CLIMB_DEG * DEG), leadT = Math.tan(LEAD_DEG * DEG), climbRun = climbRise / climbT + CLIMB_EASE / 2 + (1 - leadT / climbT) * CLIMB_EASE / 2;
    const thIn = Math.atan2(-hIn.x, hIn.z);                    // (headings are measured from +Z, to starboard positive)
    const climbLegs = (th, a, R) => {                          // the two straights that close the plan for a first leg of a, a swing of th and turns of radius R
      const s = -(leadIn.x - washEnd.x) - R * (1 - 2 * Math.cos(th) + Math.cos(thIn)), z = leadIn.z - washEnd.z - a - R * (2 * Math.sin(th) - Math.sin(thIn));
      const det = Math.sin(th) * Math.cos(thIn) - Math.sin(thIn) * Math.cos(th), b = (s * Math.cos(thIn) - z * Math.sin(thIn)) / det, c = (z * Math.sin(th) - s * Math.cos(th)) / det;
      return { th, a, b, c, R, len: a + b + c + R * (2 * th - thIn) };
    };
    let climbPlan = null, climbGrow = 0;                      // (climbGrow: the most the bone distance stands above its least so far on the chosen plan, metres)
    // the plan and the height at a run of r metres from the wash's end
    const climbAt = (r, out) => {
      const { th, a, b, len, R } = climbPlan, r1 = a + R * th, r2 = r1 + b, r3 = r2 + R * (th - thIn);
      let x = washEnd.x, z = washEnd.z + Math.min(r, a);
      if (r > a) { const h = Math.min((r - a) / R, th); x -= R * (1 - Math.cos(h)); z += R * Math.sin(h); }
      if (r > r1) { const m = Math.min(r, r2) - r1; x -= Math.sin(th) * m; z += Math.cos(th) * m; }
      if (r > r2) { const h = th - Math.min((r - r2) / R, th - thIn); x -= R * (Math.cos(h) - Math.cos(th)); z += R * (Math.sin(th) - Math.sin(h)); }
      if (r > r3) { x += hIn.x * (r - r3); z += hIn.z * (r - r3); }
      const E = CLIMB_EASE, e = Math.min(r, E), f = Math.max(r - (len - E), 0), k = 1 - leadT / climbT;   // (the height: the slope's sum, as a share of its sum over the whole plan)
      return out.set(x, washEnd.y + climbRise * (e * e / (2 * E) + r - e - k * f * f / (2 * E)) / (len - E / 2 - k * E / 2), z);
    };
    { let best = null, bestGrow = 1e9; const e = V3();
      for (let R = CLIMB_R; R >= CLIMB_R_STEP && (!best || (bestGrow >= 0.02 && R >= CLIMB_R_LEAST)); R -= CLIMB_R_STEP) {
        for (let a = 0; a <= CLIMB_A_MOST; a += CLIMB_A_STEP) {
          let lo = 50 * DEG, hi = 150 * DEG; for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; if (climbLegs(m, a, R).len < climbRun) lo = m; else hi = m; }
          climbPlan = climbLegs((lo + hi) / 2, a, R);
          if (climbPlan.b < 0 || climbPlan.c < 0 || Math.abs(climbPlan.len - climbRun) > 0.5) continue;      // (no plan of this shape closes at this a and this radius)
          let least = 1e9, grow = 0; for (let r = 0; r <= climbPlan.len; r += 2.5) { climbAt(r, e); const d = heroDist(e.x, e.y, e.z); least = Math.min(least, d); grow = Math.max(grow, d - least); }
          if (grow < bestGrow) { bestGrow = grow; best = climbPlan; }
          if (grow < 0.02) break;
          await ctx.yield();
        }
      }
      // (never without a plan: if none of that shape closes at any radius, the plan is the straight line between the two
      // points, flown at whatever slope its length gives)
      if (!best) { const dx = leadIn.x - washEnd.x, dz = leadIn.z - washEnd.z; best = { th: Math.atan2(-dx, dz), a: 0, b: Math.hypot(dx, dz), c: 0, R: 1e-6, len: Math.hypot(dx, dz) }; }
      climbPlan = best; climbGrow = bestGrow; }
    const climb = [];
    { const n = Math.max(Math.round(climbPlan.len / CLIMB_STEP), 2); for (let i = 1; i < n; i++) climb.push(climbAt(climbPlan.len * i / n, V3()));
      // (two more points of the same plan, 6 m and 2 m before the lead-in point: the points beyond it stand 2 m apart, and
      // a curve drawn through points 12 m apart and then 2 m apart would turn sharply at the join)
      for (const back of [3 * FAIR_STEP, FAIR_STEP]) climb.push(climbAt(climbPlan.len - back, V3())); }
    // onto the canal's centre line: a turn to starboard laid on a circle of TURN_R (34 m: the curve through its points,
    // measured over 12 m of route as the first mend measured it, is then nowhere tighter than 32 m; the bank is over
    // when it ends), tangent to the axis RUN_IN before the mouth (40 m: the turn is finished, within 2 degrees of the
    // axis, 30 m and more before the near rim, and the bore is entered straight).
    const TURN_R = 34, RUN_IN = 40, axisH = V3(axisW.x, 0, axisW.z).normalize(), stbH = V3(-axisH.z, 0, axisH.x), axisRise = axisW.y / Math.hypot(axisW.x, axisW.z);   // (axisRise: the bore's own slope, metres up for a metre along)
    const runIn = canalIn.clone().addScaledVector(axisW, -RUN_IN), turnC = runIn.clone().addScaledVector(stbH, TURN_R), lastPass = pass[nPass - 1];
    // the crossing from the blade's end to that turn is one bend to port that runs straight into the turn: one S, with
    // no straight piece between. It is an arc that leaves the last station along the pass's own heading there and
    // touches the turn's circle; its radius is the one that makes the two circles touch (20 to 30 m by the seed: the
    // blade's end and the bore's axis stand too near each other for 32 on both bends, and the bone is not moved). The
    // turn is flown from the place where the two circles touch (turnIn) round to the run-in. Points stand FAIR_STEP
    // metres apart along the arc and the turn; the height eases from the last station's to the run-in's over the whole
    // way, level where it leaves the station (the fairing below gives it the pass's own slope there) and on the bore's
    // own slope where it reaches the run-in.
    const crossing = [], turn = [];
    const t0 = V3(lastPass.x - pass[nPass - 2].x, 0, lastPass.z - pass[nPass - 2].z).normalize(), portH = V3(t0.z, 0, -t0.x);
    // (the two circles touch: their centres stand CROSS_R + TURN_R apart)
    const crossW = V3(turnC.x - lastPass.x, 0, turnC.z - lastPass.z), CROSS_R = (crossW.lengthSq() - TURN_R * TURN_R) / (2 * (crossW.dot(portH) + TURN_R));
    const crossC = V3(lastPass.x, 0, lastPass.z).addScaledVector(portH, CROSS_R), cc = V3(turnC.x - crossC.x, 0, turnC.z - crossC.z), ccLen = cc.length();
    const angOf = (c, q) => Math.atan2(q.x - c.x, q.z - c.z), wrap = (a) => a - 6.2831853 * Math.floor(a / 6.2831853);
    // (heading +Z with port +X: a bend to port goes round its centre with the angle atan2(x, z) rising, a turn to starboard with it falling.
    // The bend ends and the turn begins at the point where the two circles touch, on the line of their centres)
    const crossA0 = angOf(crossC, lastPass), linkA = Math.atan2(cc.x, cc.z), crossSweep = wrap(linkA - crossA0), turnA0 = linkA + Math.PI, turnSweep = wrap(turnA0 - angOf(turnC, runIn));
    const crossLen = CROSS_R * crossSweep, turnLen = TURN_R * turnSweep, yAt = (run) => { const S = crossLen + turnLen, f = clamp(run / S, 0, 1); return lerp(lastPass.y, runIn.y, f * f * (3 - 2 * f)) + axisRise * S * f * f * (f - 1); };
    const turnPt = (run) => { const a = turnA0 - run / TURN_R; return V3(turnC.x + TURN_R * Math.sin(a), yAt(crossLen + run), turnC.z + TURN_R * Math.cos(a)); };
    { const n1 = Math.max(Math.round(crossLen / FAIR_STEP), 1), n2 = Math.max(Math.round(turnLen / FAIR_STEP), 1);
      for (let i = 1; i < n1; i++) { const a = crossA0 + crossSweep * i / n1; crossing.push(V3(crossC.x + CROSS_R * Math.sin(a), yAt(crossLen * i / n1), crossC.z + CROSS_R * Math.cos(a))); }
      for (let i = 0; i < n2; i++) turn.push(turnPt(turnLen * i / n2)); }
    const turnIn = turn[0];
    // THE LINE FAIRED IN SPACE, from the lead-in point to the place the turn begins. The pass's stations lie on the
    // surface CLEAR from the bone, and that surface has creases (where the snapped tip's own form meets the wing's, where
    // the strut comes up under the blade); the lead-in comes up to the first station and the crossing leaves the last at
    // slopes that are not the line's own. So the whole line (the lead-in's points, the stations, the crossing's points,
    // all FAIR_STEP apart) is faired together: in turn (1) each station but the two end ones is drawn half way to the middle of its
    // neighbours and every station is set back on the surface CLEAR from the bone; (2) wherever three points in a row
    // bend tighter than R_SPACE in space, the three are moved apart by just the excess; (3) any point nearer the bone
    // than CLEAR_MIN is put out to it. The lead-in's and the crossing's points are held by nothing but (2) and (3), so
    // the pass keeps the bone and they take its own heading and slope where they meet it. The last rounds are (2) and
    // (3) alone: where the bend limit and the surface cannot both be had the smooth line wins, and stands further
    // from the bone there, never nearer. The lead-in point with its first step (along the lead-in's heading, rising
    // LEAD_DEG) and the turn's first point with its first step do not move.
    const fair = [leadIn, ...leadPts, ...pass, ...crossing, turnIn, turn[1]], fairFree = fair.map((q, i) => (i > 1 && i < fair.length - 2 ? 1 : 0)), fP0 = 1 + leadPts.length, fP1 = fP0 + nPass - 1;
    { const g = V3(), v = V3(), e = 0.6;
      const setBack = (q, to) => { const d = heroDist(q.x, q.y, q.z); g.set(heroDist(q.x + e, q.y, q.z) - d, heroDist(q.x, q.y + e, q.z) - d, heroDist(q.x, q.y, q.z + e) - d); if (g.lengthSq() > 1e-8) q.addScaledVector(g.normalize(), to - d); };
      const fairRound = (it) => {                            // (one round; a function of its own so the engine compiles it)
        if (it < FAIR_ROUNDS) {
          for (let i = fP0 + 1; i < fP1; i++) fair[i].multiplyScalar(0.5).addScaledVector(fair[i - 1], 0.25).addScaledVector(fair[i + 1], 0.25);
          for (let i = fP0; i <= fP1; i++) setBack(fair[i], CLEAR);
        }
        for (let sweep = 0; sweep < FAIR_SWEEPS; sweep++) for (let i = 1; i < fair.length - 1; i++) {
          const a = fair[i - 1], b = fair[i], c = fair[i + 1], l = (a.distanceTo(b) + b.distanceTo(c)) / 2, most = 0.85 * l * l / R_SPACE;   // (0.85: the curve drawn through the points bends a little more than they do)
          v.copy(a).addScaledVector(b, -2).add(c); const len = v.length(), den = fairFree[i - 1] + 4 * fairFree[i] + fairFree[i + 1];
          if (len <= most || den === 0) continue;
          v.multiplyScalar((len - most) / (len * den)); a.addScaledVector(v, -fairFree[i - 1]); b.addScaledVector(v, 2 * fairFree[i]); c.addScaledVector(v, -fairFree[i + 1]);
        }
        for (let i = Math.max(fP0 - FAIR_NEAR, 2); i < Math.min(fP1 + FAIR_NEAR, fair.length - 2); i++) { const q = fair[i]; if (heroDist(q.x, q.y, q.z) < CLEAR_MIN) setBack(q, CLEAR_MIN); }   // (the stations and the FAIR_NEAR points to either side of them: further off the line is metres clear)
        for (let i = fP0 - 1; i <= fP1; i++) {                 // (the surface has steps a station can stand on either side of: the middle between two points is held off the bone as well, by moving both)
          const a = fair[i], b = fair[i + 1]; v.copy(a).add(b).multiplyScalar(0.5); const d = heroDist(v.x, v.y, v.z); if (d >= CLEAR_MID) continue;
          g.set(heroDist(v.x + e, v.y, v.z) - d, heroDist(v.x, v.y + e, v.z) - d, heroDist(v.x, v.y, v.z + e) - d); if (g.lengthSq() < 1e-8) continue;
          g.normalize().multiplyScalar(CLEAR_MID - d); if (fairFree[i]) a.add(g); if (fairFree[i + 1]) b.add(g);
        }
      };
      for (let it = 0; it < FAIR_ROUNDS + FAIR_LAST; it++) {
        fairRound(it);
        if (it % 4 === 3) await ctx.yield();
      } }
    const cpPass0 = 9 + climb.length + leadPts.length, cpPass1 = cpPass0 + nPass - 1;   // (indices of the first and last station in cp: seven typed points, the wash's end, the climb's points, the lead-in point and the lead-in's points stand before them)
    const cp = [
      [0, ENTRY_Y, 0], [0, ENTRY_Y, 30], [0, ENTRY_Y, 62], [0, 24, 115], [0, WASH_Y, 170], [0, WASH_Y, 280], [0, WASH_Y, 350],
      washEnd.toArray(), ...climb.map((q) => q.toArray()), leadIn.toArray(), ...leadPts.map((q) => q.toArray()),
      ...pass.map((q) => q.toArray()),
      // across the face, falling to the mouth's height, and round the turn (its first point is turnIn) to the run-in
      ...crossing.map((q) => q.toArray()), ...turn.map((q) => q.toArray()), runIn.toArray(),
      // the bore on its axis: mouth, middle and far mouth lie on the centre line (the drop's first point is fixed, so
      // in the bore's last third the curve begins its bend toward it and is under 2 m off the axis at the far rim)
      canalIn.toArray(), canalIn.clone().lerp(canalOut, 0.5).toArray(), canalOut.toArray(),
      // the drop (design: z 800 to 1,040, down to y 9, along the open lane): over the edge at about 37 degrees to the cloud
      // tops, a long shallow slide through the deck with the ranks 10 m off on both sides (y 60 to 46), then out under it
      // (the route comes to y 9 LEVEL_IN metres before LEVEL_Z, so the curve from LEVEL_Z to the wall lies between
      // points that are all at y 9 and on the door's line: 110 m level and straight)
      [-21, 163, 793], [-23.6, 119, 851], [-27.5, 80, 903], [-32, 59, 950], [-36.2, 46, 994], [-39.6, 15, 1042], [-40, END_Y, LEVEL_Z - LEVEL_IN], [-40, END_Y, LEVEL_Z], [-40, END_Y, 1130], [-40, END_Y, WALL_Z],
    ].map((c) => ({ p: c }));
    let path = makePath(cp.map((c) => c.p));
    // Clearance, tested at every 2.5 m of the whole route: where the curve between two points comes nearer the bone
    // than 9.6 m, the stations of the pass are pushed off together along the field's gradient there, by as much as
    // brings that eye to CLEAR, and the point before them (the lead-in's last) and the point after them (the crossing's
    // first) by half as much (so there is no kink at either end), until every tested eye is clear. (A guard: the
    // fairing above already holds the stations and the middles between them 10.12 m and more from the bone.)
    const _g = new THREE.Vector3();
    for (let it = 0; it < 10; it++) {
      let worst = 9.6, found = false, far = 0; const v = new THREE.Vector3(), w = new THREE.Vector3();   // (far: metres to spare at the last eye; the next eyes within half of it cannot be too near and are passed over)
      for (let d = 0, n = 0; d <= path.length; d += 2.5 * Math.max(Math.floor(far / 5), 1), n++) { path.posAtDist(d, v); const c = heroDist(v.x, v.y, v.z); far = c - 9.6; if (c < worst) { worst = c; w.copy(v); found = true; } if (n % 96 === 95) await ctx.yield(); }
      if (!found) break;
      const e = 0.6; _g.set(heroDist(w.x + e, w.y, w.z) - heroDist(w.x - e, w.y, w.z), heroDist(w.x, w.y + e, w.z) - heroDist(w.x, w.y - e, w.z), heroDist(w.x, w.y, w.z + e) - heroDist(w.x, w.y, w.z - e));
      if (_g.lengthSq() < 1e-8) _g.set(0, -1, 0); _g.normalize().multiplyScalar(CLEAR - worst);
      for (let i = cpPass0 - 1; i <= cpPass1 + 1; i++) { const k = i < cpPass0 || i > cpPass1 ? 0.5 : 1; cp[i].p[0] += _g.x * k; cp[i].p[1] += _g.y * k; cp[i].p[2] += _g.z * k; }
      path = makePath(cp.map((c) => c.p));
      await ctx.yield();
    }
    const DOOR_X = cp[cp.length - 1].p[0];
    // places along the route, as u (every scripted beat is anchored to one of these, never to a literal u)
    const NPS = 1400, psx = new Float32Array(NPS + 1), psy = new Float32Array(NPS + 1), psz = new Float32Array(NPS + 1);
    { const v = new THREE.Vector3(); for (let i = 0; i <= NPS; i++) { path.pointAt(i / NPS, v); psx[i] = v.x; psy[i] = v.y; psz[i] = v.z; if (i % 350 === 349) await ctx.yield(); } }
    const uOfPoint = (x, y, z) => { let b = 0, bd = 1e18; for (let i = 0; i <= NPS; i++) { const d = (psx[i] - x) ** 2 + (psy[i] - y) ** 2 + (psz[i] - z) ** 2; if (d < bd) { bd = d; b = i; } } return b / NPS; };
    const uRing = uOfPoint(0, ENTRY_Y, RING_Z), uWashEnd = uOfPoint(0, WASH_Y, WASH_END), uWingIn = uOfPoint(...cp[cpPass0].p), uWing = uOfPoint(...cp[cpPass1].p);   // under the break's inner lip; the last station, PASS_MIN metres of the blade's line in from the first (past the strut)
    const canalMid = canalIn.clone().lerp(canalOut, 0.5), uCanalIn = uOfPoint(canalIn.x, canalIn.y, canalIn.z), uCanalMid = uOfPoint(canalMid.x, canalMid.y, canalMid.z), uCanalOut = uOfPoint(canalOut.x, canalOut.y, canalOut.z);
    const uTurnIn = uOfPoint(turnIn.x, turnIn.y, turnIn.z);        // where the turn onto the canal's axis begins
    const mAfter = (uPlace, metres) => uPlace + metres / path.length;     // a place of the route and metres flown on from it (negative: before it), as u
    const uLevel = uOfPoint(DOOR_X, END_Y, 1050), uRib = uOfPoint(DOOR_X, END_Y, RIB_Z), uDeck = uOfPoint(-27.5, 80, 903);
    await ctx.yield();

    // ---------------------------------------------------------------- the ground: one heightfield of folded cloth
    // Pleats hang down the hill flanks into the wash (crest 0, gully 1 is the fold coordinate); the ridge and the basin
    // beyond are the same cloth laid flatter. out = [height, c, swell, rampSelect (0 red, 1 ochre), pleat angle, basin]
    const N = ctx.noise, LAM = 24, FAR_Z = 9200, FOLD_Z0 = WALL_Z + 25, FOLD_SLANT = 150, FAR_LOW = 0.34;   // (FOLD_Z0: where the folds begin again behind the wall)
    const pleatOff = lookRng() * 40, groupSeed = lookRng() * 100;
    const hash1 = (n) => { const s = Math.sin(n * 127.1 + groupSeed) * 43758.5453; return s - Math.floor(s); };
    const xCourse = (z) => lerp(0, DOOR_X, sstep(760, 1000, z));
    // The climb's country: the wash hills go on up beside the climb, on both sides of its line in plan, as one mass of
    // the same pleated cloth that rises as the route rises (40 m where the route is under y 55, the hills' full 88 to
    // 96 m where it is over y 105, standing on the ridge's face), until the place where the eye is within 60 m of the
    // bone (CL_END metres of the climb's plan, found by the hero's own distance function); over the next 60 m of the
    // plan it sinks away. The line is sampled every 4 m: the wash's own axis for its last 300 m, the climb's plan, and
    // the lead-in's heading for 60 m past the lead-in. climbField gives, for a place, its distance from the climb's line
    // and (each sample weighed by the inverse sixth power of its distance, so both run smoothly from one leg to the
    // next) the run along the line there, the route's height there, and how far apart the runs are that have a say
    // (where two legs with far different runs are as near as each other the folds melt to satin, not to a tear).
    const CL_N0 = 75, CL_N1 = Math.ceil((climbPlan.len + 60) / 4) + 1, CL_N = CL_N0 + CL_N1, clX = new Float32Array(CL_N), clZ = new Float32Array(CL_N), clS = new Float32Array(CL_N), clY = new Float32Array(CL_N);
    let CL_END = climbPlan.len;
    { const e = V3();
      for (let i = 0; i < CL_N0; i++) { clX[i] = 0; clZ[i] = washEnd.z - 4 * (CL_N0 - i); clS[i] = -4 * (CL_N0 - i); clY[i] = WASH_Y; }
      for (let i = 0; i < CL_N1; i++) { const r = 4 * i, q = CL_N0 + i; climbAt(Math.min(r, climbPlan.len), e); const over = Math.max(r - climbPlan.len, 0); clX[q] = e.x + hIn.x * over; clZ[q] = e.z + hIn.z * over; clS[q] = r; clY[q] = e.y; }
      for (let r = climbPlan.len; r > 0; r -= 1) { climbAt(r, e); if (heroDist(e.x, e.y, e.z) >= 60) break; CL_END = r; } }
    const CL_REACH = 250, clBox = [1e9, -1e9, 1e9, -1e9];
    for (let q = CL_N0; q < CL_N; q++) { clBox[0] = Math.min(clBox[0], clX[q] - CL_REACH); clBox[1] = Math.max(clBox[1], clX[q] + CL_REACH); clBox[2] = Math.min(clBox[2], clZ[q] - CL_REACH); clBox[3] = Math.max(clBox[3], clZ[q] + CL_REACH); }
    const _cf = [0, 0, 0, 0];                                  // [distance from the climb's line, run, route height, spread of the runs]
    const climbExact = (x, z, out) => {
      let d2min = 1e18, sw = 0, ss = 0, sy = 0, s2 = 0;
      for (let q = 0; q < CL_N; q++) { const dx = clX[q] - x, dz = clZ[q] - z, d2 = dx * dx + dz * dz; if (q >= CL_N0 && d2 < d2min) d2min = d2; const w = 1 / ((d2 + 16) * (d2 + 16) * (d2 + 16)); sw += w; ss += w * clS[q]; sy += w * clY[q]; s2 += w * clS[q] * clS[q]; }
      out[0] = Math.sqrt(d2min); out[1] = ss / sw; out[2] = sy / sw; out[3] = Math.sqrt(Math.max(s2 / sw - out[1] * out[1], 0)); return out;
    };
    // (the four are worked out once on a lattice of CL_CELL metres over the climb's box and read between its knots:
    // they only steer wide fades, of 35 m and more, so 12 m is fine enough, and the ground asks 20,000 times)
    const CL_CELL = 12, clNx = Math.ceil((clBox[1] - clBox[0]) / CL_CELL) + 1, clNz = Math.ceil((clBox[3] - clBox[2]) / CL_CELL) + 1, clLat = new Float32Array(clNx * clNz * 4);
    for (let j = 0, k = 0; j < clNz; j++) { for (let i = 0; i < clNx; i++, k += 4) { climbExact(clBox[0] + i * CL_CELL, clBox[2] + j * CL_CELL, _cf); clLat[k] = _cf[0]; clLat[k + 1] = _cf[1]; clLat[k + 2] = _cf[2]; clLat[k + 3] = _cf[3]; } if (j % 16 === 15) await ctx.yield(); }
    const climbField = (x, z, out) => {
      const fx = clamp((x - clBox[0]) / CL_CELL, 0, clNx - 1.001), fz = clamp((z - clBox[2]) / CL_CELL, 0, clNz - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
      const k = (j * clNx + i) * 4, k2 = k + clNx * 4, w00 = (1 - u) * (1 - v), w10 = u * (1 - v), w01 = (1 - u) * v, w11 = u * v;
      for (let c = 0; c < 4; c++) out[c] = clLat[k + c] * w00 + clLat[k + 4 + c] * w10 + clLat[k2 + c] * w01 + clLat[k2 + 4 + c] * w11;
      return out;
    };
    // The notch: from the entry point the mesa stands on the horizon at MESA_AZ0, 7 degrees wide, over the low hills
    // there. In that wedge of country (the mesa's half width, 4.1 degrees, and 0.4 more to each side of its bearing from
    // the entry point) the climb's mass stays 4 m under the entry's height; beside the wedge it may rise 3 m a metre.
    const MESA_AZ0 = -10.5 * DEG, NOTCH_HALF = 4.5 * DEG;
    // No wash hill and no hill of the climb stands more than 90 m over its own foot: the height a hill is given is
    // bent over under HILL_MOST (a soft shoulder from 6 m under it).
    const HILL_MOST = 89;
    // The hero's foot: where the bone stands on the ridge, as the wash looks at it. FOOT_Z is the nearest place to the
    // wash at which the bone meets the ridge's top, FOOT_X0 to FOOT_X1 how far to starboard and to port of the wash's
    // axis it does (found from the bone's own distance function, 1 m over the ridge's top). While the eye is in the
    // wash's last FOOT_FROM metres the hills beyond the wash's end stand to the two sides of every line from it to that
    // foot: between the two lines from the furthest of those eyes to the foot's two ends (and FOOT_PAD beside them) no
    // hill stands higher than FOOT_UNDER below the line from the nearest of them, the eye at the wash's end; beside
    // that the hills may rise 3 m a metre, as beside the mesa's notch. The hills are set aside, not lowered.
    const FOOT_FROM = 150, FOOT_PAD = 4, FOOT_UNDER = 2;
    let FOOT_Z = HERO_Z, FOOT_X0 = 0, FOOT_X1 = 0;
    for (let x = -80; x <= 80; x += 4) for (let z = HERO_Z - 80; z < HERO_Z; z += 2) if (heroDist(x, RIDGE_Y + 1, z) <= 0) { FOOT_Z = Math.min(FOOT_Z, z); FOOT_X0 = Math.min(FOOT_X0, x); FOOT_X1 = Math.max(FOOT_X1, x); break; }
    // The two flanks beside the lane stand on beside the level run and come down in one S of their own: they begin to
    // sink FLANK_EASE before the level run begins (so no top beside the level run is higher than they stand at its
    // beginning) and have sunk FLANK_RIB before the rib; FLANK_LOW_Z is the place 60 m before the door, from which no
    // top is higher than the eye. The starboard flank's foot stands off the lane along the mesa's own sight line: from
    // the place where the route sinks under the flanks' greatest height (Z_UNDER) the mesa is seen over the wall's low
    // end, WALL_LOW to starboard of the door, 4.3 degrees to each side of its bearing; the foot keeps to starboard of
    // the outer of those lines (and 1 degree more), so no flank stands between the eye and the mesa or the low end.
    const FLANK_EASE = 10, FLANK_RIB = 12, FLANK_Z0 = LEVEL_Z - FLANK_EASE, FLANK_Z1 = RIB_Z - FLANK_RIB, FLANK_LOW_Z = WALL_Z - 60, FLANK_MOST = 44 * 0.8, WALL_LOW = 43, MESA_HALF = 4.3 * DEG;
    let Z_UNDER = LEVEL_Z; for (let i = Math.round(uDeck * NPS); i <= NPS; i++) if (psy[i] < FLANK_MOST) { Z_UNDER = psz[i]; break; }
    const MESA_OFF = Math.tan(Math.atan2(WALL_LOW, WALL_Z - Z_UNDER) + MESA_HALF + 1 * DEG);   // (metres to starboard for a metre along the course)
    // The basin (the country past the hero's ridge) beyond 400 m from the route stands no higher than 20 m over the
    // level run's floor: from 360 m out the ground is bent over under FAR_MOST (the floor lies between y -0.6 and 0.8).
    const FAR_MOST = 19, LOW_HOLD = 6 - 0.7 - 0.4;             // (the wall's low end stands 6 m high, its top waving 0.7 m about that)
    const ground = (x, z, out) => {
      const xc0 = xCourse(z), ax = Math.abs(x - xc0), warp = 26 * N.n2(x * 0.006, z * 0.006) + 7 * N.n2(x * 0.021 + 9, z * 0.021);
      let pf = 1 - sstep(150, 270, ax);                                             // far to the side the grid is coarse: the folds melt to satin
      let axP = ax, zP = z, cFade = 0, cBig = 0;                                    // (the climb's country: its own fold coordinates, how much of its mass stands here, how high)
      if (x > clBox[0] && x < clBox[1] && z > clBox[2] && z < clBox[3]) {
        climbField(x, z, _cf);
        const wC = 1 - sstep(150, CL_REACH, _cf[0]);
        if (wC > 0) {
          axP = lerp(ax, Math.min(ax, _cf[0]), wC); zP = lerp(z, washEnd.z + _cf[1], wC); pf *= 1 - wC * sstep(45, 80, _cf[3]);
          cFade = (1 - sstep(70, 160, _cf[0])) * (1 - sstep(CL_END, CL_END + 60, _cf[1])); cBig = sstep(55, 105, _cf[2]);
        }
      }
      const ph = (zP + pleatOff - 0.45 * axP + warp) / LAM, k = ph - Math.floor(ph), g = Math.abs(2 * k - 1), g2 = Math.pow(g, 1.7) * pf + 0.4 * (1 - pf);
      // the wash and its hills (z up to the ridge's foot)
      const washFade = 1 - sstep(WASH_END + 50, 590, z);
      // under the clouds the lane runs between two pleated flanks of the same cloth as the wash hills, lower (the deck is
      // above them). Both stand on beside the level run and sink in one S from FLANK_Z0 to FLANK_Z1 (see above); the
      // starboard one's foot stands off the lane by sOff, outside the mesa's sight lines.
      const sOff = z > Z_UNDER ? (1 - sstep(-8, 8, x - xc0)) * (z - Z_UNDER) * MESA_OFF : 0;   // (how far the starboard flank's foot stands off the lane here)
      const bw = sstep(928, 1004, z) * (1 - sstep(FLANK_Z0, FLANK_Z1, z)) * (1 - sstep(80, 230, ax)) * (sOff > 0 ? sstep(-6, 6, ax - sOff) : 1);
      const hillFade = Math.min(Math.max(washFade, cFade) + bw, 1);
      const cone = 0.36 * Math.max(z, 0) + 40;
      // (a term whose weight is exactly 0 here is not worked out: the noise is the cost of this function)
      const big = washFade > 0 ? sstep(cone, cone + 150, ax) * (0.75 + 0.25 * N.n2(x * 0.004 + 3, z * 0.004)) * washFade : 0;
      const rz = z + 20 * N.n2(x * 0.004 + 40, 0.5), up = sstep(WASH_END - 20, HERO_Z - 25, rz), down = 1 - sstep(HERO_Z + 25, 905, rz);
      const aN = washFade + bw > 0 || cFade > 0 ? 40 + 4 * N.n2(x * 0.011, z * 0.011 + 5) : 0;
      let A = washFade + bw > 0 ? (aN + 48 * big) * (washFade + 0.8 * bw) : 0, cLift = 0;
      if (cFade > 0) {                                                              // the climb's mass, under the notch's ceiling where the mesa is seen over it
        const beside = Math.hypot(x, z) * Math.max(Math.abs(Math.atan2(x, z) - MESA_AZ0) - NOTCH_HALF, 0), notch = ENTRY_Y - 4 - RIDGE_Y * up * down + 3 * beside;   // (beside: metres outside the wedge)
        A = Math.max(A, cFade * Math.min(aN + 48 * cBig, Math.max(notch, 0))); cLift = cFade * cBig * sstep(0, 10, beside);
      }
      if (A > HILL_MOST - 6) A = F.smin(A, HILL_MOST, 6);
      if (A > 0 && z > WASH_END && z < HERO_Z) {                                    // the hills stand aside from the lines to the hero's foot (as far as the hero's own place: the foot's ends lie behind its nearest point)
        const t = Math.min((z - WASH_END) / (FOOT_Z - WASH_END), 1), tw = Math.min((z - WASH_END + FOOT_FROM) / (FOOT_Z - WASH_END + FOOT_FROM), 1);
        const beside = Math.max(FOOT_X0 * tw - FOOT_PAD - x, x - FOOT_X1 * tw - FOOT_PAD, 0);
        A = Math.min(A, Math.max(lerp(WASH_Y, RIDGE_Y, t) - FOOT_UNDER - RIDGE_Y * up * down + 3 * beside, 0));
      }
      const d = ax - sOff - (3.5 + 11.5 * g2);
      const rise = 1 - Math.exp(-Math.max(d, 0) / 12);
      let h = A * rise * (1 - 0.2 * g2 * rise);
      const bed = sstep(0, 6, -d);                                                  // 1 in the wash bed
      let c = clamp(0.1 + 0.72 * g2 + 0.2 * (1 - rise), 0, 1);
      if (bed * hillFade > 0) c = lerp(c, 0.2 + 0.22 * (0.5 + 0.5 * Math.sin(z * 0.045 + x * 0.16 + 2 * N.n2(x * 0.03, z * 0.02))), bed * hillFade);
      h += bed * 0.5 * Math.sin(z * 0.05 + x * 0.2);
      // the ridge the hero stands on, pleated down both faces, and the basin behind it
      const pr = (x + 18 * N.n2(x * 0.01, z * 0.012 + 20)) / 42, kr = pr - Math.floor(pr), gr = Math.pow(Math.abs(2 * kr - 1), 1.7) * pf + 0.35 * (1 - pf);
      const face = 4 * up * (1 - up) + 4 * down * (1 - down);                       // 1 on the slopes, 0 on the crest and the flats
      const ridge = RIDGE_Y * up * down * (1 - 0.22 * gr * Math.min(face, 1));
      const rw = lerp(1 - hillFade * (1 - bed) * sstep(0, 0.25, rise), 1, cLift);   // how much this is ridge or basin, not wash hill (outside the notch the climb's high mass stands on the ridge's face: the ridge's whole height is under it)
      const basin = sstep(790, 900, rz);
      h = Math.max(h, 0) + ridge * (0.25 + 0.75 * rw);
      const cRidge = clamp(0.16 + 0.6 * gr * Math.min(face, 1) + 0.18 * (1 - up * down), 0, 1);
      const sw = basin > 0 ? 0.5 + 0.5 * Math.sin(z * 0.105 + 1.9 * Math.sin(x * 0.012 + 1.4 * N.n2(x * 0.003, z * 0.003)) + 2.4 * N.n2(x * 0.0045 + 60, z * 0.0035)) : 0.5;
      // the basin floor is the same cloth as the wash hills, laid lower, and the far country is this same pleated cloth,
      // red and ochre, running on to the horizon. Only the two folds beside the lane run with the course (the lane is
      // the gully between them). Every fold outside them is a pleat of hanging cloth: counted outward from the lane's
      // line and, behind the wall, round its far end (FOLD_Z0 on), so the far country's pleats lie across the course;
      // slanting across the course beside the lane (one fold more for every FOLD_SLANT metres of z, opening away from
      // the hero); swung in long S-curves by a slow warp of its distance (up to a third of it, so a group of
      // neighbours bends together) and pinched into its neighbours by a second, added one. Folds widen outward as before.
      const dx0 = x - xCourse(z), wk = 0.2 + 0.8 * sstep(8, 80, Math.abs(dx0)), dxc = basin > 0 ? dx0 + wk * (20 * N.n2(x * 0.0035 + 11, z * 0.0038) + 5 * N.n2(x * 0.012, z * 0.014 + 3)) : dx0, adx = Math.max(Math.abs(dxc) - 6, 0);   // a flat bed 12 m wide down the lane
      // the first crest stands 20 m from the course and about 7 m high (the eye is at 9): its flank, stones and sage pass at arm's length; folds widen outward
      const rho0 = Math.hypot(adx, Math.max(z - FOLD_Z0, 0)), wOut = basin > 0 ? sstep(24, 120, rho0) : 0;
      const rho = wOut > 0 ? rho0 * Math.exp(0.34 * wOut * N.n2(x * 0.0021 + 70, z * 0.0021 + 13)) : rho0;
      const qv = Math.log(1 + rho / 75) * 3 + (wOut > 0 ? wOut * (0.8 * N.n2(x * 0.0031 + 5, z * 0.0031 + 50) - (Math.min(z, FOLD_Z0) - 1000) / FOLD_SLANT) : 0);
      const qb = Math.sign(dxc) * qv, fb = Math.floor(qb), gb = Math.abs(2 * (qb - fb) - 1), fn = fb >= 0 ? fb : -fb - 1;   // (fn: the fold's number out from the lane, the same on both sides, so a pleat that goes round behind the wall is one fold)
      const pfb = 1 - sstep(560, 900, adx), gbm = Math.pow(gb, 1.75) * pfb + 0.4 * (1 - pfb);
      // (behind the wall the folds lie low, FAR_LOW of their height: with the floor's own swell, under the wall's 6 m step; their tones are as sharp as before)
      const foldNear = basin * (1 - bw) * (1 - sstep(1132, 1182, z)), foldFar = basin * (1 - bw) * sstep(FOLD_Z0, 1300, z), foldFade = foldNear + FAR_LOW * foldFar, foldTone = Math.min((foldNear + 0.5 * foldFar) * 1.6, 1);
      const laneFold = fn === 0 ? 1 : 0, foldA = foldFade <= 0 ? 0 : (6.2 + 3.4 * N.n2(x * 0.007 + 30, z * 0.006) + 5 * sstep(60, 420, rho0)) * lerp(0.55 + 0.45 * hash1(fn * 3.7 + 211), 1.02 + 0.2 * Math.sin(z * 0.043 + 2.2 * fb), laneFold);
      const cBasin = lerp(0.26 + 0.42 * sw, clamp(0.2 + 0.56 * gbm + 0.14 * sw, 0, 1), foldTone);
      h += basin * (1.3 * sw - 0.6) + foldFade * foldA * (1 - gbm);
      // beside the level run (from LEVEL_Z on, out to the flanks' reach of 230 m) no top of the floor's own folds stands
      // as high as the eye there: they are held under END_Y (the hold comes in over the 40 m before LEVEL_Z). The
      // flanks are not held until the place 60 m before the door (the hold comes on them over the 20 m before it):
      // from there to the door nothing beside the lane stands as high as the eye, and the wall's whole length is clear.
      { const lv = sstep(LEVEL_Z - 40, LEVEL_Z, z) * (1 - sstep(230, 300, ax)) * lerp(1 - bw, 1, sstep(FLANK_LOW_Z - 20, FLANK_LOW_Z, z)); if (lv > 0 && h > END_Y - 3) h = lerp(h, F.smin(h, END_Y - 0.4, 1.2), lv); }
      // and between the lane and the starboard flank's foot, on the mesa's bearing over the wall's low end, the floor's
      // folds are held under LOW_HOLD, the least top of the wall's low end less the same 0.4 m: nothing there stands
      // above the wall's 6 m step, on any line from the level run to it
      if (sOff > 0 && h > LOW_HOLD - 3) { const wv = sstep(LEVEL_Z - 40, LEVEL_Z, z) * (1 - sstep(-6, 6, ax - sOff)); if (wv > 0) h = lerp(h, F.smin(h, LOW_HOLD, 1.2), wv); }
      if (z > 800 && ax > 360) h = lerp(h, F.smin(h, FAR_MOST, 3), sstep(800, 808, z) * sstep(360, 400, ax));
      const zone = sstep(WASH_END - 10, 500, z);
      c = lerp(c, lerp(cRidge, cBasin, basin), zone * (1 - hillFade * (1 - bed)));
      // ramp: each group of three or four pleats takes the red or the ochre; the change hides in a gully
      const gi = Math.floor(Math.floor(ph) / 3) + (x < xc0 ? 57 : 0);
      let rs = hash1(gi) < 0.42 ? 1 : 0;
      rs = lerp(rs, 0.75, bed * hillFade);                                          // the wash bed is pale ochre
      rs = lerp(rs, 0.3, 1 - pf);
      if (zone * (1 - basin) * (1 - hillFade) > 0) rs = lerp(rs, sstep(0.35, 0.65, 0.5 + 0.5 * N.n2(x * 0.004 + 80, z * 0.004)), zone * (1 - basin) * (1 - hillFade));
      rs = lerp(rs, (fn !== 0 && hash1(fn * 5.3 + 97) < 0.4 ? 1 : 0) * foldTone * pfb, basin * (1 - bw * (1 - bed)));    // each basin fold red or ochre (the two beside the lane red: red earth under the ochre wall); the change hides in a gully
      // (the basin has no rim: beyond the flanks the cloth lies low out to its sides and on to the horizon)
      out[0] = h; out[1] = c; out[2] = (x * 0.3 + z * 0.8 + h * 1.4) / 46; out[3] = rs; out[4] = lerp(lerp(ph, pr, zone * (1 - hillFade)), qb + 0.5, basin * (1 - bw)) * 6.2831853; out[5] = basin;
      return h;
    };
    const _go = [0, 0, 0, 0, 0, 0];
    // the ceiling the route asks of the ground at (x, z): 8 m under the path out to 6 m to the side, rising gently beyond
    const bins = []; for (let i = 0; i <= NPS; i++) { const k = Math.floor((psz[i] + 100) / 10); (bins[k] || (bins[k] = [])).push(i); }
    const pathCeil = (x, z) => {
      let c = 1e9; const k0 = Math.floor((z + 70) / 10), k1 = Math.floor((z + 130) / 10);
      for (let k = Math.max(k0, 0); k <= k1; k++) { const bn = bins[k]; if (!bn) continue; for (let q = 0; q < bn.length; q++) {
        const i = bn[q], dx = psx[i] - x, dz = psz[i] - z, d2 = dx * dx + dz * dz;
        if (d2 < 900) { const d = Math.sqrt(d2), v = psy[i] - 8 + Math.max(d - 6, 0) * 1.1; if (v < c) c = v; }
      } }
      return c;
    };
    const groundY = (x, z) => ground(x, z, _go);
    // grid: fine near the course, coarser to the sides; rows closest together in the wash
    const zRows = [];
    for (let z = -520; z < -60; z += 23) zRows.push(z);
    for (let z = -60; z < 468; z += 3) zRows.push(z);
    for (let z = 468; z < 600; z += 6) zRows.push(z);                    // (the climb: the ridge's face is 50 m and more below the eye)
    for (let z = 600; z < 866; z += 7) zRows.push(z);
    for (let z = 866; z < 1202; z += 4.2) zRows.push(z);                 // the basin's folds pass at arm's length: fine rows
    for (let z = 1202; z < 1282; z += 8) zRows.push(z);
    // the far country's pleats lie across the course and widen with their distance from the wall's far end as the
    // basin's widen from the lane (fold n begins 75 (e^(n/3) - 1) m out): six rows to a fold, on to the hem
    for (let k = Math.ceil(18 * Math.log(1 + (1282 - FOLD_Z0) / 75)); ; k++) { const z = FOLD_Z0 + 75 * (Math.exp(k / 18) - 1); if (z >= FAR_Z - 150) break; zRows.push(z); }
    zRows.push(FAR_Z);
    const NXG = 170, NZG = zRows.length, gPos = new Float32Array(NXG * NZG * 3), gC = new Float32Array(NXG * NZG), gSw = new Float32Array(NXG * NZG), gG = new Float32Array(NXG * NZG * 4);
    for (let j = 0; j < NZG; j++) {
      const z = zRows[j], xc = xCourse(z), gw = 1100;
      for (let i = 0; i < NXG; i++) {
        const xi = (i / (NXG - 1)) * 2 - 1, a = Math.abs(xi), x = xc + Math.sign(xi) * gw * (0.11 * a + 0.89 * Math.pow(a, 3.2));
        let h = ground(x, z, _go);
        if (h > 0.9 && Math.abs(x) < 190) { const c = pathCeil(x, z); if (c < 1e8) h = F.smin(h, c, 9); }
        const q = j * NXG + i;
        gPos[q * 3] = x; gPos[q * 3 + 1] = h; gPos[q * 3 + 2] = z;
        gC[q] = _go[1]; gSw[q] = _go[2]; gG[q * 4] = _go[3]; gG[q * 4 + 1] = Math.sin(_go[4] - 1.1); gG[q * 4 + 2] = Math.cos(_go[4] - 1.1); gG[q * 4 + 3] = _go[5];
      }
      await ctx.yield();
    }
    const gIdx = new Uint32Array((NXG - 1) * (NZG - 1) * 6);
    for (let j = 0, t = 0; j < NZG - 1; j++) {
      for (let i = 0; i < NXG - 1; i++) { const a = j * NXG + i, b = a + 1, c2 = a + NXG, d2 = c2 + 1; gIdx[t++] = a; gIdx[t++] = c2; gIdx[t++] = b; gIdx[t++] = b; gIdx[t++] = c2; gIdx[t++] = d2; }
      if (j % 60 === 59) await ctx.yield();
    }
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3)); gGeo.setAttribute('aC', new THREE.BufferAttribute(gC, 1));
    gGeo.setAttribute('aSw', new THREE.BufferAttribute(gSw, 1)); gGeo.setAttribute('aG', new THREE.BufferAttribute(gG, 4));
    gGeo.setIndex(new THREE.BufferAttribute(gIdx, 1));
    // The pleat crests of the climb's country, read off the cloth as it is built: every point of it (over CREST_LOW, so
    // not a ripple of the bed) that stands higher than both its neighbours along its row or along its column.
    // uCrest is the place of the climb where the eye rises above the nearest of them: the first place (stepping the
    // route back from the lead-in point every 2.5 m, as far as the wash's end) from which, all the way on to the lead-in
    // point, no crest within CREST_NEAR of the eye in plan (60 m: the design's own measure of near) stands as high as the eye.
    const CREST_LOW = 5, CREST_NEAR = 60, crestPts = [];
    for (let j = 1; j < NZG - 1; j++) {
      if (zRows[j] < clBox[2] || zRows[j] > clBox[3]) continue;
      for (let i = 1, q = j * NXG + 1; i < NXG - 1; i++, q++) {
        const x = gPos[q * 3], h = gPos[q * 3 + 1]; if (h < CREST_LOW || x < clBox[0] || x > clBox[1]) continue;
        if ((h > gPos[(q - NXG) * 3 + 1] && h >= gPos[(q + NXG) * 3 + 1]) || (h > gPos[(q - 1) * 3 + 1] && h >= gPos[(q + 1) * 3 + 1])) crestPts.push(x, h, zRows[j]);
      }
    }
    const uLeadIn = uOfPoint(leadIn.x, leadIn.y, leadIn.z);
    let uCrest = uLeadIn;
    { const e = V3(), crestOver = (e) => { for (let k = 0; k < crestPts.length; k += 3) { if (crestPts[k + 1] < e.y) continue; const dx = crestPts[k] - e.x, dz = crestPts[k + 2] - e.z; if (dx * dx + dz * dz < CREST_NEAR * CREST_NEAR) return true; } return false; };
      for (let m = 2.5; uLeadIn - m / path.length > uWashEnd; m += 2.5) {
        path.pointAt(uLeadIn - m / path.length, e);
        if (crestOver(e)) break; uCrest = uLeadIn - m / path.length;
      } }
    await ctx.yield();
    gGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, (FAR_Z - 520) / 2), FAR_Z);   // (given, not measured: the cloth is never culled, and measuring 67,000 points is one long step)
    await ctx.yield();
    // ground material: two ramps mixed by the pleat group, the look's seam or snow, one far tone the dome continues
    const greyR = [mixc(LAV, WHITE, 0.25), mixc(LAV, VB, 0.5), mixc(LAV, VB, 0.95)], greyO = [mixc(WHITE, LAV, 0.7), mixc(LAV, VB, 0.3), mixc(LAV, VB, 0.8)];
    const rampA = look === 1 ? greyR : R.red, rampB = look === 1 ? greyO : R.ochre;
    const farTone = look === 2 ? mixc(WHITE, LAV, 0.4) : rampA[0].clone().lerp(rampA[1], 0.94);
    const groundMat = new THREE.ShaderMaterial({
      uniforms: {
        uOkPhase: okUniforms.uOkPhase, uOkSatin: okUniforms.uOkSatin,
        uAL: { value: rampA[0] }, uAM: { value: rampA[1] }, uAD: { value: rampA[2] }, uBL: { value: rampB[0] }, uBM: { value: rampB[1] }, uBD: { value: rampB[2] },
        uSnowL: { value: col(WHITE) }, uSnowD: { value: col(LAV) }, uSnow: { value: look === 2 ? 1 : 0 },
        uSeam: { value: mixc(OCHRE, WHITE, 0.3) }, uSeamAmt: { value: look === 1 ? 1 : 0 }, uFar: { value: farTone },
      },
      vertexShader: /* glsl */`attribute float aC, aSw; attribute vec4 aG; uniform float uOkPhase;
        varying float vC, vSlide, vDist; varying vec4 vG; varying vec2 vXZ;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vC = aC; vG = aG; vDist = length(mv.xyz); vXZ = position.xz;
          vSlide = .12 * sin(6.2831853 * (aSw - uOkPhase)); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uAL, uAM, uAD, uBL, uBM, uBD, uSnowL, uSnowD, uSeam, uFar; uniform float uSnow, uSeamAmt;
        varying float vC, vSlide, vDist; varying vec4 vG; varying vec2 vXZ;
        ${STYLE_GLSL}
        void main(){
          float basin = clamp(vG.w, 0., 1.);
          // the basin keeps its folds as sharp far off as near; only at the cloth's own far hem (a place, not a distance) does it take the one far tone the dome continues
          float hem = smoothstep(${(FAR_Z - 1500).toFixed(1)}, ${(FAR_Z - 60).toFixed(1)}, vXZ.y);
          float c = mix(clamp(vC, 0., 1.) + vSlide, .47, hem), cb = okBands(c, vDist);
          vec3 k = mix(okRamp3(uAL, uAM, uAD, cb), okRamp3(uBL, uBM, uBD, cb), clamp(vG.x, 0., 1.));
          float sb = okBands(clamp(c * 1.7, 0., 1.), vDist);
          float sm = uSnow * max(1. - smoothstep(.2, .34, c), basin);
          k = mix(k, mix(uSnowL, uSnowD, sb * .9), sm);
          float fs = fwidth(vG.y), hw = max(.05, fs);
          float seam = (1. - smoothstep(hw, hw + fs + 1e-4, abs(vG.y))) * step(0., vG.z) * (1. - smoothstep(.12, .35, fs)) * (1. - basin) * uSeamAmt;
          k = mix(k, uSeam, seam * .9);
          k = mix(k, uFar, hem);
          gl_FragColor = vec4(k, 1.);
        }`,
    });
    const groundMesh = new THREE.Mesh(gGeo, groundMat); groundMesh.name = 'cloth'; groundMesh.frustumCulled = false; scene.add(groundMesh);

    // ---------------------------------------------------------------- the sky: one flat pigment, three pale steps at the horizon, the mesa
    const skyTop = col(dusk ? VB : SKY), skyHor = col(dusk ? SKY : GW);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: skyTop }, uHor: { value: skyHor }, uGround: { value: farTone }, uBand: { value: dusk ? 0.4 : 0.1045 }, uSteps: { value: dusk ? 5 : 3 },
        uMesaA: { value: mixc(SKY, VB, dusk ? 0.55 : 0.36) }, uMesaB: { value: mixc(SKY, VB, dusk ? 0.8 : 0.6) }, uMesaAz: { value: 0 },
        uStar: { value: col(WHITE) }, uStarOn: { value: dusk ? 1 : 0 },
      },
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: /* glsl */`uniform vec3 uTop, uHor, uGround, uMesaA, uMesaB, uStar; uniform float uBand, uSteps, uMesaAz, uStarOn; varying vec3 vDir;
        void main(){
          vec3 d = vDir / max(length(vDir), 1e-4);
          float t = clamp(1. - d.y / max(uBand, 1e-3), 0., 1.) * uSteps;
          vec3 k = mix(uTop, uHor, (floor(t) + smoothstep(.25, .75, fract(t))) / max(uSteps, 1.));
          float hl = length(d.xz), az = hl < 1e-4 ? 0. : atan(d.x, d.z);
          float X = (mod(az - uMesaAz + 3.14159265, 6.2831853) - 3.14159265) * 57.29578, Y = asin(clamp(d.y, -1., 1.)) * 57.29578;
          float aa = fwidth(Y) + 1e-4;
          // flat-topped, one stepped shoulder to starboard: 7 degrees wide, 1.8 tall, two tones
          float H = max(1.8 * (1. - smoothstep(1.8, 2.55, abs(X - 1.))), 1.02 * (1. - smoothstep(2.05, 2.85, abs(X + .8))));   // battered sides: a mesa, not a block
          H = max(H, .4 * (1. - smoothstep(2.9, 4.1, abs(X))));
          float m = smoothstep(-aa, aa, H - Y) * step(abs(X), 4.3);
          k = mix(k, mix(uMesaB, uMesaA, smoothstep(-aa, aa, Y - (.62 + .1 * sin(X * 2.1)))), m);
          vec2 sd = vec2(X - 1.2, Y - 8.5);
          k = mix(k, uStar, uStarOn * (1. - smoothstep(.26 - aa, .26 + aa, length(sd))));
          k = mix(k, uGround, smoothstep(aa, -aa, Y));       // under the horizon line: the far tone the cloth's hem ends in
          gl_FragColor = vec4(k, 1.);
        }`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), skyMat); dome.scale.setScalar(3000); dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    await ctx.yield();

    // ---------------------------------------------------------------- the ring bone at the entry and the rib at the exit
    const boneMat = okMaterial('bone', { palette: P, amp: BONE_SLIDE });
    const lineHex = '#' + mixc(LAV, VB, 0.5).getHexString();
    const lineMat = okLineMaterial(lineHex), holeMat = okHoleMaterial(heroPal);
    const yieldFn = () => ctx.yield();
    const ringOff = [propRng.range(-1.2, 1.2), propRng.range(-1.5, 1.5), propRng.range(0.9, 1.12)];
    const ringField = (x, y, z) => {                       // local: centre of the hole at the origin, the hole along z
      const r = Math.hypot(x * 0.985, y), rd = 7.5, qx = Math.abs(r - 25.5) - 9.5 + rd, qy = Math.abs(z + 0.04 * x) - 9 + rd;
      let d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rd;
      d = F.smin(d, F.ell(x, y, z, 45 * ringOff[2], 3 + ringOff[0], 2, 19 * ringOff[2], 10, 7.5), 11);          // the two side processes, a touch unequal
      d = F.smin(d, F.ell(x, y, z, -44, 1 + ringOff[1], 2.5, 18, 11, 7), 11);
      d = F.smin(d, F.ell(x, y, z, 1.5, 36, -3, 8, 10, 8.5), 9);                                                  // a blunt crest
      d = F.smin(d, F.ell(x, y, z, 0, -42, 3, 22, 15, 11), 12);                                                   // the body, sunk in the wash bed
      return d;
    };
    const ringGeo = await buildBoneGeometry(ctx, ringField, [-68, -58, -17, 68, 50, 17], 1.5 / Math.sqrt(detail), {
      axis: [-0.35, 0.8, 0.45], y0: -50, y1: 46, swell: (x, y, z) => (x * 0.5 + y * 0.75 + z * 0.3) / 17, curvGain: 14, cGain: 2.3, cBias: -0.5,
    });
    const ring = new THREE.Mesh(ringGeo, boneMat); ring.name = 'ringBone'; ring.position.set(0, ENTRY_Y, RING_Z); scene.add(ring);
    await ctx.yield();
    const ringSut = await sutureRibbons(ringField, [
      { p: [20, 30, -9], dir: [0.9, -0.3, 0], len: 44, wob: 0.5, wave: 30, w: 0.13, step: 1.6 },
      { p: [-24, -22, -9], dir: [-0.5, -0.8, 0], len: 40, wob: 0.45, wave: 34, w: 0.13, step: 1.6 },
      { p: [-6, 33, -9], dir: [-1, 0.1, 0], len: 36, wob: 0.4, wave: 26, w: 0.11, step: 1.6 },
    ], propRng, yieldFn);
    const ringLines = new THREE.Mesh(ringSut, lineMat); ringLines.position.copy(ring.position); ringLines.renderOrder = 2; scene.add(ringLines);
    const ringHoleSeeds = [];
    for (let i = 0; i < 9; i++) { const a = propRng.range(0, 6.283), rr = propRng.range(21, 31); ringHoleSeeds.push({ p: [Math.cos(a) * rr, Math.sin(a) * rr, -9.5], r: propRng.range(0.3, 0.8), thin: 0 }); }
    const ringHoles = new THREE.Mesh(await holeDecals(ringField, ringHoleSeeds, propRng, yieldFn), holeMat); ringHoles.position.copy(ring.position); ringHoles.renderOrder = 3; scene.add(ringHoles);
    await ctx.yield();
    // the rib: rooted 12 m to port of the course, over it to a free tip 22 m up and 15 m to starboard
    const ribTube = F.makeTube([
      [12.5, -4, 1.2, 2.8, 2.1, 0.2, 0, 1], [14.6, 6.5, 1.6, 2.7, 2.0, 0.3, 0, 1], [12, 16, 0.4, 3.1, 1.9, 0.5, 0.1, 1], [4.5, 23, -1.2, 3.2, 1.9, 0.3, 0.4, 1],
      [-6, 25, -1.4, 2.9, 1.8, 0, 0.6, 1], [-12.5, 23.4, 0, 2.4, 1.7, -0.2, 0.5, 1], [-15, 22, 1.2, 1.9, 1.6, -0.3, 0.4, 1],
    ], [0, 0, 1]);
    const ribField = (x, y, z) => F.smin(F.tube(ribTube, x, y, z), F.ell(x, y, z, 12.2, -1.5, 1.4, 3.6, 3.2, 3.4), 2.5);
    const ribGeo = await buildBoneGeometry(ctx, ribField, [-20, -7, -6, 20, 30, 6.5], 0.55 / Math.sqrt(detail), {
      axis: [0.5, 0.75, -0.4], y0: 0, y1: 27, swell: (x, y, z) => (x * 0.6 + y * 0.6 + z * 0.4) / 5, curvGain: 5, cBias: -0.25,
    });
    const rib = new THREE.Mesh(ribGeo, okMaterial('bone', { palette: P, amp: BONE_SLIDE, nearAmp: 0, nearReach: 70, deep: -0.45, deepPivot: 0.05 })); rib.name = 'rib'; rib.position.set(DOOR_X, groundY(DOOR_X, RIB_Z), RIB_Z); scene.add(rib);   // (deep: close to, the rib is its lightest, a white curve beside the route)
    const ribSut = await sutureRibbons(ribField, [{ p: [14.5, 6, -2], dir: [-0.1, 1, 0], len: 30, wob: 0.4, wave: 12, w: 0.05, step: 0.8 }], propRng, yieldFn);
    const ribLines = new THREE.Mesh(ribSut, lineMat); ribLines.position.copy(rib.position); ribLines.renderOrder = 2; scene.add(ribLines);
    await ctx.yield();

    // ---------------------------------------------------------------- the adobe wall and its door (the only building)
    const WX0 = DOOR_X - 130, WX1 = DOOR_X + 90, WZ = WALL_Z - 1.2, WT = 3;   // (WZ: the wall's near face, 1.2 m before the portal's seat at the route's end)
    const wallH = (x) => 6 + 20 * sstep(DOOR_X - 33.5, DOOR_X - 27, x) + 0.45 * Math.sin(x * 0.055 + 1) + 0.25 * Math.sin(x * 0.13);
    const wallBulge = (x, y) => 0.35 * Math.sin(x * 0.047) + 0.2 * Math.sin(x * 0.11 + y * 0.12 + 2);
    const wxs = []; for (let x = WX0; x <= WX1 + 0.01; x += 2) wxs.push(x);
    for (const e of [DOOR_X - 6, DOOR_X + 6]) { let bi = 0; wxs.forEach((x, i) => { if (Math.abs(x - e) < Math.abs(wxs[bi] - e)) bi = i; }); wxs[bi] = e; }
    const mkWall = (topOnly) => {
      const pos = [], cc = [], ww = [], idx = [], rows = [];
      // profile rows: [y as (fixed y | fraction of the shoulder), z offset, kind]
      const fy = [-2, 2, 6, 11, 16, 21];
      for (const y of fy) rows.push({ y, z: 0, top: 0 });
      for (let k = 0; k <= 5; k++) { const a = (k / 5) * Math.PI / 2; rows.push({ sh: 1.3 * (1 - Math.sin(a)), z: 1.3 * (1 - Math.cos(a)), top: 1 }); }
      for (let k = 1; k <= 5; k++) { const a = (k / 5) * Math.PI / 2; rows.push({ sh: 1.3 * (1 - Math.cos(a)), z: WT - 1.3 * (1 - Math.sin(a)), top: 1 }); }
      for (const y of [16, 2, -2]) rows.push({ y, z: WT, top: 0 });
      const nr = rows.length;
      wxs.forEach((x, i) => {
        const H = wallH(x), endR = Math.min(1, Math.min(x - WX0, WX1 - x) / 2.5), He = H * (0.55 + 0.45 * Math.sqrt(endR));
        rows.forEach((r) => {
          const y = r.sh !== undefined ? He - r.sh : Math.min(r.y, He - 1.3), zc = WT / 2 + (r.z - WT / 2) * (0.5 + 0.5 * Math.sqrt(endR));
          pos.push(x, y, WZ + zc + wallBulge(x, y) * (r.z < WT / 2 ? 1 : 0.5));
          cc.push(topOnly ? clamp(0.1 + 0.5 * (r.sh ?? 0) / 1.3, 0, 1) : clamp(0.86 - 0.8 * Math.max(y, 0) / Math.max(He, 1) + 0.06 * Math.sin(x * 0.05), 0, 1));
          ww.push(y / 9 + x * 0.012, 0, 1, 0);
        });
        if (i === 0) return;
        const xm = (x + wxs[i - 1]) / 2, inDoor = Math.abs(xm - DOOR_X) < 6;
        for (let r = 0; r < nr - 1; r++) {
          const isTop = rows[r].top && rows[r + 1].top;
          if (topOnly !== !!isTop) continue;
          const ya = rows[r].y, yb = rows[r + 1].y;
          if (inDoor && !isTop && ya !== undefined && yb !== undefined && Math.min(ya, yb) >= 2 && Math.max(ya, yb) <= 16) continue;
          const a = (i - 1) * nr + r, b = a + 1, c2 = i * nr + r, d2 = c2 + 1; idx.push(a, c2, b, b, c2, d2);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cc, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(ww, 4));
      g.setIndex(idx); return g;
    };
    const wallMat = okMaterial([mixc(OCHRE, WHITE, 0.4), col(OCHRE), mixc(OCHRE, RED, 0.5)], { palette: P, amp: 0.1, side: THREE.DoubleSide });
    const wall = new THREE.Mesh(mkWall(false), wallMat); wall.name = 'adobeWall'; scene.add(wall);
    await ctx.yield();
    const wallTop = new THREE.Mesh(mkWall(true), look === 2 ? okMaterial('cloud', { palette: P, amp: 0.05, side: THREE.DoubleSide }) : wallMat); scene.add(wallTop);
    {                                                       // the reveal: violet black, 1.2 m deep from the wall's near face (WZ) to the portal's seat (WALL_Z)
      // (the box begins 0.55 m before WZ, the most the wall's swell stands out, so no gap opens beside the door, and its
      // back stands 0.3 m behind the portal's plane, never in it)
      const x0 = DOOR_X - 6, x1 = DOOR_X + 6, y0 = 2, y1 = 16, za = WZ - 0.55, zb = WALL_Z + 0.3;
      const q = [[x0, y0, za, x0, y1, za, x0, y1, zb, x0, y0, zb], [x1, y0, za, x1, y0, zb, x1, y1, zb, x1, y1, za], [x0, y1, za, x1, y1, za, x1, y1, zb, x0, y1, zb], [x0, y0, za, x0, y0, zb, x1, y0, zb, x1, y0, za], [x0, y0, zb, x0, y1, zb, x1, y1, zb, x1, y0, zb]];
      const pos = [], idx = []; q.forEach((f, i) => { pos.push(...f); idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const reveal = new THREE.Mesh(g, okFlatMaterial(VB)); reveal.name = 'reveal'; scene.add(reveal);
    }
    // the door is a plain opening: the portal fills it from its reveal distance on, framed by the violet black reveal
    await ctx.yield();

    // ---------------------------------------------------------------- instanced forms: clouds, stones, sage (one ramp each, own tone axis)
    const INST_FRAG = /* glsl */`uniform vec3 uLight, uMid, uDark; varying float vC, vSlide, vDist;
      ${STYLE_GLSL}
      void main(){ gl_FragColor = vec4(okShade(uLight, uMid, uDark, vC, vSlide, vDist), 1.); }`;
    const uT = { value: 0 }, uU = { value: 0 };
    const instMat = (ramp, body, extra = {}, amp = 0.07, sw = 0.5) => new THREE.ShaderMaterial({
      uniforms: { uOkPhase: okUniforms.uOkPhase, uOkSatin: okUniforms.uOkSatin, uLight: { value: ramp[0].clone() }, uMid: { value: ramp[1].clone() }, uDark: { value: ramp[2].clone() }, uT, uU, uAmp: { value: amp }, uSw: { value: sw }, ...extra },
      vertexShader: /* glsl */`attribute float aC; attribute vec4 aI; uniform float uOkPhase, uT, uU, uAmp, uSw, uShow;
        varying float vC, vSlide, vDist;
        void main(){
          vec3 lp = position; float c = aC;
          vec4 p = instanceMatrix * vec4(lp, 1.); vec3 ctr = instanceMatrix[3].xyz;
          ${body}
          vec4 mv = viewMatrix * p;
          vC = c; vSlide = uAmp * sin(6.2831853 * (aI.x + dot(lp, vec3(.45, .8, .3)) * uSw - uOkPhase)); vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: INST_FRAG,
    });
    const bakeC = (geo, fn) => { const p = geo.attributes.position, n = geo.attributes.normal, a = new Float32Array(p.count); for (let i = 0; i < p.count; i++) a[i] = clamp(fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)), 0, 1); geo.setAttribute('aC', new THREE.BufferAttribute(a, 1)); geo.deleteAttribute('uv'); return geo; };
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
    const place = (mesh, i, x, y, z, sx, sy, sz, ry, rx = 0, rz = 0) => { _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); mesh.setMatrixAt(i, _m); };

    // clouds: her sky above clouds. Flat ovals about 30 by 18 by 6 m (22 to 40 m long, each its own), in ranks about
    // 45 m apart that lie ACROSS the course and bow in long S-curves, a lane 20 m wide left open on the course.
    // The deck belongs to the basin: its tops are at y 60 and we fall through it; it ends at a hard edge over the wall
    // and at the basin's own shore to either side, over red land (SHORE: the design's basin is 1.5 km wide, so a rank
    // runs out 750 m from the lane's edge and its last oval begins inside that; about 400 ovals in all, by the look's
    // seed). Every oval is the same kind of thing, graded white above
    // to lavender grey beneath on its own tone axis; nothing is faded, melted or culled by distance or by the eye's height.
    // Ovals far from the route are the same form in fewer triangles; which form an oval gets is fixed in space by its
    // distance from the route, so none ever changes kind.
    const LANE_Z0 = 793, LANE_Z1 = 1047, LANE_X0 = -21, laneSlope = (DOOR_X - LANE_X0) / (LANE_Z1 - LANE_Z0);
    const laneX = (z) => LANE_X0 + laneSlope * (clamp(z, 700, LANE_Z1) - LANE_Z0);
    const cloudC = (x, y, z, nx, ny) => 0.5 - 0.5 * ny + 0.12 * nx + 0.1 * (1 - ny * ny);
    const cloudForm = (ws, hs) => { const g = bakeC(new THREE.SphereGeometry(1, ws, hs), cloudC), q = g.attributes.position; for (let i = 0; i < q.count; i++) { const y = q.getY(i); if (y < 0) q.setY(i, y * 0.62); } return g; };
    // the same oval in few triangles: a rim of n, a flat crown, a shallow belly
    const farForm = (n, cap) => {
      const pos = [], cc = [], idx = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.2831853; pos.push(Math.cos(a), -0.06, Math.sin(a)); cc.push(0.6 + 0.12 * Math.cos(a)); }
      for (let i = 0; i < n; i++) { const a = (i / n) * 6.2831853; pos.push(cap * Math.cos(a), 0.94, cap * Math.sin(a)); cc.push(0.07 + 0.07 * Math.cos(a)); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, n + i, j, j, n + i, n + j); }
      for (let i = 1; i < n - 1; i++) idx.push(n, n + i + 1, n + i);
      { const bot = pos.length / 3; pos.push(0, -0.62, 0); cc.push(1); for (let i = 0; i < n; i++) idx.push(i, (i + 1) % n, bot); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cc, 1)); g.setIndex(idx); return g;
    };
    // an oval's rim is a curve, never a run of straight sides (style note 2): one side of the rim turns it by no more than
    // 10 degrees where the route comes within 62 m (there its crown and belly are rounded in nine steps as well), 13 degrees
    // out to 300 m and 22.5 degrees beyond
    const cloudGeoN = cloudForm(36, 9);
    const showClouds = look === 2 ? 0 : 1;
    const hsh = (n) => hash1(n * 1.618 + 333);
    // lay the ranks (hashed from the look's seed, no seeded draws): out from the lane's edge on each side, oval after
    // oval, close along the rank so a rank reads as a chain, with uneven gaps; one in five touches or overlaps its
    // neighbour. Each rank has its own pitch, its own size of oval and its own bow; the two sides are staggered.
    // RANK_END: the last rank's line lies the broadest oval's half breadth (14 m) short of the wall, and no oval's centre
    // stands past the wall's face: the deck ends over the wall
    const DECK_Y = 56.6, RANK_END = WALL_Z - 14, SHORE = 750, bowPh = 6.2832 * hash1(901);
    const bow = (xl, k) => 100 * Math.sin(xl / 260 + 0.1 * k + bowPh) + 22 * Math.sin(xl / 97 + 0.17 * k + 2.4 * bowPh);   // a long S and a shorter one; a rank's neighbour bows nearly as it does, so ranks pinch and part but never cross
    const ovals = [];
    const addOval = (n, k, d, a, z0, yc, amp, swp) => {
      const z = z0 + bow(d, k) + 3 * (hsh(n * 3.7 + 80) - 0.5), x = laneX(z) + d;
      if (z > WALL_Z || (z < 960 && heroDist(x, 57, z) < a + 8)) return false;   // the deck ends over the wall; none stands in the hero
      const ry = -Math.atan((bow(d + 4, k) - bow(d - 4, k)) / 8) + 0.16 * (hsh(n * 5.3 + 10) - 0.5);
      ovals.push({ x, y: yc - 0.7 * hsh(n * 2.1 + 3), z, sx: a, sz: a * (0.54 + 0.14 * hsh(n * 2.9 + 60)), ry, rz: 0.035 * (hsh(n * 6.1 + 7) - 0.5), ph: hsh(n * 0.77 + 1), swp: swp + 0.012 * Math.abs(d), ax: 6.2832 * hash1(n * 1.37 + 500), amp, d: 0 });
      return true;
    };
    // the ranks go in twos and threes, close together, with a broad red interval before the next group (about 45 m a rank
    // on the average): one run out from each edge of the lane
    const nextRank = (k, sg, aRank) => { const g = hsh(Math.floor(k / 3) * 9.7 + sg * 3 + 21), m = k % 3, last = m === 2 || (m === 1 && g < 0.45) || (m === 0 && g < 0.12); return last ? [58 + 26 * hsh(k * 2.7 + sg + 11), 3 - m] : [20 + 0.55 * aRank, 1]; };
    for (const sg of [1, -1]) {
      let n = sg > 0 ? 0 : 50000, z0 = 778 + (sg < 0 ? 22 : 0);
      for (let k = 0, it = 0; z0 < RANK_END && it < 500; it++) {
        const aRank = 12.5 + 5.5 * hsh(k * 4.7 + sg + 70), [pitch, dk] = nextRank(k, sg, aRank), swp = 6.2832 * hsh(k * 3.3 + sg + 40);
        let s = 12.6 + 4 * hsh(k * 5.1 + sg * 2 + 9);
        while (s < SHORE) {                                       // (the rank ends at the shore; an oval takes its number, n, as it is laid)
          const a = clamp(aRank * (0.78 + 0.5 * hsh(n + 0.2)), 11, 20.5), h3 = hsh(n * 4.1 + 20), gap = h3 < 0.2 ? -3.5 * h3 / 0.2 : 0.8 + 9 * (h3 - 0.2) * (h3 - 0.2);
          if (addOval(n, k, sg * (s + a), a, z0, DECK_Y, 3, swp)) n++;
          s += 2 * a + gap;
        }
        // the hem: where two ranks stand apart, one more oval at the lane's edge, so that one passes on each side every 25 m or so
        if (pitch > 40) { const a = 10.5 + 4 * hsh(n + 0.6); if (addOval(n, k + 0.5, sg * (12.4 + a + 5 * hsh(n * 1.9 + 4)), a, z0 + pitch / 2, DECK_Y, 1.5, 6.2832 * hsh(n * 3.1 + 55))) n++; }   // (a hem oval drifts on its own phase)
        z0 += pitch; k += dk;
        if (it % 5 === 4) await ctx.yield();
      }
    }
    // each oval's form, by how near the route ever comes to it (a rule in space)
    { const i0 = Math.round(uCanalMid * NPS);
      const routeDist = (o) => {                             // coarse along the route first, then fine about the nearest place
        let bd = 1e18, bi = i0;
        for (let i = i0; i <= NPS; i += 20) { const dx = psx[i] - o.x, dy = psy[i] - o.y, dz = psz[i] - o.z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < bd) { bd = d2; bi = i; } }
        for (let i = Math.max(bi - 20, i0), i1 = Math.min(bi + 20, NPS); i <= i1; i += 2) { const dx = psx[i] - o.x, dy = psy[i] - o.y, dz = psz[i] - o.z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < bd) bd = d2; }
        return Math.sqrt(bd);
      };
      for (let q = 0; q < ovals.length; q++) { ovals[q].d = routeDist(ovals[q]); if (q % 400 === 399) await ctx.yield(); } }
    const cloudBody = /* glsl */`
          c = clamp(aC + .52 * (.5 + .5 * dot(lp.xz, vec2(cos(aI.z), sin(aI.z)))) * (1. - aC), 0., 1.);
          p.xyz = ctr + (p.xyz - ctr) * uShow; p.x += aI.w * sin(uT * .13 + uU * 5. + aI.y);`;       // each rank drifts a few metres along itself and back
    const cloudMat = instMat(R.cloud, cloudBody, { uShow: { value: showClouds } }, 0.09, 0.08);
    const tiers = [[(o) => o.d < 62, cloudGeoN, 'cloudRanksNear', 3.5], [(o) => o.d >= 62 && o.d < 300, cloudForm(28, 4), 'cloudRanks', 3.5],
      [(o) => o.d >= 300, farForm(16, 0.66), 'cloudRanksMid', 3.5]];
    for (const [pick, geo, name, sy] of tiers) {
      const list = ovals.filter(pick), mesh = new THREE.InstancedMesh(geo, cloudMat, Math.max(list.length, 1)), arr = new Float32Array(Math.max(list.length, 1) * 4);
      mesh.name = name; mesh.frustumCulled = false; _m.makeScale(0, 0, 0); mesh.setMatrixAt(0, _m);
      list.forEach((o, i) => { place(mesh, i, o.x, o.y, o.z, o.sx, sy, o.sz, o.ry, 0, o.rz); arr[i * 4] = o.ph; arr[i * 4 + 1] = o.swp; arr[i * 4 + 2] = o.ax; arr[i * 4 + 3] = o.amp; });
      geo.setAttribute('aI', new THREE.InstancedBufferAttribute(arr, 4)); mesh.instanceMatrix.needsUpdate = true; scene.add(mesh);
      await ctx.yield();
    }
    // the stair: the ranks beside the lane do not end at the deck's edge but step up the drop to the canal's mouth, oval
    // above oval, so that all the way down great ovals pass 8 m off on both sides (found from the route in space)
    const N_STAIR = 44, stair = new THREE.InstancedMesh(cloudGeoN.clone(), instMat(R.cloud, /* glsl */`
          c = clamp(aC + .62 * (.5 + .5 * dot(lp.xz, vec2(cos(aI.z), sin(aI.z)))) * (1. - aC), 0., 1.);
          p.xyz = ctr + (p.xyz - ctr) * uShow; p.z += 2.5 * sin(uT * .31 + aI.x * 6.2831853);`, { uShow: { value: showClouds } }, 0.09, 0.08), N_STAIR);
    stair.name = 'cloudStair'; stair.frustumCulled = false;
    {
      const sA = new Float32Array(N_STAIR * 4), i0 = Math.round(uCanalOut * NPS);
      for (let j = 0; j < N_STAIR; j++) {
        const rank = j % 4, side = rank % 2 ? -1 : 1, outer = rank >= 2 ? 1 : 0, m = Math.floor(j / 4);
        const z = 800 + m * 15.5 + rank * 3.9 + 4 * (hsh(j * 7.7 + 2000) - 0.5);
        let q = i0; while (q < NPS && psz[q] < z) q++;
        const sx = outer ? 15 + 4 * hsh(j * 2.3 + 2100) : 11.5 + 3.5 * hsh(j * 2.3 + 2100), sz = 7.5 + 3 * hsh(j * 2.9 + 2200);
        const over = !outer && m % 2 === (rank ? 1 : 0);                 // every other oval of the inner ranks passes above and beside: overhead
        const lat = outer ? 50 + 9 * hsh(j * 4.1 + 2300) : over ? 5.5 + sx : 8.5 + sx + 2.5 * hsh(j * 4.1 + 2300);
        const y = Math.max(psy[q] + (outer ? -12 : over ? 7.6 : -3.5) + (over ? 1.5 : 6) * (hsh(j * 5.9 + 2400) - 0.5), 57);
        place(stair, j, psx[q] + side * lat, y, z, sx, 2.9, sz, Math.atan(laneSlope) + 0.3 * (hsh(j * 5.3 + 2500) - 0.5), 0, 0.04 * (hsh(j * 6.1 + 2600) - 0.5));
        sA[j * 4] = hsh(j * 0.77 + 2700); sA[j * 4 + 1] = 1; sA[j * 4 + 2] = hsh(j * 1.91 + 2800) * 6.2832;
      }
      stair.geometry.setAttribute('aI', new THREE.InstancedBufferAttribute(sA, 4)); stair.instanceMatrix.needsUpdate = true; scene.add(stair);
    }
    await ctx.yield();

    // river stones: 500 violet black ovals worn smooth, one pale step along the top
    const thin = detail * clamp(vary.density ?? 1, 0.7, 1);       // a sparse visit thins the plentiful marks; the brief's counts are the most
    const nStone = Math.round(500 * thin), stoneGeo = bakeC(new THREE.SphereGeometry(1, 8, 5), (x, y, z, nx, ny) => 1 - 0.95 * sstep(0.5, 0.8, ny + 0.12 * nx) - 0.12 * sstep(-0.2, 0.5, ny));
    const stones = new THREE.InstancedMesh(stoneGeo, instMat(R.stone, '', {}, 0.04, 0.3), 500); stones.name = 'stones';
    const sI = new Float32Array(500 * 4);
    let stonePlaced = 0;
    // (the wash's 330 deal from the 'stones' stream, the basin's 170 from a stream of their own; every value of a try
    // is drawn before the ground is asked, so a try takes the same draws whatever the ground says)
    for (let i = 0, tries = 0; i < 500 && tries < 6000; tries++) {
      const basinStone = i >= 330, r = basinStone ? basinStoneRng : stoneRng, z = basinStone ? r.range(985, WALL_Z - 6) : r.range(-50, WASH_END + 6);
      const x = basinStone ? xCourse(z) + r.gauss() * 13 : r.range(-14, 14);
      const len = 0.25 + 1.25 * Math.pow(r(), 2.2), wd = len * r.range(0.5, 0.8), ht = Math.min(len, 1.1) * r.range(0.3, 0.5), ry = r.range(-0.5, 0.5) + (r() < 0.2 ? 1.2 : 0), rz = r.range(-0.08, 0.08), ph = r();
      const h = ground(x, z, _go);
      if (!basinStone && h > 1.1) continue;
      place(stones, i, x, Math.min(h, h > 0.9 ? pathCeil(x, z) : 1e9) + ht * 0.25, z, wd, ht, len, ry, 0, rz);
      sI[i * 4] = ph; i++; stonePlaced = i;
      if (i % 120 === 0) await ctx.yield();
    }
    stoneGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(sI, 4)); stones.count = Math.min(nStone, stonePlaced); scene.add(stones);
    await ctx.yield();

    // sage: 900 smooth mounds, green white graded to lavender grey beneath, leaning in a wind up the wash
    const nSage = Math.round(900 * thin), sageGeo = bakeC(new THREE.SphereGeometry(1, 8, 3, 0, Math.PI * 2, 0, Math.PI * 0.5), (x, y, z, nx, ny, nz) => 0.95 - 0.9 * y - 0.12 * nz);
    const sage = new THREE.InstancedMesh(sageGeo, instMat(R.sage, /* glsl */`
          float lean = .22 + .16 * sin(uT * 1.1 + aI.x * 6.2831853 + ctr.z * .06) + .1 * sin(uT * 2.3 + ctr.x * .3);
          float hh = max(p.y - ctr.y, 0.); p.z += lean * hh; p.y -= .12 * lean * hh;`, {}, 0.06, 0.5), 900); sage.name = 'sage';
    const gI = new Float32Array(900 * 4);
    let sagePlaced = 0;
    // (the wash's 520 deal from the 'sage' stream, the basin's 380 from a stream of their own; every value of a try is
    // drawn before the ground is asked)
    for (let i = 0, tries = 0; i < 900 && tries < 20000; tries++) {
      const inBasin = i >= 520, q = inBasin ? basinSageRng : sageRng, z = inBasin ? q.range(905, WALL_Z - 5) : q.range(-55, WASH_END + 40);
      const x = inBasin ? xCourse(z) + q.gauss() * 34 : q.range(-30, 30);
      const inBed = q() < 0.7, r = q.range(0.3, 1.0) * (q() < 0.25 ? 1 : 0.7), sy = r * q.range(0.6, 0.85), sz = r * q.range(0.9, 1.2), ry = q() * 6.28, ph = q();
      const h = ground(x, z, _go);
      if (!inBasin && (h > 9 || h < 0.25 && inBed)) continue;
      if (Math.abs(z - RING_Z) < 14 && Math.abs(x) < 60) continue;
      place(sage, i, x, Math.min(h, h > 0.9 ? pathCeil(x, z) : 1e9) - 0.05, z, r, sy, sz, ry);
      gI[i * 4] = ph; i++; sagePlaced = i;
      if (i % 120 === 0) await ctx.yield();
    }
    sageGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(gI, 4)); sage.count = Math.min(nSage, sagePlaced); scene.add(sage);
    await ctx.yield();

    // ---------------------------------------------------------------- twelve dead juniper snags: bleached twisted S-curves, no twigs
    // (each spot is [x, z, height, the S's phase, the lean's bearing]. The wash's seven after the first deal from the
    // 'snags' stream, the basin's three from a stream of their own and the one at the climb's foot from a stream of its
    // own; a try draws its six values, place and form, before the ground or the route is asked)
    const snagSpots = [[7.5, 210, 5.2, snagRng() * 6.28, snagRng() * 6.28]];
    for (let tries = 0; snagSpots.length < 12 && tries < 4000; tries++) {
      const k = snagSpots.length, r = k < 8 ? snagRng : k < 11 ? basinSnagRng : climbSnagRng, uz = r(), sg = r() < 0.5 ? -1 : 1, ud = r(), H = r.range(3, 6), ph = r() * 6.28, la = r() * 6.28;
      const z = k < 8 ? lerp(70, 385, uz) : k < 11 ? lerp(1060, 1150, uz) : lerp(430, 470, uz);
      const x = k < 8 ? sg * lerp(9, 30, ud) : k < 11 ? xCourse(z) + sg * lerp(11, 30, ud) : lerp(20, 60, ud);
      const h = ground(x, z, _go);
      if (k < 8 && (h < 1 || h > 11)) continue;
      if (path.nearestXZ(x, z).dist < 8.5 || snagSpots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 22) || Math.abs(z - RIB_Z) < 12) continue;
      snagSpots.push([x, z, H, ph, la]);
    }
    {
      const pos = [], cc = [], ww = [], idx = [], RS = 6, SG = 14;
      const limb = (bx, by, bz, H, r0, lean, ph, tw, bend) => {
        const base = pos.length / 3;
        for (let j = 0; j <= SG; j++) {
          const t = j / SG, s1 = Math.sin(6.283 * (0.85 * t) + ph), s2 = Math.cos(6.283 * (0.7 * t) + ph * 1.7);
          const cx = bx + (lean[0] * t + bend * s1 * t) * H, cz = bz + (lean[1] * t + bend * 0.8 * s2 * t) * H, cy = by + H * t * (1 - 0.12 * t), r = r0 * (Math.pow(1 - t, 0.8) * 0.9 + 0.1) * (1 + 0.18 * Math.sin(t * 9 + ph));
          for (let i = 0; i < RS; i++) {
            const a = (i / RS) * 6.283 + tw * t, ca = Math.cos(a), sa = Math.sin(a);
            pos.push(cx + ca * r * 1.2, cy, cz + sa * r * 0.85);
            cc.push(clamp(0.5 + 0.42 * Math.cos(a - tw * t * 2.2 - ph) + 0.12 * (1 - t), 0, 1)); ww.push(t * 1.6 + i * 0.08, 0, 1, 0);
          }
          if (j < SG) for (let i = 0; i < RS; i++) { const a = base + j * RS + i, b = base + j * RS + (i + 1) % RS, c2 = a + RS, d2 = b + RS; idx.push(a, c2, b, b, c2, d2); }
        }
      };
      snagSpots.forEach(([x, z, H, ph, la]) => {
        const y = ground(x, z, _go) - 0.3;
        limb(x, y, z, H, 0.06 * H, [0.2 * Math.cos(la), 0.2 * Math.sin(la)], ph, 4.5, 0.26);
        limb(x + 0.02 * H, y + 0.34 * H, z, H * 0.5, 0.034 * H, [0.2 * Math.cos(la + 0.9), 0.2 * Math.sin(la + 0.9)], ph + 2, -3.5, 0.24);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cc, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(ww, 4)); g.setIndex(idx);
      const snags = new THREE.Mesh(g, okMaterial('snag', { palette: P, amp: 0.1 })); snags.name = 'snags'; scene.add(snags);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- dry-wash threads: bone white ribbons along the bed (never under 1.5 px)
    {
      const pos = [], side = [], half = [], idx = [];
      const thread = (z0, z1, xf, hw) => {
        const base = pos.length / 3, n = Math.ceil((z1 - z0) / 3);
        for (let i = 0; i <= n; i++) {
          const z = z0 + (z1 - z0) * i / n, x = xf(z), dx = xf(z + 1) - x, l = Math.hypot(dx, 1);
          const e = Math.min(i, n - i) / 6, w = hw * Math.min(1, e) * (0.6 + 0.4 * Math.sin(z * 0.09 + x));
          const y0 = ground(x, z, _go), y = y0 + 0.22, inBed = 1 - sstep(0.7, 1.3, y0);
          for (const sg of [-1, 1]) { pos.push(x, y, z); side.push(sg / l, 0, -sg * dx / l); half.push(Math.max(w * inBed, 0)); }
          if (i < n) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
      };
      for (let k = 0; k < 6; k++) {
        const x0 = threadRng.range(-7, 7), a1 = threadRng.range(1.5, 4), p1 = threadRng() * 6.28, p2 = threadRng() * 6.28, l1 = threadRng.range(38, 70);
        thread(-70 + k * 9, WASH_END + 30 - k * 14, (z) => x0 + a1 * Math.sin(z / l1 + p1) + 1.2 * Math.sin(z / 17 + p2), threadRng.range(0.12, 0.22));
        await ctx.yield();
      }
      for (let k = 0; k < 4; k++) {
        const x0 = threadRng.range(-9, 9), a1 = threadRng.range(2, 5), p1 = threadRng() * 6.28, l1 = threadRng.range(40, 70);
        thread(940 + k * 22, WALL_Z - 4, (z) => xCourse(z) + 0.55 * (x0 + a1 * Math.sin(z / l1 + p1)) + 1.2 * Math.sin(z / 15 + p1 * 2), threadRng.range(0.12, 0.2));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3)); g.setAttribute('aHalf', new THREE.Float32BufferAttribute(half, 1)); g.setIndex(idx);
      const threads = new THREE.Mesh(g, okLineMaterial(look === 2 ? LAV : WHITE)); threads.name = 'washThreads'; threads.renderOrder = 1; threads.frustumCulled = false; scene.add(threads);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- ravens: a flat violet black shape, two long wing curves and a wedge
    const ravenGeo = (() => {
      const pos = [], inf = [];                                   // aB = (span fraction 0 body .. 1 tip, side -1/0/1, lavender edge)
      const tri = (a, b, c, edge) => { for (const v of [a, b, c]) { pos.push(v[0], 0, v[1]); inf.push(Math.min(Math.abs(v[0]) / 0.5, 1), Math.sign(v[0]), edge); } };
      const lead = (f) => 0.2 + 0.07 * Math.sin(Math.PI * f) - 0.4 * f * f, chord = (f) => 0.3 * Math.pow(1 - f, 0.75) + 0.015;
      const NS = 6;
      for (const s of [1, -1]) for (let j = 0; j < NS; j++) {
        const f0 = j / NS, f1 = (j + 1) / NS, x0 = s * (0.04 + 0.46 * f0), x1 = s * (0.04 + 0.46 * f1);
        const l0 = lead(f0), l1 = lead(f1), e0 = l0 - 0.045 * (1 - 0.6 * f0), e1 = l1 - 0.045 * (1 - 0.6 * f1), t0 = l0 - chord(f0), t1 = l1 - chord(f1);
        tri([x0, l0], [x1, l1], [x1, e1], 1); tri([x0, l0], [x1, e1], [x0, e0], 1);
        tri([x0, e0], [x1, e1], [x1, t1], 0); tri([x0, e0], [x1, t1], [x0, t0], 0);
      }
      const body = [[0, 0.5], [0.05, 0.3], [0.06, 0.05], [0.045, -0.25], [0.11, -0.56], [0, -0.5]];      // beak, head, shoulders, hips, wedge tail
      for (let i = 0; i < body.length - 1; i++) { const a = body[i], b = body[i + 1]; tri([0, a[1]], [a[0], a[1]], [b[0], b[1]], 0); tri([0, a[1]], [b[0], b[1]], [0, b[1]], 0); tri([0, a[1]], [-b[0], b[1]], [-a[0], a[1]], 0); tri([0, a[1]], [0, b[1]], [-b[0], b[1]], 0); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(inf, 3));
      return g;
    })();
    const ravenMat = new THREE.ShaderMaterial({
      uniforms: { uCol: { value: col(VB) }, uEdge: { value: mixc(LAV, VB, dusk ? 0.1 : 0.25) }, uT },
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`attribute vec3 aB; attribute vec4 aR; uniform float uT; varying float vE;
        void main(){
          // aR = (beat phase, beat rate, fold 0..1, amplitude)
          float f = aB.x, s = aB.y, fold = clamp(aR.z, 0., 1.);
          float th = aR.w * sin(uT * aR.y + aR.x - .9 * f) + .16 - 1.05 * fold;
          vec3 p = position;
          float span = abs(p.x) * (1. - .55 * fold);
          p.x = s * span * cos(th * f); p.y = span * sin(th) * f; p.z -= fold * .32 * f;
          vE = aB.z;
          gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(p, 1.);
        }`,
      fragmentShader: 'uniform vec3 uCol, uEdge; varying float vE; void main(){ gl_FragColor = vec4(mix(uCol, uEdge, step(.5, vE)), 1.); }',
    });
    const N_RAV = 40, ravens = new THREE.InstancedMesh(ravenGeo, ravenMat, N_RAV); ravens.name = 'ravens'; ravens.frustumCulled = false;
    const rAttr = new THREE.InstancedBufferAttribute(new Float32Array(N_RAV * 4), 4); rAttr.setUsage(THREE.DynamicDrawUsage);
    ravenGeo.setAttribute('aR', rAttr); ravens.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(ravens);
    // the nine on the ring bone's rim (the lower arc of the hole), then the three of the cast, then the rest
    const rim = [];
    for (let i = 0; i < 9; i++) {
      const a = (-158 + 136 * (i + 0.5 + birdRng.range(-0.3, 0.3)) / 9) * DEG, r = 15.2;
      rim.push({ a, p: new THREE.Vector3(Math.cos(a) * r, ENTRY_Y + Math.sin(a) * r, RING_Z - 6.5), u0: uRing * (0.06 + 0.1 * i + birdRng.range(0, 0.05)), side: Math.cos(a) < 0 ? -1 : 1, ph: birdRng() * 6.28, up: birdRng.range(5, 13), out: birdRng.range(0.3, 1) });
    }
    const amb = [];
    for (let i = 0; i < N_RAV - 12; i++) {
      const kind = i < 6 ? 'perch' : i < 14 ? 'wash' : i < 24 ? 'hero' : 'basin';
      let c;
      if (kind === 'perch') c = i < 4 ? new THREE.Vector3(DOOR_X + [-17, 9.5, 24, 41][i], wallH(DOOR_X + [-17, 9.5, 24, 41][i]) + 0.42, WZ + 1.4) : i === 4 ? new THREE.Vector3(snagSpots[0][0] + 0.9, groundY(snagSpots[0][0], snagSpots[0][1]) + 5.1, snagSpots[0][1] + 0.3) : new THREE.Vector3(DOOR_X - 13.2, rib.position.y + 23.6, RIB_Z + 0.6);
      else if (kind === 'wash') c = new THREE.Vector3(birdRng.pick([-1, 1]) * birdRng.range(10, 34), birdRng.range(27, 50), birdRng.range(120, 400));
      else if (kind === 'hero') { c = new THREE.Vector3(); for (let t = 0; t < 12; t++) { const uu = lerp(mAfter(uWashEnd, 41), mAfter(uCanalIn, -28), (i - 14 + heroRavenRng()) / 10), a = heroRavenRng() * 6.283, rr = heroRavenRng.range(17, 30); path.pointAt(uu, _p); c.set(_p.x + Math.cos(a) * rr, _p.y + heroRavenRng.range(-9, 12), _p.z + Math.sin(a) * rr); if (heroDist(c.x, c.y, c.z) > 17) break; } }      // along the climb and under the wing, a little off the route (their own stream: the tries hang on the route)
      else { const z = birdRng.range(1040, 1160); c = new THREE.Vector3(xCourse(z) + birdRng.pick([-1, 1]) * birdRng.range(12, 40), birdRng.range(15, 34), z); }
      const br = kind === 'hero' ? heroRavenRng : birdRng;
      amb.push({ kind, c, r: kind === 'hero' ? br.range(5, 9) : br.range(7, 16), w: br.pick([-1, 1]) * br.range(0.3, 0.55), ph: br() * 6.28, sz: br.range(1.2, 1.6) });
    }
    // the rare flock: three hundred, hidden by scale until their visit
    const N_FLOCK = 300, flock = new THREE.InstancedMesh(ravenGeo.clone(), ravenMat, N_FLOCK); flock.name = 'flock'; flock.frustumCulled = false;
    const fAttr = new THREE.InstancedBufferAttribute(new Float32Array(N_FLOCK * 4), 4); flock.geometry.setAttribute('aR', fAttr);
    flock.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const flockData = [];
    for (let i = 0; i < N_FLOCK; i++) {
      const a = birdRng() * 6.283, rr = Math.sqrt(birdRng());
      flockData.push({ delay: 0.55 * i / N_FLOCK + birdRng.range(0, 0.04), ox: Math.cos(a) * rr, oy: Math.sin(a) * rr, rise: birdRng.range(5, 17), sz: birdRng.range(1.1, 1.5), wob: birdRng() * 6.28 });
      fAttr.setXYZW(i, birdRng() * 6.28, birdRng.range(7, 10), 0, birdRng.range(0.5, 0.75));
      _m.makeScale(0, 0, 0); _m.setPosition(canalIn.x, canalIn.y, canalIn.z); flock.setMatrixAt(i, _m);
    }
    scene.add(flock);
    await ctx.yield();

    // ---------------------------------------------------------------- the hero's near marks along the pass
    // Sutures and nutrient holes laid on the bone wherever the route runs beside it (in under the tip, along the blade,
    // across the face to the canal's mouth): found from the route itself in space, so the marks are where the eye is
    // near on any seed. The stretch is bounded by the bone: it begins where the route first comes within 60 m of it (for
    // the rays, which reach further, within 90 m) and ends at the canal's mouth; one sample every 4.4 m (2.2 m).
    {
      const fld = hero.fieldAll, pl = new THREE.Vector3(), tl = new THREE.Vector3(), seeds = [], starts = [], g = [0, 0, 0];   // (the snapped tip's own surface included: its underside is over the eye as the pass begins)
      const grad = (p) => { const e = 0.5; g[0] = fld(p[0] + e, p[1], p[2]) - fld(p[0] - e, p[1], p[2]); g[1] = fld(p[0], p[1] + e, p[2]) - fld(p[0], p[1] - e, p[2]); g[2] = fld(p[0], p[1], p[2] + e) - fld(p[0], p[1], p[2] - e); const l = Math.hypot(g[0], g[1], g[2]) || 1; g[0] /= l; g[1] /= l; g[2] /= l; return g; };
      const proj = (p) => { for (let k = 0; k < 7; k++) { const d = fld(p[0], p[1], p[2]); grad(p); p[0] -= g[0] * d; p[1] -= g[1] * d; p[2] -= g[2] * d; } return p; };
      const SUT_W = 0.03;                                      // every pass suture's half width: a hairline 0.06 m across at its widest (the line shader keeps it 1.5 pixels wide where that is less)
      const Lr = path.length, dMouth = uCanalIn * Lr; let dNear = dMouth, dRay = dMouth;
      for (let d = uWashEnd * Lr; d < dMouth; d += 2.5) { path.posAtDist(d, pl); const c = heroDist(pl.x, pl.y, pl.z); if (c < 90 && d < dRay) dRay = d; if (c < 60) { dNear = d; break; } }
      const NS = Math.max(Math.round((dMouth - dNear) / 4.4), 1), u0 = dNear / Lr, u1 = uCanalIn;
      // (The pass's bands are the hero's own plain swell: the bone beside the route keeps the fold coordinate and the
      // swell coordinate the part baked, as everywhere else on it. A band is an eighth of its fold away from the eye; close to,
      // where the fold coordinate is stretched (uDeep), about a fifteenth.)
      // nothing of the pass is laid in the bore (it keeps its porcelain and the one winding suture the part gave it):
      // a mark is dropped if it would lie within 8 m of the bore's wall radius about the canal's axis, between the mouths
      const cA = hero.anchors.canalIn, cX = hero.anchors.canalAxis, cR = hero.anchors.canalRadius + 8, cLen = hero.anchors.canalOut.distanceTo(cA);
      const inBore = (p) => { const x = p[0] - cA.x, y = p[1] - cA.y, z = p[2] - cA.z, sx = x * cX.x + y * cX.y + z * cX.z; return sx > -6 && sx < cLen + 6 && Math.hypot(x - sx * cX.x, y - sx * cX.y, z - sx * cX.z) < cR; };
      // Blue stands in a hole only where the sky does: the line through the hole along the bone's own normal leaves the
      // bone within THIN metres (the bone is thin there, as before) and from there on meets no other part of the bone
      // and no ground, as far as SKY_FAR metres out or above everything that stands in this country (SKY_TOP: the
      // hero's crest is at about y 280). Any other hole is a hollow in the bone's lavender dark.
      const THIN = 17, SKY_FAR = 900, SKY_TOP = RIDGE_Y + 260, _sk = new THREE.Vector3();
      const skyThrough = (p, n) => {
        for (let t = THIN; t < SKY_FAR;) {
          const x = p[0] - n[0] * t, y = p[1] - n[1] * t, z = p[2] - n[2] * t, d = fld(x, y, z);
          if (d < 0) return false;
          _sk.set(x, y, z).applyMatrix4(hero.object.matrixWorld);
          if (_sk.y > SKY_TOP) return true;
          const up = _sk.y - ground(_sk.x, _sk.z, _go);
          if (up < 0) return false;
          t += Math.max(Math.min(d, 0.5 * up), 1.5);
        }
        return true;
      };
      for (let i = 0; i < NS; i++) {
        const uu = lerp(u0, u1, (i + markRng()) / NS);
        path.pointAt(uu, pl); path.tangentAt(uu, tl); pl.applyMatrix4(heroInv); tl.transformDirection(heroInv);
        // (every value of a try is drawn before the bone is asked, in the order the stream always dealt them)
        for (let k = 0; k < 3; k++) {
          const q = [pl.x + markRng.range(-27, 27), pl.y + markRng.range(-16, 27), pl.z + markRng.range(-27, 27)], r = 0.16 + 0.84 * Math.pow(markRng(), 1.7), keep = markRng() < 0.1;
          const p = proj(q);
          grad(p);
          const thin = fld(p[0] - g[0] * THIN, p[1] - g[1] * THIN, p[2] - g[2] * THIN) > 0;   // blue shows only where the bone is thin
          if ((thin || keep) && !inBore(p)) seeds.push({ p, r, thin: thin && skyThrough(p, g) ? 1 : 0 });
        }
        // the hairlines: few, long and calm, one slow S after another along the way we go
        if (i % 10 === 2) {
          const q = [pl.x + markRng.range(-14, 14), pl.y + markRng.range(-6, 16), pl.z + markRng.range(-14, 14)], dir = [tl.x + markRng.range(-0.5, 0.5), tl.y + markRng.range(-0.5, 0.5), tl.z + markRng.range(-0.5, 0.5)], len = 1.7 * markRng.range(44, 78), wave = 2.4 * markRng.range(26, 48);
          starts.push({ p: proj(q), dir, len, wob: 0.3, wave, w: SUT_W, step: 3 });
        }
        if (i % 2 === 1) await ctx.yield();
      }
      // and on the bone the eye is turned to all along the pass, far side as well as near: rays from the route, spread about
      // its heading, land the marks where they will be looked at (the nearer the hit, the smaller the hole may be)
      const NR = Math.max(Math.round((dMouth - dRay) / 2.2), 1), rl = new THREE.Vector3();
      for (let i = 0; i < NR; i++) {
        const uu = lerp(dRay / Lr, u1, (i + markRng()) / NR);
        path.pointAt(uu, pl); path.tangentAt(uu, tl); pl.applyMatrix4(heroInv); tl.transformDirection(heroInv);
        rl.set(tl.x + markRng.range(-0.7, 0.7), tl.y + markRng.range(-0.45, 0.6), tl.z + markRng.range(-0.7, 0.7)).normalize();
        const rr = markRng(), pick = markRng(), sa = markRng.range(-0.5, 0.5), sb = markRng.range(-0.5, 0.5), sc = markRng.range(-0.5, 0.5), sl = markRng.range(46, 84), sv = markRng.range(26, 48);
        let t = 7, hit = false;
        for (let k = 0; k < 44 && t < 150; k++) { const d = fld(pl.x + rl.x * t, pl.y + rl.y * t, pl.z + rl.z * t); if (d < 0.3) { hit = true; break; } t += Math.max(d, 0.6); }
        if (hit && !inBore([pl.x + rl.x * t, pl.y + rl.y * t, pl.z + rl.z * t])) {
          const p = proj([pl.x + rl.x * t, pl.y + rl.y * t, pl.z + rl.z * t]);
          grad(p);
          const thin = fld(p[0] - g[0] * THIN, p[1] - g[1] * THIN, p[2] - g[2] * THIN) > 0;
          if (thin || pick < 0.25) seeds.push({ p: p.slice(), r: clamp((0.3 + 0.7 * rr * rr) * (0.6 + t / 70), 0.2, 1), thin: thin && skyThrough(p, g) ? 1 : 0 });
          if (i % 10 === 1) starts.push({ p: p.slice(), dir: [tl.x + sa, tl.y + sb, tl.z + sc], len: 1.7 * sl, wob: 0.3, wave: 2.4 * sv, w: SUT_W, step: 3 });
        }
        if (i % 3 === 2) await ctx.yield();
      }
      const moreSut = new THREE.Mesh(await sutureRibbons(fld, starts, markRng, yieldFn), lineMat); moreSut.name = 'passSutures'; moreSut.renderOrder = 2; hero.object.add(moreSut);
      const moreHoles = new THREE.Mesh(await holeDecals(fld, seeds, markRng, yieldFn), holeMat); moreHoles.name = 'passHoles'; moreHoles.renderOrder = 3; hero.object.add(moreHoles);
      // One rule for the whole pass, from the snapped tip to the bore's mouth: no 10 m of the bone within HOLE_REACH
      // metres of the route is without a mark. The route is stepped every 2.5 m from the place the bone first comes
      // within HOLE_REACH of it; at each step HOLE_RAYS lines go out from the eye's place, evenly by chance over every
      // direction, and where one meets the bone within HOLE_REACH and no mark (a suture or a hole, the part's own and
      // the pass's, as built) lies within HOLE_GAP metres of that place, an oval hole is opened there: 0.3 to 2 m
      // across by the scatter's own law of sizes, made smaller where the bone is too curved to take it. Nothing is
      // taken away; none in the bore. A stream of its own; a step's values are all drawn before the bone is asked.
      {
        const HOLE_REACH = 25, HOLE_GAP = 4, HOLE_RAYS = 96, holeRng = ownRng('passHoles'), marks = new Map(), more = [], rays = new Float32Array(HOLE_RAYS * 4), t1 = [0, 0, 0], t2 = [0, 0, 0];
        // (the marks are kept by the cells of a lattice HOLE_GAP wide, so that a place asks only its own cell and the 26 about it)
        const mk = (x, y, z) => (Math.floor(x / HOLE_GAP) + 512) * 1048576 + (Math.floor(y / HOLE_GAP) + 512) * 1024 + Math.floor(z / HOLE_GAP) + 512;
        const mark = (x, y, z) => { const k = mk(x, y, z), l = marks.get(k); if (l) l.push(x, y, z); else marks.set(k, [x, y, z]); };
        const marked = (p) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const l = marks.get(mk(p[0] + a * HOLE_GAP, p[1] + b * HOLE_GAP, p[2] + c * HOLE_GAP)); if (l) for (let q = 0; q < l.length; q += 3) { const dx = l[q] - p[0], dy = l[q + 1] - p[1], dz = l[q + 2] - p[2]; if (dx * dx + dy * dy + dz * dz < HOLE_GAP * HOLE_GAP) return true; } } return false; };
        const lines = (geo) => { const a = geo.attributes.position; for (let i = 0; i < a.count; i += 2) mark(a.getX(i), a.getY(i), a.getZ(i)); };
        const ovals = (geo) => { const a = geo.attributes.position; for (let i = 0; i + 3 < a.count; i += 4) mark((a.getX(i) + a.getX(i + 2)) / 2, (a.getY(i) + a.getY(i + 2)) / 2, (a.getZ(i) + a.getZ(i + 2)) / 2); };
        lines(moreSut.geometry); ovals(moreHoles.geometry);
        hero.object.traverse((o) => { if (o.name === 'sutures') lines(o.geometry); else if (o.name === 'nutrientHoles') ovals(o.geometry); });
        const flat = (p, n, ra) => {                               // the bone lies within a tenth of the oval's reach of its own tangent plane all round the place
          const a = Math.abs(n[1]) < 0.9 ? 1 : 0; t1[0] = a ? -n[2] : 0; t1[1] = a ? 0 : -n[2]; t1[2] = a ? n[0] : n[1]; const l = Math.hypot(t1[0], t1[1], t1[2]) || 1; t1[0] /= l; t1[1] /= l; t1[2] /= l;
          t2[0] = n[1] * t1[2] - n[2] * t1[1]; t2[1] = n[2] * t1[0] - n[0] * t1[2]; t2[2] = n[0] * t1[1] - n[1] * t1[0];
          for (let k = 0; k < 8; k++) { const c = Math.cos(k * 0.7854) * ra, s = Math.sin(k * 0.7854) * ra; if (Math.abs(fld(p[0] + t1[0] * c + t2[0] * s, p[1] + t1[1] * c + t2[1] * s, p[2] + t1[2] * c + t2[2] * s)) > 0.1 * ra) return false; }
          return true;
        };
        // where a line from (ox, oy, oz) along (rx, ry, rz) meets the bone within HOLE_REACH, in metres from its start (or -1)
        const meet = (ox, oy, oz, rx, ry, rz, t0) => { let t = t0; for (let k = 0; k < 40 && t < HOLE_REACH; k++) { const dd = fld(ox + rx * t, oy + ry * t, oz + rz * t); if (dd < 0.1) return t; t += Math.max(dd, 0.3); } return -1; };
        let began = false;
        const holeStep = (d) => {                                 // (one step of the route; a function of its own so the engine compiles it)
          path.posAtDist(d, pl).applyMatrix4(heroInv);
          const free = fld(pl.x, pl.y, pl.z), open = free >= HOLE_REACH;   // no bone within reach of this step: its lines are drawn all the same, and none is cast
          if (!began && open) return;
          began = true;
          for (let j = 0; j < HOLE_RAYS; j++) { const cz = 1 - 2 * holeRng(), a = 6.2831853 * holeRng(), sn = Math.sqrt(Math.max(1 - cz * cz, 0)); rays[j * 4] = sn * Math.cos(a); rays[j * 4 + 1] = cz; rays[j * 4 + 2] = sn * Math.sin(a); rays[j * 4 + 3] = 0.16 + 0.84 * Math.pow(holeRng(), 1.7); }
          for (let j = 0; j < HOLE_RAYS && !open; j++) {
            const rx = rays[j * 4], ry = rays[j * 4 + 1], rz = rays[j * 4 + 2];
            const t = meet(pl.x, pl.y, pl.z, rx, ry, rz, 0.8 * free);   // (no bone is nearer the eye than `free`: the line is walked from within that)
            if (t < 0) continue;
            const p = [pl.x + rx * t, pl.y + ry * t, pl.z + rz * t];
            if (inBore(p) || marked(p)) continue;                  // (asked of the place the line met the bone, a hand's breadth off its surface)
            proj(p);
            grad(p); const n = g.slice();
            let r = rays[j * 4 + 3]; while (r > 0.16 && !flat(p, n, 2.1 * r)) r = Math.max(0.6 * r, 0.16);
            if (!flat(p, n, 2.1 * r)) continue;
            const thin = fld(p[0] - n[0] * THIN, p[1] - n[1] * THIN, p[2] - n[2] * THIN) > 0;
            more.push({ p, r, thin: thin && skyThrough(p, n) ? 1 : 0 }); mark(p[0], p[1], p[2]);
          }
        };
        for (let d = uWashEnd * Lr, step = 0; d <= dMouth; d += 2.5) {
          holeStep(d);
          if (++step % 2 === 0) await ctx.yield();
        }
        const passHoles2 = new THREE.Mesh(await holeDecals(fld, more, holeRng, yieldFn), holeMat); passHoles2.name = 'passHolesMore'; passHoles2.renderOrder = 3; hero.object.add(passHoles2);
      }
      // the rib's own marks, on the side we come to it from: two more hairlines and a scatter of small holes up its foot
      const ribSut2 = new THREE.Mesh(await sutureRibbons(ribField, [
        { p: [13.4, 1.5, -2.2], dir: [0.25, 1, 0.1], len: 21, wob: 0.5, wave: 9, w: 0.045, step: 0.7 },
        { p: [7, 21.5, -1.8], dir: [-1, 0.25, 0], len: 19, wob: 0.45, wave: 8, w: 0.04, step: 0.7 },
      ], ribMarkRng, yieldFn), lineMat); ribSut2.position.copy(rib.position); ribSut2.renderOrder = 2; scene.add(ribSut2);
      const ribSeeds = [];
      for (let i = 0; i < 16; i++) { const t = ribMarkRng(); ribSeeds.push({ p: [12.6 + ribMarkRng.range(-2.6, 2.6) - 1.5 * t * t, -1 + 19 * t, -2.6], r: ribMarkRng.range(0.1, 0.34), thin: 0 }); }
      const ribHoles = new THREE.Mesh(await holeDecals(ribField, ribSeeds, ribMarkRng, yieldFn), holeMat); ribHoles.position.copy(rib.position); ribHoles.renderOrder = 3; scene.add(ribHoles);
      await ctx.yield();
    }

    // ---------------------------------------------------------------- motion
    const L = path.length, _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _cam = new THREE.Vector3(), _size = new THREE.Vector2();
    const UP = new THREE.Vector3(0, 1, 0);
    // A bird is a flat shape shown in plan, as she painted it: its plane leans toward the eye by `face` (0 = level in the
    // world, 1 = square to the eye) and its head points along its travel as seen in that plane.
    const _n = new THREE.Vector3(), _t = new THREE.Vector3();
    const setBird = (mesh, i, pos, fwd, up, s, face = 0) => {
      _n.copy(up).normalize();
      if (face > 0) { _t.copy(_cam).sub(pos); if (_t.lengthSq() > 1e-6) _n.multiplyScalar(1 - face).addScaledVector(_t.normalize(), face).normalize(); }
      _z.copy(fwd).addScaledVector(_n, -fwd.dot(_n));
      if (_z.lengthSq() < 0.12 * Math.max(fwd.lengthSq(), 1e-8)) { _t.set(0, 1, 0).addScaledVector(_n, -_n.y); _z.addScaledVector(_t, 0.7 * fwd.length()); }
      if (_z.lengthSq() < 1e-8) _z.set(0, 0, 1); _z.normalize();
      _x.crossVectors(_n, _z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
      _m.makeBasis(_x, _y, _z); _m.scale(_s.set(s, s, s)); _m.setPosition(pos); mesh.setMatrixAt(i, _m);
    };
    const uPass = mAfter(uWing, -12);                          // where the three overtake: 12 m of the pass before its last station, the blade still over the eye as the first bird comes level
    // the cast's keys, each a place of the route and metres from it
    const uSeen = mAfter(uPass, -41), uLevelA = mAfter(uPass, -17), uLevelB = mAfter(uPass, 8), uAheadB = mAfter(uPass, 55), uShootA = mAfter(uPass, 48), uShootB = mAfter(uCanalIn, 14);
    const uCloseA = mAfter(uCanalIn, -28), uOpenB = mAfter(uCanalOut, 69), uFoldA = mAfter(uCanalOut, 17), uFallB = mAfter(uCanalOut, 97), uUnfoldA = mAfter(uLevel, -83), uUnfoldB = mAfter(uLevel, -21), uDropEnd = mAfter(uLevel, -41);
    // over the wall: the three begin to rise and to pull away where the eye comes out under the deck (where the route
    // sinks below the bellies of the last rank it passes through: the wall stands whole ahead from there); they have
    // their full lead as the eye passes the rib's foot.
    const DECK_BELLY = DECK_Y - 0.62 * 3.5 - 0.7;              // (an oval's belly: 0.62 of its half height of 3.5 m under its centre, which stands up to 0.7 m under DECK_Y)
    let iUnder = Math.round(uDeck * NPS); while (iUnder < NPS && psy[iUnder] > DECK_BELLY) iUnder++;
    const LEAD_DONE = WALL_Z - RIB_Z, RISE_FROM = (1 - iUnder / NPS) * path.length;
    const castPh = [0, 1, 2].map(() => [castRng() * 6.2832, castRng() * 6.2832]);   // each bird's own wing beat and bob phase
    const bandPh = bandRng();                                  // where in its loop the band slide starts (in band widths)
    const castOff = [[2.5, -0.35, 0], [-4.2, 1.6, -7], [5.6, 2.6, -13]];
    // The three keep the design's span for the whole flight (CAST_SPAN: "wings 1.3 m across"; no size cue). Each is a
    // place on the route a number of metres ahead of the eye (castLead, and its own offset), so each flies its own
    // course in the world. CAST_LEAD is the lead they have won by the bore; in the bore's far half they fold and we
    // come up on them, until at the far mouth the last of the three is DROP_HOLD metres ahead of the eye (more than
    // twice the design's nearest, 2.5 m, which no bird ever comes within); from the far mouth to the drop's end the
    // lead only grows, back to CAST_LEAD, and under the deck they pull away for good.
    const CAST_SPAN = 1.3, CAST_LEAD = -30 + 35 + 5 + 24, DROP_HOLD = 6, DROP_NEAR = CAST_LEAD + castOff[2][2] - DROP_HOLD;
    const castLead = (u) => -30 + 35 * sstep(uLevelA, uLevelB, u) + 5 * sstep(uLevelB, uAheadB, u) + 24 * sstep(uShootA, uShootB, u)
      - DROP_NEAR * sstep(uCanalMid, uCanalOut, u) + DROP_NEAR * 0.5 * (sstep(uFoldA, uFallB, u) + sstep(uCanalOut, uDeck, u))
      + 80 * (1 - sstep(LEAD_DONE, RISE_FROM, (1 - u) * L));
    // Falling, each bird is on the line we fall along, at its own station ahead. The design: "they go through the canal
    // ahead of us, fold and fall through the clouds, and we fall after them": the line we fall along is the line they
    // fall along, and a bird is a place on it ahead by metres flown. As it folds a bird sinks FOLD_SINK metres under
    // its line (4, 6 and 8 m: the fall begins while we are still coming out of the bore); once we have pitched over
    // after them its lift, DROP_LIFT, is that same height in metres over its own station, whatever its lead, so that
    // while they fall each of the three stands at its own place in the three about the route's line (castOff: 0.35 m
    // under it, 1.6 and 2.6 m over it), inside the open lane and under the ovals that pass overhead.
    const FOLD_SINK = [4, 6, 8], DROP_LIFT = FOLD_SINK;
    // The rise over the wall is done, the three RISE_H metres over their line (y 40: 14 m over the wall's 26 m top),
    // when the first of them is still WALL_MARGIN metres short of the wall's face: a door's width, so none of the three
    // (the others fly 7 and 13 m behind it) climbs across the face of the wall. RISE_DONE is the eye's distance from
    // the wall at that moment, found from the first bird's own lead on this route, stepping the route by half a metre.
    const RISE_H = 31, WALL_MARGIN = 12;
    let RISE_DONE = LEAD_DONE; for (let t = RISE_FROM; t > LEAD_DONE; t -= 0.5) if (castLead(1 - t / L) >= t - WALL_MARGIN) { RISE_DONE = t; break; }
    const mesaAz0 = MESA_AZ0, mesaAzCanal = Math.atan2(axisW.x, axisW.z);   // the canal's own heading: the mesa at the bottom of the round
    const mesaAz = (u) => {
      path.pointAt(Math.max(u, uLevel), _a);
      const end = Math.max(Math.atan2(DOOR_X - WALL_LOW - _a.x, WALL_Z - _a.z), -40 * DEG);
      return mesaAz0 + (mesaAzCanal - mesaAz0) * sstep(uWashEnd, uCanalIn, u) + (end - mesaAzCanal) * sstep(uCanalOut, uLevel, u);
    };
    const rimPos = (b, s, out) => out.set(
      b.p.x * (1 - 0.5 * sstep(0, 30, s)) + b.side * b.out * (2 * sstep(20, 90, s) + Math.max(s - 190, 0) * 0.45),
      b.p.y + b.up * sstep(0, 34, s) - 9 * sstep(50, 170, s) + Math.max(s - 190, 0) * 0.14 + 0.8 * Math.sin(s * 0.07 + b.ph),
      b.p.z + s + 2.5 * sstep(0, 3, s));
    const uR0 = mAfter(uWingIn, -41), uR1 = mAfter(uCanalIn, -55), uFlockEnd = mAfter(uR0, -83);   // the rare flock: from 41 m before the break until 55 m before the mouth; it pours back along the route to 83 m before where we met it
    let flockLive = false;
    // The bore's three swells go round its axis by the clock alone: BORE_TURN radians a second, a forty-eighth of a turn
    // (one band width: three swells of sixteen bands) for each loop of the slide's slow loop, whose rate is the 0.22 of
    // a loop a second that the line setting uOkPhase below gives the clock. Toward the rising angle, the way the bore's
    // slide travels round. It reads no share of the flight, no eye and no seed.
    const BORE_TURN = 6.2831853 * 0.22 / 48, boreTurn = hero.object.getObjectByName('backBone').material.uniforms.uBoreTurn;
    const update = (dt, time, camera, u) => {
      okUniforms.uOkPhase.value = 2.5 * u + time * 0.22 + bandPh;   // the medium: 2.5 u plus a slow loop with no start
      boreTurn.value = time * BORE_TURN;
      uT.value = time; uU.value = u;
      ctx.renderer.getDrawingBufferSize(_size); okUniforms.uOkViewH.value = _size.y;
      _cam.setFromMatrixPosition(camera.matrixWorld); dome.position.copy(_cam);
      skyMat.uniforms.uMesaAz.value = mesaAz(u);
      // the nine on the rim lift as we pass, fly ahead up the wash and peel off over the hills
      for (let i = 0; i < 9; i++) {
        const b = rim[i], s = Math.max(u - b.u0, 0) * L * 0.86;
        if (s <= 0) { _a.set(-Math.cos(b.a) * 0.25, -Math.sin(b.a), 0); setBird(ravens, i, b.p, _a, _b.set(0, 0, -1), 1.5); rAttr.setXYZW(i, b.ph, 0, 1, 0); continue; }
        rimPos(b, s, _a); rimPos(b, s + 1.5, _b); _b.sub(_a);
        const gone = 1 - sstep(520, 640, s);
        _c.set(0, 1, 0).lerp(_y.set(0, 0, -1), 1 - sstep(0, 4, s)).normalize();
        setBird(ravens, i, _a, s < 3 ? _b.lerp(_x.set(-Math.cos(b.a) * 0.25, -Math.sin(b.a), 0.2), 1 - s / 3) : _b, _c, 1.6 * gone, 0.75 * sstep(2, 8, s));
        rAttr.setXYZW(i, b.ph, 7.5, 1 - sstep(0, 5, s), 0.75);
      }
      // the three of the cast: overtake under the wing, lead through the canal, fold and fall, rise over the wall
      const toWall = (1 - u) * L;                             // metres of route left to the wall
      const dropWin = sstep(uFoldA, uFallB, u) * (1 - sstep(uDeck, uDropEnd, u));
      const lead = castLead(u);                               // falling, they are close ahead of us on our own line: we fall after them
      const fold = sstep(uFoldA, uOpenB, u) * (1 - sstep(uUnfoldA, uUnfoldB, u));
      const overWall = RISE_H * (1 - sstep(RISE_DONE, RISE_FROM, toWall));
      for (let k = 0; k < 3; k++) {
        const o = castOff[k], d = u * L + lead + o[2], near = 1 - 0.6 * sstep(uCloseA, uCanalIn, u) * (1 - sstep(uCanalOut, uOpenB, u));
        path.posAtDist(d, _a); path.tangentAtDist(d, _b);
        _x.set(_b.z, 0, -_b.x).normalize();
        const behindWall = sstep(WALL_Z + 2, WALL_Z + 14, _a.z);
        _a.addScaledVector(_x, o[0] * near * (1 - 0.45 * dropWin)).y += o[1] * near - fold * FOLD_SINK[k] + DROP_LIFT[k] * dropWin + overWall * (1 - 0.8 * behindWall) + 0.25 * Math.sin(time * 1.3 + castPh[k][1]);
        _b.y += -0.5 * fold + 0.5 * (overWall > 1 && overWall < RISE_H - 1 ? 1 : 0) * (1 - behindWall);
        setBird(ravens, 9 + k, _a, _b, UP, u > uSeen ? CAST_SPAN : 0, 0.8);
        rAttr.setXYZW(9 + k, castPh[k][0], 5.2, fold * (1 - 0.35 * dropWin), 0.7);
      }
      // the rest: circling the wash, the wing and the basin; six perched
      for (let i = 0; i < amb.length; i++) {
        const b = amb[i], n = 12 + i;
        if (b.kind === 'perch') { setBird(ravens, n, b.c, UP, _b.set(0, 0, -1), 1.45); rAttr.setXYZW(n, b.ph, 0, 1, 0); continue; }
        const th = b.ph + time * b.w * 5.5 / b.r * 2 + u * 9 * Math.sign(b.w);
        _a.set(b.c.x + Math.cos(th) * b.r, b.c.y + 1.6 * Math.sin(th * 0.7 + b.ph), b.c.z + Math.sin(th) * b.r * 1.4);
        _b.set(-Math.sin(th) * Math.sign(b.w), 0.1 * Math.cos(th * 0.7 + b.ph), Math.cos(th) * 1.4 * Math.sign(b.w));
        _c.set(Math.cos(th) * -0.35, 1, Math.sin(th) * -0.35);
        setBird(ravens, n, _a, _b, _c, b.sz, 0.7); rAttr.setXYZW(n, b.ph, 6.5, 0, 0.6);
      }
      ravens.instanceMatrix.needsUpdate = true; rAttr.needsUpdate = true;
      // the rare visit: three hundred pour out of the canal toward us and are gone overhead before we enter
      if (rare) {
        const q = (u - uR0) / Math.max(uR1 - uR0, 1e-4), live = q > 0 && q < 1.02;
        if (live || flockLive) {
          for (let i = 0; i < N_FLOCK; i++) {
            const f = flockData[i], s = clamp((q - f.delay) / 0.45, 0, 1);
            if (!live || s <= 0 || s >= 1) { _m.makeScale(0, 0, 0); flock.setMatrixAt(i, _m); continue; }
            const v = lerp(uCanalMid, uFlockEnd, s), sp = lerp(4.5, 15, sstep(0.08, 0.5, s));
            path.pointAt(v, _a); path.tangentAt(v, _b);
            _x.set(_b.z, 0, -_b.x).normalize();
            _a.addScaledVector(_x, f.ox * sp).y += f.oy * sp * 0.6 + f.rise * sstep(0.12, 0.6, s) + 0.6 * Math.sin(time * 2 + f.wob);
            _b.negate(); _b.y += 0.25 * sstep(0.1, 0.5, s) * (1 - sstep(0.6, 0.9, s));
            setBird(flock, i, _a, _b, UP, f.sz * sstep(0, 0.04, s) * (1 - sstep(0.93, 1, s)), 0.8);
          }
          flock.instanceMatrix.needsUpdate = true; flockLive = live;
        }
      }
    };
    update(0, 0, { matrixWorld: new THREE.Matrix4().setPosition(path.start) }, 0);

    const heroCentre = toWorld(hero.center), gapW = toWorld(hero.anchors.gapStarboard);
    const uPaceA = mAfter(uRing, 69), uPaceB = mAfter(uWashEnd, -28), uPaceC = mAfter(uWashEnd, 55), uPaceD = mAfter(uWingIn, -83), uPaceD1 = mAfter(uWingIn, -path.length / 64), uPaceE = mAfter(uCanalOut, path.length / 64), uPaceF = mAfter(uCanalOut, 69), uPaceG = mAfter(uLevel, -97);
    // (uPaceD1: the slowing to the linger is done one step of the engine's pace table before the first station, so the
    // table's straight piece has come down to the linger's own value where the blade begins: from the first station
    // to the canal's near rim the flight is at the linger's pace, under 18 m/s.)
    // (uPaceE: the speeding up for the drop begins one step of the engine's pace table, a 64th of the route, about 24 m,
    // past the far mouth's centre: the engine draws its pace as straight pieces between the table's places, so a ramp
    // begun at the mouth itself would already be felt inside the bore)
    const PACE_LINGER = 0.46;                                  // (the linger's pace value; the design's 0.55 lowered so that at 50 s the blade to the far mouth is flown at 16 to 18 m/s)
    const GAZE_AHEAD = 90, RIM_PAST = 8, GAP_FADE = 44, _eye = new THREE.Vector3(), _gz = { p: new THREE.Vector3(), n: new THREE.Vector3(), t: new THREE.Vector3() };
    // The look along the wing: its aim is the place on the blade's line GAZE_AHEAD metres further in than the eye's own
    // station on that line, and past the line's end the root end is held (bladeAt). The eye's station is a continuous
    // number of metres of the blade's own length: the nearest place ON the line to the eye, found between its points,
    // and from the first station of the pass on it never goes back and never goes forward by more of the blade's
    // length than the metres flown since (a metre of blade for a metre of route at most), so where the nearest place
    // leaps from one part of the blade to another (across the hero's face, from the blade's middle to its root end) the
    // station walks there with the metres flown. It is laid once, at every GAZE_STEP of the route from the first
    // station to the place the look along the wing ends (uGazeEnd), and read between those places.
    const GAZE_STEP = 0.5, uGazeEnd = mAfter(uOfPoint(runIn.x, runIn.y, runIn.z), -25), gazeD0 = uWingIn * path.length, gazeSt = new Float32Array(Math.ceil((uGazeEnd * path.length - gazeD0) / GAZE_STEP) + 2);
    { const ab = V3(), ae = V3();
      const bladeNear = (e) => {                               // the nearest place on the blade's line to e, in metres along it
        let bs = 0, bd = 1e18;
        for (let i = 0; i < bladeW.length - 1; i++) { const a = bladeW[i].p; ab.subVectors(bladeW[i + 1].p, a); const f = clamp(ae.subVectors(e, a).dot(ab) / Math.max(ab.lengthSq(), 1e-9), 0, 1), d = ae.addScaledVector(ab, -f).lengthSq(); if (d < bd) { bd = d; bs = lerp(bladeS[i], bladeS[i + 1], f); } }
        return bs;
      };
      for (let i = 0; i < gazeSt.length; i++) { const s = bladeNear(path.posAtDist(gazeD0 + i * GAZE_STEP, _eye)); gazeSt[i] = i === 0 ? s : clamp(s, gazeSt[i - 1], gazeSt[i - 1] + GAZE_STEP); } }
    const wingGaze = (time, u) => {
      const m = clamp((u * path.length - gazeD0) / GAZE_STEP, 0, gazeSt.length - 1.001), i = Math.floor(m);
      return bladeAt(lerp(gazeSt[i], gazeSt[i + 1], m - i) + GAZE_AHEAD, _gz).p;
    };
    // The look over to the blade. Up the climb the eye is on the gap of sky under the starboard wing; from uCrest, the
    // place where it has risen above the nearest pleat crests, the aim leaves the gap's middle for the bone and moves
    // along it to the place the gaze along the wing holds as the pass begins (wingAim: on the blade's underside,
    // GAZE_AHEAD in from the snapped tip), where it arrives as the eye comes under the first station. Its way is laid
    // once: from the gap's middle to the nearest point of the gap's rim (aimWay[1]: up and out, where the strut meets
    // the wing), then over the bone's own surface (the line from there to wingAim, a point every AIM_STEP, each put
    // onto the surface along the field's gradient) to wingAim. No jump anywhere, and from the first station on the aim
    // is the wing gaze's own. It moves by metres flown: to the rim over the first AIM_RIM metres past uCrest (two
    // look-aheads), and along the bone from half way through those to the first station, each slow at both ends.
    const wingAim = wingGaze(0, uWingIn).clone(), aimWay = [gapW.clone()], aimLen = [0], AIM_STEP = 4, AIM_RIM = 44, _g3 = V3();
    { const q = gapW.clone(), e = 0.6;
      const onto = (q) => { for (let it = 0; it < 5; it++) { const d = heroDist(q.x, q.y, q.z); _g3.set(heroDist(q.x + e, q.y, q.z) - d, heroDist(q.x, q.y + e, q.z) - d, heroDist(q.x, q.y, q.z + e) - d); if (_g3.lengthSq() < 1e-8 || Math.abs(d) < 0.05) break; q.addScaledVector(_g3.normalize(), -d); } return q; };
      const rim = onto(q).clone(), n = Math.max(Math.ceil(rim.distanceTo(wingAim) / AIM_STEP), 1);
      for (let i = 0; i <= n; i++) { q.copy(rim).lerp(wingAim, i / n); if (i > 0 && i < n) onto(q); aimLen.push(aimLen[aimLen.length - 1] + q.distanceTo(aimWay[aimWay.length - 1])); aimWay.push(q.clone()); } }
    const _aim = new THREE.Vector3(), aimGo = (uWingIn - uCrest) * path.length;                       // (aimGo: metres of route from uCrest to the first station)
    const climbAim = (time, u) => {
      if (u >= uWingIn) return wingGaze(time, u); if (u <= uCrest) return gapW;
      const m = (u - uCrest) * path.length, s = aimLen[1] * sstep(0, AIM_RIM, m) + (aimLen[aimLen.length - 1] - aimLen[1]) * sstep(AIM_RIM / 2, Math.max(aimGo, AIM_RIM), m); let i = 1; while (i < aimLen.length - 1 && aimLen[i] < s) i++;
      return _aim.copy(aimWay[i - 1]).lerp(aimWay[i], clamp((s - aimLen[i - 1]) / Math.max(aimLen[i] - aimLen[i - 1], 1e-6), 0, 1));
    };
    return {
      scene, path, duration: 50,
      // pace: the design's values (1.2 in the wash, 0.55 from the wing to the canal's far mouth, 1.6 in the drop, 1 for the
      // level run), each ramp between a place of the route and metres from it
      pace: (u) => 0.72 + 0.48 * sstep(uRing, uPaceA, u) - 0.12 * sstep(uPaceB, uPaceC, u) - (1.08 - PACE_LINGER) * sstep(uPaceD, uPaceD1, u)
        + (1.6 - PACE_LINGER) * sstep(uPaceE, uPaceF, u) - 0.6 * sstep(uPaceG, uLevel, u),
      camera: { fov: 60, near: 0.3, far: 10500, lookAhead: 22, sway: 0.5, bank: 0.8 },
      pois: [
        { at: heroCentre, from: mAfter(uRing, 18), to: uWashEnd, weight: 0.3 },      // from where the ring bone's back rim has passed (its depth, 18 m, past its centre)
        // the gap of sky under the starboard wing, and from uCrest the look over to the blade (climbAim: one aim, one
        // pull): from 14 m before the wash's end to the first station, where the aim has come to the wing gaze's own, at
        // full weight GAP_FADE metres in from each end (twice the camera's look-ahead)
        { at: climbAim, from: mAfter(uWashEnd, -14), to: uWingIn, weight: 0.85, fade: GAP_FADE / ((uWingIn - mAfter(uWashEnd, -14)) * path.length) },
        // along the wing: the eye looks to a point on the underside's own centre line, GAZE_AHEAD metres further in than
        // its own station on that line (toward the wing's root and the canal's mouth), from one lead-in before the lead-in
        // point (where the gap gaze begins to let go), across the hero's face, until the turn onto the canal's axis is
        // nearly flown (25 m of the turn before the run-in point, 42 degrees of it left, as it was built: the
        // look-ahead of 22 m reaches the run-in from there and the route's own heading has the mouth); the engine's own fade
        // (before the first station its aim is the entry's above: where the two overlap they pull to one place)
        { at: climbAim, from: mAfter(uLeadIn, -LEAD_IN), to: uGazeEnd, weight: 0.6 },
        // over the edge the eye stays on the far country while it is above the deck, then on the door
        // (it begins RIM_PAST metres past the far mouth's centre: the bore's lip, the bone within 10 m of the bore's wall,
        // reaches 6.5 m past that centre, so the rim is behind the eye; inside the bore the eye looks along the rising axis)
        { at: new THREE.Vector3(DOOR_X, 30, 1700), from: mAfter(uCanalOut, RIM_PAST), to: mAfter(uDeck, -14), weight: 0.8 },
        { at: new THREE.Vector3(DOOR_X, END_Y, WALL_Z), from: mAfter(uDeck, -48), to: uLevel, weight: 0.7 },
      ],
      portal: { shape: 'rect', width: 12, height: 14, color: LAV, glow: 0, halo: false, frame: 0, veil: dusk ? VB : SKY, blendDistance: 25, revealDistance: 420 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
