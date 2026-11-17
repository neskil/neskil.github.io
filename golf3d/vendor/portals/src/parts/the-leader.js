// THE LEADER: hero set piece "a stepped leader caught halfway down, and the rain it is seen through".
//
// WHAT     1. THE TREE. A seeded stepped leader: a trunk leaning down out of the cloud, the SHIP LIMB that runs out over
//             the sea to the schooner's foremast, three DIVE LIMBS laid one after the other on THE STATION (below),
//             30-80 forking branches, dead-end twigs and kink twigs.
//             EVERY CHANNEL IS A CHAIN OF STRAIGHT STEPS JOINED AT HARD KINKS (makeGrower.chain: each step turns 21-62
//             degrees from the one before it, never a right angle, never back on itself and never on in one line;
//             steps are 8-45 m, shorter down the tree, with a steady downward drift; the plane of each kink is the
//             chain's own draw).
//             THE MARGIN, one rule in space along the whole flight line (the curve the camera flies, sampled every
//             2.5 m): no channel but the trunk and the brief's designed corona tips (the low limb where it is
//             overtaken, the rare stray) comes within 23 m of the line (the grower refuses the step; a backstop walks
//             every step 2 m at a time and ends a channel that would come in), and NO STEP IS LONGER THAN 0.26 OF ITS
//             DISTANCE TO THE LINE, at either end, nor shorter than the brief's 8 m (a kink twig: 3 m): from the line
//             no step spans more than fifteen degrees, under a quarter of the picture's height in its middle, but for
//             the 8 m steps within 31 m of the line. The trunk is the exception the brief makes: the corkscrew is
//             flown round it from 12-20 m out, so it passes nearer, in 8 m steps.
//             KINK TWIGS (an amendment of the brief, by the designers' ruling): at a seeded share of the kinks, half,
//             the whole tree over, one straight step of 3-8 m leaves the kink in its own direction; cooler and
//             dimmer than the channel that bears it, live while that channel is, rose with it when it loses.
//             THE STATION AND THE DIVE LIMBS (an amendment of the brief, by the designers' ruling; makeStation): the
//             leading limb's tip stands 19 degrees below the lens and 66-94 m from it, the trunk 30 to 45
//             degrees to the right of it by its own axis (as grown it wanders up to 9 m off that axis), and so is laid at our speed and sinks at our rate: THE ONE PACING OF THIS
//             WORLD BY METRES FLOWN, with no hold in it. 'dive0' leaves the trunk under the cloud base at the entry's
//             first knot (T 1) and leads to T 5.3; 'dive1' forks from it and leads to T 9.7; 'dive2', THE LOW LIMB,
//             forks from that, is OVERTAKEN AT THE BRIEF'S 14 s (its range closes to about 30 m over the last second
//             and it passes to the side; never through the lens) and then creeps to rest 28 m to the right of
//             the pull-out at T 19. The first two lose when their third is over and die back. hero.leadAt(T) is the
//             leading tip's course, for the world's one pull.
//             Drawn as view-facing capsule ribbons in THREE LAYERS, the brief's: a 0.3 m white-hot core (0.8 px
//             floor) inside a 1.5 m violet-white sleeve of glow inside a faint 6 m halo, with fine SIDE FEELERS leaning
//             the way the channel grows (each its own length, breathing in length). Every channel TAPERS from its
//             root to its tip (the trunk to 0.82, limbs and twigs to half, the last step to a point that fades out
//             under its corona: no cut stubs). Each step knows when it was born and when the die-back reaches it,
//             so growth (the step being laid down flares as it forms), cooling to violet and die-back are one
//             shader against the journey clock T (0-40 s).
//             A BRANCH THAT LOSES FADES FROM ITS TIP BACK TO ITS FORK THROUGH DULL ROSE OVER FOUR SECONDS (the brief):
//             a rose front runs back from the stalled tip (2.8 s for the whole branch) and behind it the channel is
//             a dull-rose thread, half as wide and under half as bright, that breaks into dashes and is out 1.2 s
//             later. A branch loses when its own run is over, whenever in the flight that is.
//             A CHANNEL'S LIGHT DOES NOT KNOW THE LENS: far channels take the scene's haze and the brief's cooling by
//             age, nothing more. (Its drawn width does: the sleeve and halo of a channel within 40 m are a little
//             slimmer, 0.7 at 10 m, and pixel floors keep a far channel a fine wire.) Live tips carry a breathing
//             corona: a soft violet bloom with a small hot heart (never under a pixel across, so a far tip is a crisp
//             point; within 15 m of the lens the white heart is turned down so the corona keeps its violet edge) and
//             a brush of twelve hair-fine feelers no longer than its radius, which flicker in LENGTH, never in
//             brightness.
//          2. THE ANSWER. Upward streamers from the three mastheads (14 m at T 19.5, 50 m at T 35.5; the foremast one
//             wins and meets the ship limb at anchors.junction) and short losing threads on the wave crests.
//          3. THE RAIN. Hanging drops as ray-traced glass buns (oblate top, flat underside) that follow the camera in
//             three wrapping fields, plus 140 big hero beads placed along the skim. Each bead is a lens: it shows an
//             analytic sky (lemon band, slate cloud, teal sea) upside down and reversed, with the growing tree inside
//             it, read from a growth map baked from the same branches. At speed a bead draws out into a HAIR OF
//             DARK GLASS: never more than two pixels across at 360 lines however near it passes, no longer than
//             eight times the bead, a third opaque at most, with one pale edge and the slot as a lemon tick in its
//             leading tenth only; a drop that is half drawn out is already all hair, and a far bead's sparkle on
//             a needle is its tick, never a lit dash (hail does not streak: it only reads smaller).
//             In the dive some sixty large drops RIDE WITH THE LENS (an 8 m box that travels at half
//             the camera's speed): glass buns close to the lens, drawn out less than the rest;
//             they fade out below 110 m.
//          RANDOM STREAMS, each taken once: the hero's own (one draw of ctx.rng: character, layout, the answer, the
//             bead fields, the hung beads); THE TREE'S ONE STREAM ('the-leader-tree' and the world's seed: trunk, ship
//             limb, dive limbs, forks, twigs, kink twigs, in that order); the rare stray's ('the-leader-stray'); the
//             riding drops' ('the-leader-ride'). Nothing is drawn to keep an earlier version's deal.
// SPACE    Local space IS the brief's world space: sea level y 0, schooner foremast at the origin, bow to +X, west -Z,
//          cloud base y 700. Add hero.object to the scene at the origin, unrotated and unscaled.
//          radius 300, height 700 (the trunk carries on to y 790 so that it comes OUT of the world's cloud ceiling),
//          center (66, 330, 250).
// OPTS     palette     7 hex strings in the brief's order (cloud slate, sea teal, lemon band, key white-violet, violet,
//                      rose, lamp amber)
//          mastheads   [Vector3 x3] local positions of fore, main and mizzen mastheads (default: a 30 m rig heeled 14
//                      degrees to starboard = +Z). hero.anchors.mastheads gives them back: seat the schooner to match.
//          crests      [Vector3...] feet of the losing crest streamers (default: 9 seeded points at y 2.4 by the skim;
//                      pass points from ocean.heightAt so they stand on real crests)
//          skim        [[x,y,z],[x,y,z]] line the hero beads are hung along (default (45,6,290) -> (33,6,165))
//          branches    30..80 number of forking branches (default by seed: sparse 30, 60, or a willow of 80)
//          beads       multiplier on the bead counts (default 1; the counts also scale with ctx.quality.detail)
//          rain        'beads' | 'drizzle' | 'hail' (default by seed)
//          stray       true | Vector3: grow the rare STRAY LIMB (branch 'stray'): it leaves the ship limb, comes down ahead
//                      of the skim and stalls at that point (default 4 m right of the skim line, 1 m above it, 41% along)
//                      at T 22.7 (opts.strayT), creeps until T 25 and goes rose. Drawn from its own stream, so the rest
//                      of the tree is identical with or without it. hero.key follows it while it is the nearest tip.
//          cheat       0..1 (default 0.75) how far each bead's little tree is turned to sit ahead of the camera rather
//                      than where the real tree is. 0 = honest optics, 1 = always dead ahead.
// PER SEED branch count and habit (sparse / willow), every kink and fork, which branches lose and when, violet-white
//          or blue-white fire, the rain (many small beads, standard, or few large with milky hailstones).
// PROGRESS hero.setProgress(u)  path progress 0..1: journey clock T = u * 40 (the brief's seconds). Call it every
//                               frame from the world's update(dt, time, camera, u). Until it is called the piece runs
//                               its own 40 s loop from `time` (that is what the set-piece viewer shows).
//          hero.setTime(T)      the same in seconds.   hero.T is the current clock.
//          The stroke is on that clock: at T 35.5 limb and foremast streamer touch at anchors.junction, brightness
//          runs masthead -> cloud in 0.5 s, holds 0.8 s, eases over 1.5 s; every other branch goes to rose.
//          hero.stroke (0..1) is the eased envelope: drive the scene gain (peak 1.6) and the key light with it.
//          hero.key = { position, intensity }  nearest live tip to the camera (local space) for the ONE point light
//                               the world owns; intensity 0..1 before colour. Updated every frame.
//          hero.branches        every channel { name, pts, birth, end, stall, ... } (read only: for pools of light, tools)
//          hero.tipAt(name, T, out)  tip position of 'trunk' | 'ship' | 'dive0' | 'dive1' | 'dive2' | 'fore' | 'stray' at clock T.
//          hero.leadAt(T, out)       the leading dive limb's tip at clock T (its course over 1.6 s, handed from limb to
//                               limb over the second both are on station): the target of the dive's one pull.
//          hero.setEnv({ band, cloud, sea, bandDir, bandWidth })  the analytic sky the beads refract (linear colours;
//                               bandDir = unit xz vector toward the middle of the lemon slot, default west (0,-1)).
//          hero.setVelocity(v3 | null)   camera velocity in m/s for the needle stretch (null = measured from update).
//          hero.growthMap       256x512 RGBA8 texture (R glow, G birth, B death of the tree seen from +Z; u = (x+210)/560,
//                               v = (y+20)/820; clock encoded as (T+10)/50). Use it for the glow inside the cloud ceiling.
// ANCHORS  (local = world)
//          entry          (60,690,525) flying -Z;  the trunk drops out of the ceiling 55 m ahead, 12 m right
//          flyThrough     ordered points entry -> portal: level entry, corkscrew round the trunk (radius 16 -> 85 m with
//                         a 42 m bulge; about 30 degrees below level and 48 m/s on the two arcs that face west, so
//                         the lemon band comes into frame, 50-63 degrees and 74 m/s between), pull out, skim, 18
//                         degree climb. See THE MARGIN above for what the tree keeps clear of it.
//          entryTimes     [3] journey seconds at the world's lead-in point and the two entry points of flyThrough
//          helixTimes     [19] journey seconds at the 19 corkscrew points of flyThrough (index 2..20): T 3 -> 16
//          lead           [{ name, on, to } x3] the dive limbs: on station from `on`, leading until `to` (journey seconds)
//          overtake       14: the journey second at which the low limb is overtaken
//          lowLimbRest    where the low limb comes to rest (28 m right of the pull-out, y 35)
//          stray          the stray limb's stall point, or null
//          trunkTop, trunkFoot, fork (where the ship limb leaves the trunk), junction (where limb and streamer meet),
//          mastheads [3], shipLimbEnd (= junction), skim [a, b], heroBeads [Vector3...]
//          portalSeat     { position (33,37,70), normal (toward the arriving camera), radius 7 }: the ring sits on slate
//                         cloud with the junction up and left of it and no channel behind it
//          viewpoints     [{ position, target, T }] the brief's five frames
// LIGHTING Self-lit. The tree, coronas and streamers are additive (core 3.4, glow 0.36-0.66 violet, halo 0.1-0.4; x1.7 on the joined
//          channel at the stroke) and are thinned, not tinted, by scene fog (uniform uHaze, default 0.35 of the scene's
//          fog so the whole tree reads from the entry). Beads take scene fog normally and read no scene lights: their
//          sky is setEnv, their key light is the nearest tip. Wants a dark sky and bloom threshold ~1.0, strength 0.4.
// COST     90-115k triangles at detail 1 (tree 2-3k by habit, rain 55-110k by rain type), 7 draw calls, 3 programs,
//          one 256x512 texture, no lights, ~200-300 ms build (yields throughout).
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#232936', '#0A1C26', '#E9E38A', '#E4DCFF', '#8E62FF', '#B4506F', '#FFB45A'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;
const NEVER = 1000, DIE_RUN = 2.8, DIE_OUT = 1.2;
const MAP_W = 256, MAP_H = 512, MAP_X0 = -210, MAP_XW = 560, MAP_Y0 = -20, MAP_YH = 820;
const encT = (t) => clamp((t + 10) / 50, 0, 1);

// ---------------------------------------------------------------- the camera line the tree keeps clear of
function trunkAxis(y, top, foot, out = V3()) { return out.lerpVectors(top, foot, clamp((top.y - y) / (top.y - foot.y), -0.2, 1.1)); }

