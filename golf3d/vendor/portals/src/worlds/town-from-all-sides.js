// The Town Seen from Everywhere: a pearl-grey morning over a Cubist hill town above a nine-arch viaduct.
// Analytic Cubism as real geometry: every thing is flat hinged planes in seven inks whose hinge angle depends only
// on where the eye is, so the picture's disagreement moves because we move; on one line in front of the viaduct the
// whole world folds true for two seconds (the lock). Everything is drawn by the one material of the style kit in
// ../parts/town-from-all-sides.js (plus the ring and the reservoir's plan, in the same inks).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeStyle, buildHero, addHouse } from '../parts/town-from-all-sides.js';

// ---- array-vector helpers (the style kit takes [x, y, z]) ----
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const mad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const UP = [0, 1, 0];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// seven inks per hour: bone, pearl, slate, sage, umber, black (the line), terracotta (the accent); last = the priming
const WAYS = {
  day:    { inks: ['#E7DDC8', '#B9BDB8', '#5F7489', '#8C9C7A', '#6A4D36', '#16130F', '#C2603A'], prime: '#E7DDC8' },
  dawn:   { inks: ['#EBD8CB', '#CDB6B4', '#84718A', '#989A80', '#70493F', '#19120F', '#C6654B'], prime: '#EBD8CB' },
  golden: { inks: ['#E8D3A2', '#CFB074', '#B98F4E', '#8E8A5C', '#6A4D36', '#1A130C', '#B45F2E'], prime: '#E8D3A2' },
  night:  { inks: ['#4B5A72', '#34415A', '#1D2637', '#34494B', '#131924', '#DAD2BC', '#A2523A'], prime: '#2A3345' },
};
// (polish 3) THE LIGHT: each ink has a lit sister (warm and pale: cream, lemon-ochre, ochre, vermilion, as in a Braque or
// Gris still life) and a deep sister (grey-violet, slate, blue-black, bottle green, deep umber). A plane shows one of the
// three, flat, by the way it faces. Order: bone, pearl, slate, sage, umber, black, terracotta.
const LIGHT = {
  day:    { lit: ['#FBF0CF', '#EBD9A6', '#A3B7C6', '#C9C97C', '#C9974C', '#16130F', '#E9552B'], deep: ['#84868F', '#4E5F76', '#22314A', '#2E5443', '#33241C', '#16130F', '#7C2E1E'] },
  dawn:   { lit: ['#FFEEDD', '#F3CFC0', '#B49BB4', '#C9C690', '#C98A62', '#19120F', '#EE6846'], deep: ['#8B7C8C', '#6A5873', '#3A2D4C', '#3F5347', '#35211F', '#19120F', '#7E3327'] },
  golden: { lit: ['#FFF0BE', '#F2D489', '#E3B45C', '#C9BD6A', '#B9813F', '#1A130C', '#E2672A'], deep: ['#9A7F52', '#7E6238', '#5C4222', '#4C5234', '#33230F', '#1A130C', '#74351A'] },
  night:  { lit: ['#8FA3C2', '#6D82A6', '#3D5378', '#5C7C7C', '#2D3A52', '#DAD2BC', '#D0694A'], deep: ['#222B3D', '#18202F', '#0C1220', '#16262A', '#080B13', '#DAD2BC', '#4E2620'] },
};
const pickW = (r, table) => { let x = r(), k = 0; for (const [name, w] of table) { k += w; if (x < k) return name; } return table[0][0]; };

export default {
  id: 'town-from-all-sides',
  name: 'The Town Seen from Everywhere',
  category: 'city',
  after: 'the Cubists',
  weirdness: 0.65,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng } = ctx;
    const vary = ctx.vary || {};
    const detail = Math.min(1, Math.max(0.5, ctx.quality?.detail ?? 1));
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));

    // ---- the seeded look: hour as colourway, weather, cast, hinge temper ----
    const vr = rng.fork('looks');
    const hour = WAYS[vary.hour] ? vary.hour : pickW(vr, [['day', 0.4], ['dawn', 0.2], ['golden', 0.2], ['night', 0.2]]);
    const weather = pickW(vr, [['rain', 0.4], ['dry', 0.3], ['cloud', 0.3]]);
    const towerKind = pickW(vr, [['bell', 0.5], ['dovecote', 0.25], ['windmill', 0.25]]);
    const birdKind = pickW(vr, [['pigeon', 0.5], ['swift', 0.25], ['gull', 0.25]]);
    const grove = pickW(vr, [['olive', 0.5], ['vine', 0.25], ['almond', 0.25]]);
    const temper = pickW(vr, [['doors', 0.5], ['sliders', 0.25], ['fans', 0.25]]);
    const rare = !!vary.rare;                       // the second lock: the last 70 m fold true and stay true
    const way = WAYS[hour];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(way.prime);  // bare priming: what shows where the painter left the canvas
    const S = makeStyle(ctx, { palette: way.inks });
    const I = S.INK;
    S.u.uTemper.value.set(temper === 'sliders' ? 1 : 0, temper === 'fans' ? 1 : 0);
    S.u.uCut.value = weather === 'dry' ? 1 : 0;
    LIGHT[hour].lit.forEach((h, i) => S.u.uLit.value[i].set(h)); LIGHT[hour].deep.forEach((h, i) => S.u.uShade.value[i].set(h));
    S.u.uMass.value.set(700, 860);                  // (polish 1: we enter 520 m off, inside the range at which the big planes have swung aside: the town is houses from the first frame, and no half-open plane hangs beside it)
    await ctx.yield();

    // the hero's anchors in world space (its documented constants: placed at (0, 18, 260), turned half round)
    const seat = new THREE.Vector3(0, 148, 250);                         // the ring
    const fly = [[0, 13, 20], [26.5, 40.5, 115], [14, 80, 165], [0, 110, 191]].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    // ---- the path (polish 1): two bends only. We enter 520 m from the town, off the last olive terrace at the water's
    //      edge, cross the water low with the town's plan under us, climb the curve to deck height in front of the
    //      nine arches (they fill the frame by a quarter of the way), fold true on the axis, stoop under the middle
    //      arch at half way and climb the stair street to the ring. 593 m; the first design's 820 m spent its first
    //      five stills on one distant view. ----
    // (polish 2) THE COURSE IS AN S, so no two stills of the approach are one view: we enter from the south-west, the
    // town on the axis of view over the corner of the water; stoop to the water beside a boat; run east low along the
    // water with the arcade raking away on our left (the gaze eased off the tower onto the arches); swing left between
    // the cypresses onto the axis, fold true, and stoop under the middle arch. From the arch on it is the first design's.
    const tw0 = [225, 495], twl = Math.hypot(tw0[0], tw0[1]), dirE = [tw0[0] / twl, 0, tw0[1] / twl];
    // (polish 3) THE COURSE COMES IN AMONG THINGS AT ONCE: we enter over the plateau's last edge at the water's corner
    // with a sail standing whole to the right of the town; stoop between the boats over the town's plan; run the north
    // quay (moored boats, the quay's houses, the arcade behind them, the train above); swing onto the axis and fold
    // true; then, instead of stooping under the middle arch (piers and deck were blank slabs at the lens), we RISE OVER
    // THE DECK behind the train's last wagon, and the whole town stands lit beyond it; down over the forecourt to the
    // foot of the stair street and up it to the ring, as before.
    const P0 = [-222, 17, -226];      // just off the plateau's wall, 17 m over the water: we are among the boats at once
    const headPts = [P0, [-214.5, 16.6, -208.6], [-205, 14, -190], [-194, 10.5, -171], [-180, 8, -153], [-162, 7.5, -137], [-140, 7.5, -121], [-112, 7.5, -104], [-80, 8, -98], [-48, 11.5, -96], [-20, 19, -90]];
    const tailPts = [[14, 23.5, 44], [19, 24.5, 64], [23, 30, 86],
      [fly[1].x, fly[1].y, fly[1].z], [fly[2].x, fly[2].y - 2, fly[2].z], [fly[3].x, fly[3].y, fly[3].z],
      [0, lerp(fly[3].y, seat.y, 0.33), lerp(fly[3].z, seat.z, 0.33)], [0, lerp(fly[3].y, seat.y, 0.66), lerp(fly[3].z, seat.z, 0.66)],
      [seat.x, seat.y, seat.z]];
    // (repair 2) UNDER THE MIDDLE ARCH, as the brief has it ('at 26 s we pass under the middle arch, piers 9 m either
    // side, the engine's planes sliding overhead'): from the swing onto the axis the course comes down in front of the
    // viaduct, is low between the avenue's cypresses in front of the arch (low enough that the whole town with its
    // tower and ring stands under the deck's far edge), passes under the middle arch and climbs out over the forecourt
    // to the old line, which it meets at z 44. The plan (x, z) is the sixth version's to within 2.3 m.
    // (round 2) the lock is flown level: the course holds 25 m until z -52, where the hold is nearly done, so the town's
    // top and its tower stand over the train for the whole of it ('seen above and through the nine arches'); it stoops
    // after that, is 9 m up between the cypresses 13 m short of the arch, and climbs out more steeply beyond it
    // (14 m up under the crown, 21 m up 9 m past the arch, 25 m at z 26). Length 668.5 m against the sixth version's 665.1:
    // a place before the lock is reached up to 2.1 m sooner and a place after z 44 up to 1.3 m later than there.
    // (repair 3) THE COURSE FROM THE LOCK TO THE FORECOURT, in space (its plan is the same line; nothing is re-timed).
    // Through the lock it keeps the height the sixth version flew there (25 m rising to 29 m), so the hill and its tower
    // stand clear over the train and the deck for the whole of the hold ('seen above and through the nine arches'). It
    // stoops only once the hold is over (z -48): steeply (about 30 degrees), to 13 m by 13 m short of the arch, under
    // the vault's five chords 15 to 21 m up ('at 26 s we pass under the middle arch'), and it climbs out at the angle of
    // the last straight (about 30 degrees) to 26.5 m over the street by z 19, where the hill fills the frame from its
    // foot to the tower's cross. Its last point is the round-2 course's own (9, 25.2, 26), so from z 44 on it is the very
    // course it was; and its length is the round-2 course's to within 2 cm, so every place outside is reached when it was.
    const path = makePath([...headPts,
      [-5, 25, -73.5], [0, 27.6, -59.5], [0, 29.1, -48], [0, 22.6, -35.5], [0, 15.3, -22.5], [0, 13, -13], [0, 15.8, -4.5], [1, 20.2, 3.5], [3, 24.6, 11.5], [6.2, 26.6, 19], [9, 25.2, 26],
      ...tailPts]);
    // the round-2 course: the hill was built against it (the sight cone, the corridor, the washing) and the forecourt's
    // trees and houses were stood along it, so all of that is laid from it still and stands exactly where it stood (but for a
    // piece of washing that would not keep its clear air of the course we fly: see sight.at)
    const was = makePath([...headPts,
      [-5, 25, -73.5], [0, 25.3, -59.5], [0, 24.8, -51.5], [0, 18.5, -39.5], [0, 11.6, -27.5], [0, 8.9, -17.5], [0, 10.8, -7.5], [1.2, 16.8, 2.5], [4.2, 22.6, 12.5], [9, 25.2, 26],
      ...tailPts]);
    // the line the country was laid along: the sixth version's course over the deck. The ground's near plates are placed
    // against it (its plan is this course's plan), so nothing laid from the shared streams moves.
    const lay = makePath([...headPts, [-4, 25.5, -74], [0, 28, -58], [0, 29.5, -44], [0, 32, -30], [0, 35.5, -16], [0, 37.5, -3], [2, 36, 10], [8, 29, 26], ...tailPts]);
    const uOfZ = (z, lo, hi) => { let a = lo, b = hi; const p = new THREE.Vector3(); for (let i = 0; i < 24; i++) { const m = (a + b) / 2; path.pointAt(m, p); if (p.z < z) a = m; else b = m; } return (a + b) / 2; };
    const U_LOCK0 = uOfZ(-72, 0.2, 0.8), U_LOCK1 = uOfZ(-48, 0.2, 0.8), U_ARCH = uOfZ(0, 0.2, 0.8), U_LAST = uOfZ(fly[3].z, 0.6, 1);
    // every moment of the climb was first placed on the 820.6 m course, whose last 380 m this one shares: nu(u) is the
    // same place on this path, LR the stretch of a difference in u
    const LR = 820.6 / path.length, nu = (o) => 1 - (1 - o) * LR;
    const wasZ = (z) => { let a = 0.2, b = 0.8; const p = new THREE.Vector3(); for (let i = 0; i < 24; i++) { const m = (a + b) / 2; was.pointAt(m, p); if (p.z < z) a = m; else b = m; } return (a + b) / 2; };
    const WAS_ARCH = wasZ(0), WAS_LR = 820.6 / was.length, wasNu = (o) => 1 - (1 - o) * WAS_LR;
    // THE LOCK is flown slowly (half pace) over 46 m of the axis: the world closes from z -86 to -74, holds true to
    // -56 and has slid apart again by -40, where the middle arch stands in the frame. It is six seconds of the flight.
    S.foldFn = (e) => 1 - sstep(-72, -62, e.z) * (1 - sstep(-48, -34, e.z)) * (1 - sstep(2, 24, Math.abs(e.x)));      // (polish 3: it closes once we are ON the axis and has slid apart before the deck)      // (polish 2: it closes as we swing onto the axis, holds from z -74 to -58)

    // ---- the hero: the town and its tower, turned to face south down the axis ----
    // washing lines hang 8 to 10 m over the wings (sheets to 4.5 m over) while the street is close under us, and 9 m
    // under the wings higher up, never across the path
    const lineY = (p, r) => {
      const gy = p[1] + 18, py = was.nearestXZ(-p[0], 260 - p[2]).y, v = (r - 11.5) * 0.7;
      return (py - gy < 13.5 ? py + 8.4 + v : py - 9 - v) - 18;
    };
    // THE SIGHT CONE: from every eye position on the climb (arch to ring) a cone runs to the ring's collar. Nothing
    // of the town may stand in it, so the tower is clear above the street the whole way: houses under it are kept
    // low, sheets hang beside it or below it, sky planes stay out of it. (Hero-local in, hero-local out.)
    const sightE = [];
    for (let i = 0; i <= 72; i++) {       // [eye, how wide the cone is at the tower: the whole clock screen until the last straight, then the collar]
      const u = lerp(WAS_ARCH + 0.03 * WAS_LR, wasNu(0.968), i / 72), p = was.pointAt(u, new THREE.Vector3());
      // (repair 2) the course is lower over the forecourt now; the cone is still laid from the height the hill was built
      // for there (31 m at z 22 falling to 23.5 m at z 44), so every house of the hill stands as it stood
      if (p.z < 44) p.y = Math.max(p.y, lerp(23.5, 31, Math.min(1, (44 - p.z) / 22)));
      sightE.push([p.x, p.y, p.z, lerp(30, 16.4, sstep(wasNu(0.87), wasNu(0.92), u))]);
    }
    const coneR = (t) => 2.2 + 16.4 * t;                                  // the collar is 15.4 m in radius; a little air round it
    const sight = {
      // the height a thing of plan radius r standing at local c may reach
      ceil(c, r) {
        const x = -c[0], z = 260 - c[2]; let top = 1e9;
        for (const e of sightE) {
          const dx = seat.x - e[0], dy = seat.y - e[1], dz = seat.z - e[2];
          const t = Math.min(1, Math.max(0, ((x - e[0]) * dx + (z - e[2]) * dz) / (dx * dx + dz * dz)));
          if (t < 0.02) continue;
          if (Math.hypot(e[0] + dx * t - x, e[2] + dz * t - z) < 2.2 + e[3] * t + r) top = Math.min(top, e[1] + dy * t - (1.5 + 10.5 * t) * 1.25);
        }
        return top - 18;
      },
      // true when a ball of radius r at local p is outside every cone
      clear(p, r) {
        const x = -p[0], y = p[1] + 18, z = 260 - p[2];
        for (const e of sightE) {
          const dx = seat.x - e[0], dy = seat.y - e[1], dz = seat.z - e[2];
          const t = Math.min(1, Math.max(0, ((x - e[0]) * dx + (y - e[1]) * dy + (z - e[2]) * dz) / (dx * dx + dy * dy + dz * dz)));
          if (t < 0.02) continue;
          if (Math.hypot(e[0] + dx * t - x, e[1] + dy * t - y, e[2] + dz * t - z) < coneR(t) + r) return false;
        }
        return true;
      },
      // the path over a plan point: its height (local) and its plan distance
      over(p) { const n = was.nearestXZ(-p[0], 260 - p[2]); return { y: n.y - 18, dist: n.dist }; },
      // our course itself, the one we fly, at d metres of route (hero-local): the washing keeps its clear air against the whole of it
      len: path.length,
      at(d) { const v = path.posAtDist(Math.min(Math.max(d, 0), path.length), new THREE.Vector3()); return [-v.x, v.y - 18, 260 - v.z]; },
    };
    // plots whose house would stand (or swing) inside the flight corridor stay empty
    const blocked = (c, h) => {
      const wx = -c[0], wz = 260 - c[2], n = was.nearestXZ(wx, wz);
      const gap = n.y - (c[1] + 18 + h);
      return n.dist < 10.2 && gap < 7;
    };
    const hero = await buildHero(ctx, { style: S, palette: way.inks, detail, lineY, blocked, sight, moved: 13 });      // (repair 3) thirteen houses of the hill's far foot stand on the street beyond the arch instead: see buildStreet
    hero.object.position.set(0, 18, 260);
    hero.object.rotation.y = Math.PI;
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();

    // every plentiful thing goes into a few big batches: ground + built things, flora, sky
    const disposables = [];
    const W = { scene, S, I, rng, path, lay, was, WAS_ARCH, WAS_LR, sight, detail, density, hour, weather, towerKind, birdKind, grove, temper, rare, hero, seat, disposables,
      U_LOCK0, U_LOCK1, U_ARCH, U_LAST, LR, nu, updaters: [] };

    await buildGround(ctx, W);        // valley quilt, olive terraces, embankments, puddles
    await buildViaduct(ctx, W);       // nine arches of five chords, piers showing front and flank
    await buildSky(ctx, W);           // shards on the bowl, three ridges, the leaving shower, ruled strokes
    await buildGrove(ctx, W);         // olives (or vines, or almond) fanning on the terraces
    await buildReservoir(ctx, W);     // the square water that shows the town in plan
    await buildTrain(ctx, W);         // engine and sixteen wagons of sliding planes
    await buildFlock(ctx, W);         // our own bird and the forty round us
    await buildCast(ctx, W);          // seeded: low cloud planes, windmill sails or dovecote
    await buildTowerHouses(ctx, W);   // (repair 2) the tower-houses beside the ring
    await buildLate(ctx, W);          // (repair 3) the viaduct's stonework, the street beyond the arch
    // (polish 1: the extra sheets hung close over the wings on the stair street are gone: at the frame's upper corners
    //  they read as loose shards and their line as a black bar. The town's own washing lines cross the street as before.)
    await ctx.yield();

    const eye = new THREE.Vector3(), primeC = new THREE.Color(way.prime), lockSky = S.pal.pearl.clone().multiplyScalar(0.9);
    // one gaze for the whole flight: the ring; through the lock it drops to the town's waist so the campanile stands
    // whole a tenth under the top edge, the arches cross the middle and the ground keeps to the bottom fifth
    const aimV = new THREE.Vector3();
    const aim = (time, u) => {
      const k = sstep(U_LOCK0 - 0.09, U_LOCK0 - 0.02, u) * (1 - sstep(U_ARCH - 0.012, U_ARCH + 0.06, u));      // (polish 3: over the deck the eye stays on the town's waist, then lifts to the ring)
      // (polish 3) at the entry and over the water the eye is on the town's waist, not on the ring: the boats stand whole in the frame
      const base = lerp(46, seat.y - 4, sstep(U_ARCH - 0.08, U_ARCH + 0.02, u));
      return aimV.set(seat.x, lerp(base, 96, k), lerp(seat.z, 260, k));
    };
    const aimSide = [14, 36, 0];
    // (repair 2) the gaze from the lock to the forecourt, now that the course stoops under the arch: the eye rests on the
    // town's waist on the axis, so the viaduct crosses the frame with the tower whole over the train, the hill stands
    // whole in the opened middle arch under the deck's far edge, and out from under it the whole hill stands from foot to tower
    const gateV = new THREE.Vector3();
    // (repair 3) out from under the arch the gaze is held a little higher (85 m up the hill, not 74) for as long as the
    // hill stands whole before us, so the tower's cross, sails and all, stands under the frame's top edge; it is back on
    // its old aim (74) by 0.07 beyond the arch, before the course rejoins the old one.
    // (repair 3, round 2) THE GAZE FROM THE LOCK INTO THE ARCH, by where the eye is (its own z on the course), not by the clock.
    // Through the lock and the first of the stoop the aim stays 81 m up the hill (it sank to 70 and the tower's sails were
    // cut by the frame's top from the lock's end on): the tower stands whole over the train for as long as it is seen.
    // Only once the train's roofs have taken the tower (our z -34.5 to -27.5) does the eye go down with the stoop into the
    // arch itself, toward the street at the hill's foot seen through it, so the opening stands in the middle of the frame
    // and not the deck's face; and it lifts again to the hill's waist as the hill grows under the vault (z -27 to -17).
    const gateP = new THREE.Vector3(), GATE_LOW = 30;
    const gate = (time, u) => {
      const ez = path.pointAt(u, gateP).z;
      let y = lerp(112, 81, sstep(U_LOCK0 - 0.0076, U_LOCK0 + 0.0254, u));
      y = lerp(lerp(y, GATE_LOW, sstep(-34.5, -27.5, ez)), 70, sstep(-27, -17, ez));
      return gateV.set(0, lerp(lerp(y, 85, sstep(U_ARCH - 0.01, U_ARCH + 0.03, u)), 74, sstep(U_ARCH + 0.048, U_ARCH + 0.07, u)), 260);
    };
    // unhurried: a little quicker down onto the water, slow through the lock, slow again up the street
    const pace = (u) => 1 + 0.12 * sstep(0.04, 0.09, u) * (1 - sstep(0.18, 0.26, u))
      - 0.5 * sstep(U_LOCK0 - 0.035, U_LOCK0, u) * (1 - sstep(U_LOCK1 + 0.01, U_LOCK1 + 0.05, u))
      - 0.08 * sstep(nu(0.7), nu(0.76), u) * (1 - sstep(nu(0.86), nu(0.9), u));

    return {
      scene, path, duration: 42, pace,
      title: rare ? 'The Town Seen from Everywhere, Twice True' : 'The Town Seen from Everywhere',
      // a longer lens than the first design's 62 degrees: the town stands half as large again behind the viaduct
      camera: { fov: 50, near: 0.3, far: 3600, lookAhead: 22, sway: 0.5, bank: 0 },
      pois: [
        { at: aim, from: 0, to: 0.065, weight: 1, fade: 0.3 },      // the entry and the stoop: the eye is on the tower at once, whatever the dive ahead does
        { at: aim, from: 0, to: nu(0.9), weight: 0.5, fade: 0.02 },
        { at: [-165, 15, 16], from: 0.035, to: 0.125, weight: 0.7, fade: 0.3 },      // (polish 3) the stoop: the eye goes to the boat we pass, the town to one side
        { at: [-104, 10, -62], from: 0.115, to: 0.29, weight: 0.8, fade: 0.3 },      // the quay: its houses, the moored boats, the arcade behind them
        { at: aimSide, from: 0.26, to: U_LOCK0 - 0.015, weight: 0.8, fade: 0.3 },      // (polish 2) the run along the water: the gaze eases off the tower onto the arcade, which rakes away to the right
        { at: aim, from: U_LOCK0 - 0.09, to: U_LOCK1 + 0.05, weight: 0.5, fade: 0.3 },      // the swing onto the axis: the gaze is on the town before the heading is
        { at: [seat.x, seat.y + 6, seat.z], from: U_ARCH - 0.02, to: U_ARCH + 0.16, weight: 0.28, fade: 0.3 },      // (polish 3) over the deck and the forecourt the eye lifts: the tower stands whole over the town
        { at: [seat.x, seat.y - 2, seat.z], from: nu(0.79), to: nu(0.935), weight: 0.7, fade: 0.3 },      // over the tower-houses: the ring on the centre line through the last bend
        { at: gate, from: 0.415, to: 0.632, weight: 0.9, fade: 0.3 },      // (repair 2) through the lock, under the arch and out: see gate
      ],
      portal: { shape: 'circle', radius: 9.5, color: way.inks[1], glow: 0.12, tilt: true, revealDistance: 260 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none',
      style: 'none',
      update(dt, time, camera, u) {
        eye.setFromMatrixPosition(camera.matrixWorld);
        // the second lock (rare): on the last straight the world folds true again and stays true
        const f2 = rare ? 1 - sstep(W.U_LAST - 0.048, W.U_LAST + 0.041, u) : 1;
        S.forceFold = f2 < 1 ? Math.min(S.foldFn(eye), f2) : null;
        S.update(dt, time, camera);
        const F = S.u.uFold.value;
        // (polish 3) the light comes round: from the west-north-west at the entry (the town's left flank lit, its fronts
        // still in their own inks, the rest deep) to the south-west on the climb (fronts and roofs lit, the far sides
        // deep), and it strengthens all the way, so the climb to the tower is the brightest, most contrasted part.
        // Seen through the previous portal u is 0: the entry's light.
        const sw = sstep(0.3, 0.62, u), az = lerp(-1.36, -2.5, sw), el = lerp(0.27, 0.36, sstep(0.5, 0.8, u)), ce = Math.sqrt(1 - el * el);
        S.u.uSun.value.set(Math.sin(az) * ce, el, Math.cos(az) * ce, lerp(0.72, 1, sstep(0.2, 0.6, u)));
        const bx = 0 - eye.x, bz = 860 - eye.z, bl = Math.hypot(bx, bz) || 1;
        S.u.uSky.value.set(bx / bl, bz / bl, lerp(0.8, 1, sw), 0.955);
        scene.background.copy(primeC).lerp(lockSky, 1 - F);      // in the lock even the bare priming is the dome's middle pearl
        for (const f of W.updaters) f(dt, time, camera, u, eye, F);
      },
      dispose() {
        for (const d of disposables) d.dispose();
        S.dispose();
        hero.dispose();
      },
    };
  },
};

