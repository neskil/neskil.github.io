// The Walking Dune: a late-afternoon desert laid in half-metre cubes. A crescent dune sixty metres tall walks
// forward one hopping cube at a time and gives back the turquoise-domed caravan city it has been hiding.
// STYLE (brief.styleNote): every pixel is one of fourteen flat colours out of the one tone table of
// src/parts/walking-dune.js (makeStyle). No lights, fog, textures, blending, bloom or full-screen pass; a shadow
// is a cell repainted in its violet twin; distance is cube size; everything moves on the six-per-second sand tick.
// World space == the hero's local frame: +Z the course and the wind, port = +X (dome and sun to port), brief x = -x.
// The dune stands ~78 m and its crest lies ~24 m short of the origin (hero anchors crestZ, toe, slipFoot); the course
// begins 16 m short of the toe (its first 36 m pressed in u, so the still at u 0.02 stands on the first steps beside the camp). Scripted moments are written in the
// brief's journey seconds and reached through tOf(u) (knots at the toe, crest, slip foot and arches); pace() spends
// the real seconds (1 s plain, 8.7 s back, 8.5 s over the crest and down the face, 8 s past the dome, 4 s arcade, 6 s
// pool and ring). The route's measure (the engine's distance and u) is pressed over the climb, so the knife edge is
// crossed at u 0.28 and the city's pictures are pinned to their u (see the path block: PIN); the eye leaps the crest and
// glides over the upper slip face. Nothing is carried with the camera: the sand yacht is a thing in the scene, sailing
// ahead of us (see the yacht block). The city's furniture merges to 2 m blocks beyond the first merge line (LOD).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, makeStyle, MAT } from '../parts/walking-dune.js';

// The seeded looks: whole colourways of the same fourteen inks (names as in the part's HEX table).
const LOOKS = {
  afternoon: {},
  morning: { sandSun: '#FBE3D0', sandTop: '#EDBFA2', sandSlip: '#D99A7E', sandShade: '#B0705C', sandDeep: '#7E4A42',
    violetPale: '#B4B8E4', violet: '#6C72BC', violetDeep: '#2C3274', skyBlue: '#86B6DA', skyPale: '#D3E2EA', skyLow: '#FAE8DA' },
  brick: { sandSun: '#F4B48C', sandTop: '#DA7C50', sandSlip: '#BE5C38', sandShade: '#8E3E28', sandDeep: '#5E2A20',
    turquoise: '#2BAA7C', lapis: '#1C4A8E', violetPale: '#C2A8CC', violet: '#84508E', violetDeep: '#40224E' },
  gypsum: { sandSun: '#FCFAF2', sandTop: '#ECE6D8', sandSlip: '#D6CEC0', sandShade: '#B2AAA4', sandDeep: '#88807C',
    whitewash: '#F09272', turquoise: '#2C5AC8', lapis: '#17296E', palm: '#2E7D4F', violetPale: '#B8B4DC', violet: '#8C88C0', violetDeep: '#3A3470',
    skyLow: '#F6F0E2' },
  night: { sandSun: '#5C66AA', sandTop: '#3C4688', sandSlip: '#2F3872', sandShade: '#242B5C', sandDeep: '#181C42',
    whitewash: '#D6DCEA', lapis: '#1A2E7A', palm: '#1E5048', skyBlue: '#0D1334', skyPale: '#171F4C', skyLow: '#252F68', skyUnder: '#2F3872',
    violetPale: '#7C84BA', violet: '#1C2052', violetDeep: '#0C0E2A' },
};
const JOURNEY = 41;                                  // the brief's journey, seconds: scripted beats are keyed to it through tOf(u)
const DURATION = 38;                                 // the seconds the flight really takes