function makeRoute(top, foot, skimA, skimB, portal) {
  const pts = [V3(60, 690, 525), V3(60, 690, 500)];
  const a0 = trunkAxis(690, top, foot), a1 = trunkAxis(45, top, foot);
  const th0 = Math.atan2(480 - a0.z, 60 - a0.x), r0 = Math.hypot(480 - a0.z, 60 - a0.x);
  let th1 = Math.atan2(395 - a1.z, 60 - a1.x); const r1 = Math.hypot(395 - a1.z, 60 - a1.x);
  while (th1 < th0 + Math.PI) th1 += TAU;                 // a little over one turn, ending westbound
  // The corkscrew is not an even screw: on the two arcs that face the slot in the west it eases to about 30 degrees
  // below level and slows (so the lemon band comes into the top of the frame), and between them it dives at 50-62.
  const westOf = (s) => smoothstep(0.5, 0.9, 0.5 - 0.5 * Math.cos(lerp(th0, th1, s)));     // 1 = heading west
  const N = 240, cy = [0], rate = (s) => lerp(1, 0.3, westOf(s)) * (0.35 + 0.65 * smoothstep(0, 0.1, s));
  for (let i = 1; i <= N; i++) cy.push(cy[i - 1] + 0.5 * (rate((i - 1) / N) + rate(i / N)));
  const tab = (a, s) => { const f = clamp(s, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(a[i], a[i + 1], f - i); };
  const helix = (s, out = V3()) => {
    const y = lerp(690, 45, tab(cy, s) / cy[N]), ax = trunkAxis(y, top, foot, out), th = lerp(th0, th1, s), sn = Math.sin(Math.PI * clamp(s, 0, 1));
    const r = lerp(r0, r1, Math.pow(clamp(s, 0, 1), 0.8)) + 42 * sn * sn;
    return out.set(ax.x + Math.cos(th) * r, y, ax.z + Math.sin(th) * r);
  };
  // the journey clock down the helix (T 3 at the top, 16 at the foot): 48 m/s on the west-facing arcs, 74 between
  const ct = [0], hp = helix(0), hq = V3();
  for (let i = 1; i <= N; i++) { helix(i / N, hq); ct.push(ct[i - 1] + hq.distanceTo(hp) / lerp(74, 48, westOf((i - 0.5) / N))); hp.copy(hq); }
  const timeAt = (s) => 3 + 13 * tab(ct, s) / ct[N];
  for (let i = 0; i <= 18; i++) pts.push(helix(i / 18));
  const helixTimes = []; for (let i = 0; i <= 18; i++) helixTimes.push(timeAt(i / 18));
  pts.push(V3(lerp(60, skimA.x, 0.45), 16, lerp(395, skimA.z, 0.5)), skimA.clone(), skimA.clone().lerp(skimB, 0.5), skimB.clone());
  pts.push(portal.clone().lerp(skimB, 0.55).setY(lerp(portal.y, skimB.y, 0.62)), portal.clone());
  // THE FLIGHT LINE the tree keeps its margin from: the curve the camera really flies (the world adds a 23 m lead-in
  // and brings the climb onto the 18 degree line into the ring; the same points here), sampled every 2.5 m.
  const s18 = Math.sin(18 * Math.PI / 180), c18 = Math.cos(18 * Math.PI / 180), back = (d) => V3(portal.x, portal.y - d * s18, portal.z + d * c18);
  const flown = [V3(60, 690, 548), ...pts.slice(0, 24).map((q) => q.clone()), V3(33.3, 6.1, 171), back(80), back(55), back(28), back(0)];
  const curve = new THREE.CatmullRomCurve3(flown, false, 'centripetal', 0.5);
  curve.arcLengthDivisions = Math.max(400, flown.length * 60);
  const dense = curve.getSpacedPoints(Math.ceil(curve.getLength() / 2.5));
  // the lens at journey second T (the level entry on its own three knots, then the corkscrew's clock, then the pull-out's first knot)
  const entryTimes = [0, 1.0, 2.1], sOf = (T) => { let lo = 0, hi = 1; for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (timeAt(m) < T) lo = m; else hi = m; } return (lo + hi) / 2; };
  const camAt = (T, out = V3()) => {
    if (T <= entryTimes[1]) return out.lerpVectors(flown[0], flown[1], clamp(T / entryTimes[1], 0, 1));
    if (T <= entryTimes[2]) return out.lerpVectors(flown[1], flown[2], (T - entryTimes[1]) / (entryTimes[2] - entryTimes[1]));
    if (T <= 3) return out.lerpVectors(flown[2], flown[3], (T - entryTimes[2]) / (3 - entryTimes[2]));
    return helix(sOf(Math.min(T, 16)), out);
  };
  return { pts, dense, helix, timeAt, helixTimes, westOf, camAt, entryTimes };
}

// ---------------------------------------------------------------- growing the tree (CPU, once)
const _h = V3(), _u = V3(), _w = V3(), _c = V3(), _m = V3();
const MARGIN = 23, STEP_K = 0.26;                                       // metres every channel but the trunk and the designed corona tips keeps from the flight line
const DEG1 = Math.PI / 180;

function makeGrower(rng, route) {
  const dense = route.dense;
  // distance from p to the flight line (its samples stand 2.5 m apart)
  const dRoute = (p) => { let m = 1e18; for (let i = 0; i < dense.length; i++) { const q = dense[i], dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z, d = dx * dx + dy * dy + dz * dz; if (d < m) m = d; } return Math.sqrt(m); };
  const clear = (p, min) => {
    const m2 = min * min;
    for (let i = 0; i < dense.length; i++) { const q = dense[i], dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z; if (dx * dx + dy * dy + dz * dz < m2) return false; }
    return true;
  };
  // A chain of straight steps from `start` through `targets`, kinked hard at every joint; the plane each kink lies in
  // is the chain's own draw (phi), nothing else.
  // o: { stepMin, stepMax, kink (scale on the 10-35 degree half angle), exact (end on the last target), reach, minY, maxLen, clearance }
  function chain(start, targets, o) {
    const pts = [start.clone()], marks = [];           // marks[i] = vertex index at which target i was reached
    const pos = start.clone(); let phi = rng() * TAU, wi = 0, total = 0;
    const reach = o.reach ?? o.stepMax * 0.6, cl = o.clearance ?? MARGIN + 1, drift = o.drift ?? 0.1;
    // EVERY KINK IS BETWEEN 20 AND 70 DEGREES (the brief): a step may turn from the one before it by no less than
    // KMIN and no more than KMAX, so a channel never doubles back on itself, never makes a right angle and never
    // runs two steps in one line; a target that lies behind is come round to over two or three steps. `legal` turns
    // a wanted direction into the nearest allowed one. Steps also lean a little downward (drift): a limb has a direction.
    const prev = o.dir0 ? o.dir0.clone().normalize() : V3(), KMIN = 0.37, KMAX = 1.08, _p = V3(); let hasPrev = !!o.dir0;
    const legal = (d) => {
      if (drift) { d.y -= drift; d.normalize(); }
      if (!hasPrev) return d;
      const c = clamp(d.dot(prev), -1, 1), ang = Math.acos(c);
      if (ang >= KMIN && ang <= KMAX) return d;
      _p.copy(d).addScaledVector(prev, -c);
      if (_p.lengthSq() < 1e-6) { _p.set(prev.z, 0, -prev.x); if (_p.lengthSq() < 1e-6) _p.set(1, 0, 0); }
      _p.normalize();
      const a2 = clamp(ang, KMIN, KMAX);
      return d.copy(prev).multiplyScalar(Math.cos(a2)).addScaledVector(_p, Math.sin(a2));
    };
    const took = (from, to) => { prev.subVectors(to, from).normalize(); hasPrev = true; };
    let bestD = 1e9, stuck = 0;
    while (wi < targets.length && pts.length < 400) {
      const last = wi === targets.length - 1, tgt = targets[wi];
      _h.subVectors(tgt, pos); const dist = _h.length();
      // the closing step onto an exact end point is an ordinary step with a legal kink whenever one is to be had
      const close = last && o.exact && dist < Math.max(reach, o.stepMax) && dist > 1e-3 && (!hasPrev || (() => { const a = Math.acos(clamp(_h.dot(prev) / dist, -1, 1)); return a >= KMIN * 0.8 && a <= KMAX; })());
      if (dist < reach || close) {
        if (last && o.exact) { took(pos, tgt); pos.copy(tgt); pts.push(pos.clone()); total += dist; }
        marks[wi] = pts.length - 1; wi++; bestD = 1e9; stuck = 0; continue;
      }
      if (dist < bestD - 0.5) { bestD = dist; stuck = 0; } else if (++stuck > 9) { stuck = 0; bestD = 1e9; if (last && o.exact) { took(pos, tgt); pos.copy(tgt); pts.push(pos.clone()); total += dist; } marks[wi] = pts.length - 1; wi++; continue; }
      _h.multiplyScalar(1 / dist);
      _u.set(0, 1, 0); if (Math.abs(_h.y) > 0.9) _u.set(1, 0, 0); _u.addScaledVector(_h, -_u.dot(_h)).normalize(); _w.crossVectors(_h, _u);
      // A STEP NEAR THE FLIGHT LINE IS SHORT: no step is longer than STEP_K (0.26) of its distance D to the line's
      // nearest point (so that from the line it never spans more than fifteen degrees: under a quarter of the
      // frame's height in the middle of the 62-degree picture), and never under the brief's 8 m. The same rule at
      // every place of the line; beyond 175 m it no longer binds (the brief's 45 m).
      const floor = Math.min(8, o.stepMax), capAt = (p) => Math.max(floor, STEP_K * dRoute(p));
      let len = Math.min(rng.range(o.stepMin, o.stepMax), Math.max(o.stepMin * 0.6, dist * 0.85), capAt(pos));
      phi += Math.PI + rng.range(-1.1, 1.1);
      const half = rng.range(0.17, 0.61) * (o.kink ?? 1), _best = V3(); let ok = false, bestR = -1;
      // (a step that runs in toward the line is held to the rule at its far end too; a limb that MUST be laid and
      // finds every kink inside the margin takes the one that stays furthest from the line)
      const _dir = V3(), lay = (dir) => { _dir.copy(dir); _c.copy(_dir).multiplyScalar(len).add(pos); const c2 = capAt(_c); if (len > c2) _c.copy(_dir).multiplyScalar(c2).add(pos); _m.copy(_c).add(pos).multiplyScalar(0.5); };
      const free = () => { if (cl <= 0) return true; const good = clear(_c, cl) && clear(_m, cl); if (!good && o.must) { const r = Math.min(dRoute(_c), dRoute(_m)); if (r > bestR) { bestR = r; _best.copy(_c); } } return good; };
      for (let tr = 0; tr < 10 && !ok; tr++) {
        const ph = phi + tr * 0.9, hf = tr < 7 ? half : half * 0.3, s = Math.sin(hf), c = Math.cos(hf);
        lay(legal(_c.copy(_h).multiplyScalar(c).addScaledVector(_u, Math.cos(ph) * s).addScaledVector(_w, Math.sin(ph) * s)));
        ok = free();
      }
      if (!ok) { lay(legal(_c.copy(_h))); ok = free(); if (!ok && o.must) _c.copy(_best); }   // every kink is blocked: one plain step straight at the target
      len = _c.distanceTo(pos);
      if (!ok && !o.must) break;                         // boxed in by the flight line's margin: the branch simply ends here
      took(pos, _c);
      pos.copy(_c); pts.push(pos.clone()); total += len;
      if (o.minY !== undefined && pos.y < o.minY) break;
      if (o.maxLen !== undefined && total > o.maxLen) break;
    }
    for (let i = 0; i < targets.length; i++) if (marks[i] === undefined) marks[i] = pts.length - 1;
    return { pts, marks };
  }
  return { chain, clear, dRoute };
}

// cumulative length along a polyline
function cumLen(pts) { const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + pts[i].distanceTo(pts[i - 1])); return d; }

// births from waypoint times: piecewise linear in arc length between the marked vertices
function birthsFromMarks(pts, marks, t0, times) {
  const d = cumLen(pts), b = new Array(pts.length).fill(t0);
  let i0 = 0, tA = t0;
  for (let k = 0; k < marks.length; k++) {
    const i1 = marks[k], tB = Math.max(times[k], tA + 0.02);
    for (let i = i0; i <= i1; i++) b[i] = i1 > i0 ? lerp(tA, tB, (d[i] - d[i0]) / Math.max(d[i1] - d[i0], 1e-3)) : (i === 0 ? tA : tB);
    if (i1 > i0) { i0 = i1; tA = tB; }
  }
  for (let i = i0 + 1; i < pts.length; i++) b[i] = b[i - 1] + (d[i] - d[i - 1]) / 30;
  return { birth: b, dist: d };
}

function mkBranch(name, pts, birth, o = {}) {
  const dist = cumLen(pts), len = dist[dist.length - 1] || 1, end = birth[birth.length - 1];
  const stall = o.alive ? NEVER : (o.stall ?? end);    // a branch that loses stalls when its own run is over, whenever in the flight that is
  // DIE-BACK (the brief): the tip stalls, its corona shrinks (linger), then the branch fades FROM ITS TIP BACK TO ITS
  // FORK through dull rose over four seconds: fade[i] is when the rose front reaches joint i (it runs the branch in
  // DIE_RUN seconds; each place it passes is rose, then out, within DIE_OUT)
  const fade = dist.map((d) => (stall >= NEVER ? NEVER : stall + (o.linger ?? 0.4) + (1 - d / len) * (o.dieRun ?? DIE_RUN)));
  return { name, pts, birth, dist, len, fade, stall, end, cool: o.cool ?? 0, width: o.width ?? 1, stroke: o.stroke ? 1 : 0, run: o.run || null, level: o.level ?? 1, corona: o.corona ?? 1, coronaI: o.coronaI ?? 1, seed: o.seed ?? 0, o };
}