// one draw call from a batch
function addBatch(W, B, name) { const m = B.mesh(); m.name = name; W.scene.add(m); return m; }

// ---- the ground: nothing is a surface, everything a plate. Terraces step from y 34 down to the valley at y 2,
//      the valley runs under the viaduct, a ramp climbs to the town's foot at y 18. ----
// (polish 1: the water lies 50 m nearer the viaduct, z -220 to -70, and the olive country ends in a plateau at y 20
//  that ends in one 18 m wall above its rim, so the flight starts at the water's edge with the town already large)
const PLZ = -238;      // the plateau's edge
const RX0 = -240, RX1 = -35, RZ0 = -224, RZ1 = -75;      // (polish 2: the water lies under the S of the approach)
function groundY(x, z) {
  if (z < PLZ) return 20;
  return 2 + 16 * sstep(10, 90, z);
}
const inReservoir = (x, z, m = 0) => x > RX0 - m && x < RX1 + m && z > RZ0 - m && z < RZ1 + m;

async function buildGround(ctx, W) {
  const { S, I, path } = W, rng = W.rng.fork('ground');
  const B = S.batch(4096);
  const lit = S.tone(UP);
  const inkOf = (zone) => {
    const r = rng();
    // the country is fields: sage and bone, a ploughed umber here and there. Slate and terracotta belong to the town.
    if (zone === 'terrace') return r < 0.56 ? I.sage : r < 0.84 ? I.bone : r < 0.92 ? I.pearl : I.umber;
    if (zone === 'town') return r < 0.45 ? I.bone : r < 0.8 ? I.sage : r < 0.92 ? I.pearl : I.umber;
    return r < 0.5 ? I.sage : r < 0.82 ? I.bone : r < 0.92 ? I.pearl : I.umber;
  };
  // strips across x; each strip chopped into plates that overlap a little and tilt on one edge as the eye moves
  const strips = [];
  for (let k = -14; k < 0; k++) strips.push([PLZ + 34 * k, PLZ + 34 + 34 * k, 'terrace']);          // the plateau, z -693 .. -217
  // (polish 3) the strips break at the water's rim, and inside its span the plates stop at the rim too: no field lies over
  // the water's margins any more (the moored boats stood in a meadow)
  const cutZ = [RZ0 - 5, RZ1 + 5, 10];
  for (let z = PLZ; z < 10;) { let d = Math.min(10 - z, rng.range(30, 44)); for (const b of cutZ) if (z < b - 0.01 && z + d > b - 6) { d = b - z; break; } strips.push([z, z + d, 'valley']); z += d; }
  for (let z = 10; z < 90;) { const d = Math.min(90 - z, rng.range(18, 28)); strips.push([z, z + d, 'ramp']); z += d; }
  for (let z = 90; z < 640;) { const d = rng.range(30, 55) * (z > 380 ? 1.8 : 1); strips.push([z, z + d, 'town']); z += d; }
  let n = 0;
  for (const [z0, z1, zone] of strips) {
    const y0 = groundY(0, z0 + 0.01), y1 = zone === 'ramp' ? groundY(0, z1) : y0;
    const far = z0 > 380 || z0 < -560 ? 1.8 : 1;
    for (let x = -700 + rng() * 20; x < 560;) {
      const edge = Math.abs(x + 60) > 380 ? 1.7 : 1;
      let w = rng.range(40, 84) * far * edge; const zm = (z0 + z1) / 2;      // broad fields, not slivers
      if (zm > RZ0 - 5 && zm < RZ1 + 5) for (const b of [RX0 - 5, RX1 + 5]) if (x < b - 0.01 && x + w > b - 8) { w = b - x; break; }
      const hid = zone === 'town' && Math.hypot(x + w / 2, zm - 260) < 150;                     // under the hill: never seen
      if (!hid && !inReservoir(x + w / 2, zm, 4.5)) {
        const sk = rng.range(-3, 3), lift = 0.04 * (n % 5);
        const O = [x - 1.2, y0 + lift, z0 - 0.6], U = [w + 2.4, 0, sk], V = [rng.range(-2, 2), y1 - y0, z1 - z0 + 1.2];
        const pd = W.lay.nearestXZ(x + w / 2, zm).dist, near = pd < 40;      // (repair 2: measured from the line the country was laid along)
        const quiet = pd > 120 ? 0.75 : pd > 45 ? 0.5 : 0.25;    // the ground is the picture's ground: quiet planes, quietest far from the flight
        const hingeAtFar = rng() < 0.5;
        const hinge = { p: hingeAtFar ? add(O, V) : O, a: nrm(U), max: near ? 0.015 : rng.range(0.03, 0.07), phase: rng() * 6.283, bias: 0 };
        const bare = rng() < 0.05;                                                              // a plate left in bare priming
        const ink0 = bare ? -1 : inkOf(zone);
        if (!bare) B.facet(O, U, V, { ink: ink0, tone: lit, hinge, quiet });
        // THE NEAR LAYER: within 64 m of the flight a plate is never one blank plane. Small plates in other inks lie on
        // it, each tipping on its own edge against its neighbour, most with a short stroke, some with a low stone
        // wall standing on one edge (front and top at once). They shrink away with distance: far ground stays plain.
        if (pd < 64 && zone !== 'town') S.own((r2) => {
          const alt = [I.bone, I.sage, I.sage, I.umber, I.bone, I.sage, I.sage, I.pearl, I.bone, I.umber];
          const fine = pd < 26, nx = Math.max(2, Math.round(w / (fine ? 15 : 20))), nz = z1 - z0 > 20 ? 2 : 1;      // (never under ten metres along the flight: nothing alternates under the eye)
          for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
            const k0 = r2(), k1 = r2(), k2 = r2(), k3 = r2(), k4 = r2(), odd = (a + b + n) % 2;
            if (k0 < 0.34) continue;                                                               // here the plate under shows
            const fx = (a + 0.06 + 0.2 * k1) / nx, fz = (b + 0.06 + 0.2 * k2) / nz;
            const u = mul(U, (0.6 + 0.3 * k3) / nx), v = mul(V, (0.56 + 0.32 * k4) / nz);
            const o = add(mad(mad(O, U, fx), V, fz), [0, 0.14 + 0.05 * ((a + 2 * b) % 3), 0]);
            let ink = alt[(a * 3 + b * 5 + n * 7) % 10]; if (ink === ink0) ink = alt[(a * 3 + b * 5 + n * 7 + 1) % 10];
            if (zone === 'terrace' && ink === I.slate) ink = I.umber;
            const hg = { p: odd ? add(o, v) : o, a: nrm(u), max: odd ? 0.075 : -0.075, phase: k0 * 6.283, bias: 0.25 };
            B.facet(o, u, v, { ink, lockInk: ink0 < 0 ? I.bone : ink0, tone: lit, hinge: hg, taper: 0.8 + 0.3 * k1, lod: 0.75, quiet: 0.25 });      // (in the lock the ground is its broad plates again)
            if (k2 < 0.3) B.stroke(mad(mad(o, u, 0.12), v, odd ? 1 : 0), mad(mad(o, u, 0.5 + 0.2 * k3), v, odd ? 1 : 0), { hinge: hg, miss: 0.06, lod: 0.42 });      // a furrow line ON the field's edge
            if (k4 < 0.3 && pd > 7) {                                                              // a low wall of field stones on the near edge
              const hw = 0.8 + 0.9 * k1, wk = ink === I.umber ? I.bone : I.umber;
              B.facet(mad(o, v, odd ? 0 : 1), mul(u, 0.55 + 0.4 * k0), [0, hw, 0], { ink: wk, tone: S.tone([0, 0, -1]), lod: 0.6, taper: 0.9,
                hinge: { p: mad(o, v, odd ? 0 : 1), a: nrm(u), max: 0.5, phase: k3 * 6.283, bias: 0.3 } });
            }
          }
        });
        const sr = rng();
        const s0 = 0.08 + 0.5 * ((sr * 7.3) % 1), s1 = s0 + 0.22 + 0.2 * ((sr * 13.7) % 1);       // a short accent, never a wire across the frame
        if (sr < 0.14) B.stroke(mad(O, U, s0), mad(O, U, Math.min(1, s1)), { hinge, miss: 0.08, lod: 0.6 });      // (a field boundary, on the plate's own edge)
        if (z0 === PLZ) {                                                                        // the 18 m wall under the plateau's edge
          B.facet([x, y0 - 0.1, z0 - 0.4], [w, 0, 0], [0, 18.2, -0.5], { ink: rng() < 0.6 ? I.umber : I.bone, tone: S.tone([0, 0, 1]) });
          if (n % 2) B.stroke([x + w * s0 * 0.7, y0 + 18.05, z0 - 0.7], [x + w * Math.min(1, s0 * 0.7 + 0.45), y0 + 18.05, z0 - 0.7], { miss: 0.08, lod: 1 });
        }
        n++;
      }
      x += w;
    }
    await ctx.yield();
  }
  // puddles after rain: flat pearl lozenges lying on the valley plates and on the town's forecourt
  if (W.weather === 'rain') {
    for (let i = 0; i < 46; i++) {
      const x = rng.range(-110, 120), z = rng.range(-110, 84), y = groundY(x, z) + 0.3;
      if (inReservoir(x, z, 8)) continue;
      const a = rng() * 3.1416, l = rng.range(3, 9), w = rng.range(1.5, 3.5), sl = z > 10 && z < 90 ? 0.2 : 0;
      const d1 = [Math.cos(a) * l, 0, Math.sin(a) * l], d2 = [-Math.sin(a) * w, 0, Math.cos(a) * w];
      B.facet([x, y, z], [d1[0] + d2[0], sl * (d1[2] + d2[2]), d1[2] + d2[2]], [d1[0] - d2[0], sl * (d1[2] - d2[2]), d1[2] - d2[2]], { ink: I.pearl, tone: 1, grad: 0.4 + i });
    }
  }
  // the embankments that carry the line off both ends of the viaduct: a ridge of three plates per length
  for (const sg of [-1, 1]) {
    for (let x = 111; x < 700;) {
      const w = rng.range(36, 70), xa = sg * x, U = [sg * (w + 1.5), 0, 0];
      const top = 25 + (x > 300 ? (x - 300) * 0.02 : 0);
      B.facet([xa, 2, -44 - rng() * 10], U, [0, top - 2, 39], { ink: rng() < 0.55 ? I.sage : I.sage, quiet: 0.5, tone: S.tone(nrm([0, 0.8, -0.6])) });      // (a grass bank, never a blank bone slab)
      B.facet([xa, top, -5.5], U, [0, 0, 11], { ink: I.pearl, tone: lit });
      B.facet([xa, top, 5.5], U, [0, 4 - top + 12 * 0, 30 + rng() * 10], { ink: rng() < 0.5 ? I.umber : I.sage, tone: S.tone(nrm([0, 0.8, 0.6])) });
      B.stroke([xa + U[0] * 0.1, top + 0.05, -5.5], [xa + U[0] * 0.42, top + 0.05, -5.5], { miss: 0.1, lod: 0.8 });      // (short: never a ruled line across the country)
      x += w;
    }
    // the abutment: one umber plane and one bone, front and flank at once
    const ha = { p: [sg * 111, 2, -6], a: [0, sg, 0], max: 0.5, phase: 1.57 * sg, bias: 0.5 };
    B.facet([sg * 111, 2, -6], [0, 0, 12], [0, 23, 0], { ink: I.umber, tone: S.tone([-sg, 0, 0]), hinge: ha });
    B.facet([sg * 111, 2, -6.2], [sg * 16, 0, 0], [0, 23, 0], { ink: I.pearl, tone: S.tone([0, 0, -1]), taper: 0.55 });
    B.stroke([sg * 111, 2, -6.2], [sg * 111, 25, -6.2], { width: 0.3, miss: 0.5, lod: 1.5 });
  }
  W.groundB = B;        // more is added (viaduct, reservoir rim) before it becomes one draw call
}

