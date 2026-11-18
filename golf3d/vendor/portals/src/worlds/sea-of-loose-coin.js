// A Sea of Loose Coin. Inside a long barrel hall of riveted steel lies a fortune kept as a sea: dunes and troughs of
// loose gold coin from wall to wall, coin pouring from spouts, slips running down the faces, a sink where the coin
// drains away. The flight starts low in a deep trough of coin: a ruled depth gauge stands in the coin on the right, a
// fall of tumbling coins beyond it, and dead ahead a white diving tower holds one long springboard right across the
// trough. The line flies under the board, climbs once high over the crests, crosses a footbridge and the whole sea,
// comes down the hall in one long easy descent past the sink and behind a last curtain of coin, and leaves by a round
// vault door standing open, a second depth scale beside it (marks alone, nothing lettered). Everything seen is our own
// drawing from real things. The world sets neither portal.drawWithin nor portal.drawIn.
//
// THE ROUTE'S RULES (places of the hall, metres). The plan is the design's. The heights are laid by places (r6): level
// at the entry's height through the entry trough, under the springboard (BOARD.z), to the trough's end 4 m north of
// it; ONE climb from there to the wide view's height at the wide view (8 m and more over the sea's crests); level for
// 10 m; ONE long descent from there to the door's height 10 m short of the door, passing the sink 9 m and more over
// its rim and the last curtain at half its height; level into the door. Climb and descent ease in and out over a
// quarter of their run each, so the line never bends down before its top nor up after it. The sea's surface is cut
// 3.15 m under the line in the entry trough (the long dune's slip face standing 3 m from the line on the left) and
// 5.1 m from the wide view on, and rises from it no steeper than the angle of rest, so the coin keeps 2.9 m of clear
// air from the line by construction on every seed; walls, ribs, catwalks, spouts, crane, tower, gauge, bridge and
// door keep their distance by where the hall puts them (clearances are kept by place and counted over forty seeds).
// Looks open and close by places: the springboard's board while it lies ahead; the sink's far lip from the climb's
// foot until the sink is passed. Pace by places too. Nothing in the world reads where the lens is or how far it has
// flown but the look windows and the pace.
import * as THREE from 'three';
import { makePath, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import * as COINS from '../parts/sea-of-loose-coin-coins.js';
import { buildHero, HALL, SINK, ENTRY, WIDE, CURTAIN, BANK, DOOR, LAMP, makeBag, cagedLamp, tube, archY } from '../parts/sea-of-loose-coin.js';
import { buildBridge, useHall } from '../parts/sea-of-loose-coin-steel.js';

// the flown line's plan, the design's (x and z): the entry trough (straight), the saddle, the wide view, the axis, the
// sink's east rim, behind the last curtain (east of it), and dead straight on the door's axis from z -92
const PLAN = [[19, 148], [19, 133], [19, 118], [19, 103], [19, 94], [19, 88], [15, 70], [8, 52], [3, 30], [2, 6], [4, -20], [6, -40], [7, -56], [6, -74], [2, -86], [0, -92], [0, -93], [0, -95], [0, -101], [0, -111], [0, -130], [0, -150]];
// a run from 0 to 1 that eases in over its first quarter and out over its last
const ease = (t) => { const a = 0.25, c = Math.min(1, Math.max(0, t)); return c < a ? c * c / (2 * a * (1 - a)) : c > 1 - a ? 1 - (1 - c) * (1 - c) / (2 * a * (1 - a)) : (c - a / 2) / (1 - a); };
// the line's height over a z of the hall: the entry's height to the trough's end, the climb to the wide view, level
// for 10 m, the one descent to the door's height 10 m short of the door
const zTop = WIDE.z - 10, zLast = DOOR.z + 10;
const lineY = (z) => (z > ENTRY.end ? ENTRY.y : z > WIDE.z ? ENTRY.y + (WIDE.y - ENTRY.y) * ease((ENTRY.end - z) / (ENTRY.end - WIDE.z)) : z > zTop ? WIDE.y : WIDE.y - (WIDE.y - DOOR.y) * ease((zTop - z) / (zTop - zLast)));

export default {
  id: 'sea-of-loose-coin',
  name: 'A Sea of Loose Coin',
  category: 'screen',
  placeKind: 'interior',
  screen: 'DuckTales',
  screenYear: '2017',
  screenKind: 'series',
  media: ['air'],
  weirdness: 0.35,
  async build(ctx) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f14');
    // every stream of the world comes from the seed and its own name; the parts ask for theirs by name
    const R = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const forks = { tone: R('tone'), pack: R('pack'), plate: R('plate'), crane: R('crane'), dust: R('dust'), rare: R('rare'), slips: R('slips') };
    const hour = ['dawn', 'golden', 'night'].includes(ctx.vary.hour) ? ctx.vary.hour : 'day';
    const detail = ctx.quality.detail, density = ctx.vary.density || 1, rare = !!ctx.vary.rare;
    // the line: the plan's curve, a point every 3 m of it at the height the rule above gives, and the plan's last point
    const plan = makePath(PLAN.map(([x, z]) => [x, 0, z])), v = new THREE.Vector3(), line = [];
    for (let m = 0; m < plan.length - 1.5; m += 3) { plan.posAtDist(m, v); line.push([v.x, lineY(v.z), v.z]); }
    line.push([DOOR.x, DOOR.y, DOOR.z]);
    const path = makePath(line);
    const L = path.length;
    // places of the line every 2 m for the sea's trough: its half width and depth under the line. In the entry trough
    // 0.8 m and 3.15 m; opening from the trough's end to the wide view to 3.1 m and 5.1 m. For the first 5 m from the
    // entry plane the coin lies 4.4 m under the line and 3.2 m wide (the whole round of the way in, radius 4.3, stands
    // clear of the coin). Behind the entry plane the trough runs on along the entry axis to the south wall, widening
    // so that 15 m either side nothing rises to the line's height.
    const route = [];
    for (let z = HALL.zS - 1; z > ENTRY.z + 0.5; z -= 2) route.push([ENTRY.x, ENTRY.y, z, 3.2 + 11.8 * smoothstep(ENTRY.z + 1, ENTRY.z + 12, z), 4.4, 0]);
    for (let m = 0; m <= L; m += 2) {
      path.posAtDist(m, v);
      const open = smoothstep(ENTRY.end, WIDE.z, v.z), pit = smoothstep(ENTRY.z - 5, ENTRY.z - 1.5, v.z);
      route.push([v.x, v.y, v.z, 0.8 + 2.3 * open + 2.4 * pit, 3.15 + 1.95 * open + 1.25 * pit, 1]);
    }
    // metres of route at which the line crosses a z of the hall (the line runs north all the way)
    const mAtZ = (z) => { let lo = 0, hi = L; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (path.posAtDist(m, v).z > z) lo = m; else hi = m; } return (lo + hi) / 2; };
    // the hall's own steel out over the gold (one footbridge) is built through the hero's hook, on the finished sea;
    // its part takes the hall's measures and makers from the hall's part here
    useHall({ HALL, LAMP, makeBag, cagedLamp, tube, archY });
    const hero = await buildHero(ctx, { coins: COINS, route, path, hour, forks, stream: R, detail, density, rare, fx, more: (parts) => buildBridge(ctx, parts, { path, fx, stream: R, hour }) });
    scene.add(hero.object);
    // the named places of the line, in metres of route
    // the springboard: where its board crosses over the line
    const board = hero.parts.tower.at, mBoard = mAtZ(board.z);
    // the wide view
    const mWide = mAtZ(WIDE.z);
    // the entry trough's end: the springboard passed, the climb begins
    const mClimb = mAtZ(ENTRY.end);
    // the rim's south edge abeam
    const mSinkRim = mAtZ(SINK.z + SINK.rim);
    // the throat abeam
    const mThroat = mAtZ(SINK.z);
    // the rim's north edge abeam
    const mSinkPast = mAtZ(SINK.z - SINK.rim);
    // the curtain's south and north ends abeam
    const mCurtS = mAtZ(CURTAIN.z1), mCurtN = mAtZ(CURTAIN.z0);
    // the south edge of the door's bank abeam
    const mBank = mAtZ(BANK.z);
    // pace by places: 0.8 from the entry until the springboard is passed; rising to 1.2 from there to the wide view,
    // and so down the hall; down to 0.85 round the sink, from a rim's radius before the rim to the rim's south edge
    // abeam; 0.8 behind the last curtain, from the rim's north edge to the curtain's south end; and from the
    // curtain's north end up to 1 where the door's bank begins abeam
    const pace = (u) => {
      const m = u * L;
      return 0.8 + 0.4 * smoothstep(mBoard, mWide, m) - 0.35 * smoothstep(mSinkRim - SINK.rim, mSinkRim, m) - 0.05 * smoothstep(mSinkPast, mCurtS, m) + 0.2 * smoothstep(mCurtN, mBank, m);
    };
    // looks, one at a time, each a place of the hall, each under weight 0.6, none on in the first 30 m:
    // THE SPRINGBOARD (the middle of its board, between the platform and the tip), from 30 m of route until the board
    // is 1 m short of overhead: the board crosses the trough 16 m over the line, and the pull lifts the gaze to it and
    // a little toward its tower as it nears;
    // THE SINK'S FAR LIP (the high lip of its tilted rim, on the side away from the wide view), from the entry
    // trough's end (the climb's foot) until 6 m past the throat abeam, opening and closing over 20 m each. On the
    // climb the line itself points at the roof and the pull keeps the sea under the gaze; on the level and down the
    // hall it holds the gaze across the sink at the rim's height, so the funnel lies in the lower half of the view and
    // the hall, its walls and the door's end stand over it (r5b pulled at the throat, 13 m under the rim, and the
    // gaze went down into the gold).
    const lip = [SINK.x + SINK.tx * SINK.rim, SINK.rimY + SINK.tilt, SINK.z + SINK.tz * SINK.rim];
    const sinkSpan = mThroat + 6 - mClimb;
    const pois = [
      { at: [(board.x + board.tip) / 2, board.top, board.z], from: 30 / L, to: (mBoard - 1) / L, weight: 0.5, fade: 0.5 },
      { at: lip, from: mClimb / L, to: (mThroat + 6) / L, weight: 0.5, fade: 20 / sinkSpan },
    ];
    return {
      scene, path, duration: 40, pace,
      camera: { fov: 50, near: 0.25, far: 700, sway: 0.8, bank: 0.5, nearThrough: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 4.3, color: '#eaf2ff' },
      post: { exposure: 1.13, bloom: { strength: 0.2, radius: 0.5, threshold: 1.0 },
        grade: { saturation: 1.04, contrast: 1.05, tint: '#ffffff', shadowTint: '#05080c', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) { hero.update(dt, time, camera); },
      dispose() { hero.dispose(); },
    };
  },
};