// THE STATION: where the leading limb's tip stands at journey second T (the designers' ruling on the dive; THE ONE
// PACING OF THIS WORLD BY METRES FLOWN: the tip keeps its place off the lens, so it is laid at our speed and sinks
// at our rate, with no hold in it). From the lens: 19 degrees below level; 60 m off plus 0.35 of the corkscrew's
// own radius there (66 m at the top of the dive, 94 m where it is widest); and on a bearing that
//   - through the level entry is the bearing on which the first limb leaves the trunk: the tip runs out west under
//     the cloud base, beyond the trunk (the brief's entry: the channel just right of centre);
//   - from where the trunk's axis has swung 40 degrees to the right of that (within the first half second of the
//     dive) is the trunk's own bearing from the eye's place less 40 degrees, the whole dive and through the
//     overtaking: the trunk rides 40 degrees to the right of the tip (the ruling's 30 to 45). It turns as the trunk
//     swings round the eye, as fast as that is (about 45 degrees a second for a moment at the top of the dive, 17 m
//     from the trunk), eased over 0.3 s either side so that it has no corner in it.
const T_OVER = 14, STATION_EL = -19, STATION_OFF = 40;
function makeStation(route, top, foot) {
  const T0 = route.entryTimes[1], DT = 0.05, N = Math.round((T_OVER + 1.5 - T0) / DT), az = new Float64Array(N + 1), R = new Float64Array(N + 1), cam = V3(), ax = V3();
  let prevB = 0;
  for (let i = 0; i <= N; i++) {
    const T = T0 + i * DT;
    route.camAt(T, cam); trunkAxis(cam.y - 30, top, foot, ax);
    let b = Math.atan2(ax.x - cam.x, -(ax.z - cam.z)) / DEG1;
    if (i) b += 360 * Math.round((prevB - b) / 360);
    prevB = b; az[i] = b - STATION_OFF; R[i] = clamp(60 + 0.35 * Math.hypot(ax.x - cam.x, ax.z - cam.z), 60, 120);
  }
  for (let i = 0, b0 = az[0] + STATION_OFF; i <= N; i++) az[i] = Math.max(az[i], b0);              // ... and never left of the bearing on which the first limb leaves the trunk (the entry's first knot)
  const smooth = (a) => { for (let pass = 0; pass < 2; pass++) { const c = Float64Array.from(a); for (let i = 0; i <= N; i++) { let s = 0, n = 0; for (let k = -6; k <= 6; k++) { const j = clamp(i + k, 0, N); s += c[j]; n++; } a[i] = s / n; } } };
  smooth(az); smooth(R);
  const tab = (a, T) => { const x = clamp((T - T0) / DT, 0, N), i = Math.min(N - 1, Math.floor(x)); return lerp(a[i], a[i + 1], x - i); };
  // the place itself, for a limb whose own offsets are dAz, dEl (degrees) and rK (a share of the range)
  const at = (T, dAz, dEl, rK, out = V3()) => {
    const a = (tab(az, T) + dAz) * DEG1, e = (STATION_EL + dEl) * DEG1, r = tab(R, T) * rK, ce = Math.cos(e);
    return route.camAt(T, out).add(_c.set(Math.sin(a) * ce * r, Math.sin(e) * r, -Math.cos(a) * ce * r));
  };
  return { T0, at, rangeAt: (T) => tab(R, T) };
}

// THE TREE, all of it from ONE random stream (P.treeRng), in this order: trunk, ship limb, the three dive limbs, the
// forking branches, the dead-end twigs, the kink twigs. Then the rare stray (its own stream: the tree is the same
// tree with or without it), the margin's backstop, and the answer (streamers and crest threads, from the hero's
// own stream).
async function growTree(ctx, rng, P) {
  const { route, top, foot, junction, mastheads, crests, count, treeRng: tr } = P;
  const G = makeGrower(tr, route);
  const branches = [];
  // --- trunk: out of the cloud (y 790) down to the foot at T 13.9 (its last sixth runs at about 38 m/s, so that on the
  //     last arc of the dive its tip already hangs BELOW the diving camera, against the sea), then a creep on toward the
  //     sea that never stops: fast at first, slower and slower (a quarter of the way at T 16, nine tenths at T 40).
  //     The corkscrew is flown ROUND the trunk (the brief: from 20 m out), so the trunk is the one channel the margin
  //     cannot hold for: it keeps 16 m where its own waypoints allow, and its steps there are the brief's shortest.
  const tw = [];
  for (let i = 1; i <= 6; i++) { const y = lerp(top.y + 90, foot.y, i / 6), a = trunkAxis(y, top, foot); tw.push(a.add(V3(tr.range(-9, 9), 0, tr.range(-9, 9)))); }
  tw[5].copy(foot);
  const creep = foot.clone().add(V3(tr.range(18, 40), -tr.range(28, 40), tr.range(-45, -20)));
  tw.push(creep);
  const trunkStart = trunkAxis(top.y + 90, top, foot).clone();
  const tc = G.chain(trunkStart, tw, { stepMin: 16, stepMax: 45, kink: 0.9, exact: true, must: true, clearance: 16 });
  const tTimes = tw.map((p, i) => (i < 5 ? lerp(-10.5, 15, (i + 1) / 6) : i === 5 ? 13.9 : 46));
  const tb = birthsFromMarks(tc.pts, tc.marks, -10.5, tTimes);
  { const iF = tc.marks[5], dF = tb.dist[iF], dE = tb.dist[tb.dist.length - 1];
    for (let i = iF + 1; i < tb.birth.length; i++) tb.birth[i] = 13.9 + 32.1 * Math.pow(clamp((tb.dist[i] - dF) / Math.max(dE - dF, 1e-3), 0, 1), 1.9); }
  const trunk = mkBranch('trunk', tc.pts, tb.birth, { alive: true, width: 1.25, level: 0, stroke: true, seed: tr() });
  branches.push(trunk);
  await ctx.yield();
  // --- ship limb: forks from the trunk near y 430 and runs out over the sea to the junction above the foremast (T 35.5)
  let fi = 1; for (let i = 1; i < trunk.pts.length; i++) if (Math.abs(trunk.pts[i].y - 430) < Math.abs(trunk.pts[fi].y - 430)) fi = i;
  const fork = trunk.pts[fi].clone(), forkT = trunk.birth[fi];
  const over = V3(lerp(fork.x, junction.x, 0.92), junction.y + 15, lerp(fork.z, junction.z, 0.9));
  const sw = [fork.clone().lerp(over, 0.3).add(V3(tr.range(-14, 14), tr.range(-8, 12), 0)), fork.clone().lerp(over, 0.65).add(V3(tr.range(-14, 14), tr.range(-8, 12), 0)), over, junction.clone()];
  const sc = G.chain(fork, sw, { stepMin: 14, stepMax: 42, kink: 0.85, exact: true, must: true, clearance: MARGIN + 1 });
  const sT = [lerp(forkT, 20, 0.3), lerp(forkT, 20, 0.65), 20, 35.5];
  const sb = birthsFromMarks(sc.pts, sc.marks, forkT, sT);
  const ship = mkBranch('ship', sc.pts, sb.birth, { alive: true, width: 1.15, level: 0, stroke: true, seed: tr() });
  branches.push(ship);
  // stroke run parameter: 0 at the masthead, rising up streamer, limb and trunk to 1 in the cloud
  const strokeLen = 50 + ship.len + trunk.dist[fi];
  ship.run = ship.dist.map((d) => (50 + (ship.len - d)) / strokeLen);
  trunk.run = trunk.dist.map((d, i) => (i <= fi ? (50 + ship.len + (trunk.dist[fi] - d)) / strokeLen : 2));   // below the fork: not on the stroke
  await ctx.yield();
  // --- THE THREE DIVE LIMBS ('dive0', 'dive1', 'dive2'), laid on the station one after the other: each leads for a
  //     third of the seconds between the entry's first knot and the brief's overtaking at 14 s, and is on station
  //     one second before it leads (the second in which the look is handed to it). The first leaves the trunk under
  //     the cloud base; each of the others forks from the one before it. Each has its own small offsets from the
  //     station (bearing, height, range: its own draws). The first two lose when their third is over: the tip
  //     stalls and the limb dies back to rose. THE LOW LIMB ('dive2') IS OVERTAKEN AT 14 s (the brief): over the last
  //     second its range closes from the station's to 32 m, it sinks to 33 degrees below the lens,
  //     then slides off to the right and under as we come over it at T 14, behind after it; then it creeps on, slower and slower, to rest
  //     28 m to the right of the pull-out at y 35 at T 19.
  const ST = P.station, TA = ST.T0, WL = (T_OVER - TA) / 3, HAND = 1, dive = [], lead = [];
  const rest = route.pts[20].clone().lerp(route.pts[21], 0.55).add(V3(28, 5, 0)), T_REST = 19;
  for (let k = 0; k < 3; k++) {
    const dAz = tr.range(-4, 4), dEl = tr.range(-3, 3), rK = tr.range(0.92, 1.08), seedK = tr();
    const a = k ? TA + k * WL - HAND : TA, b = TA + (k + 1) * WL;
    const par = k ? dive[k - 1] : trunk;
    let bi = 1;
    if (k) { for (let i = 1; i < par.pts.length - 1; i++) if (Math.abs(par.birth[i] - (a - 1.2)) < Math.abs(par.birth[bi] - (a - 1.2))) bi = i; }
    else { const s0 = ST.at(a, dAz, dEl, rK); for (let i = 1; i < par.pts.length - 1; i++) if (par.pts[i].distanceTo(s0) < par.pts[bi].distanceTo(s0)) bi = i; }   // (the first leaves the trunk at the joint nearest its station at the entry's first knot)
    const gw = [], gt = [];
    if (k < 2) for (let T = a + (k ? 0 : 0.5); T < b + 0.75; T += 0.5) { gw.push(ST.at(T, dAz, dEl, rK)); gt.push(T); }
    else {
      const place = (T) => {
        const x = T - T_OVER, kk = smoothstep(-1.1, 0, x), p = smoothstep(-0.25, 0.75, x), r0 = ST.rangeAt(T) * rK;
        return ST.at(T, dAz * (1 - kk) + 70 * p, dEl + lerp(0, -14, kk) - 12 * p, lerp(r0, 32, kk) / ST.rangeAt(T));
      };
      for (let T = a; T < T_OVER - 1.25; T += 0.5) { gw.push(place(T)); gt.push(T); }
      for (let T = T_OVER - 1.25; T < T_OVER + 0.8; T += 0.25) { gw.push(place(T)); gt.push(T); }
      const pass = gw[gw.length - 1].clone(), tp = gt[gt.length - 1];
      for (let j = 1; j <= 3; j++) { gw.push(pass.clone().lerp(rest, j / 4)); gt.push(lerp(tp, T_REST - 1, j / 4)); }
      gw.push(rest.clone()); gt.push(T_REST - 1);
    }
    const st = par.pts[bi], t0 = k ? Math.max(par.birth[bi], a - Math.max(0.8, st.distanceTo(gw[0]) / 50)) : Math.max(par.birth[bi], a - 0.5);
    const dc = G.chain(st, gw, { stepMin: 9, stepMax: 20, kink: 0.6, exact: true, must: true, clearance: MARGIN + 1, reach: 6 });
    const pts = dc.pts, birth = birthsFromMarks(dc.pts, dc.marks, t0, gt).birth;
    if (k === 2) { pts.push(rest.clone().add(V3(-1.2, -2.6, -2.4))); birth.push(Math.max(T_REST, birth[birth.length - 1] + 0.05)); }
    const br = mkBranch('dive' + k, pts, birth, { width: 1.0, level: 1, seed: seedK, linger: k === 2 ? 2.4 : 1.2, corona: k === 2 ? 1.45 : 1.6 });
    branches.push(br); dive.push(br); lead.push({ name: br.name, on: a, to: b });
    await ctx.yield();
  }
  // --- forking branches: off the trunk, the limbs and each other
  const parents = [trunk, trunk, trunk, ship, ship, ...dive];
  let made = 0, guard = 0;
  while (made < count && guard++ < count * 6) {
    const par = guard % 3 === 2 && branches.length > 6 ? branches[5 + Math.floor(tr() * (branches.length - 5))] : parents[Math.floor(tr() * parents.length)];
    if (par.level > 2 || par.pts.length < 3) continue;
    const i = 1 + Math.floor(tr() * (par.pts.length - 2)), st = par.pts[i], t0 = par.birth[i];
    if (st.y > 715 || t0 > 37 || st.y < 60) continue;
    if (par === ship && par.dist[i] > par.len - 150) continue;
    const pd = _h.subVectors(par.pts[i + 1], par.pts[i - 1]).normalize().clone();
    const az = tr() * TAU, steep = par === ship ? tr.range(0.25, 0.8) : tr.range(0.1, 0.9);
    const head = V3(Math.cos(az), 0, Math.sin(az)).multiplyScalar(1.25 - steep * 0.55).add(V3(0, -0.15 - steep * 0.8, 0)).addScaledVector(pd, 0.45).normalize();
    const speed = tr.range(20, 55) * (par.level === 0 ? 1 : 0.75), sizeK = P.habit === 'willow' ? 0.55 : P.habit === 'sparse' ? 1.5 : 1;
    const L = Math.min(tr.range(90, 320) * sizeK * (par.level === 0 ? 1 : 0.6), speed * 16);
    const w1 = st.clone().addScaledVector(head, L * 0.5).add(V3(tr.range(-0.12, 0.12) * L, 0, tr.range(-0.12, 0.12) * L)), w2 = st.clone().addScaledVector(head, L);
    const ch = G.chain(st, [w1, w2], { stepMin: 8, stepMax: par.level === 0 ? 40 : 28, kink: 1.1, minY: 26, maxLen: L });
    if (ch.pts.length < 3) continue;
    const d = cumLen(ch.pts), dl = d[d.length - 1], loser = tr.chance(0.36);
    // losers run flat out, stall and die back; the rest run 70% of their length and then creep on past the end of the clock
    const t70 = t0 + 0.7 * dl / speed;
    const birth = d.map((x) => (loser || x < 0.7 * dl ? t0 + x / speed : lerp(t70, Math.max(46, t70 + 6), Math.pow((x - 0.7 * dl) / (0.3 * dl), 1.15))));
    branches.push(mkBranch('b' + made, ch.pts, birth, { alive: !loser, width: par.level === 0 ? 0.8 : 0.62, level: par.level + 1, seed: tr(), linger: tr.range(0.2, 1.4) }));
    made++;
    if (made % 4 === 0) await ctx.yield();
  }
  await ctx.yield();
  // --- twigs: short dead ends that try, stall and go rose (the stepped look at close range)
  const nb = branches.length, twigs = Math.round(count * 2.6);
  for (let k = 0; k < twigs; k++) {
    const par = branches[Math.floor(tr() * nb)];
    const i = 1 + Math.floor(tr() * Math.max(1, par.pts.length - 2)); if (i >= par.pts.length) continue;
    const st = par.pts[i], t0 = par.birth[i] + tr.range(0, 0.6);
    if (st.y > 720 || st.y < 40 || (par === ship && par.dist[i] > par.len - 110)) continue;
    const az = tr() * TAU, head = V3(Math.cos(az), -tr.range(0.2, 1.2), Math.sin(az)).normalize(), L = tr.range(14, 46);
    const ch = G.chain(st, [st.clone().addScaledVector(head, L)], { stepMin: 8, stepMax: 19, kink: 1.25, maxLen: L });
    if (ch.pts.length < 2) continue;
    const speed = tr.range(14, 30), d = cumLen(ch.pts), birth = d.map((x) => t0 + x / speed);
    const twig = mkBranch('t' + k, ch.pts, birth, { width: 0.42, level: 3, seed: tr(), linger: tr.range(0.3, 2.5), corona: 0.45 });
    // a willow is thinned where it is not trunk or ship limb, so that in the dive three limbs read and not a scribble
    if (!(P.habit === 'willow' && k % 5 < 3 && par !== trunk && par !== ship)) branches.push(twig);
    if (k % 15 === 0) await ctx.yield();
  }
  await ctx.yield();
  // --- KINK TWIGS (what a stepped leader has; an amendment of the brief, by the designers' ruling): AT A SEEDED SHARE OF
  //     THE KINKS, HALF OF THEM, the whole tree over, one straight step of 3 to 8 m leaves the kink, in its own
  //     direction (25 to 75 degrees off the way the channel was heading, any side). Cooler and dimmer than the channel
  //     that bears it (a third of its width, violet from the start), live for as long as that channel is, and going
  //     to rose with it when the die-back reaches its kink. Every kink takes its seven draws whether it bears a
  //     twig or not.
  const KINK_SHARE = 0.5, nKink = branches.length; let nk = 0;
  for (let j = 0; j < nKink; j++) {
    const b = branches[j], keep = b === ship ? 2 : 0;
    for (let i = 1; i < b.pts.length - 1 - keep; i++) {
      const bears = tr() < KINK_SHARE, off = tr.range(25, 75) * DEG1, round = tr() * TAU, L = tr.range(3, 8), speed = tr.range(7, 14), dt0 = tr.range(0, 0.12), seedK = tr();
      const st = b.pts[i];
      if (!bears || st.y < 30 || st.y > 800 || b.birth[i] > 38) continue;
      const base = V3().subVectors(st, b.pts[i - 1]).normalize();
      _u.set(0, 1, 0); if (Math.abs(base.y) > 0.9) _u.set(1, 0, 0); _u.addScaledVector(base, -_u.dot(base)).normalize(); _w.crossVectors(base, _u);
      const head = base.multiplyScalar(Math.cos(off)).addScaledVector(_u, Math.cos(round) * Math.sin(off)).addScaledVector(_w, Math.sin(round) * Math.sin(off));
      const Lk = Math.min(L, Math.max(3, STEP_K * G.dRoute(st)));   // the step rule of the flight line, with the twig's own floor of 3 m
      const end = st.clone().addScaledVector(head, Lk), t0 = b.birth[i] + dt0;
      if (b !== trunk ? !(G.clear(end, MARGIN + 1) && G.clear(_m.lerpVectors(st, end, 0.5), MARGIN + 1)) : !G.clear(end, 16)) continue;
      branches.push(mkBranch('k' + (nk++), [st.clone(), end], [t0, t0 + Lk / speed], { alive: b.stall >= NEVER, stall: b.stall, width: 0.34, level: 3, seed: seedK, linger: Math.max(0, b.fade[i] - b.stall - 0.5), dieRun: 0.5, corona: 0.3, coronaI: 0.55, cool: 0.6 }));
    }
    if (j % 12 === 11) await ctx.yield();
  }
  await ctx.yield();
  // --- the rare event: one stray limb leaves the ship limb, turns our way and steps down to stall beside the skim.
  //     Grown last and from its own stream, so the rest of the tree is the same tree with or without it. It is one of
  //     the brief's designed corona tips: the margin does not hold for it.
  if (P.stray) {
    const sr = P.strayRng, tg = P.stray, GS = makeGrower(sr, route);
    let si = 1, bd = 1e9;
    for (let i = 1; i < ship.pts.length - 1; i++) { const dz = Math.abs(ship.pts[i].z - (tg.z + 25)); if (ship.birth[i] < 13.5 && dz < bd) { bd = dz; si = i; } }
    const st = ship.pts[si], t0 = ship.birth[si];
    const w1 = st.clone().lerp(tg, 0.45).add(V3(sr.range(4, 22), sr.range(0, 24), sr.range(-10, 12)));
    const w2 = V3(tg.x + 9, tg.y + 31, tg.z - 14);
    const ch = GS.chain(st, [w1, w2], { stepMin: 10, stepMax: 30, kink: 0.9, exact: true, must: true, clearance: 12 });
    // the last 36 m are placed by hand: hard kinks, never nearer the camera line than the stall point itself
    // (it comes down AHEAD of the lens, stalls there and creeps toward us while we pass)
    const tail = [[6, 19.5, -9], [2.2, 11.5, -5.5], [3.6, 5, -1.5], [0, 0, 0], [0.4, -0.5, 1.0], [0.1, -1.1, 1.7]];
    const pts = ch.pts.slice(), i2 = pts.length - 1;
    for (const o of tail) pts.push(V3(tg.x + o[0], tg.y + o[1], tg.z + o[2]));
    const tHit = P.strayT ?? 22.7, tW2 = tHit - 1.7;
    const sb2 = birthsFromMarks(pts, [ch.marks[0], i2, i2 + 4, i2 + 6], t0, [lerp(t0, tW2, 0.5), tW2, tHit, tHit + 2.3]);
    branches.push(mkBranch('stray', pts, sb2.birth, { width: 0.8, level: 1, seed: sr(), linger: 0.9, corona: 0.55 }));
  }
  await ctx.yield();
  // --- THE MARGIN'S BACKSTOP: no channel other than the trunk (the corkscrew is flown round it) and the designed corona
  //     tips (the low limb at its overtaking, the rare stray) comes within 23 m of the flight line, anywhere along
  //     it. The grower already refuses such steps; a limb that had to be laid (`must`) may still have crossed the
  //     margin, so every step is walked 2 m at a time against the line's samples (2.5 m apart) and a channel that
  //     comes into the margin from outside it ENDS at the joint before, with whatever forked from the part that is taken out.
  {
    const key = (q) => q.x.toFixed(3) + ',' + q.y.toFixed(3) + ',' + q.z.toFixed(3), dead = new Set();
    for (const b of branches) {
      if (b === trunk || b.name === 'dive2' || b.name === 'stray') continue;
      let cut = -1, out = G.clear(b.pts[0], MARGIN);       // (a channel that forks from the trunk inside the margin is let out of it once; none comes back in)
      for (let i = 0; i < b.pts.length - 1 && cut < 0; i++) {
        const A = b.pts[i], B = b.pts[i + 1], n = Math.max(1, Math.ceil(A.distanceTo(B) / 2));
        for (let k = 1; k <= n; k++) { _m.lerpVectors(A, B, k / n); if (!out) out = G.clear(_m, MARGIN); else if (!G.clear(_m, MARGIN)) { cut = i; break; } }
      }
      if (cut < 0) continue;
      for (let i = cut + 1; i < b.pts.length; i++) dead.add(key(b.pts[i]));
      if (cut < 1) { b.gone = true; continue; }
      const o = { ...b.o, run: b.run ? b.run.slice(0, cut + 1) : null };
      Object.assign(b, mkBranch(b.name, b.pts.slice(0, cut + 1), b.birth.slice(0, cut + 1), o));
    }
    for (let again = dead.size > 0; again;) {
      again = false;
      for (const b of branches) if (!b.gone && b !== trunk && dead.has(key(b.pts[0]))) { for (let k = 1; k < b.pts.length; k++) dead.add(key(b.pts[k])); b.gone = true; again = true; }
    }
    for (let i = branches.length - 1; i >= 0; i--) if (branches[i].gone) branches.splice(i, 1);
  }
  await ctx.yield();
  // --- the answer (the hero's own stream): masthead streamers (the foremast one wins) and crest threads that lose
  const GA = makeGrower(rng, route), streamers = [];
  for (let k = 0; k < mastheads.length; k++) {
    const m = mastheads[k], win = k === 0;
    const tgt = win ? junction.clone() : m.clone().lerp(junction, 0.2).add(V3(rng.range(-5, 5), rng.range(34, 44), rng.range(-4, 4)));
    const mid = m.clone().lerp(tgt, 0.5).add(V3(rng.range(-2.5, 2.5), 3, rng.range(-2.5, 2.5)));
    const ch = GA.chain(m, [mid, tgt], { stepMin: 3, stepMax: 7.5, kink: 0.55, exact: true, must: true, clearance: 0, reach: 4, drift: 0 });
    const d = cumLen(ch.pts), len = d[d.length - 1], tA = 13.3 + k * 0.8, tB = win ? 35.5 : 35.2;
    const birth = d.map((x) => lerp(tA, tB, Math.pow(x / len, 0.9)));
    const br = mkBranch(win ? 'fore' : 'mast' + k, ch.pts, birth, { alive: win, stall: win ? NEVER : 35.6, width: 0.5, level: 1, stroke: win, seed: rng(), linger: 0.1, corona: 0.7 });
    if (win) br.run = d.map((x) => (x / len) * 50 / strokeLen);
    branches.push(br); streamers.push(br);
  }
  for (let k = 0; k < crests.length; k++) {
    const m = crests[k], H = rng.range(2.2, 4.4), t0 = rng.range(17, 30);
    const ch = GA.chain(m, [m.clone().add(V3(rng.range(-0.6, 0.6), H, rng.range(-0.6, 0.6)))], { stepMin: 0.5, stepMax: 1.1, kink: 0.6, exact: true, must: true, clearance: 0, reach: 0.6, drift: 0 });
    const d = cumLen(ch.pts), len = d[d.length - 1], dur = rng.range(3, 6), birth = d.map((x) => t0 + dur * x / len);
    branches.push(mkBranch('crest' + k, ch.pts, birth, { width: 0.07, level: 3, seed: rng(), linger: rng.range(0.5, 2), corona: 0.12 }));
  }
  await ctx.yield();
  return { branches, fork, forkIndex: fi, trunk, ship, dive, streamers, lead, rest };
}

