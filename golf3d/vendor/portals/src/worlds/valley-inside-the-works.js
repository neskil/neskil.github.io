// THE VALLEY INSIDE THE WORKS
// Under a factory roof lies a green river valley in flower, and its river and its waterfall are melted chocolate:
// iron columns stand in the grass, daylight falls in bars from a saw-tooth roof, brick walls stop the meadow like a
// garden wall, one great glass pipe comes down from the roof into the lower river and draws it up, and a rank of
// seven slim ones draws the river up out of its pool and carries it away under the roof.
//
// WHO BUILDS WHAT (design, section 8). This file, src/parts/valley-inside-the-works-air*.js and
// src/parts/valley-inside-the-works-pipes*.js are the WORLD builder's: the flown line, the looks, the pace and the
// ring; the two lights and their looks by the hour; the sky behind the glass; haze, dust and beams in the air; the
// great glass pipe in the lower river, with its joints, its stays to the columns and its collar in the roof, and the
// seven glass pipes with their flow, joints, clamps and cross-beams, and the iron shoes and stone pads on which they
// stand in the pool. The meadow, the shed and the chocolate are three other builders' parts (…-meadow.js, …-shed.js,
// …-chocolate.js), put together here and never edited here. The shared numbers, the ground, the flown line and the
// one law of the bars of light stand in …-plan.js (the designer's).
//
// THE ROUTE, BY THE DESIGN'S PLACES (metres; the river runs toward +z, we fly upstream toward -z the whole way and
// keep to the nave between the column rows x = -14 and x = 14): in at ENTRY (4, 8, 150), level, 6 m over the
// chocolate; a bee's height over the first tongue of meadow (z 138 to 86); low up the river, between the cream
// spring on the left bank and the great pipe standing in the river on the right, whose glass we pass at under 7 m
// (z 86 to 36); a steady climb over the second tongue with the fall square ahead (z 36 to -20); past the pipes' risers
// at half their height and over the fall's lip (z -20 to -60); level at 31 up the upper valley with the pipes running
// alongside on the right (z -60 to -169); then a STRAIGHT last leg of 60 m climbing 7 degrees to the ring in the
// middle round window of the head wall, EXIT (0, 43, -228.5). The path is the plan's ROUTE and nothing else.
// BEHIND THE ENTRY: the lens begins low over the river, so camera.nearThrough is set; ground and river run on 60 m
// behind the entry and nothing of ours stands within 7 m of that straight (the great pipe stands 80 m further up
// and the rank of pipes 170 m; dawn's mist banks keep 15 m from it in plan; the dust keeps 3 m from the flown line
// and its straight behind the entry).
//
// THE LOOKS (the design's nine, section 5, and no other). Each has one target, a place of the plan that does not
// move, and ALL NINE ARE LAID BY ONE RULE with the same figures (LOOK, below); no look has a figure of its own:
//   it OPENS at the first place of the route where its target stands within 40 degrees of the bow and within
//   80 m (for two of them, not before the plan's place that uncovers the target: the flowers where the line first
//   comes over the first tongue's bank, the upper river at the fall's lip);
//   it CLOSES where its target stands 50 degrees off the bow, or with the route (the ring never stands off it);
//   it FADES in and out over three tenths of its window.
// So every window lies where the valley puts it; where two overlap the engine mixes them by their weights.
// THE TARGETS: 1 the meadow's flowers: the grass near the upstream tip of the first tongue (3 m in from the
// river's bank, 8 m short of where that bank crosses the nave's middle line). 2 the cream spring: its basin on
// the left bank. 3 the river: the foot of the column that stands deepest in the stream between the spring and the
// fall. 4 the fall: the middle of its sheet. 5 the pipes: the rank's risers at half their height. 6 the fall's lip.
// 7 the upper river: the middle of the first stretch above the fall where it lies under the nave's middle line.
// 8 the troughs: the middle of the terrace's troughs. 9 the ring: EXIT.
// THE PACE (declared): the flight is paced by places, never by the clock or a share of the way. A fifth slower over
// the lower river, from where the flown line leaves the first tongue to the column row z = 40 at the foot of the
// climb; 0.22 slower past the pipes and over the fall, from PIPES_AHEAD (28 m) short of the risers to the lip; a
// fifth quicker on the level high run, from the column row z = -60 where the climb ends to the column row z = -140.
// Each change is eased over 16 m of route centred on its place. The engine holds the mean at 1.
//
// NOTHING HERE IS PLACED, SHOWN, HIDDEN OR LIT BY THE LENS, the frame, a seed's number or the wall clock. No fog,
// light, colour or strength changes along the flight: a visit's look is dealt once (ctx.vary.hour). The chocolate
// in the pipes, the dust, dawn's mist and the cloud behind the glass go by the world's clock and look right from
// any starting clock. THE WAY OUT: the ring, its rim's glow and the showing of the next world in it are the
// engine's own (portal.glow, portal.revealDistance and portal.drawWithin are its settings), and the engine draws
// them from the fall's lip on (drawWithin: the metres still to fly there). The way out is the middle one of the
// head wall's five round windows: the other four are glazed with sugar glass, this one is an open iron ring with
// the sky behind it. Round the way out, on the head wall's brick and wholly outside the shed's iron ring, stands
// a ROSETTE of separate boiled sweets twice the ring's width across, under an arch of brick and stone (the shed
// builder's). It is built with the shed and stands there from the first frame; each sweet glows steadily by its
// own material, adds no light and lights nothing of the ring. The ring's radius is the plan's EXIT_RADIUS, which
// the shed's iron ring meets. Nothing of ours lights the ring or doubles it, and nothing else in the world comes
// on or goes by the metres still to fly.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as P from '../parts/valley-inside-the-works-plan.js';
import { buildMeadow } from '../parts/valley-inside-the-works-meadow.js';
import { buildShed } from '../parts/valley-inside-the-works-shed.js';
import { buildChocolate } from '../parts/valley-inside-the-works-chocolate.js';
import { LOOKS, buildAir } from '../parts/valley-inside-the-works-air.js';
import { buildPipes } from '../parts/valley-inside-the-works-pipes.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// THE LOOKS' ONE RULE (the head): a look opens with its target within `within` degrees of the bow and `range` metres,
// closes with it `off` degrees off the bow, and fades over the share `fade` of its window at either end.
const LOOK = { within: 40, range: 80, off: 50, fade: 0.3 };
// THE PIPES' PLACE on the route begins this many metres short of where the risers stand abeam (the pace).
const PIPES_AHEAD = 28;

