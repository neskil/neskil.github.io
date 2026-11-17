// water-clock-city: WHERE WATER KEEPS THE HOUR, after Ismail al-Jazari (the Book of Knowledge of Ingenious
// Mechanical Devices, 1206). A buff manuscript page the size of a city on which five water machines, drawn
// flat and cut open, truly work: peacock basin, the elephant clock (the hero, src/parts/water-clock-city.js),
// the flute tower, the scoop wheel and the castle clock whose gold door is the way out.
// Everything is drawn by the hero's one style material (PlateBuilder: flat fill, edge wall and reed line in
// one geometry), unlit, under post.flat so each pigment is the hex written. No sky, no light, no shadow.
// DRAWING FRAME: the machines are authored in "page" coordinates and the mesh is turned half round like the
// hero, so page X is screen-right (starboard) seen from the entry, Y is up, and page Z = -world z (a plate's
// front face is the one toward the entry). world (x, y, z) = page (-X, Y, -Z).
// THE CHAIN is keyed to the chain's clock c = cu(u) only (wccChain: c is tied to places on the route, so the route can
// change and every event still happens where the viewer is; see EV below and the hero's anchors.events); ambient loops
// (scallop rows, pours, wheels, columns, floats) run on time. The camera never rolls (bank 0, sway 0): the page is upright.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makeStyle, PlateBuilder, makeBalls, makePaperDome, overshoot, PALETTE, NPARTS,
  rectPts, arcPts, circlePts, curvePts, movePts, bandPts } from '../parts/water-clock-city.js';

const TAU = Math.PI * 2, _v = new THREE.Vector3(), _w = new THREE.Vector3(), _lv = new THREE.Vector3(), _lc = new THREE.Vector3();
const HZ = 520;                                   // the elephant stands across the course at world z 520
const TX = -11.4;                                 // world x of the trough's centre line (under serpent 2's tipped jaws)
const TZ0 = 554, TY0 = 98.1, TZ1 = 1074, TY1 = 74; // trough head and foot (it comes in high on the castle's face, above the hour band, so the arrival sees the whole dial under it)
export const troughY = (z) => TY0 + (TY1 - TY0) * clamp((z - TZ0) / (TZ1 - TZ0), 0, 1);
const DOOR = { x: 0, y: 10, z: 1080, w: 14, h: 16 };

// the route (world space): in at the elephant whole on the page under the first gateway, past the peacock, up to howdah
// height for the leaf whole (square-on, 200 m), down to the window in the flank from 117 m (the whole flank in the frame), up
// to the tower's front (falcon, ball, serpent), over the rump behind the tower, a turn in toward the trough with the tower's
// open back to port (serpent 2 tipped, the ball let go), then low down the starboard side square at the scoop wheel, up and
// across above the trough to 20 m over its port rim, through the last gateway, off to port over the castle's lake (the
// trough seen from the side, as ruled water on posts) and in on the castle's axis: the clock's whole face square-on from
// 77 m, then the dive into the door. The painted faces are only ever seen within about 30 degrees of square-on.
// UNDER-DRAWING: the crowd of other devices, the court and (less) the far machines are laid in paler colour and line with
// distance from the eye (the style's uFade, one material each); the elephant never fades.
// THE PAGE TIPS UP (uBend in the style's vertex shader): there is no sky; what is farther is drawn higher on the leaf, so
// the court, pools, canals and ranks of devices fill every frame to its top edge. The ground is three coats painted
// under everything with no depth (court; rules and running water; pools).
// The page is PEOPLED (see DEVICES in build): over a hundred of the engineer's other devices stand on it, the far ones up
// to eight times life size, the leaf is a paved court, and the castle's hour arc stands behind it.
export function wccRoute() {
  // the approach: in under the first gateway, past the peacock to starboard, a swing out to port and up to howdah height
  // for the leaf whole (the elephant square-on from 230 m, the city of devices up the page behind it)
  const P = [[0, 40, 40], [0, 40, 64], [0, 41, 100], [-6, 42, 150], [-20, 44, 200], [-34, 46, 245], [-36, 49, 282], [-24, 58, 308], [0, 74, 316], [32, 89, 298],
    // down to the window in the flank, square-on (the tank cut open, the bowl going under), then along and up the flank to
    // the tower's front (falcon, ball, serpent), never nearer the painted face than 50 m
    [52, 81, 326], [46, 65, 356],
    [30, 58, 352], [17, 56, 362], [9, 57, 384], [6, 70, 410], [8, 92, 414], [3, 116, 410], [-8, 131, 412], [-28, 136, 428],
    // over the rump and out along the starboard side of the trough, a turn in toward the trough with the tower's open back
    // to port (serpent 2 tipped, the ball let go), then down the starboard side straight at the scoop wheel, face-on, and
    // across above the trough to its port rim before the wheel's launder
    [-64, 137, 456], [-90, 136, 500], [-90, 132, 552], [-72, 128, 598], [-56, 124, 630], [-54, 116, 658], [-62, 98, 688],
    [-70, 78, 714], [-66, 68, 738], [-50, 74, 760], [-34, 90, 776], [-20, 102, 790], [-12.5, 109, 808], [TX, 111, 836]];
  // along the trough's port rim, over the water, past the scoop wheel (the brief's chase), then a short swing to port and
  // the dive to the door: the castle is met whole from above its lake, never from under the trough
  // (the run to the castle is flown ABOVE the trough, on its axis: the running water is the road under us, never a bar across the view)
  P.push([TX, 104, 866], [-9.5, 106, 888], [-6, 111, 908], [-4, 113, 926], [-3, 103, 946], [-1, 86, 966], [0, 68, 984], [0, 52, 999], [0, 40, 1012]);
  P.push([0, 29, 1028], [0, 19, 1046], [0, 12.5, 1062], [0, 10.2, 1071], [0, 10, 1080]);
  return P;
}