// axis (+a or -a) about which a positive angle carries the free vector toward the outward normal n
const hingeAxis = (a, free, n) => { const c = crs(a, free); return c[0] * n[0] + c[1] * n[1] + c[2] * n[2] >= 0 ? a : mul(a, -1); };

// ---- the viaduct: z 0, x -111 .. 111, nine arches of 18 m on 6 m piers, crowns at y 25, deck to y 31 ----
async function buildViaduct(ctx, W) {
  const { S, I } = W, rng = W.rng.fork('viaduct'), B = W.groundB;
  const zs = -5, zn = 5, yg = 1.6, ysp = 16, R = 9, yd0 = 25, yd1 = 31;
  const south = [0, 0, -1], north = [0, 0, 1];
  // (repair 3) the hinges of the south face are kept, so the stonework laid later (buildStonework) rides the planes it lies on
  const VD = (W.vd = { front: [], flank: [], deck: [], span: [] });
  const FORE = (W.fore = { trees: [], houses: [] });      // (repair 3) what stands on the forecourt, so the street's houses are stood clear of it
  for (let i = 0; i < 10; i++) {
    const xc = -108 + i * 24, x0 = xc - 3, x1 = xc + 3;
    // front in two half planes, hinged on the outer corners so the seam opens a hand
    for (const [xa, xb, ink] of [[x0, xc, I.bone], [x1, xc, i % 2 ? I.pearl : I.bone]]) {
      const U = [xb - xa, 0, 0];
      for (const [z, n] of [[zs, south], [zn, north]]) {
        const hinge = { p: [xa, yg, z], a: hingeAxis(UP, U, n), max: 0.3, phase: rng() * 6.283, bias: 0.4 };
        // (repair 2) THE GATE. We pass between the two middle piers, so their planes do what the brief orders of everything
        // beside the path ('Facets beside the path hinge on their path-side edge so free edges swing away'): each back
        // face folds in, and the flanks below fold back into the pier. From the lock's release the middle arch
        // opens as it grows, and the hill stands whole in it. In the lock they are a pier again.
        // (repair 3) THE MIDDLE ARCH IS AN ARCH ALL THE WAY THROUGH. Round 2 swung the middle piers' fronts and backs, the
        // spandrels and the vault wide open by the eye's range; from in front that read as a dark band over the frame
        // and slanted posts at its sides. They are a pier's planes again, like the other eight ('each pier showing front
        // and flank at once, each arch five straight chords'): the fronts open a hand on their outer corners, the vault
        // is its five chords, and the course comes in low enough that the hill stands whole under them.
        B.facet([xa, yg, z], U, [0, yd0 - yg, 0], { ink: z === zs ? ink : I.umber, tone: S.tone(n), hinge });
        if (z === zs) (VD.front[i] = VD.front[i] || []).push({ hinge, xa, xb, ink });
        const near = i >= 3 && i <= 6;       // the piers we pass between: their corner line is three short strokes that only meet in the lock
        if (z === zs) B.stroke([xa, yg, z], [xa, near ? yg + 7.4 : yd0, z], { hinge, width: 0.26, miss: 0.5, lod: 1.6 });
        if (z === zs && near) S.aside((r2) => {
          const sx = Math.sign(xa - xc);
          B.stroke([xa, yg + 7.4, z], [xa, yg + 14, z], { hinge, width: 0.26, off: [sx * 0.16, 0.12, 0], lod: 1.6 });
          B.stroke([xa, yg + 14, z], [xa, yd0, z], { hinge, width: 0.26, off: [-sx * 0.12, -0.14, 0], lod: 1.6 });
        });
      }
    }
    // (polish 1: the panels pasted on the four middle piers and the deck face cut into odd planes are gone: seen close
    //  they were a wall of slabs. A pier is two half fronts and a flank, the deck one face per bay, the arch five chords.)
    // every pier carries an impost block at the springing, in the stone's shadow, on its own small hinge
    S.own(() => {
      const zf = zs - 0.6, hg = { p: [x0 - 0.4, 17.4, zf], a: [-1, 0, 0], max: 0.22, phase: i * 1.3, bias: 0.35 };
      // (repair 3) one block on every pier, the two middle ones included (they were in two pieces while their fronts swung away)
      B.facet([x0 - 0.4, 14.5, zf], [6.8, 0, 0], [0, 2.9, 0], { ink: i % 2 ? I.umber : I.pearl, lockInk: I.bone, tone: S.tone(south), hinge: hg, taper: 0.9 });
      B.stroke([x0 + 0.2, 14.5, zf], [x0 + 4.4, 14.5, zf], { hinge: hg, miss: 0.06, lod: 0.9 });
    });
    // the flanks: hinged on their south corners, swinging out into the openings so front and flank show at once
    for (const sg of [-1, 1]) {
      const xf = xc + 3 * sg, n = [sg, 0, 0], inner = (i === 4 && sg === 1) || (i === 5 && sg === -1);
      // (repair 3) the two flanks we pass between turn a little back into their piers, their free edges away from the path
      // ('Facets beside the path hinge on their path-side edge so free edges swing away'); the rest swing out as they did
      const hinge = { p: [xf, yg, zs], a: hingeAxis(UP, [0, 0, 1], n), max: inner ? -0.2 : rng.range(0.5, 0.8) * (i >= 3 && i <= 6 ? 0.5 : 1), phase: sg * 1.3 + rng.range(-0.3, 0.3), bias: 0.62 };
      B.facet([xf, yg, zs], [0, 0, zn - zs], [0, ysp - yg, 0], { ink: I.umber, tone: S.tone(n), hinge });
      (VD.flank[i] = VD.flank[i] || {})[sg] = { hinge, xf, n };
      B.stroke([xf, ysp, zs], [xf, ysp, zn], { hinge, miss: 0.4, lod: 0.9 });
      B.stroke([xf, yg, zn], [xf, ysp, zn], { hinge, miss: 0.4, lod: 0.6 });
    }
    if (i === 9) break;
    // the arch: five straight chords, each with its spandrel plane (south and north) and its soffit
    const ax = xc + 12;
    for (let j = 0; j < 5; j++) {
      const a0 = Math.PI - j * Math.PI / 5, a1 = Math.PI - (j + 1) * Math.PI / 5;
      const p0 = [ax + R * Math.cos(a0), ysp + R * Math.sin(a0)], p1 = [ax + R * Math.cos(a1), ysp + R * Math.sin(a1)];
      const U = [p1[0] - p0[0], p1[1] - p0[1], 0], h = yd0 - Math.min(p0[1], p1[1]) + 0.05;
      const ink = (i + j) % 2 ? I.bone : (j === 2 ? I.pearl : I.umber);
      for (const [z, n] of [[zs, south], [zn, north]]) {
        const top = [p0[0], p0[1] + h, z];
        const hinge = { p: top, a: hingeAxis(nrm(U), [0, -1, 0], n), max: 0.16, phase: rng() * 6.283, bias: 0.3 };
        B.facet([p0[0], p0[1], z], U, [0, h, 0], { ink: z === zs ? ink : I.umber, tone: S.tone(n), hinge });
        if (z === zs) (VD.span[i] = VD.span[i] || [])[j] = { hinge, p0, p1, ink };
        // (repair 3: the middle arch has all five of its chord strokes from the swing onto the axis on; two of the five were nil)
        if (z === zs) B.stroke([p0[0], p0[1], z - 0.05], [p1[0], p1[1], z - 0.05], { hinge, width: 0.3, miss: 0.45, lod: i === 4 && j % 2 ? 0.25 : 2.2 });
      }
      const nn = nrm([-(p1[1] - p0[1]), p1[0] - p0[0], 0]);
      // (repair 3) the vault is its five chords under every arch, the middle one too (round 2 lifted its planes edge-on)
      B.facet([p0[0], p0[1], zs], U, [0, 0, zn - zs], { ink: j % 2 ? I.umber : I.slate, tone: S.tone(mul(nn, -1)) * 0.85 });
    }
    // the deck over this bay: face, top, parapet line; the face lifts a little like a lid
    const xa = xc + (i === 0 ? -3 : 0), xb = xc + 24 + (i === 8 ? 3 : 0), U = [xb - xa, 0, 0];
    for (const [z, n] of [[zs - 0.2, south], [zn + 0.2, north]]) {
      const hinge = { p: [xa, yd1, z], a: hingeAxis([1, 0, 0], [0, -1, 0], n), max: 0.14, phase: rng() * 6.283, bias: 0.4 };
      // the face is masonry, not a pane: a lower course, a parapet band in the other stone, an umber string course between
      const H = yd1 - yd0 + 0.3;
      B.facet([xa, yd0 - 0.3, z], U, [0, H * 0.56, 0], { ink: i % 2 ? I.bone : I.pearl, tone: S.tone(n), hinge });
      if (z < 0) VD.deck[i] = { hinge, xa, xb, z, H };
      B.facet([xa, yd0 - 0.3 + H * 0.56, z], U, [0, H * 0.44, 0], { ink: i % 2 ? I.pearl : I.bone, tone: S.tone(n), hinge });
      if (z < 0) S.own(() => {
        for (let c = 0; c < 3; c++) B.facet([xa + (xb - xa) * (0.06 + c * 0.33), yd0 - 0.3 + H * 0.5, z - 0.06], [(xb - xa) * 0.22, 0, 0], [0, H * 0.13, 0], { ink: I.umber, lockInk: i % 2 ? I.bone : I.pearl, tone: S.tone(n), hinge, taper: 0.94 });
      });
      // (short strokes on the face's own edges, one low and one high per bay: never a rule across the frame)
      B.stroke([xa + 1, yd0 - 0.3, z], [xa + (xb - xa) * 0.42, yd0 - 0.3, z], { hinge, width: 0.3, miss: 0.1, lod: 2.2 });
      B.stroke([xa + (xb - xa) * 0.5, yd1, z], [xb - 1.5, yd1, z], { hinge, width: 0.3, miss: 0.1, lod: 2.2 });
    }
    B.facet([xa, yd1, zs - 0.2], U, [0, 0, zn - zs + 0.4], { ink: I.pearl, tone: 1 });
    B.facet([xa, yd0 - 0.25, zs], U, [0, 0, zn - zs], { ink: I.umber, tone: 0.6 });               // the deck's underside
    if (i % 3 === 2) await ctx.yield();
  }
  // (polish 3) THE TRACK: we cross the deck six metres over it, so its top is a thing with a name: sleepers as short umber
  // planes in two runs that will not line up, and the rails as broken strokes on them (short pieces, never a rule).
  S.own((r3) => {
    for (let k = 0; k < 74; k++) {
      const x = -110 + k * 3 + 0.8 * r3(), z = (k % 9 < 5 ? -2.2 : 2.3) + 0.3 * r3(), O = [x, yd1 + 0.12, z - 1.5];
      B.facet(O, [0.9, 0, 0.1], [0.15 * (r3() - 0.5), 0, 3], { ink: k % 5 === 2 ? I.slate : I.umber, tone: 1, lod: 0.5, quiet: 0.25, lockInk: I.umber });
    }
    for (let k = 0; k < 16; k++) for (const dz of [-0.75, 0.75]) {
      const x = -108 + k * 13.6 + 2 * r3(), z = (k % 3 ? -2.2 : 2.3) + dz;
      B.stroke([x, yd1 + 0.3, z], [x + 7 + 3 * r3(), yd1 + 0.3, z], { miss: 0.12, lod: 0.5, width: 0.16 });
    }
  });
  // THE ROAD TO THE TOWN (polish 1): broad paving plates down the axis, under the middle arch and up the forecourt to
  // the foot of the stair street, so the ground the lock and the arch are seen over is a thing with a name. Plates 13 m
  // long along the flight (nothing alternates fast under the eye), bone and pearl with a worn umber one.
  S.own(() => {
    const inks = [I.bone, I.pearl, I.bone, I.umber, I.pearl, I.bone, I.pearl], xOf = (z) => z < 20 ? 0 : 32 * (z - 20) / 62;
    for (let k = 0; k < 15; k++) {
      const z0 = -118 + k * 13.3, z1 = z0 + 13.9, xa = xOf(z0), xb = xOf(z1), y0 = groundY(xa, z0) + 0.32, y1 = groundY(xb, z1) + 0.32;
      const hw = 5.4 + (k % 3) * 0.5, O = [xa + hw, y0, z0], U = [-2 * hw, 0, 0], V = [xb - xa, y1 - y0, z1 - z0];
      const hinge = { p: O, a: [-1, 0, 0], max: 0.03, phase: k * 1.3, bias: 0 };
      B.facet(O, U, V, { ink: inks[k % 7], lockInk: I.bone, tone: 1, hinge, quiet: 0.25, taper: 0.9 + 0.02 * (k % 5) });
      B.stroke(k % 2 ? O : add(O, U), mad(k % 2 ? O : add(O, U), V, 0.42), { hinge, miss: 0.05, lod: 0.5 });      // its kerb, a short stroke on its own edge
    }
  });
  // (polish 1) the avenue begins south of the viaduct: eight pairs of cypresses line the road to the middle arch, so
  // the ground the lock is seen over has a middle distance and the arch is approached between trees
  S.own((r3) => {
    for (let k = 0; k < 8; k++) for (const sg of [-1, 1]) {
      const z = -114 + k * 13.6 + 3 * r3(), x = sg * (11.5 + 2.5 * r3()), base = [x, groundY(x, z), z];
      const h = 9 + 4 * r3(), w = 2.6 + 0.9 * r3(), yaw = r3() * 3.1416;
      const pn = W.path.nearestXZ(x, z);
      if (pn.dist < 9 && pn.y - (base[1] + h) < 6) continue;      // (polish 2) the swing onto the axis crosses the avenue: no tree stands in the corridor
      for (const e of [0, 1]) {
        const d = [Math.cos(yaw + e * 1.5708), 0, Math.sin(yaw + e * 1.5708)];
        B.facet(base, mad(mul(d, w / 2), UP, h * 0.42), mad(mul(d, -w / 2), UP, h * 0.58), { ink: I.sage, tone: e ? 0.8 : 0.6,
          hinge: { p: base, a: UP, max: e ? 0.9 : -0.9, phase: yaw, bias: 0 } });
      }
      B.stroke(base, mad(base, UP, h * 0.32), { width: 0.2, miss: 0.08, lod: 0.6 });
    }
  });
  // (polish 3) THE QUAY: along the water's north bank, under the arcade, a row of fishermen's houses faces the water with
  // cypresses between them and the moored boats in front. The flight runs along it 35 m off, so the approach has a
  // near (sails), a middle (the quay), the arcade behind it and the town over all. Laid from the third stream.
  S.own((r3) => {
    const r = () => r3(); r.range = (a, b) => a + (b - a) * r3(); r.pick = (arr) => arr[Math.floor(r3() * arr.length)];
    const inks = [I.bone, I.pearl, I.bone, I.slate, I.bone, I.umber, I.pearl, I.bone, I.slate, I.bone], roofs = [I.terracotta, I.umber, I.slate, I.terracotta, I.umber, I.terracotta, I.slate, I.terracotta, I.umber, I.terracotta];
    let x = -204;
    for (let k = 0; k < 8; k++) {
      const w = r.range(7, 9.5), d = r.range(6.5, 8), h = r.range(6.5, 10.5), z = -60 + r.range(-2.5, 2.5);
      addHouse(S, B, r, S.tone, [x + w / 2, groundY(x, z) - 0.4, z], [0, 0, -1], [1, 0, 0], w, d, h, {
        ink: inks[k], roofInk: roofs[k], toStreet: [0, 0, -1], strokes: 1, calm: true, dress: true, sun: [-0.95, 0, 0.3], rh: r.range(1.4, 2.4) * (roofs[k] === I.terracotta ? 1.6 : 1) });
      // (round 2) the eight houses are the size the sixth version has them: the quay is an agreed amendment that no round grows.
      // (repair 2) nothing casts ('No cast shadows'; 'A shadow is only the dark edge of a plane; nothing casts'): where a
      // shadow shape lay there is a flag of the quay's own paving in the lane, slate or umber, cut square to the quay,
      // its dark edge against the bone paving's light one. (round 2) Every flag is one size, 3.2 m by 8.6 m, and lies on
      // the quay's own line: nothing about it is taken from the house beside it.
      B.facet([x + w + 0.25, 2.42, -64.6], [0, 0, 8.6], [3.2, 0, 0], { ink: k % 2 ? I.umber : I.slate, tone: 1, taper: 0.9, quiet: 0.25, lockInk: I.sage });
      x += w + r.range(1.5, 6);
      if (k % 3 === 1) {                                                  // a cypress in the gap
        const base = [x - 3, 2, z - 1.5], hc = r.range(9, 13), wc = r.range(2.4, 3.2), yaw = r3() * 3.1416;
        for (const e of [0, 1]) {
          const dd = [Math.cos(yaw + e * 1.5708), 0, Math.sin(yaw + e * 1.5708)];
          B.facet(base, mad(mul(dd, wc / 2), UP, hc * 0.42), mad(mul(dd, -wc / 2), UP, hc * 0.58), { ink: I.sage, tone: e ? 0.8 : 0.6, hinge: { p: base, a: UP, max: e ? 0.9 : -0.9, phase: yaw, bias: 0 } });
        }
        B.stroke(base, mad(base, UP, hc * 0.32), { width: 0.2, miss: 0.08, lod: 0.6 });
        x += 4;
      }
    }
    // the quay's paving between the houses and the rim: long plates along the flight, and mooring posts as short strokes
    for (let k = 0; k < 6; k++) {
      const x0 = -206 + k * 19.5, O = [x0, 2.36 + 0.02 * (k % 3), -69.6];
      B.facet(O, [20.3, 0, 0], [0.6 * (k % 2 ? 1 : -1), 0, 5.4], { ink: k % 3 === 1 ? I.pearl : I.bone, tone: 1, quiet: 0.25, lockInk: I.bone, hinge: { p: O, a: [1, 0, 0], max: 0.03, phase: k, bias: 0 } });
      B.stroke([x0 + 6, 2.4, -74.2], [x0 + 6, 4.0, -74.2], { width: 0.3, miss: 0.05, lod: 0.5 });
      // (repair 2) the post's stroke is the edge of something: the mooring stone it stands for, one small umber plane
      B.facet([x0 + 6, 2.4, -74.2], [1.1, 0, 0.3], [0, 1.5, 0], { ink: k % 2 ? I.umber : I.pearl, tone: 0.8, grad: 1, dab: 1, lod: 0.9, hinge: { p: [x0 + 6, 2.4, -74.2], a: UP, max: 0, phase: k, bias: 0.3 } });
    }
  });
  const P = new THREE.Vector3(), T = new THREE.Vector3();
  for (let k = 0; k < 9; k++) {
    // (repair 3) stood along the round-2 course, where they stood; the corridor is kept against the course as it is flown now
    const u = W.WAS_ARCH + (0.012 + k * 0.0125) * W.WAS_LR;
    W.was.pointAt(u, P); W.was.tangentAt(u, T);
    const rl = Math.hypot(T.x, T.z) || 1, rx = -T.z / rl, rz = T.x / rl;
    for (const sg of [-1, 1]) {
      const off = sg * rng.range(12.5, 16.5), x = P.x + rx * off, z = P.z + rz * off, base = [x, groundY(x, z), z];
      const h = rng.range(8.5, 12.5), w = rng.range(2.4, 3.4), yaw = rng() * 3.1416;
      const pn = W.path.nearestXZ(x, z);
      if (pn.y - base[1] - h < 1.5 && pn.dist < 14) continue;
      for (const e of [0, 1]) {
        const d = [Math.cos(yaw + e * 1.5708), 0, Math.sin(yaw + e * 1.5708)];
        B.facet(base, mad(mul(d, w / 2), UP, h * 0.42), mad(mul(d, -w / 2), UP, h * 0.58), { ink: I.sage, tone: e ? 0.8 : 0.6,
          hinge: { p: base, a: UP, max: e ? 0.9 : -0.9, phase: yaw, bias: 0 } });
      }
      B.stroke(base, mad(base, UP, h * 0.32), { width: 0.2, miss: 0.2, lod: 0.6 });
      FORE.trees.push([x, z]);
      B.stroke(mad(base, [rx, 0, rz], -sg * 2.5), mad(base, [rx, 0, rz], sg * 2.5), { miss: 0.3, lod: 0.5 });
    }
  }
  // forecourt houses along the avenue, three a side outside the cypresses: they stand in the middle arch as it fills
  // the frame (and through it, plain, in the lock). Laid from the style's second stream: nothing else moves.
  S.aside((r2) => {
    const r = () => r2(); r.range = (a, b) => a + (b - a) * r2(); r.pick = (arr) => arr[Math.floor(r2() * arr.length)];
    const inks = [I.slate, I.bone, I.umber, I.bone, I.slate, I.pearl], roofs = [I.slate, I.terracotta, I.umber, I.terracotta, I.slate, I.umber];      // (polish 2: the shade side of the avenue in slate and umber, the side turned to the light in bone under terracotta)
    for (let k = 0; k < 3; k++) for (const sg of [-1, 1]) {
      W.was.pointAt(W.WAS_ARCH + (0.049 + k * 0.024 + (sg > 0 ? 0.01 : 0)) * W.WAS_LR, P); W.was.tangentAt(W.WAS_ARCH + (0.049 + k * 0.024) * W.WAS_LR, T);
      const rl = Math.hypot(T.x, T.z) || 1, rx = -T.z / rl, rz = T.x / rl, off = sg * r.range(22.5, 24.5);
      const x = P.x + rx * off, z = P.z + rz * off, o = [-sg * rx, 0, -sg * rz], t = [o[2], 0, -o[0]], j = k * 2 + (sg > 0 ? 1 : 0);
      FORE.houses.push([x, z]);
      addHouse(S, B, r, S.tone, [x, groundY(x, z) - 0.5, z], o, t, r.range(6.6, 8), r.range(6.2, 7.4), r.range(6.4, 9), {
        ink: inks[j], roofInk: roofs[j], toStreet: o, strokes: 1, calm: true, dress: true, sun: [-0.95, 0, 0.3], rh: r.range(1.2, 2) * (roofs[j] === I.terracotta ? 1.8 : 1) });
    }
  });
}