export default {
  id: 'valley-inside-the-works',
  name: 'The Valley Inside the Works',
  category: 'screen',
  placeKind: 'interior',
  screen: 'Charlie and the Chocolate Factory',
  screenYear: '2005',
  screenKind: 'film',
  media: ['air', 'interior'],
  weirdness: 0.5,
  async build(ctx) {
    // ---- what the visit deals: the hour (always day, always indoors: it picks one of four daylights), the rare drift
    // of petals, the count of flowers and trees, and the machine's detail
    const vary = ctx.vary || {};
    const hour = LOOKS[vary.hour] ? vary.hour : 'day';
    const L = LOOKS[hour];
    const dealt = { hour, rare: !!vary.rare, density: Math.min(1.3, Math.max(0.7, vary.density || 1)), detail: (ctx.quality && ctx.quality.detail) || 1 };
    const rngFor = (name) => ctx.core.makeRng(ctx.core.hashSeed('valley:' + name + ':' + ctx.seed));

    const scene = new THREE.Scene();
    const path = makePath(P.ROUTE), LEN = path.length;
    scene.background = new THREE.Color(L.back);
    scene.fog = new THREE.FogExp2(L.fog, L.fogDensity);

    // ---- THE TWO LIGHTS, never more or fewer: the sky's fill (strong, so that shade holds its colour) and the sun
    // through the roof glass, along the plan's LIGHT_DIR. The bars are laid over the sun's part by the plan's one law.
    const lightDir = new THREE.Vector3(P.LIGHT_DIR[0], P.LIGHT_DIR[1], P.LIGHT_DIR[2]).normalize();
    const hemi = new THREE.HemisphereLight(L.sky, L.shade, L.fill);
    const sun = new THREE.DirectionalLight(L.sun, L.sunPower);
    sun.position.copy(lightDir).multiplyScalar(300);
    scene.add(hemi, sun, sun.target);
    await ctx.yield();

    // ---- what every part is handed: the same `o` as the designer's scaffold hands it
    const o = {
      THREE, rngFor, lightDir,
      look: {
        hour, sun: new THREE.Color(L.sun), sky: new THREE.Color(L.sky), shade: new THREE.Color(L.shade), haze: L.haze,
        petals: dealt.rare, density: dealt.density, detail: dealt.detail,
      },
    };
    // ---- THE PARTS: the three other builders' (shed, meadow, chocolate), then our pipes, then our air
    const built = [];
    const add = async (make, oo) => { const part = await make(ctx, oo); scene.add(part.object); built.push(part); await ctx.yield(); return part; };
    await add(buildShed, o);
    await add(buildMeadow, o);
    const river = await add(buildChocolate, o);
    // the river's own body colour, read from the chocolate part's material as built (its uBody): the pipes' liquid is
    // given the same, so that river and pipes are one chocolate
    let body = null;
    river.object.traverse((m) => { const u = m.material && m.material.uniforms; if (!body && u && u.uBody) body = u.uBody.value; });
    await add(buildPipes, { ...o, L, body });
    const air = await buildAir(ctx, { ...o, L });
    scene.add(air.object);
    await ctx.yield();

    // ---- PLACES ON THE ROUTE, in metres flown from the entry. The flown line runs toward -z the whole way, so it
    // passes each cross-section of the hall once: abeam(z) is where. crossing(from, land) is where the line next
    // comes over land (or back over the river), by the plan's bankDistance under the line.
    const N = 800, pv = new THREE.Vector3(), tv = new THREE.Vector3(), zs = [];
    for (let i = 0; i <= N; i++) zs.push(path.pointAt(i / N, pv).z);
    const abeam = (z) => { for (let i = 1; i <= N; i++) if (zs[i] <= z) return LEN * (i - (z - zs[i]) / Math.max(1e-6, zs[i - 1] - zs[i])) / N; return LEN; };
    const crossing = (from, land) => { for (let m = from; m < LEN; m += 0.25) { path.pointAt(m / LEN, pv); if ((P.bankDistance(pv.x, pv.z) > 0) === land) return m; } return LEN; };
    const tongueOn = crossing(0, true), tongueOff = crossing(tongueOn, false);     // the first tongue of meadow under us: its start and its end
    // abeam of: the column row z = 40 (the foot of the climb); the pipes' risers; the fall's lip; the column rows
    // z = -60 (the climb's end) and z = -140
    const climb = abeam(P.columnZ(8)), risers = abeam(P.PIPES.riseZ), lip = abeam(P.FALL_Z);
    const levelOff = abeam(P.columnZ(13)), highEnd = abeam(P.columnZ(17));
    await ctx.yield();

    // ---- THE LOOKS' TARGETS: nine places of the plan, none of which moves
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    // along the nave's middle line (midway between the two middle column rows), going upstream from z: the next z
    // at which that line lies over land (or over the river), by the plan's bankDistance; never past the head wall
    const NAVE = 0.5 * (P.COLUMN_X[1] + P.COLUMN_X[2]);
    const naveNext = (z, land) => { while (z > P.SHED.zHead && (P.bankDistance(NAVE, z) > 0) !== land) z -= 0.25; return z; };
    // the grass 3 m in from the river's bank, 8 m short of the upstream tip of the first tongue
    const zTip = naveNext(naveNext(P.ENTRY.z, true), false) + 8, xTip = P.riverX(zTip) + P.riverHalfWidth(zTip) + 3;
    const tFlowers = V(xTip, P.groundHeight(xTip, zTip), zTip);
    const tSpring = V(P.CREAM.x, P.groundHeight(P.CREAM.x, P.CREAM.z), P.CREAM.z);
    // of the plan's 22 column rows, the column of the row x = 14 that stands deepest in the river between the cream
    // spring and the fall, where the river is no wider than at the spring (so not in the pool)
    let zPier = P.CREAM.z, deep = 1e9;
    for (let k = 0; k < 22; k++) {
      const z = P.columnZ(k), d = P.bankDistance(P.COLUMN_X[2], z);
      if (z < P.CREAM.z && z > P.FALL_Z && P.riverHalfWidth(z) <= P.riverHalfWidth(P.CREAM.z) && d < deep) { deep = d; zPier = z; }
    }
    // (the five targets on the chocolate lie on its surface, the plan's liquidY: the column's foot in the stream, the
    // fall's sheet between its two levels, the foot of the risers, the lip, the upper river)
    const tRiver = V(P.COLUMN_X[2], P.liquidY(zPier), zPier);
    const tFall = V(P.riverX(P.FALL_Z), 0.5 * (P.liquidY(P.FALL_Z) + P.liquidY(P.FALL_Z - 1)), P.FALL_Z);
    const tPipes = V(P.PIPES.x, 0.5 * (P.liquidY(P.PIPES.riseZ) + P.PIPES.run), P.PIPES.riseZ);
    const tLip = V(P.riverX(P.FALL_Z), P.liquidY(P.FALL_Z - 1), P.FALL_Z);
    // the upper river in the middle of the stretch where it lies under the nave's middle line (the first such
    // stretch above the fall's own)
    const zOn = naveNext(naveNext(P.FALL_Z, true), false), zUnder = 0.5 * (zOn + naveNext(zOn, true));
    const tUpper = V(P.riverX(zUnder), P.liquidY(zUnder), zUnder);
    const tTroughs = V(0.5 * (P.TROUGH_X[1] + P.TROUGH_X[2]), P.TROUGH.level, 0.5 * (P.TROUGH.z0 + P.TROUGH.z1));
    const tRing = V(P.EXIT.x, P.EXIT.y, P.EXIT.z);

    // ---- THE LOOKS, all nine by the one rule at the head, with LOOK's figures and no other. off(p, m): how many
    // degrees the place p stands off the bow at m metres flown, and how far away it is from there. A look opens at
    // the first place (not before `uncovered`) where its target stands within LOOK.within degrees and LOOK.range
    // metres, and closes where it stands LOOK.off degrees off the bow, or with the route.
    const off = (p, m) => {
      path.pointAt(m / LEN, pv); path.tangentAt(m / LEN, tv);
      const range = pv.sub(p).length();
      return [Math.acos(Math.min(1, Math.max(-1, -pv.dot(tv) / Math.max(range, 1e-6)))) * 180 / Math.PI, range];
    };
    const look = (at, weight, uncovered = 0) => {
      let open = LEN, close = LEN;
      for (let m = uncovered; m < LEN; m += 0.25) { const [deg, range] = off(at, m); if (deg <= LOOK.within && range <= LOOK.range) { open = m; break; } }
      for (let m = open; m < LEN; m += 0.25) if (off(at, m)[0] > LOOK.off) { close = m; break; }
      return { at, from: open / LEN, to: close / LEN, fade: LOOK.fade, weight };
    };
    // (each look is laid in a step of its own: target, weight, and for two the plan's place that uncovers the target)
    const pois = [];
    for (const [at, weight, uncovered] of [
      [tFlowers, 0.42, tongueOn], [tSpring, 0.45], [tRiver, 0.4], [tFall, 0.45], [tPipes, 0.46],
      [tLip, 0.42], [tUpper, 0.35, lip], [tTroughs, 0.4], [tRing, 0.6],
    ]) {
      const laid = look(at, weight, uncovered);
      if (laid.to > laid.from) pois.push(laid);          // (a target that never comes inside the rule's cone has no look)
      await ctx.yield();
    }
    // ---- THE PACE (declared at the head): slower over the lower river and past the pipes and the fall, quicker on
    // the level high run; each change eased over 16 m centred on its place
    const ease = (m, at) => sstep(at - 8, at + 8, m);
    const pace = (u) => { const m = u * LEN; return 1 - 0.2 * (ease(m, tongueOff) - ease(m, climb)) - 0.22 * (ease(m, risers - PIPES_AHEAD) - ease(m, lip)) + 0.2 * (ease(m, levelOff) - ease(m, highEnd)); };

    await air.prewarm(ctx.renderer, scene);
    return {
      scene, path, duration: 42, pois, pace,
      camera: { fov: 62, near: 0.3, far: 1400, lookAhead: 18, sway: 0.4, bank: 0.3, nearThrough: 0.3 },
      // (drawWithin: the engine draws the ring from the fall's lip on, 190 m of route from it, and not before; it
      // opens small about its own middle over the engine's own opening stretch, inside the shed's iron ring in the
      // middle window. revealDistance is the same metres, never over drawWithin: the next place comes on in the
      // ring from its first drawing and is whole with six tenths of that left to fly. radius: the plan's
      // EXIT_RADIUS, which the shed's iron ring in the middle window meets)
      portal: { shape: 'circle', radius: P.EXIT_RADIUS, color: L.ring, glow: 0.35, revealDistance: LEN - lip, drawWithin: LEN - lip },
      post: { exposure: L.exposure, bloom: { strength: L.bloom, radius: 0.5, threshold: 1.6 },
        grade: { saturation: L.saturation, contrast: L.contrast, tint: L.tint, shadowTint: L.shadowTint, vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        for (const b of built) b.update(dt, time, u);          // (the design's join hands every part u; the pipes do not read it)
        air.update(dt, time, camera);                          // (the sky is drawn round whichever camera renders it)
      },
      dispose() { for (const b of built) b.dispose(); air.dispose(); },
    };
  },
};