// THE CHAIN'S CLOCK. Every event is keyed to a chain value c in 0..1 (the brief's u). The route is free to change, so c
// is tied to PLACES on the route, not to the fraction flown: wccChain(path) returns cu(u) (monotone and smooth, a pure
// function of u) and its inverse pu(c), the path u at which the chain stands at c.
export function wccChain(path) {
  const N = 900, S = [], v = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { path.pointAt(i / N, v); S.push(v.x, v.y, v.z); }
  const near = (p) => { let best = 0, bd = 1e12; for (let i = 0; i <= N; i++) { const d = (S[i * 3] - p[0]) ** 2 + (S[i * 3 + 1] - p[1]) ** 2 + (S[i * 3 + 2] - p[2]) ** 2; if (d < bd) { bd = d; best = i; } } return best / N; };
  const Lw = (x, y, z) => [-x, y, HZ - z];
  // places and the chain value there: the bowl's rim goes under (0.46) just as we come level with it in the belly, serpent 2
  // swings down (0.50..0.54) as we rise out of the shaft into the tower, the ball overtakes (0.74) just before the peel-off
  const K = [[0, 0], [0.17, 0.16], [0.25, 0.30], [0.335, 0.452], [0.425, 0.487], [0.52, 0.56], [0.61, 0.615], [0.66, 0.66],
    [near([-12.5, 109, 808]), 0.74], [near([-6, 111, 908]), 0.86], [near([-3, 103, 946]), 0.9], [near([0, 60, 991]), 0.922], [1, 1]];
  const n = K.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / Math.max(K[i + 1][0] - K[i][0], 1e-5));
  for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[n - 2] : 2 * d[i - 1] * d[i] / Math.max(d[i - 1] + d[i], 1e-6));   // harmonic mean: monotone
  const cu = (u) => {
    u = clamp(u, 0, 1); let i = 0; while (i < n - 2 && u > K[i + 1][0]) i++;
    const h = Math.max(K[i + 1][0] - K[i][0], 1e-5), t = (u - K[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
  const pu = (c) => { let a = 0, b = 1; for (let i = 0; i < 26; i++) { const q = (a + b) / 2; if (cu(q) < c) a = q; else b = q; } return (a + b) / 2; };
  return { cu, pu, knots: K };
}

export default {
  id: 'water-clock-city',
  name: 'Where Water Keeps the Hour',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Ismail al-Jazari, 1136 to 1206',
  weirdness: 0.7,
  media: ['air', 'open', 'interior'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = ctx.quality?.detail ?? 1, density = ctx.vary?.density ?? 1;
    // ---- variations (their own fork, so nothing else shifts) ----------------------------------------
    const vr = ctx.rng.fork('wcc-vary');
    const cr = vr();
    const copy = cr < 0.5 ? 'amid' : cr < 0.78 ? 'copyist' : 'unfinished';   // which copy of the book this leaf is from
    const highWater = vr() < 0.36;                                           // the feeder channel in flood
    const hourHint = { dawn: 1, day: 5, golden: 7, night: 10 }[ctx.vary?.hour];
    const hour = clamp(hourHint ? hourHint + vr.int(0, 1) : vr.int(1, 11), 1, 11);   // roundels filled so far (1..6 day, 7..12 night)
    const rare = !!ctx.vary?.rare;                                           // the twelfth hour

    const S = makeStyle(PALETTE), K = S.colors;
    scene.background = K.paper.clone();
    const paper = makePaperDome(S, { flat: 900, rise: 900 });
    // the page is pushed back in depth so that plans lying on it (channel, flood, pool) never fight it, even through
    // the previous world's portal where depth is coarse. Same shader, so no second program.
    const paperMat = S.material.clone(); paperMat.depthTest = false; paperMat.depthWrite = false;   // the bare leaf is painted first and hides nothing: it is under everything
    paperMat.uniforms = S.uniforms;                   // one set of uniforms for every coat (time, pins, the page's tip)
    paper.material = paperMat;
    paper.position.set(7, 0, 533); scene.add(paper);
    // THE PAGE TIPS UP (the manner's own space: no sky, the ground climbs the leaf and what is farther is drawn higher). The
    // style's vertex shader raises everything by lift(level distance from the eye); liftAt is the same curve for the gaze.
    const BEND = { r0: 200, a: 0.5, s1: 300, w: 2.2e-7 };      // w: the leaf's far edge curls up past the top of any level view, so no horizon is ever drawn
    S.uniforms.uBend.value.set(BEND.r0, BEND.a, BEND.s1, BEND.w);
    const liftAt = (r) => { const q = Math.max(r - BEND.r0, 0); return BEND.a * q * q / (q + BEND.s1) * (1 + BEND.w * q * q); };   // off the path's axis: no dome vertex may sit exactly beside a level camera at the entry
    await ctx.yield();

    // ---- the hero -------------------------------------------------------------------------------------
    const hero = await buildHero(ctx, { style: S, paper: false, detail, copy: copy === 'copyist' ? 'copyist' : 'amid' });
    hero.object.position.set(0, 0, HZ); hero.object.rotation.y = Math.PI; scene.add(hero.object);
    const EVH = hero.anchors.events;
    await ctx.yield();

    // ---- the path -------------------------------------------------------------------------------------
    const path = makePath(wccRoute());
    await ctx.yield();
    const camZ = (u) => path.pointAt(u, _v).z;
    const { cu: CU, pu: PU } = wccChain(path);         // chain value at a path u, and the path u at a chain value
    await ctx.yield();

    // ---- the drawing board for everything that is not the elephant ----------------------------------------
    const rng = ctx.rng.fork('wcc-city');
    let b = new PlateBuilder(S, rng, ctx.noise); b.blots = 0.34 * detail;
    const bMain = b;                                  // the five machines, the gateways and the trough: the finished figures
    // the page's own ground is drawn as a painter lays it, in three coats under everything and with no depth: the court,
    // then rules and running water, then pools. (The leaf tips up by a curve; coats that only nearly agree must not fight.)
    const rngG = ctx.rng.fork('wcc-ground');
    const gb0 = new PlateBuilder(S, rngG, ctx.noise), gb1 = new PlateBuilder(S, rngG, ctx.noise), gb2 = new PlateBuilder(S, rngG, ctx.noise);
    for (const g of [gb0, gb1, gb2]) { g.plan = true; g.blots = 0; }
    // a colour of the copy: in the unfinished leaf the later machines are reed line on bare paper, water and gold only
    let bare = false;
    const col = (c) => (bare && c !== K.blue && c !== K.gold) ? K.paper : c;
    const kindOf = (c, k) => (bare && c !== K.blue && c !== K.gold) ? 3 : (k || 0);
    // P(): a plate in the copy's colours. o as PlateBuilder.plate, depth in metres into the page
    const P = (pts, o) => b.plate(pts, { ...o, col: col(o.col), kind: kindOf(o.col, o.kind), edge: o.edge ? col(o.edge) : undefined, miss: bare ? 0 : o.miss });
    const castleCol = copy === 'copyist' ? K.green : K.red, castleAcc = copy === 'copyist' ? K.red : K.green;
    const castleCol0 = castleCol, castleAcc0 = castleAcc;
    const uni = S.uniforms;

    // ---- small drawing helpers (page coordinates: X starboard, Y up, d = depth into the course) -------------
    const FALCON = [[-3.5, 6.1], [-3.3, 7], [-2.5, 7.9], [-1.1, 8.1], [0.4, 7.1], [2.3, 5], [4.7, 1.6], [5.6, -2], [4, -1.4], [2.5, 0.9], [0.7, 1.3], [-1, 2.3], [-1.8, 4.3], [-1.7, 5.7], [-2.7, 6]];
    // a gold falcon in stiff profile on a pin at its feet; dirX 1 looks to port (page -X). bows about z.
    const falcon = (fx, fy, d, dirX, sc = 1, part = -1) => {
      const z = -d, pt = part >= 0 ? part : S.newPart([fx, fy, z], 0); b.use(pt);
      const T = (pts) => pts.map((p) => [fx + p[0] * sc * dirX, fy + (p[1] + 1.4) * sc]);
      P(T(FALCON), { z, depth: 1.2 * sc, col: K.gold, corner: 42 });
      for (const zz of [z, z - 1.2 * sc]) {
        b.stroke(T(curvePts([[0.2, 6.2], [1.4, 3.6], [4.4, 1.2]], 3)), zz, { layer: 3 });
        b.stroke(T(curvePts([[0.4, 4.6], [1.6, 2.6], [3.4, 1]], 3)), zz, { layer: 3 });
        b.stroke(T([[0.2, 1.4], [0.5, -1.4], [-0.6, -1.3]]), zz, { layer: 3 });
        b.blot(fx - 1.9 * sc * dirX, fy + 8.2 * sc, zz, 0.3 * sc, 4);
      }
      b.use(0);
      return { part: pt, beak: new THREE.Vector3(-(fx - 3.9 * sc * dirX), fy + 6.6 * sc, d + 0.6 * sc), dir: dirX, sc };   // beak in WORLD space
    };
    // a vase or cup in section: gold, with a paper mouth
    const vase = (cx, y0, d, sc = 1) => {
      const T = (pts) => pts.map((p) => [cx + p[0] * sc, y0 + p[1] * sc]);
      P(T([[-1.6, 0], [1.6, 0], [1.2, 1], [2.6, 3.4], [2.9, 5.6], [2.1, 7.2], [3.3, 8.6], [-3.3, 8.6], [-2.1, 7.2], [-2.9, 5.6], [-2.6, 3.4], [-1.2, 1]]), { z: -d, depth: 1.4 * sc, col: K.gold, corner: 40 });
      b.stroke(T([[-2.5, 4], [2.5, 4]]), -d, { layer: 3 }); b.stroke(T([[-2.2, 7.2], [2.2, 7.2]]), -d, { layer: 3 });
    };
    // the three standpipe water levels: every column is on one of these sliding parts
    const pCol = [S.newPart([0, 0, 0], 0), S.newPart([0, 0, 0], 0), S.newPart([0, 0, 0], 0)];
    // a standpipe: vermilion pipe cut open on its blue column, verdigris funnel on top
    const standpipe = (X, d, h, k) => {
      const z = -d, w = 1.5;
      P(rectPts(X - w, 0, X + w, h), { z, depth: 2, col: K.red, holes: [rectPts(X - 0.75, 1.2, X + 0.75, h - 1.2)], miss: 0.5, holeWalls: false });
      b.fill(rectPts(X - 0.75, 1.2, X + 0.75, h - 1.2), z - 0.5, K.paper, { kind: 3 });
      b.use(pCol[k]); b.fill(rectPts(X - 0.75, -h, X + 0.75, h * 0.52), z - 0.3, K.blue, { layer: 1, kind: 1, flow: -2.5, uvRot: Math.PI / 2 });   // scallops climb the column
      b.stroke([[X - 0.75, h * 0.52], [X + 0.75, h * 0.52]], z - 0.3, { layer: 3, over: false, feat: 6 }); b.use(0);
      P([[X - w, h], [X + w, h], [X + 3.4, h + 3.2], [X - 3.4, h + 3.2]], { z: z + 0.4, depth: 2.8, col: K.green, corner: 30 });
      P(rectPts(X - 2.2, 0, X + 2.2, 1.1), { z: z + 0.4, depth: 2.8, col: K.gold });
    };
    // a tank cut open: vermilion frame, azurite section ruled with scallop rows, and its top drawn too, hinged up
    // above the front as an oval (the engineer's error, built as an object). returns the water rect.
    const tank = (x0, y0, x1, y1, d, depth, o = {}) => {
      const t = o.t ?? 1.6, wl = o.level ?? (y1 - 2.2), z = -d, frameCol = o.col || K.red;
      P(rectPts(x0, y0, x1, y1), { z, depth, col: frameCol, holes: [rectPts(x0 + t, y0 + t, x1 - t, y1 - t * 0.4)], miss: 0.7, holeWalls: false });
      b.fill(rectPts(x0 + t, y0 + t, x1 - t, y1), z - depth + 0.1, K.paper, { kind: 3 });                    // the bare paper inside the cut body
      b.plate(rectPts(x0 + t, y0 + t, x1 - t, wl), { z: z - 0.6, depth: 0, col: K.blue, kind: 1, flow: o.flow ?? 0.5, layer: 1, corner: 60 });
      if (o.top !== false) {
        const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 - 0.5, ry = o.topH ?? Math.min(5, rx * 0.3);
        b.plate(circlePts(0, 0, 1, 22).map((p) => [cx + p[0] * rx, y1 + 0.8 + ry + p[1] * ry]), { z: z - 0.6, depth: 0.8, col: K.blue, kind: 1, flow: o.flow ?? 0.5, corner: 80 });
        for (const sx of [-1, 1]) P(circlePts(cx + sx * rx * 0.86, y1 + 0.5, 0.8, 8), { z: z + 0.2, depth: 1, col: K.gold });   // the hinges
      }
      return { x0: x0 + t, x1: x1 - t, y0: y0 + t, wl };
    };
    // a turbaned automaton seen from behind: robe with hook folds, turban, the plain gold disc; no face on any side
    const man = (x, y, d, sc = 1) => {
      const T = (pts) => pts.map((p) => [x + p[0] * sc, y + p[1] * sc]), z = -d;
      P(circlePts(x, y + 14.2 * sc, 4.3 * sc, 18), { z: z - 0.7, depth: 0.5, col: K.gold });
      P(T([[-6, 0], [6, 0], [5.2, 3], [3.8, 8], [3.3, 11.6], [-3.3, 11.6], [-3.8, 8], [-5.2, 3]]), { z, depth: 2, col: K.red, kind: 2, uvFlip: true, miss: 0.6 });
      for (const zz of [z + 0.3, z - 2.3]) {
        b.plate(T([...arcPts(0, 14.1, 2.9, 2.5, -0.5, Math.PI + 0.5, 10), [-1.6, 11.4], [1.6, 11.4]]), { z: zz, col: K.paper, kind: 3, layer: 2, corner: 50 });
        for (let k = 0; k < 3; k++) b.stroke(T(arcPts(0.4 - k * 0.5, 12.6 + k * 1.1, 2.6 - k * 0.5, 1.5, 0.3, Math.PI - 0.5, 5)), zz, { layer: 5 });
        b.stroke(T([[-3.3, 9.6], [3.3, 9.6]]), zz, { layer: 3 });
      }
    };

    // ---- the page's gateways: where the leaf's vermilion rules stand up they are built as he built a portal: two striped
    // posts on gold feet under verdigris funnels, a gold lintel between two rules carrying a row of plain roundels.
    // (The thin double rules that stood here read as wire from across the page.) A falcon perches under each lintel and bows.
    // One frames the elephant from outside as the page opens; two straddle the trough and are flown through.
    const FRAMES = [[175, 0, 88, 54, [-30, 30]], [892, 8, 118, 42, [26]]];   // depth, centre X, lintel underside, half width, falcons at
    const frameFalcons = [];
    for (const [d, cx, ly, hw, fal] of FRAMES) {
      const z = -d, pw = 5;
      for (const sx of [-1, 1]) {
        const x0 = cx + sx * hw, x1 = cx + sx * (hw + pw), xa = Math.min(x0, x1), xb = Math.max(x0, x1);
        P(rectPts(xa, 0, xb, ly), { z, depth: 3, col: K.red, miss: 0.5 });
        for (let y = 7, q = 0; y < ly - 11; y += 12, q++) for (const zz of [z + 0.02, z - 3.02]) b.plate([[(xa + xb) / 2, y], [xb - 0.4, y + 4.5], [(xa + xb) / 2, y + 9], [xa + 0.4, y + 4.5]], { z: zz, depth: 0, col: q % 2 ? K.green : K.gold, layer: 2, corner: 20 });   // a lozenge band up each post (plain vermilion between), as he banded a column
        P([[xa - 2.4, 0], [xb + 2.4, 0], [xb + 1.4, 4], [xa - 1.4, 4]], { z: z + 0.5, depth: 4, col: K.gold });
        P([[xa, ly + 9.6], [xb, ly + 9.6], [xb + 3.6, ly + 15.6], [xa - 3.6, ly + 15.6]], { z: z + 0.3, depth: 3.6, col: K.green, corner: 30 });   // the funnel on each post
      }
      const lx0 = cx - hw - pw - 4, lx1 = cx + hw + pw + 4;
      P(rectPts(lx0, ly + 1.4, lx1, ly + 8.2), { z: z + 0.4, depth: 3.8, col: K.gold });
      for (const y of [ly, ly + 8.2]) b.plate(rectPts(lx0 - 1.5, y, lx1 + 1.5, y + 1.4), { z: z + 0.4, depth: 3.8, col: K.red, ink: false });
      const nr = Math.max(5, Math.round((lx1 - lx0) / 11));
      for (let k = 0; k < nr; k++) { const x = lerp(lx0 + 5, lx1 - 5, k / (nr - 1)); for (const zz of [z + 0.6, z - 3.6]) b.plate(circlePts(x, ly + 4.8, 2.3, 12), { z: zz, depth: 0, col: k % 2 ? K.green : K.red, layer: 2, corner: 80 }); }
      for (const fo of fal) {              // the perch: a verdigris bracket under the lintel
        const fx = cx + fo, fy = ly - 6.5, sx = fo < 0 ? -1 : 1;
        P([[fx - 0.5 * sx, ly], [fx + 0.5 * sx, ly], [fx + 0.5 * sx, fy + 0.6], [fx - 4 * sx, fy + 0.6], [fx - 4 * sx, fy - 0.6], [fx + 0.5 * sx, fy - 0.6]], { z: -d, depth: 0.8, col: K.green, corner: 40 });
        frameFalcons.push({ ...falcon(fx - 1.6 * sx, fy + 0.6, d + 0.2, sx, 0.82), d });
      }
      await ctx.yield();
    }
    await ctx.yield();

    // ---- the feeder channel (a plan lying level) and, in a wet year, the flood ------------------------------
    b.plan = true;
    const lobed = (x0, z0, x1, z1, n, amp) => {          // a pool's outline as he drew pools: a ring of shallow lobes
      const o = [], cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rx = (x1 - x0) / 2, rz = (z1 - z0) / 2;
      for (let i = 0; i < n * 6; i++) { const a = (i / (n * 6)) * TAU, q = 1 + amp * Math.abs(Math.sin(a * n * 0.5)); o.push([cx + Math.cos(a) * rx * q, cz + Math.sin(a) * rz * q]); }
      return o;
    };
    if (highWater) gb1.plate(lobed(-170, -486, 170, -74, 22, 0.07), { z: 0.4, depth: 0, col: K.blue, kind: 5, flow: 1.3, uvRot: Math.PI / 2, layer: 1, corner: 80 });
    // the channel runs under the path from behind the entry to the elephant's feet; two vermilion banks
    gb1.plate(rectPts(-6.7, -(HZ - 28), 6.7, 70), { z: 1.0, depth: 0, col: K.blue, kind: 5, flow: 4.5, uvRot: Math.PI / 2, layer: 2 });
    for (const sx of [-1, 1]) gb1.plate(rectPts(sx * 7.4 - 0.7, -(HZ - 28), sx * 7.4 + 0.7, 70), { z: 1.3, depth: 0, col: K.red, layer: 3, ink: false });
    // the pool at the elephant's feet
    gb2.plate(lobed(-46, -(HZ - 23), 46, -(HZ - 150), 16, 0.09), { z: 1.7, depth: 0, col: K.blue, kind: 5, flow: 1.6, uvRot: Math.PI / 2, layer: 4, corner: 80 });
    b.plan = false;
    // the pool at the forefeet, under the trunk: the tank's overflow falls into it from the chest sill
    b.plan = true;
    gb2.plate(lobed(-172, -(HZ + 40), -92, -(HZ - 44), 12, 0.09), { z: 1.7, depth: 0, col: K.blue, kind: 5, flow: 1.6, uvRot: Math.PI / 2, layer: 4, corner: 80 });
    b.plan = false;
    // standpipes in rows along the channel and at the trough posts (thinned on phones). On the approach they stand
    // near the entry and low, so that from the first frame they sit under the elephant's feet, never across it.
    const nPipes = Math.max(16, Math.round(40 * detail * clamp(density, 0.8, 1.15)));
    let pipes = 0;
    for (let i = 0; i < 10 && pipes < nPipes - 12; i++) {
      const d = 172 + i * 20, far = d > 262;
      for (const sx of [-1, 1]) {
        const hgt = (far ? 7 : 9) + Math.round(rng() * (far ? 4 : 10));
        if (sx > 0 && d > 329 && d < 364) continue;                      // the peacock's spout crosses here
        standpipe(sx * (12.5 + (i % 2) * 3 + (i % 3 === 2 ? 9 : 0)), d, hgt, (i + (sx > 0 ? 1 : 0)) % 3); pipes++;
      }
      if (i % 4 === 3) await ctx.yield();
    }
    await ctx.yield();

    // ---- (1) the peacock basin: depth 130, 16 m to starboard, 36 m tall ----------------------------------------
    {
      const d = 345, G = K.green; b.ox = 48;                       // low to starboard, clear of the elephant's hind legs from the entry
      const tk = tank(10, 0, 46, 13, d, 9, { level: 10.4, topH: 3.6 });
      // the float in the section rises slowly and drops (ambient), its pointer standing above the oval
      var pFloat = S.newPart([0, 0, 0], 0); b.use(pFloat);
      P([...arcPts(36, 8.2, 3.2, 2.2, Math.PI, TAU, 8)], { z: -d - 0.4, depth: 1, col: K.gold, corner: 50 });
      b.stroke([[36, 8.2], [36, 24.5]], -d - 0.4, { layer: 4 }); P(circlePts(36, 25.4, 1.1, 9), { z: -d - 0.4, depth: 0.6, col: K.red });
      b.use(0);
      // overflow spout to the floor channel, pouring a ruled ribbon
      P([[10, 8.8], [10, 6.8], [6.4, 6.2], [6.4, 7.6]], { z: -d - 1, depth: 2, col: K.red, corner: 30 });
      b.plate(rectPts(5.2, 0.5, 7, 6.6), { z: -d - 1.8, depth: 0, col: K.blue, kind: 1, flow: 5.4, uvRot: Math.PI / 2, layer: 1 });
      // the bird: three plates 4 m apart. tail fan (back), body and neck, wing (proud)
      const tail = [[30, 15], ...arcPts(33, 17, 14.5, 19.5, -0.25, Math.PI * 0.62, 12), [27, 20]];
      P(tail, { z: -d - 9, depth: 1.2, col: G, kind: 2, miss: 0.8, corner: 60 });
      for (let k = 0; k < 7; k++) {
        const a = -0.1 + k * 0.3, ex = 33 + Math.cos(a) * 11.6, ey = 17 + Math.sin(a) * 15.8;
        for (const zz of [-d - 9, -d - 10.2]) { b.plate(circlePts(ex, ey, 1.7, 10), { z: zz, depth: 0, col: K.gold, layer: 2 }); b.blot(ex, ey, zz, 0.6, 6); b.stroke([[31, 17], [ex, ey]], zz, { layer: 4, over: false }); }
      }
      const neck = bandPts([[29, 20], [24, 21.5], [20.4, 25], [20.2, 29.5], [17.6, 32.2]], 6.2, 2.6, 5, 4);
      const body = [...arcPts(29, 19, 8.6, 5.6, Math.PI * 0.55, Math.PI * 2.2, 12)];
      P(body, { z: -d - 5, depth: 1.4, col: G, kind: 2, miss: 0.7, corner: 70 });
      P(neck.all, { z: -d - 5, depth: 1.4, col: G, miss: 0.7, corner: 70 });
      P([[16.4, 33.2], [12.2, 31.2], [16.2, 31.2]], { z: -d - 5.2, depth: 1, col: K.gold, corner: 20 });                        // beak
      for (let k = 0; k < 3; k++) { b.stroke([[18.4, 33.6], [17.4 + k * 1.4, 36.4]], -d - 5, { layer: 4 }); b.blot(17.4 + k * 1.4, 36.6, -d - 5, 0.42, 5); }   // crest
      b.blot(18.2, 32.2, -d - 5, 0.36, 5);
      P([[24, 19.4], ...arcPts(29, 20, 7.5, 3.4, Math.PI * 1.1, TAU - 0.2, 7), [38, 22.4], [30, 23.4]], { z: -d - 1, depth: 1, col: G, kind: 2, corner: 50 });   // wing
      for (const lx of [27, 31]) { b.stroke([[lx, 14.2], [lx, 13]], -d - 5, { layer: 3 }); }
      // the pour: a ruled blue ribbon from the beak down into the oval
      b.plate(rectPts(12.2, 14.2, 14, 31), { z: -d - 5.6, depth: 0, col: K.blue, kind: 1, flow: 6.5, uvRot: Math.PI / 2, layer: 1 });
      standpipe(48.5, d + 4, 15, 0); pipes++;
      b.ox = 0;
      // the overflow runs in a floor channel to the feeder
      b.plan = true; b.plate(rectPts(8.1, -(d + 2.9), 55.2, -(d + 0.7)), { z: 1.2, depth: 0, col: K.blue, kind: 1, flow: 2.5, layer: 3 }); b.plan = false;
    }
    await ctx.yield();

    // ---- the trough: 6 m of running water on striped posts, from the tower to the castle top -----------------
    const XT = -TX, postD = [];
    for (let d = TZ0 + 26; d < TZ1 - 90; d += 40) postD.push(d);      // the last spans are left clear: the low approach sees the castle whole under the trough
    {
      const NS = 13, wallC = col(K.red);
      const rimA = [], rimB = [], lowA = [], lowB = [];
      for (let i = 0; i <= NS; i++) {
        const d = lerp(TZ0 - 4, TZ1 + 2, i / NS), y = troughY(d);
        rimA.push([XT - 3.4, y + 1.7, -d]); rimB.push([XT + 3.4, y + 1.7, -d]); lowA.push([XT - 3.4, y - 0.7, -d]); lowB.push([XT + 3.4, y - 0.7, -d]);
        if (i === 0) continue;
        const d0 = lerp(TZ0 - 4, TZ1 + 2, (i - 1) / NS), y0 = troughY(d0), u0 = (i - 1) * 40;
        b.quad([XT - 3.4, y0, -d0], [XT - 3.4, y, -d], [XT + 3.4, y, -d], [XT + 3.4, y0, -d0], K.blue, { kind: 1, flow: -10.4, u0, layer: 1 });          // the bed
        // the walls are drawn IN SECTION, as he drew every channel: a vermilion sole and rim with the running water showing
        // between them, so that from the side the trough is ruled water on posts and never a plain beam
        for (const sx of [-1, 1]) {
          const xx = XT + sx * 3.4, W = (a, c2, colr, o) => b.quad([xx, y0 + a, -d0], [xx, y + a, -d], [xx, y + c2, -d], [xx, y0 + c2, -d0], colr, o);
          W(-0.7, -0.1, wallC, { u0 }); W(-0.1, 1.15, K.blue, { kind: 1, flow: -10.4, u0, layer: 1 }); W(1.15, 1.7, wallC, { u0 });
        }
        b.quad([XT - 3.4, y0 - 0.7, -d0], [XT - 3.4, y - 0.7, -d], [XT + 3.4, y - 0.7, -d], [XT + 3.4, y0 - 0.7, -d0], wallC, {});                         // underside
        if (i % 4 === 0) await ctx.yield();
        // the walls are striped as his posts are: a band of bare paper between two reed lines, three to a span
        for (const sx of [-1, 1]) for (let q = 0; q < 0; q++) {      // (the walls are plain vermilion now: paper bands read as fairground stripes)
          const f0 = (q + 0.3) / 3, f1 = (q + 0.72) / 3, da = lerp(d0, d, f0), db = lerp(d0, d, f1), ya = troughY(da), yb = troughY(db), xx = XT + sx * 3.43;
          b.quad([xx, ya - 0.7, -da], [xx, yb - 0.7, -db], [xx, yb + 1.7, -db], [xx, ya + 1.7, -da], K.paper, { kind: 3, layer: 2 });
          b.ribbon([[xx, ya - 0.7, -da], [xx, ya + 1.7, -da]], { layer: 4, feat: 2.4 }); b.ribbon([[xx, yb - 0.7, -db], [xx, yb + 1.7, -db]], { layer: 4, feat: 2.4 });
        }
      }
      await ctx.yield();
      for (const r of [rimA, rimB, lowA, lowB]) b.ribbon(r, { layer: 3 });
      b.ribbon([rimA[0], rimB[0]], { layer: 3 }); b.ribbon([lowA[0], lowB[0]], { layer: 3 });
      // striped posts every 40 m; a standpipe at every other foot
      let k = 0;
      for (const d of postD) {
        const top = troughY(d) - 0.7;
        P(rectPts(XT - 1.6, 0, XT + 1.6, top), { z: -d, depth: 2.4, col: K.red, miss: 0.5 });
        P([[XT - 4.4, top], [XT + 4.4, top], [XT + 1.6, top - 4.5], [XT - 1.6, top - 4.5]], { z: -d + 0.2, depth: 2.8, col: K.gold, corner: 30 });
        for (let y = 9; y < top - 14; y += 18) for (const zz of [-d + 0.02, -d - 2.42]) b.plate([[XT, y], [XT + 1.3, y + 3.2], [XT, y + 6.4], [XT - 1.3, y + 3.2]], { z: zz, depth: 0, col: K.gold, layer: 2, corner: 20 });
        if (pipes < nPipes && Math.abs(d - 800) > 30) { standpipe(XT + 7.5 + (k % 2) * 5, d, 10 + Math.round(rng() * 10), k % 3); pipes++; }
        k++;
        if (k % 3 === 0) await ctx.yield();
      }
    }
    await ctx.yield();
    // six falcons on the far rim, 8 m from the path; each bows over the trough as the ball goes by
    const rimFalcons = [];
    for (const d of [664, 750, 786, 866, 972, 1016]) {      // on the starboard rim, across the water from the path
      const y = troughY(d) + 1.7, sx = 1;
      P(rectPts(XT + sx * 3.4, y - 1.2, XT + sx * 5.6, y), { z: -d, depth: 1, col: K.green });
      rimFalcons.push({ ...falcon(XT + sx * 5.2, y, d, sx, 0.8), d });
    }
    await ctx.yield();

    // ---- (3) the flute tower: two pipes, a tank cut open between them, and the bucket the ball tips -------------
    const FLUTE = 800;
    bare = copy === 'unfinished';
    {
      const d = FLUTE, ty = troughY(d);                 // trough bed here
      const pinX = XT - 2, pinY = ty + 13;
      b.mir = XT;                                       // drawn to port of the trough, then mirrored: it stands to starboard, across the water from the path
      for (const px of [-14, 0]) {
        P(rectPts(px, 0, px + 4.4, 124), { z: -d, depth: 3, col: K.red, miss: 0.6 });
        for (let y = 18; y < 118; y += 11) for (const zz of [-d + 0.02, -d - 3.02]) b.blot(px + 2.2, y, zz, 0.75, 4);            // the finger holes
        P([[px - 1.6, 0], [px + 6, 0], [px + 5.2, 4], [px - 0.8, 4]], { z: -d + 0.5, depth: 4, col: K.gold });
        P([[px + 0.4, 124], [px + 4, 124], [px + 6.2, 129], [px - 1.8, 129]], { z: -d + 0.3, depth: 3.6, col: K.green, corner: 30 });
      }
      for (const y of [36, 70, 116]) P(rectPts(-9.6, y, 0, y + 2.6), { z: -d - 0.6, depth: 1.6, col: K.green });
      tank(-9.6, pinY - 2.5, 0, pinY + 13, d + 0.4, 2.2, { topH: 2.4, level: pinY + 9.5 });
      // the stoppers bob on the two pipes
      var pStop = [S.newPart([0, 0, 0], 0), S.newPart([0, 0, 0], 0)];
      [-14, 0].forEach((px, i) => { b.use(pStop[i]); P([...arcPts(px + 2.2, 131.5, 3, 3.6, 0, Math.PI, 8)], { z: -d, depth: 2, col: K.gold, corner: 50 }); b.stroke([[px + 2.2, 124], [px + 2.2, 131.5]], -d - 1, { layer: 3 }); b.use(0); });
      // the launder and bucket on one pin over the trough: when the ball trips it the water swings down as a sheet
      var pBucket = S.newPart([2 * XT - pinX, pinY, -d], 0); b.use(pBucket);
      b.plate(rectPts(pinX - 14.5, pinY - 1.1, pinX - 0.2, pinY + 1.3), { z: -d - 0.9, depth: 0, col: K.blue, kind: 1, flow: 2.5, layer: 1 });
      P([[pinX - 15, pinY - 1.6], [pinX + 0.6, pinY - 1.6], [pinX + 0.6, pinY + 2.6], [pinX - 0.4, pinY + 2.6], [pinX - 0.4, pinY - 0.9], [pinX - 14, pinY - 0.9], [pinX - 14, pinY + 2.6], [pinX - 15, pinY + 2.6]], { z: -d - 0.4, depth: 1.6, col: K.gold, corner: 40 });
      b.use(0);
      P(circlePts(pinX, pinY - 1.4, 1.2, 10), { z: -d - 0.2, depth: 0.4, col: K.red }); b.blot(pinX, pinY - 1.4, -d - 0.2, 0.36, 6);
      P([[pinX - 0.6, pinY - 1.6], [pinX + 0.6, pinY - 1.6], [0.6, pinY - 14], [0.6, pinY - 17]], { z: -d - 1.2, depth: 1, col: K.green, corner: 30 });    // the bracket from the pipe
      b.mir = null;
    }
    bare = false;
    await ctx.yield();

    // ---- (4) the scoop wheel: a full circle of sixteen pots facing the entry, on an axle lying in its own plane ----
    const WHEEL = 838, WX = XT + 72, WY = 54, WR = 44;
    bare = copy === 'unfinished';
    {
      const d = WHEEL, z = -d;
      // the sump the pots dip into, cut open
      tank(WX - 40, 0, WX + 40, 11, d - 3, 6, { level: 8.4, topH: 3 });
      var pWheel = S.newPart([WX, WY, z], 0); b.use(pWheel);
      P(circlePts(WX, WY, WR, 56), { z, depth: 2.4, col: K.red, holes: [circlePts(WX, WY, WR - 6, 48)], miss: 0.6, corner: 80 });
      for (let k = 0; k < 8; k++) {                               // spokes
        const a = k * Math.PI / 8, c = Math.cos(a), s = Math.sin(a), w = 1.3, r = WR - 5.6;
        P([[WX - c * r + s * w, WY - s * r - c * w], [WX + c * r + s * w, WY + s * r - c * w], [WX + c * r - s * w, WY + s * r + c * w], [WX - c * r - s * w, WY - s * r + c * w]], { z: z - 0.4, depth: 1.6, col: K.gold, corner: 30 });
      }
      for (let k = 0; k < 48; k++) {                              // gear teeth: a ring of solid ink spikes
        const a = (k / 48) * TAU, a1 = a + TAU / 96, a2 = a + TAU / 48, r0 = WR - 6, r1 = WR - 9.4;
        for (const zz of [z + 0.05, z - 2.45]) b.fill([[WX + Math.cos(a) * r0, WY + Math.sin(a) * r0], [WX + Math.cos(a1) * r1, WY + Math.sin(a1) * r1], [WX + Math.cos(a2) * r0, WY + Math.sin(a2) * r0]], zz, K.ink, { layer: 4 });
      }
      await ctx.yield();
      for (let k = 0; k < 16; k++) {                              // the pots, mouths leading
        const a = (k / 16) * TAU, c = Math.cos(a), s = Math.sin(a), px = WX + c * (WR + 3.2), py = WY + s * (WR + 3.2);
        const T = (pts) => pts.map((p) => [px + p[0] * c - p[1] * s, py + p[0] * s + p[1] * c]);
        P(T([[-2.6, -3.4], [2.6, -3.4], [3.3, 0.6], [2.2, 3.6], [3, 4.6], [-3, 4.6], [-2.2, 3.6], [-3.3, 0.6]]), { z: z + 0.6, depth: 2.2, col: K.green, corner: 40 });
        b.plate(T([[-2, 0.4], [2, 0.4], [1.7, 3.4], [-1.7, 3.4]]), { z: z + 0.62, depth: 0, col: K.blue, layer: 2, ink: false });
      }
      P(circlePts(WX, WY, 5.2, 18), { z: z + 0.4, depth: 3.2, col: K.gold }); b.blot(WX, WY, z + 0.4, 1.3, 6);
      b.use(0);
      // the axle, drawn lying in the wheel's own plane (his error, built as an object), on two striped bearings
      P(rectPts(WX - WR - 13, WY - 1.5, WX + WR + 13, WY + 1.5), { z: z + 2.6, depth: 1.4, col: K.gold });
      for (const sx of [-1, 1]) {
        const px = WX + sx * (WR + 11);
        P(rectPts(px - 2, 0, px + 2, WY + 4), { z: z + 1.2, depth: 2.6, col: K.red, miss: 0.5 });
        P(circlePts(px, WY, 3.2, 12), { z: z + 3.2, depth: 0.6, col: K.green }); b.blot(px, WY, z + 3.2, 0.6, 6);
      }
      // the aqueduct: the pots pour into a launder in section that crosses over the path and falls into the trough
      const ay = troughY(d) + 14, ax0 = XT + 0.4, ax1 = WX - 14;
      P([[ax0 - 0.8, ay - 0.9], [ax1 + 1, ay - 0.9], [ax1 + 1, ay + 3.4], [ax1, ay + 3.4], [ax1, ay], [ax0, ay], [ax0, ay + 3.4], [ax0 - 0.8, ay + 3.4]], { z: z + 5, depth: 2, col: K.red, corner: 40 });
      b.plate(rectPts(ax0, ay, ax1, ay + 2.3), { z: z + 4.6, depth: 0, col: K.blue, kind: 1, flow: 2.6, layer: 1 });
      b.plate(rectPts(ax0 + 0.4, troughY(d) + 0.4, ax0 + 2.6, ay), { z: z + 4.2, depth: 0, col: K.blue, kind: 1, flow: 6.4, uvRot: Math.PI / 2, layer: 1 });   // the fall
      P(rectPts(XT + 5, 0, XT + 7.6, ay - 0.9), { z: z + 5, depth: 2.4, col: K.red, miss: 0.5 });                                                 // its post, starboard of the trough
    }
    bare = false;
    await ctx.yield();

    // ---- (5) the castle clock: crenellated front, twelve roundels, the chute cut open, one gold door -------------
    const CD = DOOR.z + 0.6, CZ = -CD;                   // the front face stands just behind the portal's plane
    bare = copy === 'unfinished';
    const roundels = [], CH = { x0: 30, x1: 56, y0: 14, y1: 58 };   // the chute's window: right of the hour band, under where the trough comes in
    {
      const front = [[-60, 0], [60, 0], [60, 84]];
      for (let k = 0; k < 12; k++) { const x1 = 60 - k * 10; front.push([x1, 90], [x1 - 5, 90], [x1 - 5, 84], [x1 - 10, 84]); }
      const doorHole = [[-7, 1.5], [7, 1.5], ...arcPts(0, 11.5, 7, 7, 0, Math.PI, 12)];
      const chuteHole = rectPts(CH.x0, CH.y0, CH.x1, CH.y1), inlet = rectPts(XT - 3.8, TY1 - 1.2, XT + 3.8, TY1 + 6.6);
      const resHole = rectPts(-52, 5, -20, 27);
      P(front, { z: CZ, depth: 7, col: castleCol, holes: [doorHole, chuteHole, inlet, resHole], miss: 0.9, holeWalls: false, back: false });
      b.fill(front, CZ - 7, K.paper, { kind: 3 });                                                             // bare paper behind every cut
      // string course, corner towers' ink joints, sill
      b.stroke([[-60, 66.5], [60, 66.5]], CZ, { layer: 4 }); b.stroke([[-60, 78], [XT - 3.8, 78]], CZ, { layer: 4 }); b.stroke([[XT + 3.8, 78], [60, 78]], CZ, { layer: 4 });
      b.stroke([[-47, 0], [-47, 84]], CZ, { layer: 4 }); b.stroke([[47, 0], [47, CH.y0]], CZ, { layer: 4 }); b.stroke([[47, CH.y1], [47, 84]], CZ, { layer: 4 });
      // the door's frame: a gold arch band on paper
      P([[-10.5, 0], [-7, 0], [-7, 11.5], ...arcPts(0, 11.5, 7, 7, Math.PI, 0, 12), [7, 0], [10.5, 0], [10.5, 11.5], ...arcPts(0, 11.5, 10.5, 10.5, 0, Math.PI, 14)], { z: CZ + 0.5, depth: 0.5, col: K.gold, corner: 50 });
      // the hour band: an arc of bare paper carrying twelve plain roundels (nothing written)
      const band = [...arcPts(0, 22, 43, 37, 0.12, Math.PI - 0.12, 26), ...arcPts(0, 22, 33, 27, Math.PI - 0.15, 0.15, 22)];
      b.plate(band, { z: CZ + 0.3, depth: 0, col: K.paper, kind: 3, layer: 1, corner: 60 });
      for (let k = 0; k < 12; k++) {
        const a = Math.PI - 0.24 - (k / 11) * (Math.PI - 0.48), x = Math.cos(a) * 38, y = 22 + Math.sin(a) * 32;
        const part = S.newPart([x, y, CZ + 0.9], 1), filled = k < hour, pig = k < 6 ? K.red : K.green;
        b.use(part);
        // front shows the hour as it stands, the back what it turns to
        b.plate(circlePts(x, y, 3.5, 16), { z: CZ + 1.2, depth: 0.6, col: col(filled ? pig : K.paper), backCol: col(filled ? K.paper : pig), kind: filled && !bare ? 0 : 3, backKind: filled || bare ? 3 : 0, edge: K.gold, layer: 2 });
        b.use(0);
        roundels.push({ part, x: -x, y, filled });
      }
      await ctx.yield();
      // the reservoir cut open, with its float
      tank(-53, 4, -19, 28, CD - 0.4, 3, { top: false, level: 21, t: 1.3, col: K.gold });
      var pFloat2 = S.newPart([0, 0, 0], 0); b.use(pFloat2);
      P([...arcPts(-36, 21, 4, 2.6, Math.PI, TAU, 8)], { z: CZ - 1.4, depth: 0.8, col: K.gold, corner: 50 }); b.stroke([[-36, 21], [-36, 33]], CZ - 1.4, { layer: 4 });
      b.use(0);
      b.plate(circlePts(0, 0, 1, 20).map((p) => [-36 + p[0] * 15, 31.5 + p[1] * 3.2]), { z: CZ + 0.4, depth: 0, col: K.blue, kind: 1, flow: 0.4, layer: 2, corner: 80 });   // its top, hinged up
      // a spout high on the front pours a ruled ribbon into the reservoir's top (steady life in the exit frame)
      P([[-49.6, 62.4], [-42.6, 62.4], [-42.6, 59.6], [-45, 59.6], [-45, 60.8], [-49.6, 60.8]], { z: CZ + 2.6, depth: 2.4, col: K.gold, corner: 40 });
      b.plate(rectPts(-45.2, 33.2, -42.8, 59.6), { z: CZ + 1.6, depth: 0, col: K.blue, kind: 1, flow: 6.6, uvRot: Math.PI / 2, layer: 3 });
      await ctx.yield();
      // the chute in section: two ramps, the cup on its beam, the string to the weights
      const ramp = (x0, y0, x1, y1) => P([[x0, y0], [x1, y1], [x1, y1 - 1.4], [x0, y0 - 1.4]], { z: CZ - 1.5, depth: 3.6, col: K.gold, corner: 30 });
      ramp(XT - 3.8, TY1 - 1.2, 50.6, 46.2); ramp(CH.x1, 39.5, 44, 35.6);
      var pCup = S.newPart([48, 23, CZ - 2], 0); b.use(pCup);
      P([[36.6, 27.4], [38, 22.6], [44, 22.6], [45.4, 27.4], [44.4, 27.4], [43.2, 23.8], [38.8, 23.8], [37.6, 27.4]], { z: CZ - 1.5, depth: 3.4, col: K.gold, corner: 40 });
      P([[39, 22.6], [55.5, 22.2], [55.5, 23.6], [39, 23.6]], { z: CZ - 2, depth: 1.2, col: K.green, corner: 30 });
      b.use(0);
      P([[46.6, 18], [49.4, 18], [48, 23]], { z: CZ - 2.2, depth: 1.2, col: K.red, corner: 20 }); b.blot(48, 23, CZ - 1.9, 0.5, 7);
      b.stroke([[55.2, 23.4], [55.2, 61.5], [-12, 61.5]], CZ + 0.1, { layer: 5 });                                                                         // the string
      P(circlePts(55.2, 61.5, 1.6, 10), { z: CZ + 0.3, depth: 0.5, col: K.gold }); P(circlePts(12, 61.5, 1.6, 10), { z: CZ + 0.3, depth: 0.5, col: K.gold }); P(circlePts(-12, 61.5, 1.6, 10), { z: CZ + 0.3, depth: 0.5, col: K.gold });
      // the two weights either side of the door: when the cup takes the ball they fall and the leaves swing
      var pWeight = S.newPart([0, 0, 0], 0); b.use(pWeight);
      for (const sx of [-1, 1]) { P([[sx * 12 - 1.8, 40], [sx * 12 + 1.8, 40], [sx * 12 + 1.2, 46], [sx * 12 - 1.2, 46]], { z: CZ + 0.9, depth: 1.4, col: castleAcc, corner: 30 }); b.stroke([[sx * 12, 46], [sx * 12, 61.5]], CZ + 0.5, { layer: 5, over: false }); }
      b.use(0);
      // the leaves: gold, on pins at the jambs, ajar a quarter
      var pLeaf = [S.newPart([7, 0, CZ + 0.7], 1), S.newPart([-7, 0, CZ + 0.7], 1)];
      [1, -1].forEach((sx, i) => {
        b.use(pLeaf[i]);
        const leaf = [[0.25 * sx, 1.5], [7 * sx, 1.5], ...arcPts(0, 11.5, 7, 7, sx > 0 ? 0 : Math.PI, Math.PI / 2 + sx * 0.036, 7)];
        b.plate(leaf, { z: CZ + 0.7, depth: 0.5, col: K.gold, corner: 40 });
        for (const zz of [CZ + 0.7, CZ + 0.2]) { b.stroke([[1.2 * sx, 4], [5.8 * sx, 4], [5.8 * sx, 10.5], [1.2 * sx, 10.5], [1.2 * sx, 4]], zz, { layer: 4 }); b.blot(1.4 * sx, 9, zz, 0.5, 5); }
        b.use(0);
      });
    }
    await ctx.yield();

    // the tail race: the castle's water runs out under the sill toward us and into a lobed pool, under the last of the dive
    b.plan = true;
    gb1.plate(rectPts(-5.6, CZ + 2, 5.6, CZ + 74), { z: 0.9, depth: 0, col: K.blue, kind: 5, flow: -4.5, uvRot: Math.PI / 2, layer: 2 });
    for (const sx of [-1, 1]) gb1.plate(rectPts(sx * 6.3 - 0.7, CZ + 2, sx * 6.3 + 0.7, CZ + 74), { z: 1.2, depth: 0, col: K.red, layer: 3, ink: false });
    gb2.plate(lobed(-54, CZ + 70, 54, CZ + 268, 20, 0.07), { z: 1.5, depth: 0, col: K.blue, kind: 5, flow: -2.25, uvRot: Math.PI / 2, layer: 4, corner: 80 });   // the castle's lake: the low approach flies over it
    b.plan = false;
    // the castle's creatures: two falcons that lean out over two vases, two small serpents on pins, two peacocks
    const castleFalcons = [], pSerp = [];
    {
      for (const sx of [1, -1]) {
        P([[sx * 15, 23.4], [sx * 22.5, 23.4], [sx * 22.5, 22], [sx * 15, 20.6]], { z: CZ + 3.4, depth: 3.4, col: K.green, corner: 30 });
        castleFalcons.push(falcon(sx * 20.4, 23.4, CD - 4.2, sx, 1.0));
        vase(sx * 16.4, 0, CD - 4.4, 1.15);
        // a small serpent coiled once round its pin, vermilion (or the copy's accent) with hook scales and gold jaws
        const pin = [sx * 50, 72], part = S.newPart([pin[0], pin[1], CZ + 1.2], 0); pSerp.push(part);
        P(circlePts(pin[0], pin[1], 1.2, 10), { z: CZ + 2.2, depth: 0.4, col: K.gold }); b.blot(pin[0], pin[1], CZ + 2.2, 0.3, 7);
        b.use(part);
        const ctrl = [[-9.4, 5.4], [-6.2, 6.8], [-2.2, 6.2], [2.4, 3.3]];
        for (let i = 1; i <= 10; i++) { const a = 0.94 - i * (TAU * 1.1 / 10), r = 4.1 - 2.6 * i / 10; ctrl.push([Math.cos(a) * r, Math.sin(a) * r]); }
        const sp = bandPts(ctrl.map((p) => [pin[0] + p[0] * sx, pin[1] + p[1]]), 3.2, 0.7, 4, 3);
        P(sp.all, { z: CZ + 1.4, depth: 1, col: copy === 'copyist' ? K.gold : K.red, kind: 2, uvFlip: true, miss: 0.5, corner: 75 });
        const H = (pts) => pts.map((p) => [pin[0] + (p[0] - 9.6) * sx, pin[1] + 5.6 + p[1]]);
        P(H([[0.4, -1.8], [2.6, 0], [2.2, 2.6], [0, 1.6], [-4.6, 2.9], [-1.2, 0.4], [-4.8, -1.6]]), { z: CZ + 1.8, depth: 0.6, col: K.gold, corner: 30 });
        b.blot(pin[0] + (0.9 - 9.6) * sx, pin[1] + 6.1, CZ + 1.8, 0.4, 5);
        b.use(0);
        await ctx.yield();
        // a peacock of 9 m standing on the battlements
        const px = sx * 35, py = 90, T = (pts) => pts.map((p) => [px + p[0] * sx, py + p[1]]);
        P(T([[1, 3], ...arcPts(2.4, 3.6, 5.4, 6.6, -0.2, Math.PI * 0.66, 8), [0, 4.4]]), { z: CZ - 2.4, depth: 0.8, col: K.green, kind: 2, corner: 60 });
        for (let k = 0; k < 4; k++) { const a = 0.05 + k * 0.5, ex = px + (2.4 + Math.cos(a) * 4) * sx, ey = py + 3.6 + Math.sin(a) * 5; for (const zz of [CZ - 2.4, CZ - 3.2]) { b.plate(circlePts(ex, ey, 0.85, 8), { z: zz, depth: 0, col: K.gold, layer: 2 }); b.blot(ex, ey, zz, 0.3, 6); } }
        P(T([...arcPts(0.6, 3.3, 3.2, 2, Math.PI * 0.5, Math.PI * 2.2, 8)]), { z: CZ - 1, depth: 1, col: K.green, corner: 70 });
        P(T(bandPts([[-1, 3.6], [-2.8, 5], [-3, 7], [-4, 8.2]], 2, 0.9, 4, 3).all), { z: CZ - 1, depth: 1, col: K.green, corner: 70 });
        P(T([[-4.4, 8.6], [-6, 7.8], [-4.4, 7.6]]), { z: CZ - 1, depth: 0.8, col: K.gold, corner: 20 });
        b.stroke(T([[0, 1.4], [0, 0]]), CZ - 1, { layer: 3 }); b.stroke(T([[1.4, 1.4], [1.4, 0]]), CZ - 1, { layer: 3 });
      }
    }
    bare = false;
    await ctx.yield();

    // ==== THE PEOPLED PAGE: the engineer's other devices standing on the leaf, in the middle and far distance ====
    // Each is drawn once in its own units and stood on the page by a frame DV = { X, D, s, end }: an elevation facing the
    // entry at page (X, depth D), s times life size, or (end) an end elevation in the plane of the course, facing port.
    // The same helpers (tank, standpipe, falcon, vase, man) draw them, so line, fill, scallop and hook are the page's own.
    // They are the page's UNDER-DRAWING: a drawing board of their own (bCrowd), laid in thinner colour and a paler line the
    // farther they stand from the eye (the style's uFade), so the finished machines stand clear of them.
    const bCrowd = new PlateBuilder(S, rng, ctx.noise); bCrowd.blots = bMain.blots;
    // THE MIDDLE RING (bMid): the few devices, courts and figures that stand near the route are drawn like the finished
    // machines, in full ink and full colour, set out in rows with clear paper between; the far city stays under-drawing.
    const bMid = new PlateBuilder(S, rng, ctx.noise); bMid.blots = bMain.blots;
    let DV = null;
    for (const bb of [bCrowd, bMid]) {
      const map0 = bb.map.bind(bb), rib0 = bb.ribbon.bind(bb);
      bb.map = (u, v, w) => {
        if (!DV) return map0(u, v, w);
        const s = DV.s;
        if (bb.plan) return [DV.X + u * s, w, -DV.D + v * s];
        return DV.end > 1 ? [DV.X + u * s, DV.Y + v * s, -DV.D - w * s] : DV.end ? [DV.X - DV.end * w * s, DV.Y + v * s, -DV.D + u * s] : [DV.X + u * s, DV.Y + v * s, -DV.D + w * s];   // end 1 faces port, -1 starboard, 2 an elevation facing away from the entry
      };
      bb.ribbon = (Pp, o = {}) => rib0(Pp, DV && o.feat ? { ...o, feat: o.feat * DV.s } : o);   // a mark's true size on the page
    }
    b = bCrowd;
    const stand = async (X, D, s, fn, end = 0, Y = 0) => { DV = { X, D, s, end, Y }; await fn(); DV = null; b.plan = false; b.use(0); };   // a device may take a breath (ctx.yield) while it is drawn: nothing else draws meanwhile
    const freePart = (u, v, w) => (S.nParts < NPARTS - 3 ? S.newPart(b.map(u, v, w), DV && Math.abs(DV.end) === 1 ? 2 : 0) : 0);   // a pin of the device's own, while pins last
    const stripes = (x0, x1, y0, y1, z0, z1) => {              // a striped post's paper bands
      for (let y = y0 + 1, q = 0; y < y1 - 7; y += 10.5, q++) for (const zz of [z0, z1]) b.plate([[(x0 + x1) / 2, y], [x1 - 0.25, y + 3], [(x0 + x1) / 2, y + 6], [x0 + 0.25, y + 3]], { z: zz, depth: 0, col: q % 2 ? K.green : K.gold, layer: 2, corner: 20 });   // lozenge-banded
    };
    // a serpent coiled once round its pin, hook scales, gold jaws (as on the castle), drawn about pin [x, y]
    const serpentAt = (pin, sx, z, sc = 1) => {
      P(circlePts(pin[0], pin[1], 1.2 * sc, 10), { z: z + 0.8, depth: 0.4, col: K.gold }); b.blot(pin[0], pin[1], z + 0.8, 0.3 * sc, 7);
      const ctrl = [[-9.4, 5.4], [-6.2, 6.8], [-2.2, 6.2], [2.4, 3.3]];
      for (let i = 1; i <= 10; i++) { const a = 0.94 - i * (TAU * 1.1 / 10), r = 4.1 - 2.6 * i / 10; ctrl.push([Math.cos(a) * r, Math.sin(a) * r]); }
      const sp = bandPts(ctrl.map((p) => [pin[0] + p[0] * sx * sc, pin[1] + p[1] * sc]), 3.2 * sc, 0.7 * sc, 4, 3);
      P(sp.all, { z, depth: 1, col: K.red, kind: 2, uvFlip: true, miss: 0.5, corner: 75 });
      const H = (pts) => pts.map((p) => [pin[0] + (p[0] - 9.6) * sx * sc, pin[1] + (5.6 + p[1]) * sc]);
      P(H([[0.4, -1.8], [2.6, 0], [2.2, 2.6], [0, 1.6], [-4.6, 2.9], [-1.2, 0.4], [-4.8, -1.6]]), { z: z + 0.4, depth: 0.6, col: K.gold, corner: 30 });
      b.blot(pin[0] + (0.9 - 9.6) * sx * sc, pin[1] + 6.1 * sc, z + 0.4, 0.4 * sc, 5);
    };
    const heldBall = (x, y, z, r = 1.7) => { P(circlePts(x, y, r, 14), { z, depth: 0.5, col: K.gold, corner: 80 }); };
    // (a) the fountain: a basin cut open, a pipe, a bowl whose two lips pour ruled ribbons back into the basin's hinged top
    const fountain = async (k = 0) => {
      tank(-13, 0, 13, 9, 0, 6, { level: 6.4, topH: 2.6 });
      await ctx.yield();
      P(rectPts(-1.7, 9, 1.7, 30), { z: -2, depth: 2, col: K.red, miss: 0.5 });
      for (const sx of [-1, 1]) b.plate(rectPts(sx * 7.6 - 1, 11.6, sx * 7.6 + 1, 33), { z: -3.4, depth: 0, col: K.blue, kind: 1, flow: 6.3, uvRot: Math.PI / 2, layer: 1 });
      await ctx.yield();
      P([[-9.6, 36], [9.6, 36], [5, 30], [-5, 30]], { z: -1.2, depth: 3.4, col: K.green, corner: 30 });
      b.plate(circlePts(0, 0, 1, 18).map((p) => [p[0] * 8.6, 37.9 + p[1] * 1.9]), { z: -1.4, depth: 0, col: K.blue, kind: 1, flow: 0.5, layer: 1, corner: 80 });
      b.stroke([[0, 39.8], [0, 41.4]], -1.4, { layer: 4 }); heldBall(0, 43.4, -1.8, 2.3);
      await ctx.yield();
      if (k % 2) { falcon(-10.6, 36, 1.4, -1, 0.7, 0); falcon(10.6, 36, 1.4, 1, 0.7, 0); }
    };
    // (b) the candle clock: a tall vermilion sheath cut open on its gold candle, a falcon holding the hour's ball over a vase
    const candle = async (k = 0) => {
      P([[-6, 0], [6, 0], [4.6, 4], [-4.6, 4]], { z: 0.5, depth: 4, col: K.gold });
      P(rectPts(-3, 4, 3, 46), { z: 0, depth: 3, col: K.red, holes: [rectPts(-1.5, 7, 1.5, 43)], miss: 0.5, holeWalls: false });
      b.fill(rectPts(-1.5, 7, 1.5, 43), -0.7, K.paper, { kind: 3 });
      b.use(pCol[k % 3]); b.fill(rectPts(-1.5, -12, 1.5, 27), -0.4, K.gold, { layer: 1 }); b.stroke([[-1.5, 27], [1.5, 27]], -0.4, { layer: 3, over: false, feat: 6 }); b.use(0);
      for (let y = 12; y < 42; y += 5) b.stroke([[1.5, y], [0.4, y]], -0.3, { layer: 4, over: false, feat: 6 });        // the hours ruled on the sheath (marks, never writing)
      await ctx.yield();
      P([[-3.6, 46], [3.6, 46], [5.4, 50.4], [-5.4, 50.4]], { z: 0.3, depth: 3.6, col: K.green, corner: 30 });
      await ctx.yield();
      P([[3, 37], [10, 37], [10, 35.6], [3, 34.4]], { z: -0.4, depth: 2, col: K.green, corner: 30 });
      falcon(8.4, 37, 1.2, -1, 0.8, 0); heldBall(12.6, 39.4, -1.4);
      vase(13.2, 0, 1, 0.9);
      await ctx.yield();
      b.stroke([[-3, 44], [-9, 44], [-9, 20]], -1, { layer: 4 }); P(circlePts(-9, 44, 1.5, 10), { z: -0.8, depth: 0.5, col: K.gold });
      b.use(pCol[(k + 1) % 3]); P([[-10.8, 14], [-7.2, 14], [-7.8, 20], [-10.2, 20]], { z: -0.6, depth: 1.4, col: K.green, corner: 30 }); b.use(0);
    };
    await ctx.yield();
    // (c) the pot wheel: a full circle of pots face-on over its sump cut open, on an axle lying in its own plane
    const potWheel = async () => {
      tank(-19, 0, 19, 8, 1.6, 5, { level: 5.6, topH: 2.2 });
      await ctx.yield();
      const R = 15, cy = 24, part = freePart(0, cy, 0); b.use(part);
      P(circlePts(0, cy, R, 34), { z: 0, depth: 1.6, col: K.red, holes: [circlePts(0, cy, R - 3, 30)], miss: 0.5, corner: 80 });
      await ctx.yield();
      for (let q = 0; q < 4; q++) { const a = q * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a), w = 0.8, r = R - 2.8; P([[-c * r + sn * w, cy - sn * r - c * w], [c * r + sn * w, cy + sn * r - c * w], [c * r - sn * w, cy + sn * r + c * w], [-c * r - sn * w, cy - sn * r + c * w]], { z: -0.3, depth: 1, col: K.gold, corner: 30 }); }
      await ctx.yield();
      for (let q = 0; q < 24; q++) { const a = (q / 24) * TAU, a1 = a + TAU / 48, a2 = a + TAU / 24, r0 = R - 3, r1 = R - 5; for (const zz of [0.05, -1.65]) b.fill([[Math.cos(a) * r0, cy + Math.sin(a) * r0], [Math.cos(a1) * r1, cy + Math.sin(a1) * r1], [Math.cos(a2) * r0, cy + Math.sin(a2) * r0]], zz, K.ink, { layer: 4 }); }
      await ctx.yield();
      for (let q = 0; q < 10; q++) {
        const a = (q / 10) * TAU, c = Math.cos(a), sn = Math.sin(a), px = c * (R + 2), py = cy + sn * (R + 2), T = (pts) => pts.map((p) => [px + p[0] * c - p[1] * sn, py + p[0] * sn + p[1] * c]);
        P(T([[-1.7, -2.3], [1.7, -2.3], [2.2, 0.4], [1.5, 2.4], [2, 3.1], [-2, 3.1], [-1.5, 2.4], [-2.2, 0.4]]), { z: 0.5, depth: 1.6, col: K.green, corner: 40 });
        b.plate(T([[-1.3, 0.3], [1.3, 0.3], [1.1, 2.3], [-1.1, 2.3]]), { z: 0.52, depth: 0, col: K.blue, layer: 2, ink: false });
        if (q === 4) await ctx.yield();
      }
      await ctx.yield();
      P(circlePts(0, cy, 2.6, 14), { z: 0.3, depth: 2.2, col: K.gold }); b.blot(0, cy, 0.3, 0.7, 6);
      b.use(0);
      P(rectPts(-R - 7, cy - 0.9, R + 7, cy + 0.9), { z: 2, depth: 1, col: K.gold });
      for (const sx of [-1, 1]) { const px = sx * (R + 6); P(rectPts(px - 1.4, 0, px + 1.4, cy + 2.6), { z: 1, depth: 2, col: K.red, miss: 0.5 }); P(circlePts(px, cy, 2, 10), { z: 2.4, depth: 0.5, col: K.green }); }
      return part;
    };
    // (d) the float gantry: two striped posts, a gold beam with two pulleys, a float in a tank cut open and its weight
    const gantry = async (k = 0) => {
      for (const x of [-12, 12]) { P(rectPts(x - 1.5, 0, x + 1.5, 38), { z: 0, depth: 2.4, col: K.red, miss: 0.5 }); stripes(x - 1.5, x + 1.5, 5, 36, 0.02, -2.42); P(rectPts(x - 2.6, 0, x + 2.6, 1.6), { z: 0.5, depth: 3.4, col: K.gold }); }
      P(rectPts(-15.5, 38, 15.5, 41), { z: 0.5, depth: 3.4, col: K.gold });
      await ctx.yield();
      tank(-8.5, 0, 8.5, 12, 0.6, 5, { level: 8.6, topH: 2 });
      await ctx.yield();
      for (const [x, y1] of [[-4.6, 8.6], [4.6, 24]]) { b.stroke([[x, 36], [x, y1 + (x > 0 ? 0 : 6)]], -1.2, { layer: 4, over: false }); P(circlePts(x, 36, 2.5, 12), { z: -1, depth: 0.6, col: K.gold }); b.blot(x, 36, -1, 0.5, 6); }
      b.stroke([[-4.6, 38.5], [4.6, 38.5]], -1.2, { layer: 4, over: false });
      b.use(pCol[k % 3]); P([...arcPts(-4.6, 11, 3, 2.4, Math.PI, TAU, 8)], { z: -1.6, depth: 1, col: K.gold, corner: 50 }); b.stroke([[-4.6, 11], [-4.6, 15]], -1.6, { layer: 4, over: false }); b.use(0);
      b.use(pCol[(k + 1) % 3]); P([[2.4, 18], [6.8, 18], [6, 24], [3.2, 24]], { z: -1.2, depth: 1.6, col: K.green, corner: 30 }); b.use(0);
      await ctx.yield();
      falcon(k % 2 ? -8 : 8, 41, 1, k % 2 ? -1 : 1, 0.8, 0);
    };
    // (e) the servant: a turbaned automaton from behind on a plinth, a spout pouring a ruled ribbon into a vase
    const servant = async (k = 0) => {
      P(rectPts(-9, 0, 9, 5), { z: 0.4, depth: 5, col: K.green, miss: 0.5 }); for (const x of [-6, 0, 6]) P(circlePts(x, 2.5, 1.1, 10), { z: 0.6, depth: 0, col: K.gold, layer: 2 });
      man(0, 5, 1, 1.25);
      await ctx.yield();
      P([[5, 20.6], [12.6, 20.6], [12.6, 18.6], [11.2, 18.6], [11.2, 19.4], [5, 19.4]], { z: -0.6, depth: 1.6, col: K.gold, corner: 40 });
      b.plate(rectPts(11.3, 8, 12.5, 18.6), { z: -1, depth: 0, col: K.blue, kind: 1, flow: 5.5, uvRot: Math.PI / 2, layer: 1 });
      await ctx.yield();
      vase(12, 0, 0.6, 1.05);
      standpipe(-14, 0.4, 15 + (k % 3) * 4, k % 3);
    };
    // (f) falcon, ball, serpent, vase on one post: the plot of the page as a single device
    const serpentPost = async (sx = 1) => {
      P(rectPts(-2, 0, 2, 31), { z: 0, depth: 2.6, col: K.red, miss: 0.5 }); stripes(-2, 2, 5, 29, 0.02, -2.62);
      P([[-3.4, 0], [3.4, 0], [2.6, 2.6], [-2.6, 2.6]], { z: 0.5, depth: 3.6, col: K.gold });
      P([[-2, 31], [2, 31], [3.6, 34.4], [-3.6, 34.4]], { z: 0.3, depth: 3.2, col: K.green, corner: 30 });
      P([[sx * 2, 29.6], [sx * 10, 29.6], [sx * 10, 28.2], [sx * 2, 26.6]], { z: -0.4, depth: 1.8, col: K.green, corner: 30 });
      await ctx.yield();
      falcon(sx * 8.2, 29.6, 1, -sx, 0.8, 0); heldBall(sx * 12.2, 31.6, -1.3);
      P([[sx * 2, 17], [sx * 13.5, 17.6], [sx * 13.5, 16.4], [sx * 2, 15]], { z: -1.6, depth: 1, col: K.gold, corner: 30 });
      await ctx.yield();
      serpentAt([sx * 13, 17], -sx, -1.2, 1.05);
      await ctx.yield();
      vase(sx * 21, 0, 0.8, 0.95);
    };
    // (g) the arcade: a crenellated front cut open in arches on bare paper, a roundel over every pier (the castle's kin)
    const arcade = async (n = 4, castleCol = castleCol0, castleAcc = castleAcc0) => {
      const hw = n * 6 + 3, Hh = 30, front = [[-hw, 0], [hw, 0], [hw, Hh]], m = Math.round(hw / 3);
      for (let q = 0; q < m; q++) { const x1 = hw - q * (2 * hw / m), w2 = hw / m; front.push([x1, Hh + 3.4], [x1 - w2, Hh + 3.4], [x1 - w2, Hh], [x1 - 2 * w2, Hh]); }
      const holes = []; for (let q = 0; q < n; q++) { const cx = -hw + 9 + q * 12; holes.push([[cx - 4, 1.2], [cx + 4, 1.2], ...arcPts(cx, 13, 4, 5, 0, Math.PI, 8)]); }
      P(front, { z: 0, depth: 4, col: castleCol, holes, miss: 0.8, holeWalls: false, back: false }); await ctx.yield(); b.fill(front, -4, K.paper, { kind: 3 });
      await ctx.yield();
      b.stroke([[-hw, 22.6], [hw, 22.6]], 0, { layer: 4 });
      for (let q = 0; q <= n; q++) { const x = -hw + 3 + q * 12; b.plate(circlePts(x, 26.2, 1.9, 12), { z: 0.3, depth: 0.4, col: col(q % 2 ? castleAcc : K.gold), kind: kindOf(q % 2 ? castleAcc : K.gold), edge: K.gold, layer: 2 }); }
      await ctx.yield();
      for (let q = 0; q < n; q++) { const cx = -hw + 9 + q * 12; if (q % 2) vase(cx, 1.2, 2.4, 0.7); else b.plate(rectPts(cx - 1, 1.2, cx + 1, 17.4), { z: -2.4, depth: 0, col: K.blue, kind: 1, flow: 5.3, uvRot: Math.PI / 2, layer: 1 }); }
    };
    // (h) a stand of pipes: three standpipes cut open on their climbing columns
    const pipes3 = async (k = 0) => { standpipe(-7.5, 0, 20 + (k % 2) * 6, k % 3); await ctx.yield(); standpipe(0, 0.4, 33 - (k % 3) * 4, (k + 1) % 3); await ctx.yield(); standpipe(7.5, 0, 15 + (k % 4) * 3, (k + 2) % 3); };
    const skyArcade = (n) => arcade(n, castleAcc0, castleCol0);          // the page's far walls, in the castle's other pigment so the castle stands clear of them
    await ctx.yield();
    // ---- FIGURES in the manuscript's hand, at small scale: a robe ruled with hook folds, a gold sash, a turban, the plain
    // gold disc behind the head; no face on any side. An arm carries an ewer (and pours into a cup), a horn, a drumstick,
    // a staff with a pennant, or is lifted; some arms move on a pin of their own.
    const figArms = [], rockers = [];
    const fig = (x, y, d, sc = 1, o = {}) => {
      const fl = o.flip ? -1 : 1, T = (pts) => pts.map((p) => [x + p[0] * sc * fl, y + p[1] * sc]), z = -d, rc = o.col || K.red, zz = z + 0.5;
      P(circlePts(x, y + 14.2 * sc, 3.8 * sc, 14), { z: z - 0.5, depth: 0.3, col: K.gold });
      P(T([[-4.8, 0], [4.8, 0], [4.2, 3], [3.4, 8], [3.1, 11.6], [-3.1, 11.6], [-3.4, 8], [-4.2, 3]]), { z, depth: 1.4, col: rc, kind: 2, uvFlip: true, miss: 0.5 });
      b.plate(T(rectPts(-3.5, 6.3, 3.5, 7.5)), { z: z + 0.04, depth: 0, col: K.gold, layer: 2 });
      b.plate(T([...arcPts(0, 14.1, 2.8, 2.4, -0.5, Math.PI + 0.5, 9), [-1.5, 11.5], [1.5, 11.5]]), { z: z + 0.3, col: K.paper, kind: 3, layer: 2, corner: 50 });
      for (let k = 0; k < 2; k++) b.stroke(T(arcPts(0.4 - k * 0.6, 12.8 + k * 1.2, 2.4 - k * 0.6, 1.4, 0.3, Math.PI - 0.5, 4)), z + 0.3, { layer: 5 });
      const arm = o.arm || 'ewer';
      if (arm === 'ewer') {                                 // the cup on the floor and the ruled ribbon falling into it stay still
        P(T([[9.4, 0], [12.6, 0], [13.4, 2.4], [8.6, 2.4]]), { z: zz, depth: 1, col: K.gold, corner: 30 });
        b.plate(T(rectPts(10.4, 2.2, 11.6, 8)), { z: zz - 0.3, depth: 0, col: K.blue, kind: 1, flow: 5.5, uvRot: Math.PI / 2, layer: 1 });
      }
      if (arm === 'drum') { P(circlePts(x + 6.4 * sc * fl, y + 7.6 * sc, 2.7 * sc, 12), { z: zz, depth: 0.8, col: K.gold }); b.plate(circlePts(x + 6.4 * sc * fl, y + 7.6 * sc, 1.7 * sc, 10), { z: zz + 0.05, depth: 0, col: K.paper, kind: 3, layer: 2 }); }
      if (arm === 'staff') { P(T(rectPts(5.7, 0, 6.5, 21)), { z: zz - 0.2, depth: 0.5, col: K.gold }); P(T([[6.5, 20.6], [12.4, 18.8], [6.5, 16.6]]), { z: zz - 0.2, depth: 0.3, col: o.flag || K.green, corner: 20 }); }
      const part = o.move ? freePart(x + 2.6 * sc * fl, y + 10.4 * sc, zz) : 0;
      if (part) { b.use(part); figArms.push({ part, amp: 0.3 * fl * (arm === 'up' ? 1.6 : 1), w: 0.9 + (figArms.length % 4) * 0.27, ph: figArms.length * 1.9 }); }
      if (arm === 'ewer') {
        P(T([[2.2, 11.2], [7.4, 10], [7.7, 8.4], [2.6, 8.5]]), { z: zz, depth: 0.5, col: rc, corner: 30 });
        P(T([[7.4, 7.6], [10, 7.6], [10.5, 9.4], [9.7, 10.8], [10.2, 12.2], [11.9, 9.2], [12.5, 9.6], [10.4, 13.4], [7.8, 13.4], [8.2, 10.8], [7, 9.4]]), { z: zz + 0.2, depth: 0.6, col: K.gold, corner: 30 });
      } else if (arm === 'up') {
        P(T([[2.2, 11.3], [6.2, 15.8], [7.6, 14.8], [3, 9.2]]), { z: zz, depth: 0.5, col: rc, corner: 30 });
        b.plate(circlePts(x + 7.2 * sc * fl, y + 15.9 * sc, 0.9 * sc, 8), { z: zz + 0.1, depth: 0, col: K.paper, kind: 3, layer: 2 });
      } else if (arm === 'horn') {
        P(T([[2.2, 11.2], [5.4, 12.6], [5.7, 11.1], [2.6, 9.2]]), { z: zz, depth: 0.5, col: rc, corner: 30 });
        P(T([[2, 13.3], [10.4, 16.8], [11.5, 19.2], [12.9, 15], [10.9, 15.7], [2.4, 12.4]]), { z: zz + 0.2, depth: 0.5, col: K.gold, corner: 30 });
      } else if (arm === 'drum') {
        P(T([[2.2, 11.2], [6, 12.8], [6.5, 11.4], [2.6, 9.4]]), { z: zz, depth: 0.5, col: rc, corner: 30 });
        b.stroke(T([[6.1, 12.2], [7.4, 9.9]]), zz + 0.3, { layer: 5 });
      } else if (arm === 'staff') {
        P(T([[2.2, 11.2], [5.9, 10.7], [6, 9.2], [2.6, 9]]), { z: zz, depth: 0.5, col: rc, corner: 30 });
      }
      if (part) b.use(0);
    };
    // (i) the boat of musicians: a vermilion hull with a gold gunwale riding a pool cut open (or the lake), four players under
    // a gold canopy on verdigris posts; the whole boat rocks on one pin
    const boat = async (onLake = 0) => {
      const y0 = onLake ? -1 : 5.4;
      if (!onLake) { tank(-25, 0, 25, 8.6, 0.6, 6, { level: 6.4, topH: 2.8 }); await ctx.yield(); }
      const part = freePart(0, y0 + 3, 0); if (part) rockers.push(part); b.use(part);
      const lowA = arcPts(0, y0 + 9.5, 23, 9.5, Math.PI + 0.1, TAU - 0.1, 12);
      P([...lowA, [16.5, y0 + 6.2], [-16.5, y0 + 6.2]], { z: 0, depth: 2.4, col: K.red, miss: 0.5, corner: 60 });
      for (const zz of [0.04, -2.44]) b.plate(rectPts(-16.2, y0 + 4.6, 16.2, y0 + 5.9), { z: zz, depth: 0, col: K.gold, layer: 2 });
      b.stroke(arcPts(0, y0 + 9.5, 19, 7, Math.PI + 0.45, TAU - 0.45, 8), 0.04, { layer: 4 });
      await ctx.yield();
      const arms = ['horn', 'drum', 'up', 'horn'];
      for (let q = 0; q < 4; q++) { fig(-10.5 + q * 7, y0 + 6.2, 0.9, 0.52, { arm: arms[q], col: q % 2 ? K.green : K.red, flip: q > 1 }); if (q === 1) await ctx.yield(); }
      for (const sx of [-1, 1]) P(rectPts(sx * 15 - 0.7, y0 + 6.2, sx * 15 + 0.7, y0 + 22), { z: -0.4, depth: 1.4, col: K.green });
      P([[-18.5, y0 + 22], [18.5, y0 + 22], [14, y0 + 26.6], [-14, y0 + 26.6]], { z: 0.2, depth: 2.6, col: K.gold, corner: 30 });
      for (let q = 0; q < 5; q++) for (const zz of [0.24, -2.44]) b.plate(circlePts(-12 + q * 6, y0 + 24.2, 1.2, 8), { z: zz, depth: 0, col: q % 2 ? K.green : K.red, layer: 2, corner: 80 });
      P(rectPts(-0.4, y0 + 26.6, 0.4, y0 + 34), { z: -0.6, depth: 0.5, col: K.gold }); P([[0.4, y0 + 34], [7, y0 + 32.2], [0.4, y0 + 30]], { z: -0.6, depth: 0.3, col: K.green, corner: 20 });
      b.use(0);
    };
    // (j) the pump house: a vermilion house cut open on its sump, two gold cylinders worked by a toothed crank, two verdigris
    // risers to a tank on the roof (its top hinged up), and a spout whose two lips pour ruled ribbons back into it
    let pumpGear = 0;
    const pumpHouse = async () => {
      P(rectPts(-22, 0, 22, 40), { z: 0, depth: 5, col: K.red, holes: [rectPts(-19.5, 2.5, 19.5, 37.5)], miss: 0.7, holeWalls: false });
      b.fill(rectPts(-19.5, 2.5, 19.5, 37.5), -4.9, K.paper, { kind: 3 });
      b.plate(rectPts(-19.5, 2.5, 19.5, 9.5), { z: -0.6, depth: 0, col: K.blue, kind: 1, flow: 0.5, layer: 1 });
      await ctx.yield();
      for (const sx of [-1, 1]) {
        P(rectPts(sx * 14 - 1.3, 5, sx * 14 + 1.3, 15), { z: -1.6, depth: 1.4, col: K.green });
        P(rectPts(sx * 12 - 6, 15, sx * 12 + 6, 21.4), { z: -1, depth: 2, col: K.gold });
        b.stroke([[sx * 6, 18.2], [sx * 0.8, 18.2 + sx * 1.6]], -0.7, { layer: 4, over: false });
        P(rectPts(sx * 14 - 1.3, 21.4, sx * 14 + 1.3, 40), { z: -1.6, depth: 1.4, col: K.green, miss: 0.5 });
      }
      await ctx.yield();
      pumpGear = freePart(0, 18.2, -0.6); b.use(pumpGear);
      P(circlePts(0, 18.2, 4.4, 16), { z: -0.6, depth: 1, col: K.gold, corner: 80 });
      for (let q = 0; q < 12; q++) { const a = (q / 12) * TAU, a1 = a + TAU / 24, a2 = a + TAU / 12; b.fill([[Math.cos(a) * 4.4, 18.2 + Math.sin(a) * 4.4], [Math.cos(a1) * 6, 18.2 + Math.sin(a1) * 6], [Math.cos(a2) * 4.4, 18.2 + Math.sin(a2) * 4.4]], -0.55, K.ink, { layer: 4 }); }
      b.blot(0, 18.2, -0.55, 0.7, 6); b.use(0);
      await ctx.yield();
      tank(-18, 40, 18, 50, 0.4, 4, { level: 46.8, topH: 2.6 });
      await ctx.yield();
      P(rectPts(-1.3, 50, 1.3, 63), { z: 0.6, depth: 1.6, col: K.red, miss: 0.5 });
      P([[-1.3, 63], [1.3, 63], [5.6, 67.4], [-5.6, 67.4]], { z: 0.8, depth: 2.4, col: K.green, corner: 30 });
      for (const sx of [-1, 1]) b.plate(rectPts(sx * 4 - 0.9, 53.6, sx * 4 + 0.9, 65.2), { z: -0.2, depth: 0, col: K.blue, kind: 1, flow: 6.2, uvRot: Math.PI / 2, layer: 1 });
      for (const x of [-15, -5, 5, 15]) P(circlePts(x, 43, 1.1, 10), { z: 0.5, depth: 0, col: K.gold, layer: 2 });
    };
    // (k) the peacock basin, small: a verdigris bird with gold tail eyes on the rim of a basin cut open, pouring from its beak
    const peacockBasin = async (sx = 1) => {
      tank(-13, 0, 13, 9, 0, 6, { level: 6.4, topH: 2.6 });
      await ctx.yield();
      const sc = 2.1, px = 5 * sx, py = 9, T = (pts) => pts.map((p) => [px + p[0] * sx * sc, py + p[1] * sc]), G = K.green;
      P(T([[1, 3], ...arcPts(2.4, 3.6, 5.4, 6.6, -0.2, Math.PI * 0.66, 8), [0, 4.4]]), { z: -1.4, depth: 0.8, col: G, kind: 2, corner: 60 });
      for (let k = 0; k < 4; k++) { const a = 0.05 + k * 0.5, e = T([[2.4 + Math.cos(a) * 4, 3.6 + Math.sin(a) * 5]])[0]; for (const zz of [-1.4, -2.2]) { b.plate(circlePts(e[0], e[1], 0.85 * sc, 8), { z: zz, depth: 0, col: K.gold, layer: 2 }); b.blot(e[0], e[1], zz, 0.3 * sc, 6); } }
      await ctx.yield();
      P(T([...arcPts(0.6, 3.3, 3.2, 2, Math.PI * 0.5, Math.PI * 2.2, 8)]), { z: 0, depth: 1, col: G, kind: 2, corner: 70 });
      P(T(bandPts([[-1, 3.6], [-2.8, 5], [-3, 7], [-4, 8.2]], 2, 0.9, 4, 3).all), { z: 0, depth: 1, col: G, corner: 70 });
      P(T([[-4.4, 8.6], [-6, 7.8], [-4.4, 7.6]]), { z: 0, depth: 0.8, col: K.gold, corner: 20 });
      b.stroke(T([[0, 1.4], [0, 0]]), 0, { layer: 3 }); b.stroke(T([[1.4, 1.4], [1.4, 0]]), 0, { layer: 3 });
      const bx = px - 6 * sx * sc;
      b.plate(rectPts(bx - 0.8, 12.4, bx + 0.8, py + 7.7 * sc), { z: -0.5, depth: 0, col: K.blue, kind: 1, flow: 6.4, uvRot: Math.PI / 2, layer: 1 });
    };
    // a banner: a gold staff with a ball, a pennant in the copy's pigment and a smaller gold one under it
    const banner = (x, y0, h, z, c, sx = 1) => {
      P(rectPts(x - 0.5, y0, x + 0.5, y0 + h), { z, depth: 0.8, col: K.gold });
      P([[x + 0.5 * sx, y0 + h], [x + 12 * sx, y0 + h - 2.8], [x + 0.5 * sx, y0 + h - 6.4]], { z, depth: 0.4, col: c, corner: 20 });
      P([[x + 0.5 * sx, y0 + h - 8.4], [x + 7.5 * sx, y0 + h - 10.4], [x + 0.5 * sx, y0 + h - 12.6]], { z, depth: 0.4, col: K.gold, corner: 20 });
      heldBall(x, y0 + h + 1.5, z, 1.5);
    };
    // the twelfth hour (rare): a falcon on every other merlon, so that sixty balls can fall in front of us at once
    const rareFalcons = [];
    b = bMain;
    if (rare) for (let k = 0; k < 10; k++) { const X = (k < 5 ? -1 : 1) * (7.5 + (k % 5) * 10 + ((k % 5) >= 3 ? 10 : 0)); rareFalcons.push(falcon(X, 90, CD + 2, X > 0 ? 1 : -1, 0.9)); }
    b = bCrowd;
    // ---- where they stand. [device, page X, depth D, scale, arg, end elevation]. Far ones are drawn larger, as he drew what
    // mattered larger; none stands within 35 m of the route, and the wedge from the entry to the elephant is left clear.
    const DEVICES = [
      // port of the approach and beyond the head
      [gantry, -205, 592, 1.5, 1],
      [pipes3, -160, 606, 1.5, 0], [potWheel, -305, 610, 2.0], [candle, -372, 470, 2.0, 1], [arcade, -430, 705, 2.2, 5], [fountain, -300, 760, 2.0, 0],
      // starboard of the approach and beyond the tail
      [candle, 204, 442, 1.7, 2], [servant, 244, 505, 1.5, 1],
      [pipes3, 332, 472, 1.8, 1], [potWheel, 262, 604, 2.0], [arcade, 432, 722, 2.2, 5], [candle, 330, 640, 2.2, 1],
      // end elevations facing port: what the turn round the head and the way in under the trunk look at
      [serpentPost, 96, 396, 1.0, 1], [gantry, 132, 452, 0.9, 1], [potWheel, 196, 404, 1.4, 0],
      // along the trough and round the castle
      [candle, -152, 762, 1.8, 0], [serpentPost, -132, 852, 1.5, 1], [potWheel, -236, 842, 2.2], [gantry, -202, 944, 1.8, 0],
      [fountain, -108, 982, 1.3, 0], [candle, -252, 1062, 2.2, 1], 
      [candle, 216, 862, 2.0, 2], [serpentPost, 176, 962, 1.6, -1], [pipes3, 242, 1012, 2.0, 0], 
      // far, large: the page's distance
      [potWheel, -335, 1185, 2.6], [fountain, -476, 1005, 2.4, 1], [gantry, 424, 985, 2.4, 0], [candle, 300, 1190, 2.6, 0], [serpentPost, -180, 1200, 2.2, 1],
      // THE SKYLINE: where the paper would stand empty above the devices the page's far edge is built up, as stage flats
      // facing the entry: great arcaded walls, stands of pipes, candle clocks and pot wheels five and six times life size
      [skyArcade, -372, 1345, 5, 4], [skyArcade, 384, 1356, 5, 4], [skyArcade, -660, 650, 4, 4], [skyArcade, 668, 706, 4, 4],
      [skyArcade, -716, 985, 5, 4], [skyArcade, 722, 1024, 5, 4], [pipes3, -548, 826, 6, 0], [pipes3, 572, 866, 6, 1], [candle, -536, 1136, 5, 0],
      [candle, 552, 1166, 5, 1], [potWheel, -612, 1262, 5], [potWheel, 648, 1290, 5], [candle, -470, 560, 3.6, 2], [pipes3, 486, 600, 4.2, 2],
      [pipes3, -288, 700, 4.6, 1], [candle, 352, 730, 4.2, 0],
      // beside the entry: the first things passed
      [candle, -92, 120, 1.0, 0], [fountain, 88, 128, 1.0, 1], [pipes3, -156, 150, 1.3, 0],
      [candle, -330, 330, 2.4, 0], [potWheel, -420, 180, 2.6], [pipes3, -560, 40, 3.5, 1],
      // behind the entry too (the turn at the tower's back looks down the page that way)
      [candle, -240, -40, 2.2, 0], [pipes3, 200, -80, 2.4, 1], [potWheel, -60, -260, 3.2], [fountain, 330, -300, 3.2, 0], [gantry, -420, -280, 3.4, 1],
      [skyArcade, -700, -520, 4, 4], [skyArcade, 660, -560, 4, 4], [candle, 40, -640, 5, 1], [pipes3, -330, -820, 5.5, 0], [potWheel, 420, -860, 5.5],
      [skyArcade, 0, -1150, 6, 5], [candle, -820, -1100, 6, 2], [fountain, 860, -1120, 6, 1],
      // THE RANKS UP THE PAGE: the leaf tips up, so what is farther stands higher; rank on rank of his devices, the far ones
      // drawn many times life size (they come out small and thin-lined), fill the page to its top edge
      [pipes3, -900, 420, 5, 0], [candle, 920, 500, 5, 1], [potWheel, -960, 760, 5.5], [fountain, 980, 860, 6, 0], [gantry, -1010, 1100, 6, 1], [candle, 1050, 1210, 6, 2],
      [skyArcade, -1240, 640, 5, 4], [skyArcade, 1260, 700, 5, 4], [fountain, -760, 1180, 5, 1], [pipes3, 800, 1420, 6, 2],
      [candle, -905, 1640, 6, 0], [pipes3, -525, 1620, 6, 1], [gantry, 565, 1650, 6, 0], [serpentPost, 935, 1640, 6, -1],
      [skyArcade, -1150, 1930, 6, 5], [candle, -720, 1900, 7, 1], [potWheel, -390, 1940, 7], [fountain, 445, 1930, 7, 0], [candle, 805, 1900, 7, 2], [skyArcade, 1190, 1950, 6, 5],
      [pipes3, -1300, 2260, 8, 1], [potWheel, -780, 2290, 8], [gantry, 790, 2290, 8, 1], [pipes3, 1310, 2260, 8, 2],
    ];
    const devWheels = [];
    for (let i = 0; i < DEVICES.length; i++) {
      const [fn, X, D, s, arg, end] = DEVICES[i];
      if (detail < 0.8 && i % 4 === 3 && s < 2) continue;          // phones: a quarter of the smaller ones are left out
      await stand(X, D, s, async () => { const r = await fn(arg); if (fn === potWheel && r) devWheels.push({ part: r, sp: (i % 2 ? 1 : -1) * (0.3 - s * 0.05) }); }, end ? 1 : 0);
      await ctx.yield();
    }
    // inside the elephant, on the walls of the shaft up to the tower (a bare paper box until now): a candle clock and a
    // falcon-and-serpent post on the head wall, a pot wheel between the two standpipes on the back wall, all standing on the
    // vermilion band round the shaft's foot
    await stand(-11.4, HZ - 9, 0.52, () => candle(1), -1, 66); await stand(-11.6, HZ + 9, 0.56, () => serpentPost(1), -1, 66);
    await stand(11, HZ + 16.6, 0.5, async () => { const r = await potWheel(); if (r) devWheels.push({ part: r, sp: 0.5 }); }, 0, 66);
    await stand(27, HZ - 17, 0.48, () => fountain(1), 2, 66); await stand(-3, HZ - 17.2, 0.46, () => gantry(0), 2, 66);      // on the front wall, seen from inside
    await stand(34, HZ, 0.5, () => pipes3(1), 1, 66);                                                                // on the tail wall
    await ctx.yield();
    // the castle's two wings (in the copy's colours, unfinished where the castle is)
    bare = copy === 'unfinished';
    b = bMid;                                         // finished work, in the castle's other pigment so the castle stands clear of them
    await stand(-138, CD + 12, 2.0, () => arcade(4, castleAcc0, castleCol0)); await ctx.yield(); b = bMid; await stand(138, CD + 12, 2.0, () => arcade(4, castleAcc0, castleCol0));
    bare = false; b = bCrowd;
    await ctx.yield();
    // ---- THE HOUR ARC: the castle clock's dial built across the page behind it, as he drew the great arc of the hours over
    // his castle: a band of bare paper between vermilion rules, twelve plain roundels (filled to the hour, as on the castle),
    // and the gold disc that marks the hour riding slowly along it with its small paper moon. Nothing is written on it.
    var pSun = S.newPart([0, 0, -1240], 0);
    b = bMid;                                         // the arc of the hours is finished work: full ink and colour
    {
      const z = -1240, R0 = 214, R1 = 250, A0 = 0.03, A1 = Math.PI - 0.03;
      b.plate([...arcPts(0, 0, R1, R1, A0, A1, 48), ...arcPts(0, 0, R0, R0, A1, A0, 44)], { z, depth: 0, col: K.paper, kind: 3, corner: 80 });
      for (const [ra, rb] of [[R1 + 3, R1 + 8], [R0 - 8, R0 - 3]]) b.plate([...arcPts(0, 0, rb, rb, A0, A1, 48), ...arcPts(0, 0, ra, ra, A1, A0, 48)], { z, depth: 0, col: K.red, ink: false });
      for (let k = 0; k < 12; k++) {
        const a = A1 - (k + 0.5) / 12 * (A1 - A0), x = Math.cos(a) * 232, y = Math.sin(a) * 232, filled = k < hour, pig = k < 6 ? K.red : K.green;
        b.plate(circlePts(x, y, 13, 20), { z: z + 0.5, depth: 0, col: filled ? pig : K.paper, kind: filled ? 0 : 3, layer: 2, corner: 80 });
        b.plate(circlePts(x, y, 4.2, 12), { z: z + 0.6, depth: 0, col: K.gold, layer: 4, corner: 80 });
      }
      for (const sx of [-1, 1]) { P(rectPts(sx * 232 - 30, 0, sx * 232 + 30, 9), { z: z + 2, depth: 6, col: K.gold }); P([[sx * 232 - 24, 9], [sx * 232 + 24, 9], [sx * 232 + 20, 15], [sx * 232 - 20, 15]], { z: z + 2, depth: 6, col: K.green, corner: 30 }); }
      b.use(pSun);
      const sa = 1.12, sx = Math.cos(sa) * 170, sy = Math.sin(sa) * 170;
      b.plate(circlePts(sx, sy, 31, 30), { z: z + 1.2, depth: 0, col: K.gold, layer: 5, corner: 80 });
      b.stroke(circlePts(sx, sy, 24, 26), z + 1.2, { closed: true, layer: 9, corner: 80 }); b.plate(circlePts(sx, sy, 7, 14), { z: z + 1.3, depth: 0, col: K.red, layer: 9, corner: 80 });
      const ma = 2.02, mx = Math.cos(ma) * 170, my = Math.sin(ma) * 170;
      b.plate([...arcPts(mx, my, 19, 19, -1.9, 1.9, 16), ...arcPts(mx + 9.5, my, 14.5, 14.5, 2.25, -2.25, 12)], { z: z + 1.2, depth: 0, col: K.paper, kind: 3, layer: 5, corner: 50 });
      b.use(0);
    }
    b = bCrowd;
    await ctx.yield();
    // ==== THE MIDDLE RING: where the camera lingers, a few of his devices stand finished, in rows and courts ====
    // [device, page X, depth D, scale, arg]. Each stands whole with clear paper round it and none stands across the hero.
    const MID = [
      // the approach: two fountains inside the first gateway, a candle clock and a pot wheel outside it, the boat of
      // musicians on its pool across the channel from the peacock
      [fountain, -58, 252, 0.95, 1], [fountain, 58, 252, 0.95, 1], [candle, -135, 250, 1.2, 0], [potWheel, 135, 250, 1.2], [boat, -84, 345, 1.15, 0],
      // either side of the elephant
      [fountain, -215, 420, 1.6, 1], [servant, -246, 486, 1.4, 0, 1], [candle, -236, 524, 1.8, 0], [gantry, -240, 436, 1.3, 1, 1], [serpentPost, 126, 402, 1.3, -1], [fountain, 166, 522, 1.6, 0],
      // the wheel's court: two rows to starboard of the trough, and the pump house beside the great wheel
      [candle, 128, 700, 1.3, 1], [fountain, 188, 700, 1.3, 0], [servant, 134, 784, 1.25, 1], [gantry, 194, 784, 1.3, 0], [pumpHouse, 181, 842, 1.2, 0], [fountain, -110, 720, 1.3, 1],
      // the castle's forecourt: a boat on the lake, two peacock basins by the tail race, a fountain before each wing
      [boat, -30, 962, 1.0, 1], [peacockBasin, -42, 1046, 1.0, -1], [peacockBasin, 42, 1046, 1.0, 1], [fountain, -84, 1056, 0.9, 0], [fountain, 84, 1056, 0.9, 0],
    ];
    b = bMid;
    for (let i = 0; i < MID.length; i++) {
      const [fn, X, D, s, arg, end] = MID[i];                // end 1: an end elevation, in the plane of the course (what the turn at the tower's back looks at)
      await stand(X, D, s, async () => { const r = await fn(arg); if (fn === potWheel && r) devWheels.push({ part: r, sp: 0.3 }); }, end || 0);
      b = bMid; await ctx.yield();
    }
    if (pumpGear) devWheels.push({ part: pumpGear, sp: 0.8 });
    // the people of the page (page X, depth, scale): gate-keepers with staffs, servants pouring from ewers, watchers who lift an arm
    const G2 = K.green;
    const FIGS = [
      [-46, 178, 1, { arm: 'staff' }], [46, 178, 1, { arm: 'staff', flip: true, flag: K.red, col: G2 }], [-34, 266, 1, { arm: 'ewer', col: G2, move: true }], [34, 266, 1, { arm: 'ewer', flip: true, move: true }],
      [-46, 350, 1, { arm: 'up', flip: true, move: true }], [44, 358, 1, { arm: 'ewer', col: G2 }],
      [-64, 452, 1.1, { arm: 'up', move: true }], [-80, 468, 1.1, { arm: 'ewer', col: G2 }], [64, 452, 1.1, { arm: 'ewer', flip: true, move: true }], [80, 468, 1.1, { arm: 'up', flip: true, col: G2 }],
      [36, 826, 1.1, { arm: 'up', move: true }], [130, 826, 1.1, { arm: 'ewer', flip: true, col: G2 }], [146, 846, 1.1, { arm: 'up', move: true, col: G2 }], [216, 846, 1.1, { arm: 'staff', flip: true }],
      [-13, 1030, 1, { arm: 'staff' }], [13, 1030, 1, { arm: 'staff', flip: true }], [-27, 1066, 1, { arm: 'ewer', col: castleAcc0, move: true }], [27, 1066, 1, { arm: 'ewer', flip: true, col: castleAcc0, move: true }],
    ];
    for (let i = 0; i < FIGS.length; i++) { const [X, D, sc, o] = FIGS[i]; fig(X, 0, D, sc, o); if (i % 3 === 2) await ctx.yield(); }
    // on the castle itself (in the copy's colours): a gallery of seven players on the string course, a banner on each corner
    b = bMain; bare = copy === 'unfinished';
    P(rectPts(-45, 65.2, 5, 66.5), { z: CZ + 3, depth: 3, col: K.gold }); P(rectPts(23, 65.2, 43, 66.5), { z: CZ + 3, depth: 3, col: K.gold });
    [-40, -30, -20, -10, 0, 28, 38].forEach((X, q) => fig(X, 66.5, CD - 2.4, 0.7, { arm: q % 2 ? 'drum' : 'horn', col: castleAcc0, move: q % 2 === 1, flip: X > 10 }));
    await ctx.yield();
    banner(-57.5, 84, 28, CZ - 3, castleAcc0, -1); banner(57.5, 90, 22, CZ - 3, castleAcc0, 1);
    bare = false; b = bCrowd;
    await ctx.yield();
    // ---- the page's own ground: scallop water in plan (pools at the devices' feet, canals between them) and vermilion rules
    b.plan = true;
    // the paved court: the middle of the leaf, from the entry to the castle's sill, is ruled in squares with a diamond on
    // every crossing (kind 7), inside a double vermilion rule. Pools, channels and the lake lie on it.
    gb0.plate(rectPts(-196, -1092, 196, -96), { z: 0.3, depth: 0, col: K.red, kind: 7, ink: false, layer: 0 });
    for (const [e, w] of [[0, 1.6], [5.4, 0.8]]) {
      for (const sx of [-1, 1]) gb1.plate(rectPts(sx * (196 - e) - w, -1092, sx * (196 - e) + w, -96), { z: 0.55, depth: 0, col: K.red, ink: false, layer: 1 });
      for (const dd of [96 + e, 1092 - e]) gb1.plate(rectPts(-196, -dd - w, 196, -dd + w), { z: 0.55, depth: 0, col: K.red, ink: false, layer: 1 });
    }
    // round it, to the leaf's edges, the same court at three times the measure (the far registers of the page)
    for (const [x0, x1, d0, d1] of [[-1560, -196, -1600, 2560], [196, 1560, -1600, 2560], [-196, 196, -1600, 96], [-196, 196, 1092, 2560]])
      gb0.plate(rectPts(x0, -d1, x1, -d0), { z: 0.3, depth: 0, col: K.red, kind: 7, ink: false, layer: 0, uvScale: 1 / 3 });
    await ctx.yield();
    const pool = (X, D, rx, rz, n = 12) => gb2.plate(lobed(X - rx, -D - rz, X + rx, -D + rz, n, 0.09), { z: 1.5, depth: 0, col: K.blue, kind: 5, flow: 1.4, uvRot: Math.PI / 2, layer: 4, corner: 80 });
    const canal = (x0, d0, x1, d1, w = 4.5) => {              // axis-aligned: along the course or across it, with two vermilion banks
      const along = Math.abs(d1 - d0) > Math.abs(x1 - x0), xa = Math.min(x0, x1), xb = Math.max(x0, x1), da = Math.min(d0, d1), db = Math.max(d0, d1);
      if (along) { gb1.plate(rectPts(xa - w, -db, xa + w, -da), { z: 0.9, depth: 0, col: K.blue, kind: 5, flow: 2.6, uvRot: Math.PI / 2, layer: 2 }); for (const sx of [-1, 1]) gb1.plate(rectPts(xa + sx * (w + 0.9) - 0.7, -db, xa + sx * (w + 0.9) + 0.7, -da), { z: 1.2, depth: 0, col: K.red, layer: 3, ink: false }); }
      else { gb1.plate(rectPts(xa, -da - w, xb, -da + w), { z: 0.9, depth: 0, col: K.blue, kind: 5, flow: 2.6, layer: 2 }); for (const sx of [-1, 1]) gb1.plate(rectPts(xa, -da + sx * (w + 0.9) - 0.7, xb, -da + sx * (w + 0.9) + 0.7), { z: 1.2, depth: 0, col: K.red, layer: 3, ink: false }); }
    };
    const rule = (x0, d0, x1, d1) => { for (const o of [0, 4]) { const e = 0.5; if (Math.abs(d1 - d0) > Math.abs(x1 - x0)) gb1.plate(rectPts(x0 + o - e, -Math.max(d0, d1), x0 + o + e, -Math.min(d0, d1)), { z: 0.6, depth: 0, col: K.red, ink: false, layer: 1 }); else gb1.plate(rectPts(Math.min(x0, x1), -d0 - o - e, Math.max(x0, x1), -d0 - o + e), { z: 0.6, depth: 0, col: K.red, ink: false, layer: 1 }); } };
    for (const [X, D, rx, rz] of [[-215, 414, 44, 26], [-305, 600, 62, 34], [-300, 752, 54, 32], [166, 516, 44, 26], [262, 594, 62, 34], [-72, 684, 36, 22], [-236, 832, 66, 36], [-108, 976, 34, 20], [152, 736, 42, 25], [-335, 1172, 76, 40], [-476, 995, 60, 34], [84, 868, 58, 26], [-960, 740, 150, 60], [980, 840, 150, 60], [-760, 1160, 130, 56], [-390, 1905, 190, 80], [445, 1900, 170, 70], [-780, 2250, 220, 90], [-128, 366, 26, 15], [88, 124, 28, 16], [-210, 244, 38, 22]]) { pool(X, D, rx, rz, 12 + Math.round(rx / 8)); if (X % 4 === 0) await ctx.yield(); }
    await ctx.yield();
    // two feeders run in across the court to the channel just before the first gateway (running water in the opening frame)
    canal(-150, 152, -8.2, 152, 3.4); canal(8.2, 152, 150, 152, 3.4);
    for (const c of [[-171, 420, -50, 420], [-215, 440, -215, 566], [-243, 600, -172, 600], [50, 470, 166, 470], [166, 470, 166, 490], [210, 594, 262 - 62, 594], [166, 542, 166, 594], [166, 594, 200, 594],
      [-130, 566, -130, 684], [-130, 684, -108, 684], [-72, 706, -72, 800], [-72, 800, -40, 800], [-40, 800, -40, 818], [-300, 634, -300, 720], [-236, 868, -236, 1132], [-170, 832, -112, 832],
      [152, 761, 152, 852], [142, 868, 300, 868], [300, 600, 300, 868], [-470, 300, -470, 961], [470, 300, 470, 1150], [-470, 600, -367, 600], [324, 594, 470, 594], [-700, 300, -700, 1500, 7], [700, 300, 700, 1500, 7], [-1500, -700, 1500, -700, 9], [-1500, 1560, 1500, 1560, 9], [-1500, 1840, 1500, 1840, 10], [-1500, 2170, 1500, 2170, 12], [-1100, 300, -1100, 2170, 9], [1100, 300, 1100, 2170, 9]]) canal(c[0], c[1], c[2], c[3], c[4] || 4.5);
    await ctx.yield();
    // rules: an avenue either side of the trough's run to the castle, a band behind the elephant, the far margins
    for (const r of [[-1500, -450, 1500, -450], [-1500, -950, 1500, -950], [-1500, 1500, 1500, 1500], [-1500, 1780, 1500, 1780], [-1500, 2100, 1500, 2100], [-820, 250, -820, 1500], [820, 250, 820, 1500], [-1240, 250, -1240, 2100], [1240, 250, 1240, 2100], [-560, 640, -196, 640], [196, 640, 560, 640], [-560, 250, -560, 1300], [556, 250, 556, 1300], [-560, 250, -140, 250], [140, 250, 556, 250]]) rule(r[0], r[1], r[2], r[3]);
    b.plan = false;
    await ctx.yield();
    // ==== ASSEMBLE ====
    // so that level drawings follow the tipped page: fine near the course, coarser up the page where the eye never comes
    const lenAt = (x, z) => 18 + 0.08 * Math.hypot(x, z + clamp(-z, 40, 1080));
    await bMain.refineAsync(lenAt, ctx.yield);
    await bCrowd.refineAsync(lenAt, ctx.yield);
    await bMid.refineAsync(lenAt, ctx.yield);
    for (const g of [gb0, gb1, gb2]) await g.refineAsync(lenAt, ctx.yield);
    // beyond every rank the court runs on to where the leaf ends, in broad pieces (never nearer than 1.5 km: its flat tint)
    for (let gx = -2600, q = 0; gx < 2600; gx += 130) {
      for (let gd = -2640; gd < 3340; gd += 130) if (gx < -1560 || gx >= 1560 || gd < -1600 || gd >= 2560) gb0.fill(rectPts(gx, -gd - 130, gx + 130, -gd), 0.3, K.red, { kind: 7, uvScale: 1 / 3 });
      if ((++q % 2) === 0) await ctx.yield();
    }
    const groundMat = S.fadeMaterial(50, 120, 0.05, 0.1, paperMat);   // same program as the page: no depth, painted in order; the far court all but vanishes into the leaf
    const waterMat = S.fadeMaterial(250, 500, 0.2, 0.25, paperMat);   // pools, canals and rules keep their azurite and vermilion longer than the court's tiles
    for (const [g, k] of [[gb0, 0], [gb1, 1], [gb2, 2]]) { const m = await g.buildAsync(ctx.yield); m.material = k ? waterMat : groundMat; m.renderOrder = -0.9 + k * 0.1; m.name = 'ground-coat-' + k; m.rotation.y = Math.PI; scene.add(m); }
    // the way out stands where the engine puts it (on the level page), while the castle is drawn a little up the leaf until we
    // are near: an unseen apron of page before the door keeps the opening's foot under the paper, as the old floor did
    {
      const ab = new PlateBuilder(S, rngG, ctx.noise); ab.plan = true;
      ab.fill(rectPts(-40, -(DOOR.z + 2), 40, -(DOOR.z - 90)), 0.05, K.paper, { kind: 3 });
      await ab.refineAsync(18, ctx.yield);
      const apron = await ab.buildAsync(ctx.yield), apronMat = S.material.clone();
      apronMat.uniforms = S.uniforms; apronMat.colorWrite = false; apron.material = apronMat; apron.name = 'door-apron'; apron.rotation.y = Math.PI; apron.renderOrder = -0.5; scene.add(apron);
    }
    const city = await bMain.buildAsync(ctx.yield); city.name = 'city-plates'; city.rotation.y = Math.PI; city.material = S.fadeMaterial(450, 600, 0.3, 0.45); scene.add(city);
    await ctx.yield();
    const crowd = await bCrowd.buildAsync(ctx.yield); crowd.name = 'crowd-plates'; crowd.rotation.y = Math.PI; crowd.material = S.fadeMaterial(60, 120, 0.1, 0.26); scene.add(crowd);
    await ctx.yield();
    const mid = await bMid.buildAsync(ctx.yield); mid.name = 'mid-plates'; mid.rotation.y = Math.PI; mid.material = S.fadeMaterial(380, 520, 0.3, 0.45); scene.add(mid);
    await ctx.yield();
    const balls = makeBalls(S, 64); scene.add(balls.mesh);
    const BR = 2.5, seg = (u, a, c) => clamp((u - a) / (c - a), 0, 1);

    // ---- the chain of cause in the city: every event a function of u ------------------------------------------------
    const uOver = 0.74, zOver = camZ(PU(uOver));
    const zBall = (u) => {                                   // the trough ball: behind us at 0.64, level at 0.74, at the castle by 0.86
      const a = 0.64, c = 0.86, L0 = (u - uOver) * (u - c) / ((a - uOver) * (a - c)), L1 = (u - a) * (u - c) / ((uOver - a) * (uOver - c)), L2 = (u - a) * (u - uOver) / ((c - a) * (c - uOver));
      return TZ0 * L0 + zOver * L1 + TZ1 * L2;
    };
    const uBallAt = (z) => { let a = 0.64, c = 0.86; for (let i = 0; i < 22; i++) { const m = (a + c) / 2; if (zBall(m) < z) a = m; else c = m; } return (a + c) / 2; };
    const uFlute = uBallAt(FLUTE - 3);
    const EV = { trough: [0.64, 0.86], flute: uFlute, ramp1: [0.86, 0.893], ramp2: [0.898, 0.914], cup: [0.914, 0.923], door: [0.922, 0.962], castleDrop: [0.926, 0.95] };   // while the falcons are still in the frame, as the leaves swing
    frameFalcons.forEach((f, i) => { f.uBow = f.d < 400 ? [0.012, 0.04][i] : uBallAt(f.d - 30); });   // in turn, each while it is still ahead of us
    for (const f of rimFalcons) f.uBow = uBallAt(f.d - 14);
    const bowOf = (u, u0, w = 0.012) => overshoot(seg(u, u0, u0 + w)) - smoothstep(u0 + w * 2.2, u0 + w * 5, u);
    // rare-event balls: four from each of fifteen falcons that are in front of the dive
    const rareSrc = rare ? [...rareFalcons, ...castleFalcons, ...rimFalcons.slice(3)] : [];
    const ballPos = new THREE.Vector3(TX, TY0, TZ0);

    function chain(u, time) {
      // trough ball, then down the castle's cut-open chute into the cup
      if (u < EV.trough[0]) { balls.hide(0); ballPos.set(TX, TY0 + BR, TZ0); }
      else {
        let x = TX, y, z;
        if (u < EV.trough[1]) { z = zBall(u); y = troughY(z) + BR + 0.3; }
        else if (u < EV.ramp1[1]) { const f = seg(u, EV.ramp1[0], EV.ramp1[1]); x = lerp(TX, -51.6, f); y = lerp(TY1 + BR + 0.3, 46.2 + BR, f); z = lerp(TZ1, CD + 2.6, Math.min(1, f * 4)); }
        else if (u < EV.ramp2[0]) { const f = seg(u, EV.ramp1[1], EV.ramp2[0]); x = lerp(-51.6, -52.4, f); y = lerp(46.2 + BR, 38 + BR, f * f); z = CD + 2.6; }
        else if (u < EV.ramp2[1]) { const f = seg(u, EV.ramp2[0], EV.ramp2[1]); x = lerp(-52.4, -42.4, f); y = lerp(38 + BR, 35.3 + BR, f); z = CD + 2.6; }
        else { const f = seg(u, EV.cup[0], EV.cup[1]), g = overshoot(seg(u, EV.cup[1], EV.cup[1] + 0.02)); x = lerp(-42.4, -41, f); y = lerp(35.3 + BR, 23.8 + BR, f * f) - 2.2 * g; z = CD + 2.6; }
        balls.set(0, x, y, z, BR); ballPos.set(x, y, z);
      }
      const zb = u < EV.trough[0] ? -1e3 : u < EV.trough[1] ? zBall(u) : 2e3;
      // falcons bow as a ball goes by
      for (const f of frameFalcons) S.setPart(f.part, f.dir * 0.5 * bowOf(u, f.uBow));
      for (const f of rimFalcons) S.setPart(f.part, f.dir * 0.6 * bowOf(u, f.uBow, 0.009));
      // the bucket the ball trips: launder and water swing down as one sheet, then right themselves
      S.setPart(pBucket, -(Math.PI / 2) * (overshoot(seg(u, EV.flute, EV.flute + 0.014)) - smoothstep(EV.flute + 0.07, EV.flute + 0.11, u)));
      // cup, weights, leaves
      const cupT = overshoot(seg(u, EV.cup[1], EV.cup[1] + 0.02)), open = overshoot(seg(u, EV.door[0], EV.door[1]));
      S.setPart(pCup, 0.26 * cupT);
      S.setPart(pWeight, 0, 0, -17 * overshoot(seg(u, EV.door[0], EV.door[0] + 0.03)), 0);
      const la = 0.62 + 1.1 * open; S.setPart(pLeaf[0], la); S.setPart(pLeaf[1], -la);
      S.setPart(pSerp[0], -1.1 * open); S.setPart(pSerp[1], 1.1 * open);
      // the hour turns over as the door opens; at the twelfth hour all twelve go in a wave
      roundels.forEach((r, k) => {
        const t = rare ? overshoot(seg(u, 0.872 + k * 0.004, 0.897 + k * 0.004)) : k === hour ? overshoot(seg(u, EV.door[0] + 0.01, EV.door[1])) : 0;
        S.setPart(r.part, Math.PI * t);
      });
      // the castle's two falcons lean out and drop their balls into the vases
      castleFalcons.forEach((f, i) => {
        const bow = overshoot(seg(u, EV.castleDrop[0] - 0.012, EV.castleDrop[0])), fall = seg(u, EV.castleDrop[0], EV.castleDrop[1]);
        S.setPart(f.part, f.dir * 0.55 * bow);
        const bx = f.beak.x, by = lerp(f.beak.y - 3.2, 9.5, fall * fall);
        balls.set(1 + i, bx, by, f.beak.z + 0.4, BR * (1 - smoothstep(0.985, 1, fall) * 0.999) * (rare ? 0.001 : 1));
      });
      // the twelfth hour: sixty balls in the air. It strikes as the trough ball reaches the castle, while the whole front
    // with its battlement falcons is still in the frame; the door opens on it.
      for (let j = 0; j < rareSrc.length * 4; j++) {
        const f = rareSrc[j % rareSrc.length], k = Math.floor(j / rareSrc.length), s = j % rareSrc.length;
        const u0 = 0.866 + k * 0.012 + ((s * 7) % 15) * 0.001, fall = seg(u, u0, u0 + 0.03), after = seg(u, u0 + 0.03, u0 + 0.06);
        const y0 = f.beak.y - 3, yb = BR + 0.2, hop = Math.sin(after * Math.PI) * 9 * (1 - after * 0.5);
        const zf = f.beak.z - 1.5 - after * (10 + (s % 4) * 3) - k * 1.4;
        balls.set(3 + j, f.beak.x + Math.sign(f.beak.x) * after * (5 + (s % 3) * 4), fall < 1 ? lerp(y0, yb, fall * fall) : yb + hop, zf, u < u0 - 0.004 ? 0.001 : BR * 0.86);
      }
      if (rare) for (const f of rareFalcons) S.setPart(f.part, f.dir * 0.55 * overshoot(seg(u, 0.854, 0.866)));
      // steady life, on time: wheel, columns, floats, stoppers
      S.setPart(pWheel, -time * 0.22);
      for (const w of devWheels) S.setPart(w.part, time * w.sp);
      for (const a of figArms) S.setPart(a.part, a.amp * (0.5 + 0.5 * Math.sin(time * a.w + a.ph)));       // an arm lifts, an ewer tips, a stick falls
      for (let i = 0; i < rockers.length; i++) S.setPart(rockers[i], 0.04 * Math.sin(time * 0.8 + i * 2.2));   // the boats rock
      S.setPart(pSun, 0.16 * Math.sin(time * 0.045));
      for (let i = 0; i < 3; i++) S.setPart(pCol[i], 0, 0, 2.6 * Math.sin(time * 0.55 + i * 2.1), 0);
      const fl = (time * 0.06) % 1; S.setPart(pFloat, 0, 0, 2.4 * smoothstep(0, 0.8, fl) * (1 - smoothstep(0.88, 1, fl)) + 0.15 * Math.sin(time * 1.4), 0);
      S.setPart(pFloat2, 0, 0, 0.5 * Math.sin(time * 0.9), 0);
      for (let i = 0; i < 2; i++) S.setPart(pStop[i], 0, 0, 1.6 * Math.max(0, Math.sin(time * 2.3 + i * 2.4)), 0);
    }

    // ---- the flight ------------------------------------------------------------------------------------------------
    const sstep = smoothstep;
    // pace and gaze are written against the chain's clock (the places), then mapped to the path
    const pace = (u) => {
      const slow = sstep(0.17, 0.24, u) * (1 - sstep(0.44, 0.5, u));        // the leaf whole, the window, the tower's front: the lingering place
      const back = sstep(0.56, 0.6, u) * (1 - sstep(0.63, 0.68, u));        // the tower's open back
      const chase = sstep(0.72, 0.78, u) * (1 - sstep(0.84, 0.9, u));
      return 1.1 - 0.42 * slow - 0.25 * back + 0.22 * chase - 0.1 * sstep(0.9, 0.95, u);
    };
    const _pc = new THREE.Vector3(), _pe = new THREE.Vector3(), _pl = [];
    // a place on the tipped page as the eye at path u sees it: raised by the page's lift at its level distance
    const seen = (x, y, z) => { const o = new THREE.Vector3(); _pl.push(o); return (t, u) => { path.pointAt(u, _pc); return o.set(x, y + liftAt(Math.hypot(x - _pc.x, z - _pc.z)), z); }; };
    const pois = [
      { at: (t, u) => { path.pointAt(u, _pc); return _pe.set(0, lerp(62, 86, sstep(0.05, 0.15, u)) + liftAt(Math.hypot(_pc.x, HZ - _pc.z)), HZ); }, from: 0.0, to: 0.245, weight: 0.72 },                              // the elephant on its page under the first gateway
      { at: seen(-76, 60, 345), from: 0.09, to: 0.2, weight: 0.3 },                           // the peacock pouring into its basin, to starboard
      { at: seen(0, 72, HZ), from: 0.17, to: 0.3, weight: 0.92, fade: 0.3 },                 // the leaf whole: elephant, carpet and tower square-on, the city up the page behind
      { at: seen(12, 50, HZ - 22), from: 0.275, to: 0.375, weight: 0.92, fade: 0.3 },          // the window in the flank: the tank cut open, the bowl going under
      { at: seen(-11, 132, HZ), from: 0.365, to: 0.47, weight: 0.92, fade: 0.3 },             // the tower's front: falcon, ball in the air, serpent
      { at: seen(-64, 60, 840), from: 0.465, to: 0.578, weight: 0.8, fade: 0.3 },            // over the rump: the trough running to the castle, the wheel far ahead
      { at: seen(-11, 122, HZ + 24), from: 0.572, to: 0.655, weight: 0.94, fade: 0.3 },       // the tower's open back: serpent 2 tipped, the ball let go
      { at: seen(-84, 54, 838), from: 0.65, to: 0.742, weight: 0.92, fade: 0.3 },             // the scoop wheel whole and face-on, its pots pouring
      { at: () => ballPos, from: PU(0.7), to: PU(0.78), weight: 0.2 },                        // the ball in the trough
      // the castle front, whole: the gaze a little down the page from the trough, then square on the face's middle for the arrival
      { at: (t, u) => { path.pointAt(u, _w); return _lv.set(lerp(-8, 0, sstep(880, 930, _w.z)), lerp(_w.y - 34, 50.5, sstep(880, 1000, _w.z)), DOOR.z); }, from: 0.712, to: 0.972, weight: 0.94, fade: 0.16 },
      { at: (t, u) => _lc.set(-43, path.pointAt(u, _w).y + 8, DOOR.z), from: PU(0.868), to: PU(0.928), weight: 0.2 },          // the chute cut open, the ball on its ramps
      { at: new THREE.Vector3(DOOR.x, DOOR.y + 6, DOOR.z), from: 0.955, to: 1, weight: 0.5 },             // the door
    ];
    // up the flank: where the window's look lets go and the tower front's has not yet taken hold, the two weights fell to under a
    // quarter (0.065 each where they cross), so the gaze went mostly by the route's own direction, which with the usual camera the
    // engine takes as the chord to the point 24 m on: while both are under a quarter that chord climbs at 63 to 88 degrees, and the
    // picture was the bare leaf above the tower. One more look fills that gap. Outside its own span the gaze asked for is live's;
    // the flown camera, which turns toward the gaze slowly, still stands off live's for a moment after it. The look is made of
    // those two looks and no number of theirs is written again here: what it takes of them (the window's from, to and fade; the
    // tower front's from, to, fade and weight) is read at build and not again, their places are called each time this look's
    // place is asked. It begins where the window's look begins to let go, is whole a fifth of its own span later, stays whole
    // until the tower front's look is whole, then lets go over the same fifth; its place slides, eased, from the window's place to
    // the tower front's as the eye climbs between the heights the route has at those two moments; its weight is the tower front's
    // own. It stands in the list between the two, so the tower front's look is laid over it: from where both aim at one place the
    // gaze differs from live's only in the route's share of it, which with the usual camera live has at 8 in 100 and this look
    // brings lower until it has let go. With the steady camera every look's weight is 0.35 of its own, so in that gap the route
    // still has more than half of the gaze (0.62 to 0.65 of it), and this look lowers the upward gaze there without removing it.
    // The two looks are taken by their place in the list (the fourth and fifth) and each must carry a fade of its own: a look put
    // before them, or a fade left to the engine's default, has to be answered here.
    { const wn = pois[3], tf = pois[4], fd = 0.2, _fa = new THREE.Vector3(), _fb = new THREE.Vector3(), _fe = new THREE.Vector3();
      const hold = wn.to - wn.fade * (wn.to - wn.from), whole = tf.from + tf.fade * (tf.to - tf.from);
      const yA = path.pointAt(hold, _fe).y, yB = path.pointAt(whole, _fe).y;
      pois.splice(4, 0, { at: (t, u) => { _fa.copy(wn.at(t, u)); _fb.copy(tf.at(t, u)); return _fa.lerp(_fb, sstep(yA, yB, path.pointAt(u, _fe).y)); }, from: hold, to: (whole - fd * hold) / (1 - fd), weight: tf.weight, fade: fd }); }

    function update(dt, time, camera, u) {
      const c = CU(u);                                          // the chain's clock: where we are, not how far we have flown
      hero.setProgress(c); hero.update(dt, time, camera);       // sets uTime and the elephant's chain
      chain(c, time);
    }
    update(0, 0, null, 0);

    return {
      scene, path, duration: 42, pace,
      camera: { fov: 62, near: 0.5, far: 5000, lookAhead: 24, sway: 0, bank: 0 },   // the page stays upright: no roll, no drift
      pois,
      portal: { shape: 'arch', width: DOOR.w, height: DOOR.h, color: '#D4A22A', veil: '#1C1814', glow: 0, frame: 0, revealDistance: 460, blendDistance: 30 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