// ---- the sky: the same planes in the same paint. Shards on a shallow bowl, three ridges that get plainer with
//      distance (the last is bare priming with ruled strokes), the leaving shower in the west, drips under the arches ----
async function buildSky(ctx, W) {
  const { S, I } = W, rng = W.rng.fork('sky'), B = S.batch(2048);
  const C = [-60, 0, -80], FLAT = 0.6;
  const shard = (az, el, R, w, h, ink, max, taper, quiet = 0.75, skip = false) => {
    const dir = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
    const c = [C[0] + R * dir[0], C[1] + R * dir[1] * FLAT, C[2] + R * dir[2]];
    const n = mul(dir, -1);
    let t1 = nrm(crs(Math.abs(n[1]) > 0.95 ? [1, 0, 0] : UP, n)), t2 = crs(n, t1);
    const roll = rng() * 6.283, cr = Math.cos(roll), sr = Math.sin(roll);
    const a = add(mul(t1, cr), mul(t2, sr)), b = add(mul(t1, -sr), mul(t2, cr));
    const O = mad(mad(c, a, -w / 2), b, -h / 2);
    const phase = rng() * 6.283;
    B.facet(O, skip ? [0, 0, 0] : mul(a, w), skip ? [0, 0, 0] : mul(b, h), { ink, lockInk: I.pearl, tone: 2, taper, quiet, hinge: { p: c, a, max, phase, bias: 0 } });
    return { O, a, b, w, h };
  };
  // a closed pearl-and-bone backing so the lock's dome has no hole, then the 260 shards in front of it
  // (the backing is one pearl all round the forward half; bone only behind us)
  for (let i = 0; i < 18; i++) shard((i + 0.5) / 18 * 6.283, 0.3, 1010, 420, 760, i % 3 === 1 && i > 5 && i < 14 ? I.bone : I.pearl, 0.04, 1, 0.875);
  for (let i = 0; i < 9; i++) shard((i + 0.5) / 9 * 6.283, 1.05, 1010, 640, 900, i % 2 && i > 2 && i < 7 ? I.bone : I.pearl, 0.04, 1, 0.875);
  shard(0, 1.5607, 1000, 900, 900, I.pearl, 0.02, 1, 0.75);
  const nSh = 260;
  for (let i = 0; i < nSh; i++) {
    const az = rng() * 6.283, el = Math.asin(Math.pow(rng(), 1.25) * 0.98) - 0.03;
    // THE GROUND OF THE PICTURE. The sky is the quiet half: pearl and bone over a narrow range, so the town (the only
    // thing in slate, umber and terracotta with full dark edges) is the figure against it. Where the town is ever seen
    // against the sky (the whole forward half from the flight) the shards are fewer and larger and none is slate;
    // slate keeps to the sky behind us and overhead.
    const daz = Math.abs(((az - 0.25 + 9.4248) % 6.2832) - 3.1416);                     // bearing away from the town's
    // (polish 1) The whole forward sky is a FEW LARGE CALM PLANES: one field of pearl behind the tower, a handful of
    // broad bone planes low to either side of the town for warmth, and nothing loud. Only one shard in four is kept
    // there, twice the size and nearly flat; the busy sky keeps to behind us and overhead. No strokes hang in the air.
    const r = rng(), front = daz < 1.75 && el < 1.15, clear = front;
    const ink = front ? (daz > 0.42 && el < 0.5 && r < 0.6 ? I.bone : I.pearl) : r < 0.5 ? I.pearl : r < 0.82 ? I.bone : I.slate;
    const big = ink === I.slate ? 0.6 : front ? 2 : 1;
    const sh = shard(az, el, rng.range(880, 960), rng.range(80, 300) * big, rng.range(80, 300) * big, ink, rng.range(0.14, 0.3) * (front ? 0.5 : 1), rng() < 0.3 ? rng.range(0.2, 0.8) : 1,
      ink === I.slate ? 0.5 : front ? 0.75 : 0.75, front);      // (polish 2: none of them in the forward half)
    rng();
    if (i % 90 === 89) await ctx.yield();
  }
  // ridges: 500 m (painted), 800 m (two inks), 1,200 m (bare priming, ruled)
  const ridge = (R, h0, h1, wide, inks, strokeP, arc) => {
    for (let az = -arc; az < arc;) {
      const w = rng.range(wide[0], wide[1]), da = w / R, am = az + da / 2;
      const o = [Math.sin(am), 0, Math.cos(am)], t = [Math.cos(am), 0, -Math.sin(am)];
      const h = rng.range(h0, h1), base = mad([C[0], -4, C[2] + 20], o, R + rng.range(-30, 30));
      const O = mad(base, t, -w * 0.62), U = mul(t, w * 1.24), V = [o[0] * -h * 0.5 + t[0] * rng.range(-0.3, 0.3) * w, h, o[2] * -h * 0.5 + t[2] * rng.range(-0.3, 0.3) * w];
      const hinge = { p: O, a: nrm(U), max: 0.1, phase: rng() * 6.283, bias: 0 };
      B.facet(O, U, V, { ink: rng.pick(inks), quiet: R < 700 ? 0.38 : 0.62, tone: S.tone(nrm([-o[0], 0.6, -o[2]])), taper: rng() < 0.55 ? rng.range(0, 0.45) : rng.range(0.5, 0.9), hinge });
      const open = !(am > -0.25 && am < 0.65);          // no ruled line across the sky the tower stands against
      // ruled corner-to-apex strokes belong to the bare priming; a painted ridge gets a short accent near its apex
      const ap = add(mad(O, U, 0.5), V), k0 = R < 700 ? 0.74 : 0;
      if (rng() < strokeP && open) B.stroke(mad(add(O, U), sub(ap, add(O, U)), Math.max(k0, 0.55)), ap, { hinge, miss: 0.4, lod: 5 });      // (on the ridge's own edge, short)
      rng();
      az += da * rng.range(0.55, 0.9);
    }
  };
  ridge(505, 45, 100, [60, 140], [I.sage, I.sage, I.sage, I.bone, I.sage, I.bone], 0, 2.1);
  await ctx.yield();
  ridge(800, 90, 170, [90, 190], [I.bone, I.pearl, I.bone, I.pearl, I.sage], 0, 3.1416);
  ridge(1180, 150, 250, [120, 200], [I.bone], 0.3, 3.1416);
  // ruled construction strokes left on the unfinished distance
  for (let i = 0; i < 16; i++) {
    const az = rng() * 6.283, R = rng.range(980, 1150), y = rng.range(10, 240), l = rng.range(90, 240), sl = rng.range(-0.12, 0.12);
    const o = [Math.sin(az), 0, Math.cos(az)], t = [Math.cos(az), 0, -Math.sin(az)], A = mad([C[0], y, C[2]], o, R);
    void A; void t; void l; void sl;      // (polish 1: the ruled strokes hung in the air as loose lines; the far ridge's own edges carry the ruling)
  }
  await ctx.yield();
  // the shower leaving in the west (polish 1): ONE THING WITH A NAME, 900 m off beyond the town's right shoulder: three
  // dark planes of cloud and under them a tight curtain of 300 long parallel strokes, drifting east at 4 m/s. Scattered
  // wide over the west, as it first was, its strokes read as loose dashes in the air.
  if (W.weather !== 'dry') {
    const nR = Math.round(300 * (W.weather === 'rain' ? 1 : 0.5) * Math.max(0.6, W.detail));
    for (let i = 0; i < nR; i++) {
      const x = rng.range(-540, -330), z = rng.range(520, 720), y = rng.range(160, 335) * 0.6 + 62, l = rng.range(18, 34);      // (polish 2: the curtain hangs from its cloud, under the bowl of the sky)
      B.stroke([x, y, z], [x + l * 0.42, y - l, z], { miss: 0, lod: 4, drift: { v: [4, -1.6, 0], T: rng.range(9, 14) } });
    }
    for (const [cx, cy, cz, w, h, ink] of [[-470, 276, 620, 330, 70, I.slate], [-360, 292, 560, 260, 60, I.slate], [-520, 266, 700, 280, 54, I.slate]])
      B.facet([cx - w / 2, cy - h / 2, cz], [w, 16, -60], [30, h, 0], { ink, lockInk: I.pearl, tone: 2, quiet: 0.5, taper: 0.7, hinge: { p: [cx, cy, cz], a: [1, 0, 0], max: 0.12, phase: cx, bias: 0 } });
  }
  // drips from the arch crowns
  // (cure 8) A DRIP IS KEPT OFF OUR LINE BY ITS PLACE. The world's clock is already running when we come in through a
  // portal, so a drip may be anywhere on its fall as we pass under the middle arch, and live let one fall across the
  // lens. Each drip's WHOLE fall line (its stroke at full drawn length, from where it leaves the crown down to where
  // the fall ends: every phase at once) is therefore measured, as it is dealt, against our WHOLE course, and keeps AIR
  // of clear air between its skin and that line. A drip that would not is moved on the strip it was dealt on, straight
  // away from the course, by what it lacks and no more (the other way if the strip ends first); its period, its fall
  // and its length are the dealt ones and no draw moves. A drip that keeps the air as dealt is laid exactly as it was.
  // No clock, no lens, no seed and no place of a picture is asked.
  if (W.weather === 'rain') {
    const AIR = 2.0;        // metres of clear air between a drip's skin and our line: the site's one figure for a body beside the lens
    const DX = 5, DZ = 4.5, Y0 = 24.6, Y1 = 23.2, DW = 0.16, VY = -7.5;      // the strip a drip is dealt on, its stroke's two heights, its width, its fall in m/s: all as they were
    const OVER = 0.08;      // the stroke is drawn past each end by this share of its length when the fold is whole (parts file, the stroke's pose)
    const STEP = 0.25;      // metres of route from one chord end of the course to the next (a chord's sag against the curve is under a millimetre)
    const HAIR = 1e-4;      // metres: a place is stored in single floats, so a moved drip goes a tenth of a millimetre past what it lacks
    const WALK = 4;         // metres to a stride of the first walk along the course (any stride over twice STEP serves; 4 m makes it about 170 points)
    const NEED = AIR + DW / 2, REACH = NEED + 2 * STEP + 1, cs = [], cp = new THREE.Vector3();
    // The course as chords, laid only where it comes within REACH of the strips' ground (every drip stands at |z| <= DZ), so that the
    // build does not stall: a first walk in strides of WALK finds those stretches. A point of the course is never further than half a
    // stride from a stride's end, so no chord left out has a point within REACH of any drip, and the measure is the same as against
    // the whole course, chord for chord.
    const NK = Math.ceil(W.path.length / STEP), keep = new Uint8Array(NK);
    for (let d = 0; d < W.path.length + WALK; d += WALK) {
      const dc = Math.min(d, W.path.length); W.path.posAtDist(dc, cp);
      if (Math.abs(cp.z) <= DZ + REACH + WALK) for (let k = Math.max(0, Math.floor((dc - WALK) / STEP)), k1 = Math.min(NK - 1, Math.ceil((dc + WALK) / STEP)); k <= k1; k++) keep[k] = 1;
    }
    for (let k = 0; k < NK; k++) if (keep[k]) {
      W.path.posAtDist(Math.min(k * STEP, W.path.length), cp); cs.push(cp.x, cp.y, cp.z);
      W.path.posAtDist(Math.min((k + 1) * STEP, W.path.length), cp); cs.push(cp.x, cp.y, cp.z);
    }
    // the least distance from the plumb line at (x, z), heights ya to yb, to the course, and the way from the course's nearest point to it in plan
    const least = (x, z, ya, yb) => {
      let best = Infinity, bx = 0, bz = 0;
      for (let j = 0; j < cs.length; j += 6) {
        const px = cs[j], py = cs[j + 1], pz = cs[j + 2], ux = cs[j + 3] - px, uy = cs[j + 4] - py, uz = cs[j + 5] - pz;
        if (Math.hypot(px - x, pz - z) > REACH) continue;
        const pl = ux * ux + uz * uz, al = pl + uy * uy;
        const ts = [0, 1, pl > 0 ? ((x - px) * ux + (z - pz) * uz) / pl : 0,
          al > 0 ? ((x - px) * ux + (ya - py) * uy + (z - pz) * uz) / al : 0, al > 0 ? ((x - px) * ux + (yb - py) * uy + (z - pz) * uz) / al : 0,
          uy !== 0 ? (ya - py) / uy : 0, uy !== 0 ? (yb - py) / uy : 0];
        for (const t0 of ts) {
          const t = t0 < 0 ? 0 : t0 > 1 ? 1 : t0, qx = px + ux * t, qy = py + uy * t, qz = pz + uz * t;
          const dy = qy < ya ? ya - qy : qy > yb ? qy - yb : 0, dd = Math.hypot(x - qx, dy, z - qz);
          if (dd < best) { best = dd; bx = x - qx; bz = z - qz; }
        }
      }
      return [best, bx, bz];
    };
    for (let i = 0; i < 9; i++) for (let k = 0; k < 3; k++) {
      const c0 = -96 + i * 24, x = c0 + rng.range(-DX, DX), z = rng.range(-DZ, DZ), T = 2.9 + rng();
      const len = Y0 - Y1, yb = Y0 + len * OVER, ya = Y1 - len * OVER + VY * T;      // the fall line's top and its lowest end
      let px = x, pz = z;
      if (least(Math.fround(x), Math.fround(z), ya, yb)[0] < NEED) {
        for (const way of [1, -1]) {      // away from the course on the side it was dealt; if the strip ends first, across the course and away on the other side
          px = Math.fround(x); pz = Math.fround(z);
          for (let n = 0; n < 24; n++) {
            const [dd, ax, az] = least(px, pz, ya, yb); if (dd >= NEED) break;
            const al = Math.hypot(ax, az), wx = al > 1e-9 ? ax / al : 1, wz = al > 1e-9 ? az / al : 0;
            const go = way < 0 && n === 0 ? -(NEED + dd + HAIR) : NEED - dd + HAIR;
            px = Math.fround(Math.min(c0 + DX, Math.max(c0 - DX, px + wx * go))); pz = Math.fround(Math.min(DZ, Math.max(-DZ, pz + wz * go)));
          }
          if (least(px, pz, ya, yb)[0] >= NEED) break;
        }
      }
      B.stroke([px, Y0, pz], [px, Y1, pz], { miss: 0, width: DW, lod: 0.5, drift: { v: [0, VY, 0], T } });
    }
  }
  // (polish 2) THE FORWARD SKY IS STRATA: one field of pearl, and lying in it a few long, nearly level planes of bone, the
  // light of the morning coming in low from the side: broad ones to either side of the town at the height of its
  // upper half, thinner ones higher up, none behind the tower. Calm, large, and level, so the town is the busy thing.
  const stratum = (da, y0, w, h, roll, taper, R = 880) => {
    const az = 0.25 + da, o = [Math.sin(az), 0, Math.cos(az)], t = [Math.cos(az), 0, -Math.sin(az)];
    const c = [C[0] + R * o[0], y0 + h / 2, C[2] + R * o[2]], a = nrm([t[0], roll, t[2]]), b = [0, 1, 0];
    B.facet(mad(mad(c, a, -w / 2), b, -h / 2), mul(a, w), mul(b, h), { ink: I.bone, lockInk: I.pearl, tone: 2, taper, quiet: 1, grad: da > 0 ? 3.3 : 0.2,
      hinge: { p: c, a, max: 0.07, phase: da * 2.3 + y0, bias: 0 } });
  };
  for (const [da, y0, w, h, roll, taper] of [[-1.72, 150, 700, 170, 0.03, 0.85], [-0.95, 175, 620, 120, -0.04, 0.8], [0.9, 165, 640, 130, 0.04, 0.8], [1.7, 150, 720, 180, -0.03, 0.85]])
    stratum(da, y0, w, h, roll, taper);
  // higher up the bars lie on the bowl itself (under the backing), thinner and fewer: what the climb to the ring looks up into
  for (const [da, el, w, h, roll, taper] of [[-0.55, 0.56, 560, 70, 0.03, 0.7], [0.5, 0.64, 620, 80, -0.03, 0.7], [-0.2, 0.84, 520, 64, 0.02, 0.65], [0.45, 0.97, 640, 84, -0.02, 0.7],
    [-0.8, 0.98, 700, 90, 0.03, 0.7], [-1.35, 0.6, 640, 84, -0.02, 0.7], [1.3, 0.62, 660, 84, 0.02, 0.7], [0.1, 1.22, 700, 90, 0.02, 0.6]]) {
    const az = 0.25 + da, dir = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)], R = 940;
    const c = [C[0] + R * dir[0], C[1] + R * dir[1] * FLAT, C[2] + R * dir[2]], n = mul(dir, -1);
    const t1 = nrm(crs(UP, n)), t2 = crs(n, t1), a2 = nrm(mad(t1, t2, roll));
    B.facet(mad(mad(c, a2, -w / 2), t2, -h / 2), mul(a2, w), mul(t2, h), { ink: I.bone, lockInk: I.pearl, tone: 2, taper, quiet: 1, grad: da > 0 ? 3.3 : 0.2,
      hinge: { p: c, a: a2, max: 0.06, phase: da * 2.3 + el, bias: 0 } });
  }
  addBatch(W, B, 'sky-shards');
}