// ---------------------------------------------------------------- tree geometry: one view-facing capsule quad per step
async function buildTreeGeometry(ctx, branches) {
  let n = 0; for (const b of branches) n += b.pts.length - 1;
  const pos = new Float32Array(n * 12), oth = new Float32Array(n * 12), cor = new Float32Array(n * 8), tim = new Float32Array(n * 16), mis = new Float32Array(n * 16), sed = new Float32Array(n * 16);
  const idx = new Uint32Array(n * 6);
  let q = 0;
  for (const b of branches) {
    for (let i = 0; i < b.pts.length - 1; i++, q++) {
      const A = b.pts[i], B = b.pts[i + 1];
      // WIDTH TAPERS FROM TRUNK TO TWIG: every channel but the trunk and the ship limb thins to half its width along
      // its length, and the last step of a channel that has stopped is drawn out to a point (endK, see TREE_FRAG)
      const tap = (d) => (b.level === 0 ? lerp(1, 0.82, d / b.len) : lerp(1, 0.5, d / b.len)), lastStep = i === b.pts.length - 2 ? 1 : 0;
      const wA = b.width * tap(b.dist[i]), wB = b.width * tap(b.dist[i + 1]) * (lastStep ? 0.4 : 1);
      for (let c = 0; c < 4; c++) {
        const v = q * 4 + c;
        pos[v * 3] = A.x; pos[v * 3 + 1] = A.y; pos[v * 3 + 2] = A.z;
        oth[v * 3] = B.x; oth[v * 3 + 1] = B.y; oth[v * 3 + 2] = B.z;
        cor[v * 2] = c >> 1; cor[v * 2 + 1] = (c & 1) * 2 - 1;
        tim[v * 4] = b.birth[i]; tim[v * 4 + 1] = Math.max(b.birth[i + 1], b.birth[i] + 1e-3); tim[v * 4 + 2] = b.fade[i]; tim[v * 4 + 3] = b.fade[i + 1];
        mis[v * 4] = wA; mis[v * 4 + 1] = b.stroke + 2 * lastStep; mis[v * 4 + 2] = b.run ? b.run[i] : 2; mis[v * 4 + 3] = b.run ? b.run[i + 1] : 2;
        sed[v * 4] = b.seed; sed[v * 4 + 1] = b.dist[i]; sed[v * 4 + 2] = wB; sed[v * 4 + 3] = b.cool;
      }
      idx.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 2, q * 4 + 1, q * 4 + 3], q * 6);
    }
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aOther', new THREE.BufferAttribute(oth, 3));
  g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 2));
  g.setAttribute('aTime', new THREE.BufferAttribute(tim, 4));
  g.setAttribute('aMisc', new THREE.BufferAttribute(mis, 4));
  g.setAttribute('aSeed', new THREE.BufferAttribute(sed, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(V3(70, 380, 280), 700);
  return { geometry: g, steps: n };
}

// ---------------------------------------------------------------- growth map: the tree seen from +Z, for the beads and the cloud
async function bakeGrowthMap(ctx, branches) {
  const data = new Uint8Array(MAP_W * MAP_H * 4);
  // empty texels carry the trunk's birth for their height, so the mip levels the beads read keep sensible clocks
  for (let y = 0; y < MAP_H; y++) {
    const wy = MAP_Y0 + (y + 0.5) / MAP_H * MAP_YH, g = Math.round(encT(lerp(-10.5, 15, clamp((790 - wy) / 720, 0, 1)) + 1.5) * 255);
    for (let x = 0; x < MAP_W; x++) { const o = (y * MAP_W + x) * 4; data[o + 1] = g; data[o + 2] = 255; data[o + 3] = 255; }
    if (y % 24 === 23) await ctx.yield();
  }
  const seen = new Uint8Array(MAP_W * MAP_H);
  let work = 0;
  for (const b of branches) {
    if (b.level === 3 && b.width < 0.2) continue;        // crest threads are too small to draw
    const amp = Math.round(255 * clamp(0.35 + 0.65 * b.width, 0, 1));
    for (let i = 0; i < b.pts.length - 1; i++) {
      const A = b.pts[i], B = b.pts[i + 1], L = A.distanceTo(B), ns = Math.max(1, Math.ceil(L / 1.1));
      for (let k = 0; k <= ns; k++) {
        const f = k / ns, x = lerp(A.x, B.x, f), y = lerp(A.y, B.y, f);
        const px = (x - MAP_X0) / MAP_XW * MAP_W, py = (y - MAP_Y0) / MAP_YH * MAP_H;
        const ix = Math.round(px), iy = Math.round(py);
        const tb = Math.round(encT(lerp(b.birth[i], b.birth[i + 1], f)) * 255), td = Math.round(encT(Math.min(lerp(b.fade[i], b.fade[i + 1], f) + 0.8, 60)) * 255);
        for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {
          const X = ix + ox, Y = iy + oy; if (X < 0 || Y < 0 || X >= MAP_W || Y >= MAP_H) continue;
          const o = (Y * MAP_W + X) * 4, r2 = ox * ox + oy * oy, wgt = r2 === 0 ? amp : r2 === 1 ? amp * 0.6 : r2 === 2 ? amp * 0.3 : 0;
          if (wgt > data[o]) data[o] = wgt;
          const k = Y * MAP_W + X;
          if (!seen[k]) { seen[k] = 1; data[o + 1] = tb; data[o + 2] = td; }
          else { if (tb < data[o + 1]) data[o + 1] = tb; if (td > data[o + 2]) data[o + 2] = td; }
        }
      }
      work += ns; if (work > 200) { work = 0; await ctx.yield(); }
    }
  }
  await ctx.yield();
  const tex = new THREE.DataTexture(data, MAP_W, MAP_H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- shaders: the channel
const FOG_ATTEN = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fq = fogDensity * uHaze * vFogDepth; col *= exp(-fq * fq);
    #else
      col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth * uHaze);
    #endif
  #endif`;

const TREE_VERT = /* glsl */`
  attribute vec3 aOther; attribute vec2 aCorner; attribute vec4 aTime; attribute vec4 aMisc; attribute vec4 aSeed;   // aMisc: width at the step's start, stroke (+2 on a channel's last step), stroke run at both ends; aSeed: seed, metres along the branch, width at the step's end, how cool the channel is from the start (kink twigs)
  uniform float uT, uResY, uStroke, uFront, uWidth;
  varying vec2 vP; varying vec4 vTime; varying vec4 vK; varying vec4 vS; varying vec2 vDim; varying vec3 vX; varying float vHalo;
  #include <fog_pars_vertex>
  void main() {
    float g = clamp((uT - aTime.x) / max(aTime.y - aTime.x, 1e-3), 0., 1.);
    vec4 a = modelViewMatrix * vec4(position, 1.), b4 = modelViewMatrix * vec4(aOther, 1.);
    vec3 b = mix(a.xyz, b4.xyz, g);
    vec3 axis = b - a.xyz; float L = length(axis);
    vec3 ax = L > 1e-4 ? axis / L : vec3(0., 1., 0.);
    vec3 p = mix(a.xyz, b, aCorner.x);
    float dist = max(length(p), 0.3);
    vec3 sd = cross(ax, -p / dist); float sl = length(sd);
    sd = sl > 1e-4 ? sd / sl : vec3(1., 0., 0.);
    float run = mix(aMisc.z, aMisc.w, aCorner.x);
    float strokeK = mod(aMisc.y, 2.), endK = step(1.5, aMisc.y);
    float st = uStroke * strokeK * (1. - smoothstep(uFront - 0.05, uFront, run));
    float pxPerM = uResY * projectionMatrix[1][1] * 0.5 / dist;
    float wv = mix(aMisc.x, aSeed.z, g * aCorner.x);              // the channel's width here: it tapers along every step
    // (the sleeve and the halo of a channel close to the lens are drawn a little slimmer than their true size, 0.7 at
    // 10 m: a fork that splits past is a bright wire in a sleeve, not a beam across the frame; the core keeps the
    // brief's width at every distance)
    float wc = wv * uWidth * (1. + 0.7 * st), ws = wc * mix(0.7, 1., smoothstep(10., 40., dist));
    float w = max(3.0 * ws, 3.2 / pxPerM);                      // half width of the quad: 6 m halo, never under ~6 px
    float core = max(0.15 * wc * (1. + 0.9 * st), 0.8 / pxPerM) / w;    // THE BRIEF'S 0.3 m WHITE-HOT CORE (a channel of width 1), never under ~1.6 px
    float glow = max(0.75 * ws, 2.0 / pxPerM) / w;              // 1.5 m glow
    p += sd * aCorner.y * w + ax * (aCorner.x * 2. - 1.) * w;
    vP = vec2(aCorner.y * w, mix(-w, L + w, aCorner.x));
    vK = vec4(L, w, core, glow);
    vTime = vec4(aTime.x, mix(aTime.x, aTime.y, g), aTime.z, mix(aTime.z, aTime.w, g));
    vS = vec4(st, aSeed.x, aSeed.y, strokeK);
    // where the pixel floors widen a far channel, dim it so that a distant tree is fine bright wire, not a white bar
    vDim = vec2(pow(clamp(0.15 * wc * pxPerM / 0.8, 0.06, 1.), 0.5), pow(clamp(0.75 * ws * pxPerM / 2.0, 0.06, 1.), 0.7));
    // BRIGHTNESS TAPERS WITH WIDTH (trunk and limbs full, forks less, twigs under half) and with nothing else: a far
    // channel takes the scene's own haze (FOG_ATTEN) and the brief's cooling by age; its light does not know the lens
    vX = vec3(aSeed.w, endK * smoothstep(0., 1., uT - aTime.y), clamp(0.22 + 0.78 * wv, 0.4, 1.));
    vHalo = 1.;
    vec4 mvPosition = vec4(p, 1.);
    gl_Position = g <= 0. ? vec4(2., 2., 2., 1.) : projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const TREE_FRAG = /* glsl */`
  uniform float uT, uAfter, uHaze, uGain;
  uniform vec3 uCore, uGlowC, uViolet, uRose;
  varying vec2 vP; varying vec4 vTime; varying vec4 vK; varying vec4 vS; varying vec2 vDim; varying vec3 vX; varying float vHalo;
  #include <fog_pars_fragment>
  void main() {
    float pm = max(fwidth(vP.x), 1e-4);                           // metres per pixel here
    float L = vK.x, W = max(vK.y, 1e-3);
    float t = clamp(vP.y / max(L, 1e-3), 0., 1.);
    float dy = vP.y - t * L;
    float ya = vS.z + vP.y, sd1 = vS.y * 37.;
    float wob = (sin(ya * 1.9 + sd1) + 0.6 * sin(ya * 4.7 + sd1 * 1.7 + uT * 0.8)) * 0.3 * vK.z * W * step(0.03, vK.z);
    // EVERY STEP IS STRAIGHT (the brief: a chain of straight steps joined at hard kinks); the channel only SWELLS within
    // two metres of a kink (1.4 times) and thins between kinks (0.82): a thing that feels its way, joint by joint
    float yc = clamp(vP.y, 0., L), kd = min(yc, L - yc);
    float swell = 0.82 + 0.6 * exp(-kd / 1.4);
    float xx = vP.x + wob;
    float d = sqrt(max(vP.x * vP.x + dy * dy, 0.)) / W;
    if (d >= 1.) discard;
    float dc = sqrt(max(xx * xx + dy * dy, 0.)) / W;
    float cap = 1. - 0.5 * smoothstep(0., 0.03 * W, abs(dy));    // round ends at half weight so kinks do not double
    float birth = mix(vTime.x, vTime.y, t), fade = mix(vTime.z, vTime.w, t);
    float age = max(uT - birth, 0.);
    float young = exp(-age / 1.6) * (1. - 0.5 * vX.x), cool = mix(1. - exp(-age / 8.), 1., clamp(vX.x, 0., 1.));   // (vX.x: a kink twig is violet and dim from the start)
    float fresh = exp(-max(uT - vTime.x, 0.) / 0.55);            // the step that is being laid down now flares as it forms
    // A LOSING BRANCH FADES FROM ITS TIP BACK TO ITS FORK THROUGH DULL ROSE (the brief; four seconds in all): fade
    // is when the rose front, running back from the stalled tip, reaches this place; here the channel cools to dull
    // rose in half a second and is out by DIE_OUT. Never brighter or more saturated than the rose itself.
    float fx = uT - fade;
    float roseS = smoothstep(-0.15, 0.45, fx);
    float rose = max(roseS, uAfter * (1. - vS.w));                              // (after the stroke every loser goes to rose)
    float gone = (1. - smoothstep(0.45, ${DIE_OUT.toFixed(2)}, fx)) * (1. - 0.3 * uAfter * (1. - vS.w));
    // THREE LAYERS. A thin white-hot core ...
    float core = 1. - smoothstep(vK.z * 0.3 * swell, vK.z * swell, dc);
    core = core * (0.7 + 0.3 * core);
    // ... inside a sleeve of glow with a cusp at the core and a soft skirt (a luminous channel, never an even tube):
    // violet-white next to the core, violet at its edge, swelling and narrowing along the channel, wider on a new step ...
    float gw = vK.w * (0.8 + 0.4 * (0.5 + 0.5 * sin(ya * 0.23 + sd1 * 2.1))) * (1. + 0.5 * fresh) * swell;
    // where the front has passed the channel is a dull-rose THREAD, half as wide as the live sleeve was and under half
    // as bright, breaking into dashes as it goes out. Never a wide pink ribbon.
    gw *= mix(1. + 0.6 * rose, 0.5, roseS);
    float dph = ya / 4.6 + sd1, dcell = floor(dph), dtri = 1. - abs(fract(dph) - 0.5) * 2.;
    float dth = 0.1 + 0.6 * smoothstep(0.3, ${DIE_OUT.toFixed(2)}, fx) + (fract(sin(dcell * 91.7 + sd1) * 43758.5453) - 0.5) * 0.3;
    float emberK = mix(1., 0.42 * smoothstep(dth - 0.1, dth + 0.1, dtri), roseS);
    float q = dc / max(gw, 1e-4);
    float glow = 0.62 * exp(-q * 2.6) + 0.38 * exp(-q * q * 1.6);
    // ... with fine side feelers: short streamers that leave the channel leaning the way it grows, each its own
    // length, breathing in length (drawn only where a pixel is fine enough to hold them)
    float ax = abs(xx), sgn = xx < 0. ? -1. : 1., u = ya - ax * 0.75, sp = 2.3, ci = floor(u / sp);
    float h1 = fract(sin(ci * 12.9898 + sd1 + sgn * 3.7) * 43758.5453), h2 = fract(h1 * 17.31 + 0.37);
    float flen = W * (0.26 + 0.62 * h2) * (0.7 + 0.3 * sin(uT * (1.2 + 2. * h1) + h2 * 30.));
    float du = abs(fract(u / sp) - 0.5) * sp * 0.8, lw = max(0.045, 0.9 * pm);
    float feel = (1. - smoothstep(lw * 0.5, lw * 1.6, du)) * max(1. - ax / max(flen, 1e-3), 0.) * step(0.42, h1) * step(dy * dy, 1e-6)
      * min(1., 0.045 / lw + 0.5) * (1. - smoothstep(0.3, 0.7, pm));
    // ... inside a faint halo
    float halo = (1. - d) * (1. - d);
    float shim = 0.88 + 0.12 * sin((vS.z + vP.y) * 0.21 - uT * 2.3 + vS.y * 40.);
    vec3 cc = mix(uCore, mix(uCore, uViolet, 0.45), cool) * 3.4 * mix(0.45, 1., young) * (1. + 0.7 * fresh);
    vec3 gc = mix(mix(uGlowC, uViolet, 0.3 + 0.45 * cool), uViolet, smoothstep(0.12, 0.85, q)) * mix(0.36, 0.66, young) * (1. + 1.1 * fresh);
    vec3 fc = mix(uViolet, uGlowC, 0.45) * mix(0.35, 1.2, young);
    vec3 hc = uViolet * (0.07 + 0.1 * young + 0.18 * fresh);
    vec3 dull = mix(uRose, vec3(dot(uRose, vec3(0.2126, 0.7152, 0.0722))), 0.15);
    cc = mix(cc, dull * 0.3, rose); gc = mix(gc, dull * 0.46, rose); fc = mix(fc, dull * 0.1, rose); hc = mix(hc, dull * 0.09, rose);
    core *= 1. - 0.75 * rose; glow = mix(glow, 0.5 * exp(-q * 1.5) + 0.5 * exp(-q * q), rose);   // an ember has no hot wire in it: its sleeve, fuller and softer
    float ember = 1.;
    float bright = vX.z, tipFade = 1. - 0.92 * vX.y * smoothstep(0.1, 1., t);   // a channel that has stopped ends in a point, not in a stub
    vec3 col = (cc * core * vDim.x * mix(1., bright, 0.6) * ember + (gc * glow * (1. - 0.5 * core) + fc * feel * (1. - core) + hc * halo * clamp(vHalo, 0., 1.)) * vDim.y * bright) * cap * shim * gone * tipFade * emberK;
    float st = vS.x;
    col = col * (1. + 0.9 * st) + uCore * core * cap * st * 2.6 * vDim.x;   // the stroke: the joined channel only
    col *= uGain;
    ${FOG_ATTEN}
    gl_FragColor = vec4(col, 1.);
  }`;

// ---------------------------------------------------------------- shaders: tip corona with its brush of twelve feelers
const CORONA_VERT = /* glsl */`
  attribute vec3 iPos; attribute vec3 iDir; attribute vec4 iParm;     // iParm: size, intensity, seed, rose
  uniform float uResY, uT;
  varying vec2 vQ; varying vec4 vParm; varying vec3 vAim; varying float vHot;   // vAim: tip heading on the quad (xy) and px per metre; vHot: the hot heart's gain
  #include <fog_pars_vertex>
  void main() {
    vec4 c = modelViewMatrix * vec4(iPos, 1.);
    float dist = max(length(c.xyz), 0.3);
    float pxPerM = uResY * projectionMatrix[1][1] * 0.5 / dist;
    float breathe = 1. + 0.09 * sin(uT * 1.7 + iParm.z * 50.);
    float R = max(11. * iParm.x, 7. / pxPerM);                    // quad half size: room for the feelers
    vec3 dv = mat3(modelViewMatrix) * iDir;
    vec2 aim = dv.xy; float al = length(aim);
    aim = al > 1e-3 ? aim / al : vec2(0., -1.);
    vQ = position.xy * R;
    vParm = vec4(max(4. * iParm.x * breathe, 2.4 / pxPerM), iParm.y, iParm.z, iParm.w);
    vAim = vec3(aim * mix(0.45, 1., al), pxPerM);                 // feelers foreshorten when the tip comes at the lens
    vHot = mix(0.3, 1., smoothstep(5., 15., dist));              // A CORONA KEEPS ITS VIOLET EDGE AT ANY DISTANCE: within 15 m of the lens its white heart is turned down (the same at every place)
    vec4 mvPosition = vec4(c.xyz + vec3(position.xy * R, 0.), 1.);
    gl_Position = iParm.y <= 0.001 ? vec4(2., 2., 2., 1.) : projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const CORONA_FRAG = /* glsl */`
  uniform float uT, uHaze, uGain;
  uniform vec3 uCore, uGlowC, uViolet, uRose;
  varying vec2 vQ; varying vec4 vParm; varying vec3 vAim; varying float vHot;
  #include <fog_pars_fragment>
  void main() {
    float R = vParm.x, r = length(vQ);
    float x = r / R;
    // a soft violet bloom, whiter toward a small hot heart
    float hk = clamp(vHot, 0., 1.), soft = exp(-x * x * 2.4) * 0.7 + exp(-x * x * 12.) * 0.5 * mix(0.6, 1., hk) + exp(-x * x * 50.) * 1.3 * hk;
    vec3 bc = mix(uViolet, uGlowC, 0.3 + 0.6 * exp(-x * x * 4.));
    float fl = length(vAim.xy);
    vec2 e0 = fl > 1e-3 ? vAim.xy / fl : vec2(0., -1.);
    vec2 e1 = vec2(-e0.y, e0.x);
    float lw = max(0.018 * R, 0.8 / max(vAim.z, 1e-4));
    // a brush of twelve hair-fine feelers, none longer than the corona's radius, fading along their length
    float feel = 0.;
    for (int i = 0; i < 12; i++) {
      float fi = float(i), sd = vParm.z * 31. + fi * 2.39;
      float ang = (fi - 5.5) * 0.27 + 0.26 * sin(sd * 3.1) + 0.05 * sin(uT * 0.9 + sd);
      float len = R * (0.5 + 0.6 * (0.5 + 0.5 * sin(uT * (1.1 + 0.23 * fi) + sd * 5.))) * fl;   // length flickers, brightness does not
      vec2 e = e0 * cos(ang) + e1 * sin(ang);
      float pr = clamp(dot(vQ, e), 0., len);
      float dd = length(vQ - e * pr), fade = 1. - pr / max(len, 1e-3);
      feel += (1. - smoothstep(lw * 0.4, lw * 1.6, dd)) * fade * fade;
    }
    // the tip itself: a small crisp white-hot point inside the bloom (never under a pixel; dimmed where the floor widens it)
    float rc = max(0.05 * R, 1.1 / max(vAim.z, 1e-4)), hot = exp(-r * r / (rc * rc)) * min(1., 0.3 + 0.7 * 0.05 * R / rc);
    vec3 col = bc * soft + uCore * hot * 2.6 * hk + mix(uViolet, uCore, 0.3) * min(feel, 1.3) * 0.8 * min(1., 0.018 * R / lw + 0.45);
    col = mix(col, uRose * (soft * 0.45 + feel * 0.2), vParm.w);
    col *= vParm.y * uGain;
    ${FOG_ATTEN}
    gl_FragColor = vec4(col, 1.);
  }`;

// ---------------------------------------------------------------- shaders: the rain (ray-traced glass buns that are lenses)
const BEAD_VERT = /* glsl */`
  attribute vec3 iBase; attribute vec4 iParm;                       // iParm: radius, seed, wobble period, kind (1 = milky hail)
  uniform vec3 uCam, uCamRight, uCamFwd, uVelDir, uTreeC;
  uniform float uBox, uWrap, uSink, uAmb, uT, uResY, uMinPx, uFloorA, uStreak, uCheat, uSize, uRide, uShow;
  varying vec3 vWorld; varying vec3 vC; varying vec4 vShape; varying vec4 vInfo; varying vec4 vTaz; varying vec2 vAx;
  #include <fog_pars_vertex>
  void main() {
    float seed = iParm.y;
    float sink = uSink * (0.6 + 0.8 * fract(seed * 7.13));
    vec3 rel;
    float streak = uStreak * (1. - 0.4 * uRide);                     // (the large drops that travel with the lens at half its speed are drawn out too: long needles, close to)
    if (uWrap > 0.5) { vec3 b = iBase * uBox; b.y -= sink; rel = mod(b - uCam * (1. - 0.5 * uRide) + 0.5 * uBox, vec3(uBox)) - 0.5 * uBox; }
    else { rel = iBase - uCam; rel.y -= (uT - 25.) * 0.02 * (0.6 + 0.8 * fract(seed * 7.13)); }
    float dist = max(length(rel), 0.05);
    vec3 view = rel / dist;
    vec3 c = uCam + rel;
    float a = iParm.x * uSize;
    float pxPerM = uResY * projectionMatrix[1][1] * 0.5 / dist;
    float hail = step(0.5, iParm.w);
    // at speed a bead is a needle a fifth as wide as the bead it came from (hail does not streak: it only reads smaller)
    float sp = clamp(1. + streak / a, 1., 8.), sk = clamp((sp - 1.) / 1.5, 0., 1.) * (1. - hail);
    float thin = mix(mix(1., 0.2, sk), mix(1., 0.6, clamp((sp - 1.) / 1.5, 0., 1.)), hail);
    float grow = max(1., uMinPx / max(a * thin * pxPerM, 1e-4));    // tiny beads (and thin needles) are drawn at a floor size and thinned in alpha instead
    float alpha = max(mix(1. / (grow * grow), 1. / grow, sk), uFloorA * step(1.001, grow));
    float edge = max(abs(rel.x), max(abs(rel.y), abs(rel.z))) / max(0.5 * uBox, 1e-3);
    alpha *= 1. - uWrap * smoothstep(0.78, 1., edge);               // no popping where the field wraps
    alpha *= smoothstep(0.32 + 0.85 * uRide, 0.6 + 1.35 * uRide, dist) * uShow;   // none at the near plane (a riding drop is whole glass from 1.95 m: never a disc a third of the frame tall cut by its corner)
    a *= grow;
    // A NEEDLE IS A HAIR OF GLASS: however large the drop and however near, its drawn half-width is capped at one
    // pixel (at 360 lines of picture) and its length at eight times the bead it came from, so a streak at arm's
    // length is a thread, never a spindle or a bar
    thin *= mix(1., min(1., 1.0 * uResY / 360. / max(a * thin * pxPerM, 1e-4)), smoothstep(0.12, 0.5, sk));   // (a drop that is half drawn out is already held to the hair's width)
    // bun <-> sphere wobble (real drop oscillation, slowed)
    float wb = 0.5 + 0.5 * sin(uAmb * 6.2832 / max(iParm.z, 0.5) + seed * 40.);
    float ah = a * mix(1.08, 0.99, wb), bu = a * mix(mix(0.72, 0.97, wb), 0.96, hail), bl = a * mix(mix(0.42, 0.7, wb), 0.9, hail);
    float fl = sk * smoothstep(1., 1.6, grow); bu = mix(bu, ah, fl); bl = mix(bl, ah, fl);   // a needle drawn at the floor is round in section: its full pixel floor wide, so a far streak is a hairline and never a row of dots
    // needles at speed: stretch along the camera's velocity
    float s = mix(max(sp / grow, mix(1., 4.5 * thin, sk)), 1., hail);   // drawn out by its TRUE size; one that is drawn at the floor keeps a dash four and a half times its width
    ah *= thin; bu *= thin; bl *= thin; s = min(s / mix(thin, 1., hail), 240.);
    alpha *= mix(1., 0.55, clamp((s - 1.) / 10., 0., 1.));
    alpha *= mix(1., 0.55, sk * smoothstep(40., 90., 2. * ah * s * pxPerM));   // (a needle longer than forty pixels is fainter still)
    vec3 e1 = uVelDir - view * dot(uVelDir, view); float l1 = length(e1);
    vec3 er = uCamRight - view * dot(uCamRight, view);
    if (l1 > 1e-3 && s > 1.02) e1 /= l1; else { e1 = er / max(length(er), 1e-3); l1 = 0.; }
    vec3 e2 = cross(view, e1);
    float h1 = ah * sqrt(1. + (s * s - 1.) * l1 * l1) * 1.1, h2 = ah * 1.1;
    vec3 wp = c + e1 * position.x * h1 + e2 * position.y * h2;
    vWorld = wp; vC = c;
    vShape = vec4(ah, bu, bl, s);
    vAx = vec2(position.x * step(1.02, s) * step(1e-3, l1), sk);          // along the needle (-1 tail .. 1 leading end), how much of a needle it is
    // sparkle for beads too small to resolve
    float spark = step(0.965, fract(seed * 91.7)) * (0.55 + 0.45 * sin(uAmb * 0.9 + seed * 60.)) * step(1.5, grow);
    vInfo = vec4(alpha, seed, hail, spark);
    // where this bead's little tree sits: toward the real tree, turned by uCheat toward the camera's heading
    vec2 toT = uTreeC.xz - c.xz; float dT = length(toT); toT /= max(dT, 1e-3);
    vec2 cf = uCamFwd.xz; float cl = length(cf); cf = cl > 1e-3 ? cf / cl : toT;
    vec2 tz = mix(toT, cf, uCheat); float tl = length(tz); tz = tl > 0.05 ? tz / tl : cf;
    vTaz = vec4(tz, clamp(mix(dT, 260., uCheat), 110., 520.), a * pxPerM * mix(1., thin / 0.35, sk));
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.);
    gl_Position = alpha <= 0.002 ? vec4(2., 2., 2., 1.) : projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const BEAD_FRAG = /* glsl */`
  uniform vec3 uCam, uVelDir, uTreeC, uKey;
  uniform vec3 uBand, uCloud, uSea, uCore, uGlowC, uViolet;
  uniform vec2 uBandDir;
  uniform float uBandW, uBandH, uTenc, uStroke, uKeyI, uTreeGain;
  uniform sampler2D uMap;
  varying vec3 vWorld; varying vec3 vC; varying vec4 vShape; varying vec4 vInfo; varying vec4 vTaz; varying vec2 vAx;
  #include <fog_pars_fragment>

  // the sky a bead refracts: lemon slot in the west, slate cloud, teal sea, and the growing tree
  vec3 env(vec3 d) {
    float hl = max(length(d.xz), 1e-4);
    vec2 hz = d.xz / hl;
    float el = d.y / hl;
    float west = smoothstep(uBandW - 0.25, uBandW + 0.2, dot(hz, uBandDir));
    vec3 sky = mix(mix(uCloud, uBand, 0.16 * west) * 1.5, uCloud, smoothstep(0.03, 0.7, el));
    sky += uViolet * 0.10 * smoothstep(0.5, 3., el);
    float band = smoothstep(0., 0.014, el) * (1. - smoothstep(uBandH * 0.55, uBandH * 1.5, el));
    sky = mix(sky, uBand * 1.35, band * west);
    vec3 sea = mix(uSea * 0.8, uSea * 2.1 + uBand * 0.14 * west, smoothstep(-0.5, 0., el));
    vec3 c = mix(sea, sky, smoothstep(-0.006, 0.006, el));
    float fw = dot(d.xz, vTaz.xy);
    if (fw > 0.04) {
      float lat = dot(d.xz, vec2(-vTaz.y, vTaz.x)) / fw * vTaz.z, hy = d.y / fw * vTaz.z;
      vec2 uv = vec2((lat + uTreeC.x - (${MAP_X0.toFixed(1)})) / ${MAP_XW.toFixed(1)}, (hy - (${MAP_Y0.toFixed(1)})) / ${MAP_YH.toFixed(1)});
      float lod = clamp(log2(280. / max(vTaz.w, 1.)), 0., 4.5);          // the whole tree is a few dozen pixels inside a bead
      vec4 m = textureLod(uMap, clamp(uv, 0., 1.), lod);
      m.r = min(m.r * exp2(lod * 0.5), 0.85) * (0.2 + 0.8 * smoothstep(4., 40., vTaz.w));   // unresolved beads only take a breath of violet
      float inside = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
      float lit = smoothstep(0., 0.012, uTenc - m.g) * (1. - smoothstep(0., 0.03, uTenc - m.b));
      c += mix(uViolet, uCore, m.r) * m.r * lit * inside * uTreeGain * (1. + 2.5 * uStroke);
    }
    return c;
  }

  void main() {
    vec3 ro = uCam - vC, rw = normalize(vWorld - uCam);
    float kk = 1. - 1. / vShape.w;
    vec3 o = ro - kk * dot(ro, uVelDir) * uVelDir, dd = rw - kk * dot(rw, uVelDir) * uVelDir;
    vec3 su = 1. / vec3(vShape.x, vShape.y, vShape.x), sl = 1. / vec3(vShape.x, vShape.z, vShape.x);
    // upper half: oblate; lower half: flatter still (the flat underside of a falling drop)
    vec3 o1 = o * su, d1 = dd * su;
    float A = dot(d1, d1), B = dot(o1, d1), C = dot(o1, o1) - 1., disc = B * B - A * C;
    vec3 p = vec3(0.), n = vec3(0., 1., 0.); float hit = 0.;
    if (disc > 0.) { float t = (-B - sqrt(disc)) / max(A, 1e-6); vec3 q = o + dd * t; if (q.y >= 0.) { hit = 1.; p = q; n = q * su * su; } }
    if (hit < 0.5) {
      o1 = o * sl; d1 = dd * sl; A = dot(d1, d1); B = dot(o1, d1); C = dot(o1, o1) - 1.; disc = B * B - A * C;
      if (disc > 0.) { float t = (-B - sqrt(disc)) / max(A, 1e-6); vec3 q = o + dd * t; if (q.y < 0.) { hit = 1.; p = q; n = q * sl * sl; } }
    }
    if (hit < 0.5) discard;
    n -= kk * dot(n, uVelDir) * uVelDir;
    n = normalize(n + vec3(0., 1e-5, 0.));
    float ndv = clamp(dot(n, -rw), 0., 1.);
    // a ball lens: refract in, cross the ball, refract out. The scene comes out upside down and reversed.
    vec3 r1 = refract(rw, n, 0.75);
    vec3 p2 = n - 2. * dot(r1, n) * r1;
    vec3 outd = refract(r1, -p2, 1.333);
    if (dot(outd, outd) < 1e-4) outd = reflect(r1, -p2);
    outd = normalize(outd + vec3(0., 1e-5, 0.));
    vec3 refl = reflect(rw, n);
    float sk = vAx.y, inv = 1. / max(vShape.w, 1.);                  // at speed a bead is a glass dash: dark body, one thread of light, a lemon tick
    float F = (0.03 + 0.97 * pow(max(1. - ndv, 0.), 4.)) * inv;
    vec3 lk = uKey - vC; float lkd = max(length(lk), 1e-3); lk /= lkd;
    float keyI = uKeyI * (1. + 1.5 * uStroke);
    // (nk: how much of a HAIR it is to the eye. A drop that is half drawn out is already all hair: dark glass, never a
    // pale spindle that still carries the bead's glint and its lit heart along its whole length)
    float nk = smoothstep(0.12, 0.5, sk);
    vec3 col = (env(outd) * vec3(0.92, 0.97, 1.) * (1. - F) + env(refl) * F) * mix(1., 0.35, nk);
    float rim = (1. - ndv) * (1. - ndv);
    vec3 sx = cross(rw, uVelDir); float side = dot(n, sx / max(length(sx), 1e-3));
    float lead = vAx.x;
    float fine = smoothstep(1.2, 4., vTaz.w * mix(1., 0.35, sk));
    col += uGlowC * keyI * (pow(max(dot(refl, lk), 0.), 140.) * 4. + pow(max(dot(outd, lk), 0.), 120.) * 0.8);   // glint and the caustic heart
    float edgeK = mix(1., fine, sk);                                 // (nor can it hold a lit edge: that too would break into dots)
    col += uViolet * keyI * rim * rim * (0.2 + max(dot(n, lk), 0.)) * 0.9 * edgeK; col += uCloud * rim * 1.6 * inv;                                                    // violet edge from the leader
    col += uBand * rim * max(n.y, 0.) * max(-dot(n.xz, uBandDir) * 0.5 + 0.6, 0.) * 0.55 * edgeK;                       // cold-yellow edge on the bead top
    // AT SPEED A BEAD IS A HAIR OF DARK GLASS: a dark body, ONE pale edge, and the slot as a lemon tick in the leading
    // tenth of it and nowhere else (no thread of light down its length, no glint: a needle is never a lit bar)
    float tick = smoothstep(0.76, 0.84, lead) * (1. - smoothstep(0.93, 1., lead));
    vec3 needle = uSea * 0.9 + uCloud * 0.22 + (uCloud * 1.25 + uGlowC * keyI * 0.2) * smoothstep(0.2, 0.8, side) + uBand * 1.3 * tick;
    col = mix(col, needle, nk);
    // milky hail: a frosted ball. Mottled body lit from above, a bright Fresnel rim, the slot along its top edge,
    // the leader as a soft glint and a violet edge
    float frost = 0.5 + 0.5 * sin(dot(n, vec3(9.1, 7.3, 8.7)) + vInfo.y * 40.) * sin(dot(n, vec3(-6.2, 11.4, 5.1)) + vInfo.y * 17.);
    frost = mix(frost, 0.5 + 0.5 * sin(dot(n, vec3(23., -17., 29.)) + frost * 3.), 0.35);
    vec3 milk = uCloud * (0.75 + 0.85 * (0.5 + 0.5 * n.y)) * (0.7 + 0.5 * frost) + uCloud * rim * 2.4
      + uBand * max(n.y, 0.) * (rim * 0.9 + 0.12 * frost) * max(-dot(n.xz, uBandDir) * 0.5 + 0.7, 0.)
      + uGlowC * keyI * (0.22 * max(dot(n, lk), 0.) + pow(max(dot(refl, lk), 0.), 24.) * 0.9) + uViolet * keyI * rim * 0.7;
    col = mix(col, milk, vInfo.z * 0.82);
    float al = vInfo.x * smoothstep(0., 0.2, ndv) * mix(1., max(0.35 * smoothstep(-0.95, -0.2, lead) * (1. - smoothstep(0.86, 1., lead)), 0.9 * tick), nk);    // the body of a needle is thin dark glass (a third opaque at most) that thins to nothing at its tail; only the tick is solid
    vec3 spark = mix(uBand, uGlowC, step(0.25, fract(vInfo.y * 13.7))) * vInfo.w * ndv * ndv * (0.35 + keyI);
    spark *= mix(1., tick, nk);                                      // (a far bead's sparkle, on a needle, is its tick and nothing else: never a lit dash)
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        float ff = smoothstep(fogNear, fogFar, vFogDepth);
      #endif
      col = mix(col, fogColor, ff); spark *= 1. - ff;
    #endif
    gl_FragColor = vec4(max(col * al + spark, 0.), al);
  }`;

async function beadField(ctx, rng, n, o) {
  const base = new Float32Array(n * 3), parm = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    if (o.place) { const p = o.place(i); base[i * 3] = p.x; base[i * 3 + 1] = p.y; base[i * 3 + 2] = p.z; }
    else { base[i * 3] = rng(); base[i * 3 + 1] = rng(); base[i * 3 + 2] = rng(); }
    const big = rng() < o.bigShare;
    parm[i * 4] = 0.5 * (big ? rng.range(o.big[0], o.big[1]) : rng.range(o.size[0], o.size[1]));
    parm[i * 4 + 1] = rng();
    parm[i * 4 + 2] = rng.range(4, 8);
    parm[i * 4 + 3] = rng() < o.hail ? 1 : 0;
    if (i % 1000 === 999) await ctx.yield();
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  g.setAttribute('iBase', new THREE.InstancedBufferAttribute(base, 3));
  g.setAttribute('iParm', new THREE.InstancedBufferAttribute(parm, 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(V3(0, 0, 0), 1e5);
  return g;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  // RANDOM STREAMS, each taken once. The hero's own (one draw of ctx.rng, so yields below cannot reorder anyone
  // else's draws): the seed's character, the layout, the answer, the bead fields, the hung beads. THE TREE'S ONE STREAM
  // (the world's seed and its name; it draws nothing from any parent): trunk, ship limb, dive limbs, forks, twigs and
  // kink twigs, in that order. The rare stray and the riding drops have theirs (named below).
  const rng = makeRng('the-leader-hero:' + Math.floor(ctx.rng() * 1e9));
  const treeRng = makeRng(hashSeed('the-leader-tree:' + (ctx.seed ?? 1)));
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cCloud, cSea, cBand, cKey, cViolet, cRose] = pal;

  // ---- per-seed character
  const habitRoll = rng();
  const habit = opts.branches ? (opts.branches >= 72 ? 'willow' : opts.branches <= 38 ? 'sparse' : 'even') : habitRoll < 0.28 ? 'sparse' : habitRoll < 0.62 ? 'even' : 'willow';
  const count = Math.round(clamp(opts.branches ?? (habit === 'sparse' ? 32 : habit === 'willow' ? 80 : 60), 20, 90));
  const blue = rng() < 0.35;                               // blue-white fire instead of violet-white
  const rainRoll = rng();
  const rain = opts.rain || (rainRoll < 0.28 ? 'drizzle' : rainRoll < 0.75 ? 'beads' : 'hail');
  const core = cKey.clone().lerp(new THREE.Color(1, 1, 1), 0.45), glowC = cKey.clone(), violet = cViolet.clone();
  if (blue) { const b = new THREE.Color('#5f8dff'); violet.lerp(b, 0.7); glowC.lerp(new THREE.Color('#d8e6ff'), 0.7); }

  // ---- layout (local space = the brief's world space)
  const top = V3(72 + rng.range(-5, 5), 700, 470), foot = V3(140 + rng.range(-10, 10), 70, 380 + rng.range(-10, 10));
  const mastheads = (opts.mastheads || [V3(0, 29.1, 7.3), V3(-11, 29.6, 7.4), V3(-22, 27.2, 6.8)]).map((v) => v.clone());
  const skimA = opts.skim ? V3(...opts.skim[0]) : V3(45, 6, 290), skimB = opts.skim ? V3(...opts.skim[1]) : V3(33, 6, 165);
  const portal = V3(33, 37, 70);
  const junction = mastheads[0].clone().add(V3(5.5, 49, 7));           // streamer 50 m, leaning up toward the limb
  const route = makeRoute(top, foot, skimA, skimB, portal);
  const crests = (opts.crests || Array.from({ length: 9 }, (_, i) => V3(lerp(skimA.x, skimB.x, (i + 0.5) / 9) + (i % 2 ? -1 : 1) * rng.range(9, 26), 2.4, lerp(skimA.z, skimB.z, (i + 0.5) / 9) - rng.range(8, 30)))).map((v) => v.clone());
  await ctx.yield();

  // the rare event's stall point: 4 m to the right (+X) of the skim line and 1 m above it, where the camera is at about T 24
  const strayAt = opts.stray ? (opts.stray.isVector3 ? opts.stray.clone() : skimA.clone().lerp(skimB, 0.415).add(V3(4, 1, 0))) : null;
  const station = makeStation(route, top, foot);
  const tree = await growTree(ctx, rng, { treeRng, station, route, top, foot, junction, mastheads, crests, count, habit, stray: strayAt, strayT: opts.strayT, strayRng: strayAt ? makeRng(hashSeed('the-leader-stray:' + (ctx.seed ?? 1))) : null });
  const branches = tree.branches;
  await ctx.yield();
  const { geometry: treeGeo, steps } = await buildTreeGeometry(ctx, branches);
  await ctx.yield();
  const growthMap = await bakeGrowthMap(ctx, branches);
  await ctx.yield();

  // ---- shared uniforms
  const U = {
    uT: { value: 12 }, uAmb: { value: 0 }, uResY: { value: 450 }, uStroke: { value: 0 }, uFront: { value: 0 }, uAfter: { value: 0 },
    uHaze: { value: opts.haze ?? 0.35 }, uGain: { value: 1 }, uWidth: { value: 1 },
    uCore: { value: core }, uGlowC: { value: glowC }, uViolet: { value: violet }, uRose: { value: cRose.clone() },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const object = new THREE.Group(); object.name = 'the-leader';

  const treeMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), uT: U.uT, uResY: U.uResY, uStroke: U.uStroke, uFront: U.uFront, uAfter: U.uAfter, uHaze: U.uHaze, uGain: U.uGain, uWidth: U.uWidth, uCore: U.uCore, uGlowC: U.uGlowC, uViolet: U.uViolet, uRose: U.uRose },
    vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
  });
  const treeMesh = new THREE.Mesh(treeGeo, treeMat); treeMesh.frustumCulled = false; treeMesh.renderOrder = 2; treeMesh.name = 'leader-tree';
  object.add(treeMesh);

  // ---- coronas: one instance per tip that matters (channels first, then twigs and crest threads while room lasts)
  const tipped = branches.slice().sort((a, b) => a.level - b.level || b.width - a.width).slice(0, 760);   // every live tip carries its corona and brush: no channel ends in a bare stub
  const NC = tipped.length;
  const cPos = new Float32Array(NC * 3), cDir = new Float32Array(NC * 3), cParm = new Float32Array(NC * 4);
  const cGeo = new THREE.InstancedBufferGeometry();
  cGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]), 3));
  cGeo.setIndex([0, 1, 2, 2, 1, 3]);
  const aPos = new THREE.InstancedBufferAttribute(cPos, 3), aDir = new THREE.InstancedBufferAttribute(cDir, 3), aParm = new THREE.InstancedBufferAttribute(cParm, 4);
  aPos.setUsage(THREE.DynamicDrawUsage); aDir.setUsage(THREE.DynamicDrawUsage); aParm.setUsage(THREE.DynamicDrawUsage);
  cGeo.setAttribute('iPos', aPos); cGeo.setAttribute('iDir', aDir); cGeo.setAttribute('iParm', aParm);
  cGeo.instanceCount = NC; cGeo.boundingSphere = new THREE.Sphere(V3(70, 380, 280), 700);
  const coronaMat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), uT: U.uT, uResY: U.uResY, uHaze: U.uHaze, uGain: U.uGain, uCore: U.uCore, uGlowC: U.uGlowC, uViolet: U.uViolet, uRose: U.uRose },
    vertexShader: CORONA_VERT, fragmentShader: CORONA_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
  });
  const coronaMesh = new THREE.Mesh(cGeo, coronaMat); coronaMesh.frustumCulled = false; coronaMesh.renderOrder = 3; coronaMesh.name = 'leader-coronas';
  object.add(coronaMesh);
  await ctx.yield();

  // ---- the rain
  const treeC = V3(lerp(top.x, foot.x, 0.5), 350, lerp(top.z, foot.z, 0.5));
  const B = {
    uCam: { value: V3(0, 300, 600) }, uCamRight: { value: V3(1, 0, 0) }, uCamFwd: { value: V3(0, 0, -1) }, uVelDir: { value: V3(0, -1, 0) }, uStreak: { value: 0 },
    uTreeC: { value: treeC }, uKey: { value: V3().copy(foot) }, uKeyI: { value: 0.6 }, uSink: { value: 0 }, uCheat: { value: opts.cheat ?? 0.75 }, uSize: { value: 1 },
    uBand: { value: cBand.clone() }, uCloud: { value: cCloud.clone() }, uSea: { value: cSea.clone() }, uBandDir: { value: new THREE.Vector2(0, -1) },
    uBandW: { value: Math.cos(70 * Math.PI / 180) }, uBandH: { value: 0.17 }, uTenc: { value: encT(12) }, uTreeGain: { value: 2.0 }, uMap: { value: growthMap },
  };
  const beadMat = (box, wrap, minPx, floorA, ride = 0) => new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...B, uT: U.uT, uAmb: U.uAmb, uResY: U.uResY, uStroke: U.uStroke, uCore: U.uCore, uGlowC: U.uGlowC, uViolet: U.uViolet,
      uBox: { value: box }, uWrap: { value: wrap }, uMinPx: { value: minPx }, uFloorA: { value: floorA }, uRide: { value: ride }, uShow: { value: 1 } },
    vertexShader: BEAD_VERT, fragmentShader: BEAD_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, blending: THREE.NormalBlending, side: THREE.DoubleSide, fog: true,
  });
  const bk = (opts.beads ?? 1) * detail * (rain === 'drizzle' ? 1.25 : rain === 'hail' ? 0.62 : 1);
  const sz = rain === 'drizzle' ? [0.02, 0.045] : rain === 'hail' ? [0.05, 0.11] : [0.03, 0.07];
  const hailShare = rain === 'hail' ? 0.24 : 0;
  const fields = [
    { name: 'rain-far', n: Math.round(24000 * bk), box: 200, minPx: 1.0, floorA: 0.03, bigShare: 0.05 },
    { name: 'rain-near', n: Math.round(15000 * bk), box: 60, minPx: 1.2, floorA: 0.05, bigShare: 0.08 },
    { name: 'rain-close', n: Math.round(5000 * bk), box: 14, minPx: 1.2, floorA: 0.12, bigShare: 0.1 },
  ];
  const beadMeshes = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const g = await beadField(ctx, rng, f.n, { size: sz, big: [sz[1] * 1.15, sz[1] * 2.1], bigShare: f.bigShare, hail: hailShare });
    const m = new THREE.Mesh(g, beadMat(f.box, 1, f.minPx, f.floorA)); m.frustumCulled = false; m.renderOrder = 4 + i; m.name = f.name;
    object.add(m); beadMeshes.push(m);
    await ctx.yield();
  }
  // 140 hero beads hung along the skim, 0.7-2.9 m from the camera line, mostly ahead-right and ahead-left at eye height
  const skimDir = skimB.clone().sub(skimA), skimLen = skimDir.length(); skimDir.multiplyScalar(1 / skimLen);
  const skimSide = V3(-skimDir.z, 0, skimDir.x);
  const heroBeads = [], NHERO = 140;
  for (let i = 0; i < NHERO; i++) {
    const s = (i + rng.range(0.1, 0.9)) / NHERO, ang = rng.range(-1.2, 1.2) + (rng() < 0.5 ? 0 : Math.PI), r = rng.range(0.7, 2.9);
    heroBeads.push(skimA.clone().addScaledVector(skimDir, lerp(8, skimLen + 6, s)).addScaledVector(skimSide, Math.cos(ang) * r).add(V3(0, Math.sin(ang) * r * 0.55 + 0.15, 0)));
  }
  const heroGeo = await beadField(ctx, rng, NHERO, { place: (i) => heroBeads[i], size: [0.12, 0.3], big: [0.12, 0.3], bigShare: 0, hail: rain === 'hail' ? 0.15 : 0 });
  { // a milky hailstone at the lens is a blank shape: the hero beads nearer the camera line than 1.6 m stay clear glass
    const hp = heroGeo.attributes.iParm, rel = V3();
    for (let i = 0; i < NHERO; i++) { rel.subVectors(heroBeads[i], skimA); rel.addScaledVector(skimDir, -rel.dot(skimDir)); if (rel.length() < 1.6) hp.setW(i, 0); }
  }
  const heroMesh = new THREE.Mesh(heroGeo, beadMat(1, 0, 1.2, 0.2)); heroMesh.frustumCulled = false; heroMesh.renderOrder = 8; heroMesh.name = 'rain-hero-beads';
  object.add(heroMesh); beadMeshes.push(heroMesh);
  await ctx.yield();
  // THE DROPS THAT RIDE WITH THE LENS in the dive: some sixty large beads (14-34 cm) in an 8 m box that travels
  // with the camera at half its speed, so they go up past the lens at half our speed: glass buns close to the lens
  // (lens, rim and inverted tree), drawn out 0.6 as far as the rest of the rain: the dive's foreground.
  // Their own random stream (nothing else moves). They fade out below 110 m: the skim has its hung hero beads.
  const rideGeo = await beadField(ctx, makeRng('the-leader-ride:' + (ctx.seed ?? 1)), Math.round(64 * Math.max(detail, 0.6) * Math.min(opts.beads ?? 1, 1)), { size: [0.14, 0.26], big: [0.26, 0.34], bigShare: 0.15, hail: 0 });
  const rideMat = beadMat(8, 1, 1.2, 0.2, 1);
  const rideMesh = new THREE.Mesh(rideGeo, rideMat); rideMesh.frustumCulled = false; rideMesh.renderOrder = 8.5; rideMesh.name = 'rain-riding-drops';
  object.add(rideMesh); beadMeshes.push(rideMesh);
  await ctx.yield();

  // ---- runtime
  const named = {}; for (const b of branches) named[b.name] = b;
  const tipAt = (name, T, out = V3(), dirOut = null) => {
    const b = typeof name === 'string' ? named[name] : name; if (!b) return out.set(0, 0, 0);
    const bt = b.birth, n = bt.length;
    if (T <= bt[0]) { if (dirOut) dirOut.subVectors(b.pts[1], b.pts[0]).normalize(); return out.copy(b.pts[0]); }
    if (T >= bt[n - 1]) { if (dirOut) dirOut.subVectors(b.pts[n - 1], b.pts[n - 2]).normalize(); return out.copy(b.pts[n - 1]); }
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (bt[mid] <= T) lo = mid; else hi = mid; }
    if (dirOut) dirOut.subVectors(b.pts[hi], b.pts[lo]).normalize();
    return out.lerpVectors(b.pts[lo], b.pts[hi], (T - bt[lo]) / Math.max(bt[hi] - bt[lo], 1e-4));
  };

  // THE LEADING LIMB'S TIP at journey second T, for the ONE pull of the dive (the world calls this from inside its
  // pull, with T from u): the tip of whichever dive limb leads, taken as the mean of its place over 1.6 s (a tip
  // steps from kink to kink; the look follows its course, not each step), and handed from one limb to the next over
  // the second in which both are on station.
  const leadTmp = V3(), leadAt = (T, out = V3()) => {
    const L = tree.lead; out.set(0, 0, 0);
    for (let k = 0; k < L.length; k++) {
      const w = (k ? smoothstep(L[k].on, L[k].on + 1, T) : 1) * (k < L.length - 1 ? 1 - smoothstep(L[k + 1].on, L[k + 1].on + 1, T) : 1);
      if (w <= 0) continue;
      for (let j = -4; j <= 4; j++) out.addScaledVector(tipAt(L[k].name, Math.max(T + j * 0.2, L[k].on), leadTmp), w / 9);
    }
    return out;
  };

  const hero = {
    object, radius: 300, height: 700, center: V3(66, 330, 250), ground: true, groundY: 0,
    T: 12, stroke: 0, key: { position: foot.clone(), intensity: 0.6 }, growthMap, uniforms: U, beadUniforms: B,
    habit, rain, blue, branchCount: branches.length, steps, tipAt, leadAt, station, branches,
  };
  let driven = false, forcedVel = null, havePrev = false;
  const prevCam = V3(), camW = V3(), camL = V3(), vel = V3(), tmp = V3(), tmpD = V3(), fwd = V3(), right = V3(), keyTarget = foot.clone();
  const size = new THREE.Vector2(), inv = new THREE.Matrix4();

  hero.setTime = (T) => { driven = true; hero.T = clamp(T, 0, 40); };
  hero.setProgress = (u) => hero.setTime(clamp(u, 0, 1) * 40);
  const fvel = V3(); hero.setVelocity = (v) => { forcedVel = v ? fvel.copy(v) : null; };
  hero.setEnv = (e = {}) => {
    if (e.band) B.uBand.value.copy(e.band); if (e.cloud) B.uCloud.value.copy(e.cloud); if (e.sea) B.uSea.value.copy(e.sea);
    if (e.bandDir) B.uBandDir.value.set(e.bandDir.x, e.bandDir.y).normalize();
    if (e.bandWidth !== undefined) B.uBandW.value = Math.cos(clamp(e.bandWidth, 0.05, Math.PI) * 0.5);
    if (e.bandHeight !== undefined) B.uBandH.value = e.bandHeight;
  };

  hero.update = (dt, time, camera) => {
    if (!driven) hero.T = time % 40;
    const T = hero.T;
    // the stroke: eased rise as the front runs masthead -> cloud (0.5 s), hold 0.8 s, ease away over 1.5 s
    const front = clamp((T - 35.5) / 0.5, 0, 1), stroke = T < 35.5 ? 0 : T < 36.0 ? smoothstep(0, 1, front) : T < 36.8 ? 1 : 1 - smoothstep(36.8, 38.3, T);
    const after = smoothstep(35.6, 37.2, T);
    hero.stroke = stroke;
    U.uT.value = T; U.uAmb.value = time; U.uStroke.value = stroke; U.uFront.value = front * 1.06; U.uAfter.value = after;
    B.uTenc.value = encT(T); B.uSink.value = time * 0.02;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uResY.value = size.y; }
    // camera in local space (the world matrix may have been set directly: never camera.position)
    object.updateWorldMatrix(true, false); inv.copy(object.matrixWorld).invert();
    camW.setFromMatrixPosition(camera.matrixWorld); camL.copy(camW).applyMatrix4(inv);
    const e = camera.matrixWorld.elements;
    right.set(e[0], e[1], e[2]).transformDirection(inv); fwd.set(-e[8], -e[9], -e[10]).transformDirection(inv);
    B.uCam.value.copy(camL); B.uCamRight.value.copy(right); B.uCamFwd.value.copy(fwd);
    if (forcedVel) vel.copy(forcedVel);
    else if (havePrev && dt > 1e-3 && dt < 0.25 && camL.distanceTo(prevCam) < 14) { tmp.subVectors(camL, prevCam).multiplyScalar(1 / dt); vel.lerp(tmp, clamp(dt * 6, 0, 1)); }
    else vel.multiplyScalar(0.5);
    prevCam.copy(camL); havePrev = true;
    const speed = vel.length();
    if (speed > 0.5) B.uVelDir.value.copy(vel).multiplyScalar(1 / speed);
    B.uStreak.value = Math.max(0, Math.min(speed, 80) - 20) * 0.0075 * (opts.streak ?? 1);
    rideMat.uniforms.uShow.value = smoothstep(45, 110, camL.y);
    // tips: corona instances and the key
    let best = 1e9, bestI = 0;
    for (let i = 0; i < NC; i++) {
      const b = tipped[i];
      let I = 0, sizeK = b.corona * (0.55 + 0.45 * Math.min(b.width, 1.2)), rose = 0;
      if (T > b.birth[0]) {
        tipAt(b, T, tmp, tmpD);
        I = smoothstep(0, 0.5, T - b.birth[0]);
        if (T >= b.stall) {                                // stalled: the corona shrinks and goes rose
          const x = (T - b.stall) / 1.6; I *= 1 - smoothstep(0, 1, x); sizeK *= 1 - 0.6 * smoothstep(0, 1, x); rose = smoothstep(0, 0.6, x);
        }
        if (!b.stroke) { I *= 1 - 0.75 * after; rose = Math.max(rose, after); } else if (b.level === 0 || b.name === 'fore') { I *= 1 + 0.8 * stroke; sizeK *= 1 + 0.5 * stroke; }
        cPos[i * 3] = tmp.x; cPos[i * 3 + 1] = tmp.y; cPos[i * 3 + 2] = tmp.z;
        cDir[i * 3] = tmpD.x; cDir[i * 3 + 1] = tmpD.y; cDir[i * 3 + 2] = tmpD.z;
        if (I > 0.3 && b.level < 3) { const d = tmp.distanceTo(camL) / (0.4 + b.corona * b.width); if (d < best) { best = d; bestI = I; keyTarget.copy(tmp); } }
      }
      cParm[i * 4] = sizeK; cParm[i * 4 + 1] = I * b.coronaI; cParm[i * 4 + 2] = b.seed; cParm[i * 4 + 3] = rose;
    }
    aPos.needsUpdate = true; aDir.needsUpdate = true; aParm.needsUpdate = true;
    const kd = hero.key.position.distanceTo(keyTarget);
    if (kd > 400 || !havePrev) hero.key.position.copy(keyTarget); else hero.key.position.lerp(keyTarget, clamp(dt * 2.5, 0, 1));
    hero.key.intensity = clamp(bestI, 0, 1) * (1 + 0.6 * stroke);
    B.uKey.value.copy(hero.key.position); B.uKeyI.value = 0.35 + 0.65 * hero.key.intensity;
  };
  hero.dispose = () => {};

  hero.anchors = {
    entry: V3(60, 690, 525), flyThrough: route.pts.map((p) => p.clone()),
    entryTimes: route.entryTimes.slice(), helixTimes: route.helixTimes.slice(), lead: tree.lead.map((l) => ({ ...l })), overtake: T_OVER, lowLimbRest: tree.rest.clone(), stray: strayAt ? strayAt.clone() : null,
    trunkTop: top.clone(), trunkFoot: foot.clone(), fork: tree.fork.clone(), junction: junction.clone(), shipLimbEnd: junction.clone(),
    mastheads: mastheads.map((m) => m.clone()), crests: crests.map((m) => m.clone()), skim: [skimA.clone(), skimB.clone()], heroBeads,
    portalSeat: { position: portal.clone(), normal: V3(0, -Math.sin(18 * Math.PI / 180), Math.cos(18 * Math.PI / 180)), radius: 7 },
    viewpoints: [
      { position: V3(60, 690, 525), target: V3(66, 660, 470), T: 1 },
      { position: route.helix(0.45), target: route.helix(0.6), T: 9 },
      { position: skimA.clone().lerp(skimB, 0.33), target: V3(8, 30, 0), T: 23 },
      { position: skimA.clone().lerp(skimB, 0.62), target: V3(8, 30, 0), T: 26 },
      { position: V3(33, 17.5, 130), target: portal.clone(), T: 35.5 },
    ],
  };
  object.userData.hero = hero;
  hero.update(0, 12, { matrixWorld: new THREE.Matrix4().makeTranslation(0, 300, 600) });
  havePrev = false;
  return hero;
}