export default {
  id: 'walking-dune',
  name: 'The Walking Dune',
  category: 'city',
  weirdness: 0.45,
  media: ['open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const scene = new THREE.Scene();

    // ---- which visit is this: look (hour and colourway), wind, cast, and the rare rain
    const vr = rng.fork('visit');
    const hour = vary.hour || 'any';
    const lookName = hour === 'night' ? 'night' : hour === 'dawn' ? 'morning' : hour === 'golden' ? 'afternoon'
      : hour === 'day' ? vr.pick(['afternoon', 'brick', 'gypsum']) : vr.pick(['afternoon', 'afternoon', 'morning', 'brick', 'gypsum', 'night']);
    const wind = vr.pick(['breeze', 'breeze', 'gale', 'lull']);
    const cast = { herd: vr.pick(['camel', 'camel', 'gazelle']), bird: vr.pick(['dove', 'ibis']), pacer: vr.pick(['fox', 'hare']) };
    const rain = !!vary.rare;
    const windK = Math.min(1.35, (wind === 'gale' ? 1.3 : wind === 'lull' ? 0.45 : 1) * dens);

    const EXPOSURE = 2.6;
    const style = makeStyle(ctx, { exposure: EXPOSURE, hex: LOOKS[lookName] });
    await ctx.yield();
    const M = MAT;

    // ---- what stands on the hollow floor and casts shadow (1 m cells): filled as the city is laid
    // (The grid runs from the plain to the wall: on the plain and the dune's back the camp, the tents, the cairns and the
    // caravan throw their long cell shadows too. `mask` is a drawn shadow: cells forced into shadow, for shapes a height
    // field cannot cast (a palm's crown at the end of its trunk's bar). `dyn` is the walking caravan: [x, z, sx, sz, top].)
    const SX0 = -200, SZ0 = -340, SW = 400, SL = 650, solid = new Float32Array(SW * SL), mask = new Uint8Array(SW * SL), dyn = [];
    let dynZ0 = 1e9, dynZ1 = -1e9, dynRowsOk = false;
    // (dynRow: the 1 m rows of z a live box of the caravan lies on, marked where dynZ0 and dynZ1 are taken and trusted only
    // until the updaters next move a box: a cell on a row no box lies on need not ask the boxes, the answer is the same)
    const dynRow = new Uint8Array(SL);
    const solid1 = (x, z) => {
      const i = Math.floor(x) - SX0, j = Math.floor(z) - SZ0; let t = (i < 0 || j < 0 || i >= SW || j >= SL) ? 0 : solid[j * SW + i];
      if (z > dynZ0 && z < dynZ1 && (!dynRowsOk || j < 0 || j >= SL || dynRow[j])) for (let k = 0; k < dyn.length; k++) { const d = dyn[k]; if (x >= d[0] && x < d[0] + d[2] && z >= d[1] && z < d[1] + d[3] && d[4] > t) t = d[4]; }
      return t;
    };
    const solidAt = (x, z, cs) => cs === 2 ? Math.max(solid1(x - 0.5, z - 0.5), solid1(x + 0.5, z - 0.5), solid1(x - 0.5, z + 0.5), solid1(x + 0.5, z + 0.5)) : (cs > 4 && z < 60) ? 0 : solid1(x, z);
    const maskAt = (x, z) => { const i = Math.floor(x) - SX0, j = Math.floor(z) - SZ0; return (i < 0 || j < 0 || i >= SW || j >= SL) ? 0 : mask[j * SW + i]; };
    const stamp = (x, z, sx, sz) => { for (let j = Math.max(0, Math.floor(z) - SZ0); j < Math.min(SL, Math.floor(z + sz) - SZ0); j++) for (let i = Math.max(0, Math.floor(x) - SX0); i < Math.min(SW, Math.floor(x + sx) - SX0); i++) mask[j * SW + i] = 1; };
    // a palm's drawn shadow on level ground: the trunk's bar three cells to starboard and one downwind for every cube of height, and the crown's square at its end
    const palmShadow = (px, pz, ph) => { stamp(px - 7, pz - 1, 8, 5); stamp(px - 9, pz, 2, 3); };   // (fix 7: the crown's shade lies as one whole stepped square at the palm's own foot, to starboard: thrown thirty metres across the course it was a blotch that belonged to nothing in the frame)
    const markSolid = (x, z, sx, sz, top) => {
      for (let j = Math.max(0, Math.floor(z) - SZ0); j < Math.min(SL, Math.ceil(z + sz) - SZ0); j++)
        for (let i = Math.max(0, Math.floor(x) - SX0); i < Math.min(SW, Math.ceil(x + sx) - SX0); i++) if (solid[j * SW + i] < top) solid[j * SW + i] = top;
    };

    // ---- the hero: the dune as living ground, the dome, the buried palms, the pool
    const farCells = [96, 120];
    // (courseX: the course's x in the hollow, for the buried palms' places: the same bow to starboard as lineX below; the two must change together)
    const hero = await buildHero(ctx, { style, detail, follow: 'course', sky: false, exposure: EXPOSURE, solidAt, maskAt, domeCast: 5,
      courseX: (z) => (z > 96 && z < 172) ? -19 * Math.pow(Math.sin(Math.PI * (z - 96) / 76), 2) : 0,
      cells: [[104, 128], [128, 160], farCells], farOrigin: [-farCells[0] * 4, -496],
      loose: [1700, Math.round(2000 * Math.min(1.2, Math.max(0.8, windK))), 320], slide: 416, slide2: 2560 });
    scene.add(hero.object);
    const A = hero.anchors, hAt = A.heightAt, WALL_Z = A.wallZ;
    const sky = style.makeSky(); hero.object.add(sky);
    await ctx.yield();

    // ---- the path: the yacht's line. Stations every 10 m, 2.9 m over the highest sand nearby, smoothed upward only,
    // so the crest is an arc and never a break; the last 62 m rise dead straight into the ring.
    // The course begins 50 m out on the plain, so the dune already stands a quarter of the frame tall in the entry view.
    const RING_Y = 7.5, TOE_Z = A.toe.z, CREST_Z = A.crestZ, Z0 = Math.round(TOE_Z) - 16, SB = CREST_Z - 22 - TOE_Z;
    const lineX = (z) => (z > TOE_Z && z < CREST_Z - 22) ? 12 * Math.pow(Math.sin(Math.PI * (z - TOE_Z) / SB), 2)
      : (z > 96 && z < 172) ? -19 * Math.pow(Math.sin(Math.PI * (z - 96) / 76), 2) : 0;     // S-bend to port up the back; a bow to starboard round the dome
    const st = [];
    for (let z = Z0; z <= 228.01; z += 10) {
      const zz = Math.min(z, 228), x = lineX(zz); let h = zz > 80 ? 0.5 : 0;
      for (let k = -5; k <= 5; k += 2.5) h = Math.max(h, hAt(x, zz + k));
      st.push([x, h + 2.9, zz]);
    }
    for (let pass = 0; pass < 4; pass++) for (let i = 1; i < st.length - 1; i++) st[i][1] = Math.max(st[i][1], (st[i - 1][1] + st[i + 1][1]) / 2 * 0.5 + st[i][1] * 0.5);
    const yEnd = st[st.length - 1][1];
    for (let i = 0; i < st.length; i++) if (st[i][2] > 180) st[i][1] = yEnd;
    // The crest is a leap: the yacht lifts off the last of the back, crosses the knife edge well clear of it and glides
    // down over the upper slip face before it takes the sand again, so the hollow opens whole under the prow.
    const LEAP = [0, 0.5, 2, 3.5, 5, 6.5, 10.5, 12.8, 12.1, 9.8, 7.2, 5, 3.2, 1.9, 1, 0.4, 0.1, 0];   // metres over the skimming line, every 10 m from 50 m short of the crest
    // (fix 8) From the first strata to the leap the eye rides LIFT metres higher over the back, so the treads' tops and the ranks' stripes
    // show (from 2.9 m a climbing stair is all risers) and the knife edge stands over the stairs.
    const LIFT = 6;
    for (let i = 0; i < st.length; i++) { const z = st[i][2], q = (z - CREST_Z + 50) / 10, k = Math.floor(q), lp = (q > 0 && k < LEAP.length - 1) ? LEAP[k] + (LEAP[k + 1] - LEAP[k]) * (q - k) : 0;
      const tt = Math.min(1, Math.max(0, (z - TOE_Z - 62) / 58)), lf = z < CREST_Z - 8 ? LIFT * tt * tt * (3 - 2 * tt) : 0; st[i][1] += Math.max(lp, lf); }
    for (let k = 1; k <= 4; k++) st.push([0, yEnd + (RING_Y - yEnd) * k / 4, 228 + 15.5 * k]);
    const rp = makePath(st), RL0 = rp.length;
    // The course is laid in metres, but the journey is told in sights: the plain and the back are one long staircase, the
    // hollow is the city. So the route's own measure (what the engine calls distance, and u) runs fast over the climb and
    // true from the crest on: the knife edge is crossed at u 0.29. Real metres <-> the route's measure through one table;
    // pace() gives the real speed back, so nothing is seen to jump.
    // (Polish round: the measure is laid by places, so each of the journey's pictures gets its share of u. Pressed hard
    // over the climb (solved so the knife edge falls on U_CR), pressed by 0.6 over the leap and the upper face, stretched
    // through the market square before the dome, where there is most to see, and pressed again through the dome's shadow.)
    const sOfZ = (z) => rp.nearestXZ(lineX(Math.max(Z0, Math.min(z, 228))), z).u * RL0;
    const S_CREST = sOfZ(CREST_Z), U_CR = 0.28, NT = 640, FK = new Float32Array(NT + 1);
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    // weight knots by place (z, fake metres per real metre), eased from one to the next. Up to the slip foot they are
    // given; from there on the pictures are pinned: PIN lists where the eye is to be at which u (the dome and market at
    // 0.523, the street at 0.613, the dome's shade at 0.70, the caravan beside us at 0.79 (the arcade follows at about
    // 0.83), the pool's near rim at 0.87, the gate at 0.94), and each stretch's weight is solved so it is, for every seed.
    const PIN = [[93, 0.523], [112, 0.613], [146, 0.70], [162, 0.79], [237, 0.87], [266, 0.94], [290, 1]], wSeg = [1.8, 1.0, 2.2, 0.45, 1.3, 1.2];   // (fix 6 pinned these; fix 7 kept every pin and changed only the light and the look: beside the dome at 0.70 the colonnade, before the first arch at 0.79 the arch whole over the caravan, the pool, the gate)
    let WK = [];
    const knots = () => {
      const k = [[CREST_Z - 45, 1], [CREST_Z + 15, 0.6], [CREST_Z + 60, 0.6], [84, 1.1]];
      for (let i = 0; i < wSeg.length; i++) k.push([PIN[i][0] + (i ? 4 : 0), wSeg[i]], [PIN[i + 1][0] - (i < wSeg.length - 1 ? 4 : 0), wSeg[i]]);
      WK = k.map(([z, w]) => [sOfZ(z), w]);
    };
    const hf = (s) => { if (s <= WK[0][0]) return 1; for (let i = 1; i < WK.length; i++) if (s < WK[i][0]) return WK[i - 1][1] + (WK[i][1] - WK[i - 1][1]) * sm(WK[i - 1][0], WK[i][0], s); return WK[WK.length - 1][1]; };
    // (The course begins 16 m short of the toe. Its first S02 metres carry the weight W0, solved so that the eye stands
    // S02 metres in at u 0.02: on the dune's first steps, the camp beside it and the mountain half the frame wide.)
    const S02 = 36; let WA = 0.6, W0 = 0.2;
    const wAtS = (s) => { const w = hf(s) - WA * (1 - sm(S_CREST - 45, S_CREST + 15, s)), k = sm(S02 - 8, S02 + 10, s); return W0 + (w - W0) * k; };
    const lay = () => { FK[0] = 0; for (let i = 1; i <= NT; i++) FK[i] = FK[i - 1] + wAtS((i - 0.5) * RL0 / NT) * RL0 / NT; };
    const fAt = (s) => { const q = Math.min(NT - 1e-6, Math.max(0, s / RL0 * NT)), i = Math.floor(q); return FK[i] + (FK[i + 1] - FK[i]) * (q - i); };
    const press = () => {                                // how hard the climb is pressed, so the crest falls on U_CR
      for (let lo = 0.2, hi = 0.9, n = 0; n < 16; n++) { WA = (lo + hi) / 2; lay(); if (fAt(S_CREST) / FK[NT] > U_CR) lo = WA; else hi = WA; }
      lay();
    };
    const sPin = PIN.map(([z]) => sOfZ(z));
    for (let it = 0; it < 6; it++) {
      knots(); press();
      for (let i = 0; i < wSeg.length; i++) wSeg[i] = Math.min(4, Math.max(0.2, wSeg[i] * (PIN[i + 1][1] - PIN[i][1]) / Math.max((fAt(sPin[i + 1]) - fAt(sPin[i])) / FK[NT], 1e-4)));
      W0 = Math.min(1, Math.max(0.1, W0 * 0.02 / Math.max(fAt(S02) / FK[NT], 1e-4)));
      if (it % 2) await ctx.yield();
    }
    knots(); press();
    lay(); const FL = FK[NT];
    const toReal = (d) => { if (d <= 0) return d; if (d >= FL) return RL0 + d - FL; let lo = 0, hi = NT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (FK[m] <= d) lo = m; else hi = m; }
      return (lo + (d - FK[lo]) / Math.max(FK[hi] - FK[lo], 1e-6)) * RL0 / NT; };
    const toFake = (s) => { if (s <= 0) return s; if (s >= RL0) return FL + s - RL0; const q = s / RL0 * NT, i = Math.min(NT - 1, Math.floor(q)); return FK[i] + (FK[i + 1] - FK[i]) * (q - i); };
    const path = { ...rp, length: FL,
      posAtDist: (d, out = new THREE.Vector3()) => rp.posAtDist(toReal(d), out), tangentAtDist: (d, out = new THREE.Vector3()) => rp.tangentAtDist(toReal(d), out),
      pointAt: (u, out = new THREE.Vector3()) => rp.posAtDist(toReal(u * FL), out), tangentAt: (u, out = new THREE.Vector3()) => rp.tangentAtDist(toReal(u * FL), out),
      nearestXZ: (x, z) => { const r = rp.nearestXZ(x, z); return { dist: r.dist, u: toFake(r.u * RL0) / FL, y: r.y }; } };
    const zToU = (z) => path.nearestXZ(lineX(Math.max(Z0, Math.min(z, 228))), z).u;      // when the eye reaches a z on the course
    // The brief's clock. Scripted moments are written in the brief's journey seconds (toe 8 s, crest 24 s, slip foot 30 s,
    // first arch 34 s, last arch 37 s, ring 41 s) and found from u through these knots; pace() spends the real seconds:
    // 3 s of plain, 8.5 s up the back (the sand streaming past), 8.5 s over the crest and down the face, 8 s past the dome.
    const KU = [0, zToU(TOE_Z), zToU(CREST_Z), zToU(A.slipFoot.z), zToU(176), zToU(228), 1];
    for (let i = 1; i < KU.length; i++) KU[i] = Math.max(KU[i], KU[i - 1] + 0.01);
    const KT = [0, 8, 24, 30, 34, 37, JOURNEY], KR = [0, 1.1, 9.8, 17.5, 28, 32, DURATION];   // (a second less on the back, nearly two more in the village)
    const lerpK = (xs, ys, x) => { let i = 1; while (i < xs.length - 1 && x > xs[i]) i++; const f = (x - xs[i - 1]) / Math.max(xs[i] - xs[i - 1], 1e-6); return ys[i - 1] + (ys[i] - ys[i - 1]) * Math.min(1, Math.max(0, f)); };
    const tOf = (u) => lerpK(KU, KT, u), uOf = (t) => lerpK(KT, KU, t);
    const segV = KU.slice(1).map((u1, i) => (toReal(u1 * FL) - toReal(KU[i] * FL)) / (KR[i + 1] - KR[i]));   // real metres a second, stretch by stretch
    const pace = (u) => {                                // each stretch's speed, eased across the knots, in the route's measure
      let v = segV[0];
      for (let i = 1; i < segV.length; i++) { const w = Math.min(1, Math.max(0, (u - KU[i] + 0.035) / 0.07)); v += (segV[i] - segV[i - 1]) * w * w * (3 - 2 * w); }
      return v * wAtS(toReal(u * FL)) / (FL / DURATION);
    };
    await ctx.yield();

    // ---- THE CLEARANCE (one rule of the place, in the plan): the course's line is walked every 2 m of route from its
    // first metre to its last; a thing's nearest face stands no nearer to that line than the design's 7 m plus an eighth
    // of the height of its top (a pier 16 m tall: 9 m). gapOf = plan distance from a rectangle to the line; pushOff = how
    // far a thing must go straight away from the course (half-metre steps along X, the side it already stands on) to pass.
    const _cq = new THREE.Vector3(), CRS = []; for (let s = 0; s <= RL0; s += 2) { rp.posAtDist(s, _cq); CRS.push(_cq.x, _cq.z); }
    const gapOf = (x0, z0, x1, z1) => { let g = 1e9;
      for (let i = 0; i < CRS.length; i += 2) { const cx = CRS[i], cz = CRS[i + 1], dx = cx < x0 ? x0 - cx : cx > x1 ? cx - x1 : 0, dz = cz < z0 ? z0 - cz : cz > z1 ? cz - z1 : 0, d = dx * dx + dz * dz; if (d < g) g = d; }
      return Math.sqrt(g); };
    const CLR = (top) => 7 + top / 8;
    const pushOff = (x0, z0, x1, z1, top) => { const sd = (x0 + x1) / 2 >= lineX(Math.max(Z0, Math.min((z0 + z1) / 2, 228))) ? 1 : -1; let k = 0;
      while (k < 80 && gapOf(x0 + sd * k * 0.5, z0, x1 + sd * k * 0.5, z1) < CLR(top)) k++;
      return sd * k * 0.5; };

    const eyeW = new THREE.Vector3(), tan = new THREE.Vector3(), _cv = new THREE.Vector3();
    const updaters = [];                               // (dt, time, camera, u, tick, tJ)

    // ---- the city, the wall, the ring, the cairns, the mesas: boxes of whole cubes on the grid, from one batch.
    // Boxes are collected first, so each can be flagged by what stands between it and the sun once all are known.
    const boxes = [], palmList = [];
    // LOD (set round a group of boxes): 0 always drawn; 1 the city's furniture, drawn only inside the first merge line (72 m);
    // 2 its merged stand-in of 2 m blocks, drawn only beyond it: from the crest no cube of the town is a speck.
    let LOD = 0, LIT = false;                        // LIT: the road's furniture stands in the open sun (its own cell shadow must not repaint it)
    const B = (x, y, z, sx, sy, sz, mat, o) => { if (LIT) o = { ...(o || {}), noShade: true }; boxes.push([x, y, z, sx, sy, sz, mat, o || null, LOD]); if (o && o.solid) markSolid(x, z, sx, sz, y + sy); };
    const SOL = { solid: true }, NOSH = { noShade: true };
    const cr = rng.fork('city');
    const half = (v) => Math.round(v * 2) / 2;

    // ---- the camp at the toe: a well, three palms, a striped awning and the caravan's resting beasts on the dune's first
    // steps, 8 to 22 m to port of the course, so the second picture of the journey has something near the lens. Every box
    // stands on its own step (sunk half a cube, as the cairns are: the sand walks past them).
    const cp = vr.fork('camp'), CAMP_Z = Math.round(TOE_Z + 37), gy = (x, z) => Math.max(0, hAt(x, z) - 0.5);
    // ---- the herd's animal, in whole cubes, laid in profile along +Z (head at +Z); parts = [dx,dy,dz, sx,sy,sz, mat, pose].
    // A camel: four legs set well apart, a body three times as long as it is deep, one hump, a long neck stepping
    // forward and up to a head with a muzzle, a tail, a striped saddle cloth, and either a rider (robe, head, turban)
    // or two bales. A gazelle (oryx-sized, the seed's other herd): long body with a white belly, slim legs, a neck
    // raised or lowered to graze, two back-swept horns, a white scut. o.kneel folds the legs; o.still stops the walk.
    const beastParts = (k, o = {}) => {
      const ph = (k * 0.37) % 1, T = M.TRUNK, load = k % 3 === 1 ? M.LAPIS : k % 3 === 2 ? M.TURQ : M.WHITE, alt = load === M.WHITE ? M.TURQ : M.WHITE;
      const camel = o.camel || cast.herd === 'camel', L = o.kneel ? 0.5 : 2, P = [];
      const leg = (dx, dz, p) => P.push(o.kneel ? [dx, 0, dz - 0.5, 0.5, 0.5, 1.5, T] : [dx, 0, dz, 0.5, L, 0.5, T, o.still ? null : [0, 0.5, 0, 4, (ph + p) % 1]]);
      const chew = o.still ? [0, -0.5, 0, 9 + (k % 3) * 2, ph] : null;
      if (camel) {
        leg(0, 0.5, 0); leg(1, 0.5, 0.5); leg(0, 3.5, 0.5); leg(1, 3.5, 0);
        P.push([0, L, 0, 1.5, 1.5, 4.5, T], [0, L + 1.5, 1.5, 1.5, 1, 1.5, T], [0.5, L + 0.5, -0.5, 0.5, 1, 0.5, T]);            // body, the one hump, tail
        P.push([0.5, L + 0.5, 4.5, 0.5, 1.5, 0.5, T], [0.5, L + 1.5, 5, 0.5, 2, 0.5, T], [0.25, L + 3.5, 4.5, 1, 1, 1.5, T, chew], [0.25, L + 3.5, 6, 1, 0.5, 0.5, M.WHITE, chew]);   // neck in two steps, head, muzzle
        P.push([-0.25, L + 1, 1, 2, 0.5, 2.5, load], [-0.25, L + 0.5, 1.5, 2, 0.5, 1.5, alt]);                                   // the saddle cloth, two stripes
        if (k % 3 === 0) P.push([0.25, L + 2.5, 1.5, 1, 2, 1, alt === M.TURQ ? M.LAPIS : M.WHITE], [0.25, L + 4.5, 1.75, 1, 0.5, 0.5, T], [0.25, L + 5, 1.5, 1, 0.5, 1, M.TURQ]);   // the rider: robe, face, turban
        else P.push([-0.5, L, 2, 0.5, 1.5, 1.5, alt], [1.5, L, 2, 0.5, 1.5, 1.5, alt], [0.25, L + 2.5, 1.75, 1, 0.5, 1, load]);                                  // or bales either side and a roll on the hump
      } else {
        // An antelope (fix 6: the old one read as a bench): long legs a cube thick, a slim body that rises to the shoulder,
        // a neck leaning forward so the head is carried ahead of the forelegs, two thin dark horns swept back, white belly and rump.
        const down = k % 4 === 3, HN = M.RDEEP;      // (horns in deep violet from every side)
        leg(0, 0.5, 0); leg(0.5, 0, 0.5); leg(0, 3.5, 0.5); leg(0.5, 3, 0);
        P.push([0, L, 0, 1, 1, 4, T], [0, L + 1, 2.5, 1, 0.5, 1.5, T], [0, L - 0.5, 1, 1, 0.5, 2, M.WHITE], [0, L + 0.5, -0.5, 1, 0.5, 0.5, M.WHITE], [0.25, L - 0.5, -0.5, 0.5, 1, 0.5, T]);   // body, withers, white belly, white rump, tail
        if (down && !o.kneel) P.push([0.25, L, 4, 0.5, 1, 1, T], [0.25, L - 1, 5, 0.5, 1.5, 0.5, T], [0.25, L - 1.5, 5.5, 0.5, 0.5, 1, T, chew], [0.25, L - 0.5, 5.5, 0.5, 1, 0.5, HN], [0.25, L + 0.5, 5.5, 0.5, 0.5, 0.5, HN]);   // neck out and down to graze: the head ahead of the forefeet, horns back over the neck
        else P.push([0.25, L + 1, 4, 0.5, 1.5, 0.5, T], [0.25, L + 2, 4.5, 0.5, 1.5, 0.5, T], [0.25, L + 3, 4.5, 0.5, 0.5, 1.5, T, chew], [0.25, L + 3.5, 4.5, 0.5, 1, 0.5, HN, chew], [0.25, L + 4.5, 4, 0.5, 1, 0.5, HN, chew]);   // neck leaning forward in two steps, head, horns swept back
        if (k % 4 === 0) P.push([-0.25, L + 1, 0.5, 1.5, 0.5, 1.5, load]);                                                        // some carry a cloth
      }
      return P;
    };
    const turned = (parts, dir) => dir === 'z' ? parts : parts.map((p) => [dir === '+x' ? p[2] : -(p[2] + p[5]), p[1], p[0], p[5], p[4], p[3], p[6], p[7]]);
    const restOld = (x, z, k, kneel) => {             // the market's small beast, as it was (kept as built): it chews (the head drops a cube)
      const y = gy(x + 0.75, z + 1.5), b = kneel ? 0 : 1.5, load = k % 3 === 1 ? M.LAPIS : k % 3 === 2 ? M.TURQ : M.WHITE, ph = cp();
      if (!kneel) for (const [dx, dz] of [[0, 0], [1, 0], [0, 2.5], [1, 2.5]]) B(x + dx, y, z + dz, 0.5, 1.5, 0.5, M.TRUNK);
      B(x, y + b, z, 1.5, 1, 3, M.TRUNK); B(x + 0.5, y + b + 1, z + 1, 0.5, 0.5, 1, M.TRUNK);
      B(x - 0.5, y + b, z + 0.5, 2.5, 1.5, 2, load); B(x, y + b + 1.5, z + 1, 1.5, 0.5, 1, load === M.WHITE ? M.TURQ : M.WHITE);
      B(x + 0.5, y + b + 0.5, z + 3, 0.5, 1.5, 0.5, M.TRUNK); B(x + 0.5, y + b + 2, z + 3, 0.5, 0.5, 1, M.TRUNK, { pose: [0, -0.5, 0, 9 + (k % 3) * 2, ph] });
    };
    const restBeast = (x, z, k, kneel, dir = 'z') => {   // a beast standing or kneeling in the camp or the market: it chews (the head drops a cube)
      const y = gy(x + 0.75, z + 2.5);
      for (const p of turned(beastParts(k, { kneel, still: true, camel: true }), dir)) B(x + p[0], y + p[1], z + p[2], p[3], p[4], p[5], p[6], p[7] ? { pose: p[7] } : null);
    };
    LIT = true;
    {
      const wx = 16, wz = CAMP_Z, wy = gy(wx + 1.5, wz + 1.5);     // the well: whitewash kerb, turquoise water, a lapis bucket on its beam
      B(wx, wy, wz, 3, 1.5, 3, M.WHITE); B(wx + 0.5, wy + 1.5, wz + 0.5, 2, 0.5, 2, M.WATER);
      B(wx - 0.5, wy, wz + 1, 0.5, 4.5, 0.5, M.TRUNK); B(wx + 3, wy, wz + 1, 0.5, 4.5, 0.5, M.TRUNK); B(wx - 0.5, wy + 4.5, wz + 1, 4, 0.5, 0.5, M.TRUNK);
      B(wx + 1.5, wy + 3, wz + 1, 0.5, 1, 0.5, M.LAPIS, { pose: [0, -0.5, 0, 12, 0.2] });
      B(wx - 3, wy, wz + 3.5, 2, 1, 1, M.LAPIS); B(wx - 3, wy + 1, wz + 3.5, 2, 0.5, 1, M.WATER);     // the trough
      const CP = [[10, wz - 7, 8], [23, wz + 6, 9], [29, wz + 10, 7], [20, wz + 20, 8], [18, wz - 12, 9]];
      for (const q of CP) q[0] += pushOff(q[0] - 4, q[1] - 4, q[0] + 5, q[1] + 5, q[2] + 1);   // (the clearance: a palm's nearest frond; one that fails goes straight away from the course, its draw kept)
      for (const [px, pz, ph] of CP) { palmList.push([px, pz, ph, cp(), 1, gy(px + 0.5, pz + 0.5)]); palmShadow(px, pz, ph); }
      const az = wz - 13, ax = 20 + pushOff(20, az - 0.5, 27, az + 5, 7), ay = Math.max(gy(ax, az), gy(ax + 5, az + 4));               // the awning: four poles, five strips of cloth, a front flap that lifts
      for (const [dx, dz] of [[0, 0], [5, 0], [0, 4], [5, 4]]) B(ax + dx, gy(ax + dx, az + dz), az + dz, 0.5, ay + 3.5 - gy(ax + dx, az + dz), 0.5, M.TRUNK);
      for (let k = 0; k < 5; k++) B(ax + 0.5 + k, ay + 3.5, az - 0.5, 1, 0.5, 5.5, k % 2 ? M.WHITE : M.TURQ);
      for (let k = 0; k < 5; k++) B(ax + 0.5 + k, ay + 2.5, az - 0.5, 1, 1, 0.5, k % 2 ? M.WHITE : M.TURQ, { pose: [0, 0.5, -0.5, 5, k * 0.13] });
      B(ax + 1, gy(ax + 1, az + 1), az + 1, 1.5, 1, 1.5, M.WHITE); B(ax + 3, gy(ax + 3, az + 2), az + 2, 1, 1.5, 1, M.LAPIS); B(ax + 3, gy(ax + 3, az + 2) + 1.5, az + 2, 1, 0.5, 1, M.TURQ);   // bales and a jar
      B(ax + 6.5, gy(ax + 6.5, az + 2), az + 2, 0.5, 7, 0.5, M.TRUNK); B(ax + 6.5, gy(ax + 6.5, az + 2) + 6, az + 2.5, 0.5, 1, 2, M.TURQ, { pose: [0, -0.5, 0, 4, 0.4] });        // a pennant
      // two of the caravan's beasts kneel by the well, laid across the course so the eye coming up it sees them in profile
      restBeast(17.5, wz - 5, 1, true, '-x'); restBeast(21, wz + 9, 2, true, '+x');
      markSolid(wx, wz, 3, 3, wy + 2); markSolid(ax, az, 5.5, 4.5, ay + 4); markSolid(11, wz - 5, 6, 2, gy(13, wz - 4) + 2.5); markSolid(21, wz + 9, 6, 2, gy(23, wz + 10) + 2.5);
    }
    // ---- the road to the dune: the plain and the back are a caravan road, furnished at every depth so each picture of
    // the climb has a near thing, a middle and a far one: striped tents, palms in threes, the caravan crossing (see the
    // cast), and under the knife edge the halt. Every box stands on its own step (sunk half a cube: the sand walks past).
    const restHerd = (x, z, k) => { const y = gy(x + 2.5, z + 0.75); for (const p of turned(beastParts(k, { kneel: true, still: true }), '+x')) B(x + p[0], y + p[1], z + p[2], p[3], p[4], p[5], p[6], p[7] ? { pose: p[7] } : null); };   // one of the seed's herd, lying down
    const tent = (ax, az, c1, c2, flag) => {             // 6 m by 5 m: four poles, a stepped roof in stripes, a valance that lifts, a back cloth, bales
      const ay = Math.max(gy(ax, az), gy(ax + 5.5, az), gy(ax, az + 4.5), gy(ax + 5.5, az + 4.5));
      for (const [dx, dz] of [[0, 0], [5.5, 0], [0, 4.5], [5.5, 4.5]]) B(ax + dx, gy(ax + dx, az + dz), az + dz, 0.5, ay + 3 - gy(ax + dx, az + dz), 0.5, M.TRUNK);
      for (let k = 0; k < 6; k++) B(ax + k, ay + 3, az - 0.5, 1, 0.5, 6, k % 2 ? M.WHITE : c1);
      for (let k = 1; k < 5; k++) B(ax + k, ay + 3.5, az, 1, 0.5, 5, k % 2 ? M.WHITE : c1);
      B(ax + 2, ay + 4, az + 0.5, 1, 0.5, 4, c1); B(ax + 3, ay + 4, az + 0.5, 1, 0.5, 4, M.WHITE);
      for (let k = 0; k < 6; k++) B(ax + k, ay + 2, az - 0.5, 1, 1, 0.5, k % 2 ? c1 : M.WHITE, { pose: [0, 0.5, -0.5, 5, k * 0.13] });
      B(ax, gy(ax + 3, az + 4.5), az + 4.5, 6, ay + 3 - gy(ax + 3, az + 4.5), 0.5, c2); B(ax + 5.5, gy(ax + 5.5, az + 2), az + 2.5, 0.5, ay + 3 - gy(ax + 5.5, az + 2), 2, c2);
      B(ax + 1, gy(ax + 1, az + 1.5), az + 1.5, 1.5, 1, 1.5, c2 === M.WHITE ? M.LAPIS : M.WHITE); B(ax + 3.5, gy(ax + 3.5, az + 2), az + 2, 1, 1.5, 1, M.TRUNK); B(ax + 3.5, gy(ax + 3.5, az + 2) + 1.5, az + 2, 1, 0.5, 1, c1);
      if (flag) { const fy = gy(ax - 1.5, az + 2); B(ax - 1.5, fy, az + 2, 0.5, 8, 0.5, M.TRUNK); B(ax - 1.5, fy + 7, az + 2.5, 0.5, 1, 2.5, M.TURQ, { pose: [0, -0.5, 0, 4, 0.4] }); }
      markSolid(ax, az, 6, 5, ay + 4.5);
    };
    const grove = (list) => { for (const [px, pz, ph] of list) { palmList.push([px, pz, ph, cp(), 1, gy(px + 0.5, pz + 0.5)]); palmShadow(px, pz, ph); } };
    // Placed by what each picture of the climb sees: Z02, Z16, Z25 are where the eye is at u 0.02, 0.16 and 0.25 on this seed.
    const zU = (u) => Math.round(path.pointAt(u).z), Z02 = zU(0.02), Z08 = zU(0.08), Z16 = zU(0.16), Z25 = zU(0.25), LX = (z) => Math.round(lineX(z));
    const HALT_Z = Math.round(Math.min(CREST_Z - 27, zU(0.2) + 37)), ROAD1 = Math.max(CAMP_Z + 5, Z02 + 20), ROAD2 = Z16 + 20;
    {
      tent(LX(ROAD1 + 9) + 24, ROAD1 + 9, M.TURQ, M.LAPIS, true);                                                         // beyond the camp and the caravan, to port
      tent(LX(Z02 + 40) - 32, Z02 + 40, M.LAPIS, M.WHITE, false); grove([[LX(Z02 + 30) - 22, Z02 + 30, 8], [LX(Z02 + 50) - 26, Z02 + 50, 7], [LX(Z02 + 56) - 33, Z02 + 56, 9]]);   // and to starboard beyond the cairns
      // the first strata (the still at u 0.08): a rider's beast standing by a tent to port, palms either side
      restBeast(LX(Z08 + 17) + 7, Z08 + 17, 0, false, '+x'); markSolid(LX(Z08 + 17) + 7, Z08 + 17, 6, 2, gy(LX(Z08 + 17) + 9, Z08 + 18) + 2.5);
      tent(LX(Z08 + 34) + 21, Z08 + 34, M.LAPIS, M.WHITE, true); grove([[LX(Z08 + 44) + 28, Z08 + 44, 8], [LX(Z08 + 30) + 27, Z08 + 30, 9], [LX(Z08 + 24) + 22, Z08 + 24, 8]]);
      restBeast(LX(Z08 + 14) - 11, Z08 + 14, 2, true, '+x'); markSolid(LX(Z08 + 14) - 11, Z08 + 14, 6, 2, gy(LX(Z08 + 14) - 8, Z08 + 15) + 2.5);   // and one kneeling to starboard, nearer, whole
      grove([[LX(Z08 + 30) - 20, Z08 + 30, 8], [LX(Z08 + 36) - 26, Z08 + 36, 7], [LX(Z08 + 24) - 28, Z08 + 24, 9]]);
      tent(LX(Z16 + 56) + 40, Z16 + 56, M.TURQ, M.LAPIS, true); grove([[LX(Z16 + 50) + 30, Z16 + 50, 8], [LX(Z16 + 62) + 37, Z16 + 62, 7]]);   // halfway up, to port, beyond the caravan
      tent(LX(Z16 + 46) - 30, Z16 + 46, M.TURQ, M.WHITE, false); grove([[LX(Z16 + 38) - 21, Z16 + 38, 7], [LX(Z16 + 56) - 36, Z16 + 56, 9], [LX(Z16 + 62) - 44, Z16 + 62, 8]]);
      // the halt under the last stairs, 9 m to port of the course: a lapis tent, its pennant, a beast kneeling; and
      // nearer the knife edge one of the herd lies on the stairs to starboard, whole, below the others
      tent(LX(HALT_Z) + 8, HALT_Z, M.LAPIS, M.WHITE, true); restBeast(LX(HALT_Z) + 15, HALT_Z + 7, 1, true, '-x');
      restHerd(-10, Z25 + 13, 4); markSolid(-10, Z25 + 13, 6, 2, gy(-7, Z25 + 14) + 2.5);
      // (fix 8) three of the caravan stand on the knife edge itself, out on the port shoulder: from the middle of the back they are
      // small against the sky bands; from under the edge (u 0.25) they are beyond the frame's side
      for (const [k, sx] of [[0, 38], [4, 49], [3, 60]]) { const sz = Math.round(A.crestAt(sx + 3).z) - 2; restBeast(sx, sz, k, false, '+x'); }
    }
    LIT = false;
    // waymark cairns, 9 m to starboard of the course across the plain
    const ZCUT = [0.02, 0.05, 0.08, 0.12, 0.16, 0.205].map((u) => path.pointAt(u).z);
    for (let z = Z0 + 14; z < CREST_Z - 34; z += 18) {    // they go on up the dune's back, keeping 9 m to starboard of the course
      const cx = Math.round(lineX(z)) - 9, cy = Math.max(0, hAt(cx, z) - 0.5); if (Math.abs(z - ROAD1) < 5 || Math.abs(z - ROAD2) < 5 || Math.abs(z - Z08 - 13.5) < 6) continue;
      if (ZCUT.some((ze) => z - ze > 6 && z - ze < 12)) continue;      // (fix 7: none stands where a still's right edge would cut it: 6 to 12 m ahead of the eye)
      markSolid(cx - 1, z - 1, 2, 2, cy + 4);
      B(cx - 1, cy, z - 1, 2, 1, 2, M.WHITE, NOSH); B(cx - 0.5, cy + 1, z - 0.5, 1, 2.5, 1, M.WHITE, NOSH); B(cx - 0.5, cy + 3.5, z - 0.5, 1, 0.5, 1, M.TURQ, NOSH);
    }
    // three mesas on the horizon, stacks of 32 m blocks
    [[-560, 1180, 5, 3], [90, 1420, 8, 3], [620, 1060, 4, 2], [-900, 300, 4, 2], [880, -150, 5, 3]].forEach(([mx, mz, w, n]) => {
      for (let k = 0; k < n; k++) { const ww = (w - k * 1.5) * 32, dd = (3 - k * 0.5) * 32; B(mx - ww / 2 + k * 16, k * 32, mz - dd / 2, ww, 32, dd, M.HARDPAN, { noShade: true }); }
    });

    // the dune is one of a field: a dozen lesser crescents march over the plain beyond the wall, stacks of 16 m blocks
    // with pale sun fronts, each throwing its violet cell-shadow to starboard, so from the crest the far plain is a
    // country and not a band of one ochre. (Blocks of 16 m: at 500 m and more they are still ten pixels.)
    const fr = vr.fork('field');           // (forked off the visit's rng, whose draws are done: the main rng's order is as it was)
    for (let k = 0; k < 13; k++) {
      const side = k % 2 ? 1 : -1, fz = Math.round((440 + k * 46 + fr.range(0, 30)) / 16) * 16, fx = Math.round(side * (70 + fr.range(0, 1) * (140 + k * 38)) / 16) * 16;
      const n = k % 3 === 0 ? 3 : 2, w = fr.int(5, 8) * 16, d = fr.int(3, 4) * 16;
      for (let j = 0; j < n; j++) B(fx - w / 2 + j * 16, j * 16, fz - d / 2 + j * 16, w - j * 32, 16, d - j * 16, j === 1 ? M.SLIP : M.SAND, NOSH);
      B(fx - w / 2, 0, fz + d / 2, 16, 16, 32, M.SAND, NOSH); B(fx + w / 2 - 16, 0, fz + d / 2, 16, 16, 32, M.SAND, NOSH);          // its two horns
      B(fx - w / 2 - 48 * n, 0, fz - d / 2 + 16, 48 * n, 0.5, d + 16, M.SAND, { sh: 1 });                                         // its shadow: three cells a cube of height
    }
    [[-560, 1180, 5, 3], [90, 1420, 8, 3], [620, 1060, 4, 2]].forEach(([mx, mz, w, n]) => B(mx - w * 16 - 96 * n, 0, mz - 32, 96 * n, 0.5, 80, M.HARDPAN, { sh: 1 }));   // the mesas' shadows

    // (The face rule's pieces are laid through F, which notes each one's box and where the boxes of its own block begin: see
    // THE FACE RULE LEAVES ROOM, below, once everything stands.)
    const FACE = [], F = (own, x, y, z, sx, sy, sz, mat, o) => { FACE.push([boxes.length, own]); B(x, y, z, sx, sy, sz, mat, o); };
    // forty flat-roofed houses in two blocks either side of the arcade
    const roofs = [];
    for (let side = -1; side <= 1; side += 2) for (let row = 0; row < 5; row++) for (let col = 0; col < 4; col++) {
      const w0 = cr.int(7, 10), d0 = cr.int(7, 10), h0 = cr.int(4, 9), jx = cr.int(-1, 1), jz = cr.int(-2, 2);
      const two0 = cr.chance(0.35), cloth = cr.chance(0.55), cm = cr.chance(0.5) ? M.TURQ : M.WHITE;
      const w = w0, d = d0, h = side > 0 ? Math.min(h0, col === 0 ? 4 : col === 1 ? 7 : 9) : h0, two = two0 && !(side > 0 && col < 2);
      const x0 = side > 0 ? 27 + col * 14 + jx : -(21 + col * 14 + jx) - w, zr = 158 + row * 14 + jz + (col > 1 ? 4 : 0), z0 = (side < 0 && row === 1) ? Math.min(zr, 182 - d) : zr;
      if (side < 0 && row === 2) continue;            // the caravan's cross street (every draw above is still made)
      B(x0, 0, z0, w, h, d, M.BRICK, { solid: true, vote: true });
      B(x0, h, z0, w, 1, 0.5, M.WHITE); B(x0, h, z0 + d - 0.5, w, 1, 0.5, M.WHITE); B(x0, h, z0 + 0.5, 0.5, 1, d - 1, M.WHITE); B(x0 + w - 0.5, h, z0 + 0.5, 0.5, 1, d - 1, M.WHITE);
      const dx = side > 0 ? x0 - 0.5 : x0 + w, dz = z0 + cr.int(1, d - 3);
      LOD = 1;
      B(dx, 0, dz, 0.5, 2.5, 1.5, M.LAPIS); B(x0 + cr.int(1, w - 3), 0, z0 - 0.5, 1.5, 2.5, 0.5, M.LAPIS);
      if (h > 5) B(side > 0 ? x0 - 0.5 : x0 + w, h - 2.5, z0 + d - 3, 0.5, 1, 1, M.LAPIS);
      if (two) { LOD = 0; B(x0 + 1, h, z0 + 1, w - 4, 3, d - 3, M.BRICK); B(x0 + 1, h + 3, z0 + 1, w - 4, 0.5, d - 3, M.WHITE); LOD = 1; }
      if (cloth) {                                    // a pole and a cloth flapping between two cube poses
        const px = x0 + (side > 0 ? 0.5 : w - 1), pz = z0 + d - 1, ph = cr();
        B(px, h + 1, pz, 0.5, 2.5, 0.5, M.TRUNK);
        B(px, h + 2.5, pz - 1.5, 0.5, 1, 1.5, cm, { pose: [0, -0.5, 0, 4, ph] }); B(px, h + 2, pz - 2.5, 0.5, 1, 1, cm, { pose: [0, 0.5, 0, 4, ph + 0.3] });
      }
      // THE TOWN'S FACE RULE (every block and pillar of the town): no face shows more than 4 m of height in one ink. Every 4 m
      // up a house wall there is a course of real cubes, by turns: a band of lapis or turquoise a cell proud all round, a row of
      // lapis openings a cube deep, or a row of whitewash and turquoise cloths lifting a cube. (No draw is made: the turn is the
      // house's number. A house with a stair street, or with live's window in the band's way, takes openings or cloths.)
      { const hi = roofs.length, stair = hi % 4 < 2 && z0 < 180, wy = h > 5 ? h - 2.5 : 1e9, sf = side > 0 ? 0 : 1; LOD = 1;
        let hb = boxes.length - 1; while (!(boxes[hb][7] && boxes[hb][7].vote)) hb--;                                           // this house's own boxes begin at its body
        for (let yc = 4; yc < h; yc += 4) {
          let kind = (hi + yc / 4) % 3; if (kind === 0 && (stair || (wy < yc + 0.5 && wy + 1 > yc))) kind = 1 + (hi % 2);
          if (kind === 0) { F(hb, x0 - 0.5, yc, z0 - 0.5, w + 1, 0.5, d + 1, hi % 2 ? M.LAPIS : M.TURQ, { at: [x0 + w + 1, yc + 0.6, z0 - 1] }); continue; }
          const oh = kind === 1 ? Math.min(1.5, h - yc) : 1;
          for (let f = 0; f < 4; f++) { const len = f < 2 ? d : w;
            for (let t = 1, n = 0; t + 1.5 <= len - 0.5; t += 2.5, n++) {
              if (f === 2 && stair && t < w - yc) continue;                                                                    // the stair street climbs this wall: a course only where the wall stands clear above the steps
              if (f === sf && wy < yc + oh && wy + 1 > yc - 0.5 && z0 + t < z0 + d - 2 && z0 + t + 1.5 > z0 + d - 3) continue;      // live's window stands here
              const bx = f === 0 ? x0 - 0.5 : f === 1 ? x0 + w : x0 + t, bz = f === 2 ? z0 - 0.5 : f === 3 ? z0 + d : z0 + t, ox = f === 0 ? -0.5 : f === 1 ? 0.5 : 0, oz = f === 2 ? -0.5 : f === 3 ? 0.5 : 0;
              if (kind === 1) F(hb, bx, yc, bz, f < 2 ? 0.5 : 1.5, oh, f < 2 ? 1.5 : 0.5, M.LAPIS);
              else F(hb, bx, yc - 0.5, bz, f < 2 ? 0.5 : 1.5, 1, f < 2 ? 1.5 : 0.5, (n + hi) % 2 ? M.WHITE : M.TURQ, { pose: [ox, 0.5, oz, 5 + (n % 2), (hi * 0.37 + f * 0.21 + n * 0.13) % 1] });
            } }
        } }
      LOD = 0; roofs.push([x0, h, z0, w, d, two]);
    }
    await ctx.yield();

    // ---- the market square, in the sun between the slip-foot palms and the dome's shadow: the course swings through it
    // low. Stalls under striped awnings whose flaps lift, jars and bales, resting beasts, washing strung across the street
    // (cloths only: a line does not exist), and a minaret to starboard. All boxes on the grid; stalls and tower cast cell shadows.
    const mk = vr.fork('market');
    const stall = (x0, z0, street, pair) => {            // 4 m by 3 m; street = -1 if its open side faces -X, +1 if +X
      LOD = 2; B(x0, 0, z0 - 0.5, 2, 3.5, 4, pair); B(x0 + 2, 0, z0 - 0.5, 2, 3.5, 4, M.WHITE); LOD = 1;
      for (const [dx, dz] of [[0, 0], [3.5, 0], [0, 2.5], [3.5, 2.5]]) B(x0 + dx, 0, z0 + dz, 0.5, 3, 0.5, M.TRUNK);
      for (let k = 0; k < 4; k++) B(x0 + k, 3, z0 - 0.5, 1, 0.5, 4, k % 2 ? M.WHITE : pair);
      for (let k = 0; k < 4; k++) B(street < 0 ? x0 - 0.5 : x0 + 4, 2, z0 - 0.5 + k, 0.5, 1, 1, k % 2 ? pair : M.WHITE, { pose: [street * 0.5, 0.5, 0, 5 + (k % 2), mk()] });
      B(x0 + 0.5, 0, z0 + 0.5, 3, 1, 2, M.BRICK2);
      for (let k = 0; k < 3; k++) B(x0 + 0.5 + k, 1, z0 + 0.5 + (k % 2) * 0.5, 1, mk.chance(0.5) ? 1 : 0.5, 1, mk.pick([M.TURQ, M.WHITE, M.LAPIS, M.TRUNK, M.PALM]));
      const fx = street < 0 ? x0 - 2.5 : x0 + 5;          // jars and a stack of carpets on the paving before it
      B(fx, 0, z0, 1, 1.5, 1, M.TRUNK); B(fx, 1.5, z0, 1, 0.5, 1, pair); B(fx + 0.5, 0, z0 + 2, 1, 1, 1, mk.pick([M.WHITE, M.TURQ, M.TRUNK]));
      markSolid(x0, z0, 4, 3, 3.5); LOD = 0;
    };
    stall(4, 109, -1, M.TURQ); stall(-1, 116, -1, M.LAPIS); stall(-5, 126, -1, M.TURQ);
    stall(-21, 109, 1, M.LAPIS); stall(-27, 117, 1, M.TURQ); stall(-32, 125, 1, M.LAPIS); stall(-34, 109, 1, M.TURQ); stall(-39, 118, 1, M.WHITE);
    // Washing strung across the street, well overhead (cloths only: a line does not exist). No bare pole stands near the
    // course: one line runs from the minaret to the dome's drum, the other from a whitewash post with a turquoise cap to the drum.
    // (Fix 6: the second line hangs before the lens in the dome's shade: from a whitewash post by the first house to the
    // dome's drum, sagging in the middle and stepping a cube nearer the dome every few cloths: cloths only, each its own box.)
    [[135, -30.5, 9, 13, 0], [152, -20, 15, 11, 1]].forEach(   // (fix 7: both hang higher: from the street they are a row of small flags in the upper third, and passing under them none stands near the lens)
    ([wz, xa, xb, yy, hung]) => {
      const zs = (x) => hung ? wz - Math.round(14 * (x - xa) / (xb - xa)) / 2 : wz, ys = (x) => { const t = 2 * (x - xa) / (xb - xa) - 1; return hung ? yy + Math.round(6 * t * t) / 2 : yy; };
      LOD = 1;
      for (let x = xa + 0.5, k = 0; x < xb - 1.5; x += 2, k++) { const tall = k % 3 === 1 ? 2.5 : 1.5;
        B(x, ys(x) + 2 - tall, zs(x), 1.5, tall, 0.5, [M.WHITE, M.TURQ, M.WHITE, M.LAPIS][k % 4], { pose: [0, 0, 0.5, 4 + (k % 3), mk()] }); }
      LOD = 2; for (let x = xa + 0.5, k = 0; x < xb - 3; x += 4, k++) B(x, ys(x), zs(x), 4, 2, 0.5, [M.WHITE, M.TURQ, M.WHITE, M.LAPIS][k % 4]);
      LOD = 0;
    });
    { const px = -22; B(px, 0, 151, 2, 8, 2, M.WHITE, SOL); B(px - 0.5, 0, 150.5, 3, 1, 3, M.WHITE); B(px, 8, 151, 2, 1, 2, M.LAPIS); B(px, 9, 151, 2, 5.5, 2, M.WHITE, SOL); B(px, 14.5, 151, 2, 1, 2, M.TURQ); }   // the second line's whitewash post, 14 m from the course
    {                                                   // the minaret: stepped whitewash shaft, lapis bands, a balcony, a turquoise cap, a pennant
      const tx = -35, tz = 133;
      B(tx - 1, 0, tz - 1, 6, 2, 6, M.WHITE, SOL); for (let k = 0; k < 4; k++) B(tx, 2 + k * 4.5, tz, 4, 4.5, 4, M.WHITE, SOL);
      B(tx - 0.5, 8, tz - 0.5, 5, 1, 5, M.LAPIS); B(tx - 0.5, 20, tz - 0.5, 5, 0.5, 5, M.LAPIS);   // (fix 7: the lower band stands a whole cell proud of the shaft: it shared the shaft's four faces and printed as a comb)
      B(tx - 1, 20.5, tz - 1, 6, 1, 6, M.WHITE);
      B(tx - 1, 21.5, tz - 1, 6, 1, 0.5, M.WHITE); B(tx - 1, 21.5, tz + 4.5, 6, 1, 0.5, M.WHITE); B(tx - 1, 21.5, tz - 0.5, 0.5, 1, 5, M.WHITE); B(tx + 4.5, 21.5, tz - 0.5, 0.5, 1, 5, M.WHITE);   // the balcony's parapet: four slabs (its eight posts printed as a comb)
      B(tx + 0.5, 21.5, tz + 0.5, 3, 1.5, 3, M.WHITE); B(tx + 0.5, 23, tz + 0.5, 3, 1.5, 3, M.LAPIS); B(tx + 0.5, 24.5, tz + 0.5, 3, 2, 3, M.WHITE);   // (the lantern split round its band: three courses)
      B(tx, 26.5, tz, 4, 1, 4, M.WHITE);
      B(tx + 0.5, 27.5, tz + 0.5, 3, 1.5, 3, M.TURQ); B(tx + 1, 29, tz + 1, 2, 1.5, 2, M.TURQ2); B(tx + 1.5, 30.5, tz + 1.5, 1, 3, 1, M.WHITE);
      B(tx + 1.5, 32, tz + 2.5, 1, 1, 2.5, M.TURQ, { pose: [0, -0.5, 0, 4, 0.1] }); B(tx + 1.5, 31.5, tz + 5, 1, 1, 1.5, M.TURQ, { pose: [0, 0.5, 0, 4, 0.45] });
      B(tx + 1.5, 0, tz - 1.5, 1.5, 3, 0.5, M.LAPIS); B(tx + 4, 12, tz + 1.5, 0.5, 1.5, 1, M.LAPIS); B(tx + 1.5, 15, tz - 0.5, 1, 1.5, 0.5, M.LAPIS);
      // (the face rule: between the lapis bands the shaft carries a course every 4 m: a turquoise band a cell proud at 4 m and
      // at 16.5 m, and at 12 m a lapis opening a cube deep on each of the three faces that had none)
      LOD = 1; const mat = { at: [tx + 2, 30, tz + 2] }, m0 = boxes.findIndex((b) => b[0] === tx - 1 && b[2] === tz - 1 && b[3] === 6);   // m0: the minaret's own boxes begin at its plinth
      F(m0, tx - 0.5, 4.5, tz - 0.5, 5, 0.5, 5, M.TURQ, mat); F(m0, tx - 0.5, 16.5, tz - 0.5, 5, 0.5, 5, M.TURQ, mat);
      F(m0, tx + 1.5, 12, tz - 0.5, 1, 1.5, 0.5, M.LAPIS); F(m0, tx + 1.5, 12, tz + 4, 1, 1.5, 0.5, M.LAPIS); F(m0, tx - 0.5, 12, tz + 1.5, 0.5, 1.5, 1, M.LAPIS);
      LOD = 0;
    }
    LOD = 1; restOld(-14, 106, 5, true); restOld(-29, 113, 6, false); restOld(-4, 129, 7, true); restOld(-36, 123, 8, false);
    LOD = 0; B(2, 0, 139, 5, 1.5, 3, M.WHITE); B(2.5, 1.5, 139.5, 4, 0.5, 2, M.WATER);     // the fountain basin at the channel's head
    // in the dome's shade, before the first arch: a carpet seller's stall, stacks and jars, two beasts lying down (all in their violet twins there)
    stall(-18, 158, 1, M.TURQ); LOD = 1; restOld(-27, 146, 9, true); restOld(-2, 146, 10, true);
    {                                                   // the carpet seller's rack: three carpets hung side by side, each lifting a cube (it stands between the eye in the dome's shade and the far gate)
      const rx = -20, rz = 162;   // (fix 7: a low rail behind the stall, beside the first house: two striped carpets, no taller than the stall, out of the colonnade's picture)
      LOD = 1; B(rx, 0, rz, 0.5, 4, 0.5, M.TRUNK); B(rx + 3.5, 0, rz, 0.5, 4, 0.5, M.TRUNK); B(rx, 4, rz, 4, 0.5, 0.5, M.TRUNK);
      [[M.LAPIS, M.WHITE], [M.TURQ, M.WHITE]].forEach(([c1, c2], k) => { const cx = rx + 0.5 + k * 1.5, ps = [0, 0, -0.5, 6 + k, mk()];
        B(cx, 3, rz, 1.5, 1, 0.5, c1, { pose: ps }); B(cx, 2.5, rz, 1.5, 0.5, 0.5, c2, { pose: ps }); B(cx, 1.5, rz, 1.5, 1, 0.5, c1, { pose: ps }); B(cx, 1, rz, 1.5, 0.5, 0.5, c2, { pose: ps }); });
      LOD = 2; B(rx + 0.5, 1, rz, 3, 3, 0.5, M.LAPIS); LOD = 1; markSolid(rx, rz, 4, 1, 4);
    }
    LOD = 1;
    for (const [bx, bz, c1, c2] of [[-32, 148, M.LAPIS, M.WHITE], [-3, 153, M.TURQ, M.WHITE], [-28, 143, M.WHITE, M.TURQ]]) { B(bx, 0, bz, 3, 0.5, 2, c1); B(bx + 0.5, 0.5, bz, 2, 0.5, 2, c2); B(bx + 3.5, 0, bz + 0.5, 1, 1.5, 1, M.TRUNK); B(bx + 3.5, 1.5, bz + 0.5, 1, 0.5, 1, c1); }
    LOD = 0;
    // roofs lived on: an awning, jars; and stairs up the south walls of the first rows (stair streets)
    for (let i = 0; i < roofs.length; i++) {
      const [rx, rh, rz, rw, rd, two] = roofs[i], c = [M.TURQ, M.WHITE, M.LAPIS][i % 3];
      if (!two && i % 2 === 0) { LOD = 1; B(rx + 1, rh, rz + 1, 0.5, 3, 0.5, M.TRUNK); B(rx + rw - 1.5, rh, rz + 1, 0.5, 3, 0.5, M.TRUNK);
        LOD = 0; B(rx + 1, rh + 3, rz + 0.5, rw - 2, 0.5, 3, c); LOD = 1; B(rx + 1, rh + 2, rz + 3.5, rw - 2, 1, 0.5, c === M.WHITE ? M.TURQ : M.WHITE, { pose: [0, 0.5, 0.5, 5, mk()] }); }
      LOD = 1;
      if (i % 3 === 1) { const jx = two ? rx + 2 : rx + rw - 3, jz = two ? rz + 2 : rz + rd - 3, jy = rh + (two ? 3.5 : 0); B(jx, jy, jz, 1, 1, 1, M.TRUNK); B(jx - 1.5, jy, jz, 1, 0.5, 1, M.TURQ); }
      LOD = 0;
      if (i % 4 < 2 && rz < 180) for (let k = 0; k < Math.min(rh, rw - 1); k++) B(rx + rw - 1 - k, 0, rz - 1, 1, k + 1, 1, M.BRICK2);
    }

    await ctx.yield();
    // four stepped arches across the course: whitewash, turquoise keystones. THE CLEARANCE moves the piers of an arch out
    // together, with their span, bands, cloths and bunting (a named departure from the design's 'opening 14 m wide'): PO is
    // the least whole number of metres by which every box of both piers passes the rule (shaft, plinth, bands, openings).
    const pierOut = (az, jog) => { let po = 0;
      const bad = (q) => [[7, az - 1, 9, az + 1, 16], [6.5, az - 1.5, 9.5, az + 1.5, 13]].some(([x0, z0, x1, z1, top]) =>
        gapOf(x0 + jog + q, z0, x1 + jog + q, z1) < CLR(top) || gapOf(-x1 + jog - q, z0, -x0 + jog - q, z1) < CLR(top));
      while (po < 12 && bad(po)) po++; return po; };
    const ARCH = [176, 192, 208, 224].map((az) => { const jog = cr.chance(0.5) ? 0.5 : 0; return [az, jog, pierOut(az, jog)]; });   // jog: the builder's hand: one stands a cube out of true
    for (const [az, jog, PO] of ARCH) {
      const R = 7 + PO, a0 = boxes.length;            // a0: this arch's own boxes begin here
      LOD = 0;
      B(-R - 2 + jog, 0, az - 1, 2, 10, 2, M.WHITE, { solid: true, at: [-R - 1 + jog, 16.05, az] }); B(R + jog, 0, az - 1, 2, 10, 2, M.WHITE, { solid: true, at: [R + 1 + jog, 16.05, az] });        // (piers in two boxes, split where the span springs: every corner meets a corner, so no crack shows)
      B(-R - 2 + jog, 10, az - 1, 2, 6, 2, M.WHITE, { solid: true, at: [-R - 1 + jog, 16.05, az] }); B(R + jog, 10, az - 1, 2, 6, 2, M.WHITE, { solid: true, at: [R + 1 + jog, 16.05, az] });
      B(-R - 2.5 + jog, 0, az - 1.5, 3, 1, 3, M.WHITE, { at: [-R - 1 + jog, 0.6, az - 2.2] }); B(R - 0.5 + jog, 0, az - 1.5, 3, 1, 3, M.WHITE, { at: [R + 1 + jog, 0.6, az - 2.2] });
      for (let xi = -R; xi < R; xi++) {
        const xc = xi + 0.5, yo = Math.floor(9 + 4 * Math.sqrt(Math.max(0, 1 - (xc / R) * (xc / R))));
        B(xi + jog, yo, az - 1, 1, 16 - yo, 2, M.WHITE, NOSH);        // (the span is not in the shadow map: that is a height field, and the opening must let the sun through)
      }
      B(-1 + jog, 12.5, az - 1.5, 2, 2, 3, M.TURQ, { at: [jog, 13.5, az - 2.2] });
      LOD = 1;   // (fix 8: the piers' half-metre bands and the battlements are drawn inside the first merge line only: from the crest they were ticks a pixel or two across)
      B(-R - 2.5 + jog, 9, az - 1.5, 3, 0.5, 3, M.LAPIS, { at: [-R - 1 + jog, 9.3, az - 2.2] }); B(R - 0.5 + jog, 9, az - 1.5, 3, 0.5, 3, M.LAPIS, { at: [R + 1 + jog, 9.3, az - 2.2] });
      for (let xi = -R - 2; xi < R + 2; xi += 2) B(xi + jog, 16, az - 1, 1, 1, 2, M.WHITE);
      for (const sd of [-1, 1]) {                       // a cloth hangs on each pier's outer face under the lapis band, lifting a cube
        const cx = sd < 0 ? -R - 2.5 + jog : R + 2 + jog, cm = ((az >> 4) + (sd > 0 ? 1 : 0)) % 2 ? M.TURQ : M.WHITE, ph = mk();
        B(cx, 5.5, az - 0.5, 0.5, 3, 1, cm, { at: [cx + sd * 0.6, 8, az], pose: [sd * 0.5, 0, 0, 5, ph] }); B(cx, 4, az - 0.5, 0.5, 1.5, 1, cm, { at: [cx + sd * 0.6, 5, az], pose: [sd * 0.5, 0.5, 0, 5, (ph + 0.3) % 1] });
        // (the town's face rule: no face of a pier shows more than 4 m in one ink) a turquoise band a cell proud under the cloth and
        // another under the battlements, and between the first and the lapis band a lapis opening a cube deep on the three free faces
        const px = sd < 0 ? -R - 2 + jog : R + jog, at = [px + 1, 16.05, az];
        F(a0, px - 0.5, 3.5, az - 1.5, 3, 0.5, 3, M.TURQ, { at }); F(a0, px - 0.5, 12.5, az - 1.5, 3, 0.5, 3, M.TURQ, { at });
        F(a0, sd < 0 ? px + 2 : px - 0.5, 6, az - 0.5, 0.5, 1, 1, M.LAPIS, { at }); F(a0, px + 0.5, 6, az - 1.5, 1, 1, 0.5, M.LAPIS, { at }); F(a0, px + 0.5, 6, az + 1, 1, 1, 0.5, M.LAPIS, { at });
      }
    }

    // bunting from arch to arch along both sides, high over the piers: cloths only, each dropping a cube in its turn
    for (let a = 0; a < 3; a++) for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const az = ARCH[a][0], bo = Math.max(ARCH[a][2], ARCH[a + 1][2]);
      B(sd * (8 + bo) - 0.25, 11.5 - (k === 2 || k === 3 ? 1 : k === 1 || k === 4 ? 0.5 : 0), az + 2.5 + k * 2, 0.5, 1.5, 1, [M.TURQ, M.WHITE, M.LAPIS, M.WHITE][(k + (az >> 4)) % 4], { pose: [0, -0.5, 0, 4 + (k % 3), mk()] }); }
    LOD = 0;
    // the brick wall closing the hollow, with stepped battlements, and the gatehouse stepping up round the ring
    for (let x = -200; x < 200; x += 4) {
      if (x >= -20 && x < 20) continue;
      const oz = cr.chance(0.16) ? 0.5 : 0, hh = 9 + (cr.chance(0.12) ? 0.5 : 0);
      B(x, 0, WALL_Z + oz, 4, hh, 2, M.BRICK, SOL); LOD = 1; B(x, hh, WALL_Z + oz, 1, 1, 2, M.BRICK); B(x + 2, hh, WALL_Z + oz, 1, 1, 2, M.BRICK); LOD = 0;
      if (Math.abs(x + 2) < 74) { LOD = 1; F(boxes.length, x, 3, WALL_Z + oz - 0.5, 4, 0.5, 0.5, M.LAPIS); F(boxes.length, x, 6, WALL_Z + oz - 0.5, 4, 0.5, 0.5, M.WHITE); LOD = 0; }   // (the face rule, within 72 m of the course: a lapis band and a whitewash band a cell proud)
    }
    const RC = 11.2, RI = 8.6, RL = 7.4;
    for (let y = 0; y < 24; y++) {
      let run = null;
      const flush = () => { if (run) { B(run[0], y, WALL_Z - 0.5, run[1], 1, 3, y % 3 === 2 ? M.BRICK2 : M.BRICK, NOSH); run = null; } };
      for (let xi = -20; xi < 20; xi++) {
        const xc = xi + 0.5, r = Math.hypot(xc, y + 0.5 - RING_Y), top = 23 - Math.max(0, Math.floor((Math.abs(xc) - 9) / 2.5)) * 3;
        if (y >= top) { flush(); continue; }
        if (r < RL) { flush(); continue; }
        if (r >= RC) { if (((xi * 7 + y * 13) % 23) === 0) { flush(); B(xi, y, WALL_Z - 0.5, 1, 1, 3, y % 3 === 2 ? M.BRICK : M.BRICK2, NOSH); continue; }   // a stray brick in the other ochre
          if (run) run[1]++; else run = [xi, 1]; continue; }
        flush();
        if (r < RI) B(xi, y, WALL_Z - 1.5, 1, 1, 4, M.LAPIS, { sh: xi < 0 ? 1 : 0 });   // sun from port: the starboard half of the inner rim is in its twin
        else B(xi, y, WALL_Z - 1, 1, 1, 3, ((xi + y) & 1) ? M.TURQ : M.WHITE, NOSH);
      }
      flush();
    }
    markSolid(-20, WALL_Z - 0.5, 40, 3, 9);
    LOD = 1; for (let xi = -18; xi < 18; xi += 4) B(xi + 1, 23 - Math.max(0, Math.floor((Math.abs(xi + 1.5) - 9) / 2.5)) * 3, WALL_Z - 0.5, 1, 1, 3, M.WHITE); LOD = 0;
    await ctx.yield();

    // ninety-six date palms: two rows either side of the pool, and a row along the wall
    for (let k = 0; k < 48; k++) {
      const s = k < 24 ? 1 : -1, r = (k % 24) < 12 ? 0 : 1, i = k % 12;
      palmList.push([s * (24 + r * 7) - 0.5, 230 + i * 4.5 + r * 2, cr.int(7, 9), cr()]);
    }
    for (let k = 0; k < 48; k++) { const s = k < 24 ? 1 : -1, i = k % 24; palmList.push([half(s * (27 + i * 6.5 + cr.range(-1, 1))), 283 + (i % 2) * 2, cr.int(7, 10), cr()]); }

    // eight more stand between the pool and the ring, clear of the course by 12 m, where the last frames can see them
    // nod; their crowns throw violet bars across the paving (and so do the gatehouse's hanging cloths' poles).
    const er = vr.fork('end');
    for (let k = 0; k < 8; k++) { const sd = k < 4 ? 1 : -1, i = k % 4, px = sd * (13 + (i % 2) * 4.5) - 0.5, pz = 268.5 + i * 4.5, ph = er.int(7, 9);
      palmList.push([px, pz, ph, er(), 1]); markSolid(px, pz, 1, 1, ph + 1); }
    // two long cloths hang on the gatehouse face either side of the ring, turquoise and whitewash, flapping between two cube poses
    for (const sd of [1, -1]) for (let k = 0; k < 2; k++) {
      const bx = sd * (13 + k * 3.5) - 0.75, cm = (k + (sd > 0 ? 0 : 1)) % 2 ? M.WHITE : M.TURQ, top = 17 - k * 3, ph = er();
      B(bx - 0.25, top, WALL_Z - 1.5, 2, 0.5, 1, M.TRUNK, NOSH);
      B(bx, top - 3, WALL_Z - 1.5, 1.5, 3, 0.5, cm, { noShade: true, pose: [0, 0, -0.5, 5, ph] }); B(bx, top - 6, WALL_Z - 1.5, 1.5, 3, 0.5, cm, { noShade: true, pose: [0, 0, -0.5, 5, ph + 0.35] });
      B(bx, top - 7, WALL_Z - 1.5, 1.5, 1, 0.5, cm === M.WHITE ? M.TURQ : M.WHITE, { noShade: true, pose: [0.5, 0, -0.5, 5, ph + 0.6] });
    }

    // THE FACE RULE LEAVES ROOM (one rule, in metres of the place, for every band, opening and cloth the face rule laid): a
    // piece whose box shares any space with a box of another standing thing (each where it stands at rest: no pose is
    // followed) is not laid: a neighbour house, the steps of a stair street, a stair, a carpet rack, a palm's trunk or fronds,
    // or a piece of the rule laid before it that stands. The block it is a course of (its own house, arch or minaret, which a
    // band rings a cell proud by design) does not count; nor do the far stand-ins (LOD 2). Nothing is moved; no draw is made.
    await ctx.yield();
    { const cut = (a, b) => a[0] < b[0] + b[3] && b[0] < a[0] + a[3] && a[2] < b[2] + b[5] && b[2] < a[2] + a[5] && a[1] < b[1] + b[4] && b[1] < a[1] + a[4];
      const FR = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]], _b = [0, 0, 0, 1, 1, 1], cube = (a, x, y, z) => { _b[0] = x; _b[1] = y; _b[2] = z; return cut(a, _b); };
      const inPalm = (a) => { for (const q of palmList) { const x = Math.floor(q[0]), z = Math.floor(q[1]), y = q[5] || 0, ph = q[2];      // a palm as the part lays it: trunk and heart, six fronds of four cubes
          if (a[0] >= x + 5 || a[0] + a[3] <= x - 4 || a[2] >= z + 5 || a[2] + a[5] <= z - 4) continue;
          if (cut(a, [x, y, z, 1, ph + 1, 1])) return true;
          for (const [dx, dz] of FR) if (cube(a, x + dx, y + ph, z + dz) || cube(a, x + 2 * dx, y + ph, z + 2 * dz) || cube(a, x + 3 * dx, y + ph - 1, z + 3 * dz) || cube(a, x + 4 * dx, y + ph - 2, z + 4 * dz)) return true; }
        return false; };
      const piece = new Set(FACE.map((q) => q[0])), out = new Set(), near = new Map();                // near: the boxes that stand in each 8 m cell of the plan a piece stands in, so a piece is tried against its neighbours only
      const cells = (b, f) => { for (let i = Math.floor(b[0] / 8); i <= Math.floor((b[0] + b[3]) / 8); i++) for (let j = Math.floor(b[2] / 8); j <= Math.floor((b[2] + b[5]) / 8); j++) f(i * 4096 + j); };
      for (const [i] of FACE) cells(boxes[i], (k) => { if (!near.has(k)) near.set(k, []); });
      boxes.forEach((b, j) => { if (b[8] < 2) cells(b, (k) => { const c = near.get(k); if (c) c.push(j); }); });
      for (let q = 0; q < FACE.length; q++) { const [i, own] = FACE[q], a = boxes[i]; let hit = inPalm(a); if (q % 64 === 0) await ctx.yield();
        cells(a, (k) => { for (const j of near.get(k)) if (!hit) hit = (j < own || j > i) && !(piece.has(j) && (j > i || out.has(j))) && cut(a, boxes[j]); });
        if (hit) out.add(i); }
      let n = 0; for (let i = 0; i < boxes.length; i++) if (!out.has(i)) boxes[n++] = boxes[i]; boxes.length = n; }
    // what the pool shows back: the gatehouse face and the palms beyond its near rim (the part mirrors the eye's ray, cell by cell)
    hero.state.rf = { z: WALL_Z - 1, y: RING_Y, r0: RL, r1: RI, r2: RC, palms: palmList.filter((q) => q[1] > 236 && q[1] < 286 && Math.abs(q[0]) < 34).map((q) => [Math.floor(q[0]) + 0.5, Math.floor(q[1]) + 0.5, q[2]]) };
    // flag every box by the sun: the dune's shadow (the far window's ceiling) or a building toward the (+3,-1) sun
    const G = hero.terrain;
    const shadeAt = (x, y, z) => {
      if (G.inShadow(x, y, z)) return 1;
      for (let s = 1.5; s < 66; s += 1.5) if (solidAt(x + 0.9487 * s, z - 0.3162 * s) > y + 0.3153 * s + 0.3) return 1;
      return 0;
    };
    await ctx.yield();
    const city = style.makeCubes(boxes.length + palmList.length * 28 + 8);
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i], o = b[7];
      let sh = (o && o.noShade) ? 0 : (o && o.sh !== undefined) ? o.sh : (o && o.at) ? shadeAt(o.at[0], o.at[1], o.at[2]) : shadeAt(b[0] + b[3] / 2, b[1] + b[4] + 0.05, b[2] + b[5] / 2);
      if (o && o.vote) {                              // a house is repainted only when most of its roof is in shadow, never by one pier's bar
        let n = 0; for (const [fx, fz] of [[0.5, 0.5], [0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]) n += shadeAt(b[0] + b[3] * fx, b[1] + b[4] + 0.05, b[2] + b[5] * fz);
        sh = n >= 4 ? 1 : 0;
      }
      city.add(b[0], b[1], b[2], b[3], b[4], b[5], b[6], sh, o && o.pose ? o.pose : null, b[8]);
      if (i % 120 === 119) await ctx.yield();
    }
    await ctx.yield();
    for (const [px, pz, ph, pp, lit, py] of palmList) { const x = Math.floor(px), z = Math.floor(pz); style.addPalm(city, x, py || 0, z, ph, pp, lit ? 0 : shadeAt(x + 0.5, ph, z + 0.5), pz > 60); }
    await ctx.yield();
    city.commit(); hero.object.add(city.mesh);
    await ctx.yield();
    await G.fillBands(G.wins[2], 0, () => ctx.yield()); G.refresh();

    // ---- the cast: actors are small sets of boxes moved on the CPU by whole cubes (one shared batch, repositioned on the tick)
    const act = style.makeCubes(1500), actPos = act.mesh.geometry.getAttribute('aPos');
    let actDirty = false;
    const mkActor = (parts) => {
      const a = { i0: act.count, parts, x: 1e9, y: 0, z: 0, sh: -1 };
      for (const p of parts) act.add(0, -900, 0, p[3], p[4], p[5], p[6], 0, p[7] || null);
      return a;
    };
    const place = (a, x, y, z, sh = 0) => {
      if (a.x === x && a.y === y && a.z === z && a.sh === sh) return;
      a.x = x; a.y = y; a.z = z; a.sh = sh; actDirty = true;
      for (let k = 0; k < a.parts.length; k++) { const p = a.parts[k]; actPos.setXYZ(a.i0 + k, x + p[0], y + p[1], z + p[2]); act.setShadow(a.i0 + k, sh); }
    };
    const ar = rng.fork('cast');

    // the caravan: two strings of the herd, each beast laid in profile to the course so its legs, neck and load read.
    // (1) Eight walk the crest's starboard shoulder against the sky bands while we climb the back (the brief's string on
    // the right horn). (2) Fourteen cross the arcade ahead of us in the sun, between the first and second arch, out of
    // the cross street to starboard, then turn up the port side toward the pool; the string is parted where the yacht
    // goes through. Both walk a cube every second tick and are keyed to the journey clock.
    const LANE_Z = 162, LANE_X = 12;
    const beast = (k) => beastParts(k);
    const herd = [], ridge = [];
    // (Fix 6: the city's string walks beside us, not across the far end of the frame. Ten of the herd come round the dome's
    // drum to port and up the arcade's port side along x = LANE_X, heads to +Z, a cube a tick; we overtake them 12 m off
    // and each throws its bar.)
    // THE CROSS STRING: four of the herd stand in one file across the course between the first and the second arch, at the
    // string's own z (CROSS_Z), heads to starboard. The course parts the string: two stand each side, the inner one of each
    // side with its nearest face at the clearance from the course's line, the outer one a beast's pitch (the herd's 8.5 m)
    // beyond it. The starboard pair walks on toward the cross street; the port pair waits at its line.
    const CROSS_Z = 184, cross = [];
    for (let k = 0; k < 3; k++) { const c = { az: mkActor(beastParts(k + 4, { camel: true })), z0: 153 - 8.5 * k, d: [0, 0, 2, 6.5, 0] }; herd.push(c); dyn.push(c.d); }
    const XP = 6.5 + pushOff(0, CROSS_Z - 0.5, 6.5, CROSS_Z + 2, 7.5), XS = pushOff(-6.5, CROSS_Z - 0.5, 0, CROSS_Z + 2, 7.5);   // where the inner beast of each side stands (x = its tail end, the port face)
    [[XP + 8.5, 2, 1], [XP, 0, 1], [XS - 5, 1, 0], [XS - 5 - 8.5, 3, 0]].forEach(([x0, k, port]) => { const c = { a: mkActor(turned(beastParts(k, { camel: true, still: !!port }), '-x')), x0, port, d: [0, 0, 6.5, 1.5, 0] }; cross.push(c); dyn.push(c.d); });   // (the starboard pair's walk starts 5 m short of its line, so x0 lies 5 m beyond it: at its nearest it stands at the clearance)
    for (let k = 0; k < 8; k++) ridge.push({ a: mkActor(turned(beast(k + 1 + (k >> 1)), '-x')), x0: [29, 20.5, 8, 0, -8, -20, -28.5, -45][k] });   // (fix 7: three stand whole before us as we leap, the others clear of the frame's edges)   // (none of these carries a rider: they stand under the knife edge, close)
    const T_PASS = tOf(zToU(LANE_Z));
    updaters.push((dt, time, camera, u, tick, tJ) => {
      const walk = Math.min(26, Math.floor((tJ - T_PASS) * 6 + 1e-6) * 0.5), near = eyeW.z > 100;   // (beyond the first merge line a beast would be specks: the string is drawn once we are down in the city)
      for (const c of herd) {
        const z = Math.min(c.z0 + walk, c.z0 + 12), on = near && z >= 148, sh = G.inShadow(LANE_X + 1, 3, z + 3) ? 1 : 0;   // it comes out from behind the drum, out of the dome's shade into the sun
        place(c.az, LANE_X, on ? 0 : -900, z, sh); c.d[0] = LANE_X - 0.25; c.d[1] = z; c.d[4] = on && !sh ? 4.5 : 0;
      }
      const wx = Math.max(-5, walk);                   // the leaders wait at the corner until we are in the city
      for (const c of cross) { const x = c.port ? c.x0 : c.x0 - wx; place(c.a, x, near ? 0 : -900, CROSS_Z, shadeAt(x - 3.25, 4.6, CROSS_Z + 0.75)); c.d[0] = x - 6.5; c.d[1] = CROSS_Z; c.d[4] = near ? 4.5 : 0; }   // (a pier's bar repaints the one walking through it)
      const rw = Math.floor((tJ - 24) * 3 + 1e-6) * 0.5;
      for (const c of ridge) {
        const x = c.x0 - rw, cz = A.crestAt(x - 3, _cv).z, z = half(cz - 7), y = Math.max(hAt(x - 1, z + 0.75), hAt(x - 5.5, z + 0.75));
        place(c.a, x, tJ < 11 ? -900 : y, z, inCloud(x - 2, z) ? 1 : 0);
        c.d[0] = x - 6; c.d[1] = z; c.d[4] = tJ < 11 ? 0 : y + 2.5;
      }
    });
    for (const c of ridge) { c.d = [0, 0, 6, 1.5, 0]; dyn.push(c.d); }
    // the caravan on the road: two strings crossing the course in profile, one on the plain 10 m short of the toe and
    // one halfway up the back, each walking to port a cube every fourth tick of the journey clock and parted where we
    // go through (the leaders are across before us, the rest wait their turn). Each throws its long bar of shadow.
    const road = [];
    for (const [zs, t0, xs] of [[ROAD1, tOf(0.02), [2.5, 11.5, 20.5, -15.5, -24.5]], [ROAD2, tOf(0.16), [15, 27, -15, -34, -43]]])
      xs.forEach((x0, k) => { const c = { a: mkActor(turned(beastParts(k * 3 + (zs === ROAD2 ? 1 : 0), { camel: true }), '+x')), x0, zs, t0, d: [0, 0, 6, 1.5, 0] }; road.push(c); dyn.push(c.d); });
    updaters.push((dt, time, camera, u, tick, tJ) => {
      dynZ0 = 1e9; dynZ1 = -1e9;
      for (const c of road) {
        const x = Math.round(lineX(c.zs)) + c.x0 + Math.floor((tJ - c.t0) * 1.5 + 1e-6) * 0.5, z = c.zs, y = Math.max(hAt(x + 1, z + 0.75), hAt(x + 5.5, z + 0.75));
        place(c.a, x, y, z, inCloud(x + 3, z) ? 1 : 0); c.d[0] = x; c.d[1] = z; c.d[4] = y + 2.5;
      }
      for (const d of dyn) if (d[4] > 0) { dynZ0 = Math.min(dynZ0, d[1]); dynZ1 = Math.max(dynZ1, d[1] + d[3]); }
      dynRow.fill(0); for (const d of dyn) if (d[4] > 0) for (let j = Math.max(0, Math.floor(d[1]) - SZ0), j1 = Math.min(SL - 1, Math.floor(d[1] + d[3]) - SZ0); j <= j1; j++) dynRow[j] = 1;
      dynRowsOk = true;
    });

    // the birds: sixty roosting round the drum of the dome; they lift in a stepped spiral as the tenth course lets go
    // (Fix 7: sixteen, each a countable bird: body, head, tail and two wings of two cubes that lift in steps, 8.5 m across,
    // standing well apart on a wide stair round the dome's shoulder. Beyond the first merge line each is three 2 m blocks.)
    const mkActorL = (parts) => { const a = { i0: act.count, parts, x: 1e9, y: 0, z: 0, sh: -1 }; for (const p of parts) act.add(0, -900, 0, p[3], p[4], p[5], p[6], 0, p[7] || null, p[8] || 0); return a; };
    // (Fix 8: a loose flock, not a stair. Thirty small birds, each one body cube with two wing cubes that sit up or down (beyond the first
    // merge line one 2 m block), roost scattered on the bare cap and, as the courses below let go, go up to their own places in the air:
    // a patch laid out from where the eye stands at the slip foot (u 0.52), a third of the frame wide and tall, rising from the cap up
    // and to starboard, no two birds within a bird's width of each other in that view, a third of them before the turquoise cap and the
    // shaded flank. Twelve more leave the dome's far shoulder earlier and string out one behind the other over the street to wheel round the arcade.)
    const birds = [], DC = A.dome.center, DT = A.dome.top, E52 = path.pointAt(0.52).clone(), fb = vr.fork('flock');
    const ibis = cast.bird === 'ibis';
    const birdParts = (ph) => { const fl = [0, 1, 0, 2, ph]; return [[-0.5, 0, -0.5, 1, 1, 1, M.BIRD, null, 1], [-1.5, 0, -0.5, 1, 0.5, 1, M.BIRD, fl, 1], [0.5, 0, -0.5, 1, 0.5, 1, M.BIRD, fl, 1],
      ...(ibis ? [[-0.25, 0, 0.5, 0.5, 0.5, 1, M.TRUNK, null, 1]] : []), [-1, 0, -1, 2, 2, 2, M.BIRD, null, 2]]; };
    const inDome = (x, y, z) => { const r2 = ((x - DC.x) * (x - DC.x) + (z - DC.z) * (z - DC.z)) / 225; return r2 < 1.25 && y < 13.5 + 17 * Math.pow(Math.max(0, 1.25 - r2) / 1.25, 0.4); };
    const wheelers = [];
    for (let j = 0; j < 12; j++) wheelers.push({ a: mkActorL(birdParts(ar())), s: [half(DC.x + 5 * Math.cos(j * 1.7)), DT.y - 4 + (j % 3), half(DC.z + 13.5 + (j % 3) * 2)], lift: 28.4 + j * 0.12, ph: j / 12 * Math.PI * 2, hy: 20 + (j % 4) * 2.5 });
    for (let k = 0; k < 4; k++) ar();                  // (the cast's draws are as many as they were, so the clouds stand where they stood)
    updaters.push((dt, time, camera, u, tick, tJ) => {
      for (const b of birds) {
        const n = Math.floor((tJ - 26.2 - b.d) * 6), k = Math.min(1, Math.max(0, n / 15)), kk = k * k * (3 - 2 * k), up = Math.max(0, Math.floor((tJ - 30.6) * 3)) * 0.5;
        const bob = kk >= 1 ? ((Math.floor(tick / 3) + b.i) & 1) * 0.5 : 0;         // in its place it hangs, rising and sinking half a cube
        place(b.a, half(b.r[0] + (b.f[0] - b.r[0]) * kk), half(b.r[1] + (b.f[1] - b.r[1]) * kk) + bob + up, half(b.r[2] + (b.f[2] - b.r[2]) * kk), 0);
      }
      for (const b of wheelers) {
        const n = (tJ - b.lift) * 6, k2 = Math.min(1, Math.max(0, Math.floor(n) / 30)), kk = k2 * k2 * (3 - 2 * k2), a2 = b.ph + tick * 0.012, sa = Math.sin(a2);
        place(b.a, half(b.s[0] + (Math.cos(a2) * 14 - b.s[0]) * kk), half(b.s[1] + (b.hy + 3 * sa * sa - b.s[1]) * kk + Math.sin(k2 * Math.PI) * 8), half(b.s[2] + (184 + sa * 26 - b.s[2]) * kk), 0);   // (the loop is over the head of the arcade, near enough that each is a bird and not a block)
      }
    });

    const gate = [];
    for (let i = 0; i < 14; i++) {
      const ph = ar(), ibis = cast.bird === 'ibis', bl = ibis ? 1.5 : 1, wing = (dx) => [dx, 0, 0, 1.5, 0.5, 1, M.BIRD, [0, 1, 0, 2, ph]];
      gate.push({ a: mkActor([[0, 0, -1, 1, 1, bl + 1.5, M.BIRD], wing(-1.5), wing(1), ibis ? [0, 0, bl + 0.5, 1, 0.5, 1, M.TRUNK] : [0, 0.5, -1.5, 1, 0.5, 0.5, M.BIRD]]), ph: i / 14 * Math.PI * 2 + ar.range(-0.1, 0.1), y: 12.5 + (i % 5) * 1.5 });
    }
    updaters.push((dt, time, camera, u, tick) => {       // one long loop: across the gatehouse face above the ring, out over the palms, back along the pool's far rim
      for (const b of gate) { const a = b.ph + tick * 0.016, sa = Math.sin(a); place(b.a, half(Math.cos(a) * 19), half(b.y + 2.5 * sa), half(279 - sa * 9.5), 0); }
    });

    // the pacer: a fox (or a hare) trots ahead of us up the back, 9.5 m to port, then sits in profile and we come up past it
    // (Fix 7: redrawn as an animal seen from the side: four legs, a long body, a head with a snout carried forward, two
    // ears, a tail; the sand's own shade ochre with whitewash chest, socks and tail tip and deep-violet ears and nose.)
    const hare = cast.pacer === 'hare', fm = M.TRUNK, DK = M.RDEEP;
    const fleg = (dz, p) => [0, 0, dz, 1, 0.5, 0.5, M.WHITE, [0, 0.5, 0, 2, p]];
    const ears = (y, z) => hare ? [0, y, z, 1, 1.5, 0.5, DK] : [0, y, z, 1, 0.5, 0.5, DK];
    const trot = mkActor([fleg(0, 0), fleg(2, 0.5), [0, 0.5, 0, 1, 1, 2.5, fm], [0, 1.5, 2, 1, 1, 1, fm], ears(2.5, 2), [0.5, 2.5, 2, 0.5, hare ? 0 : 0.5, 0.5, fm],
      [0, 1.5, 3, 1, 0.5, 0.5, DK], hare ? [0, 1, -0.5, 1, 0.5, 0.5, M.WHITE] : [0, 1, -1.5, 1, 0.5, 1.5, fm], hare ? [0, 0.5, 0, 0, 0, 0, fm] : [0, 1, -2, 1, 0.5, 0.5, M.WHITE]]);
    // Standing, it is laid out as the course sees it: in profile, nose toward the course (-X, screen right), 7 m from nose to tail.
    // (Fix 8: drawn again, as a fox is known at a glance: two pricked ears a cube wide and two tall with sky or sand between them, a long
    // white snout with a dark nose, a dark eye set flush in the head, dark stockings on the near legs, a white bib, and a brush as long
    // as the body, thick in the middle and white at the tip, lifting a cube. No two boxes share a face plane. The hare keeps the build
    // with ears three cubes tall and a white scut.)
    const sit = mkActor([[0, 0, 0, 0.5, 1, 0.5, DK], [0.5, 0, 0.5, 0.5, 1, 0.5, fm], [2, 0, 0, 0.5, 1, 0.5, DK], [1.5, 0, 0.5, 0.5, 1, 0.5, fm],   // four legs: the near pair in dark stockings
      [0, 1, 0, 2.5, 1, 1, fm], [-0.5, 1, 0, 0.5, 0.5, 1, M.WHITE], [-0.5, 1.5, 0, 0.5, 0.5, 1, fm],                                           // body, bib, neck
      [-1, 2, 0, 1.5, 0.5, 1, fm], [-1, 2.5, 0, 0.5, 0.5, 1, fm], [-0.5, 2.5, 0, 0.5, 0.5, 0.5, DK], [-0.5, 2.5, 0.5, 0.5, 0.5, 0.5, fm], [0, 2.5, 0, 0.5, 0.5, 1, fm],   // the head, with its eye
      [-2, 2, 0, 1, 0.5, 1, M.WHITE], [-2.5, 2, 0, 0.5, 0.5, 1, DK],                                                                         // snout and nose
      [-1, 3, 0, 0.5, hare ? 1.5 : 1, 1, fm], [0, 3, 0, 0.5, hare ? 1.5 : 1, 1, fm],                                                         // two ears
      ...(hare ? [[2.5, 1.5, 0, 0.5, 0.5, 1, M.WHITE, [0, 0.5, 0, 6, 0]]]
        : [[2.5, 1.5, 0, 0.5, 0.5, 1, fm], [3, 1, 0, 1.5, 1, 1, fm, [0, 0.5, 0, 6, 0]], [4.5, 1, 0, 1, 1, 1, M.WHITE, [0, 0.5, 0, 6, 0]]])]);   // the brush
    const T_SIT = tOf(0.16) - 0.8, _fp = new THREE.Vector3(), _ft = path.tangentAt(0.16), _fl = Math.max(Math.hypot(_ft.x, _ft.z), 1e-4), _fe = path.pointAt(0.16);
    const foxSitZ = half(_fe.z + (_ft.z * 14.5 - _ft.x * 4) / _fl), foxSitX = half(_fe.x + (_ft.x * 14.5 + _ft.z * 4) / _fl);
    hero.state.clear = [foxSitX - 4.5, foxSitZ - 1.5, foxSitX + 7.5, foxSitZ + 7]; style.uniforms.uClear.value.set(foxSitX - 4.5, foxSitZ - 1.5, foxSitX + 7.5, foxSitZ + 7);   // (fix 8) the ranks part round where the pacer stands: clear stairs behind its head
    updaters.push((dt, time, camera, u, tick, tJ) => {
      const lead = 19 + Math.max(0, T_SIT - tJ) * 3 + Math.max(0, 9.4 - tJ) * 6;      // we close on it, then pace it, then it sits
      const z = tJ < T_SIT ? half(path.pointAt(u, _fp).z + lead + 2) : foxSitZ, x = tJ < T_SIT ? half(lineX(z) + 5) : foxSitX, y = Math.max(hAt(x + 0.25, z + 0.5), hAt(x + 2.25, z + 0.5));
      const moving = tJ < T_SIT, here = z > CAMP_Z + 22;   // (it comes out from behind the camp's last palm)
      const fsh = inCloud(x + 1, z + 1) ? 1 : 0;       // the cloud's shadow repaints it
      place(trot, x, moving && here ? y : -900, z, fsh); place(sit, x, moving || !here ? -900 : y, z, fsh);
    });
    await ctx.yield();

    // nine clouds: square-stepped slabs on a 16 m grid, stepping downwind one cell every two seconds
    const clouds = [];
    for (let i = 0; i < 9; i++) {
      const w = ar.int(3, 7) * 16, d = ar.int(2, 4) * 16, w2 = Math.max(32, w - ar.int(1, 2) * 32), sx = ar.int(0, 1) * 16;
      const parts = [[0, 0, 0, w, 16, d, M.WHITE], [sx, 16, 16, w2, 16, Math.max(16, d - 32), M.WHITE], [w - 16, -16, 0, 32, 16, 32, M.WHITE]];
      clouds.push({ a: mkActor(parts), x: Math.round(((i % 3) - 1) * 420 / 16 + ar.int(-8, 8)) * 16, y: 144 + ar.int(0, 5) * 16, z0: (i * 176 + ar.int(0, 6) * 16) });
    }
    // and twelve more at other depths: broad stepped banks of 32 m blocks far out and low, so the sky's pale steps are
    // crossed by whole clouds at every height (whitewash above, pale violet beneath), all stepping downwind together
    const far = [], sk = vr.fork('sky2');
    for (let i = 0; i < 12; i++) {
      const w = sk.int(4, 8) * 32, d = sk.int(2, 4) * 32, w2 = Math.max(64, w - sk.int(1, 2) * 64), sx = sk.int(0, 1) * 32;
      const parts = [[0, 0, 0, w, 32, d, M.CLOUD], [sx, 32, 0, w2, 32, Math.max(32, d - 32), M.CLOUD], [w - 32, -32, 0, 64, 32, 32, M.CLOUD]];
      far.push({ a: mkActor(parts), x: Math.round(((i % 4) - 1.5) * 520 / 32 + sk.int(-4, 4)) * 32, y: 160 + sk.int(0, 5) * 32 + (i % 3) * 32, z0: i * 208 + sk.int(0, 4) * 32 });
    }
    const high = [];
    for (let i = 0; i < 24; i++) {                        // and twenty-four small ones high over the dune's back, a flock that keeps to the climb's sky, so the blue above the stairs is never bare
      const w = sk.int(3, 5) * 16, d = sk.int(2, 3) * 16, parts = [[0, 0, 0, w, 16, d, M.CLOUD], [16, 16, 0, w - 32, 16, d - 16, M.CLOUD], [-16, -16, 16, 32, 16, 16, M.CLOUD]];
      high.push({ a: mkActor(parts), x: Math.round(((i % 8) - 3.5) * 88 / 16 + sk.int(-2, 2)) * 16 - 32, y: 256 + sk.int(0, 5) * 16, z0: i * 33 + sk.int(0, 2) * 16 });
    }
    updaters.push((dt, time) => {
      const stepZ = Math.floor(time / 2) * 16;
      for (const c of clouds) place(c.a, c.x, c.y, -360 + ((c.z0 + stepZ) % 1600), 0);
      for (const c of far) place(c.a, c.x, c.y, 500 + ((c.z0 + stepZ) % 2496), 0);
      for (const c of high) place(c.a, c.x, c.y, Math.round(TOE_Z / 16) * 16 - 64 + ((c.z0 + stepZ) % 800), 0);
    });
    hero.object.add(act.mesh);

    // ---- the sand yacht: the one object off the grid (it must move smoothly); still whole cubes, still the tone table.
    // It is a thing in the scene, never under the lens: a whole yacht (whitewash hull with a lapis strake and turquoise
    // stem, an outrigger skid, a mast, a square whitewash sail carrying one turquoise square, its belly filling by a
    // layer of cubes) that sails ahead of us to starboard across the plain and up the back, leaps the knife edge before
    // we do, runs down the starboard flank of the slip face, abreast of the point of the avalanche it sets off, and is
    // left standing among the dug-out palms at the slip foot. Built in its own frame (+Z ahead, origin on the sand under the mast), placed every frame
    // from the journey clock; its faces are chosen from the eye brought into that frame.
    // (round great sail) THE GREAT SAIL: the rig is the opening's one landmark. A sail nine metres wide (the same sail in kind: whitewash, one turquoise
    // square, now between a turquoise foot band and head band) on a mast a metre thick with a turquoise banner at its head, so that from the plain and all the way up the back one
    // white sail stands against the sky ahead of us. ITS COURSE DOWN THE LEE: about the knife edge it bears away to starboard and comes down
    // the flank in three eased steps to where it parks (YX; the hull keeps the route's heading and is carried sideways), so the dome is never behind the sail: it was dead ahead of us all the way down, between the lens and the town.
    // Hull, skids, fans of sand and lead are as they were.
    const yEye = { value: new THREE.Vector3(0, 50, -50) };
    const yacht = new THREE.Group(); yacht.matrixAutoUpdate = false; hero.object.add(yacht);
    const hull = style.makeCubes(40, { eye: yEye }), rig = style.makeCubes(12, { eye: yEye });   // rig: yard, outrigger beams and skids: drawn only within 46 m (from the crest they were hairlines); the mast and the pennant are of the hull's batch
    {
      let H = (x, y, z, sx, sy, sz, m, pose) => hull.add(x, y, z, sx, sy, sz, m, 0, pose || null); const H0 = H, HR = (x, y, z, sx, sy, sz, m, pose) => rig.add(x, y, z, sx, sy, sz, m, 0, pose || null);
      H(-1.25, 0, -3, 2.5, 0.5, 5, M.LAPIS); H(-0.75, 0, 2, 1.5, 0.5, 1.5, M.LAPIS); H(-0.5, 0, 3.5, 1, 0.5, 1, M.LAPIS);        // the strake
      H(-1, 0.5, -3, 2, 0.5, 5, M.WHITE); H(-0.5, 0.5, 2, 1, 0.5, 1.5, M.WHITE); H(-0.25, 0.5, 3.5, 0.5, 0.5, 1, M.WHITE);       // the deck, narrowing to the stem
      H(-0.25, 1, 4, 0.5, 1, 0.5, M.TURQ);                                                                                       // the stem cube
      H(-1, 1, -3, 2, 0.5, 0.5, M.LAPIS); H(-0.5, 1, -2, 1, 1, 1, M.TRUNK); H(-0.5, 2, -2, 1, 0.5, 1, M.TURQ);                   // the stern board, a bale with its cloth
      H = HR; H(-4, 0.5, -0.5, 3, 0.5, 0.5, M.TRUNK); H(-4.5, 0, -2, 0.5, 0.5, 3.5, M.LAPIS); H(1, 0.5, -0.5, 2, 0.5, 0.5, M.TRUNK); H(3, 0, -1.5, 0.5, 0.5, 2.5, M.LAPIS);   // outrigger beams and skids
      H(-4.5, 11, 0.5, 9, 0.5, 0.5, M.TRUNK);                                                                                    // the yard
      H = H0; H(-0.5, 1, -0.5, 1, 11, 1, M.TRUNK);                                                                               // the mast: a metre thick, so it is drawn at every distance with the sail it carries
      // THE GREAT SAIL: nine metres wide and seven high, its foot four metres over the sand: whitewash between a turquoise foot band and a turquoise head band
      H(-4.5, 4.5, 0.5, 9, 1.5, 0.5, M.WHITE); H(-4.5, 6, 0.5, 3, 3, 0.5, M.WHITE); H(1.5, 6, 0.5, 3, 3, 0.5, M.WHITE); H(-4.5, 9, 0.5, 9, 1.5, 0.5, M.WHITE);
      H(-4.5, 4, 0.5, 9, 0.5, 0.5, M.TURQ); H(-4.5, 10.5, 0.5, 9, 0.5, 0.5, M.TURQ);                                               // the two bands: at night the mast is lost on the sky and they are what says cloth
      H(-1.5, 6, 0.5, 3, 3, 0.5, M.TURQ);                                                                                        // the sail's one turquoise square
      H(-4, 5, 1, 2.5, 5, 0.5, M.WHITE, [0, 0, -0.5, 9, 0]); H(1.5, 5, 1, 2.5, 5, 0.5, M.WHITE, [0, 0, -0.5, 9, 0.12]);      // the belly, filling and emptying by one layer
      H(-0.25, 11, -1.5, 0.5, 1, 1, M.TURQ, [0, -0.5, 0, 4, 0.2]); H(-0.25, 11, -2.5, 0.5, 1, 1, M.TURQ, [0, 0.5, 0, 4, 0.55]);   // the pennant: a turquoise banner a metre deep at the head of the mast, reaching no further aft than it did
    }
    hull.commit(); rig.commit(); yacht.add(hull.mesh, rig.mesh);
    const plume = style.makeThrown(Math.round(44 * detail) + 8, { eye: yEye, faces: 4 }), pr = rng.fork('plume');
    for (let i = 0, n = Math.round(44 * detail); i < n; i++) {    // the skids' fans of sand
      const life = pr.int(7, 12), sd = i % 2 ? 1 : -1, lane = pr.int(0, 1), dz0 = pr.int(0, 4) * 0.5;
      plume.add(sd < 0 ? -4.5 - lane * 0.5 : 3 + lane * 0.5, 0, -2.5 + dz0, 0.5, i % 4 ? M.DUST : M.SAND, sd * pr.range(0.3, 1.0), pr.range(0.5, 1.1), -pr.range(0.6, 1.8), pr() * life, life, 3, 0.3);
    }
    const spray = style.makeThrown(8, { eye: yEye });               // (kept as one more low fan behind the stern)
    for (let i = 0; i < 8; i++) spray.add(-1 + (i % 2) * 1.5, 0, -3.5 - (i >> 1) * 0.5, 0.5, M.DUST, (i % 2 ? 1 : -1) * pr.range(0.3, 0.8), pr.range(0.5, 1), -pr.range(0.8, 1.6), pr() * 8, 8, 3, 0.3);
    plume.commit(); spray.commit(); yacht.add(plume.mesh, spray.mesh);
    const plumeMat = plume.mesh.geometry.getAttribute('aMat'), sprayMat = spray.mesh.geometry.getAttribute('aMat');
    const _yx = new THREE.Vector3(), _yy = new THREE.Vector3(), _yp = new THREE.Vector3(), _yt = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    const footZ0 = A.slipFoot.z, PARK = [-32.5, footZ0 + 6], S_PARK = sOfZ(PARK[1]), U_PARK = zToU(PARK[1] - 6), T_PARK = tOf(U_PARK);
    const YL = [[0, 38], [6, 44], [8.6, 56], [10.4, 40], [12.2, 34], [14.5, 40], [16.9, 72], [19, 58], [21, 50], [24.5, 64], [27, 58], [28.8, 36], [31, 20]];        // metres it leads us by, at journey seconds
    const YX = [[0, -15], [6, -14], [8.6, -6.5], [10.4, -9], [12.2, -3.5], [15.8, -3.5], [17.2, -15], [19.5, -12], [22, -22], [24.5, -30], [26, -32.5], [29, -32.5]];   // (fix 6: from the first strata it sails dead ahead, a little to starboard, clear of the kneeling camel and the cairns)   // (round great sail: from about the knife edge it bears away to the starboard flank and keeps it down to its park, which stands 32.5 m to starboard)             // metres off the course (starboard is -X)
    const knot = (K, t) => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t < K[i][0]) return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * sm(K[i - 1][0], K[i][0], t); return K[K.length - 1][1]; };
    const avgH = (x, z, tx, tz) => { let h = 0; for (let k = -3; k <= 3; k++) h += hAt(x + tx * k, z + tz * k); return h / 7; };
    let yachtSh = -1;
    updaters.push((dt, time, camera, u, tick, tJ) => {
      const sY = Math.min(toReal(u * FL) + knot(YL, tJ), S_PARK), pk = sm(S_PARK - 46, S_PARK - 4, sY);
      rp.posAtDist(sY, _yp); rp.tangentAtDist(sY, _yt);
      const hl = Math.max(Math.hypot(_yt.x, _yt.z), 1e-4), tx = _yt.x / hl, tz = _yt.z / hl;
      const x = _yp.x + knot(YX, tJ) * (1 - pk) + (PARK[0] - _yp.x) * pk, z = _yp.z;
      const hC = Math.max(hAt(_yp.x, z), hAt(_yp.x, z + 4), hAt(_yp.x, z - 4)), fly = Math.max(0, _yp.y - 2.9 - hC - 0.75);
      const y = avgH(x, z, tx, tz) + fly * 0.6;
      const pit = Math.max(-0.7, Math.min(0.5, Math.asin(Math.max(-1, Math.min(1, _yt.y))))) * (1 - pk), yaw = -0.5 * pk;   // it rounds up to starboard as it stops
      const cy = Math.cos(yaw), sy = Math.sin(yaw), fx = tx * cy + tz * sy, fz = tz * cy - tx * sy;
      _yt.set(fx * Math.cos(pit), Math.sin(pit), fz * Math.cos(pit));
      _yx.crossVectors(_up, _yt).normalize(); _yy.crossVectors(_yt, _yx);
      yacht.matrix.makeBasis(_yx, _yy, _yt).setPosition(x, y, z); yacht.matrixWorldNeedsUpdate = true;
      _yp.set(eyeW.x - x, eyeW.y - y, eyeW.z - z); yEye.value.set(_yp.dot(_yx), _yp.dot(_yy), _yp.dot(_yt));
      rig.mesh.visible = Math.hypot(eyeW.x - x, eyeW.z - z) < 46;     // (a half-metre yard or beam is six pixels to about 46 m)
      const still = u > U_PARK, tk = style.uniforms.uTick.value;
      plume.stop.value = spray.stop.value = still ? tk - (tJ - T_PARK) * 6 : 1e9;      // no fan once it stands (reckoned from u)
      plume.mesh.visible = spray.mesh.visible = fly < 0.5;                               // and in the air nothing is thrown
      const sh = (z < footZ0 + 2 && (G.inShadow(x, y + 3, z) || inCloud(x, z))) ? 1 : 0; // the dune's or the cloud's shadow repaints it
      if (sh !== yachtSh) {
        yachtSh = sh; for (let i = 0; i < hull.count; i++) hull.setShadow(i, sh); hull.commit(); for (let i = 0; i < rig.count; i++) rig.setShadow(i, sh); rig.commit();
        for (let i = 0; i < plume.count; i++) plumeMat.setY(i, sh); plumeMat.needsUpdate = true;
        for (let i = 0; i < spray.count; i++) sprayMat.setY(i, sh); sprayMat.needsUpdate = true;
      }
    });

    await ctx.yield();

    // ---- THE FAR CARAVAN: the design's 'caravan of fourteen camels on the right horn's ridge', walking toward the city
    // one cube every second tick of the sand (the world's own clock, no key). The file is laid along the knife edge of the
    // starboard horn from FAR_X outward, 10 m apart by the ridge's own length, each standing
    // on the windward tread under the edge, head toward the city; one that reaches the horn's tip has left. Each beast is
    // laid in 2 m blocks: two legs that step, a body, a lapis or a whitewash load, a neck and head.
    // FAR_X is where the starboard horn leaves the crown by the dune's own shape: going out from the crown along the knife
    // edge in the file's own 2 m columns, the first place where the windward side under the edge is laid in the horn's level
    // treads (the part's heightAt: 48 m out), which is the first place a beast of the file has a tread to stand on.
    const farCar = [], RIDGE = [];                     // RIDGE: the horn's ridge every half metre of x, with its length from FAR_X
    let FAR_X = 0; { const tread = (x) => { const z = Math.floor((A.crestAt(x + 1, _cv).z - 8) / 2) * 2; return [0, -2, -4, -6].some((o) => hAt(x + 1, z + o + 0.5) === hAt(x + 1, z + o + 5.5)); };
      while (FAR_X > -126 && !tread(FAR_X - 2)) FAR_X -= 2; }
    { let sl = 0, pz = A.crestAt(FAR_X, _cv).z; for (let x = FAR_X; x >= -127; x -= 0.5) { const z = A.crestAt(x, _cv).z; sl += Math.hypot(0.5, z - pz); pz = z; RIDGE.push(sl); }
      for (let k = 0; k < 14; k++) { const ph = (k * 0.37) % 1;
        farCar.push({ a: mkActor([[0, 0, 0, 2, 2, 2, M.TRUNK, [0, 0, 2, 8, ph]], [0, 0, 4, 2, 2, 2, M.TRUNK, [0, 0, -2, 8, ph]], [0, 2, 0, 2, 2, 6, M.TRUNK], [0, 4, 2, 2, 2, 2, k % 2 ? M.LAPIS : M.WHITE], [0, 4, 4, 2, 4, 2, M.TRUNK]]), s0: k * 10 }); } }
    let farTick = -1;
    updaters.push((dt, time, camera, u, tick) => {
      const t2 = Math.floor(tick / 2); if (t2 === farTick) return; farTick = t2;
      for (const c of farCar) {
        const sk = c.s0 + t2 * 0.5; let i = 0; while (i < RIDGE.length && RIDGE[i] < sk) i++;
        if (i >= RIDGE.length) { place(c.a, 0, -900, 0, 0); continue; }
        const x = Math.floor((FAR_X - i * 0.5) / 2) * 2 - 2, zc = A.crestAt(x + 1, _cv).z; let z = Math.floor((zc - 8) / 2) * 2, ok = false;
        for (const o of [0, -2, -4, -6]) { const zz = z + o; if (hAt(x + 1, zz + 0.5) === hAt(x + 1, zz + 5.5)) { z = zz; ok = true; break; } }
        place(c.a, x, Math.floor((ok ? hAt(x + 1, z + 0.5) : Math.min(hAt(x + 1, z + 0.5), hAt(x + 1, z + 5.5))) / 2) * 2, z, 0);
      }
    });

    // ---- the avalanche: our skids set the slip face off. It is the part's `slide` batch: whole cubes standing on the
    // near window's steps, tumbling a cell per tick, shown only in two wings either side of the eye's line whose front
    // runs ahead of the prow (a V of still sand; since round great sail the yacht runs outside it, to starboard). The wings open as the eye comes over the knife edge.
    const footZ = A.slipFoot.z, vr2 = rng.fork('slide');
    const startTick = (zCam) => tOf(zToU(zCam)) * 6;
    // (fix 8) The V was the yacht's wake and keeps to the course: its point is abreast of the yacht on the face (yachtZ, from the journey clock), the yacht itself out on the starboard flank, outside the V; its arms open up the
    // slope behind it a metre and a half of half-width for every metre (AV_SPREAD), and a lane 2.5 m either side of the course stays still.
    const AV_SPREAD = 1.5, yachtZat = (tJ) => { const sY = Math.min(toReal(uOf(tJ) * FL) + knot(YL, tJ), S_PARK); return rp.posAtDist(sY, _cv).z; };
    const YZT = []; for (let k = 0; k <= 180; k++) YZT.push(yachtZat(23 + k * 0.05));
    const tOfYachtZ = (z) => { for (let k = 1; k <= 180; k++) if (YZT[k] >= z) return 23 + (k - 1 + (z - YZT[k - 1]) / Math.max(YZT[k] - YZT[k - 1], 1e-4)) * 0.05; return 1e6; };
    updaters.push((dt, time, camera, u, tick, tJ) => { style.uniforms.uAvW.value.set(1, AV_SPREAD); style.uniforms.uAvP.value.set(0, yachtZat(tJ), 2.5, 0); });
    // Dust goes up where the avalanche's front arrives: at each of some seventy places on the terraces either side of the
    // course two small blocks of crest dust lift one after the other, a cell per tick, square to the grid, and are gone.
    // Keyed to the journey clock (the front runs ahead of the prow by more the further out it is), so a still shows what
    // the flight shows. They are few and small: the avalanche itself is the dark blocks and their violet bars.
    // (fix 8: the dust marks the V's two edges: each block lifts where and when the edge arrives (the yacht is then at zy, the block
    // dz metres up the slope from it and as far out), a cell per tick for under a second, so at any moment a row of them stands along each arm.)
    const avClock = { value: 0 }, nPuff = Math.round(520 * detail), puff = style.makeThrown(nPuff + 1, { clock: avClock, faces: 4 }), pf = vr.fork('puff');
    for (let i = 0; i < nPuff; i++) {
      const side = i % 2 ? 1 : -1, zy = pf.range(CREST_Z + 10, footZ + 6), dz = pf.range(3, Math.min(zy - CREST_Z - 2, 56)), sz = 2;
      const z = Math.floor((zy - dz) / sz) * sz, x = Math.floor(side * (2.5 + AV_SPREAD * dz) / sz) * sz;
      const y = Math.floor(hAt(x + sz / 2, z + sz / 2) / sz) * sz, t0 = tOfYachtZ(zy) * 6, sh = G.inShadow(x, y + 2, z) ? 1 : 0;
      puff.add(x, y + sz, z, sz, M.DUST, side * pf.range(0, 0.1), pf.range(0.45, 0.7), pf.range(0.1, 0.3), t0 + pf() * 0.5, pf.range(3, 4.5), 2, 0.02, sh);
    }
    puff.commit(); hero.object.add(puff.mesh);
    updaters.push((dt, time, camera, u, tick, tJ) => { avClock.value = tJ * 6; });
    // blocks of crest dust torn off the upper back: they climb and cross the sky above the eye, square to the grid;
    // none is launched once the eye is within 45 m of the crest, so the reveal is clear.
    const nKite = 0, kite = style.makeThrown(nKite + 17), kr = rng.fork('kite');
    // (fix 8: none is torn off the upper back any more: from the middle of the climb they stood as a heap of pale blocks before the knife edge)
    for (let i = 0, kl = vr.fork('kite0'); i < 16; i++) {   // and sixteen off the first strata, standing over the steps from the first frame
      const z = Math.floor((TOE_Z + kl.range(60, 140) * 0.75) / 2) * 2, x = Math.floor((lineX(z) + (i % 2 ? kl.range(12, 22) : -kl.range(10, 20)) * 1.6) / 2) * 2, life = kl.range(14, 22);
      kite.add(x, Math.floor(hAt(x + 1, z + 1) / 2) * 2, z, 2, M.DUST, -kl.range(0.05, 0.2), kl.range(0.3, 0.45), kl.range(0.3, 0.5), kl() * life, life, 3, 0.008);
    }
    kite.commit(); hero.object.add(kite.mesh);
    // one square cloud's shadow on the back: 64 by 32 m, stepping downwind in 16 m cells ahead of the prow (see clStep). (Its cloud stands 160 m up, toward the sun.)
    const CL_Z0 = Z16 + 24 - 48,   // (fix 7: placed by the still at u 0.16: from the first strata it steps up the back and waits 23 to 55 m ahead of that eye)
       clRect = [-104, 120, 0, 0], inCloud = (x, z) => x >= clRect[0] && x < clRect[1] && z >= clRect[2] && z < clRect[3] && z < A.crestAt(x, _cv).z;
    const clCloud = mkActor([[-80, 0, 0, 224, 16, 16, M.WHITE], [-32, 16, 0, 128, 16, 16, M.WHITE]]); actDirty = true;
    hero.state.cl = clRect;
    const clStep = (tJ) => {                              // before the ground is refilled, so the cells and the shadow agree
      // It lies across the first strata from the first frame (64 by 32 m: the mountain's one violet from the plain), then
      // runs up the back ahead of us and over the knife edge, so the last of the climb and the crest stand in full sun.
      const n = Math.min(16, Math.max(0, tJ < 14 ? Math.floor((tJ - 8) / 2) : tJ < 17.6 ? 3 : 4 + Math.floor((tJ - 17.6) / 0.4)));   // (fix 7: a cell every 2 s up to the middle of the back, where it waits for us, where it lies right across the stairs 20 to 50 m ahead of us, a fifth of the frame deep, the pacer in the sun before it and the yacht in the sun beyond it; then it runs over the knife edge)   // (a 16 m cell every 1.2 s of the journey: it runs up the back some 45 m ahead of the prow, a band of two violets right across the stairs, and goes over the knife edge before we do: it is never under the yacht)
      clRect[0] = -104; clRect[1] = 120; clRect[2] = CL_Z0 + 16 * n; clRect[3] = clRect[2] + 16;   // (fix 8: one 16 m cell deep and right across the back: a fifth of the frame from the middle of the climb, with sunlit stairs below it and the sunlit crown above)
      place(clCloud, 8 - 32 + 456, 160, clRect[2] - 152, 0);
    };
    const U_KITE = zToU(CREST_Z - 45), T_KITE = tOf(U_KITE);
    updaters.push((dt, time, camera, u) => { kite.stop.value = u < U_KITE ? 1e9 : style.uniforms.uTick.value - (tOf(u) - T_KITE) * 6; });
    const U_BIG = zToU(CREST_Z - 72), T_BIG = tOf(U_BIG);
    updaters.push((dt, time, camera, u) => {
      // none launched after the eye passed U_BIG (reckoned from u, so a still frame shows what the flight shows)
      hero.bannerBig.stop.value = u < U_BIG ? 1e9 : style.uniforms.uTick.value - (tOf(u) - T_BIG) * 6;
    });
    const _poi = new THREE.Vector3(), stairPoi = (time, u) => { path.pointAt(Math.min(1, u + 0.045), _poi); _poi.y -= 14; return _poi; };   // (the gaze is carried up the stairs to the caravan and the crest, not down onto bare treads)
    // (Fix 7: from the dome's side the gaze turns to the sunlit colonnade and stays on it: the arches receding with the
    // channel beside them, then the first arch whole, its span over the caravan crossing and the gate. Inside the arcade
    // it leans a little to port, so one pier stands whole at the left and none is cut at the right.)
    // (fix 8) the last of the climb looks at the mountain: from the middle of the back the gaze is held level enough that the stairs,
    // the cloud's band, the sunlit crown and the knife edge stand one above the other (the edge a quarter of the way down); nearer the edge it lifts to the herd
    const _kp = new THREE.Vector3(), Z205 = zU(0.205), crestPoi = (time, u) => { path.pointAt(u, _kp); const k = sm(Z16 + 6, Z205, _kp.z); return _kp.set(5, A.crestHeight - 32 + 18 * k, CREST_Z - 6); };
    const _cp = new THREE.Vector3(), cityPoi = (time, u) => {
      path.pointAt(u, _cp); const z = _cp.z, k = sm(148, 163, z), g = sm(162, 171, z), h = 1 - sm(206, 220, z);
      const ax = 5 - 3.5 * k, ay = 8.5 + 2.2 * k, az = 197 - 7 * k;     // the colonnade from the dome's side, then the first arch whole
      return _cp.set(ax + ((30 + 8 * sm(172, 195, z)) * h - ax) * g, ay + (RING_Y - ay) * g, az + (WALL_Z - az) * g);   // through the arcade: the gate, leaning to port
    };
    await ctx.yield();

    // ---- the back's leaping ranks: every 6 m up the stairs a line of half-metre cubes lets go together and flies a long
    // low arc downwind, a cell per tick, landing on the steps above. Square to the grid all the way; dealt 3.5 m and more off the
    // course where it lets go (set on the half-metre grid after that, so its face may stand 3 m off), and none within 2.5 m of the
    // course anywhere on its arc (to a millimetre or two: the arc is laid by tenths of a tick against points 0.2 m apart).
    // (A cube was kept off the course at its home row only. It then flies straight downwind for up to 34 m while the course bends
    // across the stairs, so on some seeds one flew up the course's own line and past the lens at arm's length. Now its whole arc is
    // laid against the line as flown, LNE: the box of the cube at every tenth of a tick of its life, the ticks it flies on after
    // landing too (on lives of twenty ticks and more the sum of tenths stops one tenth short of the last tick, where the cube is
    // held: a reader's count finds nothing within 4 m there). One that comes nearer than 2.5 m lets go half a metre further out on
    // its own side, and again, until its arc is clear. Every draw is made as before and in the same order; the steps are the grid's own.)
    const LNE = []; { const q = new THREE.Vector3(); for (let s = 0; s <= RL0; s += 0.2) { rp.posAtDist(s, q); if (q.z > CREST_Z + 40) break; LNE.push(q.x, q.y, q.z); } }   // (z rises all the way up the back)
    const NLE = LNE.length / 3, lneAt = (z) => { let lo = 0, hi = NLE - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (LNE[m * 3 + 2] <= z) lo = m; else hi = m; } return lo; };
    const leapClear = (x, y, z, vy, vz, g, ticks) => {
      const cx = x + 0.25, i0 = Math.max(lneAt(z - 3.5), 0), i1 = Math.min(lneAt(z + 0.25 + vz * ticks * 0.5 + 3.5) + 1, NLE - 1);
      let near = false; for (let j = i0; j <= i1 && !near; j++) near = Math.abs(LNE[j * 3] - cx) < 2.75;
      if (!near) return true;   // the course never comes within reach of the plane the cube flies in
      for (let e = 0; e <= ticks; e += 0.1) { const cy = y + 0.25 + (vy * e - 0.5 * g * e * e) * 0.5, cz = z + 0.25 + vz * e * 0.5, k = lneAt(cz);
        for (let j = Math.max(k - 30, 0), j1 = Math.min(k + 30, NLE - 1); j <= j1; j++) { const ax = Math.max(Math.abs(LNE[j * 3] - cx) - 0.25, 0), ay = Math.max(Math.abs(LNE[j * 3 + 1] - cy) - 0.25, 0), az = Math.max(Math.abs(LNE[j * 3 + 2] - cz) - 0.25, 0); if (ax * ax + ay * ay + az * az < 6.25) return false; } }
      return true; };
    const nLeap = Math.round(420 * detail * Math.min(1.2, windK)), leap = style.makeThrown(nLeap + 1, { faces: 4 }), lr2 = rng.fork('leap');
    for (let i = 0; i < nLeap; i++) {
      const rank = lr2.int(0, Math.floor((CREST_Z - 8 - TOE_Z) / 6) - 1), z = Math.floor(TOE_Z + 6 + rank * 6), lx = lineX(z);
      let x = lr2.range(-34, 34); if (Math.abs(x) < 3.5) x = x < 0 ? x - 3.5 : x + 3.5; const side = x < 0 ? -1 : 1; x = Math.floor((lx + x) * 2) / 2;
      const vy = lr2.range(1.0, 2.0), vz = lr2.range(0.9, 1.3), g = 0.13, start = ((rank * 0.37) % 1) * 30 + lr2() * 2.5, more = lr2.int(4, 12);
      let y, life; const lay = () => { y = hAt(x + 0.25, z + 0.25); life = 2; while (life < 40 && y + (vy * life - 0.5 * g * life * life) * 0.5 > hAt(x + 0.25, z + 0.25 + vz * life * 0.5) + 0.25) life++; };
      for (lay(); Math.abs(x - lx) < 60 && !leapClear(x, y, z, vy, vz, g, life + more); lay()) x += 0.5 * side;
      leap.add(x, y, z, 0.5, i % 3 ? M.DUST : M.SAND, 0, vy, vz, start, life + more, 3, g);
      if (i % 100 === 99) await ctx.yield();
    }
    leap.commit(); hero.object.add(leap.mesh);

    // ---- (fix 6) the sand leaving the city: the brief's third rule. On the paving between the slip foot and the first arch
    // ranks of loose cubes stand every 6 m out from the course on either side and cross toward the nearer horn, a cell
    // a tick with a rest between hops (the sand tick, so they go on with the camera held), each with its violet bar; a
    // rank takes the place of the one before it as it loops, the innermost rising 2 m from the course, the outermost
    // running into the sand that still lies. The part lays the veil of sand before each rank (hero.state.sweep).
    const SW0 = 98, SW1 = 178, nSweep = rain ? 0 : Math.round(1100 * Math.max(0.75, detail)), sweep = style.makeThrown(nSweep + 1), sr = vr.fork('sweep');
    // (The wider arch. An arch whose piers THE CLEARANCE moved out by PO left free the cells its shafts stood on by the design:
    // in the piers' own two rows, the band from the old pier line, 7 m either side of the arch's axis, to the new, 7 + PO (as
    // far as the old shaft's 2 m reached). A cube whose run crosses that band was not swept while the piers stood there. It
    // takes its dice from a stream of its own (the world seed and the name 'sweep-wide'), so the stream 'sweep' deals to the
    // cubes it always dealt to, the same values in the same order.)
    const srw = ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':sweep-wide'));
    const freed = (x, z) => ARCH.some(([az, jog, PO]) => PO > 0 && z >= az - 1 && z < az + 1 && [-7 - 2 + jog, 7 + jog].some((x0) => x >= Math.floor(x0) && x < Math.ceil(x0 + 2)));
    for (let zi = 0; zi < SW1 - SW0 && sweep.count < nSweep; zi++) {
      const z = SW0 + zi, lx = Math.floor(lineX(z + 0.25) * 2) / 2;       // a cube every metre along a rank
      for (const sd of [-1, 1]) for (let j = 0; j < 7; j++) {
        const x = lx + sd * (2 + 6 * j) - (sd < 0 ? 0.5 : 0); let ok = true;
        for (let k = 0; k <= 12 && ok; k += 2) { const xx = x + sd * k * 0.5 + 0.25; if (solid1(xx, z) > 0 || solid1(xx, z + 0.45) > 0 || Math.abs(hAt(xx, z + 0.25)) > 0.25 || Math.hypot(xx - DC.x, z - DC.z) < 17.5 || (Math.abs(xx - 4.5) < 2.3 && z > DC.z + 5)) ok = false; }
        if (!ok) continue;
        if ([0, 2, 4, 6, 8, 10, 12].some((k) => freed(x + sd * k * 0.5 + 0.25, z))) {   // one the wider arch freed: laid as the others are, its dice out of the stream 'sweep-wide'
          const sh = G.inShadow(x + sd * 3, 0.8, z + 0.25) || shadeAt(x + sd * 3, 0.6, z + 0.25) ? 1 : 0, r = srw();
          sweep.add(x, 0, z, 0.5, sh ? (r < 0.5 ? M.AVA : M.SAND) : (r < 0.7 ? M.SAND : M.DUST), sd, 0, 0, 0.12 * Math.sin(z * 0.4 + j), 12, 4, 0, sh); continue; }
        const sh = G.inShadow(x + sd * 3, 0.8, z + 0.25) || shadeAt(x + sd * 3, 0.6, z + 0.25) ? 1 : 0, r = sr();
        sweep.add(x, 0, z, 0.5, sh ? (r < 0.5 ? M.AVA : M.SAND) : (r < 0.7 ? M.SAND : M.DUST), sd, 0, 0, 0.12 * Math.sin(z * 0.4 + j), 12, 4, 0, sh);
      }
      if (zi % 4 === 3) await ctx.yield();
    }
    sweep.commit(); sweep.mesh.visible = false; hero.object.add(sweep.mesh);
    if (!rain) hero.state.sweep = { x: (z) => Math.floor(lineX(z) * 2) / 2, z0: SW0, z1: SW1 };
    updaters.push(() => { sweep.mesh.visible = !rain && eyeW.z > 70; });      // (from the crest a half-metre cube would be a speck)

    // ---- chimney columns: pale cubes rising a cell per tick from three roofs; and the gale's long banner off the crest
    const smoke = style.makeThrown(36 + (wind === 'gale' ? Math.round(260 * detail) : 0));
    for (const k of [3, 17, 31]) {
      const [rx, rh, rz, rw, rd] = roofs[k], cx = rx + 2, cz = rz + rd - 2;
      for (let j = 0; j < 12; j++) smoke.add(cx, rh + 1.5, cz, 1, M.DUST, 0, 1, j % 3 === 0 ? 0.5 : 0.25, j * 1.5, 18, 1, 0);
    }
    if (wind === 'gale') for (let i = 0, n = Math.round(260 * detail); i < n; i++) {
      let x = vr2.range(-160, 160) * 0.7; if (Math.abs(x) < 26) x = (x < 0 ? -1 : 1) * (26 + Math.abs(x));
      const c = A.crestAt(x), life = vr2.range(26, 44);
      smoke.add(Math.floor(x / 2) * 2, Math.floor(c.y / 2) * 2, Math.floor(c.z / 2) * 2, 2, M.DUST, 0, vr2.range(0.35, 0.6), vr2.range(0.9, 1.3), vr2() * life, life, 3, 0.012);
    }
    smoke.commit(); hero.object.add(smoke.mesh);

    // ---- the rare event, the rain: one square cloud stands over the hollow and lets fall turquoise cubes, a cell per tick;
    // the pool is full at once, and barley comes up one cube high across the bared floor, row by row, ahead of the prow.
    const nRain = rain ? Math.round(380 * detail) : 0, nBar = rain ? Math.round(760 * detail) : 0;
    const barClock = { value: 0 };
    const wet = style.makeThrown(nRain + 1, { faces: 4 }), barley = style.makeThrown(nBar + 1, { clock: barClock, faces: 4 });
    if (rain) {
      const rc = mkActor([[0, 0, 0, 128, 16, 112, M.WHITE], [16, 16, 16, 96, 16, 64, M.WHITE], [48, 32, 32, 48, 16, 32, M.WHITE], [-16, -16, 32, 32, 16, 48, M.WHITE]]);
      place(rc, -48, 96, 136, 0);
      for (let i = 0; i < nRain; i++) {
        let x = Math.floor(vr2.range(-44, 76) / 2) * 2; const z = Math.floor(vr2.range(140, 244) / 2) * 2;
        if (x > -22 && x < 7) x += x < -8 ? -16 : 16;               // a dry lane over the course
        wet.add(x, 94, z, 2, M.WATER, 0, -1, 0, vr2() * 47, 47, 3, 0);   // (two-metre cubes: from the crest a one-metre drop was a speck)
      }
      let nb = 0;
      for (let z = 102; z < 230 && nb < nBar; z += 2) {
        for (let x = -45; x < 46 && nb < nBar; x += 2) {
          if (((x + z) >> 1) & 1 || solidAt(x + 0.5, z + 0.5) > 0 || Math.abs(x - lineX(z)) < 2) continue;
          const h = hAt(x + 0.5, z + 0.5); if (h < 0 || h > 0.6 || Math.hypot(x - DC.x, z - DC.z) < 18) continue;
          barley.add(x, h - 0.5, z, 1, M.PALM, 0, 0, 0, Math.floor(startTick(z - 34) + Math.abs(x - lineX(z)) * 0.5), 1e6, 2, 0, shadeAt(x + 0.5, h + 0.6, z + 0.5)); nb++;
        }
        if ((z & 15) === 0) await ctx.yield();
      }
      updaters.push((dt, time, camera, u, tick, tJ) => { barClock.value = Math.floor(tJ * 6); });
    }
    wet.commit(); barley.commit(); wet.mesh.visible = barley.mesh.visible = rain; hero.object.add(wet.mesh, barley.mesh);


    // (fix 8) over the upper slip face the gaze dips from the arcade to the face below, to the point of the V which the yacht, abreast of it out on the starboard flank, has
    // set off; it is back on the town before we take the sand again
    const _rp = new THREE.Vector3(), revealPoi = (time, u) => { path.pointAt(u, _rp); const k = sm(CREST_Z + 12, CREST_Z + 34, _rp.z) * (1 - sm(50, 72, _rp.z)); return _rp.set(6 - 3 * k, 18 - 16 * k, 205 - 55 * k); };
    const basePois = [
        { at: stairPoi, from: KU[1] - 0.02, to: zToU(CREST_Z - 62), weight: 0.5, fade: 0.2 },
        // the last of the climb looks up at the knife edge, where the herd stands in profile and the yacht leaps
        { at: crestPoi, from: zToU(CREST_Z - 112), to: KU[2] - 0.022, weight: 0.65, fade: 0.3 },   // (fix 7: from the middle of the back, and a little to port of the course: the mountain's edge across the upper frame, the sail off the centre line)
        // over the knife edge the gaze goes out to the arcade and the ring, not down the face: the horizon keeps a fifth of the frame
        { at: revealPoi, from: KU[2] - 0.05, to: KU[2] + 0.86 * (KU[3] - KU[2]), weight: 0.85, fade: 0.2 },
        { at: [A.dome.top.x, 16, A.dome.top.z], from: KU[2] + 0.6 * (KU[3] - KU[2]), to: KU[3] - 0.02, weight: 0.4 },
        { at: [A.dome.top.x - 4, 22, A.dome.top.z + 4], from: KU[3] - 0.1, to: zToU(101), weight: 0.5, fade: 0.2 },
        // then down the street: washing overhead, the first arch at its end; the caravan as it crosses; the pool; the ring
        { at: [-22, 10, 150], from: zToU(97), to: zToU(138), weight: 0.5, fade: 0.25 },
        // (fix 7) beside the dome the gaze goes to the sunlit colonnade, lifts to take the first arch whole over the caravan
        // crossing under it, leans to port through the arcade and is back on the ring before the pool (cityPoi)
        { at: cityPoi, from: zToU(134), to: zToU(226), weight: 0.85, fade: 0.18 },
        { at: [0, 0, 262], from: zToU(222), to: zToU(250), weight: 0.45, fade: 0.3 },      // the pool under the gate: the gaze dips to the water and its reflections
        { at: [0, RING_Y, WALL_Z], from: zToU(246), to: 1, weight: 0.5, fade: 0.3 },
    ];
    // (fix 8) THE STEADY CAMERA PAST THE DOME. The engine's steady camera looks three times further down the route and takes points of
    // interest at 0.35 of their weight, so through the bow round the dome it looked along the route into the dome's flank. A world
    // cannot ask which camera is flying; but the engine blends each point in turn (gaze = gaze * (1 - w) + point * w, w = weight, or
    // 0.35 * weight when steady). So two last points do it: `steadyA` with weight 1 / 0.35 (the steady camera then looks exactly at it)
    // and `ordB` with weight 1, which puts the ordinary camera back exactly where the points above had it (gazeOf repeats the engine's
    // sum) and gives the steady one 0.65 of steadyA and 0.35 of that. steadyA is solved so the steady camera's gaze is the ordinary
    // camera's own from the slip foot (the dome whole, the flock over it) through the market street and beside the dome, eased in over u 0.475 to 0.52 and out over 0.72 to 0.775. Outside that window neither acts.
    const bellF = ctx.core.bell, ssF = ctx.core.smoothstep, _g0 = new THREE.Vector3(), _g1 = new THREE.Vector3(), _gb = new THREE.Vector3(), _gs = new THREE.Vector3(), _ga = new THREE.Vector3(), _gB = new THREE.Vector3();
    const gazeOf = (u, calm, time, out) => {            // src/core/engine.js _pose, before the two points below
      const d = u * FL, ahead = Math.min(26 * (1 + 2.4 * calm), Math.max(26, FL * 0.22));
      path.posAtDist(d, _g0); path.posAtDist(d + ahead, out); out.sub(_g0).normalize();
      if (calm > 0) { out.y *= 1 - 0.45 * calm; out.normalize(); }
      const guard = ssF(0, 0.04, u) * (1 - ssF(0.93, 0.985, u));
      for (const poi of basePois) {
        const w = bellF(u, poi.from ?? 0, poi.to ?? 1, poi.fade ?? 0.3) * (poi.weight ?? 0.5) * guard * (1 - 0.65 * calm); if (w <= 0.001) continue;
        const at = typeof poi.at === 'function' ? poi.at(time, u) : poi.at; if (at.isVector3) _g1.copy(at); else _g1.set(at[0], at[1], at[2]);
        _g1.sub(_g0).normalize(); out.multiplyScalar(1 - w).addScaledVector(_g1, w).normalize();
      }
      return out;
    };
    // the flock's places in the air (see the birds): laid out on the picture the ordinary camera has from the slip foot (u 0.52, 640 by 360,
    // focal length 300 px): a loose brick pattern of places 36 by 25 px over the cap, the flank and the sky to starboard of the dome, each
    // jittered, one in nine left empty; a place whose ray meets the dome is a bird a few metres before it, the others fly 48 to 64 m out
    {
      const f = gazeOf(0.52, 0, 0, new THREE.Vector3()).clone(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(r, f), dir = new THREE.Vector3(), flockAt = [];
      for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) {
        const px = 150 + col * 36 + (row % 2) * 18 + fb.range(-6, 6), py = 16 + row * 25 + fb.range(-5, 5), keep = fb() > 0.11, dsky = 48 + 16 * fb(), dfr = 2.5 + 3 * fb();
        if (!keep || (px > 300 && py > 112)) continue;
        dir.copy(f).addScaledVector(r, (px - 320) / 299.6).addScaledVector(up, (180 - py) / 299.6).normalize();
        let d = dsky; for (let t = 26; t < 70; t += 1) if (inDome(E52.x + dir.x * t, E52.y + dir.y * t, E52.z + dir.z * t)) { d = t - dfr; break; }
        flockAt.push([half(E52.x + dir.x * d), half(E52.y + dir.y * d), half(E52.z + dir.z * d)]);
      }
      flockAt.forEach((p, i) => { const r0 = 2 + 9 * fb(), an = fb() * 6.283, ph = fb();
        birds.push({ a: mkActorL(birdParts(ph)), f: p, r: [half(DC.x + Math.cos(an) * r0), half(DT.y + 1.5 - 14 * (1 - Math.sqrt(Math.max(0, 1 - r0 * r0 / 225)))), half(DC.z + Math.sin(an) * r0)], d: 1.2 * fb(), i }); });
      actDirty = true;
    }
    const ST0 = 0.47, ST1 = 0.78;
    const steadyA = (time, u) => {
      gazeOf(u, 0, time, _gb); gazeOf(u, 1, time, _gs); const k = sm(0.475, 0.52, u) * (1 - sm(0.72, 0.775, u));
      _gs.lerp(_gb, k).normalize();                      // what the steady camera is to look along
      const c = _gs.dot(_gb), sc = 0.35 * c + Math.sqrt(0.1225 * c * c + 0.3);
      _ga.copy(_gs).multiplyScalar(sc).addScaledVector(_gb, -0.35).multiplyScalar(1 / 0.65).normalize();
      path.pointAt(u, _g0); return _ga.multiplyScalar(100).add(_g0);
    };
    const ordB = (time, u) => { gazeOf(u, 0, time, _gB); path.pointAt(u, _g0); return _gB.multiplyScalar(100).add(_g0); };
    const U_P1 = zToU(101), U_P2 = zToU(150), U_P3 = zToU(196);   // the pool's layers, by place (it brims as we come to its rim)
    return {
      scene, path, duration: DURATION, pace,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 26, sway: 0.2, bank: 0 },
      pois: [...basePois, { at: steadyA, from: ST0, to: ST1, weight: 1 / 0.35, fade: 1e-6 }, { at: ordB, from: ST0, to: ST1, weight: 1, fade: 1e-6 }],
      portal: { shape: 'circle', radius: 7, color: style.hex.whitewash, glow: 0.25, revealDistance: 300 },
      post: { exposure: EXPOSURE, bloom: { strength: 0, radius: 0, threshold: 9 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        const tJ0 = tOf(u);
        hero.setProgress(tJ0 / JOURNEY);
        hero.state.pool = rain ? 1 : u < U_P1 ? 0 : u < U_P2 ? 0.34 : u < U_P3 ? 0.67 : 1;   // a layer at a time; the last rises to the brim as we come over the rim
        clStep(tJ0);
        camera.getWorldPosition(eyeW); hero.state.ez = eyeW.z; hero.state.eh = Math.max(0, eyeW.y); hero.state.ex = eyeW.x;
        style.update(dt, time, camera);
        hero.update(dt, time, camera);
        const tick = style.tick, tJ = tJ0;
        camera.getWorldPosition(eyeW);
        dynRowsOk = false;                                 // the updaters move the caravan's boxes: its rows are marked afresh when they have
        for (const f of updaters) f(dt, time, camera, u, tick, tJ);
        if (actDirty) { act.commit(); actDirty = false; }
      },
      dispose() { hero.dispose(); style.table.dispose(); },
    };
  },
};