// ---- the terraces' planting: olives (a trunk of three strokes, a crown of six lozenges hinged at the trunk that
//      fan open and shut as the eye passes), or vine rows, or almond in blossom (the same tree in bone) ----
async function buildGrove(ctx, W) {
  const { S, I, path, grove } = W, rng = W.rng.fork('grove'), B = S.batch(8192);
  const keep = (grove === 'vine' ? 0.8 : 0.62) * W.density * (0.55 + 0.45 * W.detail);
  const stepX = grove === 'vine' ? 5.2 : 9.5;
  let n = 0;
  const rows = [];
  // (polish 1) the plateau and its three steps behind and beside the entry, then groves on the valley floor along both
  // banks of the water: the country round the town is olive rows (things with names), never bare slivers
  for (let z = PLZ - 72; z < PLZ - 2; z += grove === 'vine' ? 8 : 10) rows.push(z);
  for (let z = PLZ + 13; z < -50; z += grove === 'vine' ? 9 : 12.5) rows.push(z);
  for (const z0 of rows) {
    for (let x = -330 + rng() * stepX; x < 205; x += stepX) {
      const r1 = rng(), jx = rng.range(-2, 2), jz = rng.range(-2.4, 2.4), size = rng.range(0.85, 1.25), yaw = rng() * 6.283, ph = rng() * 6.283;
      if (r1 > keep) continue;
      const px = x + jx, pz = z0 + (grove === 'vine' ? jz * 0.2 : jz), y = groundY(px, pz);
      if (z0 > PLZ && (inReservoir(px, pz, 9) || Math.abs(px) < 9 || (pz > -73 && pz < -49 && px > -212 && px < -92))) continue;      // not in the water, not on the axis the lock is seen along, not in the quay's houses
      const near = path.nearestXZ(px, pz);
      const room = near.y - y - 6.5;                          // the corridor: nothing within 6 m under the wings
      if (near.dist < 9 && room < 2.2) continue;
      const base = [px, y, pz];
      if (grove === 'vine') {                                 // a stake and two leaves, in ruled rows
        const top = mad(base, UP, 2.5 * size);
        B.stroke(base, top, { miss: 0.1, lod: 0.45, width: 0.14 });
        for (const sg of [-1, 1]) {
          const d = nrm([sg * 0.9, 0.35, rng.range(-0.3, 0.3)]), s = nrm(crs(d, UP)), L = 3.1 * size, wd = 1.55 * size;
          B.facet(top, mad(mul(d, L / 2), s, wd / 2), mad(mul(d, L / 2), s, -wd / 2), { ink: I.sage, tone: sg > 0 ? 1 : 0.8,
            hinge: { p: top, a: hingeAxis([0, 0, 1], d, UP), max: rng.range(0.5, 1.0), phase: ph, bias: 0.15 } });
        }
        S.own((r2) => {                                        // a second, lower pair along the row: the vine is leaves, not a fence post
          for (const sg of [-1, 1]) {
            const d = nrm([0.25 * sg, 0.2, sg * 0.95]), s2 = nrm(crs(d, UP)), L = 2.2 * size, wd = 1.25 * size, mid = mad(base, UP, 1.5 * size);
            B.facet(mid, mad(mul(d, L / 2), s2, wd / 2), mad(mul(d, L / 2), s2, -wd / 2), { ink: I.sage, tone: sg > 0 ? 0.6 : 0.8, lod: 0.7,
              hinge: { p: mid, a: hingeAxis([1, 0, 0], d, UP), max: 0.5 + 0.5 * r2(), phase: ph + 1, bias: 0.15 } });
          }
        });
        n++; continue;
      }
      const th = Math.min(near.dist < 9 ? room * 0.5 : 9, rng.range(2.1, 2.9) * size * (grove === 'almond' ? 1.15 : 1));
      const top = mad(base, UP, th), lean = [Math.cos(yaw) * 0.5, 0, Math.sin(yaw) * 0.5];
      B.stroke(base, mad(top, lean, -1), { miss: 0.1, lod: 0.5, width: 0.2 });
      B.stroke(mad(base, lean, 0.5), mad(top, lean, 0.6), { miss: 0.15, lod: 0.4, width: 0.16 });
      B.stroke(mad(base, UP, th * 0.45), mad(mad(top, lean, 1.6), UP, 0.5), { miss: 0.15, lod: 0.3, width: 0.14 });
      for (let k = 0; k < 6; k++) {
        const a = yaw + k * 1.047 + rng.range(-0.3, 0.3), el = k % 2 ? 0.25 : 0.75;
        const d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], s = nrm(crs(d, UP));
        const L = rng.range(2.6, 3.8) * size, wd = L * rng.range(0.36, 0.5);
        const ink = grove === 'almond' ? (k % 4 === 3 ? I.pearl : I.bone) : I.sage;
        B.facet(mad(top, UP, -0.3), mad(mul(d, L / 2), s, wd / 2), mad(mul(d, L / 2), s, -wd / 2), { ink, tone: k % 3 === 0 ? 0.6 : k % 3 === 1 ? 0.8 : 1,
          hinge: { p: top, a: hingeAxis(s, d, UP), max: rng.range(0.55, 1.15) * (k % 2 ? 1 : -0.7), phase: ph + k * 0.5, bias: 0.2 } });
      }
      n++;
    }
    await ctx.yield();
  }
  // THE CROWNS THAT PASS CLOSE: along the first descent a dozen big trees (or tall vines) stand 8 to 13 m to one side
  // of the flight, never under it, their crowns reaching to within 3 m of the wings' height: six lozenges 4 to 6 m
  // long fanning as we go by, a sixth of the frame and more. (Second stream: the grove keeps every tree it had.)
  await ctx.yield();
  S.own((r2) => {
    const P = new THREE.Vector3(), T = new THREE.Vector3();
    for (let j = 0; j < 18; j++) {
      const u = 0.008 + j * 0.0035 + 0.0015 * r2(), sg = j % 2 ? 1 : -1;
      path.pointAt(u, P); path.tangentAt(u, T);
      const rl = Math.hypot(T.x, T.z) || 1, off = sg * (8.5 + 4.5 * r2() + (j % 3 === 0 ? 3 : 0));
      const px = P.x - T.z / rl * off, pz = P.z + T.x / rl * off, y = groundY(px, pz);
      const yaw = r2() * 6.283, ph = r2() * 6.283, sz = 0.85 + 0.35 * r2();
      const th = Math.min(8.5, Math.max(2.5, P.y - y - 3.2 - 1.3 * sz));
      if (inReservoir(px, pz, 6) || P.y - y < 6.5 || (grove === 'vine' && j % 3)) continue;
      const base = [px, y, pz], top = mad(base, UP, th), lean = [Math.cos(yaw) * 0.6, 0, Math.sin(yaw) * 0.6];
      B.stroke(base, mad(top, lean, -1), { miss: 0.12, width: 0.3, lod: 0.6 });
      B.stroke(mad(base, lean, 0.7), mad(top, lean, 0.7), { miss: 0.2, width: 0.22, lod: 0.5 });
      B.stroke(mad(base, UP, th * 0.5), mad(mad(top, lean, 2.2), UP, 0.6), { miss: 0.2, width: 0.18, lod: 0.4 });
      const nl = grove === 'vine' ? 5 : 6;
      for (let k = 0; k < nl; k++) {
        const a = yaw + k * 6.283 / nl + (r2() - 0.5) * 0.5, el = k % 2 ? 0.2 : 0.62;
        const d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], s2 = nrm(crs(d, UP));
        const L = (4.2 + 1.8 * r2()) * sz * (grove === 'vine' ? 0.7 : 1), wd = L * (0.4 + 0.14 * r2());
        const ink = grove === 'almond' ? (k % 3 === 2 ? I.pearl : I.bone) : I.sage;
        B.facet(mad(top, UP, -0.4), mad(mul(d, L / 2), s2, wd / 2), mad(mul(d, L / 2), s2, -wd / 2), { ink, tone: k % 3 === 0 ? 0.6 : k % 3 === 1 ? 0.8 : 1,
          hinge: { p: top, a: hingeAxis(s2, d, UP), max: (0.6 + 0.5 * r2()) * (k % 2 ? 1 : -0.7), phase: ph + k * 0.5, bias: 0.2 } });
        if (k % 3 === 0) B.stroke(mad(top, d, L * 0.15), mad(top, d, L * 0.6), { miss: 0.3, width: 0.14, lod: 0.3,
          hinge: { p: top, a: hingeAxis(s2, d, UP), max: 0.6 * (k % 2 ? 1 : -0.7), phase: ph + k * 0.5, bias: 0.2 } });
      }
    }
  });
  W.groveCount = n;
  addBatch(W, B, 'grove');
}

// ---- the reservoir: water does not mirror; it shows what stands above it in plan. Every roof of the town is laid
//      flat on the water as its own plane in its own ink (one in nine terracotta), the tower a bone square, the ring
//      the one curve; the whole plan slides with us at a seventh of our motion and its planes rock as the eye passes.
//      Far planes shrink away, so from a distance the water is a few broad plates. ----
async function buildReservoir(ctx, W) {
  const { S, I, hero } = W, rng = W.rng.fork('reservoir'), B = W.groundB;
  const X0 = RX0, X1 = RX1, Z0 = RZ0, Z1 = RZ1, yr = 2.5;
  // the stone rim: plates on top, a wall down to the water
  for (const [ax, az, dx, dz, nx, nz] of [[X0, Z0, 1, 0, 0, -1], [X1, Z0, 0, 1, 1, 0], [X1, Z1, -1, 0, 0, 1], [X0, Z1, 0, -1, -1, 0]]) {
    const side = dx ? X1 - X0 : Z1 - Z0;
    for (let s = -5; s < side + 5;) {
      const l = Math.min(side + 5 - s, rng.range(16, 30)), O = [ax + dx * s, yr, az + dz * s], U = [dx * l, 0, dz * l];
      const hinge = { p: O, a: nrm(U), max: 0.05, phase: rng() * 6.283, bias: 0 };
      B.facet(O, U, [nx * 5.5, 0, nz * 5.5], { ink: rng() < 0.55 ? I.bone : rng() < 0.6 ? I.pearl : I.umber, tone: 1, hinge });
      B.facet([O[0], -0.2, O[2]], U, [0, yr + 0.2, 0], { ink: [I.umber, I.bone, I.pearl, I.umber, I.sage][Math.floor(Math.abs(s) / 5) % 5], tone: S.tone([-nx, 0, -nz]) });      // (not one umber wall: seen edge-on along its length it was a ruled dark line)
      B.stroke(mad(O, U, 0.2), mad(O, U, 0.5), { miss: 0.3, lod: 0.9, width: 0.22 });      // (short: the rim's strokes never chain into a ruled line)
      if (rng() < 0.5) B.stroke(mad(mad(O, U, 0.5), [nx, 0, nz], 5.5), mad(mad(O, U, 0.72), [nx, 0, nz], 5.5), { miss: 0.4, lod: 0.6 });
      s += l;
    }
  }
  // the water itself: broad pearl plates that will not agree
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x0 = X0 + (X1 - X0) * i / 4, z0 = Z0 + (Z1 - Z0) * j / 3, sk = rng.range(-6, 6);
    // (water reads as water: broad calm plates of slate and pearl, the one place outside the town where slate lies)
    B.facet([x0 - 1, 0.01 * ((i + j) % 3), z0 - 1], [(X1 - X0) / 4 + 2, 0, sk], [rng.range(-6, 6), 0, (Z1 - Z0) / 3 + 2], { ink: (i * 3 + j) % 5 === 3 ? I.pearl : I.slate, tone: 1, quiet: 0.5 });
  }
  // BOATS (polish 1): five sailing boats ride the water beside the flight, 25 to 40 m off it, things with names in
  // the middle distance. Each is the style's object: its flank in profile, its deck in plan, a mast stroke, and two
  // sails that turn about the mast as the eye passes and fill and slacken in the west air.
  S.own((r3) => {
    // (polish 3) nine boats: two stand at the entry (one large to the right of the town in the first frame), two lie
    // beside the stoop over the plan, four are moored along the north quay under the houses, one rides far out
    // (repair 3) the second boat rode 14 m from our line, so on the stoop its sails came to stand taller than the frame and
    // were cut by its top, bottom and side at once. Its berth is about 32 m from the line now and a little further on:
    // it stands whole, under the frame's top, until it leaves by the one side, and it is the same boat at the same size.
    const fleet = [[-174, -176, 3.5, I.slate, 1], [-210.8, -136.3, 0.3, I.bone, 1], [-228, -120, 0.4, I.slate, 0.9],
      [-163, -88, 0.5, I.bone, 0.62], [-186, -86, 3.7, I.slate, 0.7], [-103, -85, 0.6, I.bone, 0.62], [-70, -150, 3.3, I.slate, 1], [-56, -140, 0.2, I.bone, 1]];
    for (let b = 0; b < fleet.length; b++) {
      const [bx, bz, yaw, sailInk, bs] = fleet[b], sc = (1.65 + 0.25 * r3()) * bs, c = Math.cos(yaw), sn = Math.sin(yaw);
      const L = (x, y, z) => [bx + (x * c + z * sn) * sc, 0.15 + y * sc, bz + (-x * sn + z * c) * sc], D = (x, y, z) => [(x * c + z * sn) * sc, y * sc, (-x * sn + z * c) * sc];
      const keel = { p: L(0, 0.2, 0), a: nrm(D(1, 0, 0)), max: 0.45, phase: b * 1.7, bias: 0.4 }, ph = b * 2.1 + 0.4;
      B.facet(L(-4.6, 0.1, 0.9), D(9.6, 0, 0), D(0.5, 1.5, 0.5), { ink: b % 2 ? I.slate : I.umber, tone: 0.8, taper: 0.86, hinge: keel, sway: 0.05 });      // the flank, in profile
      B.facet(L(-4.6, 1.5, 0), D(4.9, 0, 1.5), D(4.9, 0, -1.5), { ink: I.bone, tone: 1, sway: 0.03, hinge: { p: L(0, 1.5, 0), a: nrm(D(1, 0, 0)), max: 0.12, phase: ph, bias: 0 } });      // the deck, in plan
      B.facet(L(-4.6, 0.2, -0.9), D(0, 0, 1.8), D(-0.5, 1.3, 0), { ink: I.umber, tone: 0.6, hinge: keel });                                    // the transom
      B.stroke(L(-4.2, 1.52, 1.4), L(1.5, 1.52, 1.4), { hinge: keel, miss: 0.05, lod: 0.5 });                                               // the gunwale
      const foot = L(0.6, 1.5, 0), top = L(0.6, 12.2, 0), mast = { p: foot, a: UP, max: 0.7, phase: ph, bias: 0.25 };
      // (repair 2) the mast is not one unbroken stroke of 18 to 20 m ('A line is a short straight black stroke'): it is four
      // short strokes, each about 4 m, each begun to one side of where the last one stopped and a little after it, so they miss one another
      B.stroke(foot, L(0.76, 3.9, 0.05), { width: 0.24, miss: 0.04, lod: 1.2 });
      const still = { p: foot, a: UP, max: 0, phase: 0, bias: 0 };
      B.stroke(L(0.22, 4.75, -0.08), L(0.38, 6.9, 0), { width: 0.24, off: [0, 0, 0], grad: 1, dab: 1, hinge: still, lod: 1.2 });
      B.stroke(L(0.92, 7.8, 0.1), L(0.68, 9.8, 0), { width: 0.22, off: [0, 0, 0], grad: 1, dab: 1, hinge: still, lod: 1.2 });
      B.stroke(L(0.28, 10.7, 0), L(0.54, 12.4, -0.06), { width: 0.2, off: [0, 0, 0], grad: 1, dab: 1, hinge: still, lod: 1.2 });
      const boom = D(-4.6, 0, 0), up = D(0, 9.6, 0);
      B.facet(L(0.45, 2.4, 0), boom, mad(up, boom, -0.5), { ink: sailInk, tone: 1, taper: 0, hinge: mast, sway: 0.09 });                       // the mainsail
      const jb = D(3.6, 0, 0), ju = D(0, 7.4, 0);
      B.facet(L(0.8, 2.1, 0), jb, mad(ju, jb, -0.5), { ink: sailInk === I.bone ? I.slate : I.bone, tone: 0.8, taper: 0, hinge: { p: foot, a: UP, max: -0.5, phase: ph + 1, bias: 0.25 }, sway: 0.07 });      // the jib
      B.stroke(L(0.45, 2.4, 0), L(-4.15, 2.4, 0), { hinge: mast, miss: 0.04, lod: 0.6 });                                                    // the boom
      // (repair 2) nothing casts: no shadow shape lies on the water. The boat rides its own plate of the water (the water
      // is 'broad plates that will not agree'), slate with its own dark edge and light edge, laid along the keel
      B.facet(L(-7.2, 0.04, -3.1), D(14.4, 0, 0.9), D(-0.8, 0, 6.2), { ink: I.slate, tone: 1, taper: 0.62, quiet: 0.5, lockInk: I.slate,
        hinge: { p: [bx, 0.22, bz], a: [1, 0, 0], max: 0.03, phase: b, bias: 0 } });
    }
  });
  // (repair 2) GROUND WHERE THE SHADOW SHAPES LAY. The sixth version laid long flat shadow shapes here (every pier's across
  // the forecourt, the west houses' across the stair street). The brief has none: 'No cast shadows'; 'A shadow is only
  // the dark edge of a plane; nothing casts'. Each is now a piece of the ground itself in its own ink.
  S.own((r3) => {
    for (let i = 0; i < 10; i++) {
      const xc = -108 + i * 24, z0 = 5.6;
      r3(); r3();      // (the two draws the shadow shape took: everything laid after keeps its own)
      // (repair 2) nothing casts: where each pier's shadow shape lay across the forecourt its footing lies, a flag of slate
      // or umber stone cut square to the pier. (round 2) Every footing is the same square, 7 m by 9 m, no taper.
      const zf1 = z0 + 9;
      B.facet([xc - 3.5, groundY(0, z0) + 0.45, z0], [7, 0, 0], [0, groundY(0, zf1) - groundY(0, z0) + 0.1, zf1 - z0], { ink: i % 2 ? I.umber : I.slate, tone: 1, quiet: 0.25, lockInk: I.sage });
    }
    const st = (W.hero.anchors && W.hero.anchors.stairStreet) || [];
    for (let k = 1; k < st.length - 1; k++) {
      const c = [-st[k].x, st[k].y + 18 + 0.3, 260 - st[k].z], n = [-st[k + 1].x - c[0], 0, 260 - st[k + 1].z - c[2]], nl = Math.hypot(n[0], n[2]) || 1;
      const f = [n[0] / nl, 0, n[2] / nl], rt = [f[2], 0, -f[0]], dp = nl * 0.97;      // rt: toward the east side of the street
      r3();      // (the draw the shadow's reach took: everything laid after keeps its own)
      // (repair 2) nothing casts: no shadow of the west roofline lies on the steps. The broad steps are paved instead: on
      // each step a flag of stone, slate and umber by turns up the street, cut on the step's own joints (its riser's three
      // bays), each running from its own dark edge to its light edge against the bone and pearl beside it.
      // (round 2) The flags are a runner up the middle of the street, set by the step's number alone: the middle bay on
      // every step, and on every other step one bay more, to the west and to the east by turns. It leads up the centre
      // line to the tower; no roofline has any part in it.
      const s0 = (k % 4 === 1 ? 0 : 0.37) * 19.2, wk = (k % 4 === 1 ? 0.7 : k % 4 === 3 ? 0.63 : 0.33) * 19.2, fk = k % 2 ? I.slate : I.umber;
      B.facet(mad(mad(c, rt, -9.4 + s0), f, 0.05), mul(rt, wk), mul(f, dp), { ink: fk, tone: 1, lockInk: I.bone, taper: 0.8 + 0.2 * r3(), lod: 0.9 });
      // from the climb the street is mostly its risers: each is faced in its step's stone over the same bays
      const rise = st[k].y - st[k - 1].y;
      if (rise > 0.05) B.facet(mad(mad([c[0], c[1] - 0.3 - rise, c[2]], rt, -9.4 + s0), f, -0.24), mul(rt, wk), [0, rise, 0], { ink: fk, tone: S.tone([-f[0], 0, -f[2]]), lockInk: I.umber, lod: 0.9 });
    }
  });
  addBatch(W, B, 'ground');
  await ctx.yield();
  // the plan
  // (the plan fills the square: its roofs reach the rim on every side, so they run to the bottom edge of the frame
  //  from the moment we cross the corner; the four corners it cannot reach are small water plates in the sky's inks)
  // (polish 1: the plan is ONE COMPACT FIGURE, the town's own shape 125 m across, with calm water all round it)
  const PX = -145, PZ = -120, k = 0.32;      // (polish 3: the figure lies under the stoop and the run to the quay, its ring in the near water)      // (polish 2: the figure lies toward the entry, so the run to the arches crosses open water)
  const P = S.batch(1024);
  S.own((r2) => {
    const wi = [I.pearl, I.slate, I.slate, I.pearl, I.slate, I.slate, I.pearl, I.slate];
    for (let cx = 0; cx < 2; cx++) for (let cz = 0; cz < 2; cz++) for (let j = 0; j < 9; j += 2) {
      const sx = cx ? 1 : -1, sz = cz ? 1 : -1, a = (j + 0.5) / 9 * 1.5708, rr = 70 + 26 * r2();
      const c = [PX + sx * Math.min(sx < 0 ? 76 : 118, rr * 1.25 * Math.cos(a)), 0.3 + 0.03 * j, PZ + sz * Math.min(sz < 0 ? 58 : 80, rr * Math.sin(a))];
      const yaw = r2() * 3.14, w = 9 + 8 * r2(), d = 6 + 6 * r2();
      const U = [Math.cos(yaw) * w, 0, Math.sin(yaw) * w], V = [-Math.sin(yaw) * d, 0, Math.cos(yaw) * d];
      const O = mad(mad(c, U, -0.5), V, -0.5), hinge = { p: c, a: nrm(U), max: j % 2 ? 0.1 : -0.1, phase: r2() * 6.283, bias: 0 };
      P.facet(O, U, V, { ink: wi[(j + cx * 3 + cz * 5) % 8], tone: 1, taper: 0.6 + 0.6 * r2(), hinge, quiet: 0.5 });
    }
  });
  for (let i = 0; i < 22; i++) {                         // broad plates of ground between the houses: these stay at any distance
    const a = rng() * 6.283, r = rng.range(8, 52) * 0.9, w = rng.range(14, 34) * 0.8, d = w * rng.range(0.5, 0.8), yaw = rng() * 3.14;
    const U = [Math.cos(yaw) * w, 0, Math.sin(yaw) * w], V = [-Math.sin(yaw) * d, 0, Math.cos(yaw) * d];
    P.facet([PX + Math.sin(a) * r - (U[0] + V[0]) / 2, 0.04 + 0.012 * i, PZ + Math.cos(a) * r - (U[2] + V[2]) / 2], U, V,
      { ink: [I.bone, I.pearl, I.umber, I.bone, I.pearl, I.pearl][i % 6], tone: 1, taper: i % 3 ? 1 : 0.6, quiet: 0.25 });
  }
  const list = hero.houses || [];
  for (let i = 0; i < list.length; i++) {
    const h = list[i];
    if (Math.hypot(h.c[0], h.c[2]) > 186) continue;                                    // the forecourt rows are not on the hill
    const roof = i % 9 === 4 ? I.terracotta : [I.bone, I.slate, I.umber, I.pearl, I.bone, I.slate][(i * 7) % 6];
    const c = [PX - h.c[0] * k, 0.35 + 0.05 * (i % 7), PZ - h.c[2] * k], t = [-h.t[0], 0, -h.t[2]], o = [-h.o[0], 0, -h.o[2]];
    const w = h.w * k * 1.5, d = h.d * k * 1.5, O = mad(mad(c, t, -w / 2), o, -d / 2);
    const hinge = { p: c, a: t, max: 0.16 * (i % 2 ? 1 : -1), phase: (i * 2.399) % 6.283, bias: 0 };
    const nilP = h.moved ? 0 : 1;      // (repair 3) a house that stands on the street now has no roof in the plan (laid as nil planes: the same draws)
    P.facet(O, mul(t, w * nilP), mul(o, d * nilP), { ink: roof, tone: 1, lod: 0.62, hinge });
    // (repair 2) its stroke lies along the roof plate's own edge (it lay along the ridge, in the middle of the plate, and
    // read as a black stroke floating free on the water): a short accent that begins on the corner and stops short
    if (i % 5 === 0) P.stroke(mad(O, t, w * 0.04), mad(O, t, w * (h.moved ? 0.04 : 0.64)), { hinge, miss: 0.05, lod: 0.2, width: 0.14 });
    if (i % 300 === 299) await ctx.yield();
  }
  // the tower in plan, and the ring: the one curve
  const tw = 26 * k * 1.5, tO = [PX - tw / 2, 0.8, PZ - tw / 2];
  P.facet(tO, [tw, 0, 0], [0, 0, tw], { ink: I.bone, tone: 1 });
  P.outline(tO, [tw, 0, 0], [0, 0, tw], [0, 1, 2, 3], { width: 0.3, miss: 0.15, lod: 1 });
  const plan = addBatch(W, P, 'reservoir-plan');
  const seg = 64, pos = [], col = [], idx = [];
  for (const [r0, r1, cc] of [[3.7, 4.7, S.pal.terracotta], [5.0, 5.3, S.pal.black]]) {
    const base = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * 6.2832;
      for (const r of [r0, r1]) { pos.push(PX + Math.cos(a) * r, 0.86, PZ + Math.sin(a) * r); col.push(cc.r, cc.g, cc.b); }
      if (i < seg) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); rg.setIndex(idx);
  const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, toneMapped: false }));
  ring.name = 'ring-in-plan'; ring.frustumCulled = false; W.scene.add(ring);
  const cl = (v) => Math.max(-9, Math.min(9, v));
  W.updaters.push((dt, time, cam, u, eye) => {
    plan.position.set(cl((eye.x - PX) * 0.14), 0, cl((eye.z - PZ) * 0.14)); plan.updateMatrixWorld();
    ring.position.copy(plan.position); ring.updateMatrixWorld();
  });
  await ctx.yield();
}

// ---- the goods train: an engine and sixteen wagons, 150 m. Each wagon is three views that will not agree: side
//      planes that slide along one another, an end that swings round to be seen, a roof that lifts like a lid.
//      Built heading local -x: it comes on from screen left (+x) and its smoke trails behind it. ----
async function buildTrain(ctx, W) {
  const { S, I } = W, rng = W.rng.fork('train'), B = S.batch(512);
  const y0 = 31.9, zS = -1.5, zN = 1.5, south = [0, 0, -1];
  const AX = [1, 0, 0];
  const wheel = (x, r) => {
    for (const sg of [-1, 1]) {
      const O = [x - r, y0 - 0.15, zS - 0.12];
      B.facet(O, [2 * r, 0, 0], [0, sg * r * 0.87, 0], { ink: I.black, taper: 0.5, tone: 1, grad: 1, kind: S.SLIDE,
        hinge: { p: O, a: AX, max: sg * 0.3, phase: x * 0.7, bias: 0.4 }, sway: 0.12 * sg });
    }
  };
  const car = (x0, L, h, ink, ink2, roofInk, i) => {
    const ph = rng() * 6.283, sl = rng.range(0.8, 1.5) * (i % 2 ? 1 : -1), k = Math.min(1, L / 7.6);      // a shorter car's sides slide by its own length's share of a wagon's: no side stands off its car by more than a quarter of the car
    const mk = (m, sw) => ({ p: [x0, y0, zS], a: AX, max: m, phase: ph, bias: 0.35 });
    // the side: two planes sliding opposite ways (and shunting a little on their own)
    B.facet([x0, y0 + 0.5, zS], [L, 0, 0], [0, h * 0.52, 0], { ink, tone: S.tone(south), kind: S.SLIDE, hinge: mk(sl * k), sway: 0.35 * k });
    B.facet([x0, y0 + 0.5 + h * 0.5, zS - 0.04], [L, 0, 0], [0, h * 0.5, 0], { ink: ink2, tone: S.tone(south), kind: S.SLIDE, hinge: mk(-sl * 0.8 * k), sway: -0.3 * k });
    B.facet([x0, y0 + 0.5, zN], [L, 0, 0], [0, h, 0], { ink: ink2, tone: S.tone([0, 0, 1]) });
    // the end: swings out on the rear south corner to face us
    const he = { p: [x0 + L, y0, zS], a: hingeAxis(UP, [0, 0, 1], [1, 0, 0]), max: -1.25, phase: ph + 1, bias: 0.75 };
    B.facet([x0 + L, y0 + 0.5, zS], [0, 0, zN - zS], [0, h, 0], { ink: i % 3 ? I.umber : I.bone, tone: S.tone([-1, 0, 0]), hinge: he });
    B.stroke([x0 + L, y0 + 0.5, zN], [x0 + L, y0 + 0.5 + h, zN], { hinge: he, miss: 0.2, lod: 0.8 });
    // the roof: a lid hinged on the north edge, tipping its face south
    const hr = { p: [x0, y0 + 0.5 + h, zN], a: hingeAxis(AX, [0, 0, -1], UP), max: -0.95, phase: ph + 2, bias: 0.7 };
    B.facet([x0 - 0.2, y0 + 0.5 + h, zS - 0.2], [L + 0.4, 0, 0], [0, 0, zN - zS + 0.4], { ink: roofInk, tone: 1, hinge: hr });
    B.stroke([x0 + L * 0.5, y0 + 0.5 + h, zS - 0.2], [x0 + L + 0.2, y0 + 0.5 + h, zS - 0.2], { hinge: hr, miss: 0.25, lod: 1.2, width: 0.2 });
    B.stroke([x0 - 0.3, y0 + 0.45, zS - 0.06], [x0 + L * 0.42, y0 + 0.45, zS - 0.06], { miss: 0.25, lod: 1.6, width: 0.24 });
    B.stroke([x0 + L, y0 + 0.9, 0], [x0 + L + 1.3, y0 + 0.9, 0], { miss: 0.1, lod: 0.5 });          // the coupling
    wheel(x0 + L * 0.22, 0.8); wheel(x0 + L * 0.78, 0.8);
  };
  // the engine: boiler, cab, funnel, three wheels, and its smoke
  car(0.5, 5.6, 2.5, I.black, I.umber, I.slate, 1);
  car(6.2, 3.2, 3.5, I.slate, I.umber, I.bone, 2);
  wheel(3.4, 1.0);
  const fun = [1.6, y0 + 3.0, 0];
  B.facet([fun[0] - 0.5, fun[1], zS + 0.6], [1.0, 0, 0], [0, 1.9, 0], { ink: I.umber, tone: 0.8, taper: 1.5 });
  B.stroke([fun[0] - 0.8, fun[1] + 1.9, zS + 0.6], [fun[0] + 0.8, fun[1] + 1.9, zS + 0.6], { miss: 0.15, lod: 0.8 });
  const nSm = Math.round(16 * Math.max(0.6, W.detail)), c = [fun[0], fun[1] + 2.4, 0];
  for (let k = 0; k < nSm; k++) {
    const s = rng.range(1.6, 2.6) * 1.8;      // (a plume that shows from across the water)
    B.facet(mad(c, UP, -s * 0.5), [s, s * 0.5, 0], [-s, s * 0.5, 0], { ink: k % 3 === 1 ? I.bone : I.pearl, tone: 1, kind: S.RISE, quiet: 0.5,
      hinge: { p: c, a: k % 2 ? UP : [0, 0, 1], max: rng.range(20, 30) * 1.3, phase: k / nSm } });
  }
  // (polish 1: the wagons are the picture's dark on the pale deck, umber, slate and black under light lids: a train from across the water)
  const inks = [I.umber, I.slate, I.umber, I.black, I.slate, I.umber, I.slate, I.umber];
  for (let i = 0; i < 16; i++) {
    const a = rng.int(0, 7), tall = rng.range(2.3, 3.3);
    car(10.6 + i * 8.75, 7.6, tall, inks[a], inks[(a + 1 + rng.int(0, 2)) % 8], i % 4 === 1 ? I.bone : i % 4 === 3 ? I.slate : I.pearl, i + 3);
  }
  const mesh = addBatch(W, B, 'train');
  mesh.scale.set(1.5, 1.5, 1.5); mesh.position.y = 31.9 * (1 - 1.5); mesh.position.z = -2.2;      // (it runs on the south track, so its wheels show over the parapet from below)      // painted large, as trains are in this manner
  // (repair 2) the train keeps its schedule over the water and along the quay; from the swing onto the axis it runs at the
  // brief's own speed ('the train crossing at 9 m/s'), so its wagons are still crossing the middle arch as we pass under
  // ('the engine's planes sliding overhead'), and it goes on running until we are at the ring
  const trainS = (u) => { const a = 0.31, b = 0.39, k = 0.4; return u < a ? u : u < b ? u - (1 - k) * (u - a) * (u - a) / (2 * (b - a)) : (a + b) / 2 + k * (u - (a + b) / 2); };
  W.trainX = (u) => 192 - 890 * trainS(Math.min(0.96, u));      // (polish 3: its last wagon has just cleared the axis when we rise over the deck)      // (polish 2: the engine comes onto the viaduct as we reach the water, smokes across it while the arcade rakes past us, and its last wagons cross the middle arch as we go under)      // (it crosses while we come over the water and has gone when we stoop to the arch, so the tower stands clear over the deck)                                            // coming onto the viaduct from screen left (+x) as we arrive, the engine past the middle arch as we stoop under it
  W.updaters.push((dt, time, cam, u) => { mesh.position.x = W.trainX(u) + Math.sin(time * 0.35) * 1.5; mesh.updateMatrixWorld(); });
  await ctx.yield();
}

// ---- the birds: one model at three times life, painted large. Body in profile AND in plan, two wings of two planes
//      hinged at the wrist, a tail of three slats, one stroke for the beak. Bird space: forward -z, up +y. ----
function makeBird(S, I, kind, phase) {
  const B = S.batch(16);
  const K = kind === 'swift' ? { span: 1.35, chord: 0.24, sweep: 0.55, body: I.umber, wing: I.black, tip: I.black, plan: I.slate }
    : kind === 'gull' ? { span: 1.4, chord: 0.36, sweep: 0.18, body: I.bone, wing: I.pearl, tip: I.slate, plan: I.bone }      // (slate tips: in black they were loose dashes in the sky)
    : { span: 1.1, chord: 0.46, sweep: 0.12, body: I.bone, wing: I.slate, tip: I.slate, plan: I.pearl };
  const fw = [0, 0, -1];
  B.facet([0, 0, 0.55], [0, 0.24, -0.62], [0, -0.24, -0.62], { ink: K.body, tone: 1, hinge: { p: [0, 0, 0], a: fw, max: 0.5, phase, bias: 0 } });      // profile
  B.facet([0, 0.03, 0.5], [0.2, 0, -0.56], [-0.2, 0, -0.56], { ink: K.plan, tone: 0.8 });                                                          // plan
  B.facet([0, 0.06, -0.52], [0.13, 0.03, -0.2], [-0.13, 0.03, -0.2], { ink: K.body, tone: 1, grad: 1.57 });                                         // the head
  B.stroke([0, 0.1, -0.9], [0, 0.03, -1.12], { width: 0.055, miss: 0.03, lod: 0.3 });                                                              // the beak
  for (const sg of [-1, 1]) {
    const sh = [sg * 0.1, 0.07, -0.3], half = K.span * 0.46, wr = [sg * (0.1 + half), 0.07, -0.3 + half * K.sweep * 0.4];
    const flap = { p: sh, a: [0, 0, -sg], max: 0.3, phase, bias: 0.2 };
    B.facet([sh[0], sh[1], sh[2] - K.chord * 0.4], [wr[0] - sh[0], 0, wr[2] - sh[2]], [0, 0, K.chord], { ink: K.wing, tone: sg > 0 ? 1 : 0.8, hinge: flap, sway: -0.5 });
    const out = [sg * K.span * 0.54, 0, K.span * 0.54 * K.sweep * 1.6];
    const child = { p: wr, a: [0, 0, -sg], max: 1.0, phase: phase + 1.2 };
    B.facet([wr[0], wr[1], wr[2] - K.chord * 0.4], [0, 0, K.chord], out, { ink: K.tip, tone: sg > 0 ? 0.8 : 0.6, taper: 0.3, hinge: flap, child, sway: -0.5 });
  }
  for (let k = -1; k <= 1; k++) {
    const a = k * 0.36, d = [Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5], s = [Math.cos(a) * 0.075, 0, -Math.sin(a) * 0.075];
    B.facet([-s[0], 0.02 + 0.01 * k, 0.48 - s[2]], mul(s, 2), d, { ink: k ? K.wing : K.plan, tone: 0.8, hinge: { p: [0, 0.02, 0.48], a: UP, max: 0.45 * k, phase, bias: 0.3 } });
  }
  return B.mesh();
}

async function buildFlock(ctx, W) {
  const { S, I, path, scene } = W, rng = W.rng.fork('flock');
  const N = 40, protos = [];
  for (let v = 0; v < 4; v++) protos.push(makeBird(S, I, W.birdKind, 0.9 + v * 1.7));
  // OUR OWN BIRD (polish 1): the same model as the flock, whole, small and low in the frame, five metres ahead of the
  // eye. The first design drew it from the shoulders, its wings entering from both lower corners: in stills that read
  // as blades lying across the lens. Now it is a bird we follow: it drifts from side to side, banks into its drift,
  // rises and sinks, and drops under the frame's edge through the lock and on the last straight into the ring.
  const ours = new THREE.Mesh(protos[1].geometry, S.material); ours.name = 'our-bird'; ours.frustumCulled = false; ours.matrixAutoUpdate = false; ours.visible = false; scene.add(ours);
  for (const p of protos) W.disposables.push(p.geometry);
  W.birdProtos = protos;
  const birds = [];
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(protos[i % 4].geometry, S.material); m.frustumCulled = false; m.matrixAutoUpdate = false; m.name = 'bird';
    scene.add(m);
    const g = i < 6 ? 0 : i < 18 ? 1 : 2;                 // wingtip company, the ones ahead in frame, the wider wheel
    const b = { m, g, ahead: g === 0 ? rng.range(6, 14) : g === 1 ? rng.range(12, 34) : rng.range(24, 120),
      ox: g === 0 ? (i % 2 ? 1 : -1) * rng.range(4.2, 7.5) : 0, oy: g === 0 ? rng.range(-1.2, 1.6) : g === 1 ? rng.range(-1, 4) : rng.range(2, 22),
      ax: g === 0 ? 0.8 : g === 1 ? rng.range(2, 9) : rng.range(8, 34), ay: g === 0 ? 0.5 : g === 1 ? rng.range(1, 3) : rng.range(2, 7),
      w1: rng.range(0.25, 0.6), w2: rng.range(0.3, 0.75), p1: rng() * 6.283, p2: rng() * 6.283, dip: rng() < 0.6 ? 1 : 0.3, cross: null };
    // (polish 1: the black crosses the flock laid on the water read as loose dashes; the birds themselves cross it)
    birds.push(b);
  }
  const P = new THREE.Vector3(), T = new THREE.Vector3(), R = new THREE.Vector3(), Fw = new THREE.Vector3(), Up = new THREE.Vector3(), X = new THREE.Vector3();
  const M = new THREE.Matrix4(), OFF = new THREE.Matrix4(), end = path.pointAt(1, new THREE.Vector3()), endT = path.tangentAt(1, new THREE.Vector3());
  const nu = W.nu, squeeze = (v) => lerp(lerp(lerp(1, 0.3, sstep(nu(0.55), nu(0.6), v)), 0.6, sstep(nu(0.67), nu(0.72), v)), 0.2, sstep(nu(0.88), nu(0.95), v));
  const overDeck = (z) => sstep(-70, -40, z) * (1 - sstep(6, 50, z));
  W.updaters.push((dt, time, cam, u, eye) => {
    for (const b of birds) {
      const v = u + b.ahead / path.length;
      if (v <= 1) { path.pointAt(v, P); path.tangentAt(v, T); } else { T.copy(endT); P.copy(end).addScaledVector(endT, (v - 1) * path.length); }
      R.set(-T.z, 0, T.x); if (R.lengthSq() < 1e-6) R.set(1, 0, 0); R.normalize();
      const q = squeeze(v), a1 = time * b.w1 + b.p1, a2 = time * b.w2 + b.p2;
      const lx = b.ox + b.ax * q * Math.sin(a1), vx = b.ax * q * b.w1 * Math.cos(a1);
      let ly = b.oy * (b.g === 2 ? 0.3 + 0.7 * q : 1) + b.ay * q * Math.sin(a2); const vy = b.ay * q * b.w2 * Math.cos(a2);
      P.addScaledVector(R, lx); P.y += ly;
      const over = sstep(0.1, 0.16, v) * (1 - sstep(0.33, 0.39, v));
      if (b.g > 0 && over > 0) P.y = lerp(P.y, 1.3 + 1.2 * (1 + Math.sin(a2 * 1.3)) * b.g, over * b.dip);      // they drop to the water
      // (repair 3) the wider wheel goes OVER the viaduct and its train while we and the nearer birds stoop under the arch:
      // from the lock the sky over the deck keeps its birds (brief: 'six to ten always ahead within the middle half of frame').
      // A rule in the world's own metres (the viaduct stands at z 0, its train's roofs at 37.6 m), not in the flight's time.
      // They also open to either side of the axis there, so that they stand in the sky beside the hill and not on its houses;
      // and only once we ourselves are near the viaduct (our own z), so the wheel over the reservoir flies as it did.
      // (repair 3, round 2) the wingtip company stoops WITH us, not ahead of us: from the lock's end until we are low before
      // the arch (our own z -52 to -17, the world's metres) the six fly at our own height beside the frame's middle, in
      // front of the deck's face and the piers, instead of 3 to 6 m under the frame along the dive ahead (brief: 'They fly
      // loosely round us for the whole journey, the nearest 4 m off our wingtip'). They are back on the course's own
      // height before they come to the arch, and go under it as they did.
      // (repair 4) the lift begins when the furthest of the six (14 m ahead of us) comes to where the course stoops (z -52 to -46),
      // not when the eye does: none dips under the frame and comes back on the way in
      // (repair 5) a held bird flies no lower under the eye than a sixth of its own distance ahead (0.17 m for each metre): a near, low
      // one stayed under the picture for the whole hold on about a quarter of the seeds
      if (b.g === 0) {
        const hold = sstep(-66, -60, eye.z) * (1 - sstep(-27, -17, eye.z));
        if (hold > 0) P.y = lerp(P.y, Math.max(P.y, eye.y - Math.min(1.2 - ly, 0.17 * b.ahead)), hold);
      }
      let fv = 0;
      if (b.g === 2) {
        const near = sstep(-100, -66, eye.z), k = overDeck(P.z) * near;
        if (k > 0) {
          const fan = (b.p1 > 3.1416 ? 1 : -1) * (10 + 0.35 * b.ax), up = (42 - (P.y - ly)) * k;
          fv = 19 * fan * near * (overDeck(P.z + 0.5) - overDeck(P.z - 0.5)) * T.z;
          P.addScaledVector(R, fan * k);
          if (up > 0) { P.y += up; T.y *= 1 - k; }
        }
      }
      Fw.copy(T).multiplyScalar(19).addScaledVector(R, vx + fv); Fw.y += vy; Fw.normalize();
      X.set(-Fw.z, 0, Fw.x).normalize(); Up.crossVectors(Fw, X).negate();
      const roll = -0.09 * b.ax * q * b.w1 * b.w1 * Math.sin(a1) * 4;                                         // bank into the wheel
      X.multiplyScalar(Math.cos(roll)).addScaledVector(Up, Math.sin(roll)); Up.crossVectors(X, Fw).negate().normalize(); Up.crossVectors(Fw, X).negate();
      Fw.negate(); M.makeBasis(X, Up.crossVectors(Fw, X), Fw); M.setPosition(P);
      b.m.matrix.copy(M); b.m.matrixWorld.copy(M);
      if (b.cross) {
        const on = over > 0.5 && inReservoir(P.x, P.z, -1.5);
        b.cross.visible = on;
        if (on) { b.cross.position.set(P.x, 1.0, P.z); b.cross.rotation.y = Math.atan2(-Fw.x, -Fw.z) + Math.PI; }
      }
    }
    // our own bird: placed from the camera's world matrix every frame (never parented)
    // (round 2) it is at its flying height from the first moment of the flight (it rose into frame over the first fiftieth, a ramp that ended on a sampled position)
    const gone = Math.max(sstep(W.U_LOCK0 - 0.05, W.U_LOCK0 - 0.01, u) * (1 - sstep(W.U_LOCK1 + 0.02, W.U_LOCK1 + 0.06, u)), sstep(nu(0.9), nu(0.94), u));
    ours.visible = u > 0 && gone < 0.995;
    const dx = 1.05 * Math.sin(time * 0.29 + 0.6) + 0.4 * Math.sin(time * 0.71), vx = 1.05 * 0.29 * Math.cos(time * 0.29 + 0.6) + 0.4 * 0.71 * Math.cos(time * 0.71);
    OFF.makeRotationZ(-0.7 * vx).scale(X.set(0.6, 0.6, 0.6)).setPosition(dx, -1.95 + 0.2 * Math.sin(time * 0.83) - 1.6 * gone, -5.6);
    ours.matrix.multiplyMatrices(cam.matrixWorld, OFF); ours.matrixWorld.copy(ours.matrix);
  });
  await ctx.yield();
}

// ---- the seeded cast: low cloud lying among the roofs as free bone planes; the tower as a windmill (four splayed
//      sails turning above the belfry) or a dovecote (pigeonholes, and its own birds wheeling round the top) ----
async function buildCast(ctx, W) {
  const { S, I, path, scene } = W, rng = W.rng.fork('cast');
  if (W.weather === 'cloud') {
    const B = S.batch(64);
    for (let i = 0, n = 0; i < 400 && n < 40; i++) {
      const a = rng() * 6.283, r = rng.range(30, 190), x = Math.sin(a) * r, z = 260 + Math.cos(a) * r;
      const y = 18 + Math.max(0, (170 - r) * 0.627) + rng.range(13, 24), w = rng.range(22, 44), d = rng.range(7, 13);
      if (path.distanceTo(x, y, z) < 26 + w * 0.5) continue;
      const yaw = rng.range(-0.5, 0.5), U = [Math.cos(yaw) * w, rng.range(-1.5, 1.5), Math.sin(yaw) * w], V = [-Math.sin(yaw) * d, rng.range(-1, 2.5), Math.cos(yaw) * d];
      const O = [x - U[0] / 2, y, z - U[2] / 2];
      B.facet(O, U, V, { ink: n % 5 === 4 ? I.pearl : I.bone, tone: 1, taper: rng.range(0.5, 1), hinge: { p: O, a: nrm(U), max: 0.3, phase: rng() * 6.283, bias: 0 }, sway: 0.03 });
      if (n % 3 === 0) B.stroke(O, add(O, U), { miss: 0.6, lod: 0.9 });
      n++;
    }
    const m = addBatch(W, B, 'low-cloud');
    W.updaters.push((dt, time) => { m.position.set(Math.sin(time * 0.07) * 9, Math.sin(time * 0.11) * 1.2, 0); m.updateMatrixWorld(); });
  }
  await ctx.yield();
  if (W.towerKind === 'windmill') {
    const B = S.batch(32), L = 15;
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.3, d = [Math.cos(a), Math.sin(a), 0], s = [-Math.sin(a), Math.cos(a), 0];
      const O = mad(mul(d, 3), s, -0.4), hinge = { p: O, a: d, max: 0.4, phase: k * 1.6, bias: 0.55 };      // each sail splayed about its own spar
      B.facet(O, mul(d, L - 3), mul(s, 4.6), { ink: k % 2 ? I.bone : I.slate, tone: k % 2 ? 1 : 0.8, hinge });
      B.facet(mad(O, s, 4.7), mul(d, L - 3), mul(s, 1.5), { ink: k % 2 ? I.umber : I.bone, tone: 0.6, hinge });
      B.stroke([0, 0, 0], mul(d, L), { width: 0.34, miss: 0.3, lod: 2 });
      B.stroke(mad(O, s, 4.6), mad(mad(O, s, 4.6), d, L - 3), { hinge, width: 0.2, miss: 0.5, lod: 1 });
    }
    B.facet([-1.6, 0, 0.3], [1.6, 1.6, 0], [1.6, -1.6, 0], { ink: I.umber, tone: 0.8 });                    // the hub, a lozenge
    const m = addBatch(W, B, 'windmill-sails');
    m.position.set(0, 205, 258);
    m.rotation.x = -0.5;      // (polish 2: tipped to face the climb, so from below the sails are sails, not edges)
    W.updaters.push((dt, time) => { m.rotation.z = time * 0.22; m.updateMatrixWorld(); });
    const P = S.batch(8);                                                                                    // the post that carries them
    P.facet([-1.2, 176, 259.5], [2.4, 0, 0], [0, 30, 0], { ink: I.umber, tone: 0.8, taper: 0.5 });
    P.stroke([-1.2, 176, 259.4], [-0.6, 206, 259.4], { width: 0.26, miss: 0.3, lod: 2 });
    addBatch(W, P, 'windmill-post');
  }
  if (W.towerKind === 'dovecote') {
    const B = S.batch(128);
    for (const [nx, nz] of [[0, -1], [1, 0], [-1, 0]]) for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      const tx = -nz, tz = nx, o = -6.6 + c * 4.4 + (r % 2) * 1.2;
      const p = [nx * 10.2 + tx * o, 116 + r * 3.6, 260 + nz * 10.2 + tz * o];
      B.facet(p, [tx * 1.5, 0, tz * 1.5], [0, 1.9, 0], { ink: I.black, tone: 1, grad: 1.2, lod: 1.5 });
      B.facet(mad(p, [nx, 0, nz], 0.05), [tx * 1.9, 0, tz * 1.9], [nx * 0.9, -0.25, nz * 0.9], { ink: I.bone, tone: 1, lod: 1.5,
        hinge: { p, a: [tx, 0, tz], max: 0.5, phase: r + c, bias: 0.3 } });                                  // the landing shelf
    }
    addBatch(W, B, 'dovecote-holes');
    const doves = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(W.birdProtos[i % 4].geometry, S.material); m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m);
      doves.push({ m, r: rng.range(26, 44), y: rng.range(166, 196), w: rng.range(0.28, 0.45) * (i % 5 === 4 ? -1 : 1), p: rng() * 6.283, b: rng.range(1, 4) });
    }
    const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4();
    W.updaters.push((dt, time) => {
      for (const d of doves) {
        const a = time * d.w + d.p, sg = Math.sign(d.w);
        Z.set(-Math.cos(a) * sg, 0, Math.sin(a) * sg);                    // back of the bird: against its travel round the tower
        X.set(-Z.z, 0, Z.x); Y.set(0, 1, 0);
        X.addScaledVector(Y, -0.35 * sg).normalize(); Y.crossVectors(Z, X);
        M.makeBasis(X, Y, Z); M.setPosition(Math.sin(a) * d.r, d.y + Math.sin(a * 1.7 + d.p) * d.b, 260 + Math.cos(a) * d.r);
        d.m.matrix.copy(M); d.m.matrixWorld.copy(M);
      }
    });
  }
}

// ---- (repair 2) THE TOWER-HOUSES BESIDE THE RING. Brief: 'a crown at y 112, with taller tower-houses packed round the top';
//      'over the tower-houses 10 m below'. Two stand to either side of the bell tower, behind the plane its clock screen
//      opens in, each a pile of three cubes under a steep lid, their tops ten metres under the last straight: house
//      fronts with shuttered windows beside the tower on the last climb, roofs in the lower corners into the ring.
//      Laid from the second stream after everything else, in their own batch: nothing that stood before is moved. ----
async function buildTowerHouses(ctx, W) {
  const { S, I } = W, B = S.batch(256);
  S.aside((r2) => {
    const R = () => r2(); R.range = (a, b) => a + (b - a) * r2(); R.pick = (arr) => arr[Math.floor(r2() * arr.length) % arr.length];
    const o = [0, 0, -1], t = [1, 0, 0];
    for (const sg of [-1, 1]) for (let j = 0; j < 2; j++) {
      const [tx, tz] = j ? [31.5, 256.5] : [25, 267], warm = sg > 0, hs = j ? [11, 9, 6] : [12, 10, 7], ws = j ? [7.4, 6.2, 4.8] : [7.8, 6.6, 5.2];
      let y = 111.6;
      for (let e = 0; e < 3; e++) {
        const top = e === 2, ink = warm ? [I.bone, I.pearl, I.bone][e] : [I.slate, I.bone, I.pearl][e], roof = top ? (j === 0 ? I.slate : warm ? I.umber : I.pearl) : I.umber;
        addHouse(S, B, R, S.tone, [sg * tx + (e ? 0.5 * (r2() - 0.5) : 0), y, tz], o, t, ws[e], ws[e] * 0.92, hs[e], {
          ink, roofInk: roof, toStreet: j ? null : o, strokes: 1, calm: j === 0, dress: true, sun: [-0.95, 0, 0.3], rh: top ? 4 - j : 0.5 });      // (round 2) only the two piles within 30 m of the axis are calm (the agreed amendment); the outer two open as written, 20 to 75 degrees
        y += hs[e];
      }
    }
  });
  addBatch(W, B, 'tower-houses');
  await ctx.yield();
}

// ---- (repair 3) LAID LAST, from the second stream, in one batch of its own: nothing that stood before is moved.
//      The stonework of the viaduct's south face, and the street beyond the arch. ----
async function buildLate(ctx, W) {
  const B = W.S.batch(1024);
  buildStonework(W, B);
  await ctx.yield();
  buildStreet(W, B);
  await ctx.yield();
  addBatch(W, B, 'late');
  await ctx.yield();
}

// THE STONEWORK. Brief: 'The viaduct: bone and umber planes, each pier showing front and flank at once, each arch five
// straight chords'; 'A plane is never one tone ... and the next plane runs the other way'; 'A line is a short straight
// black stroke'. From the swing onto the axis on (inside 90 m; 'far things are fewer, bigger, plainer planes') the deck's
// face, the piers and the vaults are not blank slabs: the face is coursed stones in its two pale inks with a panelled
// parapet and an umber pilaster over every pier, each pier has its plinth and coursed stones on front and flank, each
// arch its ring of five voussoirs and its vault of ruled stones. Every stone rides the hinge of the plane it lies on,
// so nothing new moves by itself; the joints are short strokes on the stones' own edges that miss one another.
function buildStonework(W, B) {
  const { S, I } = W, VD = W.vd, tS = S.tone([0, 0, -1]), LOD = 0.27, SL = 0.34;
  S.aside((r2) => {
    const joint = (A, Bp, hinge, k) => B.stroke(A, Bp, { hinge, lod: SL, width: 0.17, off: [k % 2 ? 0.05 : -0.04, k % 3 ? 0.04 : -0.05, 0], grad: 1, dab: 1 });
    for (let i = 0; i < 9; i++) {
      const D = VD.deck[i]; if (!D) continue;
      const { hinge, xa, xb, z } = D, w = xb - xa, lo = i % 2 ? I.bone : I.pearl, hi = i % 2 ? I.pearl : I.bone, zf = z - 0.03, sh = 0.015 * (i % 3);
      const stone = (f0, f1, ya, yb, ink, dz = 0) => B.facet([xa + w * f0, ya, zf - dz], [w * (f1 - f0), 0, 0], [0, yb - ya, 0], { ink, tone: tS, hinge, lod: LOD, taper: 0.97 + 0.05 * r2() });
      // the lower course: two rows of long stones in the other pale ink, laid broken-bond, and here and there an umber one
      const rows = [[24.78, 26.4, [[0.03, 0.25], [0.52, 0.75]]], [26.46, 27.82, [[0.27, 0.5], [0.77, 0.985]]]];
      rows.forEach(([ya, yb, fs], r) => fs.forEach(([f0, f1], k) => {
        stone(f0 + sh, f1 + sh, ya, yb, hi);
        const fe = k ? f0 + sh : f1 + sh;
        joint([xa + w * fe, ya + 0.1, zf - 0.04], [xa + w * fe, yb - 0.15, zf - 0.04], hinge, i + r + k);
      }));
      if (i % 3 === 0) stone(0.36, 0.45, 24.78, 26.4, I.umber); else if (i % 3 === 1) stone(0.6, 0.7, 26.46, 27.82, I.umber);
      joint([xa + w * 0.05, 26.43, zf - 0.04], [xa + w * 0.21, 26.43, zf - 0.04], hinge, i);
      joint([xa + w * 0.55, 26.43, zf - 0.04], [xa + w * 0.7, 26.43, zf - 0.04], hinge, i + 1);
      // the parapet: three panels in the course's own ink
      for (let k = 0; k < 3; k++) {
        const f0 = 0.075 + k * 0.315 + sh, f1 = f0 + 0.225;
        stone(f0, f1, 28.8, 30.45, lo);
        if (k !== 1) joint([xa + w * (k ? f0 : f1), 28.9, zf - 0.04], [xa + w * (k ? f0 : f1), 30.4, zf - 0.04], hinge, i + k);
        else joint([xa + w * (f0 + 0.03), 28.8, zf - 0.04], [xa + w * (f1 - 0.05), 28.8, zf - 0.04], hinge, i);
      }
      // an umber pilaster over the pier at the bay's west end (and one at the east end of the last bay)
      stone(0, 2.4 / w, 24.7, 31.55, I.umber, 0.07);
      if (i === 8) stone(1 - 2.4 / w, 1, 24.7, 31.55, I.umber, 0.07);
    }
    // the piers: a plinth and three coursed stones on each half front, a footing course and two quoins on each flank
    for (let i = 0; i < 10; i++) {
      (VD.front[i] || []).forEach((F, e) => {
        const { hinge, xa, xb, ink } = F, U = [xb - xa, 0, 0], alt = ink === I.bone ? I.pearl : I.bone, zf = -5.03;
        B.facet([xa, 1.6, zf - 0.03], U, [0, 2.0, 0], { ink: I.umber, tone: tS, hinge, lod: LOD, taper: 1.04 });
        for (const [ya, yb] of e ? [[9.6, 12.8]] : [[5.2, 8.4], [18.6, 21.8]]) {
          B.facet([xa, ya, zf], mul(U, 0.9), [0, yb - ya, 0], { ink: alt, tone: tS, hinge, lod: LOD, taper: 0.96 + 0.06 * r2() });
          joint([xa + U[0] * 0.08, yb, zf - 0.03], [xa + U[0] * 0.72, yb, zf - 0.03], hinge, i + e);
        }
      });
      for (const sg of [-1, 1]) {
        const K = VD.flank[i] && VD.flank[i][sg]; if (!K) continue;
        const { hinge, xf, n } = K, x = xf + n[0] * 0.03;
        B.facet([x, 1.6, -5], [0, 0, 10], [0, 1.9, 0], { ink: I.bone, tone: S.tone(n), hinge, lod: LOD });
        B.facet([x, 5.4, -5], [0, 0, 3.3], [0, 2.8, 0], { ink: I.pearl, tone: S.tone(n), hinge, lod: LOD, taper: 0.95 });
        B.facet([x, 9.8, 1.6], [0, 0, 3.4], [0, 2.8, 0], { ink: I.bone, tone: S.tone(n), hinge, lod: LOD, taper: 0.95 });
        joint([x + n[0] * 0.03, 8.2, -4.8], [x + n[0] * 0.03, 8.2, -2.2], hinge, i);
        joint([x + n[0] * 0.03, 12.6, 2.1], [x + n[0] * 0.03, 12.6, 4.7], hinge, i + 1);
      }
    }
    // the arches: a ring of five voussoirs on the south face, and under each vault its ruled stones
    for (let i = 0; i < 9; i++) {
      const ax = -108 + i * 24 + 12;
      for (let j = 0; j < 5; j++) {
        const a0 = Math.PI - j * Math.PI / 5, a1 = Math.PI - (j + 1) * Math.PI / 5;
        const p0 = [ax + 9 * Math.cos(a0), 16 + 9 * Math.sin(a0)], p1 = [ax + 9 * Math.cos(a1), 16 + 9 * Math.sin(a1)];
        const U = [p1[0] - p0[0], p1[1] - p0[1], 0], nn = nrm([-(p1[1] - p0[1]), p1[0] - p0[0], 0]);
        const Sp = VD.span[i] && VD.span[i][j];
        if (Sp) {
          const vk = j % 2 ? (Sp.ink === I.bone ? I.pearl : I.bone) : I.umber;
          B.facet([p0[0], p0[1], -5.04], U, mul(nn, 1.3), { ink: vk, tone: tS, hinge: Sp.hinge, lod: LOD, taper: 1.12 });
          if (j) joint([p0[0], p0[1], -5.08], [p0[0] + nn[0] * 1.2, p0[1] + nn[1] * 1.2, -5.08], Sp.hinge, i + j);
        }
        const tV = S.tone(mul(nn, -1)) * 0.85, q = [p0[0] - nn[0] * 0.04, p0[1] - nn[1] * 0.04];
        const z0 = j % 2 ? 1.6 : -4.9;
        B.facet([q[0], q[1], z0], U, [0, 0, 3.3], { ink: j % 2 ? I.pearl : I.bone, tone: tV, lod: LOD, taper: 0.95 + 0.06 * r2() });
        if (j) B.stroke([q[0], q[1], j % 2 ? 1.0 : -4.8], [q[0], q[1], j % 2 ? 4.6 : -1.2], { lod: SL, width: 0.18, miss: 0.06 });
      }
    }
  });
}

// THE STREET BEYOND THE ARCH. Brief (journey, 26 to 32 s): 'off the axis to the right and up the stair street, walls 8 m
// either side swinging away from us, shutters fanning, washing 6 m overhead, the tower stays ahead and above'; 'The
// town: 900 cube houses 6 to 8 m, each four walls and a roof on hinges, with windows whose paired shutters are literal
// shutters'. Between the arch and the hill's foot the road ran over bare lawn. It is a street now: houses stand with
// their fronts 8 m either side of the road's centre line from 20 m beyond the arch to the hill's foot, and a few more
// in a second row behind them. They are not new houses: the hill gives up as many from the far side of its lowest
// tier, which the flight never sees (hero.moved), so the town has the houses it had. Each stands clear of the trees and
// houses already on the forecourt, of the flight's corridor and of the sight cone to the ring.
function buildStreet(W, B) {
  const { S, I } = W, N = W.hero.moved | 0, F = W.fore;
  if (!N) return;
  S.aside((r2) => {
    const R = () => r2(); R.range = (a, b) => a + (b - a) * r2(); R.pick = (arr) => arr[Math.floor(r2() * arr.length) % arr.length];
    const roadX = (z) => (z < 20 ? 0 : 32 * (z - 20) / 62), tl = Math.hypot(32, 62);
    const cand = [];      // [z along the road, side, how far the front stands from the road's centre line], in the order they are tried
    for (const z of [23, 32, 41, 50]) for (const sg of [-1, 1]) cand.push([z, sg, sg < 0 ? 12 : 8]);      // (on the west the avenue's cypresses line the road: the fronts stand behind them)
    for (const z of [27.5, 45.5, 36.5, 20.5]) for (const sg of [-1, 1]) cand.push([z, sg, sg < 0 ? 23.5 : 19.5]);
    // the west verge under the flight, between the kerb and the cypresses: low houses under low roofs (six metres to the
    // ridge, the brief's smallest), one between two trees, 7 m and more under the wings as the hill's own are; and one
    // more of the second row at the hill's foot
    cand.push([50, -1, 6, 1], [59, -1, 9.5, 1], [65, -1, 23.5], [41, -1, 6, 1]);
    const walls = { '-1': [I.slate, I.umber, I.pearl, I.slate, I.bone, I.umber, I.slate], 1: [I.bone, I.pearl, I.bone, I.bone, I.umber, I.bone, I.pearl] };
    const lids = { '-1': [I.slate, I.umber, I.slate, I.terracotta, I.umber, I.slate, I.umber], 1: [I.terracotta, I.umber, I.slate, I.umber, I.terracotta, I.umber, I.slate] };
    const cnt = { '-1': 0, 1: 0 };
    let n = 0;
    for (const [z0, sg, off, low] of cand) {
      if (n >= N) break;
      const w = R.range(6.6, 8), d = R.range(6.2, 7.4), h0 = R.range(6.4, 9), rh0 = R.range(1.2, 2);
      for (const dz of [0, 1.7, -1.7, 3.4, -3.4, 5, -5]) {
        const z = z0 + dz, t = z >= 20 ? [32 / tl, 0, 62 / tl] : [0, 0, 1], nR = [t[2], 0, -t[0]];
        const x = roadX(z) + sg * nR[0] * (off + d / 2), zz = z + sg * nR[2] * (off + d / 2), rad = Math.max(w, d) / 2;
        if (zz - rad < 15.2) continue;                                                              // clear of the piers and their footings
        if (F.trees.some((q) => Math.hypot(q[0] - x, q[1] - zz) < rad + 1.5)) continue;
        if (F.houses.some((q) => Math.hypot(q[0] - x, q[1] - zz) < 8.8)) continue;
        const gy = groundY(x, zz) - 0.5, pn = W.path.nearestXZ(x, zz), k = cnt[sg] % 7, lid = lids[sg][k];
        let h = h0; const rh = low ? Math.min(rh0, 1) : rh0 * (lid === I.terracotta ? 1.8 : 1);
        if (low) h = Math.min(h, 5.4);
        if (pn.dist < 10.2) h = Math.min(h, pn.y - gy - rh - (low ? 7 : 7.5));                                  // the corridor: nothing within 7 m under the wings
        if (W.sight) h = Math.min(h, W.sight.ceil([-x, gy - 18, 260 - zz], 6.5) + 18 - gy - rh - 1);
        if (h < 4.6) continue;
        const o = [-sg * nR[0], 0, -sg * nR[2]], tt = [o[2], 0, -o[0]];
        addHouse(S, B, R, S.tone, [x, gy, zz], o, tt, w, d, h, { ink: walls[sg][k], roofInk: lid, toStreet: o, strokes: 1, calm: pn.dist < 30, dress: true, sun: [-0.95, 0, 0.3], rh });
        F.houses.push([x, zz]); cnt[sg]++; n++;
        break;
      }
    }
    W.streetCount = n;
  });
}
